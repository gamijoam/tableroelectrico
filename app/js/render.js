/* ---------- drawing: DIN board ---------- */
const $=id=>document.getElementById(id);
const board=$("board");
const EXT_H=322,EXT_GAP=36;
const extW=()=>S.ext.reduce((a,x)=>a+EXT[x.type].w(x.p),0)+Math.max(0,S.ext.length-1)*EXT_GAP;
function dims(){const eh=S.ext.length?EXT_H:0,ew=extW()+20;
  if(S.kind==="lc"){const n=lcRows(),ph=lcPH(),dh=58+S.lc.spaces*18,Wd=Math.max(PW+28+DIRW,ew),top=Math.max(ph,dh);return{lc:true,PH:ph,Wd,encX:0,encW:PW,encB:ph,extY:top,tbY:top+eh+18,H:top+eh+18+TB+8}}
  const W=SIDE*2+cap()*U,encH=TOP+S.board.rows*ROW_H+DUCT+28,Wd=Math.max(W,640,ew),encX=(Wd-W)/2;return{W,encH,Wd,encX,encW:W,encB:encH,extY:encH,tbY:encH+eh+18,H:encH+eh+18+TB+8}}
function extSvg(forExport){if(!S.ext.length)return"";const D=dims(),ew=extW(),yb=D.extY+66+210;let x=Math.max(10,Math.min(D.encX,D.Wd-ew-10)),cab="",its="";
  S.ext.forEach((it,i)=>{const {w,h,svg}=drawExt(it.type,it.p),c=EXT[it.type],cx=x+w/2,tx=Math.max(D.encX+40,Math.min(D.encX+D.encW-40,cx)),ym=D.extY+20+i*8;
   cab+=`<path d="M${cx} ${yb-h+4} V${ym} H${tx} V${D.encB-6}" fill="none" stroke="#2b2e31" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>`;
   const mc=Math.floor((w-8)/5.2);
   its+=`<g class="ex" data-id="${it.id}" transform="translate(${x} ${yb-h})"><g filter="url(#sh)">${svg}</g>`+
    `<g transform="translate(0 ${h+10})">${R(0,0,w,30,"#fffef6",{rx:2,s:"#b9b4a0",sw:.8})}${T(w/2,12,cutText(it.p.name||c.n,mc),{fs:8.5,fw:700})}${T(w/2,24,cutText(c.spec(it.p),mc),{fs:7,fw:400,c:"#555"})}</g>`+
    (it.id===sel&&!forExport?R(-6,-6,w+12,h+12,"none",{rx:7,s:"#1c74e0",sw:2.5}):"")+`</g>`;x+=w+EXT_GAP});
  return cab+its}
function duct(x,y,w){let s=R(x,y,w,DUCT,"#a1a59f",{rx:2,s:"#7d827c"})+R(x,y+9,w,DUCT-18,"#babdb6");for(let t=x+6;t<x+w-8;t+=14)s+=R(t,y+1.5,6,6,"#6f746e")+R(t,y+DUCT-7.5,6,6,"#6f746e");return s}
function rail(y){const x=SIDE-18,w=cap()*U+36;let s=R(x,y-36,w,72,"url(#gR)",{s:"#8a9196"})+R(x,y-27,w,1,"#8e959a")+R(x,y+26,w,1,"#8e959a");for(let t=x+22;t<x+w-30;t+=46)s+=R(t,y-5,26,10,"#596065",{rx:5});return s+screw(x+9,y,5)+screw(x+w-9,y,5)}
function tagSvg(w,p,type){const d=String(p.des||""),n=String(p.name||"");if(!d&&!n)return"";
  if(type==="term")return`<g transform="translate(0 ${CH+4})">${R(.5,0,w-1,16,"#fffef6",{rx:2,s:"#b9b4a0",sw:.8})}${T(w/2,11,n.slice(0,3),{fs:7})}</g>`;
  const mc=Math.max(2,Math.floor((w-6)/5.1));
  return`<g transform="translate(0 ${CH+4})">${R(1,0,w-2,27,"#fffef6",{rx:2,s:"#b9b4a0",sw:.8})}${T(w/2,10.5,cutText(d,mc),{fs:8.5,fw:700})}${T(w/2,21.5,cutText(n,mc),{fs:7,fw:400,c:"#555"})}</g>`}
function itemSvg(it,o={}){const {w,svg}=drawComp(it.type,it.p);const top=TOP+it.row*ROW_H+COMP_Y;
  return`<g class="it" data-id="${it.id}" transform="translate(${SIDE+it.x*U} ${top})"${o.op?` opacity="${o.op}"`:""}><g filter="url(#sh)">${svg}</g>${tagSvg(w,it.p,it.type)}${it.id===sel?`<rect x="-4" y="-4" width="${w+8}" height="${CH+8}" rx="6" fill="none" stroke="#1c74e0" stroke-width="2.5"/>`:""}</g>`}
function dinSvg(forExport){const {W,encH,Wd,encX,tbY}=dims(),st=S.board.style==="metal";let s=`<g transform="translate(${encX} 0)">`;
  s+=R(1,1,W-2,encH-2,st?"url(#gFM)":"url(#gFP)",{rx:16,s:st?"#727a7e":"#a9a9a0",sw:2})+R(11,11,W-22,encH-22,st?"url(#gPM)":"url(#gPP)",{rx:9,s:st?"#8e969a":"#c4c4bb"});
  for(const [cx,cy] of [[24,24],[W-24,24],[24,encH-24],[W-24,encH-24]])s+=C(cx,cy,5,"#6d7579")+C(cx,cy,2.2,"#3c4245");
  for(let r=0;r<S.board.rows;r++){const top=TOP+r*ROW_H;s+=duct(20,top,W-40)+rail(top+COMP_Y+CH/2);
   if(!forExport){s+=`<rect class="row-hit" data-row="${r}" x="${SIDE-8}" y="${top+DUCT+4}" width="${cap()*U+16}" height="${ROW_H-DUCT-8}" rx="6" fill="#000" fill-opacity="0"${r===activeRow?` stroke="#1c74e0" stroke-opacity=".55" stroke-dasharray="6 5" stroke-width="1.5"`:""}/>`;
    if(r===activeRow)for(let m=0;m<S.board.mods;m++)s+=T(SIDE+m*M+M/2,top+COMP_Y-5,m+1,{fs:7,fw:400,c:"#4b5357"});}
   s+=T(14,top+COMP_Y+CH/2+3,"F"+(r+1),{fs:8,c:st?"#e8ecee":"#7a7a72"});}
  s+=duct(20,TOP+S.board.rows*ROW_H,W-40);
  s+=`<g id="items">${S.items.map(it=>itemSvg(it,{op:drag&&drag.moving&&drag.id===it.id?.3:null})).join("")}</g><g id="pv"></g></g>`;
  return s+extSvg(forExport)+titleBlock(Wd,tbY,`${S.board.rows}×${S.board.mods} mód · ${(S.board.mods*17.5).toFixed(1).replace(".0","")} mm útil`)}

/* ---------- drawing: load center ---------- */
function brkSvg(p,mir,V){const n=p.poles,h=n*SL,X=x=>mir?BW-x:x,RX=(x,w)=>mir?BW-x-w:x;
  /* carcasa negra con bisel superior y sombra en el borde inferior */
  let b=R(0,3,BW,h-6,"url(#gBkS)",{rx:5,s:"#0c0d0e"})+R(2,4,BW-4,1.4,"#fff",{rx:.7,op:.22});
  for(let r=1;r<n;r++)b+=R(3,r*SL-1,BW-6,2,"#0d0e0f")+R(3,r*SL+1,BW-6,.8,"#fff",{op:.08});
  for(let r=0;r<n;r++){const cy=r*SL+SL/2;b+=R(5,cy-9,24,18,"url(#gHole)",{rx:2})+screw(17,cy,6.5)+R(BW-7,cy-8,9,16,"url(#gNi)",{rx:2,s:"#7d8589",sw:.5})}
  const spec=p.type!=="Estándar",lx0=spec?54:34;
  b+=R(lx0,9,102-lx0,h-18,"#26292c",{rx:3})+R(lx0,9,102-lx0,1.2,"#000",{op:.5})+R(lx0,h-10,102-lx0,1,"#fff",{op:.1});
  /* hueco de la palanca y palanca basculante con relieve; se inclina hacia el lado activo */
  b+=R(BW-74,9,50,h-18,"url(#gHole)",{rx:3});
  const hx=p.trip?BW-60:p.on?BW-48:BW-71;if(p.trip)b+=R(BW-74,9,50,h-18,"#e0302a",{rx:3,op:.5});
  b+=R(hx+(p.on?-3:3),12,23,h-22,"#000",{rx:3,op:.45})+R(hx,11,23,h-22,"url(#gHd)",{rx:3,s:p.trip?"#ff6b5e":"#0e1011",sw:.8})+R(hx+2.5,13,3,h-26,"#fff",{rx:1,op:.22})+R(hx+17,13,2,h-26,"#000",{rx:1,op:.3});
  let s=mir?`<g transform="matrix(-1 0 0 1 ${BW} 0)">${b}</g>`:b;
  if(spec)s+=R(RX(33,17),h/2-7,17,16,"#000",{rx:3,op:.3})+R(RX(33,17),h/2-8,17,16,p.type==="GFCI"?"#f2f2ee":"#f2c62e",{rx:3,s:"#777"})+R(RX(33,17),h/2-8,17,16,"url(#gLens)",{rx:3,op:.5})+T(X(41.5),h/2+3,"T",{fs:7,c:"#222"});
  const lc=(lx0+102)/2,mc=spec?9:12;
  s+=T(X(lc),h/2-1,cutText(p.name||"—",mc),{fs:6.5,c:"#e4e7e9",fw:500,ff:SANS})+T(X(lc),h/2+8,spec?p.type+" · "+V+"V":n+"P · "+V+"V",{fs:5.5,c:"#9aa1a6",fw:400});
  return s+T(X(hx+11.5),h/2+3.5,p.In,{fs:p.In>=100?8:9.5,c:"#fff",fw:700})}
function lcItemSvg(b,c,o={}){const x=b.side==="L"?XL:XR,y=LY0+b.slot*SL,h=b.p.poles*SL;
  let s=`<g class="it" data-id="${b.id}" transform="translate(${x} ${y})"${o.op?` opacity="${o.op}"`:""}><g filter="url(#sh)">${brkSvg(b.p,b.side==="R",c.V)}</g>`;
  if(!o.exp&&c.st!=="ok")s+=R(-3,0,BW+6,h,"none",{rx:6,s:c.st==="crit"?"#e0302a":"#f08a2b",sw:2.5,da:"5 3"});
  if(b.id===sel&&!o.exp)s+=R(-5,-2,BW+10,h+4,"none",{rx:7,s:"#1c74e0",sw:2.5});
  return s+"</g>"}
/* Panel body only (enclosure, main, bus, bars, breakers). Reused by the wall view.
   o.exp: clean export look · o.trip: Set of tripped breaker ids · o.wall: hide editor-only outlines */
/* Riel auxiliar opcional al pie de la caja (supervisor, protector, DPS, contactores…) */
const AUX_CAP=28,AUX_X0=(PW-AUX_CAP*U)/2,AUXH=250;
const auxShown=()=>S.lc.aux.length>0||(typeof drag!=="undefined"&&!!drag&&!!drag.aux&&drag.moving);
const auxY=()=>LY0+lcRows()*SL+30;
const lcPH=()=>LY0+lcRows()*SL+(auxShown()?30+AUXH:46);
function auxSvg(o={}){if(!auxShown())return"";const y0=auxY(),yr=y0+40+CH/2;
  let s=R(30,y0-8,PW-60,1.5,"#8e969a")+T(CX,y0+12,"RIEL AUXILIAR · PROTECCIÓN Y CONTROL",{fs:7.5,ff:SANS,fw:700,c:"#3a4044"})+R(AUX_X0-14,yr-36,AUX_CAP*U+28,72,"url(#gR)",{s:"#8a9196"});
  for(let t=AUX_X0;t<AUX_X0+AUX_CAP*U-20;t+=46)s+=R(t,yr-5,26,10,"#596065",{rx:5});
  if(!S.lc.aux.length&&!o.wall)s+=T(CX,yr+4,"Suelta aquí el componente",{fs:10,ff:SANS,c:"#3a4044"});
  for(const it of S.lc.aux){const {w,svg}=drawComp(it.type,it.p),mv=typeof drag!=="undefined"&&drag&&drag.moving&&drag.aux&&drag.id===it.id;
    s+=`<g class="ax" data-id="${it.id}" transform="translate(${AUX_X0+it.x*U} ${y0+40})"${mv?` opacity=".3"`:""}><g filter="url(#sh)">${svg}</g>${tagSvg(w,it.p,it.type)}${it.id===sel&&!o.exp&&!o.wall?`<rect x="-4" y="-4" width="${w+8}" height="${CH+8}" rx="6" fill="none" stroke="#1c74e0" stroke-width="2.5"/>`:""}</g>`}
  return s}
/* Espacios libres de la caja: un clic suma un breaker */
function slotsSvg(){let s="";for(let r=0;r<lcRows();r++)for(const side of ["L","R"]){if(S.lc.items.some(b=>b.side===side&&r>=b.slot&&r<b.slot+b.p.poles))continue;
  const x=side==="L"?XL:XR,y=LY0+r*SL;s+=`<g class="slot" data-side="${side}" data-slot="${r}"><rect x="${x+2}" y="${y+5}" width="${BW-4}" height="${SL-10}" rx="5" fill="#ffffff" fill-opacity=".35" stroke="#5f666b" stroke-width="1.2" stroke-dasharray="5 4"/>${T(x+BW/2,y+SL/2+4,"+ breaker",{fs:9,ff:SANS,fw:600,c:"#3a4044"})}<title>Espacio ${circ(side,r)} libre: clic para poner un breaker de 20 A</title></g>`}
  return s}
function lcPanelSvg(o={}){const L=S.lc,n=lcRows(),ph=lcPH(),calc=lcCalc(),phs=PH();
  let s=R(1,1,PW-2,ph-2,"url(#gFM)",{rx:10,s:"#6f777b",sw:2})+R(12,12,PW-24,ph-24,"url(#gPM)",{rx:6,s:"#8e969a"});
  for(const [cx,cy] of [[26,26],[PW-26,26],[26,ph-26],[PW-26,ph-26]])s+=C(cx,cy,6,"#6d7579")+C(cx,cy,2.6,"#3c4245");
  s+=R(CX-178,18,356,22,"#fbfbf6",{rx:3,s:"#9a9a92"})+T(CX,33,`CENTRO DE CARGA · ${L.spaces} ESPACIOS · ${sysLabel()} · 60 Hz`,{fs:7.6,ff:SANS,fw:600});
  const busTop=150,busBot=LY0+n*SL-6,bw=phs.length===3?14:16,bx=phs.map((_,k)=>phs.length===3?CX-29+k*22:CX-22+k*28);
  /* main breaker or lugs */
  if(L.main){const on=L.mainOn!==false;s+=`<g class="main">`+R(CX-104,52,208,94,"url(#gBk)",{rx:6,s:"#0c0d0e"})+R(CX-74,64,148,62,"#111213",{rx:4});
   s+=R(CX-70,on?66:102,140,22,"#454a4f",{rx:3,s:"#5f656a"})+T(CX,(on?66:102)+15,L.main+" A",{fs:11,c:"#fff",fw:700})+T(CX+90,72,"ON",{fs:6,c:"#cfd3d6"})+T(CX+90,124,"OFF",{fs:6,c:"#cfd3d6"});
   s+=T(CX,139,"PRINCIPAL "+phs.length+"P",{fs:6.5,c:"#c9cdd0",fw:400})+R(CX-100,78,16,30,"#0f1011",{rx:2})+screw(CX-92,93,6)+R(CX+84,78,16,30,"#0f1011",{rx:2})+screw(CX+92,93,6)+`</g>`}
  else{s+=R(CX-96,62,192,62,"#c9cdcf",{rx:4,s:"#7d858a"});phs.forEach((k,i)=>{const x=CX-60+i*(phs.length===3?60:120);s+=R(x-16,74,32,30,"url(#gCuH)",{rx:3,s:"#8a5426"})+screw(x,86,7)+T(x,117,"L"+(i+1),{fs:7})});s+=T(CX,138,"ZAPATAS PRINCIPALES",{fs:6.5,fw:400})}
  for(let i=0;i<phs.length;i++)s+=R(bx[i],busTop-6,bw,8,"url(#gCuH)",{s:"#8a5426",sw:.6});
  /* bus tabs then bars */
  for(let r=0;r<n;r++){const cy=LY0+r*SL+SL/2;s+=R(CX-GAP/2+1,cy-6,GAP-2,12,"url(#gCuH)",{rx:2,s:"#8a5426",sw:.8})}
  phs.forEach((k,i)=>{s+=R(bx[i],busTop,bw,busBot-busTop,"url(#gCu)",{s:"#8a5426",sw:.8})+T(bx[i]+bw/2,busTop-10,k,{fs:8,c:"#2a2e31"})});
  for(let r=0;r<n;r++){const cy=LY0+r*SL+SL/2,k=phs.indexOf(phaseOf(r));s+=C(bx[k]+bw/2,cy,4.5,"#8a5426")+C(bx[k]+bw/2,cy,2,"#f3c08f")}
  /* neutral & ground bars */
  const nx=LPAD+8,gx=PW-LPAD-8-18;s+=R(nx,LY0-10,18,n*SL+12,"url(#gNi)",{rx:2,s:"#7d858a"})+R(gx,LY0-10,18,n*SL+12,"url(#gNi)",{rx:2,s:"#7d858a"});
  for(let r=0;r<n;r++){const cy=LY0+r*SL+SL/2;s+=screw(nx+9,cy,5.5)+screw(gx+9,cy,5.5)}
  s+=R(nx-2,LY0-30,22,16,"#ffffff",{rx:2,s:"#888"})+T(nx+9,LY0-18,"N",{fs:9})+R(gx-2,LY0-30,22,16,"#2f9e44",{rx:2})+T(gx+9,LY0-18,"T",{fs:9,c:"#fff"});
  /* circuit numbers */
  for(let r=0;r<n;r++){const cy=LY0+r*SL+SL/2+3.5;s+=T(XL-NUMW/2,cy,circ("L",r),{fs:10,c:"#1d2326"})+T(XR+BW+NUMW/2,cy,circ("R",r),{fs:10,c:"#1d2326"})}
  if(!o.wall&&!o.exp)s+=slotsSvg();s+=auxSvg(o);
  if(o.wall)return s+L.items.map(b=>lcItemSvg(Object.assign({},b,{p:Object.assign({},b.p,{trip:o.trip&&o.trip.has(b.id)})}),calc.per[b.id],{exp:true})).join("");
  return s+`<g id="items">${L.items.map(b=>lcItemSvg(b,calc.per[b.id],{exp:o.exp,op:drag&&drag.moving&&drag.id===b.id?.3:null})).join("")}</g><g id="pv"></g>`}
function lcSvg(forExport){const L=S.lc,{tbY,Wd}=dims(),calc=lcCalc();
  let s=lcPanelSvg({exp:forExport});
  /* directory card */
  const DX=PW+28;s+=R(DX,1,DIRW,58+L.spaces*18-2,"#ffffff",{rx:6,s:"#2a2e31",sw:1.2})+T(DX+14,24,"DIRECTORIO DE CIRCUITOS",{fs:11,a:"start",ff:SANS,fw:700,c:"#1d2326"});
  const cols=[["N°",DX+30,"end"],["Circuito",DX+40,"start"],["Breaker",DX+226,"start"],["Carga",DX+340,"end"],["Cable",DX+352,"start"]];
  cols.forEach(([t,x,a])=>s+=T(x,46,t,{fs:7,a,ff:SANS,fw:600,c:"#5b6266"}));s+=R(DX+8,51,DIRW-16,1,"#2a2e31");
  for(let c=1;c<=L.spaces;c++){const y=51+c*18-5,side=c%2?"L":"R",slot=Math.floor((c-1)/2),b=L.items.find(x=>x.side===side&&slot>=x.slot&&slot<x.slot+x.p.poles);
   if(c%2===0)s+=R(DX+8,y-12,DIRW-16,18,"#f2f4f3");
   s+=T(DX+30,y,c,{fs:8,a:"end",c:"#1d2326"});
   if(!b){s+=T(DX+40,y,"Reserva",{fs:8,a:"start",ff:SANS,fw:400,c:"#9aa0a4"});continue}
   if(b.slot!==slot){s+=T(DX+40,y,"↳ "+cutText(b.p.name,30),{fs:8,a:"start",ff:SANS,fw:400,c:"#8a9195"});continue}
   const k=calc.per[b.id];s+=T(DX+40,y,cutText(b.p.name||"Sin nombre",32),{fs:8,a:"start",ff:SANS,fw:500,c:"#1d2326"})+T(DX+226,y,`${b.p.poles}P ${b.p.In}A${b.p.type!=="Estándar"?" "+b.p.type:""}`,{fs:7.5,a:"start",c:"#1d2326"})+T(DX+340,y,k.W?k.W+" W":"—",{fs:7.5,a:"end",c:"#1d2326",fw:400})+T(DX+352,y,"#"+AWG[b.p.In],{fs:7.5,a:"start",c:"#1d2326",fw:400});
   if(k.st!=="ok")s+=C(DX+DIRW-14,y-3,4,k.st==="crit"?"#e0302a":"#f08a2b")}
  return s+extSvg(forExport)+titleBlock(Wd,tbY,`${L.spaces} esp. · ${L.main?"ppal. "+L.main+" A":"zapatas"}`)}
function titleBlock(Wd,y,gab){const P=S.project,w=Wd-2,c=[["PROYECTO",P.name,.34],["CLIENTE / OBRA",P.client||"—",.24],["DIBUJÓ",P.author||"—",.14],["FECHA",P.date||"—",.1],["TABLERO",gab,.18]];
  let s=R(1,y,w,TB,"#ffffff",{s:"#2a2e31",sw:1.5}),x=1;
  c.forEach(([k,v,f],i)=>{const cw=w*f;if(i)s+=R(x,y,1,TB,"#2a2e31");const mc=Math.floor((cw-16)/7.4);s+=T(x+8,y+18,k,{fs:8,a:"start",fw:400,c:"#5b6266",ff:SANS})+T(x+8,y+44,cutText(v,mc),{fs:13,a:"start",fw:600,c:"#1d2326",ff:SANS});x+=cw});
  const sc=S.kind==="lc"?"Esquemático, sin escala · 60 Hz":"Escala aprox. 1:2 · 1 módulo = 17,5 mm";
  return s+T(9,y+TB-10,sc,{fs:7.5,a:"start",fw:400,c:"#5b6266",ff:SANS})+T(w-8,y+TB-10,"Hoja 1/1",{fs:7.5,a:"end",fw:400,c:"#5b6266",ff:SANS})}
function sceneSvg(forExport){return S.kind==="lc"?lcSvg(forExport):dinSvg(forExport)}
function renderBoard(){const wall=S.view==="wall";board.toggleAttribute("hidden",wall);wallEl.toggleAttribute("hidden",!wall);if(typeof posSelBar==="function")requestAnimationFrame(()=>{if(drag&&drag.moving||wdrag&&wdrag.moved)$("selbar").hidden=true;else posSelBar()});if(wall){renderWall();return}const {Wd,H}=dims();board.setAttribute("viewBox",`0 0 ${Wd} ${H}`);board.setAttribute("width",Math.round(Wd*zoom));board.setAttribute("height",Math.round(H*zoom));board.innerHTML=sceneSvg(false);$("zval").textContent=Math.round(zoom*100)+"%"}
function fit(){const st=$("stage"),wall=S.view==="wall",{Wd,H}=wall?wallDims():dims();zoom=Math.max(.2,Math.min(1.3,(st.clientWidth-48)/Wd));
  /* teléfono vertical: la pared se ajusta a la altura y se recorre de lado con el dedo */
  if(wall&&typeof isMobile==="function"&&isMobile()&&st.clientHeight>st.clientWidth)zoom=Math.max(zoom,Math.min(1,(st.clientHeight-24)/H));
  /* computadora y tablet horizontal: la pared completa entra en pantalla, de arriba a abajo */
  else if(wall)zoom=Math.max(.2,Math.min(zoom,(st.clientHeight-20)/H));renderBoard()}
