"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/graduates", label: "Graduates", icon: "🎓" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
  { href: "/dashboard/upload", label: "Upload Data", icon: "📤" },
];

const BOTTOM_NAV = [
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

function isActive(href: string, pathname: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 border-r border-border bg-muted/30">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-500 bg-gradient-to-br from-green-700 to-green-900 text-[9px] font-black text-amber-400">
          MUST
        </div>
        <div className="leading-tight">
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400">GradTrack</p>
          <p className="text-[10px] text-muted-foreground">Committee</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col px-3 py-4">
        <div className="space-y-1">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href, pathname)} />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Separator + bottom items */}
        <div className="border-t border-border pt-3 mt-3 space-y-1">
          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href, pathname)} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          © {new Date().getFullYear()} Meru University of Science & Technology
        </p>
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: { href: string; label: string; icon: string }; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="text-base">{item.icon}</span>
      {item.label}
    </Link>
  );
}

/* Mobile bottom nav */
export function MobileNav() {
  const pathname = usePathname();
  const ALL_ITEMS = [...MAIN_NAV, ...BOTTOM_NAV];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-md py-2 lg:hidden">
      {ALL_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-0.5 text-[10px] transition-colors",
            isActive(item.href, pathname)
              ? "text-amber-600 dark:text-amber-400 font-semibold"
              : "text-muted-foreground",
          )}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
