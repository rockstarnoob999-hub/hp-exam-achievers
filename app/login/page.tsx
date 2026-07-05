"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; r: number; dx: number; dy: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 0.6,
        dy: (Math.random() - 0.5) * 0.6,
        alpha: Math.random() * 0.5 + 0.1,
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
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "rgba(212,175,55," + (0.15 * (1 - dist / 120)) + ")";
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
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get("role") === "teacher" ? "teacher" : params.get("role") === "admin" ? "admin" : "student";

  const [role, setRole] = useState<"teacher" | "student" | "admin">(initialRole as any);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "teacher") router.push("/teacher/dashboard");
      else router.push("/student/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-navy">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <h1 className="font-display font-semibold text-3xl text-white mb-1">
            HP <span className="text-gold">Exam Achievers</span>
          </h1>
          <p className="text-white/50 text-sm">Learn - Practice - Achieve</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex mb-6 rounded-xl overflow-hidden border border-white/20">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={"flex-1 py-2.5 text-sm font-medium transition " + (role === "student" ? "bg-gold text-navy" : "text-white/70 hover:text-white")}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={"flex-1 py-2.5 text-sm font-medium transition " + (role === "teacher" ? "bg-gold text-navy" : "text-white/70 hover:text-white")}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={"flex-1 py-2.5 text-sm font-medium transition " + (role === "admin" ? "bg-red-500 text-white" : "text-white/70 hover:text-white")}
            >
              Admin
            </button>
          </div>

          {role === "admin" && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
              <p className="text-xs text-red-200 text-center">Super Admin Access Only</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-white/70">
                {role === "student" ? "Email or Phone" : "Email"}
              </label>
              <input
                className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder={role === "student" ? "Email or phone number" : "your@email.com"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Password</label>
              <input
                type="password"
                className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={"w-full font-semibold py-2.5 rounded-lg hover:opacity-90 transition mt-2 " + (role === "admin" ? "bg-red-500 text-white" : "bg-gold text-navy")}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          HP Exam Achievers - Himachal Pradesh
        </p>
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