import { fetchDashboardData } from "@/lib/dashboard-queries";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const data = await fetchDashboardData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Compare graduate outcomes across schools, departments, programmes, and years.
        </p>
      </div>
      <AnalyticsClient data={data} />
    </div>
  );
}
