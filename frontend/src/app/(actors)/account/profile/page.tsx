'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gender, UPLOAD_RULES, updateProfileSchema, type Account, type UpdateProfileInput } from '@stayreco/shared';
import { AlertTriangle, Calendar, Camera, CheckCircle2, Gift, Globe, Loader2, Luggage, Phone, Save, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { cn } from '@/lib/utils';
import { AccountPageHeader, accountContainer, notify } from '@/features/account/AccountShell';
import { SupportCard } from '@/features/account/SupportCard';
import { useMe, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '@/features/account/api/account-queries';
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from '@/lib/api-error';
import { useMyLoyalty, useMyVouchers } from '@/features/account/api/rewards-queries';
import { useMyBookings } from '@/features/booking/api/booking-queries';
import { TIER_LABELS, formatPoints } from '@/features/account/lib/rewards-labels';

type ProfileForm = {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender | '';
  nationality: string;
};

const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: Gender.MALE, label: 'Nam' },
  { value: Gender.FEMALE, label: 'Nữ' },
  { value: Gender.OTHER, label: 'Khác' },
];

/** Account states other than ACTIVE, worded for the customer (`Account.status`, docs/api/auth.md). */
const ACCOUNT_STATUS_NOTICE: Record<string, string> = {
  PENDING_VERIFICATION: 'Tài khoản đang chờ xác thực email.',
  INVITED: 'Tài khoản chưa được kích hoạt.',
  SUSPENDED: 'Tài khoản đang bị tạm khoá. Liên hệ hỗ trợ để biết thêm.',
  DEACTIVATED: 'Tài khoản đã bị vô hiệu hoá.',
  DELETED: 'Tài khoản đã bị xoá.',
};

function customerProfile(account: Account) {
  const profile = account.profile;
  return profile && 'gender' in profile ? profile : null;
}

function toForm(account: Account): ProfileForm {
  const profile = customerProfile(account);
  return {
    fullName: account.fullName,
    phone: account.phone ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
    gender: profile?.gender ?? '',
    nationality: profile?.nationality ?? '',
  };
}

/** Only the changed fields; an emptied optional field is sent as `null` to clear it. */
function diff(account: Account, form: ProfileForm): UpdateProfileInput {
  const initial = toForm(account);
  const changes: Record<string, string | null> = {};
  const fullName = form.fullName.trim();
  if (fullName !== initial.fullName) changes.fullName = fullName;
  for (const key of ['phone', 'dateOfBirth', 'gender', 'nationality'] as const) {
    const value = form[key].trim();
    if (value !== initial[key]) changes[key] = value === '' ? null : value;
  }
  return changes as UpdateProfileInput;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function ProfilePage() {
  const me = useMe();
  const account = me.data;

  return (
    <div className={cn(accountContainer.narrow, 'space-y-6')}>
      <AccountPageHeader
        title="Hồ sơ cá nhân"
        description="Thông tin liên lạc để khách sạn nhận diện và liên hệ khi bạn lưu trú."
      />

      {me.isLoading ? (
        <LoadingState rows={2} label="Đang tải hồ sơ…" />
      ) : !account ? (
        <ErrorState title="Không tải được hồ sơ" error={me.error} onRetry={() => void me.refetch()} />
      ) : (
        <ProfileEditor key={account.id} account={account} />
      )}

      <AccountSummary />
      <SupportCard note="Cần đổi email đăng nhập hoặc gặp sự cố với tài khoản? Liên hệ chúng tôi." />
    </div>
  );
}

function ProfileEditor({ account }: { account: Account }) {
  const [formData, setFormData] = useState<ProfileForm>(() => toForm(account));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();

  const changes = diff(account, formData);
  const dirty = Object.keys(changes).length > 0;
  const avatarBusy = uploadAvatar.isPending || removeAvatar.isPending;
  const isCustomer = account.role === 'CUSTOMER';
  const statusNotice = account.status === 'ACTIVE' ? null : (ACCOUNT_STATUS_NOTICE[account.status] ?? null);

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || updateProfile.isPending) return;
    setFormError(null);
    const parsed = validateWith(updateProfileSchema, changes);
    if (parsed.errors) {
      setFieldErrors(parsed.errors);
      return;
    }
    updateProfile.mutate(parsed.data, {
      onSuccess: (updated) => {
        setFormData(toForm(updated));
        setFieldErrors({});
        notify.success('Đã lưu hồ sơ');
      },
      onError: (err) => {
        setFieldErrors(getApiFieldErrors(err));
        setFormError(getApiErrorMessage(err));
      },
    });
  };

  const handleReset = () => {
    setFormData(toForm(account));
    setFieldErrors({});
    setFormError(null);
  };

  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError(null);
    if (!(UPLOAD_RULES.image.mimeTypes as readonly string[]).includes(file.type)) {
      setAvatarError('Ảnh đại diện phải là JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > UPLOAD_RULES.image.maxBytes) {
      setAvatarError(`Ảnh đại diện tối đa ${UPLOAD_RULES.image.maxBytes / 1024 / 1024} MB.`);
      return;
    }
    uploadAvatar.mutate(file, {
      onSuccess: () => notify.success('Đã cập nhật ảnh đại diện'),
      onError: (err) => setAvatarError(getApiErrorMessage(err)),
    });
  };

  const handleRemoveAvatar = () => {
    setAvatarError(null);
    removeAvatar.mutate(undefined, {
      onSuccess: () => notify.success('Đã gỡ ảnh đại diện'),
      onError: (err) => setAvatarError(getApiErrorMessage(err)),
    });
  };

  return (
    <Card className="space-y-8 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-8">
      {statusNotice && (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {statusNotice}
        </p>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-start gap-5 rounded-xl border border-border bg-muted/50 p-5 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          {account.avatarUrl ? (
            <Image
              src={account.avatarUrl}
              alt={`Ảnh đại diện của ${account.fullName}`}
              width={80}
              height={80}
              className="size-20 rounded-full object-cover shadow-xs"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary shadow-xs">
              {initialsOf(account.fullName) || <User className="size-8" />}
            </div>
          )}
          {avatarBusy && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
              <Loader2 className="size-5 animate-spin text-primary" aria-label="Đang xử lý ảnh" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-base font-bold text-foreground">{account.fullName}</h2>
          <p className="text-xs text-muted-foreground">
            JPG, PNG hoặc WebP, tối đa {UPLOAD_RULES.image.maxBytes / 1024 / 1024} MB.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept={UPLOAD_RULES.image.mimeTypes.join(',')}
            className="hidden"
            onChange={handleAvatarSelected}
            aria-label="Chọn ảnh đại diện"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={avatarBusy}
              onClick={() => fileInput.current?.click()}
              className="h-10 gap-1.5 whitespace-nowrap"
            >
              <Camera className="size-4" /> {account.avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </Button>
            {account.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                disabled={avatarBusy}
                onClick={handleRemoveAvatar}
                className="h-10 whitespace-nowrap text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Gỡ ảnh
              </Button>
            )}
          </div>
          {avatarError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {avatarError}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field id="fullName" label="Họ và tên" required error={fieldErrors.fullName} hint="Như trên CCCD hoặc hộ chiếu.">
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
              aria-invalid={!!fieldErrors.fullName}
              aria-describedby="fullName-hint"
              autoComplete="name"
              className="h-11 text-sm font-medium"
              required
            />
          </Field>

          <Field
            id="email"
            label="Email đăng nhập"
            hint="Nhận voucher và hoá đơn. Không đổi được."
            adornment={
              account.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="size-3.5" aria-hidden /> Đã xác thực
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="size-3.5" aria-hidden /> Chưa xác thực
                </span>
              )
            }
          >
            <Input
              id="email"
              type="email"
              value={account.email}
              readOnly
              aria-describedby="email-hint"
              className="h-11 bg-muted text-sm font-medium text-muted-foreground"
            />
          </Field>

          <Field id="phone" label="Số điện thoại" error={fieldErrors.phone} hint="Khách sạn gọi khi cần hỗ trợ nhận phòng.">
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="0901234567"
                aria-invalid={!!fieldErrors.phone}
                aria-describedby="phone-hint"
                className="h-11 pr-10 text-sm font-medium"
              />
              <Phone className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            </div>
          </Field>

          {isCustomer && (
            <>
              <Field id="dateOfBirth" label="Ngày sinh" error={fieldErrors.dateOfBirth}>
                <div className="relative">
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setField('dateOfBirth', e.target.value)}
                    min="1900-01-01"
                    autoComplete="bday"
                    aria-invalid={!!fieldErrors.dateOfBirth}
                    aria-describedby="dateOfBirth-hint"
                    className="h-11 pr-10 text-sm font-medium"
                  />
                  <Calendar className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                </div>
              </Field>

              <Field id="gender" label="Giới tính" error={fieldErrors.gender}>
                <div
                  role="radiogroup"
                  aria-label="Giới tính"
                  aria-describedby="gender-hint"
                  className="flex h-11 items-center justify-around rounded-lg border border-border bg-muted/50 px-1 text-sm font-semibold text-foreground"
                >
                  {genderOptions.map((option) => (
                    <label key={option.value} className="flex h-10 cursor-pointer items-center gap-1.5 px-3">
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={formData.gender === option.value}
                        onChange={() => setField('gender', option.value)}
                        className="accent-primary"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field id="nationality" label="Quốc tịch" error={fieldErrors.nationality} hint="Dùng khi khai báo lưu trú.">
                <div className="relative">
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setField('nationality', e.target.value)}
                    placeholder="Việt Nam"
                    autoComplete="country-name"
                    aria-invalid={!!fieldErrors.nationality}
                    aria-describedby="nationality-hint"
                    className="h-11 pr-10 text-sm font-medium"
                  />
                  <Globe className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                </div>
              </Field>
            </>
          )}
        </div>

        {/* Stays in view at the bottom of the screen while there is something to save. */}
        <div
          className={cn(
            'flex items-center gap-3 border-t border-border pt-4',
            dirty && 'sticky bottom-0 -mx-5 bg-card px-5 pb-4 sm:-mx-8 sm:px-8',
          )}
        >
          <Button
            type="submit"
            disabled={!dirty || updateProfile.isPending}
            className="h-11 gap-2 px-6 font-bold whitespace-nowrap"
          >
            {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {updateProfile.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
          {dirty && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={updateProfile.isPending}
              className="h-11 px-4 whitespace-nowrap"
            >
              Huỷ thay đổi
            </Button>
          )}
          {formError && (
            <p role="alert" className="min-w-0 text-sm font-medium text-destructive">
              {formError}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}

/** StayMiles, trips and vouchers at a glance, each a way into its own page. */
function AccountSummary() {
  const loyalty = useMyLoyalty().data;
  // Counts only: one row per list is enough to read `meta.total`.
  const endedTrips = useMyBookings({ tab: 'completed', page: 1, pageSize: 1 }).data?.meta.total;
  const usableVouchers = useMyVouchers({ page: 1, pageSize: 1, active: true }).data?.meta.total;

  const tiles = [
    {
      href: '/account/rewards',
      icon: Sparkles,
      label: loyalty ? `${loyalty.programName} · Hạng ${TIER_LABELS[loyalty.tier]}` : 'Điểm StayMiles',
      value: loyalty ? formatPoints(loyalty.pointsBalance) : '—',
    },
    {
      href: '/account/bookings',
      icon: Luggage,
      // The "completed" tab also holds no-shows, so the label says ended rather than successful.
      label: 'Chuyến đi đã kết thúc',
      value: endedTrips === undefined ? '—' : `${endedTrips} chuyến`,
    },
    {
      href: '/account/rewards',
      icon: Gift,
      label: 'Voucher còn dùng được',
      value: usableVouchers === undefined ? '—' : `${usableVouchers} voucher`,
    },
  ];

  return (
    <section aria-label="Tóm tắt tài khoản" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link
            key={tile.label}
            href={tile.href}
            className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs text-muted-foreground">{tile.label}</span>
              <span className="block text-sm font-bold text-foreground">{tile.value}</span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  adornment,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  adornment?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-semibold">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {adornment}
      </div>
      {children}
      {error ? (
        <p id={`${id}-hint`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
