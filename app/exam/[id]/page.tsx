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

  // Swipe support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0 && current < questions.length - 1) setCurrent((c) => c + 1);
      if (dx > 0 && current > 0) setCurrent((c) => c - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

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
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="font-bold text-navy text-xl mb-1">HP <span className="text-gold">Exam Achievers</span></div>
            <Link href="/" className="text-xs text-gray-400 hover:text-navy transition">Home</Link>
          </div>
          <div className="bg-white rounded-2xl border border-blue-100 p-7 shadow-md">
            <h2 className="font-bold text-navy text-lg mb-1">{mock?.title || "Loading test..."}</h2>
            <p className="text-sm text-gray-400 mb-1">{mock?.exam_name}</p>
            {mock?.duration_minutes && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-blue-50 text-navy px-3 py-1 rounded-full border border-blue-200">
                  {mock.duration_minutes} minutes
                </span>
              </div>
            )}
            {mock?.instructions && (
              <p className="text-xs text-gray-500 mb-4 whitespace-pre-line border border-blue-100 rounded-xl p-3 bg-blue-50/30">
                {mock.instructions}
              </p>
            )}
            <form onSubmit={startAttempt} className="space-y-3">
              <input type="password" className="input-field" placeholder="Enter test password"
                value={accessPassword} onChange={(e) => setAccessPassword(e.target.value)} required />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-navy border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Submitting your test...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait, do not close this page.</p>
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
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  function getText(en: string, hi: string) {
    return hindi && hi ? hi : en;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-blue-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="font-semibold text-navy text-sm truncate max-w-[160px] md:max-w-xs">{mock?.title}</div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-gray-400">Q{current + 1}/{questions.length}</span>
          <span className={"font-mono px-3 py-1.5 rounded-xl font-bold text-sm " + (
            secondsLeft < 60
              ? "bg-red-100 text-red-600 border border-red-200 animate-pulse"
              : secondsLeft < 300
              ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
              : "bg-blue-50 text-navy border border-blue-200"
          )}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
          <button onClick={() => setShowPalette(true)}
            className="md:hidden bg-navy text-white text-xs px-3 py-1.5 rounded-lg font-medium">
            {answeredCount}/{questions.length}
          </button>
        </div>
      </header>

      <div className="w-full bg-gray-100 h-1">
        <div className="bg-green-500 h-1 transition-all duration-500" style={{ width: progressPercent + "%" }} />
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}>

        <main className="flex-1 p-4 md:p-5">
          {q && (
            <>
              <div className="bg-white rounded-2xl border border-blue-100 p-5 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-50 text-navy px-2 py-1 rounded-lg border border-blue-200 font-medium">
                      Q{current + 1}/{questions.length}
                    </span>
                    {q.marks > 1 && (
                      <span className="text-xs bg-gold/20 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-200">
                        {q.marks} marks
                      </span>
                    )}
                    {responses[q.id]?.marked && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-lg border border-purple-200">
                        Marked for review
                      </span>
                    )}
                  </div>
                  {hasHindi && (
                    <button onClick={() => setHindi(!hindi)}
                      className={"text-xs px-3 py-1 rounded-lg border font-medium transition " + (
                        hindi ? "bg-orange-50 border-orange-300 text-orange-600" : "bg-gray-50 border-gray-200 text-gray-500"
                      )}>
                      {hindi ? "Hindi" : "English"}
                    </button>
                  )}
                </div>
                <p className="font-medium text-navy leading-relaxed text-base">
                  {getText(q.question_text, q.question_text_hi)}
                </p>
                {q.image_url && (
                  <img src={q.image_url} alt="question diagram"
                    className="max-w-full max-h-64 rounded-xl mt-3 border border-gray-200 object-contain mx-auto block" />
                )}
              </div>

              <div className="space-y-2.5 mb-5">
                {(["a", "b", "c", "d"] as const).map((opt) => {
                  const optImage = (q as any)["option_" + opt + "_image"];
                  const optText = getText((q as any)["option_" + opt], (q as any)["option_" + opt + "_hi"]);
                  const isSelected = responses[q.id]?.selected === opt;
                  return (
                    <label key={opt}
                      className={"flex items-start gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-all duration-200 " + (
                        isSelected
                          ? "border-navy bg-blue-50 shadow-sm"
                          : "border-blue-100 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                      )}>
                      <div className={"flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition " + (
                        isSelected ? "border-navy bg-navy" : "border-gray-300"
                      )}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <input type="radio" name={q.id} checked={isSelected}
                        onChange={() => saveAnswer(q.id, opt)} className="hidden" />
                      <div className="flex-1">
                        <span className={"font-semibold mr-2 " + (isSelected ? "text-navy" : "text-gray-500")}>
                          {opt.toUpperCase()}.
                        </span>
                        <span className={isSelected ? "text-navy font-medium" : "text-gray-700"}>{optText}</span>
                        {optImage && (
                          <img src={optImage} alt={"option " + opt}
                            className="max-w-full max-h-40 rounded-xl mt-2 border border-gray-200 object-contain" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="hidden sm:block text-xs text-gray-400 text-center mb-3">
                Swipe left/right on mobile to navigate questions
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
                  className="border border-blue-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm hover:bg-blue-50 transition disabled:opacity-30 font-medium">
                  Previous
                </button>
                <button onClick={() => saveAnswer(q.id, undefined)}
                  className="border border-blue-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm hover:bg-blue-50 transition font-medium">
                  Clear
                </button>
                <button
                  onClick={() => saveAnswer(q.id, responses[q.id]?.selected, !responses[q.id]?.marked)}
                  className={"border rounded-xl px-4 py-2.5 text-sm transition font-medium " + (
                    responses[q.id]?.marked
                      ? "border-purple-300 text-purple-600 bg-purple-50"
                      : "border-blue-200 text-gray-500 hover:bg-blue-50"
                  )}>
                  {responses[q.id]?.marked ? "Unmark" : "Mark Review"}
                </button>
                {current < questions.length - 1 ? (
                  <button onClick={() => setCurrent((c) => c + 1)}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 ml-auto"
                    style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
                    Save & Next
                  </button>
                ) : (
                  <button onClick={() => handleSubmit(false)}
                    className="bg-green-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-green-500 transition ml-auto">
                    Submit Test
                  </button>
                )}
              </div>
            </>
          )}
        </main>

        <aside className="hidden md:block md:w-64 p-5 border-l border-blue-100 bg-white/50">
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{answeredCount}/{questions.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: progressPercent + "%" }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500 inline-block"></span>Answered ({answeredCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-400 inline-block"></span>Review ({markedCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-200 inline-block"></span>Pending
            </span>
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
                <button key={qq.id} onClick={() => setCurrent(i)}
                  className={"w-9 h-9 rounded-lg text-xs font-medium border transition " + cls +
                    (current === i ? " ring-2 ring-navy ring-offset-1" : "")}>
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button onClick={() => handleSubmit(false)}
            className="w-full py-2.5 rounded-xl font-semibold text-white text-sm transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
            Submit Test
          </button>
        </aside>
      </div>

      {showPalette && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-5 md:hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-navy">Question Palette</h3>
            <button onClick={() => setShowPalette(false)} className="text-gray-400 text-sm underline">Close</button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{answeredCount}/{questions.length} answered</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: progressPercent + "%" }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span>Answered</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-400 inline-block"></span>Review</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block"></span>Not visited</span>
          </div>

          <div className="grid grid-cols-6 gap-2 mb-6 overflow-y-auto flex-1">
            {questions.map((qq, i) => {
              const r = responses[qq.id];
              const cls = r?.selected
                ? "bg-green-500 text-white"
                : r?.marked
                ? "bg-purple-400 text-white"
                : "bg-gray-100 text-gray-500";
              return (
                <button key={qq.id} onClick={() => { setCurrent(i); setShowPalette(false); }}
                  className={"h-11 rounded-xl text-sm font-semibold transition " + cls +
                    (current === i ? " ring-2 ring-navy ring-offset-1" : "")}>
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button onClick={() => handleSubmit(false)}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
            Submit Test
          </button>
        </div>
      )}
    </div>
  );
}