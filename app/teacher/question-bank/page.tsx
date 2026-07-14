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
  explanation: string;
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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [bulkSubject, setBulkSubject] = useState(SUBJECTS[0]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkError, setBulkError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

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

  async function handleDeleteQuestion(questionId: string) {
    if (!window.confirm("Delete this question from the bank? This cannot be undone.")) return;
    const res = await fetch("/api/question-bank", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: questionId }),
    });
    if (res.ok) load(selectedSubject);
  }

  async function handleBulkUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = bulkFileRef.current?.files?.[0];
    if (!file) { setBulkError("Please select a file."); return; }
    setBulkUploading(true);
    setBulkMessage(""); setBulkError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("subject", bulkSubject);
    const res = await fetch("/api/question-bank/bulk-upload", { method: "POST", body: fd });
    const data = await res.json();
    setBulkUploading(false);
    if (!res.ok) { setBulkError(data.error); return; }
    setBulkMessage(data.message);
    if (bulkFileRef.current) bulkFileRef.current.value = "";
    load(selectedSubject);
  }

  function downloadTemplate() {
    const csv = [
      "question,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,marks",
      "What is the capital of Himachal Pradesh?,Shimla,Mandi,Kullu,Dharamshala,a,Shimla is the capital of HP,easy,1",
      "Which river flows through Mandi?,Beas,Ravi,Chenab,Sutlej,a,The Beas river flows through Mandi,medium,1",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question-bank-template.csv";
    a.click();
    URL.revokeObjectURL(url);
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
            <input type="file" accept="image/*" className="input-field text-xs"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(file, field); }} />
            {uploading === field && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
          </div>
        ) : (
          <input className="input-field text-xs" placeholder={"Paste image URL for " + label}
            value={val} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
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
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/teacher/dashboard" className="text-sm text-gray-400 hover:text-navy transition">Back</Link>
          <div className="font-semibold text-navy">Question Bank</div>
          <span className="text-xs bg-blue-50 text-navy px-2 py-1 rounded-lg">{questions.length} questions</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHindi(!showHindi)}
            className={"px-3 py-1.5 rounded-lg text-sm border transition " + (showHindi ? "bg-orange-50 border-orange-300 text-orange-600" : "border-gray-200 text-gray-500")}>
            {showHindi ? "Hindi ON" : "Hindi"}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            {showForm ? "Close" : "+ Add Question"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">

        {/* Bulk Upload */}
        <div className="bg-white border border-blue-100 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-navy text-sm">Bulk Upload Questions</h3>
              <p className="text-xs text-gray-400 mt-0.5">Upload Excel or CSV — columns: question, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, marks</p>
            </div>
            <button onClick={downloadTemplate}
              className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition flex-shrink-0 ml-3">
              Download Template
            </button>
          </div>
          <form onSubmit={handleBulkUpload} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-400">Subject</label>
              <select className="input-field mt-1 w-40 text-sm" value={bulkSubject}
                onChange={(e) => setBulkSubject(e.target.value)}>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Excel or CSV file</label>
              <input ref={bulkFileRef} type="file" accept=".xlsx,.xls,.csv" className="input-field mt-1 text-sm" required />
            </div>
            <button type="submit" disabled={bulkUploading} className="btn-gold text-sm">
              {bulkUploading ? "Uploading..." : "Upload"}
            </button>
          </form>
          {bulkMessage && <p className="text-sm text-green-600 mt-2">{bulkMessage}</p>}
          {bulkError && <p className="text-sm text-red-500 mt-2">{bulkError}</p>}
        </div>

        {/* Add Question Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-navy mb-4">Add Question to Bank</h2>
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setImageMode("upload")}
                className={"px-3 py-1 rounded text-xs border " + (imageMode === "upload" ? "bg-navy text-white border-navy" : "border-gray-200 text-gray-500")}>
                Upload images
              </button>
              <button type="button" onClick={() => setImageMode("url")}
                className={"px-3 py-1 rounded text-xs border " + (imageMode === "url" ? "bg-navy text-white border-navy" : "border-gray-200 text-gray-500")}>
                Paste URLs
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
                <label className="text-xs text-gray-400">Question (English)</label>
                <textarea className="input-field mt-1" required rows={3}
                  value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
              </div>
              {showHindi && (
                <div>
                  <label className="text-xs text-orange-500">Question (Hindi)</label>
                  <textarea className="input-field mt-1" rows={2}
                    value={form.question_text_hi} onChange={(e) => setForm({ ...form, question_text_hi: e.target.value })} />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400">Question image (optional)</label>
                <ImageUploadField field="image_url" label="question" />
              </div>
              <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                <p className="text-xs font-medium text-navy mb-3">Answer Options</p>
                {(["a", "b", "c", "d"] as const).map((opt) => (
                  <div key={opt} className="mb-3 pb-3 border-b border-blue-100 last:border-0 last:mb-0 last:pb-0">
                    <label className="text-xs text-gray-500 font-medium">Option {opt.toUpperCase()}</label>
                    <input className="input-field mt-1" required
                      placeholder={"Text for option " + opt.toUpperCase()}
                      value={(form as any)["option_" + opt]}
                      onChange={(e) => setForm({ ...form, ["option_" + opt]: e.target.value })} />
                    {showHindi && (
                      <input className="input-field mt-1"
                        placeholder={"Option " + opt.toUpperCase() + " Hindi"}
                        value={(form as any)["option_" + opt + "_hi"]}
                        onChange={(e) => setForm({ ...form, ["option_" + opt + "_hi"]: e.target.value })} />
                    )}
                    <label className="text-xs text-gray-400 mt-1 block">Image for option {opt.toUpperCase()} (optional)</label>
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
                    value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Explanation (optional)</label>
                <textarea className="input-field mt-1"
                  value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <button type="submit" disabled={saving || uploading !== null} className="btn-primary w-full">
                {saving ? "Adding..." : "Add to Question Bank"}
              </button>
            </form>
          </div>
        )}

        {/* Category Filter */}
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

        {/* Subject Filter */}
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

        {/* Questions List */}
        <div className="space-y-3">
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
                {editingQuestion?.id === q.id ? (
                  <EditBankQuestionForm
                    question={editingQuestion}
                    showHindi={showHindi}
                    onSaved={() => { setEditingQuestion(null); load(selectedSubject); }}
                    onCancel={() => setEditingQuestion(null)}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs bg-blue-50 text-navy px-2 py-0.5 rounded font-medium">{q.subject}</span>
                      <span className={"text-xs px-2 py-0.5 rounded font-medium " + (
                        q.difficulty === "easy" ? "bg-green-50 text-green-700" :
                        q.difficulty === "hard" ? "bg-red-50 text-red-700" :
                        "bg-yellow-50 text-yellow-700"
                      )}>{q.difficulty}</span>
                      {q.image_url && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Has image</span>}
                    </div>
                    <p className="text-sm text-navy font-medium mb-2">{i + 1}. {q.question_text}</p>
                    {q.image_url && (
                      <img src={q.image_url} alt="diagram" className="max-h-32 rounded-lg border border-gray-200 mb-3 object-contain" />
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {["a", "b", "c", "d"].map((opt) => (
                        <div key={opt} className={"rounded-lg p-2 " + (q.correct_option === opt ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-100")}>
                          <p className={"text-xs font-medium " + (q.correct_option === opt ? "text-green-700" : "text-gray-600")}>
                            {opt.toUpperCase()}. {(q as any)["option_" + opt]}
                            {q.correct_option === opt && " - Correct"}
                          </p>
                          {(q as any)["option_" + opt + "_image"] && (
                            <img src={(q as any)["option_" + opt + "_image"]} alt={"option " + opt}
                              className="max-h-16 rounded mt-1 border border-gray-200 object-contain" />
                          )}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-gray-400 mb-3 border-t border-gray-100 pt-2">
                        Explanation: {q.explanation}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => setEditingQuestion(q)}
                        className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteQuestion(q.id)}
                        className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function EditBankQuestionForm({ question, showHindi, onSaved, onCancel }: {
  question: Question;
  showHindi: boolean;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    question_text: question.question_text || "",
    question_text_hi: (question as any).question_text_hi || "",
    option_a: question.option_a || "",
    option_b: question.option_b || "",
    option_c: question.option_c || "",
    option_d: question.option_d || "",
    option_a_hi: (question as any).option_a_hi || "",
    option_b_hi: (question as any).option_b_hi || "",
    option_c_hi: (question as any).option_c_hi || "",
    option_d_hi: (question as any).option_d_hi || "",
    correct_option: question.correct_option || "a",
    marks: question.marks || 1,
    explanation: question.explanation || "",
    difficulty: question.difficulty || "medium",
    subject: question.subject || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/question-bank", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: question.id, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onSaved();
  }

  return (
    <form onSubmit={handleSave} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400">Subject</label>
          <input className="input-field mt-1 text-xs" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-400">Difficulty</label>
          <select className="input-field mt-1 text-xs" value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400">Question (English)</label>
        <textarea className="input-field mt-1 text-xs" required rows={2}
          value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
      </div>
      {showHindi && (
        <div>
          <label className="text-xs text-orange-400">Question (Hindi)</label>
          <textarea className="input-field mt-1 text-xs" rows={2}
            value={form.question_text_hi} onChange={(e) => setForm({ ...form, question_text_hi: e.target.value })} />
        </div>
      )}
      {(["a", "b", "c", "d"] as const).map((opt) => (
        <div key={opt}>
          <label className="text-xs text-gray-400">Option {opt.toUpperCase()}</label>
          <input className="input-field mt-1 text-xs" required
            value={(form as any)["option_" + opt]}
            onChange={(e) => setForm({ ...form, ["option_" + opt]: e.target.value })} />
          {showHindi && (
            <input className="input-field mt-1 text-xs"
              placeholder={"Option " + opt.toUpperCase() + " Hindi"}
              value={(form as any)["option_" + opt + "_hi"]}
              onChange={(e) => setForm({ ...form, ["option_" + opt + "_hi"]: e.target.value })} />
          )}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400">Correct Option</label>
          <select className="input-field mt-1 text-xs" value={form.correct_option}
            onChange={(e) => setForm({ ...form, correct_option: e.target.value })}>
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
            <option value="d">D</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">Marks</label>
          <input type="number" className="input-field mt-1 text-xs"
            value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400">Explanation</label>
        <textarea className="input-field mt-1 text-xs" rows={2}
          value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 border border-gray-200 rounded-lg py-2 text-xs hover:bg-gray-50 transition">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 text-xs">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}