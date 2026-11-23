import { api } from "@/lib/axios";
import type {
  AiBudget,
  BrandVoice,
  ContentIdea,
  ContentListQuery,
  ContentMetric,
  ContentSchedule,
  ContentVariant,
  CreateContentInput,
  GenerateContentInput,
  GenerateImageInput,
  MarketingContent,
  ScheduleContentInput,
  ScheduleListQuery,
  SocialAccount,
  UpdateContentInput,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Phase 5 AI marketing endpoints a hotel staff member uses (docs/api/marketing.md): ideas, the AI writer, editing and
 * submitting a draft, its picture, scheduling approved content and reading how a post did. Approving, connecting a
 * page and learning the brand voice belong to the owner and are not called from here.
 */

export type ContentListParams = Partial<ContentListQuery>;
export type ScheduleListParams = Partial<ScheduleListQuery>;

const repeated = { paramsSerializer: { indexes: null } };

/**
 * The AI writer sometimes returns its line breaks escaped: the two characters `\` `n` instead of a new line, which
 * then show in the text. Turn them back into real breaks on everything read from the API, so the screens show the
 * paragraphs and the next save stores them properly.
 */
export function cleanAiText(text: string) {
  return text.replace(/\\r\\n|\\n|\\r/g, "\n").replace(/\\t/g, " ");
}

function clean<T extends { body?: string; title?: string | null }>(item: T): T {
  return {
    ...item,
    ...(typeof item.body === "string" ? { body: cleanAiText(item.body) } : {}),
    ...(typeof item.title === "string" ? { title: cleanAiText(item.title) } : {}),
  };
}

// ── Voice and budget (read only for staff) ─────────────────

export async function getBrandVoice(hotelId: string) {
  const { data } = await api.get<APIResponse<BrandVoice>>(`/hotels/${hotelId}/brand-voice`);
  return data.data;
}

export async function getAiBudget(hotelId: string) {
  const { data } = await api.get<APIResponse<AiBudget>>(`/hotels/${hotelId}/ai-budget`);
  return data.data;
}

// ── Content ─────────────────────────────────────────────────

/** Database queries, not a model call: free to refresh. */
export async function getContentIdeas(hotelId: string) {
  const { data } = await api.get<APIResponse<ContentIdea[]>>(`/hotels/${hotelId}/marketing-content/ideas`);
  return data.data;
}

/** One model call, counted against the hotel's monthly AI budget. */
export async function generateContent(hotelId: string, input: GenerateContentInput) {
  const { data } = await api.post<APIResponse<MarketingContent>>(
    `/hotels/${hotelId}/marketing-content/generate`,
    input,
    // A model call takes longer than the default 15 s.
    { timeout: 60_000 },
  );
  return clean(data.data);
}

/**
 * Three versions of one brief in a single model call (counted against the budget); none is saved until staff pick one
 * and send it to `createContent`.
 */
export async function generateContentVariants(hotelId: string, input: GenerateContentInput) {
  const { data } = await api.post<APIResponse<ContentVariant[]>>(
    `/hotels/${hotelId}/marketing-content/variants`,
    input,
    { timeout: 90_000 },
  );
  return data.data.map(clean);
}

/** Saves the version staff picked (or wrote) as a DRAFT. No model call. */
export async function createContent(hotelId: string, input: CreateContentInput) {
  const { data } = await api.post<APIResponse<MarketingContent>>(`/hotels/${hotelId}/marketing-content`, input);
  return clean(data.data);
}

export async function getContents(hotelId: string, params: ContentListParams = {}) {
  const { data } = await api.get<APIResponse<MarketingContent[]>>(`/hotels/${hotelId}/marketing-content`, {
    params,
    ...repeated,
  });
  return { contents: data.data.map(clean), meta: data.meta as PageMeta };
}

export async function getContent(contentId: string) {
  const { data } = await api.get<APIResponse<MarketingContent>>(`/marketing-content/${contentId}`);
  return clean(data.data);
}

/** Only while the piece is a DRAFT or REJECTED. */
export async function updateContent(contentId: string, input: UpdateContentInput) {
  const { data } = await api.patch<APIResponse<MarketingContent>>(`/marketing-content/${contentId}`, input);
  return clean(data.data);
}

/** JPEG, PNG or WebP up to 10 MB; replaces the current picture. */
export async function uploadContentImage(contentId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
  });
  return clean(data.data);
}

/**
 * The image model draws the picture of a DRAFT or REJECTED piece and it is attached like an upload, replacing the
 * current one. About $0.07 a picture, from the same monthly budget as the words.
 */
export async function generateContentImage(contentId: string, input: GenerateImageInput) {
  const { data } = await api.post<APIResponse<MarketingContent>>(
    `/marketing-content/${contentId}/image/generate`,
    input,
    { timeout: 120_000 },
  );
  return clean(data.data);
}

export async function removeContentImage(contentId: string) {
  const { data } = await api.delete<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/image`);
  return clean(data.data);
}

/** DRAFT or REJECTED → PENDING_APPROVAL; the owner decides. */
export async function submitContent(contentId: string) {
  const { data } = await api.post<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/submit`);
  return clean(data.data);
}

export async function deleteContent(contentId: string) {
  await api.delete(`/marketing-content/${contentId}`);
}

// ── Pages, calendar and figures ─────────────────────────────

export async function getSocialAccounts(hotelId: string) {
  const { data } = await api.get<APIResponse<SocialAccount[]>>(`/hotels/${hotelId}/social-accounts`);
  return data.data;
}

/** Approved content only. No `scheduledAt` means the next run of the publisher, within a minute (M14). */
export async function scheduleContent(contentId: string, input: ScheduleContentInput) {
  const { data } = await api.post<APIResponse<ContentSchedule>>(`/marketing-content/${contentId}/schedule`, input);
  return clean(data.data);
}

export async function getSchedules(hotelId: string, params: ScheduleListParams = {}) {
  const { data } = await api.get<APIResponse<ContentSchedule[]>>(`/hotels/${hotelId}/content-schedules`, {
    params,
    ...repeated,
  });
  return { schedules: data.data.map(clean), meta: data.meta as PageMeta };
}

export async function cancelSchedule(scheduleId: string) {
  const { data } = await api.delete<APIResponse<ContentSchedule>>(`/content-schedules/${scheduleId}`);
  return clean(data.data);
}

/** Every reading, newest first; each refresh appends one (M15). */
export async function getScheduleMetrics(scheduleId: string) {
  const { data } = await api.get<APIResponse<ContentMetric[]>>(`/content-schedules/${scheduleId}/metrics`);
  return data.data;
}

export async function refreshScheduleMetrics(scheduleId: string) {
  const { data } = await api.post<APIResponse<ContentMetric>>(`/content-schedules/${scheduleId}/metrics/refresh`);
  return data.data;
}
