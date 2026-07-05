
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SavedListingCard } from "../listings.types";



export function useSavedListings() {
  return useQuery({
    queryKey: ["saved-listings"],
    queryFn: async () => {
      const data = await apiFetch<SavedListingCard[]>("/api/listings/saved", { 
        method: "GET", 
        redirectOn401: false
      });
      return data ?? [];
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useSaveListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (listingId: string) => {
      return apiFetch(`/api/listings/saved/${listingId}`, { 
        method: "POST", 
        redirectOn401: false 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-listings"] });
    },
  });
}

export function useRemoveSavedListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (listingId: string) => {
  
      return apiFetch(`/api/listings/saved/${listingId}`, { 
        method: "DELETE", 
        redirectOn401: false
      });
    },
    onSuccess: () => {
      // Invalidate cache to trigger a refetch of the saved listings
      queryClient.invalidateQueries({ queryKey: ["saved-listings"] });
    },
  });
}