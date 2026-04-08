"use client";

import { useState, useMemo } from "react";
import type { DashboardData, Graduate } from "@/lib/dashboard-queries";
import type { School as MustSchool } from "@/lib/must-queries";
import { EMPLOYED_STATUSES, shortSchool, shortDept, shortSector } from "@/lib/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DashboardBarChart,
  DashboardPieChart,
  DashboardAreaChart,
  EmploymentGauge,
  HeroStatusChart,
  ComparisonBarChart,
} from "./charts";

/* ── Filter select ── */
function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring min-w-0"
      aria-label={label}>
      <option value="">{label}: All</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ── KPI Card ── */
function KpiCard({ title, value, subtitle, icon, accent = "green" }: {
  title: string; value: string | number; subtitle?: string; icon: string;
  accent?: "green" | "amber" | "blue" | "purple";
}) {
  const a = {
    green: "from-green-500/10 to-green-600/5 border-green-500/20",
    amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20",
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20",
  };
  return (
    <Card className={cn("border bg-gradient-to-br", a[accent])}>
      <CardContent className="flex items-center gap-3 p-4 sm:p-5">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-background text-xl sm:text-2xl shadow-sm">{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-xl sm:text-2xl font-black tracking-tight">{value}</p>
          {subtitle && <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Chart Card ── */
function ChartCard({ title, subtitle, hint, children, className }: {
  title: string; subtitle?: string; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 space-y-0.5">
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        {hint && (
          <p className="text-[10px] text-muted-foreground/70 italic flex items-center gap-1">
            <span>💡</span> {hint}
          </p>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

/* ── Tab navigation card ── */
const TABS = [
  { id: "overview",  label: "Overview",      icon: "📊", desc: "Key metrics & status" },
  { id: "employment",label: "Employment",     icon: "💼", desc: "Sectors & time-to-hire" },
  { id: "academic",  label: "Academic",       icon: "🏫", desc: "Schools & departments" },
  { id: "trends",    label: "Trends",         icon: "📈", desc: "Year-over-year data" },
  { id: "compare",   label: "Compare Years",  icon: "↔️",  desc: "Side-by-side cohort view" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ── Main Overview ── */
export function DashboardOverview({ data, mustSchools }: { data: DashboardData; mustSchools: MustSchool[] }) {
  const [schoolFilter, setSchoolFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [yearA, setYearA] = useState("");
  const [yearB, setYearB] = useState("");

  const filteredGrads = useMemo(() => {
    let rows = data.graduates;
    if (schoolFilter) rows = rows.filter((r) => r.school_id === schoolFilter);
    if (yearFilter) rows = rows.filter((r) => String(r.graduation_year) === yearFilter);
    if (statusFilter) rows = rows.filter((r) => r.employment_status === statusFilter);
    return rows;
  }, [data.graduates, schoolFilter, yearFilter, statusFilter]);

  const filteredEmployed = filteredGrads.filter((r) =>
    EMPLOYED_STATUSES.includes(r.employment_status as (typeof EMPLOYED_STATUSES)[number]),
  );
  const filteredRate = filteredGrads.length > 0 ? Math.round((filteredEmployed.length / filteredGrads.length) * 100) : 0;

  const bySchool = useMemo(() => agg(filteredGrads, (r) => shortSchool(r.school_name)), [filteredGrads]);
  const byStatus = useMemo(() => agg(filteredGrads, (r) => r.employment_status), [filteredGrads]);
  const bySector = useMemo(() => agg(filteredGrads.filter((r) => r.sector), (r) => shortSector(r.sector!)), [filteredGrads]);
  const byCampus = useMemo(() => agg(filteredGrads, (r) => r.campus), [filteredGrads]);
  const byDept = useMemo(() => agg(filteredGrads, (r) => shortDept(r.department_name)), [filteredGrads]);
  const byMte = useMemo(() => agg(filteredGrads.filter((r) => r.months_to_employ), (r) => r.months_to_employ!), [filteredGrads]);

  const byYear = useMemo(() => {
    const m = new Map<number, { count: number; employed: number }>();
    filteredGrads.forEach((r) => {
      const e = m.get(r.graduation_year) ?? { count: 0, employed: 0 };
      e.count++;
      if (EMPLOYED_STATUSES.includes(r.employment_status as (typeof EMPLOYED_STATUSES)[number])) e.employed++;
      m.set(r.graduation_year, e);
    });
    return [...m.entries()].map(([year, v]) => ({ year, ...v })).sort((a, b) => a.year - b.year);
  }, [filteredGrads]);

  const uniqueYears = [...new Set(data.graduates.map((r) => r.graduation_year))].sort((a, b) => b - a);
  const uniqueStatuses = [...new Set(data.graduates.map((r) => r.employment_status))];
  const hasFilters = schoolFilter || yearFilter || statusFilter;

  // ── Year comparison helpers ──────────────────────────────────────────────
  function cohortStats(year: string) {
    if (!year) return null;
    const rows = data.graduates.filter((r) => String(r.graduation_year) === year);
    if (!rows.length) return null;
    const employed = rows.filter((r) =>
      EMPLOYED_STATUSES.includes(r.employment_status as (typeof EMPLOYED_STATUSES)[number]));
    const rate = Math.round((employed.length / rows.length) * 100);
    const byStatus = agg(rows, (r) => r.employment_status);
    const bySchool = agg(rows, (r) => shortSchool(r.school_name));
    const bySector = agg(rows.filter((r) => r.sector), (r) => shortSector(r.sector!));
    const seeking = rows.filter((r) => r.employment_status === "Unemployed — Seeking").length;
    return { total: rows.length, employed: employed.length, rate, byStatus, bySchool, bySector, seeking };
  }

  const statsA = useMemo(() => cohortStats(yearA), [yearA, data.graduates]); // eslint-disable-line react-hooks/exhaustive-deps
  const statsB = useMemo(() => cohortStats(yearB), [yearB, data.graduates]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build merged comparison data for grouped bar charts
  const compareSchoolData = useMemo(() => {
    if (!statsA || !statsB) return [];
    const allNames = [...new Set([...statsA.bySchool.map((x) => x.name), ...statsB.bySchool.map((x) => x.name)])];
    return allNames.map((name) => ({
      name,
      a: statsA.bySchool.find((x) => x.name === name)?.count ?? 0,
      b: statsB.bySchool.find((x) => x.name === name)?.count ?? 0,
    }));
  }, [statsA, statsB]);

  const compareSectorData = useMemo(() => {
    if (!statsA || !statsB) return [];
    const allNames = [...new Set([...statsA.bySector.map((x) => x.name), ...statsB.bySector.map((x) => x.name)])];
    return allNames
      .map((name) => ({
        name,
        a: statsA.bySector.find((x) => x.name === name)?.count ?? 0,
        b: statsB.bySector.find((x) => x.name === name)?.count ?? 0,
      }))
      .sort((x, y) => (y.a + y.b) - (x.a + x.b))
      .slice(0, 10);
  }, [statsA, statsB]);

  const compareStatusData = useMemo(() => {
    if (!statsA || !statsB) return [];
    const allNames = [...new Set([...statsA.byStatus.map((x) => x.name), ...statsB.byStatus.map((x) => x.name)])];
    return allNames.map((name) => ({
      name,
      a: statsA.byStatus.find((x) => x.name === name)?.count ?? 0,
      b: statsB.byStatus.find((x) => x.name === name)?.count ?? 0,
    }));
  }, [statsA, statsB]);

  const seekingCount = filteredGrads.filter((r) => r.employment_status === "Unemployed — Seeking").length;
  const studiesCount = filteredGrads.filter((r) => r.employment_status === "Further Studies").length;
  const uniqueEmployers = new Set(filteredGrads.map((r) => r.employer_name).filter(Boolean)).size;

  return (
    <div className="space-y-5">
      {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
          <span className="text-xs font-bold text-foreground shrink-0">🔍 Filters</span>
        <FilterSelect label="School" value={schoolFilter} onChange={setSchoolFilter}
          options={mustSchools.map((s) => ({ value: s.id, label: s.name.match(/\(([^)]+)\)/)?.[1] ?? s.name }))} />
        <FilterSelect label="Year" value={yearFilter} onChange={setYearFilter}
          options={uniqueYears.map((y) => ({ value: String(y), label: String(y) }))} />
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
          options={uniqueStatuses.map((s) => ({ value: s, label: s }))} />
        {hasFilters && (
          <button onClick={() => { setSchoolFilter(""); setYearFilter(""); setStatusFilter(""); }}
            className="text-xs text-amber-600 hover:text-amber-500 font-medium">✕ Clear</button>
        )}
        {/* Committee actions */}
        <div className="ml-auto flex items-center gap-2">
          <a href="/register" target="_blank" rel="noreferrer"
            className="inline-flex items-center h-7 px-3 rounded-md border border-input bg-background text-[11px] font-medium hover:bg-muted transition-colors">
            📋 Registration Link
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard icon="🎓" title="Total Graduates" value={filteredGrads.length.toLocaleString()} accent="green" />
        <KpiCard icon="💼" title="Employed" value={filteredEmployed.length.toLocaleString()} subtitle={`${filteredRate}% employment rate`} accent="blue" />
        <KpiCard icon="🔍" title="Seeking Work" value={seekingCount} subtitle={filteredGrads.length > 0 ? `${Math.round((seekingCount / filteredGrads.length) * 100)}% of total` : undefined} accent="amber" />
        <KpiCard icon="📚" title="Further Studies" value={studiesCount} accent="purple" />
        <KpiCard icon="🏢" title="Unique Employers" value={uniqueEmployers} subtitle="Distinct organizations" accent="green" />
      </div>

      {/* Hero chart — full-width employment status breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Employment Status Overview</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Full breakdown of all graduate employment statuses — each segment represents a status category
          </p>
        </CardHeader>
        <CardContent>
          <HeroStatusChart data={byStatus} />
        </CardContent>
      </Card>

      {/* Tab navigation — styled cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-3 sm:p-4 transition-all text-center",
              activeTab === tab.id
                ? "border-amber-500/50 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/20"
                : "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/20",
            )}
          >
            <span className="text-2xl sm:text-3xl">{tab.icon}</span>
            <span className={cn(
              "text-xs sm:text-sm font-bold",
              activeTab === tab.id ? "text-amber-700 dark:text-amber-400" : "text-foreground",
            )}>{tab.label}</span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight hidden sm:block">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ChartCard title="Employment Rate" subtitle="Overall gauge" hint="Green ≥70% | Amber ≥50% | Red <50%">
              <EmploymentGauge rate={filteredRate} total={filteredGrads.length} employed={filteredEmployed.length} />
            </ChartCard>
            <ChartCard title="Graduates by School" subtitle="Faculty distribution" hint="Bar height = number of graduates" className="md:col-span-1 lg:col-span-2">
              <DashboardBarChart data={bySchool} color="#16a34a" />
            </ChartCard>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Employment Status" subtitle="Current status breakdown" hint="Hover slices for exact counts">
              <DashboardPieChart data={byStatus} />
            </ChartCard>
            <ChartCard title="Campus Distribution" subtitle="Main vs Meru Town" hint="Inner ring shows proportional split">
              <DashboardPieChart data={byCampus} innerRadius={50} outerRadius={90} />
            </ChartCard>
          </div>
        </div>
      )}

      {activeTab === "employment" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="By Sector" subtitle="Industries hiring MUST graduates" hint="Longer bar = more graduates in that sector">
              <DashboardBarChart data={bySector} layout="vertical" color="#3b82f6" height={350} />
            </ChartCard>
            <ChartCard title="Time to Employment" subtitle="How quickly graduates find jobs" hint="Shows months between graduation and first job">
              <DashboardBarChart data={byMte} layout="vertical" color="#f59e0b" height={300} />
            </ChartCard>
          </div>
        </div>
      )}

      {activeTab === "academic" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="By School" subtitle="Faculty comparison" hint="Compare graduate numbers across faculties">
              <DashboardBarChart data={bySchool} color="#16a34a" />
            </ChartCard>
            <ChartCard title="School Proportions" subtitle="Pie view" hint="Each slice = one school's share of total graduates">
              <DashboardPieChart data={bySchool} />
            </ChartCard>
          </div>
          <ChartCard title="By Department" subtitle="All departments" hint="Scroll down to see all departments">
            <DashboardBarChart data={byDept} layout="vertical" color="#06b6d4" height={500} />
          </ChartCard>
        </div>
      )}

      {activeTab === "trends" && (
        <div className="space-y-4">
          <ChartCard title="Graduation & Employment Trends" subtitle="Year-over-year" hint="Blue = total graduates, Green = employed — gap shows unemployment">
            <DashboardAreaChart data={byYear} height={350} />
          </ChartCard>
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Yearly Count" subtitle="Graduates per year" hint="Track registration growth over time">
              <DashboardBarChart data={byYear.map((y) => ({ name: String(y.year), count: y.count }))} color="#3b82f6" />
            </ChartCard>
            <ChartCard title="Yearly Employment %" subtitle="Rate per year" hint="Higher % = better employability outcomes that year">
              <DashboardBarChart data={byYear.map((y) => ({ name: String(y.year), count: y.count > 0 ? Math.round((y.employed / y.count) * 100) : 0 }))} color="#16a34a" />
            </ChartCard>
          </div>
        </div>
      )}

      {activeTab === "compare" && (
        <div className="space-y-5">
          {/* Year pickers */}
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Year A</p>
              <select
                value={yearA}
                onChange={(e) => setYearA(e.target.value)}
                className="h-9 rounded-md border border-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 text-sm font-semibold text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select year…</option>
                {uniqueYears.map((y) => (
                  <option key={y} value={String(y)} disabled={String(y) === yearB}>{y}</option>
                ))}
              </select>
            </div>
            <div className="text-2xl font-black text-muted-foreground pb-1">↔️</div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Year B</p>
              <select
                value={yearB}
                onChange={(e) => setYearB(e.target.value)}
                className="h-9 rounded-md border border-green-500 bg-green-50 dark:bg-green-950/30 px-3 text-sm font-semibold text-green-700 dark:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select year…</option>
                {uniqueYears.map((y) => (
                  <option key={y} value={String(y)} disabled={String(y) === yearA}>{y}</option>
                ))}
              </select>
            </div>
            {(yearA || yearB) && (
              <button
                onClick={() => { setYearA(""); setYearB(""); }}
                className="text-xs text-amber-600 hover:text-amber-500 font-medium pb-1"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Prompt when no years selected */}
          {(!yearA || !yearB) && (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed">
              <span className="text-4xl mb-3">↔️</span>
              <p className="text-sm font-semibold text-foreground">Select two graduation years to compare</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Pick Year A and Year B above to see a side-by-side breakdown of employment outcomes, sectors, and school distribution.
              </p>
            </div>
          )}

          {/* Comparison content */}
          {yearA && yearB && statsA && statsB && (
            <div className="space-y-5">
              {/* KPI delta cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  {
                    label: "Total Graduates",
                    a: statsA.total, b: statsB.total,
                    fmt: (v: number) => v.toLocaleString(),
                    icon: "🎓",
                  },
                  {
                    label: "Employment Rate",
                    a: statsA.rate, b: statsB.rate,
                    fmt: (v: number) => `${v}%`,
                    icon: "💼",
                  },
                  {
                    label: "Employed",
                    a: statsA.employed, b: statsB.employed,
                    fmt: (v: number) => v.toLocaleString(),
                    icon: "✅",
                  },
                  {
                    label: "Seeking Work",
                    a: statsA.seeking, b: statsB.seeking,
                    fmt: (v: number) => v.toLocaleString(),
                    icon: "🔍",
                  },
                ] as const).map(({ label, a, b, fmt, icon }) => {
                  const delta = (b as number) - (a as number);
                  const isRate = label === "Employment Rate";
                  const positive = isRate ? delta > 0 : label === "Seeking Work" ? delta < 0 : delta > 0;
                  const neutral = delta === 0;
                  return (
                    <div key={label} className="rounded-xl border bg-muted/20 p-3 space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <span>{icon}</span>{label}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-center">
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{yearA}</p>
                          <p className="text-lg font-black text-blue-700 dark:text-blue-300">{fmt(a as number)}</p>
                        </div>
                        <div className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          neutral ? "bg-muted text-muted-foreground" :
                          positive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                          "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        )}>
                          {neutral ? "↔" : delta > 0 ? `+${fmt(Math.abs(delta))}` : `-${fmt(Math.abs(delta))}`}
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">{yearB}</p>
                          <p className="text-lg font-black text-green-700 dark:text-green-300">{fmt(b as number)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Employment rate gauges side by side */}
              <div className="grid gap-4 sm:grid-cols-2">
                <ChartCard title={`Employment Rate — ${yearA}`} subtitle={`${statsA.total.toLocaleString()} graduates`}>
                  <EmploymentGauge rate={statsA.rate} total={statsA.total} employed={statsA.employed} />
                </ChartCard>
                <ChartCard title={`Employment Rate — ${yearB}`} subtitle={`${statsB.total.toLocaleString()} graduates`}>
                  <EmploymentGauge rate={statsB.rate} total={statsB.total} employed={statsB.employed} />
                </ChartCard>
              </div>

              {/* Grouped bar charts */}
              <ChartCard
                title="Employment Status Comparison"
                subtitle={`${yearA} vs ${yearB}`}
                hint="Blue = Year A, Green = Year B"
              >
                <ComparisonBarChart
                  data={compareStatusData}
                  labelA={yearA}
                  labelB={yearB}
                  height={300}
                />
              </ChartCard>

              <div className="grid gap-4 md:grid-cols-2">
                <ChartCard
                  title="Graduates by School"
                  subtitle={`${yearA} vs ${yearB}`}
                  hint="Blue = Year A, Green = Year B"
                >
                  <ComparisonBarChart
                    data={compareSchoolData}
                    labelA={yearA}
                    labelB={yearB}
                  />
                </ChartCard>
                <ChartCard
                  title="Top Sectors"
                  subtitle={`${yearA} vs ${yearB}`}
                  hint="Blue = Year A, Green = Year B"
                >
                  <ComparisonBarChart
                    data={compareSectorData}
                    labelA={yearA}
                    labelB={yearB}
                  />
                </ChartCard>
              </div>
            </div>
          )}

          {/* One year selected but no data */}
          {yearA && yearB && (!statsA || !statsB) && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4 text-sm text-amber-700 dark:text-amber-400">
              ⚠️ No graduate data found for one or both selected years.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function agg(rows: Graduate[], keyFn: (r: Graduate) => string) {
  const m = new Map<string, number>();
  rows.forEach((r) => { const k = keyFn(r); m.set(k, (m.get(k) ?? 0) + 1); });
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

