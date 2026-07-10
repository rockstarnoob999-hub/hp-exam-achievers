import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/mocks/[id]/assign -> get all students with assignment status
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: mock } = await supabaseAdmin
    .from("mocks")
    .select("id, title, teacher_id")
    .eq("id", id)
    .eq("teacher_id", session.id)
    .single();

  if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });

  const [studentsRes, assignmentsRes] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id, name, email, phone, attempts_allowed, is_disabled")
      .eq("teacher_id", session.id)
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("mock_assignments")
      .select("student_id")
      .eq("mock_id", id),
  ]);

  const assignedIds = new Set((assignmentsRes.data || []).map((a: any) => a.student_id));

  const students = (studentsRes.data || []).map((s: any) => ({
    ...s,
    assigned: assignedIds.has(s.id),
  }));

  return NextResponse.json({ students, mock });
}

// POST /api/mocks/[id]/assign -> assign or unassign students
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { student_ids, action } = await req.json();

  if (!student_ids || !Array.isArray(student_ids)) {
    return NextResponse.json({ error: "student_ids array required" }, { status: 400 });
  }

  const { data: mock } = await supabaseAdmin
    .from("mocks")
    .select("id, teacher_id")
    .eq("id", id)
    .eq("teacher_id", session.id)
    .single();

  if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });

  if (action === "unassign") {
    const { error } = await supabaseAdmin
      .from("mock_assignments")
      .delete()
      .eq("mock_id", id)
      .in("student_id", student_ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "unassigned", count: student_ids.length });
  }

  // Assign - skip already assigned
  const { data: existing } = await supabaseAdmin
    .from("mock_assignments")
    .select("student_id")
    .eq("mock_id", id)
    .in("student_id", student_ids);

  const existingIds = new Set((existing || []).map((e: any) => e.student_id));
  const newIds = student_ids.filter((sid: string) => !existingIds.has(sid));

  if (newIds.length > 0) {
    const rows = newIds.map((student_id: string) => ({ mock_id: id, student_id }));
    const { error } = await supabaseAdmin.from("mock_assignments").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: "assigned", count: newIds.length, skipped: student_ids.length - newIds.length });
}