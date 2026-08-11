import type { Order } from '@/types/order';
import { isValidCartItem } from '@/utils/cartStorage';

export const ORDER_STORAGE_KEY = 'order';

function isValidOrder(value: unknown): value is Order {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const order = value as Record<string, unknown>;

  return (
    typeof order.id === 'string' &&
    order.id.length > 0 &&
    Array.isArray(order.items) &&
    order.items.every(isValidCartItem) &&
    typeof order.total === 'number' &&
    Number.isFinite(order.total) &&
    typeof order.customerName === 'string' &&
    typeof order.customerEmail === 'string' &&
    typeof order.shippingAddress === 'string' &&
    typeof order.shippingCity === 'string' &&
    typeof order.shippingZipCode === 'string'
  );
}

export function saveOrderToStorage(order: Order) {
  sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
}

export function loadOrderFromStorage(): Order | null {
  try {
    const storedValue = sessionStorage.getItem(ORDER_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!isValidOrder(parsedValue)) {
      clearOrderFromStorage();
      return null;
    }

    return parsedValue;
  } catch {
    clearOrderFromStorage();
    return null;
  }
}

export function clearOrderFromStorage() {
  sessionStorage.removeItem(ORDER_STORAGE_KEY);
}
