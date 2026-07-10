import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "teacher") {
    const { data, error } = await supabaseAdmin
      .from("mocks")
      .select("*")
      .eq("teacher_id", session.id)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ mocks: data });
  }

  if (session.role === "student") {
    // Get student record to find attempts_allowed
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("attempts_allowed")
      .eq("id", session.id)
      .single();

    // Get assigned mocks
    const { data: assignments, error } = await supabaseAdmin
      .from("mock_assignments")
      .select("mocks(*)")
      .eq("student_id", session.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mocks = (assignments || [])
      .map((d: any) => d.mocks)
      .filter(Boolean)
      .map((m: any) => ({
        ...m,
        attempts_allowed: student?.attempts_allowed ?? 3,
      }));

    return NextResponse.json({ mocks });
  }

  return NextResponse.json({ mocks: [] });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title, exam_name, description, duration_minutes, negative_marking,
    passing_marks, start_date, end_date, instructions,
    randomize_questions, show_result_immediately, show_correct_answers,
    leaderboard_enabled, access_password,
  } = body;

  if (!title || !duration_minutes || !access_password) {
    return NextResponse.json({ error: "Title, duration, and access password are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("mocks")
    .insert({
      teacher_id: session.id,
      title, exam_name, description,
      duration_minutes, negative_marking: negative_marking || 0,
      passing_marks: passing_marks || 0,
      start_date: start_date || null, end_date: end_date || null,
      instructions,
      randomize_questions: !!randomize_questions,
      show_result_immediately: show_result_immediately !== false,
      show_correct_answers: show_correct_answers !== false,
      leaderboard_enabled: leaderboard_enabled !== false,
      access_password,
      is_published: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mock: data });
}