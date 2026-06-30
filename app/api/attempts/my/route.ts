import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/attempts/my -> all attempts for the logged-in student, with mock info
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "student") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: attempts, error } = await supabaseAdmin
    .from("attempts")
    .select("*, mocks(title, exam_name)")
    .eq("student_id", session.id)
    .order("started_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attempts });
}
