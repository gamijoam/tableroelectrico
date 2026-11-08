/* =====================================================================
   touch.js — Pantallas táctiles (tablet y teléfono).
   · Arrastrar el dedo sobre la pared vacía desplaza la vista.
   · Pellizcar con dos dedos acerca o aleja (tablero y pared).
   · Al arrastrar algo cerca del borde, la vista se desplaza sola.
   ===================================================================== */
const stageEl=$("stage"),touchPts=new Map();let pan=null,pinch=null,edgeRAF=null,edgeAt=null;

/* Desplazar la vista arrastrando sobre el fondo de la pared (dedo o mouse) */
function startPan(e){pan={x:e.clientX,y:e.clientY,sl:stageEl.scrollLeft,st:stageEl.scrollTop,moved:false}}
window.addEventListener("pointermove",e=>{if(!pan||pinch)return;const dx=e.clientX-pan.x,dy=e.clientY-pan.y;if(!pan.moved&&Math.hypot(dx,dy)<6)return;pan.moved=true;
  stageEl.scrollLeft=pan.sl-dx;stageEl.scrollTop=pan.st-dy});
window.addEventListener("pointerup",()=>{pan=null});window.addEventListener("pointercancel",()=>{pan=null});

/* Pellizcar: dos dedos sobre el escenario cambian el zoom alrededor del punto medio */
stageEl.addEventListener("pointerdown",e=>{if(e.pointerType!=="touch")return;touchPts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(touchPts.size===2){const [a,b]=[...touchPts.values()],r=stageEl.getBoundingClientRect(),mx=(a.x+b.x)/2-r.left,my=(a.y+b.y)/2-r.top;
    pinch={d0:Math.hypot(a.x-b.x,a.y-b.y)||1,z0:zoom,mx,my,cx:(stageEl.scrollLeft+mx)/zoom,cy:(stageEl.scrollTop+my)/zoom};
    /* el segundo dedo cancela lo que hacía el primero */
    pan=null;leverPress=null;compPress=null;wireDrag=null;railDrag=null;if(typeof drag!=="undefined")drag=null;ghost.hidden=true;
    if(wdrag&&!wdrag.moved)wdrag=null;if(pending){pending=null}}},true);
window.addEventListener("pointermove",e=>{if(!touchPts.has(e.pointerId))return;touchPts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!pinch||touchPts.size<2)return;
  const [a,b]=[...touchPts.values()],z=Math.max(.2,Math.min(2.5,pinch.z0*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d0));if(Math.abs(z-zoom)<.01)return;
  autoFit=false;zoom=z;if(!pinch.raf)pinch.raf=requestAnimationFrame(()=>{if(!pinch)return;pinch.raf=null;renderBoard();stageEl.scrollLeft=pinch.cx*zoom-pinch.mx;stageEl.scrollTop=pinch.cy*zoom-pinch.my})},{passive:true});
const endTouch=e=>{touchPts.delete(e.pointerId);if(touchPts.size<2&&pinch){pinch=null;renderAll()}};
window.addEventListener("pointerup",endTouch);window.addEventListener("pointercancel",endTouch);

/* Al arrastrar cerca del borde del escenario, la vista avanza sola */
function edgeScroll(e){edgeAt=e?{x:e.clientX,y:e.clientY}:null;if(!edgeAt){cancelAnimationFrame(edgeRAF);edgeRAF=null;return}if(edgeRAF)return;
  const step=()=>{if(!edgeAt){edgeRAF=null;return}const r=stageEl.getBoundingClientRect(),m=56,sp=k=>Math.round(Math.max(0,Math.min(1,k/m))*16);
    const dx=edgeAt.x<r.left+m?-sp(r.left+m-edgeAt.x):edgeAt.x>r.right-m?sp(edgeAt.x-(r.right-m)):0,dy=edgeAt.y<r.top+m?-sp(r.top+m-edgeAt.y):edgeAt.y>r.bottom-m?sp(edgeAt.y-(r.bottom-m)):0;
    if(dx||dy){stageEl.scrollLeft+=dx;stageEl.scrollTop+=dy}edgeRAF=requestAnimationFrame(step)};edgeRAF=requestAnimationFrame(step)}
window.addEventListener("pointerup",()=>edgeScroll(null));window.addEventListener("pointercancel",()=>edgeScroll(null));
window.addEventListener("pointermove",e=>{if((wdrag&&wdrag.moved)||(wireDrag&&wireDrag.moved&&pending)||(typeof drag!=="undefined"&&drag&&drag.moving))edgeScroll(e)},{passive:true});
