"use client";

import { useState } from "react";
import { Link2, Unlink } from "lucide-react";
import type { SocialAccount } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { marketingKeys, useSocialAccounts } from "@/features/staff/api/marketing-queries";
import { platformLabels } from "@/features/staff/lib/marketing-labels";
import { getApiErrorMessage } from "@/lib/api-error";
import * as marketingService from "@/services/marketing.service";
import { usePartnerMutation } from "../api/partner-queries";
import { ConfirmDialog, ErrorPanel, FormAlert, PartnerPanel, StatusBadge, usePartnerHotel } from "../components";
import { formatDateTime } from "../lib/labels";

export const FACEBOOK_CONNECT_HOTEL_KEY = "stayreco-facebook-connect-hotel";

export function SocialAccountsPanel({ hotelId }: { hotelId: string }) {
  const { canEdit } = usePartnerHotel();
  const accounts = useSocialAccounts(hotelId);
  const [toRemove, setToRemove] = useState<SocialAccount>();
  const [redirecting, setRedirecting] = useState(false);
  const [connectError, setConnectError] = useState<string>();

  const disconnect = usePartnerMutation(
    (account: SocialAccount) => marketingService.disconnectSocialAccount(account.id),
    {
      invalidate: () => [marketingKeys.accounts(hotelId)],
      successMessage: "Đã ngắt kết nối trang.",
      onSuccess: () => setToRemove(undefined),
    },
  );

  async function connectFacebook() {
    setConnectError(undefined);
    setRedirecting(true);
    try {
      const { authorizeUrl } = await marketingService.getFacebookAuthorizeUrl(hotelId);
      try {
        window.sessionStorage.setItem(FACEBOOK_CONNECT_HOTEL_KEY, hotelId);
      } catch {}
      window.location.assign(authorizeUrl);
    } catch (error) {
      setConnectError(getApiErrorMessage(error));
      setRedirecting(false);
    }
  }

  return (
    <PartnerPanel className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-bold text-primary">Trang mạng xã hội</h2>
          <p className="text-xs text-muted-foreground">
            Bài đã duyệt được đăng lên các trang này theo lịch nhân viên đặt.
          </p>
        </div>
        {canEdit && (
          <Button className="shrink-0" onClick={() => void connectFacebook()} disabled={redirecting}>
            <Link2 />
            {redirecting ? "Đang chuyển tới Facebook…" : "Kết nối Facebook"}
          </Button>
        )}
      </div>
      <div className="mt-3">
        <FormAlert message={connectError} />
      </div>

      {accounts.isLoading ? (
        <Skeleton className="mt-3 h-20 w-full" />
      ) : accounts.error ? (
        <div className="mt-3">
          <ErrorPanel error={accounts.error} onRetry={() => void accounts.refetch()} />
        </div>
      ) : !accounts.data?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">Chưa kết nối trang nào.</p>
      ) : (
        <ul className="mt-3 divide-y rounded-xl border">
          {accounts.data.map((account) => (
            <li key={account.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                  {platformLabels[account.platform]}
                  <StatusBadge tone={account.usable ? "success" : "danger"}>
                    {account.usable ? "Đang dùng được" : "Hết hạn, cần kết nối lại"}
                  </StatusBadge>
                </p>
                <p className="text-xs text-muted-foreground">
                  ID {account.accountName}
                  {account.expiresAt && ` · Hết hạn ${formatDateTime(account.expiresAt)}`}
                </p>
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setToRemove(account)}>
                  <Unlink />
                  Ngắt kết nối
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => !open && setToRemove(undefined)}
        title="Ngắt kết nối trang?"
        description="Các bài đã lên lịch cho trang này sẽ không được đăng. Bạn có thể kết nối lại bất cứ lúc nào."
        confirmLabel="Ngắt kết nối"
        destructive
        pending={disconnect.isPending}
        onConfirm={() => toRemove && disconnect.mutate(toRemove)}
      />
    </PartnerPanel>
  );
}
