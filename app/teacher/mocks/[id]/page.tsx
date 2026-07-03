"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Question = {
  id: string;
  question_text: string;
  question_text_hi: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_a_hi: string;
  option_b_hi: string;
  option_c_hi: string;
  option_d_hi: string;
  correct_option: string;
  marks: number;
  explanation: string;
};

export default function ManageMockPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mockTitle, setMockTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHindi, setShowHindi] = useState(false);

  const [form, setForm] = useState({
    question_text: "",
    question_text_hi: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    option_a_hi: "",
    option_b_hi: "",
    option_c_hi: "",
    option_d_hi: "",
    correct_option: "a",
    marks: 1,
    explanation: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/mocks/" + id);
    if (res.status === 401) { router.push("/login?role=teacher"); return; }
    const data = await res.json();
    setMockTitle(data.mock?.title || "");
    const qRes = await fetch("/api/mocks/" + id + "/questions");
    const qData = await qRes.json();
    setQuestions(qData.questions || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/mocks/" + id + "/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setForm({
      question_text: "", question_text_hi: "",
      option_a: "", option_b: "", option_c: "", option_d: "",
      option_a_hi: "", option_b_hi: "", option_c_hi: "", option_d_hi: "",
      correct_option: "a", marks: 1, explanation: "",
    });
    load();
  }

  async function handleDelete(questionId: string) {
    const confirmed = window.confirm("Delete this question? This cannot be undone.");
    if (!confirmed) return;
    const res = await fetch("/api/mocks/" + id + "/questions/" + questionId, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/teacher/dashboard" className="text-sm text-gray-400 hover:text-navy transition">Back</Link>
          <div className="font-semibold text-navy">{mockTitle || "Mock Test"}</div>
        </div>
        <button
          onClick={() => setShowHindi(!showHindi)}