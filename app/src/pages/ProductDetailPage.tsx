import { Link, useParams } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { formatPrice, getProductBySlug } from '@/utils/products';

export default function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { addItem } = useCart();
  const product = getProductBySlug(slug);

  if (!product) {
    return (
      <>
        <h1 className="text-3xl font-semibold">Product not found</h1>
        <p className="mt-4 text-slate-600">
          We could not find a product matching that link.
        </p>
        <p className="mt-6">
          <Link
            to="/products"
            className="rounded px-3 py-2 text-sm font-medium text-slate-900 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Back to products
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        <Link
          to="/products"
          className="text-sm font-medium text-slate-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Back to products
        </Link>
      </p>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <img
          src={product.image}
          alt={product.name}
          className="h-80 w-full rounded-lg bg-slate-100 object-cover"
        />
        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">{product.category}</p>
          <p className="mt-4 text-2xl font-semibold text-slate-900">{formatPrice(product.price)}</p>
          <p className="mt-6 text-slate-600">{product.fullDescription}</p>
          <button
            type="button"
            onClick={() => addItem(product)}
            className="mt-8 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Add {product.name} to cart
          </button>
        </div>
      </div>
    </>
  );
}
