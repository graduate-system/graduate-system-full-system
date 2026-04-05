import { fetchDashboardData } from "@/lib/dashboard-queries";
import { GraduatesPageClient } from "./graduates-client";
import { fetchSchools } from "@/lib/must-queries";
import { BackendErrorView } from "@/components/backend-error-view";

export const dynamic = "force-dynamic";

export default async function GraduatesPage() {
  let data;
  try {
    data = await fetchDashboardData();
  } catch (err) {
    return <BackendErrorView error={err} title="Could not load graduates data" />;
  }

  const schools = await fetchSchools().catch(() => []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Graduates</h1>
        <p className="text-sm text-muted-foreground">
          Search, filter, and explore all {data.totalCount.toLocaleString()} graduate records.
        </p>
      </div>
      <GraduatesPageClient graduates={data.graduates} mustSchools={schools} />
    </div>
  );
}
