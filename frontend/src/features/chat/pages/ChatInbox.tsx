"use client";

import MobileDock from "@/components/layout/MobileDock";
import SideNavBar from "@/components/layout/SideNavBar";
import VendorMobileDock from "@/components/layout/VendorMobileDock";
import VendorSideNavBar from "@/components/layout/VendorSideNavBar";
import { useTheparam } from "@/hooks/useTheparam";
import { useAuth } from "@/features/auth/useAuth";
import { useChat } from "../hooks/useChat";
import { ConversationList } from "../components/ConversationList";
import { ChatWindow } from "../components/ChatWindow";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatThread } from "../chat.types";

export default function MessagesPage() {
  const { user } = useAuth(); 
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Derive active conversation directly from URL
  const activeThreadId = searchParams.get("conversationId");
  
  const userId = user?.id ? Number(user.id) : undefined;
  
  const { 
    conversations, activeMessages, isLoadingThreads, 
    isSending, handleSendMessage, handleTyping, typingStatus 
  } = useChat(userId, activeThreadId);

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

  // Handle routing when a conversation is selected
  const handleSelectConversation = (id: string) => {
    router.push(`/messages?conversationId=${id}`);
  };

  // Handle routing when the back button is clicked
  const handleBack = () => {
    router.push(`/messages`);
  };

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
              onBack={handleBack} 
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              <ConversationList conversations={conversations} activeId={activeThreadId} onSelect={handleSelectConversation} />
            </div>
            <div className="pb-4">{dockMapping[path]}</div>
          </>
        )}
      </section>

      {/* Tablet View */}
      <section className="hidden md:flex xl:hidden flex-col h-screen bg-white">
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 shrink-0 border-r border-gray-100 overflow-y-auto">
            <ConversationList conversations={conversations} activeId={activeThreadId} onSelect={handleSelectConversation} />
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
              onBack={handleBack}
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
              <ConversationList conversations={conversations} activeId={activeThreadId} onSelect={handleSelectConversation} />
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