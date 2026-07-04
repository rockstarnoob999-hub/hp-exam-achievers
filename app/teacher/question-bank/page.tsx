"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUBJECTS = [
  "Computer",
  "Maths",
  "English",
  "Reasoning",
  "HP GK",
  "Indian GK",
  "Hindi",
  "Current Affairs",
  "Science",
  "History",
  "Geography",
  "Polity",
];

type Question = {
  id: string;
  subject: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  difficulty: string;
};

export default function QuestionBankPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showHindi, setShowHindi] = useState(false);

  const emptyForm = {
    subject: SUBJECTS[0],
    question_text: "", question_text_hi: "",
    option_a: "", option_b: "", option_c: "", option_d: "",
    option_a_hi: "", option_b_hi: "", option_c_hi: "", option_d_hi: "",
    correct_option: "a", marks: 1,
    explanation: "", difficulty: "medium",
  };

  const [form, setForm] = useState(emptyForm);

  async function load(subject?: string) {
    const url = "/api/question-bank" + (subject && subject !== "All" ? "?subject=" + encodeURIComponent(subject) : "");
    const res = await fetch(url);
    if (res.status === 401) { router.push("/login?role=teacher"); return; }
    const data = await res.json();
    setQuestions(data.questions || []);
    setLoading(false);
  }

  useEffect(() => { load(selectedSubject); }, [selectedSubject]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(""); setSuccess("");
    const res = await fetch("/api/question-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess("Question added to bank.");
    setForm(emptyForm);
    load(selectedSubject);
  }

  const grouped = SUBJECTS.map((s) => ({
    subject: s,
    count: questions.filter((q) => q.subject === s).length,
  }));

  const filtered = selectedSubject === "All"
    ? questions
    : questions.filter((q) => q.subject === selectedSubject);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/teacher/dashboard" className="text-sm text-gray-400 hover:text-navy transition">Back</Link>
          <div className="font-semibold text-navy">Question Bank</div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHindi(!showHindi)}
            className={"px-3 py-1.5 rounded-lg text-sm border transition " + (showHindi ? "bg-orange-50 border-orange-300 text-orange-600" : "border-gray-200 text-gray-500")}
          >
            {showHindi ? "Hindi ON" : "Add Hindi"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary text-sm"
          >
            {showForm ? "Hide Form" : "+ Add Question"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          <button
            onClick={() => setSelectedSubject("All")}
            className={"px-3 py-2 rounded-lg text-xs font-medium border transition " + (selectedSubject === "All" ? "bg-navy text-white border-navy" : "bg-white border-gray-200 text-gray-600 hover:border-navy")}
          >
            All ({questions.length})
          </button>
          {grouped.map((g) => (
            <button
              key={g.subject}
              onClick={() => setSelectedSubject(g.subject)}
              className={"px-3 py-2 rounded-lg text-xs font-medium border transition " + (selectedSubject === g.subject ? "bg-navy text-white border-navy" : "bg-white border-gray-200 text-gray-600 hover:border-navy")}
            >
              {g.subject} ({g.count})
            </button>
          ))}
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-navy mb-4">Add Question to Bank</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Subject</label>
                  <select className="input-field mt-1" value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Difficulty</label>
                  <select className="input-field mt-1" value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Question (English)</label>
                <textarea className="input-field mt-1" required
                  value={form.question_text}
                  onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
              </div>
              {showHindi && (
                <div>
                  <label className="text-xs text-orange-500">Question (Hindi)</label>
                  <textarea className="input-field mt-1"
                    value={form.question_text_hi}
                    onChange={(e) => setForm({ ...form, question_text_hi: e.target.value })} />
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
                    value={form.marks}
                    onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Explanation (optional)</label>
                <textarea className="input-field mt-1"
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? "Adding..." : "Add to Question Bank"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-400 mb-2">No questions in this subject yet.</p>
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                Add first question
              </button>
            </div>
          ) : (
            filtered.map((q, i) => (
              <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-blue-50 text-navy px-2 py-0.5 rounded font-medium">{q.subject}</span>
                      <span className={"text-xs px-2 py-0.5 rounded font-medium " + (
                        q.difficulty === "easy" ? "bg-green-50 text-green-700" :
                        q.difficulty === "hard" ? "bg-red-50 text-red-700" :
                        "bg-yellow-50 text-yellow-700"
                      )}>{q.difficulty}</span>
                    </div>
                    <p className="text-sm text-navy font-medium">{i + 1}. {q.question_text}</p>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {["a", "b", "c", "d"].map((opt) => (
                        <p key={opt} className={"text-xs px-2 py-1 rounded " + (q.correct_option === opt ? "bg-green-50 text-green-700 font-medium" : "text-gray-500")}>
                          {opt.toUpperCase()}. {(q as any)["option_" + opt]}
                          {q.correct_option === opt && " - Correct"}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}