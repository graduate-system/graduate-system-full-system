import { logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export function DashboardHeader() {
  async function handleLogout() {
    "use server";
    await logout();
    redirect("/dashboard");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur-md px-6 gap-3">
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Home
        </Link>
        <Separator orientation="vertical" className="h-4" />
        <ThemeToggle />
        <form action={handleLogout}>
          <Button variant="outline" size="sm" type="submit">
            Logout
          </Button>
        </form>
      </div>
    </header>
  );
}
