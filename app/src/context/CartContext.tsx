import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Product } from '@/types/product';
import { loadCartFromStorage, saveCartToStorage } from '@/utils/cartStorage';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  total: number;
  addItem: (product: Product) => void;
  increaseQuantity: (slug: string) => void;
  decreaseQuantity: (slug: string) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function calculateSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());

  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  const addItem = useCallback((product: Product) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.product.slug === product.slug);

      if (existingItem) {
        return currentItems.map((item) =>
          item.product.slug === product.slug
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentItems, { product, quantity: 1 }];
    });
  }, []);

  const increaseQuantity = useCallback((slug: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.product.slug === slug ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }, []);

  const decreaseQuantity = useCallback((slug: string) => {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.product.slug === slug ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.product.slug !== slug));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(() => calculateSubtotal(items), [items]);
  const total = subtotal;

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotal,
      total,
      addItem,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      totalItems,
      subtotal,
      total,
      addItem,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
