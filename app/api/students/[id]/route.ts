import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("id, teacher_id")
    .eq("id", id)
    .single();

  if (!student || student.teacher_id !== session.id) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const body = await req.json();
  const update: Record<string, any> = {};

  if (typeof body.attempts_allowed === "number") {
    update.attempts_allowed = body.attempts_allowed;
  }

  if (typeof body.is_disabled === "boolean") {
    update.is_disabled = body.is_disabled;
  }

  if (typeof body.new_password === "string" && body.new_password.length > 0) {
    update.password_hash = await bcrypt.hash(body.new_password, 10);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .update(update)
    .eq("id", id)
    .select("id, name, email, phone, attempts_allowed, is_disabled")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ student: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = getSession(req);

  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("id, teacher_id")
    .eq("id", id)
    .single();

  if (!student || student.teacher_id !== session.id) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("students")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}