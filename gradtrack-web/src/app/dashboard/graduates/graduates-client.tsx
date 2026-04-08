"use client";

import { useState, useMemo } from "react";
import type { Graduate } from "@/lib/dashboard-queries";
import type { School as MustSchool } from "@/lib/must-queries";
import { shortSchool, shortDept, shortStatus } from "@/lib/dashboard-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SortKey = "full_name" | "graduation_year" | "school_name" | "department_name" | "programme_name" | "employment_status" | "campus" | "created_at";
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<string, string> = {
  "Employed (Full-time)": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Employed (Part-time)": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Self-employed / Entrepreneur": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Internship / Attachment": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Further Studies": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Unemployed — Seeking": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Unemployed — Not Seeking": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function GraduatesPageClient({ graduates, mustSchools }: { graduates: Graduate[]; mustSchools: MustSchool[] }) {
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [campusFilter, setCampusFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Graduate | null>(null);
  const perPage = 20;

  const uniqueYears = [...new Set(graduates.map((r) => r.graduation_year))].sort((a, b) => b - a);
  const uniqueStatuses = [...new Set(graduates.map((r) => r.employment_status))];
  const uniqueSectors = [...new Set(graduates.map((r) => r.sector).filter(Boolean))] as string[];

  const filtered = useMemo(() => {
    let rows = graduates;
    if (schoolFilter) rows = rows.filter((r) => r.school_id === schoolFilter);
    if (yearFilter) rows = rows.filter((r) => String(r.graduation_year) === yearFilter);
    if (statusFilter) rows = rows.filter((r) => r.employment_status === statusFilter);
    if (campusFilter) rows = rows.filter((r) => r.campus === campusFilter);
    if (sectorFilter) rows = rows.filter((r) => r.sector === sectorFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.programme_name.toLowerCase().includes(q) ||
        r.department_name.toLowerCase().includes(q) ||
        r.school_name.toLowerCase().includes(q) ||
        (r.employer_name?.toLowerCase().includes(q) ?? false) ||
        (r.job_title?.toLowerCase().includes(q) ?? false) ||
        (r.student_number?.toLowerCase().includes(q) ?? false) ||
        (r.email?.toLowerCase().includes(q) ?? false) ||
        (r.phone?.includes(q) ?? false) ||
        (r.sector?.toLowerCase().includes(q) ?? false) ||
        (r.employment_county?.toLowerCase().includes(q) ?? false) ||
        String(r.graduation_year).includes(q)
      );
    }
    return rows;
  }, [graduates, schoolFilter, yearFilter, statusFilter, campusFilter, sectorFilter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice(page * perPage, (page + 1) * perPage);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }

  const hasFilters = schoolFilter || yearFilter || statusFilter || campusFilter || sectorFilter;

  function clearFilters() {
    setSchoolFilter(""); setYearFilter(""); setStatusFilter("");
    setCampusFilter(""); setSectorFilter(""); setSearch(""); setPage(0);
  }

  function exportCSV() {
    const h = ["Full Name","Student Number","Email","Phone","Campus","School","Department","Programme","Year","Status","Employer","Job Title","Sector","County","Months to Employ","LinkedIn"];
    const rows = [h.join(",")];
    filtered.forEach((r) => {
      rows.push([
        esc(r.full_name), esc(r.student_number), esc(r.email), esc(r.phone), esc(r.campus),
        esc(r.school_name), esc(r.department_name), esc(r.programme_name), r.graduation_year,
        esc(r.employment_status), esc(r.employer_name), esc(r.job_title), esc(r.sector),
        esc(r.employment_county), esc(r.months_to_employ), esc(r.linkedin_url),
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MUST_Graduates_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-0.5 text-muted-foreground/40 text-[10px]">↕</span>;
    return <span className="ml-0.5 text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <Input
            placeholder="🔍 Search name, student no., email, programme, employer…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="text-sm"
          />
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
            <Flt label="School" value={schoolFilter} onChange={(v) => { setSchoolFilter(v); setPage(0); }}
              options={mustSchools.map((s) => ({ value: s.id, label: shortSchool(s.name) }))} />
            <Flt label="Year" value={yearFilter} onChange={(v) => { setYearFilter(v); setPage(0); }}
              options={uniqueYears.map((y) => ({ value: String(y), label: String(y) }))} />
            <Flt label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(0); }}
              options={uniqueStatuses.map((s) => ({ value: s, label: s }))} />
            <Flt label="Campus" value={campusFilter} onChange={(v) => { setCampusFilter(v); setPage(0); }}
              options={[{ value: "Main Campus (Nchiru)", label: "Main Campus" }, { value: "Meru Town Campus", label: "Meru Town" }]} />
            <Flt label="Sector" value={sectorFilter} onChange={(v) => { setSectorFilter(v); setPage(0); }}
              options={uniqueSectors.map((s) => ({ value: s, label: s }))} />
            {(hasFilters || search) && (
              <button onClick={clearFilters} className="text-xs text-amber-600 hover:text-amber-500 font-medium">✕ Clear all</button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <span className="text-[11px] text-muted-foreground font-medium">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            <Button variant="outline" size="sm" onClick={exportCSV} className="text-[11px] h-7">📥 Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("full_name")}>
                Name <SortIcon col="full_name" />
              </TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("campus")}>
                Campus <SortIcon col="campus" />
              </TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("school_name")}>
                School <SortIcon col="school_name" />
              </TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("department_name")}>
                Department <SortIcon col="department_name" />
              </TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("programme_name")}>
                Programme <SortIcon col="programme_name" />
              </TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap text-center" onClick={() => toggleSort("graduation_year")}>
                Year <SortIcon col="graduation_year" />
              </TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("employment_status")}>
                Status <SortIcon col="employment_status" />
              </TableHead>
              <TableHead className="whitespace-nowrap">Employer</TableHead>
              <TableHead className="whitespace-nowrap">Job Title</TableHead>
              <TableHead className="whitespace-nowrap">Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-16 text-muted-foreground">
                  No graduates found. Try adjusting your search or filters.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((g) => (
                <TableRow key={g.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelected(g)}>
                  <TableCell className="font-medium whitespace-nowrap">{g.full_name}</TableCell>
                  <TableCell className="text-xs">{g.campus === "Main Campus (Nchiru)" ? "Main" : "Meru Town"}</TableCell>
                  <TableCell className="text-xs">{shortSchool(g.school_name)}</TableCell>
                  <TableCell className="text-xs max-w-[140px] truncate">{shortDept(g.department_name)}</TableCell>
                  <TableCell className="text-xs max-w-[180px] truncate">{g.programme_name}</TableCell>
                  <TableCell className="text-center text-xs">{g.graduation_year}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("text-[10px] font-medium whitespace-nowrap", STATUS_COLORS[g.employment_status] ?? "")}>
                      {shortStatus(g.employment_status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{g.employer_name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{g.job_title ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{g.email ?? g.phone ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {page * perPage + 1}–{Math.min((page + 1) * perPage, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page === 0} onClick={() => setPage(0)}>⟨⟨</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <span className="flex items-center text-[11px] text-muted-foreground px-2">{page + 1}/{totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>⟩⟩</Button>
          </div>
        </div>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selected.full_name}</DialogTitle>
                <Badge variant="secondary" className={cn("w-fit text-xs", STATUS_COLORS[selected.employment_status] ?? "")}>
                  {selected.employment_status}
                </Badge>
              </DialogHeader>
              <div className="grid gap-4 mt-2">
                <Section title="Personal Details">
                  <Row label="Student Number" value={selected.student_number} />
                  <Row label="Email" value={selected.email} />
                  <Row label="Phone" value={selected.phone} />
                </Section>
                <Section title="Academic Details">
                  <Row label="Campus" value={selected.campus} />
                  <Row label="School" value={selected.school_name} />
                  <Row label="Department" value={selected.department_name} />
                  <Row label="Programme" value={selected.programme_name} />
                  <Row label="Graduation Year" value={String(selected.graduation_year)} />
                </Section>
                <Section title="Employment Details">
                  <Row label="Status" value={selected.employment_status} />
                  <Row label="Employer" value={selected.employer_name} />
                  <Row label="Job Title" value={selected.job_title} />
                  <Row label="Sector" value={selected.sector} />
                  <Row label="Work Location" value={selected.employment_county} />
                  <Row label="Time to Employment" value={selected.months_to_employ} />
                  {selected.linkedin_url && (
                    <Row label="LinkedIn" value={
                      <a href={selected.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs break-all">
                        {selected.linkedin_url}
                      </a>
                    } />
                  )}
                </Section>
                <p className="text-[10px] text-muted-foreground">
                  Submitted {new Date(selected.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Small helpers ── */
function Flt({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-7 rounded-md border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-ring">
      <option value="">{label}: All</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
      <div className="rounded-lg border divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function esc(v: string | null | undefined) {
  if (!v) return "";
  if (v.includes(",") || v.includes('"') || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

