import path from 'node:path';

/**
 * Resolve a request URL to a file under `publicRoot` for `/api` static JSON.
 * Returns null when the path is outside `/api`, escapes `publicRoot`, or is malformed.
 */
export function resolveApiPublicFile(
  publicRoot: string,
  rawUrlPath: string,
): string | null {
  let urlPath = rawUrlPath.split('?')[0] ?? '';

  try {
    urlPath = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  if (urlPath !== '/api' && !urlPath.startsWith('/api/')) {
    return null;
  }

  const relative = urlPath.slice(1); // "api" or "api/..."
  if (relative.includes('\0')) {
    return null;
  }

  const root = path.resolve(publicRoot);
  const apiRoot = path.resolve(root, 'api');
  const candidate = path.resolve(root, relative);
  const apiRootWithSep = apiRoot.endsWith(path.sep) ? apiRoot : `${apiRoot}${path.sep}`;

  // Only files under public/api/ are part of the static API contract.
  if (candidate !== apiRoot && !candidate.startsWith(apiRootWithSep)) {
    return null;
  }

  return candidate;
}

export function isApiRequestPath(urlPath: string): boolean {
  const pathOnly = urlPath.split('?')[0] ?? '';
  return pathOnly === '/api' || pathOnly.startsWith('/api/');
}
