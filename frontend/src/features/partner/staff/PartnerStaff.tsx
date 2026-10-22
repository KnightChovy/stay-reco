"use client";

import { useState } from "react";
import { KeyRound, MailX, Power, PowerOff, UserPlus, UsersRound } from "lucide-react";
import type { StaffMember } from "@stayreco/shared";
import { TableCommon, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import * as partnerService from "@/services/partner.service";
import { partnerKeys, useHotelStaff, usePartnerMutation } from "../api/partner-queries";
import {
  ConfirmDialog,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { staffPermissionLabels, staffStatusLabels } from "../lib/labels";
import { InviteStaffDialog, StaffPermissionsDialog } from "./StaffDialogs";

type StaffAction = { kind: "deactivate" | "activate" | "cancel"; staff: StaffMember };

const actionCopy: Record<StaffAction["kind"], { title: string; description: string; confirm: string; done: string }> = {
  deactivate: {
    title: "Vô hiệu hoá tài khoản",
    description: "Nhân viên bị đăng xuất khỏi mọi thiết bị ngay lập tức và không thể đăng nhập cho đến khi được kích hoạt lại.",
    confirm: "Vô hiệu hoá",
    done: "Đã vô hiệu hoá tài khoản.",
  },
  activate: {
    title: "Kích hoạt lại tài khoản",
    description: "Nhân viên có thể đăng nhập lại với mật khẩu hiện tại.",
    confirm: "Kích hoạt",
    done: "Đã kích hoạt lại tài khoản.",
  },
  cancel: {
    title: "Huỷ lời mời",
    description: "Liên kết trong email mời sẽ không còn hiệu lực. Bạn có thể mời lại email này sau.",
    confirm: "Huỷ lời mời",
    done: "Đã huỷ lời mời.",
  },
};

export default function PartnerStaff() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended, canEdit } = usePartnerHotel();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Nhân viên & phân quyền"
        description="Mời nhân viên, gán nhóm quyền và tạm khoá tài khoản khi cần. Nhân viên không thể quản lý nhân viên khác."
        action={
          hotel &&
          canEdit && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus />
              Mời nhân viên
            </Button>
          )
        }
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <>
          <StaffTable key={hotel.id} hotelId={hotel.id} canEdit={canEdit} onInvite={() => setInviteOpen(true)} />
          <InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} hotelId={hotel.id} hotelName={hotel.name} />
        </>
      )}
    </div>
  );
}

function StaffTable({ hotelId, canEdit, onInvite }: { hotelId: string; canEdit: boolean; onInvite: () => void }) {
  const staffQuery = useHotelStaff(hotelId);
  const [permissionsFor, setPermissionsFor] = useState<StaffMember>();
  const [action, setAction] = useState<StaffAction>();

  const mutation = usePartnerMutation<StaffMember | void, StaffAction>(
    ({ kind, staff }) => {
      if (kind === "deactivate") return partnerService.deactivateStaff(staff.id);
      if (kind === "activate") return partnerService.activateStaff(staff.id);
      return partnerService.cancelStaffInvitation(staff.id);
    },
    {
      invalidate: () => [partnerKeys.staff(hotelId)],
      successMessage: (_, vars) => actionCopy[vars.kind].done,
      onSuccess: () => setAction(undefined),
    },
  );

  const columns: CommonTableColumn<StaffMember>[] = [
    {
      id: "name",
      header: "Nhân viên",
      cell: (staff) => (
        <div className="min-w-0">
          <strong className="block text-primary">{staff.fullName}</strong>
          <span className="text-xs text-muted-foreground">{staff.email}</span>
        </div>
      ),
    },
    { id: "position", header: "Vị trí", cell: (staff) => staff.position },
    {
      id: "status",
      header: "Trạng thái",
      cell: (staff) => {
        const status = staffStatusLabels[staff.status] ?? { label: staff.status, tone: "muted" as const };
        return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>;
      },
    },
    {
      id: "permissions",
      header: "Nhóm quyền",
      cell: (staff) =>
        staff.permissions.length === 0 ? (
          <span className="text-xs text-muted-foreground">Chỉ xem</span>
        ) : (
          <div className="flex max-w-72 flex-wrap gap-1">
            {staff.permissions.map((permission) => (
              <span key={permission} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                {staffPermissionLabels[permission].label}
              </span>
            ))}
          </div>
        ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (staff) =>
        canEdit && (
          <div className="flex justify-end gap-1">
            {staff.status !== "SUSPENDED" && (
              <Button variant="outline" size="sm" onClick={() => setPermissionsFor(staff)}>
                <KeyRound />
                Phân quyền
              </Button>
            )}
            {staff.status === "ACTIVE" && (
              <Button variant="ghost" size="sm" className="text-danger" onClick={() => setAction({ kind: "deactivate", staff })}>
                <PowerOff />
                Vô hiệu hoá
              </Button>
            )}
            {staff.status === "DEACTIVATED" && (
              <Button variant="ghost" size="sm" onClick={() => setAction({ kind: "activate", staff })}>
                <Power />
                Kích hoạt
              </Button>
            )}
            {staff.status === "INVITED" && (
              <Button variant="ghost" size="sm" className="text-danger" onClick={() => setAction({ kind: "cancel", staff })}>
                <MailX />
                Huỷ lời mời
              </Button>
            )}
          </div>
        ),
    },
  ];

  if (staffQuery.error) return <ErrorPanel error={staffQuery.error} onRetry={() => void staffQuery.refetch()} />;
  if (!staffQuery.isLoading && staffQuery.data?.length === 0) {
    return (
      <EmptyPanel
        icon={UsersRound}
        title="Chưa có nhân viên"
        description="Mời lễ tân, quản lý ca hoặc nhân viên marketing để cùng vận hành khách sạn."
        action={
          canEdit && (
            <Button onClick={onInvite}>
              <UserPlus />
              Mời nhân viên
            </Button>
          )
        }
      />
    );
  }

  const copy = action && actionCopy[action.kind];

  return (
    <PartnerPanel className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <TableCommon
          data={staffQuery.data ?? []}
          columns={columns}
          getRowId={(staff) => staff.id}
          isLoading={staffQuery.isLoading}
          className="rounded-none border-0"
          tableClassName="min-w-[820px]"
        />
      </div>
      <StaffPermissionsDialog
        staff={permissionsFor}
        hotelId={hotelId}
        onOpenChange={(open) => !open && setPermissionsFor(undefined)}
      />
      <ConfirmDialog
        open={!!action}
        onOpenChange={(open) => !open && setAction(undefined)}
        title={copy ? `${copy.title}: ${action.staff.fullName}?` : ""}
        description={copy?.description ?? ""}
        confirmLabel={copy?.confirm ?? ""}
        destructive={action?.kind !== "activate"}
        pending={mutation.isPending}
        onConfirm={() => action && mutation.mutate(action)}
      />
    </PartnerPanel>
  );
}
