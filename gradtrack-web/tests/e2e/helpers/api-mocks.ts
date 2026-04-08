import type { Page } from "@playwright/test";

// ── Fixture graduate data ────────────────────────────────────────────────────

export const MOCK_GRADUATES = [
  {
    id: 1, created_at: "2024-01-15T10:00:00Z",
    full_name: "Jane Wanjiru", student_number: "MUST/CS/001/2023",
    email: "jane@example.com", phone: "+254712345678",
    campus: "Main Campus (Nchiru)", school_id: "sci",
    school_name: "School of Computing and Informatics (SCI)",
    department_id: "cs", department_name: "Department of Computer Science",
    programme_id: 1, programme_name: "Bachelor of Science (Computer Science)",
    graduation_year: 2023, employment_status: "Employed (Full-time)",
    employer_name: "Safaricom PLC", job_title: "Software Engineer",
    sector: "Information & Communication Technology (ICT)",
    employment_county: "Nairobi", months_to_employ: "1 – 3 months",
    linkedin_url: "https://linkedin.com/in/jane", skills: ["Programming / Software Development", "Data Analysis & Statistics"],
  },
  {
    id: 2, created_at: "2024-02-10T09:00:00Z",
    full_name: "Brian Mutua", student_number: null,
    email: "brian@example.com", phone: null,
    campus: "Meru Town Campus", school_id: "sbe",
    school_name: "School of Business and Economics (SBE)",
    department_id: "bus", department_name: "Department of Business Administration",
    programme_id: 2, programme_name: "Bachelor of Business Administration (BBA)",
    graduation_year: 2022, employment_status: "Self-employed / Entrepreneur",
    employer_name: null, job_title: null,
    sector: "Banking & Financial Services",
    employment_county: "Meru", months_to_employ: "4 – 6 months",
    linkedin_url: null, skills: null,
  },
  {
    id: 3, created_at: "2024-03-05T08:00:00Z",
    full_name: "Grace Njiru", student_number: "MUST/PH/003/2022",
    email: "grace@example.com", phone: "+254723456789",
    campus: "Main Campus (Nchiru)", school_id: "shs",
    school_name: "School of Health Sciences (SHS)",
    department_id: "pub_health", department_name: "Department of Public Health",
    programme_id: 3, programme_name: "Bachelor of Science (Public Health)",
    graduation_year: 2022, employment_status: "Unemployed — Seeking",
    employer_name: null, job_title: null, sector: null,
    employment_county: null, months_to_employ: null,
    linkedin_url: null, skills: null,
  },
];

export const MOCK_SCHOOLS = [
  { id: "sci",  name: "School of Computing and Informatics (SCI)" },
  { id: "sbe",  name: "School of Business and Economics (SBE)" },
  { id: "shs",  name: "School of Health Sciences (SHS)" },
];

export const MOCK_DEPARTMENTS: Record<string, { id: string; name: string }[]> = {
  sci: [
    { id: "cs", name: "Department of Computer Science" },
    { id: "it", name: "Department of Information Technology" },
  ],
  sbe: [
    { id: "bus", name: "Department of Business Administration" },
    { id: "fin", name: "Department of Finance and Accounting" },
  ],
  shs: [
    { id: "pub_health", name: "Department of Public Health" },
    { id: "med_lab",    name: "Department of Medical Laboratory Science" },
  ],
};

export const MOCK_PROGRAMMES: Record<string, string[]> = {
  cs:         ["Bachelor of Science (Computer Science)", "Master of Science (Computer Science)"],
  it:         ["Bachelor of Science (Information Technology)", "Bachelor of Business Information Technology (BBIT)"],
  bus:        ["Bachelor of Business Administration (BBA)", "Bachelor of Co-operative Management"],
  fin:        ["Bachelor of Science (Actuarial Science)", "Bachelor of Science (Finance)"],
  pub_health: ["Bachelor of Science (Public Health)", "Master of Science (Public Health)"],
  med_lab:    ["Bachelor of Science (Medical Laboratory Science)"],
};

const MOCK_DASHBOARD = {
  graduates: MOCK_GRADUATES,
  total_count: MOCK_GRADUATES.length,
  employment_rate: 33,
  by_school: [
    { name: "SCI", count: 1 },
    { name: "SBE", count: 1 },
    { name: "SHS", count: 1 },
  ],
  by_status: [
    { name: "Employed (Full-time)", count: 1 },
    { name: "Self-employed / Entrepreneur", count: 1 },
    { name: "Unemployed — Seeking", count: 1 },
  ],
  by_year: [
    { year: 2022, count: 2, employed: 1 },
    { year: 2023, count: 1, employed: 1 },
  ],
  by_sector: [
    { name: "ICT", count: 1 },
    { name: "Banking & Financial Services", count: 1 },
  ],
  by_campus: [
    { name: "Main Campus (Nchiru)", count: 2 },
    { name: "Meru Town Campus", count: 1 },
  ],
  by_department: [
    { name: "Computer Science", school: "SCI", count: 1 },
    { name: "Business Administration", school: "SBE", count: 1 },
    { name: "Public Health", school: "SHS", count: 1 },
  ],
  by_months_to_employ: [
    { name: "1 – 3 months", count: 1 },
    { name: "4 – 6 months", count: 1 },
  ],
  by_skill: [
    { name: "Programming / Software Development", count: 1 },
    { name: "Data Analysis & Statistics", count: 1 },
  ],
};

const MOCK_STATS = {
  total_graduates: 3,
  oldest_record: "2024-01-15T10:00:00Z",
  newest_record: "2024-03-05T08:00:00Z",
  school_count: 3,
  programme_count: 6,
};

// ── Route mock setup ─────────────────────────────────────────────────────────

export async function mockBackendRoutes(page: Page) {
  // Metadata
  await page.route("**/api/metadata/schools", (r) =>
    r.fulfill({ json: { schools: MOCK_SCHOOLS } }));

  await page.route("**/api/metadata/departments**", (r) => {
    const url = new URL(r.request().url());
    const schoolId = url.searchParams.get("school_id") ?? "";
    const depts = MOCK_DEPARTMENTS[schoolId] ?? [];
    if (!depts.length) return r.fulfill({ status: 404, json: { error: "School not found" } });
    return r.fulfill({ json: { departments: depts } });
  });

  await page.route("**/api/metadata/programmes**", (r) => {
    const url = new URL(r.request().url());
    const deptId = url.searchParams.get("department_id") ?? "";
    const progs = MOCK_PROGRAMMES[deptId] ?? [];
    if (!progs.length) return r.fulfill({ status: 404, json: { error: "Department not found" } });
    return r.fulfill({ json: { programmes: progs } });
  });

  // Dashboard
  await page.route("**/api/dashboard", (r) =>
    r.fulfill({ json: MOCK_DASHBOARD }));

  // Admin stats
  await page.route("**/api/admin/stats", (r) =>
    r.fulfill({ json: MOCK_STATS }));

  // Graduate submit
  await page.route("**/api/graduates", async (r) => {
    if (r.request().method() === "POST") {
      const body = await r.request().postDataJSON();
      if (!body?.full_name) {
        return r.fulfill({ status: 400, json: { success: false, error: "Full name is required" } });
      }
      return r.fulfill({ json: { success: true, id: 99 } });
    }
    return r.continue();
  });

  // Bulk insert
  await page.route("**/api/graduates/bulk", (r) =>
    r.fulfill({ json: { inserted: 2, failed: [] } }));

  // Reports preview
  await page.route("**/api/reports/preview**", (r) =>
    r.fulfill({ json: { total: 3, employment_rate: 33, scope: "All Graduates" } }));

  // Reports generate
  await page.route("**/api/reports/generate", (r) =>
    r.fulfill({
      json: {
        scope: "All Graduates",
        generated_at: new Date().toISOString(),
        stats: MOCK_DASHBOARD,
        narrative: {
          report_summary:    "This is the report summary.",
          executive_summary: "This is the executive summary.",
          key_findings:      "These are the key findings.",
          trends_analysis:   "This is the trends analysis.",
          recommendations:   "These are the recommendations.",
        },
      },
    }));

  // Reports edit-section
  await page.route("**/api/reports/edit-section", (r) =>
    r.fulfill({ json: { content: "Updated section content." } }));

  // Reports PDF / Excel
  await page.route("**/api/reports/pdf", (r) =>
    r.fulfill({ body: Buffer.from("PDF"), contentType: "application/pdf" }));
  await page.route("**/api/reports/excel", (r) =>
    r.fulfill({
      body: Buffer.from("XLSX"),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }));

  // Admin purge
  await page.route("**/api/admin/graduates", (r) =>
    r.fulfill({ json: { success: true, deleted: 3 } }));
}

export async function mockCommitteeAuth(page: Page, authenticated = true) {
  await page.route("**/api/committee/session", (r) =>
    r.fulfill({ json: { authenticated } }));

  await page.route("**/api/committee/login", async (r) => {
    const body = await r.request().postDataJSON();
    if (body?.pin === "testpin") {
      return r.fulfill({ json: { success: true } });
    }
    return r.fulfill({
      status: 401,
      json: { success: false, error: "Incorrect PIN. Please try again." },
    });
  });

  await page.route("**/api/committee/logout", (r) =>
    r.fulfill({ json: { success: true } }));

  await page.route("**/api/committee/pin", async (r) => {
    const body = await r.request().postDataJSON();
    if (body?.current_pin === "testpin") {
      return r.fulfill({ json: { success: true } });
    }
    return r.fulfill({
      status: 400,
      json: { success: false, error: "Current PIN is incorrect." },
    });
  });
}
