import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST /api/exam-patterns/[id]/generate -> generate a mock from a pattern
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, access_password, start_date, end_date, instructions } = body;

  if (!title || !access_password) {
    return NextResponse.json(
      { error: "Title and access password are required" },
      { status: 400 }
    );
  }

  // Get pattern with sections
  const { data: pattern, error: patternError } = await supabaseAdmin
    .from("exam_patterns")
    .select("*, pattern_sections(*)")
    .eq("id", id)
    .eq("teacher_id", session.id)
    .single();

  if (patternError || !pattern) {
    return NextResponse.json(
      { error: "Pattern not found" },
      { status: 404 }
    );
  }

  const sections = (pattern.pattern_sections || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );

  if (sections.length === 0) {
    return NextResponse.json(
      { error: "Pattern has no sections" },
      { status: 400 }
    );
  }

  // Calculate total marks
  const totalMarks = sections.reduce(
    (sum: number, s: any) => sum + s.question_count * s.marks_per_question,
    0
  );

  // Create the mock
  const { data: mock, error: mockError } = await supabaseAdmin
    .from("mocks")
    .insert({
      teacher_id: session.id,
      title,
      exam_name: pattern.name,
      duration_minutes: pattern.duration_minutes,
      negative_marking: pattern.negative_marking,
      total_marks: totalMarks,
      access_password,
      instructions: instructions || null,
      start_date: start_date || null,
      end_date: end_date || null,
      is_published: true,
      randomize_questions: true,
      show_result_immediately: true,
      show_correct_answers: true,
      leaderboard_enabled: true,
    })
    .select()
    .single();

  if (mockError) {
    return NextResponse.json(
      { error: mockError.message },
      { status: 500 }
    );
  }

  // For each section pick random questions from question bank
  let orderIndex = 0;
  const allInsertedQuestions: any[] = [];
  const warnings: string[] = [];

  for (const section of sections) {
    const { data: available } = await supabaseAdmin
      .from("question_bank")
      .select("*")
      .eq("teacher_id", session.id)
      .eq("subject", section.subject);

    const pool = available || [];

    if (pool.length === 0) {
      warnings.push(
        "No questions found for subject: " + section.subject + ". Skipped."
      );
      continue;
    }

    if (pool.length < section.question_count) {
      warnings.push(
        "Only " +
          pool.length +
          " questions available for " +
          section.subject +
          " (needed " +
          section.question_count +
          "). Using all available."
      );
    }

    // Shuffle and pick
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(
      0,
      Math.min(section.question_count, pool.length)
    );

    const questionRows = picked.map((q: any) => ({
      mock_id: mock.id,
      question_text: q.question_text,
      question_text_hi: q.question_text_hi || null,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_a_hi: q.option_a_hi || null,
      option_b_hi: q.option_b_hi || null,
      option_c_hi: q.option_c_hi || null,
      option_d_hi: q.option_d_hi || null,
      correct_option: q.correct_option,
      marks: section.marks_per_question,
      explanation: q.explanation || null,
      order_index: orderIndex++,
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("questions")
      .insert(questionRows)
      .select();

    if (insertError) {
      warnings.push(
        "Error inserting questions for " +
          section.subject +
          ": " +
          insertError.message
      );
    } else {
      allInsertedQuestions.push(...(inserted || []));
    }
  }

  // Update total marks based on actual questions inserted
  const actualTotal = allInsertedQuestions.reduce(
    (sum, q) => sum + Number(q.marks),
    0
  );

  await supabaseAdmin
    .from("mocks")
    .update({ total_marks: actualTotal })
    .eq("id", mock.id);

  return NextResponse.json({
    mock,
    questions_added: allInsertedQuestions.length,
    warnings,
  });
}