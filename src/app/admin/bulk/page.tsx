import { BulkTabs } from "@/components/admin/BulkTabs";

export const metadata = { title: "Bulk Upload" };

export default function BulkUploadPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Bulk Upload</h1>
        <p className="mt-2 text-sm text-stone">
          Bring in the back catalog from a spreadsheet or folders of audio and artwork.
          Everything lands safely as draft or published releases. Best on a desktop.
        </p>
      </header>
      <BulkTabs />
    </div>
  );
}
