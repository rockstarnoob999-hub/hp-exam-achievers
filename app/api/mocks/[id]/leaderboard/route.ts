import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/mocks/[id]/leaderboard
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: mock } = await supabaseAdmin
    .from("mocks")
    .select("leaderboard_enabled")
    .eq("id", id)
    .single();

  if (!mock?.leaderboard_enabled) {
    return NextResponse.json(
      { error: "Leaderboard disabled" },
      { status: 403 }
    );
  }

  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("student_id, score, submitted_at, students(name)")
    .eq("mock_id", id)
    .eq("status", "submitted")
    .order("score", { ascending: false });

  const best = new Map<string, any>();

  (attempts || []).forEach((a: any) => {
    const existing = best.get(a.student_id);
    if (!existing || a.score > existing.score) {
      best.set(a.student_id, a);
    }
  });

  const leaderboard = [...best.values()]
    .sort((a, b) => b.score - a.score)
    .map((a, i) => ({
      rank: i + 1,
      name: a.students?.name,
      score: a.score,
      submitted_at: a.submitted_at,
    }));

  return NextResponse.json({ leaderboard });
}