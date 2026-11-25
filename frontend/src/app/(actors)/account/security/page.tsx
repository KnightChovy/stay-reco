'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { changePasswordSchema, type SessionInfo } from '@stayreco/shared';
import { Check, CheckCircle2, Eye, EyeOff, KeyRound, Laptop, Loader2, LogOut, Smartphone, UserRound } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ActionMenu } from '@/components/common/ActionBar';
import { ErrorState } from '@/components/common/StateViews';
import { TonePill } from '@/features/booking/components/StatusPill';
import { AccountPageHeader, accountContainer, notify } from '@/features/account/AccountShell';
import { useChangePassword, useLogoutAll, useMe, useRevokeSession, useSessions } from '@/features/account/api/account-queries';
import { formatDateTime } from '@/features/stays/lib/format';
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

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

/**
 * Strength from what the password is made of: length and variety of characters. The confirmation matching is a
 * separate check, it does not make a password stronger.
 */
function passwordStrength(password: string) {
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (kinds >= 2) score += 1;
  if (kinds >= 3) score += 1;
  if (password.length < 8) score = Math.min(score, 1);
  const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  return { score, label: password ? labels[score] : 'Chưa nhập' };
}

export default function SecurityPage() {
  const me = useMe();
  const sessions = useSessions();
  const account = me.data;
  const sessionList = sessions.data ?? [];
  const otherSessions = sessionList.filter((session) => !session.current);

  // A status read from the account itself, never a fixed claim.
  const status = !account
    ? null
    : !account.emailVerified
      ? { tone: 'warning' as const, text: 'Email chưa xác thực' }
      : sessions.isSuccess && otherSessions.length > 0
        ? { tone: 'info' as const, text: `${otherSessions.length} thiết bị khác đang đăng nhập` }
        : sessions.isSuccess
          ? { tone: 'success' as const, text: 'Chỉ thiết bị này đang đăng nhập' }
          : null;

  return (
    <div className={cn(accountContainer.narrow, 'space-y-6')}>
      <AccountPageHeader
        title="Mật khẩu & bảo mật"
        description="Đổi mật khẩu và kiểm soát các thiết bị đang đăng nhập tài khoản của bạn."
        actions={status && <TonePill tone={status.tone}>{status.text}</TonePill>}
      />

      <ChangePasswordCard />
      <SessionsCard sessionsQuery={sessions} />

      <Link
        href="/account/profile"
        className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <UserRound className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0">
          <span className="block font-semibold text-foreground">Email và số điện thoại</span>
          <span className="block truncate text-xs text-muted-foreground">
            {account ? `${account.email} · ${account.phone ?? 'chưa có số điện thoại'}` : 'Quản lý trong Hồ sơ cá nhân'}
          </span>
        </span>
      </Link>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  describedBy,
  adornment,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
  describedBy?: string;
  adornment?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-semibold">
          {label} <span className="text-destructive">*</span>
        </Label>
        {adornment}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={[error ? errorId : null, describedBy].filter(Boolean).join(' ') || undefined}
          className="h-11 pr-11 text-sm"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          className="absolute top-1/2 right-0.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ChangePasswordCard() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // The backend requires at least 8 characters with a letter and a digit.
  const hasMinLength = newPassword.length >= 8;
  const hasLetterAndNum = /[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isLong = newPassword.length >= 12;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const strength = passwordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
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
        notify.success('Đã đổi mật khẩu', 'Các thiết bị khác đã được đăng xuất.');
      },
      onError: (err) => {
        setFieldErrors(getApiFieldErrors(err));
        setPasswordError(getApiErrorMessage(err));
      },
    });
  };

  const rules = [
    { ok: hasMinLength, text: 'Tối thiểu 8 ký tự' },
    { ok: hasLetterAndNum, text: 'Có chữ cái và chữ số' },
    { ok: hasSpecial, text: 'Ký tự đặc biệt (nên có)' },
    { ok: isLong, text: 'Từ 12 ký tự (nên có)' },
  ];

  return (
    <Card className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-foreground">Đổi mật khẩu</h2>
          <p className="text-sm text-muted-foreground">Sau khi đổi, các thiết bị khác sẽ bị đăng xuất.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <PasswordInput
          id="currentPassword"
          label="Mật khẩu hiện tại"
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Mật khẩu bạn đang dùng"
          autoComplete="current-password"
          error={fieldErrors.currentPassword}
          adornment={
            <Link href="/forgot-password" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PasswordInput
            id="newPassword"
            label="Mật khẩu mới"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            error={fieldErrors.newPassword}
            describedBy="password-strength"
          />
          <PasswordInput
            id="confirmPassword"
            label="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            adornment={
              confirmPassword && (
                <span
                  className={cn('text-xs font-semibold', isMatch ? 'text-emerald-700' : 'text-muted-foreground')}
                  aria-live="polite"
                >
                  {isMatch ? 'Đã khớp' : 'Chưa khớp'}
                </span>
              )
            }
          />
        </div>

        <div id="password-strength" className="space-y-3 rounded-xl border border-border bg-muted/50 p-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-muted-foreground">Độ mạnh mật khẩu</span>
            <span aria-live="polite" className="text-foreground">
              {strength.label}
            </span>
          </div>
          <div className="flex h-1.5 w-full gap-1.5" aria-hidden>
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  'h-full flex-1 rounded-full transition-colors',
                  step <= strength.score ? (strength.score <= 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-border',
                )}
              />
            ))}
          </div>
          <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {rules.map((rule) => (
              <li
                key={rule.text}
                className={cn('flex items-center gap-1.5', rule.ok ? 'font-semibold text-emerald-700' : 'text-muted-foreground')}
              >
                <Check className="size-3.5" aria-hidden /> {rule.text}
                <span className="sr-only">{rule.ok ? ': đạt' : ': chưa đạt'}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
          {passwordError && (
            <p role="alert" className="text-sm font-medium text-destructive sm:mr-auto">
              {passwordError}
            </p>
          )}
          <Button type="submit" disabled={changePassword.isPending} className="h-11 gap-2 px-6 font-bold whitespace-nowrap">
            {changePassword.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {changePassword.isPending ? 'Đang cập nhật…' : 'Đổi mật khẩu'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

const SESSIONS_PREVIEW = 5;

function SessionsCard({ sessionsQuery }: { sessionsQuery: ReturnType<typeof useSessions> }) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const revokeSession = useRevokeSession();
  const logoutAll = useLogoutAll();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const sessionList = sessionsQuery.data ?? [];
  const currentSession = sessionList.find((session) => session.current);
  const otherSessions = sessionList.filter((session) => !session.current);
  // Most recent first is how the API answers; five is enough to spot a stranger without a wall of rows.
  const shownSessions = showAll ? otherSessions : otherSessions.slice(0, SESSIONS_PREVIEW);

  const handleRevoke = (session: SessionInfo) => {
    setSessionError(null);
    revokeSession.mutate(session.id, {
      onSuccess: () => notify.success('Đã đăng xuất thiết bị', describeDevice(session.userAgent).label),
      onError: (err) => {
        setSessionError(getApiErrorMessage(err));
        void sessionsQuery.refetch();
      },
    });
  };

  const handleLogoutAll = () => {
    setSessionError(null);
    logoutAll.mutate(undefined, {
      onSuccess: async () => {
        await logout();
        router.replace('/login');
      },
      onError: (err) => {
        setConfirmAll(false);
        setSessionError(getApiErrorMessage(err));
      },
    });
  };

  return (
    <Card className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
          <Laptop className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-foreground">Thiết bị đang đăng nhập</h2>
          <p className="text-sm text-muted-foreground">Đăng xuất thiết bị bạn không nhận ra.</p>
        </div>
      </div>

      {sessionsQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải danh sách thiết bị…
        </p>
      ) : sessionsQuery.isError ? (
        <ErrorState
          title="Không tải được danh sách thiết bị"
          error={sessionsQuery.error}
          onRetry={() => void sessionsQuery.refetch()}
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {currentSession && (
            <li className="px-4 py-3">
              <SessionRow session={currentSession} />
            </li>
          )}
          {otherSessions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">Không có thiết bị nào khác đang đăng nhập.</li>
          ) : (
            shownSessions.map((session) => {
              const device = describeDevice(session.userAgent);
              return (
                <li key={session.id} className="px-4 py-3">
                  <SessionRow
                    session={session}
                    revoking={revokeSession.isPending && revokeSession.variables === session.id}
                    menu={
                      <ActionMenu
                        variant="icon"
                        label={`Thao tác với ${device.label}`}
                        items={[
                          {
                            label: 'Đăng xuất thiết bị này',
                            description: `${device.label} phải đăng nhập lại để dùng tài khoản.`,
                            icon: LogOut,
                            destructive: true,
                            onSelect: () => handleRevoke(session),
                          },
                        ]}
                      />
                    }
                  />
                </li>
              );
            })
          )}
          {otherSessions.length > SESSIONS_PREVIEW && (
            <li>
              <button
                type="button"
                onClick={() => setShowAll((open) => !open)}
                aria-expanded={showAll}
                className="flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary hover:bg-muted"
              >
                {showAll
                  ? 'Thu gọn'
                  : `Xem tất cả ${otherSessions.length} thiết bị khác`}
              </button>
            </li>
          )}
        </ul>
      )}

      {sessionError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {sessionError}
        </p>
      )}

      {sessionList.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setConfirmAll(true)}
            disabled={logoutAll.isPending}
            className="h-10 gap-2 whitespace-nowrap border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" /> Đăng xuất tất cả thiết bị
          </Button>
        </div>
      )}

      <AlertDialog open={confirmAll} onOpenChange={(open) => !logoutAll.isPending && setConfirmAll(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đăng xuất tất cả thiết bị?</AlertDialogTitle>
            <AlertDialogDescription>
              Mọi thiết bị, kể cả thiết bị bạn đang dùng, sẽ bị đăng xuất. Bạn cần đăng nhập lại để tiếp tục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logoutAll.isPending}>Quay lại</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={logoutAll.isPending} onClick={handleLogoutAll}>
              {logoutAll.isPending && <Loader2 className="size-4 animate-spin" />}
              Đăng xuất tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function SessionRow({
  session,
  menu,
  revoking,
}: {
  session: SessionInfo;
  menu?: React.ReactNode;
  revoking?: boolean;
}) {
  const device = describeDevice(session.userAgent);
  const Icon = device.mobile ? Smartphone : Laptop;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
            {device.label}
            {session.current && <span className="text-xs font-semibold text-emerald-700">Thiết bị này</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {session.ip ? `IP ${session.ip} · ` : ''}Hoạt động{' '}
            <time dateTime={session.lastUsedAt} title={formatDateTime(session.lastUsedAt)}>
              {formatDistanceToNow(new Date(session.lastUsedAt), { addSuffix: true, locale: vi })}
            </time>
          </p>
        </div>
      </div>
      {revoking ? (
        <span className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'size-10' })}>
          <Loader2 className="size-4 animate-spin" aria-label="Đang đăng xuất" />
        </span>
      ) : (
        menu
      )}
    </div>
  );
}
