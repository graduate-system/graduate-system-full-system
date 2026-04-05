"use server";

import { supabase } from "@/lib/supabase";

export type Graduate = {
  id: number;
  created_at: string;
  full_name: string;
  student_number: string | null;
  email: string | null;
  phone: string | null;
  campus: string;
  school_id: string;
  department_id: string;
  programme_id: number;
  graduation_year: number;
  employment_status: string;
  employer_name: string | null;
  job_title: string | null;
  sector: string | null;
  employment_county: string | null;
  months_to_employ: string | null;
  linkedin_url: string | null;
  school_name: string;
  department_name: string;
  programme_name: string;
};

export type DashboardData = {
  graduates: Graduate[];
  totalCount: number;
  bySchool: { name: string; count: number }[];
  byStatus: { name: string; count: number }[];
  byYear: { year: number; count: number; employed: number }[];
  bySector: { name: string; count: number }[];
  byCampus: { name: string; count: number }[];
  byDepartment: { name: string; school: string; count: number }[];
  byMonthsToEmploy: { name: string; count: number }[];
  employmentRate: number;
};

export async function fetchDashboardData(): Promise<DashboardData> {
  const { data: graduates, error } = await supabase
    .from("graduates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Dashboard fetch error:", error);
    return emptyData();
  }

  const rows = (graduates ?? []) as Graduate[];
  const total = rows.length;

  if (total === 0) return emptyData();

  const employed = rows.filter((r) =>
    ["Employed (Full-time)", "Employed (Part-time)", "Self-employed / Entrepreneur", "Internship / Attachment"].includes(r.employment_status)
  );

  // By school
  const schoolMap = new Map<string, number>();
  rows.forEach((r) => schoolMap.set(r.school_name, (schoolMap.get(r.school_name) ?? 0) + 1));
  const bySchool = [...schoolMap.entries()]
    .map(([name, count]) => ({ name: shortSchool(name), count }))
    .sort((a, b) => b.count - a.count);

  // By status
  const statusMap = new Map<string, number>();
  rows.forEach((r) => statusMap.set(r.employment_status, (statusMap.get(r.employment_status) ?? 0) + 1));
  const byStatus = [...statusMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // By year with employment rate
  const yearMap = new Map<number, { count: number; employed: number }>();
  rows.forEach((r) => {
    const y = r.graduation_year;
    const entry = yearMap.get(y) ?? { count: 0, employed: 0 };
    entry.count++;
    if (employed.some((e) => e.id === r.id)) entry.employed++;
    yearMap.set(y, entry);
  });
  const byYear = [...yearMap.entries()]
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year - b.year);

  // By sector
  const sectorMap = new Map<string, number>();
  rows.forEach((r) => {
    if (r.sector) sectorMap.set(r.sector, (sectorMap.get(r.sector) ?? 0) + 1);
  });
  const bySector = [...sectorMap.entries()]
    .map(([name, count]) => ({ name: shortSector(name), count }))
    .sort((a, b) => b.count - a.count);

  // By campus
  const campusMap = new Map<string, number>();
  rows.forEach((r) => campusMap.set(r.campus, (campusMap.get(r.campus) ?? 0) + 1));
  const byCampus = [...campusMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // By department
  const deptMap = new Map<string, { school: string; count: number }>();
  rows.forEach((r) => {
    const key = r.department_name;
    const entry = deptMap.get(key) ?? { school: shortSchool(r.school_name), count: 0 };
    entry.count++;
    deptMap.set(key, entry);
  });
  const byDepartment = [...deptMap.entries()]
    .map(([name, v]) => ({ name: shortDept(name), ...v }))
    .sort((a, b) => b.count - a.count);

  // By months to employ
  const mteMap = new Map<string, number>();
  rows.forEach((r) => {
    if (r.months_to_employ) mteMap.set(r.months_to_employ, (mteMap.get(r.months_to_employ) ?? 0) + 1);
  });
  const byMonthsToEmploy = [...mteMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    graduates: rows,
    totalCount: total,
    bySchool,
    byStatus,
    byYear,
    bySector,
    byCampus,
    byDepartment,
    byMonthsToEmploy,
    employmentRate: total > 0 ? Math.round((employed.length / total) * 100) : 0,
  };
}

function emptyData(): DashboardData {
  return {
    graduates: [],
    totalCount: 0,
    bySchool: [],
    byStatus: [],
    byYear: [],
    bySector: [],
    byCampus: [],
    byDepartment: [],
    byMonthsToEmploy: [],
    employmentRate: 0,
  };
}

function shortSchool(name: string): string {
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1] : name;
}

function shortDept(name: string): string {
  return name.replace("Department of ", "");
}

function shortSector(name: string): string {
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1] : name.replace(" & ", " & ").substring(0, 25);
}
