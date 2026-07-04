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

  const emptyForm = {
    question_text: "", question_text_hi: "",
    option_a: "", option_b: "", option_c: "", option_d: "",
    option_a_hi: "", option_b_hi: "", option_c_hi: "", option_d_hi: "",
    correct_option: "a", marks: 1, explanation: "",
  };

  const [form, setForm] = useState(emptyForm);
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
    setForm(emptyForm);
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
          className={"px-3 py-1.5 rounded-lg text-sm font-medium border transition " + (showHindi ? "bg-orange-50 border-orange-300 text-orange-600" : "border-gray-200 text-gray-500 hover:border-navy hover:text-navy")}
        >
          {showHindi ? "Hiding Hindi fields" : "Add Hindi translation"}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-navy mb-3">Add Question</h2>
          <form onSubmit={handleAddQuestion} className="card space-y-3">
            <div>
              <label className="text-xs text-gray-400">Question (English)</label>
              <textarea className="input-field mt-1" placeholder="Question text in English" required
                value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
            </div>
            {showHindi && (
              <div>
                <label className="text-xs text-orange-500">Question (Hindi - optional)</label>
                <textarea className="input-field mt-1" placeholder="Hindi translation"
                  value={form.question_text_hi} onChange={(e) => setForm({ ...form, question_text_hi: e.target.value })} />
              </div>
            )}

            {(["a", "b", "c", "d"] as const).map((opt) => (
              <div key={opt}>
                <label className="text-xs text-gray-400">Option {opt.toUpperCase()} (English)</label>
                <input className="input-field mt-1" placeholder={"Option " + opt.toUpperCase()} required
                  value={(form as any)["option_" + opt]}
                  onChange={(e) => setForm({ ...form, ["option_" + opt]: e.target.value })} />
                {showHindi && (
                  <input className="input-field mt-1" placeholder={"Option " + opt.toUpperCase() + " Hindi (optional)"}
                    value={(form as any)["option_" + opt + "_hi"]}
                    onChange={(e) => setForm({ ...form, ["option_" + opt + "_hi"]: e.target.value })} />
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Correct Option</label>
                <select className="input-field mt-1" value={form.correct_option}
                  onChange={(e) => setForm({ ...form, correct_option: e.target.value })}>
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Marks</label>
                <input type="number" className="input-field mt-1"
                  value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400">Explanation (optional)</label>
              <textarea className="input-field mt-1" placeholder="Explanation for correct answer"
                value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Adding..." : "Add Question"}
            </button>
          </form>
        </div>

        <div>
          <h2 className="font-semibold text-navy mb-3">Questions ({questions.length})</h2>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="card">
                  {editingId === q.id ? (
                    <EditQuestionForm
                      mockId={id}
                      question={q}
                      showHindi={showHindi}
                      onSaved={() => { setEditingId(null); load(); }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <p className="font-medium text-sm text-navy">{i + 1}. {q.question_text}</p>
                      {q.question_text_hi && (
                        <p className="text-sm text-orange-500 mt-1">{q.question_text_hi}</p>
                      )}
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        {["a", "b", "c", "d"].map((opt) => (
                          <li key={opt} className={q.correct_option === opt ? "text-green-700 font-medium" : ""}>
                            {opt.toUpperCase()}. {(q as any)["option_" + opt]}
                            {q.correct_option === opt && " - Correct"}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-3 mt-3">
                        <button onClick={() => setEditingId(q.id)} className="text-sm text-navy underline">Edit</button>
                        <button onClick={() => handleDelete(q.id)} className="text-sm text-red-500 underline">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-gray-400 text-sm">No questions added yet.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EditQuestionForm({ mockId, question, showHindi, onSaved, onCancel }: {
  mockId: string;
  question: Question;
  showHindi: boolean;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    question_text: question.question_text || "",
    question_text_hi: question.question_text_hi || "",
    option_a: question.option_a || "",
    option_b: question.option_b || "",
    option_c: question.option_c || "",
    option_d: question.option_d || "",
    option_a_hi: question.option_a_hi || "",
    option_b_hi: question.option_b_hi || "",
    option_c_hi: question.option_c_hi || "",
    option_d_hi: question.option_d_hi || "",
    correct_option: question.correct_option || "a",
    marks: question.marks || 1,
    explanation: question.explanation || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/mocks/" + mockId + "/questions/" + question.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onSaved();
  }

  return (
    <form onSubmit={handleSave} className="space-y-2">
      <div>
        <label className="text-xs text-gray-400">Question (English)</label>
        <textarea className="input-field mt-1" required
          value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
      </div>
      {showHindi && (
        <div>
          <label className="text-xs text-orange-500">Question (Hindi)</label>
          <textarea className="input-field mt-1"
            value={form.question_text_hi} onChange={(e) => setForm({ ...form, question_text_hi: e.target.value })} />
        </div>
      )}
      {(["a", "b", "c", "d"] as const).map((opt) => (
        <div key={opt}>
          <label className="text-xs text-gray-400">Option {opt.toUpperCase()}</label>
          <input className="input-field mt-1" required
            value={(form as any)["option_" + opt]}
            onChange={(e) => setForm({ ...form, ["option_" + opt]: e.target.value })} />
          {showHindi && (
            <input className="input-field mt-1" placeholder={"Option " + opt.toUpperCase() + " Hindi"}
              value={(form as any)["option_" + opt + "_hi"]}
              onChange={(e) => setForm({ ...form, ["option_" + opt + "_hi"]: e.target.value })} />
          )}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <select className="input-field" value={form.correct_option}
          onChange={(e) => setForm({ ...form, correct_option: e.target.value })}>
          <option value="a">Correct: A</option>
          <option value="b">Correct: B</option>
          <option value="c">Correct: C</option>
          <option value="d">Correct: D</option>
        </select>
        <input type="number" className="input-field"
          value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
      </div>
      <textarea className="input-field" placeholder="Explanation (optional)"
        value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}