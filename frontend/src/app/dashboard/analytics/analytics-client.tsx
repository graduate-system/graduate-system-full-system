"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/dashboard-queries";
import { MUST_SCHOOLS } from "@/lib/must-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DashboardBarChart, DashboardPieChart } from "../charts";

const EMPLOYED_STATUSES = [
  "Employed (Full-time)",
  "Employed (Part-time)",
  "Self-employed / Entrepreneur",
  "Internship / Attachment",
] as const;

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
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AnalyticsClient({ data }: { data: DashboardData }) {
  const [compareSchool, setCompareSchool] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("rates");
  const grads = data.graduates;

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

  const schoolLabel = compareSchool
    ? MUST_SCHOOLS.find((s) => s.id === compareSchool)?.name.match(/\(([^)]+)\)/)?.[1] ?? "Selected School"
    : "All Schools";

  return (
    <div className="space-y-5">
      {/* School selector */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
        <span className="text-xs font-bold shrink-0">🏫 Compare by School:</span>
        <select value={compareSchool} onChange={(e) => setCompareSchool(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring min-w-0">
          <option value="">All Schools</option>
          {MUST_SCHOOLS.map((s) => (
            <option key={s.id} value={s.id}>{s.name.match(/\(([^)]+)\)/)?.[1] ?? s.name}</option>
          ))}
        </select>
        {compareSchool && (
          <button onClick={() => setCompareSchool("")} className="text-xs text-amber-600 hover:text-amber-500 font-medium">✕ Clear</button>
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
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Employment Rate by School" subtitle="% of graduates employed per faculty" hint="Values show percentage — 100% means all graduates are employed">
            <DashboardBarChart data={rateBySchool} color="#16a34a" />
          </ChartCard>
          <ChartCard title={`Employment Rate by Department — ${schoolLabel}`} subtitle="% employed per department" hint="Select a school above to drill down into its departments">
            <DashboardBarChart data={rateByDept} layout="vertical" color="#3b82f6" height={Math.max(250, rateByDept.length * 36)} />
          </ChartCard>
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
    </div>
  );
}

function shortSchool(n: string) { return n.match(/\(([^)]+)\)/)?.[1] ?? n; }
function shortDept(n: string) { return n.replace("Department of ", ""); }
function shortSector(n: string) { return n.match(/\(([^)]+)\)/)?.[1] ?? n.substring(0, 25); }
function shortProg(n: string) { return n.length > 40 ? n.substring(0, 37) + "…" : n; }
