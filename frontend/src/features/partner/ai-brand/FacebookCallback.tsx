"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Link2 } from "lucide-react";
import type { FacebookExchange } from "@stayreco/shared";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { marketingKeys } from "@/features/staff/api/marketing-queries";
import { getApiErrorMessage } from "@/lib/api-error";
import * as marketingService from "@/services/marketing.service";
import { usePartnerMutation } from "../api/partner-queries";
import { FormAlert, PartnerPanel, PartnerTitle, SubmitButton, usePartnerHotel } from "../components";
import { FACEBOOK_CONNECT_HOTEL_KEY } from "./SocialAccountsPanel";

type Pick = { page: boolean; instagram: boolean };

function readStoredHotel() {
  try {
    return window.sessionStorage.getItem(FACEBOOK_CONNECT_HOTEL_KEY);
  } catch {
    return null;
  }
}

export default function FacebookCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hotel } = usePartnerHotel();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const denied = searchParams.get("error_description") ?? searchParams.get("error");
  const [result, setResult] = useState<{ hotelId: string; exchange: FacebookExchange }>();
  const [exchangeError, setExchangeError] = useState<string>();
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const started = useRef(false);

  useEffect(() => {
    if (started.current || denied || !code || !state) return;
    const targetHotel = readStoredHotel() ?? hotel?.id;
    if (!targetHotel) return;
    started.current = true;
    marketingService
      .exchangeFacebookCode(targetHotel, { code, state })
      .then((exchange) => {
        setResult({ hotelId: targetHotel, exchange });
        setPicks(Object.fromEntries(exchange.pages.map((page) => [page.pageId, { page: false, instagram: false }])));
      })
      .catch((error: unknown) => setExchangeError(getApiErrorMessage(error)));
  }, [code, state, denied, hotel?.id]);

  const connect = usePartnerMutation(
    () =>
      marketingService.connectFacebookPages(result!.hotelId, {
        connectionToken: result!.exchange.connectionToken,
        pages: Object.entries(picks)
          .filter(([, pick]) => pick.page)
          .map(([pageId, pick]) => ({ pageId, instagram: pick.instagram })),
      }),
    {
      invalidate: () => [marketingKeys.accounts(result?.hotelId ?? "")],
      successMessage: (accounts) => `Đã kết nối ${accounts.length} tài khoản.`,
      errorNotice: false,
      onSuccess: () => {
        try {
          window.sessionStorage.removeItem(FACEBOOK_CONNECT_HOTEL_KEY);
        } catch {}
        router.replace("/partner/ai-brand");
      },
    },
  );

  const exchange = result?.exchange;
  const chosen = Object.values(picks).filter((pick) => pick.page).length;
  const error = denied
    ? `Facebook không cấp quyền: ${denied}`
    : !code || !state
      ? "Thiếu mã xác thực từ Facebook. Hãy bắt đầu kết nối lại."
      : exchangeError;

  return (
    <div className="space-y-6">
      <PartnerTitle title="Kết nối trang Facebook" description="Chọn trang khách sạn sẽ đăng bài lên." />
      <PartnerPanel className="space-y-4 p-5">
        {error ? (
          <>
            <FormAlert message={error} />
            <Link href="/partner/ai-brand" className={buttonVariants({ variant: "outline" })}>
              Quay lại
            </Link>
          </>
        ) : !exchange ? (
          <Skeleton className="h-24 w-full" />
        ) : exchange.pages.length === 0 ? (
          <>
            <p className="text-sm text-muted-foreground">Tài khoản Facebook này không quản trị trang nào.</p>
            <Link href="/partner/ai-brand" className={buttonVariants({ variant: "outline" })}>
              Quay lại
            </Link>
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
                    <label className="flex items-center gap-2.5 text-sm font-semibold">
                      <Checkbox
                        checked={pick.page}
                        onCheckedChange={(checked) => update({ page: checked, instagram: checked && pick.instagram })}
                      />
                      {page.name}
                      {page.connected && <span className="text-xs font-normal text-muted-foreground">(kết nối lại)</span>}
                    </label>
                    {page.instagramId && (
                      <label className="ml-7 flex items-center gap-2.5 text-xs">
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
            <FormAlert message={connect.error ? getApiErrorMessage(connect.error) : undefined} />
            <div className="flex justify-end gap-2">
              <Link href="/partner/ai-brand" className={buttonVariants({ variant: "ghost" })}>
                Huỷ
              </Link>
              <SubmitButton
                type="button"
                pending={connect.isPending}
                disabled={chosen === 0 || connect.isPending}
                onClick={() => connect.mutate()}
              >
                <Link2 />
                Kết nối {chosen > 0 ? `${chosen} trang` : ""}
              </SubmitButton>
            </div>
          </>
        )}
      </PartnerPanel>
    </div>
  );
}
