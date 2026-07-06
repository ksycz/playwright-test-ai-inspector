import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/products';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    total,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <section className="hero-panel">
        <h1 className="page-heading">Shopping cart</h1>
        <h2 className="mt-6 text-xl font-medium text-brand-900">Your cart is empty</h2>
        <p className="mt-2 text-slate-600">Add products from the catalogue to get started.</p>
        <p className="mt-6">
          <Link to="/products" className="text-link px-3 py-2 text-sm">
            Browse products
          </Link>
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-heading">Shopping cart</h1>
        <button type="button" onClick={clearCart} className="btn-secondary">
          Clear cart
        </button>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-brand-100 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">Shopping cart items</caption>
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50">
              <th scope="col" className="px-3 py-3 font-semibold text-brand-900">
                Product
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-brand-900">
                Quantity
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-brand-900">
                Subtotal
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-brand-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const lineSubtotal = item.product.price * item.quantity;

              return (
                <tr
                  key={item.product.slug}
                  aria-label={item.product.name}
                  data-testid={`cart-item-${item.product.slug}`}
                  className="border-b border-brand-50"
                >
                  <td className="px-3 py-4 font-medium text-brand-950">{item.product.name}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.product.slug)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-800 transition-colors hover:bg-brand-50 focus-ring"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center" aria-label={`Quantity ${item.quantity}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.product.slug)}
                        aria-label={`Increase quantity of ${item.product.name}`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-800 transition-colors hover:bg-brand-50 focus-ring"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-brand-800">{formatPrice(lineSubtotal)}</td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.slug)}
                      aria-label={`Remove ${item.product.name} from cart`}
                      className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 underline focus-ring"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-100 bg-white px-6 py-4 shadow-sm">
        <p className="text-lg font-semibold text-brand-950">
          Total: <span data-testid="cart-total">{formatPrice(total)}</span>
        </p>
        <button type="button" onClick={() => navigate('/checkout')} className="btn-primary">
          Proceed to checkout
        </button>
      </div>
    </>
  );
}
