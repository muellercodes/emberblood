
// ================= ground chunks
const RES=1.25, CPX=Math.round(CH*RES), MAX_CHUNKS=34, CHUNKS=new Map();
let chunkTick=0;
const BCOL=[
  [hexRGB('#5f7f3b'),hexRGB('#86914c'),hexRGB('#43672c')],
  [hexRGB('#3e5d2b'),hexRGB('#57562f'),hexRGB('#2c4a22')],
  [hexRGB('#6e6964'),hexRGB('#8a837c'),hexRGB('#48443f')],
  [hexRGB('#8c5c40'),hexRGB('#a9774f'),hexRGB('#653f2d')],
  [hexRGB('#2f2826'),hexRGB('#433834'),hexRGB('#1d1817')],
  [hexRGB('#d6dce3'),hexRGB('#eef1f5'),hexRGB('#a9b5c2')],
  [hexRGB('#4b5a37'),hexRGB('#606b3c'),hexRGB('#334128')]
];
function biomeRGB(b,n,m){ const C=BCOL[b]; let c=n>0?mixRGB(C[0],C[1],n*0.95):mixRGB(C[0],C[2],-n*0.95); return mixRGB(c,m>0?C[1]:C[2],Math.abs(m)*0.4); }
function groundRGB(s,x,y){
  if(s.out) return [12,16,10];
  const m=fbm(x*0.0011+11,y*0.0011-7,2);
  let c=biomeRGB(s.b,s.n,m);
  if(s.b2!==s.b&&s.t<1) c=mixRGB(biomeRGB(s.b2,s.n,m),c,s.t);
  if(s.shore>0) c=mixRGB(c,[170,154,112],s.shore*0.75);
  if(s.bog>0) c=mixRGB(c,mixRGB([58,70,46],[30,40,30],clamp(s.n+0.5,0,1)),smooth(clamp(s.bog*1.4-0.15,0,1))*0.92);
  if(s.road>0){ const rc=s.b===4?[62,54,50]:s.b===2?[118,110,100]:s.b===3?[150,112,80]:s.b===5?[176,170,166]:s.b===6?[104,90,62]:[128,106,74]; c=mixRGB(c,mixRGB(rc,[0,0,0],Math.max(0,s.n)*0.15),s.road*0.92); }
  if(s.water){ const cold=s.b===5; c=mixRGB(cold?[120,160,178]:[74,122,118],cold?[40,72,96]:[22,52,70],smooth(s.depth)); if(s.depth<0.15) c=mixRGB(cold?[230,238,244]:[190,200,190],c,s.depth/0.15*0.7+0.3); }
  if(s.lavaS>0) c=mixRGB(c,mixRGB([255,138,40],[170,44,12],clamp(0.5+s.n,0,1)),smooth(clamp(s.lavaS*1.6-0.3,0,1)));
  const ed=Math.min(x,y,WORLD.w-x,WORLD.h-y); if(ed<160) c=mixRGB([10,12,8],c,clamp(ed/160,0,1));
  return c;
}
function grassTuft(g,x,y,col,len,rng){ g.strokeStyle=col; g.beginPath(); for(let i=0;i<3;i++){ const a=-Math.PI/2+(rng()-0.5)*1.3, l=len*(0.6+rng()*0.5); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); } g.stroke(); }
function genChunk(cx,cy){
  const x0=cx*CH, y0=cy*CH, N=65, step=CH/(N-1);
  const small=mkCanvas(N,N), sg=small.getContext('2d'), img=sg.createImageData(N,N), d=img.data;
  const glowS=mkCanvas(N,N), gg=glowS.getContext('2d'), gimg=gg.createImageData(N,N), gd=gimg.data;
  const grid=new Array(N*N); let hasLava=false, hasWater=false;
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){
    const x=x0+i*step, y=y0+j*step, s=T(x,y,{});
    grid[j*N+i]=s;
    const c=groundRGB(s,x,y), k=(j*N+i)*4;
    d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255;
    if(s.lavaS>0){ hasLava=true; gd[k]=255; gd[k+1]=120; gd[k+2]=30; gd[k+3]=Math.round(clamp(s.lavaS*1.4-0.2,0,1)*210); }
    if(s.water) hasWater=true;
  }
  sg.putImageData(img,0,0);
  const cv=mkCanvas(CPX,CPX), g=cv.getContext('2d');
  g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
  g.drawImage(small,0,0,N,N,-CPX/(N-1)/2,-CPX/(N-1)/2,CPX+CPX/(N-1),CPX+CPX/(N-1));
  g.setTransform(RES,0,0,RES,-x0*RES,-y0*RES);
  const at=(x,y)=>{ const i=clamp(Math.round((x-x0)/step),0,N-1), j=clamp(Math.round((y-y0)/step),0,N-1); return grid[j*N+i]; };
  const rng=mulberry32(((cx*92821)^(cy*68917)^7)|0);
  g.lineCap='round'; g.lineWidth=1.1;
  if(LOOK.sb) lookDecor(g,rng,at,x0,y0); else for(let i=0;i<1500;i++){
    const x=x0+rng()*CH, y=y0+rng()*CH, s=at(x,y), r=rng();
    if(s.out||s.water||s.lava) continue;
    if(s.road>0.5){ if(r<0.25){ g.fillStyle=rng()<0.5?'rgba(60,50,40,.35)':'rgba(200,190,170,.25)'; g.beginPath(); g.arc(x,y,0.8+rng()*1.6,0,TAU); g.fill(); } continue; }
    const b=s.t<0.75&&rng()<0.5?s.b2:s.b;
    if(b===0){
      if(r<0.62) grassTuft(g,x,y,pick(['rgba(40,70,24,.55)','rgba(110,140,60,.5)','rgba(150,160,80,.4)','rgba(70,100,40,.5)']),5+rng()*4,rng);
      else if(r<0.66){ g.fillStyle=pick(['#e9d86a','#f2efe4','#b48ad8','#e88aa0']); g.beginPath(); g.arc(x,y,1.3,0,TAU); g.fill(); }
      else if(r<0.7){ g.fillStyle='rgba(60,50,35,.25)'; g.beginPath(); g.ellipse(x,y,6+rng()*8,3+rng()*4,rng()*3,0,TAU); g.fill(); }
      else if(s.shore>0.2&&r<0.8){ g.strokeStyle='rgba(60,80,30,.7)'; g.beginPath(); for(let k=0;k<5;k++){ g.moveTo(x+k*1.5,y); g.lineTo(x+k*1.5+(rng()-0.5)*3,y-6-rng()*6); } g.stroke(); }
    }else if(b===1){
      if(r<0.42) grassTuft(g,x,y,pick(['rgba(25,45,18,.6)','rgba(60,85,35,.5)','rgba(40,60,25,.55)']),4+rng()*4,rng);
      else if(r<0.62){ g.fillStyle=pick(['rgba(110,80,40,.55)','rgba(140,100,40,.5)','rgba(80,60,30,.5)','rgba(160,110,50,.4)']); g.beginPath(); g.ellipse(x,y,2.2,1.2,rng()*3,0,TAU); g.fill(); }
      else if(r<0.66){ g.strokeStyle='rgba(50,90,35,.6)'; g.beginPath(); for(let k=0;k<7;k++){ const a=k/7*TAU; g.moveTo(x,y); g.lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7); } g.stroke(); }
      else if(r<0.7){ g.fillStyle='rgba(70,100,40,.3)'; g.beginPath(); g.arc(x,y,5+rng()*7,0,TAU); g.fill(); }
      else if(r<0.71){ g.fillStyle='#d8c8a8'; g.beginPath(); g.arc(x,y,1.6,0,TAU); g.fill(); g.fillStyle='#b8423a'; g.beginPath(); g.arc(x,y-0.5,1.4,Math.PI,0); g.fill(); }
    }else if(b===2){
      if(r<0.22){ g.strokeStyle='rgba(30,26,24,.45)'; g.beginPath(); let px=x,py=y,a=rng()*TAU; g.moveTo(px,py); for(let k=0;k<4;k++){ a+=(rng()-0.5)*1.4; px+=Math.cos(a)*(5+rng()*8); py+=Math.sin(a)*(5+rng()*8); g.lineTo(px,py); } g.stroke(); }
      else if(r<0.42){ g.fillStyle=rng()<0.5?'rgba(30,28,26,.22)':'rgba(190,185,178,.18)'; g.beginPath(); g.ellipse(x,y,4+rng()*10,2+rng()*6,rng()*3,0,TAU); g.fill(); }
      else if(r<0.5){ g.fillStyle='rgba(70,60,50,.5)'; g.beginPath(); g.arc(x,y,1+rng()*1.5,0,TAU); g.fill(); }
      else if(r<0.53) grassTuft(g,x,y,'rgba(120,110,80,.45)',4,rng);
    }else if(b===3){
      if(r<0.2){ g.strokeStyle='rgba(70,40,25,.35)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(x,y); g.bezierCurveTo(x+8,y+rng()*4-2,x+16,y+rng()*4-2,x+24,y+rng()*4-2); g.stroke(); g.lineWidth=1.1; }
      else if(r<0.45){ g.fillStyle=pick(['rgba(70,40,28,.5)','rgba(190,140,100,.35)','rgba(110,70,45,.5)']); g.beginPath(); g.arc(x,y,1+rng()*2.2,0,TAU); g.fill(); }
      else if(r<0.5) grassTuft(g,x,y,'rgba(160,140,80,.5)',4,rng);
    }else if(b===5){
      if(r<0.18){ g.fillStyle='rgba(150,170,195,.28)'; g.beginPath(); g.ellipse(x,y,5+rng()*12,2+rng()*5,rng()*3,0,TAU); g.fill(); }
      else if(r<0.34){ g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.arc(x,y,0.7+rng()*0.9,0,TAU); g.fill(); }
      else if(r<0.4) grassTuft(g,x,y,'rgba(120,110,90,.45)',4,rng);
      else if(r<0.42){ g.fillStyle='rgba(110,120,135,.5)'; g.beginPath(); g.arc(x,y,1.5+rng()*2,0,TAU); g.fill(); }
    }else if(b===6){
      if(s.bog>0.5){ if(r<0.08){ g.fillStyle='rgba(70,110,50,.8)'; g.beginPath(); g.arc(x,y,3+rng()*2.5,0.4,TAU-0.2); g.lineTo(x,y); g.fill(); } else if(r<0.12){ g.strokeStyle='rgba(200,220,190,.18)'; g.beginPath(); g.ellipse(x,y,4+rng()*6,2+rng()*3,0,0,TAU); g.stroke(); } continue; }
      if(r<0.4) grassTuft(g,x,y,pick(['rgba(40,58,24,.6)','rgba(90,100,45,.5)','rgba(60,72,30,.55)']),5+rng()*5,rng);
      else if(r<0.52){ g.fillStyle='rgba(30,34,20,.35)'; g.beginPath(); g.ellipse(x,y,4+rng()*9,2+rng()*5,rng()*3,0,TAU); g.fill(); }
      else if(r<0.56){ g.strokeStyle='rgba(70,90,40,.7)'; g.beginPath(); for(let k=0;k<5;k++){ g.moveTo(x+k*1.5,y); g.lineTo(x+k*1.5+(rng()-0.5)*3,y-6-rng()*7); } g.stroke(); }
      else if(r<0.565){ g.fillStyle='#c9b98a'; g.beginPath(); g.arc(x,y,1.5,0,TAU); g.fill(); }
    }else if(b===4){
      if(r<0.25){ g.strokeStyle='rgba(8,6,6,.55)'; g.beginPath(); let px=x,py=y,a=rng()*TAU; g.moveTo(px,py); for(let k=0;k<3;k++){ a+=(rng()-0.5)*1.2; px+=Math.cos(a)*(6+rng()*8); py+=Math.sin(a)*(6+rng()*8); g.lineTo(px,py); } g.stroke(); }
      else if(r<0.45){ g.fillStyle=rng()<0.6?'rgba(90,80,76,.35)':'rgba(10,8,8,.4)'; g.beginPath(); g.arc(x,y,1+rng()*2,0,TAU); g.fill(); }
    }
  }
  const lk=LOOK.sb?{}:null; if(lk) lookChunkLines(g,grid,N,step,x0,y0,lk);
  for(const dc of DECALS){ if(dc.x+(dc.r||dc.w||300)<x0||dc.x-(dc.r||dc.w||300)>x0+CH||dc.y+(dc.r||dc.h||300)<y0||dc.y-(dc.r||dc.h||300)>y0+CH) continue; drawDecal(g,dc); }
  for(const br of BRIDGES){ if(br.x+200<x0||br.x-200>x0+CH||br.y+200<y0||br.y-200>y0+CH) continue; drawBridge(g,br); }
  let glow=null;
  if(hasLava){ gg.putImageData(gimg,0,0); glow=mkCanvas(CPX/4,CPX/4); const g2=glow.getContext('2d'); g2.imageSmoothingEnabled=true; g2.drawImage(glowS,0,0,N,N,-CPX/4/(N-1)/2,-CPX/4/(N-1)/2,CPX/4+CPX/4/(N-1),CPX/4+CPX/4/(N-1)); }
  return {cv,g,glow,hasWater,used:chunkTick,foam:lk?lk.foam:null};
}
function drawBridge(g,br){
  g.save(); g.translate(br.x,br.y); g.rotate(br.ang);
  const L=br.len/2, w=br.w/2;
  g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(-L+4,-w+6,br.len,br.w);
  if(br.kind==='wood'){
    g.fillStyle='#6a4a2c'; g.fillRect(-L,-w,br.len,br.w);
    for(let x=-L;x<L;x+=9){ g.fillStyle=((x/9)|0)%2?'#7a5634':'#86603a'; g.fillRect(x+0.5,-w,8,br.w); g.strokeStyle='rgba(30,18,8,.6)'; g.lineWidth=1; g.beginPath(); g.moveTo(x,-w); g.lineTo(x,w); g.stroke(); }
    g.fillStyle='#3a2614'; g.fillRect(-L,-w-3,br.len,5); g.fillRect(-L,w-2,br.len,5);
    for(let x=-L;x<=L;x+=40){ g.fillStyle='#2a1a0c'; g.fillRect(x-3,-w-5,6,8); g.fillRect(x-3,w-3,6,8); }
  }else{
    const gr=g.createLinearGradient(0,-w,0,w); gr.addColorStop(0,'#5a524e'); gr.addColorStop(1,'#2e2826'); g.fillStyle=gr; g.fillRect(-L,-w,br.len,br.w);
    g.strokeStyle='rgba(0,0,0,.4)'; g.lineWidth=1; for(let x=-L;x<L;x+=22){ g.beginPath(); g.moveTo(x,-w); g.lineTo(x,w); g.stroke(); }
    g.fillStyle='#1e1a18'; g.fillRect(-L,-w-4,br.len,6); g.fillRect(-L,w-2,br.len,6);
  }
  g.restore();
}
function drawDecal(g,dc){
  const rng=mulberry32(Math.floor(dc.x*7+dc.y*13));
  if(dc.k==='field'){
    g.save(); g.translate(dc.x,dc.y); g.rotate(dc.rot);
    g.fillStyle='#5a4228'; g.fillRect(-dc.w/2,-dc.h/2,dc.w,dc.h);
    for(let y=-dc.h/2+6;y<dc.h/2;y+=10){ g.strokeStyle=dc.crop; g.lineWidth=5; g.beginPath(); g.moveTo(-dc.w/2+4,y); g.lineTo(dc.w/2-4,y); g.stroke(); g.strokeStyle='rgba(255,255,200,.15)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(-dc.w/2+4,y-1.5); g.lineTo(dc.w/2-4,y-1.5); g.stroke(); }
    g.strokeStyle='#6a5036'; g.lineWidth=2.5; g.strokeRect(-dc.w/2-6,-dc.h/2-6,dc.w+12,dc.h+12);
    for(let x=-dc.w/2-6;x<=dc.w/2+6;x+=30){ g.fillStyle='#4a3420'; g.fillRect(x-2,-dc.h/2-8,4,4); g.fillRect(x-2,dc.h/2+4,4,4); }
    g.restore();
  }else if(dc.k==='dirt'||dc.k==='sand'){
    const col=dc.k==='dirt'?'110,86,58':'176,150,104';
    const gr=g.createRadialGradient(dc.x,dc.y,dc.r*0.2,dc.x,dc.y,dc.r); gr.addColorStop(0,`rgba(${col},.9)`); gr.addColorStop(0.85,`rgba(${col},.75)`); gr.addColorStop(1,`rgba(${col},0)`);
    g.fillStyle=gr; g.beginPath(); g.arc(dc.x,dc.y,dc.r,0,TAU); g.fill();
    for(let i=0;i<300;i++){ const a=rng()*TAU, r=Math.sqrt(rng())*dc.r*0.9; g.fillStyle=rng()<0.5?'rgba(60,45,30,.3)':'rgba(220,200,160,.2)'; g.beginPath(); g.arc(dc.x+Math.cos(a)*r,dc.y+Math.sin(a)*r,1+rng()*2,0,TAU); g.fill(); }
    if(dc.k==='sand'){ g.strokeStyle='rgba(120,90,60,.35)'; g.lineWidth=2; g.beginPath(); g.arc(dc.x,dc.y,dc.r*0.55,0,TAU); g.stroke(); }
  }else if(dc.k==='flagstone'||dc.k==='paving'){
    g.save();
    if(dc.k==='flagstone'){ g.beginPath(); g.arc(dc.x,dc.y,dc.r,0,TAU); g.clip(); }
    const x0=dc.x-(dc.r||dc.w/2), y0=dc.y-(dc.r||dc.h/2), x1=dc.x+(dc.r||dc.w/2), y1=dc.y+(dc.r||dc.h/2);
    g.fillStyle='#4a4644'; g.fillRect(x0,y0,x1-x0,y1-y0);
    for(let y=y0;y<y1;y+=26) for(let x=x0+((y/26)|0)%2*14;x<x1;x+=28){ const v=rng(); g.fillStyle=`rgb(${90+v*30|0},${86+v*28|0},${82+v*26|0})`; g.fillRect(x+1,y+1,26,24); }
    if(dc.snow){ const e=g.createRadialGradient(dc.x,dc.y,dc.r*0.55,dc.x,dc.y,dc.r); e.addColorStop(0,'rgba(236,241,246,0)'); e.addColorStop(1,'rgba(236,241,246,.85)'); g.fillStyle=e; g.fillRect(dc.x-dc.r,dc.y-dc.r,dc.r*2,dc.r*2);
      for(let i=0;i<34;i++){ const a=rng()*TAU, r=Math.sqrt(rng())*dc.r, x=dc.x+Math.cos(a)*r, y=dc.y+Math.sin(a)*r, rr=6+rng()*14; const sg=g.createRadialGradient(x,y,0,x,y,rr); sg.addColorStop(0,'rgba(240,244,248,.7)'); sg.addColorStop(1,'rgba(240,244,248,0)'); g.fillStyle=sg; g.beginPath(); g.arc(x,y,rr,0,TAU); g.fill(); } }
    g.restore();
  }else if(dc.k==='mudring'){
    const gr=g.createRadialGradient(dc.x,dc.y,dc.r*0.2,dc.x,dc.y,dc.r); gr.addColorStop(0,'rgba(70,58,38,.95)'); gr.addColorStop(0.8,'rgba(64,56,36,.8)'); gr.addColorStop(1,'rgba(64,56,36,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(dc.x,dc.y,dc.r,0,TAU); g.fill();
    for(let i=0;i<14;i++){ const a=i/14*TAU; g.fillStyle='#5a4a32'; g.fillRect(dc.x+Math.cos(a)*dc.r*0.62-9,dc.y+Math.sin(a)*dc.r*0.62-5,18,10); }
    for(let i=0;i<160;i++){ const a=rng()*TAU, r=Math.sqrt(rng())*dc.r*0.9; g.fillStyle=rng()<0.5?'rgba(30,24,14,.3)':'rgba(140,130,90,.2)'; g.beginPath(); g.arc(dc.x+Math.cos(a)*r,dc.y+Math.sin(a)*r,1+rng()*2.5,0,TAU); g.fill(); }
  }else if(dc.k==='pen'){
    g.save(); g.translate(dc.x,dc.y);
    g.fillStyle='rgba(120,100,70,.55)'; g.fillRect(-dc.w/2,-dc.h/2,dc.w,dc.h);
    for(let i=0;i<60;i++){ g.fillStyle='rgba(240,244,248,.6)'; g.beginPath(); g.ellipse((rng()-0.5)*dc.w,(rng()-0.5)*dc.h,4+rng()*10,3+rng()*6,rng()*3,0,TAU); g.fill(); }
    g.strokeStyle='#5a3e24'; g.lineWidth=3; g.strokeRect(-dc.w/2,-dc.h/2,dc.w,dc.h);
    g.strokeStyle='#7a5634'; g.lineWidth=1.5; g.strokeRect(-dc.w/2+3,-dc.h/2+3,dc.w-6,dc.h-6);
    for(let x=-dc.w/2;x<=dc.w/2;x+=24){ g.fillStyle='#3a2614'; g.fillRect(x-2.5,-dc.h/2-2.5,5,5); g.fillRect(x-2.5,dc.h/2-2.5,5,5); }
    g.fillStyle='#c9b070'; g.fillRect(dc.w/2-40,-dc.h/2+10,26,18); g.fillStyle='#a88c50'; g.fillRect(dc.w/2-40,-dc.h/2+16,26,2);
    g.restore();
  }else if(dc.k==='sigil'){
    sigilDecal(g,dc.x,dc.y,dc.r,'rgba(255,90,40,.32)');
  }else if(dc.k==='nest'){
    g.fillStyle='rgba(20,12,8,.55)'; g.beginPath(); g.arc(dc.x,dc.y,dc.r-8,0,TAU); g.fill();
    g.strokeStyle='#6a4a2c'; g.lineWidth=3; for(let k=0;k<40;k++){ const a=rng()*TAU; g.beginPath(); g.arc(dc.x,dc.y,dc.r+(rng()-0.5)*14,a,a+0.4+rng()*0.8); g.stroke(); }
    g.fillStyle='rgba(230,220,195,.8)'; for(let k=0;k<3;k++){ g.beginPath(); g.ellipse(dc.x+(rng()-0.5)*dc.r*0.6,dc.y+(rng()-0.5)*dc.r*0.6,5,7,rng()*3,0,TAU); g.fill(); }
  }
}
function sigilDecal(g,x,y,R,col){
  g.save(); g.strokeStyle=col; g.fillStyle=col; g.lineWidth=3;
  g.beginPath(); g.arc(x,y,R,0,TAU); g.stroke(); g.lineWidth=2; g.beginPath(); g.arc(x,y,R*0.82,0,TAU); g.stroke();
  for(let i=0;i<12;i++){ const a=i/12*TAU; g.beginPath(); g.moveTo(x+Math.cos(a)*R*0.82,y+Math.sin(a)*R*0.82); g.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R); g.stroke(); g.fillRect(x+Math.cos(a+0.26)*R*0.91-4,y+Math.sin(a+0.26)*R*0.91-4,8,8); }
  g.lineWidth=3; g.beginPath(); g.moveTo(x-R*0.6,y); g.quadraticCurveTo(x,y-R*0.5,x+R*0.6,y); g.quadraticCurveTo(x,y+R*0.5,x-R*0.6,y); g.stroke();
  g.beginPath(); g.ellipse(x,y,R*0.07,R*0.22,0,0,TAU); g.stroke(); g.restore();
}
function getChunk(cx,cy,gen){
  const k=ckey(cx,cy); let c=CHUNKS.get(k);
  if(c){ c.used=chunkTick; return c; }
  if(!gen) return null;
  c=genChunk(cx,cy); CHUNKS.set(k,c);
  if(CHUNKS.size>MAX_CHUNKS){ let ok=null,ou=1e18; for(const [kk,v] of CHUNKS) if(v.used<ou){ ou=v.used; ok=kk; } if(ok!=null&&ok!==k) CHUNKS.delete(ok); }
  return c;
}
function scorch(x,y,r){
  const c=CHUNKS.get(ckey(Math.floor(x/CH),Math.floor(y/CH))); if(!c) return;
  const g=c.g, gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(14,8,5,.32)'); gr.addColorStop(1,'rgba(14,8,5,0)');
  g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
}
const placeholderCol=new Map();
function chunkPlaceholder(cx,cy){ const k=ckey(cx,cy); let c=placeholderCol.get(k); if(!c){ const s=T(cx*CH+CH/2,cy*CH+CH/2,{}); const rgb=groundRGB(s,cx*CH+CH/2,cy*CH+CH/2); c=`rgb(${rgb.map(Math.round)})`; placeholderCol.set(k,c); } return c; }

// ================= world overview (map + minimap)
const OV={s:25,w:560,h:440,cv:null,g:null,img:null,row:0,done:false};
function overviewStep(rows){
  if(OV.done) return;
  if(!OV.cv){ OV.cv=mkCanvas(OV.w,OV.h); OV.g=OV.cv.getContext('2d'); OV.img=OV.g.createImageData(OV.w,OV.h); }
  const s={}, d=OV.img.data;
  for(let n=0;n<rows&&OV.row<OV.h;n++,OV.row++){
    const j=OV.row;
    for(let i=0;i<OV.w;i++){
      const x=(i+0.5)*OV.s, y=(j+0.5)*OV.s; T(x,y,s);
      let c=groundRGB(s,x,y);
      if(s.road>0.3) c=mixRGB(c,[200,170,120],0.55);
      if(Math.abs(y-WALL_Y)<30) c=[40,36,48];
      if(s.bridge===1) c=[120,90,60];
      if(s.bog>0.5) c=mixRGB(c,[40,52,36],0.4);
      const k=(j*OV.w+i)*4; d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255;
    }
  }
  OV.g.putImageData(OV.img,0,0);
  if(OV.row>=OV.h) OV.done=true;
}
const FOG={cs:100,w:140,h:110,bits:null};
function fogInit(str){ FOG.bits=new Uint8Array(FOG.w*FOG.h); if(str) for(let i=0;i<str.length&&i<FOG.bits.length;i++) FOG.bits[i]=str.charCodeAt(i)===49?1:0; }
function fogReveal(x,y,r){ const c0=Math.floor((x-r)/FOG.cs), c1=Math.floor((x+r)/FOG.cs), r0=Math.floor((y-r)/FOG.cs), r1=Math.floor((y+r)/FOG.cs); for(let cx=Math.max(0,c0);cx<=Math.min(FOG.w-1,c1);cx++) for(let cy=Math.max(0,r0);cy<=Math.min(FOG.h-1,r1);cy++){ if(dist2((cx+0.5)*FOG.cs,(cy+0.5)*FOG.cs,x,y)<r*r) FOG.bits[cy*FOG.w+cx]=1; } }
function fogStr(){ let s=''; for(let i=0;i<FOG.bits.length;i++) s+=FOG.bits[i]?'1':'0'; return s; }
