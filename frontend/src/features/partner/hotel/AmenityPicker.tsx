"use client";

import { useMemo } from "react";
import type { Amenity } from "@stayreco/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { useAmenities } from "../api/partner-queries";
import { ErrorPanel } from "../components";
import { Skeleton } from "@/components/ui/skeleton";

/** Amenity checklist grouped by category; shared by the hotel and room type forms. */
export function AmenityPicker({
  selected,
  onChange,
  disabled,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
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

  return (
    <div className="space-y-5">
      {groups.map(([category, amenities]) => (
        <fieldset key={category}>
          <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{category}</legend>
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
