# SiteSignal — Get it live (do these in order)

Everything below is copy-paste. ~30–40 min end to end.

## 1 · GitHub (2 min)
Create a private repo `sitesignal` and push this project.

## 2 · Supabase (10 min)  — supabase.com
1. New project. From Settings → API, copy: Project URL, anon key, service_role key.
2. SQL Editor → run `supabase/schema.sql`.
3. SQL Editor → run `supabase/seed_leads.sql` (loads this week's 8 real leads).
4. Authentication → Providers → Email → turn ON "Magic Link".
5. Authentication → URL Configuration → Site URL = `https://sitesignal.dorweb.net`.
6. Authentication → Users → invite two people:
   - alex@dorweb.net   (you — admin)
   - mark.storey16@gmail.com   (Mark — client)
7. After they show up under Users, copy each user's UID, then SQL Editor:
   ```sql
   insert into profiles (user_id, role, client_id, full_name) values
     ('PASTE-ALEX-UID', 'admin', null, 'Alex'),
     ('PASTE-MARK-UID', 'client', 'kap', 'Mark Storey');
   ```

## 3 · Vercel (10 min)  — vercel.com
1. New Project → import the GitHub repo (it auto-detects Next.js).
2. Environment Variables → add these (from steps above + your keys):
   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   - ANTHROPIC_API_KEY
   - GHL_API_TOKEN (rotate first!), GHL_MARK_CONTACT_ID
   - (optional) GMAIL_* for the auto-draft
3. Deploy.
4. Settings → Domains → add `sitesignal.dorweb.net` → add the CNAME it shows you
   in Dorweb's DNS. Wait for it to go green (HTTPS is automatic).

## 4 · First login (2 min)
- Go to `https://sitesignal.dorweb.net` → enter your email → click the magic link.
- You'll land on the portal with this week's 8 leads already there.
- Mark does the same with his email and sees the same list to approve.

## 5 · The weekly loop
Mark approves/tweaks → you (admin) hit **Download CSV for Stannp** → upload to
Stannp and place the order. The month-to-date counter tracks billing.
Next Monday 07:00 the cron refreshes the list automatically (and drafts the email).

---
Stuck on any step? Tell me the exact screen/error and I'll get you through it.
