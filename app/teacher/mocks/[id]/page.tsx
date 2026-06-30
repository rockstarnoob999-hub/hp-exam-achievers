"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Question = {
  id: string;
  question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_option: string; marks: number;
};

export default function ManageMockPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mockTitle, setMockTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    question_text: "", option_a: "", option_b: "", option_c: "", option_d: "",
    correct_option: "a", marks: 1, explanation: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/mocks/${id}`);
    if (res.status === 401) { router.push("/login?role=teacher"); return; }
    const data = await res.json();
    setMockTitle(data.mock?.title || "");
    const qRes = await fetch(`/api/mocks/${id}/questions`);
    const qData = await qRes.json();
    setQuestions(qData.questions || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch(`/api/mocks/${id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setForm({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a", marks: 1, explanation: "" });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/teacher/dashboard" className="text-sm text-navy">← Back</Link>
        <div className="font-semibold">{mockTitle || "Mock Test"}</div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-3">Add Question</h2>
          <form onSubmit={handleAddQuestion} className="card space-y-3">
            <textarea className="input-field" placeholder="Question text" required
              value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
            <input className="input-field" placeholder="Option A" required
              value={form.option_a} onChange={(e) => setForm({ ...form, option_a: e.target.value })} />
            <input className="input-field" placeholder="Option B" required
              value={form.option_b} onChange={(e) => setForm({ ...form, option_b: e.target.value })} />
            <input className="input-field" placeholder="Option C" required
              value={form.option_c} onChange={(e) => setForm({ ...form, option_c: e.target.value })} />
            <input className="input-field" placeholder="Option D" required
              value={form.option_d} onChange={(e) => setForm({ ...form, option_d: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className="input-field" value={form.correct_option}
                onChange={(e) => setForm({ ...form, correct_option: e.target.value })}>
                <option value="a">Correct: A</option>
                <option value="b">Correct: B</option>
                <option value="c">Correct: C</option>
                <option value="d">Correct: D</option>
              </select>
              <input type="number" className="input-field" placeholder="Marks"
                value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
            </div>
            <textarea className="input-field" placeholder="Explanation (optional)"
              value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Adding..." : "Add Question"}
            </button>
          </form>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Questions ({questions.length})</h2>
          {loading ? <p className="text-gray-500">Loading...</p> : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="card">
                  <p className="font-medium text-sm">{i + 1}. {q.question_text}</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    {["a", "b", "c", "d"].map((opt) => (
                      <li key={opt} className={q.correct_option === opt ? "text-green-700 font-medium" : ""}>
                        {opt.toUpperCase()}. {(q as any)[`option_${opt}`]} {q.correct_option === opt && "✓"}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {questions.length === 0 && <p className="text-gray-400 text-sm">No questions added yet.</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
