# SiteSignal — Deployment & Cloud Runbook

A complete, cloud-based solution on `sitesignal.dorweb.net` that Alex manages and
Mark logs into to approve letters. Built to start **simple** (manual Stannp, CSV
download) and grow into full automation without a rebuild.

---

## The picture

```
  Weekly cron (Mon 07:00)                 sitesignal.dorweb.net  (secure portal)
  ─────────────────────────               ─────────────────────────────────────
  PlanIt scan (Dorset + BCP, 25mi)        Alex (admin)  — manage, review, download
     → filter + AI-qualify                Mark  (client) — approve / tweak / view
     → dedupe vs sent-ledger                        │
     → write leads to portal                        ▼
     → email draft + WhatsApp ping         Approve & (optionally) edit each letter
                                                    │
                                                    ▼
                          NOW: download CSV → you upload to Stannp manually
                          LATER: push straight to Stannp API (£12/mo plan)
                                                    │
                                                    ▼
                          Running total of letters sent (month to date)
                                                    │
                                                    ▼
              After 3 months: evaluate impact (Google Analytics traffic +
              inbound calls tracked in GHL) → decide the ongoing investment
```

---

## Phase A — go live simple (recommended first step)

Everything except the Stannp API, so costs stay near-zero while you prove it.

**1. Repo → GitHub**
Push the `sitesignal` repo (already version-controlled) to a private GitHub repo.

**2. Host on Vercel + subdomain**
- New Vercel project from the repo.
- Add domain `sitesignal.dorweb.net` → Vercel gives you a CNAME to add in Dorweb's DNS. HTTPS is automatic.

**3. Database — Supabase (free tier)**
- New Supabase project → run `supabase/schema.sql`.
- This stores: qualified leads, the **sent-ledger** (never-send-twice), approvals, and the monthly letter tally.

**4. Secure login (the portal)**
- Use **Supabase Auth** (email magic-link or password). Two roles:
  - `admin` → Alex (alex@dorweb.net): sees everything, downloads CSV, manages settings.
  - `client` → Mark: sees the week's leads, approves/tweaks, views the running total and the letterhead PDFs.
- Client login means Mark gets his own secure area — no shared passwords.

**5. Environment variables (Vercel project settings)**
```
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
GHL_API_TOKEN            (rotate the one shared in chat first)
# Gmail draft (optional now):
GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
```

**6. Weekly cron** — already configured (`vercel.json`, Mondays 07:00). It runs the
scan and (optionally) drops the Gmail draft. Leave it in `dryRun` for the first
run to sanity-check, then enable.

**7. The manual Stannp loop (for now)**
- Mark approves in the portal → Alex clicks **Download CSV for Stannp**.
- You upload that CSV to Stannp and place the order yourself (£12/mo Starter plan,
  no API needed yet). Keeps cost minimal while you validate.
- Portal increments the month-to-date total on download so billing to Mark is a
  simple end-of-month figure (letters × your rate).

**8. The letterhead PDFs** live in the portal for each login to view/download
(front + reverse). Store them in Supabase Storage or Google Drive — see Phase C.

---

## Phase B — automate the send (when volume justifies it)

- Add the **Stannp API** (£12/mo Starter) so "Approve" posts the letter directly —
  no manual CSV upload. Code path already stubbed (`lib/stannp.js`).
- Letter **status** (posted → delivered) flows back via Stannp polling (Starter)
  or webhooks (Growth £48/mo).
- Approval writes each address into the **sent-ledger** automatically, closing the
  never-send-twice loop with no manual list-keeping.

---

## Phase C — storage & polish

- **Google Drive** as the document store (you already use Workspace): letterhead
  templates, generated letter PDFs, and monthly CSVs filed per client. Connect via
  a Drive service account; the portal links to the files.
- Multi-tenant from here: adding another builder = a new `clients` row + their
  brand assets. This is the resale path.

---

## The 3-month trial & evaluation

Run it for **3 months**, then judge impact on evidence, not gut feel:

- **Google Analytics** — watch for lifts in direct/branded traffic and visits to
  the site/gallery from the letters (the QR codes point there; tag them with a
  UTM so letter-driven visits are attributable).
- **Inbound calls in GHL** — KAP's number/tracking already logs calls; count calls
  and new opportunities that trace back to letter-drop areas.
- **The funnel** the portal already tracks: letters → responses → site visits →
  proposals → won, with cost-per-appointment and cost-per-job.

Decision at 3 months: if the letters are generating appointments and jobs at a
cost that beats other channels (e.g. shared-lead platforms at £45+/hire), scale
up; if not, adjust targeting or wind down. Either way you'll have real numbers.

---

## Security notes

- Client and admin are separate authenticated roles; no shared credentials.
- Secrets live only in Vercel env vars, never in the repo.
- **Rotate the GHL token** that was pasted in chat before go-live.
- The portal only ever *drafts* the client email — a human sends it.
- Letters never post without an explicit approval action.

---

## What's needed from you to start Phase A

1. GitHub repo (private) for the code.
2. Vercel account + the `sitesignal.dorweb.net` CNAME added in DNS.
3. Supabase project (free).
4. Confirm the per-letter price to bill Mark (suggested £2.50, 2nd class).
5. (Optional) Google OAuth consent for alex@dorweb.net if you want the auto-draft.

Once those exist I can walk the deploy through end to end.
