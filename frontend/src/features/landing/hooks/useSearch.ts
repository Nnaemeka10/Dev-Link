import { useQuery } from "@tanstack/react-query";
import { searchAPIMock, type SearchResponse } from "../api/search";
import { useHomeStore } from "../store/usHomeStore";


export const useSearch = () => {

    //get client state from zustand
    const searchQuery = useHomeStore((state) => state.searchQuery)
    const selectedFilters = useHomeStore((state) => state.selectedFilters)

    //react query manages server state
    return useQuery <SearchResponse, Error>({
        queryKey: ['search', searchQuery, selectedFilters],
        queryFn: () => searchAPIMock({
            query: searchQuery,
            filters: selectedFilters
        }),
        meta: { 
            errorMessage: 'Failed to fetch search results'
        },
        enabled: searchQuery.length > 0, // onlly fect if there is something
        staleTime: 5*60*1000, // 5 min cache
        retry: 2,
    });
}
