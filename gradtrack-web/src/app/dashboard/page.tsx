import { fetchDashboardData } from "@/lib/dashboard-queries";
import { DashboardOverview } from "./dashboard-client";
import { fetchSchools } from "@/lib/must-queries";
import { BackendErrorView } from "@/components/backend-error-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data;
  try {
    data = await fetchDashboardData();
  } catch (err) {
    return <BackendErrorView error={err} title="Could not load dashboard data" />;
  }

  const schools = await fetchSchools().catch(() => []);

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
      <DashboardOverview data={data} mustSchools={schools} />
    </div>
  );
}
