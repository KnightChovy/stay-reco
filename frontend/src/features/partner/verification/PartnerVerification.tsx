'use client';

import { useState } from 'react';
import { Building2, Check, ChevronLeft, ChevronRight, FileCheck2, Landmark, MapPinned, ShieldCheck, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PartnerPanel, PartnerTitle, usePartnerActions } from '@/features/partner/components';
import {
  partnerLegalFields,
  partnerPropertyFields,
  partnerVerificationDocuments,
  partnerVerificationReview,
  partnerVerificationSteps,
} from '@/lib/partner-data';

export default function PartnerVerification() {
  const { notify } = usePartnerActions();
  const [step, setStep] = useState(0);
  return <div className="space-y-6">
    <PartnerTitle title="Xác minh hồ sơ đối tác khách sạn" description="Hoàn thiện từng bước để StayReco xác thực pháp nhân, cơ sở lưu trú và quyền mở bán của An Nhiên Riverside Hotel." action={<span className="rounded-full bg-brand-accent-soft px-3 py-2 text-xs font-semibold text-brand-accent">Hồ sơ #VER-2026-DN-8492</span>} />

    <PartnerPanel className="p-4"><ol className="grid gap-2 md:grid-cols-4">{partnerVerificationSteps.map(([title, subtitle], index) => <li key={title} className={`flex items-center gap-3 rounded-xl p-3 ${index === step ? 'bg-primary text-primary-foreground' : index < step ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'}`}><span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${index === step ? 'bg-card text-primary' : index < step ? 'bg-success text-success-foreground' : 'bg-card'}`}>{index < step ? <Check size={15}/> : index + 1}</span><div><strong className="block text-sm">{title}</strong><span className="text-[10px] opacity-75">{subtitle}</span></div></li>)}</ol></PartnerPanel>

    <section className="grid gap-6 xl:grid-cols-[1.5fr_.72fr]">
      <PartnerPanel className="p-6">
        {step === 0 && <StepSection icon={Building2} title="Thông tin doanh nghiệp & người đại diện" description="Dữ liệu này phải trùng khớp với giấy chứng nhận đăng ký kinh doanh."><div className="grid gap-4 md:grid-cols-2">{partnerLegalFields.map((field) => <Field key={field.label} {...field} />)}</div></StepSection>}
        {step === 1 && <StepSection icon={MapPinned} title="Thông tin cơ sở lưu trú đăng ký" description="Xác nhận vị trí, quy mô và người chịu trách nhiệm vận hành thực tế."><div className="grid gap-4 md:grid-cols-2">{partnerPropertyFields.map((field) => <Field key={field.label} {...field} />)}</div><label className="mt-4 grid gap-1.5 text-xs font-semibold">Mô tả hướng dẫn khảo sát<Textarea defaultValue="Lối vào chính hướng đường Bạch Đằng, khu vực đón khách nằm tại tầng trệt. Liên hệ quản lý trước 30 phút." /></label></StepSection>}
        {step === 2 && <StepSection icon={FileCheck2} title="Hồ sơ pháp lý & tài liệu thẩm định" description="Tệp PDF/JPG/PNG, dung lượng tối đa 10MB cho mỗi tài liệu."><div className="space-y-3">{partnerVerificationDocuments.map(([name,file,status],index) => <div key={name} className="flex flex-col gap-3 rounded-xl bg-muted p-4 sm:flex-row sm:items-center"><span className={`grid size-10 place-items-center rounded-xl ${index === 2 ? 'bg-brand-accent-soft text-brand-accent' : 'bg-success-soft text-success'}`}>{index === 2 ? <UploadCloud size={18}/> : <FileCheck2 size={18}/>}</span><div className="flex-1"><strong className="text-sm text-primary">{name}</strong><p className="mt-1 text-xs text-muted-foreground">{file}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${index === 2 ? 'bg-brand-accent-soft text-brand-accent' : 'bg-success-soft text-success'}`}>{status}</span><Button variant="outline" size="sm" onClick={() => notify(index === 2 ? `Tải lên ${name}` : `Xem trước ${name}`)}>{index === 2 ? 'Tải tệp lên' : 'Xem trước'}</Button></div>)}</div></StepSection>}
        {step === 3 && <StepSection icon={ShieldCheck} title="Kiểm tra và gửi hồ sơ thẩm định" description="Rà soát lần cuối trước khi chuyển hồ sơ tới chuyên viên StayReco."><div className="space-y-3">{partnerVerificationReview.map(([title,detail,status],i)=><div key={title} className="flex items-center gap-3 rounded-xl bg-muted p-4"><span className={`grid size-9 place-items-center rounded-full ${i===2?'bg-brand-accent-soft text-brand-accent':'bg-success-soft text-success'}`}>{i===2?'!':<Check size={16}/>}</span><div className="flex-1"><strong className="text-sm text-primary">{title}</strong><p className="text-xs text-muted-foreground">{detail}</p></div><span className={`text-xs font-semibold ${i===2?'text-brand-accent':'text-success'}`}>{status}</span></div>)}</div><label className="mt-5 flex items-start gap-3 rounded-xl bg-brand-accent-soft p-4 text-sm"><input type="checkbox" defaultChecked className="mt-1 accent-primary" /><span>Tôi cam kết toàn bộ thông tin và hồ sơ tải lên là hoàn toàn chính xác, đúng pháp luật.</span></label></StepSection>}
        <div className="mt-7 flex items-center justify-between border-t pt-5"><Button variant="outline" disabled={step === 0} onClick={() => setStep(value => value - 1)}><ChevronLeft />Quay lại</Button>{step < 3 ? <Button onClick={() => setStep(value => value + 1)}>Tiếp tục bước {step + 2}<ChevronRight /></Button> : <Button onClick={() => notify('Gửi hồ sơ xác minh khách sạn')}><ShieldCheck />Gửi hồ sơ thẩm định</Button>}</div>
      </PartnerPanel>

      <aside className="space-y-5"><PartnerPanel className="p-5"><div className="flex items-center justify-between"><h2 className="font-bold text-primary">Tiến độ hồ sơ</h2><strong className="text-primary">75%</strong></div><div className="mt-3 h-2 rounded-full bg-muted"><div className="h-full w-3/4 rounded-full bg-primary" /></div><div className="mt-5 space-y-3 text-sm"><p className="flex justify-between"><span className="text-muted-foreground">Trường bắt buộc</span><strong>21/21</strong></p><p className="flex justify-between"><span className="text-muted-foreground">Tài liệu hợp lệ</span><strong>2/3</strong></p><p className="flex justify-between"><span className="text-muted-foreground">Thời gian dự kiến</span><strong>Trong 24h</strong></p></div></PartnerPanel><PartnerPanel className="p-5"><Landmark className="text-primary" size={20}/><h2 className="mt-3 font-bold text-primary">Phạm vi xác minh</h2><ul className="mt-4 space-y-3 text-sm text-muted-foreground"><li>✓ Tư cách pháp nhân kinh doanh lưu trú</li><li>✓ Điều kiện an ninh, PCCC</li><li>✓ Quyền quản lý và mở bán cơ sở</li><li>✓ Đối chiếu vị trí khảo sát thực địa</li></ul></PartnerPanel><PartnerPanel className="bg-primary p-5 text-primary-foreground"><h2 className="font-bold">Cần hỗ trợ hồ sơ?</h2><p className="mt-2 text-sm text-primary-foreground/75">Chuyên viên xác minh đối tác phản hồi từ 08:00–18:00.</p><Button className="mt-4 w-full bg-card text-primary hover:bg-card/90" onClick={() => notify('Liên hệ chuyên viên xác minh')}>Liên hệ hỗ trợ</Button></PartnerPanel></aside>
    </section>
  </div>;
}

function StepSection({ icon: Icon, title, description, children }: { icon: typeof Building2; title: string; description: string; children: React.ReactNode }) { return <section><div className="mb-6 flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={21}/></span><div><h2 className="text-lg font-bold text-primary">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div>{children}</section>; }
function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) { return <label className={`grid gap-1.5 text-xs font-semibold ${wide ? 'md:col-span-2' : ''}`}>{label}<Input defaultValue={value} className="border-0 bg-muted shadow-none" /></label>; }
