import { fetchDashboardData } from "@/lib/dashboard-queries";
import { DashboardOverview } from "./dashboard-client";

export default async function DashboardPage() {
  const data = await fetchDashboardData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Real-time insights into MUST graduate employability outcomes.
          {data.totalCount > 0 && (
            <span className="ml-1 font-medium text-foreground">
              {data.totalCount.toLocaleString()} graduates tracked.
            </span>
          )}
        </p>
      </div>
      <DashboardOverview data={data} />
    </div>
  );
}
