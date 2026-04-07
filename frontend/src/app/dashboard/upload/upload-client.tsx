"use client";

import { useState, useTransition, useCallback, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  KENYAN_COUNTIES,
  EMPLOYMENT_SECTORS,
  GRADUATION_YEARS,
} from "@/lib/must-data";
import {
  fetchDepartments,
  fetchProgrammes,
  type School,
  type Department,
} from "@/lib/must-queries";
import {
  submitGraduate,
  bulkInsertGraduates,
  type GraduatePayload,
  type BulkResult,
} from "@/lib/actions";
import { EMPLOYED_STATUSES, EMPLOYED_STATUSES_SET } from "@/lib/dashboard-utils";

const CAMPUSES = ["Main Campus (Nchiru)", "Meru Town Campus"] as const;

const ALL_EMPLOYMENT_STATUSES = [
  "Employed (Full-time)",
  "Employed (Part-time)",
  "Self-employed / Entrepreneur",
  "Internship / Attachment",
  "Further Studies",
  "Unemployed — Seeking",
  "Unemployed — Not Seeking",
] as const;

/* ── Tab type ── */
type Mode = "single" | "spreadsheet";

/* ── Main component ── */
export function UploadClient({ mustSchools }: { mustSchools: School[] }) {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { id: "single" as const, icon: "👤", label: "Single Entry", desc: "Add one graduate manually" },
          { id: "spreadsheet" as const, icon: "📄", label: "Bulk Upload", desc: "Import CSV or Excel (.xlsx)" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-4 transition-all text-center",
              mode === t.id
                ? "border-amber-500/50 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/20"
                : "border-border bg-card hover:bg-muted/50",
            )}
          >
            <span className="text-2xl sm:text-3xl">{t.icon}</span>
            <span className={cn("text-xs sm:text-sm font-bold", mode === t.id ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>{t.label}</span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">{t.desc}</span>
          </button>
        ))}
      </div>

      {mode === "single" ? <SingleEntryForm schools={mustSchools} /> : <SpreadsheetUpload schools={mustSchools} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SINGLE ENTRY FORM
   ═══════════════════════════════════════════════════════ */
function SingleEntryForm({ schools }: { schools: School[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [school, setSchool] = useState("");
  const [dept, setDept] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingProgs, setLoadingProgs] = useState(false);

  function handleSchoolChange(v: string) {
    setSchool(v);
    setDept("");
    setProgrammes([]);
    setDepartments([]);
    if (!v) return;
    setLoadingDepts(true);
    fetchDepartments(v)
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }

  function handleDeptChange(v: string) {
    setDept(v);
    setProgrammes([]);
    if (!v || !school) return;
    setLoadingProgs(true);
    fetchProgrammes(school, v)
      .then(setProgrammes)
      .catch(() => setProgrammes([]))
      .finally(() => setLoadingProgs(false));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || "";

    const full_name         = get("full_name");
    const student_number    = get("student_number");
    const email             = get("email");
    const phone             = get("phone");
    const campus            = get("campus");
    const school_val        = get("school");
    const department_val    = get("department");
    const programme_val     = get("programme");
    const graduation_year   = get("graduation_year");
    const employment_status = get("employment_status");
    const employer_name     = get("employer_name");
    const sector_val        = get("sector");
    const linkedin_url      = get("linkedin_url");

    if (!full_name)         { setResult({ ok: false, msg: "Full name is required." }); return; }
    if (full_name.length < 3) { setResult({ ok: false, msg: "Full name must be at least 3 characters." }); return; }
    if (!NAME_RE.test(full_name)) { setResult({ ok: false, msg: "Name must contain letters only — no numbers or special characters." }); return; }
    if (!campus)            { setResult({ ok: false, msg: "Campus is required." }); return; }
    if (!school_val)        { setResult({ ok: false, msg: "School is required." }); return; }
    if (!department_val)    { setResult({ ok: false, msg: "Department is required." }); return; }
    if (!programme_val)     { setResult({ ok: false, msg: "Programme is required." }); return; }
    if (!graduation_year)   { setResult({ ok: false, msg: "Graduation year is required." }); return; }
    if (!employment_status) { setResult({ ok: false, msg: "Employment status is required." }); return; }
    if (!email && !phone)   { setResult({ ok: false, msg: "Provide at least an email or phone number." }); return; }
    if (email && !EMAIL_RE.test(email))   { setResult({ ok: false, msg: "Enter a valid email address." }); return; }
    if (phone && !PHONE_RE.test(phone))   { setResult({ ok: false, msg: "Enter a valid phone number (e.g. +254712345678)." }); return; }
    if (student_number && !STUDENT_NO_RE.test(student_number)) { setResult({ ok: false, msg: "Student number format: MUST/PG/123/2020." }); return; }
    if (linkedin_url && !/^https?:\/\/.+/.test(linkedin_url)) { setResult({ ok: false, msg: "Enter a valid LinkedIn URL (must start with https://)." }); return; }
    if (EMPLOYED_STATUSES_SET.has(employment_status)) {
      if (!employer_name) { setResult({ ok: false, msg: "Employer name is required when employed." }); return; }
      if (!sector_val)    { setResult({ ok: false, msg: "Sector is required when employed." }); return; }
    }

    const payload: GraduatePayload = {
      full_name,
      student_number: student_number || undefined,
      email: email || undefined,
      phone: phone || undefined,
      campus,
      school: school_val,
      department: department_val,
      programme: programme_val,
      graduation_year,
      employment_status,
      employer_name: employer_name || undefined,
      job_title: get("job_title") || undefined,
      sector: sector_val || undefined,
      employment_county: get("employment_county") || undefined,
      months_to_employ: get("months_to_employ") || undefined,
      linkedin_url: linkedin_url || undefined,
    };

    startTransition(async () => {
      const res = await submitGraduate(payload);
      if (res.success) {
        setResult({ ok: true, msg: `Graduate added successfully (ID: ${res.id})` });
        formRef.current?.reset();
        setSchool("");
        setDept("");
      } else {
        setResult({ ok: false, msg: res.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Single Graduate</CardTitle>
        <CardDescription>Fill in the graduate&apos;s details. Required fields marked with *</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Personal */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Personal Info</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Fld label="Full Name *"><Input name="full_name" placeholder="e.g. Jane Wanjiru" required /></Fld>
              <Fld label="Student Number"><Input name="student_number" placeholder="MUST/PG/123/2020" /></Fld>
              <Fld label="Email"><Input name="email" type="email" placeholder="jane@example.com" /></Fld>
              <Fld label="Phone"><Input name="phone" type="tel" placeholder="+254712345678" /></Fld>
            </div>
          </fieldset>

          {/* Academic */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Academic Details</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Fld label="Campus *">
                <Sel name="campus" placeholder="Select campus">
                  {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Sel>
              </Fld>
              <Fld label="School *">
                <Sel name="school" placeholder="Select school" value={school} onChange={handleSchoolChange}>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Sel>
              </Fld>
              <Fld label="Department *">
                <Sel name="department" placeholder={!school ? "Select school first" : loadingDepts ? "Loading…" : "Select department"} value={dept} onChange={handleDeptChange} disabled={!school || loadingDepts}>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Sel>
              </Fld>
              <Fld label="Programme *">
                <Sel name="programme" placeholder={!dept ? "Select department first" : loadingProgs ? "Loading…" : "Select programme"} disabled={!dept || loadingProgs}>
                  {programmes.map((p) => <option key={p} value={p}>{p}</option>)}
                </Sel>
              </Fld>
              <Fld label="Graduation Year *">
                <Sel name="graduation_year" placeholder="Select year">
                  {GRADUATION_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </Sel>
              </Fld>
            </div>
          </fieldset>

          {/* Employment */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Employment</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Fld label="Employment Status *">
                <Sel name="employment_status" placeholder="Select status">
                  {ALL_EMPLOYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Sel>
              </Fld>
              <Fld label="Employer Name"><Input name="employer_name" placeholder="e.g. Safaricom PLC" /></Fld>
              <Fld label="Job Title"><Input name="job_title" placeholder="e.g. Software Engineer" /></Fld>
              <Fld label="Sector">
                <Sel name="sector" placeholder="Select sector">
                  {EMPLOYMENT_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Sel>
              </Fld>
              <Fld label="Employment County">
                <Sel name="employment_county" placeholder="Select county">
                  <option value="Outside Kenya">Outside Kenya</option>
                  {KENYAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Sel>
              </Fld>
              <Fld label="Months to Employment">
                <Sel name="months_to_employ" placeholder="Select">
                  {["Already employed (internship converted)", "Less than 1 month", "1 – 3 months", "4 – 6 months", "7 – 12 months", "More than 12 months", "Still seeking"].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Sel>
              </Fld>
              <Fld label="LinkedIn URL"><Input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/..." /></Fld>
            </div>
          </fieldset>

          {result && (
            <div className={cn("rounded-lg border p-3 text-sm", result.ok ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300" : "border-destructive bg-destructive/10 text-destructive")}>
              {result.ok ? "✅ " : "❌ "}{result.msg}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white">
            {isPending ? "Submitting…" : "➕ Add Graduate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   SPREADSHEET BULK UPLOAD (CSV + Excel)
   ═══════════════════════════════════════════════════════ */

const SPREADSHEET_COLUMNS = [
  "full_name", "student_number", "email", "phone", "campus",
  "school", "department", "programme", "graduation_year",
  "employment_status", "employer_name", "job_title", "sector",
  "employment_county", "months_to_employ", "linkedin_url",
] as const;

const REQUIRED_COLS = ["full_name"];
const MAX_ROWS = 500;
const NAME_RE = /^[A-Za-z\s''-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{10,15}$/;
const STUDENT_NO_RE = /^(MUST\/[A-Z]{1,4}\/\d+\/\d{4})?$/;
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const ACCEPTED_MIME = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function isAcceptedFile(file: File): boolean {
  return (
    ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)) ||
    ACCEPTED_MIME.includes(file.type)
  );
}

function parseExcelToRows(buffer: ArrayBuffer): Record<string, string>[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return raw.map((r) => {
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      const key = k.trim().toLowerCase().replace(/\s+/g, "_");
      row[key] = String(v ?? "").trim();
    }
    return row;
  });
}

function SpreadsheetUpload({ schools }: { schools: School[] }) {
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<BulkResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validationErrors = useMemo(() => {
    const errs: { row: number; col: string; msg: string }[] = [];
    rows.forEach((r, i) => {
      const rowNum = i + 1;
      if (!r.full_name?.trim())
        errs.push({ row: rowNum, col: "full_name", msg: "Required" });
      if (r.full_name?.trim() && r.full_name.trim().length < 3)
        errs.push({ row: rowNum, col: "full_name", msg: "Name too short (min 3 characters)" });
      if (r.full_name?.trim() && !NAME_RE.test(r.full_name.trim()))
        errs.push({ row: rowNum, col: "full_name", msg: "Name must contain letters only" });
      if (r.email?.trim() && !EMAIL_RE.test(r.email.trim()))
        errs.push({ row: rowNum, col: "email", msg: "Invalid email format" });
      if (r.phone?.trim() && !PHONE_RE.test(r.phone.trim()))
        errs.push({ row: rowNum, col: "phone", msg: "Invalid phone (e.g. +254712345678)" });
      if (r.student_number?.trim() && !STUDENT_NO_RE.test(r.student_number.trim()))
        errs.push({ row: rowNum, col: "student_number", msg: "Format: MUST/PG/123/2020" });
      if (r.linkedin_url?.trim() && !/^https?:\/\/.+/.test(r.linkedin_url.trim()))
        errs.push({ row: rowNum, col: "linkedin_url", msg: "Must start with https://" });
    });
    return errs;
  }, [rows]);

  const handleFile = useCallback((file: File) => {
    setResult(null);
    setParseError("");
    setRows([]);

    if (!isAcceptedFile(file)) {
      setParseError("Please upload a .csv, .xlsx, or .xls file.");
      return;
    }

    setFileName(file.name);
    const isExcel = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let parsed: Record<string, string>[];

        if (isExcel) {
          parsed = parseExcelToRows(e.target!.result as ArrayBuffer);
          parsed = parsed.filter((r) => r.full_name?.trim() || r.name?.trim());
          parsed = parsed.map((r) => ({ ...r, full_name: r.full_name || r.name || "" }));
          if (!parsed.length) { setParseError("No valid data rows found."); return; }
        } else {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).filter((l) => l.trim());
          if (lines.length < 2) { setParseError("File must have a header row and at least one data row."); return; }
          const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
          if (!headers.includes("full_name") && !headers.includes("name")) {
            setParseError("File must have at least a 'full_name' (or 'name') column.");
            return;
          }
          parsed = [];
          for (let i = 1; i < lines.length; i++) {
            const vals = parseCsvLine(lines[i]);
            const row: Record<string, string> = {};
            headers.forEach((h, j) => { row[h] = vals[j]?.trim() ?? ""; });
            if (!row.full_name && row.name) row.full_name = row.name;
            if (row.full_name?.trim()) parsed.push(row);
          }
          if (!parsed.length) { setParseError("No valid data rows found."); return; }
        }

        if (parsed.length > MAX_ROWS) {
          setParseError(`File exceeds the ${MAX_ROWS}-row limit. Split your file and upload in batches.`);
          return;
        }
        setRows(parsed);
      } catch {
        setParseError("Failed to parse file. Ensure it is a valid CSV or Excel file.");
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleUpload() {
    if (validationErrors.length) return;

    const payloads: GraduatePayload[] = rows.map((r) => ({
      full_name: r.full_name,
      student_number: r.student_number || undefined,
      email: r.email || undefined,
      phone: r.phone || undefined,
      campus: r.campus,
      school: r.school,
      department: r.department,
      programme: r.programme,
      graduation_year: r.graduation_year,
      employment_status: r.employment_status,
      employer_name: r.employer_name || undefined,
      job_title: r.job_title || undefined,
      sector: r.sector || undefined,
      employment_county: r.employment_county || undefined,
      months_to_employ: r.months_to_employ || undefined,
      linkedin_url: r.linkedin_url || undefined,
    }));

    startTransition(async () => {
      const res = await bulkInsertGraduates(payloads);
      setResult(res);
    });
  }

  function downloadTemplate() {
    const exampleRow = [
      "Jane Wanjiru", "MUST/PG/123/2020", "jane@example.com", "+254712345678",
      "Main Campus (Nchiru)", "School of Computing and Informatics (SCI)", "Department of Computer Science",
      "Bachelor of Science (Computer Science)", "2024", "Employed (Full-time)",
      "Safaricom PLC", "Software Engineer", "Information & Communication Technology (ICT)",
      "Nairobi", "1 – 3 months", "",
    ];
    const ws = XLSX.utils.aoa_to_sheet([SPREADSHEET_COLUMNS as unknown as string[], exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Graduates");
    XLSX.writeFile(wb, "MUST_Graduate_Upload_Template.xlsx");
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Bulk Upload</CardTitle>
          <CardDescription>Upload a CSV or Excel file (.xlsx / .xls) with graduate records. Download the template to see the expected format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template + column reference */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-xs">
              📥 Download Template (.xlsx)
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Only <span className="font-semibold">full_name</span> is required — all other columns are optional. Missing values are filled with sensible defaults.
            </p>
          </div>

          {/* Column reference */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
              📋 View column reference & valid values
            </summary>
            <div className="mt-2 rounded-lg border p-3 space-y-2 text-[11px] text-muted-foreground bg-muted/30">
              <p><span className="font-semibold text-foreground">campus:</span> {CAMPUSES.join(" | ")}</p>
              <p><span className="font-semibold text-foreground">school:</span> use the school name or abbreviation (e.g. SHS, SCI, SBE) — the system will match it automatically</p>
              <p><span className="font-semibold text-foreground">department:</span> use the department name or short ID (e.g. cs, med_lab) — matched automatically</p>
              <p><span className="font-semibold text-foreground">programme:</span> use the programme name — closest match is used if not exact</p>
              <p><span className="font-semibold text-foreground">employment_status:</span> {ALL_EMPLOYMENT_STATUSES.join(" | ")}</p>
              <p><span className="font-semibold text-foreground">sector:</span> {EMPLOYMENT_SECTORS.slice(0, 5).join(" | ")} …</p>
              <p className="text-green-700 dark:text-green-400 font-medium">✅ Missing columns are filled with defaults — upload will not be blocked by missing fields.</p>
            </div>
          </details>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors",
              dragOver ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-muted-foreground/40 hover:bg-muted/30",
            )}
          >
            <span className="text-4xl">📁</span>
            <p className="text-sm font-medium text-foreground">
              {fileName || "Drop file here or click to browse"}
            </p>
            <p className="text-[10px] text-muted-foreground">Accepts .csv, .xlsx, .xls</p>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleInputChange} className="hidden" />
          </div>

          {parseError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              ❌ {parseError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview table */}
      {rows.length > 0 && !result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm">Preview — {rows.length} row{rows.length !== 1 ? "s" : ""}</CardTitle>
                {validationErrors.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    ⚠️ {validationErrors.length} validation error{validationErrors.length !== 1 ? "s" : ""} — fix your CSV and re-upload
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => { setRows([]); setFileName(""); }}>
                  ✕ Clear
                </Button>
                <Button
                  size="sm"
                  className="text-xs bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white"
                  disabled={isPending || validationErrors.length > 0}
                  onClick={handleUpload}
                >
                  {isPending ? "Uploading…" : `⬆️ Upload ${rows.length} Records`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px]">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Employer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((r, i) => {
                    const rowErrs = validationErrors.filter((e) => e.row === i + 1);
                    return (
                      <TableRow key={i} className={rowErrs.length ? "bg-destructive/5" : ""}>
                        <TableCell className="text-[10px] text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-xs font-medium whitespace-nowrap">{r.full_name || <span className="text-destructive">—</span>}</TableCell>
                        <TableCell className="text-[10px]">{r.campus || "—"}</TableCell>
                        <TableCell className="text-[10px]">{r.school || "—"}</TableCell>
                        <TableCell className="text-[10px]">{r.department || "—"}</TableCell>
                        <TableCell className="text-[10px] max-w-[150px] truncate">{r.programme || "—"}</TableCell>
                        <TableCell className="text-[10px]">{r.graduation_year || "—"}</TableCell>
                        <TableCell className="text-[10px] max-w-[120px] truncate">{r.employment_status || "—"}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{r.employer_name || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {rows.length > 50 && (
                <p className="text-[10px] text-muted-foreground text-center py-2">
                  Showing first 50 of {rows.length} rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className={result.failed.length === 0 ? "border-green-300 dark:border-green-800" : "border-amber-300 dark:border-amber-800"}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{result.failed.length === 0 ? "✅" : "⚠️"}</span>
              <div>
                <p className="text-sm font-bold">
                  {result.inserted} record{result.inserted !== 1 ? "s" : ""} inserted successfully
                </p>
                {result.failed.length > 0 && (
                  <p className="text-xs text-destructive">{result.failed.length} row{result.failed.length !== 1 ? "s" : ""} failed</p>
                )}
              </div>
            </div>

            {result.failed.length > 0 && (
              <div className="rounded-lg border p-3 space-y-1 max-h-[200px] overflow-auto">
                {result.failed.map((f, i) => (
                  <p key={i} className="text-xs text-destructive">
                    Row {f.row}: {f.error}
                  </p>
                ))}
              </div>
            )}

            <Button variant="outline" size="sm" onClick={() => { setResult(null); setRows([]); setFileName(""); }}>
              Upload Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Helpers ── */
function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function Sel({ name, placeholder, children, value, onChange, disabled }: {
  name: string; placeholder: string; children: React.ReactNode;
  value?: string; onChange?: (v: string) => void; disabled?: boolean;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      disabled={disabled}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { result.push(current); current = ""; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}
