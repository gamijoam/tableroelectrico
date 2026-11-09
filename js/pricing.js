/* ---------- prices (USD, referential) ---------- */
const r2=n=>Math.round(n*100)/100;
const PRICE_DIN={
 mcb:p=>[0,5,12,20,28][p.poles]+(p.In>32?Math.round(p.In*.15):0)+(p.kA>=10?6:0),rcd:p=>p.poles===2?35:60,sw:p=>10+p.poles*5+(p.In>63?15:0),spd:p=>p.poles===2?35:60,
 prot:p=>p.In===63?38:28,supv:p=>p.sys.startsWith("Trif")?45:30,cont:p=>p.In<=25?28:45,icont:p=>({9:22,12:26,18:32,25:42,32:55,40:75,50:95,65:120,80:160,95:190})[p.In]||40,
 ovl:p=>{const hi=parseFloat(p.range.split("–")[1]);return hi>40?55:hi>18?35:26},mpcb:()=>45,relay:()=>14,emerg:()=>15,selector:()=>10,vam:()=>18,push:()=>7,timer:()=>22,pilot:()=>5,
 meter:p=>p.ph==="Trifásico"?65:25,psu:p=>p.A==="4.5A"?55:p.A==="2.5A"?35:28,socket:()=>12,term:()=>1.2,blank:()=>1.5};
function brkPrice(p){let v={1:6,2:14,3:45}[p.poles]+Math.max(0,p.In-30)*{1:.25,2:.4,3:.9}[p.poles];if(p.type==="GFCI")v+=p.poles===1?38:80;if(p.type==="AFCI")v+=38;return Math.round(v*2)/2}
const LC_BOX={4:18,8:30,12:45,16:60,20:75,24:90,30:120,32:130,40:170,42:185},MAIN_P={0:0,60:45,100:70,125:95,150:130,200:180,225:220};
const AWG_P={"2":5,"14":.35,"12":.5,"10":.8,"8":1.3,"6":2.1,"4":3.3,"3":4.1,"1":6,"1/0":7.5,"3/0":11,"4/0":14};
const fmtNum=(n,d=2)=>(+n||0).toLocaleString(LANG==="en"?"en-US":"es-VE",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtUSD=n=>"$ "+fmtNum(n);
const fmtBs=n=>"Bs "+fmtNum(n);
const fmtQ=q=>Number.isInteger(q)?String(q):fmtNum(q,1);
