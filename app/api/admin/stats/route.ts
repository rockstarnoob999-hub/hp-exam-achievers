import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [teachers, students, mocks, attempts, logs] = await Promise.all([
    supabaseAdmin.from("teachers").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("students").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("mocks").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("attempts").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabaseAdmin.from("login_logs").select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    total_teachers: teachers.count || 0,
    total_students: students.count || 0,
    total_mocks: mocks.count || 0,
    total_attempts: attempts.count || 0,
    total_logins: logs.count || 0,
  });
}