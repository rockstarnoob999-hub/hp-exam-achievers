import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    question_text, question_text_hi, image_url,
    option_a, option_b, option_c, option_d,
    option_a_hi, option_b_hi, option_c_hi, option_d_hi,
    option_a_image, option_b_image, option_c_image, option_d_image,
    correct_option, marks, explanation,
  } = body;

  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return NextResponse.json({ error: "All English fields are required" }, { status: 400 });
  }

  const { count } = await supabaseAdmin
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("mock_id", params.id);

  const { data, error } = await supabaseAdmin
    .from("questions")
    .insert({
      mock_id: params.id,
      question_text,
      question_text_hi: question_text_hi || null,
      image_url: image_url || null,
      option_a, option_b, option_c, option_d,
      option_a_hi: option_a_hi || null,
      option_b_hi: option_b_hi || null,
      option_c_hi: option_c_hi || null,
      option_d_hi: option_d_hi || null,
      option_a_image: option_a_image || null,
      option_b_image: option_b_image || null,
      option_c_image: option_c_image || null,
      option_d_image: option_d_image || null,
      correct_option,
      marks: marks || 1,
      explanation: explanation || null,
      order_index: count || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: allQ } = await supabaseAdmin
    .from("questions")
    .select("marks")
    .eq("mock_id", params.id);
  const total = (allQ || []).reduce((sum: number, q: any) => sum + Number(q.marks), 0);
  await supabaseAdmin.from("mocks").update({ total_marks: total }).eq("id", params.id);

  return NextResponse.json({ question: data });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("*")
    .eq("mock_id", params.id)
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data });
}