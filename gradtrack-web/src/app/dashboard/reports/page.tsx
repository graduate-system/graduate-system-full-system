import { fetchSchools } from "@/lib/must-queries";
import { ReportsClient } from "./reports-client";
import { BackendErrorView } from "@/components/backend-error-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  let schools;
  try {
    schools = await fetchSchools();
  } catch (err) {
    return <BackendErrorView error={err} title="Could not load school data" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate AI-powered graduate employability reports. Filter by school, department,
          programme, year, and more — then download as PDF or Excel.
        </p>
      </div>
      <ReportsClient schools={schools} />
    </div>
  );
}
