"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { toneClasses, type StatusTone } from "../lib/labels";
import { PartnerPanel } from "./PartnerPanel";

export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

/** Label + control + error. Wrapping the control in the label associates them without ids. */
export function FormField({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label className="grid gap-1.5 text-xs font-semibold text-foreground">
        <span>
          {label}
          {required && <span className="text-danger"> *</span>}
        </span>
        {children}
      </label>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft p-3 text-sm text-danger">
      <TriangleAlert size={16} className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

export function SubmitButton({ pending, children, ...props }: React.ComponentProps<typeof Button> & { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Spinner />}
      {children}
    </Button>
  );
}

export function LoadingPanel({ rows = 3 }: { rows?: number }) {
  return (
    <PartnerPanel className="space-y-3 p-5">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </PartnerPanel>
  );
}

export function ErrorPanel({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <PartnerPanel className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
      <TriangleAlert className="shrink-0 text-danger" size={20} />
      <p className="flex-1 text-sm text-muted-foreground">{getApiErrorMessage(error, "Không tải được dữ liệu.")}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Thử lại
        </Button>
      )}
    </PartnerPanel>
  );
}

export function EmptyPanel({ icon: Icon = Building2, title, description, action }: {
  icon?: typeof Building2;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <PartnerPanel className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon size={22} />
      </span>
      <h2 className="font-bold text-primary">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </PartnerPanel>
  );
}

/** Shown on hotel-scoped screens when the partner has not created a hotel yet. */
export function NoHotelPanel() {
  return (
    <EmptyPanel
      title="Bạn chưa có khách sạn nào"
      description="Tạo khách sạn đầu tiên để cấu hình phòng, mời nhân viên và gửi hồ sơ xác minh."
      action={
        <Link href="/partner/hotel" className={buttonVariants()}>
          Tạo khách sạn
        </Link>
      }
    />
  );
}

export function SuspendedBanner() {
  return (
    <p role="status" className="flex items-start gap-2 rounded-xl bg-danger-soft p-4 text-sm text-danger">
      <ShieldAlert size={18} className="mt-0.5 shrink-0" />
      Tài khoản đối tác đang bị tạm ngưng. Bạn vẫn xem được dữ liệu nhưng không thể tạo hoặc chỉnh sửa.
    </p>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  pending = false,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Huỷ</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "default"} disabled={pending} onClick={onConfirm}>
            {pending && <Spinner />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Form inputs hold strings; the API wants numbers or nothing. */
export function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

export function toOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
