import { create } from "zustand";
import { ChatThread, ChatMessage } from "../chat.types";

interface ChatState {
  activeThreadId: string | null;
  threads: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  typingStatus: Record<string, boolean>; // threadId -> isTyping
  
  // Actions
  setActiveThread: (id: string | null) => void;
  setThreads: (threads: ChatThread[]) => void;
  setMessages: (threadId: string, messages: ChatMessage[]) => void;
  addMessage: (threadId: string, message: ChatMessage) => void;
  updateMessageStatus: (threadId: string, messageId: string, status: ChatMessage["status"]) => void;
  setTypingStatus: (threadId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeThreadId: null,
  threads: [],
  messages: {},
  typingStatus: {},

  setActiveThread: (id) => set({ activeThreadId: id }),
  
  setThreads: (threads) => set({ threads }),
  
  setMessages: (threadId, messages) => 
    set((state) => ({
      messages: {
        ...state.messages,
        [threadId]: messages,
      },
    })),
    
  addMessage: (threadId, message) => 
    set((state) => {
      const threadMsgs = state.messages[threadId] || [];
      return {
        messages: {
          ...state.messages,
          [threadId]: [...threadMsgs, message],
        },
      };
    }),
    
  updateMessageStatus: (threadId, messageId, status) => 
    set((state) => {
      const threadMsgs = state.messages[threadId] || [];
      return {
        messages: {
          ...state.messages,
          [threadId]: threadMsgs.map((msg) =>
            msg.id === messageId ? { ...msg, status } : msg
          ),
        },
      };
    }),
    
  setTypingStatus: (threadId, isTyping) =>
    set((state) => ({
      typingStatus: {
        ...state.typingStatus,
        [threadId]: isTyping,
      },
    })),
}));
