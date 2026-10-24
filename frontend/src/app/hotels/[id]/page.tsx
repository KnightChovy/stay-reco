'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { HotelDetail } from '@/features/stays/components/HotelDetail';
import { parseStayQuery } from '@/features/stays/lib/params';

function HotelDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  return (
    <HotelDetail
      hotelId={id}
      query={parseStayQuery(new URLSearchParams(searchParams.toString()))}
    />
  );
}

export default function HotelDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#fbfaf8]">
          <Header />
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Đang tải chỗ nghỉ…
          </div>
        </div>
      }
    >
      <HotelDetailContent />
    </Suspense>
  );
}
