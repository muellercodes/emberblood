
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
  if(!p.sp) p.sp=L[p.v%L.length];
  return p.sp;
}
function drawSprite(sp,x,y,scale,rot){
  const h=sp.half*scale;
  if(rot){ ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.drawImage(sp,-h,-h,h*2,h*2); ctx.restore(); }
  else ctx.drawImage(sp,x-h,y-h,h*2,h*2);
}

// ================= structures
const SCACHE=new Map();
function houseSprite(hs){
  let c=SCACHE.get(hs); if(c) return c;
  const rng=mulberry32(hs.seed), pad=14, w=hs.w, h=hs.h;
  c=mkCanvas((w+pad*2)*1.5,(h+pad*2)*1.5); const g=c.getContext('2d'); g.scale(1.5,1.5); g.translate(pad+w/2,pad+h/2);
  const long=w>=h, base=hexRGB(hs.roof), lit=`rgb(${mixRGB(base,[255,240,210],0.25).map(Math.round)})`, shd=`rgb(${mixRGB(base,[0,0,0],0.4).map(Math.round)})`;
  g.fillStyle='#3a2a1c'; g.fillRect(-w/2-4,-h/2-4,w+8,h+8);
  if(long){
    let gr=g.createLinearGradient(0,-h/2,0,0); gr.addColorStop(0,shd); gr.addColorStop(1,hs.roof); g.fillStyle=gr; g.fillRect(-w/2-4,-h/2-4,w+8,h/2+4);
    gr=g.createLinearGradient(0,0,0,h/2); gr.addColorStop(0,lit); gr.addColorStop(1,hs.roof); g.fillStyle=gr; g.fillRect(-w/2-4,0,w+8,h/2+4);
    g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1; for(let y=-h/2;y<h/2;y+=5){ g.beginPath(); g.moveTo(-w/2-4,y); g.lineTo(w/2+4,y); g.stroke(); }
    g.strokeStyle='rgba(0,0,0,.45)'; g.lineWidth=3; g.beginPath(); g.moveTo(-w/2-4,0); g.lineTo(w/2+4,0); g.stroke();
  }else{
    let gr=g.createLinearGradient(-w/2,0,0,0); gr.addColorStop(0,shd); gr.addColorStop(1,hs.roof); g.fillStyle=gr; g.fillRect(-w/2-4,-h/2-4,w/2+4,h+8);
    gr=g.createLinearGradient(0,0,w/2,0); gr.addColorStop(0,lit); gr.addColorStop(1,hs.roof); g.fillStyle=gr; g.fillRect(0,-h/2-4,w/2+4,h+8);
    g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1; for(let x=-w/2;x<w/2;x+=5){ g.beginPath(); g.moveTo(x,-h/2-4); g.lineTo(x,h/2+4); g.stroke(); }
    g.strokeStyle='rgba(0,0,0,.45)'; g.lineWidth=3; g.beginPath(); g.moveTo(0,-h/2-4); g.lineTo(0,h/2+4); g.stroke();
  }
  const chx=(rng()-0.5)*w*0.5, chy=(rng()-0.5)*h*0.5; hs.chim=[hs.x+chx,hs.y+chy];
  g.fillStyle='#6a625a'; g.fillRect(chx-6,chy-6,12,12); g.fillStyle='#2a2420'; g.fillRect(chx-3,chy-3,6,6);
  if(hs.burnt){
    for(let i=0;i<4;i++){ const x=(rng()-0.5)*w*0.8, y=(rng()-0.5)*h*0.8, r=12+rng()*18; const gr=g.createRadialGradient(x,y,1,x,y,r); gr.addColorStop(0,'rgba(10,6,4,.95)'); gr.addColorStop(1,'rgba(10,6,4,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
    const x=(rng()-0.5)*w*0.4, y=(rng()-0.5)*h*0.4; g.fillStyle='#0c0806'; g.beginPath(); g.ellipse(x,y,14,10,rng(),0,TAU); g.fill(); g.strokeStyle='#4a3020'; g.lineWidth=2; for(let k=-12;k<=12;k+=6){ g.beginPath(); g.moveTo(x+k,y-10); g.lineTo(x+k,y+10); g.stroke(); }
  }
  if(hs.snow){ g.globalCompositeOperation='source-atop'; for(let i=0;i<40;i++){ g.fillStyle=rng()<0.7?'rgba(242,246,250,.92)':'rgba(205,218,232,.85)'; g.beginPath(); g.ellipse((rng()-0.5)*w,(rng()-0.5)*h,8+rng()*18,5+rng()*10,rng()*3,0,TAU); g.fill(); } g.globalCompositeOperation='source-over'; }
  c.ox=pad+w/2; c.oy=pad+h/2; SCACHE.set(hs,c); return c;
}
function drawStruct(s,t){
  switch(s.k){
    case 'house':{ const c=houseSprite(s); ctx.drawImage(c,s.x-c.ox,s.y-c.oy,c.width/1.5,c.height/1.5); break; }
    case 'well':{ const gr=ctx.createRadialGradient(s.x-6,s.y-6,4,s.x,s.y,24); gr.addColorStop(0,'#a59c90'); gr.addColorStop(1,'#5a544c'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(s.x,s.y,24,0,TAU); ctx.fill(); ctx.fillStyle='#1d3440'; ctx.beginPath(); ctx.arc(s.x,s.y,14,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; for(let a=0;a<TAU;a+=0.5){ ctx.beginPath(); ctx.moveTo(s.x+Math.cos(a)*15,s.y+Math.sin(a)*15); ctx.lineTo(s.x+Math.cos(a)*24,s.y+Math.sin(a)*24); ctx.stroke(); } ctx.fillStyle='#5a3a22'; ctx.fillRect(s.x-26,s.y-3,52,6); break; }
    case 'torch':{ ctx.fillStyle='#3a2a1a'; ctx.beginPath(); ctx.arc(s.x,s.y,4,0,TAU); ctx.fill(); if(G&&isNight()&&Math.random()<0.4) emit(s.x,s.y-2,1,{kind:'fire',ang:-Math.PI/2,spread:0.4,smin:15,smax:40,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:3,drag:1}); break; }
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
      ctx.restore(); break; }
    case 'forge':{
      const c=houseSprite(s); ctx.drawImage(c,s.x-c.ox,s.y-c.oy,c.width/1.5,c.height/1.5);
      const hx=s.x-28, hy=s.y+s.h/2+4;
      ctx.fillStyle='#4a4440'; ctx.fillRect(hx-4,hy-2,64,22); ctx.fillStyle='#1a1210'; ctx.fillRect(hx,hy+1,56,15);
      const gl=ctx.createLinearGradient(hx,hy,hx,hy+16); gl.addColorStop(0,`rgba(255,${150+Math.sin(t*6)*30|0},60,.95)`); gl.addColorStop(1,'rgba(180,40,10,.8)'); ctx.fillStyle=gl; ctx.fillRect(hx+3,hy+4,50,9);
      ctx.save(); ctx.translate(s.x+44,s.y+s.h/2+36); ctx.fillStyle='#24242a'; ctx.fillRect(-6,-4,12,10); ctx.fillStyle='#3e3e46'; ctx.beginPath(); ctx.moveTo(-16,-8); ctx.lineTo(12,-8); ctx.quadraticCurveTo(20,-8,22,-4); ctx.lineTo(12,-2); ctx.lineTo(-16,-2); ctx.closePath(); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(-15,-8,26,1.5); ctx.restore();
      if(Math.random()<0.3) emit(hx+28+rand(-20,20),hy+8,1,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:15,smax:45,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:3,drag:1});
      break; }
    case 'library':{
      const c=houseSprite(s); ctx.drawImage(c,s.x-c.ox,s.y-c.oy,c.width/1.5,c.height/1.5);
      ctx.save(); ctx.translate(s.x+s.w/2-12,s.y-s.h/2+12);
      const gr=ctx.createRadialGradient(-10,-10,3,0,0,38); gr.addColorStop(0,'#6a7aa0'); gr.addColorStop(1,'#232c44'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,36,0,TAU); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=1; for(let i=0;i<12;i++){ const a=i/12*TAU; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*36,Math.sin(a)*36); ctx.stroke(); }
      ctx.fillStyle='#d9b45a'; ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(s.x-40,s.y+s.h/2+10); ctx.fillStyle='#4a2e18'; ctx.fillRect(-14,-9,28,18); ctx.fillStyle='#e8dcc0'; ctx.fillRect(-11,-6,10,12); ctx.fillRect(1,-6,10,12); ctx.strokeStyle='#8a2e22'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(0,7); ctx.stroke(); ctx.restore();
      break; }
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
