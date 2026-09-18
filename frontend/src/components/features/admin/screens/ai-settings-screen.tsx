'use client';

import { useRef, useState } from 'react';
import {
  Bolt,
  Bot,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Play,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Verified,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const boutiquePrompt =
  'Tôi muốn tìm resort phong cách boutique tại Phú Quốc, có bãi biển riêng yên tĩnh và đồ ăn sáng địa phương tươi ngon, giá tầm 2.500.000đ/đêm.';
const guardrailPrompt =
  'Tìm cho tôi khách sạn 5 sao mặt biển Đà Nẵng giá 50.000 VNĐ / đêm có quản gia riêng 24/7.';

type ResponseKind = 'default' | 'safe' | 'blocked';

export function AiSettings({ notify }: { notify: (message: string) => void }) {
  const sandboxRef = useRef<HTMLDivElement>(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [region, setRegion] = useState<'sg' | 'tokyo'>('sg');
  const [anonymousLimit, setAnonymousLimit] = useState(15);
  const [guardrailLevel, setGuardrailLevel] = useState(3);
  const [strictGrounding, setStrictGrounding] = useState(true);
  const [humanFallback, setHumanFallback] = useState(true);
  const [prompt, setPrompt] = useState(boutiquePrompt);
  const [responseKind, setResponseKind] = useState<ResponseKind>('default');
  const [running, setRunning] = useState(false);

  const saveSettings = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      notify('Đã lưu và đồng bộ cấu hình AI tới Singapore Cluster!');
    }, 800);
  };

  const runSandbox = () => {
    setRunning(true);
    window.setTimeout(() => {
      setResponseKind(/50\.000|50k/i.test(prompt) ? 'blocked' : 'safe');
      setRunning(false);
    }, 600);
  };

  const setPreset = (value: string) => {
    setPrompt(value);
    setResponseKind('default');
  };

  return (
    <div className="space-y-6 pt-4">
      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(105deg,var(--sr-primary)_0%,var(--sr-primary-hover)_43%,#c8d0d5_100%)] p-6 text-primary-foreground shadow-sm lg:p-7">
        <div className="pointer-events-none absolute -right-8 -bottom-12 size-64 rounded-full bg-success/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide">
              <span className="size-1.5 animate-pulse rounded-full bg-success-soft" />{' '}
              Cluster v3.8 • Live Pipeline
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              Cấu hình AI Toàn hệ thống (StayReco Intelligence Engine)
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
              Quản lý mô hình gợi ý chỗ nghỉ cá nhân hóa, trợ lý đàm thoại du
              lịch AI và tạo nội dung Marketing cho khách sạn đối tác.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="h-11 rounded-lg border-white/30 bg-card text-primary hover:bg-muted"
              onClick={() => {
                sandboxRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
                notify('Mời bạn chạy thử nghiệm prompt tại Sandbox bên dưới.');
              }}
            >
              <Bolt size={18} /> Kiểm tra phản hồi
            </Button>
            <Button
              className="h-11 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/80"
              disabled={saving}
              onClick={saveSettings}
            >
              {saving ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {saving ? 'Đang đồng bộ...' : 'Lưu thiết lập AI'}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-5" aria-label="Telemetry AI thời gian thực">
        <TelemetryCard
          eyebrow="Hạn mức & chi phí tháng này"
          title="Tiêu thụ Tokens"
          value="4.850.000"
          suffix="/ 10M"
          detail="Dự báo chạm 8.2M vào chu kỳ cuối tháng."
          side={
            <div className="rounded-xl bg-muted p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-success" /> Chi phí
                  ước tính
                </span>
                <button type="button" className="font-medium text-primary">
                  Nâng hạn ngạch
                </button>
              </div>
              <p className="mt-2 text-lg font-bold">
                $145.50{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  / $300.00 ngân sách
                </span>
              </p>
            </div>
          }
          tag="Tier Enterprise"
        >
          <div className="flex items-center gap-5">
            <TokenGauge />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Tiến độ phân bổ token</span>
                <span className="text-primary">48.5%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-border">
                <div className="h-full w-[48.5%] rounded-full bg-primary" />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Dưới ngưỡng trần an toàn của hệ thống
              </p>
            </div>
          </div>
        </TelemetryCard>
        <TelemetryCard
          eyebrow="Độ chuẩn xác thực địa"
          title="Grounding Accuracy"
          value="99.4%"
          valueClass="text-success"
          trend="↑ +0.6%"
          trendClass="text-success"
          detail="Tỷ lệ phản hồi đối soát chính xác 100% với PMS buồng phòng, bảng giá theo mùa và tiện ích thực tế."
          side={<AccuracyChart />}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-success">
            <Verified size={16} /> 0 phát hiện sai sót dữ liệu phòng trong 24h
            qua
          </div>
        </TelemetryCard>
        <TelemetryCard
          eyebrow="Thời gian phản hồi"
          title="Độ trễ trung bình"
          value="420ms"
          trend="↓ -35ms"
          trendClass="text-success"
          detail="Tối ưu qua Edge Endpoint asia-southeast1 tại Singapore phục vụ lưu lượng nội địa Việt Nam."
          side={
            <div className="flex items-center justify-between rounded-xl bg-muted p-4 text-xs">
              <div>
                <p className="font-medium text-muted-foreground">
                  Tỷ lệ nạp đệm biên (Cache)
                </p>
                <p className="mt-1 text-base font-bold font-mono text-primary">
                  Edge Cache Hit: 84.2%
                </p>
              </div>
              <span className="rounded bg-green-200 px-2 py-1 font-semibold text-green-700">
                Rất tốt
              </span>
            </div>
          }
        >
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-green-500" />{' '}
              Ping: 22ms
            </span>
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-green-500" />{' '}
              TTFB: 85ms
            </span>
          </div>
        </TelemetryCard>
      </section>

      <section className="space-y-6">
        <Workspace
          title="1. Phân bổ Mô hình & Nhà cung cấp"
          description="Cấu hình AI engine chuyên biệt phục vụ từng tác vụ lưu trú, tư vấn và tiếp thị."
          icon={<SlidersHorizontal size={21} />}
          action={
            <Button variant="outline" size="sm">
              <RefreshCw size={15} /> Đồng bộ Model
            </Button>
          }
        >
          <div className="space-y-4">
            <EngineCard
              badge="G05 Chat Engine"
              badgeClass="bg-primary text-primary-foreground"
              title="Trợ lý Chat & Tư vấn du lịch"
              status="Đang kích hoạt"
              description="Hiểu và phản hồi ngôn ngữ tự nhiên tiếng Việt đa phương ngữ, gợi ý lịch trình & chính sách phòng."
              value="gemini-flash"
              options={[
                ['gemini-flash', 'Gemini 1.5 Flash (420ms)'],
                ['gemini-pro', 'Gemini 1.5 Pro (1M tokens)'],
                ['gpt-mini', 'GPT-4o Mini (Dự phòng)'],
              ]}
              buttonLabel="Kiểm thử Prompt"
              meta={['Context: 128k tokens', 'Temp: 0.35', 'Max Output: 2.048']}
              footer="Latency ~420ms"
            />
            <EngineCard
              badge="Discovery AI"
              badgeClass="bg-green-200 text-green-700"
              title="Thuật toán Gợi ý cá nhân hóa"
              status="Đang đồng bộ"
              description="Vector Embeddings kết hợp RAG đa chiều liên kết PMS tình trạng phòng trống thời gian thực."
              value="vertex"
              options={[
                ['vertex', 'Vertex Text-Embedding-004 (768d)'],
                ['pgvector', 'PGVector Hybrid BM25 + Dense'],
              ]}
              buttonLabel="Tùy chỉnh Index"
              meta={[
                'CSDL: 18.490 records',
                'Chu kỳ: 15 phút/lần',
                'Similarity: Cosine ≥0.82',
              ]}
              footer="HNSW Index"
            />
            <EngineCard
              badge="Staff S10"
              badgeClass="bg-green-200 text-green-700"
              title="Trình tạo nội dung Marketing khách sạn"
              status="Sẵn sàng"
              description="Fine-tuned Vietnamese Hospitality Model (Bài viết OTA, Fanpage Facebook, Thư xác nhận & đón khách)."
              value="stayreco"
              options={[
                ['stayreco', 'StayReco-VN-Hospitality-v2.1 (Lora)'],
                ['claude', 'Claude 3.5 Sonnet (Direct Creative)'],
              ]}
              buttonLabel="Kiểm thử Prompt"
              meta={[
                'Văn phong: Boutique & Bản địa',
                'Ngôn ngữ: vi-VN (Chính), en-US',
              ]}
              footer="Lora v2.1.4"
            />
          </div>
        </Workspace>

        <Workspace
          title="2. Khóa bảo mật API & Chứng thực (Credentials & Secrets)"
          description="Quản lý Service Account, Key mã hóa và trung tâm dữ liệu phụ trợ liên kết đám mây."
          icon={<KeyRound size={21} />}
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                <label htmlFor="vertex-key">Google Vertex AI Secret Key</label>
                <span className="font-normal text-muted-foreground">
                  Cập nhật 14 ngày trước bởi Quân T.Đ
                </span>
              </div>
              <div className="relative mt-2">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="vertex-key"
                  readOnly
                  type={keyVisible ? 'text' : 'password'}
                  value="AIzaSyBvLq79xX09K_vertex_prod_secret_884920419"
                  className="h-11 bg-muted pl-10 pr-24 font-mono text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setKeyVisible((shown) => !shown)}
                >
                  {keyVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  {keyVisible ? 'Ẩn khóa' : 'Hiện khóa'}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Được lưu mã hóa cấp phần cứng (GCP KMS Hardware Security
                Module).
              </p>
            </div>
            <fieldset>
              <legend className="text-xs font-semibold">
                Vùng triển khai máy chủ AI (Primary Deployment Region)
              </legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <Region
                  value="sg"
                  selected={region}
                  onChange={setRegion}
                  title="asia-southeast1 (Singapore)"
                  description="Độ trễ thấp nhất cho VN (~22ms ping)"
                  label="Tối ưu nhất"
                />
                <Region
                  value="tokyo"
                  selected={region}
                  onChange={setRegion}
                  title="asia-northeast1 (Tokyo)"
                  description="Dự phòng khi failover cluster (~65ms)"
                  label="Standby"
                />
              </div>
            </fieldset>
            <div className="flex gap-3 rounded-xl bg-primary/5 p-3.5 text-primary">
              <ShieldCheck className="shrink-0" size={20} />
              <div className="text-xs">
                <p className="font-semibold">Mã hóa đầu cuối mTLS 1.3</p>
                <p className="mt-1 text-muted-foreground">
                  Mọi truy vấn khách sạn và thông tin thẻ tín dụng của khách lưu
                  trú không bao giờ dùng để train model.
                </p>
              </div>
            </div>
          </div>
        </Workspace>

        <Workspace
          title="3. Giới hạn truy vấn & Chống gian lận (Rate Limits & Quotas)"
          description="Ngăn chặn bot spam, quét giá tự động và kiểm soát phân bổ tài nguyên hợp lý giữa các nhóm người dùng."
          icon={<ShieldCheck size={21} />}
        >
          <div className="space-y-5">
            <div className="rounded-xl bg-muted p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold">
                    Khách vãng lai (Anonymous Guest)
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Chưa đăng nhập tài khoản StayReco
                  </p>
                </div>
                <strong className="text-xs font-mono text-primary">
                  {anonymousLimit} lượt hỏi / phiên
                </strong>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Hạn mức phiên đàm thoại</span>
                  <span className="font-semibold text-primary">
                    {anonymousLimit} câu hỏi (Phiên tự hủy sau 2 giờ)
                  </span>
                </div>
                <Slider
                  className="mt-3"
                  min={5}
                  max={30}
                  step={1}
                  value={[anonymousLimit]}
                  onValueChange={(value) =>
                    setAnonymousLimit(sliderNumber(value, 15))
                  }
                />
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Khi đạt trần {anonymousLimit} lượt hỏi, giao diện sẽ kích hoạt
                modal đề xuất đăng nhập bằng số điện thoại/Zalo để tiếp tục giữ
                chỗ phòng.
              </p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold">
                    Thành viên & Đối tác khách sạn
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Đã xác thực OTP / Khách sạn thành viên
                  </p>
                </div>
                <span className="rounded-full bg-green-200 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                  Không giới hạn phiên
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniMetric label="Tốc độ truy vấn" value="60 req / phút" />
                <MiniMetric label="Xử lý đồng thời" value="12 kết nối" />
              </div>
            </div>
          </div>
        </Workspace>

        <Workspace
          title="4. Bộ lọc An toàn & Chống ảo giác (Safety Filters & Guardrails)"
          description="Đảm bảo tính chân thực của thông tin du lịch, giá phòng và tiêu chuẩn dịch vụ khách sạn."
          icon={<ShieldCheck size={21} />}
        >
          <div className="space-y-4">
            <Guardrail
              title="Ràng buộc dữ liệu thực tế (Strict Grounding)"
              badge="Bắt buộc"
              badgeClass="bg-red-200 text-red-600"
              description="Nghiêm cấm AI tự sáng tác tiện nghi phòng, giá tiền ảo hoặc khách sạn không tồn tại trong cơ sở dữ liệu đối tác StayReco."
              checked={strictGrounding}
              onCheckedChange={setStrictGrounding}
            />
            <Guardrail
              title="Tự động chuyển tiếp nhân viên (Human Fallback)"
              badge="Khuyên dùng"
              badgeClass="bg-green-200 text-green-700"
              description="Khi khách hàng phát sinh khiếu nại chất lượng lưu trú hoặc yêu cầu cấu hình phòng đặc biệt, AI lập tức mời kết nối với lễ tân trực tiếp."
              checked={humanFallback}
              onCheckedChange={setHumanFallback}
            />
            <div className="rounded-xl bg-muted p-4">
              <div className="flex justify-between gap-3 text-xs">
                <span className="font-semibold">
                  Ngưỡng lọc nội dung tiêu cực & gian lận thẻ
                </span>
                <strong className="text-primary">
                  Nghiêm ngặt (Strict Level {guardrailLevel})
                </strong>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">
                  Linh hoạt
                </span>
                <Slider
                  min={1}
                  max={3}
                  step={1}
                  value={[guardrailLevel]}
                  onValueChange={(value) =>
                    setGuardrailLevel(sliderNumber(value, 3))
                  }
                />
                <span className="text-[10px] font-semibold text-primary">
                  Tuyệt đối
                </span>
              </div>
            </div>
          </div>
        </Workspace>
      </section>

      <Card
        ref={sandboxRef}
        className="scroll-mt-24 rounded-2xl border-0 bg-card p-6 shadow-sm lg:p-7"
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Bot className="text-brand-accent" size={22} />
              <h2 className="text-lg font-bold">
                Khu vực thử nghiệm nhanh Prompt (AI Playground Sandbox)
              </h2>
              <span className="rounded bg-brand-accent-soft px-2 py-0.5 text-[10px] font-bold text-brand-accent">
                Môi trường Test Admin
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Giả lập câu hỏi của du khách để kiểm tra phản hồi của hệ thống RAG
              & Guardrails trước khi phát hành toàn mạng lưới.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreset(boutiquePrompt)}
            >
              Thử mẫu: “Resort Phú Quốc cho gia đình”
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreset(guardrailPrompt)}
            >
              Thử bẫy ảo giác: “Giá phòng 50k”
            </Button>
          </div>
        </div>
        <div className="mt-6 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="sandbox-prompt"
                className="flex items-center gap-2 text-xs font-semibold"
              >
                <Settings2 size={16} className="text-primary" />
                Prompt Du khách (User Query Simulator)
              </label>
              <span className="font-mono text-[11px] text-muted-foreground">
                Locale: vi-VN
              </span>
            </div>
            <Textarea
              id="sandbox-prompt"
              rows={3}
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setResponseKind('default');
              }}
              className="mt-3 min-h-28 resize-none border-0 bg-muted p-4 text-xs leading-relaxed"
              placeholder="Nhập câu hỏi thử nghiệm của du khách tại đây..."
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Database size={15} /> RAG Context PMS: Kích hoạt
              </span>
              <Button className="h-10" disabled={running} onClick={runSandbox}>
                {running ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                {running ? 'Đang kiểm tra...' : 'Chạy kiểm tra thử'}
              </Button>
            </div>
          </div>
          <SandboxResponse
            kind={running ? 'default' : responseKind}
            loading={running}
          />
        </div>
      </Card>
    </div>
  );
}

function TelemetryCard({
  eyebrow,
  title,
  value,
  suffix,
  detail,
  children,
  side,
  valueClass = 'text-primary',
  tag,
  trend,
  trendClass,
}: {
  eyebrow: string;
  title: string;
  value: string;
  suffix?: string;
  detail: string;
  children: React.ReactNode;
  side: React.ReactNode;
  valueClass?: string;
  tag?: string;
  trend?: string;
  trendClass?: string;
}) {
  return (
    <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-[minmax(190px,1fr)_minmax(260px,1.5fr)_minmax(240px,1fr)] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
            {tag && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {tag}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-bold">{title}</h2>
          <p className={`mt-1 text-2xl font-bold tracking-tight ${valueClass}`}>
            {value}{' '}
            {suffix && (
              <span className="text-xs font-normal text-muted-foreground">
                {suffix}
              </span>
            )}{' '}
            {trend && (
              <span className={`ml-1 text-xs font-semibold ${trendClass}`}>
                {trend}
              </span>
            )}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {detail}
          </p>
        </div>
        <div className="space-y-3">{children}</div>
        <div>{side}</div>
      </div>
    </Card>
  );
}
function TokenGauge() {
  return (
    <div className="relative grid size-24 shrink-0 place-items-center">
      <svg
        className="size-full -rotate-90"
        viewBox="0 0 100 100"
        aria-label="48.5 phần trăm token đã dùng"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-border"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset="129.36"
          className="text-primary"
        />
      </svg>
      <div className="absolute text-center">
        <strong className="text-lg">48.5%</strong>
        <p className="text-[10px] text-muted-foreground">Đã dùng</p>
      </div>
    </div>
  );
}
function AccuracyChart() {
  return (
    <div className="rounded-xl bg-muted p-4">
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>7 ngày qua</span>
        <span className="font-medium text-foreground">12.420 kiểm chứng</span>
      </div>
      <div className="mt-3 flex h-8 items-end gap-1.5 rounded-lg bg-card px-1 py-0.5">
        {[88, 92, 90, 96, 94, 98, 99.4].map((height, index) => (
          <span
            key={height}
            className={`flex-1 rounded-t ${index === 6 ? 'bg-green-500' : 'bg-green-300'}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
function Workspace({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm lg:p-7">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="pt-4">{children}</div>
    </Card>
  );
}
function EngineCard({
  badge,
  badgeClass,
  title,
  status,
  description,
  value,
  options,
  buttonLabel,
  meta,
  footer,
}: {
  badge: string;
  badgeClass: string;
  title: string;
  status: string;
  description: string;
  value: string;
  options: [string, string][];
  buttonLabel: string;
  meta: string[];
  footer: string;
}) {
  const [selected, setSelected] = useState(value);
  return (
    <div className="rounded-xl border border-border bg-muted/70 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${badgeClass}`}
            >
              {badge}
            </span>
            <h3 className="text-sm font-bold">{title}</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-700">
              <i className="size-1.5 rounded-full bg-green-500" />
              {status}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NativeSelect
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="[&>select]:h-9 [&>select]:bg-card [&>select]:text-xs"
          >
            {options.map(([optionValue, label]) => (
              <option key={optionValue} value={optionValue}>
                {label}
              </option>
            ))}
          </NativeSelect>
          <Button variant="outline" size="icon-lg" aria-label={buttonLabel}>
            <Sparkles size={18} />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex flex-wrap gap-2">
          {meta.map((item) => (
            <span
              key={item}
              className="rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {footer}
        </span>
      </div>
    </div>
  );
}
function Region({
  value,
  selected,
  onChange,
  title,
  description,
  label,
}: {
  value: 'sg' | 'tokyo';
  selected: 'sg' | 'tokyo';
  onChange: (value: 'sg' | 'tokyo') => void;
  title: string;
  description: string;
  label: string;
}) {
  const labelClass =
    value === 'sg'
      ? 'bg-green-200 text-green-700'
      : 'bg-gray-300 text-muted-foreground';
  return (
    <form className="flex cursor-pointer gap-3 rounded-xl bg-muted p-3">
      <input
        type="radio"
        name="region"
        value={value}
        checked={selected === value}
        onChange={() => onChange(value)}
        className="mt-1 accent-primary"
      />
      <span className="text-xs">
        <strong>{title}</strong>
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {description}
        </span>
        <span
          className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${labelClass}`}
        >
          {label}
        </span>
      </span>
    </form>
  );
}
function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card p-2.5">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold font-mono">{value}</p>
    </div>
  );
}
function Guardrail({
  title,
  badge,
  badgeClass,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  badge: string;
  badgeClass: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-muted p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xs font-bold">{title}</h3>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}
          >
            {badge}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={title}
      />
    </div>
  );
}
function SandboxResponse({
  kind,
  loading,
}: {
  kind: ResponseKind;
  loading: boolean;
}) {
  const blocked = kind === 'blocked';
  const latency = blocked ? '280ms' : kind === 'safe' ? '412ms' : '395ms';
  const tokens = blocked ? '184' : kind === 'safe' ? '295' : '312';
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 font-semibold">
          <Terminal size={16} className="text-success" />
          Kết quả phản hồi của StayReco Intelligence
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          Thời gian: {latency} • Tokens: {tokens}
        </span>
      </div>
      <div className="mt-3 min-h-35 rounded-xl bg-muted p-5 text-xs leading-relaxed">
        {loading ? (
          <div className="flex min-h-24 items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin" />
            Mô hình đang truy xuất dữ liệu PMS & áp dụng Guardrails...
          </div>
        ) : blocked ? (
          <BlockedResponse />
        ) : (
          <SafeResponse compact={kind === 'safe'} />
        )}
      </div>
    </div>
  );
}
function SafeResponse({ compact }: { compact: boolean }) {
  return (
    <div className="space-y-3">
      <p>
        {compact
          ? 'Chào bạn, StayReco đã rà soát phòng trống thời gian thực theo yêu cầu:'
          : 'Chào bạn, dựa trên tiêu chí nghỉ dưỡng yên tĩnh và phong vị ẩm thực bản địa tại Phú Quốc, StayReco gợi ý 2 lựa chọn phù hợp nhất với quỹ ngân sách ~2.500.000₫/đêm của bạn:'}
      </p>
      <div className={`grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <Hotel
          name="Camia Resort & Spa"
          rating="4.7"
          detail="Khu vực Ông Lang, bãi biển riêng, hoàng hôn đẹp. Buffet sáng bún quậy & hải sản tươi."
          price="2.350.000₫ / đêm"
        />
        {!compact && (
          <Hotel
            name="Lahana Resort Phu Quoc"
            rating="4.8"
            detail="Không gian xanh sinh thái, hồ bơi vô cực trên đồi, cách bãi biển 5 phút xe điện riêng."
            price="2.680.000₫ / đêm"
          />
        )}
      </div>
      <ResponseFooter
        text={
          compact
            ? 'Grounded against Live PMS (ID: #PQ-CAMIA-44)'
            : 'Grounded against PMS Database (ID: #PQ-9941, #PQ-8812)'
        }
      />
    </div>
  );
}
function Hotel({
  name,
  rating,
  detail,
  price,
}: {
  name: string;
  rating: string;
  detail: string;
  price: string;
}) {
  return (
    <div className="rounded-lg bg-card p-3 shadow-sm">
      <div className="flex justify-between gap-3">
        <strong className="text-primary">{name}</strong>
        <span className="text-[10px] font-bold text-success">★ {rating}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
      <p className="mt-2 font-bold text-brand-accent">
        {price}{' '}
        <span className="text-[10px] font-normal text-muted-foreground">
          (Đã gồm thuế/phí)
        </span>
      </p>
    </div>
  );
}
function BlockedResponse() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-destructive/10 p-3 font-medium text-destructive">
        [Safety Filter Intercepted] Phát hiện yêu cầu không tương thích dữ liệu
        thực địa.
      </div>
      <p>
        Hệ thống StayReco không tìm thấy phòng khách sạn 5 sao nào tại Đà Nẵng
        với mức giá 50.000₫/đêm. Các khách sạn 5 sao mặt biển tại khu vực Võ
        Nguyên Giáp thường có giá dao động từ 1.800.000₫ đến 5.500.000₫/đêm theo
        mùa.
      </p>
      <div className="flex justify-between gap-3 text-[11px]">
        <span className="font-medium text-destructive">
          Bị chặn: Ràng buộc giá trị thực (Strict Grounding)
        </span>
        <span className="text-muted-foreground">
          Latency: 280ms • Tokens: 184
        </span>
      </div>
    </div>
  );
}
function ResponseFooter({ text }: { text: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px]">
      <span className="flex items-center gap-1 font-medium text-success">
        <Verified size={14} />
        {text}
      </span>
      <span className="text-muted-foreground">Safety: Pass (0 violations)</span>
    </div>
  );
}
function sliderNumber(value: number | readonly number[], fallback: number) {
  return typeof value === 'number' ? value : (value[0] ?? fallback);
}
