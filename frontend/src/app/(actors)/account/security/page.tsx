'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { changePasswordSchema, type SessionInfo } from '@stayreco/shared';
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
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  Smartphone,
  Laptop,
  Mail,
  Phone,
  Loader2,
  LogOut,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import {
  useChangePassword,
  useLogoutAll,
  useMe,
  useRevokeSession,
  useSessions,
} from '@/features/account/api/account-queries';
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';

/** "Chrome trên macOS" from a user agent; good enough to recognise one's own devices. */
function describeDevice(userAgent: string | null) {
  if (!userAgent) return { label: 'Thiết bị không xác định', mobile: false };
  const ua = userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : /okhttp|Dart|Expo|CFNetwork/i.test(ua)
              ? 'Ứng dụng StayReco'
              : 'Trình duyệt';
  const os = /iPhone|iPad/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Mac OS X|Macintosh/.test(ua)
        ? 'macOS'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Linux/.test(ua)
            ? 'Linux'
            : null;
  return {
    label: os ? `${browser} trên ${os}` : browser,
    mobile: /iPhone|iPad|Android|Mobile/.test(ua),
  };
}

function lastUsed(session: SessionInfo) {
  return formatDistanceToNow(new Date(session.lastUsedAt), { addSuffix: true, locale: vi });
}

export default function SecurityPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const me = useMe();
  const sessions = useSessions();
  const changePassword = useChangePassword();
  const revokeSession = useRevokeSession();
  const logoutAll = useLogoutAll();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Validation rules (the backend requires at least 8 characters with a letter and a digit)
  const hasMinLength = newPassword.length >= 8;
  const hasLetterAndNum = /[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const strengthScore = [hasMinLength, hasLetterAndNum, hasSpecial, isMatch].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!newPassword) return 'Chưa nhập';
    if (strengthScore <= 1) return 'Yếu';
    if (strengthScore === 2) return 'Trung bình';
    if (strengthScore === 3) return 'Khá';
    return 'Rất mạnh';
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (changePassword.isPending) return;
    setPasswordError(null);

    const parsed = validateWith(changePasswordSchema, { currentPassword, newPassword });
    const errors: FieldErrors = { ...(parsed.errors ?? {}) };
    if (!isMatch) errors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.';
    if (newPassword && newPassword === currentPassword) {
      errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
    }
    if (Object.keys(errors).length > 0 || !parsed.data) {
      setFieldErrors(errors);
      return;
    }

    changePassword.mutate(parsed.data, {
      onSuccess: () => {
        setFieldErrors({});
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Mật khẩu đã được cập nhật. Các thiết bị khác đã được đăng xuất.');
      },
      onError: (err) => {
        const fields = getApiFieldErrors(err);
        setFieldErrors(fields);
        setPasswordError(getApiErrorMessage(err));
      },
    });
  };

  const handleRevoke = (sessionId: string) => {
    setSessionError(null);
    revokeSession.mutate(sessionId, {
      onSuccess: () => showToast('Đã đăng xuất thiết bị.'),
      onError: (err) => {
        setSessionError(getApiErrorMessage(err));
        void sessions.refetch();
      },
    });
  };

  const handleLogoutAll = () => {
    if (!window.confirm('Đăng xuất khỏi tất cả thiết bị, kể cả thiết bị này?')) return;
    setSessionError(null);
    logoutAll.mutate(undefined, {
      onSuccess: async () => {
        await logout();
        router.replace('/login');
      },
      onError: (err) => setSessionError(getApiErrorMessage(err)),
    });
  };

  const account = me.data;
  const sessionList = sessions.data ?? [];
  const currentSession = sessionList.find((session) => session.current);
  const otherSessions = sessionList.filter((session) => !session.current);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <Header />

      <main className="flex-1 w-full bg-[#f7f9ff]">
        
        {/* Account Sub-navigation */}
        <AccountSubNav activeTab="security" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Breadcrumbs */}
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Mật khẩu & bảo mật', active: true },
            ]}
          />

          {/* Editorial Banner */}
          <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-[#934a33] text-[11px] font-semibold">
                  <ShieldCheck className="size-3.5" /> Bảo mật cấp độ cao cho đặt phòng
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Mật khẩu & Bảo mật
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Bảo vệ tài khoản và đơn đặt phòng nghỉ dưỡng của bạn với các tiêu chuẩn an toàn cao nhất.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-border shrink-0">
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Trạng thái bảo mật</span>
                  <span className="text-xs font-bold text-emerald-600">Được bảo vệ tối đa</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Sections Stack */}
          <div className="space-y-6">
            
            {/* CARD 1: Change Password */}
            <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <KeyRound className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Đổi mật khẩu</h2>
                    <p className="text-xs text-muted-foreground">Cập nhật mật khẩu định kỳ để nâng cao tính an toàn</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
                {/* Current Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="currentPassword" className="text-xs sm:text-sm font-semibold">
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline font-semibold">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu bạn đang dùng"
                      className="h-11 text-sm focus-visible:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <FieldError message={fieldErrors.currentPassword} />
                </div>

                {/* New & Confirm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-xs sm:text-sm font-semibold">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 8 ký tự"
                        className="h-11 text-sm focus-visible:ring-primary pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FieldError message={fieldErrors.newPassword} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold">
                      Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="h-11 text-sm focus-visible:ring-primary pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FieldError message={fieldErrors.confirmPassword} />
                  </div>
                </div>

                {/* Strength Meter */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-border">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground">Độ mạnh mật khẩu:</span>
                    <span className="text-foreground">{getStrengthLabel()}</span>
                  </div>

                  <div className="flex gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-colors ${
                          step <= strengthScore
                            ? strengthScore <= 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                      <Check className="size-3.5" /> Tối thiểu 8 ký tự
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLetterAndNum ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                      <Check className="size-3.5" /> Có chữ cái & chữ số (0-9)
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                      <Check className="size-3.5" /> Ký tự đặc biệt (khuyến nghị)
                    </div>
                    <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                      <Check className="size-3.5" /> Khớp với mật khẩu mới
                    </div>
                  </div>
                </div>

                {passwordError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
                    {passwordError}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={changePassword.isPending}
                    className="h-11 px-8 bg-primary text-primary-foreground hover:bg-[#193b56] font-bold text-xs sm:text-sm gap-2 shadow-sm"
                  >
                    {changePassword.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    {changePassword.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* CARD 2: Contact methods */}
            <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="size-9 rounded-lg bg-orange-100 text-[#934a33] flex items-center justify-center font-bold">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">Thông tin xác thực & liên hệ</h2>
                  <p className="text-xs text-muted-foreground">Email đăng nhập và số điện thoại của tài khoản</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-border gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-xs">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-foreground">{account?.email ?? '—'}</span>
                        {account &&
                          (account.emailVerified ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px]">Đã xác minh</Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 text-[10px]">Chưa xác minh</Badge>
                          ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Địa chỉ đăng nhập, nhận E-Voucher và hóa đơn</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-border gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-xs">
                      <Phone className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {account?.phone ?? 'Chưa có số điện thoại'}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Khách sạn liên hệ khi cần hỗ trợ lưu trú</p>
                    </div>
                  </div>
                  <Link href="/account/profile">
                    <Button variant="outline" className="h-9 text-xs font-semibold shrink-0">
                      Cập nhật SĐT
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* CARD 3: Active Sessions */}
            <Card className="p-6 sm:p-8 bg-white border border-border shadow-xs rounded-2xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="size-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Laptop className="size-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">Phiên đăng nhập & Thiết bị hoạt động</h2>
                  <p className="text-xs text-muted-foreground">Quản lý thiết bị đang truy cập tài khoản</p>
                </div>
              </div>

              {sessions.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Đang tải danh sách thiết bị...
                </div>
              ) : sessions.isError ? (
                <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    {getApiErrorMessage(sessions.error, 'Không tải được danh sách thiết bị.')}
                  </span>
                  <Button variant="outline" className="h-8 text-xs" onClick={() => void sessions.refetch()}>
                    Thử lại
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-border space-y-3">
                  {currentSession && <SessionRow session={currentSession} />}
                  {otherSessions.length === 0 ? (
                    <p className="pt-2 border-t border-border text-xs text-muted-foreground">
                      Không có thiết bị nào khác đang đăng nhập.
                    </p>
                  ) : (
                    otherSessions.map((session) => (
                      <div key={session.id} className="pt-2 border-t border-border">
                        <SessionRow
                          session={session}
                          onRevoke={() => handleRevoke(session.id)}
                          revoking={revokeSession.isPending && revokeSession.variables === session.id}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {sessionError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
                  {sessionError}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={handleLogoutAll}
                  disabled={logoutAll.isPending}
                  className="h-10 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 gap-2"
                >
                  {logoutAll.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                  Đăng xuất khỏi tất cả thiết bị
                </Button>
              </div>
            </Card>

          </div>

        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold">Cập nhật thành công!</h4>
            <p className="text-[11px] text-white/80">{toastMessage}</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="text-[11px] text-red-600 block" role="alert">
      {message}
    </span>
  );
}

function SessionRow({
  session,
  onRevoke,
  revoking,
}: {
  session: SessionInfo;
  onRevoke?: () => void;
  revoking?: boolean;
}) {
  const device = describeDevice(session.userAgent);
  const Icon = device.mobile ? Smartphone : Laptop;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-foreground">{device.label}</h4>
            {session.current && (
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px]">Phiên hiện tại</Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {session.ip ? `IP: ${session.ip} • ` : ''}Hoạt động {lastUsed(session)}
          </p>
        </div>
      </div>
      {onRevoke && (
        <Button
          variant="ghost"
          onClick={onRevoke}
          disabled={revoking}
          className="h-7 shrink-0 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {revoking ? <Loader2 className="size-3.5 animate-spin" /> : 'Đăng xuất'}
        </Button>
      )}
    </div>
  );
}
