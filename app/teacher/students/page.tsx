"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  attempts_allowed: number;
  is_disabled: boolean;
};

export default function ManageStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/students");
    if (res.status === 401) { router.push("/login?role=teacher"); return; }
    const data = await res.json();
    setStudents(data.students || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/teacher/dashboard" className="text-sm text-navy">Back</Link>
        <div className="font-semibold">Manage Students</div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : students.length === 0 ? (
          <p className="text-gray-500">No students added yet.</p>
        ) : (
          <div className="space-y-3">
            {students.map((s) => (
              <StudentRow
                key={s.id}
                student={s}
                isEditing={editingId === s.id}
                onEditToggle={() => setEditingId(editingId === s.id ? null : s.id)}
                onChanged={load}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StudentRow({
  student, isEditing, onEditToggle, onChanged,
}: {
  student: Student;
  isEditing: boolean;
  onEditToggle: () => void;
  onChanged: () => void;
}) {
  const [attempts, setAttempts] = useState(student.attempts_allowed);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function patch(body: Record<string, any>) {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMessage(data.error || "Failed to update"); return; }
    setMessage("Saved.");
    onChanged();
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Remove ${student.name}? This deletes their account and all their results.`);
    if (!confirmed) return;
    const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
    if (res.ok) onChanged();
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-medium">
            {student.name}
            {student.is_disabled && <span className="ml-2 text-xs text-red-600">(disabled)</span>}
          </p>
          <p className="text-xs text-gray-500">{student.email || student.phone}</p>
          <p className="text-xs text-gray-500">Attempts allowed: {student.attempts_allowed}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={onEditToggle} className="text-navy underline">
            {isEditing ? "Close" : "Manage"}
          </button>
          <button onClick={handleDelete} className="text-red-600 underline">Delete</button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <div>
            <label className="text-xs text-gray-500">Reset attempts allowed</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                className="input-field"
                value={attempts}
                onChange={(e) => setAttempts(Number(e.target.value))}
              />
              <button
                onClick={() => patch({ attempts_allowed: attempts })}
                disabled={saving}
                className="btn-primary text-sm whitespace-nowrap"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              This sets the total attempts allowed, not the count used so far. If a student used 1 of 3
              and you want to give them a fresh full set, set this higher than their current allowance
              (e.g. raise it by however many extra attempts they need).
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500">Set a new password</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                className="input-field"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                onClick={() => { patch({ new_password: newPassword }); setNewPassword(""); }}
                disabled={saving || !newPassword}
                className="btn-primary text-sm whitespace-nowrap"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Account status</span>
            <button
              onClick={() => patch({ is_disabled: !student.is_disabled })}
              disabled={saving}
              className="text-sm border rounded-lg px-3 py-1"
            >
              {student.is_disabled ? "Enable account" : "Disable account"}
            </button>
          </div>

          {message && <p className="text-xs text-green-600">{message}</p>}
        </div>
      )}
    </div>
  );
}