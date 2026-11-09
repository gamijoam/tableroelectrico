/* =====================================================================
   pdf.js — Documento PDF profesional: tablero y directorio, diagrama
   unifilar generado desde la caja, cuadro de cargas con demanda,
   presupuesto y paredes. Usa jsPDF (cargado desde cdnjs) y los dibujos
   SVG de la app convertidos a imagen. Tamaño carta.
   ===================================================================== */
const PDF_W=215.9,PDF_H=279.4,PM=14;
/* Las fuentes estándar del PDF no traen símbolos como Φ o →: se reemplazan */
const pdfText=s=>String(s??"").replace(/Φ/g,"F").replace(/Δ/g,"D").replace(/[→↳]/g,"-").replace(/…/g,"...").replace(/[^\x00-\xFF–—]/g,"");
function svgPng(inner,W,H,scale=2){return new Promise((res,rej)=>{const src=`<svg xmlns="http://www.w3.org/2000/svg" width="${W*scale}" height="${H*scale}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}</defs><rect width="${W}" height="${H}" fill="#ffffff"/>${inner}</svg>`;
  const img=new Image();img.onload=()=>{const c=document.createElement("canvas");c.width=W*scale;c.height=H*scale;c.getContext("2d").drawImage(img,0,0);try{res(c.toDataURL("image/jpeg",.86))}catch(e){rej(e)}};
  img.onerror=()=>rej(new Error("no se pudo dibujar la imagen"));img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(src)})}

/* Demanda simplificada para vivienda: 100% de los primeros 3.000 W y 35% del resto (referencial) */
function demandCalc(){const W=lcCalc().W,dem=W<=3000?W:3000+(W-3000)*.35,V=S.lc.sys==="1F"?240:208*Math.sqrt(3),I=dem/V;
  const sug=MAINS.filter(m=>m>0).find(m=>m>=I*1.25)||MAINS[MAINS.length-1];return{W,dem,I,sug,awg:cabTxt(sug)}}

/* Parte un texto en dos líneas sin cortar palabras */
function wrap2(t,n){const w=String(t).split(/\s+/);let a="",i=0;while(i<w.length&&(a+(a?" ":"")+w[i]).length<=n){a+=(a?" ":"")+w[i];i++}
  if(!a){a=w[0].slice(0,n);w[0]=w[0].slice(n);}const rest=w.slice(i).join(" ").trim();return[a,cutText(rest,n)]}
/* ---------- diagrama unifilar ---------- */
function unifilarSvg(){const L=S.lc,calc=lcCalc(),its=[...L.items].sort((a,b)=>calc.per[a.id].cs[0]-calc.per[b.id].cs[0]);
  const cols=8,cw=128,W=60+cols*cw+40,rows=Math.max(1,Math.ceil(its.length/cols)),top=250,rh=320,H=top+rows*rh+20,x0=70,ink="#1d2326",line=`stroke="${ink}" stroke-width="2" fill="none"`;
  const tx=(x,y,s,o={})=>T(x,y,s,Object.assign({ff:SANS,fw:400,c:ink,a:"start",fs:10},o));
  const brk=(x,y)=>`<path d="M${x} ${y}v8M${x} ${y+8}l13 20M${x} ${y+30}v8" ${line}/><path d="M${x-4} ${y+4}l8 8M${x+4} ${y+4}l-8 8" stroke="${ink}" stroke-width="1.6"/>`;
  let s=tx(30,34,"DIAGRAMA UNIFILAR",{fs:18,fw:700})+tx(30,54,`${S.project.name} · ${sysLabel()} · 60 Hz`,{c:"#5b6266"});
  s+=C(x0,92,15,"#fff",{s:ink,sw:2})+`<path d="M${x0-8} 92q4 -8 8 0t8 0" ${line}/>`+tx(x0+26,88,"Acometida de la compañía",{fw:600})+tx(x0+26,102,sysLabel(),{c:"#5b6266"});
  s+=`<path d="M${x0} 107V122" ${line}/>`+R(x0-20,122,40,28,"#fff",{s:ink,sw:2})+T(x0,140,"kWh",{fs:10,fw:700,c:ink,ff:SANS})+tx(x0+30,140,"Medidor de energía");
  s+=`<path d="M${x0} 150V160" ${line}/>`;
  if(L.main){s+=brk(x0,160)+tx(x0+22,180,`Principal ${L.main} A · ${PH().length}P`,{fw:600})+tx(x0+22,193,`Acometida sugerida ${cabTxt(L.main)}`,{c:"#5b6266",fs:9})}
  else s+=`<path d="M${x0} 160V198" ${line}/>`+tx(x0+22,182,"Zapatas principales (sin breaker principal)");
  if(L.aux.length)s+=tx(x0+330,112,"Protecciones generales en el riel auxiliar:",{fw:600,fs:9.5})+L.aux.slice(0,6).map((a,i)=>tx(x0+330,127+i*13,`${a.p.des||""} ${CAT[a.type].n}${a.p.name?" · "+a.p.name:""}`,{fs:9,c:"#3a4044"})).join("");
  /* barra de tierra y unión neutro-tierra */
  s+=`<path d="M${x0} 198V${top-30}" ${line}/>`+`<path d="M${x0-40} ${top-30}V${top-6}M${x0-50} ${top-6}h20M${x0-46} ${top-1}h12M${x0-42} ${top+4}h4" ${line}/>`+tx(x0-58,top-36,"N-T",{fs:8.5,c:"#5b6266"});
  for(let r=0;r<rows;r++){const by=top-30+r*rh,n=Math.min(cols,its.length-r*cols),x1=60+Math.max(1,n)*cw-cw/2;
    s+=`<path d="M${r?x0:x0-40} ${by}H${Math.max(x1,x0+20)}" stroke="${ink}" stroke-width="4"/>`;if(r)s+=`<path d="M${x0} ${by-rh}V${by}" stroke="${ink}" stroke-width="4"/>`}
  if(!its.length)s+=tx(x0+40,top+20,"La caja todavía no tiene breakers.",{c:"#5b6266"});
  its.forEach((b,i)=>{const r=Math.floor(i/cols),c=i%cols,x=60+c*cw+cw/2,y=top-30+r*rh,k=calc.per[b.id],warn=k.st!=="ok",col=k.st==="crit"?"#c0322a":warn?"#b5521d":ink;
    const nC=b.p.poles===3?4:3;
    s+=`<path d="M${x} ${y}V${y+28}" ${line}/>`+brk(x,y+28)+tx(x+16,y+46,`C${k.cs.join("-")}`,{fw:700,c:col})+tx(x+16,y+59,`${b.p.poles}P ${b.p.In} A`,{fs:9.5,c:col})+(b.p.type!=="Estándar"?tx(x+16,y+71,b.p.type,{fs:8.5,fw:700,c:"#1c5fa8"}):"");
    s+=`<path d="M${x} ${y+66}V${y+200}" ${line}/>`;for(let j=0;j<nC;j++)s+=`<path d="M${x-6} ${y+112+j*7}l12 -6" stroke="${ink}" stroke-width="1.6"/>`;
    s+=tx(x+10,y+140,cabTxt(b.p.In),{fs:9})+tx(x+10,y+152,`${k.V} V · ${fmtNum(k.I,1)} A`,{fs:8.5,c:"#5b6266"});
    const [l1,l2]=wrap2(b.p.name||"Sin nombre",16);
    s+=R(x-52,y+200,104,52,"#fff",{rx:4,s:col,sw:1.6})+T(x,y+218,l1,{fs:9.5,ff:SANS,fw:600,c:ink})+(l2?T(x,y+231,l2,{fs:9.5,ff:SANS,fw:600,c:ink}):"")+T(x,y+(l2?245:236),k.W?fmtNum(k.W,0)+" W":"Sin carga",{fs:9,ff:SANS,c:"#5b6266"})});
  return{svg:s,W,H}}

/* ---------- ayudantes de maquetación ---------- */
function pdfHeader(doc,co,title){let x=PM;
  if(co.logo){try{const h=16,w=Math.min(42,h*((co.logoW||1)/(co.logoH||1)));doc.addImage(co.logo,"PNG",PM,9,w,h);x=PM+w+4}catch(e){}}
  doc.setTextColor(29,35,38);doc.setFont("helvetica","bold");doc.setFontSize(12);doc.text(pdfText(co.name||"Taller de Tableros"),x,14);
  doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(90);const l=[co.rif&&pais().fis+" "+co.rif,co.phone,co.email].filter(Boolean).join(" · ");if(l)doc.text(pdfText(l),x,19);if(co.address)doc.text(pdfText(co.address),x,23.5);
  doc.setFont("helvetica","bold");doc.setFontSize(13);doc.setTextColor(28,95,168);doc.text(pdfText(title),PDF_W-PM,14,{align:"right"});
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(90);doc.text(pdfText(S.project.name),PDF_W-PM,19,{align:"right"});doc.text(pdfText([S.project.client,S.project.date].filter(Boolean).join(" · ")),PDF_W-PM,23.5,{align:"right"});
  doc.setDrawColor(29,35,38);doc.setLineWidth(.5);doc.line(PM,29,PDF_W-PM,29)}
function pdfImage(doc,img,w,h,y,maxH){const maxW=PDF_W-2*PM,k=Math.min(maxW/w,maxH/h),W=w*k,H=h*k;doc.addImage(img,"JPEG",(PDF_W-W)/2,y,W,H,undefined,"FAST");return y+H+6}
function pdfTable(doc,y,cols,rows,title){const lh=6.2,x0=PM,fw=PDF_W-2*PM;
  const head=()=>{doc.setFillColor(238,241,238);doc.rect(x0,y,fw,lh,"F");doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.setTextColor(80);let x=x0;
    cols.forEach(c=>{doc.text(pdfText(c.h),c.a==="r"?x+c.w-1.5:x+1.5,y+4.2,c.a==="r"?{align:"right"}:undefined);x+=c.w});y+=lh;doc.setFont("helvetica","normal");doc.setFontSize(8)};
  head();let z=0;
  for(const r of rows){if(y>PDF_H-PM-16){doc.addPage();pdfHeader(doc,getCompany(),title);y=36;head()}
    if(r.section){doc.setFont("helvetica","bold");doc.setTextColor(28,95,168);doc.text(pdfText(r.section),x0+1.5,y+4.4);doc.setFont("helvetica","normal");y+=lh;z=0;continue}
    if(z++%2){doc.setFillColor(248,249,248);doc.rect(x0,y,fw,lh,"F")}
    doc.setTextColor(...(r.color||[29,35,38]));let x=x0;
    cols.forEach((c,k)=>{let t=pdfText(r.cells[k]);while(t.length>2&&doc.getTextWidth(t)>c.w-3)t=t.slice(0,-4)+"...";doc.text(t,c.a==="r"?x+c.w-1.5:x+1.5,y+4.2,c.a==="r"?{align:"right"}:undefined);x+=c.w});
    doc.setDrawColor(226);doc.setLineWidth(.2);doc.line(x0,y+lh,PDF_W-PM,y+lh);y+=lh}
  return y}
function pdfKV(doc,y,rows,x1=PDF_W-PM-70,x2=PDF_W-PM){for(const [k,v,big] of rows){doc.setFont("helvetica",big?"bold":"normal");doc.setFontSize(big?12:9.5);doc.setTextColor(29,35,38);
  doc.text(pdfText(k),x1,y);doc.text(pdfText(v),x2,y,{align:"right"});y+=big?8:5.6}return y}

/* ---------- secciones ---------- */
function loadSection(doc,y){const calc=lcCalc(),its=[...S.lc.items].sort((a,b)=>calc.per[a.id].cs[0]-calc.per[b.id].cs[0]);
  const cols=[{h:"Circ.",w:15},{h:"Descripción",w:52},{h:"Breaker",w:24},{h:"Carga W",w:18,a:"r"},{h:"Corriente",w:19,a:"r"},{h:"Fase",w:13},{h:"V",w:11,a:"r"},{h:"Cable",w:15},{h:"Estado",w:20.9}];
  const rows=its.map(b=>{const k=calc.per[b.id];return{cells:[k.cs.join("-"),b.p.name||"Sin nombre",`${b.p.poles}P ${b.p.In} A${b.p.type!=="Estándar"?" "+b.p.type:""}`,fmtNum(k.W,0),fmtNum(k.I,1)+" A",k.ph.join("-"),k.V,cabTxt(b.p.In),{ok:"OK",warn:"Al límite",crit:"Sobrecargado"}[k.st]],
    color:k.st==="crit"?[192,50,42]:k.st==="warn"?[181,82,29]:null}});
  y=pdfTable(doc,y,cols,rows.length?rows:[{cells:["—","La caja no tiene breakers","","","","","","",""]}],"Cuadro de cargas")+8;
  if(y>PDF_H-80){doc.addPage();pdfHeader(doc,getCompany(),"Cuadro de cargas");y=40}
  const dm=demandCalc(),L=S.lc;doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.setTextColor(29,35,38);doc.text("Balance de fases",PM,y);doc.text("Demanda y protección principal",PDF_W/2+4,y);y+=6;
  let yl=y;for(const [ph,a] of Object.entries(calc.amps)){doc.setFont("helvetica","normal");doc.setFontSize(9.5);doc.text(`Fase ${ph}`,PM,yl);doc.text(fmtNum(a,1)+" A",PM+42,yl,{align:"right"});
    const mx=Math.max(1,calc.max);doc.setFillColor(219,231,244);doc.rect(PM+46,yl-3,40,3.4,"F");doc.setFillColor(28,95,168);doc.rect(PM+46,yl-3,40*a/mx,3.4,"F");yl+=6}
  doc.text(`Desbalance: ${Math.round(calc.imb)}%${calc.imb>20?" (conviene repartir mejor los circuitos)":""}`,PM,yl+1);
  pdfKV(doc,y,[["Norma de referencia",`${pais().n}: ${pais().norma}`],["Carga instalada",fmtNum(dm.W,0)+" W"],["Demanda estimada",fmtNum(dm.dem,0)+" W"],["Corriente de demanda",fmtNum(dm.I,1)+" A"],["Principal instalado",L.main?L.main+" A":"Sin principal"],["Principal sugerido",dm.sug+" A"],["Acometida sugerida","#"+dm.awg+" AWG cobre"]],PDF_W/2+4);
  y=Math.max(yl,y+6*5.6)+8;doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(110);
  doc.text(doc.splitTextToSize(pdfText("Método referencial para vivienda: 100% de los primeros 3.000 W y 35% del resto. Breakers al 80% para carga continua; cable de cobre THHN/THW a 75 °C. No sustituye el cálculo según el Código Eléctrico Nacional (CEN)."),PDF_W-2*PM),PM,y);return y+12}
function quoteSection(doc,y){const d=quoteData(),Q=S.quote,P=S.project;
  doc.setFont("helvetica","normal");doc.setFontSize(9.5);doc.setTextColor(29,35,38);doc.text(pdfText(`Cliente / obra: ${P.client||"—"}`),PM,y);doc.text(pdfText(`Válido por ${Q.valid} días · Precios en dólares (USD)`),PDF_W-PM,y,{align:"right"});y+=6;
  const cols=[{h:"Cant.",w:20,a:"r"},{h:"Descripción",w:112},{h:"P. unit.",w:26,a:"r"},{h:"Total",w:29.9,a:"r"}];
  const rows=[{section:"Materiales y equipos"},...d.mat.map(e=>({cells:[fmtQ(e.q)+(e.u?" "+e.u:""),e.desc,fmtUSD(e.unit),fmtUSD(e.total)]}))];
  if(d.lab.length)rows.push({section:"Mano de obra"},...d.lab.map(l=>({cells:[String(l.q),l.desc,fmtUSD(l.unit),fmtUSD(l.total)]})));
  y=pdfTable(doc,y,cols,rows,"Presupuesto")+8;if(y>PDF_H-70){doc.addPage();pdfHeader(doc,getCompany(),"Presupuesto");y=40}
  const kv=[["Materiales y equipos",fmtUSD(d.matSale)],["Mano de obra",fmtUSD(d.labor)]];if(Q.ivaOn)kv.push([`${pais().tax} ${fmtNum(Q.iva,0)}%`,fmtUSD(d.iva)]);
  y=pdfKV(doc,y,kv);doc.setDrawColor(29,35,38);doc.setLineWidth(.4);doc.line(PDF_W-PM-70,y-3,PDF_W-PM,y-3);y=pdfKV(doc,y+3,[["TOTAL",fmtUSD(d.total),true]]);
  if(+Q.rate>0&&curLocal()){doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(90);doc.text(pdfText(`Equivalente: ${fmtLocal(d.total*Q.rate)} · tasa ${rateTxt(Q.rate)}`),PDF_W-PM,y,{align:"right"});y+=6}
  y+=6;doc.setFontSize(8);doc.setTextColor(110);doc.text(doc.splitTextToSize(pdfText("Condiciones: precios en dólares estadounidenses, sujetos a disponibilidad. Incluye los materiales y la mano de obra indicados."),PDF_W-2*PM),PM,y);
  y=Math.max(y+22,PDF_H-45);doc.setDrawColor(150);doc.setLineWidth(.3);doc.line(PM,y,PM+70,y);doc.line(PDF_W-PM-70,y,PDF_W-PM,y);doc.setFontSize(8.5);doc.setTextColor(90);
  doc.text("Firma del cliente",PM,y+5);doc.text(pdfText("Firma y sello "+(getCompany().name?"· "+getCompany().name:"")),PDF_W-PM-70,y+5);return y+10}

async function buildPdf(o){const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"letter",compress:true}),co=getCompany(),lc=S.kind==="lc";let first=true;
  const page=t=>{if(!first)doc.addPage();first=false;pdfHeader(doc,co,t);return 36};
  if(o.board){const y=page(lc?"Tablero y directorio de circuitos":"Tablero"),D=dims(),b=sel;sel=null;let img;try{img=await svgPng(sceneSvg(true),D.Wd,D.H,2)}finally{sel=b}pdfImage(doc,img,D.Wd,D.H,y,PDF_H-PM-12-y)}
  if(o.uni){const u=uniSvg(),y=page("Diagrama unifilar");pdfImage(doc,await svgPng(u.svg,u.W,u.H,2),u.W,u.H,y,PDF_H-PM-12-y)}
  if(o.load&&lc)loadSection(doc,page("Cuadro de cargas"));
  if(o.quote)quoteSection(doc,page("Presupuesto"));
  if(o.walls){const cur=S.wallI,run=simState.running,b=sel;simState.running=false;sel=null;
    try{for(let i=0;i<S.walls.length;i++){S.wallI=i;const w=S.wall;if(w.items.length<2&&!w.wires.length)continue;const D=wallDims(),img=await svgPng(wallSvg(true),D.Wd,D.H,2);const y=page("Pared: "+w.name);pdfImage(doc,img,D.Wd,D.H,y,PDF_H-PM-12-y)}}
    finally{S.wallI=cur;simState.running=run;sel=b}}
  if(first)page("Proyecto");
  const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(120);
    doc.text(pdfText(`${S.project.name} · ${S.project.date}`),PM,PDF_H-8);doc.text(`Página ${i} de ${n}`,PDF_W-PM,PDF_H-8,{align:"right"})}
  return doc.output("blob")}

/* ---------- ventana del PDF ---------- */
function pdfDialog(){const lc=S.kind==="lc",nw=S.walls.filter(w=>w.items.length>1||w.wires.length).length,co=getCompany();
  const ck=(id,label,on,dis)=>`<label class="switch"><input type="checkbox" id="${id}"${on?" checked":""}${dis?" disabled":""}> ${esc(label)}</label>`;
  openModal(`<h2>Documento PDF</h2><p class="note">Para entregar al cliente o presentar un permiso. Tamaño carta, con los datos de tu empresa en cada hoja.</p>
   <div class="checks">${ck("pdf-board",lc?"Dibujo del tablero y directorio de circuitos":"Dibujo del tablero",true)}${ck("pdf-uni","Diagrama unifilar",true)}${lc?ck("pdf-load","Cuadro de cargas, balance de fases y demanda",true):""}
   ${ck("pdf-quote","Presupuesto con firmas",true)}${ck("pdf-walls",nw?`Paredes cableadas (${nw})`:"Paredes cableadas (no hay todavía)",nw>0,!nw)}</div>
   <div class="co-sum">${co.name?`<span>Empresa: <b>${esc(co.name)}</b>${co.rif?" · "+pais().fis+" "+esc(co.rif):""}</span>`:`<span>Todavía no cargaste los datos de tu empresa.</span>`}<button class="btn sm" id="pdf-comp">${co.name?"Cambiar":"Cargar datos y logo"}</button></div>
   <div class="row-btns"><button class="btn primary" id="pdf-go">Generar y descargar PDF</button>${shareProbe()?`<button class="btn wa" id="pdf-share">Compartir (WhatsApp…)</button>`:""}<button class="btn" data-close>Cancelar</button></div><p class="note" id="pdf-msg" role="status"></p>`);
  $("pdf-comp").onclick=()=>companyDialog(pdfDialog);
  $("pdf-go").onclick=async()=>{const msg=$("pdf-msg"),go=$("pdf-go");if(!window.jspdf){msg.textContent="No se pudo cargar el generador de PDF. Revisa tu conexión a internet y vuelve a intentar.";return}
    const o=pdfOpts();    go.disabled=true;msg.textContent="Generando el PDF…";
    try{const blob=await buildPdf(o);msg.textContent="Confirma la descarga para guardarlo.";const ok=await saveFile(slug(S.project.name)+".pdf",blob);msg.textContent=ok?"PDF listo.":"No se descargó el PDF.";if(ok)setTimeout(closeModal,900)}
    catch(e){msg.textContent="Hubo un problema generando el PDF: "+(e&&e.message||e)}finally{go.disabled=false;renderAll()}}}

const pdfOpts=()=>({board:$("pdf-board").checked,uni:!!($("pdf-uni")&&$("pdf-uni").checked),load:!!($("pdf-load")&&$("pdf-load").checked),quote:$("pdf-quote").checked,walls:$("pdf-walls").checked});
/* en el teléfono: generar el PDF y compartirlo (WhatsApp, correo, Drive…) */
document.addEventListener("click",async e=>{const b=e.target.closest("#pdf-share");if(!b)return;const msg=$("pdf-msg");
  if(!window.jspdf){msg.textContent="No se pudo cargar el generador de PDF. Revisa tu conexión a internet y vuelve a intentar.";return}
  b.disabled=true;msg.textContent="Generando el PDF…";
  try{const blob=await buildPdf(pdfOpts()),f=new File([blob],slug(S.project.name)+".pdf",{type:"application/pdf"});
    if(!canShareFiles(f)){msg.textContent="Este teléfono no permite compartir PDF. Usa Generar y descargar.";return}
    msg.textContent="";if(await shareFile(f,`${S.project.name}${S.project.client?" · "+S.project.client:""}`))closeModal()}
  catch(err){msg.textContent="Hubo un problema generando el PDF: "+(err&&err.message||err)}finally{b.disabled=false;renderAll()}});
