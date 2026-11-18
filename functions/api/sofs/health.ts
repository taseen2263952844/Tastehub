interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const env = context.env || {};
  const rawUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
  let supabaseUrl = '';
  if (rawUrl) {
    try {
      supabaseUrl = new URL(rawUrl).origin;
    } catch {
      supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '');
    }
  }
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const geminiKey = (env.GEMINI_API_KEY || '').trim();
  const firebaseProjectId =
    (env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '').trim() || 'tastehub-16c49';

  return new Response(
    JSON.stringify({
      ok: true,
      supabaseConfigured: Boolean(supabaseUrl && serviceKey),
      geminiConfigured: Boolean(geminiKey),
      firebaseProjectId,
    }),
    { status: 200, headers: HEADERS }
  );
};

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, { status: 204, headers: HEADERS });
};
