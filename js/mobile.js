/* =====================================================================
   mobile.js — Teléfono y tablet vertical (hasta 980 px de ancho).
   · Menú ☰ con plantillas, calculadora, proyectos, exportar y PDF.
   · Barra inferior: Componentes, Ajustes, Ajustar zoom, Propiedades y
     Presupuesto. Los paneles salen como hojas desde abajo.
   · Al agregar un componente, la hoja se cierra para ver el resultado.
   ===================================================================== */
const mq=window.matchMedia("(max-width:980px)"),isMobile=()=>mq.matches;
const appEl=$("app");
function setMenu(open){appEl.classList.toggle("menu-open",open);$("mMenu").setAttribute("aria-expanded",String(open))}
$("mMenu").onclick=e=>{e.stopPropagation();setMenu(!appEl.classList.contains("menu-open"))};
/* cualquier opción del menú lo cierra (el selector de plantillas, al elegir) */
document.querySelector("header .actions").addEventListener("click",e=>{if(e.target.closest(".btn"))setMenu(false)});
$("tpl").addEventListener("change",()=>setMenu(false));
document.addEventListener("pointerdown",e=>{if(appEl.classList.contains("menu-open")&&!e.target.closest("header"))setMenu(false)});
$("mUndo").onclick=()=>undo();$("mRedo").onclick=()=>redo();

/* solo una hoja abierta a la vez */
function sheet(which){const open=!ui[which];ui.lib=false;ui.side=false;if(open)ui[which]=true;applyUI();syncNav()}
$("mnLib").onclick=()=>sheet("lib");
$("mnProps").onclick=()=>{if(ui.side&&!$("paneP").hidden){sheet("side");return}ui.side=false;$("tabP").click();sheet("side")};
$("mnQuote").onclick=()=>{if(ui.side&&!$("paneB").hidden){sheet("side");return}ui.side=false;$("tabB").click();sheet("side")};
$("mnOpts").onclick=()=>{appEl.classList.toggle("opts-open");syncNav();if(autoFit)requestAnimationFrame(fit)};
$("mnFit").onclick=()=>{autoFit=true;fit()};
$("sheetBg").onclick=()=>{ui.lib=false;ui.side=false;applyUI();syncNav()};
function syncNav(){if(!isMobile())return;$("mnLib").setAttribute("aria-pressed",String(ui.lib));$("mnOpts").setAttribute("aria-pressed",String(appEl.classList.contains("opts-open")));
  $("mnProps").setAttribute("aria-pressed",String(ui.side&&!$("paneP").hidden));$("mnQuote").setAttribute("aria-pressed",String(ui.side&&!$("paneB").hidden))}
/* el total del presupuesto también se ve en la barra inferior */
new MutationObserver(()=>{$("mnTotal").textContent=$("total").textContent||"Presupuesto"}).observe($("total"),{childList:true,characterData:true,subtree:true});

/* en el teléfono, después de agregar un componente se cierra la hoja para verlo puesto */
{const add0=addFromLib;addFromLib=function(...a){add0.apply(this,a);if(isMobile()&&ui.lib){ui.lib=false;applyUI();syncNav()}}}
/* "Más opciones" y "Ver detalles" abren la hoja de propiedades */
{const sp0=setPanel;setPanel=function(w,o){if(isMobile()&&o){ui.lib=false;ui.side=false}sp0(w,o);syncNav()}}

/* al entrar en el teléfono, los paneles empiezan cerrados y el dibujo ocupa la pantalla */
function onMode(){if(isMobile()){ui.lib=false;ui.side=false;applyUI()}else{appEl.classList.remove("opts-open","menu-open")}syncNav();if(S){autoFit=true;requestAnimationFrame(fit)}}
mq.addEventListener?mq.addEventListener("change",onMode):mq.addListener(onMode);
if(isMobile()){ui.lib=false;ui.side=false;applyUI()}
$("tabP").addEventListener("click",()=>setTimeout(syncNav));$("tabB").addEventListener("click",()=>setTimeout(syncNav));
