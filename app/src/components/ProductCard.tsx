import { Link } from 'react-router-dom';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/products';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const titleId = `product-${product.slug}-title`;

  return (
    <article
      aria-labelledby={titleId}
      data-testid={`product-card-${product.slug}`}
      className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <img
        src={product.image}
        alt={product.name}
        className="mb-4 h-40 w-full rounded-md bg-slate-100 object-cover"
      />
      <h2 id={titleId} className="text-lg font-semibold text-slate-900">
        <Link
          to={`/products/${product.slug}`}
          className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          {product.name}
        </Link>
      </h2>
      <p className="mt-1 text-sm font-medium text-slate-500">{product.category}</p>
      <p className="mt-2 flex-1 text-sm text-slate-600">{product.shortDescription}</p>
      <p className="mt-4 text-base font-semibold text-slate-900">{formatPrice(product.price)}</p>
      <button
        type="button"
        onClick={() => onAddToCart(product)}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:w-auto"
      >
        Add {product.name} to cart
      </button>
    </article>
  );
}
