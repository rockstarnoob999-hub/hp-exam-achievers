"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  submitted_at: string;
};

export default function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mockTitle, setMockTitle] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const mockRes = await fetch(`/api/mocks/${id}`);
      if (mockRes.status === 401) { router.push("/login?role=teacher"); return; }
      const mockData = await mockRes.json();
      setMockTitle(mockData.mock?.title || "");

      const lbRes = await fetch(`/api/mocks/${id}/leaderboard`);
      const lbData = await lbRes.json();
      if (!lbRes.ok) {
        setError(lbData.error || "Leaderboard unavailable for this test.");
      } else {
        setEntries(lbData.leaderboard || []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/teacher/dashboard" className="text-sm text-navy">← Back</Link>
        <div className="font-semibold">{mockTitle || "Mock Test"} — Leaderboard</div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-gray-500">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-gray-500">No submitted attempts yet for this test.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.rank} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-semibold text-navy">
                      {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
                    </td>
                    <td className="py-2 pr-4">{e.name}</td>
                    <td className="py-2 pr-4 font-medium">{e.score}</td>
                    <td className="py-2 pr-4 text-gray-500">{new Date(e.submitted_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}