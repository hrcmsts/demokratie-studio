import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const SUPPLY_CHAIN = [
  { id:"kobalt",   land:"DR Kongo",       kuerzel:"DRC", lat:-4,   lng:23,  material:"Kobalt",            bauteil:"Akku",           icon:"🔋", farbe:"#e85d04", beschreibung:"60% des weltweiten Kobalts stammen aus dem Kongo — essenziell für Lithium-Ionen-Akkus.", fakt:"Ein Smartphone-Akku enthält ca. 5–10g Kobalt. Kinderarbeit in Minen ist ein kritisches Problem." },
  { id:"lithium",  land:"Chile",          kuerzel:"CHL", lat:-30,  lng:-71, material:"Lithium",           bauteil:"Akku",           icon:"⚡", farbe:"#d4a017", beschreibung:"Chile besitzt die größten Lithiumreserven der Welt im 'Lithiumdreieck'.", fakt:"Der Lithiumabbau verbraucht enorme Mengen Wasser — in einer der trockensten Regionen der Erde." },
  { id:"chips",    land:"Taiwan",         kuerzel:"TWN", lat:23.5, lng:121, material:"Hochleistungs-Chips",bauteil:"Prozessor",      icon:"⚙️", farbe:"#0a9e6e", beschreibung:"TSMC in Taiwan fertigt über 90% aller fortschrittlichen Chips der Welt.", fakt:"Taiwan ist geopolitisch extrem strategisch — ein Konflikt würde die globale Elektronikindustrie lahmlegen." },
  { id:"silizium", land:"China",          kuerzel:"CHN", lat:35,   lng:105, material:"Silizium",          bauteil:"Halbleiter",     icon:"💾", farbe:"#2563eb", beschreibung:"China ist weltgrößter Produzent von Silizium und Halbleitern.", fakt:"Ein modernes Smartphone enthält über 1 Milliarde Transistoren auf einem Chip kleiner als ein Fingernagel." },
  { id:"montage",  land:"Shenzhen",       kuerzel:"SHZ", lat:22.5, lng:114, material:"Montage",           bauteil:"Fertigung",      icon:"🏭", farbe:"#c2410c", beschreibung:"Foxconn und andere Hersteller in Shenzhen montieren die meisten Smartphones der Welt.", fakt:"Foxconn beschäftigt über 1 Million Menschen. Die Fabrik in Zhengzhou heißt 'iPhone City'." },
  { id:"seltene",  land:"Inner-Mongolei", kuerzel:"MNG", lat:44,   lng:113, material:"Seltene Erden",     bauteil:"Magnete & LEDs", icon:"🧲", farbe:"#7c3aed", beschreibung:"China kontrolliert ~80% der weltweiten Produktion Seltener Erden.", fakt:"Ein Smartphone enthält bis zu 16 verschiedene Seltene Erden. Ohne sie kein Lautsprecher, keine Vibration." },
  { id:"glas",     land:"USA",            kuerzel:"USA", lat:38,   lng:-97, material:"Gorilla Glass",     bauteil:"Display-Glas",   icon:"📱", farbe:"#6d28d9", beschreibung:"Corning (USA) produziert das weltweit meistgenutzte Schutzglas für Smartphones.", fakt:"Gorilla Glass ist bis zu 4× bruchsicherer als normales Glas — verbaut in über 8 Milliarden Geräten." },
  { id:"gold",     land:"Australien",     kuerzel:"AUS", lat:-25,  lng:133, material:"Gold & Kupfer",     bauteil:"Leiterbahnen",   icon:"🥇", farbe:"#b45309", beschreibung:"Gold und Kupfer werden für Leiterbahnen auf Platinen genutzt — Australien ist Hauptlieferant.", fakt:"In einer Tonne Smartphones steckt mehr Gold als in einer Tonne Golderz." },
];

const ZIEL = {
  id:"ziel", lat:51, lng:10, farbe:"#16a34a", icon:"🛒", name:"Deutschland",
  material:"Verbrauchermarkt", bauteil:"Endprodukt", kuerzel:"DE",
  beschreibung:"Deutschland ist einer der größten Smartphone-Märkte Europas. Über 60 Millionen Smartphones sind im Einsatz — jedes ist das Ergebnis einer globalen Lieferkette.",
  fakt:"Die durchschnittliche Nutzungsdauer eines Smartphones in Deutschland beträgt nur 2–3 Jahre. Dabei stecken Rohstoffe aus über 10 Ländern drin.",
};

const ALL_POINTS = [...SUPPLY_CHAIN, ZIEL];

function latLngToVec3(lat, lng, r=1) {
  const phi   = (90 - lat)  * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function greatCirclePoints(lat1,lng1,lat2,lng2,n=80,r=1.06) {
  const v1 = latLngToVec3(lat1,lng1).normalize();
  const v2 = latLngToVec3(lat2,lng2).normalize();
  const pts = [];
  for (let i=0;i<=n;i++) pts.push(new THREE.Vector3().lerpVectors(v1,v2,i/n).normalize().multiplyScalar(r));
  return pts;
}

function Globe({ active, onSelect }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ rotY:0.3, rotX:0.1, isDragging:false, prevMouse:{x:0,y:0}, activeId:null });
  const sceneRef = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(W,H);
    renderer.setClearColor(0x000000,0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 100);
    camera.position.set(0,0,2.8);

    // Subtle star field
    const starVerts = [];
    for (let i=0;i<1500;i++) {
      const v = new THREE.Vector3((Math.random()-.5)*100,(Math.random()-.5)*100,(Math.random()-.5)*100);
      if (v.length()>10) starVerts.push(v.x,v.y,v.z);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts,3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color:0xaaaaaa,size:0.06,transparent:true,opacity:0.4})));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.3);
    sun.position.set(5,3,5);
    scene.add(sun);

    // Earth
    const loader = new THREE.TextureLoader();
    const earthTex  = loader.load("/earth.jpg");
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1,64,64),
      new THREE.MeshPhongMaterial({ map:earthTex, shininess:20 })
    );
    scene.add(earthMesh);

    // Clouds
    const cloudTex  = loader.load("/earth.jpg"); // fallback same tex, semi-transparent
    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.012,64,64),
      new THREE.MeshPhongMaterial({ map:cloudTex, transparent:true, opacity:0.08, depthWrite:false })
    );
    scene.add(cloudMesh);

    // Atmosphere
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.05,64,64),
      new THREE.MeshPhongMaterial({ color:0x4488ff, transparent:true, opacity:0.06, side:THREE.BackSide })
    ));

    // Nodes
    const nodeGeo = new THREE.SphereGeometry(0.022,16,16);
    const nodeMeshes = {}, nodeRings = {};
    ALL_POINTS.forEach(s => {
      const col = new THREE.Color(s.farbe);
      const mesh = new THREE.Mesh(nodeGeo,
        new THREE.MeshPhongMaterial({ color:col, emissive:col, emissiveIntensity:0.5, shininess:120 }));
      mesh.userData = { id:s.id };
      scene.add(mesh);
      nodeMeshes[s.id] = mesh;

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.03,0.037,32),
        new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:0.5, side:THREE.DoubleSide })
      );
      scene.add(ring);
      nodeRings[s.id] = ring;
    });

    // Arcs + particles
    const arcLines = {}, arcParticles = {};
    SUPPLY_CHAIN.forEach(s => {
      const pts = greatCirclePoints(s.lat,s.lng,ZIEL.lat,ZIEL.lng);
      const mat = new THREE.LineBasicMaterial({ color:new THREE.Color(s.farbe), transparent:true, opacity:0.15 });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
      scene.add(line);
      arcLines[s.id] = { line, mat, pts };

      const pm = new THREE.Mesh(
        new THREE.SphereGeometry(0.008,8,8),
        new THREE.MeshBasicMaterial({ color:new THREE.Color(s.farbe), transparent:true, opacity:0.9 })
      );
      scene.add(pm);
      arcParticles[s.id] = { mesh:pm, progress:Math.random(), pts };
    });

    sceneRef.current = { renderer, scene, camera, earthMesh, cloudMesh, nodeMeshes, nodeRings, arcLines, arcParticles };

    // Input
    const st = stateRef.current;
    const raycaster = new THREE.Raycaster();
    const mouse2 = new THREE.Vector2();
    let downPos = {x:0,y:0};

    const onDown = e => { st.isDragging=true; st.prevMouse={x:e.clientX,y:e.clientY}; downPos={x:e.clientX,y:e.clientY}; };
    const onUp   = () => { st.isDragging=false; };
    const onMove = e => {
      if (!st.isDragging) return;
      st.rotY += (e.clientX-st.prevMouse.x)*0.005;
      st.rotX += (e.clientY-st.prevMouse.y)*0.005;
      st.rotX  = Math.max(-1.2,Math.min(1.2,st.rotX));
      st.prevMouse={x:e.clientX,y:e.clientY};
    };
    const onClick = e => {
      const dx=e.clientX-downPos.x, dy=e.clientY-downPos.y;
      if (Math.sqrt(dx*dx+dy*dy)>5) return;
      const rect=el.getBoundingClientRect();
      mouse2.x = ((e.clientX-rect.left)/rect.width)*2-1;
      mouse2.y = -((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse2,camera);
      const hits = raycaster.intersectObjects(Object.values(nodeMeshes));
      if (hits.length) onSelect(hits[0].object.userData.id);
    };
    const onTouchStart = e => { const t=e.touches[0]; st.isDragging=true; st.prevMouse={x:t.clientX,y:t.clientY}; downPos={x:t.clientX,y:t.clientY}; };
    const onTouchMove  = e => {
      const t=e.touches[0];
      st.rotY+=(t.clientX-st.prevMouse.x)*0.005;
      st.rotX+=(t.clientY-st.prevMouse.y)*0.005;
      st.rotX=Math.max(-1.2,Math.min(1.2,st.rotX));
      st.prevMouse={x:t.clientX,y:t.clientY};
    };

    el.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("mousemove",onMove);
    el.addEventListener("click",onClick);
    el.addEventListener("touchstart",onTouchStart,{passive:true});
    el.addEventListener("touchmove",onTouchMove,{passive:true});

    let frame;
    const euler = new THREE.Euler();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!st.isDragging) st.rotY += 0.0008;
      euler.set(st.rotX,st.rotY,0);
      earthMesh.rotation.set(st.rotX,st.rotY,0);
      cloudMesh.rotation.set(st.rotX,st.rotY+Date.now()*0.00002,0);

      const aId = st.activeId;
      const time = Date.now()*0.004;

      Object.entries(arcLines).forEach(([id,{line,mat}]) => {
        line.rotation.set(st.rotX,st.rotY,0);
        mat.opacity = id===aId ? 0.85 : 0.1;
        mat.color.set(id===aId ? SUPPLY_CHAIN.find(s=>s.id===id).farbe : "#9ca3af");
      });
      Object.entries(arcParticles).forEach(([id,p]) => {
        p.progress=(p.progress+(id===aId?0.014:0.004))%1;
        const idx=Math.floor(p.progress*(p.pts.length-1));
        p.mesh.position.copy(p.pts[idx].clone().applyEuler(euler));
        p.mesh.material.opacity=id===aId?1:0.25;
        p.mesh.scale.setScalar(id===aId?1.6:0.7);
      });
      ALL_POINTS.forEach(s => {
        const pos=latLngToVec3(s.lat,s.lng,1.03).applyEuler(euler);
        nodeMeshes[s.id].position.copy(pos);
        const isAct=s.id===aId;
        nodeMeshes[s.id].material.emissiveIntensity=isAct?0.8+Math.sin(time)*0.2:0.4;
        nodeMeshes[s.id].scale.setScalar(isAct?1.6:1.0);
        const ring=nodeRings[s.id];
        const rPos=latLngToVec3(s.lat,s.lng,1.034).applyEuler(euler);
        ring.position.copy(rPos); ring.lookAt(0,0,0); ring.rotateX(Math.PI/2);
        ring.material.opacity=isAct?0.8+Math.sin(time)*0.2:0.3;
        ring.scale.setScalar(isAct?1.7:1.0);
      });
      renderer.render(scene,camera);
    };
    animate();

    const onResize=()=>{ const W=el.clientWidth,H=el.clientHeight; camera.aspect=W/H; camera.updateProjectionMatrix(); renderer.setSize(W,H); };
    window.addEventListener("resize",onResize);
    return ()=>{
      cancelAnimationFrame(frame);
      window.removeEventListener("mouseup",onUp); window.removeEventListener("mousemove",onMove); window.removeEventListener("resize",onResize);
      el.removeEventListener("mousedown",onDown); el.removeEventListener("click",onClick);
      el.removeEventListener("touchstart",onTouchStart); el.removeEventListener("touchmove",onTouchMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  },[]);

  useEffect(()=>{ stateRef.current.activeId=active; },[active]);
  return <div ref={mountRef} style={{width:"100%",height:"100%",cursor:"grab",background:"radial-gradient(ellipse at center,#0a1628 0%,#020810 100%)"}} />;
}

// ── Chat — NO auto-trigger ────────────────────────────────────────────────
function Chat({ active }) {
  const [msgs, setMsgs] = useState([{r:"ai",t:"Hallo! Stelle mir eine Frage zur globalen Smartphone-Lieferkette. 🌍"}]);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,busy]);

  async function send(text) {
    const msg=text||inp.trim(); if(!msg||busy)return;
    setInp(""); setMsgs(m=>[...m,{r:"user",t:msg}]); setBusy(true);
    const ctx = active ? `Aktuell ausgewählte Station: "${ALL_POINTS.find(s=>s.id===active)?.land||""}"` : "";
    try {
      const res=await fetch("/.netlify/functions/chat",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:`Du bist ein Lernassistent für globale Lieferketten (Klasse 9–10). Antworte auf Deutsch, klar, max. 3–4 Sätze. ${ctx}`,messages:[{role:"user",content:msg}]})});
      const d=await res.json();
      setMsgs(m=>[...m,{r:"ai",t:d.error?`Fehler: ${d.error}`:d.content?.[0]?.text||"Keine Antwort."}]);
    } catch(e){setMsgs(m=>[...m,{r:"ai",t:`Fehler: ${e.message}`}]);}
    setBusy(false);
  }

  const chips=["Warum ist Taiwan so wichtig?","Was sind Seltene Erden?","Ist Kobaltabbau nachhaltig?","Was kostet ein Smartphone wirklich?"];
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,padding:"14px 14px 8px"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.r==="user"?"flex-end":"flex-start"}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#a09080",marginBottom:3}}>{m.r==="user"?"Du":"KI-Assistent"}</div>
            <div style={{padding:"9px 12px",maxWidth:"90%",fontSize:12.5,lineHeight:1.65,borderRadius:m.r==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",background:m.r==="user"?"#2a1f14":"#f0e8d8",color:m.r==="user"?"#f5efe6":"#2a1f14",border:m.r==="ai"?"1px solid #ddd0bc":"none"}}>{m.t}</div>
          </div>
        ))}
        {busy&&(<div><div style={{fontSize:9,fontWeight:700,color:"#a09080",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.08em"}}>KI-Assistent</div><div style={{display:"flex",gap:4,padding:"9px 12px",background:"#f0e8d8",border:"1px solid #ddd0bc",borderRadius:"12px 12px 12px 4px",width:"fit-content"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#a09080",animation:"b 1.4s ease infinite",animationDelay:`${i*0.2}s`}}/>)}</div></div>)}
        <div ref={endRef}/>
      </div>
      <div style={{padding:"8px 14px 12px",borderTop:"1px solid #e8dcc8",flexShrink:0}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>{chips.map(c=><button key={c} onClick={()=>send(c)} style={{padding:"3px 9px",borderRadius:20,border:"1px solid #ddd0bc",background:"#faf5ec",fontSize:11,cursor:"pointer",color:"#5a4e3a",fontFamily:"inherit"}}>{c}</button>)}</div>
        <div style={{display:"flex",gap:6}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Frage zur Lieferkette..." style={{flex:1,padding:"8px 11px",border:"1px solid #ddd0bc",borderRadius:8,background:"#faf5ec",fontSize:12.5,fontFamily:"inherit",color:"#2a1f14",outline:"none"}}/>
          <button onClick={()=>send()} style={{width:36,height:36,borderRadius:8,background:"#2a1f14",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
        </div>
      </div>
      <style>{`@keyframes b{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────
function DetailPanel({ id, onChatClick }) {
  const data = ALL_POINTS.find(s=>s.id===id);
  if (!id || !data) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:200,gap:12,color:"#b0a090",textAlign:"center"}}>
      <div style={{fontSize:40,opacity:0.3}}>🌍</div>
      <div style={{fontSize:12,lineHeight:1.7}}>Klicke auf einen<br/>leuchtenden Punkt<br/>auf dem Globus</div>
    </div>
  );
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:40,height:40,borderRadius:10,background:`${data.farbe}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1px solid ${data.farbe}35`,flexShrink:0}}>{data.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:700,color:"#2a1f14",fontFamily:"Georgia,serif"}}>{data.name||data.material}</div>
          <div style={{fontSize:11,color:"#a09080"}}>{data.land||data.name}</div>
        </div>
        <div style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:`${data.farbe}18`,color:data.farbe,whiteSpace:"nowrap"}}>{data.bauteil}</div>
      </div>
      {[
        {t:"ÜBERBLICK", c:<p style={{fontSize:12.5,lineHeight:1.7,color:"#5a4e3a"}}>{data.beschreibung}</p>},
        {t:"WISSENSWERTES", c:<p style={{fontSize:12,lineHeight:1.65,color:"#7a6e5e",fontStyle:"italic",background:"#faf5ec",padding:"8px 10px",borderRadius:8,border:`1px solid ${data.farbe}25`}}>{data.fakt}</p>},
        {t:"ROUTE", c:(
          id==="ziel" ? (
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {SUPPLY_CHAIN.map(s=>(
                <span key={s.id} style={{padding:"3px 8px",borderRadius:20,background:`${s.farbe}15`,color:s.farbe,fontSize:10,fontWeight:600}}>{s.icon} {s.kuerzel}</span>
              ))}
              <span style={{padding:"3px 8px",borderRadius:20,fontSize:10,color:"#a09080"}}>→ 🛒 DE</span>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{padding:"3px 8px",borderRadius:20,background:`${data.farbe}18`,color:data.farbe,fontSize:11,fontWeight:600}}>{data.icon} {data.kuerzel}</span>
              <div style={{flex:1,height:2,background:`linear-gradient(to right,${data.farbe},#16a34a)`,borderRadius:2}}/>
              <span style={{padding:"3px 8px",borderRadius:20,background:"#16a34a15",color:"#16a34a",fontSize:11,fontWeight:600}}>🛒 DE</span>
            </div>
          )
        )},
      ].map(s=>(
        <div key={s.t} style={{marginBottom:14}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",color:"#b0a090",marginBottom:7,paddingBottom:5,borderBottom:"1px solid #e8dcc8"}}>{s.t}</div>
          {s.c}
        </div>
      ))}
      <button onClick={onChatClick} style={{width:"100%",padding:10,borderRadius:8,border:`1px solid ${data.farbe}35`,background:`${data.farbe}12`,color:data.farbe,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
        🤖 KI fragen: {data.name||data.land}
      </button>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState(null);
  const [tab, setTab] = useState("info");

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#f5efe6",color:"#2a1f14",fontFamily:"'Segoe UI',system-ui,sans-serif",overflow:"hidden"}}>

      {/* HEADER */}
      <div style={{background:"#2a1f14",padding:"0 20px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"3px solid #c4392b",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#e85d04,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>📱</div>
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:"#f5efe6",letterSpacing:"-0.01em"}}>Lieferketten Studio</div>
            <div style={{fontSize:10,color:"#a09080",letterSpacing:"0.1em",textTransform:"uppercase"}}>Erkunde die Smartphone-Produktion auf einem Blick +</div>
          </div>
        </div>
        <div style={{fontSize:11,color:"#7a6e5e"}}>🖱 Globus drehen · Punkte anklicken</div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* SIDEBAR */}
        <div style={{width:190,background:"#fdf8f0",borderRight:"1px solid #e8dcc8",overflowY:"auto",flexShrink:0,padding:"12px 0"}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",color:"#b0a090",padding:"0 14px",marginBottom:8}}>STATIONEN</div>
          {SUPPLY_CHAIN.map(s=>(
            <div key={s.id} onClick={()=>{setActive(s.id);setTab("info");}}
              style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",cursor:"pointer",background:active===s.id?"#f0e4d0":"transparent",borderLeft:`3px solid ${active===s.id?s.farbe:"transparent"}`,transition:"all 0.15s"}}>
              <div style={{width:28,height:28,borderRadius:7,background:`${s.farbe}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,border:`1px solid ${s.farbe}35`}}>{s.icon}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:11,fontWeight:600,color:active===s.id?"#2a1f14":"#5a4e3a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.material}</div>
                <div style={{fontSize:10,color:"#a09080"}}>{s.kuerzel}</div>
              </div>
            </div>
          ))}
          {/* Deutschland / Ziel — jetzt klickbar */}
          <div style={{margin:"10px 14px 0",paddingTop:10,borderTop:"1px solid #e8dcc8"}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",color:"#b0a090",marginBottom:6}}>ZIEL</div>
            <div onClick={()=>{setActive("ziel");setTab("info");}}
              style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",cursor:"pointer",borderLeft:`3px solid ${active==="ziel"?"#16a34a":"transparent"}`,paddingLeft:active==="ziel"?6:0,background:active==="ziel"?"#e8f5e8":"transparent",borderRadius:6,transition:"all 0.15s"}}>
              <div style={{width:28,height:28,borderRadius:7,background:"#16a34a15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,border:"1px solid #16a34a30",flexShrink:0}}>🛒</div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:active==="ziel"?"#16a34a":"#5a4e3a"}}>Verbraucher</div>
                <div style={{fontSize:10,color:"#a09080"}}>Deutschland</div>
              </div>
            </div>
          </div>
        </div>

        {/* GLOBE */}
        <div style={{flex:1,position:"relative",overflow:"hidden",minWidth:0}}>
          <Globe active={active} onSelect={id=>{setActive(id);setTab("info");}} />
          <div style={{position:"absolute",top:16,left:20,pointerEvents:"none"}}>
            {active ? (()=>{
              const d=ALL_POINTS.find(s=>s.id===active);
              return d ? (
                <>
                  <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:"white",lineHeight:1.1,textShadow:"0 2px 8px rgba(0,0,0,0.9)"}}>{d.name||d.land}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",fontStyle:"italic"}}>{d.material} · {d.bauteil}</div>
                </>
              ) : null;
            })() : (
              <>
                <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:"white",textShadow:"0 2px 8px rgba(0,0,0,0.9)"}}>Weltlieferkette</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",fontStyle:"italic"}}>Smartphone-Produktion · 8 Stationen</div>
              </>
            )}
          </div>
          <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",background:"rgba(42,31,20,0.7)",color:"rgba(245,239,230,0.85)",fontSize:11,padding:"5px 14px",borderRadius:20,pointerEvents:"none",whiteSpace:"nowrap"}}>
            💡 Ziehen zum Drehen · Klicken für Details
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:275,background:"#fdf8f0",borderLeft:"1px solid #e8dcc8",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
          <div style={{display:"flex",borderBottom:"1px solid #e8dcc8",flexShrink:0}}>
            {[["info","📋 Details"],["chat","🤖 KI-Assistent"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 6px",fontSize:11,fontWeight:700,cursor:"pointer",background:"none",border:"none",fontFamily:"inherit",letterSpacing:"0.04em",color:tab===t?"#c4392b":"#a09080",borderBottom:`2px solid ${tab===t?"#c4392b":"transparent"}`,transition:"all 0.2s"}}>{l}</button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:16}}>
            {tab==="info"
              ? <DetailPanel id={active} onChatClick={()=>setTab("chat")}/>
              : <Chat active={active}/>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
