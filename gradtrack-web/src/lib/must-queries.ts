"use server";

import { backendGetJson } from "@/lib/backend-api";

export type School = { id: string; name: string };
export type Department = { id: string; name: string };
export type Programme = string;

export async function fetchSchools(): Promise<School[]> {
  const resp = await backendGetJson<{ schools: School[] }>("/api/metadata/schools");
  return resp.schools;
}

export async function fetchDepartments(schoolId: string): Promise<Department[]> {
  const resp = await backendGetJson<{ departments: Department[] }>(
    `/api/metadata/departments?school_id=${encodeURIComponent(schoolId)}`
  );
  return resp.departments;
}

export async function fetchProgrammes(schoolId: string, departmentId: string): Promise<Programme[]> {
  const resp = await backendGetJson<{ programmes: Programme[] }>(
    `/api/metadata/programmes?school_id=${encodeURIComponent(schoolId)}&department_id=${encodeURIComponent(departmentId)}`
  );
  return resp.programmes;
}
