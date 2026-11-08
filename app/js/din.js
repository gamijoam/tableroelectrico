/* ---------- DIN component drawings ---------- */
const PILOT={Verde:["#38e266","#1f5a2e"],Rojo:["#ff3b30","#6a1f1b"],"Ámbar":["#ffb300","#6b4a0c"],Azul:["#3d8bff","#1c3866"],Blanco:["#fffbe8","#9a9a92"]};
const PUSH={Verde:"#2aa84a",Rojo:"#d3312b",Negro:"#2b2e31",Amarillo:"#e8c22c"};
const TERM={Gris:"#9aa0a4",Azul:"#2f6fd0","Verde/amarillo":"url(#pGY)","Verde":"#2f9e44","Blanco":"#eeeeea","Marrón":"#7a4b2a",Negro:"#2b2d2f",Rojo:"#c63228"};
const DRAW={
 mcb(p,w){const n=p.poles;let s=std(w);
  for(let i=0;i<n;i++){const x=i*M;s+=lever(x+10.5,15,p.on)+T(x+18,121,p.curve+p.In,{fs:10.5,fw:700})}
  if(n>1){const ly=p.on?48:70;s+=R(10.5,ly+9.5,(n-1)*M+15,6,"#000",{rx:1,op:.35})+R(10.5,ly+8.5,(n-1)*M+15,5,"url(#gLv)",{rx:1,s:"#0e1011",sw:.5})}
  s+=flag(11,99,14,6,p.on)+R(8.5,126,19,9,"#fff",{s:"#555",sw:.8,rx:.5})+T(18,133,Math.round(p.kA*1000),{fs:6})+R(7,108,w-14,.8,"#1c5fa8",{op:.55});return s},
 rcd(p,w){let s=std(w)+lever(10.5,15,p.on);
  s+=C(M+18,61,9,"#000",{op:.25})+C(M+18,60,8,"#e7c23b",{s:"#9c7f19"})+C(M+18,60,8,"url(#gLens)",{op:.7})+T(M+18,63.5,"T",{fs:8,fw:700})+T(M+18,74,"TEST",{fs:4.6,fw:400})+flag(M+11,80,14,6,p.on);
  s+=T(w/2,111,p.In+"A",{fs:11,fw:700})+T(w/2,123,p.sens,{fs:8.5})+T(w/2,133,"IΔn · tipo "+p.type,{fs:6,fw:400});return s},
 sw(p,w){const ly=p.on?48:70;let s=std(w)+R(8,46,w-16,48,"url(#gHole)",{rx:4})+R(8,93,w-16,1.2,"#fff",{op:.35});
  s+=R(12.5,ly+(p.on?3:-2),w-24,22,"#000",{rx:3,op:.45})+R(12,ly,w-24,22,"#c8322a",{rx:3,s:"#7a1410",sw:.6})+R(12,ly,w-24,22,"url(#gLvX)",{rx:3})+R(13.5,p.on?ly+1:ly+17,w-27,4,p.on?"#ef7b73":"#8f241f",{rx:1});
  s+=[7,10.5,14].map(k=>R(16,ly+k+(p.on?2:0),w-32,.9,"#000",{op:.3})).join("")+T(w/2,ly+15.5,p.on?"I":"O",{fs:10,c:"#fff",fw:700});
  return s+T(w/2,114,p.In+"A",{fs:11,fw:700})+T(w/2,126,p.poles+"P · I–0",{fs:7,fw:400})},
 spd(p,w){let s=body(w)+terms(w,8)+terms(w,142);for(let i=0;i<p.poles;i++){const x=i*M;s+=box(x+4,38,28,98,"url(#gF)",{rx:2.5,s:"#b6b9b4"})+R(x+8,40,20,3,"#9da19c",{rx:1})+flag(x+11,52,14,9,!p.on)+T(x+18,80,"T2",{fs:8,fw:700})+T(x+18,94,p.Imax+"kA",{fs:7})+T(x+18,106,"150V",{fs:6,fw:400})}return s},
 prot(p,w){let s=std(w)+scr(8,46,56,28,"#140707")+T(36,67,p.on?"121":"- - -",{fs:17,fw:700,c:"#ff4b3b"});
  s+=led(16,86,2.8,"#3bd16b",p.on,"#2c4a35")+T(22,88,"OK",{fs:5.5,a:"start",fw:400})+led(46,86,2.8,"#ff3b30",!p.on,"#5a1f1f")+T(52,88,"ERR",{fs:5.5,a:"start",fw:400});
  return s+rbtn(12,97,14,8,"#555a5e")+rbtn(46,97,14,8,"#555a5e")+T(36,122,p.In+"A",{fs:9.5,fw:700})+T(36,132,"Protector V",{fs:6,fw:400})},
 supv(p,w){const tri=p.sys.startsWith("Trif");let s=std(w);
  s+=led(14,47,2.8,"#3bd16b",p.on,"#24452f")+led(36,47,2.8,"#ffc533",p.on,"#5a4a1d")+led(58,47,2.8,"#ff3b30",!p.on,"#5a1f1f");
  s+=T(14,57,"PWR",{fs:4.8,fw:400})+T(36,57,"RELÉ",{fs:4.8,fw:400})+T(58,57,"FALLA",{fs:4.8,fw:400});
  s+=knob(14,74,7,-50)+knob(36,74,7,40)+knob(58,74,7,10)+T(14,90,"U<",{fs:5.5})+T(36,90,"U>",{fs:5.5})+T(58,90,"t",{fs:5.5});
  return s+R(6,97,w-12,36,"#fbfbf8",{rx:1.5,s:"#d3d5d0",sw:.5})+T(36,108,(tri?"3Φ ":"1Φ ")+p.sys.replace(/^\D+/,""),{fs:9,fw:700})+T(36,119,tri?"Secuencia · falta fase":"Sobre / bajo voltaje",{fs:5,fw:400})+T(36,130,"Supervisor",{fs:6,fw:400})},
 cont(p,w){let s=std(w)+T(8,46,"A1",{fs:6,a:"start",fw:400})+T(w-8,46,p.coil,{fs:6,a:"end",fw:400});
  s+=R(w/2-14,52,28,16,"url(#gHole)",{rx:2})+R(w/2-11,p.on?58:54,22,8,p.on?"#ffcf33":"#8a8f93",{rx:1.2})+T(w/2,p.on?64.5:60.5,p.on?"I":"0",{fs:6.5,c:"#2a2e31",fw:700})+R(w/2-14,52,28,16,"url(#gWin)",{rx:2});
  return s+R(w/2-5,76,10,26,"url(#gHole)",{rx:2})+rbtn(w/2-4,p.on?77:89,8,12,"#4a4f54")+T(w/2,118,p.In+"A AC-3",{fs:9,fw:700})+T(w/2,129,p.cts,{fs:7,fw:400})+T(8,133,"A2",{fs:6,a:"start",fw:400})},
 icont(p,w){let s=body(w,"url(#gC)","#8d918d")+terms(w,8,3)+terms(w,142,3);const sp=w/3;
  ["1/L1","3/L2","5/L3"].forEach((t,i)=>s+=T(sp*i+sp/2,39,t,{fs:5.2,fw:400}));["2/T1","4/T2","6/T3"].forEach((t,i)=>s+=T(sp*i+sp/2,139,t,{fs:5.2,fw:400}));
  /* bloque frontal elevado (cámara de arco) con su sombra */
  s+=R(7.5,46.5,w-12,88,"#000",{rx:4,op:.2})+R(6,44,w-12,88,"url(#gF)",{rx:3.5,s:"#a9ada8"})+R(6,44,w-12,88,"url(#gSide)",{rx:3.5})+R(8,45,w-16,2,"#fff",{rx:1,op:.9});
  /* placa de bornes de bobina */
  s+=R(10,48,w-20,18,"#c9cdc8",{rx:2,s:"#a3a7a2"})+R(10,48,w-20,3,"#fff",{rx:1.5,op:.5})+screw(17,57,4.2)+screw(w-17,57,4.2)+T(25,60,"A1",{fs:6,a:"start"})+T(w-25,60,"A2",{fs:6,a:"end"});
  /* ventana del indicador mecánico: la paleta baja al energizar la bobina */
  s+=R(w/2-12,69,24,18,"url(#gHole)",{rx:2.5})+R(w/2-9,p.on?76:71,18,9,p.on?"#ffcf33":"#8a8f93",{rx:1.5})+R(w/2-9,p.on?76:71,18,9,"url(#gLvX)",{rx:1.5})+T(w/2,p.on?83:78,p.on?"I":"0",{fs:7.5,c:p.on?"#3a2f05":"#2a2e31",fw:700})+R(w/2-12,69,24,18,"url(#gWin)",{rx:2.5});
  s+=R(10,92,w-20,36,"#fbfbf8",{rx:1.5,s:"#c3c6c1",sw:.6});
  return s+T(w/2,105,p.In+"A",{fs:12,fw:700})+T(w/2,115,"Bobina "+p.coil,{fs:6,fw:400})+T(w/2,124,"Aux. "+p.aux,{fs:6,fw:400})},
 ovl(p,w){let s=body(w,"url(#gC)","#8d918d")+terms(w,142,3);const sp=w/3;
  for(let i=0;i<3;i++){const x=sp*i+sp/2-4;s+=R(x+1,5,8,26,"#000",{rx:1,op:.3})+R(x,4,8,26,"url(#gCu)",{rx:1,s:"#8a5426",sw:.6})+R(x+1,5,6,1.2,"#fff",{op:.5})+R(x+1.5,21,5,5,"#6d3d17",{rx:.6,op:.6})}
  s+=box(6,36,w-12,96,"url(#gF)",{rx:3,s:"#a9ada8"});
  s+=C(30,67.5,14,"#000",{op:.25})+C(30,66,13.5,"url(#gScr)",{s:"#6d7276",sw:.6})+C(30,66,11,"#f6f6f2",{s:"#9a9e99",sw:.5});
  for(let k=-2;k<=2;k++)s+=`<line x1="30" y1="56.5" x2="30" y2="59" stroke="#555" stroke-width=".9" transform="rotate(${k*30} 30 66)"/>`;
  s+=`<g transform="rotate(30 30 66)">${R(28,57,4,13,"#2a2e31",{rx:1.5})}${R(28.6,57.5,1.2,11,"#fff",{op:.35})}</g>`+C(30,66,2,"#444");
  s+=rbtn(w-34,52,22,12,"#2f6fd0")+T(w-23,61,"R",{fs:7,c:"#fff"})+rbtn(w-34,70,22,12,"#d3312b")+T(w-23,79,"STOP",{fs:5,c:"#fff"});
  s+=flag(w/2-10,90,20,7,!p.on).replace(/#d23a2f/g,"#f08a2b");
  return s+T(w/2,112,p.range,{fs:8,fw:700})+T(w/2,124,"Relé térmico",{fs:6,fw:400})},
 relay(p,w){let s=std(w)+box(14,64,w-28,36,"#3d5f8a",{rx:2})+R(18,68,w-36,8,"url(#gCuH)",{rx:1})+[0,1,2,3].map(k=>R(18,69+k*2,w-36,.6,"#6d3d17",{op:.5})).join("");
  s+=R(8,40,w-16,92,"#cfe3f2",{rx:4,s:"#8fb3cf",op:.45})+R(9.5,41.5,w-19,3,"#fff",{rx:1.5,op:.8})+`<path d="M${w-22} 41l-8 90h-6l8-90z" fill="#fff" opacity=".35"/>`+led(w/2,50,3,"#ff3b30",p.on,"#5a1f1f");
  return s+T(w/2,115,p.coil,{fs:6.5,fw:700})+T(w/2,125,p.ct,{fs:5.3,fw:400})},
 emerg(p,w){let s=std(w)+C(36,82,28,"#000",{op:.2})+C(36,80,27,"#f2c62e",{s:"#a88a12"})+C(36,80,27,"url(#gLens)",{op:.35})+T(36,60,"EMERGENCIA",{fs:4.8,c:"#3a2f05"});
  const r=p.on?19:16;s+=C(36,84+(p.on?4:2),r+2,"#000",{op:.4})+C(36,84,r+2,"#7a1410")+C(36,84,r,"#d3221b")+C(36,84,r*.7,"none",{s:"#ff6a5e",sw:.8,op:.6})+C(36,84,r,"url(#gLens)");
  return s+(p.on?"":T(36,128,"ENCLAVADO",{fs:6,c:"#d3221b"}))},
 selector(p,w){const tri=p.lab.split("·").length===3;const ang={Izquierda:-45,Centro:tri?0:45,Derecha:45}[p.pos]??-45;
  let s=std(w)+C(18,75.5,13.5,"#000",{op:.3})+C(18,74,13,"url(#gScr)",{s:"#555",sw:.6})+C(18,74,10.5,"#2e3236",{s:"#111"})+`<g transform="rotate(${ang} 18 74)">${R(15.5,64,7,24,"#000",{rx:2,op:.4})}${R(15,62,6,24,"#1a1c1e",{rx:2})}${R(15.6,62.5,2,23,"#fff",{rx:1,op:.25})}${R(16.5,63,3,6,"#f2f2f2",{rx:1})}</g>`;
  const L=p.lab.split("·").map(x=>x.trim());s+=T(5,52,L[0],{fs:5,a:"start"})+T(31,52,L[L.length-1],{fs:5,a:"end"});if(tri)s+=T(18,52,L[1],{fs:5});
  return s+T(18,112,tri?"3 pos.":"2 pos.",{fs:6,fw:400})},
 vam(p,w){let s=std(w)+scr(7,44,58,40,"#120808")+T(60,62,p.read,{fs:15,a:"end",c:"#ff4b3b",fw:700})+T(60,78,{"Voltímetro":"VAC","Amperímetro":"AAC","Volt-amperímetro":"V · A"}[p.mode],{fs:7,a:"end",c:"#ff8a7a"});
  return s+rbtn(14,92,12,7,"#555a5e")+rbtn(46,92,12,7,"#555a5e")+T(36,116,p.mode,{fs:6.3,fw:600})+T(36,127,"60 Hz",{fs:6,fw:400})},
 pilot(p,w){const c=PILOT[p.color]||PILOT.Verde;let s=std(w)+C(18,76,15,"#000",{op:.25})+C(18,74,14,"url(#gScr)",{s:"#7d8589",sw:.6});
  if(p.on)s+=C(18,74,16,c[0],{op:.55,flt:"blur"});
  return s+C(18,74,11,p.on?c[0]:c[1],{s:"rgba(0,0,0,.3)",sw:.6})+(p.on?C(18,74,6,"#fff",{op:.35,flt:"blur"}):"")+C(18,74,11,"url(#gLens)")+T(18,112,p.V,{fs:6.5,fw:400})+T(18,124,p.color.slice(0,3).toUpperCase(),{fs:6.5})},
 push(p,w){const c=PUSH[p.color]||PUSH.Verde;return std(w)+rbtnC(18,72,11,c)+T(18,108,"1"+p.ct,{fs:7})+T(18,120,p.color==="Rojo"?"STOP":p.color==="Verde"?"START":"",{fs:6})},
 timer(p,w){const a=p.on?40:-40;let s=std(w)+knob(18,62,10,a);
  s+=led(11,85,2.5,"#38d36a",p.on,"#24452f")+led(25,85,2.5,"#ffc533",p.on,"#5a4a1d")+T(11,95,"U",{fs:5.5})+T(25,95,"R",{fs:5.5});
  return s+T(18,112,p.range,{fs:5.3,fw:400})+T(18,123,{"Retardo a la conexión":"TON","Retardo a la desconexión":"TOFF","Multifunción":"MULTI"}[p.fn]||"",{fs:6.5})},
 meter(p,w){const tri=p.ph==="Trifásico";let s=std(w)+scr(6,44,w-12,28,"#a9bb94",{rx:2})+T(10,51,"kWh",{fs:5.5,a:"start",fw:400,c:"#1c2615"})+T(w-10,67,p.kwh,{fs:tri?15:11,a:"end",c:"#1c2615"});
  return s+led(14,85,2.6,"#e0302a",true)+T(21,87,"1000 imp/kWh",{fs:5.3,a:"start",fw:400})+R(5,98,w-10,36,"#fbfbf8",{rx:1.5,s:"#d3d5d0",sw:.5})+T(w/2,108,tri?"3×208/120V 10(100)A":"120/240V 15(100)A",{fs:6.1,fw:400})+T(w/2,119,"60 Hz · Clase 1",{fs:6,fw:400})+T(w/2,131,tri?"TRIFÁSICO":"MONOFÁSICO",{fs:6.5})},
 psu(p,w){let s=std(w);for(let k=0;k<6;k++)s+=R(10,42+k*6,w-20,2.6,"url(#gHole)",{rx:1.3})+R(10,44.6+k*6,w-20,.7,"#fff",{op:.6});
  return s+led(18,86,2.8,"#36d06a",p.on,"#2a4a33")+T(25,88,"DC OK",{fs:5.5,a:"start",fw:400})+C(w-18,86.8,5.5,"#000",{op:.25})+C(w-18,86,5,"url(#gScr)",{s:"#888"})+`<line x1="${w-21}" y1="83" x2="${w-15}" y2="89" stroke="#555" stroke-width="1.4"/>`+T(w-18,99,"ADJ",{fs:5})+T(w/2,115,p.V+" DC",{fs:12,fw:700})+T(w/2,128,p.A,{fs:8,fw:400})},
 socket(p,w){const cx=54,cy=82;let s=std(w)+box(16,40,76,94,"#ecece6",{rx:10,s:"#b3b6b0"})+C(cx,cy,26,"#e2e2dc",{s:"#cfd0ca",sw:.8});
  s+=R(cx-14,cy-18,5,18,"url(#gHole)",{rx:1.2})+R(cx+9,cy-16,5,14,"url(#gHole)",{rx:1.2})+`<path d="M${cx-4} ${cy+16}v-4a4 4 0 0 1 8 0v4z" fill="#1b1e20"/>`;
  return s+T(cx,126,"15A 125V",{fs:6.5,fw:400})},
 blank(p,w){return body(w)+box(3,8,w-6,156,"url(#gF)",{rx:2,s:"#c3c6c1"})+R(6,84,w-12,1.2,"#c3c6c1")+R(6,85.2,w-12,.8,"#fff")},
 term(p,w){const f=TERM[p.color]||TERM.Gris,n=String(p.des||"").replace(/\D/g,"")||"";
  return R(1,19,16,134,f,{rx:2,s:"rgba(0,0,0,.45)"})+R(1,19,16,134,"url(#gSide)",{rx:2})+R(2.5,20,13,1.5,"#fff",{rx:.7,op:.5})+R(3,26,12,15,"url(#gHole)",{rx:1.5})+screw(9,33.5,5)+R(3,131,12,15,"url(#gHole)",{rx:1.5})+screw(9,138.5,5)+R(2,76,14,19,"#fff",{s:"#999",sw:.6})+T(9,89,n,{fs:7})+R(4,50,10,1,"rgba(0,0,0,.25)")+R(4,51,10,.6,"#fff",{op:.4})+R(4,112,10,1,"rgba(0,0,0,.25)")+R(4,113,10,.6,"#fff",{op:.4})},
 mpcb(p,w){let s=body(w,"url(#gD)","#1f2225")+terms(w,8,3)+terms(w,142,3)+face(w,"#3b4045","#2a2e31")+T(45,47,"I",{fs:7,c:"#e9ecee"})+T(15,79,"O",{fs:7,c:"#e9ecee"});
  s+=C(45,80,25,"#000",{op:.35})+C(45,78,24,"#1b1d1f",{s:"#5b6166",sw:1.5})+C(45,78,22,"url(#gLens)",{op:.25});
  s+=`<g transform="rotate(${p.on?0:-90} 45 78)">${R(41,58,10,44,"#000",{rx:4,op:.45})}${R(40,56,10,44,"url(#gHd)",{rx:4,s:"#686e73",sw:.6})}${R(41.5,58,2,40,"#fff",{rx:1,op:.25})}<polygon points="45,58 41,66 49,66" fill="#f2f2f2"/></g>`;
  return s+scr(18,110,54,14,"#eceae3")+T(45,120,p.range,{fs:7.5})+flag(70,40,12,6,!p.on).replace("#3a9d55","#3a3f43")},
};
const icontU=p=>p.In<=32?5:p.In<=65?6:8;
const OVL=["0.63–1A","1–1.6A","1.6–2.5A","2.5–4A","4–6A","5.5–8A","7–10A","9–13A","12–18A","16–24A","23–32A","30–40A","37–50A","48–65A","63–80A","80–93A"];

/* ---------- DIN catalog ---------- */
const CAT={
 mcb:{n:"Interruptor termomagnético",pre:"Q",u:p=>p.poles*2,d:{poles:2,In:16,curve:"C",kA:6,on:true},f:[["poles","Polos",[1,2,3,4]],["In","Corriente (A)",[2,4,6,10,16,20,25,32,40,50,63]],["curve","Curva",["B","C","D"]],["kA","Poder de corte (kA)",[3,4.5,6,10]]],st:"Cerrado (I)",desc:p=>`Interruptor termomagnético riel DIN ${p.poles}P ${p.curve}${p.In} ${p.kA}kA`},
 rcd:{n:"Interruptor diferencial",pre:"ID",u:p=>p.poles*2,d:{poles:2,In:40,sens:"30mA",type:"AC",on:true},f:[["poles","Polos",[2,4]],["In","Corriente (A)",[25,40,63]],["sens","Sensibilidad",["30mA","300mA"]],["type","Tipo",["AC","A"]]],st:"Cerrado (I)",desc:p=>`Interruptor diferencial ${p.poles}P ${p.In}A ${p.sens} tipo ${p.type}`},
 sw:{n:"Seccionador bajo carga",pre:"QS",u:p=>p.poles*2,d:{poles:2,In:40,on:true},f:[["poles","Polos",[2,3,4]],["In","Corriente (A)",[25,40,63,80,100]]],st:"Cerrado (I)",desc:p=>`Seccionador bajo carga ${p.poles}P ${p.In}A`},
 spd:{n:"Supresor de picos (DPS)",pre:"DPS",u:p=>p.poles*2,d:{poles:2,Imax:40,on:true},f:[["poles","Polos",[2,4]],["Imax","Imax (kA)",[20,40]]],st:"Indicador OK",desc:p=>`Supresor de picos T2 ${p.poles}P ${p.Imax}kA 150V`},
 prot:{n:"Protector de voltaje",pre:"PV",u:()=>4,d:{In:40,on:true},f:[["In","Corriente (A)",[32,40,63]]],st:"Con tensión",desc:p=>`Protector de voltaje alto/bajo ${p.In}A 120V`},
 supv:{n:"Supervisor de voltaje",pre:"SV",u:()=>4,d:{sys:"Trifásico 208V",lo:180,hi:260,delay:"Sin retardo",on:true},f:[["sys","Sistema",["Monofásico 120V","Bifásico 240V","Trifásico 208V","Trifásico 480V"]],["lo","Corte por bajo voltaje (V entre fases)",[150,160,165,170,180,190,200]],["hi","Corte por alto voltaje (V entre fases)",[250,255,260,265,270,280]],["delay","Retardo al volver la luz",["Sin retardo","10 s","30 s","3 min","5 min"]]],st:"Red normal (relé cerrado)",desc:p=>`Supervisor de voltaje ${p.sys.toLowerCase()}${p.sys.startsWith("Trif")?" (secuencia, falta de fase, asimetría)":""}`},
 cont:{n:"Contactor modular",pre:"KM",u:p=>p.In<=25?4:6,d:{In:25,cts:"4NA",coil:"120V",on:false},f:[["In","Corriente (A)",[16,20,25,40,63]],["cts","Contactos",["2NA","4NA","2NA+2NC"]],["coil","Bobina",["24V","120V","240V"]]],st:"Bobina energizada",desc:p=>`Contactor modular ${p.In}A ${p.cts} bobina ${p.coil}`},
 icont:{n:"Contactor industrial",pre:"KM",u:icontU,d:{In:18,coil:"120V",aux:"1NA",on:false},f:[["In","Corriente AC-3 (A)",[9,12,18,25,32,40,50,65,80,95]],["coil","Bobina",["24V","120V","208V","240V"]],["aux","Contacto auxiliar",["1NA","1NC","1NA+1NC"]]],st:"Bobina energizada",desc:p=>`Contactor industrial 3P ${p.In}A AC-3 bobina ${p.coil} aux. ${p.aux}`},
 ovl:{n:"Relé térmico",pre:"F",u:()=>5,d:{range:"9–13A",on:true},f:[["range","Rango de ajuste",OVL]],st:"Armado (sin disparo)",desc:p=>`Relé térmico de sobrecarga ${p.range}`},
 mpcb:{n:"Guardamotor",pre:"QM",u:()=>5,d:{range:"6–10A",on:true},f:[["range","Rango de ajuste",["0.63–1A","1–1.6A","1.6–2.5A","2.5–4A","4–6.3A","6–10A","9–14A","13–18A","17–23A","20–25A"]]],st:"Cerrado (I)",desc:p=>`Guardamotor ${p.range}`},
 relay:{n:"Relé de control",pre:"KA",u:()=>3,d:{coil:"120V AC",ct:"2 conmutados",on:false},f:[["coil","Bobina",["24V DC","120V AC","240V AC"]],["ct","Contactos",["1 conmutado","2 conmutados","4 conmutados"]]],st:"Bobina energizada",desc:p=>`Relé enchufable con base, bobina ${p.coil}, ${p.ct}`},
 emerg:{n:"Paro de emergencia",pre:"S",u:()=>4,d:{on:true},f:[],st:"Liberado",desc:()=>`Pulsador de paro de emergencia tipo hongo 1NC`},
 selector:{n:"Selector",pre:"SA",u:()=>2,d:{lab:"MAN · 0 · AUT",pos:"Centro"},f:[["lab","Posiciones",["0 · I","I · 0 · II","MAN · 0 · AUT"]],["pos","Posición",["Izquierda","Centro","Derecha"]]],desc:p=>`Selector rotativo ${p.lab}`},
 vam:{n:"Medidor digital V/A",pre:"PV",u:()=>4,d:{mode:"Voltímetro",read:"121.4"},f:[["mode","Mide",["Voltímetro","Amperímetro","Volt-amperímetro"]],["read","Lectura","text"]],desc:p=>`${p.mode} digital riel DIN 60 Hz`},
 push:{n:"Pulsador modular",pre:"S",u:()=>2,d:{color:"Verde",ct:"NA"},f:[["color","Color",Object.keys(PUSH)],["ct","Contacto",["NA","NC"]]],desc:p=>`Pulsador modular ${p.color.toLowerCase()} 1${p.ct}`},
 timer:{n:"Temporizador",pre:"KT",u:()=>2,d:{fn:"Retardo a la conexión",range:"0.1s–10s",t:3,on:false},f:[["fn","Función",["Retardo a la conexión","Retardo a la desconexión","Multifunción"]],["range","Rango",["0.1s–10s","1s–100s","0.1s–10d"]],["t","Tiempo ajustado (s)",[1,2,3,5,10,30]]],st:"Alimentado",desc:p=>`Temporizador ${p.fn.toLowerCase()} ${p.range}`},
 pilot:{n:"Luz piloto",pre:"H",u:()=>2,d:{color:"Verde",V:"120V",on:true},f:[["color","Color",Object.keys(PILOT)],["V","Tensión",["24V","120V","240V"]]],st:"Encendida",desc:p=>`Luz piloto modular ${p.color.toLowerCase()} ${p.V}`},
 meter:{n:"Medidor de energía",pre:"P",u:p=>p.ph==="Trifásico"?8:4,d:{ph:"Monofásico",kwh:"01254.7"},f:[["ph","Sistema",["Monofásico","Trifásico"]],["kwh","Lectura (kWh)","text"]],desc:p=>`Medidor de energía ${p.ph.toLowerCase()} riel DIN`},
 psu:{n:"Fuente de alimentación",pre:"G",u:()=>6,d:{V:"24V",A:"2.5A",on:true},f:[["V","Tensión",["12V","24V"]],["A","Corriente",["1.5A","2.5A","4.5A"]]],st:"Salida OK",desc:p=>`Fuente de alimentación ${p.V} DC ${p.A}`},
 socket:{n:"Tomacorriente DIN",pre:"TC",u:()=>6,d:{},f:[],desc:()=>`Tomacorriente riel DIN NEMA 5-15 15A 125V`},
 term:{n:"Bornera",pre:"X",u:()=>1,d:{color:"Gris",sec:"12 AWG"},f:[["color","Color",Object.keys(TERM)],["sec","Calibre",["14 AWG","12 AWG","10 AWG","8 AWG","6 AWG"]]],desc:p=>`Bornera de paso ${p.sec} ${p.color.toLowerCase()}`},
 blank:{n:"Tapa ciega",pre:"",u:p=>p.mods*2,d:{mods:1},f:[["mods","Ancho (módulos)",[1,2,3,4]]],desc:p=>`Tapa ciega ${p.mods} mód.`},
};
const NEW=new Set(["supv","icont","ovl","relay","emerg","selector","vam"]);
const LIB_DIN=[
 ["Supervisión de voltaje",[["supv","Supervisor trifásico",{sys:"Trifásico 208V"}],["supv","Supervisor monofásico",{sys:"Monofásico 120V"}],["prot","Protector de voltaje",{}],["spd","Supresor de picos",{poles:2}],["vam","Voltímetro digital",{}],["vam","Amperímetro digital",{mode:"Amperímetro",read:"18.6"}]]],
 ["Contactores y motores",[["icont","Contactor 18A",{In:18}],["icont","Contactor 40A",{In:40}],["icont","Contactor 95A",{In:95}],["ovl","Relé térmico",{}],["mpcb","Guardamotor",{}],["cont","Contactor modular",{}],["relay","Relé de control",{}],["timer","Temporizador",{}]]],
 ["Mando",[["push","Pulsador marcha",{color:"Verde",ct:"NA"}],["push","Pulsador parada",{color:"Rojo",ct:"NC"}],["emerg","Paro de emergencia",{}],["selector","Selector MAN-0-AUT",{}],["selector","Selector 0-I",{lab:"0 · I",pos:"Izquierda"}]]],
 ["Protección DIN",[["mcb","Termomagnética 1P",{poles:1,In:10}],["mcb","Termomagnética 2P",{poles:2}],["mcb","Termomagnética 3P",{poles:3,In:25}],["rcd","Diferencial 2P",{poles:2}],["rcd","Diferencial 4P",{poles:4}],["sw","Seccionador 3P",{poles:3,In:63}]]],
 ["Señalización y medición",[["pilot","Piloto verde",{color:"Verde"}],["pilot","Piloto rojo",{color:"Rojo"}],["pilot","Piloto ámbar",{color:"Ámbar"}],["meter","Medidor monofásico",{ph:"Monofásico"}],["meter","Medidor trifásico",{ph:"Trifásico",kwh:"008731.2"}]]],
 ["Accesorios",[["psu","Fuente 24V",{}],["socket","Tomacorriente NEMA",{}],["blank","Tapa ciega",{}],["term","Bornera fase",{color:"Negro"}],["term","Bornera neutro",{color:"Blanco"}],["term","Bornera tierra",{color:"Verde"}]]],
];
const units=it=>CAT[it.type].u(it.p);
function drawComp(type,p){const w=CAT[type].u(p)*U;return{w,svg:DRAW[type](p,w)}}
