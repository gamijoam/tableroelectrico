/* =====================================================================
   i18n.js — Idioma de la app (español o inglés).
   La app está escrita en español; en inglés, una capa traduce lo que
   aparece en pantalla con el diccionario de i18n-en.js:
   · textos exactos ("Guardar" → "Save");
   · plantillas con datos ("Breaker {0}P {1} A" → "{0}P {1} A breaker");
   · si un texto no coincide entero, se traducen sus partes (" · ", ": ").
   Lo aplica la misma capa que traduce los voltajes del país (norma.js),
   y también el PDF, las imágenes y los textos que se envían.
   ===================================================================== */
const LANG_KEY="taller-tableros-idioma";
let LANG=(()=>{let v="";try{v=localStorage.getItem(LANG_KEY)||""}catch(e){}if(v==="en"||v==="es")return v;return/^en/i.test(navigator.language||"")?"en":"es"})();
document.documentElement.lang=LANG;
const isEN=()=>LANG==="en";
const I18N={exact:new Map(),pats:[],idx:new Map(),loose:[]};
(function build(){if(typeof EN_DICT==="undefined")return;
  const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  for(const [es,en] of Object.entries(EN_DICT)){
    if(!/\{\d+\}/.test(es)){I18N.exact.set(es,en);continue}
    /* datos pegados ("{0}{1}") van en un solo grupo y luego se busca dónde cortarlos */
    const runs=[];let src="";const parts=es.split(/(\{\d+\})/);
    for(let i=0;i<parts.length;i++){const x=parts[i];if(/^\{\d+\}$/.test(x)){const n=+x.slice(1,-1);if(i>=2&&parts[i-1]===""&&/^\{\d+\}$/.test(parts[i-2])){runs[runs.length-1].push(n)}else{runs.push([n]);src+="([\\s\\S]+?)"}}else src+=esc(x)}
    const re=new RegExp("^"+src+"$"),p={re,runs,en,w:es.replace(/\{\d+\}/g,"").length};
    const w=(es.replace(/\{\d+\}/g," ").toLowerCase().match(/[a-záéíóúñü]{3,}/g)||[])[0];
    if(w){if(!I18N.idx.has(w))I18N.idx.set(w,[]);I18N.idx.get(w).push(p)}else I18N.loose.push(p)}})();
/* un dato dentro de una plantilla: se traduce si es un texto conocido ("abierto", "la fase A"…), conservando espacios */
function trPart(g){if(g==null)return"";if(g==="es")return"s";const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(g),c=m[2];if(!c||!/[a-záéíóúñ]/i.test(c))return g;
  let t=I18N.exact.get(c);if(t==null){const up=c[0].toUpperCase()+c.slice(1);const tu=I18N.exact.get(up);if(tu!=null&&up!==c)t=tu[0].toLowerCase()+tu.slice(1)}
  if(t==null)t=trPat(c);return t==null?g:m[1]+t+m[3]}
/* la plantilla más específica (más texto fijo) que calce con el texto */
function trPat(s){const words=new Set(s.toLowerCase().match(/[a-záéíóúñü]{3,}/g)||[]);let best=null,bm=null;
  const tryP=p=>{if(best&&p.w<=best.w)return;const m=p.re.exec(s);if(m){best=p;bm=m}};
  for(const w of words){const L=I18N.idx.get(w);if(L)L.forEach(tryP)}I18N.loose.forEach(tryP);return best?fill(best,bm):null}
function fill(p,m){const val={};
  p.runs.forEach((run,i)=>{const g=m[i+1];if(run.length===1){val[run[0]]=trPart(g);return}
    if(run.length===2){/* probar dónde cortar los dos datos: gana el corte que traduce más */
      let bestK=g.length,bestS=-1;const cuts=[g.length];for(let k=1;k<g.length;k++)if(/[\s(]/.test(g[k])||/\s/.test(g[k-1]))cuts.push(k);
      for(const k of cuts){const a=g.slice(0,k),b=g.slice(k),sc=(trPart(a)!==a?1:0)+(b===""||trPart(b)!==b?1:0);if(sc>bestS){bestS=sc;bestK=k}}
      val[run[0]]=trPart(g.slice(0,bestK));val[run[1]]=trPart(g.slice(bestK));return}
    val[run[0]]=trPart(g);run.slice(1).forEach(n=>val[n]="")});
  return p.en.replace(/\{(\d+)\}/g,(x,n)=>val[n]!=null?val[n]:"")}
function trCore(s){return I18N.exact.get(s)??trPat(s)}
/* traduce un texto; deja igual lo que no conoce */
function trTxt(s){if(LANG!=="en"||!s||!/[a-záéíóúñ]/i.test(s))return s;
  const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s),mark=m[2].includes("⁠"),core=m[2].replace(/⁠/g,"").replace(/\s+/g," ");if(!core)return s;
  let t=trCore(core);
  /* signos sueltos al borde: "· texto ·", ". texto", ": texto", "↳ texto" */
  if(t==null){const pre=/^([.:;·,•↳←→↑↓]\s*|(?:\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|\uFE0F|\u200D)+\s*)/u.exec(core),suf=/(\s+[·:])$/.exec(core);
    const tries=[];if(suf)tries.push(["",core.slice(0,-suf[1].length),suf[1]]);if(pre)tries.push([pre[1],core.slice(pre[1].length),""]);if(pre&&suf)tries.push([pre[1],core.slice(pre[1].length,-suf[1].length),suf[1]]);
    for(const [a,c,z] of tries){const r=trCore(c);if(r!=null){t=a+r+z;break}}}
  /* recortado con "…" (nombres largos en el dibujo): se usa el texto conocido más corto que empiece igual */
  if(t==null&&core.endsWith("…")&&core.length<=40){const pf=core.slice(0,-1);let k=null;for(const key of I18N.exact.keys())if(key.startsWith(pf)&&(!k||key.length<k.length))k=key;
    if(k){const e=I18N.exact.get(k);t=e.length>pf.length+1?e.slice(0,pf.length).trimEnd()+"…":e}}
  /* por partes: "Breaker 20 A · Iluminación" o "Estado: funcionando" */
  if(t==null&&/ · |: | — |\n/.test(core)){let ch=false;const parts=core.split(/( · |: | — |\n)/).map(x=>{if(/^( · |: | — |\n)$/.test(x))return x;const c=x.trim();if(!c)return x;const r=trCore(c);if(r!=null){ch=true;return x.replace(c,r)}return x});if(ch)t=parts.join("")}
  if(t!=null&&mark)t=t.replace(/(\d{2,3})(?=\s?(?:\/|V|Y))/g,"$1⁠");
  return t==null?s:m[1]+t+m[3]}
/* textos de varias líneas (WhatsApp, copiar) */
const trLines=s=>LANG!=="en"?s:String(s).split("\n").map(l=>{const w=trTxt(l);if(w!==l)return w;const b=/^([•*\s]*)(.*?)(\**)$/.exec(l);return b?b[1]+trTxt(b[2])+b[3]:l}).join("\n");
/* SVG como texto (imágenes exportadas): se traduce el contenido de cada <text> */
const trSvg=s=>LANG!=="en"?s:String(s).replace(/>([^<>]+)</g,(m,t)=>">"+trTxt(t)+"<");
/* atributos que se ven */
const TR_ATTR=["placeholder","title","aria-label"];
function trAttrs(el){if(LANG!=="en"||el.nodeType!==1)return;for(const a of TR_ATTR){const v=el.getAttribute(a);if(v){const t=trTxt(v);if(t!==v)el.setAttribute(a,t)}}}
/* ventanas nativas */
if(LANG==="en"){const A=window.alert.bind(window),C=window.confirm.bind(window),P=window.prompt.bind(window);
  window.alert=m=>A(trTxt(String(m)));window.confirm=m=>C(trTxt(String(m)));window.prompt=(m,d)=>P(trTxt(String(m)),d==null?d:trTxt(String(d)))}
/* cambiar de idioma: se guarda (y en la cuenta) y la app se recarga en el idioma nuevo */
function setLang(l,noSave){if(l!=="es"&&l!=="en"||l===LANG)return;try{localStorage.setItem(LANG_KEY,l)}catch(e){}
  if(!noSave&&typeof sb!=="undefined"&&sb&&typeof acct!=="undefined"&&acct.user)sb.from("profiles").update({idioma:l}).eq("id",acct.user.id).then(()=>{});
  try{if(typeof projSave==="function")projSave()}catch(e){}setTimeout(()=>location.reload(),noSave?0:350)}
const langOptions=()=>`<option value="es"${LANG==="es"?" selected":""}>🇪🇸 Español</option><option value="en"${LANG==="en"?" selected":""}>🇺🇸 English</option>`;
