/* ---------- load-center catalog & math ---------- */
const BRK_IN=[10,15,20,25,30,35,40,45,50,60,70,80,90,100,110,125];
const MAINS=[0,60,100,125,150,200,225];
const SPACES=[4,8,12,16,20,24,30,32,40,42];
const AWG={10:"14",35:"8",45:"8",90:"3",110:"2",15:"14",20:"12",25:"10",30:"10",40:"8",50:"6",60:"6",70:"4",80:"4",100:"3",125:"1",150:"1/0",200:"3/0",225:"4/0"};
const BRK={n:"Breaker enchufable",d:{poles:1,In:20,type:"Estándar",W:0,on:true},f:[["poles","Polos",[1,2,3]],["In","Corriente (A)",BRK_IN],["type","Tipo",["Estándar","GFCI","AFCI"]]],
  desc:p=>`Breaker enchufable ${p.poles}P ${p.In}A${p.type!=="Estándar"?" "+p.type:""}`};
const LIB_LC=[
 ["1 polo · 120 V",[["Breaker 15A",{poles:1,In:15}],["Breaker 20A",{poles:1,In:20}],["Breaker 30A",{poles:1,In:30}]]],
 ["2 polos · 240 / 208 V",[["Breaker 2P 20A",{poles:2,In:20}],["Breaker 2P 30A",{poles:2,In:30}],["Breaker 2P 40A",{poles:2,In:40}],["Breaker 2P 50A",{poles:2,In:50}],["Breaker 2P 60A",{poles:2,In:60}],["Breaker 2P 100A",{poles:2,In:100}]]],
 ["3 polos · 208 V trifásico",[["Breaker 3P 30A",{poles:3,In:30}],["Breaker 3P 60A",{poles:3,In:60}],["Breaker 3P 100A",{poles:3,In:100}]]],
 ["Protección de personas",[["GFCI 20A (baños, cocina)",{poles:1,In:20,type:"GFCI"}],["AFCI 15A (cuartos)",{poles:1,In:15,type:"AFCI"}],["GFCI 2P 50A (jacuzzi)",{poles:2,In:50,type:"GFCI"}]]],
];
/* Componentes DIN que se montan en el riel auxiliar de la caja de breakers */
const LIB_AUX=[["Riel auxiliar en la caja",[["supv","Supervisor de voltaje",{sys:"Bifásico 240V"}],["supv","Supervisor trifásico",{sys:"Trifásico 208V"}],["prot","Protector de voltaje",{}],["spd","Supresor de picos",{poles:2}],["vam","Voltímetro digital",{}],["meter","Medidor de consumo",{ph:"Monofásico"}],["cont","Contactor modular",{}],["timer","Temporizador",{}],["relay","Relé de control",{}],["pilot","Piloto verde",{color:"Verde"}],["term","Bornera tierra",{color:"Verde"}]]]];
const lcRows=()=>S.lc.spaces/2;
const PH=()=>S.lc.sys==="3F"?["A","B","C"]:["A","B"];
const phaseOf=slot=>PH()[slot%PH().length];
const circ=(side,slot)=>side==="L"?slot*2+1:slot*2+2;
const brkV=p=>p.poles===1?120:(S.lc.sys==="1F"?240:208);
const sysLabel=()=>S.lc.sys==="1F"?"120/240 V 1Φ 3 hilos":"208Y/120 V 3Φ 4 hilos";
function brkCalc(b){const p=b.p,W=+p.W||0,I=p.poles===3?W/(208*Math.sqrt(3)):W/brkV(p),pct=p.In?I/p.In:0;
  const st=pct>1?"crit":pct>.8?"warn":"ok",sug=BRK_IN.find(x=>x*.8>=I&&x>=15)||null;
  const cs=[...Array(p.poles)].map((_,k)=>circ(b.side,b.slot+k)),ph=[...Array(p.poles)].map((_,k)=>phaseOf(b.slot+k));
  return{W,I,pct,st,sug,cs,ph,V:brkV(p)}}
function lcCalc(){const ph={};PH().forEach(k=>ph[k]=0);let W=0;const per={};
  for(const b of S.lc.items){const c=brkCalc(b);per[b.id]=c;W+=c.W;c.ph.forEach(k=>ph[k]+=c.W/b.p.poles)}
  const amps=Object.fromEntries(Object.entries(ph).map(([k,v])=>[k,v/120])),vals=Object.values(amps),mx=Math.max(...vals),mn=Math.min(...vals);
  return{per,W,amps,max:mx,imb:mx>0?(mx-mn)/mx*100:0}}
const cutText=(s,n)=>{s=String(s||"");return s.length>n?s.slice(0,n-1)+"…":s};
