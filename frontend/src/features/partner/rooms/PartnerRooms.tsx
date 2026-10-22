"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BedDouble, ImageIcon, Lock, LockOpen, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { ROOM_SORTS, RoomStatus, type Room, type RoomType } from "@stayreco/shared";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import * as partnerService from "@/services/partner.service";
import {
  partnerKeys,
  useHotel,
  usePartnerMutation,
  useRooms,
  useRoomTypes,
} from "../api/partner-queries";
import {
  ConfirmDialog,
  EmptyPanel,
  ErrorPanel,
  FormField,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerHotel,
} from "../components";
import { formatMoney, roomStatusLabels } from "../lib/labels";
import { RoomDialog } from "./RoomDialog";
import { RoomTypeDialog } from "./RoomTypeDialog";
import { RoomTypeImagesDialog } from "./RoomTypeImagesDialog";

const PAGE_SIZE = 10;

const sortLabels: Record<(typeof ROOM_SORTS)[number], string> = {
  "room-number-asc": "Số phòng tăng dần",
  "room-number-desc": "Số phòng giảm dần",
  "floor-asc": "Tầng thấp → cao",
  "floor-desc": "Tầng cao → thấp",
};

export default function PartnerRooms() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Kho phòng"
        description="Khai báo loại phòng, giá cơ bản và từng phòng vật lý; khoá phòng khi bảo trì để ngừng nhận đặt."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <RoomsWorkspace key={hotel.id} hotelId={hotel.id} />
      )}
    </div>
  );
}

function RoomsWorkspace({ hotelId }: { hotelId: string }) {
  const { canEdit } = usePartnerHotel();
  const hotelQuery = useHotel(hotelId);
  const roomTypesQuery = useRoomTypes(hotelId);
  const roomConfig = hotelQuery.data?.roomConfig;
  const roomTypes = roomTypesQuery.data ?? [];
  const roomCount = roomTypes.reduce((sum, type) => sum + type.roomCount, 0);

  return (
    <>
      {hotelQuery.data && !roomConfig && (
        <p className="rounded-xl bg-warning-soft p-4 text-sm text-warning">
          Khách sạn chưa có cấu hình phòng nên chưa thể tạo phòng.{" "}
          <Link href="/partner/hotel?tab=room-config" className="font-semibold underline">
            Khai báo cấu hình phòng
          </Link>
        </p>
      )}
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Loại phòng" value={roomTypes.length} />
        <Metric label="Phòng đã tạo" value={roomConfig ? `${roomCount}/${roomConfig.totalRooms}` : roomCount} />
        <Metric label="Giá cơ bản mặc định" value={formatMoney(roomConfig?.basePrice)} />
      </section>
      <RoomTypesSection
        hotelId={hotelId}
        roomTypes={roomTypes}
        isLoading={roomTypesQuery.isLoading}
        error={roomTypesQuery.error}
        onRetry={() => void roomTypesQuery.refetch()}
        canEdit={canEdit}
        defaultBasePrice={roomConfig?.basePrice}
      />
      <RoomsSection
        hotelId={hotelId}
        roomTypes={roomTypes}
        canEdit={canEdit}
        canCreate={!!roomConfig && roomTypes.length > 0 && roomCount < roomConfig.totalRooms}
        createHint={
          !roomConfig
            ? "Cần cấu hình phòng trước."
            : roomTypes.length === 0
              ? "Cần tạo loại phòng trước."
              : roomCount >= roomConfig.totalRooms
                ? "Đã đạt tổng số phòng trong cấu hình."
                : undefined
        }
      />
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <PartnerPanel className="p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <strong className="mt-1 block text-xl text-primary">{value}</strong>
    </PartnerPanel>
  );
}

// ── Room types ──────────────────────────────────────────────

function RoomTypesSection({
  hotelId,
  roomTypes,
  isLoading,
  error,
  onRetry,
  canEdit,
  defaultBasePrice,
}: {
  hotelId: string;
  roomTypes: RoomType[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  canEdit: boolean;
  defaultBasePrice?: number;
}) {
  const [editing, setEditing] = useState<{ open: boolean; roomType?: RoomType }>({ open: false });
  const [imagesFor, setImagesFor] = useState<string>();
  const [deleting, setDeleting] = useState<RoomType>();
  const remove = usePartnerMutation((id: string) => partnerService.deleteRoomType(id), {
    invalidate: () => [partnerKeys.roomTypes(hotelId)],
    successMessage: "Đã xoá loại phòng.",
    onSuccess: () => setDeleting(undefined),
  });

  return (
    <PartnerPanel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="font-bold text-primary">Loại phòng</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setEditing({ open: true })}>
            <Plus />
            Thêm loại phòng
          </Button>
        )}
      </div>
      <div className="p-5">
        {isLoading ? (
          <LoadingPanel rows={2} />
        ) : error ? (
          <ErrorPanel error={error} onRetry={onRetry} />
        ) : roomTypes.length === 0 ? (
          <EmptyPanel
            icon={BedDouble}
            title="Chưa có loại phòng"
            description="Tạo loại phòng (ví dụ Deluxe, Suite) với sức chứa, giường và giá cơ bản trước khi thêm từng phòng."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roomTypes.map((type) => {
              const cover = [...type.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
              return (
                <li key={type.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
                  <div className="relative aspect-video bg-muted">
                    {cover ? (
                      <Image src={cover.url} alt={type.name} fill sizes="(min-width: 1280px) 30vw, 50vw" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-muted-foreground">
                        <ImageIcon size={28} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-primary">{type.name}</strong>
                      <span className="shrink-0 text-sm font-bold text-primary">{formatMoney(type.basePrice)}</span>
                    </div>
                    <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} />
                        {type.maxOccupancy} khách
                      </span>
                      <span>{type.areaSqm} m²</span>
                      <span>{type.roomCount} phòng</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {type.beds.map((bed) => `${bed.quantity} × ${bed.name}`).join(", ")}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setImagesFor(type.id)}>
                        <ImageIcon />
                        Ảnh ({type.images.length})
                      </Button>
                      {canEdit && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setEditing({ open: true, roomType: type })}>
                            <Pencil />
                            Sửa
                          </Button>
                          <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(type)}>
                            <Trash2 />
                            Xoá
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <RoomTypeDialog
        open={editing.open}
        onOpenChange={(open) => setEditing((prev) => ({ ...prev, open }))}
        hotelId={hotelId}
        roomType={editing.roomType}
        defaultBasePrice={defaultBasePrice}
      />
      <RoomTypeImagesDialog
        roomType={roomTypes.find((type) => type.id === imagesFor)}
        canEdit={canEdit}
        onOpenChange={(open) => !open && setImagesFor(undefined)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title={`Xoá loại phòng ${deleting?.name ?? ""}?`}
        description="Chỉ xoá được loại phòng không còn phòng hoặc booking nào."
        confirmLabel="Xoá loại phòng"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </PartnerPanel>
  );
}

// ── Rooms ───────────────────────────────────────────────────

function RoomsSection({
  hotelId,
  roomTypes,
  canEdit,
  canCreate,
  createHint,
}: {
  hotelId: string;
  roomTypes: RoomType[];
  canEdit: boolean;
  canCreate: boolean;
  createHint?: string;
}) {
  const [search, setSearch] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<(typeof ROOM_SORTS)[number]>("room-number-asc");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());
  const params: partnerService.RoomListParams = {
    page,
    pageSize: PAGE_SIZE,
    sort,
    search: debouncedSearch || undefined,
    roomTypeId: roomTypeId || undefined,
    status: (status || undefined) as RoomStatus | undefined,
  };
  const roomsQuery = useRooms(hotelId, params);
  const [editing, setEditing] = useState<{ open: boolean; room?: Room }>({ open: false });
  const [locking, setLocking] = useState<Room>();
  const [lockReason, setLockReason] = useState("");
  const [unlocking, setUnlocking] = useState<Room>();

  const invalidate = () => [partnerKeys.roomsOf(hotelId)];
  const lock = usePartnerMutation(
    ({ id, reason }: { id: string; reason?: string }) => partnerService.lockRoom(id, { reason }),
    {
      invalidate,
      successMessage: (room) => `Đã khoá phòng ${room.roomNumber}.`,
      onSuccess: () => setLocking(undefined),
    },
  );
  const unlock = usePartnerMutation((id: string) => partnerService.unlockRoom(id), {
    invalidate,
    successMessage: (room) => `Đã mở khoá phòng ${room.roomNumber}.`,
    onSuccess: () => setUnlocking(undefined),
  });

  const typeName = (id: string) => roomTypes.find((type) => type.id === id)?.name ?? "—";
  const columns: CommonTableColumn<Room>[] = [
    { id: "number", header: "Số phòng", cell: (room) => <strong className="text-primary">{room.roomNumber}</strong> },
    { id: "type", header: "Loại phòng", cell: (room) => typeName(room.roomTypeId) },
    { id: "floor", header: "Tầng", cell: (room) => room.floor ?? "—" },
    {
      id: "status",
      header: "Trạng thái",
      cell: (room) => (
        <StatusBadge tone={roomStatusLabels[room.status].tone}>{roomStatusLabels[room.status].label}</StatusBadge>
      ),
    },
    {
      id: "notes",
      header: "Ghi chú",
      className: "max-w-60 truncate text-muted-foreground",
      cell: (room) => room.notes ?? "",
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (room) =>
        canEdit && (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Sửa phòng ${room.roomNumber}`}
              onClick={() => setEditing({ open: true, room })}
            >
              <Pencil />
            </Button>
            {room.status === "MAINTENANCE" ? (
              <Button variant="outline" size="sm" onClick={() => setUnlocking(room)}>
                <LockOpen />
                Mở khoá
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={room.status === "OCCUPIED"}
                title={room.status === "OCCUPIED" ? "Phòng đang có khách" : undefined}
                onClick={() => {
                  setLockReason("");
                  setLocking(room);
                }}
              >
                <Lock />
                Khoá
              </Button>
            )}
          </div>
        ),
    },
  ];

  const meta = roomsQuery.data?.meta;

  return (
    <PartnerPanel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="font-bold text-primary">Danh sách phòng</h2>
        {canEdit && (
          <div className="flex items-center gap-2">
            {createHint && <span className="text-xs text-muted-foreground">{createHint}</span>}
            <Button size="sm" disabled={!canCreate} onClick={() => setEditing({ open: true })}>
              <Plus />
              Thêm phòng
            </Button>
          </div>
        )}
      </div>
      <div className="grid gap-3 border-b px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Tìm số phòng">
          <span className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Ví dụ 301"
              className="pl-8"
              maxLength={100}
            />
          </span>
        </FormField>
        <FormField label="Loại phòng">
          <NativeSelect
            value={roomTypeId}
            onChange={(event) => {
              setRoomTypeId(event.target.value);
              setPage(1);
            }}
            className="w-full"
          >
            <NativeSelectOption value="">Tất cả</NativeSelectOption>
            {roomTypes.map((type) => (
              <NativeSelectOption key={type.id} value={type.id}>
                {type.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Trạng thái">
          <NativeSelect
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="w-full"
          >
            <NativeSelectOption value="">Tất cả</NativeSelectOption>
            {Object.values(RoomStatus).map((value) => (
              <NativeSelectOption key={value} value={value}>
                {roomStatusLabels[value].label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Sắp xếp">
          <NativeSelect
            value={sort}
            onChange={(event) => setSort(event.target.value as (typeof ROOM_SORTS)[number])}
            className="w-full"
          >
            {ROOM_SORTS.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {sortLabels[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      {roomsQuery.error ? (
        <div className="p-5">
          <ErrorPanel error={roomsQuery.error} onRetry={() => void roomsQuery.refetch()} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <TableCommon
            data={roomsQuery.data?.rooms ?? []}
            columns={columns}
            getRowId={(room) => room.id}
            isLoading={roomsQuery.isLoading}
            emptyMessage={
              debouncedSearch || roomTypeId || status ? "Không có phòng nào khớp bộ lọc." : "Chưa có phòng nào."
            }
            className="rounded-none border-0"
            tableClassName="min-w-[720px]"
          />
        </div>
      )}
      {meta && meta.total > 0 && (
        <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
      )}

      <RoomDialog
        open={editing.open}
        onOpenChange={(open) => setEditing((prev) => ({ ...prev, open }))}
        hotelId={hotelId}
        roomTypes={roomTypes}
        room={editing.room}
      />
      <ConfirmDialog
        open={!!locking}
        onOpenChange={(open) => !open && setLocking(undefined)}
        title={`Khoá phòng ${locking?.roomNumber ?? ""}?`}
        description="Phòng chuyển sang bảo trì và không nhận đặt cho đến khi mở khoá. Thao tác được ghi vào nhật ký."
        confirmLabel="Khoá phòng"
        destructive
        pending={lock.isPending}
        onConfirm={() => locking && lock.mutate({ id: locking.id, reason: lockReason.trim() || undefined })}
      >
        <FormField label="Lý do (không bắt buộc)">
          <Textarea
            value={lockReason}
            onChange={(event) => setLockReason(event.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Ví dụ: sửa điều hoà"
          />
        </FormField>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!unlocking}
        onOpenChange={(open) => !open && setUnlocking(undefined)}
        title={`Mở khoá phòng ${unlocking?.roomNumber ?? ""}?`}
        description="Phòng trở lại trạng thái sẵn sàng và có thể nhận đặt."
        confirmLabel="Mở khoá"
        pending={unlock.isPending}
        onConfirm={() => unlocking && unlock.mutate(unlocking.id)}
      />
    </PartnerPanel>
  );
}
