/* =====================================================================
   wall.js — Vista "Pared": ubicar el tablero y los puntos eléctricos
   sobre paredes a escala, cablearlos y probarlos con el simulador.
   Coordenadas del modelo en metros (x desde la izquierda, y = altura
   del centro desde el piso). Los dispositivos se dibujan más grandes
   que su tamaño real para poder cablearlos con comodidad.
   Un proyecto puede tener varias paredes (S.walls); S.wall es la activa.
   ===================================================================== */
const WK=220, WM={l:78,t:40,r:40,b:90}, PANEL_W=260;
const WCOL={Negro:"#1f2224",Rojo:"#c8322a",Azul:"#2f6fd0",Amarillo:"#e8c22c",Blanco:"#f4f4f0",Verde:"#2f9e44"};
const AWG_W={"14":3,"12":3.6,"10":4.3,"8":5,"6":5.8};
const APPL120={"Nada":0,"Cargador de teléfono":20,"Televisor":150,"Freezer pequeño":150,"Licuadora":600,"Nevera":700,"Freidora de aire":1500,"Plancha":1200,"Microondas":1500,"Secador de pelo":1800,"Plancha y microondas juntos":2700};
const APPL240={"Nada":0,"Secadora de ropa":5000,"Cocina eléctrica":8000};
const FINISH=["Frisado y pintado","Bloque sin frisar","Cerámica"];
const STD_H=[[0.30,"Tomas · 0,30 m"],[1.20,"Interruptores · 1,20 m"],[1.60,"Tablero · 1,60 m"],[2.20,"Apliques y A/A · 2,20 m"]];
const T3=[["F1","F","F1"],["F2","F","F2"],["T","T","T"]];
/* Equipos en línea: entrada (E) y salida (S) */
const PT=[["IF","F","E·F"],["IN","N","E·N"],["OF","F","S·F"],["ON","N","S·N"],["T","T","T"]];
const devPrice=(d,p)=>typeof d.price==="function"?d.price(Object.assign({},d.d,p)):d.price;
const devQn=(d,p)=>typeof d.qn==="function"?d.qn(Object.assign({},d.d,p)):d.qn;
const DEV={
 panel:{n:"Tablero",short:"Tablero",std:1.6},
 supply:{n:"Acometida (entrada de líneas)",short:"Acometida",w:132,h:96,terms:[["L1","F","L1"],["L2","F","L2"],["L3","F","L3"],["N","N","N"],["T","T","T"]],d:{},std:2.15,
  tip:"Es la llegada de la compañía eléctrica. Lleva L1, L2 (y L3) a la entrada del principal, el neutro a la barra N y la tierra a la barra T. Con la acometida en la pared, el tablero solo tiene corriente si su entrada está cableada."},
 feed:{n:"Llegada de circuito",short:"Llegada",qn:"Caja de paso 4×4 con tapa",w:64,h:64,terms:[["F1","F","F1"],["F2","F","F2"],["N","N","N"],["T","T","T"]],d:{brk:null},price:3,std:2.1,
  tip:"Representa los cables que vienen del tablero por la tubería. Úsala en las paredes donde no está el tablero."},
 toma:{n:"Tomacorriente doble 120 V",short:"Toma 120 V",qn:"Tomacorriente doble 15 A 120 V con caja",w:46,h:76,V:120,terms:[["F","F","F"],["N","N","N"],["T","T","T"]],d:{carga:"Televisor"},f:[["carga","Aparato enchufado",Object.keys(APPL120)]],W:p=>APPL120[p.carga]||0,price:4.5,std:.3},
 toma240:{n:"Toma 240 V",short:"Toma 240 V",qn:"Tomacorriente 30 A 240 V con caja",w:52,h:76,V:240,terms:T3,d:{carga:"Secadora de ropa"},f:[["carga","Aparato enchufado",Object.keys(APPL240)]],W:p=>APPL240[p.carga]||0,price:9,std:.3},
 inter:{n:"Interruptor sencillo",short:"Interruptor",qn:"Interruptor sencillo 15 A con caja",w:44,h:72,terms:[["COM","S","C"],["L","S","R"]],d:{on:true},price:3.5,std:1.2},
 inter3:{n:"Interruptor de tres vías (escalera)",short:"Tres vías",qn:"Interruptor de tres vías 15 A con caja",w:44,h:72,terms:[["COM","S","C"],["T1","S","1"],["T2","S","2"]],d:{pos:1},f:[["pos","Posición",[1,2]]],price:6,std:1.2,
  tip:"Con dos de estos prendes y apagas la misma luz desde dos sitios. Fase al común (C) del primero, los viajeros 1 y 2 entre los dos interruptores, y del común del segundo al bombillo."},
 luz:{n:"Bombillo / aplique",short:"Bombillo",qn:"Aplique de pared con bombillo",w:56,h:64,V:120,terms:[["F","F","F"],["N","N","N"]],d:{W:60},f:[["W","Potencia (W)",[12,60,100]]],W:p=>p.W,price:6,std:2.2},
 estabw:{n:"Estabilizador de voltaje",short:"Estabilizador",ext:"estab",sc:.6,w:90,h:114,pass:true,terms:PT,d:{kva:2,on:true},f:[["kva","Capacidad (kVA)",[1,2,3,5]]],std:1,
  qn:p=>EXT.estab.desc({kva:p.kva,sys:"Monofásico 120V"}),price:p=>Math.round(EXT.estab.price({kva:p.kva,sys:"Monofásico 120V"})),
  tip:"Va entre el tomacorriente y el equipo: entra la línea por E·F y E·N, y el equipo se conecta en S·F y S·N. Corrige el voltaje cuando baja o sube."},
 protw:{n:"Protector de voltaje enchufable",short:"Protector",w:50,h:76,pass:true,terms:PT,d:{on:true},std:.3,qn:"Protector de voltaje enchufable 120 V",price:25,
  tip:"Corta la corriente si el voltaje sube o baja demasiado y la devuelve después de un retardo. Ideal para neveras, aires y bombas."},
 upsw:{n:"UPS",short:"UPS",ext:"ups",sc:.6,w:66,h:120,pass:true,battery:true,cap:p=>Math.round(p.kva*600),terms:PT,d:{kva:1.5,on:true},f:[["kva","Capacidad (kVA)",[1,1.5,2,3]]],std:.35,
  qn:p=>EXT.ups.desc({kva:p.kva,kind:"Interactiva"}),price:p=>Math.round(EXT.ups.price({kva:p.kva,kind:"Interactiva"})),
  tip:"Si se va la luz sigue alimentando por unos minutos lo que tenga en su salida. Para computadoras, router, cámaras y punto de venta."},
 invw:{n:"Inversor con baterías",short:"Inversor",ext:"inv",sc:.6,w:120,h:114,pass:true,battery:true,cap:p=>p.kw*1000,terms:PT,d:{kw:3,bat:4,on:true},f:[["kw","Potencia (kW)",[1,3,5]],["bat","Baterías 12 V 200 Ah",[2,4]]],std:.6,
  qn:p=>EXT.inv.desc({kw:p.kw,bat:p.bat}),price:p=>Math.round(EXT.inv.price({kw:p.kw,bat:p.bat})),
  tip:"Respaldo para los apagones: con luz deja pasar la corriente y carga las baterías; sin luz alimenta su salida desde las baterías."},
 ac:{n:"Aire acondicionado split",short:"A/A split",w:190,h:66,V:240,terms:T3,d:{btu:"18.000 BTU"},f:[["btu","Capacidad",["12.000 BTU","18.000 BTU","24.000 BTU"]]],W:p=>({"12.000 BTU":1300,"18.000 BTU":2000,"24.000 BTU":2600})[p.btu],std:2.3},
 heater:{n:"Calentador de agua",short:"Calentador",w:76,h:130,V:240,terms:T3,d:{W:4500},f:[["W","Potencia (W)",[3000,4500,5500]]],W:p=>p.W,std:1.6},
 pump:{n:"Bomba de agua 240 V",short:"Bomba",w:100,h:66,V:240,terms:T3,d:{hp:"1 HP"},f:[["hp","Potencia",["1/2 HP","1 HP","2 HP"]]],W:p=>({"1/2 HP":600,"1 HP":1100,"2 HP":2100})[p.hp],std:.25},
};
/* Estabilizador bifásico (autotransformador): entra L1-L2-N y entrega 110 V y 220 V con neutro común */
DEV.estab2={n:"Estabilizador bifásico 110/220 V",short:"Estabilizador",w:150,h:150,terms:[["IL1","F","E·L1"],["IL2","F","E·L2"],["IN","N","E·N"],["T","T","T"],["O110","F","S·110"],["O220","F","S·220"],["ON","N","S·N"]],
  d:{kva:10,brkE:"Encendido",brkB:"Apagado",on:true},f:[["kva","Capacidad (kVA)",[3,5,8,10,15]],["brkE","Breaker Estabilizador",["Encendido","Apagado"]],["brkB","Breaker Bypass",["Apagado","Encendido"]]],price:p=>({3:220,5:350,8:480,10:600,15:900})[p.kva]||600,
  qn:p=>`Estabilizador automático ${p.kva} kVA, entrada bifásica, salidas 110 V y 220 V`,std:1.1,
  tip:"Entrada: L1, L2 y neutro de la red. Salidas: S·110 (110 V a neutro), S·220 (220 V a neutro) y S·N (neutro común). Regula de 160 a 270 V de entrada; cuando baja la luz entrega lo mismo pero su capacidad baja y toma más corriente. Breaker Estabilizador: funcionamiento normal. Breaker Bypass: la red pasa directo sin regular (S·110 = L1, S·220 = L2); nunca los dos encendidos. Tócalos en el dibujo para cambiarlos."};
/* Sub-tablero: caja con barras L1, L2, N y T y hasta 8 módulos de breakers 1P o 2P */
const SUBT_OPTS=["—","1P 10A","1P 16A","1P 20A","1P 25A","1P 32A","2P 16A","2P 20A","2P 25A","2P 32A","2P 40A","2P 50A","2P 63A"];
function subtBrks(p){const out=[];let slot=0;for(let i=1;i<=6;i++){const m=/^(\d)P (\d+)A$/.exec(p["b"+i]||"");if(!m)continue;const poles=+m[1],In=+m[2];if(slot+poles>8)break;out.push({i,poles,In,name:p["n"+i]||"",slot,on:p["on"+i]!==false});slot+=poles}return out}
const subtBar=slot=>slot%2?"L2":"L1";
DEV.subt={n:"Sub-tablero de breakers",short:"Sub-tablero",w:200,h:150,terms:[["L1","F","L1"],["L2","F","L2"],["N","N","N"],["T","T","T"]],
  d:{puente:"No",b1:"2P 20A",n1:"",b2:"—",n2:"",b3:"—",n3:"",b4:"—",n4:"",b5:"—",n5:"",b6:"—",n6:""},
  f:[["puente","Puente entre barras L1 y L2",["No","Sí"]],...[1,2,3,4,5,6].flatMap(i=>[["b"+i,"Breaker "+i,SUBT_OPTS],["n"+i,"Qué alimenta el "+i,"text"]])],
  price:p=>12+subtBrks(p).reduce((a,b)=>a+PRICE_DIN.mcb({poles:b.poles,In:b.In,kA:6}),0),
  qn:p=>`Sub-tablero superficial 8 módulos con ${subtBrks(p).map(b=>`breaker ${b.poles}P ${b.In}A`).join(", ")||"sin breakers"}`,std:1.6,
  tip:"Entrada por arriba: L1, L2, neutro y tierra. Cada breaker toma la barra de su posición (L1, L2, L1…); los de 2 polos toman L1 y L2. Con el puente, las dos barras quedan unidas (todo a 110 V)."};
const LIB_WALL=[["Alimentación",["panel","supply","feed","subt"]],["Protección y respaldo",["estab2","estabw","protw","upsw","invw"]],["Puntos eléctricos",["toma","toma240","inter","inter3","luz"]],["Aparatos para probar",["ac","heater","pump"]]];
const WALL_DEFS=`<pattern id="pBlk" width="88" height="44" patternUnits="userSpaceOnUse"><rect width="88" height="44" fill="#b9b6ae"/><path d="M0 0.5H88M0 22.5H88M0.5 0V22M44.5 22V44" stroke="#9a978f" stroke-width="2"/></pattern>
<pattern id="pTile" width="66" height="66" patternUnits="userSpaceOnUse"><rect width="66" height="66" fill="#f3f4f1"/><path d="M0 0.5H66M0.5 0V66" stroke="#cfd3d0" stroke-width="1.5"/></pattern>
<linearGradient id="gMot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d6d82"/><stop offset=".22" stop-color="#8fb0c4"/><stop offset=".55" stop-color="#5d7f96"/><stop offset="1" stop-color="#36505f"/></linearGradient><linearGradient id="gMotF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f5b6c"/><stop offset=".22" stop-color="#7393a7"/><stop offset=".55" stop-color="#4d6d82"/><stop offset="1" stop-color="#2c4350"/></linearGradient><linearGradient id="gPump" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2556a3"/><stop offset=".22" stop-color="#5c95e6"/><stop offset=".55" stop-color="#2f6fd0"/><stop offset="1" stop-color="#1c4686"/></linearGradient><radialGradient id="gGlow"><stop offset="0" stop-color="#fff3b0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffd84d" stop-opacity=".35"/><stop offset="1" stop-color="#ffd84d" stop-opacity="0"/></radialGradient>`;

let wallMode="move",wColor="Auto",wAwg="12",pending=null,wdrag=null,reconn=null,wireDrag=null,leverPress=null;
const simState={running:false,blackout:false,trip:new Set(),burnt:new Set(),res:null,log:[],sparks:[],timer:null,ctl:[],pressed:new Set(),forced:new Set(),tm:{},ctlT:null};
let compPress=null,tapTol=6;
const wallEl=$("wall");
/* con el dedo la mano tiembla más que con el mouse: un toque no debe convertirse en arrastre */
wallEl.addEventListener("pointerdown",e=>{tapTol=e.pointerType==="mouse"?6:16},true);

function blankWall(name="Pared 1",withPanel=true){return{name,w:6,h:2.7,finish:FINISH[0],tube:true,items:withPanel?[{id:uid++,type:"panel",x:1,y:1.6,p:{name:""}}]:[],wires:[],tubes:[]}}
/* S.wall apunta siempre a la pared activa, sin duplicarse al guardar */
function linkWall(v){if(Object.prototype.propertyIsEnumerable.call(v,"wall")){const w=v.wall;delete v.wall;if(w){if(!w.name)w.name="Pared 1";v.walls=[w];v.wallI=0}}
  if(!Array.isArray(v.walls)||!v.walls.length)v.walls=[blankWall()];if(!(v.wallI>=0&&v.wallI<v.walls.length))v.wallI=0;
  Object.defineProperty(v,"wall",{get(){return this.walls[this.wallI]},enumerable:false,configurable:true});return v}
function wallDims(){const ww=S.wall.w*WK,wh=S.wall.h*WK;return{Wd:WM.l+ww+WM.r,H:WM.t+wh+WM.b,ww,wh}}
const toPx=(x,y,wl=S.wall)=>[WM.l+x*WK,WM.t+wl.h*WK-y*WK];
const fromPx=(px,py)=>[(px-WM.l)/WK,(WM.t+S.wall.h*WK-py)/WK];
const fmtM2=m=>fmtNum(m,2)+" m";
function itemSize(it){if(it.type==="panel"){const g=panelGeom(it);return{w:g.w,h:g.h,s:g.s}}const d=DEV[it.type];return{w:d.w,h:d.h}}

/* ---------- terminals ---------- */
function itemTerms(it,wl=S.wall){const [cx,cy]=toPx(it.x,it.y,wl),out=[];
  if(it.type==="panel"){const g=panelGeom(it,wl);
    for(const sr of g.srcs)for(const t of sr.terms)out.push({id:`${it.id}/b${sr.id}.${t.k}`,key:`b${sr.id}.${t.k}`,role:"F",src:true,srcId:sr.id,pole:t.k,x:t.x,y:t.y,label:""});
    g.N.forEach((q,k)=>out.push({id:`${it.id}/N${k}`,key:"N"+k,role:"N",bar:true,x:q.x,y:q.y,label:""}));
    g.G.forEach((q,k)=>out.push({id:`${it.id}/G${k}`,key:"G"+k,role:"T",bar:true,x:q.x,y:q.y,label:""}));
    g.X.forEach(x=>out.push({id:`${it.id}/X${x.id}`,key:"X"+x.id,role:bornRole(x.color),born:x,x:x.x,y:x.y,label:""}));
    g.M.forEach((q,k)=>out.push({id:`${it.id}/M${k}`,key:"M"+k,role:"F",mainIn:k,x:q.x,y:q.y,label:""}));
    for(const sr of g.srcs)for(const t of sr.top||[])out.push({id:`${it.id}/t${sr.id}.${t.k}`,key:`t${sr.id}.${t.k}`,role:"F",lineOf:sr.id,pole:t.k,x:t.x,y:t.y,label:""});
    for(const c of g.ctl)for(const q of c.pins)out.push({id:`${it.id}/c${c.id}.${q.k}`,key:`c${c.id}.${q.k}`,role:q.role,ctlOf:c.id,pin:q.k,x:q.x,y:q.y,label:""});
    return out}
  if(it.type==="subt"){const d=DEV.subt;[[-70,"L1"],[-46,"L2"],[46,"N"],[70,"T"]].forEach(([dx,k])=>{const t=d.terms.find(x=>x[0]===k);out.push({id:`${it.id}/${k}`,key:k,role:t[1],label:t[2],x:cx+dx,y:cy-d.h/2-11})});
    for(const b of subtBrks(it.p))for(let j=0;j<b.poles;j++)out.push({id:`${it.id}/Q${b.i}.${j}`,key:`Q${b.i}.${j}`,role:"F",label:`${b.name||"Q"+b.i}${b.poles>1?" polo "+(j+1):""}`,x:cx-88+(b.slot+j)*22+11,y:cy+d.h/2+11});return out}
  const d=DEV[it.type],tl=it.type==="supply"&&S.lc.sys!=="3F"?d.terms.filter(t=>t[0]!=="L3"):d.terms,n=tl.length,sp=18;
  tl.forEach(([key,role,label],i)=>out.push({id:`${it.id}/${key}`,key,role,label,src:(it.type==="feed"||it.type==="supply")&&role==="F",x:cx+(i-(n-1)/2)*sp,y:cy+d.h/2+11}));return out}
function allTerms(wl=S.wall){const m=new Map();for(const it of wl.items)for(const t of itemTerms(it,wl))m.set(t.id,Object.assign(t,{item:it}));return m}
function termName(t){if(!t)return"?";const it=t.item;if(it.type==="panel"){if(t.srcId!=null){const sr=srcById(t.srcId);return sr?`Tablero ${sr.short}${sr.poles>1?" polo "+(t.pole+1):""}`:"Tablero"}if(t.born)return`Bornera ${t.born.des}`;if(t.ctlOf!=null){const d=S.items.find(i=>i.id===t.ctlOf);return d?`Tablero ${d.p.des||CAT[d.type].n} ${pinRole(d.type,t.pin)}`:"Tablero"}if(t.mainIn!=null)return`Entrada del principal L${t.mainIn+1}`;if(t.lineOf!=null){const sr=srcById(t.lineOf);return`Entrada de ${sr?sr.short:"la protección"}${sr&&sr.poles>1?" polo "+(t.pole+1):""}`}return t.role==="N"?"Barra de neutro":"Barra de tierra"}return`${devLabel(it)} (${t.label})`}
/* Cable que va de un borne a otro del mismo tablero (puente interno): no lleva tubo */
const innerWire=(w,terms)=>{const a=terms.get(w.a),b=terms.get(w.b);return!!a&&!!b&&a.item===b.item&&a.item.type==="panel"};
function compHint(d){const run=simState.running;
  if(d.type==="push")return run?"mantenlo presionado para accionarlo":"durante la prueba, mantenlo presionado; arrastra para sacar un cable";
  if(d.type==="emerg")return run?"toca para enclavarlo o liberarlo":"toca para seleccionar; arrastra para sacar un cable";
  if(d.type==="selector")return run?"toca para cambiar de posición":"toca para seleccionar; arrastra para sacar un cable";
  if(d.type==="ovl"&&simState.trip.has("o"+d.id))return"disparado: toca para rearmarlo";
  return"toca para seleccionar; arrastra para sacar un cable desde el borne más cercano"}
function wireEnds(w,terms){return`${termName(terms.get(w.a))} → ${termName(terms.get(w.b))}`}
function wirePath(w,i,terms,wl=S.wall){const r=routesFor(wl,terms).get(w.id);if(r)return r;const a=terms.get(w.a),b=terms.get(w.b),ym=(a.y+b.y)/2;return pathFrom([[a.x,a.y],[a.x,ym],[b.x,ym],[b.x,b.y]])}
function wallWireMeters(wl=S.wall){const terms=allTerms(wl),m=new Map();wl.wires.forEach((w,i)=>{if(!terms.has(w.a)||!terms.has(w.b))return;const k=w.awg+"|"+w.color;m.set(k,(m.get(k)||0)+wirePath(w,i,terms,wl).len/WK)});return m}
const tubeMeters=(wl=S.wall)=>Object.values(tubeBySize(wl)).reduce((a,b)=>a+b,0);
function autoColor(ta,tb){const sp=[ta,tb].find(t=>t.item&&t.item.type==="supply"&&t.role==="F");if(sp)return{L1:"Negro",L2:"Rojo",L3:"Azul"}[sp.key]||"Negro";const r=[ta.role,tb.role];if(r.includes("T"))return"Verde";if(r.includes("N"))return"Blanco";
  if(ta.role==="S"&&tb.role==="S")return"Amarillo";if(r.includes("S"))return(ta.src||tb.src)?"Negro":"Rojo";return"Negro"}

/* ---------- device drawings (origin = center) ---------- */
function drawDev(type,p,st){const on=st&&(st.s==="on"||st.s==="weak"),burnt=st&&st.s==="burnt";let s="";
  switch(type){
  case"toma":{s=box(-23,-38,46,76,"#f7f7f3",{rx:6,s:"#b9bab4"})+screw(0,0,2.6);
    for(const y of [-18,18])s+=R(-15,y-12,30,26,"#000",{rx:8,op:.12})+R(-15,y-13,30,26,"#efefea",{rx:8,s:"#c4c5bf"})+R(-13,y-12,26,2,"#fff",{rx:1,op:.8})+R(-8,y-8,3,10,"url(#gHole)",{rx:1})+R(5,y-7,3,8,"url(#gHole)",{rx:1})+`<path d="M-2.5 ${y+9}v-2.5a2.5 2.5 0 0 1 5 0v2.5z" fill="#1b1e20"/>`;
    if(p.carga&&p.carga!=="Nada")s+=R(-9,10,20,18,"#000",{rx:4,op:.3})+R(-10,8,20,18,"url(#gBkS)",{rx:4})+`<path d="M10 17 q22 0 24 26" fill="none" stroke="#2b2e31" stroke-width="3"/>`;break}
  case"toma240":{s=box(-26,-38,52,76,"#f7f7f3",{rx:6,s:"#b9bab4"})+C(0,-5,18,"#000",{op:.1})+C(0,-6,18,"#efefea",{s:"#c4c5bf"})+R(-12,-15,4,12,"url(#gHole)",{rx:1})+R(8,-15,4,12,"url(#gHole)",{rx:1})+R(-2,1,4,10,"url(#gHole)",{rx:1})+T(0,28,"240 V",{fs:7,fw:400});
    if(p.carga&&p.carga!=="Nada")s+=R(-14,-19,30,30,"#000",{rx:6,op:.3})+R(-15,-21,30,30,"url(#gBkS)",{rx:6})+`<path d="M15 -6 q24 0 26 40" fill="none" stroke="#2b2e31" stroke-width="4"/>`;break}
  case"inter":case"inter3":{const up=type==="inter"?p.on:p.pos!==2;s=box(-22,-36,44,72,"#f7f7f3",{rx:6,s:"#b9bab4"})+R(-12,-23,24,46,"#e9e9e4",{rx:4,s:"#c4c5bf"})+R(-12,-23,24,46,"url(#gWin)",{rx:4,op:.4})+R(-8,-19,18,40,"#000",{rx:3,op:.18})+R(-9,-20,18,40,"#fbfbf8",{rx:3,s:"#c9cac4"})+R(-9,up?-20:0,18,20,"#dcdcd6",{rx:3})+R(-8,up?-19:1,16,1.6,"#fff",{rx:.8})+R(-8,up?-1:18,16,1.4,"#000",{rx:.7,op:.12});
    s+=type==="inter"?T(0,up?-26:31,up?"ON":"OFF",{fs:6.5,c:"#6a6f72"}):T(0,up?-26:31,"3V · "+(up?"1":"2"),{fs:6.5,c:"#6a6f72"});break}
  case"supply":{const tri=S.lc.sys==="3F";s=box(-66,-48,132,96,"#a7aeb2",{rx:5,s:"#5f676c",sw:1.5})+box(-58,-40,116,80,"#c3c9cc",{rx:3,s:"#7d858a",so:.12})+T(0,-26,"ACOMETIDA",{fs:9,ff:SANS,fw:700,c:"#1d2326"})+scr(-30,-18,60,22,"#a9bb94")+T(0,-3,"kWh",{fs:9,c:"#1c2615"});
    s+=T(0,18,tri?"208Y/120 V · 3F 4 hilos":"120/240 V · 1F 3 hilos",{fs:7,fw:400,c:"#1d2326"})+T(0,30,"60 Hz",{fs:7,fw:400,c:"#3a4044"});if(st&&st.s==="off")s+=R(-66,-48,132,96,"#2b1d10",{rx:5,op:.35});break}
  case"feed":{s=box(-32,-32,64,64,"#9aa1a6",{rx:4,s:"#6d757a"})+box(-26,-26,52,52,"#b9bfc2",{rx:3,s:"#868e92",so:.12});for(const [x,y] of [[-20,-20],[20,-20],[-20,20],[20,20]])s+=screw(x,y,3.5);
    const b=srcById(p.brk);s+=T(0,0,b?cutText(b.short,6):"—",{fs:11,c:"#1d2326"})+T(0,12,b?b.In+" A":"elige",{fs:6.5,fw:400,c:"#2a2e31"});break}
  case"estabw":case"upsw":case"invw":{const d=DEV[type],e=EXT[d.ext],ep=Object.assign({},e.d,p,{sys:"Monofásico 120V",kind:"Interactiva",on:st?["on","bat","idle"].includes(st.s):p.on!==false});
    const W=e.w(ep),H=e.h(ep);s=`<g transform="scale(${d.sc}) translate(${-W/2} ${-H/2})">${DRAWX[d.ext](ep,W,H)}</g>`;break}
  case"protw":{const ok=st?st.s==="on":p.on!==false;s=box(-25,-38,50,76,"#f4f4f0",{rx:10,s:"#b9bab4"})+scr(-17,-30,34,17,"#0d1a10")+T(0,-17.5,st?(ok?"120":"---"):"120",{fs:10,c:"#5cff7a"});
    s+=led(-10,-4,2.4,"#3bd16b",ok,"#24452f")+led(10,-4,2.4,"#ff3b30",!ok,"#5a1f1f")+R(-15,5,30,26,"#000",{rx:8,op:.12})+R(-15,4,30,26,"#efefea",{rx:8,s:"#c4c5bf"})+R(-8,9,3,10,"url(#gHole)",{rx:1})+R(5,10,3,8,"url(#gHole)",{rx:1})+`<path d="M-2.5 26v-2.5a2.5 2.5 0 0 1 5 0v2.5z" fill="#1b1e20"/>`;break}
  case"estab2":{const ok=st?st.s==="on":p.on!==false;s=box(-75,-75,150,150,"#e6e7e3",{rx:8,s:"#8d918d"})+R(-75,-75,150,26,"url(#gBkS)",{rx:8})+R(-75,-55,150,6,"#1b1d1f")+T(0,-58,"ESTABILIZADOR",{fs:8.5,c:"#fff",ff:SANS,fw:700});
    s+=scr(-62,-40,58,26,"#0d1a10",{rx:3})+T(-33,-22,st?(ok?"240":"---"):"240",{fs:13,c:"#5cff7a"})+T(-33,-6,"ENTRADA",{fs:5.5,fw:400});
    s+=scr(6,-40,56,26,"#0d1a10",{rx:3})+T(34,-30,ok||!st?"110 V":"---",{fs:8,c:"#5cff7a"})+T(34,-19,ok||!st?"220 V":"---",{fs:8,c:"#5cff7a"})+T(34,-6,"SALIDAS",{fs:5.5,fw:400});
    s+=led(-52,8,3.4,"#3bd16b",ok,"#24452f")+T(-45,10.5,"NORMAL",{fs:5.5,a:"start",fw:400})+led(14,8,3.4,"#ffc533",st&&!ok,"#5a4a1d")+T(21,10.5,"FALLA",{fs:5.5,a:"start",fw:400});
    /* dos breakers: Estabilizador (normal) y Bypass; se tocan para cambiarlos */
    [["E",-48,"ESTAB.",p.brkE!=="Apagado"&&!(st&&st.tripE)],["B",14,"BYPASS",p.brkB==="Encendido"]].forEach(([k,x,lab,on])=>{s+=`<g class="wsb" data-b="${k}" style="cursor:pointer">`+box(x,20,34,30,"url(#gB)",{rx:3,s:"#9a9e99",so:.15})+R(x+11,23,12,24,"url(#gHole)",{rx:2})+R(x+12,on?24:34,10,12,"url(#gLv)",{rx:2})+R(x+13,on?25:44,8,2,on?"#9aa1a6":"#2a2e31",{rx:1})+flag(x+26,24,5,8,on)+T(x+17,58,lab,{fs:5.5,fw:700})+"</g>"});
    if(st&&st.tripE)s+=T(-31,68,"DISPARADO",{fs:5.5,c:"#e0302a",fw:700});s+=T(14+17,68,p.kva+" kVA",{fs:7,fw:700});break}
  case"subt":{s=box(-100,-75,200,150,"#cfd3d0",{rx:6,s:"#7d827c"})+box(-94,-58,188,120,"#e4e6e3",{rx:3,s:"#a9ada8",so:.1})+T(0,-63,cutText((p.name||"Sub-tablero").toUpperCase(),28),{fs:7.5,ff:SANS,fw:700});
    s+=R(-96,-6,192,10,"url(#gR)",{rx:2,s:"#8b9397",sw:.6});
    [[-70,"L1"],[-46,"L2"],[46,"N"],[70,"T"]].forEach(([x,k])=>s+=T(x,-66,k,{fs:6.5,fw:700,c:k==="N"?"#3a4044":k==="T"?"#2f9e44":"#1d2326"}));
    if(p.puente==="Sí")s+=`<path d="M-70 -78v6h24v-6" fill="none" stroke="#e8c22c" stroke-width="3"/>`+T(-58,-52,"PUENTE",{fs:5.5,c:"#a07d10",fw:700});
    const bs=subtBrks(p);if(!bs.length)s+=T(0,30,"Sin breakers: elígelos en Propiedades",{fs:6.5,fw:400,c:"#5b6266"});
    for(const b of bs){const x=-88+b.slot*22,w=b.poles*22-2,tr=st&&st.trips&&st.trips.includes(b.i);
      s+=`<g class="wsb" data-b="${b.i}" style="cursor:pointer">`+box(x,-40,w,72,"url(#gB)",{rx:2.5,s:"#9a9e99",so:.15});for(let j=0;j<b.poles;j++)s+=lever(x+5+j*22,11,b.on&&!tr,-36,44);
      if(b.poles>1)s+=R(x+5,-20,(b.poles-1)*22+11,3,"url(#gLv)",{rx:1});
      s+=T(x+w/2,6+12,`C${b.In}`,{fs:7,fw:700})+(tr?R(x+2,22,w-4,6,"#e0302a",{rx:1}):"")+T(x+w/2,46,cutText(b.name||"Q"+b.i,b.poles>1?9:4),{fs:5.5,fw:400});
      for(let j=0;j<b.poles;j++)s+=T(x+11+j*22,60,subtBar(b.slot+j),{fs:5,fw:400,c:"#5b6266"});s+="</g>"}
    break}
  case"luz":{if(on)s+=C(0,8,48,"url(#gGlow)");s+=box(-15,-32,30,10,"#bdb7aa",{rx:3})+R(-3,-22,6,10,"url(#gNi)")+R(-8,-14,16,10,"url(#gNi)",{rx:2,s:"#8d918d",sw:.5});
    s+=C(0,8,16,burnt?"#4a4743":on?"#fff6c8":"#f2f0e6",{s:"#b9b3a0"})+`<path d="M-5 10 q2.5 -6 5 0 q2.5 6 5 0" fill="none" stroke="${on?"#ff9a1a":"#9a958a"}" stroke-width="1.4"/>`+C(0,8,16,"url(#gLens)",{op:.6});
    if(burnt)s+=`<path d="M-8 2 l6 5 -3 4 7 4" fill="none" stroke="#222" stroke-width="1.2"/>`;break}
  case"ac":{s=box(-95,-33,190,66,"#f8f9f8",{rx:14,s:"#c8ccc9"})+R(-93,-6,186,37,"#000",{rx:12,op:.03})+R(-88,8,176,2,"#dfe2df")+R(-88,10,176,1,"#fff")+R(-80,16,160,9,"url(#gHole)",{rx:4,op:.35})+[0,1,2,3].map(k=>R(-78,17.5+k*2,156,.6,"#fff",{op:.5})).join("")+C(72,-14,3.2,on?"#4fd1ff":"#cfd3d0")+T(54,-11,on?"24°":"",{fs:8,c:"#4fa8d8"});
    if(on)for(const x of [-66,-40,40,66])s+=`<path class="flow" d="M${x} 28 q8 14 0 28" fill="none" stroke="#7cc4ef" stroke-width="2.5" stroke-linecap="round"/>`;break}
  case"heater":{s=R(-20,-76,6,14,"url(#gCu)")+R(14,-76,6,14,"#2f6fd0")+R(15,-76,1.5,14,"#fff",{op:.35})+box(-38,-65,76,130,"#f4f4f1",{rx:18,s:"#bfc2bd"})+R(-38,-65,76,16,"#d8dad6",{rx:10})+scr(-24,-22,48,36,"#e8e9e5");
    s+=T(0,-7,"CALENTADOR",{fs:6})+T(0,7,p.W+" W",{fs:7.5});if(on)s+=C(0,30,11,"#ff6b5e",{op:.5,flt:"blur"});s+=C(0,30,5,on?"#ff4b3b":"#5a1f1f");break}
  case"motor3":{const rev=st&&st.rev,hum=st&&st.s==="fase";s=R(-60,30,120,9,"url(#gBkS)",{rx:2})+R(-50,20,10,12,"#3a3e41")+R(30,20,10,12,"#3a3e41");
    s+=R(-53,-23,92,52,"#000",{rx:12,op:.2})+R(-54,-26,92,52,"url(#gMot)",{rx:12,s:"#3d5a6d",sw:1.5});for(let k=0;k<8;k++)s+=R(-46+k*10,-26,3.5,52,"url(#gMotF)")+R(-46+k*10,-26,1,52,"#fff",{op:.18});
    s+=box(-34,-42,40,18,"#4d6d82",{rx:3,s:"#3d5a6d"})+T(-14,-29,"3~",{fs:9,c:"#fff"})+R(38,-20,18,40,"url(#gMot)",{rx:6,s:"#5f6d75"})+R(56,-4,8,8,"url(#gNi)");
    s+=`<g transform="translate(47 0)"><g class="${on?(rev?"spinr":"spin"):hum?"hum":""}"><path d="M0 -14V14M-14 0H14M-10 -10L10 10M-10 10L10 -10" stroke="#2f3a40" stroke-width="2.4" stroke-linecap="round"/></g></g>`;
    s+=T(-8,6,p.hp,{fs:10,c:"#fff"})+T(-8,18,"208 V",{fs:7,fw:400,c:"#e8eef2"});
    if(on){const c=rev?"#d9822b":"#2f9e44",ex=rev?34:60;s+=`<path d="M${rev?60:34} -36 a14 14 0 0 ${rev?0:1} ${rev?-26:26} 0" fill="none" stroke="${c}" stroke-width="2.4"/><polygon points="${ex-4.5},-37 ${ex+4.5},-37 ${ex},-29" fill="${c}"/>`}break}
  case"pump":{s=R(-50,24,100,8,"#3a3e41",{rx:2})+R(-43,-19,54,46,"#000",{rx:10,op:.2})+R(-44,-22,54,46,"url(#gPump)",{rx:10,s:"#1d4d94"});for(let k=0;k<5;k++)s+=R(-38+k*9,-22,3,46,"#2a5fb5")+R(-38+k*9,-22,.9,46,"#fff",{op:.2});
    s+=R(20,-38,14,18,"url(#gNi)",{rx:2,s:"#7d8589",sw:.5})+C(29,2,20,"#000",{op:.2})+C(28,0,20,"url(#gScr)",{s:"#5f666b"})+`<g class="${on?"spin":""}"><path d="M28 -13V13M15 0H41M19 -9L37 9M19 9L37 -9" stroke="#3a3f43" stroke-width="2.6" stroke-linecap="round"/></g>`+C(28,0,4,"#5f666b")+T(-17,4,p.hp,{fs:8,c:"#fff"});break}
  }
  if(burnt){const d=DEV[type];s+=R(-d.w/2,-d.h/2,d.w,d.h,"#2b1d10",{rx:6,op:.35})+`<g class="smoke">${C(-6,-d.h/2-8,7,"#7d7a76",{op:.55})}${C(5,-d.h/2-16,9,"#8f8c88",{op:.45})}${C(-2,-d.h/2-28,11,"#a3a09c",{op:.35})}</g>`}
  return s}

/* ---------- wall rendering ---------- */
function wallBadge(st,d){if(!st)return"";const map={bat:["#d9822b","BATERÍA"],on:["#2f9e44",`${st.v} V · ${fmtNum(st.I||0,1)} A`],idle:["#2f9e44",`${st.v} V`],off:["#8a9195","0 V"],weak:["#d9822b",`${st.v} V · bajo`],burnt:["#c0322a","QUEMADO"],fase:["#c0322a","FALTA DE FASE"]};let [c,t]=map[st.s]||map.off;if(st.rev){c="#d9822b";t="GIRA AL REVÉS"}
  const w=t.length*5.6+14;return`<g transform="translate(0 ${-d.h/2-15})">${R(-w/2,-9,w,17,c,{rx:8.5})}${T(0,3.5,t,{fs:8.5,c:"#fff"})}</g>`}
function wallSvg(forExport){const W=S.wall,{Wd,H,ww,wh}=wallDims(),run=simState.running,res=run?simState.res:null,terms=allTerms();
  const fill={"Frisado y pintado":"#e9e3d7","Bloque sin frisar":"url(#pBlk)","Cerámica":"url(#pTile)"}[W.finish]||"#e9e3d7";
  let s=`<defs>${WALL_DEFS}</defs>`+R(0,0,Wd,H,"#f1f2ef")+R(WM.l-12,WM.t-10,ww+24,10,"#d3cec4")+R(WM.l,WM.t,ww,wh,fill)+R(WM.l,WM.t+wh-12,ww,12,"#d6d0c4")+R(WM.l-12,WM.t+wh,ww+24,16,"#8b6f55");
  s+=T(WM.l,WM.t-16,W.name,{fs:12,a:"start",ff:SANS,fw:700,c:"#3a3530"});
  /* rulers */
  s+=R(WM.l-34,WM.t,1.2,wh,"#6b6660");for(let m=0;m<=W.h+1e-6;m+=.5){const y=WM.t+wh-m*WK;s+=R(WM.l-40,y,12,1.2,"#6b6660")+T(WM.l-44,y+3.5,fmtNum(m,m%1?1:0)+" m",{fs:8.5,a:"end",fw:400,c:"#5b5650",ff:SANS})}
  const ry=WM.t+wh+40;s+=R(WM.l,ry,ww,1.2,"#6b6660");for(let m=0;m<=W.w+1e-6;m+=1){const x=WM.l+m*WK;s+=R(x,ry-6,1.2,12,"#6b6660")+T(x,ry+20,m+" m",{fs:8.5,fw:400,c:"#5b5650",ff:SANS})}
  s+=T(WM.l+ww/2,ry+38,`${W.name} · ${fmtNum(W.w)} × ${fmtNum(W.h)} m · ${W.finish.toLowerCase()} · dispositivos dibujados más grandes para cablear`,{fs:9,fw:400,c:"#5b5650",ff:SANS});
  for(const [m,l] of STD_H)if(m<W.h){const y=WM.t+wh-m*WK;s+=`<line x1="${WM.l}" y1="${y}" x2="${WM.l+ww}" y2="${y}" stroke="#7a6f60" stroke-width="1" stroke-dasharray="4 6" opacity=".45"/>`+T(WM.l+ww-8,y-5,l,{fs:8.5,a:"end",fw:400,c:"#7a6f60",ff:SANS})}
  /* conduit under the wires */
  const valid=W.wires.map((w,i)=>[w,i]).filter(([w])=>terms.has(w.a)&&terms.has(w.b));
  /* Tubería PVC: los tubos dibujados a mano o, si no hay, uno automático por cada cable */
  const tubeLine=(dd,extra="",tw=20)=>`<path d="${dd}" fill="none" stroke="#5f645e" stroke-width="${tw+4}" stroke-linejoin="round" stroke-linecap="round"/><path d="${dd}" fill="none" stroke="#cdd0c9" stroke-width="${tw}" stroke-linejoin="round" stroke-linecap="round"/><path d="${dd}" fill="none" stroke="#f3f4f0" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" opacity=".75" transform="translate(-3 -3)"/>${extra}`;
  const elbow=(x,y)=>C(x,y,13.5,"#bfc2bb",{s:"#5f645e",sw:1.6})+C(x,y,6.5,"#d9dbd5");
  if(W.tube!==false){const manual=(W.tubes||[]).length;let body="",fit="",hit="";
    if(manual){const R=routesFor(W,terms),load=R.tubeLoad||new Map();let drops="";
      for(const [w] of valid){const r=R.get(w.id);if(r&&r.stubs)for(const [a,b] of r.stubs)drops+=tubeLine(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`,"",13)}
      body+=drops;
      for(const t of tubePx(W)){const dd="M"+t.pts.map(p=>p[0]+" "+p[1]).join("L");body+=tubeLine(dd,"",Math.max(20,(load.get(t.id)||0)*LANE+10));t.pts.slice(1,-1).forEach(p=>fit+=elbow(p[0],p[1]));
        if(!forExport){hit+=`<path class="tb" data-id="${t.id}" d="${dd}" fill="none" stroke="#000" stroke-opacity="0" stroke-width="26" stroke-linejoin="round"/>`;if(t.id===sel)hit+=`<path d="${dd}" fill="none" stroke="#1c74e0" stroke-width="3" stroke-dasharray="7 5" pointer-events="none"/>`}}}
    else if((routesFor(W,terms).grid||[]).length){const G=routesFor(W,terms).grid,deg=new Map();
      /* canalización automática: un tubo por tramo, más ancho cuantos más cables lleva */
      const k=p=>p[0]+","+p[1];for(const e of G){const v=Math.abs(e.a[0]-e.b[0])<1;for(const p of [e.a,e.b]){const o=deg.get(k(p))||{h:0,v:0,p};o[v?"v":"h"]++;deg.set(k(p),o)}}
      const runs=[...G].sort((p,q)=>p.n-q.n);for(const e of runs)body+=tubeLine(`M${e.a[0]} ${e.a[1]}L${e.b[0]} ${e.b[1]}`,"",Math.max(16,e.n*LANE+8));
      for(const o of deg.values())if(o.h&&o.v)fit+=elbow(o.p[0],o.p[1])}
    else{const seen=new Set();for(const [w,i] of valid){if(innerWire(w,terms))continue;const p=wirePath(w,i,terms);body+=tubeLine(p.d);for(const [x,y] of p.pts.slice(1,-1)){const k=Math.round(x/8)+","+Math.round(y/8);if(!seen.has(k)){seen.add(k);fit+=elbow(x,y)}}}}
    const tm=tubeMeters();if(body)s+=`<g class="tube">${body}${fit}</g>${hit}`+R(WM.l+ww-236,WM.t+wh-40,228,24,"#ffffff",{rx:5,op:.92,s:"#5f645e",sw:1})+T(WM.l+ww-122,WM.t+wh-24,`Tubería PVC${manual?"":" (automática)"}: ${fmtNum(tm,1)} m`,{fs:11,ff:SANS,fw:600,c:"#2a2e31"})}
  /* items: el tablero va debajo de los cables; los demás aparatos encima (los cables pasan por detrás) */
  const drawItem=it=>{const [cx,cy]=toPx(it.x,it.y),{w,h}=itemSize(it);let g;
    if(it.type==="panel")g=panelImg(panelGeom(it));
    else g=`<g filter="url(#sh)">${drawDev(it.type,it.p,res&&res.loads[it.id])}</g>`+(res&&res.loads[it.id]?wallBadge(res.loads[it.id],DEV[it.type]):"");
    const lab=it.p.name||DEV[it.type].short,ly=h/2+(it.type==="panel"?16:32);
    s+=`<g class="wi" data-id="${it.id}" transform="translate(${cx} ${cy})">${g}${T(0,ly,lab,{fs:9.5,ff:SANS,fw:600,c:"#3a3530"})}${it.id===sel&&!forExport?R(-w/2-6,-h/2-6,w+12,h+12,"none",{rx:8,s:"#1c74e0",sw:2.5}):""}</g>`};
  for(const it of W.items)if(it.type==="panel")drawItem(it);
  /* zonas del tablero: cuerpo de cada protección (seleccionar / sacar cable) y principal */
  const PI=W.items.find(i=>i.type==="panel"),PG=PI?panelGeom(PI):null;
  if(PG){for(const sr of PG.srcs){const b=sr.body;if(simState.trip.has(sr.id))s+=R(b.x-1,b.y-1,b.w+2,b.h+2,"none",{rx:3,s:"#e0302a",sw:2.5});
      if(!forExport){const src=srcById(sr.id);s+=`<rect class="wb" data-brk="${sr.id}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#000" fill-opacity="0"${sel===sr.id?` stroke="#1c74e0" stroke-width="2.5" rx="3"`:""}><title>${esc(src?src.short:"")}: toca para seleccionar, arrastra para sacar un cable</title></rect>`}}
    if(PG.main&&simState.trip.has("main")){const m=PG.main;s+=R(m.x-1,m.y-1,m.w+2,m.h+2,"none",{rx:4,s:"#e0302a",sw:2.5})}
    if(!forExport&&PG.main){const m=PG.main;s+=`<rect class="wm" x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" fill="#000" fill-opacity="0"><title>Principal: clic para encender o apagar</title></rect>`}}
  /* wires */
  for(const [w,i] of valid){const p=wirePath(w,i,terms),sw=AWG_W[w.awg]||3.6,col=WCOL[w.color]||"#1f2224",bad=res&&res.wireMsg[w.id],moving=reconn&&reconn.id===w.id;
    s+=`<g class="ww" data-id="${w.id}"${moving?` opacity=".35"`:""}>`;if(res&&res.hot.has(w.id))s+=`<path d="${p.d}" fill="none" stroke="#ff7a1a" stroke-width="${sw+8}" opacity=".45" stroke-linejoin="round"/>`;
    s+=`<path d="${p.d}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="${sw+2}" stroke-linejoin="round"/><path d="${p.d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    if(!forExport)s+=`<path d="${p.d}" fill="none" stroke="#000" stroke-opacity="0" stroke-width="12"/>`;
    if(res&&showFlow)s+=flowSvg(w,p,res,sw);
    if(bad&&!forExport)s+=C(p.mid.x,p.mid.y,7,"#f08a2b",{s:"#fff",sw:1.5})+T(p.mid.x,p.mid.y+3.5,"!",{fs:9,c:"#fff",ff:SANS,fw:700});
    if(w.id===sel&&!forExport)s+=`<path d="${p.d}" fill="none" stroke="#1c74e0" stroke-width="2" stroke-dasharray="5 4"/>`;s+="</g>"}
  /* componentes del mando: encima de los cables para poder pulsarlos siempre */
  if(PG){for(const c of PG.ctl){const b=c.body,d=S.items.find(i=>i.id===c.id);if(!d)continue;const tr=d.type==="ovl"&&simState.trip.has("o"+d.id),pr=simState.pressed.has(d.id);
      if(tr)s+=R(b.x-1,b.y-1,b.w+2,b.h+2,"none",{rx:3,s:"#e0302a",sw:2.5});if(pr)s+=R(b.x-1,b.y-1,b.w+2,b.h+2,"#1c74e0",{rx:3,op:.18,s:"#1c74e0",sw:2.5});
      if(!forExport)s+=`<rect class="wc" data-c="${d.id}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#000" fill-opacity="0"${sel===d.id?` stroke="#1c74e0" stroke-width="2.5" rx="3"`:""}><title>${esc((d.p.des||"")+" "+CAT[d.type].n)}: ${esc(compHint(d))}</title></rect>`}}
  for(const it of W.items)if(it.type!=="panel")drawItem(it);
  /* palancas: encima de los cables para poder encender y apagar siempre */
  if(PG&&!forExport)for(const sr of PG.srcs){const src=srcById(sr.id);if(!src)continue;const hd=sr.handle,st=simState.trip.has(sr.id)?"disparado":src.p.on!==false?"encendido":"apagado";
    s+=`<rect class="wbh" data-brk="${sr.id}" x="${hd.x}" y="${hd.y}" width="${hd.w}" height="${hd.h}" rx="3"><title>${esc(src.short)} (${st}): clic en la palanca para ${simState.trip.has(sr.id)?"rearmar":src.p.on!==false?"apagar":"encender"}</title></rect>`}
  /* terminals */
  for(const t of terms.values()){const fillT={F:"#d9a441",S:"#d9a441",N:"#dfe3e5",T:"#2f9e44"}[t.role];
    if(t.item.type!=="panel"){s+=C(t.x,t.y,5,fillT,{s:"#5d5548",sw:1.2})+T(t.x,t.y+15,t.label,{fs:6.5,c:"#5b5650"})}
    if(!forExport){const hot=pending===t.id,target=reconn||pending;s+=`<circle class="wt" data-t="${t.id}" cx="${t.x}" cy="${t.y}" r="${t.item.type==="panel"?8:9}" fill="${hot?"#1c74e0":"#000"}" fill-opacity="${hot?.35:0}"${wallMode==="wire"||hot||target?` stroke="#1c74e0" stroke-width="1.4"`:""}><title>${esc(termName(t))}${res&&res.tp?" · "+esc(potTxt(res.tp[t.id],t.role))+(res.tfeed[t.id]?" · desde "+esc(res.tfeed[t.id].join(", ")):""):""}</title></circle>`;
      if(meterA===t.id)s+=`<g pointer-events="none">${C(t.x,t.y,10,"none",{s:"#d3312b",sw:3})}${T(t.x,t.y-14,"+",{fs:13,c:"#d3312b",ff:SANS,fw:700})}</g>`}}
  /* handles to move the ends of the selected wire */
  const sw=!forExport&&valid.find(([w])=>w.id===sel);
  if(sw){for(const end of ["a","b"]){const t=terms.get(sw[0][end]),act=reconn&&reconn.end===end;s+=`<g class="wh" data-end="${end}"><circle cx="${t.x}" cy="${t.y}" r="9" fill="${act?"#1c74e0":"#fff"}" stroke="#1c74e0" stroke-width="2.5"/><circle cx="${t.x}" cy="${t.y}" r="3" fill="${act?"#fff":"#1c74e0"}"/><title>Arrastra este extremo a otro terminal</title></g>`}}
  for(const sp of simState.sparks)s+=`<g transform="translate(${sp.x} ${sp.y})"><g class="spark">${C(0,0,26,"#fff6a8",{op:.7,flt:"blur"})}<polygon points="0,-24 6,-6 24,-8 9,4 16,22 0,10 -16,22 -9,4 -24,-8 -6,-6" fill="#ffd21f" stroke="#ff7a00" stroke-width="2"/>${C(0,0,6,"#fff")}</g></g>`;
  if(!forExport&&W.items.filter(i=>i.type!=="panel").length===0){const cx=WM.l+ww*.62,cy=WM.t+wh*.42;
    s+=`<g pointer-events="none">${R(cx-250,cy-74,500,148,"#ffffff",{rx:12,op:.88,s:"#1c74e0",sw:1.5,da:"6 5"})}${T(cx,cy-38,"Esta pared está vacía",{fs:17,ff:SANS,fw:700,c:"#1d2326"})}`+
      `${T(cx,cy-8,"1. Abre «Componentes» y arrastra tomas, interruptores o bombillos aquí.",{fs:12,ff:SANS,fw:400,c:"#3a3530"})}${T(cx,cy+14,"2. Toca un tornillo y luego otro para tender cada cable.",{fs:12,ff:SANS,fw:400,c:"#3a3530"})}${T(cx,cy+36,"3. Presiona «Probar» para energizar y ver qué pasa.",{fs:12,ff:SANS,fw:400,c:"#3a3530"})}</g>`}
  if(!forExport)s+=tubeDraftSvg();
  return s+`<g id="wpv"></g>`}
/* Cablear tablero: la vista se acerca al tablero de la pared; los cables que tiendas ahí son los mismos de la pared */
let panelZoom=false;
function wallView(){const D=wallDims(),P=panelZoom&&S.wall.items.find(i=>i.type==="panel");if(!P)return{x:0,y:0,Wd:D.Wd,H:D.H};
  const [cx,cy]=toPx(P.x,P.y),z=itemSize(P);let x0=cx-z.w/2,x1=cx+z.w/2,y0=cy-z.h/2,y1=cy+z.h/2;
  for(const t of itemTerms(P)){x0=Math.min(x0,t.x);x1=Math.max(x1,t.x);y0=Math.min(y0,t.y);y1=Math.max(y1,t.y)}
  const m=26;return{x:x0-m,y:y0-m,Wd:x1-x0+2*m,H:y1-y0+2*m}}
function renderWall(){const {x:vx,y:vy,Wd,H}=wallView();wallEl.setAttribute("viewBox",`${vx} ${vy} ${Wd} ${H}`);wallEl.setAttribute("width",Math.round(Wd*zoom));wallEl.setAttribute("height",Math.round(H*zoom));wallEl.innerHTML=wallSvg(false);$("zval").textContent=Math.round(zoom*100)+"%"}

/* ---------- running the test ---------- */
const alertTitle=m=>/^Cortocircuito/.test(m)?"Cortocircuito":/relé térmico/.test(m)?"Disparó el relé térmico":/falta de fase/.test(m)?"Motor quemado":/bobina|piloto/.test(m)?"Bobina quemada":/sobrecarga/i.test(m)?"Disparo por sobrecarga":/quemó/.test(m)?"Aparato quemado":/GFCI/.test(m)?"Disparó el GFCI":"Atención";
function runSim(){if(!simState.running)return;const r=simulate(simState.trip,simState.burnt);ctlCommit(r);
  r.trips.forEach(id=>simState.trip.add(id));r.newBurnt.forEach(id=>simState.burnt.add(id));r.log.forEach(e=>simState.log.unshift(e));simState.res=r;
  if(r.sparks.length){simState.sparks=r.sparks;setTimeout(()=>{simState.sparks=[];if(S.view==="wall")renderWall()},1300)}
  if(r.log.length){const m=r.log[r.log.length-1].msg;showAlert("crit",alertTitle(m),m,r.log.length>1?`y ${r.log.length-1} evento más`:"")}
  if(r.pending.length&&!simState.timer)simState.timer=setTimeout(()=>{simState.timer=null;if(!simState.running)return;const r2=simulate(simState.trip,simState.burnt);
    /* el relé térmico es más rápido que el breaker: si hay uno sobrecargado, dispara primero él */
    const due=r2.pending.some(o=>o.ovl)?r2.pending.filter(o=>o.ovl):r2.pending;
    due.forEach(o=>{if(o.ovl){simState.trip.add("o"+o.ovl);simState.log.unshift({lvl:"crit",msg:`Disparó el relé térmico ${o.lab}: pasaban ${fmtA(o.I)}. Abrió su contacto 95-96 y el contactor se soltó. Revisa el motor y tócalo para rearmarlo.`})}
      else if(o.burn){simState.burnt.add(o.burn);simState.log.unshift({lvl:"crit",msg:o.msg})}
      else{simState.trip.add(o.b.id);simState.log.unshift({lvl:"crit",msg:`Disparó por sobrecarga ${srcWho(o.b)}: pasaban ${fmtA(o.I)}.`})}});
    if(due.length)showAlert("crit",alertTitle(simState.log[0].msg),simState.log[0].msg);runSim();renderAll()},1800)}
function setRunning(on){simState.running=on;simState.blackout=false;ctlReset();clearTimeout(simState.timer);simState.timer=null;simState.sparks=[];
  if(on){simState.trip.clear();simState.burnt.clear();simState.log=[];runSim();
    if(!simState.log.length){const r=simState.res,L=Object.values(r.loads),ok=L.filter(l=>l.s==="on"||l.s==="idle").length,warn=r.status.filter(s=>s.lvl==="warn"||s.lvl==="crit").length;
      const off=L.length-ok,bad=warn||off;
      showAlert(bad?"warn":"ok",!L.length?"Prueba en marcha: no hay aparatos":off?"Prueba en marcha: hay aparatos sin tensión":warn?"Prueba en marcha, con avisos":"Prueba en marcha: todo bien",
        !L.length?"Agrega un bombillo, una toma o un aparato y cablealo al tablero.":`${ok} de ${L.length} aparatos con tensión en ${S.wall.name}.${off?(isDin()&&S.items.some(i=>i.type==="push"&&i.p.ct!=="NC")?" Para arrancar un motor, mantén presionado el pulsador de marcha en el tablero.":" "+((r.status.find(x=>/no funciona,/.test(x.msg))||{}).msg||"A los que no encienden les falta la fase o el neutro: revisa sus dos cables.")+" Toca cada aparato para ver qué está recibiendo."):""}${warn?` Hay ${warn} aviso${warn>1?"s":""} de norma o de carga.`:""}${!bad?" Prueba unir una fase con el neutro para ver qué pasa.":""}`)}}
  else{simState.res=null;hideAlert()}renderAll()}
function toggleBlackout(){if(!simState.running)return;simState.blackout=!simState.blackout;
  simState.log.unshift({lvl:simState.blackout?"warn":"ok",msg:simState.blackout?"Se fue la luz (apagón simulado).":"Volvió la luz."});runSim();
  const r=simState.res,bat=Object.entries(r.loads).filter(([id,l])=>{const it=S.wall.items.find(i=>i.id===+id);return it&&DEV[it.type].V&&(l.s==="on"||l.s==="idle")});
  if(simState.blackout)showAlert(bat.length?"warn":"crit",bat.length?"Apagón: hay respaldo":"Apagón: todo sin luz",bat.length?`${bat.length} aparato${bat.length>1?"s siguen":" sigue"} funcionando con batería en ${S.wall.name}.`:"Ningún aparato tiene respaldo. Pon un UPS o un inversor entre la línea y los equipos que quieres mantener.");
  else showAlert("ok","Volvió la luz","Los equipos vuelven a tomar corriente de la red.");renderAll()}
function rearm(){simState.trip.clear();simState.burnt.clear();clearTimeout(simState.timer);simState.timer=null;simState.log.unshift({lvl:"ok",msg:"Breakers rearmados y aparatos reemplazados."});hideAlert();runSim();renderAll()}

/* ---------- walls ---------- */
function addWall(){const n=S.walls.length+1,w=blankWall("Pared "+n,false),b=srcList()[0];
  if(b)w.items.push({id:uid++,type:"feed",x:.6,y:2.1,p:{name:"",brk:b.id}});
  mutate(()=>{S.walls.push(w);S.wallI=S.walls.length-1});sel=null;pending=null;autoFit=true;fit();toast(`${w.name} creada con una llegada de circuito para alimentarla.`)}
function delWall(){if(S.walls.length<2)return;const i=S.wallI;mutate(()=>{S.walls.splice(i,1);S.wallI=Math.max(0,i-1)});sel=null;autoFit=true;fit()}
function selectWall(i){pending=null;reconn=null;sel=null;mutate(()=>{S.wallI=i});autoFit=true;fit()}

/* ---------- library for the wall ---------- */
function devThumb(type){if(type==="panel"){if(!isDin())return`<svg viewBox="0 0 ${PW} ${lcPH()}" aria-hidden="true">${lcPanelSvg({wall:true})}</svg>`;const D=dims(),b=sel;sel=null;let inner;try{inner=dinSvg(true).replace(/ id="(items|pv)"/g,"")}finally{sel=b}return`<svg viewBox="${D.encX} 0 ${D.W} ${D.encH}" aria-hidden="true">${inner}</svg>`}const d=DEV[type],p=Object.assign({},d.d);if(type==="feed"){const f0=srcList()[0];p.brk=f0&&f0.id}
  return`<svg viewBox="${-d.w/2-4} ${-d.h/2-6} ${d.w+8} ${d.h+12}" aria-hidden="true"><defs>${WALL_DEFS}</defs><g filter="url(#sh)">${drawDev(type,p,null)}</g></svg>`}
function renderWallLib(){const q=$("q").value.trim().toLowerCase();let h="";$("libTitle").textContent="Para la pared";$("q").placeholder="Buscar: toma, tres vías, bomba…";
  LIB_WALL.forEach(([cat,list])=>{const items=list.filter(t=>!q||(DEV[t].n+" "+cat).toLowerCase().includes(q));if(!items.length)return;
    h+=`<div class="cat">${esc(cat)}</div><div class="lib-grid">`+items.map(t=>{const d=DEV[t],here=S.walls.findIndex(w=>w.items.some(i=>i.type==="panel"));
      const meta=t==="panel"?(here>=0?`Está en ${S.walls[here].name}`:(isDin()?"Tu tablero de riel":"Tu caja de breakers")):t==="feed"?"Viene del tablero":t==="supply"?"L1, L2, L3, N y T":d.price?"$ "+fmtNum(devPrice(d,{}),0)+" · "+fmtNum(d.std,2)+" m":"Aparato · "+d.V+" V";
      return`<div class="li${t==="ac"?" wide":""}" tabindex="0" role="button" data-lib="w${t}">${devThumb(t)}<b>${esc(d.n)}</b><span>${meta}</span>${["supply","inter3","feed","estabw","protw","upsw","invw"].includes(t)?`<span class="tag-new">Nuevo</span>`:""}${INFO[t]?`<button class="li-info" data-info="${t}" aria-label="Ver ficha de ${esc(d.n)}" title="¿Qué es?">i</button>`:""}</div>`}).join("")+`</div>`});
  $("libList").innerHTML=h||`<p class="note" style="padding:8px 4px">Nada coincide con "${esc(q)}".</p>`;libChips()}
function addWallItem(type,at){if(type==="panel"){const i=S.walls.findIndex(w=>w.items.some(x=>x.type==="panel"));if(i>=0){toast(i===S.wallI?"El tablero ya está en esta pared. Arrástralo para moverlo.":`El tablero está en ${S.walls[i].name}. En esta pared usa una "Llegada de circuito".`);return}}
  if(type==="supply"&&S.wall.items.some(i=>i.type==="supply")){toast("Esta pared ya tiene una acometida.");return}
  const d=DEV[type],y=at?at[1]:d.std;let x=at?at[0]:null;
  /* busca un lugar libre según el tamaño real de cada elemento (primero a la altura estándar, luego un poco más arriba o abajo) */
  let yy=y;if(x==null){const me=itemSize({type,x:0,y:0,p:d.d||{}}),hw=me.w/2/WK+.08,hh=me.h/2/WK+.08,free=(cx,cy)=>S.wall.items.every(i=>{const o=itemSize(i),ow=o.w/2/WK,oh=o.h/2/WK;return Math.abs(i.x-cx)>=hw+ow||Math.abs(i.y-cy)>=hh+oh});
    outer:for(const dy of [0,.35,-.35,.7,-.7]){const cy=y+dy;if(cy-hh<0||cy+hh>S.wall.h)continue;for(let c=hw;c<=S.wall.w-hw;c+=.05)if(free(c,cy)){x=c;yy=cy;break outer}}
    if(x==null)x=.6}
  const it={id:uid++,type,x:+x.toFixed(2),y:+yy.toFixed(2),p:Object.assign({},d.d||{},{name:""})};if(type==="feed"){const f0=srcList()[0];it.p.brk=f0?f0.id:null}clampItem(it);
  mutate(()=>{S.wall.items.push(it)});sel=it.id;renderAll()}
function clampItem(it){const {w,h}=itemSize(it),hw=w/2/WK,hh=h/2/WK;it.x=Math.round(Math.max(hw,Math.min(S.wall.w-hw,it.x))*20)/20;it.y=Math.round(Math.max(hh,Math.min(S.wall.h-hh,it.y))*20)/20}

/* ---------- side panel for the wall ---------- */
function evList(list){return list.length?`<ul class="ev">${list.map(e=>`<li class="${e.lvl}"${e.wire?` data-wire="${e.wire}"`:""}>${esc(e.msg)}</li>`).join("")}</ul>`:""}
function renderPropsWall(){const bs=srcById(sel);
  if(bs){const P=$("paneP");P.innerHTML=`<div><h2>${bs.din?esc(CAT[bs.ref.type].n)+" "+esc(bs.short):"Breaker "+esc(bs.lab)}</h2><div class="meta">${bs.poles}P ${bs.In} A · ${esc(bs.name||"Sin nombre")} · ${simState.trip.has(bs.id)?"disparado":bs.p.on!==false?"encendido":"apagado"}</div></div>
    <p class="note">Desde aquí puedes encenderlo, apagarlo o eliminarlo. Lo demás se cambia en la vista Tablero.</p>${infoCard(bs.din?bs.ref.type:infoKey("brk",bs.ref))}
    <div class="row-btns"><button class="btn" id="pb-on">${bs.p.on!==false?"Apagar":"Encender"}</button><button class="btn" id="pb-board">Ver en la vista Tablero</button><button class="btn danger" id="pb-del">Eliminar</button></div>`;
    $("pb-on").onclick=()=>mutate(()=>{bs.p.on=bs.p.on===false});$("pb-board").onclick=()=>setView("board");$("pb-del").onclick=()=>{sel=null;deleteBreaker(bs.id)};return}
  const P=$("paneP"),it=S.wall.items.find(i=>i.id===sel),w=S.wall.wires.find(i=>i.id===sel),terms=allTerms(),res=simState.running?simState.res:null;
  const sim=`<h3>Prueba</h3>${simState.running?`<p class="note">Simulación en marcha. Toca un interruptor para cambiarlo, y los breakers del tablero para apagarlos o rearmarlos.${isDin()?" Los pulsadores del tablero se mantienen presionados; el paro de emergencia y el selector se tocan.":""}</p>`:`<p class="note">Presiona <b>Probar</b> para energizar la pared y ver qué pasa.</p>`}
    ${simState.running&&showFlow?`<div class="legend flow-leg"><span><i style="background:#ffe14d"></i>Corriente por la fase (sale de la fuente)</span><span><i style="background:#8fdcff"></i>Regreso por el neutro</span><span><i style="background:#ffe14d;opacity:.4"></i>Con tensión, sin corriente</span></div><p class="note">Los puntos se mueven más rápido cuanto más corriente lleva el cable. En corriente alterna el sentido cambia 60 veces por segundo; aquí se muestra de la fuente hacia el aparato.</p>`:""}
    ${simState.log.length?`<h3>Lo que pasó</h3>${evList(simState.log.slice(0,8))}`:""}${res?`<h3>Estado actual</h3>${evList(res.status)}`:""}`;
  const dc=isDin()&&S.items.find(i=>i.id===sel&&CTL_TYPES.has(i.type));
  if(dc){const c=CAT[dc.type],co=res&&res.coil[dc.id],PI=S.wall.items.find(i=>i.type==="panel"),lab=dc.p.des||c.n;
    const st=!res?"":dc.type==="ovl"?(simState.trip.has("o"+dc.id)?" · DISPARADO":` · armado${res.ovlI[dc.id]?" · "+fmtA(res.ovlI[dc.id]):""}`):dc.type==="push"?(simState.pressed.has(dc.id)?" · presionado":" · suelto"):dc.type==="emerg"?(dc.p.on!==false?" · liberado":" · ENCLAVADO"):dc.type==="selector"?` · posición ${esc(dc.p.pos)}`:co?(co.on?(dc.type==="pilot"?" · encendida":dc.type==="supv"?" · red normal":` · con ${co.v} V, cerrado`):` · ${co.why}`):"";
    const pins=PI?itemTerms(PI).filter(t=>t.ctlOf===dc.id).map(t=>t.pin):[];
    const how={push:"Durante la prueba, mantén presionado el pulsador sobre el tablero.",emerg:"Durante la prueba, tócalo para enclavarlo (abre el mando) y otra vez para liberarlo.",selector:"Durante la prueba, tócalo para girarlo de posición.",ovl:coupledCont(dc)?"Está montado debajo del contactor de su izquierda: sus entradas L1-L3 ya van unidas a T1-T3 del contactor. Saca el motor de sus T1-T3 y pon 95-96 en serie con la bobina.":"Pon el relé justo a la derecha del contactor en la vista Tablero para que se acople, o cablea T1-T3 del contactor a sus entradas L1-L3."}[dc.type]||"Toca un borne (o arrastra desde el componente) para tender un cable.";
    P.innerHTML=`<div><h2>${esc(c.n)} ${esc(dc.p.des||"")}</h2><div class="meta">${esc(c.desc(dc.p))}${st}</div></div>
      <p class="note">${esc(how)}</p>
      <div class="fields">${(c.f||[]).filter(f=>Array.isArray(f[2])).map(([k,l,o])=>`<label class="field${o.length>4?" wide":""}"><span>${esc(l)}</span><select class="sel" id="pc-${k}">${o.map(v=>opt(v,dc.p[k])).join("")}</select></label>`).join("")}</div>
      <h3>Bornes</h3><p class="note">${pins.map(k=>`<b>${esc(k)}</b>`).join(" · ")||"—"}</p>${infoCard(dc.type)}
      <div class="row-btns">${dc.type==="ovl"&&simState.trip.has("o"+dc.id)?`<button class="btn primary" id="pc-reset">Rearmar el térmico</button>`:""}<button class="btn" id="pc-board">Ver en la vista Tablero</button><button class="btn danger" id="pc-del">Eliminar</button></div>${sim}`;
    (c.f||[]).filter(f=>Array.isArray(f[2])).forEach(([k,,o])=>{$("pc-"+k).onchange=e=>setProp(dc.id,k,typeof o[0]==="number"?Number(e.target.value):e.target.value)});
    const rs=$("pc-reset");if(rs)rs.onclick=()=>compTap(dc);$("pc-board").onclick=()=>setView("board");$("pc-del").onclick=wallDelete;return}
  if(w){const ta=terms.get(w.a),tb=terms.get(w.b),i=S.wall.wires.indexOf(w),len=ta&&tb?wirePath(w,i,terms).len/WK:0;
    P.innerHTML=`<div><h2>Cable ${esc(w.color.toLowerCase())} #${esc(w.awg)}</h2><div class="meta">${ta&&tb?esc(wireEnds(w,terms)):"Desconectado"} · ${fmtM2(len)}</div></div>
     <div class="fields"><label class="field"><span>Color</span><select class="sel" id="pw-color">${Object.keys(WCOL).map(c=>opt(c,w.color)).join("")}</select></label><label class="field"><span>Calibre AWG</span><select class="sel" id="pw-awg">${Object.keys(AWG_W).map(a=>opt(a,w.awg)).join("")}</select></label></div>
     <h3>Mover un extremo</h3><p class="note">Arrastra el círculo azul de cualquier punta hasta otro terminal, o toca un botón y luego el terminal nuevo.</p>
     <div class="row-btns"><button class="btn${reconn&&reconn.end==="a"?" primary":""}" id="pw-ra">Mover: ${esc(cutText(termName(ta),22))}</button><button class="btn${reconn&&reconn.end==="b"?" primary":""}" id="pw-rb">Mover: ${esc(cutText(termName(tb),22))}</button></div>
     ${res&&res.wireMsg[w.id]?`<ul class="ev"><li class="warn">${esc(res.wireMsg[w.id].join("; "))}</li></ul>`:""}
     <p class="note">Norma: fases en negro, rojo o azul · neutro en blanco · tierra en verde · retorno al bombillo en rojo · viajeros de tres vías en amarillo. Calibre #14 hasta 15 A, #12 hasta 20 A, #10 hasta 30 A.</p>
     <div class="row-btns"><button class="btn danger" id="pw-del">Eliminar cable</button></div>${sim}`;
    $("pw-color").onchange=e=>mutate(()=>{w.color=e.target.value});$("pw-awg").onchange=e=>mutate(()=>{w.awg=e.target.value});$("pw-del").onclick=wallDelete;
    $("pw-ra").onclick=()=>{reconn={id:w.id,end:"a",moved:false};renderAll()};$("pw-rb").onclick=()=>{reconn={id:w.id,end:"b",moved:false};renderAll()};return}
  if(it){const d=DEV[it.type];
    if(it.type==="panel")P.innerHTML=`<div><h2>Tablero</h2><div class="meta">Centro a ${fmtM2(it.y)} del piso · ${S.lc.spaces} espacios</div></div>
      <div class="row-btns"><button class="btn primary" id="pp-edit">Poner o quitar breakers</button></div>
      <p class="note">${isDin()?"Es tu tablero de riel DIN. Las protecciones se ponen y cambian en la vista Tablero. Los cables salen del tornillo inferior de cada termomagnético, diferencial, seccionador o guardamotor; abajo están la barra de neutro y la de tierra (las borneras blancas o azules cuentan como neutro, las verdes como tierra). Además":"Es tu caja de breakers. Los breakers se ponen, quitan y cambian en la vista Tablero. Los cables se conectan al tornillo de cada breaker, a la barra de neutro (izquierda) y a"} la barra de tierra (derecha).</p>
      <h3>Entrada de las líneas</h3><p class="note">${wiredMode()?`Hay una acometida en esta pared: el tablero solo tiene corriente si su entrada está cableada. ${isDin()?"Lleva L1, L2 (y L3) a la entrada (tornillos de arriba) del seccionador o de la primera protección":"Lleva L1, L2 (y L3) a la entrada del principal"}, el neutro a la barra N y la tierra a la barra T.`:"Alimentación automática: cada protección ya tiene fase. Para cablear la entrada de las líneas, agrega una Acometida desde la biblioteca (Alimentación)."}</p>
      ${isDin()?`<label class="switch"><input type="checkbox" id="pp-peine"${it.p.peine!==false?" checked":""}> Peine: une las entradas de todas las protecciones a la salida del seccionador (o de la primera protección)</label>`:""}
      ${posFields(it)}<div class="row-btns"><button class="btn danger" id="pp-del">Quitar de la pared</button></div>${sim}`;
    else P.innerHTML=`<div><h2>${esc(d.n)}</h2><div class="meta">${d.V?d.V+" V · ":""}${d.price?"$ "+fmtNum(devPrice(d,it.p))+" en el presupuesto":"Aparato del cliente"}</div></div>
      <div class="fields"><label class="field wide"><span>Nombre</span><input class="txt" id="pp-name" value="${esc(it.p.name)}" placeholder="${esc(d.short)}"></label>
      ${it.type==="feed"?`<label class="field wide"><span>Circuito del tablero</span><select class="sel" id="pp-brk">${srcList().map(b=>`<option value="${b.id}"${b.id===it.p.brk?" selected":""}>${esc(srcOption(b))}</option>`).join("")}</select></label>`:""}
      ${(d.f||[]).map(([k,l,o])=>o==="text"?`<label class="field"><span>${esc(l)}</span><input class="txt" id="pp-${k}" value="${esc(it.p[k]??"")}"></label>`:`<label class="field${o.length>4?" wide":""}"><span>${esc(l)}</span><select class="sel" id="pp-${k}">${o.map(v=>opt(v,it.p[k])).join("")}</select></label>`).join("")}</div>
      ${it.type==="inter"?`<label class="switch"><input type="checkbox" id="pp-on"${it.p.on?" checked":""}> Encendido</label>`:""}
      ${res&&res.loads[it.id]?readCard(it,res):""}${d.tip?`<p class="note">${esc(d.tip)}</p>`:""}${infoCard(it.type)}
      ${posFields(it)}<div class="row-btns"><button class="btn" id="pp-dup">Duplicar</button><button class="btn danger" id="pp-del">Eliminar</button></div>${sim}`;
    const pe=$("pp-edit");if(pe)pe.onclick=()=>setView("board");const pg=$("pp-peine");if(pg)pg.onchange=e=>mutate(()=>{it.p.peine=e.target.checked});
    const nm=$("pp-name");if(nm)nm.onchange=e=>mutate(()=>{it.p.name=e.target.value});
    const pb=$("pp-brk");if(pb)pb.onchange=e=>mutate(()=>{it.p.brk=+e.target.value});
    (d.f||[]).forEach(([k,,o])=>{$("pp-"+k).onchange=e=>{const v=o!=="text"&&typeof o[0]==="number"?Number(e.target.value):e.target.value;mutate(()=>{it.p[k]=v})}});
    const on=$("pp-on");if(on)on.onchange=e=>mutate(()=>{it.p.on=e.target.checked});
    ["x","y"].forEach(k=>$("pp-"+k).onchange=e=>mutate(()=>{it[k]=+e.target.value||0;clampItem(it)}));
    const sd=$("pp-std");if(sd)sd.onclick=()=>mutate(()=>{it.y=d.std;clampItem(it)});
    const du=$("pp-dup");if(du)du.onclick=()=>{const n={id:uid++,type:it.type,x:it.x+.4,y:it.y,p:Object.assign({},it.p)};clampItem(n);mutate(()=>{S.wall.items.push(n)});sel=n.id;renderAll()};
    $("pp-del").onclick=wallDelete;return}
  const nd=S.wall.items.filter(i=>i.type!=="panel").length,mts=[...wallWireMeters().values()].reduce((a,b)=>a+b,0);
  P.innerHTML=`<div><h2>${esc(S.wall.name)}</h2><div class="meta">${nd} puntos · ${S.wall.wires.length} cables · ${fmtM2(mts)} de cable${S.wall.tube!==false?` · ${fmtM2(tubeMeters())} de tubo`:""}</div></div>
   <div class="fields"><label class="field wide"><span>Nombre de la pared</span><input class="txt" id="pw-name" value="${esc(S.wall.name)}"></label></div>
   <div class="row-btns"><button class="btn" id="pw-add">+ Otra pared</button>${S.walls.length>1?`<button class="btn danger" id="pw-delwall">Eliminar esta pared</button>`:""}</div>
   <ol class="steps"><li>Arrastra tomas, interruptores y aparatos desde la biblioteca. En una pared sin tablero, pon una <b>Llegada de circuito</b>.</li><li>Toca un terminal y luego otro para tender un cable. Con color <b>Automático</b> se usa el de la norma.</li><li>Para corregir un cable, selecciónalo y arrastra su punta a otro terminal.</li><li>Presiona <b>Probar</b>. Si unes una fase con el neutro, verás el cortocircuito.</li></ol>
   ${sim}<h3>Colores según norma</h3><div class="legend">${[["Negro","Fase"],["Rojo","Fase / retorno"],["Azul","Fase C"],["Amarillo","Viajero 3 vías"],["Blanco","Neutro"],["Verde","Tierra"]].map(([c,l])=>`<span><i style="background:${WCOL[c]}"></i>${l}</span>`).join("")}</div>`;
  $("pw-name").onchange=e=>mutate(()=>{S.wall.name=e.target.value.trim()||S.wall.name});$("pw-add").onclick=addWall;const dw=$("pw-delwall");if(dw)dw.onclick=delWall;
  P.querySelectorAll("[data-wire]").forEach(li=>li.onclick=()=>{sel=+li.dataset.wire;renderAll()})}
/* Lo que recibe un aparato durante la prueba: cada borne, voltaje, corriente y potencia */
function readCard(it,res){const d=DEV[it.type],st=res.loads[it.id],rows=d.terms.filter(t=>!(it.type==="supply"&&t[0]==="L3"&&S.lc.sys!=="3F")).map(([k,role,l])=>{const id=`${it.id}/${k}`,p=res.tp[id],f=res.tfeed[id];
    return`<tr><th>${esc(l)}</th><td>${esc(potTxt(p,role))}${f?` <span class="meta">desde ${esc(f.join(", "))}</span>`:""}</td></tr>`}).join("");
  const S2={on:"Funcionando",idle:"Con tensión, sin consumo",off:"No funciona",weak:"Voltaje bajo",burnt:"Quemado",bat:"Con batería",fase:"Falta de fase"}[st.s]||st.s;
  const kv=[["Estado",S2+(st.rev?" · gira al revés":"")],["Voltaje",`${st.v||0} V${d.V?` (necesita ${d.V} V)`:""}`],...(st.I?[["Corriente",fmtA(st.I)]]:[]),...(st.W?[["Potencia",fmtNum(st.W,0)+" W"]]:[])];
  return`<div class="reading"><h3>Qué está recibiendo</h3><table>${kv.map(([a,b])=>`<tr><th>${a}</th><td><b>${esc(b)}</b></td></tr>`).join("")}${rows}</table>${st.s==="off"&&st.why?`<p class="note why">Por qué: ${esc(st.why)}</p>`:""}</div>`}
function posFields(it){const d=DEV[it.type];return`<div class="fields"><label class="field"><span>Desde la izquierda (m)</span><input class="txt" id="pp-x" type="number" step="0.05" min="0" value="${it.x}"></label><label class="field"><span>Altura del centro (m)</span><input class="txt" id="pp-y" type="number" step="0.05" min="0" value="${it.y}"></label></div>
  ${d.std&&Math.abs(it.y-d.std)>.01?`<div class="row-btns"><button class="btn" id="pp-std">Usar altura estándar (${fmtM2(d.std)})</button></div>`:""}`}
/* Quita un breaker de la caja y los cables conectados a su tornillo en todas las paredes */
function deleteBreaker(id){const b=srcById(id),dc=!b&&isDin()&&S.items.find(i=>i.id===id);if(!b&&!dc)return;let n=0;
  mutate(()=>{if(!b||b.din)S.items=S.items.filter(x=>x.id!==id);else S.lc.items=S.lc.items.filter(x=>x.id!==id);
    for(const wl of S.walls){const pn=wl.items.find(i=>i.type==="panel");
      if(pn){const pre=["b","t","c"].map(k=>`${pn.id}/${k}${id}.`),hit=x=>pre.some(q=>x.startsWith(q)),before=wl.wires.length;wl.wires=wl.wires.filter(w=>!hit(w.a)&&!hit(w.b));n+=before-wl.wires.length}
      for(const f of wl.items)if(f.type==="feed"&&f.p.brk===id)f.p.brk=null}});
  simState.trip.delete(id);toast(`${dc?(dc.p.des||CAT[dc.type].n):b.din?"Protección "+b.short:"Breaker del "+b.lab} eliminado${n?` junto con ${n} cable${n>1?"s":""}`:""}.`)}
function wallDelete(){if(!sel)return;if((S.wall.tubes||[]).some(t=>t.id===sel)){const id=sel;sel=null;mutate(()=>{S.wall.tubes=S.wall.tubes.filter(t=>t.id!==id)});toast("Tubo eliminado.");return}if(srcById(sel)||(isDin()&&S.items.some(i=>i.id===sel))){const id=sel;sel=null;deleteBreaker(id);return}const id=sel;sel=null;reconn=null;mutate(()=>{if(S.wall.wires.some(w=>w.id===id)){S.wall.wires=S.wall.wires.filter(w=>w.id!==id);return}
  S.wall.items=S.wall.items.filter(i=>i.id!==id);S.wall.wires=S.wall.wires.filter(w=>!w.a.startsWith(id+"/")&&!w.b.startsWith(id+"/"))})}

/* ---------- pointer interaction ---------- */
function toWall(e){const pt=wallEl.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=wallEl.getScreenCTM();return m?pt.matrixTransform(m.inverse()):{x:0,y:0}}
function linkOk(a,b,terms,ignoreId){if(a===b){toast("Ese es el mismo terminal.");return false}
  if(S.wall.wires.some(w=>w.id!==ignoreId&&((w.a===a&&w.b===b)||(w.a===b&&w.b===a)))){toast("Esos dos terminales ya están unidos por otro cable.");return false}
  const ta=terms.get(a),tb=terms.get(b);if(ta.item===tb.item&&ta.item.type!=="panel"){toast("Une terminales de dos aparatos distintos, o del aparato con el tablero.");return false}return true}
function applyReconn(tid){const w=S.wall.wires.find(x=>x.id===reconn.id),end=reconn.end;reconn=null;if(!w){renderAll();return}
  const other=w[end==="a"?"b":"a"];if(!linkOk(tid,other,allTerms(),w.id)){renderAll();return}
  mutate(()=>{w[end]=tid});sel=w.id;toast("Extremo del cable movido.")}
/* Tornillo del breaker más cercano al punto tocado */
/* Tornillo de entrada (arriba) de una protección del riel, el más cercano en horizontal */
function brkTopTerm(b,e){const P=S.wall.items.find(i=>i.type==="panel");if(!P)return null;const q=toWall(e);let best=null,d=1e9;
  for(const t of itemTerms(P))if(t.lineOf===b.id){const dx=Math.abs(t.x-q.x);if(dx<d){d=dx;best=t.id}}return best}
function brkTerm(b,e){const P=S.wall.items.find(i=>i.type==="panel");if(!P)return null;const q=toWall(e);let best=null,d=1e9;
  for(const t of itemTerms(P))if(t.srcId===b.id){const dy=Math.abs(t.y-q.y);if(dy<d){d=dy;best=t.id}}return best}
/* ---------- mover componentes entre rieles desde la pared (modo Mover) ---------- */
let railDrag=null;
function railTarget(e){const P=S.wall.items.find(i=>i.type==="panel"),it=S.items.find(i=>i.id===railDrag.id);if(!P||!it)return null;const g=panelGeom(P),q=toWall(e),s=g.s;
  const x=Math.round(((q.x-railDrag.grab-g.x0)/s-SIDE)/U),row=Math.max(0,Math.min(S.board.rows-1,Math.floor(((q.y-g.y0)/s-TOP)/ROW_H)));
  let best=null;for(const dx of [0,-1,1,-2,2,-3,3]){const xx=Math.max(0,Math.min(cap()-railDrag.u,x+dx));if(fits(row,xx,railDrag.u,it.id)){best=xx;break}}
  const tx=best??Math.max(0,Math.min(cap()-railDrag.u,x));return{row,x:tx,ok:best!=null,g}}
function startRail(id,sx,sy){const it=S.items.find(i=>i.id===id),P=S.wall.items.find(i=>i.type==="panel");if(!it||!P)return;const g=panelGeom(P),q=toWall({clientX:sx,clientY:sy});
  railDrag={id,u:units(it),grab:q.x-(g.x0+(SIDE+it.x*U)*g.s),t:null};pending=null;sel=id}
function railMove(e){const t=railTarget(e);railDrag.t=t;if(!t)return;const g=t.g,s=g.s,x=g.x0+(SIDE+t.x*U)*s,y=g.y0+(TOP+t.row*ROW_H+COMP_Y)*s,col=t.ok?"#2f9e44":"#d23a2f";
  const pv=$("wpv");if(pv){pv.setAttribute("pointer-events","none");pv.innerHTML=R(x-2,y-2,railDrag.u*U*s+4,CH*s+4,col,{rx:4,op:.18})+R(x-2,y-2,railDrag.u*U*s+4,CH*s+4,"none",{rx:4,s:col,sw:2.5,da:"6 4"})}
  ghost.hidden=false;ghost.textContent=t.ok?`Fila ${t.row+1} · módulo ${t.x/2+1}`:"No cabe ahí";ghost.style.left=e.clientX+"px";ghost.style.top=e.clientY+"px";edgeScroll(e)}
function railDrop(){const d=railDrag;railDrag=null;ghost.hidden=true;edgeScroll(null);const it=S.items.find(i=>i.id===d.id),t=d.t;
  if(it&&t&&t.ok&&(t.row!==it.row||t.x!==it.x)){activeRow=t.row;mutate(()=>{it.row=t.row;it.x=t.x});toast(`${it.p.des||CAT[it.type].n} movido a la fila ${t.row+1}. Sus cables lo siguen.`)}
  else{if(t&&!t.ok)toast("Ese lugar del riel está ocupado.");renderAll()}}
/* Borne del componente de mando más cercano al punto tocado */
function compPin(d,e){const P=S.wall.items.find(i=>i.type==="panel");if(!P)return null;const q=toWall(e);let best=null,dd=1e9;
  for(const t of itemTerms(P))if(t.ctlOf===d.id){const k=Math.hypot(t.x-q.x,t.y-q.y);if(k<dd){dd=k;best=t.id}}return best}
/* Soltar un pulsador: si el contactor se cae al soltar marcha, falta la retención */
function releasePush(){const c=compPress;compPress=null;if(!c)return;const d=S.items.find(i=>i.id===c.id);c.before=[...simState.ctl];simState.pressed.delete(c.id);renderAll();if(!d||!simState.running)return;
  const lost=(c.before||[]).filter(id=>!simState.ctl.includes(id)).map(id=>S.items.find(i=>i.id===id)).filter(k=>k&&(k.type==="icont"||k.type==="cont"));
  const gained=simState.ctl.filter(id=>!(c.before||[]).includes(id));
  if(d.p.ct!=="NC"&&lost.length&&!gained.length){const k=lost[0];showAlert("warn","Falta la retención",`${k.p.des||"El contactor"} se apagó al soltar ${d.p.des||"marcha"}. Conecta el auxiliar 13-14 del contactor en paralelo con el pulsador de marcha para que se quede encendido.`)}}
/* Toque corto sobre un componente de mando */
function compTap(d){const lab=d.p.des||CAT[d.type].n;
  if(d.type==="ovl"&&simState.trip.has("o"+d.id)){simState.trip.delete("o"+d.id);simState.log.unshift({lvl:"ok",msg:`Rearmaste el relé térmico ${lab}.`});hideAlert();renderAll();toast(`${lab}: rearmado.`);return}
  if(simState.running&&d.type==="emerg"){mutate(()=>{d.p.on=d.p.on===false});toast(d.p.on!==false?`${lab}: liberado (giraste el hongo).`:`${lab}: enclavado. Se abre el mando.`);return}
  if(simState.running&&d.type==="selector"){const o=sel3(d.p)?["Izquierda","Centro","Derecha"]:["Izquierda","Derecha"],i=o.indexOf(d.p.pos),nx=o[(i+1)%o.length];
    mutate(()=>{d.p.pos=nx});const L=String(d.p.lab).split("·").map(x=>x.trim());toast(`${lab}: posición ${sel3(d.p)?L[o.indexOf(nx)]:nx==="Izquierda"?L[0]:L[L.length-1]}.`);return}
  sel=d.id;pending=null;reconn=null;renderAll()}
/* Al soltar un cable sobre un aparato: elige el terminal que corresponde según lo que viene */
function pickTerm(it,fromId,py){const terms=allTerms(),from=terms.get(fromId);if(!from)return null;
  if(it.type==="panel"&&from.item.type==="supply"&&from.role==="F"){const j=["L1","L2","L3"].indexOf(from.key),M=itemTerms(it).filter(t=>t.mainIn!=null);if(M.length)return(M[j]||M[0]).id;return null}
  if(it.type==="panel"){const role=from.role==="N"?"N":from.role==="T"?"T":null;if(!role)return null;let best=null,d=1e9;
    for(const t of itemTerms(it))if(t.role===role&&t.srcId==null){const dy=Math.abs(t.y-(py??t.y));if(dy<d){d=dy;best=t.id}}return best}
  const mine=itemTerms(it).filter(t=>t.id!==fromId),used=id=>S.wall.wires.some(w=>w.a===id||w.b===id);
  const want=from.role==="N"?["N"]:from.role==="T"?["T"]:["S","F"];
  const ok=mine.filter(t=>want.includes(t.role)).sort((a,b)=>want.indexOf(a.role)-want.indexOf(b.role));
  return(ok.find(t=>!used(t.id))||ok[0]||{}).id||null}
function finishWireAt(x,y){const el=document.elementFromPoint(x,y);if(!el||!el.closest)return false;
  const t=el.closest(".wt");if(t){terminalClick(t.dataset.t);return true}
  const wb=el.closest(".wb");if(wb){const b=srcById(+wb.dataset.brk),from=allTerms().get(pending),toTop=from&&(from.item.type==="supply"||from.srcId!=null||from.lineOf!=null),id=b&&(toTop&&brkTopTerm(b,{clientX:x,clientY:y})||brkTerm(b,{clientX:x,clientY:y}));if(id){terminalClick(id);return true}}
  const wc=el.closest(".wc");if(wc){const d=S.items.find(i=>i.id===+wc.dataset.c),id=d&&compPin(d,{clientX:x,clientY:y});if(id){terminalClick(id);return true}}
  const wm=el.closest(".wm");if(wm){const P=S.wall.items.find(i=>i.type==="panel"),id=P&&pickTerm(P,pending,toWall({clientX:x,clientY:y}).y);if(id){terminalClick(id);return true}}
  const wi=el.closest(".wi");if(wi){const it=S.wall.items.find(i=>i.id===+wi.dataset.id),id=it&&pickTerm(it,pending,toWall({clientX:x,clientY:y}).y);if(id){terminalClick(id);return true}}
  return false}
function terminalClick(id){if(reconn){applyReconn(id);return}const terms=allTerms();if(!pending){pending=id;sel=null;renderAll();return}
  if(pending===id){pending=null;renderAll();return}
  const a=pending,b=id;pending=null;if(!linkOk(a,b,terms)){renderAll();return}
  const ta=terms.get(a),tb=terms.get(b),w={id:uid++,a,b,color:wColor==="Auto"?autoColor(ta,tb):wColor,awg:wAwg};mutate(()=>{S.wall.wires.push(w)});sel=w.id;renderAll()}
/* breakers dibujados en un aparato de la pared (sub-tablero y estabilizador): tocar enciende, apaga o rearma */
function wallBrkTap(it,k){const L=devLabel(it);
  if(it.type==="estab2"){if(k==="E"&&simState.trip.has("d"+it.id)){simState.trip.delete("d"+it.id);simState.log.unshift({lvl:"ok",msg:`Rearmaste el breaker de ${L}.`});runSim();renderAll();toast(`${L}: breaker rearmado.`);return}
    const key=k==="E"?"brkE":"brkB",on=k==="E"?it.p.brkE!=="Apagado":it.p.brkB==="Encendido";mutate(()=>{it.p[key]=on?"Apagado":"Encendido"});toast(`${L}: breaker ${k==="E"?"Estabilizador":"Bypass"} ${on?"apagado":"encendido"}.`);return}
  const b=subtBrks(it.p).find(x=>x.i===+k);if(!b)return;const tk=`s${it.id}.${b.i}`,nm=b.name||"Q"+b.i;
  if(simState.trip.has(tk)){simState.trip.delete(tk);simState.log.unshift({lvl:"ok",msg:`Rearmaste el breaker de ${nm} en ${L}.`});runSim();renderAll();toast(`${nm}: rearmado.`);return}
  mutate(()=>{it.p["on"+b.i]=!b.on});toast(`${nm}: ${b.on?"apagado":"encendido"}.`)}
wallEl.addEventListener("pointerdown",e=>{if(wallMode==="tube"&&!simState.running){tubeClick(e);return}
  const sb=e.target.closest(".wsb");if(sb&&!pending&&wallMode!=="meter"){const g=sb.closest(".wi"),it=g&&S.wall.items.find(i=>i.id===+g.dataset.id);if(it){sel=it.id;wallBrkTap(it,sb.dataset.b);return}}
  const tbh=e.target.closest(".tb");if(tbh&&!e.target.closest(".wt,.wb,.wbh,.wi,.ww,.wh")){sel=+tbh.dataset.id;pending=null;reconn=null;renderAll();return}
  const hd=e.target.closest(".wh");if(hd){reconn={id:sel,end:hd.dataset.end,moved:false,sx:e.clientX,sy:e.clientY};pending=null;renderWall();return}
  if(wallMode==="meter"){const tm=e.target.closest(".wt");if(tm)meterClick(tm.dataset.t);else if(!e.target.closest(".wc,.wbh"))toast("Toca un tornillo o borne con cada punta del multímetro.");if(tm||!e.target.closest(".wc,.wbh"))return}
  const t=e.target.closest(".wt");if(t){const had=pending;terminalClick(t.dataset.t);if(!had&&pending)wireDrag={sx:e.clientX,sy:e.clientY,moved:false};return}
  /* palanca: un toque enciende/apaga o rearma; si se arrastra, sale un cable desde esa protección */
  const hb=e.target.closest(".wbh");if(hb){const b=srcById(+hb.dataset.brk);if(!b)return;
    if(pending){const id=brkTerm(b,e);if(id)terminalClick(id);return}
    reconn=null;leverPress={id:b.id,sx:e.clientX,sy:e.clientY,rail:wallMode==="move"&&b.din};return}
  /* componentes del mando: pulsar, enclavar, girar o sacar un cable */
  const wc=e.target.closest(".wc");if(wc){const d=S.items.find(i=>i.id===+wc.dataset.c);if(!d)return;
    if(pending){const id=compPin(d,e);if(id)terminalClick(id);return}
    reconn=null;compPress={id:d.id,sx:e.clientX,sy:e.clientY,push:false,rail:wallMode==="move"};
    if(simState.running&&d.type==="push"){compPress.push=true;simState.pressed.add(d.id);renderAll()}
    return}
  const wb=e.target.closest(".wb");if(wb){const b=srcById(+wb.dataset.brk),id=b&&brkTerm(b,e);if(!id)return;
    /* en modo Mover, el componente del riel se arrastra a otro lugar del tablero */
    if(wallMode==="move"&&b.din&&!pending){reconn=null;leverPress={id:b.id,sx:e.clientX,sy:e.clientY,rail:true,noToggle:true};return}
    if(pending&&pending!==id){terminalClick(id);return}
    pending=null;terminalClick(id);wireDrag={sx:e.clientX,sy:e.clientY,moved:false,brk:b.id};return}
  if(e.target.closest(".wm")){if(pending){finishWireAt(e.clientX,e.clientY);return}if(simState.trip.has("main")){simState.trip.delete("main");simState.log.unshift({lvl:"ok",msg:"Rearmaste el principal."});runSim();renderAll();return}mutate(()=>{S.lc.mainOn=S.lc.mainOn===false});return}
  const ww=e.target.closest(".ww");if(ww){sel=+ww.dataset.id;pending=null;reconn=null;renderAll();return}
  const wi=e.target.closest(".wi");if(wi){const it=S.wall.items.find(i=>i.id===+wi.dataset.id);if(!it)return;
    if(pending&&!simState.running){const id=pickTerm(it,pending,toWall(e).y);if(id){terminalClick(id);return}}
    if(simState.running&&it.type==="inter"){mutate(()=>{it.p.on=!it.p.on});return}
    if(simState.running&&it.type==="inter3"){mutate(()=>{it.p.pos=it.p.pos===2?1:2});return}
    sel=it.id;pending=null;reconn=null;
    /* el aparato se arrastra en cualquier modo; los cables salen de sus tornillos */
    if(wallMode!=="meter"){const q=toWall(e),[cx,cy]=toPx(it.x,it.y);wdrag={id:it.id,dx:q.x-cx,dy:q.y-cy,moved:false,before:JSON.stringify(S),sx:e.clientX,sy:e.clientY};try{wallEl.setPointerCapture(e.pointerId)}catch(_){}}
    renderAll();return}
  /* fondo de la pared: arrastrar desplaza la vista */
  startPan(e);if(pending||sel||reconn){pending=null;sel=null;reconn=null;renderAll()}});
window.addEventListener("pointermove",e=>{
  if(railDrag){railMove(e);return}
  if(compPress&&!compPress.push&&compPress.rail&&Math.hypot(e.clientX-compPress.sx,e.clientY-compPress.sy)>tapTol){const cp=compPress;compPress=null;startRail(cp.id,cp.sx,cp.sy);railMove(e);return}
  if(leverPress&&leverPress.rail&&Math.hypot(e.clientX-leverPress.sx,e.clientY-leverPress.sy)>tapTol){const lp=leverPress;leverPress=null;startRail(lp.id,lp.sx,lp.sy);railMove(e);return}
  if(compPress&&!compPress.push&&Math.hypot(e.clientX-compPress.sx,e.clientY-compPress.sy)>tapTol){const d=S.items.find(i=>i.id===compPress.id),cp=compPress;compPress=null;const id=d&&compPin(d,{clientX:cp.sx,clientY:cp.sy});
    if(id){pending=null;terminalClick(id);wireDrag={sx:cp.sx,sy:cp.sy,moved:true}}}
  if(leverPress&&Math.hypot(e.clientX-leverPress.sx,e.clientY-leverPress.sy)>tapTol){const b=srcById(leverPress.id),lp=leverPress;leverPress=null;const id=b&&brkTerm(b,{clientX:lp.sx,clientY:lp.sy});
    if(id){pending=null;terminalClick(id);wireDrag={sx:lp.sx,sy:lp.sy,moved:true}}}
  if(wdrag){if(!wdrag.moved&&Math.hypot(e.clientX-wdrag.sx,e.clientY-wdrag.sy)<4)return;wdrag.moved=true;const it=S.wall.items.find(i=>i.id===wdrag.id),q=toWall(e),[x,y]=fromPx(q.x-wdrag.dx,q.y-wdrag.dy);
    it.x=x;it.y=y;clampItem(it);renderWall();ghost.hidden=false;ghost.textContent=`${fmtM2(it.x)} desde la izq. · altura ${fmtM2(it.y)}`;ghost.style.left=e.clientX+"px";ghost.style.top=e.clientY+"px";return}
  if(S.view!=="wall")return;
  if(wallMode==="tube"&&tubeDraft){const pv=$("wpv");if(pv){pv.setAttribute("pointer-events","none");pv.innerHTML=tubeDraftSvg(tubeSnap(toWall(e)))}return}
  const from=reconn?(()=>{const w=S.wall.wires.find(x=>x.id===reconn.id);return w&&allTerms().get(w[reconn.end==="a"?"b":"a"])})():pending?allTerms().get(pending):null;
  if(reconn&&!reconn.moved&&reconn.sx!=null&&Math.hypot(e.clientX-reconn.sx,e.clientY-reconn.sy)>4)reconn.moved=true;
  const pv=$("wpv");if(!pv||!from)return;const q=toWall(e);if(wireDrag&&!wireDrag.moved&&Math.hypot(e.clientX-wireDrag.sx,e.clientY-wireDrag.sy)>tapTol)wireDrag.moved=true;pv.setAttribute("pointer-events","none");pv.innerHTML=`<path d="M${from.x} ${from.y}L${q.x} ${q.y}" stroke="#1c74e0" stroke-width="3" stroke-dasharray="6 4" fill="none" opacity=".85"/>${C(q.x,q.y,6,"#1c74e0",{op:.6})}`});
window.addEventListener("pointercancel",()=>{if(compPress&&compPress.push)releasePush()});
window.addEventListener("pointerup",e=>{
  if(compPress){const c=compPress,d=S.items.find(i=>i.id===c.id);if(c.push){releasePush();return}compPress=null;if(!d)return;compTap(d);return}
  if(railDrag){railDrop();return}
  if(leverPress&&leverPress.noToggle){const id=leverPress.id;leverPress=null;pending=null;sel=id;renderAll();return}
  if(leverPress){const b=srcById(leverPress.id);leverPress=null;if(!b)return;pending=null;
    sel=b.id;/* queda seleccionado: la barra de abajo ofrece Encender/Apagar o Rearmar */
    if(simState.trip.has(b.id)){simState.trip.delete(b.id);simState.log.unshift({lvl:"ok",msg:`Rearmaste ${srcWho(b)}.`});runSim();renderAll();toast(`${b.short}: rearmado.`);return}
    mutate(()=>{b.p.on=b.p.on===false});toast(`${b.short}: ${b.p.on!==false?"encendido":"apagado"}.`);return}
  if(wireDrag&&!wireDrag.moved&&wireDrag.brk){const id=wireDrag.brk;wireDrag=null;pending=null;sel=id;renderAll();return}
  if(wireDrag){const d=wireDrag;wireDrag=null;if(d.moved&&pending){if(!finishWireAt(e.clientX,e.clientY))toast("Suelta el cable sobre un aparato o un tornillo. También puedes tocar el destino ahora.")}return}
  if(reconn&&reconn.moved){const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest&&el.closest(".wt");if(t)applyReconn(t.dataset.t);else{reconn=null;toast("Suelta la punta encima de un terminal.");renderAll()}return}
  if(reconn){reconn.sx=null;renderAll();return}
  if(!wdrag)return;const d=wdrag;wdrag=null;ghost.hidden=true;
  if(d.moved){hist.push(d.before);if(hist.length>100)hist.shift();fut=[];save();renderAll()}});
function wallKey(e){const mod=e.ctrlKey||e.metaKey;if(tubeDraft&&e.key==="Enter"){e.preventDefault();finishTube();return true}
  if(e.key==="Escape"){meterA=null;tubeDraft=null;pending=null;reconn=null;sel=null;renderAll();return true}
  if(!sel)return false;if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();wallDelete();return true}
  const it=S.wall.items.find(i=>i.id===sel);if(it&&/^Arrow/.test(e.key)){e.preventDefault();const st=.05,dx={ArrowLeft:-st,ArrowRight:st}[e.key]||0,dy={ArrowUp:st,ArrowDown:-st}[e.key]||0;mutate(()=>{it.x+=dx;it.y+=dy;clampItem(it)});return true}
  if(mod&&e.key.toLowerCase()==="d"&&it){e.preventDefault();$("pp-dup")&&$("pp-dup").click();return true}return false}
