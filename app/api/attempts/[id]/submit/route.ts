import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST /api/attempts/[id]/submit -> scores the attempt. body: { auto?: boolean }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session || session.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: attempt } = await supabaseAdmin.from("attempts").select("*").eq("id", params.id).single();
  if (!attempt || attempt.student_id !== session.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ score: attempt.score, attempt }); // already submitted, idempotent
  }

  const { auto } = await req.json().catch(() => ({ auto: false }));

  const { data: mock } = await supabaseAdmin.from("mocks").select("*").eq("id", attempt.mock_id).single();
  const { data: questions } = await supabaseAdmin.from("questions").select("*").eq("mock_id", attempt.mock_id);
  const { data: answers } = await supabaseAdmin.from("answers").select("*").eq("attempt_id", params.id);

  const answerMap = new Map((answers || []).map((a: any) => [a.question_id, a]));

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  for (const q of questions || []) {
    const ans = answerMap.get(q.id);
    if (!ans || !ans.selected_option) {
      skipped++;
      continue;
    }
    const isCorrect = ans.selected_option === q.correct_option;
    await supabaseAdmin.from("answers").update({ is_correct: isCorrect }).eq("id", ans.id);

    if (isCorrect) {
      correct++;
      score += Number(q.marks);
    } else {
      wrong++;
      score -= Number(mock?.negative_marking || 0);
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from("attempts")
    .update({
      status: auto ? "auto_submitted" : "submitted",
      submitted_at: new Date().toISOString(),
      score: Math.max(0, Number(score.toFixed(2))),
      correct_count: correct,
      wrong_count: wrong,
      skipped_count: skipped,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attempt: updated });
}
