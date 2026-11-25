"use client";

import { ErrorPanel, LoadingPanel, NoHotelPanel, PartnerTitle, SuspendedBanner, usePartnerHotel } from "../components";
import { ApprovalQueue } from "./ApprovalQueue";
import { BrandVoicePanel } from "./BrandVoicePanel";
import { SocialAccountsPanel } from "./SocialAccountsPanel";

export default function PartnerAiBrand() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Giọng thương hiệu AI"
        description="Dạy AI viết đúng giọng khách sạn, duyệt bài nhân viên soạn và kết nối trang để đăng bài."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <div key={hotel.id} className="space-y-6">
          <ApprovalQueue hotelId={hotel.id} />
          <BrandVoicePanel hotelId={hotel.id} />
          <SocialAccountsPanel hotelId={hotel.id} />
        </div>
      )}
    </div>
  );
}
