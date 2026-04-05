import { fetchDbStats } from "@/lib/settings-actions";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const stats = await fetchDbStats();

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
