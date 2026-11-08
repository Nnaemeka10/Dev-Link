"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, LifeBuoy, Mail } from "lucide-react";
import type { LegalBlock, LegalDocument } from "../content/legalTypes";

// Block renderer

function LegalBlocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <div className="mt-4 space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "h3") {
          return (
            <h3
              key={index}
              className="pt-2 font-headline text-base font-bold text-text-primary"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              className={`space-y-2 pl-5 text-[15px] leading-7 text-text-primary/80 ${
                block.ordered
                  ? "list-decimal marker:font-semibold marker:text-accent-primary"
                  : "list-disc marker:text-accent-primary"
              }`}
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={index} className="text-[15px] leading-7 text-text-primary/80">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

//  Shell 


interface LegalShellProps {
  doc: LegalDocument;
}

export default function LegalShell({ doc }: LegalShellProps) {
  const [activeId, setActiveId] = useState<string>(doc.sections[0]?.id ?? "");

  // Scroll-spy: highlight the TOC entry for the section in view.
  useEffect(() => {
    const headings = doc.sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 1] }
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [doc.sections]);

  const handleTocClick =
    (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setActiveId(id);
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    };

  return (
    <article
      className="bg-bg-primary motion-safe:animate-fade-in"
      aria-label={doc.title}
    >
      {/*  Hero band  */}
      <header className="bg-linear-to-b from-bg-tertiary to-bg-primary px-4 pb-10 pt-6 md:px-8 md:pt-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-text-primary/60 transition-colors hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to home
          </Link>

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
            {doc.eyebrow}
          </p>
          <h1 className="mt-3 font-headline text-3xl font-bold tracking-[-0.02em] text-text-primary md:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-text-primary/70">
            {doc.intro}
          </p>
          <p className="mt-6 text-sm font-medium text-text-primary/50">
            Last updated: {doc.lastUpdated}
          </p>
        </div>
      </header>

      {/*  Body: sticky TOC + content column  */}
      <div className="px-4 pb-20 pt-4 md:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          {/* Desktop TOC */}
          <nav
            aria-label="On this page"
            className="hidden self-start lg:sticky lg:top-24 lg:block"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
              On this page
            </p>
            <ul className="mt-4 space-y-1 border-l border-border-light">
              {doc.sections.map((section, index) => {
                const isActive = activeId === section.id;
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      onClick={handleTocClick(section.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={`-ml-px flex gap-2 border-l-2 py-1.5 pl-3 pr-2 text-[13px] leading-5 transition-colors ${
                        isActive
                          ? "border-accent-primary font-semibold text-text-primary"
                          : "border-transparent text-text-primary/60 hover:text-text-primary"
                      }`}
                    >
                      <span className="tabular-nums text-text-primary/40">
                        {index + 1}.
                      </span>
                      {section.heading}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile TOC (collapsible) */}
          <details className="group rounded-card border border-[#F1E5D5] bg-white shadow-card lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
              On this page
              <ChevronDown className="h-4 w-4 text-text-primary/50 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="space-y-1 border-t border-[#F1E5D5] px-5 py-4">
              {doc.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={handleTocClick(section.id)}
                    className="flex gap-2 rounded-lg px-2 py-1.5 text-sm text-text-primary/75 hover:bg-bg-tertiary"
                  >
                    <span className="tabular-nums text-text-primary/40">
                      {index + 1}.
                    </span>
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </details>

          {/* Content */}
          <div className="max-w-3xl">
            {doc.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 border-t border-border-light py-10 first:border-t-0 first:pt-6"
              >
                <h2 className="flex items-baseline gap-3 font-headline text-xl font-bold tracking-tight text-text-primary md:text-2xl">
                  <span className="text-sm font-bold tabular-nums text-accent-primary md:text-base">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.heading}
                </h2>
                <LegalBlocks blocks={section.blocks} />
              </section>
            ))}

            {/*  Still need help  */}
            <div className="mt-12 rounded-card border border-[#F1E5D5] bg-white p-6 shadow-card md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-tint text-accent-primary">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <h2 className="font-headline text-lg font-bold text-text-primary">
                  Still have questions?
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-text-primary/70">
                Our support team is happy to walk you through anything in this
                document - or search the Help Center for quick answers.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(214,92,58,0.3)] transition-transform hover:-translate-y-0.5"
                >
                  <LifeBuoy className="h-4 w-4" />
                  Visit Help Center
                </Link>
                <a
                  href="mailto:support@eventvnv.ng"
                  className="inline-flex items-center gap-2 rounded-full border border-text-primary/20 bg-white px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-secondary"
                >
                  <Mail className="h-4 w-4" />
                  Contact support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}