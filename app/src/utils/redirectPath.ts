const DEFAULT_REDIRECT = '/products';

const EXACT_REDIRECT_PATHS = new Set([
  '/',
  '/products',
  '/cart',
  '/checkout',
  '/order-confirmation',
  '/login',
]);

function isAllowedRedirectPathname(pathname: string): boolean {
  if (EXACT_REDIRECT_PATHS.has(pathname)) {
    return true;
  }

  // Product detail: /products/:slug (slug is lowercase kebab from catalogue)
  return /^\/products\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname);
}

/**
 * Keep post-login redirects on known same-origin app routes.
 * Invalid or hostile values fall back to /products.
 */
export function sanitizeRedirectPath(redirectPath: string | null): string {
  if (!redirectPath) {
    return DEFAULT_REDIRECT;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(redirectPath.trim());
  } catch {
    return DEFAULT_REDIRECT;
  }

  // Reject backslashes, whitespace, and control characters (open-redirect tricks).
  if (/[\u0000-\u001F\u007F\\\s]/.test(decoded)) {
    return DEFAULT_REDIRECT;
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  let url: URL;
  try {
    url = new URL(decoded, 'https://demo.local');
  } catch {
    return DEFAULT_REDIRECT;
  }

  if (url.origin !== 'https://demo.local') {
    return DEFAULT_REDIRECT;
  }

  // Ignore injected query/hash; only the pathname is used for navigation.
  if (!isAllowedRedirectPathname(url.pathname)) {
    return DEFAULT_REDIRECT;
  }

  return url.pathname;
}
