"use client";

import { FileSpreadsheet, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StatsRangeParams } from "@/services/partner.service";
import { useExportStats } from "../api/partner-queries";
import { usePartnerActions } from "../components";

/** Same file name part as the backend (stats-export.service `slug`): Vietnamese marks dropped, anything else `-`. */
function slug(name: string) {
  const ascii = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, (c) => (c === "đ" ? "d" : "D"));
  return (
    ascii
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "hotel"
  );
}

function saveFile(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked on the next tick: some browsers start the download after the click handler returns.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * "Xuất Excel" (docs/api/partner-dashboard.md §4.8): the workbook of the period shown on screen, so the file matches
 * the KPIs and the chart. Owner only, like every money figure.
 */
export function ExportExcelButton({
  hotelId,
  hotelName,
  range,
}: {
  hotelId: string;
  hotelName: string;
  /** Undefined while the custom period is invalid: nothing to export yet. */
  range: Required<StatsRangeParams> | undefined;
}) {
  const { showNotice } = usePartnerActions();
  const exportStats = useExportStats(hotelId);

  const onExport = () => {
    if (!range) return;
    exportStats.mutate(range, {
      onSuccess: ({ file, fileName }) => {
        saveFile(
          file,
          // The Content-Disposition header is not readable cross-origin unless the API exposes it.
          fileName ?? `StayReco_${slug(hotelName)}_${range.from}_${range.to}.xlsx`,
        );
        showNotice("Đã xuất báo cáo Excel.");
      },
    });
  };

  return (
    <Button
      size="sm"
      disabled={!range || exportStats.isPending}
      onClick={onExport}
    >
      {exportStats.isPending ? (
        <LoaderCircle className="animate-spin" aria-hidden />
      ) : (
        <FileSpreadsheet aria-hidden />
      )}
      {exportStats.isPending ? "Đang xuất…" : "Xuất Excel"}
    </Button>
  );
}
