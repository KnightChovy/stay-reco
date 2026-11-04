"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { Amenity } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAmenities } from "../api/partner-queries";
import { ErrorPanel } from "../components";
import { Skeleton } from "@/components/ui/skeleton";

/** Amenity checklist grouped by category; shared by the hotel and room type forms. `onAdd` shows an add button per group. */
export function AmenityPicker({
  selected,
  onChange,
  disabled,
  onAdd,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  onAdd?: (category: string) => void;
}) {
  const { data, isLoading, error, refetch } = useAmenities();
  const groups = useMemo(() => {
    const byCategory = new Map<string, Amenity[]>();
    for (const amenity of data ?? []) {
      byCategory.set(amenity.category, [...(byCategory.get(amenity.category) ?? []), amenity]);
    }
    return [...byCategory.entries()];
  }, [data]);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (error) return <ErrorPanel error={error} onRetry={() => void refetch()} />;

  const toggle = (id: string, checked: boolean) =>
    onChange(checked ? [...selected, id] : selected.filter((item) => item !== id));

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Chưa có tiện ích nào trong danh mục.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map(([category, amenities]) => (
        <fieldset key={category}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{category}</legend>
            {onAdd && !disabled && (
              <Button type="button" variant="ghost" size="xs" onClick={() => onAdd(category)}>
                <Plus />
                Thêm vào nhóm
              </Button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((amenity) => (
              <label
                key={amenity.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm has-data-checked:border-primary/40 has-data-checked:bg-primary/5"
              >
                <Checkbox
                  checked={selected.includes(amenity.id)}
                  onCheckedChange={(checked) => toggle(amenity.id, checked)}
                  disabled={disabled}
                />
                {amenity.name}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
