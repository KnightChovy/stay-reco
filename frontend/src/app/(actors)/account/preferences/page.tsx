'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Check,
  Coffee,
  Compass,
  Loader2,
  MapPin,
  Palmtree,
  Save,
  Sparkles,
  Trees,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { AccountPageHeader, accountContainer, notify } from '@/features/account/AccountShell';
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
  { id: 'resort', title: 'Nghỉ dưỡng & thư giãn', icon: Palmtree, desc: 'Khu nghỉ dưỡng yên tĩnh, view biển hoặc sông' },
  { id: 'nature', title: 'Thiên nhiên & sinh thái', icon: Trees, desc: 'Nhà gỗ trong rừng thông, khu du lịch sinh thái' },
  { id: 'foodie', title: 'Ẩm thực & văn hoá', icon: Utensils, desc: 'Khách sạn nhỏ gần phố cổ và quán ăn ngon' },
  { id: 'business', title: 'Công tác', icon: Briefcase, desc: 'Khách sạn trung tâm, có bàn làm việc' },
  { id: 'family', title: 'Gia đình & trẻ nhỏ', icon: Users, desc: 'Phòng rộng, hồ bơi và khu vui chơi' },
  { id: 'chill', title: 'Cà phê & chụp ảnh', icon: Coffee, desc: 'Homestay (nhà dân) thiết kế đẹp, nhiều góc chụp' },
];

const AMENITIES = [
  { id: 'pool', label: 'Hồ bơi' },
  { id: 'view', label: 'View sông / view biển' },
  { id: 'breakfast', label: 'Bữa sáng bao gồm' },
  { id: 'spa', label: 'Spa & massage' },
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

function SectionTitle({ id, icon: Icon, title, hint }: { id: string; icon: typeof Compass; title: string; hint: string }) {
  return (
    <div>
      <h2 id={id} className="flex items-center gap-2 text-lg font-bold text-foreground">
        <Icon className="size-5 text-primary" aria-hidden /> {title}
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function PreferencesForm({ initial }: { initial: FormState }) {
  const [form, setForm] = useState<FormState>(initial);
  const [justSaved, setJustSaved] = useState(false);
  const update = useUpdatePreferences();
  // Lists compared as sets: picking the same items in another order is not a change.
  const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((item) => b.includes(item));
  const dirty =
    !sameList(form.styles, initial.styles) ||
    !sameList(form.amenities, initial.amenities) ||
    form.city.trim() !== initial.city ||
    form.budget !== initial.budget;

  const edit = (next: (prev: FormState) => FormState) => {
    setJustSaved(false);
    setForm(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    update.mutate(toPayload(form), {
      onSuccess: () => {
        setJustSaved(true);
        notify.success('Đã lưu sở thích du lịch', 'Gợi ý khách sạn sẽ theo các lựa chọn mới của bạn.');
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-24">
      {justSaved && !dirty && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Check className="size-4" aria-hidden /> Đã lưu. Gợi ý cho bạn đã được cập nhật theo sở thích mới.
          </span>
          <Link
            href="/recommendations"
            className={cn(buttonVariants({ variant: 'outline' }), 'h-10 shrink-0 gap-1.5 px-4')}
          >
            <Sparkles className="size-4" aria-hidden /> Xem gợi ý cho bạn
          </Link>
        </div>
      )}

      <Card className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <SectionTitle id="styles-title" icon={Compass} title="Phong cách du lịch yêu thích" hint="Chọn nhiều." />
        <div role="group" aria-labelledby="styles-title" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STYLES.map((item) => {
            const Icon = item.icon;
            const active = form.styles.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => edit((prev) => ({ ...prev, styles: toggle(prev.styles, item.id) }))}
                className={cn(
                  'relative min-h-10 space-y-2 rounded-xl border-2 p-4 text-left transition-all',
                  active ? 'border-primary bg-primary/5 shadow-xs' : 'border-border bg-muted/40 hover:bg-card',
                )}
              >
                {active && (
                  <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" aria-hidden />
                  </span>
                )}
                <Icon className={cn('size-6', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                <span className="block text-sm font-bold text-foreground">{item.title}</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <SectionTitle id="amenities-title" icon={Sparkles} title="Tiện nghi ưu tiên" hint="Chọn nhiều." />
        <div role="group" aria-labelledby="amenities-title" className="flex flex-wrap gap-2.5">
          {AMENITIES.map((item) => {
            const active = form.amenities.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => edit((prev) => ({ ...prev, amenities: toggle(prev.amenities, item.id) }))}
                className={cn(
                  'flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                )}
              >
                {active && <Check className="size-3.5" aria-hidden />} {item.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-6 shadow-xs sm:grid-cols-2 sm:p-8">
        <div className="space-y-2">
          <Label htmlFor="favouriteCity" className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <MapPin className="size-4 text-primary" aria-hidden /> Điểm đến hay đi
          </Label>
          <Input
            id="favouriteCity"
            value={form.city}
            maxLength={100}
            onChange={(event) => edit((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="Ví dụ: Đà Nẵng"
            aria-describedby="favouriteCity-hint"
            className="h-11 text-base sm:text-sm"
          />
          <p id="favouriteCity-hint" className="text-xs text-muted-foreground">
            Ghi tên tỉnh hoặc thành phố, ví dụ &ldquo;Đà Nẵng&rdquo;, &ldquo;Hà Nội&rdquo;.
          </p>
        </div>
        <div className="space-y-2">
          <span id="budget-title" className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Wallet className="size-4 text-primary" aria-hidden /> Ngân sách mỗi đêm
          </span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="budget-title">
            {BUDGETS.map((item) => (
              <button
                key={item.id || 'none'}
                type="button"
                role="radio"
                aria-checked={form.budget === item.id}
                onClick={() => edit((prev) => ({ ...prev, budget: item.id }))}
                className={cn(
                  'min-h-10 rounded-full border px-3.5 text-sm font-semibold transition-all',
                  form.budget === item.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
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
          <AlertDescription className="text-sm">{getApiErrorMessage(update.error)}</AlertDescription>
        </Alert>
      )}

      {/* The save bar follows the page only while something changed, so it is always one tap away. */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_16px_rgb(40_48_54/8%)] backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="hidden text-sm text-muted-foreground sm:block">Bạn có thay đổi chưa lưu.</p>
            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                disabled={update.isPending}
                onClick={() => setForm(initial)}
                className="h-10 px-4 whitespace-nowrap"
              >
                Huỷ thay đổi
              </Button>
              <Button type="submit" disabled={update.isPending} className="h-10 flex-1 gap-2 px-6 whitespace-nowrap sm:flex-none">
                {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Lưu sở thích
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default function PreferencesPage() {
  const query = useMyPreferences();

  return (
    <div className={cn(accountContainer.narrow, 'space-y-6')}>
      <AppBreadcrumb
        items={[
          { label: 'Tài khoản', href: '/account/profile' },
          { label: 'Sở thích du lịch', active: true },
        ]}
      />

      <AccountPageHeader
        eyebrow="Cá nhân hoá gợi ý"
        title="Sở thích du lịch"
        description="StayReco dùng các lựa chọn này để gợi ý khách sạn và phòng nghỉ hợp gu của bạn. Bạn có thể đổi bất cứ lúc nào."
      />

      {query.isLoading ? (
        <LoadingState rows={3} label="Đang tải sở thích…" />
      ) : query.error || !query.data ? (
        <ErrorState title="Không tải được sở thích" error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        // A save writes the stored values back to the cache, so `initial` then equals the form and it is clean.
        <PreferencesForm initial={toForm(query.data)} />
      )}
    </div>
  );
}
