-- ============================================================
-- GradTrack Analytics — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Lookup: Schools / Faculties
create table if not exists schools (
  id   text primary key,
  name text not null unique
);

-- 2. Lookup: Departments (belongs to a school)
create table if not exists departments (
  id        text primary key,
  school_id text not null references schools(id) on delete cascade,
  name      text not null,
  unique (school_id, id)
);

-- 3. Lookup: Programmes (belongs to a department)
create table if not exists programmes (
  id            bigint generated always as identity primary key,
  department_id text not null references departments(id) on delete cascade,
  name          text not null,
  unique (department_id, name)
);

-- 4. Main table: Graduate submissions
create table if not exists graduates (
  id                 bigint generated always as identity primary key,
  created_at         timestamptz not null default now(),

  -- personal
  full_name          text not null,
  student_number     text,
  email              text,
  phone              text,

  -- academic (foreign keys for dashboard drill-downs)
  campus             text not null,
  school_id          text not null references schools(id),
  department_id      text not null references departments(id),
  programme_id       bigint not null references programmes(id),
  graduation_year    smallint not null,

  -- employment
  employment_status  text not null,
  employer_name      text,
  job_title          text,
  sector             text,
  employment_county  text,
  months_to_employ   text,
  linkedin_url       text,

  -- we also store the human-readable names for quick reads
  school_name        text not null,
  department_name    text not null,
  programme_name     text not null,

  constraint chk_contact check (email is not null or phone is not null)
);

-- Index for common dashboard queries
create index if not exists idx_graduates_school      on graduates(school_id);
create index if not exists idx_graduates_department   on graduates(department_id);
create index if not exists idx_graduates_programme    on graduates(programme_id);
create index if not exists idx_graduates_year         on graduates(graduation_year);
create index if not exists idx_graduates_status       on graduates(employment_status);
create index if not exists idx_graduates_campus       on graduates(campus);
create index if not exists idx_graduates_sector       on graduates(sector);
create index if not exists idx_graduates_created      on graduates(created_at);

-- ============================================================
-- Seed: Schools
-- ============================================================
insert into schools (id, name) values
  ('sci',  'School of Computing and Informatics (SCI)'),
  ('sbe',  'School of Business and Economics (SBE)'),
  ('sea',  'School of Engineering and Architecture (SEA)'),
  ('safs', 'School of Agriculture and Food Science (SAFS)'),
  ('shs',  'School of Health Sciences (SHS)'),
  ('sn',   'School of Nursing (SN)'),
  ('se',   'School of Education (SE)'),
  ('spas', 'School of Pure and Applied Sciences (SPAS)')
on conflict (id) do nothing;

-- ============================================================
-- Seed: Departments
-- ============================================================
insert into departments (id, school_id, name) values
  -- SCI
  ('cs',         'sci',  'Department of Computer Science'),
  ('it',         'sci',  'Department of Information Technology'),
  -- SBE
  ('bus',        'sbe',  'Department of Business Administration'),
  ('fin',        'sbe',  'Department of Finance and Accounting'),
  ('econ',       'sbe',  'Department of Economics and Statistics'),
  -- SEA
  ('civil',      'sea',  'Department of Civil and Structural Engineering'),
  ('elec',       'sea',  'Department of Electrical and Electronics Engineering'),
  ('mech',       'sea',  'Department of Mechanical Engineering'),
  -- SAFS
  ('agri',       'safs', 'Department of Agriculture'),
  ('food',       'safs', 'Department of Food Science and Technology'),
  -- SHS
  ('pub_health', 'shs',  'Department of Public Health'),
  ('med_lab',    'shs',  'Department of Medical Laboratory Science'),
  -- SN
  ('nursing',    'sn',   'Department of Nursing Sciences'),
  -- SE
  ('ed_sci',     'se',   'Department of Education (Science)'),
  ('ed_arts',    'se',   'Department of Education (Arts)'),
  -- SPAS
  ('math',       'spas', 'Department of Mathematics'),
  ('chem',       'spas', 'Department of Chemistry'),
  ('phys',       'spas', 'Department of Physics'),
  ('bio',        'spas', 'Department of Biological Sciences')
on conflict (id) do nothing;

-- ============================================================
-- Seed: Programmes
-- ============================================================
insert into programmes (department_id, name) values
  -- CS
  ('cs', 'Bachelor of Science (Computer Science)'),
  ('cs', 'Bachelor of Science (Mathematics and Computer Science)'),
  ('cs', 'Master of Science (Computer Science)'),
  ('cs', 'Doctor of Philosophy (Computer Science)'),
  -- IT
  ('it', 'Bachelor of Science (Information Technology)'),
  ('it', 'Bachelor of Business Information Technology (BBIT)'),
  ('it', 'Bachelor of Science (Computer Technology)'),
  ('it', 'Bachelor of Science (Computer Security and Forensics)'),
  ('it', 'Master of Science (Information Technology)'),
  -- Business
  ('bus', 'Bachelor of Business Administration (BBA)'),
  ('bus', 'Bachelor of Commerce (B.Com)'),
  ('bus', 'Bachelor of Co-operative Management'),
  ('bus', 'Master of Business Administration (MBA)'),
  ('bus', 'Doctor of Philosophy (Business Management)'),
  -- Finance
  ('fin', 'Bachelor of Science (Actuarial Science)'),
  ('fin', 'Bachelor of Purchasing and Supplies Management'),
  ('fin', 'Bachelor of Science (Finance)'),
  ('fin', 'Certified Public Accountant (CPA)'),
  -- Economics
  ('econ', 'Bachelor of Science (Statistics)'),
  ('econ', 'Bachelor of Science (Economics)'),
  ('econ', 'Bachelor of Science (Applied Statistics)'),
  -- Civil
  ('civil', 'Bachelor of Science (Civil Engineering)'),
  ('civil', 'Bachelor of Science (Structural Engineering)'),
  ('civil', 'Master of Science (Civil Engineering)'),
  -- Electrical
  ('elec', 'Bachelor of Science (Electrical and Electronics Engineering)'),
  ('elec', 'Bachelor of Science (Telecommunication Engineering)'),
  ('elec', 'Master of Science (Electrical Engineering)'),
  -- Mechanical
  ('mech', 'Bachelor of Science (Mechanical Engineering)'),
  ('mech', 'Bachelor of Science (Manufacturing Engineering)'),
  -- Agriculture
  ('agri', 'Bachelor of Science (Horticulture)'),
  ('agri', 'Bachelor of Science (Crop Protection)'),
  ('agri', 'Bachelor of Science (Animal Production)'),
  ('agri', 'Master of Science (Agriculture)'),
  ('agri', 'Doctor of Philosophy (Agriculture Science)'),
  -- Food Science
  ('food', 'Bachelor of Science (Food Science and Technology)'),
  ('food', 'Bachelor of Science (Food Science and Nutrition)'),
  ('food', 'Bachelor of Science (Food Nutrition and Dietetics)'),
  ('food', 'Master of Science (Food Science and Technology)'),
  ('food', 'Doctor of Philosophy (Food Science)'),
  -- Public Health
  ('pub_health', 'Bachelor of Science (Public Health)'),
  ('pub_health', 'Bachelor of Science (Community Health and Development)'),
  ('pub_health', 'Bachelor of Science (Environmental Health)'),
  ('pub_health', 'Master of Science (Public Health)'),
  ('pub_health', 'Doctor of Philosophy (Public Health)'),
  -- Medical Lab
  ('med_lab', 'Bachelor of Science (Medical Laboratory Science)'),
  ('med_lab', 'Diploma in Medical Laboratory Science'),
  -- Nursing
  ('nursing', 'Bachelor of Science (Nursing)'),
  ('nursing', 'Diploma in Kenya Registered Nursing'),
  ('nursing', 'Master of Science (Nursing)'),
  -- Education Science
  ('ed_sci', 'Bachelor of Education (Science) — B.Ed (Sc)'),
  ('ed_sci', 'Postgraduate Diploma in Education (PGDE)'),
  ('ed_sci', 'Master of Education (Science)'),
  -- Education Arts
  ('ed_arts', 'Bachelor of Education (Arts) — B.Ed (Arts)'),
  ('ed_arts', 'Master of Education (Arts)'),
  -- Mathematics
  ('math', 'Bachelor of Science (Mathematics)'),
  ('math', 'Bachelor of Science (Applied Mathematics)'),
  ('math', 'Master of Science (Mathematics)'),
  -- Chemistry
  ('chem', 'Bachelor of Science (Chemistry)'),
  ('chem', 'Bachelor of Science (Industrial Chemistry with Management)'),
  ('chem', 'Master of Science (Chemistry)'),
  -- Physics
  ('phys', 'Bachelor of Science (Physics)'),
  ('phys', 'Bachelor of Science (Applied Physics)'),
  -- Biological Sciences
  ('bio', 'Bachelor of Science (Biological Sciences)'),
  ('bio', 'Bachelor of Science (Microbiology)'),
  ('bio', 'Master of Science (Biological Sciences)')
on conflict (department_id, name) do nothing;
