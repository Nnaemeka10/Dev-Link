"use client";

import MobileDock from "@/components/layout/MobileDock";
import SideNavBar from "@/components/layout/SideNavBar";
import VendorMobileDock from "@/components/layout/VendorMobileDock";
import VendorSideNavBar from "@/components/layout/VendorSideNavBar";
import { useTheparam } from "@/hooks/useTheparam";
import { useAuth } from "@/features/auth/useAuth"; // Adjust import path as needed
import { useChat } from "../hooks/useChat";
import { ConversationList } from "../components/ConversationList";
import { ChatWindow } from "../components/ChatWindow";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ChatThread } from "../chat.types";

export default function MessagesPage() {
  const { user } = useAuth(); 
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("conversationId");

  
  const userId = user?.id ? Number(user.id) : undefined;
  
  const { 
    conversations, activeThreadId, activeMessages, isLoadingThreads, 
    isSending, handleSendMessage, handleTyping, typingStatus, setActiveThreadId 
  } = useChat(userId);

  useEffect(() => {
    if (initialConversationId && !activeThreadId) {
      setActiveThreadId(initialConversationId);
    }
  }, [initialConversationId, activeThreadId, setActiveThreadId]);


  const path = useTheparam();
  
  const dockMapping = {
    vendor: <VendorMobileDock />,
    home: <MobileDock />
  };
  
  const sideNavMapping = {
    vendor: <VendorSideNavBar />,
    home: <SideNavBar />
  };

  const activeConversation = useMemo(() => {
    const found = conversations.find((c) => c.id === activeThreadId);
    if (found) return found;

    if (activeThreadId && isLoadingThreads) {
      return {
        id: activeThreadId,
        type: "direct" as const,
        participants: [],
        unread_count: 0,
        last_read_message_id: 0,
        delivered_message_id: 0,
        updated_at: new Date().toISOString(),
        name: "Loading..."
      } satisfies ChatThread;
    }

    return null;
  }, [conversations, activeThreadId, isLoadingThreads]);

  // const onTyping = useCallback((isTyping: boolean) => {
  //   // Typing logic is handled inside useChat, but we can expose emit here if needed
  // }, []);

  return (
    <>
      {/* Mobile View */}
      <section className="flex flex-col md:hidden min-h-screen bg-white">
        {activeConversation ? (
          <div className="flex flex-col h-screen">
            <ChatWindow 
              conversation={activeConversation} 
              messages={activeMessages} 
              currentUserId={userId ?? 0}
              isTyping={typingStatus}
              isSending={isSending}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onBack={() => setActiveThreadId(null)} 
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              <ConversationList conversations={conversations} activeId={activeThreadId} onSelect={setActiveThreadId} />
            </div>
            <div className="pb-4">{dockMapping[path]}</div>
          </>
        )}
      </section>

      {/* Tablet View */}
      <section className="hidden md:flex xl:hidden flex-col h-screen bg-white">
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 shrink-0 border-r border-gray-100 overflow-y-auto">
            <ConversationList conversations={conversations} activeId={activeThreadId} onSelect={setActiveThreadId} />
          </aside>
          <main className="flex-1 overflow-hidden">
            <ChatWindow 
              conversation={activeConversation} 
              messages={activeMessages} 
              currentUserId={userId ?? 0}
              isTyping={typingStatus}
              isSending={isSending}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
            />
          </main>
        </div>
        {dockMapping[path]}
      </section>

      {/* Desktop View */}
      <section className="hidden xl:flex min-h-screen bg-bg-primary">
        {sideNavMapping[path]}
        <div className="w-[85%] ml-[15%] flex h-screen">
          <div className="flex flex-1 overflow-hidden bg-white rounded-tl-2xl shadow-sm border border-gray-100">
            <aside className="w-80 shrink-0 border-r border-gray-100 overflow-y-auto">
              <ConversationList conversations={conversations} activeId={activeThreadId} onSelect={setActiveThreadId} />
            </aside>
            <main className="flex-1 overflow-hidden">
              <ChatWindow 
                conversation={activeConversation} 
                messages={activeMessages} 
                currentUserId={userId ?? 0}
                isTyping={typingStatus}
                isSending={isSending}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
              />
            </main>
          </div>
        </div>
      </section>
    </>
  );
}