import { NextResponse } from 'next/server';
import { fetchRecentApplications } from '../../../lib/planit.js';
import { applyHardFilter } from '../../../lib/filters.js';
import { qualifyApplication } from '../../../lib/qualify.js';
import { generateLetterBody } from '../../../lib/letter.js';
import { supabaseAdmin } from '../../../lib/supabaseServer';
import { buildLeadsEmail, createLeadsDraft } from '../../../lib/gmailDraft.js';

function addressKey(a) {
  return `${(a.site_address||'').toLowerCase().trim()}|${(a.postcode||'').toLowerCase().replace(/\s+/g,'')}`;
}
function weekLabel(d = new Date()) {
  const jan1 = new Date(d.getFullYear(),0,1);
  const wk = Math.ceil((((d - jan1) / 86400000) + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${wk}`;
}

export async function GET(req) {
  const dryRun = new URL(req.url).searchParams.get('dryRun') === '1';
  const summary = { dryRun, pulled: 0, qualified: 0, written: 0, suppressed: 0, errors: [] };
  try {
    const apps = await fetchRecentApplications({ days: 7 });
    summary.pulled = apps.length;

    // suppress already-sent (never send twice)
    const { data: sent } = await supabaseAdmin.from('letters').select('address_key');
    const already = new Set((sent || []).map((r) => r.address_key));

    const fresh = apps.filter((a) => applyHardFilter(a).passed && !already.has(addressKey(a)));
    summary.suppressed = apps.filter((a) => applyHardFilter(a).passed && already.has(addressKey(a))).length;

    const qualifying = [];
    for (const a of fresh) {
      let q;
      try { q = await qualifyApplication(a); } catch (e) { summary.errors.push(`qualify ${a.application_reference}: ${e.message}`); continue; }
      if (!q.qualified) continue;
      summary.qualified++;
      let body = [];
      try { body = await generateLetterBody(a); } catch { body = []; }

      if (!dryRun) {
        await supabaseAdmin.from('leads').upsert({
          client_id: 'kap', application_reference: a.application_reference, address_key: addressKey(a),
          site_address: a.site_address, city: a.parish || '', postcode: a.postcode,
          distance_miles: a.distance_miles, application_type: a.application_type,
          ai_summary: q.summary, body, source_url: a.source_url, week_label: weekLabel(), status: 'pending'
        }, { onConflict: 'client_id,application_reference' });
        summary.written++;
      }
      qualifying.push({ address: a.site_address, distance_miles: Number((a.distance_miles||0).toFixed(1)), summary: q.summary, source: a.source_url });
    }

    if (!dryRun && qualifying.length > 0) {
      try {
        summary.gmailDraftId = await createLeadsDraft({
          to: ['mark.storey16@gmail.com', 'info@kapwoodworkandbuilding.co.uk'],
          subject: "This week's KAP leads — quick approval to post",
          body: buildLeadsEmail(qualifying)
        });
      } catch (e) { summary.errors.push(`gmail: ${e.message}`); }
    }
    return NextResponse.json(summary);
  } catch (e) {
    summary.errors.push(`fatal: ${e.message}`);
    return NextResponse.json(summary, { status: 500 });
  }
}
