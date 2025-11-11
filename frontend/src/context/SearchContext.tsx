import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  isSearchOpen: boolean;
  searchQuery: string;
  searchResults: any[];
  isLoading: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: any[]) => void;
  setIsLoading: (loading: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        openSearch,
        closeSearch,
        setSearchQuery,
        setSearchResults,
        setIsLoading,
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

