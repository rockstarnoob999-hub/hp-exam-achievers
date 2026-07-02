"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Question = {
  id: string;
  question_text: string;
  image_url?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
};

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<"password" | "exam" | "submitting">("password");
  const [accessPassword, setAccessPassword] = useState("");
  const [error, setError] = useState("");

  const [mock, setMock] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<Record<string, { selected?: string; marked?: boolean }>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    fetch("/api/mocks/" + id).then(async (res) => {
      if (res.status === 401) { router.push("/login?role=student"); return; }
      const data = await res.json();
      if (res.ok) setMock(data.mock);
    });
  }, [id]);

  async function startAttempt(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mock_id: id, access_password: accessPassword }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }

    setAttemptId(data.attempt.id);

    const qRes = await fetch("/api/mocks/" + id);
    const qData = await qRes.json();
    setQuestions(qData.questions || []);
    setSecondsLeft((qData.mock.duration_minutes || 30) * 60);
    setPhase("exam");
  }

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current || !attemptId) return;
    submittedRef.current = true;
    setPhase("submitting");
    if (timerRef.current) clearInterval(timerRef.current);
    await fetch("/api/attempts/" + attemptId + "/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto }),
    });
    router.push("/result/" + attemptId);
  }, [attemptId, router]);

  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { handleSubmit(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, handleSubmit]);

  async function saveAnswer(questionId: string, selected?: string, marked?: boolean) {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        selected: selected !== undefined ? selected : prev[questionId]?.selected,
        marked: marked !== undefined ? marked : prev[questionId]?.marked,
      }
    }));
    if (!attemptId) return;
    fetch("/api/attempts/" + attemptId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: questionId, selected_option: selected ?? null, marked_for_review: marked }),
    }).catch(() => {});
  }

  if (phase === "password") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy to-slate-800 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="font-bold text-white text-xl mb-1">HP <span className="text-gold">Exam Achievers</span></div>
            <Link href="/" className="text-xs text-white/30 hover:text-white transition">Home</Link>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-7">
            <h2 className="font-semibold text-white mb-1">{mock?.title || "Loading test..."}</h2>
            <p className="text-sm text-white/50 mb-1">{mock?.exam_name}</p>
            {mock?.duration_minutes && (
              <p className="text-xs text-white/40 mb-4">Duration: {mock.duration_minutes} minutes</p>
            )}
            {mock?.instructions && (
              <p className="text-xs text-white/50 mb-4 whitespace-pre-line border border-white/10 rounded-lg p-3">
                {mock.instructions}
              </p>
            )}
            <form onSubmit={startAttempt} className="space-y-3">
              <input
                type="password"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Enter test password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button type="submit" className="w-full bg-gold text-navy font-semibold py-2.5 rounded-lg hover:opacity-90 transition">
                Start Test
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-white/50">Submitting your test...</p>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const answeredCount = Object.values(responses).filter((r) => r.selected).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy to-slate-800 flex flex-col">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between backdrop-blur-sm bg-white/5">
        <div className="font-semibold text-white text-sm">{mock?.title}</div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/50">Q{current + 1}/{questions.length}</span>
          <span className={"font-mono px-3 py-1 rounded-lg font-semibold " + (secondsLeft < 60 ? "bg-red-500/30 text-red-300" : secondsLeft < 300 ? "bg-yellow-500/20 text-yellow-300" : "bg-white/10 text-white")}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full">
        <main className="flex-1 p-5">
          {q && (
            <>
              <div className="bg-white/10 border border-white/10 rounded-xl p-5 mb-4">
                <p className="font-medium text-white">{current + 1}. {q.question_text}</p>
                {q.image_url && <img src={q.image_url} alt="question" className="max-w-full rounded-lg mt-3" />}
              </div>

              <div className="space-y-2 mb-6">
                {(["a", "b", "c", "d"] as const).map((opt) => (
                  <label
                    key={opt}
                    className={"flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition " + (
                      responses[q.id]?.selected === opt
                        ? "border-gold bg-gold/10 text-white"
                        : "border-white/10 text-white/70 hover:border-white/30 hover:bg-white/5"
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={responses[q.id]?.selected === opt}
                      onChange={() => saveAnswer(q.id, opt)}
                      className="accent-gold"
                    />
                    <span>{(q as any)["option_" + opt]}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="border border-white/20 text-white/70 rounded-lg px-4 py-2 text-sm hover:bg-white/10 transition disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() => saveAnswer(q.id, undefined)}
                  className="border border-white/20 text-white/70 rounded-lg px-4 py-2 text-sm hover:bg-white/10 transition"
                >
                  Clear
                </button>
                <button
                  onClick={() => saveAnswer(q.id, responses[q.id]?.selected, !responses[q.id]?.marked)}
                  className={"border rounded-lg px-4 py-2 text-sm transition " + (responses[q.id]?.marked ? "border-purple-400 text-purple-300 bg-purple-500/10" : "border-white/20 text-white/70 hover:bg-white/10")}
                >
                  {responses[q.id]?.marked ? "Unmark" : "Mark for Review"}
                </button>
                {current < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrent((c) => c + 1)}
                    className="bg-gold text-navy font-semibold rounded-lg px-4 py-2 text-sm hover:opacity-90 transition"
                  >
                    Save & Next
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubmit(false)}
                    className="bg-green-600 text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-green-500 transition"
                  >
                    Submit Test
                  </button>
                )}
              </div>
            </>
          )}
        </main>

        <aside className="md:w-64 p-5 border-t md:border-t-0 md:border-l border-white/10 bg-white/5">
          <p className="text-xs text-white/40 mb-3">Answered: {answeredCount}/{questions.length}</p>
          <div className="grid grid-cols-6 md:grid-cols-5 gap-1.5 mb-4">
            {questions.map((qq, i) => {
              const r = responses[qq.id];
              const cls = r?.selected
                ? "bg-green-500/80 text-white"
                : r?.marked
                ? "bg-purple-500/80 text-white"
                : "bg-white/10 text-white/50";
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={"w-9 h-9 rounded-lg text-xs font-medium transition " + cls + (current === i ? " ring-2 ring-gold" : "")}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            className="w-full bg-gold text-navy font-semibold rounded-lg py-2 text-sm hover:opacity-90 transition"
          >
            Submit Test
          </button>
        </aside>
      </div>
    </div>
  );
}