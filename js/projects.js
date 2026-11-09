/* =====================================================================
   projects.js — Varios proyectos guardados en este navegador, archivo
   .json para llevarlos a otra computadora, datos de la empresa (con
   logo) y descarga de archivos.
   Cada proyecto se guarda aparte; un índice recuerda la lista y cuál
   está abierto.
   ===================================================================== */
const IDX="taller-tableros-projects",PKEY=id=>"taller-tableros-proj-"+id,COMPKEY="taller-tableros-company";
let projIdx={cur:null,list:[]};
/* Cada cuenta tiene su propia lista de proyectos en este equipo; sin sesión se usa la lista "sin cuenta" */
let projOwner=(()=>{try{const a=JSON.parse(localStorage.getItem("taller-tableros-cuenta")||"null");return a&&a.user?a.user.id:""}catch(e){return""}})();
const idxKey=(o=projOwner)=>o?IDX+"@"+o:IDX;
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch(e){}};
const newPid=()=>"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmtDate=t=>t?new Date(t).toLocaleString("es-VE",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"";
const slug=s=>(String(s||"tablero").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").toLowerCase()||"tablero").slice(0,60);

function idxSave(){lsSet(idxKey(),JSON.stringify(projIdx))}
/* Cambió la cuenta: guarda lo abierto en la lista anterior y abre la lista de la nueva */
function setProjOwner(o){o=o||"";if(o===projOwner)return;projSave();projOwner=o;projIdx={cur:null,list:[]};
  try{const v=JSON.parse(lsGet(idxKey())||"null");if(v&&Array.isArray(v.list))projIdx=v}catch(e){}
  let v=null;const id=projIdx.cur||(projIdx.list[0]&&projIdx.list[0].id);if(id){try{v=normalize(JSON.parse(lsGet(PKEY(id))||"null"))}catch(e){}}
  if(v)switchTo(v,id);else switchTo(linkWall(blankAll()),newPid())}
/* Proyectos guardados sin cuenta en este equipo (para traerlos a la cuenta) */
const guestList=()=>{try{const v=JSON.parse(lsGet(IDX)||"null");return v&&Array.isArray(v.list)?v.list.filter(p=>!(p.n===0&&(p.name||"Tablero nuevo")==="Tablero nuevo")):[]}catch(e){return[]}};
function adoptGuest(){if(!projOwner)return 0;const g=guestList();if(!g.length)return 0;const have=new Set(projIdx.list.map(p=>p.id));
  for(const p of g)if(!have.has(p.id))projIdx.list.push(p);projIdx.list.sort((a,b)=>(b.updated||0)-(a.updated||0));idxSave();lsSet(IDX,JSON.stringify({cur:null,list:[]}));return g.length}
function projSave(){if(!S)return;if(!projIdx.cur)projIdx.cur=newPid();lsSet(PKEY(projIdx.cur),JSON.stringify(S));
  let e=projIdx.list.find(p=>p.id===projIdx.cur);if(!e){e={id:projIdx.cur};projIdx.list.unshift(e)}
  Object.assign(e,{name:S.project.name,client:S.project.client,updated:Date.now(),kind:S.kind,n:S.kind==="lc"?S.lc.items.length:S.items.length,cloudId:S.project.cloudId||null});idxSave()}
/* Carga el proyecto abierto; si no hay lista, adopta el tablero único guardado antes */
function projLoad(){try{const v=JSON.parse(lsGet(idxKey())||"null");if(v&&Array.isArray(v.list))projIdx=v}catch(e){}
  if(projIdx.cur){try{const v=normalize(JSON.parse(lsGet(PKEY(projIdx.cur))||"null"));if(v){S=v;syncUid();return true}}catch(e){}}
  if(!projOwner)try{const v=normalize(JSON.parse(lsGet(KEY)||"null"));if(v){S=v;syncUid();projIdx.cur=newPid();projSave();return true}}catch(e){}
  return false}
function switchTo(v,id){if(simState.running)setRunning(false);S=v;projIdx.cur=id;hist=[];fut=[];sel=null;pending=null;reconn=null;activeRow=0;syncUid();projSave();
  $("q").value="";hideAlert();renderLib();autoFit=true;renderAll();fit()}
function openProject(id){if(id===projIdx.cur)return;projSave();let v=null;try{v=normalize(JSON.parse(lsGet(PKEY(id))||"null"))}catch(e){}
  if(!v){toast("No se pudo abrir ese proyecto.");return}switchTo(v,id);toast(`Abriste "${S.project.name}".`)}
function newProject(o={}){projSave();const v=linkWall(blankAll());v.project=proj(o.name||"Tablero nuevo",o.client||"");v.kind=o.kind||"lc";
  if(o.spaces)Object.assign(v.lc,{spaces:o.spaces,sys:o.sys||"1F",main:o.main!=null?o.main:100});switchTo(v,newPid())}
function dupProject(id){projSave();let v=null;try{v=normalize(JSON.parse(lsGet(PKEY(id))||"null"))}catch(e){}if(!v)return;
  v.project.name=(v.project.name||"Proyecto")+" (copia)";switchTo(v,newPid());toast("Proyecto duplicado.")}
function deleteProject(id){lsDel(PKEY(id));projIdx.list=projIdx.list.filter(p=>p.id!==id);
  if(id===projIdx.cur){const next=projIdx.list[0];projIdx.cur=null;if(next){let v=null;try{v=normalize(JSON.parse(lsGet(PKEY(next.id))||"null"))}catch(e){}if(v){switchTo(v,next.id);return}}
    S=linkWall(blankAll());switchTo(S,newPid())}else idxSave()}

/* ---------- descargar un archivo (PDF, imagen, proyecto) ---------- */
async function saveFile(filename,blob){let dl=null;try{dl=window.claude&&window.claude.use?await window.claude.use("downloads"):null}catch(e){}
  if(dl){try{await dl.save({filename,data:blob});toast("Descarga lista.");return true}
    catch(e){const c=e&&e.code;if(c==="declined")return false;if(c==="rate_limited"){toast("Ya hay una descarga esperando tu confirmación.");return false}
      if(c==="too_large"){toast("El archivo es demasiado grande para descargarlo aquí.");return false}}}
  try{const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);return true}
  catch(e){toast("No se pudo descargar el archivo en esta vista.");return false}}

/* ---------- ventana de proyectos ---------- */
function projectsDialog(){projSave();const L=[...projIdx.list].sort((a,b)=>(b.updated||0)-(a.updated||0));
  const gN=projOwner?guestList().length:0;
  openModal(`<h2>Proyectos</h2><p class="note">${projOwner?"Con tu cuenta, cada proyecto se guarda solo en este equipo y en la nube (☁), y lo abres en tus otros equipos.":"Se guardan solos en este navegador. Crea tu cuenta para guardarlos en la nube."}</p>
   ${gN?`<div class="paycard"><b>Hay ${gN} proyecto${gN>1?"s":""} guardado${gN>1?"s":""} sin cuenta en este equipo</b><span>Puedes traerlos a esta cuenta. Solo pasan a la cuenta con la que los traigas.</span><div class="row-btns"><button class="btn sm primary" id="pj-adopt">Traer a mi cuenta</button></div></div>`:""}
   <div class="plist">${L.map(p=>`<div class="pitem${p.id===projIdx.cur?" cur":""}"><div class="pinfo"><b>${esc(p.name||"Sin nombre")}${p.cloudId?' <span class="chip cloud" title="Guardado en la nube">☁ nube</span>':""}</b><small>${esc(p.client||"Sin cliente")} · ${p.kind==="din"?"Riel DIN":"Caja de breakers"} · ${fmtDate(p.updated)}</small></div>
     <div class="row-btns">${p.id===projIdx.cur?`<span class="chip">Abierto</span>`:`<button class="btn sm primary" data-open="${p.id}">Abrir</button>`}<button class="btn sm" data-dup="${p.id}">Duplicar</button><button class="btn sm danger" data-del="${p.id}">Eliminar</button></div></div>`).join("")}</div>
   <div class="row-btns"><button class="btn primary" id="pj-new">+ Nuevo proyecto</button><button class="btn" id="pj-down">Descargar este proyecto</button><label class="btn" for="pj-file">Abrir archivo de proyecto</label><input type="file" id="pj-file" accept=".json,application/json" hidden>
   ${prevBoard()?`<button class="btn" id="pj-prev">Recuperar tablero anterior</button>`:""}<button class="btn" id="pj-company">Datos de tu empresa</button><button class="btn" data-close>Cerrar</button></div>`);
  const M=$("dlg");if(typeof cloudOnlyList==="function")cloudOnlyList(M);
  M.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{closeModal();openProject(b.dataset.open)});
  M.querySelectorAll("[data-dup]").forEach(b=>b.onclick=()=>{closeModal();dupProject(b.dataset.dup)});
  M.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{if(b.dataset.sure){deleteProject(b.dataset.del);projectsDialog();return}b.dataset.sure="1";b.textContent="¿Seguro? Eliminar";b.classList.add("primary")});
  const ad=$("pj-adopt");if(ad)ad.onclick=()=>{const n=adoptGuest();toast(`${n} proyecto${n>1?"s":""} traído${n>1?"s":""} a tu cuenta.`);projectsDialog()};
  $("pj-new").onclick=newProjectDialog;$("pj-company").onclick=()=>companyDialog();
  $("pj-down").onclick=()=>saveFile(slug(S.project.name)+".json",new Blob([JSON.stringify(S,null,1)],{type:"application/json"}));
  $("pj-file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{let v=null;try{v=normalize(JSON.parse(r.result))}catch(_){}
    if(!v){toast("Ese archivo no es un proyecto de Taller de Tableros.");return}closeModal();projSave();switchTo(v,newPid());toast(`Proyecto "${S.project.name}" abierto.`)};r.readAsText(f)};
  const pv=$("pj-prev");if(pv)pv.onclick=()=>{const v=prevBoard();if(!v)return;closeModal();projSave();switchTo(v,newPid());toast("Tablero anterior recuperado como un proyecto nuevo.")}}
function newProjectDialog(){const o=(id,opts,cur,f=v=>v)=>`<select class="sel" id="${id}">${opts.map(v=>`<option value="${v}"${String(v)===String(cur)?" selected":""}>${f(v)}</option>`).join("")}</select>`;
  openModal(`<h2>Nuevo proyecto</h2><p class="note">Empieza con una caja de breakers vacía. El proyecto actual queda guardado en Proyectos.</p>
   <div class="fields"><label class="field wide"><span>Nombre del proyecto</span><input class="txt" id="np-name" placeholder="Ej.: Casa Pérez · tablero principal"></label>
   <label class="field wide"><span>Cliente / obra</span><input class="txt" id="np-client" placeholder="Ej.: Familia Pérez · Valencia"></label>
   <label class="field"><span>Tipo</span>${o("np-kind",["lc","din"],"lc",v=>v==="lc"?"Caja de breakers":"Riel DIN")}</label>
   <label class="field"><span>Espacios</span>${o("np-sp",SPACES,20)}</label>
   <label class="field"><span>Principal</span>${o("np-main",MAINS,100,v=>v?v+" A":"Sin principal")}</label>
   <label class="field"><span>Sistema</span>${o("np-sys",["1F","3F"],"1F",v=>v==="1F"?"120/240 V monofásico":"208Y/120 V trifásico")}</label></div>
   <div class="row-btns"><button class="btn primary" id="np-ok">Crear proyecto</button><button class="btn" data-close>Cancelar</button></div>`);
  $("np-name").focus();
  $("np-ok").onclick=()=>{const name=$("np-name").value.trim()||"Tablero nuevo";closeModal();newProject({name,client:$("np-client").value.trim(),kind:$("np-kind").value,spaces:+$("np-sp").value,main:+$("np-main").value,sys:$("np-sys").value});
    toast(`Proyecto "${name}" creado${typeof cloudOn==="function"&&cloudOn()?" y guardándose en la nube":""}: toca un espacio con + para poner breakers.`)}}

/* ---------- datos de la empresa ---------- */
function getCompany(){try{return JSON.parse(lsGet(COMPKEY)||"{}")||{}}catch(e){return{}}}
function companyDialog(after){const c=getCompany();let logo=c.logo||"",lw=c.logoW,lh=c.logoH;
  openModal(`<h2>Datos de tu empresa</h2><p class="note">Salen en el PDF y en la imagen del presupuesto. Se guardan en este navegador para todos tus proyectos.</p>
   <div class="fields"><label class="field wide"><span>Nombre o empresa</span><input class="txt" id="co-name" value="${esc(c.name||"")}" placeholder="Ej.: Electricidad Rodríguez"></label>
   <label class="field"><span>RIF</span><input class="txt" id="co-rif" value="${esc(c.rif||"")}" placeholder="J-12345678-9"></label>
   <label class="field"><span>Teléfono / WhatsApp</span><input class="txt" id="co-phone" value="${esc(c.phone||"")}" placeholder="+58 412 000 0000"></label>
   <label class="field wide"><span>Correo</span><input class="txt" id="co-email" type="email" value="${esc(c.email||"")}"></label>
   <label class="field wide"><span>Dirección</span><input class="txt" id="co-addr" value="${esc(c.address||"")}" placeholder="Ciudad, estado"></label></div>
   <div class="logo-row"><div class="logo-prev" id="co-prev">${c.logo?`<img src="${c.logo}" alt="Logo actual">`:"Sin logo"}</div><label class="btn" for="co-logo">Subir logo</label><input type="file" id="co-logo" accept="image/*" hidden><button class="btn" id="co-nologo">Quitar logo</button></div>
   <div class="row-btns"><button class="btn primary" id="co-save">Guardar</button><button class="btn" data-close>Cancelar</button></div>`);
  $("co-logo").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const img=new Image();
    img.onload=()=>{const k=Math.min(1,320/Math.max(img.width,img.height)),cv=document.createElement("canvas");cv.width=Math.max(1,Math.round(img.width*k));cv.height=Math.max(1,Math.round(img.height*k));
      cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);logo=cv.toDataURL("image/png");lw=cv.width;lh=cv.height;$("co-prev").innerHTML=`<img src="${logo}" alt="Logo nuevo">`};
    img.onerror=()=>toast("Esa imagen no se pudo leer. Prueba con PNG o JPG.");img.src=r.result};r.readAsDataURL(f)};
  $("co-nologo").onclick=()=>{logo="";$("co-prev").textContent="Sin logo"};
  $("co-save").onclick=()=>{const v={name:$("co-name").value.trim(),rif:$("co-rif").value.trim(),phone:$("co-phone").value.trim(),email:$("co-email").value.trim(),address:$("co-addr").value.trim(),logo,logoW:lw,logoH:lh};
    if(!lsSet(COMPKEY,JSON.stringify(v))){toast("No se pudo guardar en este navegador.");return}closeModal();toast("Datos de la empresa guardados.");renderAll();if(after)after()}}
