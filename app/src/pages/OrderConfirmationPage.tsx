import { Link, Navigate } from 'react-router-dom';
import { loadOrderFromStorage } from '@/utils/orderStorage';
import { formatPrice } from '@/utils/products';

export default function OrderConfirmationPage() {
  const order = loadOrderFromStorage();

  if (!order) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <section className="hero-panel">
      <h1 className="page-heading">Order confirmed</h1>
      <p className="page-intro">
        Thank you for your order. Your order number is{' '}
        <span data-testid="order-number" className="font-semibold text-brand-700">
          {order.id}
        </span>
        .
      </p>

      <section aria-label="Order details" className="surface-card mt-8 max-w-lg p-6">
        <h2 className="text-xl font-semibold text-brand-900">Order details</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => {
            const lineSubtotal = item.product.price * item.quantity;

            return (
              <li key={item.product.slug} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-brand-950">
                  {item.product.name}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </span>
                <span className="text-brand-800">{formatPrice(lineSubtotal)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 border-t border-brand-100 pt-4 text-base font-semibold text-brand-950">
          Total: {formatPrice(order.total)}
        </p>
      </section>

      <p className="mt-8">
        <Link to="/products" className="text-link px-3 py-2 text-sm">
          Continue shopping
        </Link>
      </p>
    </section>
  );
}
