/* =====================================================================
   calc.js — Calculadora: qué breaker, cable, tubo, arranque de motor,
   estabilizador, UPS, inversor y caja de breakers usar.
   Criterios prácticos para Venezuela (120/240 V y 208Y/120 V, 60 Hz),
   tomados de las reglas usuales del Código Eléctrico Nacional:
   · breaker ≥ 125 % de la corriente (carga continua) y cable que
     aguante el breaker; caída de tensión máxima 3 %;
   · motores con su corriente de placa (tablas NEC 430.248 / 430.250);
   · demanda de vivienda: 3000 W al 100 % y el resto de alumbrado y
     tomas al 35 %; equipos fijos al 100 % (75 % si son 4 o más).
   Es una guía para elegir; el proyecto final lo firma un profesional.
   ===================================================================== */
const CALC_APP=[
 ["Bombillo LED",10,120,"l"],["Bombillo incandescente 60 W",60,120,"r"],["Ventilador",70,120,"m"],["Televisor",150,120,"e"],["Computadora",300,120,"e"],
 ["Router y módem",20,120,"e"],["Cámaras y DVR",60,120,"e"],["Punto de venta",100,120,"e"],["Nevera",250,120,"m"],["Congelador",300,120,"m"],
 ["Lavadora",500,120,"m"],["Licuadora",600,120,"m"],["Cafetera",900,120,"r"],["Plancha",1200,120,"r"],["Microondas",1500,120,"r"],["Horno eléctrico",1500,120,"r"],
 ["Secador de pelo",1800,120,"r"],["Bomba de agua 1/2 HP",600,120,"m"],["Bomba de agua 1 HP",1100,240,"m"],["A/A 12.000 BTU",1300,240,"m"],["A/A 18.000 BTU",2000,240,"m"],
 ["A/A 24.000 BTU",2600,240,"m"],["Calentador de agua",4500,240,"r"],["Secadora de ropa",5000,240,"r"],["Cocina eléctrica",8000,240,"r"]];
const KIND_T={l:"iluminación",r:"resistencia",m:"motor",e:"electrónico"};
/* Cobre THHN: capacidad (60 °C hasta 100 A, 75 °C por encima) y resistencia en Ω/km */
const CABLE=[["14",15,8.28],["12",20,5.21],["10",30,3.28],["8",40,2.06],["6",55,1.30],["4",70,.815],["3",85,.646],["2",95,.513],["1",110,.407],["1/0",150,.323],["2/0",175,.256],["3/0",200,.203],["4/0",230,.161]];
const DIN_IN=[6,10,16,20,25,32,40,50,63];
const MOTOR_FLA={"1F 120 V":{"1/2":9.8,"3/4":13.8,"1":16,"1 1/2":20,"2":24},"1F 240 V":{"1/2":4.9,"3/4":6.9,"1":8,"1 1/2":10,"2":12,"3":17,"5":28},
 "3F 208 V":{"1/2":2.4,"3/4":3.5,"1":4.6,"1 1/2":6.6,"2":7.5,"3":10.6,"5":16.7,"7 1/2":24.2,"10":30.8,"15":46.2,"20":59.4}};
const MPCB_R=["0.63–1A","1–1.6A","1.6–2.5A","2.5–4A","4–6.3A","6–10A","9–14A","13–18A","17–23A","20–25A"];
const ICONT_IN=[9,12,18,25,32,40,50,65,80,95];
const STAB_KVA=[1,2,3,5,10,15,30],UPS_KVA=[1,1.5,2,3,6,10],INV_KW=[1,3,5,10];

let CALC={tab:"circ",circ:{rows:[["Microondas",1],["Licuadora",1]],dist:15,wet:true,V:"auto"},
  mot:{hp:"1",sys:"1F 240 V",dist:20},
  bk:{dev:"estab",rows:[["Nevera",1],["Televisor",1],["Computadora",1]],hours:4,bat:"Plomo-ácido / gel"},
  casa:{area:120,banos:2,lav:true,aa:{"A/A 12.000 BTU":2,"A/A 18.000 BTU":1,"A/A 24.000 BTU":0},cal:1,sec:0,coc:0,bomba:1}};

const appOf=n=>CALC_APP.find(a=>a[0]===n)||[n,100,120,"e"];
const firstGE=(list,v)=>list.find(x=>x>=v-1e-9);
const rangeHas=(r,I)=>{const [a,b]=String(r).replace("A","").split("–").map(parseFloat);return I>=a&&I<=b};
/* Cable que aguanta la protección y cumple la caída de tensión (3 %) */
function pickCable(In,I,L,V,tri){let k=Math.max(0,CABLE.findIndex(c=>c[1]>=In));if(k<0)k=CABLE.length-1;const lim=V*.03;let vd=0;
  for(;k<CABLE.length;k++){vd=(tri?Math.sqrt(3):2)*L*I*CABLE[k][2]/1000;if(vd<=lim)break}k=Math.min(k,CABLE.length-1);
  const byAmp=CABLE[Math.max(0,CABLE.findIndex(c=>c[1]>=In))][0];return{awg:CABLE[k][0],amp:CABLE[k][1],vd,pct:vd/V*100,bumped:CABLE[k][0]!==byAmp,byAmp}}
const tubeFor=(awg,n)=>{const i=CABLE.findIndex(c=>c[0]===awg);return i<=2?(n<=4?'1/2"':'3/4"'):i<=4?'3/4"':i<=7?'1"':'1 1/4"'};
const sumRows=rows=>rows.reduce((o,[n,q])=>{const a=appOf(n),W=a[1]*q;o.W+=W;o.list.push({n,q,W,V:a[2],k:a[3]});if(a[2]===240)o.v240=true;if(a[3]==="m")o.motor=Math.max(o.motor,a[1]);return o},{W:0,list:[],v240:false,motor:0});

/* ---------- 1) circuito: breaker, cable y tubo ---------- */
/* Carga continua (encendida 3 horas o más: luces, aires, bombas, calentador, electrónica) se cuenta al 125 %;
   los aparatos de cocina y de uso corto (microondas, licuadora, plancha…) al 100 % */
const SHORT=new Set(["Licuadora","Cafetera","Plancha","Microondas","Horno eléctrico","Secador de pelo","Lavadora","Secadora de ropa","Cocina eléctrica"]);
function calcCirc(c){const s=sumRows(c.rows),V=c.V==="auto"?(s.v240?(S.lc.sys==="1F"?240:208):120):+c.V,I=s.W/V,cont=s.list.filter(l=>!SHORT.has(l.n)).reduce((a,l)=>a+l.W,0)/V,des=I+cont*.25,poles=V===120?1:2,din=S.kind==="din";
  const In=din?(firstGE(DIN_IN,des)||63):(firstGE(BRK_IN,Math.max(15,des))||125),cab=pickCable(In,I,c.dist,V,false);
  const type=c.wet&&V===120?"GFCI":"Estándar",curve=s.motor||s.list.some(l=>l.k==="r")?"C":"B";
  const why=[`${fmtNum(s.W,0)} W ÷ ${V} V = ${fmtA(I)}.`,cont>0&&cont<I-1e-9?`Lo que queda encendido horas (${fmtA(cont)}) se cuenta al 125 % y lo de uso corto al 100 %: ${fmtA(des)} → breaker de ${In} A.`:cont>0?`Carga continua (encendida horas) al 125 %: ${fmtA(des)} → breaker de ${In} A.`:`Aparatos de uso corto, al 100 %: ${fmtA(des)} → breaker de ${In} A.`,
    `Cable #${cab.byAmp} aguanta ${CABLE.find(x=>x[0]===cab.byAmp)[1]} A ≥ ${In} A del breaker.`+(cab.bumped?` A ${c.dist} m caía más de 3 %: se sube a #${cab.awg}.`:""),
    `Caída de tensión a ${c.dist} m: ${fmtNum(cab.vd,1)} V (${fmtNum(cab.pct,1)} %).`];
  if(s.v240&&V===120)why.push("Ojo: hay equipos de 240 V en la lista; con 120 V no funcionan bien.");
  if(I>0&&s.list.some(l=>l.W>=3000)&&s.list.length>1)why.push("Los equipos grandes (calentador, secadora, cocina) llevan su propio circuito.");
  return{s,V,I,des,In,poles,cab,type,curve,din,tube:tubeFor(cab.awg,poles+2),why}}

/* ---------- 2) motor o bomba ---------- */
function calcMot(m){const tab=MOTOR_FLA[m.sys],hp=tab[m.hp]!=null?m.hp:Object.keys(tab)[0],F=tab[hp],tri=m.sys.startsWith("3F"),V=tri?208:m.sys.includes("120")?120:240,din=S.kind==="din";
  const lcIn=firstGE(BRK_IN,Math.max(15,F*1.75))||125,dinIn=firstGE(DIN_IN,F*1.25)||63,cab=pickCable(Math.max(F*1.25,din?dinIn:15),F,m.dist,V,tri);
  const mp=MPCB_R.find(r=>rangeHas(r,F)),ov=OVL.find(r=>rangeHas(r,F)),kc=firstGE(ICONT_IN,F)||95;
  return{hp,F,V,tri,din,lcIn,dinIn,cab,mp,ov,kc,poles:tri?3:V===120?1:2,tube:tubeFor(cab.awg,(tri?3:2)+1),kva:firstGE(STAB_KVA,F*V*(tri?Math.sqrt(3):1)*3/1000)||30,
    why:[`Corriente de placa (tabla NEC) de un motor de ${hp} HP a ${V} V ${tri?"trifásico":"monofásico"}: ${fmtA(F)}.`,
      `Al arrancar pide de 5 a 7 veces esa corriente unos segundos: por eso el breaker se elige más grande y la protección fina la da el relé térmico o el guardamotor.`,
      `Cable para 125 % de la corriente (${fmtA(F*1.25)}): #${cab.byAmp}${cab.bumped?`, y por la distancia (${m.dist} m) se sube a #${cab.awg}`:""}. Caída ${fmtNum(cab.pct,1)} %.`]}}

/* ---------- 3) estabilizador, UPS o inversor ---------- */
function calcBk(b){const s=sumRows(b.rows),pf=l=>l.k==="r"||l.k==="l"?1:l.k==="m"?.8:.9,VA=s.list.reduce((a,l)=>a+l.W/pf(l),0),start=s.motor?s.motor/.8*2:0,warn=[];
  const sys=s.v240?(S.lc.sys==="3F"?"Trifásico 208V":"Bifásico 240V"):"Monofásico 120V";
  if(b.dev==="estab"){const need=Math.max(VA*1.25,VA+start)/1000,k=firstGE(STAB_KVA,need)||30;
    if(s.list.some(l=>l.k==="r"&&l.W>=1500))warn.push("Las resistencias (calentador, plancha, microondas, cocina) no necesitan estabilizador: sácalas y te sale más pequeño.");
    return{dev:"estab",s,VA,k,sys,unit:"kVA",warn,why:[`Potencia aparente: ${fmtNum(VA,0)} VA (los motores con factor de potencia 0,8).`,`Margen del 25 %${start?` y el arranque del motor más grande (+${fmtNum(start,0)} VA)`:""}: ${fmtNum(need,2)} kVA → ${k} kVA.`,`Sistema: ${sys.toLowerCase()}${s.v240?" (hay equipos de 240 V)":""}.`]}}
  if(b.dev==="ups"){const need=VA/.6*1.25/1000/1.67,va=s.W/.6*1.25,k=firstGE(UPS_KVA,va/1000)||10;
    if(s.list.some(l=>l.k==="m"||l.k==="r"))warn.push("Las UPS son para equipos electrónicos (computadoras, router, cámaras, punto de venta). Neveras, bombas, A/A y resistencias van con inversor o estabilizador.");
    if(s.v240)warn.push("Las UPS comunes son de 120 V: los equipos de 240 V no se pueden conectar.");
    return{dev:"ups",s,VA:va,k,unit:"kVA",warn,why:[`${fmtNum(s.W,0)} W ÷ 0,6 (factor de las UPS) × 1,25 de margen = ${fmtNum(va,0)} VA → UPS de ${k} kVA.`,"Autonomía típica con la batería interna: 5 a 15 minutos a media carga, lo justo para guardar y apagar."]}}
  const kw0=s.W*1.25/1000,surge=s.motor?s.motor*3/1000:0,kw=firstGE(INV_KW,Math.max(kw0,surge/2))||10,dod=b.bat.startsWith("Litio")?.8:.5,Wh=s.W*b.hours/dod/.9;
  const bv=kw<=1.5?12:kw<=3?24:48,cell=b.bat.startsWith("Litio")?{n:"batería de litio 48 V 100 Ah",Wh:4800,V:48}:{n:"batería 12 V 200 Ah",Wh:2400,V:12};
  let n=Math.ceil(Wh/cell.Wh);if(cell.V===12){const ser=bv/12;n=Math.max(ser,Math.ceil(n/ser)*ser)}
  if(s.list.some(l=>l.k==="r"&&l.W>=1500))warn.push("Calentador, cocina, secadora, plancha o microondas gastan muchísima batería: mejor déjalos fuera del respaldo.");
  return{dev:"inv",s,kw,bv,n,cell,Wh,unit:"kW",warn,why:[`Consumo: ${fmtNum(s.W,0)} W. Inversor al 125 %: ${fmtNum(kw0,2)} kW${surge?`; el arranque del motor (${fmtNum(surge,1)} kW) debe caber en el pico del inversor (el doble de su potencia)`:""} → ${kw} kW.`,
    `Energía para ${b.hours} h: ${fmtNum(s.W*b.hours,0)} Wh. Con ${b.bat.toLowerCase()} se usa el ${Math.round(dod*100)} % y el inversor pierde un 10 %: ${fmtNum(Wh,0)} Wh de baterías.`,
    `Banco de ${bv} V: ${n} × ${cell.n} (${fmtNum(n*cell.Wh,0)} Wh).`]}}

/* ---------- 4) toda la casa: demanda, principal, acometida y circuitos ---------- */
function calcCasa(h){const tri=S.lc.sys==="3F",gen=h.area*33+1500*2+(h.lav?1500:0)+1500*h.banos,genD=gen<=3000?gen:3000+(gen-3000)*.35;
  const aa=Object.entries(h.aa).flatMap(([n,q])=>Array(+q||0).fill(n)),fixed=[...Array(+h.cal||0).fill("Calentador de agua"),...Array(+h.sec||0).fill("Secadora de ropa"),...Array(+h.coc||0).fill("Cocina eléctrica"),...Array(+h.bomba||0).fill("Bomba de agua 1 HP")];
  const fixW=fixed.reduce((a,n)=>a+appOf(n)[1],0),fixD=fixed.length>=4?fixW*.75:fixW,aaW=aa.reduce((a,n)=>a+appOf(n)[1],0),dem=genD+fixD+aaW,V=tri?208*Math.sqrt(3):240,I=dem/V;
  const main=MAINS.filter(m=>m>0).find(m=>m>=I*1.25)||225,ac=AWG[main]||"4/0";
  const circ=[],add=(name,poles,In,W,type="Estándar")=>circ.push({name,poles,In,W,type});
  const nl=Math.max(1,Math.ceil(h.area*33*.4/1440));for(let k=0;k<nl;k++)add(`Iluminación ${nl>1?k+1:""}`.trim(),1,15,Math.round(h.area*33*.4/nl));
  const nt=Math.max(1,Math.ceil(h.area/45));for(let k=0;k<nt;k++)add(`Tomas generales ${nt>1?k+1:""}`.trim(),1,20,1200);
  add("Tomas cocina 1",1,20,1500,"GFCI");add("Tomas cocina 2",1,20,1500,"GFCI");add("Nevera",1,20,700);if(h.lav)add("Lavadero",1,20,1500,"GFCI");
  for(let k=0;k<h.banos;k++)add(`Baño ${h.banos>1?k+1:""}`.trim(),1,20,1500,"GFCI");
  for(const n of [...aa,...fixed]){const a=appOf(n),Ia=a[1]/240,In=firstGE(BRK_IN,Math.max(20,Ia*(a[3]==="m"?1.75:1.25)));add(n,a[2]===240?2:1,In,a[1])}
  const poles=circ.reduce((a,c)=>a+c.poles,0),spaces=[12,16,20,24,30,40,42].find(x=>x>=Math.ceil(poles*1.2))||42;
  return{gen,genD,fixW,fixD,aaW,dem,I,main,ac,circ,poles,spaces,tri,why:[`Alumbrado y tomas: ${h.area} m² × 33 W/m² más cocina, lavadero y baños = ${fmtNum(gen,0)} W. Se cuentan 3000 W completos y el resto al 35 % (no todo se usa a la vez): ${fmtNum(genD,0)} W.`,
    `Equipos fijos (calentador, secadora, cocina, bomba): ${fmtNum(fixW,0)} W${fixed.length>=4?" al 75 % por ser 4 o más":" al 100 %"}. Aires: ${fmtNum(aaW,0)} W al 100 %.`,
    `Demanda: ${fmtNum(dem,0)} W ÷ ${tri?"(208 V × √3)":"240 V"} = ${fmtA(I)}. Principal al 125 %: ${main} A con acometida #${ac}.`,`Circuitos: ${circ.length} (${poles} espacios) + 20 % de reserva → caja de ${spaces} espacios.`]}}

/* ---------- pasar resultados al proyecto ---------- */
function calcAddBreaker(poles,In,type,name,curve="C"){
  if(S.kind==="lc"){if(poles===3&&S.lc.sys==="1F"){toast("Para 3 polos la caja debe ser trifásica.");return}const pos=lfirstFree(poles);if(!pos){toast("No quedan espacios libres en la caja.");return}
    const b={id:uid++,side:pos.side,slot:pos.slot,p:Object.assign({},BRK.d,{poles,In,type,name})};mutate(()=>{S.lc.items.push(b)});sel=b.id}
  else{const p=Object.assign({},CAT.mcb.d,{poles,In:firstGE(DIN_IN,In)||63,curve}),u=CAT.mcb.u(p),pos=firstFree(u,activeRow);if(!pos){toast("No queda lugar en el riel.");return}
    const it={id:uid++,type:"mcb",row:pos.row,x:pos.x,p:Object.assign(p,{des:nextDes("mcb"),name})};mutate(()=>{S.items.push(it)});sel=it.id}
  closeModal();if(S.view!=="board")setView("board");renderAll();toast(`Breaker ${poles}P ${In} A "${name}" agregado al tablero.`)}
function calcAddDin(list){let n=0;mutate(()=>{for(const [type,p,name] of list){const pp=Object.assign({},CAT[type].d,p),pos=firstFree(CAT[type].u(pp),activeRow);if(!pos)continue;S.items.push({id:uid++,type,row:pos.row,x:pos.x,p:Object.assign(pp,{des:nextDes(type),name})});n++}});
  closeModal();if(S.view!=="board")setView("board");renderAll();toast(n===list.length?`${n} componentes agregados al riel.`:`Solo cupieron ${n} de ${list.length}: suma una fila o más módulos.`)}
function calcAddExt(type,p){const x={id:uid++,type,p:Object.assign({},EXT[type].d,p,{name:""})};mutate(()=>{S.ext.push(x)});closeModal();if(S.view!=="board")setView("board");renderAll();toast(`${EXT[type].n} agregado debajo del tablero (y al presupuesto).`)}
function calcMakeBox(r){mutate(()=>{S.kind="lc";S.lc.spaces=r.spaces;S.lc.main=r.main;S.lc.items=[];
  for(const c of r.circ){const pos=lfirstFree(c.poles);if(!pos)break;S.lc.items.push({id:uid++,side:pos.side,slot:pos.slot,p:Object.assign({},BRK.d,{poles:c.poles,In:c.In,type:c.type,name:c.name,W:c.W})})}});
  closeModal();sel=null;if(S.view!=="board")setView("board");autoFit=true;fit();renderLib();renderAll();toast(`Caja de ${r.spaces} espacios con principal de ${r.main} A y ${r.circ.length} circuitos. Deshacer vuelve a la anterior.`)}

/* ---------- interfaz ---------- */
const cOpt=(list,cur,f=v=>v)=>list.map(v=>`<option value="${esc(v)}"${String(v)===String(cur)?" selected":""}>${esc(f(v))}</option>`).join("");
function rowsEditor(id,rows){return`<div class="c-rows">${rows.map(([n,q],i)=>`<div class="c-row"><select class="sel" data-r="${id}" data-i="${i}" data-k="n" aria-label="Equipo">${cOpt(CALC_APP.map(a=>a[0]),n,v=>{const a=appOf(v);return`${v} · ${a[1]} W · ${a[2]} V`})}</select>
  <input class="txt" type="number" min="1" max="50" value="${q}" data-r="${id}" data-i="${i}" data-k="q" aria-label="Cantidad"><button class="icon-btn" data-del="${id}" data-i="${i}" aria-label="Quitar ${esc(n)}">×</button></div>`).join("")}
  <button class="btn sm" data-add="${id}">+ Agregar equipo</button></div>`}
const big=(lab,val,sub="")=>`<div class="c-big"><span>${esc(lab)}</span><b>${esc(val)}</b>${sub?`<small>${esc(sub)}</small>`:""}</div>`;
const whyList=w=>`<details class="c-why" open><summary>Cómo se calculó</summary><ol>${w.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></details>`;
function calcDialog(){openModal(`<div class="calc"><div class="c-head"><h2>Calculadora</h2><button class="icon-btn" data-close aria-label="Cerrar">×</button></div>
  <div class="seg c-tabs" role="tablist">${[["circ","Circuito: breaker y cable"],["mot","Motor o bomba"],["bk","Estabilizador, UPS o inversor"],["casa","Toda la casa"]].map(([k,l])=>`<button class="segb" data-tab="${k}" aria-pressed="${CALC.tab===k}">${l}</button>`).join("")}</div>
  <div class="c-body" id="c-body"></div><p class="note">Guía con criterios usuales del Código Eléctrico Nacional para Venezuela. Para obras grandes o comerciales, el cálculo final lo firma un ingeniero.</p></div>`);
  $("dlg").classList.add("wide");$("dlg").onclick=calcClick;$("dlg").onchange=calcChange;$("dlg").oninput=e=>{if(e.target.type==="number")calcChange(e,true)};calcRender()}
function calcRender(){const b=$("c-body");if(!b)return;document.querySelectorAll(".c-tabs .segb").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.tab===CALC.tab)));let h="";
  if(CALC.tab==="circ"){const c=CALC.circ,r=calcCirc(c);
    h=`<div class="c-in"><h3>¿Qué vas a conectar en este circuito?</h3>${rowsEditor("circ",c.rows)}
      <div class="fields"><label class="field"><span>Tensión</span><select class="sel" data-f="circ.V">${cOpt(["auto","120","240","208"],c.V,v=>v==="auto"?"Automática":v+" V")}</select></label>
      <label class="field"><span>Distancia al tablero (m)</span><input class="txt" type="number" min="1" max="200" value="${c.dist}" data-f="circ.dist"></label></div>
      <label class="switch"><input type="checkbox" data-f="circ.wet"${c.wet?" checked":""}> Zona húmeda (baño, cocina, lavadero o exterior)</label></div>
    <div class="c-out">${r.s.W?`<div class="c-grid">${big("Breaker",`${r.poles}P ${r.In} A`,r.din?`Termomagnético curva ${r.curve}`:r.type==="GFCI"?"Tipo GFCI":"Estándar")}${big("Cable",`#${r.cab.awg} AWG`,`${r.poles===1?"Fase, neutro y tierra":"Dos fases y tierra"} · THHN`)}${big("Corriente",fmtA(r.I),`${fmtNum(r.s.W,0)} W a ${r.V} V`)}${big("Tubo",r.tube,"PVC")}</div>
      ${r.type==="GFCI"?`<p class="note">En zona húmeda la toma o el breaker deben ser <b>GFCI</b> (protegen a las personas contra descargas).</p>`:""}${whyList(r.why)}
      <div class="row-btns"><button class="btn primary" id="c-add">Agregar este breaker al tablero</button></div>`:`<p class="note">Agrega al menos un equipo.</p>`}</div>`}
  else if(CALC.tab==="mot"){const m=CALC.mot,r=calcMot(m),hps=Object.keys(MOTOR_FLA[m.sys]);
    h=`<div class="c-in"><h3>Datos del motor</h3><div class="fields"><label class="field"><span>Potencia (HP)</span><select class="sel" data-f="mot.hp">${cOpt(hps,r.hp,v=>v+" HP")}</select></label>
      <label class="field"><span>Alimentación</span><select class="sel" data-f="mot.sys">${cOpt(Object.keys(MOTOR_FLA),m.sys)}</select></label>
      <label class="field"><span>Distancia al tablero (m)</span><input class="txt" type="number" min="1" max="300" value="${m.dist}" data-f="mot.dist"></label></div>
      <p class="note">Mira la placa del motor: dice HP, voltaje y fases. Si dice la corriente (A o FLA), compárala con la que sale aquí.</p></div>
    <div class="c-out"><div class="c-grid">${big("Corriente del motor",fmtA(r.F),`${r.hp} HP · ${r.V} V`)}${big("Cable",`#${r.cab.awg} AWG`,`Caída ${fmtNum(r.cab.pct,1)} %`)}
      ${big(r.din?"Termomagnético":"Breaker",r.din?`${r.poles}P D${r.dinIn}`:`${r.poles}P ${r.lcIn} A`,r.din?"Curva D (arranque fuerte)":"Más grande por el arranque")}${big("Guardamotor",r.mp||"—","O breaker + relé térmico")}
      ${big("Contactor",`${r.kc} A AC-3`,`Bobina ${r.V===120?"120":r.tri?"208 (o 120 con neutro)":"240"} V`)}${big("Relé térmico",r.ov||"—","Ajústalo a "+fmtA(r.F))}</div>
      <p class="note">Si el motor va con estabilizador, necesita uno de <b>${r.kva} kVA</b> o más (por el arranque).</p>${whyList(r.why)}
      <div class="row-btns">${r.din?`<button class="btn primary" id="c-mot-din">Agregar arranque al riel (guardamotor, contactor y térmico)</button>`:""}<button class="btn${r.din?"":" primary"}" id="c-mot-brk">Agregar solo el breaker</button></div></div>`}
  else if(CALC.tab==="bk"){const k=CALC.bk,r=calcBk(k);
    h=`<div class="c-in"><h3>¿Qué equipo necesitas?</h3><div class="seg">${[["estab","Estabilizador"],["ups","UPS"],["inv","Inversor con baterías"]].map(([v,l])=>`<button class="segb" data-dev="${v}" aria-pressed="${k.dev===v}">${l}</button>`).join("")}</div>
      <p class="note">${{estab:"Corrige el voltaje alto o bajo. Para neveras, aires, bombas y electrónica.",ups:"Da unos minutos de respaldo para apagar con calma. Solo para electrónica.",inv:"Respaldo de horas en los apagones, con baterías."}[k.dev]}</p>
      <h3>¿Qué vas a proteger?</h3>${rowsEditor("bk",k.rows)}
      ${k.dev==="inv"?`<div class="fields"><label class="field"><span>Horas de respaldo</span><input class="txt" type="number" min="1" max="24" value="${k.hours}" data-f="bk.hours"></label><label class="field"><span>Baterías</span><select class="sel" data-f="bk.bat">${cOpt(["Plomo-ácido / gel","Litio (LiFePO4)"],k.bat)}</select></label></div>`:""}</div>
    <div class="c-out">${r.s.W?`<div class="c-grid">${r.dev==="inv"?big("Inversor",`${r.kw} kW`,`Banco de ${r.bv} V`)+big("Baterías",`${r.n} ×`,r.cell.n)+big("Consumo",`${fmtNum(r.s.W,0)} W`,`${k.hours} h = ${fmtNum(r.s.W*k.hours,0)} Wh`):big(r.dev==="ups"?"UPS":"Estabilizador",`${r.k} kVA`,r.dev==="estab"?r.sys:"Interactiva")+big("Consumo",`${fmtNum(r.s.W,0)} W`,`${fmtNum(r.VA,0)} VA`)}</div>
      ${r.warn.map(w=>`<p class="note c-warn">${esc(w)}</p>`).join("")}${whyList(r.why)}
      <div class="row-btns"><button class="btn primary" id="c-ext">Agregar al proyecto</button></div>`:`<p class="note">Agrega al menos un equipo.</p>`}</div>`}
  else{const c=CALC.casa,r=calcCasa(c),num=(f,v,max=20)=>`<input class="txt" type="number" min="0" max="${max}" value="${v}" data-f="${f}">`;
    h=`<div class="c-in"><h3>Datos de la vivienda</h3><div class="fields"><label class="field"><span>Área (m²)</span>${num("casa.area",c.area,2000)}</label><label class="field"><span>Baños</span>${num("casa.banos",c.banos)}</label></div>
      <label class="switch"><input type="checkbox" data-f="casa.lav"${c.lav?" checked":""}> Tiene lavadero</label>
      <h3>Equipos grandes (cantidad)</h3><div class="fields">${Object.keys(c.aa).map(n=>`<label class="field"><span>${esc(n)}</span>${num("casa.aa."+n,c.aa[n])}</label>`).join("")}
      <label class="field"><span>Calentador de agua</span>${num("casa.cal",c.cal)}</label><label class="field"><span>Secadora de ropa</span>${num("casa.sec",c.sec)}</label>
      <label class="field"><span>Cocina eléctrica</span>${num("casa.coc",c.coc)}</label><label class="field"><span>Bomba de agua 1 HP</span>${num("casa.bomba",c.bomba)}</label></div>
      <p class="note">Sistema del proyecto: ${esc(sysLabel())}. Cámbialo arriba en la vista Tablero si es trifásico.</p></div>
    <div class="c-out"><div class="c-grid">${big("Breaker principal",`${r.main} A`,`${r.tri?"3":"2"} polos`)}${big("Acometida",`#${r.ac} AWG`,r.tri?"3 fases + neutro":"2 fases + neutro")}${big("Demanda",`${fmtNum(r.dem/1000,1)} kW`,fmtA(r.I))}${big("Caja de breakers",`${r.spaces} espacios`,`${r.circ.length} circuitos`)}</div>
      <table class="c-tab"><thead><tr><th>Circuito</th><th>Breaker</th><th>Cable</th></tr></thead><tbody>${r.circ.map(x=>`<tr><td>${esc(x.name)}</td><td>${x.poles}P ${x.In} A${x.type!=="Estándar"?" "+x.type:""}</td><td>#${AWG[x.In]||"12"}</td></tr>`).join("")}</tbody></table>
      ${whyList(r.why)}<div class="row-btns"><button class="btn primary" id="c-box">Crear la caja de breakers con estos circuitos</button></div></div>`}
  b.innerHTML=h;
  const on=(id,f)=>{const el=$(id);if(el)el.onclick=f};
  on("c-add",()=>{const r=calcCirc(CALC.circ),nm=CALC.circ.rows.map(x=>x[0]).slice(0,2).join(" y ");calcAddBreaker(r.poles,r.In,r.type,nm,r.curve)});
  on("c-mot-brk",()=>{const r=calcMot(CALC.mot);calcAddBreaker(r.poles,r.din?r.dinIn:r.lcIn,"Estándar",`Motor ${r.hp} HP`,"D")});
  on("c-mot-din",()=>{const r=calcMot(CALC.mot),coil=r.V===120?"120V":r.tri?"208V":"240V",L=[];if(r.mp)L.push(["mpcb",{range:r.mp},`Motor ${r.hp} HP`]);else L.push(["mcb",{poles:r.poles,In:r.dinIn,curve:"D"},`Motor ${r.hp} HP`]);
    L.push(["icont",{In:r.kc,coil,aux:"1NA"},`Motor ${r.hp} HP`]);if(r.ov)L.push(["ovl",{range:r.ov},`Motor ${r.hp} HP`]);calcAddDin(L)});
  on("c-ext",()=>{const r=calcBk(CALC.bk);if(r.dev==="inv")calcAddExt("inv",{kw:firstGE(INV_KW,r.kw)||10,bat:firstGE([2,4,8],r.cell.V===12?r.n:r.n*4)||8});else calcAddExt(r.dev==="ups"?"ups":"estab",r.dev==="ups"?{kva:r.k}:{kva:r.k,sys:r.sys})});
  on("c-box",()=>calcMakeBox(calcCasa(CALC.casa)))}
function calcClick(e){const t=e.target;
  if(t.dataset.tab){CALC.tab=t.dataset.tab;calcRender();return}
  if(t.dataset.dev){CALC.bk.dev=t.dataset.dev;calcRender();return}
  if(t.dataset.add){const rows=CALC[t.dataset.add].rows;rows.push([CALC_APP[3][0],1]);calcRender();return}
  if(t.dataset.del){CALC[t.dataset.del].rows.splice(+t.dataset.i,1);calcRender();return}}
function calcChange(e,live){const t=e.target;
  if(live&&t.value==="")return;
  if(t.dataset.r){const row=CALC[t.dataset.r].rows[+t.dataset.i];if(t.dataset.k==="n")row[0]=t.value;else row[1]=Math.max(1,Math.min(50,+t.value||1))}
  else if(t.dataset.f){const path=t.dataset.f.split("."),last=path.pop();let o=CALC;for(const k of path)o=o[k];
    o[last]=t.type==="checkbox"?t.checked:t.type==="number"?Math.max(0,+t.value||0):t.value}
  else return;
  /* al escribir números se actualiza el resultado sin perder el cursor */
  const sel=t.dataset.f?`[data-f="${t.dataset.f}"]`:`[data-r="${t.dataset.r}"][data-i="${t.dataset.i}"][data-k="${t.dataset.k}"]`,pos=live?t.selectionStart:null;calcRender();
  if(live){const el=$("c-body").querySelector(sel);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(_){}}}}
