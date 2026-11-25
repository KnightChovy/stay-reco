import type {
  APIResponse,
  CustomerWallet,
  DiscountQuote,
  DiscountQuoteInput,
  LoyaltyAccount,
  LoyaltyEntry,
  PageMeta,
  Voucher,
  WalletTransaction,
  WalletTransactionListQuery,
} from "@stayreco/shared";
import { apiService } from "./ApiService";

/** Giảm giá, điểm StayMiles và ví khách (docs/api/promotions.md, loyalty.md, customer-wallet.md). */

/** Không giữ gì, không tiêu gì: chỉ báo tổng sau giảm giá và điểm để gửi lại làm `expectedTotal`. */
export const getDiscountQuote = async (payload: DiscountQuoteInput) => {
  const { data } = await apiService.post<APIResponse<DiscountQuote>>("/bookings/discount-quote", payload);
  return data.data;
};

export const getMyVouchers = async (query: { active?: boolean; page?: number; pageSize?: number } = {}) => {
  const { data } = await apiService.get<APIResponse<Voucher[]>>("/me/vouchers", { params: query });
  return { vouchers: data.data, meta: data.meta as PageMeta };
};

/** Tài khoản được mở ở lần đọc đầu, khách chưa có điểm thấy số dư 0. */
export const getMyLoyalty = async () => {
  const { data } = await apiService.get<APIResponse<LoyaltyAccount>>("/me/loyalty");
  return data.data;
};

export const getLoyaltyEntries = async (query: { page?: number; pageSize?: number } = {}) => {
  const { data } = await apiService.get<APIResponse<LoyaltyEntry[]>>("/me/loyalty/entries", { params: query });
  return { entries: data.data, meta: data.meta as PageMeta };
};

export const getMyWallet = async () => {
  const { data } = await apiService.get<APIResponse<CustomerWallet>>("/me/wallet");
  return data.data;
};

export const getWalletTransactions = async (query: Partial<WalletTransactionListQuery> = {}) => {
  const { data } = await apiService.get<APIResponse<WalletTransaction[]>>("/me/wallet/transactions", {
    params: query,
    // `type` lặp key (`?type=REFUND&type=BOOKING_PAYMENT`), không dùng `type[]`.
    paramsSerializer: { indexes: null },
  });
  return { transactions: data.data, meta: data.meta as PageMeta };
};

/** Trả cả đơn bằng số dư ví (W1: không trả một phần); 204, đọc lại đơn để thấy CONFIRMED. */
export const payWithWallet = async (bookingId: string) => {
  await apiService.post(`/bookings/${bookingId}/pay-with-wallet`);
};
