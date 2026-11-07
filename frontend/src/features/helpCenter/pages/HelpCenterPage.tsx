"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  Compass,
  CreditCard,
  HeartHandshake,
  RotateCcw,
  ShieldCheck,
  Store,
} from "lucide-react";
import HomeFooter from "@/components/layout/Footer";
import ContactSupportCta from "../components/ContactSupportCta";
import HelpArticleAccordion from "../components/HelpArticleAccordion";
import HelpSearchBar from "../components/HelpSearchBar";
import {
  HELP_CATEGORIES,
  POPULAR_ARTICLES,
  type FlatHelpArticle,
} from "../data/helpContent";

// Category icon map (data files stay icon-free for server safety) 

const CATEGORY_ICONS = {
  compass: Compass,
  card: CreditCard,
  store: Store,
  shield: ShieldCheck,
  refund: RotateCcw,
  heart: HeartHandshake,
} as const;

const POPULAR_SEARCHES = ["booking", "escrow", "payment", "refund", "payout"];

// Page 

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(
    POPULAR_ARTICLES[0]?.slug ?? null
  );

  const results = useMemo<FlatHelpArticle[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    return HELP_CATEGORIES.flatMap((category) =>
      category.articles
        .filter(
          (article) =>
            article.question.toLowerCase().includes(q) ||
            article.answer.some((paragraph) =>
              paragraph.toLowerCase().includes(q)
            ) ||
            category.title.toLowerCase().includes(q)
        )
        .map((article) => ({
          ...article,
          categorySlug: category.slug,
          categoryTitle: category.title,
        }))
    );
  }, [query]);

  const isSearching = query.trim().length > 0;

  return (
    <main className="bg-bg-primary motion-safe:animate-fade-in">
      {/*  Hero + search */}
      <section className="bg-linear-to-b from-bg-tertiary to-bg-primary px-4 pb-10 pt-6 md:px-8 md:pt-10 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-text-primary/60 transition-colors hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to home
          </Link>

          <p className="mt-8 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
            Support
          </p>
          <h1 className="mt-3 text-center font-headline text-3xl font-bold tracking-[-0.02em] text-text-primary md:text-4xl">
            How can we help?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-[15px] leading-7 text-text-primary/70">
            Answers to common questions about bookings, payments, escrow,
            listings and more.
          </p>

          <div className="mt-8">
            <HelpSearchBar value={query} onChange={setQuery} />
          </div>

          {!isSearching && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-text-primary/50">
                Popular:
              </span>
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-[#F1E5D5] bg-white px-4 py-1.5 text-xs font-semibold text-text-primary/75 shadow-card transition-colors hover:border-accent-primary/40 hover:text-accent-primary"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/*  Search results */}
      {isSearching && (
        <section className="px-4 pb-20 pt-6 md:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-text-primary/60">
              {results.length} result{results.length === 1 ? "" : "s"} for{" "}
              <span className="font-semibold text-text-primary">
                &ldquo;{query.trim()}&rdquo;
              </span>
            </p>

            {results.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {results.map((article) => (
                  <li key={`${article.categorySlug}-${article.slug}`}>
                    <Link
                      href={`/help/${article.categorySlug}#${article.slug}`}
                      className="group flex items-center justify-between gap-4 rounded-card border border-[#F1E5D5] bg-white px-5 py-4 shadow-card transition-shadow hover:shadow-card-hover"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-headline text-[15px] font-bold text-text-primary group-hover:text-accent-primary">
                          {article.question}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-text-primary/45">
                          {article.categoryTitle}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-text-primary/30 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-card border border-[#F1E5D5] bg-white p-6 text-center shadow-card">
                <p className="text-sm font-semibold text-text-primary">
                  No articles matched your search.
                </p>
                <p className="mt-2 text-sm text-text-primary/60">
                  Try a different word, or contact support directly below.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-4 rounded-full border border-text-primary/20 bg-white px-5 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-secondary"
                >
                  Clear search
                </button>
              </div>
            )}

            <div className="mt-10">
              <ContactSupportCta />
            </div>
          </div>
        </section>
      )}

      {/* Categories + popular articles */}
      {!isSearching && (
        <>
          <section className="px-4 pb-16 pt-4 md:px-8 lg:px-12">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
                Browse by topic
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {HELP_CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICONS[category.icon];
                  return (
                    <Link
                      key={category.slug}
                      href={`/help/${category.slug}`}
                      className="group rounded-card border border-[#F1E5D5] bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-tint text-accent-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <ArrowRight className="h-4 w-4 text-text-primary/25 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-primary" />
                      </div>
                      <h3 className="mt-5 font-headline text-base font-bold text-text-primary">
                        {category.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-text-primary/65">
                        {category.description}
                      </p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/40">
                        {category.articles.length} article
                        {category.articles.length === 1 ? "" : "s"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-bg-tertiary px-4 py-16 md:px-8 lg:px-12">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
                Popular articles
              </h2>
              <div className="mt-5 overflow-hidden rounded-card border border-[#F1E5D5] bg-white shadow-card">
                {POPULAR_ARTICLES.map((article) => (
                  <HelpArticleAccordion
                    key={article.slug}
                    article={article}
                    open={openSlug === article.slug}
                    onToggle={() =>
                      setOpenSlug((current) =>
                        current === article.slug ? null : article.slug
                      )
                    }
                  />
                ))}
              </div>

              <div className="mt-10">
                <ContactSupportCta />
              </div>
            </div>
          </section>
        </>
      )}

      <HomeFooter />
    </main>
  );
}