import Link from "next/link";

export default function Home() {
  return (
    <main>
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="font-bold text-xl text-navy">
          HP <span className="text-gold">Exam Achievers</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login?role=student" className="btn-primary">Student Login</Link>
          <Link href="/login?role=teacher" className="px-5 py-2.5 rounded-lg font-medium border border-navy text-navy hover:bg-navy hover:text-white transition">
            Teacher Login
          </Link>
        </div>
      </nav>

      <section className="text-center py-20 px-4 bg-gradient-to-b from-navy to-blue-900 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">HP Exam Achievers</h1>
        <p className="text-lg text-gold mb-8">Learn • Practice • Achieve</p>
        <p className="max-w-xl mx-auto text-blue-100 mb-8">
          Take mock tests assigned by your teacher, get instant results, and track your progress
          on the leaderboard.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login?role=student" className="btn-gold">Take a Test</Link>
          <Link href="/login?role=teacher" className="px-5 py-2.5 rounded-lg font-medium border border-white hover:bg-white hover:text-navy transition">
            Teacher Portal
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto py-14 px-6 grid md:grid-cols-3 gap-6">
        <div className="card text-center">
          <h3 className="font-semibold mb-2">Timed Mock Tests</h3>
          <p className="text-sm text-gray-600">Auto-submits when time runs out — no manual tracking needed.</p>
        </div>
        <div className="card text-center">
          <h3 className="font-semibold mb-2">Instant Results</h3>
          <p className="text-sm text-gray-600">See your score, correct/wrong answers, and rank right after submitting.</p>
        </div>
        <div className="card text-center">
          <h3 className="font-semibold mb-2">Limited Attempts</h3>
          <p className="text-sm text-gray-600">Each student gets a fixed number of attempts, tracked individually.</p>
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-gray-500 border-t bg-white">
        © {new Date().getFullYear()} HP Exam Achievers. All rights reserved.
      </footer>
    </main>
  );
}
