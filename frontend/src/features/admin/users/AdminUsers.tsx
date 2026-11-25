"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, Eye, Hotel, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import {
  ADMIN_USER_SORTS,
  type AccountStatus,
  type Role,
  type AdminUserSummary,
  type SuspensionRequest,
} from "@stayreco/shared";
import type { CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/features/partner/components";
import { useDebounce } from "@/hooks/use-debounce";
import { decideSuspensionRequest } from "@/services/admin.service";
import { Initials, PageTitle, StatCard } from "../admin-primitives";
import { useAdminMutation, useAdminOverview, useAdminUsers, useSuspensionRequests } from "../api/admin-queries";
import { Filter, ListPanel, ReasonDialog, SelectFilter } from "../components";
import { InvitePlatformManager } from "../invite-platform-manager";
import { accountStatusLabels, formatDateTime, oneOf, roleLabels, suspensionStatusLabels } from "../lib/labels";
import { UserDetailDialog } from "./UserDetailDialog";

const PAGE_SIZE = 10;

type UserSort = (typeof ADMIN_USER_SORTS)[number];
const sortLabels: Record<UserSort, string> = {
  "created-desc": "Mới tạo nhất",
  "created-asc": "Tạo sớm nhất",
  "name-asc": "Tên A → Z",
};

type Decision = { request: SuspensionRequest; action: "approve" | "reject" };

function SuspensionRequests() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<Decision>();
  const requests = useSuspensionRequests({
    page,
    pageSize: PAGE_SIZE,
    status: oneOf<SuspensionRequest["status"]>(status),
  });
  const decide = useAdminMutation(({ request, action, reason }: Decision & { reason: string }) =>
    decideSuspensionRequest(request.id, action, reason),
  );

  const columns: CommonTableColumn<SuspensionRequest>[] = [
    {
      id: "partner",
      header: "Đối tác",
      cell: (request) => (
        <div>
          <strong className="text-primary">{request.partner.name}</strong>
          <span className="block text-xs text-muted-foreground">
            Vi phạm: {request.case.type} • Mức {request.case.severity}
          </span>
        </div>
      ),
    },
    { id: "reason", header: "Lý do đề nghị", className: "max-w-xs whitespace-normal", cell: (request) => request.reason },
    {
      id: "requested",
      header: "Người gửi",
      cell: (request) => (
        <div>
          {request.requestedBy?.fullName ?? "—"}
          <span className="block text-xs text-muted-foreground">{formatDateTime(request.requestedAt)}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (request) => (
        <div>
          <StatusBadge tone={suspensionStatusLabels[request.status].tone}>
            {suspensionStatusLabels[request.status].label}
          </StatusBadge>
          {request.decisionReason && (
            <span className="mt-1 block max-w-56 whitespace-normal text-xs text-muted-foreground">
              {request.decisionReason}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (request) =>
        request.status === "PENDING" && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDecision({ request, action: "reject" })}>
              Từ chối
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDecision({ request, action: "approve" })}>
              Tạm ngưng
            </Button>
          </div>
        ),
    },
  ];

  return (
    <>
      <ListPanel
        filters={
          <SelectFilter
            label="Trạng thái"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={Object.entries(suspensionStatusLabels).map(([value, { label }]) => [value, label])}
          />
        }
        query={requests}
        columns={columns}
        getRowId={(request) => request.id}
        emptyMessage={status ? "Không có yêu cầu nào ở trạng thái này." : "Không có yêu cầu tạm ngưng nào đang chờ."}
        onPageChange={setPage}
      />
      <ReasonDialog
        open={!!decision}
        onOpenChange={(open) => !open && setDecision(undefined)}
        title={decision?.action === "approve" ? "Tạm ngưng đối tác?" : "Từ chối yêu cầu tạm ngưng?"}
        description={
          decision?.action === "approve"
            ? `Khách sạn của ${decision.request.partner.name} sẽ rời khỏi tìm kiếm và không nhận đặt phòng mới. Đơn đã đặt vẫn được phục vụ.`
            : `Đối tác ${decision?.request.partner.name ?? ""} không bị thay đổi; quản lý gửi yêu cầu sẽ nhận lý do.`
        }
        confirmLabel={decision?.action === "approve" ? "Tạm ngưng đối tác" : "Từ chối yêu cầu"}
        destructive={decision?.action === "approve"}
        onSubmit={(reason) => decide.mutateAsync({ ...decision!, reason })}
      />
    </>
  );
}

function UserList() {
  const [openId, setOpenId] = useState<string>();
  const [search, setSearch] = useState(useSearchParams().get("search") ?? "");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<UserSort>("created-desc");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());
  const counts = useAdminOverview().data?.accounts;
  const total = counts?.reduce((sum, row) => sum + row.total, 0);
  const users = useAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    sort,
    search: debouncedSearch || undefined,
    role: oneOf<Role>(role),
    status: oneOf<AccountStatus>(status),
  });

  // Every filter change starts again from the first page.
  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const columns: CommonTableColumn<AdminUserSummary>[] = [
    {
      id: "user",
      header: "Tài khoản",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Initials name={user.fullName} />
          <div>
            <strong className="font-semibold text-primary">{user.fullName}</strong>
            <span className="block text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Vai trò",
      cell: (user) => (
        <div>
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {roleLabels[user.role]}
          </span>
          {user.organization && <span className="mt-1 block text-xs text-muted-foreground">{user.organization}</span>}
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (user) => (
        <StatusBadge tone={accountStatusLabels[user.status].tone}>{accountStatusLabels[user.status].label}</StatusBadge>
      ),
    },
    {
      id: "created",
      header: "Tạo lúc",
      cell: (user) => (
        <div>
          {formatDateTime(user.createdAt)}
          <span className="block text-xs text-muted-foreground">
            {user.lastSignInAt ? `Đăng nhập ${formatDateTime(user.lastSignInAt)}` : "Chưa đăng nhập"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (user) => (
        <Button variant="outline" size="sm" onClick={() => setOpenId(user.id)}>
          <Eye />
          Xem
        </Button>
      ),
    },
  ];

  return (
    <>
      <ListPanel
        filters={
          <>
            <label className="relative block min-w-56 flex-1">
              <span className="sr-only">Tìm theo tên hoặc email</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => update(setSearch)(event.target.value)}
                placeholder="Tìm theo tên hoặc email"
                className="h-10 pl-9"
                maxLength={100}
              />
            </label>
            <SelectFilter
              label="Trạng thái"
              value={status}
              onChange={update(setStatus)}
              options={Object.entries(accountStatusLabels).map(([value, { label }]) => [value, label])}
            />
            <Filter label="Sắp xếp" className="sm:w-44">
              <NativeSelect value={sort} onChange={(event) => update(setSort)(event.target.value as UserSort)} className="h-10 w-full">
                {ADMIN_USER_SORTS.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {sortLabels[value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Filter>
            <div className="flex basis-full flex-wrap gap-2" role="group" aria-label="Lọc theo vai trò">
              {[
                ["", "Tất cả", total] as const,
                ...Object.entries(roleLabels).map(
                  ([value, label]) => [value, label, counts?.find((row) => row.role === value)?.total] as const,
                ),
              ].map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={role === value}
                  onClick={() => update(setRole)(value)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    role === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                  {count !== undefined && <span className="tabular-nums opacity-70">{count.toLocaleString("vi-VN")}</span>}
                </button>
              ))}
            </div>
          </>
        }
        query={users}
        columns={columns}
        getRowId={(user) => user.id}
        emptyMessage={debouncedSearch || role || status ? "Không có tài khoản nào khớp bộ lọc." : "Chưa có tài khoản nào."}
        onPageChange={setPage}
      />
      <UserDetailDialog key={openId} userId={openId} onOpenChange={(open) => !open && setOpenId(undefined)} />
    </>
  );
}

type UsersTab = "users" | "suspensions";

/** UC82 and UC83: accounts (lock, unlock, commission rate, reinstate) and the managers' suspension requests. */
export default function AdminUsers() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const searchParams = useSearchParams();
  // `?tab=suspensions` comes from the dashboard's pending-request figure.
  const [tab, setTab] = useState<UsersTab>(searchParams.get("tab") === "suspensions" ? "suspensions" : "users");
  const pending = useSuspensionRequests({ page: 1, pageSize: 1 }).data?.meta.total;
  const accounts = useAdminOverview().data?.accounts;
  const count = (pick: (row: NonNullable<typeof accounts>[number]) => number) => accounts?.reduce((sum, row) => sum + pick(row), 0);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Identity & Access • Tài khoản hệ thống"
        title="Quản lý Người dùng & Tài khoản Hệ thống"
        description="Mời quản lý nền tảng, khóa hoặc mở khóa tài khoản, đặt tỉ lệ hoa hồng và quyết định yêu cầu tạm ngưng đối tác."
        action={<Button onClick={() => setInviteOpen(true)}><UserPlus />Mời quản lý nền tảng</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Tổng tài khoản" value={count((row) => row.total)} hint="Mọi vai trò trên nền tảng" icon={Users} />
        <StatCard label="Khách hàng" value={accounts?.find((row) => row.role === "CUSTOMER")?.total} hint="Khách lưu trú" icon={Users} />
        <StatCard label="Đối tác khách sạn" value={accounts?.find((row) => row.role === "HOTEL_PARTNER")?.total} hint="Chủ cơ sở lưu trú" icon={Hotel} />
        <StatCard label="Nhân viên hotel" value={accounts?.find((row) => row.role === "HOTEL_STAFF")?.total} hint="Vận hành khách sạn" icon={Building2} />
        <StatCard label="Quản trị hệ thống" value={count((row) => row.role === "ADMIN" || row.role === "PLATFORM_MANAGER" ? row.total : 0)} hint="Quản lý & quản trị viên" icon={ShieldCheck} />
        <StatCard label="Yêu cầu chờ duyệt" value={pending} hint="Tạm ngưng đối tác" icon={UserPlus} tone="warning" />
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as UsersTab)}>
        <TabsList variant="line">
          <TabsTrigger value="users">Tài khoản</TabsTrigger>
          <TabsTrigger value="suspensions">
            Yêu cầu tạm ngưng
            {pending !== undefined && pending > 0 && (
              <span className="ml-1 rounded-full bg-warning-soft px-1.5 text-[11px] font-bold text-warning">{pending}</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "users" ? (
        <>
          <UserList key={searchParams.get("search") ?? ""} />
        </>
      ) : (
        <SuspensionRequests />
      )}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Mời quản lý nền tảng</DialogTitle><DialogDescription>Gửi liên kết để quản lý mới tự thiết lập mật khẩu.</DialogDescription></DialogHeader>
          <InvitePlatformManager />
        </DialogContent>
      </Dialog>
    </div>
  );
}
