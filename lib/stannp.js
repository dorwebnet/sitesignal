// Stannp print-and-post client. Two supported modes (see brief §8):
//  1. post()   — send a finished, mail-merged PDF; Stannp OCRs the address
//                from the scan zone (our template positions it correctly).
//  2. create() — use a Stannp-hosted template + recipient data (not used in
//                Phase 3 since we render our own PDF, but kept for later).
//
// EU/GB base. API key lives in STANNP_API_KEY (Vercel env only).

const STANNP_BASE = 'https://api-eu1.stannp.com/v1';

function authHeader() {
  // Stannp uses HTTP basic auth with the API key as username, blank password.
  const token = Buffer.from(`${process.env.STANNP_API_KEY}:`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Post a finished letter PDF to be printed and mailed.
 * @param {object} opts
 * @param {string} opts.pdfUrl   publicly-fetchable URL to the rendered PDF
 * @param {boolean} [opts.test]  true = validate + cost only, do not send/charge
 * @param {string} [opts.tags]   e.g. the GHL opportunity id, for reconciliation
 * @returns {Promise<{id:string, cost:string, status:string, pdf:string}>}
 */
export async function post({ pdfUrl, test = true, tags = '' }) {
  const body = new URLSearchParams({
    test: test ? '1' : '0',
    country: 'GB',
    pdf: pdfUrl,
    tags
  });

  const res = await fetch(`${STANNP_BASE}/letters/post`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Stannp post failed: ${JSON.stringify(data)}`);
  }
  return data.data; // { id, cost, status, pdf, ... }
}
