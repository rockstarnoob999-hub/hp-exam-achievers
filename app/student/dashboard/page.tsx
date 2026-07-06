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

  const avgAccuracy = completedAttempts.length
    ? Math.round(
        completedAttempts.reduce((sum, a) => {
          const total = a.correct_count + a.wrong_count;
          return sum + (total ? (a.correct_count / total) * 100 : 0);
        }, 0) / completedAttempts.length
      )
    : 0;

  const overallBest = completedAttempts.length
    ? Math.max(...completedAttempts.map((a) => a.score || 0))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="font-bold text-navy">HP <span className="text-gold">Exam Achievers</span></div>
          <Link href="/" className="text-xs text-gray-400 hover:text-navy transition">Home</Link>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition">Logout</button>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl p-7 mb-8 text-white"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)" }}>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-white/5 rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-blue-200 text-sm mb-2">Welcome Back</p>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">Ready to Crack Your Next Exam?</h1>
              <p className="text-blue-100/90 text-sm leading-relaxed max-w-lg">
                Every mock test brings you one step closer to success. Practice consistently and improve your score every day.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <span className="bg-white/20 border border-white/30 px-4 py-1.5 rounded-full text-sm font-medium">
                  {mocks.length} Tests Assigned
                </span>
                <span className="bg-white/20 border border-white/30 px-4 py-1.5 rounded-full text-sm font-medium">
                  {completedAttempts.length} Completed
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white/15 border border-white/25 rounded-2xl p-5 text-center w-36">
              <p className="text-blue-200 text-xs mb-2">Keep Going</p>
              <p className="text-5xl mb-2">🚀</p>
              <p className="text-white/70 text-xs">Success starts today</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Assigned Tests" value={mocks.length} icon="📚" border="border-blue-200" iconBg="bg-blue-100" valueColor="text-blue-700" />
          <StatCard label="Completed" value={completedAttempts.length} icon="✅" border="border-green-200" iconBg="bg-green-100" valueColor="text-green-700" />
          <StatCard label="Best Score" value={overallBest} icon="🏆" border="border-yellow-200" iconBg="bg-yellow-100" valueColor="text-yellow-600" />
          <StatCard label="Avg Accuracy" value={avgAccuracy + "%"} icon="🎯" border="border-purple-200" iconBg="bg-purple-100" valueColor="text-purple-700" />
        </div>

        {/* Mock Tests */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400">Loading your tests...</p>
          </div>
        ) : mocks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-blue-200 rounded-2xl bg-white/60">
            <p className="text-gray-400 mb-2">No tests assigned yet.</p>
            <p className="text-gray-300 text-sm">Contact your teacher to get access to a test.</p>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-navy text-lg mb-4">Your Mock Tests</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {mocks.map((m) => {
                const used = attemptsUsed(m.id);
                const remaining = 3 - used;
                const best = bestScore(m.id);
                const exhausted = remaining <= 0;
                return (
                  <div
                    key={m.id}
                    className={"bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 hover:-translate-y-1 hover:shadow-md " + (exhausted ? "border-red-100 opacity-70" : "border-blue-100")}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        {m.exam_name && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-medium inline-block mb-2">
                            {m.exam_name}
                          </span>
                        )}
                        <h3 className="font-bold text-navy text-lg">{m.title}</h3>
                        <p className="text-gray-400 text-sm mt-1">Practice regularly and improve your score.</p>
                      </div>
                      <span className="text-3xl ml-3">📝</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <MiniStat label="Marks" value={m.total_marks} />
                      <MiniStat
                        label="Attempts Left"
                        value={remaining <= 0 ? "None" : remaining}
                        color={remaining <= 0 ? "text-red-500" : remaining === 1 ? "text-yellow-500" : "text-green-600"}
                      />
                      <MiniStat label="Best" value={best ?? "--"} color="text-yellow-500" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={"text-xs px-3 py-1.5 rounded-full font-medium border " + (exhausted ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-700 border-green-200")}>
                        {exhausted ? "Attempts Exhausted" : "Ready to Start"}
                      </span>
                      {!exhausted && (
                        <Link
                          href={"/exam/" + m.id}
                          className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}
                        >
                          {used === 0 ? "Start Test" : "Retake"}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Recent Results */}
        {completedAttempts.length > 0 && (
          <>
            <div className="mb-4">
              <h2 className="font-bold text-navy text-lg">Recent Results</h2>
              <p className="text-gray-400 text-sm mt-1">Review your previous mock test performance.</p>
            </div>
            <div className="space-y-3">
              {completedAttempts.map((a) => {
                const accuracy = a.correct_count + a.wrong_count > 0
                  ? ((a.correct_count / (a.correct_count + a.wrong_count)) * 100).toFixed(0)
                  : "0";
                return (
                  <Link
                    key={a.id}
                    href={"/result/" + a.id}
                    className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-blue-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <p className="font-bold text-navy">{a.mocks?.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Attempt {a.attempt_number} - {new Date(a.submitted_at).toLocaleDateString()}
                        {a.status === "auto_submitted" && " - Auto submitted"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl text-gold">{a.score} pts</p>
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
                        {accuracy}% accuracy
                      </span>
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

function MiniStat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={"font-bold text-sm " + (color || "text-navy")}>{value}</p>
    </div>
  );
}