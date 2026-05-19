import { useState, useRef, useEffect } from "react";

// ─── DATA ───────────────────────────────────────────────────────────────────

const INSTITUTIONS = {
  bundestag: {
    name: "Bundestag", sub: "Gesetzgebende Körperschaft",
    gewalt: "Legislative", color: "#5b7fa6", thumb: "🏛️",
    facts: [{ l:"Mitglieder", v:"736 Abgeordnete" }, { l:"Amtszeit", v:"4 Jahre" }, { l:"Wahl", v:"Art. 38 GG" }, { l:"Sitz", v:"Berlin" }],
    desc: "Das Parlament der Bundesrepublik Deutschland. Alle vier Jahre direkt vom Volk gewählt, verabschiedet es Gesetze, kontrolliert die Regierung und wählt den Bundeskanzler.",
    aufgaben: ["Gesetzgebung", "Wahl des Bundeskanzlers", "Haushaltskontrolle", "Regierungskontrolle"],
    note: "Spaßfakt: Der Bundestag hat mehr Mitglieder als jedes andere frei gewählte Parlament der Welt.",
    relations: ["Bundesrat", "Bundesregierung", "Bundespräsident", "BVerfG"],
  },
  bundesrat: {
    name: "Bundesrat", sub: "Länderkammer",
    gewalt: "Legislative", color: "#7a9bbf", thumb: "🗺️",
    facts: [{ l:"Stimmen", v:"69 (16 Länder)" }, { l:"Besetzung", v:"Landesregierungen" }, { l:"Vorsitz", v:"Rotierend" }, { l:"Sitz", v:"Berlin" }],
    desc: "Vertretung der 16 Bundesländer auf Bundesebene. Wirkt bei der Gesetzgebung mit und kann Gesetze, die Länderrechte berühren, blockieren.",
    aufgaben: ["Mitwirkung Gesetzgebung", "Zustimmungsgesetze", "Bund–Länder-Verbindung", "Gesetzesinitiative"],
    note: "Spaßfakt: Der Bundesrat ist kein klassisches Parlament — er tagt nur etwa 12-mal im Jahr.",
    relations: ["Bundestag", "Bundesregierung", "BVerfG"],
  },
  bundesregierung: {
    name: "Bundesregierung", sub: "Kabinett",
    gewalt: "Exekutive", color: "#c4392b", thumb: "🏢",
    facts: [{ l:"Leitung", v:"Bundeskanzler" }, { l:"Kanzlerwahl", v:"Durch Bundestag" }, { l:"Minister", v:"Vom Kanzler" }, { l:"Sitz", v:"Berlin" }],
    desc: "Besteht aus Bundeskanzler und Bundesministern. Der Kanzler bestimmt die Richtlinien der Politik — das ist die sogenannte Richtlinienkompetenz.",
    aufgaben: ["Gesetze ausführen", "Gesetzentwürfe einbringen", "Bundesverwaltung leiten", "Außenpolitik"],
    note: "Spaßfakt: Nur der Bundeskanzler wird vom Bundestag gewählt — die Minister ernennt er selbst.",
    relations: ["Bundestag", "Bundesrat", "Bundespräsident"],
  },
  bundespraesident: {
    name: "Bundespräsident", sub: "Staatsoberhaupt",
    gewalt: "Exekutive", color: "#b8962e", thumb: "👤",
    facts: [{ l:"Amtszeit", v:"5 Jahre" }, { l:"Wahl", v:"Bundesversammlung" }, { l:"Funktion", v:"Repräsentativ" }, { l:"Sitz", v:"Schloss Bellevue" }],
    desc: "Staatsoberhaupt mit vor allem repräsentativer Rolle. Unterzeichnet Gesetze, kann dies aber bei Verfassungswidrigkeit verweigern.",
    aufgaben: ["Gesetze ausfertigen", "Kanzler ernennen", "Deutschland vertreten", "Begnadigungsrecht"],
    note: "Spaßfakt: Der Bundespräsident kann den Bundestag auflösen — hat dies aber erst dreimal getan.",
    relations: ["Bundestag", "Bundesregierung", "Grundgesetz"],
  },
  bverfg: {
    name: "BVerfG", sub: "Bundesverfassungsgericht",
    gewalt: "Judikative", color: "#4a8c6a", thumb: "⚖️",
    facts: [{ l:"Richter", v:"16 (2 Senate)" }, { l:"Amtszeit", v:"12 Jahre" }, { l:"Wahl", v:"½ BT, ½ BR" }, { l:"Sitz", v:"Karlsruhe" }],
    desc: "Hüter der Verfassung — das höchste Gericht Deutschlands. Prüft, ob Gesetze mit dem Grundgesetz vereinbar sind.",
    aufgaben: ["Normenkontrolle", "Verfassungsbeschwerden", "Organstreitigkeiten", "Parteienverbote"],
    note: "Spaßfakt: Jeder Bürger kann Verfassungsbeschwerde einlegen — es gehen über 6.000 pro Jahr ein.",
    relations: ["Bundestag", "Bundesrat", "Grundgesetz"],
  },
  grundgesetz: {
    name: "Grundgesetz", sub: "Verfassung seit 1949",
    gewalt: "Rechtsgrundlage", color: "#7c5c9e", thumb: "📜",
    facts: [{ l:"In Kraft", v:"23. Mai 1949" }, { l:"Artikel", v:"146" }, { l:"Ewigkeitsklausel", v:"Art. 79 III" }, { l:"Grundrechte", v:"Art. 1–19" }],
    desc: "Die Verfassung der Bundesrepublik Deutschland. Garantiert Grundrechte und legt die Staatsprinzipien fest: Demokratie, Rechtsstaat, Sozialstaat, Bundesstaat.",
    aufgaben: ["Grundrechte garantieren", "Staatsorgane regeln", "Gewaltenteilung verankern", "Ewigkeitsklausel"],
    note: "Spaßfakt: Art. 1 GG — \"Die Würde des Menschen ist unantastbar\" — ist absolut unabänderlich.",
    relations: ["Alle Institutionen", "BVerfG (Hüter)", "Alle Bürger"],
  },
};

const SIDEBAR_ITEMS = [
  { group: "INSTITUTIONEN", ids: ["bundestag","bundesrat","bundesregierung","bundespraesident","bverfg","grundgesetz"] },
];

const GEWALT_ITEMS = [
  { label:"Legislative", ids:["bundestag","bundesrat"], color:"#5b7fa6" },
  { label:"Exekutive", ids:["bundesregierung","bundespraesident"], color:"#c4392b" },
  { label:"Judikative", ids:["bverfg"], color:"#4a8c6a" },
];

const GESETZE = [
  { nr:1, icon:"💡", titel:"Gesetzesinitiative", text:"Bundesregierung, Bundestag oder Bundesrat bringen einen Gesetzentwurf ein.", wer:["Bundesregierung","Bundestag","Bundesrat"] },
  { nr:2, icon:"📖", titel:"1. Lesung", text:"Vorstellung im Bundestag-Plenum. Überweisung an den zuständigen Fachausschuss.", wer:["Bundestag"] },
  { nr:3, icon:"🔍", titel:"Ausschussberatung", text:"Fachausschuss prüft den Entwurf, hört Experten an und schlägt Änderungen vor.", wer:["Bundestag (Ausschuss)"] },
  { nr:4, icon:"🗳️", titel:"2. & 3. Lesung", text:"Aussprache, Änderungsanträge, Schlussabstimmung im Bundestag.", wer:["Bundestag"] },
  { nr:5, icon:"🗺️", titel:"Bundesrat", text:"Bundesrat kann zustimmen, Einspruch einlegen oder (Zustimmungsgesetz) ablehnen.", wer:["Bundesrat"] },
  { nr:6, icon:"🤝", titel:"Vermittlungsausschuss", text:"Bei Konflikt: Gemeinsamer Ausschuss von BT und BR sucht Kompromiss.", wer:["Bundestag","Bundesrat"] },
  { nr:7, icon:"✍️", titel:"Ausfertigung", text:"Bundespräsident prüft formelle Korrektheit und unterzeichnet das Gesetz.", wer:["Bundespräsident"] },
  { nr:8, icon:"📰", titel:"Verkündung", text:"Veröffentlichung im Bundesgesetzblatt — Gesetz tritt in Kraft.", wer:["Bundesregierung"] },
];

const GRUNDRECHTE = [
  { art:"Art. 1", titel:"Menschenwürde", kat:"Unveräußerlich", color:"#c4392b", text:"Die Würde des Menschen ist unantastbar. Sie zu achten und zu schützen ist Verpflichtung aller staatlichen Gewalt." },
  { art:"Art. 2", titel:"Freie Entfaltung", kat:"Freiheitsrecht", color:"#5b7fa6", text:"Jeder hat das Recht auf die freie Entfaltung seiner Persönlichkeit, soweit er nicht die Rechte anderer verletzt." },
  { art:"Art. 3", titel:"Gleichheitsgrundsatz", kat:"Gleichheitsrecht", color:"#4a8c6a", text:"Alle Menschen sind vor dem Gesetz gleich. Niemand darf wegen Geschlecht, Herkunft oder Religion benachteiligt werden." },
  { art:"Art. 4", titel:"Glaubensfreiheit", kat:"Freiheitsrecht", color:"#5b7fa6", text:"Die Freiheit des Glaubens, des Gewissens und die Freiheit des religiösen Bekenntnisses sind unverletzlich." },
  { art:"Art. 5", titel:"Meinungsfreiheit", kat:"Kommunikationsrecht", color:"#b8962e", text:"Jeder hat das Recht, seine Meinung in Wort, Schrift und Bild frei zu äußern und zu verbreiten." },
  { art:"Art. 8", titel:"Versammlungsfreiheit", kat:"Politisches Recht", color:"#7c5c9e", text:"Alle Deutschen haben das Recht, sich ohne Anmeldung oder Erlaubnis friedlich zu versammeln." },
  { art:"Art. 14", titel:"Eigentumsrecht", kat:"Wirtschaftsrecht", color:"#7a9bbf", text:"Das Eigentum und das Erbrecht werden gewährleistet. Eigentum verpflichtet." },
  { art:"Art. 19", titel:"Wesensgehalt", kat:"Schutzklausel", color:"#8a7d68", text:"Der Wesensgehalt eines Grundrechts darf in keinem Fall angetastet werden." },
];

// ─── NETWORK SVG ─────────────────────────────────────────────────────────────

const NODES = [
  { id:"grundgesetz",     x:50, y:46 },
  { id:"bundestag",       x:20, y:20 },
  { id:"bundesrat",       x:20, y:72 },
  { id:"bundesregierung", x:80, y:20 },
  { id:"bundespraesident",x:80, y:72 },
  { id:"bverfg",          x:50, y:88 },
];

const EDGES = [
  ["grundgesetz","bundestag"],["grundgesetz","bundesrat"],
  ["grundgesetz","bundesregierung"],["grundgesetz","bundespraesident"],
  ["grundgesetz","bverfg"],["bundestag","bundesregierung"],
  ["bundestag","bundesrat"],["bundestag","bundespraesident"],
];

function Network({ selected, onSelect }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width:"100%", height:"100%" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0e8d8" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#e8dcc8" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="44" ry="44" fill="url(#bg-grad)" />

      {EDGES.map(([a,b]) => {
        const pa = NODES.find(n=>n.id===a), pb = NODES.find(n=>n.id===b);
        return <line key={a+b} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
          stroke="#c8bba8" strokeWidth="0.35" strokeDasharray="1.2,0.8" opacity="0.6"/>;
      })}

      {NODES.map(({id,x,y}) => {
        const inst = INSTITUTIONS[id];
        const active = selected === id;
        return (
          <g key={id} onClick={()=>onSelect(id)} style={{cursor:"pointer"}}>
            {active && <circle cx={x} cy={y} r={10} fill={inst.color} opacity="0.12"/>}
            <circle cx={x} cy={y} r={active?8.5:7.5}
              fill="white"
              stroke={active ? inst.color : "#d4c9b4"}
              strokeWidth={active?1.2:0.6}
              style={{
                filter:`drop-shadow(0 ${active?3:1}px ${active?6:3}px rgba(0,0,0,${active?0.18:0.1}))`,
                transition:"all 0.2s"
              }}/>
            <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fontSize="5.5"
              style={{pointerEvents:"none", userSelect:"none"}}>{inst.thumb}</text>
            <text x={x} y={y+12} textAnchor="middle" fontSize="2.8" fill={active?inst.color:"#7a6e5e"}
              fontWeight={active?"700":"500"} fontFamily="Georgia,serif"
              style={{pointerEvents:"none", transition:"all 0.2s"}}>
              {inst.name.length>10 ? inst.name.slice(0,9)+"…" : inst.name}
            </text>
          </g>
        );
      })}

      <text x="50" y="4" textAnchor="middle" fontSize="2.4" fill="#a09080" fontFamily="Georgia,serif"
        letterSpacing="0.8">GEWALTENTEILUNG</text>
      <text x="20" y="10" textAnchor="middle" fontSize="2" fill="#5b7fa6" opacity="0.7" letterSpacing="0.3">LEGISLATIVE</text>
      <text x="80" y="10" textAnchor="middle" fontSize="2" fill="#c4392b" opacity="0.7" letterSpacing="0.3">EXEKUTIVE</text>
      <text x="50" y="98" textAnchor="middle" fontSize="2" fill="#4a8c6a" opacity="0.7" letterSpacing="0.3">JUDIKATIVE</text>
    </svg>
  );
}

// ─── DETAIL PANEL (right) ─────────────────────────────────────────────────────

function DetailPanel({ id }) {
  if (!id) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      height:200,gap:10,color:"#a09080",textAlign:"center"}}>
      <div style={{fontSize:36,opacity:0.35}}>🏛️</div>
      <div style={{fontSize:12,lineHeight:1.7}}>Institution auswählen<br/>für Details</div>
    </div>
  );
  const inst = INSTITUTIONS[id];
  return (
    <div>
      {/* Badge + Name */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:10,background:`${inst.color}18`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
          border:`1px solid ${inst.color}30`,flexShrink:0}}>{inst.thumb}</div>
        <div>
          <div style={{fontSize:16,fontWeight:700,fontFamily:"Georgia,serif",color:"#2a1f14",lineHeight:1.2}}>{inst.name}</div>
          <div style={{fontSize:11,color:"#a09080",fontStyle:"italic"}}>{inst.sub}</div>
        </div>
        <div style={{marginLeft:"auto",padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,
          letterSpacing:"0.06em",background:`${inst.color}15`,color:inst.color,whiteSpace:"nowrap"}}>
          {inst.gewalt}
        </div>
      </div>

      {/* Sections */}
      {[
        { title:"ÜBERBLICK", content:
          <p style={{fontSize:12.5,lineHeight:1.7,color:"#5a4e3a"}}>{inst.desc}</p> },
        { title:"AUFGABEN", content:
          <div>{inst.aufgaben.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:7,marginBottom:5,fontSize:12,color:"#5a4e3a"}}>
              <span style={{color:inst.color,fontWeight:700,marginTop:1}}>→</span><span>{a}</span>
            </div>
          ))}</div> },
        { title:"KENNZAHLEN", content:
          <div>{inst.facts.map((f,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",
              padding:"5px 0",borderBottom:i<inst.facts.length-1?"1px solid #ede7d9":"none",fontSize:12}}>
              <span style={{color:"#a09080",fontWeight:600,fontSize:11}}>{f.l}</span>
              <span style={{color:"#2a1f14",fontWeight:500}}>{f.v}</span>
            </div>
          ))}</div> },
        { title:"BEZIEHUNGEN", content:
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {inst.relations.map((r,i)=>(
              <span key={i} style={{padding:"3px 9px",borderRadius:20,fontSize:11,
                background:"#f0e8d8",border:"1px solid #ddd0bc",color:"#5a4e3a"}}>
                {r}
              </span>
            ))}
          </div> },
        { title:"WISSENSWERTES", content:
          <p style={{fontSize:12,lineHeight:1.65,color:"#7a6e5e",fontStyle:"italic",
            background:"#faf5ec",padding:"8px 10px",borderRadius:8,border:"1px solid #e8dcc8"}}>
            {inst.note}
          </p> },
      ].map(s=>(
        <div key={s.title} style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"#b0a090",
            marginBottom:7,paddingBottom:5,borderBottom:"1px solid #ede7d9"}}>{s.title}</div>
          {s.content}
        </div>
      ))}
    </div>
  );
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────

const CHIPS = ["Wie entstehen Gesetze?","Was ist Gewaltenteilung?","Wer wählt den Kanzler?","Was schützt das GG?"];

function Chat({ activeInst }) {
  const [msgs, setMsgs] = useState([
    {r:"ai", t:"Hallo! Ich bin dein Assistent für das politische System Deutschlands. Stell mir eine Frage! 🇩🇪"}
  ]);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,busy]);

  async function send(text) {
    const msg = text||inp.trim();
    if (!msg||busy) return;
    setInp("");
    setMsgs(m=>[...m,{r:"user",t:msg}]);
    setBusy(true);
    const ctx = activeInst ? `Aktuell angezeigte Institution: "${INSTITUTIONS[activeInst]?.name}".` : "";
    try {
      const res = await fetch("/.netlify/functions/chat",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:500,
          system:`Du bist ein Lernassistent für das politische System Deutschlands (Klasse 9–10). Antworte auf Deutsch, freundlich, max. 3–4 Sätze. ${ctx}`,
          messages:[{role:"user",content:msg}]
        })
      });
      const d = await res.json();
      if (d.error) {
        setMsgs(m=>[...m,{r:"ai",t:`Fehler: ${d.error}`}]);
      } else {
        setMsgs(m=>[...m,{r:"ai",t:d.content?.[0]?.text||"Keine Antwort."}]);
      }
    } catch(err) { setMsgs(m=>[...m,{r:"ai",t:`Verbindungsfehler: ${err.message}`}]); }
    setBusy(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:4}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",
            alignItems:m.r==="user"?"flex-end":"flex-start"}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",
              color:"#b0a090",marginBottom:3}}>{m.r==="user"?"Du":"KI-Assistent"}</div>
            <div style={{padding:"9px 12px",maxWidth:"90%",fontSize:12.5,lineHeight:1.65,
              borderRadius:m.r==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",
              background:m.r==="user"?"#2a1f14":"#f0e8d8",
              color:m.r==="user"?"#f5efe6":"#2a1f14",
              border:m.r==="ai"?"1px solid #ddd0bc":"none"}}>{m.t}</div>
          </div>
        ))}
        {busy&&(
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",color:"#b0a090",marginBottom:3}}>KI-ASSISTENT</div>
            <div style={{display:"flex",gap:4,padding:"9px 12px",background:"#f0e8d8",
              border:"1px solid #ddd0bc",borderRadius:"12px 12px 12px 4px",width:"fit-content"}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#a09080",
                  animation:"b 1.4s ease infinite",animationDelay:`${i*0.2}s`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div style={{flexShrink:0,paddingTop:10,borderTop:"1px solid #ede7d9"}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {CHIPS.map(c=>(
            <button key={c} onClick={()=>send(c)}
              style={{padding:"3px 9px",borderRadius:20,border:"1px solid #ddd0bc",
                background:"#faf5ec",fontSize:11,cursor:"pointer",color:"#5a4e3a",fontFamily:"inherit"}}>
              {c}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          <input value={inp} onChange={e=>setInp(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Frage stellen..."
            style={{flex:1,padding:"8px 11px",border:"1px solid #ddd0bc",borderRadius:8,
              background:"#faf5ec",fontSize:12.5,fontFamily:"inherit",color:"#2a1f14",outline:"none"}}/>
          <button onClick={()=>send()}
            style={{width:36,height:36,borderRadius:8,background:"#2a1f14",border:"none",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
      <style>{`@keyframes b{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}

// ─── GESETZGEBUNG ─────────────────────────────────────────────────────────────

function Gesetzgebung() {
  const [step, setStep] = useState(0);
  const s = GESETZE[step];
  return (
    <div style={{maxWidth:720,margin:"0 auto",padding:24}}>
      <div style={{fontSize:11,letterSpacing:"0.12em",color:"#a09080",marginBottom:4}}>LERNLANDSCHAFT</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:700,color:"#2a1f14",marginBottom:4}}>Gesetzgebungsverfahren</div>
      <div style={{fontSize:13,color:"#8a7d68",fontStyle:"italic",marginBottom:24}}>Wie entsteht ein Bundesgesetz? — 8 Schritte</div>

      {/* Progress bar */}
      <div style={{background:"#ede7d9",borderRadius:20,height:6,marginBottom:24}}>
        <div style={{background:"#c4392b",borderRadius:20,height:6,width:`${((step+1)/8)*100}%`,transition:"width 0.3s"}}/>
      </div>

      {/* Step cards row */}
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {GESETZE.map((g,i)=>(
          <button key={i} onClick={()=>setStep(i)}
            style={{flex:"1 0 auto",minWidth:32,padding:"6px 4px",borderRadius:8,
              border:`1px solid ${step===i?"#c4392b":"#ddd0bc"}`,
              background:step===i?"#2a1f14":i<step?"#f0e8d8":"white",
              color:step===i?"white":i<step?"#5a4e3a":"#a09080",
              fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
              transition:"all 0.2s"}}>
            {g.nr}
          </button>
        ))}
      </div>

      {/* Main step card */}
      <div style={{background:"white",borderRadius:16,border:"1px solid #e0d4c0",
        boxShadow:"0 4px 20px rgba(0,0,0,0.07)",overflow:"hidden"}}>
        <div style={{background:"#2a1f14",padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:30}}>{s.icon}</span>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.1em",color:"#a09080",marginBottom:2}}>SCHRITT {s.nr} VON 8</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:"white"}}>{s.titel}</div>
          </div>
        </div>
        <div style={{padding:"16px 20px"}}>
          <p style={{fontSize:13.5,lineHeight:1.75,color:"#4a3f30",marginBottom:14}}>{s.text}</p>
          <div style={{fontSize:10,letterSpacing:"0.1em",color:"#a09080",marginBottom:8}}>BETEILIGTE</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {s.wer.map((w,i)=>(
              <span key={i} style={{padding:"4px 12px",borderRadius:20,background:"#f0e8d8",
                border:"1px solid #ddd0bc",fontSize:12,color:"#5a4e3a",fontWeight:500}}>{w}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}
          style={{flex:1,padding:10,borderRadius:8,border:"1px solid #ddd0bc",
            background:step===0?"#f5f0e8":"white",cursor:step===0?"not-allowed":"pointer",
            fontSize:13,color:step===0?"#c0b8a8":"#2a1f14",fontFamily:"inherit"}}>← Zurück</button>
        <button onClick={()=>setStep(Math.min(7,step+1))} disabled={step===7}
          style={{flex:1,padding:10,borderRadius:8,border:"none",
            background:step===7?"#c0b8a8":"#c4392b",cursor:step===7?"not-allowed":"pointer",
            fontSize:13,color:"white",fontFamily:"inherit",fontWeight:600}}>Weiter →</button>
      </div>
    </div>
  );
}

// ─── GRUNDRECHTE ──────────────────────────────────────────────────────────────

function Grundrechte() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{maxWidth:720,margin:"0 auto",padding:24}}>
      <div style={{fontSize:11,letterSpacing:"0.12em",color:"#a09080",marginBottom:4}}>LERNLANDSCHAFT</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:700,color:"#2a1f14",marginBottom:4}}>Grundrechte</div>
      <div style={{fontSize:13,color:"#8a7d68",fontStyle:"italic",marginBottom:24}}>Art. 1–19 Grundgesetz — Klicke für Details</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {GRUNDRECHTE.map((g,i)=>{
          const isOpen = open===i;
          return (
            <div key={i} onClick={()=>setOpen(isOpen?null:i)}
              style={{background:"white",borderRadius:12,border:`1px solid ${isOpen?g.color:"#e0d4c0"}`,
                borderLeft:`4px solid ${g.color}`,cursor:"pointer",overflow:"hidden",
                boxShadow:isOpen?"0 4px 16px rgba(0,0,0,0.08)":"0 1px 4px rgba(0,0,0,0.04)",
                transition:"all 0.2s"}}>
              <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontWeight:700,fontSize:12,color:g.color,minWidth:48,
                  fontFamily:"Georgia,serif"}}>{g.art}</span>
                <span style={{fontWeight:600,fontSize:13,color:"#2a1f14",flex:1}}>{g.titel}</span>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:600,
                  background:`${g.color}15`,color:g.color,whiteSpace:"nowrap"}}>{g.kat}</span>
                <span style={{color:"#a09080",fontSize:14,transition:"transform 0.2s",
                  transform:isOpen?"rotate(90deg)":"rotate(0deg)"}}>›</span>
              </div>
              {isOpen&&(
                <div style={{padding:"0 16px 14px",borderTop:"1px solid #f0e8d8"}}>
                  <p style={{fontSize:13,lineHeight:1.75,color:"#5a4e3a",marginTop:10}}>{g.text}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("institutionen");
  const [selected, setSelected] = useState("bundestag");
  const [rightTab, setRightTab] = useState("details");

  const inst = INSTITUTIONS[selected];

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",
      background:"#f5efe6",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#2a1f14",overflow:"hidden"}}>

      {/* ── HEADER ── */}
      <div style={{background:"#2a1f14",padding:"0 20px",height:54,display:"flex",
        alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,background:"#c4392b",borderRadius:10,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🦅</div>
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:700,color:"#f5efe6",
              letterSpacing:"0.01em"}}>Demokratie Studio</div>
            <div style={{fontSize:10,color:"#a09080",letterSpacing:"0.1em",textTransform:"uppercase"}}>
              Erkunde das politische System auf einen Blick +</div>
          </div>
        </div>
        <div style={{display:"flex",gap:16}}>
          {[["institutionen","Institutionen"],["gesetzgebung","Gesetzgebung"],["grundrechte","Grundrechte"]].map(([k,l])=>(
            <button key={k} onClick={()=>setView(k)}
              style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",
                fontSize:13,color:view===k?"#f5efe6":"#7a6e5e",
                fontWeight:view===k?600:400,
                borderBottom:view===k?"2px solid #c4392b":"2px solid transparent",
                paddingBottom:2,transition:"all 0.2s"}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── INSTITUTIONEN VIEW ── */}
      {view==="institutionen" && (
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>

          {/* LEFT sidebar */}
          <div style={{width:200,background:"#fdf8f0",borderRight:"1px solid #e8dcc8",
            overflowY:"auto",flexShrink:0,padding:"12px 0"}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",color:"#b0a090",
              padding:"0 14px",marginBottom:10}}>INSTITUTIONEN</div>
            {Object.entries(INSTITUTIONS).map(([id,inst])=>{
              const isActive = selected===id;
              return (
                <div key={id} onClick={()=>{setSelected(id);setRightTab("details");}}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",
                    cursor:"pointer",background:isActive?"#f0e4d0":"transparent",
                    borderLeft:`3px solid ${isActive?inst.color:"transparent"}`,
                    transition:"all 0.15s"}}>
                  <div style={{width:34,height:34,borderRadius:8,background:isActive?`${inst.color}20`:"#f0e8d8",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,
                    border:`1px solid ${isActive?inst.color+"40":"#e0d4c0"}`}}>{inst.thumb}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:isActive?700:500,color:isActive?"#2a1f14":"#5a4e3a",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{inst.name}</div>
                    <div style={{fontSize:10,color:"#a09080"}}>{inst.sub}</div>
                  </div>
                </div>
              );
            })}

            <div style={{padding:"12px 14px 4px",marginTop:8,borderTop:"1px solid #e8dcc8"}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",color:"#b0a090",marginBottom:8}}>GEWALTEN</div>
              {GEWALT_ITEMS.map(g=>(
                <div key={g.label} style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:g.color,flexShrink:0}}/>
                  <span style={{fontSize:11,color:"#7a6e5e"}}>{g.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER: network + bottom strip */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
            {/* Main network area */}
            <div style={{flex:1,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:16,left:20,zIndex:2}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:24,fontWeight:700,color:"#2a1f14",lineHeight:1.1}}>
                  {inst.name}
                </div>
                <div style={{fontSize:13,color:"#a09080",fontStyle:"italic",marginTop:2}}>{inst.sub}</div>
              </div>

              {/* View mode buttons — styled like original */}
              <div style={{position:"absolute",top:16,right:16,zIndex:2,
                background:"white",borderRadius:10,border:"1px solid #e0d4c0",
                padding:"6px 10px",display:"flex",gap:8,
                boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
                {["🔵","⬡","⏱"].map((icon,i)=>(
                  <button key={i} style={{width:30,height:30,borderRadius:7,border:"1px solid #e0d4c0",
                    background:i===0?"#2a1f14":"white",fontSize:14,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</button>
                ))}
              </div>

              {/* SVG network */}
              <div style={{position:"absolute",inset:0,padding:"60px 20px 20px"}}>
                <Network selected={selected} onSelect={id=>{setSelected(id);setRightTab("details");}}/>
              </div>

              {/* Hint */}
              <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",
                background:"rgba(42,31,20,0.65)",color:"rgba(245,239,230,0.9)",fontSize:11,
                padding:"5px 14px",borderRadius:20,pointerEvents:"none",whiteSpace:"nowrap"}}>
                💡 Klicke auf eine Institution
              </div>
            </div>

            {/* Bottom strip — like "Microscope View" + "Compare Cells" */}
            <div style={{background:"#fdf8f0",borderTop:"1px solid #e8dcc8",
              padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start",flexShrink:0}}>
              {/* Gewalten mini cards */}
              <div style={{flex:1}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",color:"#b0a090",marginBottom:8}}>
                  GEWALTEN ⓘ</div>
                <div style={{display:"flex",gap:8}}>
                  {GEWALT_ITEMS.map(g=>(
                    <div key={g.label} onClick={()=>setSelected(g.ids[0])}
                      style={{flex:1,background:"white",border:`1px solid ${g.color}30`,borderRadius:8,
                        padding:"8px 10px",cursor:"pointer",transition:"all 0.15s",
                        borderTop:`3px solid ${g.color}`}}>
                      <div style={{fontSize:11,fontWeight:700,color:g.color,marginBottom:3}}>{g.label}</div>
                      <div style={{fontSize:10,color:"#a09080"}}>{g.ids.join(", ")}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Quick compare */}
              <div style={{minWidth:160}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",color:"#b0a090",marginBottom:8}}>
                  VERGLEICH ⓘ</div>
                <div style={{background:"white",border:"1px solid #e0d4c0",borderRadius:8,
                  padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{textAlign:"center",flex:1}}>
                    <div style={{fontSize:18}}>{inst.thumb}</div>
                    <div style={{fontSize:10,color:"#5a4e3a",fontWeight:600}}>{inst.name}</div>
                    <div style={{fontSize:9,color:"#a09080"}}>{inst.gewalt}</div>
                  </div>
                  <div style={{fontSize:11,color:"#a09080",fontWeight:700}}>vs</div>
                  <div style={{textAlign:"center",flex:1,opacity:0.4}}>
                    <div style={{fontSize:18}}>❓</div>
                    <div style={{fontSize:10,color:"#5a4e3a"}}>Wählen</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT panel */}
          <div style={{width:280,background:"#fdf8f0",borderLeft:"1px solid #e8dcc8",
            display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
            {/* Tabs */}
            <div style={{display:"flex",borderBottom:"1px solid #e8dcc8",flexShrink:0}}>
              {[["details","📋  Details"],["chat","🤖  KI-Assistent"]].map(([t,l])=>(
                <button key={t} onClick={()=>setRightTab(t)}
                  style={{flex:1,padding:"10px 6px",fontSize:11,fontWeight:700,cursor:"pointer",
                    background:"none",border:"none",fontFamily:"inherit",letterSpacing:"0.04em",
                    color:rightTab===t?"#c4392b":"#a09080",
                    borderBottom:`2px solid ${rightTab===t?"#c4392b":"transparent"}`,transition:"all 0.2s"}}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:16}}>
              {rightTab==="details" ? <DetailPanel id={selected}/> : <Chat activeInst={selected}/>}
            </div>
          </div>
        </div>
      )}

      {view==="gesetzgebung" && <div style={{flex:1,overflowY:"auto"}}><Gesetzgebung/></div>}
      {view==="grundrechte"  && <div style={{flex:1,overflowY:"auto"}}><Grundrechte/></div>}
    </div>
  );
}
