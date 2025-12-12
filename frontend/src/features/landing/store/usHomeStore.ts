import { create } from 'zustand';

interface HomeState {
    //ui
    searchQuery: string;
    selectedFilters: string[];
    isMenuOpen: boolean;
    isLanguageOpen: boolean;
    selectedLanguage: string;
    isCountriesOpen: boolean;
    selectedCountry: string;

    //actions
    setSearchQuery: (query:string) => void;
    setSelectedFilters: (filters:string[]) => void;
    toggleMenu: () => void;
    clearSearch: () => void;
    toggleLanguage: () => void;
    setSelectedLanguage: (language:string) => void;
    toggleCountry: () => void;
    setSelectedCountry: (country:string) => void;
}

export const useHomeStore = create<HomeState>((set) => ({
    //initial states
    searchQuery: '',
    selectedFilters: [],
    isMenuOpen: false,
    isLanguageOpen: false,
    selectedLanguage: 'English',
    isCountriesOpen: false,
    selectedCountry: 'India',
    //actions
    setSearchQuery: (query) => set({ searchQuery: query }),

    setSelectedFilters: (filters) => set({ selectedFilters: filters }),

    toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen})),

    clearSearch: () => set({
        searchQuery: '',
        selectedFilters: [],
    }),

    toggleLanguage: () => set((state) => ({ isLanguageOpen: !state.isLanguageOpen})),
    setSelectedLanguage: (language) => set({ selectedLanguage: language}),

    toggleCountry: () => set((state) => ({ isCountriesOpen: !state.isCountriesOpen})),
    setSelectedCountry: (country) => set({ selectedCountry: country})


}));
