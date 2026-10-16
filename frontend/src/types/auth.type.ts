import type { LoginInput } from "@stayreco/shared";
import { User } from "./user.type";

export type LoginPayload = LoginInput;

export interface AuthResponse extends User {
  accessToken: string;
  refreshToken?: string;
}
