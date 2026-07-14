import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");

  let query = supabaseAdmin
    .from("question_bank")
    .select("*")
    .eq("teacher_id", session.id)
    .order("created_at", { ascending: false });

  if (subject) query = query.eq("subject", subject);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    subject, question_text, question_text_hi, image_url,
    option_a, option_b, option_c, option_d,
    option_a_hi, option_b_hi, option_c_hi, option_d_hi,
    option_a_image, option_b_image, option_c_image, option_d_image,
    correct_option, marks, explanation, difficulty,
  } = body;

  if (!subject || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return NextResponse.json({ error: "Subject and all English fields are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("question_bank")
    .insert({
      teacher_id: session.id,
      subject, question_text,
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
      correct_option, marks: marks || 1,
      explanation: explanation || null,
      difficulty: difficulty || "medium",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data });
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("question_bank")
    .select("teacher_id")
    .eq("id", id)
    .single();

  if (!existing || existing.teacher_id !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("question_bank")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("question_bank")
    .select("teacher_id")
    .eq("id", id)
    .single();

  if (!existing || existing.teacher_id !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("question_bank")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}