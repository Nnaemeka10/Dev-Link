"use client";

import { ChevronDown } from "lucide-react";
import type { HelpArticle } from "../data/helpContent";

interface HelpArticleAccordionProps {
  article: HelpArticle;
  open: boolean;
  onToggle: () => void;
}

export default function HelpArticleAccordion({
  article,
  open,
  onToggle,
}: HelpArticleAccordionProps) {
  return (
    <div
      id={article.slug}
      className="scroll-mt-28 border-b border-[#F1E5D5] last:border-b-0"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${article.slug}-panel`}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-bg-tertiary/60 md:px-7"
      >
        <span
          className={`font-headline text-[15px] font-bold leading-6 transition-colors md:text-base ${
            open ? "text-accent-primary" : "text-text-primary"
          }`}
        >
          {article.question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-text-primary/40 transition-transform duration-300 ${
            open ? "rotate-180 text-accent-primary" : ""
          }`}
        />
      </button>

      <div
        id={`${article.slug}-panel`}
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-5 pb-6 md:px-7">
            {article.answer.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-7 text-text-primary/75"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}