// import Image from "next/image";
// import Link from "next/link";
// import { Check, Heart, MapPin, Star } from "lucide-react";
// import type { ExploreListing } from "../../explore.types";
// import VerifiedBadge from "./VerifiedBadge";

// interface ExploreCardProps {
//   listing: ExploreListing;
//   selected: boolean;
//   onToggleCompare: () => void;
// }

// export function MobileExploreCard({ listing, selected, onToggleCompare }: ExploreCardProps) {
//   const listingHref = `/listings/${listing.kind === "venue" ? "halls" : "services"}/${listing.id}`;

//   return (
//     <Link href={listingHref} className="group">
//       <article className="overflow-hidden rounded-[2rem] bg-white shadow-[0_16px_30px_rgba(50,38,23,0.08)]">
//         <div className="relative h-[20rem] overflow-hidden rounded-t-[2rem]">
//           <Image src={listing.image} alt={listing.name} fill className="object-cover" sizes="(max-width: 1024px) 90vw" />
//           {listing.verified ? (
//             <div className="absolute left-5 top-4">
//               <VerifiedBadge />
//             </div>
//           ) : null}
//           <button
//             type="button"
//             className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#5D567B]"
//             aria-label={`Save ${listing.name}`}
//             onClick={(e) => e.preventDefault()}
//           >
//             <Heart className="h-5 w-5" />
//           </button>
//         </div>

//         <div className="px-6 py-5">
//           <div className="flex items-start justify-between gap-4">
//             <div>
//               <h2 className="text-[1.35rem] font-extrabold leading-tight text-[#2A2826]">{listing.name}</h2>
//               <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[#5E6588]">
//                 <MapPin className="h-4 w-4" />
//                 {listing.location}
//               </p>
//             </div>
//             <p className="flex items-center gap-1 text-sm font-extrabold text-[#2A2826]">
//               <Star className="h-4 w-4 fill-[#E3A700] text-[#E3A700]" />
//               {listing.rating}
//             </p>
//           </div>

//           <p className="mt-3 text-xl font-extrabold text-[#B33E1F]">
//             {listing.price}
//             <span className="ml-1 text-sm font-bold text-[#5E6588]">/ {listing.unit}</span>
//           </p>

//           <div className="mt-4 flex flex-wrap gap-2">
//             {listing.badges.map((badge) => (
//               <span
//                 key={badge}
//                 className="rounded-full bg-[#EEECE7] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7A7C94]"
//               >
//                 {badge}
//               </span>
//             ))}
//           </div>

//           <div className="mt-5 flex items-center justify-between border-t border-[#ECE7DE] pt-4">
//             <button
//               type="button"
//               onClick={(e) => {
//                 e.preventDefault();
//                 onToggleCompare();
//               }}
//               className="flex items-center gap-2 text-sm font-bold text-[#6A6786]"
//             >
//               <span
//                 className={`inline-flex h-6 w-6 items-center justify-center rounded-md border ${
//                   selected ? "border-[#B9401D] bg-[#B9401D] text-white" : "border-[#CFC7BD] bg-white"
//                 }`}
//               >
//                 {selected ? <Check className="h-4 w-4" /> : null}
//               </span>
//               Compare {listing.kind}
//             </button>
//             <button
//               type="button"
//               className="text-sm font-extrabold text-[#B9401D]"
//               onClick={(e) => e.preventDefault()}
//             >
//               View Details
//             </button>
//           </div>
//         </div>
//       </article>
//     </Link>
//   );
// }

// export function DesktopExploreCard({ listing, selected, onToggleCompare }: ExploreCardProps) {
//   const listingHref = `/listings/${listing.kind === "venue" ? "halls" : "services"}/${listing.id}`;

//   return (
//     <Link href={listingHref} className="group">
//       <article className="overflow-hidden rounded-[2rem] bg-white">
//         <div className="relative h-[17.25rem] overflow-hidden">
//           <Image src={listing.image} alt={listing.name} fill className="object-cover" sizes="25vw" />
//           <button
//             type="button"
//             className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/55 text-[#262624] backdrop-blur"
//             aria-label={`Save ${listing.name}`}
//             onClick={(e) => e.preventDefault()}
//           >
//             <Heart className="h-5 w-5" />
//           </button>
//           {listing.verified ? (
//             <div className="absolute bottom-4 left-5">
//               <VerifiedBadge />
//             </div>
//           ) : null}
//         </div>

//         <div className="px-5 py-5">
//           <div className="flex items-start justify-between gap-4">
//             <h2 className="text-xl font-extrabold text-[#242322]">{listing.name}</h2>
//             <p className="flex items-center gap-1 text-sm font-extrabold text-[#242322]">
//               <Star className="h-4 w-4 fill-[#966B00] text-[#966B00]" />
//               {listing.rating}
//             </p>
//           </div>

//           <p className="mt-2 flex items-center gap-1 text-[0.95rem] font-medium text-[#555B7F]">
//             <MapPin className="h-4 w-4" />
//             {listing.location}
//           </p>

//           <div className="mt-5 flex items-end justify-between">
//             <p className="text-2xl font-extrabold text-[#A83A1C]">
//               {listing.price}
//               <span className="ml-1 text-sm font-semibold text-[#555B7F]">/ {listing.unit}</span>
//             </p>
//             <button
//               type="button"
//               onClick={(e) => {
//                 e.preventDefault();
//                 onToggleCompare();
//               }}
//               className="flex items-center gap-2 text-sm font-bold text-[#555B7F]"
//             >
//               <span
//                 className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
//                   selected ? "border-[#A83A1C] bg-[#A83A1C] text-white" : "border-[#E0B7AA] bg-white"
//                 }`}
//               >
//                 {selected ? <Check className="h-3.5 w-3.5" /> : null}
//               </span>
//               Compare
//             </button>
//           </div>
//         </div>
//       </article>
//     </Link>
//   );
// }

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, MapPin, Star } from "lucide-react";
import type { ExploreListing } from "../../explore.types";
import VerifiedBadge from "./VerifiedBadge";

// Added this formatter
function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

interface ExploreCardProps {
  listing: ExploreListing;
  selected: boolean;
  onToggleCompare: () => void;
}

// Helper for the image container to avoid repetition
function ListingImage({ src, alt, sizes }: { src: string | null; alt: string; sizes: string }) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#EFE7DE] text-sm font-semibold text-[#5E6588]">
        No Image
      </div>
    );
  }

  return (
    <Image 
      src={src} 
      alt={alt} 
      fill 
      className="object-cover" 
      sizes={sizes} 
    />
  );
}

export function MobileExploreCard({ listing, selected, onToggleCompare }: ExploreCardProps) {
  const listingHref = `/listings/${listing.kind === "venue" ? "halls" : "services"}/${listing.id}`;

  return (
    <Link href={listingHref} className="group">
      <article className="overflow-hidden rounded-[2rem] bg-white shadow-[0_16px_30px_rgba(50,38,23,0.08)]">
        <div className="relative h-[20rem] overflow-hidden rounded-t-[2rem]">
          <ListingImage src={listing.imageUrl} alt={listing.name} sizes="(max-width: 1024px) 90vw" />
          
          {listing.verified && <div className="absolute left-5 top-4"><VerifiedBadge /></div>}
          
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#5D567B]"
            aria-label={`Save ${listing.name}`}
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[1.35rem] font-extrabold leading-tight text-[#2A2826]">{listing.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[#5E6588]">
                <MapPin className="h-4 w-4" />
                {listing.location}
              </p>
            </div>
            <p className="flex items-center gap-1 text-sm font-extrabold text-[#2A2826]">
              <Star className="h-4 w-4 fill-[#E3A700] text-[#E3A700]" />
              {listing.rating.toFixed(1)}
            </p>
          </div>

          <p className="mt-3 text-xl font-extrabold text-[#B33E1F]">
            {formatNaira(listing.priceFrom)}
            <span className="ml-1 text-sm font-bold text-[#5E6588]">/ {listing.priceUnit}</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {listing.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-[#EEECE7] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7A7C94]"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[#ECE7DE] pt-4">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onToggleCompare(); }}
              className="flex items-center gap-2 text-sm font-bold text-[#6A6786]"
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-md border ${
                  selected ? "border-[#B9401D] bg-[#B9401D] text-white" : "border-[#CFC7BD] bg-white"
                }`}
              >
                {selected ? <Check className="h-4 w-4" /> : null}
              </span>
              Compare {listing.kind}
            </button>
            <button type="button" className="text-sm font-extrabold text-[#B9401D]" onClick={(e) => e.preventDefault()}>
              View Details
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function DesktopExploreCard({ listing, selected, onToggleCompare }: ExploreCardProps) {
  const listingHref = `/listings/${listing.kind === "venue" ? "halls" : "services"}/${listing.id}`;

  return (
    <Link href={listingHref} className="group">
      <article className="overflow-hidden rounded-[2rem] bg-white">
        <div className="relative h-[17.25rem] overflow-hidden">
          <ListingImage src={listing.imageUrl} alt={listing.name} sizes="25vw" />
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/55 text-[#262624] backdrop-blur"
            aria-label={`Save ${listing.name}`}
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="h-5 w-5" />
          </button>
          {listing.verified && <div className="absolute bottom-4 left-5"><VerifiedBadge /></div>}
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-extrabold text-[#242322]">{listing.name}</h2>
            <p className="flex items-center gap-1 text-sm font-extrabold text-[#242322]">
              <Star className="h-4 w-4 fill-[#966B00] text-[#966B00]" />
              {listing.rating.toFixed(1)}
            </p>
          </div>

          <p className="mt-2 flex items-center gap-1 text-[0.95rem] font-medium text-[#555B7F]">
            <MapPin className="h-4 w-4" />
            {listing.location}
          </p>

          <div className="mt-5 flex items-end justify-between">
            <p className="text-2xl font-extrabold text-[#A83A1C]">
              {formatNaira(listing.priceFrom)}
              <span className="ml-1 text-sm font-semibold text-[#555B7F]">/ {listing.priceUnit}</span>
            </p>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onToggleCompare(); }}
              className="flex items-center gap-2 text-sm font-bold text-[#555B7F]"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                  selected ? "border-[#A83A1C] bg-[#A83A1C] text-white" : "border-[#E0B7AA] bg-white"
                }`}
              >
                {selected ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              Compare
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}