import { Link, Navigate } from 'react-router-dom';
import { loadOrderFromStorage } from '@/utils/orderStorage';
import { formatPrice } from '@/utils/products';

export default function OrderConfirmationPage() {
  const order = loadOrderFromStorage();

  if (!order) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <>
      <h1 className="text-3xl font-semibold">Order confirmed</h1>
      <p className="mt-4 text-slate-600">
        Thank you for your order. Your order number is{' '}
        <span data-testid="order-number" className="font-medium text-slate-900">
          {order.id}
        </span>
        .
      </p>

      <section aria-label="Order details" className="mt-8 max-w-lg">
        <h2 className="text-xl font-semibold text-slate-900">Order details</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => {
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
          Total: {formatPrice(order.total)}
        </p>
      </section>

      <p className="mt-8">
        <Link
          to="/products"
          className="rounded px-3 py-2 text-sm font-medium text-slate-900 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Continue shopping
        </Link>
      </p>
    </>
  );
}
