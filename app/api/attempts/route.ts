import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST /api/attempts -> start a new attempt. body: { mock_id, access_password }
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mock_id, access_password } = await req.json();
  if (!mock_id) return NextResponse.json({ error: "mock_id required" }, { status: 400 });

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("attempts_allowed, is_disabled")
    .eq("id", session.id)
    .single();

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (student.is_disabled) return NextResponse.json({ error: "Account disabled. Contact your teacher." }, { status: 403 });

  const { data: mock } = await supabaseAdmin.from("mocks").select("*").eq("id", mock_id).single();
  if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });

  if (access_password && access_password !== mock.access_password) {
    return NextResponse.json({ error: "Incorrect test password" }, { status: 403 });
  }

  const { data: assigned } = await supabaseAdmin
    .from("mock_assignments")
    .select("id")
    .eq("mock_id", mock_id)
    .eq("student_id", session.id)
    .single();
  if (!assigned) return NextResponse.json({ error: "You are not assigned to this test" }, { status: 403 });

  const { count } = await supabaseAdmin
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .eq("mock_id", mock_id)
    .eq("student_id", session.id);

  const usedAttempts = count || 0;
  if (usedAttempts >= student.attempts_allowed) {
    return NextResponse.json(
      { error: "You have exhausted all attempts. Contact your teacher." },
      { status: 403 }
    );
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";

  const { data: attempt, error } = await supabaseAdmin
    .from("attempts")
    .insert({
      mock_id, student_id: session.id,
      attempt_number: usedAttempts + 1,
      ip_address: ip, user_agent: ua,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    attempt,
    remaining_attempts: student.attempts_allowed - (usedAttempts + 1),
  });
}
