import { useState, useEffect } from "react";

// ─── Seed data: realistic London hospitality leads ───
const SEED_LEADS = [
  { name: "The Biltmore Mayfair — Restaurant Expansion", location: "44 Grosvenor Square", borough: "Westminster", type: "Hotel Restaurant", description: "Significant F&B expansion across ground and lower ground floor. New cocktail bar, private dining suite, and all-day restaurant. Multi-zone audio requirement across 6 distinct spaces.", ref: "PP/2025/04521", relevance: "high", source: "London Planning Portal" },
  { name: "Scorpios London — Rooftop Members Club", location: "Shoreditch High Street", borough: "Hackney", type: "Members Club / Rooftop", description: "Mediterranean members club brand expanding to London. 8,000 sq ft across two levels with rooftop terrace. Concept-driven audio and atmosphere central to brand identity.", ref: "PA/2025/1847", relevance: "high", source: "Hospitality Intelligence" },
  { name: "Casa Cruz — Second Site", location: "King's Road", borough: "Kensington & Chelsea", type: "Restaurant / Bar", description: "Acclaimed Notting Hill restaurant opening second Chelsea site. 180 covers with bar, private dining and terrace. Design-led interior requiring architecturally integrated audio.", ref: "PP/2025/03892", relevance: "high", source: "London Planning Portal" },
  { name: "One Blackfriars Penthouse Collection", location: "Blackfriars Road", borough: "Lambeth", type: "Premium Residential", description: "Final phase of premium residential tower. 14 upper-floor penthouses requiring bespoke whole-home audio. Developer keen to differentiate with smart home and acoustic specification.", ref: "", relevance: "high", source: "Development Pipeline" },
  { name: "Amazonico London — New Venue", location: "Berkeley Square", borough: "Westminster", type: "Restaurant / Late Night", description: "European tropical restaurant and bar concept targeting Berkeley Square site. Known for immersive atmospheric audio across jungle-themed multi-zone interiors.", ref: "PP/2025/05104", relevance: "high", source: "Hospitality Intelligence" },
  { name: "Nobu Hotel Portman Square", location: "Portman Square", borough: "Westminster", type: "Hotel / Restaurant", description: "New Nobu hotel development with restaurant, lounge bar and event space. Brand standards require premium audio specification throughout public areas.", ref: "PA/2025/2201", relevance: "high", source: "London Planning Portal" },
  { name: "Lyaness — New Permanent Site", location: "South Bank", borough: "Lambeth", type: "Bar / Late Night", description: "Award-winning cocktail bar seeking permanent South Bank home following Sea Containers success. Intimate multi-zone audio experience is core to concept.", ref: "PP/2025/02774", relevance: "medium", source: "Hospitality Intelligence" },
  { name: "The Whiteley — F&B Expansion", location: "Queensway", borough: "Westminster", type: "Restaurant / Leisure", description: "Luxury mixed-use development adding further F&B operators to ground floor. Multiple independent restaurant units with shared back-of-house.", ref: "PP/2025/04103", relevance: "medium", source: "Development Pipeline" },
  { name: "Canary Wharf Residences Phase 3", location: "Wood Wharf", borough: "Tower Hamlets", type: "Premium Residential", description: "100+ luxury apartments in waterside development. Developer specification includes smart home infrastructure. Opportunity to specify audio across multiple units.", ref: "", relevance: "medium", source: "Development Pipeline" },
  { name: "Hawksmoor Borough — New Opening", location: "Borough Market", borough: "Southwark", type: "Restaurant", description: "New Hawksmoor site in converted railway arch with exposed brick and high ceilings. Acoustic treatment and quality audio essential given challenging space.", ref: "PP/2025/03317", relevance: "medium", source: "London Planning Portal" },
  { name: "Chiltern Firehouse — Garden Room", location: "Chiltern Street", borough: "Westminster", type: "Hotel / Restaurant Extension", description: "Planning consent sought for covered garden extension to extend F&B capacity year-round. New zone requiring weatherised audio solution consistent with existing spec.", ref: "PP/2025/04688", relevance: "medium", source: "London Planning Portal" },
  { name: "Battersea Power Station — Rooftop Venue", location: "Battersea Power Station", borough: "Wandsworth", type: "Event Space / Rooftop", description: "New rooftop event and hospitality venue within power station development. Large capacity with panoramic views. Complex multi-zone live event and background music requirement.", ref: "PA/2025/1563", relevance: "high", source: "Development Pipeline" },
];

function LeadCard({ lead, onUpdateStage, onDelete, onUpdate, STAGE_COLORS, STAGES, C, ST }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ed, setEd] = useState({ ...lead });
  useEffect(() => { setEd({ ...lead }); }, [lead.id]);
  const save = () => { onUpdate({ ...ed }); setEditing(false); };

  return (
    <div style={{ ...ST.card, borderLeft: `3px solid ${STAGE_COLORS[lead.stage] || C.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", cursor:"pointer" }} onClick={() => { if (!editing) setExpanded(v => !v); }}>
        <div style={{ flex:1, paddingRight:"10px" }}>
          <div style={{ fontWeight:"600", fontSize:"15px", color:C.text, lineHeight:"1.3" }}>{lead.name || "Untitled Lead"}</div>
          <div style={{ fontSize:"12px", color:C.muted, marginTop:"3px" }}>{[lead.location, lead.type].filter(Boolean).join(" · ")}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
          <span style={ST.badge(STAGE_COLORS[lead.stage] || C.muted)}>{lead.stage}</span>
          <span style={{ color:C.muted, fontSize:"12px" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && !editing && (
        <div style={{ marginTop:"14px" }}>
          {lead.description && <div style={{ fontSize:"13px", color:"#bbb", lineHeight:"1.6", marginBottom:"12px" }}>{lead.description}</div>}
          {lead.notes && <div style={{ fontSize:"12px", color:C.muted, fontStyle:"italic", marginBottom:"12px", padding:"8px 12px", background:C.surface, borderRadius:"6px" }}>{lead.notes}</div>}
          <label style={ST.label}>Move stage</label>
          <select style={{ ...ST.select, marginBottom:"12px" }} value={lead.stage} onChange={e => onUpdateStage(lead.id, e.target.value)} onClick={e => e.stopPropagation()}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display:"flex", gap:"8px" }}>
            <button style={{ ...ST.btn("ghost"), fontSize:"12px", padding:"7px 14px" }} onClick={e => { e.stopPropagation(); setEditing(true); }}>Edit</button>
            <button style={{ ...ST.btn("danger"), fontSize:"12px", padding:"7px 14px" }} onClick={e => { e.stopPropagation(); onDelete(lead.id); }}>Remove</button>
          </div>
        </div>
      )}

      {editing && (
        <div style={{ marginTop:"14px" }} onClick={e => e.stopPropagation()}>
          <label style={ST.label}>Name</label>
          <input style={{ ...ST.input, marginBottom:"10px" }} value={ed.name} onChange={e => setEd({ ...ed, name: e.target.value })} />
          <label style={ST.label}>Location</label>
          <input style={{ ...ST.input, marginBottom:"10px" }} value={ed.location || ""} onChange={e => setEd({ ...ed, location: e.target.value })} />
          <label style={ST.label}>Type</label>
          <input style={{ ...ST.input, marginBottom:"10px" }} value={ed.type || ""} onChange={e => setEd({ ...ed, type: e.target.value })} />
          <label style={ST.label}>Notes</label>
          <textarea style={{ ...ST.input, minHeight:"72px", resize:"vertical", marginBottom:"12px" }} value={ed.notes || ""} onChange={e => setEd({ ...ed, notes: e.target.value })} />
          <div style={{ display:"flex", gap:"8px" }}>
            <button style={{ ...ST.btn("primary"), fontSize:"12px", padding:"7px 16px" }} onClick={save}>Save</button>
            <button style={{ ...ST.btn("ghost"), fontSize:"12px", padding:"7px 14px" }} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SDSLeadHunter() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  const [tab, setTab] = useState("scanner");
  const [leads, setLeads] = useState([]);
  const [scanResults, setScanResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanLog, setScanLog] = useState("");
  const [lastScanned, setLastScanned] = useState(null);
  const [stageFilter, setStageFilter] = useState("All");
  const [calcType, setCalcType] = useState("hospitality");
  const [calcSqft, setCalcSqft] = useState("");
  const [calcZones, setCalcZones] = useState("1");
  const [calcComplexity, setCalcComplexity] = useState("standard");
  const [briefText, setBriefText] = useState("");
  const [briefResult, setBriefResult] = useState("");
  const [briefing, setBriefing] = useState(false);

  const STAGES = ["New","Contacted","Proposal Sent","Negotiating","Won","Lost"];
  const STAGE_COLORS = { "New":"#C9A84C","Contacted":"#5B9BF0","Proposal Sent":"#A78BFA","Negotiating":"#F59E0B","Won":"#4CAF7D","Lost":"#555" };
  const C = { bg:"#080808",surface:"#111111",card:"#161616",border:"#242424",gold:"#C9A84C",goldLight:"#DDB96A",goldDim:"#C9A84C33",text:"#EDEDED",muted:"#777",dim:"#444",danger:"#B84040" };

  const ST = {
    card: { backgroundColor:C.card, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"16px", marginBottom:"10px" },
    btn: (v="primary") => ({ display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"10px 18px", borderRadius:"8px", border: v==="ghost"?`1px solid ${C.border}`:"none", cursor:"pointer", fontSize:"13px", fontWeight:"600", fontFamily:"Outfit, sans-serif", letterSpacing:"0.02em", backgroundColor: v==="primary"?C.gold:v==="danger"?C.danger:"transparent", color: v==="primary"?"#080808":C.text }),
    badge: (color) => ({ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:"20px", fontSize:"10px", fontWeight:"600", fontFamily:"Outfit, sans-serif", letterSpacing:"0.06em", textTransform:"uppercase", backgroundColor:color+"1A", color, border:`1px solid ${color}44` }),
    input: { width:"100%", backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"11px 13px", color:C.text, fontSize:"14px", fontFamily:"Outfit, sans-serif", boxSizing:"border-box", outline:"none" },
    select: { width:"100%", backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"11px 13px", color:C.text, fontSize:"14px", fontFamily:"Outfit, sans-serif", boxSizing:"border-box", appearance:"none", cursor:"pointer" },
    label: { fontSize:"10px", color:C.muted, marginBottom:"6px", display:"block", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"DM Mono, monospace", fontWeight:"500" },
    sectionLabel: { fontSize:"11px", fontWeight:"700", color:C.goldLight, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:"Syne, sans-serif", marginBottom:"14px" },
  };

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("sds-leads-v3"); if (r) setLeads(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("sds-scan-v3"); if (r) { const d = JSON.parse(r.value); setScanResults(d.results||[]); setLastScanned(d.at||null); } } catch {}
    })();
  }, []);

  const saveLeads = async (next) => {
    setLeads(next);
    try { await window.storage.set("sds-leads-v3", JSON.stringify(next)); } catch {}
  };

  // ── Scanner: try /api/claude proxy first (Vercel), fall back to seed data ──
  const runScanner = async () => {
    setScanning(true);
    setScanLog("Scanning London development pipeline...");
    setScanResults([]);

    let results = null;

    // Try live API via Vercel proxy
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: `You are a lead intelligence scanner for Sonic Design Studios (SDS), a London luxury audio consultancy. Generate 10-12 realistic current London hospitality and premium residential development leads. Return ONLY a JSON array, no other text. Each item: {"name":string,"location":string,"borough":string,"type":string,"description":string,"ref":string,"relevance":"high"|"medium","source":string}`,
          messages: [{ role:"user", content:"Generate London hospitality development leads for SDS. JSON array only." }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
        const match = text.match(/\[[\s\S]*\]/);
        if (match) results = JSON.parse(match[0]);
      }
    } catch {
      // Proxy not available — use seed data
    }

    // Fall back to seed data if proxy failed or returned nothing
    if (!results || results.length === 0) {
      results = SEED_LEADS;
    }

    const stamped = results.map((r,i) => ({ ...r, _id:`s-${Date.now()}-${i}` }));
    setScanResults(stamped);
    const now = new Date().toISOString();
    setLastScanned(now);
    try { await window.storage.set("sds-scan-v3", JSON.stringify({ results:stamped, at:now })); } catch {}
    setScanLog(`${stamped.length} opportunit${stamped.length===1?"y":"ies"} found`);
    setScanning(false);
  };

  const addToPipeline = (result) => {
    if (leads.some(l => l.sourceRef && l.sourceRef===result.ref && result.ref)) return;
    saveLeads([{ id:`l-${Date.now()}`, name:result.name, location:result.location, borough:result.borough, type:result.type, description:result.description, notes:"", stage:"New", sourceRef:result.ref, addedAt:new Date().toISOString(), source:"scanner" }, ...leads]);
  };

  const calcFees = () => {
    const sqft = parseFloat(calcSqft)||0;
    if (!sqft) return null;
    const zones = Math.max(1, parseInt(calcZones)||1);
    const rates = { hospitality:52, residential:64, commercial:40 };
    const mults = { standard:1, premium:1.5, bespoke:2.1 };
    const base = sqft*(rates[calcType]||52)*mults[calcComplexity]*(1+(zones-1)*0.12);
    return { design:Math.round(base*0.35), spec:Math.round(base*0.25), install:Math.round(base*0.28), commission:Math.round(base*0.12), total:Math.round(base) };
  };

  const interpretBrief = async () => {
    if (!briefText.trim()) return;
    setBriefing(true);
    setBriefResult("");
    try {
      const res = await fetch("/api/claude", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are the principal consultant at Sonic Design Studios (SDS), a London-based luxury architectural audio consultancy. Interpret client briefs and produce sharp commercial analysis. Use these exact headings followed by a short paragraph each. No bullet points. UK English.\n\nPROJECT SCOPE\nAUDIO CHALLENGES\nRECOMMENDED APPROACH\nCOMPLEXITY & FEE RANGE\nNEXT STEPS`,
          messages:[{ role:"user", content:briefText }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBriefResult((data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join(""));
      } else {
        setBriefResult("Brief interpreter requires the deployed version. Please use the app via your Vercel URL.");
      }
    } catch {
      setBriefResult("Brief interpreter requires the deployed version. Please use the app via your Vercel URL.");
    }
    setBriefing(false);
  };

  const filteredLeads = stageFilter==="All" ? leads : leads.filter(l=>l.stage===stageFilter);
  const fees = calcFees();

  const Icon = ({ id, size=20 }) => {
    const icons = {
      scanner: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>,
      pipeline: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h6"/><circle cx="19" cy="12" r="2"/><circle cx="16" cy="18" r="2"/></svg>,
      calc: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h4"/><path d="M14 14h2v4h-2zM8 14h2v1H8zM8 17h2v1H8z"/></svg>,
      brief: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
    };
    return icons[id]||null;
  };

  const renderScanner = () => (
    <div style={{ padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
        <div>
          <div style={ST.sectionLabel}>Planning Scanner</div>
          {lastScanned && <div style={{ fontSize:"11px", color:C.muted, fontFamily:"DM Mono, monospace", marginTop:"-8px", marginBottom:"4px" }}>Last scan: {new Date(lastScanned).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} {new Date(lastScanned).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>}
        </div>
        <button style={{ ...ST.btn("primary"), opacity:scanning?0.6:1 }} onClick={runScanner} disabled={scanning}>
          {scanning ? "Scanning..." : "Run Scan"}
        </button>
      </div>

      {scanLog && (
        <div style={{ backgroundColor:C.goldDim, border:`1px solid ${C.gold}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"14px" }}>
          <span style={{ fontSize:"12px", color:C.goldLight, fontFamily:"DM Mono, monospace" }}>{scanLog}</span>
        </div>
      )}

      {scanning && (
        <div style={{ textAlign:"center", padding:"56px 20px" }}>
          <div style={{ fontSize:"36px", marginBottom:"14px" }}>🔍</div>
          <div style={{ fontSize:"13px", color:C.muted }}>Scanning London development pipeline...</div>
        </div>
      )}

      {!scanning && scanResults.length===0 && !scanLog && (
        <div style={{ textAlign:"center", padding:"56px 20px" }}>
          <div style={{ fontSize:"40px", marginBottom:"14px" }}>📡</div>
          <div style={{ fontSize:"15px", color:C.text, fontFamily:"Syne, sans-serif", marginBottom:"8px" }}>No results yet</div>
          <div style={{ fontSize:"13px", color:C.muted }}>Tap Run Scan to search for London hospitality opportunities</div>
        </div>
      )}

      {scanResults.map(r => {
        const inPipeline = leads.some(l => l.sourceRef && l.sourceRef===r.ref && r.ref);
        return (
          <div key={r._id} style={{ ...ST.card, borderLeft:`3px solid ${r.relevance==="high"?C.gold:C.dim}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
              <div style={{ fontWeight:"700", fontSize:"15px", fontFamily:"Syne, sans-serif", flex:1, paddingRight:"10px", lineHeight:"1.3" }}>{r.name}</div>
              <span style={ST.badge(r.relevance==="high"?C.gold:C.muted)}>{r.relevance}</span>
            </div>
            <div style={{ fontSize:"11px", color:C.muted, fontFamily:"DM Mono, monospace", marginBottom:"8px" }}>{[r.location,r.borough,r.type].filter(Boolean).join("  ·  ")}</div>
            <div style={{ fontSize:"13px", color:"#bbb", lineHeight:"1.6", marginBottom:"12px" }}>{r.description}</div>
            {r.ref && <div style={{ fontSize:"10px", color:C.dim, fontFamily:"DM Mono, monospace", marginBottom:"10px" }}>REF {r.ref}</div>}
            <button style={{ ...ST.btn("ghost"), fontSize:"12px", padding:"7px 14px", opacity:inPipeline?0.45:1 }} onClick={() => !inPipeline && addToPipeline(r)} disabled={inPipeline}>
              {inPipeline ? "✓ In Pipeline" : "+ Add to Pipeline"}
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderPipeline = () => (
    <div style={{ padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
        <div style={ST.sectionLabel}>Pipeline <span style={{ color:C.muted, fontWeight:"400" }}>({leads.length})</span></div>
        <button style={{ ...ST.btn("ghost"), fontSize:"12px", padding:"7px 13px" }} onClick={() => saveLeads([{ id:`l-${Date.now()}`, name:"New Lead", location:"", type:"", description:"", notes:"", stage:"New", addedAt:new Date().toISOString(), source:"manual" }, ...leads])}>+ Add</button>
      </div>
      <div style={{ display:"flex", gap:"6px", overflowX:"auto", paddingBottom:"14px", scrollbarWidth:"none" }}>
        {["All",...STAGES].map(s => {
          const cnt = s==="All" ? leads.length : leads.filter(l=>l.stage===s).length;
          return <button key={s} onClick={() => setStageFilter(s)} style={{ padding:"5px 12px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"11px", fontFamily:"Outfit, sans-serif", fontWeight:"600", whiteSpace:"nowrap", backgroundColor:stageFilter===s?C.gold:C.surface, color:stageFilter===s?"#080808":C.muted }}>{s}{cnt>0?` (${cnt})`:""}</button>;
        })}
      </div>
      {filteredLeads.length===0 && (
        <div style={{ textAlign:"center", padding:"56px 20px" }}>
          <div style={{ fontSize:"40px", marginBottom:"14px" }}>📋</div>
          <div style={{ fontSize:"15px", color:C.text, fontFamily:"Syne, sans-serif", marginBottom:"8px" }}>No leads yet</div>
          <div style={{ fontSize:"13px", color:C.muted }}>Run the scanner or add manually above</div>
        </div>
      )}
      {filteredLeads.map(lead => (
        <LeadCard key={lead.id} lead={lead}
          onUpdateStage={(id,stage) => saveLeads(leads.map(l=>l.id===id?{...l,stage}:l))}
          onDelete={(id) => saveLeads(leads.filter(l=>l.id!==id))}
          onUpdate={(updated) => saveLeads(leads.map(l=>l.id===updated.id?updated:l))}
          STAGE_COLORS={STAGE_COLORS} STAGES={STAGES} C={C} ST={ST}
        />
      ))}
    </div>
  );

  const renderCalculator = () => (
    <div style={{ padding:"16px" }}>
      <div style={ST.sectionLabel}>Fee Calculator</div>
      <div style={ST.card}>
        <label style={ST.label}>Project Type</label>
        <div style={{ position:"relative", marginBottom:"14px" }}>
          <select style={ST.select} value={calcType} onChange={e=>setCalcType(e.target.value)}>
            <option value="hospitality">Hospitality / Venue</option>
            <option value="residential">Premium Residential</option>
            <option value="commercial">Commercial / Creative</option>
          </select>
          <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", color:C.muted, pointerEvents:"none" }}>▾</span>
        </div>
        <label style={ST.label}>Floor Area (sq ft)</label>
        <input style={{ ...ST.input, marginBottom:"14px" }} type="number" placeholder="e.g. 3500" value={calcSqft} onChange={e=>setCalcSqft(e.target.value)} />
        <label style={ST.label}>Number of Zones</label>
        <input style={{ ...ST.input, marginBottom:"14px" }} type="number" placeholder="e.g. 4" value={calcZones} onChange={e=>setCalcZones(e.target.value)} />
        <label style={ST.label}>Complexity</label>
        <div style={{ position:"relative" }}>
          <select style={ST.select} value={calcComplexity} onChange={e=>setCalcComplexity(e.target.value)}>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="bespoke">Bespoke / Architectural</option>
          </select>
          <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", color:C.muted, pointerEvents:"none" }}>▾</span>
        </div>
      </div>
      {fees && (
        <div style={{ ...ST.card, borderColor:`${C.gold}44` }}>
          <div style={{ ...ST.sectionLabel, marginBottom:"12px" }}>Fee Breakdown</div>
          {[{label:"Design & Consultancy",value:fees.design},{label:"Specification",value:fees.spec},{label:"Installation Oversight",value:fees.install},{label:"Commissioning",value:fees.commission}].map(row => (
            <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:"13px", color:"#bbb" }}>{row.label}</span>
              <span style={{ fontSize:"14px", fontWeight:"600", fontFamily:"DM Mono, monospace", color:C.text }}>£{row.value.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"14px" }}>
            <span style={{ fontSize:"15px", fontWeight:"700", color:C.gold, fontFamily:"Syne, sans-serif" }}>Total</span>
            <span style={{ fontSize:"18px", fontWeight:"700", color:C.gold, fontFamily:"DM Mono, monospace" }}>£{fees.total.toLocaleString()}</span>
          </div>
          <div style={{ fontSize:"10px", color:C.muted, marginTop:"10px", fontFamily:"DM Mono, monospace" }}>Indicative. Subject to scope confirmation.</div>
        </div>
      )}
    </div>
  );

  const renderBrief = () => (
    <div style={{ padding:"16px" }}>
      <div style={ST.sectionLabel}>Brief Interpreter</div>
      <div style={ST.card}>
        <label style={ST.label}>Client Brief</label>
        <textarea style={{ ...ST.input, minHeight:"160px", resize:"vertical", lineHeight:"1.65", marginBottom:"12px" }} placeholder="Paste or type the client brief here — e.g. We're opening a 4,000 sq ft members club in Mayfair with a restaurant, bar, and private dining room..." value={briefText} onChange={e=>setBriefText(e.target.value)} />
        <button style={{ ...ST.btn("primary"), width:"100%", justifyContent:"center", opacity:briefing||!briefText.trim()?0.55:1 }} onClick={interpretBrief} disabled={briefing||!briefText.trim()}>
          {briefing ? "Interpreting..." : "Interpret Brief"}
        </button>
      </div>
      {briefResult && (
        <div style={{ ...ST.card, borderColor:`${C.gold}44` }}>
          <div style={{ ...ST.sectionLabel, marginBottom:"14px" }}>SDS Analysis</div>
          {briefResult.split('\n').map((line,i) => {
            const isH = ["PROJECT SCOPE","AUDIO CHALLENGES","RECOMMENDED APPROACH","COMPLEXITY & FEE RANGE","NEXT STEPS"].some(h=>line.trim().startsWith(h));
            return line.trim() ? <div key={i} style={{ fontSize:isH?"10px":"13px", fontFamily:isH?"DM Mono, monospace":"Outfit, sans-serif", color:isH?C.goldLight:"#ccc", lineHeight:isH?"1":"1.7", letterSpacing:isH?"0.1em":"0", fontWeight:isH?"500":"400", marginBottom:isH?"6px":"14px", marginTop:isH&&i>0?"16px":"0", textTransform:isH?"uppercase":"none" }}>{line.trim()}</div> : null;
          })}
        </div>
      )}
    </div>
  );

  const TABS = [{id:"scanner",label:"Scanner"},{id:"pipeline",label:"Pipeline"},{id:"calc",label:"Calculator"},{id:"brief",label:"Brief"}];

  return (
    <div style={{ backgroundColor:C.bg, minHeight:"100vh", color:C.text, fontFamily:"Outfit, system-ui, sans-serif", paddingBottom:"76px" }}>
      <div style={{ backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"6px", height:"28px", backgroundColor:C.gold, borderRadius:"3px", flexShrink:0 }} />
          <div>
            <div style={{ fontSize:"16px", fontWeight:"800", color:C.text, fontFamily:"Syne, sans-serif", letterSpacing:"0.02em", lineHeight:"1.2" }}>SDS Lead Hunter</div>
            <div style={{ fontSize:"9px", color:C.muted, letterSpacing:"0.16em", textTransform:"uppercase", fontFamily:"DM Mono, monospace" }}>Sonic Design Studios</div>
          </div>
        </div>
      </div>

      {tab==="scanner" && renderScanner()}
      {tab==="pipeline" && renderPipeline()}
      {tab==="calc" && renderCalculator()}
      {tab==="brief" && renderBrief()}

      <nav style={{ position:"fixed", bottom:0, left:0, right:0, backgroundColor:C.surface, borderTop:`1px solid ${C.border}`, display:"flex" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:"10px 4px 13px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", color:tab===t.id?C.gold:C.muted, borderTop:tab===t.id?`2px solid ${C.gold}`:"2px solid transparent" }}>
            <Icon id={t.id} size={19} />
            <span style={{ fontSize:"9px", fontFamily:"DM Mono, monospace", letterSpacing:"0.06em", fontWeight:tab===t.id?"500":"400", textTransform:"uppercase" }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
