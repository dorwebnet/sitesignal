// Hard filters — cheap, deterministic, run before any AI call.
// Now driven primarily by PlanIt's structured `app_type` category (verified
// against real Dorset data), with a description-keyword layer as backup.
// Radius is handled upstream in planit.js, so this focuses on work-type.

// PlanIt app_type categories to drop outright (not building work for Kap).
const EXCLUDE_TYPES = new Set(['Trees', 'Advertising', 'Amendment']);

// PlanIt app_type categories that ARE genuine building work.
//   Full     - householder/full applications (extensions, new builds, conversions)
//   Heritage - listed building / conservation-area works (joinery, restoration)
//   Outline  - early-stage but a real future-build signal
//   Conditions - discharge of conditions => project about to START on site (high intent)
const INCLUDE_TYPES = new Set(['Full', 'Heritage', 'Outline', 'Conditions']);

// Description-level exclusions — genuinely-always-noise only. NB: Lawful
// Development Certificates and prior-approval applications are deliberately NOT
// excluded here — they're the planning-portal footprint of permitted-development
// work (garden rooms, outbuildings, larger extensions) which is core Kap scope.
// The AI pass judges whether an LDC is a real "about to build" lead.
const EXCLUDE_KEYWORDS = [
  'tree preservation', 'tree works', 'fell ', 'crown lift', 'pollard',
  'advertisement', 'illuminated sign', 'fascia sign'
];

// Description-level positive signals — the full Kap service range: bespoke
// joinery/carpentry, roof & loft conversions, extensions, and landscaping
// including garden rooms and outbuildings.
const INCLUDE_KEYWORDS = [
  // building / extensions / conversions
  'extension', 'new dwelling', 'new build', 'change of use', 'conversion',
  'loft', 'roof', 'dormer', 'annexe', 'annex', 'storey',
  // joinery / carpentry / heritage
  'listed building', 'oak frame', 'oak-frame', 'timber frame', 'joinery',
  'porch', 'orangery', 'sunroom', 'bi-fold', 'bi fold', 'bifold', 'sash',
  // garden rooms / outbuildings / landscaping
  'garden room', 'outbuilding', 'garage', 'barn', 'summerhouse', 'studio',
  'landscaping', 'terrace', 'patio', 'decking', 'pergola', 'veranda',
  'hard landscaping', 'garden office', 'lawful development'
];

/**
 * @param {object} application - normalised record from planit.js
 * @returns {{ passed: boolean, reason: string }}
 */
export function applyHardFilter(application) {
  const type = application.application_type || '';
  const text = `${application.description || ''} ${application.application_subtype || ''}`.toLowerCase();

  // 1. Structured type exclusion first — cheapest, most reliable.
  if (EXCLUDE_TYPES.has(type)) {
    return { passed: false, reason: `Excluded PlanIt type: ${type}` };
  }

  // 2. Description-level exclusion (catch noise mislabelled as building work).
  const excludeHit = EXCLUDE_KEYWORDS.find((kw) => text.includes(kw));
  if (excludeHit) {
    return { passed: false, reason: `Excluded by description: "${excludeHit.trim()}"` };
  }

  // 3. Positive path: qualifying structured type OR a strong description signal.
  if (INCLUDE_TYPES.has(type)) {
    return { passed: true, reason: `Qualifying PlanIt type: ${type}` };
  }
  const includeHit = INCLUDE_KEYWORDS.find((kw) => text.includes(kw));
  if (includeHit) {
    return { passed: true, reason: `Qualifying work keyword: "${includeHit.trim()}"` };
  }

  return { passed: false, reason: `No qualifying signal (type: ${type || 'none'})` };
}
