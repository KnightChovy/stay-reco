import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { APIResponse, RefreshResult } from "@stayreco/shared";

export const apiService = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
    // Không gửi "web" để backend trả refreshToken trong body thay vì cookie.
    "X-Client-Type": "mobile",
  },
  timeout: 10000,
});

export const session = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
  /** Người dùng chọn "Ghi nhớ đăng nhập": refreshToken được lưu lại qua các lần mở app. */
  remember: false,
  onExpired: () => {},
};

const REFRESH_TOKEN_KEY = "stayreco.refreshToken";
// shortcut: SecureStore không chạy trên web nên bản web không ghi nhớ đăng nhập; mobile là nền tảng chính.
const canPersist = Platform.OS !== "web";

/** Lưu refreshToken vào Keychain/Keystore; null để xóa. */
export async function persistRefreshToken(token: string | null) {
  if (!canPersist) return;
  try {
    if (token) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // Lưu thất bại chỉ làm mất "ghi nhớ", phiên hiện tại vẫn dùng được.
  }
}

export async function loadRefreshToken(): Promise<string | null> {
  if (!canPersist) return null;
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearSession() {
  session.accessToken = null;
  session.refreshToken = null;
  session.remember = false;
  void persistRefreshToken(null);
}

// Các request cùng lúc bị 401 dùng chung một lần refresh.
let refreshing: Promise<string> | null = null;

/** Đổi refreshToken lấy accessToken mới; backend xoay vòng refreshToken nên lưu lại token mới. */
export function refreshSession(): Promise<string> {
  refreshing ??= apiService
    .post<APIResponse<RefreshResult>>("/auth/refresh", { refreshToken: session.refreshToken })
    .then(({ data }) => {
      session.accessToken = data.data.accessToken;
      session.refreshToken = data.data.refreshToken ?? session.refreshToken;
      if (session.remember) void persistRefreshToken(session.refreshToken);
      return data.data.accessToken;
    })
    .catch((err: unknown) => {
      // Chỉ đăng xuất khi server từ chối token; mất mạng thì giữ phiên để thử lại sau.
      if (axios.isAxiosError(err) && err.response) {
        clearSession();
        session.onExpired();
      }
      throw err;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

apiService.interceptors.request.use((config) => {
  if (session.accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

apiService.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status !== 401 ||
      error.response.data?.code !== "UNAUTHENTICATED" ||
      !request ||
      request._retry ||
      !session.refreshToken ||
      request.url?.includes("/auth/refresh") ||
      request.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    const token = await refreshSession();
    request._retry = true;
    request.headers.Authorization = `Bearer ${token}`;
    return apiService(request);
  },
);
