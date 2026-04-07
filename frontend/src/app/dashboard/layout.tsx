import type { ReactNode } from "react";
import { isAuthenticated } from "@/lib/auth";
import { PinGate } from "./pin-gate";
import { AppSidebar } from "./sidebar";
import { DashboardHeader } from "./header";
import { DashboardFooter } from "./footer";

export const metadata = {
  title: "Committee Dashboard | GradTrack Analytics — MUST",
  description: "Graduate employability analytics dashboard for MUST committee members.",
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const authed = await isAuthenticated();

  if (!authed) {
    return <PinGate />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-h-screen flex-col pl-60">
        <DashboardHeader />
        <main className="flex-1 px-6 py-6">
          {children}
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
}
