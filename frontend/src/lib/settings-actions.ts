"use server";

import { backendGetJson, backendSendJson } from "@/lib/backend-api";

export type DbStats = {
  totalGraduates: number;
  oldestRecord: string | null;
  newestRecord: string | null;
  schoolCount: number;
  programmeCount: number;
};

export async function fetchDbStats(): Promise<DbStats> {
  const resp = await backendGetJson<BackendDbStatsResponse>("/api/admin/stats");
  return {
    totalGraduates: resp.total_graduates,
    oldestRecord:   resp.oldest_record,
    newestRecord:   resp.newest_record,
    schoolCount:    resp.school_count,
    programmeCount: resp.programme_count,
  };
}

export async function purgeAllGraduates(): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const resp = await backendSendJson<{ success: boolean; deleted: number; error?: string }>(
      "/api/admin/graduates",
      "DELETE",
      undefined,
      { "x-confirm-purge": "YES" },
    );
    return resp;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { success: false, deleted: 0, error: message };
  }
}

type BackendDbStatsResponse = {
  total_graduates: number;
  oldest_record: string | null;
  newest_record: string | null;
  school_count: number;
  programme_count: number;
};
