import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || (session.role !== "teacher" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const subject = formData.get("subject") as string;
  const teacher_id = session.role === "admin"
    ? formData.get("teacher_id") as string
    : session.id;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });

  const filename = file.name.toLowerCase();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let questions: any[] = [];

  if (filename.endsWith(".xlsx") || filename.endsWith(".xls") || filename.endsWith(".csv")) {
    // Parse Excel or CSV
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    for (const row of rows as any[]) {
      const question_text = row["question"] || row["Question"] || row["QUESTION"] || "";
      const option_a = row["option_a"] || row["Option A"] || row["A"] || row["a"] || "";
      const option_b = row["option_b"] || row["Option B"] || row["B"] || row["b"] || "";
      const option_c = row["option_c"] || row["Option C"] || row["C"] || row["c"] || "";
      const option_d = row["option_d"] || row["Option D"] || row["D"] || row["d"] || "";
      const correct = (row["correct_option"] || row["Correct"] || row["Answer"] || row["answer"] || "a").toString().toLowerCase().trim();
      const explanation = row["explanation"] || row["Explanation"] || "";
      const difficulty = row["difficulty"] || row["Difficulty"] || "medium";
      const marks = Number(row["marks"] || row["Marks"] || 1);

      if (!question_text || !option_a || !option_b || !option_c || !option_d) continue;

      const correct_option = ["a", "b", "c", "d"].includes(correct) ? correct : "a";

      questions.push({
        teacher_id,
        subject,
        question_text: question_text.toString().trim(),
        option_a: option_a.toString().trim(),
        option_b: option_b.toString().trim(),
        option_c: option_c.toString().trim(),
        option_d: option_d.toString().trim(),
        correct_option,
        explanation: explanation.toString().trim() || null,
        difficulty: ["easy", "medium", "hard"].includes(difficulty.toString().toLowerCase()) ? difficulty.toString().toLowerCase() : "medium",
        marks: isNaN(marks) ? 1 : marks,
      });
    }
  } else {
    return NextResponse.json({ error: "Only Excel (.xlsx, .xls) and CSV files are supported. For PDF, please copy questions into Excel format first." }, { status: 400 });
  }

  if (questions.length === 0) {
    return NextResponse.json({
      error: "No valid questions found. Make sure your file has columns: question, option_a, option_b, option_c, option_d, correct_option",
    }, { status: 400 });
  }

  // Insert in batches of 50
  let inserted = 0;
  const batchSize = 50;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const { error } = await supabaseAdmin.from("question_bank").insert(batch);
    if (!error) inserted += batch.length;
  }

  return NextResponse.json({
    ok: true,
    total_found: questions.length,
    total_inserted: inserted,
    message: inserted + " questions added to the question bank successfully.",
  });
}