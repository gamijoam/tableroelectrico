/* =====================================================================
   cuenta.js — Cuentas de usuario (Supabase), prueba gratis, licencia de
   pago único, proyectos en la nube, sugerencias y panel del administrador.
   · Sin cuenta: se puede diseñar y simular, pero no exportar (PDF, imagen,
     presupuesto por WhatsApp, descargar proyecto) ni usar la nube.
   · Al registrarse: prueba con todo desbloqueado (24 h, la fija el servidor).
   · Licencia de por vida: el usuario reporta su pago y el administrador lo
     aprueba; la seguridad la aplica la base de datos, no el navegador.
   · Funciona sin internet con el último estado conocido de la cuenta.
   ===================================================================== */
const SB_URL="https://xdfseatftobcersgfqmm.supabase.co";
const SB_KEY="sb_publishable_jHeUvczBeCFU-rdZwk0utg_pNw5IOeT"; /* clave pública: va en la app por diseño */
const ACCT_KEY="taller-tableros-cuenta";
const sb=(()=>{try{return window.supabase&&window.supabase.createClient?window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null}catch(e){return null}})();
/* estado de la cuenta: usuario, estado del servidor y diferencia de reloj */
let acct=(()=>{try{return JSON.parse(lsGet(ACCT_KEY)||"null")}catch(e){return null}})()||{user:null,st:null,skew:0,at:0};
let appCfg={price_usd:5,trial_hours:24,whatsapp:"",pay_instructions:[]};
/* ¿está activado "Continuar con Google" en Supabase? (se consulta una vez) */
let googleOn=lsGet("taller-tableros-google")==="1";
fetch(SB_URL+"/auth/v1/settings",{headers:{apikey:SB_KEY}}).then(r=>r.json()).then(d=>{googleOn=!!(d&&d.external&&d.external.google);lsSet("taller-tableros-google",googleOn?"1":"0")}).catch(()=>{});
const GLOGO=`<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
const saveAcct=()=>lsSet(ACCT_KEY,JSON.stringify(acct));
const srvNow=()=>Date.now()+(acct.skew||0);
const isPro=()=>!!(acct.user&&acct.st&&acct.st.pro);
const trialLeft=()=>acct.user&&acct.st?Math.max(0,new Date(acct.st.trial_ends_at).getTime()-srvNow()):0;
const fullAccess=()=>isPro()||trialLeft()>0;
const isAdmin=()=>!!(acct.user&&acct.st&&acct.st.is_admin);
const fmtLeft=ms=>{const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);return h?`${h} h ${m} min`:`${m} min`};
const sbErr=e=>{const m=String(e&&e.message||e||"");return/Invalid login/i.test(m)?"Correo o contraseña incorrectos.":/already registered|already been registered/i.test(m)?"Ese correo ya tiene cuenta: entra con tu contraseña.":/Password should be/i.test(m)?"La contraseña debe tener al menos 8 caracteres.":/Failed to fetch|NetworkError|network/i.test(m)?"Sin conexión. Inténtalo cuando tengas internet.":/row-level security|permission denied/i.test(m)?"No tienes permiso para esto (¿terminó tu prueba?).":m||"Algo salió mal."};

/* ---------- sincronizar con el servidor ---------- */
async function refreshAcct(silent){if(!sb)return;
  try{const {data:{session}}=await sb.auth.getSession();
    if(!session){if(acct.user){acct={user:null,st:null,skew:0,at:0};saveAcct()}renderAcct();return}
    const {data,error}=await sb.rpc("my_status");if(error)throw error;
    acct={user:{id:session.user.id,email:session.user.email},st:data,skew:new Date(data.now).getTime()-Date.now(),at:Date.now()};saveAcct();
    const c=await sb.from("app_settings").select("*").eq("id",1).maybeSingle();if(c.data)appCfg=c.data;
  }catch(e){if(!silent)toast(sbErr(e))}
  renderAcct()}
if(sb){const fromOAuth=/access_token=|[?&]code=/.test(location.hash+location.search);
  sb.auth.onAuthStateChange((ev)=>{if(ev==="SIGNED_IN"||ev==="SIGNED_OUT"||ev==="USER_UPDATED")refreshAcct(true).then(()=>{if(ev==="SIGNED_IN"&&fromOAuth&&acct.user){history.replaceState(null,"",location.pathname);toast("¡Bienvenido! Sesión iniciada con Google.");accountDialog()}})});
  refreshAcct(true);setInterval(()=>refreshAcct(true),10*60*1000);window.addEventListener("online",()=>refreshAcct(true))}

/* ---------- botón de la cabecera ---------- */
function renderAcct(){const b=$("acct");if(!b)return;
  b.innerHTML=!acct.user?"Entrar · prueba gratis":isPro()?`Mi cuenta <span class="acct-badge pro">PRO</span>`:trialLeft()>0?`Mi cuenta <span class="acct-badge">Prueba: ${fmtLeft(trialLeft())}</span>`:`Mi cuenta <span class="acct-badge off">Activar $${fmtNum(appCfg.price_usd,0)}</span>`;
  b.classList.toggle("primary",!acct.user);
  const p=fmtNum(appCfg.price_usd,0),gp=$("goPro"),tb=$("trialBar");
  if(gp){gp.hidden=isPro();gp.textContent=`⭐ Hazte PRO · $${p}`}
  if(tb){const left=trialLeft(),hid=isPro()||!acct.user||sessionStorage.getItem("tt-bar-off")==="1";tb.hidden=hid;tb.classList.toggle("off",!!acct.user&&left<=0);
    if(!hid)tb.innerHTML=left>0?`<span>⏳ <b>Prueba gratis:</b> te quedan ${fmtLeft(left)} con todo desbloqueado.</span><button class="btn sm pro-cta" data-pro>Hazte PRO · $${p} para siempre</button><button class="tb-x" aria-label="Ocultar aviso" data-x>×</button>`
      :`<span>🔒 <b>Tu prueba terminó.</b> Sigues pudiendo diseñar y simular; para exportar y usar la nube, activa PRO.</span><button class="btn sm pro-cta" data-pro>Activar PRO · $${p}</button><button class="tb-x" aria-label="Ocultar aviso" data-x>×</button>`}}
setInterval(renderAcct,60000);

/* ---------- funciones que requieren cuenta con acceso ---------- */
const GATED=["#pdf","#fPdf","#png","#fPng","#qz-pdf","#qz-img","#qz-wa","#pj-down","#img-dl"];
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest(GATED.join(","));if(!t||fullAccess())return;
  e.preventDefault();e.stopImmediatePropagation();paywall()},true);
function paywall(){const p=fmtNum(appCfg.price_usd,0);if(!acct.user){planDialog();return}
  if(!acct.user){openModal(`<h2>Crea tu cuenta gratis</h2><p class="note">Exportar PDF, imágenes, presupuestos por WhatsApp y guardar en la nube requiere una cuenta.</p>
    <div class="paycard"><b>${appCfg.trial_hours} horas con todo desbloqueado</b><span>Después, licencia de por vida por solo <b>$${p}</b>: un pago, sin mensualidades.</span></div>
    <div class="row-btns"><button class="btn primary" id="pw-reg">Crear cuenta gratis</button><button class="btn" id="pw-in">Ya tengo cuenta</button><button class="btn" data-close>Ahora no</button></div>`);
    $("pw-reg").onclick=()=>authDialog("registro");$("pw-in").onclick=()=>authDialog("entrar");return}
  openModal(`<h2>Tu prueba terminó</h2><p class="note">Puedes seguir diseñando y simulando. Para exportar, enviar presupuestos y usar la nube, activa tu licencia.</p>
    <div class="paycard"><b>Licencia de por vida: $${p}</b><span>Un solo pago. Incluye las actualizaciones.</span></div>
    <div class="row-btns"><button class="btn primary" id="pw-buy">Activar mi licencia</button><button class="btn" data-close>Ahora no</button></div>`);
  $("pw-buy").onclick=buyDialog}

/* ---------- Hazte PRO: qué incluye y cómo comprarlo ---------- */
function planDialog(){const p=fmtNum(appCfg.price_usd,0),ok=t=>`<li><span class="ck">✓</span>${t}</li>`;
  openModal(`<h2>⭐ Taller de Tableros PRO</h2>
   <div class="plan"><div class="price"><b>$${p}</b><span>pago único · de por vida</span></div>
    <ul class="feat-list">${["Exportar el <b>PDF profesional</b> con tu logo, unifilar y cuadro de cargas","<b>Imágenes y presupuestos por WhatsApp</b>","Proyectos y plantillas <b>en la nube</b> (teléfono y PC)","Descargar y compartir proyectos","Todas las <b>actualizaciones futuras</b> incluidas","Soporte directo por WhatsApp"].map(ok).join("")}</ul></div>
   <p class="note">Gratis para siempre: diseñar, cablear, simular, la calculadora y el diagnóstico. ${acct.user?"":`Al crear tu cuenta tienes <b>${appCfg.trial_hours} horas con todo PRO</b> para probarlo.`}</p>
   <div class="row-btns">${!acct.user?`<button class="btn pro-cta" id="pl-reg">Crear cuenta y probar gratis</button><button class="btn" id="pl-in">Ya tengo cuenta</button>`:isPro()?`<span class="chip">Ya tienes PRO ✓</span>`:`<button class="btn pro-cta" id="pl-buy">Comprar PRO · $${p}</button>`}<button class="btn" data-close>Cerrar</button></div>`);
  const r=$("pl-reg");if(r)r.onclick=()=>authDialog("registro");const i=$("pl-in");if(i)i.onclick=()=>authDialog("entrar");const b=$("pl-buy");if(b)b.onclick=buyDialog}

/* ---------- Ayuda: sugerencias, errores y contacto ---------- */
function helpDialog(){const wa=appCfg.whatsapp;
  openModal(`<h2>💬 Ayuda y sugerencias</h2><p class="note">¿Algo no funciona, tienes una idea o necesitas una mano? Escríbeme: leo todo y la app mejora con lo que pides.</p>
   <div class="help-grid">
    <button class="help-card" id="hp-sug"><b>💡 Sugerir una mejora</b><span>Una función, una plantilla, un componente que falte…</span></button>
    <button class="help-card" id="hp-err"><b>🐞 Reportar un error</b><span>Se adjunta tu proyecto para verlo tal cual lo tienes.</span></button>
    ${wa?`<button class="help-card wa" id="hp-wa"><b>📱 Escribir por WhatsApp</b><span>Respuesta directa para dudas o ayuda con tu tablero.</span></button>`:""}
    <button class="help-card" id="hp-pro"><b>⭐ Hazte PRO</b><span>Qué incluye y cómo pagar ($${fmtNum(appCfg.price_usd,0)}, de por vida).</span></button>
   </div><div class="row-btns"><button class="btn" data-close>Cerrar</button></div>`);
  $("hp-sug").onclick=()=>feedbackDialog("sugerencia");$("hp-err").onclick=()=>feedbackDialog("error");$("hp-pro").onclick=planDialog;
  const w=$("hp-wa");if(w)w.onclick=()=>openWa(wa,`Hola, te escribo desde Taller de Tableros${acct.user?" ("+acct.user.email+")":""}.`)}

/* ---------- registro y entrada ---------- */
function authDialog(mode="registro"){if(!sb){toast("Las cuentas necesitan internet la primera vez.");return}
  const reg=mode==="registro";
  openModal(`<h2>${reg?"Crear cuenta":"Entrar"}</h2>
   <div class="seg" role="group"><button class="segb" id="au-r" aria-pressed="${reg}">Crear cuenta</button><button class="segb" id="au-e" aria-pressed="${!reg}">Entrar</button></div>
   ${reg?`<p class="note">Tienes <b>${appCfg.trial_hours} horas con todo desbloqueado</b>. Después, licencia de por vida por <b>$${fmtNum(appCfg.price_usd,0)}</b>.</p>`:""}
   ${googleOn?`<button class="btn gbtn" id="au-g">${GLOGO} Continuar con Google</button><div class="or"><span>o con tu correo</span></div>`:""}
   <div class="fields">${reg?`<label class="field wide"><span>Nombre</span><input class="txt" id="au-name" autocomplete="name"></label><label class="field wide"><span>WhatsApp</span><input class="txt" id="au-tel" type="tel" inputmode="tel" placeholder="0412 123 4567" autocomplete="tel"></label>`:""}
   <label class="field wide"><span>Correo</span><input class="txt" id="au-mail" type="email" autocomplete="email"></label>
   <label class="field wide"><span>Contraseña${reg?" (mínimo 8 caracteres)":""}</span><input class="txt" id="au-pass" type="password" autocomplete="${reg?"new-password":"current-password"}"></label></div>
   <div class="row-btns"><button class="btn primary" id="au-go">${reg?"Crear cuenta y empezar la prueba":"Entrar"}</button><button class="btn" data-close>Cancelar</button></div>
   ${reg?"":`<p class="note"><a href="#" id="au-forgot">¿Olvidaste tu contraseña?</a></p>`}<p class="note" id="au-msg" role="status"></p>`);
  $("au-r").onclick=()=>authDialog("registro");$("au-e").onclick=()=>authDialog("entrar");
  const g=$("au-g");if(g)g.onclick=async()=>{g.disabled=true;projSave();const {error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(error){$("au-msg").textContent=sbErr(error);g.disabled=false}};
  const fg=$("au-forgot");if(fg)fg.onclick=async e=>{e.preventDefault();const m=$("au-mail").value.trim();if(!m){$("au-msg").textContent="Escribe tu correo primero.";return}
    const {error}=await sb.auth.resetPasswordForEmail(m,{redirectTo:location.origin+location.pathname});$("au-msg").textContent=error?sbErr(error):"Te enviamos un correo para cambiar la contraseña."};
  $("au-go").onclick=async()=>{const mail=$("au-mail").value.trim(),pass=$("au-pass").value,msg=$("au-msg"),go=$("au-go");
    if(!/\S+@\S+\.\S+/.test(mail)){msg.textContent="Escribe un correo válido.";return}if(pass.length<(reg?8:1)){msg.textContent="La contraseña debe tener al menos 8 caracteres.";return}
    go.disabled=true;msg.textContent=reg?"Creando tu cuenta…":"Entrando…";
    try{const r=reg?await sb.auth.signUp({email:mail,password:pass,options:{data:{nombre:$("au-name").value.trim(),telefono:$("au-tel").value.trim()}}}):await sb.auth.signInWithPassword({email:mail,password:pass});
      if(r.error)throw r.error;if(reg&&!r.data.session){msg.textContent="Revisa tu correo para confirmar la cuenta y luego entra.";go.disabled=false;return}
      await refreshAcct();closeModal();toast(reg?`¡Listo! Tienes ${appCfg.trial_hours} horas con todo desbloqueado.`:"Sesión iniciada.");accountDialog()}
    catch(e){msg.textContent=sbErr(e);go.disabled=false}}}

/* ---------- mi cuenta ---------- */
function accountDialog(){if(!acct.user){authDialog("registro");return}const st=acct.st||{},p=fmtNum(appCfg.price_usd,0);
  const state=isPro()?`<div class="paycard ok"><b>Licencia de por vida activa</b><span>Gracias por tu compra. Tienes todo desbloqueado.</span></div>`
   :trialLeft()>0?`<div class="paycard"><b>Prueba gratis: te quedan ${fmtLeft(trialLeft())}</b><span>Después, licencia de por vida por $${p}.</span></div>`
   :`<div class="paycard off"><b>Tu prueba terminó</b><span>Activa tu licencia de por vida por $${p} para exportar y usar la nube.</span></div>`;
  const askTel=!st.telefono?`<div class="fields"><label class="field wide"><span>Tu WhatsApp (para avisarte cuando se active tu licencia)</span><input class="txt" id="ac-tel" type="tel" inputmode="tel" placeholder="0412 123 4567"></label></div><div class="row-btns"><button class="btn sm primary" id="ac-tel-ok">Guardar WhatsApp</button></div>`:"";
  openModal(`<h2>Mi cuenta</h2><p class="note">${esc(st.nombre||"")} · ${esc(acct.user.email)}</p>${state}${askTel}
   <div class="acct-grid">
    <button class="btn" id="ac-cloud">☁ Mis proyectos en la nube</button>
    ${isPro()?"":`<button class="btn primary" id="ac-buy">Activar licencia ($${p})</button>`}
    <button class="btn" id="ac-fb">✎ Enviar sugerencia o reportar error</button>
    ${appCfg.whatsapp?`<button class="btn wa" id="ac-wa">Escribir por WhatsApp</button>`:""}
    ${isAdmin()?`<button class="btn" id="ac-admin">⚙ Panel de administración</button>`:""}
    <button class="btn" id="ac-out">Cerrar sesión</button></div>
   <div class="row-btns"><button class="btn" data-close>Cerrar</button></div>`);
  const tk=$("ac-tel-ok");if(tk)tk.onclick=async()=>{const v=$("ac-tel").value.trim();if(v.length<7){toast("Escribe tu número de WhatsApp.");return}
    const {error}=await sb.from("profiles").update({telefono:v}).eq("id",acct.user.id);if(error){toast(sbErr(error));return}await refreshAcct(true);toast("WhatsApp guardado.");accountDialog()};
  $("ac-cloud").onclick=cloudDialog;const bb=$("ac-buy");if(bb)bb.onclick=buyDialog;$("ac-fb").onclick=feedbackDialog;
  const w=$("ac-wa");if(w)w.onclick=()=>openWa(appCfg.whatsapp,`Hola, te escribo desde Taller de Tableros (${acct.user.email}).`);
  const ad=$("ac-admin");if(ad)ad.onclick=()=>adminDialog("pagos");
  $("ac-out").onclick=async()=>{await sb.auth.signOut();acct={user:null,st:null,skew:0,at:0};saveAcct();renderAcct();closeModal();toast("Sesión cerrada.")}}

/* ---------- proyectos y plantillas en la nube ---------- */
async function cloudDialog(){if(!sb||!acct.user){authDialog("entrar");return}
  openModal(`<h2>Mis proyectos en la nube</h2><p class="note">Los ves en el teléfono y en la computadora con tu cuenta.</p><div id="cl-list" class="plist"><p class="note">Cargando…</p></div>
   <div class="fields"><label class="switch"><input type="checkbox" id="cl-tpl"> Guardar como plantilla (para reutilizarla en otros proyectos)</label></div>
   <div class="row-btns"><button class="btn primary" id="cl-save">Guardar "${esc(S.project.name)}" en la nube</button><button class="btn" data-close>Cerrar</button></div><p class="note" id="cl-msg" role="status"></p>`);
  const load=async()=>{const {data,error}=await sb.from("projects").select("id,name,client,kind,updated_at").order("updated_at",{ascending:false});const L=$("cl-list");if(!L)return;
    if(error){L.innerHTML=`<p class="note">${esc(sbErr(error))}</p>`;return}
    L.innerHTML=data.length?data.map(p=>`<div class="pitem${p.id===S.project.cloudId?" cur":""}"><div class="pinfo"><b>${esc(p.name)}${p.kind==="template"?' <span class="chip">Plantilla</span>':""}</b><small>${esc(p.client||"Sin cliente")} · ${new Date(p.updated_at).toLocaleString("es-VE")}</small></div>
      <div class="row-btns"><button class="btn sm primary" data-co="${p.id}">${p.kind==="template"?"Usar":"Abrir"}</button><button class="btn sm danger" data-cd="${p.id}">Eliminar</button></div></div>`).join(""):`<p class="note">Todavía no guardaste nada en la nube.</p>`;
    L.querySelectorAll("[data-co]").forEach(b=>b.onclick=async()=>{const {data:r,error:e}=await sb.from("projects").select("data,kind").eq("id",b.dataset.co).single();if(e){toast(sbErr(e));return}
      const v=normalize(r.data);if(!v){toast("Ese proyecto está dañado.");return}v.project.cloudId=r.kind==="template"?null:b.dataset.co;closeModal();projSave();switchTo(v,newPid());toast(r.kind==="template"?"Plantilla cargada como un proyecto nuevo.":`Proyecto "${v.project.name}" abierto.`)});
    L.querySelectorAll("[data-cd]").forEach(b=>b.onclick=async()=>{if(!b.dataset.sure){b.dataset.sure="1";b.textContent="¿Seguro?";return}const {error:e}=await sb.from("projects").delete().eq("id",b.dataset.cd);if(e)toast(sbErr(e));load()})};
  load();
  $("cl-save").onclick=async()=>{const msg=$("cl-msg");if(!fullAccess()){paywall();return}const tpl=$("cl-tpl").checked;msg.textContent="Guardando…";
    const row={name:S.project.name||"Tablero",client:S.project.client||"",kind:tpl?"template":"project",data:JSON.parse(JSON.stringify(S))};
    let r;if(!tpl&&S.project.cloudId)r=await sb.from("projects").update(row).eq("id",S.project.cloudId).select("id").maybeSingle();
    if(!r||(!r.error&&!r.data))r=await sb.from("projects").insert(row).select("id").single();
    if(r.error){msg.textContent=sbErr(r.error);return}if(!tpl){S.project.cloudId=r.data.id;projSave()}msg.textContent=tpl?"Plantilla guardada.":"Guardado en la nube.";load()}}

/* ---------- comprar la licencia ---------- */
async function buyDialog(){if(!acct.user){authDialog("registro");return}const p=fmtNum(appCfg.price_usd,0),ins=Array.isArray(appCfg.pay_instructions)?appCfg.pay_instructions:[];
  openModal(`<h2>Licencia de por vida: $${p}</h2><p class="note">1) Paga por el método que prefieras. 2) Escribe la referencia aquí. 3) Apenas se confirme, tu cuenta queda activada para siempre.</p>
   ${ins.length?`<div class="paylist">${ins.map(m=>`<div class="pitem"><div class="pinfo"><b>${esc(m.metodo)}</b><small style="white-space:pre-line">${esc(m.datos)}</small></div></div>`).join("")}</div>`:`<p class="note">Los datos de pago aún no están cargados. ${appCfg.whatsapp?"Escríbenos por WhatsApp y te los pasamos.":""}</p>`}
   <div class="fields"><label class="field"><span>Método</span><select class="sel" id="by-m">${(ins.length?ins.map(m=>m.metodo):["Pago Móvil","Zelle","Binance","PayPal"]).map(m=>`<option>${esc(m)}</option>`).join("")}</select></label>
   <label class="field"><span>Monto pagado</span><input class="txt" id="by-a" inputmode="decimal" value="${esc(appCfg.price_usd)}"></label>
   <label class="field wide"><span>Referencia o número de operación</span><input class="txt" id="by-r" placeholder="Ej.: 0123456789"></label>
   <label class="field wide"><span>Nota (opcional)</span><input class="txt" id="by-n" placeholder="Ej.: pagué en bolívares a la tasa del día"></label></div>
   <div class="row-btns"><button class="btn primary" id="by-go">Enviar mi pago para verificar</button>${appCfg.whatsapp?`<button class="btn wa" id="by-wa">Enviar comprobante por WhatsApp</button>`:""}<button class="btn" data-close>Cancelar</button></div>
   <p class="note" id="by-msg" role="status"></p><div id="by-mine"></div>`);
  const mine=async()=>{const {data}=await sb.from("payments").select("method,reference,status,created_at,admin_note").order("created_at",{ascending:false});const el=$("by-mine");if(!el||!data||!data.length)return;
    el.innerHTML=`<h3>Tus pagos</h3>`+data.map(x=>`<div class="pitem"><div class="pinfo"><b>${esc(x.method)} · ${esc(x.reference)}</b><small>${{pending:"⏳ En revisión",approved:"✅ Aprobado",rejected:"❌ Rechazado"}[x.status]}${x.admin_note?" · "+esc(x.admin_note):""}</small></div></div>`).join("")};mine();
  const wa=$("by-wa");if(wa)wa.onclick=()=>openWa(appCfg.whatsapp,`Hola, pagué la licencia de Taller de Tableros. Correo: ${acct.user.email}. Referencia: ${$("by-r").value.trim()}`);
  $("by-go").onclick=async()=>{const ref=$("by-r").value.trim(),msg=$("by-msg");if(ref.length<3){msg.textContent="Escribe la referencia del pago.";return}
    const {error}=await sb.from("payments").insert({method:$("by-m").value,reference:ref,amount:parseFloat(String($("by-a").value).replace(",","."))||null,note:$("by-n").value.trim()});
    if(error){msg.textContent=sbErr(error);return}msg.textContent="¡Recibido! Te avisamos apenas se verifique. Puedes cerrar esta ventana.";$("by-r").value="";mine()}}

/* ---------- sugerencias y reportes ---------- */
async function feedbackDialog(kind="sugerencia"){if(!acct.user){toast("Crea tu cuenta gratis (un minuto) para enviarme mensajes.");authDialog("registro");return}
  openModal(`<h2>Sugerencias y errores</h2><p class="note">Cuéntame qué mejorarías o qué no funcionó. Si adjuntas tu proyecto, lo veo exactamente como lo tienes.</p>
   <div class="fields"><label class="field"><span>Tipo</span><select class="sel" id="fb-k"><option value="sugerencia"${kind==="sugerencia"?" selected":""}>Sugerencia o mejora</option><option value="error"${kind==="error"?" selected":""}>Algo no funciona</option><option value="otro">Otro</option></select></label>
   <label class="field wide"><span>Mensaje</span><textarea class="txt" id="fb-m" rows="5" placeholder="Ej.: me gustaría una plantilla para locales con 3 fases…"></textarea></label>
   <label class="switch"><input type="checkbox" id="fb-p"${kind==="error"?" checked":""}> Adjuntar el proyecto abierto ("${esc(S.project.name)}")</label></div>
   <div class="row-btns"><button class="btn primary" id="fb-go">Enviar</button>${appCfg.whatsapp?`<button class="btn wa" id="fb-wa">Mejor por WhatsApp</button>`:""}<button class="btn" data-close>Cerrar</button></div><p class="note" id="fb-msg" role="status"></p><div id="fb-mine"></div>`);
  const mine=async()=>{const {data}=await sb.from("feedback").select("kind,message,status,reply,created_at").order("created_at",{ascending:false}).limit(10);const el=$("fb-mine");if(!el||!data||!data.length)return;
    el.innerHTML=`<h3>Tus mensajes</h3>`+data.map(x=>`<div class="pitem"><div class="pinfo"><b>${esc(cutText(x.message,80))}</b><small>${{nuevo:"Enviado",visto:"Visto",resuelto:"Resuelto"}[x.status]}${x.reply?" · Respuesta: "+esc(x.reply):""}</small></div></div>`).join("")};mine();
  const wa=$("fb-wa");if(wa)wa.onclick=()=>openWa(appCfg.whatsapp,$("fb-m").value.trim()||"Hola, tengo una sugerencia para Taller de Tableros.");
  $("fb-go").onclick=async()=>{const m=$("fb-m").value.trim(),msg=$("fb-msg");if(m.length<3){msg.textContent="Escribe tu mensaje.";return}
    const {error}=await sb.from("feedback").insert({kind:$("fb-k").value,message:m,project:$("fb-p").checked?JSON.parse(JSON.stringify(S)):null});
    if(error){msg.textContent=sbErr(error);return}msg.textContent="¡Gracias! Lo recibí.";$("fb-m").value="";mine()}}

/* ---------- panel del administrador ---------- */
async function adminDialog(tab="pagos"){if(!isAdmin())return;const T=[["pagos","Pagos"],["usuarios","Usuarios"],["mensajes","Mensajes"],["ajustes","Ajustes"]];
  openModal(`<h2>Panel de administración</h2><div class="seg" role="group">${T.map(([k,l])=>`<button class="segb" data-tab="${k}" aria-pressed="${k===tab}">${l}</button>`).join("")}</div><div id="ad-body" class="ad-body"><p class="note">Cargando…</p></div><div class="row-btns"><button class="btn" data-close>Cerrar</button></div>`);
  $("dlg").classList.add("wide");$("dlg").querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>adminDialog(b.dataset.tab));const B=$("ad-body");
  if(tab==="pagos"){const {data,error}=await sb.from("payments").select("*").order("created_at",{ascending:false}).limit(100);if(error){B.textContent=sbErr(error);return}
    const {data:us}=await sb.rpc("admin_users");const who=id=>{const u=(us||[]).find(x=>x.id===id);return u?`${u.nombre||"Sin nombre"} · ${u.email}${u.telefono?" · "+u.telefono:""}`:id};
    B.innerHTML=data.length?data.map(p=>`<div class="pitem"><div class="pinfo"><b>${esc(p.method)} · ref. ${esc(p.reference)} · ${p.amount!=null?"$"+fmtNum(p.amount):""}</b><small>${esc(who(p.user_id))}<br>${new Date(p.created_at).toLocaleString("es-VE")}${p.note?" · "+esc(p.note):""} · ${{pending:"⏳ Pendiente",approved:"✅ Aprobado",rejected:"❌ Rechazado"}[p.status]}</small></div>
      ${p.status==="pending"?`<div class="row-btns"><button class="btn sm primary" data-ok="${p.id}">Aprobar</button><button class="btn sm danger" data-no="${p.id}">Rechazar</button></div>`:""}</div>`).join(""):`<p class="note">No hay pagos todavía.</p>`;
    B.querySelectorAll("[data-ok]").forEach(b=>b.onclick=async()=>{const {error:e}=await sb.from("payments").update({status:"approved"}).eq("id",b.dataset.ok);if(e)toast(sbErr(e));else toast("Pago aprobado: licencia activada.");adminDialog("pagos")});
    B.querySelectorAll("[data-no]").forEach(b=>b.onclick=async()=>{const n=prompt("Motivo del rechazo (lo verá el usuario):","No encontramos el pago con esa referencia.");if(n===null)return;const {error:e}=await sb.from("payments").update({status:"rejected",admin_note:n}).eq("id",b.dataset.no);if(e)toast(sbErr(e));adminDialog("pagos")})}
  if(tab==="usuarios"){const {data,error}=await sb.rpc("admin_users");if(error){B.textContent=sbErr(error);return}const now=srvNow();
    const pro=data.filter(u=>u.pro).length,tr=data.filter(u=>!u.pro&&new Date(u.trial_ends_at)>now).length;
    B.innerHTML=`<p class="note">${data.length} usuarios · ${pro} con licencia · ${tr} en prueba</p>`+data.map(u=>`<div class="pitem"><div class="pinfo"><b>${esc(u.nombre||"Sin nombre")} · ${esc(u.email||"")}</b><small>${u.telefono?esc(u.telefono)+" · ":""}${u.pro?"✅ Licencia":new Date(u.trial_ends_at)>now?"⏳ Prueba hasta "+new Date(u.trial_ends_at).toLocaleString("es-VE"):"Prueba vencida"} · ${u.proyectos} en la nube · desde ${new Date(u.created_at).toLocaleDateString("es-VE")}</small></div>
      <div class="row-btns">${u.telefono?`<button class="btn sm wa" data-wa="${esc(u.telefono)}">WhatsApp</button>`:""}<button class="btn sm" data-pro="${u.id}" data-v="${!u.pro}">${u.pro?"Quitar licencia":"Dar licencia"}</button><button class="btn sm" data-tr="${u.id}">+24 h de prueba</button></div></div>`).join("");
    B.querySelectorAll("[data-wa]").forEach(b=>b.onclick=()=>openWa(b.dataset.wa,"Hola, te escribo de Taller de Tableros."));
    B.querySelectorAll("[data-pro]").forEach(b=>b.onclick=async()=>{const {error:e}=await sb.rpc("admin_set_pro",{uid:b.dataset.pro,value:b.dataset.v==="true"});if(e)toast(sbErr(e));adminDialog("usuarios")});
    B.querySelectorAll("[data-tr]").forEach(b=>b.onclick=async()=>{const {error:e}=await sb.rpc("admin_extend_trial",{uid:b.dataset.tr,hours:24});if(e)toast(sbErr(e));adminDialog("usuarios")})}
  if(tab==="mensajes"){const {data,error}=await sb.from("feedback").select("*").order("created_at",{ascending:false}).limit(100);if(error){B.textContent=sbErr(error);return}const {data:us}=await sb.rpc("admin_users");
    const who=id=>{const u=(us||[]).find(x=>x.id===id);return u?`${u.nombre||"Sin nombre"} · ${u.email}`:""};
    B.innerHTML=data.length?data.map(f=>`<div class="pitem col"><div class="pinfo"><b>${{sugerencia:"💡",error:"🐞",otro:"✉"}[f.kind]} ${esc(f.message)}</b><small>${esc(who(f.user_id))} · ${new Date(f.created_at).toLocaleString("es-VE")} · ${f.status}</small></div>
      <div class="fields"><label class="field wide"><span>Respuesta</span><input class="txt" data-rep="${f.id}" value="${esc(f.reply)}"></label></div>
      <div class="row-btns"><button class="btn sm primary" data-save="${f.id}">Guardar respuesta</button><button class="btn sm" data-st="${f.id}" data-v="resuelto">Marcar resuelto</button>${f.project?`<button class="btn sm" data-pj="${f.id}">Abrir su proyecto</button>`:""}</div></div>`).join(""):`<p class="note">No hay mensajes todavía.</p>`;
    B.querySelectorAll("[data-save]").forEach(b=>b.onclick=async()=>{const v=B.querySelector(`[data-rep="${b.dataset.save}"]`).value;const {error:e}=await sb.from("feedback").update({reply:v,status:"visto"}).eq("id",b.dataset.save);toast(e?sbErr(e):"Respuesta guardada.")});
    B.querySelectorAll("[data-st]").forEach(b=>b.onclick=async()=>{await sb.from("feedback").update({status:b.dataset.v}).eq("id",b.dataset.st);adminDialog("mensajes")});
    B.querySelectorAll("[data-pj]").forEach(b=>b.onclick=()=>{const f=data.find(x=>x.id===b.dataset.pj),v=normalize(JSON.parse(JSON.stringify(f.project)));if(!v){toast("El proyecto adjunto está dañado.");return}v.project.cloudId=null;closeModal();projSave();switchTo(v,newPid());toast("Proyecto del usuario abierto como copia.")})}
  if(tab==="ajustes"){const c=appCfg,ins=Array.isArray(c.pay_instructions)?c.pay_instructions:[];const row=(m={metodo:"",datos:""})=>`<div class="pitem col pay-row"><div class="fields"><label class="field"><span>Método</span><input class="txt" data-m value="${esc(m.metodo)}" placeholder="Pago Móvil"></label><label class="field wide"><span>Datos para pagar</span><textarea class="txt" data-d rows="3" placeholder="Banco, teléfono, cédula / correo de Zelle / ID de Binance">${esc(m.datos)}</textarea></label></div></div>`;
    B.innerHTML=`<div class="fields"><label class="field"><span>Precio de la licencia ($)</span><input class="txt" id="cf-p" inputmode="decimal" value="${esc(c.price_usd)}"></label><label class="field"><span>Horas de prueba gratis</span><input class="txt" id="cf-h" inputmode="numeric" value="${esc(c.trial_hours)}"></label>
      <label class="field wide"><span>Tu WhatsApp (para que te escriban)</span><input class="txt" id="cf-w" type="tel" value="${esc(c.whatsapp)}" placeholder="0412 123 4567"></label></div>
      <h3>Métodos de pago</h3><div id="cf-rows">${(ins.length?ins:[{metodo:"Pago Móvil",datos:""},{metodo:"Zelle",datos:""},{metodo:"Binance",datos:""},{metodo:"PayPal",datos:""}]).map(row).join("")}</div>
      <div class="row-btns"><button class="btn" id="cf-add">+ Método</button><button class="btn primary" id="cf-save">Guardar ajustes</button></div><p class="note">La prueba nueva aplica a los usuarios que se registren desde ahora. Deja vacío un método para quitarlo.</p>`;
    $("cf-add").onclick=()=>$("cf-rows").insertAdjacentHTML("beforeend",row());
    $("cf-save").onclick=async()=>{const pay=[...B.querySelectorAll(".pay-row")].map(r=>({metodo:r.querySelector("[data-m]").value.trim(),datos:r.querySelector("[data-d]").value.trim()})).filter(x=>x.metodo&&x.datos);
      const v={price_usd:parseFloat(String($("cf-p").value).replace(",","."))||5,trial_hours:parseInt($("cf-h").value)||24,whatsapp:$("cf-w").value.trim(),pay_instructions:pay,updated_at:new Date().toISOString()};
      const {error:e}=await sb.from("app_settings").update(v).eq("id",1);if(e){toast(sbErr(e));return}appCfg=Object.assign(appCfg,v);renderAcct();toast("Ajustes guardados.")}}}

$("acct").onclick=accountDialog;$("goPro").onclick=planDialog;$("helpFab").onclick=helpDialog;
$("trialBar").addEventListener("click",e=>{if(e.target.closest("[data-pro]"))acct.user&&trialLeft()<=0?buyDialog():planDialog();if(e.target.closest("[data-x]")){sessionStorage.setItem("tt-bar-off","1");renderAcct()}});
renderAcct();
