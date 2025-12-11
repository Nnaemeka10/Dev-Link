
# Todo - QueryClient Typing

## Task
Look into the typing of the QueryClient setup in `queryClient.ts`

### Current Issue
The `query.meta` type is unclear and currently hardcoded as `string`. Need to properly type the query metadata instead of using `as string` assertion.

### Code Reference
import { QueryCache, QueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
        const errorMessage = query.meta?.errorMessage as string;
        toast.error(errorMessage);
    },
  }),
})

# Todo - hooks to add
we can add sortby like this
## code example
```jsx
      // Zustand - Client State
      export const useHomeStore = create<HomeState>((set) => ({
        searchQuery: '',
        selectedFilters: [],
        sortBy: 'relevance',
        
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSelectedFilters: (filters) => set({ selectedFilters: filters }),
        setSortBy: (sort) => set({ sortBy: sort }),
      }));

      // React Query Hook - Server State
      export const useSearch = () => {
        const { searchQuery, selectedFilters, sortBy } = useHomeStore();
        
        return useQuery({
          queryKey: ['search', searchQuery, selectedFilters, sortBy],
          queryFn: () => searchAPI({ 
            query: searchQuery, 
            filters: selectedFilters,
            sortBy 
          }),
          enabled: searchQuery.length > 0,
        });
      };

      // Component
      export default function SearchPage() {
        const { setSelectedFilters, selectedFilters } = useHomeStore(); // Client
        const { data, isLoading } = useSearch(); // Server

        return (
          <div>
            {/* Filters - Client state */}
            <div>
              {['doctors', 'hospitals', 'clinics'].map(filter => (
                <button
                  key={filter}
                  onClick={() => {
                    const newFilters = selectedFilters.includes(filter)
                      ? selectedFilters.filter(f => f !== filter)
                      : [...selectedFilters, filter];
                    setSelectedFilters(newFilters);
                  }}
                  className={selectedFilters.includes(filter) ? 'active' : ''}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            {/* Results - Server state */}
            {isLoading ? <Loading /> : <Results data={data} />}
          </div>
        );
      }
```
also mutations can be added if the user intends to save their search results e.g
```jsx
  // src/features/landing/api/search.ts

export const saveSearchAPI = async (searchId: string) => {
  const res = await axiosInstance.post('/search/save', { searchId });
  return res.data;
};

// src/features/landing/hooks/useSaveSearch.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSearchAPI } from '../api/search';
import toast from 'react-hot-toast';

export const useSaveSearch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: saveSearchAPI,
    onSuccess: () => {
      toast.success('Search saved!');
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
    },
    onError: () => {
      toast.error('Failed to save search');
    },
  });
};

// Component usage
export default function SearchResult({ result }) {
  const { mutate, isPending } = useSaveSearch(); // Server action
  
  return (
    <div>
      <h3>{result.title}</h3>
      <button 
        onClick={() => mutate(result.id)}
        disabled={isPending}
      >
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
```

---

## **Folder Structure**
```
src/
├── features/
│   └── landing/
│       ├── api/
│       │   └── search.ts           ← Pure API functions (axios)
│       ├── hooks/
│       │   ├── useSearch.ts        ← React Query (server state)
│       │   └── useSaveSearch.ts    ← React Query mutations
│       ├── store/
│       │   └── useHomeStore.ts     ← Zustand (client state)
│       └── components/
│           ├── SearchBar.tsx
│           ├── SearchResults.tsx
│           └── SearchFilters.tsx

```