"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { exportAnalyticsCsvAction } from "@/lib/analytics/actions";
import { Download, Loader2 } from "lucide-react";

export function CsvExportButton() {
  const [exporting, setExporting] = React.useState(false);
  const toast = useToast();

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportAnalyticsCsvAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="gap-2"
    >
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Export CSV
    </Button>
  );
}
