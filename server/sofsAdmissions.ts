export interface SofsAdmissionEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  [key: string]: unknown;
}

export const ADMISSION_CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const admissionRateLimiter = new Map<string, number[]>();

function jsonRes(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...ADMISSION_CORS_HEADERS,
      ...(extraHeaders || {}),
    },
  });
}

function getEnv(env: SofsAdmissionEnv | undefined, key: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const boundVal = env?.[key];
  if (typeof boundVal === 'string' && boundVal.trim().length > 0) {
    return boundVal.trim();
  }
  return '';
}

function normalizeSupabaseBaseUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/rest\/v1$/i, '');
  }
}

function detectSupabaseKeyType(
  key: string
): 'secret' | 'service_role_jwt' | 'publishable' | 'anon_jwt' | 'unknown' {
  const trimmed = key.trim();
  if (trimmed.startsWith('sb_secret_')) return 'secret';
  if (trimmed.startsWith('sb_publishable_')) return 'publishable';
  const parts = trimmed.split('.');
  if (parts.length === 3) {
    try {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
      const claims = JSON.parse(atob(padded)) as { role?: string };
      if (claims?.role === 'service_role') return 'service_role_jwt';
      if (claims?.role === 'anon') return 'anon_jwt';
    } catch {
      // Ignore malformed token payload
    }
  }
  return 'unknown';
}

function buildSupabaseServerHeaders(serverKey: string): Record<string, string> {
  const keyType = detectSupabaseKeyType(serverKey);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: serverKey,
    Prefer: 'return=representation',
  };
  // New-format Supabase secret keys (sb_secret_...) are not JWTs and must only be sent in `apikey`.
  // Legacy service_role JWTs use both `apikey` and `Authorization: Bearer`.
  if (keyType !== 'secret') {
    headers.Authorization = `Bearer ${serverKey}`;
  }
  return headers;
}

export async function handlePublicAdmissionSubmit(
  req: Request,
  env: SofsAdmissionEnv
): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: ADMISSION_CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonRes(
      {
        ok: false,
        status: 405,
        message: 'Method not allowed. Submit admission applications using POST.',
      },
      405,
      { Allow: 'POST, OPTIONS' }
    );
  }

  const clientIp =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'local';

  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const timestamps = (admissionRateLimiter.get(clientIp) || []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= 8) {
    return jsonRes(
      {
        ok: false,
        status: 429,
        message: 'Too many admission submissions from this device. Please wait a few minutes.',
      },
      429
    );
  }
  timestamps.push(now);
  admissionRateLimiter.set(clientIp, timestamps);

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonRes(
      { ok: false, status: 400, message: 'Invalid JSON submission payload.' },
      400
    );
  }

  if (!payload || typeof payload !== 'object') {
    return jsonRes(
      { ok: false, status: 400, message: 'Invalid admission form payload.' },
      400
    );
  }

  // Honeypot anti-spam field check
  if (typeof payload.website === 'string' && payload.website.trim().length > 0) {
    return jsonRes(
      { ok: false, status: 400, message: 'Automated spam submission rejected.' },
      400
    );
  }

  const fullName = String(payload.fullName || '').trim();
  const phone = String(payload.phone || '').trim();
  const whatsapp = String(payload.whatsapp || '').trim();
  const academicLevel = String(payload.academicLevel || '').trim();
  const academicGroup = String(payload.academicGroup || 'Science').trim() || 'Science';
  const desiredCourse = String(payload.desiredCourse || '').trim();
  const preferredBatch = String(payload.preferredBatch || '').trim();
  const message = String(payload.message || '').trim();

  if (fullName.length < 2 || fullName.length > 120) {
    return jsonRes(
      { ok: false, status: 400, message: 'Full Name must be between 2 and 120 characters.' },
      400
    );
  }
  if (!/^[+0-9\s()-]{8,24}$/.test(phone)) {
    return jsonRes(
      { ok: false, status: 400, message: 'Please provide a valid mobile phone number.' },
      400
    );
  }
  if (academicLevel.length < 2 || academicLevel.length > 60) {
    return jsonRes(
      { ok: false, status: 400, message: 'Please select a valid Class / Academic Level.' },
      400
    );
  }
  if (desiredCourse.length < 2 || desiredCourse.length > 160) {
    return jsonRes(
      { ok: false, status: 400, message: 'Please select a Desired Course or Subject.' },
      400
    );
  }
  if (message.length > 1500) {
    return jsonRes(
      { ok: false, status: 400, message: 'Message is too long (maximum 1500 characters).' },
      400
    );
  }

  const rawSupabaseUrl = getEnv(env, 'SUPABASE_URL');
  const supabaseUrl = normalizeSupabaseBaseUrl(rawSupabaseUrl);
  const serviceRoleKey = getEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    return jsonRes(
      {
        ok: false,
        status: 503,
        message: `Admission database is not configured on the server. Missing Worker runtime binding(s): ${missing.join(', ')}. Configure them in Cloudflare Worker -> Settings -> Variables and Secrets and redeploy.`,
      },
      503
    );
  }

  const keyType = detectSupabaseKeyType(serviceRoleKey);
  if (keyType === 'publishable' || keyType === 'anon_jwt') {
    return jsonRes(
      {
        ok: false,
        status: 500,
        message:
          'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is set to a public anon/publishable key. Replace it in Cloudflare Worker Secrets with your Supabase secret key (sb_secret_...) or legacy service_role key.',
      },
      500
    );
  }

  const referenceCode = `SOFS-ADM-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    const restRes = await fetch(`${supabaseUrl}/rest/v1/admissions`, {
      method: 'POST',
      headers: buildSupabaseServerHeaders(serviceRoleKey),
      body: JSON.stringify({
        reference_code: referenceCode,
        full_name: fullName,
        phone,
        whatsapp,
        academic_level: academicLevel,
        academic_group: academicGroup,
        desired_course: desiredCourse,
        preferred_batch: preferredBatch,
        message,
        status: 'new',
      }),
    });

    const rawText = await restRes.text();
    let parsed: any = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    if (!restRes.ok) {
      const dbMessage =
        (parsed && (parsed.message || parsed.error || parsed.details)) ||
        `Supabase rejected the admission record (HTTP ${restRes.status}).`;
      const isMissingTable =
        typeof dbMessage === 'string' &&
        (dbMessage.includes('public.admissions') || dbMessage.includes('schema cache'));
      const isRlsViolation =
        typeof dbMessage === 'string' &&
        dbMessage.toLowerCase().includes('row-level security');
      const userMessage = isMissingTable
        ? `Could not save admission application: ${dbMessage}. Please run supabase/migrations/001_sofs_schema.sql in your Supabase SQL Editor.`
        : isRlsViolation
          ? `Could not save admission application: ${dbMessage}. Verify SUPABASE_SERVICE_ROLE_KEY in Cloudflare Worker Secrets is a valid server secret key (sb_secret_... or service_role).`
          : `Could not save admission application: ${dbMessage}`;
      const statusOut = restRes.status >= 400 && restRes.status < 500 ? restRes.status : 502;
      return jsonRes(
        {
          ok: false,
          status: statusOut,
          message: userMessage,
        },
        statusOut
      );
    }

    const row = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!row || !row.id) {
      return jsonRes(
        {
          ok: false,
          status: 502,
          message: 'Supabase did not return the created admission record.',
        },
        502
      );
    }

    return jsonRes(
      {
        ok: true,
        status: 201,
        admission: {
          id: row.id,
          referenceCode: row.reference_code,
          fullName: row.full_name,
          phone: row.phone,
          whatsapp: row.whatsapp || '',
          academicLevel: row.academic_level,
          academicGroup: row.academic_group,
          desiredCourse: row.desired_course,
          preferredBatch: row.preferred_batch || '',
          message: row.message || '',
          status: row.status,
          createdAt: row.created_at,
        },
      },
      201
    );
  } catch (err: any) {
    return jsonRes(
      {
        ok: false,
        status: 502,
        message: `Unable to reach Supabase database: ${err?.message || 'Network error'}`,
      },
      502
    );
  }
}
