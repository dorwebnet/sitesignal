# SiteSignal

Planning-portal outreach automation for Kap Woodwork and Building.
Full architecture and phased plan: see the project brief.

**Domain:** `sitesignal.dorweb.net`
**System of record:** GoHighLevel (KAP subaccount) — every qualifying project
becomes a Contact + Opportunity there. The digest, follow-ups and WhatsApp are
GHL Workflows against the pipeline stages, not code here.

## Data flow (primary path)

```
PlanIt API (Dorset + BCP, last 7d, <=25mi of Broadmayne)   [lib/planit.js]
        │   weekly Vercel cron → /api/weekly-scan
        ▼
  hard filter (drop Trees/Advertising/Amendment + noise)    [lib/filters.js]
        ▼
  Claude qualification (is this genuinely Kap's work?)      [lib/qualify.js]
        ▼
  Supabase audit trail  +  GHL Contact/Opportunity ("New Lead")   [lib/ghl.js]
        ▼
  GHL Workflow → Mark's weekly digest (email now; WhatsApp later)
```

Intake switched from per-council portal saved-search emails to the **PlanIt
national aggregator API** — one structured source covering Dorset + BCP, no
council-portal registration, no scraping/robots.txt conflict, and it carries
the applicant/agent address fields needed for the letters. Verified live
against Broadmayne: ~120 applications/week within 25mi, ~55 surviving the hard
filter, before AI qualification narrows to genuine leads.

The old email-notification path (`api/inbound-notification.js`) is retained as
an optional **backup** source only.

## Run it

- **Dry run on real data (no writes):**
  `GET /api/weekly-scan?dryRun=1` — pulls this week's real applications,
  filters + qualifies, returns the ranked digest as JSON without touching GHL.
  Works even before `ANTHROPIC_API_KEY` is set (falls back to hard-filter-only).
- **Live:** the weekly cron (Mondays 07:00 UTC, see `vercel.json`) runs the
  same pipeline and writes qualifying projects into GHL.

## Setup checklist

1. **Supabase** — run `supabase/schema.sql` against a new project; set
   `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
2. **GHL** — `GHL_API_TOKEN` (rotate the one shared in chat!). Location/pipeline
   /stage/field IDs are already wired to the KAP subaccount in `lib/ghl.js`.
3. **Claude** — `ANTHROPIC_API_KEY` for the qualification pass.
4. **Deploy** — `vercel --prod`, domain `sitesignal.dorweb.net`, env vars set.
5. **Silent run** — leave on `?dryRun=1` for a week or two to validate
   qualification accuracy before letting it write to Mark's live pipeline.

## Known refinements (observed on live data)

- **Dedupe** — the same scheme files under multiple PlanIt categories in one
  week; `lib/planit.js` collapses these to one lead per property. ✓ done
- **AI layer earns its keep** — the hard filter is deliberately permissive
  (lets through e.g. "replace uPVC windows", "air source heat pump"); the
  Claude pass is what rejects technically-in-scope-but-not-Kap's-work items.
- **Applicant/agent names** often come through as "See source" from Dorset —
  the *address* is present, so letters can go to the property/agent address;
  the name can be enriched from the council page (`source_url`) if needed.

## Not yet built (later phases)

- Letter generation + PDF letterhead overlay + Stannp post (Phase 3)
- planning.data.gov.uk enrichment (conservation area / listed / flood) for
  sharper qualification + letter personalisation
- WhatsApp-in-the-loop approvals via GHL native (Phase 4)
- Monthly billing report as a GHL view (Phase 5)

## Brand asset notes
- Live-site / official-logo gold is `#FDAE12` (used here). The brand-guide PDF
  states `#FDAE12` — a discrepancy worth reconciling with Mark; we've matched
  the official logo SVG.
- Official logo: `wp-content/uploads/2026/04/logo-full.svg` (light-bg version,
  black wordmark + gold "KAP"). For the dark header band we use a reversed
  (white wordmark) variant — Mark should confirm/supply the official reversed logo.
- FSB member badge: supplied by Mark (navy). Placed on a white tile so it reads
  on the dark footer.
- Contact number corrected to 07426 953891 (was a placeholder).

## Print spec (Stannp A4)
Letters are generated to Stannp's A4 letter guide:
- Template 216 x 303mm (A4 + 3mm bleed), 2551 x 3579px @ 300dpi
- Safe zone 204 x 291mm — all logo/text kept inside
- Address box at 21mm left / 44.5mm top, 99 x 45.5mm — recipient address only,
  kept clear for machine reading + C5 window envelope
- Full-bleed dark bands to template edge
See `letter-print/stannp_letter_generator.py` for the reference implementation
(the production letter step renders each approved lead to this spec).
