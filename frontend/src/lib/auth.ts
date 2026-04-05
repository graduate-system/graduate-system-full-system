"use server";

import { backendGetJson, backendSendJson } from "@/lib/backend-api";

export async function isAuthenticated(): Promise<boolean> {
  try {
    const resp = await backendGetJson<{ authenticated: boolean }>("/api/committee/session");
    return resp.authenticated;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  await backendSendJson("/api/committee/logout", "POST").catch(() => {});
}

export async function changePin(
  currentPin: string,
  newPin: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    return await backendSendJson<{ success: boolean; error?: string }>(
      "/api/committee/pin",
      "POST",
      { current_pin: currentPin, new_pin: newPin } satisfies ChangePinRequest,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to change PIN.";
    return { success: false, error: message };
  }
}

type ChangePinRequest = { current_pin: string; new_pin: string };
