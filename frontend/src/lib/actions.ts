"use server";

import { supabase } from "@/lib/supabase";
import { MUST_SCHOOLS } from "@/lib/must-data";

export type GraduatePayload = {
  full_name: string;
  student_number?: string;
  email?: string;
  phone?: string;
  campus: string;
  school: string;       // school id (e.g. "sci")
  department: string;   // department id (e.g. "cs")
  programme: string;    // programme name string from the form
  graduation_year: string;
  employment_status: string;
  employer_name?: string;
  job_title?: string;
  sector?: string;
  employment_county?: string;
  months_to_employ?: string;
  linkedin_url?: string;
};

export type SubmitResult =
  | { success: true; id: number }
  | { success: false; error: string };

export type BulkResult = {
  inserted: number;
  failed: { row: number; error: string }[];
};

/** Resolve a single payload into a DB-ready row. Returns the row or an error string. */
async function resolveRow(payload: GraduatePayload) {
  const school = MUST_SCHOOLS.find((s) => s.id === payload.school);
  if (!school) return "Invalid school";

  const department = school.departments.find((d) => d.id === payload.department);
  if (!department) return "Invalid department";

  if (!department.programmes.includes(payload.programme as never)) {
    return "Invalid programme";
  }

  const { data: prog, error: progErr } = await supabase
    .from("programmes")
    .select("id")
    .eq("department_id", payload.department)
    .eq("name", payload.programme)
    .single();

  if (progErr || !prog) return "Could not resolve programme";

  return {
    full_name:         payload.full_name,
    student_number:    payload.student_number || null,
    email:             payload.email || null,
    phone:             payload.phone || null,
    campus:            payload.campus,
    school_id:         payload.school,
    department_id:     payload.department,
    programme_id:      prog.id,
    graduation_year:   parseInt(payload.graduation_year, 10),
    employment_status: payload.employment_status,
    employer_name:     payload.employer_name || null,
    job_title:         payload.job_title || null,
    sector:            payload.sector || null,
    employment_county: payload.employment_county || null,
    months_to_employ:  payload.months_to_employ || null,
    linkedin_url:      payload.linkedin_url || null,
    school_name:       school.name,
    department_name:   department.name,
    programme_name:    payload.programme,
  };
}

export async function submitGraduate(payload: GraduatePayload): Promise<SubmitResult> {
  try {
    const row = await resolveRow(payload);
    if (typeof row === "string") return { success: false, error: row };

    const { data, error } = await supabase
      .from("graduates")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error("submitGraduate unexpected error:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function bulkInsertGraduates(payloads: GraduatePayload[]): Promise<BulkResult> {
  const result: BulkResult = { inserted: 0, failed: [] };

  // Resolve all rows, collecting successes and failures
  const resolved: { idx: number; row: Record<string, unknown> }[] = [];
  for (let i = 0; i < payloads.length; i++) {
    const r = await resolveRow(payloads[i]);
    if (typeof r === "string") {
      result.failed.push({ row: i + 1, error: r });
    } else {
      resolved.push({ idx: i, row: r });
    }
  }

  if (resolved.length === 0) return result;

  // Batch insert in chunks of 100
  const CHUNK = 100;
  for (let i = 0; i < resolved.length; i += CHUNK) {
    const chunk = resolved.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("graduates")
      .insert(chunk.map((c) => c.row));

    if (error) {
      chunk.forEach((c) => result.failed.push({ row: c.idx + 1, error: error.message }));
    } else {
      result.inserted += chunk.length;
    }
  }

  return result;
}
