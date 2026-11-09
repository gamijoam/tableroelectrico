/* =====================================================================
   metricas.js — Cuenta visitas y acciones para el panel del administrador.
   · Cada navegador tiene un número al azar (no se guarda nada personal).
   · Una visita por sesión, con su origen (?r=tiktok, Facebook, WhatsApp…),
     el tipo de equipo y si la app está instalada.
   · Acciones: probar el simulador, PDF, imagen, presupuesto por WhatsApp,
     instalar. Una vez por sesión cada una.
   · No cuenta al administrador ni las pruebas en el equipo local.
   ===================================================================== */
const MET_ID="taller-tableros-visitante";
const metOff=()=>!sb||location.hostname==="localhost"||location.hostname==="127.0.0.1"||(typeof isAdmin==="function"&&isAdmin());
let metFirst=false;
function metVisitor(){let v=lsGet(MET_ID);if(!v){v=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)).slice(0,36);lsSet(MET_ID,v);metFirst=true}return v}
function metSource(){const q=new URLSearchParams(location.search);let s=(q.get("r")||q.get("utm_source")||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,30);
  if(q.has("r")||q.has("utm_source")){q.delete("r");q.delete("utm_source");const u=location.pathname+(q.toString()?"?"+q:"")+location.hash;try{history.replaceState(null,"",u)}catch(e){}}
  if(s)return s;let h="";try{h=document.referrer?new URL(document.referrer).hostname:""}catch(e){}
  if(!h||h===location.hostname)return"directo";
  const M=[["facebook","facebook"],["fb.","facebook"],["instagram","instagram"],["tiktok","tiktok"],["whatsapp","whatsapp"],["wa.me","whatsapp"],["google","google"],["youtube","youtube"],["t.co","twitter"],["twitter","twitter"],["x.com","twitter"],["bing","bing"]];
  const m=M.find(([k])=>h.includes(k));return m?m[1]:h.replace(/^www\./,"").slice(0,30)}
function metDevice(){const c=matchMedia("(pointer:coarse)").matches,s=Math.min(screen.width,screen.height);return !c?"pc":s>=600?"tablet":"movil"}
const metInstalled=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const metDone=new Set();
async function track(kind,extra={}){if(metOff())return;const k="met-"+kind;try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1")}catch(e){if(metDone.has(k))return;metDone.add(k)}
  try{await sb.from("app_events").insert(Object.assign({visitor:metVisitor(),kind,device:metDevice(),installed:metInstalled()},extra))}catch(e){}}
async function touchSeen(){if(!sb||!acct.user)return;const t=+lsGet("taller-tableros-visto")||0;if(Date.now()-t<10*60000)return;lsSet("taller-tableros-visto",String(Date.now()));try{await sb.rpc("touch_seen")}catch(e){}}

if(sb){const src=metSource();
  setTimeout(()=>{metVisitor();track("visita",{source:src,first_visit:metFirst});touchSeen()},2500);
  sb.auth.onAuthStateChange(ev=>{if(ev==="SIGNED_IN")setTimeout(touchSeen,1500)});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")touchSeen()});
  const ACC=[["#play","simular"],["#pdf,#fPdf,#qz-pdf","pdf"],["#png,#fPng,#qz-img","imagen"],["#qz-wa","whatsapp"]];
  document.addEventListener("click",e=>{for(const [s,k] of ACC)if(e.target.closest(s)){track(k);break}},true);
  window.addEventListener("appinstalled",()=>track("instalar"))}
