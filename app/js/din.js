/* ---------- DIN component drawings ---------- */
const PILOT={Verde:["#38e266","#1f5a2e"],Rojo:["#ff3b30","#6a1f1b"],"Ámbar":["#ffb300","#6b4a0c"],Azul:["#3d8bff","#1c3866"],Blanco:["#fffbe8","#9a9a92"]};
const PUSH={Verde:"#2aa84a",Rojo:"#d3312b",Negro:"#2b2e31",Amarillo:"#e8c22c"};
const TERM={Gris:"#9aa0a4",Azul:"#2f6fd0","Verde/amarillo":"url(#pGY)","Verde":"#2f9e44","Blanco":"#eeeeea","Marrón":"#7a4b2a",Negro:"#2b2d2f",Rojo:"#c63228"};
const DRAW={
 mcb(p,w){const n=p.poles;let s=std(w);const ly=p.on?48:70;
  for(let i=0;i<n;i++){const x=i*M;s+=R(x+9,46,18,48,"#24282a",{rx:3})+R(x+11,ly,14,22,"#3a3f43",{rx:2})+R(x+12,ly+1,12,4,"#61676b",{rx:1})+T(x+18,121,p.curve+p.In,{fs:10.5,fw:700})}
  if(n>1)s+=R(11,ly+9,(n-1)*M+14,6,"#3a3f43",{rx:1});
  s+=R(10,99,16,6,p.on?"#d23a2f":"#3a9d55",{rx:1})+R(8.5,126,19,9,"none",{s:"#555",sw:.8})+T(18,133,Math.round(p.kA*1000),{fs:6});return s},
 rcd(p,w){const ly=p.on?48:70;let s=std(w)+R(9,46,18,48,"#24282a",{rx:3})+R(11,ly,14,22,"#3a3f43",{rx:2})+R(12,ly+1,12,4,"#61676b",{rx:1});
  s+=C(M+18,60,8,"#e7c23b",{s:"#9c7f19"})+T(M+18,63.5,"T",{fs:8,fw:700})+R(M+10,79,16,7,p.on?"#d23a2f":"#3a9d55",{rx:1});
  s+=T(w/2,111,p.In+"A",{fs:11,fw:700})+T(w/2,123,p.sens,{fs:8.5})+T(w/2,133,"IΔn · tipo "+p.type,{fs:6,fw:400});return s},
 sw(p,w){const ly=p.on?48:70;let s=std(w)+R(8,46,w-16,48,"#24282a",{rx:4})+R(12,ly,w-24,22,"#c8322a",{rx:3})+R(13,ly+1,w-26,4,"#e5665e",{rx:1})+T(w/2,ly+15.5,p.on?"I":"O",{fs:10,c:"#fff",fw:700});
  return s+T(w/2,114,p.In+"A",{fs:11,fw:700})+T(w/2,126,p.poles+"P · I–0",{fs:7,fw:400})},
 spd(p,w){let s=body(w)+terms(w,8)+terms(w,142);for(let i=0;i<p.poles;i++){const x=i*M;s+=R(x+4,38,28,98,"url(#gF)",{rx:2,s:"#b6b9b4"})+R(x+11,52,14,9,p.on?"#3cae5e":"#d23a2f",{rx:1})+T(x+18,80,"T2",{fs:8,fw:700})+T(x+18,94,p.Imax+"kA",{fs:7})+T(x+18,106,"150V",{fs:6,fw:400})}return s},
 prot(p,w){let s=std(w)+R(8,46,56,28,"#140707",{rx:2})+T(36,67,p.on?"121":"- - -",{fs:17,fw:700,c:"#ff4b3b"});
  s+=C(16,86,3,p.on?"#3bd16b":"#2c4a35")+T(22,88,"OK",{fs:5.5,a:"start",fw:400})+C(46,86,3,p.on?"#5a1f1f":"#ff3b30")+T(52,88,"ERR",{fs:5.5,a:"start",fw:400});
  return s+R(12,97,14,8,"#555a5e",{rx:2})+R(46,97,14,8,"#555a5e",{rx:2})+T(36,122,p.In+"A",{fs:9.5,fw:700})+T(36,132,"Protector V",{fs:6,fw:400})},
 supv(p,w){const tri=p.sys.startsWith("Trif");let s=std(w);
  s+=C(14,47,3,p.on?"#3bd16b":"#24452f")+C(36,47,3,p.on?"#ffc533":"#5a4a1d")+C(58,47,3,p.on?"#5a1f1f":"#ff3b30");
  s+=T(14,57,"PWR",{fs:4.8,fw:400})+T(36,57,"RELÉ",{fs:4.8,fw:400})+T(58,57,"FALLA",{fs:4.8,fw:400});
  s+=knob(14,74,7,-50)+knob(36,74,7,40)+knob(58,74,7,10)+T(14,90,"U<",{fs:5.5})+T(36,90,"U>",{fs:5.5})+T(58,90,"t",{fs:5.5});
  return s+T(36,108,(tri?"3Φ ":"1Φ ")+p.sys.replace(/^\D+/,""),{fs:9,fw:700})+T(36,119,tri?"Secuencia · falta fase":"Sobre / bajo voltaje",{fs:5,fw:400})+T(36,130,"Supervisor",{fs:6,fw:400})},
 cont(p,w){let s=std(w)+T(8,46,"A1",{fs:6,a:"start",fw:400})+T(w-8,46,p.coil,{fs:6,a:"end",fw:400})+R(w/2-14,52,28,16,"#1e2124",{rx:2})+T(w/2,64,p.on?"I":"0",{fs:10,c:p.on?"#ffcf33":"#8a8f93",fw:700});
  return s+R(w/2-5,76,10,26,"#cfd2ce",{rx:2,s:"#9a9e99"})+R(w/2-5,p.on?76:90,10,12,"#3a3f43",{rx:2})+T(w/2,118,p.In+"A AC-3",{fs:9,fw:700})+T(w/2,129,p.cts,{fs:7,fw:400})+T(8,133,"A2",{fs:6,a:"start",fw:400})},
 icont(p,w){let s=body(w,"url(#gC)","#8d918d")+terms(w,8,3)+terms(w,142,3);const sp=w/3;
  ["1/L1","3/L2","5/L3"].forEach((t,i)=>s+=T(sp*i+sp/2,39,t,{fs:5.2,fw:400}));["2/T1","4/T2","6/T3"].forEach((t,i)=>s+=T(sp*i+sp/2,139,t,{fs:5.2,fw:400}));
  s+=R(6,44,w-12,88,"url(#gF)",{rx:3,s:"#a9ada8"})+R(10,48,w-20,18,"#d7dad6",{rx:2,s:"#b3b6b1"})+T(16,60,"A1",{fs:6,a:"start"})+T(w-16,60,"A2",{fs:6,a:"end"});
  s+=R(w/2-11,70,22,16,"#1e2124",{rx:2})+T(w/2,82,p.on?"I":"0",{fs:10,c:p.on?"#ffcf33":"#8a8f93",fw:700});
  return s+T(w/2,101,p.In+"A",{fs:12,fw:700})+T(w/2,112,"Bobina "+p.coil,{fs:6,fw:400})+T(w/2,124,"Aux. "+p.aux,{fs:6,fw:400})},
 ovl(p,w){let s=body(w,"url(#gC)","#8d918d")+terms(w,142,3);const sp=w/3;
  for(let i=0;i<3;i++)s+=R(sp*i+sp/2-4,4,8,26,"url(#gCuH)",{rx:1,s:"#8a5426"});
  s+=R(6,36,w-12,96,"url(#gF)",{rx:3,s:"#a9ada8"})+C(30,66,13,"#f6f6f2",{s:"#777"})+`<line x1="30" y1="66" x2="30" y2="56" stroke="#333" stroke-width="2" transform="rotate(30 30 66)"/>`;
  for(let k=-2;k<=2;k++)s+=`<line x1="30" y1="51" x2="30" y2="54" stroke="#555" stroke-width="1" transform="rotate(${k*30} 30 66)"/>`;
  s+=R(w-34,52,22,12,"#2f6fd0",{rx:2})+T(w-23,61,"R",{fs:7,c:"#fff"})+R(w-34,70,22,12,"#d3312b",{rx:2})+T(w-23,79,"STOP",{fs:5,c:"#fff"});
  s+=R(w/2-10,90,20,7,p.on?"#3a9d55":"#f08a2b",{rx:1});
  return s+T(w/2,112,p.range,{fs:8,fw:700})+T(w/2,124,"Relé térmico",{fs:6,fw:400})},
 relay(p,w){let s=std(w)+R(8,40,w-16,92,"#cfe3f2",{rx:4,s:"#8fb3cf",op:.9})+R(14,62,w-28,40,"#3d5f8a",{rx:2})+R(18,66,w-36,8,"#c88a4a",{rx:1})+C(w/2,50,3,p.on?"#ff3b30":"#5a1f1f");
  return s+T(w/2,115,p.coil,{fs:6.5,fw:700})+T(w/2,125,p.ct,{fs:5.3,fw:400})},
 emerg(p,w){let s=std(w)+C(36,80,27,"#f2c62e",{s:"#a88a12"})+T(36,60,"EMERGENCIA",{fs:4.8,c:"#3a2f05"});
  const r=p.on?19:16;s+=C(36,84,r+2,"#7a1410")+C(36,84,r,"#d3221b")+C(36,84,r,"url(#gLens)");
  return s+(p.on?"":T(36,128,"ENCLAVADO",{fs:6,c:"#d3221b"}))},
 selector(p,w){const tri=p.lab.split("·").length===3;const ang={Izquierda:-45,Centro:tri?0:45,Derecha:45}[p.pos]??-45;
  let s=std(w)+C(18,74,13,"#3a3e41",{s:"#222"})+`<g transform="rotate(${ang} 18 74)">${R(15,62,6,24,"#111",{rx:2})}${R(16.5,63,3,6,"#f2f2f2",{rx:1})}</g>`;
  const L=p.lab.split("·").map(x=>x.trim());s+=T(5,52,L[0],{fs:5,a:"start"})+T(31,52,L[L.length-1],{fs:5,a:"end"});if(tri)s+=T(18,52,L[1],{fs:5});
  return s+T(18,112,tri?"3 pos.":"2 pos.",{fs:6,fw:400})},
 vam(p,w){let s=std(w)+R(7,44,58,40,"#120808",{rx:2})+T(60,62,p.read,{fs:15,a:"end",c:"#ff4b3b",fw:700})+T(60,78,{"Voltímetro":"VAC","Amperímetro":"AAC","Volt-amperímetro":"V · A"}[p.mode],{fs:7,a:"end",c:"#ff8a7a"});
  return s+R(14,92,12,7,"#555a5e",{rx:2})+R(46,92,12,7,"#555a5e",{rx:2})+T(36,116,p.mode,{fs:6.3,fw:600})+T(36,127,"60 Hz",{fs:6,fw:400})},
 pilot(p,w){const c=PILOT[p.color]||PILOT.Verde;let s=std(w)+C(18,74,14,"#c9ccc8",{s:"#8e928d"});
  if(p.on)s+=C(18,74,15,c[0],{op:.55,flt:"blur"});
  return s+C(18,74,11,p.on?c[0]:c[1])+C(18,74,11,"url(#gLens)")+T(18,112,p.V,{fs:6.5,fw:400})+T(18,124,p.color.slice(0,3).toUpperCase(),{fs:6.5})},
 push(p,w){const c=PUSH[p.color]||PUSH.Verde;return std(w)+C(18,72,14,"#3a3e41")+C(18,72,11,c)+C(18,72,11,"url(#gLens)")+T(18,108,"1"+p.ct,{fs:7})+T(18,120,p.color==="Rojo"?"STOP":p.color==="Verde"?"START":"",{fs:6})},
 timer(p,w){const a=p.on?40:-40;let s=std(w)+knob(18,62,10,a);
  s+=C(11,85,2.7,p.on?"#38d36a":"#24452f")+C(25,85,2.7,p.on?"#ffc533":"#5a4a1d")+T(11,95,"U",{fs:5.5})+T(25,95,"R",{fs:5.5});
  return s+T(18,112,p.range,{fs:5.3,fw:400})+T(18,123,{"Retardo a la conexión":"TON","Retardo a la desconexión":"TOFF","Multifunción":"MULTI"}[p.fn]||"",{fs:6.5})},
 meter(p,w){const tri=p.ph==="Trifásico";let s=std(w)+R(6,44,w-12,28,"#a9bb94",{rx:2,s:"#6f7d61"})+T(10,51,"kWh",{fs:5.5,a:"start",fw:400,c:"#1c2615"})+T(w-10,67,p.kwh,{fs:tri?15:11,a:"end",c:"#1c2615"});
  return s+C(14,85,3,"#e0302a")+T(21,87,"1000 imp/kWh",{fs:5.3,a:"start",fw:400})+T(w/2,108,tri?"3×208/120V 10(100)A":"120/240V 15(100)A",{fs:6.1,fw:400})+T(w/2,119,"60 Hz · Clase 1",{fs:6,fw:400})+T(w/2,131,tri?"TRIFÁSICO":"MONOFÁSICO",{fs:6.5})},
 psu(p,w){let s=std(w);for(let k=0;k<6;k++)s+=R(10,42+k*6,w-20,2.5,"#a3a7a2",{rx:1});
  return s+C(18,86,3,p.on?"#36d06a":"#2a4a33")+T(25,88,"DC OK",{fs:5.5,a:"start",fw:400})+C(w-18,86,5,"#e8e8e2",{s:"#888"})+`<line x1="${w-21}" y1="83" x2="${w-15}" y2="89" stroke="#555" stroke-width="1.4"/>`+T(w-18,99,"ADJ",{fs:5})+T(w/2,115,p.V+" DC",{fs:12,fw:700})+T(w/2,128,p.A,{fs:8,fw:400})},
 socket(p,w){const cx=54,cy=82;let s=std(w)+R(16,40,76,94,"#ecece6",{rx:10,s:"#b3b6b0"});
  s+=R(cx-14,cy-18,5,18,"#2c2f31",{rx:1.2})+R(cx+9,cy-16,5,14,"#2c2f31",{rx:1.2})+`<path d="M${cx-4} ${cy+16}v-4a4 4 0 0 1 8 0v4z" fill="#2c2f31"/>`;
  return s+T(cx,126,"15A 125V",{fs:6.5,fw:400})},
 blank(p,w){return body(w)+R(3,8,w-6,156,"url(#gF)",{rx:2,s:"#c3c6c1"})+R(6,84,w-12,1.2,"#c3c6c1")},
 term(p,w){const f=TERM[p.color]||TERM.Gris,n=String(p.des||"").replace(/\D/g,"")||"";
  return R(1,19,16,134,f,{rx:2,s:"rgba(0,0,0,.45)"})+R(3,26,12,15,"#262829",{rx:1.5})+screw(9,33.5,5)+R(3,131,12,15,"#262829",{rx:1.5})+screw(9,138.5,5)+R(2,76,14,19,"#fff",{s:"#999",sw:.6})+T(9,89,n,{fs:7})+R(4,50,10,1,"rgba(0,0,0,.25)")+R(4,112,10,1,"rgba(0,0,0,.25)")},
 mpcb(p,w){let s=body(w,"url(#gD)","#1f2225")+terms(w,8,3)+terms(w,142,3)+face(w,"#3b4045","#2a2e31")+T(45,47,"I",{fs:7,c:"#e9ecee"})+T(15,79,"O",{fs:7,c:"#e9ecee"});
  s+=C(45,78,24,"#1b1d1f",{s:"#5b6166",sw:1.5})+`<g transform="rotate(${p.on?0:-90} 45 78)">${R(40,56,10,44,"#2f3336",{rx:4,s:"#686e73"})}<polygon points="45,58 41,66 49,66" fill="#f2f2f2"/></g>`;
  return s+R(18,110,54,14,"#eceae3",{rx:2})+T(45,120,p.range,{fs:7.5})+R(70,40,12,6,p.on?"#3a3f43":"#d23a2f",{rx:1})},
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
 supv:{n:"Supervisor de voltaje",pre:"SV",u:()=>4,d:{sys:"Trifásico 208V",on:true},f:[["sys","Sistema",["Monofásico 120V","Bifásico 240V","Trifásico 208V","Trifásico 480V"]]],st:"Red normal (relé cerrado)",desc:p=>`Supervisor de voltaje ${p.sys.toLowerCase()}${p.sys.startsWith("Trif")?" (secuencia, falta de fase, asimetría)":""}`},
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
