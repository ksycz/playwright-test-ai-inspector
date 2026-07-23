import { useSearchParams } from 'react-router-dom';
import ProductsGate from '@/components/ProductsGate';
import ProductGrid from '@/components/ProductGrid';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';

export default function HomePage() {
  const { addItem } = useCart();
  const { getFeaturedProducts } = useProducts();
  const [searchParams] = useSearchParams();
  const forceEmptyFeatured = searchParams.get('featured') === 'none';
  const featuredProducts = forceEmptyFeatured ? [] : getFeaturedProducts();

  return (
    <ProductsGate heading="Welcome to Demo Shop">
      <section className="hero-panel">
        <h1 className="page-heading">Welcome to Demo Shop</h1>
        <p className="page-intro max-w-2xl">
          A simple demo e-commerce app for learning Playwright and test automation. Browse featured
          products below or explore the full catalogue.
        </p>
      </section>

      <section aria-labelledby="featured-products-heading" className="mt-10">
        <h2 id="featured-products-heading" className="section-heading">
          Featured products
        </h2>

        {featuredProducts.length === 0 ? (
          <p className="mt-4 text-slate-600">No featured products at the moment.</p>
        ) : (
          <div className="mt-6">
            <ProductGrid products={featuredProducts} onAddToCart={addItem} />
          </div>
        )}
      </section>
    </ProductsGate>
  );
}
