"use client";

import { useState } from "react";
import { verificationDecisionSchema, type PlatformHotelRow } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { validateWith } from "@/lib/api-error";
import * as managerService from "@/services/manager.service";
import { managerKeys, useManagerMutation } from "../api/manager-queries";

const REASON_MAX = 2000;

const templates = [
  "Giấy phép kinh doanh sắp hoặc đã hết hiệu lực.",
  "Giấy chứng nhận PCCC cần được cập nhật.",
  "Có khiếu nại về thông tin cơ sở không đúng thực tế.",
  "Đối tác thay đổi pháp nhân hoặc tài khoản thụ hưởng.",
];

export function ReverificationDialog({ hotel, onClose }: { hotel: PlatformHotelRow | undefined; onClose: () => void }) {
  return (
    <Dialog open={!!hotel} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yêu cầu tái xác minh</DialogTitle>
          <DialogDescription>
            {hotel?.name}: đối tác gửi lại hồ sơ, khách sạn vẫn bán phòng trong lúc chuẩn bị. Lý do được gửi qua email.
          </DialogDescription>
        </DialogHeader>
        {hotel && <ReverificationForm key={hotel.id} hotel={hotel} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ReverificationForm({ hotel, onDone }: { hotel: PlatformHotelRow; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const mutation = useManagerMutation((text: string) => managerService.requestReverification(hotel.id, text), {
    invalidate: () => [[...managerKeys.all, "hotels"], managerKeys.verificationQueue()],
    successMessage: `Đã yêu cầu ${hotel.name} tái xác minh.`,
    onSuccess: onDone,
  });

  function submit() {
    const result = validateWith(verificationDecisionSchema, { reason });
    if (result.errors) {
      setError("Nhập lý do gửi cho đối tác.");
      return;
    }
    setError(undefined);
    mutation.mutate(result.data.reason);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {templates.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => setReason(text)}
            className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
          >
            {text}
          </button>
        ))}
      </div>
      <label className="grid gap-1.5 text-xs font-semibold">
        <span>
          Lý do (gửi cho đối tác) <span className="text-danger">*</span>
        </span>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          maxLength={REASON_MAX}
          aria-required
          aria-invalid={!!error}
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone} disabled={mutation.isPending}>
          Huỷ
        </Button>
        <Button onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Gửi yêu cầu
        </Button>
      </div>
    </div>
  );
}
