import ProductGrid from '@/components/ProductGrid';
import products from '@/data/products.json';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types/product';

const catalogue = products as Product[];

export default function ProductsPage() {
  const { addItem } = useCart();

  return (
    <>
      <h1 className="text-3xl font-semibold">Products</h1>
      <p className="mt-4 text-slate-600">Browse our demo catalogue and add items to your cart.</p>
      <div className="mt-8">
        <ProductGrid products={catalogue} onAddToCart={addItem} />
      </div>
    </>
  );
}
