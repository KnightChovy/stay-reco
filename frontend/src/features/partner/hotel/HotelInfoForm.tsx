"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  Building2,
  Clock,
  MapPin,
  Phone,
  Plus,
  type LucideIcon,
} from "lucide-react";
import {
  createHotelSchema,
  updateHotelSchema,
  type CreateHotelInput,
  type Hotel,
  type UpdateHotelInput,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  getApiFieldErrors,
  validateWith,
  type FieldErrors,
} from "@/lib/api-error";
import { useAuthStore } from "@/lib/auth-store";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import {
  countChanges,
  FormAlert,
  FormField,
  savedMessage,
  StickySaveBar,
  SubmitButton,
  TimeSelect,
  toOptionalNumber,
  toOptionalText,
  usePartnerHotel,
  useUnsavedChanges,
} from "../components";

type HotelFormValues = {
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  starRating: string;
  phone: string;
  email: string;
  website: string;
  checkInTime: string;
  checkOutTime: string;
};

const emptyValues: HotelFormValues = {
  name: "",
  description: "",
  address: "",
  city: "",
  country: "Vietnam",
  latitude: "",
  longitude: "",
  starRating: "",
  phone: "",
  email: "",
  website: "",
  checkInTime: "14:00",
  checkOutTime: "12:00",
};

function toValues(hotel: Hotel): HotelFormValues {
  return {
    name: hotel.name,
    description: hotel.description ?? "",
    address: hotel.address,
    city: hotel.city,
    country: hotel.country,
    latitude: hotel.latitude?.toString() ?? "",
    longitude: hotel.longitude?.toString() ?? "",
    starRating: hotel.starRating?.toString() ?? "",
    phone: hotel.phone ?? "",
    email: hotel.email,
    website: hotel.website ?? "",
    checkInTime: hotel.checkInTime ?? "",
    checkOutTime: hotel.checkOutTime ?? "",
  };
}

/** Creates a hotel (no `hotel`) or edits one. On edit, a cleared optional field is sent as `null` so it is removed. */
export function HotelInfoForm({
  hotel,
  onSaved,
  onCancel,
}: {
  hotel?: Hotel;
  onSaved?: (hotel: Hotel) => void;
  onCancel?: () => void;
}) {
  const { canEdit, isSuspended, selectHotel } = usePartnerHotel();
  const accountEmail = useAuthStore((state) => state.user?.email ?? "");
  // The account email is the usual contact of a new hotel; the partner can change it.
  const [values, setValues] = useState<HotelFormValues>(() =>
    hotel ? toValues(hotel) : { ...emptyValues, email: accountEmail },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const isCreate = !hotel;
  // Creating does not depend on the selected hotel, where the partner may only be staff.
  const readOnly = isCreate ? isSuspended : !canEdit;
  // Edits are compared with the stored hotel, which the save refetches, so a saved form is clean again.
  const changes = hotel && !readOnly ? countChanges(values, toValues(hotel)) : 0;
  useUnsavedChanges(changes > 0);

  const mutation = usePartnerMutation(
    (body: CreateHotelInput | UpdateHotelInput) =>
      hotel
        ? partnerService.updateHotel(hotel.id, body)
        : // Validated with createHotelSchema in handleSubmit.
          partnerService.createHotel(body as CreateHotelInput),
    {
      invalidate: () =>
        hotel
          ? [partnerKeys.hotels(), partnerKeys.hotel(hotel.id)]
          : [partnerKeys.hotels()],
      successMessage: isCreate
        ? "Đã tạo khách sạn ở trạng thái bản nháp."
        : () => savedMessage("thông tin khách sạn"),
      errorNotice: false,
      onSuccess: (saved) => {
        if (isCreate) selectHotel(saved.id);
        onSaved?.(saved);
      },
    },
  );

  const set = (key: keyof HotelFormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const optional = (value: string) =>
      isCreate ? toOptionalText(value) : (toOptionalText(value) ?? null);
    const optionalNumber = (value: string) =>
      isCreate ? toOptionalNumber(value) : (toOptionalNumber(value) ?? null);
    const body = {
      name: values.name,
      description: optional(values.description),
      address: values.address,
      city: values.city,
      country: values.country,
      latitude: optionalNumber(values.latitude),
      longitude: optionalNumber(values.longitude),
      starRating: optionalNumber(values.starRating),
      phone: optional(values.phone),
      email: values.email,
      website: optional(values.website),
      checkInTime: optional(values.checkInTime),
      checkOutTime: optional(values.checkOutTime),
    };
    const result = validateWith(
      isCreate ? createHotelSchema : updateHotelSchema,
      body,
    );
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  const field = (key: keyof HotelFormValues) => ({
    value: values[key],
    onChange: (event: { target: { value: string } }) =>
      set(key)(event.target.value),
    "aria-invalid": !!errors[key] || undefined,
    disabled: readOnly,
  });

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      // No overflow here: a scrolling form would hold the sticky save bar inside itself instead of the viewport.
      className="space-y-6"
    >
      <FormSection
        icon={Building2}
        title="Thông tin cơ bản"
        description="Tên và mô tả hiển thị với khách khi tìm kiếm."
      >
        <FormField
          label="Tên khách sạn"
          required
          error={errors.name}
          className="md:col-span-2"
        >
          <Input
            {...field("name")}
            maxLength={255}
            placeholder="Ví dụ: Sông Hàn Riverside Hotel"
            autoFocus={isCreate}
          />
        </FormField>
        <FormField label="Hạng sao" error={errors.starRating}>
          <NativeSelect
            value={values.starRating}
            onChange={(event) => set("starRating")(event.target.value)}
            disabled={readOnly}
            className="w-full"
          >
            <NativeSelectOption value="">Chưa xếp hạng</NativeSelectOption>
            {[1, 2, 3, 4, 5].map((star) => (
              <NativeSelectOption key={star} value={star}>
                {star} sao
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          label="Mô tả"
          error={errors.description}
          hint="Không bắt buộc, có thể bổ sung sau."
          className="md:col-span-2"
        >
          <Textarea
            {...field("description")}
            rows={isCreate ? 3 : 4}
            maxLength={5000}
            placeholder="Điểm nổi bật, vị trí, phong cách phục vụ..."
          />
        </FormField>
      </FormSection>

      <FormSection
        icon={MapPin}
        title="Vị trí"
        description="Địa chỉ nên trùng với giấy phép kinh doanh để xác minh nhanh hơn."
      >
        <FormField
          label="Địa chỉ"
          required
          error={errors.address}
          className="md:col-span-2"
        >
          <Input
            {...field("address")}
            maxLength={500}
            placeholder="Số nhà, tên đường, phường/xã"
          />
        </FormField>
        <FormField label="Tỉnh / thành phố" required error={errors.city}>
          <Input {...field("city")} maxLength={100} placeholder="Đà Nẵng" />
        </FormField>
        <FormField label="Quốc gia" required error={errors.country}>
          <Input {...field("country")} maxLength={100} />
        </FormField>
        <FormField
          label="Vĩ độ"
          error={errors.latitude}
          hint="Không bắt buộc. Nhập cùng kinh độ, ví dụ 16.0544"
        >
          <Input {...field("latitude")} inputMode="decimal" />
        </FormField>
        <FormField
          label="Kinh độ"
          error={errors.longitude}
          hint="Ví dụ 108.2022"
        >
          <Input {...field("longitude")} inputMode="decimal" />
        </FormField>
      </FormSection>

      <FormSection
        icon={Phone}
        title="Liên hệ"
        description="Kênh StayReco và khách dùng để liên lạc với cơ sở."
      >
        <FormField label="Email liên hệ" required error={errors.email}>
          <Input {...field("email")} type="email" />
        </FormField>
        <FormField label="Số điện thoại" error={errors.phone}>
          <Input
            {...field("phone")}
            type="tel"
            maxLength={20}
            placeholder="0236 xxx xxxx"
          />
        </FormField>
        <FormField
          label="Website"
          error={errors.website}
          hint="Bắt đầu bằng http:// hoặc https://"
          className="md:col-span-2"
        >
          <Input
            {...field("website")}
            type="url"
            maxLength={500}
            placeholder="https://"
          />
        </FormField>
      </FormSection>

      <FormSection
        icon={Clock}
        title="Nhận & trả phòng"
        description="Giờ mặc định áp dụng cho mọi đặt phòng."
      >
        <FormField label="Giờ nhận phòng" error={errors.checkInTime}>
          <TimeSelect {...field("checkInTime")} emptyLabel="Chưa đặt" />
        </FormField>
        <FormField label="Giờ trả phòng" error={errors.checkOutTime}>
          <TimeSelect {...field("checkOutTime")} emptyLabel="Chưa đặt" />
        </FormField>
      </FormSection>

      <FormAlert message={formError} />
      {isCreate
        ? !readOnly && (
            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={mutation.isPending}
                >
                  Huỷ
                </Button>
              )}
              <SubmitButton pending={mutation.isPending}>
                <Plus />
                Tạo khách sạn
              </SubmitButton>
            </div>
          )
        : (
            <StickySaveBar
              changes={changes}
              pending={mutation.isPending}
              onDiscard={() => {
                setValues(toValues(hotel));
                setErrors({});
                setFormError(undefined);
              }}
            />
          )}
    </form>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon size={16} />
        </span>
        <span>
          <span className="block text-sm font-bold text-primary">{title}</span>
          <span className="block text-xs text-muted-foreground">
            {description}
          </span>
        </span>
      </legend>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}
