'use client';
import { useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  async function sendLink(e) {
    e.preventDefault();
    setErr('');
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
    });
    if (error) setErr(error.message); else setSent(true);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 380, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span className="serif" style={{ color: 'var(--gold)', fontSize: 40, letterSpacing: 4 }}>KAP</span>
          <div className="eye" style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginTop: 6 }}>SiteSignal</div>
          <div style={{ fontSize: 12, color: 'var(--mute)' }}>Weekly letter approvals</div>
        </div>
        {sent ? (
          <p style={{ textAlign: 'center', color: 'var(--cream)', lineHeight: 1.6 }}>
            Check your inbox — we've sent a secure sign-in link to <b>{email}</b>.
          </p>
        ) : (
          <form onSubmit={sendLink}>
            <label className="eye" style={{ fontSize: 10, color: 'var(--mute)' }}>Email address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.co.uk"
              style={{ width: '100%', margin: '8px 0 16px', padding: '12px 14px', background: 'var(--char)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--cream)', fontSize: 14 }} />
            <button className="btn" type="submit"
              style={{ width: '100%', padding: 13, background: 'var(--gold)', color: 'var(--black)', borderRadius: 6, fontWeight: 700, fontSize: 14 }}>
              Send sign-in link
            </button>
            {err && <p style={{ color: '#c77', fontSize: 12, marginTop: 10 }}>{err}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
