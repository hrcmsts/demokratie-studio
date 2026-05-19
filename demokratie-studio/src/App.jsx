import { useEffect, useRef, useState } from "react";

// ── Supply Chain Data ──────────────────────────────────────────────────────
const SUPPLY_CHAIN = [
  {
    id: "kobalt",
    land: "Demokratische Republik Kongo",
    kuerzel: "DRC",
    lat: -4, lng: 23,
    material: "Kobalt",
    bauteil: "Akku",
    icon: "🔋",
    farbe: "#e85d04",
    beschreibung: "60% des weltweiten Kobalts stammen aus dem Kongo. Es ist essenziell für Lithium-Ionen-Akkus.",
    fakt: "Ein Smartphone-Akku enthält ca. 5–10g Kobalt. Kinderarbeit in Minen ist ein kritisches Problem.",
  },
  {
    id: "silizium",
    land: "China",
    kuerzel: "CHN",
    lat: 35, lng: 105,
    material: "Silizium / Chips",
    bauteil: "Prozessor & Display",
    icon: "💾",
    farbe: "#3a86ff",
    beschreibung: "China ist weltweit größter Produzent von Silizium und Halbleitern. SMIC und andere Hersteller liefern Chips.",
    fakt: "Ein modernes Smartphone enthält über 1 Milliarde Transistoren auf einem Chip kleiner als ein Fingernagel.",
  },
  {
    id: "chips",
    land: "Taiwan",
    kuerzel: "TWN",
    lat: 23.5, lng: 121,
    material: "Hochleistungs-Chips",
    bauteil: "Anwendungsprozessor",
    icon: "⚙️",
    farbe: "#06d6a0",
    beschreibung: "TSMC in Taiwan fertigt die fortschrittlichsten Chips der Welt — u.a. für Apple, Qualcomm, NVIDIA.",
    fakt: "TSMC produziert über 90% aller fortschrittlichen Chips weltweit. Taiwan ist damit geopolitisch extrem strategisch.",
  },
  {
    id: "lithium",
    land: "Chile",
    kuerzel: "CHL",
    lat: -30, lng: -71,
    material: "Lithium",
    bauteil: "Akku",
    icon: "⚡",
    farbe: "#ffbe0b",
    beschreibung: "Chile besitzt die größten Lithiumreserven der Welt im sogenannten 'Lithiumdreieck' (Chile, Bolivien, Argentinien).",
    fakt: "Der Lithiumabbau verbraucht enorme Mengen Wasser — in einer der trockensten Regionen der Erde.",
  },
  {
    id: "glas",
    land: "USA",
    kuerzel: "USA",
    lat: 40, lng: -100,
    material: "Gorilla Glass",
    bauteil: "Display-Glas",
    icon: "📱",
    farbe: "#8338ec",
    beschreibung: "Corning (USA) produziert das weltweit bekannteste Schutzglas für Smartphones — Gorilla Glass.",
    fakt: "Gorilla Glass ist bis zu 4× bruchsicherer als normales Glas. Es wird in über 8 Milliarden Geräten verbaut.",
  },
  {
    id: "montage",
    land: "China (Shenzhen)",
    kuerzel: "SHZ",
    lat: 22.5, lng: 114,
    material: "Montage",
    bauteil: "Fertigung",
    icon: "🏭",
    farbe: "#fb5607",
    beschreibung: "Foxconn und andere Hersteller in Shenzhen montieren die meisten Smartphones der Welt.",
    fakt: "Foxconn beschäftigt über 1 Million Menschen. Die Fabrik in Zhengzhou wird 'iPhone City' genannt.",
  },
  {
    id: "seltene",
    land: "China (Inner-Mongolei)",
    kuerzel: "MNG",
    lat: 44, lng: 113,
    material: "Seltene Erden",
    bauteil: "Lautsprecher, Vibration, Kamera",
    icon: "🧲",
    farbe: "#c77dff",
    beschreibung: "China kontrolliert ~80% der weltweiten Produktion Seltener Erden — unverzichtbar für Magnete, LEDs und Motoren.",
    fakt: "Ein Smartphone enthält bis zu 16 verschiedene Seltene Erden. Ohne sie keine Vibration, kein Lautsprecher.",
  },
  {
    id: "gold",
    land: "Australien",
    kuerzel: "AUS",
    lat: -25, lng: 133,
    material: "Gold & Kupfer",
    bauteil: "Leiterbahnen",
    icon: "🥇",
    farbe: "#f4d35e",
    beschreibung: "Gold und Kupfer werden für Leiterbahnen auf Platinen verwendet — Australien ist einer der Hauptlieferanten.",
    fakt: "In einer Tonne Smartphones steckt mehr Gold als in einer Tonne Golderz. E-Waste-Recycling wird immer wichtiger.",
  },
];

const ZIEL = { lat: 51.5, lng: 10, name: "Deutschland (Verbraucher)", icon: "🛒" };

// ── Mercator projection helper ────────────────────────────────────────────
function project(lat, lng, w, h) {
  const x = ((lng + 180) / 360) * w;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = h / 2 - (w * mercN) / (2 * Math.PI);
  return { x, y };
}

function lerp(a, b, t) { return a + (b - a) * t; }

function arcPath(x1, y1, x2, y2, bendFactor = 0.3) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const cx = mx - dy * bendFactor;
  const cy = my + dx * bendFactor;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

// ── World Map SVG paths (simplified continents) ──────────────────────────
const CONTINENTS = [
  // North America
  "M 80,85 L 95,75 L 130,72 L 145,85 L 160,95 L 155,115 L 140,130 L 120,140 L 100,135 L 80,120 Z",
  // South America
  "M 115,145 L 135,140 L 150,155 L 145,185 L 130,210 L 110,205 L 100,185 L 105,165 Z",
  // Europe
  "M 295,72 L 320,68 L 340,72 L 345,85 L 330,95 L 305,92 L 290,82 Z",
  // Africa
  "M 295,100 L 330,95 L 345,110 L 340,155 L 320,175 L 295,165 L 280,145 L 278,120 Z",
  // Asia
  "M 345,68 L 430,60 L 480,70 L 490,95 L 470,115 L 430,120 L 390,115 L 355,105 L 340,85 Z",
  // Australia
  "M 430,155 L 465,148 L 475,165 L 465,180 L 435,178 L 420,168 Z",
];

// ── Chat component ─────────────────────────────────────────────────────────
const CHIPS_LIST = [
  "Warum ist Taiwan so wichtig?",
  "Was sind Seltene Erden?",
  "Ist Kobaltabbau nachhaltig?",
  "Was kostet ein Smartphone wirklich?",
];

function Chat({ active }) {
  const [msgs, setMsgs] = useState([{
    r: "ai",
    t: "Hallo! Ich bin dein Assistent für globale Lieferketten. Klicke auf ein Land auf der Karte oder stelle mir eine Frage! 🌍"
  }]);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  useEffect(() => {
    if (active) {
      const s = SUPPLY_CHAIN.find(s => s.id === active);
      if (s) send(`Erkläre mir die Rolle von ${s.land} in der Smartphone-Lieferkette: ${s.material} für ${s.bauteil}.`, true);
    }
  }, [active]);

  async function send(text, auto = false) {
    const msg = auto ? text : (text || inp.trim());
    if (!msg || busy) return;
    if (!auto) setInp("");
    setMsgs(m => [...m, { r: "user", t: auto ? `📍 ${SUPPLY_CHAIN.find(s => s.id === active)?.land || ""}` : msg }]);
    setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `Du bist ein Lernassistent für globale Lieferketten und Globalisierung (Klasse 9–10, Gesellschaftslehre). Antworte auf Deutsch, klar und prägnant, max. 3–4 Sätze. Beziehe dich auf Smartphones als konkretes Beispiel.`,
          messages: [{ role: "user", content: msg }]
        })
      });
      const d = await res.json();
      if (d.error) setMsgs(m => [...m, { r: "ai", t: `Fehler: ${d.error}` }]);
      else setMsgs(m => [...m, { r: "ai", t: d.content?.[0]?.text || "Keine Antwort." }]);
    } catch (e) {
      setMsgs(m => [...m, { r: "ai", t: `Verbindungsfehler: ${e.message}` }]);
    }
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "16px 16px 8px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.r === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 3 }}>
              {m.r === "user" ? "Du" : "KI-Assistent"}
            </div>
            <div style={{
              padding: "9px 13px", maxWidth: "90%", fontSize: 12.5, lineHeight: 1.65,
              borderRadius: m.r === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: m.r === "user" ? "#0f172a" : "#f1f5f9",
              color: m.r === "user" ? "#f8fafc" : "#0f172a",
              border: m.r === "ai" ? "1px solid #e2e8f0" : "none"
            }}>{m.t}</div>
          </div>
        ))}
        {busy && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>KI-Assistent</div>
            <div style={{ display: "flex", gap: 4, padding: "9px 13px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "14px 14px 14px 4px", width: "fit-content" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#94a3b8", animation: "b 1.4s ease infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "8px 16px 12px", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {CHIPS_LIST.map(c => (
            <button key={c} onClick={() => send(c)}
              style={{ padding: "3px 9px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 11, cursor: "pointer", color: "#475569", fontFamily: "inherit" }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={inp} onChange={e => setInp(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Frage zur Lieferkette..."
            style={{ flex: 1, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", fontSize: 12.5, fontFamily: "inherit", color: "#0f172a", outline: "none" }} />
          <button onClick={() => send()}
            style={{ width: 36, height: 36, borderRadius: 8, background: "#0f172a", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
      <style>{`@keyframes b{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState(null);
  const [tab, setTab] = useState("info");
  const [tick, setTick] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const W = 560, H = 280;

  // Animation tick for flowing lines
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 100), 50);
    return () => clearInterval(id);
  }, []);

  const activeData = SUPPLY_CHAIN.find(s => s.id === active);
  const zielPos = project(ZIEL.lat, ZIEL.lng, W, H);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0f172a", color: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📱</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>Lieferketten Studio</div>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Globalisierung · Smartphone-Produktion</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
          <span style={{ fontSize: 11, color: "#64748b" }}>{SUPPLY_CHAIN.length} Stationen weltweit</span>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* LEFT: Sidebar */}
        <div style={{ width: 200, background: "#0a0f1e", borderRight: "1px solid #1e293b", overflowY: "auto", flexShrink: 0, padding: "12px 0" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#475569", padding: "0 14px", marginBottom: 8 }}>LIEFERKETTE</div>
          {SUPPLY_CHAIN.map(s => (
            <div key={s.id} onClick={() => { setActive(s.id); setTab("chat"); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", cursor: "pointer",
                background: active === s.id ? "#1e293b" : "transparent",
                borderLeft: `3px solid ${active === s.id ? s.farbe : "transparent"}`,
                transition: "all 0.15s" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${s.farbe}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, border: `1px solid ${s.farbe}40` }}>{s.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: active === s.id ? "#f8fafc" : "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.material}</div>
                <div style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.kuerzel}</div>
              </div>
            </div>
          ))}
          <div style={{ margin: "12px 14px 0", paddingTop: 12, borderTop: "1px solid #1e293b" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#475569", marginBottom: 8 }}>ZIEL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#22c55e20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "1px solid #22c55e40" }}>🛒</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e" }}>Verbraucher</div>
                <div style={{ fontSize: 10, color: "#475569" }}>Deutschland</div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: Map */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

            {/* Map SVG */}
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
              preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="mapbg" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#0f2744" />
                  <stop offset="100%" stopColor="#060d1a" />
                </radialGradient>
                {SUPPLY_CHAIN.map(s => (
                  <marker key={s.id} id={`arrow-${s.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill={s.farbe} opacity="0.8" />
                  </marker>
                ))}
              </defs>

              {/* Ocean background */}
              <rect width={W} height={H} fill="url(#mapbg)" />

              {/* Grid lines */}
              {[0, 45, 90, 135, 180, 225, 270, 315, 360].map(lng => {
                const x = (lng / 360) * W;
                return <line key={lng} x1={x} y1={0} x2={x} y2={H} stroke="#1e3a5f" strokeWidth="0.3" opacity="0.5" />;
              })}
              {[-60, -30, 0, 30, 60].map(lat => {
                const p = project(lat, 0, W, H);
                return <line key={lat} x1={0} y1={p.y} x2={W} y2={p.y} stroke="#1e3a5f" strokeWidth="0.3" opacity="0.5" />;
              })}

              {/* Continents */}
              {CONTINENTS.map((d, i) => (
                <path key={i} d={d} fill="#1e3a5f" stroke="#2d5a8e" strokeWidth="0.5" opacity="0.8" />
              ))}

              {/* Supply chain arcs */}
              {SUPPLY_CHAIN.map(s => {
                const from = project(s.lat, s.lng, W, H);
                const to = zielPos;
                const isActive = active === s.id;
                const isHovered = hoveredId === s.id;
                const path = arcPath(from.x, from.y, to.x, to.y, -0.25);
                const dashLen = 6, gapLen = 4, total = dashLen + gapLen;
                const offset = -((tick / 100) * total * 3);
                return (
                  <path key={s.id} d={path}
                    fill="none"
                    stroke={s.farbe}
                    strokeWidth={isActive || isHovered ? 2 : 0.8}
                    opacity={isActive ? 1 : isHovered ? 0.8 : active ? 0.2 : 0.5}
                    strokeDasharray={`${dashLen} ${gapLen}`}
                    strokeDashoffset={offset}
                    style={{ transition: "opacity 0.3s, stroke-width 0.2s" }}
                    markerEnd={isActive ? `url(#arrow-${s.id})` : ""}
                  />
                );
              })}

              {/* Country nodes */}
              {SUPPLY_CHAIN.map(s => {
                const pos = project(s.lat, s.lng, W, H);
                const isActive = active === s.id;
                const isHovered = hoveredId === s.id;
                return (
                  <g key={s.id}
                    onClick={() => { setActive(s.id); setTab("info"); }}
                    onMouseEnter={() => setHoveredId(s.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ cursor: "pointer" }}>
                    {(isActive || isHovered) && (
                      <circle cx={pos.x} cy={pos.y} r={16} fill={s.farbe} opacity="0.15" />
                    )}
                    <circle cx={pos.x} cy={pos.y} r={isActive ? 9 : isHovered ? 8 : 6}
                      fill={isActive ? s.farbe : "#0f172a"}
                      stroke={s.farbe}
                      strokeWidth={isActive ? 0 : 1.5}
                      style={{ filter: isActive ? `drop-shadow(0 0 8px ${s.farbe})` : "none", transition: "all 0.2s" }} />
                    <text x={pos.x} y={pos.y + 0.5} textAnchor="middle" dominantBaseline="middle"
                      fontSize={isActive ? 6 : 5} style={{ pointerEvents: "none", userSelect: "none" }}>
                      {s.icon}
                    </text>
                    {(isActive || isHovered) && (
                      <text x={pos.x} y={pos.y + 15} textAnchor="middle" fontSize="5"
                        fill={s.farbe} fontWeight="700" fontFamily="sans-serif"
                        style={{ pointerEvents: "none", filter: `drop-shadow(0 1px 2px #000)` }}>
                        {s.kuerzel}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Destination: Germany */}
              <g>
                <circle cx={zielPos.x} cy={zielPos.y} r={12} fill="#22c55e" opacity="0.15" />
                <circle cx={zielPos.x} cy={zielPos.y} r={7} fill="#22c55e"
                  style={{ filter: "drop-shadow(0 0 6px #22c55e)" }} />
                <text x={zielPos.x} y={zielPos.y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="5" style={{ pointerEvents: "none" }}>🛒</text>
                <text x={zielPos.x} y={zielPos.y + 14} textAnchor="middle" fontSize="5" fill="#22c55e" fontWeight="700" fontFamily="sans-serif">DE</text>
              </g>

              {/* Legend */}
              <text x="8" y="12" fontSize="5" fill="#64748b" fontFamily="sans-serif">WELTLIEFERKETTE SMARTPHONE</text>
              <text x="8" y="20" fontSize="4" fill="#475569" fontFamily="sans-serif">Klicke auf eine Station für Details</text>
            </svg>
          </div>

          {/* Bottom strip: all stations */}
          <div style={{ background: "#0a0f1e", borderTop: "1px solid #1e293b", padding: "10px 16px", flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", marginBottom: 8 }}>ALLE STATIONEN</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {SUPPLY_CHAIN.map(s => (
                <div key={s.id} onClick={() => { setActive(s.id); setTab("info"); }}
                  style={{ flexShrink: 0, background: active === s.id ? `${s.farbe}25` : "#0f172a",
                    border: `1px solid ${active === s.id ? s.farbe : "#1e293b"}`,
                    borderRadius: 8, padding: "6px 10px", cursor: "pointer", transition: "all 0.2s",
                    borderTop: `3px solid ${s.farbe}` }}>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#cbd5e1", whiteSpace: "nowrap" }}>{s.material}</div>
                  <div style={{ fontSize: 9, color: "#475569" }}>{s.kuerzel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT panel */}
        <div style={{ width: 280, background: "#0a0f1e", borderLeft: "1px solid #1e293b", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ display: "flex", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
            {[["info", "📋 Details"], ["chat", "🤖 KI-Assistent"]].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: "10px 6px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: "none", border: "none", fontFamily: "inherit", letterSpacing: "0.04em",
                  color: tab === t ? "#3b82f6" : "#475569",
                  borderBottom: `2px solid ${tab === t ? "#3b82f6" : "transparent"}`, transition: "all 0.2s" }}>
                {l}
              </button>
            ))}
          </div>

          {tab === "info" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {!activeData ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 12, color: "#475569", textAlign: "center" }}>
                  <div style={{ fontSize: 36, opacity: 0.4 }}>🌍</div>
                  <div style={{ fontSize: 12, lineHeight: 1.7 }}>Klicke auf eine Station<br />auf der Karte</div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: `${activeData.farbe}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `1px solid ${activeData.farbe}40`, flexShrink: 0 }}>{activeData.icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", lineHeight: 1.2 }}>{activeData.material}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{activeData.land}</div>
                    </div>
                    <div style={{ marginLeft: "auto", padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${activeData.farbe}20`, color: activeData.farbe }}>{activeData.bauteil}</div>
                  </div>

                  {[
                    { t: "ÜBERBLICK", c: <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "#94a3b8" }}>{activeData.beschreibung}</p> },
                    { t: "WISSENSWERTES", c: <p style={{ fontSize: 12, lineHeight: 1.65, color: "#64748b", fontStyle: "italic", background: "#0f172a", padding: "8px 10px", borderRadius: 8, border: `1px solid ${activeData.farbe}30` }}>{activeData.fakt}</p> },
                    { t: "VERBINDUNG", c: (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ padding: "4px 10px", borderRadius: 20, background: `${activeData.farbe}20`, color: activeData.farbe, fontSize: 11, fontWeight: 600 }}>{activeData.kuerzel} {activeData.icon}</div>
                        <div style={{ flex: 1, height: 2, background: `linear-gradient(to right, ${activeData.farbe}, #22c55e)`, borderRadius: 2 }} />
                        <div style={{ padding: "4px 10px", borderRadius: 20, background: "#22c55e20", color: "#22c55e", fontSize: 11, fontWeight: 600 }}>DE 🛒</div>
                      </div>
                    )},
                  ].map(s => (
                    <div key={s.t} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", marginBottom: 7, paddingBottom: 5, borderBottom: "1px solid #1e293b" }}>{s.t}</div>
                      {s.c}
                    </div>
                  ))}

                  <button onClick={() => setTab("chat")}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${activeData.farbe}30, ${activeData.farbe}10)`, color: activeData.farbe, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 4, border: `1px solid ${activeData.farbe}40` }}>
                    🤖 KI fragen: {activeData.land}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "chat" && <Chat active={active} />}
        </div>
      </div>
    </div>
  );
}
