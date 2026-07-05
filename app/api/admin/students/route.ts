import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teacher_id = searchParams.get("teacher_id");

  let query = supabaseAdmin
    .from("students")
    .select("id, name, email, phone, attempts_allowed, is_disabled, teacher_id, created_at, teachers(name)")
    .order("created_at", { ascending: false });

  if (teacher_id) query = query.eq("teacher_id", teacher_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: data });
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { student_id, new_password, is_disabled, attempts_allowed } = await req.json();
  if (!student_id) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  const update: Record<string, any> = {};
  if (new_password) update.password_hash = await bcrypt.hash(new_password, 10);
  if (typeof is_disabled === "boolean") update.is_disabled = is_disabled;
  if (typeof attempts_allowed === "number") update.attempts_allowed = attempts_allowed;

  const { data, error } = await supabaseAdmin
    .from("students")
    .update(update)
    .eq("id", student_id)
    .select("id, name, email")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student: data });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { student_id } = await req.json();
  if (!student_id) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("students")
    .delete()
    .eq("id", student_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}