import { api } from "@/lib/axios";
import { AuthResponse, LoginPayload } from "@/types/auth.type";
import { APIResponse } from "@/types/response.type";

export const login = async (
  payload: LoginPayload,
): Promise<APIResponse<AuthResponse>> => {
  const { data } = await api.post<APIResponse<AuthResponse>>(
    "/auth/login",
    payload,
  );
  return data;
};
