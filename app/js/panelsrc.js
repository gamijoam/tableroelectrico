/* =====================================================================
   panelsrc.js — "El tablero" visto desde la pared, sea una caja de
   breakers o un tablero de riel DIN. Da a la pared y al simulador lo
   mismo en los dos casos:
   · las protecciones que entregan fase (breakers, o termomagnéticos,
     diferenciales, seccionadores y guardamotores del riel),
   · los tornillos de salida de cada polo,
   · las barras de neutro y tierra (en el riel se agregan debajo, y las
     borneras blancas/azules o verdes también cuentan como neutro/tierra).
   ===================================================================== */
const DIN_SRC={mcb:p=>p.poles,rcd:p=>p.poles,sw:p=>p.poles,mpcb:()=>3};
const dinIn=it=>it.type==="mpcb"?Math.ceil(parseFloat(String(it.p.range).split("–")[1])||10):it.p.In;
const isDin=()=>S.kind==="din";
/* Con una acometida en la pared, la fase entra cableada: L1, L2, L3, N y T */
const supplyOf=(wl=S.wall)=>wl.items.find(i=>i.type==="supply");
const wiredMode=(wl=S.wall)=>!!supplyOf(wl);
const bornRole=c=>c==="Blanco"||c==="Azul"?"N":c==="Verde"||c==="Verde/amarillo"?"T":"F";

/* Protecciones que alimentan circuitos. En el riel, las fases se reparten en orden de polos (como un peine) */
function srcList(){
  if(!isDin())return S.lc.items.map(b=>{const cs=brkCalc(b).cs.join("-");return{id:b.id,p:b.p,poles:b.p.poles,In:b.p.In,gfci:b.p.type==="GFCI",ph:k=>phaseOf(b.slot+k),lab:"circuito "+cs,short:"C"+cs,name:b.p.name||"",ref:b}});
  const phs=PH();let n=0;
  return[...S.items].filter(it=>DIN_SRC[it.type]).sort((a,b)=>a.row-b.row||a.x-b.x).map(it=>{const poles=DIN_SRC[it.type](it.p),base=n,des=it.p.des||CAT[it.type].n;n+=poles;
    return{id:it.id,p:it.p,poles,In:dinIn(it),gfci:it.type==="rcd",ph:k=>phs[(base+k)%phs.length],lab:des,short:des,name:it.p.name||"",ref:it,din:true}})}
const srcById=id=>id==null?undefined:srcList().find(s=>s.id===id);
const srcWho=b=>b.din?`la protección ${b.lab} (${b.In} A)`:`el breaker del ${b.lab} (${b.In} A)`;
const srcOption=b=>`${b.short} · ${b.name||"Sin nombre"} (${b.poles}P ${b.In} A)`;

/* Geometría del tablero en la pared (coordenadas absolutas de la pared) */
function panelGeom(it,wl=S.wall){const [cx,cy]=toPx(it.x,it.y,wl);
  if(!isDin()){const s=PANEL_W/PW,w=PANEL_W,h=lcPH()*s,x0=cx-w/2,y0=cy-h/2;
    const srcs=S.lc.items.map(b=>{const bx=b.side==="L"?XL:XR;return{id:b.id,
      body:{x:x0+bx*s,y:y0+(LY0+b.slot*SL)*s,w:BW*s,h:b.p.poles*SL*s},
      handle:{x:x0+(b.side==="L"?XL+BW-76:XR+22)*s,y:y0+(LY0+b.slot*SL+7)*s,w:54*s,h:(b.p.poles*SL-14)*s},
      terms:[...Array(b.p.poles)].map((_,k)=>({k,x:x0+(b.side==="L"?XL+17:XR+BW-17)*s,y:y0+(LY0+(b.slot+k)*SL+SL/2)*s}))}});
    const N=[],G=[];for(let r=0;r<lcRows();r++){const y=y0+(LY0+r*SL+SL/2)*s;N.push({x:x0+(LPAD+17)*s,y});G.push({x:x0+(PW-LPAD-17)*s,y})}
    const nph=PH().length,M=[...Array(nph)].map((_,k)=>S.lc.main?{x:x0+(CX-92+k*184/(nph-1))*s,y:y0+93*s}:{x:x0+(CX-60+k*(nph===3?60:120))*s,y:y0+86*s});
    return{din:false,cx,cy,w,h,s,x0,y0,srcs,N,G,X:[],ctl:[],M,main:S.lc.main?{x:x0+(CX-104)*s,y:y0+52*s,w:208*s,h:94*s}:null}}
  /* el riel se dibuja más grande que la caja para que cada módulo se pueda tocar y cablear */
  const ctl=[],D=dims(),s=Math.max(Math.min(PANEL_W/D.W,(wl.h*WK*.86-46)/D.encH),Math.min(.72,760/D.W,(wl.h*WK*.86-46)/D.encH)),w=D.W*s,hb=D.encH*s,h=hb+46,x0=cx-w/2,y0=cy-h/2,srcs=[],X=[];
  for(const d of S.items){const u=units(d),dx=x0+(SIDE+d.x*U)*s,dy=y0+(TOP+d.row*ROW_H+COMP_Y)*s,dw=u*U*s;
    if(DIN_SRC[d.type]){const poles=DIN_SRC[d.type](d.p);
      srcs.push({id:d.id,body:{x:dx,y:dy,w:dw,h:CH*s},handle:{x:dx,y:dy+40*s,w:dw,h:62*s},terms:[...Array(poles)].map((_,k)=>({k,x:dx+(k+.5)*dw/poles,y:dy+153*s})),top:[...Array(poles)].map((_,k)=>({k,x:dx+(k+.5)*dw/poles,y:dy+19*s}))})}
    else if(d.type==="term")X.push({id:d.id,color:d.p.color,des:d.p.des||"",x:dx+dw/2,y:dy+139*s});
    else if(CTL_TYPES.has(d.type)){ctl.push({id:d.id,body:{x:dx,y:dy,w:dw,h:CH*s},pins:dinPins(d).map(q=>({k:q.k,role:q.role,x:dx+q.fx*dw,y:dy+q.y*s}))})}}
  const N=[],G=[],nb=7,bw=w/2-16;for(let k=0;k<nb;k++){N.push({x:x0+10+bw*(k+.5)/nb,y:y0+hb+25});G.push({x:x0+w/2+6+bw*(k+.5)/nb,y:y0+hb+25})}
  return{din:true,cx,cy,w,h,hb,s,x0,y0,srcs,N,G,X,M:[],main:null,D,ctl}}

/* Dibujo del tablero dentro del grupo del ítem (origen en el centro) */
function panelImg(g){
  if(!g.din)return`<svg x="${-g.w/2}" y="${-g.h/2}" width="${g.w}" height="${g.h}" viewBox="0 0 ${PW} ${lcPH()}">${lcPanelSvg({wall:true,trip:simState.trip})}</svg>`;
  const D=g.D,b=sel,keep=S.items,r=simState.running&&simState.res;sel=null;let inner;
  /* durante la prueba se dibuja lo que pasa: contactores cerrados, pilotos encendidos, térmico disparado */
  if(r)S.items=keep.map(it=>{const c=r.coil&&r.coil[it.id];if(c)return{...it,p:{...it.p,on:c.on}};if(it.type==="ovl")return{...it,p:{...it.p,on:!simState.trip.has("o"+it.id)}};return it});
  try{inner=dinSvg(true).replace(/ id="(items|pv)"/g,"")}finally{sel=b;S.items=keep}
  let s=`<svg x="${-g.w/2}" y="${-g.h/2}" width="${g.w}" height="${g.hb}" viewBox="${D.encX} 0 ${D.W} ${D.encH}">${inner}</svg>`;
  const yb=-g.h/2+g.hb+12,bw=g.w/2-16,L=p=>[p.x-g.cx,p.y-g.cy];
  s+=R(-g.w/2+6,yb,bw+8,26,"url(#gNi)",{rx:3,s:"#7d858a"})+R(6,yb,bw+8,26,"url(#gNi)",{rx:3,s:"#7d858a"});
  s+=R(-g.w/2-12,yb+4,16,16,"#ffffff",{rx:2,s:"#888"})+T(-g.w/2-4,yb+16,"N",{fs:9})+R(g.w/2+2,yb+4,16,16,"#2f9e44",{rx:2})+T(g.w/2+10,yb+16,"T",{fs:9,c:"#fff"});
  for(const p of [...g.N,...g.G]){const [x,y]=L(p);s+=screw(x,y,4.5)}
  /* bornes del mando con su número */
  for(const c of g.ctl)for(const q of c.pins){const [x,y]=L(q);s+=C(x,y,3.6,q.role==="F"?"#d9a441":q.role==="N"?"#dfe3e5":"#e9c46a",{s:"#4d4639",sw:.9})+`<text x="${x}" y="${y-5.5}" font-size="6.2" font-family="${MONO}" font-weight="700" fill="#1d2326" stroke="#fff" stroke-width="2.2" paint-order="stroke" text-anchor="middle">${esc(q.k)}</text>`}
  return s}
