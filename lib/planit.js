// SiteSignal primary data intake — PlanIt national planning aggregator.
// https://www.planit.org.uk/api/  (covers 420+ UK authorities incl. Dorset & BCP)
//
// Chosen over per-council portal scraping/email-parsing because:
//   - one structured JSON API instead of N fragile per-council scrapers
//   - no council-portal account registration or robots.txt conflict
//   - returns applicant/agent address fields we need for the letters
//
// Verified live 2026-07 against Broadmayne (DT2 8UN): real, current Dorset +
// BCP records with address, app_type, app_state, description, coords, and a
// link back to the source council application.
//
// Trade-offs (documented honestly in the brief): PlanIt is a free,
// community-run, rate-limited service with some scrape latency. We query
// per-authority (fast) rather than one large radius circle (which times out),
// then apply the precise 25-mile radius filter client-side using the coords
// PlanIt returns. If we later need real-time push alerts (e.g. for the resale
// product), a paid API with webhooks (PlanAPI / PlanWire) is the upgrade path.

const PLANIT_BASE = 'https://www.planit.org.uk/api';
const USER_AGENT = 'SiteSignal/0.1 (Dorweb Ltd; alex@dorweb.net)';

// Councils whose areas fall within ~25 miles of Broadmayne. Dorset + BCP cover
// the vast majority; Somerset/East Devon edges can be added later (brief §4).
export const AUTHORITIES = ['Dorset', 'BCP'];

// Broadmayne base — Kap Woodwork & Building.
export const BASE_COORDS = { lat: 50.6892, lon: -2.3958 };
export const MAX_RADIUS_MILES = 25;

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Normalise a raw PlanIt record into SiteSignal's internal application shape.
function normalise(rec) {
  const other = rec.other_fields || {};
  const lat = rec.location_y ?? other.lat;
  const lon = rec.location_x ?? other.lng;
  const distance_miles =
    lat != null && lon != null
      ? haversineMiles(BASE_COORDS.lat, BASE_COORDS.lon, lat, lon)
      : null;

  return {
    council_id: rec.area_name || rec.scraper_name || 'unknown',
    application_reference: rec.uid || rec.name,
    site_address: rec.address,
    postcode: rec.postcode,
    application_type: rec.app_type,               // PlanIt category: Full / Trees / Heritage / ...
    application_subtype: other.application_type,  // council's own fuller label
    app_size: rec.app_size,
    app_state: rec.app_state,                     // Undecided / Permitted / Rejected ...
    description: rec.description,
    applicant_name: other.applicant_name,
    applicant_address: other.applicant_address,
    agent_name: other.agent_name,
    agent_address: other.agent_address,
    parish: other.parish,
    ward_name: other.ward_name,
    received_date: rec.start_date,          // application submitted ('requested')
    decided_date: rec.decided_date || (rec.other_fields||{}).decided_date, // approval/decision date
    source_url: rec.url || other.source_url,      // council application page
    planit_url: rec.link,                          // PlanIt page
    coords: lat != null && lon != null ? { lat, lon } : null,
    distance_miles
  };
}

async function fetchAuthorityPage({ authority, startDate, from = 0, pageSize = 200 }) {
  const params = new URLSearchParams({
    auth: authority,
    start_date: startDate,
    pg_sz: String(pageSize),
    from: String(from)
  });
  const res = await fetch(`${PLANIT_BASE}/applics/json?${params}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`PlanIt fetch failed (${authority}): ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Pull all applications received in the last `days` for our authorities,
 * filtered to within MAX_RADIUS_MILES of Broadmayne.
 * @returns {Promise<Array>} normalised application records
 */
export async function fetchRecentApplications({ days = 7, authorities = AUTHORITIES } = {}) {
  const startDate = isoDaysAgo(days);
  const all = [];

  for (const authority of authorities) {
    let from = 0;
    // Bounded pagination — safety cap so a bad response can't loop forever.
    for (let page = 0; page < 10; page++) {
      const data = await fetchAuthorityPage({ authority, startDate, from });
      const records = data.records || [];
      if (records.length === 0) break;
      all.push(...records.map(normalise));
      if (records.length < 200) break; // last page
      from += records.length;
    }
  }

  // Precise radius filter using returned coords. Records without coords are
  // kept (rare) so they reach AI qualification rather than being silently lost.
  const withinRadius = all.filter(
    (a) => a.distance_miles == null || a.distance_miles <= MAX_RADIUS_MILES
  );

  return dedupeSchemes(withinRadius);
}

// The same physical project often files under several PlanIt categories in the
// same week (e.g. a "Full" + "Heritage" pair, or "Conditions" alongside the
// original). Collapse to one lead per scheme so Mark never sees a property
// twice. Key = site address + first 50 chars of description (so genuinely
// different works at one address stay separate). Keeps the highest-priority
// category and records how many were merged.
const TYPE_PRIORITY = { Full: 4, Heritage: 3, Conditions: 2, Outline: 1 };

function dedupeSchemes(records) {
  const groups = new Map();
  for (const r of records) {
    const key = `${(r.site_address || '').toLowerCase().trim()}|${(r.description || '')
      .toLowerCase()
      .slice(0, 50)}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { ...r, merged_types: [r.application_type] });
      continue;
    }
    existing.merged_types.push(r.application_type);
    // Keep the higher-priority category as the primary record.
    if ((TYPE_PRIORITY[r.application_type] || 0) > (TYPE_PRIORITY[existing.application_type] || 0)) {
      groups.set(key, { ...r, merged_types: existing.merged_types });
    }
  }
  return [...groups.values()];
}
