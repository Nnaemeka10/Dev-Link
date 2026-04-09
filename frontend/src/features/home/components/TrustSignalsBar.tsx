"use client";

import { motion } from "framer-motion";
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
    <section className="px-4 py-8 md:px-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex max-w-7xl flex-col overflow-hidden rounded-2xl bg-accent-primary text-white md:flex-row"
      >
        {TRUST_RESPONSE.data.map((signal, index) => {
          const Icon = trustIcon(signal.icon);
          return (
            <div
              key={signal.id}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] md:text-xs ${
                index !== TRUST_RESPONSE.data.length - 1
                  ? "border-b border-white/20 md:border-b-0 md:border-r"
                  : ""
              }`}
            >
              <Icon className="h-4 w-4" />
              {signal.label}
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
