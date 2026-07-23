import ProductImage from '@/components/ProductImage';
import ProductsGate from '@/components/ProductsGate';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import { formatPrice } from '@/utils/products';

export default function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { addItem } = useCart();
  const { getProductBySlug } = useProducts();
  const product = getProductBySlug(slug);

  return (
    <ProductsGate heading="Product details">
      {!product ? (
        <section className="hero-panel">
          <h1 className="page-heading">Product not found</h1>
          <p className="page-intro">We could not find a product matching that link.</p>
          <p className="mt-6">
            <Link to="/products" className="text-link px-3 py-2 text-sm">
              Back to products
            </Link>
          </p>
        </section>
      ) : (
        <>
          <p>
            <Link to="/products" className="text-link text-sm">
              Back to products
            </Link>
          </p>
          <div className="surface-card mt-6 grid gap-8 p-6 md:grid-cols-2">
            <ProductImage src={product.image} alt={product.name} className="h-80" />
            <div>
              <h1 className="page-heading">{product.name}</h1>
              <p className="mt-2">
                <span className="category-badge">{product.category}</span>
              </p>
              <p className="mt-4 text-2xl font-semibold text-brand-700">{formatPrice(product.price)}</p>
              <p className="mt-6 text-slate-600">{product.fullDescription}</p>
              <button type="button" onClick={() => addItem(product)} className="btn-primary mt-8">
                Add {product.name} to cart
              </button>
            </div>
          </div>
        </>
      )}
    </ProductsGate>
  );
}
