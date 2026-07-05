"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUBJECTS = [
  "Computer", "Maths", "English", "Reasoning",
  "HP GK", "Indian GK", "Hindi", "Current Affairs",
  "Science", "History", "Geography", "Polity",
  "Physics", "Chemistry", "Mathematics",
  "Biology (Botany)", "Biology (Zoology)",
  "Quantitative Aptitude", "General Awareness",
  "Computer Aptitude", "Financial Awareness",
  "Verbal Ability", "Data Interpretation",
  "Mental Ability", "Logical Reasoning",
];

const CATEGORIES = ["HP Exams", "JEE", "NEET", "Banking", "Other"];

const SUBJECT_CATEGORY: Record<string, string> = {
  "Computer": "HP Exams", "Maths": "HP Exams", "English": "HP Exams",
  "Reasoning": "HP Exams", "HP GK": "HP Exams", "Indian GK": "HP Exams",
  "Hindi": "HP Exams", "Current Affairs": "HP Exams", "Science": "HP Exams",
  "History": "HP Exams", "Geography": "HP Exams", "Polity": "HP Exams",
  "Physics": "JEE", "Chemistry": "JEE", "Mathematics": "JEE",
  "Biology (Botany)": "NEET", "Biology (Zoology)": "NEET",
  "Quantitative Aptitude": "Banking", "General Awareness": "Banking",
  "Computer Aptitude": "Banking", "Financial Awareness": "Banking",
  "Verbal Ability": "Other", "Data Interpretation": "Other",
  "Mental Ability": "Other", "Logical Reasoning": "Other",
};

type Question = {
  id: string;
  subject: string;
  question_text: string;
  image_url: string | null;
  option_a: string; option_b: string; option_c: string; option_d: string;
  option_a_image: string | null; option_b_image: string | null;
  option_c_image: string | null; option_d_image: string | null;
  correct_option: string;
  marks: number;
  difficulty: string;
};

export default function QuestionBankPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showHindi, setShowHindi] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    subject: SUBJECTS[0],
    question_text: "", question_text_hi: "", image_url: "",
    option_a: "", option_b: "", option_c: "", option_d: "",
    option_a_hi: "", option_b_hi: "", option_c_hi: "", option_d_hi: "",
    option_a_image: "", option_b_image: "", option_c_image: "", option_d_image: "",
    correct_option: "a", marks: 1, explanation: "", difficulty: "medium",
  };

  const [form, setForm] = useState(emptyForm);

  async function load(subject?: string) {
    const url = "/api/question-bank" +
      (subject && subject !== "All" ? "?subject=" + encodeURIComponent(subject) : "");
    const res = await fetch(url);
    if (res.status === 401) { router.push("/login?role=teacher"); return; }
    const data = await res.json();
    setQuestions(data.questions || []);
    setLoading(false);
  }

  useEffect(() => { load(selectedSubject); }, [selectedSubject]);

  async function uploadImage(file: File, field: string) {
    setUploading(field);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(null);
    if (!res.ok) { setError(data.error); return; }
    setForm((prev) => ({ ...prev, [field]: data.url }));
  }

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
    if (fileRef.current) fileRef.current.value = "";
    load(selectedSubject);
  }

  const filteredByCategory = selectedCategory === "All"
    ? SUBJECTS
    : SUBJECTS.filter((s) => SUBJECT_CATEGORY[s] === selectedCategory);

  const grouped = filteredByCategory.map((s) => ({
    subject: s,
    count: questions.filter((q) => q.subject === s).length,
  }));

  const filtered = questions.filter((q) => {
    const matchSubject = selectedSubject === "All" || q.subject === selectedSubject;
    const matchCategory = selectedCategory === "All" || SUBJECT_CATEGORY[q.subject] === selectedCategory;
    return matchSubject && matchCategory;
  });

  function ImageUploadField({ field, label }: { field: string; label: string }) {
    const val = (form as any)[field];
    return (
      <div className="mt-1">
        {imageMode === "upload" ? (
          <div>
            <input
              type="file"
              accept="image/*"
              className="input-field text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file, field);
              }}
            />
            {uploading === field && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
          </div>
        ) : (
          <input
            className="input-field text-xs"
            placeholder={"Paste image URL for " + label}
            value={val}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          />
        )}
        {val && uploading !== field && (
          <div className="mt-1 flex items-center gap-2">
            <img src={val} alt={label} className="max-h-16 rounded border border-gray-200" />
            <button type="button" onClick={() => setForm({ ...form, [field]: "" })}
              className="text-xs text-red-500 underline">Remove</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/teacher/dashboard" className="text-sm text-gray-400 hover:text-navy transition">Back</Link>
          <div className="font-semibold text-navy">Question Bank</div>
          <span className="text-xs bg-blue-50 text-navy px-2 py-1 rounded-lg">{questions.length} questions</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHindi(!showHindi)}
            className={"px-3 py-1.5 rounded-lg text-sm border transition " + (showHindi ? "bg-orange-50 border-orange-300 text-orange-600" : "border-gray-200 text-gray-500")}
          >
            {showHindi ? "Hindi ON" : "Add Hindi"}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            {showForm ? "Hide Form" : "+ Add Question"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => { setSelectedCategory("All"); setSelectedSubject("All"); }}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition " + (selectedCategory === "All" ? "bg-navy text-white border-navy" : "bg-white border-gray-200 text-gray-600")}>
            All Exams
          </button>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => { setSelectedCategory(cat); setSelectedSubject("All"); }}
              className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition " + (selectedCategory === cat ? "bg-navy text-white border-navy" : "bg-white border-gray-200 text-gray-600")}>
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setSelectedSubject("All")}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition " + (selectedSubject === "All" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-600")}>
            All ({filtered.length})
          </button>
          {grouped.map((g) => (
            <button key={g.subject} onClick={() => setSelectedSubject(g.subject)}
              className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition " + (selectedSubject === g.subject ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-600")}>
              {g.subject} ({g.count})
            </button>
          ))}
        </div>
<BulkUploadSection onUploaded={() => load(selectedSubject)} />
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-navy mb-4">Add Question to Bank</h2>

            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setImageMode("upload")}
                className={"px-3 py-1 rounded text-xs border " + (imageMode === "upload" ? "bg-navy text-white border-navy" : "border-gray-200 text-gray-500")}>
                Upload images from computer
              </button>
              <button type="button" onClick={() => setImageMode("url")}
                className={"px-3 py-1 rounded text-xs border " + (imageMode === "url" ? "bg-navy text-white border-navy" : "border-gray-200 text-gray-500")}>
                Paste image URLs
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Subject</label>
                  <select className="input-field mt-1" value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    {CATEGORIES.map((cat) => (
                      <optgroup key={cat} label={cat}>
                        {SUBJECTS.filter((s) => SUBJECT_CATEGORY[s] === cat).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
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
                <label className="text-xs text-gray-400">Question text (English)</label>
                <textarea className="input-field mt-1" required rows={3}
                  value={form.question_text}
                  onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
              </div>

              {showHindi && (
                <div>
                  <label className="text-xs text-orange-500">Question (Hindi)</label>
                  <textarea className="input-field mt-1" rows={2}
                    value={form.question_text_hi}
                    onChange={(e) => setForm({ ...form, question_text_hi: e.target.value })} />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400">Question image / diagram (optional)</label>
                <ImageUploadField field="image_url" label="question" />
              </div>

              <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                <p className="text-xs font-medium text-navy mb-3">Answer Options</p>
                {(["a", "b", "c", "d"] as const).map((opt) => (
                  <div key={opt} className="mb-4 pb-4 border-b border-blue-100 last:border-0 last:mb-0 last:pb-0">
                    <label className="text-xs text-gray-500 font-medium">Option {opt.toUpperCase()}</label>
                    <input className="input-field mt-1" required
                      placeholder={"Text for option " + opt.toUpperCase()}
                      value={(form as any)["option_" + opt]}
                      onChange={(e) => setForm({ ...form, ["option_" + opt]: e.target.value })} />
                    {showHindi && (
                      <input className="input-field mt-1"
                        placeholder={"Option " + opt.toUpperCase() + " in Hindi"}
                        value={(form as any)["option_" + opt + "_hi"]}
                        onChange={(e) => setForm({ ...form, ["option_" + opt + "_hi"]: e.target.value })} />
                    )}
                    <label className="text-xs text-gray-400 mt-1 block">
                      Image for option {opt.toUpperCase()} (optional - for diagram answers)
                    </label>
                    <ImageUploadField field={"option_" + opt + "_image"} label={"option " + opt.toUpperCase()} />
                  </div>
                ))}
              </div>

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

              <button type="submit" disabled={saving || uploading !== null} className="btn-primary w-full">
                {saving ? "Adding..." : "Add to Question Bank"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-400 mb-2">No questions yet.</p>
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Add first question</button>
            </div>
          ) : (
            filtered.map((q, i) => (
              <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-50 text-navy px-2 py-0.5 rounded font-medium">{q.subject}</span>
                  <span className={"text-xs px-2 py-0.5 rounded font-medium " + (
                    q.difficulty === "easy" ? "bg-green-50 text-green-700" :
                    q.difficulty === "hard" ? "bg-red-50 text-red-700" :
                    "bg-yellow-50 text-yellow-700"
                  )}>{q.difficulty}</span>
                  {q.image_url && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Question image</span>}
                  {(q.option_a_image || q.option_b_image || q.option_c_image || q.option_d_image) && (
                    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">Option images</span>
                  )}
                </div>
                <p className="text-sm text-navy font-medium mb-2">{i + 1}. {q.question_text}</p>
                {q.image_url && (
                  <img src={q.image_url} alt="diagram" className="max-h-40 rounded-lg border border-gray-200 mb-3" />
                )}
                <div className="grid grid-cols-2 gap-2">
                  {["a", "b", "c", "d"].map((opt) => (
                    <div key={opt} className={"rounded-lg p-2 " + (q.correct_option === opt ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-100")}>
                      <p className={"text-xs font-medium " + (q.correct_option === opt ? "text-green-700" : "text-gray-600")}>
                        {opt.toUpperCase()}. {(q as any)["option_" + opt]}
                        {q.correct_option === opt && " - Correct"}
                      </p>
                      {(q as any)["option_" + opt + "_image"] && (
                        <img src={(q as any)["option_" + opt + "_image"]} alt={"option " + opt}
                          className="max-h-20 rounded mt-1 border border-gray-200" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
function BulkUploadSection({ onUploaded }: { onUploaded: () => void }) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please select a file."); return; }
    setUploading(true);
    setMessage(""); setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("subject", subject);
    const res = await fetch("/api/question-bank/bulk-upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error); return; }
    setMessage(data.message);
    if (fileRef.current) fileRef.current.value = "";
    onUploaded();
  }

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 mb-6 shadow-sm">
      <h3 className="font-semibold text-navy mb-1">Bulk Upload Questions</h3>
      <p className="text-xs text-gray-400 mb-3">
        Upload an Excel or CSV file with columns: question, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, marks
      </p>
      <form onSubmit={handleUpload} className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-400">Subject</label>
          <select className="input-field mt-1 w-48" value={subject}
            onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">Excel or CSV file</label>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
            className="input-field mt-1" required />
        </div>
        <button type="submit" disabled={uploading}
          className="btn-gold text-sm whitespace-nowrap">
          {uploading ? "Uploading..." : "Upload Questions"}
        </button>
      </form>
      {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      <div className="mt-3 p-3 bg-blue-50 rounded-xl">
        <p className="text-xs text-navy font-medium mb-1">Excel template format:</p>
        <p className="text-xs text-gray-500 font-mono">question | option_a | option_b | option_c | option_d | correct_option | explanation | difficulty | marks</p>
        <p className="text-xs text-gray-400 mt-1">correct_option should be: a, b, c, or d. difficulty should be: easy, medium, or hard.</p>
      </div>
    </div>
  );
}