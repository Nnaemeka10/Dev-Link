import { LifeBuoy, Mail } from "lucide-react";

export default function ContactSupportCta() {
  return (
    <section className="rounded-card border border-[#F1E5D5] bg-white p-6 shadow-card md:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-tint text-accent-primary">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <h2 className="font-headline text-lg font-bold text-text-primary">
          Still need help?
        </h2>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-6 text-text-primary/70">
        Can&apos;t find what you&apos;re looking for? Our support team replies
        within one business day. Include your booking reference (it starts with
        EVV-) if your question is about a specific booking.
      </p>
      <a
        href="mailto:support@eventvnv.ng"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(214,92,58,0.3)] transition-transform hover:-translate-y-0.5"
      >
        <Mail className="h-4 w-4" />
        Email support@eventvnv.ng
      </a>
    </section>
  );
}