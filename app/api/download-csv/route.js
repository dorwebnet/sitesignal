import { supabaseServer } from '../../../lib/supabaseServer';

function ordinal(d) {
  const day = d.getDate();
  const suf = (day >= 11 && day <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[day % 10] || 'th');
  return `${day}${suf} ${d.toLocaleString('en-GB',{month:'long'})} ${d.getFullYear()}`;
}

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('unauthorised', { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin') return new Response('forbidden', { status: 403 });

  const { data: leads } = await supabase.from('leads').select('*').eq('status', 'approved');
  const date = ordinal(new Date());
  const cols = ['date','name','address1','address2','city','postcode','body1','body2','body3','planning_ref','portal_link'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g,'""')}"`;
  const rows = (leads || []).map((l) => {
    const b = l.body || [];
    return [date,'The Homeowner',l.site_address,'',l.city,l.postcode,b[0],b[1],b[2],l.application_reference,l.source_url].map(esc).join(',');
  });
  const csv = [cols.join(','), ...rows].join('\n');
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="kap_stannp_letters.csv"' }
  });
}
