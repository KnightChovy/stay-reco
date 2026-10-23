'use client';

import { useState } from 'react';
import { Clock3, ExternalLink, FileText, Landmark, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { Hotel, VerificationRequest } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/lib/auth-store';
import { getApiErrorMessage } from '@/lib/api-error';
import * as partnerService from '@/services/partner.service';
import { useHotel, useVerificationRequest, useVerificationRequests } from '../api/partner-queries';
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  NoHotelPanel,
  PartnerPanel,
  PartnerTitle,
  StatusBadge,
  SuspendedBanner,
  usePartnerActions,
  usePartnerHotel,
} from '../components';
import {
  documentTypeLabels,
  formatDateTime,
  hotelStatusLabels,
  verificationStatusLabels,
  verificationTypeLabels,
} from '../lib/labels';
import { VerificationWizard } from './VerificationWizard';

export default function PartnerVerification() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Xác minh hồ sơ đối tác khách sạn"
        description="Hoàn thiện từng bước để StayReco xác thực pháp nhân, cơ sở lưu trú và quyền mở bán. Kết quả được gửi qua email."
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <NoHotelPanel />
      ) : (
        <VerificationWorkspace key={hotel.id} hotelId={hotel.id} />
      )}
    </div>
  );
}

function VerificationWorkspace({ hotelId }: { hotelId: string }) {
  const { canEdit } = usePartnerHotel();
  const email = useAuthStore((state) => state.user?.email ?? '');
  const hotelQuery = useHotel(hotelId);
  const requestsQuery = useVerificationRequests(hotelId);
  const [wizardOpen, setWizardOpen] = useState(false);
  const requests = requestsQuery.data ?? [];
  const latest = requests[0];
  // The history masks account and ID numbers; the detail is fetched to pre-fill a re-submission.
  const needsResubmit = latest && (latest.status === 'NEEDS_REVISION' || latest.status === 'REJECTED');
  const previousQuery = useVerificationRequest(needsResubmit ? latest.id : undefined);

  if (hotelQuery.isLoading || requestsQuery.isLoading) return <LoadingPanel rows={4} />;
  if (hotelQuery.error || !hotelQuery.data) {
    return <ErrorPanel error={hotelQuery.error} onRetry={() => void hotelQuery.refetch()} />;
  }
  if (requestsQuery.error) return <ErrorPanel error={requestsQuery.error} onRetry={() => void requestsQuery.refetch()} />;

  const hotel = hotelQuery.data;
  const isPending = latest?.status === 'PENDING';
  const canSubmit = canEdit && !isPending && hotel.status !== 'SUSPENDED';
  // A draft hotel, or one sent back for changes, goes straight to the form; an active hotel opens it on demand (UPDATE).
  const showWizard = canSubmit && (hotel.status === 'DRAFT' || needsResubmit || wizardOpen);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.5fr_.72fr]">
      <div className="min-w-0 space-y-5">
        <StatusPanel hotel={hotel} latest={latest} />
        {showWizard ? (
          needsResubmit && previousQuery.isLoading ? (
            <LoadingPanel rows={4} />
          ) : (
            <VerificationWizard
              key={latest?.id ?? 'first'}
              hotel={hotel}
              email={email}
              previous={previousQuery.data}
              onSubmitted={() => setWizardOpen(false)}
            />
          )
        ) : (
          canSubmit &&
          hotel.status === 'ACTIVE' && (
            <PartnerPanel className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-muted-foreground">
                Thông tin pháp lý hoặc tài khoản thụ hưởng thay đổi? Gửi hồ sơ cập nhật để StayReco thẩm định lại.
              </p>
              <Button variant="outline" onClick={() => setWizardOpen(true)}>
                <ShieldCheck />
                Gửi hồ sơ cập nhật
              </Button>
            </PartnerPanel>
          )
        )}
      </div>
      <aside className="space-y-5">
        <HistoryPanel requests={requests} />
        <PartnerPanel className="p-5">
          <Landmark className="text-primary" size={20} />
          <h2 className="mt-3 font-bold text-primary">Phạm vi xác minh</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>✓ Tư cách pháp nhân kinh doanh lưu trú</li>
            <li>✓ Điều kiện an ninh trật tự, PCCC</li>
            <li>✓ Quyền quản lý và mở bán cơ sở</li>
            <li>✓ Tài khoản nhận tiền đối soát</li>
          </ul>
        </PartnerPanel>
      </aside>
    </section>
  );
}

function StatusPanel({ hotel, latest }: { hotel: Hotel; latest?: VerificationRequest }) {
  const hotelStatus = hotelStatusLabels[hotel.status];

  return (
    <PartnerPanel className="space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-bold text-primary">{hotel.name}</h2>
        <StatusBadge tone={hotelStatus.tone}>{hotelStatus.label}</StatusBadge>
      </div>
      {!latest ? (
        <p className="text-sm text-muted-foreground">
          Khách sạn chưa gửi hồ sơ xác minh. Sau khi được duyệt, khách sạn chuyển sang trạng thái hoạt động và hiển thị với
          khách.
        </p>
      ) : latest.status === 'PENDING' ? (
        <p className="flex items-start gap-2 rounded-xl bg-warning-soft p-4 text-sm text-warning">
          <Clock3 size={18} className="mt-0.5 shrink-0" />
          Hồ sơ {verificationTypeLabels[latest.requestType].toLowerCase()} gửi lúc {formatDateTime(latest.submittedAt)} đang
          chờ thẩm định. Bạn sẽ nhận kết quả qua email.
        </p>
      ) : latest.status === 'APPROVED' ? (
        <p className="flex items-start gap-2 rounded-xl bg-success-soft p-4 text-sm text-success">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          Hồ sơ đã được duyệt lúc {formatDateTime(latest.reviewedAt)}.
        </p>
      ) : (
        <div className="space-y-1 rounded-xl bg-danger-soft p-4 text-sm text-danger">
          <p className="flex items-start gap-2 font-semibold">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            {latest.status === 'REJECTED' ? 'Hồ sơ bị từ chối' : 'StayReco yêu cầu bổ sung hồ sơ'} (
            {formatDateTime(latest.reviewedAt)})
          </p>
          {latest.reason && <p className="whitespace-pre-line pl-6">{latest.reason}</p>}
          <p className="pl-6 text-xs">Chỉnh sửa thông tin, tải lại tài liệu và gửi hồ sơ mới bên dưới.</p>
        </div>
      )}
    </PartnerPanel>
  );
}

function HistoryPanel({ requests }: { requests: VerificationRequest[] }) {
  if (requests.length === 0) {
    return <EmptyPanel icon={FileText} title="Chưa có lịch sử" description="Các hồ sơ đã gửi và kết quả thẩm định sẽ hiển thị tại đây." />;
  }

  return (
    <PartnerPanel className="p-5">
      <h2 className="font-bold text-primary">Lịch sử hồ sơ</h2>
      <ol className="mt-4 space-y-4">
        {requests.map((request) => {
          const status = verificationStatusLabels[request.status];
          return (
            <li key={request.id} className="space-y-2 border-l-2 border-border pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm text-primary">{verificationTypeLabels[request.requestType]}</strong>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground">
                Gửi {formatDateTime(request.submittedAt)}
                {request.reviewedAt && ` · Xử lý ${formatDateTime(request.reviewedAt)}`}
              </p>
              {request.reason && <p className="whitespace-pre-line text-xs text-foreground">{request.reason}</p>}
              {request.beneficiary && (
                <p className="text-xs text-muted-foreground">
                  {request.beneficiary.bankName} · {request.beneficiary.accountNumber}
                </p>
              )}
              <ul className="space-y-1">
                {request.documents.map((document) => (
                  <li key={document.id}>
                    <DocumentLink documentId={document.id} label={documentTypeLabels[document.documentType]} />
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </PartnerPanel>
  );
}

/** Private file: ask for a fresh 5-minute signed link on every click. */
function DocumentLink({ documentId, label }: { documentId: string; label: string }) {
  const { showNotice } = usePartnerActions();
  const [opening, setOpening] = useState(false);

  async function open() {
    // Open the tab inside the click handler, before awaiting, so the popup is not blocked.
    const tab = window.open('', '_blank');
    setOpening(true);
    try {
      const link = await partnerService.getVerificationDocumentLink(documentId);
      if (tab) tab.location.href = link.url;
      else window.location.assign(link.url);
    } catch (error) {
      tab?.close();
      showNotice(getApiErrorMessage(error), 'error');
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={opening}
      className="inline-flex items-center gap-1.5 text-left text-xs font-semibold text-primary hover:underline disabled:opacity-60"
    >
      {opening ? <Spinner className="size-3" /> : <ExternalLink size={12} />}
      {label}
    </button>
  );
}
