import { handlePublicAdmissionSubmit } from './sofsAdmissions';
import { handleSofsApiRequest, type SofsBackendEnv } from './sofsBackend';

export interface AssetsBinding {
  fetch: (input: Request | string | URL, init?: RequestInit) => Promise<Response>;
}

export interface WorkerSecretStoreBinding {
  get: () => Promise<string>;
}

export type WorkerBindingValue = string | WorkerSecretStoreBinding | undefined;

export interface WorkerEnv {
  ASSETS?: AssetsBinding;
  SUPABASE_URL?: WorkerBindingValue;
  SUPABASE_SERVICE_ROLE_KEY?: WorkerBindingValue;
  GEMINI_API_KEY?: WorkerBindingValue;
  FIREBASE_WEB_API_KEY?: WorkerBindingValue;
  FIREBASE_PROJECT_ID?: WorkerBindingValue;
  [key: string]: unknown;
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

async function readBindingValue(raw: unknown): Promise<string | undefined> {
  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/^["']|["']$/g, '').trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (
    raw &&
    typeof raw === 'object' &&
    'get' in raw &&
    typeof (raw as WorkerSecretStoreBinding).get === 'function'
  ) {
    try {
      const resolved = await (raw as WorkerSecretStoreBinding).get();
      if (typeof resolved === 'string') {
        const cleaned = resolved.trim().replace(/^["']|["']$/g, '').trim();
        if (cleaned.length > 0) return cleaned;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function resolveWorkerEnv(env: WorkerEnv | undefined): Promise<SofsBackendEnv> {
  if (!env || typeof env !== 'object') return {};

  // Access each runtime binding directly by property name on `env` rather than enumerating
  // with Object.entries(env), which can miss non-enumerable/prototype bindings in workerd.
  const [supabaseUrl, serviceRoleKey, geminiApiKey, firebaseWebApiKey, firebaseProjectId] =
    await Promise.all([
      readBindingValue(env.SUPABASE_URL),
      readBindingValue(env.SUPABASE_SERVICE_ROLE_KEY),
      readBindingValue(env.GEMINI_API_KEY),
      readBindingValue(env.FIREBASE_WEB_API_KEY),
      readBindingValue(env.FIREBASE_PROJECT_ID),
    ]);

  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    GEMINI_API_KEY: geminiApiKey,
    FIREBASE_WEB_API_KEY: firebaseWebApiKey,
    FIREBASE_PROJECT_ID: firebaseProjectId,
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv, _ctx?: unknown): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Route all /api/sofs/* requests directly through the Worker backend using runtime env bindings
    if (pathname === '/api/sofs' || pathname.startsWith('/api/sofs/')) {
      try {
        const backendEnv = await resolveWorkerEnv(env);
        const subRoute = pathname.replace(/^\/api\/sofs\/?/, '').replace(/\/+$/, '');
        if (subRoute === 'admissions') {
          return await handlePublicAdmissionSubmit(request, backendEnv);
        }
        return await handleSofsApiRequest(request, backendEnv);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected server error.';
        console.error('[SOFS Worker] Unhandled API route error', {
          method: request.method,
          pathname,
          message,
        });
        return jsonError(message, 500);
      }
    }

    // Any other /api/* route should return JSON 404 instead of falling back to SPA HTML
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: WORKER_JSON_HEADERS });
      }
      if (pathname === '/api/health' && request.method === 'GET') {
        const backendEnv = await resolveWorkerEnv(env);
        return new Response(
          JSON.stringify({
            ok: true,
            runtime: 'cloudflare-worker',
            hasSupabaseUrl: Boolean(backendEnv.SUPABASE_URL),
            hasServiceRoleKey: Boolean(backendEnv.SUPABASE_SERVICE_ROLE_KEY),
          }),
          {
            status: 200,
            headers: WORKER_JSON_HEADERS,
          }
        );
      }
      return jsonError(`Unknown API endpoint: ${pathname}`, 404);
    }

    // Serve Vite static assets + SPA fallback via Cloudflare Worker ASSETS binding
    if (env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Static assets binding (ASSETS) is not configured.', { status: 500 });
  },
};
