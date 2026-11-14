export interface ResellHatPagesEnv {
  RESSELLHAT_API_KEY?: string;
  RESELLHAT_API_KEY?: string;
  FIREBASE_WEB_API_KEY?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_DATABASE_ID?: string;
  [key: string]: string | undefined;
}

interface PagesContext {
  request: Request;
  env: ResellHatPagesEnv;
}

const AUTHORIZED_ADMIN_EMAIL = 'bdtaseengaming@gmail.com';
const RESELLHAT_TEST_URL = 'https://resellhat.com/api/v1/products?per_page=1&page=1';
const UPSTREAM_TIMEOUT_MS = 20000;

const DEFAULT_FIREBASE_WEB_API_KEY = 'AIzaSyA3Gj_VVly7_6DToQlXkLofmN_bKH8SDk4';
const DEFAULT_FIREBASE_PROJECT_ID = 'tastehub-16c49';
const DEFAULT_FIREBASE_DATABASE_ID =
  'ai-studio-tastehubrestaura-3695d266-0af0-4fbc-92e0-8a7cb0eea600';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Accept, Content-Type',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(body: Record<string, unknown>, httpStatus = 200): Response {
  const success =
    typeof body.success === 'boolean' ? body.success : httpStatus >= 200 && httpStatus < 300;
  const payload: Record<string, unknown> = {
    success,
    status: typeof body.status === 'number' ? body.status : httpStatus,
    message: typeof body.message === 'string' ? body.message : '',
    data: body.data !== undefined ? body.data : null,
    ...body,
  };

  return new Response(JSON.stringify(payload), {
    status: httpStatus,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
    },
  });
}

function getResellHatApiKey(env: ResellHatPagesEnv): string {
  const candidates = [env?.RESSELLHAT_API_KEY, env?.RESELLHAT_API_KEY];
  for (const candidate of candidates) {
    const trimmed = (candidate || '').trim();
    if (
      trimmed &&
      trimmed !== 'YOUR_RESELLHAT_API_KEY' &&
      trimmed !== 'YOUR_RESSELLHAT_API_KEY'
    ) {
      return trimmed;
    }
  }
  return '';
}

async function verifyAdminRequest(
  request: Request,
  env: ResellHatPagesEnv
): Promise<{ ok: true; email: string } | { ok: false; response: Response }> {
  const authHeader =
    request.headers.get('authorization') || request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      response: jsonResponse(
        {
          success: false,
          ok: false,
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Missing Firebase authentication token. Please sign in as an administrator.',
          data: null,
        },
        401
      ),
    };
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken || idToken.length > 8192) {
    return {
      ok: false,
      response: jsonResponse(
        {
          success: false,
          ok: false,
          status: 401,
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token.',
          data: null,
        },
        401
      ),
    };
  }

  const firebaseApiKey = (env?.FIREBASE_WEB_API_KEY || DEFAULT_FIREBASE_WEB_API_KEY).trim();
  const projectId = (env?.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID).trim();
  const databaseId = (env?.FIREBASE_DATABASE_ID || DEFAULT_FIREBASE_DATABASE_ID).trim();

  let uid = '';
  let email = '';
  let emailVerified = false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        firebaseApiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (!verifyRes.ok) {
      return {
        ok: false,
        response: jsonResponse(
          {
            success: false,
            ok: false,
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Session expired or invalid Firebase ID token. Please sign in again.',
            data: null,
          },
          401
        ),
      };
    }

    const lookupData = (await verifyRes.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
    };
    const user = lookupData.users?.[0];
    if (!user?.localId) {
      return {
        ok: false,
        response: jsonResponse(
          {
            success: false,
            ok: false,
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Could not verify Firebase user account.',
            data: null,
          },
          401
        ),
      };
    }
    uid = user.localId;
    email = user.email || '';
    emailVerified = Boolean(user.emailVerified);
  } catch {
    return {
      ok: false,
      response: jsonResponse(
        {
          success: false,
          ok: false,
          status: 502,
          code: 'AUTH_UPSTREAM_ERROR',
          message: 'Failed to verify Firebase session.',
          data: null,
        },
        502
      ),
    };
  }

  if (email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL && emailVerified) {
    return { ok: true, email };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const adminDocRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        projectId
      )}/databases/${encodeURIComponent(databaseId)}/documents/admins/${encodeURIComponent(uid)}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (adminDocRes.ok) {
      return { ok: true, email };
    }
  } catch {
    // deny below
  }

  return {
    ok: false,
    response: jsonResponse(
      {
        success: false,
        ok: false,
        status: 403,
        code: 'FORBIDDEN',
        message: 'Administrator privileges are required to access supplier integrations.',
        data: null,
      },
      403
    ),
  };
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  const authCheck = await verifyAdminRequest(request, env);
  if (!authCheck.ok) {
    return authCheck.response;
  }

  const apiKey = getResellHatApiKey(env);
  if (!apiKey) {
    return jsonResponse(
      {
        success: false,
        ok: false,
        connected: false,
        status: 503,
        code: 'MISSING_API_KEY',
        message:
          'Server secret RESSELLHAT_API_KEY is not configured. Add RESSELLHAT_API_KEY in Cloudflare Pages → Settings → Variables and Secrets and redeploy.',
        data: null,
      },
      503
    );
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const res = await fetch(RESELLHAT_TEST_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const latencyMs = Date.now() - startedAt;
    const rawText = await res.text();

    let parsedJson: unknown = null;
    try {
      parsedJson = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsedJson = null;
    }

    const parsedObj =
      parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)
        ? (parsedJson as Record<string, unknown>)
        : null;

    const safeUpstreamDetail =
      parsedObj && typeof (parsedObj.message ?? parsedObj.error) === 'string'
        ? String(parsedObj.message ?? parsedObj.error)
            .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
            .slice(0, 180)
        : '';

    if (res.status === 401 || res.status === 403) {
      return jsonResponse(
        {
          success: false,
          ok: false,
          connected: false,
          status: res.status,
          upstreamStatus: res.status,
          code: 'UPSTREAM_AUTH_FAILED',
          message: `ResellHat rejected the server API key (Supplier HTTP ${res.status})${
            safeUpstreamDetail ? `: ${safeUpstreamDetail}` : ''
          }. Verify RESSELLHAT_API_KEY in Cloudflare Pages environment secrets.`,
          data: null,
        },
        502
      );
    }

    if (res.status === 429) {
      return jsonResponse(
        {
          success: false,
          ok: false,
          connected: false,
          status: res.status,
          upstreamStatus: res.status,
          code: 'RATE_LIMITED',
          message:
            'ResellHat API rate limit reached (Supplier HTTP 429). Please pause briefly and try again.',
          data: null,
        },
        429
      );
    }

    if (!res.ok) {
      return jsonResponse(
        {
          success: false,
          ok: false,
          connected: false,
          status: res.status,
          upstreamStatus: res.status,
          code: 'UPSTREAM_HTTP_ERROR',
          message: `ResellHat API returned HTTP ${res.status}${
            safeUpstreamDetail ? `: ${safeUpstreamDetail}` : '.'
          }`,
          data: null,
        },
        502
      );
    }

    if (!parsedObj) {
      return jsonResponse(
        {
          success: false,
          ok: false,
          connected: false,
          status: res.status,
          upstreamStatus: res.status,
          code: 'INVALID_UPSTREAM_JSON',
          message: `ResellHat returned HTTP ${res.status} with non-JSON content instead of the expected JSON response.`,
          data: null,
        },
        502
      );
    }

    if (!Array.isArray(parsedObj.data)) {
      return jsonResponse(
        {
          success: false,
          ok: false,
          connected: false,
          status: res.status,
          upstreamStatus: res.status,
          code: 'INVALID_UPSTREAM_PAYLOAD',
          message: `ResellHat returned HTTP ${res.status}, but the JSON response did not contain a valid "data" array.`,
          data: null,
        },
        502
      );
    }

    const rawMeta =
      parsedObj.meta && typeof parsedObj.meta === 'object' && !Array.isArray(parsedObj.meta)
        ? (parsedObj.meta as Record<string, unknown>)
        : null;

    if (
      !rawMeta ||
      rawMeta.last_page === undefined ||
      rawMeta.last_page === null ||
      !Number.isFinite(Number(rawMeta.last_page))
    ) {
      return jsonResponse(
        {
          success: false,
          ok: false,
          connected: false,
          status: res.status,
          upstreamStatus: res.status,
          code: 'INVALID_UPSTREAM_PAYLOAD',
          message: `ResellHat returned HTTP ${res.status} with a "data" array, but was missing the expected "meta.last_page" field.`,
          data: null,
        },
        502
      );
    }

    const currentPage = Math.max(1, Number(rawMeta.current_page || 1) || 1);
    const lastPage = Math.max(currentPage, Number(rawMeta.last_page || 1) || 1);
    const total = Math.max(
      parsedObj.data.length,
      Number(rawMeta.total || parsedObj.data.length) || 0
    );
    const perPage = Math.min(500, Math.max(1, Number(rawMeta.per_page || 1) || 1));

    return jsonResponse(
      {
        success: true,
        ok: true,
        connected: true,
        status: res.status,
        upstreamStatus: res.status,
        supplier: 'ResellHat',
        latencyMs,
        totalProducts: total,
        lastPage,
        testedBy: authCheck.email,
        testedAt: new Date().toISOString(),
        message: `Connected cleanly to ResellHat API (HTTP ${res.status}, ${latencyMs}ms).`,
        data: {
          data: parsedObj.data,
          meta: {
            current_page: currentPage,
            last_page: lastPage,
            per_page: perPage,
            total,
          },
        },
      },
      200
    );
  } catch (err: unknown) {
    clearTimeout(timer);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return jsonResponse(
      {
        success: false,
        ok: false,
        connected: false,
        status: isAbort ? 504 : 502,
        code: isAbort ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_NETWORK_ERROR',
        message: isAbort
          ? 'ResellHat API timed out after 20 seconds.'
          : 'Unable to reach ResellHat API from Cloudflare Pages Function.',
        data: null,
      },
      isAbort ? 504 : 502
    );
  }
}

export async function onRequest(): Promise<Response> {
  return jsonResponse(
    {
      success: false,
      ok: false,
      status: 405,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed. Use GET.',
      data: null,
    },
    405
  );
}
