import { UploadClient } from "./upload-client";
import { fetchSchools } from "@/lib/must-queries";
import { BackendErrorView } from "@/components/backend-error-view";

export default async function UploadPage() {
  let schools;
  try {
    schools = await fetchSchools();
  } catch (err) {
    return <BackendErrorView error={err} title="Could not load school data" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Upload Data</h1>
        <p className="text-sm text-muted-foreground">
          Add graduate records manually or bulk-upload from a CSV file.
        </p>
      </div>
      <UploadClient mustSchools={schools} />
    </div>
  );
}
