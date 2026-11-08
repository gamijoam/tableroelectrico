/* ---------- external equipment ---------- */
const EXT={
 estab:{n:"Estabilizador de voltaje",w:()=>150,h:()=>190,d:{kva:3,sys:"Monofásico 120V",on:true},st:"Encendido",f:[["kva","Capacidad (kVA)",[1,2,3,5,10,15,30]],["sys","Sistema",["Monofásico 120V","Bifásico 240V","Trifásico 208V"]]],
  desc:p=>`Estabilizador / regulador de voltaje ${p.kva} kVA ${p.sys.replace(/^\S+/,w=>w.toLowerCase())}`,spec:p=>`${p.kva} kVA · ${p.sys.replace(/^\S+ /,"")}`,price:p=>({1:60,2:110,3:160,5:280,10:650,15:950,30:1900}[p.kva]||300)*(p.sys.startsWith("Trif")?1.8:p.sys.startsWith("Bif")?1.25:1),
  tip:"Elige uno con al menos 25% más de capacidad que la carga que va a proteger."},
 ups:{n:"UPS",w:()=>110,h:()=>200,d:{kva:1.5,kind:"Interactiva",on:true},st:"Encendida",f:[["kva","Capacidad (kVA)",[1,1.5,2,3,6,10]],["kind","Tipo",["Interactiva","Online doble conversión"]]],
  desc:p=>`UPS ${p.kva} kVA ${p.kind.toLowerCase()}`,spec:p=>`${p.kva} kVA`,price:p=>({1:120,1.5:170,2:260,3:420,6:1300,10:2400}[p.kva]||400)*(p.kind.startsWith("Online")?1.6:1),
  tip:"Para computadoras, punto de venta, router y cámaras. No le conectes motores como neveras o bombas."},
 inv:{n:"Inversor con baterías",w:p=>124+(p.bat>4?2:1)*76,h:()=>190,d:{kw:3,bat:4,on:true},st:"Encendido",f:[["kw","Potencia (kW)",[1,3,5,10]],["bat","Baterías 12 V 200 Ah",[2,4,8]]],
  desc:p=>`Inversor / cargador ${p.kw} kW con ${p.bat} baterías 12 V 200 Ah`,spec:p=>`${p.kw} kW · ${p.bat} baterías`,price:p=>({1:250,3:650,5:1100,10:2300}[p.kw])+p.bat*180,
  tip:"Respaldo para los cortes de luz: alimenta los circuitos esenciales (iluminación, nevera, router) desde las baterías."},
 gen:{n:"Planta eléctrica",w:()=>240,h:()=>150,d:{kva:12,fuel:"Gasolina",on:false},st:"En marcha",f:[["kva","Potencia (kVA)",[5,8,12,20,40,60]],["fuel","Combustible",["Gasolina","Diésel","Gas"]]],
  desc:p=>`Planta eléctrica ${p.kva} kVA a ${p.fuel.toLowerCase()} con arranque eléctrico`,spec:p=>`${p.kva} kVA · ${p.fuel}`,price:p=>({5:900,8:1600,12:3200,20:6500,40:11000,60:15500}[p.kva])*(p.fuel==="Diésel"?1.35:p.fuel==="Gas"?1.15:1),
  tip:"Conéctala siempre a través de una transferencia, manual o automática, para no devolver energía a la red."},
 ats:{n:"Transferencia automática",w:()=>140,h:()=>190,d:{In:100,src:"Red"},f:[["In","Corriente (A)",[63,100,200,400]],["src","Alimentando desde",["Red","Planta"]]],
  desc:p=>`Transferencia automática (ATS) red / planta ${p.In} A`,spec:p=>`${p.In} A · ${p.src}`,price:p=>({63:380,100:520,200:950,400:1800}[p.In]),
  tip:"Cambia sola entre la red y la planta cuando se va la luz, y vuelve cuando regresa."},
 trafo:{n:"Transformador seco",w:()=>180,h:()=>210,d:{kva:15,rel:"480 / 208Y-120 V"},f:[["kva","Potencia (kVA)",[3,5,10,15,30,45,75]],["rel","Relación",["480 / 208Y-120 V","480 / 240-120 V","208 / 120-240 V","240 / 120 V"]]],
  desc:p=>`Transformador seco ${p.kva} kVA ${p.rel}`,spec:p=>`${p.kva} kVA`,price:p=>({3:350,5:480,10:800,15:1100,30:1900,45:2600,75:3900}[p.kva]||900),
  tip:"Para bajar de 480 V a 208Y/120 V en galpones e industrias, o para aislar equipos sensibles."},
};
const lens=(cx,cy,r,on,c)=>(on?C(cx,cy,r+3,c[0],{op:.5,flt:"blur"}):"")+C(cx,cy,r,on?c[0]:c[1])+C(cx,cy,r,"url(#gLens)");
const DRAWX={
 estab(p,w,h){const on=p.on;let s=box(0,0,w,h-8,"#e6e7e3",{rx:8,s:"#8d918d"})+R(0,0,w,30,"url(#gBkS)",{rx:8})+R(0,22,w,8,"#1b1d1f")+T(w/2,19,"ESTABILIZADOR",{fs:8.5,c:"#fff",ff:SANS,fw:700});
  s+=scr(12,40,58,30,"#0d1a10",{rx:3})+T(41,61,on?"104":"---",{fs:16,c:"#5cff7a"})+T(41,80,"ENTRADA V",{fs:6,fw:400})+scr(80,40,58,30,"#0d1a10",{rx:3})+T(109,61,on?"120":"---",{fs:16,c:"#5cff7a"})+T(109,80,"SALIDA V",{fs:6,fw:400});
  s+=led(22,97,3.6,"#3bd16b",on,"#24452f")+T(30,99.5,"NORMAL",{fs:6,a:"start",fw:400})+led(86,97,3.6,"#ffc533",!on,"#5a4a1d")+T(94,99.5,"RETARDO",{fs:6,a:"start",fw:400});
  s+=rbtn(w/2-15,110,30,18,"#c8322a",{rx:3})+T(w/2,123,on?"I":"O",{fs:10,c:"#fff"});for(let k=0;k<4;k++)s+=R(14,138+k*7,w-28,3,"url(#gHole)",{rx:1.5,op:.6})+R(14,141+k*7,w-28,.7,"#fff");
  return s+T(w/2,h-14,p.kva+" kVA",{fs:9,fw:700})+R(10,h-8,22,8,"#2e3236",{rx:2})+R(w-32,h-8,22,8,"#2e3236",{rx:2})},
 ups(p,w,h){const on=p.on;let s=box(0,0,w,h-6,"url(#gBkS)",{rx:6,s:"#0f1011",hl:.25})+R(8,8,w-16,h-22,"#30353a",{rx:4})+R(8,8,w-16,h-22,"url(#gSide)",{rx:4,op:.5})+scr(18,20,w-36,36,on?"#86bff0":"#3b4c5c");
  s+=T(w/2,35,on?"BAT 100%":"",{fs:8,c:"#0d2236"})+T(w/2,49,on?"SALIDA 120V":"",{fs:6.5,c:"#0d2236",fw:400})+C(w/2,79.5,11,"#000",{op:.4})+C(w/2,78,11,"#1b1d1f",{s:"#555"})+C(w/2,78,10,"url(#gLens)",{op:.3})+C(w/2,78,6,"none",{s:on?"#4fd1ff":"#777",sw:2})+R(w/2-1,69,2,7,on?"#4fd1ff":"#777");
  for(let k=0;k<9;k++)s+=R(18,102+k*8,w-36,3,"#141618",{rx:1.5})+R(18,105+k*8,w-36,.7,"#fff",{op:.12});
  return s+T(w/2,h-16,"UPS "+p.kva+" kVA",{fs:8,c:"#e4e7e9"})+R(6,h-6,w-12,6,"#111")},
 inv(p,w,h){const on=p.on,cols=p.bat>4?2:1,rows=p.bat/cols;let s=`<g transform="translate(0 ${h-150})">`+box(0,0,110,150,"#f1f1ec",{rx:6,s:"#999"})+R(0,0,110,22,"url(#gBkS)",{rx:6})+R(0,14,110,8,"#1b1d1f")+T(55,15,"INVERSOR",{fs:8,c:"#fff",ff:SANS,fw:700});
  s+=scr(14,32,82,34,on?"#f2a33a":"#6b5434")+T(55,48,p.kw+" kW",{fs:11,c:"#2a1a05"})+T(55,60,on?"BAT 87% · 120V":"APAGADO",{fs:6.3,c:"#2a1a05",fw:400});
  s+=led(30,82,3.6,"#3bd16b",on,"#24452f")+led(55,82,3.6,"#ffc533",on,"#5a4a1d")+led(80,82,3.6,"#ff3b30",false,"#5a1f1f");for(let k=0;k<5;k++)s+=R(16,100+k*8,78,3,"url(#gHole)",{rx:1.5,op:.35})+R(16,103+k*8,78,.7,"#fff");s+="</g>";
  for(let c=0;c<cols;c++)for(let r=0;r<rows;r++){const x=124+c*76,y=h-(r+1)*46;s+=box(x,y,70,40,"url(#gBkS)",{rx:3,s:"#111",hl:.25})+R(x+8,y-4,10,5,"#c63228",{rx:1})+R(x+9,y-4,8,1.2,"#fff",{op:.4})+R(x+52,y-4,10,5,"#222",{rx:1})+R(x+53,y-4,8,1.2,"#fff",{op:.25})+T(x+35,y+18,"12V",{fs:8,c:"#fff"})+T(x+35,y+30,"200Ah",{fs:6.5,c:"#c9cdd0",fw:400})}
  return s+`<path d="M110 ${h-60} H120" stroke="#c63228" stroke-width="3"/><path d="M110 ${h-50} H120" stroke="#222" stroke-width="3"/>`},
 gen(p,w,h){const on=p.on;let s=R(18,0,10,16,"#555a5e",{rx:2})+box(6,10,w-12,h-26,"#d4a12a",{rx:8,s:"#8a6610"})+R(0,h-16,w,16,"url(#gBkS)",{rx:2});
  for(let k=0;k<6;k++)s+=R(w-92,26+k*14,70,6,"#7d5c0c",{rx:3})+R(w-92,30.5+k*14,70,1.2,"#f2cf6e",{rx:.6});
  s+=scr(22,28,82,58,"#2a2d30",{rx:3})+led(40,44,4.4,"#38e266",on,"#2c4a35")+led(58,44,4.4,"#ff3b30",!on,"#5a1f1f")+scr(32,58,62,16,"#0d1a10")+T(63,70,on?"60.0 Hz":"OFF",{fs:8,c:"#5cff7a"})+rbtnC(86,44,4,"#c8322a");
  return s+T(26,h-26,"PLANTA "+p.kva+" kVA",{fs:9.5,a:"start",ff:SANS,fw:700,c:"#3a2c05"})+C(34,h,8,"#1b1d1f")+C(w-34,h,8,"#1b1d1f")},
 ats(p,w,h){const red=p.src==="Red";let s=box(0,0,w,h-8,"#d4d7d4",{rx:4,s:"#7d827c"})+box(8,8,w-16,h-24,"#e3e5e1",{rx:3,s:"#a9ada8",so:.12})+R(w-17,70,5,40,"#8d918d",{rx:2});
  s+=T(w/2,26,"TRANSFERENCIA",{fs:7.5,ff:SANS,fw:700})+scr(22,34,w-44,24,"#0d1a10")+T(w/2,50,red?"RED OK":"PLANTA",{fs:9,c:"#5cff7a"});
  s+=lens(40,82,9,red,PILOT.Verde)+T(40,102,"RED",{fs:6.5})+lens(w-40,82,9,!red,PILOT["Ámbar"])+T(w-40,102,"PLANTA",{fs:6.5});
  return s+knob(w/2,128,12,red?-35:35)+T(w/2,152,"AUTO · "+p.In+" A",{fs:6.5})+R(10,h-8,22,8,"#555",{rx:2})+R(w-32,h-8,22,8,"#555",{rx:2})},
 trafo(p,w,h){let s=box(0,0,w,h-8,"#b9bec0",{rx:4,s:"#6f777b"});for(let k=0;k<5;k++)s+=R(14,12+k*9,w-28,4,"url(#gHole)",{rx:2,op:.5})+R(14,16+k*9,w-28,.8,"#fff",{op:.7})+R(14,h-58+k*9,w-28,4,"url(#gHole)",{rx:2,op:.5})+R(14,h-54+k*9,w-28,.8,"#fff",{op:.7});
  s+=box(w/2-54,64,108,52,"#f4f4ef",{rx:2,s:"#888",so:.15})+T(w/2,79,"TRANSFORMADOR",{fs:6.5})+T(w/2,95,p.kva+" kVA",{fs:12,fw:700})+T(w/2,108,p.rel,{fs:6,fw:400});
  return s+`<polygon points="${w/2},${h-82} ${w/2-11},${h-63} ${w/2+11},${h-63}" fill="#f2c62e" stroke="#333"/>`+T(w/2,h-65,"!",{fs:10})+R(-4,h-8,w+8,8,"#5d6468",{rx:2})},
};
function drawExt(type,p){const c=EXT[type],w=c.w(p),h=c.h(p);return{w,h,svg:DRAWX[type](p,w,h)}}
const LIB_EXT=[["Equipos externos",[["estab","Estabilizador 3 kVA",{}],["estab","Estabilizador trifásico",{kva:10,sys:"Trifásico 208V"}],["inv","Inversor + baterías",{}],["ups","UPS 1,5 kVA",{}],["gen","Planta eléctrica",{}],["ats","Transferencia automática",{}],["trafo","Transformador seco",{}]]]];
