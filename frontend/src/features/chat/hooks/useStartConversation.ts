"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth/useAuth";
import { getCurrentReturnTo, withReturnTo } from "@/features/auth/auth.utils";
import { createConversation, type CreateConversationInput } from "../chat.api";

/**
 * The single way every "Chat with vendor" / "Chat with client" entry point
 * opens a thread.
 *
 * Fixes three defects at once:
 *  - navigation always carries the conversationId (the saved hub used to drop
 *    it and land on an empty inbox),
 *  - the destination surface matches where the user is (a vendor stays on
 *    /vendor/messages instead of being thrown into the client inbox),
 *  - failures are surfaced instead of swallowed by console.error, and an
 *    expired session returns to the exact page after sign-in.
 */
export function useStartConversation() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { isAuthenticated, loading } = useAuth();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (
      input: CreateConversationInput,
      opts: { surface?: "client" | "vendor" } = {}
    ): Promise<string | null> => {
      setError(null);
      if (loading) return null;

      if (!isAuthenticated) {
        router.push(withReturnTo("/login", getCurrentReturnTo()));
        return null;
      }

      const surface =
        opts.surface ?? (pathname.startsWith("/vendor") ? "vendor" : "client");
      const base = surface === "vendor" ? "/vendor/messages" : "/messages";

      setPending(true);
      try {
        const result = await createConversation(input);
        router.push(`${base}?conversationId=${result.id}`);
        return result.id;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push(withReturnTo("/login", getCurrentReturnTo()));
          return null;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "We couldn't open this chat. Please try again."
        );
        return null;
      } finally {
        setPending(false);
      }
    },
    [isAuthenticated, loading, pathname, router]
  );

  return { start, pending, error, clearError: () => setError(null) };
}