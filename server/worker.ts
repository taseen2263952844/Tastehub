import { handlePublicAdmissionSubmit } from './sofsAdmissions';
import { handleSofsApiRequest, type SofsBackendEnv } from './sofsBackend';

export interface AssetsBinding {
  fetch: (input: Request | string | URL, init?: RequestInit) => Promise<Response>;
}

export interface WorkerEnv {
  ASSETS?: AssetsBinding;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GEMINI_API_KEY?: string;
  FIREBASE_WEB_API_KEY?: string;
  VITE_FIREBASE_API_KEY?: string;
  FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
}

const WORKER_JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, status, message }), {
    status,
    headers: WORKER_JSON_HEADERS,
  });
}

function toBackendEnv(env: WorkerEnv): SofsBackendEnv {
  return {
    SUPABASE_URL: env.SUPABASE_URL,
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    FIREBASE_WEB_API_KEY: env.FIREBASE_WEB_API_KEY,
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY,
    FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID,
    VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID,
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Normalize /api/sofs routes cleanly through the SOFS backend router
    if (pathname === '/api/sofs' || pathname.startsWith('/api/sofs/')) {
      try {
        const backendEnv = toBackendEnv(env);
        const subRoute = pathname.replace(/^\/api\/sofs\/?/, '').replace(/\/+$/, '');
        if (subRoute === 'admissions') {
          return await handlePublicAdmissionSubmit(request, backendEnv);
        }
        return await handleSofsApiRequest(request, backendEnv);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected server error.';
        return jsonError(message, 500);
      }
    }

    // Any other /api/* route should return JSON 404 instead of falling back to SPA HTML
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: WORKER_JSON_HEADERS });
      }
      if (pathname === '/api/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ ok: true, runtime: 'cloudflare-worker' }), {
          status: 200,
          headers: WORKER_JSON_HEADERS,
        });
      }
      return jsonError(`Unknown API endpoint: ${pathname}`, 404);
    }

    // Serve Vite static assets + SPA fallback via Cloudflare Worker ASSETS binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Static assets binding (ASSETS) is not configured.', { status: 500 });
  },
};
