"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useRecommendations } from "../api/recommendation-queries";
import { RecommendedHotelCard, RecommendedHotelSkeleton } from "./RecommendedHotelCard";

/**
 * "Gợi ý cho bạn" on the home page: the top four of the visitor's list. Hidden when the recommender has nothing yet or
 * the list fails: the page has other ways in, and an empty section would only say "nothing here".
 */
export function HomeRecommendations() {
  const isCustomer = useAuthStore((state) => state.user?.role === "customer");
  const query = useRecommendations({ limit: 4 });
  const items = query.data?.items ?? [];
  if (query.error || (query.data && items.length === 0)) return null;

  const personalized = !!query.data?.personalized;

  return (
    <section className="bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="mb-1 block text-xs font-bold tracking-wider text-[#d96a43] uppercase">
              {personalized ? "Dành riêng cho bạn" : "Gợi ý từ StayReco"}
            </span>
            <h2 className="text-2xl font-bold text-[#16364f] sm:text-3xl">
              {personalized ? "Chốn nghỉ hợp gu của bạn" : "Được khách yêu thích"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {query.data?.source === "PREFERENCES"
                ? "Xếp hạng ngay theo sở thích bạn vừa chọn."
                : personalized
                ? "Xếp hạng theo những lần lưu trú, đánh giá và sở thích của bạn."
                : isCustomer
                  ? "Danh sách riêng của bạn sẽ có sau lần cập nhật gợi ý tới."
                  : "Đăng nhập để nhận gợi ý theo sở thích của riêng bạn."}
            </p>
          </div>
          <Link
            href="/recommendations"
            className="inline-flex min-h-10 shrink-0 items-center text-sm font-semibold text-[#1b4360] hover:underline"
          >
            Xem tất cả gợi ý →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {query.isLoading
            ? [0, 1, 2, 3].map((item) => <RecommendedHotelSkeleton key={item} />)
            : items.map((hotel) => <RecommendedHotelCard key={hotel.id} hotel={hotel} />)}
        </div>
      </div>
    </section>
  );
}
