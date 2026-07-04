"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUBJECTS = [
  "Computer", "Maths", "English", "Reasoning",
  "HP GK", "Indian GK", "Hindi", "Current Affairs",
  "Science", "History", "Geography", "Polity",
];

type Section = {
  subject: string;
  question_count: number;
  marks_per_question: number;
};

type Pattern = {
  id: string;
  name: string;
  duration_minutes: number;
  negative_marking: number;
  pattern_sections: {
    subject: string;
    question_count: number;
    marks_per_question: number;
    order_index: number;
  }[];
};

export default function ExamPatternsPage() {
  const router = useRouter();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generateForm, setGenerateForm] = useState<{ [key: string]: any }>({});
  const [showGenerateFor, setShowGenerateFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const emptyPattern = {
    name: "",
    duration_minutes: 120,
    negative_marking: 0,
    sections: [{ subject: "Computer", question_count: 85, marks_per_question: 1 }] as Section[],
  };

  const [form, setForm] = useState(emptyPattern);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/exam-patterns");
    if (res.status === 401) { router.push("/login?role=teacher"); return; }
    const data = await res.json();
    setPatterns(data.patterns || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function addSection() {
    setForm({
      ...form,
      sections: [...form.sections, { subject: "Maths", question_count: 10, marks_per_question: 1 }],
    });
  }

  function removeSection(index: number) {
    setForm({
      ...form,
      sections: form.sections.filter((_, i) => i !== index),
    });
  }

  function updateSection(index: number, field: string, value: any) {
    const updated = form.sections.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setForm({ ...form, sections: updated });
  }

  async function handleSavePattern(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/exam-patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setForm(emptyPattern);
    setShowForm(false);
    load();
  }

  async function handleGenerate(patternId: string) {
    const gf = generateForm[patternId] || {};
    if (!gf.title || !gf.access_password) {
      setMessage("Please fill in mock title and password before generating.");
      return;
    }
    setGenerating(patternId);
    setMessage("");
    const res = await fetch("/api/exam-patterns/" + patternId + "/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gf),
    });
    const data = await res.json();
    setGenerating(null);
    if (!res.ok) {
      setMessage("Error: " + data.error);
      return;
    }
    const warnings = data.warnings?.length > 0
      ? " Warnings: " + data.warnings.join(", ")
      : "";
    setMessage(
      "Mock created with " + data.questions_added + " questions!" + warnings +
      " Go to dashboard to view it."
    );
    setShowGenerateFor(null);
    setGenerateForm({ ...generateForm, [patternId]: {} });
  }

  const totalQuestions = (sections: Section[]) =>
    sections.reduce((sum, s) => sum + s.question_count, 0);

  const totalMarks = (sections: Section[]) =>
    sections.reduce((sum, s) => sum + s.question_count * s.marks_per_question, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/teacher/dashboard" className="text-sm text-gray-400 hover:text-navy transition">Back</Link>
          <div className="font-semibold text-navy">Exam Patterns</div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? "Hide Form" : "+ Create Pattern"}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {message && (
          <div className={"mb-4 px-4 py-3 rounded-xl text-sm border " + (message.startsWith("Error") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700")}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
            <h2 className="font-semibold text-navy mb-4">Create Exam Pattern</h2>
            <form onSubmit={handleSavePattern} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400">Pattern Name (e.g. JOA IT, HPRCA CBT)</label>
                <input className="input-field mt-1" required placeholder="e.g. JOA IT 2024"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Duration (minutes)</label>
                  <input type="number" className="input-field mt-1"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Negative Marking</label>
                  <input type="number" step="0.25" className="input-field mt-1"
                    value={form.negative_marking}
                    onChange={(e) => setForm({ ...form, negative_marking: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">Sections (subjects and question counts)</label>
                  <button type="button" onClick={addSection} className="text-xs text-navy underline">
                    + Add Section
                  </button>
                </div>
                <div className="space-y-2">
                  {form.sections.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        className="input-field flex-1"
                        value={s.subject}
                        onChange={(e) => updateSection(i, "subject", e.target.value)}
                      >
                        {SUBJECTS.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="input-field w-24"
                        placeholder="Questions"
                        value={s.question_count}
                        onChange={(e) => updateSection(i, "question_count", Number(e.target.value))}
                      />
                      <input
                        type="number"
                        step="0.5"
                        className="input-field w-20"
                        placeholder="Marks"
                        value={s.marks_per_question}
                        onChange={(e) => updateSection(i, "marks_per_question", Number(e.target.value))}
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(i)}
                        className="text-red-400 hover:text-red-600 text-sm px-2"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Total: {totalQuestions(form.sections)} questions, {totalMarks(form.sections)} marks
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? "Saving..." : "Save Pattern"}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : patterns.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-400 mb-4">No patterns yet. Create your first exam pattern.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              Create Pattern
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {patterns.map((p) => {
              const sections = [...(p.pattern_sections || [])].sort((a, b) => a.order_index - b.order_index);
              const total = sections.reduce((sum, s) => sum + s.question_count, 0);
              const marks = sections.reduce((sum, s) => sum + s.question_count * s.marks_per_question, 0);
              const gf = generateForm[p.id] || {};

              return (
                <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-navy">{p.name}</h3>
                      <p className="text-sm text-gray-400">
                        {total} questions - {marks} marks - {p.duration_minutes} min
                        {p.negative_marking > 0 && " - Negative: " + p.negative_marking}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowGenerateFor(showGenerateFor === p.id ? null : p.id)}
                      className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition"
                    >
                      Generate Mock
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {sections.map((s, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-navy px-2 py-1 rounded-lg border border-blue-100">
                        {s.subject}: {s.question_count}Q
                      </span>
                    ))}
                  </div>

                  {showGenerateFor === p.id && (
                    <div className="border-t border-gray-100 pt-4 mt-3 space-y-3">
                      <p className="text-sm font-medium text-navy">Generate a new mock from this pattern</p>
                      <div>
                        <label className="text-xs text-gray-400">Mock Title</label>
                        <input
                          className="input-field mt-1"
                          placeholder="e.g. JOA IT Mock Test 1"
                          value={gf.title || ""}
                          onChange={(e) => setGenerateForm({ ...generateForm, [p.id]: { ...gf, title: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Access Password</label>
                        <input
                          className="input-field mt-1"
                          placeholder="Password students use to enter"
                          value={gf.access_password || ""}
                          onChange={(e) => setGenerateForm({ ...generateForm, [p.id]: { ...gf, access_password: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Instructions (optional)</label>
                        <textarea
                          className="input-field mt-1"
                          placeholder="Any instructions for students"
                          value={gf.instructions || ""}
                          onChange={(e) => setGenerateForm({ ...generateForm, [p.id]: { ...gf, instructions: e.target.value } })}
                        />
                      </div>
                      <button
                        onClick={() => handleGenerate(p.id)}
                        disabled={generating === p.id}
                        className="btn-gold w-full"
                      >
                        {generating === p.id ? "Generating..." : "Generate Mock Instantly"}
                      </button>
                      <p className="text-xs text-gray-400 text-center">
                        Questions will be randomly picked from your question bank for each subject.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}