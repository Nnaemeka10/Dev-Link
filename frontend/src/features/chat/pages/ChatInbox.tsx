"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MobileDock from "@/components/layout/MobileDock";
import SideNavBar from "@/components/layout/SideNavBar";
import VendorMobileDock from "@/components/layout/VendorMobileDock";
import VendorSideNavBar from "@/components/layout/VendorSideNavBar";
import { useAuth } from "@/features/auth/useAuth";
import { createConversation, fetchConversations } from "../chat.api";
import type { ChatRole, ChatThread } from "../chat.types";
import { chatKeys, useChat } from "../hooks/useChat";
import { ConversationList } from "../components/ConversationList";
import { ChatWindow } from "../components/ChatWindow";

/**
 * ONE inbox, two role-scoped views.
 *
 * The data model is shared: a participant has a role per conversation, so the
 * same account can be `host` in one thread and `guest` in another. The route
 * selects which side is shown; it never forks the store, the socket or the
 * unread pipeline. Support threads appear in both views.
 *
 * Rendered once - the previous version mounted three CSS-hidden copies, which
 * tripled scroll containers and effect sets.
 */
export default function ChatInbox() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const role: ChatRole = pathname.startsWith("/vendor") ? "host" : "guest";
  const basePath = role === "host" ? "/vendor/messages" : "/messages";
  const activeThreadId = searchParams.get("conversationId");
  const userId = user?.id ? Number(user.id) : undefined;

  const [showArchived, setShowArchived] = useState(false);

  const chat = useChat(userId, activeThreadId, role);

  const archivedQuery = useQuery({
    queryKey: [...chatKeys.conversations(role), "archived"],
    queryFn: () => fetchConversations(role, { archived: true }),
    enabled: !!userId && showArchived,
    staleTime: 15_000,
  });

  const archivedThreads = useMemo(
    () => (archivedQuery.data ?? []).filter((thread) => !!thread.archived_at),
    [archivedQuery.data]
  );

  const visibleThreads: ChatThread[] = showArchived ? archivedThreads : chat.conversations;

  function handleSelect(id: string) {
    router.push(`${basePath}?conversationId=${id}`);
  }

  function handleBack() {
    router.push(basePath);
  }

  function refreshLists() {
    void queryClient.invalidateQueries({ queryKey: chatKeys.conversations(role) });
    void queryClient.invalidateQueries({ queryKey: [...chatKeys.conversations(role), "archived"] });
    void queryClient.invalidateQueries({ queryKey: chatKeys.unread });
  }

  async function handleArchive(id: string, archived: boolean) {
    await chat.setArchived({ conversationId: id, archived });
    refreshLists();
    if (archived && id === activeThreadId) handleBack();
  }

  async function handleMute(id: string, until: string | null) {
    await chat.setMuted({ conversationId: id, until });
    refreshLists();
  }

  async function handleContactSupport() {
    try {
      const result = await createConversation({ support: true });
      router.push(`${basePath}?conversationId=${result.id}`);
    } catch {
      router.push(basePath);
    }
  }

  const otherSurface =
    user?.isVendor === true
      ? role === "host"
        ? {
            label: "Client messages",
            unread: chat.unread.guest,
            onNavigate: () => router.push("/messages"),
          }
        : {
            label: "Client enquiries",
            unread: chat.unread.host,
            onNavigate: () => router.push("/vendor/messages"),
          }
      : null;

  const listPane = (
    <ConversationList
      conversations={visibleThreads}
      activeId={activeThreadId}
      isLoading={showArchived ? archivedQuery.isLoading : chat.isLoadingThreads}
      isError={showArchived ? archivedQuery.isError : !!chat.threadsError}
      onRetry={() => (showArchived ? void archivedQuery.refetch() : void chat.refetchThreads())}
      onSelect={handleSelect}
      onArchive={(id, archived) => void handleArchive(id, archived)}
      onMute={(id, until) => void handleMute(id, until)}
      currentUserId={userId ?? 0}
      role={role}
      otherSurface={otherSurface}
      showArchived={showArchived}
      onToggleArchived={() => setShowArchived((value) => !value)}
      onContactSupport={() => void handleContactSupport()}
    />
  );

  return (
    <div className="min-h-dvh bg-bg-primary">
      {/* Desktop rail - same 15% column both surfaces use. */}
      <div className="hidden xl:block">
        {role === "host" ? <VendorSideNavBar /> : <SideNavBar />}
      </div>

      <div className="xl:ml-[15%] xl:w-[85%]">
        <div
          className={`flex h-dvh overflow-hidden ${
            activeThreadId ? "md:pb-19" : "pb-19"
          } xl:pb-0`}
        >
          {/* List pane: full screen on mobile, fixed column from md up. */}
          <aside
            className={`${
              activeThreadId ? "hidden md:flex" : "flex"
            } w-full min-w-0 flex-col border-[#F0E9DF] bg-white md:w-85 md:shrink-0 md:border-r lg:w-95`}
          >
            {listPane}
          </aside>

          {/* Thread pane */}
          <main
            className={`${
              activeThreadId ? "flex" : "hidden md:flex"
            } min-w-0 flex-1 flex-col`}
          >
            <ChatWindow
              chat={chat}
              currentUserId={userId ?? 0}
              role={role}
              onBack={handleBack}
            />
          </main>
        </div>
      </div>

      {/* Mobile/tablet dock. Hidden on mobile while a thread is open so the
          composer owns the bottom of the screen. */}
      <div className={`${activeThreadId ? "hidden md:block" : "block"} xl:hidden`}>
        {role === "host" ? <VendorMobileDock /> : <MobileDock />}
      </div>
    </div>
  );
}