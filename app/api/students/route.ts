import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/students -> list teacher's students
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, name, email, phone, attempts_allowed, is_disabled, created_at")
    .eq("teacher_id", session.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: data });
}

// POST /api/students -> create a student. body: { name, email, phone, password, attempts_allowed, mock_ids: [] }
// IMPORTANT: each student gets their OWN password, set by the teacher (e.g. HP-R001).
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, password, attempts_allowed, mock_ids } = body;

  if (!name || !password || (!email && !phone)) {
    return NextResponse.json({ error: "Name, password, and email or phone are required" }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data: student, error } = await supabaseAdmin
    .from("students")
    .insert({
      teacher_id: session.id,
      name, email: email || null, phone: phone || null,
      password_hash,
      attempts_allowed: attempts_allowed || 3,
    })
    .select("id, name, email, phone, attempts_allowed")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Assign to mocks if provided
  if (Array.isArray(mock_ids) && mock_ids.length > 0) {
    const rows = mock_ids.map((mock_id: string) => ({ mock_id, student_id: student.id }));
    await supabaseAdmin.from("mock_assignments").insert(rows);
  }

  return NextResponse.json({ student });
}
