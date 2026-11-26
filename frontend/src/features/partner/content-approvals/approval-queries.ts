"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ContentStatus } from "@stayreco/shared";
import { marketingKeys } from "@/features/staff/api/marketing-queries";
import * as marketingService from "@/services/marketing.service";

export type ApprovalTab = "pending" | "approved" | "rejected";

export const approvalTabs: { id: ApprovalTab; label: string; statuses: ContentStatus[] }[] = [
  { id: "pending", label: "Chờ duyệt", statuses: ["PENDING_APPROVAL"] },
  { id: "approved", label: "Đã duyệt", statuses: ["APPROVED", "SCHEDULED", "PUBLISHED"] },
  { id: "rejected", label: "Đã từ chối", statuses: ["REJECTED"] },
];

export const APPROVAL_PAGE_SIZE = 20;

export function contentsOf(hotelId: string) {
  return [...marketingKeys.all, "contents", hotelId] as const;
}

export function useApprovalContents(hotelId: string | undefined, tab: ApprovalTab, page: number) {
  const params = {
    status: approvalTabs.find((item) => item.id === tab)!.statuses,
    page,
    pageSize: APPROVAL_PAGE_SIZE,
  };
  return useQuery({
    queryKey: marketingKeys.contents(hotelId ?? "", params),
    queryFn: () => marketingService.getContents(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function usePendingContentCount(hotelId: string | undefined) {
  const params = { status: ["PENDING_APPROVAL" as const], pageSize: 1 };
  const query = useQuery({
    queryKey: marketingKeys.contents(hotelId ?? "", params),
    queryFn: () => marketingService.getContents(hotelId!, params),
    enabled: !!hotelId,
    refetchInterval: 60_000,
    retry: false,
  });
  return query.data?.meta.total ?? 0;
}
