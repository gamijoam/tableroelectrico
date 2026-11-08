/* =====================================================================
   pwa.js — Instalar la app y usarla sin internet.
   · Registra sw.js, que guarda la app en el dispositivo.
   · Botón "Instalar app": en Android y en la computadora abre el aviso
     del navegador; en iPhone y iPad explica cómo agregarla al inicio.
   · Avisa cuando se pierde o vuelve la conexión.
   ===================================================================== */
const standalone=()=>window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
let installEvt=null;
if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost"))
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;$("install").hidden=false});
window.addEventListener("appinstalled",()=>{installEvt=null;$("install").hidden=true;toast("App instalada. Ábrela desde el ícono Tableros, también sin internet.")});
if(isIOS()&&!standalone())$("install").hidden=false;
$("install").onclick=async()=>{
  if(installEvt){installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;$("install").hidden=true;return}
  openModal(`<h2>Instalar Taller de Tableros</h2><p class="note">Queda como una app en tu pantalla de inicio y funciona sin internet.</p>
   <ol class="steps"><li>Abre esta página en <b>Safari</b>.</li><li>Toca el botón <b>Compartir</b> (el cuadro con la flecha hacia arriba).</li><li>Elige <b>Agregar a inicio</b> y luego <b>Agregar</b>.</li></ol>
   <div class="row-btns"><button class="btn primary" data-close>Entendido</button></div>`)};
window.addEventListener("offline",()=>toast("Sin conexión: la app sigue funcionando y tus proyectos se guardan en este dispositivo."));
window.addEventListener("online",()=>toast("Conexión restablecida."));
