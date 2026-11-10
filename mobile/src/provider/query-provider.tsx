import type { ReactNode } from "react";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Lỗi 4xx (thiếu quyền, không tìm thấy, sai trạng thái) thử lại vẫn vậy; chỉ thử lại khi mất mạng hoặc 5xx.
      retry: (failureCount, error) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        return !(status && status >= 400 && status < 500) && failureCount < 3;
      },
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
