import Image from "next/image";
import { Heart, Star } from "lucide-react";
import type { SimilarVenue } from "../../details.types";

export default function SimilarVenues({ venues, variant = "desktop" }: { venues: SimilarVenue[]; variant?: "desktop" | "mobile" }) {
  const mobile = variant === "mobile";

  return (
    <section className={mobile ? "px-5 py-10" : "py-16"}>
      <div className="mb-8 flex items-center justify-between">
        <h2 className={mobile ? "text-xl font-extrabold text-[#252423]" : "text-2xl font-medium text-[#3A3734]"}>
          Similar Premium Venues
        </h2>
        {mobile ? <button className="text-sm font-extrabold text-[#B9401D]">See All</button> : null}
      </div>

      <div className={mobile ? "no-scrollbar flex gap-5 overflow-x-auto" : "grid grid-cols-3 gap-8"}>
        {venues.map((venue) => (
          <article key={venue.id} className={mobile ? "min-w-[17rem]" : ""}>
            <div className="relative h-[22rem] overflow-hidden rounded-[1.8rem] md:h-[18rem]">
              <Image src={venue.image} alt={venue.name} fill className="object-cover" sizes="(max-width: 768px) 75vw, 28vw" />
              <button
                type="button"
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#6B6E91]"
                aria-label={`Save ${venue.name}`}
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-[#252423]">{venue.name}</h3>
                <p className="text-sm font-semibold text-[#5E6588]">{venue.location}</p>
              </div>
              <p className="flex items-center gap-1 text-xs font-extrabold text-[#252423]">
                <Star className="h-3.5 w-3.5 fill-current" />
                {venue.rating}
              </p>
            </div>
            <p className="mt-2 text-lg font-extrabold text-[#252423]">
              {venue.price}
              <span className="text-xs font-bold text-[#5E6588]"> / event</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
