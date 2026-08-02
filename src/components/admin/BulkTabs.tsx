"use client";

import { useState } from "react";
import { BulkImporter } from "@/components/admin/BulkImporter";
import { FolderImporter } from "@/components/admin/FolderImporter";
import { cn } from "@/lib/utils";

export function BulkTabs() {
  const [tab, setTab] = useState<"csv" | "folder">("csv");

  return (
    <div>
      <div className="border-b border-line mb-8 flex gap-6">
        <button
          onClick={() => setTab("csv")}
          className={cn(
            "pb-3 text-xs uppercase tracking-[0.2em] font-medium transition-colors border-b-2 outline-none",
            tab === "csv" ? "border-gold text-cream" : "border-transparent text-stone hover:text-sand"
          )}
        >
          Spreadsheet (CSV)
        </button>
        <button
          onClick={() => setTab("folder")}
          className={cn(
            "pb-3 text-xs uppercase tracking-[0.2em] font-medium transition-colors border-b-2 outline-none",
            tab === "folder" ? "border-gold text-cream" : "border-transparent text-stone hover:text-sand"
          )}
        >
          Folders of Files
        </button>
      </div>

      {tab === "csv" ? <BulkImporter /> : <FolderImporter />}
    </div>
  );
}
