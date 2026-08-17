import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You qualify UK planning applications as sales leads for Kap Woodwork and
Building, a residential building and joinery firm near Dorchester, Dorset.

KAP'S FULL SERVICE RANGE (all in scope):
- Bespoke joinery & carpentry, oak framing, timber work, staircases, doors, windows
- Extensions (single & two-storey), and structural building work
- Roof & loft conversions, dormers
- Garden rooms, garden offices, outbuildings, summerhouses, studios
- Landscaping and hard landscaping (terraces, patios, pergolas, verandas)
- Listed building / heritage work involving joinery and building

STRONG LEADS (score 0.7-1.0):
- Extensions, loft/roof conversions, garden rooms, outbuildings, barn conversions
- Change of use / conversions to dwellings (real build work)
- Listed-building or heritage work with a joinery/build element
- Lawful Development Certificates or Prior Approval for PROPOSED outbuildings,
  garden rooms or extensions — these signal a permitted-development project the
  owner is about to build, so they're genuine leads even without full permission.

WEAK / REJECT (score 0.0-0.3, qualified=false):
- Like-for-like window/door swaps (esp. uPVC), single rooflights, small repairs
- Air source heat pumps, solar panels, EV chargers, drainage-only, fences/gates
- Pure signage/advertising, tree works, agricultural/commercial-only schemes
- Retrospective/"existing" lawful development certs (already built)
- Non-material amendments and condition-discharge admin on existing schemes

IMPORTANT CONTEXT: many of Kap's ideal jobs (small garden rooms, modest
extensions, decking) are permitted development and may never appear here at all —
so when something relevant DOES appear, weight it as a meaningful signal. Judge
by the actual described work, not the application category label.

Respond ONLY with JSON, no other text:
{
  "qualified": boolean,
  "score": number,        // 0.0-1.0 confidence this is worth Mark contacting
  "summary": string,      // one plain-English sentence for Mark's digest, e.g.
                           // "Single-storey rear extension + garden room, Owermoigne"
  "reasoning": string      // brief internal note (not shown to Mark)
}`;

/**
 * @param {object} application - normalised record (see lib/planit.js)
 * @returns {Promise<{qualified:boolean, score:number, summary:string, reasoning:string}>}
 */
export async function qualifyApplication(application) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          application_type: application.application_type,
          application_subtype: application.application_subtype,
          description: application.description,
          site_address: application.site_address
        })
      }
    ]
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  try {
    return JSON.parse(textBlock.text);
  } catch (err) {
    throw new Error(`Failed to parse qualification response: ${textBlock.text}`);
  }
}
