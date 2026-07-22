import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin, type Connect } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Missing `/api/*` paths should return JSON 404 instead of the SPA index HTML.
 * That keeps Playwright API assertions honest for unknown resources.
 */
function apiJsonNotFoundPlugin(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const urlPath = req.url?.split('?')[0] ?? '';
    if (!urlPath.startsWith('/api/')) {
      next();
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
