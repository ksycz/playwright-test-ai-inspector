import type { CartItem } from '@/types/product';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZipCode: string;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
}

export interface CheckoutFormErrors {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  zipCode?: string;
}
