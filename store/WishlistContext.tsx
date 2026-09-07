'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

interface WishlistContextValue {
  wishlistIds: number[];
  wishlistCount: number;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number, productName?: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = 'intersting_wishlist_ids';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { showSuccess, showToast } = useToast();

  // Load saved wishlist from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistIds));
      } catch {
        // ignore
      }
    }
  }, [wishlistIds, isHydrated]);

  // Clear wishlist immediately on logout
  useEffect(() => {
    const handleLogout = () => {
      setWishlistIds([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const isInWishlist = useCallback(
    (productId: number) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    (productId: number, productName?: string) => {
      const exists = wishlistIds.includes(productId);

      if (exists) {
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
        showToast(`Removed ${productName || 'item'} from wishlist`, 'info');
      } else {
        setWishlistIds((prev) => [...prev, productId]);
        showSuccess(`Saved ${productName || 'item'} to wishlist!`);
      }
    },
    [wishlistIds, showSuccess, showToast]
  );

  const clearWishlist = useCallback(() => {
    setWishlistIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used inside <WishlistProvider>');
  }
  return ctx;
}
