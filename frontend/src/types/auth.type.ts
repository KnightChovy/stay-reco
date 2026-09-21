import { User } from "./user.type";

export type LoginPayload = {
  email: string;
  password: string;
};

export interface AuthResponse extends User {
  accessToken: string;
  refreshToken?: string;
}
