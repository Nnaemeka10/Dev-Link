# Navigation Component Build Guide

## Project Structure to Create

```
frontend/src/
├── lib/
│   └── constants/
│       └── navigation.ts           # All nav links & labels
├── features/landing/
│   ├── store/
│   │   └── useHomeStore.ts         # Zustand store for search state
│   ├── components/
│   │   └── Navigation.tsx          # Main navigation component
│   ├── api/
│   │   └── search.ts               # Search API placeholder
│   └── pages/
│       └── Home.tsx                # Import & use Navigation here
└── shared/
    └── styles/
        └── global.css              # Custom styles (if needed)
```

---

## Step-by-Step Building Process

### 1. Create Constants File
**File:** `frontend/src/lib/constants/navigation.ts`

**What to include:**
- Array of navigation links (Home, Browse Jobs, For Employers, About, Contact, etc.)
- Each link should have: `{ label: string, href: string, icon?: string }`
- CTA buttons (Login, Sign Up) separately

**Example structure:**
```typescript
export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Browse Jobs', href: '/jobs' },
  // ...
]

export const AUTH_LINKS = [
  { label: 'Login', href: '/login' },
  { label: 'Sign Up', href: '/signup' },
]
```

---

### 2. Create Zustand Store
**File:** `frontend/src/features/landing/store/useHomeStore.ts`

**Store State:**
- `searchQuery: string` - what user is typing
- `searchResults: any[]` - results from API
- `isSearching: boolean` - loading state
- `setSearchQuery: (query: string) => void` - update query
- `setSearchResults: (results: any[]) => void` - update results
- `setIsSearching: (loading: boolean) => void` - update loading

**Why Zustand?** Global state management without prop drilling

---

### 3. Create Search API File
**File:** `frontend/src/features/landing/api/search.ts`

**What to include:**
- Placeholder function for search API call
- Use React Query (useQuery hook)
- Returns mock/placeholder data for now

**Example:**
```typescript
import { useQuery } from '@tanstack/react-query';

export const useSearchJobs = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return Promise.resolve([
        { id: 1, title: 'Job 1', company: 'Company 1' },
      ]);
    },
    enabled: query.length > 0,
  });
};
```

---

### 4. Create Navigation Component
**File:** `frontend/src/features/landing/components/Navigation.tsx`

**Structure:**
```
Navigation Component
├── Logo/Brand (left)
├── Nav Links (center)
├── Search Bar (right-center)
│   ├── Input field
│   ├── Search icon (from lucide-react)
│   └── Dropdown results (below search)
└── Auth Buttons (far right)
    ├── Login button
    └── Sign Up button
```

**Key Features:**
- **Responsive:** Use Tailwind's `flex` and breakpoints (`md:`, `lg:`)
- **Mobile Menu:** Add hamburger icon (`Menu` from lucide-react) for mobile
- **Search Behavior:**
  - As user types → show results below
  - On click of result → redirect to `/login`
  - Use debounce to avoid too many API calls
- **Icons:** Import from `lucide-react` (Search, Menu, X, etc.)
- **Styling:** Use Tailwind classes; put custom styles in `global.css` if needed

**Component Logic:**
```typescript
1. Import:
   - Nav links from constants
   - useHomeStore for search state
   - useSearchJobs for API
   - Icons from lucide-react

2. State management:
   - Get/set searchQuery from store
   - Get results from useSearchJobs hook
   - Manage dropdown visibility

3. Effects:
   - Debounce search query (wait 300ms after user stops typing)
   - Trigger API call via useSearchJobs

4. Handlers:
   - handleSearchChange: update store & trigger search
   - handleResultClick: navigate to /login
   - handleSearchFocus: show results dropdown
   - handleSearchBlur: hide results dropdown

5. Responsive Layout:
   - Desktop: all items visible in one row
   - Mobile (md breakpoint): hamburger menu, search bar, hide some links
```

---

### 5. Update Home Page
**File:** `frontend/src/features/landing/pages/Home.tsx`

**What to do:**
- Import Navigation component
- Render it at the top
- Rest of homepage content below

```typescript
import Navigation from '../components/Navigation';

export default function Home() {
  return (
    <>
      <Navigation />
      {/* Rest of homepage content */}
    </>
  );
}
```

---

## Best Practices to Follow

### Code Organization
✅ Keep components small and single-responsibility
✅ Separate concerns: UI (components), logic (hooks), constants (data)
✅ Use TypeScript types for all props and state

### Styling
✅ Use Tailwind classes first (avoid custom CSS if possible)
✅ Use Flexbox for layout (`flex`, `flex-col`, `justify-between`, etc.)
✅ Keep colors/spacing consistent with design
✅ Add custom styles to `global.css` only for complex/reusable styles

### Forms & Input
✅ Use `react-hook-form` with `Zod` validation (if needed for advanced validation)
✅ For simple search, just manage state with Zustand

### API & Queries
✅ Use React Query for data fetching
✅ Use Zustand for UI state (search query, dropdown open/close)
✅ Separate concerns: React Query for server state, Zustand for client state

### Performance
✅ Add debounce to search input (avoid excessive API calls)
✅ Memoize components with `React.memo` if they re-render often
✅ Use `useCallback` for event handlers passed to child components

### Comments
✅ Comment complex logic or decisions
✅ Add section comments for grouping (e.g., `// Search Handlers`, `// Render`)
✅ Comment prop types and their purposes

### Icons (Lucide React)
✅ Import only what you need: `import { Search, Menu, X } from 'lucide-react'`
✅ Use consistent sizing: `className="w-5 h-5"` or `className="w-6 h-6"`
✅ Apply color/opacity via Tailwind: `className="w-5 h-5 text-gray-600"`

---

## Folder Structure Reminders

```
features/landing/
├── components/
│   ├── Navigation.tsx          ← Main navigation
│   └── (future components)
├── pages/
│   ├── Home.tsx                ← Uses Navigation
│   └── (future pages)
├── store/
│   └── useHomeStore.ts         ← Zustand for search state
├── api/
│   └── search.ts               ← Search API calls
└── (future folders: types, hooks, utils)
```

---

## Quick Checklist

- [ ] Create `navigation.ts` with nav links + auth links
- [ ] Create `useHomeStore.ts` with Zustand store
- [ ] Create `search.ts` API placeholder with React Query
- [ ] Create `Navigation.tsx` component with:
  - [ ] Logo + nav links
  - [ ] Search bar with debounce
  - [ ] Results dropdown
  - [ ] Auth buttons (Login/Sign Up)
  - [ ] Mobile hamburger menu
  - [ ] Responsive layout with Tailwind
- [ ] Add custom styles to `global.css` if needed
- [ ] Import Navigation in `Home.tsx`
- [ ] Test responsiveness (desktop, tablet, mobile)

---

## Useful Lucide React Icons for This Component

```typescript
import {
  Search,      // Search icon
  Menu,        // Hamburger menu
  X,           // Close menu
  ChevronDown, // Dropdown indicator
  Home,        // Home icon (optional)
  Briefcase,   // Jobs icon (optional)
  LogIn,       // Login icon (optional)
} from 'lucide-react';
```

---

## Tailwind Responsive Breakpoints

```typescript
// Mobile-first approach (default is mobile)
md:  // tablet (768px+)
lg:  // desktop (1024px+)
xl:  // large desktop (1280px+)

// Example:
className="flex flex-col md:flex-row md:justify-between"
// = flex column on mobile, flex row on tablet+
```

---

## Key Points

1. **Separation of Concerns:** Constants, Store, API, Components are separate files
2. **Type Safety:** Use TypeScript everywhere
3. **Reusability:** Build small, composable components
4. **Zustand for UI State:** Search query, dropdown open/close
5. **React Query for Data:** API calls, caching
6. **Tailwind First:** 90% styling via Tailwind, only custom CSS when necessary
7. **Comments:** Comment your logic clearly
8. **Mobile First:** Design mobile layout first, then add desktop enhancements

---

Good luck! Build it your way and let me know if you hit any issues or need code reviews! 🚀
