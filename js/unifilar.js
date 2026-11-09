/* =====================================================================
   unifilar.js — Diagrama unifilar del tablero de riel DIN y visor del
   unifilar dentro de la app (caja de breakers o riel DIN).
   · Se arma con el orden de los componentes en el riel, como se monta
     en la práctica: primero la entrada (medidor, seccionador, protector,
     breaker o contactor general), luego cada diferencial con los
     breakers que tiene a su derecha, y los arranques de motor
     (contactor + relé térmico) debajo de su breaker.
   · El supervisor y el supresor de picos se dibujan como derivaciones.
   ===================================================================== */
const UNI_INK="#1d2326",UNI_MUTED="#5b6266";
/* calibre sugerido para un breaker DIN (cobre THHN 75 °C, referencial) */
const dinAwg=In=>In<=15?"14":In<=20?"12":In<=30?"10":In<=40?"8":In<=55?"6":In<=70?"4":In<=85?"3":"2";
const dinSpec=it=>{const p=it.p;switch(it.type){
  case"mcb":return`${p.poles}P ${p.curve}${p.In} · ${p.kA} kA`;case"rcd":return`${p.poles}P ${p.In} A · ${p.sens}`;case"sw":return`${p.poles}P ${p.In} A`;
  case"mpcb":return`Ajuste ${p.range}`;case"icont":return`${p.In} A AC-3 · bobina ${p.coil}`;case"cont":return`${p.In} A · bobina ${p.coil}`;case"ovl":return`Ajuste ${p.range}`;
  case"prot":return`${p.In} A · alto/bajo voltaje`;case"supv":return p.sys;case"spd":return`T2 ${p.Imax} kA`;case"meter":return p.ph;default:return""}};
const dinTag=it=>[it.p.des,it.p.name].filter(Boolean).join(" · ")||CAT[it.type].n;

/* Ordena el riel y reparte los componentes en entrada, derivaciones, circuitos y mando */
function dinUniPlan(){const its=[...S.items].sort((a,b)=>a.row-b.row||a.x-b.x);
  const gen=[],side=[],other=[],groups=[];let grp=null,leaf=null,started=false;
  const hasRcd=its.some(i=>i.type==="rcd"),firstMcb=its.find(i=>i.type==="mcb");
  for(const it of its){const t=it.type;
    if(t==="meter"||t==="sw"||t==="prot"){if(!started){gen.push(it);continue}other.push(it);continue}
    if(t==="spd"||t==="supv"){side.push(it);continue}
    if(t==="rcd"){started=true;grp={rcd:it,leaves:[]};groups.push(grp);leaf=null;continue}
    if(t==="mcb"||t==="mpcb"){
      /* un breaker antes de los diferenciales, o llamado "general", es el principal */
      if(!started&&t==="mcb"&&it===firstMcb&&(hasRcd||/general|princip/i.test(it.p.name||""))){gen.push(it);continue}
      started=true;leaf={it,chain:[]};if(!grp){grp={rcd:null,leaves:[]};groups.push(grp)}grp.leaves.push(leaf);continue}
    if(t==="icont"||t==="cont"){
      if(!started&&/general|princip/i.test(it.p.name||"")&&!gen.some(g=>g.type==="icont"||g.type==="cont")){gen.push(it);continue}
      /* el arranque va debajo del último breaker de 3 polos (o del último breaker) que no tenga contactor */
      const free=groups.flatMap(g=>g.leaves).filter(l=>l.it&&!l.chain.some(c=>c.type==="icont"||c.type==="cont")),tgt=[...free].reverse().find(l=>l.it.p.poles===3||l.it.type==="mpcb")||free[free.length-1];
      if(tgt){tgt.chain.push(it);continue}
      /* contactor sin breaker propio: circuito directo desde la barra */
      started=true;leaf={it:null,chain:[it]};if(!grp){grp={rcd:null,leaves:[]};groups.push(grp)}grp.leaves.push(leaf);continue}
    if(t==="ovl"){const all=groups.flatMap(g=>g.leaves),tgt=[...all].reverse().find(l=>l.chain.some(c=>c.type==="icont"||c.type==="cont")&&!l.chain.some(c=>c.type==="ovl"));
      if(tgt){tgt.chain.push(it);continue}if(!started){gen.push(it);continue}}
    if(t!=="blank")other.push(it)}
  return{gen,side,other,groups}}

function dinUnifilarSvg(){const P=dinUniPlan(),ink=UNI_INK,line=`stroke="${ink}" stroke-width="2" fill="none"`;
  const tx=(x,y,s,o={})=>T(x,y,s,Object.assign({ff:SANS,fw:400,c:ink,a:"start",fs:10},o));
  /* símbolos (origen arriba, 38 de alto) */
  const brk=(x,y)=>`<path d="M${x} ${y}v8M${x} ${y+8}l13 20M${x} ${y+30}v8" ${line}/><path d="M${x-4} ${y+4}l8 8M${x+4} ${y+4}l-8 8" stroke="${ink}" stroke-width="1.6"/>`;
  const swc=(x,y)=>`<path d="M${x} ${y}v8M${x} ${y+8}l13 20M${x} ${y+30}v8" ${line}/><path d="M${x-5} ${y+8}h10" stroke="${ink}" stroke-width="1.6"/>`;
  const kmc=(x,y)=>`<path d="M${x} ${y}v8M${x} ${y+8}l13 20M${x} ${y+30}v8" ${line}/><path d="M${x-5} ${y+8}a5 5 0 0 1 10 0" ${line}/>`;
  const rcdS=(x,y)=>brk(x,y)+`<ellipse cx="${x+26}" cy="${y+19}" rx="9" ry="6" fill="#fff" stroke="${ink}" stroke-width="1.6"/><path d="M${x+6} ${y+19}h11" stroke="${ink}" stroke-width="1.2" stroke-dasharray="3 2"/>`+T(x+26,y+22,"IΔ",{fs:7,ff:SANS,fw:700,c:ink});
  const boxS=(x,y,t)=>`<path d="M${x} ${y}v7M${x} ${y+31}v7" ${line}/>`+R(x-15,y+7,30,24,"#fff",{s:ink,sw:2})+T(x,y+23,t,{fs:9,ff:SANS,fw:700,c:ink});
  const ovlS=(x,y)=>`<path d="M${x} ${y}v7M${x} ${y+31}v7" ${line}/>`+R(x-13,y+7,26,24,"#fff",{s:ink,sw:2})+`<path d="M${x} ${y+9}v4h-5v6h10v6h-5v4" ${line}/>`;
  const sym={meter:(x,y)=>boxS(x,y,"kWh"),sw:swc,prot:(x,y)=>boxS(x,y,"U<>"),mcb:brk,icont:kmc,cont:kmc,ovl:ovlS};
  const x0=70,cw=132,perRow=8;
  /* hojas (circuitos) en orden, con su grupo */
  const leaves=[];P.groups.forEach((g,gi)=>g.leaves.forEach(l=>leaves.push(Object.assign(l,{g:gi}))));
  const rows=Math.max(1,Math.ceil(leaves.length/perRow)),W=Math.max(820,x0+80+Math.min(perRow,Math.max(1,leaves.length))*cw);
  let s=tx(30,34,"DIAGRAMA UNIFILAR",{fs:18,fw:700})+tx(30,54,`${S.project.name} · tablero de riel DIN · ${S.lc.sys==="3F"?"208Y/120 V 3Φ":"120/240 V 1Φ"} · 60 Hz`,{c:UNI_MUTED});
  s+=C(x0,92,15,"#fff",{s:ink,sw:2})+`<path d="M${x0-8} 92q4 -8 8 0t8 0" ${line}/>`+tx(x0+26,88,"Alimentación",{fw:600})+tx(x0+26,102,S.lc.sys==="3F"?"208Y/120 V · 3 fases + neutro + tierra":"120/240 V · 2 fases + neutro + tierra",{c:UNI_MUTED});
  let y=107;
  for(const it of P.gen){s+=`<path d="M${x0} ${y}V${y+13}" ${line}/>`+(sym[it.type]||((x,yy)=>boxS(x,yy,"?")))(x0,y+13)+tx(x0+30,y+30,dinTag(it),{fw:600})+tx(x0+30,y+43,dinSpec(it),{fs:9,c:UNI_MUTED});y+=51}
  /* derivaciones: supresor de picos a tierra y supervisor de voltaje */
  const kmGen=P.gen.find(i=>i.type==="icont"||i.type==="cont");
  for(const it of P.side){s+=`<path d="M${x0} ${y}V${y+58}" ${line}/>`;const yb=y+14;
    s+=`<path d="M${x0} ${yb}H${x0+250}V${yb+8}" ${line}/>`+C(x0,yb,3,ink);
    if(it.type==="spd")s+=R(x0+238,yb+8,24,26,"#fff",{s:ink,sw:2})+`<path d="M${x0+250} ${yb+12}v14M${x0+246} ${yb+21}l4 5 4-5" ${line}/><path d="M${x0+250} ${yb+34}v8M${x0+240} ${yb+42}h20M${x0+244} ${yb+46}h12M${x0+248} ${yb+50}h4" ${line}/>`;
    else s+=R(x0+234,yb+8,32,26,"#fff",{s:ink,sw:2})+T(x0+250,yb+25,"U",{fs:10,ff:SANS,fw:700,c:ink});
    s+=tx(x0+274,yb+18,dinTag(it),{fw:600})+tx(x0+274,yb+31,it.type==="spd"?`Supresor de picos ${dinSpec(it)}, descarga a tierra`:`Supervisor ${dinSpec(it).replace(/^\S+/,w=>w.toLowerCase())}`,{fs:9,c:UNI_MUTED})+(it.type==="supv"?tx(x0+274,yb+43,kmGen?`Manda la bobina de ${kmGen.p.des||"KM"}`:"Abre su relé si el voltaje sale de rango",{fs:9,c:UNI_MUTED}):"");y+=58}
  /* otros componentes (mando, señalización, accesorios) a la derecha */
  if(P.other.length){const ox=Math.max(x0+530,W-250);s+=tx(ox,86,"Mando, señalización y accesorios:",{fw:600,fs:9.5});
    P.other.slice(0,9).forEach((it,i)=>s+=tx(ox,101+i*13,cutText(`${it.p.des?it.p.des+" ":""}${CAT[it.type].n}${it.p.name?" · "+it.p.name:""}`,44),{fs:9,c:"#3a4044"}));
    if(P.other.length>9)s+=tx(ox,101+9*13,`y ${P.other.length-9} más`,{fs:9,c:UNI_MUTED})}
  const yA=y;y=Math.max(y+12,P.other.length?110+Math.min(10,P.other.length)*13:0);
  /* barras y circuitos */
  const top=y+20,rh=380,H=top+rows*rh;s+=`<path d="M${x0} ${yA}V${top}" ${line}/>`;
  if(!leaves.length)s+=`<path d="M${x0} ${top}H${x0+120}" stroke="${ink}" stroke-width="4"/>`+tx(x0+20,top+30,"El tablero todavía no tiene breakers de circuitos.",{c:UNI_MUTED});
  for(let r=0;r<rows;r++){const by=top+r*rh,row=leaves.slice(r*perRow,(r+1)*perRow),X=i=>x0+80+i*cw;
    if(!row.length)break;s+=`<path d="M${x0} ${by}H${X(row.length-1)}" stroke="${ink}" stroke-width="4"/>`;if(r)s+=`<path d="M${x0} ${by-rh}V${by}" stroke="${ink}" stroke-width="4"/>`;
    /* tramos de cada grupo en esta fila */
    const segs=[];row.forEach((l,i)=>{const z=segs[segs.length-1];if(z&&z.g===l.g)z.b=i;else segs.push({g:l.g,a:i,b:i})});
    for(const z of segs){const g=P.groups[z.g],xa=X(z.a),xb=X(z.b);
      if(g.rcd){const xm=(xa+xb)/2,cont=r>0&&leaves[r*perRow-1]&&leaves[r*perRow-1].g===z.g;
        s+=`<path d="M${xm} ${by}V${by+16}" ${line}/>`+rcdS(xm,by+16)+`<path d="M${xm} ${by+54}V${by+78}" ${line}/>`+`<path d="M${xa} ${by+78}H${xb}" stroke="${ink}" stroke-width="3"/>`;
        s+=tx(xm+40,by+30,(g.rcd.p.des||"ID")+(cont?" (cont.)":""),{fw:700,fs:9.5})+tx(xm+40,by+43,dinSpec(g.rcd),{fs:8.5,c:UNI_MUTED});
        for(let i=z.a;i<=z.b;i++)s+=`<path d="M${X(i)} ${by+78}V${by+100}" ${line}/>`}
      else for(let i=z.a;i<=z.b;i++)s+=`<path d="M${X(i)} ${by}V${by+100}" ${line}/>`}
    row.forEach((l,i)=>{const x=X(i),it=l.it,h0=it||l.chain[0],In=!it?(h0.p.In||16):it.type==="mpcb"?parseFloat(String(it.p.range).split("–")[1])||10:it.p.In,np=it?(it.p.poles||3):(h0.type==="icont"?3:2);
      if(it)s+=(it.type==="mpcb"?boxS(x,by+100,"M"):brk(x,by+100))+tx(x+16,by+118,it.p.des||"Q",{fw:700})+tx(x+16,by+131,it.type==="mpcb"?it.p.range:`${np}P ${it.p.curve}${it.p.In}`,{fs:9});
      else s+=`<path d="M${x} ${by+100}V${by+138}" ${line}/>`+tx(x+10,by+118,"Sin breaker",{fw:700,fs:9,c:"#b5521d"})+tx(x+10,by+131,"propio",{fs:9,c:"#b5521d"});
      let yy=by+138;const nC=np>=3?4:np===2?3:2;
      s+=`<path d="M${x} ${yy}V${yy+34}" ${line}/>`;for(let j=0;j<nC;j++)s+=`<path d="M${x-6} ${yy+14+j*6}l12 -5" stroke="${ink}" stroke-width="1.5"/>`;
      s+=tx(x+10,yy+22,cabTxt(In),{fs:9});yy+=34;
      for(const c of l.chain){s+=(sym[c.type]||brk)(x,yy)+tx(x+18,yy+18,c.p.des||"",{fw:700,fs:9})+tx(x+18,yy+30,c.type==="ovl"?c.p.range:`${c.p.In} A`,{fs:8.5,c:UNI_MUTED});yy+=38}
      const motor=l.chain.some(c=>c.type==="icont"||c.type==="ovl")||(it&&it.type==="mpcb");
      if(motor){s+=`<path d="M${x} ${yy}V${yy+10}" ${line}/>`+C(x,yy+28,18,"#fff",{s:ink,sw:2})+T(x,yy+27,"M",{fs:11,ff:SANS,fw:700,c:ink})+T(x,yy+38,np>=3?"3~":"1~",{fs:8,ff:SANS,c:ink});yy+=46}
      s+=`<path d="M${x} ${yy}V${by+300}" ${line}/>`;
      const [l1,l2]=wrap2(h0.p.name||"Sin nombre",16);
      s+=R(x-56,by+300,112,52,"#fff",{rx:4,s:ink,sw:1.6})+T(x,by+318,l1,{fs:9.5,ff:SANS,fw:600,c:ink})+(l2?T(x,by+331,l2,{fs:9.5,ff:SANS,fw:600,c:ink}):"")+T(x,by+(l2?345:336),motor?"Motor":`${np===1?120:S.lc.sys==="3F"?208:240} V`,{fs:9,ff:SANS,c:UNI_MUTED})})}
  s+=tx(30,H-6,"Generado por orden de montaje en el riel. Revisa que coincida con el cableado real.",{fs:8.5,c:UNI_MUTED});
  return{svg:s,W,H:H+4}}

/* unifilar del tipo de tablero que esté abierto */
const uniSvg=()=>S.kind==="lc"?unifilarSvg():dinUnifilarSvg();
function showUnifilar(){const u=uniSvg();showPng(u.svg,u.W,u.H,"Diagrama unifilar","Se genera solo con lo que tienes en el tablero. También sale en el PDF. Haz clic derecho sobre la imagen para guardarla (en el teléfono, mantenla presionada).")}
$("uni").onclick=showUnifilar;
