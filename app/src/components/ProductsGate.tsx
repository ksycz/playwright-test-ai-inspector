import type { ReactNode } from 'react';
import { useProducts } from '@/context/ProductsContext';

interface ProductsGateProps {
  children: ReactNode;
  heading?: string;
}

export default function ProductsGate({
  children,
  heading = 'Products',
}: ProductsGateProps) {
  const { status, errorMessage, reload } = useProducts();

  if (status === 'loading') {
    return (
      <p role="status" className="page-intro">
        Loading products…
      </p>
    );
  }

  if (status === 'error') {
    return (
      <section className="hero-panel" aria-labelledby="products-error-heading">
        <h1 id="products-error-heading" className="page-heading">
          {heading}
        </h1>
        <p className="page-intro" role="alert">
          {errorMessage ?? 'Unable to load products.'}
        </p>
        <button type="button" className="btn-primary mt-6" onClick={reload}>
          Try again
        </button>
      </section>
    );
  }

  return children;
}
