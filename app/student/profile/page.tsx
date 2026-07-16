"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Attempt = {
  id: string;
  mock_id: string;
  attempt_number: number;
  status: string;
  score: number | null;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  started_at: string;
  submitted_at: string | null;
  mocks: { title: string; exam_name: string; total_marks: number; duration_minutes: number } | null;
};

export default function StudentProfilePage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "submitted" | "auto_submitted">("all");
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/attempts/my");
    if (res.status === 401) { router.push("/login?role=student"); return; }
    const data = await res.json();
    setAttempts(data.attempts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const completed = attempts.filter((a) => a.status !== "in_progress");
  const submitted = attempts.filter((a) => a.status === "submitted");
  const autoSubmitted = attempts.filter((a) => a.status === "auto_submitted");

  const totalScore = completed.reduce((sum, a) => sum + (a.score || 0), 0);
  const totalCorrect = completed.reduce((sum, a) => sum + (a.correct_count || 0), 0);
  const totalWrong = completed.reduce((sum, a) => sum + (a.wrong_count || 0), 0);
  const totalSkipped = completed.reduce((sum, a) => sum + (a.skipped_count || 0), 0);

  const avgAccuracy = completed.length > 0
    ? Math.round(completed.reduce((sum, a) => {
        const total = a.correct_count + a.wrong_count;
        return sum + (total ? (a.correct_count / total) * 100 : 0);
      }, 0) / completed.length)
    : 0;

  const bestAttempt = completed.length > 0
    ? completed.reduce((best, a) => (a.score || 0) > (best.score || 0) ? a : best)
    : null;

  // Subject wise breakdown
  const subjectMap: Record<string, { attempts: number; totalScore: number; totalMarks: number }> = {};
  completed.forEach((a) => {
    const title = a.mocks?.title || "Unknown";
    if (!subjectMap[title]) subjectMap[title] = { attempts: 0, totalScore: 0, totalMarks: 0 };
    subjectMap[title].attempts++;
    subjectMap[title].totalScore += a.score || 0;
    subjectMap[title].totalMarks += a.mocks?.total_marks || 0;
  });

  const filtered = completed.filter((a) => {
    const matchFilter = filter === "all" || a.status === filter;
    const matchSearch = (a.mocks?.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.mocks?.exam_name || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  function getScoreColor(score: number, total: number) {
    const pct = total > 0 ? (score / total) * 100 : 0;
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-blue-600";
    if (pct >= 40) return "text-yellow-600";
    return "text-red-500";
  }

  function getProgressWidth(score: number, total: number) {
    return total > 0 ? Math.min(100, (score / total) * 100) : 0;
  }

  function getProgressColor(score: number, total: number) {
    const pct = total > 0 ? (score / total) * 100 : 0;
    if (pct >= 80) return "bg-green-500";
    if (pct >= 60) return "bg-blue-500";
    if (pct >= 40) return "bg-yellow-500";
    return "bg-red-500";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/student/dashboard" className="text-sm text-gray-400 hover:text-navy transition">Dashboard</Link>
          <div className="w-px h-4 bg-gray-200"></div>
          <div className="font-semibold text-navy text-sm md:text-base">My Profile</div>
        </div>
        <Link href="/" className="text-xs text-gray-400 hover:text-navy transition">Home</Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6">

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400">Loading your profile...</p>
          </div>
        ) : (
          <>
            {/* Hero Stats */}
            <div className="relative overflow-hidden rounded-2xl p-6 mb-6 text-white"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full"></div>
              <div className="relative z-10">
                <p className="text-blue-200 text-xs mb-1">Your Performance Summary</p>
                <h1 className="text-xl md:text-2xl font-bold mb-4">All Time Statistics</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/15 border border-white/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold">{completed.length}</p>
                    <p className="text-blue-200 text-xs mt-0.5">Tests Completed</p>
                  </div>
                  <div className="bg-white/15 border border-white/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold">{avgAccuracy}%</p>
                    <p className="text-blue-200 text-xs mt-0.5">Avg Accuracy</p>
                  </div>
                  <div className="bg-white/15 border border-white/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-300">{totalCorrect}</p>
                    <p className="text-blue-200 text-xs mt-0.5">Total Correct</p>
                  </div>
                  <div className="bg-white/15 border border-white/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-300">{totalWrong}</p>
                    <p className="text-blue-200 text-xs mt-0.5">Total Wrong</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Attempts</p>
                <p className="font-bold text-2xl text-navy">{attempts.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Best Score</p>
                <p className="font-bold text-2xl text-green-600">{bestAttempt?.score ?? 0}</p>
                {bestAttempt && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{bestAttempt.mocks?.title}</p>
                )}
              </div>
              <div className="bg-white rounded-2xl p-4 border border-yellow-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Skipped</p>
                <p className="font-bold text-2xl text-yellow-600">{totalSkipped}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Auto Submitted</p>
                <p className="font-bold text-2xl text-purple-600">{autoSubmitted.length}</p>
              </div>
            </div>

            {/* Mock wise breakdown */}
            {Object.keys(subjectMap).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <h2 className="font-bold text-navy mb-4">Mock-wise Performance</h2>
                <div className="space-y-4">
                  {Object.entries(subjectMap).map(([title, data]) => {
                    const avg = data.attempts > 0 ? Math.round(data.totalScore / data.attempts) : 0;
                    const avgMarks = data.attempts > 0 ? Math.round(data.totalMarks / data.attempts) : 0;
                    const pct = avgMarks > 0 ? getProgressWidth(avg, avgMarks) : 0;
                    return (
                      <div key={title}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-navy truncate flex-1 mr-3">{title}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">{data.attempts} attempt{data.attempts !== 1 ? "s" : ""}</span>
                            <span className={"text-xs font-bold " + getScoreColor(avg, avgMarks)}>
                              {avg}/{avgMarks}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={"h-2 rounded-full transition-all duration-500 " + getProgressColor(avg, avgMarks)}
                            style={{ width: pct + "%" }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(0)}% average</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Attempts History */}
            <div className="mb-4">
              <h2 className="font-bold text-navy text-lg mb-4">Attempt History</h2>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  className="input-field flex-1"
                  placeholder="Search by mock name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex gap-2">
                  {(["all", "submitted", "auto_submitted"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={"px-3 py-2 rounded-lg text-xs font-medium border transition whitespace-nowrap " + (
                        filter === f ? "bg-navy text-white border-navy" : "bg-white border-gray-200 text-gray-600"
                      )}>
                      {f === "all" ? "All" : f === "submitted" ? "Submitted" : "Auto"}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-400 mb-1">No attempts found.</p>
                  <p className="text-gray-300 text-sm">Take a mock test to see your history here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((a, i) => {
                    const accuracy = a.correct_count + a.wrong_count > 0
                      ? ((a.correct_count / (a.correct_count + a.wrong_count)) * 100).toFixed(0)
                      : "0";
                    const pct = a.mocks?.total_marks && a.score !== null
                      ? ((a.score / a.mocks.total_marks) * 100).toFixed(0)
                      : "0";

                    return (
                      <Link key={a.id} href={"/result/" + a.id}
                        className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                                  {a.mocks?.exam_name || "Mock"}
                                </span>
                                <span className={"text-xs px-2 py-0.5 rounded-full font-medium border " + (
                                  a.status === "auto_submitted"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : "bg-green-50 text-green-700 border-green-200"
                                )}>
                                  {a.status === "auto_submitted" ? "Auto submitted" : "Submitted"}
                                </span>
                              </div>
                              <p className="font-bold text-navy truncate">{a.mocks?.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Attempt #{a.attempt_number}
                                {a.submitted_at && " - " + new Date(a.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={"font-bold text-xl " + getScoreColor(a.score || 0, a.mocks?.total_marks || 100)}>
                                {a.score} / {a.mocks?.total_marks}
                              </p>
                              <p className="text-xs text-gray-400">{pct}%</p>
                            </div>
                          </div>

                          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                            <div
                              className={"h-1.5 rounded-full transition-all " + getProgressColor(a.score || 0, a.mocks?.total_marks || 100)}
                              style={{ width: getProgressWidth(a.score || 0, a.mocks?.total_marks || 100) + "%" }}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-green-50 border border-green-100 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-400">Correct</p>
                              <p className="font-bold text-sm text-green-600">{a.correct_count}</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-400">Wrong</p>
                              <p className="font-bold text-sm text-red-500">{a.wrong_count}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-400">Accuracy</p>
                              <p className="font-bold text-sm text-gray-700">{accuracy}%</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}