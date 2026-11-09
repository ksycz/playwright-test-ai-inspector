import ProductsGate from '@/components/ProductsGate';
import ProductGrid from '@/components/ProductGrid';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import { isSeeded } from '@/seededBugs';

export default function ProductsPage() {
  const { addItem } = useCart();
  const { products } = useProducts();

  return (
    <ProductsGate>
      <h1 className="page-heading">Products</h1>
      <p className="page-intro">Browse our demo catalogue and add items to your cart.</p>
      <div className="mt-8">
        <ProductGrid
          products={isSeeded('audit-catalogue-drops-last') ? products.slice(0, -1) : products}
          onAddToCart={addItem}
        />
      </div>
    </ProductsGate>
  );
}
