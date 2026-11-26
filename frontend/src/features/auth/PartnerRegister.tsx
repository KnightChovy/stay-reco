'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChartNoAxesCombined,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react';
import { registerPartnerSchema } from '@stayreco/shared';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OtpVerification } from '@/features/auth/OtpVerification';
import { validateWith, type FieldErrors } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const benefits = [
  {
    icon: Sparkles,
    title: 'Khách tìm đến qua gợi ý AI',
    text: 'Khách sạn được đề xuất cho đúng khách theo sở thích và ngân sách của họ.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Vận hành trong một nơi',
    text: 'Phòng, giá theo mùa, booking, nhân viên và báo cáo doanh thu trên cùng một cổng.',
  },
  {
    icon: Wallet,
    title: 'Tiền về ví, rút khi cần',
    text: 'Khách thanh toán trước qua StayReco, bạn rút về tài khoản ngân hàng đã xác minh.',
  },
];

const steps = ['Tạo tài khoản', 'Xác thực email', 'Thêm khách sạn & gửi hồ sơ'];

const fieldMessages: Record<string, string> = {
  fullName: 'Vui lòng nhập họ và tên (tối đa 100 ký tự).',
  email: 'Email chưa đúng định dạng.',
  phone: 'Số điện thoại gồm 9–15 chữ số, có thể bắt đầu bằng +.',
  password: 'Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.',
  companyName: 'Tên doanh nghiệp tối đa 200 ký tự.',
};

export default function PartnerRegister() {
  const router = useRouter();
  const registerPartner = useAuthStore((state) => state.registerPartner);
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError('');
    const result = validateWith(registerPartnerSchema, {
      fullName: form.fullName,
      companyName: form.companyName.trim() || undefined,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    const schemaErrors = result.errors ?? {};
    const nextErrors: FieldErrors = Object.fromEntries(
      Object.entries(schemaErrors).map(([key, message]) => [key, fieldMessages[key] ?? message]),
    );
    if (form.password && form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.';
    }
    if (!agreeTerms) nextErrors.agreeTerms = 'Vui lòng đồng ý với điều khoản dành cho đối tác.';
    setErrors(nextErrors);
    if (!result.data || Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      const response = await registerPartner(result.data);
      if (!response.success) {
        if (response.code === 'AUTH_EMAIL_TAKEN') setErrors({ email: response.message });
        else setFormError(response.message);
        return;
      }
      setPendingEmail(response.email);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <Header />

      <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-12">
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:col-span-5 lg:flex">
            <Image
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80"
              alt=""
              fill
              sizes="40vw"
              className="pointer-events-none object-cover opacity-25 mix-blend-overlay"
              priority
            />
            <div className="relative z-10">
              <Image
                src="/images/logo_stayreco.png"
                alt="StayReco"
                width={120}
                height={40}
                className="brightness-0 invert"
              />
              <h2 className="mt-6 text-2xl font-bold leading-tight">Đưa khách sạn của bạn lên StayReco</h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
                Miễn phí đăng ký. Bạn chỉ trả hoa hồng trên booking thành công.
              </p>
            </div>

            <ul className="relative z-10 my-8 space-y-3">
              {benefits.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-3.5 backdrop-blur-md"
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden />
                  <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="text-xs text-primary-foreground/75">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="relative z-10 text-xs text-primary-foreground/60">
              © {new Date().getFullYear()} StayReco. Tất cả các quyền được bảo lưu.
            </p>
          </aside>

          <section className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-7">
            <div className="mx-auto w-full max-w-md">
              <ol className="mb-6 flex items-center gap-2 text-xs" aria-label="Các bước trở thành đối tác">
                {steps.map((label, index) => {
                  const current = pendingEmail ? 1 : 0;
                  return (
                    <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className={cn(
                          'grid size-6 shrink-0 place-items-center rounded-full font-bold',
                          index < current && 'bg-success text-primary-foreground',
                          index === current && 'bg-primary text-primary-foreground',
                          index > current && 'bg-muted text-muted-foreground',
                        )}
                        aria-current={index === current ? 'step' : undefined}
                      >
                        {index < current ? <BadgeCheck className="size-3.5" aria-hidden /> : index + 1}
                      </span>
                      <span
                        className={cn(
                          'truncate',
                          index === current ? 'font-semibold text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {pendingEmail ? (
                <OtpVerification email={pendingEmail} onVerified={() => router.replace('/partner/verification')} />
              ) : (
                <>
                  <div className="mb-6">
                    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Building2 className="size-3.5" aria-hidden /> Dành cho chủ khách sạn
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Đăng ký trở thành đối tác
                    </h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Tạo tài khoản đối tác, sau đó thêm khách sạn và gửi hồ sơ để StayReco xác minh.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                    <Field id="fullName" label="Họ và tên người đại diện" icon={User} required error={errors.fullName}>
                      <Input
                        id="fullName"
                        value={form.fullName}
                        onChange={(event) => update('fullName', event.target.value)}
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        aria-required
                        aria-invalid={!!errors.fullName}
                        className="h-11 pl-10"
                      />
                    </Field>

                    <Field id="companyName" label="Tên doanh nghiệp" icon={Building2} error={errors.companyName}>
                      <Input
                        id="companyName"
                        value={form.companyName}
                        onChange={(event) => update('companyName', event.target.value)}
                        placeholder="Công ty TNHH Du lịch An Nhiên"
                        autoComplete="organization"
                        aria-invalid={!!errors.companyName}
                        className="h-11 pl-10"
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field id="email" label="Email" icon={Mail} required error={errors.email}>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(event) => update('email', event.target.value)}
                          placeholder="vidu@khachsan.vn"
                          autoComplete="email"
                          aria-required
                          aria-invalid={!!errors.email}
                          className="h-11 pl-10"
                        />
                      </Field>
                      <Field id="phone" label="Số điện thoại liên hệ" icon={Phone} required error={errors.phone}>
                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(event) => update('phone', event.target.value)}
                          placeholder="0912345678"
                          autoComplete="tel"
                          aria-required
                          aria-invalid={!!errors.phone}
                          className="h-11 pl-10"
                        />
                      </Field>
                    </div>

                    <Field id="password" label="Mật khẩu" icon={Lock} required error={errors.password}>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(event) => update('password', event.target.value)}
                        placeholder="Ít nhất 8 ký tự, có chữ và số"
                        autoComplete="new-password"
                        aria-required
                        aria-invalid={!!errors.password}
                        className="h-11 pr-11 pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </Field>

                    <Field
                      id="confirmPassword"
                      label="Nhập lại mật khẩu"
                      icon={Lock}
                      required
                      error={errors.confirmPassword}
                    >
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(event) => update('confirmPassword', event.target.value)}
                        placeholder="Xác nhận mật khẩu"
                        autoComplete="new-password"
                        aria-required
                        aria-invalid={!!errors.confirmPassword}
                        className="h-11 pl-10"
                      />
                    </Field>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="partner-terms"
                          checked={agreeTerms}
                          onCheckedChange={(checked) => setAgreeTerms(!!checked)}
                          className="mt-0.5"
                        />
                        <label htmlFor="partner-terms" className="text-xs leading-relaxed text-muted-foreground">
                          Tôi đồng ý với{' '}
                          <Link href="/terms" className="font-semibold text-primary hover:underline">
                            Điều khoản đối tác
                          </Link>{' '}
                          và{' '}
                          <Link href="/privacy" className="font-semibold text-primary hover:underline">
                            Chính sách bảo mật
                          </Link>{' '}
                          của StayReco, gồm mức hoa hồng trên mỗi booking.
                        </label>
                      </div>
                      {errors.agreeTerms && (
                        <p role="alert" className="text-xs text-danger">
                          {errors.agreeTerms}
                        </p>
                      )}
                    </div>

                    {formError && (
                      <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
                        {formError}
                      </p>
                    )}

                    <Button type="submit" disabled={isLoading} className="mt-2 h-11 w-full gap-2 font-semibold">
                      {isLoading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản đối tác'}
                      {!isLoading && <ArrowRight className="size-4" />}
                    </Button>
                  </form>

                  <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
                    <p>
                      Đã có tài khoản đối tác?{' '}
                      <Link href="/login?next=%2Fpartner%2Fdashboard" className="font-semibold text-primary hover:underline">
                        Đăng nhập
                      </Link>
                    </p>
                    <p>
                      Bạn muốn đặt phòng?{' '}
                      <Link href="/register" className="font-semibold text-primary hover:underline">
                        Tạo tài khoản khách hàng
                      </Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: typeof User;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="gap-0.5 text-sm font-semibold">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
