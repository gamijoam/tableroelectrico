/* ---------- actions ---------- */
function toast(m){const t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,2800)}
function addFromLib(k,pos){const info=libInfo(k);
  if(info.wall){addWallItem(info.type,pos);return}
  if(info.aux){const u=CAT[info.type].u(info.p),x=pos&&pos.x!=null?pos.x:auxNearest(0,u,null);if(x==null){toast("El riel auxiliar está lleno. Quita algún componente o usa un tablero DIN aparte.");return}
   const it={id:uid++,type:info.type,row:0,x,p:Object.assign({},info.p,{des:nextDes(info.type),name:""})};mutate(()=>{S.lc.aux.push(it)});sel=it.id;renderAll();if(autoFit)fit();return}
  if(info.ext){const x={id:uid++,type:info.type,p:Object.assign({},info.p,{name:""})};mutate(()=>{S.ext.push(x)});sel=x.id;renderAll();if(autoFit)fit();toast(`${EXT[info.type].n} agregado debajo del tablero.`);return}
  if(info.lc){const n=info.p.poles;if(n===3&&S.lc.sys==="1F"){toast("Los breakers de 3 polos necesitan una caja trifásica 208Y/120 V. Cambia el sistema arriba.");return}
   if(pos&&!lfits(pos.side,pos.slot,n,null)){const s=lnearest(pos.side,pos.slot,n,null);if(s==null){toast(`No hay ${n} espacios seguidos libres en ese lado.`);return}pos={side:pos.side,slot:s}}
   pos=pos||lfirstFree(n);if(!pos){toast("No quedan espacios libres: elige una caja con más espacios.");return}
   const b={id:uid++,side:pos.side,slot:pos.slot,p:Object.assign({},info.p,{name:""})};mutate(()=>{S.lc.items.push(b)});sel=b.id;renderAll();return}
  const u=CAT[info.type].u(info.p);pos=pos||firstFree(u,activeRow);if(!pos){toast("No queda lugar: suma una fila o más módulos por fila.");return}
  const it={id:uid++,type:info.type,row:pos.row,x:pos.x,p:Object.assign({},info.p,{des:nextDes(info.type),name:""})};mutate(()=>{S.items.push(it)});sel=it.id;activeRow=pos.row;renderAll()}
function setProp(id,k,v){const it=S.items.find(i=>i.id===id);const old=it.p[k];it.p[k]=v;const u=units(it);
  if(!fits(it.row,it.x,u,it.id)){let x=nearest(it.row,it.x,u,it.id),pos=x!=null?{row:it.row,x}:firstFree(u,it.row,it.id);it.p[k]=old;
   if(!pos){toast("No entra con ese tamaño: libera espacio en el riel.");renderProps();return}
   mutate(()=>{it.p[k]=v;it.row=pos.row;it.x=pos.x});toast("Se reubicó para que entre en el riel.");return}
  it.p[k]=old;mutate(()=>{it.p[k]=v})}
function setPropLC(id,k,v){const b=S.lc.items.find(i=>i.id===id);if(k!=="poles"){mutate(()=>{b.p[k]=v});return}
  if(lfits(b.side,b.slot,v,b.id)){mutate(()=>{b.p.poles=v});return}
  let s=lnearest(b.side,b.slot,v,b.id),pos=s!=null?{side:b.side,slot:s}:lfirstFree(v,b.id);
  if(!pos){toast("No hay espacios contiguos libres para ese breaker.");renderProps();return}
  mutate(()=>{b.p.poles=v;b.side=pos.side;b.slot=pos.slot});toast("Se movió para tener espacios contiguos.")}
function nudge(d){const it=S.items.find(i=>i.id===sel);if(!it)return;let x=it.x+d;const u=units(it);while(x>=0&&x+u<=cap()&&!fits(it.row,x,u,it.id))x+=d;if(fits(it.row,x,u,it.id))mutate(()=>{it.x=x})}
function nudgeLC(d){const b=S.lc.items.find(i=>i.id===sel);if(!b)return;let s=b.slot+d;while(s>=0&&s+b.p.poles<=lcRows()&&!lfits(b.side,s,b.p.poles,b.id))s+=d;if(lfits(b.side,s,b.p.poles,b.id))mutate(()=>{b.slot=s})}
function switchSide(){const b=S.lc.items.find(i=>i.id===sel);if(!b)return;const side=b.side==="L"?"R":"L",s=lnearest(side,b.slot,b.p.poles,b.id);if(s==null){toast("El otro lado no tiene espacio para este breaker.");return}mutate(()=>{b.side=side;b.slot=s})}
function dup(){const ax=selAux();if(ax){const u=units(ax),x=auxNearest(ax.x+u,u,null);if(x==null){toast("No queda lugar en el riel auxiliar.");return}const n={id:uid++,type:ax.type,row:0,x,p:Object.assign({},ax.p,{des:nextDes(ax.type)})};mutate(()=>{S.lc.aux.push(n)});sel=n.id;renderAll();return}
  const xe=selExt();if(xe){const i=S.ext.indexOf(xe),n={id:uid++,type:xe.type,p:Object.assign({},xe.p)};mutate(()=>{S.ext.splice(i+1,0,n)});sel=n.id;renderAll();return}
  if(S.kind==="lc"){const b=S.lc.items.find(i=>i.id===sel);if(!b)return;let s=lnearest(b.side,b.slot+b.p.poles,b.p.poles,null),pos=s!=null?{side:b.side,slot:s}:lfirstFree(b.p.poles);if(!pos){toast("No quedan espacios para duplicarlo.");return}
   const n={id:uid++,side:pos.side,slot:pos.slot,p:Object.assign({},b.p)};mutate(()=>{S.lc.items.push(n)});sel=n.id;renderAll();return}
  const it=S.items.find(i=>i.id===sel);if(!it)return;const u=units(it);let x=nearest(it.row,it.x+u,u,null),pos=x!=null?{row:it.row,x}:firstFree(u,it.row);if(!pos){toast("No queda lugar para duplicarlo.");return}
  const n={id:uid++,type:it.type,row:pos.row,x:pos.x,p:Object.assign({},it.p,{des:nextDes(it.type)})};mutate(()=>{S.items.push(n)});sel=n.id;renderAll()}
function del(){if(!sel)return;const id=sel;sel=null;mutate(()=>{if(S.lc.aux.some(i=>i.id===id))S.lc.aux=S.lc.aux.filter(i=>i.id!==id);else if(S.ext.some(i=>i.id===id))S.ext=S.ext.filter(i=>i.id!==id);else if(S.kind==="lc")S.lc.items=S.lc.items.filter(i=>i.id!==id);else S.items=S.items.filter(i=>i.id!==id)})}
function resize(rows,mods){const items=JSON.parse(JSON.stringify(S.items)).sort((a,b)=>a.row-b.row||a.x-b.x),c=mods*2,keep=[],out=[];
  for(const i of items)(fits(i.row,i.x,units(i),i.id,keep,c,rows)?keep:out).push(i);
  for(const i of out){let ok=false;for(let r=0;r<rows&&!ok;r++)for(let x=0;x+units(i)<=c;x++)if(fits(r,x,units(i),i.id,keep,c,rows)){i.row=r;i.x=x;keep.push(i);ok=true;break}
   if(!ok){toast("No entran todos los componentes en ese gabinete. Quita alguno primero.");renderTools();return}}
  mutate(()=>{S.board.rows=rows;S.board.mods=mods;S.items=keep});if(out.length)toast(`${out.length} componente${out.length>1?"s se reubicaron":" se reubicó"} para que entren.`);fixSel();if(autoFit)fit()}
function resizeLC(spaces,sys){const rows=spaces/2,items=JSON.parse(JSON.stringify(S.lc.items)).sort((a,b)=>a.slot-b.slot),keep=[],out=[];
  if(sys==="1F"&&items.some(b=>b.p.poles===3)){toast("Hay breakers de 3 polos: quítalos antes de pasar a monofásico.");renderTools();return}
  for(const b of items)(lfits(b.side,b.slot,b.p.poles,b.id,keep,rows,sys)?keep:out).push(b);
  for(const b of out){let ok=false;for(let s=0;s<rows&&!ok;s++)for(const side of ["L","R"])if(!ok&&lfits(side,s,b.p.poles,b.id,keep,rows,sys)){b.side=side;b.slot=s;keep.push(b);ok=true}
   if(!ok){toast("No entran todos los breakers en esa caja. Quita alguno primero.");renderTools();return}}
  mutate(()=>{S.lc.spaces=spaces;S.lc.sys=sys;S.lc.items=keep});if(out.length)toast(`${out.length} breaker${out.length>1?"s se reubicaron":" se reubicó"}.`);fixSel();if(autoFit)fit()}
function copyText(t,msg){try{navigator.clipboard.writeText(t).then(()=>toast(msg),()=>toast("No se pudo copiar: selecciona el texto y cópialo a mano."))}catch(e){toast("No se pudo copiar: selecciona el texto y cópialo a mano.")}}

/* ---------- drag & drop ---------- */
let drag=null;const ghost=$("ghost");
function toBoard(e){const pt=board.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=board.getScreenCTM();if(!m)return null;const q=pt.matrixTransform(m.inverse());return{x:q.x-dims().encX,y:q.y}}
function target(e){const q=toBoard(e);if(!q)return null;
  if(drag.aux){const y0=auxY();if(q.y<y0-40||q.y>y0+AUXH||q.x<AUX_X0-60||q.x>AUX_X0+AUX_CAP*U+60)return null;let x=Math.round((q.x-drag.grab-AUX_X0)/U);x=Math.max(0,Math.min(AUX_CAP-drag.u,x));
   const ign=drag.kind==="move"?drag.id:null,nx=auxFits(x,drag.u,ign)?x:auxNearest(x,drag.u,ign);return nx==null?{aux:true,x,ok:false}:{aux:true,x:nx,ok:true}}
  if(drag.lc){const n=drag.n;if(q.x<XL-50||q.x>XR+BW+50||q.y<LY0-30||q.y>LY0+lcRows()*SL+30)return null;
   if(n===3&&S.lc.sys==="1F")return{side:q.x<CX?"L":"R",slot:Math.max(0,Math.min(lcRows()-n,Math.floor((q.y-LY0)/SL)-drag.grab)),ok:false};
   const side=q.x<CX?"L":"R";let slot=Math.floor((q.y-LY0)/SL)-drag.grab;slot=Math.max(0,Math.min(lcRows()-n,slot));const ign=drag.kind==="move"?drag.id:null;
   const s=lfits(side,slot,n,ign)?slot:lnearest(side,slot,n,ign);return s==null?{side,slot,ok:false}:{side,slot:s,ok:true}}
  const r=Math.floor((q.y-TOP)/ROW_H);if(r<0||r>=S.board.rows||q.x<SIDE-60||q.x>SIDE+cap()*U+60)return null;
  let x=Math.round((q.x-drag.grab-SIDE)/U);x=Math.max(0,Math.min(cap()-drag.u,x));const ign=drag.kind==="move"?drag.id:null;const nx=fits(r,x,drag.u,ign)?x:nearest(r,x,drag.u,ign);
  return nx==null?{row:r,x,ok:false}:{row:r,x:nx,ok:true}}
function showPreview(t){const pv=$("pv");if(!pv)return;if(!t){pv.innerHTML="";return}const col=t.ok?"#2f9e44":"#d23a2f";
  if(drag.aux){const p=drag.kind==="new"?drag.p:S.lc.aux.find(i=>i.id===drag.id).p,{w,svg}=drawComp(drag.type,p);
   pv.innerHTML=`<g transform="translate(${AUX_X0+t.x*U} ${auxY()+40})" opacity=".75">${svg}<rect x="-3" y="-3" width="${w+6}" height="${CH+6}" rx="5" fill="${col}" fill-opacity=".12" stroke="${col}" stroke-width="2" stroke-dasharray="6 4"/></g>`;return}
  if(drag.lc){const p=drag.kind==="new"?drag.p:S.lc.items.find(i=>i.id===drag.id).p,h=p.poles*SL,x=t.side==="L"?XL:XR,V=p.poles===1?120:(S.lc.sys==="1F"?240:208);
   pv.innerHTML=`<g transform="translate(${x} ${LY0+t.slot*SL})" opacity=".8">${brkSvg(p,t.side==="R",V)}${R(-3,0,BW+6,h,col,{rx:6,op:.15})}${R(-3,0,BW+6,h,"none",{rx:6,s:col,sw:2,da:"6 4"})}</g>`;return}
  const p=drag.kind==="new"?drag.p:S.items.find(i=>i.id===drag.id).p;const {w,svg}=drawComp(drag.type,p);
  pv.innerHTML=`<g transform="translate(${SIDE+t.x*U} ${TOP+t.row*ROW_H+COMP_Y})" opacity=".75">${svg}<rect x="-3" y="-3" width="${w+6}" height="${CH+6}" rx="5" fill="${col}" fill-opacity=".12" stroke="${col}" stroke-width="2" stroke-dasharray="6 4"/></g>`}
$("libList").addEventListener("pointerdown",e=>{const li=e.target.closest(".li");if(!li||e.button>0)return;if(e.pointerType==="mouse")e.preventDefault();const k=li.dataset.lib,info=libInfo(k);
  const base={kind:"new",k,p:info.p,label:info.label,sx:e.clientX,sy:e.clientY,moving:false,touch:e.pointerType==="touch"};
  drag=info.aux?Object.assign(base,{aux:true,type:info.type,u:CAT[info.type].u(info.p),grab:CAT[info.type].u(info.p)*U/2}):info.wall?Object.assign(base,{wall:true}):info.ext?Object.assign(base,{ext:true}):info.lc?Object.assign(base,{lc:true,n:info.p.poles,grab:0}):Object.assign(base,{type:info.type,u:CAT[info.type].u(info.p),grab:CAT[info.type].u(info.p)*U/2})});
board.addEventListener("pointerdown",e=>{const ex=e.target.closest(".ex");if(ex){sel=+ex.dataset.id;renderAll();return}
  const sl=e.target.closest(".slot");if(sl){addFromLib("b",{side:sl.dataset.side,slot:+sl.dataset.slot});return}
  const ax=e.target.closest(".ax");if(ax){const it=S.lc.aux.find(i=>i.id===+ax.dataset.id),q=toBoard(e);sel=it.id;drag={kind:"move",aux:true,id:it.id,type:it.type,u:units(it),grab:q.x-(AUX_X0+it.x*U),sx:e.clientX,sy:e.clientY,moving:false};try{board.setPointerCapture(e.pointerId)}catch(_){}renderAll();return}
  const g=e.target.closest(".it");
  if(g){const id=+g.dataset.id,q=toBoard(e);sel=id;
   if(S.kind==="lc"){const b=S.lc.items.find(i=>i.id===id);drag={kind:"move",lc:true,id,n:b.p.poles,grab:Math.max(0,Math.min(b.p.poles-1,Math.floor((q.y-LY0-b.slot*SL)/SL))),sx:e.clientX,sy:e.clientY,moving:false}}
   else{const it=S.items.find(i=>i.id===id);activeRow=it.row;drag={kind:"move",id,type:it.type,u:units(it),grab:q.x-(SIDE+it.x*U),sx:e.clientX,sy:e.clientY,moving:false}}
   try{board.setPointerCapture(e.pointerId)}catch(_){}renderAll();return}
  const r=e.target.closest(".row-hit");if(r){activeRow=+r.dataset.row;sel=null;renderAll();return}
  if(sel){sel=null;renderAll()}});
window.addEventListener("pointermove",e=>{if(!drag)return;if(!drag.moving){if(drag.touch&&drag.kind==="new")return;if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<5)return;drag.moving=true;
   if(drag.kind==="new"){ghost.textContent=drag.label;ghost.hidden=false;if(drag.aux)renderBoard()}else renderBoard()}
  if(drag.kind==="new"){ghost.style.left=e.clientX+"px";ghost.style.top=e.clientY+"px"}
  if(drag.ext||drag.wall)return;const t=target(e);drag.t=t;showPreview(t);if(drag.kind==="new")ghost.hidden=!!t});
window.addEventListener("pointerup",e=>{if(!drag)return;const d=drag;drag=null;ghost.hidden=true;
  if(d.wall){if(!d.moving){addFromLib(d.k);return}const r=wallEl.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){const q=toWall(e);addWallItem(d.k.slice(1),fromPx(q.x,q.y))}return}
  if(d.ext){const r=$("stage").getBoundingClientRect();if(!d.moving||(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom))addFromLib(d.k);return}
  if(d.kind==="new"){if(!d.moving){addFromLib(d.k);return}const t=d.t;
   if(t&&t.ok)addFromLib(d.k,d.aux?{x:t.x}:d.lc?{side:t.side,slot:t.slot}:{row:t.row,x:t.x});
   else{showPreview(null);if(d.aux)renderBoard();if(t)toast(d.lc&&d.n===3&&S.lc.sys==="1F"?"Los breakers de 3 polos necesitan una caja trifásica.":"Ese lugar está ocupado.")}return}
  if(!d.moving)return;const t=d.t;
  if(d.aux){const it=S.lc.aux.find(i=>i.id===d.id);if(t&&t.ok&&t.x!==it.x)mutate(()=>{it.x=t.x});else renderBoard();return}
  if(d.lc){const b=S.lc.items.find(i=>i.id===d.id);if(t&&t.ok&&(t.side!==b.side||t.slot!==b.slot))mutate(()=>{b.side=t.side;b.slot=t.slot});else renderBoard();return}
  const it=S.items.find(i=>i.id===d.id);if(t&&t.ok&&(t.row!==it.row||t.x!==it.x)){activeRow=t.row;mutate(()=>{it.row=t.row;it.x=t.x})}else renderBoard()});
window.addEventListener("pointercancel",()=>{if(drag){drag=null;ghost.hidden=true;renderBoard()}});
$("libList").addEventListener("keydown",e=>{const li=e.target.closest(".li");if(li&&(e.key==="Enter"||e.key===" ")){e.preventDefault();addFromLib(li.dataset.lib)}});
board.addEventListener("dblclick",e=>{const ex=e.target.closest(".ex");if(ex){const x=S.ext.find(i=>i.id===+ex.dataset.id);if(x&&EXT[x.type].st)mutate(()=>{x.p.on=!x.p.on});return}
  const axd=e.target.closest(".ax");if(axd){const it=S.lc.aux.find(i=>i.id===+axd.dataset.id);if(it&&CAT[it.type].st)mutate(()=>{it.p.on=!it.p.on});return}
  if(e.target.closest(".main")){mutate(()=>{S.lc.mainOn=S.lc.mainOn===false});return}
  const g=e.target.closest(".it");if(!g)return;const it=curItems().find(i=>i.id===+g.dataset.id);if(S.kind==="lc"||CAT[it.type].st)mutate(()=>{it.p.on=!it.p.on})});
document.addEventListener("keydown",e=>{const tag=(e.target.tagName||"").toLowerCase();if(tag==="input"||tag==="textarea"||tag==="select")return;
  const mod=e.ctrlKey||e.metaKey;
  if(mod&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo();return}
  if(mod&&e.key.toLowerCase()==="y"){e.preventDefault();redo();return}
  if(!$("modal").hidden){if(e.key==="Escape")closeModal();return}
  if(S.view==="wall"){wallKey(e);return}
  if(!sel)return;const lc=S.kind==="lc";
  if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();del()}
  else if(selAux()&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){e.preventDefault();nudgeAux(e.key==="ArrowLeft"?-1:1)}
  else if(selExt()&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){e.preventDefault();moveExt(e.key==="ArrowLeft"?-1:1)}
  else if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();lc?switchSide():nudge(e.key==="ArrowLeft"?-1:1)}
  else if(lc&&(e.key==="ArrowUp"||e.key==="ArrowDown")){e.preventDefault();nudgeLC(e.key==="ArrowUp"?-1:1)}
  else if(mod&&e.key.toLowerCase()==="d"){e.preventDefault();dup()}else if(e.key==="Escape"){sel=null;renderAll()}});

/* ---------- modals ---------- */
function openModal(html){$("dlg").innerHTML=html;$("modal").hidden=false}
function closeModal(){$("modal").hidden=true}
$("modal").addEventListener("click",e=>{if(e.target.id==="modal"||e.target.closest("[data-close]"))closeModal()});
function showPng(svg,Wd,H,title,msg){const sc=2,src=`<svg xmlns="http://www.w3.org/2000/svg" width="${Wd*sc}" height="${H*sc}" viewBox="0 0 ${Wd} ${H}"><defs>${DEFS}</defs><rect width="${Wd}" height="${H}" fill="#ffffff"/>${svg}</svg>`;
  const img=new Image();img.onload=()=>{const cv=document.createElement("canvas");cv.width=Wd*sc;cv.height=H*sc;cv.getContext("2d").drawImage(img,0,0);let url;try{url=cv.toDataURL("image/png")}catch(_){url=img.src}
   openModal(`<h2>${esc(title)}</h2><p class="note">${esc(msg)}</p><img src="${url}" alt="${esc(title)}: ${esc(S.project.name)}"><div class="row-btns"><button class="btn" data-close>Cerrar</button></div>`)};
  img.onerror=()=>toast("No se pudo generar la imagen.");img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(src)}
$("png").onclick=()=>{if(S.view==="wall"){const D=wallDims();showPng(wallSvg(true),D.Wd,D.H,"Imagen de la pared","Haz clic derecho sobre la imagen y elige \"Guardar imagen como…\" (en el teléfono, mantenla presionada).");return}const {Wd,H}=dims();showPng(sceneSvg(true),Wd,H,"Imagen del tablero",`Haz clic derecho sobre la imagen y elige "Guardar imagen como…" (en el teléfono, mantenla presionada). Sale a ${Wd*2}×${H*2} px.`)};
$("file").onclick=()=>{openModal(`<h2>Guardar o abrir un tablero</h2><p class="note">El tablero se guarda solo en este navegador. Para pasarlo a otra computadora, copia este texto y pégalo allá con "Abrir desde texto".</p>
  <textarea class="txt" id="json" spellcheck="false" aria-label="Tablero en formato JSON">${esc(JSON.stringify(S,null,1))}</textarea>
  <div class="row-btns"><button class="btn primary" id="j-copy">Copiar</button><button class="btn" id="j-load">Abrir desde texto</button><button class="btn" data-close>Cerrar</button></div>`);
  $("j-copy").onclick=()=>{const t=$("json");t.select();copyText(t.value,"Tablero copiado")};
  $("j-load").onclick=()=>{try{const v=normalize(JSON.parse($("json").value));if(!v)throw 0;mutate(()=>{S=v});syncUid();sel=null;closeModal();renderLib();fit();toast("Tablero abierto")}catch(_){toast("El texto no es un tablero válido. Pega el contenido completo que copiaste.")}}};
$("new").onclick=()=>{if(S.view==="board"&&S.kind==="lc"){const L=S.lc;
    openModal(`<h2>Caja de breakers vacía</h2><p class="note">Se quitan todos los breakers, el riel auxiliar, los equipos y las paredes. Puedes recuperarlo con Deshacer.</p>
     <div class="fields"><label class="field"><span>Espacios</span><select class="sel" id="n-sp">${SPACES.map(v=>`<option value="${v}"${v===L.spaces?" selected":""}>${v}</option>`).join("")}</select></label>
     <label class="field"><span>Principal</span><select class="sel" id="n-main">${MAINS.map(v=>`<option value="${v}"${v===L.main?" selected":""}>${v?v+" A":"Sin principal"}</option>`).join("")}</select></label>
     <label class="field wide"><span>Sistema</span><select class="sel" id="n-sys"><option value="1F"${L.sys==="1F"?" selected":""}>120/240 V monofásico</option><option value="3F"${L.sys==="3F"?" selected":""}>208Y/120 V trifásico</option></select></label></div>
     <div class="row-btns"><button class="btn primary" id="n-lc">Crear caja vacía</button><button class="btn" data-close>Cancelar</button></div>`);
    $("n-lc").onclick=()=>{const sp=+$("n-sp").value,mn=+$("n-main").value,sy=$("n-sys").value;mutate(()=>{S.lc={spaces:sp,sys:sy,main:mn,mainOn:true,items:[],aux:[]};S.ext=[];S.walls=[blankWall()];S.wallI=0;S.project=proj("Tablero nuevo","")});sel=null;closeModal();renderLib();autoFit=true;fit();toast("Caja vacía lista: toca un espacio con + o arrastra breakers desde la biblioteca.")};return}
  const what=S.view==="wall"?"la pared (se quedan el tablero y sus breakers)":S.kind==="lc"?"la caja de breakers":"el tablero DIN";openModal(`<h2>¿Empezar de cero?</h2><p class="note">Se vacía ${what} actual. Puedes recuperarlo con Deshacer.</p><div class="row-btns"><button class="btn primary" id="n-ok">Vaciar</button><button class="btn" data-close>Cancelar</button></div>`);
  $("n-ok").onclick=()=>{mutate(()=>{if(S.view==="wall"){S.wall.items=S.wall.items.filter(i=>i.type==="panel");S.wall.wires=[];return}if(S.kind==="lc")S.lc.items=[];else S.items=[];S.ext=[];S.project=proj("Tablero nuevo","")});sel=null;activeRow=0;closeModal();fit()}};
$("tpl").onchange=e=>{const k=e.target.value;e.target.value="";if(!TPL[k])return;mutate(()=>{S=linkWall(Object.assign(JSON.parse(JSON.stringify(S)),TPL[k]()))});syncUid();sel=null;activeRow=0;autoFit=true;renderLib();fit();toast("Plantilla cargada. Deshacer vuelve al tablero anterior.")};

/* ---------- toolbar ---------- */
$("rows").innerHTML=[1,2,3,4,5,6].map(v=>`<option>${v}</option>`).join("");
$("mods").innerHTML=[8,12,18,24,36].map(v=>`<option>${v}</option>`).join("");
$("spaces").innerHTML=SPACES.map(v=>`<option value="${v}">${v}</option>`).join("");
$("main").innerHTML=MAINS.map(v=>`<option value="${v}">${v?v+" A":"Sin principal"}</option>`).join("");
$("kind").onchange=e=>{mutate(()=>{S.kind=e.target.value});sel=null;$("q").value="";renderLib();autoFit=true;fit()};
$("rows").onchange=e=>resize(+e.target.value,S.board.mods);
$("mods").onchange=e=>resize(S.board.rows,+e.target.value);
$("style").onchange=e=>mutate(()=>{S.board.style=e.target.value});
$("spaces").onchange=e=>resizeLC(+e.target.value,S.lc.sys);
$("sys").onchange=e=>resizeLC(S.lc.spaces,e.target.value);
$("main").onchange=e=>mutate(()=>{S.lc.main=+e.target.value});
$("zin").onclick=()=>{autoFit=false;zoom=Math.min(2.5,zoom*1.2);renderBoard()};
$("zout").onclick=()=>{autoFit=false;zoom=Math.max(.25,zoom/1.2);renderBoard()};
$("zfit").onclick=()=>{autoFit=true;fit()};
$("undo").onclick=undo;$("redo").onclick=redo;
$("q").addEventListener("input",renderLib);
const tabs=[["tabP","paneP"],["tabB","paneB"]];tabs.forEach(([t,p])=>$(t).onclick=()=>tabs.forEach(([t2,p2])=>{$(t2).setAttribute("aria-selected",t2===t);$(p2).hidden=p2!==p}));
window.addEventListener("resize",()=>{if(autoFit)fit()});


/* ---------- wall toolbar ---------- */
function setView(v){if(S.view===v)return;if(v!=="wall"&&simState.running){simState.running=false;clearTimeout(simState.timer);simState.timer=null;simState.res=null}
  pending=null;reconn=null;sel=null;hideAlert();mutate(()=>{S.view=v});$("q").value="";renderLib();autoFit=true;fit()}
$("vBoard").onclick=()=>setView("board");$("vWall").onclick=()=>setView("wall");
$("mMove").onclick=()=>{wallMode="move";renderAll()};$("mWire").onclick=()=>{wallMode="wire";renderAll()};
$("wColor").innerHTML=`<option value="Auto">Automático (norma)</option>`+Object.keys(WCOL).map(c=>`<option>${c}</option>`).join("");
$("wAwg").innerHTML=Object.keys(AWG_W).map(a=>`<option value="${a}">#${a} AWG</option>`).join("");
$("wSize").innerHTML=[[4,2.6],[6,2.7],[8,2.7],[10,3]].map(([w,h])=>`<option value="${w}x${h}">${w} × ${fmtNum(h,1)} m</option>`).join("");
$("wFinish").innerHTML=FINISH.map(f=>`<option>${f}</option>`).join("");
$("wColor").onchange=e=>{wColor=e.target.value};$("wAwg").onchange=e=>{wAwg=e.target.value};
$("wSize").onchange=e=>{const [w,h]=e.target.value.split("x").map(Number);mutate(()=>{S.wall.w=w;S.wall.h=h;S.wall.items.forEach(clampItem)});if(autoFit)fit()};
$("wFinish").onchange=e=>mutate(()=>{S.wall.finish=e.target.value});
$("play").onclick=()=>setRunning(!simState.running);$("rearm").onclick=rearm;
$("wSel").onchange=e=>selectWall(+e.target.value);$("wAdd").onclick=addWall;
$("wTube").onchange=e=>mutate(()=>{S.wall.tube=e.target.checked});
$("blackout").onclick=toggleBlackout;
