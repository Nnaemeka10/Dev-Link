import { Star } from "lucide-react";
import type { ListingReview, ListingReviewMetric } from "../../details.types";

function MetricBar({ metric }: { metric: ListingReviewMetric }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)_2rem] items-center gap-3 text-xs font-extrabold text-[#3A3734]">
      <span>{metric.label}</span>
      <span className="h-1 rounded-full bg-[#292826]">
        <span className="block h-full rounded-full bg-[#B9401D]" style={{ width: `${(Number(metric.value) / 5) * 100}%` }} />
      </span>
      <span>{metric.value}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: ListingReview }) {
  return (
    <article className="min-w-[19rem] rounded-[2rem] bg-white p-7 shadow-[0_16px_34px_rgba(36,28,18,0.06)] md:min-w-0">
      <div className="flex items-center gap-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F7D1C8] text-sm font-extrabold text-[#B9401D]">
          {review.initials}
        </span>
        <div>
          <h3 className="text-sm font-extrabold text-[#252423]">{review.name}</h3>
          <p className="text-xs font-semibold text-[#7B7E9B]">{review.date}</p>
        </div>
      </div>
      <p className="mt-5 text-sm font-medium italic leading-6 text-[#5E6588]">&quot;{review.body}&quot;</p>
    </article>
  );
}

export default function ReviewsSection({
  metrics,
  reviews,
  variant = "desktop",
}: {
  metrics: ListingReviewMetric[];
  reviews: ListingReview[];
  variant?: "desktop" | "mobile";
}) {
  const mobile = variant === "mobile";

  return (
    <section className={mobile ? "bg-[#F4F1EA] px-5 py-10" : "border-t border-[#E8DED2] py-16"}>
      <h2 className={mobile ? "text-xl font-medium text-[#3A3734]" : "flex items-center gap-2 text-2xl font-extrabold text-[#252423]"}>
        {!mobile ? <Star className="h-5 w-5 fill-current" /> : null}
        {mobile ? "Guest Reviews" : "4.9 · 128 reviews"}
      </h2>

      <div className={mobile ? "mt-6 grid gap-4 md:grid-cols-2" : "mt-8 grid gap-x-24 gap-y-4 md:grid-cols-2"}>
        {metrics.slice(0, mobile ? 2 : metrics.length).map((metric) => (
          <MetricBar key={metric.label} metric={metric} />
        ))}
      </div>

      <div className={mobile ? "no-scrollbar mt-8 flex gap-4 overflow-x-auto" : "mt-14 grid gap-16 md:grid-cols-2"}>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {!mobile ? (
        <button type="button" className="mt-12 rounded-full border border-[#252423] px-8 py-3 text-sm font-extrabold">
          Show all 128 reviews
        </button>
      ) : null}
    </section>
  );
}
