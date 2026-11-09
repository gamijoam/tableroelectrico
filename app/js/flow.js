/* =====================================================================
   flow.js — Ver la energía durante la prueba.
   · Recorrido de la corriente: desde la fuente (breaker, acometida,
     llegada o batería) hasta cada aparato por la fase, y de regreso
     al neutro. Cada cable sabe cuánta corriente lleva y hacia dónde.
   · Lectura de cada terminal (fase, neutro, tierra o nada) para el
     multímetro, la ficha del aparato y el diagnóstico.
   · Por qué un aparato no funciona: qué le falta y qué lo corta.
   ===================================================================== */
let showFlow=true,meterA=null;
const isPh=x=>!!x&&x!=="0"&&x!=="X";
/* Tensión entre dos lecturas, igual que el simulador */
/* Cada fuente es un fasor: fases de la red (A, B, C), neutro (0) y las salidas del estabilizador
   bifásico (S<id>a = 110 V, S<id>b = 220 V, en fase entre sí y con neutro común).
   El voltaje entre dos puntos es la diferencia, redondeada al valor nominal más cercano. */
const NOMV=[120,208,240,360];
/* Voltaje fase-neutro de la calle durante la prueba (120 V normal; bajones y subidas lo cambian) */
const gridLN=()=>(typeof simState!=="undefined"&&simState.running&&simState.grid)||120;
function phasor(x){if(x==="0")return[0,0];const d=Math.PI/180,P=(m,g)=>[m*Math.cos(g*d),m*Math.sin(g*d)],g=gridLN();
  if(x==="A")return P(g,0);if(x==="B")return S.lc.sys==="1F"?P(g,iec()?0:180):P(g,-120);if(x==="C")return P(g,120);
  if(x[0]==="S")return P(x.endsWith("b")?240:120,0);if(x[0]==="R")return P(120,0);return null}
const voltOf=(a,b)=>{if(a==null||b==null||a==="X"||b==="X"||a===b)return 0;
  if(a[0]==="U"||b[0]==="U"){if(a==="0"||b==="0")return 120;return S.lc.sys==="1F"?240:208}
  const p=phasor(a),q=phasor(b);if(!p||!q)return a==="0"||b==="0"?120:S.lc.sys==="1F"?240:208;
  /* cerca de un valor nominal (±3%) se redondea a ese valor; si no, al voltio */
  const m=Math.hypot(p[0]-q[0],p[1]-q[1]);if(m<20)return 0;const n=NOMV.find(v=>Math.abs(v-m)/v<.03);return n||Math.round(m)};
const potName=x=>x[0]==="U"?"salida de un equipo con batería":x[0]==="R"?"salida del estabilizador":x[0]==="S"?`salida ${x.endsWith("b")?"220":"110"} V del estabilizador`:`fase ${x}`;
const potTxt=(x,role)=>x==null?"sin conexión (al aire)":x==="X"?"dos fases juntas (cortocircuito)":x==="0"?(role==="T"?"tierra conectada (0 V)":role==="N"?"neutro (0 V)":"neutro o tierra (0 V)"):potName(x);

/* Árboles de recorrido: de cada fuente hacia afuera, solo por terminales del mismo tipo */
function flowTree(adj,srcs,ok){const par=new Map(),q=[];for(const s of srcs)if(ok(s)&&!par.has(s)){par.set(s,null);q.push(s)}
  while(q.length){const a=q.shift();for(const e of adj.get(a)||[])if(!par.has(e.to)&&ok(e.to)){par.set(e.to,{from:a,wid:e.wid});q.push(e.to)}}return par}
/* Para cada punto que consume, sube por el árbol hasta la fuente marcando los cables que recorre */
function flowCompute(adj,phSrc,nSrc,pts,isPhase,isNeutral){const F=flowTree(adj,phSrc,isPhase),N=flowTree(adj,nSrc,isNeutral),w={};
  for(const {t,I} of pts){const tree=F.has(t)?F:N.has(t)?N:null;if(!tree)continue;const back=tree===N;let cur=t,g=0;
    while(g++<400){const p=tree.get(cur);if(!p)break;if(p.wid!=null){const o=w[p.wid]||(w[p.wid]={I:0,from:back?cur:p.from,n:back});o.I+=I}cur=p.from}}
  return w}

/* Qué corta el paso en la red de un terminal: breakers apagados o disparados, interruptores abiertos, contactos del mando */
function netBlockers(k,ctx,out=new Set(),seen=new Set()){const {terms,nets,SRC,trips,ctl}=ctx,root=nets.find(k);if(seen.has(root)||seen.size>6)return[...out];seen.add(root);
  /* si un interruptor abierto corta el paso, se sigue buscando del otro lado (puede haber un breaker apagado antes) */
  const up=[];
  for(const t of terms.values()){if(nets.find(t.id)!==root)continue;const it=t.item;
    if((it.type==="inter"&&!it.p.on)||it.type==="inter3")up.push(`${it.id}/COM`);
    if(t.srcId!=null&&it.type==="panel"){const b=SRC.find(x=>x.id===t.srcId);if(b&&trips.has(b.id))out.add(`${b.short} está disparado (rearma)`);else if(b&&b.p.on===false)out.add(`${b.short} está apagado`);
      /* breaker cerrado en el riel: se sigue buscando en su entrada (puede venir de un contactor abierto) */
      else up.push(`${it.id}/t${t.srcId}.${t.pole}`)}
    else if(it.type==="inter"&&!it.p.on)out.add(`${devLabel(it)} está apagado`);
    else if(it.type==="inter3"&&/^T[12]$/.test(t.key)&&t.key!=="T"+(it.p.pos===2?2:1))out.add(`${devLabel(it)} está del otro lado (viajero ${t.key.slice(1)} sin corriente)`);
    else if(it.type==="feed"&&!SRC.find(x=>x.id===it.p.brk))out.add(`${devLabel(it)} no tiene circuito del tablero elegido`);
    else if(it.type==="subt"&&/^Q\d+\.\d$/.test(t.key)){const [bi,j]=t.key.slice(1).split(".").map(Number),b=subtBrks(it.p).find(x=>x.i===bi);if(!b)continue;const lab=`el breaker de ${b.name||"Q"+b.i} (${devLabel(it)})`;
      if(trips.has(`s${it.id}.${b.i}`))out.add(`${lab} está disparado (tócalo para rearmarlo)`);else if(!b.on)out.add(`${lab} está apagado`);
      else{const bar=subtBar(b.slot+j),bk=`${it.id}/${bar}`;if(!S.wall.wires.some(w=>w.a===bk||w.b===bk)&&!(it.p.puente==="Sí"))out.add(`${lab} toma la barra ${bar}, que no tiene cable de entrada${bar==="L2"?" (con una sola línea de 110 V hace falta el puente L1-L2)":""}`);else up.push(bk)}}
    else if(t.ctlOf!=null){const d=S.items.find(i=>i.id===t.ctlOf);if(!d||/^(A[12]|X[12])$/.test(t.pin))continue;const lab=d.p.des||CAT[d.type].n;
      const outPin={icont:/^(T\d|14|22)$/,cont:/^[2468]$/,relay:/^(12|14|22|24)$/,timer:/^(16|18)$/}[d.type];if(outPin&&!outPin.test(t.pin))continue;
      if((d.type==="icont"||d.type==="cont"||d.type==="relay")&&!ctl.on.has(d.id)){const cw=coilWhy(d,ctx);out.add(`${lab} está abierto${cw?": "+cw:" (su bobina no tiene tensión)"}`)}
      else if(d.type==="push"&&d.p.ct!=="NC"&&!ctl.pressed.has(d.id))out.add(`${lab} no está presionado`);
      else if(d.type==="emerg"&&d.p.on===false)out.add(`${lab} está enclavado`);
      else if(d.type==="ovl"&&trips.has("o"+d.id)&&/^9[56]$/.test(t.pin))out.add(`${lab} está disparado`);
      else if(d.type==="supv"&&!ctl.on.has(d.id)&&![...out].some(x=>x.includes(lab+" ")))out.add(`${lab} tiene su contacto abierto`)}}
  for(const u of up)if(terms.has(u)&&!isPh(ctx.pot(u)))netBlockers(u,ctx,out,seen);
  return[...out]}
/* ---------- por qué la bobina de un contactor o relé no recibe tensión ---------- */
const ctlT=(ctx,d,pin)=>{for(const t of ctx.terms.values())if(t.ctlOf===d.id&&t.pin===pin)return t.id;return null};
const wiredT=k=>!!k&&S.wall.wires.some(w=>w.a===k||w.b===k);
/* terminales unidos a k solo por cables (sin pasar por contactos ni barras) */
function wireReach(k){const seen=new Set([k]),q=[k];while(q.length){const a=q.shift();for(const w of S.wall.wires){const o=w.a===a?w.b:w.b===a?w.a:null;if(o&&!seen.has(o)){seen.add(o);q.push(o)}}}return seen}
function coilWhy(d,ctx){ctx.cw=ctx.cw||new Set();if(ctx.cw.has(d.id))return"";ctx.cw.add(d.id);
  const lab=d.p.des||CAT[d.type].n,A1=ctlT(ctx,d,"A1"),A2=ctlT(ctx,d,"A2");if(!A1||!A2)return"";
  const r=d.type==="relay"&&/DC/.test(d.p.coil)?24:coilVolt(d.p.coil),other=r>=200?"la otra fase":"el neutro";
  if(!wiredT(A1)&&!wiredT(A2))return"su bobina A1-A2 no tiene cables";
  if(!wiredT(A1))return"falta el cable de A1 (la fase que manda la bobina)";
  if(!wiredT(A2))return`falta el cable de A2 (va a ${other})`;
  const pa=ctx.pot(A1),pb=ctx.pot(A2),v=voltOf(pa,pb);
  if(v&&v<r*.85)return`su bobina es de ${r} V y recibe ${v} V${r>=200?": A2 debe ir a la otra fase, no al neutro":""}`;
  if(v)return"";
  if(isPh(pa)&&pa===pb)return`A1 y A2 tienen la misma fase (${pa}); A2 va a ${other}`;
  const R1=wireReach(A1),R2=wireReach(A2),R=new Set([...R1,...R2]);
  /* A1 y A2 en el mismo contacto del supervisor: al cerrar, la bobina queda en corto consigo misma */
  for(const s of S.items.filter(i=>i.type==="supv")){const sl=s.p.des||"el supervisor",pin=Rx=>["11","12","14"].find(k=>Rx.has(ctlT(ctx,s,k)));const p1=pin(R1),p2=pin(R2);
    if(p1&&p2)return`A1 está en el borne ${p1} y A2 en el borne ${p2} de ${sl}: cuando el supervisor cierra, A1 y A2 quedan unidos y la bobina no ve voltaje. Deja A1 en el 14, lleva una fase al 11 (por ejemplo, la salida L1 del breaker de mando) y conecta A2 a ${other}`}
  if(ctx.nets.find(A1)===ctx.nets.find(A2))return`A1 y A2 quedan unidos entre sí, así que la bobina no ve voltaje. A1 recibe la fase que manda y A2 va a ${other}`;
  for(const s of S.items.filter(i=>i.type==="supv")){const sl=s.p.des||"el supervisor",t11=ctlT(ctx,s,"11"),t12=ctlT(ctx,s,"12"),t14=ctlT(ctx,s,"14");
    if(R.has(t12)&&!R.has(t14))return`la bobina está en el borne 12 de ${sl}, que cierra cuando HAY falla. Pásala al 14, que cierra cuando el voltaje está bien`;
    if(!R.has(t14)&&!R.has(t11))continue;
    const L=supvL(s.p),Lids=L.map(k=>ctlT(ctx,s,k));
    if(!ctx.ctl.on.has(s.id)){
      if(Lids.every(k=>!wiredT(k)))return`${sl} no tiene cables en ${L.join(" y ")}: sin medir voltaje no cierra su contacto 11-14`;
      const chk=supvCheck(s,k=>ctx.pot(ctlT(ctx,s,k)),voltOf);if(chk.on)return`${sl} está esperando su retardo de ${s.p.delay} antes de cerrar 11-14`;
      if(chk.why==="sin tensión"||chk.why==="falta una fase"){const bl=new Set();for(const k of Lids)if(k&&!isPh(ctx.pot(k))&&!(k===ctlT(ctx,s,"N")))netBlockers(k,ctx,bl,new Set());
        if([...bl].some(x=>x.startsWith(lab+" ")))return`${sl} se alimenta de la salida de ${lab}: con ${lab} abierto el supervisor no tiene tensión y nunca lo cierra. Conecta ${L.join(" y ")} del supervisor antes del contactor (en su entrada L1/L2 o desde un breaker de mando)`;
        const nw=L.filter((_,i)=>!wiredT(Lids[i]));
        if(nw.length)return`${sl} no tiene cable en ${nw.join(" y ")}: ${chk.why}, no cierra 11-14`;
        const miss=L.filter((k,i)=>k!=="N"&&!isPh(ctx.pot(Lids[i])));bl.forEach(x=>{if(x.startsWith(sl+" "))bl.delete(x)});
        return`${sl} no recibe fase en ${miss.join(" y ")}${bl.size?` (${[...bl].join("; ")})`:""}${miss.length<L.filter(k=>k!=="N").length?": con una sola fase no cierra 11-14 (así protege por falta de fase)":", así que no cierra 11-14"}`}
      return`${sl}: ${chk.why}. Por eso abre 11-14`}
    if(t11&&!isPh(ctx.pot(t11)))return wiredT(t11)?`el borne 11 (común) de ${sl} no tiene fase${(()=>{const b=netBlockers(t11,ctx);return b.length?" ("+b.join("; ")+")":""})()}`:`el borne 11 (común) de ${sl} no tiene cable: llévale la fase que manda la bobina`;
    if(R.has(t11)&&!R.has(t14))return`la bobina está en el borne 11 de ${sl}; el 11 es la entrada del contacto. Lleva la fase al 11 y la bobina (A1) al 14`}
  const k=!isPh(pa)?A1:A2,bl=netBlockers(k,ctx).filter(x=>!x.startsWith(lab+" "));
  return bl.length?bl.join("; "):k===A1?"A1 no llega a ninguna fase":`A2 no llega a ${other}`}

/* Terminales de un circuito: se siguen los cables y los interruptores cerrados, sin pasar por barras ni tableros */
function circuitTerms(k){const seen=new Set([k]),q=[k],it=id=>S.wall.items.find(i=>i.id===id);
  while(q.length){const a=q.shift(),nx=[];for(const w of S.wall.wires){if(w.a===a)nx.push(w.b);else if(w.b===a)nx.push(w.a)}
    const [iid,key]=a.split("/"),d=it(+iid);if(d){if(d.type==="inter"&&d.p.on&&(key==="COM"||key==="L"))nx.push(`${iid}/${key==="COM"?"L":"COM"}`);
      if(d.type==="inter3"){const tk="T"+(d.p.pos===2?2:1);if(key==="COM")nx.push(`${iid}/${tk}`);else if(key===tk)nx.push(`${iid}/COM`)}}
    for(const n of nx)if(!seen.has(n)){seen.add(n);q.push(n)}}return seen}
/* Explica por qué un aparato de dos bornes no tiene voltaje */
function whyOff(it,k0,k1,ctx){const d=DEV[it.type],[l0,l1]=d.terms.filter(t=>t[1]!=="T").map(t=>t[2]),a=ctx.pot(k0),b=ctx.pot(k1),two=dV(d)!==120;
  const tail=k=>{const bl=netBlockers(k,ctx);return bl.length?` Revisa: ${bl.join("; ")}.`:""};
  const wired=k=>S.wall.wires.some(w=>w.a===k||w.b===k);
  if(a==null&&b==null)return!wired(k0)&&!wired(k1)?"no tiene cables conectados":`ninguno de sus bornes llega a algo con corriente.${tail(k0)||tail(k1)}`;
  if(!isPh(a)&&!isPh(b))return`no le llega la fase al borne ${two?l0+" ni al "+l1:l0}.${tail(k0)||tail(k1)}`;
  if(a===b)return`sus dos bornes tienen la misma ${potName(a)}: no hay voltaje entre ellos. ${two?"El otro borne va a otra fase.":"El borne "+l1+" va al neutro."}`;
  const miss=isPh(a)?[k1,l1]:[k0,l0];
  if(!wired(miss[0]))return`le falta el cable del borne ${miss[1]} (${two?"la otra fase":"el neutro"}).`;
  return`el borne ${miss[1]} no llega ${two?"a otra fase":"al neutro"}.${tail(miss[0])}`}

/* ---------- dibujo del recorrido sobre cada cable ---------- */
function flowSvg(w,p,res,sw){const f=res.flow&&res.flow.w[w.id];
  if(f){const dur=Math.max(.22,Math.min(2.6,1.15/Math.sqrt(Math.max(f.I,.05)))).toFixed(2),c=f.n?"#8fdcff":"#ffe14d",rev=f.from===w.b;
    return`<path d="${p.d}" fill="none" stroke="${c}" stroke-width="${sw+5}" opacity=".28" stroke-linejoin="round"/><path class="fl${rev?" rev":""}" d="${p.d}" fill="none" stroke="${c}" stroke-width="${Math.max(2.4,sw-.6)}" stroke-dasharray="2.5 10" stroke-linecap="round" style="animation-duration:${dur}s"/>`}
  if(res.flow&&res.flow.live.has(w.id))return`<path d="${p.d}" fill="none" stroke="#ffe14d" stroke-width="${sw+5}" opacity=".22" stroke-linejoin="round"/>`;
  return""}

/* ---------- multímetro: dos toques sobre terminales ---------- */
function meterClick(id){const r=simState.res;if(!simState.running||!r){toast("Presiona ▶ Probar para medir con el multímetro.");return}
  const terms=allTerms();if(!meterA||meterA===id){meterA=id;renderWall();toast(`Punta roja en ${termName(terms.get(id))}. Toca otro terminal para la punta negra.`);return}
  const a=meterA,pa=r.tp[a],pb=r.tp[id],v=voltOf(pa,pb);meterA=null;renderWall();
  showAlert(v?"ok":"warn",`Multímetro: ${v} V`,`${termName(terms.get(a))}: ${potTxt(pa,terms.get(a).role)}. ${termName(terms.get(id))}: ${potTxt(pb,terms.get(id).role)}.${v?"":pa==null||pb==null?" Una punta está en un borne al aire: no hay circuito.":pa===pb?" Las dos puntas están en el mismo punto eléctrico.":""}`)}
