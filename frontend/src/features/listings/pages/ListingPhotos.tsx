"use client";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useListingDetails } from "../hooks/useListingDetails";
import PhotoLightbox from "../components/details/PhotoLightbox";

export default function ListingPhotos() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: listing, isLoading, isError } = useListingDetails(id);

  const images = listing?.images ?? [];
  const photoParam = Number(searchParams.get("photo"));
  const activeIndex =
    Number.isInteger(photoParam) && photoParam >= 1 && photoParam <= images.length
      ? photoParam - 1
      : null;

  // push on open - browser Back closes the lightbox; replace on navigate - no history spam
  const open = (i: number) => router.push(`${pathname}?photo=${i + 1}`, { scroll: false });
  const navigate = (i: number) => router.replace(`${pathname}?photo=${i + 1}`, { scroll: false });
  const close = () => router.replace(pathname, { scroll: false });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-bg-primary text-lg font-bold text-[#5E6588]">Loading photos…</div>;
  }
  if (isError || !listing) {
    return <div className="flex min-h-screen items-center justify-center bg-bg-primary text-lg font-bold text-[#B9401D]">Couldn&apos;t load photos.</div>;
  }

  const photos = images.map((img, i) => ({
    url: img.url, // original quality for the lightbox
    alt: `${listing.title} - photo ${i + 1}`,
  }));

  return (
    <main className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-black/5 bg-bg-primary/90 px-4 py-4 backdrop-blur md:px-8">
        <button type="button" onClick={() => router.back()} aria-label="Back to listing"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-extrabold text-[#252423] md:text-lg">{listing.title}</h1>
          <p className="text-xs font-semibold text-[#5E6588]">{photos.length} photos</p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="grid auto-rows-[150px] grid-cols-2 gap-2 sm:auto-rows-[200px] sm:grid-cols-3 md:gap-3">
          {images.map((img, i) => (
            <button
              key={img.id} type="button" onClick={() => open(i)}
              aria-label={`Open photo ${i + 1} of ${photos.length}`}
              className={`group relative overflow-hidden rounded-2xl bg-[#EFE7DE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B9401D] ${
                i === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <Image
                src={i === 0 ? img.url : (img.thumbnailUrl ?? img.url)}
                alt={photos[i].alt} fill
                sizes={i === 0 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeIndex !== null && (
          <PhotoLightbox photos={photos} index={activeIndex} onClose={close} onNavigate={navigate} />
        )}
      </AnimatePresence>
    </main>
  );
}