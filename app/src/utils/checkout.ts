import type { CheckoutFormData, CheckoutFormErrors } from '@/types/order';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCheckoutForm(data: CheckoutFormData): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (!data.address.trim()) {
    errors.address = 'Address is required';
  }

  if (!data.city.trim()) {
    errors.city = 'City is required';
  }

  if (!data.zipCode.trim()) {
    errors.zipCode = 'ZIP Code is required';
  }

  return errors;
}

export function generateOrderId() {
  return `ORD-${Date.now()}`;
}
