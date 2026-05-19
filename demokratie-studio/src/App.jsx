import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ── Data ──────────────────────────────────────────────────────────────────
const SUPPLY_CHAIN = [
  { id: "kobalt",    land: "DR Kongo",         kuerzel: "DRC", lat: -4,  lng: 23,  material: "Kobalt",          bauteil: "Akku",              icon: "🔋", farbe: "#e85d04", beschreibung: "60% des weltweiten Kobalts stammen aus dem Kongo — essenziell für Lithium-Ionen-Akkus.", fakt: "Ein Smartphone-Akku enthält ca. 5–10g Kobalt. Kinderarbeit in Minen ist ein kritisches Problem." },
  { id: "lithium",   land: "Chile",            kuerzel: "CHL", lat: -30, lng: -71, material: "Lithium",          bauteil: "Akku",              icon: "⚡", farbe: "#ffbe0b", beschreibung: "Chile besitzt die größten Lithiumreserven der Welt im sogenannten 'Lithiumdreieck'.", fakt: "Der Lithiumabbau verbraucht enorme Mengen Wasser — in einer der trockensten Regionen der Erde." },
  { id: "chips",     land: "Taiwan",           kuerzel: "TWN", lat: 23.5,lng: 121, material: "Hochleistungs-Chips", bauteil: "Prozessor",      icon: "⚙️", farbe: "#06d6a0", beschreibung: "TSMC in Taiwan fertigt über 90% aller fortschrittlichen Chips der Welt.", fakt: "Taiwan ist geopolitisch extrem strategisch — ein Konflikt würde die globale Elektronikindustrie lahmlegen." },
  { id: "silizium",  land: "China",            kuerzel: "CHN", lat: 35,  lng: 105, material: "Silizium",         bauteil: "Halbleiter",        icon: "💾", farbe: "#3a86ff", beschreibung: "China ist weltgrößter Produzent von Silizium und Halbleitern.", fakt: "Ein modernes Smartphone enthält über 1 Milliarde Transistoren auf einem Chip kleiner als ein Fingernagel." },
  { id: "montage",   land: "Shenzhen",         kuerzel: "SHZ", lat: 22.5,lng: 114, material: "Montage",          bauteil: "Fertigung",         icon: "🏭", farbe: "#fb5607", beschreibung: "Foxconn und andere Hersteller in Shenzhen montieren die meisten Smartphones der Welt.", fakt: "Foxconn beschäftigt über 1 Million Menschen. Die Fabrik in Zhengzhou heißt 'iPhone City'." },
  { id: "seltene",   land: "Inner-Mongolei",   kuerzel: "MNG", lat: 44,  lng: 113, material: "Seltene Erden",    bauteil: "Magnete & LEDs",    icon: "🧲", farbe: "#c77dff", beschreibung: "China kontrolliert ~80% der weltweiten Produktion Seltener Erden.", fakt: "Ein Smartphone enthält bis zu 16 verschiedene Seltene Erden. Ohne sie kein Lautsprecher, keine Vibration." },
  { id: "glas",      land: "USA",              kuerzel: "USA", lat: 40,  lng: -100, material: "Gorilla Glass",   bauteil: "Display-Schutzglas",icon: "📱", farbe: "#8338ec", beschreibung: "Corning (USA) produziert das weltweit meistgenutzte Schutzglas für Smartphones.", fakt: "Gorilla Glass ist bis zu 4× bruchsicherer als normales Glas — verbaut in über 8 Milliarden Geräten." },
  { id: "gold",      land: "Australien",       kuerzel: "AUS", lat: -25, lng: 133, material: "Gold & Kupfer",    bauteil: "Leiterbahnen",      icon: "🥇", farbe: "#f4d35e", beschreibung: "Gold und Kupfer werden für Leiterbahnen auf Platinen genutzt — Australien ist Hauptlieferant.", fakt: "In einer Tonne Smartphones steckt mehr Gold als in einer Tonne Golderz. E-Waste-Recycling wird immer wichtiger." },
];

const ZIEL = { lat: 51, lng: 10, name: "Deutschland", icon: "🛒", farbe: "#22c55e" };

// ── Helpers ───────────────────────────────────────────────────────────────
function latLngToVec3(lat, lng, r = 1) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function greatCirclePoints(lat1, lng1, lat2, lng2, n = 60, r = 1.02) {
  const v1 = latLngToVec3(lat1, lng1, 1).normalize();
  const v2 = latLngToVec3(lat2, lng2, 1).normalize();
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const v = new THREE.Vector3().lerpVectors(v1, v2, t).normalize().multiplyScalar(r);
    pts.push(v);
  }
  return pts;
}

// ── Globe Component ───────────────────────────────────────────────────────
function Globe({ active, onSelect }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 2.8);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.DirectionalLight(0x88aaff, 1.2);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Globe sphere
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x0a1628,
      emissive: 0x071020,
      shininess: 30,
      transparent: true,
      opacity: 0.95,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(1.04, 64, 64);
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0x1a4a8a,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Lat/Lng grid lines
    const gridMat = new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.4 });
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = [];
      for (let lng = 0; lng <= 360; lng += 4) pts.push(latLngToVec3(lat, lng - 180, 1.001));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let lng = 0; lng < 360; lng += 30) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 4) pts.push(latLngToVec3(lat, lng - 180, 1.001));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    // Country dots (simplified land masses)
    const landDots = [
      // Europe
      ...[...Array(40)].map((_, i) => ({ lat: 48 + Math.random()*12, lng: -5 + Math.random()*30 })),
      // North America
      ...[...Array(50)].map((_, i) => ({ lat: 35 + Math.random()*25, lng: -120 + Math.random()*60 })),
      // South America
      ...[...Array(35)].map((_, i) => ({ lat: -40 + Math.random()*50, lng: -75 + Math.random()*30 })),
      // Africa
      ...[...Array(55)].map((_, i) => ({ lat: -30 + Math.random()*60, lng: -10 + Math.random()*50 })),
      // Asia
      ...[...Array(80)].map((_, i) => ({ lat: 10 + Math.random()*50, lng: 60 + Math.random()*90 })),
      // Australia
      ...[...Array(25)].map((_, i) => ({ lat: -35 + Math.random()*20, lng: 115 + Math.random()*35 })),
    ];

    const dotGeo = new THREE.SphereGeometry(0.004, 4, 4);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x1e3a5f });
    landDots.forEach(({ lat, lng }) => {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(latLngToVec3(lat, lng, 1.002));
      scene.add(dot);
    });

    // Supply chain nodes
    const nodeMeshes = {};
    const nodeGeo = new THREE.SphereGeometry(0.022, 16, 16);

    [...SUPPLY_CHAIN, { ...ZIEL, id: "ziel" }].forEach(s => {
      const mat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(s.farbe),
        emissive: new THREE.Color(s.farbe),
        emissiveIntensity: 0.5,
        shininess: 80,
      });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.copy(latLngToVec3(s.lat, s.lng, 1.025));
      mesh.userData = { id: s.id || "ziel" };
      scene.add(mesh);
      nodeMeshes[s.id || "ziel"] = mesh;

      // Halo ring
      const ringGeo = new THREE.RingGeometry(0.03, 0.036, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(s.farbe), transparent: true, opacity: 0.4, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(latLngToVec3(s.lat, s.lng, 1.027));
      ring.lookAt(0, 0, 0);
      ring.rotateX(Math.PI / 2);
      scene.add(ring);
    });

    // Arc lines
    const arcLines = {};
    SUPPLY_CHAIN.forEach(s => {
      const pts = greatCirclePoints(s.lat, s.lng, ZIEL.lat, ZIEL.lng, 80, 1.06);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(s.farbe),
        transparent: true,
        opacity: 0.25,
        linewidth: 1,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      arcLines[s.id] = { line, mat, pts };
    });

    // Animated arc particles
    const particles = {};
    SUPPLY_CHAIN.forEach(s => {
      const geo = new THREE.SphereGeometry(0.008, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(s.farbe), transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      particles[s.id] = { mesh, progress: Math.random(), pts: arcLines[s.id].pts };
    });

    sceneRef.current = { renderer, scene, camera, nodeMeshes, arcLines, particles, globe };

    // Mouse interaction
    let isDragging = false, prevMouse = { x: 0, y: 0 };
    let rotX = 0.3, rotY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = e => {
      if (!isDragging) return;
      isDragging = false;
    };
    const onMouseMove = e => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotY += dx * 0.005;
      rotX += dy * 0.005;
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onClick = e => {
      const rect = el.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Object.values(nodeMeshes));
      if (hits.length) onSelect(hits[0].object.userData.id);
    };
    const onTouch = e => {
      const t = e.touches[0];
      isDragging = true;
      prevMouse = { x: t.clientX, y: t.clientY };
    };
    const onTouchMove = e => {
      const t = e.touches[0];
      const dx = t.clientX - prevMouse.x, dy = t.clientY - prevMouse.y;
      rotY += dx * 0.005; rotX += dy * 0.005;
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      prevMouse = { x: t.clientX, y: t.clientY };
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    el.addEventListener("click", onClick);
    el.addEventListener("touchstart", onTouch);
    el.addEventListener("touchmove", onTouchMove);

    // Animation loop
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!isDragging) rotY += 0.001;

      globe.rotation.y = rotY;
      globe.rotation.x = rotX;
      Object.values(nodeMeshes).forEach(m => { m.rotation.y = rotY; m.rotation.x = rotX; });
      Object.values(arcLines).forEach(({ line }) => { line.rotation.y = rotY; line.rotation.x = rotX; });

      // Move particles
      const activeId = sceneRef.current.activeId;
      Object.entries(particles).forEach(([id, p]) => {
        p.progress = (p.progress + (id === activeId ? 0.012 : 0.004)) % 1;
        const idx = Math.floor(p.progress * (p.pts.length - 1));
        const pt = p.pts[idx].clone();
        // rotate with globe
        pt.applyEuler(new THREE.Euler(rotX, rotY, 0));
        p.mesh.position.copy(pt);
        p.mesh.material.opacity = id === activeId ? 1 : 0.4;
        p.mesh.scale.setScalar(id === activeId ? 1.4 : 0.8);
      });

      // Arc opacity
      Object.entries(arcLines).forEach(([id, { mat }]) => {
        mat.opacity = id === activeId ? 0.9 : 0.15;
        mat.color.set(id === activeId ? SUPPLY_CHAIN.find(s => s.id === id).farbe : "#1e3a5f");
      });

      // Node pulse
      Object.entries(nodeMeshes).forEach(([id, mesh]) => {
        const isActive = id === activeId;
        mesh.material.emissiveIntensity = isActive ? 0.9 + Math.sin(Date.now() * 0.005) * 0.3 : 0.3;
        mesh.scale.setScalar(isActive ? 1.5 : 1);
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const W = el.clientWidth, H = el.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("click", onClick);
      el.removeEventListener("touchstart", onTouch);
      el.removeEventListener("touchmove", onTouchMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    sceneRef.current.activeId = active;
  }, [active]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />;
}

// ── Chat ──────────────────────────────────────────────────────────────────
const CHIPS_LIST = ["Warum ist Taiwan so wichtig?", "Was sind Seltene Erden?", "Ist Kobaltabbau nachhaltig?", "Was kostet ein Smartphone wirklich?"];

function Chat({ active }) {
  const [msgs, setMsgs] = useState([{ r: "ai", t: "Hallo! Drehe den Globus und klicke auf eine Station — oder stelle mir direkt eine Frage zur Lieferkette! 🌍" }]);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const lastActive = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  useEffect(() => {
    if (active && active !== "ziel" && active !== lastActive.current) {
      lastActive.current = active;
      const s = SUPPLY_CHAIN.find(s => s.id === active);
      if (s) autoSend(`Erkläre kurz die Rolle von ${s.land} in der Smartphone-Lieferkette (${s.material} für ${s.bauteil}).`, s.land);
    }
  }, [active]);

  async function autoSend(msg, label) {
    setMsgs(m => [...m, { r: "user", t: `📍 ${label}` }]);
    setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Du bist ein Lernassistent für globale Lieferketten und Globalisierung (Klasse 9–10). Antworte auf Deutsch, klar, max. 3–4 Sätze. Nutze das Smartphone als konkretes Beispiel.",
          messages: [{ role: "user", content: msg }]
        })
      });
      const d = await res.json();
      setMsgs(m => [...m, { r: "ai", t: d.error ? `Fehler: ${d.error}` : d.content?.[0]?.text || "Keine Antwort." }]);
    } catch (e) { setMsgs(m => [...m, { r: "ai", t: `Fehler: ${e.message}` }]); }
    setBusy(false);
  }

  async function send(text) {
    const msg = text || inp.trim();
    if (!msg || busy) return;
    setInp("");
    setMsgs(m => [...m, { r: "user", t: msg }]);
    setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Du bist ein Lernassistent für globale Lieferketten (Klasse 9–10). Antworte auf Deutsch, klar, max. 3–4 Sätze.",
          messages: [{ role: "user", content: msg }]
        })
      });
      const d = await res.json();
      setMsgs(m => [...m, { r: "ai", t: d.error ? `Fehler: ${d.error}` : d.content?.[0]?.text || "Keine Antwort." }]);
    } catch (e) { setMsgs(m => [...m, { r: "ai", t: `Fehler: ${e.message}` }]); }
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "14px 14px 8px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.r === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 3 }}>{m.r === "user" ? "Du" : "KI-Assistent"}</div>
            <div style={{ padding: "9px 12px", maxWidth: "90%", fontSize: 12.5, lineHeight: 1.65,
              borderRadius: m.r === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              background: m.r === "user" ? "#0f172a" : "#1e293b",
              color: m.r === "user" ? "#f8fafc" : "#cbd5e1",
              border: m.r === "ai" ? "1px solid #334155" : "none" }}>{m.t}</div>
          </div>
        ))}
        {busy && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>KI-Assistent</div>
            <div style={{ display: "flex", gap: 4, padding: "9px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: "12px 12px 12px 4px", width: "fit-content" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#475569", animation: "b 1.4s ease infinite", animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "8px 14px 12px", borderTop: "1px solid #1e293b", flexShrink: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {CHIPS_LIST.map(c => (
            <button key={c} onClick={() => send(c)} style={{ padding: "3px 8px", borderRadius: 20, border: "1px solid #334155", background: "#0f172a", fontSize: 10.5, cursor: "pointer", color: "#94a3b8", fontFamily: "inherit" }}>{c}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Frage zur Lieferkette..."
            style={{ flex: 1, padding: "8px 11px", border: "1px solid #334155", borderRadius: 8, background: "#0f172a", fontSize: 12.5, fontFamily: "inherit", color: "#f8fafc", outline: "none" }} />
          <button onClick={() => send()} style={{ width: 36, height: 36, borderRadius: 8, background: "#3b82f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
      <style>{`@keyframes b{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState(null);
  const [tab, setTab] = useState("info");
  const activeData = SUPPLY_CHAIN.find(s => s.id === active);

  const handleSelect = (id) => {
    if (id === "ziel") return;
    setActive(id);
    setTab("info");
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#060d1a", color: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", flexShrink: 0, background: "#0a1628" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>📱</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>Lieferketten Studio</div>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>Smartphone · Globale Produktion</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />
            <span style={{ fontSize: 11, color: "#475569" }}>8 Stationen</span>
          </div>
          <div style={{ fontSize: 11, color: "#334155" }}>Ziehe den Globus zum Drehen</div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* SIDEBAR */}
        <div style={{ width: 190, background: "#0a1628", borderRight: "1px solid #1e293b", overflowY: "auto", flexShrink: 0, padding: "12px 0" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#334155", padding: "0 14px", marginBottom: 8 }}>STATIONEN</div>
          {SUPPLY_CHAIN.map(s => (
            <div key={s.id} onClick={() => { setActive(s.id); setTab("info"); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", cursor: "pointer",
                background: active === s.id ? "#1e293b" : "transparent",
                borderLeft: `3px solid ${active === s.id ? s.farbe : "transparent"}`,
                transition: "all 0.15s" }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${s.farbe}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, border: `1px solid ${s.farbe}30` }}>{s.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: active === s.id ? "#f8fafc" : "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.material}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{s.kuerzel}</div>
              </div>
            </div>
          ))}
          <div style={{ margin: "10px 14px 0", paddingTop: 10, borderTop: "1px solid #1e293b" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#334155", marginBottom: 6 }}>ZIEL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "#22c55e15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, border: "1px solid #22c55e30" }}>🛒</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e" }}>Verbraucher</div>
                <div style={{ fontSize: 10, color: "#334155" }}>Deutschland</div>
              </div>
            </div>
          </div>
        </div>

        {/* GLOBE */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0 }}>
          <Globe active={active} onSelect={handleSelect} />

          {/* Overlay title */}
          <div style={{ position: "absolute", top: 16, left: 20, pointerEvents: "none" }}>
            {activeData ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: activeData.farbe, textShadow: `0 0 20px ${activeData.farbe}80` }}>{activeData.land}</div>
                <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{activeData.material} · {activeData.bauteil}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>Weltlieferkette</div>
                <div style={{ fontSize: 12, color: "#475569", fontStyle: "italic" }}>Smartphone-Produktion</div>
              </>
            )}
          </div>

          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(6,13,26,0.8)", color: "#64748b", fontSize: 11, padding: "5px 14px", borderRadius: 20, pointerEvents: "none", whiteSpace: "nowrap", border: "1px solid #1e293b" }}>
            🖱 Ziehen zum Drehen · Klicken für Details
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width: 275, background: "#0a1628", borderLeft: "1px solid #1e293b", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ display: "flex", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
            {[["info", "📋 Details"], ["chat", "🤖 KI-Assistent"]].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: "10px 6px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: "none", border: "none", fontFamily: "inherit", letterSpacing: "0.04em", color: tab === t ? "#3b82f6" : "#475569", borderBottom: `2px solid ${tab === t ? "#3b82f6" : "transparent"}`, transition: "all 0.2s" }}>
                {l}
              </button>
            ))}
          </div>

          {tab === "info" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {!activeData ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 12, color: "#334155", textAlign: "center" }}>
                  <div style={{ fontSize: 40, opacity: 0.3 }}>🌍</div>
                  <div style={{ fontSize: 12, lineHeight: 1.7 }}>Klicke auf einen<br />leuchtenden Punkt<br />auf dem Globus</div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${activeData.farbe}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: `1px solid ${activeData.farbe}40`, flexShrink: 0 }}>{activeData.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>{activeData.material}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{activeData.land}</div>
                    </div>
                    <div style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${activeData.farbe}20`, color: activeData.farbe, whiteSpace: "nowrap" }}>{activeData.bauteil}</div>
                  </div>
                  {[
                    { t: "ÜBERBLICK", c: <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "#94a3b8" }}>{activeData.beschreibung}</p> },
                    { t: "WISSENSWERTES", c: <p style={{ fontSize: 12, lineHeight: 1.65, color: "#64748b", fontStyle: "italic", background: "#0f172a", padding: "8px 10px", borderRadius: 8, border: `1px solid ${activeData.farbe}25` }}>{activeData.fakt}</p> },
                    { t: "ROUTE", c: (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ padding: "3px 8px", borderRadius: 20, background: `${activeData.farbe}20`, color: activeData.farbe, fontSize: 11, fontWeight: 600 }}>{activeData.icon} {activeData.kuerzel}</span>
                        <div style={{ flex: 1, height: 2, background: `linear-gradient(to right, ${activeData.farbe}, #22c55e)`, borderRadius: 2 }} />
                        <span style={{ padding: "3px 8px", borderRadius: 20, background: "#22c55e15", color: "#22c55e", fontSize: 11, fontWeight: 600 }}>🛒 DE</span>
                      </div>
                    )},
                  ].map(s => (
                    <div key={s.t} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#334155", marginBottom: 7, paddingBottom: 5, borderBottom: "1px solid #1e293b" }}>{s.t}</div>
                      {s.c}
                    </div>
                  ))}
                  <button onClick={() => setTab("chat")} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${activeData.farbe}40`, background: `${activeData.farbe}15`, color: activeData.farbe, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
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
