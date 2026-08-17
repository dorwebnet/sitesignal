import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function supabaseServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (n) => store.get(n)?.value,
        set: (n, v, o) => { try { store.set(n, v, o); } catch {} },
        remove: (n, o) => { try { store.set(n, '', o); } catch {} }
      }
    }
  );
}

// Service-role client for server-only tasks (cron writes, bypasses RLS).
import { createClient } from '@supabase/supabase-js';
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
