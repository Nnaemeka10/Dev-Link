import { createPortal } from "react-dom";
import { ArrowLeft, Check, Copy, Heart, Share2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRemoveSavedListing, useSavedListings, useSaveListing } from "../../hooks/useSavedListings";
import { useEffect, useState } from "react";

interface ApiError {
  status?: number;
  message?: string;
}

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
    <header className="mx-auto flex h-16 max-w-360 items-center gap-8 px-8">
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

function SharePopover({ onClose }: { onClose: () => void }) {
  const [isCopied, setIsCopied] = useState(false);
  const [shareUrl] = useState(() => window.location.href);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return createPortal(
    // Invisible backdrop covering the whole screen to catch outside clicks
    <div className="fixed inset-0 z-9999 bg-black/50" onClick={onClose}>
      {/* Popover content */}
      <div 
        className="absolute right-[30%] top-[50%] w-[25rem] origin-top-right rounded-2xl border border-[#E8DDD2] bg-white p-5 shadow-[0_24px_54px_rgba(34,27,18,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-extrabold text-[#252423]">Share listing</h4>
          <button onClick={onClose} className="text-[#7B7E9B] hover:text-[#252423] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-[#5E6588] mb-4">Share this listings with your friends and followers!</p>
        
        <div className="flex items-center gap-2 rounded-xl border border-[#E8DDD2] bg-[#F9F7F5] p-2">
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            className="w-full bg-transparent text-xs font-medium text-[#252423] outline-none truncate px-1"
          />
          <button 
            onClick={handleCopy}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-white transition-all ${
              isCopied ? "bg-green-600" : "bg-[#B9401D] hover:brightness-95"
            }`}
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>, document.body
  );
}


export function DetailsActions() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { data: savedListings, isError: isUnauthenticated } = useSavedListings();
  const saveMutation = useSaveListing();
  const removeMutation = useRemoveSavedListing();

  // Check if the current listing is in the user's saved list
  const isSaved = savedListings?.some((l) => l.id === listingId) ?? false;

  const handleSaveClick = () => {
    // If the hook threw a 401 error, the user is not logged in
    if (isUnauthenticated) {
      router.push("/login");
      return;
    }

    // If logged in, call the appropriate mutation
    if (isSaved) {
      removeMutation.mutate(listingId, {
        onError: (error: ApiError) => {
          // If their session expired mid-browsing, send them to login
          if (error?.status === 401) router.push("/login");
        }
      });
    } else {
      saveMutation.mutate(listingId, {
        onError: (error: ApiError) => {
          if (error?.status === 401) router.push("/login");
        }
      });
    }
  };

  const isMutating = saveMutation.isPending || removeMutation.isPending;

  return (
    <div className="flex items-center gap-2 lg:gap-8 text-sm font-extrabold md:text-[#252423] text-[#B9401D]">
       <div className="relative">
        <button 
          type="button" 
          className="inline-flex items-center gap-2 underline"
          onClick={() => setIsShareOpen(!isShareOpen)}
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>

        {isShareOpen && (
          <SharePopover onClose={() => setIsShareOpen(false)} />
        )}
      </div>
      <button 
        type="button" 
        onClick={handleSaveClick} 
        disabled={isMutating}
        className="inline-flex items-center gap-2 underline disabled:opacity-50 transition-all"
      >
        <Heart 
          className={`h-4 w-4 transition-colors ${isSaved ? "fill-red-500 text-red-500" : "text-[#B9401D] md:text-[#252423]"}`} 
        />
        {isSaved ? "Unsave" : "Save"}
      </button>
    </div>
  );
}
