import { ArrowLeft, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export function MobileDetailsHeader() {
  const router = useRouter();
  const params  = useParams();
  const id = params.id as string;

  function formatSlug(slug: string): string {
    return slug
      .replace(/-/g, ' ') // Replace all hyphens with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
  }

  const listing = formatSlug(id);
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-bg-primary px-5">
      <div className=" flex gap-2">
        <button type="button" aria-label="Go back" className="text-[#B9401D]" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <h1 className="text-base font-extrabold text-[#252423]">{listing}</h1>
      </div>
      <DetailsActions />
    </header>
  );
}

export function TabletDetailsHeader() {
  return (
    <header className="flex h-16 items-center justify-between bg-bg-primary px-8">
      <h1 className="text-xl font-extrabold text-[#252423]">Eventvnv</h1>
      <nav className="flex items-center gap-9 text-sm font-extrabold text-[#5E6588]">
        <button type="button">Venues</button>
        <button type="button">Vendors</button>
        <button type="button">Inspiration</button>
        <button type="button">About</button>
      </nav>
      <button type="button" className="rounded-full border border-[#DDB6AA] px-6 py-2 text-sm font-extrabold text-[#B9401D]">
        Sign In
      </button>
    </header>
  );
}

export function DesktopDetailsHeader() {
  return (
    <header className="mx-auto flex h-16 max-w-[90rem] items-center gap-8 px-8">
      <Link href="/" className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1">
          <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
          <p className="font-semibold logo translate-y-1.5">EventVnV </p>
      </Link>
      
      <div className="ml-auto flex items-center gap-4">
        <button type="button" className="rounded-full border border-[#DDB6AA] px-6 py-2 text-sm font-extrabold text-[#252423]">
          Sign In
        </button>
        <button type="button" className="rounded-full bg-[#B9401D] px-6 py-2 text-sm font-extrabold text-white">
          List Your Space
        </button>
      </div>
    </header>
  );
}

export function DetailsActions() {
  return (
    <div className="flex items-center gap-2 lg:gap-8 text-sm font-extrabold  md:text-[#252423] text-[#B9401D]">
      <button type="button" className="inline-flex items-center gap-2 underline">
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <button type="button" className="inline-flex items-center gap-2 underline">
        <Heart className="h-4 w-4" />
        Save
      </button>
    </div>
  );
}
