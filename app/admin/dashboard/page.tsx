"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Teacher = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

type Student = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_disabled: boolean;
  attempts_allowed: number;
  teacher_id: string;
  teachers: { name: string } | null;
};

type Log = {
  id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  ip_address: string;
  logged_in_at: string;
};

type Stats = {
  total_teachers: number;
  total_students: number;
  total_mocks: number;
  total_attempts: number;
  total_logins: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "teachers" | "students" | "logs">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [message, setMessage] = useState("");

  async function loadAll() {
    setLoading(true);
    const [statsRes, teachersRes, studentsRes, logsRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/teachers"),
      fetch("/api/admin/students"),
      fetch("/api/admin/logs?limit=50"),
    ]);

    if (statsRes.status === 401) { router.push("/login"); return; }

    const [statsData, teachersData, studentsData, logsData] = await Promise.all([
      statsRes.json(),
      teachersRes.json(),
      studentsRes.json(),
      logsRes.json(),
    ]);

    setStats(statsData);
    setTeachers(teachersData.teachers || []);
    setStudents(studentsData.students || []);
    setLogs(logsData.logs || []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function deleteTeacher(id: string, name: string) {
    if (!window.confirm("Delete teacher " + name + "? This removes all their mocks and students too.")) return;
    const res = await fetch("/api/admin/teachers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: id }),
    });
    if (res.ok) { setMessage("Teacher deleted."); loadAll(); }
  }

  async function deleteStudent(id: string, name: string) {
    if (!window.confirm("Delete student " + name + "?")) return;
    const res = await fetch("/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: id }),
    });
    if (res.ok) { setMessage("Student deleted."); loadAll(); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="font-bold text-navy">HP <span className="text-gold">Exam Achievers</span></div>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-medium">Super Admin</span>
          <Link href="/" className="text-xs text-gray-400 hover:text-navy transition">Home</Link>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition">Logout</button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {message && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
            {message}
            <button onClick={() => setMessage("")} className="ml-3 underline">Dismiss</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          {(["overview", "teachers", "students", "logs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={"px-5 py-2.5 rounded-lg font-medium text-sm capitalize transition " + (
                tab === t ? "bg-navy text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-navy"
              )}
            >
              {t === "overview" ? "Overview" : t === "teachers" ? "Teachers" : t === "students" ? "Students" : "Login Logs"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {tab === "overview" && stats && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  <StatCard label="Teachers" value={stats.total_teachers} color="text-blue-600" bg="bg-blue-50" />
                  <StatCard label="Students" value={stats.total_students} color="text-green-600" bg="bg-green-50" />
                  <StatCard label="Mock Tests" value={stats.total_mocks} color="text-yellow-600" bg="bg-yellow-50" />
                  <StatCard label="Submitted" value={stats.total_attempts} color="text-purple-600" bg="bg-purple-50" />
                  <StatCard label="Total Logins" value={stats.total_logins} color="text-red-600" bg="bg-red-50" />
                </div>

                <h2 className="font-semibold text-navy mb-3">Recent Login Activity</h2>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">User</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">IP</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-medium text-navy">{log.user_name}</p>
                            <p className="text-xs text-gray-400">{log.user_email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={"text-xs px-2 py-1 rounded-lg font-medium " + (
                              log.user_role === "teacher" ? "bg-blue-50 text-blue-700" :
                              log.user_role === "admin" ? "bg-red-50 text-red-700" :
                              "bg-green-50 text-green-700"
                            )}>
                              {log.user_role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{log.ip_address}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(log.logged_in_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "teachers" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-navy text-lg">All Teachers ({teachers.length})</h2>
                  <button onClick={() => setShowAddTeacher(true)} className="btn-primary text-sm">
                    + Add Teacher
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((t) => (
                        <tr key={t.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-3 font-medium text-navy">{t.name}</td>
                          <td className="px-4 py-3 text-gray-500">{t.email}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => setEditTeacher(t)} className="text-xs text-navy underline">Edit</button>
                              <button onClick={() => deleteTeacher(t.id, t.name)} className="text-xs text-red-500 underline">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "students" && (
              <div>
                <h2 className="font-semibold text-navy text-lg mb-4">All Students ({students.length})</h2>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Contact</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Teacher</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-3 font-medium text-navy">{s.name}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{s.email || s.phone}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{s.teachers?.name || "Unknown"}</td>
                          <td className="px-4 py-3">
                            <span className={"text-xs px-2 py-1 rounded-lg " + (s.is_disabled ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700")}>
                              {s.is_disabled ? "Disabled" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => setEditStudent(s)} className="text-xs text-navy underline">Edit</button>
                              <button onClick={() => deleteStudent(s.id, s.name)} className="text-xs text-red-500 underline">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "logs" && (
              <div>
                <h2 className="font-semibold text-navy text-lg mb-4">Login Activity ({logs.length} recent)</h2>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">User</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">IP Address</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Device</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-medium text-navy">{log.user_name}</p>
                            <p className="text-xs text-gray-400">{log.user_email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={"text-xs px-2 py-1 rounded-lg font-medium " + (
                              log.user_role === "teacher" ? "bg-blue-50 text-blue-700" :
                              log.user_role === "admin" ? "bg-red-50 text-red-700" :
                              "bg-green-50 text-green-700"
                            )}>
                              {log.user_role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{log.ip_address}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{log.user_agent}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.logged_in_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showAddTeacher && (
        <AddTeacherModal
          onClose={() => setShowAddTeacher(false)}
          onSaved={() => { setShowAddTeacher(false); setMessage("Teacher created."); loadAll(); }}
        />
      )}

      {editTeacher && (
        <EditTeacherModal
          teacher={editTeacher}
          onClose={() => setEditTeacher(null)}
          onSaved={() => { setEditTeacher(null); setMessage("Teacher updated."); loadAll(); }}
        />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSaved={() => { setEditStudent(null); setMessage("Student updated."); loadAll(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={"rounded-2xl p-5 border border-gray-100 shadow-sm " + bg}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={"font-display font-bold text-3xl " + color}>{value}</p>
    </div>
  );
}

function AddTeacherModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="font-semibold text-navy text-lg mb-4">Add New Teacher</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input-field" placeholder="Full Name" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" placeholder="Email" required type="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input-field" placeholder="Password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? "Creating..." : "Create Teacher"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTeacherModal({ teacher, onClose, onSaved }: { teacher: Teacher; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(teacher.name);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body: any = { teacher_id: teacher.id, name };
    if (newPassword) body.new_password = newPassword;
    const res = await fetch("/api/admin/teachers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="font-semibold text-navy text-lg mb-1">Edit Teacher</h2>
        <p className="text-sm text-gray-400 mb-4">{teacher.email}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Name</label>
            <input className="input-field mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-gray-400">New Password (leave blank to keep current)</label>
            <input className="input-field mt-1" placeholder="New password"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStudentModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [attempts, setAttempts] = useState(student.attempts_allowed);
  const [disabled, setDisabled] = useState(student.is_disabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body: any = { student_id: student.id, attempts_allowed: attempts, is_disabled: disabled };
    if (newPassword) body.new_password = newPassword;
    const res = await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="font-semibold text-navy text-lg mb-1">Edit Student</h2>
        <p className="text-sm text-gray-400 mb-4">{student.name} - Teacher: {student.teachers?.name}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">New Password (leave blank to keep current)</label>
            <input className="input-field mt-1" placeholder="New password"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400">Attempts Allowed</label>
            <input type="number" className="input-field mt-1"
              value={attempts} onChange={(e) => setAttempts(Number(e.target.value))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
            Account disabled
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}