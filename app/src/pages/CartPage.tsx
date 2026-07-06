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
      <>
        <h1 className="text-3xl font-semibold">Shopping cart</h1>
        <h2 className="mt-6 text-xl font-medium text-slate-900">Your cart is empty</h2>
        <p className="mt-2 text-slate-600">Add products from the catalogue to get started.</p>
        <p className="mt-6">
          <Link
            to="/products"
            className="rounded px-3 py-2 text-sm font-medium text-slate-900 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Browse products
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Shopping cart</h1>
        <button
          type="button"
          onClick={clearCart}
          className="inline-flex min-h-11 items-center rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Clear cart
        </button>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">Shopping cart items</caption>
          <thead>
            <tr className="border-b border-slate-200">
              <th scope="col" className="px-3 py-3 font-semibold text-slate-900">
                Product
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-slate-900">
                Quantity
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-slate-900">
                Subtotal
              </th>
              <th scope="col" className="px-3 py-3 font-semibold text-slate-900">
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
                  className="border-b border-slate-100"
                >
                  <td className="px-3 py-4 font-medium text-slate-900">{item.product.name}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.product.slug)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
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
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-slate-900">{formatPrice(lineSubtotal)}</td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.slug)}
                      aria-label={`Remove ${item.product.name} from cart`}
                      className="inline-flex min-h-11 items-center text-sm font-medium text-slate-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
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

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
        <p className="text-lg font-semibold text-slate-900">
          Total: <span data-testid="cart-total">{formatPrice(total)}</span>
        </p>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="inline-flex min-h-11 items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Proceed to checkout
        </button>
      </div>
    </>
  );
}
