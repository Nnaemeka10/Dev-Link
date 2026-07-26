// "use client";

// import React from "react";
// import Link from "next/link";
// import VendorSideNavBar from "../../../components/layout/VendorSideNavBar";
// import VendorMobileDock from "../../../components/layout/VendorMobileDock";
// import { MOCK_VENDOR_LISTINGS } from "../vendor.data";
// import { Plus } from "lucide-react";

// function formatNaira(amount: number) {
//   return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
// }

// function MyListingsContent() {
//   return (
//     <div className="max-w-6xl mx-auto py-8">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
//         <div>
//           <h1 className="text-4xl font-extrabold text-[#1a1f3c] tracking-tight">My Listings</h1>
//           <p className="mt-2 text-sm text-[#1a1f3c]/60">Manage your event spaces and services</p>
//         </div>
        
//         <button className="flex items-center justify-center gap-2 bg-[#d65c3a] text-white px-5 py-3 rounded-full font-bold shadow-md hover:brightness-95 transition-all text-sm w-full sm:w-auto">
//           <Plus className="w-5 h-5" /> 
//           Create New Listing
//         </button>
//       </div>

//       {/* stats */}
//       <div className="grid grid-cols-4 gap-6 mb-12">
//         <div className="bg-surface-container-low p-6 rounded-lg animate-fade-slide-up stagger-1 hover:bg-surface-container-high transition-all duration-300 cursor-default">
//           <p className="text-tertiary text-xs font-bold uppercase tracking-widest mb-1">Total Listings</p>
//           <p className="text-3xl font-black font-headline text-primary">24</p>
//         </div>
//         <div className="bg-surface-container-low p-6 rounded-lg animate-fade-slide-up stagger-2 hover:bg-surface-container-high transition-all duration-300 cursor-default">
//           <p className="text-tertiary text-xs font-bold uppercase tracking-widest mb-1">Active Now</p>
//           <p className="text-3xl font-black font-headline text-[#2d5a27]">18</p>
//         </div>
//         <div className="bg-surface-container-low p-6 rounded-lg animate-fade-slide-up stagger-3 hover:bg-surface-container-high transition-all duration-300 cursor-default">
//           <p className="text-tertiary text-xs font-bold uppercase tracking-widest mb-1">Total Views</p>
//           <p className="text-3xl font-black font-headline text-on-surface">12.4k</p>
//         </div>
//         <div className="bg-surface-container-low p-6 rounded-lg animate-fade-slide-up stagger-4 hover:bg-surface-container-high transition-all duration-300 cursor-default">
//           <p className="text-tertiary text-xs font-bold uppercase tracking-widest mb-1">Avg. Rating</p>
//           <div className="flex items-center gap-2">
//             <p className="text-3xl font-black font-headline text-secondary">4.9</p>
//             <span className="material-symbols-outlined text-secondary" data-icon="star" data-weight="fill">star</span>
//           </div>
//         </div>
//       </div>

//       {MOCK_VENDOR_LISTINGS.length === 0 ? (
//         <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#1a1f3c]/10 text-center px-4">
//           <h2 className="text-xl font-bold mb-2">No listings yet</h2>
//           <p className="text-gray-500 mb-6 max-w-sm text-sm">You haven&apos;t listed any venues or services yet. Create your first listing to start getting bookings.</p>
//           <button className="flex items-center justify-center gap-2 bg-[#d65c3a] text-white px-6 py-3 rounded-full font-bold shadow-md hover:brightness-95 transition-all text-sm">
//             <Plus className="w-5 h-5" /> 
//             Create Your First Listing
//           </button>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {MOCK_VENDOR_LISTINGS.map((listing) => (
//             <div key={listing.id} className="group relative bg-white border border-[#1a1f3c]/10 rounded-[2rem] overflow-hidden hover:shadow-lg transition-all duration-300">
//               <div className="relative aspect-[4/3] bg-gray-100">
//                 <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover" />
//                 <div className="absolute top-4 left-4">
//                   {listing.status === "active" ? (
//                     <span className="bg-white/90 backdrop-blur text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
//                       <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
//                     </span>
//                   ) : (
//                     <span className="bg-white/90 backdrop-blur text-orange-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
//                       <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Draft
//                     </span>
//                   )}
//                 </div>
//               </div>
              
//               <div className="p-5">
//                 <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-1 group-hover:text-[#d65c3a] transition-colors">{listing.title}</h3>
//                 <p className="text-sm text-gray-500 mb-3">{listing.location}</p>
                
//                 <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-2">
//                   <div>
//                     <p className="font-extrabold text-lg leading-none">{formatNaira(listing.pricePerUnit)}</p>
//                     <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">/ {listing.unit}</p>
//                   </div>
                  
//                   <div className="text-right">
//                     <p className="text-xs text-gray-400 mb-1">{listing.viewsLast30Days} Views</p>
//                     <p className="text-xs font-semibold">{listing.bookingsLast30Days} Bookings</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {/* Create New Card Placeholder --> */}
//           <div className="border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center p-12 hover:bg-surface-container-low transition-all duration-500 group cursor-pointer animate-fade-slide-up stagger-7 hover:border-primary/50">
//             <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-container/20 transition-all duration-500">
//               <span className="material-symbols-outlined text-primary text-3xl transition-transform duration-500 group-hover:rotate-90" data-icon="add">add</span>
//             </div>
//             <h4 className="text-lg font-bold font-headline text-on-surface">Add New Listing</h4>
//             <p className="text-sm text-tertiary text-center mt-2 px-6">Ready to showcase a new venue or professional service?</p>
//             <button className="mt-8 px-8 py-3 bg-primary text-on-primary rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 active:scale-95">
//                 Get Started
//             </button>
//           </div>
//         </div>
//      )}
//     </div>
//   );
// }

// function MobileMyListingsView() {
//   return (
//     <section className="flex flex-col md:hidden min-h-screen bg-[#f9f6ef] pb-32">
//       <div className="px-4">
//         <MyListingsContent />
//       </div>
//       <VendorMobileDock />
//     </section>
//   );
// }

// function DesktopMyListingsView() {
//   return (
//     <section className="hidden xl:flex min-h-screen bg-[#f9f6ef]">
//       <VendorSideNavBar />
//       <div className="w-[85%] ml-[15%]">
//         <div className="px-10 lg:px-16">
//           <MyListingsContent />
//         </div>
//       </div>
//     </section>
//   );
// }

// function TabletMyListingsView() {
//   return (
//     <section className="hidden md:flex xl:hidden flex-col min-h-screen bg-[#f9f6ef] pb-32">
//       <div className="px-10">
//         <MyListingsContent />
//       </div>
//       <VendorMobileDock />
//     </section>
//   );
// }

// export default function MyListingsPage() {
//   return (
//     <main className="text-[#1a1f3c]">
//       <MobileMyListingsView />
//       <TabletMyListingsView />
//       <DesktopMyListingsView />
//     </main>
//   );
// }




"use client";

import React from "react";
import Link from "next/link";
import VendorSideNavBar from "../../../components/layout/VendorSideNavBar";
import VendorMobileDock from "../../../components/layout/VendorMobileDock";
import { MOCK_VENDOR_LISTINGS } from "../vendor.data";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);
}

function MyListingsContent() {
  const router = useRouter();
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

        <button className="flex items-center justify-center gap-2 bg-accent-primary text-white px-6 py-3.5 rounded-full font-headline font-bold text-sm tracking-wide shadow-lg shadow-accent-glow hover:opacity-90 transition-all active:scale-95 btn-hover-lift">
          <Plus className="w-5 h-5" />
          Create New Listing
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
        <div className="bg-surface-low p-5 md:p-6 rounded-2xl animate-fade-slide-up stagger-1 hover:bg-surface-high transition-all duration-300 cursor-default">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Total Listings</p>
          <p className="text-3xl font-black font-headline text-accent-primary">24</p>
        </div>
        <div className="bg-surface-low p-5 md:p-6 rounded-2xl animate-fade-slide-up stagger-2 hover:bg-surface-high transition-all duration-300 cursor-default">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Active Now</p>
          <p className="text-3xl font-black font-headline text-text-green">18</p>
        </div>
        <div className="bg-surface-low p-5 md:p-6 rounded-2xl animate-fade-slide-up stagger-3 hover:bg-surface-high transition-all duration-300 cursor-default">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Total Views</p>
          <p className="text-3xl font-black font-headline text-text-primary">12.4k</p>
        </div>
        <div className="bg-surface-low p-5 md:p-6 rounded-2xl animate-fade-slide-up stagger-4 hover:bg-surface-high transition-all duration-300 cursor-default">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Avg. Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-black font-headline text-accent-secondary">4.9</p>
            <span className="material-symbols-outlined text-accent-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
              star
            </span>
          </div>
        </div>
      </div>

      {/* ── Listings Grid ───────────────────────────────────────────────── */}
      {MOCK_VENDOR_LISTINGS.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-surface-base rounded-3xl border border-border-light text-center px-4 animate-fade-slide-up stagger-5">
          <h2 className="text-xl font-bold font-headline mb-2">No listings yet</h2>
          <p className="text-text-muted mb-6 max-w-sm text-sm">
            You haven&apos;t listed any venues or services yet. Create your first listing to start getting bookings.
          </p>
          <button className="flex items-center justify-center gap-2 bg-accent-primary text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-accent-glow hover:opacity-90 transition-all text-sm btn-hover-lift">
            <Plus className="w-5 h-5" />
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_VENDOR_LISTINGS.map((listing) => (
            <div
              key={listing.id}
              className="group relative bg-surface-base rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl animate-fade-slide-up stagger-5"
            >
              <div className="relative aspect-[4/3] bg-surface-dim overflow-hidden">
                <img
                  src={listing.thumbnailUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {listing.status === "active" ? (
                    <span className="bg-white/90 backdrop-blur-sm text-text-green px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-badge-pop stagger-6">
                      Active
                    </span>
                  ) : (
                    <span className="bg-surface-dim/90 backdrop-blur-sm text-text-on-muted px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-badge-pop stagger-6">
                      Draft
                    </span>
                  )}
                </div>
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
          ))}

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