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
  created_at: string;
};

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
    const confirmed = window.confirm("Delete this test? All questions and student results will be permanently removed.");
    if (!confirmed) return;
    const res = await fetch("/api/mocks/" + mockId, { method: "DELETE" });
    if (!res.ok) { alert("Failed to delete the test."); return; }
    setMocks((prev) => prev.filter((m) => m.id !== mockId));
  }

  const activeMocks = mocks.filter((m) => m.total_marks > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="font-bold text-navy">HP <span className="text-gold">Exam Achievers</span></div>
          <Link href="/" className="text-xs text-gray-400 hover:text-navy transition">Home</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/teacher/students" className="text-sm text-gray-500 hover:text-navy transition">Students</Link>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition">Logout</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl p-7 mb-8 text-white"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)" }}>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-white/5 rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-blue-200 text-sm mb-2">Teacher Portal</p>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">Manage Your Mock Tests</h1>
              <p className="text-blue-100/90 text-sm leading-relaxed max-w-lg">
                Create mock tests, manage students, build your question bank and generate exams instantly using patterns.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <span className="bg-white/20 border border-white/30 px-4 py-1.5 rounded-full text-sm font-medium">
                  {mocks.length} Total Tests
                </span>
                <span className="bg-white/20 border border-white/30 px-4 py-1.5 rounded-full text-sm font-medium">
                  {activeMocks.length} Active
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white/15 border border-white/25 rounded-2xl p-5 text-center w-36">
              <p className="text-blue-200 text-xs mb-2">Platform</p>
              <p className="text-5xl mb-2">🎓</p>
              <p className="text-white/70 text-xs">HP Exam Achievers</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Tests" value={mocks.length} icon="📋" border="border-blue-200" iconBg="bg-blue-100" valueColor="text-blue-700" />
          <StatCard label="Active Tests" value={activeMocks.length} icon="✅" border="border-green-200" iconBg="bg-green-100" valueColor="text-green-700" />
          <StatCard label="Question Bank" value="Ready" icon="📚" border="border-yellow-200" iconBg="bg-yellow-100" valueColor="text-yellow-600" />
          <StatCard label="Patterns" value="Ready" icon="⚡" border="border-purple-200" iconBg="bg-purple-100" valueColor="text-purple-700" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => setShowMockForm(true)}
            className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
            + Create Mock Test
          </button>
          <button onClick={() => setShowStudentForm(true)} className="btn-gold text-sm">
            + Add Student
          </button>
          <Link href="/teacher/students"
            className="px-5 py-2.5 rounded-xl font-medium border border-navy text-navy bg-white hover:bg-navy hover:text-white transition text-sm">
            Manage Students
          </Link>
          <Link href="/teacher/question-bank"
            className="px-5 py-2.5 rounded-xl font-medium border border-gold text-gold bg-white hover:bg-gold hover:text-navy transition text-sm">
            Question Bank
          </Link>
          <Link href="/teacher/exam-patterns"
            className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm">
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
                className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    {m.exam_name && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-medium inline-block mb-2">
                        {m.exam_name}
                      </span>
                    )}
                    <h3 className="font-bold text-navy text-lg">{m.title}</h3>
                  </div>
                  <span className="text-xs bg-blue-50 text-navy border border-blue-200 px-2 py-1 rounded-lg font-medium ml-2 flex-shrink-0">
                    {m.duration_minutes} min
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Total Marks</p>
                    <p className="font-bold text-navy">{m.total_marks}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Negative Marking</p>
                    <p className="font-bold text-navy">{m.negative_marking || 0}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-gray-600 break-all">
                  <p><span className="text-gray-400">Link:</span> {typeof window !== "undefined" ? window.location.origin : ""}/exam/{m.id}</p>
                  <p className="mt-1"><span className="text-gray-400">Password:</span> <span className="text-navy font-mono font-bold">{m.access_password}</span></p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
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

function StatCard({ label, value, icon, border, iconBg, valueColor }: {
  label: string; value: any; icon: string;
  border: string; iconBg: string; valueColor: string;
}) {
  return (
    <div className={"bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 hover:-translate-y-1 hover:shadow-md " + border}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-500 text-xs font-medium">{label}</p>
        <div className={"w-10 h-10 rounded-full flex items-center justify-center text-xl " + iconBg}>{icon}</div>
      </div>
      <p className={"font-bold text-3xl " + valueColor}>{value}</p>
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
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to save"); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-blue-100">
        <h2 className="font-semibold text-navy text-lg mb-4">Edit Mock Test</h2>
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
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateMockModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "", exam_name: "", duration_minutes: 30, negative_marking: 0,
    access_password: "", instructions: "",
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
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-blue-100">
        <h2 className="font-semibold text-navy text-lg mb-4">Create Mock Test</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input-field" placeholder="Mock Title" required
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input-field" placeholder="Exam Name (e.g. HPSSC)"
            value={form.exam_name} onChange={(e) => setForm({ ...form, exam_name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className="input-field" placeholder="Duration (min)" required
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            <input type="number" step="0.25" className="input-field" placeholder="Negative Marking"
              value={form.negative_marking}
              onChange={(e) => setForm({ ...form, negative_marking: Number(e.target.value) })} />
          </div>
          <input className="input-field" placeholder="Test Access Password" required
            value={form.access_password}
            onChange={(e) => setForm({ ...form, access_password: e.target.value })} />
          <textarea className="input-field" placeholder="Instructions"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
              {saving ? "Creating..." : "Create"}
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
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-blue-100">
        <h2 className="font-semibold text-navy text-lg mb-4">Add Student</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input-field" placeholder="Student Name" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" placeholder="Email (optional if phone given)"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input-field" placeholder="Phone (optional if email given)"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input-field" placeholder="Unique Password (e.g. HP-R001)" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input type="number" className="input-field" placeholder="Attempts Allowed"
            value={form.attempts_allowed}
            onChange={(e) => setForm({ ...form, attempts_allowed: Number(e.target.value) })} />
          <div>
            <p className="text-sm text-gray-500 mb-1">Assign to tests:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {mocks.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={selectedMocks.includes(m.id)}
                    onChange={(e) => {
                      setSelectedMocks(e.target.checked
                        ? [...selectedMocks, m.id]
                        : selectedMocks.filter((id) => id !== m.id));
                    }} />
                  {m.title}
                </label>
              ))}
              {mocks.length === 0 && <p className="text-xs text-gray-400">Create a mock test first.</p>}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50 transition">
              Close
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
              {saving ? "Saving..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}