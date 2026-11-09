/* =====================================================================
   sw.js — Funcionamiento sin internet.
   · Al instalarse guarda todos los archivos de la app.
   · Con internet trae siempre la versión nueva (y la guarda); si la red
     no responde en 4 segundos o no hay conexión, usa la copia guardada.
   · La lista y VERSION las actualiza scripts/sw-files.py al publicar.
   ===================================================================== */
const VERSION="tt-c796a8bb92",FILES=[
    "./",
    "index.html",
    "manifest.webmanifest",
    "css/fonts.css",
    "css/styles.css",
    "fonts/barlow-condensed-latin-600-normal.woff2",
    "fonts/barlow-condensed-latin-700-normal.woff2",
    "fonts/ibm-plex-mono-latin-400-normal.woff2",
    "fonts/ibm-plex-mono-latin-600-normal.woff2",
    "fonts/ibm-plex-sans-latin-400-normal.woff2",
    "fonts/ibm-plex-sans-latin-500-normal.woff2",
    "fonts/ibm-plex-sans-latin-600-normal.woff2",
    "icons/apple-touch-icon.png",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/icon-maskable-512.png",
    "icons/icon.svg",
    "js/actions.js",
    "js/calc.js",
    "js/control.js",
    "js/cuenta.js",
    "js/din.js",
    "js/equipment.js",
    "js/flow.js",
    "js/guia.js",
    "js/info.js",
    "js/layout.js",
    "js/loadcenter.js",
    "js/main.js",
    "js/metricas.js",
    "js/mobile.js",
    "js/norma.js",
    "js/panels.js",
    "js/panelsrc.js",
    "js/pdf.js",
    "js/pricing.js",
    "js/projects.js",
    "js/pwa.js",
    "js/render.js",
    "js/routing.js",
    "js/selbar.js",
    "js/share.js",
    "js/sim.js",
    "js/state.js",
    "js/touch.js",
    "js/unifilar.js",
    "js/util.js",
    "js/wall.js",
    "vendor/jspdf.umd.min.js",
    "vendor/supabase.js"
];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function fromCache(req){const c=await caches.open(VERSION);return(await c.match(req,{ignoreSearch:true}))||(req.mode==="navigate"?await c.match("index.html"):undefined)}
async function netFirst(req){const c=await caches.open(VERSION);
  const net=fetch(req).then(r=>{if(r&&r.ok&&r.type==="basic")c.put(req,r.clone());return r});
  const late=new Promise(res=>setTimeout(res,4000));
  try{const r=await Promise.race([net,late.then(()=>null)]);if(r)return r;
    /* la red tarda: usa la copia guardada y deja que la descarga termine en segundo plano */
    const hit=await fromCache(req);if(hit){net.catch(()=>{});return hit}return await net}
  catch(err){const hit=await fromCache(req);if(hit)return hit;throw err}}
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;if(new URL(r.url).origin!==location.origin)return;e.respondWith(netFirst(r))});
