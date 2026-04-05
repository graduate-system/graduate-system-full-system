import { fetchDbStats } from "@/lib/settings-actions";
import { SettingsClient } from "./settings-client";
import { BackendErrorView } from "@/components/backend-error-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let stats;
  try {
    stats = await fetchDbStats();
  } catch (err) {
    return <BackendErrorView error={err} title="Could not load settings data" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage security, data, appearance, and system configuration.
        </p>
      </div>
      <SettingsClient initialStats={stats} />
    </div>
  );
}
