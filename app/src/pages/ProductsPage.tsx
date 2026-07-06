import ProductGrid from '@/components/ProductGrid';
import products from '@/data/products.json';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types/product';

const catalogue = products as Product[];

export default function ProductsPage() {
  const { addItem } = useCart();

  return (
    <>
      <h1 className="page-heading">Products</h1>
      <p className="page-intro">Browse our demo catalogue and add items to your cart.</p>
      <div className="mt-8">
        <ProductGrid products={catalogue} onAddToCart={addItem} />
      </div>
    </>
  );
}
