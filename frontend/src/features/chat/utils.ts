import { ChatThread } from "./chat.types";

export function getConversationName(c: ChatThread | null): string {
  if (!c) return "Direct Chat";

  if (c.context_type === "support" || c.type === "support") {
    return "EventVnV Support";
  }

  const participantName = `${c.participant_first_name || ""} ${c.participant_last_name || ""}`.trim();
  if (participantName) return participantName;

  return c.listing_title || "Direct Chat";
}