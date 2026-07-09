"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentDashboard() {
  const router = useRouter();
  const [mocks, setMocks] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const testsRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  function scrollTo(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="font-bold text-navy text-sm md:text-base">HP <span className="text-gold">Exam Achievers</span></div>
          <Link href="/" className="text-xs text-gray-400 hover:text-navy transition hidden sm:block">Home</Link>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition">Logout</button>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">

        {/* Compact Hero */}
        <div className="relative overflow-hidden rounded-2xl p-5 mb-6 text-white"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs mb-1">Welcome Back</p>
              <h1 className="text-xl md:text-2xl font-bold">Ready to crack your exam?</h1>
              <p className="text-blue-100/80 text-xs mt-1 hidden sm:block">Practice consistently and improve every day.</p>
            </div>
            <div className="text-4xl">🚀</div>
          </div>
        </div>

        {/* Clickable Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <button onClick={() => scrollTo(testsRef)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md text-left">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium">Assigned Tests</p>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">📚</div>
            </div>
            <p className="font-bold text-3xl text-blue-700">{mocks.length}</p>
            <p className="text-xs text-blue-400 mt-1">Tap to view</p>
          </button>

          <button onClick={() => scrollTo(resultsRef)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-green-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md text-left">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium">Completed</p>
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-lg">✅</div>
            </div>
            <p className="font-bold text-3xl text-green-700">{completedAttempts.length}</p>
            <p className="text-xs text-green-400 mt-1">Tap to view results</p>
          </button>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium">Best Score</p>
              <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-lg">🏆</div>
            </div>
            <p className="font-bold text-3xl text-yellow-600">{overallBest}</p>
            <p className="text-xs text-yellow-400 mt-1">All time best</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium">Avg Accuracy</p>
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-lg">🎯</div>
            </div>
            <p className="font-bold text-3xl text-purple-700">{avgAccuracy}%</p>
            <p className="text-xs text-purple-400 mt-1">Keep improving</p>
          </div>
        </div>

        {/* Mock Tests */}
        <div ref={testsRef} className="scroll-mt-20">
          <h2 className="font-bold text-navy text-lg mb-4">Your Mock Tests</h2>
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-400">Loading your tests...</p>
            </div>
          ) : mocks.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-blue-200 rounded-2xl bg-white/60">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-400 mb-1">No tests assigned yet.</p>
              <p className="text-gray-300 text-sm">Contact your teacher to get access.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {mocks.map((m) => {
                const used = attemptsUsed(m.id);
              const allowed = m.attempts_allowed ?? 3;
              const remaining = allowed - used;;
                const best = bestScore(m.id);
                const exhausted = remaining <= 0;
                return (
                  <div key={m.id}
                    className={"bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 hover:-translate-y-1 hover:shadow-md " +
                      (exhausted ? "border-red-100 opacity-75" : "border-blue-100")}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        {m.exam_name && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium inline-block mb-2">
                            {m.exam_name}
                          </span>
                        )}
                        <h3 className="font-bold text-navy truncate">{m.title}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">{m.duration_minutes} min - {m.total_marks} marks</p>
                      </div>
                      <span className="text-2xl ml-2 flex-shrink-0">📝</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
                        <p className="text-gray-400 text-xs">Marks</p>
                        <p className="font-bold text-navy text-sm">{m.total_marks}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
                        <p className="text-gray-400 text-xs">Attempts</p>
                        <p className={"font-bold text-sm " + (remaining <= 0 ? "text-red-500" : remaining === 1 ? "text-yellow-500" : "text-green-600")}>
                          {remaining <= 0 ? "None" : remaining + " left"}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
                        <p className="text-gray-400 text-xs">Best</p>
                        <p className="font-bold text-yellow-500 text-sm">{best ?? "--"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {exhausted ? (
                        <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full font-medium flex-1 text-center">
                          Attempts Exhausted
                        </span>
                      ) : (
                        <Link href={"/exam/" + m.id}
                          className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm text-center transition-all hover:opacity-90 hover:shadow-lg"
                          style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
                          {used === 0 ? "Start Test" : "Retake"}
                        </Link>
                      )}
                      <Link href={"/leaderboard/" + m.id}
                        className="px-3 py-2.5 rounded-xl text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition font-medium flex-shrink-0">
                       Leader Board
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Results */}
        {completedAttempts.length > 0 && (
          <div ref={resultsRef} className="scroll-mt-20">
            <h2 className="font-bold text-navy text-lg mb-4">Recent Results</h2>
            <div className="space-y-3">
              {completedAttempts.map((a) => {
                const accuracy = a.correct_count + a.wrong_count > 0
                  ? ((a.correct_count / (a.correct_count + a.wrong_count)) * 100).toFixed(0)
                  : "0";
                return (
                  <Link key={a.id} href={"/result/" + a.id}
                    className="flex items-center justify-between bg-white rounded-2xl px-4 md:px-5 py-4 border border-blue-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy truncate">{a.mocks?.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Attempt {a.attempt_number} - {new Date(a.submitted_at).toLocaleDateString()}
                        {a.status === "auto_submitted" && " - Auto"}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-bold text-xl text-gold">{a.score} pts</p>
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        {accuracy}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}