'use client';

import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  Coffee,
  Compass,
  Loader2,
  MapPin,
  Palmtree,
  RotateCcw,
  Save,
  Sparkles,
  Trees,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import AccountSubNav from '@/features/account/AccountSubNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { useMyPreferences, useUpdatePreferences } from '@/features/account/api/rewards-queries';
import type { Preferences } from '@/services/rewards.service';

/**
 * Keys this screen owns in `customer_preference` (docs/api/customer-wallet.md "Preferences"). The backend does not
 * interpret them; the phase 5 recommender reads the same names. Lists are stored comma-separated.
 */
const KEYS = {
  styles: 'travelStyles',
  amenities: 'roomAmenities',
  city: 'favouriteCity',
  budget: 'budgetPerNight',
} as const;

const STYLES = [
  { id: 'resort', title: 'Nghỉ dưỡng & Relax', icon: Palmtree, desc: 'Resort yên tĩnh, view biển/sông' },
  { id: 'nature', title: 'Thiên nhiên & Eco', icon: Trees, desc: 'Lodge rừng thông, khu sinh thái' },
  { id: 'foodie', title: 'Ẩm thực & Văn hóa', icon: Utensils, desc: 'Boutique gần phố cổ & quán ngon' },
  { id: 'business', title: 'Công tác', icon: Briefcase, desc: 'Khách sạn trung tâm, bàn làm việc' },
  { id: 'family', title: 'Gia đình & Trẻ nhỏ', icon: Users, desc: 'Phòng rộng, hồ bơi & khu vui chơi' },
  { id: 'chill', title: 'Coffee & Check-in', icon: Coffee, desc: 'Homestay thiết kế gu, góc chụp đẹp' },
];

const AMENITIES = [
  { id: 'pool', label: 'Hồ bơi' },
  { id: 'view', label: 'View sông / view biển' },
  { id: 'breakfast', label: 'Bữa sáng bao gồm' },
  { id: 'spa', label: 'Spa & Massage' },
  { id: 'quiet', label: 'Phòng yên tĩnh, tầng cao' },
  { id: 'tub', label: 'Bồn tắm' },
  { id: 'shuttle', label: 'Đưa đón sân bay' },
  { id: 'parking', label: 'Chỗ đậu xe' },
];

const BUDGETS = [
  { id: '', label: 'Không giới hạn' },
  { id: '1000000', label: 'Dưới 1 triệu' },
  { id: '2000000', label: 'Dưới 2 triệu' },
  { id: '4000000', label: 'Dưới 4 triệu' },
  { id: '8000000', label: 'Dưới 8 triệu' },
];

type FormState = { styles: string[]; amenities: string[]; city: string; budget: string };

const splitList = (value: string | undefined) => (value ? value.split(',').filter(Boolean) : []);

function toForm(preferences: Preferences): FormState {
  return {
    styles: splitList(preferences[KEYS.styles]),
    amenities: splitList(preferences[KEYS.amenities]),
    city: preferences[KEYS.city] ?? '',
    budget: preferences[KEYS.budget] ?? '',
  };
}

/** Empty values are sent as `null`, which removes the key instead of storing an empty string. */
function toPayload(form: FormState): Record<string, string | null> {
  return {
    [KEYS.styles]: form.styles.length ? form.styles.join(',') : null,
    [KEYS.amenities]: form.amenities.length ? form.amenities.join(',') : null,
    [KEYS.city]: form.city.trim() || null,
    [KEYS.budget]: form.budget || null,
  };
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

function PreferencesForm({ initial }: { initial: FormState }) {
  const [form, setForm] = useState<FormState>(initial);
  const [saved, setSaved] = useState(false);
  const update = useUpdatePreferences();
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    update.mutate(toPayload(form), {
      onSuccess: () => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 3500);
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Compass className="size-5 text-primary" /> Phong cách du lịch yêu thích
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STYLES.map((item) => {
            const Icon = item.icon;
            const active = form.styles.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setForm((prev) => ({ ...prev, styles: toggle(prev.styles, item.id) }))}
                className={cn(
                  'relative space-y-2 rounded-xl border-2 p-4 text-left transition-all',
                  active ? 'border-primary bg-primary/5 shadow-xs' : 'border-border bg-slate-50 hover:bg-white',
                )}
              >
                {active && (
                  <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-3" />
                  </span>
                )}
                <Icon className={cn('size-6', active ? 'text-primary' : 'text-slate-500')} />
                <span className="block text-sm font-bold text-foreground">{item.title}</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
        <h2 className="text-lg font-bold text-foreground">Tiện nghi ưu tiên</h2>
        <div className="flex flex-wrap gap-2.5">
          {AMENITIES.map((item) => {
            const active = form.amenities.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setForm((prev) => ({ ...prev, amenities: toggle(prev.amenities, item.id) }))}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                    : 'border-border bg-slate-50 text-muted-foreground hover:bg-slate-100',
                )}
              >
                {active && <Check className="size-3.5" />} {item.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-white p-6 shadow-xs sm:grid-cols-2 sm:p-8">
        <div className="space-y-2">
          <Label htmlFor="favouriteCity" className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <MapPin className="size-4 text-primary" /> Điểm đến hay đi
          </Label>
          <Input
            id="favouriteCity"
            value={form.city}
            maxLength={100}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="Ví dụ: Đà Nẵng"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Wallet className="size-4 text-primary" /> Ngân sách mỗi đêm
          </span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ngân sách mỗi đêm">
            {BUDGETS.map((item) => (
              <button
                key={item.id || 'none'}
                type="button"
                role="radio"
                aria-checked={form.budget === item.id}
                onClick={() => setForm((prev) => ({ ...prev, budget: item.id }))}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                  form.budget === item.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-slate-50 text-muted-foreground hover:bg-slate-100',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {update.error && (
        <Alert variant="destructive" className="bg-red-50">
          <AlertDescription className="text-xs">{getApiErrorMessage(update.error)}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700" role="status">
            <CheckCircle2 className="size-4" /> Đã lưu sở thích
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={!dirty || update.isPending}
          onClick={() => setForm(initial)}
          className="h-11 px-5 text-xs font-semibold sm:text-sm"
        >
          Huỷ thay đổi
        </Button>
        <Button
          type="submit"
          disabled={!dirty || update.isPending}
          className="h-11 gap-2 bg-primary px-8 text-xs font-bold text-primary-foreground shadow-sm hover:bg-[#193b56] sm:text-sm"
        >
          {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Lưu sở thích
        </Button>
      </div>
    </form>
  );
}

export default function PreferencesPage() {
  const query = useMyPreferences();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <Header />

      <main className="w-full flex-1 bg-[#f7f9ff]">
        <AccountSubNav activeTab="preferences" />

        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <AppBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Sở thích du lịch', active: true },
            ]}
          />

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Cá nhân hóa gợi ý
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Sở thích du lịch</h1>
            <p className="max-w-2xl text-xs text-muted-foreground sm:text-sm">
              StayReco dùng các lựa chọn này để gợi ý khách sạn và phòng nghỉ hợp gu của bạn.
            </p>
          </div>

          {query.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Đang tải sở thích…
            </div>
          ) : query.error || !query.data ? (
            <Card className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-8 text-center">
              <AlertTriangle className="size-6 text-amber-500" />
              <p className="text-sm text-muted-foreground">{getApiErrorMessage(query.error)}</p>
              <Button variant="outline" size="sm" onClick={() => void query.refetch()} className="gap-1.5">
                <RotateCcw className="size-3.5" /> Thử lại
              </Button>
            </Card>
          ) : (
            // A save writes the stored values back to the cache, so `initial` then equals the form and it is clean.
            <PreferencesForm initial={toForm(query.data)} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
