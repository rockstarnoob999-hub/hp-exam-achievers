# HP Exam Achievers

A simple online mock test platform.

- Teacher creates mock tests, adds questions, and creates students.
- Every student gets their own unique password (set by the teacher).
- Each student has a fixed number of attempts (default 3).
- Timer auto-submits the test when time runs out.
- Students see their score, correct/wrong answers, and rank immediately after submitting.
- Teacher gets a test link + password to share via WhatsApp (e.g. after a student pays).

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS — frontend and backend (API routes) in one project
- Supabase (Postgres) — database
- JWT (in an HTTP-only cookie) — login sessions

## 1. Set up the database (Supabase)

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In your project, open **SQL Editor → New query**.
3. Paste the entire contents of `supabase/schema.sql` and click **Run**. This creates all tables.
4. Go to **Project Settings → API**. Copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** (not the anon key) → this is `SUPABASE_SERVICE_ROLE_KEY`

## 2. Run it locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and paste your Supabase URL, service role key, and a random JWT_SECRET
npm run dev
```

Open http://localhost:3000

### Create your first teacher account

There's no public "sign up as teacher" page (so random people can't create teacher accounts). Instead, run:

```bash
node scripts/create-teacher.js "Your Name" "your@email.com" "yourPassword"
```

This needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available in your shell — easiest way:

```bash
export $(grep -v '^#' .env.local | xargs) && node scripts/create-teacher.js "Your Name" "your@email.com" "yourPassword"
```

Then log in at `/login` as a Teacher with that email/password.

## 3. How to use it

1. **Log in as teacher** → click "Create Mock Test" → fill in title, duration, negative marking, and set an **access password** for the test (this is what you'll share with students, e.g. via WhatsApp).
2. Click **Manage Questions** on the test card → add questions one by one (option A–D, mark the correct one).
3. Click **Add Student** → enter the student's name, email or phone, and give them a **unique password** (e.g. `HP-RAHUL01`). Tick which test(s) they're allowed to take. Default attempts = 3.
4. Share with the student via WhatsApp:
   - The test link: `https://yourapp.vercel.app/exam/<mock-id>` (shown on the mock card after creation)
   - The test access password
   - Their personal login: their email/phone + their unique password
5. Student goes to the link, logs in (if not already), enters the test password, and takes the exam. Timer counts down and auto-submits at zero. They can retake up to their allowed attempts (3 by default); after that they'll see "You have exhausted all attempts. Contact your teacher."
6. After submitting, the student instantly sees their score, correct/wrong/skipped count, accuracy, and rank.

To reset a student's attempts or password, currently this is done directly in Supabase's **Table Editor → students** table (update `attempts_allowed`, or re-run the password hash via the create-teacher style script — a teacher UI for this can be added later).

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: HP Exam Achievers"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hp-exam-achievers.git
git push -u origin main
```

(`.env.local` is in `.gitignore` so your keys are never pushed.)

## 5. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo.
2. In **Environment Variables**, add the same three values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
3. Click **Deploy**.
4. Once live, your exam links will look like `https://hp-exam-achievers.vercel.app/exam/<mock-id>` — share these with students via WhatsApp.

## Project structure

```
app/
  page.tsx                  Landing page
  login/                    Unified teacher/student login
  teacher/dashboard/        Teacher: list + create mocks, add students
  teacher/mocks/[id]/       Teacher: add questions to a mock
  student/dashboard/        Student: assigned tests + past results
  exam/[id]/                Exam-taking interface (timer, palette, autosave)
  result/[id]/              Result + answer review
  api/                      All backend routes (auth, mocks, questions, students, attempts)
lib/
  supabase.ts                Supabase server client
  auth.ts                    JWT session helpers
supabase/schema.sql           Full database schema
scripts/create-teacher.js     One-time script to create a teacher login
```

## Notes on what's included vs. not (kept simple on purpose)

Included: teacher/student roles, mock creation, question bank per mock, unique per-student passwords, attempt limits, timer with auto-submit, autosaved answers, instant scored results, basic leaderboard via API.

Not included (can be added later): admin panel, payments/subscriptions, certificates, email/WhatsApp auto-sending, AI features, Excel question upload, image upload UI, analytics charts. The database schema and code are structured so these can be added without a rewrite.
