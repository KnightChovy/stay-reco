"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssistantReply, Conversation, ConversationSummary } from "@stayreco/shared";
import * as assistantService from "@/services/assistant.service";
import { bookingKeys } from "@/features/booking/api/booking-queries";

export const assistantKeys = {
  all: ["assistant"] as const,
  conversations: () => [...assistantKeys.all, "conversations"] as const,
  conversation: (id: string) => [...assistantKeys.all, "conversation", id] as const,
};

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: assistantKeys.conversations(),
    queryFn: assistantService.getConversations,
    enabled,
    staleTime: 30_000,
  });
}

export function useConversation(id: string | null, enabled = true) {
  return useQuery({
    queryKey: assistantKeys.conversation(id ?? ""),
    queryFn: () => assistantService.getConversation(id!),
    enabled: !!id && enabled,
    retry: false,
  });
}

/**
 * Sends one message: starts a conversation when there is none yet. On success the reply is written straight into the
 * conversation's cache (no refetch) and the list is told the conversation moved to the top.
 */
export function useSendAssistantMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string | null; content: string }) =>
      conversationId
        ? assistantService.sendMessage(conversationId, content)
        : assistantService.startConversation(content),
    onSuccess: (reply: AssistantReply, { conversationId }) => {
      queryClient.setQueryData<Conversation>(assistantKeys.conversation(reply.conversationId), (current) => {
        if (current) return { ...current, messages: [...current.messages, reply.message, reply.reply], updatedAt: reply.reply.createdAt };
        if (conversationId) return current;
        // A brand-new conversation: build it from the reply so the thread shows at once.
        const summary: ConversationSummary = {
          id: reply.conversationId,
          status: "OPEN",
          preview: reply.message.content.slice(0, 120),
          createdAt: reply.message.createdAt,
          updatedAt: reply.reply.createdAt,
        };
        return { ...summary, messages: [reply.message, reply.reply] };
      });
      void queryClient.invalidateQueries({ queryKey: assistantKeys.conversations() });
    },
  });
}

/** "Xác nhận đặt phòng": the booking is PENDING; the conversation now shows the booked proposal and a note. */
export function useConfirmProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, proposalId }: { conversationId: string; proposalId: string }) =>
      assistantService.confirmProposal(conversationId, proposalId),
    onSuccess: (booking, { conversationId }) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      void queryClient.invalidateQueries({ queryKey: assistantKeys.conversation(conversationId) });
      void queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, "my-trips"] });
    },
  });
}
