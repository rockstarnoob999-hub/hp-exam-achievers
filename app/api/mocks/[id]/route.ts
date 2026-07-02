import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: mock } = await supabaseAdmin
    .from("mocks")
    .select("teacher_id")
    .eq("id", params.id)
    .single();
  if (!mock || mock.teacher_id !== session.id) {
    return NextResponse.json({ error: "Mock not found" }, { status: 404 });
  }

  const body = await req.json();
  const update: Record<string, any> = {};

  if (body.title !== undefined) update.title = body.title;
  if (body.exam_name !== undefined) update.exam_name = body.exam_name;
  if (body.duration_minutes !== undefined) update.duration_minutes = body.duration_minutes;
  if (body.negative_marking !== undefined) update.negative_marking = body.negative_marking;
  if (body.passing_marks !== undefined) update.passing_marks = body.passing_marks;
  if (body.access_password !== undefined) update.access_password = body.access_password;
  if (body.instructions !== undefined) update.instructions = body.instructions;
  if (body.show_result_immediately !== undefined) update.show_result_immediately = body.show_result_immediately;
  if (body.show_correct_answers !== undefined) update.show_correct_answers = body.show_correct_answers;
  if (body.leaderboard_enabled !== undefined) update.leaderboard_enabled = body.leaderboard_enabled;

  const { data, error } = await supabaseAdmin
    .from("mocks")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mock: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("mocks")
    .delete()
    .eq("id", params.id)
    .eq("teacher_id", session.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}