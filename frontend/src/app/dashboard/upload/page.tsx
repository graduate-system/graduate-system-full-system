import { UploadClient } from "./upload-client";

export default function UploadPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Upload Data</h1>
        <p className="text-sm text-muted-foreground">
          Add graduate records manually or bulk-upload from a CSV file.
        </p>
      </div>
      <UploadClient />
    </div>
  );
}
