"use client";

import { useState, type FormEvent } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import {
  learnBrandVoiceSchema,
  updateBrandVoiceSchema,
  type BrandVoice,
  type LearnBrandVoiceInput,
  type UpdateBrandVoiceInput,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { marketingKeys, useBrandVoice } from "@/features/staff/api/marketing-queries";
import { getApiErrorMessage, getApiFieldErrors, validateWith, type FieldErrors } from "@/lib/api-error";
import * as marketingService from "@/services/marketing.service";
import { usePartnerMutation } from "../api/partner-queries";
import {
  countChanges,
  ErrorPanel,
  FormAlert,
  FormField,
  PartnerPanel,
  savedMessage,
  StickySaveBar,
  SubmitButton,
  toOptionalText,
  usePartnerHotel,
  useUnsavedChanges,
} from "../components";
import { formatDateTime } from "../lib/labels";

const voiceFields = [
  { key: "summary", label: "Giọng văn", hint: "Ví dụ: ấm áp, xưng \"mình\", câu ngắn.", max: 2000, rows: 3 },
  { key: "audience", label: "Khách hướng tới", hint: "Ví dụ: gia đình trẻ đi nghỉ cuối tuần.", max: 1000, rows: 2 },
  { key: "highlights", label: "Điểm nổi bật nên nhắc", hint: "Ví dụ: hướng biển, bữa sáng, gần chợ đêm.", max: 1000, rows: 2 },
  { key: "forbiddenWords", label: "Từ không được dùng", hint: "Cách nhau bằng dấu phẩy.", max: 1000, rows: 2 },
] as const;
type VoiceKey = (typeof voiceFields)[number]["key"];
type VoiceDraft = Record<VoiceKey, string>;

function toDraft(voice: BrandVoice): VoiceDraft {
  return {
    summary: voice.summary ?? "",
    audience: voice.audience ?? "",
    highlights: voice.highlights ?? "",
    forbiddenWords: voice.forbiddenWords ?? "",
  };
}

export function BrandVoicePanel({ hotelId }: { hotelId: string }) {
  const voice = useBrandVoice(hotelId);
  const { canEdit } = usePartnerHotel();
  const [learnOpen, setLearnOpen] = useState(false);

  return (
    <PartnerPanel className="overflow-visible! p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-bold text-primary">Giọng thương hiệu</h2>
          <p className="text-xs text-muted-foreground">
            AI dùng mô tả này mỗi khi viết bài cho khách sạn. Giọng văn dùng chung cho mọi khách sạn của bạn.
          </p>
        </div>
        {canEdit && (
          <Button variant="outline" className="shrink-0" onClick={() => setLearnOpen(true)}>
            <Sparkles />
            Học từ bài mẫu
          </Button>
        )}
      </div>

      {voice.isLoading ? (
        <Skeleton className="mt-4 h-48 w-full" />
      ) : voice.error || !voice.data ? (
        <div className="mt-4">
          <ErrorPanel error={voice.error} onRetry={() => void voice.refetch()} />
        </div>
      ) : (
        <VoiceForm key={voice.data.updatedAt ?? "empty"} hotelId={hotelId} voice={voice.data} canEdit={canEdit} />
      )}

      <LearnVoiceDialog open={learnOpen} onOpenChange={setLearnOpen} hotelId={hotelId} />
    </PartnerPanel>
  );
}

function VoiceForm({ hotelId, voice, canEdit }: { hotelId: string; voice: BrandVoice; canEdit: boolean }) {
  const stored = toDraft(voice);
  const [draft, setDraft] = useState<VoiceDraft>(stored);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation(
    (input: UpdateBrandVoiceInput) => marketingService.updateBrandVoice(hotelId, input),
    {
      invalidate: () => [marketingKeys.voice(hotelId)],
      successMessage: () => savedMessage("giọng thương hiệu"),
      errorNotice: false,
    },
  );

  const trimmed = Object.fromEntries(voiceFields.map(({ key }) => [key, draft[key].trim()])) as VoiceDraft;
  const changes = canEdit ? countChanges(trimmed, stored) : 0;
  useUnsavedChanges(changes > 0);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const input = Object.fromEntries(
      voiceFields
        .filter(({ key }) => trimmed[key] !== stored[key])
        .map(({ key }) => [key, toOptionalText(draft[key]) ?? null]),
    );
    const result = validateWith(updateBrandVoiceSchema, input);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
      {!voice.summary && (
        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
          Chưa có giọng thương hiệu: AI đang viết theo giọng ấm áp mặc định. Dán 2–5 bài bạn ưng ý vào “Học từ bài mẫu” để
          AI tự mô tả giọng văn.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {voiceFields.map((field) => (
          <FormField key={field.key} label={field.label} hint={field.hint} error={errors[field.key]}>
            <Textarea
              value={draft[field.key]}
              onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
              rows={field.rows}
              maxLength={field.max}
              disabled={!canEdit}
            />
          </FormField>
        ))}
      </div>
      {voice.updatedAt && (
        <p className="text-xs text-muted-foreground">Cập nhật lúc {formatDateTime(voice.updatedAt)}</p>
      )}
      <FormAlert message={formError} />
      <StickySaveBar
        changes={changes}
        pending={mutation.isPending}
        onDiscard={() => {
          setDraft(stored);
          setErrors({});
          setFormError(undefined);
        }}
        submitLabel="Lưu giọng thương hiệu"
      />
    </form>
  );
}

function LearnVoiceDialog({
  open,
  onOpenChange,
  hotelId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Học giọng văn từ bài mẫu</DialogTitle>
          <DialogDescription>
            Dán 2–5 bài đăng bạn ưng ý (mỗi bài từ 40 ký tự). AI đọc và viết lại mô tả giọng văn, thay cho mô tả hiện tại.
          </DialogDescription>
        </DialogHeader>
        {open && <LearnVoiceForm hotelId={hotelId} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function LearnVoiceForm({ hotelId, onDone }: { hotelId: string; onDone: () => void }) {
  const [samples, setSamples] = useState(["", ""]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  const mutation = usePartnerMutation(
    (input: LearnBrandVoiceInput) => marketingService.learnBrandVoice(hotelId, input),
    {
      invalidate: () => [marketingKeys.voice(hotelId), marketingKeys.budget(hotelId)],
      successMessage: "AI đã cập nhật giọng thương hiệu từ bài mẫu.",
      errorNotice: false,
      onSuccess: onDone,
    },
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    const result = validateWith(learnBrandVoiceSchema, { samples: samples.filter((text) => text.trim()) });
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data, {
      onError: (error) => {
        setErrors(getApiFieldErrors(error));
        setFormError(getApiErrorMessage(error));
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      {samples.map((text, index) => (
        <FormField key={index} label={`Bài mẫu ${index + 1}`} error={errors[`samples.${index}`]}>
          <div className="flex gap-2">
            <Textarea
              value={text}
              onChange={(event) =>
                setSamples((current) => current.map((value, i) => (i === index ? event.target.value : value)))
              }
              rows={3}
              maxLength={5000}
            />
            {samples.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Bỏ bài mẫu ${index + 1}`}
                onClick={() => setSamples((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        </FormField>
      ))}
      {errors.samples && <p className="text-xs text-danger">{errors.samples}</p>}
      {samples.length < 5 && (
        <Button type="button" variant="outline" size="sm" onClick={() => setSamples((current) => [...current, ""])}>
          <Plus />
          Thêm bài mẫu
        </Button>
      )}
      <FormAlert message={formError} />
      <div className="flex justify-end">
        <SubmitButton pending={mutation.isPending}>
          <Sparkles />
          {mutation.isPending ? "AI đang đọc…" : "Học giọng văn"}
        </SubmitButton>
      </div>
    </form>
  );
}
