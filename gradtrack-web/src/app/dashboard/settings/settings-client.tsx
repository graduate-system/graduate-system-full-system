"use client";

import { useState, useTransition, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { changePin, logout } from "@/lib/auth";
import { purgeAllGraduates, type DbStats } from "@/lib/settings-actions";

type SectionId = "security" | "registration" | "data" | "appearance" | "about";

const SECTIONS = [
  { id: "security" as const, icon: "🔐", label: "Security" },
  { id: "registration" as const, icon: "📋", label: "Registration" },
  { id: "data" as const, icon: "🗄️", label: "Data Management" },
  { id: "appearance" as const, icon: "🎨", label: "Appearance" },
  { id: "about" as const, icon: "ℹ️", label: "About" },
];

export function SettingsClient({ initialStats }: { initialStats: DbStats }) {
  const [active, setActive] = useState<SectionId>("security");

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Section nav */}
      <nav className="flex lg:flex-col gap-1.5 lg:w-48 shrink-0 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors",
              active === s.id
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="text-base">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {active === "security" && <SecuritySection />}
        {active === "registration" && <RegistrationSection />}
        {active === "data" && <DataSection initialStats={initialStats} />}
        {active === "appearance" && <AppearanceSection />}
        {active === "about" && <AboutSection stats={initialStats} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   🔐 SECURITY
   ═══════════════════════════════════════════════════════ */
function SecuritySection() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleChangePin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const current = fd.get("current_pin") as string;
    const newPin = fd.get("new_pin") as string;
    const confirm = fd.get("confirm_pin") as string;

    if (newPin !== confirm) {
      setResult({ ok: false, msg: "New PIN and confirmation do not match." });
      return;
    }

    startTransition(async () => {
      const res = await changePin(current, newPin);
      if (res.success) {
        setResult({ ok: true, msg: "PIN changed successfully. Use the new PIN on next login." });
        formRef.current?.reset();
      } else {
        setResult({ ok: false, msg: res.error ?? "Failed to change PIN." });
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Change PIN */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">🔑 Change Committee PIN</CardTitle>
          <CardDescription>Update the shared PIN used to access this dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleChangePin} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Current PIN</Label>
              <Input name="current_pin" type="password" placeholder="Enter current PIN" required autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">New PIN</Label>
              <Input name="new_pin" type="password" placeholder="At least 4 characters" required minLength={4} autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Confirm New PIN</Label>
              <Input name="confirm_pin" type="password" placeholder="Re-enter new PIN" required minLength={4} autoComplete="off" />
            </div>
            {result && (
              <p className={cn("text-xs font-medium", result.ok ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                {result.ok ? "✅" : "❌"} {result.msg}
              </p>
            )}
            <Button type="submit" disabled={isPending} size="sm">
              {isPending ? "Updating…" : "Update PIN"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Session info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">🕐 Session</CardTitle>
          <CardDescription>Your current authentication session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Active Session</span>
            <Badge variant="secondary" className="text-[10px]">8-hour expiry</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Sessions are stored as HTTP-only cookies scoped to /dashboard. They expire after 8 hours of inactivity.
          </p>
          <Separator />
          {!showLogoutConfirm ? (
            <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowLogoutConfirm(true)}>
              End Session (Logout)
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Are you sure?</span>
              <Button variant="destructive" size="sm" className="text-xs" onClick={handleLogout} disabled={isPending}>
                {isPending ? "Logging out…" : "Yes, Logout"}
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   📋 REGISTRATION
   ═══════════════════════════════════════════════════════ */
function RegistrationSection() {
  const [copied, setCopied] = useState(false);
  const regUrl = typeof window !== "undefined"
    ? `${window.location.origin}/register`
    : "/register";

  function copyLink() {
    navigator.clipboard.writeText(regUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Share link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">🔗 Registration Link</CardTitle>
          <CardDescription>Share this link with graduates so they can self-register.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={regUrl} readOnly className="text-xs font-mono bg-muted/50" />
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 text-xs">
              {copied ? "✅ Copied!" : "📋 Copy"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(regUrl, "_blank")}>
              🔗 Open in New Tab
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => {
              const mailto = `mailto:?subject=${encodeURIComponent("MUST Graduate Tracer Survey")}&body=${encodeURIComponent(`Dear Graduate,\n\nPlease complete the MUST Graduate Tracer Survey:\n${regUrl}\n\nThank you,\nMUST Committee`)}`;
              window.open(mailto);
            }}>
              ✉️ Share via Email
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => {
              const waUrl = `https://wa.me/?text=${encodeURIComponent(`MUST Graduate Tracer Survey — Please fill in your details: ${regUrl}`)}`;
              window.open(waUrl, "_blank");
            }}>
              💬 Share via WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">📱 QR Code</CardTitle>
          <CardDescription>Print or display this QR code at events for quick access.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <div className="rounded-xl border bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(regUrl)}&color=1a5c2a&bgcolor=ffffff`}
              alt="Registration QR Code"
              width={200}
              height={200}
              className="rounded"
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center max-w-xs">
            Scan with any phone camera to open the registration form. Perfect for graduation ceremonies, career fairs, and alumni events.
          </p>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => {
            const link = document.createElement("a");
            link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(regUrl)}&color=1a5c2a&bgcolor=ffffff`;
            link.download = "MUST_GradTrack_QR.png";
            link.click();
          }}>
            📥 Download QR (High-Res)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   🗄️ DATA MANAGEMENT
   ═══════════════════════════════════════════════════════ */
function DataSection({ initialStats }: { initialStats: DbStats }) {
  const [isPending, startTransition] = useTransition();
  const [purgeStep, setPurgeStep] = useState<"idle" | "confirm" | "typing">("idle");
  const [confirmText, setConfirmText] = useState("");
  const [purgeResult, setPurgeResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  function handlePurge() {
    startTransition(async () => {
      const res = await purgeAllGraduates();
      if (res.success) {
        setPurgeResult({ ok: true, msg: `Successfully deleted ${res.deleted} records.` });
        setPurgeStep("idle");
        setConfirmText("");
        router.refresh();
      } else {
        setPurgeResult({ ok: false, msg: res.error ?? "Purge failed." });
      }
    });
  }

  function exportFullDb() {
    // Trigger the graduates page CSV export by navigating
    window.open("/dashboard/graduates", "_blank");
  }

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="space-y-5">
      {/* DB Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">📊 Database Overview</CardTitle>
          <CardDescription>Current state of the graduate records database.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatBox label="Total Records" value={initialStats.totalGraduates.toLocaleString()} icon="🎓" />
            <StatBox label="Schools Represented" value={String(initialStats.schoolCount)} icon="🏫" />
            <StatBox label="Programmes" value={String(initialStats.programmeCount)} icon="📚" />
            <StatBox label="First Record" value={fmt(initialStats.oldestRecord)} icon="📅" small />
            <StatBox label="Latest Record" value={fmt(initialStats.newestRecord)} icon="🕐" small />
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">📥 Export Data</CardTitle>
          <CardDescription>Download all graduate records for offline analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Go to the Graduates page to use the CSV export with filters. You can export all records or a filtered subset.
          </p>
          <Button variant="outline" size="sm" className="text-xs" onClick={exportFullDb}>
            📥 Open Graduates Page (Export)
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">⚠️ Danger Zone</CardTitle>
          <CardDescription>Irreversible actions. Proceed with extreme caution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-destructive">Purge All Graduate Records</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This will permanently delete all {initialStats.totalGraduates.toLocaleString()} graduate records from the database. This action cannot be undone.
              </p>
            </div>

            {purgeStep === "idle" && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setPurgeStep("confirm")}
                disabled={initialStats.totalGraduates === 0}
              >
                🗑️ Purge All Data
              </Button>
            )}

            {purgeStep === "confirm" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-destructive">
                  Are you absolutely sure? This will delete {initialStats.totalGraduates} records permanently.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" className="text-xs" onClick={() => setPurgeStep("typing")}>
                    Yes, I understand
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPurgeStep("idle")}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {purgeStep === "typing" && (
              <div className="space-y-2">
                <p className="text-xs text-destructive font-medium">
                  Type <span className="font-mono bg-destructive/10 px-1.5 py-0.5 rounded">DELETE ALL</span> to confirm:
                </p>
                <div className="flex gap-2 max-w-xs">
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE ALL"
                    className="text-xs font-mono border-destructive/30"
                    autoFocus
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs shrink-0"
                    disabled={confirmText !== "DELETE ALL" || isPending}
                    onClick={handlePurge}
                  >
                    {isPending ? "Deleting…" : "Confirm Purge"}
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setPurgeStep("idle"); setConfirmText(""); }}>
                  Cancel
                </Button>
              </div>
            )}

            {purgeResult && (
              <p className={cn("text-xs font-medium", purgeResult.ok ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                {purgeResult.ok ? "✅" : "❌"} {purgeResult.msg}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   🎨 APPEARANCE
   ═══════════════════════════════════════════════════════ */
function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light", label: "Light", icon: "☀️", desc: "Clean white background" },
    { id: "dark", label: "Dark", icon: "🌙", desc: "Easy on the eyes at night" },
    { id: "system", label: "System", icon: "💻", desc: "Match your OS preference" },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">🎨 Theme</CardTitle>
          <CardDescription>Choose how the dashboard looks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  theme === t.id
                    ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <span className="text-3xl">{t.icon}</span>
                <span className={cn("text-sm font-bold", theme === t.id ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>{t.label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">{t.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">🖼️ Color Preview</CardTitle>
          <CardDescription>Current theme color palette.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[
              { name: "BG", cls: "bg-background border" },
              { name: "Card", cls: "bg-card border" },
              { name: "Muted", cls: "bg-muted" },
              { name: "Primary", cls: "bg-primary" },
              { name: "MUST Green", cls: "bg-must-green" },
              { name: "MUST Gold", cls: "bg-must-gold" },
              { name: "Destructive", cls: "bg-destructive" },
              { name: "Accent", cls: "bg-accent border" },
            ].map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-1">
                <div className={cn("h-8 w-full rounded-md", c.cls)} />
                <span className="text-[8px] text-muted-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ℹ️ ABOUT
   ═══════════════════════════════════════════════════════ */
function AboutSection({ stats }: { stats: DbStats }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="text-center pb-3">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500 bg-gradient-to-br from-green-700 to-green-900 text-xl font-black text-amber-400">
            MUST
          </div>
          <CardTitle className="text-lg">GradTrack Analytics</CardTitle>
          <CardDescription>Graduate Employability Tracking System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border divide-y divide-border">
            <InfoRow label="Institution" value="Meru University of Science & Technology" />
            <InfoRow label="System" value="GradTrack Analytics Dashboard" />
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="Framework" value="Next.js 15 + React 19" />
            <InfoRow label="Database" value="Supabase (PostgreSQL)" />
            <InfoRow label="Records" value={`${stats.totalGraduates.toLocaleString()} graduates`} />
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Links</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "🏠 MUST Website", href: "https://www.must.ac.ke" },
                { label: "📋 Registration Form", href: "/register" },
                { label: "📊 Dashboard", href: "/dashboard" },
                { label: "✉️ Contact ICT", href: "mailto:info@must.ac.ke" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                  className="inline-flex items-center h-7 px-3 rounded-md border border-input bg-background text-[11px] font-medium hover:bg-muted transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <Separator />

          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            Built for the MUST Graduate Employability Committee.
            <br />
            © {new Date().getFullYear()} Meru University of Science & Technology. All rights reserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Small helpers ── */
function StatBox({ label, value, icon, small }: { label: string; value: string; icon: string; small?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={cn("font-bold tracking-tight", small ? "text-xs" : "text-lg")}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-right">{value}</span>
    </div>
  );
}
