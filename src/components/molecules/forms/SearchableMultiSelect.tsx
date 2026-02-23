import React, { useState, useEffect, useRef } from 'react';
import { TextField, Text } from '@bosch/react-frok';
import useDebounce from '@hooks/useDebounce';

interface Option {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  id: string;
  label: string;
  placeholder?: string;
  selectedValues: string[];
  onSelect: (value: string) => void;
  onRemove: (value: string) => void;
  searchResults: any[] | null;
  isSearching: boolean;
  onSearch: (term: string) => void;
  onSearchSubmit?: (term: string) => void; // New: Used for submitting the search explicitly
  onSearchReset?: () => void; // New: Used for resetting the search
  getOptionLabel: (item: any) => string;
  getOptionValue: (item: any) => string;
  getOptionDescription?: (item: any) => string;
  getSelectedItemLabel?: (value: string) => string; // New: Function to get label for selected values
  noResultsMessage?: string;
  searchingMessage?: string;
  minSearchLength?: number;
  useExplicitSearch?: boolean; // New: When true, search is only performed with buttons or Enter key
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  id,
  label,
  placeholder = 'Search...',
  selectedValues,
  onSelect,
  onRemove,
  searchResults,
  isSearching,
  onSearch,
  onSearchSubmit,
  onSearchReset,
  getOptionLabel,
  getOptionValue,
  getOptionDescription,
  getSelectedItemLabel,
  noResultsMessage = 'No results found',
  searchingMessage = 'Searching...',
  minSearchLength = 3,
  useExplicitSearch = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const resultItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Reset the focused index when search term changes
    setFocusedIndex(-1);

    // If we're not using explicit search, update search term directly
    if (!useExplicitSearch) {
      setShowResults(value.length >= minSearchLength);
      onSearch(value);
    } else {
      // When using explicit search, only notify parent of input change
      onSearch(value);

      // Auto-hide results when input is empty
      if (value === '') {
        setShowResults(false);
        if (onSearchReset) {
          onSearchReset();
        }
      }
    }
  };

  // Handle keyboard navigation within search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't handle keyboard navigation if results aren't shown
    if (!showResults || !searchResults || searchResults.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
          handleResultSelect(searchResults[focusedIndex]);
        } else if (useExplicitSearch) {
          handleSearchSubmit();
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        searchInputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  // Handle search submission (Enter key or search button)
  const handleSearchSubmit = () => {
    if (searchTerm.length >= minSearchLength && onSearchSubmit) {
      onSearchSubmit(searchTerm);
      setShowResults(true);
    }
  };

  // Handle search reset
  const handleSearchReset = () => {
    setSearchTerm('');
    setShowResults(false);
    if (onSearchReset) {
      onSearchReset();
    }
  };

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Trigger search when debounced term changes (for non-explicit search mode)
  useEffect(() => {
    if (!useExplicitSearch && debouncedSearchTerm.length >= minSearchLength) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, minSearchLength, onSearch, useExplicitSearch]);

  // Scroll the focused item into view
  useEffect(() => {
    if (focusedIndex !== -1 && resultItemsRef.current[focusedIndex]) {
      resultItemsRef.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [focusedIndex]);

  // Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(-1);
    resultItemsRef.current = resultItemsRef.current.slice(0, searchResults?.length || 0);
  }, [searchResults]);

  // Handle result selection
  const handleResultSelect = (item: any) => {
    const value = getOptionValue(item);
    if (!selectedValues.includes(value)) {
      onSelect(value);
    }
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>{' '}
      <div className="relative">
        <TextField
          id={id}
          ref={searchInputRef}
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="w-full"
          type={useExplicitSearch ? 'search' : 'text'}
          resetButton={
            useExplicitSearch
              ? {
                  title: 'Clear',
                  onClick: handleSearchReset,
                }
              : undefined
          }
          searchButton={
            useExplicitSearch
              ? {
                  title: 'Search',
                  onClick: handleSearchSubmit,
                }
              : undefined
          }
          onKeyDown={(e) => {
            handleKeyDown(e);
            if (useExplicitSearch && focusedIndex === -1) {
              handleSearchSubmit();
            }
          }}
        />

        {showResults &&
          ((useExplicitSearch && searchResults) ||
            (!useExplicitSearch && debouncedSearchTerm.length >= minSearchLength)) && (
            <div
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
              ref={resultsRef}
            >
              {isSearching ? (
                <div className="p-4 text-center text-sm">
                  <span className="mr-2">{searchingMessage}</span>
                  <span className="inline-block animate-pulse">...</span>
                </div>
              ) : searchResults && Array.isArray(searchResults) && searchResults.length > 0 ? (
                searchResults.map((item, index) => (
                  <div
                    key={getOptionValue(item) || index}
                    className={`cursor-pointer px-4 py-2 hover:bg-gray-50 ${
                      focusedIndex === index ? 'bg-bosch-gray-90' : ''
                    }`}
                    onClick={() => handleResultSelect(item)}
                    ref={(el) => (resultItemsRef.current[index] = el)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <div className="font-medium">{getOptionLabel(item)}</div>
                    {getOptionDescription && <div className="text-sm text-gray-500">{getOptionDescription(item)}</div>}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm">{noResultsMessage}</div>
              )}
            </div>
          )}
      </div>
      <Text className="mt-1 text-xs text-bosch-gray-60">Type at least {minSearchLength} characters to search</Text>
      {/* Selected Items */}
      <div className="mt-2">
        {selectedValues.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((value) => (
              <div key={value} className="flex items-center rounded-md bg-bosch-gray-90 px-3 py-1.5">
                <span className="mr-2">{getSelectedItemLabel ? getSelectedItemLabel(value) : value}</span>
                <button
                  type="button"
                  className="text-bosch-gray-60 hover:text-bosch-red"
                  onClick={() => onRemove(value)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Text className="italic text-bosch-gray-60">No items selected</Text>
        )}
      </div>
    </div>
  );
};

export default SearchableMultiSelect;
