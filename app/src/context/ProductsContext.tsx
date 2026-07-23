import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchProducts } from '@/api/productsApi';
import type { Product } from '@/types/product';

type ProductsStatus = 'loading' | 'ready' | 'error';

interface ProductsContextValue {
  products: Product[];
  status: ProductsStatus;
  errorMessage: string | null;
  reload: () => void;
  getProductBySlug: (slug: string) => Product | undefined;
  getFeaturedProducts: () => Product[];
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<ProductsStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const catalogue = await fetchProducts();
        if (cancelled) {
          return;
        }
        setProducts(catalogue);
        setStatus('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Unable to load products';
        setProducts([]);
        setStatus('error');
        setErrorMessage(message);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const getProductBySlug = useCallback(
    (slug: string) => products.find((product) => product.slug === slug),
    [products],
  );

  const getFeaturedProducts = useCallback(
    () => products.filter((product) => product.featured === true),
    [products],
  );

  const value = useMemo(
    () => ({
      products,
      status,
      errorMessage,
      reload,
      getProductBySlug,
      getFeaturedProducts,
    }),
    [products, status, errorMessage, reload, getProductBySlug, getFeaturedProducts],
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }

  return context;
}
