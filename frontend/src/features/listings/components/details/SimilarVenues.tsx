import Image from "next/image";
import { Heart, Star } from "lucide-react";
import type { ListingCardSmall } from "../../details.types";

export default function SimilarVenues({ venues, variant = "desktop" }: { venues: ListingCardSmall[]; variant?: "desktop" | "mobile" }) {
  const mobile = variant === "mobile";

  if (venues.length === 0) return null;

  return (
    <section className={mobile ? "px-5 py-10" : "py-16"}>
      <div className="mb-8 flex items-center justify-between">
        <h2 className={mobile ? "md:text-xl text-heading-m font-extrabold text-[#252423]" : "text-2xl font-extrabold text-[#3A3734]"}>
          Similar Premium Venues
        </h2>
        {mobile ? <button className="md:text-sm text-small font-extrabold text-[#B9401D]">See All</button> : null}
      </div>

      <div className={mobile ? "no-scrollbar flex gap-5 overflow-x-auto" : "grid grid-cols-3 gap-8"}>
        {venues.map((venue) => (
          <article key={venue.id} className={mobile ? "min-w-68" : ""}>
            <div className="relative h-88 overflow-hidden rounded-[1.8rem] md:h-72 bg-gray-100">
              {venue.primaryImage ? (
                <Image 
                  src={venue.primaryImage.url} 
                  alt={venue.title} 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 768px) 75vw, 28vw" 
                />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
              <button
                type="button"
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#6B6E91]"
                aria-label={`Save ${venue.title}`}
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4 px-2">
              <div>
                <h3 className="text-base font-extrabold text-[#252423]">{venue.title}</h3>
                <p className="md:text-sm text-tiny font-semibold text-[#5E6588]">{venue.location}</p>
              </div>
              <p className="flex items-center gap-1 md:text-xs text-tiny font-extrabold text-[#252423]">
                <Star className="md:h-3.5 md:w-3.5 h-2.5 w-2.5 fill-current" />
                {venue.rating.toFixed(1)}
              </p>
            </div>
            <p className="mt-2 px-2 text-base md:text-lg font-extrabold text-[#252423]">
              ₦{venue.priceFrom.toLocaleString()}
              <span className="text-xs font-bold text-[#5E6588]"> /day</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}