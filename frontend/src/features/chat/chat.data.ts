import { ChatMessage, ChatParticipant, ChatThread } from "./chat.types";

export const MOCK_PARTICIPANTS: Record<string, ChatParticipant> = {
  "user_1": {
    id: "user_1",
    name: "Alex Johnson",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    isOnline: true,
  },
  "user_2": {
    id: "user_2",
    name: "Sarah Williams",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    isOnline: false,
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
};

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "thread_1": [
    {
      id: "msg_1",
      threadId: "thread_1",
      senderId: "user_2",
      content: "Hi there! I'm interested in booking your venue for my upcoming event.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      status: "read",
    },
    {
      id: "msg_2",
      threadId: "thread_1",
      senderId: "user_1",
      content: "Hello Sarah! Thanks for reaching out. What dates were you thinking of?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      status: "read",
    },
    {
      id: "msg_3",
      threadId: "thread_1",
      senderId: "user_2",
      content: "We're looking at the 15th of next month. Is it available?",
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
      status: "delivered",
    },
  ],
};

export const MOCK_THREADS: ChatThread[] = [
  {
    id: "thread_1",
    participantIds: ["user_1", "user_2"],
    lastMessage: MOCK_MESSAGES["thread_1"][MOCK_MESSAGES["thread_1"].length - 1],
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isTyping: true,
  },
];
