// Weekly leads notification to WhatsApp via GoHighLevel's native WhatsApp channel.
//
// IMPORTANT REALITY CHECK: WhatsApp's Business API (which GHL uses) sends 1:1
// messages to a contact's number. Meta does NOT support posting into a shared
// WhatsApp *group* via API — so the reliable path is a direct WhatsApp message
// to Mark's number, not the KAP group chat. Options if it must reach the group:
//   - send 1:1 to Mark, he forwards to the group (simplest), or
//   - use a WhatsApp Channel/broadcast (limited), or
//   - accept the digest email as the shared record and keep WhatsApp as Mark's ping.
//
// This sends a 1:1 WhatsApp message to Mark via GHL's conversation API.

const GHL_BASE = 'https://services.leadconnectorhq.com';

export async function sendWhatsAppSummary({ contactId, count, approvalUrl }) {
  const message =
    `KAP planning leads — ${count} new project${count === 1 ? '' : 's'} this week. ` +
    `Review & approve which to post: ${approvalUrl}`;

  const res = await fetch(`${GHL_BASE}/conversations/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GHL_API_TOKEN}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'WhatsApp', contactId, message })
  });
  if (!res.ok) throw new Error(`GHL WhatsApp failed: ${res.status} ${await res.text()}`);
  return res.json();
}
