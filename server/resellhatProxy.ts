import firebaseAppletConfig from '../firebase-applet-config.json';

export type ProxyEnv = Record<string, string | undefined>;

export interface NormalizedSupplierProduct {
  supplierProductId: string;
  name: string;
  description: string;
  shortDescription: string;
  supplierPrice: number;
  compareAtPrice?: number;
  category: string;
  images: string[];
  stock: number | null;
  availability: string;
  sku: string;
}

export interface ResellHatProductsProxyResult {
  ok: boolean;
  supplier: 'ResellHat';
  data: NormalizedSupplierProduct[];
  categories: string[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const AUTHORIZED_ADMIN_EMAIL = 'bdtaseengaming@gmail.com';
const RESELLHAT_BASE_URL = 'https://resellhat.com/api/v1/products';
const UPSTREAM_TIMEOUT_MS = 20000;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Accept, Content-Type',
  'Access-Control-Max-Age': '86400',
};

export function corsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'no-store',
    },
  });
}

export function jsonResponse(body: Record<string, unknown>, httpStatus = 200): Response {
  const success =
    typeof body.success === 'boolean'
      ? body.success
      : typeof body.ok === 'boolean'
      ? body.ok
      : httpStatus >= 200 && httpStatus < 300;
  const normalizedBody: Record<string, unknown> = {
    success,
    status: typeof body.status === 'number' ? body.status : httpStatus,
    message: typeof body.message === 'string' ? body.message : '',
    data: body.data !== undefined ? body.data : null,
    ...body,
  };
  return new Response(JSON.stringify(normalizedBody), {
    status: httpStatus,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
    },
  });
}

function getResellHatApiKey(env: ProxyEnv): string {
  const candidates = [
    env.RESSELLHAT_API_KEY,
    env['RESSELL' + 'HAT_API_KEY'],
    env.RESELLHAT_API_KEY,
  ];
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

interface VerifiedAdminUser {
  uid: string;
  email: string;
}

export async function verifyAdminRequest(
  request: Request,
  env: ProxyEnv
): Promise<{ ok: true; user: VerifiedAdminUser } | { ok: false; response: Response }> {
  const authHeader =
    request.headers.get('authorization') || request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: 'Missing Firebase authentication token. Please sign in as an administrator.',
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
        { ok: false, code: 'INVALID_TOKEN', message: 'Invalid authentication token.' },
        401
      ),
    };
  }

  const apiKey = (env.FIREBASE_WEB_API_KEY || firebaseAppletConfig.apiKey || '').trim();
  const projectId = (env.FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || '').trim();
  const databaseId = (
    env.FIREBASE_DATABASE_ID ||
    firebaseAppletConfig.firestoreDatabaseId ||
    '(default)'
  ).trim();

  if (!apiKey || !projectId) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          code: 'AUTH_CONFIG_ERROR',
          message: 'Server Firebase configuration is incomplete.',
        },
        500
      ),
    };
  }

  let uid = '';
  let email = '';
  let emailVerified = false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
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
            ok: false,
            code: 'UNAUTHORIZED',
            message: 'Session expired or invalid Firebase ID token. Please sign in again.',
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
          { ok: false, code: 'UNAUTHORIZED', message: 'Could not verify Firebase user account.' },
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
        { ok: false, code: 'AUTH_UPSTREAM_ERROR', message: 'Failed to verify Firebase session.' },
        502
      ),
    };
  }

  if (email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL && emailVerified) {
    return { ok: true, user: { uid, email } };
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
      return { ok: true, user: { uid, email } };
    }
  } catch {
    // deny below
  }

  return {
    ok: false,
    response: jsonResponse(
      {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Administrator privileges are required to access supplier integrations.',
      },
      403
    ),
  };
}

function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumericPrice(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.max(0, val);
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.]/g, '');
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  return 0;
}

function extractImages(raw: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const pushUrl = (candidate: unknown) => {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        if (!urls.includes(trimmed)) urls.push(trimmed);
      }
    } else if (candidate && typeof candidate === 'object') {
      const obj = candidate as Record<string, unknown>;
      pushUrl(obj.url || obj.src || obj.image || obj.original || obj.path);
    }
  };

  if (Array.isArray(raw.images)) raw.images.forEach(pushUrl);
  if (Array.isArray(raw.gallery)) raw.gallery.forEach(pushUrl);
  pushUrl(raw.image);
  pushUrl(raw.image_url);
  pushUrl(raw.thumbnail);
  pushUrl(raw.featured_image);
  pushUrl(raw.photo);

  return urls.slice(0, 12);
}

function extractCategoryName(raw: Record<string, unknown>): string {
  if (typeof raw.category === 'string' && raw.category.trim()) return raw.category.trim();
  if (raw.category && typeof raw.category === 'object') {
    const c = raw.category as Record<string, unknown>;
    if (typeof c.name === 'string' && c.name.trim()) return c.name.trim();
    if (typeof c.title === 'string' && c.title.trim()) return c.title.trim();
  }
  if (typeof raw.category_name === 'string' && raw.category_name.trim()) {
    return raw.category_name.trim();
  }
  if (Array.isArray(raw.categories) && raw.categories.length > 0) {
    const first = raw.categories[0];
    if (typeof first === 'string') return first.trim();
    if (first && typeof first === 'object') {
      const c = first as Record<string, unknown>;
      if (typeof c.name === 'string') return c.name.trim();
    }
  }
  return 'Uncategorized';
}

function extractStock(raw: Record<string, unknown>): { stock: number | null; availability: string } {
  const candidates = [raw.stock, raw.quantity, raw.qty, raw.available_stock, raw.inventory];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) {
      const s = Math.max(0, Math.floor(c));
      return { stock: s, availability: s > 0 ? `In Stock (${s})` : 'Out of Stock' };
    }
    if (typeof c === 'string' && c.trim() !== '' && !Number.isNaN(Number(c))) {
      const s = Math.max(0, Math.floor(Number(c)));
      return { stock: s, availability: s > 0 ? `In Stock (${s})` : 'Out of Stock' };
    }
  }
  if (typeof raw.in_stock === 'boolean') {
    return {
      stock: raw.in_stock ? 25 : 0,
      availability: raw.in_stock ? 'In Stock' : 'Out of Stock',
    };
  }
  if (typeof raw.availability === 'string' && raw.availability.trim()) {
    const lower = raw.availability.toLowerCase();
    const out = lower.includes('out');
    return { stock: out ? 0 : null, availability: raw.availability.trim() };
  }
  if (typeof raw.status === 'string' && raw.status.trim()) {
    const lower = raw.status.toLowerCase();
    if (lower.includes('out') || lower === 'inactive' || lower === 'unavailable') {
      return { stock: 0, availability: raw.status.trim() };
    }
  }
  return { stock: null, availability: 'Available' };
}

export function normalizeResellHatProduct(item: unknown): NormalizedSupplierProduct | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;

  const rawId = raw.id ?? raw.product_id ?? raw.sku ?? raw.slug;
  if (rawId === undefined || rawId === null || String(rawId).trim() === '') return null;
  const supplierProductId = String(rawId).trim();

  const rawName = String(raw.name ?? raw.title ?? raw.product_name ?? '').trim();
  if (!rawName) return null;

  const rawDesc = String(
    raw.description ?? raw.details ?? raw.long_description ?? raw.short_description ?? rawName
  );
  const cleanDesc = stripHtmlTags(rawDesc) || rawName;
  const rawShort = raw.short_description
    ? stripHtmlTags(String(raw.short_description))
    : cleanDesc;

  const supplierPrice =
    parseNumericPrice(raw.reseller_price) ||
    parseNumericPrice(raw.wholesale_price) ||
    parseNumericPrice(raw.price) ||
    parseNumericPrice(raw.selling_price) ||
    parseNumericPrice(raw.unit_price) ||
    parseNumericPrice(raw.sale_price);

  const retailOrMrp =
    parseNumericPrice(raw.regular_price) ||
    parseNumericPrice(raw.mrp) ||
    parseNumericPrice(raw.compare_at_price) ||
    parseNumericPrice(raw.suggested_price);

  const { stock, availability } = extractStock(raw);

  return {
    supplierProductId,
    name: rawName.slice(0, 140),
    description: cleanDesc.slice(0, 4000),
    shortDescription: rawShort.slice(0, 320),
    supplierPrice,
    compareAtPrice: retailOrMrp > supplierPrice ? retailOrMrp : undefined,
    category: extractCategoryName(raw).slice(0, 80),
    images: extractImages(raw),
    stock,
    availability,
    sku: String(raw.sku || raw.code || `RH-${supplierProductId}`).trim().slice(0, 64),
  };
}

async function fetchResellHatUpstream(
  apiKey: string,
  params: { page: number; perPage: number; category?: string }
): Promise<
  | {
      ok: true;
      upstreamStatus: number;
      payload: ResellHatProductsProxyResult;
      latencyMs: number;
    }
  | {
      ok: false;
      response: Response;
    }
> {
  const url = new URL(RESELLHAT_BASE_URL);
  url.searchParams.set('per_page', String(params.perPage));
  url.searchParams.set('page', String(params.page));
  if (params.category && params.category.toLowerCase() !== 'all') {
    url.searchParams.set('category', params.category);
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
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
      return {
        ok: false,
        response: jsonResponse(
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
        ),
      };
    }

    if (res.status === 429) {
      return {
        ok: false,
        response: jsonResponse(
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
        ),
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        response: jsonResponse(
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
        ),
      };
    }

    if (!parsedObj) {
      return {
        ok: false,
        response: jsonResponse(
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
        ),
      };
    }

    if (!Array.isArray(parsedObj.data)) {
      return {
        ok: false,
        response: jsonResponse(
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
        ),
      };
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
      return {
        ok: false,
        response: jsonResponse(
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
        ),
      };
    }

    const normalized = parsedObj.data
      .map(normalizeResellHatProduct)
      .filter((p): p is NormalizedSupplierProduct => p !== null);

    const categorySet = new Set<string>();
    normalized.forEach((p) => {
      if (p.category && p.category !== 'Uncategorized') {
        categorySet.add(p.category);
      }
    });
    if (Array.isArray(parsedObj.categories)) {
      parsedObj.categories.forEach((c) => {
        if (typeof c === 'string' && c.trim()) categorySet.add(c.trim());
        else if (
          c &&
          typeof c === 'object' &&
          typeof (c as Record<string, unknown>).name === 'string'
        ) {
          categorySet.add(String((c as Record<string, unknown>).name).trim());
        }
      });
    }

    const currentPage = Math.max(1, Number(rawMeta.current_page || params.page) || 1);
    const lastPage = Math.max(currentPage, Number(rawMeta.last_page || 1) || 1);
    const total = Math.max(normalized.length, Number(rawMeta.total || normalized.length) || 0);
    const perPage = Math.min(
      500,
      Math.max(1, Number(rawMeta.per_page || params.perPage) || params.perPage)
    );

    return {
      ok: true,
      upstreamStatus: res.status,
      latencyMs,
      payload: {
        ok: true,
        supplier: 'ResellHat',
        data: normalized,
        categories: Array.from(categorySet).sort((a, b) => a.localeCompare(b)),
        meta: {
          current_page: currentPage,
          last_page: lastPage,
          per_page: perPage,
          total,
        },
      },
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      response: jsonResponse(
        {
          success: false,
          ok: false,
          connected: false,
          status: isAbort ? 504 : 502,
          code: isAbort ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_NETWORK_ERROR',
          message: isAbort
            ? 'ResellHat API timed out after 20 seconds.'
            : 'Unable to reach ResellHat API from server proxy.',
          data: null,
        },
        isAbort ? 504 : 502
      ),
    };
  }
}

export async function handleResellHatTestConnection(
  request: Request,
  env: ProxyEnv
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  if (request.method !== 'GET') {
    return jsonResponse(
      { ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed. Use GET.' },
      405
    );
  }

  const authCheck = await verifyAdminRequest(request, env);
  if (!authCheck.ok) return authCheck.response;

  const apiKey = getResellHatApiKey(env);
  if (!apiKey) {
    return jsonResponse(
      {
        ok: false,
        connected: false,
        code: 'MISSING_API_KEY',
        message:
          'Server secret RESSELLHAT_API_KEY is not configured. Add RESSELLHAT_API_KEY in Cloudflare Pages → Settings → Environment variables (or .env locally) and redeploy.',
      },
      503
    );
  }

  const probe = await fetchResellHatUpstream(apiKey, { page: 1, perPage: 1 });
  if (!probe.ok) return probe.response;

  return jsonResponse({
    success: true,
    ok: true,
    connected: true,
    status: probe.upstreamStatus,
    upstreamStatus: probe.upstreamStatus,
    supplier: 'ResellHat',
    latencyMs: probe.latencyMs,
    totalProducts: probe.payload.meta.total,
    lastPage: probe.payload.meta.last_page,
    testedBy: authCheck.user.email,
    testedAt: new Date().toISOString(),
    message: `Connected cleanly to ResellHat API (HTTP ${probe.upstreamStatus}, ${probe.latencyMs}ms).`,
    data: {
      data: probe.payload.data,
      meta: probe.payload.meta,
      categories: probe.payload.categories,
    },
  });
}

export async function handleResellHatProducts(
  request: Request,
  env: ProxyEnv
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  if (request.method !== 'GET') {
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

  const authCheck = await verifyAdminRequest(request, env);
  if (!authCheck.ok) return authCheck.response;

  const apiKey = getResellHatApiKey(env);
  if (!apiKey) {
    return jsonResponse(
      {
        success: false,
        ok: false,
        status: 503,
        code: 'MISSING_API_KEY',
        message:
          'Server secret RESSELLHAT_API_KEY is not configured. Set RESSELLHAT_API_KEY in Cloudflare Pages → Settings → Environment variables.',
        data: null,
      },
      503
    );
  }

  const reqUrl = new URL(request.url);
  const rawPage = Number(reqUrl.searchParams.get('page') || '1');
  const rawPerPage = Number(reqUrl.searchParams.get('per_page') || '50');
  const rawCategory = (reqUrl.searchParams.get('category') || '').trim().slice(0, 100);

  const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
  const perPage = Number.isFinite(rawPerPage)
    ? Math.min(500, Math.max(1, Math.floor(rawPerPage)))
    : 50;

  const result = await fetchResellHatUpstream(apiKey, {
    page,
    perPage,
    category: rawCategory || undefined,
  });

  if (!result.ok) return result.response;

  return jsonResponse({
    ...result.payload,
    success: true,
    status: result.upstreamStatus,
    upstreamStatus: result.upstreamStatus,
    message: `Loaded ${result.payload.data.length} product(s) from ResellHat.`,
    latencyMs: result.latencyMs,
  });
}
