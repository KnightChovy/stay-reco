'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gender, UPLOAD_RULES, updateProfileSchema, type Account, type UpdateProfileInput } from '@stayreco/shared';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import AccountSubNav from '@/features/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Loader2,
  Save,
  ArrowRight,
  Sparkles,
  Phone,
  Calendar,
  Globe,
  User,
  Gift,
  Headset,
} from 'lucide-react';

import {
  useMe,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from '@/features/account/api/account-queries';
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from '@/lib/api-error';

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
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />
      <ProfileBody
        key={account ? `${account.id}` : 'loading'}
        account={account}
        isLoading={me.isLoading}
        error={me.error}
        onRetry={() => void me.refetch()}
      />
      <Footer />
    </div>
  );
}

function ProfileBody({
  account,
  isLoading,
  error,
  onRetry,
}: {
  account: Account | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const [formData, setFormData] = useState<ProfileForm>(() =>
    account ? toForm(account) : { fullName: '', phone: '', dateOfBirth: '', gender: '', nationality: '' },
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
    if (!account || updateProfile.isPending) return;
    setFormError(null);

    const changes = diff(account, formData);
    if (Object.keys(changes).length === 0) {
      showToast('Không có thay đổi nào cần lưu.');
      return;
    }
    const parsed = validateWith(updateProfileSchema, changes);
    if (parsed.errors) {
      setFieldErrors(parsed.errors);
      return;
    }

    updateProfile.mutate(parsed.data, {
      onSuccess: (updated) => {
        setFormData(toForm(updated));
        setFieldErrors({});
        showToast('Thông tin hồ sơ cá nhân đã được cập nhật.');
      },
      onError: (err) => {
        setFieldErrors(getApiFieldErrors(err));
        setFormError(getApiErrorMessage(err));
      },
    });
  };

  const handleReset = () => {
    if (!account) return;
    setFormData(toForm(account));
    setFieldErrors({});
    setFormError(null);
  };

  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFormError(null);
    if (!(UPLOAD_RULES.image.mimeTypes as readonly string[]).includes(file.type)) {
      setFormError('Ảnh đại diện phải là JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > UPLOAD_RULES.image.maxBytes) {
      setFormError(`Ảnh đại diện tối đa ${UPLOAD_RULES.image.maxBytes / 1024 / 1024} MB.`);
      return;
    }
    uploadAvatar.mutate(file, {
      onSuccess: () => showToast('Ảnh đại diện đã được cập nhật.'),
      onError: (err) => setFormError(getApiErrorMessage(err)),
    });
  };

  const handleRemoveAvatar = () => {
    setFormError(null);
    removeAvatar.mutate(undefined, {
      onSuccess: () => showToast('Đã gỡ ảnh đại diện.'),
      onError: (err) => setFormError(getApiErrorMessage(err)),
    });
  };

  const avatarBusy = uploadAvatar.isPending || removeAvatar.isPending;
  const isCustomer = account?.role === 'CUSTOMER';

  return (
    <>
      <main className="flex-1 w-full bg-[#f7f9ff]">
        {/* Account Sub-navigation */}
        <AccountSubNav activeTab="profile" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Breadcrumbs */}
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Hồ sơ cá nhân', active: true },
            ]}
          />

          {/* Page Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#934a33] text-[11px] font-semibold uppercase tracking-wider">
                Tài khoản cá nhân
              </span>
              {account?.emailVerified && (
                <span className="text-xs text-muted-foreground">• Email đã xác thực</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Hồ sơ cá nhân</h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Quản lý thông tin định danh và liên lạc để nhận xác nhận đặt phòng và dịch vụ lưu trú chu đáo nhất từ StayReco.
            </p>
          </div>

          {/* Membership Banner */}
          <div className="w-full rounded-2xl bg-linear-to-r from-[#124b6d] via-[#193b56] to-[#ae583c] p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md relative overflow-hidden">
            <div className="flex items-center gap-4 z-10">
              <div className="size-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
                <Sparkles className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">StayReco Elite Bạc</h3>
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                    Cấp 2/4
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  Mã hội viên: <span className="font-mono font-bold text-white">SR-99482</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-between md:justify-end">
              <div className="text-left md:text-right">
                <span className="text-[11px] text-white/70 block">Điểm tích lũy hiện tại</span>
                <span className="text-sm font-bold text-white">2.450 Điểm StayMiles</span>
              </div>
              <Link href="/account/rewards">
                <Button className="h-9 px-4 bg-white text-primary hover:bg-slate-100 font-semibold text-xs shrink-0">
                  Đổi quà
                </Button>
              </Link>
            </div>
          </div>

          {/* Main Card */}
          {isLoading ? (
            <Card className="p-10 bg-white border border-border shadow-xs rounded-2xl flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Đang tải hồ sơ...
            </Card>
          ) : !account ? (
            <Card className="p-8 bg-white border border-border shadow-xs rounded-2xl flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="size-8 text-amber-600" />
              <p className="text-sm text-muted-foreground">
                {getApiErrorMessage(error, 'Không tải được hồ sơ. Vui lòng thử lại.')}
              </p>
              <Button variant="outline" onClick={onRetry} className="h-9 text-xs font-semibold">
                Thử lại
              </Button>
            </Card>
          ) : (
          <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-8">
            {/* Avatar Module */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-xl bg-slate-50 border border-border">
              <div className="relative shrink-0">
                {account.avatarUrl ? (
                  <Image
                    src={account.avatarUrl}
                    alt={`Ảnh đại diện của ${account.fullName}`}
                    width={80}
                    height={80}
                    className="rounded-full object-cover size-20 shadow-xs"
                  />
                ) : (
                  <div className="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shadow-xs">
                    {initialsOf(account.fullName) || <User className="size-8" />}
                  </div>
                )}
                {avatarBusy && (
                  <span className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </span>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-foreground">{account.fullName}</h2>
                  <Badge className="bg-orange-50 text-[#934a33] border border-orange-200 hover:bg-orange-50 text-[10px] gap-1 font-bold">
                    <Sparkles className="size-3" /> Thành viên StayReco
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ JPG, PNG hoặc WebP (tối đa {UPLOAD_RULES.image.maxBytes / 1024 / 1024}MB). Ảnh rõ nét giúp lễ tân nhận diện khi làm thủ tục.
                </p>
                <input
                  ref={fileInput}
                  type="file"
                  accept={UPLOAD_RULES.image.mimeTypes.join(',')}
                  className="hidden"
                  onChange={handleAvatarSelected}
                  aria-label="Chọn ảnh đại diện"
                />
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={avatarBusy}
                    onClick={() => fileInput.current?.click()}
                    className="h-8 text-xs font-semibold gap-1.5"
                  >
                    <Camera className="size-3.5" /> {account.avatarUrl ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                  </Button>
                  {account.avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={avatarBusy}
                      onClick={handleRemoveAvatar}
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Gỡ ảnh
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="fullName" className="text-xs sm:text-sm font-semibold">
                      Họ và tên đầy đủ <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Khớp giấy tờ tùy thân</span>
                  </div>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setField('fullName', e.target.value)}
                    aria-invalid={!!fieldErrors.fullName}
                    className="h-11 text-sm focus-visible:ring-primary font-medium"
                    required
                  />
                  <FieldHint error={fieldErrors.fullName}>
                    Vui lòng nhập đúng như trên CMND/CCCD/Hộ chiếu để nhận phòng thuận lợi.
                  </FieldHint>
                </div>

                {/* Account Role */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-semibold">Vai trò tài khoản</Label>
                  <div className="h-11 px-3 bg-slate-100 rounded-lg flex items-center justify-between text-xs font-semibold text-foreground border border-border">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" /> Khách hàng (Customer)
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {account.status === 'ACTIVE' ? 'Đang hoạt động' : account.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Cấp phép truy cập tiêu chuẩn dành cho người lưu trú cá nhân.
                  </span>
                </div>

                {/* Email (read-only: the account's sign-in identity) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">
                      Email đăng nhập
                    </Label>
                    {account.emailVerified ? (
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                        Đã xác thực
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                        Chưa xác thực
                      </span>
                    )}
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={account.email}
                    readOnly
                    className="h-11 text-sm font-medium bg-slate-50 text-muted-foreground"
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    Dùng để nhận E-Voucher phòng và hóa đơn. Email đăng nhập không thể thay đổi.
                  </span>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold">
                    Số điện thoại
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      placeholder="0901234567"
                      aria-invalid={!!fieldErrors.phone}
                      className="h-11 text-sm focus-visible:ring-primary font-medium pr-10"
                    />
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                  <FieldHint error={fieldErrors.phone}>
                    Khách sạn sẽ liên lạc khi cần hỗ trợ đưa đón hoặc nhận phòng sớm.
                  </FieldHint>
                </div>

                {isCustomer && (
                  <>
                    {/* Date of birth */}
                    <div className="space-y-1.5">
                      <Label htmlFor="dateOfBirth" className="text-xs sm:text-sm font-semibold">
                        Ngày sinh
                      </Label>
                      <div className="relative">
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setField('dateOfBirth', e.target.value)}
                          min="1900-01-01"
                          aria-invalid={!!fieldErrors.dateOfBirth}
                          className="h-11 text-sm focus-visible:ring-primary font-medium pr-10"
                        />
                        <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      </div>
                      <FieldHint error={fieldErrors.dateOfBirth}>
                        Dùng để nhận quà sinh nhật và ưu đãi đặc quyền thường niên.
                      </FieldHint>
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-semibold">Giới tính</Label>
                      <div
                        role="radiogroup"
                        aria-label="Giới tính"
                        className="h-11 px-3 bg-slate-50 rounded-lg flex items-center justify-around text-xs font-semibold text-foreground border border-border"
                      >
                        {genderOptions.map((option) => (
                          <label key={option.value} className="flex items-center gap-1.5 cursor-pointer">
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
                      <FieldHint error={fieldErrors.gender}>
                        Giúp khách sạn chuẩn bị bộ tiện ích phòng phù hợp.
                      </FieldHint>
                    </div>

                    {/* Nationality */}
                    <div className="space-y-1.5">
                      <Label htmlFor="nationality" className="text-xs sm:text-sm font-semibold">
                        Quốc tịch
                      </Label>
                      <div className="relative">
                        <Input
                          id="nationality"
                          value={formData.nationality}
                          onChange={(e) => setField('nationality', e.target.value)}
                          placeholder="Việt Nam"
                          aria-invalid={!!fieldErrors.nationality}
                          className="h-11 text-sm focus-visible:ring-primary font-medium pr-10"
                        />
                        <Globe className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      </div>
                      <FieldHint error={fieldErrors.nationality}>
                        Dùng cho thủ tục khai báo lưu trú tại khách sạn.
                      </FieldHint>
                    </div>
                  </>
                )}
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
                  {formError}
                </p>
              )}

              {/* Trust Box */}
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-start gap-3 text-xs">
                <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-foreground">Quyền riêng tư & Bảo vệ dữ liệu cá nhân</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Thông tin cá nhân chỉ được dùng cho việc đặt phòng và lưu trú của bạn.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="h-11 px-8 bg-primary text-primary-foreground hover:bg-[#193b56] font-bold text-xs sm:text-sm gap-2 shadow-sm"
                  >
                    {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    <span>{updateProfile.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={updateProfile.isPending}
                    className="h-11 px-5 text-xs sm:text-sm font-semibold"
                  >
                    Hủy thay đổi
                  </Button>
                </div>

                <Link href="/account/security" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  Chuyển sang Đổi mật khẩu & Bảo mật <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </form>
          </Card>
          )}

          {/* Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border border-border shadow-xs rounded-xl flex items-center gap-3">
              <div className="size-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Chuyến đi đã hoàn tất</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">8 Kỳ nghỉ thành công</span>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-border shadow-xs rounded-xl flex items-center gap-3">
              <div className="size-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Gift className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">E-Voucher khả dụng</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">3 Phiếu ưu đãi 15%</span>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-border shadow-xs rounded-xl flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Headset className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Chăm sóc khách hàng</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">Trợ lý riêng 24/7</span>
              </div>
            </Card>
          </div>

        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5"
        >
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold">Hồ sơ cá nhân</h4>
            <p className="text-[11px] text-white/80">{toastMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}

function FieldHint({ error, children }: { error?: string; children: React.ReactNode }) {
  return error ? (
    <span className="text-[11px] text-red-600 block" role="alert">
      {error}
    </span>
  ) : (
    <span className="text-[11px] text-muted-foreground block">{children}</span>
  );
}
