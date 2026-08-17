import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const { id, status, body } = await req.json();
  const patch = {};
  if (status) patch.status = status;
  if (body) patch.body = body;

  // RLS ensures the user can only touch their own client's leads.
  const { error } = await supabase.from('leads').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
