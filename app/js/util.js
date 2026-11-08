/* ---------- DIN geometry: 1 unit = half DIN module (8.75 mm) ---------- */
const U=18, M=36, CH=172, SIDE=46, TOP=40, ROW_H=292, DUCT=40, COMP_Y=58, TB=74;
/* ---------- load-center geometry: 1 space = 1 inch ---------- */
const SL=44, BW=176, GAP=72, LPAD=24, BARW=34, NUMW=26, HDR=40, MAIN_H=150, DIRW=420;
const PW=2*(LPAD+BARW+NUMW+BW)+GAP, CX=PW/2, XL=CX-GAP/2-BW, XR=CX+GAP/2, LY0=HDR+MAIN_H;
const MONO="'IBM Plex Mono',ui-monospace,Menlo,monospace";
const SANS="'IBM Plex Sans',system-ui,Arial,sans-serif";

const DEFS=`
<linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfdfb"/><stop offset="1" stop-color="#e2e3df"/></linearGradient>
<linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f4f1"/><stop offset="1" stop-color="#dcdfda"/></linearGradient>
<linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4e6e3"/><stop offset="1" stop-color="#b9bdb9"/></linearGradient>
<linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#555b60"/><stop offset="1" stop-color="#2a2e31"/></linearGradient>
<linearGradient id="gBk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d4044"/><stop offset="1" stop-color="#1c1e20"/></linearGradient>
<linearGradient id="gCu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8692f"/><stop offset=".5" stop-color="#f0b07a"/><stop offset="1" stop-color="#b8692f"/></linearGradient>
<linearGradient id="gCuH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9a56d"/><stop offset="1" stop-color="#b56a33"/></linearGradient>
<linearGradient id="gNi" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9ea5aa"/><stop offset=".5" stop-color="#eef1f3"/><stop offset="1" stop-color="#9ea5aa"/></linearGradient>
<radialGradient id="gS" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#f6f7f7"/><stop offset="1" stop-color="#959ca0"/></radialGradient>
<linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5acb1"/><stop offset=".14" stop-color="#eef1f3"/><stop offset=".5" stop-color="#c2c8cc"/><stop offset=".86" stop-color="#eef1f3"/><stop offset="1" stop-color="#979ea3"/></linearGradient>
<linearGradient id="gPM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cdd2d3"/><stop offset="1" stop-color="#b4babc"/></linearGradient>
<linearGradient id="gPP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5f5f1"/><stop offset="1" stop-color="#e3e3dc"/></linearGradient>
<linearGradient id="gFM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aab1b4"/><stop offset="1" stop-color="#8b9397"/></linearGradient>
<linearGradient id="gFP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfbf8"/><stop offset="1" stop-color="#d9d9d1"/></linearGradient>
<radialGradient id="gLens" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>
<pattern id="pGY" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#2f9e44"/><rect width="5" height="10" fill="#f2c62e"/></pattern>
<linearGradient id="gSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".07" stop-color="#fff" stop-opacity="0"/><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
<linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="gHole" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050606"/><stop offset=".45" stop-color="#1b1e20"/><stop offset="1" stop-color="#34393c"/></linearGradient>
<linearGradient id="gLv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b7176"/><stop offset=".18" stop-color="#454a4f"/><stop offset="1" stop-color="#202326"/></linearGradient>
<linearGradient id="gLvX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
<linearGradient id="gWin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".4" stop-color="#000" stop-opacity="0"/></linearGradient>
<radialGradient id="gScr" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#cfd4d7"/><stop offset="1" stop-color="#7d8589"/></radialGradient>
<linearGradient id="gBkS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4e53"/><stop offset=".08" stop-color="#2c2f33"/><stop offset=".92" stop-color="#17191b"/><stop offset="1" stop-color="#0b0c0d"/></linearGradient>
<linearGradient id="gHd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2e31"/><stop offset=".25" stop-color="#5d6368"/><stop offset=".55" stop-color="#3e4347"/><stop offset="1" stop-color="#1f2225"/></linearGradient>
<filter id="sh" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#000" flood-opacity=".3"/></filter>
<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>`;
document.getElementById("defs").innerHTML=DEFS;

const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const T=(x,y,s,o={})=>`<text x="${x}" y="${y}" font-size="${o.fs||9}" font-family="${o.ff||MONO}" font-weight="${o.fw||600}" fill="${o.c||"#2a2e31"}" text-anchor="${o.a||"middle"}">${esc(s)}</text>`;
const R=(x,y,w,h,f,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx||0}" fill="${f}"${o.s?` stroke="${o.s}" stroke-width="${o.sw||1}"`:""}${o.op!=null?` opacity="${o.op}"`:""}${o.da?` stroke-dasharray="${o.da}"`:""}/>`;
const C=(cx,cy,r,f,o={})=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${o.s?` stroke="${o.s}" stroke-width="${o.sw||1}"`:""}${o.op!=null?` opacity="${o.op}"`:""}${o.flt?` filter="url(#${o.flt})"`:""}/>`;
/* ---- piezas comunes con relieve (2.5D): luz desde arriba a la izquierda ---- */
const screw=(cx,cy,r)=>C(cx,cy+.8,r,"#000",{op:.35})+C(cx,cy,r,"url(#gScr)",{s:"#5d6468",sw:.8})+C(cx,cy,r*.72,"none",{s:"#fff",sw:.6,op:.5})+
  `<path d="M${cx-r*.55} ${cy}h${r*1.1}M${cx} ${cy-r*.55}v${r*1.1}" stroke="#3d4246" stroke-width="1.7" stroke-linecap="round"/>`;
/* carcasa: cara principal, sombreado lateral y brillo del borde superior */
const body=(w,f="url(#gB)",s="#9a9e99")=>R(.5,.5,w-1,CH-1,f,{rx:4,s})+R(.5,.5,w-1,CH-1,"url(#gSide)",{rx:4})+R(2.5,1.5,w-5,3,"#fff",{rx:1.5,op:.7})+R(2,CH-4,w-4,2.5,"#000",{rx:1.2,op:.12});
/* bornes: hueco hundido con la grapa metálica y el tornillo adentro */
function terms(w,y,n){n=n||Math.max(1,Math.round(w/M));const sp=w/n;let s="";for(let i=0;i<n;i++){const cx=sp*i+sp/2;
  s+=R(cx-11.5,y-.5,23,23,"#fff",{rx:3.5,op:.45})+R(cx-11,y,22,22,"url(#gHole)",{rx:3})+R(cx-9,y+3,18,16,"url(#gNi)",{rx:1.5,op:.55})+screw(cx,y+11,7.2)}return s}
/* frente elevado: sombra que proyecta sobre los hombros, cara y bisel claro arriba */
const face=(w,f="url(#gF)",s="#c3c6c1")=>R(4,37.5,w-6,101,"#000",{rx:3,op:.16})+R(3,36,w-6,100,f,{rx:2.5,s})+R(3,36,w-6,100,"url(#gSide)",{rx:2.5,op:.8})+R(4.5,37,w-9,2,"#fff",{rx:1,op:.85});
const std=w=>body(w)+terms(w,8)+terms(w,142)+face(w);
const knob=(cx,cy,r,a)=>C(cx,cy+1.2,r,"#000",{op:.3})+C(cx,cy,r,"#2e3236",{s:"#111"})+C(cx,cy,r-1.2,"url(#gLens)",{op:.55})+`<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy-r+2}" stroke="#f2f2f2" stroke-width="1.8" stroke-linecap="round" transform="rotate(${a} ${cx} ${cy})"/>`;
/* palanca de interruptor DIN en su ranura: arriba = cerrado (I), abajo = abierto (O) */
function lever(x,w,on,top=44,h=52){const lh=22,ly=on?top+4:top+h-lh-4;
  return R(x-1.5,top,w+3,h,"url(#gHole)",{rx:3})+R(x-1.5,top+h-1.2,w+3,1.2,"#fff",{op:.35})+
   R(x+.5,ly+(on?3:-2),w-1,lh,"#000",{rx:2.5,op:.45})+R(x,ly,w,lh,"url(#gLv)",{rx:2.5,s:"#0e1011",sw:.6})+R(x,ly,w,lh,"url(#gLvX)",{rx:2.5})+
   R(x+1.5,on?ly+1:ly+lh-5,w-3,4,on?"#9aa1a6":"#2a2e31",{rx:1.2})+[7,10.5,14].map(k=>R(x+2.5,ly+k+(on?2:0),w-5,.9,"#000",{op:.45})).join("")}
/* ventana del indicador de estado (rojo = cerrado, verde = abierto) */
const flag=(x,y,w,h,on)=>R(x-1,y-1,w+2,h+2,"#2a2e31",{rx:1.5})+R(x,y,w,h,on?"#d23a2f":"#3a9d55",{rx:1})+R(x,y,w,h,"url(#gWin)",{rx:1})+R(x+1,y+1,w*.4,1,"#fff",{op:.5});
