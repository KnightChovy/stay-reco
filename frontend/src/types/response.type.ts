export interface APIResponse<T> {
  success: boolean;
  message: string;
  status?: number;
  data: T;
}
