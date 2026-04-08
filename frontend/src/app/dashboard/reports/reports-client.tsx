"use client";

import { useState, useEffect, useTransition } from "react";
import { fetchDepartments, fetchProgrammes, type School, type Department } from "@/lib/must-queries";
import { REPORT_YEARS } from "@/lib/must-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CAMPUSES = ["Main Campus (Nchiru)", "Meru Town Campus"] as const;
const EMPLOYMENT_STATUSES = [
  "Employed (Full-time)", "Employed (Part-time)", "Self-employed / Entrepreneur",
  "Internship / Attachment", "Further Studies", "Unemployed — Seeking", "Unemployed — Not Seeking",
] as const;

type PreviewData = { total: number; employment_rate: number; scope: string } | null;

type GeneratedReport = {
  scope: string;
  generated_at: string;
  stats: {
    total: number;
    employment_rate: number;
    by_status: { name: string; count: number }[];
    by_school: { name: string; count: number }[];
    by_department: { name: string; school: string; count: number }[];
    by_sector: { name: string; count: number }[];
    by_year: { year: number; count: number; employed: number }[];
    by_campus: { name: string; count: number }[];
    by_months_to_employ: { name: string; count: number }[];
  };
  narrative: {
    report_summary: string;
    executive_summary: string;
    key_findings: string;
    trends_analysis: string;
    recommendations: string;
  };
};

function Sel({ label, value, onChange, disabled, children, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  disabled?: boolean; children: React.ReactNode; placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </div>
  );
}

function FilterTag({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
      <span className="text-muted-foreground">{label}:</span> {value}
      <button onClick={onRemove} className="ml-0.5 hover:text-destructive transition-colors">×</button>
    </span>
  );
}

function NarrativeSection({
  icon, title, content, onEdit, editing,
}: {
  icon: string; title: string; content: string;
  onEdit: (instruction: string) => Promise<boolean>;
  editing: boolean;
}) {
  const [instruction, setInstruction] = useState("");
  const [open, setOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  if (!content) return null;

  async function handleApply() {
    if (!instruction.trim()) return;
    setEditError(null);
    const ok = await onEdit(instruction);
    if (ok) {
      setInstruction("");
      setOpen(false);
    } else {
      setEditError("AI edit failed. Try again.");
    }
  }

  return (
    <div className="space-y-2">
      {title && (
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <span>{icon}</span> {title}
          </h3>
          <button
            onClick={() => { setOpen((v) => !v); setEditError(null); }}
            disabled={editing}
            className="text-[11px] text-amber-600 hover:text-amber-500 font-medium disabled:opacity-50"
          >
            {open ? "✕ Cancel" : "✏️ Edit with AI"}
          </button>
        </div>
      )}
      {!title && (
        <div className="flex justify-end">
          <button
            onClick={() => { setOpen((v) => !v); setEditError(null); }}
            disabled={editing}
            className="text-[11px] text-amber-600 hover:text-amber-500 font-medium disabled:opacity-50"
          >
            {open ? "✕ Cancel" : "✏️ Edit with AI"}
          </button>
        </div>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>
      {open && (
        <div className="space-y-1.5 pt-1">
          <div className="flex gap-2">
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !editing && handleApply()}
              placeholder="e.g. Make it more concise"
              disabled={editing}
              className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <Button
              size="sm"
              disabled={editing || !instruction.trim()}
              onClick={handleApply}
              className="min-w-[72px] bg-amber-600 hover:bg-amber-500 text-white"
            >
              {editing
                ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : "Apply"}
            </Button>
          </div>
          {editing && (
            <p className="text-[11px] text-amber-600">✨ AI is rewriting this section…</p>
          )}
          {editError && (
            <p className="text-[11px] text-destructive">{editError}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ReportsClient({ schools }: { schools: School[] }) {
  // Filters
  const [schoolId, setSchoolId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [programme, setProgramme] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [campus, setCampus] = useState("");
  const [empStatus, setEmpStatus] = useState("");

  // Cascade
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingProgs, setLoadingProgs] = useState(false);

  // Preview (lightweight)
  const [preview, setPreview] = useState<PreviewData>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Generated report (AI narrative + stats)
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [generating, startGenerating] = useTransition();
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Download
  const [downloadingPdf, startPdfTransition] = useTransition();
  const [downloadingExcel, startExcelTransition] = useTransition();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Section editing
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Cascade: school → departments
  useEffect(() => {
    setDeptId(""); setProgramme(""); setDepartments([]); setProgrammes([]);
    if (!schoolId) return;
    setLoadingDepts(true);
    fetchDepartments(schoolId)
      .then(setDepartments).catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }, [schoolId]);

  // Cascade: dept → programmes
  useEffect(() => {
    setProgramme(""); setProgrammes([]);
    if (!schoolId || !deptId) return;
    setLoadingProgs(true);
    fetchProgrammes(schoolId, deptId)
      .then(setProgrammes).catch(() => setProgrammes([]))
      .finally(() => setLoadingProgs(false));
  }, [deptId, schoolId]);

  // Live preview count whenever filters change — reset generated report
  useEffect(() => {
    setReport(null);
    setGenerateError(null);
    const params = buildParams();
    setLoadingPreview(true);
    setPreview(null);
    fetch(`/api/reports/preview?${params}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then(setPreview).catch(() => setPreview(null))
      .finally(() => setLoadingPreview(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, deptId, programme, yearFrom, yearTo, campus, empStatus]);

  function buildBody() {
    return {
      school_id:         schoolId || null,
      school_name:       schools.find((s) => s.id === schoolId)?.name ?? null,
      department_id:     deptId || null,
      department_name:   departments.find((d) => d.id === deptId)?.name ?? null,
      programme_name:    programme || null,
      year_from:         yearFrom ? parseInt(yearFrom, 10) : null,
      year_to:           yearTo ? parseInt(yearTo, 10) : null,
      campus:            campus || null,
      employment_status: empStatus || null,
    };
  }

  function buildParams() {
    const p = new URLSearchParams();
    if (schoolId) p.set("school_id", schoolId);
    if (deptId) p.set("department_id", deptId);
    if (programme) p.set("programme_name", programme);
    if (yearFrom) p.set("year_from", yearFrom);
    if (yearTo) p.set("year_to", yearTo);
    if (campus) p.set("campus", campus);
    if (empStatus) p.set("employment_status", empStatus);
    return p.toString();
  }

  function clearFilters() {
    setSchoolId(""); setDeptId(""); setProgramme("");
    setYearFrom(""); setYearTo(""); setCampus(""); setEmpStatus("");
  }

  function handleGenerate() {
    setGenerateError(null);
    setReport(null);
    startGenerating(async () => {
      let res: Response;
      try {
        res = await fetch("/api/reports/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(buildBody()),
        });
      } catch {
        setGenerateError("Cannot reach the backend server. Make sure it is running.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setGenerateError(body?.error ?? body?.title ?? `Request failed (${res.status})`);
        return;
      }
      const data: GeneratedReport = await res.json();
      setReport(data);
      // Scroll to report
      setTimeout(() => document.getElementById("report-preview")?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }

  async function handleEditSection(sectionKey: keyof GeneratedReport["narrative"], sectionName: string, instruction: string): Promise<boolean> {
    if (!report) return false;
    setEditingSection(sectionKey);
    try {
      const res = await fetch("/api/reports/edit-section", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          section: sectionName,
          currentContent: report.narrative[sectionKey],
          instruction,
          context: `Scope: ${report.scope}. Total graduates: ${report.stats.total}. Employment rate: ${report.stats.employment_rate}%.`,
        }),
      });
      if (!res.ok) return false;
      const { content } = await res.json();
      if (!content?.trim()) return false;
      setReport((prev) => prev ? { ...prev, narrative: { ...prev.narrative, [sectionKey]: content } } : prev);
      return true;
    } catch {
      return false;
    } finally {
      setEditingSection(null);
    }
  }

  async function download(format: "pdf" | "excel") {
    if (!report) return;
    setDownloadError(null);

    const body = {
      ...buildBody(),
      narrative: {
        report_summary:    report.narrative.report_summary,
        executive_summary: report.narrative.executive_summary,
        key_findings:      report.narrative.key_findings,
        trends_analysis:   report.narrative.trends_analysis,
        recommendations:   report.narrative.recommendations,
      },
    };

    const run = async () => {
      let res: Response;
      try {
        res = await fetch(`/api/reports/${format}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
      } catch {
        setDownloadError("Cannot reach the backend server.");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setDownloadError(err?.error ?? err?.title ?? `Request failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const ext = format === "pdf" ? "pdf" : "xlsx";
      const filename = `MUST_GradTrack_Report_${new Date().toISOString().slice(0, 10)}.${ext}`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    };

    if (format === "pdf") startPdfTransition(run);
    else startExcelTransition(run);
  }

  const hasFilters = !!(schoolId || deptId || programme || yearFrom || yearTo || campus || empStatus);
  const canGenerate = (preview?.total ?? 0) > 0 && !generating;

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      {/* ── Filter Panel ── */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">🔍 Filters</CardTitle>
            <CardDescription className="text-xs">Scope the report. Leave blank for all graduates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Sel label="School / Faculty" value={schoolId} onChange={setSchoolId} placeholder="All Schools">
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Sel>
            <Sel label="Department" value={deptId} onChange={setDeptId}
              placeholder={!schoolId ? "Select school first" : loadingDepts ? "Loading…" : "All Departments"}
              disabled={!schoolId || loadingDepts}>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Sel>
            <Sel label="Programme" value={programme} onChange={setProgramme}
              placeholder={!deptId ? "Select department first" : loadingProgs ? "Loading…" : "All Programmes"}
              disabled={!deptId || loadingProgs}>
              {programmes.map((p) => <option key={p} value={p}>{p}</option>)}
            </Sel>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <Sel label="Year From" value={yearFrom} onChange={(v) => {
                setYearFrom(v);
                // If yearTo is set and now less than yearFrom, clear it
                if (yearTo && v && parseInt(v) > parseInt(yearTo)) setYearTo("");
              }} placeholder="Any">
                {REPORT_YEARS
                  .filter((y) => !yearTo || parseInt(y) <= parseInt(yearTo))
                  .map((y) => <option key={y} value={y}>{y}</option>)}
              </Sel>
              <Sel label="Year To" value={yearTo} onChange={(v) => {
                setYearTo(v);
                // If yearFrom is set and now greater than yearTo, clear it
                if (yearFrom && v && parseInt(v) < parseInt(yearFrom)) setYearFrom("");
              }} placeholder="Any">
                {REPORT_YEARS
                  .filter((y) => !yearFrom || parseInt(y) >= parseInt(yearFrom))
                  .map((y) => <option key={y} value={y}>{y}</option>)}
              </Sel>
            </div>
            {yearFrom && yearTo && parseInt(yearFrom) > parseInt(yearTo) && (
              <p className="text-xs text-destructive font-medium">⚠️ Year From must be ≤ Year To</p>
            )}
            <Sel label="Campus" value={campus} onChange={setCampus} placeholder="All Campuses">
              {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Sel>
            <Sel label="Employment Status" value={empStatus} onChange={setEmpStatus} placeholder="All Statuses">
              {EMPLOYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Sel>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-amber-600 hover:text-amber-500 font-medium">
                ✕ Clear all filters
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Right Panel ── */}
      <div className="space-y-4">

        {/* Scope preview */}
        <Card className={cn("border-2 transition-colors",
          preview && preview.total > 0 ? "border-green-300 dark:border-green-800" : "border-border"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">📋 Report Scope</CardTitle>
            <CardDescription className="text-xs">Live summary of what will be included.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPreview ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                Calculating…
              </div>
            ) : preview ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground">Graduates</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{preview.total.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground">Employment Rate</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{preview.employment_rate}%</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground">Scope</p>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 leading-tight">{preview.scope}</p>
                  </div>
                </div>

                {hasFilters && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active Filters</p>
                    <div className="flex flex-wrap gap-1.5">
                      {schoolId && <FilterTag label="School" value={schools.find((s) => s.id === schoolId)?.name.match(/\(([^)]+)\)/)?.[1] ?? schoolId} onRemove={() => setSchoolId("")} />}
                      {deptId && <FilterTag label="Dept" value={departments.find((d) => d.id === deptId)?.name.replace("Department of ", "") ?? deptId} onRemove={() => setDeptId("")} />}
                      {programme && <FilterTag label="Programme" value={programme.length > 28 ? programme.slice(0, 28) + "…" : programme} onRemove={() => setProgramme("")} />}
                      {yearFrom && <FilterTag label="From" value={yearFrom} onRemove={() => setYearFrom("")} />}
                      {yearTo && <FilterTag label="To" value={yearTo} onRemove={() => setYearTo("")} />}
                      {campus && <FilterTag label="Campus" value={campus} onRemove={() => setCampus("")} />}
                      {empStatus && <FilterTag label="Status" value={empStatus} onRemove={() => setEmpStatus("")} />}
                    </div>
                  </div>
                )}

                {preview.total === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ No graduates match these filters.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center space-y-1">
                <p className="text-sm font-medium text-muted-foreground">No filters selected</p>
                <p className="text-xs text-muted-foreground/70">Use the filters on the left to scope your report.</p>
              </div>
            )}

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white gap-2"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  GradTrack is generating your report…
                </>
              ) : (
                <>🤖 Generate Report Preview</>
              )}
            </Button>

            {generateError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                ❌ {generateError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── AI-Generated Report Preview ── */}
        {report && (
          <div id="report-preview" className="space-y-4">
            {/* Header */}
            <Card className="border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">✅</span>
                      <p className="text-sm font-bold text-green-800 dark:text-green-300">Report Generated</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {new Date(report.generated_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scope: <span className="font-medium text-foreground">{report.scope}</span>
                      {" · "}{report.stats.total.toLocaleString()} graduates
                      {" · "}{report.stats.employment_rate}% employed
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => download("pdf")}
                      disabled={downloadingPdf || downloadingExcel}
                      className="gap-1.5 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white"
                    >
                      {downloadingPdf ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating…</> : "📄 Download PDF"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => download("excel")}
                      disabled={downloadingPdf || downloadingExcel}
                      className="gap-1.5 border-amber-500/50 hover:bg-amber-500/10"
                    >
                      {downloadingExcel ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /> Generating…</> : "📊 Download Excel"}
                    </Button>
                  </div>
                </div>
                {downloadError && (
                  <p className="mt-2 text-xs text-destructive">❌ {downloadError}</p>
                )}
              </CardContent>
            </Card>

            {/* Report Summary — integrated overview */}
            {report.narrative.report_summary && (
              <Card className="border-2 border-green-300 dark:border-green-800 bg-green-50/40 dark:bg-green-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    📄 Report Summary
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Integrated overview — suitable for executive circulation and donor briefings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NarrativeSection
                    icon=""
                    title=""
                    content={report.narrative.report_summary}
                    editing={editingSection === "report_summary"}
                    onEdit={(ins) => handleEditSection("report_summary", "Report Summary", ins)}
                  />
                </CardContent>
              </Card>
            )}

            {/* AI Narrative */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  📝 Report Narrative
                </CardTitle>
                <CardDescription className="text-xs">
                  Review and edit each section below. When satisfied, download as PDF or Excel above.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <NarrativeSection icon="📋" title="Executive Summary" content={report.narrative.executive_summary} editing={editingSection === "executive_summary"} onEdit={(ins) => handleEditSection("executive_summary", "Executive Summary", ins)} />
                <Separator />
                <NarrativeSection icon="🔍" title="Key Findings" content={report.narrative.key_findings} editing={editingSection === "key_findings"} onEdit={(ins) => handleEditSection("key_findings", "Key Findings", ins)} />
                <Separator />
                <NarrativeSection icon="📈" title="Trends Analysis" content={report.narrative.trends_analysis} editing={editingSection === "trends_analysis"} onEdit={(ins) => handleEditSection("trends_analysis", "Trends Analysis", ins)} />
                <Separator />
                <NarrativeSection icon="💡" title="Recommendations" content={report.narrative.recommendations} editing={editingSection === "recommendations"} onEdit={(ins) => handleEditSection("recommendations", "Recommendations", ins)} />
              </CardContent>
            </Card>

            {/* Stats tables */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📊 Data Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatsTable title="Employment Status" rows={report.stats.by_status.map((x) => [x.name, x.count.toString(), report.stats.total > 0 ? `${Math.round(x.count / report.stats.total * 100)}%` : "0%"])} headers={["Status", "Count", "%"]} />
                  <StatsTable title="Top Sectors" rows={report.stats.by_sector.slice(0, 8).map((x) => [x.name, x.count.toString()])} headers={["Sector", "Count"]} />
                </div>
                <StatsTable title="Year-on-Year Trend" rows={report.stats.by_year.map((x) => [x.year.toString(), x.count.toString(), x.employed.toString(), x.count > 0 ? `${Math.round(x.employed / x.count * 100)}%` : "0%"])} headers={["Year", "Total", "Employed", "Rate"]} />
                {report.stats.by_department.length > 0 && (
                  <StatsTable title="By Department" rows={report.stats.by_department.slice(0, 10).map((x) => [x.name, x.school, x.count.toString()])} headers={["Department", "School", "Count"]} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              {headers.map((h) => <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                {row.map((cell, j) => <td key={j} className="px-3 py-2 text-foreground">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
