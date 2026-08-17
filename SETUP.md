# SiteSignal — Phase A setup (click-by-click)

A hosted, secure portal on sitesignal.dorweb.net. Manual Stannp for now.

## 1. GitHub
Create a private repo and push this project.

## 2. Supabase (free)
1. supabase.com → New project. Copy the Project URL + anon key + service_role key.
2. SQL editor → paste and run `supabase/schema.sql`.
3. Auth → Email → enable "Magic Link".
4. Add yourself + Mark as users (Auth → Users → invite), then in SQL:
   ```sql
   insert into profiles (user_id, role, client_id, full_name) values
     ('<alex-user-uuid>', 'admin', null, 'Alex'),
     ('<mark-user-uuid>', 'client', 'kap', 'Mark Storey');
   ```

## 3. Vercel
1. New Project → import the GitHub repo (framework: Next.js, auto-detected).
2. Settings → Domains → add `sitesignal.dorweb.net`; add the CNAME it gives you
   in Dorweb's DNS.
3. Settings → Environment Variables → add everything from `.env.example`.
4. Deploy.

## 4. First run
- Visit `https://sitesignal.dorweb.net/api/weekly-scan?dryRun=1` to test the scan
  with no writes.
- Then let the Monday 07:00 cron populate real leads, or hit the endpoint without
  dryRun once to seed this week.
- Log in at the root URL with your email → magic link → the portal loads.

## 5. Weekly loop
Mark logs in, approves/tweaks → you (admin) click **Download CSV for Stannp** →
upload to Stannp and place the order. Month-to-date total tracks the billing.

## Notes
- Rotate the GHL token before go-live.
- Stannp API + Google Drive storage are Phase B/C (see DEPLOYMENT.md).
