"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours = time.getHours();
  const mins = time.getMinutes().toString().padStart(2, "0");
  const secs = time.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = (hours % 12 || 12).toString().padStart(2, "0");
  return (
    <div className="hidden md:flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-xs font-mono text-gray-600">
        <span className="font-bold text-gray-900">{displayHours}:{mins}:{secs}</span>
        <span className="text-gray-400 ml-1">{ampm}</span>
        <span className="text-gray-200 mx-1.5">|</span>
        <span className="text-gray-500">{days[time.getDay()]} {time.getDate()} {months[time.getMonth()]} {time.getFullYear()}</span>
      </span>
    </div>
  );
}

const features = [
  { icon: "⏱️", title: "Auto-Submit Timer", desc: "Set duration once. Test submits automatically when time runs out.", gradient: "from-blue-500 to-cyan-500" },
  { icon: "🔐", title: "Unique Login Per Student", desc: "Every student gets their own secure password. No shared links.", gradient: "from-purple-500 to-pink-500" },
  { icon: "📊", title: "Instant Detailed Results", desc: "Score, accuracy, rank and full answer review immediately after submit.", gradient: "from-orange-500 to-red-500" },
  { icon: "🇮🇳", title: "Hindi + English Support", desc: "Students can toggle between Hindi and English during the exam.", gradient: "from-green-500 to-emerald-500" },
  { icon: "📱", title: "Mobile First Design", desc: "Swipe between questions. Full CBT experience on any device.", gradient: "from-indigo-500 to-blue-500" },
  { icon: "🏆", title: "Live Leaderboard", desc: "Real-time rankings among all students who took the same test.", gradient: "from-yellow-500 to-orange-500" },
];

const reviews = [
  { name: "Rahul Sharma", location: "Shimla, HP", rating: 5, text: "Best platform for HPSSC prep. Got my result instantly after submitting. Highly recommended!" },
  { name: "Priya Thakur", location: "Mandi, HP", rating: 5, text: "The timer and auto-submit feature is amazing. Feels exactly like the real CBT exam!" },
  { name: "Aman Verma", location: "Dharamshala, HP", rating: 4, text: "Very smooth experience. Hindi toggle is a game changer for HP GK questions." },
  { name: "Sanya Kapoor", location: "Solan, HP", rating: 5, text: "I love seeing correct and wrong answers right after submitting. Helps so much in revision." },
  { name: "Vikram Rana", location: "Kullu, HP", rating: 5, text: "Score improved from 120 to 165 across 3 mocks. This platform genuinely works!" },
  { name: "Neha Chauhan", location: "Bilaspur, HP", rating: 4, text: "Simple, fast, and accurate. No complicated steps — just login and take the test." },
];

const WHATSAPP_NUMBER = "917559573410";
const WHATSAPP_MESSAGE = "Hello, I want to purchase a mock test on HP Exam Achievers. Please share details.";

export default function Home() {
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const students = useCountUp(12847, 2500, statsVisible);
  const tests = useCountUp(3200, 2500, statsVisible);
  const mocks = useCountUp(480, 2500, statsVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.2 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  function openWhatsApp() {
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE), "_blank");
  }

  function scrollTo(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>H</div>
            <span className="font-bold text-gray-900">HP <span style={{ color: "#FBBF24" }}>Exam Achievers</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <LiveClock />
            <button onClick={() => scrollTo(featuresRef)} className="text-sm text-gray-500 hover:text-gray-900 transition font-medium">Features</button>
            <button onClick={() => scrollTo(aboutRef)} className="text-sm text-gray-500 hover:text-gray-900 transition font-medium">About</button>
            <a href="mailto:rulebreakers299@gmail.com" className="text-sm text-gray-500 hover:text-gray-900 transition font-medium">Contact</a>
            <Link href="/login?role=student"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
              Student Login
            </Link>
            <Link href="/login?role=teacher"
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-all duration-300">
              Teacher Login
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200">
            <span className={"w-4 h-0.5 bg-gray-700 transition-all duration-300 " + (menuOpen ? "rotate-45 translate-y-2" : "")}></span>
            <span className={"w-4 h-0.5 bg-gray-700 transition-all duration-300 " + (menuOpen ? "opacity-0" : "")}></span>
            <span className={"w-4 h-0.5 bg-gray-700 transition-all duration-300 " + (menuOpen ? "-rotate-45 -translate-y-2" : "")}></span>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2 shadow-lg">
            <button onClick={() => scrollTo(featuresRef)} className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Features</button>
            <button onClick={() => scrollTo(aboutRef)} className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">About</button>
            <a href="mailto:rulebreakers299@gmail.com" className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Contact</a>
            <Link href="/login?role=student" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-white text-center"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
              Student Login
            </Link>
            <Link href="/login?role=teacher" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 text-center">
              Teacher Login
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #1e3a8a 65%, #1d4ed8 100%)" }}>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-10 blur-2xl"
            style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}></div>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/70 text-xs font-medium tracking-wide">Himachal Pradesh No.1 Mock Platform</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Crack Your
                <span className="block"
                  style={{ background: "linear-gradient(135deg, #fbbf24, #f97316, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Dream Government
                </span>
                Exam
              </h1>
              <p className="text-lg text-white/60 leading-relaxed max-w-lg">
                India most affordable mock test platform for HP government exams. Timed tests, instant results, Hindi support, and live leaderboards.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/login?role=student"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                <span>Take Mock Test</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
              <button onClick={openWhatsApp}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>WhatsApp Us</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              {[["Rs 9", "Starting price"], ["Hindi + Eng", "Bilingual support"], ["Instant", "Results & rank"]].map(([val, label]) => (
                <div key={label}>
                  <p className="font-bold text-white text-lg">{val}</p>
                  <p className="text-white/40 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl opacity-30 blur-2xl"
              style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}></div>
            <div className="relative w-full max-w-sm"
              style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "24px", padding: "28px", boxShadow: "0 32px 64px rgba(0,0,0,0.4)" }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-bold text-white text-lg">HP Exam Achievers</p>
                  <p className="text-white/50 text-xs mt-0.5">Choose your portal</p>
                </div>
                <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-xs font-medium">Online</span>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <Link href="/login?role=student"
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-white/10 hover:border-yellow-400/50 transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: "rgba(251,191,36,0.1)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.3)" }}>🎓</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">Student Portal</p>
                    <p className="text-white/50 text-xs">Take mock tests</p>
                  </div>
                  <span className="text-yellow-400/60 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all duration-300 text-lg">→</span>
                </Link>

                <Link href="/login?role=teacher"
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: "rgba(37,99,235,0.15)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: "rgba(37,99,235,0.25)", border: "1px solid rgba(37,99,235,0.4)" }}>📚</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">Teacher Portal</p>
                    <p className="text-white/50 text-xs">Manage mocks and students</p>
                  </div>
                  <span className="text-blue-400/60 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300 text-lg">→</span>
                </Link>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center text-xs">₹</div>
                  <span className="text-white/60 text-xs">Starting at Rs 9</span>
                </div>
                <button onClick={openWhatsApp}
                  className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition text-xs font-medium">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Support
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </section>

      {/* STATS */}
      <section ref={statsRef} className="py-16 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: students, suffix: "+", label: "Students Registered", color: "#FBBF24" },
              { value: tests, suffix: "+", label: "Tests Submitted", color: "#60a5fa" },
              { value: mocks, suffix: "+", label: "Mocks Created", color: "#a78bfa" },
            ].map((s, i) => (
              <div key={i}>
                <p className="font-bold text-4xl md:text-5xl mb-2" style={{ color: s.color }}>
                  {s.value.toLocaleString()}{s.suffix}
                </p>
                <p className="text-gray-400 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featuresRef} className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-4">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built specifically for HP government exam aspirants. Every feature designed to maximize your preparation.
            </p>
          </div>

          "use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours = time.getHours();
  const mins = time.getMinutes().toString().padStart(2, "0");
  const secs = time.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = (hours % 12 || 12).toString().padStart(2, "0");
  return (
    <div className="hidden md:flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-xs font-mono text-gray-600">
        <span className="font-bold text-gray-900">{displayHours}:{mins}:{secs}</span>
        <span className="text-gray-400 ml-1">{ampm}</span>
        <span className="text-gray-200 mx-1.5">|</span>
        <span className="text-gray-500">{days[time.getDay()]} {time.getDate()} {months[time.getMonth()]} {time.getFullYear()}</span>
      </span>
    </div>
  );
}

const features = [
  { icon: "⏱️", title: "Auto-Submit Timer", desc: "Set duration once. Test submits when time runs out.", gradient: "from-blue-500 to-cyan-500" },
  { icon: "🔐", title: "Unique Student Login", desc: "Every student gets their own secure password.", gradient: "from-purple-500 to-pink-500" },
  { icon: "📊", title: "Instant Results", desc: "Score, rank and full answer review immediately after submit.", gradient: "from-orange-500 to-red-500" },
  { icon: "🇮🇳", title: "Hindi + English", desc: "Toggle between Hindi and English during the exam.", gradient: "from-green-500 to-emerald-500" },
  { icon: "📱", title: "Mobile First", desc: "Swipe between questions. Full CBT on any device.", gradient: "from-indigo-500 to-blue-500" },
  { icon: "🏆", title: "Live Leaderboard", desc: "Real-time rankings among all students.", gradient: "from-yellow-500 to-orange-500" },
];

const reviews = [
  { name: "Rahul Sharma", location: "Shimla, HP", rating: 5, text: "Best platform for HPSSC prep. Got my result instantly after submitting!" },
  { name: "Priya Thakur", location: "Mandi, HP", rating: 5, text: "The timer and auto-submit is amazing. Feels exactly like the real CBT exam!" },
  { name: "Aman Verma", location: "Dharamshala, HP", rating: 4, text: "Very smooth. Hindi toggle is a game changer for HP GK questions." },
  { name: "Sanya Kapoor", location: "Solan, HP", rating: 5, text: "Seeing correct and wrong answers right after submitting helps so much." },
  { name: "Vikram Rana", location: "Kullu, HP", rating: 5, text: "Score improved from 120 to 165 across 3 mocks. This platform works!" },
  { name: "Neha Chauhan", location: "Bilaspur, HP", rating: 4, text: "Simple and fast. Just login and take the test. Perfect." },
];

const WHATSAPP_NUMBER = "917559573410";
const WHATSAPP_MESSAGE = "Hello, I want to purchase a mock test on HP Exam Achievers. Please share details.";

export default function Home() {
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const students = useCountUp(12847, 2500, statsVisible);
  const tests = useCountUp(3200, 2500, statsVisible);
  const mocks = useCountUp(480, 2500, statsVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.2 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  function openWhatsApp() {
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE), "_blank");
  }

  function scrollTo(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs md:text-sm"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>H</div>
            <span className="font-bold text-gray-900 text-sm md:text-base">HP <span style={{ color: "#FBBF24" }}>Exam Achievers</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            <LiveClock />
            <button onClick={() => scrollTo(featuresRef)} className="text-sm text-gray-500 hover:text-gray-900 transition font-medium">Features</button>
            <button onClick={() => scrollTo(aboutRef)} className="text-sm text-gray-500 hover:text-gray-900 transition font-medium">About</button>
            <a href="mailto:rulebreakers299@gmail.com" className="text-sm text-gray-500 hover:text-gray-900 transition font-medium">Contact</a>
            <Link href="/login?role=student"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
              Student Login
            </Link>
            <Link href="/login?role=teacher"
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-all duration-300">
              Teacher Login
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Link href="/login?role=student"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
              Login
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-200">
              <span className={"w-4 h-0.5 bg-gray-700 transition-all duration-300 " + (menuOpen ? "rotate-45 translate-y-1.5" : "")}></span>
              <span className={"w-4 h-0.5 bg-gray-700 transition-all duration-300 " + (menuOpen ? "opacity-0" : "")}></span>
              <span className={"w-4 h-0.5 bg-gray-700 transition-all duration-300 " + (menuOpen ? "-rotate-45 -translate-y-1.5" : "")}></span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2 shadow-lg">
            <button onClick={() => scrollTo(featuresRef)} className="block w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl font-medium">Features</button>
            <button onClick={() => scrollTo(aboutRef)} className="block w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl font-medium">About</button>
            <a href="mailto:rulebreakers299@gmail.com" className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl font-medium">Contact</a>
            <div className="pt-2 space-y-2">
              <Link href="/login?role=student" onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-bold text-white text-center"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
                Student Login
              </Link>
              <Link href="/login?role=teacher" onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 text-center">
                Teacher Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-14 md:pt-16 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #1e3a8a 65%, #1d4ed8 100%)" }}>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 md:w-80 h-48 md:h-80 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}></div>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "32px 32px" }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left side */}
            <div className="space-y-6 md:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/70 text-xs font-medium">Himachal Pradesh No.1 Mock Platform</span>
              </div>

              <div className="space-y-3 md:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                  Crack Your
                  <span className="block"
                    style={{ background: "linear-gradient(135deg, #fbbf24, #f97316, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Dream Government
                  </span>
                  Exam
                </h1>
                <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-lg">
                  Most affordable mock test platform for HP government exams. Timed tests, instant results, Hindi support, live leaderboards.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login?role=student"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-sm md:text-base"
                  style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                  Take Mock Test
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
                <button onClick={openWhatsApp}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 text-sm md:text-base">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Us
                </button>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-6">
                {[["Rs 9", "Starting price"], ["Hindi + Eng", "Bilingual"], ["Instant", "Results"]].map(([val, label]) => (
                  <div key={label}>
                    <p className="font-bold text-white text-base md:text-lg">{val}</p>
                    <p className="text-white/40 text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Dashboard Card - visible on ALL screens */}
            <div className="relative w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
              <div className="absolute inset-0 rounded-3xl opacity-40 blur-2xl"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}></div>
              <div className="relative w-full"
                style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "24px", padding: "24px", boxShadow: "0 32px 64px rgba(0,0,0,0.4)" }}>

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-bold text-white text-base">HP Exam Achievers</p>
                    <p className="text-white/50 text-xs mt-0.5">Choose your portal</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-xs font-medium">Online</span>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <Link href="/login?role=student"
                    className="group flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 hover:border-yellow-400/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "rgba(251,191,36,0.1)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.3)" }}>🎓</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">Student Portal</p>
                      <p className="text-white/50 text-xs">Take mock tests</p>
                    </div>
                    <span className="text-yellow-400/60 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all duration-300">→</span>
                  </Link>

                  <Link href="/login?role=teacher"
                    className="group flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "rgba(37,99,235,0.15)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: "rgba(37,99,235,0.25)", border: "1px solid rgba(37,99,235,0.4)" }}>📚</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">Teacher Portal</p>
                      <p className="text-white/50 text-xs">Manage mocks and students</p>
                    </div>
                    <span className="text-blue-400/60 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300">→</span>
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">Starting at Rs 9</span>
                  </div>
                  <button onClick={openWhatsApp}
                    className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition text-xs font-medium">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </section>

      {/* STATS */}
      <section ref={statsRef} className="py-12 md:py-16 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
            {[
              { value: students, label: "Students", color: "#FBBF24" },
              { value: tests, label: "Tests Done", color: "#60a5fa" },
              { value: mocks, label: "Mocks", color: "#a78bfa" },
            ].map((s, i) => (
              <div key={i}>
                <p className="font-bold text-2xl sm:text-3xl md:text-5xl mb-1" style={{ color: s.color }}>
                  {s.value.toLocaleString()}+
                </p>
                <p className="text-gray-400 text-xs md:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featuresRef} className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-4">
              Platform Features
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              Everything you need to succeed
            </h2>
            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
              Built for HP government exam aspirants. Every feature designed to maximize your preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((f, i) => (
              <div key={i}
                className="group p-5 md:p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={"w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 bg-gradient-to-br " + f.gradient}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">{f.title}</h3>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP CTA */}
      <section className="py-14 md:py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #065f46, #047857, #059669)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}></div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">
            Start practicing for just Rs 9
          </h2>
          <p className="text-green-100/80 mb-7 text-sm md:text-lg">
            Message us on WhatsApp. Get your mock link and password within minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={openWhatsApp}
              className="inline-flex items-center justify-center gap-3 bg-white text-green-700 font-bold px-6 py-4 rounded-2xl hover:bg-green-50 transition-all duration-300 hover:scale-105 shadow-xl text-sm md:text-base">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-600 flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Message on WhatsApp
            </button>
            <Link href="/login?role=student"
              className="inline-flex items-center justify-center border-2 border-white/40 text-white font-semibold px-6 py-4 rounded-2xl hover:bg-white/10 transition-all duration-300 text-sm md:text-base">
              Already have access? Login
            </Link>
          </div>
          <p className="text-green-200/60 text-xs md:text-sm mt-5">+91 75595 73410</p>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-purple-600 bg-purple-50 px-4 py-1.5 rounded-full mb-4">
              Student Reviews
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              Trusted by HP students
            </h2>
            <p className="text-gray-500 text-sm">Real feedback from students who prepared with us.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {reviews.map((r, i) => (
              <div key={i}
                className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} viewBox="0 0 20 20" className={"w-3.5 h-3.5 " + (star <= r.rating ? "fill-yellow-400" : "fill-gray-200")}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{r.text}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                    <p className="text-gray-400 text-xs">{r.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section ref={aboutRef} className="py-16 md:py-24"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-14">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-300 bg-blue-900/40 px-4 py-1.5 rounded-full mb-4">
              About Us
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
              Built for HP students
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              We understand the pressure of government exam preparation. That is why we built the most affordable mock test platform in HP.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="p-5 md:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl mb-4">🎯</div>
              <h3 className="font-bold text-white text-base md:text-lg mb-3">Our Mission</h3>
              <p className="text-white/60 leading-relaxed text-sm">
                Make quality mock test preparation accessible to every student in HP at the most affordable price. We support HPSSC, HPRCA, JOA IT, Patwari, JEE, NEET, and Banking exam aspirants.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/40 text-xs">Supporting HP students since 2024</p>
              </div>
            </div>

            <div className="p-5 md:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl mb-4">📬</div>
              <h3 className="font-bold text-white text-base md:text-lg mb-3">Get in Touch</h3>
              <p className="text-white/60 text-sm mb-4">For mock purchases, queries, or support:</p>
              <div className="space-y-2">
                <a href="mailto:rulebreakers299@gmail.com"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition group">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm flex-shrink-0">✉️</div>
                  <div className="min-w-0">
                    <p className="text-white/40 text-xs">Email</p>
                    <p className="text-white text-xs md:text-sm font-medium group-hover:text-blue-300 transition truncate">rulebreakers299@gmail.com</p>
                  </div>
                </a>
                <button onClick={openWhatsApp}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition group text-left">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-sm flex-shrink-0">💬</div>
                  <div>
                    <p className="text-white/40 text-xs">WhatsApp</p>
                    <p className="text-white text-xs md:text-sm font-medium group-hover:text-green-300 transition">+91 75595 73410</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-white py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>H</div>
                <span className="font-bold text-white text-sm">HP <span style={{ color: "#FBBF24" }}>Exam Achievers</span></span>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">
                HP most affordable mock test platform for government exam preparation.
              </p>
            </div>

            <div>
              <p className="font-semibold text-white mb-3 text-sm">Platform</p>
              <div className="space-y-2">
                <Link href="/login?role=student" className="block text-gray-500 hover:text-white transition text-xs">Student Login</Link>
                <Link href="/login?role=teacher" className="block text-gray-500 hover:text-white transition text-xs">Teacher Login</Link>
                <button onClick={() => scrollTo(featuresRef)} className="block text-gray-500 hover:text-white transition text-xs text-left">Features</button>
              </div>
            </div>

            <div>
              <p className="font-semibold text-white mb-3 text-sm">Company</p>
              <div className="space-y-2">
                <button onClick={() => scrollTo(aboutRef)} className="block text-gray-500 hover:text-white transition text-xs text-left">About Us</button>
                <a href="mailto:rulebreakers299@gmail.com" className="block text-gray-500 hover:text-white transition text-xs">Contact</a>
              </div>
            </div>

            <div>
              <p className="font-semibold text-white mb-3 text-sm">Contact</p>
              <div className="space-y-2">
                <a href="mailto:rulebreakers299@gmail.com" className="block text-gray-500 hover:text-white transition text-xs break-all">rulebreakers299@gmail.com</a>
                <button onClick={openWhatsApp} className="block text-gray-500 hover:text-white transition text-xs text-left">WhatsApp: +91 75595 73410</button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-600 text-xs">(c) {new Date().getFullYear()} HP Exam Achievers. All rights reserved.</p>
            <p className="text-gray-700 text-xs">Made with care for HP students</p>
          </div>
        </div>
      </footer>
    </div>
  );
}