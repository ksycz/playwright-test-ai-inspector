const PRODUCT_IMAGE_PREFIX = '/images/products/';

/**
 * Product images must be same-origin paths under /images/products/<file>.
 * Blocks external tracker URLs and path traversal.
 */
export function isAllowedProductImagePath(image: string): boolean {
  if (typeof image !== 'string' || !image.startsWith(PRODUCT_IMAGE_PREFIX)) {
    return false;
  }

  if (image.includes('..') || image.includes('\\') || image.includes('\0') || /\s/.test(image)) {
    return false;
  }

  const fileName = image.slice(PRODUCT_IMAGE_PREFIX.length);
  if (!fileName || fileName.includes('/')) {
    return false;
  }

  return /^[a-z0-9._-]+\.(svg|png|jpe?g|webp)$/i.test(fileName);
}
