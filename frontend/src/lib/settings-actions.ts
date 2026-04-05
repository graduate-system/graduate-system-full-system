"use server";

import { supabase } from "@/lib/supabase";

export type DbStats = {
  totalGraduates: number;
  oldestRecord: string | null;
  newestRecord: string | null;
  schoolCount: number;
  programmeCount: number;
};

export async function fetchDbStats(): Promise<DbStats> {
  const { count } = await supabase
    .from("graduates")
    .select("*", { count: "exact", head: true });

  const { data: oldest } = await supabase
    .from("graduates")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const { data: newest } = await supabase
    .from("graduates")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: schools } = await supabase
    .from("graduates")
    .select("school_id")
    .limit(1000);

  const { data: progs } = await supabase
    .from("graduates")
    .select("programme_id")
    .limit(1000);

  return {
    totalGraduates: count ?? 0,
    oldestRecord: oldest?.created_at ?? null,
    newestRecord: newest?.created_at ?? null,
    schoolCount: new Set(schools?.map((r) => r.school_id)).size,
    programmeCount: new Set(progs?.map((r) => r.programme_id)).size,
  };
}

export async function purgeAllGraduates(): Promise<{ success: boolean; deleted: number; error?: string }> {
  const { count } = await supabase
    .from("graduates")
    .select("*", { count: "exact", head: true });

  const { error } = await supabase
    .from("graduates")
    .delete()
    .neq("id", 0); // delete all rows

  if (error) {
    return { success: false, deleted: 0, error: error.message };
  }

  return { success: true, deleted: count ?? 0 };
}
