import path from 'node:path';

/**
 * Resolve `relativePath` under `root`, or return null if it escapes the root.
 */
export function resolvePathInsideRoot(root: string, relativePath: string): string | null {
  if (!relativePath || relativePath.includes('\0')) {
    return null;
  }

  if (path.isAbsolute(relativePath)) {
    return null;
  }

  const normalizedRelative = relativePath.replace(/\\/g, '/');
  if (normalizedRelative.split('/').includes('..')) {
    return null;
  }

  const rootResolved = path.resolve(root);
  const candidate = path.resolve(rootResolved, normalizedRelative);
  const rootWithSep = rootResolved.endsWith(path.sep) ? rootResolved : `${rootResolved}${path.sep}`;

  if (candidate !== rootResolved && !candidate.startsWith(rootWithSep)) {
    return null;
  }

  return candidate;
}
