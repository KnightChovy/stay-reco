"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Account, UpdateProfileInput } from "@stayreco/shared";
import * as authService from "@/services/auth.service";
import { accountToAuthUser, useAuthStore } from "@/lib/auth-store";
import type { ChangePasswordPayload } from "@/types/auth.type";

export const accountKeys = {
  all: ["account"] as const,
  me: () => [...accountKeys.all, "me"] as const,
  sessions: () => [...accountKeys.all, "sessions"] as const,
};

/** Keeps the header/avatar in sync: the auth store holds the signed-in user shown across the app. */
function useSyncAccount() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  return (account: Account) => {
    queryClient.setQueryData(accountKeys.me(), account);
    setUser(accountToAuthUser(account));
  };
}

/** The full account (role profile included: date of birth, gender, nationality for a customer). */
export function useMe() {
  return useQuery({
    queryKey: accountKeys.me(),
    queryFn: async () => (await authService.getMe()).data,
  });
}

export function useUpdateProfile() {
  const sync = useSyncAccount();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => authService.updateProfile(input),
    onSuccess: sync,
  });
}

export function useUploadAvatar() {
  const sync = useSyncAccount();
  return useMutation({
    mutationFn: (file: File) => authService.uploadAvatar(file),
    onSuccess: sync,
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.removeAvatar,
    onSuccess: () => {
      const user = useAuthStore.getState().user;
      if (user) useAuthStore.getState().setUser({ ...user, avatarUrl: undefined });
      void queryClient.invalidateQueries({ queryKey: accountKeys.me() });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangePasswordPayload) => authService.changePassword(input),
    // The other devices are signed out.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: accountKeys.sessions() }),
  });
}

export function useSessions() {
  return useQuery({ queryKey: accountKeys.sessions(), queryFn: authService.getSessions });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: accountKeys.sessions() }),
  });
}

/** Signs out every device, this one included: the caller then clears the local session. */
export function useLogoutAll() {
  return useMutation({ mutationFn: authService.logoutAll });
}
