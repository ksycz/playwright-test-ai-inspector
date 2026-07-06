import ProductImage from '@/components/ProductImage';
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
      className="surface-card flex flex-col"
    >
      <ProductImage src={product.image} alt={product.name} className="mb-4 h-40" />
      <h2 id={titleId} className="text-lg font-semibold text-brand-950">
        <Link to={`/products/${product.slug}`} className="text-link no-underline hover:underline">
          {product.name}
        </Link>
      </h2>
      <p className="mt-2">
        <span className="category-badge">{product.category}</span>
      </p>
      <p className="mt-2 flex-1 text-sm text-slate-600">{product.shortDescription}</p>
      <p className="price-text mt-4">{formatPrice(product.price)}</p>
      <button
        type="button"
        onClick={() => onAddToCart(product)}
        className="btn-primary mt-4 w-full sm:w-auto"
      >
        Add {product.name} to cart
      </button>
    </article>
  );
}
