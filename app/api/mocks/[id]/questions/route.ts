import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST /api/mocks/[id]/questions -> add a question (teacher only)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { question_text, image_url, option_a, option_b, option_c, option_d, correct_option, marks, explanation } = body;

  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return NextResponse.json({ error: "All question fields are required" }, { status: 400 });
  }

  const { count } = await supabaseAdmin
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("mock_id", params.id);

  const { data, error } = await supabaseAdmin
    .from("questions")
    .insert({
      mock_id: params.id,
      question_text, image_url,
      option_a, option_b, option_c, option_d,
      correct_option, marks: marks || 1,
      explanation,
      order_index: count || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate total_marks on the mock
  const { data: allQ } = await supabaseAdmin.from("questions").select("marks").eq("mock_id", params.id);
  const total = (allQ || []).reduce((sum: number, q: any) => sum + Number(q.marks), 0);
  await supabaseAdmin.from("mocks").update({ total_marks: total }).eq("id", params.id);

  return NextResponse.json({ question: data });
}

// GET /api/mocks/[id]/questions -> list with answers (teacher only, for editing)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("*")
    .eq("mock_id", params.id)
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data });
}
