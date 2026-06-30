"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Question = {
  id: string;
  question_text: string;
  image_url?: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
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

  // Load mock details up front (without starting an attempt) to show password screen
  useEffect(() => {
    fetch(`/api/mocks/${id}`).then(async (res) => {
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

    const qRes = await fetch(`/api/mocks/${id}`);
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
    await fetch(`/api/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto }),
    });
    router.push(`/result/${attemptId}`);
  }, [attemptId, router]);

  // Timer countdown + auto-submit
  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          handleSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, handleSubmit]);

  async function saveAnswer(questionId: string, selected?: string, marked?: boolean) {
    setResponses((prev) => ({ ...prev, [questionId]: { ...prev[questionId], selected, marked: marked ?? prev[questionId]?.marked } }));
    if (!attemptId) return;
    fetch(`/api/attempts/${attemptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: questionId, selected_option: selected ?? null, marked_for_review: marked }),
    }).catch(() => {}); // autosave best-effort; ignore transient network errors
  }

  if (phase === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card w-full max-w-sm">
          <h1 className="font-bold text-navy mb-1">{mock?.title || "Loading test..."}</h1>
          <p className="text-sm text-gray-500 mb-4">{mock?.exam_name}</p>
          {mock?.instructions && <p className="text-xs text-gray-600 mb-4 whitespace-pre-line">{mock.instructions}</p>}
          <form onSubmit={startAttempt} className="space-y-3">
            <input
              type="password"
              className="input-field"
              placeholder="Enter test password"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full">Start Test</button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Submitting your test...</div>;
  }

  const q = questions[current];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const answeredCount = Object.values(responses).filter((r) => r.selected).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-navy text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="font-semibold">{mock?.title}</div>
        <div className="flex items-center gap-4 text-sm">
          <span>Q{current + 1}/{questions.length}</span>
          <span className={`font-mono px-2 py-1 rounded ${secondsLeft < 60 ? "bg-red-600" : "bg-blue-800"}`}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full">
        <main className="flex-1 p-5">
          {q && (
            <>
              <p className="font-medium mb-4">{current + 1}. {q.question_text}</p>
              {q.image_url && <img src={q.image_url} alt="question" className="max-w-full rounded mb-4" />}
              <div className="space-y-2">
                {(["a", "b", "c", "d"] as const).map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer ${
                      responses[q.id]?.selected === opt ? "border-navy bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={responses[q.id]?.selected === opt}
                      onChange={() => saveAnswer(q.id, opt)}
                    />
                    <span>{(q as any)[`option_${opt}`]}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} className="border rounded-lg px-4 py-2 text-sm" disabled={current === 0}>
                  Previous
                </button>
                <button onClick={() => saveAnswer(q.id, undefined)} className="border rounded-lg px-4 py-2 text-sm">
                  Clear Response
                </button>
                <button onClick={() => saveAnswer(q.id, responses[q.id]?.selected, !responses[q.id]?.marked)} className="border rounded-lg px-4 py-2 text-sm">
                  {responses[q.id]?.marked ? "Unmark Review" : "Mark for Review"}
                </button>
                {current < questions.length - 1 ? (
                  <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary text-sm">Save & Next</button>
                ) : (
                  <button onClick={() => handleSubmit(false)} className="btn-gold text-sm">Submit Test</button>
                )}
              </div>
            </>
          )}
        </main>

        <aside className="md:w-64 p-5 border-t md:border-t-0 md:border-l bg-white">
          <p className="text-sm text-gray-600 mb-2">Answered: {answeredCount}/{questions.length}</p>
          <div className="grid grid-cols-6 md:grid-cols-5 gap-2 mb-4">
            {questions.map((qq, i) => {
              const r = responses[qq.id];
              const cls = r?.selected
                ? "bg-green-600 text-white"
                : r?.marked
                ? "bg-purple-500 text-white"
                : "bg-gray-200 text-gray-700";
              return (
                <button key={qq.id} onClick={() => setCurrent(i)} className={`w-9 h-9 rounded text-xs font-medium ${cls} ${current === i ? "ring-2 ring-navy" : ""}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <button onClick={() => handleSubmit(false)} className="btn-primary w-full text-sm">Submit Test</button>
        </aside>
      </div>
    </div>
  );
}
