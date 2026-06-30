import { Router, Response } from 'express';
import { authenticate, requireTeacherOrAdmin, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

// GET /api/exams - List exams (teacher sees own, student sees assigned)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, category, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let where: any = {};
    
    if (req.user!.role === 'TEACHER') {
      where.creatorId = req.user!.id;
    } else if (req.user!.role === 'STUDENT') {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.id },
        include: { examAssignments: { where: { isActive: true }, select: { examId: true } } },
      });
      const assignedIds = studentProfile?.examAssignments.map(a => a.examId) || [];
      where.id = { in: assignedIds };
    }
    
    if (status) where.status = status;
    if (search) where.title = { contains: search as string, mode: 'insensitive' };
    
    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          category: true,
          creator: { select: { name: true } },
          _count: { select: { questions: true, attempts: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.exam.count({ where }),
    ]);
    
    return res.json({ exams, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// GET /api/exams/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        creator: { select: { id: true, name: true } },
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { attempts: true } },
      },
    });
    
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    // For students, check if exam is assigned
    if (req.user!.role === 'STUDENT') {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.id },
      });
      const assignment = await prisma.examAssignment.findUnique({
        where: { examId_studentId: { examId: exam.id, studentId: studentProfile!.id } },
      });
      if (!assignment || !assignment.isActive) {
        return res.status(403).json({ error: 'You are not assigned to this exam' });
      }
      // Hide correct answers if not enabled
      if (!exam.showCorrectAnswers) {
        exam.questions = exam.questions.map(q => ({
          ...q,
          question: { ...q.question, options: q.question.options, explanation: null },
        }));
      }
    }
    
    return res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// POST /api/exams - Create exam (teacher)
router.post('/', authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, examName, categoryId, description, instructions,
      duration, totalMarks, passingMarks, negativeMarking, negMarkValue,
      maxAttempts, startDate, endDate, randomizeQuestions, randomizeOptions,
      showResultImmediately, showCorrectAnswers, leaderboardEnabled,
      isPasswordProtected, password,
    } = req.body;
    
    if (!title || !duration || !totalMarks) {
      return res.status(400).json({ error: 'Title, duration, and total marks are required' });
    }
    
    const exam = await prisma.exam.create({
      data: {
        creatorId: req.user!.id,
        categoryId,
        title,
        examName,
        description,
        instructions,
        duration: parseInt(duration),
        totalMarks: parseFloat(totalMarks),
        passingMarks: passingMarks ? parseFloat(passingMarks) : null,
        negativeMarking: !!negativeMarking,
        negMarkValue: negMarkValue ? parseFloat(negMarkValue) : 0.25,
        maxAttempts: maxAttempts ? parseInt(maxAttempts) : 1,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        randomizeQuestions: !!randomizeQuestions,
        randomizeOptions: !!randomizeOptions,
        showResultImmediately: showResultImmediately !== false,
        showCorrectAnswers: showCorrectAnswers !== false,
        leaderboardEnabled: leaderboardEnabled !== false,
        isPasswordProtected: !!isPasswordProtected,
        password: isPasswordProtected ? password : null,
        status: 'DRAFT',
      },
    });
    
    return res.status(201).json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// PUT /api/exams/:id - Update exam
router.put('/:id', authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.creatorId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updated = await prisma.exam.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() },
    });
    
    return res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// DELETE /api/exams/:id
router.delete('/:id', authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.creatorId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.exam.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// POST /api/exams/:id/duplicate
router.post('/:id/duplicate', authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const original = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { questions: true },
    });
    if (!original) return res.status(404).json({ error: 'Exam not found' });
    
    const { id, createdAt, updatedAt, totalAttempts, avgScore, highestScore, ...examData } = original;
    
    const duplicate = await prisma.exam.create({
      data: {
        ...examData,
        title: `${original.title} (Copy)`,
        status: 'DRAFT',
        startDate: null,
        endDate: null,
        questions: {
          create: original.questions.map(q => ({
            questionId: q.questionId,
            order: q.order,
            marks: q.marks,
            negMarks: q.negMarks,
          })),
        },
      },
    });
    
    return res.status(201).json(duplicate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to duplicate exam' });
  }
});

// POST /api/exams/:id/publish
router.post('/:id/publish', authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    });
    return res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish exam' });
  }
});

// POST /api/exams/:id/questions - Add questions to exam
router.post('/:id/questions', authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { questionIds } = req.body; // array of {questionId, marks, negMarks}
    
    const existing = await prisma.examQuestion.findMany({
      where: { examId: req.params.id },
      select: { order: true },
      orderBy: { order: 'desc' },
    });
    
    let nextOrder = (existing[0]?.order || 0) + 1;
    
    const created = await prisma.examQuestion.createMany({
      data: questionIds.map((q: any) => ({
        examId: req.params.id,
        questionId: q.questionId,
        order: nextOrder++,
        marks: q.marks || 1,
        negMarks: q.negMarks || 0,
      })),
      skipDuplicates: true,
    });
    
    return res.json({ added: created.count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add questions' });
  }
});

// POST /api/exams/:id/assign - Assign exam to students
router.post('/:id/assign', authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { studentIds, attemptsAllowed = 1 } = req.body;
    
    await prisma.examAssignment.createMany({
      data: studentIds.map((studentId: string) => ({
        examId: req.params.id,
        studentId,
        attemptsAllowed,
      })),
      skipDuplicates: true,
    });
    
    return res.json({ message: `Exam assigned to ${studentIds.length} students` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign exam' });
  }
});

// GET /api/exams/:id/results - Get all results for an exam (teacher)
router.get('/:id/results', authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const attempts = await prisma.examAttempt.findMany({
      where: { examId: req.params.id, status: { not: 'IN_PROGRESS' } },
      include: {
        student: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { score: 'desc' },
    });
    
    return res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;
