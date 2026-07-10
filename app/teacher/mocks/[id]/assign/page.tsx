"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  attempts_allowed: number;
  is_disabled: boolean;
  assigned: boolean;
};

export default function AssignStudentsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mockTitle, setMockTitle] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("all");

  async function load() {
    const res = await fetch("/api/mocks/" + id + "/assign");
    if (res.status === 401) { router.push("/login?role=teacher"); return; }
    const data = await res.json();
    setMockTitle(data.mock?.title || "");
    setStudents(data.students || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleAssign() {
    if (selected.size === 0) { setError("Select at least one student."); return; }
    setSaving(true);
    setMessage(""); setError("");
    const res = await fetch("/api/mocks/" + id + "/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_ids: [...selected], action: "assign" }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setMessage(data.count + " student(s) assigned successfully.");
    setSelected(new Set());
    load();
  }

  async function handleUnassign() {
    if (selected.size === 0) { setError("Select at least one student."); return; }
    if (!window.confirm("Unassign " + selected.size + " student(s) from this test? They will lose access.")) return;
    setSaving(true);
    setMessage(""); setError("");
    const res = await fetch("/api/mocks/" + id + "/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_ids: [...selected], action: "unassign" }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setMessage(data.count + " student(s) unassigned.");
    setSelected(new Set());
    load();
  }

  function toggleStudent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    const ids = filtered.map((s) => s.id);
    setSelected(new Set(ids));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || "").includes(search);
    const matchFilter =
      filter === "all" ||
      (filter === "assigned" && s.assigned) ||
      (filter === "unassigned" && !s.assigned);
    return matchSearch && matchFilter;
  });

  const assignedCount = students.filter((s) => s.assigned).length;
  const unassignedCount = students.filter((s) => !s.assigned).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/teacher/dashboard" className="text-sm text-gray-400 hover:text-navy transition flex-shrink-0">Back</Link>
          <div className="w-px h-4 bg-gray-200 flex-shrink-0"></div>
          <div className="min-w-0">
            <p className="font-semibold text-navy truncate text-sm md:text-base">{mockTitle || "Assign Students"}</p>
            <p className="text-xs text-gray-400">{assignedCount} assigned - {unassignedCount} unassigned</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href={"/teacher/mocks/" + id + "/results"}
            className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition">
            View Results
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        {message && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex justify-between">
            {message}
            <button onClick={() => setMessage("")} className="text-green-500 font-bold ml-2">x</button>
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex justify-between">
            {error}
            <button onClick={() => setError("")} className="text-red-400 font-bold ml-2">x</button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Total Students</p>
            <p className="font-bold text-2xl text-navy">{students.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Assigned</p>
            <p className="font-bold text-2xl text-green-600">{assignedCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Unassigned</p>
            <p className="font-bold text-2xl text-orange-500">{unassignedCount}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            className="input-field flex-1"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            {(["all", "assigned", "unassigned"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={"px-3 py-2 rounded-lg text-xs font-medium border transition capitalize " + (
                  filter === f ? "bg-navy text-white border-navy" : "bg-white border-gray-200 text-gray-600"
                )}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-navy font-medium">{selected.size} selected</p>
            <button onClick={handleAssign} disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-blue-900 transition disabled:opacity-50">
              {saving ? "Saving..." : "Assign Selected"}
            </button>
            <button onClick={handleUnassign} disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition disabled:opacity-50">
              Unassign Selected
            </button>
            <button onClick={clearSelection} className="text-xs text-gray-500 underline">Clear</button>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">{filtered.length} students shown</p>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-navy underline">Select All</button>
            {selected.size > 0 && (
              <button onClick={clearSelection} className="text-xs text-gray-400 underline">Clear</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400">Loading students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-400 mb-1">No students found.</p>
            <p className="text-gray-300 text-sm">Add students from the dashboard first.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id}
                onClick={() => toggleStudent(s.id)}
                className={"bg-white rounded-2xl border p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 " + (
                  selected.has(s.id)
                    ? "border-navy bg-blue-50 shadow-sm"
                    : s.assigned
                    ? "border-green-200 hover:border-green-300"
                    : "border-gray-200 hover:border-blue-200"
                )}>
                <div className={"w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition " + (
                  selected.has(s.id) ? "border-navy bg-navy" : "border-gray-300"
                )}>
                  {selected.has(s.id) && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                <div className={"w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 " + (
                  s.assigned ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {s.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-navy text-sm">{s.name}</p>
                    {s.is_disabled && (
                      <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">Disabled</span>
                    )}
                    {s.assigned ? (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Assigned</span>
                    ) : (
                      <span className="text-xs bg-gray-50 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">Not assigned</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{s.email || s.phone}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{s.attempts_allowed} attempts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}