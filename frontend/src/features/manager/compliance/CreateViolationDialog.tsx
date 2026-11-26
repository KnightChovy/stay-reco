"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Building2, FileUp, LoaderCircle, Search, Trash2, X } from "lucide-react";
import {
  createViolationSchema,
  VIOLATION_MAX_EVIDENCE,
  VIOLATION_SEVERITIES,
  VIOLATION_TYPES,
  type PolicyViolation,
  type ViolationType,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as managerService from "@/services/manager.service";
import { getManagerErrorMessage, managerKeys, useManagerMutation, usePlatformHotels } from "../api/manager-queries";
import { violationSeverityLabels, violationTypeLabels, type ViolationSeverity } from "../lib/labels";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024;

export type ViolationTarget = {
  partner: { id: string; name: string };
  hotel: { id: string; name: string } | null;
};

type Evidence = { key: string; name: string; state: "uploading" | "done" | "error"; fileId?: string; error?: string };

export function CreateViolationDialog({
  open,
  onOpenChange,
  initialTarget,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTarget?: ViolationTarget;
  onCreated?: (violation: PolicyViolation) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mở hồ sơ vi phạm</DialogTitle>
          <DialogDescription>
            Ghi nhận vi phạm chính sách của đối tác kèm bằng chứng. Hồ sơ được theo dõi đến khi xử lý hoặc bác bỏ.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CreateViolationForm
            initialTarget={initialTarget}
            onDone={(violation) => {
              onOpenChange(false);
              onCreated?.(violation);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateViolationForm({
  initialTarget,
  onDone,
}: {
  initialTarget?: ViolationTarget;
  onDone: (violation: PolicyViolation) => void;
}) {
  const [target, setTarget] = useState<ViolationTarget | undefined>(initialTarget);
  const [partnerOnly, setPartnerOnly] = useState(initialTarget ? !initialTarget.hotel : false);
  const [type, setType] = useState<ViolationType>("FAKE_LISTING");
  const [severity, setSeverity] = useState<ViolationSeverity>("MEDIUM");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = useManagerMutation(managerService.createViolation, {
    invalidate: () => [managerKeys.violationList(), [...managerKeys.all, "hotels"], [...managerKeys.all, "overview"]],
    successMessage: "Đã mở hồ sơ vi phạm.",
    errorNotice: false,
    onSuccess: onDone,
  });

  const uploading = evidence.some((item) => item.state === "uploading");

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const room = VIOLATION_MAX_EVIDENCE - evidence.length;
    for (const file of files.slice(0, Math.max(0, room))) {
      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      if (!ACCEPTED.includes(file.type) || file.size > MAX_BYTES) {
        setEvidence((current) => [
          ...current,
          { key, name: file.name, state: "error", error: "Chỉ nhận PDF, JPG, PNG tối đa 10 MB." },
        ]);
        continue;
      }
      setEvidence((current) => [...current, { key, name: file.name, state: "uploading" }]);
      try {
        const { fileId } = await managerService.uploadViolationEvidence(file);
        setEvidence((current) => current.map((item) => (item.key === key ? { ...item, state: "done", fileId } : item)));
      } catch (error) {
        setEvidence((current) =>
          current.map((item) =>
            item.key === key ? { ...item, state: "error", error: getApiErrorMessage(error, "Tải lên thất bại.") } : item,
          ),
        );
      }
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    if (!target) {
      setErrors({ partnerId: "Chọn khách sạn hoặc đối tác bị ghi nhận vi phạm." });
      return;
    }
    const result = validateWith(createViolationSchema, {
      partnerId: target.partner.id,
      hotelId: partnerOnly || !target.hotel ? undefined : target.hotel.id,
      type,
      severity,
      description,
      evidence: evidence.flatMap((item) => (item.fileId ? [item.fileId] : [])),
    });
    if (result.errors) {
      setErrors({ ...result.errors, ...(result.errors.description && { description: "Mô tả vi phạm (tối đa 4000 ký tự)." }) });
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(getManagerErrorMessage(error));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold">
          Đối tượng <span className="text-danger">*</span>
        </p>
        {target ? (
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 size={16} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-foreground">{target.hotel?.name ?? target.partner.name}</p>
              {target.hotel && <p className="text-xs text-muted-foreground">Đối tác: {target.partner.name}</p>}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setTarget(undefined)}>
              <X />
              Đổi
            </Button>
          </div>
        ) : (
          <HotelPicker
            onPick={(picked) => {
              setTarget(picked);
              setErrors((current) => ({ ...current, partnerId: "" }));
            }}
          />
        )}
        {errors.partnerId && (
          <p role="alert" className="text-xs text-danger">
            {errors.partnerId}
          </p>
        )}
        {target?.hotel && (
          <label className="flex items-center gap-2 pt-1 text-sm">
            <Checkbox checked={partnerOnly} onCheckedChange={setPartnerOnly} />
            Vi phạm của cả đối tác, không gắn riêng khách sạn này
          </label>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold">
          <span>
            Loại vi phạm <span className="text-danger">*</span>
          </span>
          <NativeSelect value={type} onChange={(event) => setType(event.target.value as ViolationType)} className="w-full">
            {VIOLATION_TYPES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {violationTypeLabels[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold">
          <span>
            Mức độ <span className="text-danger">*</span>
          </span>
          <NativeSelect
            value={severity}
            onChange={(event) => setSeverity(event.target.value as ViolationSeverity)}
            className="w-full"
          >
            {VIOLATION_SEVERITIES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {violationSeverityLabels[value].label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>

      <label className="grid gap-1.5 text-xs font-semibold">
        <span>
          Mô tả <span className="text-danger">*</span>
        </span>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          maxLength={4000}
          aria-required
          aria-invalid={!!errors.description}
          placeholder="Điều gì đã xảy ra, khi nào, ai phản ánh…"
        />
      </label>
      {errors.description && (
        <p role="alert" className="-mt-2 text-xs text-danger">
          {errors.description}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold">
            Bằng chứng ({evidence.filter((item) => item.state !== "error").length}/{VIOLATION_MAX_EVIDENCE})
          </p>
          {evidence.length < VIOLATION_MAX_EVIDENCE && (
            <label className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold text-primary hover:bg-muted">
              <FileUp className="size-3.5" aria-hidden />
              Thêm tệp
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="sr-only" onChange={(event) => void addFiles(event)} />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground">PDF, JPG hoặc PNG, mỗi tệp tối đa 10 MB, lưu riêng tư.</p>
        {evidence.length > 0 && (
          <ul className="divide-y rounded-xl border text-sm">
            {evidence.map((item) => (
              <li key={item.key} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.name}</span>
                  {item.error && <span className="text-xs text-danger">{item.error}</span>}
                </span>
                {item.state === "uploading" ? (
                  <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-label="Đang tải lên" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Bỏ ${item.name}`}
                    onClick={() => setEvidence((current) => current.filter((entry) => entry.key !== item.key))}
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {formError && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending || uploading}>
          {mutation.isPending && <Spinner />}
          {uploading ? "Đang tải bằng chứng…" : "Mở hồ sơ"}
        </Button>
      </div>
    </form>
  );
}

function HotelPicker({ onPick }: { onPick: (target: ViolationTarget) => void }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search.trim());
  const query = usePlatformHotels({ search: debounced || undefined, pageSize: 6, sort: "name-asc" });
  const hotels = debounced.length >= 2 ? (query.data?.hotels ?? []) : [];

  return (
    <div className="space-y-2">
      <label className="relative block">
        <span className="sr-only">Tìm khách sạn hoặc đối tác</span>
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nhập tên khách sạn hoặc đối tác (ít nhất 2 ký tự)"
          className="h-10 pl-9"
          maxLength={100}
        />
      </label>
      {debounced.length >= 2 && (
        <ul className="max-h-56 divide-y overflow-y-auto rounded-xl border">
          {query.isFetching && hotels.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Đang tìm…</li>
          ) : hotels.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Không tìm thấy khách sạn nào.</li>
          ) : (
            hotels.map((hotel) => (
              <li key={hotel.id}>
                <button
                  type="button"
                  onClick={() =>
                    onPick({
                      partner: { id: hotel.partner.id, name: hotel.partner.name },
                      hotel: { id: hotel.id, name: hotel.name },
                    })
                  }
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-semibold text-foreground">{hotel.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {hotel.city} · {hotel.partner.name}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
