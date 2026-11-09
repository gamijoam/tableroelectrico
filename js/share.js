/* =====================================================================
   share.js — Mis precios y envío por WhatsApp.
   · Mis precios: lo que edites en la columna de costo se guarda en este
     navegador y se usa en todos tus proyectos.
   · WhatsApp: en el teléfono comparte la imagen del presupuesto o el PDF
     (eliges WhatsApp en el menú de compartir); en la computadora abre
     WhatsApp con el presupuesto escrito, listo para enviar al cliente.
   ===================================================================== */
const PRICEKEY="taller-tableros-precios";
function myPrices(){try{return JSON.parse(lsGet(PRICEKEY)||"{}")||{}}catch(e){return{}}}
function saveMyPrices(m){return lsSet(PRICEKEY,JSON.stringify(m))}
function setMyPrice(desc,def,val){const m=myPrices();if(val===""||val==null||+val===def)delete m[desc];else m[desc]=Math.max(0,+val);
  if(!saveMyPrices(m))toast("No se pudo guardar el precio en este navegador.");
  if(S.quote.over[desc]!=null)mutate(()=>{delete S.quote.over[desc]});else renderAll()}
function resetPricesDialog(){const n=Object.keys(myPrices()).length+Object.keys(S.quote.over).length;
  openModal(`<h2>¿Volver a los precios sugeridos?</h2><p class="note">Se borran los ${n} precios que editaste. Esto afecta a todos tus proyectos guardados en este navegador.</p>
   <div class="row-btns"><button class="btn primary" id="rp-ok">Borrar mis precios</button><button class="btn" data-close>Cancelar</button></div>`);
  $("rp-ok").onclick=()=>{saveMyPrices({});closeModal();mutate(()=>{S.quote.over={}});toast("Listo: se usan los precios sugeridos.")}}

/* ---------- WhatsApp ---------- */
/* número internacional sin signos; los números venezolanos 0412… pasan a 58412… */
/* número local → internacional con el código del país elegido (+58, +57, +54…) */
function waPhone(s){const raw=String(s||"").trim();let d=raw.replace(/\D/g,"");if(!d)return"";if(raw.startsWith("+"))return d;if(d.startsWith("00"))return d.slice(2);
  const cc=(typeof pais==="function"&&pais().cc)||"58";if(d.startsWith(cc)&&d.length>=cc.length+8)return d;
  if(d.startsWith("0"))d=d.replace(/^0+/,"");return d.length>=7&&d.length<=10?cc+d:d}
function waText(d){const P=S.project,Q=S.quote,co=getCompany(),L=[`*PRESUPUESTO — ${P.name}*`];
  if(P.client)L.push(`Cliente: ${P.client}`);L.push(`Fecha: ${P.date} · válido por ${Q.valid} días`,"","*Materiales y equipos*");
  const max=25;d.mat.slice(0,max).forEach(e=>L.push(`• ${fmtQ(e.q)}${e.u?" "+e.u:""} × ${e.desc}: ${fmtUSD(e.total)}`));
  if(d.mat.length>max)L.push(`• y ${d.mat.length-max} renglones más (detalle en el PDF)`);
  if(d.lab.length){L.push("","*Mano de obra*");d.lab.forEach(l=>L.push(`• ${l.q} × ${l.desc}: ${fmtUSD(l.total)}`))}
  L.push("",`Materiales y equipos: ${fmtUSD(d.matSale)}`,`Mano de obra: ${fmtUSD(d.labor)}`);if(Q.ivaOn)L.push(`${pais().tax} ${fmtNum(Q.iva,0)}%: ${fmtUSD(d.iva)}`);
  L.push(`*TOTAL: ${fmtUSD(d.total)}*`);if(+Q.rate>0&&curLocal())L.push(`Equivalente: ${fmtLocal(d.total*Q.rate)} (tasa ${rateTxt(Q.rate)})`);
  const who=[co.name||P.author,co.phone].filter(Boolean).join(" · ");if(who)L.push("",who);return L.join("\n")}
/* imagen del presupuesto como archivo (la misma de "Imagen del presupuesto") */
async function quoteFile(){const q=quoteImageSvg(),url=await svgPng(q.svg,q.W,q.H,2),b=await (await fetch(url)).blob();
  return new File([b],slug(S.project.name+" presupuesto")+".jpg",{type:"image/jpeg"})}
const canShareFiles=f=>{try{return!!(navigator.canShare&&navigator.share&&navigator.canShare({files:[f]}))}catch(e){return false}};
const shareProbe=()=>canShareFiles(new File(["x"],"x.jpg",{type:"image/jpeg"}));
async function shareFile(f,text){text=vtxt(trLines(String(text||""))).replace(/\u2060/g,"");try{await navigator.share({files:[f],text,title:S.project.name});return true}
  catch(e){if(e&&e.name==="AbortError")return false;toast("No se pudo compartir: "+(e&&e.message||e));return false}}
function openWa(phone,text){text=vtxt(trLines(String(text||""))).replace(/\u2060/g,"");const url=`https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(text)}`;const w=window.open(url,"_blank");if(w)try{w.opener=null}catch(e){}
  if(!w)openModal(`<h2>Abrir WhatsApp</h2><p class="note">Tu navegador bloqueó la ventana nueva. Toca el enlace para abrir WhatsApp con el presupuesto.</p><p><a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener">Abrir WhatsApp</a></p><div class="row-btns"><button class="btn" data-close>Cerrar</button></div>`)}

function waDialog(){const d=quoteData();if(d.mat.length<2&&!d.lab.length){toast("Agrega componentes al tablero para armar el presupuesto.");return}
  const P=S.project,share=shareProbe();
  openModal(`<h2>Enviar por WhatsApp</h2><p class="note">${share?"Comparte la imagen del presupuesto y elige WhatsApp en el menú. También puedes mandarlo escrito.":"Se abre WhatsApp con el presupuesto escrito, listo para enviar. Si quieres adjuntar la imagen, descárgala primero."}</p>
   <div class="fields"><label class="field wide"><span>WhatsApp del cliente (opcional)</span><input class="txt" id="wa-phone" type="tel" inputmode="tel" value="${esc(P.phone||"")}" placeholder="0412 123 4567"></label></div>
   <div class="row-btns">${share?`<button class="btn primary" id="wa-img">Compartir imagen</button><button class="btn" id="wa-txt">Enviar como texto</button>`:`<button class="btn primary" id="wa-txt">Abrir WhatsApp</button><button class="btn" id="wa-dl">Descargar imagen</button>`}<button class="btn" data-close>Cancelar</button></div>
   <p class="note" id="wa-msg" role="status"></p>`);
  const keepPhone=()=>{const v=$("wa-phone").value.trim();if(v!==(P.phone||""))mutate(()=>{S.project.phone=v});return v};
  $("wa-txt").onclick=()=>{const ph=keepPhone();closeModal();openWa(ph,waText(quoteData()))};
  const bi=$("wa-img");if(bi)bi.onclick=async()=>{keepPhone();$("wa-msg").textContent="Preparando la imagen…";bi.disabled=true;
    try{const f=await quoteFile();if(await shareFile(f,`Presupuesto: ${S.project.name} · Total ${fmtUSD(quoteData().total)}`))closeModal();else $("wa-msg").textContent=""}
    catch(e){$("wa-msg").textContent="No se pudo preparar la imagen: "+(e&&e.message||e)}finally{bi.disabled=false}};
  const bd=$("wa-dl");if(bd)bd.onclick=async()=>{keepPhone();try{const f=await quoteFile();saveFile(f.name,f)}catch(e){toast("No se pudo preparar la imagen.")}}}
