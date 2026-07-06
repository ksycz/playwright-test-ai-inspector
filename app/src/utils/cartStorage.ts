import type { CartItem, Product } from '@/types/product';

export const CART_STORAGE_KEY = 'cart';

function isValidProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const product = value as Record<string, unknown>;

  return (
    typeof product.slug === 'string' &&
    typeof product.name === 'string' &&
    typeof product.category === 'string' &&
    typeof product.shortDescription === 'string' &&
    typeof product.fullDescription === 'string' &&
    typeof product.price === 'number' &&
    typeof product.image === 'string'
  );
}

function isValidCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    isValidProduct(item.product) &&
    typeof item.quantity === 'number' &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function clearCorruptCartStorage() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function loadCartFromStorage(): CartItem[] {
  try {
    const storedValue = localStorage.getItem(CART_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      clearCorruptCartStorage();
      return [];
    }

    const validItems = parsedValue.filter(isValidCartItem);

    if (validItems.length !== parsedValue.length) {
      clearCorruptCartStorage();
      return [];
    }

    return validItems;
  } catch {
    clearCorruptCartStorage();
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}
