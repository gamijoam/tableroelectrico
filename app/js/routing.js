/* =====================================================================
   routing.js — Recorrido de los cables en la pared.
   · Con tubería dibujada: cada cable baja de su tornillo al tubo más
     cercano y viaja por la red de tubos (camino más corto). Dentro de
     cada tramo cada cable tiene su propio carril, así no se enciman.
   · Sin tubería: recorrido en Z, eligiendo una altura libre para que
     los tramos horizontales no se monten unos sobre otros.
   Coordenadas en píxeles de la pared. Resultado en caché mientras no
   cambie la pared.
   ===================================================================== */
const LANE=4.6,TSNAP=9;
const TUBE_SIZES=['1/2"','3/4"','1"'],TUBE_PRICE={'1/2"':.7,'3/4"':.9,'1"':1.4};
const ptKey=(x,y)=>Math.round(x)+","+Math.round(y);

function pathFrom(pts){const P=[];for(const p of pts)if(!P.length||Math.hypot(p[0]-P[P.length-1][0],p[1]-P[P.length-1][1])>.4)P.push(p);
  let len=0;for(let k=1;k<P.length;k++)len+=Math.hypot(P[k][0]-P[k-1][0],P[k][1]-P[k-1][1]);
  let half=len/2,mid={x:P[0][0],y:P[0][1]};for(let k=1;k<P.length;k++){const L=Math.hypot(P[k][0]-P[k-1][0],P[k][1]-P[k-1][1]);if(half<=L){const t=L?half/L:0;mid={x:P[k-1][0]+(P[k][0]-P[k-1][0])*t,y:P[k-1][1]+(P[k][1]-P[k-1][1])*t};break}half-=L}
  return{d:"M"+P.map(p=>p[0].toFixed(1)+" "+p[1].toFixed(1)).join("L"),pts:P,len,mid}}

/* ---------- red de tubos ---------- */
function tubePx(wl){return(wl.tubes||[]).map(t=>({id:t.id,size:t.size,pts:t.pts.map(([x,y])=>toPx(x,y,wl))}))}
function tubeGraph(wl){const segs=[];for(const t of tubePx(wl))for(let k=0;k<t.pts.length-1;k++){const a=t.pts[k],b=t.pts[k+1];if(Math.hypot(a[0]-b[0],a[1]-b[1])>1)segs.push({a,b,v:Math.abs(a[0]-b[0])<Math.abs(a[1]-b[1]),tube:t.id})}
  const on=(p,s)=>s.v?Math.abs(p[0]-s.a[0])<TSNAP&&p[1]>=Math.min(s.a[1],s.b[1])-TSNAP&&p[1]<=Math.max(s.a[1],s.b[1])+TSNAP
                     :Math.abs(p[1]-s.a[1])<TSNAP&&p[0]>=Math.min(s.a[0],s.b[0])-TSNAP&&p[0]<=Math.max(s.a[0],s.b[0])+TSNAP;
  const proj=(p,s)=>s.v?[s.a[0],p[1]]:[p[0],s.a[1]];
  const cuts=segs.map(s=>[s.a,s.b]);
  segs.forEach((s,i)=>segs.forEach((o,j)=>{if(i===j)return;for(const p of [o.a,o.b])if(on(p,s))cuts[i].push(proj(p,s));
    if(s.v!==o.v){const v=s.v?s:o,h=s.v?o:s,X=[v.a[0],h.a[1]];if(on(X,v)&&on(X,h))cuts[i].push(proj(X,s))}}));
  const nodes=new Map(),edges=[];const node=p=>{const k=ptKey(p[0],p[1]);if(!nodes.has(k))nodes.set(k,{k,x:Math.round(p[0]),y:Math.round(p[1]),adj:[]});return k};
  segs.forEach((s,i)=>{const ax=s.v?1:0,c=cuts[i].map(p=>proj(p,s)).sort((p,q)=>p[ax]-q[ax]);const u=[];for(const p of c)if(!u.length||Math.abs(p[ax]-u[u.length-1][ax])>1.5)u.push(p);
    for(let k=0;k<u.length-1;k++){const n1=node(u[k]),n2=node(u[k+1]);if(n1===n2)continue;const A=nodes.get(n1),B=nodes.get(n2),e={id:edges.length,n1,n2,v:s.v,tube:s.tube,len:Math.hypot(A.x-B.x,A.y-B.y)};edges.push(e);A.adj.push({k:n2,len:e.len,edge:e.id});B.adj.push({k:n1,len:e.len,edge:e.id})}});
  return{nodes,edges}}
/* Dónde entra un tornillo a la tubería: perpendicular al tramo más cercano, o en ángulo hasta un extremo */
function entryFor(G,t){let best=null;
  for(const e of G.edges){const A=G.nodes.get(e.n1),B=G.nodes.get(e.n2);
    if(e.v){if(t.y>=Math.min(A.y,B.y)&&t.y<=Math.max(A.y,B.y)){const d=Math.abs(t.x-A.x);if(!best||d<best.d)best={d,x:A.x,y:t.y,e,stub:[]}}}
    else if(t.x>=Math.min(A.x,B.x)&&t.x<=Math.max(A.x,B.x)){const d=Math.abs(t.y-A.y);if(!best||d<best.d)best={d,x:t.x,y:A.y,e,stub:[]}}}
  for(const n of G.nodes.values()){const d=Math.abs(t.x-n.x)+Math.abs(t.y-n.y);if(!best||d<best.d-.5)best={d,x:n.x,y:n.y,node:n.k,stub:[[t.x,n.y]]}}
  return best&&best.d<=3.2*WK?best:null}
function routeOnTubes(G,ta,tb){const ea=entryFor(G,ta),eb=entryFor(G,tb);if(!ea||!eb)return null;
  const links=en=>{if(en.node)return[{k:en.node,len:0,edge:null}];const A=G.nodes.get(en.e.n1),B=G.nodes.get(en.e.n2);
    return[{k:en.e.n1,len:Math.hypot(A.x-en.x,A.y-en.y),edge:en.e.id},{k:en.e.n2,len:Math.hypot(B.x-en.x,B.y-en.y),edge:en.e.id}]};
  const la=links(ea),lb=links(eb),toB=new Map(lb.map(l=>[l.k,l]));
  const dist=new Map([["A",0]]),prev=new Map(),done=new Set();
  if(!ea.node&&!eb.node&&ea.e.id===eb.e.id){dist.set("B",Math.hypot(ea.x-eb.x,ea.y-eb.y));prev.set("B",{from:"A",edge:ea.e.id})}
  for(;;){let cur=null,cd=Infinity;for(const [k,d] of dist)if(!done.has(k)&&d<cd){cd=d;cur=k}if(cur===null||cur==="B")break;done.add(cur);
    const nb=cur==="A"?la:[...G.nodes.get(cur).adj,...(toB.has(cur)?[{k:"B",len:toB.get(cur).len,edge:toB.get(cur).edge}]:[])];
    for(const n of nb){const nd=cd+n.len;if(nd<(dist.has(n.k)?dist.get(n.k):Infinity)){dist.set(n.k,nd);prev.set(n.k,{from:cur,edge:n.edge})}}}
  if(!prev.has("B"))return null;
  const seq=[],eds=[];for(let k="B";k!=="A";k=prev.get(k).from){seq.unshift(k);eds.unshift(prev.get(k).edge)}seq.unshift("A");
  const at=k=>k==="A"?[ea.x,ea.y]:k==="B"?[eb.x,eb.y]:[G.nodes.get(k).x,G.nodes.get(k).y];
  const pts=[[ta.x,ta.y],...ea.stub,at("A")],seg=ea.stub.map(()=>null);seg.push(null);
  for(let i=1;i<seq.length;i++){pts.push(at(seq[i]));seg.push(eds[i-1])}
  for(const c of eb.stub){pts.push(c);seg.push(null)}pts.push([tb.x,tb.y]);seg.push(null);
  /* quita puntos repetidos manteniendo la lista de tramos alineada */
  const P=[pts[0]],E=[];for(let i=1;i<pts.length;i++){if(Math.hypot(pts[i][0]-P[P.length-1][0],pts[i][1]-P[P.length-1][1])<.5){if(seg[i]!=null&&E.length)E[E.length-1]=E[E.length-1]??seg[i];continue}P.push(pts[i]);E.push(seg[i])}
  return{pts:P,seg:E}}
/* Carriles: cada cable que comparte un tramo se corre unos píxeles para no tapar a los demás */
function applyLanes(r,wid,use){const off=s=>{const e=r.seg[s];if(e==null)return 0;const L=use.get(e);return(L.indexOf(wid)-(L.length-1)/2)*LANE};
  const vert=s=>Math.abs(r.pts[s][0]-r.pts[s+1][0])<Math.abs(r.pts[s][1]-r.pts[s+1][1]);
  const vec=s=>{const o=off(s);return vert(s)?[o,0]:[0,o]};const n=r.pts.length-1,out=[];
  out.push([r.pts[0][0]+vec(0)[0],r.pts[0][1]+vec(0)[1]]);
  for(let j=1;j<n;j++){const p=r.pts[j],a=vec(j-1),b=vec(j);if(vert(j-1)===vert(j)){out.push([p[0]+a[0],p[1]+a[1]],[p[0]+b[0],p[1]+b[1]])}else out.push([p[0]+a[0]+b[0],p[1]+a[1]+b[1]])}
  out.push([r.pts[n][0]+vec(n-1)[0],r.pts[n][1]+vec(n-1)[1]]);return out}
/* Sin tubería: Z con una altura horizontal libre */
function autoRoutes(wires,terms,map,bare){const tracks=[];
  for(const w of wires){const a=terms.get(w.a),b=terms.get(w.b),flat=Math.abs(a.y-b.y)<14,base=flat?Math.max(a.y,b.y)+22:(a.y+b.y)/2,x1=Math.min(a.x,b.x),x2=Math.max(a.x,b.x);let ym=base;
    for(let k=0;k<60;k++){const c=base+(k%2?1:-1)*Math.ceil(k/2)*7;if(flat&&c<Math.max(a.y,b.y)+10)continue;if(!flat&&(c<Math.min(a.y,b.y)+6||c>Math.max(a.y,b.y)-6)&&k)continue;
      if(!tracks.some(t=>Math.abs(t.y-c)<6.5&&t.x1<x2+6&&x1<t.x2+6)){ym=c;break}}
    tracks.push({y:ym,x1,x2});const p=pathFrom([[a.x,a.y],[a.x,ym],[b.x,ym],[b.x,b.y]]);p.bare=bare;map.set(w.id,p)}}
/* Puentes dentro del tablero de riel: suben o bajan a la canaleta más cercana, corren por ella
   y, si cambian de fila, bajan por el costado del gabinete. Cada cable va en su propio carril. */
function innerRoutes(wl,wires,terms,map){if(!wires.length)return;const P=wl.items.find(i=>i.type==="panel");
  if(!P||!isDin()){autoRoutes(wires,terms,map,false);return}
  const g=panelGeom(P,wl),s=g.s,dy=[...Array(S.board.rows+1)].map((_,r)=>g.y0+(TOP+r*ROW_H+DUCT/2)*s),lane={},side={L:0,R:0};
  const near=y=>{let b=0;dy.forEach((v,k)=>{if(Math.abs(v-y)<Math.abs(dy[b]-y))b=k});return b};
  const off=k=>{const n=lane[k]=(lane[k]||0)+1;return((n%9)-4)*Math.min(3.4,DUCT*s/10)};
  for(const w of wires){const a=terms.get(w.a),b=terms.get(w.b),da=near(a.y),db=near(b.y);let pts;
    if(da===db){const y=dy[da]+off(da);pts=[[a.x,a.y],[a.x,y],[b.x,y],[b.x,b.y]]}
    else{const L=(a.x+b.x)/2<g.cx,k=L?"L":"R",n=side[k]++,xs=L?g.x0+(14+(n%6)*4)*s/.6:g.x0+g.w-(14+(n%6)*4)*s/.6,ya=dy[da]+off(da),yb=dy[db]+off(db);
      pts=[[a.x,a.y],[a.x,ya],[xs,ya],[xs,yb],[b.x,yb],[b.x,b.y]]}
    const p=pathFrom(pts);p.inner=true;map.set(w.id,p)}}
/* Sin tubería dibujada: canalización automática. Cada cable busca el camino más corto en una
   cuadrícula de 5 cm que rodea los aparatos (pasar por encima de uno cuesta mucho), prefiere ir por
   donde ya van otros cables (como en un tubo) y dobla lo menos posible. Dentro del tablero va por las
   canaletas. Al final, los cables que comparten un tramo se reparten en carriles. */
const GS=11;
function gridRoutes(wl,wires,terms,map,bare=false){if(!wires.length)return;
  const x0=WM.l,y0=WM.t,ww=wl.w*WK,wh=wl.h*WK,NC=Math.floor(ww/GS)+1,NR=Math.floor(wh/GS)+1,N=NC*NR;
  const cost=new Float32Array(N).fill(1),cx=x=>Math.max(0,Math.min(NC-1,Math.round((x-x0)/GS))),cy=y=>Math.max(0,Math.min(NR-1,Math.round((y-y0)/GS)));
  const box=(a,b,c,d,v,set)=>{for(let r=cy(b);r<=cy(d);r++)for(let k=cx(a);k<=cx(c);k++){const i=r*NC+k;cost[i]=set?v:Math.max(cost[i],v)}};
  let PR=null;
  for(const it of wl.items){if(it.type==="panel"){const g=panelGeom(it,wl);PR=[g.x0,g.y0,g.x0+g.w,g.y0+g.h];
      /* junto a los costados del tablero no se corre: los tubos entran por arriba o por abajo */
      box(g.x0-3*GS,g.y0+GS,g.x0-1,g.y0+g.h-GS,9);box(g.x0+g.w+1,g.y0+GS,g.x0+g.w+3*GS,g.y0+g.h-GS,9);box(g.x0,g.y0,g.x0+g.w,g.y0+g.h,14);
      /* caja de breakers: los cables corren por los canales laterales (junto a las barras) y por arriba */
      if(!g.din){const ys=g.y0+(LY0-8)*g.s,ye=g.y0+g.h-6;box(g.x0+4,ys,g.x0+XL*g.s-2,ye,2.2,true);box(g.x0+(XR+BW)*g.s+2,ys,g.x0+g.w-4,ye,2.2,true);box(g.x0+4,g.y0+4,g.x0+g.w-4,g.y0+20*g.s,2.2,true)}
      if(g.din)for(let r=0;r<=S.board.rows;r++){const y=g.y0+(TOP+r*ROW_H+DUCT/2)*g.s;box(g.x0+4,y-DUCT*g.s/2,g.x0+g.w-4,y+DUCT*g.s/2,2.2,true)}continue}
    const d=DEV[it.type];if(!d)continue;const [px,py]=toPx(it.x,it.y,wl);box(px-d.w/2-8,py-d.h/2-8,px+d.w/2+8,py+d.h/2+20,60)}
  const used=new Map(),ek=(i,j)=>i<j?i+"_"+j:j+"_"+i,raw=[];
  const DX=[1,-1,0,0],DY=[0,0,1,-1];
  /* los cables largos primero: marcan los troncales que siguen los demás */
  const order=[...wires].sort((p,q)=>{const L=w=>{const a=terms.get(w.a),b=terms.get(w.b);return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)};return L(q)-L(p)});
  for(const w of order){const ta=terms.get(w.a),tb=terms.get(w.b),s0=cy(ta.y)*NC+cx(ta.x),g0=cy(tb.y)*NC+cx(tb.x);
    const near=(i,c)=>Math.abs(i%NC-c%NC)<=2&&Math.abs(((i/NC)|0)-((c/NC)|0))<=2;
    const dist=new Float32Array(N*4).fill(Infinity),prev=new Int32Array(N*4).fill(-1),heap=[];
    const push=(st,f)=>{heap.push([f,st]);let k=heap.length-1;while(k){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p}};
    const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m}}return top};
    const h=i=>Math.abs(i%NC-g0%NC)+Math.abs(((i/NC)|0)-((g0/NC)|0));
    for(let d=0;d<4;d++){dist[s0*4+d]=0;push(s0*4+d,h(s0))}let goal=-1,guard=0;
    while(heap.length&&guard++<N*16){const [,st]=pop(),i=st>>2,d=st&3,cd=dist[st];if(i===g0){goal=st;break}
      const x=i%NC,y=(i/NC)|0;
      for(let nd=0;nd<4;nd++){const nx=x+DX[nd],ny=y+DY[nd];if(nx<0||ny<0||nx>=NC||ny>=NR)continue;const j=ny*NC+nx;
        const c=(near(j,s0)||near(j,g0)?1:cost[j])*(used.has(ek(i,j))?.55:1)+(nd!==d&&!(i===s0)?5:0),ns=j*4+nd,v=cd+c;
        if(v<dist[ns]){dist[ns]=v;prev[ns]=st;push(ns,v+h(j))}}}
    const nodes=[];if(goal>=0){for(let st=goal;st>=0;st=prev[st]){const i=st>>2;if(!nodes.length||nodes[nodes.length-1]!==i)nodes.push(i)}nodes.reverse()}else nodes.push(s0,g0);
    for(let k=1;k<nodes.length;k++){const e=ek(nodes[k-1],nodes[k]);if(!used.has(e))used.set(e,[]);used.get(e).push(w.id)}
    raw.push([w,nodes,ta,tb])}
  const P=i=>[x0+(i%NC)*GS,y0+((i/NC)|0)*GS];
  for(const [w,nodes,ta,tb] of raw){const off=k=>{const e=ek(nodes[k-1],nodes[k]),L=used.get(e),o=(L.indexOf(w.id)-(L.length-1)/2)*LANE,v=Math.abs(nodes[k]-nodes[k-1])===NC;return v?[o,0]:[0,o]};
    const pts=[[ta.x,ta.y]];if(nodes.length>1){const o1=off(1),p0=P(nodes[0]);pts.push([p0[0]+o1[0],p0[1]+o1[1]]);
      for(let k=1;k<nodes.length-1;k++){const p=P(nodes[k]),a=off(k),b=off(k+1),same=(a[0]!==0||Math.abs(nodes[k]-nodes[k-1])===NC)===(b[0]!==0||Math.abs(nodes[k+1]-nodes[k])===NC);
        if(same){pts.push([p[0]+a[0],p[1]+a[1]]);if(a[0]!==b[0]||a[1]!==b[1])pts.push([p[0]+b[0],p[1]+b[1]])}else pts.push([p[0]+a[0]+b[0],p[1]+a[1]+b[1]])}
      const pl=P(nodes[nodes.length-1]),ol=off(nodes.length-1);pts.push([pl[0]+ol[0],pl[1]+ol[1]])}
    pts.push([tb.x,tb.y]);
    /* quita puntos alineados para que el trazo quede limpio */
    const Q=[];for(const p of pts){if(Q.length>=2){const a=Q[Q.length-2],b=Q[Q.length-1];if((Math.abs(a[0]-b[0])<.01&&Math.abs(b[0]-p[0])<.01)||(Math.abs(a[1]-b[1])<.01&&Math.abs(b[1]-p[1])<.01)){Q[Q.length-1]=p;continue}}Q.push(p)}
    const p=pathFrom(Q);p.bare=bare;p.grid=true;map.set(w.id,p)}
  /* tramos de canalización automática (fuera del tablero) con su cantidad de cables */
  const inP=(x,y)=>PR&&x>PR[0]&&x<PR[2]&&y>PR[1]&&y<PR[3];map.grid=(map.grid||[]).concat([...used].map(([e,L])=>{const [i,j]=e.split("_").map(Number),a=P(i),b=P(j);return{a,b,n:L.length}}).filter(s=>!inP((s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2)))}
function computeRoutes(wl,terms){const map=new Map(),all=wl.wires.filter(w=>terms.has(w.a)&&terms.has(w.b));
  /* los puentes dentro del tablero van directo, sin tubo */
  const inner=all.filter(w=>innerWire(w,terms)),valid=all.filter(w=>!innerWire(w,terms));innerRoutes(wl,inner,terms,map);
  if(!(wl.tubes&&wl.tubes.length)){if(typeof wdrag!=="undefined"&&wdrag&&wdrag.moved)autoRoutes(valid,terms,map,false);else gridRoutes(wl,valid,terms,map);return map}
  const G=tubeGraph(wl),use=new Map(),raw=[],rest=[];
  for(const w of valid){const r=routeOnTubes(G,terms.get(w.a),terms.get(w.b));if(!r){rest.push(w);continue}raw.push([w,r]);
    for(const e of r.seg)if(e!=null){if(!use.has(e))use.set(e,[]);const L=use.get(e);if(!L.includes(w.id))L.push(w.id)}}
  for(const [w,r] of raw){const p=pathFrom(applyLanes(r,w.id,use));p.tube=true;
    p.stubs=r.seg.map((e,k)=>e==null?[r.pts[k],r.pts[k+1]]:null).filter(Boolean);map.set(w.id,p)}
  /* cuántos cables pasan como máximo por cada tubo: define su ancho */
  map.tubeLoad=new Map();for(const [e,L] of use){const t=G.edges[e].tube;map.tubeLoad.set(t,Math.max(map.tubeLoad.get(t)||0,L.length))}
  gridRoutes(wl,rest,terms,map,true);return map}
let _routeCache={key:null,wl:null,map:null};
function routesFor(wl,terms){const key=JSON.stringify([wl.tubes||[],wl.wires.map(w=>[w.id,w.a,w.b]),wl.items.map(i=>[i.id,i.x,i.y,i.type]),wl.h,S.lc.items.map(b=>[b.id,b.side,b.slot,b.p.poles]),S.lc.spaces,S.lc.aux.length,S.kind,S.items.map(i=>[i.id,i.row,i.x,i.type,i.p.poles||0,i.p.color||"",CTL_TYPES.has(i.type)?[i.p.aux,i.p.cts,i.p.ct,i.p.lab,i.p.sys]:0]),S.board.rows,S.board.mods]);
  if(_routeCache.wl===wl&&_routeCache.key===key)return _routeCache.map;const map=computeRoutes(wl,terms);_routeCache={key,wl,map};return map}

/* ---------- metros de tubo ---------- */
function tubeBySize(wl=S.wall){const out={};
  if(wl.tubes&&wl.tubes.length){for(const t of wl.tubes){let m=0;for(let k=1;k<t.pts.length;k++)m+=Math.hypot(t.pts[k][0]-t.pts[k-1][0],t.pts[k][1]-t.pts[k-1][1]);out[t.size||'3/4"']=(out[t.size||'3/4"']||0)+m}return out}
  const terms=allTerms(wl),cells=new Set(),st=WK*.05,R=routesFor(wl,terms);
  if(R.grid&&R.grid.length){out['3/4"']=R.grid.length*GS/WK;return out}
  wl.wires.forEach((w,i)=>{if(!terms.has(w.a)||!terms.has(w.b))return;const p=wirePath(w,i,terms,wl).pts;
    for(let k=0;k<p.length-1;k++){const [x1,y1]=p[k],[x2,y2]=p[k+1],n=Math.max(1,Math.round(Math.hypot(x2-x1,y2-y1)/st));for(let j=0;j<=n;j++)cells.add(Math.round((x1+(x2-x1)*j/n)/st)+","+Math.round((y1+(y2-y1)*j/n)/st))}});
  if(cells.size)out['3/4"']=cells.size*.05;return out}

/* ---------- dibujar tubos a mano ---------- */
let tubeDraft=null;
function tubeSnap(q){const [mx,my]=fromPx(q.x,q.y),W=S.wall;let [x,y]=toPx(Math.max(0,Math.min(W.w,Math.round(mx*20)/20)),Math.max(0,Math.min(W.h,Math.round(my*20)/20)));
  let best=null,bd=14;for(const t of tubePx(W)){for(const p of t.pts){const d=Math.hypot(p[0]-q.x,p[1]-q.y);if(d<bd){bd=d;best=[p[0],p[1]]}}
    for(let k=0;k<t.pts.length-1;k++){const a=t.pts[k],b=t.pts[k+1],v=Math.abs(a[0]-b[0])<Math.abs(a[1]-b[1]);
      if(v&&q.y>=Math.min(a[1],b[1])&&q.y<=Math.max(a[1],b[1])){const d=Math.abs(q.x-a[0]);if(d<bd){bd=d;best=[a[0],y]}}
      if(!v&&q.x>=Math.min(a[0],b[0])&&q.x<=Math.max(a[0],b[0])){const d=Math.abs(q.y-a[1]);if(d<bd){bd=d;best=[x,a[1]]}}}}
  return best||[x,y]}
function tubeOrtho(last,p){return Math.abs(p[0]-last[0])>=Math.abs(p[1]-last[1])?[p[0],last[1]]:[last[0],p[1]]}
function tubeClick(e){const q=toWall(e);let p=tubeSnap(q);
  if(!tubeDraft){tubeDraft={pts:[p]};renderAll();return}
  const last=tubeDraft.pts[tubeDraft.pts.length-1];p=tubeOrtho(last,p);
  if(Math.hypot(p[0]-last[0],p[1]-last[1])<8){finishTube();return}
  tubeDraft.pts.push(p);renderAll()}
function finishTube(){const d=tubeDraft;tubeDraft=null;if(!d||d.pts.length<2){renderAll();return}
  const t={id:uid++,size:'3/4"',pts:d.pts.map(([x,y])=>fromPx(x,y).map(v=>Math.round(v*100)/100))};
  mutate(()=>{if(!S.wall.tubes)S.wall.tubes=[];S.wall.tubes.push(t)});let m=0;for(let k=1;k<t.pts.length;k++)m+=Math.hypot(t.pts[k][0]-t.pts[k-1][0],t.pts[k][1]-t.pts[k-1][1]);
  toast(`Tubo de ${fmtNum(m,2)} m agregado. Los cables cercanos ya pasan por dentro.`)}
function tubeDraftSvg(cur){if(!tubeDraft)return"";const P=[...tubeDraft.pts];if(cur)P.push(tubeOrtho(P[P.length-1],cur));const d="M"+P.map(p=>p[0]+" "+p[1]).join("L");
  return`<g pointer-events="none"><path d="${d}" fill="none" stroke="#1c74e0" stroke-width="20" stroke-linejoin="round" stroke-linecap="round" opacity=".25"/><path d="${d}" fill="none" stroke="#1c74e0" stroke-width="2" stroke-dasharray="6 4"/>${P.map(p=>C(p[0],p[1],5,"#1c74e0")).join("")}</g>`}
