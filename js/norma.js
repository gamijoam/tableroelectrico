/* =====================================================================
   norma.js — Normativa por país.
   Cada país define: colores de cable, calibres (AWG o mm²), tensión,
   moneda local, nombre del impuesto y del registro fiscal, y la norma.
   Colores verificados en el texto oficial de cada norma:
   · Colombia  RETIE 2024 (Res. 40117), Libro 3, Tabla 3.5.a
   · Chile     Pliego RIC N°04 (SEC), punto 5.32
   · Argentina AEA 90364-7-770, Tabla 770.10.XIII
   · Perú      CNE-Utilización, Regla 030-036
   · Ecuador   NEC-SB-IE, Tabla 9
   · España    REBT, ITC-BT-19
   · Venezuela, México, Panamá, Rep. Dominicana y EE. UU.: neutro blanco
     o gris y tierra verde o desnuda (base NEC); las fases no tienen color
     obligatorio y se usa negro, rojo y azul.
   ===================================================================== */
const PAIS_KEY="taller-tableros-pais";
const NEC_COL={c1:["Negro","Rojo"],c3:["Negro","Rojo","Azul"],N:"Blanco",T:"Verde",ret:"Rojo",trav:"Amarillo"};
const PAISES={
 VE:{n:"Venezuela",f:"🇻🇪",norma:"Código Eléctrico Nacional (FONDONORMA 200)",u:"awg",v:"120/240 V y 208Y/120 V · 60 Hz",v220:false,col:NEC_COL,
     cur:{sym:"Bs",name:"bolívares"},tax:"IVA",taxD:16,fis:"RIF"},
 CO:{n:"Colombia",f:"🇨🇴",norma:"RETIE 2024 y NTC 2050",u:"awg",v:"120/240 V y 208Y/120 V · 60 Hz",v220:false,
     col:{c1:["Negro","Rojo"],c3:["Amarillo","Azul","Rojo"],N:"Blanco",T:"Verde",ret:"Negro",trav:"Naranja"},
     colNota:"En 208/120 V las fases van amarilla, azul y roja (Tabla 3.5.a del RETIE).",cur:{sym:"COP",name:"pesos colombianos"},tax:"IVA",taxD:19,fis:"NIT"},
 MX:{n:"México",f:"🇲🇽",norma:"NOM-001-SEDE-2012",u:"awg",v:"127/220 V · 60 Hz",v220:false,col:NEC_COL,cur:{sym:"MXN",name:"pesos mexicanos"},tax:"IVA",taxD:16,fis:"RFC"},
 PE:{n:"Perú",f:"🇵🇪",norma:"Código Nacional de Electricidad – Utilización",u:"mm2",v:"220 V y 380/220 V · 60 Hz",v220:true,
     col:{c1:["Negro","Rojo"],c3:["Rojo","Negro","Azul"],N:"Blanco",T:"Verde",ret:"Rojo",trav:"Azul"},
     colNota:"Trifásico: rojo (R), negro (S) y azul (T). Monofásico: negro y rojo, o negro y blanco (Regla 030-036).",cur:{sym:"S/",name:"soles"},tax:"IGV",taxD:18,fis:"RUC"},
 CL:{n:"Chile",f:"🇨🇱",norma:"Pliegos RIC (SEC)",u:"mm2",v:"220/380 V · 50 Hz",v220:true,
     col:{c1:["Azul","Negro"],c3:["Azul","Negro","Rojo"],N:"Blanco",T:"Verde",ret:"Negro",trav:"Rojo"},
     colNota:"Fase 1 azul, fase 2 negro, fase 3 rojo; neutro blanco; protección verde o verde/amarillo (RIC N°04, 5.32).",cur:{sym:"CLP",name:"pesos chilenos"},tax:"IVA",taxD:19,fis:"RUT"},
 AR:{n:"Argentina",f:"🇦🇷",norma:"Reglamentación AEA 90364",u:"mm2",v:"220/380 V · 50 Hz",v220:true,
     col:{c1:["Marrón","Negro"],c3:["Marrón","Negro","Rojo"],N:"Celeste",T:"Verde-amarillo",ret:"Negro",trav:"Rojo"},
     colNota:"L1 marrón, L2 negro, L3 rojo; neutro celeste; protección verde-amarillo (AEA 90364-7-770).",cur:{sym:"ARS",name:"pesos argentinos"},tax:"IVA",taxD:21,fis:"CUIT"},
 EC:{n:"Ecuador",f:"🇪🇨",norma:"NEC-SB-IE (Norma Ecuatoriana de la Construcción)",u:"awg",v:"120/240 V y 220Y/127 V · 60 Hz",v220:false,col:NEC_COL,
     colNota:"Neutro blanco; tierra verde o verde con franja amarilla; fases de cualquier otro color (Tabla 9).",cur:null,tax:"IVA",taxD:15,fis:"RUC"},
 PA:{n:"Panamá",f:"🇵🇦",norma:"Reglamento de Instalaciones Eléctricas (RIE, base NEC)",u:"awg",v:"120/240 V · 60 Hz",v220:false,col:NEC_COL,cur:null,tax:"ITBMS",taxD:7,fis:"RUC"},
 DO:{n:"República Dominicana",f:"🇩🇴",norma:"Código Eléctrico Nacional (base NEC)",u:"awg",v:"120/240 V · 60 Hz",v220:false,col:NEC_COL,cur:{sym:"RD$",name:"pesos dominicanos"},tax:"ITBIS",taxD:18,fis:"RNC"},
 ES:{n:"España",f:"🇪🇸",norma:"REBT (Reglamento Electrotécnico para Baja Tensión)",u:"mm2",v:"230/400 V · 50 Hz",v220:true,
     col:{c1:["Marrón","Negro"],c3:["Marrón","Negro","Gris"],N:"Celeste",T:"Verde-amarillo",ret:"Negro",trav:"Gris"},
     colNota:"Fases marrón, negro y gris; neutro azul claro; protección verde-amarillo (ITC-BT-19).",cur:{sym:"€",name:"euros"},tax:"IVA",taxD:21,fis:"NIF"},
 US:{n:"Estados Unidos",f:"🇺🇸",norma:"NEC (NFPA 70)",u:"awg",v:"120/240 V y 208Y/120 V · 60 Hz",v220:false,col:NEC_COL,cur:null,tax:"Sales tax",taxD:0,fis:"EIN"},
};
/* el país se adivina por el idioma del navegador la primera vez */
function guessPais(){const l=(navigator.languages||[navigator.language||""]).join(",").toUpperCase();for(const k of Object.keys(PAISES))if(l.includes("-"+k))return k;return"VE"}
let PAIS_ID=(()=>{const v=lsGet(PAIS_KEY);return PAISES[v]?v:guessPais()})();
const pais=()=>PAISES[PAIS_ID];
const paisElegido=()=>!!lsGet(PAIS_KEY);

/* colores extra que usan otras normas */
Object.assign(WCOL,{Marrón:"#7b4a26",Gris:"#8c9296",Celeste:"#6fc0ea",Naranja:"#ee7d1f","Verde-amarillo":"#3a9d3f"});

/* ---------- calibres: AWG o mm² ---------- */
/* mm² comerciales y la protección máxima típica (cobre PVC en tubo, IEC 60364-5-52) */
const MM_BRK=[[1.5,10],[2.5,20],[4,25],[6,32],[10,50],[16,63],[25,80],[35,100],[50,125],[70,160],[95,200],[120,225]];
/* resistencia Ω/km a 20 °C (IEC 60228) para la caída de tensión */
const MM_OHM={1.5:12.1,2.5:7.41,4:4.61,6:3.08,10:1.83,16:1.15,25:.727,35:.524,50:.387,70:.268,95:.193,120:.153};
/* equivalencia comercial AWG → mm² (el siguiente mayor) */
const AWG_MM={"14":2.5,"12":4,"10":6,"8":10,"6":16,"4":25,"3":35,"2":35,"1":50,"1/0":70,"2/0":70,"3/0":95,"4/0":120};
const mmFor=In=>(MM_BRK.find(([,b])=>b>=In)||MM_BRK[MM_BRK.length-1])[0];
const mmTxt=mm=>String(mm).replace(".",",")+" mm²";
const isMM=()=>pais().u==="mm2";
/* etiqueta de un calibre guardado en un cable ("12" = AWG, "m2.5" = mm²) */
function calTxt(k){k=String(k);if(k[0]==="m")return mmTxt(+k.slice(1));return isMM()?mmTxt(AWG_MM[k]||2.5):`#${k} AWG`}
/* cable para una protección de In amperios, como clave y como texto */
function cabKey(In){return isMM()?"m"+mmFor(In):(AWG[In]||dinAwg(In))}
const cabTxt=In=>calTxt(cabKey(In));
/* calibres para tender cables en la pared */
const WALL_AWG=["14","12","10","8","6"],WALL_MM=["m1.5","m2.5","m4","m6","m10"];
const wallCals=()=>isMM()?WALL_MM:WALL_AWG;
Object.assign(AWG_W,{"m1.5":3,"m2.5":3.6,"m4":4.3,"m6":5,"m10":5.8});
Object.assign(AWG_P,{"m1.5":.3,"m2.5":.45,"m4":.7,"m6":1,"m10":1.6,"m16":2.5,"m25":3.8,"m35":5.2,"m50":7,"m70":9.5,"m95":12.5,"m120":15.5});
Object.assign(AMPACITY,{"m1.5":15,"m2.5":21,"m4":28,"m6":36,"m10":50});
/* el cable más delgado que aguanta I amperios, en las unidades del país */
const calFor=I=>isMM()?mmTxt((MM_BRK.find(([mm])=>AMPACITY["m"+mm]>=I)||[10])[0]):"#"+AWG_FOR(I);

/* ---------- colores automáticos y leyenda ---------- */
function normaColor(role,key,tri){const c=pais().col;if(role==="F"){const i={L1:0,L2:1,L3:2}[key]??0;return(tri?c.c3:c.c1)[i]||c.c3[i]||c.c1[0]}
  return role==="N"?c.N:role==="T"?c.T:role==="ret"?c.ret:role==="trav"?c.trav:c.c1[0]}
function normaLegend(){const c=pais().col,tri=S.lc&&S.lc.sys==="3F",ph=tri?c.c3:c.c1,seen=new Set(),rows=[];
  const add=(col,l)=>{if(seen.has(col+l))return;seen.add(col+l);rows.push([col,l])};
  ph.forEach((col,i)=>add(col,`Fase ${["A (L1)","B (L2)","C (L3)"][i]}`));add(c.ret,"Retorno");add(c.trav,"Viajero 3 vías");add(c.N,"Neutro");add(c.T,"Tierra");return rows}
const colorSwatch=c=>c==="Verde-amarillo"?"repeating-linear-gradient(135deg,#3a9d3f 0 5px,#f2d22e 5px 9px)":WCOL[c]||"#1f2224";

/* ---------- moneda local, impuesto y registro fiscal ---------- */
const curLocal=()=>pais().cur;
const fmtLocal=n=>{const c=curLocal();return c?`${c.sym} ${fmtNum(n)}`:fmtUSD(n)};
const rateTxt=r=>{const c=curLocal();return c?`${fmtNum(r)} ${c.sym}/$`:""};

/* ---------- selector de país ---------- */
function paisOptions(){return Object.entries(PAISES).map(([k,p])=>`<option value="${k}"${k===PAIS_ID?" selected":""}>${p.f} ${p.n}</option>`).join("")}
function setPais(k,quiet){if(!PAISES[k])return;const was=PAIS_ID;PAIS_ID=k;lsSet(PAIS_KEY,k);document.documentElement.dataset.pais=k;
  if(typeof wAwg!=="undefined"){const ok=wallCals();if(!ok.includes(wAwg))wAwg=isMM()?"m2.5":"12"}
  paintPais();if(typeof renderAll==="function")renderAll();
  if(!quiet&&was!==k)toast(`${pais().f} ${pais().n}: colores, calibres${isMM()?" en mm²":" AWG"} y presupuesto según ${pais().norma}.${pais().v220?" El simulador todavía trabaja a 120/240 V; la versión a "+pais().v.split(" ·")[0]+" viene pronto.":""}`)}
function paintPais(){const s=$("pais");if(s){s.innerHTML=paisOptions();s.value=PAIS_ID}
  const w=$("wAwg");if(w){w.innerHTML=wallCals().map(a=>`<option value="${a}">${calTxt(a)}</option>`).join("");if(typeof wAwg!=="undefined")w.value=wAwg}
  const n=$("paisNota");if(n){const p=pais();n.innerHTML=`${p.norma} · ${p.v}${p.v220?`<br><b>Simulador a 120/240 V por ahora.</b>`:""}`}}
document.documentElement.dataset.pais=PAIS_ID;

/* tabla de cables en mm² para la calculadora: [clave, protección máxima, Ω/km] */
const CABLE_MM=MM_BRK.map(([mm,b])=>["m"+mm,b,MM_OHM[mm]]);
/* pinta todos los cables con los colores de la norma del país (plantillas y botón de la leyenda) */
function normaRecolor(wl=S.wall){if(!wl||!wl.wires)return 0;const terms=allTerms(wl);let n=0;
  wl.wires.forEach(w=>{const ta=terms.get(w.a),tb=terms.get(w.b);if(!ta||!tb)return;const c=autoColor(ta,tb);if(c&&c!==w.color){w.color=c;n++}});return n}
document.addEventListener("click",e=>{if(!e.target.closest("#normaFix"))return;let n=0;mutate(()=>{n=normaRecolor()});renderAll();
  toast(n?`${n} cable${n>1?"s":""} con los colores de ${pais().n}. Deshacer los devuelve como estaban.`:`Los cables ya tienen los colores de ${pais().n}.`)});
