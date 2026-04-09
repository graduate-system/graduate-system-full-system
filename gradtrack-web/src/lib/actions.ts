"use server";

import { backendSendJson } from "@/lib/backend-api";

export type GraduatePayload = {
  full_name: string;
  student_number?: string;
  email?: string;
  phone?: string;
  campus: string;
  school: string;
  department: string;
  programme: string;
  graduation_year: string;
  employment_status: string;
  employer_name?: string;
  job_title?: string;
  sector?: string;
  employment_county?: string;
  months_to_employ?: string;
  linkedin_url?: string;
  skills?: string[];
};

export type SubmitResult =
  | { success: true; id: number }
  | { success: false; error: string };

export type BulkResult = {
  inserted: number;
  failed: { row: number; error: string }[];
};

export async function submitGraduate(payload: GraduatePayload): Promise<SubmitResult> {
  try {
    return await backendSendJson<{ success: true; id: number } | { success: false; error: string }>(
      "/api/graduates",
      "POST",
      payload,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
    return { success: false, error: message };
  }
}

export async function bulkInsertGraduates(payloads: GraduatePayload[]): Promise<BulkResult> {
  try {
    return await backendSendJson<BulkResult>("/api/graduates/bulk", "POST", payloads);
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
    return { inserted: 0, failed: payloads.map((_, i) => ({ row: i + 1, error: message })) };
  }
}
