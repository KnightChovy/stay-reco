"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { AxiosError } from "axios";
import { FolderPlus, Plus } from "lucide-react";
import { z, type Amenity } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  getApiErrorMessage,
  getApiFieldErrors,
  validateWith,
  type FieldErrors,
} from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import {
  catalogKeys,
  usePartnerMutation,
  useAmenities,
} from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton } from "../components";

export type AmenityDialogMode = "amenity" | "category";

// Lengths of the `amenity` table columns (name VARCHAR(100), category VARCHAR(50)).
const amenitySchema = z.object({
  category: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(100),
});

/** Compares names the way a partner reads them: "wifi" and "Wi-Fi" or "Hồ bơi" and "ho boi" are the same amenity. */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

/** Until the backend serves POST /amenities, a 404/405 means the route is missing, not a wrong id. */
function describeError(error: unknown) {
  const status = (error as AxiosError | undefined)?.response?.status;
  if (status === 404 || status === 405) {
    return "Máy chủ chưa hỗ trợ thêm tiện ích mới. Vui lòng thử lại sau khi hệ thống được cập nhật.";
  }
  return getApiErrorMessage(error);
}

/**
 * Adds an amenity to the shared catalog. "category" mode also names a new group: a group only exists through its
 * amenities, so it is created together with its first one.
 */
export function AmenityDialog({
  open,
  onOpenChange,
  mode,
  defaultCategory,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AmenityDialogMode;
  defaultCategory?: string;
  onCreated: (amenity: Amenity) => void;
}) {
  const isCategory = mode === "category";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCategory ? "Thêm danh mục tiện ích" : "Thêm tiện ích"}
          </DialogTitle>
          <DialogDescription>
            {isCategory
              ? "Tạo nhóm mới cùng tiện ích đầu tiên của nhóm. Bạn có thể thêm tiện ích khác vào nhóm sau."
              : "Tiện ích mới được thêm vào danh mục chung và chọn sẵn cho khách sạn của bạn."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <AmenityForm
            mode={mode}
            defaultCategory={defaultCategory}
            onDone={(amenity) => {
              onCreated(amenity);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AmenityForm({
  mode,
  defaultCategory,
  onDone,
  onCancel,
}: {
  mode: AmenityDialogMode;
  defaultCategory?: string;
  onDone: (amenity: Amenity) => void;
  onCancel: () => void;
}) {
  const isCategory = mode === "category";
  const { data: amenities = [] } = useAmenities();
  const categories = useMemo(
    () => [...new Set(amenities.map((amenity) => amenity.category))],
    [amenities],
  );
  const [category, setCategory] = useState(
    isCategory ? "" : (defaultCategory ?? categories[0] ?? ""),
  );
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation(partnerService.createAmenity, {
    invalidate: () => [catalogKeys.amenities],
    successMessage: (amenity) =>
      `Đã thêm "${amenity.name}" và chọn sẵn. Nhấn Lưu tiện ích để áp dụng.`,
    errorNotice: false,
    onSuccess: onDone,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const result = validateWith(amenitySchema, { category, name });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    // Duplicates are caught here so the catalog does not end up with two spellings of one amenity.
    const sameCategory = categories.find(
      (item) => normalize(item) === normalize(result.data.category),
    );
    if (isCategory && sameCategory) {
      setErrors({
        category: `Danh mục "${sameCategory}" đã có. Hãy dùng "Thêm tiện ích" để thêm vào danh mục này.`,
      });
      return;
    }
    const duplicate = amenities.find(
      (amenity) =>
        amenity.category === result.data.category &&
        normalize(amenity.name) === normalize(result.data.name),
    );
    if (duplicate) {
      setErrors({ name: `"${duplicate.name}" đã có trong danh mục này.` });
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(describeError(error));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {isCategory ? (
        <FormField
          label="Tên danh mục"
          required
          error={errors.category}
          hint="Ví dụ: Thư giãn, Ẩm thực, Dành cho gia đình"
        >
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            maxLength={50}
            autoFocus
            aria-invalid={!!errors.category || undefined}
          />
        </FormField>
      ) : (
        <FormField label="Danh mục" required error={errors.category}>
          <NativeSelect
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full"
            aria-invalid={!!errors.category || undefined}
          >
            {categories.length === 0 && (
              <NativeSelectOption value="">Chưa có danh mục</NativeSelectOption>
            )}
            {categories.map((item) => (
              <NativeSelectOption key={item} value={item}>
                {item}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      )}
      <FormField
        label={isCategory ? "Tiện ích đầu tiên" : "Tên tiện ích"}
        required
        error={errors.name}
        hint="Ví dụ: Phòng xông hơi, Cho thuê xe đạp"
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          autoFocus={!isCategory}
          aria-invalid={!!errors.name || undefined}
        />
      </FormField>
      <FormAlert message={formError} />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Huỷ
        </Button>
        <SubmitButton pending={mutation.isPending}>
          {isCategory ? <FolderPlus /> : <Plus />}
          {isCategory ? "Tạo danh mục" : "Thêm tiện ích"}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
