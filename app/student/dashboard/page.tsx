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
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)" }}>
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="font-bold text-navy">HP <span className="text-gold">Exam Achievers</span></div>
          <Link href="/" className="text-xs text-gray-400 hover:text-navy transition">Home</Link>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition">Logout</button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div
  className="relative overflow-hidden rounded-3xl p-8 mb-8 text-white"
  style={{
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%)",
  }}
>
  {/* Decorative circles */}
  <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full"></div>
  <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full"></div>

  <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-blue-200 text-sm mb-2">
        Welcome Back 👋
      </p>

      <h1 className="text-4xl font-bold mb-3">
        Ready to Crack Your Next Exam?
      </h1>

      <p className="text-blue-100 max-w-2xl leading-7">
        Every mock test brings you one step closer to success.
        Practice consistently, analyze your mistakes, and improve your score every day.
      </p>

      <div className="flex flex-wrap gap-3 mt-6">
        <span className="bg-white/15 px-4 py-2 rounded-full text-sm">
          📚 {mocks.length} Assigned Tests
        </span>

        <span className="bg-white/15 px-4 py-2 rounded-full text-sm">
          ✅ {completedAttempts.length} Completed
        </span>
      </div>
    </div>

    <div className="mt-8 md:mt-0">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center shadow-xl">
        <p className="text-blue-100 text-sm">
          Keep Learning
        </p>

        <p className="text-5xl font-bold mt-2">
          🚀
        </p>

        <p className="text-sm text-blue-200 mt-4">
          Your success starts with today's practice.
        </p>
      </div>
    </div>
  </div>
</div>
{/* Dashboard Statistics */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">

  <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 hover:shadow-xl transition duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Assigned Tests</p>
        <h2 className="text-3xl font-bold text-navy mt-2">
          {mocks.length}
        </h2>
      </div>

      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
        📚
      </div>
    </div>
  </div>

  <div className="bg-white rounded-2xl shadow-md border border-green-100 p-6 hover:shadow-xl transition duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Completed</p>
        <h2 className="text-3xl font-bold text-green-600 mt-2">
          {completedAttempts.length}
        </h2>
      </div>

      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-3xl">
        ✅
      </div>
    </div>
  </div>

  <div className="bg-white rounded-2xl shadow-md border border-yellow-100 p-6 hover:shadow-xl transition duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Best Score</p>

        <h2 className="text-3xl font-bold text-yellow-500 mt-2">
          {completedAttempts.length
            ? Math.max(...completedAttempts.map(a => a.score || 0))
            : 0}
        </h2>
        <p className="text-xs text-gray-400 mt-1">
  🏆 Completed Mock Test
</p>
      </div>

      <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-3xl">
        🏆
      </div>
    </div>
  </div>

  <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-6 hover:shadow-xl transition duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Average Accuracy</p>

        <h2 className="text-3xl font-bold text-purple-600 mt-2">
          {completedAttempts.length
            ? Math.round(
                completedAttempts.reduce((sum, a) => {
                  const total = a.correct_count + a.wrong_count;
                  return (
                    sum +
                    (total
                      ? (a.correct_count / total) * 100
                      : 0)
                  );
                }, 0) / completedAttempts.length
              )
            : 0}
          %
        </h2>
      </div>

      <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-3xl">
        🎯
      </div>
    </div>
  </div>

</div>
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
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {mocks.map((m) => {
              const used = attemptsUsed(m.id);
              const remaining = 3 - used;
              const best = bestScore(m.id);
              const exhausted = remaining <= 0;

              return (
                <div
                  key={m.id}
                  className={"bg-white/80 backdrop-blur-sm border rounded-2xl p-5 shadow-sm transition " + (exhausted ? "border-red-100 opacity-60" : "border-blue-100 hover:shadow-md hover:border-blue-200")}
                >
                  <div className="flex justify-between items-start mb-4">
  <div>
    <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
      {m.exam_name}
    </span>

    <h3 className="font-bold text-xl text-navy mt-3">
      {m.title}
    </h3>

    <p className="text-gray-500 text-sm mt-2">
      Practice regularly and improve your score.
    </p>
  </div>

  <div className="text-4xl">
    📝
  </div>
</div>

                  <div className="grid grid-cols-3 gap-3 mb-5">

  <div className="bg-gray-50 rounded-xl p-3 text-center">
    <p className="text-xs text-gray-500">Marks</p>
    <p className="font-bold text-navy mt-1">
      📚 {m.total_marks}
    </p>
  </div>

  <div className="bg-gray-50 rounded-xl p-3 text-center">
    <p className="text-xs text-gray-500">Attempts</p>
    <p className={`font-bold mt-1 ${
      remaining <= 0
        ? "text-red-500"
        : remaining === 1
        ? "text-yellow-500"
        : "text-green-600"
    }`}>
      🔄 {remaining <= 0 ? "None" : remaining}
    </p>
  </div>

  <div className="bg-gray-50 rounded-xl p-3 text-center">
    <p className="text-xs text-gray-500">Best</p>
    <p className="font-bold text-yellow-500 mt-1">
      ⭐ {best ?? "--"}
    </p>
  </div>

</div>

                 <div className="flex items-center justify-between mt-6">

  <div>
    {remaining <= 0 ? (
      <span className="bg-red-100 text-red-600 px-3 py-2 rounded-full text-sm font-semibold">
        ❌ Attempts Exhausted
      </span>
    ) : (
      <span className="bg-green-100 text-green-700 px-3 py-2 rounded-full text-sm font-semibold">
        ✅ Ready to Start
      </span>
    )}
  </div>

  {!exhausted && (
    <Link
      href={"/exam/" + m.id}
      className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
      style={{
        background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
      }}
    >
      {used === 0 ? "🚀 Start Test" : "🔄 Retake"}
    </Link>
  )}

</div>
                </div>
              );
            })}
          </div>
        )}

        {completedAttempts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
  <div>
    <h2 className="text-2xl font-bold text-navy">
      📈 Recent Results
    </h2>

    <p className="text-gray-500 text-sm mt-1">
      Review your previous mock test performance.
    </p>
  </div>
</div>
            <div className="space-y-2">
              {completedAttempts.map((a) => {
                const accuracy = a.correct_count + a.wrong_count > 0
                  ? ((a.correct_count / (a.correct_count + a.wrong_count)) * 100).toFixed(0)
                  : "0";
                return (
                  <Link
                    key={a.id}
                    href={"/result/" + a.id}
                    className="flex items-center justify-between bg-white/80 border border-blue-100 rounded-xl px-5 py-4 hover:shadow-md hover:border-blue-200 transition"
                  >
                    <div>
                      <p className="font-bold text-lg text-navy">{a.mocks?.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Attempt {a.attempt_number} - {new Date(a.submitted_at).toLocaleDateString()}
                        {a.status === "auto_submitted" && " - Auto submitted"}
                      </p>
                    </div>
                    <div className="text-right">
                     <p className="text-3xl font-bold text-yellow-500">{a.score} pts</p>
                     <p className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mt-2">{accuracy}% accuracy</p>
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