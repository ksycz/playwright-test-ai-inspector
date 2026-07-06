import type { Order } from '@/types/order';

export const ORDER_STORAGE_KEY = 'order';

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

    if (
      typeof parsedValue !== 'object' ||
      parsedValue === null ||
      !('id' in parsedValue) ||
      typeof parsedValue.id !== 'string' ||
      !('items' in parsedValue) ||
      !Array.isArray(parsedValue.items) ||
      !('total' in parsedValue) ||
      typeof parsedValue.total !== 'number'
    ) {
      return null;
    }

    return parsedValue as Order;
  } catch {
    return null;
  }
}

export function clearOrderFromStorage() {
  sessionStorage.removeItem(ORDER_STORAGE_KEY);
}
