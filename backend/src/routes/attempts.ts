import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

// POST /api/attempts/start - Start a new attempt
router.post('/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { examId, password } = req.body;
    
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!studentProfile) return res.status(403).json({ error: 'Student profile not found' });
    
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    // Check assignment
    const assignment = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId, studentId: studentProfile.id } },
    });
    if (!assignment || !assignment.isActive) {
      return res.status(403).json({ error: 'You are not assigned to this exam' });
    }
    
    // Check attempts
    if (assignment.attemptsUsed >= assignment.attemptsAllowed) {
      return res.status(403).json({ error: 'You have exhausted all attempts. Contact your teacher.' });
    }
    
    // Check password
    if (exam.isPasswordProtected && exam.password !== password) {
      return res.status(403).json({ error: 'Incorrect exam password' });
    }
    
    // Check if already in progress
    const inProgress = await prisma.examAttempt.findFirst({
      where: { examId, studentId: studentProfile.id, status: 'IN_PROGRESS' },
    });
    if (inProgress) {
      // Return existing attempt with questions
      return res.json({ attemptId: inProgress.id, resumed: true });
    }
    
    // Check exam window
    const now = new Date();
    if (exam.startDate && now < exam.startDate) {
      return res.status(403).json({ error: 'Exam has not started yet' });
    }
    if (exam.endDate && now > exam.endDate) {
      return res.status(403).json({ error: 'Exam has ended' });
    }
    
    // Get questions
    let questions = await prisma.examQuestion.findMany({
      where: { examId },
      include: { question: true },
      orderBy: { order: 'asc' },
    });
    
    if (exam.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }
    
    // Create attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        studentId: studentProfile.id,
        attemptNumber: assignment.attemptsUsed + 1,
        status: 'IN_PROGRESS',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    // Increment attempts used
    await prisma.examAssignment.update({
      where: { examId_studentId: { examId, studentId: studentProfile.id } },
      data: { attemptsUsed: { increment: 1 } },
    });
    
    // Prepare questions for student (hide correct answers)
    const safeQuestions = questions.map(eq => {
      const q = eq.question;
      let options = q.options as any[];
      
      if (exam.randomizeOptions && options) {
        options = options.sort(() => Math.random() - 0.5);
      }
      
      return {
        id: q.id,
        examQuestionId: eq.id,
        type: q.type,
        content: q.content,
        imageUrl: q.imageUrl,
        subject: q.subject,
        marks: eq.marks,
        negMarks: eq.negMarks,
        options: options?.map(o => ({ id: o.id, text: o.text, imageUrl: o.imageUrl })),
        matchPairs: q.type === 'MATCH_FOLLOWING' ? q.matchPairs : null,
      };
    });
    
    return res.json({
      attemptId: attempt.id,
      examId,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      questions: safeQuestions,
      startedAt: attempt.startedAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start attempt' });
  }
});

// PATCH /api/attempts/:id/save - Auto-save answers
router.patch('/:id/save', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { answers, markedReview } = req.body;
    
    await prisma.examAttempt.update({
      where: { id: req.params.id },
      data: {
        answers: answers || {},
        markedReview: markedReview || [],
      },
    });
    
    return res.json({ saved: true, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

// PATCH /api/attempts/:id/security - Record security events
router.patch('/:id/security', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { tabSwitch, fullscreenExit } = req.body;
    
    const data: any = {};
    if (tabSwitch) data.tabSwitches = { increment: 1 };
    if (fullscreenExit) data.fullscreenExits = { increment: 1 };
    
    await prisma.examAttempt.update({ where: { id: req.params.id }, data });
    return res.json({ recorded: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record event' });
  }
});

// POST /api/attempts/:id/submit - Submit attempt
router.post('/:id/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        exam: {
          include: {
            questions: {
              include: { question: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        student: true,
      },
    });
    
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Attempt already submitted' });
    
    const answers = attempt.answers as Record<string, any>;
    const exam = attempt.exam;
    
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const questionResults = [];
    
    for (const eq of exam.questions) {
      const q = eq.question;
      const answer = answers[q.id];
      const options = q.options as any[];
      
      if (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
        skippedCount++;
        questionResults.push({
          attemptId: attempt.id,
          questionId: q.id,
          isSkipped: true,
          isCorrect: false,
          marksObtained: 0,
        });
        continue;
      }
      
      let isCorrect = false;
      
      if (q.type === 'SINGLE_CORRECT' || q.type === 'TRUE_FALSE') {
        const correctOption = options?.find(o => o.isCorrect);
        isCorrect = correctOption?.id === answer;
      } else if (q.type === 'MULTIPLE_CORRECT') {
        const correctIds = options?.filter(o => o.isCorrect).map(o => o.id).sort();
        const givenIds = (Array.isArray(answer) ? answer : [answer]).sort();
        isCorrect = JSON.stringify(correctIds) === JSON.stringify(givenIds);
      } else if (q.type === 'INTEGER') {
        isCorrect = String(q.correctAnswer) === String(answer);
      }
      
      const marksObtained = isCorrect ? eq.marks : (exam.negativeMarking ? -eq.negMarks : 0);
      score += marksObtained;
      if (isCorrect) correctCount++;
      else { wrongCount++; }
      
      questionResults.push({
        attemptId: attempt.id,
        questionId: q.id,
        answer: typeof answer === 'object' ? JSON.stringify(answer) : String(answer),
        isCorrect,
        isSkipped: false,
        marksObtained,
      });
    }
    
    const timeTaken = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
    const percentage = (score / exam.totalMarks) * 100;
    const accuracy = exam.questions.length > 0 ? (correctCount / (correctCount + wrongCount)) * 100 : 0;
    
    // Get rank
    const betterAttempts = await prisma.examAttempt.count({
      where: {
        examId: exam.id,
        status: { not: 'IN_PROGRESS' },
        score: { gt: score },
      },
    });
    const rank = betterAttempts + 1;
    
    // Create question results
    await prisma.questionResult.createMany({ data: questionResults });
    
    // Update attempt
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status: req.body.autoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED',
        submittedAt: new Date(),
        timeTaken,
        score,
        totalMarks: exam.totalMarks,
        correctCount,
        wrongCount,
        skippedCount,
        accuracy,
        percentage,
        rank,
      },
    });
    
    // Update exam stats
    const allAttempts = await prisma.examAttempt.findMany({
      where: { examId: exam.id, status: { not: 'IN_PROGRESS' } },
      select: { score: true },
    });
    
    const scores = allAttempts.map(a => a.score || 0);
    await prisma.exam.update({
      where: { id: exam.id },
      data: {
        totalAttempts: { increment: 1 },
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        highestScore: Math.max(...scores),
      },
    });
    
    // Auto-generate certificate if passed
    if (exam.passingMarks && score >= exam.passingMarks) {
      const studentUser = await prisma.user.findUnique({ where: { id: attempt.student.userId } });
      await prisma.certificate.create({
        data: {
          attemptId: attempt.id,
          studentName: studentUser?.name || 'Student',
          examTitle: exam.title,
          score,
          percentage,
        },
      });
    }
    
    const result = {
      attemptId: attempt.id,
      score,
      totalMarks: exam.totalMarks,
      correctCount,
      wrongCount,
      skippedCount,
      accuracy: Math.round(accuracy * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      rank,
      timeTaken,
      passed: exam.passingMarks ? score >= exam.passingMarks : null,
    };
    
    if (exam.showResultImmediately) {
      return res.json(result);
    }
    
    return res.json({ submitted: true, message: 'Exam submitted successfully. Results will be available soon.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

// GET /api/attempts/:id/result - Get detailed result
router.get('/:id/result', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        exam: {
          include: {
            questions: {
              include: { question: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        questionResults: true,
        student: { include: { user: { select: { name: true } } } },
      },
    });
    
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    
    // Subject-wise analysis
    const subjectMap: Record<string, { correct: number; wrong: number; skipped: number; total: number }> = {};
    
    for (const qr of attempt.questionResults) {
      const eq = attempt.exam.questions.find(eq => eq.questionId === qr.questionId);
      if (!eq) continue;
      const subject = eq.question.subject;
      
      if (!subjectMap[subject]) subjectMap[subject] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
      subjectMap[subject].total++;
      if (qr.isSkipped) subjectMap[subject].skipped++;
      else if (qr.isCorrect) subjectMap[subject].correct++;
      else subjectMap[subject].wrong++;
    }
    
    const certificate = await prisma.certificate.findUnique({ where: { attemptId: attempt.id } });
    
    return res.json({
      ...attempt,
      subjectAnalysis: subjectMap,
      certificate,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

// GET /api/attempts/student/history - Student's attempt history
router.get('/student/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!studentProfile) return res.status(404).json({ error: 'Student profile not found' });
    
    const attempts = await prisma.examAttempt.findMany({
      where: { studentId: studentProfile.id, status: { not: 'IN_PROGRESS' } },
      include: { exam: { select: { title: true, totalMarks: true, category: { select: { name: true } } } } },
      orderBy: { submittedAt: 'desc' },
    });
    
    return res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
