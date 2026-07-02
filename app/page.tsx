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
  { name: "Aman Verma", rating: 4, text: "Very smooth experience. Questions are well organized and the leaderboard keeps me motivated.", location: "Dharamshala" },
  { name: "Sanya Kapoor", rating: 5, text: "I love how I can see my correct and wrong answers right after submitting. Really helps in revision.", location: "Solan" },
  { name: "Vikram Rana", rating: 5, text: "Took 3 mocks so far. My score improved from 120 to 165. This platform really works!", location: "Kullu" },
  { name: "Neha Chauhan", rating: 4, text: "Simple to use, no complicated steps. Just login, give the test, see results. Perfect.", location: "Bilaspur" },
];

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
            <div className="inline-block bg-gold/10 border border-gold/30 rounded-xl px-5 py-3 mb-8">
              <p className="font-display font-semibold text-ink text-lg">Mocks starting at Rs 199</p>
              <p className="text-sm text-ink/60 mt-0.5">The best struggle in life begins with preparation.</p>
            </div>
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

          <LeaderboardCard />
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
                    <span key={star} className={star <= r.rating ? "text-gold" : "text-gray-200"}>
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

type FeaturedEntry = { rank: number; name: string; score: number };

function LeaderboardCard() {
  const [mockTitle, setMockTitle] = useState<string | null>(null);
  const [entries, setEntries] = useState<FeaturedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard/featured")
      .then((res) => res.json())
      .then((data) => {
        setMockTitle(data.mockTitle);
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-3 border border-dashed border-ink/15 rounded-2xl" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl border border-ink/10 shadow-[0_1px_0_rgba(11,37,69,0.04)] p-7 max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono text-xs tracking-widest uppercase text-ink/40">Top Performers</p>
          <p className="font-mono text-xs text-ink/40 truncate max-w-[160px]">
            {mockTitle || "No tests yet"}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-ink/40 py-6 text-center">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-ink/40 py-6 text-center">
            No results yet. The first submitted test will appear here.
          </p>
        ) : (
          <div className="space-y-1">
            {entries.map((r) => (
              <div
                key={r.rank}
                className={"flex items-center justify-between py-2.5 px-3 rounded-lg " + (r.rank === 1 ? "bg-gold/10" : "")}
              >
                <div className="flex items-center gap-3">
                  <span className={"font-display font-semibold text-sm w-6 text-center " + (r.rank === 1 ? "text-gold" : "text-ink/40")}>
                    {r.rank}
                  </span>
                  <span className="text-sm text-ink/80">{r.name}</span>
                </div>
                <span className="font-display font-semibold text-sm text-ink">{r.score}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-dashed border-ink/15 mt-5 pt-4">
          <p className="text-xs text-ink/45">Updates when a test is submitted</p>
          <span className="font-mono text-xs text-gold">live</span>
        </div>
      </div>
    </div>
  );
}