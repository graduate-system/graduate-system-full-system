"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, GraduationCap, BarChart3,
  Upload, FileText, Settings, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const MAIN_NAV = [
  { href: "/dashboard",           label: "Overview",    icon: LayoutDashboard },
  { href: "/dashboard/graduates", label: "Graduates",   icon: GraduationCap   },
  { href: "/dashboard/analytics", label: "Analytics",   icon: BarChart3       },
  { href: "/dashboard/upload",    label: "Upload Data", icon: Upload          },
  { href: "/dashboard/reports",   label: "Reports",     icon: FileText        },
] as const;

function isActive(href: string, pathname: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function NavItem({ href, label, icon: Icon, active, badge, external }: {
  href: string; label: string; icon: React.ElementType;
  active?: boolean; badge?: React.ReactNode; external?: boolean;
}) {
  const cls = cn(
    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
    active
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
  );
  const iconCls = cn(
    "h-4 w-4 shrink-0 transition-colors",
    active
      ? "text-amber-500"
      : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
  );
  const inner = (
    <>
      <Icon className={iconCls} />
      <span className="flex-1 truncate">{label}</span>
      {badge}
    </>
  );

  if (external) {
    return <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
  }
  return <Link href={href} className={cls}>{inner}</Link>;
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar border-r border-sidebar-border">

      {/* Brand header */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border shrink-0">
        <Avatar className="h-8 w-8 rounded-lg border-2 border-amber-500 bg-gradient-to-br from-green-700 to-green-900">
          <AvatarFallback className="rounded-lg bg-transparent text-[9px] font-black text-amber-400">
            MUST
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 truncate">GradTrack</span>
          <span className="text-[10px] text-sidebar-foreground/50 truncate">Committee Portal</span>
        </div>
      </div>

      {/* Scrollable nav */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4 gap-6">

        {/* Main nav */}
        <div className="space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Navigation
          </p>
          {MAIN_NAV.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href, pathname)}
              badge={item.href === "/dashboard/reports" ? (
                <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-0 font-semibold">
                  AI
                </Badge>
              ) : undefined}
            />
          ))}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Quick links */}
        <div className="space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Quick Links
          </p>
          <NavItem
            href="/register"
            label="Registration Form"
            icon={ExternalLink}
            external
          />
        </div>
      </div>

      {/* Footer: settings + user */}
      <div className="shrink-0 border-t border-sidebar-border px-3 py-3 space-y-0.5">
        <NavItem
          href="/dashboard/settings"
          label="Settings"
          icon={Settings}
          active={isActive("/dashboard/settings", pathname)}
        />

        {/* User pill */}
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <Avatar className="h-7 w-7 rounded-lg bg-gradient-to-br from-green-700 to-green-900">
            <AvatarFallback className="rounded-lg bg-transparent text-[10px] font-bold text-white">
              CM
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-semibold text-sidebar-foreground truncate">Committee Member</span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate">MUST GradTrack</span>
          </div>
        </div>
      </div>

    </aside>
  );
}
