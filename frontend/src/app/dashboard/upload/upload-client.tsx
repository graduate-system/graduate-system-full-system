"use client";

import { useState, useTransition, useCallback, useRef, useMemo } from "react";
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

const EMPLOYMENT_STATUSES = [
  "Employed (Full-time)",
  "Employed (Part-time)",
  "Self-employed / Entrepreneur",
  "Internship / Attachment",
  "Further Studies",
  "Unemployed — Seeking",
  "Unemployed — Not Seeking",
] as const;

const CAMPUSES = ["Main Campus (Nchiru)", "Meru Town Campus"] as const;

/* ── Tab type ── */
type Mode = "single" | "csv";

/* ── Main component ── */
export function UploadClient({ mustSchools }: { mustSchools: School[] }) {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { id: "single" as const, icon: "👤", label: "Single Entry", desc: "Add one graduate manually" },
          { id: "csv" as const, icon: "📄", label: "CSV Upload", desc: "Bulk import from spreadsheet" },
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

      {mode === "single" ? <SingleEntryForm schools={mustSchools} /> : <CsvUpload schools={mustSchools} />}
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

    const payload: GraduatePayload = {
      full_name: get("full_name"),
      student_number: get("student_number") || undefined,
      email: get("email") || undefined,
      phone: get("phone") || undefined,
      campus: get("campus"),
      school: get("school"),
      department: get("department"),
      programme: get("programme"),
      graduation_year: get("graduation_year"),
      employment_status: get("employment_status"),
      employer_name: get("employer_name") || undefined,
      job_title: get("job_title") || undefined,
      sector: get("sector") || undefined,
      employment_county: get("employment_county") || undefined,
      months_to_employ: get("months_to_employ") || undefined,
      linkedin_url: get("linkedin_url") || undefined,
    };

    if (!payload.full_name) { setResult({ ok: false, msg: "Full name is required." }); return; }
    if (!payload.campus) { setResult({ ok: false, msg: "Campus is required." }); return; }
    if (!payload.school) { setResult({ ok: false, msg: "School is required." }); return; }
    if (!payload.department) { setResult({ ok: false, msg: "Department is required." }); return; }
    if (!payload.programme) { setResult({ ok: false, msg: "Programme is required." }); return; }
    if (!payload.graduation_year) { setResult({ ok: false, msg: "Graduation year is required." }); return; }
    if (!payload.employment_status) { setResult({ ok: false, msg: "Employment status is required." }); return; }

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
                  {EMPLOYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
   CSV BULK UPLOAD
   ═══════════════════════════════════════════════════════ */

const CSV_COLUMNS = [
  "full_name", "student_number", "email", "phone", "campus",
  "school", "department", "programme", "graduation_year",
  "employment_status", "employer_name", "job_title", "sector",
  "employment_county", "months_to_employ", "linkedin_url",
] as const;

const REQUIRED_COLS = ["full_name", "campus", "school", "department", "programme", "graduation_year", "employment_status"];

function CsvUpload({ schools }: { schools: School[] }) {
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
      REQUIRED_COLS.forEach((col) => {
        if (!r[col]?.trim()) errs.push({ row: i + 1, col, msg: "Required" });
      });
    });
    return errs;
  }, [rows]);

  const handleFile = useCallback((file: File) => {
    setResult(null);
    setParseError("");
    setRows([]);

    if (!file.name.endsWith(".csv")) {
      setParseError("Please upload a .csv file");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { setParseError("CSV must have a header row and at least one data row."); return; }

      const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

      // Check required columns exist
      const missing = REQUIRED_COLS.filter((c) => !headers.includes(c));
      if (missing.length) {
        setParseError(`Missing required columns: ${missing.join(", ")}`);
        return;
      }

      const parsed: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, j) => { row[h] = vals[j]?.trim() ?? ""; });
        if (row.full_name?.trim()) parsed.push(row);
      }

      if (!parsed.length) { setParseError("No valid data rows found."); return; }
      setRows(parsed);
    };
    reader.readAsText(file);
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
    const header = CSV_COLUMNS.join(",");
    const example = [
      "Jane Wanjiru", "MUST/PG/123/2020", "jane@example.com", "+254712345678",
      "Main Campus (Nchiru)", "sci", "cs", "Bachelor of Science (Computer Science)",
      "2024", "Employed (Full-time)", "Safaricom PLC", "Software Engineer",
      "Information & Communication Technology (ICT)", "Nairobi", "1 – 3 months", "",
    ].join(",");
    const blob = new Blob([header + "\n" + example + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MUST_Graduate_Upload_Template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">CSV Bulk Upload</CardTitle>
          <CardDescription>Upload a CSV file with graduate records. Download the template to see the expected format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template + column reference */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-xs">
              📥 Download Template
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Required: <span className="font-semibold">full_name, campus, school, department, programme, graduation_year, employment_status</span>
            </p>
          </div>

          {/* Column reference */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
              📋 View column reference & valid values
            </summary>
            <div className="mt-2 rounded-lg border p-3 space-y-2 text-[11px] text-muted-foreground bg-muted/30">
              <p><span className="font-semibold text-foreground">campus:</span> {CAMPUSES.join(" | ")}</p>
              <p><span className="font-semibold text-foreground">school</span> (use ID): {schools.map((s) => s.id).join(", ")}</p>
              <p><span className="font-semibold text-foreground">department</span> (use ID): see school reference above — use department IDs (e.g. cs, it, bus…)</p>
              <p><span className="font-semibold text-foreground">programme:</span> Use exact programme name (see template)</p>
              <p><span className="font-semibold text-foreground">employment_status:</span> {EMPLOYMENT_STATUSES.join(" | ")}</p>
              <p><span className="font-semibold text-foreground">sector:</span> {EMPLOYMENT_SECTORS.slice(0, 5).join(" | ")} …</p>
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
              {fileName || "Drop CSV file here or click to browse"}
            </p>
            <p className="text-[10px] text-muted-foreground">Accepts .csv files</p>
            <input ref={inputRef} type="file" accept=".csv" onChange={handleInputChange} className="hidden" />
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
