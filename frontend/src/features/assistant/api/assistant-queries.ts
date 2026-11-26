"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssistantMessage, AssistantReply, Conversation, ConversationSummary } from "@stayreco/shared";
import * as assistantService from "@/services/assistant.service";
import { bookingKeys } from "@/features/booking/api/booking-queries";
import { rewardsKeys } from "@/features/account/api/rewards-queries";

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
    // Streamed: the handlers show the status and the text while the reply is written.
    mutationFn: ({
      conversationId,
      content,
      handlers,
    }: {
      conversationId: string | null;
      content: string;
      handlers: assistantService.StreamHandlers;
    }) => assistantService.streamMessage(conversationId, content, handlers),
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

/** 👍 / 👎 on an answer: written into the open conversation at once, put back if the request fails. */
export function useRateMessage() {
  const queryClient = useQueryClient();
  const write = (conversationId: string, messageId: string, feedback: AssistantMessage["feedback"]) =>
    queryClient.setQueryData<Conversation>(assistantKeys.conversation(conversationId), (current) =>
      current && {
        ...current,
        messages: current.messages.map((m) => (m.id === messageId ? { ...m, feedback } : m)),
      },
    );
  return useMutation({
    mutationFn: ({ conversationId, messageId, value }: { conversationId: string; messageId: string; value: AssistantMessage["feedback"]; previous: AssistantMessage["feedback"] }) =>
      assistantService.rateMessage(conversationId, messageId, value),
    onMutate: ({ conversationId, messageId, value }) => write(conversationId, messageId, value),
    onError: (_error, { conversationId, messageId, previous }) => write(conversationId, messageId, previous),
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

/**
 * "Xác nhận huỷ": the booking is cancelled, or its refund is waiting for the hotel. The conversation shows the outcome
 * and a note; trips and the wallet are refreshed since both may have changed.
 */
export function useConfirmCancellation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, proposalId }: { conversationId: string; proposalId: string }) =>
      assistantService.confirmCancellation(conversationId, proposalId),
    onSuccess: (booking, { conversationId }) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      void queryClient.invalidateQueries({ queryKey: assistantKeys.conversation(conversationId) });
      void queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, "my-trips"] });
      void queryClient.invalidateQueries({ queryKey: rewardsKeys.all });
    },
  });
}
