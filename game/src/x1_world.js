
// ================= Act II world: the Clockwork Coast (map 1, x 0..14000, y 20000..31000)
// Built from the story bible (scratchpad/bible/ACT2.md section 1 and 2): ten regions (biomes 10 to 19), the sea and
// the tidal sands, chalk downs and white sea cliffs with real elevation, Gearhaven (Upper Town on the cliff, Lower Town
// and the harbor below, joined by the Great Stair, the Clockwork Lift and the Cogwater Falls), Saltmarsh on stilts,
// the Gull's Rest, Lantern Point and the lighthouse, the Cut (a sea ravine only the Grapple Tail crosses), the Shadow
// Causeway and Spire Rock (only with c_spire_up), shrines, camps, landmarks, secrets and the dungeon doors.
// World states read from G.flags: c_lowtide (the Gullcrag Sands are dry), c_clock_on (clocks tick, belts run smoothly,
// the harbor chain is up, the lighthouse lens turns), c_spire_up (Spire Rock, the causeway, the Breakwater Shrine),
// c_snow (snow in summer on the whole coast). Doc for the people, story and dungeon helpers: scratchpad/C1WORLD.md.
// All coordinates are absolute. Every id uses the c_ prefix. Every player-facing line goes through S(full, simple).
const C1={k:1,y0:20000,objs:[],bk:new Map(),bs:512,st:{},dyn:[],doorsDyn:[],shrDyn:[],built:false,t:0,sndT:{},belts:[],vents:[],rips:[],calm:[],hard:[],land:[],lamps:[],lift:null,hz:[],homes:[]};
const C1F=k=>!!(G&&G.flags&&G.flags[k]);
// ---------- small geometry helpers (shapes are plain arrays so the terrain hooks stay cheap)
function c1Poly(P){ const o={P,bb:[1e9,1e9,-1e9,-1e9]}; for(const p of P){ o.bb[0]=Math.min(o.bb[0],p[0]); o.bb[1]=Math.min(o.bb[1],p[1]); o.bb[2]=Math.max(o.bb[2],p[0]); o.bb[3]=Math.max(o.bb[3],p[1]); } return o; }
function c1InP(o,x,y){
  if(x<o.bb[0]||y<o.bb[1]||x>o.bb[2]||y>o.bb[3]) return false;
  const P=o.P; let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i], b=P[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c;
}
const c1InR=(r,x,y)=>x>=r[0]&&y>=r[1]&&x<=r[2]&&y<=r[3];
const c1InD=(d,x,y)=>{ const dx=x-d[0], dy=y-d[1]; return dx*dx+dy*dy<=d[2]*d[2]; };
// distance from a point to a polyline
function c1SegD(pts,x,y){ let b=1e9; for(let i=0;i<pts.length-1;i++){ const a=pts[i], c=pts[i+1], dx=c[0]-a[0], dy=c[1]-a[1], l2=dx*dx+dy*dy||1, t=clamp(((x-a[0])*dx+(y-a[1])*dy)/l2,0,1), d=Math.hypot(a[0]+dx*t-x,a[1]+dy*t-y); if(d<b) b=d; } return b; }

// ---------- the shapes of the coast (see bible 1.2 to 1.5; the Cut and a few edges are moved a little so the gates hold)
const C1G={
  // the land: everything outside is sea (shore 60, shelf 170, noise 110)
  land:[[-200,19800],[14200,19800],[14200,27600],[13700,28400],[13400,29500],[12900,29700],[12300,29500],[11500,29000],[10600,28700],[10000,28200],[9850,27600],[9750,27050],[9560,27050],[9400,27700],[9100,28300],[8700,28800],[8600,28400],[8500,27000],[8300,26500],[7700,26400],[7000,26450],[6600,26600],[6400,27400],[6300,28400],[6100,28900],[5600,28700],[4800,28900],[4200,28700],[3400,28800],[2900,28500],[2700,28900],[2500,29600],[2200,30300],[1300,30500],[500,30200],[-200,29800]],
  // the Chalk Downs, level 1 (the Moth Wood to the west stays on the ground)
  downs:[[2760,19700],[14300,19700],[14300,23790],[12600,23770],[11500,23820],[10000,23790],[8640,23830],[8520,24160],[6080,24160],[5980,23830],[5200,23800],[4000,23850],[2620,23820],[2130,23460],[2420,22620],[2760,22050]],
  // Gearhaven's Upper Town (the Clock Quarter), level 2, on the chalk cliff
  upper:[6150,24100,8450,25200],
  // the White Cliffs, level 2 (a neck joins them to the Upper Town at the West Gate)
  cliffs:[[2960,25260],[4200,25230],[6150,25120],[6250,25100],[6330,25230],[6330,26350],[6140,26680],[6060,27280],[4800,27600],[3400,27800],[2900,27420],[2950,26450]],
  // the Harbor East Heights, level 2: west of the Cut, and its east lip
  heightsW:[[8600,25980],[9555,25980],[9555,27080],[9380,27680],[9080,28240],[8780,28650],[8670,28300],[8650,27250],[8640,26450]],
  heightsE:[[9805,25980],[10520,25980],[10560,26880],[10260,27030],[9805,27070]],
  // Lantern Point heath, level 1
  heath:[[9810,25960],[14300,25960],[14300,27560],[13650,28280],[13280,29250],[12900,29440],[12280,29280],[11480,28820],[10620,28520],[10040,28060],[9900,27640]],
  // Gullcrag Head, level 3: a horseshoe round the Gullcrag Sands (open to Saltmarsh in the north)
  gull:[[-260,27950],[1240,27950],[1230,28800],[1300,29440],[2090,29400],[2090,28780],[1740,28780],[1740,28590],[2040,28590],[2040,27950],[2560,27950],[2560,28340],[2880,28340],[2860,28520],[2740,28920],[2610,29360],[2340,29720],[2090,30200],[1300,30380],[500,30100],[-260,29760]],
  // the Gullcrag Sands: deep sea at high tide, wet sand at low tide (G.flags.c_lowtide)
  sands:[[1250,27860],[2040,27860],[2040,28590],[1740,28590],[1740,28780],[2090,28780],[2090,29400],[1300,29440],[1230,28800]],
  // the harbor: calm water inside the breakwaters (Water Stride walks it)
  harbor:[[6380,26380],[8700,26380],[8760,29060],[7920,29070],[7900,28780],[7300,28980],[7280,29080],[6060,29000]],
  // the harbor mouth rip (only a skim crosses it)
  mouth:[7300,28860,7920,29240],
  // the Cut: a churning sea ravine (deep, blocks even stride; the Grapple Tail crosses it at the old rope bridge)
  cut:[9560,25820,9802,28320],
  cutRiver:[[9690,25840],[9690,26400],[9680,27000],[9680,27500],[9680,28100]],
  // Saltmarsh lagoons (bible 1.3) plus the jetty pool and Granny Oona's pool
  lagoons:[{x:600,y:25600,r:260},{x:2500,y:25700,r:180},{x:900,y:26300,r:200},{x:1900,y:26700,r:320},{x:2700,y:27300,r:220},{x:1450,y:27620,r:190},{x:1180,y:27080,r:210}],
  // Spire Rock and the Shadow Causeway (only with c_spire_up)
  spire:[7400,30200,300],
  causeway:[[7180,28960,7330,29310],[7280,29440,7430,29610],[7250,29720,7400,29870]],
  causewayRip:[7260,29600,7420,29730],
  // Seal Rocks and its skim lane from the Lantern Point beach
  seal:[11800,30200,150], sealLane:[11700,29150,11900,30080], sealRip:[11700,29580,11900,29760],
  gullIsle:[4100,29700,220]
};
for(const k of ['downs','cliffs','heightsW','heightsE','heath','gull','sands','harbor']) C1G[k+'P']=c1Poly(C1G[k]);
// ---------- sounds of our own (gulls, waves, the lift, clock ticks, bells, steam), straight into the audio context
function c1Snd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted||!SFX.noise) return; v=v==null?1:v;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.4*v; out.connect(ac.destination);
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.25,dur/3)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(kind){
      case 'gull': { const f=rand(1300,1700); tn('triangle',f,f*0.62,0.22,0.035); tn('triangle',f*1.06,f*0.7,0.18,0.03,0.26); if(Math.random()<0.5) tn('triangle',f*1.1,f*0.66,0.16,0.025,0.48); break; }
      case 'wave': nz(2.4,0.05,'lowpass',380,1400,0.6); nz(1.6,0.025,'bandpass',900,300,0.7,0.8); break;
      case 'clank': tn('square',180,120,0.12,0.04); nz(0.18,0.08,'bandpass',1800,600,2); tn('square',140,90,0.14,0.035,0.2); break;
      case 'tick': tn('square',2400,2200,0.02,0.012); break;
      case 'bell': [523,659,784].forEach((f,i)=>tn('sine',f,f*0.995,1.6,0.04,i*0.02)); tn('sine',261,259,2.4,0.03); break;
      case 'steam': nz(0.7,0.035,'highpass',2600,5200,0.7); break;
      case 'creak': tn('sawtooth',90,70,0.5,0.02); nz(0.4,0.03,'bandpass',500,300,3); break;
      case 'seal': tn('sawtooth',220,170,0.35,0.04); tn('sawtooth',200,240,0.3,0.035,0.4); break;
      case 'baa': tn('sawtooth',300,280,0.35,0.025); tn('sine',600,560,0.35,0.015); break;
    }
  }catch(e){}
}
// a cached, outlined sprite (Storybook look); in Classic it is just the painted sprite
const C1S=new Map();
function c1Spr(key,R,draw){ const k=(LOOK.sb?'s:':'c:')+key; let c=C1S.get(k); if(c) return c; c=LOOK.sb?sbSprite('c1_'+key,R,draw):spriteOf(R,draw); C1S.set(k,c); return c; }
// a cached tall sprite drawn from a base point (w x h world px, base at bx,by inside it)
function c1Tall(key,w,h,bx,by,draw,ow){
  const k=(LOOK.sb?'s:':'c:')+key; let c=C1S.get(k); if(c) return c;
  const sc=2, cv=mkCanvas(Math.ceil(w*sc),Math.ceil(h*sc)), g=cv.getContext('2d'); g.scale(sc,sc); g.translate(bx,by); g.lineCap='round'; g.lineJoin='round'; draw(g);
  cv.ox=bx; cv.oy=by; cv.w2=w; cv.h2=h;
  c=LOOK.sb?outlineSprite(cv,SBC.outline,ow||1.8,{force:true}):cv; c.ox=bx; c.oy=by; c.w2=w; c.h2=h; C1S.set(k,c); return c;
}
function c1Put(c,x,y,s){ s=s||1; ctx.drawImage(c,x-c.ox*s,y-c.oy*s,c.w2*s,c.h2*s); }
// cel helpers for the hand-drawn pieces
function c1Ell(g,x,y,rx,ry,col){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); }
function c1Rect(g,x,y,w,h,col,r){ g.fillStyle=col; if(r){ rrect(g,x,y,w,h,r); g.fill(); } else g.fillRect(x,y,w,h); }
function c1Shade(g,x,y,w,h,col){ const T=celTones(col); c1Rect(g,x,y,w,h,T[2]); c1Rect(g,x,y,w-Math.max(1.5,w*0.18),h-Math.max(1,h*0.06),T[1]); c1Rect(g,x+1,y+1,Math.max(1,w*0.22),h-2,T[0]); }

// ================= 1. prop kinds (Storybook: cel tones from the top left, a plum outline is added by the engine)
const C1PAL={mothleaf:['#5e5a78','#837ea2','#b8b2d2'],birch:['#5f9a3e','#86bf4c','#b8e06a'],pine:['#2c6e52','#3f925e','#6cba6e'],seapine:['#2a6450','#3c8660','#68ae72'],
  gorse:['#3c7a34','#559a3e','#86c25a'],heath:['#6a3e78','#9a5aa8','#c88ad2'],haw:['#3e7a3a','#5a9a44','#8cc65a'],rock:['#8a8478','#b4ae9e','#e2ddcc'],chalk:['#b8b2a0','#e4e0d2','#fffdf4'],
  black:['#262232','#3c3650','#7a6c9a'],rust:['#7a4a2e','#a4643a','#d08a52'],brass:['#8a6420','#c8963a','#f2cc6a'],wood:['#6a4a2c','#8e6a40','#b89060'],drift:['#9a8c78','#c6b8a0','#ece2cc']};
const c1Tones=p=>[p[2],p[1],p[0]];
function c1Blob(g,R,rng,pal,n){ const v=sbRockPts(R,rng); celFill(g,(q,dx,dy)=>sbRoundPoly(q,v,dx,dy),pal[1],{r:R,tones:c1Tones(pal),hi:R*0.14,lo:R*0.24}); return v; }
definePropKind('c_mothbirch',{n:4,tall:true,R:44,col:{r:9},h:78,rot:false,make(seed,v){ const rng=mulberry32(seed), R=44; return spriteOf(R,g=>{
  // pale bark peeking out under the crown (the white trunk with dark "eyes")
  for(let i=0;i<3;i++){ const a=0.9+i*1.9+rng()*0.4, x=Math.cos(a)*R*0.62, y=Math.sin(a)*R*0.6; celFill(g,(q,dx,dy)=>{ q.moveTo(x+dx-3,y+dy-6); q.lineTo(x+dx+3,y+dy-6); q.lineTo(x+dx+4,y+dy+8); q.lineTo(x+dx-4,y+dy+8); q.closePath(); },'#ece8f2',{r:6}); c1Ell(g,x,y,1.6,1.1,'#3a3044'); }
  sbCanopy(g,R*0.9,rng,C1PAL.mothleaf,8,3);
  // silver dust glints
  for(let i=0;i<7;i++){ const a=rng()*TAU, d=rng()*R*0.7; c1Ell(g,Math.cos(a)*d,Math.sin(a)*d,1.2,1.2,'rgba(240,236,255,.85)'); }
  if(v>=2){ // cocoons hanging off the crown
    for(let i=0;i<(v===3?3:2);i++){ const a=0.4+i*2.2+rng()*0.6, x=Math.cos(a)*R*0.78, y=Math.sin(a)*R*0.72+4; g.strokeStyle='rgba(230,226,240,.8)'; g.lineWidth=1; g.beginPath(); g.moveTo(x,y-8); g.lineTo(x,y-2); g.stroke(); celFill(g,(q,dx,dy)=>q.ellipse(x+dx,y+dy+4,4.2,7,0,0,TAU),'#dcd6e6',{r:6}); g.strokeStyle='rgba(150,140,170,.7)'; g.beginPath(); for(let k=-1;k<=1;k++){ g.moveTo(x-4,y+4+k*3); g.lineTo(x+4,y+5+k*3); } g.stroke(); }
  }
}); }});
definePropKind('c_gorse',{n:3,R:17,col:{r:10,low:true},rot:false,make(seed){ const rng=mulberry32(seed), R=17; return spriteOf(R,g=>{
  sbCanopy(g,R,rng,C1PAL.gorse,6,2);
  for(let i=0;i<14;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.8; const x=Math.cos(a)*d, y=Math.sin(a)*d; c1Ell(g,x+0.5,y+0.6,2,1.6,'#8a6a14'); c1Ell(g,x,y,1.8,1.5,'#ffd23a'); c1Ell(g,x-0.5,y-0.5,0.8,0.7,'#fff3a8'); }
}); }});
definePropKind('c_seapine',{n:3,tall:true,R:42,col:{r:9},h:76,rot:false,make(seed){ const rng=mulberry32(seed), R=42, P=C1PAL.seapine; return spriteOf(R,g=>{
  // a wind-bent pine: the tiers are pushed to the east, the crown is lopsided
  const tiers=[[R*0.95,0.6,8],[R*0.7,0.58,6],[R*0.45,0.55,3]];
  tiers.forEach(([r,k,ox],L)=>{ const n=8+Math.floor(rng()*3)-L, rot=rng()*TAU, tones=[sbTone(P[2],L*0.06),sbTone(P[1],L*0.07),P[0]];
    celFill(g,(q,dx,dy)=>sbStar(q,n,r,r*k,rot,dx+ox,dy+L*1.5),P[1],{r,tones,hi:r*0.12,lo:r*0.16});
    if(L<2){ g.fillStyle='rgba(20,40,40,.22)'; g.beginPath(); g.arc(ox+r*0.08,r*0.08,tiers[L+1][0]*1.02,0,TAU); g.fill(); } });
  c1Ell(g,1,-1,3,3,P[2]);
}); }});
definePropKind('c_chalkrock',{n:3,R:15,col:{r:12,low:true},rot:false,make(seed){ const rng=mulberry32(seed), R=15; return spriteOf(R,g=>{
  c1Blob(g,R,rng,C1PAL.chalk);
  g.strokeStyle='#a8a090'; g.lineWidth=1.1; for(let i=0;i<2;i++){ let x=(rng()-0.5)*R, y=(rng()-0.4)*R*0.6; g.beginPath(); g.moveTo(x,y); x+=(rng()-0.5)*8; y+=4+rng()*4; g.lineTo(x,y); g.stroke(); }
  c1Ell(g,-R*0.3,-R*0.35,R*0.3,R*0.18,'rgba(255,255,255,.7)');
}); }});
definePropKind('c_haybale',{n:2,R:15,col:{r:12,low:true},rot:false,make(seed){ const R=15; return spriteOf(R,g=>{
  celBall(g,0,0,R,'#e2b850',['#f6dc8a','#e2b850','#b88a32']);
  g.strokeStyle='#b0822e'; g.lineWidth=1.3; g.beginPath(); for(let a=0;a<TAU*2.6;a+=0.25){ const r=2+a*1.9; const x=Math.cos(a)*r*0.95, y=Math.sin(a)*r*0.95; a?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
  g.strokeStyle='#8a5a2a'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-R,-3); g.lineTo(R,-3); g.stroke();
}); }});
definePropKind('c_barnrock',{n:3,R:15,col:{r:12,low:true},rot:false,make(seed){ const rng=mulberry32(seed), R=15; return spriteOf(R,g=>{
  // seaweed fringe, then the rock, then barnacles
  for(let i=0;i<9;i++){ const a=Math.PI*0.15+rng()*Math.PI*0.7, x=Math.cos(a)*R*0.95, y=Math.sin(a)*R*0.8; c1Ell(g,x,y+2,4,2.4,i%2?'#4e7a3a':'#6a8a3a'); }
  c1Blob(g,R*0.92,rng,['#5e6268','#868a90','#b4b8bc']);
  for(let i=0;i<9;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.6; const x=Math.cos(a)*d-2, y=Math.sin(a)*d-2; c1Ell(g,x,y,2.2,1.8,'#f2eee2'); c1Ell(g,x+0.3,y+0.2,0.9,0.7,'#6a6460'); }
}); }});
definePropKind('c_gear',{n:2,R:15,col:{r:10,low:true},rot:false,make(seed,v){ const R=15; return spriteOf(R,g=>{
  c1Ell(g,2,4,R,R*0.5,'rgba(60,40,30,.35)');
  celFill(g,(q,dx,dy)=>sbStar(q,10,R*0.95,R*0.75,0.2+v,dx,dy),'#a4643a',{r:R,tones:c1Tones(C1PAL.rust)});
  celBall(g,0,0,R*0.42,'#7a4a2e',['#a4643a','#7a4a2e','#4a2a1a']); c1Ell(g,0,0,R*0.18,R*0.18,'#3a2418');
  // half buried: a soil lip over the bottom
  g.fillStyle='#7a6a52'; g.beginPath(); g.ellipse(0,R*0.75,R*1.05,R*0.42,0,0,TAU); g.fill(); g.fillStyle='#8e7e62'; g.beginPath(); g.ellipse(-2,R*0.66,R*0.8,R*0.22,0,0,TAU); g.fill();
}); }});
definePropKind('c_scrap',{n:3,R:24,col:{r:17},rot:false,make(seed){ const rng=mulberry32(seed), R=24; return spriteOf(R,g=>{
  c1Ell(g,3,5,R*0.95,R*0.6,'rgba(50,34,26,.35)');
  const cols=['#a4643a','#8a7a6a','#6a7078','#b08a4a','#7a4a2e'];
  for(let i=0;i<9;i++){ const a=rng()*TAU, d=rng()*R*0.5, x=Math.cos(a)*d, y=Math.sin(a)*d*0.7, w=8+rng()*12, h=5+rng()*7; g.save(); g.translate(x,y); g.rotate((rng()-0.5)*1.2); c1Shade(g,-w/2,-h/2,w,h,cols[i%cols.length]); g.restore(); }
  celFill(g,(q,dx,dy)=>sbStar(q,8,7,5.4,0,dx-6,dy-8),'#c8963a',{r:7,tones:c1Tones(C1PAL.brass)}); c1Ell(g,-6,-8,2,2,'#4a3418');
  g.strokeStyle='#5a5e66'; g.lineWidth=3.2; g.beginPath(); g.moveTo(4,-12); g.lineTo(16,-2); g.stroke(); g.strokeStyle='#9aa0a8'; g.lineWidth=1.2; g.beginPath(); g.moveTo(4,-13); g.lineTo(16,-3); g.stroke();
}); }});
definePropKind('c_pipe',{n:2,R:15,col:{r:8},rot:false,make(seed,v){ const R=15; return spriteOf(R,g=>{
  c1Ell(g,2,4,9,4,'rgba(40,30,20,.35)');
  c1Ell(g,0,4,8,3.6,'#5a5048'); c1Shade(g,-5,-10,10,14,'#7c8088'); c1Ell(g,0,-10,5,2.4,'#a0a4ac'); c1Ell(g,0,-10,3,1.4,'#2a2a30');
  // the valve wheel
  g.strokeStyle=v?'#c8963a':'#c8402e'; g.lineWidth=2; g.beginPath(); g.arc(7,-2,4.5,0,TAU); g.moveTo(2.5,-2); g.lineTo(11.5,-2); g.moveTo(7,-6.5); g.lineTo(7,2.5); g.stroke();
}); }});
definePropKind('c_lamppost',{n:1,tall:true,R:30,col:{r:5},h:60,rot:false,make(){ return spriteOf(30,g=>c1LampArt(g,false)); }});
function c1LampArt(g,lit){
  c1Ell(g,3,2,7,3,'rgba(40,26,30,.35)'); c1Ell(g,0,0,5,2.4,'#5a4a30');
  c1Shade(g,-1.8,-26,3.6,26,'#8a6a2a'); c1Rect(g,-3.4,-27,6.8,2.4,'#c8963a',1);
  // the lamp head: a brass cage with a glass pane
  c1Shade(g,-5,-37,10,10,'#c8963a'); c1Rect(g,-3.4,-35.5,6.8,7,lit?'#fff2b0':'#8ab0c0',1); c1Rect(g,-6,-39,12,2.6,'#8a6420',1); g.fillStyle='#8a6420'; g.beginPath(); g.moveTo(-4,-39); g.lineTo(0,-44); g.lineTo(4,-39); g.fill();
}
definePropKind('c_blackrock',{n:3,tall:true,R:30,col:{r:16},h:70,rot:false,make(seed){ const rng=mulberry32(seed), R=30; return spriteOf(R,g=>{
  // a black glass spire seen from above: facets round a sharp point
  const n=6+Math.floor(rng()*2), pts=[]; for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.3; pts.push([Math.cos(a)*R*(0.75+rng()*0.25),Math.sin(a)*R*(0.7+rng()*0.25)]); }
  const tip=[-R*0.12,-R*0.16];
  for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mid=Math.atan2((a[1]+b[1])/2,(a[0]+b[0])/2), lit=-(Math.cos(mid)+Math.sin(mid))/1.4; g.fillStyle=lit>0.3?C1PAL.black[2]:lit>-0.3?C1PAL.black[1]:C1PAL.black[0]; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.lineTo(tip[0],tip[1]); g.closePath(); g.fill(); }
  c1Ell(g,tip[0]-2,tip[1]-2,2.2,1.6,'#c8b8ff');
}); }});
definePropKind('c_heather',{n:3,R:12,rot:false,make(seed){ const rng=mulberry32(seed), R=12; return spriteOf(R,g=>{
  sbCanopy(g,R,rng,['#4a6a32','#5e8240','#7aa252'],5,1);
  for(let i=0;i<12;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.85; c1Ell(g,Math.cos(a)*d,Math.sin(a)*d,1.9,1.5,i%3?'#a85ab8':'#d08ae0'); }
}); }});
definePropKind('c_thrift',{n:2,R:8,rot:false,make(seed){ const rng=mulberry32(seed), R=8; return spriteOf(R,g=>{
  celBall(g,0,1,R*0.8,'#6a9a4a',['#8cbc62','#6a9a4a','#4a7a34']);
  for(let i=0;i<5;i++){ const a=rng()*TAU, d=rng()*R*0.5; celBall(g,Math.cos(a)*d,Math.sin(a)*d-1,2.3,'#f08ab4',['#ffc2da','#f08ab4','#c05a88']); }
}); }});
definePropKind('c_hawthorn',{n:3,tall:true,R:34,col:{r:8},h:58,rot:false,make(seed,v){ const rng=mulberry32(seed), R=34; return spriteOf(R,g=>{
  sbCanopy(g,R*0.88,rng,C1PAL.haw,7,2);
  for(let i=0;i<16;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.75; c1Ell(g,Math.cos(a)*d,Math.sin(a)*d,1.6,1.4,v===1?'#d83a3a':'#fff6f0'); }
}); }});
definePropKind('c_kelp',{n:3,R:14,rot:false,make(seed){ const rng=mulberry32(seed), R=14; return spriteOf(R,g=>{
  c1Ell(g,1,2,R,R*0.55,'rgba(70,50,30,.25)');
  for(let i=0;i<7;i++){ const a=rng()*TAU, L=6+rng()*8; g.strokeStyle=i%2?'#6a6a2a':'#8a7a34'; g.lineWidth=3.4; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(Math.cos(a+0.6)*L*0.6,Math.sin(a+0.6)*L*0.5,Math.cos(a)*L,Math.sin(a)*L*0.7); g.stroke(); }
  c1Ell(g,-1,-1,3,2,'#a49040');
}); }});
definePropKind('c_shroom',{n:3,R:10,rot:false,make(seed){ const rng=mulberry32(seed), R=10; return spriteOf(R,g=>{
  for(let i=0;i<3;i++){ const x=(rng()-0.5)*R, y=(rng()-0.5)*R*0.7, r=3+rng()*3; c1Ell(g,x+1,y+2,r,r*0.5,'rgba(40,40,60,.25)'); celBall(g,x,y,r,'#e6e0ec',['#ffffff','#e6e0ec','#a8a0b8']); c1Ell(g,x-r*0.3,y-r*0.3,r*0.25,r*0.2,'#c8b8e0'); }
}); }});
definePropKind('c_driftwood',{n:2,R:20,col:{r:9,low:true},rot:false,make(seed,v){ const rng=mulberry32(seed), R=20; return spriteOf(R,g=>{
  g.save(); g.rotate(v?0.5:-0.35); c1Ell(g,2,4,R*0.95,4.5,'rgba(70,56,40,.3)'); c1Shade(g,-R*0.9,-4,R*1.8,8,'#c6b8a0'); c1Ell(g,R*0.9,0,2.6,4,'#9a8c78');
  g.strokeStyle='#9a8c78'; g.lineWidth=1; for(let i=0;i<3;i++){ const x=-R*0.6+i*R*0.5; g.beginPath(); g.moveTo(x,-2); g.lineTo(x+6,-1.5); g.stroke(); }
  g.strokeStyle='#c6b8a0'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-R*0.2,-3); g.lineTo(-R*0.35,-9); g.stroke(); g.restore();
}); }});
definePropKind('c_nest',{n:2,R:11,rot:false,make(seed,v){ const rng=mulberry32(seed), R=11; return spriteOf(R,g=>{
  celBall(g,0,0,R,'#9a7a4a',['#c8a870','#9a7a4a','#6a5030']); c1Ell(g,0,0,R*0.62,R*0.5,'#5a4428');
  for(let i=0;i<(v?3:2);i++) celBall(g,-3+i*3,-1+(i%2)*2,2.6,'#e8e2c8',['#ffffff','#e8e2c8','#a8a088']);
  g.strokeStyle='#c8a870'; g.lineWidth=1; for(let i=0;i<6;i++){ const a=rng()*TAU; g.beginPath(); g.moveTo(Math.cos(a)*R*0.6,Math.sin(a)*R*0.6); g.lineTo(Math.cos(a)*R*1.05,Math.sin(a)*R*0.95); g.stroke(); }
}); }});
definePropKind('c_crabpot',{n:2,R:11,col:{r:8,low:true},rot:false,make(seed,v){ const R=11; return spriteOf(R,g=>{
  c1Ell(g,2,4,9,4,'rgba(40,30,20,.3)'); c1Shade(g,-8,-8,16,13,v?'#8e6a40':'#7a5a34');
  g.strokeStyle='rgba(240,230,200,.7)'; g.lineWidth=0.9; for(let i=-6;i<=6;i+=3){ g.beginPath(); g.moveTo(i,-8); g.lineTo(i,5); g.stroke(); } g.beginPath(); g.moveTo(-8,-2); g.lineTo(8,-2); g.stroke();
  c1Ell(g,0,-9,5,1.8,'#5a3e22');
}); }});
definePropKind('c_netpole',{n:2,R:22,col:{r:6},rot:false,make(seed){ const R=22; return spriteOf(R,g=>{
  c1Ell(g,4,4,18,4,'rgba(40,30,20,.3)');
  for(const sx of [-14,14]){ c1Shade(g,sx-2,-22,4,24,'#7a5634'); }
  g.strokeStyle='#5a4428'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-14,-20); g.lineTo(14,-20); g.stroke();
  // the drying net, a droopy mesh
  g.strokeStyle='rgba(70,110,110,.85)'; g.lineWidth=1; for(let i=0;i<=6;i++){ const x=-13+i*4.3; g.beginPath(); g.moveTo(x,-20); g.quadraticCurveTo(x+1,-10,x,-4); g.stroke(); } for(let j=0;j<4;j++){ const y=-17+j*4; g.beginPath(); g.moveTo(-13,y); g.quadraticCurveTo(0,y+3,13,y); g.stroke(); }
  c1Ell(g,8,-12,2.4,2.4,'#e8a040');
}); }});
definePropKind('c_mooring',{n:2,R:8,col:{r:6},rot:false,make(seed,v){ const R=8; return spriteOf(R,g=>{
  c1Ell(g,2,3,6,2.6,'rgba(30,30,40,.3)'); c1Shade(g,-3.5,-12,7,14,'#6a4a2c'); c1Ell(g,0,-12,3.5,1.6,'#8e6a40');
  if(v){ g.strokeStyle='#d8c8a0'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-3.5,-6); g.lineTo(3.5,-6); g.moveTo(-3.5,-4); g.lineTo(3.5,-4); g.stroke(); }
}); }});
definePropKind('c_boat',{n:2,R:28,col:{r:16,low:true},rot:false,make(seed,v){ const R=28; return spriteOf(R,g=>{
  // an upturned boat: the hull seen from above, keel up
  g.save(); g.rotate(v?0.25:-0.3); c1Ell(g,3,5,R*0.95,R*0.38,'rgba(40,30,30,.3)');
  celFill(g,(q,dx,dy)=>q.ellipse(dx,dy,R*0.92,R*0.34,0,0,TAU),v?'#4a7aa0':'#b8503a',{r:R*0.4});
  g.strokeStyle='rgba(255,250,230,.55)'; g.lineWidth=1.2; g.beginPath(); g.ellipse(0,0,R*0.75,R*0.22,0,0,TAU); g.stroke();
  g.strokeStyle='#3a2a20'; g.lineWidth=2.2; g.beginPath(); g.moveTo(-R*0.9,0); g.lineTo(R*0.9,0); g.stroke(); g.restore();
}); }});
definePropKind('c_standstone',{n:3,R:14,col:{r:9},rot:false,make(seed){ const rng=mulberry32(seed), R=14; return spriteOf(R,g=>{
  c1Ell(g,4,5,9,4,'rgba(40,40,50,.32)'); const w=9+rng()*4, h=18+rng()*6;
  celFill(g,(q,dx,dy)=>{ q.moveTo(-w/2+dx,4+dy); q.lineTo(-w/2+1+dx,-h+4+dy); q.quadraticCurveTo(dx,-h-1+dy,w/2-1+dx,-h+5+dy); q.lineTo(w/2+dx,4+dy); q.closePath(); },'#9a9aa2',{r:10});
  c1Ell(g,-1,-h*0.4,2.6,2,'#b8c88a'); c1Ell(g,2,-h*0.65,1.8,1.4,'#c8d89a');
}); }});
definePropKind('c_crate',{n:2,R:12,col:{r:10,low:true},rot:false,make(seed,v){ return spriteOf(12,g=>{
  c1Ell(g,3,6,10,4,'rgba(40,30,20,.3)'); c1Shade(g,-9,-10,18,16,v?'#a07a4a':'#8e6a40'); g.strokeStyle='#5a3e22'; g.lineWidth=1.3; g.strokeRect(-9,-10,18,16); g.beginPath(); g.moveTo(-9,-10); g.lineTo(9,6); g.stroke(); c1Rect(g,-9,-12,18,3,v?'#b88a5a':'#a07a4a');
}); }});
definePropKind('c_barrel',{n:2,R:11,col:{r:9,low:true},rot:false,make(seed,v){ return spriteOf(11,g=>{
  c1Ell(g,2,5,9,3.6,'rgba(40,30,20,.3)'); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy,8,10,0,0,TAU); },v?'#8a5a32':'#7a5634',{r:9}); c1Ell(g,0,-7,7,3,'#a07a4a'); c1Ell(g,0,-7,5,1.8,'#6a4a2c');
  g.strokeStyle='#c8963a'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-8,-2); g.quadraticCurveTo(0,1,8,-2); g.moveTo(-7.4,4); g.quadraticCurveTo(0,7,7.4,4); g.stroke();
}); }});

// ================= 2. critters: sheep (the Downs, Lantern Point), crabs (the beaches), gulls (everywhere by the sea)
defineCritter('c_sheep',{r:11,draw(c){ const x=c.x, y=c.y, t=G.time+c.x*0.01, k=c.moving?Math.sin(t*12)*1.4:0, f=c.face||0, fl=Math.cos(f)<0?-1:1;
  ctx.save(); ctx.translate(x,y); ctx.scale(fl,1);
  ctx.fillStyle='rgba(40,40,50,.25)'; ctx.beginPath(); ctx.ellipse(1,6,11,4,0,0,TAU); ctx.fill();
  ctx.fillStyle='#3a2a2a'; for(const lx of [-6,-2,3,7]) ctx.fillRect(lx,1+(lx%2?k:-k)*0.5,2,6);
  const ol=LOOK.sb?SBC.outline:'#5a5050'; ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(0,-3,11.2,8.2,0,0,TAU); ctx.fill();
  for(const [bx,by,br] of [[-6,-3,5.4],[-1,-6,5.6],[4,-4,5.4],[0,-1,6],[-4,0,4.6],[5,0,4.4]]){ ctx.fillStyle='#e6e2d8'; ctx.beginPath(); ctx.arc(bx,by,br,0,TAU); ctx.fill(); ctx.fillStyle='#fffcf2'; ctx.beginPath(); ctx.arc(bx-1.2,by-1.4,br*0.55,0,TAU); ctx.fill(); }
  ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(10,-5,4.6,3.8,0,0,TAU); ctx.fill(); ctx.fillStyle='#3a3030'; ctx.beginPath(); ctx.ellipse(10,-5,3.8,3.1,0,0,TAU); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(11.4,-6,0.9,0,TAU); ctx.fill(); ctx.restore(); }});
defineCritter('c_crab',{r:7,draw(c){ const x=c.x, y=c.y, t=G.time*14+c.x, k=c.moving?Math.sin(t):0;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(60,30,30,.25)'; ctx.beginPath(); ctx.ellipse(0,3,7,2.6,0,0,TAU); ctx.fill();
  ctx.strokeStyle='#a83a2a'; ctx.lineWidth=1.3; for(const s of [-1,1]) for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(s*3,i-1); ctx.lineTo(s*(7+(i===1?k:0)),i*2-2+k*0.6); ctx.stroke(); }
  if(LOOK.sb){ ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(0,-1,5.6,4.2,0,0,TAU); ctx.fill(); }
  ctx.fillStyle='#e0563a'; ctx.beginPath(); ctx.ellipse(0,-1,4.6,3.4,0,0,TAU); ctx.fill(); ctx.fillStyle='#ff8a5a'; ctx.beginPath(); ctx.ellipse(-1.2,-2,2,1.3,0,0,TAU); ctx.fill();
  for(const s of [-1,1]){ ctx.fillStyle='#e0563a'; ctx.beginPath(); ctx.arc(s*5.4,-4.4,1.9,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillRect(s*1.6-0.6,-5.4,1.2,1.2); }
  ctx.restore(); }});
defineCritter('c_gull',{r:8,draw(c){ const x=c.x, y=c.y, f=c.face||0, fl=Math.cos(f)<0?-1:1, hop=c.moving?Math.abs(Math.sin(G.time*16+c.x))*2:0;
  ctx.save(); ctx.translate(x,y-hop); ctx.scale(fl,1);
  ctx.fillStyle='rgba(40,40,60,.22)'; ctx.beginPath(); ctx.ellipse(0,5+hop,7,2.4,0,0,TAU); ctx.fill();
  ctx.fillStyle='#f2a020'; ctx.fillRect(-1.5,1,1.2,4); ctx.fillRect(1.5,1,1.2,4);
  if(LOOK.sb){ ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(0,-2,8,5.2,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(6,-6,3.8,0,TAU); ctx.fill(); }
  ctx.fillStyle='#fafaf6'; ctx.beginPath(); ctx.ellipse(0,-2,7,4.2,0,0,TAU); ctx.fill(); ctx.fillStyle='#9aa4b4'; ctx.beginPath(); ctx.ellipse(-1.5,-3,5.2,2.6,-0.15,0,TAU); ctx.fill(); ctx.fillStyle='#3a3e48'; ctx.beginPath(); ctx.ellipse(-6,-3,2.4,1.6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#fafaf6'; ctx.beginPath(); ctx.arc(6,-6,3,0,TAU); ctx.fill(); ctx.fillStyle='#f2c020'; ctx.beginPath(); ctx.moveTo(8.5,-6.4); ctx.lineTo(12,-5.6); ctx.lineTo(8.5,-4.8); ctx.fill(); ctx.fillStyle='#222'; ctx.fillRect(6.6,-7.2,1.2,1.2);
  ctx.restore(); }});

// ================= 3. biomes 10 to 19 (bible 1.1); the ground colours follow STYLE.md (light and dark close to the base)
const C1W={shallow:'#7ad8e4',deep:'#3a8ccc',lip:'#f2fbf6'};
const c1Fl=(g,rng,x,y,cols,n)=>sbFlowers(g,rng,x,y,cols[Math.floor(rng()*cols.length)],n);
defineBiome(10,{name:'the Chalk Downs',level:9,col:['#8cc35a','#97cb64','#81b752'],road:'#f2ecdc',roadEdge:'rgba(168,150,118,.8)',water:C1W,shore:'#efe4c2',
  music:'c_downs',ambient:{wind:0.5,birds:true,rain:0.4,gulls:0.15},critters:['c_sheep','rabbit'],chests:5,events:{snow:false},
  props(rng,x,y,s,grove){ const r=rng(); if(grove>0.32&&r<0.05) return {k:'c_hawthorn',v:Math.floor(rng()*3),s:0.8+rng()*0.3}; if(r<0.012) return {k:'c_hawthorn',v:Math.floor(rng()*3)}; if(r<0.022) return {k:'c_chalkrock',s:0.7+rng()*0.6}; if(r<0.028) return {k:'c_haybale'}; if(grove<-0.3&&r<0.05) return {k:'c_gorse',s:0.8+rng()*0.4}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.36) sbTuft(g,x,y,'rgba(92,140,58,.6)',0.8+rng()*0.5); else if(r<0.39) c1Fl(g,rng,x,y,['#e8403a','#e8403a','#8a8ae8','#f4f0e8'],3); else if(r<0.405) sbPebble(g,x,y,1.6+rng()*1.6,'#f4f0e4'); }});
defineBiome(11,{name:'the White Cliffs',level:10,col:['#9fc46a','#a8cc73','#93b961'],road:'#f0e8d4',roadEdge:'rgba(160,146,112,.8)',water:C1W,shore:'#f0e6c8',
  music:'c_coast',ambient:{wind:0.7,birds:true,rain:0.45,gulls:0.7,waves:0.4},critters:['c_gull','rabbit'],chests:3,events:{snow:false},
  props(rng,x,y,s,grove){ const r=rng(); if(grove>0.25&&r<0.045) return {k:'c_seapine'}; if(r<0.008) return {k:'c_seapine'}; if(r<0.03) return {k:'c_gorse',s:0.7+rng()*0.5}; if(r<0.05) return {k:'c_thrift'}; if(r<0.056) return {k:'c_chalkrock',s:0.6+rng()*0.5}; if(r<0.06) return {k:'c_nest',v:Math.floor(rng()*2)}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.34) sbTuft(g,x,y,'rgba(110,146,70,.6)',0.8+rng()*0.4); else if(r<0.38) c1Fl(g,rng,x,y,['#f08ab4','#f8b8d0','#ffffff'],3); else if(r<0.39) sbPebble(g,x,y,1.4+rng(),'#f2eee2'); }});
defineBiome(12,{name:'Gearhaven',level:10,col:['#c7b693','#cfbf9c','#bcab88'],road:'#9a8c78',roadEdge:'rgba(250,240,214,.85)',roadW:24,water:{shallow:'#6ccad8',deep:'#3a86c0',lip:'#eaf6f2'},shore:'#d8cca8',
  music:'c_gearhaven',ambient:{wind:0.25,birds:true,gulls:0.4,steam:0.25},critters:['c_gull'],chests:0,events:{snow:false,goats:false,wolves:false},
  props(rng,x,y,s){ const r=rng(); if(r<0.006) return {k:'c_crate',v:Math.floor(rng()*2)}; if(r<0.011) return {k:'c_barrel',v:Math.floor(rng()*2)}; if(r<0.014) return {k:'c_pipe',v:Math.floor(rng()*2)}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.42){ // cobbles: chunky rounded stones in the ground's own tones, a few lit ones
      const w=6+rng()*5, h=4+rng()*3; g.fillStyle='rgba(140,120,92,.42)'; rrect(g,x-w/2+0.8,y-h/2+1,w,h,2); g.fill(); g.fillStyle=r<0.12?'rgba(236,226,200,.75)':r<0.3?'rgba(214,200,170,.6)':'rgba(186,170,138,.5)'; rrect(g,x-w/2,y-h/2,w,h,2); g.fill(); }
    else if(r<0.445){ const w=16+rng()*10, h=9+rng()*5; g.fillStyle='rgba(120,104,80,.35)'; rrect(g,x-w/2+1,y-h/2+1.4,w,h,2.4); g.fill(); g.fillStyle='rgba(232,222,196,.7)'; rrect(g,x-w/2,y-h/2,w,h,2.4); g.fill(); }
    else if(r<0.448){ g.fillStyle='rgba(59,34,51,.7)'; rrect(g,x-6,y-4,12,8,1.5); g.fill(); g.fillStyle='rgba(216,164,64,.95)'; for(let i=0;i<4;i++) g.fillRect(x-4.5+i*2.8,y-3,1.3,6); } }});
defineBiome(13,{name:'the Brass Yards',level:11,col:['#8e7d64','#97866c','#84735b'],road:'#b6a586',roadEdge:'rgba(92,72,52,.8)',water:{shallow:'#7cb8b8',deep:'#3a6a80',lip:'#d8e4dc'},shore:'#a8987a',
  music:'c_brass',ambient:{wind:0.3,birds:false,rain:0.3,steam:0.4},critters:false,chests:3,events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ const r=rng(); if(grove>0.2&&r<0.045) return {k:'c_scrap'}; if(r<0.012) return {k:'c_gear',v:Math.floor(rng()*2)}; if(r<0.02) return {k:'c_pipe',v:Math.floor(rng()*2)}; if(r<0.026) return {k:'c_scrap',s:0.7+rng()*0.4}; if(r<0.03) return {k:'c_crate'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.012){ // an oily puddle with a rainbow sheen
      g.fillStyle='rgba(40,34,40,.55)'; g.beginPath(); g.ellipse(x,y,7+rng()*9,3+rng()*4,0,0,TAU); g.fill(); g.strokeStyle='rgba(180,120,220,.55)'; g.lineWidth=1; g.beginPath(); g.ellipse(x-1,y-1,4,1.6,0,0,TAU); g.stroke(); g.strokeStyle='rgba(120,220,200,.45)'; g.beginPath(); g.ellipse(x+1,y,5,2,0,0,TAU); g.stroke(); }
    else if(r<0.24) sbTuft(g,x,y,'rgba(110,96,70,.5)',0.7+rng()*0.4); else if(r<0.3) sbPebble(g,x,y,1.4+rng()*1.4,rng()<0.5?'#7a6a58':'#a48a62'); }});
defineBiome(14,{name:'the Saltmarsh Flats',level:9,col:['#a8b878','#b0c080','#9dad6d'],road:'#e4d6a8',roadEdge:'rgba(150,130,90,.8)',water:{shallow:'#6cc4c0',deep:'#3a9aac',lip:'#eef8ee'},shore:'#ddd0a4',
  music:'c_saltmarsh',ambient:{wind:0.4,birds:true,mist:0.3,rain:0.5,gulls:0.6,waves:0.2},critters:['c_gull','c_crab'],chests:3,footprints:'sand',events:{snow:false},
  props(rng,x,y,s,grove){ const r=rng(); if(s.shore>0||grove>0.15){ if(r<0.16) return {k:'reed'}; } if(r<0.03) return {k:'reed'}; if(r<0.034) return {k:'c_crabpot',v:Math.floor(rng()*2)}; if(r<0.037) return {k:'c_mooring',v:Math.floor(rng()*2)}; if(r<0.039) return {k:'c_boat',v:Math.floor(rng()*2)}; if(r<0.041) return {k:'c_netpole'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.05){ g.fillStyle='rgba(214,200,150,.55)'; g.beginPath(); g.ellipse(x,y,8+rng()*14,4+rng()*6,rng()*0.5,0,TAU); g.fill(); } else if(r<0.32) sbTuft(g,x,y,'rgba(120,140,80,.55)',0.8+rng()*0.5); else if(r<0.34) sbPebble(g,x,y,1.2+rng(),'#e8dcb4'); }});
defineBiome(15,{name:'the Rockpools',level:10,col:['#e2d6aa','#e9ddb3','#d8cc9f'],road:'#f2e8c8',roadEdge:'rgba(170,150,110,.8)',water:C1W,shore:'#f0e6c2',
  music:'c_coast',ambient:{wind:0.6,birds:true,rain:0.4,gulls:0.8,waves:0.9},critters:['c_crab','c_gull'],chests:3,footprints:'sand',events:{snow:false,goats:false},
  props(rng,x,y,s){ if(c1InP(C1G.sandsP,x,y)) return null; const r=rng(); if(r<0.018) return {k:'c_barnrock',s:0.7+rng()*0.6}; if(r<0.028) return {k:'c_kelp'}; if(r<0.033) return {k:'c_driftwood',v:Math.floor(rng()*2)}; if(r<0.036) return {k:'c_nest'}; return null; },
  decor(g,rng,x,y,s,r){ c1SandDecor(g,rng,x,y,r); }});
function c1SandDecor(g,rng,x,y,r){
  if(r<0.0075){ // a rockpool: dark rim, turquoise water, a glint
    const rx=8+rng()*12, ry=5+rng()*6; g.fillStyle='rgba(110,98,80,.75)'; g.beginPath(); g.ellipse(x,y,rx+2.4,ry+2,0,0,TAU); g.fill(); g.fillStyle='#5ec2c8'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x-rx*0.35,y-ry*0.3,rx*0.3,ry*0.18,0,0,TAU); g.fill();
    if(rng()<0.5){ g.fillStyle='#ff8a5a'; sbStar(g,5,3.2,1.4,rng(),x+rx*0.3,y+ry*0.2); g.fill(); } }
  else if(r<0.013){ g.fillStyle='#ff8a5a'; sbStar(g,5,3.4,1.5,rng()*TAU,x,y); g.fill(); g.fillStyle='rgba(120,50,30,.4)'; g.beginPath(); g.arc(x+0.4,y+0.5,1,0,TAU); g.fill(); }
  else if(r<0.07){ g.strokeStyle='rgba(170,150,110,.45)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-7,y); g.quadraticCurveTo(x,y-2.5,x+7,y); g.stroke(); }
  else if(r<0.1) sbPebble(g,x,y,1.4+rng()*1.8,rng()<0.5?'#a8a4a0':'#f6f0e4');
  else if(r<0.11){ g.fillStyle='#f6eee0'; g.beginPath(); g.arc(x,y,2.2,Math.PI,TAU); g.fill(); g.strokeStyle='rgba(160,140,120,.6)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(x-2,y); g.lineTo(x,y-2); g.lineTo(x+2,y); g.stroke(); }
}
defineBiome(16,{name:'Lantern Point',level:12,col:['#9cbf5e','#a5c767','#91b454'],road:'#ecdcb0',roadEdge:'rgba(140,120,80,.8)',water:C1W,shore:'#eee2c0',
  music:'c_coast',ambient:{wind:0.8,birds:true,rain:0.5,gulls:0.6,waves:0.5},critters:['c_sheep','c_gull'],chests:3,events:{snow:false},
  props(rng,x,y,s,grove){ const r=rng(); if(grove>0.1&&r<0.12) return {k:'c_heather',s:0.8+rng()*0.5}; if(r<0.03) return {k:'c_heather'}; if(r<0.045) return {k:'c_gorse',s:0.7+rng()*0.4}; if(r<0.048) return {k:'c_standstone'}; if(r<0.052) return {k:'c_seapine'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.32) sbTuft(g,x,y,'rgba(108,142,62,.6)',0.8+rng()*0.4); else if(r<0.37) c1Fl(g,rng,x,y,['#a85ab8','#c88ad2','#ffd23a'],3); }});
defineBiome(17,{name:'Gullcrag Head',level:11,col:['#6f8a5a','#779262','#668052'],road:'#c8c0a0',roadEdge:'rgba(70,70,60,.8)',water:{shallow:'#6ac8d4',deep:'#2e78b8',lip:'#eef8f4'},shore:'#c8c0a4',
  music:'c_coast',ambient:{wind:0.8,birds:true,rain:0.5,gulls:1,waves:0.7},critters:['c_gull'],chests:2,events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ if(c1InP(C1G.sandsP,x,y)) return null; const r=rng(); if(r<0.03) return {k:'c_nest',v:Math.floor(rng()*2)}; if(r<0.045) return {k:'c_thrift'}; if(grove>0.25&&r<0.07) return {k:'crag',s:0.6+rng()*0.4}; if(r<0.055) return {k:'rock',s:0.6+rng()*0.4}; return null; },
  decor(g,rng,x,y,s,r){ if(c1InP(C1G.sandsP,x,y)){ c1SandDecor(g,rng,x,y,r); return; } if(r<0.3) sbTuft(g,x,y,'rgba(80,106,64,.6)',0.8+rng()*0.4); else if(r<0.33) c1Fl(g,rng,x,y,['#f08ab4','#ffffff'],2); else if(r<0.36){ g.fillStyle='rgba(250,250,240,.75)'; g.beginPath(); g.ellipse(x,y,1.6+rng()*2,1+rng(),0,0,TAU); g.fill(); } }});
defineBiome(18,{name:'the Moth Wood',level:12,col:['#7d8a7a','#859282','#748170'],road:'#c8c6c8',roadEdge:'rgba(80,76,90,.8)',water:{shallow:'#88b8c8',deep:'#466a90',lip:'#e6eef4'},shore:'#b8b8b0',
  music:'c_mothwood',ambient:{mist:0.5,night:0.12,birds:false,wind:0.2,rain:0.4,moths:0.8},critters:false,chests:2,events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ const r=rng(); if(grove>-0.05&&r<0.2) return {k:'c_mothbirch',v:Math.floor(rng()*4),s:0.85+rng()*0.35}; if(r<0.06) return {k:'c_mothbirch',v:Math.floor(rng()*4)}; if(r<0.09) return {k:'c_shroom'}; if(r<0.1) return {k:'fshrub'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.3) sbTuft(g,x,y,'rgba(96,108,94,.55)',0.8+rng()*0.4); else if(r<0.36){ g.fillStyle='rgba(236,232,250,.7)'; g.beginPath(); g.arc(x,y,0.9+rng(),0,TAU); g.fill(); } else if(r<0.37) sbPebble(g,x,y,1.4,'#d8d6e0'); }});
defineBiome(19,{name:'the Shadow Shoals',level:13,col:['#57546d','#5e5b76','#504d65'],road:'#7a7490',roadEdge:'rgba(30,26,44,.8)',water:{shallow:'#3e4078',deep:'#1c1c40',lip:'#b8b0e0'},shore:'#605a78',
  music:'c_spire',ambient:{mist:0.6,night:0.25,birds:false,wind:0.4,moths:0.6,waves:0.5},critters:false,chests:0,events:{snow:false,goats:false},
  props(rng,x,y,s){ const r=rng(); if(r<0.06) return {k:'c_blackrock',s:0.7+rng()*0.5}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.08){ g.fillStyle='rgba(200,190,255,.55)'; g.beginPath(); g.arc(x,y,0.9,0,TAU); g.fill(); } else if(r<0.2) sbPebble(g,x,y,1.6+rng()*1.6,'#3c3650'); }});
const C1B_COAST=[10,11,12,13,14,15,16,17,18,19];

// ================= 4. terrain: which region a point belongs to, the tide, the risen spire, the snow
// Regions follow the cliffs (the elevation grid), so a cliff top is always cliff-top turf and the beach under it sand.
function c1Region(x,y,lv,n){
  if(y>29250&&x>5300&&x<9750) return 19;
  if(x<2700&&y>27900) return c1InP(C1G.sandsP,x,y)?15:17;
  if(lv>=2){
    if(x>2840&&x<6420&&y>25050&&y<27950) return 11;
    if(x>8540&&x<10620&&y>25940&&y<28800) return 11;
    if(x>=6100&&x<=8500&&y>=24080&&y<=25240) return 12;
  }
  if(lv>=1&&x>6320&&x<8660&&y>25150&&y<26720) return 12;
  if(lv>=1&&x>9800&&y>25900) return 16;
  if(lv>=1&&y<24320) return 10;
  const wx=x+n*240, wy=y+n*180;
  if(lv===0){
    if(y>25240&&y<26720&&x>6320&&x<8660) return 12;
    if(x>9800&&y>27300) return 15;
    if(x>2780&&x<6500&&y>27250) return 15;
    if(x>6300&&x<9550&&y>26500) return 15;
    if(lv===0&&x>2560&&x<3000&&y>27700) return 15;
  }
  if(wy<24060&&wx<2780) return 18;
  if(wx<3020) return 14;
  if(wx>8520&&wx<12300&&wy>23740&&wy<26000) return 13;
  return 10;
}
// the dynamic layers: are the sands under the sea, is the spire up, is it snowing
const C1T={low:false,spire:false,snow:false,clock:false};
function c1DynLand(x,y){
  if(c1InD(C1G.spire,x,y)) return true;
  for(const r of C1G.causeway) if(c1InR(r,x,y)) return true;
  return false;
}
function c1Extra(x,y,o){
  const lv=elevLvl(x,y), b=c1Region(x,y,lv,o.n);
  o.b=b; o.b2=b; o.t=1;
  if(x<2120&&y>27840&&y<29460&&c1InP(C1G.sandsP,x,y)){
    if(!C1T.low){ o.water=1; o.depth=0.7; o.sea=1; o.deep=0; o.seaD=0.22; o.shore=0; o.road=0; o.bridge=0; }
    else{ o.water=0; o.depth=0; o.sea=0; o.deep=0; o.seaD=0; o.sand=0.42; o.shore=0; }
  }
  if(C1T.spire&&y>28900&&y<30550&&x>7080&&x<7740&&c1DynLand(x,y)){ o.water=0; o.depth=0; o.sea=0; o.deep=0; o.seaD=0; o.shore=0; o.b=19; o.b2=19; }
  if(o.water&&x>9540&&x<9830&&y>25800&&y<28400){ o.seaD=0.55+0.25*clamp(o.depth,0,1); o.depth=1; }
  if(C1T.snow&&!o.water&&o.road<0.5) o.snow=clamp(0.16+o.n*0.5,0,0.34);
}
// skimming: Ash sprints across water with the Skimmer (a rip current lets only that through)
function c1Skim(){ const p=player; return !!(p&&p.sprinting&&p.onWater&&typeof canSkim==='function'&&canSkim()); }
function c1RipAt(x,y){
  if(c1InR(C1G.mouth,x,y)) return true;
  if(c1InR(C1G.sealRip,x,y)) return true;
  if(C1T.spire&&c1InR(C1G.causewayRip,x,y)) return true;
  return false;
}
function c1Block(x,y){
  if(x>9562&&x<9800&&y>25820&&y<28330) return true;                                         // the Cut
  if(!C1T.low&&x>1220&&x<2100&&y>27850&&y<29450&&c1InP(C1G.sandsP,x,y)) return true;       // high tide on the sands
  if(c1RipAt(x,y)&&!c1Skim()) return true;                                                  // rips: skim only
  return false;
}
// calm water: the harbor and the skim lanes do not count as deep sea for Water Stride
function c1Calm(x,y){
  if(c1InP(C1G.harborP,x,y)) return true;
  if(c1InR(C1G.sealLane,x,y)) return true;
  if(C1T.spire&&y>28940&&y<29960&&x>7140&&x<7470) return true;
  return false;
}
// ---------- the roads (bible 1.5, routed round the cliffs; ramps carry them over the faces)
const C1ROADS=[
  [[3400,20520],[3700,21000],[4300,21800],[5200,22700],[6200,23400],[6800,23950],[6950,24100],[6950,24300],[6920,24560],[6880,24700]],     // the Pass Road
  [[6200,23400],[7300,22600],[8800,21700],[10400,21900],[12000,22600],[13200,23400],[13200,23950]],                                        // the Downs Road
  [[6880,24700],[6600,24900],[6340,25060],[6100,25170],[5600,25500],[4600,25850],[4300,25950],[3500,26120],[3060,26150],[2930,26190],[2900,26300],[2860,26410],[2760,26440],[2200,26450]],  // the Coast Road
  [[8000,25700],[8800,25400],[9600,25000],[10200,24760]],                                                                                  // the Brass Road
  [[10200,24760],[10600,23400],[10400,21900]],                                                                                              // the Yards Lane
  [[8400,26300],[8600,26290],[9200,26700],[9522,26935]],                                                                                    // the Lantern Road, west of the Cut
  [[9825,26985],[10225,27000],[10225,27140],[10600,27250],[11500,27500],[12100,28100],[12600,28700],[12880,28820],[12880,29000]],         // the Lantern Road, east of the Cut
  [[1900,26300],[1600,25000],[1400,23500],[1300,22600]],                                                                                    // the Moth Track
  // Gearhaven, the Upper Town
  [[6880,24700],[6900,24990],[7700,24990],[8200,24990]],
  [[7070,24990],[7070,25150]], [[7700,24990],[7700,25150]], [[8100,24990],[8100,24580],[7760,24540],[7700,24500]],
  // the Lower Town
  [[7070,25400],[7040,25640],[7000,25900],[7100,26150],[7300,26260],[7700,26300],[8000,26330],[8400,26300]],
  [[7700,25340],[7700,25640],[7600,25900],[7300,26260]],
  [[6600,25800],[6800,25880],[7000,25900]], [[6900,25960],[6800,26300],[6720,26420]],
  [[8000,26330],[8540,26560],[8560,27150]]
];
// Saltmarsh boardwalks, the breakwaters, the Far Pier and the crane piers (walkable over water)
const C1WALK=[
  {x0:1960,y0:26380,x1:2280,y1:26520},{x0:1970,y0:26520,x1:2030,y1:26760},{x0:1880,y0:26740,x1:2130,y1:26900},
  {x0:2260,y0:26460,x1:2320,y1:26700},{x0:2290,y0:26680,x1:2560,y1:26790},
  {x0:1700,y0:26560,x1:1960,y1:26610},{x0:1640,y0:26480,x1:1780,y1:26620},{x0:1700,y0:26610,x1:1750,y1:26860},
  {x0:1560,y0:26830,x1:1760,y1:26880},{x0:1560,y0:26830,x1:1610,y1:27010},{x0:1200,y0:26965,x1:1610,y1:27010},{x0:1060,y0:26955,x1:1250,y1:27175},
  {x0:1600,y0:26740,x1:1720,y1:26800},
  {x0:1380,y0:27330,x1:1430,y1:27660},{x0:1340,y0:27300,x1:1560,y1:27350},
  {x0:2120,y0:26900,x1:2180,y1:27000},{x0:2060,y0:26990,x1:2280,y1:27050},
  // the breakwaters (drawn as big stones by c1PaintHarbor)
  {x0:6080,y0:28860,x1:6500,y1:28945,draw:false},{x0:6480,y0:28880,x1:6900,y1:28970,draw:false},{x0:6880,y0:28910,x1:7330,y1:29015,draw:false},
  {x0:7890,y0:28770,x1:8300,y1:28870,draw:false},{x0:8280,y0:28820,x1:8720,y1:28930,draw:false},
  // the Far Pier and the two crane piers
  {x0:8240,y0:27125,x1:8570,y1:27175},{x0:7660,y0:26440,x1:7740,y1:26760,kind:'stone'},{x0:8060,y0:26440,x1:8140,y1:26960,kind:'stone'},
  // Skipper Jo's slipway
  {x0:6660,y0:26440,x1:6760,y1:26560}
];
const C1SEEDS=[[4000,21000,10],[9000,22000,10],[12500,22500,10],[1300,21800,18],[1300,25500,14],[4500,26300,11],[7300,24600,12],[7300,25800,12],[10300,24600,13],[12000,27600,16],[1300,28800,17],[4400,28200,15],[7400,30200,19]];

// ================= 5. standing things of the coast: drawn sorted with the figures (so Ash walks behind a lighthouse),
// each body painted once into a cached outlined sprite, only the live parts (sails, lamps, steam, hands) per frame
function c1Obj(k,x,y,o){
  o=Object.assign({k,x,y},o||{}); const D=C1K[k]||{};
  o.R=o.R||D.R||60; o.base=o.base!=null?o.base:y+(D.by||0);
  if(D.col&&o.col!==false){ const c=typeof D.col==='function'?D.col(o):D.col; for(const q of [].concat(c)) addCol(Object.assign({},q,q.t==='r'?{x0:x+q.x0,y0:y+q.y0,x1:x+q.x1,y1:y+q.y1}:{x:x+(q.dx||0),y:y+(q.dy||0)})); }
  if(D.light) for(const L of [].concat(D.light(o))) LIGHTS.push(L);
  C1.objs.push(o); const key=Math.floor(x/C1.bs)+'|'+Math.floor(y/C1.bs); let b=C1.bk.get(key); if(!b) C1.bk.set(key,b=[]); b.push(o);
  return o;
}
function c1ObjsInView(fn){
  const s=C1.bs, x0=Math.floor((cam.x-260)/s), x1=Math.floor((cam.x+W/zoom+260)/s), y0=Math.floor((cam.y-200)/s), y1=Math.floor((cam.y+H/zoom+700)/s);
  for(let i=x0;i<=x1;i++) for(let j=y0;j<=y1;j++){ const b=C1.bk.get(i+'|'+j); if(b) for(const o of b) fn(o); }
}
const C1DAY=()=>G&&!isNight();
// a brass and white stone palette for Gearhaven, plum outlines from the look
const C1C={chalk:'#f2ede0',stone:'#c8bea8',stoneD:'#a89c84',brass:'#d8a440',brassD:'#a07428',slate:'#4a6a8a',teal:'#3a8a8a',red:'#c8503a',wood:'#8e6a40',woodD:'#6a4a2c',iron:'#5a5e68'};
const C1K={
  lamp:{R:50,by:0,col:{t:'c',r:5,low:false},light:o=>({x:o.x,y:o.y-30,r:170,i:0.7,night:true,fire:true}),
    draw(o,t){ const nt=G&&daylight()<0.45; c1Put(c1Tall('lamp'+(nt?1:0),20,52,10,48,g=>c1LampArt(g,nt)),o.x,o.y); if(nt){ glowAt(o.x,o.y-32,30,'255,214,130',0.5); glowAt(o.x,o.y-32,9,'255,246,200',0.7); } }},
  wall:{R:90,by:6,col:o=>({t:'r',x0:-o.w/2,y0:-6,x1:o.w/2,y1:8}),
    draw(o){ c1Put(c1Tall('wall'+o.w,o.w+8,70,o.w/2+4,60,g=>{ const w=o.w;
      c1Ell(g,0,6,w/2+4,6,'rgba(50,30,40,.25)'); c1Shade(g,-w/2,-34,w,40,C1C.chalk);
      g.strokeStyle='rgba(150,140,120,.6)'; g.lineWidth=1; for(let y=-26;y<4;y+=10){ g.beginPath(); g.moveTo(-w/2,y); g.lineTo(w/2,y); g.stroke(); for(let x=-w/2+((y/10)%2?10:0);x<w/2;x+=20){ g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+10); g.stroke(); } }
      for(let x=-w/2;x<w/2-4;x+=18){ c1Shade(g,x,-44,12,11,C1C.chalk); }
      c1Rect(g,-w/2,-35,w,3,C1C.brass); }),o.x,o.y); }},
  gate:{R:120,by:8,col:[{t:'c',dx:-74,r:20},{t:'c',dx:74,r:20}],
    draw(o,t){ c1Put(c1Tall('gate',200,150,100,138,g=>{
      c1Ell(g,0,8,96,10,'rgba(50,30,40,.25)');
      for(const s of [-1,1]){ c1Shade(g,s*74-22,-100,44,106,C1C.chalk); c1Rect(g,s*74-26,-108,52,10,C1C.slate,2); g.fillStyle=C1C.slate; g.beginPath(); g.moveTo(s*74-26,-108); g.lineTo(s*74,-130); g.lineTo(s*74+26,-108); g.fill(); c1Ell(g,s*74,-74,9,9,C1C.brassD); c1Ell(g,s*74,-74,7,7,'#fff6dc'); }
      c1Shade(g,-52,-104,104,20,C1C.chalk); c1Rect(g,-52,-86,104,4,C1C.brass);
      g.fillStyle='#3b2a2a'; g.font=`900 9px ${UIF}`; g.textAlign='center'; g.fillText('GEARHAVEN',0,-91);
      g.strokeStyle=C1C.brass; g.lineWidth=3; g.beginPath(); g.arc(0,-6,46,Math.PI,TAU); g.stroke(); }),o.x,o.y); }},
  crane:{R:150,by:0,col:{t:'c',r:16},
    draw(o,t){ c1Put(c1Tall('crane'+(o.flip?1:0),210,240,100,226,g=>{ const f=o.flip?-1:1;
      c1Ell(g,0,6,30,10,'rgba(40,30,40,.3)'); c1Shade(g,-22,-14,44,20,C1C.stoneD);
      for(const s of [-1,1]){ g.strokeStyle='#6a4a2c'; g.lineWidth=5; g.beginPath(); g.moveTo(s*16,-10); g.lineTo(s*6,-170); g.stroke(); }
      g.strokeStyle='#8e6a40'; g.lineWidth=2.4; for(let y=-30;y>-170;y-=22){ g.beginPath(); g.moveTo(-14+(-y)*0.06,y); g.lineTo(14-(-y)*0.06,y-18); g.stroke(); }
      c1Shade(g,-14,-196,28,28,C1C.red); c1Rect(g,-16,-200,32,6,C1C.woodD,2); c1Rect(g,-8,-190,10,9,'#bfe0ea',1);
      g.strokeStyle='#5a3e22'; g.lineWidth=6; g.beginPath(); g.moveTo(0,-182); g.lineTo(f*95,-204); g.stroke(); g.strokeStyle='#8e6a40'; g.lineWidth=2.6; g.beginPath(); g.moveTo(0,-186); g.lineTo(f*95,-208); g.stroke();
      g.strokeStyle='#3a3030'; g.lineWidth=1.2; g.beginPath(); g.moveTo(f*90,-204); g.lineTo(f*90,-120); g.stroke(); c1Shade(g,f*90-10,-122,20,14,C1C.wood); }),o.x,o.y); }},
  tideclock:{R:110,by:6,col:{t:'r',x0:-30,y0:-14,x1:30,y1:8},
    draw(o,t){ c1Put(c1Tall('tideclock',100,190,50,180,g=>{
      c1Ell(g,0,6,40,9,'rgba(40,30,30,.3)');
      for(const s of [-1,1]){ c1Rect(g,s*26-3,-10,6,18,'#5a3e22'); }
      c1Shade(g,-30,-110,60,104,'#a0784a'); g.strokeStyle='rgba(70,46,26,.55)'; g.lineWidth=1; for(let y=-100;y<-6;y+=12){ g.beginPath(); g.moveTo(-30,y); g.lineTo(30,y); g.stroke(); }
      g.fillStyle='#4a6a8a'; g.beginPath(); g.moveTo(-38,-108); g.lineTo(0,-150); g.lineTo(38,-108); g.closePath(); g.fill(); g.fillStyle='#6a8aaa'; g.beginPath(); g.moveTo(-38,-108); g.lineTo(0,-150); g.lineTo(0,-108); g.closePath(); g.fill();
      c1Ell(g,0,-74,24,24,'#5a3e22'); c1Ell(g,0,-74,21,21,'#f6efda');
      g.fillStyle='#3b2a2a'; g.font=`900 8px ${UIF}`; g.textAlign='center'; g.fillText('HIGH',0,-83); g.fillText('LOW',0,-59);
      c1Rect(g,-9,-26,18,22,'#4a3020',2); c1Ell(g,5,-15,1.6,1.6,'#d8b04a'); }),o.x,o.y);
      // the big hand: HIGH until the clock is fixed, then LOW
      const low=C1T.low, a=low?Math.PI/2:-Math.PI/2+Math.sin(t*3)*0.04; ctx.strokeStyle='#3b2233'; ctx.lineWidth=3.2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(o.x,o.y-74); ctx.lineTo(o.x+Math.cos(a)*15,o.y-74+Math.sin(a)*15); ctx.stroke(); ctx.fillStyle='#c8963a'; ctx.beginPath(); ctx.arc(o.x,o.y-74,2.6,0,TAU); ctx.fill(); }},
  windmill:{R:150,by:4,col:{t:'c',r:26},
    draw(o,t){ c1Put(c1Tall('windmill',120,170,60,160,g=>{
      c1Ell(g,0,6,40,11,'rgba(40,40,30,.3)');
      celFill(g,(q,dx,dy)=>{ q.moveTo(-34+dx,4+dy); q.lineTo(-22+dx,-104+dy); q.lineTo(22+dx,-104+dy); q.lineTo(34+dx,4+dy); q.closePath(); },'#f2ece0',{r:30});
      g.fillStyle='#8a4a3a'; g.beginPath(); g.moveTo(-28,-100); g.quadraticCurveTo(0,-140,28,-100); g.closePath(); g.fill(); g.fillStyle='#a85a46'; g.beginPath(); g.moveTo(-28,-100); g.quadraticCurveTo(-8,-134,0,-122); g.lineTo(0,-100); g.closePath(); g.fill();
      c1Rect(g,-9,-24,18,26,'#6a4a2c',3); c1Rect(g,-6,-72,12,12,'#8ab4c4',2); c1Rect(g,-6,-48,12,10,'#8ab4c4',2); }),o.x,o.y);
      // the sails turn in the wind
      const hx=o.x, hy=o.y-112, a0=t*(0.9+(o.x%3)*0.1);
      ctx.save(); ctx.translate(hx,hy);
      for(let i=0;i<4;i++){ const a=a0+i*Math.PI/2; ctx.save(); ctx.rotate(a); ctx.fillStyle=LOOK.sb?SBC.outline:'#3a2a20'; ctx.fillRect(-3.2,-2,6.4,-62); ctx.fillStyle='#7a5634'; ctx.fillRect(-2,-2,4,-60); ctx.fillStyle=LOOK.sb?SBC.outline:'#3a2a20'; ctx.fillRect(2,-60,15,46); ctx.fillStyle='#f6efe0'; ctx.fillRect(3.2,-58.8,12.6,43.6); ctx.strokeStyle='rgba(120,100,80,.6)'; ctx.lineWidth=1; for(let y=-50;y>-58;y-=10){ } ctx.beginPath(); for(let y=-52;y<-16;y+=9){ ctx.moveTo(3,y); ctx.lineTo(16,y); } ctx.stroke(); ctx.restore(); }
      ctx.fillStyle=LOOK.sb?SBC.outline:'#2a1a10'; ctx.beginPath(); ctx.arc(0,0,6.5,0,TAU); ctx.fill(); ctx.fillStyle='#c8963a'; ctx.beginPath(); ctx.arc(0,0,4.5,0,TAU); ctx.fill(); ctx.restore(); }},
  lighthouse:{R:260,by:8,col:{t:'c',r:40},light:o=>({x:o.x,y:o.y-220,r:420,i:0.9,night:true,lh:true}),
    draw(o,t){ c1Put(c1Tall('lighthouse',150,320,75,306,g=>{
      c1Ell(g,0,8,62,14,'rgba(30,30,50,.32)'); c1Shade(g,-56,-16,112,24,'#9a9488');
      const top=-232; celFill(g,(q,dx,dy)=>{ q.moveTo(-42+dx,0+dy); q.lineTo(-26+dx,top+dy); q.lineTo(26+dx,top+dy); q.lineTo(42+dx,0+dy); q.closePath(); },'#f4f0e6',{r:40});
      g.save(); g.beginPath(); g.moveTo(-42,0); g.lineTo(-26,top); g.lineTo(26,top); g.lineTo(42,0); g.closePath(); g.clip();
      for(let i=0;i<4;i++){ const y0=-28-i*56; g.fillStyle=i%2?'#d24a3a':'#c8402e'; g.fillRect(-60,y0-28,120,28); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(-60,y0-28,22,28); }
      g.fillStyle='rgba(59,30,72,.18)'; g.fillRect(14,-240,40,240); g.restore();
      c1Rect(g,-34,top-6,68,10,'#3a3a44',2); c1Rect(g,-24,top-46,48,40,'#2a2a34',3); c1Rect(g,-20,top-42,40,32,'#fff4c8',2);
      g.fillStyle='#c8402e'; g.beginPath(); g.moveTo(-28,top-46); g.lineTo(0,top-74); g.lineTo(28,top-46); g.closePath(); g.fill(); c1Ell(g,0,top-76,4,4,'#d8a440');
      c1Rect(g,-12,-30,24,30,'#4a3020',3); c1Rect(g,-6,-130,12,14,'#7aa8c0',2); c1Rect(g,-6,-190,12,14,'#7aa8c0',2); }),o.x,o.y);
      const lit=C1F('c_lamp')||reached('c_spire'), nt=G&&daylight()<0.5, ly=o.y-252;
      if(lit){ glowAt(o.x,ly,nt?70:30,'255,236,160',nt?0.75:0.35); glowAt(o.x,ly,16,'255,255,230',0.9); }
      // the lens turns (with the Great Clock running); at night the lit lamp throws a turning beam out to sea
      if(C1T.clock){ const a=t*0.55; ctx.fillStyle='rgba(255,250,220,.65)'; ctx.fillRect(o.x-16+((Math.sin(a)*0.5+0.5)*28),ly-14,4,28); }
      if(lit&&nt&&C1T.clock){ const a=t*0.45; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.translate(o.x,ly); ctx.rotate(a); const gr=ctx.createLinearGradient(0,0,620,0); gr.addColorStop(0,'rgba(255,240,180,.35)'); gr.addColorStop(1,'rgba(255,240,180,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(620,-70); ctx.lineTo(620,70); ctx.lineTo(0,8); ctx.closePath(); ctx.fill(); ctx.restore(); } }},
  stall:{R:70,by:10,col:{t:'r',x0:-34,y0:-10,x1:34,y1:12},
    draw(o){ const v=o.v||0; c1Put(c1Tall('stall'+v,96,90,48,80,g=>{ const cA=['#d8503a','#3a8a8a','#e0a030','#6a5aa8'][v%4];
      c1Ell(g,0,10,44,8,'rgba(40,30,30,.3)'); c1Shade(g,-36,-18,72,28,C1C.wood); for(let i=0;i<5;i++) celBall(g,-24+i*12,-20,4.5,['#e8503a','#f0c040','#7ac04a','#e88a3a','#b05ad0'][(i+v)%5]);
      for(const s of [-1,1]) c1Rect(g,s*33-2,-58,4,48,C1C.woodD);
      for(let i=0;i<6;i++){ g.fillStyle=i%2?'#fff6e6':cA; g.beginPath(); g.moveTo(-40+i*13.4,-58); g.lineTo(-40+(i+1)*13.4,-58); g.lineTo(-38+(i+1)*13.4,-44); g.lineTo(-38+i*13.4,-44); g.closePath(); g.fill(); }
      for(let i=0;i<6;i++){ g.fillStyle=i%2?'#fff6e6':cA; g.beginPath(); g.arc(-33+i*13.4,-44,6.7,0,Math.PI); g.fill(); } }),o.x,o.y); }},
  board:{R:60,by:6,col:{t:'r',x0:-26,y0:-6,x1:26,y1:8},
    draw(o){ c1Put(c1Tall('board',80,90,40,82,g=>{
      c1Ell(g,0,6,30,6,'rgba(40,30,30,.3)'); for(const s of [-1,1]) c1Rect(g,s*24-2,-62,4,66,C1C.woodD);
      c1Shade(g,-30,-66,60,44,'#8e6a40'); c1Rect(g,-27,-63,54,38,'#f2e6c6',2);
      g.fillStyle='#3b2a2a'; g.font=`900 6.5px ${UIF}`; g.textAlign='center'; g.fillText('MOTH MASK',0,-55); g.fillText('WATCH',0,-48);
      for(let i=0;i<3;i++){ c1Rect(g,-22+i*16,-44,12,13,['#fff','#ffe8c8','#e8f0ff'][i]); g.fillStyle='#6a5aa8'; g.beginPath(); g.ellipse(-16+i*16,-37,4,2.4,0,0,TAU); g.fill(); }
      c1Ell(g,18,-58,3,3,'#d8503a'); }),o.x,o.y); }},
  fountain:{R:70,by:0,col:{t:'c',r:34},
    draw(o,t){ c1Put(c1Tall('fountain',110,96,55,62,g=>{
      c1Ell(g,0,8,48,16,'rgba(40,30,40,.3)'); c1Ell(g,0,0,46,22,C1C.stoneD); c1Ell(g,0,-3,43,19,C1C.chalk); c1Ell(g,0,-1,37,15,'#5cbcd0'); c1Ell(g,-10,-6,14,5,'rgba(255,255,255,.4)');
      celFill(g,(q,dx,dy)=>sbStar(q,10,15,11.5,0.15,dx,dy-22),C1C.brass,{r:15}); c1Ell(g,0,-22,5,5,C1C.brassD); c1Rect(g,-4,-22,8,20,C1C.brassD); }),o.x,o.y);
      for(let i=0;i<3;i++){ const k=((t*1.2+i/3)%1); ctx.fillStyle=`rgba(200,240,255,${0.7*(1-k)})`; ctx.beginPath(); ctx.arc(o.x+Math.cos(i*2.1)*k*26,o.y-22-Math.sin(k*Math.PI)*16+k*20,2,0,TAU); ctx.fill(); } }},
  telescope:{R:40,by:4,col:{t:'c',r:8},
    draw(o){ c1Put(c1Tall('scope',60,60,30,52,g=>{ c1Ell(g,0,4,14,5,'rgba(40,30,30,.3)'); g.strokeStyle='#5a3e22'; g.lineWidth=2.4; for(const s of [-1,0,1]){ g.beginPath(); g.moveTo(s*9,2); g.lineTo(0,-22); g.stroke(); }
      g.save(); g.translate(0,-24); g.rotate(-0.4); c1Shade(g,-4,-5,26,10,C1C.brass); c1Rect(g,20,-6,5,12,C1C.brassD,1); c1Rect(g,-8,-3.5,5,7,C1C.brassD,1); g.restore(); }),o.x,o.y); }},
  bridgepost:{R:60,by:4,col:{t:'c',r:9},
    draw(o){ c1Put(c1Tall('bpost'+(o.flip?1:0),90,90,45,80,g=>{ const f=o.flip?-1:1;
      for(const dy of [-22,14]){ c1Shade(g,-5,dy-46,10,50,'#7a5634'); c1Ell(g,0,dy-46,5,2.6,'#9a7a50'); }
      g.strokeStyle='#c8b080'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-60); g.quadraticCurveTo(f*20,-30,f*14,-4); g.moveTo(0,-26); g.quadraticCurveTo(f*22,-6,f*18,20); g.stroke();
      for(let i=0;i<3;i++){ g.save(); g.translate(f*(8+i*5),-6+i*9); g.rotate(f*(0.9+i*0.2)); c1Shade(g,-12,-3,24,6,'#9a7a50'); g.restore(); } }),o.x,o.y); }},
  wreck:{R:170,by:20,col:[{t:'c',dx:-60,dy:4,r:30},{t:'c',dx:10,dy:8,r:34},{t:'c',dx:76,dy:4,r:26}],
    draw(o){ c1Put(c1Tall('wreck',300,220,150,160,g=>{
      c1Ell(g,0,18,140,26,'rgba(40,30,30,.3)');
      g.save(); g.rotate(-0.12);
      celFill(g,(q,dx,dy)=>{ q.moveTo(-130+dx,0+dy); q.quadraticCurveTo(-60+dx,40+dy,90+dx,24+dy); q.lineTo(130+dx,-20+dy); q.quadraticCurveTo(20+dx,-30+dy,-130+dx,0+dy); q.closePath(); },'#6a4a2c',{r:60});
      g.strokeStyle='#4a3020'; g.lineWidth=1.6; for(let i=-100;i<110;i+=22){ g.beginPath(); g.moveTo(i,-18); g.quadraticCurveTo(i+8,8,i+4,28); g.stroke(); }
      for(let i=0;i<7;i++){ const x=-90+i*28; g.strokeStyle='#3a2414'; g.lineWidth=5; g.beginPath(); g.moveTo(x,-14); g.quadraticCurveTo(x-6,-46,x+4,-70+Math.abs(i-3)*6); g.stroke(); g.strokeStyle='#8e6a40'; g.lineWidth=2.4; g.beginPath(); g.moveTo(x,-14); g.quadraticCurveTo(x-6,-46,x+4,-70+Math.abs(i-3)*6); g.stroke(); }
      g.strokeStyle='#4a3020'; g.lineWidth=7; g.beginPath(); g.moveTo(20,-20); g.lineTo(46,-140); g.stroke(); g.strokeStyle='#8e6a40'; g.lineWidth=3.6; g.beginPath(); g.moveTo(20,-20); g.lineTo(46,-140); g.stroke();
      g.fillStyle='#e8dcc0'; g.beginPath(); g.moveTo(42,-128); g.quadraticCurveTo(80,-110,58,-80); g.lineTo(38,-84); g.closePath(); g.fill(); g.strokeStyle='rgba(120,100,80,.7)'; g.lineWidth=1; g.stroke();
      g.fillStyle='#3b2a2a'; g.font=`900 9px ${UIF}`; g.fillText('SAUCY GULL',-70,14);
      g.restore(); }),o.x,o.y); }},
  standing:{R:40,by:6,col:{t:'c',r:12},
    draw(o){ c1Put(c1Tall('stand'+(o.v||0),50,70,25,62,g=>{ const h=40+(o.v||0)*6; c1Ell(g,4,4,14,5,'rgba(40,40,60,.3)'); celFill(g,(q,dx,dy)=>{ q.moveTo(-11+dx,4+dy); q.lineTo(-9+dx,-h+dy); q.quadraticCurveTo(dx,-h-6+dy,9+dx,-h+2+dy); q.lineTo(12+dx,4+dy); q.closePath(); },o.pale?'#dcd8e8':'#9a9aa6',{r:14}); c1Ell(g,-2,-h*0.5,4,3,o.pale?'#b8b0d8':'#a8b880'); }),o.x,o.y);
      if(o.pale&&isNight()) glowAt(o.x,o.y-30,26,'200,190,255',0.25); }},
  chimney:{R:50,by:2,col:false,
    draw(o,t){ c1Put(c1Tall('chim',40,70,20,62,g=>{ c1Shade(g,-9,-46,18,48,'#a85a46'); c1Rect(g,-11,-50,22,6,'#5a5e68',1); c1Ell(g,0,-50,6,2.2,'#2a2228'); }),o.x,o.y); }},
  shed:{R:120,by:30,col:{t:'r',x0:-70,y0:-40,x1:70,y1:34},
    draw(o){ c1Put(c1Tall('shed',170,150,85,112,g=>{
      c1Ell(g,0,36,80,10,'rgba(40,30,30,.3)'); c1Shade(g,-70,-40,140,74,'#7a8a9a'); g.strokeStyle='rgba(50,60,70,.5)'; g.lineWidth=1; for(let x=-60;x<70;x+=12){ g.beginPath(); g.moveTo(x,-40); g.lineTo(x,34); g.stroke(); }
      g.fillStyle='#c8503a'; g.beginPath(); g.moveTo(-80,-38); g.lineTo(0,-86); g.lineTo(80,-38); g.closePath(); g.fill(); g.fillStyle='#e0684a'; g.beginPath(); g.moveTo(-80,-38); g.lineTo(0,-86); g.lineTo(0,-38); g.closePath(); g.fill();
      c1Rect(g,-40,-10,80,44,'#3a3030',3); c1Ell(g,0,24,34,8,'#2a6aa0'); c1Ell(g,0,22,30,6,'#4a8ac0');
      g.fillStyle='#fff6e6'; g.font=`900 9px ${UIF}`; g.textAlign='center'; g.fillText("JO'S BOATS",0,-48); }),o.x,o.y); }},
  works:{R:240,by:40,col:{t:'r',x0:-170,y0:-60,x1:150,y1:40},
    draw(o,t){ c1Put(c1Tall('works',380,260,190,200,g=>{
      c1Ell(g,0,42,180,16,'rgba(40,30,30,.32)');
      c1Shade(g,-170,-60,320,100,'#a85a3e'); g.strokeStyle='rgba(70,36,24,.45)'; g.lineWidth=1; for(let y=-50;y<40;y+=10){ g.beginPath(); g.moveTo(-170,y); g.lineTo(150,y); g.stroke(); }
      g.fillStyle='#5a5e68'; g.beginPath(); for(let i=0;i<5;i++){ const x=-170+i*64; g.moveTo(x,-60); g.lineTo(x+32,-96); g.lineTo(x+64,-60); } g.closePath(); g.fill(); g.fillStyle='#7a7e88'; for(let i=0;i<5;i++){ const x=-170+i*64; g.beginPath(); g.moveTo(x,-60); g.lineTo(x+32,-96); g.lineTo(x+32,-60); g.closePath(); g.fill(); }
      for(let i=0;i<5;i++) c1Rect(g,-158+i*64,-44,40,26,'#e8c86a',3);
      celFill(g,(q,dx,dy)=>sbStar(q,12,34,27,0.1,dx-20,dy-10),'#d8a440',{r:34}); c1Ell(g,-20,-10,10,10,'#7a5420');
      c1Rect(g,30,-6,60,46,'#3a3030',4); g.strokeStyle='#c8a050'; g.lineWidth=2; for(let x=36;x<88;x+=9){ g.beginPath(); g.moveTo(x,-4); g.lineTo(x,38); g.stroke(); }
      g.fillStyle='#fff2c8'; g.font=`900 11px ${UIF}`; g.textAlign='center'; g.fillText('THE BRASSWORKS',-10,-70); }),o.x,o.y);
      // the gate stays jammed with moth dust until the Brassworks is beaten from inside
      if(!C1F('c_brass_gate')){ for(let i=0;i<4;i++){ const a=t*0.7+i*1.6; glowAt(o.x+60+Math.cos(a)*20,o.y+16+Math.sin(a*1.3)*12,4,'220,210,255',0.5); } } }},
  gantry:{R:140,by:0,col:false,
    draw(o){ c1Put(c1Tall('gantry'+o.w,o.w+30,140,o.w/2+15,120,g=>{ const w=o.w;
      for(const s of [-1,1]){ g.strokeStyle='#5a5e68'; g.lineWidth=5; g.beginPath(); g.moveTo(s*w/2,0); g.lineTo(s*w/2,-66); g.stroke(); }
      c1Shade(g,-w/2-6,-76,w+12,14,'#7a7e88'); g.strokeStyle='#c8a050'; g.lineWidth=1.6; for(let x=-w/2;x<w/2;x+=16){ g.beginPath(); g.moveTo(x,-62); g.lineTo(x+16,-76); g.stroke(); } }),o.x,o.y); }},
  spire:{R:420,by:10,col:{t:'r',x0:-70,y0:-120,x1:70,y1:6},
    draw(o,t){ if(!C1T.spire) return; c1Put(c1Tall('spire',260,560,130,540,g=>{
      c1Ell(g,0,10,110,24,'rgba(10,6,20,.4)');
      celFill(g,(q,dx,dy)=>{ q.moveTo(-74+dx,6+dy); q.lineTo(-40+dx,-260+dy); q.lineTo(-12+dx,-470+dy); q.lineTo(0+dx,-520+dy); q.lineTo(14+dx,-460+dy); q.lineTo(44+dx,-250+dy); q.lineTo(76+dx,6+dy); q.closePath(); },'#3c3650',{r:70,tones:['#6a5c8a','#3c3650','#221e30']});
      for(let i=0;i<6;i++){ const y=-60-i*72; c1Rect(g,-12+i*1.2,y-14,24-i*2.4,14,'#9a7ae0',3); g.fillStyle='rgba(255,240,255,.35)'; g.fillRect(-10+i,y-13,6,4); }
      for(let i=0;i<5;i++){ const s=i%2?1:-1, y=-100-i*80; g.fillStyle='#2a2438'; g.beginPath(); g.moveTo(s*(48-i*7),y); g.lineTo(s*(78-i*9),y-46); g.lineTo(s*(40-i*6),y-24); g.closePath(); g.fill(); }
      c1Rect(g,-16,-46,32,46,'#140e1e',6); }),o.x,o.y);
      for(let i=0;i<5;i++){ const a=t*0.4+i*1.3; glowAt(o.x+Math.cos(a)*60,o.y-200-i*60+Math.sin(a*1.7)*20,5,'200,170,255',0.5); }
      glowAt(o.x,o.y-520,40,'170,140,255',0.25+0.1*Math.sin(t*2)); }},
  shoal:{R:90,by:4,col:false,
    draw(o){ c1Put(c1Tall('shoal'+(o.v||0),120,150,60,130,g=>{ const h=70+(o.v||0)*18, w=22+(o.v||0)*4; c1Ell(g,0,4,w+10,8,'rgba(200,190,255,.25)'); celFill(g,(q,dx,dy)=>{ q.moveTo(-w+dx,4+dy); q.lineTo(-w*0.3+dx,-h*0.6+dy); q.lineTo(2+dx,-h+dy); q.lineTo(w*0.4+dx,-h*0.5+dy); q.lineTo(w+dx,4+dy); q.closePath(); },'#3c3650',{r:w,tones:['#6a5c8a','#3c3650','#221e30']}); }),o.x,o.y); }},
  buoy:{R:30,by:2,col:false,
    draw(o,t){ const b=Math.sin(t*2+o.x)*1.5; c1Put(c1Tall('buoy',30,40,15,30,g=>{ c1Ell(g,0,2,9,4,'rgba(255,255,255,.4)'); celFill(g,(q,dx,dy)=>q.ellipse(dx,dy-6,7,9,0,0,TAU),'#e0503a',{r:8}); c1Rect(g,-7,-8,14,4,'#fff6e6'); c1Rect(g,-1,-22,2,8,'#5a5e68'); }),o.x,o.y+b); }},
  fold:{R:150,by:-40,col:false,
    draw(o){ c1Put(c1Tall('fold',300,200,150,110,g=>{ g.strokeStyle='#8a8a86'; g.lineWidth=14; g.lineCap='round'; g.beginPath(); g.ellipse(0,0,130,80,0,0.35,TAU-0.35); g.stroke(); g.strokeStyle='#b0b0aa'; g.lineWidth=9; g.stroke(); g.strokeStyle='rgba(80,80,76,.6)'; g.lineWidth=1; for(let a=0.4;a<TAU-0.4;a+=0.18){ g.beginPath(); g.moveTo(Math.cos(a)*126,Math.sin(a)*76); g.lineTo(Math.cos(a)*134,Math.sin(a)*84); g.stroke(); } }),o.x,o.y); }},
  cabbage:{R:40,by:4,col:{t:'c',r:14,low:true},
    draw(o){ c1Put(c1Tall('cab'+(o.big?1:0),o.big?90:30,o.big?80:28,o.big?45:15,o.big?62:20,g=>{ const r=o.big?30:9; c1Ell(g,2,r*0.4,r,r*0.4,'rgba(40,40,30,.3)'); sbCanopy(g,r,mulberry32(o.big?7:3),['#5a8a3a','#8ac25a','#c8ea8a'],o.big?9:5,2); }),o.x,o.y); }},
  barrel2:{R:20,by:2,col:{t:'c',r:9,low:true},draw(o){ drawSprite(propSprite({k:'c_barrel',v:o.v||0}),o.x,o.y,1,0); }},
  crate2:{R:20,by:2,col:{t:'c',r:10,low:true},draw(o){ drawSprite(propSprite({k:'c_crate',v:o.v||0}),o.x,o.y,1,0); }},
  planter:{R:30,by:4,col:{t:'r',x0:-18,y0:-6,x1:18,y1:6},
    draw(o){ c1Put(c1Tall('planter'+(o.v||0),50,40,25,24,g=>{ c1Ell(g,2,5,20,5,'rgba(40,30,30,.3)'); c1Shade(g,-18,-8,36,13,o.v?'#6a8aa0':'#a85a3e'); c1Rect(g,-19,-10,38,3,'#d8a440',1);
      const cols=o.v?['#f4d040','#ffffff','#f08ab4']:['#e8403a','#f4d040','#b070e0']; for(let i=0;i<6;i++){ celBall(g,-14+i*5.6,-13-(i%2)*3,3.2,'#5a9a44'); celBall(g,-14+i*5.6,-15-(i%2)*3,2.2,cols[i%3]); } }),o.x,o.y); }},
  bench:{R:30,by:2,col:{t:'r',x0:-20,y0:-6,x1:20,y1:5},
    draw(o){ c1Put(c1Tall('bench',54,40,27,28,g=>{ c1Ell(g,2,5,22,5,'rgba(40,30,30,.3)'); for(const s of [-1,1]) c1Rect(g,s*16-2,-10,4,14,'#3a3e48'); c1Shade(g,-22,-12,44,6,'#8e6a40'); c1Shade(g,-22,-20,44,5,'#8e6a40'); for(const s of [-1,1]) c1Rect(g,s*16-1.5,-22,3,10,'#3a3e48'); }),o.x,o.y); }},
  line:{R:80,by:0,col:false,
    draw(o,t){ const w=o.w||100, x0=o.x-w/2, x1=o.x+w/2, y=o.y; ctx.save(); for(const x of [x0,x1]){ ctx.fillStyle=SBC.outline; ctx.fillRect(x-2.6,y-40,5.2,42); ctx.fillStyle='#8e6a40'; ctx.fillRect(x-1.4,y-39,2.8,40); }
      ctx.strokeStyle='#e8e2d2'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x0,y-36); ctx.quadraticCurveTo(o.x,y-24,x1,y-36); ctx.stroke();
      const cols=['#e8503a','#6a8ac8','#f4d040','#ffffff','#7ac04a']; for(let i=0;i<5;i++){ const k=(i+0.7)/5.6, x=lerp(x0,x1,k), yy=y-36+Math.sin(k*Math.PI)*12, sw=Math.sin(t*2+i)*1.5; ctx.fillStyle=SBC.outline; ctx.fillRect(x-5.6+sw,yy-1,11.2,13); ctx.fillStyle=cols[i]; ctx.fillRect(x-4.4+sw,yy,8.8,11); }
      ctx.restore(); }},
  sheep:{R:20,by:2,col:{t:'c',r:10,low:true},
    draw(o,t){ const c={x:o.x,y:o.y,face:o.f>0?0:Math.PI,moving:false}; const k=Math.sin(t*0.8+o.x)*0.6; c.y+=k*0; CRITTERS.c_sheep.draw(c); if(Math.sin(t*0.3+o.x*0.1)>0.995&&!C1.baaT){ C1.baaT=1; later(2,()=>{ C1.baaT=0; }); if(dist2(player.x,player.y,o.x,o.y)<400*400) c1Snd('baa',0.6); } }},
  vane:{R:60,by:0,col:false,
    draw(o,t){ const a=Math.sin(t*0.6+o.x)*0.5; ctx.save(); ctx.translate(o.x,o.y); ctx.strokeStyle=LOOK.sb?SBC.outline:'#2a1a10'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-34); ctx.stroke(); ctx.strokeStyle=C1C.brass; ctx.lineWidth=1.8; ctx.stroke(); ctx.translate(0,-34); ctx.rotate(a); ctx.fillStyle=C1C.brass; ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(10,-3); ctx.lineTo(14,0); ctx.lineTo(10,3); ctx.closePath(); ctx.fill(); ctx.strokeStyle=LOOK.sb?SBC.outline:'#2a1a10'; ctx.lineWidth=1; ctx.stroke(); ctx.restore(); }},
  flag:{R:70,by:0,col:false,
    draw(o,t){ ctx.save(); ctx.translate(o.x,o.y); ctx.strokeStyle=LOOK.sb?SBC.outline:'#2a1a10'; ctx.lineWidth=3.6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-60); ctx.stroke(); ctx.strokeStyle='#d8d0c0'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#3a8aa8'; ctx.beginPath(); ctx.moveTo(1,-60); for(let i=0;i<=6;i++){ ctx.lineTo(1+i*5,-60+Math.sin(t*5-i)*2.4+i*0.4); } for(let i=6;i>=0;i--){ ctx.lineTo(1+i*5,-46+Math.sin(t*5-i)*2.4+i*0.2); } ctx.closePath(); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(14,-53+Math.sin(t*5-3)*2.4,3,0,TAU); ctx.fill(); ctx.restore(); }}
};

// ================= 6. elevation (bible 1.4): the Downs, the Upper Town, the White Cliffs, the Heights, Lantern Point,
// Gullcrag Head, the Great Clock, the rooftops, the smokestack, the ramps, ledges, climbs, grapple posts, vents, no-fly
ELEV.style('c_clock',{face:'#efe8d8',lit:'#fffaf0',dark:'#cfc4a8',lip:'#ffffff',out:'#5a4a3a',top:'#5c7090',topK:0.04,tex:'layers'});
ELEV.style('c_brass',{face:'#a85a3e',lit:'#c8744e',dark:'#7a3e2a',lip:'#f0c070',out:'#3a1e14',top:'#6a6e78',topK:0.03,tex:'crack'});
ELEV.style('c_roof',{face:'#d8c8a8',lit:'#ece0c4',dark:'#b8a888',lip:'#fff6e0',out:'#4a3a2a',top:'#c8b693',topK:0.0,tex:'layers'});
ELEV.style('c_black',{face:'#3c3650',lit:'#5a4e74',dark:'#221e30',lip:'#b8a8e8',out:'#0e0a16',top:'#57546d',topK:0.04,tex:'facet'});
// the Clock Quarter rooftops (level 3) along the chase route of bible 4.2, and the hops across the two streets they span
// the south edge of the White Cliffs (for the ledge shelves under them)
const C1SHELVES=[3620,5480,5880];
function c1CliffEdge(x){ const E=[[6060,27280],[4800,27600],[3400,27800],[2900,27420]]; for(let i=0;i<E.length-1;i++){ const a=E[i], b=E[i+1]; if(x<=a[0]&&x>=b[0]) return a[1]+(b[1]-a[1])*(a[0]-x)/(a[0]-b[0]); } return 27600; }
const C1ROOF={
  // [x,y,w,h,want]: the three named houses whose roofs are walkable (Whirligig Manor, the Turning Library, the Clockwatch Hall)
  houses:[[7900,24880,230,150,'c_whirligig'],[7700,24400,230,150,'c_ottoline'],[6700,24520,200,140,'c_hester']],
  // the flat-roofed terrace of the Clock Quarter that joins them (level 3): the route of the rooftop chase (bible 4.2)
  terrace:[[7700,24740,7880,24880],[7560,24640,7790,24790],[7480,24480,7620,24700],[7300,24360,7640,24520],[7010,24330,7340,24450],[6760,24330,6890,24490]],
  // the gate street runs under nothing: the chase hops over it here (a scripted ELEV.hopTo for the chase helper)
  hops:[{a:{x:7030,y:24390},b:{x:6870,y:24410},over:S('the gate street','the street')}],
  ladder:{x0:8008,y0:24838,x1:8062,y1:24905}, hallTop:[6662,24440,6738,24492]
};
ELEV.style('c_terrace',{face:'#eadfc6',lit:'#f8f0dc',dark:'#c9b896',lip:'#fffaf0',out:'#4a3a2a',top:'#6a7e9a',topK:0.2,tex:'layers'});
function c1Elev(){
  const k=1, pl=(d)=>ELEV.plateau(Object.assign({k},d)), rp=(d)=>ELEV.ramp(Object.assign({k,kind:'stairs'},d));
  // the Chalk Downs and their hills
  pl({poly:C1G.downs,lvl:1,style:'grass',noise:12,id:'c_downs'});
  pl({disc:[6600,21900,860,760],lvl:2,style:'grass',noise:16,id:'c_dragonhill'});
  pl({disc:[9700,22380,430,340],lvl:2,style:'grass',noise:12,id:'c_millhill'});
  pl({disc:[13500,22020,170,130],lvl:2,style:'chalk',climb:true,noise:8,id:'c_eastcrag'});
  pl({rect:[6215,21165,6290,21232],lvl:4,style:'c_roof',noise:2,id:'c_dragonmill_cap'});
  pl({rect:[9650,22238,9752,22332],lvl:3,style:'c_roof',step:true,noise:2,id:'c_millloft'});
  pl({rect:[9664,22176,9738,22240],lvl:4,style:'c_roof',step:true,noise:2,id:'c_millcap'});
  rp({x0:6540,y0:22610,x1:6660,y1:22720,dir:'n'});                                   // up Chalk Dragon Hill
  rp({x0:9640,y0:22010,x1:9760,y1:22080,dir:'s'});                                   // up Windmill Hill from the road
  rp({x0:2700,y0:21300,x1:2820,y1:21420,dir:'e'});                                   // the Birch Steps (Moth Wood up to the Downs)
  rp({x0:4540,y0:23760,x1:4660,y1:23880,dir:'n'});                                   // the Chalk Steps (down to the valley)
  rp({x0:10410,y0:23760,x1:10540,y1:23880,dir:'n'});                                 // the Yards Lane
  rp({x0:13140,y0:23730,x1:13260,y1:23860,dir:'n'});                                 // the Downs Road's east end
  ELEV.ledge({k,x0:5380,y0:23780,x1:5560,y1:23870}); ELEV.ledge({k,x0:9000,y0:23800,x1:9180,y1:23890});
  // Gearhaven: the Upper Town on the cliff, the Great Stair, the Cliff Wall climb, the Great Clock, the rooftops
  pl({rect:C1G.upper,lvl:2,style:'chalk',noise:5,id:'c_upper'});
  rp({x0:6890,y0:24040,x1:7010,y1:24180,dir:'s'});                                   // the Upper Gate
  pl({rect:[6990,25188,7320,25340],lvl:1,style:'chalk',noise:3,id:'c_landing'});
  rp({x0:7020,y0:25140,x1:7120,y1:25250,dir:'n'}); rp({x0:7020,y0:25320,x1:7120,y1:25410,dir:'n'});   // the Great Stair
  pl({rect:[6480,25120,6820,25224],lvl:2,style:'chalk',climb:true,noise:2,id:'c_cliffwall'});            // the Cliff Wall climb
  pl({rect:[7450,25196,7560,25330],lvl:1,style:'chalk',noise:2,id:'c_alcove'});                          // behind the falls
  pl({rect:[7120,24520,7280,24680],lvl:5,style:'c_clock',climb:true,noise:0,id:'c_greatclock'});
  for(const [x,y,w,h] of C1ROOF.houses) pl({rect:[x-w/2,y-h/2,x+w/2,y+h/2-48],lvl:3,style:'c_roof',noise:0,id:'c_roof_'+x});
  for(const r of C1ROOF.terrace) pl({rect:r,lvl:3,style:'c_terrace',noise:0});
  pl({rect:C1ROOF.hallTop,lvl:4,style:'c_roof',step:true,noise:0,id:'c_halltower'});
  rp(Object.assign({dir:'w',kind:'ladder'},C1ROOF.ladder));
  // every roof's front is a ledge, so nobody is ever stuck up there
  for(const [x,y,w,h] of C1ROOF.houses) ELEV.ledge({k,x0:x-w/2+6,y0:y+h/2-60,x1:x+w/2-6,y1:y+h/2+10});
  for(const r of C1ROOF.terrace) ELEV.ledge({k,x0:r[0]+6,y0:r[3]-10,x1:r[2]-6,y1:r[3]+58});
  // the White Cliffs, the Gull's Rest roof and chimney, the Smugglers' Stair, the ramps down to Saltmarsh, the shelves
  pl({poly:C1G.cliffs,lvl:2,style:'chalk',noise:14,id:'c_cliffs'});
  pl({rect:[4205,25730,4395,25822],lvl:3,style:'c_roof',noise:0,id:'c_gullsrest_roof'});
  pl({rect:[1095,26970,1205,27024],lvl:2,style:'c_roof',climb:true,noise:0,id:'c_oona_roof'});
  pl({rect:[4330,25735,4385,25772],lvl:4,style:'c_roof',climb:true,noise:0,id:'c_gullsrest_chim'});
  pl({rect:[4870,27560,5060,27720],lvl:1,style:'chalk',noise:4,id:'c_smugland'});
  rp({x0:4920,y0:27520,x1:5010,y1:27620,dir:'n'}); rp({x0:4920,y0:27690,x1:5010,y1:27790,dir:'n'});    // the Smugglers' Stair
  pl({rect:[4200,27560,4400,27735],lvl:2,style:'chalk',climb:true,noise:3,id:'c_smugclimb'});           // the Smugglers' Climb
  pl({rect:[2840,26090,2990,26460],lvl:1,style:'chalk',noise:4,id:'c_saltsteps'});
  rp({x0:2915,y0:26110,x1:3010,y1:26230,dir:'e'}); rp({x0:2795,y0:26340,x1:2885,y1:26455,dir:'e'});
  for(const x of C1SHELVES){ const y=c1CliffEdge(x); pl({rect:[x-60,y-12,x+60,y+100],lvl:1,style:'chalk',climb:true,noise:3,id:'c_shelf_'+x}); }
  // the Harbor East Heights (west of the Cut) with the Quay Steps, and the east lip down to Lantern Point
  pl({poly:C1G.heightsW,lvl:2,style:'chalk',noise:10,id:'c_heightsw'});
  pl({rect:[8420,26120,8630,26400],lvl:1,style:'chalk',noise:3,id:'c_quaysteps'});
  rp({x0:8370,y0:26240,x1:8460,y1:26355,dir:'e'}); rp({x0:8580,y0:26240,x1:8670,y1:26355,dir:'e'});
  pl({poly:C1G.heightsE,lvl:2,style:'rock',noise:8,id:'c_heightse'});
  pl({poly:C1G.heath,lvl:1,style:'grass',noise:14,id:'c_heath'});
  rp({x0:10165,y0:26990,x1:10285,y1:27120,dir:'n'});
  pl({disc:[12900,29100,280,250],lvl:2,style:'rock',noise:10,id:'c_lighthouserock'});
  rp({x0:12820,y0:28780,x1:12940,y1:28890,dir:'s'});
  rp({x0:11360,y0:28760,x1:11480,y1:28880,dir:'n'});                                 // the Seal Steps down to the beach
  // Gullcrag Head: the horseshoe round the sands, the stair from Saltmarsh, the spur face (claws, back from the caves)
  pl({poly:C1G.gull,lvl:3,style:'basalt',noise:10,id:'c_gullcrag'});
  pl({rect:[2600,27885,2850,28140],lvl:1,style:'basalt',noise:4,id:'c_gullstep1'});
  pl({rect:[2560,28100,2850,28330],lvl:2,style:'basalt',noise:4,id:'c_gullstep2'});
  rp({x0:2670,y0:27840,x1:2790,y1:27930,dir:'s'}); rp({x0:2670,y0:28060,x1:2790,y1:28150,dir:'s'}); rp({x0:2530,y0:28200,x1:2620,y1:28290,dir:'w'});
  pl({rect:[1780,28640,2060,28800],lvl:3,style:'basalt',climb:true,noise:3,id:'c_gullspur'});
  // the Brass Yards: the smokestack (claws up to the hatch), two gantries
  pl({rect:[10300,24520,10420,24640],lvl:4,style:'c_brass',climb:true,noise:0,id:'c_smokestack'});
  pl({rect:[11380,23960,12080,24240],lvl:1,style:'c_brass',noise:0,id:'c_gantry1'});
  rp({x0:11640,y0:24210,x1:11760,y1:24300,dir:'n',kind:'ladder'});
  pl({rect:[8960,24560,9420,24760],lvl:1,style:'c_brass',noise:0,id:'c_gantry2'});
  rp({x0:9130,y0:24730,x1:9250,y1:24820,dir:'n',kind:'ladder'});
  // grapple posts (bible 1.4) and the causeway posts (only with c_spire_up, see c1Posts)
  for(const [x,y,l] of [[9532,26950,2],[9826,26950,2],[6700,24448,4],[4250,25790,3]]) ELEV.grapple({k,x,y,lvl:l});
  for(const [x,y] of [[7300,29250],[7350,29500],[7300,29750],[7400,29950]]) ELEV.grapple({k,x,y,lvl:0,when:()=>C1T.spire});
  // vents (wings): the cliff updraft to Gull Isle, the Lantern Point updraft (the Chalk Dragon's Breath is added by c1Sync)
  ELEV.vent({k,x:3900,y:28300,r:70,lift:1}); ELEV.vent({k,x:12000,y:29250,r:70,lift:1});
  // no flying over Lantern Point and the Cut (the Grapple Tail is the way in) or over the Shadow Shoals
  ELEV.noFly({k,poly:[[9280,25700],[14300,25700],[14300,31000],[9280,31000]],why:S('The headland winds are too strong to fly.','Too windy to fly here.')});
  ELEV.noFly({k,rect:[5400,28880,9280,31000],why:S('A cold dark wind blows off the shoals. Your wings will not hold.','The wind is too cold to fly.')});
  // the Cogwater Falls over the Cliff Wall, and the paths painted on the cliff tops
  ELEV.fall({k,x:7400,y:25196,w:30,kind:'water'});
  ELEV.clear({k,rect:[6100,24060,8500,25240]}); ELEV.clear({k,rect:[6320,25240,8660,26460]});
  ELEV.clear({k,rect:[1550,26150,2650,27150]}); ELEV.clear({k,rect:[9420,25800,9950,28400]});
}

// ================= 7. the map and everything placed on it
// house looks: Gearhaven is cream and pale stone under slate blue and teal roofs with brass trim; Saltmarsh is
// weathered boards under faded roofs; rooftop houses (Ash can walk on them) are always two storeys
function c1TwoUp(L){
  if(L.two) return null; const ups=[];
  for(const w of L.wins||[]) if(!w.fl&&w.kind!=='shop') ups.push({x:w.x,y:L.H-50+8,w:w.w,h:9,kind:'sq',fl:1,lit:w.lit,cur:w.cur,st:'ok',shut:w.shut});
  return {two:true,F:50,wins:(L.wins||[]).concat(ups)};
}
function c1HzGear(hs,L){ const r=hs.seed>>>0, o={wc:['#f2e8d2','#ece0c8','#f4ecda','#e8dcc0','#efe4cc'][r%5],rc:['#3f6a8a','#3a7a7a','#46628a','#8a4a3a','#3a7080','#4a6e94'][(r>>3)%6],trim:'#f6eedc'}; if(hs.c1roof) Object.assign(o,c1TwoUp(L)||{}); return o; }
function c1HzSalt(hs,L){ const r=hs.seed>>>0; return {wall:'plank',wc:['#c8b48a','#bca880','#d4c098','#b8a47e'][r%4],rc:['#6a8aa0','#a06a4a','#7a7a6a','#5a7a8a'][(r>>3)%4],trim:'#efe6d0'}; }
function c1HzCoast(hs,L){ return {wc:'#f2ecde',rc:hs.town==='c_lanternpt'?'#c8503a':'#3a6a8a',trim:'#f6f0e2'}; }
// one house: {x,y,w,h,town,want (the CAST id that should live here), walk (its roof is a level 3 plateau: no collider)}
function c1House(B,o){
  const hs={k:'house',x:o.x,y:o.y,w:o.w,h:o.h,vert:!!o.vert,roof:o.rc||'#4a6a8a',burnt:false,seed:o.seed!=null?o.seed:Math.floor(B.rng()*1e9),snow:false,town:o.town};
  if(o.want) hs.want=o.want; if(o.walk) hs.c1roof=true; if(o.stilts) hs.c1stilts=true; if(o.extra) hs.c1x=o.extra;
  HOUSES.push(hs); STRUCTS.push(hs);
  if(!o.walk) addCol({t:'r',x0:hs.x-hs.w/2,y0:hs.y-hs.h/2,x1:hs.x+hs.w/2,y1:hs.y+hs.h/2});
  if(o.lamp!==false){ const lx=hs.x-Math.max(30,hs.w*0.36), ly=hs.y+hs.h/2+14; if(o.town==='c_gearhaven') c1Obj('lamp',lx,ly); else { STRUCTS.push({k:'torch',x:lx,y:ly}); LIGHTS.push({x:lx,y:ly,r:170,i:0.75,fire:true,night:true}); } }
  return hs;
}
// foes the Act II foes helper defines; until it lands, similar stock foes stand in (so nothing ever crashes)
const C1FOE_FALL={c_tickbug:'kobold',c_ram:'wolf',c_husher:'cultist',c_tinman:'knight',c_gulper:'slime',c_moth:'bat',c_silkspinner:'sneak',crab:'slime',eel:'bat'};
const c1Foe=t=>EDEF[t]?t:(C1FOE_FALL[t]&&EDEF[C1FOE_FALL[t]]?C1FOE_FALL[t]:'kobold');
const C1CAMPS=[
  ['cc1',5000,21300,[['c_tickbug',4]]],['cc2',11600,21500,[['c_ram',1],['c_tickbug',3]]],['cc3',1500,21500,[['c_moth',5],['c_husher',2]],1],
  ['cc4',900,23400,[['c_silkspinner',1],['c_moth',3]],1],['cc5',600,25300,[['c_gulper',3]]],['cc6',3600,28300,[['crab',3],['c_gulper',1]]],
  ['cc7',5600,28400,[['crab',2],['eel',2]]],['cc8',10800,24000,[['c_tinman',2],['c_tickbug',3]]],['cc9',11900,25200,[['c_ram',2]]],
  ['cc10',3400,25500,[['c_husher',3]],1],['cc11',11000,28000,[['c_husher',2],['c_moth',4]],1],['cc12',13300,27700,[['c_tinman',1],['c_husher',2]]],
  ['cc13',700,28800,[['crab',2],['c_gulper',2]]],['cc14',13200,21000,[['c_ram',1],['c_tinman',1]]]];
// the dungeons and small areas whose doors are on this map: a minimal placeholder is registered when a dungeon
// helper has not defined the area yet (clearly marked; defineDungeon by the dungeon helper replaces it)
const C1AREAS={c_gullcrag:[S('The Gullcrag Caves','The Gullcrag Caves'),11],c_brassworks:[S('The Brassworks','The Brassworks'),11],c_lighthouse:[S('The Spinning Lighthouse','The Spinning Lighthouse'),12],
  c_spire:[S('The Shadow Spire','The Shadow Spire'),13],c_tidehouse:[S('The Tide House','The Tide House'),9],c_mothnest:[S("The Moth's Nest","The Moth's Nest"),10]};
const C1PH_TPL=['...............','...............','...............','.....s.........','...............','...............','...............','...............','...............','...............','...............'];
function c1Placeholders(){
  C1.ph=[];
  for(const id in C1AREAS){ if(AREADEFS[id]) continue; const [name,level]=C1AREAS[id];
    try{ defineDungeon(id,{name,level,theme:'earth',seed:7700+id.length*13,save:id,placeholder:true,dark:0.2,noJuniper:true,
      floors:[{id:'1',name,map:{rooms:{a:{at:[0,0],kind:'start',tpl:C1PH_TPL,noPots:true,sign:S(`PLACEHOLDER: ${name} is being built. Come back soon!`,`${name} is not built yet.`)}},links:[]}}]}); C1.ph.push(id); }
    catch(e){ defCave(id,{name,level,theme:'earth',seed:7700,enemies:[],placeholder:true}); C1.ph.push(id); }
  }
  if(!AREADEFS.c_smugglers) defineDungeon('c_smugglers',{name:S("The Smugglers' Cove","The Smugglers' Cove"),level:10,theme:'earth',seed:7741,save:'c_smugglers',dark:0.3,noJuniper:true,dunKind:S('A cove','A cove'),
    floors:[{id:'1',name:S("The Smugglers' Cove","The Smugglers' Cove"),map:{rooms:{a:{at:[0,0],kind:'start',tpl:['...............','.###.......###.','.#...........#.','.#.....X.....#.','.#...........#.','...............','..s............','...............','.#...........#.','.###.......###.','...............'],
      loot:['treasure+treat'],noPots:false,sign:S('Carved in the rock: BILGEWATER WOZ ERE. Under it, smaller: SO WOZ HIS SOCK.','It says: BILGEWATER WOZ ERE.')}},links:[]}}]});
}
// the doors of the dungeons (bible 5) and the small areas, the Smugglers' Cove, the Brassworks front gate
function c1Doors(B){
  B.cave({area:'c_gullcrag',x:1400,y:29400,theme:'c_sea',noNudge:true,label:S('Enter the Gullcrag Caves','Go in the sea caves')});
  B.door({x:10360,y:24560,area:'c_brassworks',label:S('Open the roof hatch','Open the hatch'),outY:26});
  B.door({x:10210,y:24852,area:'c_brassworks',label:S('Try the Brassworks gate','Try the big gate'),outY:30,need:()=>C1F('c_brass_gate'),locked:S('The great gate is jammed with silver moth dust. It will not budge from out here. There must be another way in. Up?','The gate is stuck. Is there a way in up high?')});
  B.door({x:12880,y:29052,area:'c_lighthouse',label:S('Enter the Spinning Lighthouse','Go in the lighthouse'),outY:30});
  B.door({x:2250,y:26332,area:'c_tidehouse',label:S('Enter the Tide House','Go in the Tide House'),outY:28});
  B.door({x:7200,y:24565,area:'c_mothnest',label:S('Open the hatch in the clock roof','Open the hatch'),outY:30});
  B.door({x:3700,y:27900,area:'c_smugglers',label:S("Go into the Smugglers' Cove","Go in the cove"),outY:34,need:()=>!!G.found.c_kelp_burnt,locked:S('A thick curtain of dry kelp hangs over a crack in the cliff. Something smells of old coins behind it. Kelp burns nicely, they say.','Dry kelp covers a crack. Kelp burns!')});
  C1.spireDoor={x:7400,y:30040,area:'c_spire',label:S('Enter the Shadow Spire','Go in the Spire'),outY:30};
  const sm={area:'c_smugglers',x:3700,y:27880,name:S("The Smugglers' Cove","The Smugglers' Cove")}; CAVEMOUTHS.push(sm); STRUCTS.push({k:'cavemouth',x:sm.x,y:sm.y,ref:sm,theme:'c_sea'});
}
function c1Build(B){
  C1.built=true; C1.B=B;
  c1Elev();
  c1Placeholders();
  // ---- places (bible 10.1 POIs)
  B.poi('c_gearhaven',{x:7200,y:25200,r:1100,name:S('Gearhaven','Gearhaven'),level:10,town:true});
  B.poi('c_saltmarsh',{x:1900,y:26600,r:650,name:S('Saltmarsh','Saltmarsh'),level:9,town:true});
  B.poi('c_gullsrest',{x:4300,y:25850,r:260,name:S("The Gull's Rest","The Gull's Rest"),level:10,town:true});
  B.poi('c_lanternpt',{x:12300,y:28500,r:380,name:S('Lantern Point','Lantern Point'),level:12,town:true});
  B.poi('c_fold',{x:3900,y:21100,r:230,name:S("Old Barley's Fold","Old Barley's Fold"),level:9});
  B.poi('c_mothwood',{x:1350,y:22750,r:90,name:S('the Moth Wood','the Moth Wood'),level:12});
  B.poi('c_gullcrag_mouth',{x:1400,y:29330,r:130,name:S('the Gullcrag Caves','the Gullcrag Caves'),level:11});
  B.poi('c_brassyards',{x:10200,y:24700,r:160,name:S('the Brass Yards','the Brass Yards'),level:11});
  B.town('c_gearhaven',{name:'Gearhaven',music:'c_gearhaven',generics:{ties:['Harbormaster Mo','Auntie Fig at the Teapot','Professor Sprocket','the two Bobs']},hz:c1HzGear});
  B.town('c_saltmarsh',{name:'Saltmarsh',music:'c_saltmarsh',generics:{ties:['Chowder Charlie','Old Tarbuckle','the Tide Warden']},hz:c1HzSalt});
  B.town('c_gullsrest',{name:"The Gull's Rest",music:'c_coast',generics:false,hz:c1HzCoast});
  B.town('c_lanternpt',{name:'Lantern Point',music:'c_coast',generics:false,hz:c1HzCoast});
  // ---- Gearhaven, the Upper Town (the Clock Quarter): the walkable rooftops first, then the rest
  const GH='c_gearhaven';
  C1ROOF.houses.forEach(([x,y,w,h,want],i)=>c1House(B,{x,y,w,h,town:GH,want,walk:true,seed:6100+i*37}));
  for(const [x,y,w,h] of [[6400,24300,130,90],[6350,24720,120,100],[8250,24420,140,100],[8250,24700,120,90],[6560,25090,120,70],[8130,25090,130,70],[7350,24872,120,80],[8320,24890,120,90]]) c1House(B,{x,y,w,h,town:GH});
  C1.homes.push({want:'c_ambrose',town:GH,door:{x:7200,y:24846,outY:20},name:S("Ambrose's Workshop","Ambrose's Workshop")});
  // the Lower Town and the harbor
  for(const [x,y,w,h,want] of [[6600,25750,170,110,'c_hettie'],[7700,25800,180,110,'c_ingrid'],[7300,26180,210,120,'c_fig'],[8100,26340,150,100,'c_mo']]) c1House(B,{x,y,w,h,town:GH,want});
  for(const [x,y,w,h] of [[6520,25420,120,80],[6780,25440,110,80],[7300,25470,120,80],[7980,25440,120,80],[8300,25560,110,90],[6480,26080,110,90],[6680,26180,100,80],[7600,26080,110,90],
    [7850,26040,120,80],[8300,26100,110,90],[7250,25680,100,80],[6860,25640,110,80],[8350,25820,100,80],[6950,26320,100,70]]) c1House(B,{x,y,w,h,town:GH});
  // ---- Saltmarsh: stilt houses over the lagoon, cottages on the shore
  const SM='c_saltmarsh';
  for(const [x,y,w,h,want,stilt] of [[2390,26262,140,90,'c_mina',0],[2000,26800,200,110,'c_charlie',1],[2560,26520,130,90,'c_dory',0],[1150,27045,110,150,'c_oona',1],[1520,27230,110,80,'c_tarbuckle',0],
    [1710,26530,110,80,null,1],[1660,26700,100,80,null,1],[2160,26150,110,80,null,0],[1700,26280,120,80,null,0],[2620,26900,110,80,null,0],[2150,27030,100,80,null,1]]) c1House(B,{x,y,w,h,town:SM,want,stilts:!!stilt,walk:want==='c_oona'});
  // ---- the small places
  c1House(B,{x:4300,y:25800,w:190,h:140,town:'c_gullsrest',want:'c_maudie',walk:true});
  c1House(B,{x:12300,y:28480,w:150,h:100,town:'c_lanternpt',want:'c_agatha'});
  // ---- shrines (bible 1.7); the Chalk Dragon Shrine and the Breakwater Shrine appear later (c1Sync)
  B.shrine({id:'c_s_downgate',x:3150,y:20850,name:S('Downgate Shrine','Downgate Shrine')});
  B.shrine({id:'c_s_clock',x:6830,y:24760,name:S('Clocktower Shrine','Clocktower Shrine')});
  B.shrine({id:'c_s_salt',x:2450,y:26735,name:S('Saltmarsh Shrine','Saltmarsh Shrine')});
  B.shrine({id:'c_s_gull',x:2300,y:28260,name:S('Gullcrag Shrine','Gullcrag Shrine')});
  B.shrine({id:'c_s_brass',x:9600,y:25300,name:S('Brass Yards Shrine','Brass Yards Shrine')});
  B.shrine({id:'c_s_lantern',x:11500,y:27700,name:S('Lantern Point Shrine','Lantern Point Shrine')});
  C1.shrDyn=[{s:{id:'c_s_chalk',x:6950,y:21700,name:S('Chalk Dragon Shrine','Chalk Dragon Shrine')},when:()=>c1ChalkDone()},
    {s:{id:'c_s_break',x:7150,y:28950,name:S('Breakwater Shrine','Breakwater Shrine')},when:()=>C1T.spire}];
  // ---- camps (bible 1.8); from Chapter 5 the moth camps grow by two dusk moths each
  for(const [id,x,y,units,moths] of C1CAMPS){
    const base=units.map(([t,n])=>[c1Foe(t),n]), c={id:'c_'+id,x,y,want:units};
    Object.defineProperty(c,'units',{get(){ return moths&&typeof reached==='function'&&reached('c_light')?base.concat([[c1Foe('c_moth'),2]]):base; },configurable:true});
    B.camp(c);
  }
  // ---- star-iron (bible 1.9)
  B.ore({id:'c_o_crag',x:13500,y:22010}); B.ore({id:'c_o_gull',x:600,y:30000});
  // ---- doors
  c1Doors(B);
  // ---- the crane hooks over the harbor (hang rings for the Grapple Tail; the regatta swings on them)
  p2Add('ring',{id:'c_ring_crane1',x:7790,y:26700,h:96,hang:true}); p2Add('ring',{id:'c_ring_crane2',x:8010,y:26900,h:96,hang:true});
  // ---- the landmarks, the standing things and the secrets
  c1Places(B);
  c1Paint();
}
defineMap(1,{id:'coast',name:S('The Clockwork Coast','The Clockwork Coast'),music:'c_coast',spawn:{x:3400,y:20560},chests:24,
  ambient:{wind:0.5,birds:true,rain:0.45,gulls:0.4},
  terrain:{seeds:C1SEEDS,roads:C1ROADS,
    rivers:[{pts:[[7900,20100],[7700,21200],[7500,22400],[7400,23500],[7380,24070]],w:50},{pts:[[7400,25110],[7400,25300],[7420,25700],[7440,26100],[7450,26480]],w:44},
      {pts:[[2400,20100],[2000,21400],[1500,22800],[1750,23900],[2150,24800]],w:30},{pts:[[2600,24000],[2150,24800],[1600,25900],[1300,26700],[1190,26960]],w:36},
      {pts:[[3000,25270],[2750,25900],[2600,26500],[2680,27100],[2700,27300],[2640,27700]],w:32},{pts:C1G.cutRiver,w:112}],
    lakes:C1G.lagoons,
    ponds:[{x:5200,y:22600,r:160},{x:11200,y:24800,r:220}],
    isles:[{x:4100,y:29700,r:220},{x:11800,y:30200,r:150},{x:6300,y:29700,r:60},{x:8800,y:29900,r:70},{x:6800,y:30500,r:50},{x:8250,y:30650,r:60},{x:5900,y:30250,r:45},{x:9100,y:30450,r:55}],
    walkways:C1WALK,
    sea:{land:C1G.land,shore:60,shelf:170,noise:110},
    extra:c1Extra, block:c1Block},
  onEnter(from){ c1Sync(true); },
  build(B){ c1Build(B); }
});
// the Southern Pass (e7_acts owns the gate and the labels): its coast end moves to the bible's arrival point
if(CROSSINGS.c_pass_s) CROSSINGS.c_pass_s.to={x:3400,y:20470};
if(CROSSINGS.c_pass_n) Object.assign(CROSSINGS.c_pass_n,{x:3400,y:20360});
try{ defineStages(2,[{id:'c_coast',at:{x:3400,y:20520}}]); }catch(e){}
// the Far Pier: the Act IV ship east (ACT4.md fills in the far end and the gate; until then the sea is too dark)
defineCrossing({id:'c_dock_moon',x:8350,y:27150,to:{x:1150,y:64800},label:S('Sail east','Sail east'),name:S('The Far Pier','The Far Pier'),kind:'dock',dir:Math.PI,
  need:()=>typeof reached==='function'&&!!STAGEDEF&&!!STAGEDEF.m_sail&&reached('m_sail'),locked:S('No ship sails east. The sailors say the sea out there has gone dark.','No ship sails east. The sea is too dark.'),
  arrive:S('Salt, tar and a smell like old moonlight.','It smells like the sea!')});

// ================= 8. landmarks, secrets and the standing things (bible 1.9, 2.1 to 2.3)
const c1Reached=s=>typeof reached==='function'&&!!STAGEDEF[s]&&reached(s);
const c1QDone=q=>!!(G&&G.quests&&G.quests[q]&&G.quests[q].done);
const c1ChalkDone=()=>C1F('c_chalk_eye')||c1QDone('c_chalk');
const c1Say=(lines,cb)=>runDialogue(lines.map(l=>Array.isArray(l)?l:['narr',l]),()=>{ scene='play'; if(cb) cb(); saveGame(); });
function c1LM(B,o){ o.noNudge=true; if(o.clr==null) o.clr=60; return B.landmark(o); }
const C1QUAY={x0:6620,x1:8330,y:26468};
function c1Places(B){
  const GH='c_gearhaven';
  // ---- the Upper Town wall and the Upper Gate, the culvert where the Cogwater goes under the town
  for(let x=6220;x<8440;x+=120){ if(x>6820&&x<7080) continue; c1Obj('wall',x,24104,{w:120}); }
  c1Obj('gate',6950,24108);
  c1LM(B,{id:'c_lm_culvert',k:'c_lm',x:7380,y:24070,r:0,prompt:S('Read the sign on the grate','Read the sign'),draw:()=>{},act:()=>c1Say([S('The Cogwater runs into a tunnel under the Clock Quarter. A brass sign on the grate says: NO SWIMMING. NO FISHING. NO BOATS. NO YOU.','The river goes under the town. The sign says: NO YOU.')])});
  // ---- lamps along the streets of both towns
  for(let x=6980;x<=8150;x+=235) c1Obj('lamp',x,24960);
  for(const [x,y] of [[6990,24260],[6880,24560],[6600,24930],[7090,25120],[7740,25120],[7100,25520],[6960,25760],[7180,26080],[7560,26300],[7900,26290],[8250,26300],[7750,25560],[6800,25960],[7480,25960],[8040,25480],[8040,26000],[2120,26520],[1990,26880],[2440,26690],[4400,25960],[12230,28620]]) c1Obj('lamp',x,y);
  // ---- the Great Clock (its face is the elevation; the dial hands and the stuck time are live), the square, the lift
  c1LM(B,{id:'c_lm_clock',k:'c_lm',x:7000,y:24850,r:0,clr:10,prompt:S('Look at the Great Clock','Look at the clock'),draw:(o,t)=>c1DrawClock(t),act:()=>c1Say([C1T.clock?S('The Great Clock ticks again. TICK. TOCK. The pigeons approve.','The Great Clock ticks again!'):S('The Great Clock. All four faces say one minute to midnight. It is not midnight. It is not even close.','The clock says one minute to midnight. It is wrong.')])});
  c1Obj('fountain',6990,24880); c1Obj('vane',6700,24448);
  for(const [x,y] of [[7060,24370],[7110,24400],[7170,24360],[7230,24410],[7290,24375],[7400,24400],[7520,24420],[7600,24680],[7760,24780],[7840,24800]]) c1Obj('chimney',x,y);
  for(const [x,y] of [[7060,24340],[7110,24370],[7170,24330],[7230,24380],[7290,24345]]) C1CHIMS.push([x,y-46]);
  c1Obj('line',6825,24350,{w:110});
  c1LiftBuild(B);
  c1Furnish(B);
  // ---- the Lower Town: the market belt, the stalls, the Moth Mask Watch, Jo's boat shed, the cranes and the chain
  C1.belts.push({id:'market',x0:6600,y0:25878,x1:7600,y1:25922,dx:1,dy:0},{id:'quay',x0:7978,y0:25500,x1:8022,y1:26300,dx:0,dy:1});
  c1LM(B,{id:'c_lm_belts',k:'c_lm',x:7300,y:25900,r:0,clr:10,draw:(o,t)=>c1DrawBelts(t)});
  for(const [x,y,v] of [[6720,25850,0],[6900,25848,1],[7260,25850,3],[7420,25848,0],[6820,25960,2],[7300,25965,1]]) c1Obj('stall',x,y,{v});
  c1Obj('board',7110,25975);
  c1LM(B,{id:'c_lm_watch',k:'c_lm',x:7110,y:25990,r:0,clr:10,prompt:S('Read the Moth Mask Watch','Read the board'),draw:()=>{},act:()=>c1Say(c1WatchLines())});
  c1Obj('shed',6500,26390);
  c1Obj('crane',7700,26745); c1Obj('crane',8100,26945,{flip:1});
  c1LM(B,{id:'c_lm_chain',k:'c_lm',x:7610,y:28900,r:0,clr:10,draw:(o,t)=>c1DrawChain(t)});
  for(const [x,y,v] of [[6640,25560,0],[6700,25570,1],[7860,26200,0],[8200,26420,1],[8230,26405,0],[7520,26420,1]]) c1Obj(v?'barrel2':'crate2',x,y,{v});
  // the Cogwater Falls viewpoint on the Great Stair landing, and the shadow alcove behind the falls
  c1LM(B,{id:'c_lm_falls',k:'c_lm',x:7280,y:25270,r:0,clr:20,prompt:S('Look at the Cogwater Falls','Look at the falls'),draw:()=>{},act:()=>c1Say([S('The Cogwater Falls. The whole river jumps off the cliff into the canal below. Behind the water there is a dark gap in the rock. A shadow could slip in there.','The river falls off the cliff. There is a dark gap behind the water.')])});
  p2Add('shadowlane',{id:'c_lane_falls',pts:[[7300,25262],[7395,25268],[7490,25270]],w:44});
  CHESTS.push({id:'c_ch_falls',x:7520,y:25262,b:12,open:false});
  // ---- Saltmarsh: the Tide Clock, the bell, nets and pots, the jetty
  c1Obj('tideclock',2250,26318);
  c1LM(B,{id:'c_lm_tideclock',k:'c_lm',x:2200,y:26360,r:0,clr:10,prompt:S('Look at the Tide Clock','Look at the Tide Clock'),draw:()=>{},act:()=>c1Say([C1T.low?S('The Tide Clock says LOW. The sands at Gullcrag are open, and the crabs are furious about it.','The Tide Clock says LOW!'):S('The Tide Clock says HIGH. Its big hand is stuck. Seaweed pokes out of the works, and everything is dusted with silver.','The Tide Clock is stuck on HIGH.')])});
  for(const [x,y] of [[2080,26400],[1990,26420]]) c1Obj('lamp',x,y);
  // ---- the Gull's Rest: the telescope, the flag on the roof
  c1Obj('telescope',4440,25935); c1Obj('flag',4250,25790);
  c1LM(B,{id:'c_lm_telescope',k:'c_lm',x:4440,y:25945,r:0,clr:10,prompt:S('Look through the telescope','Look through it'),draw:()=>{},act:()=>c1Say([C1T.spire||c1Reached('c_spire')?S('Out past the harbor, at night, a black spire stands where there was no spire before.','A black spire stands out at sea!'):S('Just sea. Lovely sea. Sea sea sea.','Sea. Lovely sea.')])});
  // ---- the Downs: the pass stair, the fold, the windmills, the Chalk Dragon, the dew pond
  c1LM(B,{id:'c_lm_passstair',k:'c_lm',x:3400,y:20330,r:0,clr:150,draw:(o,t)=>c1DrawPassStair()});
  c1Obj('fold',3900,21100); for(const [x,y,f] of [[3840,21080,1],[3930,21130,-1],[3990,21060,1],[3870,21150,-1],[3960,21000,1]]) c1Obj('sheep',x,y,{f}); STRUCTS.push({k:'campfire',x:4010,y:21180,small:true}); LIGHTS.push({x:4010,y:21180,r:160,i:0.6,fire:true});
  for(const [x,y] of [[3780,21180],[3700,21070],[4120,21020]]) c1Obj('crate2',x,y,{v:1});
  c1LM(B,{id:'c_lm_fold',k:'c_lm',x:3900,y:21000,r:0,clr:200,prompt:S("Look at Old Barley's sheepfold","Look at the sheep"),draw:()=>{},act:()=>{ c1Snd('baa'); c1Say([S('A round stone fold full of sheep. There are twelve of them. Every single one is named Gerald.','Twelve sheep. They are all named Gerald.')]); }});
  c1Obj('windmill',6252,21340,{base:21170}); c1Obj('windmill',9700,22345,{base:22175,col:false});
  CHESTS.push({id:'c_ch_dragonmill',x:6252,y:21200,b:10,open:false,c1top:true},{id:'c_ch_millcap',x:9700,y:22206,b:10,open:false,c1top:true});
  c1LM(B,{id:'c_lm_dragon',k:'c_lm',x:6600,y:22560,r:0,clr:30,prompt:S('Look at the shape on the hill','Look at the hill'),draw:()=>{},act:()=>c1Say([C1F('c_chalk_drawn')?S('The Chalk Dragon blazes white across the hill. Its tail curls. Its wings spread. It is waving.','The Chalk Dragon is white again. It is waving!'):S('A huge grey shape is cut into the hill, under grass and moth dust. It might be a dragon. It might be a very long sausage.','A big grey shape on the hill. A dragon? A sausage?')])});
  c1LM(B,{id:'c_lm_sealed',k:'c_lm',x:6950,y:21700,r:0,clr:90,hidden:()=>c1ChalkDone(),prompt:S('Look at the stone in the eye','Look at the stone'),draw:(o,t)=>{ if(!c1ChalkDone()) c1DrawSealed(o,t); },act:()=>c1Say([S('A shrine stone, sealed with old chalk. It is cold. Maybe the dragon needs to see again first.','A sealed shrine. The dragon must wake up first.')])});
  // ---- the Moth Wood: the Moon Ring, the hollow birch
  for(let i=0;i<7;i++){ const a=i/7*TAU-Math.PI/2; c1Obj('standing',1350+Math.cos(a)*130,22750+Math.sin(a)*96,{v:i%3,pale:true}); }
  c1LM(B,{id:'c_lm_moonring',k:'c_lm',x:1350,y:22760,r:0,clr:140,prompt:S('Look at the Moon Ring','Look at the stones'),draw:(o,t)=>{ if(isNight()) glowAt(1350,22750,120,'190,180,255',0.12+0.05*Math.sin(t)); },act:()=>c1Say([isNight()?S('The seven stones hum, very softly. Silver dust lies thick in the middle of the ring, as if something big and soft sat here not long ago.','The stones hum. Something big sat here.'):S('Seven pale stones in a ring. Moths sleep on them by day, wings folded, painted eyes open.','Seven pale stones. Moths sleep on them.')])});
  c1LM(B,{id:'c_lm_birch',k:'c_lm',x:880,y:22180,r:22,clr:70,prompt:S('Look at the hollow birch','Look at the old tree'),draw:(o,t)=>c1DrawBirch(o,t),act:()=>c1Say([G.found.c_birch_cracked?S('The old birch is split open. It looks relieved.','The tree is open now.'):S('A huge old birch with a crack down its trunk. Something glints deep inside. A good hard whack might open it.','Something shines inside the crack. Hit it hard!')])});
  // ---- the Rockpools: the wreck, the kelp curtain, Gull Isle
  c1Obj('wreck',4600,28300);
  c1LM(B,{id:'c_lm_wreck',k:'c_lm',x:4600,y:28360,r:0,clr:200,prompt:S('Look at the wreck','Look at the old ship'),draw:()=>{},act:()=>c1Say([S('The wreck of the Saucy Gull. A plank on the beach says: CAPTAIN SALTBEARD. NO REFUNDS.','The wreck of the Saucy Gull. NO REFUNDS.')])});
  c1LM(B,{id:'c_lm_kelp',k:'c_lm',x:3700,y:27880,r:0,clr:120,draw:(o,t)=>{ if(!G.found.c_kelp_burnt) c1DrawKelp(o,t); }});
  c1LM(B,{id:'c_lm_page6',k:'c_lm',x:4160,y:29660,r:0,clr:60,hidden:()=>!!G.found.c_lm_page6,prompt:S('Pick up the old page','Pick up the page'),draw:(o,t)=>{ if(!G.found.c_lm_page6) c1DrawPage(o,t); },act:()=>c1Page6()});
  CHESTS.push({id:'c_ch_gullisle',x:4040,y:29745,b:15,open:false});
  for(const [x,y] of [[4060,29640],[4180,29760],[3990,29700]]) c1Obj('crate2',x,y,{col:false});
  // ---- the Cut and its broken rope bridge
  c1Obj('bridgepost',9535,26935); c1Obj('bridgepost',9832,26962,{flip:1});
  c1LM(B,{id:'c_lm_cut',k:'c_lm',x:9500,y:26905,r:0,clr:40,prompt:S('Look at the broken bridge','Look at the bridge'),draw:(o,t)=>c1DrawCut(t),act:()=>c1Say([S('The old rope bridge over the Cut. Somebody snipped the ropes, neat and silky. Far below, the sea churns like soup. Two brass posts still stand, one on each side.','The bridge is cut! Two posts still stand.')].concat(canGrapple()?[S('Your tail twitches. Those posts look very grabbable.','Your tail wants to grab those posts!')]:[]))});
  // ---- the Brass Yards: the Brassworks, the stack, the gantries
  c1Obj('works',10140,24800); c1Obj('gantry',11730,24250,{w:700}); c1Obj('gantry',9190,24770,{w:460});
  c1LM(B,{id:'c_lm_stack',k:'c_lm',x:10360,y:24520,r:0,clr:20,draw:(o,t)=>c1DrawStack(t)});
  CHESTS.push({id:'c_ch_gantry',x:11900,y:24050,b:13,open:false},{id:'c_ch_heightse',x:10320,y:26400,b:11,open:false});
  B.sign('c_sign_works',10000,24900,S('THE BRASSWORKS. CLOSED UNTIL THE MOTHS GO AWAY. (They have not gone away.)','THE BRASSWORKS. CLOSED. Moths inside.'));
  // ---- Lantern Point: the lighthouse, the keeper's garden, the seal lane, Seal Rocks
  c1Obj('lighthouse',12880,29020);
  for(const [x,y] of [[12380,28610],[12420,28650],[12450,28600],[12350,28660],[12490,28640]]) c1Obj('cabbage',x,y);
  c1Obj('cabbage',12530,28690,{big:1}); c1Obj('barrel2',12200,28560,{v:0});
  c1LM(B,{id:'c_lm_cabbage',k:'c_lm',x:12530,y:28700,r:0,clr:30,prompt:S('Look at the enormous cabbage','Look at the big cabbage'),draw:()=>{},act:()=>c1Say([S('The biggest cabbage you have ever seen. A sign: PRIZE CABBAGE. PLEASE DO NOT EAT. - AGATHA. Someone has taken one tiny bite.','A giant cabbage. DO NOT EAT. Someone took a bite.')])});
  for(let y=29230;y<30080;y+=140){ c1Obj('buoy',11690,y); c1Obj('buoy',11910,y+70); }
  c1LM(B,{id:'c_lm_seal',k:'c_lm',x:11800,y:30180,r:26,clr:60,prompt:S('Wake the seal','Wake the seal'),draw:(o,t)=>c1DrawSeal(o,t),act:()=>c1Seal()});
  CHESTS.push({id:'c_ch_seal',x:11800,y:30215,b:15,open:false});
  // ---- the Shadow Shoals: black spires in the sea, Spire Rock and its tower (only when it has risen)
  for(const [x,y,v] of [[6300,29700,2],[8800,29900,2],[6800,30500,1],[8250,30650,1],[5900,30250,0],[9100,30450,1],[6550,29420,0],[8500,29450,0],[7000,30800,2],[9400,30100,0],[5700,29600,1]]) c1Obj('shoal',x,y,{v});
  c1Obj('spire',7400,30000);
  c1LM(B,{id:'c_lm_causeway',k:'c_lm',x:7300,y:29400,r:0,clr:10,draw:(o,t)=>c1DrawCauseway(t)});
  // ---- treasure (Madame Ravel's map, c_map): three X marks, dug with the stock dig code
  for(const [id,x,y,coins,gift] of [['c_x_downs',8400,23000,60,'treat'],['c_x_pools',3100,28500,70,null],['c_x_lantern',13600,28200,80,'potion']])
    c1LM(B,{id,k:'xmark',x,y,r:0,clr:40,prompt:S('Dig here','Dig here'),hidden:()=>!G.items.c_map||!!G.found[id],act:o=>{ if(G.found[id]) return; G.found[id]=true; SFX.play('chest'); shake(3);
      c1Say([S(`You dig up a little chest of the smugglers' sort. Inside: ${coins} coins and a note: "If found, this is not ours."`,`You dig up a chest! ${coins} coins inside.`)],()=>{ addCoins(coins,x,y); if(gift==='treat') G.pipTreats=(G.pipTreats||0)+1; if(gift==='potion'&&player.potionsMax!=null){ player.potionsMax++; player.potions=player.potionsMax; setBanner(S('A new flask!','A new flask!'),S('You can carry one more healing draught.','One more drink!'),2.4); } }); }});
  // ---- the cliff shelves (Climbing Claws): a chest on each
  for(const x of C1SHELVES){ const y=c1CliffEdge(x); CHESTS.push({id:'c_ch_shelf_'+x,x,y:y+62,b:15,open:false}); }
  CHESTS.push({id:'c_ch_gullspur',x:2140,y:28420,b:17,open:false});
  // ---- signs
  B.sign('c_sign_pass',3520,20600,S('THE CLOCKWORK COAST. South-east, down the chalk road: Gearhaven. West: the Moth Wood (do not). North: the Southern Pass, home to Embermere.','Gearhaven is south-east. The Moth Wood is west. Home is north.'));
  B.sign('c_sign_lantern',13120,23360,S('LANTERN POINT. No road from here. The rope bridge over the Cut is down. Ask in Gearhaven.','LANTERN POINT. No road here. The bridge is down.'));
  B.sign('c_sign_sands',1620,27780,S('GULLCRAG SANDS. Under the sea at high tide. Ask the Tide Warden before you walk.','GULLCRAG SANDS. Under water at high tide.'));
  B.sign('c_sign_salt',3300,26180,S('SALTMARSH, down the steps. Chowder. Fish. More chowder.','SALTMARSH. Chowder!'));
  B.sign('c_sign_gate',7060,24060,S('GEARHAVEN. Upper Town. Please wipe your feet and wind your watch.','GEARHAVEN. Wipe your feet.'));
  B.sign('c_sign_brassroad',8560,25500,S('The Brass Road: east to the Brass Yards. Mind the scrap.','The Brass Yards are east.'));
}
// ---------- town furniture: planters, benches, crates and barrels where nothing else stands (seeded, so always the same)
function c1Furnish(B){
  const rng=mulberry32(4411), kinds=['planter','planter','bench','crate2','barrel2','planter','barrel2'];
  const ok=(x,y,lv)=>{ if(segsDist(x,y,ROAD_SEGS)<52||blockedAt(x,y)||elevLvl(x,y)!==lv||elevFace(x,y+12)) return false;
    for(const h of mapList(HOUSES,1)) if(Math.abs(h.x-x)<h.w/2+46&&Math.abs(h.y-y)<h.h/2+46) return false;
    for(const b of C1.belts) if(x>b.x0-50&&x<b.x1+50&&y>b.y0-50&&y<b.y1+50) return false;
    for(const o of C1.objs) if(dist2(o.x,o.y,x,y)<60*60) return false;
    for(const l of mapList(LANDMARKS,1)) if(dist2(l.x,l.y,x,y)<70*70) return false;
    for(const s of mapList(SHRINES,1)) if(dist2(s.x,s.y,x,y)<120*120) return false;
    return true; };
  for(const [x0,y0,x1,y1,lv] of [[6200,24180,8420,25150,2],[6400,25420,8450,26420,0]])
    for(let y=y0;y<y1;y+=64) for(let x=x0;x<x1;x+=64){ if(rng()>0.16) continue; const px=x+rng()*40, py=y+rng()*40; if(!ok(px,py,lv)) continue; c1Obj(kinds[Math.floor(rng()*kinds.length)],px,py,{v:Math.floor(rng()*2)}); }
}
// ---------- the clock: hands stuck at 11:59 until the Great Clock runs again, then the real time of day
function c1ClockHands(){ if(!C1T.clock) return {h:11,m:59}; const t=((G.tod||0)*24+24)%24; return {h:Math.floor(t)%12,m:(t%1)*60}; }
function c1DrawClock(t){
  if(!inView(7200,24700,260)) return;
  const {h,m}=c1ClockHands(), cx=7200, cy=24742, R=40;
  // hour and minute hands on the big south face (the dial is painted on the cliff of the tower)
  ctx.save(); ctx.lineCap='round';
  const ah=(h+m/60)/12*TAU-Math.PI/2, am=m/60*TAU-Math.PI/2+(C1T.clock?0:Math.sin(t*9)*0.012*(Math.sin(t*0.7)>0.9?1:0));
  ctx.strokeStyle='#3b2233'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(ah)*R*0.52,cy+Math.sin(ah)*R*0.52); ctx.stroke();
  ctx.lineWidth=3.6; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(am)*R*0.82,cy+Math.sin(am)*R*0.82); ctx.stroke();
  ctx.strokeStyle='#d8a440'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(ah)*R*0.5,cy+Math.sin(ah)*R*0.5); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(am)*R*0.8,cy+Math.sin(am)*R*0.8); ctx.stroke();
  ctx.fillStyle='#d8a440'; ctx.beginPath(); ctx.arc(cx,cy,4,0,TAU); ctx.fill(); ctx.restore();
  if(isNight()) glowAt(cx,cy,48,'255,236,180',0.25);
  // the bell loft on top: a little brass cupola and the hatch
  c1Put(c1Tall('cupola',90,90,45,70,g=>{ c1Ell(g,0,6,30,8,'rgba(40,30,40,.3)'); for(const s of [-1,1]) c1Rect(g,s*22-3,-34,6,36,'#d8a440'); c1Rect(g,-26,-38,52,6,'#a07428',2); celFill(g,(q,dx,dy)=>{ q.moveTo(-28+dx,-38+dy); q.quadraticCurveTo(dx,-72+dy,28+dx,-38+dy); q.closePath(); },'#3a7a8a',{r:24}); c1Ell(g,0,-64,4,4,'#d8a440'); c1Ell(g,0,-14,10,12,'#c8963a'); c1Ell(g,0,-12,7,8,'#a07428'); }),7200,24600);
  c1Put(c1Tall('hatch',50,30,25,15,g=>{ c1Shade(g,-18,-9,36,18,'#6a4a2c'); g.strokeStyle='#3a2414'; g.lineWidth=1.2; for(let x=-12;x<18;x+=8){ g.beginPath(); g.moveTo(x,-9); g.lineTo(x,9); g.stroke(); } c1Ell(g,10,0,2,2,'#d8a440'); }),7200,24560);
  // tick, every second, once the clock runs
  if(C1T.clock&&dist2(player.x,player.y,cx,cy)<700*700){ const s=Math.floor(G.time); if(s!==C1.tick){ C1.tick=s; c1Snd('tick',0.7); } }
}
// ---------- the Moth Mask Watch: Penny's board points at the main story (and at the notes)
function c1WatchLines(){
  const st=G.stage||'', L=[];
  const by={c_coast:S('LAST SEEN: the rooftops of the Clock Quarter, after dark. Whirligig Manor. AGAIN.','LAST SEEN: the rooftops, at night.'),
    c_gear:S('LAST SEEN: the rooftops of the Clock Quarter, after dark. Whirligig Manor. AGAIN.','LAST SEEN: the rooftops, at night.'),
    c_salt:S('LAST SEEN: Saltmarsh, leaving presents on doorsteps. ALSO: running up the Great Clock like it was a ladder.','LAST SEEN: Saltmarsh. And up the clock!'),
    c_claws:S('LAST SEEN: on the cliffs above the Gullcrag Caves, sitting very still. Like a moth.','LAST SEEN: the Gullcrag cliffs.'),
    c_brass:S('LAST SEEN: the very top of the Great Clock. Nobody can climb that. Except, apparently, her.','LAST SEEN: the top of the Great Clock!'),
    c_light:S('LAST SEEN: Lantern Point. The lighthouse has gone dark. Penny Press says: SUSPICIOUS.','LAST SEEN: Lantern Point. The lighthouse is dark.'),
    c_spire:S('LAST SEEN: out at sea?! On a black rock that was NOT THERE YESTERDAY.','LAST SEEN: on a black rock out at sea!'),
    c_snow:S('SNOW IN SUMMER! Mask not seen. Everybody very cold. Penny Press is wearing two hats.','SNOW IN SUMMER! Everyone is cold.')};
  L.push(by[st]||S('THE MOTH MASK WATCH. LAST SEEN: everywhere and nowhere. (The usual.)','LAST SEEN: everywhere. As usual.'));
  if(G.quests&&G.quests.c_notes&&!G.quests.c_notes.done) L.push(S('READERS WRITE: notes have been found in very high places. Chimneys. Clock towers. One in a gull.','Notes are found in high places!'));
  return L;
}
// ---------- the Clockwork Lift between the Lower Town and the Upper Town (x 7700)
function c1LiftBuild(B){
  const L=C1.lift={x:7700,top:{x:7700,y:25150},bot:{x:7700,y:25350},pos:0,ride:null};
  c1LM(B,{id:'c_lm_lifttop',k:'c_lm',x:7700,y:25150,r:0,clr:30,prompt:S('Ride the Clockwork Lift down','Ride the lift down'),draw:(o,t)=>c1DrawLift(t),act:()=>c1LiftRide(1)});
  c1LM(B,{id:'c_lm_liftbot',k:'c_lm',x:7700,y:25352,r:0,clr:30,prompt:S('Ride the Clockwork Lift up','Ride the lift up'),draw:()=>{},act:()=>c1LiftRide(0)});
}
function c1LiftRide(to){
  const L=C1.lift; if(L.ride||player.hop) return;
  const tgt=to?L.bot:L.top; L.ride={t:0,from:L.pos,to}; c1Snd('clank');
  ELEV.hopTo(tgt.x,tgt.y+(to?8:-4),to?'down':'up');
}
// ---------- the Smugglers' Cove kelp, Gull Isle's page, Seal Rocks
function c1Page6(){
  if(G.found.c_lm_page6) return; G.found.c_lm_page6=true;
  if(typeof ITEM_NAMES!=='undefined'&&!ITEM_NAMES.c_page6) ITEM_NAMES.c_page6=S("Pearl's Logbook, page 6","Pearl's Logbook, page 6");
  SFX.play('quest');
  c1Say([S('Under a stone, wrapped in oilcloth: an old page in neat, loopy writing. "A moth came to my lighthouse tonight. A big one, with a voice like a lullaby..."','An old page! It talks about a big moth.'),
    S('The rest is about soup, and warm windows. Archivist Inkwell in Gearhaven would want to see this.','Take it to the library in Gearhaven.')],()=>giveItems({c_page6:1}));
}
function c1Seal(){
  if(G.found.c_seal_awake){ c1Say([G.found.c_seal_awake==='huff'?S('Sir Blubbington has his back to you. He is still in a huff. He will get over it. Probably.','The seal is still grumpy.'):S('Sir Blubbington waves a flipper. He looks very pleased with himself.','The seal waves at you!')]); return; }
  const fish=(G.items.fish||0)>0;
  runDialogue([['narr',S('A very large seal is fast asleep on top of a chest. A little brass plate on the chest says SIR BLUBBINGTON. The seal is snoring.','A big seal sleeps on a chest. It snores.')],
    ch('ash',S('How do you wake a sleeping seal?','How do I wake him?'),[
      {t:S('Offer him a fish','Give him a fish'),cond:()=>fish,fn:()=>{ G.items.fish=Math.max(0,(G.items.fish||0)-1); G.found.c_seal_awake='happy'; c1Snd('seal'); },then:[['narr',S('One eye opens. The fish vanishes. Sir Blubbington rolls happily off the chest and waves.','He eats the fish, rolls off and waves!')]]},
      {t:S('ROAR!','ROAR!'),fn:()=>{ G.found.c_seal_awake='huff'; c1Snd('seal'); },then:[['narr',S('Sir Blubbington jumps, glares, and flops off the chest in a tremendous huff.','He flops off in a huff.')]]},
      {t:S('Let him sleep','Let him sleep'),fn:()=>{},then:[['narr',S('You tiptoe away. The snoring continues, majestically.','You let him sleep.')]]}])],()=>{ scene='play'; saveGame(); });
}

// ================= 9. ground art painted into the chunks (ELEV.deco, in level order) and the live ground pieces
const C1DRAGON=[ // the Chalk Dragon cut into Chalk Dragon Hill: strokes as polylines (head at the east, the eye is the shrine)
  [[6100,22200],[6260,22080],[6420,22030],[6600,22020],[6780,21960],[6900,21820],[6960,21700],[7060,21640],[7160,21680],[7130,21780],[7020,21800]],
  [[6420,22030],[6380,21800],[6300,21600],[6420,21640],[6520,21560],[6600,21720],[6620,21900]],
  [[6100,22200],[5980,22320],[5900,22280],[5960,22180],[6040,22240]],
  [[6340,22080],[6300,22300],[6240,22400]],[[6640,22040],[6640,22280],[6720,22380]],
  [[7060,21640],[7090,21560],[7020,21500]],[[7160,21680],[7240,21620]]];
function c1PaintDragon(g){
  const on=C1F('c_chalk_drawn'), w=on?30:24;
  g.save(); g.lineCap='round'; g.lineJoin='round';
  for(const pass of [0,1]){ g.strokeStyle=pass?(on?'#fffdf4':'#b8c49e'):(on?'rgba(150,140,120,.55)':'rgba(110,130,90,.35)'); g.lineWidth=pass?w:w+8;
    for(const L of C1DRAGON){ g.beginPath(); L.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); } }
  g.fillStyle=on?'#ffd23a':'#9aa888'; g.beginPath(); g.arc(6950,21700,on?16:12,0,TAU); g.fill();
  g.restore();
}
function c1PaintBreakwater(g,r){
  const rng=mulberry32(Math.floor(r.x0*3+r.y0)); g.save();
  g.fillStyle='rgba(255,255,255,.55)'; rrect(g,r.x0-6,r.y0-4,r.x1-r.x0+12,r.y1-r.y0+12,14); g.fill();
  for(let x=r.x0;x<r.x1;x+=26+rng()*8){ for(let y=r.y0;y<r.y1-8;y+=Math.max(18,(r.y1-r.y0)/3)){ const w=24+rng()*10, h=Math.min(r.y1-y,18+rng()*8), c=['#a8a4a0','#b8b2aa','#9a968e'][Math.floor(rng()*3)];
    g.fillStyle=SBC.outline; rrect(g,x-1.4,y-1.4,w+2.8,h+2.8,6); g.fill(); g.fillStyle=sbTone(c,-0.3); rrect(g,x,y,w,h,5); g.fill(); g.fillStyle=c; rrect(g,x,y,w-2,h-3,5); g.fill(); g.fillStyle=sbTone(c,0.3); rrect(g,x+2,y+2,w*0.5,h*0.3,3); g.fill(); } }
  g.restore();
}
function c1PaintStilts(g,r){ g.save(); g.fillStyle='#4a3420'; for(let x=r.x0+6;x<=r.x1-4;x+=26){ g.fillRect(x-2,r.y1,4,9); g.fillStyle='rgba(30,40,40,.35)'; g.fillRect(x-2,r.y1+9,4,6); g.fillStyle='#4a3420'; } g.restore(); }
function c1PaintRails(g){
  g.save(); g.lineCap='round';
  for(const L of [[[8700,24400],[9600,24300],[10200,24400],[11200,24300]],[[9500,25300],[10400,25200],[11600,25300],[12200,25500]]]){
    for(const off of [-8,8]){ g.strokeStyle='#5a4a3a'; g.lineWidth=3.4; g.beginPath(); L.forEach((p,i)=>i?g.lineTo(p[0],p[1]+off):g.moveTo(p[0],p[1]+off)); g.stroke(); g.strokeStyle='#a8a4a0'; g.lineWidth=1.4; g.stroke(); }
    g.strokeStyle='#6a4a2c'; g.lineWidth=4; for(let i=0;i<L.length-1;i++){ const a=L[i], b=L[i+1], n=Math.floor(Math.hypot(b[0]-a[0],b[1]-a[1])/22); for(let k=0;k<n;k++){ const x=lerp(a[0],b[0],k/n), y=lerp(a[1],b[1],k/n); g.beginPath(); g.moveTo(x,y-12); g.lineTo(x,y+12); g.stroke(); } } }
  g.restore();
}
function c1PaintSquare(g){
  g.save(); const cx=6930, cy=24820;
  g.fillStyle='rgba(240,230,206,.5)'; g.beginPath(); g.ellipse(cx,cy,190,130,0,0,TAU); g.fill();
  g.strokeStyle='rgba(150,130,100,.5)'; g.lineWidth=1.4; for(let r=40;r<190;r+=26){ g.beginPath(); g.ellipse(cx,cy,r,r*0.68,0,0,TAU); g.stroke(); }
  g.strokeStyle='rgba(216,164,64,.7)'; g.lineWidth=3; g.beginPath(); g.ellipse(cx,cy,190,130,0,0,TAU); g.stroke();
  // the Gear Market paving below
  g.fillStyle='rgba(236,226,200,.45)'; rrect(g,6560,25820,1100,200,30); g.fill();
  g.restore();
}
function c1PaintQuay(g){
  g.save(); const y=C1QUAY.y;
  g.fillStyle=SBC.outline; g.fillRect(C1QUAY.x0,y-10,C1QUAY.x1-C1QUAY.x0,16);
  for(let x=C1QUAY.x0;x<C1QUAY.x1;x+=34){ g.fillStyle='#b8b0a0'; rrect(g,x+1,y-9,32,13,3); g.fill(); g.fillStyle='#d8d0c0'; rrect(g,x+2,y-8,18,4,2); g.fill(); }
  for(let x=C1QUAY.x0+60;x<C1QUAY.x1;x+=260){ g.fillStyle=SBC.outline; g.beginPath(); g.arc(x,y-14,6.6,0,TAU); g.fill(); g.fillStyle='#4a4e58'; g.beginPath(); g.arc(x,y-14,5,0,TAU); g.fill(); g.fillStyle='#8a8e98'; g.beginPath(); g.arc(x-1.5,y-15.5,2,0,TAU); g.fill(); }
  g.restore();
}
function c1PaintCulvert(g){ g.save(); const x=7380, y=24080; g.fillStyle=SBC.outline; rrect(g,x-62,y-18,124,34,8); g.fill(); g.fillStyle='#a8a090'; rrect(g,x-58,y-15,116,28,7); g.fill(); g.fillStyle='#1a2a34'; rrect(g,x-46,y-10,92,20,6); g.fill(); g.strokeStyle='#d8a440'; g.lineWidth=3; for(let k=-38;k<=38;k+=12){ g.beginPath(); g.moveTo(x+k,y-10); g.lineTo(x+k,y+10); g.stroke(); } g.restore(); }
function c1PaintCauseway(g){
  if(!C1T.spire) return; g.save(); const rng=mulberry32(77);
  for(const r of C1G.causeway){ for(let y=r.y0+10;y<r.y1;y+=34){ for(let x=r.x0+14;x<r.x1;x+=40){ const rx=16+rng()*8, ry=11+rng()*5, px=x+(rng()-0.5)*10, py=y+(rng()-0.5)*8;
    g.fillStyle='rgba(200,190,255,.35)'; g.beginPath(); g.ellipse(px,py+4,rx+5,ry+4,0,0,TAU); g.fill();
    g.fillStyle=SBC.outline; g.beginPath(); g.ellipse(px,py,rx+1.6,ry+1.6,0,0,TAU); g.fill(); g.fillStyle='#2a2638'; g.beginPath(); g.ellipse(px,py,rx,ry,0,0,TAU); g.fill(); g.fillStyle='#4c4662'; g.beginPath(); g.ellipse(px-2,py-2,rx*0.8,ry*0.7,0,0,TAU); g.fill(); g.fillStyle='rgba(190,170,255,.4)'; g.beginPath(); g.ellipse(px-rx*0.35,py-ry*0.4,rx*0.3,ry*0.2,0,0,TAU); g.fill(); } } }
  g.restore();
}
// the Clock Quarter terrace: slate roof tiles on top, cream walls with windows on its faces (only where a face is)
function c1PaintTerrace(g,r){
  g.save(); const rng=mulberry32(Math.floor(r[0]+r[1]));
  g.beginPath(); g.rect(r[0],r[1],r[2]-r[0],r[3]-r[1]); g.clip();
  g.strokeStyle='rgba(40,50,70,.35)'; g.lineWidth=1.2; for(let y=r[1]+10;y<r[3];y+=11){ g.beginPath(); g.moveTo(r[0],y); g.lineTo(r[2],y); g.stroke(); for(let x=r[0]+((y/11)%2?6:0);x<r[2];x+=12){ g.beginPath(); g.moveTo(x,y-11); g.lineTo(x,y); g.stroke(); } }
  g.restore(); g.save();
  for(let x=r[0]+20;x<r[2]-14;x+=36){ const fy=r[3]+6; if(!(elevFace(x,fy+8)&1)) continue;
    g.fillStyle=SBC.outline; rrect(g,x-7,fy+5,14,19,3); g.fill(); g.fillStyle=rng()<0.6?'#7aa8c0':'#ffe6a0'; rrect(g,x-5.5,fy+6.5,11,16,2); g.fill(); g.fillStyle='#3a6a8a'; g.fillRect(x-8,fy+3,16,3); g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(x-4.5,fy+7.5,3,6);
    if(rng()<0.3){ g.fillStyle='#e8503a'; for(let i=0;i<3;i++){ g.beginPath(); g.arc(x-5+i*5,fy+27,2.2,0,TAU); g.fill(); } } }
  g.restore();
}
function c1PaintClockRoof(g){
  g.save(); const x0=7122, y0=24522, x1=7278, y1=24678, cx=7200, cy=24600, T=[['#4a6a8a',[x0,y0],[x1,y0]],['#3a5878',[x1,y0],[x1,y1]],['#2e4a68',[x1,y1],[x0,y1]],['#5a7c9c',[x0,y1],[x0,y0]]];
  for(const [c,a,b] of T){ g.fillStyle=c; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.lineTo(cx,cy); g.closePath(); g.fill(); }
  g.strokeStyle='rgba(20,30,50,.35)'; g.lineWidth=1; for(let k=1;k<7;k++){ const f=k/7; g.beginPath(); g.moveTo(lerp(x0,cx,f),lerp(y0,cy,f)); g.lineTo(lerp(x1,cx,f),lerp(y0,cy,f)); g.lineTo(lerp(x1,cx,f),lerp(y1,cy,f)); g.lineTo(lerp(x0,cx,f),lerp(y1,cy,f)); g.closePath(); g.stroke(); }
  g.strokeStyle='#d8a440'; g.lineWidth=3; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.moveTo(x1,y0); g.lineTo(x0,y1); g.stroke();
  g.strokeStyle=SBC.outline; g.lineWidth=2.4; g.strokeRect(x0,y0,x1-x0,y1-y0); g.restore();
}
function c1Paint(){
  const k=1;
  for(const r of C1ROOF.terrace) ELEV.deco({k,bb:[r[0]-4,r[1]-4,r[2]+4,r[3]+60],lvl:3,order:7,paint:g=>c1PaintTerrace(g,r)});
  ELEV.deco({k,bb:[7110,24510,7290,24690],lvl:5,order:7,paint:g=>c1PaintClockRoof(g)});
  ELEV.deco({k,bb:[5860,21460,7300,22460],lvl:2,order:6,paint:g=>c1PaintDragon(g)});
  for(const w of C1WALK){ if(w.draw===false) ELEV.deco({k,bb:[w.x0-10,w.y0-10,w.x1+10,w.y1+20],lvl:0,order:1,paint:g=>c1PaintBreakwater(g,w)}); else if(w.x1<2700) ELEV.deco({k,bb:[w.x0,w.y0,w.x1,w.y1+20],lvl:0,order:2,paint:g=>c1PaintStilts(g,w)}); }
  ELEV.deco({k,bb:[8600,24260,11300,25560],lvl:0,order:1,paint:g=>c1PaintRails(g)});
  ELEV.deco({k,bb:[6550,24680,7670,26030],lvl:2,order:1,paint:g=>c1PaintSquare(g)});
  ELEV.deco({k,bb:[C1QUAY.x0-10,C1QUAY.y-30,C1QUAY.x1+10,C1QUAY.y+10],lvl:0,order:3,paint:g=>c1PaintQuay(g)});
  ELEV.deco({k,bb:[7300,24050,7460,24110],lvl:1,order:7,paint:g=>c1PaintCulvert(g)});
  ELEV.deco({k,bb:[7150,28940,7470,29900],lvl:0,order:4,paint:g=>c1PaintCauseway(g)});
  ELEV.deco({k,bb:[7110,24676,7290,24830],lvl:5,order:8,paint:g=>c1PaintClockFace(g)});
  for(const [x,y] of C1STEAM) ELEV.deco({k,bb:[x-12,y-8,x+12,y+8],lvl:elevLvl(x,y),order:6,paint:g=>{ g.fillStyle=SBC.outline; rrect(g,x-11,y-7,22,14,3); g.fill(); g.fillStyle='#4a4e58'; rrect(g,x-9.5,y-5.5,19,11,2); g.fill(); g.fillStyle='#8a8e98'; for(let i=0;i<5;i++) g.fillRect(x-8+i*3.6,y-4.5,1.6,9); }});
}
// the big south face of the Great Clock: a dial, brass bands, small windows and Ambrose's door at the foot
function c1PaintClockFace(g){
  g.save(); const cx=7200, cy=24742, R=42;
  g.fillStyle='#d8a440'; g.fillRect(7122,24682,156,7); g.fillRect(7122,24812,156,6);
  g.fillStyle=SBC.outline; g.beginPath(); g.arc(cx,cy,R+5,0,TAU); g.fill(); g.fillStyle='#d8a440'; g.beginPath(); g.arc(cx,cy,R+3,0,TAU); g.fill(); g.fillStyle='#fffaf0'; g.beginPath(); g.arc(cx,cy,R,0,TAU); g.fill();
  g.fillStyle='#3b2233'; for(let i=0;i<12;i++){ const a=i/12*TAU; const r0=i%3?R-7:R-11; g.save(); g.translate(cx+Math.cos(a)*(R-6),cy+Math.sin(a)*(R-6)); g.rotate(a); g.fillRect(-(i%3?2.4:4.4),-1.4,i%3?4.8:8.8,2.8); g.restore(); }
  for(const s of [-1,1]){ g.fillStyle=SBC.outline; rrect(g,cx+s*62-9,24700,18,22,4); g.fill(); g.fillStyle='#7aa8c0'; rrect(g,cx+s*62-7,24702,14,18,3); g.fill(); }
  g.fillStyle=SBC.outline; rrect(g,cx-15,24792,30,32,6); g.fill(); g.fillStyle='#6a3e22'; rrect(g,cx-13,24794,26,30,5); g.fill(); g.fillStyle='#d8b04a'; g.beginPath(); g.arc(cx+7,24810,2,0,TAU); g.fill();
  g.restore();
}
// ---------- live ground pieces (drawn every frame under the figures)
function c1DrawBelts(t){
  const run=C1T.clock, ph=run?t*90:(Math.floor(t/2.4)*24+(t%2.4<0.45?(t%2.4)/0.45*24:24));
  for(const b of C1.belts){ if(!inView((b.x0+b.x1)/2,(b.y0+b.y1)/2,Math.max(b.x1-b.x0,b.y1-b.y0)/2+60)) continue;
    ctx.save(); ctx.fillStyle=SBC.outline; rrect(ctx,b.x0-3,b.y0-3,b.x1-b.x0+6,b.y1-b.y0+6,6); ctx.fill(); ctx.fillStyle='#4a4650'; rrect(ctx,b.x0,b.y0,b.x1-b.x0,b.y1-b.y0,5); ctx.fill();
    ctx.beginPath(); ctx.rect(b.x0+2,b.y0+2,b.x1-b.x0-4,b.y1-b.y0-4); ctx.clip(); ctx.fillStyle='#6a6670';
    if(b.dx){ const o=ph%24; for(let x=b.x0-24+o;x<b.x1;x+=24){ ctx.fillRect(x,b.y0+2,10,b.y1-b.y0-4); } }
    else{ const o=ph%24; for(let y=b.y0-24+o;y<b.y1;y+=24){ ctx.fillRect(b.x0+2,y,b.x1-b.x0-4,10); } }
    ctx.restore(); ctx.fillStyle='#d8a440'; if(b.dx){ ctx.fillRect(b.x0,b.y0-3,b.x1-b.x0,2.4); ctx.fillRect(b.x0,b.y1+0.6,b.x1-b.x0,2.4); } else { ctx.fillRect(b.x0-3,b.y0,2.4,b.y1-b.y0); ctx.fillRect(b.x1+0.6,b.y0,2.4,b.y1-b.y0); } }
}
function c1DrawChain(t){
  const a={x:7322,y:28990}, b={x:7898,y:28800}; if(!inView((a.x+b.x)/2,(a.y+b.y)/2,420)) return;
  const up=C1T.clock, n=24; ctx.save();
  for(let i=0;i<=n;i++){ const k=i/n, x=lerp(a.x,b.x,k), sag=up?Math.sin(k*Math.PI)*10:Math.sin(k*Math.PI)*46, y=lerp(a.y,b.y,k)+sag+(up?Math.sin(t*2+k*6)*1.2:0);
    if(!up&&k>0.12&&k<0.88){ ctx.fillStyle='rgba(30,40,60,.35)'; ctx.beginPath(); ctx.ellipse(x,y,5,2.6,0,0,TAU); ctx.fill(); continue; }
    ctx.strokeStyle=SBC.outline; ctx.lineWidth=4.4; ctx.beginPath(); ctx.ellipse(x,y,6,3.6,i%2?0:Math.PI/2,0,TAU); ctx.stroke(); ctx.strokeStyle='#8a8e98'; ctx.lineWidth=2.2; ctx.stroke(); }
  for(const p of [a,b]){ ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.arc(p.x,p.y-4,10,0,TAU); ctx.fill(); ctx.fillStyle='#5a5e68'; ctx.beginPath(); ctx.arc(p.x,p.y-4,8,0,TAU); ctx.fill(); ctx.fillStyle='#d8a440'; ctx.beginPath(); ctx.arc(p.x-2,p.y-6,3,0,TAU); ctx.fill(); }
  // the rip in the harbor mouth: white streaks running out to sea
  for(let i=0;i<10;i++){ const k=((t*0.35+i*0.1)%1), x=7360+(i*53)%520, y=28900+k*320; ctx.strokeStyle=`rgba(255,255,255,${0.5*Math.sin(k*Math.PI)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+8,y+14,x+2,y+28); ctx.stroke(); }
  ctx.restore();
}
function c1DrawPassStair(){
  c1Put(c1Tall('passstair',220,380,110,360,g=>{
    for(let i=0;i<11;i++){ const y=-i*30, w=120-i*4; g.fillStyle='rgba(40,30,40,.25)'; g.fillRect(-w/2+4,y+4,w,22); g.fillStyle=i%2?'#e8e2d2':'#f2ede0'; g.fillRect(-w/2,y,w,22); g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(-w/2,y,w,4); g.fillStyle='rgba(120,110,90,.4)'; g.fillRect(-w/2,y+18,w,4); }
    for(const s of [-1,1]){ g.fillStyle='#b8b0a0'; g.beginPath(); g.moveTo(s*62,20); g.lineTo(s*44,-310); g.lineTo(s*36,-310); g.lineTo(s*54,20); g.closePath(); g.fill(); } }),3400,20330);
}
function c1DrawSealed(o,t){ c1Put(c1Tall('sealed',60,70,30,60,g=>{ c1Ell(g,0,4,22,7,'rgba(40,40,30,.3)'); celFill(g,(q,dx,dy)=>{ q.moveTo(-16+dx,4+dy); q.lineTo(-12+dx,-40+dy); q.quadraticCurveTo(dx,-50+dy,12+dx,-40+dy); q.lineTo(16+dx,4+dy); q.closePath(); },'#e4e0d2',{r:16}); g.strokeStyle='#a8a090'; g.lineWidth=2; g.beginPath(); g.moveTo(-8,-30); g.lineTo(8,-12); g.moveTo(8,-30); g.lineTo(-8,-12); g.stroke(); }),o.x,o.y); }
function c1DrawBirch(o,t){ const open=G.found.c_birch_cracked; c1Put(c1Tall('birch'+(open?1:0),90,120,45,100,g=>{
  c1Ell(g,4,6,34,10,'rgba(40,40,50,.3)'); celFill(g,(q,dx,dy)=>{ q.moveTo(-26+dx,6+dy); q.lineTo(-20+dx,-80+dy); q.lineTo(20+dx,-80+dy); q.lineTo(26+dx,6+dy); q.closePath(); },'#ece8f2',{r:24});
  for(const [x,y] of [[-10,-60],[8,-40],[-6,-20],[12,-70]]){ c1Ell(g,x,y,5,2.4,'#3a3044'); }
  g.fillStyle='#2a2030'; g.beginPath(); g.moveTo(-3,-70); g.lineTo(4,-50); g.lineTo(-2,-34); g.lineTo(5,-12); g.lineTo(-1,0); g.lineTo(-7,-14); g.lineTo(-3,-34); g.lineTo(-8,-52); g.closePath(); g.fill();
  if(open){ g.fillStyle='#140e1a'; g.beginPath(); g.ellipse(0,-36,12,26,0,0,TAU); g.fill(); } }),o.x,o.y);
  if(!open){ const k=0.5+0.5*Math.sin(t*3); glowAt(o.x,o.y-34,8,'200,220,255',0.3+0.3*k); } }
function c1DrawKelp(o,t){ c1Put(c1Tall('kelp',120,110,60,96,g=>{ for(let i=0;i<14;i++){ const x=-46+i*7, L=70+((i*37)%30); g.strokeStyle=i%2?'#6a6a2a':'#8a7a34'; g.lineWidth=6; g.lineCap='round'; g.beginPath(); g.moveTo(x,-86); g.quadraticCurveTo(x+(i%3-1)*8,-40,x+(i%2?4:-4),-86+L); g.stroke(); } g.strokeStyle='#4a4a1a'; g.lineWidth=4; g.beginPath(); g.moveTo(-52,-88); g.lineTo(52,-88); g.stroke(); }),o.x,o.y+12);
  if(G.found.c_kelp_heat>0) glowAt(o.x,o.y-30,40,'255,140,60',0.3); }
function c1DrawPage(o,t){ const b=Math.sin(t*2)*1.5; c1Put(c1Tall('page',30,30,15,20,g=>{ c1Ell(g,0,4,10,4,'rgba(40,30,30,.3)'); c1Rect(g,-9,-12,18,14,'#f2e6c6',2); g.strokeStyle='#8a7a5a'; g.lineWidth=0.8; for(let y=-9;y<0;y+=3){ g.beginPath(); g.moveTo(-6,y); g.lineTo(6,y); g.stroke(); } }),o.x,o.y+b); glowAt(o.x,o.y-6,16,'255,236,170',0.25+0.1*Math.sin(t*3)); }
function c1DrawCut(t){ if(!inView(9690,26960,700)) return;
  // the Cut churns: white water streaming round, foam against the walls, rocks sticking up
  ctx.save(); ctx.lineCap='round';
  for(let i=0;i<22;i++){ const k=(t*(0.35+(i%3)*0.12)+i/22)%1, x=9580+((i*53)%200), y=26100+((i*137)%600)+k*700; if(!inView(x,y,40)) continue; const a=0.6*Math.sin(k*Math.PI); ctx.strokeStyle=`rgba(255,255,255,${a})`; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+18*Math.sin(i+t),y+12,x+6,y+26); ctx.stroke(); }
  for(const sx of [9572,9790]) for(let y=26000;y<27900;y+=46){ if(!inView(sx,y,30)) continue; const f=0.5+0.5*Math.sin(t*3+y*0.05); ctx.fillStyle=`rgba(255,255,255,${0.35+0.35*f})`; ctx.beginPath(); ctx.ellipse(sx+(sx<9700?6:-6),y,6+4*f,10,0,0,TAU); ctx.fill(); }
  for(const [x,y,r] of [[9630,26420,14],[9745,26760,16],[9650,27220,12],[9730,27560,15],[9620,26060,11]]){ if(!inView(x,y,40)) continue; ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x,y+4,r+6,r*0.6+4,0,0,TAU); ctx.fill(); ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(x,y,r+1.6,r*0.75+1.6,0,0,TAU); ctx.fill(); ctx.fillStyle='#5a5f66'; ctx.beginPath(); ctx.ellipse(x,y,r,r*0.75,0,0,TAU); ctx.fill(); ctx.fillStyle='#7c8088'; ctx.beginPath(); ctx.ellipse(x-r*0.25,y-r*0.25,r*0.5,r*0.35,0,0,TAU); ctx.fill(); }
  ctx.restore(); }
function c1DrawStack(t){ if(!inView(10360,24560,300)) return; c1Put(c1Tall('stackcap',140,40,70,20,g=>{ g.strokeStyle=SBC.outline; g.lineWidth=5; g.strokeRect(-58,-12,116,24); g.strokeStyle='#d8a440'; g.lineWidth=3; g.strokeRect(-58,-12,116,24); c1Shade(g,-18,-9,36,18,'#5a5e68'); g.strokeStyle='#3a3e48'; g.lineWidth=1.2; for(let x=-12;x<18;x+=8){ g.beginPath(); g.moveTo(x,-9); g.lineTo(x,9); g.stroke(); } }),10360,24560);
  if(Math.random()<0.25&&!AREA) emit(10360+rand(-30,30),24530,1,{col:'120,110,110',glow:false,ang:-Math.PI/2,spread:0.4,smin:15,smax:40,lmin:2,lmax:3.4,zmin:6,zmax:12,grow:14,drag:0.4}); }
function c1DrawSeal(o,t){ const awake=G.found.c_seal_awake, x=awake?o.x+60:o.x, y=awake?o.y+30:o.y-10, br=awake?0:Math.sin(t*1.4)*1.4;
  ctx.save(); ctx.translate(x,y); if(awake==='huff') ctx.scale(-1,1);
  ctx.fillStyle='rgba(30,30,40,.3)'; ctx.beginPath(); ctx.ellipse(2,12,34,9,0,0,TAU); ctx.fill();
  ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(0,0,33+br,17+br*0.5,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(26,-8,14,0,TAU); ctx.fill();
  ctx.fillStyle='#8a8e98'; ctx.beginPath(); ctx.ellipse(0,0,31+br,15+br*0.5,0,0,TAU); ctx.fill(); ctx.fillStyle='#a8acb6'; ctx.beginPath(); ctx.ellipse(-4,-5,22,8,0,0,TAU); ctx.fill();
  ctx.fillStyle='#8a8e98'; ctx.beginPath(); ctx.arc(26,-8,12,0,TAU); ctx.fill(); ctx.fillStyle='#2a2a30'; if(awake){ ctx.beginPath(); ctx.arc(30,-11,2,0,TAU); ctx.fill(); } else { ctx.fillRect(27,-11,6,1.6); }
  ctx.fillStyle='#4a4a54'; ctx.beginPath(); ctx.arc(36,-6,2.6,0,TAU); ctx.fill(); ctx.restore();
  if(!awake&&Math.sin(t*1.4)>0.95) ftext(o.x+20,o.y-40,'z','#e6eef8',12); }
function c1DrawCauseway(t){ if(!C1T.spire||!inView(7300,29400,620)) return; for(let i=0;i<6;i++){ const k=((t*0.4+i/6)%1); ctx.strokeStyle=`rgba(220,210,255,${0.45*Math.sin(k*Math.PI)})`; ctx.lineWidth=2; const x=7280+(i*31)%140, y=29610+k*110; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+16,y+8,x+30,y); ctx.stroke(); } }
function c1DrawLift(t){
  const L=C1.lift; if(!L||!inView(L.x,25250,200)) return;
  // the shaft: two brass rails down the Cliff Wall, the cage riding between them
  ctx.save(); for(const s of [-1,1]){ ctx.fillStyle=SBC.outline; ctx.fillRect(L.x+s*24-3,25120,6,240); ctx.fillStyle='#d8a440'; ctx.fillRect(L.x+s*24-1.6,25120,3.2,240); }
  let k=L.pos; if(L.ride){ L.ride.t+=1/60; const f=clamp(L.ride.t/0.55,0,1); k=lerp(L.ride.from,L.ride.to,f*f*(3-2*f)); if(f>=1){ L.pos=L.ride.to; L.ride=null; c1Snd('clank',0.6); } }
  const cy=lerp(25160,25350,k);
  ctx.fillStyle=SBC.outline; rrect(ctx,L.x-22,cy-44,44,48,6); ctx.fill(); ctx.fillStyle='#a07428'; rrect(ctx,L.x-20,cy-42,40,44,5); ctx.fill(); ctx.fillStyle='rgba(30,24,30,.55)'; rrect(ctx,L.x-15,cy-36,30,32,3); ctx.fill();
  ctx.strokeStyle='#d8a440'; ctx.lineWidth=1.6; for(let x=-12;x<=12;x+=6){ ctx.beginPath(); ctx.moveTo(L.x+x,cy-36); ctx.lineTo(L.x+x,cy-4); ctx.stroke(); }
  ctx.strokeStyle=SBC.outline; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(L.x,25120); ctx.lineTo(L.x,cy-44); ctx.stroke();
  celBall(ctx,L.x,25118,9,'#d8a440'); ctx.restore();
}

// ================= 10. the world states, the life of the coast, and the hooks into the engine
// ---------- the coastline: the bible's land polygon with a noisy shore, except the Lower Town's straight stone quay
let C1SDF=null;
function c1LandD(x,y){
  if(!C1SDF) C1SDF=polySDF(C1G.land,MAPS[1],80);
  const d=sdfAt(C1SDF,x,y), A=110;
  if(d>A*1.3+260||d<-A*1.3-500) return d;
  const nz=d+fbm(x*0.0022+17,y*0.0022-5,3)*A+fbm(x*0.012,y*0.012,2)*A*0.12;
  if(x>6540&&x<8420&&y>26250&&y<26720){ const k=clamp(Math.min(x-6540,8420-x)/80,0,1); return lerp(nz,C1QUAY.y-y,k); }
  return nz;
}
MAPS[1].terrain.sea={landD:c1LandD,shore:60,shelf:170}; MAPS[1].tz=null;
// a sea-cave look for the Gullcrag Caves and the Smugglers' Cove (dark basalt, green moss on top)
if(typeof R2CAVE!=='undefined') R2CAVE.c_sea={rk:['#5e636a','#4c5158','#70747a'],top:'#5a7a4a',dark:'#05080c'};
// ---------- redraw what a world state changed: ground chunks, props and the overview rows in a box (or the whole map)
function c1Redraw(boxes){
  const all=boxes.includes('all');
  for(const [key] of [...CHUNKS]){ const cx=Math.floor(key/1000), cy=key-cx*1000; if(mapAt(cy*CH+CH/2)!==1) continue;
    if(all||boxes.some(b=>b!=='all'&&(cx+1)*CH>=b[0]&&cx*CH<=b[2]&&(cy+1)*CH>=b[1]&&cy*CH<=b[3])) CHUNKS.delete(key); }
  for(const [key,arr] of [...PROPS]){ const cx=Math.floor(key/1000), cy=key-cx*1000; if(mapAt(cy*CH+CH/2)!==1) continue;
    if(all||boxes.some(b=>b!=='all'&&(cx+1)*CH>=b[0]-60&&cx*CH<=b[2]+60&&(cy+1)*CH>=b[1]-60&&cy*CH<=b[3]+60)){ for(const p of arr) if(p.col) removeCol(p.col); PROPS.delete(key); } }
  const O=MAPS[1]&&MAPS[1].ov; if(O){ let r0=O.h; for(const b of boxes) r0=Math.min(r0,b==='all'?0:Math.max(0,Math.floor((b[1]-O.y0)/O.s))); O.row=Math.min(O.row,r0); O.done=false; }
  if(G) G.chunkBurst=Math.max(G.chunkBurst||0,6);
}
// ---------- shrines that appear later (the Chalk Dragon Shrine, the Breakwater Shrine)
function c1ShrineSet(d,on){
  if(on===!!d.on) return; d.on=on; const s=d.s;
  if(on){ SHRINES.push(s); d.st={k:'shrine',x:s.x,y:s.y,ref:s}; STRUCTS.push(d.st); d.col=addCol({t:'c',x:s.x,y:s.y,r:16}); d.L={x:s.x,y:s.y,r:150,i:0.6,shrine:s}; LIGHTS.push(d.L); }
  else{ for(const [A,o] of [[SHRINES,s],[STRUCTS,d.st],[LIGHTS,d.L]]){ const i=A.indexOf(o); if(i>=0) A.splice(i,1); } if(d.col) removeCol(d.col); }
  OCCS=null;
}
// ---------- Spire Rock rises: its door, the moth curtains on the causeway, its place name
const C1CURT=[{id:'c_moth_cw1',x:7255,y:29150,w:150,h:16},{id:'c_moth_cw2',x:7355,y:29540,w:150,h:16},{id:'c_moth_cw3',x:7325,y:29800,w:150,h:16}];
function c1SpireSet(on){
  if(on){
    if(!C1.spireObjs){ C1.spireObjs=C1CURT.map(o=>p2Add('mothcurtain',Object.assign({},o))); }
    if(!DOORS.includes(C1.spireDoor)) DOORS.push(C1.spireDoor);
    POI.c_spirerock={x:7400,y:30200,r:300,name:S('Spire Rock','Spire Rock'),level:13};
  }else{
    if(C1.spireObjs){ for(const o of C1.spireObjs){ for(const A of [LANDMARKS,P2.out]){ const i=A.indexOf(o); if(i>=0) A.splice(i,1); } if(o.col) removeCol(o.col); } C1.spireObjs=null; }
    const i=DOORS.indexOf(C1.spireDoor); if(i>=0) DOORS.splice(i,1);
    delete POI.c_spirerock;
  }
}
// ---------- snow in summer: snow on every coast biome, a white tint, a dusting on the ground
function c1SnowSet(on){
  for(const b of C1B_COAST){ const B=BIOMES[b]; if(!B) continue; if(B._c1snow==null) B._c1snow=B.ambient.snow||0; B.ambient.snow=on?0.6:B._c1snow; B._amb=null; }
  if(typeof AMBM!=='undefined') AMBM.clear(); MAPS[1].sky=on?{tint:'#eef2ff',k:0.14}:null; if(MAPS[1].sky) MAPS[1].sky._t=null;
}
// ---------- the Chalk Dragon's Breath: an updraft on the hill once the dragon's eye is open (bible 7.9)
function c1BreathSet(on){
  const E=ELV.maps[1]; if(!E) return;
  if(on&&!C1.breath){ C1.breath={x:6400,y:21700,r:70,lift:1,lvl:2,i:E.vents.length,c1:true}; E.vents.push(C1.breath); LIGHTS.push(C1.breathL={x:6400,y:21700,r:150,i:0.75,fire:true}); c1Redraw([[6300,21600,6500,21800]]); }
  else if(!on&&C1.breath){ const i=E.vents.indexOf(C1.breath); if(i>=0) E.vents.splice(i,1); const j=LIGHTS.indexOf(C1.breathL); if(j>=0) LIGHTS.splice(j,1); C1.breath=null; c1Redraw([[6300,21600,6500,21800]]); }
}
// ---------- read the flags every frame (cheap) and switch the world to match
function c1Sync(force){
  if(!G||!G.flags||!C1.built) return;
  const boxes=[];
  const low=C1F('c_lowtide'); if(low!==C1T.low){ C1T.low=low; boxes.push(C1G.sandsP.bb); }
  const sp=C1F('c_spire_up'); if(sp!==C1T.spire){ C1T.spire=sp; c1SpireSet(sp); boxes.push([7050,28880,7760,30560]); }
  const sn=C1F('c_snow'); if(sn!==C1T.snow){ C1T.snow=sn; c1SnowSet(sn); boxes.push('all'); }
  C1T.clock=C1F('c_clock_on');
  const dr=C1F('c_chalk_drawn'); if(dr!==!!C1.drawn){ C1.drawn=dr; boxes.push([5860,21460,7300,22460]); }
  const ch=c1ChalkDone(); if(ch!==!!C1.chalk){ C1.chalk=ch; c1BreathSet(ch); }
  for(const d of C1.shrDyn) c1ShrineSet(d,!!d.when());
  if(boxes.length) c1Redraw(boxes);
}
// ---------- the conveyor streets carry Ash (jerky while the Great Clock is stopped, smooth once it runs)
function c1Belts(dt){
  const p=player; if(!p||p.flying||(p.z||0)>0.5||p.hop||p.dead||curMap()!==1) return;
  let v=0; if(C1T.clock) v=105; else { const ph=G.time%2.4; v=ph<0.45?150:0; }
  if(!v) return;
  for(const b of C1.belts){ if(p.x<b.x0||p.x>b.x1||p.y<b.y0-6||p.y>b.y1+6) continue;
    const nx=p.x+b.dx*v*dt, ny=p.y+b.dy*v*dt; if(!playerBlocked(nx,ny)){ p.x=nx; p.y=ny; } break; }
}
// ---------- the life of the coast: steam, smoke, sparks, moths, gulls, waves
const C1STEAM=[[6900,24440],[7560,24960],[7150,25610],[6760,26010],[8200,25700],[8180,24880],[6450,25000],[10600,24300],[9900,24600],[11200,25400],[11800,24500]];
const C1GULLS=[], C1CHIMS=[];
function c1Life(dt){
  if(AREA||!player||curMap()!==1) return;
  const t=G.time, a=ambHere()||{};
  // steam from the grates in the cobbles (and the Brass Yards pipes)
  for(const [x,y] of C1STEAM){ if(!inView(x,y,80)) continue; const ph=(t+x*0.013)%3.2; if(ph<0.9&&Math.random()<dt*14) emit(x+rand(-6,6),y,1,{col:'240,240,240',glow:false,ang:-Math.PI/2,spread:0.35,smin:30,smax:70,lmin:.7,lmax:1.3,zmin:3,zmax:6,grow:9,drag:0.6,alpha:0.6}); if(ph<dt&&dist2(player.x,player.y,x,y)<300*300) c1Snd('steam',0.5); }
  // the chimney field on the terrace puffs on a beat (the rooftop chase dodges it)
  for(const [x,y] of C1CHIMS){ if(!inView(x,y,60)) continue; const ph=(t*0.8+x*0.002)%2.5; if(ph<0.6&&Math.random()<dt*16) emit(x+rand(-3,3),y,1,{col:'235,235,235',glow:false,ang:-Math.PI/2,spread:0.3,smin:40,smax:90,lmin:.6,lmax:1.1,zmin:3,zmax:6,grow:8,drag:0.5,alpha:0.65}); }
  // Professor Sprocket's chimney puffs coloured smoke, the Bright Anvil rings and sparks
  if(inView(6560,25680,120)&&Math.random()<dt*5) emit(6560+rand(-4,4),25660,1,{col:pick(['255,120,200','120,200,255','255,220,90','150,255,150']),glow:false,ang:-Math.PI/2,spread:0.4,smin:15,smax:35,lmin:1.6,lmax:2.6,zmin:4,zmax:8,grow:10,drag:0.4,alpha:0.7});
  if(dist2(player.x,player.y,7700,25860)<380*380){ C1.anvilT=(C1.anvilT||0)-dt; if(C1.anvilT<=0){ C1.anvilT=rand(0.9,1.8); SFX.play('block'); emit(7700+rand(-14,14),25870,6,{col:'255,190,90',ang:-Math.PI/2,spread:1.2,smin:40,smax:120,lmin:.2,lmax:.45,zmin:1,zmax:2}); } }
  // moths drift in the Moth Wood and over the shoals
  if(a.moths&&Math.random()<dt*6*a.moths){ const x=rand(cam.x,cam.x+W/zoom), y=rand(cam.y,cam.y+H/zoom); emit(x,y,1,{col:'214,206,236',glow:false,ang:rand(0,TAU),spread:1,smin:10,smax:30,lmin:2,lmax:3.6,zmin:1.4,zmax:2.2,drag:0.2,alpha:0.85}); }
  // gulls: cries by day, a few gliding overhead
  const gl=a.gulls||0;
  if(gl>0&&isDay()){ C1.gullT=(C1.gullT||rand(2,6))-dt; if(C1.gullT<=0){ C1.gullT=rand(2.5,8)/Math.max(0.2,gl); c1Snd('gull',0.4+0.4*gl); }
    if(C1GULLS.length<Math.round(gl*4)&&Math.random()<dt*0.4){ const s=Math.random()<0.5?-1:1, y=cam.y+rand(0.1,0.9)*H/zoom; C1GULLS.push({x:s<0?cam.x-60:cam.x+W/zoom+60,y,vx:-s*rand(70,120),vy:rand(-14,14),ph:rand(0,TAU),life:30}); } }
  for(const g of C1GULLS){ g.x+=g.vx*dt; g.y+=g.vy*dt+Math.sin(t*0.8+g.ph)*4*dt; g.ph+=dt; g.life-=dt; }
  for(let i=C1GULLS.length-1;i>=0;i--){ const g=C1GULLS[i]; if(g.life<=0||g.x<cam.x-200||g.x>cam.x+W/zoom+200) C1GULLS.splice(i,1); }
  // waves on the shore
  if(a.waves){ C1.waveT=(C1.waveT||0)-dt; if(C1.waveT<=0){ C1.waveT=rand(3.5,6.5); const d=c1LandD(player.x,player.y); if(d<420) c1Snd('wave',(0.5+0.5*a.waves)*clamp(1-d/420,0.2,1)); } }
}
function c1DrawGulls(){
  if(!C1GULLS.length) return; const t=G.time;
  for(const g of C1GULLS){ const f=Math.sin(t*5+g.ph), s=g.vx<0?-1:1;
    ctx.fillStyle='rgba(40,40,70,.12)'; ctx.beginPath(); ctx.ellipse(g.x+40,g.y+90,10,3,0,0,TAU); ctx.fill();
    ctx.save(); ctx.translate(g.x,g.y); ctx.scale(s,1); ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.strokeStyle=LOOK.sb?SBC.outline:'#4a4e58'; ctx.lineWidth=4.2; ctx.beginPath(); ctx.moveTo(-14,-f*6); ctx.quadraticCurveTo(-6,-4-f*3,0,0); ctx.quadraticCurveTo(6,-4-f*3,14,-f*6); ctx.stroke();
    ctx.strokeStyle='#fafaf6'; ctx.lineWidth=2.4; ctx.stroke(); ctx.fillStyle='#fafaf6'; ctx.beginPath(); ctx.ellipse(1,1,4,2.2,0,0,TAU); ctx.fill(); ctx.fillStyle='#f2c020'; ctx.fillRect(4.5,0,2.4,1.2); ctx.restore(); }
}
// ---------- every Gearhaven roof has a little clock: the dial is painted onto the house art, the hands are live
const C1HOUSE=new WeakMap();
function c1HousePaint(hs,c){
  const L=hs.L; if(!L||!c||!c.getContext) return;
  const g=c.getContext('2d'), sc=c.sc||HSC; g.save(); g.setTransform(sc,0,0,sc,c.ox*sc,c.oy*sc);
  const ol=SBC.outline, W=L.W, H=L.H, F=L.F, ry=-H*0.35-F*0.3;
  if(hs.town==='c_gearhaven'){
    if(hs.want==='c_ottoline'){ // the Turning Library's dome
      g.fillStyle=ol; g.beginPath(); g.ellipse(0,ry+6,W*0.5+3,W*0.36+3,0,Math.PI,TAU); g.fill(); g.fillStyle='#3a8a8a'; g.beginPath(); g.ellipse(0,ry+6,W*0.5,W*0.36,0,Math.PI,TAU); g.fill(); g.fillStyle='#6ab8b0'; g.beginPath(); g.ellipse(-W*0.16,ry-W*0.12,W*0.18,W*0.12,-0.4,0,TAU); g.fill();
      g.strokeStyle='#d8a440'; g.lineWidth=2.4; for(let k=-2;k<=2;k++){ g.beginPath(); g.moveTo(k*W*0.16,ry+6); g.quadraticCurveTo(k*W*0.08,ry-W*0.3,0,ry-W*0.34); g.stroke(); }
      g.fillStyle='#d8a440'; g.beginPath(); g.arc(0,ry-W*0.36-4,5,0,TAU); g.fill(); }
    else{ g.fillStyle=ol; g.beginPath(); g.arc(0,ry,8.6,0,TAU); g.fill(); g.fillStyle='#d8a440'; g.beginPath(); g.arc(0,ry,7.4,0,TAU); g.fill(); g.fillStyle='#fffaf0'; g.beginPath(); g.arc(0,ry,5.8,0,TAU); g.fill(); }
    if(hs.want==='c_whirligig'){ g.strokeStyle='#e8b830'; g.lineWidth=2; g.beginPath(); g.moveTo(-W,H-F); g.lineTo(W,H-F); g.stroke(); for(const ch of L.chims||[]){ g.fillStyle=ol; g.beginPath(); g.arc(ch.x,ry-6,6.2,0,TAU); g.fill(); g.fillStyle='#fffaf0'; g.beginPath(); g.arc(ch.x,ry-6,4.8,0,TAU); g.fill(); } }
    if(hs.want==='c_mo'){ g.save(); g.translate(W*0.45,ry-6); g.rotate(-0.4); g.fillStyle=ol; g.beginPath(); g.moveTo(-3,-4); g.lineTo(14,-10); g.lineTo(14,10); g.lineTo(-3,4); g.closePath(); g.fill(); g.fillStyle='#d8a440'; g.beginPath(); g.moveTo(-2,-2.6); g.lineTo(12.6,-8.4); g.lineTo(12.6,8.4); g.lineTo(-2,2.6); g.closePath(); g.fill(); g.restore(); }
    if(hs.want==='c_fig'){ g.fillStyle=ol; g.beginPath(); g.ellipse(-W*0.42,ry+2,11,8.6,0,0,TAU); g.fill(); g.fillStyle='#e07a5a'; g.beginPath(); g.ellipse(-W*0.42,ry+2,9.6,7.2,0,0,TAU); g.fill(); g.fillRect(-W*0.42+8,ry-1,7,2.6); g.fillStyle='#fff6e6'; g.beginPath(); g.arc(-W*0.42-2,ry-1,2.4,0,TAU); g.fill(); }
    if(hs.want==='c_ingrid'){ g.fillStyle='rgba(255,150,60,.8)'; g.fillRect(-W*0.5,H-F+6,W*0.34,F-10); g.fillStyle='rgba(255,230,160,.9)'; g.fillRect(-W*0.46,H-F+12,W*0.2,F-18); }
  }
  g.restore();
}
function c1HandsOf(hs){
  const {h,m}=c1ClockHands(), ah=(h+m/60)/12*TAU-Math.PI/2, am=m/60*TAU-Math.PI/2, L=hs.L, cx=hs.x, cy=hs.y-L.H*0.35-L.F*0.3;
  ctx.save(); ctx.strokeStyle=SBC.outline; ctx.lineCap='round'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(ah)*3.2,cy+Math.sin(ah)*3.2); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(am)*4.8,cy+Math.sin(am)*4.8); ctx.stroke(); ctx.restore();
}
function c1HouseHands(t){
  const {h,m}=c1ClockHands(), ah=(h+m/60)/12*TAU-Math.PI/2, am=m/60*TAU-Math.PI/2;
  ctx.save(); ctx.strokeStyle=SBC.outline; ctx.lineCap='round';
  for(const hs of mapList(HOUSES,1)){ if(hs.town!=='c_gearhaven'||hs.want==='c_ottoline'||!hs.L||!inView(hs.x,hs.y,hs.w)) continue; const L=hs.L, cx=hs.x, cy=hs.y-L.H*0.35-L.F*0.3;
    ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(ah)*3.2,cy+Math.sin(ah)*3.2); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(am)*4.8,cy+Math.sin(am)*4.8); ctx.stroke(); }
  ctx.restore();
}
// ---------- hooks
{ const base=houseSprite; houseSprite=function(hs){ const c=base(hs); if(hs&&hs.town&&hs.town.startsWith('c_')&&c&&!C1HOUSE.has(c)){ C1HOUSE.set(c,1); try{ c1HousePaint(hs,c); }catch(e){} } return c; }; }
// homes: a CAST person a house is planned for (house.want, or a virtual home such as Ambrose's workshop in the clock
// tower) gets that one; everyone else is placed by the stock rules in e1_maps (nearest house first)
{ const base=assignHomesNew; assignHomesNew=function(){
  const off=[];
  const give=(town,o,i,hsx,door)=>{ const style=STYLE_OF[o.job]||o.style||'home';
    const def=defHouse('h_'+o.id,{name:o.house||'House',owner:o.id,style,seed:1000+i+town.length*31,painting:i,egg:i+3,w:style==='inn'||style==='lodge'?680:560,h:style==='inn'?460:400,town});
    if(INDOOR[o.id]&&CASTBY[o.id]) CASTBY[o.id].inside=def.id;
    if(hsx){ hsx.owner=o.id; hsx.area=def.id; hsx.door=door; }
    DOORS.push({x:door.x,y:door.y,area:def.id,label:`Enter ${def.name}`,outY:door.outY||0,hs:hsx||undefined,owner:def.owner}); off.push(o); o.home=false; };
  try{
    for(const town of TOWN_ORDER){ if(!town.startsWith('c_')) continue;
      const owners=CAST.filter(c=>c.town===town&&c.home&&!c.generic);
      for(const h of HOUSES){ if(h.town!==town||h.k!=='house'||h.area||!h.want) continue; const i=owners.findIndex(c=>c.id===h.want&&c.home); if(i>=0) give(town,owners[i],i,h,doorOf(h)); }
      for(const v of C1.homes){ if(v.town!==town) continue; const i=owners.findIndex(c=>c.id===v.want&&c.home); if(i>=0){ give(town,owners[i],i,null,v.door); if(!owners[i].house) AREADEFS['h_'+owners[i].id].name=v.name; } }
    }
  }catch(e){ console.error('c1 homes',e); }
  try{ base(); } finally { for(const o of off) o.home=true; }
}; }
// doors with a gate (the Brassworks front gate, the Smugglers' Cove behind the kelp)
{ const base=enterArea; enterArea=function(id,door){ if(door&&door.need&&!door.need()){ SFX.play('ui'); runDialogue([['narr',door.locked||S('It will not open.','It is shut.')]],()=>{ scene='play'; }); return; } return base(id,door); }; }
// the causeway posts exist only while Spire Rock is up
{ const bp=ELEV.posts, C={sp:null,src:null,l:null}; ELEV.posts=function(k){ const L=bp(k); if(k!==1) return L; if(C.src===L&&C.sp===C1T.spire&&C.n===L.length) return C.l; C.src=L; C.sp=C1T.spire; C.n=L.length; C.l=L.filter(q=>!q.when||q.when()); return C.l; }; }
// regions everywhere on the coast follow the cliffs (music, ambience, events, banners)
{ const base=biomeInfo; biomeInfo=function(x,y,o){ const r=base(x,y,o); if(C1.built&&y>=20000&&y<=31000&&x<IZX-50){ const b=c1Region(x,y,elevLvl(x,y),0); o.b=b; o.b2=b; o.t=1; } return r; }; }
// the risen Spire Rock and the causeway are land, the harbor and the skim lanes are calm water
{ const base=mapBlocked; mapBlocked=function(x,y){ if(C1T.spire&&y>28900&&y<30550&&x>7080&&x<7740&&c1DynLand(x,y)&&x>30){ return !!c1Block(x,y); } return base(x,y); }; }
{ const base=mapStrideBlocked; mapStrideBlocked=function(x,y){
  if(y>=20000&&y<=31000&&x>30&&x<13970){ if((C1T.spire&&y>28900&&y<30550&&x>7080&&x<7740&&c1DynLand(x,y))||c1Calm(x,y)) return !!c1Block(x,y); }
  return base(x,y); }; }
// standing things sorted with the figures; the gulls overhead
{ const base=eventsForRender; eventsForRender=function(list){ base(list); if(!G||AREA||!player||curMap()!==1||!C1.built) return; const t=G.time;
  c1ObjsInView(o=>{ const D=C1K[o.k]; if(!D||!inView(o.x,o.y-(o.R*0.5),o.R)) return; list.push({x:o.x,y:o.base,r:8,flying:true,draw:()=>{ try{ D.draw(o,t); }catch(e){} if(o.k==='windmill') for(const c of mapList(CHESTS,1)) if(c.c1top&&!c.open&&Math.abs(c.x-o.x)<40&&Math.abs(c.y-o.y)<200) drawChest(c,t); }}); }); }; }
{ const base=drawDoor; drawDoor=function(d){ base(d); if(d&&d.hs&&d.hs.town==='c_gearhaven'&&d.hs.L&&d.hs.want!=='c_ottoline') c1HandsOf(d.hs); }; }
{ const base=drawBirds; drawBirds=function(){ base(); if(!AREA&&curMap()===1) c1DrawGulls(); }; }
{ const base=update; update=function(dt){ try{ c1Sync(); }catch(e){ console.error('c1 sync',e); } const r=base(dt); try{ if(scene==='play'&&G&&G.mode!=='menu'){ c1Belts(dt); c1Life(dt); } }catch(e){ console.error('c1 life',e); } return r; }; }
// the seal's chest, the kelp curtain, the hollow birch
{ const base=openChest; openChest=function(c){ if(c&&c.id==='c_ch_seal'&&!G.found.c_seal_awake){ c1Say([S('A very large seal is asleep on this chest. It is not your chest right now. It is a seal bed.','A seal is asleep on it!')]); return; } return base(c); }; }
{ const base=breathIgnite; breathIgnite=function(mx,my,ang,dt){ base(mx,my,ang,dt); try{ if(!AREA&&!G.found.c_kelp_burnt&&curMap()===1&&inArcC(mx,my,ang,175,0.45,{x:3700,y:27850,r:46})){ G.found.c_kelp_heat=(G.found.c_kelp_heat||0)+dt; if(Math.random()<0.5) emit(3700+rand(-40,40),27840+rand(-30,20),1,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.3,lmax:.6,zmin:2,zmax:4});
  if(G.found.c_kelp_heat>0.7){ G.found.c_kelp_burnt=true; delete G.found.c_kelp_heat; SFX.play('pop'); emit(3700,27840,24,{col:'90,80,40',glow:false,ang:-Math.PI/2,spread:1,smin:20,smax:80,lmin:.8,lmax:1.6,zmin:3,zmax:7,grow:8}); setBanner(S('The kelp burns away','The kelp burns!'),S('A crack in the cliff: the Smugglers\' Cove!','A secret cave!'),2.6); saveGame(); } } }catch(e){} }; }
{ const base=swingBreakables; swingBreakables=function(px,py,dir,range,half){ base(px,py,dir,range,half); try{ if(!AREA&&curMap()===1&&!G.found.c_birch_cracked&&player.swingW==='hammer'&&inArcC(px,py,dir,range+20,half,{x:880,y:22150,r:26})){ G.found.c_birch_cracked=true; shake(4); SFX.play('boom');
  emit(880,22140,20,{col:'230,226,240',glow:false,smin:40,smax:140,lmin:.4,lmax:.8,zmin:2,zmax:4}); giveItems({star_iron:1}); setBanner(S('CRACK!','CRACK!'),S('The old birch splits. Inside: a lump of star-iron!','Star-iron inside the tree!'),2.6); saveGame(); } }catch(e){} }; }
// the Power Lab's outdoor sandbox (p2_coast debug) moves off the Downs to a flat lowland spot (the Downs are level 1 now)
if(typeof P2_SB!=='undefined'&&!P2_SB.built){ P2_SB.x=3700; P2_SB.y=24450; }
// ---------- debug hooks
window.__ebX=Object.assign(window.__ebX||{},{
  c1:{C1,C1G,C1T,C1ROOF,C1K,sync:c1Sync,region:(x,y)=>c1Region(x,y,elevLvl(x,y),0),landD:c1LandD,
    set(flag,v){ G.flags[flag]=v===undefined?true:v; c1Sync(); return {flag,v:G.flags[flag]}; },
    spots:{pass:[3400,20520],downgate:[3190,20900],fold:[3900,21260],dragon:[6600,22560],mill:[9700,22420],gate:[6950,24300],square:[6900,24870],clock:[7200,24860],library:[7700,24520],manor:[7900,25000],
      stairTop:[7070,25150],stairBot:[7070,25420],lift:[7700,25360],market:[7000,25960],teapot:[7300,26290],quay:[7600,26440],pier:[8500,27150],heights:[9200,26700],cut:[9510,26960],cutE:[9860,26985],
      brass:[10200,24880],stack:[10360,24860],yards:[11000,24600],gullsrest:[4300,25960],cliffs:[5000,26200],smugglers:[4950,27800],beach:[4600,28450],wreck:[4600,28460],salt:[2100,26450],tide:[2250,26360],
      oona:[1150,27150],sands:[1600,28600],gullcrag:[1400,29470],gullshrine:[2340,28330],mothwood:[1350,22900],moonring:[1350,22900],lantern:[11500,27760],lighthouse:[12880,29100],cottage:[12300,28620],seal:[11800,29200],
      breakwater:[7150,28960],spire:[7400,30080],valley:[4000,24500],east:[13200,24200]},
    go(name){ const s=this.spots[name]; if(!s) return null; return window.__ebX.goMap(1,s[0],s[1]); },
    objs:()=>C1.objs.length, belts:()=>C1.belts, homes:()=>C1.homes, ph:()=>C1.ph, gulls:()=>C1GULLS.length,
    SHRINES, HOUSES, DOORS, AREADEFS, save:()=>saveGame(), door:(area,i)=>{ const d=DOORS.filter(q=>q.area===area)[i||0]; if(d) enterArea(d.area,d); return !!AREA; }, stride:(x,y)=>mapStrideBlocked(x,y), blocked:(x,y)=>blockedAt(x,y),
    // reachability on foot (8 px cells, the engine's own blocking; o.stride lets Water Stride count)
    flood(sx,sy,o){ o=o||{}; const cs=o.cs||8, bb=o.bb||[0,20000,14000,31000], x0=bb[0], y0=bb[1], w=Math.ceil((bb[2]-bb[0])/cs), h=Math.ceil((bb[3]-bb[1])/cs), seen=new Uint8Array(w*h), q=[];
      const pass=(x,y)=>{ if(outOfMap(x,y,30)) return false; if(colAt(x,y,5)) return false; if(!blockedAt(x,y)) return true; return !!(o.stride&&!(elevFace(x,y)&1)&&!mapStrideBlocked(x,y)); };
      if(!pass(sx,sy)) return {fail:'start blocked'}; const k0=Math.floor((sy-y0)/cs)*w+Math.floor((sx-x0)/cs); seen[k0]=1; q.push(k0);
      while(q.length){ const c=q.pop(), i=c%w, j=(c/w)|0; for(let d=0;d<4;d++){ const a=i+(d===0?1:d===1?-1:0), b=j+(d===2?1:d===3?-1:0); if(a<0||b<0||a>=w||b>=h) continue; const k=b*w+a; if(seen[k]) continue; if(!pass(x0+(a+0.5)*cs,y0+(b+0.5)*cs)) continue; seen[k]=1; q.push(k); } }
      C1.flood={seen,w,h,x0,y0,cs}; let n=0; for(const v of seen) n+=v; return {n}; },
    at(x,y){ const F=C1.flood; if(!F) return false; const i=Math.floor((x-F.x0)/F.cs), j=Math.floor((y-F.y0)/F.cs); for(let dj=-2;dj<=2;dj++) for(let di=-2;di<=2;di++){ const a=i+di,b=j+dj; if(a>=0&&b>=0&&a<F.w&&b<F.h&&F.seen[b*F.w+a]) return true; } return false; }}
});
