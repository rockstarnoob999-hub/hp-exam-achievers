"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/attempts/${id}/result`).then(async (res) => {
      if (res.status === 401) { router.push("/login"); return; }
      const d = await res.json();
      setData(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading result...</div>;
  if (!data?.attempt) return <div className="min-h-screen flex items-center justify-center text-gray-500">Result not found.</div>;

  const { attempt, mock, review, rank } = data;
  const accuracy = attempt.correct_count + attempt.wrong_count > 0
    ? ((attempt.correct_count / (attempt.correct_count + attempt.wrong_count)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy text-white px-6 py-4 flex justify-between items-center">
        <div className="font-semibold">{mock?.title} — Result</div>
        <Link href="/student/dashboard" className="text-sm underline">Dashboard</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Score" value={`${attempt.score} / ${mock?.total_marks}`} />
          <Stat label="Correct" value={attempt.correct_count} color="text-green-700" />
          <Stat label="Wrong" value={attempt.wrong_count} color="text-red-700" />
          <Stat label="Skipped" value={attempt.skipped_count} color="text-gray-500" />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          {rank && <Stat label="Rank" value={`#${rank}`} color="text-gold" />}
          <Stat label="Attempt" value={`#${attempt.attempt_number}`} />
          <Stat label="Status" value={attempt.status === "auto_submitted" ? "Auto-submitted" : "Submitted"} />
        </div>

        {mock?.show_correct_answers && (
          <>
            <h2 className="font-semibold mb-3">Answer Review</h2>
            <div className="space-y-3">
              {review?.map((q: any, i: number) => (
                <div key={q.id} className="card">
                  <p className="font-medium text-sm mb-2">{i + 1}. {q.question_text}</p>
                  <ul className="text-sm space-y-1">
                    {["a", "b", "c", "d"].map((opt) => {
                      const isCorrect = q.correct_option === opt;
                      const isSelected = q.selected_option === opt;
                      return (
                        <li
                          key={opt}
                          className={
                            isCorrect ? "text-green-700 font-medium" :
                            isSelected ? "text-red-700 font-medium" : "text-gray-600"
                          }
                        >
                          {opt.toUpperCase()}. {q[`option_${opt}`]} {isCorrect && "✓"} {isSelected && !isCorrect && "(your answer)"}
                        </li>
                      );
                    })}
                  </ul>
                  {q.explanation && <p className="text-xs text-gray-500 mt-2">Explanation: {q.explanation}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="card text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-bold text-lg ${color || "text-navy"}`}>{value}</p>
    </div>
  );
}
