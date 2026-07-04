import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/exam-patterns -> list all patterns for this teacher
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("exam_patterns")
    .select("*, pattern_sections(*)")
    .eq("teacher_id", session.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ patterns: data });
}

// POST /api/exam-patterns -> create a new pattern with sections
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, duration_minutes, negative_marking, sections } = body;

  if (!name || !sections || sections.length === 0) {
    return NextResponse.json({ error: "Name and at least one section are required" }, { status: 400 });
  }

  const { data: pattern, error: patternError } = await supabaseAdmin
    .from("exam_patterns")
    .insert({
      teacher_id: session.id,
      name,
      duration_minutes: duration_minutes || 120,
      negative_marking: negative_marking || 0,
    })
    .select()
    .single();

  if (patternError) return NextResponse.json({ error: patternError.message }, { status: 500 });

  const sectionRows = sections.map((s: any, i: number) => ({
    pattern_id: pattern.id,
    subject: s.subject,
    question_count: s.question_count,
    marks_per_question: s.marks_per_question || 1,
    order_index: i,
  }));

  const { error: sectionsError } = await supabaseAdmin
    .from("pattern_sections")
    .insert(sectionRows);

  if (sectionsError) return NextResponse.json({ error: sectionsError.message }, { status: 500 });
  return NextResponse.json({ pattern });
}