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

  function bestScore(mockId: string) {
    const done = attempts.filter((a) => a.mock_id === mockId && a.status !== "in_progress");
    if (done.length === 0) return null;
    return Math.max(...done.map((a) => a.score || 0));
  }

  const completedAttempts = attempts.filter((a) => a.status !== "in_progress");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-slate-700">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-white/5">
        <div className="flex items-center gap-4">
          <div className="font-bold text-white">HP <span className="text-gold">Exam Achievers</span></div>
          <Link href="/" className="text-xs text-white/40 hover:text-white transition">Home</Link>
        </div>
        <button onClick={handleLogout} className="text-sm text-white/50 hover:text-red-400 transition">Logout</button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display font-semibold text-2xl text-white mb-1">My Tests</h1>
          <p className="text-white/50 text-sm">
            {mocks.length} test{mocks.length !== 1 ? "s" : ""} assigned
            {completedAttempts.length > 0 && " - " + completedAttempts.length + " completed"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-white/50">Loading your tests...</p>
          </div>
        ) : mocks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/20 rounded-2xl">
            <p className="text-white/50 mb-2">No tests assigned yet.</p>
            <p className="text-white/30 text-sm">Contact your teacher to get access to a test.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {mocks.map((m) => {
              const used = attemptsUsed(m.id);
              const remaining = 3 - used;
              const best = bestScore(m.id);
              const exhausted = remaining <= 0;

              return (
                <div key={m.id} className={"bg-white/10 backdrop-blur-sm border rounded-2xl p-5 transition " + (exhausted ? "border-white/5 opacity-60" : "border-white/15 hover:bg-white/15")}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{m.title}</h3>
                      <p className="text-sm text-white/50">{m.exam_name}</p>
                    </div>
                    <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-lg">{m.duration_minutes} min</span>
                  </div>

                  <div className="flex gap-4 text-sm mb-4">
                    <div>
                      <p className="text-white/40 text-xs">Total Marks</p>
                      <p className="text-white font-medium">{m.total_marks}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">Attempts Left</p>
                      <p className={"font-medium " + (remaining <= 0 ? "text-red-400" : remaining === 1 ? "text-yellow-400" : "text-green-400")}>
                        {remaining <= 0 ? "None" : remaining}
                      </p>
                    </div>
                    {best !== null && (
                      <div>
                        <p className="text-white/40 text-xs">Best Score</p>
                        <p className="text-gold font-medium">{best}</p>
                      </div>
                    )}
                  </div>

                  {exhausted ? (
                    <p className="text-sm text-red-400/80">All attempts used. Contact your teacher.</p>
                  ) : (
                    <Link href={"/exam/" + m.id} className="inline-block bg-gold text-navy font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition">
                      {used === 0 ? "Start Test" : "Retake Test"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {completedAttempts.length > 0 && (
          <>
            <h2 className="font-semibold text-white mb-3">Past Results</h2>
            <div className="space-y-2">
              {completedAttempts.map((a) => {
                const accuracy = a.correct_count + a.wrong_count > 0
                  ? ((a.correct_count / (a.correct_count + a.wrong_count)) * 100).toFixed(0)
                  : "0";
                return (
                  <Link
                    key={a.id}
                    href={"/result/" + a.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-4 hover:bg-white/10 transition"
                  >
                    <div>
                      <p className="font-medium text-white">{a.mocks?.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Attempt {a.attempt_number} - {new Date(a.submitted_at).toLocaleDateString()}
                        {a.status === "auto_submitted" && " - Auto submitted"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-semibold text-gold">{a.score} pts</p>
                      <p className="text-xs text-white/40">{accuracy}% accuracy</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}