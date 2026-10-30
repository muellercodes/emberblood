
// ================= Act III world: Frostreach (map 2, x 0..14000, y 40000..51000)
// Built from the story bible (scratchpad/bible/ACT3.md sections 3, 4, 6, 7, 9 and 13): ten regions (biomes 20 to 29),
// the Shiversea and its Floe Field, the Glimmerfrost (a lake of slippery ice), the Whitewater and the Pinerun, the
// Steamwell hot spring, Mount Dread (a massif with a long climb to the Crown of Dread), the Dreadmoor and the Dreadgate,
// the Windscour plateau, the Howling Gap and the Cloudsea (a fall into the clouds), the Sky Isles and Skyreach Temple,
// the Stonehorn Badlands, the Pinewhisper taiga, three towns (Hearthold behind its round wall around the Great Hearth,
// frozen Rimeholm on its terrace above the sea, Hask's Rest in the pines), the 20 Frozen Folk, shrines, camps,
// landmarks, secrets, chests, the dungeon doors and the crossings. World states read from G.flags every frame:
// f_hearth_lit (the Hearth burns blue and gold, the snow slides off Hearthold's roofs), f_northgate (the North Gate is
// open), f_ylva and the f_thaw_* flags (Rimeholm thaws one person at a time), f_hush_done (the Frost Lock is gone and
// the Dreadgate opens), f_crown_open (the summit door). Doc for the other Act III helpers: scratchpad/F2WORLD.md.
// All coordinates are absolute. Every id uses the f_ prefix. Every player-facing line goes through S(full, simple).
const F2WD={k:2,y0:40000,objs:[],bk:new Map(),bs:512,built:false,t:0,homes:[],frz:[],dyn:{},snd:{},lamps:[],ph:[],
  cl:[],chims:[],steam:[],sleds:[],hooks:{},st:{lit:null,gate:null,ylva:null,hush:null,crown:null,rime:null},town:null};
const F2WF=k=>!!(G&&G.flags&&G.flags[k]);
const F2WQ=q=>!!(G&&G.quests&&G.quests[q]&&G.quests[q].done);
const F2WQA=q=>!!(G&&G.quests&&G.quests[q]&&!G.quests[q].done);
// a stage that exists and has been reached (an unknown stage would always count as reached)
const f2wReached=s=>typeof reached==='function'&&!!(typeof STAGEDEF!=='undefined'&&STAGEDEF[s])&&reached(s);
// ---------- small geometry helpers (shapes are plain arrays so the terrain hooks stay cheap)
function f2wPoly(P){ const o={P,bb:[1e9,1e9,-1e9,-1e9]}; for(const p of P){ o.bb[0]=Math.min(o.bb[0],p[0]); o.bb[1]=Math.min(o.bb[1],p[1]); o.bb[2]=Math.max(o.bb[2],p[0]); o.bb[3]=Math.max(o.bb[3],p[1]); } return o; }
function f2wInP(o,x,y){
  if(x<o.bb[0]||y<o.bb[1]||x>o.bb[2]||y>o.bb[3]) return false;
  const P=o.P; let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i], b=P[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c;
}
const f2wInR=(r,x,y)=>x>=r[0]&&y>=r[1]&&x<=r[2]&&y<=r[3];
const f2wInD=(d,x,y)=>{ const dx=x-d[0], dy=y-d[1]; return dx*dx+dy*dy<=d[2]*d[2]; };
// distance from a point to a polyline
function f2wSegD(pts,x,y){ let b=1e9; for(let i=0;i<pts.length-1;i++){ const a=pts[i], c=pts[i+1], dx=c[0]-a[0], dy=c[1]-a[1], l2=dx*dx+dy*dy||1, t=clamp(((x-a[0])*dx+(y-a[1])*dy)/l2,0,1), d=Math.hypot(a[0]+dx*t-x,a[1]+dy*t-y); if(d<b) b=d; } return b; }
// a cheap wobble for natural edges (no noise lookups)
const f2wWob=(x,y,a)=>(Math.sin(x*0.0061+y*0.0023)*0.55+Math.sin(y*0.0113-x*0.0041+1.7)*0.3+Math.sin(x*0.027+y*0.019)*0.15)*a;

// ---------- sounds of our own (wind gusts, ice creaks, chimes, bells, howls, the Shard's hum, steam), synthesized
function f2wSnd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted||!SFX.noise) return; v=v==null?1:v;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.4*v; out.connect(ac.destination);
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.35,dur/3)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(kind){
      case 'gust': nz(2.6,0.06,'bandpass',300,900,0.8); nz(2.2,0.03,'bandpass',1400,700,1.2,0.4); break;
      case 'creak': tn('sawtooth',70,48,0.7,0.025); nz(0.5,0.03,'bandpass',420,180,4,0.05); break;
      case 'crack': nz(0.18,0.09,'highpass',2400,900,0.8); tn('square',180,60,0.12,0.03,0.02); break;
      case 'chime': { const b=[1568,1760,2093,2349,2637]; for(let i=0;i<3;i++){ const f=b[(Math.random()*b.length)|0]; tn('sine',f,f*0.998,1.4,0.022,i*0.13+Math.random()*0.05); } break; }
      case 'bell': [392,494,587].forEach((f,i)=>tn('sine',f,f*0.996,2.4,0.05,i*0.02)); tn('sine',196,194,3.2,0.04); break;
      case 'howl': { const f=rand(380,460); tn('sine',f*0.7,f,0.9,0.03); tn('sine',f,f*0.8,1.4,0.03,0.85); break; }
      case 'hum': tn('sine',65,66,2.4,0.04); tn('sine',69.3,69.6,2.4,0.03); break;
      case 'steam': nz(0.9,0.04,'highpass',2200,4800,0.7); break;
      case 'bubble': for(let i=0;i<3;i++){ const f=rand(300,700); tn('sine',f,f*1.6,0.08,0.02,i*0.09); } break;
      case 'monkey': { const f=rand(900,1200); tn('square',f,f*1.3,0.08,0.012); tn('square',f*1.1,f*0.8,0.1,0.012,0.12); tn('square',f*1.2,f*1.5,0.08,0.01,0.26); break; }
      case 'thud': tn('sine',90,40,0.3,0.06); nz(0.25,0.04,'lowpass',600,200,1); break;
      case 'whoosh': nz(0.8,0.05,'bandpass',600,2400,1.2); break;
      case 'drip': tn('sine',1400,900,0.06,0.015); break;
      case 'woof': tn('sawtooth',240,150,0.12,0.03); tn('sawtooth',230,140,0.12,0.025,0.2); break;
    }
  }catch(e){}
}
// ---------- cached sprites (Storybook look: outlined; in Classic just painted)
const F2WS=new Map();
function f2wSpr(key,R,draw){ const k=(LOOK.sb?'s:':'c:')+key; let c=F2WS.get(k); if(c) return c; c=LOOK.sb?sbSprite('f2w_'+key,R,draw):spriteOf(R,draw); F2WS.set(k,c); return c; }
// a cached tall sprite drawn from a base point (w x h world px, base at bx,by inside it)
function f2wTall(key,w,h,bx,by,draw,ow){
  const k=(LOOK.sb?'s:':'c:')+key; let c=F2WS.get(k); if(c) return c;
  const sc=2, cv=mkCanvas(Math.ceil(w*sc),Math.ceil(h*sc)), g=cv.getContext('2d'); g.scale(sc,sc); g.translate(bx,by); g.lineCap='round'; g.lineJoin='round'; draw(g);
  cv.ox=bx; cv.oy=by; cv.w2=w; cv.h2=h;
  c=LOOK.sb?outlineSprite(cv,SBC.outline,ow||1.8,{force:true}):cv; c.ox=bx; c.oy=by; c.w2=w; c.h2=h; F2WS.set(k,c); return c;
}
function f2wPut(c,x,y,s){ s=s||1; ctx.drawImage(c,x-c.ox*s,y-c.oy*s,c.w2*s,c.h2*s); }
// cel helpers for the hand-drawn pieces
function f2wEll(g,x,y,rx,ry,col){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); }
function f2wRect(g,x,y,w,h,col,r){ g.fillStyle=col; if(r){ rrect(g,x,y,w,h,r); g.fill(); } else g.fillRect(x,y,w,h); }
function f2wShade(g,x,y,w,h,col,r){ const T=celTones(col); f2wRect(g,x,y,w,h,T[2],r); f2wRect(g,x,y,w-Math.max(1.5,w*0.18),h-Math.max(1,h*0.06),T[1],r); f2wRect(g,x+1,y+1,Math.max(1,w*0.22),h-2,T[0],r?Math.min(r,2):0); }
// a snow cap: lumpy white blobs along the top of a shape (x0..x1 at height y), lit from the top left
function f2wSnowCap(g,x0,x1,y,th,rng){
  const n=Math.max(2,Math.round((x1-x0)/9)); g.fillStyle='#c6d6ea'; g.beginPath(); for(let i=0;i<=n;i++){ const x=lerp(x0,x1,i/n), r=th*(0.75+(rng?rng():0.5)*0.5); g.moveTo(x+r,y+1); g.arc(x,y+1,r,0,TAU); } g.fill();
  g.fillStyle='#f6faff'; g.beginPath(); for(let i=0;i<=n;i++){ const x=lerp(x0,x1,i/n), r=th*0.72; g.moveTo(x+r-1,y-0.5); g.arc(x-1,y-0.5,r,0,TAU); } g.fill();
  g.fillStyle='#ffffff'; for(let i=0;i<n;i+=2){ const x=lerp(x0,x1,i/n); g.beginPath(); g.ellipse(x-th*0.3,y-th*0.35,th*0.35,th*0.2,0,0,TAU); g.fill(); }
}
// icicles hanging under an edge
function f2wIcicles(g,x0,x1,y,len,rng){ const n=Math.max(2,Math.round((x1-x0)/6)); for(let i=0;i<n;i++){ const x=lerp(x0+2,x1-2,i/(n-1||1)), L=len*(0.4+rng()*0.6); g.fillStyle='#a9daf4'; g.beginPath(); g.moveTo(x-1.8,y); g.lineTo(x+1.8,y); g.lineTo(x+0.2,y+L); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.8)'; g.fillRect(x-1.2,y,0.9,L*0.6); } }

// ================= 1. prop kinds (Storybook: cel tones lit from the top left, the engine adds the plum outline)
const F2WP={pine:['#22585a','#33786e','#5ea294'],taiga:['#183e42','#265a56','#447c70'],ice:['#5c9cd0','#8cc8ec','#d0f0ff'],snow:['#b8cce0','#eef4fb','#ffffff'],
  rock:['#6e7a8a','#94a0ae','#c4ccd6'],red:['#8a4a36','#b46a4e','#d8946e'],violet:['#5a3e9a','#8a6ad0','#c8b2f4'],black:['#241e30','#3a3248','#6a5c84'],
  wood:['#5a3e26','#7e5a38','#a8804e'],straw:['#a8803a','#d0a850','#ecd082'],bone:['#b8ae98','#e2dccc','#fbf8f0'],grass:['#8a7a4a','#b4a46a','#d8ca8e'],berry:'#d8323a'};
const f2wTones=p=>[p[2],p[1],p[0]];
function f2wBlob(g,R,rng,pal,flat){ const v=sbRockPts(R,rng,flat); celFill(g,(q,dx,dy)=>sbRoundPoly(q,v,dx,dy),pal[1],{r:R,tones:f2wTones(pal),hi:R*0.14,lo:R*0.24}); return v; }
// snow lying on a star tier: white lumps on the upper left half, a little shade under them
function f2wTierSnow(g,r,rng,k){
  const n=4+Math.floor(rng()*3);
  for(let i=0;i<n;i++){ const a=-Math.PI*0.95+i/(n-1)*Math.PI*1.05+(rng()-0.5)*0.3, d=r*(0.38+rng()*0.32), x=Math.cos(a)*d, y=Math.sin(a)*d, rr=r*(0.2+rng()*0.12)*k;
    f2wEll(g,x+1,y+1.4,rr,rr*0.78,'rgba(150,176,206,.9)'); f2wEll(g,x,y,rr,rr*0.78,F2WP.snow[1]); f2wEll(g,x-rr*0.3,y-rr*0.3,rr*0.45,rr*0.32,'#ffffff'); }
}
// a snow pine from above: three star tiers, each with snow on its lit side; v 2 is half buried in a drift
function f2wPineArt(g,R,rng,P,snowK,lean){
  const tiers=[[R*0.96,0.56,0],[R*0.7,0.55,1.5],[R*0.44,0.52,3]];
  tiers.forEach(([r,k,oy],L)=>{ const n=9+Math.floor(rng()*3)-L, rot=rng()*TAU, tones=[sbTone(P[2],L*0.05),sbTone(P[1],L*0.06),P[0]];
    celFill(g,(q,dx,dy)=>sbStar(q,n,r,r*k,rot,dx+(lean||0)*L,dy-oy),P[1],{r,tones,hi:r*0.12,lo:r*0.16});
    g.save(); g.translate((lean||0)*L,-oy); f2wTierSnow(g,r,rng,snowK); g.restore();
    if(L<2){ g.fillStyle='rgba(16,40,46,.2)'; g.beginPath(); g.arc(r*0.06,r*0.08-oy,tiers[L+1][0]*1.02,0,TAU); g.fill(); } });
  f2wEll(g,-1,-5,4.2*snowK,3.4*snowK,'#ffffff');
}
definePropKind('f_snowpine',{n:3,tall:true,R:44,col:{r:9},h:80,rot:false,make(seed,v){ const rng=mulberry32(seed), R=44; return spriteOf(R,g=>{
  if(v===2){ f2wEll(g,2,R*0.42,R*0.9,R*0.36,'rgba(150,176,206,.55)'); f2wEll(g,0,R*0.38,R*0.84,R*0.3,F2WP.snow[1]); }
  f2wPineArt(g,R,rng,F2WP.pine,v===1?1.3:1); }); }});
definePropKind('f_taigapine',{n:3,tall:true,R:52,col:{r:10},h:96,rot:false,make(seed,v){ const rng=mulberry32(seed), R=52; return spriteOf(R,g=>{ f2wPineArt(g,R,rng,F2WP.taiga,v===2?1.45:1.15,v===1?1.4:0); }); }});
definePropKind('f_icepine',{n:3,tall:true,R:40,col:{r:8},h:74,rot:false,make(seed,v){ const rng=mulberry32(seed), R=40; return spriteOf(R,g=>{
  const tiers=[[R*0.95,0.5,0],[R*0.68,0.5,1.5],[R*0.42,0.48,3]];
  tiers.forEach(([r,k,oy],L)=>{ const n=8+L, rot=rng()*TAU; celFill(g,(q,dx,dy)=>sbStar(q,n,r,r*k,rot,dx,dy-oy),F2WP.ice[1],{r,tones:[sbTone(F2WP.ice[2],0.1),sbTone(F2WP.ice[1],L*0.06),F2WP.ice[0]],hi:r*0.14,lo:r*0.18});
    g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=1.4; for(let i=0;i<n;i+=2){ const a=rot+i/n*TAU; g.beginPath(); g.moveTo(Math.cos(a)*r*0.2,Math.sin(a)*r*0.2-oy); g.lineTo(Math.cos(a)*r*0.8,Math.sin(a)*r*0.8-oy); g.stroke(); } });
  f2wEll(g,-2,-6,3,2.4,'#ffffff'); for(let i=0;i<6;i++){ const a=rng()*TAU, d=rng()*R*0.7; f2wEll(g,Math.cos(a)*d,Math.sin(a)*d,1.2,1.2,'rgba(255,255,255,.9)'); } }); }});
definePropKind('f_deadpine',{n:3,tall:true,R:34,col:{r:7},h:66,rot:false,make(seed,v){ const rng=mulberry32(seed), R=34; return spriteOf(R,g=>{
  // a bare grey snag from above: branches like a star of sticks, snow lying along them
  const n=7+Math.floor(rng()*3);
  for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.4, L=R*(0.55+rng()*0.4), x=Math.cos(a)*L, y=Math.sin(a)*L*0.9;
    g.strokeStyle=F2WP.wood[0]; g.lineWidth=4; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(x*0.5+Math.sin(a)*4,y*0.5-Math.cos(a)*4,x,y); g.stroke();
    g.strokeStyle='#8e8478'; g.lineWidth=2.2; g.stroke();
    if(Math.cos(a)+Math.sin(a)<0.6){ g.strokeStyle='#f6faff'; g.lineWidth=2.2; g.beginPath(); g.moveTo(x*0.3,y*0.3-1.5); g.lineTo(x*0.85,y*0.85-1.5); g.stroke(); } }
  celBall(g,0,0,5,'#8e8478',['#b8ae9e','#8e8478','#5e544a']); f2wEll(g,-1,-1.5,3.4,2.4,'#ffffff'); }); }});
definePropKind('f_snowrock',{n:3,R:16,col:{r:13,low:true},rot:false,make(seed,v){ const rng=mulberry32(seed), R=16; return spriteOf(R,g=>{
  f2wEll(g,1,R*0.45,R*1.05,R*0.4,'rgba(150,176,206,.55)');
  const pts=f2wBlob(g,R,rng,v===2?['#5e5470','#7a6e8e','#a89cc0']:F2WP.rock);
  // a big soft snow cap over the top two thirds
  g.save(); g.beginPath(); sbRoundPoly(g,pts,0,0); g.clip();
  g.fillStyle='#c6d6ea'; g.beginPath(); g.ellipse(-R*0.1,-R*0.35,R*1.1,R*0.85,0,0,TAU); g.fill();
  g.fillStyle=F2WP.snow[1]; g.beginPath(); g.ellipse(-R*0.16,-R*0.42,R*1.02,R*0.74,0,0,TAU); g.fill();
  g.fillStyle='#ffffff'; g.beginPath(); g.ellipse(-R*0.38,-R*0.6,R*0.4,R*0.22,-0.3,0,TAU); g.fill(); g.restore(); }); }});
definePropKind('f_redrock',{n:3,R:17,col:{r:13,low:true},rot:false,make(seed,v){ const rng=mulberry32(seed), R=17; return spriteOf(R,g=>{
  const pts=f2wBlob(g,R,rng,F2WP.red);
  g.save(); g.beginPath(); sbRoundPoly(g,pts,0,0); g.clip();
  for(let i=0;i<3;i++){ const y=-R*0.6+i*R*0.5+(rng()-0.5)*4; g.fillStyle=i?'rgba(246,250,255,.9)':'#ffffff'; g.beginPath(); g.ellipse(-2,y,R*1.2,2.2+rng()*1.6,-0.15,0,TAU); g.fill(); }
  g.restore(); }); }});
definePropKind('f_iceshard',{n:3,R:22,col:{r:12},rot:false,make(seed,v){ const rng=mulberry32(seed), R=22; return spriteOf(R,g=>{
  f2wEll(g,2,6,R*0.8,R*0.34,'rgba(70,110,170,.25)');
  // a cluster of ice spikes seen from above and a little from the front: tall points, lit left faces
  const n=4+v; for(let i=0;i<n;i++){ const x=(rng()-0.5)*R*1.1, h=R*(0.7+rng()*0.7), w=4+rng()*5, y=4+(rng()-0.5)*6;
    g.fillStyle=F2WP.ice[0]; g.beginPath(); g.moveTo(x-w,y); g.lineTo(x+rng()*2-1,y-h); g.lineTo(x+w,y); g.closePath(); g.fill();
    g.fillStyle=F2WP.ice[1]; g.beginPath(); g.moveTo(x-w,y); g.lineTo(x+rng()*2-1,y-h); g.lineTo(x+w*0.2,y); g.closePath(); g.fill();
    g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(x-w*0.6,y-1); g.lineTo(x-0.5,y-h+3); g.lineTo(x-w*0.25,y-1); g.closePath(); g.fill(); }
  f2wEll(g,0,6,R*0.6,3.4,F2WP.snow[1]); }); }});
definePropKind('f_violetice',{n:3,R:24,col:{r:14},rot:false,make(seed,v){ const rng=mulberry32(seed), R=24; return spriteOf(R,g=>{
  f2wEll(g,2,6,R*0.85,R*0.34,'rgba(40,20,70,.35)');
  const n=5+v; for(let i=0;i<n;i++){ const a=-Math.PI/2+(rng()-0.5)*1.6, L=R*(0.6+rng()*0.6), w=4+rng()*4, x0=(rng()-0.5)*R*0.6, y0=5;
    const tx=x0+Math.cos(a)*L*0.45, ty=y0+Math.sin(a)*L;
    g.fillStyle=F2WP.violet[0]; g.beginPath(); g.moveTo(x0-w,y0); g.lineTo(tx,ty); g.lineTo(x0+w,y0); g.closePath(); g.fill();
    g.fillStyle=F2WP.violet[1]; g.beginPath(); g.moveTo(x0-w,y0); g.lineTo(tx,ty); g.lineTo(x0,y0); g.closePath(); g.fill();
    g.fillStyle='rgba(240,228,255,.7)'; g.beginPath(); g.moveTo(x0-w*0.6,y0-1); g.lineTo(tx-0.5,ty+3); g.lineTo(x0-w*0.2,y0-1); g.closePath(); g.fill(); }
  f2wEll(g,-3,-R*0.3,2,2,'#f4eaff'); }); }});
definePropKind('f_dreadspire',{n:3,tall:true,R:38,col:{r:15},h:84,rot:false,make(seed,v){ const rng=mulberry32(seed), R=38; return spriteOf(R,g=>{
  // a black rock spire with violet ice in its cracks and snow on the lit facets
  const n=6+Math.floor(rng()*2), pts=[]; for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.3; pts.push([Math.cos(a)*R*(0.72+rng()*0.25),Math.sin(a)*R*(0.68+rng()*0.25)]); }
  const tip=[-R*0.14,-R*0.2];
  for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mid=Math.atan2((a[1]+b[1])/2,(a[0]+b[0])/2), lit=-(Math.cos(mid)+Math.sin(mid))/1.4; g.fillStyle=lit>0.3?F2WP.black[2]:lit>-0.3?F2WP.black[1]:F2WP.black[0]; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.lineTo(tip[0],tip[1]); g.closePath(); g.fill();
    if(lit>0.3){ g.fillStyle='rgba(246,250,255,.92)'; g.beginPath(); g.moveTo(lerp(a[0],tip[0],0.25),lerp(a[1],tip[1],0.25)); g.lineTo(lerp(b[0],tip[0],0.3),lerp(b[1],tip[1],0.3)); g.lineTo(lerp(a[0],tip[0],0.7),lerp(a[1],tip[1],0.7)); g.closePath(); g.fill(); }
    else if(rng()<0.6){ g.strokeStyle='rgba(176,140,240,.85)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(lerp(a[0],tip[0],0.15),lerp(a[1],tip[1],0.15)); g.lineTo(lerp((a[0]+b[0])/2,tip[0],0.5),lerp((a[1]+b[1])/2,tip[1],0.5)); g.stroke(); } }
  f2wEll(g,tip[0]-2,tip[1]-2,2.4,1.8,'#d8c8ff'); }); }});
definePropKind('f_snowbush',{n:3,R:15,rot:false,make(seed,v){ const rng=mulberry32(seed), R=15; return spriteOf(R,g=>{
  sbCanopy(g,R,rng,['#2c5a4c','#3e7a62','#64a080'],6,2);
  for(let i=0;i<6;i++){ const a=-Math.PI*0.9+rng()*Math.PI*1.1, d=R*(0.3+rng()*0.45), rr=R*(0.24+rng()*0.12); f2wEll(g,Math.cos(a)*d,Math.sin(a)*d,rr,rr*0.75,F2WP.snow[1]); f2wEll(g,Math.cos(a)*d-1,Math.sin(a)*d-1,rr*0.4,rr*0.3,'#fff'); }
  if(v!==1) for(let i=0;i<5;i++){ const a=rng()*TAU, d=rng()*R*0.7; celBall(g,Math.cos(a)*d,Math.sin(a)*d,1.8,F2WP.berry,['#ff7a7a',F2WP.berry,'#8a1a22']); } }); }});
definePropKind('f_haystack',{n:2,R:17,col:{r:14,low:true},rot:false,make(seed,v){ const rng=mulberry32(seed), R=17; return spriteOf(R,g=>{
  f2wEll(g,2,R*0.5,R,R*0.36,'rgba(120,130,160,.35)');
  celFill(g,(q,dx,dy)=>{ q.moveTo(-R+dx,R*0.4+dy); q.quadraticCurveTo(-R*0.9+dx,-R*0.9+dy,dx,-R+dy); q.quadraticCurveTo(R*0.9+dx,-R*0.9+dy,R+dx,R*0.4+dy); q.closePath(); },F2WP.straw[1],{r:R,tones:f2wTones(F2WP.straw)});
  g.strokeStyle='rgba(120,80,30,.5)'; g.lineWidth=1; for(let i=0;i<6;i++){ const x=-R*0.7+i*R*0.28; g.beginPath(); g.moveTo(x,R*0.35); g.quadraticCurveTo(x*0.6,-R*0.3,x*0.3,-R*0.7); g.stroke(); }
  // a snow cap with icicles round its rim
  g.fillStyle='#c6d6ea'; g.beginPath(); g.ellipse(0,-R*0.55,R*0.8,R*0.5,0,0,TAU); g.fill(); g.fillStyle=F2WP.snow[1]; g.beginPath(); g.ellipse(-1,-R*0.6,R*0.74,R*0.44,0,0,TAU); g.fill(); f2wEll(g,-R*0.3,-R*0.75,R*0.25,R*0.13,'#fff');
  f2wIcicles(g,-R*0.6,R*0.6,-R*0.2,6,rng); }); }});
definePropKind('f_fishrack',{n:2,R:22,col:{r:8,low:true},rot:false,make(seed,v){ const rng=mulberry32(seed), R=22; return spriteOf(R,g=>{
  f2wEll(g,3,8,18,4,'rgba(60,70,90,.3)');
  for(const sx of [-16,16]){ g.strokeStyle=F2WP.wood[0]; g.lineWidth=3.4; g.beginPath(); g.moveTo(sx-4,8); g.lineTo(sx,-18); g.lineTo(sx+4,8); g.stroke(); }
  g.strokeStyle=F2WP.wood[1]; g.lineWidth=2.6; g.beginPath(); g.moveTo(-17,-17); g.lineTo(17,-17); g.stroke();
  for(let i=0;i<5;i++){ const x=-12+i*6; g.strokeStyle='#5a4a3a'; g.lineWidth=0.8; g.beginPath(); g.moveTo(x,-17); g.lineTo(x,-13); g.stroke();
    celFill(g,(q,dx,dy)=>{ q.ellipse(x+dx,-6+dy,2.4,7,0,0,TAU); },i%2?'#9ab0c0':'#b4c4d0',{r:5}); g.fillStyle='#6a8090'; g.beginPath(); g.moveTo(x-2.4,1); g.lineTo(x,-1); g.lineTo(x+2.4,1); g.closePath(); g.fill(); f2wEll(g,x-0.6,-10,0.8,0.8,'#2a2a30'); }
  f2wSnowCap(g,-18,18,-18,2.2,rng); }); }});
definePropKind('f_cairn',{n:3,R:24,col:{r:9,low:true},rot:false,make(seed,v){ const rng=mulberry32(seed), R=24; return spriteOf(R,g=>{
  f2wEll(g,3,8,14,5,'rgba(70,60,50,.3)');
  // a stack of flat stones, a pole, and a string of prayer flags blowing east
  for(let i=0;i<4;i++){ const w=12-i*2.4, y=6-i*6; celFill(g,(q,dx,dy)=>q.ellipse(dx+(rng()-0.5)*2,y+dy,w,3.6,0,0,TAU),'#9a9488',{r:w}); }
  g.strokeStyle=F2WP.wood[0]; g.lineWidth=2.2; g.beginPath(); g.moveTo(0,-14); g.lineTo(1,-30); g.stroke();
  const cols=['#d83a32','#f0c030','#3a8ad8','#3aa860','#f4f0e6'];
  g.strokeStyle='rgba(80,60,40,.7)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(1,-30); g.quadraticCurveTo(10,-24,20,-14); g.stroke();
  for(let i=0;i<5;i++){ const k=(i+0.5)/5, x=lerp(1,20,k), y=lerp(-30,-14,k)+Math.sin(k*Math.PI)*-3; g.fillStyle=cols[(i+v)%5]; g.beginPath(); g.moveTo(x-2,y); g.lineTo(x+2.4,y+0.6); g.lineTo(x+1.6,y+5); g.lineTo(x-2.2,y+4.4); g.closePath(); g.fill(); }
  f2wEll(g,-1,-17,4,1.8,'#ffffff'); }); }});
definePropKind('f_mammothrib',{n:3,tall:true,R:50,col:{r:8},h:90,rot:false,make(seed,v){ const rng=mulberry32(seed), R=50; return spriteOf(R,g=>{
  // a pair of giant curved ribs (an arch of old bone) seen from above-front, snow on their backs
  f2wEll(g,0,R*0.55,R*0.85,R*0.22,'rgba(90,70,60,.3)');
  for(const s of [-1,1]){ g.strokeStyle=F2WP.bone[0]; g.lineWidth=9; g.beginPath(); g.moveTo(s*R*0.7,R*0.5); g.quadraticCurveTo(s*R*0.85,-R*0.4,s*R*0.08,-R*0.75); g.stroke();
    g.strokeStyle=F2WP.bone[1]; g.lineWidth=6; g.stroke(); g.strokeStyle=F2WP.bone[2]; g.lineWidth=2; g.beginPath(); g.moveTo(s*R*0.62,R*0.4); g.quadraticCurveTo(s*R*0.74,-R*0.35,s*R*0.06,-R*0.7); g.stroke();
    g.strokeStyle='#ffffff'; g.lineWidth=3; g.beginPath(); g.moveTo(s*R*0.78,-R*0.05); g.quadraticCurveTo(s*R*0.7,-R*0.5,s*R*0.3,-R*0.72); g.stroke(); }
  if(v===1){ g.strokeStyle=F2WP.bone[1]; g.lineWidth=5; g.beginPath(); g.moveTo(-R*0.35,R*0.5); g.quadraticCurveTo(-R*0.45,-R*0.1,-R*0.05,-R*0.4); g.stroke(); } }); }});
definePropKind('f_hornrock',{n:3,R:28,col:{r:20},rot:false,make(seed,v){ const rng=mulberry32(seed), R=28; return spriteOf(R,g=>{
  f2wEll(g,3,R*0.45,R*0.95,R*0.35,'rgba(70,40,30,.3)');
  f2wBlob(g,R*0.62,rng,F2WP.red);
  // a carved ram horn curling out of the rock
  g.strokeStyle=F2WP.red[0]; g.lineWidth=11; g.lineCap='round'; g.beginPath(); for(let a=0;a<4.6;a+=0.2){ const r=R*0.75-a*R*0.12, x=Math.cos(a+Math.PI*0.9)*r+R*0.05, y=Math.sin(a+Math.PI*0.9)*r*0.8-R*0.2; a?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
  g.strokeStyle=F2WP.red[1]; g.lineWidth=7; g.stroke(); g.strokeStyle='rgba(255,236,220,.55)'; g.lineWidth=1.4; g.stroke();
  f2wEll(g,-R*0.3,-R*0.42,R*0.3,R*0.14,'#ffffff'); }); }});
definePropKind('f_windrock',{n:3,R:26,col:{r:17},rot:false,make(seed,v){ const rng=mulberry32(seed), R=26; return spriteOf(R,g=>{
  f2wEll(g,3,R*0.4,R,R*0.32,'rgba(70,60,50,.3)');
  // a rock the wind carved into a breaking wave, curling east
  celFill(g,(q,dx,dy)=>{ q.moveTo(-R+dx,R*0.4+dy); q.quadraticCurveTo(-R*0.7+dx,-R*0.7+dy,R*0.2+dx,-R*0.8+dy); q.quadraticCurveTo(R*0.95+dx,-R*0.7+dy,R*0.7+dx,-R*0.2+dy); q.quadraticCurveTo(R*0.3+dx,-R*0.45+dy,R*0.2+dx,-R*0.05+dy); q.quadraticCurveTo(R*0.6+dx,R*0.2+dy,R*0.8+dx,R*0.4+dy); q.closePath(); },'#a89a82',{r:R,tones:['#d4c8b0','#a89a82','#76695a']});
  g.strokeStyle='rgba(90,76,60,.5)'; g.lineWidth=1.2; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(-R*0.7+i*6,R*0.3); g.quadraticCurveTo(-R*0.4+i*6,-R*0.4,R*0.1+i*4,-R*0.6+i*4); g.stroke(); }
  f2wEll(g,-R*0.2,-R*0.62,R*0.36,R*0.12,'#ffffff'); }); }});
definePropKind('f_tussock',{n:3,R:11,rot:false,make(seed,v){ const rng=mulberry32(seed), R=11; return spriteOf(R,g=>{
  for(let i=0;i<9;i++){ const a=-Math.PI/2+(rng()-0.5)*1.9, L=R*(0.6+rng()*0.5); g.strokeStyle=i%2?F2WP.grass[0]:F2WP.grass[1]; g.lineWidth=2; g.lineCap='round'; g.beginPath(); g.moveTo((rng()-0.5)*4,3); g.quadraticCurveTo(Math.cos(a)*L*0.5+3,Math.sin(a)*L*0.5,Math.cos(a)*L+4,Math.sin(a)*L); g.stroke(); }
  f2wEll(g,0,3,R*0.7,2.6,F2WP.snow[1]); }); }});
definePropKind('f_frostreed',{n:2,R:12,rot:false,make(seed,v){ const rng=mulberry32(seed), R=12; return spriteOf(R,g=>{
  for(let i=0;i<7;i++){ const x=(rng()-0.5)*R*1.2, h=R*(0.7+rng()*0.5); g.strokeStyle='#8a8a6a'; g.lineWidth=1.8; g.beginPath(); g.moveTo(x,4); g.lineTo(x+1,4-h); g.stroke(); g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=1; g.beginPath(); g.moveTo(x-0.6,4-h*0.4); g.lineTo(x+0.4,4-h); g.stroke(); if(i%3===0) f2wEll(g,x+1,4-h,1.6,3,'#a07a4a'); }
  f2wEll(g,0,4,R*0.6,2.2,'rgba(200,226,246,.9)'); }); }});
definePropKind('f_stump',{n:2,R:12,col:{r:9,low:true},rot:false,make(seed,v){ const rng=mulberry32(seed), R=12; return spriteOf(R,g=>{
  f2wEll(g,2,5,10,4,'rgba(60,60,80,.3)'); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy+2,9,7,0,0,TAU); },F2WP.wood[1],{r:9,tones:f2wTones(F2WP.wood)});
  f2wEll(g,0,-1,8,5,F2WP.snow[1]); f2wEll(g,-2,-2,4,2,'#fff'); }); }});
definePropKind('f_geyser',{n:2,R:22,col:{r:14},rot:false,make(seed,v){ const rng=mulberry32(seed), R=22; return spriteOf(R,g=>{
  // a frozen geyser: a pale ice mound with the spout frozen mid-burst
  f2wEll(g,2,R*0.45,R,R*0.36,'rgba(70,110,150,.3)');
  celFill(g,(q,dx,dy)=>q.ellipse(dx,R*0.25+dy,R*0.9,R*0.45,0,0,TAU),'#d8ecf6',{r:R,tones:['#ffffff','#d8ecf6','#9cc4dc']});
  for(let i=0;i<5;i++){ const x=(i-2)*4, h=R*(0.8+rng()*0.5); celFill(g,(q,dx,dy)=>{ q.moveTo(x-4+dx,R*0.2+dy); q.quadraticCurveTo(x-6+dx,-h*0.5+dy,x+dx,-h+dy); q.quadraticCurveTo(x+6+dx,-h*0.5+dy,x+4+dx,R*0.2+dy); q.closePath(); },F2WP.ice[1],{r:6,tones:f2wTones(F2WP.ice)}); }
  f2wEll(g,-3,-R*0.7,2.4,2,'#fff'); }); }});
definePropKind('f_isleflower',{n:3,R:9,rot:false,make(seed,v){ const rng=mulberry32(seed), R=9; return spriteOf(R,g=>{
  celBall(g,0,1,R*0.7,'#6a9a7a',['#8cbc9a','#6a9a7a','#4a7a5a']);
  const cols=[['#ffffff','#f0d060'],['#ffe9a0','#e8a030'],['#e8dcff','#b08ae0']][v]; for(let i=0;i<5;i++){ const a=rng()*TAU, d=rng()*R*0.5; celBall(g,Math.cos(a)*d,Math.sin(a)*d-1,2.2,cols[0]); f2wEll(g,Math.cos(a)*d,Math.sin(a)*d-1,0.8,0.8,cols[1]); } }); }});
definePropKind('f_lanternpost',{n:1,tall:true,R:28,col:{r:5},h:58,rot:false,make(){ return spriteOf(28,g=>f2wLanternArt(g,false)); }});
function f2wLanternArt(g,lit){
  f2wEll(g,3,2,7,3,'rgba(40,40,60,.35)'); f2wEll(g,0,0,5,2.4,'#5a4a30');
  f2wShade(g,-2,-30,4,30,F2WP.wood[1]); f2wRect(g,-2,-31,12,3,F2WP.wood[0],1);
  // the lantern hangs off the arm on a little chain
  g.strokeStyle='#3a3030'; g.lineWidth=1; g.beginPath(); g.moveTo(8,-29); g.lineTo(8,-25); g.stroke();
  f2wRect(g,4,-25,8,10,'#3a3a44',2); f2wRect(g,5.4,-23.6,5.2,7,lit?'#ffe4a0':'#7a8ea0',1); f2wRect(g,3,-26,10,2,'#2a2a30',1);
  f2wEll(g,0,-31,3.4,1.6,'#ffffff'); f2wEll(g,8,-26.5,3.2,1.4,'#ffffff');
}

// ================= 2. critters: snow hares, foxes, ptarmigan, seals, mountain goats, snow owls (gulls come from the coast)
function f2wCritSh(x,y,rx){ ctx.fillStyle='rgba(60,70,110,.22)'; ctx.beginPath(); ctx.ellipse(x,y,rx,rx*0.36,0,0,TAU); ctx.fill(); }
defineCritter('f_hare',{r:8,draw(c){ const x=c.x, y=c.y, mv=c.moving, hop=mv?Math.abs(Math.sin(G.time*13+c.x))*4:0, fl=Math.cos(c.face||0)<0?-1:1;
  f2wCritSh(x,y+5,8); ctx.save(); ctx.translate(x,y-hop); ctx.scale(fl,1); const ol=LOOK.sb?SBC.outline:'#7a8090';
  ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(-1,-2,8.4,6.4,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(5.5,-6,4.6,4,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(4,-13,1.9,5.4,-0.2,0,TAU); ctx.ellipse(7,-12.6,1.9,5.2,0.25,0,TAU); ctx.fill();
  ctx.fillStyle='#f4f6fa'; ctx.beginPath(); ctx.ellipse(-1,-2,7.2,5.2,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(5.5,-6,3.6,3,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(4,-13,1,4.4,-0.2,0,TAU); ctx.ellipse(7,-12.6,1,4.2,0.25,0,TAU); ctx.fill();
  ctx.fillStyle='#d8dfea'; ctx.beginPath(); ctx.ellipse(-2,0.5,5,2.4,0,0,TAU); ctx.fill(); ctx.fillStyle='#2a2a34'; ctx.fillRect(4.4,-14.8,1.2,1.6); ctx.fillRect(7.4,-14.4,1.2,1.6); ctx.beginPath(); ctx.arc(7,-6.6,0.9,0,TAU); ctx.fill(); ctx.fillStyle='#f08ab4'; ctx.beginPath(); ctx.arc(9,-5.4,0.7,0,TAU); ctx.fill();
  ctx.restore(); }});
defineCritter('f_fox',{r:10,draw(c){ const x=c.x, y=c.y, t=G.time*12+c.x, k=c.moving?Math.sin(t):0, fl=Math.cos(c.face||0)<0?-1:1, arctic=(Math.floor(c.x/97)%3)===0;
  const fur=arctic?'#eef2f6':'#d86a2e', furD=arctic?'#c8d2de':'#a84a1e', ol=LOOK.sb?SBC.outline:'#3a2a20';
  f2wCritSh(x,y+6,11); ctx.save(); ctx.translate(x,y); ctx.scale(fl,1);
  ctx.fillStyle=ol; for(const lx of [-6,-2,3,6]) ctx.fillRect(lx-1.2,0,2.4,6+(lx%2?k:-k)*0.8);
  ctx.beginPath(); ctx.ellipse(0,-3,9.6,5.4,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-11,-5,7.4,3.8,-0.5+k*0.1,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(8.6,-7,4.6,4,0,0,TAU); ctx.fill();
  ctx.fillStyle=furD; for(const lx of [-6,-2,3,6]) ctx.fillRect(lx-0.5,1,1,4.6+(lx%2?k:-k)*0.8);
  ctx.fillStyle=fur; ctx.beginPath(); ctx.ellipse(0,-3,8.4,4.3,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-11,-5,6.3,2.8,-0.5+k*0.1,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(8.6,-7,3.6,3,0,0,TAU); ctx.fill();
  ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.ellipse(-15,-7,2.6,1.8,-0.5,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(10.5,-5.6,2,1.4,0,0,TAU); ctx.fill();
  ctx.fillStyle=fur; ctx.beginPath(); ctx.moveTo(6.8,-9); ctx.lineTo(7.6,-13.5); ctx.lineTo(9.6,-9.4); ctx.fill(); ctx.beginPath(); ctx.moveTo(9.4,-9.4); ctx.lineTo(11.4,-13.2); ctx.lineTo(12,-8.6); ctx.fill();
  ctx.fillStyle='#2a2028'; ctx.beginPath(); ctx.arc(10,-7.6,0.9,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(12.6,-6.2,0.9,0,TAU); ctx.fill(); ctx.restore(); }});
defineCritter('f_ptarmigan',{r:7,draw(c){ const x=c.x, y=c.y, hop=c.moving?Math.abs(Math.sin(G.time*16+c.x))*2:0, fl=Math.cos(c.face||0)<0?-1:1;
  f2wCritSh(x,y+4,6); ctx.save(); ctx.translate(x,y-hop); ctx.scale(fl,1); const ol=LOOK.sb?SBC.outline:'#6a6a7a';
  ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(0,-3,6.6,5.2,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(4.6,-7.4,3.4,0,TAU); ctx.fill();
  ctx.fillStyle='#f6f6f2'; ctx.beginPath(); ctx.ellipse(0,-3,5.6,4.2,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(4.6,-7.4,2.5,0,TAU); ctx.fill();
  ctx.fillStyle='#d8d4c8'; ctx.beginPath(); ctx.ellipse(-2,-2,3.4,2,0,0,TAU); ctx.fill(); ctx.fillStyle='#d83a32'; ctx.fillRect(4.4,-9.6,2.4,1); ctx.fillStyle='#222'; ctx.fillRect(5.4,-8.2,1,1); ctx.fillStyle='#3a3030'; ctx.beginPath(); ctx.moveTo(6.8,-7.6); ctx.lineTo(8.6,-7); ctx.lineTo(6.8,-6.4); ctx.fill();
  ctx.restore(); }});
defineCritter('f_seal',{r:12,draw(c){ const x=c.x, y=c.y, t=G.time+c.x*0.01, br=Math.sin(t*1.6)*0.8, fl=Math.cos(c.face||0)<0?-1:1, ol=LOOK.sb?SBC.outline:'#3a3a48';
  f2wCritSh(x,y+6,14); ctx.save(); ctx.translate(x,y); ctx.scale(fl,1);
  ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(0,-2,14+br,7.6,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11,-6,5.6,0,TAU); ctx.fill();
  ctx.fillStyle='#9aa4b4'; ctx.beginPath(); ctx.ellipse(0,-2,12.8+br,6.4,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11,-6,4.6,0,TAU); ctx.fill();
  ctx.fillStyle='#bcc6d4'; ctx.beginPath(); ctx.ellipse(-2,-4.4,8,2.6,0,0,TAU); ctx.fill(); ctx.fillStyle='#6a7484'; for(const [a,b] of [[-5,-1],[2,-3],[-1,2]]){ ctx.beginPath(); ctx.arc(a,b,0.8,0,TAU); ctx.fill(); }
  ctx.fillStyle='#22222a'; ctx.beginPath(); ctx.arc(13,-7.4,1,0,TAU); ctx.fill(); ctx.fillStyle='#4a4a54'; ctx.beginPath(); ctx.arc(15.6,-5,1.4,0,TAU); ctx.fill(); ctx.restore(); }});
defineCritter('f_goat',{r:11,draw(c){ const x=c.x, y=c.y, t=G.time*11+c.x, k=c.moving?Math.sin(t)*1.2:0, fl=Math.cos(c.face||0)<0?-1:1, ol=LOOK.sb?SBC.outline:'#4a4a50';
  f2wCritSh(x,y+7,11); ctx.save(); ctx.translate(x,y); ctx.scale(fl,1);
  ctx.fillStyle='#3a3238'; for(const lx of [-6,-2,3,7]) ctx.fillRect(lx-1.1,1,2.2,7+(lx%2?k:-k)*0.5);
  ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(0,-3,10.6,7,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(10,-8,4.6,4.4,0,0,TAU); ctx.fill();
  ctx.fillStyle='#f2f0ea'; ctx.beginPath(); ctx.ellipse(0,-3,9.4,5.8,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(10,-8,3.6,3.4,0,0,TAU); ctx.fill();
  ctx.fillStyle='#d8d2c6'; ctx.beginPath(); ctx.ellipse(-2,0,6,2.6,0,0,TAU); ctx.fill(); ctx.fillStyle='#f2f0ea'; ctx.beginPath(); ctx.moveTo(10,-5); ctx.lineTo(11.6,1); ctx.lineTo(13,-5); ctx.fill();
  ctx.strokeStyle='#3a3238'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(9,-11); ctx.quadraticCurveTo(6,-16,9.6,-17); ctx.moveTo(11,-11); ctx.quadraticCurveTo(9,-16,12.4,-16.4); ctx.stroke();
  ctx.fillStyle='#22222a'; ctx.beginPath(); ctx.arc(11.6,-8.6,0.9,0,TAU); ctx.fill(); ctx.restore(); }});
defineCritter('f_owl',{r:8,draw(c){ const x=c.x, y=c.y, t=G.time+c.x*0.03, bl=Math.sin(t*0.9)>0.96, ol=LOOK.sb?SBC.outline:'#5a5a64';
  f2wCritSh(x,y+5,7); ctx.save(); ctx.translate(x,y);
  ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(0,-6,7.4,8.4,0,0,TAU); ctx.fill();
  ctx.fillStyle='#f6f6f2'; ctx.beginPath(); ctx.ellipse(0,-6,6.2,7.2,0,0,TAU); ctx.fill();
  ctx.fillStyle='#3a3a44'; for(const [a,b] of [[-3,-3],[2,-1],[-1,1],[3,-4],[-4,0]]){ ctx.fillRect(a,b,1.6,1); }
  ctx.fillStyle='#e8c030'; ctx.beginPath(); ctx.arc(-2.4,-9,1.8,0,TAU); ctx.arc(2.4,-9,1.8,0,TAU); ctx.fill(); ctx.fillStyle='#1a1a20'; if(bl){ ctx.fillRect(-4,-9.2,3.2,0.8); ctx.fillRect(0.8,-9.2,3.2,0.8); } else { ctx.beginPath(); ctx.arc(-2.4,-9,0.9,0,TAU); ctx.arc(2.4,-9,0.9,0,TAU); ctx.fill(); }
  ctx.fillStyle='#3a3030'; ctx.beginPath(); ctx.moveTo(-0.8,-7.6); ctx.lineTo(0,-6); ctx.lineTo(0.8,-7.6); ctx.fill(); ctx.restore(); }});

// ================= 3. biomes 20 to 29 (bible 3.1); snowy grounds kept clean and close together (STYLE.md), each region
// with its own tint so the borders read: pink-white Whitepass, cream Vale, ice-blue lake, gold Windscour, glassy blue
// Rimeholm, red Stonehorn, grey-blue shore, violet-black Mount Dread, green-grey taiga, lilac cloud
const F2WW={sea:{shallow:'#5fb2bc',deep:'#1d5a76',lip:'#e8f8fa'},river:{shallow:'#86cfe2',deep:'#3a86b2',lip:'#f2fbfe'},hole:{shallow:'#4a86ad',deep:'#1d4870',lip:'#e8f6fc'}};
const f2wSpark=(g,x,y,r)=>{ g.fillStyle='rgba(255,255,255,.95)'; g.fillRect(x-r,y-0.5,r*2,1); g.fillRect(x-0.5,y-r,1,r*2); };
// a little snow mound: its shade side (lower right, in the region's shadow tone) under a lit white top
const f2wDrift=(g,rng,x,y,col)=>{ const w=8+rng()*15, h=w*(0.3+rng()*0.12); g.fillStyle=col; g.beginPath(); g.ellipse(x+w*0.14,y+h*0.42,w,h*0.78,0,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(x-w*0.06,y-h*0.06,w*0.9,h*0.68,0,0,TAU); g.fill(); };
const f2wTrack=(g,x,y,a,col)=>{ g.fillStyle=col; for(let i=0;i<3;i++){ const px=x+Math.cos(a)*i*9, py=y+Math.sin(a)*i*9; g.beginPath(); g.ellipse(px-Math.sin(a)*2.4,py+Math.cos(a)*2.4,1.5,1.1,0,0,TAU); g.ellipse(px+Math.sin(a)*2.4,py-Math.cos(a)*2.4,1.5,1.1,0,0,TAU); g.fill(); } };
const F2W_NOEV={}; for(const k in EVD) F2W_NOEV[k]=false;
// the cloud sea under the isles: soft lilac and white, deeper where it is far from any edge
function f2wCloudRGB(x,y){ const n=fbm(x*0.0016+3,y*0.0016-9,2), m=fbm(x*0.006,y*0.006,1); return mixRGB([214,208,244],[250,248,255],clamp(0.55+n*0.9+m*0.25,0,1)); }
defineBiome(20,{name:'the Whitepass',level:13,col:['#f1e5ec','#f6edf2','#e8dae3'],road:'#dccab0',roadEdge:'rgba(150,118,104,.75)',water:F2WW.sea,shore:'#d6dce4',
  music:'frost',ambient:{snow:0.6,wind:0.4,birds:true,rain:0},critters:['f_hare','f_fox'],footprints:'snow',chests:3,like:5,
  rgb(c,s){ if(s.water&&s.hot) return mixRGB([120,222,214],[64,170,184],smooth(s.depth)); if(s.hot&&!s.water) return mixRGB(c,[206,214,196],0.35); return c; },
  props(rng,x,y,s,grove){ if(s.hot) return null; const r=rng(); if(grove>0.18&&r<0.16) return {k:'f_snowpine',v:Math.floor(rng()*3),s:0.85+rng()*0.35}; if(r<0.018) return {k:'f_snowpine',v:Math.floor(rng()*3)}; if(r<0.032) return {k:'f_snowrock',s:0.7+rng()*0.7}; if(r<0.044) return {k:'f_snowbush'}; if(r<0.047) return {k:'f_deadpine'}; if(x<1500&&r<0.06) return {k:'f_iceshard',v:Math.floor(rng()*3)}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.07) f2wDrift(g,rng,x,y,'rgba(196,170,196,.55)'); else if(r<0.1) f2wSpark(g,x,y,1.4+rng()*1.4); else if(r<0.104) f2wTrack(g,x,y,rng()*TAU,'rgba(150,128,150,.45)'); else if(r<0.112) sbPebble(g,x,y,1.4+rng()*1.4,'#9a94a4'); }});
defineBiome(21,{name:'Hearthold Vale',level:13,col:['#eeeadf','#f4f1e8','#e4dfd2'],road:'#d6c09c',roadEdge:'rgba(140,110,84,.78)',water:F2WW.river,shore:'#dfe2e4',
  music:'frost',ambient:{snow:0.4,wind:0.2,birds:true,rain:0},critters:['f_hare','f_ptarmigan'],footprints:'snow',chests:3,like:5,
  props(rng,x,y,s,grove){ const r=rng(); if(r<0.008) return {k:'f_haystack',v:Math.floor(rng()*2)}; if(grove>0.3&&r<0.08) return {k:'f_snowpine',v:Math.floor(rng()*3)}; if(r<0.016) return {k:'f_snowbush'}; if(r<0.02) return {k:'f_snowrock',s:0.6+rng()*0.5}; if(r<0.022) return {k:'f_stump'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.06) f2wDrift(g,rng,x,y,'rgba(176,170,150,.5)'); else if(r<0.085) f2wSpark(g,x,y,1.3+rng()*1.2); else if(r<0.09) f2wTrack(g,x,y,rng()*TAU,'rgba(140,130,110,.4)');
    else if(r<0.094&&dist(x,y,6800,49000)<1700){ g.strokeStyle='rgba(150,150,170,.5)'; g.lineWidth=1.2; const a=rng()*TAU, L=30+rng()*30; for(const o of [-3,3]){ g.beginPath(); g.moveTo(x-Math.cos(a)*L-Math.sin(a)*o,y-Math.sin(a)*L+Math.cos(a)*o); g.lineTo(x+Math.cos(a)*L-Math.sin(a)*o,y+Math.sin(a)*L+Math.cos(a)*o); g.stroke(); } } }});
defineBiome(22,{name:'the Glimmerfrost',level:14,col:['#c8e6f3','#d6eef8','#bbdcec'],road:'#d8dce6',roadEdge:'rgba(110,140,170,.7)',water:F2WW.hole,shore:'#e4f0f6',
  music:'frost',ambient:{snow:0.3,mist:0.3,wind:0.3,birds:false,rain:0,creak:1},critters:false,footprints:'snow',chests:2,like:5,
  props(rng,x,y,s,grove){ const r=rng(); if(s.ice>0.2||s.elev) return null; if(r<0.05) return {k:'f_icepine',v:Math.floor(rng()*3),s:0.8+rng()*0.3}; if(r<0.09) return {k:'f_frostreed'}; return null; },
  decor(g,rng,x,y,s,r){
    if(s.ice>0.5){ if(r<0.05){ // a white crack across the ice
        g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=1.1; let px=x, py=y, a=rng()*TAU; g.beginPath(); g.moveTo(px,py); for(let k=0;k<4;k++){ a+=(rng()-0.5)*1.4; px+=Math.cos(a)*(8+rng()*14); py+=Math.sin(a)*(6+rng()*10); g.lineTo(px,py); } g.stroke();
        g.strokeStyle='rgba(120,170,210,.4)'; g.lineWidth=0.8; g.stroke(); }
      else if(r<0.056){ // a fish frozen under the surface
        g.save(); g.translate(x,y); g.rotate(rng()*TAU); g.fillStyle='rgba(70,110,150,.35)'; g.beginPath(); g.ellipse(0,0,7,2.6,0,0,TAU); g.fill(); g.beginPath(); g.moveTo(-6,0); g.lineTo(-10,-3); g.lineTo(-10,3); g.closePath(); g.fill(); g.restore(); }
      else if(r<0.08) f2wSpark(g,x,y,1.2+rng()*1.6);
      else if(r<0.1){ g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x,y,6+rng()*10,1.6,0.2,0,TAU); g.fill(); } }
    else if(r<0.08) f2wDrift(g,rng,x,y,'rgba(150,186,210,.5)'); else if(r<0.1) f2wSpark(g,x,y,1.3); }});
defineBiome(23,{name:'the Windscour',level:15,col:['#d4cca8','#ddd6b6','#c8c09a'],road:'#ece2c4',roadEdge:'rgba(130,112,80,.8)',water:F2WW.river,shore:'#e2dccb',
  music:'f_wind',ambient:{snow:0.2,wind:1,birds:true,rain:0,gust:1},critters:['f_ptarmigan'],footprints:'snow',chests:3,like:5,
  props(rng,x,y,s,grove){ const r=rng(); if(r<0.05) return {k:'f_tussock',v:Math.floor(rng()*3),s:0.8+rng()*0.5}; if(r<0.056) return {k:'f_cairn',v:Math.floor(rng()*3)}; if(r<0.064) return {k:'f_windrock',s:0.7+rng()*0.5}; if(r<0.07) return {k:'f_snowrock',s:0.6+rng()*0.4}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.26) sbTuft(g,x,y,'rgba(150,132,80,.6)',0.8+rng()*0.5); else if(r<0.3){ g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(x,y,5+rng()*9,2,0,0,TAU); g.fill(); } else if(r<0.32){ g.strokeStyle='rgba(255,255,255,.6)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-12,y); g.quadraticCurveTo(x,y-4,x+14,y-1); g.stroke(); } else if(r<0.335) sbPebble(g,x,y,1.4+rng(),'#a49a82'); }});
defineBiome(24,{name:'the Rimeholm Cliffs',level:14,col:['#e3edf5','#ecf3f9','#d7e3ee'],road:'#cfc6b8',roadEdge:'rgba(110,120,140,.75)',water:F2WW.sea,shore:'#cfd8e0',
  music:'frost',ambient:{snow:0.7,wind:0.5,mist:0.2,birds:true,rain:0,gulls:0.3},critters:['c_gull','f_hare'],footprints:'snow',chests:3,like:5,
  props(rng,x,y,s,grove){ if(s.ice>0.4) return null; const r=rng(); if(grove>0.2&&r<0.07) return {k:'f_icepine',v:Math.floor(rng()*3)}; if(r<0.012) return {k:'f_icepine',v:Math.floor(rng()*3)}; if(r<0.026) return {k:'f_snowrock',s:0.6+rng()*0.6}; if(r<0.036) return {k:'f_snowbush'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.06){ g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(x,y,4+rng()*8,1.5,-0.3,0,TAU); g.fill(); } else if(r<0.1) f2wSpark(g,x,y,1.2+rng()*1.4); else if(r<0.14) f2wDrift(g,rng,x,y,'rgba(150,176,206,.5)'); }});
defineBiome(25,{name:'the Stonehorn Badlands',level:16,col:['#c38a6c','#cc967a','#b67e62'],road:'#e8d4b8',roadEdge:'rgba(110,64,44,.8)',water:F2WW.river,shore:'#d8b8a0',
  music:'crags',ambient:{snow:0.4,wind:0.6,birds:false,rain:0},critters:['f_goat'],footprints:'snow',chests:3,like:3,
  props(rng,x,y,s,grove){ const r=rng(); if(r<0.022) return {k:'f_redrock',s:0.7+rng()*0.6}; if(r<0.028) return {k:'f_hornrock',v:Math.floor(rng()*3)}; if(r<0.033) return {k:'f_mammothrib',v:Math.floor(rng()*3)}; if(r<0.037) return {k:'f_geyser',v:Math.floor(rng()*2)}; if(r<0.042) return {k:'f_snowbush',v:1}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.09){ g.fillStyle='rgba(250,248,252,.9)'; g.beginPath(); g.ellipse(x,y,10+rng()*22,2+rng()*2.6,-0.22,0,TAU); g.fill(); } else if(r<0.12) sbPebble(g,x,y,1.6+rng()*1.6,'#9a5a40'); else if(r<0.14){ g.strokeStyle='rgba(120,70,50,.5)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-8,y); g.lineTo(x-1,y+3); g.lineTo(x+7,y-1); g.stroke(); } }});
defineBiome(26,{name:'the Shiversea Floes',level:15,col:['#dde8ee','#e7f0f4','#d0dde5'],road:'#d4d0c8',roadEdge:'rgba(110,126,140,.75)',water:F2WW.sea,shore:'#cdd5dc',
  music:'frost',ambient:{snow:0.5,mist:0.5,wind:0.6,birds:false,rain:0,gulls:0.15},critters:['f_seal'],footprints:'snow',chests:2,like:5,
  props(rng,x,y,s,grove){ if(s.ice>0.5) return null; const r=rng(); if(r<0.016) return {k:'f_iceshard',v:Math.floor(rng()*3)}; if(r<0.03) return {k:'f_snowrock',s:0.6+rng()*0.6}; if(r<0.045) return {k:'f_frostreed'}; if(grove>0.32&&r<0.07) return {k:'f_icepine',v:Math.floor(rng()*3)}; return null; },
  decor(g,rng,x,y,s,r){ if(s.ice>0.5){ if(r<0.04){ g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=1; g.beginPath(); g.moveTo(x-6,y-2); g.lineTo(x+1,y+1); g.lineTo(x+7,y-1); g.stroke(); } else if(r<0.07) f2wSpark(g,x,y,1.3); return; }
    if(r<0.1) sbPebble(g,x,y,1.4+rng()*1.8,rng()<0.5?'#a4acb6':'#c4ccd4'); else if(r<0.13) f2wSpark(g,x,y,1.2+rng()); else if(r<0.16) f2wDrift(g,rng,x,y,'rgba(140,160,180,.45)'); }});
defineBiome(27,{name:'Mount Dread',level:17,col:['#5e5472','#665b7b','#564c69'],road:'#8e84a4',roadEdge:'rgba(30,22,44,.85)',water:F2WW.hole,shore:'#6e6484',
  music:'f_dread',ambient:{snow:1,wind:0.8,night:0.12,birds:false,rain:0,thunder:true,hum:1,violet:1},critters:false,footprints:'snow',chests:2,events:F2W_NOEV,
  props(rng,x,y,s,grove){ const r=rng(), hi=(s.elev|0)>=4; if(hi&&r<0.1+Math.max(0,grove)*0.12) return {k:'f_dreadspire',v:Math.floor(rng()*3),s:0.8+rng()*0.6}; if(hi&&r<0.16) return {k:'f_violetice',v:Math.floor(rng()*3),s:0.8+rng()*0.5}; if(r<0.012) return {k:'f_dreadspire',v:Math.floor(rng()*3),s:0.7+rng()*0.4}; if(r<0.026) return {k:'f_violetice',v:Math.floor(rng()*3)}; if(r<0.036) return {k:'f_snowrock',v:2,s:0.6+rng()*0.5}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.08){ g.strokeStyle='rgba(176,140,240,.7)'; g.lineWidth=1.2+rng(); let px=x,py=y,a=rng()*TAU; g.beginPath(); g.moveTo(px,py); for(let k=0;k<3;k++){ a+=(rng()-0.5)*1.2; px+=Math.cos(a)*(6+rng()*10); py+=Math.sin(a)*(5+rng()*8); g.lineTo(px,py); } g.stroke(); }
    else if(r<0.16){ g.fillStyle='rgba(240,240,250,.82)'; g.beginPath(); g.ellipse(x,y,6+rng()*14,1.8+rng()*1.6,-0.3,0,TAU); g.fill(); } else if(r<0.18) sbPebble(g,x,y,1.4+rng()*1.4,'#3a3248'); }});
defineBiome(28,{name:'the Pinewhisper',level:14,col:['#dbe4e1','#e4ebe9','#d0dad6'],road:'#cdb898',roadEdge:'rgba(100,84,70,.8)',water:F2WW.river,shore:'#d6dedc',
  music:'frost',ambient:{snow:0.5,wind:0.2,night:0.05,birds:true,rain:0,howl:1},critters:['f_fox','f_owl','f_hare'],footprints:'snow',chests:3,like:5,
  props(rng,x,y,s,grove){ const r=rng(); if(grove>-0.15&&r<0.24+Math.max(0,grove)*0.2) return {k:'f_taigapine',v:Math.floor(rng()*3),s:0.85+rng()*0.4}; if(r<0.05) return {k:'f_taigapine',v:Math.floor(rng()*3)}; if(r<0.07) return {k:'f_snowbush'}; if(r<0.078) return {k:'f_deadpine'}; if(r<0.086) return {k:'f_stump'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.08){ g.fillStyle='rgba(110,140,150,.22)'; g.beginPath(); g.ellipse(x,y,8+rng()*14,4+rng()*6,0,0,TAU); g.fill(); } else if(r<0.12){ g.strokeStyle='rgba(60,90,80,.45)'; g.lineWidth=1; g.beginPath(); g.moveTo(x,y); g.lineTo(x+3,y-2); g.stroke(); } else if(r<0.14) f2wSpark(g,x,y,1.2); }});
defineBiome(29,{name:'the Cloudsea',level:15,col:['#eae6f6','#f2f0fa','#dfdaf0'],road:'#f4ecd8',roadEdge:'rgba(170,140,90,.8)',water:F2WW.river,shore:'#e8e4f2',
  music:'f_wind',ambient:{snow:0.1,wind:1,birds:true,rain:0,gust:0.8,chime:1},critters:false,footprints:null,chests:1,events:F2W_NOEV,
  rgb(c,s,x,y){ if(s.void) return f2wCloudRGB(x,y); return c; },
  props(rng,x,y,s,grove){ if(s.void) return null; const r=rng(); if(r<0.05) return {k:'f_isleflower',v:Math.floor(rng()*3)}; if(r<0.06) return {k:'f_snowrock',s:0.5+rng()*0.3}; return null; },
  decor(g,rng,x,y,s,r){ if(s.void||(s.face&1&&f2wVoidAt(x,y))){ if(r<0.035){ const rx=16+rng()*30; g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x,y,rx,rx*0.45,0,0,TAU); g.ellipse(x+rx*0.5,y-rx*0.15,rx*0.6,rx*0.35,0,0,TAU); g.fill(); g.fillStyle='rgba(190,180,230,.35)'; g.beginPath(); g.ellipse(x+3,y+rx*0.2,rx*0.9,rx*0.2,0,0,TAU); g.fill(); } return; }
    if(r<0.05) sbPebble(g,x,y,1.4+rng(),'#f4f2fa'); else if(r<0.07){ g.fillStyle='rgba(232,192,96,.8)'; g.beginPath(); g.arc(x,y,0.9,0,TAU); g.fill(); } else if(r<0.2) sbTuft(g,x,y,'rgba(110,150,120,.5)',0.7); }});
const F2W_BIOMES=[20,21,22,23,24,25,26,27,28,29];

// ================= 4. terrain: the shapes of Frostreach (bible 3.2 to 3.5), regions, ice, deep snow, the fall into the clouds
const F2WG={
  // the land: everything outside is the Shiversea (shore 60, shelf 170, noise 110)
  land:[[-200,51200],[-200,48200],[500,47800],[900,47000],[1100,46200],[1300,45300],[1700,44400],[2400,43300],[3200,42400],[4000,41500],[4600,40700],[4900,39800],[14200,39800],[14200,51200]],
  // the Glimmerfrost: a lake of ice (land with o.ice), with black open-water holes
  lake:{x:5200,y:45900,rx:1900,ry:1500},
  holes:[{x:4300,y:45400,r:120},{x:5000,y:46600,r:150},{x:6000,y:46200,r:110},{x:3900,y:46700,r:130}],
  // the Glacier Mouth moat (Water Stride walks it) and the island inside it
  moat:{x:5600,y:44470,r:380,inner:180},
  // the Floe Field: shallow sea in this box (stride and skim work), the floes are slippery ice isles
  floeBox:[700,41800,2600,43400],
  floes:[{x:2250,y:43050,r:120},{x:1950,y:42800,r:140},{x:1600,y:42600,r:220},{x:2100,y:42100,r:140},{x:1200,y:43150,r:160},{x:900,y:42200,r:130}],
  // the gap round Juniper's floe is deep (only the Grapple Tail crosses it)
  junDeep:[2100,42100,300],
  // Nils's goat stack off the Rimeholm quay, and the shallow strip to it
  stack:{x:380,y:47450,r:110}, stackLane:[440,47360,820,47540],
  // the Rimeholm quay below the terrace: glassy ice with two holes
  quay:[860,46380,1312,47460], quayHoles:[{x:1120,y:46760,r:30},{x:1180,y:47120,r:34}],
  // the Steamwell (a hot spring that heals at its edge) and the rock in it (a jump away from the edge)
  steam:{x:3800,y:49400,r:160}, steamRock:{x:3898,y:49408,r:30},
  // Hask's Pond in the Pinewhisper
  hask:{x:11800,y:50200,r:260},
  // the Mount Dread massif and its notch for the Shoulder Ledge, the Dreadmoor, the Crown
  massif:[[5600,40000],[9200,40000],[9200,43800],[8900,43900],[5600,43900]],
  notch:[[8070,43120],[8730,43120],[8760,43990],[8040,43990]],
  shoulder:[[8100,43180],[8700,43180],[8730,43800],[8070,43800]],
  dreadmoor:[6200,43800,9400,44700],
  plaza:{x:7300,y:44300,r:430},
  crown:{x:7300,y:41250,r:560},
  tongue:[[5000,43900],[6200,43900],[6000,44260],[5200,44260]],
  // the Windscour plateau (cut back in the north-west so the Dreadmoor keeps the Wind Road vent)
  windscour:[[9000,44300],[11000,44300],[11000,47600],[9500,47600],[9200,47600],[8600,47600],[8600,44950],[8780,44760],[8960,44700]],
  // Hearthold (the round wall, r 600) and its gates
  town:{x:6800,y:49000,r:600},
  // Rimeholm on its terrace, the bluff north of it
  terrace:[1300,46300,2700,47700],
  bluff:[[1200,45250],[2950,45250],[3150,45600],[3000,46000],[1300,46000]],
  // the sky isles (bible 3.4; isle 1 nudged 50 px north-east so the grapple post on isle 2 is in reach from its edge)
  isles:[{id:1,x:11450,y:46850,r:260,lvl:3},{id:2,x:11950,y:46350,r:240,lvl:4},{id:3,x:12650,y:46150,r:420,lvl:5},{id:4,x:13250,y:47250,r:220,lvl:4},{id:5,x:12150,y:47900,r:200,lvl:3}]
};
for(const k of ['massif','windscour','bluff','tongue','shoulder']) F2WG[k+'P']=f2wPoly(F2WG[k]);
// ---------- the fall into the clouds: the Howling Gap and the Cloudsea (lvl 0 cells only; plateau tops are solid)
function f2wVoidAt(x,y){
  if(x<9150||y<43450||y>48350) return false;
  // the Howling Gap between the Stonehorn mesas and the Windscour
  if(y<44460){ if(x<9400&&y>43790) return false; return true; }
  // the Cloudsea east of the Windscour, down to the Pinewhisper's cliff edge
  if(x>10960+f2wWob(y,x,30)&&y<48000+f2wWob(x,y,70)) return true;
  // a cove in the Pinewhisper's cliff, so Sky Isle 5 (12150,47900) floats over cloud on every side
  if(y<48340&&x>11740&&x<12560){ const dx=x-12150, dy=(y-48000)*1.15, R=330+f2wWob(y*1.7,x*1.3,34); if(dx*dx+dy*dy<R*R) return true; }
  return false;
}
const f2wVoid=(x,y)=>f2wVoidAt(x,y)&&elevLvl(x,y)===0;
// ---------- the regions: plateau tops by their level (so a cliff top is always that region), the rest by the seeds
function f2wLakeD(x,y){ const L=F2WG.lake, ex=(x-L.x)/L.rx, ey=(y-L.y)/L.ry, e=Math.sqrt(ex*ex+ey*ey); return (e-1)*1560+f2wWob(x,y,46); }
function f2wSet(o,b,soft,d){ if(soft&&d!=null){ const k=clamp(-d/40,-1,1); if(k>0){ o.b2=o.b===b?o.b2:o.b; o.b=b; o.t=0.5+0.5*k; } else if(k>-1){ o.b2=b; o.t=0.5-0.5*k; } return; } o.b=b; o.b2=b; o.t=1; }
function f2wExtra(x,y,o){
  o.void=0; o.hot=0;
  const lv=elevLvl(x,y);
  // regions on the high ground
  if(lv>0){
    const hb=f2wHighB(x,y,lv); if(hb>=0){ f2wSet(o,hb); if(hb===22) o.ice=1; }
  }else{
    if(f2wVoidAt(x,y)){ o.void=1; o.b=29; o.b2=29; o.t=1; o.water=0; o.shore=0; o.road=0; o.bridge=0; o.sea=0; o.deep=0; o.seaD=0; o.depth=0; return; }
    if(y<43900&&x>5560&&x<9250) f2wSet(o,27);
    // the Glimmerfrost (its open holes are ponds, the Whitewater leaves from its south shore)
    const L=F2WG.lake;
    if(x>L.x-L.rx-120&&x<L.x+L.rx+120&&y>L.y-L.ry-120&&y<L.y+L.ry+120){ const d=f2wLakeD(x,y); if(d<40){ f2wSet(o,22,true,d); if(!o.water&&d<0) o.ice=clamp(-d/80,0,1); } }
  }
  // the sea: the Floe Field is shallow and pale, Juniper's floe sits in a deep dark ring
  if(o.water&&o.sea){
    const F=F2WG.floeBox;
    if(x>F[0]&&x<F[2]&&y>F[1]&&y<F[3]){ const J=F2WG.junDeep, jd=dist(x,y,J[0],J[1]); if(jd<J[2]){ o.deep=1; o.seaD=Math.max(o.seaD,0.75); } else { o.deep=0; o.seaD=Math.min(o.seaD,0.16+0.1*clamp((jd-J[2])/200,0,1)); } }
    else if(x>F2WG.stackLane[0]&&x<F2WG.stackLane[2]&&y>F2WG.stackLane[1]&&y<F2WG.stackLane[3]){ o.deep=0; o.seaD=Math.min(o.seaD,0.14); }
    if(y<44600) o.b=o.b2=26;
  }
  // slippery floes, the glazed quay, the glacier tongue
  if(!o.water){
    if(x<2600&&y>41800&&y<43400&&x>600){ for(const f of F2WG.floes){ const d=dist(x,y,f.x,f.y); if(d<f.r+30){ o.ice=Math.max(o.ice,clamp((f.r+20-d)/30,0,1)); o.b=o.b2=26; o.t=1; break; } } }
    const Q=F2WG.quay; if(lv===0&&x>Q[0]&&x<Q[2]&&y>Q[1]&&y<Q[3]) o.ice=Math.max(o.ice,clamp(Math.min(x-Q[0],y-Q[1],Q[3]-y)/40,0,1));
    if(lv===3&&x>4900&&x<6300&&y>43850&&y<44300) o.ice=1;
  }
  // the Steamwell is hot water (heals at its edge); its banks never freeze
  const SW=F2WG.steam; if(Math.abs(x-SW.x)<SW.r+90&&Math.abs(y-SW.y)<SW.r+90){ const d=dist(x,y,SW.x,SW.y); if(d<SW.r+60) o.hot=1; }
  // deep snow: drifts on the far Whitepass, on the Dreadmoor, along the foot of Mount Dread (roads are cleared)
  if(!o.water&&!o.ice&&!o.hot){
    let s=0;
    if(x<1500&&y>49620) s=clamp((1500-x)/360,0,1)*0.95;
    else if(lv===1&&x>6150&&x<9450&&y>43900&&y<44760){ const pd=dist(x,y,F2WG.plaza.x,F2WG.plaza.y); s=0.75*clamp((pd-F2WG.plaza.r)/120,0,1); }
    else if(lv===0&&((y>43880&&y<44150&&x>4700&&x<6250)||(x>5250&&x<5620&&y<43900&&y>40500))) s=0.7;
    if(s>0){ const rd=o.roadD; if(rd<70) s*=clamp((rd-40)/30,0,1); if(s>0) o.snow=s*(0.85+0.15*Math.sin(x*0.013+y*0.009)); }
  }
}
// the region of a plateau top (a cliff top is always one region; -1: keep the seeds' answer)
function f2wHighB(x,y,lv){
  if(lv===3&&x>4900&&x<6300&&y>43850&&y<44300) return 26;                                   // the glacier tongue
  if(y<44800&&x>=5500&&x<=9450&&x<=9150+(y>43750?300:0)&&(lv>=3||(lv===1&&y>43750&&x>6100))) return 27;   // the massif, the Shoulder, the Crown, the Dreadmoor
  if(y<43750&&x>9150) return 25;                                                             // the Stonehorn base, mesas, horn rocks
  if(x>10900&&y>45300&&y<48400&&lv>=3) return 29;                                            // the Sky Isles
  if(x>8500&&x<11100&&y>44250&&y<48000) return 23;                                           // the Windscour and its shelves
  if(x<3300&&y>45150&&y<47800) return 24;                                                    // Rimeholm's terrace, tower, chapel, the bluff
  if(x<1600&&y>48000) return 20;                                                             // the west cliffs (the Warm Cave)
  if(lv===1&&f2wLakeD(x,y)<0) return 22;                                                     // the pressure ridges
  if(x>12700&&y>48000) return 28;                                                            // Mumble's Hollow
  if(y>48500&&x<3400) return 20;                                                             // the Whitepass ridge
  if(x>4800&&x<9000&&y>47000) return 21;                                                     // the Hearth's dais, Snowgob Gulch, the quarry mounds
  if(x<3000&&y<43500) return 26;                                                             // the Shipwreck's deck
  return -1;
}
// walkers never go over the edge into the clouds (Ash falls in only from a jump or a glide, see the landing hooks)
function f2wBlock(x,y){
  if(x>9150&&y>43450&&y<48350&&f2wVoid(x,y)) return true;
  return false;
}
// calm sea for Water Stride: the Floe Field (but not the ring round Juniper's floe) and the strip to Nils's stack
function f2wCalm(x,y){
  const F=F2WG.floeBox; if(x>F[0]&&x<F[2]&&y>F[1]&&y<F[3]){ const J=F2WG.junDeep; return dist(x,y,J[0],J[1])>J[2]; }
  const L=F2WG.stackLane; return x>L[0]&&x<L[2]&&y>L[1]&&y<L[3];
}
const f2wJunDeep=(x,y)=>{ const J=F2WG.junDeep; return dist(x,y,J[0],J[1])<J[2]&&dist(x,y,2100,42100)>132; };
// ---------- the roads (bible 3.5) plus the Quarry Road, Rimeholm's lane, the trail into Hask's Rest
const F2WROADS=[
  // R1 the White Road: the High Pass to Hearthold's West Gate; then from the North Gate up to the Dreadgate
  [[2600,50500],[3200,50050],[4200,49650],[5300,49300],[6180,49000]],
  [[6800,48380],[6800,47800],[7050,46800],[7150,45900],[7250,45100],[7300,44700],[7300,44250]],
  // R2 the Rim Road: from the White Road west of the Whitewater up to Rimeholm (and its lane along the terrace)
  [[4200,49650],[3500,48700],[2900,47700],[2700,47250],[2500,47190],[2160,47120],[1820,47060],[1600,47060]],
  // R3 the Wind Road: Hearthold's East Gate up onto the Windscour
  [[7420,49000],[8400,48700],[9300,48300],[9950,48000],[10050,47650],[10200,46900],[10900,46700]],
  // R4 the Taiga Trail: to Hask's Rest and Mumble's Hollow
  [[8400,48700],[9600,49250],[10600,49600],[11400,49600],[12500,49200],[13300,48500]],
  // R5 the Glimmer Track: off the White Road to Glimmer Point
  [[7150,45900],[6900,45200],[6600,44750]],
  // R6 the Gap Track across the Windscour to its north rim
  [[10200,46900],[10100,45800],[10000,44600]],
  // R7 the Stonehorn trail (on the far side of the Gap)
  [[10150,43350],[11000,43000],[11800,42700],[12200,42550]],
  // the old Quarry Road: from the White Road north of town west along the Glimmerfrost's south shore to the Rim Road
  [[6800,48020],[6300,47760],[5900,47630],[5300,47560],[4600,47700],[3800,48160],[3380,48500]]
];
const F2WSEEDS=[
  [1500,50300,20],[3200,50500,20],[800,49200,20],[3000,49500,20],
  [5600,50300,21],[7300,50500,21],[8600,49500,21],[4900,48700,21],[6800,49000,21],[7800,46000,21],[7700,47300,21],[8000,45200,21],
  [5200,45900,22],
  [9800,45300,23],[10300,46600,23],
  [1900,47000,24],[2400,46000,24],[1200,47900,24],[2900,47300,24],
  [10500,41000,25],[12500,41500,25],[13400,43000,25],[10200,43100,25],
  [3600,43600,26],[2800,44800,26],[4600,42200,26],[4200,44600,26],[2200,45400,26],
  [7300,42000,27],[6200,43000,27],[8400,41000,27],
  [10400,49800,28],[12500,49500,28],[13400,50600,28],[10000,48300,28],[11600,48400,28],[12400,50700,28]
];

// ================= 5. standing things of the north: drawn sorted with the figures (so Ash walks behind the Great
// Hearth or a gate tower), each body painted once into a cached outlined sprite, only the live parts per frame
function f2wObj(k,x,y,o){
  o=Object.assign({k,x,y},o||{}); const D=F2WK[k]||{};
  o.R=o.R||D.R||60; o.base=o.base!=null?o.base:y+(D.by||0);
  if(D.col&&o.col!==false){ const c=typeof D.col==='function'?D.col(o):D.col; for(const q of [].concat(c)) o.cols=(o.cols||[]).concat([addCol(Object.assign({},q,q.t==='r'?{x0:x+q.x0,y0:y+q.y0,x1:x+q.x1,y1:y+q.y1}:{x:x+(q.dx||0),y:y+(q.dy||0)}))]); }
  if(D.light) for(const L of [].concat(D.light(o))){ LIGHTS.push(L); (o.lights=o.lights||[]).push(L); }
  F2WD.objs.push(o); const key=Math.floor(x/F2WD.bs)+'|'+Math.floor(y/F2WD.bs); let b=F2WD.bk.get(key); if(!b) F2WD.bk.set(key,b=[]); b.push(o);
  return o;
}
function f2wObjsInView(fn){
  const s=F2WD.bs, x0=Math.floor((cam.x-300)/s), x1=Math.floor((cam.x+W/zoom+300)/s), y0=Math.floor((cam.y-200)/s), y1=Math.floor((cam.y+H/zoom+700)/s);
  for(let i=x0;i<=x1;i++) for(let j=y0;j<=y1;j++){ const b=F2WD.bk.get(i+'|'+j); if(b) for(const o of b) fn(o); }
}
const F2WC={stone:'#b4b0b4',stoneD:'#8e8a92',roofR:'#a8463a',roofB:'#46668a',wood:'#8e6a40',woodD:'#5e4428',ice:'#a9daf4',iceD:'#6aa4d4',vio:'#a88ae0',vioD:'#6a4aa8',gold:'#e0b048',black:'#2c2638',snow:'#f4f8fc'};
// the snow on the Hearth's roof slides off once it burns blue; the Hearthold houses do too (see f2wSync)
const F2WT={lit:false,gate:false,ylva:false,hush:false,crown:false,rime:0};
const F2WK={
  // a stretch of Hearthold's round wall: drawn as a band of stone (the side that faces the camera) with a snowy top
  twall:{R:120,by:0,col:false,draw(o,t){ const C=F2WG.town, R=C.r, h=50, th=26, a0=o.a0, a1=o.a1, am=(a0+a1)/2, south=Math.sin(am)>0;
      const rf=south?R+th/2:R-th/2, rb=south?R-th/2:R+th/2, P=(a,r,dz)=>[C.x+Math.cos(a)*r,C.y+Math.sin(a)*r-(dz||0)];
      const f0=P(a0,rf), f1=P(a1,rf), b0=P(a0,rb,h), b1=P(a1,rb,h), t0=P(a0,rf,h), t1=P(a1,rf,h);
      const ol=LOOK.sb?SBC.outline:'#3a3036';
      ctx.save(); ctx.lineJoin='round';
      // the face
      ctx.fillStyle=ol; ctx.beginPath(); ctx.moveTo(f0[0],f0[1]+1.5); ctx.lineTo(f1[0],f1[1]+1.5); ctx.lineTo(t1[0],t1[1]-1.5); ctx.lineTo(t0[0],t0[1]-1.5); ctx.closePath(); ctx.fill();
      const lit=clamp(0.5-Math.cos(am)*0.35,0,1), fc=mixRGB(hexRGB('#8a8690'),hexRGB('#c2bec4'),lit);
      ctx.fillStyle=`rgb(${fc.map(Math.round)})`; ctx.beginPath(); ctx.moveTo(f0[0],f0[1]); ctx.lineTo(f1[0],f1[1]); ctx.lineTo(t1[0],t1[1]); ctx.lineTo(t0[0],t0[1]); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(60,50,70,.35)'; ctx.lineWidth=1;
      for(let r=1;r<4;r++){ const k=r/4; ctx.beginPath(); ctx.moveTo(lerp(f0[0],t0[0],k),lerp(f0[1],t0[1],k)); ctx.lineTo(lerp(f1[0],t1[0],k),lerp(f1[1],t1[1],k)); ctx.stroke(); }
      for(let i=1;i<5;i++){ const k=i/5+(o.i%2?0.08:-0.04), x=lerp(f0[0],f1[0],k), y=lerp(f0[1],f1[1],k); ctx.beginPath(); ctx.moveTo(x,y-((i%2)?0:h*0.25)); ctx.lineTo(x,y-h*((i%2)?0.25:0.5)); ctx.moveTo(x+3,y-h*0.5); ctx.lineTo(x+3,y-h*0.75); ctx.stroke(); }
      ctx.fillStyle='rgba(40,30,60,.22)'; ctx.beginPath(); ctx.moveTo(f0[0],f0[1]); ctx.lineTo(f1[0],f1[1]); ctx.lineTo(lerp(f1[0],t1[0],0.25),lerp(f1[1],t1[1],0.25)); ctx.lineTo(lerp(f0[0],t0[0],0.25),lerp(f0[1],t0[1],0.25)); ctx.closePath(); ctx.fill();
      // the top: a snowy walk with merlons along the front edge
      ctx.fillStyle=ol; ctx.beginPath(); ctx.moveTo(t0[0],t0[1]); ctx.lineTo(t1[0],t1[1]); ctx.lineTo(b1[0],b1[1]-2); ctx.lineTo(b0[0],b0[1]-2); ctx.closePath(); ctx.fill();
      ctx.fillStyle=F2WT.lit&&o.inT?'#d8d4d8':'#eef4fa'; ctx.beginPath(); ctx.moveTo(t0[0],t0[1]-1); ctx.lineTo(t1[0],t1[1]-1); ctx.lineTo(b1[0],b1[1]-1); ctx.lineTo(b0[0],b0[1]-1); ctx.closePath(); ctx.fill();
      for(let i=0;i<3;i++){ const k=(i+0.5)/3, x=lerp(t0[0],t1[0],k), y=lerp(t0[1],t1[1],k); ctx.fillStyle=ol; ctx.fillRect(x-6.5,y-12,13,13); ctx.fillStyle=`rgb(${fc.map(Math.round)})`; ctx.fillRect(x-5.2,y-10.6,10.4,10.4); ctx.fillStyle='#f6faff'; ctx.fillRect(x-5.2,y-12.4,10.4,3.4); }
      ctx.restore(); }},
  tower:{R:110,by:6,col:{t:'c',r:30},
    draw(o,t){ f2wPut(f2wTall('tower'+(o.v||0),100,190,50,180,g=>{ const r=30;
      f2wEll(g,4,6,r+8,10,'rgba(40,40,70,.28)');
      celFill(g,(q,dx,dy)=>{ q.moveTo(-r+dx,dy); q.lineTo(-r+dx,-100+dy); q.lineTo(r+dx,-100+dy); q.lineTo(r+dx,dy); q.ellipse(dx,dy,r,9,0,0,Math.PI); q.closePath(); },F2WC.stone,{r});
      g.strokeStyle='rgba(60,50,70,.35)'; g.lineWidth=1; for(let y=-90;y<0;y+=14){ g.beginPath(); g.moveTo(-r,y); g.quadraticCurveTo(0,y+7,r,y); g.stroke(); }
      f2wRect(g,-6,-70,12,18,'#2a2438',6); f2wRect(g,-4,-68,8,14,'#ffd88a',4);
      g.fillStyle=o.v===1?F2WC.roofB:F2WC.roofR; g.beginPath(); g.moveTo(-r-8,-98); g.lineTo(0,-158); g.lineTo(r+8,-98); g.quadraticCurveTo(0,-90,-r-8,-98); g.fill();
      g.fillStyle=sbTone(o.v===1?F2WC.roofB:F2WC.roofR,0.25); g.beginPath(); g.moveTo(-r-8,-98); g.lineTo(0,-158); g.lineTo(-6,-96); g.closePath(); g.fill();
      g.fillStyle=F2WC.snow; g.beginPath(); g.moveTo(-r-6,-99); g.lineTo(-10,-140); g.lineTo(-2,-150); g.lineTo(2,-118); g.quadraticCurveTo(-16,-104,-r-6,-99); g.fill();
      g.strokeStyle='#5a4428'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-158); g.lineTo(0,-176); g.stroke(); }),o.x,o.y);
      // a pennant on the roof, flapping
      const ph=t*5+o.x; ctx.fillStyle=o.v===1?'#3a6aaa':'#e8b030'; ctx.beginPath(); ctx.moveTo(o.x,o.y-176); for(let i=0;i<=5;i++) ctx.lineTo(o.x+i*4.4,o.y-176+Math.sin(ph-i)*1.8+i*0.5); ctx.lineTo(o.x+22,o.y-169+Math.sin(ph-5)*1.8); for(let i=5;i>=0;i--) ctx.lineTo(o.x+i*4.4,o.y-169+Math.sin(ph-i)*1.8+i*0.2); ctx.closePath(); ctx.fill();
      if(isNight()) glowAt(o.x,o.y-62,22,'255,200,120',0.45); }},
  // the West and East gates: an arch of stone with its doors swung open
  archgate:{R:110,by:4,col:false,
    draw(o,t){ f2wPut(f2wTall('arch'+(o.v||0),150,130,75,120,g=>{
      for(const s of [-1,1]){ f2wShade(g,s*56-10,-92,20,94,F2WC.stone); f2wRect(g,s*56-12,-96,24,6,F2WC.stoneD,2); }
      g.strokeStyle=F2WC.stoneD; g.lineWidth=12; g.beginPath(); g.arc(0,-92,56,Math.PI,TAU); g.stroke(); g.strokeStyle=F2WC.stone; g.lineWidth=8; g.stroke();
      g.fillStyle=F2WC.snow; g.beginPath(); g.ellipse(0,-150,40,6,0,0,TAU); g.fill(); for(const s of [-1,1]) f2wEll(g,s*56,-98,13,4,F2WC.snow);
      // the two doors swung open against the arch's sides
      for(const s of [-1,1]){ g.fillStyle=F2WC.woodD; g.beginPath(); g.moveTo(s*44,-4); g.lineTo(s*44,-78); g.lineTo(s*30,-84); g.lineTo(s*30,2); g.closePath(); g.fill(); g.fillStyle=o.v===1?'#3a5a8a':'#8a2a2a'; g.beginPath(); g.moveTo(s*43,-6); g.lineTo(s*43,-76); g.lineTo(s*32,-81); g.lineTo(s*32,0); g.closePath(); g.fill(); g.fillStyle='#d8b04a'; g.fillRect(s*37-1.5,-44,3,3); }
      g.fillStyle='#e8c060'; g.font=`900 9px ${UIF}`; g.textAlign='center'; g.fillText('HEARTHOLD',0,-136); }),o.x,o.y); }},
  // the North Gate: frozen solid until f_northgate, then open (its doors swing outward, a puddle of ice water)
  ngate:{R:110,by:4,col:false,
    draw(o,t){ const open=F2WT.gate;
      f2wPut(f2wTall('ngate'+(open?1:0),150,140,75,130,g=>{
        for(const s of [-1,1]){ f2wShade(g,s*56-10,-92,20,94,F2WC.stone); f2wRect(g,s*56-12,-96,24,6,F2WC.stoneD,2); }
        g.strokeStyle=F2WC.stoneD; g.lineWidth=12; g.beginPath(); g.arc(0,-92,56,Math.PI,TAU); g.stroke(); g.strokeStyle=F2WC.stone; g.lineWidth=8; g.stroke();
        if(open){ for(const s of [-1,1]){ g.fillStyle=F2WC.woodD; g.beginPath(); g.moveTo(s*44,-4); g.lineTo(s*44,-78); g.lineTo(s*28,-70); g.lineTo(s*28,6); g.closePath(); g.fill(); g.fillStyle='#5a3a24'; g.beginPath(); g.moveTo(s*42,-6); g.lineTo(s*42,-75); g.lineTo(s*30,-68); g.lineTo(s*30,3); g.closePath(); g.fill(); }
          f2wEll(g,0,6,40,8,'rgba(150,200,240,.55)'); }
        else{ g.fillStyle=F2WC.woodD; g.fillRect(-44,-84,88,86); for(let x=-40;x<44;x+=11){ g.fillStyle=(x/11)%2?'#6a4a2c':'#5a3e24'; g.fillRect(x,-82,10,82); }
          // a thick coat of purple-blue moth-frost over the doors, icicles off the arch
          celFill(g,(q,dx,dy)=>{ q.moveTo(-50+dx,4+dy); q.lineTo(-48+dx,-80+dy); q.quadraticCurveTo(-30+dx,-110+dy,0+dx,-104+dy); q.quadraticCurveTo(34+dx,-112+dy,50+dx,-78+dy); q.lineTo(52+dx,4+dy); q.closePath(); },'#b6c8f0',{r:50,tones:['#eef2ff','#b6c8f0','#7a86c8']});
          g.globalAlpha=0.55; g.strokeStyle='#ffffff'; g.lineWidth=2.4; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(-36+i*17,-90); g.lineTo(-28+i*17,-10); g.stroke(); } g.globalAlpha=1;
          f2wIcicles(g,-50,50,-92,16,mulberry32(77)); }
        g.fillStyle=F2WC.snow; g.beginPath(); g.ellipse(0,-150,40,6,0,0,TAU); g.fill(); }),o.x,o.y);
      if(!open){ const k=0.5+0.5*Math.sin(t*2); glowAt(o.x,o.y-50,40,'190,170,255',0.08+0.06*k); if(F2WD.gateHeat>0) glowAt(o.x,o.y-50,50,'255,200,140',0.3*F2WD.gateHeat); } }},
  // the Great Hearth: a stone fireplace as big as a house, open on four sides, on its dais
  hearth:{R:170,by:34,col:[{t:'r',x0:-56,y0:-24,x1:56,y1:34}],light:o=>({x:o.x,y:o.y-30,r:420,i:0.95,fire:true,hearth:true}),
    draw(o,t){ const lit=F2WT.lit;
      // the back half (pillars behind the fire), the fire, then the front pillars and the roof
      f2wPut(f2wTall('hearthB',200,200,100,190,g=>{
        f2wEll(g,0,34,92,20,'rgba(40,30,60,.3)');
        celFill(g,(q,dx,dy)=>{ q.rect(-70+dx,-6+dy,140,40); },'#9a9498',{r:60});
        g.fillStyle='#3a2a2a'; g.beginPath(); g.ellipse(0,10,52,18,0,0,TAU); g.fill(); g.fillStyle='#5a3a2a'; g.beginPath(); g.ellipse(0,8,44,13,0,0,TAU); g.fill();
        for(const s of [-1,1]) f2wShade(g,s*58-12,-120,24,124,'#a8a2a6'); }),o.x,o.y);
      // the fire: a sad little orange flicker, or a roaring column of blue and gold
      const fx=o.x, fy=o.y+8;
      if(!lit){ const f=0.6+0.4*Math.sin(t*9)+0.2*Math.sin(t*23); ctx.fillStyle='rgba(255,140,40,.85)'; ctx.beginPath(); ctx.ellipse(fx,fy-4,6*f,9*f,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,230,140,.9)'; ctx.beginPath(); ctx.ellipse(fx,fy-2,3*f,5*f,0,0,TAU); ctx.fill(); glowAt(fx,fy-8,40,'255,150,60',0.35*f); if(Math.random()<0.08) emit(fx+rand(-3,3),fy-8,1,{kind:'fire',ang:-Math.PI/2,spread:0.3,smin:10,smax:30,lmin:.3,lmax:.6,zmin:1,zmax:2.4}); }
      else{ for(let i=0;i<6;i++){ const ph=(t*1.6+i/6)%1, w=34*(1-ph*0.7), y=fy-ph*200, sw=Math.sin(t*3+i)*8*ph; ctx.fillStyle=i%2?`rgba(120,190,255,${0.55*(1-ph)})`:`rgba(255,200,90,${0.5*(1-ph)})`; ctx.beginPath(); ctx.ellipse(fx+sw,y,w,22*(1-ph*0.5),0,0,TAU); ctx.fill(); }
        ctx.fillStyle='rgba(200,235,255,.9)'; ctx.beginPath(); ctx.ellipse(fx,fy-14,18,26,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,236,170,.95)'; ctx.beginPath(); ctx.ellipse(fx,fy-8,10,14,0,0,TAU); ctx.fill();
        ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(fx,fy-60,150,'120,180,255',0.32+0.05*Math.sin(t*4)); glowAt(fx,fy-20,70,'255,210,120',0.4); ctx.restore();
        if(Math.random()<0.7) emit(fx+rand(-16,16),fy-20,1,{kind:Math.random()<0.5?'bfire':'fire',ang:-Math.PI/2,spread:0.35,smin:80,smax:220,lmin:.5,lmax:1.1,zmin:3,zmax:7,grow:6,drag:0.6}); }
      f2wPut(f2wTall('hearthF'+(lit?1:0),220,240,110,200,g=>{
        for(const s of [-1,1]) f2wShade(g,s*66-14,-124,28,150,'#b4aeb2');
        celFill(g,(q,dx,dy)=>{ q.moveTo(-86+dx,-118+dy); q.lineTo(86+dx,-118+dy); q.lineTo(70+dx,-150+dy); q.lineTo(-70+dx,-150+dy); q.closePath(); },'#8e888c',{r:70});
        celFill(g,(q,dx,dy)=>{ q.moveTo(-40+dx,-150+dy); q.lineTo(40+dx,-150+dy); q.lineTo(28+dx,-190+dy); q.lineTo(-28+dx,-190+dy); q.closePath(); },'#a49ea2',{r:30});
        g.strokeStyle='rgba(60,50,70,.4)'; g.lineWidth=1; for(let y=-110;y<20;y+=16) for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*80,y); g.lineTo(s*52,y); g.stroke(); }
        // carved on the lintel: a horned girl and a lady made of snow, holding one flame between them
        g.fillStyle='rgba(60,50,70,.45)'; g.beginPath(); g.arc(-22,-134,5,0,TAU); g.arc(22,-134,5,0,TAU); g.fill(); g.fillStyle='#ffd27a'; g.beginPath(); g.moveTo(0,-142); g.quadraticCurveTo(6,-134,0,-126); g.quadraticCurveTo(-6,-134,0,-142); g.fill();
        if(!lit){ f2wSnowCap(g,-88,88,-150,6,mulberry32(5)); f2wSnowCap(g,-30,30,-190,5,mulberry32(6)); f2wIcicles(g,-80,80,-118,10,mulberry32(7)); }
        else{ g.fillStyle='#e0b048'; g.fillRect(-86,-121,172,3); } }),o.x,o.y);
      if(F2WD.hearthHeat>0&&!lit) glowAt(fx,fy-20,60,'160,200,255',0.4*F2WD.hearthHeat); }},
  // a stake of the frozen palisade north of town (moth-frost on the logs, icicles)
  stake:{R:34,by:2,col:{t:'c',r:12},draw(o,t){ f2wPut(f2wTall('stake'+(o.v%3),30,80,15,72,g=>{ const rng=mulberry32(31+o.v%3*17), h=50+(o.v%3)*7;
      f2wEll(g,2,4,13,4,'rgba(40,40,70,.28)'); f2wShade(g,-7,-h,14,h+2,'#7a5a3a'); g.fillStyle='#7a5a3a'; g.beginPath(); g.moveTo(-7,-h); g.lineTo(0,-h-12); g.lineTo(7,-h); g.closePath(); g.fill();
      g.fillStyle='rgba(190,200,255,.7)'; g.beginPath(); g.moveTo(-8,2); g.lineTo(-8,-h*0.55); g.quadraticCurveTo(0,-h*0.7,8,-h*0.5); g.lineTo(8,2); g.closePath(); g.fill();
      g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-4,-h*0.5); g.lineTo(-3,-6); g.stroke();
      f2wSnowCap(g,-6,6,-h+2,3,rng); f2wIcicles(g,-7,7,-h*0.55,8,rng); }),o.x,o.y); }},
  barn:{R:150,by:40,col:{t:'r',x0:-78,y0:-46,x1:78,y1:40},
    draw(o){ f2wPut(f2wTall('barn'+(o.v||0),200,180,100,140,g=>{ const rng=mulberry32(9+(o.v||0));
      f2wEll(g,0,42,92,12,'rgba(40,40,70,.3)'); f2wShade(g,-78,-46,156,88,'#b8443a');
      g.strokeStyle='rgba(80,20,20,.4)'; g.lineWidth=1; for(let x=-70;x<78;x+=12){ g.beginPath(); g.moveTo(x,-46); g.lineTo(x,42); g.stroke(); }
      f2wRect(g,-26,-6,52,48,'#f2e8d8',2); g.strokeStyle='#b8443a'; g.lineWidth=4; g.beginPath(); g.moveTo(-24,-4); g.lineTo(24,40); g.moveTo(24,-4); g.lineTo(-24,40); g.stroke();
      g.fillStyle='#f4f8fc'; g.beginPath(); g.moveTo(-90,-44); g.lineTo(0,-110); g.lineTo(90,-44); g.closePath(); g.fill(); g.fillStyle='#d6e2ee'; g.beginPath(); g.moveTo(0,-110); g.lineTo(90,-44); g.lineTo(0,-44); g.closePath(); g.fill();
      f2wIcicles(g,-86,86,-44,10,rng); f2wRect(g,-10,-80,20,16,'#3a2a24',3); f2wRect(g,-7,-77,14,11,isNight()?'#ffd88a':'#7a8ea0',2); }),o.x,o.y); }},
  lamp:{R:50,by:0,col:{t:'c',r:5},light:o=>({x:o.x+8,y:o.y-24,r:170,i:0.75,night:true,fire:true}),
    draw(o,t){ const nt=G&&daylight()<0.5; f2wPut(f2wTall('lamp'+(nt?1:0),30,50,12,46,g=>f2wLanternArt(g,nt)),o.x,o.y); if(nt){ glowAt(o.x+8,o.y-20,28,'255,214,130',0.5); glowAt(o.x+8,o.y-20,8,'255,246,200',0.7); } }},
  stall:{R:70,by:10,col:{t:'r',x0:-34,y0:-10,x1:34,y1:12},
    draw(o,t){ const v=o.v||0; f2wPut(f2wTall('stall'+v,96,96,48,84,g=>{ const cA=['#c8463a','#3a6aaa','#e0a030','#5a8a4a'][v%4];
      f2wEll(g,0,10,44,8,'rgba(40,30,50,.3)'); f2wShade(g,-36,-18,72,28,F2WC.wood);
      if(v===0){ for(let i=0;i<4;i++){ celBall(g,-22+i*14,-22,5,'#f2ece0'); f2wEll(g,-22+i*14,-24,3.4,1.6,'#6a3a1a'); } } else for(let i=0;i<5;i++) celBall(g,-24+i*12,-20,4.5,['#e8503a','#f0c040','#7ac04a','#e88a3a','#b05ad0'][(i+v)%5]);
      for(const s of [-1,1]) f2wRect(g,s*33-2,-60,4,48,F2WC.woodD);
      for(let i=0;i<6;i++){ g.fillStyle=i%2?'#fff6e6':cA; g.beginPath(); g.moveTo(-40+i*13.4,-60); g.lineTo(-40+(i+1)*13.4,-60); g.lineTo(-38+(i+1)*13.4,-46); g.lineTo(-38+i*13.4,-46); g.closePath(); g.fill(); }
      f2wSnowCap(g,-40,40,-61,3.5,mulberry32(v+3));
      if(v===0){ g.fillStyle='#3b2233'; g.font=`900 7px ${UIF}`; g.textAlign='center'; g.fillText('HOT COCOA 3c',0,-32); } }),o.x,o.y);
      if(v===0&&Math.random()<0.2) emit(o.x-22+Math.floor(Math.random()*4)*14,o.y-28,1,{col:'240,240,240',glow:false,ang:-Math.PI/2,spread:0.3,smin:10,smax:24,lmin:.8,lmax:1.4,zmin:2,zmax:4,grow:5,drag:0.6,alpha:0.5}); }},
  well:{R:50,by:2,col:{t:'c',r:22},draw(o,t){ f2wPut(f2wTall('well',70,80,35,60,g=>{ f2wEll(g,0,6,30,9,'rgba(40,30,50,.3)'); celFill(g,(q,dx,dy)=>q.ellipse(dx,dy,26,13,0,0,TAU),F2WC.stone,{r:24}); f2wEll(g,0,-2,19,8,'#1a2a3a'); f2wEll(g,-6,-4,6,2,'rgba(200,230,255,.5)');
      for(const s of [-1,1]) f2wRect(g,s*20-2,-46,4,44,F2WC.woodD); g.fillStyle=F2WC.roofR; g.beginPath(); g.moveTo(-30,-44); g.lineTo(0,-62); g.lineTo(30,-44); g.closePath(); g.fill(); f2wSnowCap(g,-28,28,-46,3,mulberry32(2)); }),o.x,o.y); }},
  bench:{R:30,by:2,col:{t:'r',x0:-20,y0:-6,x1:20,y1:5},draw(o){ f2wPut(f2wTall('bench',54,40,27,28,g=>{ f2wEll(g,2,5,22,5,'rgba(40,30,50,.3)'); for(const s of [-1,1]) f2wRect(g,s*16-2,-10,4,14,'#3a3e48'); f2wShade(g,-22,-12,44,6,F2WC.wood); f2wShade(g,-22,-20,44,5,F2WC.wood); f2wSnowCap(g,-20,20,-13,2,mulberry32(4)); }),o.x,o.y); }},
  woodpile:{R:40,by:4,col:{t:'r',x0:-26,y0:-10,x1:26,y1:8},draw(o){ f2wPut(f2wTall('wood',70,50,35,34,g=>{ f2wEll(g,2,6,30,6,'rgba(40,30,50,.3)'); for(let r=0;r<3;r++) for(let i=0;i<5-r;i++){ const x=-20+i*10+r*5, y=-r*8; celBall(g,x,y,5,'#a07a4a',['#c8a070','#a07a4a','#6a4a2c']); f2wEll(g,x,y,2.4,2.4,'#d8b888'); } f2wSnowCap(g,-16,16,-20,3,mulberry32(8)); }),o.x,o.y); }},
  barrel:{R:20,by:2,col:{t:'c',r:9,low:true},draw(o){ f2wPut(f2wTall('barrel',26,34,13,24,g=>{ f2wEll(g,2,5,9,3.6,'rgba(40,30,50,.3)'); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy-4,8,10,0,0,TAU); },'#7a5634',{r:9}); f2wEll(g,0,-11,7,3,'#f4f8fc'); g.strokeStyle='#5a5e68'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-8,-6); g.quadraticCurveTo(0,-3,8,-6); g.moveTo(-7.4,0); g.quadraticCurveTo(0,3,7.4,0); g.stroke(); }),o.x,o.y); }},
  snowman:{R:30,by:2,col:{t:'c',r:10,low:true},draw(o){ const v=o.v||0; f2wPut(f2wTall('snowman'+v,40,60,20,52,g=>{ f2wEll(g,2,4,13,4,'rgba(60,70,110,.25)'); celBall(g,0,-8,12,'#f4f8fc',['#ffffff','#eef4fb','#b8cce0']); celBall(g,0,-26,9,'#f4f8fc',['#ffffff','#eef4fb','#b8cce0']); f2wEll(g,-3,-28,1.3,1.3,'#2a2a30'); f2wEll(g,3,-28,1.3,1.3,'#2a2a30'); g.fillStyle='#ff8a2a'; g.beginPath(); g.moveTo(0,-26); g.lineTo(7,-25); g.lineTo(0,-24); g.fill();
      g.fillStyle=['#c84a3a','#3a6aaa','#4a9a4a'][v%3]; g.fillRect(-8,-20,16,3.4); g.fillRect(4,-20,3.4,9); if(v===1){ g.fillStyle='#2a2a30'; g.fillRect(-7,-38,14,4); g.fillRect(-5,-46,10,9); } }),o.x,o.y); }},
  sled:{R:30,by:2,col:false,draw(o){ const v=o.v||0; f2wPut(f2wTall('sled'+v,50,30,25,20,g=>{ g.save(); g.rotate(v%2?0.2:-0.15); f2wEll(g,2,4,20,4,'rgba(40,40,70,.25)'); g.strokeStyle='#5a4428'; g.lineWidth=2; g.beginPath(); g.moveTo(-18,2); g.lineTo(16,2); g.quadraticCurveTo(22,2,20,-4); g.stroke(); f2wShade(g,-16,-6,30,6,['#c8463a','#3a6aaa','#e0a030'][v%3]); g.restore(); }),o.x,o.y); }},
  // Rimeholm's bell, hanging in the open top of the tower (the rope comes down the front)
  bell:{R:60,by:0,col:false,draw(o,t){ const sw=Math.sin(t*1.1)*0.05+(F2WD.bellT>0?Math.sin(F2WD.bellT*14)*0.35*F2WD.bellT:0);
      f2wPut(f2wTall('belltop',120,120,60,96,g=>{ for(const s of [-1,1]) f2wShade(g,s*44-6,-78,12,80,F2WC.stone); g.fillStyle=F2WC.roofB; g.beginPath(); g.moveTo(-58,-74); g.lineTo(0,-112); g.lineTo(58,-74); g.closePath(); g.fill(); g.fillStyle=sbTone(F2WC.roofB,0.25); g.beginPath(); g.moveTo(-58,-74); g.lineTo(0,-112); g.lineTo(-4,-74); g.closePath(); g.fill(); f2wSnowCap(g,-56,0,-80,4,mulberry32(3)); f2wIcicles(g,-56,56,-74,10,mulberry32(4)); }),o.x,o.y);
      ctx.save(); ctx.translate(o.x,o.y-70); ctx.rotate(sw); f2wPut(f2wTall('bell',40,40,20,6,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-12+dx,24+dy); q.quadraticCurveTo(-12+dx,0+dy,dx,0+dy); q.quadraticCurveTo(12+dx,0+dy,12+dx,24+dy); q.lineTo(15+dx,28+dy); q.lineTo(-15+dx,28+dy); q.closePath(); },F2WT.ylva?'#d8a440':'#b8c8e0',{r:14}); f2wEll(g,0,30,3,3,'#8a6420'); }),0,0); ctx.restore(); }},
  // a fishing hut on stilts at the water's edge
  stilthut:{R:70,by:12,col:{t:'r',x0:-30,y0:-14,x1:30,y1:12},draw(o){ f2wPut(f2wTall('stilt'+(o.v||0),90,110,45,90,g=>{ const rng=mulberry32(21+(o.v||0));
      for(const sx of [-22,-6,10,24]){ f2wRect(g,sx-2,-6,4,18,'#4a3420'); f2wRect(g,sx-2,10,4,6,'rgba(30,50,70,.35)'); }
      f2wShade(g,-30,-50,60,46,o.v?'#8a7a6a':'#9a8a72'); g.strokeStyle='rgba(60,40,30,.4)'; g.lineWidth=1; for(let y=-44;y<-4;y+=8){ g.beginPath(); g.moveTo(-30,y); g.lineTo(30,y); g.stroke(); }
      f2wRect(g,-8,-32,16,28,'#3a2a24',2); f2wRect(g,12,-40,10,9,'#7a8ea0',2);
      g.fillStyle=o.v?F2WC.roofB:'#6a5a4a'; g.beginPath(); g.moveTo(-38,-48); g.lineTo(0,-78); g.lineTo(38,-48); g.closePath(); g.fill(); f2wSnowCap(g,-36,36,-50,4,rng); f2wIcicles(g,-34,34,-48,10,rng);
      g.fillStyle='rgba(200,230,250,.55)'; g.fillRect(-30,-50,60,46); }),o.x,o.y); }},
  vane:{R:60,by:0,col:false,draw(o,t){ const a=Math.sin(t*0.6+o.x)*0.4+0.8; ctx.save(); ctx.translate(o.x,o.y); ctx.strokeStyle=LOOK.sb?SBC.outline:'#2a1a10'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-44); ctx.stroke(); ctx.strokeStyle='#8a8e98'; ctx.lineWidth=1.8; ctx.stroke();
      ctx.translate(0,-44); ctx.rotate(a); ctx.fillStyle='#8a8e98'; ctx.beginPath(); ctx.moveTo(-16,0); ctx.lineTo(10,-4); ctx.lineTo(16,0); ctx.lineTo(10,4); ctx.closePath(); ctx.fill(); ctx.strokeStyle=LOOK.sb?SBC.outline:'#2a1a10'; ctx.lineWidth=1; ctx.stroke(); ctx.restore(); }},
  // a fur tent of Hask's Rest
  tent:{R:90,by:30,col:{t:'r',x0:-46,y0:-24,x1:46,y1:30},draw(o,t){ const v=o.v||0, big=o.big; f2wPut(f2wTall('tent'+v+(big?'b':''),big?160:120,big?140:110,big?80:60,big?110:86,g=>{ const w=big?64:48, h=big?96:74, rng=mulberry32(40+v);
      f2wEll(g,0,30,w+6,10,'rgba(40,40,70,.3)');
      const cs=[['#8a6a4a','#6a4a30'],['#7a5a3e','#5a3e26'],['#9a7a56','#6e5236']][v%3];
      g.fillStyle=cs[1]; g.beginPath(); g.moveTo(-w,30); g.lineTo(0,30-h); g.lineTo(w,30); g.closePath(); g.fill();
      g.fillStyle=cs[0]; g.beginPath(); g.moveTo(-w,30); g.lineTo(0,30-h); g.lineTo(w*0.15,30); g.closePath(); g.fill();
      g.strokeStyle='rgba(50,30,20,.5)'; g.lineWidth=1.2; for(let i=1;i<5;i++){ const k=i/5; g.beginPath(); g.moveTo(-w*k,30-h*(1-k)*0.02); g.lineTo(0,30-h); g.stroke(); }
      g.fillStyle='#2a1a14'; g.beginPath(); g.moveTo(-12,30); g.lineTo(0,30-h*0.42); g.lineTo(12,30); g.closePath(); g.fill(); g.fillStyle='rgba(255,190,110,.5)'; g.beginPath(); g.moveTo(-8,30); g.lineTo(0,30-h*0.3); g.lineTo(8,30); g.closePath(); g.fill();
      g.strokeStyle='#5a4428'; g.lineWidth=2.4; for(const s of [-1,1]){ g.beginPath(); g.moveTo(0,30-h); g.lineTo(s*8,30-h-14); g.stroke(); }
      g.fillStyle='#f4f8fc'; g.beginPath(); g.moveTo(-w*0.5,30-h*0.5); g.lineTo(0,30-h); g.lineTo(w*0.22,30-h*0.66); g.quadraticCurveTo(-w*0.1,30-h*0.62,-w*0.5,30-h*0.5); g.fill(); }),o.x,o.y);
      if(Math.random()<0.06) emit(o.x,o.y+30-(o.big?110:88),1,{col:'220,220,225',glow:false,ang:-Math.PI/2,spread:0.3,smin:12,smax:30,lmin:1.4,lmax:2.4,zmin:3,zmax:6,grow:6,drag:0.4,alpha:0.5}); }},
  // the kennel: five dog houses; a dog sits in front of each one once Ash has found it (f_dog1..5)
  kennel:{R:150,by:20,col:{t:'r',x0:-120,y0:-14,x1:120,y1:16},draw(o,t){ f2wPut(f2wTall('kennel',260,80,130,56,g=>{ const rng=mulberry32(55);
      for(let i=0;i<5;i++){ const x=-104+i*52; f2wShade(g,x-18,-24,36,30,'#9a6a40'); g.fillStyle='#2a1a14'; g.beginPath(); g.ellipse(x,4,8,10,0,Math.PI,TAU); g.fill(); g.fillRect(x-8,-6,16,10);
        g.fillStyle=F2WC.roofR; g.beginPath(); g.moveTo(x-24,-22); g.lineTo(x,-42); g.lineTo(x+24,-22); g.closePath(); g.fill(); f2wSnowCap(g,x-22,x+22,-25,3,rng);
        g.fillStyle='#fff4e0'; g.font=`900 5px ${UIF}`; g.textAlign='center'; g.fillText(['SNOWBALL','PEPPER','BISCUIT 2','SERGEANT','MITTENS'][i],x,-12); } }),o.x,o.y);
      const cols=['#f6f6f2','#3a3a42','#c8a070','#8a5a3a','#e8e4dc'];
      for(let i=0;i<5;i++){ if(!F2WF('f_dog'+(i+1))) continue; const x=o.x-104+i*52, y=o.y+24, wag=Math.sin(t*10+i)*0.5;
        ctx.fillStyle='rgba(40,40,70,.25)'; ctx.beginPath(); ctx.ellipse(x,y+4,12,4,0,0,TAU); ctx.fill();
        ctx.fillStyle=LOOK.sb?SBC.outline:'#2a2a30'; ctx.beginPath(); ctx.ellipse(x,y-4,10,7,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x+2,y-14,6.4,0,TAU); ctx.fill();
        ctx.fillStyle=cols[i]; ctx.beginPath(); ctx.ellipse(x,y-4,8.8,5.8,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x+2,y-14,5.2,0,TAU); ctx.fill();
        ctx.fillStyle=i===1?'#f6f6f2':'#3a3a42'; ctx.beginPath(); ctx.arc(x+4,y-13,1,0,TAU); ctx.arc(x,y-13,1,0,TAU); ctx.fill(); ctx.fillStyle='#1a1a20'; ctx.beginPath(); ctx.arc(x+2,y-10.6,1.4,0,TAU); ctx.fill();
        ctx.strokeStyle=cols[i]; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-8,y-6); ctx.quadraticCurveTo(x-14,y-12-wag*4,x-12+wag*6,y-16); ctx.stroke(); } }},
  rack:{R:50,by:6,col:{t:'r',x0:-24,y0:-6,x1:24,y1:6},draw(o){ f2wPut(f2wTall('rack',70,70,35,58,g=>{ for(const s of [-1,1]) f2wRect(g,s*24-2,-44,4,48,F2WC.woodD); f2wRect(g,-28,-44,56,4,F2WC.wood); for(let i=0;i<6;i++){ const x=-20+i*8; g.strokeStyle='#5a4a3a'; g.lineWidth=0.8; g.beginPath(); g.moveTo(x,-40); g.lineTo(x,-34); g.stroke(); celFill(g,(q,dx,dy)=>q.ellipse(x+dx,-26+dy,3,9,0,0,TAU),i%2?'#b07a4a':'#c89060',{r:6}); } f2wSnowCap(g,-28,28,-46,3,mulberry32(12)); }),o.x,o.y); }},
  // the Dreadgate: two doors of black ice as tall as a castle, a dragon curled round the moon, the Frost Lock between
  dreadgate:{R:260,by:10,col:[{t:'r',x0:-140,y0:-30,x1:-52,y1:12},{t:'r',x0:52,y0:-30,x1:140,y1:12},{t:'r',x0:-52,y0:-30,x1:52,y1:-8}],
    draw(o,t){ const open=F2WT.hush;
      f2wPut(f2wTall('dgate'+(open?1:0),320,300,160,280,g=>{
        f2wEll(g,0,10,150,22,'rgba(10,6,20,.4)');
        for(const s of [-1,1]){ celFill(g,(q,dx,dy)=>{ q.moveTo(s*150+dx,10+dy); q.lineTo(s*136+dx,-230+dy); q.lineTo(s*96+dx,-250+dy); q.lineTo(s*90+dx,10+dy); q.closePath(); },'#3a3248',{r:60,tones:['#6a5a86','#3a3248','#1a1424']});
          g.strokeStyle='rgba(176,140,240,.6)'; g.lineWidth=2; g.beginPath(); g.moveTo(s*130,-20); g.lineTo(s*120,-120); g.lineTo(s*134,-200); g.stroke(); }
        g.strokeStyle='#2a2438'; g.lineWidth=16; g.beginPath(); g.moveTo(-96,-200); g.quadraticCurveTo(0,-300,96,-200); g.stroke(); g.strokeStyle='#4a3e60'; g.lineWidth=10; g.stroke();
        if(open){ g.fillStyle='#08040e'; g.beginPath(); g.moveTo(-90,10); g.lineTo(-90,-196); g.quadraticCurveTo(0,-286,90,-196); g.lineTo(90,10); g.closePath(); g.fill();
          for(const s of [-1,1]){ g.fillStyle='#241e32'; g.beginPath(); g.moveTo(s*90,10); g.lineTo(s*90,-196); g.lineTo(s*60,-170); g.lineTo(s*60,20); g.closePath(); g.fill(); } }
        else{ for(const s of [-1,1]){ celFill(g,(q,dx,dy)=>{ q.moveTo(dx,10+dy); q.lineTo(dx,-242+dy); q.quadraticCurveTo(s*50+dx,-236+dy,s*90+dx,-196+dy); q.lineTo(s*90+dx,10+dy); q.closePath(); },'#4a4062',{r:60,tones:['#7a6c9a','#4a4062','#241e34']}); }
          // the dragon curled round the moon, carved across both doors
          g.strokeStyle='rgba(200,184,250,.75)'; g.lineWidth=3.4; g.beginPath(); g.arc(0,-120,46,0.3,TAU-0.6); g.stroke(); g.fillStyle='rgba(230,226,255,.5)'; g.beginPath(); g.arc(0,-120,26,0,TAU); g.fill();
          g.beginPath(); g.moveTo(40,-140); g.lineTo(58,-160); g.lineTo(50,-138); g.closePath(); g.fill(); g.strokeStyle='rgba(20,14,30,.7)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,8); g.lineTo(0,-242); g.stroke();
          // the Frost Lock, as big as a cart, sealed with purple frost
          celFill(g,(q,dx,dy)=>{ q.rect(-30+dx,-70+dy,60,52); },'#8a6ad0',{r:30,tones:['#d4c2ff','#8a6ad0','#4a2a8a']}); g.strokeStyle='#6a4aa8'; g.lineWidth=9; g.beginPath(); g.arc(0,-70,20,Math.PI,TAU); g.stroke(); g.strokeStyle='#c8b2f4'; g.lineWidth=4; g.stroke();
          f2wEll(g,0,-46,6,8,'#2a1a44'); }
        g.fillStyle='rgba(246,250,255,.9)'; g.beginPath(); g.ellipse(-120,-232,22,6,0,0,TAU); g.ellipse(120,-232,22,6,0,0,TAU); g.ellipse(0,-262,30,6,0,0,TAU); g.fill(); }),o.x,o.y);
      if(!open){ const k=0.5+0.5*Math.sin(t*2.2); glowAt(o.x,o.y-50,60,'170,130,255',0.18+0.12*k); if(F2WF('f_drum')){ ctx.strokeStyle=`rgba(255,255,255,${0.6+0.3*k})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(o.x-26,o.y-62); ctx.lineTo(o.x-6,o.y-44); ctx.lineTo(o.x+8,o.y-58); ctx.lineTo(o.x+26,o.y-30); ctx.stroke(); } }
      else{ glowAt(o.x,o.y-80,70,'120,90,200',0.15); } }},
  // the Horned Gate: a ram's skull as big as a house, the door of Stonehorn Deep in its mouth
  // (the back of the mouth is solid too: without it Ash walked in at the door and out through the back of the skull)
  hornedgate:{R:220,by:20,col:[{t:'r',x0:-130,y0:-40,x1:-38,y1:16},{t:'r',x0:38,y0:-40,x1:130,y1:16},{t:'r',x0:-38,y0:-40,x1:38,y1:-12}],
    draw(o,t){ f2wPut(f2wTall('horned',320,240,160,210,g=>{ const B=F2WP.bone;
      f2wEll(g,0,18,140,20,'rgba(60,30,20,.35)');
      // the horns curling out to the sides
      for(const s of [-1,1]){ g.lineCap='round'; for(const [w,c] of [[30,B[0]],[22,B[1]],[6,B[2]]]){ g.strokeStyle=c; g.lineWidth=w; g.beginPath(); for(let a=0;a<5.2;a+=0.18){ const r=96-a*14, x=s*(52+Math.cos(a+Math.PI*1.1)*r*-1), y=-100+Math.sin(a+Math.PI*1.1)*r*0.8; a?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); } }
      // the skull
      celFill(g,(q,dx,dy)=>{ q.moveTo(-74+dx,10+dy); q.quadraticCurveTo(-96+dx,-120+dy,0+dx,-170+dy); q.quadraticCurveTo(96+dx,-120+dy,74+dx,10+dy); q.closePath(); },B[1],{r:80,tones:f2wTones(B)});
      for(const s of [-1,1]){ g.fillStyle='#2a1a14'; g.beginPath(); g.ellipse(s*34,-98,18,14,s*0.3,0,TAU); g.fill(); g.fillStyle='rgba(255,200,120,.25)'; g.beginPath(); g.ellipse(s*34,-96,8,6,0,0,TAU); g.fill(); }
      g.fillStyle='#2a1a14'; g.beginPath(); g.moveTo(-6,-66); g.lineTo(0,-54); g.lineTo(6,-66); g.closePath(); g.fill();
      // the mouth: a doorway with teeth, a dark way down
      g.fillStyle='#120a08'; g.beginPath(); g.moveTo(-40,12); g.lineTo(-40,-24); g.quadraticCurveTo(0,-52,40,-24); g.lineTo(40,12); g.closePath(); g.fill();
      g.fillStyle=B[2]; for(let i=0;i<6;i++){ const x=-34+i*13.6; g.beginPath(); g.moveTo(x-5,-30+Math.abs(i-2.5)*3); g.lineTo(x,-16+Math.abs(i-2.5)*3); g.lineTo(x+5,-30+Math.abs(i-2.5)*3); g.closePath(); g.fill(); }
      f2wSnowCap(g,-60,60,-150,7,mulberry32(14)); }),o.x,o.y);
      if(Math.sin(t*0.5)>0.98&&dist2(player.x,player.y,o.x,o.y)<500*500&&!F2WD.snoreT){ F2WD.snoreT=1; later(3,()=>{ F2WD.snoreT=0; }); f2wSnd('thud',0.6); ftext(o.x,o.y-80,S('Zzzrrrk...','Snore...'),'#f4e4d0',14); } }},
  // Skyreach Temple on its isle: white stone, gold trim, red and saffron flags, round windows, a gold finial
  temple:{R:260,by:24,col:[{t:'r',x0:-130,y0:-60,x1:-36,y1:20},{t:'r',x0:36,y0:-60,x1:130,y1:20},{t:'r',x0:-36,y0:-60,x1:36,y1:-12}],
    draw(o,t){ f2wPut(f2wTall('temple',320,330,160,300,g=>{
      f2wEll(g,0,22,150,20,'rgba(60,50,90,.3)');
      celFill(g,(q,dx,dy)=>q.rect(-130+dx,-80+dy,260,100),'#f2eef8',{r:100}); f2wRect(g,-130,-82,260,6,F2WC.gold);
      for(let i=0;i<5;i++){ const x=-104+i*52; if(Math.abs(x)<30) continue; f2wEll(g,x,-40,13,13,F2WC.gold); f2wEll(g,x,-40,10,10,'#8ab8e0'); f2wEll(g,x-3,-43,3,3,'rgba(255,255,255,.7)'); }
      g.fillStyle='#2a1a2e'; g.beginPath(); g.moveTo(-28,20); g.lineTo(-28,-36); g.quadraticCurveTo(0,-62,28,-36); g.lineTo(28,20); g.closePath(); g.fill(); g.strokeStyle=F2WC.gold; g.lineWidth=3; g.stroke();
      // three curved roofs stacked like a pagoda
      for(const [w,y,h] of [[160,-80,30],[118,-134,26],[78,-182,22]]){ g.fillStyle='#c8463a'; g.beginPath(); g.moveTo(-w-14,y+4); g.quadraticCurveTo(-w*0.6,y-h*0.6,0,y-h); g.quadraticCurveTo(w*0.6,y-h*0.6,w+14,y+4); g.quadraticCurveTo(0,y-6,-w-14,y+4); g.fill();
        g.fillStyle='#e0684a'; g.beginPath(); g.moveTo(-w-14,y+4); g.quadraticCurveTo(-w*0.6,y-h*0.6,0,y-h); g.lineTo(0,y-4); g.quadraticCurveTo(-w*0.5,y-2,-w-14,y+4); g.fill(); f2wRect(g,-w*0.62,y-4,w*1.24,4,F2WC.gold);
        if(y<-90) celFill(g,(q,dx,dy)=>q.rect(-w*0.55+dx,y+4+dy,w*1.1,30),'#f2eef8',{r:w*0.5}); }
      g.strokeStyle=F2WC.gold; g.lineWidth=4; g.beginPath(); g.moveTo(0,-204); g.lineTo(0,-236); g.stroke(); celBall(g,0,-240,7,F2WC.gold);
      g.fillStyle='#3b2233'; g.font=`900 10px ${UIF}`; g.textAlign='center'; g.fillText('SKYREACH',0,-92); }),o.x,o.y);
      // prayer flags snapping in the wind between the roof corners and two poles, wind chimes swinging
      for(const s of [-1,1]){ const x0=o.x+s*174, y0=o.y-76, x1=o.x+s*230, y1=o.y-10; ctx.strokeStyle=LOOK.sb?SBC.outline:'#3a2a20'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x1,y1+30); ctx.lineTo(x1,y1-60); ctx.stroke(); ctx.strokeStyle='#8e6a40'; ctx.lineWidth=1.6; ctx.stroke();
        ctx.strokeStyle='rgba(80,60,40,.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo((x0+x1)/2,y0+10,x1,y1-60); ctx.stroke();
        for(let i=0;i<5;i++){ const k=(i+0.5)/5, x=lerp(x0,x1,k), y=lerp(y0,y1-60,k)+Math.sin(k*Math.PI)*5, f=Math.sin(t*7+i+s)*2; ctx.fillStyle=['#d83a32','#f0a020','#f6e6c0','#e8503a','#f0c030'][i]; ctx.beginPath(); ctx.moveTo(x-3,y); ctx.lineTo(x+3,y); ctx.lineTo(x+3+f,y+9); ctx.lineTo(x-3+f,y+9); ctx.closePath(); ctx.fill(); } }
      for(const s of [-1,1]){ const cx=o.x+s*120, cy=o.y-74; for(let i=0;i<4;i++){ const sw=Math.sin(t*3+i*1.3+s)*3; ctx.strokeStyle='rgba(120,100,60,.8)'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(cx+(i-1.5)*5,cy); ctx.lineTo(cx+(i-1.5)*5+sw,cy+12+i*2); ctx.stroke(); ctx.fillStyle=F2WC.gold; ctx.fillRect(cx+(i-1.5)*5+sw-1,cy+12+i*2,2,7); } } }},
  // a broken rope bridge hanging off an isle edge, and wind chimes on posts
  chimes:{R:50,by:2,col:{t:'c',r:6},draw(o,t){ ctx.save(); ctx.strokeStyle=LOOK.sb?SBC.outline:'#3a2a20'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(o.x,o.y-50); ctx.lineTo(o.x+16,o.y-50); ctx.stroke(); ctx.strokeStyle='#f2eef8'; ctx.lineWidth=1.8; ctx.stroke();
      for(let i=0;i<4;i++){ const sw=Math.sin(t*2.6+i*1.1+o.x)*2.4; ctx.strokeStyle='rgba(120,100,60,.8)'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(o.x+4+i*4,o.y-50); ctx.lineTo(o.x+4+i*4+sw,o.y-40+i*2); ctx.stroke(); ctx.fillStyle=F2WC.gold; ctx.fillRect(o.x+3+i*4+sw,o.y-40+i*2,2.2,8); } ctx.restore(); }},
  ropebridge:{R:120,by:0,col:false,draw(o,t){ const sw=Math.sin(t*1.2+o.x)*0.08; ctx.save(); ctx.translate(o.x,o.y); ctx.rotate((o.a||0)+sw); ctx.strokeStyle='#c8b080'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-8); ctx.quadraticCurveTo(30,30,o.len||70,60); ctx.moveTo(0,8); ctx.quadraticCurveTo(26,40,(o.len||70)-10,70); ctx.stroke();
      for(let i=0;i<5;i++){ const k=i/5, x=k*(o.len||70)*0.9, y=k*60+Math.sin(k*Math.PI)*10; ctx.fillStyle=LOOK.sb?SBC.outline:'#3a2a20'; ctx.fillRect(x-7,y-3,14,6); ctx.fillStyle='#9a7a50'; ctx.fillRect(x-6,y-2,12,4); } ctx.restore(); }},
  // the Frozen Shipwreck's masts with icicle rigging
  wreckmast:{R:200,by:0,col:{t:'c',r:8},draw(o,t){ f2wPut(f2wTall('mast'+(o.v||0),200,260,100,250,g=>{ const h=o.v?180:220, rng=mulberry32(60+(o.v||0));
      g.strokeStyle='#3a2414'; g.lineWidth=8; g.beginPath(); g.moveTo(0,0); g.lineTo(o.v?-8:6,-h); g.stroke(); g.strokeStyle='#6a4a2c'; g.lineWidth=4.4; g.stroke();
      for(const [y,w] of [[-h*0.45,70],[-h*0.8,50]]){ g.strokeStyle='#4a3020'; g.lineWidth=5; g.beginPath(); g.moveTo(-w,y); g.lineTo(w,y+4); g.stroke(); g.strokeStyle='#7a5634'; g.lineWidth=2.6; g.stroke(); f2wIcicles(g,-w,w,y+3,14,rng); f2wSnowCap(g,-w,w,y-2,2.6,rng); }
      g.strokeStyle='rgba(200,220,240,.75)'; g.lineWidth=1.4; for(const s of [-1,1]){ g.beginPath(); g.moveTo(0,-h); g.lineTo(s*80,-6); g.moveTo(s*60,-h*0.45); g.lineTo(s*90,-10); g.stroke(); }
      if(!o.v){ g.fillStyle='rgba(230,220,200,.85)'; g.beginPath(); g.moveTo(4,-h*0.78); g.quadraticCurveTo(40,-h*0.65,22,-h*0.5); g.lineTo(6,-h*0.52); g.closePath(); g.fill(); } }),o.x,o.y); }},
  // a frost chain half buried in the snow: a big violet chain arcing out of the ground and back in
  chain:{R:90,by:0,col:false,draw(o,t){ const n=9, L=o.len||140, a=o.a||0, c=Math.cos(a), s=Math.sin(a), pulse=0.5+0.5*Math.sin(t*1.8+o.x*0.01);
      ctx.save(); for(let i=0;i<=n;i++){ const k=i/n, x=o.x+c*(k-0.5)*L, y=o.y+s*(k-0.5)*L-Math.sin(k*Math.PI)*28;
        ctx.strokeStyle=LOOK.sb?SBC.outline:'#1a1028'; ctx.lineWidth=5.6; ctx.beginPath(); ctx.ellipse(x,y,7,4.4,i%2?a:a+Math.PI/2,0,TAU); ctx.stroke(); ctx.strokeStyle=`rgb(${Math.round(150+40*pulse)},${Math.round(120+30*pulse)},230)`; ctx.lineWidth=2.8; ctx.stroke(); }
      for(const e of [-0.5,0.5]){ ctx.fillStyle='rgba(240,244,252,.95)'; ctx.beginPath(); ctx.ellipse(o.x+c*e*L,o.y+s*e*L+2,14,6,0,0,TAU); ctx.fill(); } ctx.restore(); }},
  // a little ice-fishing hut on the lake, a hole beside it
  icehut:{R:60,by:10,col:{t:'r',x0:-22,y0:-12,x1:22,y1:10},draw(o){ f2wPut(f2wTall('icehut',70,80,35,64,g=>{ f2wEll(g,2,10,30,6,'rgba(60,90,130,.3)'); f2wShade(g,-22,-34,44,44,'#b8503a'); f2wRect(g,-6,-16,12,26,'#3a2a24',2); g.fillStyle='#f4f8fc'; g.beginPath(); g.moveTo(-28,-32); g.lineTo(0,-54); g.lineTo(28,-32); g.closePath(); g.fill(); g.fillStyle='#d6e2ee'; g.beginPath(); g.moveTo(0,-54); g.lineTo(28,-32); g.lineTo(0,-32); g.closePath(); g.fill(); f2wRect(g,10,-50,5,10,'#5a5e68'); }),o.x,o.y); if(Math.random()<0.05) emit(o.x+12,o.y-58,1,{col:'230,230,235',glow:false,ang:-Math.PI/2,spread:0.3,smin:10,smax:25,lmin:1.2,lmax:2,zmin:3,zmax:5,grow:5,drag:0.4,alpha:0.5}); }},
  // a dog sled post (Hask's sled line): a post with a sled and a bell
  sledpost:{R:70,by:6,col:{t:'c',r:8},draw(o,t){ f2wPut(f2wTall('sledpost',90,90,45,80,g=>{ f2wEll(g,2,6,34,7,'rgba(40,40,70,.3)'); f2wShade(g,-4,-62,8,64,F2WC.woodD); f2wRect(g,-16,-64,32,14,'#d8c8a8',2);
      g.fillStyle='#3b2233'; g.font=`900 6px ${UIF}`; g.textAlign='center'; g.fillText('DOG SLED',0,-54); f2wSnowCap(g,-16,16,-65,2.4,mulberry32(66));
      g.save(); g.translate(14,2); g.rotate(-0.1); g.strokeStyle='#5a4428'; g.lineWidth=2.2; g.beginPath(); g.moveTo(-14,4); g.lineTo(26,4); g.quadraticCurveTo(32,4,30,-4); g.stroke(); f2wShade(g,-12,-6,34,8,'#c8463a'); g.restore(); }),o.x,o.y);
      if(f2wSledOK()){ for(let i=0;i<5;i++) f2wSledDog(o.x+44+i*15,o.y+18+(i%2)*6,i,t); } }},
  // Mags's steam sled, pushed off the road into Snowgob Gulch
  steamsled:{R:80,by:10,col:{t:'r',x0:-40,y0:-14,x1:40,y1:12},draw(o,t){ f2wPut(f2wTall('steamsled',110,80,55,56,g=>{ g.save(); g.rotate(0.35); f2wEll(g,2,12,46,8,'rgba(40,40,70,.3)');
      g.strokeStyle='#3a3e48'; g.lineWidth=3; g.beginPath(); g.moveTo(-40,10); g.lineTo(36,10); g.quadraticCurveTo(46,10,42,0); g.stroke();
      f2wShade(g,-36,-14,62,22,'#a4643a'); celFill(g,(q,dx,dy)=>q.ellipse(-10+dx,-22+dy,16,12,0,0,TAU),'#c8963a',{r:14}); f2wRect(g,10,-40,8,26,'#5a5e68',2); f2wEll(g,-10,-22,6,6,'#5a3a1a');
      f2wSnowCap(g,-34,24,-16,4,mulberry32(71)); g.restore(); }),o.x,o.y); }},
  // the mouth of Juniper's Tunnel: a dark hole under the cliff, a boulder until it is opened
  tunnel:{R:80,by:4,col:false,draw(o,t){ const open=F2WF('f_tunnel_open'); f2wPut(f2wTall('tunnel',120,90,60,70,g=>{
      celFill(g,(q,dx,dy)=>{ q.moveTo(-54+dx,6+dy); q.quadraticCurveTo(-56+dx,-66+dy,0+dx,-70+dy); q.quadraticCurveTo(56+dx,-66+dy,54+dx,6+dy); q.closePath(); },'#9aa4b4',{r:50});
      g.fillStyle='#0e1420'; g.beginPath(); g.moveTo(-30,6); g.quadraticCurveTo(-32,-44,0,-46); g.quadraticCurveTo(32,-44,30,6); g.closePath(); g.fill();
      f2wSnowCap(g,-50,50,-64,6,mulberry32(81)); f2wIcicles(g,-28,28,-42,12,mulberry32(82)); }),o.x,o.y);
      if(open&&isNight()) glowAt(o.x,o.y-20,20,'255,220,150',0.2); }},
  // Sir Frostington: a giant snowman with a monocle (Blaze melts him over 3 s; inside, the Parsnip of Fate)
  frostington:{R:90,by:6,col:{t:'c',r:34},draw(o,t){ if(G.found.f_sec_frostington){ ctx.fillStyle='rgba(170,210,240,.5)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+4,54,18,0,0,TAU); ctx.fill(); ctx.fillStyle='#2a2a30'; ctx.beginPath(); ctx.arc(o.x+20,o.y+2,6,0,TAU); ctx.fill(); ctx.fillStyle='#d8a440'; ctx.beginPath(); ctx.arc(o.x+20,o.y+2,4,0,TAU); ctx.fill(); return; }
      const k=F2WD.frostHeat||0; f2wPut(f2wTall('frostington',140,200,70,184,g=>{ const sn=['#ffffff','#eef4fb','#b8cce0'];
        f2wEll(g,4,6,50,12,'rgba(60,70,110,.28)'); celBall(g,0,-36,44,'#eef4fb',sn); celBall(g,0,-104,32,'#eef4fb',sn); celBall(g,0,-152,22,'#eef4fb',sn);
        f2wEll(g,-8,-156,2.6,2.6,'#2a2a30'); f2wEll(g,8,-156,2.6,2.6,'#2a2a30'); g.strokeStyle='#d8a440'; g.lineWidth=1.6; g.beginPath(); g.arc(8,-156,5.4,0,TAU); g.stroke(); g.beginPath(); g.moveTo(13,-155); g.lineTo(16,-140); g.stroke();
        g.fillStyle='#ff8a2a'; g.beginPath(); g.moveTo(0,-150); g.lineTo(16,-147); g.lineTo(0,-145); g.fill();
        g.fillStyle='#2a2a30'; g.fillRect(-22,-178,44,6); g.fillRect(-14,-206,28,30); g.fillStyle='#c8463a'; g.fillRect(-14,-184,28,5);
        for(const y of [-110,-96,-80]){ f2wEll(g,0,y,3,3,'#2a2a30'); }
        g.fillStyle='#3a6aaa'; g.fillRect(-30,-132,60,8); g.fillRect(16,-132,8,26);
        g.strokeStyle='#6a4a2c'; g.lineWidth=4; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*28,-110); g.lineTo(s*62,-138); g.lineTo(s*70,-150); g.stroke(); } }),o.x,o.y,1-k*0.25);
      if(k>0){ glowAt(o.x,o.y-90,70,'255,210,170',0.25*k); if(Math.random()<k) emit(o.x+rand(-40,40),o.y-rand(20,150),1,{col:'220,240,255',glow:false,ang:Math.PI/2,spread:0.3,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.4,zmax:2.4}); } }},
  // an ice statue in the Ice Sculpture Garden (one of the Act I bosses); melted ones refreeze after a minute
  istatue:{R:70,by:4,col:{t:'c',r:16},draw(o,t){ const S=F2WD.garden&&F2WD.garden.st[o.i]; const melt=S&&S.melt>0;
      if(melt){ p3Puddle(o.x,o.y+4,60,0.8); return; }
      const h=S?S.heat:0; f2wPut(f2wTall('istat'+o.i,90,130,45,118,g=>f2wStatueArt(g,o.i)),o.x,o.y);
      if(h>0){ glowAt(o.x,o.y-50,40,'255,220,180',0.25*h); }
      const a=0.25+0.2*Math.sin(t*1.5+o.i); glowAt(o.x-6,o.y-70,10,'255,255,255',a); }},
  // the giant frozen fish on the pressure ridge, a chest frozen in its mouth
  bigfish:{R:120,by:0,col:{t:'r',x0:-70,y0:-10,x1:70,y1:10},draw(o,t){ const done=G.found.f_sec_ridge; f2wPut(f2wTall('bigfish'+(done?1:0),190,80,95,50,g=>{
      if(!done){ g.fillStyle='rgba(180,220,250,.7)'; rrect(g,-90,-34,180,46,14); g.fill(); }
      celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-10+dy,64,20,0,0,TAU); },'#6a8aa8',{r:60,tones:['#a8c4dc','#6a8aa8','#3e5a7a']});
      g.fillStyle='#4e6e8e'; g.beginPath(); g.moveTo(-60,-10); g.lineTo(-88,-30); g.lineTo(-82,-10); g.lineTo(-88,10); g.closePath(); g.fill();
      g.fillStyle='#2a3a4a'; g.beginPath(); g.ellipse(52,-12,12,8,0,0,TAU); g.fill(); f2wEll(g,44,-18,3,3,'#f4f8fc'); f2wEll(g,44,-18,1.4,1.4,'#1a1a20');
      if(!done){ f2wShade(g,48,-20,22,14,'#a07a4a'); f2wRect(g,48,-14,22,2.4,'#d8b04a'); g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=2; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(-70+i*34,-30); g.lineTo(-62+i*34,4); g.stroke(); } } }),o.x,o.y); }},
  // the bathing snow monkeys of the Steamwell (their own little world; the cheeky one runs off with Ash's hat)
  monkeys:{R:120,by:0,col:false,draw(o,t){ f2wDrawMonkeys(o,t); }},
  // the mammoth skull drum in the Mammoth Graveyard
  skulldrum:{R:80,by:6,col:{t:'c',r:30},draw(o,t){ f2wPut(f2wTall('skulldrum',120,100,60,80,g=>{ const B=F2WP.bone;
      f2wEll(g,0,8,52,12,'rgba(60,30,20,.35)'); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-24+dy,46,32,0,0,TAU); },B[1],{r:46,tones:f2wTones(B)});
      for(const s of [-1,1]){ g.fillStyle='#2a1a14'; g.beginPath(); g.ellipse(s*18,-32,9,7,0,0,TAU); g.fill(); g.strokeStyle=B[0]; g.lineWidth=9; g.beginPath(); g.moveTo(s*30,-8); g.quadraticCurveTo(s*62,0,s*58,-40); g.stroke(); g.strokeStyle=B[2]; g.lineWidth=5; g.stroke(); }
      g.fillStyle='#8a6a52'; rrect(g,-20,-62,40,14,5); g.fill(); g.strokeStyle='#5a3e2a'; g.lineWidth=1.4; g.stroke(); f2wSnowCap(g,-30,30,-54,5,mulberry32(91)); }),o.x,o.y); }},
  // the drum-stone shrine on the Shoulder Ledge gets a ram face on top of the p3 drum (drawn by p3_frost)
  flag:{R:70,by:0,col:false,draw(o,t){ ctx.save(); ctx.translate(o.x,o.y); ctx.strokeStyle=LOOK.sb?SBC.outline:'#2a1a10'; ctx.lineWidth=3.6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-60); ctx.stroke(); ctx.strokeStyle='#d8d0c0'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle=o.c||'#c8463a'; ctx.beginPath(); ctx.moveTo(1,-60); for(let i=0;i<=6;i++){ ctx.lineTo(1+i*5,-60+Math.sin(t*5-i)*2.4+i*0.4); } for(let i=6;i>=0;i--){ ctx.lineTo(1+i*5,-46+Math.sin(t*5-i)*2.4+i*0.2); } ctx.closePath(); ctx.fill(); ctx.restore(); }},
  prop:{R:40,by:2,col:o=>{ const K=PROPK[o.pk]; return K&&K.col&&o.col!==false?{t:'c',r:K.col.r*(o.s||1),low:!!K.col.low}:[]; },
    draw(o){ drawSprite(propSprite({k:o.pk,v:o.v||0}),o.x,o.y,o.s||1,0); }}
};
// the six ice statues of the Ice Sculpture Garden: Grizzlefang, Morrow, the Brood Mother, Gloamjaw, Greymane, Cindervane
function f2wStatueArt(g,i){
  const T=['#e6f6ff','#a9daf4','#6aa4d4'], ice=(path,r)=>celFill(g,path,T[1],{r,tones:T});
  f2wEll(g,0,6,30,8,'rgba(60,90,140,.3)'); ice((q,dx,dy)=>q.rect(-26+dx,-14+dy,52,18),26);
  switch(i){
    case 0: ice((q,dx,dy)=>{ q.ellipse(dx,-48+dy,20,30,0,0,TAU); },24); ice((q,dx,dy)=>q.arc(dx,-86+dy,14,0,TAU),14); for(const s of [-1,1]) ice((q,dx,dy)=>q.arc(s*10+dx,-98+dy,5,0,TAU),5); g.strokeStyle=T[2]; g.lineWidth=2; g.beginPath(); g.moveTo(-6,-80); g.lineTo(6,-80); g.stroke(); break;            // a kobold chief
    case 1: ice((q,dx,dy)=>{ q.moveTo(-18+dx,-14+dy); q.lineTo(-8+dx,-80+dy); q.lineTo(8+dx,-80+dy); q.lineTo(18+dx,-14+dy); q.closePath(); },20); ice((q,dx,dy)=>q.arc(dx,-90+dy,11,0,TAU),11); ice((q,dx,dy)=>{ q.moveTo(-10+dx,-96+dy); q.lineTo(dx,-116+dy); q.lineTo(10+dx,-96+dy); q.closePath(); },10); break;   // a priest in a tall hood
    case 2: ice((q,dx,dy)=>q.ellipse(dx,-40+dy,18,24,0,0,TAU),20); for(const s of [-1,1]) ice((q,dx,dy)=>{ q.moveTo(s*8+dx,-50+dy); q.lineTo(s*42+dx,-80+dy); q.lineTo(s*34+dx,-40+dy); q.closePath(); },20); ice((q,dx,dy)=>q.ellipse(dx,-70+dy,9,12,0,0,TAU),10); break;   // a drake with spread wings
    case 3: ice((q,dx,dy)=>q.ellipse(dx,-36+dy,26,22,0,0,TAU),26); ice((q,dx,dy)=>q.ellipse(dx,-66+dy,22,14,0,0,TAU),20); g.fillStyle=T[2]; for(let k=0;k<5;k++) g.fillRect(-14+k*7,-60,3,6); break;   // a big toothy swamp thing
    case 4: ice((q,dx,dy)=>q.ellipse(-4+dx,-40+dy,26,16,0,0,TAU),26); ice((q,dx,dy)=>q.ellipse(18+dx,-62+dy,12,11,0,0,TAU),12); for(const s of [0,1]) ice((q,dx,dy)=>{ q.moveTo(12+s*10+dx,-70+dy); q.lineTo(14+s*10+dx,-86+dy); q.lineTo(19+s*10+dx,-70+dy); q.closePath(); },6); ice((q,dx,dy)=>{ q.moveTo(-28+dx,-44+dy); q.quadraticCurveTo(-46+dx,-70+dy,-34+dx,-80+dy); q.lineTo(-24+dx,-48+dy); q.closePath(); },10); break;  // a great wolf
    case 5: ice((q,dx,dy)=>q.rect(-16+dx,-80+dy,32,66),20); ice((q,dx,dy)=>q.arc(dx,-92+dy,13,0,TAU),13); ice((q,dx,dy)=>{ q.moveTo(-4+dx,-104+dy); q.lineTo(dx,-122+dy); q.lineTo(4+dx,-104+dy); q.closePath(); },6); ice((q,dx,dy)=>q.rect(18+dx,-110+dy,5,90),6); break;  // a knight with a lance
  }
  g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-10,-20); g.lineTo(-4,-60); g.stroke();
}

// more standing things: Juniper's tent, her floe's broken mast, the Crown's spike and summit door, the bits that freeze
// with the Frozen Folk (a cow, a goat, a fish on a line, a soup pot, a sled), the Steamwell's snow monkeys
Object.assign(F2WK,{
  maptent:{R:80,by:20,col:{t:'r',x0:-38,y0:-16,x1:38,y1:20},draw(o,t){ const home=F2WF('f_juniper_home')||F2WQ('f_juniper'); f2wPut(f2wTall('maptent'+(home?1:0),110,100,55,80,g=>{
      f2wEll(g,0,22,48,8,'rgba(40,40,70,.3)');
      for(let i=0;i<5;i++){ g.fillStyle=i%2?'#f2e6c6':'#3a7a8a'; g.beginPath(); g.moveTo(-44+i*17.6,20); g.lineTo(0,-58); g.lineTo(-44+(i+1)*17.6,20); g.closePath(); g.fill(); }
      g.fillStyle='#2a1a14'; g.beginPath(); g.moveTo(-10,20); g.lineTo(0,-16); g.lineTo(10,20); g.closePath(); g.fill();
      g.strokeStyle='#5a4428'; g.lineWidth=2.4; g.beginPath(); g.moveTo(0,-58); g.lineTo(0,-72); g.stroke(); g.fillStyle='#e8b030'; g.beginPath(); g.moveTo(0,-72); g.lineTo(14,-68); g.lineTo(0,-64); g.fill();
      if(!home){ f2wRect(g,14,-10,14,16,'#fff6e0',1); g.strokeStyle='#8a7a5a'; g.lineWidth=0.8; for(let y=-7;y<4;y+=3){ g.beginPath(); g.moveTo(16,y); g.lineTo(26,y); g.stroke(); } }
      else{ f2wRect(g,-36,8,22,10,'#f2e6c6',1); g.strokeStyle='#c8463a'; g.lineWidth=1; g.beginPath(); g.moveTo(-33,12); g.lineTo(-24,16); g.lineTo(-18,10); g.stroke(); }
      f2wSnowCap(g,-30,6,-34,3,mulberry32(15)); }),o.x,o.y); }},
  juniperpost:{R:50,by:0,col:{t:'c',r:8},draw(o,t){ f2wPut(f2wTall('jpost',60,70,30,64,g=>{ f2wEll(g,2,4,12,4,'rgba(40,50,80,.3)'); g.strokeStyle='#3a2414'; g.lineWidth=7; g.beginPath(); g.moveTo(0,2); g.lineTo(3,-44); g.stroke(); g.strokeStyle='#6a4a2c'; g.lineWidth=4; g.stroke();
      g.fillStyle='#6a4a2c'; g.beginPath(); g.moveTo(-1,-44); g.lineTo(6,-52); g.lineTo(5,-42); g.closePath(); g.fill(); f2wEll(g,2,-40,9,4,'#d8b04a'); f2wEll(g,2,-40,5,2,'#6a4a2c'); f2wSnowCap(g,-4,8,-46,2.4,mulberry32(16)); }),o.x,o.y); }},
  // the spike of black ice in the middle of the Crown that Glaciar coils round
  spike:{R:220,by:20,col:{t:'c',r:34},draw(o,t){ f2wPut(f2wTall('spike',140,300,70,282,g=>{
      f2wEll(g,0,18,64,18,'rgba(10,6,20,.45)');
      celFill(g,(q,dx,dy)=>{ q.moveTo(-46+dx,18+dy); q.lineTo(-20+dx,-120+dy); q.lineTo(-6+dx,-250+dy); q.lineTo(2+dx,-278+dy); q.lineTo(12+dx,-240+dy); q.lineTo(26+dx,-110+dy); q.lineTo(48+dx,18+dy); q.closePath(); },'#3a3248',{r:50,tones:['#7a6c9a','#3a3248','#16101e']});
      g.strokeStyle='rgba(190,160,255,.75)'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-14,-20); g.lineTo(-6,-120); g.lineTo(-2,-200); g.moveTo(16,-10); g.lineTo(10,-90); g.stroke();
      for(const [x,y,w] of [[-30,-30,18],[24,-60,14],[-16,-150,10]]) f2wEll(g,x,y,w,4,'rgba(246,250,255,.9)'); }),o.x,o.y);
      glowAt(o.x,o.y-160,50,'170,130,255',0.18+0.08*Math.sin(t*2)); }},
  summitdoor:{R:90,by:4,col:[{t:'r',x0:-60,y0:-14,x1:-24,y1:6},{t:'r',x0:24,y0:-14,x1:60,y1:6},{t:'r',x0:-24,y0:-14,x1:24,y1:-4}],draw(o,t){ const open=F2WF('f_crown_open'); f2wPut(f2wTall('summit'+(open?1:0),140,130,70,110,g=>{
      celFill(g,(q,dx,dy)=>{ q.moveTo(-64+dx,6+dy); q.quadraticCurveTo(-70+dx,-90+dy,0+dx,-104+dy); q.quadraticCurveTo(70+dx,-90+dy,64+dx,6+dy); q.closePath(); },'#3a3248',{r:60,tones:['#6a5c86','#3a3248','#1a1424']});
      g.fillStyle=open?'#06030c':'#4a4062'; g.beginPath(); g.moveTo(-24,6); g.lineTo(-24,-46); g.quadraticCurveTo(0,-74,24,-46); g.lineTo(24,6); g.closePath(); g.fill();
      if(!open){ g.strokeStyle='#8a6ad0'; g.lineWidth=4; g.beginPath(); g.moveTo(-24,-30); g.lineTo(24,-10); g.moveTo(24,-30); g.lineTo(-24,-10); g.stroke(); }
      f2wSnowCap(g,-50,50,-96,6,mulberry32(17)); }),o.x,o.y); if(open) glowAt(o.x,o.y-30,26,'150,120,220',0.15); }},
  // what freezes along with a Frozen Folk person: a cow, Nisse the goat, a fish on a line, a soup pot, a sled
  frzdeco:{R:60,by:0,col:false,draw(o,t){ const f=o.f, ice=f&&(f.st==='ice'||f.st==='pop'), K=o.kind;
      if(K==='goat'&&!ice) return; if(K==='fish'&&!ice) return;
      const key='fd_'+K+(ice?1:0); f2wPut(f2wTall(key,80,70,40,52,g=>{
        if(K==='cow'){ f2wEll(g,0,4,30,7,'rgba(40,40,70,.3)'); g.fillStyle='#3a3238'; for(const lx of [-16,-8,8,16]) g.fillRect(lx-2,-6,4,12); celFill(g,(q,dx,dy)=>q.ellipse(dx,-14+dy,26,14,0,0,TAU),'#f2efe8',{r:24}); f2wEll(g,-8,-18,7,5,'#3a3238'); f2wEll(g,10,-10,6,4,'#3a3238'); celFill(g,(q,dx,dy)=>q.ellipse(28+dx,-20+dy,10,8,0,0,TAU),'#f2efe8',{r:10}); f2wEll(g,34,-18,5,4,'#e8a0a0'); f2wEll(g,26,-24,1.4,1.4,'#1a1a20'); g.strokeStyle='#d8c8a0'; g.lineWidth=2; g.beginPath(); g.moveTo(22,-28); g.lineTo(18,-34); g.moveTo(30,-28); g.lineTo(32,-35); g.stroke(); }
        else if(K==='goat'){ f2wEll(g,0,4,20,6,'rgba(40,40,70,.3)'); g.fillStyle='#3a3238'; for(const lx of [-10,-4,4,10]) g.fillRect(lx-1.6,-4,3.2,9); celFill(g,(q,dx,dy)=>q.ellipse(dx,-10+dy,16,9,0,0,TAU),'#f2f0ea',{r:16}); celFill(g,(q,dx,dy)=>q.ellipse(16+dx,-16+dy,7,6,0,0,TAU),'#f2f0ea',{r:7}); f2wEll(g,18,-17,1.2,1.2,'#1a1a20'); g.fillStyle='#a9daf4'; g.beginPath(); g.moveTo(16,-11); g.lineTo(18,-2); g.lineTo(20,-11); g.fill(); g.strokeStyle='#3a3238'; g.lineWidth=1.6; g.beginPath(); g.moveTo(14,-21); g.quadraticCurveTo(10,-28,15,-29); g.stroke(); }
        else if(K==='fish'){ g.strokeStyle='rgba(240,240,240,.85)'; g.lineWidth=1; g.beginPath(); g.moveTo(-30,-44); g.quadraticCurveTo(-10,-50,6,-34); g.stroke(); celFill(g,(q,dx,dy)=>q.ellipse(8+dx,-26+dy,5,10,0.4,0,TAU),'#9ab0c0',{r:8}); g.fillStyle='#6a8090'; g.beginPath(); g.moveTo(12,-16); g.lineTo(18,-12); g.lineTo(14,-20); g.fill(); }
        else if(K==='pot'){ f2wEll(g,0,4,16,5,'rgba(40,40,70,.3)'); celFill(g,(q,dx,dy)=>q.ellipse(dx,-6+dy,14,11,0,0,TAU),'#3a3e48',{r:14}); f2wEll(g,0,-14,12,4,ice?'#d8e8f4':'#c8a060'); g.strokeStyle='#8a6a4a'; g.lineWidth=2; g.beginPath(); g.moveTo(-4,-14); g.lineTo(-10,-30); g.stroke(); }
        else if(K==='sled'){ g.save(); g.rotate(-0.2); f2wEll(g,2,4,20,4,'rgba(40,40,70,.25)'); g.strokeStyle='#5a4428'; g.lineWidth=2; g.beginPath(); g.moveTo(-18,2); g.lineTo(16,2); g.quadraticCurveTo(22,2,20,-4); g.stroke(); f2wShade(g,-16,-6,30,6,'#c8463a'); g.restore(); }
        if(ice){ g.fillStyle='rgba(196,178,242,.42)'; rrect(g,-36,-46,72,52,10); g.fill(); g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-24,-40); g.lineTo(-16,-4); g.stroke(); } }),o.x,o.y); }}
});
// ---------- the Steamwell's snow monkeys: three bathe; stand in the steam for 5 s and the cheekiest steals your hat
// and runs; catch him and he drops the key to the chest on the rock in the middle of the spring (secret 2)
function f2wMonkeyInit(){
  const M=F2WD.mk={t:0,steam:0,run:null,key:false,list:[]};
  const S0=F2WG.steam; for(let i=0;i<3;i++){ const a=-0.6+i*0.9; M.list.push({x:S0.x+Math.cos(a)*S0.r*0.62-20,y:S0.y+Math.sin(a)*S0.r*0.5,ph:i*1.7,cheeky:i===1}); }
  if(G&&G.found&&G.found.f_steam_key) M.key=true;
  return M;
}
function f2wMonkeyTick(dt){
  const M=F2WD.mk||f2wMonkeyInit(), S0=F2WG.steam, p=player; if(!p||curMap()!==2) return;
  if(G.found.f_sec_steam||M.key){ M.run=null; return; }
  const d=dist(p.x,p.y,S0.x,S0.y);
  if(!M.run){ if(d<S0.r+70&&!airborne()){ M.steam+=dt; if(M.steam>5){ const c=M.list[1]; M.run={x:c.x,y:c.y,t:0,hat:G.hat||null,path:[[S0.x+260,S0.y-180],[S0.x+520,S0.y+40],[S0.x+300,S0.y+300],[S0.x-200,S0.y+260],[S0.x-320,S0.y-80],[S0.x+40,S0.y-260]],pi:0};
        if(G.hat){ M.run.oldHat=G.hat; G.hat=null; } f2wSnd('monkey',1); ftext(p.x,p.y-56,M.run.oldHat?S('Hey! My hat!','My hat!'):S('Hey! Give that back!','Hey!'),'#ffb070',14); setBanner(S('A snow monkey!','A snow monkey!'),S('The cheekiest one grabbed something and ran. Catch him!','Catch the monkey!'),2.4); } } else M.steam=Math.max(0,M.steam-dt*0.5); return; }
  const R=M.run; R.t+=dt; const tg=R.path[R.pi], ang=angTo(R.x,R.y,tg[0],tg[1]), dd=dist(R.x,R.y,tg[0],tg[1]), sp=d<160?250:170;
  if(dd<30) R.pi=(R.pi+1)%R.path.length; else{ const nx=R.x+Math.cos(ang)*sp*dt, ny=R.y+Math.sin(ang)*sp*dt; if(!blockedAt(nx,ny)){ R.x=nx; R.y=ny; } else R.pi=(R.pi+1)%R.path.length; }
  if(Math.random()<dt*2) f2wSnd('monkey',0.4);
  if(dist(p.x,p.y,R.x,R.y)<34){ M.key=true; G.found.f_steam_key=true; if(R.oldHat) G.hat=R.oldHat; M.run=null; f2wSnd('monkey',1); SFX.play('pickup');
    setBanner(S('Caught him!','Got him!'),S('He gives your hat back and drops a little iron key. It fits the chest on the rock in the spring.','He drops a key for the chest on the rock!'),3); saveGame(); }
}
function f2wDrawMonkeys(o,t){
  const M=F2WD.mk||f2wMonkeyInit(), S0=F2WG.steam;
  // the steam over the spring
  for(let i=0;i<5;i++){ const k=((t*0.18+i/5)%1); ctx.fillStyle=`rgba(255,255,255,${0.32*Math.sin(k*Math.PI)})`; ctx.beginPath(); ctx.ellipse(S0.x+Math.sin(i*2.1+t*0.3)*90,S0.y-20-k*90,40+k*30,18+k*10,0,0,TAU); ctx.fill(); }
  for(let i=0;i<M.list.length;i++){ const m=M.list[i]; if(m.cheeky&&M.run) continue; f2wMonkey(m.x,m.y+Math.sin(t*1.2+m.ph)*1.5,true,t+m.ph,false); }
  if(M.run) f2wMonkey(M.run.x,M.run.y,false,t*3,!!M.run.oldHat);
}
function f2wMonkey(x,y,bath,t,hat){
  const ol=LOOK.sb?SBC.outline:'#3a2a2a';
  if(!bath){ ctx.fillStyle='rgba(40,40,70,.25)'; ctx.beginPath(); ctx.ellipse(x,y+4,10,3.6,0,0,TAU); ctx.fill(); }
  const by=bath?y:y-8-Math.abs(Math.sin(t*4))*4;
  ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(x,by,10,9,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x,by-10,7.4,0,TAU); ctx.fill();
  ctx.fillStyle='#b8aea4'; ctx.beginPath(); ctx.ellipse(x,by,8.8,7.8,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x,by-10,6.2,0,TAU); ctx.fill();
  ctx.fillStyle='#e88a8a'; ctx.beginPath(); ctx.ellipse(x,by-9,4,3.6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#2a1a1a'; ctx.beginPath(); ctx.arc(x-1.6,by-10,0.9,0,TAU); ctx.arc(x+1.6,by-10,0.9,0,TAU); ctx.fill();
  if(bath){ ctx.fillStyle='rgba(120,222,214,.75)'; ctx.beginPath(); ctx.ellipse(x,by+4,13,5,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(x-3,by+3,5,1.4,0,0,TAU); ctx.fill(); }
  if(hat){ ctx.fillStyle='#e84a8a'; ctx.beginPath(); ctx.moveTo(x-5,by-15); ctx.lineTo(x,by-28); ctx.lineTo(x+5,by-15); ctx.closePath(); ctx.fill(); ctx.fillStyle='#ffd84a'; ctx.beginPath(); ctx.arc(x,by-28,2,0,TAU); ctx.fill(); }
}

// ================= 6. elevation (bible 3.4): Mount Dread and the Crown, the Shoulder Ledge, the Dreadmoor, the glacier
// tongue, the lake's pressure ridges, Rimeholm's terrace, tower, chapel and bluff, the Windscour, the Sky Isles, the
// Stonehorn mesas, Mumble's Hollow, the Whitepass ridge and the Warm Cave cliffs, the Great Hearth's dais, the shipwreck
ELEV.style('f_dread',{face:'#3a3248',lit:'#564a6c',dark:'#1e1828',lip:'#c8b8f0',out:'#0c0814',top:'#5e5472',topK:0.03,tex:'facet'});
ELEV.style('f_moor',{face:'#5a5068',lit:'#746a86',dark:'#3a3248',lip:'#f0ecff',out:'#140e1e',top:'#8a82a0',topK:0.02,tex:'crack'});
ELEV.style('f_snow',{face:'#8a96a8',lit:'#a8b4c4',dark:'#606c80',lip:'#ffffff',out:'#283040',top:'#f4f7fb',topK:0.04,tex:'crack'});
ELEV.style('f_red',{face:'#a8664a',lit:'#c4805e',dark:'#7a4430',lip:'#fff2ea',out:'#3a1a10',top:'#c8907a',topK:0.02,tex:'layers'});
ELEV.style('f_isle',{face:'#e6e2f0',lit:'#fbf8ff',dark:'#c2bad6',lip:'#ffe39a',out:'#5a4a6a',top:'#f4f2fa',topK:0.02,tex:'layers'});
ELEV.style('f_wood',{face:'#6a4a2c',lit:'#8e6a40',dark:'#4a3420',lip:'#d8b47a',out:'#2a1a10',top:'#8e6a40',topK:0.22,tex:'layers'});
ELEV.style('f_wind',{face:'#9a8e74',lit:'#b8ac8e',dark:'#6e6450',lip:'#fffaf0',out:'#2e2618',top:'#d4cca8',topK:0.02,tex:'crack'});
ELEV.style('f_stone',{face:'#a8a49c',lit:'#c4c0b8',dark:'#7e7a72',lip:'#ffffff',out:'#3a3430',top:'#e6e6ea',topK:0.03,tex:'crack'});
ELEV.style('f_slate',{face:'#c8c0b0',lit:'#e2dccc',dark:'#a49c8c',lip:'#ffffff',out:'#3a3430',top:'#5e6e8a',topK:0.3,tex:'layers'});
// an arc band polygon (a ring wall with an opening): centre, radii, angles in radians
function f2wArc(cx,cy,r0,r1,a0,a1,n){ const P=[]; n=n||24; for(let i=0;i<=n;i++){ const a=lerp(a0,a1,i/n); P.push([cx+Math.cos(a)*r1,cy+Math.sin(a)*r1]); } for(let i=n;i>=0;i--){ const a=lerp(a0,a1,i/n); P.push([cx+Math.cos(a)*r0,cy+Math.sin(a)*r0]); } return P; }
const F2WE={
  // Rimeholm's tower, chapel and Sigrun's smoke yard; the dog's shelf on the Windscour's face; the gulch ledge
  tower:[1860,46700,2000,46800], chapel:[1630,46600,1770,46700], plinth:[2240,47150,2380,47250],
  dogShelf:[9230,47640,9470,47790], gulchLedge:[5320,50520,5440,50640],
  ridges:[[4200,45000,4700,45080],[5400,46900,6000,46980],[3600,46000,3680,46500]],
  deck:[1380,42560,1820,42690], crownLedge:[7160,40690,7440,40810], eastSlab:[7780,41150,110]
};
function f2wElev(){
  // (e3 colours a stair by the plateau found at its middle; an east or west stair's middle is off the plateau it climbs
  // to, and then e3 used the first plateau of the map, Mount Dread's dark violet: a stair says its own colours, `st`)
  const k=2, pl=(d)=>ELEV.plateau(Object.assign({k},d)), rp=(d)=>ELEV.ramp(Object.assign({k,kind:'stairs'},d.st?{look:elvStyle(d.st)}:{},d));
  // ---- Mount Dread: the massif (with a notch for the Shoulder Ledge), the inner tier, the Crown, its two raised stones
  pl({poly:F2WG.massif,holes:[{poly:F2WG.notch}],lvl:4,style:'f_dread',noise:40,id:'f_massif'});
  pl({rect:[6200,40400,8600,42600],lvl:5,style:'f_dread',noise:50,id:'f_dread5'});
  pl({disc:[F2WG.crown.x,F2WG.crown.y,F2WG.crown.r],lvl:6,style:'f_dread',noise:18,id:'f_crown'});
  pl({rect:F2WE.crownLedge,lvl:7,style:'f_dread',climb:true,noise:4,id:'f_crown_north'});
  pl({disc:F2WE.eastSlab,lvl:8,style:'ice',noise:6,id:'f_crown_east'});
  pl({poly:F2WG.shoulder,lvl:3,style:'f_dread',noise:12,id:'f_shoulder'});
  pl({poly:F2WG.tongue,lvl:3,style:'ice',noise:20,id:'f_tongue'});
  // ---- the Dreadmoor (the plaza of the Dreadgate) and its two ways up
  pl({rect:F2WG.dreadmoor,lvl:1,style:'f_moor',noise:50,id:'f_dreadmoor'});
  rp({x0:7220,y0:44650,x1:7380,y1:44790,dir:'n'});                                  // the White Road stairs
  rp({x0:6140,y0:44450,x1:6300,y1:44600,dir:'e',st:'f_moor'});                                  // the west end, by Glimmer Point
  // ---- the Glimmerfrost's pressure ridges (Double Jump)
  F2WE.ridges.forEach((r,i)=>pl({rect:r,lvl:1,style:'ice',step:true,noise:4,id:'f_ridge'+i}));
  // ---- Rimeholm: the terrace, the bell tower (claws), the chapel roof and the smoke yard (steps), the bluff behind
  pl({rect:F2WG.terrace,lvl:1,style:'f_stone',noise:14,id:'f_terrace'});
  rp({x0:2690,y0:47150,x1:2850,y1:47300,dir:'w',st:'f_stone'});
  ELEV.ledge({k,x0:1286,y0:46700,x1:1372,y1:47100});
  pl({rect:F2WE.tower,lvl:3,style:'f_stone',climb:true,noise:0,id:'f_belltower'});
  pl({rect:F2WE.chapel,lvl:2,style:'f_slate',step:true,noise:0,id:'f_chapel'});
  pl({rect:F2WE.plinth,lvl:2,style:'f_stone',step:true,noise:0,id:'f_smokeyard'});
  pl({poly:F2WG.bluff,lvl:2,style:'f_snow',noise:30,id:'f_bluff'});
  // ---- the Windscour: the plateau, its climbable stretch, the dog's shelf, the shelf and the ramps of the Wind Road
  pl({poly:F2WG.windscour,lvl:2,style:'f_wind',noise:30,id:'f_windscour'});
  pl({rect:[9230,47540,9470,47652],lvl:2,style:'f_wind',climb:true,noise:3,id:'f_windclimb'});
  pl({rect:F2WE.dogShelf,lvl:1,style:'f_wind',climb:true,noise:3,id:'f_dogshelf'});
  pl({rect:[9700,47600,10300,47950],lvl:1,style:'f_wind',noise:8,id:'f_windshelf'});
  rp({x0:9880,y0:47940,x1:10020,y1:48100,dir:'n'}); rp({x0:9980,y0:47590,x1:10120,y1:47710,dir:'n'});
  ELEV.fall({k,x:9760,y:47952,w:30,kind:'water'});
  // ---- the Sky Isles (white stone with gold trim)
  for(const I of F2WG.isles) pl({disc:[I.x,I.y,I.r],lvl:I.lvl,style:'f_isle',noise:0,id:'f_isle'+I.id});
  // ---- the Stonehorn Badlands: the base, the Rune Drum mesa (claws), the Mammoth Graveyard (stairs), two horn rocks
  pl({rect:[9200,40000,14000,43600],lvl:2,style:'f_red',noise:40,id:'f_stonehorn'});
  pl({disc:[13300,41400,300],lvl:3,style:'f_red',climb:true,noise:14,id:'f_runedrum'});
  pl({disc:[11000,41700,260],lvl:3,style:'f_red',noise:12,id:'f_graveyard'});
  rp({x0:10940,y0:41930,x1:11060,y1:42030,dir:'n'});
  pl({disc:[12800,42880,92],lvl:3,style:'f_red',noise:5,id:'f_horn1'}); pl({disc:[11600,41980,84],lvl:3,style:'f_red',noise:5,id:'f_horn2'});
  // ---- Mumble's Hollow (climbable, with a back ramp), the Whitepass ridge, the Warm Cave cliffs
  pl({disc:[13050,48330,220],lvl:2,style:'f_snow',climb:true,noise:10,id:'f_hollow'});
  rp({x0:13250,y0:48290,x1:13390,y1:48420,dir:'w',st:'f_snow'});
  pl({poly:[[1700,48650],[3200,48650],[3100,49150],[1800,49150]],lvl:1,style:'f_snow',noise:16,id:'f_ridge'});
  rp({x0:1660,y0:48840,x1:1810,y1:48980,dir:'e',st:'f_snow'}); rp({x0:3080,y0:48840,x1:3230,y1:48980,dir:'w',st:'f_snow'});
  pl({poly:[[-200,48150],[600,48060],[1100,48320],[1350,48700],[1320,49200],[1290,49560],[-200,49560]],lvl:2,style:'f_snow',noise:24,id:'f_westcliff'});
  pl({rect:[860,49280,1100,49610],lvl:2,style:'f_snow',climb:true,noise:3,id:'f_westclimb'});
  // ---- Snowgob Gulch: a ring of rock open to the north, the crate ledge (claws) inside
  pl({poly:f2wArc(5200,50620,250,350,-Math.PI*0.32,Math.PI*1.32,26),lvl:1,style:'f_snow',noise:10,id:'f_gulch'});
  pl({rect:F2WE.gulchLedge,lvl:2,style:'f_snow',climb:true,noise:3,id:'f_gulchledge'});
  // ---- the Great Hearth's dais (stairs on four sides) and the shipwreck's deck
  pl({disc:[6800,48950,150],lvl:1,style:'f_stone',noise:0,id:'f_dais'});
  rp({x0:6760,y0:49070,x1:6840,y1:49160,dir:'n',st:'f_stone'}); rp({x0:6930,y0:48910,x1:7000,y1:48990,dir:'w',st:'f_stone'}); rp({x0:6600,y0:48910,x1:6670,y1:48990,dir:'e',st:'f_stone'}); rp({x0:6760,y0:48790,x1:6840,y1:48830,dir:'s',st:'f_stone'});
  pl({rect:F2WE.deck,lvl:1,style:'f_wood',noise:0,id:'f_deck'});
  // ---- updrafts (Wings, and the starts of the wind roads)
  // (the Hush plaza's vents and lamps and the Crown's vent and ribbon are the boss module's: F2WORLD.md 6)
  for(const [x,y,r,lift] of [[9200,45200,110,1],[10950,46700,120,2],[10000,44450,100,1],[10880,44480,100,1],[8800,44450,100,1],[12080,46300,90,1]]) ELEV.vent({k,x,y,r,lift});
  // ---- no flying over Mount Dread (the Shard Blizzard) or the Howling Gap
  ELEV.noFly({k,rect:[5400,40000,9400,44700],why:S('The Shard Blizzard slaps you right out of the sky.','The storm knocks you down!')});
  ELEV.noFly({k,rect:[9200,43400,14000,44400],why:S('The Howling Gap howls you right back down.','The wind pushes you down!')});
  // ---- grapple posts (the Grapple Tail)
  for(const [x,y,l] of [[11790,46430,4],[420,47420,0],[2050,42180,0],[1450,42640,1],[12800,42860,3],[11600,41960,3],[7200,40760,7]]) ELEV.grapple({k,x,y,lvl:l});
  // ---- keep the arenas, the town squares and the doorsteps clear of trees and rocks
  ELEV.clear({k,disc:[F2WG.crown.x,F2WG.crown.y,640]}); ELEV.clear({k,disc:[7300,44260,470]}); ELEV.clear({k,disc:[5600,44470,200]});
  ELEV.clear({k,disc:[12650,46150,300]}); ELEV.clear({k,disc:[F2WG.town.x,F2WG.town.y,640]}); ELEV.clear({k,rect:[1290,46300,2710,47710]});
  ELEV.clear({k,disc:[11400,49600,330]}); ELEV.clear({k,disc:[8400,43450,260]}); ELEV.clear({k,disc:[12200,42500,230]});
}

// ================= 7. the map and everything placed on it
// is the Act III story module in? (its stages carry objectives). Until it is, the world's story gates stay open so
// the whole map can be explored in a world-only build; once it is, the bible's gates hold. F2WD.forceGates forces them.
// (f2wStoryIn: the story module itself is loaded; then the world's stand-in story actions below step aside)
const f2wStoryIn=()=>!!(typeof STAGEDEF!=='undefined'&&STAGEDEF.f_snow&&(STAGEDEF.f_snow.objectives||STAGEDEF.f_snow.talk));
const f2wStory=()=>!!(F2WD.forceGates||f2wStoryIn());
const f2wGate=s=>!f2wStory()||f2wReached(s);
// house looks: Hearthold is pale stone and timber under red, slate and blue roofs, red and blue doors, snow on every roof
// (until the Hearth burns blue); Rimeholm is weathered grey boards under slate and brown roofs, glazed in ice
function f2wHzHearth(hs,L){ const r=hs.seed>>>0; return {wc:['#ece6da','#e4dccc','#efe9de','#e0d8c8','#e8e0d2'][r%5],rc:hs.roof||['#a8463a','#46668a','#5a5a6e'][(r>>3)%3],trim:'#5a4030'}; }
function f2wHzRime(hs,L){ const r=hs.seed>>>0; return {wall:'plank',wc:['#c8ced6','#bcc4ce','#d0d4da','#c2c8d0'][r%4],rc:['#5a6a7e','#7a5a3e','#6a7486'][(r>>3)%3],trim:'#eef2f6'}; }
// one house: {x,y,w,h,town,want (the CAST id that should live here), roof, snow}
function f2wHouse(B,o){
  const hs={k:'house',x:o.x,y:o.y,w:o.w,h:o.h,vert:!!o.vert,roof:o.roof||null,burnt:false,seed:o.seed!=null?o.seed:Math.floor(B.rng()*1e9),snow:o.snow!==false,town:o.town};
  if(o.want) hs.want=o.want; if(o.f2) hs.f2=o.f2;
  HOUSES.push(hs); STRUCTS.push(hs);
  addCol({t:'r',x0:hs.x-hs.w/2,y0:hs.y-hs.h/2,x1:hs.x+hs.w/2,y1:hs.y+hs.h/2});
  if(o.lamp!==false){ const lx=hs.x-Math.max(30,hs.w*0.36), ly=hs.y+hs.h/2+14; f2wObj('lamp',lx,ly); }
  return hs;
}
// foes the Act III foes helper defines; until it lands, similar stock foes stand in (looked up when a camp spawns)
const F2WFOE_FALL={f_rimehound:'wolf',f_snowgob:'kobold',f_frostshell:'slime',f_mothling:'c_moth',f_stalagbat:'bat',f_rimeknight:'knight',f_shardling:'c_moth'};
const f2wFoe=t=>EDEF[t]?t:(F2WFOE_FALL[t]&&EDEF[F2WFOE_FALL[t]]?F2WFOE_FALL[t]:(t==='f_mothling'||t==='f_shardling')&&EDEF.bat?'bat':'kobold');
const F2WCAMPS=[
  ['f_c1',3900,50500,[['f_snowgob',4]]],['f_c2',4800,49850,[['f_rimehound',3]]],['f_c3',8650,49950,[['f_frostshell',2],['f_snowgob',2]]],
  ['f_c4',3850,46350,[['f_rimehound',3],['f_stalagbat',2]]],['f_c5',3000,48300,[['f_rimeknight',1],['f_snowgob',3]]],['f_c6',9400,45600,[['f_mothling',4],['f_rimehound',2]]],
  ['f_c7',10700,45100,[['f_frostshell',3]]],['f_c8',12600,50300,[['f_rimehound',4]]],['f_c9',11700,41750,[['f_rimeknight',2],['f_frostshell',2]]],
  ['f_c10',8700,44150,[['f_shardling',3],['f_rimeknight',2]]],['f_gulch',5200,50620,[['f_snowgob',6]],{king:true}]];
// the dungeons whose doors are on this map: a minimal placeholder is registered when a dungeon helper has not defined
// the area yet (clearly marked; defineDungeon by the dungeon helper replaces it)
const F2WAREAS={f_maze:[S('The Glacier Maze','The Glacier Maze'),14,'ice'],f_sky:[S('Skyreach Temple','Skyreach Temple'),15,'crystal'],
  f_deep:[S('Stonehorn Deep','Stonehorn Deep'),16,'mine'],f_dread:[S('The Heart of Dread','The Heart of Dread'),17,'crystal']};
const F2WPH_TPL=['...............','...............','...............','.....s.........','...............','...............','...............','...............','...............','...............','...............'];
function f2wPlaceholders(){
  F2WD.ph=[];
  for(const id in F2WAREAS){ if(AREADEFS[id]) continue; const [name,level,theme]=F2WAREAS[id];
    try{ defineDungeon(id,{name,level,theme,seed:3100+id.length*13,save:id,placeholder:true,dark:0.2,noJuniper:true,
      floors:[{id:'1',name,map:{rooms:{a:{at:[0,0],kind:'start',tpl:F2WPH_TPL,noPots:true,sign:S(`PLACEHOLDER: ${name} is being built. Come back soon!`,`${name} is not built yet.`)}},links:[]}}]}); F2WD.ph.push(id); }
    catch(e){ defCave(id,{name,level,theme,seed:3100,enemies:[],placeholder:true}); F2WD.ph.push(id); }
  }
  // the Warm Cave behind the frozen waterfall (secret 5): three small rooms, sleeping snow foxes, a heal fountain, a chest
  if(!AREADEFS.f_warmcave) defineDungeon('f_warmcave',{name:S('The Warm Cave','The Warm Cave'),level:13,theme:'ice',seed:3141,save:'f_warmcave',dark:0.15,noJuniper:true,dunKind:S('A hidden cave','A hidden cave'),
    story:{in:[['narr',S('Behind the ice it is warm. Water drips. Somewhere, something small is snoring.','It is warm in here. Something snores.')]]},
    floors:[{id:'1',name:S('The Warm Cave','The Warm Cave'),map:{rooms:{
      a:{at:[0,1],kind:'start',tpl:['...............','.##.........##.','.#...........#.','...............','.......s.......','...............','...............','.#...........#.','.##.........##.','...............','...............'],noPots:true,
        sign:S('Scratched in the rock, very small: SHHH. FOXES SLEEPING.','It says: SHHH. FOXES SLEEPING.')},
      b:{at:[0,0],kind:'free',tpl:['...............','..#.........#..','...............','...............','.......F.......','...............','....~~...~~....','....~~...~~....','...............','..#.........#..','...............'],noPots:true},
      c:{at:[1,0],kind:'treasure',tpl:['...............','.#...........#.','...............','...............','.......X.......','...............','...............','...............','.#...........#.','...............','...............'],loot:['ore'],noPots:true}},
      links:[['a','b','open'],['b','c','open']]}}]});
}
// the doors of the dungeons (bible 7) and the small areas
function f2wDoors(B){
  const gate=(area,need,locked,o)=>{ const d=DOORS.find(q=>q.area===area&&!q.f2w); if(d){ d.f2w=true; d.need=need; d.locked=locked; if(o) Object.assign(d,o); } return d; };
  B.cave({area:'f_maze',x:5600,y:44436,theme:'f_glacier',noNudge:true,name:S('The Glacier Maze','The Glacier Maze'),label:S('Enter the Glacier Maze','Go in the Glacier Maze')});
  gate('f_maze',()=>f2wGate('f_maze'),S('Wind howls out of the ice. You should talk to the Hearthkeeper in Hearthold first.','Talk to the Hearthkeeper first.'));
  B.door({x:12650,y:46486,area:'f_sky',label:S('Enter Skyreach Temple','Go in the temple'),outY:30,f2w:true,need:()=>f2wGate('f_sky'),locked:S('The temple doors are shut tight against the wind. Maybe somebody in Rimeholm knows why you would want to come here.','The doors are shut. Ask in Rimeholm.')});
  B.door({x:12200,y:42466,area:'f_deep',label:S('Enter Stonehorn Deep','Go in Stonehorn Deep'),outY:34,f2w:true,need:()=>f2wGate('f_gap'),locked:S('A ram skull the size of a cottage, with a door in its mouth. Something deep inside is snoring. Not yet.','Something big snores inside. Not yet.')});
  B.door({x:7300,y:44172,area:'f_dread',label:S('Enter the Heart of Dread','Go in the Heart of Dread'),outY:40,f2w:true,need:()=>F2WF('f_hush_done'),locked:S('The Dreadgate is locked with a Frost Lock as big as a cart. It hums. It will not budge.','The Frost Lock will not budge.')});
  // the summit door on the Crown (the way back down into the mountain, once it is open)
  B.door({x:7060,y:41662,area:'f_dread',label:S('Go back down into the mountain','Go back down'),outY:30,f2w:true,f2room:'n',need:()=>F2WF('f_crown_open'),locked:S('A door of black ice, shut from the inside.','It is shut from inside.')});
  B.door({x:1200,y:49610,area:'f_warmcave',label:S('Go into the Warm Cave','Go in the cave'),outY:40,f2w:true,need:()=>!!(F2WD.warmFall&&F2WD.warmFall.done),locked:S('A frozen waterfall hangs over a dark gap in the cliff. Warm air puffs out of a crack in the ice.','A frozen waterfall. Warm air comes out!')});
}
function f2wBuild(B){
  F2WD.built=true; F2WD.B=B;
  f2wElev();
  f2wPlaceholders();
  // ---- places (bible 3.7 POIs)
  B.poi('f_hearthold',{x:6800,y:49000,r:620,name:S('Hearthold','Hearthold'),level:13,town:true});
  B.poi('f_rimeholm',{x:1900,y:47000,r:520,name:S('Rimeholm','Rimeholm'),level:14,town:true});
  B.poi('f_haskrest',{x:11400,y:49600,r:300,name:S("Hask's Rest","Hask's Rest"),level:14,town:true});
  for(const [key,x,y,r,name,level] of [['f_whitepass',2600,50450,260,S('the High Pass','the High Pass'),13],['f_glacier',5600,44450,420,S('the Glacier Mouth','the Glacier Mouth'),14],
    ['f_steamwell',3800,49400,220,S('the Steamwell','the Steamwell'),13],['f_skyreach',12650,46150,420,S('Skyreach Temple','Skyreach Temple'),15],['f_stonehorn',12200,42500,360,S('the Horned Gate','the Horned Gate'),16],
    ['f_dreadgate',7300,44300,420,S('the Dreadgate','the Dreadgate'),16],['f_shoulder',8400,43420,300,S('the Shoulder Ledge','the Shoulder Ledge'),16],['f_crown',7300,41250,560,S('the Crown of Dread','the Crown of Dread'),17],
    ['f_mumble',13050,48500,240,S("Mumble's Hollow","Mumble's Hollow"),14],['f_wreck',1600,42600,300,S('the Frozen Shipwreck','the Frozen Shipwreck'),15],['f_sledhill',7900,48250,200,S("Soren's Sled Hill","Soren's Sled Hill"),13]])
    B.poi(key,{x,y,r,name,level});
  B.town('f_hearthold',{name:'Hearthold',music:'town',generics:{ties:['Ulf at Frostpine Lodge','Elka the sledder','Maren the blacksmith','the Wind Monks']},hz:f2wHzHearth});
  B.town('f_rimeholm',{name:'Rimeholm',music:'tender',generics:{ties:['Grandmother Ylva','old Rasmus at the forge','the bell','the Snow Mother']},hz:f2wHzRime});
  B.town('f_haskrest',{name:"Hask's Rest",music:'town',generics:false,hz:f2wHzHearth});
  // ---- Hearthold: named houses (bible 4.1), then the neighbours' houses
  const HH='f_hearthold';
  for(const [x,y,w,h,want,roof] of [[6560,48700,190,120,'f_hilde','#a8463a'],[6380,48800,110,80,'f_brann','#46668a'],[7110,48850,160,100,'f_toastwhistle','#a8463a'],[7270,48880,100,80,'f_soren','#46668a'],
    [6470,49230,160,110,'f_gunnhild','#5a5a6e'],[6620,49390,120,80,'f_brynja','#a8463a'],[6990,49250,150,120,'f_eider','#46668a'],[7240,49120,120,90,'f_mags','#5a5a6e']])
    f2wHouse(B,{x,y,w,h,town:HH,want,roof,seed:7300+x%97});
  for(const [x,y,w,h,roof] of [[6650,48560,110,80,'#46668a'],[6950,48560,110,80,'#a8463a'],[6330,49100,110,80,'#5a5a6e'],[6760,49480,110,80,'#46668a'],[6960,49440,110,80,'#a8463a']])
    f2wHouse(B,{x,y,w,h,town:HH,roof,seed:7400+x%89});
  // ---- Rimeholm: the eight named villagers' houses (the cook's is her smokehouse), then four neighbours
  const RH='f_rimeholm';
  for(const [x,y,w,h,want] of [[2120,46520,120,80,'f_ylva'],[2060,46950,110,80,'f_tollef'],[1080,47300,100,80,'f_saga'],[2160,47230,120,90,'f_sigrun'],[2560,47250,110,80,'f_nils'],[1560,46980,100,80,'f_oskar'],[2460,46470,130,90,'f_rasmus']])
    f2wHouse(B,{x,y,w,h,town:RH,want,seed:7500+x%83});
  for(const [x,y,w,h] of [[1700,47350,110,80],[1950,47450,110,80],[2350,46960,110,80],[1500,46750,100,80]]) f2wHouse(B,{x,y,w,h,town:RH,seed:7600+x%79});
  // ---- Hask's Rest: the Big Tent is Hask's home (a door at its flap); the other tents and the kennel are the camp
  F2WD.homes.push({want:'f_hask',town:'f_haskrest',door:{x:11400,y:49492,outY:22},name:S('The Big Tent','The Big Tent')});
  // ---- shrines (bible 3.7)
  for(const [id,x,y,name] of [['s_f_whitepass',2960,50380,S('Whitepass Shrine','Whitepass Shrine')],['s_f_hearthold',7150,49260,S('Hearth Shrine','Hearth Shrine')],['s_f_glimmer',6820,44880,S('Glimmer Point Shrine','Glimmer Point Shrine')],
    ['s_f_rimeholm',2450,47450,S('Rimeholm Shrine','Rimeholm Shrine')],['s_f_windscour',10280,47330,S('Windscour Shrine','Windscour Shrine')],['s_f_haskrest',11150,49850,S("Trapper's Shrine","Trapper's Shrine")],
    ['s_f_stonehorn',11500,43050,S('Hornwatch Shrine','Hornwatch Shrine')],['s_f_dreadmoor',8050,44850,S('Dreadmoor Shrine','Dreadmoor Shrine')]]) B.shrine({id,x,y,name});
  // ---- camps (bible 3.7); the foe types are looked up when a camp spawns (stand-ins until the foes helper lands)
  for(const [id,x,y,units,o] of F2WCAMPS){
    const c=Object.assign({id,x,y,want:units},o||{});
    Object.defineProperty(c,'units',{get(){ return units.map(([t,n])=>[f2wFoe(t),n]); },configurable:true});
    B.camp(c);
  }
  // ---- star-iron on the second horn rock (Grapple Tail)
  B.ore({id:'f_o_horn',x:11600,y:41960});
  f2wDoors(B);
  f2wTown(B); f2wRime(B); f2wHask(B);
  f2wPlaces(B);
  f2wSledLine(B);
  f2wPaint();
}
// The Act III stages (and defineAct(3,{arrive,at})) belong to the story helper (x2_story); this module defines none.
// Until they exist, __eb.actStart(3) puts Ash at this map's spawn: the top of the High Pass.
defineMap(2,{id:'frost',name:S('Frostreach','Frostreach'),music:'frost',spawn:{x:2600,y:50540},chests:26,
  ambient:{snow:0.5,wind:0.4,birds:true,rain:0},sky:{tint:'#e2ecff',k:0.1},
  terrain:{seeds:F2WSEEDS,roads:F2WROADS,
    rivers:[{pts:[[5650,47330],[5700,48100],[5600,48900],[5750,49700],[5900,50400],[5950,51200]],w:56},{pts:[[9760,48000],[9900,48500],[10050,49300],[10200,50200],[10250,51200]],w:48}],
    ponds:F2WG.holes.concat([F2WG.moat,F2WG.hask,F2WG.steam],F2WG.quayHoles),
    isles:F2WG.floes.concat([F2WG.stack,F2WG.steamRock]),
    walkways:[{x0:620,y0:46960,x1:930,y1:47000},{x0:11785,y0:49930,x1:11825,y1:50060}],
    sea:{land:F2WG.land,shore:60,shelf:170,noise:110},
    extra:f2wExtra, block:f2wBlock},
  onEnter(from){ f2wSync(true); },
  build(B){ f2wBuild(B); },
  crossings:[
    {id:'f_pass_s',x:950,y:3250,to:{x:2600,y:50500},label:S('Climb the High Pass','Climb the High Pass'),name:S('The High Pass','The High Pass'),kind:'pass',dir:-Math.PI/2,
      need:()=>f2wGate('f_pass'),locked:S('The High Pass is a wall of ice. Ulf might know more.','The pass is ice. Ask Ulf.'),
      hidden:()=>!(G&&G.flags&&(G.flags.act2_done||G.flags.c_done||(typeof actOf==='function'&&actOf(G.stage)>=3)||(G.mapsSeen&&G.mapsSeen[2]))),
      arrive:S('Snow in summer. It squeaks under your claws.','The snow squeaks!')},
    {id:'f_pass_n',x:2600,y:50720,to:{x:950,y:3420},label:S('Go down to Embermere','Go down to Embermere'),name:S('The High Pass','The High Pass'),kind:'pass',dir:Math.PI/2,
      arrive:S('Warm air. Frostpine smells like pine and sheep.','It is warm here!')},
    // Juniper's Tunnel (quest f_juniper step 4 opens it: x2_people's boulder f_tunnel_boulder at 1750,46050 sets f_tunnel_open)
    {id:'f_tunnel_w',x:1750,y:46150,to:{x:6500,y:44860},label:S("Crawl through Juniper's Tunnel","Go through the tunnel"),name:S("Juniper's Tunnel","Juniper's Tunnel"),kind:'tunnel',dir:-Math.PI/2,clear:70,
      need:()=>F2WF('f_tunnel_open'),locked:S('An old ice tunnel under the cliff. A big boulder blocks it.','A boulder blocks the tunnel.'),arrive:S('Glimmer Point. Your knees are very cold.','Glimmer Point!')},
    {id:'f_tunnel_e',x:6500,y:44800,to:{x:1750,y:46160},label:S("Crawl through Juniper's Tunnel","Go through the tunnel"),name:S("Juniper's Tunnel","Juniper's Tunnel"),kind:'tunnel',dir:-Math.PI/2,clear:70,
      need:()=>F2WF('f_tunnel_open'),locked:S('An old ice tunnel under the moor. It is blocked from the far end.','The tunnel is blocked.'),arrive:S('Rimeholm. Your knees are very cold.','Rimeholm!')}
  ]});
// the map's crossings also go into the CROSSINGS registry (so other modules can find them by id and do not add their own)
for(const c of MAPS[2].crossings) if(!CROSSINGS[c.id]) CROSSINGS[c.id]=c;

// ================= 8. landmarks, the Frozen Folk, secrets and the standing things (bible 3.6 to 3.8, 4.1 to 4.3)
const f2wSay=(lines,cb)=>runDialogue(lines.map(l=>Array.isArray(l)?l:['narr',l]),()=>{ scene='play'; if(cb) cb(); saveGame(); });
function f2wLM(B,o){ o.noNudge=true; if(o.clr==null) o.clr=60; if(!o.k) o.k='f2w_lm'; return B.landmark(o); }
function f2wSecret(id,title){ G.secrets=G.secrets||{}; if(G.secrets[id]) return false; G.secrets[id]=1; G.found[id]=true; jingle('secret','chest'); setBanner(S('A secret of Frostreach!','A secret!'),title,2.6); return true; }
// ---------- override points for the people and story helpers (wrap these; the defaults keep the world working alone)
// the Great Hearth took 3 s of Blaze (only while it is cold, at f_kindle or later): default lights it
// (with the story in the build its own scene says WHOOMPH / SPLOOSH: no second banner over it)
function f2wHearthBlaze(o){ G.flags.f_hearth_lit=1; shake(6); f2wSnd('whoosh',1); if(!f2wStoryIn()) setBanner(S('WHOOMPH!','WHOOMPH!'),S('The Great Hearth roars up in blue and gold fire!','The Great Hearth burns blue!'),3); f2wSync(); saveGame(); }
// the North Gate took 2 s of Blaze (only once the Hearth burns): default opens it
function f2wNorthGate(o){ G.flags.f_northgate=1; shake(4); f2wSnd('crack',1); if(!f2wStoryIn()) setBanner(S('SPLOOSH!','SPLOOSH!'),S('The ice slides off the North Gate. It swings open.','The North Gate opens!'),2.6); f2wSync(); saveGame(); }
// a Frozen Folk person just thawed (after their own line): Ylva's thaw sets f_ylva (the story helper plays STORY.f_ylva)
function f2wThawed(o){ if(o.id==='f_ylva'&&!F2WF('f_ylva')&&!f2wStoryIn()) G.flags.f_ylva=1; f2wSync(); }
// the Drum Stone was pounded (n = times): default sets f_drum at the Dreadgate stage (the story helper plays f_drum)
function f2wDrum(o,n){ if(!F2WF('f_drum')&&!f2wStoryIn()){ G.flags.f_drum=1; f2wSnd('thud',1); shake(10); setBanner(S('BOOOOOOM.','BOOM!'),S('A long crack runs across the Frost Lock far below.','The Frost Lock cracks!'),3); saveGame(); } }
// the three verses of the Snow Mother's Song (f_song belongs to the people helper)
function f2wBell(o){ F2WD.bellT=1.6; f2wSnd('bell',1); if(!F2WF('f_thaw_f_tollef')){ f2wSay([S('The bell rope is frozen to the wall. Somebody is frozen at the bottom of the tower, holding it.','The rope is frozen. So is the bellringer.')]); return; } ftext(o.x,o.y-60,S('BONNNG!','BONG!'),'#ffe9a0',16); }
function f2wSinging(o){ f2wSnd('chime',1); f2wSnd('chime',0.8); ftext(o.x,o.y-70,S('The wind plays a tune through the stone. Words glow on it.','The stone sings!'),'#f4eaff',14); G.found.f_singing=1; }
function f2wRuneDrum(o,n){ f2wSnd('thud',1); ftext(o.x,o.y-60,S('The carved runes light up, one by one.','The runes light up!'),'#ffd27a',14); G.found.f_runedrum=1; }
// Juniper's Map Tent note (the people helper starts f_juniper from here)
function f2wTentNote(o){ f2wSay([S('A note is pinned to the tent: GONE MAPPING THE SHIVERSEA. BACK SOON. IF NOT BACK SOON, PLEASE SEND A DRAGON. (JUNIPER)','A note: GONE MAPPING. SEND A DRAGON. (JUNIPER)')]); }
// the Big Boulder on the old Quarry Road broke (a Blast Bomb, or the hammer at full charge): the shortcut is open
// (the people helper chains the boulder's then for f_bombs step 4; this only opens the road)
function f2wQuarryOpen(){ G.flags.f_quarry_open=1; questPoke(); saveGame(); }
// one of Hask's runaway dogs was found (i 1..5): it trots home to the kennel (a stand-in: x2_people sets F2WD.noDogs
// and places its own dogs at the f_dog_<i> landmark spots)
function f2wDogFound(i,o){ G.flags['f_dog'+i]=1; f2wSnd('woof',1); setBanner(S(['Snowball','Pepper','Biscuit Two','Sergeant','Mittens'][i-1]+' found!','Dog found!'),S('The dog licks your nose and runs off home to Hask.','The dog runs home!'),2.4); questPoke(); saveGame(); }
// ---------- Hearthold (bible 4.1): the round wall and its three gates, the Great Hearth, the frozen palisade, the streets
function f2wTown(B){
  const C=F2WG.town, R=C.r, gap=0.12;
  const arcs=[[-Math.PI+gap,-Math.PI/2-gap],[-Math.PI/2+gap,-gap],[gap,Math.PI-gap]];
  let i=0;
  for(const [a0,a1] of arcs){
    const n=Math.max(2,Math.round((a1-a0)/0.13));
    for(let k=0;k<n;k++){ const b0=lerp(a0,a1,k/n), b1=lerp(a0,a1,(k+1)/n), bm=(b0+b1)/2, south=Math.sin(bm)>0, rf=south?R+13:R-13;
      const y0=C.y+Math.sin(b0)*rf, y1=C.y+Math.sin(b1)*rf;
      f2wObj('twall',C.x+Math.cos(bm)*R,C.y+Math.sin(bm)*R,{a0:b0,a1:b1,i:i++,base:Math.max(y0,y1),R:110,inT:true}); }
    const L=(a1-a0)*R, m=Math.ceil(L/26); for(let k=0;k<=m;k++){ const a=lerp(a0,a1,k/m); addCol({t:'c',x:C.x+Math.cos(a)*R,y:C.y+Math.sin(a)*R,r:17}); }
  }
  // gate towers, the North Gate's arch and frozen doors
  for(const g of [Math.PI,-Math.PI/2,0]) for(const s of [-1,1]){ const a=g+s*(gap+0.035); f2wObj('tower',C.x+Math.cos(a)*R,C.y+Math.sin(a)*R+4,{v:g===0?1:0}); }
  F2WD.ngate=f2wObj('ngate',C.x,C.y-R+8,{col:false});
  F2WD.ngateCol=addCol({t:'r',x0:C.x-74,y0:C.y-R-16,x1:C.x+74,y1:C.y-R+16});
  f2wLM(B,{id:'f_lm_northgate',x:C.x,y:C.y-R+22,r:0,clr:20,prompt:()=>F2WT.gate?null:S('Look at the North Gate','Look at the gate'),hidden:()=>F2WT.gate,draw:()=>{},
    act:()=>f2wSay([canBlaze()?S('The North Gate is frozen solid, thick with purple moth-frost. Blue fire might do it, once the town is warm again.','The gate is frozen. Use blue fire!'):S('The North Gate is frozen solid, thick with purple moth-frost. Your fire only makes it sweat.','The gate is frozen solid.')])});
  const NG=LANDMARKS[LANDMARKS.length-1];
  p3On(NG,{r:70,blaze:{need:2,h:50,when:()=>!F2WT.gate&&!f2wStoryIn(),then:o=>f2wNorthGate(o)},
    fire:(o,dt,blue)=>{ if(F2WT.gate) return; F2WD.gateHeat=Math.min(1,(F2WD.gateHeat||0)+dt*0.6); if(blue&&!F2WT.lit&&f2wStory()) p3Say(o.x,o.y-90,S('The ice is too thick. The town needs its Hearth back first.','Too thick! Light the Hearth first.'),'#dff4ff','ngate',3); }});
  // the Great Hearth on its dais
  F2WD.hearth=f2wObj('hearth',6800,48950);
  f2wLM(B,{id:'f_lm_hearth',x:6800,y:48990,r:0,clr:30,prompt:S('Look at the Great Hearth','Look at the Great Hearth'),draw:()=>{},
    act:()=>f2wSay([F2WT.lit?S('The Great Hearth roars blue and gold. Snowflakes melt a long way before they reach it.','The Great Hearth burns blue and gold!'):S('The Great Hearth: a stone fireplace taller than a cottage. Its fire is tiny, a little orange flicker at the bottom.','The Great Hearth. Its fire is tiny.')])});
  const HL=LANDMARKS[LANDMARKS.length-1];
  p3On(HL,{r:80,blaze:{need:3,h:40,when:()=>!F2WT.lit&&!f2wStoryIn(),then:o=>f2wHearthBlaze(o)},
    fire:(o,dt,blue)=>{ if(F2WT.lit) return; F2WD.hearthHeat=Math.min(1,(F2WD.hearthHeat||0)+dt*0.5); if(!blue) p3Say(o.x,o.y-100,S('The flicker jumps up, then shrinks back down. It needs a hotter fire.','It needs hotter fire.'),'#ffe0b0','hearthsmall',4); }});
  // the frozen palisade north of town (east to the Windscour's cliff, west to the Whitewater)
  let v=0;
  for(const P of [[[7072,48466],[7700,47950],[8690,47628]],[[6528,48466],[6100,48330],[5726,48262]]]){
    for(let s=0;s<P.length-1;s++){ const a=P[s], b=P[s+1], L=dist(a[0],a[1],b[0],b[1]), n=Math.ceil(L/24); for(let k=s?1:0;k<=n;k++){ const x=lerp(a[0],b[0],k/n), y=lerp(a[1],b[1],k/n); f2wObj('stake',x+((v*7)%5)-2,y+((v*11)%5)-2,{v:v++}); } } }
  // streets: lamps, Pim's cocoa stand, market stalls, a well, benches, woodpiles, snowmen, sleds by the Sled Shed
  for(const [x,y] of [[6330,48945],[6480,49058],[7120,48958],[7290,49058],[6748,48600],[6852,48500],[6560,49150],[7040,49140],[6200,48920],[6200,49080],[7400,48920],[7400,49080],[6740,48440],[6860,48440]]) f2wObj('lamp',x,y);
  f2wObj('stall',6650,49080,{v:0}); f2wObj('stall',6540,48905,{v:1}); f2wObj('stall',7060,49110,{v:2});
  f2wObj('well',6620,48860); f2wObj('bench',6680,49175); f2wObj('bench',6930,48775);
  for(const [x,y] of [[6400,49305],[7330,49235],[6290,49000-160]]) f2wObj('woodpile',x,y);
  for(const [x,y] of [[7350,49105],[7366,49118],[6520,49300],[6890,49380]]) f2wObj('barrel',x,y);
  f2wObj('snowman',6460,49090,{v:0}); f2wObj('snowman',7180,49400,{v:1}); f2wObj('snowman',6900,48660,{v:2});
  f2wObj('sled',7310,48960,{v:0}); f2wObj('sled',7350,48975,{v:1}); f2wObj('sled',7250,48965,{v:2});
  // Juniper's Map Tent (empty, with a note, until she is home)
  f2wObj('maptent',7080,48700);
  f2wLM(B,{id:'f_lm_tent',x:7080,y:48716,r:0,clr:40,prompt:()=>F2WF('f_juniper_home')||F2WQ('f_juniper')?null:S("Read the note on Juniper's tent","Read the note"),draw:()=>{},act:o=>f2wTentNote(o)});
  B.sign('f_sign_hearthold',6080,49060,S('HEARTHOLD. The last warm town in the north. (Mostly warm.) Please do not lick the gates.','HEARTHOLD. Do not lick the gates.'));
}
// ---------- Rimeholm (bible 4.2): the bell tower, the chapel, the lookout, the smoke yard, the quay, the stack, the forge dome
function f2wRime(B){
  F2WD.bell=f2wObj('bell',1950,46790);
  f2wLM(B,{id:'f_lm_bell',x:1992,y:46928,r:0,clr:20,prompt:S('Look at the bell rope','Look at the bell rope'),draw:()=>{},act:o=>f2wBell(o)});
  F2WD.towerDoor=p3Add('icewall',{id:'f_tower_door',x:1950,y:46918,w:92,h:66,hh:74,need:1.2});
  // Oskar's old lookout: iron bars only a shadow slips through
  p2Add('thinbars',{id:'f_bars_oskar_s',x:1406,y:46446,w:204,h:16,style:'iron'}); p2Add('thinbars',{id:'f_bars_oskar_e',x:1508,y:46376,w:16,h:140,style:'iron'});
  f2wObj('vane',1350,46336);
  // the moth-frost dome over the old forge (it thins as the village warms up)
  F2WD.dome={id:'f_rime_dome',x:2450,y:46600,r:46};
  f2wLM(B,{id:'f_rime_dome',x:2450,y:46600,r:0,clr:30,prompt:()=>G.found.f_rime_dome?null:S('Look at the frosted dome','Look at the dome'),draw:(o,t)=>f2wDrawDome(o,t),
    act:()=>f2wSay([f2wRimeWarm()>=7?S('The moth-frost dome over the forge has gone thin and cloudy. Blue fire would break it now.','The dome is thin now. Use blue fire!'):S('A dome of purple moth-frost covers the old forge, thick as a wall. It looks thinner where the village is warm. Warm up more of Rimeholm first.','A thick dome. Thaw more people first!')])});
  const DL=LANDMARKS[LANDMARKS.length-1]; DL.r=F2WD.dome.r;
  if(!G||!G.found||!G.found.f_rime_dome) F2WD.dome.col=addCol({t:'c',x:2450,y:46600,r:44});
  p3On(DL,{r:52,blaze:{need:2,h:40,when:()=>!G.found.f_rime_dome&&f2wRimeWarm()>=7,then:()=>f2wDomeGone()},
    fire:(o,dt,blue)=>{ if(G.found.f_rime_dome) return; if(blue&&f2wRimeWarm()<7) p3Say(o.x,o.y-80,S('Too thick! Thaw more of the village first.','Too thick! Thaw more people.'),'#e8dcff','dome',3); }});
  // fishing huts on stilts, drying racks, Sigrun's pot, the frozen goat on the stack
  for(const [x,y,v] of [[820,47110,0],[700,47600,1],[1010,46470,0]]) f2wObj('stilthut',x,y,{v});
  for(const [x,y] of [[1000,47010],[1060,46640],[2280,46470],[1600,47250],[2620,46760],[1240,47390]]) f2wObj('prop',x,y,{pk:'f_fishrack',v:(x>>3)%2});
  for(const [x,y] of [[1820,46960],[2270,47040],[1420,47000],[2560,46640]]) f2wObj('lamp',x,y);
  f2wObj('barrel',2330,47212); f2wObj('woodpile',2410,47130); f2wObj('bench',1830,47160);
  B.sign('f_sign_rimeholm',2880,47336,S('RIMEHOLM. Fish, bells and the best soup in the north. Mind the ice on the quay.','RIMEHOLM. Mind the ice!'));
  B.sign('f_sign_rimequay',1350,47470,S('THE QUAY. Very slippery. Two holes. Do not fish in the holes. (We know you will.)','The quay is slippery. Two holes!'));
}
// how warm Rimeholm is: the named villagers thawed (Rasmus last)
function f2wRimeWarm(){ let n=0; for(const id of ['f_ylva','f_tollef','f_saga','f_sigrun','f_bo','f_nils','f_oskar']) if(F2WF('f_thaw_'+id)) n++; return n; }
function f2wDomeGone(){ G.found.f_rime_dome=true; if(F2WD.dome.col){ removeCol(F2WD.dome.col); F2WD.dome.col=null; } f2wSnd('crack',1); shake(4); for(let i=0;i<30;i++){ const a=rand(0,TAU); emit(2450+Math.cos(a)*40,46590+Math.sin(a)*30,1,{col:'210,190,255',ang:a,spread:0.3,smin:60,smax:200,lmin:.3,lmax:.7,zmin:1.5,zmax:3.4,drag:3}); } setBanner(S('The dome shatters!','The dome breaks!'),S('Rasmus is still frozen inside. Warm him up!','Now thaw Rasmus!'),2.6); saveGame(); }
function f2wDrawDome(o,t){
  if(G.found.f_rime_dome) return; const k=clamp(f2wRimeWarm()/7,0,1), a=0.75-0.35*k;
  ctx.save(); ctx.fillStyle=`rgba(180,160,240,${a*0.55})`; ctx.beginPath(); ctx.ellipse(o.x,o.y-18,50,44,0,Math.PI,TAU); ctx.lineTo(o.x+50,o.y+8); ctx.ellipse(o.x,o.y+8,50,14,0,0,Math.PI); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=`rgba(240,232,255,${a})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(o.x,o.y-18,50,44,0,Math.PI,TAU); ctx.stroke();
  ctx.strokeStyle=`rgba(255,255,255,${0.5*a})`; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(o.x-14,o.y-34,16,22,-0.5,Math.PI*1.1,Math.PI*1.6); ctx.stroke();
  if(k>0.99){ ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(o.x-20,o.y-50); ctx.lineTo(o.x-6,o.y-30); ctx.lineTo(o.x-14,o.y-10); ctx.moveTo(o.x+18,o.y-46); ctx.lineTo(o.x+8,o.y-26); ctx.stroke(); }
  ctx.restore(); glowAt(o.x,o.y-20,40,'190,170,255',0.12+0.06*Math.sin(t*2));
}
// ---------- Hask's Rest (bible 4.3)
function f2wHask(B){
  f2wObj('tent',11400,49460,{v:0,big:true});
  for(const [x,y,v] of [[11180,49480,1],[11620,49440,2],[11300,49790,2],[11620,49780,1]]) f2wObj('tent',x,y,{v});
  f2wObj('kennel',11450,49900); f2wObj('rack',11280,49660); f2wObj('rack',11530,49690);
  STRUCTS.push({k:'campfire',x:11400,y:49700}); LIGHTS.push({x:11400,y:49700,r:260,i:0.9,fire:true}); addCol({t:'c',x:11400,y:49700,r:20,low:true});
  for(const [x,y] of [[11300,49720],[11500,49720]]) f2wObj('woodpile',x,y);
  B.sign('f_sign_hask',11080,49640,S("HASK'S REST. Trappers welcome. Dogs very welcome. Wolves not welcome. Yetis: ask first.","HASK'S REST. Dogs welcome. Yetis: ask first."));
}
// ---------- Hask's dog sled line (bible 3.6: crossings f_sled_rest, f_sled_gate, f_sled_rime, f_sled_moor). Each post is a
// crossing on this map whose USE opens a menu of the other three. Open once G.flags.f_sledline is set (x2_people's
// f_dogs reward) or the quest f_dogs is done.
const F2W_SLED={
  rest:{x:11660,y:49930,go:S("Run to Hask's Rest","To Hask's Rest")},
  gate:{x:7600,y:49060,go:S("Run to Hearthold's East Gate","To Hearthold")},
  rime:{x:2950,y:47450,go:S('Run to Rimeholm','To Rimeholm')},
  moor:{x:7900,y:44900,go:S('Run to the Dreadmoor','To the Dreadmoor')}};
const f2wSledOK=()=>!!(G&&G.flags&&(G.flags.f_sledline||F2WQ('f_dogs')));
function f2wSledLine(B){
  for(const k in F2W_SLED){ const P=F2W_SLED[k];
    const def={id:'f_sled_'+k,x:P.x,y:P.y,to:{x:P.x+46,y:P.y+58},kind:'sled',f2sled:k,name:S("Hask's Dog Sled","The dog sled"),label:S("Ride Hask's dog sled",'Ride the dog sled'),need:f2wSledOK,
      locked:S("A dog sled post, and a sled with no dogs. Hask at Hask's Rest has lost his team.",'No dogs. Help Hask find them!')};
    f2wObj('sledpost',P.x,P.y,{key:k});
    def._lm=f2wLM(B,{id:'f_lm_sledpost_'+k,x:P.x,y:P.y+4,r:0,clr:70,prompt:def.label,xing:def,draw:()=>{},act:()=>useCrossing(def)});
    CROSSINGS[def.id]=def; (XBY[2]||(XBY[2]=[])).push(def);
  }
}
function f2wSledGo(k){
  const P=F2W_SLED[k]; f2wSnd('woof',1); f2wSnd('whoosh',0.8);
  mapTravel(P.x+46,P.y+58,{banner:S('Mush! The dogs know the way.','Mush!')});
}
{ const base=useCrossing; useCrossing=function(def){
  if(!def||!def.f2sled) return base(def);
  if(def.need&&!def.need()){ SFX.play('ui'); setBanner(def.name,def.locked,3); return; }
  if(G.inCombat||(G.boss&&!G.boss.dead)){ setBanner(def.name,S('You can’t travel while enemies are close.','Enemies are close!'),2.4); return; }
  const opts=Object.keys(F2W_SLED).filter(k=>k!==def.f2sled).map(k=>({t:F2W_SLED[k].go,fn:()=>later(0.2,()=>f2wSledGo(k))}));
  opts.push({t:S('Not now','Not now'),then:[['narr',S('The dogs flop down in the snow. They will wait.','The dogs wait.')]]});
  runDialogue([ch('narr',S('Five dogs jump up, tails going like windmills. Where to?','Where to?'),opts)],()=>{ scene='play'; });
}; }
// ---------- the Frozen Folk (bible 3.8): 12 out in the world (quest f_warm) and Rimeholm's 8 (quest f_rime, Ylva main path)
const F2W_LK={
  fergus:{skin:'#e8bc98',hair:'#8a5a2a',hairdo:'short',outfit:'coat',shirt:'#c84a3a',low:'#3a3a4a',hat:'beanie',hatc:'#3a6aaa',scarf:'#e8c03a',mittens:'#3a6aaa',stache:true},
  milk:{skin:'#f0c8a8',hair:'#5a3a2a',hairdo:'short',outfit:'overalls',shirt:'#efe6d6',low:'#46607a',hat:'cap',hatc:'#46607a',beard:true,build:'big'},
  guard:{skin:'#e6b494',hair:'#6a4a2a',hairdo:'short',outfit:'armor',helm:true,plume:'#3a6aaa',cape:'#2a4a7a',frost:true,hold:'spear',mittens:'#2a4a7a'},
  skater:{skin:'#f4d6c2',hair:'#e8c060',hairdo:'pigtails',outfit:'dress',shirt:'#e84a8a',low:'#7a2a5a',scarf:'#ffffff',hat:'beanie',hatc:'#ffffff'},
  fisher:{skin:'#d8aa84',hair:'#8a8a8a',hairdo:'short',outfit:'coat',shirt:'#3a6a7a',low:'#3a3a4a',hat:'fur',hatc:'#6a4a2a',hold:'rod',beard:'big',beardc:'#8a8a8a'},
  monk:{skin:'#a87050',hood:'#e8a030',outfit:'robe',shirt:'#e8a030',low:'#c87a1a',sash:'#c83a2a',hairdo:'bald',hold:'staff'},
  hiker:{skin:'#f0c4a2',hair:'#c86a2a',hairdo:'pony',outfit:'coat',shirt:'#5a8a4a',low:'#3a4a5a',hat:'beanie',hatc:'#e8c03a',bag:'#7a5a32'},
  trapper:{skin:'#d39f78',hair:'#4a3a20',hairdo:'long',outfit:'fur',shirt:'#6a4a2a',low:'#4a3a2a',hat:'fur',hatc:'#6a4a2a',beard:true,back:'bow'},
  postman:{skin:'#e6b494',hair:'#3a2a1a',hairdo:'short',outfit:'coat',shirt:'#3a4a7a',low:'#2a3a5a',hat:'cap',hatc:'#3a4a7a',bag:'#7a5a32'},
  knight:{skin:'#f0c8a8',hair:'#c8a060',hairdo:'short',outfit:'armor',helm:true,plume:'#c83a2a',cape:'#2a4a7a',frost:true,hold:'spear',build:'big'},
  kid:{skin:'#e8bc98',hair:'#2a1a10',hairdo:'spiky',outfit:'coat',shirt:'#3a8aaa',low:'#3a3a4a',hat:'beanie',hatc:'#c84a3a',mittens:'#c84a3a'},
  ylva:{skin:'#f4d6c2',hair:'#efeae0',hairdo:'bun',outfit:'dress',shirt:'#5a7aaa',shawl:'#e8e4dc',glasses:true,build:'old',hold:'yarn',yarnc:'#c84a3a'},
  tollef:{skin:'#e0ae88',hair:'#8a5a2a',hairdo:'short',outfit:'tunic',shirt:'#3a5a3a',low:'#2a3a2a',build:'tall',stache:'big'},
  saga:{skin:'#c88a62',hair:'#e8c060',hairdo:'pony',outfit:'coat',shirt:'#3a7a8a',low:'#2a4a5a',hat:'rain',hatc:'#e8c03a',hold:'rod',freckles:true},
  sigrun:{skin:'#f0c4a2',hair:'#6a4a2a',hairdo:'bun',outfit:'tunic',shirt:'#efe6d6',apron:'#c8b8a0',build:'wide',hold:'ladle'},
  bo:{skin:'#e8bc98',hair:'#e8c060',hairdo:'spiky',outfit:'coat',shirt:'#c84a3a',low:'#4a3a2a',hat:'beanie',hatc:'#3a6aaa',mittens:'#3a6aaa'},
  nils:{skin:'#d39f78',hair:'#4a3a20',hairdo:'short',outfit:'overalls',shirt:'#7a6a3a',low:'#46607a',hat:'cap',build:'slim'},
  oskar:{skin:'#e6b494',hair:'#3a2a1a',hairdo:'short',outfit:'coat',shirt:'#3a4a7a',low:'#2a3a5a',hat:'cap',hatc:'#3a4a7a',bag:'#7a5a32',stache:true},
  rasmus:{skin:'#c08860',hair:'#efeae0',hairdo:'bald',beard:'big',beardc:'#efeae0',outfit:'vest',shirt:'#5a3a2a',apron:'#3a2a20',soot:true,build:'big',hold:'hammer'}
};
const F2W_FOLK=[
  // [id, x, y, look, name, line, opts]
  ['f_fergus',3300,50000,'fergus',S('Fergus Fiddlesticks','Fergus'),S('...MITTENS! Get your mittens! ...Why is it so quiet? How long was I standing here?','MITTENS! Why is it so quiet?'),{coins:20,face:-0.4,lmId:'f_lm_fergus',after:S('Mittens! Warm mittens! You look like you need ten pairs. Here, have a pair. Free. For the dragon who un-iced me.','Mittens! Have a pair, free!')}],
  ['f_frz_milk',5000,49100,'milk',S('the milkman','the milkman'),S("Moo! I mean, morning! The cow said moo. I said morning. We're both a bit confused.",'Moo! I mean, morning!'),{coins:15,cow:true,after:S('Fresh milk! Well. Fresh ice. Give it a minute.','Fresh milk! Soon.')}],
  ['f_frz_guard1',6050,48850,'guard',S('a Hearthwarden','a guard'),S("I was on watch! I'm still on watch! I watched a whole month of nothing!",'I was on watch! For a month!'),{coins:20,after:S('All quiet on the west wall! Too quiet. Brrr.','All quiet!')}],
  ['f_frz_guard2',7550,48850,'guard',S('a Hearthwarden','a guard'),S("Captain Brann's going to make me do push-ups. Frozen push-ups count, right?",'Do frozen push-ups count?'),{coins:20,after:S('Fifty push-ups. Then fifty more. Then soup.','Push-ups, then soup.')}],
  ['f_frz_skater',4800,46200,'skater',S('a skater','a skater'),S("...and that's a triple spin! Wait. Did anyone see it? Nobody saw it.",'Triple spin! Did you see?'),{coins:15,kid:true,after:S('Watch this! ...Whoops. Watch THIS!','Watch this!')}],
  ['f_frz_fisher',4400,45540,'fisher',S('an ice fisher','an ice fisher'),S("Got one! ...Oh. It's a boot. A frozen boot. Still counts.",'Got one! A boot. It counts.'),{coins:20,after:S('The fish are biting. Mostly my boots.','The fish bite my boots.')}],
  ['f_frz_monk',9600,46200,'monk',S('a Wind Monk','a Wind Monk'),S('Om. Omm. OMMM. Oh! Hello. I was meditating. A bit too well.','Om. Oh! Hello!'),{coins:25,lvl:2,after:S('The wind is singing again. Can you hear it? Wheee. Sorry.','The wind sings again!')}],
  ['f_frz_hiker',13300,41550,'hiker',S('a hiker','a hiker'),S('I came up here for the view. The view is ice. Lovely ice.','I came for the view. It is ice.'),{coins:30,lvl:3,after:S('Lovely view now! Red rocks, white snow, one dragon. Ten out of ten.','Lovely view now!')}],
  ['f_frz_trapper',12200,49900,'trapper',S('a trapper','a trapper'),S("Tell Hask I'm sorry I'm late. A month late. Tell him gently.",'Tell Hask I am late. Gently.'),{coins:25,leave:true,leaveDir:Math.PI*0.9}],
  ['f_frz_postman',1950,42800,'postman',S('a lost postman','a postman'),S('Special delivery! For... the fish? I think I got lost.','A letter for the fish? I am lost.'),{coins:25,after:S('Which way is Hearthold? Never mind, I will follow the dragon.','Which way is home?')}],
  ['f_frz_knight',6500,44400,'knight',S('a Hearthold knight','a knight'),S("The Dreadgate! It's... still closed. Good. I'll just stand here a bit more. Not frozen. Just brave.",'The Dreadgate is still shut. Good.'),{coins:30,lvl:1,after:S('Not frozen. Just brave. Waiting right here for my patrol.','Not frozen. Just brave.')}],
  ['f_frz_kid',7900,48150,'kid',S('a sledding kid','a sledding kid'),S('WHEEEEE... eee? Why did I stop? I was going SO fast.','WHEEE! Why did I stop?'),{coins:10,kid:true,sled:true,after:S('Again! AGAIN!','Again!')}],
  // (Ylva knits at the front-right corner of the tower top, in front of the bell's roof; her red yarn runs along the
  //  front edge and down the south face beside the frozen door. At the back (1950,46746) the bell pavilion was drawn
  //  over her and a kid could not see her; at the front-left her ice block stood on the top of the claws' climb)
  ['f_ylva',1980,46790,'ylva',S('Grandmother Ylva','Ylva'),S("I wasn't frozen, dear. I was resting my eyes.",'I was just resting my eyes, dear.'),{lvl:3,rime:true}],
  ['f_tollef',1950,46904,'tollef',S('Tollef the Bellringer','Tollef'),S("WHAT? OH! HELLO! I CAN'T HEAR YOU, I'VE BEEN STANDING NEXT TO A BELL FOR FORTY YEARS!",'WHAT? HELLO! I CANNOT HEAR YOU!'),{rime:true,lock:'door'}],
  ['f_saga',1150,46900,'saga',S('Saga the fisher','Saga'),S('I had a bite! A big one! ...It got away. A month ago. Probably.','I had a bite! It got away.'),{rime:true,fish:true}],
  ['f_sigrun',2310,47196,'sigrun',S('Sigrun the Cook','Sigrun'),S("My soup! My SOUP! It's a soup-sicle. ...Actually, that's not bad. Lick it.",'My soup is a soup-sicle!'),{rime:true,lvl:2,pot:true}],
  ['f_bo',1700,46646,'bo',S('Little Bo','Bo'),S('...THROW! Ha! Got you! ...Where did everyone go? Why are you a dragon?','THROW! Ha! Why are you a dragon?'),{rime:true,lvl:2,kid:true}],
  ['f_nils',360,47440,'nils',S('Nils the Goatherd','Nils'),S("Nisse! You're thawed! Don't headbutt the dragon. DON'T HEADBUTT THE...",'Nisse! Do not headbutt the dragon!'),{rime:true,lock:'stack',goat:true}],
  ['f_oskar',1400,46368,'oskar',S('Oskar the Mailman','Oskar'),S("I've never been late. Not once. Thirty years. And now: a MONTH. I'm going to have to write myself a strongly worded letter.",'A whole MONTH late! Oh no.'),{rime:true,lock:'pen'}],
  ['f_rasmus',2450,46604,'rasmus',S('Rasmus Ironsnow','Rasmus'),S("Hmm. Warm. You did that. One person at a time. That's the only way anything good ever gets done.",'Warm. You did that. One at a time.'),{rime:true,lock:'dome'}]
];
// what keeps a frozen person out of reach of the blue jet (so each one needs its own trick, bible 4.2)
function f2wFrozenLock(o){
  const p=player; if(!p) return true;
  if(o.lvlNeed&&elevOf(p)<o.lvlNeed) return true;
  switch(o.lockKind){
    case 'door': return !(F2WD.towerDoor&&F2WD.towerDoor.done);
    case 'dome': return !G.found.f_rime_dome;
    case 'pen': return !(p.x>1300&&p.x<1500&&p.y>46300&&p.y<46440);
    case 'stack': return dist(p.x,p.y,F2WG.stack.x,F2WG.stack.y)>F2WG.stack.r+30;
  }
  return false;
}
function f2wFolk(){
  for(const [id,x,y,lk,name,line,op] of F2W_FOLK){
    const C=typeof CASTBY!=='undefined'?CASTBY[id]:null, o={id,x,y,name,line,flag:'f_thaw_'+id,face:op.face!=null?op.face:Math.PI/2,coins:op.coins,leave:op.leave,leaveDir:op.leaveDir,after:op.after};
    if(C) o.who=id; else o.look=F2W_LK[lk];
    if(op.lvl) o.lvlNeed=op.lvl; if(op.lock) o.lockKind=op.lock; if(op.lmId) o.lmId=op.lmId; o.f2lock=f2wFrozenLock; o.f2op=op;
    o.onThaw=ob=>f2wThawed(ob);
    const f=p3Add('frozen',o); if(op.kid&&f.npc) f.npc.kid=true; if(!C&&f.npc&&SPK&&!SPK[id]) SPK[id]={name:typeof name==='string'?name.replace(/^(a|an|the) /,s=>s[0].toUpperCase()+s.slice(1)):name,col:'#cfe0f0'};
    F2WD.frz.push(f);
    // what froze along with them (a cow, Nisse the goat, a fish on the line, a soup pot, a sled)
    for(const [kind,dx,dy] of [['cow',44,0],['goat',42,0],['fish',-6,0],['pot',28,0],['sled',0,8]]) if(op[kind]) f2wObj('frzdeco',x+dx,y+dy,{kind,f});
  }
}
// a Frozen Folk person by id, CAST id (who) or landmark alias (lmId, e.g. 'f_lm_fergus'); null if none
function f2wFrozen(id){ return F2WD.frz.find(o=>o.id===id||o.who===id||o.lmId===id)||null; }
// USE on a frozen person: another module may set o.f2act(o) (for example the story's first look at Fergus, bible 6.2b);
// while that returns true the stock "Look at" line is skipped
{ const base=lmAct; lmAct=function(o){ if(o&&o.p3==='frozen'&&o.st==='ice'&&typeof o.f2act==='function'){ try{ if(o.f2act(o)) return; }catch(e){ console.error(e); } } return base(o); }; }
// the four neighbours of Rimeholm thaw with the village (when f_rime is done); until then they stand frozen by their doors
function f2wRimeNeighbours(){
  const hs=HOUSES.filter(h=>h.town==='f_rimeholm'&&h.owner&&String(h.owner).startsWith('n_f_rimeholm'));
  for(const h of hs){ const id=h.owner, C=CASTBY[id]; if(!C||P3.out.some(o=>o.id==='f_frz_'+id)) continue;
    const f=p3Add('frozen',{id:'f_frz_'+id,who:id,x:h.x+h.w*0.3,y:h.y+h.h/2+30,name:C.name,flag:'f_thaw_'+id,line:S('Brrr! Is it spring? Is it soup time? It feels like soup time.','Brrr! Is it soup time?'),face:Math.PI/2,
      f2lock:()=>!F2WQ('f_rime'),f2lockMsg:S("This one is frozen too deep. When the whole village is warm, they'll thaw too.",'Too deep. Warm the whole village first.'),onThaw:ob=>f2wThawed(ob)});
    F2WD.frz.push(f); }
}
// ---------- the world: landmarks, secrets, signs, wind roads, dogs, chests
function f2wPlaces(B){
  f2wFolk();
  // ---- the Whitepass: the High Pass, the Steamwell and its monkeys, the Warm Cave's frozen waterfall
  for(const [x,y,v] of [[2470,50640,0],[2730,50640,1]]) f2wObj('prop',x,y,{pk:'f_cairn',v});
  B.sign('f_sign_pass',2800,50420,S('FROSTREACH. East along the White Road: Hearthold. North-west: Rimeholm, on the cliffs. North: the ice, and the mountain. (Do not go to the mountain.)','Hearthold is east. Rimeholm is north-west. Not the mountain!'));
  F2WD.monkeys=f2wObj('monkeys',3800,49400,{R:200});
  CHESTS.push({id:'f_ch_steam',x:3898,y:49404,b:20,open:false});
  F2WD.warmFall=p3Add('icewall',{id:'f_warmfall',x:1200,y:49632,w:120,h:30,hh:120,style:'fall',regrow:30,need:1.2});
  STRUCTS.push({k:'cavemouth',x:1200,y:49600,ref:{area:'f_warmcave',x:1200,y:49600,name:S('The Warm Cave','The Warm Cave')},theme:'ice'});
  CHESTS.push({id:'f_ch_westcliff',x:500,y:48700,b:20,open:false},{id:'f_ch_ridgetop',x:2450,y:48880,b:20,open:false});
  // ---- the Vale: Sir Frostington, the barns, the Sled Hill, the gulch, the Quarry Road boulder, the sculpture garden
  F2WD.frost=f2wObj('frostington',4600,48300);
  f2wLM(B,{id:'f_lm_frostington',x:4600,y:48330,r:0,clr:120,prompt:()=>G.found.f_sec_frostington?null:S('Look at the giant snowman','Look at the big snowman'),draw:()=>{},
    act:()=>f2wSay([S('A giant snowman with a monocle and a very fine hat. A sign at his feet says: SIR FROSTINGTON. DO NOT MELT. Something orange is stuck deep inside him.','SIR FROSTINGTON. DO NOT MELT. Something orange is inside.')])});
  p3On(LANDMARKS[LANDMARKS.length-1],{r:54,blaze:{need:3,h:80,when:()=>!G.found.f_sec_frostington,then:()=>f2wFrostington()},fire:(o,dt,blue)=>{ if(blue&&!G.found.f_sec_frostington) F2WD.frostHeat=Math.min(1,(F2WD.frostHeat||0)+dt/3); }});
  for(const [x,y,v] of [[5100,50150,0],[8420,50380,1],[4560,49020,0],[8900,48900,1]]) f2wObj('barn',x,y,{v});
  for(const [x,y] of [[7840,48250],[7960,48300]]) f2wObj('sled',x,y,{v:(x>>4)%3}); f2wObj('flag',7990,48170,{c:'#c8463a'});
  f2wObj('steamsled',5150,50540); F2WD.gulchCrate={x:5380,y:50560,st:G&&G.found&&G.found.f_powder_crate?'gone':G&&G.found&&G.found.f_powder_pushed?'down':'up'};
  f2wLM(B,{id:'f_lm_powder',x:5380,y:50560,r:0,clr:30,hidden:()=>F2WD.noPowderCrate||F2WD.gulchCrate.st!=='up',prompt:S('Push the crate off the ledge','Push the crate off'),draw:(o,t)=>f2wDrawCrate(t),act:()=>f2wPushCrate()});
  f2wLM(B,{id:'f_lm_powder_down',x:5290,y:50720,r:0,clr:30,hidden:()=>F2WD.noPowderCrate||F2WD.gulchCrate.st!=='down',prompt:S('Pick up the blasting powder','Pick up the crate'),draw:()=>{},act:()=>f2wTakeCrate()});
  B.sign('f_sign_gulch',5120,50250,S("SNOWGOB GULCH. Keep out. (Signed: the Snowgobs.) (Then, in smaller letters: we can't spell 'keep'.)",'SNOWGOB GULCH. Keep out!'));
  armsAdd('boulder',{id:'f_quarry_boulder',x:5900,y:47630,r:44,then:()=>f2wQuarryOpen()});
  ELEV.plateau({k:2,disc:[5890,47440,120],lvl:1,style:'f_snow',noise:10,id:'f_quarry_n'}); ELEV.plateau({k:2,disc:[5900,47820,105],lvl:1,style:'f_snow',noise:10,id:'f_quarry_s'});
  B.sign('f_sign_quarry',6260,47820,S('THE OLD QUARRY ROAD. West to the Rim Road. (Blocked by a boulder since the Great Avalanche. The boulder says hello.)','The Quarry Road. A big rock blocks it.'));
  f2wGarden(B);
  // ---- the north fields and Glimmer Point: ice huts, the knight on the moor, the frost chains half buried in the snow
  f2wObj('icehut',4480,45620); f2wObj('icehut',5800,46060);
  for(const [x,y,a,len] of [[6900,44560,0.3,150],[7900,44480,-0.4,170],[8500,44300,0.1,130],[6420,44200,0.6,120],[7650,44620,-0.2,110]]) f2wObj('chain',x,y,{a,len});
  B.sign('f_sign_glimmer',6700,44990,S('GLIMMER POINT. The end of the road. The Glacier Mouth is west, across open water. Stay off the black ice.','GLIMMER POINT. The glacier is west.'));
  B.sign('f_sign_moor',7180,44820,S('THE DREADMOOR. Turn back. (This sign has been put up four times. The wind keeps taking it.)','THE DREADMOOR. Turn back!'));
  // ---- the Dreadgate and the Frost Lock (the plaza in front is the Hush arena: its lamps, vents and ribbons are the
  // boss module's, bible 9.4; the plaza is kept flat, clear and cobbled for them)
  F2WD.dgate=f2wObj('dreadgate',7300,44110);
  f2wLM(B,{id:'f_lm_dreadlock',x:7300,y:44160,r:0,clr:30,prompt:()=>F2WT.hush?null:S('Look at the Frost Lock','Look at the Frost Lock'),draw:()=>{},
    act:()=>f2wSay([F2WF('f_drum')?S('A long crack runs across the Frost Lock. It still hums, but it sounds worried.','The lock is cracked. It sounds worried.'):S('The Frost Lock: a padlock as big as a cart, sealed in purple frost. High above, on the mountain\'s shoulder, sits a round stone drum with a ram\'s face.','A giant frozen lock. A stone drum sits high above.')])});
  // ---- the Shoulder Ledge: the Drum Stone (only a Ground Pound rings it), and the Wind Road up and down
  F2WD.drum=p3Add('drum',{id:'f_lm_drum',x:8350,y:43400,r:40,then:(o,n)=>f2wDrum(o,n)});
  WIND.stream({id:'f_rib_windroad',pts:[[8800,44450],[8700,44000],[8450,43500]],lv:[1,3],w:60});
  WIND.stream({id:'f_rib_shoulder',pts:[[8300,43550],[8150,43900],[8000,44300]],lv:[3,1],w:60});
  // ---- the Glacier Mouth: the ribbon along the glacier that skips the moat (after Wind Riding)
  WIND.stream({id:'f_rib_dread',pts:[[6300,44350],[6000,44330],[5640,44470]],lv:[1,0],w:56});
  // ---- the Windscour, the Howling Gap and the way to the Sky Isles
  WIND.stream({id:'f_rib_gap1',pts:[[10000,44450],[10080,43900],[10150,43300]],lv:[2,2],both:true,w:60});
  WIND.stream({id:'f_rib_gap2',pts:[[10880,44480],[11700,44000],[12550,43300]],lv:[2,2],both:true,w:60});
  WIND.stream({id:'f_rib_isles1',pts:[[12900,46350],[13050,46700],[13150,47100]],lv:[5,4],both:true,w:56});
  WIND.stream({id:'f_rib_isles2',pts:[[11450,47050],[11760,47420],[12060,47790]],lv:[3,3],both:true,w:56});
  WIND.stream({id:'f_rib_home',pts:[[12450,46450],[11700,46700],[10950,46750]],lv:[5,2],w:60});
  for(const [x,y] of [[11260,46760],[11640,46900],[12040,46200],[12950,45920],[12300,46000],[13340,47160],[12260,47830]]) f2wObj('chimes',x,y);
  for(const [x,y,a,len] of [[11650,46980,0.2,80],[12230,46420,-0.6,70],[13050,47320,2.6,70]]) f2wObj('ropebridge',x,y,{a,len});
  F2WD.temple=f2wObj('temple',12650,46470);
  f2wLM(B,{id:'f_lm_singing',x:13250,y:47250,r:20,clr:40,prompt:S('Look at the Singing Stone','Look at the stone'),draw:(o,t)=>f2wDrawSinging(o,t),
    act:()=>f2wSay([S('A tall white stone full of holes, like a flute made by a giant. The wind whistles through it. Maybe faster wind would play a real tune.','A stone full of holes. Fast wind might play a tune.')])});
  F2WD.singing=LANDMARKS[LANDMARKS.length-1];
  B.sign('f_sign_rim',10820,46640,S('THE EAST RIM. The Sky Isles are that way. Fly with care. (The monks say: "Wheee." That is all they say.)','The Sky Isles! Fly with care.'));
  B.sign('f_sign_gap',10120,44660,S('THE HOWLING GAP. Do not jump. Do not fly. Do not look down. (You looked down.)','THE HOWLING GAP. Do not look down!'));
  CHESTS.push({id:'f_ch_isle5',x:12220,y:47920,b:29,open:false},{id:'f_ch_shelf',x:10200,y:47720,b:23,open:false});
  // ---- the Stonehorn Badlands: the Horned Gate, the Rune Drum, the Mammoth Graveyard's skull drum, the horn rocks
  F2WD.horned=f2wObj('hornedgate',12200,42440);
  F2WD.rune=p3Add('drum',{id:'f_lm_runedrum',x:13300,y:41380,r:42,then:(o,n)=>f2wRuneDrum(o,n)});
  F2WD.skull=f2wObj('skulldrum',11000,41680);
  f2wLM(B,{id:'f_lm_skulldrum',x:11000,y:41700,r:0,clr:40,prompt:()=>G.found.f_sec_graveyard?null:S('Look at the mammoth skull','Look at the skull'),draw:()=>{},
    act:()=>f2wSay([S('A mammoth skull as big as a cart, with a drum skin stretched over its top. The bones around it look like they would rattle if something heavy landed on it.','A big skull with a drum on top. Land on it hard!')])});
  p3On(LANDMARKS[LANDMARKS.length-1],{pound:{r:110,then:()=>f2wGraveyard()}});
  CHESTS.push({id:'f_ch_horn',x:12800,y:42860,b:25,open:false});
  B.sign('f_sign_stonehorn',10260,43280,S('THE STONEHORN BADLANDS. Home of the Stonehorns. Knock before entering. Knock LOUDLY.','STONEHORN. Knock loudly!'));
  // ---- the Shiversea: the Frozen Shipwreck (deck, masts, the mast post), Juniper's broken mast, Pepper's floe
  f2wObj('wreckmast',1520,42620,{v:0}); f2wObj('wreckmast',1700,42610,{v:1});
  CHESTS.push({id:'f_ch_wreck',x:1740,y:42612,b:26,open:false});
  f2wLM(B,{id:'f_lm_wreck',x:1600,y:42780,r:0,clr:40,prompt:S('Look at the frozen ship','Look at the ship'),draw:()=>{},act:()=>f2wSay([S('An old ship, frozen into the floe up to its deck. Icicles hang off the rigging like a chandelier. The name on the stern says: THE SNOWY PARSNIP.','A frozen old ship: THE SNOWY PARSNIP.')])});
  f2wObj('juniperpost',2050,42180);
  // ---- the two mouths of Juniper's Tunnel (in the bluff north of Rimeholm, and in the Dreadmoor's face at Glimmer Point)
  f2wObj('tunnel',1750,46104,{end:'w'}); f2wObj('tunnel',6500,44754,{end:'e'});
  // ---- Hask's runaway dogs (quest f_dogs): Snowball in camp f_c1, Pepper on a floe, Biscuit Two on the Windscour's
  // face, Sergeant on Sky Isle 5, Mittens frozen in the ice of the Glimmerfrost
  F2WD.dogs=[[1,3960,50560],[2,1200,43150],[3,9350,47740],[4,12110,47950],[5,4700,45300]].map(([i,x,y])=>{ const o=f2wLM(B,{id:'f_dog_'+i,x,y,r:0,clr:40,dog:i,hidden:()=>F2WD.noDogs||F2WF('f_dog'+i)||(i===1&&!(G.campsCleared&&G.campsCleared.f_c1)&&!F2WD.dogFree1)||(i===5&&!(F2WD.dogIce&&F2WD.dogIce.done)),
    prompt:S('Pat the dog','Pat the dog'),draw:(o,t)=>f2wDrawDog(o,t),act:o=>{ if(F2WF('f_dog'+o.dog)) return; f2wDogFound(o.dog,o); }}); return o; });
  F2WD.dogIce=p3Add('icewall',{id:'f_dog5_ice',x:4700,y:45304,w:64,h:40,hh:54,style:'block',need:1.2});
  // ---- the frozen fish on the pressure ridge (secret 6)
  F2WD.fish=f2wObj('bigfish',4450,45040);
  f2wLM(B,{id:'f_lm_bigfish',x:4450,y:45040,r:0,clr:60,prompt:()=>G.found.f_sec_ridge?null:S('Look at the frozen fish','Look at the fish'),draw:()=>{},act:()=>f2wSay([S('A fish the size of a canoe, frozen into the ridge. It has a chest in its mouth. It does not look like it wants to share.','A huge frozen fish with a chest in its mouth!')])});
  p3On(LANDMARKS[LANDMARKS.length-1],{r:70,blaze:{need:2,h:30,when:()=>!G.found.f_sec_ridge,then:()=>f2wFishFree()}});
  // ---- the Pinewhisper: lantern posts along the trails, the cave of Mumble's Hollow, yeti footprints
  for(const [x,y] of [[8900,48920],[9300,49140],[9800,49320],[10200,49520],[10850,49540],[11850,49460],[12200,49300],[12700,49050],[13000,48760],[10120,47880],[9660,48170]]) f2wObj('lamp',x,y);
  B.sign('f_sign_pine',9450,49050,S("THE PINEWHISPER. East: Hask's Rest. Mind the wolves. Mind the big footprints. Do not mind the yeti. He minds you.","THE PINEWHISPER. Hask's Rest is east."));
  // ---- the Crown of Dread: the black ice spike Glaciar coils round, the summit door
  F2WD.spike=f2wObj('spike',7300,41250);
  f2wObj('summitdoor',7060,41650);
  // (the Chain Stones, the West ice wall, the vent at 7650,41500 and its ribbon up to the East slab are the boss module's)
  // ---- signs at the crossroads
  B.sign('f_sign_rimroad',4300,49560,S('THE RIM ROAD: north-west to Rimeholm. THE WHITE ROAD: east to Hearthold.','Rimeholm: north-west. Hearthold: east.'));
  B.sign('f_sign_windroad',7600,48920,S('THE WIND ROAD: east and up, to the Windscour. THE TAIGA TRAIL: east, into the pines.','The Windscour: up east. The pines: east.'));
}
// ---------- the Ice Sculpture Garden (secret 4): blaze Grizzlefang (he fell first) and a chest rises
function f2wGarden(B){
  const G0={x:8200,y:47400,st:[]}; F2WD.garden=G0;
  for(let i=0;i<6;i++){ const a=-Math.PI*0.95+i/5*Math.PI*0.9, x=G0.x+Math.cos(a)*170, y=G0.y+Math.sin(a)*110+60; const S0={i,x,y,heat:0,melt:0}; G0.st.push(S0);
    f2wObj('istatue',x,y,{i});
    const L=f2wLM(B,{id:'f_garden_'+i,x,y,r:0,clr:60,prompt:S('Look at the ice statue','Look at the statue'),draw:()=>{},act:()=>f2wSay([['narr',F2W_STATUE[i]]])});
    p3On(L,{r:30,blaze:{need:1.6,h:60,repeat:true,when:()=>S0.melt<=0,then:()=>f2wGardenMelt(i)},fire:(o,dt,blue)=>{ if(blue) S0.heat=Math.min(1,S0.heat+dt/1.6); }}); }
  B.sign('f_sign_garden',8200,47560,S('THE ICE SCULPTURE GARDEN. "THE FIRST ONE TO FALL GUARDS THE GOLD."','THE FIRST ONE TO FALL GUARDS THE GOLD.'));
}
const F2W_STATUE=[S('An ice statue of a kobold chieftain with a very big axe. The plaque says: GRIZZLEFANG.','A kobold chief made of ice: GRIZZLEFANG.'),S('An ice statue of a priest in a tall hood. The plaque says: MORROW.','A priest made of ice: MORROW.'),
  S('An ice statue of a drake with her wings spread. The plaque says: THE BROOD MOTHER.','A drake made of ice: THE BROOD MOTHER.'),S('An ice statue of something with far too many teeth. The plaque says: GLOAMJAW.','Lots of icy teeth: GLOAMJAW.'),
  S('An ice statue of a great grey wolf. The plaque says: GREYMANE.','A wolf made of ice: GREYMANE.'),S('An ice statue of a knight with a burning lance (the fire is ice too). The plaque says: SIR CINDERVANE.','A knight made of ice: SIR CINDERVANE.')];
function f2wGardenMelt(i){
  const S0=F2WD.garden.st[i]; S0.melt=60; S0.heat=0; f2wSnd('crack',0.8);
  for(let k=0;k<14;k++) emit(S0.x+rand(-20,20),S0.y-rand(10,90),1,{col:'220,240,255',glow:false,ang:-Math.PI/2,spread:1,smin:20,smax:80,lmin:.5,lmax:1,zmin:3,zmax:6,grow:8,drag:1,alpha:0.6});
  if(i===0&&!G.found.f_sec_garden){ G.found.f_garden_chest=1; f2wSecret('f_sec_garden',S('The Ice Sculpture Garden','The Ice Garden')); if(!CHESTS.some(c=>c.id==='f_ch_garden')){ CHESTS.push({id:'f_ch_garden',x:F2WD.garden.x,y:F2WD.garden.y+10,b:21,open:false}); mapListsReset(); } shake(4); }
  else if(i!==0&&!G.found.f_sec_garden) ftext(S0.x,S0.y-100,S('Drip. Wrong one!','Wrong one!'),'#dff4ff',14);
}
function f2wFrostington(){ G.found.f_sec_frostington=true; F2WD.frostHeat=0; f2wSnd('whoosh',1); shake(4); emit(4600,48220,40,{col:'235,245,255',glow:false,smin:40,smax:200,lmin:.5,lmax:1.2,zmin:3,zmax:7,grow:8,drag:2});
  if(F2WD.frost&&F2WD.frost.cols) for(const c of F2WD.frost.cols) removeCol(c);
  if(typeof ITEM_NAMES!=='undefined'&&!ITEM_NAMES.f_parsnip) ITEM_NAMES.f_parsnip=S('the Parsnip of Fate','the Parsnip of Fate');
  f2wSecret('f_sec_frostington',S('Sir Frostington','Sir Frostington'));
  f2wSay([S('Sir Frostington slumps into a very large puddle. In the middle of it lies a single, glowing parsnip.','The snowman melts. A glowing parsnip is left!'),['tove',S('A parsnip. Of FATE. Your family collects the strangest vegetables.','A parsnip of FATE. Your family loves odd vegetables.')]],()=>giveItems({f_parsnip:1})); }
function f2wGraveyard(){ if(G.found.f_sec_graveyard) return; f2wSnd('thud',1); shake(8); f2wSecret('f_sec_graveyard',S('The Mammoth Graveyard','The Mammoth Graveyard'));
  ftext(11000,41580,S('Rattle rattle rattle!','Rattle rattle!'),'#f4e4d0',15);
  if(!CHESTS.some(c=>c.id==='f_ch_graveyard')){ CHESTS.push({id:'f_ch_graveyard',x:11080,y:41760,b:25,open:false}); mapListsReset(); } saveGame(); }
function f2wFishFree(){ if(G.found.f_sec_ridge) return; f2wSnd('crack',1); f2wSecret('f_sec_ridge',S('The Frozen Fish','The Frozen Fish'));
  if(!CHESTS.some(c=>c.id==='f_ch_ridge')){ CHESTS.push({id:'f_ch_ridge',x:4520,y:45050,b:22,open:false}); mapListsReset(); } saveGame(); }
// ---------- Mags's powder crate in Snowgob Gulch (the people helper's f_bombs reads item f_powder)
function f2wDrawCrate(t){ const C=F2WD.gulchCrate; if(C.st!=='up'||F2WD.noPowderCrate) return; f2wPut(f2wTall('pcrate',40,40,20,32,g=>{ f2wEll(g,2,4,16,5,'rgba(40,40,70,.3)'); f2wShade(g,-14,-24,28,26,'#a07a4a',2); g.strokeStyle='#5a3e22'; g.lineWidth=1.4; g.strokeRect(-14,-24,28,26); g.fillStyle='#c83a2a'; g.font=`900 7px ${UIF}`; g.textAlign='center'; g.fillText('BOOM',0,-8); f2wSnowCap(g,-13,13,-25,2.4,mulberry32(5)); }),C.x,C.y); }
function f2wPushCrate(){ const C=F2WD.gulchCrate; if(C.st!=='up') return; C.st='down'; G.found.f_powder_pushed=1; f2wSnd('thud',1); shake(4); emit(5290,50720,24,{col:'240,245,250',glow:false,smin:40,smax:160,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:6}); setBanner(S('THUMP!','THUMP!'),S('The crate lands in a snowdrift below.','It lands in the snow below.'),2); saveGame(); }
function f2wTakeCrate(){ const C=F2WD.gulchCrate; if(C.st!=='down') return; C.st='gone'; G.found.f_powder_crate=1; if(typeof ITEM_NAMES!=='undefined'&&!ITEM_NAMES.f_powder) ITEM_NAMES.f_powder=S("Mags's blasting powder","Mags's blasting powder"); giveItems({f_powder:1}); questPoke(); saveGame(); }
// a dog waiting to be found
// a sled dog in harness, waiting at a sled post (the line is open): small, sitting, tail wagging
const F2W_DOGCOL=['#f6f6f2','#3a3a42','#c8a070','#8a5a3a','#e8e4dc'];
function f2wSledDog(x,y,i,t){ const c=F2W_DOGCOL[i%5], wag=Math.sin(t*9+i*1.7), ol=LOOK.sb?SBC.outline:'#2a2a30';
  ctx.fillStyle='rgba(40,40,70,.22)'; ctx.beginPath(); ctx.ellipse(x,y+3,8,3,0,0,TAU); ctx.fill();
  ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(x,y-3,6.6,5.4,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x+3,y-10,4.8,0,TAU); ctx.fill();
  ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(x,y-3,5.4,4.3,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x+3,y-10,3.8,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x+0.6,y-12.4); ctx.lineTo(x+1.2,y-16); ctx.lineTo(x+3,y-13); ctx.moveTo(x+4,y-13); ctx.lineTo(x+5.6,y-16); ctx.lineTo(x+6.2,y-12); ctx.fill();
  ctx.fillStyle='#c83a3a'; ctx.fillRect(x-3,y-7,7,1.6); ctx.fillStyle='#1a1a20'; ctx.beginPath(); ctx.arc(x+4.6,y-10.6,0.8,0,TAU); ctx.arc(x+6.4,y-9,0.9,0,TAU); ctx.fill();
  ctx.strokeStyle=c; ctx.lineWidth=2.4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x-5,y-4); ctx.quadraticCurveTo(x-9,y-8+wag*2,x-8+wag*3,y-11); ctx.stroke(); }
function f2wDrawDog(o,t){ if(o.hidden&&o.hidden()) return; const i=o.dog, cols=['#f6f6f2','#3a3a42','#c8a070','#8a5a3a','#e8e4dc'], x=o.x, y=o.y, wag=Math.sin(t*10+i)*0.5, bark=Math.sin(t*3+i)>0.9;
  ctx.fillStyle='rgba(40,40,70,.25)'; ctx.beginPath(); ctx.ellipse(x,y+4,12,4,0,0,TAU); ctx.fill();
  ctx.fillStyle=LOOK.sb?SBC.outline:'#2a2a30'; ctx.beginPath(); ctx.ellipse(x,y-4,10,7,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x+6,y-13,6.4,0,TAU); ctx.fill();
  ctx.fillStyle=cols[i-1]; ctx.beginPath(); ctx.ellipse(x,y-4,8.8,5.8,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x+6,y-13,5.2,0,TAU); ctx.fill();
  ctx.fillStyle='#1a1a20'; ctx.beginPath(); ctx.arc(x+9,y-14,1,0,TAU); ctx.arc(x+5,y-14,1,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x+8,y-10.4,1.4,0,TAU); ctx.fill();
  ctx.strokeStyle=cols[i-1]; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-8,y-6); ctx.quadraticCurveTo(x-14,y-12-wag*4,x-12+wag*6,y-16); ctx.stroke();
  if(bark&&!F2WD.barkT&&dist2(player.x,player.y,x,y)<500*500){ F2WD.barkT=1; later(1.2,()=>{ F2WD.barkT=0; }); f2wSnd('woof',0.6); ftext(x+6,y-30,S('Woof!','Woof!'),'#fff4e0',12); } }
function f2wDrawSinging(o,t){ const sung=G.time-(F2WD.singT||-99)<4; f2wPut(f2wTall('singing',60,110,30,96,g=>{ f2wEll(g,3,4,20,6,'rgba(60,50,90,.3)'); celFill(g,(q,dx,dy)=>{ q.moveTo(-16+dx,4+dy); q.lineTo(-12+dx,-80+dy); q.quadraticCurveTo(dx,-94+dy,12+dx,-80+dy); q.lineTo(16+dx,4+dy); q.closePath(); },'#f2eef8',{r:16});
    for(const [x,y,r] of [[-5,-66,3.4],[4,-52,3],[-3,-36,3.6],[5,-22,2.6],[-6,-12,2.4]]) f2wEll(g,x,y,r,r*1.2,'#4a3a5a'); }),o.x,o.y);
  if(sung){ for(let i=0;i<4;i++){ const k=((t*0.6+i/4)%1); ctx.fillStyle=`rgba(255,236,160,${0.8*(1-k)})`; ctx.font=`900 ${10+i}px ${UIF}`; ctx.textAlign='center'; ctx.fillText('♪',o.x+Math.sin(t*2+i)*16,o.y-90-k*50); } glowAt(o.x,o.y-50,40,'255,236,170',0.25); } }

// ================= 9. ground art painted into the chunks (ELEV.deco, in level order) and the live ground pieces
// cobbles in a disc or along a street: chunky rounded stones in two tones, a few lit ones
function f2wCobbles(g,rng,inside,bb,n,cols){
  const pb=F2WD.pb||[-1e9,-1e9,1e9,1e9];
  for(let i=0;i<n;i++){ const x=bb[0]+rng()*(bb[2]-bb[0]), y=bb[1]+rng()*(bb[3]-bb[1]); if(!inside(x,y)) continue; const w=8+rng()*6, h=5+rng()*3, c=cols[Math.floor(rng()*cols.length)], lit=rng()<0.25;
    if(x<pb[0]-12||x>pb[2]+12||y<pb[1]-10||y>pb[3]+10) continue;
    g.fillStyle='rgba(90,84,96,.35)'; rrect(g,x-w/2+0.8,y-h/2+1.2,w,h,2.4); g.fill(); g.fillStyle=c; rrect(g,x-w/2,y-h/2,w,h,2.4); g.fill(); if(lit){ g.fillStyle='rgba(255,255,255,.8)'; rrect(g,x-w/2+1,y-h/2+0.6,w*0.4,1.4,0.7); g.fill(); } }
}
// a deco paint that records the chunk bounds first (so the cobbles only draw the stones in this chunk)
function f2wPB(fn){ return (g,x0,y0,x1,y1)=>{ F2WD.pb=[x0,y0,x1,y1]; try{ fn(g); } finally{ F2WD.pb=null; } }; }
function f2wPaintTown(g){
  const C=F2WG.town, rng=mulberry32(4401), stone=['#d6d2d4','#cac6cc','#dedad8','#c2bec6'];
  g.save();
  // the whole floor inside the wall: packed snow over cobbles, then the cross of streets and the round plaza
  g.fillStyle='rgba(200,196,206,.35)'; g.beginPath(); g.arc(C.x,C.y,C.r-14,0,TAU); g.fill();
  g.fillStyle='rgba(186,180,192,.55)'; rrect(g,C.x-C.r,C.y-44,C.r*2,88,30); g.fill(); rrect(g,C.x-44,C.y-C.r,88,C.r-120,30); g.fill();
  g.beginPath(); g.arc(C.x,C.y-40,222,0,TAU); g.fill();
  f2wCobbles(g,rng,(x,y)=>Math.abs(y-C.y)<40&&Math.abs(x-C.x)<C.r-4||Math.abs(x-C.x)<40&&y<C.y-110&&y>C.y-C.r+4||dist(x,y,C.x,C.y-40)<218,[C.x-C.r,C.y-C.r,C.x+C.r,C.y+60],2600,stone);
  g.strokeStyle='rgba(150,140,160,.6)'; g.lineWidth=3; g.beginPath(); g.arc(C.x,C.y-40,222,0,TAU); g.stroke();
  // little lanes to the doors
  for(const h of HOUSES){ if(h.town!=='f_hearthold') continue; const dx=h.x, dy=h.y+h.h/2+16; g.fillStyle='rgba(186,180,192,.5)'; rrect(g,dx-14,dy-6,28,Math.max(20,Math.abs(C.y-dy)*0.15),8); g.fill(); }
  g.restore();
}
function f2wPaintPlaza(g){
  const P=F2WG.plaza, rng=mulberry32(4402); g.save();
  g.fillStyle='rgba(120,110,140,.35)'; g.beginPath(); g.ellipse(P.x,P.y,P.r,P.r*0.72,0,0,TAU); g.fill();
  f2wCobbles(g,rng,(x,y)=>((x-P.x)/P.r)**2+((y-P.y)/(P.r*0.72))**2<0.92,[P.x-P.r,P.y-P.r,P.x+P.r,P.y+P.r],1400,['#8a82a0','#7a7290','#968eac']);
  g.strokeStyle='rgba(176,140,240,.55)'; g.lineWidth=3; g.beginPath(); g.ellipse(P.x,P.y,P.r*0.98,P.r*0.7,0,0,TAU); g.stroke();
  g.strokeStyle='rgba(176,140,240,.35)'; g.lineWidth=2; for(let i=0;i<12;i++){ const a=i/12*TAU; g.beginPath(); g.moveTo(P.x+Math.cos(a)*P.r*0.3,P.y+Math.sin(a)*P.r*0.22); g.lineTo(P.x+Math.cos(a)*P.r*0.9,P.y+Math.sin(a)*P.r*0.64); g.stroke(); }
  g.restore();
}
function f2wPaintCrown(g){
  const C=F2WG.crown; g.save();
  g.fillStyle='rgba(30,22,44,.25)'; g.beginPath(); g.arc(C.x,C.y,C.r*0.82,0,TAU); g.fill();
  g.strokeStyle='rgba(190,160,255,.5)'; g.lineWidth=4; for(const r of [C.r*0.8,C.r*0.55]){ g.beginPath(); g.arc(C.x,C.y,r,0,TAU); g.stroke(); }
  // twelve carved marks round the ring: a stem with one or two little branches each (drawn, so no font is needed)
  g.strokeStyle='rgba(200,180,255,.55)'; g.lineWidth=3; g.lineCap='round';
  for(let i=0;i<12;i++){ const a=i/12*TAU; g.save(); g.translate(C.x+Math.cos(a)*C.r*0.68,C.y+Math.sin(a)*C.r*0.68); g.rotate(a+Math.PI/2); g.beginPath(); g.moveTo(0,-11); g.lineTo(0,11);
    const m=i%4; if(m===0){ g.moveTo(0,-9); g.lineTo(7,-3); g.moveTo(0,-1); g.lineTo(7,5); } else if(m===1){ g.moveTo(0,-9); g.lineTo(7,-4); g.lineTo(0,1); } else if(m===2){ g.moveTo(-6,-8); g.lineTo(6,8); } else { g.moveTo(0,-4); g.lineTo(-6,-10); g.moveTo(0,-4); g.lineTo(6,-10); }
    g.stroke(); g.restore(); }
  // the four Chain Stones' sockets (the boss helper puts the stones and their chains in them, bible 5.2)
  for(const [x,y] of [[7300,41700],[6820,41250],[7780,41150],[7300,40760]]){ g.fillStyle='rgba(20,14,30,.55)'; g.beginPath(); g.ellipse(x,y+10,30,12,0,0,TAU); g.fill(); g.strokeStyle='rgba(176,140,240,.7)'; g.lineWidth=2.4; g.beginPath(); g.ellipse(x,y+10,30,12,0,0,TAU); g.stroke(); }
  g.restore();
}
// the frozen farm fields of the Vale: neat squares of snow with furrow stripes, low stone walls between them
const F2WFIELDS=[[4500,49720,5250,50150,0.1],[6050,49700,6650,50250,-0.05],[7000,49700,7700,50300,0.08],[7800,49500,8400,50000,-0.12],[4700,50300,5000,50800,0],[6100,50400,6900,50850,0.05],[7600,50400,8300,50800,-0.06],[8800,49300,9100,49900,0.1]];
function f2wPaintField(g,f){
  const [x0,y0,x1,y1,a]=f, cx=(x0+x1)/2, cy=(y0+y1)/2, w=x1-x0, h=y1-y0; g.save(); g.translate(cx,cy); g.rotate(a);
  g.fillStyle='rgba(236,232,224,.8)'; rrect(g,-w/2,-h/2,w,h,12); g.fill(); g.beginPath(); rrect(g,-w/2,-h/2,w,h,12); g.clip();
  g.strokeStyle='rgba(170,160,140,.45)'; g.lineWidth=3; for(let y=-h/2+14;y<h/2;y+=22){ g.beginPath(); g.moveTo(-w/2,y); for(let x=-w/2;x<=w/2;x+=40) g.lineTo(x,y+Math.sin(x*0.05)*1.5); g.stroke(); }
  g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=2; for(let y=-h/2+10;y<h/2;y+=22){ g.beginPath(); g.moveTo(-w/2,y); g.lineTo(w/2,y); g.stroke(); }
  g.restore(); g.save(); g.translate(cx,cy); g.rotate(a);
  // the low stone wall round the field (drawn as rounded stones)
  const rng=mulberry32((x0*7+y0)|0), per=[[-w/2,-h/2,w/2,-h/2],[w/2,-h/2,w/2,h/2],[w/2,h/2,-w/2,h/2],[-w/2,h/2,-w/2,-h/2]];
  for(const [ax,ay,bx,by] of per){ const L=Math.hypot(bx-ax,by-ay), n=Math.floor(L/13); for(let i=0;i<n;i++){ if((i+3)%17===0) { i+=3; continue; } const k=i/n, x=lerp(ax,bx,k), y=lerp(ay,by,k), r=4.5+rng()*2;
    g.fillStyle=SBC.outline; g.beginPath(); g.ellipse(x,y,r+1.4,r*0.8+1.4,0,0,TAU); g.fill(); g.fillStyle='#9a96a0'; g.beginPath(); g.ellipse(x,y,r,r*0.8,0,0,TAU); g.fill(); g.fillStyle='#f6f8fc'; g.beginPath(); g.ellipse(x-0.6,y-r*0.4,r*0.85,r*0.42,0,0,TAU); g.fill(); } }
  g.restore();
}
// Rimeholm: the terrace lanes, the glazed quay planks, the chapel front with its carved dragon round a snowflake
function f2wPaintRime(g){
  const rng=mulberry32(4403); g.save();
  f2wCobbles(g,rng,(x,y)=>f2wSegD([[2700,47250],[2500,47190],[2160,47120],[1820,47060],[1560,47060],[1500,46900],[1560,46700],[1800,46560],[2100,46460],[2460,46470]],x,y)<26,[1300,46300,2700,47700],1600,['#c8ccd4','#bcc2cc','#d4d8de']);
  g.restore();
}
function f2wPaintChapel(g){
  const r=F2WE.chapel, x0=r[0], x1=r[2], fy=r[3]; g.save();
  // slate tiles on the roof, the front wall on the step face below the roof edge
  g.strokeStyle='rgba(30,40,60,.4)'; g.lineWidth=1.2; for(let y=r[1]+8;y<fy;y+=9){ g.beginPath(); g.moveTo(x0+2,y); g.lineTo(x1-2,y); g.stroke(); }
  g.fillStyle='rgba(246,250,255,.92)'; g.beginPath(); g.ellipse((x0+x1)/2-10,r[1]+20,44,10,0,0,TAU); g.fill();
  g.fillStyle=SBC.outline; rrect(g,(x0+x1)/2-12,fy+2,24,22,5); g.fill(); g.fillStyle='#6a4a2c'; rrect(g,(x0+x1)/2-10,fy+4,20,20,4); g.fill();
  const cx=x0+26, cy=fy+12; g.strokeStyle='#e8eef8'; g.lineWidth=2.4; g.beginPath(); g.arc(cx,cy,7,0.4,TAU-0.4); g.stroke(); for(let i=0;i<6;i++){ const a=i/6*TAU; g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(a)*4,cy+Math.sin(a)*4); g.stroke(); }
  g.fillStyle='#e8eef8'; g.beginPath(); g.moveTo(cx+7,cy-3); g.lineTo(cx+12,cy-7); g.lineTo(cx+9,cy-1); g.fill();
  g.restore();
}
function f2wPaintSmokeYard(g){ const r=F2WE.plinth; g.save(); g.strokeStyle='rgba(60,40,30,.5)'; g.lineWidth=5; g.beginPath(); g.moveTo(r[0]+10,r[1]+12); g.lineTo(r[2]-14,r[3]-16); g.moveTo(r[2]-20,r[1]+10); g.lineTo(r[0]+30,r[3]-12); g.stroke(); g.strokeStyle='#7a5634'; g.lineWidth=3; g.stroke(); g.fillStyle='rgba(40,30,30,.3)'; g.fillRect(r[0]+6,r[1]+4,r[2]-r[0]-12,6); g.restore(); }
// the shipwreck's deck: planks, a hatch, frost
function f2wPaintDeck(g){ const r=F2WE.deck; g.save(); g.beginPath(); g.rect(r[0],r[1],r[2]-r[0],r[3]-r[1]); g.clip(); g.strokeStyle='rgba(40,24,14,.5)'; g.lineWidth=1.4; for(let y=r[1]+12;y<r[3];y+=13){ g.beginPath(); g.moveTo(r[0],y); g.lineTo(r[2],y); g.stroke(); }
  g.fillStyle='rgba(220,236,250,.55)'; for(let i=0;i<8;i++){ g.beginPath(); g.ellipse(r[0]+30+i*55,r[1]+20+(i%3)*30,22,6,0,0,TAU); g.fill(); } g.fillStyle='#3a2414'; rrect(g,1590,42600,40,26,3); g.fill(); g.restore(); }
// Mumble's Hollow: a big dark cave mouth in the climbable face (the yeti lives here)
function f2wPaintHollow(g){ const x=13050, y=48560; g.save(); g.fillStyle=SBC.outline; g.beginPath(); g.moveTo(x-46,y+86); g.quadraticCurveTo(x-48,y+6,x,y); g.quadraticCurveTo(x+48,y+6,x+46,y+86); g.closePath(); g.fill(); g.fillStyle='#10161e'; g.beginPath(); g.moveTo(x-42,y+86); g.quadraticCurveTo(x-44,y+10,x,y+4); g.quadraticCurveTo(x+44,y+10,x+42,y+86); g.closePath(); g.fill();
  f2wIcicles(g,x-40,x+40,y+10,16,mulberry32(19)); g.restore(); }
// big yeti footprints from the Hollow off into the pines
function f2wPaintPrints(g){ const P=[[13000,48760],[12780,48900],[12560,49080],[12380,49300],[12300,49560],[12200,49820]]; g.save();
  for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1], n=Math.floor(dist(a[0],a[1],b[0],b[1])/46), ang=angTo(a[0],a[1],b[0],b[1]); for(let k=0;k<n;k++){ const x=lerp(a[0],b[0],k/n)+Math.cos(ang+Math.PI/2)*(k%2?9:-9), y=lerp(a[1],b[1],k/n)+Math.sin(ang+Math.PI/2)*(k%2?9:-9);
    g.save(); g.translate(x,y); g.rotate(ang+Math.PI/2); g.fillStyle='rgba(120,140,170,.45)'; g.beginPath(); g.ellipse(0,0,7,11,0,0,TAU); g.fill(); for(let t=-1;t<=1;t++){ g.beginPath(); g.arc(t*4.4,-12,2.6,0,TAU); g.fill(); } g.restore(); } } g.restore(); }
// sled tracks down Soren's Sled Hill, trampled snow round Hask's camp
function f2wPaintSledHill(g){ g.save(); g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(7900,48250,190,120,0,0,TAU); g.fill(); g.strokeStyle='rgba(150,160,190,.5)'; g.lineWidth=1.6;
  for(let i=0;i<5;i++){ const x0=7820+i*40; for(const o of [-4,4]){ g.beginPath(); g.moveTo(x0+o,48140); g.quadraticCurveTo(x0+o+30,48250,x0+o-10,48380); g.stroke(); } } g.restore(); }
function f2wPaintCamp(g){ g.save(); g.fillStyle='rgba(200,190,180,.45)'; g.beginPath(); g.ellipse(11400,49640,280,200,0,0,TAU); g.fill(); const rng=mulberry32(4405); for(let i=0;i<60;i++){ const a=rng()*TAU, d=rng()*240; f2wTrack(g,11400+Math.cos(a)*d,49640+Math.sin(a)*d*0.7,rng()*TAU,'rgba(110,100,90,.35)'); } g.restore(); }
// the Temple isle's courtyard: white flagstones with gold inlay
function f2wPaintTemple(g){ const rng=mulberry32(4406); g.save(); g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(12650,46300,300,170,0,0,TAU); g.fill(); f2wCobbles(g,rng,(x,y)=>((x-12650)/290)**2+((y-46300)/160)**2<1,[12350,46130,12950,46470],900,['#f4f2fa','#e8e4f0','#fbfaff']);
  g.strokeStyle='rgba(224,176,72,.7)'; g.lineWidth=2.6; g.beginPath(); g.ellipse(12650,46300,180,90,0,0,TAU); g.stroke(); g.restore(); }
// the Horned Gate's approach: a trodden path of red flagstones to the skull's mouth
function f2wPaintHorned(g){ const rng=mulberry32(4407); g.save(); f2wCobbles(g,rng,(x,y)=>Math.abs(x-12200)<46&&y>42460&&y<42760||dist(x,y,12200,42500)<90,[12100,42400,12300,42760],500,['#c88a6c','#b67a5e','#d49a7e']); g.restore(); }
// the Steamwell's warm banks: bare dark rock and moss where the snow cannot settle
function f2wPaintSteam(g){ const S0=F2WG.steam; g.save(); g.fillStyle='rgba(120,130,110,.45)'; g.beginPath(); g.ellipse(S0.x,S0.y+6,S0.r+46,S0.r*0.85+40,0,0,TAU); g.fill(); g.fillStyle='rgba(110,150,100,.5)'; const rng=mulberry32(4408); for(let i=0;i<40;i++){ const a=rng()*TAU, d=S0.r+10+rng()*30; g.beginPath(); g.ellipse(S0.x+Math.cos(a)*d,S0.y+Math.sin(a)*d*0.85,5+rng()*6,3+rng()*2,0,0,TAU); g.fill(); } g.restore(); }
// a crust of ice along the river banks (decor only: the water still blocks)
function f2wPaintRiverIce(g,pts,w){ g.save(); g.lineCap='round'; g.lineJoin='round'; for(const off of [-1,1]){ g.strokeStyle='rgba(236,246,252,.85)'; g.lineWidth=10; g.beginPath(); pts.forEach((p,i)=>{ const q=pts[Math.min(i+1,pts.length-1)], r=pts[Math.max(i-1,0)], a=Math.atan2(q[1]-r[1],q[0]-r[0])+Math.PI/2; const x=p[0]+Math.cos(a)*w*off, y=p[1]+Math.sin(a)*w*off; i?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); } g.restore(); }
function f2wPaint(){
  const k=2;
  ELEV.deco({k,bb:[6180,48380,7420,49620],lvl:0,order:1,paint:f2wPB(g=>f2wPaintTown(g))});
  ELEV.deco({k,bb:[6860,43980,7740,44620],lvl:1,order:1,paint:f2wPB(g=>f2wPaintPlaza(g))});
  ELEV.deco({k,bb:[6730,40680,7870,41820],lvl:6,order:1,paint:g=>f2wPaintCrown(g)});
  for(const f of F2WFIELDS) ELEV.deco({k,bb:[f[0]-60,f[1]-60,f[2]+60,f[3]+60],lvl:0,order:1,paint:g=>f2wPaintField(g,f)});
  ELEV.deco({k,bb:[1290,46290,2710,47710],lvl:1,order:1,paint:f2wPB(g=>f2wPaintRime(g))});
  ELEV.deco({k,bb:[F2WE.chapel[0]-4,F2WE.chapel[1]-4,F2WE.chapel[2]+4,F2WE.chapel[3]+30],lvl:2,order:8,paint:g=>f2wPaintChapel(g)});
  ELEV.deco({k,bb:[F2WE.plinth[0],F2WE.plinth[1],F2WE.plinth[2],F2WE.plinth[3]],lvl:2,order:7,paint:g=>f2wPaintSmokeYard(g)});
  ELEV.deco({k,bb:F2WE.deck,lvl:1,order:7,paint:g=>f2wPaintDeck(g)});
  ELEV.deco({k,bb:[12990,48550,13110,48650],lvl:2,order:8,paint:g=>f2wPaintHollow(g)});
  ELEV.deco({k,bb:[12150,48700,13060,49860],lvl:0,order:2,paint:g=>f2wPaintPrints(g)});
  ELEV.deco({k,bb:[7700,48120,8100,48380],lvl:0,order:2,paint:g=>f2wPaintSledHill(g)});
  ELEV.deco({k,bb:[11110,49430,11690,49850],lvl:0,order:1,paint:g=>f2wPaintCamp(g)});
  ELEV.deco({k,bb:[12340,46120,12960,46480],lvl:5,order:2,paint:f2wPB(g=>f2wPaintTemple(g))});
  ELEV.deco({k,bb:[12100,42400,12300,42770],lvl:2,order:2,paint:f2wPB(g=>f2wPaintHorned(g))});
  ELEV.deco({k,bb:[3590,49200,4010,49610],lvl:0,order:0,paint:g=>f2wPaintSteam(g)});
  f2wPaintVents(); f2wPaintIsles();
  const rivs=MAPS[2].terrain.rivers; for(const r of rivs){ let b=[1e9,1e9,-1e9,-1e9]; for(const p of r.pts){ b[0]=Math.min(b[0],p[0]); b[1]=Math.min(b[1],p[1]); b[2]=Math.max(b[2],p[0]); b[3]=Math.max(b[3],p[1]); } ELEV.deco({k,bb:[b[0]-90,b[1]-20,b[2]+90,b[3]+20],lvl:0,order:0,paint:g=>f2wPaintRiverIce(g,r.pts,r.w+6)}); }
}

// ================= 10. the world states, the life of the north, and the hooks into the engine
// the Glacier Maze's mouth: pale glass ice with a dark blue throat
if(typeof R2CAVE!=='undefined') R2CAVE.f_glacier={rk:['#b8dcf2','#9ccaea','#d6eefa'],top:'#f4faff',dark:'#06142a'};
// ---------- regions everywhere on the map follow the plateaus and the lake (music, ambience, banners, events)
function f2wRegionFix(x,y,o){
  const lv=elevLvl(x,y);
  if(lv>0){ const hb=f2wHighB(x,y,lv); if(hb>=0) f2wSet(o,hb); return o; }
  if(f2wVoidAt(x,y)){ o.b=o.b2=29; o.t=1; return o; }
  if(y<43900&&x>5560&&x<9250) f2wSet(o,27);
  else if(f2wLakeD(x,y)<0) f2wSet(o,22);
  return o;
}
{ const base=biomeInfo; biomeInfo=function(x,y,o){ const r=base(x,y,o); if(F2WD.built&&y>=40000&&y<=51000&&x<IZX-50) f2wRegionFix(x,y,o); return r; }; }
// ---------- walking on water: the Floe Field and the stack lane are calm, the ring round Juniper's floe is deep
{ const base=mapStrideBlocked; mapStrideBlocked=function(x,y){
  if(y>=41700&&y<=47600&&x>30&&x<2700){ if(f2wJunDeep(x,y)) return true; if(f2wCalm(x,y)) return !!f2wBlock(x,y); }
  return base(x,y); }; }
// ---------- the fall into the clouds: a jump or a glide that ends over the Cloudsea or the Howling Gap drops Ash in
{ const base=backToSafe; backToSafe=function(p,bad){
  if(bad==='block'&&p.y>=40000&&p.y<=51000&&f2wVoid(p.x,p.y)){
    f2wSnd('whoosh',1); emit(p.x,p.y,26,{col:'250,248,255',glow:false,ang:Math.PI/2,spread:1.4,smin:40,smax:180,lmin:.5,lmax:1.1,zmin:3,zmax:7,grow:8,drag:2});
    ftext(p.x,p.y-30,S('Whoooaa!','Whoa!'),'#f4f0ff',15);
    base(p,bad);
    const a=p.stats.armor||1, dm=G.diff?G.diff.dmg:1; p.iframes=0; hurtPlayer(p.maxHp*(diffIdx>0?0.1:0.05)/Math.max(0.01,dm*a),p.x,p.y,0); p.iframes=Math.max(p.iframes,0.8);
    return; }
  return base(p,bad); }; }
// ---------- doors with a gate (the dungeons wait for the story), the summit door goes to the top of the mountain
{ const base=enterArea; enterArea=function(id,door){
  if(door&&door.f2w&&door.need&&!door.need()){ SFX.play('ui'); runDialogue([['narr',door.locked||S('It will not open.','It is shut.')]],()=>{ scene='play'; }); return; }
  const r=base(id,door);
  if(door&&door.f2room&&AREA&&typeof dunGo==='function'){ try{ const ids=dunFloorList(id); if(ids.some(a=>CAVEMAP[a]&&CAVEMAP[a].rooms[door.f2room])) dunGo(id,door.f2room); }catch(e){} }
  return r; }; }
// ---------- homes: a CAST person a house is planned for (house.want, or the Big Tent) gets that one; everyone else is
// placed by the stock rules in e1_maps; Rimeholm's four neighbours start frozen by their doors
{ const base=assignHomesNew; assignHomesNew=function(){
  const off=[];
  const give=(town,o,i,hsx,door)=>{ const style=STYLE_OF[o.job]||o.style||'home';
    const def=defHouse('h_'+o.id,{name:o.house||'House',owner:o.id,style,seed:1000+i+town.length*31,painting:i,egg:i+3,w:style==='inn'||style==='lodge'?680:560,h:style==='inn'?460:400,town});
    if(INDOOR[o.id]&&CASTBY[o.id]) CASTBY[o.id].inside=def.id;
    if(hsx){ hsx.owner=o.id; hsx.area=def.id; hsx.door=door; }
    DOORS.push({x:door.x,y:door.y,area:def.id,label:`Enter ${def.name}`,outY:door.outY||0,hs:hsx||undefined,owner:def.owner}); off.push(o); o.home=false; };
  try{
    for(const town of TOWN_ORDER){ if(!town.startsWith('f_')) continue;
      const owners=CAST.filter(c=>c.town===town&&c.home&&!c.generic);
      for(const h of HOUSES){ if(h.town!==town||h.k!=='house'||h.area||!h.want) continue; const i=owners.findIndex(c=>c.id===h.want&&c.home); if(i>=0) give(town,owners[i],i,h,doorOf(h)); }
      for(const v of F2WD.homes){ if(v.town!==town) continue; const i=owners.findIndex(c=>c.id===v.want&&c.home); if(i>=0){ give(town,owners[i],i,null,v.door); if(!owners[i].house) AREADEFS['h_'+owners[i].id].name=v.name; } }
    }
  }catch(e){ console.error('f2w homes',e); }
  try{ base(); } finally { for(const o of off) o.home=true; }
  try{ f2wRimeNeighbours(); }catch(e){ console.error('f2w neighbours',e); }
}; }
// ---------- frozen folk: each one needs its own trick (a level, a door, a dome, bars, the stack)
{ const K=P3K.frozen, base=K.blaze; K.blaze=function(o,dt){ if(o.f2lock&&o.st==='ice'&&o.f2lock(o)){ if(o.f2lockMsg&&canBlaze()) p3Say(o.x,o.y-70,o.f2lockMsg,'#e8dcff','frzlock'+o.id,4); return; } return base.call(this,o,dt); }; }
// ---------- houses: Rimeholm's are glazed in ice until their owner is thawed; a few Hearthold houses get their trade
const F2WHOUSE=new WeakMap();
function f2wHouseFrozen(hs){ if(hs.town!=='f_rimeholm') return false; if(hs.want) return !F2WF('f_thaw_'+hs.want); if(hs.owner&&String(hs.owner).startsWith('n_f_rimeholm')) return !F2WQ('f_rime'); return !F2WT.ylva; }
function f2wHousePaint(hs,c){
  const L=hs.L; if(!L||!c||!c.getContext) return;
  const g=c.getContext('2d'), sc=c.sc||HSC; g.save(); g.setTransform(sc,0,0,sc,c.ox*sc,c.oy*sc);
  const W=L.W, H=L.H, F=L.F||0;
  if(hs.town==='f_rimeholm'&&f2wHouseFrozen(hs)){ g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(176,206,246,.42)'; g.fillRect(-W-20,-H-60,W*2+40,H*2+80);
    g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=2; for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(-W*0.8+i*W*0.5,-H*0.6); g.lineTo(-W*0.6+i*W*0.5,H*0.2); g.stroke(); } g.globalCompositeOperation='source-over';
    f2wIcicles(g,-W,W,H-F-4,12,mulberry32(hs.seed|0)); }
  if(hs.want==='f_gunnhild'){ g.fillStyle=F2WF('f_forge_lit')?'rgba(255,150,60,.85)':'rgba(120,110,120,.6)'; g.fillRect(-W*0.5,H-F+6,W*0.34,Math.max(6,F-10)); }
  if(hs.want==='f_hilde'){ g.fillStyle='#3b2233'; g.beginPath(); g.ellipse(W*0.5,-H*0.1,11,8,0,0,TAU); g.fill(); g.fillStyle='#c84a3a'; g.beginPath(); g.ellipse(W*0.5,-H*0.1,9.4,6.4,0,0,TAU); g.fill(); g.fillStyle='#f6eee0'; g.fillRect(W*0.5-6,-H*0.1-1.4,12,2.8); }
  if(hs.want==='f_eider'){ g.fillStyle='#3b2233'; g.fillRect(W*0.42,-H*0.2,16,12); g.fillStyle='#3a5a4a'; g.fillRect(W*0.42+1.4,-H*0.2+1.4,13.2,9.2); g.fillStyle='#f2e6c6'; g.fillRect(W*0.42+7.4,-H*0.2+1.4,1.2,9.2); }
  if(hs.want==='f_mags'){ g.strokeStyle='#3b2233'; g.lineWidth=5; g.beginPath(); g.moveTo(W*0.6,H-F); g.lineTo(W*0.6,-H*0.4); g.lineTo(W*0.3,-H*0.6); g.stroke(); g.strokeStyle='#c8963a'; g.lineWidth=3; g.stroke(); }
  g.restore();
}
{ const base=houseSprite; houseSprite=function(hs){
  if(hs&&hs.town==='f_rimeholm'){ const fz=f2wHouseFrozen(hs), c0=SCACHE.get(hs); if(c0&&c0.f2fz!==fz){ SCACHE.delete(hs); hs.L=null; } }
  const c=base(hs); if(hs&&hs.town&&hs.town.startsWith('f_')&&c&&!F2WHOUSE.has(c)){ F2WHOUSE.set(c,1); c.f2fz=hs.town==='f_rimeholm'?f2wHouseFrozen(hs):null; try{ f2wHousePaint(hs,c); }catch(e){} } return c; }; }
// ---------- the air inside Hearthold's walls (warm once the Hearth burns blue) and over frozen Rimeholm
const F2WAMB=new Map();
{ const base=ambHere; ambHere=function(){ const a=base(); if(!a||curMap()!==2||!player) return a;
  const C=F2WG.town; let key=null;
  if(F2WT.lit&&dist2(player.x,player.y,C.x,C.y)<C.r*C.r) key='town';
  else if(!F2WT.ylva&&dist2(player.x,player.y,1900,47000)<520*520) key='rime';
  if(!key) return a; let m=F2WAMB.get(a); if(!m){ m={}; F2WAMB.set(a,m); } if(!m[key]) m[key]=Object.assign({},a,key==='town'?{snow:0.15,wind:0.1}:{mist:0.45,snow:0.8,wind:0.6});
  return m[key]; }; }
// ---------- read the flags every frame (cheap) and switch the world to match
function f2wRedraw(boxes){
  const all=boxes.includes('all');
  for(const [key] of [...CHUNKS]){ const cx=Math.floor(key/1000), cy=key-cx*1000; if(mapAt(cy*CH+CH/2)!==2) continue;
    if(all||boxes.some(b=>b!=='all'&&(cx+1)*CH>=b[0]&&cx*CH<=b[2]&&(cy+1)*CH>=b[1]&&cy*CH<=b[3])) CHUNKS.delete(key); }
  const O=MAPS[2]&&MAPS[2].ov; if(O){ let r0=O.h; for(const b of boxes) r0=Math.min(r0,b==='all'?0:Math.max(0,Math.floor((b[1]-O.y0)/O.s))); O.row=Math.min(O.row,r0); O.done=false; }
  if(G) G.chunkBurst=Math.max(G.chunkBurst||0,6);
}
function f2wSync(force){
  if(!G||!G.flags||!F2WD.built) return;
  const lit=F2WF('f_hearth_lit'); if(lit!==F2WT.lit||force){ F2WT.lit=lit; for(const h of HOUSES) if(h.town==='f_hearthold'&&h.snow===lit) h.snow=!lit; if(F2WD.hearth&&F2WD.hearth.lights) for(const L of F2WD.hearth.lights){ L.r=lit?620:300; L.i=lit?1:0.6; } }
  const gate=F2WF('f_northgate'); if(gate!==F2WT.gate||force){ F2WT.gate=gate; if(F2WD.ngateCol) F2WD.ngateCol.off=gate; }
  F2WT.ylva=F2WF('f_ylva'); F2WT.hush=F2WF('f_hush_done'); F2WT.crown=F2WF('f_crown_open');
  const rime=F2WQ('f_rime'); if(rime&&!F2WT.rime){ F2WT.rime=1; for(const o of F2WD.frz) if(o.id.startsWith('f_frz_n_f_rimeholm')&&o.st==='ice'){ if(dist(player.x,player.y,o.x,o.y)<700) later(rand(0.2,1.6),()=>{ if(o.st==='ice') p3ThawStart(o); }); else { G.flags[o.flag]=1; o.st='free'; p3Uncol(o); } } }
  if(F2WD.dyn.dome!==!!G.found.f_rime_dome){ F2WD.dyn.dome=!!G.found.f_rime_dome; if(G.found.f_rime_dome&&F2WD.dome&&F2WD.dome.col){ removeCol(F2WD.dome.col); F2WD.dome.col=null; } }
  // quest f_warm (x2_people) waits for f_warm12: twelve Frozen Folk thawed anywhere (p3 counts every thaw in f_frozen_n)
  if(!G.flags.f_warm12&&(G.flags.f_frozen_n|0)>=12) G.flags.f_warm12=1;
}
// ---------- the life of the north: wind, gusts, the violet blizzard, ice creaks, chimes, howls, chimney smoke, steam
const F2WGUST=[];
// ---------- ice shards (prop f_iceshard, bible 3.1): solid spikes of ice that Blaze melts into nothing (0.6 s of blue
// fire, half with Bluefire). A melted shard stays gone for the session (its spot is remembered when its chunk comes back).
const F2W_MELT=new Set();
const f2wShardKey=p=>Math.round(p.x)+','+Math.round(p.y);
{ const base=genProps; genProps=function(cx,cy){ const out=base(cx,cy); if(F2W_MELT.size&&mapAt(cy*CH+CH/2)===2){ for(let i=out.length-1;i>=0;i--){ const q=out[i]; if(q.k==='f_iceshard'&&F2W_MELT.has(f2wShardKey(q))){ if(q.col) removeCol(q.col); out.splice(i,1); } } } return out; }; }
function f2wShardTick(dt){
  const J=P3.jet; if(!J||!P3.bz||!P3.bz.blue) return;
  const ex=J.ox+Math.cos(J.ang)*J.L, ey=J.oy+Math.sin(J.ang)*J.L, cx0=Math.floor((Math.min(J.ox,ex)-60)/CH), cx1=Math.floor((Math.max(J.ox,ex)+60)/CH), cy0=Math.floor((Math.min(J.oy,ey)-60)/CH), cy1=Math.floor((Math.max(J.oy,ey)+60)/CH);
  for(let cx=cx0;cx<=cx1;cx++) for(let cy=cy0;cy<=cy1;cy++){ const arr=PROPS.get(ckey(cx,cy)); if(!arr) continue;
    for(let i=arr.length-1;i>=0;i--){ const q=arr[i]; if(q.k!=='f_iceshard'||!p3JetHits(q.x,q.y,(q.R||16)*0.6)) continue;
      q.f2heat=(q.f2heat||0)+dt; if(Math.random()<0.3) emit(q.x+rand(-8,8),q.y-rand(6,26),1,{col:'220,240,255',glow:false,ang:Math.PI/2,spread:0.4,smin:20,smax:50,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4});
      if(q.f2heat>=(G.flags.f_bluefire?0.3:0.6)){ if(q.col) removeCol(q.col); arr.splice(i,1); F2W_MELT.add(f2wShardKey(q)); f2wSnd('crack',0.5); ftext(q.x,q.y-40,S('Hssss!','Hsss!'),'#dff4ff',13);
        for(let k=0;k<14;k++) emit(q.x+rand(-14,14),q.y-rand(0,30),1,{col:'235,248,255',glow:false,ang:-Math.PI/2,spread:1,smin:20,smax:90,lmin:.5,lmax:1,zmin:3,zmax:7,grow:9,drag:1,alpha:0.6}); } } }
}
function f2wLife(dt){
  if(AREA||!player||curMap()!==2) return;
  const t=G.time, a=ambHere()||{}, p=player, L=F2WD;
  // gusts: a few white wind lines streak across the screen, and the snow leans with them
  const gk=a.gust||0;
  if(gk>0){ L.gustT=(L.gustT==null?rand(2,5):L.gustT)-dt; if(L.gustT<=0){ L.gustT=rand(4,9)/gk; f2wSnd('gust',0.6*gk); for(let i=0;i<Math.round(4+gk*5);i++) F2WGUST.push({x:cam.x-rand(40,300),y:cam.y+rand(0.05,0.95)*H/zoom,vx:rand(520,760),len:rand(60,160),life:rand(1.4,2.4),ph:rand(0,TAU)}); } }
  for(const s of F2WGUST){ s.x+=s.vx*dt; s.life-=dt; }
  for(let i=F2WGUST.length-1;i>=0;i--) if(F2WGUST[i].life<=0||F2WGUST[i].x>cam.x+W/zoom+300) F2WGUST.splice(i,1);
  // Mount Dread: violet snow, the Shard's hum, violet lightning now and then
  if(a.violet){ if(Math.random()<dt*20) emit(rand(cam.x,cam.x+W/zoom),cam.y+rand(0,H/zoom),1,{col:Math.random()<0.5?'200,180,255':'240,236,255',glow:Math.random()<0.3,ang:0.5,spread:0.4,smin:60,smax:160,lmin:1.2,lmax:2.4,zmin:1.2,zmax:2.4,drag:0.05,alpha:0.8});
    L.humT=(L.humT||0)-dt; if(L.humT<=0){ L.humT=rand(3,6); f2wSnd('hum',0.5); }
    L.boltT=(L.boltT==null?rand(6,14):L.boltT)-dt; if(L.boltT<=0){ L.boltT=rand(8,18); flashA=Math.max(flashA,0.3); flashCol='190,160,255'; later(rand(0.4,1.2),()=>SFX.play('thunder')); } }
  // the lake creaks underfoot
  if(a.creak){ L.creakT=(L.creakT||rand(2,5))-dt; if(L.creakT<=0){ L.creakT=rand(3,8); f2wSnd(Math.random()<0.7?'creak':'crack',0.5); } }
  // wind chimes on the isles, howls in the pines at night
  if(a.chime){ L.chimeT=(L.chimeT||rand(1,3))-dt; if(L.chimeT<=0){ L.chimeT=rand(2.5,6); f2wSnd('chime',0.5); } }
  if(a.howl&&isNight()){ L.howlT=(L.howlT||rand(6,14))-dt; if(L.howlT<=0){ L.howlT=rand(12,30); f2wSnd('howl',0.45); } }
  // chimney smoke over Hearthold (and over Rimeholm once its people are warm)
  L.smokeT=(L.smokeT||0)-dt; if(L.smokeT<=0){ L.smokeT=0.12;
    for(const h of mapList(HOUSES,2)){ if(!h.chim||!inView(h.x,h.y,200)) continue; if(h.town==='f_rimeholm'&&f2wHouseFrozen(h)) continue; if(Math.random()<0.5) emit(h.chim[0]+rand(-2,2),h.chim[1],1,{col:'232,232,236',glow:false,ang:-Math.PI/2+0.25,spread:0.3,smin:14,smax:34,lmin:1.6,lmax:2.8,zmin:4,zmax:8,grow:9,drag:0.4,alpha:0.55}); } }
  // steam off the Windscour's vents and the Steamwell
  for(const v of ELEV.vents(2)){ if(!inView(v.x,v.y,120)) continue; if(Math.random()<dt*5) emit(v.x+rand(-v.r*0.5,v.r*0.5),v.y+rand(-10,10),1,{col:'240,244,250',glow:false,ang:-Math.PI/2,spread:0.3,smin:30,smax:80,lmin:.8,lmax:1.6,zmin:4,zmax:8,grow:10,drag:0.5,alpha:0.5}); }
  const SW=F2WG.steam, sd=dist(p.x,p.y,SW.x,SW.y);
  if(sd<SW.r+70){ if(Math.random()<dt*6) emit(SW.x+rand(-SW.r,SW.r),SW.y+rand(-SW.r*0.6,SW.r*0.6),1,{col:'250,250,252',glow:false,ang:-Math.PI/2,spread:0.3,smin:12,smax:30,lmin:1.6,lmax:2.6,zmin:6,zmax:12,grow:12,drag:0.4,alpha:0.45});
    // the hot spring heals 6 HP a second while Ash stands at its edge (or wades in it)
    if(sd>SW.r-50&&!p.dead&&p.hp<p.maxHp){ p.hp=Math.min(p.maxHp,p.hp+6*dt); L.healT=(L.healT||0)-dt; if(L.healT<=0){ L.healT=0.6; emit(p.x,p.y-20,2,{col:'140,255,200',ang:-Math.PI/2,spread:0.6,smin:20,smax:50,lmin:.4,lmax:.8,zmin:1.4,zmax:2.4}); } } }
  // the ice statues of the sculpture garden freeze back after a minute
  if(L.garden) for(const S0 of L.garden.st){ if(S0.melt>0){ S0.melt-=dt; if(S0.melt<=0){ S0.melt=0; f2wSnd('crack',0.4); } } else if(S0.heat>0) S0.heat=Math.max(0,S0.heat-dt*0.3); }
  if(L.hearthHeat>0) L.hearthHeat=Math.max(0,L.hearthHeat-dt*0.5); if(L.gateHeat>0) L.gateHeat=Math.max(0,L.gateHeat-dt*0.5); if(L.bellT>0) L.bellT=Math.max(0,L.bellT-dt*0.6);
  if(L.frostHeat>0&&!G.found.f_sec_frostington&&!(P3.jetOn)) L.frostHeat=Math.max(0,L.frostHeat-dt*0.15);
  // the Singing Stone plays when Ash rides the isle wind past it
  const R=typeof WIND!=='undefined'&&WIND.ride?WIND.ride():null; if(R&&L.singing&&dist(p.x,p.y,L.singing.x,L.singing.y)<160&&G.time-(L.singT||-99)>5){ L.singT=G.time; f2wSinging(L.singing); }
  f2wMonkeyTick(dt);
  f2wShardTick(dt);
}
function f2wDrawGusts(){
  if(!F2WGUST.length) return; const t=G.time; ctx.save(); ctx.lineCap='round';
  for(const s of F2WGUST){ const a=clamp(s.life,0,1)*0.55; ctx.strokeStyle=`rgba(255,255,255,${a})`; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(s.x,s.y); for(let i=1;i<=6;i++){ const k=i/6; ctx.lineTo(s.x-s.len*k,s.y+Math.sin(t*6+s.ph+k*4)*4); } ctx.stroke(); }
  ctx.restore();
}
// ---------- drifting clouds far below the Sky Isles and in the Howling Gap (one cached sprite, a handful per frame)
let F2WCLOUD=null;
function f2wCloudSpr(){ if(F2WCLOUD) return F2WCLOUD; const c=mkCanvas(256,128), g=c.getContext('2d');
  for(const [x,y,r,a] of [[80,72,52,0.8],[140,60,60,0.85],[196,76,44,0.75],[110,86,40,0.7],[170,88,38,0.7]]){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(255,255,255,${a})`); gr.addColorStop(0.6,`rgba(246,244,255,${a*0.6})`); gr.addColorStop(1,'rgba(240,236,255,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  return (F2WCLOUD=c); }
function f2wDrawVoidClouds(t){
  if(AREA||curMap()!==2) return; const vx=cam.x, vy=cam.y, vw=W/zoom, vh=H/zoom;
  if(vx+vw<9150||vy>48400||vy+vh<43400) return;
  const c=f2wCloudSpr();
  for(let i=0;i<14;i++){ const sp=14+(i%4)*7, cx=9000+((i*937+t*sp)%5600), cy=43500+((i*577)%4600)+Math.sin(t*0.1+i)*30, s=1.1+(i%3)*0.5;
    if(cx+150*s<vx||cx-150*s>vx+vw||cy+70*s<vy||cy-70*s>vy+vh) continue; if(!f2wVoidAt(cx,cy)||elevLvl(cx,cy)>0) continue;
    ctx.globalAlpha=0.55; ctx.drawImage(c,cx-128*s,cy-64*s,256*s,128*s); }
  ctx.globalAlpha=1;
}
{ const base=drawPools; drawPools=function(){ base(); try{ if(G&&!AREA&&curMap()===2) f2wDrawVoidClouds(G.time); }catch(e){} }; }
// ---------- standing things sorted with the figures; the gusts over everything
{ const base=eventsForRender; eventsForRender=function(list){ base(list); if(!G||AREA||!player||curMap()!==2||!F2WD.built) return; const t=G.time;
  f2wObjsInView(o=>{ const D=F2WK[o.k]; if(!D||!inView(o.x,o.y-(o.R*0.5),o.R)) return; const ev=o._ev||(o._ev={x:o.x,y:o.base,r:8,flying:true,f2o:o,draw:f2wEvDraw}); ev.y=o.base; list.push(ev); }); }; }
// one render entry per standing thing, made once (no closures per frame)
function f2wEvDraw(){ const o=this.f2o, D=F2WK[o.k]; try{ D.draw(o,G.time); }catch(e){} }
{ const base=drawBirds; drawBirds=function(){ base(); if(!AREA&&curMap()===2) f2wDrawGusts(); }; }
{ const base=update; update=function(dt){ try{ f2wSync(); }catch(e){ console.error('f2w sync',e); } const r=base(dt); try{ if(scene==='play'&&G&&G.mode!=='menu') f2wLife(dt); }catch(e){ console.error('f2w life',e); } return r; }; }
// ---------- the fixed chests: their own treasure (and the Steamwell chest needs the monkey's key)
const F2WLOOT={f_ch_wreck:{coins:150,hat:'f_hat_captain',secret:['f_sec_wreck',S('The Frozen Shipwreck','The Frozen Shipwreck')]},f_ch_steam:{coins:80,treat:1,secret:['f_sec_steam',S('The Steamwell','The Steamwell')]},
  f_ch_ridge:{coins:100,treat:1},f_ch_garden:{coins:120,star:1},f_ch_graveyard:{coins:120},f_ch_isle5:{coins:90,secret:['f_sec_isle5',S('Sky Isle Five','Sky Isle Five')]},
  f_ch_horn:{coins:60},f_ch_westcliff:{coins:50},f_ch_ridgetop:{coins:40},f_ch_shelf:{coins:40}};
{ const base=openChest; openChest=function(c){
  if(c&&c.id==='f_ch_steam'&&!G.found.f_steam_key){ f2wSay([S('A little chest on a rock in the hot spring. Its lock has a keyhole shaped like a grin. A monkey grin.','It is locked. The keyhole looks like a monkey grin.')]); return; }
  const r=base(c); const L=c&&F2WLOOT[c.id];
  if(L){ try{ if(L.coins) addCoins(L.coins,c.x,c.y); if(L.treat) G.pipTreats=(G.pipTreats||0)+L.treat; if(L.star) giveItems({star_iron:1}); if(L.items){ for(const k in L.items) if(typeof ITEM_NAMES!=='undefined'&&!ITEM_NAMES[k]) ITEM_NAMES[k]=k==='f_starfrost'?S('starfrost ore','starfrost ore'):k; giveItems(L.items); }
    if(L.hat){ G.hats=G.hats||{}; G.hats[L.hat]=true; G.hat=L.hat; setBanner(S("A fur captain's hat!","A captain's hat!"),S('Looking very nautical.','You look like a captain!'),2.4); }
    if(L.secret) f2wSecret(L.secret[0],L.secret[1]); saveGame(); }catch(e){ console.error(e); } }
  return r; }; }
// ---------- the journal's Secrets tab counts Frostreach's eight secrets once Ash has been there
const F2W_SECRETS=['f_sec_wreck','f_sec_steam','f_sec_frostington','f_sec_garden','f_sec_warmcave','f_sec_ridge','f_sec_graveyard','f_sec_isle5'];
{ const base=secretTally; secretTally=function(){ const out=base(); try{ if(G&&G.mapsSeen&&G.mapsSeen[2]){ const S0=G.secrets||{}; out.push([S('Secrets of Frostreach','Frostreach secrets'),F2W_SECRETS.filter(k=>S0[k]||G.found[k]).length,F2W_SECRETS.length]); out.push([S('Frozen Folk thawed','Frozen Folk thawed'),G.flags.f_frozen_n|0,F2WD.frz.length||20]); } }catch(e){} return out; }; }
// the Warm Cave counts as a secret the first time Ash goes in
{ const base=enterArea; enterArea=function(id,door){ const r=base(id,door); try{ if(id==='f_warmcave'&&AREA&&AREA.id==='f_warmcave') f2wSecret('f_sec_warmcave',S('The Warm Cave','The Warm Cave')); }catch(e){} return r; }; }
// two hats of the north: the captain's fur hat from the Frozen Shipwreck, and Ulf's fur hat with ear flaps
if(typeof ashHat==='function'){ const base=ashHat; ashHat=function(k){ const z0=6.2;
  if(k==='f_hat_captain'){ aE(0,0,z0-0.6,8.2,8.6,4.8,'#5a3e2a'); aE(0,0,z0-2.6,8.6,9,1.8,'#e8e2d8'); aE(6.8,0,z0-2.4,3.6,5.8,0.6,'#2a2a30',{pitch:0.1}); aB(4.6,0,z0+1.6,1.4,'#e0b048'); return; }
  if(k==='f_hat_mittens'){ aE(0,0,z0-0.8,7.8,8.2,5,'#8a6a4a'); for(const s of [-1,1]) aE(0.4,s*7.4,z0-4.4,2.6,1.8,3.6,'#8a6a4a'); aE(0,0,z0-3,8,8.4,1.4,'#e8e2d8'); return; }
  return base(k); }; }
if(typeof EVHATN!=='undefined'){ EVHATN.f_hat_captain="Captain's Fur Hat"; EVHATN.f_hat_mittens='Fur Hat with Ear Flaps'; }
// ---------- cold vents: e3's updrafts are painted as hot cinder vents; on Frostreach they breathe cold steam instead
// (the vents still work the same: only the paint, the live rings, the particles and the light change)
const F2W_NOV=[];
function f2wNoHotVents(fn){ const E=typeof ELV!=='undefined'&&ELV.maps?ELV.maps[2]:null; if(!E||E.dirty||AREA||curMap()!==2) return fn(); const v=E.vents; E.vents=F2W_NOV; try{ return fn(); } finally{ E.vents=v; } }
{ const base=drawHazards; drawHazards=function(){ f2wNoHotVents(()=>base()); try{ if(!AREA&&G&&curMap()===2) f2wDrawVents(G.time); }catch(e){} }; }
{ const base=ambientEmit; ambientEmit=function(dt){ f2wNoHotVents(()=>base(dt)); }; }
function f2wDrawVents(t){
  for(const v of ELEV.vents(2)){
    if(!inView(v.x,v.y,v.r+140)) continue; const R=v.r;
    ctx.save(); ctx.lineCap='round';
    for(let k=0;k<4;k++){ const ph=(t*0.6+k/4)%1, y=v.y-ph*150, a=(1-ph)*0.42; ctx.strokeStyle=`rgba(236,246,255,${a})`; ctx.lineWidth=2.6; ctx.beginPath(); ctx.ellipse(v.x+Math.sin(t*1.8+k)*7,y,R*(0.32+ph*0.5),R*(0.32+ph*0.5)*0.42,0,0,TAU); ctx.stroke(); }
    ctx.strokeStyle='rgba(170,215,255,.4)'; ctx.lineWidth=2;
    for(let k=0;k<5;k++){ const ph=(t*0.8+k*0.2)%1, x=v.x+(k-2)*R*0.18, y0=v.y-ph*30, y1=y0-56-ph*44; ctx.globalAlpha=Math.sin(ph*Math.PI); ctx.beginPath(); ctx.moveTo(x,y0); ctx.bezierCurveTo(x+9,y0-18,x-9,y1+18,x+Math.sin(t*3+k)*6,y1); ctx.stroke(); }
    ctx.globalAlpha=1; ctx.setLineDash([6,8]); ctx.lineDashOffset=-t*20; ctx.strokeStyle='rgba(200,230,255,.3)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(v.x,v.y,R,R*0.6,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    if(Math.random()<0.15) emit(v.x+rand(-R,R)*0.35,v.y+rand(-R,R)*0.2,1,{col:'245,250,255',glow:false,alpha:0.5,ang:-Math.PI/2,spread:0.3,smin:50,smax:110,lmin:.8,lmax:1.5,zmin:4,zmax:9,grow:12,drag:0.5});
  }
}
// the vent's ground mark: a ring of frosted stones round a dark blue throat with rime cracks (over e3's hot mark)
function f2wPaintVent(g,v){
  const R=Math.min(46,v.r*0.55), rng=mulberry32(v.x*7+v.y*3|0), ol=SBC.outline;
  g.save(); g.lineCap='round';
  g.fillStyle='rgba(40,50,90,.28)'; g.beginPath(); g.ellipse(v.x,v.y+3,R+12,(R+12)*0.62,0,0,TAU); g.fill();
  g.fillStyle='#2c3e5e'; g.beginPath(); g.ellipse(v.x,v.y,R+1,(R+1)*0.6,0,0,TAU); g.fill();
  g.fillStyle='#4f78a8'; g.beginPath(); g.ellipse(v.x,v.y,R*0.62,R*0.36,0,0,TAU); g.fill();
  g.fillStyle='#bfe2ff'; g.beginPath(); g.ellipse(v.x,v.y,R*0.28,R*0.15,0,0,TAU); g.fill();
  g.strokeStyle='rgba(220,240,255,.85)'; g.lineWidth=1.6; g.beginPath(); for(let i=0;i<7;i++){ const a=i/7*TAU+rng()*0.4, r0=R*0.55, r1=R*(0.92+rng()*0.25); g.moveTo(v.x+Math.cos(a)*r0,v.y+Math.sin(a)*r0*0.6); g.lineTo(v.x+Math.cos(a+0.15)*r1,v.y+Math.sin(a+0.15)*r1*0.6); } g.stroke();
  for(let i=0;i<10;i++){ const a=i/10*TAU+rng()*0.3, rr=R*(1.04+rng()*0.12), x=v.x+Math.cos(a)*rr, y=v.y+Math.sin(a)*rr*0.6, w=5+rng()*4, h=3.5+rng()*2;
    g.fillStyle='#8a94a8'; g.beginPath(); g.ellipse(x,y,w,h,0,0,TAU); g.fill(); g.strokeStyle=ol; g.lineWidth=1.5; g.stroke(); g.fillStyle='#f4f8fc'; g.beginPath(); g.ellipse(x-w*0.2,y-h*0.35,w*0.75,h*0.45,0,0,TAU); g.fill(); }
  g.strokeStyle=ol; g.lineWidth=2.2; g.beginPath(); g.ellipse(v.x,v.y,R+1,(R+1)*0.6,0,0,TAU); g.stroke();
  g.restore();
}
function f2wPaintVents(){ for(const v of ELEV.vents(2)) ELEV.deco({k:2,bb:[v.x-70,v.y-50,v.x+70,v.y+50],lvl:v.lvl||0,order:4.5,paint:g=>f2wPaintVent(g,v)}); }
// their light at night is cold and still (e3 lit them like fires)
{ const base=initWorld; initWorld=function(){ base.apply(this,arguments); try{ for(const v of ELEV.vents(2)) for(const L of LIGHTS) if(L.fire&&L.x===v.x&&L.y===v.y){ L.fire=false; L.i=0.4; L.cold=true; } }catch(e){ console.error('f2w vents',e); } }; }
// ---------- the Sky Isles float: under each isle's top a rocky underside tapers to a point over the clouds (painted
// over the tall cylinder face the plateau would hang there), with icicles and a few dangling roots
// a sky isle has no cliff face down to the ground (there is no ground): e3 paints only its rim, the underside is ours
{ const base=elvPaintPlat; elvPaintPlat=function(g,P,rx0,ry0,rx1,ry1){
  if(P.style!=='f_isle') return base(g,P,rx0,ry0,rx1,ry1);
  const S=P.S;
  for(const r of P.rings){ const n=r.n, X=r.x, Y=r.y, FR=r.front, SB=r.sbb;
    const segs=[]; for(let i=0;i<n;i++) if(SB[i*4]<rx1&&SB[i*4+2]>rx0&&SB[i*4+1]<ry1&&SB[i*4+3]>ry0&&!r.inner[i]) segs.push(i);
    if(!segs.length) continue;
    g.save(); g.lineJoin='round'; g.lineCap='round';
    g.strokeStyle=S.out; g.lineWidth=2.6; g.beginPath(); for(const i of segs){ const q=(i+1)%n; g.moveTo(X[i],Y[i]); g.lineTo(X[q],Y[q]); } g.stroke();
    const ix=(i,d)=>X[i]-r.vnx[i]*d, iy=(i,d)=>Y[i]-r.vny[i]*d;
    g.strokeStyle='#ffffff'; g.lineWidth=2.6; g.beginPath(); for(const i of segs){ if(!FR[i]) continue; const q=(i+1)%n; g.moveTo(ix(i,2.6),iy(i,2.6)); g.lineTo(ix(q,2.6),iy(q,2.6)); } g.stroke();
    g.globalAlpha=0.45; g.lineWidth=1.6; g.beginPath(); for(const i of segs){ if(FR[i]) continue; const q=(i+1)%n; g.moveTo(ix(i,2.4),iy(i,2.4)); g.lineTo(ix(q,2.4),iy(q,2.4)); } g.stroke();
    g.restore(); }
}; }
// ... and the ground under an isle's (unpainted) face is cloud, not e3's rock colour
{ const base=groundRGB; groundRGB=function(s,x,y){ if(s.face&&x>10900&&y>=43400&&y<=48400&&f2wVoidAt(x,y)) return f2wCloudRGB(x,y); return base(s,x,y); }; }
// ... and no long sun shadow from an isle's face (e3's depth mode casts one from the foot of every cliff face: under a
// floating isle that foot is in the air, and the shadow showed as a dark ring round the isle)
const F2WSH={n:-1,list:null};
{ const base=drawShadowLayer; drawShadowLayer=function(){
  const E=typeof ELV!=='undefined'&&ELV.maps?ELV.maps[2]:null;
  if(!E||!E.plats||AREA||!G||curMap()!==2) return base.apply(this,arguments);
  if(F2WSH.n!==E.plats.length||F2WSH.src!==E.plats){ F2WSH.n=E.plats.length; F2WSH.src=E.plats; F2WSH.list=E.plats.filter(P=>P.style!=='f_isle'); }
  if(F2WSH.list.length===E.plats.length) return base.apply(this,arguments);
  const all=E.plats; E.plats=F2WSH.list; try{ return base.apply(this,arguments); } finally{ E.plats=all; } }; }
// a cloud puff in front of an isle's underside (crisp, the Cloudsea's colours)
function f2wPuff(g,x,y,rx,rng){
  const k=3+Math.floor(rng()*2), pts=[]; for(let i=0;i<k;i++){ const t=(i+0.5)/k-0.5; pts.push([x+t*rx*1.7,y-Math.cos(t*Math.PI)*rx*0.28,rx*(0.42+rng()*0.22)]); }
  g.fillStyle='rgba(120,104,170,.18)'; g.beginPath(); for(const [a,b,c] of pts){ g.moveTo(a+c,b+5); g.ellipse(a,b+5,c,c*0.62,0,0,TAU); } g.fill();
  g.fillStyle='#ece8fb'; g.beginPath(); for(const [a,b,c] of pts){ g.moveTo(a+c,b); g.ellipse(a,b,c,c*0.62,0,0,TAU); } g.fill();
  g.fillStyle='#fdfcff'; g.beginPath(); for(const [a,b,c] of pts){ g.moveTo(a+c*0.8,b-c*0.12); g.ellipse(a-c*0.1,b-c*0.12,c*0.8,c*0.44,0,0,TAU); } g.fill();
}
// the rocky underside: hangs from the south rim, thickest in the middle, a crooked point at the bottom
function f2wPaintIsleUnder(g,I,x0,y0,x1,y1){
  const H=I.lvl*ELEV.px, r=I.r, cx=I.x, cy=I.y, rng=mulberry32(I.id*977+5), n=28;
  const rimY=x=>{ const dx=(x-cx)/r; return cy+Math.sqrt(Math.max(0,1-dx*dx))*r; };
  const depth=u=>{ const a=Math.abs(u); return H*(1.05*Math.pow(Math.max(0,1-a),0.85))+Math.min(18,H*0.12); };
  const top=[], bot=[];
  for(let i=0;i<=n;i++){ const u=-1+2*i/n, x=cx+u*r; top.push([x,rimY(x)]); }
  for(let i=n;i>=0;i--){ const u=-1+2*i/n, x=cx+u*r*0.96+(u>-0.2&&u<0.2?(rng()-0.5)*8:0), j=(i%3===1?rng()*10:0); bot.push([x,rimY(cx+u*r)+depth(u)+j]); }
  const poly=top.concat(bot);
  const path=()=>{ g.beginPath(); g.moveTo(poly[0][0],poly[0][1]); for(const q of poly) g.lineTo(q[0],q[1]); g.closePath(); };
  g.save(); g.lineJoin='round'; g.lineCap='round';
  g.fillStyle='rgba(110,90,160,.16)'; g.beginPath(); g.ellipse(cx+16,cy+r+H*0.95+10,r*0.55,r*0.12+6,0,0,TAU); g.fill();
  path(); g.fillStyle='#9d93ba'; g.fill();
  g.save(); path(); g.clip();
  // lit left side, shaded right, a pale band of stone under the rim with a gold trim line, a few cracks
  g.fillStyle='#bdb3d6'; g.beginPath(); g.moveTo(cx-r,cy); g.lineTo(cx-r*0.1,cy+r); g.lineTo(cx-r*0.02,cy+r+H*1.2); g.lineTo(cx-r,cy+H); g.closePath(); g.fill();
  g.fillStyle='#7f7598'; g.beginPath(); g.moveTo(cx+r*0.35,cy+r); g.lineTo(cx+r,cy); g.lineTo(cx+r,cy+H); g.lineTo(cx+r*0.1,cy+r+H*1.2); g.closePath(); g.fill();
  const band=Math.min(24,H*0.2);
  g.fillStyle='#efeaf8'; g.beginPath(); for(let i=0;i<=n;i++){ const p=top[i]; i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]); } for(let i=n;i>=0;i--){ const p=top[i]; g.lineTo(p[0],p[1]+band); } g.closePath(); g.fill();
  g.strokeStyle='#e0b048'; g.lineWidth=3; g.beginPath(); for(let i=0;i<=n;i++){ const p=top[i]; i?g.lineTo(p[0],p[1]+band+2):g.moveTo(p[0],p[1]+band+2); } g.stroke();
  g.strokeStyle='rgba(60,46,96,.35)'; g.lineWidth=1.8; for(let k=0;k<8;k++){ const u=-0.7+k*0.2, x=cx+u*r, y=rimY(x)+band+8+rng()*H*0.25; g.beginPath(); g.moveTo(x,y); g.lineTo(x+rng()*16-8,y+18+rng()*26); g.lineTo(x+rng()*12-6,y+30+rng()*30); g.stroke(); }
  g.restore();
  path(); g.strokeStyle=SBC.outline; g.lineWidth=2.6; g.stroke();
  // icicles and roots hanging off the underside
  for(let k=0;k<11;k++){ const u=-0.85+k*0.17, x=cx+u*r*0.96, y=rimY(cx+u*r)+depth(u)-2, L=8+rng()*16;
    if(k%4===2){ g.strokeStyle='#6a5a3a'; g.lineWidth=1.8; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+5,y+L*0.6,x-2,y+L*1.5); g.stroke(); }
    else { g.fillStyle='#c4e6fb'; g.beginPath(); g.moveTo(x-3.4,y-1); g.lineTo(x+3.4,y-1); g.lineTo(x+0.4,y+L); g.closePath(); g.fill(); g.strokeStyle='rgba(59,34,51,.65)'; g.lineWidth=1.1; g.stroke(); } }
  const pr=mulberry32(I.id*53+11);
  for(const [u,dv,sz] of [[-0.62,0.55,0.34],[0.5,0.62,0.3],[0.05,0.92,0.4],[-0.2,1.02,0.22]]){ const x=cx+u*r, y=rimY(x)+depth(u)*dv; f2wPuff(g,x,y,r*sz,pr); }
  g.restore();
}
function f2wPaintIsles(){ for(const I of F2WG.isles){ const H=I.lvl*ELEV.px; ELEV.deco({k:2,bb:[I.x-I.r-48,I.y-16,I.x+I.r+48,I.y+I.r+H*1.25+40],lvl:I.lvl,order:0.5,paint:(g,x0,y0,x1,y1)=>f2wPaintIsleUnder(g,I,x0,y0,x1,y1)}); } }
// ---------- the edge of the world: where the Pinewhisper (level 0) ends at the Cloudsea a crisp snowy lip, a plum
// outline and a soft violet drop into the cloud (marching squares on a 6 px grid, only where land meets void)
function f2wEdgeChunk(ch,cx,cy){
  const x0=cx*CH, y0=cy*CH; if(x0+CH<10800||y0>48500||y0+CH<47400) return;
  const st=6, n=Math.ceil(CH/st)+1, V=new Int8Array(n*n);   // 1 land at level 0, 0 void, 2 a plateau (e3 draws those edges)
  let any=0, land=0;
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){ const x=x0+i*st, y=y0+j*st, lv=elevLvl(x,y); let c=lv>0?2:f2wVoidAt(x,y)?0:1; V[j*n+i]=c; if(c===0) any=1; else if(c===1) land=1; }
  if(!any||!land) return;
  const segs=[];
  const P=(i,j)=>[x0+i*st,y0+j*st];
  for(let j=0;j<n-1;j++) for(let i=0;i<n-1;i++){
    const a=V[j*n+i], b=V[j*n+i+1], c=V[(j+1)*n+i+1], d=V[(j+1)*n+i];
    if(a===2||b===2||c===2||d===2) continue;
    const m=(a?8:0)|(b?4:0)|(c?2:0)|(d?1:0); if(m===0||m===15) continue;
    const [X,Y]=P(i,j), h=st/2, T=[X+h,Y], R=[X+st,Y+h], Bm=[X+h,Y+st], L=[X,Y+h];
    const add=(p,q)=>segs.push([p,q,m]);
    switch(m){ case 1: case 14: add(L,Bm); break; case 2: case 13: add(Bm,R); break; case 3: case 12: add(L,R); break; case 4: case 11: add(T,R); break;
      case 5: add(L,T); add(Bm,R); break; case 6: case 9: add(T,Bm); break; case 7: case 8: add(L,T); break; case 10: add(T,R); add(L,Bm); break; }
  }
  if(!segs.length) return;
  const g=ch.g; g.save(); g.beginPath(); g.rect(x0-1,y0-1,CH+2,CH+2); g.clip(); g.lineCap='round'; g.lineJoin='round';
  const stroke=(w,col,dy)=>{ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); for(const [p,q] of segs){ g.moveTo(p[0],p[1]+dy); g.lineTo(q[0],q[1]+dy); } g.stroke(); };
  stroke(22,'rgba(110,90,170,.10)',-4); stroke(12,'rgba(110,90,170,.14)',-3);
  stroke(4.6,SBC.outline,0); stroke(2.6,'#ffffff',2.2);
  g.restore();
}
{ const base=genChunk; genChunk=function(cx,cy){ const ch=base(cx,cy); try{ if(ch&&mapAt(cy*CH+CH/2)===2&&F2WD.built) f2wEdgeChunk(ch,cx,cy); }catch(e){ console.error('f2w edge',e); } return ch; }; }
// ---------- named standing spots (for the people, foes and story helpers, and for tests): f2wSpot(name) -> {x,y,lvl}
// A name is a key of F2W_SPOTS, else a POI key, a landmark id, a Frozen Folk id or a door's area id (the first door).
// Every spot is open ground where Ash can stand (the test t_f2w.py checks each one).
const F2W_SPOTS={
  // the Whitepass
  pass:[2600,50540],passdown:[2600,50680],whiteshrine:[3000,50440],fergus:[3300,50070],steam:[3800,49610],warmcave:[1200,49700],ridge:[2450,48900],gulch:[5200,50700],gulchledge:[5380,50580],
  // Hearthold Vale and Hearthold
  frostington:[4600,48420],vale:[5600,49300],milkman:[5000,49170],west:[6120,49000],westgate:[6260,49000],hearth:[6800,49180],dais:[6880,49040],brynja:[6880,49040],brann:[6270,48900],pim:[6650,49080],
  cocoa:[6650,49130],north:[6800,48460],northgate:[6800,48460],northout:[6800,48290],east:[7480,49000],eastgate:[7340,49000],sledhill:[7900,48330],garden:[8200,47560],fields:[7300,46400],tent:[7100,48770],
  hearthshrine:[7190,49310],
  // the Glimmerfrost and the Glacier Mouth
  glimmer:[6650,44860],glimmershrine:[6860,44930],moat:[5600,44870],island:[5600,44560],mazedoor:[5600,44520],lake:[5200,45900],ridgefish:[4450,45120],skater:[4800,46270],fisher:[4400,45610],
  // Rimeholm and its cliffs
  rimeroad:[2950,47420],rime:[2200,47160],tower:[1950,46950],towertop:[1950,46770],quay:[1150,47000],stack:[700,47450],bluff:[1750,46200],tunnelw:[1750,46200],rimeshrine:[2490,47510],
  // the Shiversea
  shore:[3400,44000],floes:[2500,43380],wreck:[1600,42780],juniper:[2100,42050],
  // the Dreadmoor, the Dreadgate, the Shoulder Ledge and Mount Dread
  moor:[7300,44420],dreadgate:[7300,44260],plaza:[7300,44300],dreadstairs:[7300,44820],shoulder:[8400,43480],windroad:[8800,44500],tunnele:[6500,44860],moorshrine:[8090,44920],knight:[6500,44470],
  crown:[7300,41540],crownmid:[7300,41300],crowndoor:[7060,41700],
  // the Windscour, the Howling Gap, the Sky Isles
  windscour:[10000,46400],windshrine:[10320,47390],monk:[9600,46270],rim:[10880,46760],gapsouth:[10000,44520],gap2:[10880,44540],dogshelf:[9350,47760],
  isle1:[11450,46850],isle2:[11950,46380],temple:[12650,46530],templedoor:[12650,46520],isle4:[13250,47280],isle5:[12150,47900],
  // the Stonehorn Badlands
  stonehorn:[10200,43200],hornshrine:[11540,43110],horned:[12200,42560],runedrum:[13300,41750],runetop:[13300,41500],graveyard:[11000,42100],gravetop:[11000,41760],
  // the Pinewhisper, Hask's Rest, Mumble's Hollow
  pines:[10400,49200],hask:[11400,49620],haskshrine:[11190,49910],kennel:[11450,49990],hollow:[13050,48720],trapper:[12200,49970],
  // Greymane's pups (x2_people, f_pack home branch)
  pupsteam:[3760,49590],pupmoor:[7980,44520],pupridge:[5700,46940]
};
function f2wSpot(name){
  const lv=(x,y)=>({x,y,lvl:typeof elevLvl==='function'?elevLvl(x,y):0});
  const s=F2W_SPOTS[name]; if(s) return lv(s[0],s[1]);
  if(typeof POI!=='undefined'&&POI[name]&&POI[name].y>=40000&&POI[name].y<=51000) return lv(POI[name].x,POI[name].y);
  const L=LANDMARKS.find(o=>o.id===name&&o.y>=40000&&o.y<=51000); if(L) return lv(L.x,L.y);
  const F=f2wFrozen(name); if(F) return lv(F.x,F.y);
  const D=DOORS.find(d=>d.area===name&&d.y>=40000&&d.y<=51000); if(D) return lv(D.x,D.y+(D.outY||30));
  return null;
}
// ---------- debug hooks
window.__ebX=Object.assign(window.__ebX||{},{
  f2w:{F2WD,F2WG,F2WT,F2WK,F2WE,sync:f2wSync,region:(x,y)=>f2wRegionFix(x,y,{b:-1,b2:-1,t:1}).b,void:(x,y)=>f2wVoid(x,y),lakeD:f2wLakeD,story:f2wStory,
    set(flag,v){ G.flags[flag]=v===undefined?true:v; f2wSync(); return {flag,v:G.flags[flag]}; },
    spots:F2W_SPOTS, spot:f2wSpot,
    go(name){ const s=f2wSpot(name); if(!s) return null; return window.__ebX.goMap(2,s.x,s.y); },
    objs:()=>F2WD.objs.length, homes:()=>F2WD.homes, ph:()=>F2WD.ph, frozen:()=>F2WD.frz.map(o=>({id:o.id,who:o.who||null,st:o.st,flag:o.flag,x:o.x,y:o.y})),
    thawAll(){ for(const o of F2WD.frz){ if(o.st==='ice'){ G.flags[o.flag]=1; o.st='free'; p3Uncol(o); } } G.flags.f_frozen_n=F2WD.frz.length; f2wSync(); return F2WD.frz.length; },
    SHRINES, HOUSES, DOORS, AREADEFS, CAMPS, save:()=>saveGame(), door:(area,i)=>{ const d=DOORS.filter(q=>q.area===area)[i||0]; if(d) enterArea(d.area,d); return !!AREA; },
    stride:(x,y)=>mapStrideBlocked(x,y), blocked:(x,y)=>blockedAt(x,y), amb:()=>ambHere(),
    flood(sx,sy,o){ o=o||{}; const cs=o.cs||8, bb=o.bb||[0,40000,14000,51000], x0=bb[0], y0=bb[1], w=Math.ceil((bb[2]-bb[0])/cs), h=Math.ceil((bb[3]-bb[1])/cs), seen=new Uint8Array(w*h), q=[];
      const pass=(x,y)=>{ if(outOfMap(x,y,30)) return false; if(colAt(x,y,5)) return false; if(!blockedAt(x,y)) return true; return !!(o.stride&&!(elevFace(x,y)&1)&&!mapStrideBlocked(x,y)); };
      if(!pass(sx,sy)) return {fail:'start blocked'}; const k0=Math.floor((sy-y0)/cs)*w+Math.floor((sx-x0)/cs); seen[k0]=1; q.push(k0);
      while(q.length){ const c=q.pop(), i=c%w, j=(c/w)|0; for(let d=0;d<4;d++){ const a=i+(d===0?1:d===1?-1:0), b=j+(d===2?1:d===3?-1:0); if(a<0||b<0||a>=w||b>=h) continue; const k=b*w+a; if(seen[k]) continue; if(!pass(x0+(a+0.5)*cs,y0+(b+0.5)*cs)) continue; seen[k]=1; q.push(k); } }
      F2WD.flood={seen,w,h,x0,y0,cs}; let n=0; for(const v of seen) n+=v; return {n}; },
    at(x,y){ const F=F2WD.flood; if(!F) return false; const i=Math.floor((x-F.x0)/F.cs), j=Math.floor((y-F.y0)/F.cs); for(let dj=-2;dj<=2;dj++) for(let di=-2;di<=2;di++){ const a=i+di,b=j+dj; if(a>=0&&b>=0&&a<F.w&&b<F.h&&F.seen[b*F.w+a]) return true; } return false; }}
});
