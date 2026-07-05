import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { signSession, sessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { role, identifier, password } = await req.json();

  if (!role || !identifier || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";

  if (role === "admin") {
    const { data: admin } = await supabaseAdmin
      .from("admins")
      .select("*")
      .eq("email", identifier)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await supabaseAdmin.from("login_logs").insert({
      user_id: admin.id,
      user_role: "admin",
      user_name: admin.name,
      user_email: admin.email,
      ip_address: ip,
      user_agent: ua,
    });

    const token = signSession({ id: admin.id, role: "admin", name: admin.name });
    const res = NextResponse.json({ ok: true, role: "admin", name: admin.name });
    res.headers.set("Set-Cookie", sessionCookie(token));
    return res;
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

    await supabaseAdmin.from("login_logs").insert({
      user_id: teacher.id,
      user_role: "teacher",
      user_name: teacher.name,
      user_email: teacher.email,
      ip_address: ip,
      user_agent: ua,
    });

    const token = signSession({ id: teacher.id, role: "teacher", name: teacher.name });
    const res = NextResponse.json({ ok: true, role: "teacher", name: teacher.name });
    res.headers.set("Set-Cookie", sessionCookie(token));
    return res;
  }

  if (role === "student") {
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

    await supabaseAdmin.from("login_logs").insert({
      user_id: student.id,
      user_role: "student",
      user_name: student.name,
      user_email: student.email || student.phone,
      ip_address: ip,
      user_agent: ua,
    });

    const token = signSession({ id: student.id, role: "student", name: student.name });
    const res = NextResponse.json({ ok: true, role: "student", name: student.name });
    res.headers.set("Set-Cookie", sessionCookie(token));
    return res;
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}