"use client";

import { format } from "date-fns";
import { Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "./PartnerUi";

/**
 * Save bar of a long form: it appears only while the form has unsaved changes and sticks to the bottom of the
 * viewport, so saving never needs a scroll back. Put it as the last child of the `<form>`.
 */
export function StickySaveBar({
  changes,
  pending,
  onDiscard,
  submitLabel = "Lưu thay đổi",
}: {
  /** Number of changed fields; 0 hides the bar. */
  changes: number;
  pending: boolean;
  onDiscard: () => void;
  submitLabel?: string;
}) {
  if (changes === 0 && !pending) return null;

  return (
    <div
      role="region"
      aria-label="Thay đổi chưa lưu"
      className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border border-primary/20 bg-card/95 p-3 shadow-[0_8px_30px_rgb(32_43_54/12%)] backdrop-blur sm:flex-row sm:items-center"
    >
      <p className="flex flex-1 items-center gap-2 text-sm font-semibold text-foreground" aria-live="polite">
        <span className="size-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />
        {pending ? "Đang lưu..." : `Có ${changes} thay đổi chưa lưu`}
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onDiscard} disabled={pending}>
          <Undo2 />
          Huỷ thay đổi
        </Button>
        <SubmitButton pending={pending}>
          <Save />
          {submitLabel}
        </SubmitButton>
      </div>
    </div>
  );
}

/** Success notice of a save, with the time it was stored. */
export function savedMessage(what: string) {
  return `Đã lưu ${what} lúc ${format(new Date(), "HH:mm")}.`;
}

/** How many entries differ between two flat records (keys missing on one side count as changed). */
export function countChanges(current: Record<string, unknown>, saved: Record<string, unknown>) {
  const keys = new Set([...Object.keys(current), ...Object.keys(saved)]);
  return [...keys].filter((key) => (current[key] ?? "") !== (saved[key] ?? "")).length;
}
