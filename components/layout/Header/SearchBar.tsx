'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { SearchItemSkeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils/formatters';
import styles from './SearchBar.module.css';

interface SearchProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price?: string;
  image?: string;
  category?: string;
  stock_status?: string;
}

const POPULAR_SUGGESTIONS = ['W180 Cashews', 'Tellicherry Pepper', 'Saffron', 'Salted Kaju'];

async function fetchSearchResults(searchTerm: string): Promise<SearchProduct[]> {
  if (!searchTerm.trim()) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm.trim())}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.products || [];
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce input (fast 50ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 50);
    return () => clearTimeout(timer);
  }, [query]);

  // TanStack Query with instant caching (5 min stale, 30 min GC)
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => fetchSearchResults(debouncedQuery),
    enabled: Boolean(debouncedQuery),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: (previousData) => previousData,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectProduct = (slug: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/product/${slug}`);
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
  };

  return (
    <div className={styles.searchContainer} ref={containerRef}>
      <form className={styles.form} onSubmit={handleSubmit} role="search">
        <div className={styles.searchIcon}>
          <Search size={16} />
        </div>
        <input
          type="search"
          className={styles.input}
          placeholder="Search 'Jumbo W180 Cashews', 'Tellicherry Pepper'..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim()) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true);
            }
          }}
          aria-label="Search products"
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Clear search query"
          >
            <X size={15} />
          </button>
        )}
      </form>

      {/* Live Search Dropdown with TanStack Cache */}
      {isOpen && query.trim() && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.dropdownHeader}>
            <span>{isLoading ? 'Searching farm harvest...' : `Found ${results.length} results`}</span>
            <Sparkles size={13} color="#15803d" />
          </div>

          <div className={styles.resultsList}>
            {isLoading ? (
              <>
                <SearchItemSkeleton />
                <SearchItemSkeleton />
                <SearchItemSkeleton />
              </>
            ) : results.length > 0 ? (
              results.map((product) => (
                <div
                  key={product.id}
                  className={styles.resultItem}
                  onClick={() => handleSelectProduct(product.slug)}
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={44}
                      height={44}
                      className={styles.resultThumb}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.thumbPlaceholder} />
                  )}

                  <div className={styles.resultInfo}>
                    <div className={styles.resultName}>{product.name}</div>
                    <div className={styles.resultMeta}>
                      {product.category && (
                        <span className={styles.resultCategory}>{product.category}</span>
                      )}
                      <span>•</span>
                      <span>{product.stock_status === 'outofstock' ? 'Sold Out' : 'Fresh In Stock'}</span>
                    </div>
                  </div>

                  <div className={styles.resultPrice}>
                    {formatPrice(product.price || '449')}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyDropdown}>
                <p className={styles.emptyText}>No harvest found for &quot;{query}&quot;</p>
                <p className={styles.emptySub}>Try searching for popular single-origin produce:</p>
                <div className={styles.suggestionsRow}>
                  {POPULAR_SUGGESTIONS.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className={styles.suggestionChip}
                      onClick={() => handleSuggestionClick(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isLoading && results.length > 0 && (
            <div
              className={styles.viewAllFooter}
              onClick={handleSubmit}
            >
              <span>View all {results.length} products for &quot;{query}&quot;</span>
              <ArrowRight size={14} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
