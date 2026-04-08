import { fetchDashboardData } from "@/lib/dashboard-queries";
import { AnalyticsClient } from "./analytics-client";
import { fetchSchools } from "@/lib/must-queries";
import { BackendErrorView } from "@/components/backend-error-view";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  let data;
  try {
    data = await fetchDashboardData();
  } catch (err) {
    return <BackendErrorView error={err} title="Could not load analytics data" />;
  }

  const schools = await fetchSchools().catch(() => []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Compare graduate outcomes across schools, departments, programmes, and years.
        </p>
      </div>
      <AnalyticsClient data={data} mustSchools={schools} />
    </div>
  );
}
