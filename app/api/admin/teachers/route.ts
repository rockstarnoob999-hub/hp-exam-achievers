import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("teachers")
    .select("id, name, email, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teachers: data });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabaseAdmin
    .from("teachers")
    .insert({ name, email, password_hash })
    .select("id, name, email")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teacher: data });
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacher_id, new_password, name } = await req.json();
  if (!teacher_id) {
    return NextResponse.json({ error: "teacher_id required" }, { status: 400 });
  }

  const update: Record<string, any> = {};
  if (new_password) update.password_hash = await bcrypt.hash(new_password, 10);
  if (name) update.name = name;

  const { data, error } = await supabaseAdmin
    .from("teachers")
    .update(update)
    .eq("id", teacher_id)
    .select("id, name, email")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teacher: data });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacher_id } = await req.json();
  if (!teacher_id) {
    return NextResponse.json({ error: "teacher_id required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("teachers")
    .delete()
    .eq("id", teacher_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}