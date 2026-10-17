
// ================= Act IV world: Moonfall (map 3, x 0..14000, y 60000..71000)
// Built from the story bible (scratchpad/bible/ACT4.md sections 2, 3, 4, 7 and 13): ten regions (biomes 30 to 39), the
// Sunken Isles in the west (the raft town of Driftwood Landing in a turquoise lagoon, the Spire Shoals and the Lumen
// Spire, Gull Isle and its dark lighthouse, Palmcrest, Turtleback, the Crab Pirate forts, the Coralcombe dive ring, the
// Moonroot Mangroves, the Drowned Reach over drowned Old Lumen), the Reefwall that only a dive passes (the Sunken Gate,
// Baron Puffington's basin), and the Glass Desert in the east (the Tideglass Strand, the Glass Dunes and the
// Wormfields with quicksand and the Worm Mouth, the Oasis of Sable and its Moon Well, the Glasswall and the Burrow Gap,
// the Mirror Flats and the Mirror Temple, the Shatterfields' glass mesas, the Eclipse Heights with the Moonpath, the
// Eclipse Observatory and the Star Terrace, and the old Moon Pier at the Edge of the World).
// World states read from G.flags: moon (the darkening nights and one more town lantern per bite), m_eclipse2 (the Moon
// Well is dim, Sable's lamps go out), m_lighthouse_lit, m_moonpath_lit (the world owns this count), m_dell_away, the
// side quest flags of section 10 that the world shows (ferry posts, Sable's lamps, the furnace).
// Doc for the people, story, foes and dungeon helpers: scratchpad/M3WORLD.md. All coordinates are absolute.
// Every id uses the m_ prefix. Every player-facing line goes through S(full, simple).
const M3WD={k:3,y0:60000,objs:[],bk:new Map(),bs:512,built:false,B:null,lamps:[],fire:[],ph:[],homes:[],t:0,surgeT:40,raft:null,gulls:[],moths:[],
  heat:{},tips:{},ring:{t:0},ws:{well:null,lit:null,dell:null,light:null},stars:[],mir:[],flash:0};
const m3wF=k=>!!(G&&G.flags&&G.flags[k]);
const m3wStage=s=>typeof STAGEDEF!=='undefined'&&!!STAGEDEF[s];
// a stage gate that stays open while the story module that owns the stage is not in the build (tests, partial merges)
const m3wGate=s=>!m3wStage(s)||reached(s);
const m3wReached=s=>m3wStage(s)&&reached(s);
const m3wQ=q=>!!(G&&G.quests&&G.quests[q]);
const m3wQDone=q=>!!(G&&G.quests&&G.quests[q]&&G.quests[q].done);
const m3wOn3=()=>!!(G&&player&&!AREA&&curMap()===3);
// ---------- small geometry helpers (shapes are plain arrays so the terrain hooks stay cheap)
function m3wPoly(P){ const o={P,bb:[1e9,1e9,-1e9,-1e9]}; for(const p of P){ o.bb[0]=Math.min(o.bb[0],p[0]); o.bb[1]=Math.min(o.bb[1],p[1]); o.bb[2]=Math.max(o.bb[2],p[0]); o.bb[3]=Math.max(o.bb[3],p[1]); } return o; }
function m3wInP(o,x,y){
  if(x<o.bb[0]||y<o.bb[1]||x>o.bb[2]||y>o.bb[3]) return false;
  const P=o.P; let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i], b=P[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c;
}
const m3wInR=(r,x,y)=>x>=r[0]&&y>=r[1]&&x<=r[2]&&y<=r[3];
const m3wD2=(x,y,cx,cy)=>{ const dx=x-cx, dy=y-cy; return dx*dx+dy*dy; };
function m3wSegD(pts,x,y){ let b=1e9; for(let i=0;i<pts.length-1;i++){ const a=pts[i], c=pts[i+1], dx=c[0]-a[0], dy=c[1]-a[1], l2=dx*dx+dy*dy||1, t=clamp(((x-a[0])*dx+(y-a[1])*dy)/l2,0,1), d=Math.hypot(a[0]+dx*t-x,a[1]+dy*t-y); if(d<b) b=d; } return b; }
// a cheap hash noise (0..1) for decisions that must be the same on every sample
function m3wHash(x,y){ let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263))|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; }
// ---------- sounds of our own (surf, gulls, glass chimes, the worm, bubbles, the wind), straight into the audio context
function m3wSnd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted||!SFX.noise) return; v=v==null?1:v;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.4*v; out.connect(ac.destination);
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.25,dur/3)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(kind){
      case 'gull': { const f=rand(1300,1700); tn('triangle',f,f*0.62,0.22,0.035); tn('triangle',f*1.06,f*0.7,0.18,0.03,0.26); break; }
      case 'wave': nz(2.4,0.05,'lowpass',380,1400,0.6); nz(1.6,0.025,'bandpass',900,300,0.7,0.8); break;
      case 'surge': nz(3.2,0.07,'lowpass',260,900,0.5); tn('sine',70,48,2.2,0.03,0.2); break;
      case 'chime': { const f=pick([1568,1760,2093,2349,2637]); tn('sine',f,f*0.998,1.4,0.03); tn('sine',f*2.01,f*2,0.8,0.012,0.01); break; }
      case 'tinkle': for(let i=0;i<4;i++){ const f=pick([2093,2349,2637,3136,3520]); tn('sine',f,f,0.6,0.012,i*0.07+Math.random()*0.04); } break;
      case 'creak': tn('sawtooth',90,70,0.5,0.02); nz(0.4,0.03,'bandpass',500,300,3); break;
      case 'bubble': for(let i=0;i<3;i++){ const f=rand(380,760); tn('sine',f,f*1.8,0.09,0.03,i*0.08); } break;
      case 'rumble': nz(1.6,0.07,'lowpass',120,60,0.7); tn('sine',46,38,1.4,0.04); break;
      case 'gust': nz(2.2,0.045,'bandpass',700,1600,0.6); break;
      case 'hiss': nz(1.2,0.03,'highpass',2400,4200,0.6); break;
      case 'bell': [523,659,784].forEach((f,i)=>tn('sine',f,f*0.995,1.6,0.035,i*0.02)); tn('sine',261,259,2.4,0.025); break;
      case 'moon': [880,1175,1397].forEach((f,i)=>tn('sine',f,f,1.2,0.025,i*0.09)); break;
      case 'chicken': for(let i=0;i<3;i++){ const f=rand(700,900); tn('square',f,f*1.3,0.08,0.012,i*0.12); } break;
    }
  }catch(e){}
}
// ---------- cached outlined sprites (Storybook look); in Classic they are just the painted sprites
const M3WS=new Map();
function m3wSpr(key,R,draw){ const k=(LOOK.sb?'s:':'c:')+key; let c=M3WS.get(k); if(c) return c; c=LOOK.sb?sbSprite('m3w_'+key,R,draw):spriteOf(R,draw); M3WS.set(k,c); return c; }
// a cached tall sprite drawn from a base point (w x h world px, base at bx,by inside it)
function m3wTall(key,w,h,bx,by,draw,ow,noOut){
  const k=(LOOK.sb?'s:':'c:')+key; let c=M3WS.get(k); if(c) return c;
  const sc=2, cv=mkCanvas(Math.ceil(w*sc),Math.ceil(h*sc)), g=cv.getContext('2d'); g.scale(sc,sc); g.translate(bx,by); g.lineCap='round'; g.lineJoin='round'; draw(g);
  cv.ox=bx; cv.oy=by; cv.w2=w; cv.h2=h;
  c=LOOK.sb&&!noOut?outlineSprite(cv,SBC.outline,ow||1.8,{force:true}):cv; c.ox=bx; c.oy=by; c.w2=w; c.h2=h; M3WS.set(k,c); return c;
}
function m3wPut(c,x,y,s,a){ s=s||1; if(a!=null&&a<1){ ctx.globalAlpha=a; ctx.drawImage(c,x-c.ox*s,y-c.oy*s,c.w2*s,c.h2*s); ctx.globalAlpha=1; } else ctx.drawImage(c,x-c.ox*s,y-c.oy*s,c.w2*s,c.h2*s); }
// cel helpers for the hand-drawn pieces (light from the top left)
function m3wEll(g,x,y,rx,ry,col){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); }
function m3wRect(g,x,y,w,h,col,r){ g.fillStyle=col; if(r){ rrect(g,x,y,w,h,r); g.fill(); } else g.fillRect(x,y,w,h); }
function m3wShade(g,x,y,w,h,col,r){ const T=celTones(col); m3wRect(g,x,y,w,h,T[2],r); m3wRect(g,x,y,w-Math.max(1.5,w*0.18),h-Math.max(1,h*0.06),T[1],r); m3wRect(g,x+1,y+1,Math.max(1,w*0.22),h-2,T[0],r?Math.min(r,2):0); }
const m3wTones=p=>[p[2],p[1],p[0]];
function m3wBlob(g,R,rng,pal){ const v=sbRockPts(R,rng); celFill(g,(q,dx,dy)=>sbRoundPoly(q,v,dx,dy),pal[1],{r:R,tones:m3wTones(pal),hi:R*0.14,lo:R*0.24}); return v; }
// world line for a story beat or a sign (scene back to play afterwards, then a save)
const m3wSay=(lines,cb)=>runDialogue(lines.map(l=>Array.isArray(l)?l:['narr',l]),()=>{ scene='play'; if(cb) cb(); saveGame(); });
// a one-time tip line near Ash (not a dialogue)
function m3wTip(id,x,y,text,col,gap){ const k=M3WD.tips[id]; if(k!=null&&G.time-k<(gap||6)) return; M3WD.tips[id]=G.time; ftext(x,y,text,col||'#fff4dc',13); }

// ================= 1. prop kinds (Storybook: cel tones from the top left; the engine adds the plum outline)
const M3WPAL={palm:['#2f7a3a','#47a046','#7fcc5a'],palmD:['#2a6634','#3c8a40','#6ab450'],trunk:['#7a5634','#a07848','#c89c64'],mangrove:['#264f36','#356a42','#5a9450'],
  coralP:['#c2506a','#ee7a90','#ffb0bc'],coralO:['#c8642c','#f08a3c','#ffc070'],coralV:['#6a4aa0','#8e6ac8','#bca0ee'],marble:['#a8a4b8','#dcdae6','#ffffff'],
  glass:['#5aa0b8','#9ad8e8','#e8fbff'],glassV:['#6a5aa8','#9a8ad8','#dcd4ff'],dune:['#a88a3a','#cdb05a','#ecd88a'],salt:['#9a8cc4','#cfc6ec','#fbf8ff'],
  canvas:['#c8b48a','#efe2c0','#fff8e6'],bone:['#b8ae98','#e8e0cc','#fffaf0'],shroom:['#2a7a9a','#44b8d8','#a8f0ff']};
// one palm frond: a long curved leaf from the crown out to (L at angle a), bending with `bend`
function m3wLeaf(q,a,L,w,bend,dx,dy){
  const ca=Math.cos(a), sa=Math.sin(a), px=-sa, py=ca, tx=ca*L+dx, ty=sa*L+dy+L*0.18, mx=ca*L*0.55+px*bend+dx, my=sa*L*0.55+py*bend+dy;
  q.moveTo(dx,dy); q.quadraticCurveTo(mx+px*w,my+py*w,tx,ty); q.quadraticCurveTo(mx-px*w*0.6,my-py*w*0.6,dx,dy); q.closePath();
}
definePropKind('m_palm',{n:3,tall:true,R:48,col:{r:7},h:84,rot:false,make(seed,v){ const rng=mulberry32(seed), R=48, lean=[-1,0.55,1][v%3]; return spriteOf(R,g=>{
  // the trunk: ringed segments curving down to its foot (south of the crown, leaning)
  const n=7, fx=lean*15, fy=R*0.78;
  for(let i=n;i>=0;i--){ const k=i/n, x=fx*k*k+lean*2*k, y=fy*k, r=4.6+k*1.6; celBall(g,x,y,r,M3WPAL.trunk[1],m3wTones(M3WPAL.trunk)); g.strokeStyle='rgba(70,44,24,.55)'; g.lineWidth=1; g.beginPath(); g.arc(x,y-r*0.2,r*0.85,0.25*Math.PI,0.75*Math.PI); g.stroke(); }
  // fronds: the low dark ones first, the lit top ones last
  const m=8+(v%2), a0=rng()*TAU;
  for(let pass=0;pass<2;pass++) for(let i=0;i<m;i++){ if((i%2)!==pass) continue; const a=a0+i/m*TAU+(rng()-0.5)*0.25, L=R*(0.78+rng()*0.22), lit=-(Math.cos(a)+Math.sin(a))/1.4, P=pass?M3WPAL.palm:M3WPAL.palmD;
    const tones=lit>0.2?[P[2],sbTone(P[2],0.12),P[1]]:lit>-0.3?[P[2],P[1],P[0]]:[P[1],P[0],sbTone(P[0],-0.15)];
    celFill(g,(q,dx,dy)=>m3wLeaf(q,a,L,7.5,4+rng()*3,dx,dy),tones[1],{r:L*0.4,tones,hi:2,lo:2.4});
    g.strokeStyle='rgba(30,70,30,.5)'; g.lineWidth=0.9; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(Math.cos(a)*L*0.55,Math.sin(a)*L*0.55,Math.cos(a)*L*0.95,Math.sin(a)*L*0.95+L*0.16); g.stroke(); }
  // coconuts
  for(let i=0;i<3;i++) celBall(g,Math.cos(i*2.1+0.4)*4.2,Math.sin(i*2.1+0.4)*3.4+1,3.4,'#8a5a2a',['#b07a3e','#8a5a2a','#5a3a1a']);
}); }});
definePropKind('m_mangrove',{n:3,tall:true,R:46,col:{r:9},h:72,rot:false,make(seed,v){ const rng=mulberry32(seed), R=46; return spriteOf(R,g=>{
  // stilt roots arching down into the water on the south side
  for(let i=0;i<7;i++){ const a=Math.PI*0.12+i/6*Math.PI*0.76, x0=Math.cos(a)*R*0.3, y0=Math.sin(a)*R*0.25, x1=Math.cos(a)*R*0.92, y1=Math.sin(a)*R*0.62+R*0.22;
    g.strokeStyle='#4a3424'; g.lineWidth=4.6; g.beginPath(); g.moveTo(x0,y0); g.quadraticCurveTo((x0+x1)/2+Math.cos(a)*6,Math.min(y0,y1)-8,x1,y1); g.stroke();
    g.strokeStyle='#7a5a3e'; g.lineWidth=2; g.beginPath(); g.moveTo(x0-0.8,y0-0.8); g.quadraticCurveTo((x0+x1)/2+Math.cos(a)*6-1,Math.min(y0,y1)-9,x1-0.6,y1-0.8); g.stroke();
    m3wEll(g,x1,y1+1.5,3.6,1.6,'rgba(200,230,220,.55)'); }
  sbCanopy(g,R*0.8,rng,M3WPAL.mangrove,8,3);
  // pale flowers or glowing moss
  for(let i=0;i<6;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.6; m3wEll(g,Math.cos(a)*d,Math.sin(a)*d-2,1.6,1.4,v===2?'#9af0ff':'#f4f0d8'); }
}); }});
definePropKind('m_coralrock',{n:3,R:17,col:{r:12,low:true},rot:false,make(seed,v){ const rng=mulberry32(seed), R=17; return spriteOf(R,g=>{
  m3wEll(g,2,4,R,R*0.55,'rgba(40,40,70,.25)');
  if(v===0){ // brain coral
    celBall(g,0,0,R*0.85,M3WPAL.coralP[1],m3wTones(M3WPAL.coralP)); g.strokeStyle='rgba(140,40,70,.6)'; g.lineWidth=1.3; for(let i=0;i<4;i++){ g.beginPath(); let x=-R*0.6, y=-R*0.4+i*R*0.3; g.moveTo(x,y); for(let k=0;k<5;k++){ x+=R*0.26; y+=(k%2?3:-3); g.lineTo(x,y); } g.stroke(); } }
  else{ // branching coral and a fan
    const P=v===1?M3WPAL.coralO:M3WPAL.coralV;
    for(let i=0;i<6;i++){ const a=-Math.PI*0.95+i/5*Math.PI*0.9, L=R*(0.6+rng()*0.4); g.strokeStyle=P[0]; g.lineWidth=5.2; g.lineCap='round'; g.beginPath(); g.moveTo(0,R*0.35); g.quadraticCurveTo(Math.cos(a)*L*0.4,R*0.2+Math.sin(a)*L*0.4,Math.cos(a)*L,Math.sin(a)*L*0.8); g.stroke(); g.strokeStyle=P[1]; g.lineWidth=3.2; g.stroke(); celBall(g,Math.cos(a)*L,Math.sin(a)*L*0.8,2.6,P[2],[P[2],P[1],P[0]]); }
    celBall(g,R*0.4,R*0.25,R*0.32,M3WPAL.coralP[1],m3wTones(M3WPAL.coralP)); }
}); }});
definePropKind('m_column',{n:3,R:20,col:{r:12},rot:false,make(seed,v){ const rng=mulberry32(seed), R=20, P=M3WPAL.marble; return spriteOf(R,g=>{
  m3wEll(g,3,8,13,5,'rgba(40,40,70,.3)');
  const h=v===2?6:12+v*6;
  // the shaft (south side visible), fluted, then the broken top
  celFill(g,(q,dx,dy)=>{ q.moveTo(-10+dx,6+dy); q.lineTo(-10+dx,6-h+dy); q.lineTo(10+dx,6-h+dy); q.lineTo(10+dx,6+dy); q.ellipse(dx,6+dy,10,4,0,0,Math.PI); q.closePath(); },P[1],{r:10,tones:m3wTones(P),hi:2.5,lo:3});
  g.strokeStyle='rgba(120,116,150,.45)'; g.lineWidth=1; for(let x=-6;x<=6;x+=4){ g.beginPath(); g.moveTo(x,7-h); g.lineTo(x,8); g.stroke(); }
  const ty=6-h; celFill(g,(q,dx,dy)=>{ q.ellipse(dx,ty+dy,10,4.4,0,0,TAU); },'#eeedf4',{r:9,tones:['#ffffff','#eeedf4','#c8c4d8']});
  g.fillStyle='#b8b4c8'; g.beginPath(); g.moveTo(-6,ty-1); g.lineTo(-2,ty+2); g.lineTo(2,ty-2); g.lineTo(6,ty+1.5); g.lineTo(4,ty+3); g.lineTo(-5,ty+3); g.closePath(); g.fill();
  // a silver moon mosaic chip
  m3wEll(g,-3,ty+h*0.5,2.2,2.2,'#9ab8e8'); m3wEll(g,-3.6,ty+h*0.5-0.6,0.9,0.9,'#ffffff');
  if(v===2){ g.save(); g.translate(13,2); g.rotate(0.5); m3wShade(g,-7,-3,14,6,'#dcdae6'); g.restore(); }
}); }});
definePropKind('m_glasscactus',{n:3,R:20,col:{r:8},rot:false,make(seed,v){ const rng=mulberry32(seed), R=20, P=v===2?M3WPAL.glassV:M3WPAL.glass; return spriteOf(R,g=>{
  m3wEll(g,2,8,11,4,'rgba(40,60,90,.28)');
  const arm=(x0,y0,x1,y1,w)=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(x0-w+dx,y0+dy); q.lineTo(x1-w*0.8+dx,y1+dy); q.lineTo(x1+dx,y1-w+dy); q.lineTo(x1+w*0.8+dx,y1+dy); q.lineTo(x0+w+dx,y0+dy); q.closePath(); },P[1],{r:w*2,tones:m3wTones(P),hi:1.5,lo:1.5}); };
  arm(0,8,0,-16,5.2); arm(0,-2,-10,-8,3.2); arm(-10,-8,-10,-14,2.6); if(v!==1){ arm(0,2,9,-3,3); arm(9,-3,9,-10,2.4); }
  g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=1; g.beginPath(); g.moveTo(-1.6,4); g.lineTo(-1.6,-12); g.stroke();
  for(let i=0;i<5;i++){ const x=(rng()-0.5)*14, y=-rng()*16; m3wEll(g,x,y,0.8,0.8,'#ffffff'); }
}); }});
definePropKind('m_glassspike',{n:3,tall:true,R:28,col:{r:13},h:58,rot:false,make(seed,v){ const rng=mulberry32(seed), R=28, P=v===1?M3WPAL.glassV:M3WPAL.glass; return spriteOf(R,g=>{
  m3wEll(g,3,9,R*0.75,7,'rgba(30,40,80,.28)');
  const n=4+v; for(let i=0;i<n;i++){ const x=(i-(n-1)/2)*8+(rng()-0.5)*4, h=20+rng()*22, w=5+rng()*3, tip=x+(rng()-0.5)*8;
    g.fillStyle=P[0]; g.beginPath(); g.moveTo(x-w,8); g.lineTo(tip,8-h); g.lineTo(x+w,8); g.closePath(); g.fill();
    g.fillStyle=P[1]; g.beginPath(); g.moveTo(x-w,8); g.lineTo(tip,8-h); g.lineTo(x+w*0.15,8); g.closePath(); g.fill();
    g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(x-w*0.6,6); g.lineTo(tip-0.5,9-h); g.lineTo(x-w*0.25,6); g.closePath(); g.fill(); }
}); }});
definePropKind('m_dunegrass',{n:3,R:12,rot:false,make(seed,v){ const rng=mulberry32(seed), R=12; return spriteOf(R,g=>{
  for(let i=0;i<9;i++){ const a=-Math.PI/2+(rng()-0.5)*1.6, L=7+rng()*6, x=(rng()-0.5)*8; g.strokeStyle=i%3?'#9a9a3e':'#c8b85a'; g.lineWidth=1.8; g.lineCap='round'; g.beginPath(); g.moveTo(x,5); g.quadraticCurveTo(x+Math.cos(a)*L*0.4,5+Math.sin(a)*L*0.5,x+Math.cos(a)*L,5+Math.sin(a)*L); g.stroke(); }
  if(v===2) for(let i=0;i<3;i++) m3wEll(g,(rng()-0.5)*8,-3-rng()*4,1.4,1.4,'#f4e6a0');
}); }});
definePropKind('m_tent',{n:3,R:30,col:{r:18},rot:false,make(seed,v){ const R=30, cA=['#d8503a','#3a7ab8','#e0a030'][v%3]; return spriteOf(R,g=>{
  m3wEll(g,3,10,R*0.9,9,'rgba(50,30,30,.3)');
  // a striped canvas cone seen from above and a little south
  for(let i=0;i<8;i++){ const a0=Math.PI*0.05+i/8*Math.PI*0.9, a1=a0+Math.PI*0.9/8; g.fillStyle=i%2?'#fff4e0':cA; g.beginPath(); g.moveTo(0,-20); g.lineTo(Math.cos(a0)*R*0.95,Math.sin(a0)*R*0.5+6); g.lineTo(Math.cos(a1)*R*0.95,Math.sin(a1)*R*0.5+6); g.closePath(); g.fill(); }
  g.fillStyle='rgba(59,30,72,.25)'; g.beginPath(); g.moveTo(0,-20); g.lineTo(R*0.95,6); g.lineTo(R*0.3,R*0.5+4); g.closePath(); g.fill();
  m3wRect(g,-5,2,10,13,'#3a2a2a',2); g.strokeStyle='#5a3e22'; g.lineWidth=1.6; g.beginPath(); g.moveTo(0,-20); g.lineTo(0,-30); g.stroke();
  g.fillStyle=cA; g.beginPath(); g.moveTo(0,-30); g.lineTo(9,-27); g.lineTo(0,-24); g.closePath(); g.fill();
}); }});
definePropKind('m_lamppost',{n:2,tall:true,R:30,col:{r:5},h:58,rot:false,make(seed,v){ return spriteOf(30,g=>m3wLampArt(g,false,v)); }});
// a glass lantern on a post (v 0: Sable's brass and glass, 1: driftwood post with a paper lantern, 2: moon-marble)
function m3wLampArt(g,lit,v){
  m3wEll(g,3,2,7,3,'rgba(40,26,30,.35)'); m3wEll(g,0,0,5,2.4,v===2?'#9a96b0':'#5a4a30');
  m3wShade(g,-1.8,-28,3.6,28,v===1?'#8e6a40':v===2?'#d6d4e2':'#8a6a2a');
  if(v===1){ m3wRect(g,-6,-36,12,3,'#6a4a2c'); celFill(g,(q,dx,dy)=>q.ellipse(dx+6,dy-29,5,6.5,0,0,TAU),lit?'#ffcf6a':'#e8b860',{r:6,tones:lit?['#fff2b0','#ffcf6a','#e08a3a']:undefined}); g.strokeStyle='#8a4a2a'; g.lineWidth=0.8; g.beginPath(); g.moveTo(1,-29); g.lineTo(11,-29); g.stroke(); return; }
  m3wShade(g,-5,-39,10,11,v===2?'#e6e4f0':'#c8963a'); m3wRect(g,-3.4,-37.5,6.8,8,lit?(v===2?'#e8eeff':'#fff2b0'):'#8ab0c0',1);
  m3wRect(g,-6,-41,12,2.6,v===2?'#b8b4cc':'#8a6420',1); g.fillStyle=v===2?'#b8b4cc':'#8a6420'; g.beginPath(); g.moveTo(-4,-41); g.lineTo(0,-46); g.lineTo(4,-41); g.fill();
}
definePropKind('m_bones',{n:2,tall:true,R:56,col:{r:8},h:64,rot:false,make(seed,v){ const R=56, P=M3WPAL.bone; return spriteOf(R,g=>{
  m3wEll(g,4,10,R*0.85,12,'rgba(60,40,30,.25)');
  // a spine and a row of ribs arching up out of the sand
  g.strokeStyle=P[0]; g.lineWidth=7; g.beginPath(); g.moveTo(-R*0.85,4); g.quadraticCurveTo(0,-6,R*0.85,6); g.stroke(); g.strokeStyle=P[1]; g.lineWidth=4; g.stroke();
  for(let i=0;i<6;i++){ const x=-R*0.7+i*R*0.28, hh=26-Math.abs(i-2.5)*5;
    for(const s of [-1,1]){ g.strokeStyle=P[0]; g.lineWidth=5.2; g.beginPath(); g.moveTo(x,0); g.quadraticCurveTo(x+s*10,-hh*0.4+s*6,x+s*4,s*hh*0.7); g.stroke(); g.strokeStyle=P[2]; g.lineWidth=2.4; g.beginPath(); g.moveTo(x-0.8,-0.8); g.quadraticCurveTo(x+s*10-0.8,-hh*0.4+s*6-0.8,x+s*4-0.6,s*hh*0.7-0.6); g.stroke(); } }
}); }});
definePropKind('m_shell',{n:3,R:8,rot:false,make(seed,v){ return spriteOf(8,g=>{
  if(v===0){ celBall(g,0,0,5,'#f4c8b8',['#fff0ea','#f4c8b8','#c88a7a']); g.strokeStyle='rgba(160,90,80,.6)'; g.lineWidth=0.8; for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(0,4); g.lineTo(i*2,-4); g.stroke(); } }
  else if(v===1){ celFill(g,(q,dx,dy)=>{ q.moveTo(dx-5,dy+2); q.quadraticCurveTo(dx-4,dy-5,dx+2,dy-4); q.quadraticCurveTo(dx+6,dy,dx+3,dy+4); q.closePath(); },'#f6e6c8',{r:5}); g.strokeStyle='rgba(150,110,80,.7)'; g.lineWidth=0.8; g.beginPath(); g.arc(1,0,2,0,TAU*0.8); g.stroke(); }
  else{ g.fillStyle='#ff8a5a'; sbStar(g,5,5,2,0.3,0,0); g.fill(); g.fillStyle='#ffb08a'; sbStar(g,5,2.6,1,0.3,-0.6,-0.6); g.fill(); }
}); }});
definePropKind('m_mushroom',{n:3,R:11,rot:false,make(seed,v){ const rng=mulberry32(seed), R=11; return spriteOf(R,g=>{
  for(let i=0;i<3+v;i++){ const x=(rng()-0.5)*R*1.2, y=(rng()-0.5)*R*0.8, r=2.4+rng()*2.6; m3wEll(g,x+1,y+2,r,r*0.5,'rgba(20,40,40,.3)'); m3wRect(g,x-0.8,y,1.6,3,'#e0e8e0'); celBall(g,x,y,r,M3WPAL.shroom[1],m3wTones(M3WPAL.shroom)); m3wEll(g,x-r*0.3,y-r*0.35,r*0.3,r*0.22,'#e8ffff'); }
}); }});
definePropKind('m_crystal',{n:3,R:17,col:{r:10,low:true},rot:false,make(seed,v){ const rng=mulberry32(seed), R=17, P=v===1?M3WPAL.glass:M3WPAL.glassV; return spriteOf(R,g=>{
  m3wEll(g,2,6,12,4,'rgba(30,20,60,.3)');
  for(let i=0;i<5;i++){ const a=-Math.PI/2+(rng()-0.5)*1.6, L=8+rng()*9, x=(rng()-0.5)*8, w=3+rng()*2;
    celFill(g,(q,dx,dy)=>{ q.moveTo(x-w+dx,5+dy); q.lineTo(x+Math.cos(a)*L+dx,5+Math.sin(a)*L+dy); q.lineTo(x+w+dx,5+dy); q.closePath(); },P[1],{r:w*2,tones:m3wTones(P),hi:1,lo:1}); }
  m3wEll(g,-2,-6,1.4,1.4,'#ffffff');
}); }});
definePropKind('m_saltpillar',{n:3,R:18,col:{r:9},rot:false,make(seed,v){ const rng=mulberry32(seed), R=18, P=M3WPAL.salt; return spriteOf(R,g=>{
  m3wEll(g,3,7,12,4,'rgba(80,90,120,.25)');
  // a cluster of salt crystals: hexagonal prisms, the tallest at the back
  const n=2+v; for(let i=0;i<n;i++){ const x=(i-(n-1)/2)*7+(rng()-0.5)*3, h=8+rng()*8+(i===Math.floor(n/2)?6:0), w=3.2+rng()*1.6, y=6-(i%2)*2;
    celFill(g,(q,dx,dy)=>{ q.moveTo(x-w+dx,y+dy); q.lineTo(x-w+dx,y-h+dy); q.lineTo(x+dx,y-h-w*0.6+dy); q.lineTo(x+w+dx,y-h+dy); q.lineTo(x+w+dx,y+dy); q.lineTo(x+dx,y+w*0.6+dy); q.closePath(); },P[1],{r:w*2,tones:m3wTones(P),hi:1.2,lo:1.4});
    g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(x-w,y-h); g.lineTo(x,y-h-w*0.6); g.lineTo(x+w,y-h); g.lineTo(x,y-h+w*0.6); g.closePath(); g.fill(); }
}); }});
definePropKind('m_driftglass',{n:2,R:20,col:{r:9,low:true},rot:false,make(seed,v){ const R=20; return spriteOf(R,g=>{
  g.save(); g.rotate(v?0.45:-0.3); m3wEll(g,2,4,R*0.95,4.5,'rgba(40,60,80,.3)');
  celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy,R*0.9,4.2,0,0,TAU); },'#a8dcec',{r:5,tones:['#f0fcff','#a8dcec','#6aa0bc']});
  g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=1; g.beginPath(); g.moveTo(-R*0.6,-1.5); g.lineTo(R*0.5,-1.8); g.stroke();
  g.strokeStyle='#a8dcec'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-R*0.2,-3); g.lineTo(-R*0.35,-9); g.stroke(); g.restore();
}); }});
definePropKind('m_seagrass',{n:3,R:11,rot:false,make(seed,v){ const rng=mulberry32(seed), R=11; return spriteOf(R,g=>{
  for(let i=0;i<8;i++){ const a=-Math.PI/2+(rng()-0.5)*1.4, L=6+rng()*7, x=(rng()-0.5)*9; g.strokeStyle=i%2?'#5a9a4a':'#7ab85a'; g.lineWidth=2; g.lineCap='round'; g.beginPath(); g.moveTo(x,4); g.quadraticCurveTo(x+Math.cos(a)*L*0.3,4+Math.sin(a)*L*0.6,x+Math.cos(a)*L,4+Math.sin(a)*L); g.stroke(); }
}); }});
// ---------- critters: gulls (the isles), hermit crabs (beaches; glass crabs on the Strand), fireflies (the mangroves),
// desert foxes (dunes and Sable)
defineCritter('m_gull',{r:8,draw(c){ const x=c.x, y=c.y, f=c.face||0, fl=Math.cos(f)<0?-1:1, hop=c.moving?Math.abs(Math.sin(G.time*16+c.x))*2:0;
  ctx.save(); ctx.translate(x,y-hop); ctx.scale(fl,1);
  ctx.fillStyle='rgba(40,40,60,.22)'; ctx.beginPath(); ctx.ellipse(0,5+hop,7,2.4,0,0,TAU); ctx.fill();
  ctx.fillStyle='#f2a020'; ctx.fillRect(-1.5,1,1.2,4); ctx.fillRect(1.5,1,1.2,4);
  if(LOOK.sb){ ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(0,-2,8,5.2,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(6,-6,3.8,0,TAU); ctx.fill(); }
  ctx.fillStyle='#fafaf6'; ctx.beginPath(); ctx.ellipse(0,-2,7,4.2,0,0,TAU); ctx.fill(); ctx.fillStyle='#9aa4b4'; ctx.beginPath(); ctx.ellipse(-1.5,-3,5.2,2.6,-0.15,0,TAU); ctx.fill();
  ctx.fillStyle='#fafaf6'; ctx.beginPath(); ctx.arc(6,-6,3,0,TAU); ctx.fill(); ctx.fillStyle='#f2c020'; ctx.beginPath(); ctx.moveTo(8.5,-6.4); ctx.lineTo(12,-5.6); ctx.lineTo(8.5,-4.8); ctx.fill(); ctx.fillStyle='#222'; ctx.fillRect(6.6,-7.2,1.2,1.2);
  ctx.restore(); }});
defineCritter('m_hermit',{r:6,draw(c){ const x=c.x, y=c.y, t=G.time*14+c.x, k=c.moving?Math.sin(t):0, glass=y<71000&&x>6300&&x<7900;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(60,30,30,.25)'; ctx.beginPath(); ctx.ellipse(0,3,6,2.2,0,0,TAU); ctx.fill();
  ctx.strokeStyle='#c8503a'; ctx.lineWidth=1.1; for(const s of [-1,1]) for(let i=0;i<2;i++){ ctx.beginPath(); ctx.moveTo(s*2,i); ctx.lineTo(s*(5+(i?k:0)),i*2+k*0.5); ctx.stroke(); }
  if(LOOK.sb){ ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.arc(0,-2,5.2,0,TAU); ctx.fill(); }
  ctx.fillStyle=glass?'#a8e0f0':'#f0d8b0'; ctx.beginPath(); ctx.arc(0,-2,4.2,0,TAU); ctx.fill(); ctx.strokeStyle=glass?'#5a9ab8':'#b0885a'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0.5,-2,2.2,0.2,TAU*0.85); ctx.stroke();
  if(glass){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.fillRect(-2,-4.5,1.4,1.4); }
  ctx.fillStyle='#e06040'; ctx.beginPath(); ctx.arc(3.6,0.6,1.5,0,TAU); ctx.fill(); ctx.fillStyle='#111'; ctx.fillRect(2.8,-1.2,0.9,0.9);
  ctx.restore(); }});
defineCritter('m_firefly',{r:4,draw(c){ const t=G.time, x=c.x+Math.sin(t*1.7+c.y)*6, y=c.y-10+Math.sin(t*2.3+c.x)*5, on=0.5+0.5*Math.sin(t*3+c.x*0.1);
  const nt=daylight()<0.55; if(!nt){ ctx.fillStyle='rgba(60,70,40,.6)'; ctx.beginPath(); ctx.arc(x,y,1.4,0,TAU); ctx.fill(); return; }
  glowAt(x,y,10,'200,255,140',0.35*on+0.1); ctx.fillStyle=`rgba(230,255,170,${0.5+0.5*on})`; ctx.beginPath(); ctx.arc(x,y,1.6,0,TAU); ctx.fill(); }});
defineCritter('m_fox',{r:9,draw(c){ const x=c.x, y=c.y, f=c.face||0, fl=Math.cos(f)<0?-1:1, k=c.moving?Math.sin(G.time*14+c.x)*1.4:0;
  ctx.save(); ctx.translate(x,y); ctx.scale(fl,1);
  ctx.fillStyle='rgba(60,40,30,.25)'; ctx.beginPath(); ctx.ellipse(0,5,9,3,0,0,TAU); ctx.fill();
  const ol=LOOK.sb?SBC.outline:'#5a3a2a';
  ctx.fillStyle='#8a5a32'; for(const lx of [-5,-2,3,6]) ctx.fillRect(lx,1+(lx%2?k:-k)*0.5,1.8,4.5);
  ctx.fillStyle=ol; ctx.beginPath(); ctx.ellipse(0,-2,8.4,5,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-9,-3,5,3.2,-0.4,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(8,-5,4.4,0,TAU); ctx.fill();
  ctx.fillStyle='#e8a050'; ctx.beginPath(); ctx.ellipse(0,-2,7.2,4,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-9,-3,4,2.3,-0.4,0,TAU); ctx.fill(); ctx.fillStyle='#fff4e0'; ctx.beginPath(); ctx.ellipse(-12,-3.6,1.8,1.4,0,0,TAU); ctx.fill();
  ctx.fillStyle='#e8a050'; ctx.beginPath(); ctx.arc(8,-5,3.4,0,TAU); ctx.fill();
  // the big ears of a desert fox
  for(const ex of [6,10]){ ctx.fillStyle=ol; ctx.beginPath(); ctx.moveTo(ex-3,-7); ctx.lineTo(ex,-15); ctx.lineTo(ex+3,-7); ctx.fill(); ctx.fillStyle='#e8a050'; ctx.beginPath(); ctx.moveTo(ex-2,-7.5); ctx.lineTo(ex,-13.5); ctx.lineTo(ex+2,-7.5); ctx.fill(); ctx.fillStyle='#f6c8a0'; ctx.beginPath(); ctx.moveTo(ex-1,-8); ctx.lineTo(ex,-11.5); ctx.lineTo(ex+1,-8); ctx.fill(); }
  ctx.fillStyle='#222'; ctx.fillRect(9.4,-6,1.2,1.2); ctx.fillRect(11.8,-4.4,1.2,1); ctx.restore(); }});

// ================= 2. biomes 30 to 39 (bible 3.1); the ground colours follow STYLE.md (light and dark close to the base)
// s.m3 bits written by the terrain hook: 1 the Reefwall, 2 a glass streak, 4 the Glasswall, 8 shallow sea, 16 quicksand,
// 32 the deep channel round the Spire, 64 the Coralcombe ring, 128 the Burrow Gap strip, 256 salt-glass (Flats/Heights)
const M3W_SEA={shallow:'#7ae4e2',deep:'#2c7ec8',lip:'#f4fffb'};
const M3WRGB={coralA:[238,122,144],coralB:[244,150,84],coralC:[255,196,170],sandWet:[176,146,92],sandQs:[150,118,70],glass:[206,236,246],glassHi:[246,252,255],gwall:[214,232,250],salt:[248,250,252],shadow:[24,84,150]};
const m3wFl=(g,rng,x,y,cols,n)=>sbFlowers(g,rng,x,y,cols[Math.floor(rng()*cols.length)],n);
// dune ripples and glass streaks over the sand (cheap: two sines), quicksand swirls, the Reefwall's coral
function m3wDuneRGB(c,s,x,y){
  if(s.water) return null;
  const m=s.m3|0;
  if(m&16){ const sw=0.5+0.5*Math.sin((x+y)*0.035+Math.sin(x*0.021-y*0.013)*2.4); return mixRGB(mixRGB(c,M3WRGB.sandQs,0.55),M3WRGB.sandWet,sw*0.4); }
  if(m&4) return mixRGB(M3WRGB.gwall,M3WRGB.glassHi,clamp(s.n+0.5,0,1)*0.6);
  if(s.road>0.4) return null;
  if(s.m3g>0) return mixRGB(c,M3WRGB.glass,(m&2?0.16:0.05)+0.16*s.m3g);
  if(s.shore>0.2) return null;
  const r=Math.sin(x*0.0062+Math.sin(y*0.0021+x*0.0007)*2.6+y*0.0031);
  if(r>0.86) return mixRGB(c,[255,244,206],(r-0.86)*2.6);
  if(r<-0.9) return mixRGB(c,[170,128,70],(-0.9-r)*2.2);
  return null;
}
function m3wSandDecor(g,rng,x,y,r,dark){
  if(r<0.06){ g.strokeStyle=dark||'rgba(170,130,70,.45)'; g.lineWidth=1.3; g.beginPath(); g.moveTo(x-9,y); g.quadraticCurveTo(x,y-3,x+9,y); g.stroke(); }
  else if(r<0.075) sbPebble(g,x,y,1.4+rng()*1.6,rng()<0.5?'#c8a870':'#f4e4b8');
  else if(r<0.082){ g.fillStyle='rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(x,y-2.6); g.lineTo(x+1,y); g.lineTo(x,y+2.6); g.lineTo(x-1,y); g.closePath(); g.fill(); }
}
// a glass shard in a streak of the dunes (many of them make the streak: glassy, not watery)
function m3wShard(g,rng,x,y,r,k){
  if(r<0.3*k){ const a=rng()*TAU, L=3.5+rng()*5*k, sx=x+(rng()-0.5)*4; g.fillStyle=rng()<0.5?'rgba(150,214,236,.85)':'rgba(196,232,246,.9)'; g.beginPath(); g.moveTo(sx+Math.cos(a)*L,y+Math.sin(a)*L*0.55); g.lineTo(sx+Math.cos(a+2.2)*L*0.55,y+Math.sin(a+2.2)*L*0.35); g.lineTo(sx+Math.cos(a-2.4)*L*0.6,y+Math.sin(a-2.4)*L*0.35); g.closePath(); g.fill();
    g.strokeStyle='rgba(70,120,150,.45)'; g.lineWidth=0.7; g.stroke(); g.fillStyle='rgba(255,255,255,.95)'; g.fillRect(sx-0.7,y-1,1.4,1.4); }
  else if(r<0.36*k){ g.fillStyle='rgba(255,255,255,1)'; g.beginPath(); g.moveTo(x,y-3); g.lineTo(x+1.1,y); g.lineTo(x,y+3); g.lineTo(x-1.1,y); g.closePath(); g.fill(); }
}
function m3wBeachDecor(g,rng,x,y,r){
  if(r<0.007){ g.fillStyle='#ff8a5a'; sbStar(g,5,3.6,1.5,rng()*TAU,x,y); g.fill(); g.fillStyle='rgba(255,200,170,.8)'; g.beginPath(); g.arc(x-0.6,y-0.6,1.1,0,TAU); g.fill(); }
  else if(r<0.014){ g.fillStyle='#fff0e8'; g.beginPath(); g.arc(x,y,2.4,Math.PI,TAU); g.fill(); g.strokeStyle='rgba(190,140,120,.7)'; g.lineWidth=0.8; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(x,y); g.lineTo(x+i*2,y-2.2); g.stroke(); } }
  else if(r<0.05){ g.strokeStyle='rgba(190,160,110,.42)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-7,y); g.quadraticCurveTo(x,y-2.5,x+7,y); g.stroke(); }
  else if(r<0.07) sbPebble(g,x,y,1.3+rng()*1.4,rng()<0.5?'#f6eee0':'#d8c8a8');
}
// the water of the west: coral shadows under the deep blue, the reef in coral colours
function m3wSeaRGB(c,s,x,y){
  const m=s.m3|0;
  if(m&512){ const S=M3W_SOLID[(s.m3c|0)-1]; return S?mixRGB(S.col,[255,255,255],clamp(s.n*0.4+0.1,0,0.25)):null; }
  if(m&1){ const k=clamp(s.n*1.6+0.5,0,1); let col=mixRGB(M3WRGB.coralA,M3WRGB.coralB,k); const w=Math.sin(x*0.08+Math.sin(y*0.05)*2)*Math.sin(y*0.07); if(w>0.4) col=mixRGB(col,M3WRGB.coralC,(w-0.4)*0.9); return col; }
  if(!s.water) return null;
  if(m&8){ const k=clamp(s.n*1.5+0.35,0,1); return mixRGB(c,[150,240,230],k*0.25); }
  if(s.n>0.12) return mixRGB(c,M3WRGB.shadow,clamp((s.n-0.12)*2.2,0,0.32));
  return null;
}
defineBiome(30,{name:'the Driftwood Lagoon',level:17,col:['#f2dea4','#f6e6b2','#e8d294'],road:'#d8b480',roadEdge:'rgba(150,110,70,.8)',water:{shallow:'#86ece4',deep:'#3cb0d4',lip:'#f6fffc'},shore:'#fff2cc',
  music:'m_reef',ambient:{wind:0.3,birds:true,mist:0.1,rain:0.25,gulls:0.5,waves:0.3},critters:['m_gull','m_hermit'],chests:2,footprints:'sand',events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ const r=rng(); if(r<0.05) return {k:'m_palm',v:Math.floor(rng()*3),s:0.85+rng()*0.3}; if(r<0.07) return {k:'m_seagrass'}; if(r<0.08) return {k:'m_shell',v:Math.floor(rng()*3)}; return null; },
  decor(g,rng,x,y,s,r){ m3wBeachDecor(g,rng,x,y,r); },rgb:m3wSeaRGB});
defineBiome(31,{name:'the Sunken Isles',level:17,col:['#ecd89c','#f2e2ac','#e2cc8e'],road:'#d8c08a',roadEdge:'rgba(150,120,80,.8)',water:M3W_SEA,shore:'#fbf0c8',
  music:'m_sea',ambient:{wind:0.4,birds:true,rain:0.3,gulls:0.6,waves:0.6},critters:['m_gull','m_hermit'],chests:3,footprints:'sand',events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ if(s.m3&1) return rng()<0.05?{k:'m_coralrock',v:Math.floor(rng()*3),s:0.9+rng()*0.5}:null; const r=rng(); if(grove>0.05&&r<0.1) return {k:'m_palm',v:Math.floor(rng()*3),s:0.8+rng()*0.35}; if(r<0.02) return {k:'m_palm',v:Math.floor(rng()*3)}; if(r<0.035) return {k:'m_coralrock',v:Math.floor(rng()*3),s:0.7+rng()*0.4}; if(r<0.055) return {k:'m_seagrass'}; if(r<0.065) return {k:'m_shell',v:Math.floor(rng()*3)}; return null; },
  decor(g,rng,x,y,s,r){ if(s.m3&1){ if(r<0.08){ g.fillStyle=rng()<0.5?'rgba(255,220,200,.7)':'rgba(170,70,90,.45)'; g.beginPath(); g.arc(x,y,1.6+rng()*2.2,0,TAU); g.fill(); } return; } m3wBeachDecor(g,rng,x,y,r); },rgb:m3wSeaRGB});
defineBiome(32,{name:'the Drowned Reach',level:18,col:['#d8d0b0','#e0d8ba','#ccc4a2'],road:'#c8c0a0',water:{shallow:'#5aa8c8',deep:'#1e4482',lip:'#e6f2ff'},shore:'#e8e2c8',
  music:'m_lumen',ambient:{wind:0.3,birds:false,mist:0.3,night:0.05,rain:0.35,waves:0.4,moths:0.2},critters:false,chests:1,events:{snow:false,goats:false},
  props(rng,x,y,s){ const r=rng(); if(r<0.03) return {k:'m_column',v:Math.floor(rng()*3)}; if(r<0.05) return {k:'m_coralrock',v:Math.floor(rng()*3)}; return null; },
  decor(g,rng,x,y,s,r){ m3wBeachDecor(g,rng,x,y,r); },
  rgb(c,s,x,y){ if(!s.water) return null; if(s.n>0.1) return mixRGB(c,[50,70,140],clamp((s.n-0.1)*2,0,0.3)); return null; }});
defineBiome(33,{name:'the Moonroot Mangroves',level:18,col:['#7c9c5a','#86a664','#70904e'],road:'#b8a878',roadEdge:'rgba(70,60,40,.8)',water:{shallow:'#62bca6',deep:'#2c7480',lip:'#e2f6ea'},shore:'#b0a474',
  music:'m_deep',ambient:{wind:0.15,birds:true,mist:0.4,night:0.06,rain:0.5,fireflies:0.9,waves:0.1},critters:['m_firefly'],chests:3,events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ const r=rng(); if(grove>-0.1&&r<0.2) return {k:'m_mangrove',v:Math.floor(rng()*3),s:0.85+rng()*0.35}; if(r<0.06) return {k:'m_mangrove',v:Math.floor(rng()*3)}; if(r<0.1) return {k:'m_mushroom',v:Math.floor(rng()*3)}; if(r<0.12) return {k:'reed'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.3) sbTuft(g,x,y,'rgba(70,100,50,.55)',0.8+rng()*0.5); else if(r<0.33){ g.fillStyle='rgba(150,240,255,.8)'; g.beginPath(); g.arc(x,y,1.3,0,TAU); g.fill(); } else if(r<0.36) sbPebble(g,x,y,1.5+rng(),'#5a6a4a'); },
  rgb(c,s,x,y){ if(s.water&&s.n>0.05) return mixRGB(c,[40,90,70],clamp((s.n-0.05)*2,0,0.25)); return null; }});
defineBiome(34,{name:'the Tideglass Strand',level:18,col:['#ecd08c','#f2d99a','#e2c47e'],road:'#f6e4b6',roadEdge:'rgba(160,120,70,.8)',water:{shallow:'#78e0dc',deep:'#2e94cc',lip:'#f6fffc'},shore:'#f8e8bc',
  music:'m_glass',ambient:{wind:0.4,birds:true,rain:0.1,gulls:0.3,waves:0.5,glint:0.5},critters:['m_hermit'],chests:3,footprints:'sand',events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ const r=rng(); if(r<0.012) return {k:'m_driftglass',v:Math.floor(rng()*2)}; if(r<0.022) return {k:'m_glasscactus',v:Math.floor(rng()*3),s:0.8+rng()*0.3}; if(r<0.04) return {k:'m_dunegrass',v:Math.floor(rng()*3)}; if(r<0.046) return {k:'m_shell',v:Math.floor(rng()*3)}; if(grove>0.3&&r<0.06) return {k:'m_palm',v:Math.floor(rng()*3),s:0.75}; return null; },
  decor(g,rng,x,y,s,r){ if(s.shore>0||!s.sand){ m3wBeachDecor(g,rng,x,y,r); return; }
    if(r<0.006){ // a glass tide pool: a turquoise pool in a ring of shining glass
      const rx=7+rng()*10, ry=4+rng()*5; g.fillStyle='rgba(200,240,250,.9)'; g.beginPath(); g.ellipse(x,y,rx+2.6,ry+2,0,0,TAU); g.fill(); g.fillStyle='#5ed0d8'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x-rx*0.35,y-ry*0.3,rx*0.3,ry*0.18,0,0,TAU); g.fill(); }
    else m3wSandDecor(g,rng,x,y,r); },rgb:m3wDuneRGB});
defineBiome(35,{name:'the Glass Dunes',level:19,col:['#e8bf6c','#eec97a','#dcb15e'],road:'#f6e0ae',roadEdge:'rgba(150,100,50,.8)',water:{shallow:'#8ae2dc',deep:'#3a98c0',lip:'#f6fffc'},shore:'#f2dca8',speed:0.96,
  music:'m_glass',ambient:{wind:0.5,birds:false,rain:0,shimmer:0.6,glint:0.4,sand:0.15},critters:['m_fox'],chests:4,footprints:'sand',events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ if(s.m3&16) return null; const r=rng(); if(r<0.014) return {k:'m_glasscactus',v:Math.floor(rng()*3),s:0.8+rng()*0.4}; if(r<0.03) return {k:'m_dunegrass',v:Math.floor(rng()*3)}; if(grove>0.35&&r<0.045) return {k:'m_glassspike',v:Math.floor(rng()*3),s:0.6+rng()*0.3}; if(r<0.032) return {k:'m_bones',v:Math.floor(rng()*2),s:0.45+rng()*0.2}; return null; },
  decor(g,rng,x,y,s,r){ if(s.m3&16){ if(r<0.05){ g.strokeStyle='rgba(110,80,40,.35)'; g.lineWidth=1.2; g.beginPath(); g.arc(x,y,3+rng()*6,rng()*3,rng()*3+2.5); g.stroke(); } return; } if(s.m3g>0.12){ m3wShard(g,rng,x,y,r,s.m3g); return; } m3wSandDecor(g,rng,x,y,r); },rgb:m3wDuneRGB});
defineBiome(36,{name:'the Shatterfields',level:20,col:['#bdb2cc','#c6bcd6','#b2a6c2'],road:'#e2dcee',roadEdge:'rgba(80,66,110,.8)',water:{shallow:'#5a8ac8',deep:'#1c2e6c',lip:'#e2eaff'},shore:'#d8d0e6',
  music:'m_glass',ambient:{wind:0.6,birds:false,rain:0,glint:0.8,shimmer:0.3},critters:false,chests:3,events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ const r=rng(); if(grove>0.15&&r<0.07) return {k:'m_glassspike',v:Math.floor(rng()*3),s:0.7+rng()*0.4}; if(r<0.025) return {k:'m_crystal',v:Math.floor(rng()*3)}; if(r<0.032) return {k:'m_glassspike',v:Math.floor(rng()*3),s:0.6}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.05){ g.strokeStyle='rgba(120,100,160,.45)'; g.lineWidth=1.1; g.beginPath(); let px=x,py=y,a=rng()*TAU; g.moveTo(px,py); for(let k=0;k<3;k++){ a+=(rng()-0.5)*1.2; px+=Math.cos(a)*(5+rng()*6); py+=Math.sin(a)*(5+rng()*6); g.lineTo(px,py); } g.stroke(); } else if(r<0.07){ g.fillStyle='rgba(255,255,255,.85)'; g.fillRect(x,y,1.5,1.5); } else if(r<0.09) sbPebble(g,x,y,1.4+rng()*1.4,rng()<0.5?'#9a8cbc':'#e6e0f6'); }});
defineBiome(37,{name:'the Oasis of Sable',level:19,col:['#b0c66e','#bace7a','#a4ba62'],road:'#f2dcae',roadEdge:'rgba(150,110,60,.8)',roadW:22,water:{shallow:'#a6eaea',deep:'#5cb0d0',lip:'#f8ffff'},shore:'#e8dcae',
  music:'m_sable',ambient:{wind:0.2,birds:true,rain:0},critters:['m_fox'],chests:1,footprints:'sand',events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ const r=rng(); if(s.sand>0.5){ if(r<0.02) return {k:'m_dunegrass',v:Math.floor(rng()*3)}; if(r<0.026) return {k:'m_palm',v:Math.floor(rng()*3),s:0.8}; return null; } if(r<0.05) return {k:'m_palm',v:Math.floor(rng()*3),s:0.85+rng()*0.3}; if(r<0.07) return {k:'m_seagrass'}; return null; },
  decor(g,rng,x,y,s,r){ if(s.sand>0.5){ m3wSandDecor(g,rng,x,y,r); return; } if(r<0.32) sbTuft(g,x,y,'rgba(110,140,60,.6)',0.8+rng()*0.4); else if(r<0.36) m3wFl(g,rng,x,y,['#f08ab4','#ffd23a','#ffffff'],3); },rgb:m3wDuneRGB});
// the Mirror Flats: salt-glass, not snow. A lilac-white plain of salt polygons, mirror-bright patches that show the sky,
// long bands of sheen, and sparkles
function m3wSaltRGB(c,s,x,y){
  if(s.m3&1024){ const k=clamp(0.5+s.n*1.4,0,1); return mixRGB([28,20,58],[70,54,120],k*0.7); }
  if(s.water||s.road>0.4) return null;
  const k=Math.sin(x*0.0021+y*0.0013+Math.sin(y*0.0011)*1.6), m=Math.sin(x*0.0063-y*0.0047+s.n*3);
  let out=c; if(k>0.55) out=mixRGB(out,[208,224,248],(k-0.55)*1.1); if(m>0.82) out=mixRGB(out,[255,255,255],(m-0.82)*2.4);
  return out;
}
defineBiome(38,{name:'the Mirror Flats',level:20,col:['#d9dcef','#e3e6f5','#cdd1e8'],road:'#dccaa6',roadEdge:'rgba(120,110,130,.8)',roadW:21,water:{shallow:'#7ac0e8',deep:'#22408a',lip:'#ffffff'},shore:'#e8eef6',
  music:'m_night',ambient:{wind:0.2,birds:false,rain:0,shimmer:0.8,glint:1,mirage:1},critters:false,chests:3,events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ if(s.m3&1024) return null; const r=rng(); if(r<0.012) return {k:'m_saltpillar',v:Math.floor(rng()*3)}; if(grove>0.4&&r<0.03) return {k:'m_saltpillar',v:Math.floor(rng()*3),s:1.2}; if(grove>0.5&&r<0.036) return {k:'m_crystal',v:1,s:0.8}; return null; },
  decor(g,rng,x,y,s,r){
    if(s.m3&1024){ if(r<0.05){ g.fillStyle=rng()<0.5?'rgba(220,226,255,.9)':'rgba(170,150,255,.8)'; g.beginPath(); g.arc(x,y,0.8+rng()*1.4,0,TAU); g.fill(); } return; }
    if(r<0.03){ // a salt polygon: the crust cracks into hexagons
      const R=11+rng()*12, a0=rng()*0.5; g.strokeStyle='rgba(132,128,196,.5)'; g.lineWidth=1.3; g.beginPath(); for(let i=0;i<=6;i++){ const a=a0+i/6*TAU, rr=R*(0.85+((i*7)%3)*0.08); if(i) g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*0.62); else g.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*0.62); } g.stroke();
      g.strokeStyle='rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(x+Math.cos(a0+3.6)*R,y+Math.sin(a0+3.6)*R*0.62+1.4); g.lineTo(x+Math.cos(a0+4.6)*R,y+Math.sin(a0+4.6)*R*0.62+1.4); g.stroke(); }
    else if(r<0.04){ // a mirror patch: a puddle of glass that shows the sky
      const rx=10+rng()*16, ry=4+rng()*4; g.fillStyle='rgba(176,206,244,.6)'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill();
      g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(x-rx*0.3,y-ry*0.3,rx*0.35,ry*0.22,0,0,TAU); g.fill(); }
    else if(r<0.05){ g.fillStyle='rgba(255,255,255,1)'; g.beginPath(); g.moveTo(x,y-3.4); g.lineTo(x+1.3,y); g.lineTo(x,y+3.4); g.lineTo(x-1.3,y); g.closePath(); g.fill(); } },
  rgb:m3wSaltRGB});
defineBiome(39,{name:'the Eclipse Heights',level:21,col:['#9c8eb0','#a698ba','#9084a4'],road:'#cfc4de',roadEdge:'rgba(60,46,90,.85)',water:{shallow:'#4a76b8',deep:'#141e58',lip:'#d8e2ff'},shore:'#b8acc8',
  music:'m_night',ambient:{wind:0.8,birds:false,rain:0.1,night:0.08,moths:0.4,glint:0.3},critters:false,chests:2,events:{snow:false,goats:false},
  props(rng,x,y,s,grove){ const r=rng(); if(r<0.02) return {k:'m_crystal',v:Math.floor(rng()*3)}; if(grove>0.3&&r<0.04) return {k:'m_glassspike',v:1,s:0.7}; if(r<0.024) return {k:'m_column',v:Math.floor(rng()*3)}; return null; },
  decor(g,rng,x,y,s,r){
    if(r<0.05){ // a shard of black glass
      const a=rng()*TAU, L=4+rng()*5; g.fillStyle='rgba(54,40,84,.55)'; g.beginPath(); g.moveTo(x+Math.cos(a)*L,y+Math.sin(a)*L*0.6); g.lineTo(x+Math.cos(a+2.3)*L*0.5,y+Math.sin(a+2.3)*L*0.3); g.lineTo(x+Math.cos(a-2.3)*L*0.5,y+Math.sin(a-2.3)*L*0.3); g.closePath(); g.fill();
      g.fillStyle='rgba(220,214,255,.55)'; g.fillRect(x-0.6,y-1.2,1.2,1.2); }
    else if(r<0.08) sbPebble(g,x,y,1.4+rng()*1.6,rng()<0.5?'#6a5c86':'#8a7ca8');
    else if(r<0.1){ g.strokeStyle='rgba(70,56,104,.4)'; g.lineWidth=1.1; g.beginPath(); g.moveTo(x-6,y); g.lineTo(x-1,y-2); g.lineTo(x+5,y+1); g.stroke(); }
    else if(r<0.112){ g.fillStyle='rgba(230,236,255,.9)'; g.fillRect(x,y,1.4,1.4); } }});
const M3W_BIOMES=[30,31,32,33,34,35,36,37,38,39];

// ================= 3. terrain (bible 3.3 to 3.5): the shapes of Moonfall, which region a point belongs to, the sea and
// its shallows, the Reefwall, the Glasswall, the Endless Sea, sand and quicksand
const M3WG={
  // the Glass Desert: outside it is sea; a little bay at the foot of the Eclipse Heights holds the Moon Pier
  land:[[6600,59800],[13750,59800],[13750,65250],[13420,65300],[13340,65450],[13420,65640],[13750,65690],[13750,71200],[6500,71200],[6700,70000],[6500,68500],[6800,67000],[6550,65600],[6700,64000],[6400,62500],[6600,61000]],
  isles:[{x:2000,y:64500,r:200},{x:2600,y:65100,r:180},{x:2300,y:64250,r:150},{x:1000,y:62000,r:380},{x:3200,y:66600,r:520},{x:4800,y:63600,r:300},
    {x:2950,y:63700,r:110},{x:3200,y:63250,r:100},{x:3450,y:62850,r:90},{x:3700,y:62300,r:150},{x:5600,y:61800,r:260},{x:5400,y:68200,r:300},
    {x:1000,y:69400,r:260},{x:1700,y:70200,r:300},{x:2600,y:69500,r:280},{x:3500,y:70300,r:260},{x:4300,y:69500,r:240},{x:5000,y:70500,r:220},
    {x:5850,y:65600,r:220},{x:3600,y:64900,r:70},{x:4600,y:65300,r:70},{x:5500,y:65500,r:70},{x:9800,y:67650,r:60}],
  spire:[3700,62300], gate:{x:6250,y:65600}, sandbank:[5850,65600,220],
  reef:{x0:6100,x1:6350,gy:65600}, coral:[1900,67600],
  lagoon:[1300,63600,3100,65800], shoals:[2800,62100,3900,63900], mangrove:[600,68800,5200,71000],
  glassA:[10700,65000,11100,71200], glassB:[10900,64900,11950,65400], gap:{x:10900,y:67200,x0:10690,y0:67130,x1:11110,y1:67270},
  pans:[[8600,64600,220],[9300,69800,260],[10200,61800,200]], mouth:[10600,62900,300,140],
  pier:{x0:13330,y0:65400,x1:13780,y1:65500}, pool:[9800,67650,220],
  heights:[11800,62800,13750,65200], flats:[10900,65200,13750,71200]
};
M3WG.landP=m3wPoly(M3WG.land);
// ---------- regions: the bible's boxes, with a little noise on the borders (the Heights follow the cliff exactly)
function m3wRegion(x,y,n){
  const wx=x+n*220, wy=y+n*170;
  if(x<6100+n*30){
    if(wy>68800) return 33;
    const L=M3WG.lagoon; if(wx>L[0]&&wx<L[2]&&wy>L[1]&&wy<L[3]) return 30;
    if(wy<62200&&m3wD2(x,y,1000,62000)>760*760) return 32;
    return 31;
  }
  if(x<6352) return 31;
  if(m3wD2(x,y,9800,67600)<(650+n*80)**2) return 37;
  if(x>=11800&&y>=62800&&y<=65200) return 39;
  if(x>12300&&y>65200&&y<65640+n*60) return 39;
  if(wx>11400&&wy<62800) return 36;
  if(x>10900&&y>65200) return 38;
  if(wx<7800) return 34;
  return 35;
}
// soft borders between regions (the ground colours mix over about 40 px each side, like the Voronoi borders of the
// other maps): four cheap probes first, and only near a border three closer rings to find how near it is
const M3W_BQ=[[1,0],[-1,0],[0,1],[0,-1]];
function m3wBlend(x,y,n,b,o){
  let b2=-1;
  for(let i=0;i<4;i++){ const r=m3wRegion(x+M3W_BQ[i][0]*44,y+M3W_BQ[i][1]*44,n); if(r!==b){ b2=r; break; } }
  if(b2<0) return;
  let d=44;
  outer: for(const s of [12,24,34]) for(let i=0;i<4;i++){ if(m3wRegion(x+M3W_BQ[i][0]*s,y+M3W_BQ[i][1]*s,n)!==b){ d=s; break outer; } }
  o.b2=b2; o.t=0.5+0.5*clamp((d-4)/44,0,1);
}
// ---------- the shallows of the west (Water Stride and the Skimmer work; everything else out there is deep)
const M3W_CH2=[150*150,300*300];   // the deep channel round the Lumen Spire's base
function m3wChannel(x,y){ const d=m3wD2(x,y,M3WG.spire[0],M3WG.spire[1]); return d>M3W_CH2[0]-400&&d<M3W_CH2[1]; }
// how shallow the sea is here (0 deep .. 1 shallow, soft over the last 140 px of each shallow area); Water Stride
// walks where it is over 0.45, so what looks shallow is shallow
function m3wShallowK(x0,y0,n){
  if(x0>6350) return x0<7200?1:0;
  if(n==null) n=fbm(x0*0.004,y0*0.004,3);
  const x=x0+n*300, y=y0+n*240, sb=d=>clamp(d/140,0,1), L=M3WG.lagoon, wob=Math.sin(x*0.004+y*0.003)*60;
  let k=sb(Math.min(x-(L[0]-wob),(L[2]+wob)-x,y-(L[1]+wob),(L[3]-wob)-y));
  if(k>=1) return 1;
  const S=M3WG.shoals; if(x>S[0]-10&&x<S[2]+10&&y>S[1]-10&&y<S[3]+10){ let q=sb(Math.min(x-S[0],S[2]-x,y-S[1],S[3]-y)+70); const d=Math.sqrt(m3wD2(x0,y0,M3WG.spire[0],M3WG.spire[1])); if(d<330) q=Math.min(q,clamp((d-290)/40,0,1)); k=Math.max(k,q); }
  k=Math.max(k,sb(820-Math.sqrt(m3wD2(x0,y0,3200,66600))+n*160),sb(680-Math.sqrt(m3wD2(x0,y0,1000,62000))+n*160));
  const M=M3WG.mangrove; if(x>M[0]-140&&x<M[2]+140&&y>M[1]-140) k=Math.max(k,sb(Math.min(x-M[0],M[2]-x,y-M[1])+70));
  const c=Math.sqrt(m3wD2(x0,y0,M3WG.coral[0],M3WG.coral[1])); if(c<560) k=Math.max(k,clamp(Math.min(c-200,420-c)/60+0.5,0,1));
  return k;
}
const m3wShallow=(x,y,n)=>m3wShallowK(x,y,n)>0.45;
// ---------- the coastline: the bible's land polygon with a noisy shore, straight and calm by the Moon Pier and the
// Endless Sea in the east (the pier and the moonfire bridge leave from a clean edge)
let M3WSDF=null;
function m3wLandD(x,y){
  if(!M3WSDF) M3WSDF=polySDF(M3WG.land,MAPS[3],80);
  const d=sdfAt(M3WSDF,x,y), A=90;
  if(d>A*1.3+260||d<-A*1.3-500) return d;
  const k=x>13100?clamp((13500-x)/400,0.12,1):1;
  return d+(fbm(x*0.0022+17,y*0.0022-5,3)*A+fbm(x*0.012,y*0.012,2)*A*0.12)*k;
}
// ---------- the Reefwall (x 6100..6350, noisy, straight at the Sunken Gate) and the Glasswall (jagged glass spikes)
function m3wReefIn(x,y){
  const R=M3WG.reef, k=clamp((Math.abs(y-R.gy)-90)/140,0,1), w1=(Math.sin(y*0.013)*0.6+Math.sin(y*0.031+1.7)*0.4)*40*k, w2=(Math.sin(y*0.011+2.2)*0.6+Math.sin(y*0.027+0.4)*0.4)*40*k;
  return x>R.x0+w1&&x<R.x1+w2;
}
function m3wGlassIn(x,y){
  const A=M3WG.glassA, B=M3WG.glassB, saw=(Math.abs(((y*0.031)%2+2)%2-1)-0.5)*26, sawx=(Math.abs(((x*0.029)%2+2)%2-1)-0.5)*22;
  if(y>A[1]&&y<A[3]&&x>A[0]+saw&&x<A[2]-saw) return true;
  if(x>B[0]&&x<B[2]&&y>B[1]+sawx&&y<B[3]-sawx) return true;
  return false;
}
// the Silver Rift: a ring-shaped crack in the Mirror Flats round a little island of glass (a moon-glass bridge crosses it)
function m3wRiftIn(x,y){
  const R=M3W_RIFT, dx=x-R.x, dy=y-R.y, d2=dx*dx+dy*dy; if(d2<(R.r0*0.9)**2||d2>(R.r1*1.1)**2) return false;
  const a=Math.atan2(dy,dx), d=Math.sqrt(d2); return d>R.r0*(1+0.07*Math.sin(a*5+1))&&d<R.r1*(1+0.05*Math.sin(a*4)+0.03*Math.sin(a*9));
}
function m3wBlock(x,y){
  if(x>6040&&x<6420&&m3wReefIn(x,y)) return true;
  if(y>69950&&y<70650&&x>12600&&x<13300&&m3wRiftIn(x,y)) return true;
  if(y>64850&&x>10660&&x<11990&&m3wGlassIn(x,y)) return true;
  if(x>13700){ const P=M3WG.pier; return !(y>P.y0-2&&y<P.y1+2&&x<P.x1+6); }
  return false;
}
// ---------- quicksand: three pans and the ring round the Worm Mouth (inner dune safe)
function m3wSinkAt(x,y){
  for(const p of M3WG.pans){ const dx=x-p[0], dy=y-p[1]; if(dx*dx+dy*dy<p[2]*p[2]*(1+0.12*Math.sin(Math.atan2(dy,dx)*5+p[0]))) return 1; }
  const M=M3WG.mouth, d=m3wD2(x,y,M[0],M[1]); if(d<M[2]*M[2]&&d>M[3]*M[3]) return 2;
  return 0;
}
// ---------- the per-sample hook: region, shallows, the reef, sand, glass, quicksand (writes every field every sample)
// footprints of built things standing in the water: solid ground in their own colour (the plateau tops show it)
const M3W_SOLID=[{rect:[3586,62296,3814,62486],disc:[3700,62200,116],col:[226,224,238]},{rect:[2254,64630,2346,64706],col:[178,140,92]}];
function m3wSolid(x,y){ for(let i=0;i<M3W_SOLID.length;i++){ const s=M3W_SOLID[i]; if(s.rect&&m3wInR(s.rect,x,y)) return i+1; if(s.disc&&m3wD2(x,y,s.disc[0],s.disc[1])<s.disc[2]*s.disc[2]) return i+1; } return 0; }
function m3wExtra(x,y,o){
  o.sink=0; o.sinkDeep=0; o.m3=0; o.m3c=0; o.m3g=0;
  if(x>2200&&x<3830&&y>62080&&y<64720){ const si=m3wSolid(x,y); if(si){ o.m3c=si; o.m3=512; o.b=31; o.b2=31; o.t=1; o.water=0; o.depth=0; o.sea=0; o.deep=0; o.seaD=0; o.shore=0; o.bridge=0; o.road=0; return; } }
  const b=m3wRegion(x,y,o.n); o.b=b; o.b2=b; o.t=1; m3wBlend(x,y,o.n,b,o);
  if(x<6450){
    if(x>6040&&m3wReefIn(x,y)){ o.m3=1; o.water=0; o.depth=0; o.sea=0; o.deep=0; o.seaD=0; o.shore=0; o.bridge=0; o.road=0; return; }
    if(o.water){
      const k=m3wShallowK(x,y,o.n), dd=Math.min(1,o.seaD*(b===32?1:0.6));
      if(k>0.5){ o.m3|=8; if(m3wD2(x,y,M3WG.coral[0],M3WG.coral[1])<430*430) o.m3|=64; o.deep=0; }
      else if(m3wChannel(x,y)) o.m3|=32;
      if(k>0){ const sh=0.3+0.12*clamp(o.n+0.5,0,1); o.depth=lerp(o.depth,Math.min(o.depth,sh),k); o.seaD=dd*(1-k); } else o.seaD=dd;
    }
    return;
  }
  if(o.water){
    if(x<7300){ o.m3|=8; o.deep=0; o.seaD=0; o.depth=Math.min(o.depth,0.34); }
    else if(x>13000){ o.seaD=Math.max(o.seaD,x>13760?0.75:0.2); }
    return;
  }
  if(y>64850&&x>10660&&x<11990&&m3wGlassIn(x,y)){ o.m3|=4; return; }
  if(Math.abs(y-M3WG.gap.y)<84&&x>10440&&x<11360){ o.m3|=128; o.sand=1; return; }
  const sk=b===35||b===37||b===34?m3wSinkAt(x,y):0;
  if(sk){ o.sink=1; o.m3|=16; o.sand=1; return; }
  // glass streaks across the dunes (long soft bands where the moon's light fell; not sand: Burrow stops there)
  if(b===35){ const k=Math.max(Math.sin(x*0.0016+y*0.0023+o.n*0.7),Math.sin(x*0.0021-y*0.0012+o.n*0.6+1.3));
    if(k>0.987){ o.m3g=clamp((k-0.987)/0.009,0,1); if(k>0.996){ o.m3|=2; return; } } o.sand=1; return; }
  if(b===34){ if(o.shore<=0.05) o.sand=clamp(1-o.shore*4,0,1); return; }
  if(b===37){ const d=m3wD2(x,y,9800,67600); if(d>430*430) o.sand=clamp((Math.sqrt(d)-430)/60,0,1); return; }
  if(b===38||b===39){ o.m3|=256; if(y>69950&&y<70650&&x>12600&&x<13300&&m3wRiftIn(x,y)) o.m3|=1024; }
}
// ---------- the roads (bible 3.5, moved a little where a face or the Glasswall would cut them)
const M3W_RING=(()=>{ const P=[]; for(let i=0;i<=20;i++){ const a=i/20*TAU; P.push([Math.round(9800+Math.cos(a)*305),Math.round(67650+Math.sin(a)*290)]); } return P; })();
const M3WROADS=[
  [[6900,65600],[7800,66200],[8800,67000],[9200,67500],[9505,67610]],              // the Caravan Road (into Sable's ring)
  [[9800,67360],[9800,67000],[10000,66000],[10300,64600],[10560,63260]],            // the North Road to the Worm Mouth
  [[10100,67620],[10400,67600],[10670,67260]],                                     // the East Road (dead-ends at the Glasswall)
  [[11130,67260],[11800,67800],[12300,68060]],                                     // the Salt Road: the Burrow Gap to the Mirror Temple
  [[12300,68060],[12500,66500],[12600,65470]],                                     // the Salt Road: the temple to the Moonpath foot
  [[12600,65470],[13000,65490],[13330,65455]],                                     // the Pier Road
  [[6900,65600],[7000,64000],[7050,62500]],                                        // the Strand Road
  M3W_RING                                                                         // Sable's ring street round the pool
];
// raft decks (Driftwood Landing), the plank way to Palmcrest, the Moon Pier, Sable's footbridge, the mangrove roots
const M3WRAFT=[
  {id:'town',r:[1950,64550,2650,64950]},{id:'dock',r:[1050,64720,1950,64880]},{id:'r1',r:[1700,64300,1950,64450]},{id:'r2',r:[2650,64650,2950,64800]},
  {id:'r3',r:[2350,64950,2500,65200]},{id:'wini',r:[1980,64930,2140,65110]},{id:'r4',r:[1560,64480,1760,64640]},{id:'r5',r:[2700,64400,2900,64560]},
  {id:'r6',r:[1700,64960,1880,65120]},{id:'r7',r:[2200,65150,2360,65300]},{id:'read',r:[2500,64940,2680,65070]},
  {id:'p1',r:[1880,64440,1930,64562],plank:1},{id:'p2',r:[1640,64630,1690,64730],plank:1},{id:'p3',r:[2640,64520,2710,64572],plank:1},{id:'p4',r:[1860,64940,1962,64990],plank:1},
  {id:'p5',r:[2445,65195,2492,65560],plank:1},{id:'p6',r:[2445,65520,2760,65568],plank:1},{id:'p7',r:[2712,65520,2760,65905],plank:1},
  {id:'b1',r:[2700,65900,2800,65962],plank:1},{id:'b2',r:[2700,66092,2800,66370],plank:1},
  // a plank way up to the north anchor isle (Glaciar's napping spot), and the three ferry jetties (Rowan's posts)
  {id:'p8',r:[2236,64372,2284,64556],plank:1},
  {id:'fdw',r:[2900,64724,3018,64776],plank:1},{id:'fst',r:[6532,65724,6650,65776],plank:1},{id:'fpc',r:[3274,66042,3326,66160],plank:1}
];
const M3WWALK=[].concat(M3WRAFT.map(R=>({x0:R.r[0],y0:R.r[1],x1:R.r[2],y1:R.r[3],draw:false})),[
  {x0:13330,y0:65400,x1:13780,y1:65500,draw:false,kind:'stone'},
  {x0:3586,y0:62296,x1:3814,y1:62486,draw:false},                                // the Lumen Spire's balcony                 // the Moon Pier (Lumen's old landing stage)
  {x0:9781,y0:67700,x1:9819,y1:67885,kind:'wood'}                                  // Sable's footbridge to the Moon Well
]);
// the mangrove root walkways: chains of small walkable boxes along each span (painted as roots)
const M3WROOTS=[[[1000,69400],[1700,70200]],[[1700,70200],[2600,69500]],[[2600,69500],[3500,70300]],[[3500,70300],[4300,69500]],[[4300,69500],[5000,70500]]];
for(const [a,b] of M3WROOTS){ const L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.ceil(L/36); for(let i=0;i<=n;i++){ const x=lerp(a[0],b[0],i/n), y=lerp(a[1],b[1],i/n); M3WWALK.push({x0:x-24,y0:y-24,x1:x+24,y1:y+24,draw:false,m3root:1}); } }
const M3WSEEDS=[[2000,64600,30],[3000,62400,31],[1800,61000,32],[3000,69800,33],[7000,65000,34],[8800,64000,35],[12600,61400,36],[9800,67600,37],[12300,68400,38],[12800,64000,39]];

// ================= 4. standing things of Moonfall: drawn sorted with the figures (so Ash walks behind a tower), each body
// painted once into a cached outlined sprite, only the live parts (lamps, beams, bobbing, glints) per frame
function m3wObj(k,x,y,o){
  o=Object.assign({k,x,y},o||{}); const D=M3WK[k]||{};
  o.R=o.R||D.R||60; o.base=o.base!=null?o.base:y+(D.by||0);
  if(D.col&&o.col!==false){ const c=typeof D.col==='function'?D.col(o):D.col; for(const q of [].concat(c)) if(q) o.colRef=addCol(Object.assign({},q,q.t==='r'?{x0:x+q.x0,y0:y+q.y0,x1:x+q.x1,y1:y+q.y1}:{x:x+(q.dx||0),y:y+(q.dy||0)})); }
  if(D.light) for(const L of [].concat(D.light(o))) LIGHTS.push(L);
  M3WD.objs.push(o); const key=Math.floor((o.bx!=null?o.bx:x)/M3WD.bs)+'|'+Math.floor((o.by!=null?o.by:y)/M3WD.bs); let b=M3WD.bk.get(key); if(!b) M3WD.bk.set(key,b=[]); b.push(o);
  return o;
}
// the standing things within r of a point (bucket lookup)
function m3wObjNear(x,y,r){ const s=M3WD.bs, i0=Math.floor((x-r-90)/s), i1=Math.floor((x+r+90)/s), j0=Math.floor((y-r-90)/s), j1=Math.floor((y+r+90)/s); for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const b=M3WD.bk.get(i+'|'+j); if(!b) continue; for(const o of b){ if(o.k==='bunting') continue; const rr=(o.k==='prop'||o.k==='lamp'||o.k==='flame'?30:Math.min(90,o.R*0.6))+r; if(m3wD2(x,y,o.x,o.y)<rr*rr) return o; } } return null; }
function m3wObjsInView(fn){
  const s=M3WD.bs, x0=Math.floor((cam.x-300)/s), x1=Math.floor((cam.x+W/zoom+300)/s), y0=Math.floor((cam.y-200)/s), y1=Math.floor((cam.y+H/zoom+700)/s);
  for(let i=x0;i<=x1;i++) for(let j=y0;j<=y1;j++){ const b=M3WD.bk.get(i+'|'+j); if(b) for(const o of b) fn(o); }
}
const m3wNight=()=>G&&daylight()<0.45;
const m3wBites=()=>typeof bitesOf==='function'?bitesOf():0;
// a lantern is lit at night; the town lanterns marked `bite` light one more for each bite out of the moon (THREADS 4.3)
function m3wLampOn(o){ if(!m3wNight()) return false; if(o.bite&&m3wBites()<o.bite) return false; if(o.sable&&m3wF('m_eclipse2')&&!m3wF('m_lamps12')) return false; return true; }
const M3WC={marble:'#e8e6f0',marbleD:'#b8b4cc',moon:'#c8d8ff',wood:'#8e6a40',woodD:'#6a4a2c',rope:'#d8c8a0',brass:'#d8a440',brassD:'#a07428',sail:'#f6efe0',red:'#d8503a',teal:'#3a9aa8',glass:'#bfe8f4'};
const M3WK={
  lamp:{R:50,by:0,col:{t:'c',r:5},light:o=>({x:o.x,y:o.y-34,r:o.v===2?190:170,get i(){ return m3wLampOn(o)?(o.v===2?0.75:0.7):0; },night:true,fire:o.v!==2}),
    draw(o,t){ const on=m3wLampOn(o); m3wPut(m3wTall('lamp'+(o.v||0)+(on?1:0),22,56,11,52,g=>m3wLampArt(g,on,o.v||0)),o.x,o.y+(o.bob?Math.sin(t*1.4+o.x)*1.2:0));
      if(on){ const c=o.v===2?'200,214,255':'255,214,130'; glowAt(o.x+(o.v===1?6:0),o.y-32,30,c,0.5); glowAt(o.x+(o.v===1?6:0),o.y-32,9,o.v===2?'240,246,255':'255,246,200',0.7); } }},
  prop:{R:50,by:2,col:o=>{ const K=PROPK[o.pk]; return K&&K.col&&o.col!==false?{t:'c',r:K.col.r*(o.s||1),low:!!K.col.low}:null; },
    draw(o,t){ drawSprite(propSprite({k:o.pk,v:o.v||0}),o.x,o.y+(o.bob?Math.sin(t*1.3+o.x*0.1)*1.1:0),o.s||1,0); }},
  barrel:{R:20,by:2,col:{t:'c',r:9,low:true},draw(o,t){ m3wPut(m3wTall('barrel'+(o.v||0),26,30,13,22,g=>{ m3wEll(g,2,5,9,3.6,'rgba(40,30,20,.3)'); celFill(g,(q,dx,dy)=>q.ellipse(dx,dy,8,10,0,0,TAU),o.v?'#8a5a32':'#7a5634',{r:9}); m3wEll(g,0,-7,7,3,'#a07a4a'); m3wEll(g,0,-7,5,1.8,'#6a4a2c'); g.strokeStyle='#c8963a'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-8,-2); g.quadraticCurveTo(0,1,8,-2); g.moveTo(-7.4,4); g.quadraticCurveTo(0,7,7.4,4); g.stroke(); }),o.x,o.y+(o.bob?Math.sin(t*1.5+o.x)*1:0)); }},
  crate:{R:20,by:2,col:{t:'c',r:10,low:true},draw(o){ m3wPut(m3wTall('crate'+(o.v||0),28,30,14,22,g=>{ m3wEll(g,3,6,10,4,'rgba(40,30,20,.3)'); m3wShade(g,-9,-10,18,16,o.v?'#a07a4a':'#8e6a40'); g.strokeStyle='#5a3e22'; g.lineWidth=1.3; g.strokeRect(-9,-10,18,16); g.beginPath(); g.moveTo(-9,-10); g.lineTo(9,6); g.stroke(); m3wRect(g,-9,-12,18,3,o.v?'#b88a5a':'#a07a4a'); if(o.fish){ m3wEll(g,-2,-13,6,2.4,'#9ab8c8'); m3wEll(g,4,-13.5,5,2.2,'#c8d8e0'); } }),o.x,o.y); }},
  net:{R:30,by:2,col:{t:'c',r:6},draw(o,t){ m3wPut(m3wTall('net',56,50,28,44,g=>{ m3wEll(g,4,4,18,4,'rgba(40,30,20,.3)'); for(const sx of [-14,14]) m3wShade(g,sx-2,-24,4,26,'#7a5634');
      g.strokeStyle='#5a4428'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-14,-22); g.lineTo(14,-22); g.stroke();
      g.strokeStyle='rgba(60,110,110,.9)'; g.lineWidth=1; for(let i=0;i<=6;i++){ const x=-13+i*4.3; g.beginPath(); g.moveTo(x,-22); g.quadraticCurveTo(x+1,-12,x,-5); g.stroke(); } for(let j=0;j<4;j++){ const y=-19+j*4; g.beginPath(); g.moveTo(-13,y); g.quadraticCurveTo(0,y+3,13,y); g.stroke(); }
      m3wEll(g,8,-13,2.6,2.6,'#e8a040'); m3wEll(g,-6,-9,2.2,2.2,'#e8a040'); }),o.x,o.y); }},
  // a string of bunting between two posts (the flags flutter)
  bunting:{R:120,by:0,col:false,draw(o,t){ const a={x:o.x,y:o.y}, b={x:o.x2,y:o.y2}, n=Math.max(4,Math.round(Math.hypot(b.x-a.x,b.y-a.y)/26)), cols=['#e8503a','#f4d040','#3a9ad8','#ffffff','#7ac04a','#e86ab0'];
    if(!inView((a.x+b.x)/2,(a.y+b.y)/2,Math.abs(b.x-a.x)/2+160)) return;
    ctx.save(); for(const p of [a,b]){ ctx.fillStyle=SBC.outline; ctx.fillRect(p.x-2.6,p.y-50,5.2,52); ctx.fillStyle='#8e6a40'; ctx.fillRect(p.x-1.4,p.y-49,2.8,50); }
    ctx.strokeStyle='#e8e2d2'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(a.x,a.y-46); ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-30,b.x,b.y-46); ctx.stroke();
    for(let i=1;i<n;i++){ const k=i/n, x=lerp(a.x,b.x,k), y=lerp(a.y,b.y,k)-46+Math.sin(k*Math.PI)*16, sw=Math.sin(t*3+i)*1.6; ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.moveTo(x-5.4,y-1); ctx.lineTo(x+5.4,y-1); ctx.lineTo(x+sw,y+11); ctx.closePath(); ctx.fill(); ctx.fillStyle=cols[(i+(o.v||0))%cols.length]; ctx.beginPath(); ctx.moveTo(x-4,y); ctx.lineTo(x+4,y); ctx.lineTo(x+sw,y+9); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }},
  buoy:{R:30,by:2,col:false,draw(o,t){ const b=Math.sin(t*2+o.x)*1.5; m3wPut(m3wTall('buoy'+(o.v||0),30,40,15,30,g=>{ m3wEll(g,0,2,9,4,'rgba(255,255,255,.4)'); celFill(g,(q,dx,dy)=>q.ellipse(dx,dy-6,7,9,0,0,TAU),o.v?'#f0c040':'#e0503a',{r:8}); m3wRect(g,-7,-8,14,4,'#fff6e6'); m3wRect(g,-1,-22,2,8,'#5a5e68'); }),o.x,o.y+b); }},
  skiff:{R:60,by:0,col:false,draw(o,t){ const b=Math.sin(t*1.3+o.x)*1.6, r=Math.sin(t*0.9+o.y)*0.04; ctx.save(); ctx.translate(o.x,o.y+b); ctx.rotate((o.a||0)+r);
    ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(0,5,40,13,0,0,TAU); ctx.fill();
    ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(0,0,33,12,0,0,TAU); ctx.fill(); ctx.fillStyle=o.c||'#c8503a'; ctx.beginPath(); ctx.ellipse(0,0,31,10.5,0,0,TAU); ctx.fill(); ctx.fillStyle='#8e6a40'; ctx.beginPath(); ctx.ellipse(0,-1,26,7,0,0,TAU); ctx.fill();
    ctx.fillStyle='#6a4a2c'; ctx.fillRect(-4,-7,3,13); ctx.fillRect(8,-7,3,13);
    if(o.sail){ ctx.fillStyle=SBC.outline; ctx.fillRect(-2,-46,4,46); ctx.fillStyle='#f6efe0'; ctx.beginPath(); ctx.moveTo(2,-44); ctx.lineTo(26,-10); ctx.lineTo(2,-8); ctx.closePath(); ctx.fill(); ctx.strokeStyle=SBC.outline; ctx.lineWidth=1.4; ctx.stroke(); ctx.fillStyle=o.c||'#c8503a'; ctx.fillRect(2,-44,8,6); }
    ctx.restore(); }},
  // the Lumen Spire's top: a slim white moon-marble tower rising from the plateau, round moon windows, a silver dome
  spire:{R:330,by:0,col:false,draw(o,t){ m3wPut(m3wTall('spire',200,380,100,330,g=>{
      celFill(g,(q,dx,dy)=>{ q.moveTo(-46+dx,-130+dy); q.lineTo(-30+dx,-262+dy); q.lineTo(30+dx,-262+dy); q.lineTo(46+dx,-130+dy); q.closePath(); },M3WC.marble,{r:40,tones:['#ffffff','#e8e6f0','#b8b4cc']});
      for(let i=0;i<3;i++){ const y=-150-i*40; m3wEll(g,0,y,8,8,SBC.outline); m3wEll(g,0,y,6.4,6.4,'#8ab0e8'); m3wEll(g,-1.6,y-1.6,2,2,'#ffffff'); }
      m3wRect(g,-36,-272,72,12,'#c8c4dc',3);
      celFill(g,(q,dx,dy)=>{ q.moveTo(-32+dx,-268+dy); q.quadraticCurveTo(dx,-330+dy,32+dx,-268+dy); q.closePath(); },'#c8d8f4',{r:28,tones:['#ffffff','#c8d8f4','#8a9ac8']});
      g.strokeStyle='#e8c060'; g.lineWidth=2.4; g.beginPath(); g.moveTo(0,-318); g.lineTo(0,-336); g.stroke(); g.fillStyle='#e8c060'; g.beginPath(); g.arc(4,-338,5,0.6,TAU-0.6); g.fill(); }),o.x,o.y);
    const k=0.5+0.5*Math.sin(t*1.6); if(m3wNight()) for(let i=0;i<3;i++) glowAt(o.x,o.y-150-i*40,14,'170,200,255',0.4+0.2*k); glowAt(o.x+4,o.y-338,10,'255,230,150',0.3); }},
  // the Gull Isle lighthouse: the tower is elevation (a level 3 climbable face); this is the lamp room on its top. The
  // great lamp, its six oil lamps, the moths and the beam are x3_people's (m_lighthouse); without it the world shows them
  lighthouse:{R:200,by:0,col:false,light:o=>({x:o.x,y:o.y-40,r:520,get i(){ return m3wF('m_lighthouse_lit')&&typeof m3pDrawLH!=='function'?0.95:0; },night:true}),
    draw(o,t){ const lit=m3wF('m_lighthouse_lit'), nt=m3wNight();
      if(typeof m3pDrawLH==='function'){ m3wPut(m3wTall('lhcap',110,110,55,70,g=>{ m3wRect(g,-36,-6,72,10,'#3a3a44',2); for(let i=-30;i<=30;i+=10) m3wRect(g,i-1,-18,2,14,'#5a5e68'); m3wRect(g,-36,-20,72,4,'#5a5e68',1);
        g.fillStyle='#d24a3a'; g.beginPath(); g.moveTo(-30,-62); g.lineTo(0,-90); g.lineTo(30,-62); g.closePath(); g.fill(); g.fillStyle='#e86a5a'; g.beginPath(); g.moveTo(-30,-62); g.lineTo(0,-90); g.lineTo(0,-62); g.closePath(); g.fill(); m3wEll(g,0,-92,4,4,M3WC.brass);
        for(const s of [-1,1]) m3wRect(g,s*26-2,-62,4,44,'#2a2a34',1); }),o.x,o.y); return; }
      m3wPut(m3wTall('lhroom',110,110,55,70,g=>{ m3wRect(g,-36,-6,72,10,'#3a3a44',2); for(let i=-30;i<=30;i+=10) m3wRect(g,i-1,-18,2,14,'#5a5e68'); m3wRect(g,-36,-20,72,4,'#5a5e68',1);
        m3wRect(g,-24,-56,48,40,'#2a2a34',4); m3wRect(g,-20,-52,40,32,'#dce6f4',3); g.fillStyle='rgba(120,140,190,.45)'; g.fillRect(-20,-52,14,32);
        g.fillStyle='#d24a3a'; g.beginPath(); g.moveTo(-30,-56); g.lineTo(0,-84); g.lineTo(30,-56); g.closePath(); g.fill(); g.fillStyle='#e86a5a'; g.beginPath(); g.moveTo(-30,-56); g.lineTo(0,-84); g.lineTo(0,-56); g.closePath(); g.fill(); m3wEll(g,0,-86,4,4,M3WC.brass); }),o.x,o.y);
      if(lit){ glowAt(o.x,o.y-36,nt?60:26,'210,224,255',nt?0.8:0.35); glowAt(o.x,o.y-36,14,'255,255,255',0.9);
        if(nt){ const a=t*0.5; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.translate(o.x,o.y-36); ctx.rotate(a); const gr=ctx.createLinearGradient(0,0,720,0); gr.addColorStop(0,'rgba(210,224,255,.4)'); gr.addColorStop(1,'rgba(210,224,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(720,-80); ctx.lineTo(720,80); ctx.lineTo(0,8); ctx.closePath(); ctx.fill(); ctx.restore(); } }
      else{ // moths crowd the dark lamp
        for(let i=0;i<5;i++){ const a=t*1.4+i*1.26, r=16+Math.sin(t*2+i)*6; ctx.fillStyle='rgba(220,214,240,.9)'; const mx=o.x+Math.cos(a)*r, my=o.y-36+Math.sin(a)*r*0.6; ctx.beginPath(); ctx.ellipse(mx-2,my,2.4,1.6,0.4,0,TAU); ctx.ellipse(mx+2,my,2.4,1.6,-0.4,0,TAU); ctx.fill(); } } }},
  // the Moon Well on its islet: a slim white tower with a basin of moonlight (dim after the second eclipse)
  well:{R:220,by:4,col:{t:'c',r:26},light:o=>({x:o.x,y:o.y-150,r:300,get i(){ return m3wF('m_eclipse2')?0.25:0.85; },night:true}),
    draw(o,t){ const dim=m3wF('m_eclipse2');
      m3wPut(m3wTall('well',120,250,60,232,g=>{ m3wEll(g,0,6,34,10,'rgba(40,40,80,.3)'); m3wShade(g,-30,-14,60,20,'#d6d4e2',6);
        celFill(g,(q,dx,dy)=>{ q.moveTo(-18+dx,-10+dy); q.lineTo(-12+dx,-150+dy); q.lineTo(12+dx,-150+dy); q.lineTo(18+dx,-10+dy); q.closePath(); },M3WC.marble,{r:16,tones:['#ffffff','#e8e6f0','#b8b4cc']});
        for(let i=0;i<4;i++){ const y=-34-i*30; m3wRect(g,-6,y-10,12,10,'#7a9ad8',5); m3wRect(g,-4,y-8,4,6,'#e8f0ff',2); }
        m3wRect(g,-26,-160,52,10,'#c8c4dc',3); celFill(g,(q,dx,dy)=>q.ellipse(dx,-160+dy,26,9,0,0,Math.PI),'#b8b4cc',{r:20}); m3wEll(g,0,-161,22,7,'#9aa8d8'); }),o.x,o.y);
      const k=0.5+0.5*Math.sin(t*1.3), nk=0.35+0.65*clamp((0.75-daylight())/0.35,0,1), a=(dim?0.18+0.06*k:0.55+0.15*k)*nk;
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=`rgba(200,220,255,${a})`; ctx.beginPath(); ctx.ellipse(o.x,o.y-161,20,6,0,0,TAU); ctx.fill(); ctx.restore();
      glowAt(o.x,o.y-162,dim?24:46,'210,224,255',a);
      if(!dim&&Math.random()<0.15) emit(o.x+rand(-16,16),o.y-164,1,{col:'220,230,255',ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:1,lmax:2,zmin:1,zmax:2}); }},
  // Old Kiln's glass furnace: a domed brick kiln with a round mouth (it turns silver once tempered with Moonfire)
  furnace:{R:90,by:6,col:{t:'c',r:30},light:o=>({x:o.x,y:o.y-20,r:200,get i(){ return 0.7; },fire:true}),
    draw(o,t){ const sil=m3wF('m_glaive_temper')||o.heat>0;
      m3wPut(m3wTall('furn'+(sil?1:0),110,110,55,80,g=>{ m3wEll(g,0,6,42,11,'rgba(40,30,30,.3)');
        celFill(g,(q,dx,dy)=>{ q.moveTo(-38+dx,4+dy); q.quadraticCurveTo(-40+dx,-62+dy,dx,-64+dy); q.quadraticCurveTo(40+dx,-62+dy,38+dx,4+dy); q.closePath(); },sil?'#b8c0dc':'#b0664a',{r:36});
        g.strokeStyle=sil?'rgba(90,96,130,.5)':'rgba(90,40,30,.45)'; g.lineWidth=1; for(let y=-50;y<0;y+=10){ g.beginPath(); g.moveTo(-36+Math.abs(y)*0.1,y); g.lineTo(36-Math.abs(y)*0.1,y); g.stroke(); }
        m3wEll(g,0,-18,16,14,SBC.outline); m3wEll(g,0,-18,13.5,11.5,'#2a1410'); m3wShade(g,-6,-80,12,18,sil?'#8a90b0':'#7a4a3a'); m3wRect(g,-8,-82,16,4,'#5a5e68',1); }),o.x,o.y);
      const k=0.6+0.4*Math.sin(t*5+Math.sin(t*13));
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=sil?`rgba(210,224,255,${0.7*k})`:`rgba(255,150,60,${0.75*k})`; ctx.beginPath(); ctx.ellipse(o.x,o.y-18,12,10,0,0,TAU); ctx.fill(); ctx.restore();
      glowAt(o.x,o.y-18,30,sil?'210,224,255':'255,150,70',0.4*k);
      if(Math.random()<0.25) emit(o.x+rand(-4,4),o.y-82,1,{col:'150,140,140',glow:false,ang:-Math.PI/2,spread:0.4,smin:15,smax:40,lmin:1.6,lmax:2.6,zmin:4,zmax:8,grow:10,drag:0.4,alpha:0.6}); }},
  // the Sunken Galleon on its side against the Reefwall, a hole in its hull below the waterline
  galleon:{R:200,by:20,col:false,draw(o,t){ m3wPut(m3wTall('galleon',320,230,160,170,g=>{
      m3wEll(g,0,16,150,26,'rgba(20,50,80,.3)');
      g.save(); g.rotate(0.16);
      celFill(g,(q,dx,dy)=>{ q.moveTo(-140+dx,0+dy); q.quadraticCurveTo(-70+dx,44+dy,100+dx,26+dy); q.lineTo(140+dx,-24+dy); q.quadraticCurveTo(20+dx,-36+dy,-140+dx,0+dy); q.closePath(); },'#6a4a2c',{r:60});
      g.strokeStyle='#4a3020'; g.lineWidth=1.6; for(let i=-110;i<120;i+=22){ g.beginPath(); g.moveTo(i,-20); g.quadraticCurveTo(i+8,8,i+4,30); g.stroke(); }
      m3wEll(g,-30,14,22,13,SBC.outline); m3wEll(g,-30,14,19,10.5,'#0e1a2a');
      g.strokeStyle='#3a2414'; g.lineWidth=8; g.beginPath(); g.moveTo(10,-24); g.lineTo(60,-150); g.stroke(); g.strokeStyle='#8e6a40'; g.lineWidth=4; g.stroke();
      g.strokeStyle='#3a2414'; g.lineWidth=5; g.beginPath(); g.moveTo(26,-80); g.lineTo(90,-60); g.stroke();
      g.fillStyle='#e8dcc0'; g.beginPath(); g.moveTo(56,-140); g.quadraticCurveTo(100,-118,74,-86); g.lineTo(50,-90); g.closePath(); g.fill(); g.strokeStyle='rgba(120,100,80,.7)'; g.lineWidth=1; g.stroke();
      g.fillStyle='#2a2a2a'; g.beginPath(); g.moveTo(60,-150); g.lineTo(84,-144); g.lineTo(62,-136); g.closePath(); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(70,-144,2.2,0,TAU); g.fill();
      g.fillStyle='#fff6e0'; g.font=`900 9px ${UIF}`; g.fillText('THE GLUM GULL',-96,2);
      for(let i=0;i<9;i++){ g.fillStyle=i%2?'#5a9a5a':'#7aaa4a'; g.beginPath(); g.ellipse(-120+i*26,20+Math.sin(i)*6,7,3,0.4,0,TAU); g.fill(); }
      g.restore(); }),o.x,o.y);
      for(let i=0;i<3;i++){ const k=((t*0.6+i/3)%1); ctx.strokeStyle=`rgba(230,248,255,${0.6*(1-k)})`; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(o.x-34+i*6,o.y+30-k*30,2+i,0,TAU); ctx.stroke(); } }},
  // the Whale Bones on the Strand: a huge skeleton half buried in the glass sand, the jaw on the south side
  whale:{R:240,by:30,col:[{t:'c',dx:-120,dy:10,r:16},{t:'c',dx:120,dy:14,r:16}],draw(o,t){ m3wPut(m3wTall('whale',440,240,220,170,g=>{
      m3wEll(g,0,30,200,30,'rgba(60,40,30,.25)'); const P=M3WPAL.bone;
      g.strokeStyle=P[0]; g.lineWidth=12; g.beginPath(); g.moveTo(-190,20); g.quadraticCurveTo(0,-10,170,24); g.stroke(); g.strokeStyle=P[1]; g.lineWidth=7; g.stroke();
      for(let i=0;i<9;i++){ const x=-150+i*34, hh=110-Math.abs(i-3.5)*16; g.strokeStyle=P[0]; g.lineWidth=11; g.beginPath(); g.moveTo(x,8); g.quadraticCurveTo(x-30,-hh*0.6,x+6,-hh); g.stroke(); g.strokeStyle=P[1]; g.lineWidth=6.5; g.stroke(); g.strokeStyle=P[2]; g.lineWidth=2.4; g.beginPath(); g.moveTo(x-3,4); g.quadraticCurveTo(x-33,-hh*0.6,x+3,-hh+2); g.stroke(); }
      // the skull and the jaw at the east end
      celFill(g,(q,dx,dy)=>{ q.moveTo(150+dx,-10+dy); q.quadraticCurveTo(210+dx,-40+dy,240+dx,-4+dy); q.quadraticCurveTo(220+dx,30+dy,150+dx,26+dy); q.closePath(); },P[1],{r:40,tones:m3wTones(P)});
      m3wEll(g,196,-6,10,8,'#5a4a3a');
      g.strokeStyle=P[0]; g.lineWidth=9; g.beginPath(); g.moveTo(150,36); g.quadraticCurveTo(200,60,236,30); g.stroke(); g.strokeStyle=P[1]; g.lineWidth=5; g.stroke(); }),o.x,o.y); }},
  // the Mirror Temple: white glass and silver mirrors, a sun mosaic and a moon mosaic over the door
  temple:{R:260,by:50,col:{t:'r',x0:-150,y0:-90,x1:150,y1:46},draw(o,t){ m3wPut(m3wTall('temple',360,320,180,240,g=>{
      m3wEll(g,0,52,170,18,'rgba(60,70,110,.25)');
      m3wShade(g,-150,-90,300,140,'#eef2f8',6);
      for(let i=0;i<7;i++){ const x=-130+i*43; m3wShade(g,x-8,-86,16,132,'#dfe6f2',3); m3wRect(g,x-10,-92,20,8,'#c8d0e4',2); }
      g.fillStyle='#d6dcec'; g.beginPath(); g.moveTo(-170,-90); g.lineTo(0,-200); g.lineTo(170,-90); g.closePath(); g.fill(); g.fillStyle='#eef2f8'; g.beginPath(); g.moveTo(-170,-90); g.lineTo(0,-200); g.lineTo(0,-90); g.closePath(); g.fill();
      celBall(g,-48,-130,20,'#f0c040',['#fff0a0','#f0c040','#c88a20']); for(let i=0;i<8;i++){ const a=i/8*TAU; g.strokeStyle='#f0c040'; g.lineWidth=3; g.beginPath(); g.moveTo(-48+Math.cos(a)*24,-130+Math.sin(a)*24); g.lineTo(-48+Math.cos(a)*32,-130+Math.sin(a)*32); g.stroke(); }
      celBall(g,48,-130,20,'#c8d8ff',['#ffffff','#c8d8ff','#8a9ac8']); m3wEll(g,58,-136,15,17,'#d6dcec');
      m3wRect(g,-34,-30,68,80,SBC.outline,30); m3wRect(g,-30,-26,60,76,'#2a2a4a',28); m3wRect(g,-26,-22,52,68,'#5a6aa8',26); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(-20,-14,10,52);
      for(const s of [-1,1]){ m3wRect(g,s*96-16,-60,32,46,'#9aa8c8',4); m3wRect(g,s*96-12,-56,24,38,'#e6eeff',3); g.fillStyle='rgba(120,140,190,.4)'; g.fillRect(s*96-12,-56,9,38); } }),o.x,o.y);
      const k=0.5+0.5*Math.sin(t*1.7); glowAt(o.x+48,o.y-130,26,'200,214,255',0.2+0.2*k); glowAt(o.x-48,o.y-130,26,'255,220,120',0.25*(1-k)+0.1);
      if(Math.random()<0.04){ const sx=o.x+rand(-140,140), sy=o.y-rand(10,180); emit(sx,sy,1,{col:'255,255,255',smin:4,smax:12,lmin:.3,lmax:.6,zmin:1.4,zmax:2.4}); } }},
  // the Eclipse Observatory: a brass dome with a slit, on top of the Heights
  obs:{R:280,by:40,col:{t:'c',r:150,dy:-30},draw(o,t){ const open=(G.flags.m_moonpath_lit|0)>=3;
      m3wPut(m3wTall('obs',400,340,200,250,g=>{
        m3wEll(g,0,40,190,26,'rgba(30,20,60,.3)');
        m3wShade(g,-170,-30,340,70,'#8a7aa8',10); for(let x=-150;x<170;x+=40) m3wRect(g,x-4,-26,8,62,'#6a5a88');
        celFill(g,(q,dx,dy)=>{ q.moveTo(-160+dx,-30+dy); q.quadraticCurveTo(-160+dx,-230+dy,dx,-236+dy); q.quadraticCurveTo(160+dx,-230+dy,160+dx,-30+dy); q.closePath(); },'#c8963a',{r:140,tones:['#f2cc6a','#c8963a','#8a6420']});
        g.strokeStyle='rgba(90,60,20,.55)'; g.lineWidth=2; for(let k=-3;k<=3;k++){ g.beginPath(); g.moveTo(k*44,-30); g.quadraticCurveTo(k*22,-200,0,-234); g.stroke(); }
        m3wRect(g,-16,-232,32,190,'#1a1430',6); g.fillStyle='rgba(200,190,255,.35)'; for(let i=0;i<6;i++) g.fillRect(-6+(i%2)*6,-220+i*28,2,2);
        m3wRect(g,-48,-30,96,70,SBC.outline,8); m3wRect(g,-44,-26,88,66,'#3a2a5a',6); for(const s of [-1,1]) m3wRect(g,s*22-18,-22,36,58,'#5a4a8a',4);
        g.fillStyle='#e8d8ff'; g.font=`900 10px ${UIF}`; g.textAlign='center'; g.fillText('EYE ON THE MOON',0,-42); }),o.x,o.y);
      const k=0.5+0.5*Math.sin(t*1.2); glowAt(o.x,o.y-140,40,'190,170,255',0.15+0.1*k);
      if(open){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=`rgba(210,200,255,${0.4+0.2*k})`; rrect(ctx,o.x-40,o.y-22,80,58,6); ctx.fill(); ctx.restore(); } }},
  // the Moon Pier's lamps and mooring post (white moon-marble)
  pierpost:{R:30,by:2,col:{t:'c',r:6},draw(o){ m3wPut(m3wTall('pierpost',24,30,12,22,g=>{ m3wEll(g,2,4,7,3,'rgba(30,30,60,.3)'); m3wShade(g,-5,-14,10,16,M3WC.marble,3); m3wEll(g,0,-14,5,2.2,'#ffffff'); g.strokeStyle=M3WC.rope; g.lineWidth=1.6; g.beginPath(); g.moveTo(-5,-6); g.lineTo(5,-6); g.stroke(); }),o.x,o.y); }},
  // Dell's boat, the Soggy Biscuit Three: a little steam paddle boat with a brass whistle
  boat:{R:120,by:0,col:false,draw(o,t){ const b=Math.sin(t*1.2+o.x)*1.8, r=Math.sin(t*0.8)*0.03; ctx.save(); ctx.translate(o.x,o.y+b); ctx.rotate(r); ctx.scale(o.flip?-1:1,1);
    ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(0,10,78,18,0,0,TAU); ctx.fill();
    m3wPut(m3wTall('boat',190,140,95,100,g=>{
      celFill(g,(q,dx,dy)=>{ q.moveTo(-74+dx,-4+dy); q.quadraticCurveTo(-70+dx,22+dy,-30+dx,24+dy); q.lineTo(60+dx,24+dy); q.quadraticCurveTo(84+dx,10+dy,80+dx,-8+dy); q.closePath(); },'#3a6aa8',{r:40});
      m3wRect(g,-72,-10,152,8,'#f6efe0',3); m3wRect(g,-72,-2,152,3,M3WC.red);
      m3wShade(g,-30,-46,56,36,'#f2e6c8',4); m3wRect(g,-26,-40,12,12,'#9ad0e8',2); m3wRect(g,-8,-40,12,12,'#9ad0e8',2); m3wRect(g,10,-40,12,12,'#9ad0e8',2); m3wRect(g,-34,-50,64,6,'#c8503a',2);
      m3wShade(g,30,-78,14,36,'#5a5e68',3); m3wRect(g,27,-82,20,6,'#d8503a',2); m3wShade(g,-46,-62,8,20,M3WC.brass,2);
      celBall(g,-58,8,16,'#8e6a40',['#b89060','#8e6a40','#5a3e22']); for(let i=0;i<6;i++){ const a=i/6*TAU; g.strokeStyle='#5a3e22'; g.lineWidth=2; g.beginPath(); g.moveTo(-58,8); g.lineTo(-58+Math.cos(a)*15,8+Math.sin(a)*15); g.stroke(); }
      g.fillStyle='#3a2a2a'; g.font=`900 7px ${UIF}`; g.textAlign='center'; g.fillText('SOGGY BISCUIT III',8,14); }),0,0);
    ctx.restore();
    if(Math.random()<0.18) emit(o.x+(o.flip?-37:37),o.y-82+b,1,{col:'235,235,235',glow:false,ang:-Math.PI/2,spread:0.3,smin:20,smax:50,lmin:1.4,lmax:2.4,zmin:4,zmax:8,grow:10,drag:0.4,alpha:0.7}); }},
  // a Crab Pirate fort: a ring of sharpened driftwood stakes, a flag with a crab on it
  fort:{R:300,by:0,col:false,draw(o,t){ const r=o.r||190, n=26; if(!inView(o.x,o.y,r+60)) return;
    for(let i=0;i<n;i++){ const a=i/n*TAU; if(Math.abs(Math.sin(a/2-0.8))<0.12) continue; const x=o.x+Math.cos(a)*r, y=o.y+Math.sin(a)*r*0.8;
      m3wPut(m3wTall('stake'+(i%3),20,46,10,40,g=>{ m3wEll(g,2,2,6,2.4,'rgba(40,30,20,.3)'); m3wShade(g,-4,-30-(i%3)*4,8,32+(i%3)*4,'#a08a68',2); g.fillStyle='#d8c8a8'; g.beginPath(); g.moveTo(-4,-30-(i%3)*4); g.lineTo(0,-38-(i%3)*4); g.lineTo(4,-30-(i%3)*4); g.fill(); }),x,y); }
    const fx=o.x+r*0.2, fy=o.y-r*0.5; ctx.save(); ctx.fillStyle=SBC.outline; ctx.fillRect(fx-2,fy-70,4,72); ctx.fillStyle='#2a2a30'; ctx.beginPath(); ctx.moveTo(fx+2,fy-70); for(let i=0;i<=6;i++) ctx.lineTo(fx+2+i*6,fy-70+Math.sin(t*4-i)*2.4+i*0.5); for(let i=6;i>=0;i--) ctx.lineTo(fx+2+i*6,fy-50+Math.sin(t*4-i)*2.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#e0563a'; ctx.beginPath(); ctx.ellipse(fx+20,fy-60+Math.sin(t*4-3)*2.4,6,4,0,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillRect(fx+17,fy-63+Math.sin(t*4-3)*2.4,2,2); ctx.fillRect(fx+21,fy-63+Math.sin(t*4-3)*2.4,2,2); ctx.restore(); }},
  // a market stall (Sable): striped awning over a counter of glass bottles and fruit
  stall:{R:70,by:10,col:{t:'r',x0:-34,y0:-10,x1:34,y1:12},draw(o){ const v=o.v||0; m3wPut(m3wTall('stall'+v,96,90,48,80,g=>{ const cA=['#d8503a','#3a7ab8','#e0a030','#7a3a8a'][v%4];
      m3wEll(g,0,10,44,8,'rgba(40,30,30,.3)'); m3wShade(g,-36,-18,72,28,M3WC.wood); for(let i=0;i<5;i++){ if(v%2) celBall(g,-24+i*12,-20,4.5,['#e8503a','#f0c040','#7ac04a','#e88a3a','#b05ad0'][(i+v)%5]); else { m3wRect(g,-27+i*12,-30,6,12,['#9ad8e8','#c8a8f0','#a8f0c8','#f0e0a0','#f0b0c8'][i],2); m3wRect(g,-25.5+i*12,-33,3,4,'#e8e8f0'); } }
      for(const s of [-1,1]) m3wRect(g,s*33-2,-58,4,48,M3WC.woodD);
      for(let i=0;i<6;i++){ g.fillStyle=i%2?'#fff6e6':cA; g.beginPath(); g.moveTo(-40+i*13.4,-58); g.lineTo(-40+(i+1)*13.4,-58); g.lineTo(-38+(i+1)*13.4,-44); g.lineTo(-38+i*13.4,-44); g.closePath(); g.fill(); }
      for(let i=0;i<6;i++){ g.fillStyle=i%2?'#fff6e6':cA; g.beginPath(); g.arc(-33+i*13.4,-44,6.7,0,Math.PI); g.fill(); } }),o.x,o.y); }},
  // a strider: a big long-legged desert lizard of the caravan, sitting down; it blinks
  strider:{R:50,by:4,col:{t:'c',r:16,low:true},draw(o,t){ const f=o.f||1, bl=Math.sin(t*0.7+o.x)>0.97;
    ctx.save(); ctx.translate(o.x,o.y); ctx.scale(f,1); m3wPut(m3wTall('strider'+(bl?1:0),90,70,45,50,g=>{
      m3wEll(g,0,6,30,7,'rgba(50,30,20,.3)');
      for(const lx of [-14,10]){ g.strokeStyle='#8a5a3a'; g.lineWidth=4; g.beginPath(); g.moveTo(lx,-6); g.lineTo(lx-6,-22); g.lineTo(lx+4,4); g.stroke(); }
      celFill(g,(q,dx,dy)=>q.ellipse(dx,dy-6,24,12,0,0,TAU),'#d89a5a',{r:20}); g.fillStyle='#b06a3a'; for(let i=0;i<4;i++){ g.beginPath(); g.arc(-12+i*8,-12,3,0,TAU); g.fill(); }
      g.strokeStyle='#d89a5a'; g.lineWidth=5; g.beginPath(); g.moveTo(-22,-4); g.quadraticCurveTo(-36,6,-40,-4); g.stroke();
      g.strokeStyle='#d89a5a'; g.lineWidth=6; g.beginPath(); g.moveTo(18,-10); g.quadraticCurveTo(26,-26,30,-34); g.stroke();
      celFill(g,(q,dx,dy)=>q.ellipse(dx+33,dy-36,9,6,0.2,0,TAU),'#e0a868',{r:8}); m3wEll(g,35,-38,2.4,bl?0.5:2.4,'#2a1a10');
      m3wRect(g,-10,-22,20,6,'#3a7ab8',2); m3wRect(g,-10,-18,20,3,'#e8c040'); }),0,0); ctx.restore(); }},
  // a pen of driftwood rails
  pen:{R:120,by:-30,col:false,draw(o){ m3wPut(m3wTall('pen',230,120,115,70,g=>{ g.strokeStyle='#7a5634'; g.lineWidth=5; g.strokeRect(-100,-50,200,90); g.strokeStyle='#a07848'; g.lineWidth=2.4; g.strokeRect(-100,-50,200,90); for(let x=-100;x<=100;x+=40){ m3wShade(g,x-3,-56,6,16,'#7a5634',2); m3wShade(g,x-3,34,6,16,'#7a5634',2); } }),o.x,o.y); }},
  // Great-Grandma Shellby's head and flippers at the edge of Turtleback Isle
  turtle:{R:120,by:0,col:false,draw(o,t){ const b=Math.sin(t*0.5)*1.5, awake=!!G.found.m_sec_turtle;
    m3wPut(m3wTall('turtleh'+(awake?1:0),130,90,65,60,g=>{ m3wEll(g,0,10,46,12,'rgba(255,255,255,.35)');
      celFill(g,(q,dx,dy)=>{ q.moveTo(-24+dx,10+dy); q.quadraticCurveTo(-30+dx,-26+dy,dx,-34+dy); q.quadraticCurveTo(30+dx,-26+dy,24+dx,10+dy); q.closePath(); },'#7a9a5a',{r:28,tones:['#a8c880','#7a9a5a','#4e6a3a']});
      for(const s of [-1,1]){ m3wEll(g,s*12,-14,5,awake?4.4:1.2,'#1e2a14'); if(awake) m3wEll(g,s*12-1.4,-15.4,1.4,1.4,'#ffffff'); }
      m3wEll(g,0,-2,3,2,'#3e5a2a'); m3wEll(g,-4,0,1.2,1,'#2e4a1a'); m3wEll(g,4,0,1.2,1,'#2e4a1a');
      g.strokeStyle='#4e6a3a'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-10,4); g.quadraticCurveTo(0,8,10,4); g.stroke();
      for(let i=0;i<4;i++) m3wEll(g,-16+i*10,-24+Math.abs(i-1.5)*3,2.4,1.6,'rgba(230,240,210,.7)'); }),o.x,o.y+b);
    for(const [dx,dy] of o.flip||[]) m3wPut(m3wTall('flipper',60,30,30,15,g=>{ celFill(g,(q,x0,y0)=>q.ellipse(x0,y0,24,9,0.3,0,TAU),'#7a9a5a',{r:12,tones:['#a8c880','#7a9a5a','#4e6a3a']}); }),o.x+dx,o.y+dy+b*0.5);
    if(!awake&&Math.sin(t*0.9)>0.96) ftext(o.x+20,o.y-56,'z','#e6eef8',12); }},
  // tall glass spikes of the Glasswall and the Fallen Star crater (only the ones in view are drawn)
  gspike:{R:90,by:4,col:false,draw(o,t){ m3wPut(m3wTall('gsp'+(o.v||0),90,150,45,138,g=>{ const rng=mulberry32(91+(o.v||0)*13), P=(o.v||0)%3===2?M3WPAL.glassV:M3WPAL.glass;
      m3wEll(g,4,4,34,8,'rgba(40,60,100,.25)');
      for(let i=0;i<5;i++){ const x=(i-2)*12+(rng()-0.5)*6, h=60+rng()*70, w=8+rng()*5, tip=x+(rng()-0.5)*16;
        g.fillStyle=P[0]; g.beginPath(); g.moveTo(x-w,4); g.lineTo(tip,4-h); g.lineTo(x+w,4); g.closePath(); g.fill();
        g.fillStyle=P[1]; g.beginPath(); g.moveTo(x-w,4); g.lineTo(tip,4-h); g.lineTo(x+w*0.1,4); g.closePath(); g.fill();
        g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(x-w*0.6,2); g.lineTo(tip-0.6,6-h); g.lineTo(x-w*0.3,2); g.closePath(); g.fill(); } },1.6),o.x,o.y);
      if(((t*0.6+o.x*0.013)%5)<0.05) emit(o.x+rand(-20,20),o.y-rand(40,120),1,{col:'255,255,255',smin:4,smax:14,lmin:.3,lmax:.5,zmin:1.6,zmax:2.6}); }},
  // coral crests along the Reefwall (tall fans and branches poking out of the water)
  reefc:{R:60,by:2,col:false,draw(o,t){ m3wPut(m3wTall('reefc'+(o.v||0),70,80,35,60,g=>{ const rng=mulberry32(33+(o.v||0)*7), P=[M3WPAL.coralP,M3WPAL.coralO,M3WPAL.coralV][(o.v||0)%3];
      for(let i=0;i<7;i++){ const a=-Math.PI/2+(rng()-0.5)*1.9, L=18+rng()*26; g.strokeStyle=P[0]; g.lineWidth=7; g.lineCap='round'; g.beginPath(); g.moveTo(0,4); g.quadraticCurveTo(Math.cos(a)*L*0.4+(rng()-0.5)*8,Math.sin(a)*L*0.5,Math.cos(a)*L,Math.sin(a)*L); g.stroke(); g.strokeStyle=P[1]; g.lineWidth=4; g.stroke(); celBall(g,Math.cos(a)*L,Math.sin(a)*L,3.4,P[2],[P[2],P[1],P[0]]); }
      celBall(g,10,0,9,M3WPAL.coralP[1],m3wTones(M3WPAL.coralP)); }),o.x,o.y); }},
  // a mirage: palms and a pool that shimmer and fade as Ash comes near (decor only; the Mirage Oasis has a secret)
  mirage:{R:200,by:0,col:false,draw(o,t){ const d=Math.sqrt(m3wD2(player.x,player.y,o.x,o.y)), a=clamp((d-260)/500,0,1)*(0.55+0.15*Math.sin(t*2+o.x)); if(a<0.02) return;
    ctx.save(); ctx.globalAlpha=a; const sh=Math.sin(t*3+o.y)*3;
    ctx.fillStyle='rgba(150,210,240,.8)'; ctx.beginPath(); ctx.ellipse(o.x+sh,o.y+10,o.r||110,(o.r||110)*0.32,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(230,250,255,.7)'; ctx.beginPath(); ctx.ellipse(o.x-20+sh,o.y+4,(o.r||110)*0.4,(o.r||110)*0.08,0,0,TAU); ctx.fill();
    for(const [dx,s] of [[-60,1],[40,0.85],[90,0.7]]) drawSprite(propSprite({k:'m_palm',v:Math.abs(dx)%3}),o.x+dx+sh,o.y-16,s,0);
    ctx.restore(); }},
  // the old lamp on a stump in Firefly Hollow
  stump:{R:50,by:4,col:{t:'c',r:14,low:true},draw(o,t){ const lit=!!G.found.m_sec_fireflies; m3wPut(m3wTall('stump'+(lit?1:0),60,70,30,52,g=>{ m3wEll(g,2,4,18,6,'rgba(30,30,20,.3)'); celFill(g,(q,dx,dy)=>{ q.moveTo(-15+dx,4+dy); q.lineTo(-13+dx,-12+dy); q.lineTo(13+dx,-12+dy); q.lineTo(15+dx,4+dy); q.closePath(); },'#6a4a2c',{r:14}); m3wEll(g,0,-12,13,5,'#b08a5a'); g.strokeStyle='#8a6a40'; g.lineWidth=1; g.beginPath(); g.ellipse(0,-12,8,3,0,0,TAU); g.stroke();
      m3wShade(g,-4,-30,8,16,'#5a5e68',2); m3wRect(g,-3,-28,6,10,lit?'#ffe6a0':'#7a8a8a',2); m3wRect(g,-6,-32,12,3,'#3a3e48',1); }),o.x,o.y);
    if(lit){ glowAt(o.x,o.y-24,26,'255,230,150',0.55); for(let i=0;i<8;i++){ const a=t*0.4+i*0.8, r=40+Math.sin(t+i)*20; glowAt(o.x+Math.cos(a)*r,o.y-30+Math.sin(a*1.3)*r*0.6,6,'210,255,150',0.4+0.3*Math.sin(t*3+i)); } } }},
  // Wren's Reading Raft: a pile of wet books under a sun umbrella
  books:{R:70,by:6,col:{t:'c',r:14,low:true},draw(o,t){ m3wPut(m3wTall('books',90,110,45,80,g=>{ m3wEll(g,2,6,24,6,'rgba(40,30,30,.3)');
      const cols=['#c8503a','#3a7ab8','#e0a030','#5a9a4a','#7a3a8a']; for(let i=0;i<5;i++) m3wShade(g,-14+(i%2)*3,-6-i*6,26-(i%3)*2,6,cols[i],1);
      g.strokeStyle='#6a4a2c'; g.lineWidth=2.4; g.beginPath(); g.moveTo(16,6); g.lineTo(16,-60); g.stroke();
      for(let i=0;i<6;i++){ g.fillStyle=i%2?'#ffffff':'#3a9aa8'; g.beginPath(); g.moveTo(16,-64); g.lineTo(16+Math.cos(Math.PI+i/6*Math.PI)*34,-52+Math.sin(Math.PI+i/6*Math.PI)*6); g.lineTo(16+Math.cos(Math.PI+(i+1)/6*Math.PI)*34,-52+Math.sin(Math.PI+(i+1)/6*Math.PI)*6); g.closePath(); g.fill(); } }),o.x,o.y); }},
  // Mags' workbench on the dock: gears, a vice, a bomb with a smiley face
  bench:{R:60,by:6,col:{t:'r',x0:-30,y0:-8,x1:30,y1:10},draw(o,t){ m3wPut(m3wTall('mbench',80,70,40,50,g=>{ m3wEll(g,0,8,34,6,'rgba(40,30,30,.3)'); for(const s of [-1,1]) m3wRect(g,s*24-2,-10,4,18,'#5a4a3a'); m3wShade(g,-30,-18,60,10,'#8e6a40',2);
      celBall(g,-14,-24,7,'#3a3a44',['#6a6a78','#3a3a44','#1a1a20']); g.strokeStyle='#e8c040'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-14,-31); g.quadraticCurveTo(-10,-38,-6,-36); g.stroke(); m3wEll(g,-16,-25,1,1,'#fff'); m3wEll(g,-12,-25,1,1,'#fff');
      celFill(g,(q,dx,dy)=>sbStar(q,8,7,5.4,0,dx+8,dy-24),'#c8963a',{r:7}); m3wEll(g,8,-24,2,2,'#5a3a1a'); m3wShade(g,18,-30,6,12,'#5a5e68',1); }),o.x,o.y); }},
  // Jinx's mirage stall (it moves: a different dune each game day, at noon), shimmering
  jinx:{R:80,by:8,col:false,draw(o,t){ const S=m3wJinxSpot(); if(!S||!inView(S.x,S.y,120)) return; const a=0.75+0.2*Math.sin(t*3);
    ctx.save(); ctx.globalAlpha=a; m3wPut(m3wTall('jinx',110,110,55,84,g=>{ m3wEll(g,0,8,44,8,'rgba(60,30,60,.3)'); m3wShade(g,-40,-14,80,20,'#7a2a6a',3);
      for(const s of [-1,1]) m3wRect(g,s*36-2,-70,4,58,'#3a2a3a'); for(let i=0;i<7;i++){ g.fillStyle=i%2?'#ffd27a':'#7a2a6a'; g.beginPath(); g.moveTo(-44+i*12.6,-70); g.lineTo(-44+(i+1)*12.6,-70); g.lineTo(-42+(i+1)*12.6,-56); g.lineTo(-42+i*12.6,-56); g.closePath(); g.fill(); }
      for(let i=0;i<4;i++) m3wRect(g,-26+i*14,-28,8,14,['#c8a8f0','#9ad8e8','#f0e0a0','#a8f0c8'][i],3); g.fillStyle='#ffd27a'; g.font=`900 8px ${UIF}`; g.textAlign='center'; g.fillText('JINX',0,-60); }),S.x+Math.sin(t*2)*1.5,S.y);
    ctx.restore(); }}
};
// Jinx the Mirage Merchant appears around noon at one of five dunes, a different one each game day (bible 4.3). She is
// x3_people's person: when she is in the cast the stall stands behind wherever she is; these spots are the stand-in
const M3W_JINX=[[8300,62600],[9000,65900],[8200,68400],[10000,69800],[7600,64700]];
function m3wJinxSpot(){
  if(!G) return null;
  if(typeof CASTBY!=='undefined'&&CASTBY.m_jinx){ const n=G.npcs&&G.npcs.find(q=>q.id==='m_jinx'); return n&&!n.inside&&mapAt(n.y)===3?{x:n.x+4,y:n.y-34,npc:true}:null; }
  const tod=G.tod||0; if(tod<0.36||tod>0.66) return null; const d=Math.floor((G.worldTime||0)/540)|0, p=M3W_JINX[((d%5)+5)%5]; return {x:p[0],y:p[1],i:((d%5)+5)%5}; }

// ================= 5. elevation (bible 3.4): Gull Isle and its lighthouse, Palmcrest, Turtleback, the Lumen Spire, the crow's
// nest, the Strand's glass ridges, the dunes, the Shatterfields mesas and the Fallen Star crater, the Eclipse Heights with
// the Moonpath (moon ramps), the Observatory, the Star Terrace, the Mirror Temple dais, Sable's tallest palm
ELEV.style('m_marble',{face:'#e2e0ee',lit:'#fbfaff',dark:'#b0acc6',lip:'#ffffff',out:'#4a4466',top:'#f4f2fa',topK:0.3,tex:'layers'});
ELEV.style('m_light',{face:'#f2eee4',lit:'#ffffff',dark:'#c8c0ae',lip:'#ffffff',out:'#5a4a3a',top:'#e8e2d4',topK:0.3,tex:'layers'});
ELEV.style('m_shell',{face:'#6e8e4c',lit:'#8eae64',dark:'#4a6234',lip:'#c8e0a0',out:'#24301a',top:'#86a65e',topK:0.55,tex:'crack'});
ELEV.style('m_mesa',{face:'#8e7ebc',lit:'#bcaee4',dark:'#5c4c8c',lip:'#f2eeff',out:'#1e1838',top:'#d2c8ea',topK:0.14,tex:'shine'});
ELEV.style('m_heights',{face:'#6c5e88',lit:'#8e80ac',dark:'#40365c',lip:'#dcd4f2',out:'#16102a',top:'#a89cba',topK:0.03,tex:'facet'});
ELEV.style('m_dune',{face:'#e0b866',lit:'#f2cc80',dark:'#b88a44',lip:'#fff0c0',out:'#6a4a20',top:'#efc679',topK:0.05,tex:'wave'});
ELEV.style('m_dais',{face:'#e4eaf6',lit:'#ffffff',dark:'#b6c0d8',lip:'#ffffff',out:'#3a4466',top:'#f6f9fd',topK:0.05,tex:'shine'});
ELEV.style('m_wood',{face:'#8e6a40',lit:'#b08a5a',dark:'#6a4a2c',lip:'#d8b888',out:'#2a1a10',top:'#a07a4a',topK:0.4,tex:'layers'});
ELEV.style('m_trunk',{face:'#9a7448',lit:'#c09a64',dark:'#6a4a2c',lip:'#78b048',out:'#2a1a10',top:'#5aa046',topK:0.6,tex:'roots',fringe:'#5aa046'});
// the Moonpath: three flights of two moon ramps each (one level a ramp), each flight held by its moon brazier
const M3W_MP=[
  {id:'m_mp1',lo:0,ramps:[{x0:12580,y0:65310,x1:12660,y1:65405,id:'m_mp1a'},{x0:12580,y0:65195,x1:12660,y1:65282,id:'m_mp1b'}],land:[12540,65120,12700,65330,1],braz:{id:'m_mpb1',x:12470,y:65446},lamp:[12720,65446]},
  {id:'m_mp2',lo:2,ramps:[{x0:12740,y0:64970,x1:12820,y1:65062,id:'m_mp2a'},{x0:12740,y0:64782,x1:12820,y1:64866,id:'m_mp2b'}],land:[12700,64760,12860,64990,3],braz:{id:'m_mpb2',x:12560,y:65110},lamp:[12660,65090]},
  {id:'m_mp3',lo:4,ramps:[{x0:12930,y0:64540,x1:13010,y1:64632,id:'m_mp3a'},{x0:12930,y0:64356,x1:13010,y1:64442,id:'m_mp3b'}],land:[12890,64340,13050,64560,5],braz:{id:'m_mpb3',x:13110,y:64700},lamp:[12880,64700]}];
const M3W_OBSDOOR={x:12968,y:64305};
// small puzzle places (07_build places their objects): the Glass Needle (grapple), the Moth's Eye Hollow (a moon door),
// the Silver Rift (a moon-glass bridge over a crack in the Mirror Flats)
const M3W_NEEDLE={x:12520,y:61180};
const M3W_HOLLOW={x:12010,y:62210,r0:96,r1:150,a0:1.22,a1:1.92};     // the gap is the arc a0..a1 (south)
const M3W_RIFT={x:12950,y:70300,r0:112,r1:300};
// an arc of a ring as a polygon (angles in radians, a0 < a1)
function m3wArc(cx,cy,r0,r1,a0,a1,n){ const P=[]; for(let i=0;i<=n;i++){ const a=lerp(a0,a1,i/n); P.push([cx+Math.cos(a)*r1,cy+Math.sin(a)*r1]); } for(let i=n;i>=0;i--){ const a=lerp(a0,a1,i/n); P.push([cx+Math.cos(a)*r0,cy+Math.sin(a)*r0]); } return P; }
function m3wElev(){
  const k=3, pl=d=>ELEV.plateau(Object.assign({k},d)), rp=d=>ELEV.ramp(Object.assign({k,kind:'stairs'},d));
  // ---- the Sunken Isles
  pl({disc:[1000,62000,300],lvl:1,style:'sand',noise:14,id:'m_gull',top:'#a8d070',topK:0.4});
  rp({x0:955,y0:62262,x1:1045,y1:62372,dir:'n'});
  pl({rect:[940,61830,1060,61950],lvl:3,style:'m_light',climb:true,noise:0,id:'m_lighthouse'});
  pl({disc:[3200,66600,420],lvl:1,style:'grass',noise:16,id:'m_palmcrest',top:'#9ad062',topK:0.5});
  pl({disc:[3300,66500,160],lvl:2,style:'grass',noise:8,id:'m_palmhill',top:'#8cc858',topK:0.3});
  rp({x0:3150,y0:66560,x1:3240,y1:66640,dir:'e'});
  rp({x0:3010,y0:66170,x1:3090,y1:66250,dir:'s'});
  rp({x0:3240,y0:66980,x1:3330,y1:67060,dir:'n'});
  pl({disc:[4800,63600,260],lvl:1,style:'m_shell',climb:true,noise:6,id:'m_turtleshell'});
  // the Lumen Spire: a smooth moon-marble tower (level 3) over its balcony (level 1, reached with the Grapple Tail)
  pl({disc:[3700,62200,110],lvl:3,style:'m_marble',noise:0,id:'m_spire'});
  pl({rect:[3590,62300,3810,62482],lvl:1,style:'m_marble',noise:0,id:'m_balcony'});
  ELEV.grapple({k,x:3650,y:62462,lvl:1});
  // Driftwood's crow's nest (a ladder up from the Town Raft)
  pl({rect:[2258,64634,2342,64702],lvl:1,style:'m_wood',noise:0,id:'m_crowsnest'});
  rp({x0:2282,y0:64688,x1:2318,y1:64760,dir:'n',kind:'ladder'});
  // ---- the Glass Desert
  pl({rect:[7150,63196,7700,63262],lvl:1,style:'glass',step:true,noise:3,id:'m_ridge1'});
  pl({rect:[7100,67796,7700,67862],lvl:1,style:'glass',step:true,noise:3,id:'m_ridge2'});
  pl({disc:[8400,63500,600],lvl:1,style:'m_dune',noise:30,id:'m_dune1'});
  rp({x0:7770,y0:63440,x1:7880,y1:63560,dir:'e',kind:'ramp'});
  pl({disc:[9000,69500,700],lvl:1,style:'m_dune',noise:30,id:'m_dune2'});
  rp({x0:8270,y0:69440,x1:8380,y1:69560,dir:'e',kind:'ramp'});
  pl({disc:[9450,65500,520],lvl:1,style:'m_dune',noise:22,id:'m_highdune'});
  pl({disc:[9480,65440,280],lvl:2,style:'m_dune',noise:14,id:'m_highdune2'});
  rp({x0:8900,y0:65440,x1:9010,y1:65560,dir:'e',kind:'ramp'});
  rp({x0:9170,y0:65390,x1:9270,y1:65490,dir:'e',kind:'ramp'});
  // the Shatterfields: three climbable glass mesas, updrafts, the wind ribbons, the Fallen Star crater (a level 2 ring)
  pl({disc:[12000,61300,280],lvl:3,style:'m_mesa',climb:true,noise:16,id:'m_mesa1'});
  pl({disc:[12900,60800,260],lvl:3,style:'m_mesa',climb:true,noise:16,id:'m_mesa2'});
  pl({disc:[13300,62000,240],lvl:3,style:'m_mesa',climb:true,noise:14,id:'m_mesa3'});
  ELEV.vent({k,x:12450,y:61600,r:70,lift:2}); ELEV.vent({k,x:13100,y:61400,r:70,lift:2});
  // the Glass Needle: a smooth glass pillar east of the first mesa with a chest on top: climb the mesa (Claws) and swing
  // across with the Grapple Tail (or ride the first vent up with Wings)
  pl({disc:[M3W_NEEDLE.x,M3W_NEEDLE.y,48],lvl:3,style:'m_mesa',noise:3,id:'m_needle'});
  ELEV.grapple({k,x:M3W_NEEDLE.x,y:M3W_NEEDLE.y+18,lvl:3});
  // the Moth's Eye Hollow: a ring of glass with one way in, a door of rock that only moonlight opens (Moonfire)
  { const H=M3W_HOLLOW; pl({poly:m3wArc(H.x,H.y,H.r0,H.r1,H.a1,H.a0+TAU,28),lvl:1,style:'m_mesa',noise:4,id:'m_hollow'});
    ELEV.noFly({k,disc:[H.x,H.y,H.r1+120],why:S('The glass hums here. Your wings will not open.','The glass hums. No flying here.')}); }
  pl({disc:[12420,60540,196],holes:[{disc:[12420,60540,138]}],lvl:2,style:'glass',noise:6,id:'m_crater'});
  // the Eclipse Heights: level 2, then 4, then the Observatory on 6, and the Star Terrace on 6 over the Endless Sea
  pl({poly:[[11800,62800],[13762,62800],[13762,65210],[12900,65232],[12300,65206],[11800,65186]],lvl:2,style:'m_heights',noise:8,id:'m_heights'});
  pl({rect:[12300,63300,13600,64800],lvl:4,style:'m_heights',noise:8,id:'m_heights4'});
  pl({disc:[12900,64000,380],lvl:6,style:'m_marble',noise:4,id:'m_obstop'});
  pl({rect:[13200,63800,13742,64300],lvl:6,style:'m_marble',noise:3,id:'m_terrace'});
  for(const F of M3W_MP){ const L=F.land; pl({rect:[L[0],L[1],L[2],L[3]],lvl:L[4],style:'m_marble',noise:2,id:F.id+'_land'}); for(const r of F.ramps) rp(Object.assign({dir:'n',kind:'stairs',moon:true},r)); }
  // ledges back down, so nobody is ever stuck on a terrace when the moon stairs fade
  ELEV.ledge({k,x0:11880,y0:65160,x1:12260,y1:65310}); ELEV.ledge({k,x0:12350,y0:64786,x1:12650,y1:64910});
  ELEV.ledge({k,x0:12620,y0:64290,x1:12860,y1:64470}); ELEV.ledge({k,x0:13250,y0:64286,x1:13700,y1:64410});
  ELEV.noFly({k,rect:[11780,62790,13780,65240],why:S('The dark up here is too thick to fly in.','Too dark to fly here.')});
  // the Mirror Temple's dais (stairs on the north, a ledge on the south)
  pl({disc:[12300,68400,300],lvl:1,style:'m_dais',noise:6,id:'m_dais'});
  rp({x0:12250,y0:68070,x1:12350,y1:68140,dir:'s'});
  ELEV.ledge({k,x0:12140,y0:68670,x1:12460,y1:68770});
  // (Sable's tallest palm with Coco the lamp on top is x3_people's, at 10380,67450: kept clear here)
  // ---- no flying over the Reefwall, the Spire Shoals and the Glasswall
  ELEV.noFly({k,rect:[5900,59800,6600,71200],why:S('Sea spray storms over the Reefwall. Your wings get soggy.','Sea spray! Your wings get wet.')});
  ELEV.noFly({k,disc:[3700,62300,560],why:S('Gulls nest all over the Spire. They chase you away, squawking.','The gulls chase you away!')});
  ELEV.noFly({k,rect:[10640,64940,11140,71200],why:S('The glare off the Glasswall is blinding. You can\'t see where to fly.','The glass is too bright to fly!')});
  ELEV.noFly({k,rect:[10860,64840,11990,65440],why:S('The glare off the Glasswall is blinding. You can\'t see where to fly.','The glass is too bright to fly!')});
  // ---- keep trees and rocks out of the towns, the stages and the paths
  for(const r of [[1000,64250,3000,65350],[9100,66950,10500,68350],[12100,65250,13400,65700],[12000,68050,12600,68800],[10300,62500,10900,63300],[13300,65380,13800,65520],[6700,65450,7100,65850]]) ELEV.clear({k,rect:r});
  ELEV.clear({k,disc:[5850,65600,260]}); ELEV.clear({k,disc:[12420,60540,220]}); ELEV.clear({k,disc:[7400,62200,300]});
}
// the Moonpath's moon braziers: each one lit for good holds its flight; the world owns G.flags.m_moonpath_lit (0..3)
function m3wPathLit(){ let n=0; for(const F of M3W_MP) if(G&&G.found&&G.found[F.braz.id]) n++; return n; }

// ---------- more standing things: the Moonpath's bend lamps (lit by fire), the Baron in the gate, the crow's nest mast,
// wrecks, worm holes, the Star Terrace rail, the star-iron in the crater
Object.assign(M3WK,{
  // a lamp post lit by any fire for 12 s (the Moonpath bends: moths stop to stare at a lit one)
  flame:{R:70,by:0,col:{t:'c',r:5},light:o=>({x:o.x,y:o.y-34,r:170,get i(){ return m3wFlameOn(o)?0.75:0; },night:true,fire:true}),
    draw(o,t){ const on=m3wFlameOn(o), key='flamp'+(o.v||0)+(on?1:0);
      m3wPut(m3wTall(key,22,56,11,52,g=>m3wLampArt(g,on,o.v||0)),o.x,o.y);
      const hy=o.y-33; if(on){ glowAt(o.x,hy,32,'255,214,130',0.55); glowAt(o.x,hy,9,'255,246,200',0.75); if(Math.random()<0.05) emit(o.x,hy,1,{kind:'fire',ang:-Math.PI/2,spread:0.3,smin:8,smax:20,lmin:.2,lmax:.4,zmin:1.5,zmax:2.5,grow:2,drag:1}); } }},
  // Baron Puffington stuck in the Sunken Gate (until he is beaten; the foes module draws him during the fight)
  plug:{R:120,by:30,col:false,draw(o,t){ if(m3wF('m_puff_done')||(G.boss&&!G.boss.dead)) return; const b=Math.sin(t*1.1)*2, puff=1+Math.sin(t*0.7)*0.03;
    ctx.save(); ctx.translate(o.x,o.y+b); ctx.scale(puff,puff);
    m3wPut(m3wTall('puff',170,150,85,90,g=>{ m3wEll(g,0,40,66,14,'rgba(20,40,70,.35)');
      for(let i=0;i<22;i++){ const a=i/22*TAU; g.fillStyle='#c89a3a'; g.beginPath(); g.moveTo(Math.cos(a-0.12)*58,Math.sin(a-0.12)*50); g.lineTo(Math.cos(a)*76,Math.sin(a)*66); g.lineTo(Math.cos(a+0.12)*58,Math.sin(a+0.12)*50); g.closePath(); g.fill(); }
      celFill(g,(q,dx,dy)=>q.ellipse(dx,dy,62,54,0,0,TAU),'#f0c840',{r:56,tones:['#fff0a0','#f0c840','#c08a28']});
      for(const [x,y,r] of [[-30,-20,7],[20,-30,6],[34,10,8],[-14,22,6],[6,-6,5]]) m3wEll(g,x,y,r,r*0.8,'#a8742a');
      for(const s of [-1,1]){ m3wEll(g,s*20,-12,10,11,'#ffffff'); m3wEll(g,s*20+s*2,-10,4.6,5.4,'#1a1a2a'); }
      g.strokeStyle='#5a3a1a'; g.lineWidth=6; g.lineCap='round'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(0,8); g.quadraticCurveTo(s*30,4,s*48,18); g.stroke(); } g.strokeStyle='#8a5a2a'; g.lineWidth=3; for(const s of [-1,1]){ g.beginPath(); g.moveTo(0,7); g.quadraticCurveTo(s*30,3,s*47,16); g.stroke(); }
      m3wEll(g,0,22,8,5,'#7a2a2a'); m3wRect(g,-16,-66,32,12,'#2a3a6a',3); m3wRect(g,-22,-56,44,6,'#2a3a6a',2); m3wRect(g,-16,-60,32,3,'#e8c040'); }),0,0);
    ctx.restore();
    if(Math.sin(t*0.8)>0.97) ftext(o.x+40,o.y-80,S('Hmph!','Hmph!'),'#fff0b0',12);
    if(Math.random()<0.05) emit(o.x+rand(-20,20),o.y-60,1,{col:'230,248,255',glow:false,ang:-Math.PI/2,spread:0.3,smin:15,smax:30,lmin:1,lmax:1.6,zmin:1.6,zmax:2.6,alpha:0.7}); }},
  mast:{R:140,by:0,col:false,draw(o,t){ m3wPut(m3wTall('mast',120,170,60,150,g=>{ m3wShade(g,-4,-150,8,150,'#6a4a2c',2); m3wRect(g,-26,-118,52,6,'#6a4a2c',2);
      g.strokeStyle=M3WC.rope; g.lineWidth=1.2; for(const s of [-1,1]){ g.beginPath(); g.moveTo(0,-148); g.lineTo(s*38,-2); g.stroke(); } }),o.x,o.y);
    ctx.save(); ctx.translate(o.x,o.y-150); ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.moveTo(2,-2); for(let i=0;i<=6;i++) ctx.lineTo(2+i*6,-2+Math.sin(t*4-i)*2.6+i*0.5); for(let i=6;i>=0;i--) ctx.lineTo(2+i*6,16+Math.sin(t*4-i)*2.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#e8a030'; ctx.beginPath(); ctx.moveTo(3,0); for(let i=0;i<=6;i++) ctx.lineTo(3+i*5.6,Math.sin(t*4-i)*2.6+i*0.5); for(let i=6;i>=0;i--) ctx.lineTo(3+i*5.6,14+Math.sin(t*4-i)*2.6); ctx.closePath(); ctx.fill(); ctx.fillStyle='#3a8aaa'; ctx.fillRect(10,4+Math.sin(t*4-2)*2.6,12,5); ctx.restore(); }},
  // a small washed-up ship on the Strand
  wreck:{R:140,by:10,col:[{t:'c',dx:-30,r:22},{t:'c',dx:30,r:22}],draw(o,t){ m3wPut(m3wTall('wreck'+(o.v||0),220,150,110,100,g=>{ m3wEll(g,0,12,96,16,'rgba(60,40,30,.3)'); g.save(); g.rotate(o.v?-0.25:0.2);
      celFill(g,(q,dx,dy)=>{ q.moveTo(-90+dx,0+dy); q.quadraticCurveTo(-40+dx,28+dy,60+dx,16+dy); q.lineTo(90+dx,-14+dy); q.quadraticCurveTo(10+dx,-22+dy,-90+dx,0+dy); q.closePath(); },o.v?'#7a5a3a':'#8a6440',{r:40});
      g.strokeStyle='#4a3020'; g.lineWidth=1.4; for(let i=-70;i<80;i+=18){ g.beginPath(); g.moveTo(i,-14); g.quadraticCurveTo(i+6,4,i+3,20); g.stroke(); }
      for(let i=0;i<5;i++){ const x=-60+i*26; g.strokeStyle='#3a2414'; g.lineWidth=4; g.beginPath(); g.moveTo(x,-10); g.quadraticCurveTo(x-4,-34,x+3,-50+Math.abs(i-2)*6); g.stroke(); g.strokeStyle='#a07848'; g.lineWidth=2; g.stroke(); }
      for(let i=0;i<5;i++){ g.fillStyle='rgba(200,240,250,.85)'; g.beginPath(); g.moveTo(-50+i*24,10); g.lineTo(-46+i*24,2); g.lineTo(-42+i*24,10); g.closePath(); g.fill(); }
      g.restore(); }),o.x,o.y); }},
  // a worm hole in the Wormfields: a sand crater; now and then a little worm peeks out
  hole:{R:50,by:0,col:false,draw(o,t){ m3wPut(m3wTall('hole',70,40,35,20,g=>{ m3wEll(g,0,0,30,13,'#c89a4a'); m3wEll(g,0,1,22,9,'#8a5a2a'); m3wEll(g,0,2,15,6,'#3a2414'); }),o.x,o.y);
    const ph=(t*0.35+o.x*0.001)%4; if(ph<0.8){ const h=Math.sin(ph/0.8*Math.PI)*16; ctx.save(); ctx.beginPath(); ctx.rect(o.x-30,o.y-40,60,42); ctx.clip(); ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(o.x,o.y+2-h,8.6,h+3,0,0,TAU); ctx.fill(); ctx.fillStyle='#e8a090'; ctx.beginPath(); ctx.ellipse(o.x,o.y+2-h,7,h+1.6,0,0,TAU); ctx.fill();
      ctx.fillStyle='#fff'; ctx.fillRect(o.x-4,o.y-h-6,2.6,2.6); ctx.fillRect(o.x+1.4,o.y-h-6,2.6,2.6); ctx.fillStyle='#222'; ctx.fillRect(o.x-3.4,o.y-h-5.4,1.4,1.4); ctx.fillRect(o.x+2,o.y-h-5.4,1.4,1.4); ctx.restore(); } }},
  rail:{R:200,by:0,col:false,draw(o){ m3wPut(m3wTall('rail'+o.w,o.w+20,40,10,30,g=>{ for(let x=0;x<=o.w;x+=40) m3wShade(g,x-3,-22,6,24,M3WC.marble,2); m3wRect(g,-2,-24,o.w+4,5,'#f4f2fa',2); }),o.x,o.y); }},
  // the silhouette of a cracked crater rim spike (for the Fallen Star) uses gspike; this is the star-iron glint in it
  star:{R:40,by:0,col:false,draw(o,t){ if(G.found.m_sec_crater) return; const k=0.5+0.5*Math.sin(t*3); m3wPut(m3wTall('starore',40,40,20,24,g=>{ m3wBlob(g,12,mulberry32(9),['#3a3450','#5a5478','#8a84b0']); for(let i=0;i<4;i++) celBall(g,-6+i*4,-4+(i%2)*4,2.4,'#f0f0ff',['#ffffff','#e0e6ff','#8a9ad8']); }),o.x,o.y); glowAt(o.x,o.y-6,22,'220,230,255',0.3+0.3*k); }}
});
// a bend lamp burns for 12 s after fire touches it
const m3wFlameOn=o=>(o.litT||0)>0;
// the Moonpath's bend lamps (any fire, 12 s): moths stop to stare at a lit one (bible 6.9b, 7.0). For the foes module:
// m3wLitLampNear(x,y,r) -> a lit lamp within r, or null
function m3wLitLampNear(x,y,r){ for(const o of M3WD.fire){ if(m3wFlameOn(o)&&m3wD2(o.x,o.y,x,y)<r*r) return o; } return null; }
// foes the Act IV foes helper defines; until it lands, similar earlier foes stand in (so nothing ever crashes)
const M3W_FOE={m_moonjelly:['c_gulper','slime'],m_crabpirate:['c_tickbug','kobold'],m_sandshark:['wolf'],m_glassscorp:['c_tickbug','kobold'],m_shade:['c_moth','bat'],m_mothknight:['c_tinman','knight'],m_mirrorimp:['sneak'],f_mothling:['c_moth','bat']};
const m3wFoe=t=>EDEF[t]?t:((M3W_FOE[t]||[]).find(q=>EDEF[q])||'kobold');
// [id, x, y, units, extra] (bible 3.7; a few centres moved off quicksand and cliff edges); 'night' camps add their
// Shades only at night
const M3W_CAMPS=[['m_c1',5600,61800,[['m_crabpirate',4],['m_moonjelly',2]]],['m_c2',5400,68200,[['m_crabpirate',4]]],['m_c3',4300,69500,[['m_moonjelly',3]],[['m_shade',2]]],
  ['m_c4',7350,62900,[['m_glassscorp',3]]],['m_c5',8300,65400,[['m_sandshark',2],['m_glassscorp',1]]],['m_c6',9300,69470,[['m_sandshark',3]]],['m_c7',10160,61540,[['m_sandshark',2],['m_glassscorp',2]]],
  ['m_c8',12500,61900,[['m_glassscorp',2],['m_mirrorimp',2]]],['m_c9',11800,69600,[['m_mirrorimp',3]],[['m_shade',2]]],['m_c10',12100,64800,[['m_mothknight',2],['m_shade',2]]],['m_c11',13200,60600,[['m_mothknight',3]]]];
// the dungeons and small areas whose doors are on this map: a clearly marked placeholder is registered at world build when
// the dungeon helper has not defined the area (defineDungeon by that helper replaces it, as it loads before the build)
// (the Bubble Caves, m_bubblecaves, are x3_people's: the area and its door behind Mags' three rocks)
const M3W_AREAS={m_lumen:[S('Drowned Lumen','Drowned Lumen'),18,'m_lumen'],m_burrows:[S('The Sandworm Burrows','The Sandworm Burrows'),19,'m_burrows'],m_mirror:[S('The Mirror Temple','The Mirror Temple'),20,'m_mirror'],
  m_obs:[S('The Eclipse Observatory','The Eclipse Observatory'),21,'m_obs']};
// Old Lumen's back door (secret 7) dives into this area; x3_dun_a may point it at its Seafloor floor and room h
const M3W_BACKDOOR={area:'m_lumen',room:'h',x:3900,y:61800,enter:null};
// ---------- houses: Driftwood on rafts (plank walls, sea-bright roofs), Sable's striped tents (their own sprite)
function m3wHzDrift(hs,L){ const r=hs.seed>>>0; return {wall:'plank',wc:['#f2e2c0','#e8f0f0','#f6dcc4','#dcecf0','#f4e8d0'][r%5],rc:hs.roof||'#3a8aaa',trim:['#3a8aaa','#f6f0e2','#c84a3a'][(r>>4)%3],shut:true,box:true}; }
function m3wHzSable(hs,L){ return {wc:'#efe2c0',rc:hs.roof||'#c84a3a',trim:'#7a3a1a'}; }
function m3wHouse(B,o){
  const hs={k:'house',x:o.x,y:o.y,w:o.w,h:o.h,vert:!!o.vert,roof:o.rc||'#3a8aaa',burnt:false,seed:o.seed!=null?o.seed:Math.floor(B.rng()*1e9),snow:false,town:o.town};
  if(o.want) hs.want=o.want; if(o.tent) hs.m3tent=true; if(o.big) hs.m3big=true;
  HOUSES.push(hs); STRUCTS.push(hs); addCol({t:'r',x0:hs.x-hs.w/2,y0:hs.y-hs.h/2,x1:hs.x+hs.w/2,y1:hs.y+hs.h/2});
  return hs;
}
// [x, y, w, h, the CAST id it is planned for, roof]. The planned homes sit nearest the buildings the bible names (the
// Mayor's Barge by the crow's nest, the Floating Kitchen on the Town Raft's south side, the Shell Hut, the Rope Shed by
// the ferry post); the generic neighbours come after them (house order is a save key: append only)
const M3W_DRIFT=[[2540,64630,140,90,'m_dabble','#3a8aaa'],[2560,64862,150,90,'m_gilly','#e8a030'],[2060,65000,120,80,'m_winnie','#c84a3a'],[2800,64700,120,70,'m_rowan','#3a8aaa'],
  [1825,64365,110,70,null,'#c84a3a'],[2590,64990,110,70,null,'#e8a030'],[1660,64545,110,70,null,'#3a8aaa'],[2800,64470,110,70,null,'#e8a030'],[1790,65030,100,70,null,'#3a8aaa'],[2280,65215,100,70,null,'#c84a3a']];
const M3W_SABLE=[[9460,67160,200,130,'m_rafi','#c84a3a',1],[10300,67250,150,90,'m_kiln','#e8a030'],[10240,67990,140,90,'m_esme','#7a2a6a'],[9250,67860,120,80,null,'#3a6aaa'],[9480,68100,130,80,null,'#e8a030'],
  [9800,68210,140,90,null,'#c84a3a'],[10080,68170,120,80,null,'#3a6aaa'],[10440,67830,120,80,null,'#7a2a6a'],[10060,67140,130,80,null,'#3a6aaa'],[9240,67230,120,80,null,'#e8a030'],[10420,68120,120,80,null,'#c84a3a'],[9100,67680,110,70,null,'#7a2a6a']];
// homes: a CAST person a house is planned for (house.want) gets that one; everyone else by the stock rules. Wrapped at
// world build (after every module has loaded), so this runs before any other module's home wrapper: x3_people sees
// the planned homes taken (DOORS with owner) and places nobody twice
function m3wHomes(){
  if(M3WD.homesWrapped) return; M3WD.homesWrapped=true;
  const base=assignHomesNew; assignHomesNew=function(){
    const off=[];
    const give=(town,o,i,hsx,door)=>{ const style=STYLE_OF[o.job]||o.style||'home';
      const def=defHouse('h_'+o.id,{name:o.house||'House',owner:o.id,style,seed:1000+i+town.length*31,painting:i,egg:i+3,w:style==='inn'||style==='lodge'?680:560,h:style==='inn'?460:400,town});
      if(INDOOR[o.id]&&CASTBY[o.id]) CASTBY[o.id].inside=def.id;
      hsx.owner=o.id; hsx.area=def.id; hsx.door=door;
      DOORS.push({x:door.x,y:door.y,area:def.id,label:`Enter ${def.name}`,outY:door.outY||0,hs:hsx,owner:def.owner}); off.push(o); o.home=false; };
    try{ for(const town of TOWN_ORDER){ if(!town.startsWith('m_')) continue; const owners=CAST.filter(c=>c.town===town&&c.home&&!c.generic);
      for(const h of HOUSES){ if(h.town!==town||h.k!=='house'||h.area||!h.want) continue; const i=owners.findIndex(c=>c.id===h.want&&c.home); if(i>=0) give(town,owners[i],i,h,doorOf(h)); } } }catch(e){ console.error('m3w homes',e); }
    try{ base(); } finally { for(const o of off) o.home=true; }
  };
}
// ================= 6. the map and everything placed on it
const m3wLM=(B,o)=>{ o.noNudge=true; if(o.clr==null) o.clr=60; return B.landmark(o); };
function m3wBuild(B){
  M3WD.built=true; M3WD.B=B;
  m3wHomes();
  m3wElev();
  m3wPlaceholders();
  // ---- places (bible 3.7): small ones first (the region banner picks the first one in range), the regions last
  const P=(key,x,y,r,name,level,o)=>B.poi(key,Object.assign({x,y,r,name,level},o||{}));
  P('m_terrace',13500,64050,220,S('the Star Terrace','the Star Terrace'),21);
  P('m_edge',13550,65450,250,S('the Edge of the World','the Edge of the World'),21);
  P('m_moonpath',12600,65200,300,S('the Moonpath','the Moonpath'),21);
  P('m_obs',12900,64000,450,S('the Eclipse Observatory','the Eclipse Observatory'),21);
  P('m_burrowgap',10900,67200,220,S('the Burrow Gap','the Burrow Gap'),20);
  P('m_wormmouth',10600,62900,300,S('the Worm Mouth','the Worm Mouth'),19);
  P('m_mirror',12300,68400,420,S('the Mirror Temple','the Mirror Temple'),20);
  P('m_spire',3700,62300,300,S('the Lumen Spire','the Lumen Spire'),17);
  P('m_coralreef',1900,67600,400,S('Coralcombe Reef','Coralcombe Reef'),17);
  P('m_gull',1000,62000,380,S('Gull Isle','Gull Isle'),17,{noClr:true});
  P('m_turtle',4800,63600,300,S('Turtleback Isle','Turtleback Isle'),18,{noClr:true});
  P('m_sunkengate',5950,65600,420,S('the Sunken Gate','the Sunken Gate'),18);
  P('m_strand',6900,65600,300,S('Strand Landing','Strand Landing'),18);
  P('m_palmcrest',3200,66600,520,S('Palmcrest Isle','Palmcrest Isle'),17,{noClr:true});
  P('m_driftwood',2300,64800,800,S('Driftwood Landing','Driftwood Landing'),17,{town:true});
  P('m_sable',9800,67600,650,S('the Oasis of Sable','the Oasis of Sable'),19,{town:true});
  P('m_mangrove',3000,69800,900,S('the Moonroot Mangroves','the Moonroot Mangroves'),18,{noClr:true});
  P('m_wormfields',10600,62600,1200,S('the Wormfields','the Wormfields'),19,{noClr:true});
  P('m_shatter',12600,61500,900,S('the Shatterfields','the Shatterfields'),20,{noClr:true});
  B.town('m_driftwood',{name:'Driftwood Landing',music:'town',generics:{ties:['Dell the captain','the merfolk of Coralcombe','the Sable caravan','old Gull Isle']},hz:m3wHzDrift});
  B.town('m_sable',{name:'the Oasis of Sable',music:'town',generics:{ties:['Caravan-master Rafi','the Well-Warden','Old Kiln the glassblower','the striders']},hz:m3wHzSable});
  for(const [x,y,w,h,want,rc] of M3W_DRIFT) m3wHouse(B,{x,y,w,h,town:'m_driftwood',want,rc});
  for(const [x,y,w,h,want,rc,big] of M3W_SABLE) m3wHouse(B,{x,y,w,h,town:'m_sable',want,rc,tent:true,big});
  // ---- shrines (bible 3.7)
  for(const [id,x,y,n] of [['s_m_driftwood',2400,64600,'Town Raft Shrine'],['s_m_gull',1150,61800,'Lighthouse Shrine'],['s_m_palmcrest',3300,66500,'Palmcrest Shrine'],['s_m_strand',7050,65300,'Strand Shrine'],
    ['s_m_sable',10100,67900,'Sable Shrine'],['s_m_wormfields',10300,63500,'Wormfields Shrine'],['s_m_flats',11500,68200,'Flats Shrine'],['s_m_moonpath',12380,65440,'Moonpath Shrine']]) B.shrine({id,x,y,name:S(n,n)});
  // ---- camps
  for(const [id,x,y,units,night] of M3W_CAMPS){
    const base=units.map(([t,n])=>[m3wFoe(t),n]), extra=(night||[]).map(([t,n])=>[m3wFoe(t),n]), c={id,x,y,want:units.concat(night||[])};
    Object.defineProperty(c,'units',{get(){ return extra.length&&typeof isNight==='function'&&isNight()?base.concat(extra):base; },configurable:true});
    B.camp(c);
  }
  m3wDoors(B);
  m3wPlaces(B);
  m3wTowns(B);
  m3wSecrets(B);
  m3wPuzzles(B);
  m3wPaint();
}
// ---------- the doors of the dungeons (bible 7) and the small areas
function m3wDoors(B){
  B.door({x:3700,y:62430,area:'m_lumen',label:S('Enter the Lumen Spire','Go in the Spire'),outY:24,m3need:()=>m3wGate('m_lumen'),m3locked:S('The balcony door is sealed with moon-wax. Somewhere a tide has to turn first.','The door is sealed. Not yet.')});
  B.cave({area:'m_burrows',x:10600,y:62890,theme:'m_dune',noNudge:true,label:S('Climb down into the Worm Mouth','Go down the Worm Mouth')});
  { const d=DOORS[DOORS.length-1]; d.m3need=()=>m3wGate('m_burrows'); d.m3locked=S('A warm wind breathes out of the hole. Something huge is asleep down there. Better to come back with a reason.','Something big sleeps down there. Not yet.'); }
  B.door({x:12300,y:68446,area:'m_mirror',label:S('Enter the Mirror Temple','Go in the temple'),outY:26,m3need:()=>m3wGate('m_glasswall'),m3locked:S('Your own face looks back from the glass door. It does not open. Not yet.','The glass door stays shut.')});
  B.door({x:M3W_OBSDOOR.x,y:M3W_OBSDOOR.y,area:'m_obs',label:S('Enter the Eclipse Observatory','Go in the Observatory'),outY:30,m3need:()=>(G.flags.m_moonpath_lit|0)>=3,
    m3locked:S('The great brass door is shut tight. Three moon braziers on the Moonpath are still cold.','The door is shut. Light the three moon bowls.')});
  // Coralcombe: a dive door in the middle of the ring of coral (Dive)
  p4Add('pool',{id:'m_dive_coral',x:M3WG.coral[0],y:M3WG.coral[1],r:60,kind:'water',area:'m_coralcombe',label:S('Dive down to Coralcombe','Dive down to Coralcombe'),arrive:S('Down through a curtain of bubbles','Down through the bubbles!')});
  // (the Bubble Caves under Palmcrest and Mags' three cracked rocks are x3_people's, side quest m_tidebombs)
  // Old Lumen's back door (secret 7): a dive spot in the deep of the Drowned Reach, a sunken chest on the way down
  p4Add('pool',{id:'m_sec_backdoor',x:M3W_BACKDOOR.x,y:M3W_BACKDOOR.y,r:50,kind:'water',area:M3W_BACKDOOR.area,label:S('Dive through the drowned window','Dive in the window'),arrive:S('A broken window into the drowned city','Into the drowned city!'),
    on:()=>!!AREADEFS[M3W_BACKDOOR.area]});
  p4Add('uchest',{id:'m_uc_backdoor',x:3790,y:61690,coins:100,xp:80});
}
// ---------- landmarks, the life of the isles and the desert (bible 3.7)
function m3wPlaces(B){
  // ---- Gull Isle: the lighthouse lamp room on the tower, palms
  m3wObj('lighthouse',1000,61880,{base:61950});
  for(const [x,y,v] of [[820,61880,0],[1160,62110,1],[880,62170,2],[1210,61950,0],[760,62060,1]]) m3wObj('prop',x,y,{pk:'m_palm',v,s:0.95});
  m3wLM(B,{id:'m_lm_lighthouse',k:'m_lm',x:1000,y:62060,r:0,clr:40,prompt:S('Look up at the lighthouse','Look at the lighthouse'),draw:()=>{},act:()=>m3wSay([m3wF('m_lighthouse_lit')?S('The Gull Isle lighthouse burns silver. Its beam sweeps the whole Sunken Isles.','The lighthouse shines silver!'):S('A tall white lighthouse with a dark lamp. Moths flutter round the top. Someone is up there, muttering.','A dark lighthouse. Moths at the top.')])});
  // ---- the Lumen Spire and the Spire Shoals: broken moon columns in the sea, the balcony, the grapple post
  m3wObj('spire',3700,62302,{base:62410});
  for(const [x,y,v,s] of [[3050,62600,0,1.1],[3350,62450,1,1],[2900,63300,2,1.2],[3950,62700,0,1.3],[3420,63480,1,0.9],[4100,62300,1,1.2],[3260,62030,2,1],[2700,62900,0,1]]) m3wObj('prop',x,y,{pk:'m_column',v,s});
  m3wLM(B,{id:'m_lm_balcony',k:'m_lm',x:3760,y:62452,r:0,clr:10,prompt:S('Look at the balcony','Look at the balcony'),draw:()=>{},act:()=>m3wSay([S('A balcony of white moon-marble, high above the sea. Carved over the door: LUMEN. MIND THE TIDE.','LUMEN. MIND THE TIDE.')])});
  // ---- the Coralcombe dive ring: buoys round the reef, a sign on a float
  for(let i=0;i<10;i++){ const a=i/10*TAU; m3wObj('buoy',M3WG.coral[0]+Math.cos(a)*450,M3WG.coral[1]+Math.sin(a)*440,{v:i%2}); }
  // ---- Turtleback Isle (secret 1): Great-Grandma Shellby's head and flippers
  m3wObj('turtle',4800,63318,{base:63340,flip:[[-250,190],[250,190],[-230,420],[230,420]]});
  // ---- the Crab Pirate forts (camps m_c1 and m_c2)
  m3wObj('fort',5600,61800,{r:200,base:61800}); m3wObj('fort',5400,68200,{r:230,base:68200});
  // ---- (Rowan's three ferry posts on the sandbars (3600,64900) (4600,65300) (5500,65500) are x3_people's, m_ferry;
  // the sandbars are terrain here)
  // ---- the Sunken Gate: the Gate Sandbank arena, the arch under the reef, bubble vents, the Baron stuck in the gate, the galleon
  p4Add('arch',{id:'m_sunkengate',x0:6070,y0:65532,x1:6380,y1:65668,on:()=>m3wF('m_puff_done')||!m3wStage('m_reef')});
  for(const [x,y,on,off,ph] of [[5640,65360,0,0,0],[6010,65820,2,2,0],[5640,65840,2,2,1],[6020,65380,3,1.5,0.5],[6460,65600,0,0,0]]) p4Add('bubbles',{id:`m_bub_gate_${x}`,x,y,on,off,ph});
  m3wObj('plug',6200,65600,{base:65640});
  // coral crests along both edges of the Reefwall (tall fans and branches out of the surf)
  for(let y=60080,i=0;y<70960;y+=104,i++){ if(Math.abs(y-65600)<120) continue; let xl=6040, xr=6420; while(xl<6400&&!m3wReefIn(xl,y)) xl+=4; while(xr>6040&&!m3wReefIn(xr,y)) xr-=4;
    if(xr-xl<40) continue; m3wObj('reefc',xl+14,y,{v:i%3,base:y+2}); if(i%2) m3wObj('reefc',xr-14,y+52,{v:(i+1)%3,base:y+54}); m3wObj('reefc',(xl+xr)/2+((i*37)%60)-30,y+30,{v:(i+2)%3,base:y+32}); }
  m3wObj('galleon',6170,65840,{base:65860});
  p4Add('uchest',{id:'m_sec_galleon',x:6040,y:65832,coins:200,xp:120,m3after:()=>m3wF('m_puff_done')||!m3wStage('m_reef'),
    m3wait:S('Big yellow spines poke out of the hole in the hull. The Baron is still in the gate. Not yet.','Spines in the hole. Not yet.'),then(){ G.found.m_sec_galleon=1; m3wHat('m_hat_pirate'); setBanner(S('Sunken treasure!','Treasure!'),S('200 coins and a captain\'s hat. It is a little damp.','Coins and a pirate hat!'),3); }});
  m3wLM(B,{id:'m_lm_gate',k:'m_lm',x:5880,y:65560,r:0,clr:40,prompt:S('Look at the gate under the reef','Look at the gate'),draw:()=>{},act:()=>m3wSay([m3wF('m_puff_done')?S('The Sunken Gate is open. Through the arch under the reef, the water is bright and warm.','The gate under the reef is open!'):S('Under the reef there is a great stone arch. Something big, round and spiky is wedged in it. It is wearing a hat.','A big spiky fish is stuck in the arch.')])});
  // ---- bubble vents for the Moonfish trench and the drowned city (air for long dives)
  for(const [x,y] of [[2000,61200],[2400,60900],[2800,61250],[3300,61000],[3700,61500],[4300,61100],[1700,66500],[4800,64700]]) p4Add('bubbles',{id:`m_bub_${x}_${y}`,x,y,on:0,off:0});
  p4Add('uchest',{id:'m_uc_reach',x:2520,y:60780,coins:90,xp:60});
  p4Add('uchest',{id:'m_uc_mangrove',x:2050,y:69900,coins:70,xp:50,treat:1});
  // ---- the Tideglass Strand: Strand Landing, the Whale Bones (secret 3), two washed-up ships
  m3wObj('whale',7400,62200,{base:62230});
  p4Add('bchest',{id:'m_sec_bones',x:7600,y:62250,coins:150,xp:120,then(){ G.found.m_sec_bones=1; G.pendingBless=(G.pendingBless||0)+1; later(0.8,offerPending); }});
  m3wLM(B,{id:'m_lm_bones',k:'m_lm',x:7300,y:62290,r:0,clr:120,prompt:S('Look at the Whale Bones','Look at the bones'),draw:()=>{},act:()=>m3wSay([S('The bones of a whale bigger than a ship, half buried in glassy sand. Under the jaw the sand is soft and glints. Something is buried there.','Huge whale bones. Something glints under the jaw.')])});
  m3wObj('wreck',6880,63700,{v:0}); m3wObj('wreck',6950,68600,{v:1});
  m3wObj('prop',7020,65760,{pk:'m_palm',v:1,s:0.9}); m3wObj('prop',6780,65380,{pk:'m_palm',v:0,s:0.85});
  // ---- the Glass Dunes and the Wormfields: worm holes, the Worm Mouth, Jinx, the High Dune
  for(const [x,y] of [[9800,62200],[10400,61900],[11000,62300],[9900,63500],[11300,63000],[10800,63700],[9600,62900],[11500,61800],[10500,64000]]) m3wObj('hole',x,y);
  M3WD.jinx={k:'jinx',x:0,y:0,R:80,base:0};
  // ---- the Glasswall: tall glass spikes along both walls, the Burrow Gap (sand under the wall)
  for(let y=65080;y<71150;y+=95){ if(Math.abs(y-M3WG.gap.y)<120) continue; m3wObj('gspike',10712+((y*7)%30),y,{v:(y/95|0)%4}); m3wObj('gspike',11088-((y*5)%30),y+40,{v:((y/95|0)+2)%4}); }
  for(let x=10960;x<11950;x+=95) m3wObj('gspike',x,64920+((x*3)%20),{v:(x/95|0)%4});
  p4Add('sandgap',{id:'m_burrowgap',x0:M3WG.gap.x0,y0:M3WG.gap.y0,x1:M3WG.gap.x1,y1:M3WG.gap.y1,on:()=>m3wGapOpen()});
  // ---- the Mirror Flats: mirages, the Mirror Temple on its dais
  for(const [x,y,r] of [[11700,66400,120],[12900,67200,150],[11600,70200,130],[13100,69800,140],[12600,70700,110],[11300,69000,100]]) m3wObj('mirage',x,y,{r,base:y-400});
  m3wObj('temple',12300,68380,{base:68426});
  // ---- the Eclipse Heights: the Moonpath (moon braziers, the bend lamps), the Observatory dome, the Star Terrace rail
  M3W_MP.forEach((F,i)=>{ p4Add('moonstone',{id:F.braz.id,x:F.braz.x,y:F.braz.y,keep:true,ramps:F.ramps.map(r=>r.id),then:()=>m3wBrazLit(i)});
    const L=m3wObj('flame',F.lamp[0],F.lamp[1],{id:'m_mplamp'+(i+1),kind:'post',v:2}); M3WD.fire.push(L); });
  m3wObj('obs',12960,64140,{base:64190});
  m3wObj('rail',13220,63795,{w:500,base:63790}); m3wObj('rail',13220,64312,{w:500,base:64312});
  m3wLM(B,{id:'m_lm_obsdoor',k:'m_lm',x:12880,y:64330,r:0,clr:10,prompt:S('Read the brass plate','Read the plate'),draw:()=>{},act:()=>m3wSay([S('THE ECLIPSE OBSERVATORY OF LUMEN. Astronomers only. And dragons. (Someone has scratched in the "And dragons.")','The Observatory. Astronomers and dragons only.')])});
  // ---- the Edge of the World: the Moon Pier (lamps, a mooring post); Dell's boat moors here from m_reforge
  // (the people helper stands Mom, Dell, Quill, Juniper, Tikka and Vesper on the deck between x 13380 and 13640)
  m3wObj('lamp',13345,65406,{v:2}); m3wObj('lamp',13765,65406,{v:2}); m3wObj('pierpost',13768,65494);
  M3WD.pierBoat=m3wObj('boat',13560,65590,{flip:1,pier:true});
  // ---- the Shatterfields: the Fallen Star crater (secret 4: star-iron in the middle)
  for(let i=0;i<14;i++){ const a=i/14*TAU; m3wObj('gspike',12420+Math.cos(a)*168,60540+Math.sin(a)*150,{v:(i%2)?2:3}); }
  m3wObj('star',12420,60560);
  m3wLM(B,{id:'m_sec_crater',k:'m_lm',x:12420,y:60560,r:0,clr:30,prompt:S('Pick up the fallen star','Pick up the star'),hidden:()=>!!G.found.m_sec_crater,draw:()=>{},act:()=>m3wStarIron()});
  m3wLM(B,{id:'m_lm_climbout',k:'m_lm',x:12420,y:60650,r:0,clr:20,prompt:S('Climb out over the spikes','Climb out'),draw:()=>{},act:()=>{ ELEV.hopTo(12420,60800,'down'); m3wSnd('tinkle'); }});
  // the wind ribbons over the mesas (Act III's Wind Riding; bible 3.4)
  if(typeof WIND!=='undefined'&&WIND.stream){
    WIND.stream({id:'m_rib_mesa1',pts:[[12450,61600],[12430,61150],[12420,60560],[12700,60640],[12860,60820]],w:60,speed:400,lv:[0,3]});
    WIND.stream({id:'m_rib_mesa2',pts:[[13100,61400],[13180,61620],[13250,61850]],w:60,speed:400,lv:[0,3]});
    WIND.stream({id:'m_rib_mesa3',pts:[[12750,61000],[12450,61080],[12150,61250]],w:60,speed:400,lv:[3,3]});
  }
  // ---- chests in places that need a power (bible 3.7 plus the elevation)
  for(const [id,x,y] of [['m_ch_ridge1',7420,63228],['m_ch_ridge2',7400,67828],['m_ch_highdune',9480,65400],['m_ch_mesa1',12000,61250],['m_ch_mesa2',12900,60760],['m_ch_mesa3',13300,61960],
    ['m_ch_palmhill',3240,66450],['m_ch_turtle',4880,63690],['m_ch_heights',12520,63520],['m_ch_gull',1060,61900]]) CHESTS.push({id,x,y,b:mapAt(y)===3?m3wRegion(x,y,0):31,open:false});
  // ---- signs
  B.sign('m_sign_dock',1520,64748,S('DRIFTWOOD LANDING. The only town that is never in the same place twice. Mind the gaps. Mind ALL the gaps.','DRIFTWOOD LANDING. Mind the gaps!'));
  B.sign('m_sign_shoals',2870,63780,S('THE SPIRE SHOALS. Walk the sandbars north. The last bit is deep. Swing if you can.','Walk the sandbars. The end is deep.'));
  B.sign('m_sign_strand',6990,65470,S('THE TIDEGLASS STRAND. East, the Caravan Road to the Oasis of Sable. North, the Whale Bones. Mind the hot glass.','Sable is east. Hot glass!'));
  B.sign('m_sign_sable',9150,67440,S('THE OASIS OF SABLE. Water, shade and stories. Do not touch the well.','SABLE. Do not touch the well.'));
  B.sign('m_sign_north',9900,66930,S('North: the Wormfields and the Worm Mouth. Bring water. Bring a hat. Bring a bigger hat.','North: the Worm Mouth. Bring a hat!'));
  B.sign('m_sign_worm',10380,63300,S('THE WORM MOUTH. Quicksand all round. Worms are not rude. They are just hungry.','THE WORM MOUTH. Quicksand!'));
  B.sign('m_sign_gap',10620,67380,S('THE GLASSWALL. Nobody can climb it. Nobody can fly over it. (Worms go under it.)','THE GLASSWALL. Worms go under it.'));
  B.sign('m_sign_flats',11190,67360,S('THE MIRROR FLATS. Do not believe the lakes.','Do not believe the lakes!'));
  B.sign('m_sign_moonpath',12300,65490,S('THE MOONPATH. Lumen\'s astronomers climbed it by moonlight. Bring your own.','THE MOONPATH. Bring your own moonlight.'));
  B.sign('m_sign_pier',13300,65380,S('THE EDGE OF THE WORLD. Lumen\'s old Moon Pier. No ship has come in a very long time.','THE EDGE OF THE WORLD.'));
}
// ---------- the new powers out in the open (side places, each with a chest): moon-glass over the Silver Rift, a moon
// door and its moth glyphs at the Moth's Eye Hollow, shadow tendrils on the Heights, the fenced Caravan Store (burrow
// under), buried chests, three packed-sand secrets (the Worm Tunnel from m_noodle), the Glass Needle (Claws, Grapple)
const M3W_PACKED=[[8100,62700],[9700,64700],[8400,68400]];
const M3W_STORE={x:8050,y:66680,w:280,h:220};
function m3wPuzzles(B){
  // the Silver Rift (Mirror Flats): Moonfire the standing stone (it holds the bridge 15 s) or the hidden glass (6 s)
  const R=M3W_RIFT;
  // (hidden: a function, not p4's `true`: every LANDMARK's `hidden` is called as a function by the engine, Pip's sniffing)
  p4Add('moonglass',{id:'m_rift_glass',x0:R.x-R.r1-24,y0:R.y-38,x1:R.x-R.r0+34,y1:R.y+38,hidden:()=>false});
  p4Add('moonstone',{id:'m_rift_stone',x:R.x-R.r1-56,y:R.y+76,dur:15,glass:['m_rift_glass'],beam:{ang:-0.3,len:300,w:26}});
  for(const [i,dx,dy] of [[1,-R.r1-140,-46],[2,-R.r1-130,130]]) p4Add('glyph',{id:'m_rift_glyph'+i,x:R.x+dx,y:R.y+dy,then:()=>m3wTip('riftg',R.x+dx,R.y+dy-30,S('A moth eye, painted in moonlight. It is looking at the stone.','A moth eye. It looks at the stone.'),'#dfe6ff',6)});
  CHESTS.push({id:'m_ch_rift',x:R.x+12,y:R.y+4,b:38,open:false});
  B.sign('m_sign_rift',R.x-R.r1-170,R.y+40,S('THE SILVER RIFT. Lumen walked over it on bridges of moonlight. The moon has gone thin. Bring your own.','A moonlight bridge. Bring your own!'));
  // the Moth's Eye Hollow (Shatterfields): a ring of glass, one doorway shut by rock that only moonlight opens; three
  // moth eyes on the ground outside show where (Moonfire, or Pip's lantern)
  const H=M3W_HOLLOW;
  p4Add('moondoor',{id:'m_hollow_door',x:H.x,y:H.y+(H.r0+H.r1)/2,w:124,h:56});
  for(const [i,dx,dy] of [[1,-180,160],[2,0,236],[3,180,160]]) p4Add('glyph',{id:'m_hollow_glyph'+i,x:H.x+dx,y:H.y+dy,keep:true});
  CHESTS.push({id:'m_ch_hollow',x:H.x,y:H.y-14,b:36,open:false});
  // shadow tendrils round the chest on the Heights' upper shelf (fire makes them flinch 4 s, Moonfire burns them away)
  for(const [i,dx,dy] of [[1,-52,0],[2,52,0],[3,0,-46],[4,0,46]]) p4Add('tendril',{id:'m_tend_h'+i,x:12520+dx,y:63520+dy,r:30});
  // the Caravan Store (Glass Dunes): a yard fenced on every side; the caravan's spare chest sits inside. Burrow under.
  const C=M3W_STORE, x0=C.x-C.w/2, x1=C.x+C.w/2, y0=C.y-C.h/2, y1=C.y+C.h/2;
  p4Add('sandbed',{id:'m_store_sand',x0:x0-60,y0:y0-60,x1:x1+60,y1:y1+60});
  for(const y of [y0,y1]) for(const x of [x0+C.w/4,x0+C.w*3/4]) p4Add('sandwall',{id:`m_store_f${Math.round(x)}_${y}`,x,y,w:C.w/2+4,h:20,style:'fence'});
  for(const x of [x0,x1]) for(const y of [y0+C.h/4,y0+C.h*3/4]) p4Add('sandwall',{id:`m_store_f${x}_${Math.round(y)}`,x,y,w:20,h:C.h/2+4,style:'fence'});
  CHESTS.push({id:'m_ch_store',x:C.x+30,y:C.y+10,b:35,open:false});
  m3wObj('crate',C.x-60,C.y-30,{v:1,fish:0}); m3wObj('barrel',C.x-80,C.y+30,{v:0}); m3wObj('crate',C.x+90,C.y-50,{v:0});
  B.sign('m_sign_store',C.x-40,y0-60,S('CARAVAN STORE. KEEP OUT. (Worms welcome.)','KEEP OUT. Worms welcome.'));
  // buried treasure: one plain buried chest in the Wormfields, and the three packed-sand secrets (Worm Tunnel only)
  p4Add('bchest',{id:'m_bc_worm',x:10470,y:62060,coins:90,xp:60});
  M3W_PACKED.forEach(([x,y],i)=>{ p4Add('bchest',{id:'m_pk_'+(i+1),x,y,coins:120,xp:90,treat:i===2?1:0,m3packed:true});
    ELEV.deco({k:3,bb:[x-70,y-50,x+70,y+50],lvl:0,order:1,paint:g=>m3wPackedPaint(g,x,y)}); });
  // the Glass Needle (Shatterfields): a chest on top
  CHESTS.push({id:'m_ch_needle',x:M3W_NEEDLE.x,y:M3W_NEEDLE.y-10,b:36,open:false});
}
// packed sand: a darker, cracked, wind-polished patch (only the Worm Tunnel digs it)
function m3wPackedPaint(g,x,y){ const rng=mulberry32(Math.floor(x+y)); g.save();
  g.fillStyle='rgba(150,104,52,.45)'; g.beginPath(); for(let i=0;i<=12;i++){ const a=i/12*TAU, r=40+rng()*12; if(i) g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*0.6); else g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r*0.6); } g.closePath(); g.fill();
  g.strokeStyle='rgba(110,70,30,.55)'; g.lineWidth=1.3; for(let i=0;i<6;i++){ const a=rng()*TAU; g.beginPath(); g.moveTo(x+Math.cos(a)*6,y+Math.sin(a)*4); g.lineTo(x+Math.cos(a)*(22+rng()*14),y+Math.sin(a)*(14+rng()*8)); g.stroke(); }
  g.fillStyle='rgba(255,240,200,.35)'; g.beginPath(); g.ellipse(x-10,y-8,14,4,0,0,TAU); g.fill(); g.restore(); }
// packed sand only opens for a worm-strength burrower (G.flags.m_wormtunnel, the m_noodle reward)
// and a chest with `m3after` waits for its moment (the galleon's hold: after Baron Puffington)
{ const base=p4ChestOpen; p4ChestOpen=function(o,buried){
  if(o&&o.m3packed&&!m3wF('m_wormtunnel')){ m3wTip('packed'+o.id,o.x,o.y-30,S('The sand here is packed rock hard. A real worm could dig it.','Too hard! A real worm could dig it.'),'#ffe0b0',4); return; }
  if(o&&o.m3after&&!o.m3after()){ m3wTip('after'+o.id,o.x,o.y-30,o.m3wait||S('Not yet.','Not yet.'),'#dfe8ff',4); return; }
  return base(o,buried); }; }

// ---------- Driftwood Landing (a raft town) and the Oasis of Sable: furniture, lamps, boats, palms, the Moon Well
// one more lantern per bite out of the moon (THREADS 4.3), kept clear of x3_people's twelve named Sable lamps and of
// the spots where people stand
const M3W_BITEL={drift:[[2160,64575],[2430,64935],[1600,64860],[2900,64580],[1960,64460],[2330,65180]],sable:[[9800,67995],[10044,67894],[9476,67768],[9476,67532],[10133,67561],[10290,68066]]};
function m3wTowns(B){
  const DW='m_driftwood';
  // raft lanterns (paper lanterns on driftwood posts), and one more for each bite out of the moon
  for(const [x,y] of [[1980,64575],[2635,64575],[1980,64935],[2640,64935],[1100,64735],[1940,64870],[1720,64315],[2940,64665],[2490,65190]]) m3wObj('lamp',x,y,{v:1,bob:1});
  M3W_BITEL.drift.forEach(([x,y],i)=>m3wObj('lamp',x,y,{v:1,bite:i+1,bob:1}));
  // barrels and crates, nets, rope coils, a fish stall, bunting over the Town Raft
  for(const [k,x,y,v,f] of [['barrel',1990,64870,0],['barrel',2010,64885,1],['crate',2190,64900,0,1],['crate',2215,64890,1],['net',2100,64600],['barrel',2455,64925,1],['crate',1200,64850,0,1],['barrel',1240,64860,1],['net',1380,64740],
    ['barrel',1730,64420,0],['crate',2700,64775,1],['barrel',2672,64760,0],['crate',2530,65055,0,1],['net',1590,64610]]) m3wObj(k,x,y,{v,fish:f,bob:1});
  m3wObj('bunting',1975,64566,{x2:2440,y2:64566,v:0,bx:2200}); m3wObj('bunting',2000,64900,{x2:2350,y2:64905,v:2,bx:2175}); m3wObj('bunting',1150,64760,{x2:1900,y2:64760,v:4,bx:1525});
  m3wObj('mast',2300,64690,{base:64702});
  // Sister Wren's Reading Raft (a pile of wet books under a sun umbrella; Wren reads at 2425,65080) and Mags' workbench
  m3wObj('books',2462,65022); m3wObj('bench',1460,64770);
  // palms on the anchor isles (the town clears the wild ones)
  for(const [x,y,v,s] of [[1880,64410,0,1],[2100,64360,1,0.9],[2425,64325,2,1.05],[2190,64165,0,0.9],[2700,65160,1,1],[2610,65150,2,0.85],[1860,64650,2,0.8],[2185,64330,1,0.8]]) m3wObj('prop',x,y,{pk:'m_palm',v,s});
  // skiffs tied up round the rafts, Dell's boat at the West Dock (until he sails off to fetch Mom)
  for(const [x,y,a,c,sail] of [[1640,64940,0.2,'#e8a030',0],[2730,64880,-0.3,'#3a8aaa',1],[2560,64480,0.4,'#c84a3a',0],[1480,64640,-0.1,'#7ac04a',1],[3020,64900,0.3,'#e8a030',0],[2150,65230,-0.2,'#3a8aaa',0]]) m3wObj('skiff',x,y,{a,c,sail});
  M3WD.dockBoat=m3wObj('boat',1380,64950,{dock:true});
  // ---- the Oasis of Sable
  m3wObj('well',9800,67650,{base:67660});
  for(const [x,y,v,s] of [[9600,67470,0,1.1],[9965,67505,1,1],[9560,67812,2,1.05],[10010,67835,0,1],[9700,67400,1,0.9],[9900,67900,2,0.9],[9520,67650,0,0.85],[10080,67660,1,0.85],[9300,67560,2,1],[10300,67700,0,1],[9850,67120,1,0.9],[9700,68320,2,1]]) m3wObj('prop',x,y,{pk:'m_palm',v,s});
  for(const [x,y,v] of [[9500,67980,0],[9620,68030,1],[9980,68050,2],[10110,68030,3],[9330,67430,3]]) m3wObj('stall',x,y,{v});
  m3wObj('pen',10380,68300,{base:68250}); for(const [x,y,f] of [[10330,68300,1],[10440,68290,-1],[10380,68330,1]]) m3wObj('strider',x,y,{f});
  m3wObj('strider',9150,67520,{f:-1}); m3wObj('strider',10560,67600,{f:1});
  M3WD.furnace=m3wObj('furnace',10150,67352,{base:67358});
  M3W_BITEL.sable.forEach(([x,y],i)=>m3wObj('lamp',x,y,{v:0,bite:i+1,sable:true}));
  for(const [k,x,y,v] of [['barrel',9330,67350,0],['crate',9370,67360,1],['barrel',10480,67760,1],['crate',10200,67100,0],['barrel',9180,67970,0]]) m3wObj(k,x,y,{v});
  // (Sable's twelve named lamps, Bertha to Little Sun, are x3_people's: side quest m_lamps draws and lights them, and the
  // tallest palm with Coco on top. The per-bite lights above go out after eclipse 2 until the twelve are lit again.)
  // the Moon Well is bright, then dim after eclipse 2
}
// ---------- the secrets (bible 3.7) that are more than a chest
function m3wSecrets(B){
  // 1: Turtleback Isle is Great-Grandma Shellby: a gentle breath (normal fire, not Blaze) on her nose from her shell
  m3wLM(B,{id:'m_sec_turtle',k:'m_lm',x:4800,y:63318,r:0,clr:60,prompt:S('Look at the big round rock','Look at the rock'),hidden:()=>false,draw:()=>{},act:()=>m3wTurtleTalk()});
  // 5: the Mirage Oasis: a fake oasis that fades as you come near; at night Moonfire shows a real chest in the middle
  m3wObj('mirage',8700,70300,{r:160,base:69900,oasis:true});
  m3wLM(B,{id:'m_sec_mirage',k:'m_lm',x:8700,y:70300,r:0,clr:200,prompt:S('Open the pearl chest','Open the chest'),hidden:()=>!G.found.m_sec_mirage_seen||!!G.found.m_sec_mirage,draw:(o,t)=>m3wDrawPearlChest(o,t),act:()=>m3wMirageChest()});
  // 6: Firefly Hollow in the Mangroves: light the old lamp on the stump
  m3wObj('stump',2600,69480);
  // 8: the edge of the Edge, at the far rail of the Star Terrace
  m3wLM(B,{id:'m_sec_edge',k:'m_lm',x:13700,y:64050,r:0,clr:30,prompt:S('Sit','Sit'),draw:(o,t)=>{ if(!G.found.m_sec_edge&&inView(o.x,o.y,100)) glowAt(o.x,o.y-10,18,'220,230,255',0.15+0.1*Math.sin(t*2)); },act:()=>m3wEdgeSit()});
  // the Driftwood Lagoon's drifting raft (decor; a raft full of chickens now and then) is in the runtime
}
function m3wDrawPearlChest(o,t){ if(!G.found.m_sec_mirage_seen||G.found.m_sec_mirage) return; m3wPut(m3wTall('pearlchest',50,44,25,30,g=>{ m3wEll(g,2,6,18,5,'rgba(40,40,80,.3)'); m3wShade(g,-16,-12,32,18,'#5a6aa8',3); m3wRect(g,-16,-16,32,6,'#7a8ac8',3); m3wRect(g,-2,-12,4,8,'#e8c040'); celBall(g,0,-20,6,'#f6f2ff',['#ffffff','#f6f2ff','#c8c0e0']); }),o.x,o.y); glowAt(o.x,o.y-14,26,'230,236,255',0.3+0.15*Math.sin(t*3)); }
function m3wMirageChest(){ if(G.found.m_sec_mirage) return; G.found.m_sec_mirage=1; SFX.play('chest'); addCoins(180,8700,70300); G.pendingBless=(G.pendingBless||0)+1;
  m3wSay([S('In the middle of the mirage, a real chest, cold as moonlight. Inside: a pearl as big as your fist.','A real chest! A pearl as big as your fist!')],()=>later(0.6,offerPending)); }
function m3wTurtleTalk(){
  if(!G.found.m_sec_turtle){ m3wSay([S('A huge round rock covered in barnacles and sea moss. It is breathing. Slowly. It might like a warm breath on the nose. A gentle one.','A huge rock. It is breathing! A gentle warm breath?')]); return; }
  if(G.found.m_sec_turtle==='awake'){ G.found.m_sec_turtle='talked';
    runDialogue([['m_greatshell',S('I remember Lumen before it sank. Lamps in every window. Terrible music.','I remember Lumen. Lamps everywhere. Bad music.')],
      ['m_greatshell',S('My great-grandson remembers it too, but he was only a baby. Two hundred. He mostly remembers the snacks.','My great-grandson was a baby then. He remembers snacks.')]],()=>{ scene='play'; saveGame(); }); return; }
  m3wSay([S('Great-Grandma Shellby is asleep again, smiling.','Shellby is asleep. Smiling.')]);
}
function m3wTurtleWake(blaze){
  if(blaze){ if(!M3WD.tips.turtleOw||G.time-M3WD.tips.turtleOw>4){ M3WD.tips.turtleOw=G.time; runDialogue([['m_greatshell',S('OW. Rude.','OW. Rude.')]],()=>{ scene='play'; }); } return; }
  if(G.found.m_sec_turtle) return; G.found.m_sec_turtle='awake'; m3wSnd('rumble'); shake(3);
  runDialogue([['narr',S('The rock opens one enormous eye.','The rock opens one huge eye!')],
    ['m_greatshell',S('...Is that my great-grandson\'s friend? Tell that boy to write. Four hundred years and not one letter.','Are you my great-grandson\'s friend? Tell him to write!')],
    ['narr',S('She sneezes out a pearl as big as a plum, and a little seaweed snack for Pip.','She sneezes out a pearl and a snack for Pip.')]],()=>{ scene='play'; addCoins(120,4800,63318); G.pipTreats=Math.min(3,(G.pipTreats||0)+1); saveGame(); });
}
function m3wStarIron(){
  if(G.found.m_sec_crater) return; G.found.m_sec_crater=1; SFX.play('chest'); shake(2);
  if(typeof ITEM_NAMES!=='undefined'&&!ITEM_NAMES.m_stariron) ITEM_NAMES.m_stariron=S('Star-iron (a fallen star)','Star-iron');
  m3wSay([S('In the middle of the crater, still warm, sits a lump of iron that fell from the sky. It hums very quietly.','Iron from the sky! It hums.'),S('A blacksmith would know what to do with this. Mom would.','Mom would love this.')],()=>giveItems({m_stariron:1}));
}
function m3wEdgeSit(){
  if(G.found.m_sec_edge){ m3wSay([S('You sit on the edge of the Edge for a while. The stars do not mind.','You sit and watch the stars.')]); return; }
  G.found.m_sec_edge=1;
  runDialogue([['narr',S('You sit on the very edge of the Star Terrace with your feet over the dark sea. The stars go all the way down to the water.','You sit on the edge. Stars everywhere.')],
    ['iska',S('I used to sit like this with Ember. She said the edge of the world isn\'t where the world ends. It\'s where you can see the most of it.','Ember said: the edge is where you see the most.')]],()=>{ scene='play'; G.pendingBless=(G.pendingBless||0)+1; later(0.6,offerPending); saveGame(); });
}
function m3wFirefly(){
  if(G.found.m_sec_fireflies) return; G.found.m_sec_fireflies=1; m3wSnd('tinkle'); m3wSnd('moon');
  for(let i=0;i<60;i++) emit(2600+rand(-60,60),69440+rand(-30,30),1,{col:'210,255,150',ang:-Math.PI/2+rand(-1,1),spread:0.6,smin:20,smax:120,lmin:1,lmax:2.4,zmin:1.4,zmax:2.4,rise:20});
  runDialogue([['narr',S('The old lamp flickers on, and a thousand fireflies rise out of the roots like sparks.','The lamp lights. A thousand fireflies rise!')],
    ['narr',S('One of them is the size of a grape and wears a tiny crown. The Firefly Queen bows, and drops a crown of lights on your head.','The Firefly Queen gives you a crown of lights!')],
    ['iska',S('Fireflies and moths. Cousins. These ones turned out nice.','Fireflies and moths are cousins. These are nice.')]],()=>{ scene='play'; m3wHat('m_hat_firefly'); setBanner(S('Firefly Crown','Firefly Crown'),S('A crown of tiny lights. Very regal.','A crown of lights!'),2.6); saveGame(); });
}
// the two hats of the secrets (bible m_hat_pirate, m_hat_firefly; worn like the Sky Feather: the hat's name is its key,
// the bible id is kept as an item so other modules can ask)
const M3W_HATS={m_hat_pirate:'Pirate Hat',m_hat_firefly:'Firefly Crown'};
function m3wHat(id){ const h=M3W_HATS[id]; if(!h) return; G.hats=G.hats||{}; G.hats[h]=true; G.hat=h; G.items=G.items||{}; G.items[id]=1; }
if(typeof ITEM_NAMES!=='undefined'){ ITEM_NAMES.m_hat_pirate=ITEM_NAMES.m_hat_pirate||S('A damp pirate captain\'s hat','A pirate hat'); ITEM_NAMES.m_hat_firefly=ITEM_NAMES.m_hat_firefly||S('The Firefly Crown (a crown of tiny lights)','The Firefly Crown'); }
{ const base=drawHatShape; drawHatShape=function(x,y,k,s){
  if(k==='Pirate Hat'||k==='Firefly Crown'){ s=s||1; ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
    if(k==='Pirate Hat'){ ctx.fillStyle='#1e1e24'; ctx.beginPath(); ctx.moveTo(-10,-3); ctx.lineTo(0,-8); ctx.lineTo(10,-3); ctx.lineTo(6,6); ctx.lineTo(-6,6); ctx.closePath(); ctx.fill(); ctx.fillStyle='#34343c'; ctx.beginPath(); ctx.arc(0,0,4.6,0,TAU); ctx.fill(); ctx.fillStyle='#f4f2ea'; ctx.beginPath(); ctx.arc(0,-1,1.8,0,TAU); ctx.fill(); }
    else { const t=G?G.time:0; for(let i=0;i<8;i++){ const a=i/8*TAU+t*0.6, on=0.6+0.4*Math.sin(t*4+i*1.7); ctx.fillStyle=`rgba(220,255,140,${on})`; ctx.beginPath(); ctx.arc(Math.cos(a)*6.5,Math.sin(a)*6.5,1.9,0,TAU); ctx.fill(); } }
    ctx.restore(); return; }
  return base(x,y,k,s); }; }
if(typeof ashHat==='function'){ const base=ashHat; ashHat=function(k){ const z0=6.2;
  if(k==='Pirate Hat'){ aE(0,0,z0+0.2,10.6,8.6,1.0,'#1e1e24'); aE(0,0,z0+2.4,6.2,6.2,3.4,'#2a2a32'); aB(5.6,0,z0+2.6,1.5,'#f4f2ea',0.02); return; }
  if(k==='Firefly Crown'){ for(let i=0;i<8;i++){ const a=i/8*TAU, x=Math.cos(a)*6.4, y=Math.sin(a)*6.9, z=4.8-Math.cos(a)*1.3; aB(x,y,z,1.5,i%2?'#e8ff9a':'#c8f070',0.02); } return; }
  return base(k); }; }
// the Burrow Gap opens once the story reaches the Glasswall and the second eclipse is over (bible 6.0)
function m3wGapOpen(){ if(!m3wStage('m_glasswall')) return true; return reached('m_glasswall')&&m3wF('m_eclipse2'); }
// a Moonpath brazier lit for good. The story module counts them (m3sBeat('brazier',id) sets G.flags.m_moonpath_lit and
// shows its banners); without it the world counts them itself. Either way m_moonpath_lit is the number of braziers lit.
const M3W_BRAZID=['foot','bend1','bend2'];
function m3wBrazLit(i){
  m3wSnd('moon'); shake(2);
  if(typeof m3sBeat==='function'){ try{ m3sBeat('brazier',M3W_BRAZID[i]); }catch(e){ console.error('m3w brazier',e); } }
  const n=m3wPathLit(); if(n>(G.flags.m_moonpath_lit|0)) G.flags.m_moonpath_lit=n;
  if(typeof m3sBeat!=='function'){
    if(n>=3) setBanner(S('The Moonpath is lit','The Moonpath is lit'),S('The last brazier flares silver. At the top of the Heights, a great door swings open.','A great door opens at the top!'),3.4);
    else setBanner(S('A moon brazier','A moon brazier'),S(`The stairs of this flight hold now. ${n} of 3 lit.`,`${n} of 3 lit.`),2.4); }
  saveGame();
}

// ================= 7. Coralcombe (the merfolk village under the reef, bible 4.2) and the placeholder dungeons
// Four free rooms on the seafloor inside a bubble of air pearls (Ash breathes freely here): the Shell Hall (start; the
// swim-up current out is its south door), the Kelp Garden (west), the Pearl Archive (north), the Racing Reef (east).
// The merfolk are x3_people's (SPECIAL people, inside:'m_coralcombe'); their spots are M3W_CORAL.spots (room, column, row).
const M3W_CORAL={
  rooms:{
    a:{at:[1,1],kind:'start',tpl:['...............','.#####...#####.','.#*.........*#.','.#...........#.','...............','...............','...............','.##.........##.','.#*.........*#.','.#...........#.','...............'],noPots:true,
      sign:S('CORALCOMBE. Home of the Lumenfolk. Please do not splash the Queen.','CORALCOMBE. Do not splash the Queen.')},
    b:{at:[0,1],kind:'free',tpl:['...............','..#...#...#....','..#...#...#....','...............','*.....#.....*..','...............','..#.......#....','..#...#...#....','......#........','..*.......*....','...............'],noPots:true},
    c:{at:[1,0],kind:'free',tpl:['...............','.#####.#.#####.','...............','.####..*..####.','...............','.####.....####.','...............','.####.....####.','..*.........*..','...............','...............'],noPots:true},
    d:{at:[2,1],kind:'free',tpl:['...............','..#.........#..','...............','....#.....#....','*.............*','...............','....#.....#....','...............','..#....X....#..','...............','...............'],noPots:true,loot:['treasure']}
  },
  links:[['a','b','open'],['a','c','open'],['a','d','open']],
  spots:{m_coralia:['a',7,2],m_kipper:['a',9,8],m_kelp:['b',7,5],m_ripple:['c',7,4],m_rocket:['d',7,5]},
  kelp:{a:[[3,4],[11,4],[3,6],[11,6]],b:[[1,1],[5,1],[9,1],[13,3],[1,7],[5,9],[9,7],[12,9]],c:[[6,1],[8,1]],d:[[1,1],[13,1],[3,3],[11,3],[3,6],[11,6]]}
};
// a cell of a Coralcombe room to area coordinates (only while Ash is inside: the area is built when he enters)
function m3wCoralSpot(room,c,r){ const A=AREA; if(!A||!A.cave||!A.def||A.def.id!=='m_coralcombe') return null; const R=M3W_CORAL.rooms[room]; if(!R) return null; const i=R.at[0]*16+1+c, j=R.at[1]*12+1+r; return {x:A.x0+(i+0.5)*A.cave.cell,y:A.y0+(j+0.5)*A.cave.cell}; }
if(typeof defineDungeonTheme==='function') defineDungeonTheme('m_coral',{style:{floor:'#5aa0a2',floor2:'#529698',top:'#f08aa8',face:'#a8486a',edge:'#ffd8e0',water:'#2a6a8a',accent:'#a8f4ff'},decor:'shell',music:'m_deep'});
if(typeof R2CAVE!=='undefined'){ R2CAVE.m_dune={rk:['#c8954a','#b07e3a','#dcaa5e'],top:'#e8c070',dark:'#1a0e06'}; R2CAVE.m_coral={rk:['#c86a8a','#a8486a','#e08aa8'],top:'#f0b0c0',dark:'#08141c'}; }
function m3wCoralDefine(){
  if(AREADEFS.m_coralcombe&&!AREADEFS.m_coralcombe.m3w) return;
  try{ defineDungeon('m_coralcombe',{name:S('Coralcombe','Coralcombe'),level:17,theme:'m_coral',seed:4171,save:'m_coralcombe',dark:0.12,noJuniper:true,dunKind:S('The merfolk village','The merfolk village'),
    floors:[{id:'1',name:S('Coralcombe','Coralcombe'),map:{rooms:M3W_CORAL.rooms,links:M3W_CORAL.links}}]}); if(AREADEFS.m_coralcombe) AREADEFS.m_coralcombe.m3w=true; }catch(e){ console.error('m3w coralcombe',e); }
}
const M3W_PH_TPL=['...............','...............','...............','.....s.........','...............','...............','...............','...............','...............','...............','...............'];
function m3wPlaceholders(){
  M3WD.ph=[];
  m3wCoralDefine();
  for(const id in M3W_AREAS){ if(AREADEFS[id]) continue; const [name,level,theme]=M3W_AREAS[id];
    try{ defineDungeon(id,{name,level,theme:theme==='m_coral'?'m_coral':'earth',seed:7900+id.length*13,save:id,placeholder:true,dark:0.2,noJuniper:true,
      floors:[{id:'1',name,map:{rooms:{a:{at:[0,0],kind:'start',tpl:M3W_PH_TPL,noPots:true,sign:S(`PLACEHOLDER: ${name} is being built. Come back soon!`,`${name} is not built yet.`)}},links:[]}}]}); M3WD.ph.push(id); }
    catch(e){ defCave(id,{name,level,theme:'earth',seed:7900,enemies:[],placeholder:true}); M3WD.ph.push(id); }
  }
}
// ================= 8. ground art painted into the chunks (ELEV.deco, in level order)
function m3wRaftPaint(g,R){
  const [x0,y0,x1,y1]=R.r, w=x1-x0, h=y1-y0, rng=mulberry32(Math.floor(x0*3+y0)), vert=h>w;
  g.save();
  // barrels under the deck (floats), then the planks in a colour of their own, a rope edge
  g.fillStyle='rgba(20,60,80,.28)'; rrect(g,x0+4,y0+8,w,h,6); g.fill();
  if(!R.plank) for(let i=0;i<Math.max(2,Math.round(w/70));i++) for(const yy of [y1+2]){ const bx=x0+16+i*(w-32)/Math.max(1,Math.round(w/70)-1||1); g.fillStyle=SBC.outline; g.beginPath(); g.ellipse(bx,yy,13,6,0,0,TAU); g.fill(); g.fillStyle='#7a5634'; g.beginPath(); g.ellipse(bx,yy-1,11,4.6,0,0,TAU); g.fill(); g.fillStyle='#c8963a'; g.fillRect(bx-11,yy-2,22,1.6); }
  const cols=R.plank?['#a07848','#b08a5a']:R.id==='town'?['#c89a62','#b88a54']:R.id==='dock'?['#a8845a','#98764e']:[['#c8a070','#b8905e'],['#d8b080','#c49a6a'],['#8cc4bc','#7eb4ac'],['#e8a890','#d8987e'],['#b8a888','#a89878']][Math.floor(rng()*5)];
  g.fillStyle=SBC.outline; rrect(g,x0-2,y0-2,w+4,h+4,5); g.fill();
  const n=Math.ceil((vert?h:w)/12);
  for(let i=0;i<n;i++){ g.fillStyle=cols[i%2]; if(vert) g.fillRect(x0,y0+i*12,w,11); else g.fillRect(x0+i*12,y0,11,h); }
  g.fillStyle='rgba(255,250,230,.22)'; if(vert) g.fillRect(x0,y0,w*0.3,h); else g.fillRect(x0,y0,w,h*0.25);
  g.fillStyle='rgba(60,40,20,.35)'; for(let i=0;i<n;i+=3){ if(vert) g.fillRect(x0+3,y0+i*12+5,2,2); else g.fillRect(x0+i*12+5,y0+3,2,2); }
  if(!R.plank){ g.strokeStyle='#d8c8a0'; g.lineWidth=2; g.setLineDash([5,4]); g.strokeRect(x0+3,y0+3,w-6,h-6); g.setLineDash([]); }
  g.restore();
}
function m3wPierPaint(g){
  const P=M3WG.pier; g.save();
  g.fillStyle='rgba(10,20,60,.3)'; g.fillRect(P.x0+6,P.y0+10,P.x1-P.x0,P.y1-P.y0);
  g.fillStyle=SBC.outline; rrect(g,P.x0-3,P.y0-3,P.x1-P.x0+6,P.y1-P.y0+6,6); g.fill();
  for(let x=P.x0;x<P.x1;x+=30){ g.fillStyle=(x/30|0)%2?'#e6e4f0':'#dcdae8'; g.fillRect(x,P.y0,30,P.y1-P.y0); g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(x,P.y0,30,8); g.fillStyle='rgba(120,110,160,.35)'; g.fillRect(x+29,P.y0,1.5,P.y1-P.y0); }
  // the old moon mosaic in the middle, and the round platform at the end where the bridge will start
  g.fillStyle='#b8c4f0'; g.beginPath(); g.arc(13560,65450,26,0,TAU); g.fill(); g.fillStyle='#e6e4f0'; g.beginPath(); g.arc(13570,65444,22,0,TAU); g.fill();
  g.strokeStyle='rgba(150,160,220,.8)'; g.lineWidth=2; g.beginPath(); g.arc(13700,65450,40,0,TAU); g.stroke();
  for(let i=0;i<8;i++){ const a=i/8*TAU; g.fillStyle='#c8d4ff'; g.beginPath(); g.arc(13700+Math.cos(a)*34,65450+Math.sin(a)*34,2.6,0,TAU); g.fill(); }
  g.restore();
}
// coral heads round the Coralcombe ring, sand ripples on the bottom, the dark hole in the middle
function m3wCoralPaint(g){
  const [cx,cy]=M3WG.coral, rng=mulberry32(4401); g.save();
  g.fillStyle='rgba(10,30,60,.35)'; g.beginPath(); g.arc(cx,cy,170,0,TAU); g.fill(); g.fillStyle='rgba(6,20,44,.4)'; g.beginPath(); g.arc(cx,cy,120,0,TAU); g.fill();
  for(let i=0;i<70;i++){ const a=rng()*TAU, d=215+rng()*170, x=cx+Math.cos(a)*d, y=cy+Math.sin(a)*d, r=6+rng()*12, c=[M3WPAL.coralP,M3WPAL.coralO,M3WPAL.coralV][i%3];
    g.fillStyle='rgba(40,80,90,.3)'; g.beginPath(); g.ellipse(x+2,y+3,r,r*0.7,0,0,TAU); g.fill(); g.fillStyle=c[0]; g.beginPath(); g.ellipse(x,y,r,r*0.75,0,0,TAU); g.fill(); g.fillStyle=c[1]; g.beginPath(); g.ellipse(x-r*0.2,y-r*0.2,r*0.7,r*0.5,0,0,TAU); g.fill(); g.fillStyle=c[2]; g.beginPath(); g.arc(x-r*0.35,y-r*0.3,r*0.22,0,TAU); g.fill(); }
  g.restore();
}
// drowned Old Lumen under the Drowned Reach: pale streets, moon mosaics, column bases, glowing round windows
const M3W_RUINS=[[1700,60700,1],[2300,61500,0],[3100,60800,2],[3900,61400,1],[4600,60700,0],[5200,61300,2],[2900,61900,0],[4400,61900,1],[1500,61500,2],[3600,60500,0]];
function m3wRuinsPaint(g){
  g.save();
  for(const [x,y,v] of M3W_RUINS){ const rng=mulberry32(x+y);
    g.globalAlpha=0.32; g.strokeStyle='#c8d4f0'; g.lineWidth=10; g.beginPath(); g.moveTo(x-260,y); g.lineTo(x+260,y); g.moveTo(x,y-200); g.lineTo(x,y+200); g.stroke();
    g.globalAlpha=0.4; g.fillStyle='#d8e0f8'; g.beginPath(); g.arc(x,y,70,0,TAU); g.fill(); g.globalAlpha=0.5; g.fillStyle='#7a90c8'; g.beginPath(); g.arc(x,y,52,0,TAU); g.fill(); g.fillStyle='#d8e0f8'; g.beginPath(); g.arc(x+(v-1)*14,y-6,44,0,TAU); g.fill();
    g.globalAlpha=0.34; g.fillStyle='#e6ecff'; for(let i=0;i<8;i++){ const a=i/8*TAU+rng(); g.beginPath(); g.arc(x+Math.cos(a)*150,y+Math.sin(a)*120,14,0,TAU); g.fill(); }
    for(let i=0;i<5;i++){ const hx=x+(rng()-0.5)*420, hy=y+(rng()-0.5)*320; g.fillRect(hx-30,hy-20,60,40); g.globalAlpha=0.5; g.fillStyle='#9ab8f0'; g.beginPath(); g.arc(hx,hy-4,7,0,TAU); g.fill(); g.globalAlpha=0.34; g.fillStyle='#e6ecff'; } }
  g.restore();
}
// the Reefwall's coral crest (bright coral heads along both edges, the white surf line drawn by the look)
function m3wReefPaint(g,y0,y1){
  const rng=mulberry32(Math.floor(y0)); g.save();
  for(let y=y0;y<y1;y+=14){ for(let k=0;k<3;k++){ const x=lerp(6110,6340,rng()), yy=y+rng()*14; if(!m3wReefIn(x,yy)) continue; const r=4+rng()*8, c=[M3WPAL.coralP,M3WPAL.coralO,M3WPAL.coralV,M3WPAL.coralP][Math.floor(rng()*4)];
    g.fillStyle=c[0]; g.beginPath(); g.ellipse(x,yy,r,r*0.75,0,0,TAU); g.fill(); g.fillStyle=c[1]; g.beginPath(); g.ellipse(x-r*0.2,yy-r*0.2,r*0.7,r*0.5,0,0,TAU); g.fill(); if(r>8){ g.fillStyle=c[2]; g.beginPath(); g.arc(x-r*0.3,yy-r*0.3,r*0.25,0,TAU); g.fill(); } } }
  g.restore();
}
// the mangrove root walkways: tangled roots between the isles
function m3wRootPaint(g,a,b){
  const rng=mulberry32(a[0]+b[1]); g.save(); g.lineCap='round';
  for(let k=0;k<4;k++){ g.strokeStyle=SBC.outline; g.lineWidth=12-k*2; const off=(k-1.5)*9; g.beginPath(); g.moveTo(a[0],a[1]+off); for(let i=1;i<=6;i++){ const t=i/6; g.lineTo(lerp(a[0],b[0],t)+(rng()-0.5)*14,lerp(a[1],b[1],t)+off+(rng()-0.5)*10); } g.stroke(); g.strokeStyle=k%2?'#6a4a30':'#8a6a44'; g.lineWidth=8-k*2; g.stroke(); }
  g.restore();
}
// Sable's plaza: pale paving round the pool, the market square, the caravan gate
function m3wSablePaint(g){
  g.save(); const cx=9800, cy=67650;
  g.fillStyle='rgba(250,236,200,.55)'; g.beginPath(); g.ellipse(cx,cy,330,315,0,0,TAU); g.fill();
  g.strokeStyle='rgba(200,150,90,.6)'; g.lineWidth=3; g.beginPath(); g.ellipse(cx,cy,330,315,0,0,TAU); g.stroke();
  g.strokeStyle='rgba(200,170,120,.4)'; g.lineWidth=1.4; for(let r=245;r<330;r+=24){ g.beginPath(); g.ellipse(cx,cy,r,r*0.95,0,0,TAU); g.stroke(); }
  g.fillStyle='rgba(250,236,200,.5)'; rrect(g,9420,67920,760,170,40); g.fill();
  // glass inlays (moon-blue) in the paving, catching the light
  for(let i=0;i<24;i++){ const a=i/24*TAU; g.fillStyle='rgba(170,200,240,.8)'; g.beginPath(); g.arc(cx+Math.cos(a)*300,cy+Math.sin(a)*286,4,0,TAU); g.fill(); }
  g.restore();
}
// the Burrow Gap: a sandy dip under the glass with worm tracks
function m3wGapPaint(g){ const Gp=M3WG.gap; g.save(); g.strokeStyle='rgba(140,100,50,.5)'; g.lineWidth=3; g.setLineDash([10,8]); g.beginPath(); g.moveTo(10480,Gp.y+10); g.quadraticCurveTo(10900,Gp.y-30,11320,Gp.y+10); g.stroke(); g.setLineDash([]); g.restore(); }
// the Silver Rift: the crack drawn crisply over the ground (a lit lip, the far wall going down, the dark with stars in
// it, the island's own wall); the terrain under it says the same thing at 8 px
function m3wRiftPaint(g){
  const R=M3W_RIFT, n=120, ro=a=>R.r1*(1+0.05*Math.sin(a*4)+0.03*Math.sin(a*9)), ri=a=>R.r0*(1+0.07*Math.sin(a*5+1)), P=(a,r)=>[R.x+Math.cos(a)*r,R.y+Math.sin(a)*r];
  const ring=(f,k)=>{ g.beginPath(); for(let i=0;i<=n;i++){ const a=i/n*TAU, p=P(a,f(a)*k); if(i) g.lineTo(p[0],p[1]); else g.moveTo(p[0],p[1]); } g.closePath(); };
  g.save();
  // the dark: the whole ring, then the island cut back out (even-odd)
  g.beginPath(); for(let i=0;i<=n;i++){ const a=i/n*TAU, p=P(a,ro(a)); if(i) g.lineTo(p[0],p[1]); else g.moveTo(p[0],p[1]); } g.closePath();
  for(let i=n;i>=0;i--){ const a=i/n*TAU, p=P(a,ri(a)); if(i===n) g.moveTo(p[0],p[1]); else g.lineTo(p[0],p[1]); } g.closePath();
  g.fillStyle='#1c1534'; g.fill('evenodd');
  g.save(); g.clip('evenodd');
  // the far wall (the north half of the outer edge faces us): violet bands going down into the dark
  g.lineJoin='round'; for(const [w,col] of [[34,'#3a2e66'],[22,'#5a4a92'],[10,'#8a7ac0']]){ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); for(let i=0;i<=n/2;i++){ const a=Math.PI+i/(n/2)*Math.PI, p=P(a,ro(a)); if(i) g.lineTo(p[0],p[1]); else g.moveTo(p[0],p[1]); } g.stroke(); }
  // the island's south wall, hanging down into the crack
  for(const [w,col] of [[30,'#2e2456'],[18,'#5a4a92'],[8,'#9a8ad0']]){ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); for(let i=0;i<=n/2;i++){ const a=i/(n/2)*Math.PI, p=P(a,ri(a)+w*0.5); if(i) g.lineTo(p[0],p[1]); else g.moveTo(p[0],p[1]); } g.stroke(); }
  // stars down in the dark
  const rng=mulberry32(2201); for(let i=0;i<90;i++){ const a=rng()*TAU, r=lerp(ri(a)+26,ro(a)-30,rng()), p=P(a,r); g.fillStyle=rng()<0.3?'rgba(200,180,255,.9)':'rgba(236,240,255,.9)'; g.beginPath(); g.arc(p[0],p[1],0.7+rng()*1.5,0,TAU); g.fill(); }
  g.restore();
  // the lips: bright salt-glass edges with the plum outline
  g.strokeStyle=SBC.outline; g.lineWidth=3; ring(ro,1); g.stroke(); ring(ri,1); g.stroke();
  g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=1.6; ring(ro,0.992); g.stroke(); ring(ri,1.01); g.stroke();
  g.restore();
}
// the Fallen Star crater floor: scorched glass, a starburst
function m3wCraterPaint(g){ const x=12420, y=60540; g.save(); g.fillStyle='rgba(60,50,110,.45)'; g.beginPath(); g.ellipse(x,y,130,118,0,0,TAU); g.fill();
  g.strokeStyle='rgba(220,230,255,.7)'; g.lineWidth=2; for(let i=0;i<12;i++){ const a=i/12*TAU; g.beginPath(); g.moveTo(x+Math.cos(a)*20,y+Math.sin(a)*18); g.lineTo(x+Math.cos(a)*110,y+Math.sin(a)*100); g.stroke(); } g.restore(); }
// the Moonpath landings: silver moon glyphs on the steps' landings
function m3wGlyphPaint(g,x,y){ g.save(); g.strokeStyle='rgba(210,220,255,.7)'; g.lineWidth=2; g.beginPath(); g.arc(x,y,16,0.5,TAU-0.5); g.stroke(); g.fillStyle='rgba(210,220,255,.5)'; g.beginPath(); g.arc(x+6,y,10,0,TAU); g.fill(); g.restore(); }
function m3wPaint(){
  const k=3;
  for(const R of M3WRAFT){ const r=R.r; ELEV.deco({k,bb:[r[0]-20,r[1]-20,r[2]+24,r[3]+24],lvl:0,order:2,paint:g=>m3wRaftPaint(g,R)}); }
  ELEV.deco({k,bb:[M3WG.pier.x0-12,M3WG.pier.y0-12,M3WG.pier.x1+20,M3WG.pier.y1+20],lvl:0,order:2,paint:g=>m3wPierPaint(g)});
  ELEV.deco({k,bb:[1440,67140,2360,68060],lvl:0,order:1,paint:g=>m3wCoralPaint(g)});
  for(const [x,y] of M3W_RUINS) ELEV.deco({k,bb:[x-300,y-240,x+300,y+240],lvl:0,order:1,paint:g=>m3wRuinsPaint(g)});
  for(let y=60000;y<71000;y+=500) ELEV.deco({k,bb:[6040,y,6420,y+514],lvl:0,order:1,paint:g=>m3wReefPaint(g,y,y+500)});
  for(const [a,b] of M3WROOTS) ELEV.deco({k,bb:[Math.min(a[0],b[0])-40,Math.min(a[1],b[1])-40,Math.max(a[0],b[0])+40,Math.max(a[1],b[1])+40],lvl:0,order:2,paint:g=>m3wRootPaint(g,a,b)});
  ELEV.deco({k,bb:[9460,67320,10140,67980],lvl:0,order:1,paint:g=>m3wSablePaint(g)});
  ELEV.deco({k,bb:[10460,67120,11340,67280],lvl:0,order:1,paint:g=>m3wGapPaint(g)});
  ELEV.deco({k,bb:[12280,60410,12560,60670],lvl:0,order:1,paint:g=>m3wCraterPaint(g)});
  { const R=M3W_RIFT, e=R.r1*1.12; ELEV.deco({k,bb:[R.x-e,R.y-e,R.x+e,R.y+e],lvl:0,order:1,paint:g=>m3wRiftPaint(g)}); }
  for(const F of M3W_MP){ const L=F.land; ELEV.deco({k,bb:[L[0],L[1],L[2],L[3]],lvl:L[4],order:6,paint:g=>m3wGlyphPaint(g,(L[0]+L[2])/2,(L[1]+L[3])/2+20)}); }
}

// ================= 9. the map (defineMap replaces the wave 1 placeholder: its shrine, sign and test crossings go)
m3wCoralDefine();
defineMap(3,{id:'moon',name:S('Moonfall','Moonfall'),music:'m_sea',spawn:{x:1300,y:64800},chests:26,
  ambient:{wind:0.4,birds:true,rain:0.2},
  terrain:{seeds:M3WSEEDS,roads:M3WROADS,lakes:[{x:9800,y:67650,r:220,amp:10}],isles:M3WG.isles,walkways:M3WWALK,
    sea:{land:M3WG.land,shore:70,shelf:170,noise:90},extra:m3wExtra,block:m3wBlock},
  onEnter(from){ m3wSync(true); },
  build(B){ m3wBuild(B); }
});
// (a region banner still waiting from the map Ash just left is stale on the next map: Act IV starts in Hearthold with
// "Frostreach" queued behind the intro, and it showed up on the Clockwork Coast after the fast travel, or in Moonfall
// after Glaciar's flight. The banner queue knows no maps, so a map change drops the waiting region banners; the new
// map's own banner comes right after. CHANGES.md I4: this belongs in e1_maps' mapChanged.)
function m3wStaleBanners(k){
  if(!G) return; const M=MAPS[k], mine=M?simplify(String(M.name)):'', stale=b=>!!b&&b.style==='region'&&b.text!==mine;
  if(G.bannerQ) G.bannerQ=G.bannerQ.filter(b=>!stale(b));
  if(stale(G.banner)) G.banner=(G.bannerQ&&G.bannerQ.shift())||null;
}
{ const base=mapChanged; mapChanged=function(old,k,banner){ try{ m3wStaleBanners(k); }catch(e){ console.error(e); } return base(old,k,banner); }; }
// (the quest line for a goal on another map: e1_maps' routeObj adds " (<the goal's map>: <crossing>)", which reads like
// the goal's own place, "Gearhaven's Far Pier (The Clockwork Coast: The High Pass)" in Hearthold, A4a's leftover. In
// Act IV it says the way instead: "Gearhaven's Far Pier (go by The High Pass)". CHANGES.md I4 ENGINE REQUEST (1): this
// belongs in routeObj; once routeObj words it itself, the suffix below is not found and this does nothing.)
function m3wRouteText(o){
  if(!o||!o.via||typeof o.text!=='string'||!G||actOf(G.stage)!==4) return o;
  const c=crossingsOn(curMap()).find(c=>c.id===o.via), nm=c&&(c.name||c.label); if(!nm) return o;
  for(const k in MAPS){ const suf=simplify(` (${MAPS[k].name}: ${nm})`);
    if(o.text.endsWith(suf)) return Object.assign({},o,{text:o.text.slice(0,-suf.length)+simplify(` (go by ${nm})`)}); }
  return o;
}
{ const base=questObjective; questObjective=function(){ const o=base(); try{ return m3wRouteText(o); }catch(e){ console.error(e); return o; } }; }
{ const base=focusObjective; focusObjective=function(){ const o=base(); try{ return m3wRouteText(o); }catch(e){ console.error(e); return o; } }; }
MAPS[3].terrain.sea={landD:m3wLandD,shore:70,shelf:170}; MAPS[3].tz=null;
// the sand under each desert biome is its own colour (the sampler mixes sand toward it)
for(const [b,c] of [[34,[236,208,140]],[35,[232,191,108]],[37,[228,196,120]],[38,[236,240,246]]]) if(BIOMES[b]) BIOMES[b]._sand=c;
// ---------- crossings (bible 3.6)
// the Far Pier in Gearhaven (x1_world's c_dock_moon): Act IV fills in its far end and its gate
if(CROSSINGS.c_dock_moon) Object.assign(CROSSINGS.c_dock_moon,{to:{x:1300,y:64800},label:S('Sail east with Dell','Sail east with Dell'),
  need:()=>m3wReached('m_sail'),arrive:S('Salt, tar and a smell like old moonlight.','It smells like the sea!')});
defineCrossing({id:'m_ship_home',x:1100,y:64800,to:{x:8350,y:27250},label:S('Sail back to Gearhaven','Sail to Gearhaven'),name:S('Driftwood West Dock','Driftwood West Dock'),kind:'dock',dir:Math.PI,
  need:()=>!m3wF('m_dell_away')&&(m3wF('m_landed')||!m3wStage('m_sail')),
  locked:()=>m3wF('m_dell_away')?S('Dell has gone to fetch your mom. Back soon!','Dell went to get Mom.'):S('Dell\'s boat is not in yet. He is a day behind you.','Dell is not here yet.'),
  arrive:S('Gearhaven! Steam, gulls and clocks.','Back in Gearhaven!')});
defineCrossing({id:'m_glaciar_ride',x:6800,y:48100,to:{x:2345,y:64320},label:S('Fly east on Glaciar\'s back','Fly east with Glaciar'),name:S('Glaciar','Glaciar'),kind:'pass',m3glaciar:true,
  hidden:()=>!(G&&G.choices&&G.choices.f_glaciar==='free'),need:()=>m3wReached('m_sail')||(!m3wStage('m_sail')&&!!(G.flags&&G.flags.act3_done)),
  locked:S('Glaciar is asleep, one eye open. "East? Not yet, dumpling. Soon."','Glaciar is asleep. Not yet.'),
  arrive:S('The whole beach freezes when Glaciar lands. The raft folk cheer. Free ice!','Glaciar lands. Free ice!')});
defineCrossing({id:'m_glaciar_back',x:2375,y:64150,to:{x:6850,y:49100},label:S('Fly back north with Glaciar','Fly north with Glaciar'),name:S('Glaciar','Glaciar'),kind:'pass',dir:-Math.PI/2,m3glaciar:true,
  hidden:()=>!(G&&G.choices&&G.choices.f_glaciar==='free'),need:()=>m3wF('m_landed')||!m3wStage('m_sail'),
  locked:S('Glaciar is snoring under her sail hat. Let her sleep a little.','Glaciar is asleep.'),arrive:S('Snow, at last. Glaciar sighs happily.','Back in the snow!')});
// Rowan's raft ferry (bible 3.6, side quest m_ferry): a post at Driftwood, Strand Landing and Palmcrest; each offers the
// other two. Shown once the quest is known; it runs once the quest is done (the lines go through the Sunken Gate).
// (the posts stand at the land end of three little plank jetties that are part of the terrain, M3WRAFT f*)
const M3W_FERRY={dw:{x:2900,y:64750,to:{x:2860,y:64790},dir:0,name:S('Driftwood Landing','Driftwood Landing')},
  st:{x:6650,y:65750,to:{x:6720,y:65750},dir:Math.PI,name:S('Strand Landing','Strand Landing')},
  pc:{x:3300,y:66145,to:{x:3345,y:66135},dir:-Math.PI/2,name:S('Palmcrest Isle','Palmcrest Isle')}};
const m3wFerryOn=()=>m3wQDone('m_ferry')||m3wF('m_ferry_on');
for(const k in M3W_FERRY){ const F=M3W_FERRY[k];
  defineCrossing({id:'m_ferry_'+k,x:F.x,y:F.y,to:F.to,dir:F.dir,kind:'dock',walk:false,m3ferry:k,label:S('Take Rowan\'s raft ferry','Take the raft ferry'),name:S('Rowan\'s Raft Ferry','The Raft Ferry'),clear:90,
    hidden:()=>!(m3wQ('m_ferry')||m3wFerryOn()),need:()=>m3wFerryOn(),locked:S('The ferry lines are cut. Crab Pirates! Rowan has tied a very cross knot about it.','The ferry lines are cut.')}); }
function m3wFerryMenu(def){
  const from=def.m3ferry, opts=[];
  for(const k of ['dw','pc','st']){ if(k===from) continue; const F=M3W_FERRY[k]; opts.push({t:S(`Ferry to ${F.name}`,`Go to ${F.name}`),fn:()=>later(0.15,()=>{ m3wSnd('creak'); mapTravel(F.to.x,F.to.y,{banner:F.name}); })}); }
  opts.push({t:S('Not now','Not now'),then:[['narr',S('The ferry raft bobs, patient as a duck.','The raft bobs. It waits.')]]});
  runDialogue([ch('narr',S('Rowan\'s raft ferry. Where to? (Mind the chickens.)','Where to? Mind the chickens!'),opts)],()=>{ scene='play'; });
}
// a crossing's locked text may change with the story (a function), the engine shows a string; the ferry asks where to
{ const base=useCrossing; useCrossing=function(def){
  if(def&&typeof def.locked==='function'&&def.need&&!def.need()){ SFX.play('ui'); setBanner(def.name||def.label||'',def.locked(),3); return; }
  if(def&&def.m3ferry&&(!def.need||def.need())){ if(G.inCombat||(G.boss&&!G.boss.dead)){ setBanner(def.name||'',S('You can’t travel while enemies are close.','Enemies are close!'),2.4); return; } m3wFerryMenu(def); return; }
  return base(def); }; }
// the power sandbox (p4_moon debug) sits on a flat dune away from the gates
if(typeof P4_SB!=='undefined'&&!P4_SB.built){ P4_SB.x=8700; P4_SB.y=61000; }

// ================= 10. the world states, the life of Moonfall, and the hooks into the engine
// Dell's boat: at the West Dock until he sails off to fetch Mom; at the Moon Pier from the reforge on
const m3wPierBoat=()=>m3wReached('m_reforge')||m3wF('m_maren')||m3wReached('n_bridge');
const m3wDockBoat=()=>!m3wF('m_dell_away')&&!m3wPierBoat()&&(m3wF('m_landed')||!m3wStage('m_sail')||m3wF('m_ship')||!!G.mapsSeen&&!!G.mapsSeen[3]);
{ const bd=M3WK.boat.draw; M3WK.boat.draw=function(o,t){ if(o.dock&&!m3wDockBoat()) return; if(o.pier&&!m3wPierBoat()) return; bd(o,t); }; }
// ---------- read the flags (cheap) and switch the world to match
function m3wSync(force){
  if(!G||!G.flags||!M3WD.built) return;
  const n=m3wPathLit(), want=Math.min(3,G.flags.m_moonpath_lit|0);
  if(n>want) G.flags.m_moonpath_lit=n;
  else if(want>n){ // a save (or a story stand-in) says more braziers are lit than the world shows: light them for good
    for(let i=0;i<want;i++){ const id=M3W_MP[i].braz.id; if(G.found[id]) continue; G.found[id]=1; const o=P4.out.find(q=>q.id===id); if(o) o.keepOn=true; } }
}
// ---------- standing things sorted with the figures; the gulls overhead; the live world-space touches
{ const base=eventsForRender; eventsForRender=function(list){ base(list); if(!G||AREA||!player||curMap()!==3||!M3WD.built) return; const t=G.time;
  m3wObjsInView(o=>{ const D=M3WK[o.k]; if(!D) return; if(o.k!=='fort'&&o.k!=='bunting'&&!inView(o.x,o.y-(o.R*0.5),o.R)) return; list.push({x:o.x,y:o.base,r:8,flying:true,draw:()=>{ try{ D.draw(o,t); }catch(e){} }}); });
  const J=m3wJinxSpot(); if(J&&M3WD.jinx&&inView(J.x,J.y,140)) list.push({x:J.x,y:J.y+8,r:8,flying:true,draw:()=>{ try{ M3WK.jinx.draw(M3WD.jinx,t); }catch(e){} }});
  const R=M3WD.raft; if(R&&inView(R.x,R.y,120)) list.push({x:R.x,y:R.y+10,r:8,flying:true,draw:()=>{ try{ m3wDrawDrift(R,t); }catch(e){} }}); }; }
// a raft drifting loose on the wobbly tide (sometimes full of worried chickens)
function m3wDrawDrift(R,t){
  const b=Math.sin(t*1.6+R.x*0.01)*1.5, r=Math.sin(t*0.9)*0.06; ctx.save(); ctx.translate(R.x,R.y+b); ctx.rotate(r);
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(0,8,44,12,0,0,TAU); ctx.fill();
  m3wPut(m3wTall('driftraft',100,60,50,30,g=>{ m3wRect(g,-38,-14,76,26,SBC.outline,4); for(let i=0;i<6;i++) m3wRect(g,-36+i*12.2,-12,11,22,i%2?'#b08a5a':'#c89a62',1); m3wRect(g,-36,-2,72,3,'#8a6a40'); }),0,0);
  if(R.hens) for(let i=0;i<3;i++){ const hx=-20+i*20, hy=-6+Math.abs(Math.sin(t*5+i*2))*-3; ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(hx,hy,7.4,6,0,0,TAU); ctx.fill(); ctx.fillStyle='#fafaf6'; ctx.beginPath(); ctx.ellipse(hx,hy,6,4.8,0,0,TAU); ctx.fill(); ctx.fillStyle='#e0402a'; ctx.beginPath(); ctx.arc(hx+2,hy-5,2,0,TAU); ctx.fill(); ctx.fillStyle='#f2c020'; ctx.fillRect(hx+5,hy-1.5,3,2); ctx.fillStyle='#222'; ctx.fillRect(hx+2.5,hy-2.5,1.2,1.2); }
  ctx.restore();
  if(R.hens&&G.time-(R.bk||0)>4&&Math.random()<0.01){ R.bk=G.time; ftext(R.x,R.y-30,S('Bawk?','Bawk?'),'#fff4dc',11); }
}
const M3WGULLS=[];
function m3wDrawGulls(){ if(!M3WGULLS.length) return; const t=G.time;
  for(const g of M3WGULLS){ const f=Math.sin(t*5+g.ph), s=g.vx<0?-1:1;
    ctx.fillStyle='rgba(40,40,70,.12)'; ctx.beginPath(); ctx.ellipse(g.x+40,g.y+90,10,3,0,0,TAU); ctx.fill();
    ctx.save(); ctx.translate(g.x,g.y); ctx.scale(s,1); ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.strokeStyle=LOOK.sb?SBC.outline:'#4a4e58'; ctx.lineWidth=4.2; ctx.beginPath(); ctx.moveTo(-14,-f*6); ctx.quadraticCurveTo(-6,-4-f*3,0,0); ctx.quadraticCurveTo(6,-4-f*3,14,-f*6); ctx.stroke();
    ctx.strokeStyle='#fafaf6'; ctx.lineWidth=2.4; ctx.stroke(); ctx.fillStyle='#fafaf6'; ctx.beginPath(); ctx.ellipse(1,1,4,2.2,0,0,TAU); ctx.fill(); ctx.fillStyle='#f2c020'; ctx.fillRect(4.5,0,2.4,1.2); ctx.restore(); } }
{ const base=drawBirds; drawBirds=function(){ base(); if(!AREA&&curMap()===3) m3wDrawGulls(); }; }
// the moon on the water at night (THREADS 4.3), the drowned windows of Lumen, the moonjellies, Nightfall Peak on the horizon
function m3wDrawWorldFx(t){
  if(!player) return;
  const nt=daylight()<0.5, vx=cam.x, vy=cam.y, vw=W/zoom, vh=H/zoom;
  if(nt&&typeof drawMoon==='function'&&moonLeft()>0){ const mx=vx+vw*0.7, my=vy+vh*0.32, s=T(mx,my,M3WD.ms||(M3WD.ms={}));
    if(s.water&&!s.out){ const k=clamp((0.5-daylight())/0.3,0,1); ctx.save(); ctx.translate(mx,my); ctx.scale(1,0.55); try{ drawMoon(ctx,0,0,30,{alpha:0.5*k}); }catch(e){} ctx.restore();
      ctx.strokeStyle=`rgba(220,230,255,${0.35*k})`; ctx.lineWidth=2; for(let i=0;i<4;i++){ const yy=my+22+i*9, w=30-i*5+Math.sin(t*2+i)*4; ctx.beginPath(); ctx.moveTo(mx-w,yy); ctx.lineTo(mx+w,yy); ctx.stroke(); } } }
  if(nt&&player.x<6200&&player.y<62600){ const k=G.bossDone&&G.bossDone.m_octavia?1:0.45; for(const [x,y] of M3W_RUINS) if(inView(x,y,260)) glowAt(x,y,90,'150,180,255',0.12*k+0.05*Math.sin(t+x));
    for(let i=0;i<6;i++){ const jx=vx+((i*389+t*12)%vw), jy=vy+((i*233+Math.sin(t*0.3+i)*40+t*6)%vh); const s=T(jx,jy,M3WD.ms||(M3WD.ms={})); if(!s.water||m3wRegion(jx,jy,0)!==32) continue; glowAt(jx,jy,14,'210,220,255',0.25+0.1*Math.sin(t*2+i)); ctx.fillStyle='rgba(230,236,255,.6)'; ctx.beginPath(); ctx.arc(jx,jy,3,Math.PI,TAU); ctx.fill(); } }
  if(player.x>12300&&(m3wF('m_eclipse3')||m3wF('m_done')||m3wReached('n_bridge'))) m3wDrawPeak(t);
}
// Nightfall Peak (FINALE owns its art; Moonfall shows only its silhouette out at sea, beyond the Edge of the World)
function m3wDrawPeak(t){
  const x=14500, y=65450; if(!inView(x,y-600,900)) return;
  m3wPut(m3wTall('peak',900,1200,450,1120,g=>{ g.fillStyle='rgba(40,20,60,.35)'; g.beginPath(); g.ellipse(0,0,420,60,0,0,TAU); g.fill();
    g.fillStyle='#120a1c'; g.beginPath(); g.moveTo(-420,0); g.lineTo(-260,-340); g.lineTo(-180,-300); g.lineTo(-60,-760); g.lineTo(0,-1080); g.lineTo(70,-740); g.lineTo(200,-420); g.lineTo(260,-460); g.lineTo(420,0); g.closePath(); g.fill();
    g.strokeStyle='rgba(170,120,255,.6)'; g.lineWidth=3; g.beginPath(); g.moveTo(-60,-760); g.lineTo(0,-1080); g.lineTo(70,-740); g.stroke(); },1,true),x,y);
  if(Math.sin(t*1.7)>0.985){ flashA=Math.max(flashA,0.12); flashCol='190,150,255'; }
  glowAt(x,y-1080,60,'170,120,255',0.25+0.1*Math.sin(t*2));
}
{ const base=drawMarkers; drawMarkers=function(t){ base(t); try{ if(!G) return; if(AREA){ if(AREA.def&&AREA.def.id==='m_coralcombe') m3wCoralFx(t); return; } if(curMap()===3&&M3WD.built) m3wDrawWorldFx(t); }catch(e){ console.error('m3w fx',e); } }; }
// screen-space touches: the sandstorm haze in the Wormfields, the glare on the Mirror Flats by day
{ const base=drawVignette; drawVignette=function(){ try{ if(G&&!AREA&&curMap()===3&&M3WD.built&&scene!=='menu') m3wScreenFx(); }catch(e){} return base(); }; }
function m3wScreenFx(){
  const st=M3WD.storm||0; if(st>0.01){ ctx.save(); ctx.fillStyle=`rgba(232,190,120,${0.22*st})`; ctx.fillRect(0,0,W,H); ctx.restore(); }
  const gl=M3WD.glare||0; if(gl>0.01){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=`rgba(255,255,255,${0.08*gl})`; ctx.fillRect(0,0,W,H); ctx.restore(); }
}
// Coralcombe: light rays from the surface, rising bubbles, fish, swaying kelp, a blue-green sea tint
function m3wCoralFx(t){
  const A=AREA, vx=cam.x, vy=cam.y, vw=W/zoom, vh=H/zoom;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){ const x=vx+((i*331+t*14)%(vw+200))-100; const gr=ctx.createLinearGradient(x,vy,x+120,vy+vh); gr.addColorStop(0,'rgba(170,240,255,.10)'); gr.addColorStop(1,'rgba(170,240,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(x,vy); ctx.lineTo(x+60,vy); ctx.lineTo(x+220,vy+vh); ctx.lineTo(x+120,vy+vh); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // kelp in the rooms (swaying), drawn at the cells listed in M3W_CORAL.kelp
  if(A.cave){ for(const rk in M3W_CORAL.kelp){ const R=M3W_CORAL.rooms[rk]; for(const [c,r] of M3W_CORAL.kelp[rk]){ const i=R.at[0]*16+1+c, j=R.at[1]*12+1+r, x=A.x0+(i+0.5)*A.cave.cell, y=A.y0+(j+0.5)*A.cave.cell; if(!inView(x,y,80)) continue;
    for(let k=0;k<4;k++){ const sw=Math.sin(t*1.6+k+x*0.01)*8; ctx.strokeStyle=SBC.outline; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x-12+k*8,y+18); ctx.quadraticCurveTo(x-12+k*8+sw,y-14,x-12+k*8+sw*1.6,y-44-k*4); ctx.stroke(); ctx.strokeStyle=k%2?'#4a9a4a':'#6aba5a'; ctx.lineWidth=4; ctx.stroke(); } } } }
  for(let i=0;i<14;i++){ const x=vx+((i*197)%vw), y=vy+vh-((t*40+i*137)%(vh+40)); ctx.strokeStyle='rgba(230,250,255,.6)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x+Math.sin(t*2+i)*6,y,2+i%3,0,TAU); ctx.stroke(); }
  for(let i=0;i<5;i++){ const dir=i%2?1:-1, x=vx+(((t*(30+i*6)*dir)%(vw+200))+vw+200)%(vw+200)-100, y=vy+vh*(0.2+i*0.15)+Math.sin(t+i)*20; ctx.save(); ctx.translate(x,y); ctx.scale(dir,1);
    for(let k=0;k<4;k++){ const fx=-k*16, fy=Math.sin(t*3+k)*6+(k%2)*8; ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(fx,fy,7,4,0,0,TAU); ctx.fill(); ctx.fillStyle=['#f0a040','#60c0e0','#f070a0','#f0e060','#80e0a0'][i]; ctx.beginPath(); ctx.ellipse(fx,fy,5.8,3,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx-5,fy); ctx.lineTo(fx-10,fy-4); ctx.lineTo(fx-10,fy+4); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
  ctx.save(); ctx.fillStyle='rgba(40,150,170,.10)'; ctx.fillRect(vx,vy,vw,vh); ctx.restore();
}
// ---------- the life of Moonfall: gulls, surf, the wobbly tide, moths flying east at night, fireflies, glints, heat,
// the Wormfields' sandstorm, the quicksand ring round the Worm Mouth
function m3wLife(dt){
  if(AREA||!player||curMap()!==3) return;
  const t=G.time, a=ambHere()||{}, nt=isNight(), p=player, vx=cam.x, vy=cam.y, vw=W/zoom, vh=H/zoom;
  // gulls: cries by day, a few gliding overhead
  const gl=a.gulls||0;
  if(gl>0&&isDay()){ M3WD.gullT=(M3WD.gullT||rand(2,6))-dt; if(M3WD.gullT<=0){ M3WD.gullT=rand(2.5,8)/Math.max(0.2,gl); m3wSnd('gull',0.35+0.4*gl); }
    if(M3WGULLS.length<Math.round(gl*4)&&Math.random()<dt*0.4){ const s=Math.random()<0.5?-1:1, y=vy+rand(0.1,0.9)*vh; M3WGULLS.push({x:s<0?vx-60:vx+vw+60,y,vx:-s*rand(70,120),vy:rand(-14,14),ph:rand(0,TAU),life:30}); } }
  for(const g of M3WGULLS){ g.x+=g.vx*dt; g.y+=g.vy*dt+Math.sin(t*0.8+g.ph)*4*dt; g.ph+=dt; g.life-=dt; }
  for(let i=M3WGULLS.length-1;i>=0;i--){ const g=M3WGULLS[i]; if(g.life<=0||g.x<vx-200||g.x>vx+vw+200) M3WGULLS.splice(i,1); }
  // surf on the shore
  if(a.waves){ M3WD.waveT=(M3WD.waveT||0)-dt; if(M3WD.waveT<=0){ M3WD.waveT=rand(3.5,6.5); const d=Math.abs(m3wLandD(p.x,p.y)); if(d<420) m3wSnd('wave',(0.5+0.5*a.waves)*clamp(1-d/420,0.2,1)); } }
  // Driftwood's wobbly tide: a surge rocks the town every so often, and a raft drifts loose (sometimes full of chickens)
  if(dist2(p.x,p.y,2300,64800)<1400*1400){ M3WD.surgeT-=dt; if(M3WD.surgeT<=0){ M3WD.surgeT=rand(80,100); const big=m3wF('m_eclipse1'); m3wSnd('surge',big?1:0.7); shake(big?3:1.5); m3wSnd('creak',0.6);
      if(!M3WD.raft){ const hens=Math.random()<0.4; M3WD.raft={x:1400,y:rand(65300,65650),vx:rand(30,45),t:0,hens}; if(hens) m3wSnd('chicken',0.6); } } }
  if(M3WD.raft){ const R=M3WD.raft; R.x+=R.vx*dt; R.t+=dt; R.y+=Math.sin(R.t*0.8)*6*dt; if(R.x>3400) M3WD.raft=null; }
  // moths flying east to their mother at night (more of them as the moon shrinks)
  if(nt&&moonLeft()<100&&Math.random()<dt*(0.8+m3wBites()*0.5)) emit(vx-20,rand(vy,vy+vh),1,{col:'214,206,236',glow:false,ang:rand(-0.2,0.2),spread:0.2,smin:60,smax:110,lmin:5,lmax:8,zmin:1.6,zmax:2.4,drag:0,alpha:0.85});
  if(a.moths&&Math.random()<dt*4*a.moths) emit(rand(vx,vx+vw),rand(vy,vy+vh),1,{col:'214,206,236',glow:false,ang:rand(0,TAU),spread:1,smin:10,smax:30,lmin:2,lmax:3.6,zmin:1.4,zmax:2.2,drag:0.2,alpha:0.8});
  // fireflies in the mangroves at night
  if(a.fireflies&&nt&&Math.random()<dt*10*a.fireflies) emit(rand(vx,vx+vw),rand(vy,vy+vh),1,{col:'210,255,150',ang:rand(0,TAU),spread:1,smin:5,smax:20,lmin:1.6,lmax:3,zmin:1.2,zmax:2,drag:0.5});
  // glints off the glass sand and the salt-glass
  if(a.glint&&isDay()&&Math.random()<dt*14*a.glint){ const x=rand(vx,vx+vw), y=rand(vy,vy+vh), s=T(x,y,M3WD.ms||(M3WD.ms={})); if(!s.water&&(s.m3&(2|4|256)||s.b===34||s.b===36)) emit(x,y,1,{col:'255,255,255',smin:2,smax:8,lmin:.25,lmax:.5,zmin:1.6,zmax:2.8}); }
  // heat shimmer: pale wisps rising off the dunes and the flats at midday
  if(a.shimmer&&isDay()&&daylight()>0.8&&Math.random()<dt*6*a.shimmer) emit(rand(vx,vx+vw),rand(vy,vy+vh),1,{col:'255,250,235',glow:false,ang:-Math.PI/2,spread:0.2,smin:10,smax:22,lmin:1.4,lmax:2.4,zmin:5,zmax:9,grow:6,drag:0.3,alpha:0.18});
  // the Wormfields' sandstorm (the wind picks up in gusts; it never blocks the way, it only howls)
  const inStorm=dist2(p.x,p.y,10600,62600)<1250*1250&&isDay();
  M3WD.stormK=(M3WD.stormK||0)+dt*0.25; const gust=0.55+0.45*Math.sin(M3WD.stormK)*Math.sin(M3WD.stormK*0.37+1);
  const st=inStorm?clamp(gust,0,1):0; M3WD.storm=lerp(M3WD.storm||0,st,Math.min(1,dt*1.5));
  if(M3WD.storm>0.15){ for(let i=0;i<Math.ceil(dt*60*M3WD.storm);i++) emit(vx-10,rand(vy,vy+vh),1,{col:'226,186,120',glow:false,ang:rand(-0.15,0.15),spread:0.1,smin:300,smax:480,lmin:1.6,lmax:2.6,zmin:1,zmax:2,drag:0,alpha:0.6*M3WD.storm}); M3WD.gustT=(M3WD.gustT||0)-dt; if(M3WD.gustT<=0){ M3WD.gustT=rand(2,4); m3wSnd('gust',0.5*M3WD.storm); } }
  // the Mirror Flats' glare by day (Kiln's goggles take it away: G.flags.m_goggles)
  const onFlats=m3wRegion(p.x,p.y,0)===38&&isDay()&&!m3wF('m_goggles'); M3WD.glare=lerp(M3WD.glare||0,onFlats?daylight():0,Math.min(1,dt*1.2));
  if(onFlats&&!G.flags.m_flats_seen){ G.flags.m_flats_seen=1; setBanner(S('the Mirror Flats','the Mirror Flats'),S('White glass to the edge of the sky. Mirages shimmer everywhere. Some of them wave.','Shiny white glass everywhere!'),3.4); }
}
// ---------- the powers on this map: the quicksand ring, glass paths of Blaze, buried lamps, Moonfire on things
function m3wPowers(dt){
  if(AREA||!player||curMap()!==3||G.mode!=='story') return;
  const p=player, air=p.flying||(p.z||0)>0.5||!!p.hop;
  // the ring round the Worm Mouth swallows walkers fast (fly over it, make a glass path with Blaze, or burrow)
  if(!air&&!(typeof p4Burrowed==='function'&&p4Burrowed())&&m3wSinkAt(p.x,p.y)===2&&typeof p4SinkAt==='function'&&p4SinkAt(p.x,p.y)>0){
    M3WD.ring.t+=dt; if(M3WD.ring.t>0.12) m3wTip('ring',p.x,p.y-40,S('The sand pulls at your feet!','The sand pulls you down!'),'#ffe0b0',4);
    if(M3WD.ring.t>0.7&&typeof p4Sunk==='function'){ M3WD.ring.t=0; p4Sunk(p);
      if(!G.flags.m_ring_tip){ G.flags.m_ring_tip=1; // the story module plays Iska's line (m3sBeat 'ring'); this is the stand-in
        let told=false; if(typeof m3sBeat==='function') try{ told=!!m3sBeat('ring'); }catch(e){}
        if(!told) later(0.6,()=>runDialogue([['iska',S('A ring of quicksand. Fly over it, or make yourself a glass path with Blaze.','Fly over it! Or melt a glass path with Blaze.')]],()=>{ scene='play'; })); } } }
  else M3WD.ring.t=Math.max(0,M3WD.ring.t-dt*2);
  // the Burrow Gap: the first time under the Glasswall (bible 6.8b: m_gap_dug, Iska's line, Ash's line on the far side)
  const bur=typeof p4Burrowed==='function'&&p4Burrowed();
  if(bur&&m3wD2(p.x,p.y,M3WG.gap.x,M3WG.gap.y)<90*90&&!G.flags.m_gap_dug){ G.flags.m_gap_dug=1; M3WD.gapPop=true;
    if(typeof m3sBeat==='function') try{ m3sBeat('gap'); }catch(e){}
    bubble({x:p.x,y:p.y-30},S('That\'s the Glasswall. Pretty, isn\'t it? Pretty and pointy.','The Glasswall. Pretty and pointy!'),{who:SPK.iska?SPK.iska.name:'Iska',col:SPK.iska?SPK.iska.col:'#ffd27a',dy:-30}); }
  if(M3WD.gapPop&&!bur&&p.x>11130){ M3WD.gapPop=false; bubble(p,S('Under! Ha! UNDER!','Under! Ha!'),{who:SPK.ash?SPK.ash.name:'Ash',col:'#ffd27a',dy:-30}); }
  // Moonfire on things of the world: the Mirage Oasis at night (Kiln's furnace and Ned's great lamp are x3_people's)
  if(typeof p4MoonOn==='function'&&p4MoonOn()&&p.breathing&&typeof p4MoonHits==='function'){
    if(isNight()&&!G.found.m_sec_mirage_seen&&p4MoonHits(8700,70300,60)){ G.found.m_sec_mirage_seen=1; m3wSnd('moon'); setBanner(S('Something real','Something real'),S('In the moonfire, the mirage melts away. A real chest sits in the middle.','A real chest in the mirage!'),3); saveGame(); }
  }
  // the Moonpath bend lamps burn 12 s once lit
  for(const o of M3WD.fire) if(o.litT>0) o.litT-=dt;
}
// fire lights lamps, wakes a turtle, lights the Firefly Hollow stump; Blaze on quicksand makes glass plates
{ const base=breathIgnite; breathIgnite=function(mx,my,ang,dt){ base(mx,my,ang,dt); try{ if(AREA||curMap()!==3||!M3WD.built) return; const p=player;
  const blue=typeof P3!=='undefined'&&P3.bz&&P3.bz.blue&&P3.jet, hit=(x,y,r)=>inArcC(mx,my,ang,175,0.45,{x,y,r}), far=(x,y,r)=>blue&&typeof p3JetHits==='function'&&p3JetHits(x,y,r);
  for(const o of M3WD.fire){ if(hit(o.x,o.y-34,18)){ if(!(o.litT>0)){ m3wSnd('chime',0.6); emit(o.x,o.y-34,10,{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } o.litT=12; } }
  if(!G.found.m_sec_turtle||blue){ if(elevLvl(p.x,p.y)>=1&&dist2(p.x,p.y,4800,63600)<330*330&&(hit(4800,63300,30)||far(4800,63300,30))) m3wTurtleWake(!!blue); }
  if(!G.found.m_sec_fireflies&&hit(2600,69456,22)) m3wFirefly();
}catch(e){ console.error('m3w fire',e); } }; }
if(typeof p3FireTick==='function'){ const base=p3FireTick; p3FireTick=function(p,dt,blue){ base(p,dt,blue); try{ if(!blue||AREA||curMap()!==3||!P3.jet||typeof p4GlassPlate!=='function') return; const J=P3.jet, ca=Math.cos(J.ang), sa=Math.sin(J.ang);
  for(let s=30;s<=J.L;s+=34){ const x=J.ox+ca*s, y=J.oy+sa*s; if(m3wSinkAt(x,y)) p4GlassPlate(x,y,48); } }catch(e){} }; }
// glass cactus plants chime when something hits them
{ const base=swingBreakables; swingBreakables=function(px,py,dir,range,half){ base(px,py,dir,range,half); try{ if(AREA||curMap()!==3) return; const cx=Math.floor(px/CH), cy=Math.floor(py/CH);
  for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const arr=PROPS.get(ckey(cx+i,cy+j)); if(!arr) continue; for(const q of arr){ if(q.k!=='m_glasscactus'&&q.k!=='m_glassspike'&&q.k!=='m_crystal') continue; if(inArcC(px,py,dir,range+10,half,{x:q.x,y:q.y,r:14})){ if(!M3WD.chimeT||G.time-M3WD.chimeT>0.25){ M3WD.chimeT=G.time; m3wSnd('chime'); } emit(q.x,q.y-12,6,{col:'230,250,255',smin:20,smax:80,lmin:.25,lmax:.5,zmin:1.4,zmax:2.4}); } } } }catch(e){} }; }
// glass spikes cannot be burrowed under (deep colliders)
{ const base=genProps; genProps=function(cx,cy){ const out=base(cx,cy); if(chunkMapOf(cy)===3) for(const p of out) if(p.k==='m_glassspike'&&p.col) p.col.deep=true; return out; }; }
// region-only places (the Wormfields, the Shatterfields, the Mangroves, the isles) keep their trees and rocks
{ const base=inClearing; inClearing=function(x,y,extra){
  if(x>=IZX-50||mapAt(y)!==3) return base(x,y,extra);
  const e=extra||0, mk=3;
  for(const k in POI){ const p=POI[k]; if(p.noClr) continue; if(dist2(x,y,p.x,p.y)<(p.r+30+e)**2) return true; }
  for(const s of mapList(SHRINES,mk)) if(dist2(x,y,s.x,s.y)<(90+e)**2) return true;
  for(const c of mapList(CAMPS,mk)) if(dist2(x,y,c.x,c.y)<(140+e)**2) return true;
  for(const c of mapList(CHESTS,mk)) if(dist2(x,y,c.x,c.y)<(40+e)**2) return true;
  for(const l of mapList(LANDMARKS,mk)) if(dist2(x,y,l.x,l.y)<((l.clr||40)+e)**2) return true;
  for(const m of mapList(CAVEMOUTHS,mk)) if(dist2(x,y,m.x,m.y)<(110+e)**2) return true;
  return !!m3wObjNear(x,y,e); }; }
// regions on Moonfall follow the bible's boxes and the cliffs (music, ambience, events, banners)
{ const base=biomeInfo; biomeInfo=function(x,y,o){ const r=base(x,y,o); if(M3WD.built&&y>=60000&&y<=71000&&x<IZX-50){ const b=m3wRegion(x,y,0); o.b=b; o.b2=b; o.t=1; } return r; }; }
// Water Stride on Moonfall: the shallows are walkable, the deep channel round the Spire is not
{ const base=mapStrideBlocked; mapStrideBlocked=function(x,y){
  if(y>=60000&&y<=71000&&x>30&&x<13970){ if(m3wBlock(x,y)) return true; if(x<6400&&m3wChannel(x,y)&&!m3wSolid(x,y)){ for(const w of M3WWALK) if(x>=w.x0&&x<=w.x1&&y>=w.y0&&y<=w.y1) return false; return true; } if(m3wShallow(x,y)) return false; }
  return base(x,y); }; }
// doors with a gate (the dungeon doors before their stage); Old Lumen's back door (secret 7) dives into the drowned
// city: the dungeon module may set M3W_BACKDOOR.enter=(A)=>{...} to put Ash in its Seafloor Plaza (room h)
{ const base=enterArea; enterArea=function(id,door){
  if(door&&door.m3need&&!door.m3need()){ SFX.play('ui'); runDialogue([['narr',door.m3locked||S('It will not open.','It is shut.')]],()=>{ scene='play'; }); return; }
  const back=!!(door&&id===M3W_BACKDOOR.area&&Math.abs(door.x-M3W_BACKDOOR.x)<4&&Math.abs(door.y-M3W_BACKDOOR.y)<4);
  const r=base(id,door);
  try{ if(back&&AREA){ if(G.found&&!G.found.m_sec_backdoor){ G.found.m_sec_backdoor=1; saveGame(); } if(typeof M3W_BACKDOOR.enter==='function') M3W_BACKDOOR.enter(AREA); } }catch(e){ console.error('m3w backdoor',e); }
  return r; }; }
// Sable's tents: striped canvas over a cream wall, an entrance flap where the door is (the house engine still plans
// the door, the night windows and the inside)
const M3WTENT=new WeakMap();
function m3wTentSprite(hs,L){
  const W2=hs.w/2, H2=hs.h/2, sc=HSC, padX=16, padT=60, padB=12, cv=mkCanvas(Math.ceil((hs.w+padX*2)*sc),Math.ceil((hs.h+padT+padB)*sc)), g=cv.getContext('2d');
  g.scale(sc,sc); g.translate(padX+W2,padT+H2); g.lineJoin='round'; g.lineCap='round';
  const rc=hs.roof||'#c84a3a', T=celTones(rc), cream='#fff4e0', top=-H2-(hs.m3big?52:40);
  // the shadow, the canvas walls, the striped roof (a big peaked tent seen from the south), the flap, ropes and pegs
  g.fillStyle='rgba(60,30,30,.25)'; g.beginPath(); g.ellipse(4,H2+2,W2+10,12,0,0,TAU); g.fill();
  g.fillStyle='#e8d8b0'; g.beginPath(); g.moveTo(-W2,H2); g.lineTo(-W2+6,-H2*0.2); g.lineTo(W2-6,-H2*0.2); g.lineTo(W2,H2); g.closePath(); g.fill();
  g.fillStyle='#d8c498'; g.fillRect(W2*0.35,-H2*0.2,W2*0.65-6,H2*1.2);
  const n=hs.m3big?10:8; for(let i=0;i<n;i++){ const x0=-W2-8+i*(hs.w+16)/n, x1=x0+(hs.w+16)/n; g.fillStyle=i%2?cream:rc; g.beginPath(); g.moveTo(0,top); g.lineTo(x0,-H2*0.15); g.lineTo(x1,-H2*0.15); g.closePath(); g.fill(); }
  g.fillStyle='rgba(59,30,72,.22)'; g.beginPath(); g.moveTo(0,top); g.lineTo(W2*0.15,-H2*0.15); g.lineTo(W2+8,-H2*0.15); g.closePath(); g.fill();
  g.fillStyle='rgba(255,250,230,.25)'; g.beginPath(); g.moveTo(0,top); g.lineTo(-W2-8,-H2*0.15); g.lineTo(-W2*0.5,-H2*0.15); g.closePath(); g.fill();
  for(let i=0;i<=n;i++){ const x=-W2-8+i*(hs.w+16)/n; g.fillStyle=i%2?T[2]:rc; g.beginPath(); g.arc(x+(hs.w+16)/n/2,-H2*0.15,(hs.w+16)/n/2,0,Math.PI); g.fill(); }
  g.fillStyle='#3a2a2a'; g.beginPath(); g.moveTo(-14,H2); g.lineTo(-10,H2*0.1); g.lineTo(10,H2*0.1); g.lineTo(14,H2); g.closePath(); g.fill();
  g.fillStyle=rc; g.beginPath(); g.moveTo(-14,H2*0.1); g.lineTo(-22,H2); g.lineTo(-12,H2); g.closePath(); g.fill(); g.beginPath(); g.moveTo(14,H2*0.1); g.lineTo(22,H2); g.lineTo(12,H2); g.closePath(); g.fill();
  g.strokeStyle='#8a6a40'; g.lineWidth=1.2; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*W2*0.8,-H2*0.1); g.lineTo(s*(W2+14),H2-2); g.stroke(); m3wRect(g,s*(W2+14)-1.5,H2-5,3,6,'#6a4a2c'); }
  g.strokeStyle='#6a4a2c'; g.lineWidth=2; g.beginPath(); g.moveTo(0,top); g.lineTo(0,top-14); g.stroke(); g.fillStyle=rc; g.beginPath(); g.moveTo(0,top-14); g.lineTo(12,top-10); g.lineTo(0,top-6); g.closePath(); g.fill();
  // night panes: two small lanterns by the flap
  L.panes=[[-24,H2*0.3,5,7],[19,H2*0.3,5,7]]; L.glows=[[-21.5,H2*0.33,14],[21.5,H2*0.33,14]]; L.nl=undefined;
  let c=LOOK.sb?outlineSprite(cv,SBC.outline,2.3,{force:true}):cv; c.ox=padX+W2; c.oy=padT+H2; c.sc=sc; c.burnt=false; c.snow=false; return c;
}
{ const base=houseSprite; houseSprite=function(hs){
  if(hs&&hs.m3tent){ let c=SCACHE.get(hs); if(c&&M3WTENT.has(c)) return c; const L=hzPlan(hs); c=m3wTentSprite(hs,L); hs.facade=true; hs.wins=L.panes; M3WTENT.set(c,1); SCACHE.set(hs,c); return c; }
  return base(hs); }; }
// Glaciar herself is the crossing art for her rides (asleep, one eye open, a sun hat made of a sail on Moonfall)
// On Moonfall x3_people draws her napping on the north isle (an NPC), so the crossing there is only a little sign.
{ const base=drawCrossing; drawCrossing=function(def,t){ if(def&&def.m3glaciar) return m3wDrawGlaciar(def,t); if(def&&def.m3ferry) return m3wDrawFerryPost(def,t); return base(def,t); }; }
function m3wDrawGlaciar(def,t){
  const x=def.x, y=def.y, hat=mapAt(y)===3, br=Math.sin(t*0.9)*1.5, eye=Math.sin(t*0.4)>0.9?0.3:1;
  if(hat&&typeof m3pNapNPC==='function'){ m3wPut(m3wTall('glsign',40,60,20,52,g=>{ m3wEll(g,2,2,7,3,'rgba(40,30,20,.3)'); m3wShade(g,-2,-40,4,42,'#7a5634',1); m3wShade(g,-16,-46,32,16,'#d8e8f4',3); g.fillStyle='#3a6a9a'; g.font=`900 7px ${UIF}`; g.textAlign='center'; g.fillText('NORTH',0,-35); }),x,y); return; }
  m3wPut(m3wTall('glaciar'+(hat?1:0),360,220,180,150,g=>{ m3wEll(g,0,40,160,30,'rgba(40,60,90,.25)');
    celFill(g,(q,dx,dy)=>{ q.moveTo(-150+dx,30+dy); q.quadraticCurveTo(-60+dx,-70+dy,60+dx,-40+dy); q.quadraticCurveTo(130+dx,-20+dy,140+dx,30+dy); q.closePath(); },'#a8d8f0',{r:90,tones:['#e8f8ff','#a8d8f0','#5a8ab8']});
    g.fillStyle='#d0ecfa'; for(let i=0;i<6;i++){ g.beginPath(); g.moveTo(-90+i*30,-40+Math.abs(i-2.5)*8); g.lineTo(-80+i*30,-66+Math.abs(i-2.5)*8); g.lineTo(-70+i*30,-40+Math.abs(i-2.5)*8); g.closePath(); g.fill(); }
    celFill(g,(q,dx,dy)=>{ q.moveTo(-20+dx,-46+dy); q.quadraticCurveTo(-80+dx,-120+dy,-150+dx,-100+dy); q.lineTo(-120+dx,-30+dy); q.closePath(); },'#c4e6f8',{r:60,tones:['#f0faff','#c4e6f8','#7aa8d0']});
    celFill(g,(q,dx,dy)=>q.ellipse(dx+150,dy+10,44,30,0,0,TAU),'#a8d8f0',{r:40,tones:['#e8f8ff','#a8d8f0','#5a8ab8']});
    for(const s of [-1,1]){ g.fillStyle='#e8f4ff'; g.beginPath(); g.moveTo(150+s*14,-12); g.lineTo(140+s*30,-56); g.lineTo(162+s*10,-14); g.closePath(); g.fill(); }
    m3wEll(g,186,8,4,3,'#3a5a7a');
    if(hat){ celFill(g,(q,dx,dy)=>q.ellipse(dx+146,dy-30,46,14,-0.15,0,TAU),'#f6efe0',{r:30}); celFill(g,(q,dx,dy)=>q.ellipse(dx+146,dy-42,22,14,-0.15,0,TAU),'#f6efe0',{r:20}); m3wRect(g,126,-40,40,5,'#d8503a',2); } }),x+60,y-20+br);
  ctx.save(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.ellipse(x+60+168,y-20+br+4,6,5*eye,0,0,TAU); ctx.fill(); ctx.fillStyle='#2a6aaa'; ctx.beginPath(); ctx.arc(x+60+169,y-20+br+4,2.6*eye,0,TAU); ctx.fill(); ctx.restore();
  if(Math.sin(t*0.9)>0.95) ftext(x+40,y-120,'z','#e6f4ff',13);
  if(Math.random()<0.05) emit(x+rand(-80,160),y-rand(0,40),1,{col:'230,248,255',smin:10,smax:30,lmin:.6,lmax:1.2,zmin:1.2,zmax:2});
}
// Rowan's ferry post at the land end of its jetty: a striped post with a rope coil and a FERRY board; once the lines are
// up a little raft is tied to the jetty (x3_people draws Rowan's own raft at the Driftwood post)
function m3wDrawFerryPost(def,t){
  const x=def.x, y=def.y, c=Math.cos(def.dir), s=Math.sin(def.dir), on=m3wFerryOn();
  if(on&&def.m3ferry!=='dw'){ const rx=x+c*100+(Math.abs(c)>0.5?0:56), ry=y+s*100+(Math.abs(c)>0.5?52:0)+Math.sin(t*1.4)*1.5; m3wPut(m3wTall('fraft',90,50,45,26,g=>{ m3wEll(g,0,6,40,9,'rgba(255,255,255,.35)'); m3wShade(g,-36,-12,72,22,'#b08a5a',4); g.strokeStyle='#6a4a2c'; g.lineWidth=1.2; for(let i=-24;i<=24;i+=12){ g.beginPath(); g.moveTo(i,-12); g.lineTo(i,10); g.stroke(); } m3wRect(g,-6,-30,3,20,'#6a4a2c'); g.fillStyle='#f6efe0'; g.beginPath(); g.moveTo(-3,-30); g.lineTo(14,-18); g.lineTo(-3,-14); g.closePath(); g.fill(); }),rx,ry); }
  m3wPut(m3wTall('fpost',40,70,20,62,g=>{ m3wEll(g,3,3,9,3.6,'rgba(40,30,20,.3)'); m3wShade(g,-4,-50,8,52,'#e8e0d0',3); for(let k=0;k<4;k++) m3wRect(g,-4,-46+k*12,8,5,'#c84a3a');
    g.strokeStyle='#d8c8a0'; g.lineWidth=2.2; g.beginPath(); g.ellipse(0,-8,7,3,0,0,TAU); g.stroke(); m3wShade(g,-16,-60,32,13,'#8e6a40',2); g.fillStyle='#fff4dc'; g.font=`900 7px ${UIF}`; g.textAlign='center'; g.fillText('FERRY',0,-51); }),x,y);
}
// ---------- the frame hook
{ const base=update; update=function(dt){ try{ if(M3WD.built&&G&&curMap()===3){ M3WD.syncT=(M3WD.syncT||0)-dt; if(M3WD.syncT<=0){ M3WD.syncT=1; m3wSync(); } } }catch(e){ console.error('m3w sync',e); }
  const r=base(dt); try{ if(scene==='play'&&G&&G.mode!=='menu'&&M3WD.built){ m3wLife(dt); m3wPowers(dt); } }catch(e){ console.error('m3w life',e); } return r; }; }
// ---------- the published spots (M3WORLD.md): m3wSpot(name) -> {x,y,lvl,how} where Ash can stand. `how` says what it
// takes to stand there: '' on foot, 'stride' Water Stride (shallows), 'swim' Dive (deep water), 'claws' Climbing Claws,
// 'grapple' the Grapple Tail, 'ladder' a ladder, 'dbljump' a Double Jump, 'moon' Moonfire on the moon stairs, 'wings'
const M3W_SPOTS={
  // the Sunken Isles
  dock:[1300,64800,0],town:[2240,64800,0],nest:[2300,64660,1,'ladder'],winnie:[2060,65078,0],reading:[2425,65100,0],ferry:[2880,64762,0],northIsle:[2330,64300,0],
  wren:[2425,65080,0],mags:[1560,64800,0],dell:[1260,64790,0],
  lagoon:[1600,65400,0,'stride'],shoals:[2950,63650,0],sandbar:[3450,62850,0],channel:[3700,62640,0,'stride'],balcony:[3700,62455,1,'grapple'],spireDoor:[3700,62430,1,'grapple'],
  gullBeach:[1000,62395,0,'stride'],gullTop:[1100,62000,1],lighthouse:[1000,61890,3,'claws'],
  palmcrest:[3000,66350,1],palmBeach:[3300,66130,0],palmhill:[3360,66540,2],plank:[2750,65930,0],
  coral:[1900,67270,0,'stride'],coralDive:[1900,67600,0,'swim'],turtleTop:[4800,63600,1,'claws'],fortN:[5600,61560,0],fortS:[5400,67950,0],
  post1:[3600,64900,0],post2:[4600,65300,0],post3:[5500,65500,0],
  gate:[5850,65560,0],gateBasin:[6080,65600,0,'swim'],gateE:[6480,65600,0,'stride'],galleon:[6020,65840,0,'swim'],
  mangrove:[2600,69700,0],fireflies:[2600,69560,0],mangroveFort:[4300,69500,0],backdoor:[3900,61800,0,'swim'],reach:[2500,61200,0,'swim'],gillyRaft:[2400,61400,0,'swim'],
  // the Glass Desert
  strand:[6900,65640,0],strandFerry:[6670,65750,0],bones:[7300,62320,0],ridge:[7300,63320,0],ridgeTop:[7420,63228,1,'dbljump'],ridge2Top:[7400,67828,1,'dbljump'],
  dunes:[8400,64300,0],duneTop:[8400,63500,1],highdune:[9480,65400,2],quicksand:[8600,64600,0],
  sable:[9800,67350,0],well:[9800,67830,0],wellIslet:[9800,67710,0],kiln:[10150,67420,0],dusty:[9100,67300,0],juniper:[9250,67400,0],
  mouth:[10600,63300,0],mouthIn:[10600,62960,0,'wings'],wormfields:[10400,62200,0],wormShrine:[10300,63560,0],
  gap:[10640,67230,0],gapE:[11160,67240,0],flats:[11800,67800,0],temple:[12300,68030,0],templeTop:[12300,68470,1],mirage:[8700,70500,0],
  shatter:[12500,62200,0],mesa:[12450,61700,0],mesaTop:[12000,61300,3,'claws'],crater:[12420,60560,0,'wings'],
  heights:[12100,64900,2],heights4:[12520,63700,4,'moon'],moonpath:[12450,65470,0],mp1:[12620,65296,1,'moon'],mp2:[12780,64918,3,'moon'],mp3:[12970,64490,5,'moon'],obsdoor:[12968,64350,6,'moon'],
  terrace:[13600,64050,6,'moon'],edge:[13700,64050,6,'moon'],pier:[13600,65450,0],pierEnd:[13700,65450,0],
  // the side places of the new powers
  rift:[12560,70300,0],riftIsle:[12950,70300,0,'moon'],hollow:[12010,62500,0],hollowIn:[12010,62210,0,'moon'],needle:[12520,61180,3,'grapple'],
  store:[8100,66480,0],storeIn:[8050,66680,0,'burrow'],packed1:[8100,62700,0],packed2:[9700,64700,0],packed3:[8400,68400,0],wormChest:[10470,62060,0],heightsChest:[12520,63600,4,'moon']
};
function m3wSpot(name){ const s=M3W_SPOTS[name]; return s?{x:s[0],y:s[1],lvl:s[2]|0,how:s[3]||''}:null; }
// ---------- debug hooks (window.__eb.m3w)
window.__ebX=Object.assign(window.__ebX||{},{
  m3w:{M3WD,M3WG,M3WK,M3W_MP,M3W_CORAL,M3W_SPOTS,M3W_FERRY,spot:m3wSpot,sync:m3wSync,region:(x,y)=>m3wRegion(x,y,0),landD:m3wLandD,shallow:m3wShallow,sink:m3wSinkAt,block:m3wBlock,coralSpot:m3wCoralSpot,jinx:m3wJinxSpot,lit:()=>m3wPathLit(),
    set(flag,v){ G.flags[flag]=v===undefined?true:v; m3wSync(); return {flag,v:G.flags[flag]}; },
    // define a bare m_sail stage (only when the story module is not in the build) so the Far Pier can be tested
    sail(){ if(!m3wStage('m_sail')) defineStages(4,[{id:'m_sail'}]); goStage('m_sail',{card:false,quiet:true}); return G.stage; },
    spots:M3W_SPOTS,
    go(name){ const s=M3W_SPOTS[name]; if(!s) return null; return window.__ebX.goMap(3,s[0],s[1]); },
    objs:()=>M3WD.objs.length, ph:()=>M3WD.ph, stride:(x,y)=>mapStrideBlocked(x,y), blocked:(x,y)=>blockedAt(x,y),
    // reachability on foot (8 px cells, the engine's own blocking; o.stride lets Water Stride count, o.swim the Dive)
    flood(sx,sy,o){ o=o||{}; const cs=o.cs||10, bb=o.bb||[0,60000,14000,71000], x0=bb[0], y0=bb[1], w=Math.ceil((bb[2]-bb[0])/cs), h=Math.ceil((bb[3]-bb[1])/cs), seen=new Uint8Array(w*h), q=[];
      const pass=(x,y)=>{ if(outOfMap(x,y,30)) return false; if(colAt(x,y,5)) return false; const f=elevFace(x,y); if(f&1) return false; if(!blockedAt(x,y)) return true; if(o.swim&&typeof p4SwimAt==='function'&&p4SwimAt(x,y)) return true; return !!(o.stride&&!mapStrideBlocked(x,y)); };
      if(!pass(sx,sy)) return {fail:'start blocked'}; const k0=Math.floor((sy-y0)/cs)*w+Math.floor((sx-x0)/cs); seen[k0]=1; q.push(k0);
      // a step also has to cross no cliff rim on the way (rims are 8 px thin: the cells alone could step over them)
      while(q.length){ const c=q.pop(), i=c%w, j=(c/w)|0; for(let d=0;d<4;d++){ const a=i+(d===0?1:d===1?-1:0), b=j+(d===2?1:d===3?-1:0); if(a<0||b<0||a>=w||b>=h) continue; const k=b*w+a; if(seen[k]) continue; const nx=x0+(a+0.5)*cs, ny=y0+(b+0.5)*cs; if(!pass(nx,ny)) continue; if(!elevMoveOK(x0+(i+0.5)*cs,y0+(j+0.5)*cs,nx,ny)) continue; seen[k]=1; q.push(k); } }
      M3WD.flood={seen,w,h,x0,y0,cs}; let n=0; for(const v of seen) n+=v; return {n}; },
    at(x,y){ const F=M3WD.flood; if(!F) return false; const i=Math.floor((x-F.x0)/F.cs), j=Math.floor((y-F.y0)/F.cs); for(let dj=-2;dj<=2;dj++) for(let di=-2;di<=2;di++){ const a=i+di,b=j+dj; if(a>=0&&b>=0&&a<F.w&&b<F.h&&F.seen[b*F.w+a]) return true; } return false; },
    door:(area,i)=>{ const d=DOORS.filter(q=>q.area===area)[i||0]; if(d) enterArea(d.area,d); return !!AREA; }, doors:()=>DOORS.filter(d=>mapAt(d.y)===3&&d.x<IZX-50).map(d=>[d.area,Math.round(d.x),Math.round(d.y)]),
    shrines:()=>SHRINES.filter(q=>mapAt(q.y)===3&&q.x<IZX-50).map(q=>q.id), chests:()=>CHESTS.filter(c=>mapAt(c.y)===3&&c.x<IZX-50).map(c=>[c.id,Math.round(c.x),Math.round(c.y),c.b]),
    EDEF:()=>Object.keys(EDEF), camps:()=>CAMPS.filter(c=>mapAt(c.y)===3).map(c=>[c.id,c.units.map(u=>u.join(':')).join(',')]), p4:()=>P4.out.filter(o=>mapAt(o.y)===3).map(o=>o.p4+':'+o.id)}
});
