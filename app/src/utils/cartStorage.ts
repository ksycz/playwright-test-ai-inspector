import type { CartItem } from '@/types/product';

export const CART_STORAGE_KEY = 'cart';

export function loadCartFromStorage(): CartItem[] {
  try {
    const storedValue = localStorage.getItem(CART_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue as CartItem[];
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}
