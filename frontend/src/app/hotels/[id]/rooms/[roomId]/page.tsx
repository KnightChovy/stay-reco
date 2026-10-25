'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { RoomTypeDetail } from '@/features/stays/components/RoomTypeDetail';
import { parseStayQuery } from '@/features/stays/lib/params';

function RoomDetailContent() {
  const { id, roomId } = useParams<{ id: string; roomId: string }>();
  const searchParams = useSearchParams();
  return (
    <RoomTypeDetail
      hotelId={id}
      roomTypeId={roomId}
      query={parseStayQuery(new URLSearchParams(searchParams.toString()))}
    />
  );
}

export default function RoomDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#fbfaf8]">
          <Header />
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Đang tải hạng phòng…
          </div>
        </div>
      }
    >
      <RoomDetailContent />
    </Suspense>
  );
}
