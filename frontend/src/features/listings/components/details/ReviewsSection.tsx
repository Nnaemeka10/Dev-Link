"use client";
import { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ListingReview, ListingReviewMetric } from "../../details.types";

const PREVIEW_COUNT = 4;

function MetricBar({ metric }: { metric: ListingReviewMetric }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)_2rem] items-center gap-3 text-xs font-extrabold text-[#3A3734]">
      <span>{metric.label}</span>
      <span className="h-1 rounded-full bg-[#292826]/15">
        <span
          className="block h-full rounded-full bg-[#B9401D] transition-[width] duration-500"
          style={{ width: `${(metric.value / 5) * 100}%` }}
        />
      </span>
      <span>{metric.value.toFixed(1)}</span>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "fill-[#B9401D] text-[#B9401D]" : "text-[#D8CDBF]"}`}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: ListingReview }) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="min-w-76 rounded-4xl bg-white p-7 shadow-[0_16px_34px_rgba(36,28,18,0.06)] md:min-w-0"
    >
      <div className="flex items-center gap-4">
        {review.avatarUrl ? (
          <span className="relative h-11 w-11 overflow-hidden rounded-full">
            <Image src={review.avatarUrl} alt={review.reviewerName} fill sizes="44px" className="object-cover" />
          </span>
        ) : (
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F7D1C8] text-sm font-extrabold text-[#B9401D]">
            {review.initials}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-[#252423]">{review.reviewerName}</h3>
          <p className="text-xs font-semibold text-[#7B7E9B]">{formattedDate}</p>
        </div>
        <span className="ml-auto">
          <Stars rating={review.rating} />
        </span>
      </div>
      <p className="mt-5 text-small font-medium italic leading-6 text-[#5E6588] md:text-sm">
        &quot;{review.body}&quot;
      </p>
    </motion.article>
  );
}

export default function ReviewsSection({
  metrics,
  reviews,
  rating,
  reviewCount,
  variant = "desktop",
}: {
  metrics: ListingReviewMetric[];
  reviews: ListingReview[];
  rating: number;
  reviewCount: number;
  variant?: "desktop" | "mobile";
}) {
  const mobile = variant === "mobile";
  const [expanded, setExpanded] = useState(false);

  if (reviews.length === 0 && metrics.length === 0) return null;

  const visible = mobile || expanded ? reviews : reviews.slice(0, PREVIEW_COUNT);
  const canToggle = !mobile && reviews.length > PREVIEW_COUNT;

  return (
    <section className={mobile ? "bg-[#F4F1EA] px-5 py-10" : "border-t border-[#E8DED2] py-16"}>
      <h2 className={mobile ? "text-xl font-medium text-[#3A3734]" : "flex items-center gap-2 text-2xl font-extrabold text-[#252423]"}>
        {!mobile ? <Star className="h-5 w-5 fill-current" /> : null}
        {mobile ? "Guest Reviews" : `${rating.toFixed(1)} · ${reviewCount} review${reviewCount === 1 ? "" : "s"}`}
      </h2>

      {metrics.length > 0 && (
        <div className={mobile ? "mt-6 grid gap-4 md:grid-cols-2" : "mt-8 grid gap-x-24 gap-y-4 md:grid-cols-2"}>
          {metrics.map((metric) => (
            <MetricBar key={metric.key} metric={metric} />
          ))}
        </div>
      )}

      <div className={mobile ? "no-scrollbar mt-8 flex gap-4 overflow-x-auto" : "mt-14 grid gap-16 md:grid-cols-2"}>
        <AnimatePresence initial={false}>
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </AnimatePresence>
      </div>

      {canToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-12 rounded-full border border-[#252423] px-8 py-3 text-sm font-extrabold transition-colors hover:bg-[#252423] hover:text-white"
        >
          {expanded ? "Show less" : `Show all ${reviewCount} reviews`}
        </button>
      )}
    </section>
  );
}