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
const voltOf=(a,b)=>{if(a==null||b==null||a==="X"||b==="X"||a===b)return 0;if(a==="0"||b==="0")return 120;return S.lc.sys==="1F"?240:208};
const potTxt=(x,role)=>x==null?"sin conexión (al aire)":x==="X"?"dos fases juntas (cortocircuito)":x==="0"?(role==="T"?"tierra conectada (0 V)":role==="N"?"neutro (0 V)":"neutro o tierra (0 V)"):x[0]==="U"?"salida de un equipo con batería":`fase ${x}`;

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
    if(t.srcId!=null&&it.type==="panel"){const b=SRC.find(x=>x.id===t.srcId);if(b&&trips.has(b.id))out.add(`${b.short} está disparado (rearma)`);else if(b&&b.p.on===false)out.add(`${b.short} está apagado`)}
    else if(it.type==="inter"&&!it.p.on)out.add(`${devLabel(it)} está apagado`);
    else if(it.type==="inter3"&&/^T[12]$/.test(t.key)&&t.key!=="T"+(it.p.pos===2?2:1))out.add(`${devLabel(it)} está del otro lado (viajero ${t.key.slice(1)} sin corriente)`);
    else if(it.type==="feed"&&!SRC.find(x=>x.id===it.p.brk))out.add(`${devLabel(it)} no tiene circuito del tablero elegido`);
    else if(t.ctlOf!=null){const d=S.items.find(i=>i.id===t.ctlOf);if(!d||/^(A[12]|X[12])$/.test(t.pin))continue;const lab=d.p.des||CAT[d.type].n;
      if((d.type==="icont"||d.type==="cont"||d.type==="relay")&&!ctl.on.has(d.id))out.add(`${lab} está abierto (su bobina no tiene tensión)`);
      else if(d.type==="push"&&d.p.ct!=="NC"&&!ctl.pressed.has(d.id))out.add(`${lab} no está presionado`);
      else if(d.type==="emerg"&&d.p.on===false)out.add(`${lab} está enclavado`);
      else if(d.type==="ovl"&&trips.has("o"+d.id)&&/^9[56]$/.test(t.pin))out.add(`${lab} está disparado`);
      else if(d.type==="supv"&&!ctl.on.has(d.id))out.add(`${lab} tiene su contacto abierto`)}}
  for(const u of up)if(terms.has(u)&&!isPh(ctx.pot(u)))netBlockers(u,ctx,out,seen);
  return[...out]}
/* Explica por qué un aparato de dos bornes no tiene voltaje */
function whyOff(it,k0,k1,ctx){const d=DEV[it.type],[l0,l1]=d.terms.filter(t=>t[1]!=="T").map(t=>t[2]),a=ctx.pot(k0),b=ctx.pot(k1),two=d.V!==120;
  const tail=k=>{const bl=netBlockers(k,ctx);return bl.length?` Revisa: ${bl.join("; ")}.`:""};
  const wired=k=>S.wall.wires.some(w=>w.a===k||w.b===k);
  if(a==null&&b==null)return!wired(k0)&&!wired(k1)?"no tiene cables conectados":`ninguno de sus bornes llega a algo con corriente.${tail(k0)||tail(k1)}`;
  if(!isPh(a)&&!isPh(b))return`no le llega la fase al borne ${two?l0+" ni al "+l1:l0}.${tail(k0)||tail(k1)}`;
  if(a===b)return`sus dos bornes tienen la misma fase (${a}): no hay voltaje entre ellos. ${two?"El otro borne va a otra fase.":"El borne "+l1+" va al neutro."}`;
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
