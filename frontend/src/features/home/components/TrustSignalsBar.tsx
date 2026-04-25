"use client";

import { BadgeCheck, LockKeyhole, ThumbsUp } from "lucide-react";

interface TrustSignal {
  id: string;
  label: string;
  icon: "verified" | "escrow" | "trusted";
}

interface TrustResponse {
  data: TrustSignal[];
}

const TRUST_RESPONSE: TrustResponse = {
  data: [
    { id: "verified", label: "Verified luxury vendors", icon: "verified" },
    { id: "escrow", label: "Secure escrow payments", icon: "escrow" },
    { id: "trusted", label: "Trusted by 10k+ hosts", icon: "trusted" },
  ],
};

function trustIcon(type: TrustSignal["icon"]) {
  if (type === "verified") return BadgeCheck;
  if (type === "escrow") return LockKeyhole;
  return ThumbsUp;
}

export default function TrustSignalsBar() {
  return (
    <section className="bg-bg-tertiary px-4 py-8 md:px-8 md:py-10">
      <div
        className="no-scrollbar mx-auto flex max-w-7xl gap-0 overflow-x-auto rounded-[1.6rem] bg-[#C8562D] text-white motion-safe:animate-[var(--animate-fade-up)] md:flex-row md:overflow-hidden md:bg-transparent md:text-black"
      >
        {TRUST_RESPONSE.data.map((signal, index) => {
          const Icon = trustIcon(signal.icon);
          return (
            <div
              key={signal.id}
              className={`flex min-w-max flex-1 items-center justify-center gap-2 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] md:min-w-0 md:text-xs ${
                index !== TRUST_RESPONSE.data.length - 1
                  ? "border-r border-white/15 md:border-b-0"
                  : ""
              }`}
            >
              <Icon className="h-4 w-4 text-white md:text-accent-primary" />
              {signal.label}
            </div>
          );
        })}
      </div>
    </section>
  );
}
