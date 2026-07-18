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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
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
        <div className="text-center">
          <p className="text-gray-400 mb-4">Result not found.</p>
          <Link href="/student/dashboard" className="btn-primary text-sm">Go to Dashboard</Link>
        </div>
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

  const percentileMessage = percentile !== null && percentile !== undefined
    ? percentile >= 90
      ? "You scored better than " + percentile + "% of students. Outstanding!"
      : percentile >= 70
      ? "You scored better than " + percentile + "% of students. Great performance!"
      : percentile >= 50
      ? "You scored better than " + percentile + "% of students. Keep pushing!"
      : "You scored better than " + percentile + "% of students so far. Keep working hard!"
    : null;

  function handlePrint() { window.print(); }

  function handleWhatsApp() {
    const text =
      "I scored " + attempt.score + " out of " + mock?.total_marks +
      " (" + percentage + "%) in " + mock?.title +
      " on HP Exam Achievers!" +
      (percentile !== null && percentile !== undefined
        ? " I scored better than " + percentile + "% of students!"
        : "") +
      " Check it out at " + window.location.origin;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }

  const aboveCutoff = mock?.expected_cutoff !== null && mock?.expected_cutoff !== undefined
    ? attempt.score >= mock.expected_cutoff
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm no-print sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="font-bold text-navy text-sm">HP <span className="text-gold">Exam Achievers</span></div>
          <Link href="/" className="text-xs text-gray-400 hover:text-navy transition hidden sm:block">Home</Link>
        </div>
        <Link href="/student/dashboard" className="text-sm text-gray-500 hover:text-navy transition">Dashboard</Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8" id="result-print-area">

        {/* Print Header */}
        <div className="print-header hidden mb-6 pb-4 border-b-2 border-navy">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-navy">HP Exam Achievers</h1>
              <p className="text-xs text-gray-500">Official Result Card</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-xs text-gray-500">Attempt #{attempt.attempt_number}</p>
            </div>
          </div>
        </div>

        {/* Mock Title */}
        <div className="text-center mb-6">
          <h1 className="font-bold text-2xl text-navy mb-1">{mock?.title}</h1>
          <p className="text-gray-400 text-sm">{mock?.exam_name}</p>
          <p className="text-gray-400 text-xs mt-1">
            Attempt {attempt.attempt_number}
            {attempt.status === "auto_submitted" ? " - Auto submitted" : " - Submitted"}
          </p>
          <p className="text-blue-600 mt-2 text-sm font-medium">{motivational}</p>
        </div>

        {/* Score Hero */}
        <div className="relative overflow-hidden rounded-2xl p-6 mb-5 text-white text-center"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="relative z-10">
            <p className="text-blue-200 text-xs mb-1">Your Score</p>
            <p className="font-bold text-5xl text-white mb-1">{attempt.score}</p>
            <p className="text-blue-200 text-sm">out of {mock?.total_marks} marks</p>
            <p className="text-white/80 text-sm mt-1">{percentage}%</p>
            {rank && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/15 border border-white/25 px-4 py-1.5 rounded-full">
                <span className="text-gold font-bold">#{rank}</span>
                <span className="text-white/70 text-xs">out of {totalStudents} students</span>
              </div>
            )}
          </div>
        </div>

        {/* Percentile */}
        {percentileMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-4 text-center">
            <p className="text-navy font-semibold text-sm">{percentileMessage}</p>
            {totalStudents > 1 && (
              <p className="text-gray-400 text-xs mt-1">Based on {totalStudents} students who have taken this test</p>
            )}
          </div>
        )}

        {/* Expected Cutoff */}
        {mock?.expected_cutoff !== null && mock?.expected_cutoff !== undefined && (
          <div className={"rounded-2xl px-5 py-4 mb-5 border " + (
            aboveCutoff ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
          )}>
            <p className={"font-bold text-sm mb-3 " + (aboveCutoff ? "text-green-700" : "text-orange-700")}>
              {aboveCutoff
                ? "You are above the expected cutoff!"
                : "You are below the expected cutoff. Keep practicing!"}
            </p>
            <div className="flex flex-wrap items-center gap-4 md:gap-8 mb-3">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-0.5">Your Score</p>
                <p className={"font-bold text-2xl " + (aboveCutoff ? "text-green-600" : "text-orange-600")}>
                  {attempt.score}
                </p>
              </div>
              <div className="text-gray-300 text-xl font-light">vs</div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-0.5">Expected Cutoff</p>
                <p className="font-bold text-2xl text-navy">{mock.expected_cutoff}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-0.5">Difference</p>
                <p className={"font-bold text-2xl " + (aboveCutoff ? "text-green-600" : "text-red-500")}>
                  {aboveCutoff ? "+" : ""}{attempt.score - mock.expected_cutoff}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-0.5">Cutoff is</p>
                <p className="font-bold text-navy text-sm">
                  {mock.total_marks > 0 ? ((mock.expected_cutoff / mock.total_marks) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
            </div>
            {aboveCutoff ? (
              <p className="text-green-600 text-xs">
                You are {attempt.score - mock.expected_cutoff} marks above the expected cutoff. Great work!
              </p>
            ) : (
              <p className="text-orange-600 text-xs">
                You need {mock.expected_cutoff - attempt.score} more marks to reach the expected cutoff.
              </p>
            )}
            {mock.cutoff_note && (
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200 italic">
                Disclaimer: {mock.cutoff_note}
              </p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Correct" value={attempt.correct_count} color="text-green-600" bg="bg-green-50" border="border-green-100" />
          <StatCard label="Wrong" value={attempt.wrong_count} color="text-red-500" bg="bg-red-50" border="border-red-100" />
          <StatCard label="Skipped" value={attempt.skipped_count} color="text-gray-400" bg="bg-gray-50" border="border-gray-100" />
          <StatCard label="Accuracy" value={accuracy + "%"} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 no-print">
          <button onClick={handlePrint}
            className="flex items-center gap-2 bg-navy text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-900 transition">
            Download PDF
          </button>
          <button onClick={handleWhatsApp}
            className="flex items-center gap-2 bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-green-500 transition">
            Share on WhatsApp
          </button>
          <Link href="/student/dashboard"
            className="flex items-center gap-2 border border-gray-200 text-gray-600 font-medium px-5 py-2.5 rounded-xl text-sm hover:border-navy hover:text-navy transition">
            Back to Dashboard
          </Link>
        </div>

        {/* Answer Review */}
        {mock?.show_correct_answers && review && review.length > 0 && (
          <>
            <h2 className="font-bold text-navy text-lg mb-4">Answer Review</h2>
            <div className="space-y-3">
              {review.map((q: any, i: number) => (
                <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-medium text-navy text-sm flex-1">{i + 1}. {q.question_text}</p>
                    <span className="flex-shrink-0 text-xs bg-blue-50 text-navy border border-blue-200 px-2 py-0.5 rounded-lg font-medium">
                      {q.marks} {q.marks === 1 ? "mark" : "marks"}
                    </span>
                  </div>
                  {q.image_url && (
                    <img src={q.image_url} alt="question" className="max-h-40 rounded-lg mb-3 border border-gray-200 object-contain" />
                  )}
                  <ul className="space-y-1.5">
                    {["a", "b", "c", "d"].map((opt) => {
                      const isCorrect = q.correct_option === opt;
                      const isSelected = q.selected_option === opt;
                      return (
                        <li key={opt}
                          className={"text-sm px-3 py-2 rounded-lg border " + (
                            isCorrect
                              ? "bg-green-50 text-green-700 font-medium border-green-200"
                              : isSelected
                              ? "bg-red-50 text-red-600 font-medium border-red-200"
                              : "text-gray-500 border-gray-100"
                          )}>
                          <span className="font-semibold mr-1">{opt.toUpperCase()}.</span>
                          {q["option_" + opt]}
                          {isCorrect && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Correct</span>}
                          {isSelected && !isCorrect && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Your answer</span>}
                        </li>
                      );
                    })}
                  </ul>
                  {q.explanation && (
                    <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2 italic">
                      Explanation: {q.explanation}
                    </p>
                  )}
                  {!q.selected_option && (
                    <p className="text-xs text-gray-400 mt-2 italic">Skipped</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-header { display: block !important; }
          body { background: white !important; }
          #result-print-area { padding: 20px; max-width: 100%; }
          .bg-green-50 { background-color: #f0fdf4 !important; }
          .bg-red-50 { background-color: #fef2f2 !important; }
          .bg-orange-50 { background-color: #fff7ed !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .rounded-2xl, .rounded-xl { border-radius: 8px !important; }
          .shadow-sm { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color, bg, border }: {
  label: string; value: any; color: string; bg: string; border: string;
}) {
  return (
    <div className={"rounded-2xl p-4 text-center border shadow-sm " + bg + " " + border}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={"font-bold text-2xl " + color}>{value}</p>
    </div>
  );
}