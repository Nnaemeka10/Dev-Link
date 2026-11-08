"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import HomeFooter from "@/components/layout/Footer";
import ContactSupportCta from "../components/ContactSupportCta";
import HelpArticleAccordion from "../components/HelpArticleAccordion";
import { HELP_CATEGORIES, type HelpCategory } from "../data/helpContent";

interface HelpCategoryPageProps {
  category: HelpCategory;
}

// The URL hash as an external store 
// Module-level so the function identities are stable and
// useSyncExternalStore doesn't resubscribe on every render.

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const getHashSnapshot = () => window.location.hash;

// Server has no location.hash , "" keeps the hydration render identical
// to the server HTML, then React re-renders with the real value.
const getServerHashSnapshot = () => "";

export default function HelpCategoryPage({ category }: HelpCategoryPageProps) {
  // undefined = the user hasn't toggled anything yet → the deep link decides.
  // null = the user explicitly closed the accordion.
  // Once the user interacts, their choice wins over the deep link.
  const [userSlug, setUserSlug] = useState<string | null | undefined>(
    undefined
  );

  const hash = useSyncExternalStore(
    subscribeToHash,
    getHashSnapshot,
    getServerHashSnapshot
  );
  const hashSlug = hash.replace("#", "");
  const deepLinkedSlug = category.articles.some(
    (article) => article.slug === hashSlug
  )
    ? hashSlug
    : null;

  // Derived , never stored: user intent > deep link > first article.
  const openSlug =
    userSlug !== undefined
      ? userSlug
      : deepLinkedSlug ?? category.articles[0]?.slug ?? null;

  // The only effect left is a pure external-system sync (scrolling the DOM).
  // The deep-linked accordion is already open in the committed DOM when this
  // runs, so the scroll target has real height. No setState → rule satisfied.
  useEffect(() => {
    if (!deepLinkedSlug) return;
    const timer = setTimeout(() => {
      document
        .getElementById(deepLinkedSlug)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => clearTimeout(timer);
  }, [deepLinkedSlug]);

  const otherCategories = HELP_CATEGORIES.filter(
    (item) => item.slug !== category.slug
  );

  return (
    <main className="bg-bg-primary motion-safe:animate-fade-in">
      {/*  Header */}
      <section className="bg-linear-to-b from-bg-tertiary to-bg-primary px-4 pb-10 pt-6 md:px-8 md:pt-10 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/help"
            className="inline-flex items-center gap-1 text-sm font-medium text-text-primary/60 transition-colors hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Help Center
          </Link>

          <h1 className="mt-8 font-headline text-3xl font-bold tracking-[-0.02em] text-text-primary md:text-4xl">
            {category.title}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-text-primary/70">
            {category.description}
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="px-4 pb-16 pt-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-card border border-[#F1E5D5] bg-white shadow-card">
            {category.articles.map((article) => (
              <HelpArticleAccordion
                key={article.slug}
                article={article}
                open={openSlug === article.slug}
                onToggle={() =>
                  setUserSlug(openSlug === article.slug ? null : article.slug)
                }
              />
            ))}
          </div>

          {/* Other topics  */}
          <div className="mt-12">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
              Browse other topics
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {otherCategories.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/help/${item.slug}`}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-[#F1E5D5] bg-white px-4 py-2 text-sm font-medium text-text-primary/80 shadow-card transition-colors hover:border-accent-primary/40 hover:text-accent-primary"
                  >
                    {item.title}
                    <ArrowRight className="h-3.5 w-3.5 text-text-primary/30 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <ContactSupportCta />
          </div>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}