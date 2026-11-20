"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { fetchUnread } from "../chat.api";
import type { UnreadSummary } from "../chat.types";

/**
 * Shared unread badge source for navigation chrome.
 *
 * Uses the SAME query key as useChat, so every message the chat surfaces
 * receive invalidates this cache and the badges update instantly while the
 * user is anywhere in the app. Outside the chat surfaces there is no socket
 * mounted (deliberately - one socket per session, owned by useChatWebsocket),
 * so a short poll keeps the badge honest without opening a second connection.
 */
export const CHAT_UNREAD_KEY = ["chat", "unread"] as const;

const EMPTY: UnreadSummary = { total: 0, guest: 0, host: 0, support: 0 };

export function useChatUnread() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!user?.id;

  const query = useQuery({
    queryKey: CHAT_UNREAD_KEY,
    queryFn: fetchUnread,
    enabled,
    staleTime: 10_000,
    refetchInterval: enabled ? 20_000 : false,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const unread = query.data ?? EMPTY;

  return {
    unread,
    /** Client surface: enquiries as a customer + support. */
    clientUnread: unread.guest + unread.support,
    /** Vendor surface: enquiries as a host + support. */
    vendorUnread: unread.host + unread.support,
    isLoading: query.isLoading,
  };
}