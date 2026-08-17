// TODO: this is a placeholder parser. Once we've registered the Saved Search /
// Notified Applications accounts on Dorset Council and BCP Council (brief §4),
// we need to capture a handful of real notification emails and write the
// actual field extraction against their real format — Idox notification
// emails typically include the application reference, address, and a link
// back to the application detail page, but exact layout varies by council
// theme/configuration.
//
// Until then, this does a best-effort regex extraction so the rest of the
// pipeline (filters → qualify → GHL) can be built and tested end-to-end.

const REF_PATTERN = /reference[:\s]+([A-Z0-9/._-]+)/i;
const ADDRESS_PATTERN = /address[:\s]+(.+)/i;
const TYPE_PATTERN = /(?:application )?type[:\s]+(.+)/i;
const LINK_PATTERN = /(https?:\/\/[^\s]+)/i;

export function parseNotificationEmail({ councilId, subject, body }) {
  const refMatch = body.match(REF_PATTERN);
  const addressMatch = body.match(ADDRESS_PATTERN);
  const typeMatch = body.match(TYPE_PATTERN);
  const linkMatch = body.match(LINK_PATTERN);

  return {
    council_id: councilId,
    application_reference: refMatch?.[1]?.trim() || null,
    site_address: addressMatch?.[1]?.trim() || null,
    application_type: typeMatch?.[1]?.trim() || null,
    description: body.slice(0, 1000), // full body kept for AI qualification context
    source_url: linkMatch?.[1]?.trim() || null,
    received_date: new Date().toISOString().slice(0, 10)
  };
}
