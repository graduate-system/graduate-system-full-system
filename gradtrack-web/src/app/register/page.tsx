import { GraduateForm } from "./graduate-form";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { fetchSchools } from "@/lib/must-queries";

export const metadata = {
  title: "Graduate Registration | GradTrack Analytics — MUST",
  description:
    "Submit your graduate employment details to help Meru University track employability outcomes.",
};

export default async function RegisterPage() {
  const schools = await fetchSchools().catch(() => []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-500 bg-gradient-to-br from-green-700 to-green-900 text-xs font-black text-amber-400">
              MUST
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">GradTrack Analytics</p>
              <p className="text-[11px] text-muted-foreground">Meru University of Science &amp; Technology</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Committee Dashboard →
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Page header */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 dark:from-green-950 dark:via-green-900 dark:to-green-800 px-6 py-14 text-center">
        <span className="mb-3 inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
          🎓 Graduate Registration
        </span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Share Your Graduate Journey
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-green-100/75">
          Help MUST build a stronger employability picture. Your data is
          confidential and used only to improve career services and curriculum
          alignment for future graduates.
        </p>
        {/* Progress steps */}
        <div className="mx-auto mt-8 flex max-w-lg items-center justify-center gap-2">
          {["Personal Info", "Academic Details", "Employment"].map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300 ring-1 ring-amber-400/40">
                {i + 1}
              </div>
              <span className="hidden text-xs text-green-200/60 sm:block">{s}</span>
              {i < arr.length - 1 && <div className="h-px w-6 bg-white/15" />}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <main className="mx-auto max-w-3xl px-4 py-10 pb-20">
        <GraduateForm schools={schools} />
      </main>
    </div>
  );
}
