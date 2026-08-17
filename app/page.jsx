import { redirect } from 'next/navigation';
import { supabaseServer } from '../lib/supabaseServer';
import ApprovalList from '../components/ApprovalList';

export const dynamic = 'force-dynamic';

export default async function Portal() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, client_id, full_name').eq('user_id', user.id).single();
  const clientId = profile?.client_id || 'kap';

  // This week's pending/approved leads (RLS restricts clients to their own).
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .in('status', ['pending', 'approved'])
    .order('distance_miles', { ascending: true });

  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();

  // Month-to-date letters for the running total.
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const { count: mtd } = await supabase
    .from('letters').select('*', { count: 'exact', head: true })
    .gte('sent_at', monthStart.toISOString());

  return (
    <ApprovalList
      leads={leads || []}
      role={profile?.role || 'client'}
      perLetterPrice={client?.per_letter_price ?? 2.5}
      mtd={mtd || 0}
      userEmail={user.email}
    />
  );
}
