import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { handleSofsApiRequest, type SofsBackendEnv } from './server/sofsBackend';

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

function sofsDevBackendPlugin(loadedEnv: SofsBackendEnv): Plugin {
  const attachMiddleware = (middlewares: {
    use: (
      route: string,
      handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void | Promise<void>
    ) => void;
  }) => {
    middlewares.use('/api/sofs', async (req, res) => {
      try {
        req.url = `/api/sofs${req.url || ''}`;
        const webReq = await nodeToWebRequest(req);
        const mergedEnv = { ...loadedEnv, ...process.env } as Record<string, string | undefined>;
        const runtimeEnv: SofsBackendEnv = {
          SUPABASE_URL: mergedEnv.SUPABASE_URL || mergedEnv.VITE_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: mergedEnv.SUPABASE_SERVICE_ROLE_KEY,
          GEMINI_API_KEY: mergedEnv.GEMINI_API_KEY,
          FIREBASE_WEB_API_KEY: mergedEnv.FIREBASE_WEB_API_KEY || mergedEnv.VITE_FIREBASE_API_KEY,
          FIREBASE_PROJECT_ID: mergedEnv.FIREBASE_PROJECT_ID || mergedEnv.VITE_FIREBASE_PROJECT_ID,
        };
        const webRes = await handleSofsApiRequest(webReq, runtimeEnv);
        await sendWebResponse(webRes, res);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            ok: false,
            status: 500,
            message: err instanceof Error ? err.message : 'SOFS backend error',
          })
        );
      }
    });
  };

  return {
    name: 'sofs-api-middleware',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), sofsDevBackendPlugin(env)],
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
