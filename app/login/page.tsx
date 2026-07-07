"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number; y: number; r: number;
      dx: number; dy: number; alpha: number;
    }[] = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212,175,55," + p.alpha + ")";
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(
            particles[i].x - particles[j].x,
            particles[i].y - particles[j].y
          );
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "rgba(212,175,55," + (0.12 * (1 - dist / 100)) + ")";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }

    draw();

    function handleResize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get("role") === "teacher"
    ? "teacher" : params.get("role") === "admin"
    ? "admin" : "student";

  const [role, setRole] = useState<"teacher" | "student" | "admin">(initialRole as any);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "teacher") router.push("/teacher/dashboard");
      else router.push("/student/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const roleConfig = {
    student: { label: "Student", color: "bg-gold text-navy", icon: "🎓" },
    teacher: { label: "Teacher", color: "bg-blue-600 text-white", icon: "📚" },
    admin: { label: "Admin", color: "bg-red-500 text-white", icon: "🛡️" },
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #1e3a8a 100%)" }}>
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md mx-4">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-display font-bold text-3xl text-white mb-1">
              HP <span className="text-gold">Exam Achievers</span>
            </h1>
          </Link>
          <p className="text-white/40 text-sm">Learn - Practice - Achieve</p>
        </div>

        <div className="rounded-3xl p-8 shadow-2xl"
          style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.15)" }}>

          <div className="flex mb-7 rounded-2xl overflow-hidden p-1 gap-1"
            style={{ background: "rgba(0,0,0,0.2)" }}>
            {(["student", "teacher", "admin"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={"flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 capitalize flex items-center justify-center gap-1.5 " + (
                  role === r
                    ? roleConfig[r].color + " shadow-lg"
                    : "text-white/50 hover:text-white"
                )}>
                <span>{roleConfig[r].icon}</span>
                <span className="hidden sm:inline">{roleConfig[r].label}</span>
              </button>
            ))}
          </div>

          {role === "admin" && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2">
              <span className="text-red-300 text-lg">🛡️</span>
              <p className="text-red-200 text-xs font-medium">Super Admin Access - Restricted</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-white/60 text-xs font-medium block mb-1.5">
                {role === "student" ? "Email or Phone Number" : "Email Address"}
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/50 transition"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  placeholder={role === "student" ? "Enter email or phone" : "Enter your email"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-white/60 text-xs font-medium block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/50 transition"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition text-xs">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <span className="text-red-300 text-sm">!</span>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className={"w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed " + (
                role === "admin"
                  ? "bg-red-500 text-white hover:bg-red-400"
                  : role === "teacher"
                  ? "text-navy hover:opacity-90"
                  : "text-navy hover:opacity-90"
              )}
              style={role !== "admin" ? { background: "linear-gradient(135deg, #fbbf24, #f59e0b)" } : {}}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Logging in...
                </span>
              ) : (
                "Login as " + roleConfig[role].label
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-white/40 text-xs">
              Need help?{" "}
              <a href="mailto:rulebreakers299@gmail.com"
                className="text-gold hover:underline">
                rulebreakers299@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-white/30 hover:text-white/60 text-xs transition">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}