import { api } from "@/lib/axios";
import type { InvitationResult, InviteAccountInput } from "@stayreco/shared";
import type { APIResponse } from "@/types/response.type";

/** Admin endpoints. Only the platform manager invitation exists until Phase 6 (docs/phases/phase-6-reporting-admin.md). */

export async function invitePlatformManager(input: InviteAccountInput) {
  const { data } = await api.post<APIResponse<InvitationResult>>("/auth/invitations/platform-manager", input);
  return data.data;
}
