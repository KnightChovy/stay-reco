"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HotelInfoForm } from "../hotel/HotelInfoForm";

/** New hotels start as drafts; the form selects the created hotel, so the page moves on to its verification. */
export function CreateHotelDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm khách sạn mới</DialogTitle>
          <DialogDescription>
            Chỉ cần vài thông tin cơ bản, mất khoảng 2 phút. Khách sạn được lưu
            ở dạng bản nháp, chưa hiển thị với khách cho tới khi hồ sơ xác minh
            được duyệt.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <HotelInfoForm
            onSaved={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
