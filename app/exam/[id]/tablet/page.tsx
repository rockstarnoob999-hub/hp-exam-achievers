"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// How long a student must press an OMR bubble before it is marked.
// The real exam says about 2 seconds. Change this number if you want it faster or slower.
const HOLD_MS = 800;

type Question = {
  id: string;
  question_text: string;
  question_text_hi?: string | null;
  image_url?: string | null;
  option_a: string; option_b: string; option_c: string; option_d: string;
  option_a_hi?: string | null; option_b_hi?: string | null;
  option_c_hi?: string | null; option_d_hi?: string | null;
  option_a_image?: string | null; option_b_image?: string | null;
  option_c_image?: string | null; option_d_image?: string | null;
  marks: number;
};

type Resp = { selected?: string; marked?: boolean };

type Phase =
  | "start" | "details" | "instructions" | "password"
  | "exam" | "review" | "sign" | "submitting" | "done";

const TOUR = [
  { title: "Resize the screen", text: "Drag the three-dot handle in the middle of the screen up or down to give more room to the question paper or to the OMR answer sheet." },
  { title: "Scroll", text: "Swipe up or down to scroll the question paper or the OMR sheet." },
  { title: "Zoom the paper", text: "Pinch in or out on the question paper to zoom. You can also use the A- and A+ buttons." },
  { title: "Mark an answer", text: "Tap and hold the bubble you want on the OMR sheet until it fills in. Then let go." },
  { title: "Change or remove an answer", text: "To change an answer, tap and hold the new bubble. To remove an answer, tap and hold the selected bubble again." },
  { title: "Mark for review", text: "Tap a question number on the OMR sheet. It turns orange and the paper jumps to that question. Tap it again to unmark." },
  { title: "Submit", text: "When you are done, tap Review & Submit, check the summary, sign on the screen and submit. The test also submits by itself when the timer ends." },
];

function fmtTime(total: number) {
  const h = Math.floor(total / 3600).toString().padStart(2, "0");
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return h + ":" + m + ":" + s;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function touchDist(t: React.TouchList) {
  const dx = t[0].clientX - t[1].clientX;
  const dy = t[0].clientY - t[1].clientY;
  return Math.hypot(dx, dy);
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#1a9e85] text-white px-4 py-3 flex items-center justify-between">
        <p className="font-bold text-sm">{title}</p>
        <Link href="/student/dashboard" className="text-xs text-white/80 hover:text-white">
          Back to Dashboard
        </Link>
      </header>
      <main className="max-w-xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function SignaturePad({ onInk }: { onInk: (has: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    last.current = pos(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    onInk(true);
  }

  function up() {
    drawing.current = false;
    last.current = null;
  }

  function clear() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    onInk(false);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="w-full h-48 border-2 border-dashed border-gray-400 rounded-lg bg-white"
        style={{ touchAction: "none" }}
      />
      <button type="button" onClick={clear} className="mt-2 text-xs text-gray-500 underline">
        Clear signature
      </button>
    </div>
  );
}

export default function TabletExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("start");
  const [mock, setMock] = useState<any>(null);

  const [rollNo, setRollNo] = useState("");
  const [candName, setCandName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [error, setError] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [responses, setResponses] = useState<Record<string, Resp>>({});

  const [hindi, setHindi] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [split, setSplit] = useState(0.5);
  const [holdMode, setHoldMode] = useState(true);
  const [holding, setHolding] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [syncWarning, setSyncWarning] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [battery, setBattery] = useState<number | null>(null);
  const [signed, setSigned] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const responsesRef = useRef<Record<string, Resp>>({});
  const failedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false);
  const autoRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const qRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragging = useRef(false);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const timerOn = phase === "exam" || phase === "review" || phase === "sign";

  // ---------- load mock info ----------
  useEffect(() => {
    fetch("/api/mocks/" + id).then(async (res) => {
      if (res.status === 401) { router.push("/login?role=student"); return; }
      const data = await res.json();
      if (res.ok) setMock(data.mock);
    });
  }, [id]);

  // ---------- battery (only where the browser supports it) ----------
  useEffect(() => {
    const nav: any = navigator;
    if (!nav.getBattery) return;
    let bat: any = null;
    const update = () => { if (bat) setBattery(Math.round(bat.level * 100)); };
    nav.getBattery().then((b: any) => {
      bat = b;
      update();
      b.addEventListener("levelchange", update);
    }).catch(() => {});
    return () => { if (bat) bat.removeEventListener("levelchange", update); };
  }, []);

  // ---------- saving helpers ----------
  const resendFailed = useCallback(async () => {
    if (!attemptId) return;
    const failed = Array.from(failedRef.current);
    await Promise.all(failed.map(async (qid) => {
      const r = responsesRef.current[qid];
      try {
        const res = await fetch("/api/attempts/" + attemptId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: qid,
            selected_option: r?.selected ?? null,
            marked_for_review: !!r?.marked,
          }),
        });
        if (res.ok) failedRef.current.delete(qid);
      } catch {
        // still offline, will try again later
      }
    }));
    setSyncWarning(failedRef.current.size > 0);
  }, [attemptId]);

  useEffect(() => {
    window.addEventListener("online", resendFailed);
    return () => window.removeEventListener("online", resendFailed);
  }, [resendFailed]);

  function persist(qid: string, selected: string | null, marked: boolean) {
    const next = { ...responsesRef.current, [qid]: { selected: selected ?? undefined, marked } };
    responsesRef.current = next;
    setResponses(next);
    if (!attemptId) return;
    fetch("/api/attempts/" + attemptId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: qid, selected_option: selected, marked_for_review: marked }),
    })
      .then((res) => {
        if (res.ok) failedRef.current.delete(qid);
        else failedRef.current.add(qid);
        setSyncWarning(failedRef.current.size > 0);
      })
      .catch(() => {
        failedRef.current.add(qid);
        setSyncWarning(true);
      });
  }

  // ---------- submit ----------
  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current || !attemptId) return;
    submittedRef.current = true;
    setSubmitError("");
    setShowTour(false);
    setMenuOpen(false);
    setPhase("submitting");
    try {
      await resendFailed();
      const res = await fetch("/api/attempts/" + attemptId + "/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto }),
      });
      if (!res.ok) throw new Error("submit failed");
      setPhase("done");
    } catch {
      submittedRef.current = false;
      setSubmitError("Could not submit. Please check your internet connection and try again.");
      setPhase("review");
    }
  }, [attemptId, resendFailed]);

  // ---------- timer ----------
  useEffect(() => {
    if (!timerOn) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerOn]);

  useEffect(() => {
    if (timerOn && secondsLeft === 0 && !autoRef.current) {
      autoRef.current = true;
      handleSubmit(true);
    }
  }, [timerOn, secondsLeft, handleSubmit]);

  useEffect(() => {
    if (!timerOn) return;
    function warn(e: BeforeUnloadEvent) { e.preventDefault(); e.returnValue = ""; }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [timerOn]);

  // ---------- start the attempt ----------
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
    setSecondsLeft(data.remaining_seconds || (qData.mock?.duration_minutes || 30) * 60);

    if (data.resuming && data.saved_answers?.length > 0) {
      const restored: Record<string, Resp> = {};
      data.saved_answers.forEach((a: any) => {
        restored[a.question_id] = {
          selected: a.selected_option || undefined,
          marked: !!a.marked_for_review,
        };
      });
      responsesRef.current = restored;
      setResponses(restored);
    }
    if (data.resuming) setResumed(true);

    setTourStep(0);
    setShowTour(true);
    setPhase("exam");
  }

  // ---------- OMR interactions ----------
  function applyAnswer(qid: string, opt: string) {
    const cur = responsesRef.current[qid];
    const marked = !!cur?.marked;
    if (cur?.selected === opt) persist(qid, null, marked);
    else persist(qid, opt, marked);
  }

  function cancelHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHolding(null);
  }

  function startHold(qid: string, opt: string) {
    cancelHold();
    setHolding(qid + ":" + opt);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setHolding(null);
      applyAnswer(qid, opt);
      if ("vibrate" in navigator) navigator.vibrate(30);
    }, HOLD_MS);
  }

  function scrollToQuestion(qid: string) {
    const el = qRefs.current[qid];
    const box = paperRef.current;
    if (el && box) box.scrollTo({ top: Math.max(0, el.offsetTop - 44), behavior: "smooth" });
  }

  function toggleReview(qid: string) {
    const cur = responsesRef.current[qid];
    persist(qid, cur?.selected ?? null, !cur?.marked);
    scrollToQuestion(qid);
  }

  function jumpTo(i: number) {
    setPhase("exam");
    const q = questions[i];
    if (q) setTimeout(() => scrollToQuestion(q.id), 80);
  }

  function onPaperScroll() {
    const box = paperRef.current;
    if (!box) return;
    const top = box.scrollTop + 50;
    let idx = 0;
    for (let i = 0; i < questions.length; i++) {
      const el = qRefs.current[questions[i].id];
      if (el && el.offsetTop <= top) idx = i;
      else break;
    }
    setCurrentQ(idx);
  }

  // ---------- divider drag ----------
  function onHandleDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onHandleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSplit(clamp((e.clientY - rect.top) / rect.height, 0.2, 0.8));
  }
  function onHandleUp() {
    dragging.current = false;
  }

  // ---------- pinch zoom on the paper ----------
  function onPaperTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 2) pinchRef.current = { dist: touchDist(e.touches), zoom };
  }
  function onPaperTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 2 && pinchRef.current && pinchRef.current.dist > 0) {
      const ratio = touchDist(e.touches) / pinchRef.current.dist;
      setZoom(clamp(pinchRef.current.zoom * ratio, 0.8, 2.2));
    }
  }
  function onPaperTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length < 2) pinchRef.current = null;
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPhoto(URL.createObjectURL(f));
  }

  function txt(en: string, hi?: string | null) {
    return hindi && hi ? hi : en;
  }

  // ================= PRE-EXAM SCREENS =================
  if (phase === "start") {
    return (
      <Shell title="HP Exam Achievers - Tablet Mode">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-xs text-gray-400 mb-1">{mock?.exam_name}</p>
          <h1 className="text-xl font-bold text-gray-900 mb-4">{mock?.title || "Loading test..."}</h1>
          <div className="grid grid-cols-3 gap-2 mb-6 text-xs">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
              <p className="text-gray-400">Duration</p>
              <p className="font-bold text-gray-800">{mock?.duration_minutes ?? "--"} min</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
              <p className="text-gray-400">Marks</p>
              <p className="font-bold text-gray-800">{mock?.total_marks ?? "--"}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
              <p className="text-gray-400">Negative</p>
              <p className="font-bold text-gray-800">{mock?.negative_marking ?? 0}</p>
            </div>
          </div>
          <button
            onClick={() => setPhase("details")}
            disabled={!mock}
            className="w-full py-3 rounded-lg font-semibold text-white bg-[#1a9e85] hover:bg-[#158470] transition disabled:opacity-40">
            Start Exam
          </button>
          <p className="text-xs text-gray-400 mt-3">Tablet Based Test layout, like the HPRCA digital OMR exam.</p>
        </div>
      </Shell>
    );
  }

  if (phase === "details") {
    return (
      <Shell title="Candidate Details">
        <form
          onSubmit={(e) => { e.preventDefault(); setPhase("instructions"); }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500">Roll number</label>
            <input className="input-field mt-1" required value={rollNo}
              onChange={(e) => setRollNo(e.target.value)} placeholder="Enter your roll number" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Candidate name</label>
            <input className="input-field mt-1" required value={candName}
              onChange={(e) => setCandName(e.target.value)} placeholder="Enter your name" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Photo (optional)</label>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-300 overflow-hidden flex items-center justify-center text-2xl">
                {photo ? <img src={photo} alt="candidate" className="w-full h-full object-cover" /> : "👤"}
              </div>
              <input type="file" accept="image/*" capture="user" onChange={onPhoto} className="text-xs" />
            </div>
            <p className="text-xs text-gray-400 mt-1">The photo stays on your device only and is not uploaded.</p>
          </div>
          <button type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white bg-[#1a9e85] hover:bg-[#158470] transition">
            Next
          </button>
        </form>
      </Shell>
    );
  }

  if (phase === "instructions") {
    return (
      <Shell title="General Instructions">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
            <li>Your question paper and OMR answer sheet appear on one screen. Drag the <b>three-dot handle</b> in the middle to resize them.</li>
            <li><b>Swipe</b> up or down to scroll the paper or the OMR sheet. <b>Pinch</b> the paper to zoom.</li>
            <li>To mark an answer, <b>tap and hold</b> the bubble on the OMR sheet until it fills.</li>
            <li>To change an answer, tap and hold the new bubble. To remove it, tap and hold the selected bubble.</li>
            <li>To mark a question for review, <b>tap its number</b> on the OMR sheet. It turns orange.</li>
            <li>Use the <b>three-dot menu</b> at the top right to see the exam tour again, change language, or change the answer mode.</li>
            <li>When finished, tap <b>Review &amp; Submit</b>, check your summary, sign on the screen and submit.</li>
            <li>When the timer ends, the test is submitted automatically.</li>
            {mock?.negative_marking > 0 && (
              <li>There is negative marking of <b>{mock.negative_marking}</b> for each wrong answer.</li>
            )}
            <li>If your internet drops or you close the browser, log in again and open the same test. You will resume with your answers and the remaining time.</li>
          </ol>
          {mock?.instructions && (
            <div className="mt-4 border border-blue-200 bg-blue-50 rounded-lg p-3 text-xs whitespace-pre-line">
              <p className="font-bold text-[#1a9e85] mb-1">Instructions from your teacher</p>
              {mock.instructions}
            </div>
          )}
          <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer mt-5">
            <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            I have read and understood the instructions.
          </label>
          <button
            onClick={() => setPhase("password")}
            disabled={!agreed}
            className="w-full mt-4 py-3 rounded-lg font-semibold text-white bg-[#1a9e85] hover:bg-[#158470] transition disabled:opacity-40">
            Next
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "password") {
    return (
      <Shell title="Exam Password">
        <form onSubmit={startAttempt}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <p className="text-sm text-gray-600">Enter the exam password given by your teacher to begin.</p>
          <input type="password" className="input-field" required placeholder="Exam password"
            value={accessPassword} onChange={(e) => setAccessPassword(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white bg-[#1a9e85] hover:bg-[#158470] transition">
            Start
          </button>
        </form>
      </Shell>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-[#1a9e85] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-semibold">Please wait...</p>
          <p className="text-gray-400 text-sm mt-1">Your response is being submitted. Do not close this page.</p>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto text-3xl mb-4">✓</div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Exam submitted successfully</h1>
          <p className="text-sm text-gray-500 mb-6">Your responses have been saved. You can now see your result.</p>
          <button
            onClick={() => router.push("/result/" + attemptId)}
            className="w-full py-3 rounded-lg font-semibold text-white bg-[#1a9e85] hover:bg-[#158470] transition">
            Exit Now
          </button>
        </div>
      </div>
    );
  }

  // ================= EXAM SCREEN =================
  const attempted = questions.filter((x) => !!responses[x.id]?.selected).length;
  const markedCount = questions.filter((x) => !!responses[x.id]?.marked).length;
  const notAttempted = questions.length - attempted;
  const hasHindi = questions.some((x) => !!x.question_text_hi);
  const negative = Number(mock?.negative_marking || 0);

  const blockStarts: number[] = [];
  for (let s = 0; s < questions.length; s += 20) blockStarts.push(s);

  const notAttemptedList = questions
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => !responses[x.id]?.selected);
  const markedList = questions
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => !!responses[x.id]?.marked);

  function renderOmrRow(i: number) {
    const q = questions[i];
    if (!q) return null;
    const r = responses[q.id];
    return (
      <div key={q.id} className="flex items-center gap-1.5 py-1">
        <button
          type="button"
          onClick={() => toggleReview(q.id)}
          className={
            "omr-bubble w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 rounded-md text-xs font-bold border " +
            (r?.marked ? "bg-orange-400 text-white border-orange-500" : "bg-white text-gray-700 border-gray-300") +
            (i === currentQ ? " ring-2 ring-[#1a9e85]" : "")
          }>
          {i + 1}
        </button>
        <div className="flex-1 flex items-center justify-between gap-1">
          {(["a", "b", "c", "d"] as const).map((opt) => {
            const selected = r?.selected === opt;
            const key = q.id + ":" + opt;
            return (
              <button
                key={opt}
                type="button"
                onPointerDown={holdMode ? () => startHold(q.id, opt) : undefined}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                onPointerCancel={cancelHold}
                onClick={!holdMode ? () => applyAnswer(q.id, opt) : undefined}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    applyAnswer(q.id, opt);
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={
                  "omr-bubble relative overflow-hidden w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 text-xs font-bold flex items-center justify-center " +
                  (selected
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-[#e879c0] text-[#9d174d]")
                }>
                {holding === key && (
                  <span className="hold-fill absolute inset-0 bg-[#c026a3]/50"
                    style={{ animationDuration: HOLD_MS + "ms" }} />
                )}
                <span className="relative z-10">{opt.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex flex-col bg-white overflow-hidden relative h-screen"
      style={{ height: "100dvh" }}>

      <style>{`
        @keyframes holdfill { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .hold-fill { transform-origin: bottom; animation-name: holdfill; animation-timing-function: linear; animation-fill-mode: forwards; }
        .omr-bubble { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
      `}</style>

      {/* Header */}
      <header className="bg-[#1a9e85] text-white px-3 pt-2 pb-5 relative flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{mock?.title}</p>
            <p className="text-[11px] text-white/85 flex items-center gap-2 mt-0.5">
              <span className="bg-white/20 px-1.5 rounded">Q {Math.min(currentQ + 1, questions.length)}/{questions.length}</span>
              {battery !== null && <span>Battery {battery}%</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold">{rollNo}</p>
              <p className="text-[11px] text-white/85 truncate max-w-[90px]">{candName}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/25 border border-white/40 overflow-hidden flex items-center justify-center text-sm font-bold">
              {photo
                ? <img src={photo} alt="candidate" className="w-full h-full object-cover" />
                : (candName || "C").trim().charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-9 text-xl leading-none font-bold"
              aria-label="Menu">
              &#8942;
            </button>
          </div>
        </div>

        <div className={
          "absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm font-bold shadow " +
          (secondsLeft < 300 ? "bg-red-600 text-white animate-pulse" : "bg-gray-900 text-white")
        }>
          <span>&#9201;</span>
          {fmtTime(secondsLeft)}
        </div>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-2 top-12 z-40 w-64 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 text-sm overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); setTourStep(0); setShowTour(true); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                Exam tour
              </button>
              {hasHindi && (
                <button
                  onClick={() => { setHindi(!hindi); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                  Language: {hindi ? "Hindi (switch to English)" : "English (switch to Hindi)"}
                </button>
              )}
              <button
                onClick={() => { setHoldMode(!holdMode); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50">
                Answer mode: {holdMode ? "Tap and hold (real exam)" : "Single tap (easier)"}
                <span className="block text-xs text-gray-400">Tap here to switch</span>
              </button>
            </div>
          </>
        )}
      </header>

      {syncWarning && (
        <div className="bg-red-50 border-b border-red-200 px-3 py-1.5 text-xs text-red-600 text-center flex-shrink-0">
          Some answers could not be saved. Check your internet. They will be sent again automatically.
        </div>
      )}
      {resumed && (
        <div className="bg-blue-50 border-b border-blue-200 px-3 py-1.5 text-xs text-blue-700 text-center flex items-center justify-center gap-3 flex-shrink-0">
          Resumed from where you left off. Your answers and remaining time are restored.
          <button onClick={() => setResumed(false)} className="font-bold">x</button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 min-h-0 flex flex-col">

        {/* Question paper */}
        <div
          ref={paperRef}
          onScroll={onPaperScroll}
          onTouchStart={onPaperTouchStart}
          onTouchMove={onPaperTouchMove}
          onTouchEnd={onPaperTouchEnd}
          className="relative overflow-y-auto bg-white flex-shrink-0"
          style={{ height: split * 100 + "%", touchAction: "pan-y" }}>

          <div className="sticky top-0 z-10 bg-white/95 border-b border-gray-200 px-3 pt-4 pb-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {hasHindi ? (
                <>
                  <button onClick={() => setHindi(false)}
                    className={"px-2 py-0.5 rounded border " + (!hindi ? "bg-[#1a9e85] text-white border-[#1a9e85]" : "border-gray-300 text-gray-600")}>
                    English
                  </button>
                  <button onClick={() => setHindi(true)}
                    className={"px-2 py-0.5 rounded border " + (hindi ? "bg-[#1a9e85] text-white border-[#1a9e85]" : "border-gray-300 text-gray-600")}>
                    हिन्दी
                  </button>
                </>
              ) : (
                <span className="text-gray-400">Question Paper</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(clamp(zoom - 0.1, 0.8, 2.2))}
                className="w-7 h-6 rounded border border-gray-300 text-gray-600 font-bold">A-</button>
              <button onClick={() => setZoom(clamp(zoom + 0.1, 0.8, 2.2))}
                className="w-7 h-6 rounded border border-gray-300 text-gray-600 font-bold">A+</button>
            </div>
          </div>

          <div className="px-4 py-3" style={{ fontSize: 14 * zoom + "px" }}>
            {questions.length === 0 && (
              <p className="text-gray-400 text-center py-10">This test has no questions yet.</p>
            )}
            {questions.map((q, i) => (
              <div
                key={q.id}
                ref={(el) => { qRefs.current[q.id] = el; }}
                className="mb-5 pb-4 border-b border-gray-200">
                <div className="flex gap-2">
                  <span className="font-bold text-gray-900 flex-shrink-0">
                    {i + 1}.
                    {responses[q.id]?.marked && (
                      <span className="inline-block w-2.5 h-2.5 bg-orange-400 ml-1 align-middle"></span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 whitespace-pre-line leading-relaxed">
                      {txt(q.question_text, q.question_text_hi)}
                    </p>
                    {q.image_url && (
                      <img src={q.image_url} alt="question diagram"
                        className="max-w-full mt-2 border border-gray-200 object-contain"
                        style={{ maxHeight: 240 * zoom }} />
                    )}
                    <div className="mt-2 space-y-1.5">
                      {(["a", "b", "c", "d"] as const).map((opt) => {
                        const optText = txt((q as any)["option_" + opt], (q as any)["option_" + opt + "_hi"]);
                        const optImage = (q as any)["option_" + opt + "_image"];
                        return (
                          <div key={opt} className="text-gray-800">
                            <span className="font-semibold mr-1">({opt})</span>
                            {optText}
                            {optImage && (
                              <img src={optImage} alt={"option " + opt}
                                className="max-w-full mt-1 border border-gray-200 object-contain"
                                style={{ maxHeight: 160 * zoom }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-gray-400" style={{ fontSize: "0.75em" }}>
                      Marks: {q.marks}
                      {negative > 0 ? " | Negative: " + negative : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider handle */}
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          className="relative h-5 flex-shrink-0 bg-[#2b59c3] flex items-center justify-center cursor-row-resize"
          style={{ touchAction: "none" }}>
          <div className="flex items-center gap-1 bg-[#2b59c3] border border-white/70 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          </div>
        </div>

        {/* OMR sheet */}
        <div className="flex-1 min-h-0 flex flex-col bg-[#fdf2fa]">
          <div className="px-3 pt-2 pb-1 flex items-center justify-between gap-2 flex-shrink-0">
            <h2 className="font-extrabold text-[#c026a3] tracking-wide text-lg">ANSWERS</h2>
            <button
              onClick={() => setPhase("review")}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#1a9e85] hover:bg-[#158470] transition">
              Review &amp; Submit &rarr;
            </button>
          </div>
          <div className="px-3 pb-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-700 flex-shrink-0">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-[#e879c0] bg-white"></span>
              Not Attempted <b>{notAttempted}</b>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-gray-900"></span>
              Attempted <b>{attempted}</b>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-orange-400"></span>
              Marked for Review <b>{markedCount}</b>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {blockStarts.map((s) => (
              <div key={s} className="grid grid-cols-2 gap-x-3 mb-2 pb-2 border-b border-pink-200">
                <div>
                  {Array.from({ length: 10 }, (_, k) => s + k)
                    .filter((i) => i < questions.length)
                    .map(renderOmrRow)}
                </div>
                <div>
                  {Array.from({ length: 10 }, (_, k) => s + 10 + k)
                    .filter((i) => i < questions.length)
                    .map(renderOmrRow)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exam tour */}
      {showTour && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#1a9e85] text-white px-4 py-2.5 flex items-center justify-between">
              <p className="font-semibold text-sm">Exam Tour ({tourStep + 1}/{TOUR.length})</p>
              <button onClick={() => setShowTour(false)} className="text-xs underline">Skip</button>
            </div>
            <div className="p-4">
              <p className="font-bold text-gray-900 mb-1">{TOUR[tourStep].title}</p>
              <p className="text-sm text-gray-600">{TOUR[tourStep].text}</p>
              <div className="flex justify-center gap-1.5 mt-4">
                {TOUR.map((_, i) => (
                  <span key={i} className={"w-2 h-2 rounded-full " + (i === tourStep ? "bg-[#1a9e85]" : "bg-gray-300")}></span>
                ))}
              </div>
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => setTourStep(Math.max(0, tourStep - 1))}
                disabled={tourStep === 0}
                className="flex-1 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40">
                Back
              </button>
              {tourStep < TOUR.length - 1 ? (
                <button
                  onClick={() => setTourStep(tourStep + 1)}
                  className="flex-1 py-2 text-sm font-semibold text-white bg-[#1a9e85] rounded-lg">
                  Next
                </button>
              ) : (
                <button
                  onClick={() => setShowTour(false)}
                  className="flex-1 py-2 text-sm font-semibold text-white bg-[#1a9e85] rounded-lg">
                  Start Exam
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review screen */}
      {phase === "review" && (
        <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="bg-[#1a9e85] text-white px-4 py-3 flex items-center justify-between">
              <p className="font-bold text-sm">Review your responses</p>
              <span className={"font-mono text-sm font-bold px-2 py-0.5 rounded " + (secondsLeft < 300 ? "bg-red-600" : "bg-gray-900")}>
                {fmtTime(secondsLeft)}
              </span>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Total Questions</p>
                  <p className="font-bold text-xl text-gray-800">{questions.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Attempted</p>
                  <p className="font-bold text-xl text-green-600">{attempted}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Not Attempted</p>
                  <p className="font-bold text-xl text-red-500">{notAttempted}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Marked for Review</p>
                  <p className="font-bold text-xl text-orange-500">{markedCount}</p>
                </div>
              </div>

              {notAttemptedList.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Not attempted (tap to go to the question)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {notAttemptedList.map(({ i }) => (
                      <button key={i} onClick={() => jumpTo(i)}
                        className="w-8 h-8 rounded-md text-xs font-bold bg-white border-2 border-[#e879c0] text-[#9d174d]">
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {markedList.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Marked for review</p>
                  <div className="flex flex-wrap gap-1.5">
                    {markedList.map(({ i }) => (
                      <button key={i} onClick={() => jumpTo(i)}
                        className="w-8 h-8 rounded-md text-xs font-bold bg-orange-400 text-white">
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {submitError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">{submitError}</p>
              )}

              <div className="flex gap-2">
                <button onClick={() => setPhase("exam")}
                  className="flex-1 py-3 text-sm font-medium border border-gray-400 rounded-lg bg-white">
                  Back to exam
                </button>
                <button
                  onClick={() => { setSigned(false); setSubmitError(""); setPhase("sign"); }}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-[#1a9e85] rounded-lg">
                  Proceed to Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature screen */}
      {phase === "sign" && (
        <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="bg-[#1a9e85] text-white px-4 py-3 flex items-center justify-between">
              <p className="font-bold text-sm">Sign to confirm submission</p>
              <span className={"font-mono text-sm font-bold px-2 py-0.5 rounded " + (secondsLeft < 300 ? "bg-red-600" : "bg-gray-900")}>
                {fmtTime(secondsLeft)}
              </span>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Sign inside the box with your finger or mouse to confirm that you want to submit. This signature is only for practice and is not saved.
              </p>
              <SignaturePad onInk={setSigned} />
              <div className="flex gap-2">
                <button onClick={() => setPhase("review")}
                  className="flex-1 py-3 text-sm font-medium border border-gray-400 rounded-lg bg-white">
                  Back
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={!signed}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-[#1a9e85] rounded-lg disabled:opacity-40">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}