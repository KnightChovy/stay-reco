"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import {
  createRoomSchema,
  updateRoomSchema,
  type CreateRoomInput,
  type Room,
  type RoomType,
  type UpdateRoomInput,
} from "@stayreco/shared";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
  validateWith,
  type FieldErrors,
} from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton, toOptionalNumber, toOptionalText } from "../components";

export function RoomDialog({
  open,
  onOpenChange,
  hotelId,
  roomTypes,
  room,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  roomTypes: RoomType[];
  /** Edits this room; creates a new one when omitted. */
  room?: Room;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{room ? `Sửa phòng ${room.roomNumber}` : "Thêm phòng"}</DialogTitle>
          <DialogDescription>Số phòng là duy nhất trong khách sạn (không phân biệt hoa thường).</DialogDescription>
        </DialogHeader>
        {open && <RoomForm hotelId={hotelId} roomTypes={roomTypes} room={room} onSaved={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RoomForm({
  hotelId,
  roomTypes,
  room,
  onSaved,
}: {
  hotelId: string;
  roomTypes: RoomType[];
  room?: Room;
  onSaved: () => void;
}) {
  const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId ?? roomTypes[0]?.id ?? "");
  const [roomNumber, setRoomNumber] = useState(room?.roomNumber ?? "");
  const [floor, setFloor] = useState(room?.floor?.toString() ?? "");
  const [notes, setNotes] = useState(room?.notes ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<{ message: string; roomLimit: boolean }>();

  const mutation = usePartnerMutation(
    (input: CreateRoomInput | UpdateRoomInput) =>
      room
        ? partnerService.updateRoom(room.id, input)
        : // Validated with createRoomSchema in handleSubmit.
          partnerService.createRoom(hotelId, input as CreateRoomInput),
    {
      // Room counts per type are shown on the room type cards.
      invalidate: () => [partnerKeys.roomsOf(hotelId), partnerKeys.roomTypes(hotelId)],
      successMessage: room ? "Đã cập nhật phòng." : "Đã thêm phòng.",
      errorNotice: false,
      onSuccess: onSaved,
    },
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const body = {
      roomTypeId: roomTypeId || undefined,
      roomNumber,
      floor: room ? (toOptionalNumber(floor) ?? null) : toOptionalNumber(floor),
      notes: room ? (toOptionalText(notes) ?? null) : toOptionalText(notes),
    };
    const result = validateWith(room ? updateRoomSchema : createRoomSchema, body);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onError: (error) => {
        const code = getApiErrorCode(error);
        if (code === "ROOM_NUMBER_TAKEN") {
          setErrors({ roomNumber: getApiErrorMessage(error) });
          return;
        }
        setErrors(getApiFieldErrors(error));
        setFormError({ message: getApiErrorMessage(error), roomLimit: code === "ROOM_LIMIT_REACHED" });
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField label="Loại phòng" required error={errors.roomTypeId}>
        <NativeSelect value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)} className="w-full">
          {roomTypes.map((type) => (
            <NativeSelectOption key={type.id} value={type.id}>
              {type.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Số phòng" required error={errors.roomNumber}>
          <Input value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} maxLength={20} />
        </FormField>
        <FormField label="Tầng" error={errors.floor}>
          <Input value={floor} onChange={(event) => setFloor(event.target.value)} inputMode="numeric" />
        </FormField>
      </div>
      <FormField label="Ghi chú" error={errors.notes}>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} maxLength={1000} />
      </FormField>
      {formError && (
        <div className="space-y-1">
          <FormAlert message={formError.message} />
          {formError.roomLimit && (
            <Link href="/partner/hotel?tab=room-config" className="text-xs font-semibold text-primary underline">
              Mở cấu hình phòng
            </Link>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending}>
          <Save />
          {room ? "Lưu phòng" : "Thêm phòng"}
        </SubmitButton>
      </div>
    </form>
  );
}
