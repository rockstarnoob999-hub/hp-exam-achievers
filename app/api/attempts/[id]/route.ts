import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// PUT /api/attempts/[id] -> autosave an answer. body: { question_id, selected_option, marked_for_review }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(req);
  if (!session || session.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: attempt } = await supabaseAdmin.from("attempts").select("*").eq("id", id).single();
  if (!attempt || attempt.student_id !== session.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "Attempt already submitted" }, { status: 400 });
  }

  const { question_id, selected_option, marked_for_review } = await req.json();
  if (!question_id) return NextResponse.json({ error: "question_id required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("answers")
    .upsert(
      {
        id,
        question_id,
        selected_option: selected_option ?? null,
        marked_for_review: !!marked_for_review,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "attempt_id,question_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
