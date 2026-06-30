-- HP EXAM ACHIEVERS — DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor (Project > SQL Editor > New query)

create extension if not exists "uuid-ossp";

-- ========== TEACHERS ==========
create table teachers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- ========== STUDENTS ==========
-- Each student belongs to a teacher and has their OWN unique password.
create table students (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references teachers(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  password_hash text not null,   -- e.g. hash of "HP-R001"
  attempts_allowed int not null default 3,
  is_disabled boolean default false,
  created_at timestamptz default now(),
  unique (teacher_id, email),
  unique (teacher_id, phone)
);

-- ========== MOCK TESTS ==========
create table mocks (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references teachers(id) on delete cascade,
  title text not null,
  exam_name text,
  description text,
  duration_minutes int not null default 30,
  total_marks int not null default 0,
  negative_marking numeric default 0,   -- e.g. 0.25 marks deducted per wrong answer
  passing_marks int default 0,
  start_date timestamptz,
  end_date timestamptz,
  instructions text,
  randomize_questions boolean default false,
  show_result_immediately boolean default true,
  show_correct_answers boolean default true,
  leaderboard_enabled boolean default true,
  is_published boolean default false,
  access_password text not null,  -- single password to access the mock link (shared after payment)
  created_at timestamptz default now()
);

-- ========== QUESTIONS ==========
create table questions (
  id uuid primary key default uuid_generate_v4(),
  mock_id uuid references mocks(id) on delete cascade,
  question_text text not null,
  image_url text,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('a','b','c','d')),
  marks numeric default 1,
  explanation text,
  order_index int default 0,
  created_at timestamptz default now()
);

-- ========== MOCK ACCESS (which students can take which mock) ==========
create table mock_assignments (
  id uuid primary key default uuid_generate_v4(),
  mock_id uuid references mocks(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  unique (mock_id, student_id)
);

-- ========== ATTEMPTS ==========
create table attempts (
  id uuid primary key default uuid_generate_v4(),
  mock_id uuid references mocks(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  attempt_number int not null,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  status text default 'in_progress' check (status in ('in_progress','submitted','auto_submitted')),
  score numeric,
  correct_count int default 0,
  wrong_count int default 0,
  skipped_count int default 0,
  ip_address text,
  user_agent text
);

-- ========== ANSWERS ==========
create table answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid references attempts(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  selected_option text check (selected_option in ('a','b','c','d', null)),
  is_correct boolean,
  marked_for_review boolean default false,
  updated_at timestamptz default now(),
  unique (attempt_id, question_id)
);

-- Helpful indexes
create index idx_questions_mock on questions(mock_id);
create index idx_attempts_student on attempts(student_id);
create index idx_attempts_mock on attempts(mock_id);
create index idx_answers_attempt on answers(attempt_id);
create index idx_mock_assignments_student on mock_assignments(student_id);
