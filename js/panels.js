/* ---------- library ---------- */
const curLib=()=>S.kind==="lc"?LIB_LC:LIB_DIN;
let lcBuild={poles:1,In:20,type:"Estándar"};
function libInfo(k){if(k==="b")return{lc:true,label:`Breaker ${lcBuild.poles}P ${lcBuild.In} A${lcBuild.type!=="Estándar"?" "+lcBuild.type:""}`,p:Object.assign({},BRK.d,lcBuild)};
  if(k[0]==="a"){const [a,b]=k.slice(1).split(".").map(Number),e=LIB_AUX[a][1][b];return{aux:true,type:e[0],label:e[1],ov:e[2],p:Object.assign({},CAT[e[0]].d,e[2])}}
  if(k[0]==="w"){const t=k.slice(1);return{wall:true,type:t,label:DEV[t].n,p:Object.assign({},DEV[t].d||{})}}
  if(k[0]==="x"){const [a,b]=k.slice(1).split(".").map(Number),e=LIB_EXT[a][1][b];return{ext:true,type:e[0],label:e[1],p:Object.assign({},EXT[e[0]].d,e[2])}}
  const [a,b]=k.split(".").map(Number),e=curLib()[a][1][b];
  if(S.kind==="lc")return{lc:true,label:e[0],p:Object.assign({},BRK.d,e[1])};
  return{lc:false,type:e[0],label:e[1],ov:e[2],p:Object.assign({},CAT[e[0]].d,e[2])}}
function thumb(info){if(info.aux){const {w,svg}=drawComp(info.type,info.p);return`<svg viewBox="-3 -3 ${w+6} ${CH+8}" aria-hidden="true"><g filter="url(#sh)">${svg}</g></svg>`}
  if(info.ext){const {w,h,svg}=drawExt(info.type,info.p);return`<svg viewBox="-3 -3 ${w+6} ${h+12}" aria-hidden="true"><g filter="url(#sh)">${svg}</g></svg>`}
  if(info.lc){const h=info.p.poles*SL;return`<svg viewBox="-3 -3 ${BW+6} ${h+8}" aria-hidden="true"><g filter="url(#sh)">${brkSvg(Object.assign({},info.p,{name:info.p.type!=="Estándar"?info.p.type:""}),false,brkV(info.p))}</g></svg>`}
  const {w,svg}=drawComp(info.type,info.p);return`<svg viewBox="-3 -3 ${w+6} ${CH+8}" aria-hidden="true"><g filter="url(#sh)">${svg}</g></svg>`}
function renderLib(){if(S.view==="wall")return renderWallLib();const q=$("q").value.trim().toLowerCase(),lib=curLib();let h="";
  $("libTitle").textContent=S.kind==="lc"?"Breakers enchufables":"Componentes riel DIN";$("q").placeholder=S.kind==="lc"?"Buscar: 20A, GFCI, 2P…":"Buscar: supervisor, contactor, relé…";
  if(S.kind==="lc"&&!q){if(lcBuild.poles===3&&S.lc.sys==="1F")lcBuild.poles=2;const bi=libInfo("b"),sel3=(id,lab,opts,cur,fmt=v=>v)=>`<label class="field"><span>${lab}</span><select class="sel" id="${id}">${opts.map(v=>`<option value="${v}"${String(v)===String(cur)?" selected":""}>${fmt(v)}</option>`).join("")}</select></label>`;
    h+=`<div class="cat">Arma tu breaker</div><div class="builder"><div class="fields">${sel3("bd-po","Polos",S.lc.sys==="1F"?[1,2]:[1,2,3],lcBuild.poles,v=>v+(v>1?" polos":" polo"))}${sel3("bd-in","Amperaje",BRK_IN,lcBuild.In,v=>v+" A")}${sel3("bd-ty","Tipo",["Estándar","GFCI","AFCI"],lcBuild.type)}</div>
     <div class="li wide" tabindex="0" role="button" data-lib="b">${thumb(bi)}<b>${esc(bi.label)}</b><span>Arrástralo a la caja o tócalo · $ ${fmtNum(brkPrice(bi.p),0)}</span></div>
     <p class="note">También puedes tocar cualquier espacio con <b>+</b> en la caja: se pone este breaker ahí.</p></div>`}
  const groups=[...lib.map((g,ci)=>[g,ci,""]),...(S.kind==="lc"?LIB_AUX.map((g,ci)=>[g,ci,"a"]):[]),...LIB_EXT.map((g,ci)=>[g,ci,"x"])];
  groups.forEach(([[cat,list],ci,pre])=>{const items=list.map((e,ei)=>({k:pre+ci+"."+ei,info:libInfo(pre+ci+"."+ei)})).filter(({info})=>!q||(info.label+" "+cat+" "+(info.ext?EXT[info.type].n:info.lc?"breaker interruptor":CAT[info.type].n)).toLowerCase().includes(q));if(!items.length)return;
   h+=`<div class="cat">${esc(cat)}</div><div class="lib-grid">`+items.map(({k,info})=>{let meta;
    if(info.ext)meta="$ "+fmtNum(EXT[info.type].price(info.p),0);
    else if(info.lc)meta=info.p.poles+(info.p.poles>1?" esp.":" esp.")+" · $ "+fmtNum(brkPrice(info.p),0);
    else{const u=CAT[info.type].u(info.p);meta=fmtM(u/2)+" mód · $ "+fmtNum(PRICE_DIN[info.type](info.p),0)}
    const isNew=info.aux||info.ext||(!info.lc&&NEW.has(info.type));
    return`<div class="li${info.lc?" wide":""}" tabindex="0" role="button" data-lib="${k}">${thumb(info)}<b>${esc(info.label)}</b><span>${meta}</span>${isNew?`<span class="tag-new">Nuevo</span>`:""}<button class="li-info" data-info="${info.lc?infoKey("brk",{p:info.p}):info.type}" aria-label="Ver ficha de ${esc(info.label)}" title="¿Qué es?">i</button></div>`}).join("")+`</div>`});
  $("libList").innerHTML=h||`<p class="note" style="padding:8px 4px">Nada coincide con "${esc(q)}".</p>`;libChips();
  [["bd-po","poles",Number],["bd-in","In",Number],["bd-ty","type",String]].forEach(([id,k,f])=>{const el=$(id);if(el)el.onchange=()=>{lcBuild[k]=f(el.value);renderLib()}})}
/* Accesos rápidos a cada categoría de la biblioteca */
function libChips(){const list=$("libList"),cats=[...list.querySelectorAll(".cat")];cats.forEach((c,i)=>c.id="libcat"+i);
  $("libCats").innerHTML=cats.length>1?cats.map((c,i)=>`<button class="catb" data-i="${i}">${esc(c.textContent)}</button>`).join(""):"";
  $("libCats").querySelectorAll(".catb").forEach(b=>b.onclick=()=>{const el=$("libcat"+b.dataset.i);list.scrollTo({top:el.offsetTop-6,behavior:"smooth"})})}

/* ---------- side panels ---------- */
function opt(v,cur){return`<option value="${esc(v)}"${String(v)===String(cur)?" selected":""}>${esc(v)}</option>`}
const fmtM=n=>String(n).replace(".5","½").replace(/^0½/,"½");
const fmtA=a=>a.toFixed(1).replace(".",",")+" A";
function projFields(){return`<h3>Rótulo del plano</h3><div class="fields">
   <label class="field wide"><span>Proyecto</span><input class="txt" id="pj-name" value="${esc(S.project.name)}"></label>
   <label class="field wide"><span>Cliente / obra</span><input class="txt" id="pj-client" value="${esc(S.project.client)}"></label>
   <label class="field"><span>Dibujó</span><input class="txt" id="pj-author" value="${esc(S.project.author)}" placeholder="Tu nombre"></label>
   <label class="field"><span>Fecha</span><input class="txt" id="pj-date" value="${esc(S.project.date)}"></label></div>`}
function bindProj(){["name","client","author","date"].forEach(k=>{const el=$("pj-"+k);el.addEventListener("change",()=>mutate(()=>{S.project[k]=el.value}))})}
function renderProps(){if(S.view==="wall")return renderPropsWall();const x=selExt();if(x)return renderPropsExt(x);const ax=selAux();if(ax)return renderPropsAux(ax);S.kind==="lc"?renderPropsLC():renderPropsDIN()}
function renderPropsExt(x){const c=EXT[x.type],P=$("paneP");
  P.innerHTML=`<div><h2>${esc(c.n)}</h2><div class="meta">Equipo externo · precio sugerido ${fmtUSD(c.price(x.p))}</div></div>
   <div class="fields"><label class="field wide"><span>Nombre / qué alimenta</span><input class="txt" id="pp-name" value="${esc(x.p.name)}"></label>
   ${c.f.map(([k,l,o])=>`<label class="field"><span>${esc(l)}</span><select class="sel" id="pp-${k}">${o.map(v=>opt(v,x.p[k])).join("")}</select></label>`).join("")}</div>
   ${c.st?`<label class="switch"><input type="checkbox" id="pp-on"${x.p.on?" checked":""}> ${esc(c.st)}</label>`:""}
   <p class="note">${esc(c.desc(x.p))}. ${esc(c.tip)}</p>${infoCard(x.type)}
   <div class="row-btns"><button class="btn" id="pp-left">← Mover</button><button class="btn" id="pp-right">Mover →</button><button class="btn" id="pp-dup">Duplicar</button><button class="btn danger" id="pp-del">Eliminar</button></div>`;
  $("pp-name").addEventListener("change",e=>mutate(()=>{x.p.name=e.target.value}));
  c.f.forEach(([k,,o])=>$("pp-"+k).addEventListener("change",e=>{const v=typeof o[0]==="number"?Number(e.target.value):e.target.value;mutate(()=>{x.p[k]=v})}));
  if(c.st)$("pp-on").addEventListener("change",e=>mutate(()=>{x.p.on=e.target.checked}));
  $("pp-left").onclick=()=>moveExt(-1);$("pp-right").onclick=()=>moveExt(1);$("pp-dup").onclick=dup;$("pp-del").onclick=del}
function renderPropsAux(it){const P=$("paneP"),c=CAT[it.type],u=units(it);
  let f=`<label class="field"><span>Designación</span><input class="txt" id="pp-des" value="${esc(it.p.des)}"></label><label class="field"><span>Función</span><input class="txt" id="pp-name" value="${esc(it.p.name)}"></label>`;
  c.f.forEach(([k,l,o])=>{f+=o==="text"?`<label class="field"><span>${esc(l)}</span><input class="txt" id="pp-${k}" value="${esc(it.p[k])}"></label>`:`<label class="field"><span>${esc(l)}</span><select class="sel" id="pp-${k}">${o.map(v=>opt(v,it.p[k])).join("")}</select></label>`});
  P.innerHTML=`<div><h2>${esc(c.n)}</h2><div class="meta">Riel auxiliar de la caja · ${fmtM(u/2)} mód · $ ${fmtNum(PRICE_DIN[it.type](it.p))}</div></div>
   <div class="fields">${f}</div>${c.st?`<label class="switch"><input type="checkbox" id="pp-on"${it.p.on?" checked":""}> ${esc(c.st)}</label>`:""}
   <p class="note">${esc(c.desc(it.p))}. Va montado en el riel auxiliar dentro de la caja de breakers.</p>${infoCard(it.type)}
   <div class="row-btns"><button class="btn" id="pp-left">← Mover</button><button class="btn" id="pp-right">Mover →</button><button class="btn" id="pp-dup">Duplicar</button><button class="btn danger" id="pp-del">Eliminar</button></div>`;
  ["des","name"].forEach(k=>$("pp-"+k).addEventListener("change",e=>mutate(()=>{it.p[k]=e.target.value})));
  c.f.forEach(([k,,o])=>$("pp-"+k).addEventListener("change",e=>{const v=Array.isArray(o)&&typeof o[0]==="number"?Number(e.target.value):e.target.value,old=it.p[k];it.p[k]=v;const nu=units(it);
    const x=auxFits(it.x,nu,it.id)?it.x:auxNearest(it.x,nu,it.id);it.p[k]=old;if(x==null){toast("No entra con ese tamaño en el riel auxiliar.");renderProps();return}mutate(()=>{it.p[k]=v;it.x=x})}));
  if(c.st)$("pp-on").addEventListener("change",e=>mutate(()=>{it.p.on=e.target.checked}));
  $("pp-left").onclick=()=>nudgeAux(-1);$("pp-right").onclick=()=>nudgeAux(1);$("pp-dup").onclick=dup;$("pp-del").onclick=del}
const auxFits=(x,u,ign)=>fits(0,x,u,ign,S.lc.aux,AUX_CAP,1);
function auxNearest(x,u,ign){for(let d=0;d<=AUX_CAP;d++)for(const t of [x-d,x+d])if(auxFits(t,u,ign))return t;return null}
function nudgeAux(d){const it=selAux();if(!it)return;const u=units(it);let x=it.x+d;while(x>=0&&x+u<=AUX_CAP&&!auxFits(x,u,it.id))x+=d;if(auxFits(x,u,it.id))mutate(()=>{it.x=x})}
function moveExt(d){const i=S.ext.findIndex(x=>x.id===sel),j=i+d;if(i<0||j<0||j>=S.ext.length)return;mutate(()=>{const a=S.ext;[a[i],a[j]]=[a[j],a[i]]})}
function renderPropsDIN(){const P=$("paneP"),it=selItem();
  if(!it){const rows=[...Array(S.board.rows)].map((_,r)=>{const used=S.items.filter(i=>i.row===r).reduce((a,i)=>a+units(i),0),pct=used/cap()*100;return`<div class="occ-row"><span>Fila ${r+1}</span><div class="bar"><i class="${pct>=100?"full":""}" style="width:${pct}%"></i></div><span class="meta">${fmtM(used/2)}/${S.board.mods}</span></div>`}).join("");
   P.innerHTML=`<h2>${esc(S.project.name)}</h2><p class="note">Selecciona un componente para editarlo. Haz clic en una fila para marcarla como activa: ahí se suman los componentes que tocas en la biblioteca.</p>
   <h3>Ocupación del riel</h3><div class="occ">${rows}</div>${projFields()}`;bindProj();return}
  const c=CAT[it.type],u=units(it),m0=it.x/2+1,m1=(it.x+u)/2+.5;
  let f=`<label class="field"><span>Designación</span><input class="txt" id="pp-des" value="${esc(it.p.des)}"></label><label class="field"><span>Función</span><input class="txt" id="pp-name" value="${esc(it.p.name)}"></label>`;
  c.f.forEach(([k,l,o])=>{f+=o==="text"?`<label class="field"><span>${esc(l)}</span><input class="txt" id="pp-${k}" value="${esc(it.p[k])}"></label>`:`<label class="field"><span>${esc(l)}</span><select class="sel" id="pp-${k}">${o.map(v=>opt(v,it.p[k])).join("")}</select></label>`});
  P.innerHTML=`<div><h2>${esc(c.n)}</h2><div class="meta">Fila ${it.row+1} · ${u===1?"½ módulo":"módulos "+fmtM(m0)+(u>2?"–"+fmtM(Math.floor(m1*2)/2):"")} · ${(u*8.75).toFixed(1).replace(".0","")} mm</div></div>
   <div class="fields">${f}</div>
   ${c.st?`<label class="switch"><input type="checkbox" id="pp-on"${it.p.on?" checked":""}> ${esc(c.st)}</label>`:""}
   <p class="note">${esc(c.desc(it.p))}</p>${infoCard(it.type)}
   <div class="row-btns"><button class="btn" id="pp-left">← Mover</button><button class="btn" id="pp-right">Mover →</button><button class="btn" id="pp-dup">Duplicar</button><button class="btn danger" id="pp-del">Eliminar</button></div>`;
  ["des","name"].forEach(k=>$("pp-"+k).addEventListener("change",e=>mutate(()=>{it.p[k]=e.target.value})));
  c.f.forEach(([k,,o])=>$("pp-"+k).addEventListener("change",e=>{const v=Array.isArray(o)&&typeof o[0]==="number"?Number(e.target.value):e.target.value;setProp(it.id,k,v)}));
  if(c.st)$("pp-on").addEventListener("change",e=>mutate(()=>{it.p.on=e.target.checked}));
  $("pp-left").onclick=()=>nudge(-1);$("pp-right").onclick=()=>nudge(1);$("pp-dup").onclick=dup;$("pp-del").onclick=del}
const ST_TXT={ok:"Bien dimensionado",warn:"Cerca del límite",crit:"Sobrecargado"};
function renderPropsLC(){const P=$("paneP"),b=selItem(),calc=lcCalc(),L=S.lc;
  if(!b){const used=L.items.reduce((a,x)=>a+x.p.poles,0),mx=Math.max(1,calc.max,L.main||0);
   const bars=Object.entries(calc.amps).map(([k,a])=>`<div class="occ-row"><span>Fase ${k}</span><div class="bar"><i class="${L.main&&a>L.main*.8?"full":""}" style="width:${a/mx*100}%"></i></div><span class="meta">${fmtA(a)}</span></div>`).join("");
   const imbSt=calc.imb>20?"warn":"ok",mainSt=!L.main?null:calc.max>L.main?"crit":calc.max>L.main*.8?"warn":"ok";
   const alerts=L.items.map(x=>({x,c:calc.per[x.id]})).filter(o=>o.c.st!=="ok").sort((a,b)=>a.c.cs[0]-b.c.cs[0]);
   P.innerHTML=`<h2>${esc(S.project.name)}</h2>${L.items.length?"":`<p class="note">La caja está vacía. Toca un espacio con <b>+</b> o arrastra breakers desde la biblioteca, con el amperaje que quieras.</p>`}
   <div class="row-btns"><button class="btn" id="lc-new">Vaciar o cambiar la caja</button></div>
   <div class="calc"><div class="kv"><span>Carga instalada</span><b>${(calc.W/1000).toFixed(1).replace(".",",")} kW</b></div>${(()=>{const dm=demandCalc();return calc.W?`<div class="kv"><span>Demanda estimada</span><b>${fmtNum(dm.dem/1000,1)} kW · ${fmtA(dm.I)}</b></div><div class="kv"><span>Principal sugerido</span><b>${dm.sug} A · #${dm.awg} AWG</b></div>`:""})()}
   <div class="kv"><span>Espacios usados</span><b>${used} / ${L.spaces}</b></div>
   ${L.main?`<div class="kv"><span>Principal ${L.main} A</span><b><span class="pill ${mainSt}">${mainSt==="ok"?"Alcanza":mainSt==="warn"?"Al límite":"Insuficiente"}</span></b></div>`:""}</div>
   <h3>Balance de fases</h3><div class="occ">${bars}</div>
   <p class="note"><span class="pill ${imbSt}">Desbalance ${Math.round(calc.imb)}%</span> ${imbSt==="ok"?"Las fases están parejas.":"Pasa algún circuito de 120 V a un espacio de la fase con menos carga."}</p>
   ${alerts.length?`<h3>Circuitos a revisar</h3><ul class="alerts">${alerts.map(o=>`<li><button class="${o.c.st}" data-goto="${o.x.id}">Circ. ${o.c.cs.join("-")} · ${esc(o.x.p.name||"Sin nombre")}: ${fmtA(o.c.I)} en ${o.x.p.In} A${o.c.sug?` → usar ${o.c.sug} A`:""}</button></li>`).join("")}</ul>`:""}
   <p class="note">Toca un breaker para editar su carga. Cálculo simplificado: 80% de la capacidad del breaker para carga continua y cable de cobre THHN/THW a 75 °C.</p>
   ${projFields()}`;$("lc-new").onclick=emptyDialog;bindProj();P.querySelectorAll("[data-goto]").forEach(el=>el.onclick=()=>{sel=+el.dataset.goto;renderAll()});return}
  const c=calc.per[b.id],p=b.p;
  P.innerHTML=`<div><h2>${esc(BRK.n)} ${p.poles}P</h2><div class="meta">Circuito ${c.cs.join("-")} · fase ${c.ph.join("-")} · ${c.V} V</div></div>
   <div class="fields"><label class="field wide"><span>Nombre del circuito</span><input class="txt" id="pp-name" value="${esc(p.name)}" placeholder="Ej.: Tomas cocina"></label>
   ${BRK.f.map(([k,l,o])=>`<label class="field"><span>${l}</span><select class="sel" id="pp-${k}">${o.filter(v=>!(k==="poles"&&v===3&&S.lc.sys==="1F")).map(v=>opt(v,p[k])).join("")}</select></label>`).join("")}
   <label class="field"><span>Carga (W)</span><input class="txt" id="pp-W" type="number" min="0" step="100" inputmode="numeric" value="${esc(p.W)}"></label></div>
   <label class="switch"><input type="checkbox" id="pp-on"${p.on?" checked":""}> Encendido (ON)</label>
   <div class="calc"><div class="kv"><span>Corriente estimada</span><b>${fmtA(c.I)}</b></div>
    <div class="kv"><span>Uso del breaker</span><b>${Math.round(c.pct*100)}% <span class="pill ${c.st}">${ST_TXT[c.st]}</span></b></div>
    <div class="kv"><span>Cable sugerido</span><b>#${AWG[p.In]} AWG</b></div>
    ${c.st!=="ok"&&c.sug?`<div class="kv"><span>Breaker recomendado</span><b>${c.sug} A · #${AWG[c.sug]} AWG</b></div>`:""}
    ${c.st!=="ok"&&!c.sug?`<div class="kv"><span>Recomendación</span><b>Dividir la carga</b></div>`:""}</div>
   ${p.type!=="Estándar"?`<p class="note">${p.type==="GFCI"?"GFCI: protege a las personas de descargas. Úsalo en baños, cocina, lavadero, exteriores y piscinas.":"AFCI: detecta arcos eléctricos en el cableado. Recomendado en dormitorios."}</p>`:""}${infoCard(infoKey("brk",b))}
   <div class="row-btns"><button class="btn" id="pp-up">↑ Subir</button><button class="btn" id="pp-down">↓ Bajar</button><button class="btn" id="pp-side">Cambiar de lado</button><button class="btn" id="pp-dup">Duplicar</button><button class="btn danger" id="pp-del">Eliminar</button></div>`;
  $("pp-name").addEventListener("change",e=>mutate(()=>{p.name=e.target.value}));
  $("pp-W").addEventListener("change",e=>mutate(()=>{p.W=Math.max(0,Math.round(+e.target.value||0))}));
  BRK.f.forEach(([k,,o])=>$("pp-"+k).addEventListener("change",e=>{const v=typeof o[0]==="number"?Number(e.target.value):e.target.value;setPropLC(b.id,k,v)}));
  $("pp-on").addEventListener("change",e=>mutate(()=>{p.on=e.target.checked}));
  $("pp-up").onclick=()=>nudgeLC(-1);$("pp-down").onclick=()=>nudgeLC(1);$("pp-side").onclick=switchSide;$("pp-dup").onclick=dup;$("pp-del").onclick=del}
const lcBoxDesc=()=>`Centro de carga ${S.lc.spaces} espacios ${sysLabel()}, ${S.lc.main?"con breaker principal "+S.lc.main+" A":"con zapatas principales"}`;
const lcBoxPrice=()=>Math.round(LC_BOX[S.lc.spaces]*(S.lc.sys==="3F"?1.4:1)+MAIN_P[S.lc.main]);
const dinBoxDesc=()=>`Gabinete ${S.board.style==="metal"?"metálico":"plástico"} ${S.board.rows} filas × ${S.board.mods} módulos con riel DIN 35 mm y canaleta`;
const dinBoxPrice=()=>Math.round(S.board.style==="metal"?40+S.board.rows*S.board.mods*2.2:25+S.board.rows*S.board.mods*1.4);
function quoteData(){const Q=S.quote,m=new Map(),add=(desc,cost,ref,q=1,u="")=>{if(!m.has(desc))m.set(desc,{desc,def:cost,q:0,refs:[],u});const e=m.get(desc);e.q+=q;if(ref)e.refs.push(ref)};
  if(S.kind==="lc"){const calc=lcCalc(),its=[...S.lc.items].sort((a,b)=>calc.per[a.id].cs[0]-calc.per[b.id].cs[0]);
   for(const b of its)add(BRK.desc(b.p),brkPrice(b.p),"C"+calc.per[b.id].cs.join("-"));
   add(lcBoxDesc(),lcBoxPrice());
   for(const it of [...S.lc.aux].sort((a,b)=>a.x-b.x))add(CAT[it.type].desc(it.p),PRICE_DIN[it.type](it.p),it.p.des);
   if(S.lc.aux.length)add("Riel DIN 35 mm con tapa troquelada para la caja",8);
   const cab=new Map();for(const b of its){const a=AWG[b.p.In];cab.set(a,(cab.get(a)||0)+(+Q.cableM||0)*(b.p.poles===3?4:3))}
   [...cab].filter(([,mts])=>mts>0).sort((a,b)=>parseInt(b[0])-parseInt(a[0])).forEach(([a,mts])=>add(`Cable THHN/THW cobre #${a} AWG`,AWG_P[a]||1,null,mts,"m"))}
  else{for(const it of [...S.items].sort((a,b)=>a.row-b.row||a.x-b.x))add(CAT[it.type].desc(it.p),PRICE_DIN[it.type](it.p),it.p.des);add(dinBoxDesc(),dinBoxPrice())}
  for(const x of S.ext)add(EXT[x.type].desc(x.p),Math.round(EXT[x.type].price(x.p)),x.p.name);
  const wm=new Map(),tubeSz={};
  for(const wl of S.walls){for(const it of wl.items){const dv=DEV[it.type];if(dv&&dv.price)add(devQn(dv,it.p),devPrice(dv,it.p),it.p.name?`${it.p.name} (${wl.name})`:wl.name)}
    for(const [k,m] of wallWireMeters(wl))wm.set(k,(wm.get(k)||0)+m);if(wl.tube!==false)for(const [sz,m] of Object.entries(tubeBySize(wl)))tubeSz[sz]=(tubeSz[sz]||0)+m}
  [...wm].sort().forEach(([k,mts])=>{const [awg,col]=k.split("|");add(`Cable THHN/THW cobre #${awg} AWG ${col.toLowerCase()} (pared)`,AWG_P[awg]||1,null,Math.round(mts*1.1*2)/2,"m")});
  for(const sz of TUBE_SIZES)if(tubeSz[sz]>0)add(`Tubo PVC ${sz} para pared`,TUBE_PRICE[sz],null,Math.round(tubeSz[sz]*1.1*2)/2,"m");
  const k=1+(+Q.margin||0)/100;
  const mat=[...m.values()].map(e=>{const ov=Q.over[e.desc]!=null,cost=ov?+Q.over[e.desc]:e.def;return Object.assign(e,{cost,ov,unit:r2(cost*k),total:r2(cost*k*e.q)})});
  const n=S.kind==="lc"?S.lc.items.length:S.items.filter(i=>i.type!=="term"&&i.type!=="blank").length,lab=[];
  if(n)lab.push({desc:S.kind==="lc"?"Instalación y conexionado de circuitos":"Montaje y cableado de componentes",q:n,unit:+Q.per||0});
  if(n||S.ext.length)lab.push({desc:"Montaje del tablero, pruebas y rotulado",q:1,unit:+Q.board||0});
  const np=S.walls.reduce((a,wl)=>a+wl.items.filter(i=>i.type!=="panel"&&i.type!=="feed").length,0);if(np)lab.push({desc:"Puntos eléctricos en pared (tomas, interruptores, luces y salidas)",q:np,unit:+Q.point||0});
  if(S.ext.length)lab.push({desc:"Instalación de equipos externos",q:S.ext.length,unit:+Q.ext||0});
  lab.forEach(l=>l.total=r2(l.q*l.unit));
  const matCost=r2(mat.reduce((a,e)=>a+e.cost*e.q,0)),matSale=r2(mat.reduce((a,e)=>a+e.total,0)),labor=r2(lab.reduce((a,l)=>a+l.total,0)),sub=r2(matSale+labor),iva=Q.ivaOn?r2(sub*(+Q.iva||0)/100):0;
  return{mat,lab,matCost,matSale,labor,sub,iva,total:r2(sub+iva),gain:r2(matSale-matCost)}}
function renderQuote(){const Q=S.quote,d=quoteData(),lc=S.kind==="lc";
  const num=(k,label,step=1,ph="")=>`<label class="field"><span>${label}</span><input class="txt" id="qz-${k}" type="number" min="0" step="${step}" inputmode="decimal" value="${Q[k]?esc(Q[k]):k==="rate"?"":0}"${ph?` placeholder="${ph}"`:""}></label>`;
  $("paneB").innerHTML=`<div><h2>Presupuesto</h2><div class="meta">Precios en USD · edita el costo de cada renglón</div></div>
  <div class="fields">${num("margin","Ganancia en materiales (%)")}${num("per",lc?"Mano de obra por circuito ($)":"Mano de obra por componente ($)")}${num("board","Montaje del tablero ($)")}${S.ext.length?num("ext","Instalación por equipo ($)"):""}${S.walls.some(wl=>wl.items.some(i=>i.type!=="panel"))?num("point","Punto eléctrico en pared ($)"):""}${lc?num("cableM","Metros de cable por circuito"):""}${num("valid","Validez (días)")}${num("rate","Tasa (Bs por $)",.01,"Opcional")}${num("iva","IVA (%)")}</div>
  <label class="switch"><input type="checkbox" id="qz-ivaOn"${Q.ivaOn?" checked":""}> Cobrar IVA</label>
  ${d.mat.length>1||d.lab.length?`<table class="qt"><thead><tr><th class="n">Cant.</th><th>Materiales y equipos</th><th class="n">Costo</th><th class="n">Venta</th></tr></thead><tbody>
  ${d.mat.map((e,i)=>`<tr><td class="n">${fmtQ(e.q)}${e.u?" "+e.u:""}</td><td>${esc(e.desc)}${e.refs.length?`<small>${esc(cutText(e.refs.join(", "),60))}</small>`:""}</td><td class="n"><input data-key="${i}" type="number" min="0" step="0.01" value="${e.cost}" aria-label="Costo unitario: ${esc(e.desc)}"${e.ov?` class="ov" title="Precio editado. Bórralo para volver al sugerido (${fmtUSD(e.def)})."`:""}></td><td class="n">${fmtUSD(e.total)}</td></tr>`).join("")}</tbody></table>
  ${d.lab.length?`<table class="qt"><thead><tr><th class="n">Cant.</th><th>Mano de obra</th><th class="n">Unit.</th><th class="n">Total</th></tr></thead><tbody>${d.lab.map(l=>`<tr><td class="n">${l.q}</td><td>${esc(l.desc)}</td><td class="n">${fmtUSD(l.unit)}</td><td class="n">${fmtUSD(l.total)}</td></tr>`).join("")}</tbody></table>`:""}
  <div class="calc tot"><div class="kv"><span>Materiales y equipos</span><b>${fmtUSD(d.matSale)}</b></div><div class="kv"><span>Mano de obra</span><b>${fmtUSD(d.labor)}</b></div>${Q.ivaOn?`<div class="kv"><span>IVA ${fmtNum(Q.iva,0)}%</span><b>${fmtUSD(d.iva)}</b></div>`:""}<div class="kv big"><span>Total</span><b>${fmtUSD(d.total)}</b></div>${+Q.rate>0?`<div class="kv"><span>En bolívares (${fmtNum(Q.rate)} Bs/$)</span><b>${fmtBs(d.total*Q.rate)}</b></div>`:""}</div>
  <p class="note">Tu ganancia: ${fmtUSD(d.gain)} en materiales más ${fmtUSD(d.labor)} de mano de obra. El cliente no ve la columna de costo. Los precios sugeridos son referenciales: ajústalos a lo que pagas en tu proveedor y quedan guardados para los próximos presupuestos.</p>
  <div class="row-btns"><button class="btn primary" id="qz-pdf">PDF completo</button><button class="btn" id="qz-img">Imagen del presupuesto</button><button class="btn" id="qz-co">Datos de tu empresa</button><button class="btn" id="qz-copy">Copiar como texto</button>${Object.keys(Q.over).length?`<button class="btn" id="qz-reset">Volver a precios sugeridos</button>`:""}</div>`
  :`<p class="note">Agrega componentes al tablero para armar el presupuesto.</p>`}`;
  ["margin","per","board","ext","point","cableM","valid","rate","iva"].forEach(k=>{const el=$("qz-"+k);if(el)el.addEventListener("change",()=>mutate(()=>{S.quote[k]=Math.max(0,+el.value||0)}))});
  $("qz-ivaOn").addEventListener("change",e=>mutate(()=>{S.quote.ivaOn=e.target.checked}));
  $("paneB").querySelectorAll("input[data-key]").forEach(el=>el.addEventListener("change",()=>{const e=d.mat[+el.dataset.key];mutate(()=>{if(el.value===""||+el.value===e.def)delete S.quote.over[e.desc];else S.quote.over[e.desc]=Math.max(0,+el.value)})}));
  const bi=$("qz-img");if(bi)bi.onclick=quoteImage;const bp=$("qz-pdf");if(bp)bp.onclick=pdfDialog;const bq=$("qz-co");if(bq)bq.onclick=()=>companyDialog();
  const bc=$("qz-copy");if(bc)bc.onclick=()=>copyText(quoteText(d),"Presupuesto copiado al portapapeles");
  const br=$("qz-reset");if(br)br.onclick=()=>mutate(()=>{S.quote.over={}})}
function quoteText(d){const P=S.project,Q=S.quote,L=[`PRESUPUESTO — ${P.name}`,`Cliente: ${P.client||"—"}`,`Fecha: ${P.date} · Válido por ${Q.valid} días · Precios en USD`,"","MATERIALES Y EQUIPOS"];
  d.mat.forEach(e=>L.push(`${fmtQ(e.q)}${e.u?" "+e.u:""} × ${e.desc} — ${fmtUSD(e.unit)} c/u = ${fmtUSD(e.total)}`));
  if(d.lab.length){L.push("","MANO DE OBRA");d.lab.forEach(l=>L.push(`${l.q} × ${l.desc} — ${fmtUSD(l.unit)} = ${fmtUSD(l.total)}`))}
  L.push("",`Materiales y equipos: ${fmtUSD(d.matSale)}`,`Mano de obra: ${fmtUSD(d.labor)}`);if(Q.ivaOn)L.push(`IVA ${Q.iva}%: ${fmtUSD(d.iva)}`);L.push(`TOTAL: ${fmtUSD(d.total)}`);
  if(+Q.rate>0)L.push(`Equivalente: ${fmtBs(d.total*Q.rate)} (tasa ${fmtNum(Q.rate)} Bs/$)`);if(P.author)L.push("",`Elaborado por: ${P.author}`);return L.join("\n")}
function quoteImage(){const d=quoteData(),Q=S.quote,P=S.project,W=820,D=dims(),F={ff:SANS};let y,s="";
  const t=(x,yy,v,o)=>T(x,yy,v,Object.assign({ff:SANS,fw:400,c:"#1d2326",a:"start"},o));
  const co=getCompany(),lgw=co.logo?Math.min(130,64*((co.logoW||1)/(co.logoH||1))):0,tx0=32+(co.logo?lgw+24:0);
  s+=R(0,0,W,100,"#1d2326")+(co.logo?R(26,14,lgw+12,72,"#ffffff",{rx:6})+`<image href="${co.logo}" x="32" y="18" width="${lgw}" height="64" preserveAspectRatio="xMidYMid meet"/>`:"")+t(tx0,48,"PRESUPUESTO",{fs:28,fw:700,c:"#fff"})+t(tx0,76,cutText(P.name,52),{fs:13,c:"#d6dde0"});
  s+=t(W-32,42,"Fecha: "+P.date,{fs:11,a:"end",c:"#fff"})+t(W-32,62,`Válido por ${Q.valid} días`,{fs:11,a:"end",c:"#d6dde0"})+t(W-32,82,"Precios en dólares (USD)",{fs:11,a:"end",c:"#d6dde0"});
  y=126;s+=t(32,y,"CLIENTE / OBRA",{fs:8,fw:600,c:"#5b6266"})+t(32,y+20,cutText(P.client||"—",54),{fs:13,fw:600})+t(500,y,"ELABORADO POR",{fs:8,fw:600,c:"#5b6266"})+t(500,y+20,cutText(co.name||P.author||"—",34),{fs:13,fw:600})+t(500,y+36,cutText([co.rif&&"RIF "+co.rif,co.phone].filter(Boolean).join(" · "),44),{fs:10,c:"#5b6266"});
  y=166;const bw=W-64,bh=Math.min(430,bw*D.H/D.Wd);s+=R(32,y,bw,bh,"#f6f7f6",{rx:4,s:"#d3d8d4"})+`<svg x="38" y="${y+6}" width="${bw-12}" height="${bh-12}" viewBox="0 0 ${D.Wd} ${D.H}">${sceneSvg(true)}</svg>`;y+=bh+26;
  const head=()=>{s+=R(32,y,W-64,24,"#eef1ee")+t(70,y+16,"CANT.",{fs:8,fw:600,a:"end",c:"#5b6266"})+t(84,y+16,"DESCRIPCIÓN",{fs:8,fw:600,c:"#5b6266"})+t(W-150,y+16,"P. UNIT.",{fs:8,fw:600,a:"end",c:"#5b6266"})+t(W-44,y+16,"TOTAL",{fs:8,fw:600,a:"end",c:"#5b6266"});y+=24};
  const sec=x=>{s+=t(84,y+20,x,{fs:9,fw:700,c:"#1c5fa8"});y+=28};
  const line=(q,desc,u,tot)=>{s+=T(70,y+15,q,{fs:9.5,a:"end",fw:400})+t(84,y+15,cutText(desc,90),{fs:10})+T(W-150,y+15,fmtUSD(u),{fs:9.5,a:"end",fw:400})+T(W-44,y+15,fmtUSD(tot),{fs:9.5,a:"end"})+R(32,y+22,W-64,.8,"#e3e6e4");y+=23};
  head();sec("Materiales y equipos");d.mat.forEach(e=>line(fmtQ(e.q)+(e.u?" "+e.u:""),e.desc,e.unit,e.total));
  if(d.lab.length){sec("Mano de obra");d.lab.forEach(l=>line(String(l.q),l.desc,l.unit,l.total))}
  y+=26;const kv=(k,v,o={})=>{s+=t(W-210,y,k,Object.assign({fs:11,a:"end"},o))+T(W-44,y,v,Object.assign({fs:11,a:"end",fw:600},o));y+=21};
  kv("Materiales y equipos",fmtUSD(d.matSale));kv("Mano de obra",fmtUSD(d.labor));if(Q.ivaOn)kv(`IVA ${fmtNum(Q.iva,0)}%`,fmtUSD(d.iva));
  s+=R(W-340,y-8,308,1.4,"#1d2326");y+=16;kv("TOTAL",fmtUSD(d.total),{fs:17,fw:700});
  if(+Q.rate>0){s+=t(W-44,y,`Equivalente: ${fmtBs(d.total*Q.rate)} · tasa ${fmtNum(Q.rate)} Bs/$`,{fs:9.5,a:"end",c:"#5b6266"});y+=18}
  y+=18;s+=R(32,y,W-64,.8,"#d3d8d4");y+=22;
  s+=t(32,y,"Condiciones: precios en dólares estadounidenses, sujetos a disponibilidad. Incluye los materiales y la mano de obra indicados.",{fs:8.5,c:"#5b6266"});y+=15;
  s+=t(32,y,"Los cálculos de carga son referenciales y no sustituyen el cálculo según el Código Eléctrico Nacional (CEN).",{fs:8.5,c:"#5b6266"});y+=28;
  showPng(s,W,y,"Imagen del presupuesto",`Lista para enviar por WhatsApp. Haz clic derecho sobre la imagen y elige "Guardar imagen como…" (en el teléfono, mantenla presionada).`)}
function renderTools(){const lc=S.kind==="lc";$("projName").textContent=S.project.name+(S.project.client?" · "+S.project.client:"");$("kind").value=S.kind;$("lcTools").hidden=!lc;$("dinTools").hidden=lc;
  if(lc){$("usage").textContent=`${S.lc.items.reduce((a,x)=>a+x.p.poles,0)} / ${S.lc.spaces} esp.`;$("spaces").value=S.lc.spaces;$("sys").value=S.lc.sys;$("main").value=S.lc.main}
  else{const used=S.items.reduce((a,i)=>a+units(i),0);$("usage").textContent=`${fmtM(used/2)} / ${S.board.rows*S.board.mods} mód`;$("rows").value=S.board.rows;$("sysD").value=S.lc.sys;$("mods").value=S.board.mods;$("style").value=S.board.style}
  $("hint").innerHTML=lc?"Toca un espacio con <b>+</b> para poner un breaker · toca un breaker para cambiar su amperaje o eliminarlo · arrástralo para moverlo · <kbd>Doble clic</kbd> ON/OFF · <kbd>↑</kbd><kbd>↓</kbd> mueven · <kbd>←</kbd><kbd>→</kbd> cambian de lado · <kbd>Supr</kbd> borra"
   :"Arrastra componentes al riel o toca uno para sumarlo a la fila activa · <kbd>Doble clic</kbd> enciende/apaga · <kbd>←</kbd><kbd>→</kbd> mueven · <kbd>Supr</kbd> borra";
  const wall=S.view==="wall";$("vBoard").setAttribute("aria-pressed",String(!wall));$("vWall").setAttribute("aria-pressed",String(wall));
  $("boardTools").hidden=wall;$("goWire").hidden=wall;$("wallTools").hidden=!wall;$("usage").hidden=wall;
  if(wall){$("mMove").setAttribute("aria-pressed",String(wallMode==="move"));$("mWire").setAttribute("aria-pressed",String(wallMode==="wire"));$("mTube").setAttribute("aria-pressed",String(wallMode==="tube"));
    $("wColor").value=wColor;$("wAwg").value=wAwg;$("wSize").value=S.wall.w+"x"+S.wall.h;$("wFinish").value=S.wall.finish;$("wSel").innerHTML=S.walls.map((w,i)=>`<option value="${i}">${esc(w.name)}</option>`).join("");$("wSel").value=S.wallI;$("wTube").checked=S.wall.tube!==false;
    $("play").textContent=simState.running?"■ Detener":"▶ Probar";$("blackout").hidden=!simState.running;$("blackout").textContent=simState.blackout?"Volver la luz":"Simular apagón";$("blackout").classList.toggle("primary",simState.blackout);$("play").classList.toggle("running",simState.running);$("rearm").hidden=!simState.running;
    $("hint").innerHTML=reconn?"Toca o suelta sobre el terminal nuevo para ese extremo del cable · <kbd>Esc</kbd> cancela":pending?"Ahora toca el segundo terminal para tender el cable · <kbd>Esc</kbd> cancela"
     :wallMode==="tube"?(tubeDraft?"<b>Tubería</b>: toca en cada codo · toca dos veces en el mismo punto o presiona <kbd>Enter</kbd> para terminar · <kbd>Esc</kbd> cancela":"<b>Tubería</b>: toca la pared donde empieza el tubo; si tocas un tubo existente, el nuevo se une a él"):(wallMode==="wire"?"<b>Cablear</b>: arrastra desde un breaker o tornillo hasta el aparato, o toca uno y luego el otro":"<b>Mover</b>: arrastra los aparatos · para tender un cable arrastra desde un breaker o tornillo hasta el aparato")+" · <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> mueven 5 cm · <kbd>Supr</kbd> borra · <b>Probar</b> energiza la pared"}
  $("total").textContent=fmtUSD(quoteData().total);
  $("undo").disabled=!hist.length;$("redo").disabled=!fut.length}
function renderAll(){if(S.view==="wall"&&simState.running&&!wdrag)runSim();renderBoard();renderProps();renderQuote();renderTools();renderSelBar()}
