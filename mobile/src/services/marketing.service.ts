import type {
  AiBudget,
  APIResponse,
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
  PageMeta,
  ScheduleContentInput,
  ScheduleListQuery,
  SocialAccount,
  UpdateContentInput,
} from "@stayreco/shared";
import { apiService, multipart } from "./ApiService";

/**
 * Marketing AI phase 5 cho nhân viên có quyền MARKETING (docs/api/marketing.md), cùng endpoint với
 * frontend/src/services/marketing.service.ts. Duyệt bài, kết nối trang và giọng thương hiệu là việc của chủ khách sạn.
 */

/**
 * AI đôi khi trả xuống dòng bị escape (hai ký tự `\` `n`): đổi lại thành xuống dòng thật trên mọi thứ đọc từ API,
 * để màn hình hiện đúng đoạn văn và lần lưu sau lưu đúng. Giống cleanAiText bên frontend.
 */
export function cleanAiText(text: string) {
  return text.replace(/\\r\\n|\\n|\\r/g, "\n").replace(/\\t/g, " ");
}

function clean<T extends { body: string; title: string | null }>(item: T): T {
  return { ...item, body: cleanAiText(item.body), title: item.title === null ? null : cleanAiText(item.title) };
}

// `status` lặp key (`?status=A&status=B`), không dùng `status[]`.
const repeated = { paramsSerializer: { indexes: null } };

/** Giọng thương hiệu, chỉ đọc với nhân viên (chủ khách sạn thiết lập). */
export const getBrandVoice = async (hotelId: string) => {
  const { data } = await apiService.get<APIResponse<BrandVoice>>(`/hotels/${hotelId}/brand-voice`);
  return data.data;
};

export const getAiBudget = async (hotelId: string) => {
  const { data } = await apiService.get<APIResponse<AiBudget>>(`/hotels/${hotelId}/ai-budget`);
  return data.data;
};

/** Truy vấn DB, không gọi model: làm mới thoải mái. */
export const getContentIdeas = async (hotelId: string) => {
  const { data } = await apiService.get<APIResponse<ContentIdea[]>>(`/hotels/${hotelId}/marketing-content/ideas`);
  return data.data;
};

/** Một lần gọi model, tính vào ngân sách AI tháng của khách sạn; lâu hơn timeout mặc định 10s. */
export const generateContent = async (hotelId: string, input: GenerateContentInput) => {
  const { data } = await apiService.post<APIResponse<MarketingContent>>(`/hotels/${hotelId}/marketing-content/generate`, input, { timeout: 60000 });
  return clean(data.data);
};

/** AI viết 3 phiên bản, chưa lưu gì; nhân viên chọn (và có thể sửa) một bản rồi gửi `createContent`. Một lần gọi model. */
export const generateContentVariants = async (hotelId: string, input: GenerateContentInput) => {
  const { data } = await apiService.post<APIResponse<ContentVariant[]>>(`/hotels/${hotelId}/marketing-content/variants`, input, { timeout: 90000 });
  return data.data.map(clean);
};

/** Lưu bản nhân viên chọn (hoặc tự viết) thành DRAFT. Không gọi model. */
export const createContent = async (hotelId: string, input: CreateContentInput) => {
  const { data } = await apiService.post<APIResponse<MarketingContent>>(`/hotels/${hotelId}/marketing-content`, input);
  return clean(data.data);
};

export const getContents = async (hotelId: string, params: Partial<ContentListQuery> = {}) => {
  const { data } = await apiService.get<APIResponse<MarketingContent[]>>(`/hotels/${hotelId}/marketing-content`, { params, ...repeated });
  return { items: data.data.map(clean), meta: data.meta as PageMeta };
};

export const getContent = async (contentId: string) => {
  const { data } = await apiService.get<APIResponse<MarketingContent>>(`/marketing-content/${contentId}`);
  return clean(data.data);
};

/** Chỉ khi bài còn DRAFT hoặc REJECTED. */
export const updateContent = async (contentId: string, input: UpdateContentInput) => {
  const { data } = await apiService.patch<APIResponse<MarketingContent>>(`/marketing-content/${contentId}`, input);
  return clean(data.data);
};

/** Field `file`; JPEG/PNG/WebP tối đa 10MB, thay ảnh hiện có. */
export const uploadContentImage = async (contentId: string, form: FormData) => {
  const { data } = await apiService.post<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/image`, form, multipart);
  return clean(data.data);
};

/** AI vẽ ảnh cho bài (khoảng $0.07, trừ vào ngân sách AI tháng), thay ảnh hiện có. */
export const generateContentImage = async (contentId: string, input: GenerateImageInput) => {
  const { data } = await apiService.post<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/image/generate`, input, { timeout: 120000 });
  return clean(data.data);
};

export const removeContentImage = async (contentId: string) => {
  const { data } = await apiService.delete<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/image`);
  return clean(data.data);
};

/** DRAFT hoặc REJECTED → PENDING_APPROVAL; chủ khách sạn quyết định. */
export const submitContent = async (contentId: string) => {
  const { data } = await apiService.post<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/submit`);
  return clean(data.data);
};

export const deleteContent = async (contentId: string) => {
  await apiService.delete(`/marketing-content/${contentId}`);
};

export const getSocialAccounts = async (hotelId: string) => {
  const { data } = await apiService.get<APIResponse<SocialAccount[]>>(`/hotels/${hotelId}/social-accounts`);
  return data.data;
};

/** Chỉ bài đã duyệt. Không có `scheduledAt` nghĩa là đăng ở lượt chạy kế tiếp của job, trong vòng 1 phút (M14). */
export const scheduleContent = async (contentId: string, input: ScheduleContentInput) => {
  const { data } = await apiService.post<APIResponse<ContentSchedule>>(`/marketing-content/${contentId}/schedule`, input);
  return data.data;
};

export const getSchedules = async (hotelId: string, params: Partial<ScheduleListQuery> = {}) => {
  const { data } = await apiService.get<APIResponse<ContentSchedule[]>>(`/hotels/${hotelId}/content-schedules`, { params, ...repeated });
  return { schedules: data.data, meta: data.meta as PageMeta };
};

export const cancelSchedule = async (scheduleId: string) => {
  const { data } = await apiService.delete<APIResponse<ContentSchedule>>(`/content-schedules/${scheduleId}`);
  return data.data;
};

/** Mọi lần đo, mới nhất trước; mỗi lần làm mới thêm một dòng (M15). */
export const getScheduleMetrics = async (scheduleId: string) => {
  const { data } = await apiService.get<APIResponse<ContentMetric[]>>(`/content-schedules/${scheduleId}/metrics`);
  return data.data;
};

export const refreshScheduleMetrics = async (scheduleId: string) => {
  const { data } = await apiService.post<APIResponse<ContentMetric>>(`/content-schedules/${scheduleId}/metrics/refresh`);
  return data.data;
};
