"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { queryClient } from "@/lib/queryClient";
import ProfileCompletionNudge from "@/features/profile/components/ProfileCompletionNudge";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Global, self-gating: shows at most once per session, snoozes 7 days,
          never on auth/profile/checkout surfaces. */}
      <ProfileCompletionNudge />
    </QueryClientProvider>
  );
}