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
      body: JSON.stringify({
        question_id: questionId,
        selected_option: selected ?? null,
        marked_for_review: marked,
      }),
    }).catch(() => {});
  }

  if (phase === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="font-bold text-navy text-xl mb-1">
              HP <span className="text-gold">Exam Achievers</span>
            </div>
            <Link href="/" className="text-xs text-gray-400 hover:text-navy transition">Home</Link>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-blue-100 rounded-2xl p-7 shadow-md">
            <h2 className="font-semibold text-navy mb-1">{mock?.title || "Loading test..."}</h2>
            <p className="text-sm text-gray-400 mb-1">{mock?.exam_name}</p>
            {mock?.duration_minutes && (
              <p className="text-xs text-gray-400 mb-4">Duration: {mock.duration_minutes} minutes</p>
            )}
            {mock?.instructions && (
              <p className="text-xs text-gray-500 mb-4 whitespace-pre-line border border-blue-100 rounded-lg p-3 bg-blue-50/30">
                {mock.instructions}
              </p>
            )}
            <form onSubmit={startAttempt} className="space-y-3">
              <input
                type="password"
                className="input-field"
                placeholder="Enter test password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" className="btn-primary w-full">
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
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)" }}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400">Submitting your test...</p>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const answeredCount = Object.values(responses).filter((r) => r.selected).length;

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)" }}>
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="font-semibold text-navy text-sm">{mock?.title}</div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Q{current + 1}/{questions.length}</span>
          <span className={
            "font-mono px-3 py-1 rounded-lg font-semibold " + (
              secondsLeft < 60
                ? "bg-red-100 text-red-600 border border-red-200"
                : secondsLeft < 300
                ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                : "bg-blue-50 text-navy border border-blue-100"
            )
          }>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full">
        <main className="flex-1 p-5">
          {q && (
            <>
              <div className="bg-white/90 border border-blue-100 rounded-xl p-5 mb-4 shadow-sm">
                <p className="font-medium text-navy">{current + 1}. {q.question_text}</p>
                {q.image_url && (
                  <img src={q.image_url} alt="question" className="max-w-full rounded-lg mt-3" />
                )}
              </div>

              <div className="space-y-2 mb-6">
                {(["a", "b", "c", "d"] as const).map((opt) => (
                  <label
                    key={opt}
                    className={
                      "flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition bg-white/80 " + (
                        responses[q.id]?.selected === opt
                          ? "border-navy bg-blue-50 text-navy font-medium"
                          : "border-blue-100 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50"
                      )
                    }
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={responses[q.id]?.selected === opt}
                      onChange={() => saveAnswer(q.id, opt)}
                      className="accent-navy"
                    />
                    <span>{(q as any)["option_" + opt]}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="border border-blue-200 text-gray-500 rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() => saveAnswer(q.id, undefined)}
                  className="border border-blue-200 text-gray-500 rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition"
                >
                  Clear
                </button>
                <button
                  onClick={() => saveAnswer(q.id, responses[q.id]?.selected, !responses[q.id]?.marked)}
                  className={
                    "border rounded-lg px-4 py-2 text-sm transition " + (
                      responses[q.id]?.marked
                        ? "border-purple-300 text-purple-600 bg-purple-50"
                        : "border-blue-200 text-gray-500 hover:bg-blue-50"
                    )
                  }
                >
                  {responses[q.id]?.marked ? "Unmark" : "Mark for Review"}
                </button>
                {current < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrent((c) => c + 1)}
                    className="btn-primary text-sm"
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

        <aside className="md:w-64 p-5 border-t md:border-t-0 md:border-l border-blue-100 bg-white/50">
          <p className="text-xs text-gray-400 mb-3">
            Answered: {answeredCount}/{questions.length}
          </p>
          <div className="grid grid-cols-6 md:grid-cols-5 gap-1.5 mb-4">
            {questions.map((qq, i) => {
              const r = responses[qq.id];
              const cls = r?.selected
                ? "bg-green-500 text-white border-green-500"
                : r?.marked
                ? "bg-purple-400 text-white border-purple-400"
                : "bg-white text-gray-400 border-blue-100";
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={
                    "w-9 h-9 rounded-lg text-xs font-medium border transition " +
                    cls +
                    (current === i ? " ring-2 ring-navy ring-offset-1" : "")
                  }
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            className="btn-primary w-full text-sm"
          >
            Submit Test
          </button>
        </aside>
      </div>
    </div>
  );
}