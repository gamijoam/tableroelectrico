/* =====================================================================
   layout.js — Paneles laterales plegables, pantalla completa y alertas.
   Los paneles empiezan guardados y solo se abren cuando el usuario los
   expande; la preferencia se recuerda en este navegador.
   ===================================================================== */
const UIKEY="taller-tableros-ui";
const ui=(()=>{let v={};try{v=JSON.parse(localStorage.getItem(UIKEY)||"{}")||{}}catch(e){}return{lib:!!v.lib,side:!!v.side,focus:false,prev:null}})();
function applyUI(){const a=$("app");a.classList.toggle("lib-closed",!ui.lib);a.classList.toggle("side-closed",!ui.side);a.classList.toggle("focus",ui.focus);
  $("libRail").setAttribute("aria-expanded",String(ui.lib));$("sideRail").setAttribute("aria-expanded",String(ui.side));
  $("fs").textContent=ui.focus?"Salir de pantalla completa":"Pantalla completa";$("fs").setAttribute("aria-pressed",String(ui.focus));
  try{localStorage.setItem(UIKEY,JSON.stringify({lib:ui.lib,side:ui.side}))}catch(e){}
  if(autoFit&&S)requestAnimationFrame(()=>S&&fit())}
function setPanel(which,open){ui[which]=open;applyUI()}
function setFocus(on){
  if(on){ui.focus=true;const el=document.documentElement;
    if(el.requestFullscreen&&!document.fullscreenElement){try{el.requestFullscreen().catch(()=>{})}catch(e){}}}
  else{ui.focus=false;
    if(document.fullscreenElement&&document.exitFullscreen){try{document.exitFullscreen().catch(()=>{})}catch(e){}}}
  applyUI()}
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&ui.focus)setFocus(false)});
$("libRail").onclick=()=>setPanel("lib",true);$("libClose").onclick=()=>setPanel("lib",false);
$("sideRail").onclick=()=>setPanel("side",true);$("sideClose").onclick=()=>setPanel("side",false);
$("fs").onclick=()=>setFocus(!ui.focus);
$("fUndo").onclick=()=>undo();$("fRedo").onclick=()=>redo();$("fPng").onclick=()=>$("png").click();

/* ---------- alertas sobre el área de trabajo ---------- */
const ALERT_ICON={
 crit:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor"/></svg>`,
 warn:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v5M12 17.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
 ok:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`};
let alertTimer=null;
function showAlert(lvl,title,msg,extra=""){const el=$("alert");clearTimeout(alertTimer);el.className="alert "+lvl;el.setAttribute("role",lvl==="crit"?"alert":"status");
  el.innerHTML=`<span class="alert-ico">${ALERT_ICON[lvl]||ALERT_ICON.warn}</span><div class="alert-body"><b>${esc(title)}</b><p>${esc(msg)}${extra?` <span class="alert-extra">(${esc(extra)})</span>`:""}</p></div>
   <div class="alert-btns"><button class="btn" id="al-more">Ver detalles</button><button class="icon-btn" id="al-x" aria-label="Cerrar alerta">×</button></div>`;
  el.hidden=false;$("al-x").onclick=hideAlert;$("al-more").onclick=()=>{setPanel("side",true);$("tabP").click();hideAlert()};
  if(lvl!=="crit")alertTimer=setTimeout(hideAlert,7000)}
function hideAlert(){clearTimeout(alertTimer);$("alert").hidden=true}
applyUI();
