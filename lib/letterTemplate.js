// Builds the print-ready HTML for a Kap Woodwork outreach letter, styled to the
// KAP brand guidelines: gold #FDAE12 on Site Black #050505, Montserrat headers,
// Open Sans body, and the brand "banding" system (dark header -> light body ->
// dark footer). Logo sits on the dark header band per the brand rule that the
// logo must always appear on a dark background.
//
// Output: A4, recipient address in Stannp's OCR scan zone. Designed to be
// posted double-sided in a C5 envelope (page 1 = letter; a static credentials
// reverse is appended separately). FSB member badge is a reserved placeholder
// until Mark supplies the official asset.

// LOGO: the official logo-full.svg carries a black background rect with gold
// text. On the dark header band, use the version with that rect removed
// (transparent) so only the gold wordmark shows — do NOT recolor the text.
const BRAND = {
  gold: '#FDAE12', black: '#050505', charcoal: '#1A1A1C',
  white: '#F9F9FB', ink: '#141414'
};

const KAP = {
  address: '30 Oakwood, Broadmayne, Dorchester, Dorset DT2 8UN',
  phone: '07426 953891',
  email: 'info@kapwoodworkandbuilding.co.uk',
  web: 'kapwoodworkandbuilding.co.uk'
};

function esc(s = '') {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

/**
 * @param {object} o
 * @param {string} o.recipientName
 * @param {string} o.recipientAddressLines  newline-separated
 * @param {string[]} o.bodyParagraphs        AI-generated (lib/letter.js)
 * @param {string} o.dateStr
 * @param {string} o.qrWebsiteDataUri
 * @param {string} o.qrFacebookDataUri
 * @param {string} [o.fsbLogoDataUri]        official FSB member badge (once supplied)
 * @returns {string} full HTML
 */
export function buildLetterHtml({
  recipientName = 'The Owner', recipientAddressLines = '', bodyParagraphs = [],
  dateStr, qrWebsiteDataUri, qrFacebookDataUri, fsbLogoDataUri
}) {
  const body = bodyParagraphs.map((p) => `<p>${esc(p)}</p>`).join('\n');
  const addr = esc(recipientAddressLines).replace(/\n/g, '<br>');
  const fsb = fsbLogoDataUri
    ? `<img src="${fsbLogoDataUri}" style="height:52px">`
    : `<div class="fsb"><b>FSB</b><span>MEMBER LOGO</span></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4;margin:0} *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Open Sans',Arial,sans-serif;color:${BRAND.ink}}
    .page{width:100%;min-height:297mm;display:flex;flex-direction:column;background:${BRAND.white}}
    .top{background:${BRAND.black};color:${BRAND.white};padding:12mm 18mm 9mm}
    .body{flex:1;padding:11mm 18mm}
    .foot{background:${BRAND.black};color:#c9c9cc;padding:7mm 18mm}
    .hrow{display:flex;justify-content:space-between;align-items:center}
    .logo{display:flex;align-items:center;gap:14px}
    .logo .mark{font-family:Georgia,serif;color:${BRAND.gold};font-size:34pt;font-weight:700;letter-spacing:3px;line-height:1}
    .logo .div{width:2px;height:34px;background:#4a4a4a}
    .logo .word{font-family:'Montserrat',sans-serif;font-weight:700;color:${BRAND.white};font-size:10.5pt;letter-spacing:2px;line-height:1.25;text-transform:uppercase}
    .hc{text-align:right;font-family:'Montserrat',sans-serif;font-size:7.6pt;color:#b9b9bc;line-height:1.7}
    .hc b{color:${BRAND.gold};font-weight:600}
    .rcpt{font-family:'Montserrat',sans-serif;font-size:10.5pt;line-height:1.5;margin-bottom:7mm;color:#222}
    .date{text-align:right;font-family:'Montserrat',sans-serif;font-size:9.5pt;color:#555;margin-bottom:6mm}
    .letter p{font-size:10.8pt;line-height:1.62;margin-bottom:10px}
    .sign{margin-top:8mm;font-size:10.8pt}
    .sign .name{font-family:'Montserrat',sans-serif;font-weight:700;font-size:11pt;margin-top:12mm}
    .sign .role{font-family:'Montserrat',sans-serif;font-size:8.5pt;color:#666;letter-spacing:.5px;text-transform:uppercase}
    .fg{display:flex;justify-content:space-between;align-items:center}
    .fa{font-family:'Montserrat',sans-serif;font-size:7.6pt;line-height:1.7}
    .fa .lead{color:${BRAND.gold};font-weight:600;text-transform:uppercase;letter-spacing:1px;font-size:7.4pt}
    .fb{display:flex;align-items:center;gap:12px}
    .qr{background:#fff;padding:5px;border-radius:3px;text-align:center}
    .qr img{width:52px;height:52px;display:block}
    .qr span{display:block;font-family:'Montserrat',sans-serif;font-size:5.6pt;color:#333;margin-top:2px}
    .fsb{width:74px;height:52px;border:1.4px dashed ${BRAND.gold};border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${BRAND.gold};font-family:'Montserrat',sans-serif}
    .fsb b{font-size:11pt;font-weight:800;letter-spacing:1px}.fsb span{font-size:5pt;margin-top:2px}
  </style></head><body><div class="page">
    <div class="top"><div class="hrow">
      <div class="logo"><span class="mark">KAP</span><span class="div"></span><span class="word">Woodwork &amp;<br>Building Services</span></div>
      <div class="hc"><b>${KAP.phone}</b><br>${KAP.email}<br>${KAP.web}<br>${esc(KAP.address)}</div>
    </div></div>
    <div class="body">
      <div class="rcpt">${esc(recipientName)}<br>${addr}</div>
      <div class="date">${esc(dateStr)}</div>
      <div class="greeting" style="font-size:11pt;margin-bottom:8px">Dear Homeowner,</div>
      <div class="letter">${body}</div>
      <div class="sign">Kind regards,<div class="name">Mark Storey</div><div class="role">KAP Woodwork &amp; Building Services</div></div>
    </div>
    <div class="foot"><div class="fg">
      <div class="fa"><span class="lead">Building better spaces for Dorset homes</span><br>${esc(KAP.address)}<br>${KAP.email} &middot; ${KAP.web}</div>
      <div class="fb">
        <div class="qr"><img src="${qrWebsiteDataUri}"><span>OUR WORK</span></div>
        <div class="qr"><img src="${qrFacebookDataUri}"><span>FACEBOOK</span></div>
        ${fsb}
      </div>
    </div></div>
  </div></body></html>`;
}

export { KAP, BRAND };
