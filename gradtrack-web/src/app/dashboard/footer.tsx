export function DashboardFooter() {
  return (
    <footer className="border-t border-border bg-muted/20 px-6 py-4 mt-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-500/50 bg-gradient-to-br from-green-700 to-green-900 text-[7px] font-black text-amber-400">
            M
          </div>
          <p className="text-xs text-muted-foreground">
            GradTrack Analytics — Meru University of Science & Technology
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} MUST</span>
          <a href="https://www.must.ac.ke" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
            must.ac.ke
          </a>
          <a href="mailto:info@must.ac.ke" className="hover:text-foreground transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
