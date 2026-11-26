"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Share2 } from "lucide-react";
import type { FacebookExchange } from "@stayreco/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import * as marketingService from "@/services/marketing.service";
import { useStaffHotel } from "../components/StaffHotelProvider";
import { marketingKeys } from "../api/marketing-queries";
import { getMarketingErrorMessage } from "../lib/marketing-errors";
import { MarketingHeader } from "./MarketingParts";
import { FACEBOOK_CONNECT_HOTEL_KEY } from "./SocialPagesPanel";

type Pick = { page: boolean; instagram: boolean };

const BACK = "/staff/marketing/calendar";

function readStoredHotel() {
  try {
    return window.sessionStorage.getItem(FACEBOOK_CONNECT_HOTEL_KEY);
  } catch {
    return null;
  }
}

/**
 * Where Facebook sends the browser back (`META_OAUTH_REDIRECT_URI`): posts `code` and `state` to `facebook/exchange`
 * inside the staff member's session, then lets them pick which of the pages they administer to connect.
 */
export function FacebookCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hotel } = useStaffHotel();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const denied = searchParams.get("error_description") ?? searchParams.get("error");
  const [result, setResult] = useState<{ hotelId: string; exchange: FacebookExchange }>();
  const [exchangeError, setExchangeError] = useState<string>();
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const started = useRef(false);
  const hotelId = hotel?.summary.id;

  useEffect(() => {
    if (started.current || denied || !code || !state) return;
    const targetHotel = readStoredHotel() ?? hotelId;
    if (!targetHotel) return;
    started.current = true;
    marketingService
      .exchangeFacebookCode(targetHotel, { code, state })
      .then((exchange) => {
        setResult({ hotelId: targetHotel, exchange });
        setPicks(Object.fromEntries(exchange.pages.map((page) => [page.pageId, { page: false, instagram: false }])));
      })
      .catch((error: unknown) => setExchangeError(getMarketingErrorMessage(error)));
  }, [code, state, denied, hotelId]);

  const connect = useMutation({
    mutationFn: () =>
      marketingService.connectFacebookPages(result!.hotelId, {
        connectionToken: result!.exchange.connectionToken,
        pages: Object.entries(picks)
          .filter(([, pick]) => pick.page)
          .map(([pageId, pick]) => ({ pageId, instagram: pick.instagram })),
      }),
    onSuccess: () => {
      try {
        window.sessionStorage.removeItem(FACEBOOK_CONNECT_HOTEL_KEY);
      } catch {}
      void queryClient.invalidateQueries({ queryKey: marketingKeys.accounts(result?.hotelId ?? "") });
      router.replace(BACK);
    },
  });

  const exchange = result?.exchange;
  const chosen = Object.values(picks).filter((pick) => pick.page).length;
  const error = denied
    ? `Facebook không cấp quyền: ${denied}`
    : !code || !state
      ? "Thiếu mã xác thực từ Facebook. Hãy bắt đầu kết nối lại."
      : exchangeError;
  const back = (
    <Link href={BACK} className={buttonVariants({ variant: "outline", className: "h-10" })}>
      Quay lại
    </Link>
  );

  return (
    <div className="space-y-5">
      <MarketingHeader
        title="Kết nối trang Facebook"
        icon={<Share2 className="size-7 shrink-0 text-primary" aria-hidden />}
        crumbs={[{ label: "Lịch đăng", href: BACK }, { label: "Kết nối Facebook" }]}
        description="Chọn trang của khách sạn mà bài sẽ được đăng lên."
      />
      <section className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-4 shadow-2xs sm:p-5">
        {error ? (
          <>
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
            {back}
          </>
        ) : !exchange ? (
          <Skeleton className="h-24 w-full" />
        ) : exchange.pages.length === 0 ? (
          <>
            <p className="text-sm text-muted-foreground">Tài khoản Facebook này không quản trị trang nào.</p>
            {back}
          </>
        ) : (
          <>
            <ul className="divide-y rounded-xl border">
              {exchange.pages.map((page) => {
                const pick = picks[page.pageId] ?? { page: false, instagram: false };
                const update = (next: Partial<Pick>) =>
                  setPicks((current) => ({ ...current, [page.pageId]: { ...pick, ...next } }));
                return (
                  <li key={page.pageId} className="space-y-2 px-4 py-3">
                    <label className="flex min-h-10 items-center gap-2.5 text-sm font-semibold">
                      <Checkbox
                        checked={pick.page}
                        onCheckedChange={(checked) => update({ page: checked, instagram: checked && pick.instagram })}
                      />
                      {page.name}
                      {page.connected && <span className="text-xs font-normal text-muted-foreground">(kết nối lại)</span>}
                    </label>
                    {page.instagramId && (
                      <label className="ml-7 flex min-h-10 items-center gap-2.5 text-xs">
                        <Checkbox
                          checked={pick.instagram}
                          disabled={!pick.page}
                          onCheckedChange={(checked) => update({ instagram: checked })}
                        />
                        Kết nối cả Instagram liên kết với trang
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
            {connect.error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
                {getMarketingErrorMessage(connect.error)}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Link href={BACK} className={buttonVariants({ variant: "ghost", className: "h-10" })}>
                Huỷ
              </Link>
              <Button className="h-10 gap-1.5" disabled={chosen === 0 || connect.isPending} onClick={() => connect.mutate()}>
                {connect.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
                Kết nối {chosen > 0 ? `${chosen} trang` : ""}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
