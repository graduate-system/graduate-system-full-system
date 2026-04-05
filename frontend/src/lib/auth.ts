"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "committee_auth";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getPin() {
  return process.env.COMMITTEE_PIN || "123456";
}

export async function verifyPin(pin: string): Promise<{ success: boolean; error?: string }> {
  if (!pin || pin.trim().length === 0) {
    return { success: false, error: "Please enter the committee PIN." };
  }

  if (pin.trim() !== getPin()) {
    return { success: false, error: "Incorrect PIN. Please try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/dashboard",
  });

  return { success: true };
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "authenticated";
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function changePin(
  currentPin: string,
  newPin: string,
): Promise<{ success: boolean; error?: string }> {
  if (currentPin.trim() !== getPin()) {
    return { success: false, error: "Current PIN is incorrect." };
  }
  if (!newPin || newPin.trim().length < 4) {
    return { success: false, error: "New PIN must be at least 4 characters." };
  }
  // In production you'd persist this — for now we update the env at runtime
  process.env.COMMITTEE_PIN = newPin.trim();
  return { success: true };
}
