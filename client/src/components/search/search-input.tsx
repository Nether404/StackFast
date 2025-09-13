/**
 * Enhanced search input with autocomplete and suggestions
 */

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useSearchSuggestions } from '@/hooks/use-debounced-search';
import { searchService } from '@/services/search-service';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  showPopularTerms?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search tools by name, description, or features...",
  className,
  showSuggestions = true,
  showPopularTerms = true,
  onFocus,
  onBlur,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get search suggestions
  const { suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(
    value,
    (query) => searchService.getSearchSuggestions(query),
    { debounceMs: 150, minQueryLength: 2 }
  );

  // Get popular search terms
  const popularTerms = showPopularTerms ? searchService.getPopularSearchTerms(5) : [];

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
    onFocus?.();
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Don't hide dropdown if clicking on dropdown content
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      onBlur?.();
    }, 150);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.length > 0) {
      setShowDropdown(true);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    addToRecentSearches(suggestion);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      addToRecentSearches(value.trim());
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Add to recent searches
  const addToRecentSearches = (search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  // Clear search
  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  const shouldShowDropdown = showDropdown && isFocused && showSuggestions;
  const hasSuggestions = suggestions.length > 0;
  const hasRecentSearches = recentSearches.length > 0;
  const hasPopularTerms = popularTerms.length > 0;
  const hasAnyContent = hasSuggestions || hasRecentSearches || hasPopularTerms;

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn("pl-10 pr-10", className)}
          data-testid="enhanced-search-input"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {shouldShowDropdown && hasAnyContent && (
        <Card
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto bg-background border shadow-lg"
        >
          <div className="p-2 space-y-3">
            {/* Search Suggestions */}
            {hasSuggestions && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                  Suggestions
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="h-3 w-3 text-muted-foreground" />
                        <span>{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {hasRecentSearches && !value && (
              <div>
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recent
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={`recent-${index}`}
                      onClick={() => handleSuggestionSelect(search)}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{search}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Terms */}
            {hasPopularTerms && !value && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Popular
                </div>
                <div className="flex flex-wrap gap-1 px-2">
                  {popularTerms.map((term, index) => (
                    <Badge
                      key={`popular-${index}`}
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent text-xs"
                      onClick={() => handleSuggestionSelect(term.term)}
                    >
                      {term.term}
                      <span className="ml-1 text-muted-foreground">({term.count})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {suggestionsLoading && value.length >= 2 && (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                Loading suggestions...
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}