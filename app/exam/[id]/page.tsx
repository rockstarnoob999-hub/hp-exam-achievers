"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Question = {
  id: string;
  question_text: string;
  question_text_hi: string;
  image_url?: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  option_a_hi: string; option_b_hi: string; option_c_hi: string; option_d_hi: string;
  option_a_image?: string; option_b_image?: string;
  option_c_image?: string; option_d_image?: string;
  marks: number;
};

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<"password" | "exam" | "submitting">("password");
  const [accessPassword, setAccessPassword] = useState("");
  const [error, setError] = useState("");
  const [hindi, setHindi] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

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
            <div className="font-bold text-navy text-xl mb-1">HP <span className="text-gold">Exam Achievers</span></div>
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
              <input type="password" className="input-field" placeholder="Enter test password"
                value={accessPassword} onChange={(e) => setAccessPassword(e.target.value)} required />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" className="btn-primary w-full">Start Test</button>
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
  const markedCount = Object.values(responses).filter((r) => r.marked).length;
  const hasHindi = q && (q.question_text_hi || q.option_a_hi);

  function getText(en: string, hi: string) {
    return hindi && hi ? hi : en;
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)" }}>

      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="font-semibold text-navy text-sm truncate max-w-[180px]">{mock?.title}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">Q{current + 1}/{questions.length}</span>
          <span className={"font-mono px-3 py-1 rounded-lg font-semibold text-sm " + (
            secondsLeft < 60 ? "bg-red-100 text-red-600 border border-red-200" :
            secondsLeft < 300 ? "bg-yellow-50 text-yellow-600 border border-yellow-200" :
            "bg-blue-50 text-navy border border-blue-100"
          )}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="md:hidden bg-navy text-white text-xs px-3 py-1.5 rounded-lg"
          >
            Palette
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full relative">
        <main className="flex-1 p-4 md:p-5">
          {q && (
            <>
              <div className="bg-white/90 border border-blue-100 rounded-xl p-4 md:p-5 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400 font-medium">
                    Question {current + 1} of {questions.length}
                    {q.marks > 1 && " - " + q.marks + " marks"}
                  </span>
                  {hasHindi && (
                    <button
                      onClick={() => setHindi(!hindi)}
                      className={"text-xs px-3 py-1 rounded-lg border font-medium transition " + (
                        hindi ? "bg-orange-50 border-orange-300 text-orange-600" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-navy"
                      )}
                    >
                      {hindi ? "Hindi" : "English"}
                    </button>
                  )}
                </div>
                <p className="font-medium text-navy leading-relaxed">
                  {current + 1}. {getText(q.question_text, q.question_text_hi)}
                </p>
                {q.image_url && (
                  <img src={q.image_url} alt="question diagram"
                    className="max-w-full max-h-60 rounded-lg mt-3 border border-gray-200 object-contain" />
                )}
              </div>

              <div className="space-y-2 mb-5">
                {(["a", "b", "c", "d"] as const).map((opt) => {
                  const optImage = (q as any)["option_" + opt + "_image"];
                  const optText = getText((q as any)["option_" + opt], (q as any)["option_" + opt + "_hi"]);
                  const isSelected = responses[q.id]?.selected === opt;
                  return (
                    <label
                      key={opt}
                      className={"flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition bg-white/80 " + (
                        isSelected
                          ? "border-navy bg-blue-50 text-navy font-medium"
                          : "border-blue-100 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50"
                      )}
                    >
                      <input type="radio" name={q.id} checked={isSelected}
                        onChange={() => saveAnswer(q.id, opt)} className="accent-navy mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium mr-1">{opt.toUpperCase()}.</span>
                        {optText && <span>{optText}</span>}
                        {optImage && (
                          <img src={optImage} alt={"option " + opt}
                            className="max-w-full max-h-40 rounded-lg mt-2 border border-gray-200 object-contain" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
                  className="border border-blue-200 text-gray-500 rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition disabled:opacity-30">
                  Previous
                </button>
                <button onClick={() => saveAnswer(q.id, undefined)}
                  className="border border-blue-200 text-gray-500 rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition">
                  Clear
                </button>
                <button
                  onClick={() => saveAnswer(q.id, responses[q.id]?.selected, !responses[q.id]?.marked)}
                  className={"border rounded-lg px-4 py-2 text-sm transition " + (
                    responses[q.id]?.marked
                      ? "border-purple-300 text-purple-600 bg-purple-50"
                      : "border-blue-200 text-gray-500 hover:bg-blue-50"
                  )}>
                  {responses[q.id]?.marked ? "Unmark Review" : "Mark for Review"}
                </button>
                {current < questions.length - 1 ? (
                  <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary text-sm">
                    Save & Next
                  </button>
                ) : (
                  <button onClick={() => handleSubmit(false)}
                    className="bg-green-600 text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-green-500 transition">
                    Submit Test
                  </button>
                )}
              </div>
            </>
          )}
        </main>

        <aside className={
          "md:w-64 border-blue-100 bg-white/60 " +
          "md:block md:border-l md:p-5 " +
          (showPalette
            ? "fixed inset-0 z-50 bg-white p-5 overflow-y-auto"
            : "hidden")
        }>
          {showPalette && (
            <button onClick={() => setShowPalette(false)}
              className="w-full text-right text-xs text-gray-400 mb-3 underline">
              Close
            </button>
          )}

          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">Progress</p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: (answeredCount / questions.length * 100) + "%" }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{answeredCount}/{questions.length} answered</p>
          </div>

          <div className="flex flex-wrap gap-1 mb-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span>Answered</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-400 inline-block"></span>Review ({markedCount})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block"></span>Not visited</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {questions.map((qq, i) => {
              const r = responses[qq.id];
              const cls = r?.selected
                ? "bg-green-500 text-white border-green-500"
                : r?.marked
                ? "bg-purple-400 text-white border-purple-400"
                : "bg-white text-gray-400 border-blue-100";
              return (
                <button key={qq.id} onClick={() => { setCurrent(i); setShowPalette(false); }}
                  className={"w-9 h-9 rounded-lg text-xs font-medium border transition " + cls +
                    (current === i ? " ring-2 ring-navy ring-offset-1" : "")}>
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button onClick={() => handleSubmit(false)} className="btn-primary w-full text-sm">
            Submit Test
          </button>
        </aside>
      </div>
    </div>
  );
}