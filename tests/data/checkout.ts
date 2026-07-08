export const validCheckoutDetails = {
  name: 'Jane Tester',
  email: 'jane@example.com',
  address: '123 Test Street',
  city: 'Testville',
  zipCode: '12345',
} as const;

export const invalidEmailDetails = {
  ...validCheckoutDetails,
  email: 'not-an-email',
} as const;

export const checkoutFieldErrors = [
  { label: 'Name', message: 'Name is required', data: { ...validCheckoutDetails, name: '' } },
  { label: 'Email', message: 'Email is required', data: { ...validCheckoutDetails, email: '' } },
  {
    label: 'Address',
    message: 'Address is required',
    data: { ...validCheckoutDetails, address: '' },
  },
  { label: 'City', message: 'City is required', data: { ...validCheckoutDetails, city: '' } },
  {
    label: 'ZIP Code',
    message: 'ZIP Code is required',
    data: { ...validCheckoutDetails, zipCode: '' },
  },
] as const;

