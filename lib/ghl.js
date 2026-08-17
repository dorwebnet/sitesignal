// GoHighLevel is the spine of SiteSignal (see brief §2) — every qualifying
// project becomes a Contact + Opportunity here, and pipeline stage IS the
// system's state machine. This wrapper only creates/updates records;
// all the actual automation (digest emails, WhatsApp, follow-up tasks)
// lives in GHL Workflows configured against these stage changes, not in code.

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

// Confirmed live against Mark's KAP subaccount — real "Marketing Pipeline",
// extended with one new stage ("Letter Sent") rather than a parallel pipeline.
// Env vars can still override these for a future multi-tenant/resale setup
// (see brief §10 Phase 5), but sensible defaults live here so Phase 1 doesn't
// need every ID hand-copied into .env.
const CONFIG = {
  locationId: process.env.GHL_LOCATION_ID || 'BR6Yxk2nfJyWXLz2pPMJ',  // KAP subaccount
  pipelineId: process.env.GHL_PIPELINE_ID || '5e4In0wbZDN6iJEoYKc7',  // "Marketing Pipeline"
  stageIds: {
    // New planning match, AI-qualified — entry point. Reuses Mark's existing stage.
    newMatch: process.env.GHL_STAGE_NEW_MATCH || '8b2cf254-d3cc-4a0d-9de2-94dcbdcc7609', // New Lead
    // Letter drafted, printed, and posted via Stannp — new stage added for SiteSignal,
    // exists specifically so month-end billing can count opportunities that passed through it.
    letterSent: process.env.GHL_STAGE_LETTER_SENT || 'e19c814c-4d80-4438-b777-51df173c3202', // Letter Sent
    // Everything downstream of the 5-day follow-up call reuses Mark's existing stages —
    // no new stages needed, the follow-up itself is a Task, not a stage (see brief §7).
    initialInquiry: process.env.GHL_STAGE_INITIAL_INQUIRY || '82d0345f-f2f1-4000-b0dc-0f99cf5f5465', // Initial Inquiry
    hotLead: process.env.GHL_STAGE_HOT_LEAD || '539da3c4-dfdb-4c76-99c6-e58bf677e3e7', // Hot Lead
    siteVisitBooked: process.env.GHL_STAGE_SITE_VISIT_BOOKED || 'd9239a44-4897-429e-861c-e15a5b282139', // Consultation / Site Visit
    proposalSent: process.env.GHL_STAGE_PROPOSAL_SENT || '203aa21c-328f-4558-8c06-bab5c96a2c7d' // Estimation & Proposal
  },
  // Real custom field IDs from the KAP subaccount (confirmed via
  // GET /locations/.../customFields) — reused rather than duplicated.
  customFieldIds: {
    whereInProcess: 'Tep6XTiyH7bQLg9kA9BN', // "Where are you in the process?" -> 'Planning Approved'
    projectType: 'avEmsweYpoB570DY0BDJ',     // "What type of project is this?"
    message: 'r7zkQ3sH3l8loTYccPMX'          // "Message" -> holds the AI-generated project summary
  }
};

// Maps a planning application type onto Mark's existing "What type of
// project is this?" picklist options, so SiteSignal leads slot into his
// existing reporting rather than needing new picklist options.
function mapToProjectType(applicationType = '') {
  const t = applicationType.toLowerCase();
  if (t.includes('extension')) return 'Extensions';
  if (t.includes('kitchen')) return 'Kitchens';
  if (t.includes('landscap') || t.includes('garden')) return 'Garden Design / Landscaping';
  if (t.includes('joinery') || t.includes('barn') || t.includes('listed')) return 'Bespoke Joinery';
  return 'Other';
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_TOKEN}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json'
  };
}

/**
 * Finds an existing contact by address/name or creates a new one, from the
 * planning application's applicant/agent details.
 */
export async function findOrCreateContact(application) {
  const contactPayload = {
    locationId: CONFIG.locationId,
    firstName: application.applicant_name?.split(' ')[0] || 'Unknown',
    lastName: application.applicant_name?.split(' ').slice(1).join(' ') || 'Applicant',
    address1: application.applicant_address || application.site_address,
    tags: ['sitesignal', `council:${application.council_id}`],
    customFields: [
      // Reuses Mark's existing fields rather than creating parallel ones (brief §9).
      { id: CONFIG.customFieldIds.whereInProcess, value: 'Planning Approved' },
      { id: CONFIG.customFieldIds.projectType, value: mapToProjectType(application.application_type) },
      { id: CONFIG.customFieldIds.message, value: `${application.description || ''}\n\nSource: ${application.source_url || 'n/a'}` }
    ]
  };

  const res = await fetch(`${GHL_BASE_URL}/contacts/upsert`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(contactPayload)
  });

  if (!res.ok) {
    throw new Error(`GHL contact upsert failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.contact.id;
}

/**
 * Creates the Opportunity in "New Match" — this creation event is what a GHL
 * Workflow watches to trigger Mark's weekly digest (email/WhatsApp).
 */
export async function createOpportunity(contactId, application, qualification) {
  // Opportunity name carries the AI summary directly, so it's visible on the
  // pipeline card without needing a new custom field. Only the "Message"
  // contact field (set above) and this name were confirmed against Mark's
  // real setup — if Mark wants a dedicated opportunity-level score/summary
  // field later, that's a quick follow-up GET on model=opportunity fields.
  const opportunityPayload = {
    pipelineId: CONFIG.pipelineId,
    locationId: CONFIG.locationId,
    pipelineStageId: CONFIG.stageIds.newMatch,
    contactId,
    name: `${application.site_address} — ${qualification.summary}`,
    status: 'open'
  };

  const res = await fetch(`${GHL_BASE_URL}/opportunities/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(opportunityPayload)
  });

  if (!res.ok) {
    throw new Error(`GHL opportunity create failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.opportunity.id;
}

export { CONFIG as GHL_CONFIG };
