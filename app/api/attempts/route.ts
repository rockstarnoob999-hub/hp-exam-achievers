import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mock_id, access_password } = await req.json();
  if (!mock_id) return NextResponse.json({ error: "mock_id required" }, { status: 400 });

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("attempts_allowed, is_disabled")
    .eq("id", session.id)
    .single();

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (student.is_disabled) {
    return NextResponse.json({ error: "Account disabled. Contact your teacher." }, { status: 403 });
  }

  const { data: mock } = await supabaseAdmin
    .from("mocks")
    .select("*")
    .eq("id", mock_id)
    .single();
  if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });

  if (access_password && access_password !== mock.access_password) {
    return NextResponse.json({ error: "Incorrect test password" }, { status: 403 });
  }

  // Check scheduling
  const now = new Date();
  if (mock.start_date && new Date(mock.start_date) > now) {
    const startTime = new Date(mock.start_date).toLocaleString("en-IN", {
      dateStyle: "medium", timeStyle: "short"
    });
    return NextResponse.json({
      error: "This test has not started yet. It will be available from " + startTime,
    }, { status: 403 });
  }

  if (mock.end_date && new Date(mock.end_date) < now) {
    const endTime = new Date(mock.end_date).toLocaleString("en-IN", {
      dateStyle: "medium", timeStyle: "short"
    });
    return NextResponse.json({
      error: "This test has ended. It was available until " + endTime,
    }, { status: 403 });
  }

  const { data: assigned } = await supabaseAdmin
    .from("mock_assignments")
    .select("id")
    .eq("mock_id", mock_id)
    .eq("student_id", session.id)
    .single();
  if (!assigned) {
    return NextResponse.json({ error: "You are not assigned to this test" }, { status: 403 });
  }

  // Check for existing in-progress attempt - resume it
  const { data: existingAttempt } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("mock_id", mock_id)
    .eq("student_id", session.id)
    .eq("status", "in_progress")
    .single();

  if (existingAttempt) {
    // Calculate remaining time
    const startedAt = new Date(existingAttempt.started_at).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startedAt) / 1000);
    const totalSeconds = mock.duration_minutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

    // If time already ran out auto-submit
    if (remainingSeconds <= 0) {
      await supabaseAdmin
        .from("attempts")
        .update({ status: "auto_submitted", submitted_at: new Date().toISOString() })
        .eq("id", existingAttempt.id);
      return NextResponse.json({
        error: "Your previous attempt timed out and was auto-submitted. Please check your results.",
        attempt_id: existingAttempt.id,
        timed_out: true,
      }, { status: 400 });
    }

    // Fetch saved answers for this attempt
    const { data: savedAnswers } = await supabaseAdmin
      .from("answers")
      .select("*")
      .eq("attempt_id", existingAttempt.id);

    return NextResponse.json({
      attempt: existingAttempt,
      remaining_seconds: remainingSeconds,
      resuming: true,
      saved_answers: savedAnswers || [],
      remaining_attempts: student.attempts_allowed - 1,
    });
  }

  // Count completed attempts
  const { count } = await supabaseAdmin
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .eq("mock_id", mock_id)
    .eq("student_id", session.id)
    .neq("status", "in_progress");

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
      mock_id,
      student_id: session.id,
      attempt_number: usedAttempts + 1,
      ip_address: ip,
      user_agent: ua,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    attempt,
    remaining_seconds: mock.duration_minutes * 60,
    resuming: false,
    saved_answers: [],
    remaining_attempts: student.attempts_allowed - (usedAttempts + 1),
  });
}