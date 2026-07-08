import { BulkImporter } from "@/components/admin/BulkImporter";

export const metadata = { title: "Bulk Upload" };

export default function BulkUploadPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Bulk Upload</h1>
        <p className="mt-2 text-sm text-stone">
          Bring in the back catalog from a spreadsheet: upload a CSV, map the columns, fix anything flagged, and land
          everything safely in Drafts. Best on a desktop.
        </p>
      </header>
      <BulkImporter />
    </div>
  );
}
