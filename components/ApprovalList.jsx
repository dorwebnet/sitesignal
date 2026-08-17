'use client';
import { useState, useMemo } from 'react';
import { supabaseBrowser } from '../lib/supabaseClient';

const COST = 0.92;
const C = { gold:'#FDAE12', black:'#050505', char:'#141416', cream:'#F3ECDD', green:'#3E8C5A', mute:'#8A8A8D', line:'#2A2A2D' };

export default function ApprovalList({ leads, role, perLetterPrice, mtd, userEmail }) {
  const [rows, setRows] = useState(() => leads.map((l) => ({ ...l, body: l.body || [] })));
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState('');

  const update = (id, patch) => setRows((r) => r.map((x) => x.id === id ? { ...x, ...patch } : x));

  async function persist(id, fields) {
    setSaving(id);
    await fetch('/api/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...fields }) });
    setSaving('');
  }

  const setStatus = (l, status) => { update(l.id, { status }); persist(l.id, { status }); };
  const saveBody = (l, body) => { update(l.id, { body }); };
  const commitBody = (l) => persist(l.id, { body: rows.find((r) => r.id === l.id).body });

  const approved = rows.filter((r) => r.status === 'approved');
  const pending = rows.filter((r) => (r.status || 'pending') === 'pending');
  const totals = useMemo(() => {
    const n = approved.length;
    return { n, cost: n * COST, charge: n * perLetterPrice, margin: n * (perLetterPrice - COST) };
  }, [approved, perLetterPrice]);

  async function signOut() { await supabaseBrowser().auth.signOut(); window.location.href = '/login'; }
  function downloadCSV() { window.location.href = '/api/download-csv'; }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="serif" style={{ color: C.gold, fontSize: 30, letterSpacing: 3 }}>KAP</span>
          <div style={{ borderLeft: `1px solid ${C.line}`, paddingLeft: 16 }}>
            <div className="eye" style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>SiteSignal</div>
            <div style={{ fontSize: 12, color: C.mute }}>Weekly letter approvals</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: C.mute }}>
          <div>Letters this month: <span className="serif" style={{ color: C.gold, fontSize: 20 }}>{mtd + totals.n}</span></div>
          <div style={{ marginTop: 4 }}>{userEmail} · <button className="btn" onClick={signOut} style={{ background: 'none', color: C.mute, borderBottom: `1px solid ${C.line}`, padding: 0 }}>Sign out</button></div>
        </div>
      </header>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 28px 8px' }}>
        <h1 className="serif" style={{ fontSize: 40, lineHeight: 1.05, color: C.cream }}>
          {pending.length > 0 ? <>You have <span style={{ color: C.gold }}>{pending.length} project{pending.length === 1 ? '' : 's'}</span> to review.</> : <>All caught up.</>}
        </h1>
        <p style={{ color: C.mute, fontSize: 14, maxWidth: 640, marginTop: 10 }}>
          Approve the letters you want posted this week, tweak the wording if you like, then download the CSV to place the order with Stannp. Nothing is sent until you download and place the order.
        </p>
      </div>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '16px 28px 160px' }}>
        {rows.length === 0 && <p style={{ color: C.mute }}>No new projects this week. The next scan runs Monday.</p>}
        {rows.map((l, i) => {
          const isOpen = open === l.id;
          const border = l.status === 'approved' ? C.green : l.status === 'skipped' ? '#7a3b3b' : C.line;
          return (
            <div key={l.id} style={{ border: `1px solid ${border}`, borderRadius: 8, marginBottom: 14, background: C.char, opacity: l.status === 'skipped' ? 0.55 : 1 }}>
              <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 240, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span className="eye" style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="serif" style={{ fontSize: 22, color: C.cream }}>{l.site_address}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.mute, marginTop: 2 }}>{l.city} · {l.postcode} · <span style={{ color: C.cream }}>{l.distance_miles} mi</span></div>
                  <div style={{ fontSize: 14, marginTop: 8, color: C.cream }}>{l.ai_summary}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 12 }}>
                    {l.source_url && <a href={l.source_url} target="_blank" rel="noreferrer" style={{ borderBottom: `1px solid ${C.line}`, textDecoration: 'none' }}>View on planning portal ↗</a>}
                    <button className="btn" onClick={() => setOpen(isOpen ? null : l.id)} style={{ background: 'none', color: C.mute, borderBottom: `1px solid ${C.line}`, padding: 0 }}>{isOpen ? 'Hide letter' : 'Preview / edit letter'}</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', justifyContent: 'center' }}>
                  {l.status === 'approved' && <span className="eye" style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>✓ Approved</span>}
                  {l.status === 'skipped' && <span className="eye" style={{ color: '#b06a6a', fontSize: 11, fontWeight: 700 }}>Skipped</span>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={() => setStatus(l, l.status === 'approved' ? 'pending' : 'approved')}
                      style={{ background: l.status === 'approved' ? 'transparent' : C.gold, color: l.status === 'approved' ? C.gold : C.black, border: `1px solid ${C.gold}`, padding: '8px 16px', borderRadius: 5, fontWeight: 700, fontSize: 12 }}>
                      {l.status === 'approved' ? 'Undo' : 'Approve'}
                    </button>
                    <button className="btn" onClick={() => setStatus(l, l.status === 'skipped' ? 'pending' : 'skipped')}
                      style={{ background: 'transparent', color: C.mute, border: `1px solid ${C.line}`, padding: '8px 14px', borderRadius: 5, fontSize: 12 }}>Skip</button>
                  </div>
                </div>
              </div>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${C.line}`, padding: '18px 20px', background: C.black }}>
                  <div className="eye" style={{ fontSize: 10, color: C.mute, marginBottom: 10 }}>Letter body — edit if you like {saving === l.id && '· saving…'}</div>
                  {(l.body || []).map((para, pi) => (
                    <textarea key={pi} value={para} onBlur={() => commitBody(l)}
                      onChange={(e) => { const nb = [...l.body]; nb[pi] = e.target.value; saveBody(l, nb); }}
                      style={{ width: '100%', background: C.char, color: C.cream, border: `1px solid ${C.line}`, borderRadius: 6, padding: '10px 12px', fontSize: 13, lineHeight: 1.5, marginBottom: 8, minHeight: 72, resize: 'vertical' }} />
                  ))}
                  <div style={{ fontSize: 11, color: C.mute }}>Greeting, sign-off, letterhead and reverse side are added automatically from the KAP template.</div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.char, borderTop: `1px solid ${C.gold}`, padding: '14px 28px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Stat label="Approved" value={totals.n} big />
            <Stat label="Est. Stannp cost" value={`£${totals.cost.toFixed(2)}`} />
            <Stat label="Charge to KAP" value={`£${totals.charge.toFixed(2)}`} />
            <Stat label="Month to date" value={`${mtd + totals.n} letters`} />
          </div>
          {role === 'admin' && (
            <button className="btn" disabled={totals.n === 0} onClick={downloadCSV}
              style={{ background: totals.n === 0 ? C.line : C.gold, color: totals.n === 0 ? C.mute : C.black, padding: '13px 26px', borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: totals.n === 0 ? 'not-allowed' : 'pointer' }}>
              Download CSV for Stannp ({totals.n})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, big }) {
  return (<div>
    <div className="eye" style={{ fontSize: 9, color: '#8A8A8D', fontWeight: 600 }}>{label}</div>
    <div className="serif" style={{ fontSize: big ? 28 : 20, color: big ? '#FDAE12' : '#F3ECDD', lineHeight: 1 }}>{value}</div>
  </div>);
}
