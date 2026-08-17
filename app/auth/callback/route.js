import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next') || '/';

  const linkError = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (linkError) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(linkError)}`, url.origin));
  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('Sign-in link is missing its code. Request a new one.'), url.origin));
  }

  const res = NextResponse.redirect(new URL(next, url.origin));
  const store = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      }
    }
  );

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: type || 'magiclink', token_hash: tokenHash });

  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  return res;
}
