
// ================= art: cached sprites for props and structures
const SS=2;
function mkCanvas(w,h){ const c=document.createElement('canvas'); c.width=Math.max(1,Math.ceil(w)); c.height=Math.max(1,Math.ceil(h)); return c; }
function blobCanopy(g,R,rng,pal,nClumps,speck){
  const clumps=[];
  for(let i=0;i<nClumps;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.55, r=R*(0.3+rng()*0.22); clumps.push([Math.cos(a)*d,Math.sin(a)*d,r]); }
  clumps.push([0,0,R*0.48]);
  g.fillStyle=pal[0];
  for(const [x,y,r] of clumps){ g.beginPath(); g.arc(x+1.5,y+1.5,r*1.04,0,TAU); g.fill(); }
  clumps.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
  for(const [x,y,r] of clumps){
    const gr=g.createRadialGradient(x-r*0.4,y-r*0.45,r*0.08,x,y,r*1.05);
    gr.addColorStop(0,pal[3]); gr.addColorStop(0.45,pal[2]); gr.addColorStop(1,pal[1]);
    g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
  }
  for(let i=0;i<speck;i++){
    const a=rng()*TAU, d=Math.sqrt(rng())*R*0.9, x=Math.cos(a)*d, y=Math.sin(a)*d, lit=(-x-y)/(R*1.4)+rng()*0.5-0.25;
    g.fillStyle=lit>0.15?pal[3]:lit<-0.25?pal[0]:pal[2]; g.globalAlpha=0.55;
    g.beginPath(); g.ellipse(x,y,1.2+rng()*1.6,0.9+rng()*1.2,rng()*TAU,0,TAU); g.fill();
  }
  g.globalAlpha=1;
  const rim=g.createRadialGradient(0,0,R*0.5,0,0,R*1.08); rim.addColorStop(0,'rgba(0,0,0,0)'); rim.addColorStop(1,'rgba(10,20,5,.35)');
  g.globalCompositeOperation='source-atop'; g.fillStyle=rim; g.fillRect(-R-8,-R-8,R*2+16,R*2+16); g.globalCompositeOperation='source-over';
}
function spriteOf(R,draw){ const pad=8, S=(R+pad)*2*SS, c=mkCanvas(S,S), g=c.getContext('2d'); g.scale(SS,SS); g.translate(R+pad,R+pad); draw(g); c.half=R+pad; return c; }
function mkOak(seed,birch){ const rng=mulberry32(seed), R=48; return spriteOf(R,g=>blobCanopy(g,R,rng,birch?['#2f4a1c','#4f7a2e','#79a646','#b4d27a']:['#18300f','#2f5a1d','#4d7f2c','#89b452'],9+Math.floor(rng()*5),260)); }
function mkPine(seed,snow){
  const rng=mulberry32(seed), R=40;
  return spriteOf(R,g=>{
    const layers=[[R,'#152a18','#2b4a2a'],[R*0.78,'#1b3520','#365c34'],[R*0.55,'#22422a','#44703f'],[R*0.32,'#2b5032','#5a8a4c']];
    for(const [r,dk,lt] of layers){
      const n=11+Math.floor(rng()*4), rot=rng()*TAU;
      const gr=g.createRadialGradient(-r*0.3,-r*0.3,r*0.1,0,0,r); gr.addColorStop(0,lt); gr.addColorStop(1,dk);
      g.fillStyle=gr; g.beginPath();
      for(let i=0;i<n*2;i++){ const a=rot+i/(n*2)*TAU, rr=i%2?r*0.68:r*(0.92+rng()*0.1); i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); }
      g.closePath(); g.fill();
    }
    g.fillStyle='#6a8a52'; g.beginPath(); g.arc(-1,-1,2.5,0,TAU); g.fill();
    if(snow){ g.globalCompositeOperation='source-atop'; for(let i=0;i<90;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R, x=Math.cos(a)*d, y=Math.sin(a)*d; if(x+y>R*0.5*rng()) continue; g.fillStyle=rng()<0.7?'rgba(240,245,250,.9)':'rgba(200,215,230,.8)'; g.beginPath(); g.ellipse(x,y,2+rng()*5,1.5+rng()*3,rng()*3,0,TAU); g.fill(); } g.globalCompositeOperation='source-over'; }
  });
}
function mkWillow(seed){
  const rng=mulberry32(seed), R=52;
  return spriteOf(R,g=>{
    blobCanopy(g,R*0.8,rng,['#1e2c14','#34481f','#52692d','#86a052'],8,160);
    g.lineCap='round';
    for(let i=0;i<70;i++){ const a=rng()*TAU, d0=R*(0.25+rng()*0.4), d1=d0+R*(0.2+rng()*0.3); g.strokeStyle=rng()<0.5?'rgba(110,140,60,.75)':'rgba(70,100,40,.75)'; g.lineWidth=1+rng(); g.beginPath(); g.moveTo(Math.cos(a)*d0,Math.sin(a)*d0); g.quadraticCurveTo(Math.cos(a+0.1)*(d0+d1)/2,Math.sin(a+0.1)*(d0+d1)/2+3,Math.cos(a)*d1,Math.sin(a)*d1+4); g.stroke(); }
  });
}
function mkReed(seed){
  const rng=mulberry32(seed), R=14;
  return spriteOf(R,g=>{ g.lineCap='round'; for(let i=0;i<9;i++){ const x=(rng()-0.5)*14, y=(rng()-0.5)*10, a=-Math.PI/2+(rng()-0.5)*0.9, L=8+rng()*8; g.strokeStyle=rng()<0.5?'#4e6a2a':'#6a7e34'; g.lineWidth=1.3; g.beginPath(); g.moveTo(x,y+4); g.lineTo(x+Math.cos(a)*L,y+4+Math.sin(a)*L); g.stroke(); if(rng()<0.45){ g.strokeStyle='#5a3a1e'; g.lineWidth=3; g.beginPath(); g.moveTo(x+Math.cos(a)*L*0.75,y+4+Math.sin(a)*L*0.75); g.lineTo(x+Math.cos(a)*L*0.98,y+4+Math.sin(a)*L*0.98); g.stroke(); } } });
}
function mkDead(seed,charred){
  const rng=mulberry32(seed), R=40;
  return spriteOf(R,g=>{
    g.lineCap='round';
    const col=charred?'#1c1614':'#5e544a', hi=charred?'#3a2a22':'#857868';
    const br=(x,y,a,len,w,d)=>{ if(d>4||len<4) return; const x2=x+Math.cos(a)*len, y2=y+Math.sin(a)*len; g.strokeStyle=col; g.lineWidth=w; g.beginPath(); g.moveTo(x,y); g.lineTo(x2,y2); g.stroke(); g.strokeStyle=hi; g.lineWidth=w*0.35; g.beginPath(); g.moveTo(x-0.5,y-0.5); g.lineTo(x2-0.5,y2-0.5); g.stroke(); const k=1+Math.floor(rng()*2); for(let i=0;i<=k;i++) br(x2,y2,a+(rng()-0.5)*1.4,len*(0.55+rng()*0.2),w*0.62,d+1); };
    const n=4+Math.floor(rng()*3); for(let i=0;i<n;i++) br(0,0,i/n*TAU+rng()*0.6,R*(0.42+rng()*0.2),6,0);
    g.fillStyle=col; g.beginPath(); g.arc(0,0,7,0,TAU); g.fill(); g.fillStyle=hi; g.beginPath(); g.arc(-1.5,-1.5,3.5,0,TAU); g.fill();
    if(charred){ g.fillStyle='rgba(255,110,40,.8)'; for(let i=0;i<5;i++){ g.beginPath(); g.arc((rng()-0.5)*30,(rng()-0.5)*30,1.2,0,TAU); g.fill(); } }
  });
}
function rockPoly(g,R,rng,cols,moss){
  const n=7+Math.floor(rng()*4), v=[];
  for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.3, m=0.75+rng()*0.3; v.push([Math.cos(a)*R*m,Math.sin(a)*R*m*0.85]); }
  const path=()=>{ g.beginPath(); v.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); };
  const gr=g.createLinearGradient(-R,-R,R,R); gr.addColorStop(0,cols[2]); gr.addColorStop(0.5,cols[1]); gr.addColorStop(1,cols[0]);
  path(); g.fillStyle=gr; g.fill(); g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=1.2; g.stroke();
  g.save(); path(); g.clip();
  g.fillStyle=cols[3]; g.globalAlpha=0.5; g.beginPath(); g.ellipse(-R*0.3,-R*0.35,R*0.45,R*0.25,-0.6,0,TAU); g.fill(); g.globalAlpha=1;
  g.strokeStyle='rgba(0,0,0,.28)'; g.lineWidth=1; for(let i=0;i<3;i++){ g.beginPath(); let x=(rng()-0.5)*R, y=(rng()-0.5)*R; g.moveTo(x,y); for(let k=0;k<3;k++){ x+=(rng()-0.5)*R*0.6; y+=(rng()-0.5)*R*0.6; g.lineTo(x,y); } g.stroke(); }
  if(moss){ g.fillStyle='rgba(90,130,50,.55)'; for(let i=0;i<8;i++){ g.beginPath(); g.arc(-R*0.2+(rng()-0.5)*R,-R*0.2+(rng()-0.5)*R*0.6,1.5+rng()*3,0,TAU); g.fill(); } }
  g.restore();
}
function mkRock(seed,kind){
  const rng=mulberry32(seed), R=kind==='crag'?28:18;
  const cols={grey:['#4a4743','#77726b','#a29b92','#c7c0b5'],snow:['#4a5058','#77808a','#a2acb6','#c7d0da'],moss:['#43473f','#6c6f63','#959486','#b9b6a6'],red:['#5a3324','#8d5a3e','#b98060','#d9a582'],obsid:['#08070a','#1c1820','#3a3440','#6a6078']}[kind==='crag'?'red':kind];
  return spriteOf(R,g=>{ rockPoly(g,R,rng,cols,kind==='moss'); if(kind==='snow'){ g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(244,247,250,.92)'; g.beginPath(); g.ellipse(-R*0.25,-R*0.35,R*0.75,R*0.45,-0.5,0,TAU); g.fill(); g.globalCompositeOperation='source-over'; } });
}
function mkSpike(seed){
  const rng=mulberry32(seed), R=20;
  return spriteOf(R,g=>{ const n=5+Math.floor(rng()*3); for(let i=0;i<n;i++){ const a=rng()*TAU, L=R*(0.6+rng()*0.4); g.save(); g.rotate(a); const gr=g.createLinearGradient(0,-4,0,4); gr.addColorStop(0,'#4a4058'); gr.addColorStop(0.5,'#14111a'); gr.addColorStop(1,'#000'); g.fillStyle=gr; g.beginPath(); g.moveTo(0,-4); g.lineTo(L,0); g.lineTo(0,4); g.closePath(); g.fill(); g.strokeStyle='rgba(160,140,200,.35)'; g.lineWidth=0.7; g.beginPath(); g.moveTo(1,-2.5); g.lineTo(L-2,0); g.stroke(); g.restore(); } g.fillStyle='#0c0a10'; g.beginPath(); g.arc(0,0,5,0,TAU); g.fill(); });
}
const BUSHPAL={dry:['#4a3a1c','#7a6232','#a08848','#c8b070'],frost:['#34423f','#56696a','#8aa0a2','#e2eaee'],mire:['#202c16','#36461f','#526234','#7c8c4c']};
function mkBush(seed,dry){ const rng=mulberry32(seed), R=15; return spriteOf(R,g=>{ blobCanopy(g,R,rng,BUSHPAL[dry]||(dry===true?BUSHPAL.dry:['#1c3412','#335a1f','#4f7d2e','#8ab456']),6,70); if(!dry&&rng()<0.4){ g.fillStyle='#b8323a'; for(let i=0;i<7;i++){ g.beginPath(); g.arc((rng()-0.5)*18,(rng()-0.5)*18,1.3,0,TAU); g.fill(); } } }); }
function mkStump(seed){ const rng=mulberry32(seed), R=12; return spriteOf(R,g=>{ const gr=g.createRadialGradient(-2,-2,1,0,0,R); gr.addColorStop(0,'#9a7a52'); gr.addColorStop(1,'#4a3422'); g.fillStyle=gr; g.beginPath(); g.arc(0,0,R*0.8,0,TAU); g.fill(); g.strokeStyle='rgba(60,40,20,.6)'; g.lineWidth=0.8; for(let r=2;r<R*0.8;r+=2.2){ g.beginPath(); g.arc(0,0,r,0,TAU); g.stroke(); } g.fillStyle='#2a1c12'; g.fillRect(-1,-R*0.8,2,R*0.5); if(rng()<0.5){ g.fillStyle='rgba(20,15,12,.6)'; g.beginPath(); g.arc(3,2,4,0,TAU); g.fill(); } }); }
function mkBones(seed){ const rng=mulberry32(seed), R=14; return spriteOf(R,g=>{ g.lineCap='round'; for(let i=0;i<4;i++){ const a=rng()*TAU, L=6+rng()*8, x=(rng()-0.5)*14, y=(rng()-0.5)*14; g.strokeStyle='#d9d0bd'; g.lineWidth=2.4; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); g.stroke(); } g.fillStyle='#e6dccb'; g.beginPath(); g.ellipse(2,1,4.5,3.5,0.3,0,TAU); g.fill(); g.fillStyle='#4a4038'; g.beginPath(); g.arc(1,0,1,0,TAU); g.arc(3.4,0.6,1,0,TAU); g.fill(); }); }
function mkHerb(seed){ const rng=mulberry32(seed), R=10; return spriteOf(R,g=>{ g.strokeStyle='#3e6a2a'; g.lineWidth=1.4; for(let i=0;i<7;i++){ const a=i/7*TAU+rng()*0.4; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(Math.cos(a)*4,Math.sin(a)*4,Math.cos(a)*8,Math.sin(a)*8); g.stroke(); } for(let i=0;i<5;i++){ const a=rng()*TAU, d=3+rng()*4; g.fillStyle=i%2?'#e9e2ff':'#b48cff'; g.beginPath(); g.arc(Math.cos(a)*d,Math.sin(a)*d,1.6,0,TAU); g.fill(); } }); }
function mkVent(){ return spriteOf(16,g=>{ const gr=g.createRadialGradient(0,0,2,0,0,15); gr.addColorStop(0,'#ff8a3a'); gr.addColorStop(0.25,'#5a1a0a'); gr.addColorStop(0.6,'#1a1210'); gr.addColorStop(1,'rgba(26,18,16,0)'); g.fillStyle=gr; g.beginPath(); g.arc(0,0,15,0,TAU); g.fill(); }); }
function mkShadow(){ const c=mkCanvas(64,64), g=c.getContext('2d'); const gr=g.createRadialGradient(32,32,4,32,32,32); gr.addColorStop(0,'rgba(0,0,0,.55)'); gr.addColorStop(0.6,'rgba(0,0,0,.3)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); return c; }
const SPR={};
function pick2(o,arr){ return arr[Math.abs(Math.floor(o.x*7+o.y*3))%arr.length]; }
function drawLily(l,t){
  if(l.taken) return;
  ctx.save(); ctx.translate(l.x,l.y);
  ctx.fillStyle='#3e6a32'; ctx.beginPath(); ctx.arc(0,0,11,0.3,TAU-0.2); ctx.lineTo(0,0); ctx.fill();
  ctx.fillStyle='#dcecff'; for(let i=0;i<6;i++){ const a=i/6*TAU+t*0.2; ctx.beginPath(); ctx.ellipse(Math.cos(a)*4,Math.sin(a)*4,4.5,2.2,a,0,TAU); ctx.fill(); }
  ctx.fillStyle='#ffe9a0'; ctx.beginPath(); ctx.arc(0,0,2.2,0,TAU); ctx.fill();
  ctx.globalCompositeOperation='lighter'; const gl=ctx.createRadialGradient(0,0,0,0,0,30); gl.addColorStop(0,`rgba(150,200,255,${0.4+0.2*Math.sin(t*2.4+l.x)})`); gl.addColorStop(1,'rgba(120,170,255,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,30,0,TAU); ctx.fill();
  ctx.restore();
}
function buildSprites(){
  if(LOOK.re&&rzBuildSprites()) return;
  if(LOOK.sb&&sbBuildSprites()) return;
  SPR.oak=[1,2,3,4,5].map(i=>mkOak(1000+i,false)); SPR.birch=[1,2,3].map(i=>mkOak(2000+i,true));
  SPR.pine=[1,2,3,4].map(i=>mkPine(3000+i)); SPR.dead=[1,2,3].map(i=>mkDead(4000+i,false)); SPR.char=[1,2].map(i=>mkDead(4500+i,true));
  SPR.rock=[1,2,3].map(i=>mkRock(5000+i,'grey')); SPR.mossrock=[1,2,3].map(i=>mkRock(5100+i,'moss')); SPR.crag=[1,2,3,4].map(i=>mkRock(5200+i,'crag')); SPR.obsid=[1,2,3].map(i=>mkRock(5300+i,'obsid'));
  SPR.spike=[1,2,3].map(i=>mkSpike(6000+i)); SPR.bush=[1,2,3,4].map(i=>mkBush(7000+i,false)); SPR.shrub=[1,2,3].map(i=>mkBush(7100+i,true));
  SPR.spine=[1,2,3,4].map(i=>mkPine(3100+i,true)); SPR.srock=[1,2,3].map(i=>mkRock(5400+i,'snow')); SPR.fshrub=[1,2,3].map(i=>mkBush(7200+i,'frost'));
  SPR.willow=[1,2,3].map(i=>mkWillow(3200+i)); SPR.reed=[1,2,3].map(i=>mkReed(8300+i)); SPR.mbush=[1,2,3].map(i=>mkBush(7300+i,'mire'));
  SPR.bigoak=mkOak(1777,false);
  SPR.stump=[1,2].map(i=>mkStump(8000+i)); SPR.bones=[1,2].map(i=>mkBones(8100+i)); SPR.herb=[mkHerb(8200)]; SPR.vent=[mkVent()];
  SPR.shadow=mkShadow();
}
function propSprite(p){
  const L=p.k==='rock'?(biomeInfo(p.x,p.y,{}).b===1?SPR.mossrock:SPR.rock):p.k==='dead'&&p.y<3000?SPR.char:SPR[p.k];
  if(!L) return SPR.bush[0];
  if(LOOK.re) rzNoTurn(p); else if(p.rz0!==undefined){ p.rot=p.rz0; p.rz0=undefined; }
  if(!p.sp) p.sp=L[p.v%L.length];
  return p.sp;
}
function drawSprite(sp,x,y,scale,rot){
  const h=sp.half*scale;
  if(rot){ ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.drawImage(sp,-h,-h,h*2,h*2); ctx.restore(); }
  else ctx.drawImage(sp,x-h,y-h,h*2,h*2);
}

// ================= structures
// Houses are drawn in a three-quarter view: the roof seen from above at an angle, plus the south wall (facade)
// with its door, windows and trimmings along the bottom edge of the collision rectangle. hzPlan(hs) decides
// everything from the house seed, houseSprite(hs) paints one cached canvas, hzNight() adds window glow per frame.
const SCACHE=new Map();
const HSC=2, HPX=16, HPT=46, HPB=10;
const hzS=c=>`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;
const hzSA=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const hzC=c=>typeof c==='string'?hexRGB(c):c;
function hzT(c,k){ c=hzC(c); return k>=0?mixRGB(c,[255,246,228],Math.min(1,k)):mixRGB(c,[18,12,10],Math.min(1,-k)); }
const hzTS=(c,k)=>hzS(hzT(c,k));
const hzJ=(c,rng,a)=>hzTS(c,(rng()-0.5)*a);
function hzPoly(g,p){ g.beginPath(); for(let i=0;i<p.length;i++) i?g.lineTo(p[i][0],p[i][1]):g.moveTo(p[i][0],p[i][1]); g.closePath(); }
function hzLG(g,x0,y0,x1,y1,st){ const gr=g.createLinearGradient(x0,y0,x1,y1); for(const s of st) gr.addColorStop(s[0],s[1]); return gr; }
function hzEl(g,x,y,rx,ry,col){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); }
const HZP={
  plaster:['#efe3c6','#ead9b2','#f3e9d6','#e7cfa6','#ecd9c8','#dfd6bd','#f0dcc0','#e9e0cc'],
  beam:['#4a3020','#5a3a24','#3e2a1c','#62442a'],
  plank:['#8a6a44','#7a5a3a','#977650','#6e5038','#866248'],
  stone:['#9c968c','#a39484','#8e8c86','#aaa294','#958a7c'],
  rough:['#7d6d5c','#6e6359','#88786a','#74685c'],
  brick:['#a4553c','#904a34','#b0644a','#9a5a42','#8a4232'],
  log:['#8a6038','#7a5432','#966c42','#80583a'],
  board:['#5d7fa6','#7c9c6c','#cfa54c','#bd6e5c','#4e8c8c','#9c6e8e','#e0d0a6','#6e8eb4','#d98a4a','#a8b86a'],
  shut:['#3e6a8a','#5e8a4a','#8a3a2e','#2e5a4a','#c08a3a','#5a4a7a','#7a5a3a','#2a4a6a','#a84a5a','#3e7a6e'],
  door:['#6a3e22','#8a5a32','#5a3020','#2e4a6a','#7a2e24','#3e5a3a','#4a3428','#6a4a6a','#2e6a6a'],
  thatch:['#c9a35a','#b8944e','#d2ad66','#ae8c4c','#c09a52'],
  slate:['#5c6470','#4c5462','#646e7c','#454c58','#58606e'],
  clay:['#b8583a','#a84c32','#c2683e','#9e4a34','#b65e44'],
  shingle:['#8a6a3a','#6e5a48','#7a5a3e','#8e4a34','#7a3a2a','#5e4a3a'],
  flower:['#e84a5a','#f0a0c0','#f4d040','#b070e0','#f4f0f0','#ff8a3a','#e070a0','#5a8ae8'],
  mat:['#8a2e2a','#3e6a3a','#6a4a2a','#2e4a6a','#8a6a2a'],
  curtain:['#f2ead8','#d84a4a','#e8c8a0','#9ab8d8','#e0b0c8','#d8d070'],
};
const HZICON={baker:'loaf',lamps:'lantern',inn:'salmon',guard:'shield',tailor:'hat',scholar:'star',mayor:'crown',cook:'bowl',miner:'pick',herbalist:'leaf',fiddler:'note',knitter:'yarn'};
const HZEW={biglamp:8,barrel:9,rainbarrel:9,crate:11,bench:19,firewood:17,pots:9,herbs:20,wheel:13,sacks:12,hay:17,cart:19,pickaxe:7,skis:7,jars:12,aboard:9,rack:14,toy:10,basket:10,planter:20,kettles:12,lamp:6};
// ---------- planning: everything about a house's look is decided here from its seed
function hzPlan(hs){
  if(hs.L) return hs.L;
  const rng=mulberry32(((hs.seed|0)^0x2c1b3c6d)>>>0), P=a=>a[Math.floor(rng()*a.length)], C=p=>rng()<p;
  const def=AREADEFS['h_'+hs.owner]||{}, st=hs.k==='forge'?'forge':hs.k==='library'?'library':(def.style||'home');
  const town=hs.town||(hs.k==='library'?'brindle':'village'), w=hs.w, h=hs.h, W=w/2, H=h/2, vert=!!hs.vert;
  const L={st,town,vert,w,h,W,H,burnt:!!hs.burnt,snow:!!hs.snow,name:def.name||'',panes:[],glows:[]};
  let wall,roof;
  switch(town){
    case 'brindle': wall=P(['board','board','board','brick','plaster','brick']); roof=P(['slate','clay','clay','slate','shingle']); break;
    case 'copper': wall=P(['rough','rough','plank']); roof=P(['slate','shingle','slate']); break;
    case 'lodge': wall='log'; roof='shingle'; break;
    case 'farm': wall=C(0.55)?'plank':'log'; roof='shingle'; break;
    case 'way': wall=P(['plaster','plank','stone']); roof=P(['shingle','thatch']); break;
    default: wall=P(['plaster','plaster','plaster','stone','stone','plank']); roof=C(0.62)?'thatch':'shingle';
  }
  const OV={ash:['plaster','thatch'],yara:['stone','thatch'],baker:['plaster','shingle'],lamps:['plank','shingle'],herbalist:['stone','thatch'],farmer:['plank','thatch'],
    inn:['plaster','clay'],guard:['stone','slate'],tailor:['board','slate'],scholar:['brick','slate'],mayor:['brick','slate'],miner:['rough','slate'],cook:['plank','shingle'],lodge:['log','shingle'],
    forge:['stone','shingle'],library:['ashlar','slate']};
  if(OV[st]) [wall,roof]=OV[st];
  if(st==='inn'&&town==='way'){ wall='plaster'; roof='shingle'; }
  if(st==='miner'&&rng()<0.5) wall='plank';
  L.wall=wall; L.roof=roof;
  L.wc=hzC(P(HZP[wall==='ashlar'?'stone':wall]));
  if(wall==='ashlar') L.wc=hzC('#cdbd98');
  if(town==='farm'&&wall==='plank') L.wc=hzC(P(['#8a2e22','#9a3a2a','#84382a']));
  if(st==='tailor') L.wc=hzC('#d9a04a');
  if(st==='inn'&&town==='brindle') L.wc=hzC('#f0e2c2');
  L.gable=(wall==='stone'||wall==='rough'||wall==='brick')&&C(0.45)?'plank':wall==='board'?'board':wall;
  L.gc=L.gable===wall?L.wc:hzC(P(HZP.plank));
  L.beam=hzC(P(HZP.beam));
  L.trim=hzC(town==='brindle'?P(['#f4eedf','#efe6d0','#fbf6ea']):town==='copper'?P(['#6a5a48','#8a7a64']):town==='lodge'||town==='farm'?P(['#5a3a24','#efe6d0']):wall==='plaster'?L.beam:P(['#efe6d0','#5a3a24','#d8ccb0','#4a3020']));
  const base=hzC(hs.roof||'#6e5a48');
  L.rc=roof==='thatch'?mixRGB(hzC(P(HZP.thatch)),base,0.1):roof==='slate'?mixRGB(hzC(P(HZP.slate)),base,0.15):roof==='clay'?hzC(P(HZP.clay)):(hs.roof==='#5c6470'?hzC(P(HZP.shingle)):base);
  if(st==='library'||st==='forge') L.rc=base;
  // storeys and roof shape
  L.two=vert?(town==='brindle'?C(0.7):C(0.14)):(h>=80&&(town==='brindle'?C(0.75):C(0.2)));
  if((st==='inn'||st==='mayor'||st==='lodge'||st==='scholar')&&(vert||h>=78)) L.two=true;
  if(st==='forge'||st==='library') L.two=false;
  L.F=st==='library'?64:st==='forge'?32:L.two?50:30;
  L.G=Math.round(w*0.3);
  L.hip=!vert&&(st==='mayor'||st==='guard'||st==='library'||(town==='brindle'&&C(0.35))||(town==='village'&&roof==='thatch'&&C(0.3))||(town==='copper'&&C(0.2)));
  L.cross=!vert&&st!=='forge'&&(st==='inn'||st==='lodge'||st==='library'||st==='mayor'||(w>=140&&C(0.7))||(town==='brindle'&&w>=118&&C(0.4)));
  L.gw=st==='library'?80:Math.min(Math.round(w*0.4),66); L.Gc=st==='library'?24:Math.round(L.gw*0.36);
  // door
  L.dw=st==='inn'||st==='library'?22:st==='mayor'?18:14+(C(0.3)?2:0);
  L.dh=Math.min(L.F-7,st==='library'?28:21+(C(0.4)?1:0));
  L.dkind=st==='guard'?'iron':st==='inn'||st==='library'?'double':st==='lodge'?'plank':town==='brindle'?P(['panel','panel','arch']):town==='lodge'||town==='copper'||town==='farm'?P(['plank','plank','dutch']):P(['plank','arch','dutch','plank','arch']);
  L.dcol=hzC(town==='brindle'?P(HZP.door):P(['#6a3e22','#8a5a32','#5a3020','#7a4a2a','#4a3428','#3e5a3a','#2e4a6a','#7a2e24']));
  if(st==='ash') L.dcol=hzC('#7a3a22');
  if(st==='guard') L.dcol=hzC('#4a3020');
  L.fan=town==='brindle'&&(L.dkind==='panel'||L.dkind==='double')&&L.F-L.dh>=14;
  L.hood=!L.fan&&st!=='inn'&&st!=='library'&&st!=='forge'&&C(0.34);
  L.jerk=vert&&(town==='village'||town==='way'||town==='farm')&&st!=='ash'&&C(0.38);
  L.mat=C(0.6)||st==='ash'?hzC(P(HZP.mat)):null;
  // windows
  L.shut=C(town==='village'?0.6:town==='brindle'?0.45:town==='lodge'||town==='farm'?0.55:town==='way'?0.5:0.25);
  L.scol=hzC(P(HZP.shut)); L.box=C(town==='village'?0.55:town==='brindle'?0.6:0.2)&&!L.snow; L.boxc=[P(HZP.flower),P(HZP.flower),P(HZP.flower)];
  L.cur=C(0.55)?hzC(P(HZP.curtain)):null; L.tall=town==='brindle'||st==='scholar'||st==='mayor';
  L.icon=HZICON[st]||null; if(st==='inn'&&/Kettle/.test(L.name)) L.icon='kettle';
  if(st==='miner'&&/Twins/.test(L.name)) L.icon='shovel';
  L.shop=st==='baker'||st==='tailor'||st==='lamps';
  L.signHang=!!L.icon&&!vert;
  // lantern beside the door (left when a hanging sign takes the right), then ground-floor and upper windows
  const wins=[], win=(x,y,ww,wh,kind,fl)=>{ const o={x,y,w:ww,h:wh,kind:kind||'sq',fl:fl||0,lit:C(0.85),cur:L.cur&&C(0.8)?L.cur:null,st:L.burnt?P(['board','board','broken','soot']):'ok'}; wins.push(o); return o; };
  const ww=L.tall?9:11, wh=L.tall?11:10, unit=ww+(L.shut?10:4), wy=H-9-wh, dg=L.dw/2+5, edge=W-5, rs0=L.signHang?dg+17:dg;
  let lside=st==='forge'||st==='library'||st==='yara'?0:(C(0.55)||town==='brindle')?(L.signHang?-1:(C(0.5)?-1:1)):0;
  if(lside<0&&edge-dg-7<ww+4&&edge-dg>=ww+4) lside=0;
  if(lside>0&&edge-rs0-7<ww+4&&edge-rs0>=ww+4) lside=0;
  L.lantern=lside!==0; L.lanternX=lside*(L.dw/2+6);
  const side=(x0,s,shopFirst)=>{ const sp=edge-x0; if(sp<=0) return;
    if(shopFirst&&sp>=26){ const sw=Math.min(24,sp-2); win(s*(x0+sp/2),H-21,sw,12,'shop'); return; }
    const n=Math.min(2,Math.floor(sp/(unit+2)));
    if(n>0){ for(let i=0;i<n;i++) win(s*(x0+sp*(i+0.5)/n),wy,ww,wh); }
    else if(sp>=ww+4) win(s*(x0+sp/2),wy,ww,wh).shut=false; };
  if(st!=='forge'&&st!=='library'){
    side(dg+(lside<0?7:0),-1,L.shop); side(rs0+(lside>0?7:0),1,false);
    if(L.two){
      const uy=H-L.F+8, uh=L.tall?10:9, ground=wins.slice();
      const ups=ground.length?ground.map(o=>o.x):[-W*0.5,W*0.5], sh=ground.length?ground.every(o=>o.shut!==false):false;
      for(const x of ups){ const o=win(x,uy,ww,uh,'sq',1); if(!sh) o.shut=false; }
      const inner=Math.min(...ups.map(x=>Math.abs(x)-ww/2-(!sh||!L.shut?1.9:6.6)));
      if(!L.fan&&!(L.cross&&!vert)&&inner>ww/2+(sh&&L.shut?7:3)){ const o=win(0,uy,ww,uh,'sq',1); if(!sh) o.shut=false; }
    }
  }
  L.wins=wins;
  // chimneys
  L.chims=[];
  if(st!=='library'){
    const n=st==='forge'||st==='baker'?1:C(0.88)?(w>=150&&C(0.5)?2:1):0, mat=town==='brindle'||st==='baker'||wall==='brick'?'brick':'stone';
    let sx=C(0.5)?-1:1;
    for(let i=0;i<n;i++,sx=-sx){ const big=st==='baker'||st==='forge'; L.chims.push({x:st==='forge'?-W*0.55:sx*W*(0.28+rng()*0.16),w:big?12:9,h:big?17:12+rng()*4,mat}); }
  }
  // dormers on long single-storey roofs
  L.dorm=[]; if(!vert&&!L.two&&!L.cross&&st!=='forge'&&C(0.4)) L.dorm=w>=118?[-W*0.45,W*0.45]:[(C(0.5)?-1:1)*W*0.3];
  // extras along the front wall
  const sets={village:['barrel','bench','firewood','rainbarrel','pots','herbs','wheel','crate','sacks','pots'],brindle:['pots','bench','crate','barrel','planter','planter'],copper:['crate','barrel','cart','pickaxe','firewood','crate'],lodge:['firewood','firewood','skis','crate','barrel'],way:['barrel','barrel','crate','bench','wheel'],farm:['hay','wheel','firewood','barrel','crate']};
  const own={baker:['sacks','barrel'],lamps:['jars','lamp'],herbalist:['herbs','pots'],inn:['aboard','barrel','bench'],guard:['rack','barrel'],farmer:['hay','wheel'],kid:['toy'],knitter:['basket','bench'],miner:['cart','pickaxe'],cook:['kettles','barrel'],lodge:['firewood','skis','firewood'],fiddler:['bench'],tailor:['planter'],scholar:['crate'],mayor:['planter','planter'],ash:['firewood','pots'],yara:['biglamp','bench','pots']};
  const want=(own[st]||[]).slice(); const pool=sets[town]||sets.village; const extra=st==='forge'||st==='library'?0:1+Math.floor(rng()*2.2);
  for(let i=0;i<extra;i++){ const k=P(pool); if(!want.includes(k)) want.push(k); }
  const occ=[[-L.dw/2-6,L.dw/2+6]]; if(L.signHang) occ.push([L.dw/2+2,L.dw/2+20]);
  L.extras=[];
  for(const k of want){
    const ew=HZEW[k]||10;
    if(k==='biglamp'){ const x=(L.lantern?-Math.sign(L.lanternX):1)*(L.dw/2+8); occ.push([x-ew/2-1,x+ew/2+1]); L.extras.push({k,x}); continue; }
    if(k==='rainbarrel'){ const x=(C(0.5)?-1:1)*(W-6); if(!occ.some(([a,b])=>x+ew/2>a&&x-ew/2<b)){ occ.push([x-ew/2-1,x+ew/2+1]); L.extras.push({k,x}); } continue; }
    for(let t=0;t<14;t++){ const s=C(0.5)?-1:1, room=W-L.dw/2-8-ew; if(room<0) break; const x=s*(L.dw/2+7+ew/2+rng()*room); if(occ.some(([a,b])=>x+ew/2>a&&x-ew/2<b)) continue; occ.push([x-ew/2-1,x+ew/2+1]); L.extras.push({k,x,v:rng()}); break; }
  }
  L.moss=(town==='village'||town==='way'||st==='yara'||st==='herbalist')&&roof!=='clay'&&(C(0.6)||st==='yara');
  L.lichen=roof==='slate'&&C(0.45);
  L.ivy=st==='yara'||st==='herbalist'||st==='library'||(town==='village'&&C(0.28))||(town==='brindle'&&C(0.15))?[(C(0.5)?-1:1)]:[];
  L.seed2=Math.floor(rng()*1e9);
  // house glow at night pushes the darkness back around the front wall
  if(!hs.lit&&st!=='forge'){ hs.lit=true; LIGHTS.push({x:hs.x,y:hs.y+H-L.F*0.5,r:st==='library'?150:Math.max(80,w*0.6),i:L.burnt?0.34:0.56,night:true,win:true}); }
  hzChimPos(hs,L);
  hs.facade=true; hs.L=L; return L;
}
// chimney world position for smoke (set before the sprite is ever drawn)
function hzChimPos(hs,L){
  const {W,H,F}=L, et=7, topY=-H-et, eaveY=H-F, ridgeY=topY+(eaveY-topY)*(L.hip?0.42:0.37);
  L.ridgeY=ridgeY; L.eaveY=eaveY; L.topY=topY;
  if(!L.chims.length){ hs.chim=null; return; }
  for(const c of L.chims){
    if(L.vert){ const yF=H-F, yA=yF-L.G, yE=yF+2, f=1-Math.abs(c.x)/(W+6), rake=yE-(yE-(yA-3))*f; c.base=Math.max(-H+8,Math.min(-H*0.15,rake-5)); }
    else{ c.base=ridgeY+5; if(L.hip){ const hi=Math.min(W*0.45,(eaveY-topY)*0.5); c.x=Math.sign(c.x)*Math.min(Math.abs(c.x),W+6-hi-c.w/2-1); } }
    if(L.st==='forge'){ c.base=ridgeY+8; c.h=22; }
  }
  const c=L.chims[0]; hs.chim=[hs.x+c.x,hs.y+c.base-c.h-3];
}
// ---------- textures
function hzRoofTex(g,mat,col,u0,u1,v0,v1,vs,rng){
  const sp=u1-u0, ht=v1-v0;
  if(mat==='thatch'){
    g.fillStyle=hzS(col); g.fillRect(u0,v0,sp,ht);
    const cols=[hzTS(col,0.24),hzTS(col,-0.2),hzTS(col,0.08)], paths=[[],[],[]], n=Math.floor(sp*ht/4.5);
    for(let i=0;i<n;i++) paths[Math.floor(rng()*3)].push(u0+rng()*sp,v0+rng()*ht,(2.4+rng()*3)*vs,(rng()-0.5)*0.9);
    g.lineWidth=0.7; g.lineCap='round';
    for(let k=0;k<3;k++){ const p=paths[k]; g.strokeStyle=cols[k]; g.beginPath(); for(let i=0;i<p.length;i+=4){ g.moveTo(p[i],p[i+1]); g.lineTo(p[i]+p[i+3],p[i+1]+p[i+2]); } g.stroke(); }
    const bh=7.5*vs;
    for(let v=v1-bh;v>v0-1;v-=bh){
      g.strokeStyle='rgba(70,42,14,.38)'; g.lineWidth=1.3; g.beginPath(); g.moveTo(u0,v); for(let u=u0;u<u1;u+=5) g.quadraticCurveTo(u+2.5,v+1.9*vs,u+5,v); g.stroke();
      g.strokeStyle=hzSA(hzT(col,0.4),0.4); g.lineWidth=0.8; g.beginPath(); g.moveTo(u0,v-1.3); for(let u=u0;u<u1;u+=5) g.quadraticCurveTo(u+2.5,v+0.6*vs-1.3,u+5,v-1.3); g.stroke();
    }
    return;
  }
  if(mat==='slate'){
    g.fillStyle=hzTS(col,-0.4); g.fillRect(u0,v0,sp,ht);
    const rh=3.9*vs; let row=0;
    for(let v=v1;v>v0-rh;v-=rh,row++){
      let u=u0-(row%2)*3.1-rng()*0.6;
      while(u<u1){ const sw=5.4+rng()*1.6; g.fillStyle=rng()<0.06?hzTS(col,0.18):hzJ(col,rng,0.16); g.fillRect(u+0.45,v-rh+0.35,sw-0.9,rh-0.7); g.fillStyle='rgba(255,255,255,.13)'; g.fillRect(u+0.45,v-rh+0.35,sw-0.9,0.55); u+=sw; }
    }
    return;
  }
  if(mat==='clay'){
    g.fillStyle=hzTS(col,-0.45); g.fillRect(u0,v0,sp,ht);
    const tw=4.6, rh=4.8*vs; let row=0;
    for(let v=v1;v>v0-rh;v-=rh,row++){
      const off=(row%2)*0.0;
      for(let u=u0-off;u<u1;u+=tw){
        const c=rng()<0.07?hzTS(col,-0.15):hzJ(col,rng,0.14);
        g.fillStyle=c; g.fillRect(u+0.3,v-rh,tw-0.6,rh);
        g.fillStyle='rgba(50,14,4,.35)'; g.beginPath(); g.arc(u+tw/2,v+0.7,tw/2-0.3,0,Math.PI); g.fill();
        g.fillStyle=c; g.beginPath(); g.arc(u+tw/2,v,tw/2-0.3,0,Math.PI); g.fill();
        g.fillStyle='rgba(255,226,190,.26)'; g.fillRect(u+0.9,v-rh,tw*0.32,rh+1);
        g.fillStyle='rgba(60,18,8,.28)'; g.fillRect(u+tw-1.3,v-rh,0.9,rh);
      }
    }
    return;
  }
  // wooden shingles
  g.fillStyle=hzTS(col,-0.32); g.fillRect(u0,v0,sp,ht);
  const rh=4.4*vs;
  for(let v=v1;v>v0-rh;v-=rh){
    let u=u0-rng()*6;
    while(u<u1){ const sw=3.4+rng()*4.6, r=rng(); g.fillStyle=r<0.05?hzTS(col,-0.3):r<0.1?hzTS(col,0.18):hzJ(col,rng,0.22); g.fillRect(u+0.35,v-rh,sw-0.7,rh-0.2); u+=sw; }
    g.fillStyle='rgba(0,0,0,.32)'; g.fillRect(u0,v-1,sp,1);
    g.fillStyle='rgba(255,240,210,.11)'; g.fillRect(u0,v-rh,sp,0.7);
  }
}
function hzWallTex(g,mat,col,x0,y0,x1,y1,rng){
  const w=x1-x0, h=y1-y0;
  switch(mat){
    case 'plaster':{
      g.fillStyle=hzS(col); g.fillRect(x0,y0,w,h);
      const n=Math.floor(w*h/70); for(let i=0;i<n;i++){ g.fillStyle=hzSA(hzT(col,rng()<0.5?0.18:-0.1),0.3); g.beginPath(); g.ellipse(x0+rng()*w,y0+rng()*h,0.8+rng()*3,0.5+rng()*1.4,0,0,TAU); g.fill(); }
      break; }
    case 'plank':{
      for(let y=y1;y>y0;y-=4){ g.fillStyle=hzJ(col,rng,0.16); g.fillRect(x0,y-4,w,4); g.fillStyle='rgba(30,16,6,.34)'; g.fillRect(x0,y-0.9,w,0.9); g.fillStyle='rgba(255,236,200,.12)'; g.fillRect(x0,y-4,w,0.6);
        g.fillStyle='rgba(30,16,6,.3)'; for(let x=x0+rng()*20;x<x1;x+=14+rng()*22) g.fillRect(x,y-4,0.7,3.2); }
      break; }
    case 'board':{
      g.fillStyle=hzS(col); g.fillRect(x0,y0,w,h);
      for(let x=x0;x<x1;x+=5){ g.fillStyle=hzSA(hzT(col,(rng()-0.5)*0.12),1); g.fillRect(x,y0,5,h); g.fillStyle=hzSA(hzT(col,0.25),0.9); g.fillRect(x+4,y0,1,h); g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x+5,y0,0.6,h); }
      for(let i=0;i<w*h/60;i++){ g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(x0+rng()*w,y0+rng()*h,0.6+rng(),0.5); }
      break; }
    case 'stone': case 'rough': case 'ashlar':{
      const ash=mat==='ashlar', rough=mat==='rough';
      g.fillStyle=hzTS(col,ash?-0.2:rough?-0.5:-0.38); g.fillRect(x0,y0,w,h);
      let y=y1;
      while(y>y0-1){
        const ch=ash?5.5:rough?5.5+rng()*3:3.8+rng()*2.2; let x=x0-rng()*(ash?10:6);
        while(x<x1){ const sw=ash?11+rng()*3:rough?7+rng()*8:4.5+rng()*6.5, c=hzT(col,(rng()-0.5)*(ash?0.12:0.32));
          if(!ash&&rng()<0.3){ c[0]+=(rng()-0.5)*20; c[2]+=(rng()-0.5)*14; }
          g.fillStyle=hzS(c); rrect(g,x+0.5,y-ch+0.5,sw-1,ch-1,ash?0.3:1.2); g.fill();
          g.fillStyle='rgba(255,250,235,.22)'; g.fillRect(x+1,y-ch+0.6,sw-2.2,0.7);
          g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x+1,y-1.2,sw-2,0.7);
          x+=sw; }
        y-=ch;
      }
      break; }
    case 'brick':{
      g.fillStyle=hzTS(col,0.42); g.fillRect(x0,y0,w,h);
      let row=0; for(let y=y1;y>y0-1;y-=3.2,row++){ for(let x=x0-(row%2)*3.2;x<x1;x+=6.4){ const r=rng(); g.fillStyle=r<0.08?hzTS(col,-0.28):r<0.14?hzTS(col,0.16):hzJ(col,rng,0.14); g.fillRect(x+0.35,y-2.85,5.7,2.5); } }
      break; }
    case 'log':{
      const lh=5.2;
      for(let y=y1;y>y0-1;y-=lh){
        const c=hzT(col,(rng()-0.5)*0.14);
        g.fillStyle=hzLG(g,0,y-lh,0,y,[[0,hzTS(c,0.22)],[0.45,hzS(c)],[1,hzTS(c,-0.38)]]); g.fillRect(x0,y-lh,w,lh);
        g.fillStyle='rgba(225,210,180,.55)'; g.fillRect(x0,y-0.7,w,0.7);
        g.strokeStyle='rgba(40,22,10,.25)'; g.lineWidth=0.5; g.beginPath(); for(let x=x0+rng()*10;x<x1;x+=6+rng()*12){ g.moveTo(x,y-lh+1.4); g.lineTo(x+3+rng()*4,y-lh+1.4+rng()); } g.stroke();
      }
      break; }
  }
}
// ---------- small pieces
function hzWin(g,L,o,rng){
  const {x,y,w,h}=o, x0=x-w/2, tr=L.trim, stone=L.wall==='stone'||L.wall==='rough'||L.wall==='brick'||L.wall==='ashlar';
  if(o.kind==='round'){
    g.fillStyle=hzTS(tr,-0.4); g.beginPath(); g.arc(x,y,w/2+1.8,0,TAU); g.fill(); g.fillStyle=hzS(tr); g.beginPath(); g.arc(x,y,w/2+1.2,0,TAU); g.fill();
    g.fillStyle='#24323f'; g.beginPath(); g.arc(x,y,w/2,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.25)'; g.beginPath(); g.arc(x-1,y-1,w/4,0,TAU); g.fill();
    g.fillStyle=hzS(tr); g.fillRect(x-0.5,y-w/2,1,w); g.fillRect(x-w/2,y-0.5,w,1);
    if(o.lit) L.panes.push([x-w/2+0.5,y-w/2+0.5,w/2-1,w/2-1],[x+0.5,y-w/2+0.5,w/2-1,w/2-1],[x-w/2+0.5,y+0.5,w/2-1,w/2-1],[x+0.5,y+0.5,w/2-1,w/2-1]);
    if(o.lit) L.glows.push([x,y,w*1.3]);
    return;
  }
  const y0=y;
  if(o.st==='board'){
    g.fillStyle='#1a1410'; g.fillRect(x0-1,y0-1,w+2,h+2);
    for(let i=0;i<3;i++){ const yy=y0-1+i*(h+2)/3+rng()*1.2; g.fillStyle=hzJ('#9a7a52',rng,0.25); g.save(); g.translate(x,yy+1.6); g.rotate((rng()-0.5)*0.3); g.fillRect(-w/2-2.5,-1.6,w+5,3.2); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(-w/2-2.5,1,w+5,0.6); g.fillStyle='#3a3a3a'; g.fillRect(-w/2-1.5,-0.5,0.8,0.8); g.fillRect(w/2+0.7,-0.5,0.8,0.8); g.restore(); }
    return;
  }
  if(o.kind==='shop'){
    // awning over a shop window
    g.fillStyle=hzTS(tr,-0.4); g.fillRect(x0-2,y0-2,w+4,h+3.5); g.fillStyle=hzS(tr); g.fillRect(x0-1.4,y0-1.4,w+2.8,h+2.6);
    g.fillStyle=hzLG(g,x0,y0,x0+w,y0+h,[[0,'#405a72'],[1,'#1c2836']]); g.fillRect(x0,y0,w,h);
    L.goods&&L.goods(g,x0,y0,w,h,rng);
    g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(x0+1,y0+h-2); g.lineTo(x0+w*0.4,y0+1); g.lineTo(x0+w*0.55,y0+1); g.lineTo(x0+2,y0+h); g.fill();
    g.fillStyle=hzS(tr); for(let i=1;i<3;i++) g.fillRect(x0+w*i/3-0.5,y0,1,h); g.fillRect(x0,y0+h*0.35,w,0.9);
    if(o.lit){ for(let i=0;i<3;i++) L.panes.push([x0+w*i/3+0.6,y0+0.4,w/3-1.2,h*0.35-0.8],[x0+w*i/3+0.6,y0+h*0.35+1,w/3-1.2,h*0.65-1.4]); L.glows.push([x,y0+h/2,w*0.9]); }
    g.fillStyle=hzTS(tr,0.15); g.fillRect(x0-2.5,y0+h+1.2,w+5,1.8); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x0-2.5,y0+h+3,w+5,0.8);
    const ac=L.awn||['#c8402e','#f2ead8'], ay=y0-5.5, aw=w+4, n=Math.max(4,Math.round(aw/4));
    g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(x0-1,y0,w+2,3);
    for(let i=0;i<n;i++){ const a=x0-2+aw*i/n, b=x0-2+aw*(i+1)/n, ka=(a-x)/(aw/2), kb=(b-x)/(aw/2); g.fillStyle=ac[i%2]; hzPoly(g,[[a,ay],[b,ay],[b+kb*1.8,ay+6.5],[a+ka*1.8,ay+6.5]]); g.fill(); }
    g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x0-2,ay,aw,1.2);
    for(let i=0;i<n;i++){ const a=x0-2+aw*i/n, b=x0-2+aw*(i+1)/n, ka=(a-x)/(aw/2), kb=(b-x)/(aw/2), ax=a+ka*1.8, bx=b+kb*1.8; g.fillStyle=ac[i%2]; g.beginPath(); g.arc((ax+bx)/2,ay+6.4,(bx-ax)/2,0,Math.PI); g.fill(); }
    g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x0-3.5,ay+5.8,aw+3,0.7);
    if(L.snow){ g.fillStyle='rgba(244,248,252,.95)'; rrect(g,x0-2.5,ay-1.6,aw+1,2.6,1.2); g.fill(); }
    return;
  }
  // shutters
  if(o.shut!==false&&L.shut){
    const sc=o.st==='ok'?L.scol:hzT(L.scol,-0.45);
    for(const s of [-1,1]){ const sx=s<0?x0-6.6:x0+w+1.8; g.fillStyle=hzTS(sc,-0.35); g.fillRect(sx-0.4,y0-1.4,5.6,h+2.8); g.fillStyle=hzS(sc); g.fillRect(sx,y0-1,4.8,h+2);
      g.fillStyle=hzSA(hzT(sc,-0.3),0.9); for(let yy=y0+0.8;yy<y0+h;yy+=2) g.fillRect(sx+0.6,yy,3.6,0.6);
      g.fillStyle=hzSA(hzT(sc,0.3),0.8); g.fillRect(sx,y0-1,0.7,h+2); }
  }
  if(stone){ g.fillStyle=hzTS(L.wall==='brick'?'#c8bca8':L.wc,0.2); g.fillRect(x0-2.6,y0-4,w+5.2,2.6); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x0-2.6,y0-1.4,w+5.2,0.6); }
  g.fillStyle=hzTS(tr,-0.42); g.fillRect(x0-1.9,y0-1.9,w+3.8,h+3.8);
  g.fillStyle=hzS(tr); g.fillRect(x0-1.3,y0-1.3,w+2.6,h+2.6);
  if(L.tall||o.arch){ g.fillStyle=hzS(tr); g.beginPath(); g.arc(x,y0,w/2+1.3,Math.PI,0); g.fill(); }
  const glass=o.st==='soot'?'#141414':'#22303e';
  g.fillStyle=hzLG(g,x0,y0,x0+w,y0+h,[[0,o.st==='soot'?'#2a2622':'#40586e'],[1,glass]]); g.fillRect(x0,y0,w,h);
  if(L.tall||o.arch){ g.beginPath(); g.arc(x,y0,w/2,Math.PI,0); g.fill(); }
  if(o.st==='broken'){
    g.fillStyle='#0a0808'; hzPoly(g,[[x0+w*0.2,y0+h*0.3],[x0+w*0.6,y0+h*0.1],[x0+w*0.9,y0+h*0.5],[x0+w*0.5,y0+h*0.8],[x0+w*0.3,y0+h*0.65]]); g.fill();
    g.strokeStyle='rgba(220,230,240,.6)'; g.lineWidth=0.5; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x0+w*0.3,y0+h*0.35); g.moveTo(x0+w,y0+h*0.2); g.lineTo(x0+w*0.75,y0+h*0.45); g.moveTo(x0+w*0.1,y0+h); g.lineTo(x0+w*0.35,y0+h*0.7); g.stroke();
  }else{
    if(o.cur&&o.st==='ok'){ // drapes tied back at each side under a little valance
      g.fillStyle=hzS(o.cur); hzPoly(g,[[x0,y0],[x0+w*0.32,y0],[x0+w*0.13,y0+h*0.58],[x0+w*0.22,y0+h],[x0,y0+h]]); g.fill(); hzPoly(g,[[x0+w,y0],[x0+w*0.68,y0],[x0+w*0.87,y0+h*0.58],[x0+w*0.78,y0+h],[x0+w,y0+h]]); g.fill();
      g.fillRect(x0,y0,w,h*0.17); g.fillStyle=hzTS(o.cur,-0.3); g.fillRect(x0,y0+h*0.55,w*0.17,0.8); g.fillRect(x0+w*0.83,y0+h*0.55,w*0.17,0.8); g.fillRect(x0,y0+h*0.17,w,0.5); }
    g.fillStyle='rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(x0+0.8,y0+h*0.55); g.lineTo(x0+w*0.55,y0+0.6); g.lineTo(x0+w*0.78,y0+0.6); g.lineTo(x0+0.8,y0+h*0.85); g.fill();
  }
  g.fillStyle=hzS(tr); g.fillRect(x-0.55,y0,1.1,h); g.fillRect(x0,y0+h*0.5-0.55,w,1.1);
  if(o.lit&&o.st==='ok'){ const hw=w/2-0.55, hh=h/2-0.55; L.panes.push([x0,y0,hw,hh],[x+0.55,y0,hw,hh],[x0,y0+h/2+0.55,hw,hh],[x+0.55,y0+h/2+0.55,hw,hh]); L.glows.push([x,y0+h/2,Math.max(w,h)*1.25]); }
  if(o.st==='soot'){ const gr=g.createRadialGradient(x,y0-2,1,x,y0-4,12); gr.addColorStop(0,'rgba(12,8,6,.75)'); gr.addColorStop(1,'rgba(12,8,6,0)'); g.fillStyle=gr; g.fillRect(x-12,y0-16,24,18); }
  // sill and flower box
  g.fillStyle=hzTS(tr,0.18); g.fillRect(x0-2.6,y0+h+1.3,w+5.2,1.9); g.fillStyle='rgba(0,0,0,.32)'; g.fillRect(x0-2.6,y0+h+3.2,w+5.2,0.8);
  if(L.snow){ g.fillStyle='rgba(246,249,252,.96)'; rrect(g,x0-2.8,y0+h+0.4,w+5.6,2,1); g.fill(); }
  if(L.box&&o.fl===0&&o.st!=='board'){
    const wil=o.st!=='ok';
    g.fillStyle=wil?'#4a3a1c':'#3e6a2a'; for(let i=0;i<7;i++) { g.beginPath(); g.arc(x0+0.5+i*w/6,y0+h+1.6-rng()*1.4,1.4+rng()*0.8,0,TAU); g.fill(); }
    if(!wil){ for(let i=0;i<6;i++){ g.fillStyle=L.boxc[i%3]; g.beginPath(); g.arc(x0+1+rng()*(w-2),y0+h+0.6-rng()*1.6,0.95,0,TAU); g.fill(); } }
    g.fillStyle='#6a4426'; g.fillRect(x0-1.6,y0+h+3.2,w+3.2,3.2); g.fillStyle='rgba(255,220,170,.22)'; g.fillRect(x0-1.6,y0+h+3.2,w+3.2,0.7); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x0-1.6,y0+h+5.8,w+3.2,0.6);
  }
}
function hzIcon(g,k,cx,cy){
  g.lineCap='round'; g.lineJoin='round';
  switch(k){
    case 'loaf': hzEl(g,cx,cy+0.6,5.2,3.3,'#8a5420'); hzEl(g,cx,cy,5,3,'#c8843a'); hzEl(g,cx-0.8,cy-1,3.4,1.4,'#e8b060'); g.strokeStyle='#7a4418'; g.lineWidth=0.8; g.beginPath(); for(const d of [-2.6,0,2.6]){ g.moveTo(cx+d-1,cy+1.4); g.lineTo(cx+d+1,cy-1.6); } g.stroke(); break;
    case 'lantern': g.fillStyle='#2a2220'; g.fillRect(cx-0.5,cy-5.5,1,1.5); g.fillRect(cx-3,cy-4.2,6,1.4); g.fillRect(cx-2.6,cy+3,5.2,1.4); g.fillStyle='#ffd25a'; g.fillRect(cx-2.4,cy-2.8,4.8,5.8); g.fillStyle='#fff3c0'; g.fillRect(cx-1,cy-1.8,2,3); g.fillStyle='#2a2220'; g.fillRect(cx-2.7,cy-2.8,0.7,5.8); g.fillRect(cx+2,cy-2.8,0.7,5.8); break;
    case 'salmon':{ g.fillStyle='#e8806a'; g.beginPath(); g.ellipse(cx-0.8,cy+0.6,4.6,2.4,0,0,TAU); g.fill(); g.beginPath(); g.moveTo(cx+3,cy+0.6); g.lineTo(cx+6,cy-1.6); g.lineTo(cx+6,cy+2.8); g.closePath(); g.fill(); g.fillStyle='#f6b8a0'; g.beginPath(); g.ellipse(cx-1.2,cy+1.4,3.2,0.9,0,0,TAU); g.fill(); g.strokeStyle='#5a2a20'; g.lineWidth=0.6; g.beginPath(); g.moveTo(cx-4.2,cy-0.1); g.lineTo(cx-3,cy-0.1); g.stroke();
      g.strokeStyle='#3a4a8a'; g.lineWidth=0.7; g.beginPath(); g.moveTo(cx+0.5,cy-4.6); g.lineTo(cx+2.2,cy-4.6); g.lineTo(cx+0.5,cy-2.9); g.lineTo(cx+2.2,cy-2.9); g.moveTo(cx+2.8,cy-5.8); g.lineTo(cx+3.9,cy-5.8); g.lineTo(cx+2.8,cy-4.7); g.lineTo(cx+3.9,cy-4.7); g.stroke(); break; }
    case 'mug': g.fillStyle='#b88a3a'; g.fillRect(cx-3,cy-2,5,6); g.strokeStyle='#b88a3a'; g.lineWidth=1.2; g.beginPath(); g.arc(cx+2.4,cy+1,1.8,-1.2,1.2); g.stroke(); hzEl(g,cx-0.5,cy-2.3,3.2,1.6,'#fbf6ea'); break;
    case 'shield': g.fillStyle='#d8b04a'; g.beginPath(); g.moveTo(cx-4.4,cy-4.4); g.lineTo(cx+4.4,cy-4.4); g.lineTo(cx+4.4,cy); g.quadraticCurveTo(cx+4.2,cy+3.6,cx,cy+5.4); g.quadraticCurveTo(cx-4.2,cy+3.6,cx-4.4,cy); g.closePath(); g.fill();
      g.fillStyle='#2e4a8a'; g.beginPath(); g.moveTo(cx-3.5,cy-3.6); g.lineTo(cx+3.5,cy-3.6); g.lineTo(cx+3.5,cy); g.quadraticCurveTo(cx+3.3,cy+3,cx,cy+4.4); g.quadraticCurveTo(cx-3.3,cy+3,cx-3.5,cy); g.closePath(); g.fill(); g.fillStyle='#f2ead8'; g.fillRect(cx-0.8,cy-3.6,1.6,7.6); g.fillRect(cx-3.5,cy-1.2,7,1.6); break;
    case 'hat': hzEl(g,cx,cy+2.8,6,1.6,'#3a2a5a'); g.fillStyle='#5a3a8a'; g.fillRect(cx-3.2,cy-3.6,6.4,6.4); hzEl(g,cx,cy-3.6,3.2,1,'#6a4a9a'); g.fillStyle='#e8b040'; g.fillRect(cx-3.2,cy+0.8,6.4,1.3); g.strokeStyle='#d84a4a'; g.lineWidth=1; g.beginPath(); g.moveTo(cx+2.6,cy+0.6); g.quadraticCurveTo(cx+6,cy-2,cx+5,cy-5.5); g.stroke(); break;
    case 'star':{ g.fillStyle='#f2c84a'; g.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, r=i%2?2.1:5; g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); } g.closePath(); g.fill(); g.strokeStyle='#8a6a1a'; g.lineWidth=0.5; g.stroke(); g.fillStyle='#fff6c8'; g.beginPath(); g.arc(cx-0.8,cy-0.8,0.9,0,TAU); g.fill(); break; }
    case 'crown': g.fillStyle='#e8b83a'; g.beginPath(); g.moveTo(cx-4.6,cy+3); g.lineTo(cx-4.6,cy-2.6); g.lineTo(cx-2.3,cy); g.lineTo(cx,cy-3.8); g.lineTo(cx+2.3,cy); g.lineTo(cx+4.6,cy-2.6); g.lineTo(cx+4.6,cy+3); g.closePath(); g.fill(); g.fillStyle='#c83a3a'; g.beginPath(); g.arc(cx,cy+1.3,0.9,0,TAU); g.fill(); g.fillStyle='#3a6ac8'; g.beginPath(); g.arc(cx-2.6,cy+1.5,0.7,0,TAU); g.arc(cx+2.6,cy+1.5,0.7,0,TAU); g.fill(); break;
    case 'bowl': g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=0.7; g.beginPath(); for(const d of [-1.6,0.4,2.4]){ g.moveTo(cx+d,cy-1); g.quadraticCurveTo(cx+d-1.3,cy-2.6,cx+d,cy-3.6); g.quadraticCurveTo(cx+d+1.2,cy-4.6,cx+d,cy-5.8); } g.stroke();
      g.fillStyle='#c8c0b0'; g.beginPath(); g.ellipse(cx,cy+0.5,4.8,3.6,0,0,Math.PI); g.fill(); hzEl(g,cx,cy+0.5,4.8,1.3,'#d0843a'); g.fillStyle='#8a8070'; g.fillRect(cx-1.8,cy+3.8,3.6,0.9); break;
    case 'kettle': g.strokeStyle='#2a2a30'; g.lineWidth=1; g.beginPath(); g.arc(cx,cy-0.6,2.8,Math.PI*1.05,Math.PI*1.95); g.stroke(); hzEl(g,cx,cy+1.6,4,3.2,'#3a3a42'); hzEl(g,cx-1.2,cy+0.6,1.6,1,'#7a7a88'); g.strokeStyle='#3a3a42'; g.lineWidth=1.3; g.beginPath(); g.moveTo(cx-3.4,cy+1.4); g.lineTo(cx-5.6,cy-0.8); g.stroke();
      g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.arc(cx-6,cy-2.2,1.2,0,TAU); g.arc(cx-5,cy-3.8,0.9,0,TAU); g.fill(); break;
    case 'pick': case 'shovel':{
      const pk=()=>{ g.strokeStyle='#9a6a32'; g.lineWidth=1.6; g.beginPath(); g.moveTo(cx-4.4,cy+4.8); g.lineTo(cx+2.6,cy-2.4); g.stroke(); g.strokeStyle='#454b54'; g.lineWidth=2.3; g.beginPath(); g.moveTo(cx-2.8,cy-5.4); g.quadraticCurveTo(cx+3.4,cy-4.6,cx+5.8,cy+1.6); g.stroke(); g.strokeStyle='#b8c0c8'; g.lineWidth=0.7; g.beginPath(); g.moveTo(cx-2.4,cy-5.8); g.quadraticCurveTo(cx+3.4,cy-5.2,cx+5.6,cy+0.6); g.stroke(); };
      if(k==='pick'){ pk(); break; }
      g.save(); g.translate(cx,cy); g.scale(-1,1); g.translate(-cx,-cy); pk(); g.restore();
      g.strokeStyle='#9a6a32'; g.lineWidth=1.4; g.beginPath(); g.moveTo(cx-4.2,cy-4.6); g.lineTo(cx+1.8,cy+1.6); g.moveTo(cx-5.6,cy-3.2); g.lineTo(cx-2.8,cy-6); g.stroke();
      g.fillStyle='#6a7078'; g.beginPath(); g.ellipse(cx+3.2,cy+3,2.4,3.4,-0.78,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx+2.6,cy+2.4,0.8,1.8,-0.78,0,TAU); g.fill(); break; }
    case 'leaf': g.fillStyle='#4e8a3a'; g.beginPath(); g.moveTo(cx-4,cy+3.4); g.quadraticCurveTo(cx-4,cy-3.6,cx+4.4,cy-4); g.quadraticCurveTo(cx+3.4,cy+3.2,cx-4,cy+3.4); g.fill(); g.strokeStyle='#bfe0a0'; g.lineWidth=0.6; g.beginPath(); g.moveTo(cx-3.4,cy+2.8); g.lineTo(cx+3,cy-3); g.stroke(); break;
    case 'note': g.fillStyle='#2a2240'; hzEl(g,cx-2.2,cy+3,1.9,1.4,'#2a2240'); hzEl(g,cx+2.4,cy+2,1.9,1.4,'#2a2240'); g.fillRect(cx-0.7,cy-3.8,0.9,6.8); g.fillRect(cx+3.9,cy-4.8,0.9,6.8); g.beginPath(); g.moveTo(cx-0.7,cy-3.8); g.lineTo(cx+4.8,cy-4.8); g.lineTo(cx+4.8,cy-3.2); g.lineTo(cx-0.7,cy-2.2); g.fill(); break;
    case 'yarn': hzEl(g,cx,cy+0.6,4,4,'#d86a8a'); g.strokeStyle='#f2a8c0'; g.lineWidth=0.6; g.beginPath(); g.arc(cx-1,cy,3,-1,1.4); g.moveTo(cx+2.6,cy-1.6); g.arc(cx+1,cy+1,3,-0.6,2.2); g.stroke(); g.strokeStyle='#c8a060'; g.lineWidth=0.8; g.beginPath(); g.moveTo(cx-5,cy-4.4); g.lineTo(cx+2,cy+3); g.moveTo(cx+5,cy-4.4); g.lineTo(cx-2,cy+3); g.stroke(); break;
  }
}
function hzSign(g,L,icon,x,y,board){
  if(board){
    g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-9.2,y-5.4,19.4,13.4);
    g.fillStyle='#5a3a22'; g.fillRect(x-9.7,y-6.6,19.4,13.2); g.fillStyle='#efe2c0'; g.fillRect(x-8.3,y-5.2,16.6,10.4); g.fillStyle='rgba(120,90,50,.25)'; g.fillRect(x-8.3,y+3.6,16.6,1.6);
    g.fillStyle='#2a2220'; for(const [a,b] of [[-8.9,-5.8],[8.1,-5.8],[-8.9,4.8],[8.1,4.8]]) g.fillRect(x+a,y+b,0.9,0.9);
    g.save(); g.translate(x,y); g.scale(1.18,1.18); hzIcon(g,icon,0,0); g.restore();
    if(L.snow){ g.fillStyle='rgba(246,249,252,.96)'; rrect(g,x-10,y-8,20,2.4,1.2); g.fill(); }
    return;
  }
  // iron bracket arm out from the wall with a board hanging from two little chains
  g.strokeStyle='#22201e'; g.lineWidth=1.1; g.lineCap='round'; g.beginPath(); g.moveTo(x,y); g.lineTo(x+17,y); g.moveTo(x,y+4.5); g.quadraticCurveTo(x+2,y+0.5,x+7,y); g.stroke();
  g.lineWidth=0.6; g.beginPath(); g.moveTo(x+4,y); g.lineTo(x+4,y+2.4); g.moveTo(x+14.6,y); g.lineTo(x+14.6,y+2.4); g.stroke();
  g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x+3,y+3.8,16.4,13.4);
  g.fillStyle='#5a3a22'; g.fillRect(x+1.2,y+2.4,16.4,13.4); g.fillStyle='#efe2c0'; g.fillRect(x+2.4,y+3.6,14,11);
  g.save(); g.translate(x+9.4,y+9.1); g.scale(1.12,1.12); hzIcon(g,icon,0,0); g.restore();
  if(L.snow){ g.fillStyle='rgba(246,249,252,.96)'; rrect(g,x+0.6,y+1.2,17.6,2.2,1.1); g.fill(); g.fillRect(x,y-1.4,17,1.4); }
}
function hzSconce(g,L,x,y,big,post){
  const s=big?1.5:1;
  if(!post){ g.strokeStyle='#22201e'; g.lineWidth=0.9; g.beginPath(); g.moveTo(x-Math.sign(x)*3*s,y+3*s); g.lineTo(x-Math.sign(x)*3*s,y-1*s); g.lineTo(x,y-1*s); g.stroke(); }
  g.fillStyle='#22201e'; g.fillRect(x-2.6*s,y-0.4*s,5.2*s,1.4*s); g.fillRect(x-2.2*s,y+6.4*s,4.4*s,1.2*s); g.beginPath(); g.moveTo(x-2.6*s,y-0.2*s); g.lineTo(x,y-2.6*s); g.lineTo(x+2.6*s,y-0.2*s); g.fill();
  g.fillStyle=big?'#ffd890':'#e8cf96'; g.fillRect(x-2*s,y+1*s,4*s,5.4*s); g.fillStyle='rgba(255,250,220,.7)'; g.fillRect(x-0.8*s,y+2*s,1.6*s,2.8*s);
  g.fillStyle='#22201e'; g.fillRect(x-2.3*s,y+1*s,0.7*s,5.4*s); g.fillRect(x+1.6*s,y+1*s,0.7*s,5.4*s);
  L.panes.push([x-2*s,y+1*s,4*s,5.4*s]); L.glows.push([x,y+3.6*s,big?18:11]);
  if(L.snow){ g.fillStyle='rgba(246,249,252,.95)'; g.fillRect(x-2.8*s,y-2.4*s,5.6*s,1.4*s); }
}
function hzDoor(g,L,rng){
  const {dw,dh,H}=L, x0=-dw/2, y0=H-dh, col=L.dcol, arch=L.dkind==='arch'||L.dkind==='double'&&L.st!=='inn';
  const stone=L.wall==='stone'||L.wall==='rough'||L.wall==='brick'||L.wall==='ashlar'||L.wall==='log';
  const sur=stone?hzT(L.wall==='brick'?'#b8ac98':L.wall==='log'?'#6a4a2a':L.wc,0.15):L.trim;
  const shape=(i)=>{ g.beginPath(); if(arch){ g.moveTo(x0-i,H); g.lineTo(x0-i,y0+dw/2); g.arc(0,y0+dw/2,dw/2+i,Math.PI,0); g.lineTo(-x0+i,H); } else { g.rect(x0-i,y0-i,dw+2*i,dh+i); } g.closePath(); };
  // fanlight above the door
  if(L.fan){ g.fillStyle=hzS(L.trim); g.beginPath(); g.arc(0,y0-1,dw/2+2,Math.PI,0); g.fill(); g.fillStyle='#22303e'; g.beginPath(); g.arc(0,y0-1,dw/2,Math.PI,0); g.fill(); g.strokeStyle=hzS(L.trim); g.lineWidth=0.7; g.beginPath(); for(let i=1;i<4;i++){ const a=Math.PI+i*Math.PI/4; g.moveTo(0,y0-1); g.lineTo(Math.cos(a)*dw/2,y0-1+Math.sin(a)*dw/2); } g.stroke(); L.panes.push([-dw/2+2,y0-dw/2+2,dw-4,dw/2-3]); }
  g.fillStyle=hzTS(sur,-0.45); shape(2.6); g.fill();
  g.fillStyle=hzS(sur); shape(2); g.fill();
  if(stone&&L.wall!=='log'){ g.fillStyle='rgba(0,0,0,.18)'; for(let yy=H-4;yy>y0;yy-=4.5){ g.fillRect(x0-2,yy,2,0.6); g.fillRect(-x0,yy-2,2,0.6); } }
  g.fillStyle=hzLG(g,x0,0,-x0,0,[[0,hzTS(col,0.14)],[1,hzTS(col,-0.22)]]); shape(0); g.fill();
  g.save(); shape(0); g.clip();
  g.fillStyle='rgba(0,0,0,.28)'; for(let x=x0+3.4;x<-x0;x+=3.4) g.fillRect(x,y0-dw,0.6,dh+dw);
  g.fillStyle='rgba(255,240,210,.1)'; for(let x=x0+0.6;x<-x0;x+=3.4) g.fillRect(x,y0-dw,0.6,dh+dw);
  if(L.dkind==='plank'||L.dkind==='arch'||L.dkind==='dutch'){ g.fillStyle=hzTS(col,-0.32); g.fillRect(x0,H-6,dw,1.6); g.fillRect(x0,y0+(arch?dw*0.6:4),dw,1.6); }
  if(L.dkind==='dutch'){ g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(x0,H-dh*0.52,dw,0.8); g.fillStyle=hzTS(col,0.2); g.fillRect(x0,H-dh*0.52-1.4,dw,1.3); }
  if(L.dkind==='iron'){ g.fillStyle='#2a2a2e'; for(const yy of [y0+3,y0+dh*0.5,H-4]) g.fillRect(x0,yy,dw,1.8); g.fillStyle='#8a8a94'; for(const yy of [y0+3.9,y0+dh*0.5+0.9,H-3.1]) for(let x=x0+1.5;x<-x0;x+=3) g.fillRect(x,yy-0.4,0.8,0.8); }
  if(L.dkind==='panel'){ g.fillStyle='rgba(0,0,0,.25)'; for(const [px,py] of [[x0+2,y0+2.5],[1,y0+2.5],[x0+2,y0+dh*0.52],[1,y0+dh*0.52]]) g.fillRect(px,py,dw/2-3,dh*0.4); g.fillStyle='rgba(255,255,255,.12)'; for(const [px,py] of [[x0+2,y0+2.5],[1,y0+2.5],[x0+2,y0+dh*0.52],[1,y0+dh*0.52]]) g.fillRect(px,py,dw/2-3,0.6); }
  if(L.dkind==='double'){ g.fillStyle='rgba(0,0,0,.5)'; g.fillRect(-0.5,y0-dw,1,dh+dw); g.fillStyle='#2a2a2e'; for(const yy of [y0+(arch?dw*0.55:4),H-6]) for(const s of [-1,1]) g.fillRect(s<0?x0:1.2,yy,dw/2-1.2,1.4); }
  g.restore();
  // hinges and handle
  if(L.dkind!=='iron'&&L.dkind!=='double'&&L.dkind!=='panel'){ g.fillStyle='#2a2422'; for(const yy of [y0+(arch?dw*0.6:4)+0.2,H-5.8]) g.fillRect(x0,yy,dw*0.45,1.2); }
  if(L.dkind==='double'){ g.fillStyle='#e0b04a'; g.beginPath(); g.arc(-2,H-dh*0.45,0.9,0,TAU); g.arc(2,H-dh*0.45,0.9,0,TAU); g.fill(); }
  else if(L.dkind==='iron'){ g.strokeStyle='#9a9aa4'; g.lineWidth=0.9; g.beginPath(); g.arc(dw/2-3.5,H-dh*0.46+1.4,1.6,0,TAU); g.stroke(); }
  else { g.fillStyle='#e0b04a'; g.beginPath(); g.arc(dw/2-2.6,H-dh*0.46,1,0,TAU); g.fill(); g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(dw/2-3.1,H-dh*0.46+1.6,1,1.4); }
  if(L.hood){ // a little shed roof over the door on two brackets
    const hw=dw/2+4.6, hy=y0-2.4, hc=L.roof==='thatch'||L.roof==='clay'?hzT(L.beam,0.15):hzT(L.rc,0.04);
    g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(-hw,hy,hw*2,2.4);
    g.fillStyle='#2e2420'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*(hw-0.8),hy); g.lineTo(s*(hw-0.8),hy+3.6); g.lineTo(s*(hw-3.4),hy); g.fill(); }
    g.fillStyle=hzS(hc); hzPoly(g,[[-hw+0.8,hy-4.8],[hw-0.8,hy-4.8],[hw+1.2,hy],[-hw-1.2,hy]]); g.fill();
    g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(-hw,hy-3.2,hw*2,0.6); g.fillRect(-hw-0.6,hy-1.6,hw*2+1.2,0.6); g.fillStyle=hzTS(hc,-0.4); g.fillRect(-hw-1.2,hy-0.6,hw*2+2.4,1);
    g.fillStyle='rgba(255,240,210,.2)'; g.fillRect(-hw+0.8,hy-4.8,hw*2-1.6,0.6);
    if(L.snow){ g.fillStyle='rgba(246,249,252,.97)'; rrect(g,-hw,hy-6,hw*2,2.6,1.2); g.fill(); }
  }
  if(L.st==='ash'){ // Ash sneezed on his own front door
    const gr=g.createRadialGradient(-1.5,H-2,0.5,-1.5,H-4,dh*0.6); gr.addColorStop(0,'rgba(14,8,4,.85)'); gr.addColorStop(0.55,'rgba(30,16,8,.45)'); gr.addColorStop(1,'rgba(30,16,8,0)'); g.fillStyle=gr; g.fillRect(x0-3,H-dh,dw+6,dh+4);
    g.fillStyle='rgba(255,120,40,.5)'; g.fillRect(-3.5,H-2.4,1,1); g.fillRect(1.6,H-3.6,0.8,0.8);
    // and a sneeze-shaped scorch burst on the wall beside it
    const sx=L.lantern&&L.lanternX>0?x0-4.2:-x0+4.2, sy=H-dh*0.42, sr=g.createRadialGradient(sx,sy,0,sx,sy,7); sr.addColorStop(0,'rgba(12,8,4,.8)'); sr.addColorStop(1,'rgba(12,8,4,0)'); g.fillStyle=sr; g.beginPath(); g.arc(sx,sy,7,0,TAU); g.fill();
    g.fillStyle='rgba(16,10,6,.75)'; for(let i=0;i<9;i++){ const a=i/9*TAU+0.3, r=3.4+((i*37)%5); g.beginPath(); g.moveTo(sx+Math.cos(a-0.3)*1.6,sy+Math.sin(a-0.3)*1.6); g.lineTo(sx+Math.cos(a)*r,sy+Math.sin(a)*r); g.lineTo(sx+Math.cos(a+0.3)*1.6,sy+Math.sin(a+0.3)*1.6); g.fill(); }
    g.fillStyle='rgba(255,150,60,.7)'; g.fillRect(sx-0.5,sy-0.5,1,1); g.fillRect(sx+2,sy+1.4,0.7,0.7);
  }
  // step and doormat
  g.fillStyle='#a49c8e'; g.fillRect(x0-3.6,H-0.6,dw+7.2,3); g.fillStyle='#6a645a'; g.fillRect(x0-3.6,H+2.4,dw+7.2,1.3); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x0-3.6,H-0.6,dw+7.2,0.6);
  if(L.mat){ g.fillStyle=hzS(L.mat); g.fillRect(x0+0.5,H+3.9,dw-1,2.8); g.fillStyle=hzSA(hzT(L.mat,0.35),0.8); g.fillRect(x0+0.5,H+4.9,dw-1,0.6); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x0+0.5,H+6.7,dw-1,0.5);
    if(L.st==='ash'){ g.fillStyle='rgba(20,10,4,.75)'; g.beginPath(); g.ellipse(x0+dw*0.7,H+5,3.4,1.8,0,0,TAU); g.fill(); } }
  if(L.snow){ g.fillStyle='rgba(246,249,252,.9)'; g.fillRect(x0-3.6,H-0.9,2,1.2); g.fillRect(-x0+1.6,H-0.9,2,1.2); }
}
function hzExtra(g,L,e,rng){
  const x=e.x, y=L.H+1.6, sn=L.snow;
  const cap=(cx,cy,rx)=>{ if(sn){ g.fillStyle='rgba(246,249,252,.97)'; g.beginPath(); g.ellipse(cx,cy,rx,1.5,0,0,TAU); g.fill(); } };
  switch(e.k){
    case 'barrel': case 'rainbarrel':{
      if(e.k==='rainbarrel'){ const px=x+Math.sign(x)*-0.5; g.fillStyle='#5a5e66'; g.fillRect(px-0.9,L.eaveY+1,1.8,(y-11)-(L.eaveY+1)+1); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(px-0.9,L.eaveY+1,0.6,(y-11)-(L.eaveY+1)); }
      g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-4.6,y-1,10,2.4);
      g.fillStyle=hzLG(g,x-4.4,0,x+4.4,0,[[0,'#a87a46'],[0.45,'#8a5e32'],[1,'#4e3218']]); rrect(g,x-4.4,y-11,8.8,11,2.4); g.fill();
      g.fillStyle='rgba(0,0,0,.25)'; for(const d of [-2,0.4,2.6]) g.fillRect(x+d,y-10.5,0.5,10);
      g.fillStyle='#2e2a28'; g.fillRect(x-4.5,y-8.8,9,1.1); g.fillRect(x-4.5,y-3.2,9,1.1);
      hzEl(g,x,y-11,4.2,1.5,e.k==='rainbarrel'?'#2e4656':'#7a5430'); if(e.k==='rainbarrel'){ hzEl(g,x-1,y-11.3,2,0.6,'rgba(200,220,240,.5)'); }
      cap(x,y-11.4,4.4); break; }
    case 'crate':{ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-5,y-1,11.5,2.4); g.fillStyle='#8a6a40'; g.fillRect(x-5.5,y-9,11,9); g.fillStyle='#b08a56'; g.fillRect(x-5.5,y-11.5,11,2.5);
      g.strokeStyle='#5a4024'; g.lineWidth=0.9; g.strokeRect(x-5,y-8.5,10,8); g.beginPath(); g.moveTo(x-5,y-8.5); g.lineTo(x+5,y-0.5); g.stroke(); cap(x,y-11.4,5.6); break; }
    case 'bench':{ g.fillStyle='#6a4a2a'; g.fillRect(x-9,y-10.5,18,2.2); g.fillRect(x-9,y-7.6,18,1.4); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x-9,y-1,18,1.8);
      g.fillStyle='#4a321c'; g.fillRect(x-8,y-4.4,1.6,4.4); g.fillRect(x+6.4,y-4.4,1.6,4.4); g.fillStyle='#a07a4a'; g.fillRect(x-9.5,y-6.2,19,2.4); g.fillStyle='#6a4a2a'; g.fillRect(x-9.5,y-3.8,19,1.1); cap(x,y-6.4,9.4); break; }
    case 'firewood':{ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-8.5,y-1,17,2.2);
      for(let r=0;r<3;r++){ const n=5-r; for(let i=0;i<n;i++){ const cx=x-(n-1)*1.95+i*3.9, cy=y-2-r*3.3; g.fillStyle='#4a3018'; g.beginPath(); g.arc(cx,cy,2.05,0,TAU); g.fill(); g.fillStyle=hzJ('#c49a64',rng,0.2); g.beginPath(); g.arc(cx,cy,1.5,0,TAU); g.fill(); g.strokeStyle='rgba(90,60,30,.6)'; g.lineWidth=0.4; g.beginPath(); g.arc(cx,cy,0.8,0,TAU); g.stroke(); } }
      cap(x,y-11.4,6); break; }
    case 'pots':{ const n=1+Math.floor((e.v||0.5)*3); for(let i=0;i<n;i++){ const px=x-(n-1)*2.6+i*5.2, s=i%2?0.8:1;
        g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(px-2.4,y-0.8,5.4,1.6);
        g.fillStyle='#3e6a2a'; g.beginPath(); g.arc(px,y-6*s,2.8*s,0,TAU); g.arc(px-1.6,y-5*s,2*s,0,TAU); g.arc(px+1.6,y-5.2*s,2*s,0,TAU); g.fill(); g.fillStyle='#5e8a3e'; g.beginPath(); g.arc(px-0.8,y-6.6*s,1.4*s,0,TAU); g.fill();
        if(!sn&&!L.burnt){ g.fillStyle=HZP.flower[(i+Math.floor((e.v||0)*7))%HZP.flower.length]; for(let k=0;k<3;k++){ g.beginPath(); g.arc(px+(k-1)*1.6,y-6.5*s-(k%2)*1.4,0.8,0,TAU); g.fill(); } }
        g.fillStyle='#b8643a'; hzPoly(g,[[px-2.2,y],[px+2.2,y],[px+2.8,y-3.8*s],[px-2.8,y-3.8*s]]); g.fill(); g.fillStyle='#d07a4a'; g.fillRect(px-3,y-4.4*s,6,1.2); }
      if(sn) cap(x,y-8,5); break; }
    case 'planter':{ g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(x-9.6,y-0.8,20,1.8); g.fillStyle='#3e6a2a'; for(let i=0;i<8;i++){ g.beginPath(); g.arc(x-8+i*2.3,y-5.4-rng()*1.6,1.8,0,TAU); g.fill(); }
      if(!sn) for(let i=0;i<7;i++){ g.fillStyle=pick2({x:i,y:x|0},HZP.flower); g.beginPath(); g.arc(x-8+rng()*16,y-6.4-rng()*1.6,0.9,0,TAU); g.fill(); }
      g.fillStyle='#7a5a3a'; g.fillRect(x-10,y-4.6,20,4.6); g.fillStyle='rgba(255,230,190,.2)'; g.fillRect(x-10,y-4.6,20,0.7); cap(x,y-6,9.6); break; }
    case 'herbs':{ g.fillStyle='#5a3e22'; g.fillRect(x-10,y-1.5,20,2); g.fillStyle='#3e6a2a'; for(let i=0;i<9;i++){ g.beginPath(); g.arc(x-8.6+i*2.15,y-4.6-rng()*1.8,1.6+rng()*0.5,0,TAU); g.fill(); } g.fillStyle='#6a9a4a'; for(let i=0;i<6;i++){ g.beginPath(); g.arc(x-8+rng()*16,y-5.6-rng()*1.4,0.8,0,TAU); g.fill(); }
      if(!sn){ g.fillStyle='#b48cff'; for(let i=0;i<4;i++){ g.beginPath(); g.arc(x-7+rng()*14,y-6-rng(),0.8,0,TAU); g.fill(); } }
      g.fillStyle='#d8c8a8'; for(let i=0;i<6;i++){ const px=x-9.6+i*3.84; g.fillRect(px,y-5.2,1.2,5.6); g.beginPath(); g.moveTo(px,y-5.2); g.lineTo(px+0.6,y-6.2); g.lineTo(px+1.2,y-5.2); g.fill(); } g.fillRect(x-10,y-3.8,20,0.9); g.fillRect(x-10,y-1.6,20,0.9);
      cap(x,y-5,9); break; }
    case 'wheel':{ g.strokeStyle='#4a321c'; g.lineWidth=1.6; g.beginPath(); g.ellipse(x,y-6.2,5.6,6.2,0,0,TAU); g.stroke(); g.lineWidth=0.8; g.beginPath(); for(let i=0;i<6;i++){ const a=i/6*TAU+0.3; g.moveTo(x,y-6.2); g.lineTo(x+Math.cos(a)*5.3,y-6.2+Math.sin(a)*5.9); } g.stroke(); g.fillStyle='#2a2a2e'; g.beginPath(); g.arc(x,y-6.2,1.3,0,TAU); g.fill(); g.strokeStyle='rgba(255,230,190,.25)'; g.lineWidth=0.5; g.beginPath(); g.ellipse(x,y-6.2,5.6,6.2,0,Math.PI,Math.PI*1.6); g.stroke(); break; }
    case 'sacks':{ for(let i=0;i<2;i++){ const px=x-3+i*6; g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(px-3.4,y-0.8,7,1.6); g.fillStyle=i?'#c8b890':'#d8c8a0'; g.beginPath(); g.moveTo(px-3.4,y); g.quadraticCurveTo(px-4,y-5,px-1.4,y-7.4); g.lineTo(px+1.4,y-7.4); g.quadraticCurveTo(px+4,y-5,px+3.4,y); g.closePath(); g.fill(); g.fillStyle='#8a7a5a'; g.fillRect(px-1.6,y-7.8,3.2,1.2); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(px-2.4,y-5,1,3); } cap(x,y-7,5); break; }
    case 'hay':{ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-8,y-1,17,2.2); g.fillStyle='#c8a850'; g.fillRect(x-8.5,y-7,17,7); g.fillStyle='#e0c470'; g.fillRect(x-8.5,y-9.5,17,2.5);
      g.strokeStyle='rgba(120,90,30,.5)'; g.lineWidth=0.5; g.beginPath(); for(let i=0;i<14;i++){ const px=x-8+rng()*16; g.moveTo(px,y-6.6); g.lineTo(px+rng()-0.5,y-0.4); } g.stroke(); g.fillStyle='#7a5a2a'; g.fillRect(x-4,y-9.5,0.9,9.5); g.fillRect(x+3.6,y-9.5,0.9,9.5); cap(x,y-9.6,8.6); break; }
    case 'cart':{ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-9,y-1,19,2.2); g.fillStyle='#5a5a62'; hzPoly(g,[[x-9.5,y-10],[x+9.5,y-10],[x+8,y-3],[x-8,y-3]]); g.fill(); g.fillStyle='#3a3a40'; g.fillRect(x-9.5,y-10,19,1.4);
      g.fillStyle='#7a7a86'; for(let i=0;i<6;i++){ g.beginPath(); g.arc(x-6+i*2.4,y-10.6-rng()*1.6,1.7,0,TAU); g.fill(); } g.fillStyle='#5aa0f0'; g.beginPath(); g.arc(x+1,y-11.6,1.1,0,TAU); g.fill(); g.fillStyle='#c8a050'; g.beginPath(); g.arc(x-3,y-11,0.9,0,TAU); g.fill();
      g.fillStyle='#22201e'; g.beginPath(); g.arc(x-5,y-2,2.2,0,TAU); g.arc(x+5,y-2,2.2,0,TAU); g.fill(); g.fillStyle='#8a8a94'; g.beginPath(); g.arc(x-5,y-2,0.7,0,TAU); g.arc(x+5,y-2,0.7,0,TAU); g.fill(); cap(x,y-11.4,8); break; }
    case 'pickaxe':{ g.strokeStyle='#8a5a2a'; g.lineWidth=1.3; g.beginPath(); g.moveTo(x-1.5,y); g.lineTo(x+1.5,y-13); g.stroke(); g.strokeStyle='#7a8088'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x-3.8,y-11.2); g.quadraticCurveTo(x+1.5,y-15.2,x+6,y-11); g.stroke(); break; }
    case 'skis':{ for(const [dx,c] of [[-1.6,'#b84a3a'],[1.6,'#3a6aa8']]){ g.strokeStyle=c; g.lineWidth=1.6; g.beginPath(); g.moveTo(x+dx-1.4,y); g.lineTo(x+dx+1,y-16); g.quadraticCurveTo(x+dx+1.6,y-18,x+dx+3,y-17.6); g.stroke(); } g.strokeStyle='#5a3a22'; g.lineWidth=0.9; g.beginPath(); g.moveTo(x+4.8,y); g.lineTo(x+5.6,y-14); g.stroke(); break; }
    case 'jars':{ for(let i=0;i<3;i++){ const px=x-4+i*4, s=i===1?1.1:0.9; g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(px-2.4,y-0.8,5,1.5); g.fillStyle=i===1?'#c89a5a':'#b8784a'; g.beginPath(); g.ellipse(px,y-3.6*s,2.6*s,3.4*s,0,0,TAU); g.fill(); g.fillRect(px-1*s,y-8.4*s,2*s,2); g.fillStyle='rgba(255,240,210,.3)'; g.fillRect(px-1.6*s,y-5.6*s,0.8,3); g.fillStyle='#5a3a22'; g.fillRect(px-1.3*s,y-9*s,2.6*s,1); } cap(x,y-9,5); break; }
    case 'aboard':{ g.strokeStyle='#5a3a22'; g.lineWidth=1; g.beginPath(); g.moveTo(x-4,y); g.lineTo(x-2.6,y-11); g.lineTo(x+2.6,y-11); g.lineTo(x+4,y); g.stroke(); g.fillStyle='#22282a'; g.fillRect(x-3.4,y-10,6.8,7.6); g.strokeStyle='rgba(240,240,230,.85)'; g.lineWidth=0.5; g.beginPath(); g.moveTo(x-2.4,y-8.4); g.lineTo(x+2,y-8.4); g.moveTo(x-2.4,y-6.6); g.lineTo(x+1,y-6.6); g.moveTo(x-2.4,y-4.8); g.lineTo(x+2.2,y-4.8); g.stroke(); g.fillStyle='#e8b04a'; g.beginPath(); g.arc(x+1.8,y-6.5,0.8,0,TAU); g.fill(); break; }
    case 'rack':{ g.fillStyle='#5a3a22'; g.fillRect(x-7,y-7,14,1.4); g.fillRect(x-6.5,y-7,1.2,7); g.fillRect(x+5.3,y-7,1.2,7); for(let i=0;i<4;i++){ const px=x-4.5+i*3; g.strokeStyle='#7a5a3a'; g.lineWidth=0.8; g.beginPath(); g.moveTo(px,y); g.lineTo(px+0.6,y-15); g.stroke(); g.fillStyle='#c8ccd8'; g.beginPath(); g.moveTo(px-0.5,y-15); g.lineTo(px+0.6,y-18.5); g.lineTo(px+1.7,y-15); g.fill(); } break; }
    case 'toy':{ g.fillStyle='#d83a3a'; g.beginPath(); g.arc(x-2.6,y-2.4,2.4,0,TAU); g.fill(); g.fillStyle='#f2ead8'; g.fillRect(x-4.8,y-2.8,4.4,0.8); g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.arc(x-3.4,y-3.4,0.7,0,TAU); g.fill();
      g.strokeStyle='#a07a4a'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x+2.4,y); g.lineTo(x+4,y-9); g.stroke(); g.strokeStyle='#6a4a2a'; g.lineWidth=1; g.beginPath(); g.moveTo(x+1.6,y-2.6); g.lineTo(x+4.6,y-2); g.stroke(); break; }
    case 'basket':{ g.fillStyle='#d86a8a'; g.beginPath(); g.arc(x-2,y-5,2,0,TAU); g.fill(); g.fillStyle='#6a9ad8'; g.beginPath(); g.arc(x+1.6,y-5.4,2,0,TAU); g.fill(); g.fillStyle='#e8c84a'; g.beginPath(); g.arc(x,y-6.6,1.6,0,TAU); g.fill();
      g.fillStyle='#a0763e'; g.beginPath(); g.moveTo(x-4.8,y-4.6); g.lineTo(x+4.8,y-4.6); g.lineTo(x+3.8,y); g.lineTo(x-3.8,y); g.closePath(); g.fill(); g.strokeStyle='rgba(70,45,20,.6)'; g.lineWidth=0.4; g.beginPath(); for(let i=0;i<4;i++){ g.moveTo(x-4.6,y-3.6+i*1); g.lineTo(x+4.6,y-3.6+i*1); } g.stroke(); g.strokeStyle='#c8a060'; g.lineWidth=0.6; g.beginPath(); g.moveTo(x-1,y-8.4); g.lineTo(x+2.4,y-4); g.stroke(); break; }
    case 'kettles':{ for(let i=0;i<2;i++){ const px=x-3+i*6, s=i?0.8:1; g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(px-3,y-0.8,6,1.5); hzEl(g,px,y-3*s,3.4*s,3*s,'#2e2e34'); hzEl(g,px,y-5.6*s,3*s,0.9,'#4a4a52'); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(px-2.2*s,y-4.6*s,1,2); } cap(x,y-6,5); break; }
    case 'lamp':{ g.fillStyle='#2a2422'; g.fillRect(x-0.6,y-13,1.2,13); g.fillRect(x-2,y-1,4,1); hzSconce(g,L,x+0.01,y-18,false); break; }
    case 'biglamp':{ // Elder Yara's great lantern on its iron post
      g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x-2.4,y-1,6,2.2); g.fillStyle='#2a2422'; g.fillRect(x-0.9,y-19,1.8,19); g.fillRect(x-2.6,y-1.6,5.2,1.6); g.fillRect(x-3.4,y-19.6,6.8,1.2);
      g.strokeStyle='#2a2422'; g.lineWidth=0.7; g.beginPath(); g.moveTo(x-3,y-19); g.quadraticCurveTo(x-4.6,y-23,x-1.6,y-24.4); g.moveTo(x+3,y-19); g.quadraticCurveTo(x+4.6,y-23,x+1.6,y-24.4); g.stroke();
      hzSconce(g,L,x,y-30.4,true,true); g.fillStyle='#c8401e'; g.beginPath(); g.moveTo(x-1.4,y-19); g.lineTo(x,y-15.4); g.lineTo(x+1.4,y-19); g.fill(); break; }
  }
}
function hzIvy(g,x,yb,ht,rng){
  g.strokeStyle='rgba(70,60,30,.7)'; g.lineWidth=0.6; g.beginPath(); for(let i=0;i<4;i++){ let px=x+(rng()-0.5)*3, py=yb; g.moveTo(px,py); for(let k=0;k<5;k++){ px+=(rng()-0.5)*5; py-=ht/5; g.lineTo(px,py); } } g.stroke();
  const n=Math.floor(ht*2.2);
  for(let i=0;i<n;i++){ const f=Math.pow(rng(),0.75), py=yb-f*ht, px=x+(rng()-0.5)*(5+f*9); g.fillStyle=rng()<0.3?'#5e8a3a':rng()<0.6?'#3e6a2a':'#2e5220'; g.beginPath(); g.ellipse(px,py,1.6,1.2,rng()*3,0,TAU); g.fill(); }
}
function hzMoss(g,cx,cy,rx,ry,rng,lichen){
  const n=6+Math.floor(rng()*8);
  for(let i=0;i<n;i++){ const a=rng()*TAU, d=Math.sqrt(rng()); g.fillStyle=lichen?(rng()<0.5?'rgba(200,200,120,.45)':'rgba(150,170,110,.45)'):(rng()<0.5?'rgba(80,120,40,.55)':'rgba(110,150,60,.5)'); g.beginPath(); g.arc(cx+Math.cos(a)*d*rx,cy+Math.sin(a)*d*ry,0.9+rng()*2,0,TAU); g.fill(); }
}
function hzChimney(g,L,c,rng){
  const x0=c.x-c.w/2, top=c.base-c.h, brick=c.mat==='brick';
  g.fillStyle='rgba(0,0,0,.3)'; hzPoly(g,[[x0+c.w,c.base],[x0+c.w+5,c.base+2],[x0+c.w+5,top+5],[x0+c.w,top]]); g.fill();
  g.save(); g.beginPath(); g.rect(x0,top,c.w,c.h); g.clip(); hzWallTex(g,brick?'brick':'stone',brick?'#9a4a34':'#8e8a84',x0,top,x0+c.w,c.base,rng); g.restore();
  g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(x0+c.w-2,top,2,c.h);
  g.fillStyle=hzLG(g,0,top,0,top+c.h*0.6,[[0,'rgba(16,12,10,.7)'],[1,'rgba(16,12,10,0)']]); g.fillRect(x0,top,c.w,c.h*0.6);
  g.fillStyle=brick?'#7a6a5e':'#a09a90'; g.fillRect(x0-1.2,top-3,c.w+2.4,3); g.fillStyle='rgba(255,255,255,.2)'; g.fillRect(x0-1.2,top-3,c.w+2.4,0.7);
  hzEl(g,c.x,top-2.2,c.w/2-1.2,1.1,'#1a1412');
  g.fillStyle='rgba(30,20,14,.5)'; g.fillRect(x0-1,c.base-1.2,c.w+2,1.6);
  if(L.snow){ g.fillStyle='rgba(246,249,252,.97)'; rrect(g,x0-1.8,top-4.6,c.w+3.6,2.4,1.2); g.fill(); }
  g.strokeStyle='rgba(20,14,10,.55)'; g.lineWidth=0.7; g.strokeRect(x0,top-3,c.w,c.h+3);
}
// roof plane: clip, texture in the plane frame, light tone, optional overlay gradient
function hzPlane(g,L,pts,fr,u0,u1,v0,v1,vs,k,rng,ovl){
  g.save(); hzPoly(g,pts); g.clip();
  g.save(); g.transform(fr[0],fr[1],fr[2],fr[3],fr[4],fr[5]); hzRoofTex(g,L.roof,L.rc,u0,u1,v0,v1,vs,rng); g.restore();
  if(k){ g.fillStyle=k>0?`rgba(255,246,226,${k})`:`rgba(14,8,20,${-k})`; hzPoly(g,pts); g.fill(); }
  if(ovl){ g.fillStyle=ovl; hzPoly(g,pts); g.fill(); }
  if(L.snow){
    // a soft blanket of snow: bright on lit planes, blue-grey in shade, a little bluer toward the eave
    let y0=1e9,y1=-1e9; for(const p of pts){ y0=Math.min(y0,p[1]); y1=Math.max(y1,p[1]); }
    g.fillStyle=k<0?'rgba(200,214,232,.93)':k>0?'rgba(250,252,255,.94)':'rgba(238,244,250,.93)'; hzPoly(g,pts); g.fill();
    g.fillStyle=hzLG(g,0,y0,0,y1,[[0,'rgba(255,255,255,.25)'],[1,k>0?'rgba(110,135,175,.14)':'rgba(96,122,168,.34)']]); hzPoly(g,pts); g.fill();
    g.save(); g.transform(fr[0],fr[1],fr[2],fr[3],fr[4],fr[5]);
    g.strokeStyle='rgba(120,145,180,.22)'; g.lineWidth=1.1; g.beginPath(); for(let v=v1-6*vs;v>v0;v-=(7+rng()*7)*vs){ let u=u0+rng()*10; g.moveTo(u,v); while(u<u1){ const du=10+rng()*14; g.quadraticCurveTo(u+du/2,v+(rng()-0.3)*2.2,u+du,v+(rng()-0.5)*0.8); u+=du; } } g.stroke();
    g.fillStyle='rgba(255,255,255,.75)'; for(let i=0;i<(u1-u0)*(v1-v0)/90;i++) g.fillRect(u0+rng()*(u1-u0),v0+rng()*(v1-v0),0.7,0.7);
    g.restore();
  }
  g.restore();
  g.strokeStyle=L.snow?'rgba(46,56,76,.6)':'rgba(26,16,10,.5)'; g.lineWidth=0.8; hzPoly(g,pts); g.stroke();
}
function hzBurnHole(g,L,cx,cy,r,rng){
  const gr=g.createRadialGradient(cx,cy,r*0.4,cx,cy,r*2.1); gr.addColorStop(0,'rgba(14,8,4,.85)'); gr.addColorStop(1,'rgba(14,8,4,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(cx,cy,r*2.1,r*1.6,0,0,TAU); g.fill();
  const pts=[]; for(let i=0;i<13;i++){ const a=i/13*TAU, m=0.55+rng()*0.55; pts.push([cx+Math.cos(a)*r*m,cy+Math.sin(a)*r*m*0.75]); }
  g.fillStyle='#120a06'; hzPoly(g,pts); g.fill();
  g.save(); hzPoly(g,pts); g.clip(); g.strokeStyle='#3a2416'; g.lineWidth=2.2; g.beginPath(); for(let k=-r;k<=r;k+=r*0.55){ g.moveTo(cx+k-2,cy-r); g.lineTo(cx+k+2,cy+r); } g.stroke(); g.strokeStyle='rgba(255,120,40,.35)'; g.lineWidth=0.6; g.beginPath(); for(let k=-r;k<=r;k+=r*0.55){ g.moveTo(cx+k-2.6,cy-r); g.lineTo(cx+k+1.4,cy+r); } g.stroke(); g.restore();
  g.strokeStyle='rgba(60,30,14,.9)'; g.lineWidth=1; hzPoly(g,pts); g.stroke();
}
function hzSoot(g,x,y,r){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(16,10,6,.6)'); gr.addColorStop(1,'rgba(16,10,6,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
// ---------- front wall
function hzFacade(g,L,pts,x0,y0,x1,y1,rng,mat,col,isGable){
  g.save(); hzPoly(g,pts); g.clip();
  hzWallTex(g,mat,col,x0,y0,x1,y1,rng);
  g.fillStyle=hzLG(g,x0,0,x1,0,[[0,'rgba(255,244,220,.1)'],[0.5,'rgba(0,0,0,0)'],[1,'rgba(10,6,16,.16)']]); g.fillRect(x0,y0,x1-x0,y1-y0);
  if(!isGable){ g.fillStyle=hzLG(g,0,y1-7,0,y1,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.22)']]); g.fillRect(x0,y1-7,x1-x0,7); }
  g.restore();
}
function hzFrame(g,L,x0,y0,x1,y1,posts,rails,braces){
  const b=L.beam;
  g.fillStyle=hzS(b);
  for(const y of rails) g.fillRect(x0,y-1.4,x1-x0,2.8);
  for(const x of posts) g.fillRect(x-1.4,y0,2.8,y1-y0);
  g.lineCap='butt'; g.strokeStyle=hzS(b); g.lineWidth=2.4; g.beginPath(); for(const [ax,ay,bx,by] of braces){ g.moveTo(ax,ay); g.lineTo(bx,by); } g.stroke();
  g.fillStyle=hzSA(hzT(b,0.35),0.6); for(const y of rails) g.fillRect(x0,y-1.4,x1-x0,0.6); for(const x of posts) g.fillRect(x-1.4,y0,0.6,y1-y0);
}
function hzPlinth(g,L,x0,x1){
  const H=L.H; g.fillStyle=L.wall==='log'?'#6e6a64':'#7e786e'; g.fillRect(x0,H-3.2,x1-x0,3.2); g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(x0,H-3.2,x1-x0,0.6);
  g.fillStyle='rgba(0,0,0,.3)'; for(let x=x0+3;x<x1;x+=5+((x*7)%3)) g.fillRect(x,H-3,0.6,3);
}
function hzQuoins(g,L,x0,x1,y0,y1,left){
  const qc=hzT(L.wall==='brick'?'#c8bca8':L.wc,0.22);
  for(const [x,s] of left?[[x0,1]]:[[x0,1],[x1,-1]]){ let k=0; for(let y=y1-3.2;y>y0+1;y-=4.2,k++){ const qw=k%2?4.5:7; const qx=s>0?x:x-qw; g.fillStyle=hzS(qc); g.fillRect(qx,y-3.8,qw,3.8); g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(qx,y-0.6,qw,0.6); g.fillStyle='rgba(255,255,255,.2)'; g.fillRect(qx,y-3.8,qw,0.6); } }
}
function hzCorner(g,L,x0,x1,y0,y1,rng){
  if(L.wall==='stone'||L.wall==='brick'||L.wall==='ashlar') hzQuoins(g,L,x0,x1,y0,y1);
  else if(L.wall==='plank'||L.wall==='board'||L.wall==='rough'){ const c=L.wall==='rough'?hzT('#6a5a48',0):L.trim; g.fillStyle=hzS(c); g.fillRect(x0,y0,2.4,y1-y0); g.fillRect(x1-2.4,y0,2.4,y1-y0); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x0+2.4,y0,0.6,y1-y0); g.fillRect(x1-3,y0,0.6,y1-y0); }
  else if(L.wall==='log'){ for(let y=y1-2.6;y>y0;y-=5.2){ for(const x of [x0-1.2,x1+1.2]){ g.fillStyle='#5a3a20'; g.beginPath(); g.arc(x,y,2.9,0,TAU); g.fill(); g.fillStyle=hzJ('#c8a070',rng,0.15); g.beginPath(); g.arc(x,y,2.3,0,TAU); g.fill(); g.strokeStyle='rgba(110,70,30,.6)'; g.lineWidth=0.4; g.beginPath(); g.arc(x,y,1.3,0,TAU); g.stroke(); } } }
}
// windows, door, sign, lantern, ivy: the shared front-wall dressing
function hzDress(g,hs,L,rng,wallTop){
  const {W,H}=L;
  for(const o of L.wins) hzWin(g,L,o,rng);
  hzDoor(g,L,rng);
  if(L.signHang) hzSign(g,L,L.icon,L.dw/2+2.6,H-L.dh-1.6,false);
  if(L.lantern) hzSconce(g,L,L.lanternX,H-L.dh+(L.hood?3:1),L.st==="yara");
  for(const s of L.ivy) hzIvy(g,s*(W-3),H,(H-wallTop)*0.85,rng);
  if(L.burnt){ for(let i=0;i<2;i++) hzSoot(g,(rng()-0.5)*W*1.6,wallTop+6+rng()*10,8+rng()*6); }
}
function hzEaveDeco(g,L,y,x0,x1,rng){
  if(L.st==='lamps'){ const n=Math.max(3,Math.floor((x1-x0)/16)); g.strokeStyle='rgba(30,26,22,.8)'; g.lineWidth=0.5; g.beginPath(); g.moveTo(x0+4,y+1); for(let i=0;i<=n;i++) g.quadraticCurveTo(x0+4+(i-0.5)*(x1-x0-8)/n,y+4,x0+4+i*(x1-x0-8)/n,y+1); g.stroke();
    const cols=['#ffcf5a','#ff7a5a','#9ae07a','#7ac0ff']; for(let i=0;i<n;i++){ const lx=x0+4+(i+0.5)*(x1-x0-8)/n; if(lx>-L.dw/2-4&&lx<(L.signHang?L.dw/2+21:L.dw/2+4)) continue; if(L.wins.some(o=>o.fl===1&&Math.abs(o.x-lx)<o.w/2+4)) continue; g.fillStyle='#2a2220'; g.fillRect(lx-1.6,y+3,3.2,1); g.fillStyle=cols[i%4]; g.beginPath(); g.ellipse(lx,y+5.6,1.9,2.4,0,0,TAU); g.fill(); L.panes.push([lx-1.2,y+4,2.4,3.2]); L.glows.push([lx,y+5.6,7]); } }
  if(L.st==='herbalist'){ for(let lx=x0+6;lx<x1-4;lx+=7+rng()*4){ if(Math.abs(lx)<L.dw/2+3) continue; g.strokeStyle='#5a4a2a'; g.lineWidth=0.4; g.beginPath(); g.moveTo(lx,y); g.lineTo(lx,y+2.5); g.stroke(); g.fillStyle=rng()<0.5?'#6a8a3a':'#8a8a4a'; hzPoly(g,[[lx-1.8,y+2.5],[lx+1.8,y+2.5],[lx+0.6,y+7.5],[lx-0.6,y+7.5]]); g.fill(); g.fillStyle='#b48cff'; g.fillRect(lx-0.4,y+6.6,0.8,1.2); } }
}
function hzIcicles(g,x0,x1,y,rng){ g.fillStyle='rgba(225,240,252,.92)'; for(let x=x0+2;x<x1-1;x+=2.2+rng()*4){ if(rng()<0.35) continue; const l=1.6+rng()*4.2; g.beginPath(); g.moveTo(x-0.8,y); g.lineTo(x+0.8,y); g.lineTo(x,y+l); g.fill(); } }
function hzSnowEave(g,x0,x1,y,rng){ g.fillStyle='rgba(246,249,252,.98)'; g.fillRect(x0,y-2.4,x1-x0,2.6); for(let x=x0;x<x1;x+=3+rng()*3){ g.beginPath(); g.ellipse(x+1.5,y+0.2,2.4,1.1+rng()*0.9,0,0,TAU); g.fill(); } }
function hzDrifts(g,L,rng){
  const {W,H}=L;
  for(const [x,rx] of [[-W+3,9+rng()*5],[W-3,9+rng()*5],[-W*0.55,5+rng()*4],[W*0.6,5+rng()*4]]){ if(Math.abs(x)<L.dw/2+8) continue; hzEl(g,x+1.2,H+2,rx,2.6,'rgba(150,170,200,.4)'); hzEl(g,x,H+1,rx,3+rng()*1.4,'rgba(246,249,252,.97)'); hzEl(g,x-rx*0.3,H,rx*0.5,1.2,'rgba(255,255,255,1)'); }
}
function hzGround(g,L){ const {W,H}=L; g.fillStyle=hzLG(g,0,H-2,0,H+5,[[0,'rgba(0,0,0,.42)'],[1,'rgba(0,0,0,0)']]); g.fillRect(-W-2,H-2,L.w+8,7); }
function hzVane(g,x,y){ // Ash's little copper dragon weathervane
  g.strokeStyle='#2a2420'; g.lineWidth=0.8; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-14); g.moveTo(x-4,y-8); g.lineTo(x+4,y-8); g.moveTo(x-1.6,y-10); g.lineTo(x+1.6,y-6); g.stroke();
  g.fillStyle='#2a2420'; g.beginPath(); g.moveTo(x+4,y-8); g.lineTo(x+2.6,y-9); g.lineTo(x+2.6,y-7); g.fill();
  const c='#b0582c'; g.fillStyle=c; g.strokeStyle=c; g.lineWidth=0.9;
  g.beginPath(); g.ellipse(x,y-15.6,3.4,1.3,-0.1,0,TAU); g.fill();
  g.beginPath(); g.moveTo(x+2.6,y-16); g.quadraticCurveTo(x+4.4,y-17.2,x+5,y-18.6); g.stroke();
  g.beginPath(); g.moveTo(x+4.2,y-19.6); g.lineTo(x+7,y-18.8); g.lineTo(x+4.6,y-17.8); g.fill();
  g.beginPath(); g.moveTo(x-0.6,y-16.4); g.lineTo(x-3,y-21.4); g.lineTo(x-0.4,y-19.4); g.lineTo(x+1.6,y-21); g.lineTo(x+1.2,y-16.6); g.fill();
  g.beginPath(); g.moveTo(x-3,y-15.4); g.quadraticCurveTo(x-6.4,y-15.6,x-6.6,y-13.4); g.quadraticCurveTo(x-6.4,y-12,x-5,y-12.6); g.stroke();
  g.fillStyle='#ffd25a'; g.fillRect(x+5.2,y-19.2,0.7,0.7);
}
function hzFlag(g,x,y,col){ g.strokeStyle='#3a3430'; g.lineWidth=0.9; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-18); g.stroke(); hzEl(g,x,y-18.4,0.9,0.9,'#e8b83a');
  g.fillStyle=col; g.beginPath(); g.moveTo(x+0.4,y-17.4); g.quadraticCurveTo(x+4,y-18.8,x+8,y-16.8); g.quadraticCurveTo(x+11,y-15.4,x+13,y-16.4); g.lineTo(x+13,y-10.4); g.quadraticCurveTo(x+10,y-9.6,x+7.6,y-11); g.quadraticCurveTo(x+4,y-12.6,x+0.4,y-11.4); g.closePath(); g.fill();
  g.fillStyle='#e8b83a'; g.fillRect(x+0.4,y-14.8,12.4,1.2); }
function hzDome(g,L,x,y,r){ // Quill's little observatory turret
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x+3,y+1,r+2,3,0,0,TAU); g.fill();
  g.save(); g.beginPath(); g.rect(x-r,y-5,r*2,6); g.clip(); hzWallTex(g,'brick','#9a5a42',x-r,y-5,x+r,y+1,mulberry32(9)); g.restore();
  g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x+r*0.4,y-5,r*0.6,6);
  g.fillStyle=hzLG(g,x-r,y-5-r,x+r,y,[[0,'#d8e0e8'],[0.5,'#8a98a8'],[1,'#3e4856']]); g.beginPath(); g.ellipse(x,y-5,r,r*0.9,0,Math.PI,0); g.fill();
  g.strokeStyle='rgba(30,36,46,.45)'; g.lineWidth=0.6; g.beginPath(); for(const k of [-0.55,0.55]){ g.moveTo(x+k*r,y-5); g.quadraticCurveTo(x+k*r*0.9,y-5-r*0.75,x,y-5-r*0.9); } g.stroke();
  g.fillStyle='#1a1e28'; g.fillRect(x-1.3,y-5-r*0.86,2.6,r*0.86);
  g.strokeStyle='#c8a040'; g.lineWidth=2.4; g.lineCap='round'; g.beginPath(); g.moveTo(x,y-5-r*0.4); g.lineTo(x+r*0.9,y-5-r*1.25); g.stroke(); g.strokeStyle='#8a6a20'; g.lineWidth=2.8; g.beginPath(); g.moveTo(x+r*0.8,y-5-r*1.15); g.lineTo(x+r*0.95,y-5-r*1.32); g.stroke();
  if(L.snow){ g.fillStyle='rgba(246,249,252,.9)'; g.beginPath(); g.ellipse(x-r*0.3,y-5-r*0.6,r*0.5,r*0.25,-0.5,0,TAU); g.fill(); }
}
function hzAntlers(g,x,y){
  g.fillStyle='#5a3a22'; rrect(g,x-3.4,y-2.6,6.8,5.6,1.6); g.fill(); g.fillStyle='rgba(255,230,190,.25)'; g.fillRect(x-2.6,y-2,5.2,0.8);
  g.strokeStyle='#e8dcc0'; g.lineWidth=1.3; g.lineCap='round'; g.beginPath();
  for(const s of [-1,1]){ g.moveTo(x+s*1.6,y-1.6); g.quadraticCurveTo(x+s*7,y-3,x+s*9.5,y-10); g.moveTo(x+s*5,y-3.2); g.lineTo(x+s*5.6,y-7.4); g.moveTo(x+s*7.6,y-5.6); g.lineTo(x+s*10.8,y-6.8); g.moveTo(x+s*8.6,y-8); g.lineTo(x+s*8,y-11.6); }
  g.stroke(); g.strokeStyle='rgba(120,100,70,.6)'; g.lineWidth=0.5; g.stroke();
}
// ---------- the two house shapes
function hzDrawWide(g,hs,L,rng){
  const {W,H,F}=L, ex=6, xl=-W-ex, xr=W+ex, topY=L.topY, eaveY=L.eaveY, ridgeY=L.ridgeY, hi=L.hip?Math.min(W*0.45,(eaveY-topY)*0.5):0;
  hzGround(g,L);
  // front wall
  hzFacade(g,L,[[-W,eaveY-1],[W,eaveY-1],[W,H],[-W,H]],-W,eaveY-1,W,H,rng,L.wall,L.wc,false);
  const floorY=L.two?H-27.6:null;
  if(L.wall==='plaster'){
    const posts=[-W+1.4,W-1.4,-L.dw/2-3.6,L.dw/2+3.6], ws=L.wins.filter(o=>o.fl===0).map(o=>o.x).sort((a,b)=>a-b);
    for(let i=0;i<ws.length-1;i++) if(Math.sign(ws[i])===Math.sign(ws[i+1])) posts.push((ws[i]+ws[i+1])/2);
    const rails=[H-4.4,eaveY+2]; if(floorY) rails.push(floorY);
    const braces=[]; const ps=posts.slice().sort((a,b)=>a-b);
    for(let i=0;i<ps.length-1;i++){ const a=ps[i]+1.4, b=ps[i+1]-1.4; if(b-a<6||(a<0&&b>0)) continue; const hasW=L.wins.some(o=>o.x>a&&o.x<b&&o.fl===0); if(!hasW) braces.push(a<0?[a,H-5,b,floorY||eaveY+3]:[b,H-5,a,floorY||eaveY+3]); }
    hzFrame(g,L,-W,eaveY,W,H,posts,rails,braces);
  }else if(floorY&&L.wall!=='log'){ g.fillStyle=hzS(L.wall==='board'?L.trim:hzT(L.wc,-0.3)); g.fillRect(-W,floorY-1.2,L.w,2.4); g.fillStyle='rgba(255,255,255,.15)'; g.fillRect(-W,floorY-1.2,L.w,0.6); }
  hzCorner(g,L,-W,W,eaveY,H,rng);
  hzPlinth(g,L,-W,W);
  hzDress(g,hs,L,rng,eaveY);
  // shadow under the eave
  g.fillStyle=hzLG(g,0,eaveY,0,eaveY+7,[[0,'rgba(10,6,4,.5)'],[1,'rgba(10,6,4,0)']]); g.fillRect(-W,eaveY,L.w,7);
  // roof planes
  const lr=hzLG(g,xl,0,xr,0,[[0,'rgba(255,244,220,.08)'],[1,'rgba(10,6,16,.14)']]);
  const fov=hzLG(g,0,ridgeY,0,eaveY,[[0,'rgba(255,244,220,.06)'],[1,'rgba(0,0,0,.16)']]);
  if(L.hip){
    hzPlane(g,L,[[xl,topY],[xr,topY],[xr-hi,ridgeY],[xl+hi,ridgeY]],[1,0,0,-1,0,ridgeY+topY],xl,xr,topY,ridgeY,0.62,0.12,rng,lr);
    hzPlane(g,L,[[xl,topY],[xl+hi,ridgeY],[xl,eaveY]],[0,1,-1,0,0,0],topY,eaveY,-(xl+hi),-xl,0.8,0.15,rng,null);
    hzPlane(g,L,[[xr,topY],[xr-hi,ridgeY],[xr,eaveY]],[0,1,1,0,0,0],topY,eaveY,xr-hi,xr,0.8,-0.22,rng,null);
    hzPlane(g,L,[[xl+hi,ridgeY],[xr-hi,ridgeY],[xr,eaveY],[xl,eaveY]],[1,0,0,1,0,0],xl,xr,ridgeY,eaveY,1,0,rng,fov);
  }else{
    hzPlane(g,L,[[xl,topY],[xr,topY],[xr,ridgeY],[xl,ridgeY]],[1,0,0,-1,0,ridgeY+topY],xl,xr,topY,ridgeY,0.62,0.12,rng,lr);
    hzPlane(g,L,[[xl,ridgeY],[xr,ridgeY],[xr,eaveY],[xl,eaveY]],[1,0,0,1,0,0],xl,xr,ridgeY,eaveY,1,0,rng,fov);
    // gable bargeboards at both ends
    for(const [x,s] of [[xl,1],[xr,-1]]){ g.fillStyle=hzS(hzT(L.roof==='thatch'?L.rc:L.trim===L.beam?L.beam:hzT(L.rc,-0.3),s>0?0.05:-0.2)); g.fillRect(s>0?x:x-2,topY,2,eaveY-topY+1.5); if(L.snow){ g.fillStyle=s>0?'rgba(250,252,255,.96)':'rgba(206,218,234,.96)'; g.fillRect(s>0?x+0.5:x-2,topY,1.5,eaveY-topY); } }
  }
  hzRoofDeco(g,L,rng,xl,xr,topY,ridgeY,eaveY,hi);
  // ridge and eave edge
  const rx0=xl+hi, rx1=xr-hi;
  if(L.roof==='thatch'){ g.fillStyle=hzTS(L.rc,-0.18); g.fillRect(rx0,ridgeY-2.6,rx1-rx0,5.2); g.fillStyle=hzTS(L.rc,0.18); g.fillRect(rx0,ridgeY-2.6,rx1-rx0,1.4);
    g.strokeStyle=hzTS(L.rc,-0.4); g.lineWidth=0.7; g.beginPath(); for(let x=rx0+1;x<rx1-2;x+=4){ g.moveTo(x,ridgeY+2.4); g.lineTo(x+2,ridgeY-0.6); g.lineTo(x+4,ridgeY+2.4); } g.stroke();
    g.fillStyle=hzTS(L.rc,-0.3); g.fillRect(xl,eaveY-1,xr-xl,3.4); g.fillStyle=hzTS(L.rc,0.05); for(let x=xl;x<xr;x+=1.6) g.fillRect(x,eaveY+0.6,0.8,1.4+((x*13)%2)); }
  else{ g.fillStyle=hzTS(L.rc,-0.28); g.fillRect(rx0,ridgeY-1.8,rx1-rx0,3.6); g.fillStyle=hzTS(L.rc,0.2); g.fillRect(rx0,ridgeY-1.8,rx1-rx0,1);
    if(L.roof==='clay'){ g.fillStyle='rgba(0,0,0,.3)'; for(let x=rx0+4;x<rx1;x+=6) g.fillRect(x,ridgeY-1.8,0.7,3.6); }
    g.fillStyle=hzTS(L.rc,-0.5); g.fillRect(xl,eaveY-0.6,xr-xl,2.4); g.fillStyle=hzTS(L.trim===L.beam?L.beam:hzT(L.rc,-0.2),0.1); g.fillRect(xl,eaveY+1.2,xr-xl,1); }
  if(L.snow){ hzSnowEave(g,xl,xr,eaveY+1.6,rng); hzIcicles(g,xl,xr,eaveY+2.4,rng); g.fillStyle='rgba(252,253,255,.98)'; rrect(g,rx0,ridgeY-3.2,rx1-rx0,5,2.4); g.fill(); g.fillStyle='rgba(120,145,180,.3)'; g.fillRect(rx0+1,ridgeY+1.6,rx1-rx0-2,0.8); }
  hzEaveDeco(g,L,eaveY+2,-W,W,rng);
  if(L.cross) hzCrossGable(g,L,rng,eaveY,ridgeY);
  for(const dx of L.dorm) hzDormer(g,L,rng,dx,eaveY-(eaveY-ridgeY)*0.22);
  for(const c of L.chims) hzChimney(g,L,c,rng);
  if(L.st==='ash') hzVane(g,rx1-12,ridgeY);
  if(L.st==='mayor'||L.st==='guard') hzFlag(g,L.cross?-(L.gw/2)-12:rx0+10,ridgeY,L.st==='mayor'?'#b8322e':'#2e4a8a');
  if(L.st==='scholar') hzDome(g,L,(L.chims[0]&&L.chims[0].x<0?1:-1)*W*0.42,ridgeY+6,9);
  if(L.snow) hzDrifts(g,L,rng);
  for(const e of L.extras) hzExtra(g,L,e,rng);
  g.strokeStyle='rgba(26,16,10,.55)'; g.lineWidth=0.8; g.strokeRect(-W,eaveY+1,L.w,H-eaveY-1);
}
function hzRoofDeco(g,L,rng,xl,xr,topY,ridgeY,eaveY,hi){
  // moss, lichen and the burnt hole, drawn on top of the planes
  g.save(); hzPoly(g,hi?[[xl,topY],[xr,topY],[xr,eaveY],[xl,eaveY]]:[[xl,topY],[xr,topY],[xr,eaveY],[xl,eaveY]]); g.clip();
  if(!L.snow&&(L.moss||L.lichen)) for(let i=0;i<3+Math.floor(rng()*3);i++) hzMoss(g,xl+8+rng()*(xr-xl-16),ridgeY+(eaveY-ridgeY)*(0.4+rng()*0.55),6+rng()*7,3+rng()*3,rng,L.lichen&&!L.moss);
  if(L.burnt){ for(let i=0;i<3;i++) hzSoot(g,xl+rng()*(xr-xl),topY+rng()*(eaveY-topY),9+rng()*10); hzBurnHole(g,L,(rng()-0.5)*L.W*1.1,ridgeY+(eaveY-ridgeY)*0.45,9+rng()*5,rng); }
  g.restore();
}
function hzCrossGable(g,L,rng,eaveY,ridgeY){
  const gw=L.gw, gh=L.Gc, ay=eaveY-gh, yj=Math.min(ay-6,ridgeY+2);
  // shadow onto the main roof
  g.fillStyle='rgba(10,6,4,.3)'; hzPoly(g,[[2,yj],[gw/2+5,eaveY+1],[gw/2+13,eaveY+1],[7,yj+2]]); g.fill();
  const pts=[[-gw/2,eaveY+1],[-gw/2,eaveY-0.5],[0,ay],[gw/2,eaveY-0.5],[gw/2,eaveY+1]];
  hzFacade(g,L,pts,-gw/2,ay,gw/2,eaveY+1,rng,L.gable,L.gc,true);
  if(L.gable==='plaster'){ hzFrame(g,L,-gw/2,ay,gw/2,eaveY,[0],[eaveY+0.4],[[-gw*0.3,eaveY,0,ay+gh*0.4],[gw*0.3,eaveY,0,ay+gh*0.4]]); }
  // something to look at in the cross gable
  const cy=ay+gh*0.6;
  if(L.st==='lodge') hzAntlers(g,0,cy+1);
  else if(L.st==='library'){}
  else if(!L.signHang&&L.icon) hzSign(g,L,L.icon,0,cy,true);
  else hzWin(g,L,{x:0,y:cy-4,w:9,h:8,kind:'sq',fl:2,lit:rng()<0.8,cur:null,st:L.burnt?'board':'ok',shut:false},rng);
  g.fillStyle=hzLG(g,0,ay,0,ay+6,[[0,'rgba(10,6,4,.45)'],[1,'rgba(10,6,4,0)']]); hzPoly(g,[[-gw/2,eaveY],[0,ay],[gw/2,eaveY],[gw/2,eaveY-3],[0,ay+5],[-gw/2,eaveY-3]]); g.fill();
  const e=4, lp=[[-gw/2-e,eaveY+2],[0,ay-3],[0,yj]], rp=[[gw/2+e,eaveY+2],[0,ay-3],[0,yj]];
  hzPlane(g,L,lp,[0,1,-1,0,0,0],yj,eaveY+2,0,gw/2+e,0.85,0.08,rng,null);
  hzPlane(g,L,rp,[0,1,1,0,0,0],yj,eaveY+2,0,gw/2+e,0.85,-0.16,rng,null);
  hzRake(g,L,-gw/2-e,eaveY+2,0,ay-3,gw/2+e);
  g.fillStyle=hzTS(L.rc,-0.3); g.fillRect(-1.6,yj,3.2,ay-3-yj); g.fillStyle=hzTS(L.rc,0.2); g.fillRect(-1.6,yj,1,ay-3-yj);
  if(L.snow){ g.fillStyle='rgba(246,249,252,.98)'; g.fillRect(-1.8,yj,3.6,ay-3-yj); }
}
function hzRake(g,L,x0,y0,ax,ay,x1,clip){
  const bc=L.roof==='thatch'?hzT(L.rc,-0.25):L.town==='brindle'?L.trim:hzT(L.beam,0.1);
  const pts=clip?[[x0,y0],[clip[0],clip[1]],[-clip[0],clip[1]],[x1,y0]]:[[x0,y0],[ax,ay],[x1,y0]];
  const line=(dy)=>{ g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x,y+dy):g.moveTo(x,y+dy)); g.stroke(); };
  g.lineCap='round'; g.lineJoin='round'; g.strokeStyle='rgba(10,6,4,.5)'; g.lineWidth=3.4; line(0.8);
  g.strokeStyle=hzS(bc); g.lineWidth=2.4; line(0);
  g.strokeStyle=hzSA(hzT(bc,0.35),0.7); g.lineWidth=0.6; line(-1);
  if(L.snow){ g.strokeStyle='rgba(246,249,252,.98)'; g.lineWidth=2; line(-1.6); }
  if(!clip&&(L.town==='village'||L.town==='way')){ g.strokeStyle=hzS(bc); g.lineWidth=1.2; g.beginPath(); g.moveTo(ax,ay); g.lineTo(ax,ay-4); g.moveTo(ax-1.6,ay-2.6); g.lineTo(ax+1.6,ay-2.6); g.stroke(); }
}
function hzDormer(g,L,rng,dx,by){
  if(L.roof==='thatch'){
    const r=9; g.fillStyle='rgba(10,6,4,.3)'; g.beginPath(); g.ellipse(dx+2,by+0.5,r+1,3,0,0,TAU); g.fill();
    hzWin(g,L,{x:dx,y:by-6.5,w:8,h:5.5,kind:'sq',fl:2,lit:rng()<0.8,cur:null,st:L.burnt?'board':'ok',shut:false},rng);
    g.save(); g.beginPath(); g.ellipse(dx,by-4,r,8,0,Math.PI,0); g.ellipse(dx,by-6.4,r-3,4.2,0,0,Math.PI,true); g.clip('evenodd'); hzRoofTex(g,'thatch',hzT(L.rc,0.05),dx-r,dx+r,by-13,by,1,rng); g.restore();
    g.strokeStyle=hzTS(L.rc,-0.35); g.lineWidth=0.8; g.beginPath(); g.ellipse(dx,by-6.4,r-3,4.2,0,Math.PI,0); g.stroke();
    if(L.snow){ g.fillStyle='rgba(246,249,252,.95)'; g.beginPath(); g.ellipse(dx,by-11,r-2,2.2,0,0,TAU); g.fill(); }
    return;
  }
  g.fillStyle='rgba(10,6,4,.3)'; hzPoly(g,[[dx+6,by],[dx+11,by+1],[dx+9,by-14],[dx+2,by-18]]); g.fill();
  hzFacade(g,L,[[dx-6.5,by],[dx-6.5,by-8],[dx,by-13],[dx+6.5,by-8],[dx+6.5,by]],dx-6.5,by-13,dx+6.5,by,rng,L.gable==='plaster'?'plaster':L.gable,L.gc,true);
  hzWin(g,L,{x:dx,y:by-7,w:7,h:5.6,kind:'sq',fl:2,lit:rng()<0.8,cur:null,st:L.burnt?'board':'ok',shut:false},rng);
  const lp=[[dx-8,by-7],[dx,by-14.5],[dx,by-20],[dx-8,by-12.5]], rp=[[dx+8,by-7],[dx,by-14.5],[dx,by-20],[dx+8,by-12.5]];
  g.fillStyle=hzTS(L.rc,0.08); hzPoly(g,lp); g.fill(); g.fillStyle=hzTS(L.rc,-0.2); hzPoly(g,rp); g.fill();
  g.strokeStyle='rgba(0,0,0,.25)'; g.lineWidth=0.6; g.beginPath(); for(let k=2;k<8;k+=2){ g.moveTo(dx-k,by-14.5+k*0.94-5.5); g.lineTo(dx-k,by-14.5+k*0.94); g.moveTo(dx+k,by-14.5+k*0.94-5.5); g.lineTo(dx+k,by-14.5+k*0.94); } g.stroke();
  if(L.snow){ g.fillStyle='rgba(246,249,252,.95)'; hzPoly(g,lp); g.fill(); g.fillStyle='rgba(214,226,240,.92)'; hzPoly(g,rp); g.fill(); }
  hzRake(g,L,dx-8,by-7,dx,by-14.5,dx+8);
}
function hzDrawVert(g,hs,L,rng){
  const {W,H,F,G}=L, ex=6, xl=-W-ex, xr=W+ex, yF=H-F, yA=yF-G, yE=yF+2, yB=-H-7, yBC=yB+4;
  // a clipped (jerkinhead) gable trims the top of the triangle with a little hip
  const cf=0.62, jk=L.jerk, xC=xl*(1-cf), yCr=yE+(yA-3-yE)*cf, yRf=jk?yA-5:yA-3, cw=W*(1-cf), yC=yF-G*cf;
  hzGround(g,L);
  // roof planes running north from the front gable
  hzPlane(g,L,jk?[[xl,yBC],[0,yB],[0,yRf],[xC,yCr],[xl,yE]]:[[xl,yBC],[0,yB],[0,yA-3],[xl,yE]],[0,1,-1,0,0,0],yB,yE,0,-xl,0.85,0.1,rng,hzLG(g,0,yB,0,yE,[[0,'rgba(255,244,220,.06)'],[1,'rgba(0,0,0,.08)']]));
  hzPlane(g,L,jk?[[xr,yBC],[0,yB],[0,yRf],[-xC,yCr],[xr,yE]]:[[xr,yBC],[0,yB],[0,yA-3],[xr,yE]],[0,1,1,0,0,0],yB,yE,0,xr,0.85,-0.18,rng,hzLG(g,0,yB,0,yE,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.1)']]));
  if(jk) hzPlane(g,L,[[xC,yCr],[-xC,yCr],[0,yRf]],[1,0,0,1,0,0],xC,-xC,yRf,yCr,0.7,-0.05,rng,null);
  // side eaves
  for(const [x,s] of [[xl,1],[xr,-1]]){ g.fillStyle=hzTS(L.rc,s>0?-0.35:-0.55); g.fillRect(s>0?x:x-2.2,yBC,2.2,yE-yBC+1); if(L.snow){ g.fillStyle=s>0?'rgba(250,252,255,.96)':'rgba(206,218,234,.96)'; g.fillRect(s>0?x+0.6:x-2.2,yBC,1.6,yE-yBC); } }
  g.save(); hzPoly(g,[[xl,yBC],[0,yB],[xr,yBC],[xr,yE],[0,yA-3],[xl,yE]]); g.clip();
  if(!L.snow&&(L.moss||L.lichen)) for(let i=0;i<3+Math.floor(rng()*3);i++){ const s=rng()<0.65?1:-1; hzMoss(g,s*(W*(0.25+rng()*0.6)),yB+(yE-yB)*(0.2+rng()*0.75),4+rng()*4,6+rng()*6,rng,L.lichen&&!L.moss); }
  if(L.burnt){ for(let i=0;i<3;i++) hzSoot(g,(rng()-0.5)*L.w,yB+rng()*(yE-yB),8+rng()*9); hzBurnHole(g,L,(rng()<0.5?-1:1)*W*0.45,yB+(yA-yB)*(0.35+rng()*0.4),8+rng()*4,rng); }
  g.restore();
  // ridge
  if(L.roof==='thatch'){ g.fillStyle=hzTS(L.rc,-0.2); g.fillRect(-2.8,yB,5.6,yRf-yB); g.fillStyle=hzTS(L.rc,0.15); g.fillRect(-2.8,yB,1.4,yRf-yB); g.strokeStyle=hzTS(L.rc,-0.42); g.lineWidth=0.7; g.beginPath(); for(let y=yB+1;y<yRf-3;y+=4){ g.moveTo(2.6,y); g.lineTo(-0.6,y+2); g.lineTo(2.6,y+4); } g.stroke(); }
  else{ g.fillStyle=hzTS(L.rc,-0.3); g.fillRect(-1.8,yB,3.6,yRf-yB); g.fillStyle=hzTS(L.rc,0.2); g.fillRect(-1.8,yB,1,yRf-yB); }
  if(jk){ g.strokeStyle=hzTS(L.rc,-0.32); g.lineWidth=1.6; g.lineCap='round'; g.beginPath(); g.moveTo(xC+1,yCr); g.lineTo(0,yRf); g.lineTo(-xC-1,yCr); g.stroke(); }
  if(L.snow){ g.fillStyle='rgba(246,249,252,.98)'; g.fillRect(-2.4,yB,4.8,yRf-yB); hzIcicles(g,xl-1,xl+3,yE+1,rng); hzIcicles(g,xr-3,xr+1,yE+1,rng); }
  for(const c of L.chims) hzChimney(g,L,c,rng);
  // the gable end wall
  const pent=[[-W,H],[-W,yF],[0,yA],[W,yF],[W,H]];
  hzFacade(g,L,[[-W,H],[-W,yF+0.5],[W,yF+0.5],[W,H]],-W,yF,W,H,rng,L.wall,L.wc,false);
  hzFacade(g,L,jk?[[-W,yF+1],[-cw,yC],[cw,yC],[W,yF+1]]:[[-W,yF+1],[0,yA],[W,yF+1]],-W,yA,W,yF+1,rng,L.gable,L.gc,true);
  const floorY=L.two?H-27.6:null;
  if(L.wall==='plaster'){
    const posts=[-W+1.4,W-1.4,-L.dw/2-3.6,L.dw/2+3.6]; const rails=[H-4.4,yF]; if(floorY) rails.push(floorY);
    hzFrame(g,L,-W,yF,W,H,posts,rails,[]);
    if(L.gable==='plaster') hzFrame(g,L,-W,jk?yC:yA,W,yF,[0],[],[[-W*0.55,yF,0,yA+G*0.45],[W*0.55,yF,0,yA+G*0.45]]);
  }else{ g.fillStyle=hzS(L.wall==='board'||L.wall==='log'?hzT(L.trim,0):hzT(L.wc,-0.3)); g.fillRect(-W,yF-1,L.w,2.4); if(floorY&&L.wall!=='log'){ g.fillRect(-W,floorY-1.2,L.w,2.4); } }
  hzCorner(g,L,-W,W,yF,H,rng);
  hzPlinth(g,L,-W,W);
  hzDress(g,hs,L,rng,yF);
  // gable: sign, antlers or a round attic window
  const gy=yA+G*0.6;
  if(L.st==='lodge') hzAntlers(g,0,gy+1);
  else if(L.icon) hzSign(g,L,L.icon,0,gy+(jk?2.4:0.5),true);
  else hzWin(g,L,{x:0,y:gy,w:L.two?7:8,h:8,kind:rng()<0.5?'round':'sq',fl:2,lit:rng()<0.75,cur:null,st:L.burnt?'board':'ok',shut:false},rng);
  // shadow under the rake, then the bargeboard
  g.fillStyle='rgba(10,6,4,.42)'; hzPoly(g,jk?[[-W,yF+1],[-cw,yC],[cw,yC],[W,yF+1],[W,yF+5],[cw,yC+4.5],[-cw,yC+4.5],[-W,yF+5]]:[[-W,yF+1],[0,yA],[W,yF+1],[W,yF+5],[0,yA+4.5],[-W,yF+5]]); g.fill();
  hzRake(g,L,xl,yE,0,yA-3,xr,jk?[xC,yCr]:null);
  if(L.st==='ash') hzVane(g,0,yB+10);
  if(L.st==='mayor'||L.st==='guard') hzFlag(g,0,yB+6,L.st==='mayor'?'#b8322e':'#2e4a8a');
  if(L.st==='scholar') hzDome(g,L,(L.chims[0]&&L.chims[0].x<0?1:-1)*W*0.45,yB+22,8);
  if(L.snow) hzDrifts(g,L,rng);
  for(const e of L.extras) hzExtra(g,L,e,rng);
  g.strokeStyle='rgba(26,16,10,.55)'; g.lineWidth=0.8; hzPoly(g,pent); g.stroke();
}
// ---------- Mom's smithy: open front, glowing hearth, anvil, tall stone chimney
function hzDrawForge(g,hs,L,rng){
  const {W,H}=L, eaveY=L.eaveY, hx=-W*0.55, hw=34, hL=hx-hw/2, hR=hx+hw/2, p1=-W*0.27, p2=W*0.42;
  hzGround(g,L);
  // interior: back wall and dirt floor
  g.fillStyle='#2a1e16'; g.fillRect(-W,eaveY,L.w,H-eaveY);
  g.save(); g.beginPath(); g.rect(hR,eaveY,W-hR,H-eaveY-9); g.clip(); hzWallTex(g,'plank','#5a3e2a',hR,eaveY,W,H-9,rng); g.fillStyle='rgba(10,6,4,.42)'; g.fillRect(hR,eaveY,W-hR,H-eaveY-9); g.restore();
  g.fillStyle=hzLG(g,0,H-9,0,H,[[0,'#3a2a1e'],[1,'#6e5844']]); g.fillRect(hR,H-9,W-hR,9);
  g.fillStyle='rgba(0,0,0,.3)'; for(let i=0;i<14;i++) g.fillRect(hR+rng()*(W-hR),H-8+rng()*7,1+rng()*2,0.6);
  g.fillStyle='rgba(255,140,60,.12)'; g.fillRect(hR,H-9,30,9);
  // tools hanging on the back wall
  const ty=eaveY+6; g.fillStyle='#5a3a22'; g.fillRect(p1+4,ty,p2-p1-8,1.6);
  for(let i=0;i<5;i++){ const x=p1+8+i*(p2-p1-16)/4; g.strokeStyle='#7a5a3a'; g.lineWidth=1; g.beginPath(); g.moveTo(x,ty+1.6); g.lineTo(x,ty+10); g.stroke();
    if(i%2){ g.fillStyle='#4a4a52'; g.fillRect(x-2.2,ty+8,4.4,2.6); g.fillStyle='rgba(255,255,255,.2)'; g.fillRect(x-2.2,ty+8,4.4,0.6); } else { g.strokeStyle='#5a5a64'; g.lineWidth=0.9; g.beginPath(); g.moveTo(x-1.6,ty+10.5); g.lineTo(x,ty+6.5); g.lineTo(x+1.6,ty+10.5); g.stroke(); } }
  // sword rack at the back right
  const sx=W*0.8; g.fillStyle='#5a3a22'; g.fillRect(sx-5,H-21,12,1.6); g.fillRect(sx-5,H-12,12,1.4);
  for(const [d,len] of [[-2.4,17],[1,15],[4.4,16]]){ g.strokeStyle='#c8ccd8'; g.lineWidth=1; g.beginPath(); g.moveTo(sx+d,H-9.5); g.lineTo(sx+d,H-9.5-len); g.stroke(); g.fillStyle='#d8b04a'; g.fillRect(sx+d-1.6,H-14,3.2,0.9); g.fillStyle='#5a3a22'; g.fillRect(sx+d-0.5,H-13.2,1,3); }
  // quench barrel and the anvil on its stump
  hzExtra(g,Object.assign({},L,{H:H-5,snow:false}),{k:'barrel',x:W*0.58},rng); hzEl(g,W*0.58,H-5+1.6-11,3.7,1.2,'#2e4656'); hzEl(g,W*0.58-1,H-5+1.6-11.3,1.8,0.5,'rgba(200,220,240,.5)');
  const ax=2;
  g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(ax-2,H-4,14,2.4);
  g.fillStyle='#6a4426'; g.fillRect(ax,H-11,9,8); g.fillStyle='rgba(255,230,190,.22)'; g.fillRect(ax,H-11,9,1); g.strokeStyle='rgba(40,20,10,.5)'; g.lineWidth=0.4; g.beginPath(); g.arc(ax+4.5,H-10.5,2.4,0,Math.PI); g.stroke();
  g.fillStyle='#2e2e34'; g.beginPath(); g.moveTo(ax-5,H-16); g.lineTo(ax+13,H-16); g.quadraticCurveTo(ax+19,H-16,ax+21,H-14); g.lineTo(ax+12,H-12.6); g.lineTo(ax+10.5,H-11); g.lineTo(ax-1.5,H-11); g.lineTo(ax-3,H-12.8); g.closePath(); g.fill();
  g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(ax-4.5,H-16,16.5,1); g.fillStyle='rgba(255,140,60,.4)'; g.fillRect(ax-4,H-14.8,13,0.6);
  // leather bellows by the hearth
  g.fillStyle='#7a4a2a'; hzPoly(g,[[p1+2,H-6],[p1+12,H-9.5],[p1+12,H-3],[p1+2,H-3]]); g.fill(); g.fillStyle='#4a2c18'; g.fillRect(p1+12,H-9.5,2.4,6.5); g.strokeStyle='rgba(30,16,8,.6)'; g.lineWidth=0.5; g.beginPath(); for(const k of [4,7,10]){ g.moveTo(p1+k,H-6+(k-2)*-0.35); g.lineTo(p1+k,H-3); } g.stroke();
  // the hearth: stone block with a glowing mouth, brick hood rising into the chimney
  g.save(); g.beginPath(); g.rect(hL,H-21,hw,21); g.clip(); hzWallTex(g,'stone','#8e8478',hL,H-21,hR,H,rng); g.fillStyle=hzLG(g,hL,0,hR,0,[[0,'rgba(255,240,210,.08)'],[1,'rgba(0,0,0,.2)']]); g.fillRect(hL,H-21,hw,21); g.restore();
  g.save(); hzPoly(g,[[hL+2,H-21],[hR-2,H-21],[hR-7,eaveY-1],[hL+7,eaveY-1]]); g.clip(); hzWallTex(g,'brick','#8a4632',hL,eaveY-1,hR,H-21,rng); g.fillStyle=hzLG(g,0,eaveY,0,H-21,[[0,'rgba(10,6,4,.65)'],[1,'rgba(10,6,4,.15)']]); g.fillRect(hL,eaveY-1,hw,H-20-eaveY); g.restore();
  g.fillStyle='#a49a8c'; g.fillRect(hL-1.5,H-23,hw+3,2.6); g.fillStyle='rgba(255,255,255,.22)'; g.fillRect(hL-1.5,H-23,hw+3,0.6); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(hL-1.5,H-20.4,hw+3,0.7);
  const mw=hw*0.6, my=H-11;
  g.fillStyle='#120a06'; g.beginPath(); g.moveTo(hx-mw/2,H-3.5); g.lineTo(hx-mw/2,my-2); g.quadraticCurveTo(hx,my-11,hx+mw/2,my-2); g.lineTo(hx+mw/2,H-3.5); g.closePath(); g.fill();
  g.fillStyle=hzLG(g,0,my-6,0,H-4,[[0,'#ffb04a'],[0.55,'#e8561c'],[1,'#7a1a08']]); g.beginPath(); g.moveTo(hx-mw/2+2,H-4); g.lineTo(hx-mw/2+2,my-0.5); g.quadraticCurveTo(hx,my-7.5,hx+mw/2-2,my-0.5); g.lineTo(hx+mw/2-2,H-4); g.closePath(); g.fill();
  g.fillStyle='#ffe8a8'; for(let i=0;i<8;i++){ g.beginPath(); g.arc(hx-mw/2+4+rng()*(mw-8),H-6.5-rng()*3,0.7+rng()*0.9,0,TAU); g.fill(); }
  g.fillStyle='#2e2622'; for(let i=0;i<6;i++){ g.beginPath(); g.arc(hx-mw/2+3+i*(mw-6)/5,H-4.4,1.3,0,TAU); g.fill(); }
  L.hearth=[hx,my-1,mw];
  // posts and the beam across the open front
  for(const x of [p1,p2,W-1.6]){ g.fillStyle='#4a3020'; g.fillRect(x-1.6,eaveY,3.2,H-eaveY); g.fillStyle='rgba(255,230,190,.25)'; g.fillRect(x-1.6,eaveY,0.8,H-eaveY); g.fillStyle='#6a645a'; g.fillRect(x-2.4,H-2.6,4.8,2.6); }
  g.fillStyle='#4a3020'; g.fillRect(p1,eaveY,W-p1,3.4); g.fillStyle='rgba(255,230,190,.2)'; g.fillRect(p1,eaveY,W-p1,0.7);
  // stone end wall on the left
  g.save(); g.beginPath(); g.rect(-W,eaveY,hL+W,H-eaveY); g.clip(); hzWallTex(g,'stone',L.wc,-W,eaveY,hL,H,rng); g.restore(); hzQuoins(g,L,-W,hL,eaveY+2,H-3,true);
  g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(hL-1.2,eaveY,1.2,H-eaveY);
  hzPlinth(g,L,-W,hL);
  g.fillStyle=hzLG(g,0,eaveY,0,eaveY+8,[[0,'rgba(10,6,4,.55)'],[1,'rgba(10,6,4,0)']]); g.fillRect(-W,eaveY,L.w,8);
  // hanging sign: an anvil on a board
  const bx=p2+1.6; g.strokeStyle='#22201e'; g.lineWidth=1; g.beginPath(); g.moveTo(bx,eaveY+5); g.lineTo(bx+12,eaveY+5); g.moveTo(bx+2.5,eaveY+5); g.lineTo(bx+2.5,eaveY+7); g.moveTo(bx+10,eaveY+5); g.lineTo(bx+10,eaveY+7); g.stroke();
  g.fillStyle='#5a3a22'; g.fillRect(bx+0.5,eaveY+7,11.5,9); g.fillStyle='#efe2c0'; g.fillRect(bx+1.5,eaveY+8,9.5,7); g.fillStyle='#2e2e34'; g.fillRect(bx+2.6,eaveY+9.6,7,1.8); g.fillRect(bx+4.6,eaveY+11.2,2.8,2); g.fillRect(bx+3.2,eaveY+13,5.6,1);
  // roof
  const ex=6, xl=-W-ex, xr=W+ex, topY=L.topY, ridgeY=L.ridgeY;
  hzPlane(g,L,[[xl,topY],[xr,topY],[xr,ridgeY],[xl,ridgeY]],[1,0,0,-1,0,ridgeY+topY],xl,xr,topY,ridgeY,0.62,0.12,rng,null);
  hzPlane(g,L,[[xl,ridgeY],[xr,ridgeY],[xr,eaveY],[xl,eaveY]],[1,0,0,1,0,0],xl,xr,ridgeY,eaveY,1,0,rng,hzLG(g,0,ridgeY,0,eaveY,[[0,'rgba(255,244,220,.05)'],[1,'rgba(0,0,0,.18)']]));
  g.save(); hzPoly(g,[[xl,topY],[xr,topY],[xr,eaveY],[xl,eaveY]]); g.clip(); for(let i=0;i<4;i++) hzSoot(g,hx+(rng()-0.3)*30,ridgeY+(rng()-0.5)*16,10+rng()*8); g.restore();
  g.fillStyle=hzTS(L.rc,-0.3); g.fillRect(xl,ridgeY-1.8,xr-xl,3.6); g.fillStyle=hzTS(L.rc,0.2); g.fillRect(xl,ridgeY-1.8,xr-xl,1);
  g.fillStyle=hzTS(L.rc,-0.5); g.fillRect(xl,eaveY-0.6,xr-xl,2.4);
  for(const [x,s] of [[xl,1],[xr,-1]]){ g.fillStyle='#3a2a1c'; g.fillRect(s>0?x:x-2,topY,2,eaveY-topY+1.5); }
  for(const c of L.chims) hzChimney(g,L,c,rng);
  hzExtra(g,L,{k:'firewood',x:-W*0.8},rng);
  g.strokeStyle='rgba(26,16,10,.55)'; g.lineWidth=0.8; g.strokeRect(-W,eaveY+1,L.w,H-eaveY-1);
}
// ---------- the Brindlecross Library: stone, columns, tall windows, a dome and a rose window
function hzDrawLibrary(g,hs,L,rng){
  const {W,H}=L, eaveY=L.eaveY, topY=L.topY, ridgeY=L.ridgeY, ex=6, xl=-W-ex, xr=W+ex, hi=Math.min(W*0.45,(eaveY-topY)*0.5);
  hzGround(g,L);
  hzFacade(g,L,[[-W,eaveY-1],[W,eaveY-1],[W,H],[-W,H]],-W,eaveY-1,W,H,rng,'ashlar',L.wc,false);
  hzQuoins(g,L,-W,W,eaveY+3,H-4);
  // string course and cornice
  const sc=H-34; g.fillStyle='#ddd0b0'; g.fillRect(-W,sc-1.6,L.w,3.2); g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(-W,sc+1.6,L.w,0.8);
  g.fillStyle='#e2d6b8'; g.fillRect(-W-1.5,eaveY,L.w+3,4); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-W-1.5,eaveY+4,L.w+3,1.2); for(let x=-W;x<W;x+=4) g.fillRect(x,eaveY+2.6,1.6,1.4);
  // tall arched windows on the wings
  const tw=9, tth=30; for(const x of [-W*0.83,-W*0.6,W*0.6,W*0.83]){
    const y0=H-12-tth; g.fillStyle='#b8aa88'; g.fillRect(x-tw/2-2,y0,tw+4,tth+2); g.beginPath(); g.arc(x,y0,tw/2+2,Math.PI,0); g.fill();
    g.fillStyle=hzLG(g,x-tw/2,y0-tw/2,x+tw/2,y0+tth,[[0,'#4a6280'],[1,'#1c2836']]); g.fillRect(x-tw/2,y0,tw,tth); g.beginPath(); g.arc(x,y0,tw/2,Math.PI,0); g.fill();
    g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x-tw/2+1,y0,1.4,tth);
    g.fillStyle='#d8ccae'; g.fillRect(x-0.5,y0-tw/2,1,tth+tw/2); for(let k=1;k<4;k++) g.fillRect(x-tw/2,y0+k*tth/4,tw,0.9);
    g.fillStyle='#e8dcc0'; g.fillRect(x-1.6,y0-tw/2-3,3.2,3); g.fillRect(x-tw/2-3,H-11.4,tw+6,2);
    for(let k=0;k<4;k++){ L.panes.push([x-tw/2+0.4,y0+k*tth/4+0.5,tw/2-0.9,tth/4-1.4],[x+0.5,y0+k*tth/4+0.5,tw/2-0.9,tth/4-1.4]); }
    L.glows.push([x,y0+tth/2,tth*0.7]);
  }
  hzIvy(g,-W+3,H,48,rng);
  hzPlinth(g,L,-W,W);
  g.fillStyle=hzLG(g,0,eaveY+5,0,eaveY+11,[[0,'rgba(10,6,4,.4)'],[1,'rgba(10,6,4,0)']]); g.fillRect(-W,eaveY+5,L.w,6);
  // roof: hipped slate
  const lr=hzLG(g,xl,0,xr,0,[[0,'rgba(255,244,220,.08)'],[1,'rgba(10,6,16,.14)']]);
  hzPlane(g,L,[[xl,topY],[xr,topY],[xr-hi,ridgeY],[xl+hi,ridgeY]],[1,0,0,-1,0,ridgeY+topY],xl,xr,topY,ridgeY,0.62,0.12,rng,lr);
  hzPlane(g,L,[[xl,topY],[xl+hi,ridgeY],[xl,eaveY]],[0,1,-1,0,0,0],topY,eaveY,-(xl+hi),-xl,0.8,0.15,rng,null);
  hzPlane(g,L,[[xr,topY],[xr-hi,ridgeY],[xr,eaveY]],[0,1,1,0,0,0],topY,eaveY,xr-hi,xr,0.8,-0.22,rng,null);
  hzPlane(g,L,[[xl+hi,ridgeY],[xr-hi,ridgeY],[xr,eaveY],[xl,eaveY]],[1,0,0,1,0,0],xl,xr,ridgeY,eaveY,1,0,rng,hzLG(g,0,ridgeY,0,eaveY,[[0,'rgba(255,244,220,.06)'],[1,'rgba(0,0,0,.16)']]));
  g.fillStyle=hzTS(L.rc,-0.3); g.fillRect(xl+hi,ridgeY-1.8,xr-xl-hi*2,3.6); g.fillStyle=hzTS(L.rc,0.25); g.fillRect(xl+hi,ridgeY-1.8,xr-xl-hi*2,1);
  g.fillStyle='#d8ccae'; g.fillRect(xl,eaveY-1.4,xr-xl,2.6);
  // dome on a drum behind the portico
  const dy=ridgeY+10, dr=20;
  g.fillStyle='rgba(10,6,4,.3)'; g.beginPath(); g.ellipse(6,dy+3,dr+6,6,0,0,TAU); g.fill();
  g.save(); g.beginPath(); g.rect(-dr,dy-11,dr*2,12); g.clip(); hzWallTex(g,'ashlar','#d4c4a0',-dr,dy-11,dr,dy+1,rng); g.fillStyle=hzLG(g,-dr,0,dr,0,[[0,'rgba(255,244,220,.15)'],[1,'rgba(10,6,16,.3)']]); g.fillRect(-dr,dy-11,dr*2,12); g.restore();
  for(const x of [-14,-7,0,7,14]){ g.fillStyle='#1c2836'; g.fillRect(x-1.6,dy-8,3.2,6); g.beginPath(); g.arc(x,dy-8,1.6,Math.PI,0); g.fill(); L.panes.push([x-1.3,dy-8,2.6,5.6]); }
  g.fillStyle='#e8dcc0'; g.fillRect(-dr-1.5,dy-12.5,dr*2+3,2.2);
  g.fillStyle=hzLG(g,-dr,dy-12-dr,dr*0.8,dy-12,[[0,'#a8d8c4'],[0.45,'#5e9a86'],[1,'#2e5a4e']]); g.beginPath(); g.ellipse(0,dy-12.5,dr,dr*0.85,0,Math.PI,0); g.fill();
  g.strokeStyle='rgba(20,50,40,.5)'; g.lineWidth=0.8; g.beginPath(); for(const k of [-0.75,-0.4,0,0.4,0.75]){ g.moveTo(k*dr,dy-12.5); g.quadraticCurveTo(k*dr*0.95,dy-12.5-dr*0.7,0,dy-12.5-dr*0.85); } g.stroke();
  g.fillStyle='rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-dr*0.45,dy-12.5-dr*0.45,dr*0.22,dr*0.12,-0.7,0,TAU); g.fill();
  const ty=dy-12.5-dr*0.85; g.fillStyle='#e8dcc0'; g.fillRect(-3,ty-6,6,6); g.fillStyle='#1c2836'; g.fillRect(-1.4,ty-5,2.8,4); g.fillStyle=hzTS('#5e9a86',-0.1); g.beginPath(); g.moveTo(-4,ty-6); g.lineTo(0,ty-10); g.lineTo(4,ty-6); g.fill(); hzEl(g,0,ty-11,1.4,1.4,'#e8b83a');
  if(L.snow){ g.fillStyle='rgba(246,249,252,.9)'; g.beginPath(); g.ellipse(-4,dy-12.5-dr*0.55,dr*0.6,dr*0.3,-0.3,0,TAU); g.fill(); }
  // portico: pediment with a rose window, frieze, columns, double door and steps
  const pw=80, pL=-pw/2, entY=eaveY+10, ay=eaveY-L.Gc;
  g.save(); g.beginPath(); g.rect(pL,entY,pw,H-entY); g.clip(); hzWallTex(g,'ashlar',hzT(L.wc,-0.12),pL,entY,pL+pw,H,rng); g.fillStyle='rgba(20,14,10,.28)'; g.fillRect(pL,entY,pw,H-entY); g.restore();
  hzFacade(g,L,[[pL-2,entY],[pL-2,eaveY],[0,ay],[-pL+2,eaveY],[-pL+2,entY]],pL-2,ay,-pL+2,entY,rng,'ashlar',hzT(L.wc,0.08),true);
  g.fillStyle='#e8dcc0'; g.fillRect(pL-3,entY-2,pw+6,3); g.fillRect(pL-3,eaveY-1.5,pw+6,3); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(pL-3,entY+1,pw+6,1);
  g.strokeStyle='#e8dcc0'; g.lineWidth=2.6; g.lineCap='round'; g.beginPath(); g.moveTo(pL-3,eaveY-1); g.lineTo(0,ay-2); g.lineTo(-pL+3,eaveY-1); g.stroke();
  g.strokeStyle='rgba(10,6,4,.35)'; g.lineWidth=1; g.beginPath(); g.moveTo(pL+1,eaveY+0.5); g.lineTo(0,ay+1); g.lineTo(-pL-1,eaveY+0.5); g.stroke();
  // rose window
  const rr0=8, ry=eaveY-L.Gc*0.42; g.fillStyle='#e8dcc0'; g.beginPath(); g.arc(0,ry,rr0+1.8,0,TAU); g.fill(); g.fillStyle='#1c2440'; g.beginPath(); g.arc(0,ry,rr0,0,TAU); g.fill();
  const rc=['#3a6ad8','#d84a4a','#e8b83a','#4aa86a']; for(let i=0;i<8;i++){ g.fillStyle=rc[i%4]; g.beginPath(); g.moveTo(0,ry); g.arc(0,ry,rr0-1,i/8*TAU,(i+0.7)/8*TAU); g.closePath(); g.fill(); }
  g.fillStyle='#e8b83a'; g.beginPath(); g.arc(0,ry,1.8,0,TAU); g.fill(); g.strokeStyle='#e8dcc0'; g.lineWidth=0.7; g.beginPath(); g.arc(0,ry,rr0-0.4,0,TAU); g.stroke();
  L.glows.push([0,ry,rr0*2.4]); L.panes.push([-rr0*0.5,ry-rr0*0.5,rr0,rr0]);
  // frieze with an open book
  const fy=entY-8; g.fillStyle='#e2d6b8'; g.fillRect(pL-2,fy,pw+4,6); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(pL-2,fy+5.4,pw+4,0.6);
  g.fillStyle='#5a3a22'; g.fillRect(-9,fy+0.4,18,5.4); g.fillStyle='#f4ead2'; g.beginPath(); g.moveTo(-8,fy+1.2); g.quadraticCurveTo(-4,fy+0.4,0,fy+1.6); g.quadraticCurveTo(4,fy+0.4,8,fy+1.2); g.lineTo(8,fy+5.2); g.quadraticCurveTo(4,fy+4.4,0,fy+5.6); g.quadraticCurveTo(-4,fy+4.4,-8,fy+5.2); g.closePath(); g.fill();
  g.strokeStyle='#8a2e22'; g.lineWidth=0.8; g.beginPath(); g.moveTo(0,fy+1.6); g.lineTo(0,fy+5.6); g.stroke(); g.strokeStyle='rgba(60,40,30,.5)'; g.lineWidth=0.4; g.beginPath(); for(let k=0;k<3;k++){ g.moveTo(-6.5,fy+2.4+k*1); g.lineTo(-1.5,fy+2.6+k*1); g.moveTo(1.5,fy+2.6+k*1); g.lineTo(6.5,fy+2.4+k*1); } g.stroke();
  // windows between the outer columns
  for(const s of [-1,1]){ const x=s*25, y0=H-36; g.fillStyle='#b8aa88'; g.fillRect(x-4.5,y0-1,9,24); g.fillStyle=hzLG(g,x-3,y0,x+3,y0+22,[[0,'#4a6280'],[1,'#1c2836']]); g.fillRect(x-3.2,y0,6.4,22); g.fillStyle='#d8ccae'; g.fillRect(x-0.4,y0,0.8,22); g.fillRect(x-3.2,y0+11,6.4,0.8); L.panes.push([x-3,y0+0.4,2.6,10.2],[x+0.4,y0+0.4,2.6,10.2],[x-3,y0+12,2.6,9.6],[x+0.4,y0+12,2.6,9.6]); L.glows.push([x,y0+11,16]); }
  // door
  const D=Object.assign({},L,{H:H-6,dw:20,dh:28,dkind:'double',dcol:hzC('#5a3020'),mat:null,fan:true,wall:'ashlar',trim:hzC('#e8dcc0'),st:'library'});
  hzDoor(g,D,rng);
  // columns
  for(const x of [-35,-15,15,35]){
    const ct=entY+1, cb=H-6; g.fillStyle='rgba(10,6,4,.3)'; g.fillRect(x+3,ct+2,3,cb-ct-2);
    g.fillStyle=hzLG(g,x-3,0,x+3,0,[[0,'#fbf4e2'],[0.5,'#e2d6b8'],[1,'#a89a7c']]); g.fillRect(x-3,ct,6,cb-ct);
    g.fillStyle='rgba(120,100,70,.35)'; for(const d of [-1.5,0,1.5]) g.fillRect(x+d-0.2,ct+2,0.5,cb-ct-4);
    g.fillStyle='#f4ead2'; g.fillRect(x-4.6,ct-1,9.2,2.6); g.fillRect(x-4.2,cb-2.4,8.4,2.4); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x-4.6,ct+1.4,9.2,0.6);
  }
  // steps
  for(const [y,wd,h2] of [[H-6,pw+2,2.2],[H-3.8,pw+8,2.2],[H-1.6,pw+14,3.4]]){ g.fillStyle='#d8ccb0'; g.fillRect(-wd/2,y,wd,h2*0.55); g.fillStyle='#a49a84'; g.fillRect(-wd/2,y+h2*0.55,wd,h2*0.45); }
  if(L.snow) hzDrifts(g,L,rng);
  g.strokeStyle='rgba(26,16,10,.5)'; g.lineWidth=0.8; g.strokeRect(-W,eaveY+1,L.w,H-eaveY-1);
}
let HZALL=false, HZGLOW=null;
function hzDrawHouse(g,hs,L,rng){
  if(L.st==='baker'){ L.awn=['#c8402e','#f2ead8']; L.goods=(g,x,y,w,h)=>{ for(let i=0;i<4;i++){ hzEl(g,x+3+i*(w-6)/3,y+h-2.6,2.4,1.5,'#c8843a'); hzEl(g,x+2.6+i*(w-6)/3,y+h-3.2,1.4,0.6,'#e8b060'); } hzEl(g,x+w*0.3,y+h-6,2.4,1.5,'#b0703a'); hzEl(g,x+w*0.7,y+h-6,2.6,1.5,'#c8843a'); }; }
  if(L.st==='tailor'){ L.awn=['#6a3a8a','#f2ead8']; L.goods=(g,x,y,w,h)=>{ const hc=['#3a6ad8','#d84a4a','#2e2e34']; for(let i=0;i<3;i++){ const cx=x+4+i*(w-8)/2, cy=y+h-3; hzEl(g,cx,cy+1,3.4,0.9,hc[i]); g.fillStyle=hc[i]; g.fillRect(cx-1.8,cy-3,3.6,3.6); g.fillStyle='#e8b040'; g.fillRect(cx-1.8,cy-0.6,3.6,0.8); } }; }
  if(L.st==='lamps'){ L.awn=['#2e5a4a','#e8d8a0']; L.goods=(g,x,y,w,h)=>{ for(let i=0;i<3;i++){ const cx=x+4+i*(w-8)/2; g.fillStyle='#2a2220'; g.fillRect(cx-0.3,y,0.6,2.4); g.fillStyle=['#ffcf5a','#ff8a5a','#9ae07a'][i]; g.fillRect(cx-1.6,y+2.4,3.2,4); } }; }
  if(L.vert) hzDrawVert(g,hs,L,rng); else hzDrawWide(g,hs,L,rng);
}
function houseSprite(hs){
  let c=SCACHE.get(hs);
  if(c&&c.burnt===!!hs.burnt&&c.snow===!!hs.snow) return c;
  if(c||(hs.L&&(hs.L.burnt!==!!hs.burnt||hs.L.snow!==!!hs.snow))) hs.L=null;
  if(!HZALL){ HZALL=true; for(const o of HOUSES) if(o!==hs) hzPlan(o); }
  const L=hzPlan(hs); L.panes=[]; L.glows=[]; L.burnt=!!hs.burnt; L.snow=!!hs.snow;
  c=mkCanvas((hs.w+HPX*2)*HSC,(hs.h+HPT+HPB)*HSC); const g=c.getContext('2d');
  g.scale(HSC,HSC); g.translate(HPX+L.W,HPT+L.H);
  const rng=mulberry32(L.seed2);
  if(L.st==='forge') hzDrawForge(g,hs,L,rng); else if(L.st==='library') hzDrawLibrary(g,hs,L,rng); else hzDrawHouse(g,hs,L,rng);
  hs.facade=true; hs.wins=L.panes; L.nl=undefined;
  c=hzCrop(c); c.ox=HPX+L.W-c.cx/HSC; c.oy=HPT+L.H-c.cy/HSC; c.sc=HSC; c.burnt=!!hs.burnt; c.snow=!!hs.snow; SCACHE.set(hs,c); return c;
}
// crop a freshly painted canvas to the pixels it actually uses, so every frame blits less empty space
function hzCrop(c){
  const w=c.width, h=c.height; let d;
  try{ d=c.getContext('2d').getImageData(0,0,w,h).data; }catch(e){ c.cx=0; c.cy=0; return c; }
  let x0=w,y0=-1,x1=-1,y1=-1;
  for(let y=0;y<h;y++){ const r=y*w*4; let a=-1,b=-1; for(let x=0;x<w;x++) if(d[r+x*4+3]>3){ a=x; break; } if(a<0) continue; for(let x=w-1;x>=a;x--) if(d[r+x*4+3]>3){ b=x; break; } if(y0<0) y0=y; y1=y; if(a<x0) x0=a; if(b>x1) x1=b; }
  if(y0<0){ c.cx=0; c.cy=0; return c; }
  x0=Math.max(0,x0-1); y0=Math.max(0,y0-1); x1=Math.min(w-1,x1+1); y1=Math.min(h-1,y1+1);
  const o=mkCanvas(x1-x0+1,y1-y0+1); o.getContext('2d').drawImage(c,-x0,-y0); o.cx=x0; o.cy=y0; return o;
}
function hzGlow(){ if(!HZGLOW){ HZGLOW=mkCanvas(32,32); const q=HZGLOW.getContext('2d'), gr=q.createRadialGradient(16,16,0,16,16,16); gr.addColorStop(0,'rgba(255,200,110,1)'); gr.addColorStop(0.35,'rgba(255,170,80,.45)'); gr.addColorStop(1,'rgba(255,140,60,0)'); q.fillStyle=gr; q.fillRect(0,0,32,32); } return HZGLOW; }
// warm window light at dusk and night: the lit panes and a soft halo per window are baked once into a small
// layer per house, then blitted with one drawImage whose alpha follows the dusk and a slow candle flicker
function hzNightLayer(L){
  if(!L.panes.length) return null;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const p of L.panes){ x0=Math.min(x0,p[0]); y0=Math.min(y0,p[1]); x1=Math.max(x1,p[0]+p[2]); y1=Math.max(y1,p[1]+p[3]); }
  for(const q of L.glows){ x0=Math.min(x0,q[0]-q[2]); y0=Math.min(y0,q[1]-q[2]); x1=Math.max(x1,q[0]+q[2]); y1=Math.max(y1,q[1]+q[2]); }
  x0=Math.floor(x0)-1; y0=Math.floor(y0)-1; x1=Math.ceil(x1)+1; y1=Math.ceil(y1)+1;
  const c=mkCanvas((x1-x0)*HSC,(y1-y0)*HSC), g=c.getContext('2d'), GL=hzGlow(); g.scale(HSC,HSC); g.translate(-x0,-y0);
  g.globalCompositeOperation='lighter'; g.globalAlpha=0.5; for(const q of L.glows) g.drawImage(GL,q[0]-q[2],q[1]-q[2],q[2]*2,q[2]*2);
  g.globalCompositeOperation='source-over'; g.globalAlpha=1; g.fillStyle='rgb(255,208,122)'; g.beginPath(); for(const p of L.panes) g.rect(p[0],p[1],p[2],p[3]); g.fill();
  g.fillStyle='rgba(255,246,214,.55)'; g.beginPath(); for(const p of L.panes) g.rect(p[0]+p[2]*0.2,p[1]+p[3]*0.2,p[2]*0.45,p[3]*0.45); g.fill();
  c.ox=-x0; c.oy=-y0; return c;
}
function hzNight(g,L,ox,oy,S,k,t){
  if(!L) return; if(L.nl===undefined) L.nl=hzNightLayer(L); const n=L.nl; if(!n) return;
  g.globalAlpha=Math.min(1,k*(0.9+0.1*Math.sin(t*2.3+ox*0.013))); g.drawImage(n,ox-n.ox*S,oy-n.oy*S,n.width/HSC*S,n.height/HSC*S); g.globalAlpha=1;
}
function drawHouseStruct(s,t){
  const c=houseSprite(s); ctx.drawImage(c,s.x-c.ox,s.y-c.oy,c.width/HSC,c.height/HSC);
  const dl=daylight(); if(dl<0.5) hzNight(ctx,s.L,s.x,s.y,1,clamp((0.5-dl)/0.3,0,1),t);
}
function drawStruct(s,t){
  switch(s.k){
    case 'house': drawHouseStruct(s,t); break;
    case 'well':{ const gr=ctx.createRadialGradient(s.x-6,s.y-6,4,s.x,s.y,24); gr.addColorStop(0,'#a59c90'); gr.addColorStop(1,'#5a544c'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(s.x,s.y,24,0,TAU); ctx.fill(); ctx.fillStyle='#1d3440'; ctx.beginPath(); ctx.arc(s.x,s.y,14,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; for(let a=0;a<TAU;a+=0.5){ ctx.beginPath(); ctx.moveTo(s.x+Math.cos(a)*15,s.y+Math.sin(a)*15); ctx.lineTo(s.x+Math.cos(a)*24,s.y+Math.sin(a)*24); ctx.stroke(); } ctx.fillStyle='#5a3a22'; ctx.fillRect(s.x-26,s.y-3,52,6); break; }
    case 'torch':{ const nt=G&&isNight(); ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(s.x+3,s.y+3,6,3,0,0,TAU); ctx.fill(); ctx.fillStyle='#3a2a1a'; ctx.fillRect(s.x-2,s.y-16,4,18); ctx.fillStyle='#2a2a30'; ctx.fillRect(s.x-5,s.y-26,10,11); ctx.fillStyle=nt?'#ffd27a':'#7a6a50'; ctx.fillRect(s.x-3,s.y-24,6,7); ctx.fillStyle='#1a1a20'; ctx.beginPath(); ctx.moveTo(s.x-6,s.y-26); ctx.lineTo(s.x,s.y-31); ctx.lineTo(s.x+6,s.y-26); ctx.fill(); if(nt){ glowAt(s.x,s.y-20,26,'255,200,110',0.45); if(Math.random()<0.15) emit(s.x,s.y-22,1,{kind:'fire',ang:-Math.PI/2,spread:0.3,smin:8,smax:20,lmin:.2,lmax:.4,zmin:1.5,zmax:2.5,grow:2,drag:1}); } break; }
    case 'stake':{ ctx.fillStyle='#4a3420'; ctx.beginPath(); ctx.arc(s.x,s.y,9,0,TAU); ctx.fill(); ctx.fillStyle='#8a6a42'; ctx.beginPath(); ctx.arc(s.x-1.5,s.y-1.5,5,0,TAU); ctx.fill(); ctx.fillStyle='#2a1c10'; ctx.beginPath(); ctx.arc(s.x,s.y,1.8,0,TAU); ctx.fill(); break; }
    case 'tent':{ ctx.save(); ctx.translate(s.x,s.y); const gr=ctx.createRadialGradient(-10,-10,4,0,0,s.r); gr.addColorStop(0,'#b08a5a'); gr.addColorStop(1,'#5a4026'); ctx.fillStyle=gr; ctx.beginPath(); for(let i=0;i<8;i++){ const a=i/8*TAU+s.a; i?ctx.lineTo(Math.cos(a)*s.r,Math.sin(a)*s.r):ctx.moveTo(Math.cos(a)*s.r,Math.sin(a)*s.r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(40,25,10,.55)'; ctx.lineWidth=1.5; for(let i=0;i<8;i++){ const a=i/8*TAU+s.a; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*s.r,Math.sin(a)*s.r); ctx.stroke(); } ctx.fillStyle='#2a1c10'; ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill(); ctx.restore(); break; }
    case 'campfire':{ const r=s.small?14:22; ctx.fillStyle='#4a4440'; for(let a=0;a<TAU;a+=0.7){ ctx.beginPath(); ctx.arc(s.x+Math.cos(a)*r,s.y+Math.sin(a)*r,4,0,TAU); ctx.fill(); } ctx.strokeStyle='#3a2414'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(s.x-r*0.6,s.y-r*0.3); ctx.lineTo(s.x+r*0.6,s.y+r*0.3); ctx.moveTo(s.x-r*0.5,s.y+r*0.4); ctx.lineTo(s.x+r*0.5,s.y-r*0.4); ctx.stroke(); const gl=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,r); gl.addColorStop(0,'rgba(255,200,90,.9)'); gl.addColorStop(1,'rgba(255,90,20,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(s.x,s.y,r,0,TAU); ctx.fill(); if(Math.random()<0.5) emit(s.x+rand(-5,5),s.y+rand(-5,5),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.4,lmax:.7,zmin:3,zmax:6,grow:5,drag:1}); break; }
    case 'stone':{ ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.a); const k=s.s; const gr=ctx.createLinearGradient(-14*k,-20*k,14*k,20*k); gr.addColorStop(0,'#9a958c'); gr.addColorStop(1,'#4a4640'); ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(0,0,14*k,22*k,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(120,140,80,.4)'; ctx.beginPath(); ctx.arc(-4*k,-6*k,4*k,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(200,60,40,.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-4,0); ctx.lineTo(4,-6); ctx.lineTo(4,6); ctx.stroke(); if(s.snow){ ctx.fillStyle='rgba(242,246,250,.9)'; ctx.beginPath(); ctx.ellipse(-3*k,-8*k,10*k,12*k,0,0,TAU); ctx.fill(); } ctx.restore(); break; }
    case 'altar':{ const gr=ctx.createLinearGradient(s.x-42,s.y-26,s.x+42,s.y+26); gr.addColorStop(0,'#5a5258'); gr.addColorStop(1,'#26222a'); ctx.fillStyle=gr; ctx.fillRect(s.x-42,s.y-26,84,52); ctx.strokeStyle=`rgba(255,80,40,${0.5+0.3*Math.sin(t*2)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(s.x-26,s.y); ctx.quadraticCurveTo(s.x,s.y-18,s.x+26,s.y); ctx.quadraticCurveTo(s.x,s.y+18,s.x-26,s.y); ctx.stroke(); ctx.beginPath(); ctx.ellipse(s.x,s.y,3,9,0,0,TAU); ctx.stroke(); break; }
    case 'brazier':{ ctx.fillStyle='#1a1616'; ctx.beginPath(); ctx.arc(s.x,s.y,14,0,TAU); ctx.fill(); ctx.strokeStyle='#4a4040'; ctx.lineWidth=2; ctx.stroke(); const gl=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,11); gl.addColorStop(0,'#ffe2a0'); gl.addColorStop(0.5,'#ff7a2a'); gl.addColorStop(1,'#5a1a08'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(s.x,s.y,10,0,TAU); ctx.fill(); if(Math.random()<0.6) emit(s.x+rand(-4,4),s.y+rand(-4,4),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:15,smax:50,lmin:.4,lmax:.7,zmin:3,zmax:6,grow:4,drag:1}); break; }
    case 'boulder':{ const L=SPR.crag; drawSprite(L[s.v%L.length],s.x,s.y,s.s*1.2,0); break; }
    case 'pillar':{ ctx.save(); ctx.translate(s.x,s.y); const r=30; const oct=k=>{ ctx.beginPath(); for(let i=0;i<8;i++){ const a=i/8*TAU+Math.PI/8; i?ctx.lineTo(Math.cos(a)*r*k,Math.sin(a)*r*k):ctx.moveTo(Math.cos(a)*r*k,Math.sin(a)*r*k); } ctx.closePath(); }; const gr=ctx.createLinearGradient(-r,-r,r,r); gr.addColorStop(0,'#4a4454'); gr.addColorStop(1,'#16131c'); ctx.fillStyle=gr; oct(1); ctx.fill(); ctx.fillStyle=s.broken?'#2a2632':'#3a3546'; oct(0.78); ctx.fill(); ctx.strokeStyle=`rgba(255,130,50,${0.35+0.2*Math.sin(t*2+s.x)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,r*0.6,0,TAU); ctx.stroke(); ctx.restore(); break; }
    case 'throne':{ ctx.save(); ctx.translate(s.x,s.y); const gr=ctx.createLinearGradient(-80,-40,80,40); gr.addColorStop(0,'#3a3040'); gr.addColorStop(1,'#08060a'); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(-80,-40); ctx.lineTo(80,-40); ctx.lineTo(64,40); ctx.lineTo(-64,40); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(212,160,70,.55)'; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='#120e14'; ctx.fillRect(-46,-24,92,46); for(const sx of [-1,1]){ ctx.fillStyle='#2a2430'; ctx.beginPath(); ctx.moveTo(sx*70,-40); ctx.lineTo(sx*96,-90); ctx.lineTo(sx*54,-40); ctx.closePath(); ctx.fill(); } ctx.restore(); break; }
    case 'arena':{ ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.a+Math.PI/2); if(s.gate){ if(G&&G.mode==='normal'){ ctx.fillStyle='#3a2a1a'; ctx.fillRect(-24,-6,48,12); ctx.strokeStyle='#6a5030'; ctx.lineWidth=2; for(let x=-20;x<=20;x+=8){ ctx.beginPath(); ctx.moveTo(x,-6); ctx.lineTo(x,6); ctx.stroke(); } } } else { const gr=ctx.createLinearGradient(-26,-16,26,16); gr.addColorStop(0,'#a89a86'); gr.addColorStop(1,'#5a5044'); ctx.fillStyle=gr; ctx.fillRect(-25,-15,50,30); ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=1; ctx.strokeRect(-25,-15,50,30); ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(0,15); ctx.stroke(); } ctx.restore(); break; }
    case 'ward':{
      const lit=G&&G.wards&&G.wards[s.id], heat=G&&G.wardHeat?G.wardHeat[s.id]||0:0;
      ctx.save(); ctx.translate(s.x,s.y);
      const hex=r=>{ ctx.beginPath(); for(let i=0;i<6;i++){ const a=i/6*TAU+Math.PI/6; i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); };
      let gr=ctx.createLinearGradient(-34,-34,34,34); gr.addColorStop(0,'#9a948c'); gr.addColorStop(1,'#3e3a36'); ctx.fillStyle=gr; hex(34); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=1.5; ctx.stroke();
      gr=ctx.createLinearGradient(-22,-22,22,22); gr.addColorStop(0,'#6a645e'); gr.addColorStop(1,'#2a2622'); ctx.fillStyle=gr; hex(22); ctx.fill();
      ctx.fillStyle='#141010'; ctx.beginPath(); ctx.arc(0,0,12,0,TAU); ctx.fill();
      const rc=lit?`rgba(255,${180+Math.sin(t*3)*30|0},90,.95)`:heat>0?`rgba(255,${120+heat*80|0},60,${0.4+heat*0.5})`:`rgba(130,170,215,${0.35+0.15*Math.sin(t*1.5+s.x)})`;
      ctx.strokeStyle=rc; ctx.lineWidth=2;
      for(let i=0;i<6;i++){ const a=i/6*TAU; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(26,-4); ctx.lineTo(29,0); ctx.lineTo(26,4); ctx.moveTo(24,0); ctx.lineTo(30,0); ctx.stroke(); ctx.restore(); }
      if(lit||heat>0){
        const k=lit?1:heat;
        ctx.globalCompositeOperation='lighter';
        const gl=ctx.createRadialGradient(0,0,0,0,0,70*k+10); gl.addColorStop(0,`rgba(255,190,90,${0.55*k})`); gl.addColorStop(1,'rgba(255,110,40,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,70*k+10,0,TAU); ctx.fill();
        const fl=ctx.createRadialGradient(0,0,0,0,0,11); fl.addColorStop(0,'#fff2c0'); fl.addColorStop(0.5,`rgba(255,150,50,${k})`); fl.addColorStop(1,'rgba(200,50,10,0)'); ctx.fillStyle=fl; ctx.beginPath(); ctx.arc(0,0,11,0,TAU); ctx.fill();
        ctx.globalCompositeOperation='source-over';
        if(lit&&Math.random()<0.7) emit(s.x+rand(-5,5),s.y+rand(-5,5),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.4,lmax:.8,zmin:3,zmax:7,grow:5,drag:1});
      }
      ctx.restore(); break; }
    case 'lantern':{
      const lit=s.ref.lit;
      ctx.fillStyle='#3a2a1a'; ctx.fillRect(s.x-1.5,s.y-1.5,3,14);
      ctx.save(); ctx.translate(s.x,s.y);
      ctx.fillStyle=lit?'#ffb54a':'#c9b393'; ctx.beginPath(); ctx.ellipse(0,0,9,10,0,0,TAU); ctx.fill();
      ctx.strokeStyle=lit?'rgba(170,60,20,.8)':'rgba(110,80,50,.7)'; ctx.lineWidth=1; for(const dx of [-5,0,5]){ ctx.beginPath(); ctx.ellipse(dx*0.4,0,Math.abs(dx)*0.9+1.5,10,0,0,TAU); ctx.stroke(); }
      ctx.fillStyle='#4a2a14'; ctx.fillRect(-5,-11,10,3); ctx.fillRect(-4,9,8,2.5);
      if(lit){ ctx.globalCompositeOperation='lighter'; const gl=ctx.createRadialGradient(0,0,0,0,0,34); gl.addColorStop(0,`rgba(255,180,80,${0.5+0.1*Math.sin(t*5+s.x)})`); gl.addColorStop(1,'rgba(255,120,40,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,34,0,TAU); ctx.fill(); }
      else if(G&&G.flags&&G.flags.forge&&!G.flags.lanterns){ ctx.strokeStyle=`rgba(255,220,140,${0.4+0.4*Math.sin(t*4)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,16,0,TAU); ctx.stroke(); }
      ctx.restore(); break; }
    case 'bigoak':{
      ctx.save(); ctx.translate(s.x,s.y); ctx.fillStyle='#3a2816';
      for(let i=0;i<6;i++){ const a=i/6*TAU+0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a-0.25)*14,Math.sin(a-0.25)*14); ctx.quadraticCurveTo(Math.cos(a)*30,Math.sin(a)*30,Math.cos(a)*40,Math.sin(a)*40); ctx.quadraticCurveTo(Math.cos(a)*26,Math.sin(a)*26,Math.cos(a+0.25)*14,Math.sin(a+0.25)*14); ctx.fill(); }
      const gr=ctx.createRadialGradient(-5,-5,2,0,0,22); gr.addColorStop(0,'#6a4a2a'); gr.addColorStop(1,'#2e1e10'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,21,0,TAU); ctx.fill();
      ctx.restore(); bigOakTrunk(s); break; }
    case 'forge':{
      drawHouseStruct(s,t);
      const L=s.L; if(L&&L.hearth){ const [hx,hy,hw]=L.hearth, gl=hzGlow(); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.32+0.12*Math.sin(t*7.3)+0.07*Math.sin(t*17.1); ctx.drawImage(gl,s.x+hx-hw*1.3,s.y+hy-hw,hw*2.6,hw*2); ctx.restore();
        if(Math.random()<0.22) emit(s.x+hx+rand(-6,6),s.y+hy+2,1,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:15,smax:45,lmin:.25,lmax:.45,zmin:2,zmax:3,grow:2,drag:1}); }
      break; }
    case 'library': drawHouseStruct(s,t); break;
    case 'stall':{
      ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.a+Math.PI/2);
      ctx.fillStyle='#5a3e24'; ctx.fillRect(-20,6,40,8);
      for(let i=0;i<5;i++){ ctx.fillStyle=i%2?'#efe6d6':s.col; ctx.fillRect(-22+i*8.8,-14,8.8,22); }
      ctx.fillStyle='rgba(0,0,0,.2)'; ctx.fillRect(-22,4,44,4);
      ctx.fillStyle=pick2(s,['#d94a3a','#e8b040','#6aa040']); for(let i=0;i<4;i++){ ctx.beginPath(); ctx.arc(-14+i*9,10,2.6,0,TAU); ctx.fill(); }
      ctx.restore(); break; }
    case 'post':{ ctx.fillStyle='#3a2c1a'; ctx.beginPath(); ctx.arc(s.x,s.y,8,0,TAU); ctx.fill(); ctx.fillStyle='#6a5232'; ctx.beginPath(); ctx.arc(s.x-1.5,s.y-1.5,5,0,TAU); ctx.fill(); ctx.fillStyle='rgba(90,130,50,.7)'; ctx.beginPath(); ctx.arc(s.x+3,s.y+2,3,0,TAU); ctx.fill(); break; }
    case 'hut':{
      ctx.save(); ctx.translate(s.x,s.y);
      const gr=ctx.createRadialGradient(-12,-12,4,0,0,s.r+4); gr.addColorStop(0,'#a8945a'); gr.addColorStop(1,'#4e4024'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,s.r+4,0,TAU); ctx.fill();
      ctx.strokeStyle='rgba(50,36,18,.55)'; ctx.lineWidth=1.2; for(let i=0;i<40;i++){ const a=i/40*TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a)*6,Math.sin(a)*6); ctx.lineTo(Math.cos(a+0.06)*(s.r+4),Math.sin(a+0.06)*(s.r+4)); ctx.stroke(); }
      ctx.fillStyle='#3a2c16'; ctx.beginPath(); ctx.arc(0,0,7,0,TAU); ctx.fill();
      ctx.fillStyle='#2a1c10'; ctx.fillRect(-9,s.r-2,18,10);
      ctx.restore();
      if(Math.random()<0.08) emit(s.x,s.y,1,{alpha:0.35,col:'150,160,140',glow:false,ang:-Math.PI/2+0.3,spread:0.3,smin:12,smax:30,lmin:2,lmax:3,zmin:4,zmax:7,grow:8,drag:0.3});
      break; }
    case 'cauldron':{
      ctx.fillStyle='#141214'; ctx.beginPath(); ctx.arc(s.x,s.y,16,0,TAU); ctx.fill(); ctx.strokeStyle='#3a3640'; ctx.lineWidth=2.5; ctx.stroke();
      const gl=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,12); gl.addColorStop(0,'#b8e870'); gl.addColorStop(1,'#3e7a2a'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(s.x,s.y,12,0,TAU); ctx.fill();
      ctx.fillStyle='rgba(230,255,190,.7)'; for(let i=0;i<3;i++){ const a=t*1.3+i*2.1; ctx.beginPath(); ctx.arc(s.x+Math.cos(a)*6,s.y+Math.sin(a*1.3)*5,1.5+((t*2+i)%1)*2,0,TAU); ctx.fill(); }
      if(Math.random()<0.2) emit(s.x,s.y,1,{alpha:0.4,col:'190,220,170',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:25,lmin:1.2,lmax:2,zmin:3,zmax:6,grow:7,drag:0.4});
      break; }
    case 'ore':{
      const taken=G&&G.ores&&G.ores[s.ref.id];
      ctx.save(); ctx.translate(s.x,s.y);
      ctx.fillStyle='#3e3a40'; ctx.beginPath(); ctx.ellipse(0,2,18,14,0,0,TAU); ctx.fill();
      if(!taken){
        const sh=[[-8,-2,0.4],[4,-6,-0.3],[8,4,0.9],[-4,6,2.2],[0,0,-1.2]];
        for(const [x,y,a] of sh){ ctx.save(); ctx.translate(x,y); ctx.rotate(a); const gr=ctx.createLinearGradient(0,-3,0,3); gr.addColorStop(0,'#cfe8ff'); gr.addColorStop(0.5,'#5aa0f0'); gr.addColorStop(1,'#1e3a8a'); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(0,-3.5); ctx.lineTo(11,0); ctx.lineTo(0,3.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
        ctx.globalCompositeOperation='lighter'; const gl=ctx.createRadialGradient(0,0,0,0,0,34); gl.addColorStop(0,`rgba(120,180,255,${0.35+0.15*Math.sin(t*3+s.x)})`); gl.addColorStop(1,'rgba(80,140,255,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,34,0,TAU); ctx.fill();
      } else { ctx.fillStyle='#2a262c'; ctx.beginPath(); ctx.arc(-3,0,6,0,TAU); ctx.arc(5,3,4,0,TAU); ctx.fill(); }
      ctx.restore(); break; }
    case 'shrine':{
      const on=G&&G.shrines&&G.shrines[s.ref.id];
      ctx.save(); ctx.translate(s.x,s.y);
      const gr=ctx.createLinearGradient(-18,-18,18,18); gr.addColorStop(0,'#8a8890'); gr.addColorStop(1,'#34323a'); ctx.fillStyle=gr; ctx.fillRect(-18,-18,36,36);
      ctx.fillStyle='#5a5862'; ctx.beginPath(); ctx.moveTo(-12,-12); ctx.lineTo(12,-12); ctx.lineTo(0,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='#46444e'; ctx.beginPath(); ctx.moveTo(12,-12); ctx.lineTo(12,12); ctx.lineTo(0,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='#3a3842'; ctx.beginPath(); ctx.moveTo(12,12); ctx.lineTo(-12,12); ctx.lineTo(0,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='#6e6c76'; ctx.beginPath(); ctx.moveTo(-12,12); ctx.lineTo(-12,-12); ctx.lineTo(0,0); ctx.closePath(); ctx.fill();
      const glow=on?`rgba(255,${190+Math.sin(t*3)*30|0},90,.95)`:'rgba(130,160,190,.6)';
      ctx.strokeStyle=glow; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-6,0); ctx.quadraticCurveTo(0,-7,6,0); ctx.quadraticCurveTo(0,7,-6,0); ctx.stroke();
      if(on){ ctx.globalCompositeOperation='lighter'; const gl=ctx.createRadialGradient(0,0,0,0,0,40); gl.addColorStop(0,'rgba(255,170,70,.35)'); gl.addColorStop(1,'rgba(255,120,40,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,40,0,TAU); ctx.fill(); }
      ctx.restore(); break; }
  }
}
let wallPattern=null;
function drawWall(){
  if(!wallPattern){ const c=mkCanvas(64,52), g=c.getContext('2d'); g.fillStyle='#1c1a22'; g.fillRect(0,0,64,52); for(let r=0;r<2;r++) for(let i=-1;i<3;i++){ const x=i*32+(r%2)*16, y=r*26; const gr=g.createLinearGradient(x,y,x+30,y+24); gr.addColorStop(0,'#3e3a48'); gr.addColorStop(1,'#24212b'); g.fillStyle=gr; g.fillRect(x+1,y+1,30,24); } wallPattern=ctx.createPattern(c,'repeat'); }
  const x0=Math.max(0,cam.x-100), x1=Math.min(WORLD.w,cam.x+W/zoom+100);
  if(WALL_Y+80<cam.y||WALL_Y-80>cam.y+H/zoom) return;
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(x0,WALL_Y+26,x1-x0,26);
  if(DV.on){ drawWallDepth(x0,x1); return; }
  ctx.fillStyle=wallPattern;
  const seg=(a,b)=>{ if(b<x0||a>x1) return; ctx.fillRect(Math.max(a,x0),WALL_Y-26,Math.min(b,x1)-Math.max(a,x0),52); };
  seg(0,GATE_X0-80); seg(GATE_X1+80,WORLD.w);
  ctx.fillStyle='#4a4656'; for(let x=Math.floor(x0/40)*40;x<x1;x+=40){ if(x>GATE_X0-90&&x<GATE_X1+80) continue; ctx.fillRect(x,WALL_Y-30,22,10); }
  for(const tx of [GATE_X0-80,GATE_X1]){ const gr=ctx.createLinearGradient(tx,WALL_Y-60,tx+80,WALL_Y+60); gr.addColorStop(0,'#4a4656'); gr.addColorStop(1,'#16141c'); ctx.fillStyle=gr; ctx.fillRect(tx,WALL_Y-60,80,120); ctx.strokeStyle='rgba(255,120,50,.35)'; ctx.lineWidth=2; ctx.strokeRect(tx+10,WALL_Y-50,60,100); }
  if(GATE_COL&&!GATE_COL.off){ ctx.fillStyle='#14121a'; ctx.fillRect(GATE_X0,WALL_Y-20,GATE_X1-GATE_X0,40); ctx.strokeStyle='#5a5466'; ctx.lineWidth=3; for(let x=GATE_X0+8;x<GATE_X1;x+=14){ ctx.beginPath(); ctx.moveTo(x,WALL_Y-20); ctx.lineTo(x,WALL_Y+20); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(GATE_X0,WALL_Y); ctx.lineTo(GATE_X1,WALL_Y); ctx.stroke(); }
}
function drawChest(c,t){
  ctx.save(); ctx.translate(c.x,c.y);
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(-13,-6,30,20);
  const gr=ctx.createLinearGradient(0,-10,0,10); gr.addColorStop(0,'#8a5a2c'); gr.addColorStop(1,'#4a2c14'); ctx.fillStyle=gr; ctx.fillRect(-15,-10,30,20);
  ctx.fillStyle='#b8a070'; ctx.fillRect(-15,-10,30,3); ctx.fillRect(-15,7,30,3); ctx.fillRect(-2,-10,4,20);
  if(c.open){ ctx.fillStyle='#120a04'; ctx.fillRect(-12,-7,24,14); }
  else{ ctx.globalCompositeOperation='lighter'; const a=0.25+0.2*Math.sin(t*3+c.x); const gl=ctx.createRadialGradient(0,0,0,0,0,30); gl.addColorStop(0,`rgba(255,210,120,${a})`); gl.addColorStop(1,'rgba(255,170,60,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,30,0,TAU); ctx.fill(); }
  ctx.restore();
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{houseSprite,drawStruct,HOUSES,STRUCTS,LIGHTS,AREADEFS,houseNight:(g,h,x,y,S,k)=>hzNight(g,hzPlan(h),x,y,S,k,0)});
