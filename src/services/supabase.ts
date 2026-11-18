import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getCurrentUserIdToken } from './firebase';

function normalizeSupabaseUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/rest\/v1$/i, '');
  }
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseBrowserConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseBrowserConfigured) return null;
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return browserClient;
}

export async function sofsApiFetch<T = any>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    requireAuth?: boolean;
  } = {}
): Promise<T> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = await getCurrentUserIdToken(false);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (options.requireAuth) {
    throw new Error('Please sign in to continue.');
  }

  const response = await fetch(`/api/sofs/${path.replace(/^\/+/, '')}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let parsed: any = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Unexpected server response (HTTP ${response.status}).`);
  }

  if (!response.ok || parsed.ok === false) {
    throw new Error(parsed.message || `Request failed with HTTP ${response.status}.`);
  }

  return parsed as T;
}

export function subscribeSofsRealtime(onChange: (table: string) => void): () => void {
  const client = getSupabaseBrowserClient();
  if (!client) return () => {};

  const channel = client
    .channel('sofs-realtime-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => onChange('notices'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () =>
      onChange('notifications')
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () =>
      onChange('support_messages')
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () =>
      onChange('support_tickets')
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
