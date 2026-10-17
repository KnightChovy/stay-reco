import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "web",
  },
  timeout: 15000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to attach access token from global memory
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = (window as unknown as { __STAYRECO_ACCESS_TOKEN__?: string })
      .__STAYRECO_ACCESS_TOKEN__;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle token refresh automatically
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string; message?: string }>) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Only refresh on 401 with code 'UNAUTHENTICATED' and if not already retried
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "UNAUTHENTICATED" &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<{
          success: boolean;
          data: { accessToken: string; expiresIn: number };
        }>("/auth/refresh", {});
        const newToken = data.data.accessToken;

        if (typeof window !== "undefined") {
          (
            window as unknown as { __STAYRECO_ACCESS_TOKEN__?: string }
          ).__STAYRECO_ACCESS_TOKEN__ = newToken;
          window.dispatchEvent(
            new CustomEvent("stayreco:token-refreshed", {
              detail: { token: newToken },
            }),
          );
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          delete (window as unknown as { __STAYRECO_ACCESS_TOKEN__?: string })
            .__STAYRECO_ACCESS_TOKEN__;
          window.dispatchEvent(new CustomEvent("stayreco:auth-expired"));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
