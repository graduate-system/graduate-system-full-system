import { fetchDashboardData } from "@/lib/dashboard-queries";
import { GraduatesPageClient } from "./graduates-client";

export default async function GraduatesPage() {
  const data = await fetchDashboardData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Graduates</h1>
        <p className="text-sm text-muted-foreground">
          Search, filter, and explore all {data.totalCount.toLocaleString()} graduate records.
        </p>
      </div>
      <GraduatesPageClient graduates={data.graduates} />
    </div>
  );
}
