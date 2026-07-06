import { useSearchParams } from 'react-router-dom';
import ProductGrid from '@/components/ProductGrid';
import { useCart } from '@/context/CartContext';
import { getFeaturedProducts } from '@/utils/products';

export default function HomePage() {
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  const forceEmptyFeatured = searchParams.get('featured') === 'none';
  const featuredProducts = forceEmptyFeatured ? [] : getFeaturedProducts();

  return (
    <>
      <h1 className="text-3xl font-semibold">Welcome to Demo Shop</h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        A simple demo e-commerce app for learning Playwright and test automation. Browse featured
        products below or explore the full catalogue.
      </p>

      <section aria-labelledby="featured-products-heading" className="mt-10">
        <h2 id="featured-products-heading" className="text-2xl font-semibold text-slate-900">
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
    </>
  );
}
