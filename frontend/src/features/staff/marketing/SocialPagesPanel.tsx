"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Unlink } from "lucide-react";
import type { SocialAccount } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/features/stays/lib/format";
import * as marketingService from "@/services/marketing.service";
import { marketingKeys, useSocialAccounts } from "../api/marketing-queries";
import { getMarketingErrorMessage } from "../lib/marketing-errors";
import { ConfirmDialog, PlatformPill } from "./MarketingParts";

/** Which hotel the Facebook round trip was started for, read back by the callback page. */
export const FACEBOOK_CONNECT_HOTEL_KEY = "stayreco-facebook-connect-hotel";

/**
 * The hotel's social pages: list, connect a Facebook page (and its Instagram) through Facebook, disconnect.
 * Staff with MARKETING run this; the owner no longer has a screen for it (docs/api/marketing.md).
 */
export function SocialPagesPanel({ hotelId }: { hotelId: string | undefined }) {
  const queryClient = useQueryClient();
  const accountsQuery = useSocialAccounts(hotelId);
  const [toRemove, setToRemove] = useState<SocialAccount>();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string>();

  const disconnect = useMutation({
    mutationFn: (account: SocialAccount) => marketingService.disconnectSocialAccount(account.id),
    onSuccess: () => {
      setToRemove(undefined);
      void queryClient.invalidateQueries({ queryKey: marketingKeys.accounts(hotelId ?? "") });
      // Disconnecting cancels what was waiting for that page.
      void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "schedules"] });
      void queryClient.invalidateQueries({ queryKey: [...marketingKeys.all, "contents"] });
    },
    onError: (cause) => {
      setToRemove(undefined);
      setError(getMarketingErrorMessage(cause, "Không ngắt kết nối được. Vui lòng thử lại."));
    },
  });

  async function connectFacebook() {
    if (!hotelId) return;
    setError(undefined);
    setRedirecting(true);
    try {
      const { authorizeUrl } = await marketingService.getFacebookAuthorizeUrl(hotelId);
      try {
        window.sessionStorage.setItem(FACEBOOK_CONNECT_HOTEL_KEY, hotelId);
      } catch {}
      window.location.assign(authorizeUrl);
    } catch (cause) {
      setError(getMarketingErrorMessage(cause, "Không mở được Facebook. Vui lòng thử lại."));
      setRedirecting(false);
    }
  }

  const accounts = accountsQuery.data ?? [];

  return (
    <aside className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Link2 className="size-4 text-primary" aria-hidden /> Kênh đã kết nối
      </h2>
      <Button className="h-10 w-full gap-1.5" onClick={() => void connectFacebook()} disabled={!hotelId || redirecting}>
        {redirecting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
        {redirecting ? "Đang chuyển tới Facebook…" : "Kết nối Facebook"}
      </Button>
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {accountsQuery.isLoading ? (
        <Skeleton className="h-16 rounded-lg" />
      ) : accountsQuery.error ? (
        <p className="text-xs text-destructive">{getMarketingErrorMessage(accountsQuery.error)}</p>
      ) : accounts.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Chưa có trang nào. Bấm “Kết nối Facebook”, đăng nhập tài khoản quản trị trang của khách sạn rồi chọn trang.
        </p>
      ) : (
        <ul className="space-y-2">
          {accounts.map((account) => (
            <li key={account.id} className="space-y-1 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <PlatformPill platform={account.platform} />
                <span className={cn("text-xs font-semibold", account.usable ? "text-emerald-700" : "text-destructive")}>
                  {account.usable ? "Đang hoạt động" : "Hết hạn, cần kết nối lại"}
                </span>
              </div>
              <p className="font-mono text-xs text-foreground">{account.accountName}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {account.expiresAt ? `Hết hạn ${formatDateTime(account.expiresAt)}` : "Không có hạn token"}
                </p>
                <Button variant="ghost" size="sm" className="h-10 shrink-0 gap-1 text-destructive" onClick={() => setToRemove(account)}>
                  <Unlink className="size-3.5" aria-hidden /> Ngắt
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">TikTok chỉ nhận video nên chưa hỗ trợ đăng bài.</p>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => !open && setToRemove(undefined)}
        title="Ngắt kết nối trang?"
        description="Các bài đã lên lịch cho trang này sẽ không được đăng. Có thể kết nối lại bất cứ lúc nào."
        confirmLabel="Ngắt kết nối"
        pending={disconnect.isPending}
        onConfirm={() => toRemove && disconnect.mutate(toRemove)}
      />
    </aside>
  );
}
