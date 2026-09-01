"use client";


import Image from "next/image";
import VendorSideNavBar from "../../../components/layout/VendorSideNavBar";
import VendorMobileDock from "../../../components/layout/VendorMobileDock";
import { Plus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyListingsStats, useVendorListings } from "../hooks/useVendorDashboard";
import type { VendorListing } from "../types";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);
}

function StatusBadge({ status }: { status: VendorListing["status"] }) {
  switch (status) {
    case "active":
      return <span className="bg-white/90 backdrop-blur-sm text-text-green px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-badge-pop stagger-6">Active</span>;
    case "in_review":
      return <span className="bg-amber-400/95 backdrop-blur-sm text-amber-950 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-badge-pop stagger-6">In Review</span>;
    case "rejected":
      return <span className="bg-red-500/95 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-badge-pop stagger-6">Needs Changes</span>;
    case "draft":
      return <span className="bg-surface-dim/90 backdrop-blur-sm text-text-on-muted px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-badge-pop stagger-6">Draft</span>;
    default:
      return <span className="bg-surface-dim/90 backdrop-blur-sm text-text-on-muted px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-badge-pop stagger-6">Offline</span>;
  }
}

function MyListingsContent() {
  const router = useRouter();
  const { data: stats } = useMyListingsStats();
  const { data: listings } = useVendorListings();
  
  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 animate-fade-slide-up">
        <div>
          <h1 className="text-4xl font-black font-headline text-text-primary tracking-tight">
            My Listings
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Manage your event spaces and services
          </p>
        </div>

        <button
          onClick={() => router.push("/vendor/create-listing")} 
          className="flex items-center justify-center gap-2 bg-accent-primary text-white px-6 py-3.5 rounded-full font-headline font-bold text-sm tracking-wide shadow-lg shadow-accent-glow hover:opacity-90 transition-all active:scale-95 btn-hover-lift">
          <Plus className="w-5 h-5" />
          Create New Listing
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
        <div className="bg-surface-low p-5 md:p-6 rounded-2xl animate-fade-slide-up stagger-1 hover:bg-surface-high transition-all duration-300 cursor-default">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Total Listings</p>
          <p className="text-3xl font-black font-headline text-accent-primary">{stats?.totalListings ?? 0}</p>
        </div>
        <div className="bg-surface-low p-5 md:p-6 rounded-2xl animate-fade-slide-up stagger-2 hover:bg-surface-high transition-all duration-300 cursor-default">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Active Now</p>
          <p className="text-3xl font-black font-headline text-text-green">{stats?.activeListings ?? 0}</p>
        </div>
        <div className="bg-surface-low p-5 md:p-6 rounded-2xl animate-fade-slide-up stagger-3 hover:bg-surface-high transition-all duration-300 cursor-default">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Total Views</p>
          <p className="text-3xl font-black font-headline text-text-primary">{stats?.totalViews.toLocaleString() || "0"}</p>
        </div>
        <div className="bg-surface-low p-5 md:p-6 rounded-2xl animate-fade-slide-up stagger-4 hover:bg-surface-high transition-all duration-300 cursor-default">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Avg. Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-black font-headline text-accent-secondary">{stats?.avgRating?.toFixed(1) || "0.0"}</p>
            <span className="material-symbols-outlined text-accent-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
              star
            </span>
          </div>
        </div>
      </div>

      {/* ── Listings Grid ───────────────────────────────────────────────── */}
      {!listings || listings.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-surface-base rounded-3xl border border-border-light text-center px-4 animate-fade-slide-up stagger-5">
          <h2 className="text-xl font-bold font-headline mb-2">No listings yet</h2>
          <p className="text-text-muted mb-6 max-w-sm text-sm">
            You haven&apos;t listed any venues or services yet. Create your first listing to start getting bookings.
          </p>
          <button
            onClick={() => router.push("/vendor/create-listing")}  
            className="flex items-center justify-center gap-2 bg-accent-primary text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-accent-glow hover:opacity-90 transition-all text-sm btn-hover-lift">
            <Plus className="w-5 h-5" />
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const openEditor = () => router.push(`/vendor/create-listing?edit=${listing.id}`);

            return (
              <div
                key={listing.id}
                onClick={listing.canEdit ? openEditor : undefined}
                role={listing.canEdit ? "button" : undefined}
                tabIndex={listing.canEdit ? 0 : undefined}
                onKeyDown={(e) => {
                  if (listing.canEdit && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    openEditor();
                  }
                }}
                className={`group relative bg-surface-base rounded-2xl overflow-hidden transition-all duration-500 animate-fade-slide-up stagger-5 ${
                  listing.canEdit
                    ? "cursor-pointer hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                    : "hover:shadow-xl"
                }`}
              >
                <div className="relative aspect-[4/3] bg-surface-dim overflow-hidden">
                  <Image
                    src={listing.thumbnailUrl}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  <div className="absolute top-4 left-4 flex gap-2">
                    <StatusBadge status={listing.status} />
                  </div>

                  {listing.canEdit && (
                    <>
                      {/* Always-visible edit button (works on touch, no hover needed) */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEditor(); }}
                        aria-label={`Edit ${listing.title}`}
                        title="Edit draft"
                        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-text-primary shadow-card backdrop-blur-sm transition-transform duration-300 hover:scale-110 active:scale-95"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Hover CTA on the image */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/70 via-black/25 to-transparent p-4 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-text-primary shadow-card">
                          <Pencil className="w-3.5 h-3.5" />
                          {listing.status === "rejected" ? "Edit & Resubmit" : "Continue Draft"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

              <div className="p-6">
                <h3 className="text-lg font-bold font-headline text-text-primary leading-tight mb-1 line-clamp-1 transition-colors duration-300 group-hover:text-accent-primary">
                  {listing.title}
                </h3>
                <p className="text-sm text-text-muted mb-4">{listing.location}</p>

                <div className="flex justify-between items-end border-t border-border-light/50 pt-4 mt-2">
                  <div>
                    <p className="font-extrabold text-lg leading-none text-text-primary">
                      {formatNaira(listing.pricePerUnit)}
                    </p>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1 font-bold">
                      / {listing.unit}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-text-muted mb-1">{listing.viewsLast30Days} Views</p>
                    <p className="text-xs font-semibold text-text-primary">{listing.bookingsLast30Days} Bookings</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

          {/* ── Create New Card ──────────────────────────────────────────── */}
          <div className="border-2 border-dashed border-border-light rounded-2xl flex flex-col items-center justify-center p-12 hover:bg-surface-low transition-all duration-500 group cursor-pointer animate-fade-slide-up stagger-7 hover:border-accent-primary/50">
            <div className="w-16 h-16 rounded-full bg-accent-tint flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent-glow transition-all duration-500">
              <Plus className="w-8 h-8 text-accent-primary transition-transform duration-500 group-hover:rotate-90" />
            </div>
            <h4 className="text-lg font-bold font-headline text-text-primary">Add New Listing</h4>
            <p className="text-sm text-text-muted text-center mt-2 px-6">
              Ready to showcase a new venue or professional service?
            </p>
            <button
              onClick={() => router.push("/vendor/create-listing")}
              className="mt-8 px-8 py-3 bg-accent-primary text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-accent-glow transition-all duration-300 hover:shadow-[rgba(214,92,58,0.35)] active:scale-95 btn-hover-lift">
                Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMyListingsView() {
  return (
    <section className="flex flex-col md:hidden min-h-screen bg-bg-primary pb-32">
      <div className="px-4">
        <MyListingsContent />
      </div>
      <VendorMobileDock />
    </section>
  );
}

function DesktopMyListingsView() {
  return (
    <section className="hidden xl:flex min-h-screen bg-bg-primary">
      <VendorSideNavBar />
      <div className="w-[85%] ml-[15%]">
        <div className="px-10 lg:px-16">
          <MyListingsContent />
        </div>
      </div>
    </section>
  );
}

function TabletMyListingsView() {
  return (
    <section className="hidden md:flex xl:hidden flex-col min-h-screen bg-bg-primary pb-32">
      <div className="px-10">
        <MyListingsContent />
      </div>
      <VendorMobileDock />
    </section>
  );
}

export default function MyListingsPage() {
  return (
    <main className="text-text-primary">
      <MobileMyListingsView />
      <TabletMyListingsView />
      <DesktopMyListingsView />
    </main>
  );
}