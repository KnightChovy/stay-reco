"use client";

import { FileSpreadsheet, LoaderCircle } from "lucide-react";
import type { PlatformReport } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import * as managerService from "@/services/manager.service";
import { useManagerMutation } from "../api/manager-queries";

function saveFile(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ExportReportButton({
  report,
  range,
}: {
  report: PlatformReport;
  range: { from: string; to: string };
}) {
  const mutation = useManagerMutation(() => managerService.exportPlatformReport({ report, ...range }), {
    invalidate: () => [],
    successMessage: "Đã xuất báo cáo Excel.",
    onSuccess: ({ file, fileName }) =>
      saveFile(file, fileName ?? `StayReco_${report}_${range.from}_${range.to}.xlsx`),
  });

  return (
    <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      {mutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <FileSpreadsheet aria-hidden />}
      {mutation.isPending ? "Đang xuất…" : "Xuất Excel"}
    </Button>
  );
}
