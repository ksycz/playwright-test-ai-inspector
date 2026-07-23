import ProductsGate from '@/components/ProductsGate';
import ProductGrid from '@/components/ProductGrid';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';

export default function ProductsPage() {
  const { addItem } = useCart();
  const { products } = useProducts();

  return (
    <ProductsGate>
      <h1 className="page-heading">Products</h1>
      <p className="page-intro">Browse our demo catalogue and add items to your cart.</p>
      <div className="mt-8">
        <ProductGrid products={products} onAddToCart={addItem} />
      </div>
    </ProductsGate>
  );
}
