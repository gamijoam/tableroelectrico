/* =====================================================================
   selbar.js — Barra flotante junto a lo seleccionado (breaker,
   componente, equipo, dispositivo o cable). Da acceso directo a lo más
   usado aunque el panel lateral esté guardado.
   ===================================================================== */
let sbTarget=null;
function selTarget(){if(!sel)return null;
  if(S.view==="wall"){const tb=(S.wall.tubes||[]).find(t=>t.id===sel);if(tb)return{kind:"tb",it:tb,el:wallEl.querySelector(`.tb[data-id="${sel}"]`)};
    const sr=srcById(sel);if(sr)return{kind:sr.din?"din":"brk",it:sr.ref,el:wallEl.querySelector(`.wb[data-brk="${sel}"]`)};
    const it=S.wall.items.find(i=>i.id===sel);if(it)return{kind:"wi",it,el:wallEl.querySelector(`.wi[data-id="${sel}"]`)};
    const w=S.wall.wires.find(i=>i.id===sel);if(w)return{kind:"ww",w,el:wallEl.querySelector(`.ww[data-id="${sel}"]`)};return null}
  const ax=selAux();if(ax)return{kind:"ax",it:ax,el:board.querySelector(`.ax[data-id="${sel}"]`)};
  const ex=selExt();if(ex)return{kind:"ex",it:ex,el:board.querySelector(`.ex[data-id="${sel}"]`)};
  if(S.kind==="lc"){const b=S.lc.items.find(i=>i.id===sel);if(b)return{kind:"brk",it:b,el:board.querySelector(`.it[data-id="${sel}"]`)}}
  else{const it=S.items.find(i=>i.id===sel);if(it)return{kind:"din",it,el:board.querySelector(`.it[data-id="${sel}"]`)}}
  return null}
function renderSelBar(){const bar=$("selbar"),t=selTarget(),dragging=(typeof drag!=="undefined"&&drag&&drag.moving)||(wdrag&&wdrag.moved);
  sbTarget=t;if(!t||!t.el||dragging){bar.hidden=true;return}
  const B=(id,label,cls="")=>`<button class="btn sm ${cls}" id="${id}">${label}</button>`,O=(opts,cur,f=v=>v)=>opts.map(v=>`<option value="${v}"${String(v)===String(cur)?" selected":""}>${f(v)}</option>`).join("");
  let h="";
  if(t.kind==="brk"){const p=t.it.p,c=brkCalc(t.it);
    h=`<span class="sb-t">Circuito ${c.cs.join("-")}</span><input class="txt sb-name" id="sb-nm" value="${esc(p.name)}" placeholder="Nombre (ej. Cocina)" aria-label="Nombre del circuito"><select class="sel" id="sb-in" aria-label="Amperaje">${O(BRK_IN,p.In,v=>v+" A")}</select>
      <select class="sel" id="sb-po" aria-label="Polos">${O(S.lc.sys==="1F"?[1,2]:[1,2,3],p.poles,v=>v+"P")}</select><select class="sel" id="sb-ty" aria-label="Tipo">${O(["Estándar","GFCI","AFCI"],p.type)}</select>
      ${B("sb-on",p.on?"Apagar":"Encender")}${B("sb-dup","Duplicar")}${B("sb-del","Eliminar","danger")}`}
  else if(t.kind==="din"||t.kind==="ax"){const c=CAT[t.it.type];h=`<span class="sb-t">${esc(t.it.p.des||c.n)} · ${esc(c.n)}</span>${c.st?B("sb-on",t.it.p.on?"Apagar":"Encender"):""}${B("sb-dup","Duplicar")}${B("sb-del","Eliminar","danger")}`}
  else if(t.kind==="ex"){const c=EXT[t.it.type];h=`<span class="sb-t">${esc(c.n)}</span>${c.st?B("sb-on",t.it.p.on?"Apagar":"Encender"):""}${B("sb-dup","Duplicar")}${B("sb-del","Eliminar","danger")}`}
  else if(t.kind==="wi"){const d=DEV[t.it.type];h=`<span class="sb-t">${esc(t.it.p.name||d.short)}</span>${t.it.type==="inter"?B("sb-on",t.it.p.on?"Apagar":"Encender"):""}${t.it.type==="panel"?B("sb-edit","Poner o quitar breakers","primary"):B("sb-dup","Duplicar")}${B("sb-del",t.it.type==="panel"?"Quitar":"Eliminar","danger")}`}
  else if(t.kind==="tb"){let m=0;for(let k=1;k<t.it.pts.length;k++)m+=Math.hypot(t.it.pts[k][0]-t.it.pts[k-1][0],t.it.pts[k][1]-t.it.pts[k-1][1]);h=`<span class="sb-t">Tubo PVC · ${fmtNum(m,2)} m</span><select class="sel" id="sb-ts" aria-label="Diámetro">${O(TUBE_SIZES,t.it.size)}</select>${B("sb-del","Eliminar","danger")}`}
  else if(t.kind==="ww"){h=`<span class="sb-t">Cable #${t.w.awg}</span><select class="sel" id="sb-col" aria-label="Color del cable">${O(Object.keys(WCOL),t.w.color)}</select>${B("sb-del","Eliminar","danger")}`}
  h+=B("sb-more","Más opciones");bar.innerHTML=h;bar.hidden=false;
  const on=(id,ev,fn)=>{const el=$(id);if(el)el[ev]=fn};
  on("sb-in","onchange",e=>setPropLC(t.it.id,"In",+e.target.value));on("sb-po","onchange",e=>setPropLC(t.it.id,"poles",+e.target.value));on("sb-ty","onchange",e=>setPropLC(t.it.id,"type",e.target.value));
  on("sb-nm","onchange",e=>mutate(()=>{t.it.p.name=e.target.value}));
  on("sb-on","onclick",()=>mutate(()=>{t.it.p.on=!t.it.p.on}));
  on("sb-dup","onclick",()=>{if(t.kind==="wi"){const p=$("pp-dup");if(p)p.click()}else dup()});
  on("sb-del","onclick",()=>{if(S.view==="wall")wallDelete();else del()});
  on("sb-ts","onchange",e=>mutate(()=>{t.it.size=e.target.value}));
  on("sb-col","onchange",e=>mutate(()=>{t.w.color=e.target.value}));
  on("sb-edit","onclick",()=>setView("board"));
  on("sb-more","onclick",()=>{setPanel("side",true);$("tabP").click()});
  posSelBar()}
function posSelBar(){const bar=$("selbar"),t=sbTarget;if(bar.hidden||!t||!t.el||!t.el.isConnected)return;
  const box=$("stagebox").getBoundingClientRect(),r=t.el.getBoundingClientRect(),bw=bar.offsetWidth,bh=bar.offsetHeight;
  /* En la pared la barra va abajo al centro para no tapar tornillos ni cables */
  if(S.view==="wall"){bar.style.left=Math.max(8,(box.width-bw)/2)+"px";bar.style.top=Math.max(8,box.height-bh-14)+"px";return}
  let x=r.right-box.left+10,y=r.top-box.top;
  if(x+bw>box.width-8){x=r.left-box.left-bw-10;if(x<8){x=Math.min(Math.max(8,r.left-box.left),box.width-bw-8);y=r.bottom-box.top+8}}
  y=Math.max(8,Math.min(box.height-bh-8,y));bar.style.left=Math.max(8,x)+"px";bar.style.top=y+"px"}
$("stage").addEventListener("scroll",posSelBar,{passive:true});
window.addEventListener("resize",()=>requestAnimationFrame(posSelBar));
