/* =====================================================================
   control.js — Mando de motores en el tablero de riel DIN.
   · Bornes de cada componente de mando (contactor, relé térmico, relé,
     temporizador, pulsadores, paro de emergencia, selector, pilotos y
     supervisor de voltaje) para cablearlos en la pared.
   · Qué contactos quedan cerrados según el estado del mando.
   · Motor trifásico para probar arranques en la pared.
   El simulador (sim.js) resuelve el mando por pasos: con el estado de
   las bobinas calcula las redes, mira qué bobinas quedan con tensión y
   repite hasta que nada cambie. Así funciona la retención 13-14.
   ===================================================================== */
const CTL_COIL=new Set(["icont","cont","relay","timer"]);
const CTL_TYPES=new Set([...CTL_COIL,"ovl","push","emerg","selector","pilot","supv","spd"]);
const coilVolt=s=>parseInt(String(s))||120;
const ovlMax=p=>parseFloat(String(p.range).split("–")[1])||13;
const ovlMin=p=>parseFloat(String(p.range).split("–")[0])||9;
const contPoles=p=>p.cts==="2NA"?2:4;
const timerT=p=>+p.t||3;
const isTon=p=>p.fn!=="Retardo a la desconexión";
const sel3=p=>String(p.lab||"").split("·").length===3;

/* Bornes de cada componente: y en coordenadas del dibujo del módulo, x repartida en el ancho */
function dinPins(it){const p=it.p;
  const row=(y,list,role="C")=>list.map((k,i)=>({k,y,fx:(i+.5)/list.length,role:typeof role==="function"?role(k):role}));
  switch(it.type){
   case"icont":{const aux=p.aux==="1NA"?["13","14"]:p.aux==="1NC"?["21","22"]:["13","14","21","22"];
     return[...row(19,["L1","L2","L3"],"F"),...row(153,["T1","T2","T3"],"F"),...row(58,["A1","A2"]),...row(126,aux)]}
   case"cont":{const n=contPoles(p);return[...row(19,["1","3","5","7"].slice(0,n),"F"),...row(153,["2","4","6","8"].slice(0,n),"F"),...row(88,["A1","A2"])]}
   case"ovl":return[...row(19,["L1","L2","L3"],"F"),...row(153,["T1","T2","T3"],"F"),...row(104,["95","96","97","98"])];
   case"relay":{const two=p.ct!=="1 conmutado";return[...row(19,["A1","A2"]),...row(136,two?["11","21"]:["11"]),...row(153,two?["12","14","22","24"]:["12","14"])]}
   case"timer":return[...row(19,["A1","A2"]),...row(136,["15"]),...row(153,["16","18"])];
   case"push":return p.ct==="NC"?[...row(19,["11"]),...row(153,["12"])]:[...row(19,["13"]),...row(153,["14"])];
   case"emerg":return[...row(19,["11"]),...row(153,["12"])];
   case"selector":return sel3(p)?[...row(19,["13","23"]),...row(153,["14","24"])]:[...row(19,["13"]),...row(153,["14"])];
   case"pilot":return[...row(19,["X1"]),...row(153,["X2"])];
   case"spd":return[...row(19,p.poles===4?["L1","L2","L3","N"]:["L1","L2"],k=>k==="N"?"N":"C"),...row(153,["PE"],"T")];
   case"supv":{const s=String(p.sys||"");const L=s.startsWith("Trif")?["L1","L2","L3"]:s.startsWith("Bif")?["L1","L2"]:["L","N"];
     return[...row(19,L,k=>k==="N"?"N":"C"),...row(153,["11","12","14"])]}}
  return[]}
/* Qué hace cada borne (para el nombre del terminal) */
function pinRole(type,k){
  if(/^A[12]$/.test(k))return k==="A1"?"bobina A1":"bobina A2";
  if(type==="ovl"&&/^9[5-8]$/.test(k))return{"95":"95 (NC)","96":"96 (NC)","97":"97 (NA)","98":"98 (NA)"}[k];
  if(type==="icont"&&/^L\d$/.test(k))return"entrada "+k;if(type==="icont"&&/^T\d$/.test(k))return"salida "+k;
  return k}

/* Relé térmico montado justo a la derecha de un contactor: entra directo en sus salidas T1-T3 */
const coupledCont=o=>S.items.find(k=>k.type==="icont"&&k.row===o.row&&k.x+units(k)===o.x);

/* Contactos cerrados (pares de bornes) con el estado actual del mando */
function ctlLinks(ctl,trips){const out=[],L=(id,a,b)=>out.push([`c${id}.${a}`,`c${id}.${b}`]);
  for(const it of S.items){const on=ctl.on.has(it.id),p=it.p,id=it.id;
    switch(it.type){
     case"icont":if(on){["1","2","3"].forEach(k=>L(id,"L"+k,"T"+k));L(id,"13","14")}else L(id,"21","22");break;
     case"cont":{const n=contPoles(p),nc=p.cts==="2NA+2NC";for(let k=0;k<n;k++)if(nc&&k>=2?!on:on)L(id,String(2*k+1),String(2*k+2));break}
     case"ovl":["1","2","3"].forEach(k=>L(id,"L"+k,"T"+k));if(trips.has("o"+id))L(id,"97","98");else L(id,"95","96");
       {const k=coupledCont(it);if(k)["1","2","3"].forEach(n=>out.push([`c${k.id}.T${n}`,`c${id}.L${n}`]))}break;
     case"relay":if(on){L(id,"11","14");L(id,"21","24")}else{L(id,"11","12");L(id,"21","22")}break;
     case"timer":if(timerOp(it,ctl))L(id,"15","18");else L(id,"15","16");break;
     case"push":{const pr=ctl.pressed.has(id);if(p.ct==="NC"){if(!pr)L(id,"11","12")}else if(pr)L(id,"13","14");break}
     case"emerg":if(p.on!==false)L(id,"11","12");break;
     case"selector":if(sel3(p)){if(p.pos==="Izquierda")L(id,"13","14");if(p.pos==="Derecha")L(id,"23","24")}else if(p.pos!=="Izquierda")L(id,"13","14");break;
     case"supv":if(on)L(id,"11","14");else L(id,"11","12");break}}
  return out}
/* Temporizador: retardo a la conexión cierra 15-18 cuando pasó el tiempo con la bobina alimentada;
   a la desconexión cierra al alimentarlo y abre cuando pasó el tiempo sin alimentación */
function timerOp(it,ctl){const on=ctl.on.has(it.id),rec=simState.tm[it.id],t=timerT(it.p)*1000,el=rec?Date.now()-rec.at:0;
  if(isTon(it.p))return on&&!!rec&&rec.on&&el>=t;
  return on||(!!rec&&rec.on)||(!!rec&&!rec.on&&el<t)}
/* Guarda el estado del mando al terminar cada prueba y programa la próxima si un temporizador está contando */
function ctlCommit(r){simState.ctl=[...r.ctlOn];const now=Date.now();let next=Infinity;
  for(const it of S.items)if(it.type==="timer"){const on=r.ctlOn.has(it.id),rec=simState.tm[it.id];
    if(on&&!(rec&&rec.on))simState.tm[it.id]={on:true,at:now};else if(!on&&rec&&rec.on)simState.tm[it.id]={on:false,at:now};
    const q=simState.tm[it.id];if(!q)continue;const t=timerT(it.p)*1000,el=now-q.at;
    if(isTon(it.p)?q.on&&el<t:!q.on&&el<t)next=Math.min(next,t-el)}
  clearTimeout(simState.ctlT);simState.ctlT=null;
  if(next<Infinity)simState.ctlT=setTimeout(()=>{simState.ctlT=null;if(simState.running&&S.view==="wall")renderAll()},next+40)}
function ctlReset(){simState.ctl=[];simState.pressed.clear();simState.forced.clear();simState.tm={};clearTimeout(simState.ctlT);simState.ctlT=null}

/* Estado de cada bobina, piloto y supervisor con las redes ya calculadas */
function ctlEval(P,pot,volt,burnt,res){const out={};if(!P||!isDin())return out;
  for(const it of S.items){const T=k=>`${P.id}/c${it.id}.${k}`,lab=it.p.des||CAT[it.type].n;
    if(CTL_COIL.has(it.type)||it.type==="pilot"){const pl=it.type==="pilot",[a,b]=pl?["X1","X2"]:["A1","A2"],v=volt(pot(T(a)),pot(T(b))),r=pl?(parseInt(it.p.V)||120):coilVolt(it.p.coil);let on=false,why="";
      if(burnt.has(it.id)||res.newBurnt.includes(it.id))why="quemada";
      else if(!v)why="sin tensión";
      else if(v>r*1.2){res.newBurnt.push(it.id);why="quemada";res.log.push({lvl:"crit",msg:`${lab}: ${pl?"la luz piloto es de":"la bobina es de"} ${r} V y recibió ${v} V. Se quemó${pl?"":" la bobina"}.`})}
      else if(v<r*.85)why=`poco voltaje (${v} V de ${r} V)`;
      else on=true;out[it.id]={on,v,r,why}}
    else if(it.type==="supv")out[it.id]=supvCheck(it,k=>pot(T(k)),volt)}
  return out}
/* Bornes de medición del supervisor según su sistema */
const supvL=p=>{const s=String(p.sys||"");return s.startsWith("Trif")?["L1","L2","L3"]:s.startsWith("Bif")?["L1","L2"]:["L","N"]};
/* El supervisor cierra 11-14 solo si lo que mide está bien; q(k) da lo que llega a cada borne */
function supvCheck(it,q,volt){const s=String(it.p.sys||"");let ok=false,why="";
  if(s.startsWith("Trif")){const ps=["L1","L2","L3"].map(q),ix=ps.map(x=>"ABC".indexOf(x||"-"));
    if(ix.some(i=>i<0)||new Set(ix).size<3)why=ix.every(i=>i<0)?"sin tensión":"falta una fase";
    else if(s.includes("480"))why="voltaje fuera de rango (está ajustado para 480 V)";
    else if((ix[1]-ix[0]+3)%3!==1||(ix[2]-ix[1]+3)%3!==1)why="secuencia de fases invertida";else ok=true}
  else if(s.startsWith("Bif")){const v=volt(q("L1"),q("L2"));if(!v)why="sin tensión";else if(v<216)why=`bajo voltaje (${v} V): está ajustado para 240 V y L2 recibe neutro; L2 va a la otra fase`;else ok=true}
  else{const v=volt(q("L"),q("N"));if(!v)why="sin tensión";else if(q("N")!=="0")why="no tiene neutro en N";else ok=true}
  return{on:ok,why}}

/* ---------- motor trifásico en la pared ---------- */
DEV.motor3={n:"Motor trifásico 208 V",short:"Motor 3F",w:132,h:84,V:208,tri:true,terms:[["U","F","U"],["V","F","V"],["W","F","W"],["T","T","T"]],d:{hp:"3 HP"},
  f:[["hp","Potencia",["1 HP","2 HP","3 HP","5 HP"]]],fla:p=>({"1 HP":4.6,"2 HP":7.5,"3 HP":10.6,"5 HP":16.7})[p.hp]||10.6,std:.3,
  tip:"Motor de bomba o compresor. Se alimenta desde las salidas T1, T2, T3 del relé térmico, con la carcasa a tierra. Si gira al revés, intercambia dos fases."};
LIB_WALL.find(c=>c[0]==="Aparatos para probar")[1].push("motor3");
