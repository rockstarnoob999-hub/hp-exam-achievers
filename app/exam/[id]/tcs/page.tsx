"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Question = {
  id: string;
  question_text: string;
  question_text_hi?: string;
  image_url?: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  option_a_hi?: string; option_b_hi?: string; option_c_hi?: string; option_d_hi?: string;
  option_a_image?: string; option_b_image?: string;
  option_c_image?: string; option_d_image?: string;
  marks: number;
};

type Resp = { selected?: string; marked?: boolean };
type Status = "answered" | "not_answered" | "not_visited" | "marked" | "answered_marked";

const STATUS_STYLE: Record<Status, string> = {
  answered: "bg-green-500 text-white rounded-t-xl",
  not_answered: "bg-red-500 text-white rounded-b-xl",
  not_visited: "bg-gray-100 text-gray-700 border border-gray-300 rounded",
  marked: "bg-purple-600 text-white rounded-full",
  answered_marked: "bg-purple-600 text-white rounded-full ring-2 ring-green-400",
};

export default function TcsExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<"intro" | "exam" | "submitting">("intro");
  const [mock, setMock] = useState<any>(null);
  const [accessPassword, setAccessPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<Record<string, Resp>>({});
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [hindi, setHindi] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resumed, setResumed] = useState(false);

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
    if (!res.ok) {
      if (data.timed_out) {
        setError("Your previous attempt timed out. Redirecting to results...");
        setTimeout(() => router.push("/result/" + data.attempt_id), 2000);
        return;
      }
      setError(data.error);
      return;
    }

    setAttemptId(data.attempt.id);
    const qRes = await fetch("/api/mocks/" + id);
    const qData = await qRes.json();
    setQuestions(qData.questions || []);
    setSecondsLeft(data.remaining_seconds || (qData.mock.duration_minutes || 30) * 60);

    if (data.resuming && data.saved_answers?.length > 0) {
      const restored: Record<string, Resp> = {};
      data.saved_answers.forEach((a: any) => {
        restored[a.question_id] = {
          selected: a.selected_option || undefined,
          marked: !!a.marked_for_review,
        };
      });
      setResponses(restored);
    }
    if (data.resuming) setResumed(true);
    setPhase("exam");
  }

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current || !attemptId) return;
    submittedRef.current = true;
    setShowConfirm(false);
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

  useEffect(() => {
    if (phase !== "exam" || !questions[current]) return;
    const qid = questions[current].id;
    setVisited((prev) => {
      if (prev.has(qid)) return prev;
      const next = new Set(prev);
      next.add(qid);
      return next;
    });
  }, [phase, current, questions]);

  useEffect(() => {
    if (phase !== "exam") return;
    function warn(e: BeforeUnloadEvent) { e.preventDefault(); e.returnValue = ""; }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  function persist(qid: string, selected: string | null, marked: boolean) {
    setResponses((prev) => ({ ...prev, [qid]: { selected: selected ?? undefined, marked } }));
    if (!attemptId) return;
    fetch("/api/attempts/" + attemptId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: qid, selected_option: selected, marked_for_review: marked }),
    }).catch(() => {});
  }

  function getStatus(qid: string): Status {
    const r = responses[qid];
    const sel = !!r?.selected;
    const mk = !!r?.marked;
    if (sel && mk) return "answered_marked";
    if (sel) return "answered";
    if (mk) return "marked";
    if (visited.has(qid)) return "not_answered";
    return "not_visited";
  }

  function goNext() {
    setCurrent((c) => Math.min(questions.length - 1, c + 1));
  }

  function fmtTime(total: number) {
    const h = Math.floor(total / 3600).toString().padStart(2, "0");
    const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return h + ":" + m + ":" + s;
  }

  // ---------------- INTRO ----------------
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-[#1f4e79] text-white px-4 md:px-6 py-3 flex items-center justify-between">
          <p className="font-bold text-sm md:text-base">HP Exam Achievers - CBT Mode</p>
          <Link href="/student/dashboard" className="text-xs text-blue-200 hover:text-white">Back to Dashboard</Link>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white border border-gray-300 shadow-sm">
            <div className="bg-[#e8eef5] border-b border-gray-300 px-5 py-3">
              <h1 className="font-bold text-[#1f4e79]">{mock?.title || "Loading test..."}</h1>
              <p className="text-xs text-gray-500">
                {mock?.exam_name}
                {mock?.duration_minutes ? " | Duration: " + mock.duration_minutes + " minutes" : ""}
                {mock?.total_marks ? " | Maximum Marks: " + mock.total_marks : ""}
              </p>
            </div>

            <div className="p-5 text-sm text-gray-700 space-y-3">
              <p className="font-bold text-gray-900">General Instructions</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>The clock is set on the server. The countdown timer at the top right shows the time left. When it reaches zero the test is submitted automatically.</li>
                <li>The question palette on the right shows the status of each question:</li>
              </ol>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                {([
                  ["not_visited", "You have not visited the question yet."],
                  ["not_answered", "You have not answered the question."],
                  ["answered", "You have answered the question."],
                  ["marked", "You have NOT answered but marked it for review."],
                  ["answered_marked", "Answered and marked for review."],
                ] as [Status, string][]).map(([st, text]) => (
                  <div key={st} className="flex items-center gap-2">
                    <span className={"w-8 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0 " + STATUS_STYLE[st]}>1</span>
                    <span className="text-xs">{text}</span>
                  </div>
                ))}
              </div>

              <ol start={3} className="list-decimal pl-5 space-y-2">
                <li>Click an option to select your answer. Your answer is saved instantly.</li>
                <li><b>Clear Response</b> removes your selected answer for that question.</li>
                <li><b>Mark for Review &amp; Next</b> flags the question and moves ahead. Answered questions that are marked for review are still evaluated.</li>
                <li>Use the numbers in the palette to jump to any question.</li>
                <li>Use the <b>View in</b> dropdown to switch between English and Hindi, where available.</li>
                {mock?.negative_marking > 0 && (
                  <li>There is negative marking of <b>{mock.negative_marking}</b> for each wrong answer.</li>
                )}
                <li>If your internet drops or you close the browser, log in again and click the same test. You will resume with your saved answers and the remaining time.</li>
              </ol>

              {mock?.instructions && (
                <div className="border border-blue-200 bg-blue-50 rounded p-3 text-xs whitespace-pre-line">
                  <p className="font-bold text-[#1f4e79] mb-1">Instructions from your teacher</p>
                  {mock.instructions}
                </div>
              )}
            </div>

            <form onSubmit={startAttempt} className="border-t border-gray-300 p-5 space-y-3 bg-gray-50">
              <input
                type="password"
                className="input-field"
                placeholder="Enter test password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                required
              />
              <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                I have read and understood the instructions. I am ready to begin the test.
              </label>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!agreed}
                className="w-full py-3 font-semibold text-white bg-[#1f4e79] hover:bg-[#163a5c] transition disabled:opacity-40 disabled:cursor-not-allowed">
                I am ready to begin
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-[#1f4e79] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Submitting your test...</p>
          <p className="text-gray-400 text-sm mt-1">Please do not close this page.</p>
        </div>
      </div>
    );
  }

  // ---------------- EXAM ----------------
  const q = questions[current];
  const hasHindi = questions.some((x) => x.question_text_hi);
  const counts = { answered: 0, not_answered: 0, not_visited: 0, marked: 0, answered_marked: 0 };
  questions.forEach((x) => { counts[getStatus(x.id)]++; });
  const negative = Number(mock?.negative_marking || 0);

  function txt(en: string, hi?: string) {
    return hindi && hi ? hi : en;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden select-none">

      {/* Top bar */}
      <header className="bg-[#1f4e79] text-white px-3 md:px-5 py-2 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{mock?.title}</p>
          <p className="text-xs text-blue-200 truncate">{mock?.exam_name}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {hasHindi && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-blue-200">View in:</span>
              <select
                value={hindi ? "hi" : "en"}
                onChange={(e) => setHindi(e.target.value === "hi")}
                className="text-gray-800 text-xs px-2 py-1 rounded">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          )}
          <div className={"px-3 py-1 rounded font-mono font-bold text-sm md:text-base " + (
            secondsLeft < 300 ? "bg-red-600 animate-pulse" : "bg-white text-[#1f4e79]"
          )}>
            <span className={"hidden sm:inline text-xs font-sans font-medium mr-1.5 " + (secondsLeft < 300 ? "text-white" : "text-gray-500")}>Time Left:</span>
            {fmtTime(secondsLeft)}
          </div>
          <button
            onClick={() => setShowPanel(true)}
            className="lg:hidden bg-white/15 border border-white/30 px-3 py-1 rounded text-xs font-medium">
            Palette
          </button>
        </div>
      </header>

      {resumed && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-1.5 text-xs text-blue-700 flex items-center justify-center gap-3 flex-shrink-0">
          Resumed from where you left off. Your answers and remaining time are restored.
          <button onClick={() => setResumed(false)} className="font-bold">x</button>
        </div>
      )}

      {/* Section strip */}
      <div className="bg-white border-b border-gray-300 px-3 md:px-5 py-1.5 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-[#1f4e79] bg-[#e8eef5] border border-[#c5d3e3] px-3 py-1 rounded-sm">
          {mock?.exam_name || "Questions"}
        </span>
        <span className="text-xs text-gray-500">{answeredTotal(counts)} / {questions.length} answered</span>
      </div>

      <div className="flex-1 flex min-h-0 relative">

        {/* Question area */}
        <section className="flex-1 flex flex-col min-w-0 bg-white">
          {q && (
            <>
              <div className="border-b border-gray-300 px-3 md:px-5 py-2 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                <p className="font-bold text-sm text-gray-800">Question No. {current + 1}</p>
                <p className="text-xs text-gray-500">
                  Marks for correct answer: <b className="text-green-600">{q.marks}</b>
                  {" | "}Negative marks: <b className="text-red-500">{negative}</b>
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-3 md:px-5 py-4">
                <p className="text-sm md:text-base text-gray-900 leading-relaxed whitespace-pre-line">
                  {txt(q.question_text, q.question_text_hi)}
                </p>
                {q.image_url && (
                  <img src={q.image_url} alt="question diagram"
                    className="max-w-full max-h-72 mt-3 border border-gray-200 object-contain" />
                )}

                <div className="mt-5 space-y-2.5">
                  {(["a", "b", "c", "d"] as const).map((opt, idx) => {
                    const optText = txt((q as any)["option_" + opt], (q as any)["option_" + opt + "_hi"]);
                    const optImage = (q as any)["option_" + opt + "_image"];
                    const selected = responses[q.id]?.selected === opt;
                    return (
                      <label
                        key={opt}
                        className={"flex items-start gap-3 px-3 py-2.5 border cursor-pointer transition " + (
                          selected ? "bg-blue-50 border-[#1f4e79]" : "bg-white border-gray-300 hover:bg-gray-50"
                        )}>
                        <input
                          type="radio"
                          name={"q-" + q.id}
                          checked={selected}
                          onChange={() => persist(q.id, opt, !!responses[q.id]?.marked)}
                          className="mt-1 accent-[#1f4e79] flex-shrink-0"
                        />
                        <div className="flex-1 text-sm text-gray-800">
                          <span className="font-semibold mr-2">{idx + 1}.</span>
                          {optText}
                          {optImage && (
                            <img src={optImage} alt={"option " + (idx + 1)}
                              className="max-w-full max-h-44 mt-2 border border-gray-200 object-contain" />
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action bar */}
              <div className="border-t border-gray-300 bg-gray-50 px-3 md:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      persist(q.id, responses[q.id]?.selected ?? null, true);
                      goNext();
                    }}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium border border-gray-400 bg-white hover:bg-gray-100 transition">
                    Mark for Review &amp; Next
                  </button>
                  <button
                    onClick={() => persist(q.id, null, !!responses[q.id]?.marked)}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium border border-gray-400 bg-white hover:bg-gray-100 transition">
                    Clear Response
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                    disabled={current === 0}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium border border-gray-400 bg-white hover:bg-gray-100 transition disabled:opacity-40">
                    &lt;&lt; Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={current === questions.length - 1}
                    className="px-4 md:px-5 py-2 text-xs md:text-sm font-semibold text-white bg-[#1f7acb] hover:bg-[#1665a8] transition disabled:opacity-40">
                    Save &amp; Next &gt;&gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Right panel */}
        {showPanel && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowPanel(false)}></div>
        )}
        <aside className={
          "bg-[#e8eef5] border-l border-gray-300 flex flex-col w-72 flex-shrink-0 z-50 " +
          "fixed inset-y-0 right-0 transition-transform duration-300 lg:static lg:translate-x-0 " +
          (showPanel ? "translate-x-0" : "translate-x-full")
        }>
          <div className="flex items-center gap-3 px-3 py-3 bg-white border-b border-gray-300 flex-shrink-0">
            <div className="w-12 h-12 bg-gray-200 border border-gray-300 flex items-center justify-center text-2xl">👤</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Candidate</p>
              <p className="text-xs text-gray-500">{questions.length} questions</p>
            </div>
            <button onClick={() => setShowPanel(false)} className="lg:hidden text-gray-500 text-sm underline">Close</button>
          </div>

          <div className="px-3 py-3 grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-gray-700 bg-white border-b border-gray-300 flex-shrink-0">
            {([
              ["answered", "Answered", counts.answered],
              ["not_answered", "Not Answered", counts.not_answered],
              ["not_visited", "Not Visited", counts.not_visited],
              ["marked", "Marked for Review", counts.marked],
            ] as [Status, string, number][]).map(([st, label, n]) => (
              <div key={st} className="flex items-center gap-1.5">
                <span className={"w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0 " + STATUS_STYLE[st]}>{n}</span>
                <span className="leading-tight">{label}</span>
              </div>
            ))}
            <div className="col-span-2 flex items-center gap-1.5">
              <span className={"w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0 " + STATUS_STYLE.answered_marked}>{counts.answered_marked}</span>
              <span className="leading-tight">Answered &amp; Marked for Review (will be evaluated)</span>
            </div>
          </div>

          <div className="bg-[#1f4e79] text-white text-xs font-semibold px-3 py-1.5 flex-shrink-0">
            {mock?.exam_name || "Question Palette"}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((qq, i) => {
                const st = getStatus(qq.id);
                return (
                  <button
                    key={qq.id}
                    onClick={() => { setCurrent(i); setShowPanel(false); }}
                    className={"h-9 text-xs font-bold transition " + STATUS_STYLE[st] +
                      (current === i ? " outline outline-2 outline-offset-1 outline-[#1f4e79]" : "")}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-gray-300 bg-white flex-shrink-0 space-y-2">
            {hasHindi && (
              <select
                value={hindi ? "hi" : "en"}
                onChange={(e) => setHindi(e.target.value === "hi")}
                className="sm:hidden w-full text-xs border border-gray-300 px-2 py-1.5">
                <option value="en">View in: English</option>
                <option value="hi">View in: Hindi</option>
              </select>
            )}
            <button
              onClick={() => { setShowPanel(false); setShowConfirm(true); }}
              className="w-full py-2.5 text-sm font-semibold text-white bg-[#2e9b4f] hover:bg-[#25803f] transition">
              Submit
            </button>
          </div>
        </aside>
      </div>

      {/* Submit confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md shadow-2xl">
            <div className="bg-[#1f4e79] text-white px-4 py-3 font-semibold text-sm">
              Exam Summary
            </div>
            <div className="p-4">
              <table className="w-full text-sm border border-gray-300">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="px-3 py-2 text-gray-600">Total Questions</td>
                    <td className="px-3 py-2 font-bold text-right">{questions.length}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-3 py-2 text-gray-600">Answered</td>
                    <td className="px-3 py-2 font-bold text-right text-green-600">{counts.answered + counts.answered_marked}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-3 py-2 text-gray-600">Not Answered</td>
                    <td className="px-3 py-2 font-bold text-right text-red-500">{counts.not_answered}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-3 py-2 text-gray-600">Marked for Review</td>
                    <td className="px-3 py-2 font-bold text-right text-purple-600">{counts.marked + counts.answered_marked}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-600">Not Visited</td>
                    <td className="px-3 py-2 font-bold text-right text-gray-500">{counts.not_visited}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-3">
                Are you sure you want to submit? You cannot change your answers after submitting.
              </p>
              <p className="text-xs text-gray-400 mt-1">Time left: {fmtTime(secondsLeft)}</p>
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-400 hover:bg-gray-100 transition">
                No, go back
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#2e9b4f] hover:bg-[#25803f] transition">
                Yes, submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function answeredTotal(c: { answered: number; answered_marked: number }) {
  return c.answered + c.answered_marked;
}