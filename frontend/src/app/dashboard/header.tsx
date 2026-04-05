import { logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export function DashboardHeader() {
  async function handleLogout() {
    "use server";
    await logout();
    redirect("/dashboard");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Mobile brand (hidden on lg) */}
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-500 bg-gradient-to-br from-green-700 to-green-900 text-[9px] font-black text-amber-400">
            MUST
          </div>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">GradTrack</span>
        </Link>
        {/* Spacer on desktop */}
        <div className="hidden lg:block" />
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Home
          </Link>
          <ThemeToggle />
          <form action={handleLogout}>
            <Button variant="outline" size="sm" type="submit">
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
