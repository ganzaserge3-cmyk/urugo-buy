import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@shared/schema';

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  lastUpdatedAt: number;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastUpdatedAt: Date.now(),
      
      setIsOpen: (isOpen) => set({ isOpen }),
      
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          const safeQuantity = Math.max(1, Math.min(quantity, product.stockQuantity));
          if (existingItem) {
            const nextQuantity = Math.min(existingItem.quantity + safeQuantity, product.stockQuantity);
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: nextQuantity }
                  : item
              ),
              isOpen: true, // Open cart when item added
              lastUpdatedAt: Date.now(),
            };
          }
          return { 
            items: [...state.items, { ...product, quantity: safeQuantity }],
            isOpen: true,
            lastUpdatedAt: Date.now(),
          };
        });
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
          lastUpdatedAt: Date.now(),
        }));
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: Math.min(quantity, item.stockQuantity) }
              : item
          ),
          lastUpdatedAt: Date.now(),
        }));
      },
      
      clearCart: () => set({ items: [], lastUpdatedAt: Date.now() }),
      
      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      totalPrice: () => {
        return get().items.reduce(
          (total, item) => total + Number(item.price) * item.quantity,
          0
        );
      },
    }),
    {
      name: 'shopping-cart',
      partialize: (state) => ({ items: state.items, lastUpdatedAt: state.lastUpdatedAt }),
    }
  )
);
