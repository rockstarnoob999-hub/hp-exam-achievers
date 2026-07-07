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
  user_agent: string;
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
  const [search, setSearch] = useState("");

  async function loadAll() {
    setLoading(true);
    const [statsRes, teachersRes, studentsRes, logsRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/teachers"),
      fetch("/api/admin/students"),
      fetch("/api/admin/logs?limit=100"),
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
    if (!window.confirm("Delete teacher " + name + "? This removes all their data.")) return;
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

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").includes(search)
  );

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "teachers", label: "Teachers", icon: "👨‍🏫" },
    { key: "students", label: "Students", icon: "👨‍🎓" },
    { key: "logs", label: "Logs", icon: "📋" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="font-bold text-navy text-sm">HP <span className="text-gold">Exam Achievers</span></div>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-gray-400 hover:text-navy">Home</Link>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition">Logout</button>
        </div>
      </header>

      {message && (
        <div className="mx-4 mt-3 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex justify-between items-center">
          {message}
          <button onClick={() => setMessage("")} className="text-green-500 font-bold ml-3">x</button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-4">

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }}
              className={"flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all " + (
                tab === t.key
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-navy"
              )}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.key === "teachers" && <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{teachers.length}</span>}
              {t.key === "students" && <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{students.length}</span>}
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: "Teachers", value: stats.total_teachers, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: "👨‍🏫" },
                    { label: "Students", value: stats.total_students, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: "👨‍🎓" },
                    { label: "Mocks", value: stats.total_mocks, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: "📝" },
                    { label: "Submitted", value: stats.total_attempts, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: "✅" },
                    { label: "Logins", value: stats.total_logins, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: "🔐" },
                  ].map((s) => (
                    <div key={s.label} className={"bg-white rounded-2xl p-4 border shadow-sm " + s.border}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-500 text-xs">{s.label}</p>
                        <span className="text-xl">{s.icon}</span>
                      </div>
                      <p className={"font-bold text-2xl md:text-3xl " + s.color}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <h3 className="font-semibold text-navy mb-3">Recent Login Activity</h3>
                <div className="space-y-2">
                  {logs.slice(0, 10).map((log) => (
                    <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 flex items-center gap-3">
                      <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 " + (
                        log.user_role === "teacher" ? "bg-blue-100" :
                        log.user_role === "admin" ? "bg-red-100" : "bg-green-100"
                      )}>
                        {log.user_role === "teacher" ? "T" : log.user_role === "admin" ? "A" : "S"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy text-sm truncate">{log.user_name}</p>
                        <p className="text-xs text-gray-400 truncate">{log.user_email}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (
                          log.user_role === "teacher" ? "bg-blue-50 text-blue-700" :
                          log.user_role === "admin" ? "bg-red-50 text-red-700" :
                          "bg-green-50 text-green-700"
                        )}>
                          {log.user_role}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(log.logged_in_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "teachers" && (
              <div>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    className="input-field flex-1"
                    placeholder="Search teachers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button onClick={() => setShowAddTeacher(true)} className="btn-primary text-sm whitespace-nowrap">
                    + Add Teacher
                  </button>
                </div>
                <div className="space-y-2">
                  {filteredTeachers.map((t) => (
                    <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 flex-shrink-0">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-navy truncate">{t.name}</p>
                        <p className="text-xs text-gray-400 truncate">{t.email}</p>
                        <p className="text-xs text-gray-300">{new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setEditTeacher(t)}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                          Edit
                        </button>
                        <button onClick={() => deleteTeacher(t.id, t.name)}
                          className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No teachers found.</p>
                  )}
                </div>
              </div>
            )}

            {tab === "students" && (
              <div>
                <input
                  className="input-field w-full mb-4"
                  placeholder="Search students by name, email or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="space-y-2">
                  {filteredStudents.map((s) => (
                    <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 " + (s.is_disabled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-navy truncate text-sm">{s.name}</p>
                          {s.is_disabled && (
                            <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">Disabled</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{s.email || s.phone}</p>
                        <p className="text-xs text-gray-300">Teacher: {s.teachers?.name || "Unknown"}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setEditStudent(s)}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                          Edit
                        </button>
                        <button onClick={() => deleteStudent(s.id, s.name)}
                          className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No students found.</p>
                  )}
                </div>
              </div>
            )}

            {tab === "logs" && (
              <div>
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {["all", "student", "teacher", "admin"].map((r) => (
                    <button key={r} onClick={() => setSearch(r === "all" ? "" : r)}
                      className={"px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition " + (
                        (r === "all" && search === "") || search === r
                          ? "bg-navy text-white border-navy"
                          : "bg-white border-gray-200 text-gray-600"
                      )}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {logs
                    .filter((l) => !search || l.user_role === search)
                    .map((log) => (
                      <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-3">
                        <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 " + (
                          log.user_role === "teacher" ? "bg-blue-100 text-blue-700" :
                          log.user_role === "admin" ? "bg-red-100 text-red-700" :
                          "bg-green-100 text-green-700"
                        )}>
                          {log.user_role.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <p className="font-medium text-navy text-sm">{log.user_name}</p>
                            <span className="text-xs text-gray-400">{new Date(log.logged_in_at).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{log.user_email}</p>
                          <p className="text-xs text-gray-300">IP: {log.ip_address}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddTeacher && (
        <AddTeacherModal
          onClose={() => setShowAddTeacher(false)}
          onSaved={() => { setShowAddTeacher(false); setMessage("Teacher created successfully."); loadAll(); }}
        />
      )}
      {editTeacher && (
        <EditTeacherModal
          teacher={editTeacher}
          onClose={() => setEditTeacher(null)}
          onSaved={() => { setEditTeacher(null); setMessage("Teacher updated successfully."); loadAll(); }}
        />
      )}
      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSaved={() => { setEditStudent(null); setMessage("Student updated successfully."); loadAll(); }}
        />
      )}
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl">
        <h2 className="font-bold text-navy text-lg mb-4">Add New Teacher</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input-field" placeholder="Full Name" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" placeholder="Email" required type="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input-field" placeholder="Password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Creating..." : "Create Teacher"}
            </button>
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl">
        <h2 className="font-bold text-navy text-lg mb-1">Edit Teacher</h2>
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
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </button>
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl">
        <h2 className="font-bold text-navy text-lg mb-1">Edit Student</h2>
        <p className="text-sm text-gray-400 mb-4">{student.name} - {student.teachers?.name}</p>
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
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
            <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} className="w-4 h-4" />
            <div>
              <p className="text-sm font-medium text-navy">Disable account</p>
              <p className="text-xs text-gray-400">Student will not be able to login</p>
            </div>
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}