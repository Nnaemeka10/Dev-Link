import MessagesPage from "@/features/chat/pages/ChatInbox";

import { Suspense } from "react";




export default function Chat() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-primary" />}>
      <MessagesPage />
    </Suspense>
  );
}
