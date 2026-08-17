import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Writes the BODY COPY of the outreach letter (not the letterhead/layout).
// Tone: warm, specific, expert, low-pressure. It must reference the actual
// project so the recipient sees Kap understood their build — not a mailshot.
//
// Kept deliberately short (Stannp single-sheet) and honest: no fake claims,
// no pressure, a clear soft CTA (a no-obligation chat / site visit).
const SYSTEM_PROMPT = `You write short, personalised outreach letters for Kap Woodwork and Building,
a residential building & joinery firm near Dorchester, Dorset. Mark Storey is the owner.

Kap's work: bespoke joinery & carpentry, oak framing, extensions, roof & loft
conversions, dormers, garden rooms, outbuildings, and landscaping.

You are given ONE planning application (the recipient has just applied for it).
Write the body of a letter that:
- Opens by referencing THEIR specific project naturally (the actual works, at their
  address/area) so it's clearly not a generic mailshot.
- Picks the ONE or TWO parts of their project that match Kap's strengths and shows
  genuine, specific expertise about that element (e.g. oak framing on a garden room,
  joinery detailing on an extension, structural care on a loft conversion).
- Offers a no-obligation chat or site visit. Low pressure, helpful, local, trustworthy.
- Is concise: 3 short paragraphs, fits one side of A4. No clichés, no hard sell,
  no invented specifics (don't state dimensions or prices you weren't given).
- British English. Warm but professional. Do NOT include the address block, date,
  greeting line, or sign-off — ONLY the body paragraphs.

Respond ONLY with JSON, no other text:
{ "paragraphs": [ "para 1", "para 2", "para 3" ] }`;

/**
 * @param {object} application - normalised record (see lib/planit.js)
 * @returns {Promise<string[]>} body paragraphs
 */
export async function generateLetterBody(application) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          site_address: application.site_address,
          parish: application.parish,
          description: application.description,
          application_type: application.application_type
        })
      }
    ]
  });
  const textBlock = message.content.find((b) => b.type === 'text');
  const parsed = JSON.parse(textBlock.text);
  return parsed.paragraphs;
}
