"use client";

import { useState, type FormEvent } from "react";
import { Save, Send } from "lucide-react";
import {
  inviteStaffSchema,
  StaffPermission,
  type InviteStaffInput,
  type StaffMember,
} from "@stayreco/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
  validateWith,
  type FieldErrors,
} from "@/lib/api-error";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, usePartnerMutation } from "../api/partner-queries";
import { FormAlert, FormField, SubmitButton } from "../components";
import { staffPermissionLabels } from "../lib/labels";

export function InviteStaffDialog({
  open,
  onOpenChange,
  hotelId,
  hotelName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  hotelName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mời nhân viên</DialogTitle>
          <DialogDescription>
            Nhân viên nhận email mời làm việc tại {hotelName} và tự đặt mật khẩu qua liên kết trong email.
          </DialogDescription>
        </DialogHeader>
        {open && <InviteStaffForm hotelId={hotelId} onSaved={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function InviteStaffForm({ hotelId, onSaved }: { hotelId: string; onSaved: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation((input: InviteStaffInput) => partnerService.inviteStaff(input), {
    invalidate: () => [partnerKeys.staff(hotelId)],
    successMessage: (result) => `Đã gửi lời mời tới ${result.email}.`,
    errorNotice: false,
    onSuccess: onSaved,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const result = validateWith(inviteStaffSchema, { fullName, email, position, hotelId });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onError: (error) => {
        if (getApiErrorCode(error) === "AUTH_EMAIL_TAKEN") {
          setErrors({ email: getApiErrorMessage(error) });
          return;
        }
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField label="Họ và tên" required error={errors.fullName}>
        <Input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
      </FormField>
      <FormField label="Email" required error={errors.email}>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
      </FormField>
      <FormField label="Vị trí" required error={errors.position} hint="Ví dụ: Lễ tân, Quản lý ca">
        <Input value={position} onChange={(event) => setPosition(event.target.value)} maxLength={50} />
      </FormField>
      <p className="text-xs text-muted-foreground">
        Nhân viên mới chưa có nhóm quyền nào (chỉ xem). Bạn có thể phân quyền ngay sau khi gửi lời mời.
      </p>
      <FormAlert message={formError} />
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending}>
          <Send />
          Gửi lời mời
        </SubmitButton>
      </div>
    </form>
  );
}

export function StaffPermissionsDialog({
  staff,
  hotelId,
  onOpenChange,
}: {
  staff: StaffMember | undefined;
  hotelId: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!staff} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Phân quyền cho {staff?.fullName}</DialogTitle>
          <DialogDescription>
            Thay đổi có hiệu lực từ lần thao tác tiếp theo của nhân viên. Bỏ chọn tất cả để chỉ cho phép xem.
          </DialogDescription>
        </DialogHeader>
        {staff && (
          <PermissionsForm key={staff.id} staff={staff} hotelId={hotelId} onSaved={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PermissionsForm({ staff, hotelId, onSaved }: { staff: StaffMember; hotelId: string; onSaved: () => void }) {
  const [permissions, setPermissions] = useState(staff.permissions);
  const mutation = usePartnerMutation(
    (next: StaffPermission[]) => partnerService.setStaffPermissions(staff.id, next),
    {
      invalidate: () => [partnerKeys.staff(hotelId)],
      successMessage: "Đã cập nhật quyền.",
      onSuccess: onSaved,
    },
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Keep the enum order so the request is stable whatever the click order was.
    mutation.mutate(Object.values(StaffPermission).filter((permission) => permissions.includes(permission)));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {Object.values(StaffPermission).map((permission) => (
          <label
            key={permission}
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-data-checked:border-primary/40 has-data-checked:bg-primary/5"
          >
            <Checkbox
              className="mt-0.5"
              checked={permissions.includes(permission)}
              onCheckedChange={(checked) =>
                setPermissions((prev) => (checked ? [...prev, permission] : prev.filter((item) => item !== permission)))
              }
            />
            <span>
              <strong className="block text-sm text-primary">{staffPermissionLabels[permission].label}</strong>
              <span className="text-xs text-muted-foreground">{staffPermissionLabels[permission].description}</span>
            </span>
          </label>
        ))}
      </div>
      <FormAlert message={mutation.error ? getApiErrorMessage(mutation.error) : undefined} />
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending}>
          <Save />
          Lưu quyền
        </SubmitButton>
      </div>
    </form>
  );
}
