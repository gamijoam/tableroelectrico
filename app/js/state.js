/* ---------- state ---------- */
let S, hist=[], fut=[], sel=null, activeRow=0, zoom=1, autoFit=true, uid=1;
const KEY="taller-tableros-v3", OLDKEY="taller-tableros-v1", PREVKEY="taller-tableros-v2";
let freshStart=false;
const prevBoard=()=>{try{const t=localStorage.getItem(PREVKEY);return t?normalize(JSON.parse(t)):null}catch(e){return null}};
const today=()=>new Date().toLocaleDateString("es-VE");
const proj=(name,client)=>({name,client,author:"",date:today()});
const defQuote=()=>({over:{},point:12,cableM:15,per:10,board:40,ext:35,margin:15,iva:16,ivaOn:false,rate:0,valid:7});
function blankAll(){return{kind:"lc",project:proj("Tablero nuevo",""),board:{rows:2,mods:18,style:"metal"},items:[],lc:{spaces:20,sys:"1F",main:100,mainOn:true,items:[],aux:[]},ext:[],quote:defQuote(),view:"board",walls:[blankWall()],wallI:0}}
function blankState(rows=2,mods=18){return{kind:"din",project:proj("Tablero nuevo",""),board:{rows,mods,style:"metal"},items:[],ext:[]}}
function xk(type,name,ov={}){return{id:uid++,type,p:Object.assign({},EXT[type].d,ov,{name})}}
function mk(type,row,x,des,name,ov={}){return{id:uid++,type,row,x,p:Object.assign({},CAT[type].d,ov,{des,name})}}
function lk(side,slot,poles,In,name,W,type="Estándar"){return{id:uid++,side,slot,p:Object.assign({},BRK.d,{poles,In,name,W,type})}}
const TPL={
 casaVE(){const o={kind:"lc",project:proj("Casa unifamiliar — Tablero principal","Familia Pérez · Urb. La Trigaleña"),lc:{spaces:24,sys:"1F",main:100,mainOn:true,items:[
  lk("L",0,1,20,"Iluminación sala y comedor",700),lk("R",0,1,20,"Iluminación cuartos",600),
  lk("L",1,1,20,"Tomas cocina",1500,"GFCI"),lk("R",1,1,20,"Nevera",700),
  lk("L",2,1,20,"Tomas sala",1200),lk("R",2,1,20,"Baños",1500,"GFCI"),
  lk("L",3,1,20,"Tomas cuartos",1000),lk("R",3,1,20,"Lavadora",1000),
  lk("L",4,2,30,"Calentador de agua",4500),lk("R",4,2,20,"A/A 18.000 BTU sala",2000),
  lk("L",6,2,40,"Cocina eléctrica",8000),lk("R",6,2,20,"A/A 12.000 BTU cuarto",1300),
  lk("L",8,1,15,"Cuarto de los niños",600,"AFCI"),lk("R",8,2,20,"Bomba de agua 1 HP",1100)],
  aux:[mk("prot",0,0,"PV1","Protector general",{In:63}),mk("spd",0,4,"DPS1","Picos"),mk("supv",0,8,"SV1","A/A y bomba",{sys:"Bifásico 240V"}),mk("pilot",0,12,"H1","Hay luz",{color:"Verde"})]},
  ext:[xk("inv","Respaldo: luces, nevera, router",{kw:3,bat:4}),xk("estab","Línea de A/A",{kva:5,sys:"Bifásico 240V"})]};o.walls=[demoWall(o.lc.items),demoStairs(o.lc.items)];o.wallI=0;return o},
 localVE(){return{kind:"lc",project:proj("Panadería — Tablero general","Panadería El Trigal · Valencia"),lc:{spaces:30,sys:"3F",main:200,mainOn:true,items:[
  lk("L",0,3,60,"A/A central 5 TR",15000),lk("R",0,3,40,"Horno industrial",9000),
  lk("L",3,1,20,"Iluminación salón 1",1200),lk("L",4,1,20,"Iluminación salón 2",1200),lk("L",5,1,20,"Vitrina refrigerada",900),
  lk("R",3,1,20,"Tomas cocina",1500,"GFCI"),lk("R",4,1,20,"Tomas mostrador",1000),lk("R",5,1,20,"Cava cuarto",1400),
  lk("L",6,2,30,"Calentador",4000),lk("R",6,2,20,"Amasadora",2000),
  lk("L",8,1,20,"Avisos luminosos",600),lk("L",9,1,20,"Iluminación exterior",500),lk("L",10,1,15,"Cámaras y alarma",300),lk("L",11,1,20,"Punto de venta",600),
  lk("R",8,1,20,"Tomas oficina",800),lk("R",9,1,20,"Baños",1200,"GFCI"),lk("R",10,2,30,"A/A oficina",2400)]},walls:[blankWall("Pared del tablero")],wallI:0,
  ext:[xk("gen","Respaldo general",{kva:40,fuel:"Diésel"}),xk("ats","Red / planta",{In:200}),xk("ups","Punto de venta",{kva:1.5})]}},
 casa(){const s=blankState(2,18);s.project=proj("Tablero DIN residencial","Residencia Rodríguez");s.items=[
  mk("sw",0,0,"QS1","Corte general",{poles:2,In:40}),mk("prot",0,4,"PV1","Protector"),mk("spd",0,8,"DPS1","Picos"),mk("rcd",0,12,"ID1","Circuitos generales"),
  mk("mcb",0,16,"Q1","Iluminación",{In:10}),mk("mcb",0,20,"Q2","Tomas generales",{In:16}),mk("mcb",0,24,"Q3","Aire acondicionado",{In:20}),mk("pilot",0,30,"H1","Tensión",{color:"Verde"}),
  mk("rcd",1,0,"ID2","Cocina y lavadero"),mk("mcb",1,4,"Q4","Cocina",{In:16}),mk("mcb",1,8,"Q5","Calentador",{In:20}),mk("meter",1,14,"P1","Consumo",{}),mk("socket",1,20,"TC1","Servicio"),
  mk("term",1,28,"X1","T",{color:"Verde"}),mk("term",1,29,"X2","T",{color:"Verde"}),mk("term",1,30,"X3","N",{color:"Blanco"}),mk("term",1,31,"X4","N",{color:"Blanco"})];return s},
 local(){const s=blankState(3,24);s.board.style="plastic";s.project=proj("Tablero de control — Local","Panadería El Trigal");s.items=[
  mk("sw",0,0,"QS1","Corte general",{poles:3,In:63}),mk("supv",0,6,"SV1","Supervisor de fases"),mk("spd",0,10,"DPS1","Picos",{poles:4}),mk("meter",0,18,"P1","Energía total",{ph:"Trifásico",kwh:"008731.2"}),
  mk("pilot",0,26,"H1","Fase A",{color:"Rojo"}),mk("pilot",0,28,"H2","Fase B",{color:"Ámbar"}),mk("pilot",0,30,"H3","Fase C",{color:"Azul"}),mk("vam",0,32,"PV1","Voltaje AB",{read:"208.6"}),mk("vam",0,36,"PA1","Corriente A",{mode:"Amperímetro",read:"42.7"}),
  mk("icont",1,0,"KM1","Extractor",{In:18}),mk("ovl",1,5,"F1","Extractor",{range:"9–13A"}),mk("icont",1,11,"KM2","Cava cuarto",{In:25}),mk("ovl",1,16,"F2","Cava",{range:"16–24A"}),mk("relay",1,22,"KA1","Avisos"),mk("relay",1,25,"KA2","Alarma"),
  mk("cont",2,0,"KM3","Cartel luminoso",{cts:"2NA"}),mk("timer",2,4,"KT1","Encendido cartel"),mk("selector",2,6,"SA1","Modo cartel"),mk("push",2,8,"S1","Marcha",{color:"Verde"}),mk("push",2,10,"S2","Parada",{color:"Rojo",ct:"NC"}),mk("emerg",2,12,"S3","Emergencia"),mk("psu",2,17,"G1","Control 24V"),
  ...[1,2,3,4,5,6].map(n=>mk("term",2,23+n,"X"+n,"",{color:"Negro"})),mk("term",2,30,"X7","N",{color:"Blanco"}),mk("term",2,31,"X8","N",{color:"Blanco"}),mk("term",2,32,"X9","T",{color:"Verde"}),mk("term",2,33,"X10","T",{color:"Verde"})];return s},
 supv(){const s=blankState(2,12);s.project=proj("Protección de voltaje para toda la casa","Residencia Rodríguez");
  const m1=typeof iec==="function"&&iec(),KM=mk("icont",0,0,"KM1","General",{In:40,coil:m1?"120V":"240V",aux:"1NA"}),Q0=mk("mcb",0,6,"Q0","Mando",{poles:2,In:2}),SV=mk("supv",0,10,"SV1","Voltaje",{sys:m1?"Monofásico 120V":"Bifásico 240V"}),
   Q1=mk("mcb",1,0,"Q1","Iluminación",{poles:1,In:16}),Q2=mk("mcb",1,2,"Q2","Tomas",{poles:1,In:20});
  s.items=[KM,Q0,SV,Q1,Q2];s.lc=Object.assign(JSON.parse(JSON.stringify(S&&S.lc?S.lc:TPL.casaVE().lc)),{sys:"1F"});
  s.walls=[supvWall({KM,Q0,SV,Q1,Q2},m1)];s.wallI=0;s.view="wall";return s},
 motor(){const s=blankState(2,12);s.project=proj("Bomba hidroneumática 3 HP","Residencias Los Samanes");
  const Q1=mk("mcb",0,0,"Q1","Bomba",{poles:3,In:16}),Q2=mk("mcb",0,6,"Q2","Mando",{poles:1,In:6}),SV=mk("supv",0,8,"SV1","Fases",{sys:"Trifásico 208V"}),KM=mk("icont",0,12,"KM1","Bomba",{In:18,coil:"120V",aux:"1NA"}),F1=mk("ovl",0,17,"F1","Bomba",{range:"9–13A"}),
   S0=mk("emerg",1,0,"S0","Emergencia"),S2=mk("push",1,4,"S2","Parada",{color:"Rojo",ct:"NC"}),S1=mk("push",1,6,"S1","Marcha",{color:"Verde",ct:"NA"}),H1=mk("pilot",1,8,"H1","Marcha",{color:"Verde",on:false}),H2=mk("pilot",1,10,"H2","Falla",{color:"Rojo",on:false}),
   XT=mk("term",1,13,"X1","T",{color:"Verde"}),XN=mk("term",1,14,"X2","N",{color:"Blanco"});
  s.items=[Q1,Q2,SV,KM,F1,S0,S2,S1,H1,H2,XT,XN];s.lc=Object.assign(JSON.parse(JSON.stringify(S&&S.lc?S.lc:TPL.casaVE().lc)),{sys:"3F"});
  s.walls=[motorWall({Q1,Q2,SV,KM,F1,S0,S2,S1,H1,H2})];s.wallI=0;s.view="wall";return s},
};
/* Pared de ejemplo ya cableada según norma: luz con interruptor, toma con TV y A/A a 240 V */
function demoWall(items){const W=blankWall("Sala"),P=W.items[0],at=(side,slot)=>items.find(b=>b.side===side&&b.slot===slot);
  const luz=at("L",0),tom=at("L",2),aa=at("R",4),it=(type,x,y,p={})=>{const o={id:uid++,type,x,y,p:Object.assign({},DEV[type].d,p,{name:p.name||""})};W.items.push(o);return o};
  const sw=it("inter",2.35,1.2,{name:"Interruptor sala"}),lz=it("luz",2.35,2.2,{name:"Luz sala"}),tc=it("toma",3.4,.3,{name:"Toma TV"}),ac=it("ac",4.7,2.3,{name:"A/A sala"});
  const wire=(a,b,color)=>W.wires.push({id:uid++,a,b,color,awg:"12"}),pb=(b,k)=>`${P.id}/b${b.id}.${k}`;
  if(luz){wire(pb(luz,0),`${sw.id}/COM`,"Negro");wire(`${sw.id}/L`,`${lz.id}/F`,"Rojo");wire(`${lz.id}/N`,`${P.id}/N${luz.slot}`,"Blanco")}
  if(tom){wire(pb(tom,0),`${tc.id}/F`,"Negro");wire(`${tc.id}/N`,`${P.id}/N${tom.slot}`,"Blanco");wire(`${tc.id}/T`,`${P.id}/G${tom.slot}`,"Verde")}
  if(aa&&aa.p.poles===2){wire(pb(aa,0),`${ac.id}/F1`,"Negro");wire(pb(aa,1),`${ac.id}/F2`,"Rojo");wire(`${ac.id}/T`,`${P.id}/G${aa.slot}`,"Verde")}
  return W}
/* Pared de ejemplo del arranque de bomba: potencia, mando con retención, paro de emergencia,
   supervisor de fases en serie, relé térmico y pilotos de marcha y falla */
function motorWall(k){const W=blankWall("Sala de bombas"),P=W.items[0];P.x=1.5;P.y=1.4;
  const m={id:uid++,type:"motor3",x:4.6,y:.32,p:{hp:"3 HP",name:"Bomba 3 HP"}};W.items.push(m);
  const c=(it,pin)=>`${P.id}/c${it.id}.${pin}`,b=(it,n)=>`${P.id}/b${it.id}.${n}`,wire=(a,z,color,awg="14")=>W.wires.push({id:uid++,a,b:z,color,awg});
  ["1","2","3"].forEach((n,j)=>{const col=["Negro","Rojo","Azul"][j];wire(b(k.Q1,j),c(k.KM,"L"+n),col,"12");wire(c(k.F1,"T"+n),`${m.id}/${["U","V","W"][j]}`,col,"12");wire(c(k.KM,"L"+n),c(k.SV,"L"+n),col,"12")});
  wire(`${m.id}/T`,`${P.id}/G0`,"Verde","12");
  wire(b(k.Q2,0),c(k.S0,"11"),"Rojo");wire(c(k.S0,"12"),c(k.S2,"11"),"Rojo");wire(c(k.S2,"12"),c(k.SV,"11"),"Rojo");wire(c(k.SV,"14"),c(k.S1,"13"),"Rojo");
  wire(c(k.S1,"14"),c(k.F1,"95"),"Rojo");wire(c(k.F1,"96"),c(k.KM,"A1"),"Rojo");wire(c(k.KM,"A2"),`${P.id}/N0`,"Blanco");
  wire(c(k.S1,"13"),c(k.KM,"13"),"Rojo");wire(c(k.S1,"14"),c(k.KM,"14"),"Rojo");
  wire(c(k.KM,"A1"),c(k.H1,"X1"),"Rojo");wire(c(k.H1,"X2"),c(k.KM,"A2"),"Blanco");
  wire(c(k.S0,"12"),c(k.F1,"97"),"Rojo");wire(c(k.F1,"98"),c(k.H2,"X1"),"Rojo");wire(c(k.H2,"X2"),c(k.H1,"X2"),"Blanco");
  return W}
/* Supervisor de voltaje con contactor general: la acometida entra al contactor; el supervisor mide
   las dos fases y su contacto 11-14 alimenta la bobina. Si el voltaje sale de rango, el contactor
   abre y corta toda la casa. Los circuitos salen de T1 y T2 del contactor. */
function supvWall(k,m1){const W=blankWall("Sala"),P=W.items[0];P.x=1.45;P.y=1.4;P.p.peine=false;
  const it=(type,x,y,p={})=>{const o={id:uid++,type,x,y,p:Object.assign({},DEV[type].d,p,{name:p.name||""})};W.items.push(o);return o};
  const su=it("supply",3.6,2.3,{}),lz=it("luz",4.6,2.2,{name:"Luz sala"}),tc=it("toma",4.8,.3,{name:"Toma TV"});
  const c=(x,pin)=>`${P.id}/c${x.id}.${pin}`,b=(x,n)=>`${P.id}/b${x.id}.${n}`,t=(x,n)=>`${P.id}/t${x.id}.${n}`,wire=(a,z,color,awg="12")=>W.wires.push({id:uid++,a,b:z,color,awg});
  /* potencia: acometida → contactor → breakers de los circuitos */
  wire(`${su.id}/L1`,c(k.KM,"L1"),"Negro","6");wire(`${su.id}/L2`,c(k.KM,"L2"),"Rojo","6");wire(`${su.id}/N`,`${P.id}/N0`,"Blanco","6");wire(`${su.id}/T`,`${P.id}/G0`,"Verde","8");
  wire(c(k.KM,"T1"),t(k.Q1,0),"Negro","10");wire(c(k.KM,"T2"),t(k.Q2,0),"Rojo","10");
  /* mando: breaker de 2 A → supervisor (mide L1-L2) → su contacto 11-14 → bobina de 240 V */
  if(m1){/* 220/230 V: el breaker de mando corta fase y neutro; supervisor y bobina van fase-neutro */
    wire(c(k.KM,"L1"),t(k.Q0,0),"Negro","14");wire(`${P.id}/N3`,t(k.Q0,1),"Blanco","14");
    wire(b(k.Q0,0),c(k.SV,"L"),"Negro","14");wire(b(k.Q0,1),c(k.SV,"N"),"Blanco","14");
    wire(b(k.Q0,0),c(k.SV,"11"),"Negro","14");wire(c(k.SV,"14"),c(k.KM,"A1"),"Negro","14");wire(c(k.KM,"A2"),b(k.Q0,1),"Blanco","14")}
  else{
  wire(c(k.KM,"L1"),t(k.Q0,0),"Negro","14");wire(c(k.KM,"L2"),t(k.Q0,1),"Rojo","14");
  wire(b(k.Q0,0),c(k.SV,"L1"),"Negro","14");wire(b(k.Q0,1),c(k.SV,"L2"),"Rojo","14");
  wire(b(k.Q0,0),c(k.SV,"11"),"Negro","14");wire(c(k.SV,"14"),c(k.KM,"A1"),"Negro","14");wire(c(k.KM,"A2"),b(k.Q0,1),"Rojo","14")}
  /* circuitos */
  wire(b(k.Q1,0),`${lz.id}/F`,"Negro");wire(`${lz.id}/N`,`${P.id}/N1`,"Blanco");
  wire(b(k.Q2,0),`${tc.id}/F`,"Rojo");wire(`${tc.id}/N`,`${P.id}/N2`,"Blanco");wire(`${tc.id}/T`,`${P.id}/G1`,"Verde");
  return W}
/* Segunda pared de ejemplo: luz de pasillo con dos interruptores de tres vías, alimentada desde el tablero */
function demoStairs(items){const W=blankWall("Pasillo (escalera)",false),b=items.find(x=>x.side==="R"&&x.slot===0)||items[0];if(!b)return W;
  const it=(type,x,y,p={})=>{const o={id:uid++,type,x,y,p:Object.assign({},DEV[type].d,p,{name:p.name||""})};W.items.push(o);return o};
  const fd=it("feed",.6,2.1,{brk:b.id,name:"Viene del tablero"}),a=it("inter3",1.3,1.2,{name:"Abajo",pos:1}),z=it("inter3",4.8,1.2,{name:"Arriba",pos:2}),lz=it("luz",3,2.2,{name:"Luz pasillo"});
  const wire=(x,y,color)=>W.wires.push({id:uid++,a:x,b:y,color,awg:"12"});
  wire(`${fd.id}/F1`,`${a.id}/COM`,"Negro");wire(`${a.id}/T1`,`${z.id}/T1`,"Amarillo");wire(`${a.id}/T2`,`${z.id}/T2`,"Amarillo");wire(`${z.id}/COM`,`${lz.id}/F`,"Rojo");wire(`${lz.id}/N`,`${fd.id}/N`,"Blanco");
  return W}
function save(){projSave()}
function syncUid(){uid=Math.max(0,...S.items.map(i=>i.id),...S.lc.items.map(i=>i.id),...S.lc.aux.map(i=>i.id),...S.ext.map(i=>i.id),...S.walls.flatMap(w=>w.items.map(i=>i.id)),...S.walls.flatMap(w=>w.wires.map(i=>i.id)))+1}
function normalize(v){if(!v||typeof v!=="object")return null;const b=blankAll();
  if(!v.kind)v.kind="din";v.project=Object.assign(b.project,v.project||{});if(!v.board)v.board=b.board;if(!Array.isArray(v.items))v.items=[];
  if(v.lc&&!Array.isArray(v.lc.aux))v.lc.aux=[];if(v.lc)v.lc.aux=v.lc.aux.filter(i=>i&&CAT[i.type]&&i.p&&Number.isInteger(i.x)&&Number.isInteger(i.id));
  v.ext=Array.isArray(v.ext)?v.ext.filter(x=>x&&EXT[x.type]&&x.p&&Number.isInteger(x.id)):[];
  v.quote=Object.assign(defQuote(),v.quote||{});v.view=v.view==="wall"?"wall":"board";
  const okW=w=>w&&w.w>0&&w.h>0&&Array.isArray(w.items)&&Array.isArray(w.wires)&&w.items.every(i=>DEV[i.type]&&Number.isInteger(i.id)&&i.p);
  let walls=Array.isArray(v.walls)?v.walls.filter(okW):[];if(!walls.length&&okW(v.wall))walls=[v.wall];if(Object.prototype.propertyIsEnumerable.call(v,"wall"))delete v.wall;
  if(!walls.length){uid=Math.max(uid,1+Math.max(0,...v.items.map(i=>+i.id||0),...((v.lc&&v.lc.items)||[]).map(i=>+i.id||0),...v.ext.map(i=>+i.id||0)));
    walls=Array.isArray(v.lc&&v.lc.items)?[demoWall(v.lc.items),demoStairs(v.lc.items)]:[blankWall()]}
  walls.forEach((w,k)=>{if(!w.name)w.name="Pared "+(k+1);if(w.tube==null)w.tube=true;if(!Array.isArray(w.tubes))w.tubes=[];w.tubes=w.tubes.filter(t=>t&&Array.isArray(t.pts)&&t.pts.length>1)});v.walls=walls;if(!(Number.isInteger(v.wallI)&&v.wallI<walls.length))v.wallI=0;linkWall(v);
  if(!v.lc)v.lc=TPL.casaVE().lc;
  const okDin=Number.isInteger(v.board.rows)&&Number.isInteger(v.board.mods)&&v.items.every(i=>CAT[i.type]&&i.p&&Number.isInteger(i.row)&&Number.isInteger(i.x));
  const okLc=SPACES.includes(v.lc.spaces)&&Array.isArray(v.lc.items)&&v.lc.items.every(i=>i.p&&(i.side==="L"||i.side==="R")&&Number.isInteger(i.slot));
  return okDin&&okLc?v:null}
function load(){if(projLoad())return;
  S=linkWall(blankAll());freshStart=true;
  try{const o=localStorage.getItem(OLDKEY);if(o){const v=JSON.parse(o);if(v&&v.board&&Array.isArray(v.items)&&v.items.every(i=>CAT[i.type])){S.board=v.board;S.items=v.items}}}catch(e){}
  syncUid();projSave()}
function mutate(fn){const before=JSON.stringify(S);const r=fn();if(r===false)return false;hist.push(before);if(hist.length>100)hist.shift();fut=[];save();renderAll();return true}
function undo(){if(!hist.length)return;fut.push(JSON.stringify(S));const k=S.kind;S=linkWall(JSON.parse(hist.pop()));fixSel();save();renderAll();if(k!==S.kind){renderLib();fit()}}
function redo(){if(!fut.length)return;hist.push(JSON.stringify(S));const k=S.kind;S=linkWall(JSON.parse(fut.pop()));fixSel();save();renderAll();if(k!==S.kind){renderLib();fit()}}
const curItems=()=>S.kind==="lc"?S.lc.items:S.items;
const selItem=()=>curItems().find(i=>i.id===sel)||S.ext.find(i=>i.id===sel)||(S.kind==="lc"&&S.lc.aux.find(i=>i.id===sel))||undefined;
const selAux=()=>S.kind==="lc"?S.lc.aux.find(i=>i.id===sel):undefined;
const selExt=()=>S.ext.find(i=>i.id===sel);
function fixSel(){if(sel&&!selItem())sel=null;if(activeRow>=S.board.rows)activeRow=0}

/* ---------- DIN placement ---------- */
const cap=()=>S.board.mods*2;
function fits(row,x,u,ign,items=S.items,c=cap(),rows=S.board.rows){if(row<0||row>=rows||x<0||x+u>c)return false;return !items.some(i=>i.id!==ign&&i.row===row&&x<i.x+units(i)&&i.x<x+u)}
function nearest(row,x,u,ign){const c=cap();for(let d=0;d<=c;d++){for(const t of [x-d,x+d])if(fits(row,t,u,ign))return t}return null}
function firstFree(u,pref,ign){const rows=S.board.rows;for(let k=0;k<rows;k++){const r=(pref+k)%rows;for(let x=0;x+u<=cap();x++)if(fits(r,x,u,ign))return{row:r,x}}return null}
function nextDes(type){const pre=CAT[type].pre;if(!pre)return"";let m=0;for(const i of [...S.items,...S.lc.aux]){const d=String(i.p.des||"");if(d.startsWith(pre)&&/^\d+$/.test(d.slice(pre.length))){const n=parseInt(d.slice(pre.length),10);if(n>m)m=n}}return pre+(m+1)}
/* ---------- load-center placement ---------- */
function lfits(side,slot,n,ign,items=S.lc.items,rows=lcRows(),sys=S.lc.sys){if(n===3&&sys==="1F")return false;if(slot<0||slot+n>rows)return false;return !items.some(b=>b.id!==ign&&b.side===side&&slot<b.slot+b.p.poles&&b.slot<slot+n)}
function lnearest(side,slot,n,ign){for(let d=0;d<=lcRows();d++)for(const t of [slot-d,slot+d])if(lfits(side,t,n,ign))return t;return null}
function lfirstFree(n,ign){for(let s=0;s<lcRows();s++)for(const side of ["L","R"])if(lfits(side,s,n,ign))return{side,slot:s};return null}
