import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/mocks/[id] -> mock details + questions (questions hide correct_option for students)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: mock, error } = await supabaseAdmin
    .from("mocks")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });

  const { data: questions } = await supabaseAdmin
    .from("questions")
    .select("*")
    .eq("mock_id", params.id)
    .order("order_index", { ascending: true });

  if (session.role === "student") {
    // verify assignment
    const { data: assigned } = await supabaseAdmin
      .from("mock_assignments")
      .select("id")
      .eq("mock_id", params.id)
      .eq("student_id", session.id)
      .single();
    if (!assigned) return NextResponse.json({ error: "Not assigned to this test" }, { status: 403 });

    const safeQuestions = (questions || []).map(({ correct_option, explanation, ...q }) => q);
    return NextResponse.json({ mock, questions: safeQuestions });
  }

  return NextResponse.json({ mock, questions: questions || [] });
}

// DELETE /api/mocks/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin.from("mocks").delete().eq("id", params.id).eq("teacher_id", session.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
