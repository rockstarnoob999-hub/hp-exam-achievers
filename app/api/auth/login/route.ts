import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { signSession, sessionCookie } from "@/lib/auth";

// POST /api/auth/login
// body: { role: "teacher" | "student", identifier: string (email/phone), password: string }
export async function POST(req: NextRequest) {
  const { role, identifier, password } = await req.json();

  if (!role || !identifier || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (role === "teacher") {
    const { data: teacher } = await supabaseAdmin
      .from("teachers")
      .select("*")
      .eq("email", identifier)
      .single();

    if (!teacher) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, teacher.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signSession({ id: teacher.id, role: "teacher", name: teacher.name });
    const res = NextResponse.json({ ok: true, role: "teacher", name: teacher.name });
    res.headers.set("Set-Cookie", sessionCookie(token));
    return res;
  }

  if (role === "student") {
    // identifier can be email or phone
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("*")
      .or(`email.eq.${identifier},phone.eq.${identifier}`)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (student.is_disabled) {
      return NextResponse.json({ error: "Your account has been disabled. Contact your teacher." }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signSession({ id: student.id, role: "student", name: student.name });
    const res = NextResponse.json({ ok: true, role: "student", name: student.name });
    res.headers.set("Set-Cookie", sessionCookie(token));
    return res;
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}
