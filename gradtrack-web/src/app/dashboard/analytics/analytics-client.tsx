"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/dashboard-queries";
import type { School as MustSchool } from "@/lib/must-queries";
import { EMPLOYED_STATUSES, shortSchool, shortDept, shortSector, shortProg } from "@/lib/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DashboardBarChart, DashboardPieChart, ComparisonBarChart } from "../charts";

function ChartCard({ title, subtitle, hint, children }: {
  title: string; subtitle?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 space-y-0.5">
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        {hint && <p className="text-[10px] text-muted-foreground/70 italic flex items-center gap-1"><span>💡</span> {hint}</p>}
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

const TABS = [
  { id: "rates", label: "Employment Rates", icon: "📊", desc: "% employed by school & dept" },
  { id: "programmes", label: "Programmes", icon: "📚", desc: "Top courses & their outcomes" },
  { id: "sectors", label: "Sectors & Employers", icon: "🏢", desc: "Where graduates work" },
  { id: "skills", label: "Skills", icon: "🛠️", desc: "In-demand skills from graduates" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AnalyticsClient({ data, mustSchools }: { data: DashboardData; mustSchools: MustSchool[] }) {
  const [compareSchool, setCompareSchool] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("rates");
  const [compareYearA, setCompareYearA] = useState("");
  const [compareYearB, setCompareYearB] = useState("");
  const grads = data.graduates;

  const uniqueYears = [...new Set(grads.map((r) => r.graduation_year))].sort((a, b) => b - a);

  const rateBySchool = useMemo(() => {
    const map = new Map<string, { total: number; employed: number }>();
    grads.forEach((r) => {
      const k = shortSchool(r.school_name);
      const e = map.get(k) ?? { total: 0, employed: 0 };
      e.total++;
      if (EMPLOYED_STATUSES.includes(r.employment_status as (typeof EMPLOYED_STATUSES)[number])) e.employed++;
      map.set(k, e);
    });
    return [...map.entries()]
      .map(([name, v]) => ({ name, count: v.total > 0 ? Math.round((v.employed / v.total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [grads]);

  const rateByDept = useMemo(() => {
    const rows = compareSchool ? grads.filter((r) => r.school_id === compareSchool) : grads;
    const map = new Map<string, { total: number; employed: number }>();
    rows.forEach((r) => {
      const k = shortDept(r.department_name);
      const e = map.get(k) ?? { total: 0, employed: 0 };
      e.total++;
      if (EMPLOYED_STATUSES.includes(r.employment_status as (typeof EMPLOYED_STATUSES)[number])) e.employed++;
      map.set(k, e);
    });
    return [...map.entries()]
      .map(([name, v]) => ({ name, count: v.total > 0 ? Math.round((v.employed / v.total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [grads, compareSchool]);

  const sectorForSchool = useMemo(() => {
    const rows = compareSchool ? grads.filter((r) => r.school_id === compareSchool && r.sector) : grads.filter((r) => r.sector);
    const map = new Map<string, number>();
    rows.forEach((r) => { const k = shortSector(r.sector!); map.set(k, (map.get(k) ?? 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [grads, compareSchool]);

  const topProgrammes = useMemo(() => {
    const rows = compareSchool ? grads.filter((r) => r.school_id === compareSchool) : grads;
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.programme_name, (map.get(r.programme_name) ?? 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name: shortProg(name), count })).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [grads, compareSchool]);

  const rateByProgramme = useMemo(() => {
    const rows = compareSchool ? grads.filter((r) => r.school_id === compareSchool) : grads;
    const map = new Map<string, { total: number; employed: number }>();
    rows.forEach((r) => {
      const k = shortProg(r.programme_name);
      const e = map.get(k) ?? { total: 0, employed: 0 };
      e.total++;
      if (EMPLOYED_STATUSES.includes(r.employment_status as (typeof EMPLOYED_STATUSES)[number])) e.employed++;
      map.set(k, e);
    });
    return [...map.entries()]
      .map(([name, v]) => ({ name, count: v.total > 0 ? Math.round((v.employed / v.total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [grads, compareSchool]);

  const topEmployers = useMemo(() => {
    const rows = compareSchool ? grads.filter((r) => r.school_id === compareSchool && r.employer_name) : grads.filter((r) => r.employer_name);
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.employer_name!, (map.get(r.employer_name!) ?? 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12);
  }, [grads, compareSchool]);

  const topSkills = useMemo(() => {
    const rows = compareSchool ? grads.filter((r) => r.school_id === compareSchool) : grads;
    const map = new Map<string, number>();
    rows.forEach((r) => r.skills?.forEach((s) => map.set(s, (map.get(s) ?? 0) + 1)));
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [grads, compareSchool]);

  const skillsByEmploymentRate = useMemo(() => {
    const rows = compareSchool ? grads.filter((r) => r.school_id === compareSchool) : grads;
    const map = new Map<string, { total: number; employed: number }>();
    rows.forEach((r) => {
      r.skills?.forEach((s) => {
        const e = map.get(s) ?? { total: 0, employed: 0 };
        e.total++;
        if (EMPLOYED_STATUSES.includes(r.employment_status as (typeof EMPLOYED_STATUSES)[number])) e.employed++;
        map.set(s, e);
      });
    });
    return [...map.entries()]
      .filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({ name, count: Math.round((v.employed / v.total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [grads, compareSchool]);

  const schoolLabel = compareSchool
    ? mustSchools.find((s) => s.id === compareSchool)?.name.match(/\(([^)]+)\)/)?.[1] ?? "Selected School"
    : "All Schools";

  // ── Year comparison for rates tab ─────────────────────────────────────────────
  function ratesByYear(year: string) {
    const base = compareSchool ? grads.filter((r) => r.school_id === compareSchool) : grads;
    const rows = year ? base.filter((r) => String(r.graduation_year) === year) : base;
    const map = new Map<string, { total: number; employed: number }>();
    rows.forEach((r) => {
      const k = shortDept(r.department_name);
      const e = map.get(k) ?? { total: 0, employed: 0 };
      e.total++;
      if (EMPLOYED_STATUSES.includes(r.employment_status as (typeof EMPLOYED_STATUSES)[number])) e.employed++;
      map.set(k, e);
    });
    return new Map([...map.entries()].map(([k, v]) => [k, v.total > 0 ? Math.round((v.employed / v.total) * 100) : 0]));
  }

  const yearComparisonDeptData = useMemo(() => {
    if (!compareYearA || !compareYearB) return [];
    const mapA = ratesByYear(compareYearA);
    const mapB = ratesByYear(compareYearB);
    const allDepts = [...new Set([...mapA.keys(), ...mapB.keys()])];
    return allDepts
      .map((name) => ({ name, a: mapA.get(name) ?? 0, b: mapB.get(name) ?? 0 }))
      .sort((x, y) => (y.a + y.b) - (x.a + x.b));
  }, [compareYearA, compareYearB, compareSchool, grads]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
        <span className="text-xs font-bold shrink-0">🏫 Compare by School:</span>
        <select value={compareSchool} onChange={(e) => setCompareSchool(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring min-w-0">
          <option value="">All Schools</option>
          {mustSchools.map((s) => (
            <option key={s.id} value={s.id}>{s.name.match(/\(([^)]+)\)/)?.[1] ?? s.name}</option>
          ))}
        </select>
        {compareSchool && (
          <button onClick={() => setCompareSchool("")} className="text-xs text-amber-600 hover:text-amber-500 font-medium">✕ Clear</button>
        )}
        <span className="text-muted-foreground/40 hidden sm:block">|</span>
        <span className="text-xs font-bold shrink-0">↔️ Compare Years:</span>
        <select value={compareYearA} onChange={(e) => setCompareYearA(e.target.value)}
          className="h-8 rounded-md border border-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 text-xs font-semibold text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0">
          <option value="">Year A</option>
          {uniqueYears.map((y) => (
            <option key={y} value={String(y)} disabled={String(y) === compareYearB}>{y}</option>
          ))}
        </select>
        <select value={compareYearB} onChange={(e) => setCompareYearB(e.target.value)}
          className="h-8 rounded-md border border-green-500 bg-green-50 dark:bg-green-950/30 px-2 text-xs font-semibold text-green-700 dark:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-0">
          <option value="">Year B</option>
          {uniqueYears.map((y) => (
            <option key={y} value={String(y)} disabled={String(y) === compareYearA}>{y}</option>
          ))}
        </select>
        {(compareYearA || compareYearB) && (
          <button onClick={() => { setCompareYearA(""); setCompareYearB(""); }} className="text-xs text-amber-600 hover:text-amber-500 font-medium">✕</button>
        )}
      </div>

      {/* Tab navigation cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-2.5 sm:p-4 transition-all text-center",
              activeTab === tab.id
                ? "border-amber-500/50 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/20"
                : "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/20",
            )}
          >
            <span className="text-xl sm:text-3xl">{tab.icon}</span>
            <span className={cn(
              "text-[10px] sm:text-sm font-bold leading-tight",
              activeTab === tab.id ? "text-amber-700 dark:text-amber-400" : "text-foreground",
            )}>{tab.label}</span>
            <span className="text-[8px] sm:text-[10px] text-muted-foreground leading-tight hidden sm:block">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "rates" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Employment Rate by School" subtitle="% of graduates employed per faculty" hint="Values show percentage — 100% means all graduates are employed">
              <DashboardBarChart data={rateBySchool} color="#16a34a" />
            </ChartCard>
            <ChartCard title={`Employment Rate by Department — ${schoolLabel}`} subtitle="% employed per department" hint="Select a school above to drill down into its departments">
              <DashboardBarChart data={rateByDept} layout="vertical" color="#3b82f6" height={Math.max(250, rateByDept.length * 36)} />
            </ChartCard>
          </div>
          {compareYearA && compareYearB && yearComparisonDeptData.length > 0 && (
            <ChartCard
              title={`Department Employment Rate — ${compareYearA} vs ${compareYearB}`}
              subtitle={schoolLabel !== "All Schools" ? `Filtered to ${schoolLabel}` : "All Schools"}
              hint="Blue = Year A, Green = Year B — compare how each department’s employment rate changed between cohorts"
            >
              <ComparisonBarChart
                data={yearComparisonDeptData}
                labelA={compareYearA}
                labelB={compareYearB}
                height={Math.max(300, yearComparisonDeptData.length * 40)}
              />
            </ChartCard>
          )}
        </div>
      )}

      {activeTab === "programmes" && (
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title={`Top Programmes — ${schoolLabel}`} subtitle="By graduate count" hint="Longer bar = more graduates enrolled in that programme">
            <DashboardBarChart data={topProgrammes} layout="vertical" color="#8b5cf6" height={Math.max(300, topProgrammes.length * 36)} />
          </ChartCard>
          <ChartCard title={`Employment Rate by Programme — ${schoolLabel}`} subtitle="% employed per programme" hint="Compare which programmes lead to better employment outcomes">
            <DashboardBarChart data={rateByProgramme} layout="vertical" color="#16a34a" height={Math.max(300, rateByProgramme.length * 36)} />
          </ChartCard>
        </div>
      )}

      {activeTab === "sectors" && (
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title={`Sector Distribution — ${schoolLabel}`} subtitle="Where graduates work" hint="Each slice = one industry sector. Hover for exact numbers">
            <DashboardPieChart data={sectorForSchool} />
          </ChartCard>
          <ChartCard title={`Top Employers — ${schoolLabel}`} subtitle="Most common employers" hint="Organizations that have hired the most MUST graduates">
            <DashboardBarChart data={topEmployers} layout="vertical" color="#f59e0b" height={Math.max(250, topEmployers.length * 36)} />
          </ChartCard>
        </div>
      )}

      {activeTab === "skills" && (
        <div className="space-y-4">
          {topSkills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed">
              <span className="text-4xl mb-3">🛠️</span>
              <p className="text-sm font-semibold text-foreground">No skills data yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Skills will appear here once graduates select them during registration.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <ChartCard
                title={`Most Common Skills — ${schoolLabel}`}
                subtitle="Skills reported by graduates"
                hint="Longer bar = more graduates have this skill"
              >
                <DashboardBarChart
                  data={topSkills}
                  layout="vertical"
                  color="#8b5cf6"
                  height={Math.max(300, topSkills.length * 36)}
                />
              </ChartCard>
              <ChartCard
                title={`Employment Rate by Skill — ${schoolLabel}`}
                subtitle="% employed among graduates with each skill (min. 3 graduates)"
                hint="Higher % = graduates with this skill are more likely to be employed"
              >
                <DashboardBarChart
                  data={skillsByEmploymentRate}
                  layout="vertical"
                  color="#16a34a"
                  height={Math.max(300, skillsByEmploymentRate.length * 36)}
                />
              </ChartCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


