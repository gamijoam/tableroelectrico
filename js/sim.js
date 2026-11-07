/* =====================================================================
   sim.js — Simulador eléctrico simplificado para la vista Pared.
   Modelo: cada cable une dos terminales; los grupos de terminales unidos
   forman "redes". Una red puede tener fase (A/B/C, desde un breaker
   cerrado), neutro (barra N) o tierra (barra T). Con eso se detectan
   cortocircuitos, se calcula el voltaje de cada aparato y la corriente
   de cada polo de breaker. No es un solver de circuitos: es una
   herramienta de enseñanza con las reglas que importan en obra.
   ===================================================================== */

/* Union-find para agrupar terminales conectados */
class Nets{
  constructor(){this.p=new Map()}
  add(a){if(!this.p.has(a))this.p.set(a,a)}
  find(a){let r=a;while(this.p.get(r)!==r){const n=this.p.get(r);if(n===undefined)return a;r=n}let x=a;while(this.p.get(x)!==r){const n=this.p.get(x);this.p.set(x,r);x=n}return r}
  union(a,b){if(!this.p.has(a)||!this.p.has(b))return;const ra=this.find(a),rb=this.find(b);if(ra!==rb)this.p.set(ra,rb)}
}

const AMPACITY={"14":15,"12":20,"10":30,"8":40,"6":55};
const AWG_FOR=I=>Object.keys(AMPACITY).find(k=>AMPACITY[k]>=I)||"6";
const devLabel=it=>it.p.name||DEV[it.type].short;
const circLabel=b=>brkCalc(b).cs.join("-");

function simulate(prevTrip,burnt){
  const res={status:[],log:[],sparks:[],loads:{},hot:new Set(),trips:new Set(prevTrip),newBurnt:[],pending:[],pcur:{},wireMsg:{}};
  const P=S.wall.items.find(i=>i.type==="panel");
  const terms=new Map();for(const it of S.wall.items)for(const t of itemTerms(it))terms.set(t.id,Object.assign(t,{item:it}));
  const nets=new Nets();for(const id of terms.keys())nets.add(id);
  const wires=S.wall.wires.filter(w=>terms.has(w.a)&&terms.has(w.b));
  wires.forEach(w=>nets.union(w.a,w.b));
  for(const it of S.wall.items){if(it.type==="inter"&&it.p.on)nets.union(`${it.id}/COM`,`${it.id}/L`);if(it.type==="inter3")nets.union(`${it.id}/COM`,`${it.id}/T${it.p.pos===2?2:1}`)}
  const feeds=S.wall.items.filter(i=>i.type==="feed");
  if(P)for(let r=1;r<lcRows();r++){nets.union(`${P.id}/N0`,`${P.id}/N${r}`);nets.union(`${P.id}/G0`,`${P.id}/G${r}`)}
  const mainOn=!S.lc.main||S.lc.mainOn!==false;
  if(!P&&!feeds.length)res.status.push({lvl:"warn",msg:"Esta pared no tiene de dónde sacar corriente: agrega el tablero o una llegada de circuito."});
  else if(!mainOn)res.status.push({lvl:"warn",msg:"El breaker principal está apagado: no hay tensión en ningún circuito."});

  let info;
  const build=()=>{info=new Map();const get=r=>{if(!info.has(r))info.set(r,{ph:new Set(),N:false,G:false,feed:[]});return info.get(r)};
    if(P){for(const b of S.lc.items)for(let k=0;k<b.p.poles;k++){const id=`${P.id}/b${b.id}.${k}`;if(!terms.has(id))continue;const ni=get(nets.find(id));
        if(mainOn&&b.p.on&&!res.trips.has(b.id)){ni.ph.add(phaseOf(b.slot+k));ni.feed.push({b,k})}}
      get(nets.find(`${P.id}/N0`)).N=true;get(nets.find(`${P.id}/G0`)).G=true}
    for(const f of feeds){const b=S.lc.items.find(x=>x.id===f.p.brk);get(nets.find(`${f.id}/N`)).N=true;get(nets.find(`${f.id}/T`)).G=true;if(!b)continue;
      for(let k=0;k<Math.min(2,b.p.poles);k++){const ni=get(nets.find(`${f.id}/F${k+1}`));if(mainOn&&b.p.on&&!res.trips.has(b.id)){ni.ph.add(phaseOf(b.slot+k));ni.feed.push({b,k})}}}};
  const netOf=id=>info.get(nets.find(id));
  const pot=id=>{const i=netOf(id);if(!i)return null;if(i.ph.size===1)return[...i.ph][0];if(i.ph.size>1)return"X";if(i.N||i.G)return"0";return null};
  const wireIn=root=>wires.find(w=>nets.find(w.a)===root);
  const volt=(a,b)=>{if(a==null||b==null||a==="X"||b==="X"||a===b)return 0;if(a==="0"||b==="0")return 120;return S.lc.sys==="1F"?240:208};

  for(let pass=0;pass<6;pass++){
    /* 1) cortocircuitos: una red con dos fases, o fase + neutro/tierra */
    for(let guard=0;guard<20;guard++){build();let fault=null;
      for(const [root,i] of info)if(i.ph.size>=2||(i.ph.size&&(i.N||i.G))){fault={root,i};break}
      if(!fault)break;
      const fb=[...new Set(fault.i.feed.map(f=>f.b))];fb.forEach(b=>res.trips.add(b.id));
      const what=fault.i.ph.size>=2?` entre las fases ${[...fault.i.ph].join(" y ")}`:`: la fase ${[...fault.i.ph][0]} quedó unida con ${fault.i.N?"el neutro":"la tierra"}`;
      res.log.push({lvl:"crit",msg:`Cortocircuito${what}. Disparó ${fb.map(b=>`el breaker del circuito ${circLabel(b)} (${b.p.In} A)`).join(" y ")}.`});
      const w=wireIn(fault.root);if(w){const p=wirePath(w,S.wall.wires.indexOf(w),terms);res.sparks.push(p.mid)}
      else{const t=[...terms.values()].find(t=>nets.find(t.id)===fault.root);if(t)res.sparks.push({x:t.x,y:t.y})}}

    /* 2) aparatos: voltaje, estado y corriente por polo */
    res.loads={};res.pcur={};let gfci=false;
    for(const it of S.wall.items){const d=DEV[it.type];if(!d||!d.V)continue;
      const [k0,k1]=d.terms.filter(t=>t[1]!=="T").map(t=>`${it.id}/${t[0]}`);
      const a=pot(k0),b=pot(k1),v=volt(a,b),W=d.W(it.p)||0;let st;
      if(burnt.has(it.id))st={s:"burnt",v};
      else if(v===0)st={s:"off",v,why:a==null||b==null?"circuito abierto":"sin tensión"};
      else if(d.V===120&&v>=208){st={s:"burnt",v};if(!res.newBurnt.includes(it.id)){res.newBurnt.push(it.id);res.log.push({lvl:"crit",msg:`${devLabel(it)} recibió ${v} V en vez de 120 V y se quemó.`})}}
      else if(d.V===240&&v===120)st={s:"weak",v};
      else st={s:W>0?"on":"idle",v};
      st.I=st.s==="on"?W/(d.V===120?120:v):st.s==="weak"?W/4/120:0;res.loads[it.id]=st;
      if(st.I)for(const k of [k0,k1]){const i=netOf(k);if(i&&i.ph.size===1&&i.feed.length){const f=i.feed[0],key=f.b.id+"."+f.k;res.pcur[key]=(res.pcur[key]||0)+st.I}}
      /* GFCI: si el neutro del aparato regresa por la tierra, el GFCI dispara */
      if(st.I&&d.V===120){const nN=netOf(k1),nF=netOf(k0);if(nN&&nN.G&&!nN.N&&nF&&nF.feed.length){const g=nF.feed.find(f=>f.b.p.type==="GFCI");
        if(g&&!res.trips.has(g.b.id)){res.trips.add(g.b.id);gfci=true;res.log.push({lvl:"crit",msg:`El GFCI del circuito ${circLabel(g.b)} detectó corriente regresando por la tierra (${devLabel(it)}) y disparó.`})}}}}
    if(!gfci)break}

  /* 3) sobrecarga por polo */
  const seen=new Set();
  for(const [key,I] of Object.entries(res.pcur)){const id=+key.split(".")[0],b=S.lc.items.find(x=>x.id===id);if(!b)continue;
    if(I>b.p.In&&!seen.has(id)){seen.add(id);res.pending.push({b,I});res.status.push({lvl:"crit",msg:`Sobrecarga en el circuito ${circLabel(b)}: ${fmtA(I)} con breaker de ${b.p.In} A. Va a disparar en segundos.`})}
    else if(I>b.p.In*.8&&!seen.has(id)){seen.add(id);res.status.push({lvl:"warn",msg:`Circuito ${circLabel(b)} al ${Math.round(I/b.p.In*100)}% de su breaker (${fmtA(I)} de ${b.p.In} A).`})}}

  /* 4) cables: colores según norma y calibre vs. breaker */
  wires.forEach(w=>{const ra=terms.get(w.a).role,rb=terms.get(w.b).role,roles=[ra,rb],c=w.color,msgs=[];
    if(roles.includes("N")&&c!=="Blanco")msgs.push("el neutro va en blanco");
    else if(roles.includes("T")&&c!=="Verde")msgs.push("la tierra va en verde");
    else if((roles.includes("F")||roles.includes("S"))&&(c==="Blanco"||c==="Verde"))msgs.push("una fase no puede ir en blanco ni en verde");
    const i=netOf(w.a);
    if(i&&i.feed.length){const In=Math.max(...i.feed.map(f=>f.b.p.In)),amp=AMPACITY[w.awg];
      if(amp<In)msgs.push(`calibre #${w.awg} aguanta ${amp} A y está protegido con ${In} A: usa #${AWG_FOR(In)}`);
      const I=Math.max(0,...i.feed.map(f=>res.pcur[f.b.id+"."+f.k]||0));if(I>amp)res.hot.add(w.id)}
    if(msgs.length){res.wireMsg[w.id]=msgs;res.status.push({lvl:"warn",msg:`Cable ${c.toLowerCase()} #${w.awg} (${wireEnds(w,terms)}): ${msgs.join("; ")}.`,wire:w.id})}});

  /* 5) reglas por dispositivo */
  for(const it of S.wall.items){const d=DEV[it.type];if(!d||it.type==="panel"||it.type==="feed")continue;const L=devLabel(it);
    if(it.type==="inter"||it.type==="inter3"){if(d.terms.some(t=>pot(`${it.id}/${t[0]}`)==="0"))res.status.push({lvl:"warn",msg:`${L}: está cortando el neutro. El interruptor siempre debe cortar la fase.`})}
    if(it.type==="toma"&&pot(`${it.id}/F`)==="0"&&/[ABC]/.test(pot(`${it.id}/N`)||""))res.status.push({lvl:"warn",msg:`${L}: polaridad invertida. La fase va al tornillo dorado (F) y el neutro al plateado (N).`});
    if(d.terms.some(t=>t[1]==="T")){const g=netOf(`${it.id}/T`);if(!(g&&g.G))res.status.push({lvl:"warn",msg:`${L}: sin conexión a tierra.`})}
    const nTerm=d.terms.find(t=>t[1]==="N");if(nTerm){const n=netOf(`${it.id}/${nTerm[0]}`);if(n&&n.G&&!n.N)res.status.push({lvl:"warn",msg:`${L}: el neutro está conectado a la barra de tierra, no a la de neutro.`})}
    const st=res.loads[it.id];if(!st)continue;
    if(st.s==="on")res.status.push({lvl:"ok",msg:`${L}: funcionando a ${st.v} V (${fmtA(st.I)}).`});
    else if(st.s==="idle")res.status.push({lvl:"ok",msg:`${L}: tiene ${st.v} V, sin aparato conectado.`});
    else if(st.s==="weak")res.status.push({lvl:"warn",msg:`${L}: recibe solo 120 V y necesita ${S.lc.sys==="1F"?240:208} V. Conéctalo a dos fases.`});
    else if(st.s==="off")res.status.push({lvl:"off",msg:`${L}: apagado (${st.why}).`})}
  const order={crit:0,warn:1,ok:2,off:3};res.status.sort((a,b)=>order[a.lvl]-order[b.lvl]);
  return res}
