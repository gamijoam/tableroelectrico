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
const circLabel=b=>b.lab||("circuito "+brkCalc(b).cs.join("-"));

/* El mando se resuelve por pasos: con el estado de las bobinas se calculan las redes, se mira qué
   bobinas quedan con tensión y se repite hasta que nada cambie. Los disparos y lo quemado se acumulan. */
function simulate(prevTrip,burnt){
  let ctl={on:new Set(simState.ctl||[]),pressed:simState.pressed},res;const trips=new Set(prevTrip),bset=new Set(burnt),logs=[],sparks=[],flips=new Map();let ok=false;
  for(let i=0;i<16;i++){const tb=trips.size;res=simCore(trips,bset,ctl);res.log.forEach(e=>logs.push(e));res.sparks.forEach(p=>sparks.push(p));res.trips.forEach(t=>trips.add(t));res.newBurnt.forEach(b=>bset.add(b));
    /* un contactor accionado a mano (botón de prueba) queda cerrado aunque su bobina no tenga tensión */
    for(const id of simState.forced)if(res.coil[id])res.coil[id]={...res.coil[id],on:true,forced:true};
    const next=new Set(Object.keys(res.coil).filter(k=>res.coil[k].on).map(Number));
    if(trips.size===tb&&next.size===ctl.on.size&&[...next].every(x=>ctl.on.has(x))){ok=true;break}
    for(const x of new Set([...next,...ctl.on]))if(next.has(x)!==ctl.on.has(x))flips.set(x,(flips.get(x)||0)+1);
    ctl={on:next,pressed:ctl.pressed}}
  if(!ok){const bad=[...flips].filter(([,n])=>n>3).map(([id])=>S.items.find(i=>i.id===id)).filter(Boolean);
    bad.forEach(k=>ctl.on.delete(k.id));res=simCore(trips,bset,ctl);
    res.status.unshift({lvl:"crit",msg:`${bad.map(k=>k.p.des||CAT[k.type].n).join(", ")||"El mando"} está vibrando: al cerrar se corta su propia bobina (por ejemplo, un contacto NC suyo en serie con su bobina). Revisa el mando.`})}
  res.log=logs;res.sparks=sparks;res.trips=trips;res.newBurnt=[...bset].filter(b=>!burnt.has(b));res.ctlOn=ctl.on;return res}

function simCore(prevTrip,burnt,ctl){
  const res={status:[],log:[],sparks:[],loads:{},hot:new Set(),trips:new Set(prevTrip),newBurnt:[],pending:[],pcur:{},wireMsg:{},coil:{},ovlI:{}},netCur=new Map();
  const P=S.wall.items.find(i=>i.type==="panel");
  const terms=new Map();for(const it of S.wall.items)for(const t of itemTerms(it))terms.set(t.id,Object.assign(t,{item:it}));
  const nets=new Nets();for(const id of terms.keys())nets.add(id);
  /* además de unir redes, se guarda cada unión para poder seguir el recorrido de la corriente */
  const adj=new Map(),seenE=new Set(),edge=(a,b,wid)=>{if(!terms.has(a)||!terms.has(b)||a===b)return;const k=a<b?a+"|"+b+"|"+wid:b+"|"+a+"|"+wid;if(seenE.has(k))return;seenE.add(k);
    for(const [x,y] of [[a,b],[b,a]]){if(!adj.has(x))adj.set(x,[]);adj.get(x).push({to:y,wid})}};
  const u0=nets.union.bind(nets);nets.union=(a,b,wid=null)=>{u0(a,b);edge(a,b,wid)};const loadPts=[];
  const wires=S.wall.wires.filter(w=>terms.has(w.a)&&terms.has(w.b));
  wires.forEach(w=>nets.union(w.a,w.b,w.id));
  /* sub-tablero: cada breaker cerrado une su barra con su salida; el puente une L1 con L2 */
  for(const it of S.wall.items){if(it.type!=="subt")continue;if(it.p.puente==="Sí")nets.union(`${it.id}/L1`,`${it.id}/L2`);
    for(const b of subtBrks(it.p)){if(res.trips.has(`s${it.id}.${b.i}`))continue;for(let j=0;j<b.poles;j++)nets.union(`${it.id}/${subtBar(b.slot+j)}`,`${it.id}/Q${b.i}.${j}`)}}
  for(const it of S.wall.items){if(it.type==="inter"&&it.p.on)nets.union(`${it.id}/COM`,`${it.id}/L`);if(it.type==="inter3")nets.union(`${it.id}/COM`,`${it.id}/T${it.p.pos===2?2:1}`)}
  const feeds=S.wall.items.filter(i=>i.type==="feed");
  /* barras del tablero (y borneras de neutro/tierra del riel) unidas entre sí */
  const SRC=srcList(),PG=P?panelGeom(P):null;
  if(PG){PG.N.forEach((_,k)=>k&&nets.union(`${P.id}/N0`,`${P.id}/N${k}`));PG.G.forEach((_,k)=>k&&nets.union(`${P.id}/G0`,`${P.id}/G${k}`));
    for(const x of PG.X){const r=bornRole(x.color);if(r==="N")nets.union(`${P.id}/N0`,`${P.id}/X${x.id}`);if(r==="T")nets.union(`${P.id}/G0`,`${P.id}/X${x.id}`)}
    /* contactos del mando cerrados en este paso */
    if(PG.din)for(const [a,b] of ctlLinks(ctl,res.trips))nets.union(`${P.id}/${a}`,`${P.id}/${b}`)}
  /* Con acometida: neutro y tierra se unen en el tablero; en el riel, el peine une las entradas a la salida del seccionador */
  const SUP=supplyOf(),WIRED=!!SUP&&!!P;
  if(WIRED){nets.union(`${P.id}/N0`,`${P.id}/G0`);
    if(isDin()&&P.p.peine!==false&&SRC.length){const head=SRC.find(b=>b.ref.type==="sw")||SRC[0],rp={};
      for(const b of SRC){if(b===head)continue;for(let k=0;k<b.poles;k++){const L=b.ph(k),t=`${P.id}/t${b.id}.${k}`;if(!terms.has(t))continue;if(rp[L])nets.union(rp[L],t);else rp[L]=t}}
      for(let k=0;k<head.poles;k++){const L=head.ph(k);if(rp[L])nets.union(rp[L],`${P.id}/b${head.id}.${k}`)}}}
  const mainOn=!simState.blackout&&(isDin()||!S.lc.main||S.lc.mainOn!==false);
  const passDev=S.wall.items.filter(i=>DEV[i.type]&&DEV[i.type].pass),linked=new Set(),batOn=new Set();
  const stab2=S.wall.items.filter(i=>i.type==="estab2"),stabOn=new Set(),stabWhy={};
  const devOf=id=>S.wall.items.find(i=>i.id===id);
  const phName=ph=>ph[0]==="U"?`la salida de ${devLabel(devOf(+ph.slice(1)))}`:ph[0]==="S"?`la salida ${ph.endsWith("b")?"220":"110"} V de ${devLabel(devOf(parseInt(ph.slice(1))))}`:`la fase ${ph}`;
  if(!P&&!feeds.length)res.status.push({lvl:"warn",msg:"Esta pared no tiene de dónde sacar corriente: agrega el tablero o una llegada de circuito."});
  else if(simState.blackout)res.status.push({lvl:"warn",msg:"Apagón simulado: no llega corriente de la calle. Solo funciona lo que tenga batería."});
  else if(!mainOn)res.status.push({lvl:"warn",msg:"El breaker principal está apagado: no hay tensión en ningún circuito."});
  else if(P&&!SRC.length&&!(isDin()&&S.items.some(i=>CTL_TYPES.has(i.type))))res.status.push({lvl:"warn",msg:isDin()?"El tablero DIN no tiene protecciones que entreguen fase (termomagnético, diferencial, seccionador o guardamotor).":"La caja no tiene breakers: ponlos en la vista Tablero."});

  let info;
  const build=()=>{info=new Map();const get=r=>{if(!info.has(r))info.set(r,{ph:new Set(),N:false,G:false,feed:[]});return info.get(r)};
    if(WIRED){/* la corriente viene de la acometida y pasa por cada protección cerrada */
      if(!simState.blackout&&!res.trips.has("sup"))["L1","L2","L3"].forEach((k,j)=>{const id=`${SUP.id}/${k}`,L=PH()[j];if(terms.has(id)&&L)get(nets.find(id)).ph.add(L)});
      get(nets.find(`${SUP.id}/N`)).N=true;get(nets.find(`${SUP.id}/T`)).G=true;
      const mainOk=isDin()||((!S.lc.main||S.lc.mainOn!==false)&&!res.trips.has("main"));
      for(let it=0;it<12;it++){let ch=false;
        for(const b of SRC){if(b.p.on===false||res.trips.has(b.id))continue;
          for(let k=0;k<b.poles;k++){const out=`${P.id}/b${b.id}.${k}`;if(!terms.has(out))continue;let L=null,ii=null;
            const inT=isDin()?`${P.id}/t${b.id}.${k}`:`${P.id}/M${PH().indexOf(b.ph(k))}`;
            if(isDin()||mainOk)ii=info.get(nets.find(inT));
            if(ii&&ii.ph.size===1)L=[...ii.ph][0];if(!L)continue;edge(inT,out,null);const no=get(nets.find(out));
            if(!no.feed.some(f=>f.b===b&&f.k===k)){no.ph.add(L);no.feed.push({b,k});ch=true}}}
        if(!ch)break}}
    else if(P){for(const b of SRC)for(let k=0;k<b.poles;k++){const id=`${P.id}/b${b.id}.${k}`;if(!terms.has(id))continue;const ni=get(nets.find(id));
        if(mainOn&&b.p.on!==false&&!res.trips.has(b.id)){ni.ph.add(b.ph(k));ni.feed.push({b,k})}}
      get(nets.find(`${P.id}/N0`)).N=true;get(nets.find(`${P.id}/G0`)).G=true}
    for(const f of feeds){const b=SRC.find(x=>x.id===f.p.brk);get(nets.find(`${f.id}/N`)).N=true;get(nets.find(`${f.id}/T`)).G=true;if(!b)continue;
      for(let k=0;k<Math.min(2,b.poles);k++){const ni=get(nets.find(`${f.id}/F${k+1}`));if(mainOn&&b.p.on!==false&&!res.trips.has(b.id)){ni.ph.add(b.ph(k));ni.feed.push({b,k})}}}
    for(const id of batOn){get(nets.find(`${id}/OF`)).ph.add("U"+id);get(nets.find(`${id}/ON`)).N=true}
    for(const id of stabOn){get(nets.find(`${id}/O110`)).ph.add("S"+id+"a");get(nets.find(`${id}/O220`)).ph.add("S"+id+"b")}};
  const netOf=id=>info.get(nets.find(id));
  const pot=id=>{const i=netOf(id);if(!i)return null;if(i.ph.size===1)return[...i.ph][0];if(i.ph.size>1)return"X";if(i.N||i.G)return"0";return null};
  const wireIn=root=>wires.find(w=>nets.find(w.a)===root);
  const volt=voltOf;

  /* Equipos en línea: con 120 V en la entrada dejan pasar la corriente; sin entrada, los que tienen batería alimentan su salida */
  const resolvePass=()=>{for(let k=0;k<10;k++){build();let changed=false;
    for(const it of passDev){if(linked.has(it.id)||burnt.has(it.id)||res.newBurnt.includes(it.id)||it.p.on===false)continue;const vin=volt(pot(`${it.id}/IF`),pot(`${it.id}/IN`));
      if(vin===120){nets.union(`${it.id}/IF`,`${it.id}/OF`);nets.union(`${it.id}/IN`,`${it.id}/ON`);linked.add(it.id);batOn.delete(it.id);changed=true}
      else if(vin>=208){res.newBurnt.push(it.id);batOn.delete(it.id);res.log.push({lvl:"crit",msg:`${devLabel(it)} recibió ${vin} V en su entrada y se quemó. Estos equipos son de 120 V.`});changed=true}
      else if(DEV[it.type].battery&&!res.trips.has("d"+it.id)&&!batOn.has(it.id)){batOn.add(it.id);changed=true}}
    /* estabilizador bifásico: con 208-240 V entre L1 y L2 y neutro en la entrada, entrega sus dos salidas */
    for(const it of stab2){if(stabOn.has(it.id)||burnt.has(it.id)||res.newBurnt.includes(it.id)||it.p.on===false||res.trips.has("d"+it.id))continue;
      const vin=volt(pot(`${it.id}/IL1`),pot(`${it.id}/IL2`)),n=pot(`${it.id}/IN`);
      if(vin>=330){res.newBurnt.push(it.id);res.log.push({lvl:"crit",msg:`${devLabel(it)} recibió ${vin} V en su entrada y se quemó.`});changed=true}
      else if(vin>=208&&n==="0"){nets.union(`${it.id}/IN`,`${it.id}/ON`);stabOn.add(it.id);changed=true}
      else stabWhy[it.id]=!vin?"sin tensión entre E·L1 y E·L2":vin<208?`solo ${vin} V entre E·L1 y E·L2 (necesita las dos fases)`:"sin neutro en E·N"}
    if(!changed)break}};

  for(let pass=0;pass<6;pass++){resolvePass();
    /* 1) cortocircuitos: una red con dos fases, o fase + neutro/tierra */
    for(let guard=0;guard<20;guard++){build();let fault=null;
      for(const [root,i] of info)if(i.ph.size>=2||(i.ph.size&&(i.N||i.G))){fault={root,i};break}
      if(!fault)break;
      const fb=[...new Set(fault.i.feed.map(f=>f.b))];fb.forEach(b=>res.trips.add(b.id));
      const phs=[...fault.i.ph],bats=phs.filter(x=>x[0]==="U").map(x=>+x.slice(1));bats.forEach(id=>{res.trips.add("d"+id);batOn.delete(id)});
      const stabs=[...new Set(phs.filter(x=>x[0]==="S").map(x=>parseInt(x.slice(1))))];stabs.forEach(id=>{res.trips.add("d"+id);stabOn.delete(id)});bats.push(...stabs);
      const what=phs.length>=2?`: se unieron ${phs.map(phName).join(" y ")}`:`: ${phName(phs[0])} quedó unida con ${fault.i.N?"el neutro":"la tierra"}`;
      const who=[...fb.map(srcWho),...bats.map(id=>`la protección interna de ${devLabel(devOf(id))}`)];
      if(!who.length&&WIRED&&!res.trips.has("sup")){res.trips.add("sup");res.log.push({lvl:"crit",msg:`Cortocircuito${what} antes de cualquier protección: se quemaron los fusibles de la compañía en la acometida.`})}
      else{res.log.push({lvl:"crit",msg:`Cortocircuito${what}. Disparó ${who.join(" y ")}.`});if(!who.length)break}
      const w=wireIn(fault.root);if(w){const p=wirePath(w,S.wall.wires.indexOf(w),terms);res.sparks.push(p.mid)}
      else{const t=[...terms.values()].find(t=>nets.find(t.id)===fault.root);if(t)res.sparks.push({x:t.x,y:t.y})}}

    /* 2) aparatos: voltaje, estado y corriente por polo */
    res.loads={};res.pcur={};res.batW={};let gfci=false;
    res.stabW={};for(const it of stab2)res.loads[it.id]=(burnt.has(it.id)||res.newBurnt.includes(it.id))?{s:"burnt",v:0,I:0}:stabOn.has(it.id)?{s:"on",v:240,I:0}:{s:"off",v:0,I:0,why:it.p.on===false?"apagado":res.trips.has("d"+it.id)?"disparó su protección interna":stabWhy[it.id]||"sin tensión en la entrada"};
    for(const it of passDev)res.loads[it.id]=(burnt.has(it.id)||res.newBurnt.includes(it.id))?{s:"burnt",v:0,I:0}:linked.has(it.id)?{s:"on",v:120,I:0}:batOn.has(it.id)?{s:"bat",v:120,I:0}:{s:"off",v:0,I:0,why:it.p.on===false?"apagado":"sin tensión en la entrada"};
    for(const it of S.wall.items){const d=DEV[it.type];if(!d||!d.V||d.tri)continue;
      const [k0,k1]=d.terms.filter(t=>t[1]!=="T").map(t=>`${it.id}/${t[0]}`);
      const a=pot(k0),b=pot(k1),v=volt(a,b),W=d.W(it.p)||0;let st;
      if(burnt.has(it.id))st={s:"burnt",v};
      else if(v===0)st={s:"off",v,why:whyOff(it,k0,k1,{terms,nets,pot,SRC,trips:res.trips,ctl})};
      else if(d.V===120&&v>=208){st={s:"burnt",v};if(!res.newBurnt.includes(it.id)){res.newBurnt.push(it.id);res.log.push({lvl:"crit",msg:`${devLabel(it)} recibió ${v} V en vez de 120 V y se quemó.`})}}
      else if(d.V===240&&v>=330){st={s:"burnt",v};if(!res.newBurnt.includes(it.id)){res.newBurnt.push(it.id);res.log.push({lvl:"crit",msg:`${devLabel(it)} recibió ${v} V en vez de 240 V y se quemó.`})}}
      else if(d.V===240&&v===120)st={s:"weak",v};
      else st={s:W>0?"on":"idle",v};
      st.I=st.s==="on"?W/(d.V===120?120:v):st.s==="weak"?W/4/120:0;res.loads[it.id]=st;st.W=st.s==="on"?W:st.s==="weak"?W/4:0;if(st.I)loadPts.push({t:k0,I:st.I},{t:k1,I:st.I});
      if(st.s==="on")for(const k of [k0,k1]){const i=netOf(k);if(i)for(const ph of i.ph)if(ph[0]==="U")res.batW[ph.slice(1)]=(res.batW[ph.slice(1)]||0)+W}
      if(st.s==="on"){const ss=new Set();for(const k of [k0,k1]){const i=netOf(k);if(i)for(const ph of i.ph)if(ph[0]==="S")ss.add(parseInt(ph.slice(1)))}ss.forEach(id=>res.stabW[id]=(res.stabW[id]||0)+W)}
      if(st.I)for(const k of [k0,k1]){const r=nets.find(k);netCur.set(r,(netCur.get(r)||0)+st.I);const i=netOf(k);if(i&&i.ph.size===1&&i.feed.length){const f=i.feed[0],key=f.b.id+"."+f.k;res.pcur[key]=(res.pcur[key]||0)+st.I}}
      /* curva B: el arranque de un motor (5 a 7 veces su corriente) la hace disparar */
      if(st.s==="on"&&(it.type==="pump"||it.type==="ac"))for(const k of [k0,k1]){const i=netOf(k);if(!i)continue;const f=i.feed.find(f=>f.b.din&&f.b.ref.type==="mcb"&&f.b.ref.p.curve==="B");
        if(f&&!res.trips.has(f.b.id)){res.trips.add(f.b.id);gfci=true;res.log.push({lvl:"crit",msg:`Al arrancar, ${devLabel(it)} pidió varias veces su corriente y disparó ${f.b.lab} (curva B). Para motores usa curva C o D.`})}}
      /* GFCI: si el neutro del aparato regresa por la tierra, el GFCI dispara */
      if(st.I&&d.V===120){const nN=netOf(k1),nF=netOf(k0);if(nN&&nN.G&&!nN.N&&nF&&nF.feed.length){const g=nF.feed.find(f=>f.b.gfci);
        if(g&&!res.trips.has(g.b.id)){res.trips.add(g.b.id);gfci=true;res.log.push({lvl:"crit",msg:`${g.b.din?"El diferencial "+g.b.lab:"El GFCI del "+g.b.lab} detectó corriente regresando por la tierra (${devLabel(it)}) y disparó.`})}}}}
    /* motores trifásicos: tres fases distintas giran; con dos zumban (falta de fase); el orden define el sentido */
    for(const it of S.wall.items){if(it.type!=="motor3")continue;const d=DEV.motor3,ks=["U","V","W"].map(k=>`${it.id}/${k}`),ps=ks.map(pot),fla=d.fla(it.p),ph=ps.map(x=>x&&/^[ABC]$/.test(x)?x:null),u=new Set(ph.filter(Boolean));let st;
      if(burnt.has(it.id)||res.newBurnt.includes(it.id))st={s:"burnt",v:0,I:0};
      else if(u.size===3){const ix=ph.map(x=>"ABC".indexOf(x));st={s:"on",v:208,I:fla,rev:(ix[1]-ix[0]+3)%3!==1}}
      else if(u.size===2)st={s:"fase",v:208,I:fla*1.73};
      else st={s:"off",v:0,I:0,why:u.size?"le llega una sola fase":"sin tensión"};
      res.loads[it.id]=st;st.W=st.s==="on"?Math.round(st.I*208*1.73*.85):0;
      if(st.I)ks.forEach((k,j)=>{if(!ph[j])return;loadPts.push({t:k,I:st.I});const r=nets.find(k);netCur.set(r,(netCur.get(r)||0)+st.I);const i=netOf(k);if(i&&i.ph.size===1&&i.feed.length){const f=i.feed[0],key=f.b.id+"."+f.k;res.pcur[key]=(res.pcur[key]||0)+st.I}});
      if(st.s==="on")for(const k of ks){const i=netOf(k);if(!i)continue;const f=i.feed.find(f=>f.b.din&&f.b.ref.type==="mcb"&&f.b.ref.p.curve==="B");
        if(f&&!res.trips.has(f.b.id)){res.trips.add(f.b.id);gfci=true;res.log.push({lvl:"crit",msg:`Al arrancar, ${devLabel(it)} pidió varias veces su corriente y disparó ${f.b.lab} (curva B). Para motores usa curva C o D, o un guardamotor.`})}}}
    if(!gfci)break}
  /* sub-tablero: corriente de cada breaker por sus polos con fase; dispara con 45% de sobrecarga */
  res.subt={};for(const it of S.wall.items){if(it.type!=="subt")continue;const o={trips:[],I:{},N:0};res.subt[it.id]=o;
    for(const b of subtBrks(it.p)){if(res.trips.has(`s${it.id}.${b.i}`)){o.trips.push(b.i);continue}let I=0;
      const reach=new Set();for(let j=0;j<b.poles;j++){const k=`${it.id}/Q${b.i}.${j}`,i=netOf(k);if(i&&i.ph.size===1&&!i.N)circuitTerms(k).forEach(t=>reach.add(t))}
      for(const d of S.wall.items){const st=res.loads[d.id],dv=DEV[d.type];if(!st||!st.I||!dv||!dv.terms||d.type==="subt"||d.type==="estab2")continue;
        if(dv.terms.some(t=>t[1]==="F"&&reach.has(`${d.id}/${t[0]}`)&&isPh(pot(`${d.id}/${t[0]}`))))I+=st.I}
      o.I[b.i]=I;if(b.poles===1)o.N+=I;
      if(I>b.In*1.45){res.trips.add(`s${it.id}.${b.i}`);o.trips.push(b.i);res.log.push({lvl:"crit",msg:`${devLabel(it)}: el breaker ${b.poles}P ${b.In} A de ${b.name||"Q"+b.i} lleva ${fmtNum(I,1)} A y disparó por sobrecarga.`})}}}
  for(const it of stab2){const W=res.stabW[it.id]||0,cap=it.p.kva*1000*.9,st=res.loads[it.id];if(st){st.W=W;if(st.s==="on")st.I=W/240}
    if(W>cap*1.25&&!res.trips.has("d"+it.id)){res.trips.add("d"+it.id);res.log.push({lvl:"crit",msg:`${devLabel(it)}: le piden ${fmtNum(W,0)} W y aguanta ${fmtNum(cap,0)} W (${it.p.kva} kVA). Disparó su protección interna.`})}}
  res.coil=ctlEval(P,pot,volt,burnt,res);
  /* recorrido de la energía y lectura de cada terminal */
  for(const [id,c] of Object.entries(res.coil))if(c.on&&c.v){const it=S.items.find(i=>i.id===+id);if(!it||it.type==="supv")continue;const [a,b]=it.type==="pilot"?["X1","X2"]:["A1","A2"];loadPts.push({t:`${P.id}/c${id}.${a}`,I:.1},{t:`${P.id}/c${id}.${b}`,I:.1})}
  {const phSrc=[],nSrc=[];
    if(WIRED){["L1","L2","L3"].forEach(k=>phSrc.push(`${SUP.id}/${k}`));nSrc.push(`${SUP.id}/N`)}
    else if(P){for(const t of terms.values())if(t.srcId!=null&&t.item===P)phSrc.push(t.id);nSrc.push(`${P.id}/N0`)}
    for(const f of feeds){phSrc.push(`${f.id}/F1`,`${f.id}/F2`);nSrc.push(`${f.id}/N`)}
    for(const id of batOn){phSrc.push(`${id}/OF`);nSrc.push(`${id}/ON`)}
    const isPhase=t=>isPh(pot(t)),isNeutral=t=>{const i=netOf(t);return!!i&&i.N&&!i.ph.size};
    res.flow={w:flowCompute(adj,phSrc,nSrc,loadPts,isPhase,isNeutral),live:new Set(wires.filter(w=>isPhase(w.a)).map(w=>w.id))};
    res.tp={};for(const id of terms.keys())res.tp[id]=pot(id);
    res.tfeed={};for(const id of terms.keys()){const i=netOf(id);if(i&&i.feed.length)res.tfeed[id]=[...new Set(i.feed.map(f=>f.b.short+" ("+f.b.In+" A)"))]}}

  /* la corriente de cada circuito también pasa por las protecciones de arriba (y por el principal) */
  if(WIRED){const own={...res.pcur},parent={};
    if(isDin())for(const b of SRC)for(let k=0;k<b.poles;k++){const pi=info.get(nets.find(`${P.id}/t${b.id}.${k}`));if(pi&&pi.feed.length){const f=pi.feed[0];if(f.b!==b)parent[b.id+"."+k]=f.b.id+"."+f.k}}
    const tot={...own};for(const key of Object.keys(own)){let q=parent[key],g=0;while(q&&g++<20){tot[q]=(tot[q]||0)+own[key];q=parent[q]}}res.pcur=tot;
    if(!isDin()&&S.lc.main&&!res.trips.has("main")){const by={};for(const b of SRC)for(let k=0;k<b.poles;k++)by[b.ph(k)]=(by[b.ph(k)]||0)+(own[b.id+"."+k]||0);
      const mx=Math.max(0,...Object.values(by));if(mx>S.lc.main){res.pending.push({b:{id:"main",lab:"principal",In:S.lc.main,din:false},I:mx});res.status.push({lvl:"crit",msg:`Sobrecarga en el principal: ${fmtA(mx)} con ${S.lc.main} A. Va a disparar en segundos.`})}}
    if(!simState.blackout&&!res.trips.has("sup")&&![...terms.values()].some(t=>t.item===P&&isPh(pot(t.id))))res.status.push({lvl:"warn",msg:isDin()?"El tablero no recibe línea: lleva L1, L2 (y L3) de la acometida a la entrada (arriba) del seccionador o de la primera protección.":"El tablero no recibe línea: lleva L1, L2 (y L3) de la acometida a la entrada del principal."});
    if(res.trips.has("sup"))res.status.push({lvl:"crit",msg:"Los fusibles de la acometida están quemados. Corrige el corto y presiona Rearmar."});
    res.loads[SUP.id]={s:simState.blackout||res.trips.has("sup")?"off":"idle",v:S.lc.sys==="1F"?240:208,I:0}}
  /* 3a) relés térmicos: miden la corriente que pasa hacia el motor */
  if(PG&&PG.din){const ovlRoots=new Set();
    for(const o of S.items){if(o.type!=="ovl")continue;const roots=["1","2","3"].map(n=>nets.find(`${P.id}/c${o.id}.T${n}`));roots.forEach(r=>ovlRoots.add(r));if(res.trips.has("o"+o.id))continue;
      const I=Math.max(0,...roots.map(r=>netCur.get(r)||0)),mx=ovlMax(o.p),mn=ovlMin(o.p),lab=o.p.des||"Relé térmico";res.ovlI[o.id]=I;
      if(I>mx*1.05){res.pending.push({ovl:o.id,I,lab});res.status.push({lvl:"crit",msg:`${lab}: pasan ${fmtA(I)} y está ajustado hasta ${mx} A. Va a disparar en segundos.`})}
      else if(I>0&&I<mn*.85)res.status.push({lvl:"warn",msg:`${lab}: el motor consume ${fmtA(I)} y el relé se ajusta desde ${mn} A, así no lo protege. Elige el rango que incluya la corriente del motor.`})}
    for(const it of S.wall.items)if(it.type==="motor3"&&res.loads[it.id].s==="fase"&&!["U","V","W"].some(k=>ovlRoots.has(nets.find(`${it.id}/${k}`))))
      res.pending.push({burn:it.id,msg:`${devLabel(it)} trabajó en falta de fase sin relé térmico y se quemó el bobinado. Protege los motores con un relé térmico o un guardamotor.`})}
  else for(const it of S.wall.items)if(it.type==="motor3"&&res.loads[it.id]&&res.loads[it.id].s==="fase")res.pending.push({burn:it.id,msg:`${devLabel(it)} trabajó en falta de fase y se quemó el bobinado.`});
  /* 3) sobrecarga por polo */
  const seen=new Set();
  for(const [key,I] of Object.entries(res.pcur)){const id=+key.split(".")[0],b=SRC.find(x=>x.id===id);if(!b)continue;if(res.trips.has(id))continue;
    if(I>b.In&&!seen.has(id)){seen.add(id);res.pending.push({b,I});res.status.push({lvl:"crit",msg:`Sobrecarga en ${b.lab}: ${fmtA(I)} con protección de ${b.In} A. Va a disparar en segundos.`})}
    else if(I>b.In*.8&&!seen.has(id)){seen.add(id);res.status.push({lvl:"warn",msg:`${b.lab[0].toUpperCase()+b.lab.slice(1)} al ${Math.round(I/b.In*100)}% de su protección (${fmtA(I)} de ${b.In} A).`})}}

  /* 3b) conexiones de protecciones */
  if(P){const PT=itemTerms(P),ins=PT.filter(t=>t.lineOf!=null||t.mainIn!=null),inRoots=new Map(ins.map(t=>[nets.find(t.id),t]));
    for(const it of S.wall.items){const d=DEV[it.type];if(!d||!d.V)continue;for(const tr of d.terms.filter(t=>t[1]==="F")){const t=inRoots.get(nets.find(`${it.id}/${tr[0]}`));
      if(t){res.status.push({lvl:"warn",msg:`${devLabel(it)} está conectado a la ${t.mainIn!=null?"entrada del principal":"entrada (arriba) de "+(srcById(t.lineOf)||{}).short}: queda sin protección. Conéctalo a la salida (abajo) de una protección.`});break}}}
    if(WIRED&&isDin())for(const b of SRC)for(let k=0;k<b.poles;k++){const bo=info.get(nets.find(`${P.id}/b${b.id}.${k}`)),to=info.get(nets.find(`${P.id}/t${b.id}.${k}`));
      if(bo&&bo.ph.size&&!bo.feed.some(f=>f.b===b)&&!(to&&to.ph.size)){res.status.push({lvl:"warn",msg:`${b.short} está alimentado por abajo (invertido). Funciona, pero al abrirlo sus bornes de abajo quedan con tensión. La línea entra por arriba.`});break}}}
  if(isDin()){const ns=S.items.filter(i=>INFO[i.type]&&INFO[i.type].sim==="no").map(i=>i.p.des||CAT[i.type].n);if(ns.length)res.status.push({lvl:"off",msg:`Todavía no se simulan: ${[...new Set(ns)].slice(0,8).join(", ")}. Mira su ficha para saber cómo se conectan.`})}
  /* 4) cables: colores según norma y calibre vs. breaker */
  wires.forEach(w=>{const ra=terms.get(w.a).role,rb=terms.get(w.b).role,roles=[ra,rb],c=w.color,msgs=[];
    if(roles.includes("N")&&c!=="Blanco")msgs.push("el neutro va en blanco");
    else if(roles.includes("T")&&c!=="Verde")msgs.push("la tierra va en verde");
    else if((roles.includes("F")||roles.includes("S"))&&(isPh(pot(w.a))||pot(w.a)==null&&![w.a,w.b].some(k=>{const t=terms.get(k);return t&&(t.item.type==="subt"||t.item.type==="estab2")}))&&(c==="Blanco"||c==="Verde"))msgs.push("una fase no puede ir en blanco ni en verde");
    const i=netOf(w.a);
    if(i&&i.feed.length){const In=Math.max(...i.feed.map(f=>f.b.In)),amp=AMPACITY[w.awg];
      if(amp<In)msgs.push(`calibre #${w.awg} aguanta ${amp} A y está protegido con ${In} A: usa #${AWG_FOR(In)}`);
      const I=Math.max(0,...i.feed.map(f=>res.pcur[f.b.id+"."+f.k]||0));if(I>amp)res.hot.add(w.id)}
    if(msgs.length){res.wireMsg[w.id]=msgs;res.status.push({lvl:"warn",msg:`Cable ${c.toLowerCase()} #${w.awg} (${wireEnds(w,terms)}): ${msgs.join("; ")}.`,wire:w.id})}});

  /* 5) reglas por dispositivo */
  for(const it of S.wall.items){const d=DEV[it.type];if(!d||it.type==="panel"||it.type==="feed"||it.type==="supply")continue;const L=devLabel(it);
    if(it.type==="inter"||it.type==="inter3"){if(d.terms.some(t=>pot(`${it.id}/${t[0]}`)==="0"))res.status.push({lvl:"warn",msg:`${L}: está cortando el neutro. El interruptor siempre debe cortar la fase.`})}
    if(it.type==="toma"&&pot(`${it.id}/F`)==="0"&&/[ABC]/.test(pot(`${it.id}/N`)||""))res.status.push({lvl:"warn",msg:`${L}: polaridad invertida. La fase va al tornillo dorado (F) y el neutro al plateado (N).`});
    if(d.terms.some(t=>t[1]==="T")){const g=netOf(`${it.id}/T`);if(!(g&&g.G))res.status.push({lvl:"warn",msg:`${L}: sin conexión a tierra.`})}
    const nTerm=d.terms.find(t=>t[1]==="N");if(nTerm){const n=netOf(`${it.id}/${nTerm[0]}`);if(n&&n.G&&!n.N)res.status.push({lvl:"warn",msg:`${L}: el neutro está conectado a la barra de tierra, no a la de neutro.`})}
    if(d.pass||it.type==="estab2"||it.type==="subt")continue;const st=res.loads[it.id];if(!st)continue;
    if(d.tri){if(st.s==="on")res.status.push(st.rev?{lvl:"warn",msg:`${L}: gira al revés. Intercambia dos fases (por ejemplo, los cables de T1 y T2).`}:{lvl:"ok",msg:`${L}: girando (${fmtA(st.I)} por fase).`});
      else if(st.s==="fase")res.status.push({lvl:"crit",msg:`${L}: falta una fase${S.lc.sys==="1F"?" (el sistema 120/240 V solo tiene dos)":""}. Zumba, no arranca bien y se recalienta.`});
      else if(st.s==="off")res.status.push({lvl:"off",msg:`${L}: detenido (${st.why}).`});continue}
    if(st.s==="on")res.status.push({lvl:"ok",msg:`${L}: funcionando a ${st.v} V (${fmtA(st.I)}).`});
    else if(st.s==="idle")res.status.push({lvl:"ok",msg:`${L}: tiene ${st.v} V, sin aparato conectado.`});
    else if(st.s==="weak")res.status.push({lvl:"warn",msg:`${L}: recibe solo 120 V y necesita ${S.lc.sys==="1F"?240:208} V. Conéctalo a dos fases.`});
    else if(st.s==="off")res.status.push({lvl:"off",msg:`${L}: no funciona, ${st.why}`.replace(/([^.])$/,"$1.")})}
  for(const it of stab2){const st=res.loads[it.id],L=devLabel(it),cap=it.p.kva*1000*.9,W=res.stabW[it.id]||0;if(!st)continue;
    if(st.s==="on")res.status.push(W>cap?{lvl:"warn",msg:`${L}: entrega ${fmtNum(W,0)} W y su capacidad es ${fmtNum(cap,0)} W (${it.p.kva} kVA). Está sobrecargado.`}:W>cap*.85?{lvl:"warn",msg:`${L}: entrega ${fmtNum(W,0)} W, el ${Math.round(W/cap*100)}% de su capacidad (${it.p.kva} kVA). Al arrancar los compresores (3 a 5 veces su corriente) se puede disparar: conviene uno más grande.`}:{lvl:"ok",msg:`${L}: con 240 V en la entrada, entrega 110 V y 220 V (${fmtNum(W,0)} W de ${fmtNum(cap,0)} W).`});
    else if(st.s==="off")res.status.push({lvl:"off",msg:`${L}: no entrega voltaje: ${st.why}.`})}
  for(const it of S.wall.items){if(it.type!=="subt"||!res.subt[it.id])continue;const o=res.subt[it.id],L=devLabel(it);
    for(const b of subtBrks(it.p)){const I=o.I[b.i]||0;if(!o.trips.includes(b.i)&&I>b.In)res.status.push({lvl:"warn",msg:`${L}: el breaker de ${b.name||"Q"+b.i} (${b.In} A) lleva ${fmtNum(I,1)} A. Va a disparar.`})}
    if(it.p.puente==="Sí"&&o.N>0)res.status.push({lvl:"warn",msg:`${L}: con el puente entre L1 y L2, el neutro de este tablero lleva la suma de todos los circuitos: ${fmtNum(o.N,1)} A. Revisa que el cable de neutro y su barra aguanten esa corriente.`});
    if(it.p.puente==="Sí"&&subtBrks(it.p).some(b=>b.poles===2))res.status.push({lvl:"warn",msg:`${L}: tiene el puente entre L1 y L2 y un breaker de 2 polos: ese circuito recibe la misma fase en los dos polos (0 V).`})}
  for(const it of passDev){const st=res.loads[it.id],L=devLabel(it),d=DEV[it.type];
    if(st.s==="on")res.status.push({lvl:"ok",msg:`${L}: con 120 V en la entrada, alimentando su salida.`});
    else if(st.s==="bat"){const w=res.batW[it.id]||0,cap=d.cap(Object.assign({},d.d,it.p));res.status.push(w>cap?{lvl:"crit",msg:`${L}: tiene ${w} W conectados y solo aguanta ${cap} W con batería.`}:{lvl:"ok",msg:`${L}: funcionando con batería (${w} W de ${cap} W).`})}
    else if(st.s==="off")res.status.push({lvl:"off",msg:`${L}: ${st.why}.`})}
  if(PG&&PG.din)for(const it of S.items){const c=res.coil[it.id];if(!c&&it.type!=="spd")continue;const lab=it.p.des||CAT[it.type].n;
    if(it.type==="pilot"){if(c.on)res.status.push({lvl:"ok",msg:`${lab} (piloto ${String(it.p.color).toLowerCase()}): encendida.`});else if(c.why.startsWith("poco"))res.status.push({lvl:"warn",msg:`${lab}: luz piloto de ${c.r} V con ${c.v} V, casi no se ve.`});continue}
    if(it.type==="spd"){const tc=k=>`${P.id}/c${it.id}.${k}`,Ls=(it.p.poles===4?["L1","L2","L3"]:["L1","L2"]),used=[...Ls,"PE"].some(k=>S.wall.wires.some(w=>w.a===tc(k)||w.b===tc(k)));if(!used)continue;
      const g=netOf(tc("PE")),live=Ls.filter(k=>isPh(pot(tc(k))));
      if(!(g&&g.G))res.status.push({lvl:"warn",msg:`${lab}: su borne PE no está conectado a la tierra. Sin tierra no puede descargar los picos.`});
      else if(live.length)res.status.push({lvl:"ok",msg:`${lab}: protegiendo ${live.join(" y ")} contra picos (descarga a tierra).`});
      else res.status.push({lvl:"off",msg:`${lab}: conectado a tierra, pero sus bornes ${Ls.join(" y ")} no tienen fase.`});continue}
    if(it.type==="supv"){const tc=k=>`${P.id}/c${it.id}.${k}`,used=[...supvL(it.p),"11","12","14"].some(k=>S.wall.wires.some(w=>w.a===tc(k)||w.b===tc(k)));
      if(c.why!=="sin tensión")res.status.push(c.on?{lvl:"ok",msg:`${lab}: red normal, cierra 11-14.`}:{lvl:"warn",msg:`${lab}: ${c.why}. Abre 11-14 y no deja arrancar.`});
      else if(used){const miss=supvL(it.p).filter(k=>k!=="N"&&!isPh(pot(tc(k)))),all=supvL(it.p).filter(k=>k!=="N");res.status.push({lvl:"warn",msg:miss.length<all.length?`${lab}: no recibe fase en ${miss.join(" y ")}. Detecta la falta de fase y deja abierto 11-14.`:`${lab}: no tiene tensión en ${all.join(" y ")}, así que su contacto 11-14 queda abierto.`})}continue}
    if(c.forced)res.status.push({lvl:"warn",msg:`${lab}: accionado a mano para probar (su bobina tiene ${c.v||0} V). En la realidad lo cierra la bobina A1-A2.`});
    else if(c.on)res.status.push({lvl:"ok",msg:`${lab}: bobina con ${c.v} V, ${it.type==="timer"?(timerOp(it,ctl)?"contacto 15-18 cerrado":`contando ${timerT(it.p)} s`):"contactos cerrados"}.`});
    else if(c.why.startsWith("poco"))res.status.push({lvl:"warn",msg:`${lab}: la bobina es de ${c.r} V y recibe ${c.v} V. Zumba y no cierra.`});
    else if(c.why==="sin tensión"&&it.type!=="pilot"){const tc=k=>`${P.id}/c${it.id}.${k}`,cab=["A1","A2"].some(k=>S.wall.wires.some(w=>w.a===tc(k)||w.b===tc(k)));
      /* sin ningún cable en la bobina todavía no se avisa; esperar el pulsador de marcha es normal */
      const cw=cab&&coilWhy(it,{terms,nets,pot,SRC,trips:res.trips,ctl});if(cw)res.status.push({lvl:/^([^;]+ no está presionado(; )?)+$/.test(cw)?"off":"warn",msg:`${lab}: la bobina no tiene tensión: ${cw}.`})}}
  const order={crit:0,warn:1,ok:2,off:3};res.status.sort((a,b)=>order[a.lvl]-order[b.lvl]);
  return res}
