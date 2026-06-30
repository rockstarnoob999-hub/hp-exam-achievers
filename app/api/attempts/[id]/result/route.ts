import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/attempts/[id]/result -> full result for the student who owns it
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: attempt } = await supabaseAdmin.from("attempts").select("*").eq("id", params.id).single();
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role === "student" && attempt.student_id !== session.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: mock } = await supabaseAdmin.from("mocks").select("*").eq("id", attempt.mock_id).single();
  const { data: questions } = await supabaseAdmin
    .from("questions")
    .select("*")
    .eq("mock_id", attempt.mock_id)
    .order("order_index", { ascending: true });
  const { data: answers } = await supabaseAdmin.from("answers").select("*").eq("attempt_id", params.id);
  const answerMap = new Map((answers || []).map((a: any) => [a.question_id, a]));

  const review = (questions || []).map((q: any) => ({
    ...q,
    correct_option: mock?.show_correct_answers ? q.correct_option : undefined,
    explanation: mock?.show_correct_answers ? q.explanation : undefined,
    selected_option: answerMap.get(q.id)?.selected_option || null,
    is_correct: answerMap.get(q.id)?.is_correct ?? null,
  }));

  // Rank within this mock (best score per student)
  let rank: number | null = null;
  if (mock?.leaderboard_enabled) {
    const { data: allAttempts } = await supabaseAdmin
      .from("attempts")
      .select("student_id, score")
      .eq("mock_id", attempt.mock_id)
      .eq("status", "submitted");

    const best = new Map<string, number>();
    (allAttempts || []).forEach((a: any) => {
      const cur = best.get(a.student_id) ?? -Infinity;
      if (a.score > cur) best.set(a.student_id, a.score);
    });
    const sorted = [...best.entries()].sort((a, b) => b[1] - a[1]);
    const idx = sorted.findIndex(([sid]) => sid === attempt.student_id);
    rank = idx >= 0 ? idx + 1 : null;
  }

  return NextResponse.json({ attempt, mock, review, rank, totalStudents: undefined });
}
