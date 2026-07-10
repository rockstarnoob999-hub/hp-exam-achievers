import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: mock } = await supabaseAdmin
    .from("mocks")
    .select("*")
    .eq("id", id)
    .eq("teacher_id", session.id)
    .single();

  if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });

  // Get all assigned students
  const { data: assignments } = await supabaseAdmin
    .from("mock_assignments")
    .select("student_id, students(id, name, email, phone, attempts_allowed)")
    .eq("mock_id", id);

  // Get all attempts for this mock
  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("mock_id", id)
    .order("submitted_at", { ascending: false });

  const studentResults = (assignments || []).map((a: any) => {
    const student = a.students;
    const studentAttempts = (attempts || []).filter(
      (att: any) => att.student_id === student.id
    );
    const submittedAttempts = studentAttempts.filter(
      (att: any) => att.status !== "in_progress"
    );
    const inProgress = studentAttempts.find(
      (att: any) => att.status === "in_progress"
    );
    const bestAttempt = submittedAttempts.reduce((best: any, att: any) => {
      if (!best || att.score > best.score) return att;
      return best;
    }, null);

    return {
      student,
      attempts_used: submittedAttempts.length,
      attempts_allowed: student.attempts_allowed,
      attempts_remaining: Math.max(0, student.attempts_allowed - submittedAttempts.length),
      has_in_progress: !!inProgress,
      best_score: bestAttempt?.score ?? null,
      best_accuracy: bestAttempt
        ? bestAttempt.correct_count + bestAttempt.wrong_count > 0
          ? ((bestAttempt.correct_count / (bestAttempt.correct_count + bestAttempt.wrong_count)) * 100).toFixed(1)
          : "0.0"
        : null,
      last_submitted_at: bestAttempt?.submitted_at ?? null,
      correct_count: bestAttempt?.correct_count ?? null,
      wrong_count: bestAttempt?.wrong_count ?? null,
      skipped_count: bestAttempt?.skipped_count ?? null,
      all_attempts: submittedAttempts,
      status: submittedAttempts.length === 0
        ? inProgress ? "in_progress" : "not_started"
        : submittedAttempts.length >= student.attempts_allowed
        ? "exhausted"
        : "attempted",
    };
  });

  // Sort by best score descending
  studentResults.sort((a: any, b: any) => {
    if (b.best_score === null) return -1;
    if (a.best_score === null) return 1;
    return b.best_score - a.best_score;
  });

  const stats = {
    total_assigned: studentResults.length,
    total_submitted: studentResults.filter((s: any) => s.attempts_used > 0).length,
    not_started: studentResults.filter((s: any) => s.status === "not_started").length,
    in_progress: studentResults.filter((s: any) => s.status === "in_progress").length,
    highest_score: Math.max(...studentResults.map((s: any) => s.best_score ?? 0)),
    lowest_score: Math.min(...studentResults.filter((s: any) => s.best_score !== null).map((s: any) => s.best_score)),
    average_score: studentResults.filter((s: any) => s.best_score !== null).length > 0
      ? (studentResults.filter((s: any) => s.best_score !== null).reduce((sum: number, s: any) => sum + s.best_score, 0) / studentResults.filter((s: any) => s.best_score !== null).length).toFixed(1)
      : null,
  };

  return NextResponse.json({ mock, student_results: studentResults, stats });
}