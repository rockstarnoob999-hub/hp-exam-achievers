"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentDashboard() {
  const router = useRouter();
  const [mocks, setMocks] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [mocksRes, attemptsRes] = await Promise.all([
      fetch("/api/mocks"),
      fetch("/api/attempts/my"),
    ]);
    if (mocksRes.status === 401) { router.push("/login?role=student"); return; }
    const mocksData = await mocksRes.json();
    const attemptsData = await attemptsRes.json();
    setMocks(mocksData.mocks || []);
    setAttempts(attemptsData.attempts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  function attemptsUsed(mockId: string) {
    return attempts.filter((a) => a.mock_id === mockId).length;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-navy">HP Exam Achievers — Student</div>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600">Logout</button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="font-semibold text-lg mb-3">Your Tests</h2>
        {loading ? <p className="text-gray-500">Loading...</p> : mocks.length === 0 ? (
          <p className="text-gray-500">No tests assigned yet. Contact your teacher.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {mocks.map((m) => {
              const used = attemptsUsed(m.id);
              return (
                <div key={m.id} className="card">
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="text-sm text-gray-500">{m.exam_name}</p>
                  <p className="text-sm text-gray-600 mt-2">Duration: {m.duration_minutes} min · Marks: {m.total_marks}</p>
                  <p className="text-sm text-gray-600">Attempts used: {used}</p>
                  <Link href={`/exam/${m.id}`} className="btn-primary inline-block mt-3 text-sm">
                    Start Test
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <h2 className="font-semibold text-lg mb-3">Past Results</h2>
        {attempts.filter((a) => a.status !== "in_progress").length === 0 ? (
          <p className="text-gray-500">No completed attempts yet.</p>
        ) : (
          <div className="space-y-2">
            {attempts.filter((a) => a.status !== "in_progress").map((a) => (
              <Link key={a.id} href={`/result/${a.id}`} className="card flex justify-between items-center hover:shadow-md transition">
                <div>
                  <p className="font-medium">{a.mocks?.title}</p>
                  <p className="text-xs text-gray-500">Attempt {a.attempt_number} · {new Date(a.submitted_at).toLocaleString()}</p>
                </div>
                <span className="font-semibold text-navy">{a.score} marks</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
