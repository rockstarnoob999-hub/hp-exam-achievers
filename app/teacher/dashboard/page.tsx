"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mock = {
  id: string;
  title: string;
  exam_name: string;
  duration_minutes: number;
  total_marks: number;
  access_password: string;
  negative_marking: number;
  passing_marks: number;
  instructions: string;
  show_result_immediately: boolean;
  show_correct_answers: boolean;
  leaderboard_enabled: boolean;
  expected_cutoff: number | null;
  cutoff_note: string | null;
  created_at: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={handleCopy}
      className={"flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium transition " + (
        copied ? "bg-green-100 text-green-700" : "bg-white border border-gray-200 text-gray-500 hover:border-navy hover:text-navy"
      )}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [mocks, setMocks] = useState<Mock[]>([]);
  const [showMockForm, setShowMockForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingMock, setEditingMock] = useState<Mock | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMocks() {
    const res = await fetch("/api/mocks");
    if (res.status === 401) { router.push("/login?role=teacher"); return; }
    const data = await res.json();
    setMocks(data.mocks || []);
    setLoading(false);
  }

  useEffect(() => { loadMocks(); }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function handleDelete(mockId: string) {
    if (!window.confirm("Delete this test? All questions and student results will be permanently removed.")) return;
    const res = await fetch("/api/mocks/" + mockId, { method: "DELETE" });
    if (!res.ok) { alert("Failed to delete the test."); return; }
    setMocks((prev) => prev.filter((m) => m.id !== mockId));
  }

  const activeMocks = mocks.filter((m) => m.total_marks > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="font-bold text-navy text-sm md:text-base">HP <span className="text-gold">Exam Achievers</span></div>
          <Link href="/" className="text-xs text-gray-400 hover:text-navy transition hidden sm:block">Home</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/teacher/students" className="text-sm text-gray-500 hover:text-navy transition hidden sm:block">Students</Link>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition">Logout</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl p-6 mb-6 text-white"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)" }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-blue-200 text-xs mb-1">Teacher Portal</p>
              <h1 className="text-xl md:text-2xl font-bold mb-2">Manage Your Mock Tests</h1>
              <p className="text-blue-100/80 text-sm max-w-lg">
                Create mocks, manage students, build your question bank and generate exams instantly.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="bg-white/20 border border-white/30 px-3 py-1 rounded-full text-xs font-medium">
                  {mocks.length} Total Tests
                </span>
                <span className="bg-white/20 border border-white/30 px-3 py-1 rounded-full text-xs font-medium">
                  {activeMocks.length} Active
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white/15 border border-white/25 rounded-2xl p-4 text-center w-32">
              <p className="text-blue-200 text-xs mb-1">Platform</p>
              <p className="text-4xl mb-1">🎓</p>
              <p className="text-white/60 text-xs">HP Exam Achievers</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Tests", value: mocks.length, icon: "📋", border: "border-blue-100", color: "text-blue-700" },
            { label: "Active Tests", value: activeMocks.length, icon: "✅", border: "border-green-100", color: "text-green-700" },
            { label: "Question Bank", value: "Ready", icon: "📚", border: "border-yellow-100", color: "text-yellow-600" },
            { label: "Patterns", value: "Ready", icon: "⚡", border: "border-purple-100", color: "text-purple-700" },
          ].map((s) => (
            <div key={s.label} className={"bg-white rounded-2xl p-4 shadow-sm border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md " + s.border}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs">{s.label}</p>
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className={"font-bold text-2xl " + s.color}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setShowMockForm(true)}
            className="px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
            + Create Mock Test
          </button>
          <button onClick={() => setShowStudentForm(true)} className="btn-gold text-sm">
            + Add Student
          </button>
          <Link href="/teacher/students"
            className="px-4 py-2.5 rounded-xl font-medium border border-navy text-navy bg-white hover:bg-navy hover:text-white transition text-sm">
            Manage Students
          </Link>
          <Link href="/teacher/question-bank"
            className="px-4 py-2.5 rounded-xl font-medium border border-gold text-gold bg-white hover:bg-gold hover:text-navy transition text-sm">
            Question Bank
          </Link>
          <Link href="/teacher/exam-patterns"
            className="px-4 py-2.5 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm">
            Exam Patterns
          </Link>
        </div>

        {/* Mock Tests */}
        <h2 className="font-bold text-navy text-lg mb-4">Your Mock Tests</h2>
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400">Loading your tests...</p>
          </div>
        ) : mocks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-blue-200 rounded-2xl bg-white/60">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-gray-400 mb-4">No mock tests yet.</p>
            <button onClick={() => setShowMockForm(true)}
              className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
              Create your first test
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {mocks.map((m) => (
              <div key={m.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    {m.exam_name && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium inline-block mb-2">
                        {m.exam_name}
                      </span>
                    )}
                    <h3 className="font-bold text-navy truncate">{m.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{m.duration_minutes} min - {m.total_marks} marks</p>
                    {m.expected_cutoff && (
                      <p className="text-xs text-orange-600 mt-0.5">Expected Cutoff: {m.expected_cutoff} marks</p>
                    )}
                  </div>
                  <span className="text-xs bg-blue-50 text-navy border border-blue-100 px-2 py-1 rounded-lg font-medium ml-2 flex-shrink-0">
                    {m.duration_minutes} min
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-gray-600">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate"><span className="text-gray-400">Link:</span> {typeof window !== "undefined" ? window.location.origin : ""}/exam/{m.id}</p>
                      <p className="mt-1"><span className="text-gray-400">Password:</span> <span className="text-navy font-mono font-bold">{m.access_password}</span></p>
                    </div>
                    <CopyButton text={(typeof window !== "undefined" ? window.location.origin : "") + "/exam/" + m.id + "\nPassword: " + m.access_password} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={"/teacher/mocks/" + m.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy text-white hover:bg-blue-900 transition">
                    Questions
                  </Link>
                  <Link href={"/teacher/mocks/" + m.id + "/results"}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition">
                    Results
                  </Link>
                  <Link href={"/teacher/mocks/" + m.id + "/assign"}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition">
                    Assign
                  </Link>
                  <Link href={"/teacher/mocks/" + m.id + "/leaderboard"}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition">
                    Leaderboard
                  </Link>
                  <button onClick={() => setEditingMock(m)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(m.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition ml-auto">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showMockForm && <CreateMockModal onClose={() => setShowMockForm(false)} onCreated={loadMocks} />}
      {showStudentForm && <AddStudentModal mocks={mocks} onClose={() => setShowStudentForm(false)} />}
      {editingMock && <EditMockModal mock={editingMock} onClose={() => setEditingMock(null)} onSaved={loadMocks} />}
    </div>
  );
}

function CreateMockModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "", exam_name: "", duration_minutes: 120,
    negative_marking: 0, access_password: "", instructions: "",
    expected_cutoff: "" as any, cutoff_note: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/mocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        expected_cutoff: form.expected_cutoff ? Number(form.expected_cutoff) : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="font-bold text-navy text-lg mb-4">Create Mock Test</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Mock Title</label>
            <input className="input-field mt-1" placeholder="e.g. JOA IT Mock Test 1" required
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400">Exam Name</label>
            <input className="input-field mt-1" placeholder="e.g. HPSSC, JOA IT, HPRCA"
              value={form.exam_name} onChange={(e) => setForm({ ...form, exam_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Duration (minutes)</label>
              <input type="number" className="input-field mt-1" required
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
            <label className="text-xs text-gray-400">Access Password</label>
            <input className="input-field mt-1" placeholder="Students use this to enter the test" required
              value={form.access_password}
              onChange={(e) => setForm({ ...form, access_password: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400">Instructions (optional)</label>
            <textarea className="input-field mt-1" placeholder="Instructions for students"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          </div>
          <div className="border border-orange-100 rounded-xl p-3 bg-orange-50/30">
            <p className="text-xs font-medium text-orange-700 mb-2">Expected Cutoff (optional)</p>
            <div>
              <label className="text-xs text-gray-400">Cutoff Marks</label>
              <input type="number" className="input-field mt-1" placeholder="e.g. 120"
                value={form.expected_cutoff}
                onChange={(e) => setForm({ ...form, expected_cutoff: e.target.value })} />
            </div>
            <div className="mt-2">
              <label className="text-xs text-gray-400">Cutoff Note</label>
              <input className="input-field mt-1"
                placeholder="e.g. Based on 2023 paper trends. Estimated only."
                value={form.cutoff_note}
                onChange={(e) => setForm({ ...form, cutoff_note: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Creating..." : "Create Mock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditMockModal({ mock, onClose, onSaved }: { mock: Mock; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: mock.title,
    exam_name: mock.exam_name || "",
    duration_minutes: mock.duration_minutes,
    negative_marking: mock.negative_marking || 0,
    passing_marks: mock.passing_marks || 0,
    access_password: mock.access_password,
    instructions: mock.instructions || "",
    show_result_immediately: mock.show_result_immediately !== false,
    show_correct_answers: mock.show_correct_answers !== false,
    leaderboard_enabled: mock.leaderboard_enabled !== false,
    expected_cutoff: mock.expected_cutoff || "" as any,
    cutoff_note: mock.cutoff_note || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/mocks/" + mock.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        expected_cutoff: form.expected_cutoff ? Number(form.expected_cutoff) : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to save"); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="font-bold text-navy text-lg mb-4">Edit Mock Test</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Title</label>
            <input className="input-field mt-1" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400">Exam Name</label>
            <input className="input-field mt-1" value={form.exam_name}
              onChange={(e) => setForm({ ...form, exam_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Duration (min)</label>
              <input type="number" className="input-field mt-1" required value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Negative Marking</label>
              <input type="number" step="0.25" className="input-field mt-1" value={form.negative_marking}
                onChange={(e) => setForm({ ...form, negative_marking: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Access Password</label>
            <input className="input-field mt-1" required value={form.access_password}
              onChange={(e) => setForm({ ...form, access_password: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400">Instructions</label>
            <textarea className="input-field mt-1" value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          </div>
          <div className="border border-orange-100 rounded-xl p-3 bg-orange-50/30">
            <p className="text-xs font-medium text-orange-700 mb-2">Expected Cutoff (optional)</p>
            <div>
              <label className="text-xs text-gray-400">Cutoff Marks</label>
              <input type="number" className="input-field mt-1" placeholder="e.g. 120"
                value={form.expected_cutoff}
                onChange={(e) => setForm({ ...form, expected_cutoff: e.target.value })} />
            </div>
            <div className="mt-2">
              <label className="text-xs text-gray-400">Cutoff Note</label>
              <input className="input-field mt-1"
                placeholder="e.g. Based on 2023 paper trends. Estimated only."
                value={form.cutoff_note}
                onChange={(e) => setForm({ ...form, cutoff_note: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.show_result_immediately}
                onChange={(e) => setForm({ ...form, show_result_immediately: e.target.checked })} />
              Show result immediately after submit
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.show_correct_answers}
                onChange={(e) => setForm({ ...form, show_correct_answers: e.target.checked })} />
              Show correct answers after submit
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.leaderboard_enabled}
                onChange={(e) => setForm({ ...form, leaderboard_enabled: e.target.checked })} />
              Enable leaderboard for this test
            </label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddStudentModal({ mocks, onClose }: { mocks: Mock[]; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", attempts_allowed: 3 });
  const [selectedMocks, setSelectedMocks] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(""); setSuccess("");
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, mock_ids: selectedMocks }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess("Student " + data.student.name + " created successfully.");
    setForm({ name: "", email: "", phone: "", password: "", attempts_allowed: 3 });
    setSelectedMocks([]);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="font-bold text-navy text-lg mb-4">Add Student</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Student Name</label>
            <input className="input-field mt-1" placeholder="Full name" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400">Email (optional if phone given)</label>
            <input className="input-field mt-1" placeholder="student@email.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400">Phone (optional if email given)</label>
            <input className="input-field mt-1" placeholder="9876543210"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400">Unique Password</label>
            <input className="input-field mt-1" placeholder="e.g. HP-R001" required
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400">Attempts Allowed</label>
            <input type="number" className="input-field mt-1" min={1}
              value={form.attempts_allowed}
              onChange={(e) => setForm({ ...form, attempts_allowed: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Assign to tests</label>
            <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50">
              {mocks.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-navy p-1">
                  <input type="checkbox" checked={selectedMocks.includes(m.id)}
                    onChange={(e) => setSelectedMocks(e.target.checked
                      ? [...selectedMocks, m.id]
                      : selectedMocks.filter((id) => id !== m.id))} />
                  {m.title}
                </label>
              ))}
              {mocks.length === 0 && <p className="text-xs text-gray-400 p-1">Create a mock test first.</p>}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition">
              Close
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}