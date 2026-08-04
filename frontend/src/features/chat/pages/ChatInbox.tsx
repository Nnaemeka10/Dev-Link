
// // ─── Sub-components ───────────────────────────────────────────────────────────

// function Avatar({
//   conversation,
//   size = "md",
// }: {
//   conversation: Conversation;
//   size?: "sm" | "md" | "lg";
// }) {
//   const sizeClasses = {
//     sm: "w-8 h-8 text-xs",
//     md: "w-11 h-11 text-sm",
//     lg: "w-12 h-12 text-sm",
//   };

//   return (
//     <div className="relative flex-shrink-0">
//       {conversation.avatarUrl ? (
//         <img
//           src={conversation.avatarUrl}
//           alt={conversation.name}
//           className={`${sizeClasses[size]} rounded-full object-cover`}
//         />
//       ) : (
//         <div
//           className={`${sizeClasses[size]} rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-800`}
//         >
//           {conversation.initials ?? conversation.name.slice(0, 2).toUpperCase()}
//         </div>
//       )}
//       {conversation.isOnline && (
//         <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
//       )}
//     </div>
//   );
// }

// function ConversationItem({
//   conversation,
//   isActive,
//   onClick,
// }: {
//   conversation: Conversation;
//   isActive: boolean;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors ${
//         isActive
//           ? "bg-orange-50 border border-orange-100"
//           : "hover:bg-gray-50 border border-transparent"
//       }`}
//     >
//       <Avatar conversation={conversation} size="md" />
//       <div className="flex-1 min-w-0">
//         <div className="flex items-center justify-between gap-2 mb-0.5">
//           <span
//             className={`text-sm truncate ${
//               isActive
//                 ? "font-semibold text-gray-900"
//                 : "font-medium text-gray-800"
//             }`}
//           >
//             {conversation.name}
//           </span>
//           <span className="text-xs text-gray-400 flex-shrink-0">
//             {conversation.lastMessageTime}
//           </span>
//         </div>
//         <div className="flex items-center justify-between gap-2">
//           <p className="text-xs text-gray-500 truncate">
//             {conversation.lastMessage}
//           </p>
//           {conversation.unread && (
//             <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
//           )}
//         </div>
//       </div>
//     </button>
//   );
// }

// function ConversationList({
//   conversations,
//   activeId,
//   onSelect,
// }: {
//   conversations: Conversation[];
//   activeId: string | null;
//   onSelect: (id: string) => void;
// }) {
//   const [search, setSearch] = useState("");
//   const filtered = conversations.filter((c) =>
//     c.name.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="flex flex-col h-full">
//       {/* Header */}
//       <div className="px-5 pt-6 pb-4">
//         <div className="flex items-center justify-between mb-5">
//           <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
//             Messages
//           </h2>
//           <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500">
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               strokeWidth={1.5}
//               stroke="currentColor"
//               className="w-5 h-5"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
//               />
//             </svg>
//           </button>
//         </div>
//         {/* Search */}
//         <div className="relative">
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//             strokeWidth={1.5}
//             stroke="currentColor"
//             className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"
//             />
//           </svg>
//           <input
//             type="text"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search messages"
//             className="w-full bg-gray-100 border-0 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition-colors"
//           />
//         </div>
//       </div>

//       {/* List */}
//       <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
//         {filtered.length > 0 ? (
//           filtered.map((c) => (
//             <ConversationItem
//               key={c.id}
//               conversation={c}
//               isActive={activeId === c.id}
//               onClick={() => onSelect(c.id)}
//             />
//           ))
//         ) : (
//           <p className="text-center text-sm text-gray-400 mt-10">
//             No conversations found
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

// function ChatWindow({
//   conversation,
//   onBack,
// }: {
//   conversation: Conversation;
//   onBack?: () => void;
// }) {
//   const [text, setText] = useState("");
//   const [messages, setMessages] = useState<ChatMessage[]>(
//     conversation.messages
//   );
//   const bottomRef = useRef<HTMLDivElement>(null);



//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const handleSend = () => {
//     const trimmed = text.trim();
//     if (!trimmed) return;
//     const newMsg: ChatMessage = {
//       id: `m-${Date.now()}`,
//       sender: "me",
//       text: trimmed,
//       timestamp: new Date().toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//       }),
//       status: "sent",
//     };
//     setMessages((prev) => [...prev, newMsg]);
//     setText("");
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   return (
//     <div className="flex flex-col h-full">
//      
//      

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-gray-50">
//         <div className="flex justify-center mb-2">
//           <span className="text-[11px] font-medium text-gray-400 bg-gray-200 rounded-full px-3 py-1">
//             Today
//           </span>
//         </div>
//         {messages.map((msg) =>
//           msg.sender === "them" ? (
//             <div key={msg.id} className="flex items-end gap-2.5 max-w-[80%]">
//               <Avatar conversation={conversation} size="sm" />
//               <div>
//                 {msg.imageUrl && (
//                   <div className="bg-white rounded-2xl rounded-bl-sm border border-gray-100 overflow-hidden mb-1 shadow-sm max-w-[280px]">
//                     <img
//                       src={msg.imageUrl}
//                       alt={msg.imageAlt ?? "Attachment"}
//                       className="w-full h-44 object-cover"
//                     />
//                     {msg.text && (
//                       <p className="px-4 py-3 text-sm text-gray-800 leading-relaxed">
//                         {msg.text}
//                       </p>
//                     )}
//                   </div>
//                 )}
//                 {!msg.imageUrl && (
//                   <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
//                     <p className="text-sm text-gray-800 leading-relaxed">
//                       {msg.text}
//                     </p>
//                   </div>
//                 )}
//                 <span className="text-[11px] text-gray-400 mt-1 block ml-1">
//                   {msg.timestamp}
//                 </span>
//               </div>
//             </div>
//           ) : (
//             <div
//               key={msg.id}
//               className="flex flex-row-reverse items-end gap-2.5 max-w-[80%] ml-auto"
//             >
//               <div className="flex flex-col items-end">
//                 <div className="bg-orange-500 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
//                   <p className="text-sm leading-relaxed">{msg.text}</p>
//                 </div>
//                 <span className="text-[11px] text-gray-400 mt-1 block mr-1">
//                   {msg.timestamp}
//                   {msg.status === "read" && " · Read"}
//                   {msg.status === "delivered" && " · Delivered"}
//                 </span>
//               </div>
//             </div>
//           )
//         )}
//         <div ref={bottomRef} />
//       </div>

//       {/* Input */}
      
//     </div>
//   );
// }

// function EmptyState() {
//   return (
//     <div className="flex flex-col items-center justify-center h-full text-center px-8">
//       <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           fill="none"
//           viewBox="0 0 24 24"
//           strokeWidth={1.3}
//           stroke="currentColor"
//           className="w-8 h-8 text-orange-400"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
//           />
//         </svg>
//       </div>
//       <p className="text-base font-medium text-gray-700 mb-1">
//         Your messages
//       </p>
//       <p className="text-sm text-gray-400 max-w-xs">
//         Select a conversation to read messages or start a new one.
//       </p>
//     </div>
//   );
// }

// // ─── Content (shared logic) ───────────────────────────────────────────────────

// function MessagesContent({
//   conversations = MOCK_CONVERSATIONS,
// }: {
//   conversations?: Conversation[];
// }) {
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

//   return { conversations, activeId, setActiveId, activeConversation };
// }

// // ─── Mobile View (< md) ──────────────────────────────────────────────────────

// function MobileMessagesView({ conversations }: { conversations: Conversation[] }) {
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

//   const path = useTheparam();
  
//   const pathMapping = {
//     vendor: <VendorMobileDock />,
//     home: <MobileDock />
//   }

//   return (
//     <section className="flex flex-col md:hidden min-h-screen bg-white">
//       {activeConversation ? (
//         // Full screen chat
//         <div className="flex flex-col h-screen">
//           <ChatWindow
//             key={activeConversation.id}
//             conversation={activeConversation}
//             onBack={() => setActiveId(null)}
//           />
//         </div>
//       ) : (
//         // Conversation list + dock
//         <>
//           <div className="flex-1 overflow-hidden">
//             <ConversationList
//               conversations={conversations}
//               activeId={activeId}
//               onSelect={(id) => setActiveId(id)}
//             />
//           </div>
//           <div className="pb-4">
//             {pathMapping[path]}
//           </div>
//         </>
//       )}
//     </section>
//   );
// }

// // ─── Tablet View (md → xl) ───────────────────────────────────────────────────

// function TabletMessagesView({ conversations }: { conversations: Conversation[] }) {
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
//   const path = useTheparam();
  
//   const pathMapping = {
//     vendor: <VendorMobileDock />,
//     home: <MobileDock />
//   }

//   return (
//     <section className="hidden md:flex xl:hidden flex-col h-screen bg-white">
//       <div className="flex flex-1 overflow-hidden">
//         {/* Conversation list */}
//         <aside className="w-80 flex-shrink-0 border-r border-gray-100 overflow-y-auto">
//           <ConversationList
//             conversations={conversations}
//             activeId={activeId}
//             onSelect={(id) => setActiveId(id)}
//           />
//         </aside>
//         {/* Chat pane */}
//         <main className="flex-1 overflow-hidden">
//           {activeConversation ? (
//             <ChatWindow conversation={activeConversation} key={activeConversation.id} />
//           ) : (
//             <EmptyState />
//           )}
//         </main>
//       </div>
//       {pathMapping[path]}
//     </section>
//   );
// }

// // ─── Desktop View (xl+) ──────────────────────────────────────────────────────

// function DesktopMessagesView({ conversations }: { conversations: Conversation[] }) {
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
//   const path = useTheparam();
  
//   const pathMapping = {
//     vendor: <VendorSideNavBar />,
//     home: <SideNavBar />
//   }

//   return (
//     <section className="hidden xl:flex min-h-screen bg-[#f9f6ef]">
//       {pathMapping[path]}
      
//       <div className="w-[85%] ml-[15%] flex h-screen">
//         <div className="flex flex-1 overflow-hidden bg-white rounded-tl-2xl shadow-sm border border-gray-100">
//           {/* Conversation list */}
//           <aside className="w-80 flex-shrink-0 border-r border-gray-100 overflow-y-auto">
//             <ConversationList
//               conversations={conversations}
//               activeId={activeId}
//               onSelect={(id) => setActiveId(id)}
//             />
//           </aside>
//           {/* Chat pane */}
//           <main className="flex-1 overflow-hidden">
//             {activeConversation ? (
//               <ChatWindow conversation={activeConversation} key={activeConversation.id} />
//             ) : (
//               <EmptyState />
//             )}
//           </main>
//         </div>
//       </div>
//     </section>
//   );
// }

// // ─── Page Entry Point ─────────────────────────────────────────────────────────

// export default function MessagesPage({
//   conversations = MOCK_CONVERSATIONS,
// }: {
//   conversations?: Conversation[];
// }) {
//   return (
//     <>
//       <MobileMessagesView conversations={conversations} />
//       <TabletMessagesView conversations={conversations} />
//       <DesktopMessagesView conversations={conversations} />
//     </>
//   );
// }

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
import { EmptyState } from "../components/EmptyState";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ChatThread } from "../chat.types";

export default function MessagesPage() {
  const { user } = useAuth(); 
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("conversationId");

  
  const userId = user?.id ? Number(user.id) : undefined;
  
  const { 
    conversations, activeThreadId, activeMessages, isLoadingThreads, isLoadingMessages, 
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
          <aside className="w-80 flex-shrink-0 border-r border-gray-100 overflow-y-auto">
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
      <section className="hidden xl:flex min-h-screen bg-[#f9f6ef]">
        {sideNavMapping[path]}
        <div className="w-[85%] ml-[15%] flex h-screen">
          <div className="flex flex-1 overflow-hidden bg-white rounded-tl-2xl shadow-sm border border-gray-100">
            <aside className="w-80 flex-shrink-0 border-r border-gray-100 overflow-y-auto">
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