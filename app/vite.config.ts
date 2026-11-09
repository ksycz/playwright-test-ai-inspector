import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin, type Connect } from 'vite';
import react from '@vitejs/plugin-react';
import { isApiRequestPath, resolveApiPublicFile } from './apiPublicPath.ts';

/**
 * `/api/*` contract helpers for the static demo API:
 * - Non-GET methods return JSON 405 (catalogue is read-only)
 * - Missing paths return JSON 404 instead of the SPA index HTML
 * - Paths that escape `public/` (e.g. `/api/../../package.json`) stay JSON 404
 */
function apiJsonNotFoundPlugin(): Plugin {
  const publicRoot = path.resolve(import.meta.dirname, 'public');

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const urlPath = req.url?.split('?')[0] ?? '';
    if (!isApiRequestPath(urlPath)) {
      next();
      return;
    }

    const method = (req.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Allow', 'GET, HEAD');
      res.end(JSON.stringify({ error: 'Method not allowed', path: urlPath, method }));
      return;
    }

    const filePath = resolveApiPublicFile(publicRoot, urlPath);
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      next();
      return;
    }

    // Seeded bug audit-api-404-html (dev server only): a missing API path falls through to the SPA page.
    if (process.env.VITE_SEEDED_BUGS?.split(',').some((name) => ['audit-api-404-html', 'audit-all'].includes(name.trim()))) {
      next();
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Not found', path: urlPath }));
  };

  return {
    name: 'api-json-not-found',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), apiJsonNotFoundPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
