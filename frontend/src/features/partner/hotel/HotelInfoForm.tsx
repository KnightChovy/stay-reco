"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import {
  createHotelSchema,
  updateHotelSchema,
  type CreateHotelInput,
  type Hotel,
  type UpdateHotelInput,
} from "@stayreco/shared";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  getApiFieldErrors,
  validateWith,
  type FieldErrors,
} from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import {
  FormAlert,
  FormField,
  SubmitButton,
  toOptionalNumber,
  toOptionalText,
  usePartnerHotel,
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
}: {
  hotel?: Hotel;
  onSaved?: (hotel: Hotel) => void;
}) {
  const { canEdit, selectHotel } = usePartnerHotel();
  const [values, setValues] = useState<HotelFormValues>(() => (hotel ? toValues(hotel) : emptyValues));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const isCreate = !hotel;
  const readOnly = !canEdit;

  const mutation = usePartnerMutation(
    (body: CreateHotelInput | UpdateHotelInput) =>
      hotel
        ? partnerService.updateHotel(hotel.id, body)
        : // Validated with createHotelSchema in handleSubmit.
          partnerService.createHotel(body as CreateHotelInput),
    {
      invalidate: () => (hotel ? [partnerKeys.hotels(), partnerKeys.hotel(hotel.id)] : [partnerKeys.hotels()]),
      successMessage: isCreate ? "Đã tạo khách sạn ở trạng thái bản nháp." : "Đã lưu thông tin khách sạn.",
      errorNotice: false,
      onSuccess: (saved) => {
        if (isCreate) selectHotel(saved.id);
        onSaved?.(saved);
      },
    },
  );

  const set = (key: keyof HotelFormValues) => (value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const optional = (value: string) => (isCreate ? toOptionalText(value) : (toOptionalText(value) ?? null));
    const optionalNumber = (value: string) => (isCreate ? toOptionalNumber(value) : (toOptionalNumber(value) ?? null));
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
    const result = validateWith(isCreate ? createHotelSchema : updateHotelSchema, body);
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
    onChange: (event: { target: { value: string } }) => set(key)(event.target.value),
    "aria-invalid": !!errors[key] || undefined,
    disabled: readOnly,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Tên khách sạn" required error={errors.name} className="md:col-span-2">
          <Input {...field("name")} maxLength={255} />
        </FormField>
        <FormField label="Mô tả" error={errors.description} className="md:col-span-2">
          <Textarea {...field("description")} rows={4} maxLength={5000} />
        </FormField>
        <FormField label="Địa chỉ" required error={errors.address} className="md:col-span-2">
          <Input {...field("address")} maxLength={500} />
        </FormField>
        <FormField label="Tỉnh / thành phố" required error={errors.city}>
          <Input {...field("city")} maxLength={100} />
        </FormField>
        <FormField label="Quốc gia" required error={errors.country}>
          <Input {...field("country")} maxLength={100} />
        </FormField>
        <FormField label="Vĩ độ" error={errors.latitude} hint="Nhập cùng kinh độ, ví dụ 16.0544">
          <Input {...field("latitude")} inputMode="decimal" />
        </FormField>
        <FormField label="Kinh độ" error={errors.longitude} hint="Ví dụ 108.2022">
          <Input {...field("longitude")} inputMode="decimal" />
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
        <FormField label="Số điện thoại" error={errors.phone}>
          <Input {...field("phone")} type="tel" maxLength={20} />
        </FormField>
        <FormField label="Email liên hệ" required error={errors.email}>
          <Input {...field("email")} type="email" />
        </FormField>
        <FormField label="Website" error={errors.website} hint="Bắt đầu bằng http:// hoặc https://">
          <Input {...field("website")} type="url" maxLength={500} />
        </FormField>
        <FormField label="Giờ nhận phòng" error={errors.checkInTime}>
          <Input {...field("checkInTime")} type="time" />
        </FormField>
        <FormField label="Giờ trả phòng" error={errors.checkOutTime}>
          <Input {...field("checkOutTime")} type="time" />
        </FormField>
      </div>
      <FormAlert message={formError} />
      {!readOnly && (
        <div className="flex justify-end">
          <SubmitButton pending={mutation.isPending}>
            <Save />
            {isCreate ? "Tạo khách sạn" : "Lưu thay đổi"}
          </SubmitButton>
        </div>
      )}
    </form>
  );
}
