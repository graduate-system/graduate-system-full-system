import type { ReactNode } from "react";
import { isAuthenticated } from "@/lib/auth";
import { PinGate } from "./pin-gate";
import { Sidebar, MobileNav } from "./sidebar";
import { DashboardHeader } from "./header";
import { DashboardFooter } from "./footer";

export const metadata = {
  title: "Committee Dashboard | GradTrack Analytics — MUST",
  description: "Graduate employability analytics dashboard for MUST committee members.",
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const authed = await isAuthenticated();

  if (!authed) {
    return <PinGate />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-56">
        <DashboardHeader />
        <main className="flex-1 px-4 py-6 sm:px-6 pb-20 lg:pb-6">
          {children}
        </main>
        <DashboardFooter />
      </div>
      <MobileNav />
    </div>
  );
}
