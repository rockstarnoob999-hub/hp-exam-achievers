"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type StudentResult = {
  student: { id: string; name: string; email: string | null; phone: string | null; attempts_allowed: number };
  attempts_used: number;
  attempts_remaining: number;
  has_in_progress: boolean;
  best_score: number | null;
  best_accuracy: string | null;
  last_submitted_at: string | null;
  correct_count: number | null;
  wrong_count: number | null;
  skipped_count: number | null;
  status: "not_started" | "in_progress" | "attempted" | "exhausted";
};

type Stats = {
  total_assigned: number;
  total_submitted: number;
  not_started: number;
  in_progress: number;
  highest_score: number;
  lowest_score: number;
  average_score: string | null;
};

export default function MockResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mockTitle, setMockTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState(0);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "submitted" | "not_started" | "in_progress">("all");
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/mocks/" + id + "/results");
    if (res.status === 401) { router.push("/login?role=teacher"); return; }
    if (!res.ok) return;
    const data = await res.json();
    setMockTitle(data.mock?.title || "");
    setTotalMarks(data.mock?.total_marks || 0);
    setResults(data.student_results || []);
    setStats(data.stats);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  const filtered = results.filter((r) => {
    const matchSearch = r.student.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.student.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.student.phone || "").includes(search);
    const matchFilter = filter === "all" ||
      (filter === "submitted" && r.attempts_used > 0) ||
      (filter === "not_started" && r.status === "not_started") ||
      (filter === "in_progress" && r.has_in_progress);
    return matchSearch && matchFilter;
  });

  function getStatusBadge(r: StudentResult) {
    if (r.has_in_progress) return <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">In Progress</span>;
    if (r.status === "not_started") return <span className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-medium">Not Started</span>;
    if (r.status === "exhausted") return <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">Exhausted</span>;
    return <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Attempted</span>;
  }

  function getScoreColor(score: number, total: number) {
    const pct = (score / total) * 100;
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-blue-600";
    if (pct >= 40) return "text-yellow-600";
    return "text-red-500";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/teacher/dashboard" className="text-sm text-gray-400 hover:text-navy transition flex-shrink-0">Back</Link>
          <div className="w-px h-4 bg-gray-200 flex-shrink-0"></div>
          <div className="min-w-0">
            <p className="font-semibold text-navy truncate text-sm md:text-base">{mockTitle || "Mock Results"}</p>
            <p className="text-xs text-gray-400">Student Results Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href={"/teacher/mocks/" + id}
            className="text-xs bg-blue-50 text-navy border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
            Questions
          </Link>
          <Link href={"/teacher/mocks/" + id + "/leaderboard"}
            className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">
            Leaderboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400">Loading results...</p>
          </div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Total Assigned</p>
                  <p className="font-bold text-2xl text-navy">{stats.total_assigned}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Submitted</p>
                  <p className="font-bold text-2xl text-green-600">{stats.total_submitted}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-yellow-100 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Not Started</p>
                  <p className="font-bold text-2xl text-yellow-600">{stats.not_started}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Avg Score</p>
                  <p className="font-bold text-2xl text-purple-600">{stats.average_score ?? "--"}</p>
                </div>
              </div>
            )}

            {stats && stats.total_submitted > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Highest Score</p>
                  <p className="font-bold text-xl text-green-700">{stats.highest_score} / {totalMarks}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Lowest Score</p>
                  <p className="font-bold text-xl text-red-600">{stats.lowest_score} / {totalMarks}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">In Progress</p>
                  <p className="font-bold text-xl text-blue-700">{stats.in_progress}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                className="input-field flex-1"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex gap-2 overflow-x-auto">
                {(["all", "submitted", "not_started", "in_progress"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={"px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap border transition " + (
                      filter === f ? "bg-navy text-white border-navy" : "bg-white border-gray-200 text-gray-600 hover:border-navy"
                    )}>
                    {f === "all" ? "All" : f === "submitted" ? "Submitted" : f === "not_started" ? "Not Started" : "In Progress"}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
                <p className="text-gray-400">No students match your filter.</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Rank</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Student</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Status</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Best Score</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Accuracy</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Correct/Wrong/Skip</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Attempts</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Last Submit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={r.student.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            {r.best_score !== null ? (
                              <span className={"font-bold text-sm " + (i === 0 ? "text-gold" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-500")}>
                                #{i + 1}
                              </span>
                            ) : <span className="text-gray-300 text-xs">--</span>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-navy text-sm">{r.student.name}</p>
                            <p className="text-xs text-gray-400">{r.student.email || r.student.phone}</p>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(r)}</td>
                          <td className="px-4 py-3">
                            {r.best_score !== null ? (
                              <span className={"font-bold text-sm " + getScoreColor(r.best_score, totalMarks)}>
                                {r.best_score} / {totalMarks}
                              </span>
                            ) : <span className="text-gray-300 text-xs">--</span>}
                          </td>
                          <td className="px-4 py-3">
                            {r.best_accuracy ? (
                              <span className="font-medium text-sm text-gray-700">{r.best_accuracy}%</span>
                            ) : <span className="text-gray-300 text-xs">--</span>}
                          </td>
                          <td className="px-4 py-3">
                            {r.correct_count !== null ? (
                              <span className="text-xs">
                                <span className="text-green-600 font-medium">{r.correct_count}</span>
                                <span className="text-gray-300 mx-1">/</span>
                                <span className="text-red-500 font-medium">{r.wrong_count}</span>
                                <span className="text-gray-300 mx-1">/</span>
                                <span className="text-gray-400 font-medium">{r.skipped_count}</span>
                              </span>
                            ) : <span className="text-gray-300 text-xs">--</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-600">{r.attempts_used}/{r.student.attempts_allowed}</span>
                          </td>
                          <td className="px-4 py-3">
                            {r.last_submitted_at ? (
                              <span className="text-xs text-gray-400">{new Date(r.last_submitted_at).toLocaleDateString()}</span>
                            ) : <span className="text-gray-300 text-xs">--</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {filtered.map((r, i) => (
                    <div key={r.student.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-navy text-sm flex-shrink-0">
                            {r.best_score !== null ? "#" + (i + 1) : "--"}
                          </div>
                          <div>
                            <p className="font-semibold text-navy text-sm">{r.student.name}</p>
                            <p className="text-xs text-gray-400">{r.student.email || r.student.phone}</p>
                          </div>
                        </div>
                        {getStatusBadge(r)}
                      </div>

                      {r.best_score !== null && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-gray-50 rounded-xl p-2 text-center">
                            <p className="text-xs text-gray-400">Score</p>
                            <p className={"font-bold text-sm " + getScoreColor(r.best_score, totalMarks)}>
                              {r.best_score}/{totalMarks}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2 text-center">
                            <p className="text-xs text-gray-400">Accuracy</p>
                            <p className="font-bold text-sm text-gray-700">{r.best_accuracy}%</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2 text-center">
                            <p className="text-xs text-gray-400">Attempts</p>
                            <p className="font-bold text-sm text-gray-700">{r.attempts_used}/{r.student.attempts_allowed}</p>
                          </div>
                        </div>
                      )}

                      {r.best_score !== null && (
                        <div className="flex gap-3 mt-2 text-xs text-center">
                          <span className="flex-1 bg-green-50 text-green-700 rounded-lg py-1">
                            {r.correct_count} Correct
                          </span>
                          <span className="flex-1 bg-red-50 text-red-600 rounded-lg py-1">
                            {r.wrong_count} Wrong
                          </span>
                          <span className="flex-1 bg-gray-50 text-gray-500 rounded-lg py-1">
                            {r.skipped_count} Skipped
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}