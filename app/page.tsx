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
  { name: "Rahul Sharma", rating: 5, text: "Best platform for HPSSC prep. Got my result instantly after submitting. Highly recommended!", location: "Shimla" },
  { name: "Priya Thakur", rating: 5, text: "The timer and auto-submit feature is amazing. Feels just like the real exam. Scored 180 in my last mock!", location: "Mandi" },
  { name: "Aman Verma", rating: 4, text: "Very smooth experience. Questions are well organized and I can even read them in Hindi!", location: "Dharamshala" },
  { name: "Sanya Kapoor", rating: 5, text: "I love how I can see my correct and wrong answers right after submitting. Really helps in revision.", location: "Solan" },
  { name: "Vikram Rana", rating: 5, text: "Took 3 mocks so far. My score improved from 120 to 165. This platform really works!", location: "Kullu" },
  { name: "Neha Chauhan", rating: 4, text: "Simple to use, no complicated steps. Just login, give the test, see results. Perfect.", location: "Bilaspur" },
];

const WHATSAPP_NUMBER = "917559573410";
const WHATSAPP_MESSAGE = "Hello, I want to purchase a mock test on HP Exam Achievers. Please share details.";

export default function Home() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

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
    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
    window.open(url, "_blank");
  }

  return (
    <main className="bg-paper">
      <nav className="flex items-center justify-between px-6 py-5 border-b border-ink/10 bg-white">
        <div className="font-display font-semibold text-xl text-ink">
          HP <span className="text-gold">Exam Achievers</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login?role=student" className="btn-primary">Student Login</Link>
          <Link
            href="/login?role=teacher"
            className="px-5 py-2.5 rounded-lg font-medium border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-paper transition"
          >
            Teacher Login
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-ink/50 mb-4">
              Himachal Pradesh - Competitive exam prep
            </p>
            <h1 className="font-display font-semibold text-5xl md:text-6xl text-ink leading-[1.05] mb-6">
              Every mock test
              <br />
              ends in a <span className="text-gold">result</span>,
              <br />
              not a guess.
            </h1>
            <p className="text-ink/70 text-lg max-w-md mb-6 leading-relaxed">
              HP Exam Achievers gives every student their own login, a timed paper,
              and a scored result the moment they submit.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login?role=student" className="btn-gold">Take a test</Link>
              <Link
                href="/login?role=teacher"
                className="px-5 py-2.5 rounded-lg font-medium border border-ink/20 text-ink hover:border-ink transition"
              >
                Teacher portal
              </Link>
            </div>
          </div>

          <ContactCard onWhatsApp={openWhatsApp} />
        </div>

        <div className="h-px bg-[repeating-linear-gradient(90deg,theme(colors.ink/25)_0_8px,transparent_8px_16px)]" />
      </section>

      <section ref={statsRef} className="bg-navy text-white py-14">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="font-display text-4xl font-semibold text-gold">{students.toLocaleString()}+</p>
            <p className="text-white/60 text-sm mt-1">Students registered</p>
          </div>
          <div>
            <p className="font-display text-4xl font-semibold text-gold">{tests.toLocaleString()}+</p>
            <p className="text-white/60 text-sm mt-1">Tests submitted</p>
          </div>
          <div>
            <p className="font-display text-4xl font-semibold text-gold">{mocks.toLocaleString()}+</p>
            <p className="text-white/60 text-sm mt-1">Mock tests created</p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20">
        <p className="font-mono text-xs tracking-widest uppercase text-ink/40 mb-2">What you get</p>
        <h2 className="font-display font-semibold text-3xl text-ink mb-12">Built around the paper, not the platform</h2>

        <div className="grid md:grid-cols-3 gap-px bg-ink/10 border border-ink/10 rounded-xl overflow-hidden">
          <Feature
            label="01"
            title="A timer that does not ask twice"
            body="Set the duration once. The test submits itself the moment time runs out - no reminders, no manual tracking."
          />
          <Feature
            label="02"
            title="A password for every student"
            body="No shared logins. Each student gets their own credentials and their own attempt count."
          />
          <Feature
            label="03"
            title="Results before they close the tab"
            body="Score, accuracy, correct and wrong answers - all visible the instant the test is submitted."
          />
        </div>
      </section>

      <section className="bg-gray-50 border-y border-ink/10 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-ink/40 mb-2">Student reviews</p>
          <h2 className="font-display font-semibold text-3xl text-ink mb-10">What students are saying</h2>

          <div className="grid md:grid-cols-3 gap-4">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white rounded-xl border border-ink/10 p-5 shadow-sm">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= r.rating ? "text-gold text-lg" : "text-gray-200 text-lg"}>
                      {star <= r.rating ? "★" : "★"}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-ink/70 leading-relaxed mb-4">{r.text}</p>
                <div className="border-t border-ink/5 pt-3">
                  <p className="font-medium text-ink text-sm">{r.name}</p>
                  <p className="text-xs text-ink/40">{r.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-green-600 py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/80 text-sm font-mono tracking-widest uppercase mb-2">Get started today</p>
          <h2 className="font-display font-semibold text-3xl text-white mb-2">
            Mocks starting at just Rs 9
          </h2>
          <p className="text-white/80 mb-6">
            Contact us on WhatsApp to get your mock test link and password instantly.
          </p>
          <button
            onClick={openWhatsApp}
            className="inline-flex items-center gap-3 bg-white text-green-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-green-50 transition shadow-lg text-lg"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-green-600">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Message us on WhatsApp
          </button>
          <p className="text-white/60 text-sm mt-4">
            Say "I want a mock" on +91 75595 73410
          </p>
        </div>
      </section>

      <footer className="text-center py-10 text-sm text-ink/50 bg-white border-t border-ink/10">
        (c) {new Date().getFullYear()} HP Exam Achievers. All rights reserved.
      </footer>
    </main>
  );
}

function Feature({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="bg-paper p-7">
      <p className="font-mono text-xs text-gold mb-3">{label}</p>
      <h3 className="font-display font-semibold text-lg text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink/65 leading-relaxed">{body}</p>
    </div>
  );
}

function ContactCard({ onWhatsApp }: { onWhatsApp: () => void }) {
  return (
    <div className="relative">
      <div className="absolute -inset-3 border border-dashed border-ink/15 rounded-2xl" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl border border-ink/10 shadow-[0_1px_0_rgba(11,37,69,0.04)] p-7 max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono text-xs tracking-widest uppercase text-ink/40">Get access</p>
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-lg">WhatsApp</span>
        </div>

        <div className="mb-6">
          <p className="font-display font-semibold text-3xl text-ink mb-1">
            From Rs 9
          </p>
          <p className="text-sm text-ink/50">per mock test</p>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <span className="text-green-600">✓</span> Instant access after payment
          </div>
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <span className="text-green-600">✓</span> Your own unique login
          </div>
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <span className="text-green-600">✓</span> Timer + auto-submit
          </div>
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <span className="text-green-600">✓</span> Instant result with rank
          </div>
          <div className="flex items-center gap-2 text-sm text-ink/70">
            <span className="text-green-600">✓</span> Hindi + English questions
          </div>
        </div>

        <button
          onClick={onWhatsApp}
          className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-500 transition flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Contact on WhatsApp
        </button>

        <p className="text-center text-xs text-ink/40 mt-3">
          +91 75595 73410
        </p>
      </div>
    </div>
  );
}