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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-white/50">Loading your result...</p>
        </div>
      </div>
    );
  }

  if (!data?.attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy to-slate-800 flex items-center justify-center">
        <p className="text-white/50">Result not found.</p>
      </div>
    );
  }

  const { attempt, mock, review, rank } = data;
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

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    const text = "I scored " + attempt.score + " out of " + mock?.total_marks + " (" + percentage + "%) in " + mock?.title + " on HP Exam Achievers! Check it out at " + window.location.origin;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy to-slate-800">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-white/5">
        <div className="flex items-center gap-4">
          <div className="font-bold text-white">HP <span className="text-gold">Exam Achievers</span></div>
          <Link href="/" className="text-xs text-white/40 hover:text-white transition">Home</Link>
        </div>
        <Link href="/student/dashboard" className="text-sm text-white/60 hover:text-white transition">Dashboard</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8" id="result-print-area">
        <div className="text-center mb-8">
          <h1 className="font-display font-semibold text-2xl text-white mb-1">{mock?.title}</h1>
          <p className="text-white/50 text-sm">
            Attempt {attempt.attempt_number}
            {attempt.status === "auto_submitted" ? " - Auto submitted" : " - Submitted"}
          </p>
          <p className="text-gold mt-3 text-sm italic">{motivational}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Score" value={attempt.score + " / " + mock?.total_marks} highlight />
          <StatCard label="Percentage" value={percentage + "%"} />
          <StatCard label="Correct" value={attempt.correct_count} color="text-green-400" />
          <StatCard label="Wrong" value={attempt.wrong_count} color="text-red-400" />
          <StatCard label="Skipped" value={attempt.skipped_count} color="text-white/50" />
          <StatCard label="Accuracy" value={accuracy + "%"} />
          {rank && <StatCard label="Rank" value={"#" + rank} highlight />}
          <StatCard label="Attempt" value={"#" + attempt.attempt_number} />
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={handlePrint}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition"
          >
            Download / Print Result
          </button>
          <button
            onClick={handleWhatsApp}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-green-500 transition"
          >
            Share on WhatsApp
          </button>
          {mock?.leaderboard_enabled && (
            <Link
              href={"/leaderboard/" + mock.id}
              className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition"
            >
              View Leaderboard
            </Link>
          )}
        </div>

        {mock?.show_correct_answers && (
          <>
            <h2 className="font-semibold text-white mb-3">Answer Review</h2>
            <div className="space-y-3">
              {review?.map((q: any, i: number) => (
                <div key={q.id} className="bg-white/10 border border-white/10 rounded-xl p-5">
                  <p className="font-medium text-white text-sm mb-3">{i + 1}. {q.question_text}</p>
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
                                ? "bg-green-500/20 text-green-300 font-medium"
                                : isSelected
                                ? "bg-red-500/20 text-red-300 font-medium"
                                : "text-white/50"
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
                    <p className="text-xs text-white/40 mt-3 border-t border-white/10 pt-2">
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
          header, button, a[href] { display: none !important; }
          body { background: white !important; color: black !important; }
          .bg-gradient-to-br { background: white !important; }
          #result-print-area { padding: 20px; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color, highlight }: { label: string; value: any; color?: string; highlight?: boolean }) {
  return (
    <div className={"rounded-xl p-4 text-center border " + (highlight ? "bg-gold/20 border-gold/30" : "bg-white/10 border-white/10")}>
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className={"font-display font-semibold text-lg " + (highlight ? "text-gold" : color || "text-white")}>{value}</p>
    </div>
  );
}