/* =====================================================================
   guia.js — Primeros pasos para quien abre la app por primera vez.
   · Bienvenida con tres caminos: recorrido guiado, ejemplo armado o
     empezar de cero.
   · Recorrido: ilumina un botón a la vez y explica para qué sirve.
     En el teléfono señala la barra de abajo y el menú.
   · Se repite desde Ayuda → Guía de primeros pasos.
   ===================================================================== */
const GUIA_KEY="taller-tableros-guia";
const STEPS_PC=[
  ["#libRail","Componentes","Aquí están los breakers, contactores, supervisores, protectores y más. Ábrelo y toca o arrastra un componente para ponerlo en el tablero."],
  ["#stage","Tu tablero","Este es el dibujo. En una caja de breakers toca un espacio con <b>+</b> para poner un breaker; toca cualquier componente para cambiarlo o quitarlo. Doble clic lo enciende o apaga."],
  ["#boardTools .pop-btn","Ajustes del tablero","Elige caja de breakers o riel DIN, cuántos espacios, el sistema (120/240 V o 208Y/120 V) y el breaker principal."],
  ["#vBoard","Tres vistas","<b>Tablero</b>: armas las protecciones. <b>Cablear tablero</b>: tiendes los cables por dentro. <b>Pared</b>: llevas los circuitos a tomas, luces y aparatos."],
  ["#goWire","Cablear y probar","En la pared tocas un tornillo y luego otro para tender un cable. Con <b>▶ Probar</b> ves cómo fluye la corriente, simulas fallas, bajones de luz y la app te dice por qué algo no enciende."],
  ["#tpl","Plantillas","¿Primera vez? Carga un ejemplo armado (casa, local comercial, bomba trifásica…) y mira cómo está hecho."],
  ["#calc","Calculadora","Dime qué vas a conectar y te dice el breaker, el cable y el estabilizador o inversor que necesitas."],
  ["#sideRail","Propiedades y presupuesto","Aquí cambias los datos de lo que seleccionas y ves el <b>presupuesto en $</b> listo para enviar."],
  ["#saveBtn","Guardar","Todo se guarda solo. Con tu cuenta, también en la nube: el indicador junto al nombre te dice si está guardado."],
  ["#uni","Unifilar y PDF","El diagrama unifilar se genera solo. Con <b>PDF</b> sacas el documento con tu logo para el cliente."],
  ["#acct","Tu cuenta","Crea tu cuenta gratis para guardar en la nube y probar todo PRO por 24 horas."],
  ["#helpFab","Ayuda","Cuando tengas una duda o una idea, toca aquí: me escribes, reportas un error o repites esta guía."],
];
const STEPS_MOVIL=[
  ["#mnLib","Componentes","Abre la lista de breakers, contactores, supervisores y más. Tócalos para ponerlos en el tablero."],
  ["#stage","Tu tablero","Toca un espacio con <b>+</b> para poner un breaker y toca cualquier componente para cambiarlo. Desliza con un dedo para moverte y pellizca para acercar."],
  ["#vBoard","Tres vistas","<b>Tablero</b>: armas las protecciones. <b>Cablear</b>: tiendes los cables por dentro. <b>Pared</b>: llevas los circuitos a tomas, luces y aparatos, y presionas <b>▶ Probar</b>."],
  ["#mnOpts","Ajustes","Tipo de tablero, espacios, sistema y opciones de la pared."],
  ["#mnProps","Propiedades","Los datos de lo que tocas: amperaje, nombre del circuito, carga…"],
  ["#mnQuote","Presupuesto","El total en $ y el presupuesto listo para enviar por WhatsApp."],
  ["#mMenu","Menú","Plantillas de ejemplo, calculadora, proyectos, unifilar, PDF y tu cuenta."],
  ["#syncChip","Guardado","Todo se guarda solo. Con tu cuenta, también en la nube: aquí ves si está guardado."],
  ["#helpFab","Ayuda","Dudas, ideas o errores: tócalo para escribirme o repetir esta guía."],
];
let tour=null;
const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=="hidden"};
function tourEl(){let o=$("tour");if(o)return o;o=document.createElement("div");o.id="tour";o.innerHTML=`<div class="tour-hole"></div><div class="tour-bub" role="dialog" aria-live="polite"></div>`;document.body.appendChild(o);
  o.addEventListener("click",e=>{const b=e.target.closest("[data-t]");if(!b)return;const a=b.dataset.t;a==="next"?tourGo(tour.i+1):a==="prev"?tourGo(tour.i-1):a==="end"?tourEnd():null});return o}
function tourStart(){closeModal();if(typeof isMobile==="function"&&isMobile()&&typeof setMenu==="function")setMenu(false);
  const steps=(typeof isMobile==="function"&&isMobile()?STEPS_MOVIL:STEPS_PC).filter(([s])=>visible(document.querySelector(s)));
  tour={steps,i:0};tourEl().hidden=false;document.body.classList.add("touring");tourGo(0)}
function tourGo(i){if(!tour)return;if(i<0)i=0;if(i>=tour.steps.length){tourEnd(true);return}tour.i=i;
  const [sel,title,text]=tour.steps[i],el=document.querySelector(sel),o=tourEl(),hole=o.querySelector(".tour-hole"),bub=o.querySelector(".tour-bub");
  if(!visible(el)){tourGo(i+1);return}
  const r=el.getBoundingClientRect(),pad=6,big=r.width*r.height>window.innerWidth*window.innerHeight*.35;
  Object.assign(hole.style,{left:r.left-pad+"px",top:r.top-pad+"px",width:r.width+2*pad+"px",height:r.height+2*pad+"px"});
  bub.innerHTML=`<div class="tour-n">Paso ${i+1} de ${tour.steps.length}</div><h3>${title}</h3><p>${text}</p>
   <div class="row-btns"><button class="btn sm" data-t="end">Saltar guía</button><span class="sp"></span>${i?`<button class="btn sm" data-t="prev">Anterior</button>`:""}<button class="btn sm primary" data-t="next">${i===tour.steps.length-1?"Terminar":"Siguiente"}</button></div>`;
  /* la burbuja va debajo del elemento, o arriba si no cabe; si el elemento es enorme, en el centro */
  const bw=Math.min(360,window.innerWidth-24);bub.style.width=bw+"px";const bh=bub.offsetHeight;let x=Math.min(Math.max(12,r.left+r.width/2-bw/2),window.innerWidth-bw-12),y;
  if(big){x=(window.innerWidth-bw)/2;y=Math.max(12,(window.innerHeight-bh)/2)}else if(r.bottom+pad+12+bh<window.innerHeight)y=r.bottom+pad+12;else if(r.top-pad-12-bh>0)y=r.top-pad-12-bh;else y=Math.max(12,window.innerHeight-bh-12);
  Object.assign(bub.style,{left:x+"px",top:y+"px"});bub.querySelector('[data-t="next"]').focus({preventScroll:true})}
function tourEnd(done){const o=$("tour");if(o)o.hidden=true;document.body.classList.remove("touring");tour=null;lsSet(GUIA_KEY,"1");if(done)guiaFinal()}
window.addEventListener("resize",()=>{if(tour)tourGo(tour.i)});
document.addEventListener("keydown",e=>{if(!tour)return;if(e.key==="Escape"){e.preventDefault();tourEnd()}else if(e.key==="ArrowRight"||e.key==="Enter"){e.preventDefault();tourGo(tour.i+1)}else if(e.key==="ArrowLeft"){e.preventDefault();tourGo(tour.i-1)}},true);

/* Bienvenida y cierre: elegir cómo empezar */
function startWith(k){closeModal();if(k==="tour"){tourStart();return}if(k==="nuevo"){newProjectDialog();return}
  const s=$("tpl");s.value=k;s.dispatchEvent(new Event("change"))}
function guiaWelcome(){lsSet(GUIA_KEY,"1");
  openModal(`<h2>👋 Bienvenido a Taller de Tableros</h2><p class="note">Diseña tableros eléctricos, cabléalos, pruébalos con un simulador y saca el presupuesto, <b>antes de tocar un cable</b>. ¿Cómo quieres empezar?</p>
   <div class="help-grid">
    <button class="help-card" data-w="tour"><b>🧭 Ver la guía (1 minuto)</b><span>Te muestro para qué sirve cada parte de la pantalla.</span></button>
    <button class="help-card" data-w="casaVE"><b>🏠 Ver un ejemplo: casa</b><span>Caja de breakers de una casa, ya cableada en la pared.</span></button>
    <button class="help-card" data-w="motor"><b>⚙️ Ver un ejemplo: bomba trifásica</b><span>Arranque con contactor, relé térmico y pulsadores.</span></button>
    <button class="help-card" data-w="nuevo"><b>✏️ Empezar de cero</b><span>Crea tu propio proyecto.</span></button>
   </div><div class="row-btns"><button class="btn" data-close>Explorar por mi cuenta</button></div>`);
  $("dlg").querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>startWith(b.dataset.w))}
function guiaFinal(){openModal(`<h2>🎉 ¡Listo!</h2><p class="note">Ya conoces lo principal. Lo mejor para aprender es ver un ejemplo y presionar <b>▶ Probar</b> en la pared.</p>
   <div class="help-grid"><button class="help-card" data-w="casaVE"><b>🏠 Abrir el ejemplo de una casa</b><span>Y luego Pared → ▶ Probar.</span></button><button class="help-card" data-w="nuevo"><b>✏️ Empezar mi proyecto</b><span>Desde cero.</span></button></div>
   <div class="row-btns"><button class="btn" data-close>Cerrar</button></div>`);
  $("dlg").querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>startWith(b.dataset.w))}

/* primera visita: bienvenida (si no hay otra ventana abierta) */
if(!lsGet(GUIA_KEY))setTimeout(()=>{if($("modal").hidden&&!tour){hideAlert();guiaWelcome()}},1200);
