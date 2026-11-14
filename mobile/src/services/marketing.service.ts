import type {
  AiBudget,
  APIResponse,
  ContentIdea,
  ContentListQuery,
  ContentMetric,
  ContentSchedule,
  GenerateContentInput,
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

// `status` lặp key (`?status=A&status=B`), không dùng `status[]`.
const repeated = { paramsSerializer: { indexes: null } };

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
  return data.data;
};

export const getContents = async (hotelId: string, params: Partial<ContentListQuery> = {}) => {
  const { data } = await apiService.get<APIResponse<MarketingContent[]>>(`/hotels/${hotelId}/marketing-content`, { params, ...repeated });
  return { items: data.data, meta: data.meta as PageMeta };
};

export const getContent = async (contentId: string) => {
  const { data } = await apiService.get<APIResponse<MarketingContent>>(`/marketing-content/${contentId}`);
  return data.data;
};

/** Chỉ khi bài còn DRAFT hoặc REJECTED. */
export const updateContent = async (contentId: string, input: UpdateContentInput) => {
  const { data } = await apiService.patch<APIResponse<MarketingContent>>(`/marketing-content/${contentId}`, input);
  return data.data;
};

/** Field `file`; JPEG/PNG/WebP tối đa 10MB, thay ảnh hiện có. */
export const uploadContentImage = async (contentId: string, form: FormData) => {
  const { data } = await apiService.post<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/image`, form, multipart);
  return data.data;
};

export const removeContentImage = async (contentId: string) => {
  const { data } = await apiService.delete<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/image`);
  return data.data;
};

/** DRAFT hoặc REJECTED → PENDING_APPROVAL; chủ khách sạn quyết định. */
export const submitContent = async (contentId: string) => {
  const { data } = await apiService.post<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/submit`);
  return data.data;
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
