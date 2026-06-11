"use client";

import React from "react";
import Link from "next/link";
import VendorSideNavBar from "../../../components/layout/VendorSideNavBar";
import VendorMobileDock from "../../../components/layout/VendorMobileDock";
import { MOCK_VENDOR_LISTINGS } from "../vendor.data";
import { Plus } from "lucide-react";

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

function MyListingsContent() {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1a1f3c] tracking-tight">My Listings</h1>
          <p className="mt-2 text-sm text-[#1a1f3c]/60">Manage your event spaces and services</p>
        </div>
        
        <button className="flex items-center justify-center gap-2 bg-[#d65c3a] text-white px-5 py-3 rounded-full font-bold shadow-md hover:brightness-95 transition-all text-sm w-full sm:w-auto">
          <Plus className="w-5 h-5" /> 
          Create New Listing
        </button>
      </div>

      {MOCK_VENDOR_LISTINGS.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#1a1f3c]/10 text-center px-4">
          <h2 className="text-xl font-bold mb-2">No listings yet</h2>
          <p className="text-gray-500 mb-6 max-w-sm text-sm">You haven't listed any venues or services yet. Create your first listing to start getting bookings.</p>
          <button className="flex items-center justify-center gap-2 bg-[#d65c3a] text-white px-6 py-3 rounded-full font-bold shadow-md hover:brightness-95 transition-all text-sm">
            <Plus className="w-5 h-5" /> 
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_VENDOR_LISTINGS.map((listing) => (
            <div key={listing.id} className="group relative bg-white border border-[#1a1f3c]/10 rounded-[2rem] overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative aspect-[4/3] bg-gray-100">
                <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4">
                  {listing.status === "active" ? (
                    <span className="bg-white/90 backdrop-blur text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                    </span>
                  ) : (
                    <span className="bg-white/90 backdrop-blur text-orange-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Draft
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-1 group-hover:text-[#d65c3a] transition-colors">{listing.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{listing.location}</p>
                
                <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-2">
                  <div>
                    <p className="font-extrabold text-lg leading-none">{formatNaira(listing.pricePerUnit)}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">/ {listing.unit}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">{listing.viewsLast30Days} Views</p>
                    <p className="text-xs font-semibold">{listing.bookingsLast30Days} Bookings</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileMyListingsView() {
  return (
    <section className="flex flex-col md:hidden min-h-screen bg-[#f9f6ef] pb-32">
      <div className="px-4">
        <MyListingsContent />
      </div>
      <VendorMobileDock />
    </section>
  );
}

function DesktopMyListingsView() {
  return (
    <section className="hidden xl:flex min-h-screen bg-[#f9f6ef]">
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
    <section className="hidden md:flex xl:hidden flex-col min-h-screen bg-[#f9f6ef] pb-32">
      <div className="px-10">
        <MyListingsContent />
      </div>
      <VendorMobileDock />
    </section>
  );
}

export default function MyListingsPage() {
  return (
    <main className="text-[#1a1f3c]">
      <MobileMyListingsView />
      <TabletMyListingsView />
      <DesktopMyListingsView />
    </main>
  );
}
