import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const { id, questionId } = await params;

  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: mock } = await supabaseAdmin
    .from("mocks")
    .select("teacher_id")
    .eq("id", id)
    .single();

  if (!mock || mock.teacher_id !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
    marks,
    explanation,
  } = body;

  const { data, error } = await supabaseAdmin
    .from("questions")
    .update({
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      marks,
      explanation,
    })
    .eq("id", questionId)
    .eq("mock_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ question: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const { id, questionId } = await params;

  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: mock } = await supabaseAdmin
    .from("mocks")
    .select("teacher_id")
    .eq("id", id)
    .single();

  if (!mock || mock.teacher_id !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("questions")
    .delete()
    .eq("id", questionId)
    .eq("mock_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}