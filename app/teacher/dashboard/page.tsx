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
  created_at: string;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [mocks, setMocks] = useState<Mock[]>([]);
  const [showMockForm, setShowMockForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
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

  async function handleDelete(mockId: string, title: string) {
    const confirmed = window.confirm(
      "Delete this test? This will permanently remove the test, all its questions, and all student results. This cannot be undone."
    );
    if (!confirmed) return;
    const res = await fetch("/api/mocks/" + mockId, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete the test.");
      return;
    }
    setMocks((prev) => prev.filter((m) => m.id !== mockId));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-navy">HP Exam Achievers - Teacher</div>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600">Logout</button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => setShowMockForm(true)} className="btn-primary">+ Create Mock Test</button>
          <button onClick={() => setShowStudentForm(true)} className="btn-gold">+ Add Student</button>
          <Link href="/teacher/students" className="px-5 py-2.5 rounded-lg font-medium border border-navy text-navy hover:bg-navy hover:text-white transition">
            Manage Students
          </Link>
        </div>

        <h2 className="font-semibold text-lg mb-3">Your Mock Tests</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : mocks.length === 0 ? (
          <p className="text-gray-500">No mock tests yet. Create one to get started.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {mocks.map((m) => (
              <div key={m.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{m.title}</h3>
                    <p className="text-sm text-gray-500">{m.exam_name}</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-navy px-2 py-1 rounded">{m.duration_minutes} min</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Total Marks: {m.total_marks}</p>
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700 break-all">
                  <strong>Link:</strong> {typeof window !== "undefined" ? window.location.origin : ""}/exam/{m.id}<br/>
                  <strong>Password:</strong> {m.access_password}
                </div>
                <div className="mt-3 flex gap-3 items-center flex-wrap">
                  <Link href={"/teacher/mocks/" + m.id} className="text-sm text-navy underline">Manage Questions</Link>
                  <Link href={"/teacher/mocks/" + m.id + "/leaderboard"} className="text-sm text-navy underline">Leaderboard</Link>
                  <button
                    onClick={() => handleDelete(m.id, m.title)}
                    className="text-sm text-red-600 underline ml-auto"
                  >
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-lg mb-4">Create Mock Test</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input-field" placeholder="Mock Title" required
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input-field" placeholder="Exam Name (e.g. HPSSC)"
            value={form.exam_name} onChange={(e) => setForm({ ...form, exam_name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className="input-field" placeholder="Duration (min)" required
              value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            <input type="number" step="0.25" className="input-field" placeholder="Negative Marking"
              value={form.negative_marking} onChange={(e) => setForm({ ...form, negative_marking: Number(e.target.value) })} />
          </div>
          <input className="input-field" placeholder="Test Access Password" required
            value={form.access_password} onChange={(e) => setForm({ ...form, access_password: e.target.value })} />
          <textarea className="input-field" placeholder="Instructions"
            value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Creating..." : "Create"}</button>
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-lg mb-4">Add Student</h2>
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
            value={form.attempts_allowed} onChange={(e) => setForm({ ...form, attempts_allowed: Number(e.target.value) })} />
          <div>
            <p className="text-sm text-gray-600 mb-1">Assign to tests:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
              {mocks.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedMocks.includes(m.id)}
                    onChange={(e) => {
                      setSelectedMocks(e.target.checked
                        ? [...selectedMocks, m.id]
                        : selectedMocks.filter((id) => id !== m.id));
                    }}
                  />
                  {m.title}
                </label>
              ))}
              {mocks.length === 0 && <p className="text-xs text-gray-400">Create a mock test first.</p>}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2">Close</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : "Add Student"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}