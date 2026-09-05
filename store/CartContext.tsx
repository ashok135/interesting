'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useCart } from '@/hooks/useCart';
import type { CartItem, CartState } from '@/types';

interface CartContextValue extends CartState {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <CartContext.Provider value={{ ...cart, isDrawerOpen, openDrawer, closeDrawer }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCartContext must be used inside <CartProvider>');
  }
  return ctx;
}
