/* =====================================================================
   materiales.js — Lista de materiales para comprar.
   Sale del mismo cálculo del presupuesto (todo lo que tiene el proyecto),
   agrupada como se compra en la ferretería, con consumibles sugeridos
   (cinta, empalmes, grapas y accesorios de tubería).
   Se puede ver con o sin precios, copiar, enviar por WhatsApp o sacar en PDF.
   ===================================================================== */
const BOM_GROUPS=["Tablero","Protecciones y componentes","Cables","Tubería y accesorios","Puntos eléctricos","Equipos","Consumibles sugeridos"];
function bomData(){const q=quoteData(),wallQn=new Set(),extD=new Set(S.ext.map(x=>EXT[x.type].desc(x.p)));
  for(const wl of S.walls)for(const it of wl.items){const dv=DEV[it.type];if(dv&&dv.price)wallQn.add(devQn(dv,it.p))}
  const box=new Set([S.kind==="lc"?lcBoxDesc():dinBoxDesc(),"Riel DIN 35 mm con tapa troquelada para la caja"]);
  const grp=d=>/^Cable/.test(d)?"Cables":/^Tubo/.test(d)?"Tubería y accesorios":box.has(d)?"Tablero":extD.has(d)?"Equipos":wallQn.has(d)?"Puntos eléctricos":"Protecciones y componentes";
  const items=q.mat.map(e=>({g:grp(e.desc),desc:e.desc,q:e.q,u:e.u||"",unit:e.unit,total:e.total,refs:e.refs}));
  /* consumibles: se estiman por la cantidad de puntos y de tubería */
  const pts=S.walls.reduce((a,wl)=>a+wl.items.filter(i=>i.type!=="panel"&&i.type!=="feed"&&DEV[i.type]&&DEV[i.type].price).length,0);
  const tubeM=items.filter(i=>i.g==="Tubería y accesorios").reduce((a,i)=>a+i.q,0),circ=S.kind==="lc"?S.lc.items.length:S.items.filter(i=>i.type==="mcb").length;
  const add=(desc,q,u,unit)=>{if(q>0)items.push({g:"Consumibles sugeridos",desc,q,u,unit,total:r2(unit*q),sug:true})};
  add("Cinta aislante (rollo)",Math.max(1,Math.ceil((pts+circ)/10)),"",1.2);
  add("Conector de empalme (tipo resorte o regleta)",pts*2,"",.15);
  add("Terminales tipo puntera para los breakers",circ*3,"",.05);
  if(tubeM>0){add("Grapas o abrazaderas para tubo",Math.ceil(tubeM/1),"",.1);add("Curvas y uniones para tubo",Math.ceil(tubeM/3),"",.4);add("Cajas de paso o registro",Math.max(1,Math.ceil(tubeM/12)),"",1.5)}
  if(pts)add("Tornillos y ramplugs para fijar cajas",pts*2,"",.05);
  return{items,groups:BOM_GROUPS.filter(g=>items.some(i=>i.g===g)),total:r2(items.reduce((a,i)=>a+i.total,0))}}
const bomQ=i=>`${fmtQ(i.q)}${i.u?" "+i.u:""}`;
/* texto para WhatsApp o para copiar */
function bomText(withPrice){const d=bomData(),P=S.project,L=[`*Lista de materiales*: ${P.name}${P.client?" · "+P.client:""}`,""];
  for(const g of d.groups){L.push(`*${g}*`);d.items.filter(i=>i.g===g).forEach(i=>L.push(`• ${bomQ(i)} × ${i.desc}${withPrice?` — ${fmtUSD(i.total)}`:""}`));L.push("")}
  if(withPrice)L.push(`Total aproximado: ${fmtUSD(d.total)}`);L.push(`Calibres y colores según ${pais().norma} (${pais().n}).`);return L.join("\n")}
function bomDialog(){const st=bomDialog.price??false,d=bomData();
  if(!d.items.length){toast("Todavía no hay materiales: agrega componentes al tablero o puntos en la pared.");return}
  openModal(`<h2>📋 Lista de materiales</h2><p class="note">Todo lo que lleva el proyecto, agrupado para comprarlo. Los consumibles son una estimación: ajústalos a tu obra.</p>
   <label class="switch"><input type="checkbox" id="bom-p"${st?" checked":""}> Mostrar precios</label>
   <div class="bom">${d.groups.map(g=>`<h3>${esc(g)}</h3><table class="bom-t"><tbody>${d.items.filter(i=>i.g===g).map(i=>`<tr><td class="q">${esc(bomQ(i))}</td><td>${esc(i.desc)}${i.refs&&i.refs.length?`<small>${esc(i.refs.slice(0,6).join(", "))}${i.refs.length>6?"…":""}</small>`:""}</td>${st?`<td class="r">${fmtUSD(i.total)}</td>`:""}</tr>`).join("")}</tbody></table>`).join("")}
    ${st?`<p class="bom-tot">Total aproximado: <b>${fmtUSD(d.total)}</b></p>`:""}</div>
   <div class="row-btns"><button class="btn wa" id="bom-wa">Enviar por WhatsApp</button><button class="btn primary" id="bom-pdf">PDF</button><button class="btn" id="bom-copy">Copiar</button><span class="sp"></span><button class="btn" data-close>Cerrar</button></div><p class="note" id="bom-msg" role="status"></p>`);
  $("dlg").classList.add("wide");
  $("bom-p").onchange=e=>{bomDialog.price=e.target.checked;bomDialog()};
  $("bom-copy").onclick=async()=>{try{await navigator.clipboard.writeText(vtxt(bomText(st)).replace(/\u2060/g,""));$("bom-msg").textContent="Copiada: pégala donde quieras."}catch(e){$("bom-msg").textContent="No se pudo copiar en este navegador."}};
  $("bom-wa").onclick=()=>openWa("",bomText(st));
  $("bom-pdf").onclick=async()=>{const m=$("bom-msg");if(!window.jspdf){m.textContent="No se pudo cargar el generador de PDF. Revisa tu conexión.";return}
    try{m.textContent="Generando…";const blob=bomPdf(st),ok=await saveFile(slug(S.project.name)+"-materiales.pdf",blob);m.textContent=ok?"PDF listo.":"No se descargó."}catch(e){m.textContent="Hubo un problema: "+(e&&e.message||e)}}}
function bomPdf(withPrice){const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"letter",compress:true}),d=bomData(),fw=PDF_W-2*PM;
  pdfHeader(doc,getCompany(),"Lista de materiales");
  const cols=withPrice?[{h:"Cant.",w:22},{h:"Descripción",w:fw-22-30},{h:"Total",w:30,a:"r"}]:[{h:"Cant.",w:22},{h:"Descripción",w:fw-22}];
  const rows=[];for(const g of d.groups){rows.push({section:g});d.items.filter(i=>i.g===g).forEach(i=>rows.push({cells:withPrice?[bomQ(i),i.desc,fmtUSD(i.total)]:[bomQ(i),i.desc]}))}
  let y=pdfTable(doc,38,cols,rows,"Lista de materiales")+6;doc.setFontSize(8.5);doc.setTextColor(90);
  if(withPrice){doc.setFont("helvetica","bold");doc.setTextColor(29,35,38);doc.text(pdfText(`Total aproximado: ${fmtUSD(d.total)}`),PDF_W-PM,y,{align:"right"});y+=6;doc.setFont("helvetica","normal");doc.setTextColor(90)}
  doc.text(pdfText(`Calibres y colores según ${pais().norma} (${pais().n}). Los consumibles son una estimación.`),PM,Math.min(y+2,PDF_H-PM));
  return doc.output("blob")}
$("bom").onclick=bomDialog;
