"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorCode } from "@/lib/api-error";
import { useAuthStore } from "@/lib/auth-store";
import {
  useConfirmProposal,
  useConversation,
  useConversations,
  useSendAssistantMessage,
} from "../api/assistant-queries";
import { chatErrorMessage, isAssistantOff } from "../lib/chat-errors";
import type { StayDates } from "./ChatParts";

/** The conversation a customer had open last, so the chat bubble and /assistant resume it (per browser only). */
const ACTIVE_KEY = "stayreco-assistant-active";

function readActive() {
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

/** Other tabs change it too; listening keeps the stored value fresh without reading it during render on the server. */
function subscribeActive(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function writeActive(id: string | null) {
  try {
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // Storage blocked: the chat still works, it just starts fresh next time.
  }
}

/**
 * Everything one chat window needs: which conversation is open, its messages, the message being sent (shown at
 * once, before the reply arrives), errors, and the booking confirmation. Shared by the floating bubble and /assistant.
 */
export function useAssistantChat(initialId?: string | null) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isCustomer = user?.role === "customer";

  // `undefined` until the customer picks or starts a conversation here; until then the URL, then the stored one.
  const [chosenId, setChosenId] = useState<string | null | undefined>(undefined);
  const storedId = useSyncExternalStore(subscribeActive, readActive, () => null);
  const [draft, setDraft] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assistantOff, setAssistantOff] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Proposals expire after 30 minutes: re-read the clock now and then rather than on every render.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const setActiveId = useCallback((id: string | null) => {
    setChosenId(id);
    writeActive(id);
    setError(null);
  }, []);

  const candidateId = chosenId !== undefined ? chosenId : (initialId ?? storedId);
  const conversations = useConversations(isCustomer);
  const conversation = useConversation(candidateId, isCustomer);
  // A conversation that no longer exists (or belongs to another account on this browser) is simply not open.
  const notFound = !!conversation.error && getApiErrorCode(conversation.error) === "CONVERSATION_NOT_FOUND";
  const activeId = notFound ? null : candidateId;
  const send = useSendAssistantMessage();
  const confirm = useConfirmProposal();

  // Forget it in storage too, so the next visit starts clean (an external store, not React state).
  useEffect(() => {
    if (notFound && storedId === candidateId) writeActive(null);
  }, [notFound, storedId, candidateId]);

  const messages = useMemo(() => conversation.data?.messages ?? [], [conversation.data]);

  const dates: StayDates = useMemo(() => {
    const latest = [...messages].reverse().find((message) => message.proposal)?.proposal;
    return latest ? { checkIn: latest.checkIn, checkOut: latest.checkOut, guests: latest.guests, rooms: latest.rooms } : null;
  }, [messages]);

  const sendText = useCallback(
    (raw: string) => {
      const content = raw.trim();
      if (!content || send.isPending) return;
      setError(null);
      setPendingText(content);
      setDraft("");
      send.mutate(
        { conversationId: activeId, content },
        {
          onSuccess: (reply) => {
            setPendingText(null);
            if (reply.conversationId !== activeId) setActiveId(reply.conversationId);
          },
          onError: (sendError) => {
            // Nothing was stored: give the words back so the customer can resend them.
            setPendingText(null);
            setDraft(content);
            if (isAssistantOff(sendError)) setAssistantOff(true);
            setError(chatErrorMessage(sendError));
          },
        },
      );
    },
    [activeId, send, setActiveId],
  );

  const confirmProposal = useCallback(
    (proposalId: string) => {
      if (!activeId || confirm.isPending) return;
      setError(null);
      confirm.mutate(
        { conversationId: activeId, proposalId },
        {
          onSuccess: (booking) => router.push(`/booking/payment?id=${booking.id}`),
          onError: (confirmError) => setError(chatErrorMessage(confirmError)),
        },
      );
    },
    [activeId, confirm, router],
  );

  return {
    user,
    isCustomer,
    activeId,
    setActiveId,
    startNew: () => setActiveId(null),
    conversations,
    conversation,
    messages,
    pendingText,
    sending: send.isPending,
    draft,
    setDraft,
    sendText,
    error,
    clearError: () => setError(null),
    assistantOff,
    dates,
    now,
    confirmingId: confirm.isPending ? (confirm.variables?.proposalId ?? null) : null,
    confirmProposal,
  };
}
