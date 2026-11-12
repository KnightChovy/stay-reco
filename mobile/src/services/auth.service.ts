import type {
  Account,
  APIResponse,
  AuthResult,
  ChangePasswordInput,
  EmailInput,
  LoginInput,
  RegisterCustomerInput,
  RegisterResult,
  UpdateProfileInput,
  VerifyEmailInput,
} from "@stayreco/shared";
import { apiService, multipart } from "./ApiService";

/** JPEG, PNG hoặc WebP, tối đa 10MB (field `file`); ảnh mới thay ảnh cũ. */
export const uploadAvatar = async (form: FormData): Promise<Account> => {
  const { data } = await apiService.post<APIResponse<Account>>("/me/avatar", form, multipart);
  return data.data;
};

export const deleteAvatar = async (): Promise<void> => {
  await apiService.delete("/me/avatar");
};

export const login = async (payload: LoginInput): Promise<APIResponse<AuthResult>> => {
  const { data } = await apiService.post<APIResponse<AuthResult>>("/auth/login", payload);
  return data;
};

/** Tạo tài khoản PENDING_VERIFICATION và gửi mã 6 số qua email; chưa cấp token. */
export const registerCustomer = async (
  payload: RegisterCustomerInput,
): Promise<APIResponse<RegisterResult>> => {
  const { data } = await apiService.post<APIResponse<RegisterResult>>("/auth/register/customer", payload);
  return data;
};

/** Xác thực mã 6 số và đăng nhập luôn (kết quả giống login). */
export const verifyEmail = async (payload: VerifyEmailInput): Promise<APIResponse<AuthResult>> => {
  const { data } = await apiService.post<APIResponse<AuthResult>>("/auth/verify-email", payload);
  return data;
};

export const resendVerification = async (payload: EmailInput): Promise<void> => {
  await apiService.post("/auth/resend-verification", payload);
};

export const forgotPassword = async (payload: EmailInput): Promise<void> => {
  await apiService.post("/auth/forgot-password", payload);
};

export const getMe = async (): Promise<APIResponse<Account>> => {
  const { data } = await apiService.get<APIResponse<Account>>("/auth/me");
  return data;
};

export const logout = async (): Promise<void> => {
  await apiService.post("/auth/logout");
};

/** Giữ phiên trên máy này, đăng xuất các thiết bị khác. */
export const changePassword = async (payload: ChangePasswordInput): Promise<void> => {
  await apiService.post("/auth/change-password", payload);
};

/** Field của role khác trả VALIDATION_ERROR: customer chỉ gửi fullName, phone, dateOfBirth, gender, nationality. */
export const updateProfile = async (payload: UpdateProfileInput): Promise<Account> => {
  const { data } = await apiService.patch<APIResponse<Account>>("/me/profile", payload);
  return data.data;
};
