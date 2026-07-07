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
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const reviews = [
  { name: "Rahul Sharma", rating: 5, text: "Best platform for HPSSC prep. Got my result instantly after submitting.", location: "Shimla" },
  { name: "Priya Thakur", rating: 5, text: "The timer and auto-submit feature is amazing. Feels just like the real exam!", location: "Mandi" },
  { name: "Aman Verma", rating: 4, text: "Very smooth experience. Questions are well organized and I can read them in Hindi too.", location: "Dharamshala" },
  { name: "Sanya Kapoor", rating: 5, text: "I love seeing correct and wrong answers right after submitting. Really helps in revision.", location: "Solan" },
  { name: "Vikram Rana", rating: 5, text: "My score improved from 120 to 165 across 3 mocks. This platform really works!", location: "Kullu" },
  { name: "Neha Chauhan", rating: 4, text: "Simple to use. Just login, give the test, see results. Perfect for busy students.", location: "Bilaspur" },
];

const features = [
  { icon: "⏱️", title: "Auto-Submit Timer", desc: "Set the duration once. Test submits itself when time runs out. No manual tracking needed." },
  { icon: "🔐", title: "Unique Student Login", desc: "Every student gets their own password. No shared links, no confusion." },
  { icon: "📊", title: "Instant Results", desc: "Score, accuracy, rank and answer review the moment you submit." },
  { icon: "🇮🇳", title: "Hindi + English", desc: "Questions available in both Hindi and English. Students can toggle anytime during exam." },
  { icon: "📱", title: "Works on Mobile", desc: "Swipe between questions on mobile. Full CBT experience on any device." },
  { icon: "🏆", title: "Live Leaderboard", desc: "See where you stand among all students who took the same test." },
];

const WHATSAPP_NUMBER = "917559573410";
const WHATSAPP_MESSAGE = "Hello, I want to purchase a mock test on HP Exam Achievers. Please share details.";

export default function Home() {
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const students = useCountUp(12847, 2000, statsVisible);
  const tests = useCountUp(3200, 2000, statsVisible);
  const mocks = useCountUp(480, 2000, statsVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  function openWhatsApp() {
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE), "_blank");
  }

  function scrollToAbout() {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  return (
    <main className="bg-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="font-display font-bold text-xl text-navy">
            HP <span className="text-gold">Exam Achievers</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <LiveClock />
            <button onClick={scrollToAbout} className="text-gray-500 hover:text-navy transition font-medium">About</button>
            <a href={"mailto:rulebreakers299@gmail.com"} className="text-gray-500 hover:text-navy transition font-medium">Contact</a>
            <Link href="/login?role=student" className="btn-primary text-sm">Student Login</Link>
            <Link href="/login?role=teacher" className="px-4 py-2 rounded-lg font-medium border border-navy text-navy hover:bg-navy hover:text-white transition text-sm">
              Teacher Login
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg border border-gray-200">
            <div className={"w-5 h-0.5 bg-navy mb-1 transition-all " + (menuOpen ? "rotate-45 translate-y-1.5" : "")}></div>
            <div className={"w-5 h-0.5 bg-navy mb-1 transition-all " + (menuOpen ? "opacity-0" : "")}></div>
            <div className={"w-5 h-0.5 bg-navy transition-all " + (menuOpen ? "-rotate-45 -translate-y-1.5" : "")}></div>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <button onClick={scrollToAbout} className="block w-full text-left text-gray-600 py-2 font-medium">About</button>
            <a href="mailto:rulebreakers299@gmail.com" className="block text-gray-600 py-2 font-medium">Contact</a>
            <Link href="/login?role=student" onClick={() => setMenuOpen(false)} className="block btn-primary text-center text-sm">Student Login</Link>
            <Link href="/login?role=teacher" onClick={() => setMenuOpen(false)} className="block px-4 py-2 rounded-lg font-medium border border-navy text-navy text-center text-sm">Teacher Login</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)" }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl"></div>
          <div className="absolute top-40 left-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white/80 text-xs font-medium">Himachal Pradesh No.1 Mock Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Crack Your
              <span className="block text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                Dream Exam
              </span>
              with Mocks
            </h1>
            <p className="text-blue-100/80 text-lg leading-relaxed mb-8 max-w-lg">
              HP Exam Achievers gives every student their own timed mock test, instant results, Hindi support, and a live leaderboard. Starting at just Rs 9.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login?role=student"
                className="px-6 py-3 rounded-xl font-bold text-navy text-base transition-all hover:scale-105 hover:shadow-xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                Take a Mock Test
              </Link>
              <button onClick={openWhatsApp}
                className="px-6 py-3 rounded-xl font-semibold text-white border border-white/30 bg-white/10 hover:bg-white/20 transition text-base">
                WhatsApp Us
              </button>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              {[["Rs 9", "Starting price"], ["Hindi + Eng", "Bilingual"], ["Instant", "Results"]].map(([val, label]) => (
                <div key={label} className="text-center">
                  <p className="font-bold text-white text-lg">{val}</p>
                  <p className="text-white/50 text-xs">{label}</p>
                </div>
              ))}<div className="relative hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/70 text-xs font-mono tracking-widest uppercase">Quick Access</p>
                <span className="flex items-center gap-1 text-green-400 text-xs">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="font-bold text-white text-lg mb-1">HP Exam Achievers</p>
              <p className="text-white/50 text-xs mb-5">Login to your dashboard</p>
              <div className="space-y-3">
                <Link href="/login?role=student"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-navy transition hover:scale-105 hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                  <span className="text-xl">🎓</span>
                  <div className="text-left">
                    <p className="font-bold text-sm">Student Login</p>
                    <p className="text-navy/60 text-xs">Take your mock test</p>
                  </div>
                </Link>
                <Link href="/login?role=teacher"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-white transition hover:scale-105 hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
                  <span className="text-xl">📚</span>
                  <div className="text-left">
                    <p className="font-bold text-sm">Teacher Login</p>
                    <p className="text-white/60 text-xs">Manage your mocks</p>
                  </div>
                </Link>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <p className="text-white/40 text-xs">Starting at Rs 9</p>
                  <button
                    onClick={() => window.open("https://wa.me/917559573410?text=" + encodeURIComponent("Hello, I want to purchase a mock test."), "_blank")}
                    className="text-green-400 text-xs hover:text-green-300 transition font-medium">
                    WhatsApp Us
                  </button>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/70 text-xs font-mono tracking-widest uppercase">Live Result</p>
                <span className="flex items-center gap-1 text-green-400 text-xs">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
              <p className="font-bold text-white text-xl mb-1">HPSSC Mock - Paper 4</p>
              <p className="text-white/50 text-xs mb-5">Submitted in 58:12</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[["76", "Correct", "#22c55e"], ["14", "Wrong", "#ef4444"], ["10", "Skipped", "#94a3b8"]].map(([v, l, c]) => (
                  <div key={l} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="font-bold text-lg" style={{ color: c }}>{v}</p>
                    <p className="text-white/50 text-xs mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-end border-t border-white/10 pt-4">
                <div>
                  <p className="text-white/50 text-xs">Score</p>
                  <p className="font-bold text-white text-2xl">152<span className="text-white/40 text-sm"> / 200</span></p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs">Rank</p>
                  <p className="font-bold text-2xl" style={{ color: "#fbbf24" }}>#7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="bg-navy py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-6 grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-display font-bold text-3xl md:text-4xl text-gold">{students.toLocaleString()}+</p>
            <p className="text-white/60 text-xs md:text-sm mt-1">Students registered</p>
          </div>
          <div>
            <p className="font-display font-bold text-3xl md:text-4xl text-gold">{tests.toLocaleString()}+</p>
            <p className="text-white/60 text-xs md:text-sm mt-1">Tests submitted</p>
          </div>
          <div>
            <p className="font-display font-bold text-3xl md:text-4xl text-gold">{mocks.toLocaleString()}+</p>
            <p className="text-white/60 text-xs md:text-sm mt-1">Mock tests created</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-2">Why choose us</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-navy">Everything you need to succeed</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-navy mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-14 bg-green-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-white/80 text-sm font-mono tracking-widest uppercase mb-3">Get started today</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">
            Mocks starting at just Rs 9
          </h2>
          <p className="text-white/80 mb-7 text-base">
            Contact us on WhatsApp. Get your mock link and password instantly after payment.
          </p>
          <button onClick={openWhatsApp}
            className="inline-flex items-center gap-3 bg-white text-green-700 font-bold px-7 py-4 rounded-2xl hover:bg-green-50 transition shadow-lg text-base hover:scale-105">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-green-600">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Message on WhatsApp
          </button>
          <p className="text-white/60 text-sm mt-4">+91 75595 73410</p>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-2">Student reviews</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-navy">What students are saying</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= r.rating ? "text-gold text-lg" : "text-gray-200 text-lg"}>★</span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{r.text}</p>
                <div className="border-t border-gray-200 pt-3">
                  <p className="font-bold text-navy text-sm">{r.name}</p>
                  <p className="text-gray-400 text-xs">{r.location}, HP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section ref={aboutRef} className="py-16 md:py-20 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <p className="font-mono text-xs tracking-widest uppercase text-white/40 mb-2">About us</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl">About HP Exam Achievers</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-white/80 leading-relaxed mb-4">
                HP Exam Achievers is a mock test platform built specifically for students preparing for Himachal Pradesh government exams like HPSSC, HPRCA, JOA IT, Patwari, and more.
              </p>
              <p className="text-white/80 leading-relaxed mb-4">
                We believe every student deserves access to quality practice material at an affordable price. Our platform provides timed mock tests, instant results, bilingual support, and a competitive leaderboard to keep you motivated.
              </p>
              <p className="text-white/80 leading-relaxed">
                We also support JEE, NEET, and Banking exam aspirants with subject-wise question banks and exam pattern generators.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-1">Our Mission</h3>
                <p className="text-white/70 text-sm">Make quality mock test preparation accessible to every student in Himachal Pradesh at the most affordable price.</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-1">Contact Us</h3>
                <p className="text-white/70 text-sm mb-2">For any queries, mock test purchases, or support:</p>
                <a href="mailto:rulebreakers299@gmail.com"
                  className="text-gold hover:underline text-sm font-medium block">
                  rulebreakers299@gmail.com
                </a>
                <button onClick={openWhatsApp} className="text-green-400 hover:underline text-sm font-medium mt-1 block">
                  WhatsApp: +91 75595 73410
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-bold text-lg mb-2">HP <span className="text-gold">Exam Achievers</span></p>
              <p className="text-gray-400 text-sm">Learn - Practice - Achieve</p>
              <p className="text-gray-400 text-xs mt-2">Himachal Pradesh, India</p>
            </div>
            <div>
              <p className="font-bold mb-3 text-sm">Quick Links</p>
              <div className="space-y-2 text-sm text-gray-400">
                <Link href="/login?role=student" className="block hover:text-white transition">Student Login</Link>
                <Link href="/login?role=teacher" className="block hover:text-white transition">Teacher Login</Link>
                <button onClick={scrollToAbout} className="block hover:text-white transition">About</button>
              </div>
            </div>
            <div>
              <p className="font-bold mb-3 text-sm">Contact</p>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="mailto:rulebreakers299@gmail.com" className="block hover:text-white transition">
                  rulebreakers299@gmail.com
                </a>
                <button onClick={openWhatsApp} className="block hover:text-white transition text-left">
                  WhatsApp: +91 75595 73410
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-xs">(c) {new Date().getFullYear()} HP Exam Achievers. All rights reserved.</p>
            <p className="text-gray-600 text-xs">Made with care for HP students</p>
          </div>
        </div>
      </footer>
    </main>
  );
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
  const day = days[time.getDay()];
  const date = time.getDate();
  const month = months[time.getMonth()];
  const year = time.getFullYear();

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
      <div className="text-xs font-mono">
        <span className="font-bold text-navy">{displayHours}:{mins}:{secs}</span>
        <span className="text-gray-400 ml-1">{ampm}</span>
        <span className="text-gray-300 mx-1">|</span>
        <span className="text-gray-500">{day} {date} {month} {year}</span>
      </div>
    </div>
  );
}
}