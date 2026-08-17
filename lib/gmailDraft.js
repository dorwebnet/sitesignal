// Creates a weekly leads DRAFT in alex@dorweb.net's Gmail (draft only, never sent
// — Alex reviews and sends). Runs inside the Monday cron after the scan.
//
// Auth: Gmail API needs an OAuth2 refresh token for the dorweb Google Workspace
// account, with the gmail.compose scope. Store GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET
// / GMAIL_REFRESH_TOKEN in Vercel env. (One-time consent by Alex.)

import { google } from 'googleapis';

function gmailClient() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  oauth2.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

// Build the same email body we send manually, with portal links per lead.
export function buildLeadsEmail(qualifying) {
  const lines = qualifying.map((q, i) =>
    `${i + 1}. ${q.address} (${q.distance_miles} mi) — ${q.summary}\n   ${q.source}`
  );
  return [
    'Hi Mark,',
    '',
    "Here's this week's batch from the planning scan — fresh projects near you that look a good fit for KAP. I've added the planning portal link for each so you can check the details yourself. Reply with any you'd like to drop; anything you leave in, I'll get printed and posted.",
    '',
    ...lines,
    '',
    "The scan set aside the usual noise automatically and checked against everything we've already posted, so none are repeats.",
    '',
    'Reply with your yes (or edits) and I\'ll run the batch. You\'re only charged per letter actually sent, invoiced month end.',
    '',
    'Cheers,',
    'Alex'
  ].join('\n');
}

export async function createLeadsDraft({ to, subject, body }) {
  const gmail = gmailClient();
  const raw = Buffer.from(
    `To: ${to.join(', ')}\r\nSubject: ${subject}\r\n\r\n${body}`
  ).toString('base64url');
  const res = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw } }
  });
  return res.data.id;
}
