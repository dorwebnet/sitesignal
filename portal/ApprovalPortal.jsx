import React, { useState, useEffect, useMemo } from "react";

// SiteSignal — weekly approval portal (prototype).
// Review this week's planning leads, approve/tweak each letter, and download the
// Stannp-ready CSV. Persists approvals + edits across reloads via window.storage.
// Manual Stannp for now (download CSV → upload to Stannp yourself); the hosted
// version adds client login + optional Stannp API push.

const GOLD = "#FDAE12", BLACK = "#050505", CHAR = "#141416", CREAM = "#F3ECDD";
const GREEN = "#3E8C5A", MUTE = "#8A8A8D", LINE = "#2A2A2D";

const COST = 0.92;   // Stannp per letter (2nd class, double-sided), ex VAT
const CHARGE = 2.50; // charged to KAP per letter

const WEEK = "Week of 20 July 2026";
const DATE_STR = "20th July 2026";

const LEADS = [
  { id: "P/HOU/2026/03717", addr1: "Greystones, Nottington Lane", city: "Weymouth", pc: "DT3 4BJ",
    dist: 4.8, summary: "Extension to create a garden room + raising the garage roof",
    portal: "https://planning.dorsetcouncil.gov.uk/plandisp.aspx?recno=429913",
    body: [
      "I noticed your recent plans in Weymouth to extend and create a garden room, along with raising the garage roof. It looks like a lovely way to gain a bright, usable space, and as a local, family-run builder just up the road in Broadmayne I wanted to introduce ourselves.",
      "Garden rooms are some of our favourite work — the joinery, the glazing, and how the space opens onto the garden are where the quality really shows. Tie that in with the garage roof and it makes for one coordinated project, which is exactly the kind of thing we've been doing across Dorset for over 30 years.",
      "There's no hard sell here — just an offer of a no-obligation chat once you're ready to think about the build. You can see examples of our work using the codes on this letter, or reach me any time on the details above."
    ] },
  { id: "P/HOU/2026/03842", addr1: "Seagrove, Main Road", city: "West Lulworth", pc: "BH20 5RJ",
    dist: 7.9, summary: "Raised patio / deck to the rear garden (landscaping)",
    portal: "https://planning.dorsetcouncil.gov.uk/plandisp.aspx?recno=430061",
    body: [
      "I noticed your recent plans in West Lulworth for a raised patio and deck to the rear garden. It's the kind of project that really changes how you enjoy outdoor space, and as a local, family-run builder we wanted to introduce ourselves.",
      "Good hard landscaping is all in the detail — levels, drainage, and timber that's built to last. With our landscaping side we handle decks, terraces and garden levels as one tidy job rather than several trades to juggle.",
      "No pressure at all — just an offer of a no-obligation chat once you're ready. You can see examples of our work using the codes on this letter, or reach me any time on the details above."
    ] },
  { id: "P/HOU/2026/03588", addr1: "Jasmine Cottage, The Square", city: "Cattistock", pc: "DT2 0JD",
    dist: 10.9, summary: "Remove rear porch, new single-storey rear extension",
    portal: "https://planning.dorsetcouncil.gov.uk/plandisp.aspx?recno=429759",
    body: [
      "I noticed your recent plans at Cattistock to remove the rear porch and build a single-storey rear extension. It's a smart way to gain proper space, and as a local, family-run builder in Broadmayne I wanted to introduce ourselves.",
      "The details that matter most later are the ones you don't see — how the new roof ties into the existing structure, and how the finish sits with the character of the cottage. That careful carpentry is exactly what we do, working closely with you from first sketch to final sign-off.",
      "There's no hard sell here — just an offer of a no-obligation chat once you're ready. You can see examples of our work using the codes on this letter, or reach me any time on the details above."
    ] },
  { id: "P/FUL/2026/03847", addr1: "15 & 18 Shadrach", city: "Burton Bradstock", pc: "DT6 4QF",
    dist: 14.5, summary: "New porch, side and rear extensions",
    portal: "https://planning.dorsetcouncil.gov.uk/plandisp.aspx?recno=429743",
    body: [
      "I noticed your recent plans in Burton Bradstock for a new porch along with side and rear extensions. It looks like a well-considered project, and as a family-run building firm we wanted to introduce ourselves before the work begins.",
      "The porch is exactly the sort of thing we most enjoy — we do a lot of bespoke timber porches, and they set the tone for the whole front of a house. On the extensions, the joinery and how the new work meets the old are where careful carpentry earns its keep.",
      "No pressure at all — just an offer of a no-obligation chat once you're ready. You can see examples of our work using the codes on this letter, or reach me any time on the details above."
    ] },
  { id: "P/HOU/2026/03852", addr1: "8 Barr Lane", city: "Burton Bradstock", pc: "DT6 4PX",
    dist: 14.7, summary: "Rear first-floor extension",
    portal: "https://planning.dorsetcouncil.gov.uk/plandisp.aspx?recno=430070",
    body: [
      "I noticed your recent plans in Burton Bradstock for a rear first-floor extension. Adding space upstairs is a great way to get more from a home without losing garden, and as a local, family-run builder we wanted to introduce ourselves.",
      "A first-floor extension lives or dies on the structural detail and the finish — how it ties into the existing roof and walls so it feels like it was always there. That's exactly the kind of work we've been doing across Dorset for over 30 years.",
      "There's no hard sell here — just an offer of a no-obligation chat once you're ready. You can see examples of our work using the codes on this letter, or reach me any time on the details above."
    ] },
  { id: "P/HOU/2026/03509", addr1: "Delapre House, St Andrews Road", city: "Bridport", pc: "DT6 3BG",
    dist: 15.9, summary: "Single-storey side extension",
    portal: "https://planning.dorsetcouncil.gov.uk/plandisp.aspx?recno=429671",
    body: [
      "I noticed your recent plans in Bridport for a single-storey side extension. It's a lovely way to open up the ground floor, and as a family-run building firm we wanted to introduce ourselves before the work begins.",
      "The joinery around the glazing and how the new work blends with the existing house are where the quality really shows, and that's exactly what we've been doing across Dorset for over 30 years — working closely with you from first sketch to final sign-off.",
      "No pressure at all — just an offer of a no-obligation chat once you're ready. You can see examples of our work using the codes on this letter, or reach me any time on the details above."
    ] },
  { id: "P/26/03270/CLP", addr1: "3 Sandy Lane", city: "Poole", pc: "BH16 5EH",
    dist: 16.6, summary: "Demolish garage & build new (permitted development, about to start)",
    portal: "https://planning.bcpcouncil.gov.uk/Planning/Display/P/26/03270/CLP",
    body: [
      "I noticed your recent plans at West Parley to demolish the existing garage and build new. A lawful development certificate usually means a project that's ready to go, so as a local, family-run builder we wanted to introduce ourselves at the right moment.",
      "Rebuilding an outbuilding properly — good foundations, insulation and joinery — makes all the difference to how it looks and lasts. It's exactly the kind of work we've been handling across Dorset for over 30 years.",
      "There's no hard sell here — just an offer of a no-obligation chat once you're ready. You can see examples of our work using the codes on this letter, or reach me any time on the details above."
    ] },
  { id: "P/VOL/2026/03781", addr1: "Church Farm, Road to Beer Hackett", city: "Beer Hackett", pc: "DT9 6QT",
    dist: 16.7, summary: "Single-storey rear extension with rooflights",
    portal: "https://planning.dorsetcouncil.gov.uk/plandisp.aspx?recno=429991",
    body: [
      "I noticed your recent plans at Beer Hackett for a single-storey rear extension with new rooflights. Bringing light into a home like that makes a real difference, and as a local, family-run builder we wanted to introduce ourselves.",
      "The rooflights and how the new roof structure is framed are exactly the details we take care over, so the finished space feels like it was always part of the house. That's the kind of work we've been doing across Dorset for over 30 years.",
      "No pressure at all — just an offer of a no-obligation chat once you're ready. You can see examples of our work using the codes on this letter, or reach me any time on the details above."
    ] },
];

const KEY = "sitesignal:week:2026-07-20";

export default function App() {
  const [state, setState] = useState(() =>
    Object.fromEntries(LEADS.map((l) => [l.id, { status: "pending", body: l.body }]))
  );
  const [mtd, setMtd] = useState(7); // month-to-date letters already sent (this week's prior batch)
  const [open, setOpen] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(KEY);
        if (r && r.value) { const p = JSON.parse(r.value); setState(p.state); setMtd(p.mtd ?? 7); }
      } catch (e) { /* first run */ }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set(KEY, JSON.stringify({ state, mtd })).catch(() => {});
  }, [state, mtd, loaded]);

  const set = (id, patch) => setState((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const approved = LEADS.filter((l) => state[l.id]?.status === "approved");
  const rejected = LEADS.filter((l) => state[l.id]?.status === "rejected");
  const pending = LEADS.filter((l) => (state[l.id]?.status ?? "pending") === "pending");

  const totals = useMemo(() => {
    const n = approved.length;
    return { n, cost: n * COST, charge: n * CHARGE, margin: n * (CHARGE - COST) };
  }, [approved]);

  const downloadCSV = () => {
    const cols = ["date","name","address1","address2","city","postcode","body1","body2","body3","planning_ref","portal_link"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = approved.map((l) => {
      const b = state[l.id].body;
      return [DATE_STR,"The Homeowner",l.addr1,"",l.city,l.pc,b[0],b[1],b[2],l.id,l.portal].map(esc).join(",");
    });
    const csv = [cols.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "kap_stannp_letters.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", background: BLACK, color: CREAM, fontFamily: "'Montserrat',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Montserrat:wght@400;500;600;700&display=swap');
        .serif{font-family:'Cormorant Garamond',Georgia,serif}
        .eye{letter-spacing:.2em;text-transform:uppercase}
        .card{transition:border-color .2s,background .2s}
        .btn{cursor:pointer;border:none;font-family:inherit;transition:opacity .15s}
        .btn:hover{opacity:.85}
        .lnk{color:${GOLD};text-decoration:none;border-bottom:1px solid ${LINE}}
        .lnk:hover{border-color:${GOLD}}
        textarea{font-family:inherit}
        *{box-sizing:border-box}`}</style>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${LINE}`, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="serif" style={{ color: GOLD, fontSize: 30, letterSpacing: 3, lineHeight: 1 }}>KAP</span>
          <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 16 }}>
            <div className="eye" style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>SiteSignal</div>
            <div style={{ fontSize: 12, color: MUTE }}>Weekly letter approvals</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="eye" style={{ fontSize: 10, color: MUTE }}>{WEEK}</div>
          <div style={{ fontSize: 13 }}>Letters this month: <span className="serif" style={{ color: GOLD, fontSize: 20 }}>{mtd + totals.n}</span></div>
        </div>
      </header>

      {/* Intro */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 28px 8px" }}>
        <h1 className="serif" style={{ fontSize: 40, lineHeight: 1.05, margin: 0, color: CREAM }}>
          {pending.length > 0 ? <>You have <span style={{ color: GOLD }}>{pending.length} project{pending.length===1?"":"s"}</span> to review.</> : <>All caught up.</>}
        </h1>
        <p style={{ color: MUTE, fontSize: 14, maxWidth: 640, marginTop: 10 }}>
          Approve the letters you want posted this week, tweak the wording if you like, then download the CSV to place the order with Stannp. Nothing is sent until you download and place the order.
        </p>
      </div>

      {/* Leads */}
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "16px 28px 160px" }}>
        {LEADS.map((l, i) => {
          const st = state[l.id] ?? { status: "pending", body: l.body };
          const isOpen = open === l.id;
          const border = st.status === "approved" ? GREEN : st.status === "rejected" ? "#7a3b3b" : LINE;
          return (
            <div key={l.id} className="card" style={{ border: `1px solid ${border}`, borderRadius: 8, marginBottom: 14, background: CHAR, overflow: "hidden", opacity: st.status === "rejected" ? 0.55 : 1 }}>
              <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ minWidth: 240, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span className="eye" style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="serif" style={{ fontSize: 22, color: CREAM }}>{l.addr1}</span>
                  </div>
                  <div style={{ fontSize: 13, color: MUTE, marginTop: 2 }}>{l.city} · {l.pc} · <span style={{ color: CREAM }}>{l.dist} mi</span></div>
                  <div style={{ fontSize: 14, marginTop: 8, color: CREAM }}>{l.summary}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 12 }}>
                    <a className="lnk" href={l.portal} target="_blank" rel="noreferrer">View on planning portal ↗</a>
                    <button className="btn" onClick={() => setOpen(isOpen ? null : l.id)} style={{ background: "none", color: MUTE, padding: 0, borderBottom: `1px solid ${LINE}` }}>{isOpen ? "Hide letter" : "Preview / edit letter"}</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
                  {st.status === "approved" ? (
                    <span className="eye" style={{ color: GREEN, fontSize: 11, fontWeight: 700 }}>✓ Approved</span>
                  ) : st.status === "rejected" ? (
                    <span className="eye" style={{ color: "#b06a6a", fontSize: 11, fontWeight: 700 }}>Skipped</span>
                  ) : null}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => set(l.id, { status: st.status === "approved" ? "pending" : "approved" })}
                      style={{ background: st.status === "approved" ? "transparent" : GOLD, color: st.status === "approved" ? GOLD : BLACK, border: `1px solid ${GOLD}`, padding: "8px 16px", borderRadius: 5, fontWeight: 700, fontSize: 12 }}>
                      {st.status === "approved" ? "Undo" : "Approve"}
                    </button>
                    <button className="btn" onClick={() => set(l.id, { status: st.status === "rejected" ? "pending" : "rejected" })}
                      style={{ background: "transparent", color: MUTE, border: `1px solid ${LINE}`, padding: "8px 14px", borderRadius: 5, fontSize: 12 }}>
                      Skip
                    </button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${LINE}`, padding: "18px 20px", background: BLACK }}>
                  <div className="eye" style={{ fontSize: 10, color: MUTE, marginBottom: 10 }}>Letter body — edit if you like</div>
                  {st.body.map((para, pi) => (
                    <textarea key={pi} value={para}
                      onChange={(e) => { const nb = [...st.body]; nb[pi] = e.target.value; set(l.id, { body: nb }); }}
                      style={{ width: "100%", background: CHAR, color: CREAM, border: `1px solid ${LINE}`, borderRadius: 6, padding: "10px 12px", fontSize: 13, lineHeight: 1.5, marginBottom: 8, minHeight: 72, resize: "vertical" }} />
                  ))}
                  <div style={{ fontSize: 11, color: MUTE }}>Greeting, sign-off, letterhead and reverse side are added automatically from the KAP template.</div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Sticky summary bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: CHAR, borderTop: `1px solid ${GOLD}`, padding: "14px 28px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            <Stat label="Approved" value={totals.n} big />
            <Stat label="Est. Stannp cost" value={`£${totals.cost.toFixed(2)}`} />
            <Stat label="Charge to KAP" value={`£${totals.charge.toFixed(2)}`} />
            <Stat label="Month to date" value={`${mtd + totals.n} letters`} />
          </div>
          <button className="btn" disabled={totals.n === 0} onClick={downloadCSV}
            style={{ background: totals.n === 0 ? LINE : GOLD, color: totals.n === 0 ? MUTE : BLACK, border: "none", padding: "13px 26px", borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: totals.n === 0 ? "not-allowed" : "pointer" }}>
            Download CSV for Stannp ({totals.n})
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, big }) {
  return (
    <div>
      <div className="eye" style={{ fontSize: 9, color: MUTE, fontWeight: 600 }}>{label}</div>
      <div className="serif" style={{ fontSize: big ? 28 : 20, color: big ? GOLD : CREAM, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
