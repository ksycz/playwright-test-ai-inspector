import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin, type Connect } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `/api/*` contract helpers for the static demo API:
 * - Non-GET methods return JSON 405 (catalogue is read-only)
 * - Missing paths return JSON 404 instead of the SPA index HTML
 */
function apiJsonNotFoundPlugin(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const urlPath = req.url?.split('?')[0] ?? '';
    if (!urlPath.startsWith('/api/')) {
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

    const filePath = path.join(__dirname, 'public', urlPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
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
      '@': path.resolve(__dirname, './src'),
    },
  },
});
