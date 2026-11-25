"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { COMMISSION_RATE_LIMITS, commissionRateSchema, type AdminUser } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ErrorPanel,
  FormAlert,
  FormField,
  LoadingPanel,
  StatusBadge,
  SubmitButton,
} from "@/features/partner/components";
import { hotelStatusLabels, staffPermissionLabels } from "@/features/partner/lib/labels";
import { getApiErrorMessage, validateWith } from "@/lib/api-error";
import { activateUser, reinstatePartner, setCommissionRate, suspendUser } from "@/services/admin.service";
import { Initials, Panel, Tile } from "../admin-primitives";
import { useAdminMutation, useAdminUser } from "../api/admin-queries";
import { AuditEventList, ReasonDialog } from "../components";
import {
  accountStatusLabels,
  formatDateTime,
  partnerStatusLabels,
  roleLabels,
  roleDescriptions,
  suspensionStatusLabels,
} from "../lib/labels";

type Action = "suspend" | "activate" | "reinstate";

const actions: Record<Action, { title: string; description: string; confirmLabel: string; destructive?: boolean }> = {
  suspend: {
    title: "Khóa tài khoản?",
    description: "Tài khoản bị đăng xuất khỏi mọi thiết bị ngay và không đăng nhập lại được. Người dùng nhận email kèm lý do.",
    confirmLabel: "Khóa tài khoản",
    destructive: true,
  },
  activate: {
    title: "Mở khóa tài khoản?",
    description: "Tài khoản đăng nhập lại được. Người dùng nhận email kèm lý do.",
    confirmLabel: "Mở khóa",
  },
  reinstate: {
    title: "Khôi phục đối tác?",
    description: "Đối tác trở lại trạng thái đã duyệt; các khách sạn đang hoạt động được hiển thị và nhận đặt phòng lại.",
    confirmLabel: "Khôi phục đối tác",
  },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="text-base font-bold text-primary">{title}</h2>
      {children}
    </section>
  );
}

function CommissionForm({ user }: { user: AdminUser & { partner: NonNullable<AdminUser["partner"]> } }) {
  const [rate, setRate] = useState(String(user.partner.commissionRate));
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const save = useAdminMutation((value: number) => setCommissionRate(user.id, value));

  function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    const result = validateWith(commissionRateSchema, { rate: Number(rate.replace(",", ".")) });
    if (result.errors) {
      return setError(`Tỉ lệ từ ${COMMISSION_RATE_LIMITS.min} đến ${COMMISSION_RATE_LIMITS.max}%, tối đa 2 chữ số thập phân.`);
    }
    setError(undefined);
    save.mutate(result.data.rate, {
      onSuccess: () => setSaved(true),
      onError: (err) => setError(getApiErrorMessage(err)),
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-wrap items-end gap-3">
      <FormField
        label="Tỉ lệ hoa hồng (%)"
        error={error}
        hint="Áp dụng cho đơn đặt từ bây giờ; đơn cũ giữ tỉ lệ lúc đặt."
        className="w-64"
      >
        <Input value={rate} onChange={(event) => setRate(event.target.value)} inputMode="decimal" />
      </FormField>
      <SubmitButton pending={save.isPending} variant="outline">
        Lưu tỉ lệ
      </SubmitButton>
      {saved && <output className="text-sm text-success">Đã lưu.</output>}
    </form>
  );
}

/** `GET /admin/users/:id` with the admin's actions on the account and, for a partner, on the partner. */
export function UserDetailDialog({ userId, onOpenChange }: { userId: string | undefined; onOpenChange: (open: boolean) => void }) {
  const query = useAdminUser(userId);
  const user = query.data;
  const [action, setAction] = useState<Action>();
  const run = useAdminMutation(({ kind, reason }: { kind: Action; reason: string }) =>
    ({ suspend: suspendUser, activate: activateUser, reinstate: reinstatePartner })[kind](userId!, reason),
  );

  return (
    <Dialog open={!!userId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{user?.fullName ?? "Chi tiết tài khoản"}</DialogTitle>
          <DialogDescription>{user ? `${user.email} • ${roleLabels[user.role]}` : "Thông tin tài khoản, quyền truy cập và hoạt động gần đây."}</DialogDescription>
        </DialogHeader>
        {query.error ? (
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        ) : !user ? (
          <LoadingPanel />
        ) : (
          <div className="space-y-6 text-sm">
            <Panel className="flex flex-row flex-wrap items-center gap-3 p-6">
              <Initials name={user.fullName} className="size-12 text-base" />
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {roleLabels[user.role]}
                </span>
                <StatusBadge tone={accountStatusLabels[user.status].tone}>{accountStatusLabels[user.status].label}</StatusBadge>
              </div>
              <span className="ml-auto flex gap-2">
                {/* The API refuses to lock an admin account (403), so the button is not offered. */}
                {user.role !== "ADMIN" && (user.status === "ACTIVE" || user.status === "INVITED") && (
                  <Button variant="destructive" size="sm" onClick={() => setAction("suspend")}>
                    Khóa tài khoản
                  </Button>
                )}
                {user.status === "SUSPENDED" && (
                  <Button size="sm" onClick={() => setAction("activate")}>
                    Mở khóa
                  </Button>
                )}
              </span>
            </Panel>
            <dl className="grid gap-3 sm:grid-cols-3">
              <Tile label="Số điện thoại">{user.phone ?? "Chưa có"}</Tile>
              <Tile label="Thiết bị đang đăng nhập">{user.activeSessions}</Tile>
              <Tile label="Tạo lúc">{formatDateTime(user.createdAt)}</Tile>
            </dl>

            <div className="grid items-start gap-6 xl:grid-cols-2">
            <Section title="Nhật ký tác vụ & Bảo mật gần đây">
              <AuditEventList events={user.timeline} emptyMessage="Chưa có hoạt động nào được ghi." />
            </Section>
            <div className="space-y-6">
            <Section title="Quyền truy cập hệ thống">
              <p>Vai trò: <strong>{roleLabels[user.role]}</strong></p>
              <p className="leading-6 text-muted-foreground">{roleDescriptions[user.role]}</p>
              <p className="text-xs leading-5 text-muted-foreground">Vai trò được gán khi tạo tài khoản. Màn này chỉ xem quyền; chưa hỗ trợ đổi vai trò hoặc cấp quyền tùy chỉnh.</p>
              <dl className="grid gap-3 sm:grid-cols-2"><Tile label="Mã tài khoản"><code className="text-xs">{user.id}</code></Tile><Tile label="Đăng nhập gần nhất">{user.lastSignInAt ? formatDateTime(user.lastSignInAt) : "Chưa đăng nhập"}</Tile></dl>
            </Section>
            {user.partner && (
              <Section title="Đối tác">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge tone={partnerStatusLabels[user.partner.status].tone}>
                    {partnerStatusLabels[user.partner.status].label}
                  </StatusBadge>
                  <span className="text-muted-foreground">{user.organization}</span>
                  {user.partner.status === "SUSPENDED" && (
                    <Button size="sm" className="ml-auto" onClick={() => setAction("reinstate")}>
                      Khôi phục đối tác
                    </Button>
                  )}
                </div>
                <CommissionForm key={user.partner.commissionRate} user={{ ...user, partner: user.partner }} />
                <ul className="space-y-1">
                  {user.partner.hotels.map((hotel) => (
                    <li key={hotel.id} className="flex items-center gap-2">
                      {hotel.name}
                      <StatusBadge tone={hotelStatusLabels[hotel.status].tone}>{hotelStatusLabels[hotel.status].label}</StatusBadge>
                    </li>
                  ))}
                  {user.partner.hotels.length === 0 && <li className="text-muted-foreground">Chưa có khách sạn nào.</li>}
                </ul>
              </Section>
            )}

            {user.staff && (
              <Section title="Nhân viên khách sạn">
                <p>
                  {user.staff.hotel.name}
                  {user.staff.position ? ` • ${user.staff.position}` : ""}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">Quyền do chủ khách sạn cấp tại mục Nhân viên. Có hiệu lực từ yêu cầu tiếp theo; không có nhóm quyền nào thì chỉ được xem các dữ liệu được phép.</p>
                <ul className="space-y-2">
                  {Object.entries(staffPermissionLabels).map(([permission, info]) => {
                    const granted = user.staff!.permissions.some((value) => value === permission);
                    return <li key={permission} className="flex items-start justify-between gap-3 rounded-xl bg-muted/60 p-3">
                      <div><strong>{info.label}</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">{info.description}</p></div>
                      <StatusBadge tone={granted ? "success" : "muted"}>{granted ? "Đã cấp" : "Chưa cấp"}</StatusBadge>
                    </li>;
                  })}
                </ul>
              </Section>
            )}

            {user.suspensionRequests.length > 0 && (
              <Section title="Yêu cầu tạm ngưng">
                <ul className="space-y-2">
                  {user.suspensionRequests.map((request) => (
                    <li key={request.id} className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={suspensionStatusLabels[request.status].tone}>
                        {suspensionStatusLabels[request.status].label}
                      </StatusBadge>
                      <span>{request.reason}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(request.requestedAt)}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            </div>
            </div>
            <FormAlert message={run.error ? getApiErrorMessage(run.error) : undefined} />
          </div>
        )}
        {action && (
          <ReasonDialog
            open
            onOpenChange={(open) => !open && setAction(undefined)}
            {...actions[action]}
            onSubmit={(reason) => run.mutateAsync({ kind: action, reason })}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
