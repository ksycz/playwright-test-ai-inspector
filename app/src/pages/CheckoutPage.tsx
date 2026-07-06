import { useId, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import type { CheckoutFormData, CheckoutFormErrors } from '@/types/order';
import { generateOrderId, validateCheckoutForm } from '@/utils/checkout';
import { saveOrderToStorage } from '@/utils/orderStorage';
import { formatPrice } from '@/utils/products';

const initialFormData: CheckoutFormData = {
  name: '',
  email: '',
  address: '',
  city: '',
  zipCode: '',
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const nameId = useId();
  const emailId = useId();
  const addressId = useId();
  const cityId = useId();
  const zipCodeId = useId();
  const nameErrorId = useId();
  const emailErrorId = useId();
  const addressErrorId = useId();
  const cityErrorId = useId();
  const zipCodeErrorId = useId();

  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCompletingOrderRef = useRef(false);

  if (items.length === 0 && !isCompletingOrderRef.current) {
    return <Navigate to="/cart" replace />;
  }

  const updateField = (field: keyof CheckoutFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateCheckoutForm(formData);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    isCompletingOrderRef.current = true;

    const order = {
      id: generateOrderId(),
      items: items.map((item) => ({ ...item })),
      total,
      customerName: formData.name.trim(),
      customerEmail: formData.email.trim(),
      shippingAddress: formData.address.trim(),
      shippingCity: formData.city.trim(),
      shippingZipCode: formData.zipCode.trim(),
    };

    saveOrderToStorage(order);
    clearCart();
    navigate('/order-confirmation', { replace: true });
  };

  return (
    <>
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <p className="mt-4 text-slate-600">Enter your details to complete your order.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label htmlFor={nameId} className="block text-sm font-medium text-slate-900">
              Name
            </label>
            <input
              id={nameId}
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              aria-required="true"
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? nameErrorId : undefined}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            />
            {fieldErrors.name ? (
              <p id={nameErrorId} className="mt-2 text-sm text-red-700">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={emailId} className="block text-sm font-medium text-slate-900">
              Email
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(event) => updateField('email', event.target.value)}
              aria-required="true"
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? emailErrorId : undefined}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            />
            {fieldErrors.email ? (
              <p id={emailErrorId} className="mt-2 text-sm text-red-700">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={addressId} className="block text-sm font-medium text-slate-900">
              Address
            </label>
            <input
              id={addressId}
              name="address"
              type="text"
              autoComplete="street-address"
              value={formData.address}
              onChange={(event) => updateField('address', event.target.value)}
              aria-required="true"
              aria-invalid={fieldErrors.address ? true : undefined}
              aria-describedby={fieldErrors.address ? addressErrorId : undefined}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            />
            {fieldErrors.address ? (
              <p id={addressErrorId} className="mt-2 text-sm text-red-700">
                {fieldErrors.address}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={cityId} className="block text-sm font-medium text-slate-900">
              City
            </label>
            <input
              id={cityId}
              name="city"
              type="text"
              autoComplete="address-level2"
              value={formData.city}
              onChange={(event) => updateField('city', event.target.value)}
              aria-required="true"
              aria-invalid={fieldErrors.city ? true : undefined}
              aria-describedby={fieldErrors.city ? cityErrorId : undefined}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            />
            {fieldErrors.city ? (
              <p id={cityErrorId} className="mt-2 text-sm text-red-700">
                {fieldErrors.city}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={zipCodeId} className="block text-sm font-medium text-slate-900">
              ZIP Code
            </label>
            <input
              id={zipCodeId}
              name="zipCode"
              type="text"
              autoComplete="postal-code"
              value={formData.zipCode}
              onChange={(event) => updateField('zipCode', event.target.value)}
              aria-required="true"
              aria-invalid={fieldErrors.zipCode ? true : undefined}
              aria-describedby={fieldErrors.zipCode ? zipCodeErrorId : undefined}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            />
            {fieldErrors.zipCode ? (
              <p id={zipCodeErrorId} className="mt-2 text-sm text-red-700">
                {fieldErrors.zipCode}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Place order
          </button>
        </form>

        <section
          aria-label="Order summary"
          className="h-fit rounded border border-slate-200 p-6"
        >
          <h2 className="text-xl font-semibold text-slate-900">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => {
              const lineSubtotal = item.product.price * item.quantity;

              return (
                <li key={item.product.slug} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-slate-900">
                    {item.product.name}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                  </span>
                  <span className="text-slate-700">{formatPrice(lineSubtotal)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
            Total: {formatPrice(total)}
          </p>
        </section>
      </div>
    </>
  );
}
