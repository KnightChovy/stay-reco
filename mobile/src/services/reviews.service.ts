import type {
  APIResponse,
  CreateReviewInput,
  PageMeta,
  RatingCriterion,
  RatingSummary,
  ReportReviewInput,
  Review,
  ReviewEligibility,
  ReviewListQuery,
  UpdateReviewInput,
} from "@stayreco/shared";
import { apiService, multipart } from "./ApiService";

/** Một ảnh mỗi lần (field `file`); trả cả đánh giá để màn hình vẽ lại từ một response. */
export const uploadReviewImage = async (reviewId: string, form: FormData) => {
  const { data } = await apiService.post<APIResponse<Review>>(`/reviews/${reviewId}/images`, form, multipart);
  return data.data;
};

export const deleteReviewImage = async (imageId: string) => {
  const { data } = await apiService.delete<APIResponse<Review>>(`/review-images/${imageId}`);
  return data.data;
};

/** Báo cáo không tự ẩn nội dung, quản lý nền tảng quyết định; báo lại lần hai trả 409 REPORT_ALREADY_RAISED. */
export const reportReview = async (reviewId: string, payload: ReportReviewInput) => {
  await apiService.post(`/reviews/${reviewId}/reports`, payload);
};

/** Đánh giá sau lưu trú (docs/api/reviews.md). Điểm tổng do backend tính, app không gửi. */

export const getRatingCriteria = async () => {
  const { data } = await apiService.get<APIResponse<RatingCriterion[]>>("/rating-criteria");
  return data.data;
};

export const getHotelReviews = async (hotelId: string, query: Partial<ReviewListQuery> = {}) => {
  const { data } = await apiService.get<APIResponse<Review[]>>(`/hotels/${hotelId}/reviews`, { params: query });
  return { reviews: data.data, meta: data.meta as PageMeta };
};

export const getRatingSummary = async (hotelId: string) => {
  const { data } = await apiService.get<APIResponse<RatingSummary>>(`/hotels/${hotelId}/rating-summary`);
  return data.data;
};

/** Hiện nút "Viết đánh giá" theo câu trả lời này, không tự suy luật ở app. */
export const getReviewEligibility = async (bookingId: string) => {
  const { data } = await apiService.get<APIResponse<ReviewEligibility>>(`/bookings/${bookingId}/review-eligibility`);
  return data.data;
};

export const createReview = async (bookingId: string, payload: CreateReviewInput) => {
  const { data } = await apiService.post<APIResponse<Review>>(`/bookings/${bookingId}/reviews`, payload);
  return data.data;
};

/** Gửi `subRatings` thì backend thay toàn bộ và tính lại điểm tổng, nên luôn gửi đủ mọi tiêu chí. */
export const updateReview = async (reviewId: string, payload: UpdateReviewInput) => {
  const { data } = await apiService.patch<APIResponse<Review>>(`/reviews/${reviewId}`, payload);
  return data.data;
};

/** Đánh giá của chính khách, kể cả đánh giá khách sạn đã ẩn (`isVisible: false`). */
export const getMyReviews = async (query: Partial<ReviewListQuery> = {}) => {
  const { data } = await apiService.get<APIResponse<Review[]>>("/me/reviews", { params: query });
  return { reviews: data.data, meta: data.meta as PageMeta };
};

/**
 * shortcut: chưa có `GET /reviews/:id` nên dò `/me/reviews` (100 dòng/trang) tới khi thấy;
 * thêm endpoint đọc một đánh giá nếu khách có hàng trăm đánh giá.
 */
export const findMyReview = async (reviewId: string) => {
  for (let page = 1; ; page++) {
    const { reviews, meta } = await getMyReviews({ page, pageSize: 100 });
    const found = reviews.find((r) => r.id === reviewId);
    if (found) return found;
    if (page >= meta.totalPages) throw new Error("REVIEW_NOT_FOUND");
  }
};
