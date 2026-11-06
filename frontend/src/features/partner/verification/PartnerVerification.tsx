'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Building2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Landmark,
  PencilLine,
  Plus,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { REQUIRED_VERIFICATION_DOCUMENTS, type Hotel, type VerificationRequest } from '@stayreco/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/lib/auth-store';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import * as partnerService from '@/services/partner.service';
import { useHotel, useVerificationRequest, useVerificationRequests } from '../api/partner-queries';
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
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
import { CreateHotelDialog } from './CreateHotelDialog';
import { ListingJourney } from './ListingJourney';
import { VerificationWizard } from './VerificationWizard';

export default function PartnerVerification() {
  const { hotel, hotels, isLoading, error, refetch, isSuspended } = usePartnerHotel();
  const [createOpen, setCreateOpen] = useState(false);
  // Any partner may add a hotel; one who is only staff of every listed hotel is not a hotel owner.
  const canCreate = !isSuspended && (hotels.length === 0 || hotels.some((item) => item.myRole === 'OWNER'));

  return (
    <div className="space-y-6">
      <PartnerTitle
        title="Hồ sơ & xác minh"
        description="Thêm khách sạn, gửi hồ sơ pháp lý và theo dõi kết quả thẩm định để bắt đầu mở bán trên StayReco."
        action={
          canCreate &&
          hotels.length > 0 && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              Thêm khách sạn
            </Button>
          )
        }
      />
      {isSuspended && <SuspendedBanner />}
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refetch} />
      ) : !hotel || hotels.length === 0 ? (
        <OnboardingPanel canCreate={canCreate} onCreate={() => setCreateOpen(true)} />
      ) : (
        <VerificationWorkspace key={hotel.id} hotelId={hotel.id} />
      )}
      <CreateHotelDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

const onboardingSteps: Array<{ icon: LucideIcon; title: string; description: string }> = [
  { icon: Building2, title: 'Thêm khách sạn', description: 'Tên, địa chỉ và thông tin liên hệ. Khoảng 2 phút.' },
  { icon: PencilLine, title: 'Hoàn thiện thông tin', description: 'Tiện ích, chính sách, hình ảnh và các loại phòng.' },
  { icon: ShieldCheck, title: 'Gửi hồ sơ xác minh', description: 'Giấy tờ pháp lý và tài khoản nhận tiền đối soát.' },
];

/** First visit: explains the whole path before asking for anything. */
function OnboardingPanel({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return (
    <PartnerPanel className="overflow-hidden p-0">
      <div className="bg-primary/5 px-5 py-8 text-center sm:px-8">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Building2 size={26} />
        </span>
        <h2 className="mt-4 text-xl font-bold text-primary">Đưa khách sạn của bạn lên StayReco</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Chỉ với 3 bước. Bạn có thể lưu và quay lại bất cứ lúc nào, khách sạn chỉ hiển thị với khách sau khi hồ sơ
          được duyệt.
        </p>
        {canCreate && (
          <Button size="lg" className="mt-5" onClick={onCreate}>
            <Plus />
            Thêm khách sạn đầu tiên
          </Button>
        )}
      </div>
      <ol className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        {onboardingSteps.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-xl border border-border/70 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <step.icon size={18} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bước {index + 1}</p>
              <strong className="block text-sm text-primary">{step.title}</strong>
              <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </PartnerPanel>
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
    <div className="space-y-5">
      <ListingJourney hotel={hotel} latest={latest} />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <StatusPanel hotel={hotel} latest={latest} canEdit={canEdit} />
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
          {(hotel.status === 'DRAFT' || needsResubmit) && <PreparePanel />}
          <HistoryPanel requests={requests} />
        </aside>
      </section>
    </div>
  );
}

function StatusPanel({ hotel, latest, canEdit }: { hotel: Hotel; latest?: VerificationRequest; canEdit: boolean }) {
  const hotelStatus = hotelStatusLabels[hotel.status];

  return (
    <PartnerPanel className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Building2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold text-primary">{hotel.name}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {hotel.address}, {hotel.city}
          </p>
        </div>
        <StatusBadge tone={hotelStatus.tone}>{hotelStatus.label}</StatusBadge>
        {canEdit && (
          <Link href="/partner/hotel" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <PencilLine />
            Sửa thông tin
          </Link>
        )}
      </div>
      {!latest ? (
        <StatusMessage tone="info" icon={FileCheck2} title="Bước tiếp theo: gửi hồ sơ xác minh">
          Điền 4 bước bên dưới, khoảng 10 phút. Sau khi được duyệt, khách sạn chuyển sang trạng thái hoạt động và hiển
          thị với khách.
        </StatusMessage>
      ) : latest.status === 'PENDING' ? (
        <StatusMessage tone="warning" icon={Clock3} title="Hồ sơ đang được thẩm định">
          {verificationTypeLabels[latest.requestType]} gửi lúc {formatDateTime(latest.submittedAt)}. Thường mất 1–3 ngày
          làm việc, kết quả được gửi qua email. Trong lúc chờ, bạn vẫn có thể hoàn thiện phòng và hình ảnh.
        </StatusMessage>
      ) : latest.status === 'APPROVED' ? (
        <StatusMessage tone="success" icon={ShieldCheck} title="Hồ sơ đã được duyệt">
          Duyệt lúc {formatDateTime(latest.reviewedAt)}.
        </StatusMessage>
      ) : (
        <StatusMessage
          tone="danger"
          icon={TriangleAlert}
          title={latest.status === 'REJECTED' ? 'Hồ sơ bị từ chối' : 'StayReco yêu cầu bổ sung hồ sơ'}
        >
          {latest.reason && (
            <span className="mb-2 block whitespace-pre-line rounded-lg bg-card/70 p-3 text-foreground">
              <span className="mb-1 block text-xs font-semibold text-danger">
                Lý do ({formatDateTime(latest.reviewedAt)})
              </span>
              {latest.reason}
            </span>
          )}
          Thông tin cũ đã được điền sẵn. Chỉnh sửa theo góp ý, tải lại tài liệu và gửi hồ sơ mới bên dưới.
        </StatusMessage>
      )}
    </PartnerPanel>
  );
}

const messageTones = {
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
} as const;

function StatusMessage({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: keyof typeof messageTones;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" className={cn('flex items-start gap-3 rounded-xl p-4 text-sm', messageTones[tone])}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <strong className="block">{title}</strong>
        <div className="mt-1 opacity-90">{children}</div>
      </div>
    </div>
  );
}

/** What to have at hand before starting the form, so the partner does not stop halfway. */
function PreparePanel() {
  return (
    <PartnerPanel className="p-5">
      <Landmark className="text-primary" size={20} />
      <h2 className="mt-3 font-bold text-primary">Chuẩn bị trước khi gửi</h2>
      <p className="mt-1 text-xs text-muted-foreground">Bản scan hoặc ảnh chụp rõ nét, PDF/JPG/PNG tối đa 10 MB.</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {REQUIRED_VERIFICATION_DOCUMENTS.map((type) => (
          <li key={type} className="flex items-start gap-2">
            <FileCheck2 size={16} className="mt-0.5 shrink-0 text-primary" />
            {documentTypeLabels[type]}
          </li>
        ))}
        <li className="flex items-start gap-2">
          <FileCheck2 size={16} className="mt-0.5 shrink-0 text-primary" />
          Mã số thuế, thông tin người đại diện
        </li>
        <li className="flex items-start gap-2">
          <FileCheck2 size={16} className="mt-0.5 shrink-0 text-primary" />
          Tài khoản ngân hàng nhận tiền đối soát
        </li>
      </ul>
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
