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
    fetch("/api/attempts/" + id + "/result").then(async (res) => {
      if (res.status === 401) { router.push("/login"); return; }
      const d = await res.json();
      setData(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400">Loading your result...</p>
        </div>
      </div>
    );
  }

  if (!data?.attempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Result not found.</p>
      </div>
    );
  }

  const { attempt, mock, review, rank, totalStudents, percentile } = data;

  const accuracy = attempt.correct_count + attempt.wrong_count > 0
    ? ((attempt.correct_count / (attempt.correct_count + attempt.wrong_count)) * 100).toFixed(1)
    : "0.0";

  const percentage = mock?.total_marks > 0
    ? ((attempt.score / mock.total_marks) * 100).toFixed(1)
    : "0.0";

  const motivational = Number(percentage) >= 80
    ? "Excellent performance! You are well prepared."
    : Number(percentage) >= 60
    ? "Good effort! A little more practice and you will ace it."
    : Number(percentage) >= 40
    ? "Keep going! Focus on your weak areas and try again."
    : "Do not give up! Every attempt makes you stronger.";

  const percentileMessage = percentile !== null
    ? percentile >= 90
      ? "You scored better than " + percentile + "% of students in Himachal Pradesh who took this test. Outstanding!"
      : percentile >= 70
      ? "You scored better than " + percentile + "% of students in Himachal Pradesh. Great performance!"
      : percentile >= 50
      ? "You scored better than " + percentile + "% of students in Himachal Pradesh. Keep pushing!"
      : percentile >= 25
      ? "You scored better than " + percentile + "% of students in Himachal Pradesh. There is room to grow!"
      : "You scored better than " + percentile + "% of students so far. Do not give up - every attempt counts!"
    : null;

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    const text = "I scored " + attempt.score + " out of " + mock?.total_marks +
      " (" + percentage + "%) in " + mock?.title +
      " on HP Exam Achievers!" +
      (percentile !== null ? " I scored better than " + percentile + "% of students in HP!" : "") +
      " Check it out at " + window.location.origin;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="font-bold text-navy">HP <span className="text-gold">Exam Achievers</span></div>
          <Link href="/" className="text-xs text-gray-400 hover:text-navy transition">Home</Link>
        </div>
        <Link href="/student/dashboard" className="text-sm text-gray-500 hover:text-navy transition">Dashboard</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8" id="result-print-area">
        <div className="text-center mb-6">
          <h1 className="font-display font-semibold text-2xl text-navy mb-1">{mock?.title}</h1>
          <p className="text-gray-400 text-sm">
            Attempt {attempt.attempt_number}
            {attempt.status === "auto_submitted" ? " - Auto submitted" : " - Submitted"}
          </p>
          <p className="text-gold mt-2 text-sm font-medium">{motivational}</p>
        </div>

        {percentileMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 mb-6 text-center">
            <p className="text-navy font-semibold text-sm">{percentileMessage}</p>
            {totalStudents > 1 && (
              <p className="text-gray-400 text-xs mt-1">Based on {totalStudents} students who have taken this test</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Score" value={attempt.score + " / " + mock?.total_marks} highlight />
          <StatCard label="Percentage" value={percentage + "%"} />
          <StatCard label="Correct" value={attempt.correct_count} color="text-green-600" />
          <StatCard label="Wrong" value={attempt.wrong_count} color="text-red-500" />
          <StatCard label="Skipped" value={attempt.skipped_count} color="text-gray-400" />
          <StatCard label="Accuracy" value={accuracy + "%"} />
          {rank && <StatCard label="Rank" value={"#" + rank} highlight />}
          <StatCard label="Attempt" value={"#" + attempt.attempt_number} />
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={handlePrint}
            className="btn-primary text-sm"
          >
            Download / Print Result
          </button>
          <button
            onClick={handleWhatsApp}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-green-500 transition"
          >
            Share on WhatsApp
          </button>
        </div>

        {mock?.show_correct_answers && (
          <>
            <h2 className="font-semibold text-navy mb-3">Answer Review</h2>
            <div className="space-y-3">
              {review?.map((q: any, i: number) => (
                <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="font-medium text-navy text-sm mb-3">{i + 1}. {q.question_text}</p>
                  <ul className="space-y-1">
                    {["a", "b", "c", "d"].map((opt) => {
                      const isCorrect = q.correct_option === opt;
                      const isSelected = q.selected_option === opt;
                      return (
                        <li
                          key={opt}
                          className={
                            "text-sm px-3 py-1.5 rounded-lg " + (
                              isCorrect
                                ? "bg-green-50 text-green-700 font-medium"
                                : isSelected
                                ? "bg-red-50 text-red-600 font-medium"
                                : "text-gray-500"
                            )
                          }
                        >
                          {opt.toUpperCase()}. {q["option_" + opt]}
                          {isCorrect && " - Correct"}
                          {isSelected && !isCorrect && " - Your answer"}
                        </li>
                      );
                    })}
                  </ul>
                  {q.explanation && (
                    <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2">
                      Explanation: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <style>{`
        @media print {
          header, button { display: none !important; }
          body { background: white !important; }
          #result-print-area { padding: 20px; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color, highlight }: {
  label: string;
  value: any;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className={"rounded-xl p-4 text-center border " + (highlight ? "bg-gold/10 border-gold/30" : "bg-white border-gray-200 shadow-sm")}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={"font-display font-semibold text-lg " + (highlight ? "text-gold" : color || "text-navy")}>{value}</p>
    </div>
  );
}