import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import {
  handleResellHatProducts,
  handleResellHatTestConnection,
  type ProxyEnv,
} from './server/resellhatProxy';

async function nodeToWebRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host || 'localhost:3000';
  const url = new URL(req.url || '/', `http://${host}`);
  const headers = new Headers();
  Object.entries(req.headers).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((val) => headers.append(k, val));
    else if (typeof v === 'string') headers.set(k, v);
  });

  const method = req.method || 'GET';
  let body: BodyInit | undefined = undefined;
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length > 0) {
      body = Buffer.concat(chunks);
    }
  }

  return new Request(url.toString(), { method, headers, body });
}

async function sendWebResponse(webRes: Response, res: ServerResponse): Promise<void> {
  res.statusCode = webRes.status;
  webRes.headers.forEach((val, key) => {
    res.setHeader(key, val);
  });
  const text = await webRes.text();
  res.end(text);
}

function resellHatDevProxyPlugin(proxyEnv: ProxyEnv): Plugin {
  const attachProxyMiddleware = (middlewares: {
    use: (
      route: string,
      handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void | Promise<void>
    ) => void;
  }) => {
    middlewares.use('/api/suppliers/resellhat', async (req, res, next) => {
      const pathOnly = (req.url || '').split('?')[0];
      if (pathOnly !== '/test' && pathOnly !== '/products') {
        return next();
      }
      try {
        req.url = `/api/suppliers/resellhat${req.url || ''}`;
        const webReq = await nodeToWebRequest(req);
        const runtimeEnv: ProxyEnv = {
          ...proxyEnv,
          ...process.env,
        };
        const webRes =
          pathOnly === '/test'
            ? await handleResellHatTestConnection(webReq, runtimeEnv)
            : await handleResellHatProducts(webReq, runtimeEnv);
        await sendWebResponse(webRes, res);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: false,
            ok: false,
            status: 500,
            message: err instanceof Error ? err.message : 'Internal proxy error',
            data: null,
          })
        );
      }
    });
  };

  return {
    name: 'resellhat-server-proxy',
    configureServer(server) {
      attachProxyMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachProxyMiddleware(server.middlewares);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), resellHatDevProxyPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
