"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import {
  learnBrandVoiceSchema,
  updateBrandVoiceSchema,
  type BrandVoice,
  type LearnBrandVoiceInput,
  type UpdateBrandVoiceInput,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as marketingService from "@/services/marketing.service";
import { marketingKeys } from "../api/marketing-queries";
import { getMarketingErrorMessage } from "../lib/marketing-errors";
import { AiBudgetNote } from "./MarketingParts";

const voiceFields = [
  { key: "summary", label: "Giọng văn", hint: "Ví dụ: ấm áp, xưng \"chúng tôi\", câu ngắn.", max: 2000, rows: 3 },
  { key: "audience", label: "Khách hướng tới", hint: "Ví dụ: cặp đôi và gia đình nghỉ cuối tuần.", max: 1000, rows: 2 },
  { key: "highlights", label: "Điểm nổi bật nên nhắc", hint: "Ví dụ: hồ bơi vô cực, bãi biển riêng, spa.", max: 1000, rows: 2 },
  { key: "forbiddenWords", label: "Từ không được dùng", hint: "Cách nhau bằng dấu phẩy.", max: 1000, rows: 2 },
] as const;
type VoiceKey = (typeof voiceFields)[number]["key"];
type VoiceDraft = Record<VoiceKey, string>;

const toDraft = (voice: BrandVoice | undefined): VoiceDraft => ({
  summary: voice?.summary ?? "",
  audience: voice?.audience ?? "",
  highlights: voice?.highlights ?? "",
  forbiddenWords: voice?.forbiddenWords ?? "",
});

/**
 * Staff with MARKETING set the brand voice the AI writes in: by hand (`PATCH brand-voice`, only the changed fields,
 * an emptied one sent as `null`) or learnt from 2–5 sample posts (`brand-voice/learn`, one AI call).
 * The voice belongs to the hotel's partner, so it is shared by every hotel of the same owner.
 */
export function BrandVoiceDialog({
  open,
  onOpenChange,
  hotelId,
  voice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  voice: BrandVoice | undefined;
}) {
  const [mode, setMode] = useState<"edit" | "learn">("edit");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Giọng thương hiệu</DialogTitle>
          <DialogDescription>
            AI dùng mô tả này mỗi khi viết bài. Giọng văn dùng chung cho mọi khách sạn của cùng chủ.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1.5" role="tablist" aria-label="Cách đặt giọng thương hiệu">
          {(
            [
              ["edit", "Tự mô tả"],
              ["learn", "Học từ bài mẫu"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                "h-10 rounded-lg px-3 text-xs font-semibold transition",
                mode === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {open &&
          (mode === "edit" ? (
            <VoiceForm hotelId={hotelId} voice={voice} onDone={() => onOpenChange(false)} />
          ) : (
            <LearnForm hotelId={hotelId} onDone={() => onOpenChange(false)} />
          ))}
      </DialogContent>
    </Dialog>
  );
}

function useVoiceChanged(hotelId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: marketingKeys.voice(hotelId) });
    void queryClient.invalidateQueries({ queryKey: marketingKeys.budget(hotelId) });
  };
}

function VoiceForm({ hotelId, voice, onDone }: { hotelId: string; voice: BrandVoice | undefined; onDone: () => void }) {
  const stored = toDraft(voice);
  const [draft, setDraft] = useState<VoiceDraft>(stored);
  const [errors, setErrors] = useState<FieldErrors>({});
  const changed = useVoiceChanged(hotelId);
  const save = useMutation({
    mutationFn: (input: UpdateBrandVoiceInput) => marketingService.updateBrandVoice(hotelId, input),
    onSuccess: () => {
      changed();
      onDone();
    },
    onError: (error) => setErrors(getApiFieldErrors(error)),
  });

  const edited = voiceFields.filter(({ key }) => draft[key].trim() !== stored[key]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = Object.fromEntries(edited.map(({ key }) => [key, draft[key].trim() || null]));
    const result = validateWith(updateBrandVoiceSchema, input);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    save.mutate(result.data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {voiceFields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`voice-${field.key}`} className="text-xs font-semibold">
              {field.label}
            </Label>
            <Textarea
              id={`voice-${field.key}`}
              value={draft[field.key]}
              rows={field.rows}
              maxLength={field.max}
              disabled={save.isPending}
              aria-invalid={!!errors[field.key]}
              onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
            />
            <p className={cn("text-xs", errors[field.key] ? "text-destructive" : "text-muted-foreground")}>
              {errors[field.key] ?? field.hint}
            </p>
          </div>
        ))}
      </div>
      {save.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
          {getMarketingErrorMessage(save.error)}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" className="h-10 gap-1.5" disabled={edited.length === 0 || save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
          Lưu giọng thương hiệu
        </Button>
      </div>
    </form>
  );
}

function LearnForm({ hotelId, onDone }: { hotelId: string; onDone: () => void }) {
  const [samples, setSamples] = useState(["", ""]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const changed = useVoiceChanged(hotelId);
  const learn = useMutation({
    mutationFn: (input: LearnBrandVoiceInput) => marketingService.learnBrandVoice(hotelId, input),
    onSuccess: () => {
      changed();
      onDone();
    },
    onError: (error) => setErrors(getApiFieldErrors(error)),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateWith(learnBrandVoiceSchema, { samples: samples.filter((text) => text.trim()) });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    learn.mutate(result.data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Dán 2–5 bài đăng bạn ưng ý (mỗi bài từ 40 ký tự). AI đọc và viết lại mô tả giọng văn, thay cho mô tả hiện tại.
      </p>
      {samples.map((text, index) => (
        <div key={index} className="space-y-1.5">
          <Label htmlFor={`sample-${index}`} className="text-xs font-semibold">
            Bài mẫu {index + 1}
          </Label>
          <div className="flex gap-2">
            <Textarea
              id={`sample-${index}`}
              value={text}
              rows={3}
              maxLength={5000}
              disabled={learn.isPending}
              aria-invalid={!!errors[`samples.${index}`]}
              onChange={(event) =>
                setSamples((current) => current.map((value, i) => (i === index ? event.target.value : value)))
              }
            />
            {samples.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0"
                aria-label={`Bỏ bài mẫu ${index + 1}`}
                onClick={() => setSamples((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            )}
          </div>
          {errors[`samples.${index}`] && <p className="text-xs text-destructive">{errors[`samples.${index}`]}</p>}
        </div>
      ))}
      {errors.samples && <p className="text-xs text-destructive">{errors.samples}</p>}
      {samples.length < 5 && (
        <Button type="button" variant="outline" className="h-10 gap-1.5" onClick={() => setSamples((current) => [...current, ""])}>
          <Plus className="size-4" aria-hidden /> Thêm bài mẫu
        </Button>
      )}
      {learn.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
          {getMarketingErrorMessage(learn.error)}
        </p>
      )}
      <AiBudgetNote hotelId={hotelId} cost="$0.001" />
      <div className="flex justify-end">
        <Button type="submit" className="h-10 gap-1.5" disabled={learn.isPending}>
          {learn.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
          {learn.isPending ? "AI đang đọc…" : "Học giọng văn"}
        </Button>
      </div>
    </form>
  );
}
