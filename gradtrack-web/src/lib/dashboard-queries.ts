"use server";

import { backendGetJson } from "@/lib/backend-api";

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
  skills: string[] | null;
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
  bySkill: { name: string; count: number }[];
  employmentRate: number;
};

// Throws BackendError — let the page handle it
export async function fetchDashboardData(): Promise<DashboardData> {
  const resp = await backendGetJson<BackendDashboardResponse>("/api/dashboard");
  return {
    graduates:        resp.graduates,
    totalCount:       resp.total_count,
    bySchool:         resp.by_school,
    byStatus:         resp.by_status,
    byYear:           resp.by_year,
    bySector:         resp.by_sector,
    byCampus:         resp.by_campus,
    byDepartment:     resp.by_department,
    byMonthsToEmploy: resp.by_months_to_employ,
    bySkill:          resp.by_skill,
    employmentRate:   resp.employment_rate,
  };
}

type BackendDashboardResponse = {
  graduates: Graduate[];
  total_count: number;
  by_school: { name: string; count: number }[];
  by_status: { name: string; count: number }[];
  by_year: { year: number; count: number; employed: number }[];
  by_sector: { name: string; count: number }[];
  by_campus: { name: string; count: number }[];
  by_department: { name: string; school: string; count: number }[];
  by_months_to_employ: { name: string; count: number }[];
  by_skill: { name: string; count: number }[];
  employment_rate: number;
};
