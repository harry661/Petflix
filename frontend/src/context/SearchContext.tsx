import { createContext, useContext, useState, type ReactNode } from 'react';

interface SearchContextType {
  isSearchOpen: boolean;
  searchQuery: string;
  searchResults: any[];
  isLoading: boolean;
  previousLocation: string | null;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: any[]) => void;
  setIsLoading: (loading: boolean) => void;
  setPreviousLocation: (location: string | null) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <SearchContext.Provider
      value={{
        isSearchOpen,
        searchQuery,
        searchResults,
        isLoading,
        previousLocation,
        openSearch,
        closeSearch,
        setSearchQuery,
        setSearchResults,
        setIsLoading,
        setPreviousLocation,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

