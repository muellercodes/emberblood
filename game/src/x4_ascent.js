
// ================= Finale ascent: the outdoor puzzle kit and every puzzle stretch on Nightfall Peak (map 4)
// Bible: scratchpad/bible/FINALE.md 5 (the ascent, stretch by stretch), 15 (the kit), 16 (the Moth Memories), 3.4 (calm
// air), 17 (save keys). Built on x4_world's rings, anchors and hooks (scratchpad/N4WORLD.md: n4wWall, n4wOpen,
// n4wHazard, n4wTide), the power kits (p2Add, p3Add/p3On/p3OnPound/WIND.stream, p4Add/p4MoonHits, armsAdd) and ELEV.
// Every stretch needs the powers of its ring (and older ones), reads at a glance (glowing gold = use me, violet = shadow,
// silver = moonlight) and stays fair on Easy (no pixel timing). Walls are n4wWall so they stop flight and jumps too.
// State lives in G.flags / G.found with the n_ prefix (no new G fields); live timers are rebuilt when G changes.
// Doc: scratchpad/N4ASCENT.md. Prefix n4a/N4A, debug window.__ebX.n4a (also __eb.n4a), cell type ids: none used.
const N4A={g:null,objs:[],byId:{},lm:[],t:0,built:false,paint:0,fights:true,hooks:{},said:{},amb:[],stand:{},skim:false,
  echoTypes:{1:'n_echo_vor',2:'n_echo_vesper',3:'n_echo_glaciar',4:'n_echo_hush'},
  shadeFallback:{n_shade:'kobold',n_shade_drake:'drakeling',n_shade_wolf:'wolf',n_frostshade:'slime',n_mothling:'bat',n_inkknight:'knight',n_glasswing:'cultist',n_lampmoth:null},
  glassT:0,rise:null,song:null,lastFoot:null};
const N4AD=Math.PI/180;
const n4aP=(r,a)=>[4500+r*Math.sin(a*N4AD),85200+r*Math.cos(a*N4AD)];
function n4aAng(x,y){ let a=Math.atan2(x-4500,y-85200)/N4AD; return a<0?a+360:a; }
const n4aR=(x,y)=>Math.hypot(x-4500,y-85200);
function n4aIn(a,a0,a1){ let d=(a-a0)%360; if(d<0) d+=360; return d<=a1-a0; }
const n4aSec=(x,y,r0,r1,a0,a1)=>{ const r=n4aR(x,y); return r>=r0&&r<=r1&&n4aIn(n4aAng(x,y),a0,a1); };
const n4aDw=(px,r)=>px/r/N4AD;
const n4aF=k=>!!(G&&G.flags&&G.flags[k]);
const n4aFound=k=>!!(G&&G.found&&G.found[k]);
const n4aDiff=()=>{ const d=typeof diffIdx==='number'?diffIdx:1; return d<=0?0:d>=2?2:1; };
const n4aByDiff=(e,n,h)=>[e,n,h][n4aDiff()];
const n4aOn4=()=>!!G&&!!player&&!AREA&&player.x<IZX-50&&player.y>=79900&&player.y<=91100&&curMap()===4;
const n4aLvl=()=>elevLvl(player.x,player.y);
const n4aAir=()=>!!player&&(player.flying||(player.z||0)>3||!!player.hop);
const n4aHas=id=>typeof hasAbil==='function'&&!!G&&G.mode==='story'&&hasAbil(id);
const n4aSegD=(x,y,a,b)=>segD(x,y,a[0],a[1],b[0],b[1]);
function n4aBB(P,m){ m=m||0; const b=[1e9,1e9,-1e9,-1e9]; for(const p of P){ if(p[0]<b[0]) b[0]=p[0]; if(p[1]<b[1]) b[1]=p[1]; if(p[0]>b[2]) b[2]=p[0]; if(p[1]>b[3]) b[3]=p[1]; } return [b[0]-m,b[1]-m,b[2]+m,b[3]+m]; }
const n4aSecBB=(r0,r1,a0,a1,m)=>{ const P=[]; for(let a=a0;a<=a1+0.001;a+=Math.max(0.5,(a1-a0)/12)){ P.push(n4aP(r0,a)); P.push(n4aP(r1,a)); } return n4aBB(P,m||0); };
const n4aView=(x,y,m)=>inView(x,y,m||80);
const n4aNear=(x,y,r)=>!!player&&dist2(player.x,player.y,x,y)<r*r;
// x4_world helpers (guarded: the world module owns them)
const n4aWall=(o,rm)=>typeof n4wWall==='function'?n4wWall(o,rm):null;
const n4aOpen=o=>typeof n4wOpen==='function'?n4wOpen(o):null;
const n4aHazard=o=>typeof n4wHazard==='function'?n4wHazard(o):null;
const n4aHazAt=(x,y)=>typeof n4wHazAt==='function'?n4wHazAt(x,y):null;

// ---------- sounds of our own (chimes, clunks, a music box, ice, ink, the moon door)
function n4aSnd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted) return; v=v==null?1:v;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.45*v; out.connect(ac.destination);
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    const nz=(dur,vol,ft,f0,f1,dl)=>{ if(!SFX.noise) return; const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.05,dur/3)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    switch(kind){
      case 'chime': [784,988,1175,1568].forEach((f,i)=>tn('sine',f,f*0.996,1.4,0.04,i*0.09)); break;
      case 'bigchime': [523,659,784,1047,1319].forEach((f,i)=>tn('sine',f,f*0.996,2.4,0.05,i*0.12)); tn('triangle',131,130,2.6,0.05); break;
      case 'tick': tn('square',2400,2200,0.03,0.02); tn('sine',1200,1100,0.05,0.02,0.01); break;
      case 'creak': tn('sawtooth',80,60,0.6,0.02); nz(0.5,0.04,'bandpass',420,260); break;
      case 'clunk': tn('square',140,70,0.18,0.05); nz(0.2,0.08,'lowpass',600,150); break;
      case 'clank': tn('square',420,300,0.12,0.04); tn('sine',880,860,0.4,0.03,0.02); break;
      case 'crystal': [1319,1760,2093].forEach((f,i)=>tn('sine',f,f,0.7,0.035,i*0.05)); break;
      case 'lamp': [660,880,990].forEach((f,i)=>tn('sine',f,f,0.6,0.035,i*0.06)); break;
      case 'gutter': nz(0.5,0.06,'bandpass',900,300); tn('sine',440,300,0.4,0.015); break;
      case 'crack': nz(0.6,0.22,'lowpass',2200,200); tn('square',90,40,0.5,0.06); break;
      case 'ice': nz(0.7,0.12,'highpass',3000,1200); [1568,2093,2637].forEach((f,i)=>tn('sine',f,f*0.98,0.5,0.02,i*0.05)); break;
      case 'melt': nz(0.6,0.06,'bandpass',1800,600); break;
      case 'whoosh': nz(0.5,0.12,'bandpass',400,1600); break;
      case 'splash': nz(0.6,0.16,'lowpass',1600,200); tn('sine',220,90,0.4,0.04); break;
      case 'gloomp': tn('sine',90,50,1.4,0.1); nz(1.8,0.12,'lowpass',500,120); [392,523,659].forEach((f,i)=>tn('sine',f,f,1.6,0.025,0.4+i*0.15)); break;
      case 'eye': tn('sine',330,660,0.5,0.04); [988,1319].forEach((f,i)=>tn('sine',f,f,0.8,0.03,0.25+i*0.08)); break;
      case 'fsst': nz(0.3,0.05,'highpass',3000,800); break;
      case 'zap': nz(0.35,0.2,'highpass',2000,400); tn('sawtooth',880,110,0.3,0.04); break;
      case 'warn': tn('sine',220,240,0.3,0.03); break;
      case 'door': tn('sine',196,262,1.6,0.06); [523,659,784,1047].forEach((f,i)=>tn('sine',f,f,1.8,0.03,0.5+i*0.12)); break;
      case 'hum': tn('sine',110,110,1.2,0.04); tn('sine',165,165,1.2,0.025); break;
      case 'nope': tn('triangle',300,200,0.2,0.03); break;
      case 'heart': [523,659,784,1047].forEach((f,i)=>tn('triangle',f,f,0.5,0.04,i*0.07)); break;
    }
  }catch(e){}
}
// the lantern song (THREADS 14.4: the tune x9_music uses), played as a music box: degrees of a major scale : eighths
const N4A_SONG='1:3 3:1 5:2 3:2 4:2 3:2 2:4 2:3 4:1 6:2 4:2 5:2 4:2 3:4 5:2 6:2 8:2 6:2 5:2 3:2 5:4 6:2 7:2 8:4 5:2 2:2 1:4';
function n4aSong(o){
  o=o||{}; const ac=SFX.ac; if(!ac||SFX.muted) return 0;
  const SC=[0,0,2,4,5,7,9,11,12], base=o.base||523.25, tempo=o.eighth||(o.slow?0.36:0.24); let t=ac.currentTime+0.05, n=0;
  try{ const out=ac.createGain(); out.gain.value=0.5*(o.vol||1); out.connect(ac.destination);
    for(const tok of N4A_SONG.split(' ')){ const [d,l]=tok.split(':').map(Number), f=base*Math.pow(2,SC[d]/12), dur=l*tempo;
      for(const [mul,vol,type] of [[1,0.05,'sine'],[2,0.018,'sine'],[4,0.006,'triangle']]){ const os=ac.createOscillator(), g=ac.createGain(); os.type=type; os.frequency.value=f*mul; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.008); g.gain.exponentialRampToValueAtTime(0.0006,t+Math.max(0.5,dur*1.6)); os.connect(g); g.connect(out); os.start(t); os.stop(t+Math.max(0.5,dur*1.6)+0.05); }
      t+=dur; n++; } }catch(e){}
  return n;
}

// ---------- words: the bible's scenes and bubbles belong to x4_story (STORY[key]); ours are stand-ins that play only
// while no other module has defined that key, so x4_story's version always wins
function n4aLinesOf(key){ const v=typeof STORY!=='undefined'?STORY[key]:null; const L=typeof v==='function'?v():v; return Array.isArray(L)&&L.length?L:null; }
function n4aScene(key,lines,done){
  const L=n4aLinesOf(key)||lines;
  if(!L||!L.length){ if(done) try{ done(); }catch(e){ console.error(e); } return false; }
  runDialogue(L.map(l=>Array.isArray(l)?l.slice():Object.assign({},l)),()=>{ scene='play'; if(done) try{ done(); }catch(e){ console.error(e); } try{ saveGame(); }catch(e){} });
  return true;
}
// a one-line bubble over Ash (or Pip); x4_story may define the same key as a one-line STORY entry
function n4aBub(key,who,text,o){
  o=o||{}; if(o.once!==false&&N4A.said[key]&&G.time-N4A.said[key]<(o.again||9999)) return false; N4A.said[key]=G.time;
  const L=n4aLinesOf(key); if(L){ const l=Array.isArray(L[0])?L[0]:null; if(l){ who=l[0]; text=l[1]; } }
  const s=SPK[who]||{name:who,col:'#e0d0ff'}, a=who==='pip'&&G.pip?G.pip:player;
  try{ bubble(a,text,{who:s.name||'',col:s.col}); }catch(e){ try{ taunt(who,text); }catch(e2){} }
  return true;
}
// events for the other finale modules: N4A.on('flame',fn) ... (see N4ASCENT.md); x4_story can also define n4sAscent(evt,data)
N4A.on=(evt,fn)=>{ (N4A.hooks[evt]||(N4A.hooks[evt]=[])).push(fn); return fn; };
function n4aEmit(evt,data){
  for(const fn of N4A.hooks[evt]||[]) try{ fn(data); }catch(e){ console.error('n4a hook',evt,e); }
  if(typeof n4sAscent==='function') try{ n4sAscent(evt,data); }catch(e){ console.error('n4sAscent',evt,e); }
  try{ if(typeof questPoke==='function') questPoke(); }catch(e){}
}
function n4aSave(){ try{ saveGame(); }catch(e){} }
function n4aBanner(t,s,d){ try{ setBanner(t,s||'',d||2.4); }catch(e){} }
function n4aTip(id,title,text,dur){ if(N4A.said['tip_'+id]) return; N4A.said['tip_'+id]=G.time; try{ mvTip(title,text,dur||6,'n4a_'+id); }catch(e){} }
const n4aSay=(x,y,text,col,key,again)=>{ if(key){ const k='say_'+key; if(N4A.said[k]&&G.time-N4A.said[k]<(again||4)) return; N4A.said[k]=G.time; } ftext(x,y,text,col||'#e8dcff',13); };

// ---------- the kit: every object is {kind,id,x,y,r,...} with optional handlers
//   tick(o,dt)            every frame while Ash is on the peak and the object is near (o.near px, default 1400)
//   ground(o,t)           drawn flat after the ground chunks (under props and figures)
//   stand(o,t), sy(o)     drawn sorted with the figures (sy = the y it sorts at, default o.y)
//   over(o,t)             drawn over the figures (beams, telegraphs, glows)
//   hit(o,src,x,y,r)      a weapon touched it: 'whip','glaive','bomb','hammer','arrow','boomerang','slash','fire'
//   pound(o,info)         a Ground Pound landed (info {x,y,R})
//   fire(o,dt,blue)       fire breath on it this frame (blue: the Blaze jet)
//   moon(o,dt)            Moonfire on it this frame
//   reset(o)              G changed (a new game or a loaded save): rebuild the live state from G
function n4aAdd(kind,o){ o.kind=kind; if(!o.id) o.id='n4a_'+kind+'_'+N4A.objs.length; o.r=o.r||18; o.near=o.near||1400; N4A.objs.push(o); N4A.byId[o.id]=o; return o; }
// a prompt (USE) at a spot: a landmark with a live prompt text and an action
function n4aPrompt(o,x,y,r,text,act,hidden){
  const L={id:'n4a_lm_'+o.id+'_'+N4A.lm.length,k:'n4a',x,y,r:0,rr:r||24,clr:0.001,noNudge:true,draw:()=>{},act:()=>{ try{ act(o); }catch(e){ console.error('n4a act',e); } },
    hidden:()=>!n4aOn4()||(hidden?!!hidden(o):false)};
  Object.defineProperty(L,'prompt',{get(){ if(!G||L.hidden()) return null; const t=typeof text==='function'?text(o):text; return t||null; },configurable:true});
  N4A.lm.push(L); LANDMARKS.push(L); return L;
}
function n4aReset(){
  N4A.g=G; N4A.said={}; N4A.glassT=0; N4A.rise=null; N4A.song=null; N4A.skim=false;
  for(const a of N4A.amb) a.live=null;
  for(const o of N4A.objs) if(o.reset) try{ o.reset(o); }catch(e){ console.error('n4a reset',o.id,e); }
}
// the light pass: a light per glowing object, its strength set every frame (LIGHTS is the engine's list)
function n4aLight(x,y,r){ const L={x,y,r,i:0}; LIGHTS.push(L); return L; }

// ---------- dispatch: weapons, the pound, breath, Blaze, Moonfire
function n4aHitAll(x,y,r,src){
  if(!n4aOn4()) return false; let hit=false;
  for(const o of N4A.objs){ if(!o.hit) continue; const R=(o.hr||o.r)+(r||8); if(dist2(x,y,o.x,o.y)>R*R&&!(o.hitTest&&o.hitTest(o,x,y,r))) continue; try{ if(o.hit(o,src,x,y,r)) hit=true; }catch(e){ console.error('n4a hit',o.id,e); } }
  return hit;
}
// outdoors the whip, the glaive, bombs, the hammer and fire reach the arms pieces through armsWorldHit
{ const base=armsWorldHit; armsWorldHit=function(x,y,r,src){ let h=base(x,y,r,src); try{ if(n4aOn4()&&n4aHitAll(x,y,r,src)) h=true; }catch(e){ console.error(e); } return h; }; }
// arrows and the boomerang only call areaObjHit (which does nothing outdoors): on the peak they reach our pieces
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){ if(!AREA&&(src==='arrow'||src==='boomerang')&&n4aOn4()){ try{ if(n4aHitAll(x,y,r,src)) return true; }catch(e){ console.error(e); } } return base.apply(this,arguments); }; }
// melee swings (sword, daggers, spear; the hammer has its own impact through armsWorldHit)
{ const base=swingBreakables; swingBreakables=function(px,py,dir,range,half){ base.apply(this,arguments);
    try{ if(!n4aOn4()||(typeof ARMS!=='undefined'&&ARMS.inHam)) return; const w=curWeapon(), src=w==='hammer'?'hammer':w==='daggers'?'daggers':w==='spear'?'spear':'slash';
      for(const o of N4A.objs){ if(!o.hit) continue; if(!inArcC(px,py,dir,range+8,half,{x:o.x,y:o.y-(o.hz||0),r:o.hr||o.r})) continue; o.hit(o,src,o.x,o.y,4); } }catch(e){ console.error(e); } }; }
if(typeof p3OnPound==='function') p3OnPound(info=>{ try{ if(!n4aOn4()||info.drum) return; for(const o of N4A.objs){ if(!o.pound) continue; const R=(o.pr||o.r)+info.R; if(dist2(info.x,info.y,o.x,o.y)>R*R&&!(o.poundTest&&o.poundTest(o,info))) continue; o.pound(o,info); } }catch(e){ console.error('n4a pound',e); } });
// plain fire breath (and the blue jet, which every stock fire test also feels) on our pieces
{ const base=breathIgnite; breathIgnite=function(mx,my,ang,dt){ base(mx,my,ang,dt);
    try{ if(!n4aOn4()||(typeof p4MoonOn==='function'&&p4MoonOn())) return; const blue=typeof P3!=='undefined'&&P3.bz&&P3.bz.blue;
      for(const o of N4A.objs){ if(!o.fire) continue; const R=o.fr||o.r; if(inArcC(mx,my,ang,175,0.45,{x:o.x,y:o.y-(o.hz||0),r:R})||(o.fireTest&&o.fireTest(o,mx,my,ang))) o.fire(o,dt,!!blue); } }catch(e){ console.error(e); } }; }
// chunks paint the ground under our moving walkways (clock hands, gear teeth) as ink: we draw the walkway live on top
{ const base=genChunk; genChunk=function(){ N4A.paint++; try{ return base.apply(this,arguments); } finally{ N4A.paint--; } }; }

// ================= art: cached outlined sprites (STYLE.md: bold outline, flat cel tones lit from the top left), live glows
const N4AOC='#0b0712';
const N4APAL={glass:['#120c1c','#2a2142','#4d4072','#c4b0ff'],stone:['#3c3452','#5e557a','#8c84ac','#e4dcff'],brass:['#4e3418','#86622e','#c49a4a','#ffe6a0'],
  ice:['#0c1830','#1d335e','#3d68a6','#c8ecff'],moon:['#4a4a86','#8a8ac8','#d4d8ff','#ffffff'],ember:['#7a2a10','#d0601e','#ffb04a','#fff0b0']};
const N4AS=new Map();
function n4aSpr(key,w,h,ox,oy,draw,ow){
  const k=(LOOK.sb?'s:':'c:')+key; let c=N4AS.get(k); if(c) return c;
  const sc=2, cv=mkCanvas(Math.ceil(w*sc),Math.ceil(h*sc)), g=cv.getContext('2d'); g.scale(sc,sc); g.translate(ox,oy); g.lineCap='round'; g.lineJoin='round';
  try{ draw(g); }catch(e){ console.error('n4a art',key,e); }
  c=LOOK.sb?outlineSprite(cv,N4AOC,ow||1.6,{force:true}):cv; c.ox=ox; c.oy=oy; c.w2=w; c.h2=h; N4AS.set(k,c); return c;
}
function n4aPut(c,x,y,s,a){ s=s||1; const p=ctx.globalAlpha; if(a!=null) ctx.globalAlpha=p*a; ctx.drawImage(c,x-c.ox*s,y-c.oy*s,c.w2*s,c.h2*s); ctx.globalAlpha=p; }
function n4aShade(g,rx,ry,dy){ g.fillStyle='rgba(6,3,12,.38)'; g.beginPath(); g.ellipse(2,dy||0,rx,ry,0,0,TAU); g.fill(); }
function n4aBox(g,x,y,w,h,P){ g.fillStyle=P[0]; g.fillRect(x,y,w,h); g.fillStyle=P[1]; g.fillRect(x,y,w*0.72,h); g.fillStyle=P[2]; g.fillRect(x,y,Math.max(1.5,w*0.14),h); }
function n4aGlint(g,x,y,s,col){ g.fillStyle=col||'#eee6ff'; g.beginPath(); g.moveTo(x,y-s); g.quadraticCurveTo(x,y,x+s*0.7,y); g.quadraticCurveTo(x,y,x,y+s); g.quadraticCurveTo(x,y,x-s*0.7,y); g.quadraticCurveTo(x,y,x,y-s); g.fill(); }
function n4aTri(g,ax,ay,bx,by,cx,cy){ g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.lineTo(cx,cy); g.closePath(); g.fill(); }
// a glow that is visible through the peak's dark (additive)
function n4aGlow(x,y,r,col,a){ glowAt(x,y,r,col,a); }
// a soft ring of light on the ground (a timer, a target)
function n4aRing(x,y,r,col,a,w){ ctx.save(); ctx.strokeStyle=`rgba(${col},${a})`; ctx.lineWidth=w||3; ctx.beginPath(); ctx.ellipse(x,y,r,r*0.55,0,0,TAU); ctx.stroke(); ctx.restore(); }
function n4aArcRing(x,y,r,col,a,k,w){ ctx.save(); ctx.strokeStyle=`rgba(${col},${a})`; ctx.lineWidth=w||3; ctx.lineCap='round'; ctx.beginPath(); ctx.ellipse(x,y,r,r*0.55,0,-Math.PI/2,-Math.PI/2+TAU*clamp(k,0,1)); ctx.stroke(); ctx.restore(); }

// a black glass lantern on a post (the Bridgefoot lanterns, the choir's lanterns): lit is warm gold, dark is violet glass
function n4aLanternArt(g,lit,frost){
  n4aShade(g,11,4,1);
  n4aBox(g,-3,-46,6,47,N4APAL.glass); g.fillStyle=N4APAL.glass[0]; g.fillRect(-8,-3,16,4); g.fillRect(-7,-48,14,4);
  // the cage
  g.fillStyle=lit?'#ffc860':frost?'#9ec8f0':'#2a2346'; rrect(g,-9,-70,18,22,4); g.fill();
  if(lit){ g.fillStyle='#fff4c8'; rrect(g,-4,-66,8,13,3); g.fill(); }
  if(frost){ g.fillStyle='rgba(220,240,255,.85)'; rrect(g,-10,-71,20,9,4); g.fill(); g.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<4;i++) n4aTri(g,-8+i*5,-61,-6+i*5,-61,-7+i*5,-55-((i*7)%4)); }
  g.strokeStyle=N4APAL.glass[0]; g.lineWidth=2; rrect(g,-9,-70,18,22,4); g.stroke(); g.beginPath(); g.moveTo(0,-70); g.lineTo(0,-48); g.stroke();
  g.fillStyle=N4APAL.glass[1]; n4aTri(g,-12,-70,12,-70,0,-80); g.fillStyle=N4APAL.glass[2]; n4aTri(g,-12,-70,-2,-70,0,-80);
  g.strokeStyle=N4APAL.glass[0]; g.lineWidth=2.2; g.beginPath(); g.arc(0,-82,3,0,TAU); g.stroke();
  if(!lit&&!frost){ g.strokeStyle='rgba(190,170,255,.6)'; g.lineWidth=0.9; g.beginPath(); g.moveTo(-6,-67); g.lineTo(-2,-61); g.lineTo(-5,-56); g.stroke(); }
}
// a memory flame in a black glass bowl (bible 15 n_flame): taken, the bowl keeps a faint ember
function n4aBowlArt(g){
  n4aShade(g,22,7,4);
  g.fillStyle=N4APAL.glass[0]; g.beginPath(); g.ellipse(0,2,22,8,0,0,TAU); g.fill();
  g.fillStyle=N4APAL.glass[1]; g.beginPath(); g.moveTo(-14,-2); g.lineTo(14,-2); g.lineTo(8,-26); g.lineTo(-8,-26); g.closePath(); g.fill();
  g.fillStyle=N4APAL.glass[2]; g.beginPath(); g.moveTo(-14,-2); g.lineTo(-8,-2); g.lineTo(-4,-26); g.lineTo(-8,-26); g.closePath(); g.fill();
  g.fillStyle=N4APAL.glass[1]; g.beginPath(); g.ellipse(0,-28,20,7,0,0,TAU); g.fill(); g.fillStyle='#1a0e22'; g.beginPath(); g.ellipse(0,-28,15,4.5,0,0,TAU); g.fill();
  g.strokeStyle='rgba(255,150,90,.5)'; g.lineWidth=1; g.beginPath(); g.moveTo(-10,-10); g.lineTo(-4,-16); g.lineTo(2,-12); g.stroke();
}
function n4aDrawFlame(x,y,t,k,col){
  // a live flame: layered teardrops that flicker (k = size, col = [outer, mid, core])
  col=col||['255,120,50','255,190,80','255,250,210'];
  const f=Math.sin(t*11)*0.08+Math.sin(t*7.3)*0.06;
  n4aGlow(x,y-10*k,60*k,col[0],0.55); n4aGlow(x,y-8*k,22*k,col[2],0.6);
  for(let i=0;i<3;i++){ const s=k*(1-i*0.28), h=(34+i*0)*s*(1+f), w=13*s; ctx.fillStyle=`rgba(${col[i]},${0.95-i*0.1})`; ctx.beginPath(); ctx.moveTo(x,y-h); ctx.bezierCurveTo(x+w,y-h*0.55,x+w,y,x,y+2*s); ctx.bezierCurveTo(x-w,y,x-w,y-h*0.55,x,y-h); ctx.fill(); }
  if(Math.random()<0.25) emit(x+rand(-5,5)*k,y-14*k,1,{col:col[1],ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4,rise:20});
}
// a Moth Memory pane: a small stained-glass picture on a stand, lit from behind (bible 16)
const N4A_PANECOL=[null,['#c8d4ff','#7a6ad8','#2a1e5a'],['#ffd8a0','#6a5ab8','#24184a'],['#ffc070','#5a8ad0','#1e2a5a'],['#e0f0ff','#5a7ab8','#1a2a4a'],['#d8d0ff','#6a5aa8','#221a40'],['#ffd0e0','#8a5ab0','#2a1640']];
function n4aPaneArt(g,k){
  const C=N4A_PANECOL[k]||N4A_PANECOL[1];
  n4aShade(g,16,5,2);
  n4aBox(g,-2.5,-26,5,27,N4APAL.glass); g.fillStyle=N4APAL.glass[0]; g.fillRect(-10,-2,20,3);
  // the pane: an arched frame with lead lines and a little picture (a moon and a moth)
  g.fillStyle='#1a1028'; g.beginPath(); g.moveTo(-16,-24); g.lineTo(-16,-50); g.quadraticCurveTo(-16,-66,0,-66); g.quadraticCurveTo(16,-66,16,-50); g.lineTo(16,-24); g.closePath(); g.fill();
  g.fillStyle=C[2]; g.beginPath(); g.moveTo(-13,-27); g.lineTo(-13,-50); g.quadraticCurveTo(-13,-63,0,-63); g.quadraticCurveTo(13,-63,13,-50); g.lineTo(13,-27); g.closePath(); g.fill();
  g.fillStyle=C[1]; g.fillRect(-13,-40,26,13);
  g.fillStyle=C[0]; g.beginPath(); g.arc(k===6?4:0,-50,k===4?5:7,0,TAU); g.fill();
  if(k===6){ g.fillStyle=C[2]; g.beginPath(); g.arc(8,-52,5,0,TAU); g.fill(); }
  if(k===3){ g.fillStyle='#ffe0a0'; g.fillRect(-6,-36,4,6); }
  g.fillStyle='#e8e0ff'; for(const sd of [-1,1]){ g.beginPath(); g.ellipse(-6+sd*3,-38,3,2,sd*0.5,0,TAU); g.fill(); }
  g.strokeStyle='rgba(20,12,34,.9)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-13,-40); g.lineTo(13,-40); g.moveTo(0,-63); g.lineTo(0,-40); g.moveTo(-13,-27); g.lineTo(13,-27); g.stroke();
}
// a Heart Ember: a warm heart-shaped ember in a little glass cup (e9a's +10 max health)
function n4aHeartArt(g){
  n4aShade(g,12,4,2);
  g.fillStyle=N4APAL.glass[1]; g.beginPath(); g.moveTo(-10,0); g.lineTo(10,0); g.lineTo(7,-8); g.lineTo(-7,-8); g.closePath(); g.fill();
  g.fillStyle='#ff6a5a'; g.beginPath(); g.moveTo(0,-12); g.bezierCurveTo(-12,-22,-12,-34,-4,-34); g.bezierCurveTo(-1,-34,0,-31,0,-29); g.bezierCurveTo(0,-31,1,-34,4,-34); g.bezierCurveTo(12,-34,12,-22,0,-12); g.fill();
  g.fillStyle='#ffd0a0'; g.beginPath(); g.ellipse(-4,-28,2.4,3.4,-0.5,0,TAU); g.fill();
}

// ---------- shared pieces: gates (n4wWall with live art), memory flames, panes, heart embers, reward chests
// a gate across a ring: a thin wall along angle a from r0 to r1 (or a custom test), shut while shut(o) is true
function n4aGate(id,o){
  o=Object.assign({kind:'gate'},o); o.id=id;
  if(o.a!=null){ const [x0,y0]=n4aP(o.r0,o.a), [x1,y1]=n4aP(o.r1,o.a); o.A=[x0,y0]; o.B=[x1,y1]; o.x=(x0+x1)/2; o.y=(y0+y1)/2; o.th=o.th||16;
    o.test=o.test||((x,y)=>{ const r=n4aR(x,y); if(r<o.r0-2||r>o.r1+2) return false; return Math.abs(((n4aAng(x,y)-o.a+540)%360)-180)*N4AD*r<o.th; }); }
  else if(o.A&&o.B&&!o.test){ o.th=o.th||16; o.test=(x,y)=>n4aSegD(x,y,o.A,o.B)<o.th; }
  o.bb=o.bb||n4aBB([o.A,o.B],o.th+30);
  o.wall=n4aWall({id:'n4a_'+id,bb:o.bb,test:(x,y)=>!N4A.paint&&o.test(x,y),on:()=>{ try{ return !!o.shut(o); }catch(e){ return true; } }});
  o.open=0; o.r=o.r||40;
  return n4aAdd('gate',o);
}
// the flame: walk up, press USE; plays Ember's line (bible 15 n_flame)
function n4aFlame(id,x,y,o){
  o=Object.assign({x,y,r:26,key:'n_flame_'+id},o||{}); o.fid=id;
  const F=n4aAdd('flame',o);
  F.ready=F.ready||(()=>true);
  F.stand=(q,t)=>{ const taken=n4aFound(q.key); n4aPut(n4aSpr('bowl',48,40,24,34,n4aBowlArt),q.x,q.y);
    if(!q.ready(q)){ n4aGlow(q.x,q.y-30,18,'150,110,255',0.2); return; }
    if(taken){ n4aGlow(q.x,q.y-30,14,'255,130,70',0.35+0.1*Math.sin(t*3)); return; }
    n4aDrawFlame(q.x,q.y-26,t,1.1); };
  F.sy=q=>q.y+2;
  F.light=n4aLight(x,y-30,220);
  F.tick=(q,dt)=>{ q.light.i=n4aFound(q.key)?0.15:q.ready(q)?0.9:0; };
  n4aPrompt(F,x,y,30,q=>q.ready(q)&&!n4aFound(q.key)?S('Take the memory flame','Take the flame'):null,q=>n4aTakeFlame(q));
  return F;
}
function n4aTakeFlame(q){
  if(n4aFound(q.key)||!q.ready(q)) return;
  G.found[q.key]=1; const n=['leap','tide','sky'].filter(k=>n4aFound('n_flame_'+k)).length; G.flags.n_flames=n;
  n4aSnd('chime'); shake(3); flashA=Math.max(flashA,0.3); flashCol='255,190,110';
  for(let i=0;i<30;i++){ const a=rand(0,TAU); emit(q.x+Math.cos(a)*10,q.y-30+Math.sin(a)*8,1,{col:'255,190,90',ang:a,spread:0.3,smin:40,smax:180,lmin:.4,lmax:.9,zmin:1.5,zmax:3}); }
  const L={leap:['ember',S('The Leap! You still jump like you mean it.','The Leap! Great jumping!')],tide:['ember',S('The Tide! Water never stood a chance.',"The Tide! The water can't stop you.")],
    sky:['ember',S('The Sky! Every time you fly, I feel it in my wings. Well. My ghost wings.','The Sky! I feel it when you fly.')]}[q.fid];
  n4aEmit('flame',{id:q.fid,n});
  n4aScene('n_flame_'+q.fid,L?[L]:null,()=>{
    if(n===3){ n4aEmit('flames3',{});
      n4aScene('n_trials_done',[['ember',S("That's all three. Up ahead, there's a shadow sitting on a throne. Don't be fooled. It's only a memory.",'All three! Up ahead is a shadow on a throne. It is only a memory.')],
        ['ember',S("Memories can't hurt you. ...These ones can, a bit. Be careful, little ember.","Memories can't hurt you. Well. These can. Be careful!")]]); }
    else n4aBanner(S('A memory flame','A memory flame'),S(`${n} of 3. The Echo Gate stirs.`,`${n} of 3 flames.`),2.2);
  });
  n4aSave();
}
// a Moth Memory pane (bible 16): read it, it goes into the journal's "Moth Memories"; all six: +10 max health
const N4A_PANE={
 1:{title:S('The New Moon','The New Moon'),lines:[['narr',S('In the glass: a brand-new moon, round and bright, and one tiny grey moth dancing round it.','A new moon. A tiny moth dances around it.')],['n_memory',S('When the moon was new, it had one moth. She loved it more than anything.','The moon had one moth. She loved it so much.')]]},
 2:{title:S('Every Morning','Every Morning'),lines:[['narr',S("The moon is sinking behind the hills. The little moth is chasing it, and she can't keep up.",'The moon goes down. The moth chases it.')],['n_memory',S("Every morning the moon went away. Every morning she waited for it to come back. It always did. She always worried it wouldn't.",'Every morning the moon left. It always came back. She always worried.')]]},
 3:{title:S('The Girl with the Lantern','The Girl with the Lantern'),lines:[['narr',S('A hill at night. A girl with little horns holds up a paper lantern, and the little moth sits on it, warming her wings.','A girl with horns holds a lantern. The moth sits on it to get warm.')],['n_memory',S('On the very first Lantern Day, a girl named Ember lit a lantern on a hill. The cold little moth came down to be warm. Ember called her Nyx.','On the first Lantern Day, Ember lit a lantern. The moth came to be warm. Ember named her Nyx.')]]},
 4:{title:S('Someone Else Lit It','Someone Else Lit It'),lines:[['narr',S("The same hill, many years later. Someone else is lighting the lantern. The moth looks for the girl with horns. She isn't there.",'Years later. Someone else lights the lantern. The girl is gone.')],['n_memory',S('Ember lit a lantern every year. Then one year someone else lit it. Ember was gone, the way everyone is gone one day. Nyx did not understand.','One year, Ember was gone. Nyx did not understand.')]]},
 5:{title:S('Thinner Every Month','Thinner Every Month'),lines:[['narr',S("The moon is a thin silver curl. The moth is wrapped round it, holding on.",'The moon is thin. The moth holds on to it.')],['n_memory',S('Every month the moon grew thin. "It will leave me too," thought Nyx. "Everyone leaves." She grew bigger, and colder, and very, very afraid.','"The moon will leave me too," Nyx thought. She grew big and cold and scared.')]]},
 6:{title:S('Just One Bite','Just One Bite'),lines:[['narr',S('A huge grey moth with her mouth open, and a bite out of the moon.','A huge moth takes a bite of the moon.')],['n_memory',S('So she took a bite. Just a small one. To keep it safe inside her, where it could never leave. Then she took another.','She took a bite to keep it safe inside her. Then another.')]]}};
function n4aPaneN(){ let n=0; for(let k=1;k<=6;k++) if(n4aFound('n_pane_'+k)) n++; return n; }
function n4aPane(k,x,y,o){
  o=Object.assign({x,y,r:22,k,hz:40},o||{});
  const P=n4aAdd('pane',o); P.ready=P.ready||(()=>true);
  P.stand=(q,t)=>{ if(!q.ready(q)) return; const read=n4aFound('n_pane_'+q.k), f=0.7+0.3*Math.sin(t*2+q.k);
    n4aGlow(q.x,q.y-46,read?30:46,read?'200,190,255':'220,200,255',(read?0.25:0.5)*f);
    n4aPut(n4aSpr('pane'+q.k,40,74,20,70,g=>n4aPaneArt(g,q.k)),q.x,q.y);
    if(!read&&Math.random()<0.05) emit(q.x+rand(-12,12),q.y-50+rand(-10,10),1,{col:'220,210,255',ang:-Math.PI/2,spread:0.5,smin:5,smax:20,lmin:.6,lmax:1.2,zmin:1,zmax:2,rise:10}); };
  P.sy=q=>q.y+2; P.light=n4aLight(x,y-46,170);
  P.tick=q=>{ q.light.i=q.ready(q)?(n4aFound('n_pane_'+q.k)?0.3:0.6):0; };
  n4aPrompt(P,x,y,30,q=>q.ready(q)?S('Look at the glass picture','Look at the glass'):null,q=>n4aReadPane(q),q=>!q.ready(q));
  return P;
}
function n4aReadPane(q){
  const k=q.k, first=!n4aFound('n_pane_'+k); G.found['n_pane_'+k]=1; const n=n4aPaneN(); G.flags.n_panes=n;
  if(k===3) G.flags.n_knows=1;
  n4aSnd('crystal'); n4aEmit('pane',{k,n,first});
  const D=N4A_PANE[k];
  n4aScene('n_pane_'+k,D.lines,()=>{
    if(k===3&&first) n4aBub('n_bub_pane3','ash',S('Nyx? Her name was Nyx?','Her name was Nyx?'));
    if(first) n4aBanner(S('A Moth Memory','A Moth Memory'),D.title+' ('+n+'/6)',2.6);
    if(n>=6&&first&&!G.flags.n_panes_hp){ G.flags.n_panes_hp=1; player.maxHp+=10; player.hp=player.maxHp; n4aSnd('heart'); n4aBanner(S('All six Moth Memories','All six memories'),S('+10 max health','+10 health'),3);
      n4aScene('n_panes_all',[['ash',S("She wasn't trying to be a monster. She was just scared of being alone. ...That's still not okay. But I get it.",'She was not a monster. She was scared of being alone. That is not okay. But I get it.')]]); }
    n4aSave();
  });
}
// a Heart Ember on the peak (e9a's gainHeartEmber, saved under its id)
function n4aHeart(id,x,y,o){
  o=Object.assign({x,y,r:18,hid:id},o||{}); const H=n4aAdd('heart',o); H.ready=H.ready||(()=>true);
  H.stand=(q,t)=>{ if(!q.ready(q)||n4aFound('he_'+q.hid)) return; const b=Math.sin(t*3)*3; n4aGlow(q.x,q.y-24+b,36,'255,110,100',0.55); n4aPut(n4aSpr('heart',30,40,15,36,n4aHeartArt),q.x,q.y+b*0.3); };
  H.sy=q=>q.y+2;
  H.tick=(q,dt)=>{ if(!q.ready(q)||n4aFound('he_'+q.hid)||n4aAir()) return; if(n4aNear(q.x,q.y,26)&&Math.abs(elevLvl(q.x,q.y)-n4aLvl())<1){ if(typeof gainHeartEmber==='function') gainHeartEmber(q.hid); else{ G.found['he_'+q.hid]=true; player.maxHp+=10; player.hp=player.maxHp; } n4aEmit('heartember',{id:q.hid}); if(q.then) q.then(q); n4aSave(); } };
  return H;
}
// a reward chest that appears when its puzzle is done (opened like any chest: openChest)
function n4aChest(id,x,y,ready){
  const C=n4aAdd('chest',{id:'n_chest_'+id,x,y,r:20,ready,ch:{id:'n_chest_'+id,x,y,open:false}});
  C.reset=q=>{ q.ch.open=!!(G.chestsOpened&&G.chestsOpened[q.ch.id]); };
  C.stand=(q,t)=>{ if(!q.ready()) return; q.ch.open=!!(G.chestsOpened&&G.chestsOpened[q.ch.id]); if(!q.ch.open){ n4aGlow(q.x,q.y,40,'255,200,110',0.3+0.1*Math.sin(t*3)); } drawChest(q.ch,t); };
  C.sy=q=>q.y+10;
  n4aPrompt(C,x,y,22,q=>q.ready()&&!(G.chestsOpened&&G.chestsOpened[q.ch.id])?S('Open the chest','Open the chest'):null,q=>{ if(G.chestsOpened&&G.chestsOpened[q.ch.id]) return; openChest(q.ch); G.found[q.ch.id]=1; n4aEmit('chest',{id:q.ch.id}); },q=>!q.ready());
  return C;
}

// ---------- fights on the stretches (bible 5: "about 3 small fights per ring"; types from x4_foes when it is there)
// An ambush spawns once when Ash comes near (and its when() holds); beaten, it is saved (G.found.n_amb_<id>) and never
// comes back on the main path. Optional arcs set respawn:300. x4_foes can switch all of these off: N4A.fights=false.
function n4aType(t){ if(typeof EDEF!=='undefined'&&EDEF[t]) return t; const f=N4A.shadeFallback[t]; return f&&EDEF[f]?f:null; }
function n4aAmbush(id,o){ const A=Object.assign({id,r:360,n:3,types:['n_shade'],level:21,when:()=>true,live:null,spread:[60,220]},o); N4A.amb.push(A); return A; }
function n4aSpawnAt(type,x,y,lv,opt){
  const t=n4aType(type); if(!t) return null;
  let sx=x, sy=y; for(let i=0;i<20;i++){ const a=rand(0,TAU), d=rand(0,60); const qx=x+Math.cos(a)*d, qy=y+Math.sin(a)*d; if(!blockedAt(qx,qy)&&!n4aHazAt(qx,qy)&&elevLvl(qx,qy)===elevLvl(x,y)){ sx=qx; sy=qy; break; } }
  const e=makeEnemy(t,sx,sy,Object.assign({level:lv,aggro:true,homeX:x,homeY:y,leash:900},opt||{}));
  e.n4a=true; if(t!==type) e.tint=e.tint||'#3a2a5a'; e.spawnIn=0.6;
  emit(sx,sy,14,{col:'120,80,190',smin:30,smax:120,lmin:.3,lmax:.7,zmin:1.5,zmax:3});
  return e;
}
function n4aAmbTick(dt){
  if(!N4A.fights) return; const p=player;
  for(const A of N4A.amb){
    const done=A.respawn?(G.found['n_amb_'+A.id]&&G.worldTime-G.found['n_amb_'+A.id]<A.respawn):n4aFound('n_amb_'+A.id);
    if(A.live){ const alive=A.live.filter(e=>!e.dead);
      // foes that vanished without being beaten (an area change, a cleanup) do not count: the ambush waits again
      if(alive.some(e=>!G.enemies.includes(e))){ G.enemies=G.enemies.filter(e=>!alive.includes(e)); A.live=null; continue; }
      if(!alive.length){ A.live=null; G.found['n_amb_'+A.id]=A.respawn?G.worldTime:1; n4aEmit('fight',{id:A.id}); if(A.then) try{ A.then(A); }catch(e){ console.error(e); } n4aSave(); continue; }
      if(dist2(p.x,p.y,A.x,A.y)>1700*1700||p.dead){ G.enemies=G.enemies.filter(e=>!alive.includes(e)); A.live=null; }
      continue; }
    if(done||p.dead||!A.when(A)) continue;
    if(dist2(p.x,p.y,A.x,A.y)>A.r*A.r||Math.abs(elevLvl(A.x,A.y)-n4aLvl())>1&&!p.flying) continue;
    const L=[]; for(let i=0;i<A.n;i++){ const ty=A.types[i%A.types.length], a=rand(0,TAU), d=rand(A.spread[0],A.spread[1]); const e=n4aSpawnAt(ty,A.x+Math.cos(a)*d,A.y+Math.sin(a)*d,A.level,A.opt); if(e) L.push(e); }
    if(L.length){ A.live=L; if(A.say) n4aBub('amb_'+A.id,A.say[0],A.say[1]); }
  }
}

// ---------- the echoes: x4_foes owns the fights (defineBoss n_echo1..4); a beaten echo opens the gate past its arena.
// While x4_foes is not merged (no SITES entry), a stand-in fight of shades holds the arena so the gate can be tested.
const N4A_ECHO={1:{x:4500,y:81500,r:380,lv:21,types:['n_shade','n_shade','n_shade_drake'],n:4},2:{x:6515,y:87215,r:360,lv:22,types:['n_glasswing','n_shade'],n:4},
  3:{x:3121,y:86579,r:400,lv:22,types:['n_shade_wolf','n_frostshade'],n:4},4:{x:3315,y:85096,r:290,lv:23,types:['n_mothling','n_glasswing'],n:5}};
function n4aEchoWon(k){ if(!G) return false; const T=N4A.echoTypes[k]; return !!((G.bossDone&&(G.bossDone[T]||G.bossDone['n_echo'+k]))||G.flags['n_echo'+k+'_done']); }
const n4aEchoReal=k=>typeof SITES!=='undefined'&&!!SITES['n_echo'+k];
function n4aEchoStand(k,ready){
  const E=N4A_ECHO[k], A=n4aAmbush('echo'+k,{x:E.x,y:E.y,r:E.r-40,n:E.n,types:E.types,level:E.lv,spread:[60,E.r-90],
    when:()=>!n4aEchoReal(k)&&!n4aEchoWon(k)&&ready(),then:()=>{ G.flags['n_echo'+k+'_done']=1; n4aBanner(S('The shadows break into moths','The shadows break'),S('The way on is open.','The way is open.'),2.6); n4aEmit('echo',{k}); }});
  A.echo=k; return A;
}

// ================= the Bridgefoot (stage n_bridge): three lanterns that gutter out unless all three burn (bible 5.0)
const N4A_LAN=[{id:'n_lan_green',x:4200,y:89640,how:S('Just breathe on it.','Breathe on it.')},{id:'n_lan_pond',x:5250,y:89720,how:S('It stands on an islet. Walk on the water.','Walk on the water to it.')},{id:'n_lan_high',x:3760,y:89560,how:S('It stands on a high step. A Double Jump gets you up.','Double Jump up to it.')}];
function n4aLanGutter(){ return n4aByDiff(70,40,25); }
function n4aLanCount(){ return N4A.lans.filter(L=>L.lit>0).length; }
function n4aBuildLanterns(){
  N4A.lans=[];
  for(const d of N4A_LAN){
    const L=n4aAdd('lantern',{id:d.id,x:d.x,y:d.y,r:16,hz:60,fr:20,lit:0,how:d.how});
    L.light=n4aLight(d.x,d.y-64,260);
    L.reset=q=>{ q.lit=n4aF('n_gate')?1e9:0; };
    L.fire=(q,dt,blue)=>{ if(n4aF('n_gate')) return; if(Math.abs(elevLvl(q.x,q.y)-n4aLvl())>0) return; if(blue||dist(player.x,player.y,q.x,q.y)>200){ n4aSay(q.x,q.y-90,S('Too hot! A gentle breath, Ash. Gentle.','Too hot! Breathe gently.'),'#ffe0c0','lanhot',2); return; } if(q.lit<=0){ n4aSnd('lamp'); emit(q.x,q.y-64,16,{col:'255,210,120',ang:-Math.PI/2,spread:1,smin:20,smax:90,lmin:.4,lmax:.8,zmin:1.5,zmax:3}); }
      q.lit=n4aLanGutter(); const n=n4aLanCount(); G.flags.n_lanterns=n; if(n>=3) n4aGateOpen(); else n4aEmit('lantern',{id:q.id,n}); };
    L.tick=(q,dt)=>{ if(q.lit>0&&q.lit<1e8){ q.lit-=dt; if(q.lit<=0){ q.lit=0; n4aSnd('gutter'); emit(q.x,q.y-64,10,{col:'120,100,160',glow:false,ang:-Math.PI/2,spread:0.6,smin:10,smax:40,lmin:.6,lmax:1.2,zmin:2,zmax:4,grow:4}); G.flags.n_lanterns=n4aLanCount(); n4aSay(q.x,q.y-80,S('The cold wind blows it out!','It went out!'),'#c8b8ff'); } }
      q.light.i=q.lit>0?0.9:0; };
    L.stand=(q,t)=>{ const on=q.lit>0; n4aPut(n4aSpr('lan'+(on?1:0),34,92,17,86,g=>n4aLanternArt(g,on,false)),q.x,q.y);
      if(on){ const f=0.85+0.15*Math.sin(t*9+q.x); n4aGlow(q.x,q.y-60,60,'255,200,110',0.6*f); n4aGlow(q.x,q.y-60,16,'255,246,210',0.7*f); } else n4aGlow(q.x,q.y-60,20,'150,110,255',0.18+0.08*Math.sin(t*2+q.x)); };
    L.ground=(q,t)=>{ if(n4aF('n_gate')){ n4aRing(q.x,q.y+2,46,'255,210,130',0.35,2.4); return; } if(q.lit>0){ const k=q.lit/n4aLanGutter(); n4aRing(q.x,q.y+2,48,'90,70,140',0.35,4); n4aArcRing(q.x,q.y+2,48,k<0.3?'255,140,90':'255,214,130',0.85,k,4); } else n4aRing(q.x,q.y+2,40,'170,140,255',0.25+0.1*Math.sin(t*2),2); };
    L.sy=q=>q.y+2;
    addCol({t:'c',x:d.x,y:d.y,r:7,low:true});
    n4aPrompt(L,d.x,d.y,26,q=>q.lit>0?null:S('Look at the lantern','Look at the lantern'),q=>n4aSay(q.x,q.y-90,q.how,'#ffe8c0','lanhow'+q.id,2));
    N4A.lans.push(L);
  }
  // the shadow curtain across the foot of the stairs: it melts when all three lanterns burn together
  const g=n4aGate('n_gate',{A:[4372,89386],B:[4628,89386],x:4500,y:89386,th:12,test:(x,y)=>x>4364&&x<4636&&Math.abs(y-89386)<14,shut:()=>!n4aF('n_gate'),r:120});
  g.stand=(q,t)=>{ q.open=lerp(q.open,n4aF('n_gate')?1:0,0.05); if(q.open>0.98) return; n4aVeil(q.A,q.B,t,1-q.open,{h:110,col:'60,30,110',seed:3,sockets:3,lit:n4aF('n_gate')?3:n4aLanCount()}); };
  g.sy=q=>q.y+4;
  n4aPrompt(g,4500,89410,40,()=>n4aF('n_gate')?null:S('Look at the shadow curtain','Look at the dark curtain'),()=>n4aSay(4500,89300,S('Three dark lanterns, three dark marks. They want light, all at once.','Light all three lanterns at once.'),'#e0d0ff','gatehow',2));
}
function n4aGateOpen(){
  if(n4aF('n_gate')) return; G.flags.n_gate=1; G.flags.n_lanterns=3; for(const L of N4A.lans) L.lit=1e9;
  n4aSnd('bigchime'); shake(4); flashA=Math.max(flashA,0.4); flashCol='255,210,140';
  n4aBub('n_bub_gate','ash',S("And not a single bakery was harmed. Mostly because there isn't one.",'Not one bakery got burned!'));
  n4aEmit('gate',{});
  later(1.6,()=>n4aScene('n_gate_open',[['narr',S('The third lantern catches. For one moment the whole green glows warm, like home on Lantern Day.','The lanterns glow. It feels like home for a moment.')],
    ['narr',S("Then the shadow gate melts away, and a whisper comes down the mountain, soft as a moth's wing.",'The dark gate melts. A whisper comes down the mountain.')],
    ['nyxara',S('Shhh. Such pretty lanterns. Light as many as you like, little ember. Up here, they all go out.','Pretty lanterns. Up here, they all go out.')],
    ['ash',S('Not if I keep lighting them.','Not if I keep lighting them.')]]));
  n4aSave();
}
// a curtain of shadow moths between two points (gates, veils): live, cheap (a band and a few fluttering wings)
function n4aVeil(A,B,t,k,o){
  o=o||{}; if(k<=0.01) return; const h=(o.h||90)*k, col=o.col||'70,40,120', L=dist(A[0],A[1],B[0],B[1]), n=Math.max(4,Math.round(L/11));
  ctx.save(); ctx.globalAlpha*=Math.min(1,k*1.2); ctx.lineCap='round';
  // a soft shadow of the curtain on the ground, then the hanging strands of moth silk, then the rod they hang from
  ctx.fillStyle='rgba(8,4,16,.35)'; ctx.beginPath(); ctx.moveTo(A[0],A[1]+4); ctx.lineTo(B[0],B[1]+4); ctx.lineTo(B[0],B[1]-6); ctx.lineTo(A[0],A[1]-6); ctx.closePath(); ctx.fill();
  for(let i=0;i<=n;i++){ const s=i/n, x=lerp(A[0],B[0],s), y=lerp(A[1],B[1],s), sw=Math.sin(t*1.6+i*0.9+(o.seed||0))*4, top=y-h+Math.sin(i*1.7)*3;
    ctx.strokeStyle=`rgba(${col},${0.62+0.2*((i*7)%3)/2})`; ctx.lineWidth=i%3?5:7; ctx.beginPath(); ctx.moveTo(x,top); ctx.quadraticCurveTo(x+sw*0.5,y-h*0.5,x+sw,y-2); ctx.stroke();
    if(i%3===0){ ctx.strokeStyle='rgba(220,200,255,.32)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x-1.5,top+4); ctx.quadraticCurveTo(x-1.5+sw*0.5,y-h*0.5,x-1.5+sw,y-6); ctx.stroke(); } }
  ctx.strokeStyle=N4AOC; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(A[0],A[1]-h); ctx.lineTo(B[0],B[1]-h); ctx.stroke();
  ctx.strokeStyle='rgba(210,190,255,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(A[0],A[1]-h-1); ctx.lineTo(B[0],B[1]-h-1); ctx.stroke();
  // moths resting on the curtain: little pale wings that open and shut
  for(let i=1;i<n;i+=4){ const s=i/n, x=lerp(A[0],B[0],s), y=lerp(A[1],B[1],s)-h*(0.3+0.45*((i*37)%7)/7), w=0.6+0.4*Math.abs(Math.sin(t*3+i));
    ctx.fillStyle='rgba(230,220,250,.9)'; for(const sd of [-1,1]){ ctx.beginPath(); ctx.ellipse(x+sd*4*w,y,4.5*w,3,sd*0.4,0,TAU); ctx.fill(); } ctx.fillStyle='#1a1028'; ctx.fillRect(x-0.8,y-3,1.6,6); }
  if(o.sockets){ for(let i=0;i<o.sockets;i++){ const s=(i+1)/(o.sockets+1), x=lerp(A[0],B[0],s), y=lerp(A[1],B[1],s)-h*0.55, on=i<(o.lit||0);
      ctx.fillStyle=on?'#ffd27a':'#2a1c44'; ctx.beginPath(); ctx.arc(x,y,8,0,TAU); ctx.fill(); ctx.strokeStyle=on?'#fff2c0':'rgba(190,160,255,.8)'; ctx.lineWidth=2.4; ctx.stroke(); if(on) n4aGlow(x,y,30,'255,200,110',0.6); else n4aGlow(x,y,14,'170,130,255',0.25); } }
  ctx.restore();
  if(Math.random()<0.15*k){ const s=Math.random(); emit(lerp(A[0],B[0],s),lerp(A[1],B[1],s)-rand(10,h),1,{col:'200,180,240',ang:-Math.PI/2,spread:1.2,smin:10,smax:40,lmin:.5,lmax:1,zmin:1,zmax:2}); }
}
// a gate drawn as a veil (the echo gates): shut until its echo is beaten
function n4aEchoGate(k,a,r0,r1){
  const g=n4aGate('n_egate'+k,{a,r0,r1,th:18,shut:()=>!n4aEchoWon(k),r:80});
  g.stand=(q,t)=>{ q.open=lerp(q.open,n4aEchoWon(k)?1:0,0.04); if(q.open>0.98) return; n4aVeil(q.A,q.B,t,1-q.open,{h:120,col:'50,24,96',seed:k}); };
  g.sy=q=>Math.max(q.A[1],q.B[1]);
  g.tick=q=>{ if(!n4aEchoWon(k)&&n4aSegD(player.x,player.y,q.A,q.B)<90) n4aSay(player.x,player.y-50,S('The shadows will not part while the echo stands.','Beat the shadow first.'),'#d8c8ff','eg'+k,8); };
  return g;
}

// ================= Tier I, the Ember Stair (stage n_stair, Act I powers)
// 1B the Sluice: the current pushes walkers on the river downstream; a Skimmer sprint skims over it
const N4A_RIV={pts:null,a0:9,a1:52.5};
function n4aRiverPts(){ return N4A_RIV.pts||(N4A_RIV.pts=(typeof N4G!=='undefined'&&N4G.river)?N4G.river:[52,46,40,34,28,22,16,10].map(a=>n4aP(3700,a)).concat([n4aP(3900,8.6),n4aP(4190,8)])); }
function n4aCurrentTick(dt){
  const p=player; if(p.dead||p.hop||!n4aOn4()) return;
  const a=n4aAng(p.x,p.y), r=n4aR(p.x,p.y); if(r<3300||r>4300||!n4aIn(a,N4A_RIV.a0,N4A_RIV.a1)) return;
  const P=n4aRiverPts(), q=p2PolyD(P,p.x,p.y); if(q.d>128) return;
  const air=n4aAir(); if(!air&&!p.onWater) return;
  // the skim: sprinting on the water with the Skimmer (a jump keeps the skim it took off with)
  if(!air) N4A.skim=!!(p.sprinting&&typeof canSkim==='function'&&canSkim());
  const at=p2PolyAt(P,q.s), sp=(p.stats&&p.stats.speed||200)*(N4A.skim?0.45:1.9), ux=Math.cos(at[2]), uy=Math.sin(at[2]);
  const nx=p.x+ux*sp*dt, ny=p.y+uy*sp*dt; if(!playerBlocked(nx,ny)||air){ p.x=nx; p.y=ny; } else { const bx=p.x+ux*sp*dt, by=p.y; if(!playerBlocked(bx,by)) p.x=bx; else if(!playerBlocked(p.x,p.y+uy*sp*dt)) p.y+=uy*sp*dt; }
  if(!N4A.skim&&!air) n4aBub('n_bub_sluice','ash',S("Walking won't beat that. But a skim might.",'Walking is too slow. Try skimming!'));
  // swept to the falls: slide out on the near bank with a splash (no harm)
  if(!air&&q.s>q.L-260){ n4aSnd('splash'); emit(p.x,p.y,18,{col:'200,214,255',ang:-Math.PI/2,spread:1.2,smin:60,smax:200,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); p.x=4925; p.y=88960; p.kvx=p.kvy=0; p.avx=p.avy=0; p.safeX=p.x; p.safeY=p.y; MV.lx=p.x; MV.ly=p.y; n4aSay(p.x,p.y-40,S('Whoosh! Back to the start.','Whoosh! Back to the start.'),'#d8e8ff','swept',2); N4A.sweptN=(N4A.sweptN|0)+1; n4aEmit('swept',{}); }
}
function n4aDrawCurrent(t){
  const P=n4aRiverPts(); if(!n4aView(n4aP(3700,30)[0],n4aP(3700,30)[1],1800)) return;
  ctx.save(); ctx.lineCap='round'; const L=p2PolyLen(P);
  for(let i=0;i<46;i++){ const s=((i*97.3+t*260)%L+L)%L, at=p2PolyAt(P,s), off=((i*53)%9-4)*22, nx=-Math.sin(at[2]), ny=Math.cos(at[2]), x=at[0]+nx*off, y=at[1]+ny*off; if(!n4aView(x,y,40)) continue;
    const ux=Math.cos(at[2]), uy=Math.sin(at[2]), a=0.55*Math.sin(Math.PI*((s%140)/140));
    ctx.strokeStyle=`rgba(240,246,255,${0.35+a*0.5})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(x-ux*16,y-uy*16); ctx.lineTo(x+ux*12,y+uy*12); ctx.stroke();
    ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x+ux*12,y+uy*12); ctx.lineTo(x+ux*4-nx*5,y+uy*4-ny*5); ctx.moveTo(x+ux*12,y+uy*12); ctx.lineTo(x+ux*4+nx*5,y+uy*4+ny*5); ctx.stroke(); }
  ctx.restore();
}
// 1B the drawbridge's crystal switch: the Wing-rang (or the Glaive, or the whip if it reaches) drops the bridge
function n4aBuildSluice(){
  const R=n4aAdd('current',{id:'n_sluice_current',x:n4aP(3700,30)[0],y:n4aP(3700,30)[1],r:0,near:2400});
  R.tick=(q,dt)=>n4aCurrentTick(dt); R.ground=(q,t)=>n4aDrawCurrent(t);
  const C=(typeof N4G!=='undefined'&&N4G.crystal)||n4aP(4000,56);
  const X=n4aAdd('crystal',{id:'n_crystal1',x:C[0],y:C[1],r:20,hr:46,hz:30,awake:0});
  X.light=n4aLight(C[0],C[1]-30,240);
  X.hit=(q,src)=>{ if(n4aF('n_bridge1')) return src!=='fire'; if(src==='boomerang'||src==='glaive'||src==='whip'){ n4aCrystalWake(q); return true; }
    if(src==='arrow'){ n4aSay(q.x,q.y-50,S('It needs something that spins back to you.','Throw the boomerang!'),'#d8c8ff','x1'); return true; } return false; };
  X.stand=(q,t)=>{ const on=n4aF('n_bridge1'); n4aPut(n4aSpr('cry'+(on?1:0),44,70,22,62,g=>n4aCrystalArt(g,on)),q.x,q.y); n4aGlow(q.x,q.y-34,on?60:34,on?'230,220,255':'170,120,255',on?0.6:0.35+0.15*Math.sin(t*3)); };
  X.sy=q=>q.y+4; X.tick=q=>{ q.light.i=n4aF('n_bridge1')?0.8:0.35; };
  // the far landing: four shades come out of the dark once the bridge is down
  n4aAmbush('sluice_far',{x:n4aP(3760,62)[0],y:n4aP(3760,62)[1],r:300,n:4,types:['n_shade'],level:21,when:()=>n4aF('n_bridge1')});
}
function n4aCrystalArt(g,on){
  n4aShade(g,16,5,2);
  g.fillStyle=N4APAL.glass[0]; g.fillRect(-9,-14,18,15); g.fillStyle=N4APAL.glass[1]; g.fillRect(-9,-14,12,15);
  const C=on?['#8a86d8','#d8d6ff','#ffffff']:['#3a2a6a','#7a5ac8','#c8b0ff'];
  g.fillStyle=C[0]; g.beginPath(); g.moveTo(0,-56); g.lineTo(11,-34); g.lineTo(6,-14); g.lineTo(-6,-14); g.lineTo(-11,-34); g.closePath(); g.fill();
  g.fillStyle=C[1]; g.beginPath(); g.moveTo(0,-56); g.lineTo(-11,-34); g.lineTo(-6,-14); g.lineTo(-1,-14); g.lineTo(-2,-34); g.closePath(); g.fill();
  g.fillStyle=C[2]; g.beginPath(); g.moveTo(0,-56); g.lineTo(-6,-38); g.lineTo(-2,-34); g.closePath(); g.fill();
  n4aGlint(g,4,-44,3,'#ffffff');
}
function n4aCrystalWake(q){
  G.flags.n_bridge1=1; G.flags.n_sluice=1; n4aSnd('crystal'); n4aSnd('creak'); shake(5);
  for(let i=0;i<24;i++){ const a=rand(0,TAU); emit(q.x,q.y-34,1,{col:'220,210,255',ang:a,spread:0.2,smin:40,smax:200,lmin:.3,lmax:.8,zmin:1.4,zmax:3}); }
  n4aBanner(S('The drawbridge drops!','The bridge comes down!'),'',2.2); n4aEmit('drawbridge',{}); n4aSave();
}
// 1C the cracked wall (hammer, Blast Bomb or Ground Pound), the ink falls, the Updraft Terraces
function n4aCrackWall(id,A,B,o){
  o=Object.assign({},o||{}); const key='n_crack_'+id;
  const W=n4aGate('crack_'+id,{A,B,x:(A[0]+B[0])/2,y:(A[1]+B[1])/2,th:o.th||20,shut:()=>!n4aFound(key),r:Math.max(40,dist(A[0],A[1],B[0],B[1])/2)});
  W.key=key; W.hitTest=(q,x,y,r)=>n4aSegD(x,y,A,B)<(r||8)+30; W.poundTest=(q,info)=>n4aSegD(info.x,info.y,A,B)<info.R+20;
  const brk=(q)=>{ if(n4aFound(key)) return; G.found[key]=1; n4aSnd('crack'); shake(8); hitstop=Math.max(hitstop,0.05);
    for(let i=0;i<40;i++){ const s=Math.random(); emit(lerp(A[0],B[0],s),lerp(A[1],B[1],s)-rand(0,40),1,{col:i%3?'60,44,80':'255,150,80',glow:i%3===0,ang:-Math.PI/2,spread:1.4,smin:40,smax:220,lmin:.4,lmax:1,zmin:2,zmax:5}); }
    n4aBanner(S('The cracked wall breaks!','The wall breaks!'),'',2); n4aEmit('crack',{id}); if(o.then) o.then(); n4aSave(); };
  W.hit=(q,src)=>{ if(n4aFound(key)) return false; if(src==='hammer'||src==='bomb'){ brk(q); return true; } if(src==='slash'||src==='daggers'||src==='spear'){ n4aSay(player.x,player.y-46,S('Too thick for a sword. Something heavier!','Too thick! Try the hammer.'),'#ffd8b0','crk'+id,3); return true; } return false; };
  W.pound=q=>brk(q);
  W.stand=(q,t)=>{ if(n4aFound(key)){ return; } const n=Math.max(2,Math.round(dist(A[0],A[1],B[0],B[1])/34));
    for(let i=0;i<n;i++){ const s=(i+0.5)/n, x=lerp(A[0],B[0],s), y=lerp(A[1],B[1],s); n4aPut(n4aSpr('crk'+(o.ice?'i':'')+(i%3),40,70,20,62,g=>n4aCrackBlockArt(g,i%3,o.ice)),x,y); }
    for(let i=0;i<3;i++){ const s=(i+0.5)/3; n4aGlow(lerp(A[0],B[0],s),lerp(A[1],B[1],s)-30,46,o.ice?'170,220,255':'255,140,70',0.2+0.08*Math.sin(t*2+i)); }
    if(Math.random()<0.04){ const s=Math.random(); emit(lerp(A[0],B[0],s),lerp(A[1],B[1],s)-rand(10,50),1,{col:'255,150,80',ang:-Math.PI/2,spread:0.5,smin:5,smax:20,lmin:.5,lmax:1,zmin:1,zmax:2}); } };
  W.ground=(q,t)=>{ if(!n4aFound(key)) return; ctx.fillStyle='rgba(30,20,44,.55)'; const n=8; for(let i=0;i<n;i++){ const s=(i+0.5)/n, x=lerp(A[0],B[0],s)+((i*31)%11-5), y=lerp(A[1],B[1],s)+((i*17)%9-4); ctx.beginPath(); ctx.ellipse(x,y,9+(i%3)*3,5,0,0,TAU); ctx.fill(); } };
  W.sy=q=>Math.max(A[1],B[1]);
  n4aPrompt(W,W.x,W.y,Math.min(80,W.r),q=>n4aFound(key)?null:S('Look at the cracked wall','Look at the cracked wall'),q=>n4aSay(q.x,q.y-60,S('Cracked right through. A hammer, a bomb or a Ground Pound would do it.','Break it with a hammer, a bomb or a pound!'),'#ffd8b0','crkhow'+id,2));
  return W;
}
function n4aCrackBlockArt(g,v,ice){
  n4aShade(g,18,6,2);
  const P=ice?N4APAL.ice:N4APAL.glass, h=50+v*6;
  g.fillStyle=P[0]; g.fillRect(-16,-h,32,h); g.fillStyle=P[1]; g.fillRect(-16,-h,22,h); g.fillStyle=P[2]; g.fillRect(-16,-h,5,h);
  g.fillStyle=P[2]; g.fillRect(-16,-h-4,32,6);
  g.strokeStyle=ice?'rgba(200,240,255,.9)':'rgba(255,160,90,.95)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-6+v*3,-h); g.lineTo(-1,-h*0.66); g.lineTo(-7,-h*0.42); g.lineTo(2,-h*0.18); g.lineTo(-3,0); g.moveTo(-1,-h*0.66); g.lineTo(8,-h*0.55); g.stroke();
}
// the ink falls: on 3 s, off 3 s (Easy on 2 off 4, Hard on 3.5 off 2.5), staggered; in the air you are safe
const N4A_FALLS=[74,80,86];
function n4aFallPhase(i,tt){ const [on,off]=n4aByDiff([2,4],[3,3],[3.5,2.5]), per=on+off, ph=((tt+i*per/3)%per+per)%per; return {on:ph<on,ph,on0:on,per,warn:ph>=per-0.7}; }
function n4aBuildFalls(){
  N4A_FALLS.forEach((a,i)=>{
    const hw=n4aDw(40,3700), F=n4aAdd('inkfall',{id:'n_inkfall'+i,x:n4aP(3700,a)[0],y:n4aP(3700,a)[1],r:0,a,i,near:1600});
    n4aHazard({id:'n4a_inkfall'+i,kind:'ink',bb:n4aSecBB(3350,4050,a-hw,a+hw,10),test:(x,y)=>{ const r=n4aR(x,y); return r>3355&&r<4045&&Math.abs(((n4aAng(x,y)-a+540)%360)-180)<hw; },on:()=>n4aFallPhase(i,N4A.t).on});
    F.ground=(q,t)=>n4aDrawFall(q,t);
  });
}
function n4aDrawFall(q,t){
  const S0=n4aFallPhase(q.i,N4A.t), a=q.a, hw=n4aDw(40,3700);
  const A=n4aP(3330,a), B=n4aP(4070,a); if(!n4aView((A[0]+B[0])/2,(A[1]+B[1])/2,500)) return;
  const nx=Math.cos(a*N4AD), ny=-Math.sin(a*N4AD); // across the path (along the ring)
  ctx.save(); ctx.lineCap='round';
  if(S0.on){
    // a sheet of ink pouring across the path, streaks running outward to the sea
    ctx.fillStyle='rgba(18,10,34,.92)'; ctx.beginPath(); ctx.moveTo(A[0]-nx*40,A[1]-ny*40); ctx.lineTo(B[0]-nx*40,B[1]-ny*40); ctx.lineTo(B[0]+nx*40,B[1]+ny*40); ctx.lineTo(A[0]+nx*40,A[1]+ny*40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(150,100,255,.55)'; ctx.lineWidth=2; for(let k=-3;k<=3;k++){ const o=k*11, s=(t*2.2+k*0.37)%1; ctx.beginPath(); ctx.moveTo(lerp(A[0],B[0],s)+nx*o,lerp(A[1],B[1],s)+ny*o); ctx.lineTo(lerp(A[0],B[0],Math.min(1,s+0.18))+nx*o,lerp(A[1],B[1],Math.min(1,s+0.18))+ny*o); ctx.stroke(); }
    ctx.strokeStyle='rgba(200,170,255,.6)'; ctx.lineWidth=2.4; for(const sd of [-1,1]){ ctx.beginPath(); ctx.moveTo(A[0]+nx*40*sd,A[1]+ny*40*sd); ctx.lineTo(B[0]+nx*40*sd,B[1]+ny*40*sd); ctx.stroke(); }
    if(Math.random()<0.6){ const s=Math.random(); emit(lerp(A[0],B[0],s)+nx*rand(-40,40),lerp(A[1],B[1],s)+ny*rand(-40,40),1,{col:'60,30,110',glow:false,ang:-Math.PI/2,spread:1.2,smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); }
    // the fall itself pours from the cliff of the second ring
    n4aGlow(A[0],A[1],50,'120,80,220',0.3);
  }else{
    const k=S0.warn?0.5+0.5*Math.sin(t*20):0;
    ctx.fillStyle=`rgba(30,18,52,${0.25+0.3*k})`; ctx.beginPath(); ctx.moveTo(A[0]-nx*40,A[1]-ny*40); ctx.lineTo(B[0]-nx*40,B[1]-ny*40); ctx.lineTo(B[0]+nx*40,B[1]+ny*40); ctx.lineTo(A[0]+nx*40,A[1]+ny*40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=`rgba(190,160,255,${0.25+0.5*k})`; ctx.setLineDash([8,10]); ctx.lineWidth=2; for(const sd of [-1,1]){ ctx.beginPath(); ctx.moveTo(A[0]+nx*40*sd,A[1]+ny*40*sd); ctx.lineTo(B[0]+nx*40*sd,B[1]+ny*40*sd); ctx.stroke(); } ctx.setLineDash([]);
    if(S0.warn&&Math.random()<0.5) emit(A[0]+nx*rand(-36,36),A[1]+ny*rand(-36,36),1,{col:'60,30,110',glow:false,ang:Math.PI/2,spread:0.3,smin:20,smax:60,lmin:.3,lmax:.5,zmin:1.5,zmax:3});
  }
  ctx.restore();
}
function n4aBuildTerraces(){
  // the shelf on the second level: landing there is the end of the Updraft Terraces
  const T=n4aAdd('terrace',{id:'n_terrace_shelf',x:n4aP(3700,104)[0],y:n4aP(3700,104)[1],r:0,near:900});
  T.tick=()=>{ if(n4aF('n_terrace')||n4aAir()) return; if(n4aLvl()===2&&n4aSec(player.x,player.y,3250,4150,99,113)){ G.flags.n_terrace=1; n4aSnd('chime',0.6); n4aEmit('terrace',{}); n4aSave(); } };
  n4aAmbush('terrace_drakes',{x:8250,y:85000,r:520,n:3,types:['n_shade_drake'],level:21,spread:[120,260],when:()=>!!player.flying});
}
// 1D the Three Trials: the Leap Court's shadow roots, the Tide Court's eye, the Sky Court's island
function n4aBuildTrials(){
  const L=(typeof N4G!=='undefined'&&N4G.leap)||{wall:3642};
  // shadow roots across the far end of the Leap Court: plain fire burns them
  const ra=126.45, rw=n4aDw(14,3950), A=n4aP(L.wall,ra), B=n4aP(4255,ra);
  const R=n4aGate('n_roots_leap',{A,B,x:(A[0]+B[0])/2,y:(A[1]+B[1])/2,th:14,test:(x,y)=>{ const r=n4aR(x,y); return r>L.wall-4&&r<4262&&Math.abs(((n4aAng(x,y)-ra+540)%360)-180)<rw; },shut:()=>!n4aFound('n_roots_leap'),r:60,fr:30});
  R.fireTest=(q,mx,my,ang)=>{ for(let s=0;s<=1;s+=0.125){ const x=lerp(A[0],B[0],s), y=lerp(A[1],B[1],s); if(inArcC(mx,my,ang,175,0.45,{x,y,r:14})) return true; } return false; };
  R.burn=0;
  R.fire=(q,dt)=>{ if(n4aFound('n_roots_leap')) return; q.burn+=dt; if(Math.random()<0.5) emit(lerp(A[0],B[0],Math.random()),lerp(A[1],B[1],Math.random())-20,1,{kind:'fire',smin:20,smax:70,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:4});
    if(q.burn>0.6){ G.found.n_roots_leap=1; n4aSnd('crack',0.6); for(let i=0;i<24;i++) emit(lerp(A[0],B[0],Math.random()),lerp(A[1],B[1],Math.random())-20,1,{kind:'fire',ang:-Math.PI/2,spread:1,smin:30,smax:120,lmin:.4,lmax:.8,zmin:2,zmax:5,grow:6}); n4aSay(q.x,q.y-60,S('The roots shrivel away!','The roots burn away!'),'#ffd8b0'); n4aSave(); } };
  R.reset=q=>{ q.burn=0; };
  R.stand=(q,t)=>{ if(n4aFound('n_roots_leap')) return; n4aRoots(A,B,t); };
  R.sy=q=>Math.max(A[1],B[1]);
  n4aPrompt(R,R.x,R.y,50,()=>n4aFound('n_roots_leap')?null:S('Look at the shadow roots','Look at the roots'),q=>n4aSay(q.x,q.y-60,S('Old Gnarl\'s roots, in shadow. They curl away from fire.','Burn them with fire!'),'#ffd8b0','roothow',2));
  const LF=n4aP(3870,127.05);
  n4aFlame('leap',LF[0],LF[1]);
  // the Tide Court: the eye opens at high tide, but only looks at someone standing on the water
  const TD=(typeof N4G!=='undefined'&&N4G.tide)||{x:6993,y:82332,r:215};
  const E=n4aAdd('eye',{id:'n_eye_tide',x:TD.x,y:TD.y-12,r:16,hr:22,hz:44,open:0});
  E.isOpen=()=>{ const hi=typeof n4wTideHigh==='function'?n4wTideHigh():false; if(!hi||n4aFound('n_eye_tide')) return false; const p=player; return !n4aAir()&&p.onWater&&dist(p.x,p.y,TD.x,TD.y)<TD.r-8; };
  E.hit=(q,src)=>{ if(n4aFound('n_eye_tide')) return src!=='fire';
    if(src!=='arrow'){ if(src!=='fire') n4aSay(q.x,q.y-60,S('Only an arrow wakes an eye.','Use an arrow!'),'#ffe0b0','eyehow'); return src!=='fire'; }
    if(!q.isOpen()){ n4aSay(q.x,q.y-60,typeof n4wTideHigh==='function'&&n4wTideHigh()?S('It only looks at someone standing on the high water.','Stand on the water!'):S('Shut tight. Wait for the tide.','Wait for high tide!'),'#ffe0b0','eyeshut',1.5); SFX.play('block',0.5); return true; }
    G.found.n_eye_tide=1; n4aSnd('eye'); shake(3); for(let i=0;i<20;i++) emit(q.x,q.y-44,1,{col:'255,226,140',ang:rand(0,TAU),spread:0.2,smin:40,smax:150,lmin:.3,lmax:.7,zmin:1.5,zmax:3});
    n4aBanner(S('The eye wakes!','The eye wakes!'),S('A flame rises from the water.','A flame rises!'),2.2); n4aEmit('eye',{}); n4aSave(); return true; };
  E.tick=(q,dt)=>{ q.open=lerp(q.open,n4aFound('n_eye_tide')?1:q.isOpen()?1:typeof n4wTideHigh==='function'&&n4wTideHigh()?0.35:0,Math.min(1,dt*6)); };
  E.stand=(q,t)=>{ n4aPut(n4aSpr('eyep',40,60,20,56,n4aEyePillarArt),q.x,q.y); n4aDrawEye(q.x,q.y-44,q.open,n4aFound('n_eye_tide'),t); };
  E.sy=q=>q.y+2;
  addCol({t:'c',x:TD.x,y:TD.y-12,r:12});
  n4aFlame('tide',TD.x+2,TD.y+14,{ready:()=>n4aFound('n_eye_tide')});
  // the Sky Court: the flame and Moth Memory 2 on the island in the void (fly in the calm air)
  const SK=(typeof N4G!=='undefined'&&N4G.sky)||{x:5765,y:81600};
  n4aFlame('sky',SK.x-32,SK.y+18);
  n4aPane(2,SK.x+40,SK.y-24);
  n4aAmbush('sky_wyvern',{x:SK.x+200,y:SK.y+120,r:560,n:1,types:['n_shade_drake'],level:22,opt:{elite:true},spread:[80,140],when:()=>!!player.flying});
  // the Echo Gate (θ 172): opens for the three memory flames
  const eg=n4aGate('n_echogate1',{a:172,r0:3785,r1:4015,th:18,shut:()=>(G.flags.n_flames|0)<3,r:110});
  eg.stand=(q,t)=>{ q.open=lerp(q.open,(G.flags.n_flames|0)>=3?1:0,0.04); if(q.open>0.98) return; n4aVeil(q.A,q.B,t,1-q.open,{h:130,col:'60,26,90',seed:7,sockets:3,lit:G.flags.n_flames|0}); };
  eg.sy=q=>Math.max(q.A[1],q.B[1]);
  n4aPrompt(eg,eg.x,eg.y,70,()=>(G.flags.n_flames|0)>=3?null:S('Look at the Echo Gate','Look at the gate'),q=>n4aSay(q.x,q.y-80,S('Three empty flame marks. Ember\'s three Trials wait in the courts behind you.','Get the three flames from the courts.'),'#ffe0b0','eghow',2));
}
function n4aRoots(A,B,t){
  ctx.save(); ctx.lineCap='round'; const n=9;
  for(let i=0;i<n;i++){ const s=(i+0.5)/n, x=lerp(A[0],B[0],s), y=lerp(A[1],B[1],s), h=36+((i*29)%5)*8, sw=Math.sin(t*1.4+i)*4;
    ctx.strokeStyle=N4AOC; ctx.lineWidth=9; ctx.beginPath(); ctx.moveTo(x,y+4); ctx.quadraticCurveTo(x+sw-10,y-h*0.5,x+sw,y-h); ctx.stroke();
    ctx.strokeStyle='#2a1c3c'; ctx.lineWidth=6; ctx.stroke(); ctx.strokeStyle='rgba(170,120,255,.6)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x-2,y); ctx.quadraticCurveTo(x+sw-12,y-h*0.5,x+sw-2,y-h+2); ctx.stroke();
    ctx.fillStyle='rgba(190,140,255,.8)'; ctx.beginPath(); ctx.arc(x+sw,y-h,2.4,0,TAU); ctx.fill(); }
  ctx.restore();
}
function n4aEyePillarArt(g){
  n4aShade(g,14,5,2); n4aBox(g,-11,-38,22,39,N4APAL.stone); g.fillStyle=N4APAL.stone[0]; g.fillRect(-14,-42,28,6); g.fillStyle=N4APAL.stone[2]; g.fillRect(-14,-42,28,2);
  g.fillStyle='#2a2344'; g.beginPath(); g.ellipse(0,-22,9,6,0,0,TAU); g.fill();
}
function n4aDrawEye(x,y,k,woke,t){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='#1a1028'; ctx.beginPath(); ctx.ellipse(0,0,16,10,0,0,TAU); ctx.fill();
  const o=clamp(k,0,1)*9;
  if(o>0.5){ ctx.fillStyle=woke?'#ffe7a0':'#e8e0ff'; ctx.beginPath(); ctx.ellipse(0,0,14,o,0,0,TAU); ctx.fill();
    ctx.fillStyle=woke?'#c87a1a':'#5a3aa8'; ctx.beginPath(); ctx.arc(Math.sin(t*0.9)*3,0,Math.min(6,o*0.7),0,TAU); ctx.fill(); ctx.fillStyle='#120a1e'; ctx.beginPath(); ctx.arc(Math.sin(t*0.9)*3,0,Math.min(3,o*0.35),0,TAU); ctx.fill(); }
  ctx.strokeStyle=woke?'#ffd27a':'rgba(190,160,255,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,16,10,0,0,TAU); ctx.stroke();
  ctx.restore();
  if(woke) n4aGlow(x,y,36,'255,210,120',0.5); else if(k>0.6) n4aGlow(x,y,30,'200,180,255',0.4);
}
// U1 the Wind Chimney (x4_world's calm air and vent): landing on the second ring; the Silent Green (optional arc)
function n4aBuildSilent(){
  const C=n4aAdd('chimney',{id:'n_chimney_top',x:n4aP(3150,204)[0],y:n4aP(3150,204)[1],r:0,near:900});
  C.tick=()=>{ if(n4aF('n_chimney')||n4aAir()) return; if(n4aLvl()===3&&n4aNear(C.x,C.y,320)){ G.flags.n_chimney=1; n4aSnd('chime',0.6); n4aEmit('chimney',{}); n4aSave(); } };
  // the Shadow Raid out of the copy of the north gate: beat them for a chest
  n4aAmbush('raid',{x:790,y:84380,r:330,n:8,types:['n_shade'],level:21,spread:[60,240],respawn:300,say:['ash',S('Kobolds in the village. Again. Even the shadows have no manners.','Shadow raiders! Again!')]});
  n4aChest('raid',860,84420,()=>n4aFound('n_amb_raid'));
  // Moth Memory 1 behind a cracked wall in the copy of Yara's house (its east doorway is bricked up and cracked)
  n4aCrackWall('yara',[715,84678],[715,84720],{th:12});
  n4aPane(1,642,84706);
  // a Heart Ember on Ash's bed, in the copy of Ash's own house
  n4aHeart('n_he1',1145,87140,{then:()=>n4aBub('n_bub_bed','ash',S("My bed. She even copied my bed. ...It's not comfy. Shadow beds are terrible.",'My bed! It is not comfy at all.'))});
}

// ================= Tier II, the Clockstop Cliffs (stage n_clocks, Act II powers)
// 2A the Midnight Clock: two stone hands over an ink face. Enter at the 6 (east), leave by the 9 (south). The rule on the
// rim: the big hand points where you came from, the little hand where you want to go (9:30, "Lantern Time"). The long
// hand reaches the rim; the short hand reaches the 9's stone plinth only. Each whip pull turns a hand one hour.
//   long hand lever: a hook on a tall post at tower height (climb the tower with the Claws, then whip across the ink)
//   short hand lever: a hook in the alcove behind a moth veil (Shadow Dash through, then whip)
const N4A_CLK={rot:280,long:312,short:240,plinth:[222,350],w:30};
const n4aClkPhi=h=>(N4A_CLK.rot+h*30)%360;
function n4aClkDir(phi){ const a=phi*N4AD; return [Math.sin(a),-Math.cos(a)]; }
function n4aClkK(){ return (typeof N4G!=='undefined'&&N4G.clock)||{x:2165,y:83565,r:300,rim:345,hub:45}; }
function n4aClkHands(){ return {l:(G.found.n_clk_l==null?0:G.found.n_clk_l)|0,s:(G.found.n_clk_s==null?0:G.found.n_clk_s)|0}; }
function n4aBuildClock(){
  const K=n4aClkK(), C=n4aAdd('clock',{id:'n_clock',x:K.x,y:K.y,r:0,near:1600,la:0,sa:0});
  const seg=(h,len,from)=>{ const d=n4aClkDir(n4aClkPhi(h)); return [[K.x+d[0]*(from||0),K.y+d[1]*(from||0)],[K.x+d[0]*len,K.y+d[1]*len]]; };
  C.walk=(x,y)=>{ if(N4A.paint) return false; const H=n4aClkHands(), L=seg(H.l,N4A_CLK.long), Sx=seg(H.s,N4A_CLK.short), Pl=seg(9,N4A_CLK.plinth[1],N4A_CLK.plinth[0]);
    return n4aSegD(x,y,L[0],L[1])<N4A_CLK.w||n4aSegD(x,y,Sx[0],Sx[1])<N4A_CLK.w||n4aSegD(x,y,Pl[0],Pl[1])<36; };
  n4aOpen({id:'n4a_clock_hands',bb:[K.x-360,K.y-360,K.x+360,K.y+360],test:(x,y)=>C.walk(x,y)});
  // no jumping across the ink face: the air over it is a wall (except where a hand or the plinth is)
  n4aWall({id:'n4a_clock_air',bb:[K.x-300,K.y-300,K.x+300,K.y+300],test:(x,y)=>{ if(N4A.paint) return false; const d=dist(x,y,K.x,K.y); return d<K.r-2&&d>(K.hub||45)+2&&!C.walk(x,y); }});
  C.reset=q=>{ const H=n4aClkHands(); q.la=n4aClkPhi(H.l); q.sa=n4aClkPhi(H.s); };
  C.tick=(q,dt)=>{ const H=n4aClkHands(), k=Math.min(1,dt*6); q.la=n4aAngLerp(q.la,n4aClkPhi(H.l),k); q.sa=n4aAngLerp(q.sa,n4aClkPhi(H.s),k); };
  C.ground=(q,t)=>n4aDrawHands(q,K,t);
  // the hooks
  const hk=(id,x,y,which,can,where)=>{ const o=n4aAdd('clockhook',{id,x,y,r:16,hr:30,hz:which==='l'?58:30,which});
    o.hit=(q,src)=>{ if(src!=='whip') return false; if(n4aF('n_clockset')){ n4aSay(q.x,q.y-70,S('The clock is right. Leave it be.','The clock is right!'),'#ffe8c0','clkdone',3); return true; }
      if(!can()){ n4aSay(q.x,q.y-70,where,'#ffe8c0','clkwhere'+which,2); return true; }
      if(G.time-(q.cd||-9)<0.22) return true; q.cd=G.time; q.yank=1;
      const H=n4aClkHands(); if(which==='l') G.found.n_clk_l=(H.l+1)%12; else G.found.n_clk_s=(H.s+1)%12;
      n4aSnd('tick'); n4aSnd('clunk',0.5); n4aClockCheck(); return true; };
    o.tick=(q,dt)=>{ q.yank=Math.max(0,(q.yank||0)-dt*3); };
    o.stand=(q,t)=>{ const tall=which==='l'; n4aPut(n4aSpr('hookpost'+(tall?1:0),30,tall?96:56,15,tall?92:52,g=>n4aHookPostArt(g,tall)),q.x,q.y); const hy=q.y-(tall?84:46)-q.yank*6;
      n4aDrawHook(q.x+q.yank*4,hy,t,!n4aF('n_clockset')&&curWeapon()==='whip'&&dist(player.x,player.y,q.x,q.y)<260); };
    o.sy=q=>q.y+2; addCol({t:'c',x,y,r:8});
    n4aPrompt(o,x,y,40,()=>n4aF('n_clockset')?null:S('Look at the hook','Look at the hook'),()=>n4aSay(x,y-90,which==='l'?S('A chain runs from this hook to the long hand. Whip it to turn the hand. It is very high up.','Whip it from up high to turn the long hand.'):S('A chain runs from this hook to the short hand. Whip it to turn the hand.','Whip it to turn the short hand.'),'#ffe8c0','hk'+which,2));
    return o; };
  hk('n_hook_long',K.x,K.y-322,'l',()=>n4aLvl()>=4&&!n4aAir(),S('Too high! Get up to its height first.','Too high! Climb up first.'));
  hk('n_hook_short',2436,83838,'s',()=>player.y>83726&&player.x>2380&&player.x<2560,S('The curtain is in the way.','The curtain is in the way.'));
  // the moth veil across the alcove (Shadow Dash slips through; it reaches into the void so no jump goes round it)
  n4aVeilWall('n_veil_alcove',[2428,83716],[2596,83716],{h:84,len:118});
  // the rule painted on the rim (a sign at the 6)
  const sg=n4aAdd('clocksign',{id:'n_clock_sign',x:2486,y:83470,r:12});
  sg.stand=(q,t)=>n4aPut(n4aSpr('clksign',44,50,22,46,n4aClockSignArt),q.x,q.y); sg.sy=q=>q.y+2; addCol({t:'c',x:sg.x,y:sg.y,r:6,low:true});
  n4aPrompt(sg,sg.x,sg.y,24,()=>S('Read the rim','Read the rim'),()=>n4aScene('n_clock_rule',[['narr',S('Big friendly numbers on the rim, and words under the 6: "THE BIG HAND POINTS WHERE YOU CAME FROM. THE LITTLE HAND POINTS WHERE YOU WANT TO GO."','The rim says: "The big hand points where you came from. The little hand points where you want to go."')],
    ['ash',S('I came in at the 6. I want to leave by the 9. So... half past nine. Lantern Time!','Big hand on 6. Little hand on 9. Lantern Time!')]]));
}
function n4aAngLerp(a,b,k){ let d=((b-a+540)%360)-180; return (a+d*k+360)%360; }
function n4aClockCheck(){
  const H=n4aClkHands(); if(n4aF('n_clockset')) return;
  if(H.l===6&&H.s===9){ G.flags.n_clockset=1; n4aSnd('bigchime'); shake(4); flashA=Math.max(flashA,0.3); flashCol='255,226,160';
    n4aBub('n_bub_clock','ash',S('Lantern Time. Somebody has to keep the right time around here.',"Lantern Time! That's the right time."));
    n4aBanner(S('The Midnight Clock chimes','The clock chimes!'),S('The hands make a path across the ink.','The hands make a path.'),2.6); n4aEmit('clockset',{}); n4aSave(); }
}
function n4aDrawHands(q,K,t){
  if(!n4aView(K.x,K.y,420)) return;
  const set=n4aF('n_clockset'), H=n4aClkHands();
  const hand=(phi,len,w,tip,col,colD)=>{ const d=n4aClkDir(phi), nx=-d[1], ny=d[0], ex=K.x+d[0]*len, ey=K.y+d[1]*len;
    ctx.fillStyle='rgba(4,2,10,.55)'; ctx.beginPath(); ctx.moveTo(K.x+nx*w+4,K.y+ny*w+6); ctx.lineTo(ex+nx*w*0.7+4,ey+ny*w*0.7+6); ctx.lineTo(ex-nx*w*0.7+4,ey-ny*w*0.7+6); ctx.lineTo(K.x-nx*w+4,K.y-ny*w+6); ctx.closePath(); ctx.fill();
    ctx.fillStyle=colD; ctx.beginPath(); ctx.moveTo(K.x+nx*w,K.y+ny*w); ctx.lineTo(ex+nx*w*0.75,ey+ny*w*0.75); ctx.lineTo(ex+d[0]*tip,ey+d[1]*tip); ctx.lineTo(ex-nx*w*0.75,ey-ny*w*0.75); ctx.lineTo(K.x-nx*w,K.y-ny*w); ctx.closePath(); ctx.fill();
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(K.x+nx*w*0.8,K.y+ny*w*0.8); ctx.lineTo(ex+nx*w*0.55,ey+ny*w*0.55); ctx.lineTo(ex+d[0]*(tip-6),ey+d[1]*(tip-6)); ctx.lineTo(ex,ey); ctx.lineTo(K.x,K.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=N4AOC; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(K.x+nx*w,K.y+ny*w); ctx.lineTo(ex+nx*w*0.75,ey+ny*w*0.75); ctx.lineTo(ex+d[0]*tip,ey+d[1]*tip); ctx.lineTo(ex-nx*w*0.75,ey-ny*w*0.75); ctx.lineTo(K.x-nx*w,K.y-ny*w); ctx.stroke();
    // flagstone joints
    ctx.strokeStyle='rgba(40,30,70,.5)'; ctx.lineWidth=1.4; for(let s=60;s<len-10;s+=46){ ctx.beginPath(); ctx.moveTo(K.x+d[0]*s+nx*w*0.8,K.y+d[1]*s+ny*w*0.8); ctx.lineTo(K.x+d[0]*s-nx*w*0.8,K.y+d[1]*s-ny*w*0.8); ctx.stroke(); } };
  // the 9's plinth (a stone tongue the short hand can reach)
  { const d=n4aClkDir(n4aClkPhi(9)), a=N4A_CLK.plinth[0], b=N4A_CLK.plinth[1]-30, nx=-d[1]*34, ny=d[0]*34;
    ctx.fillStyle='#8a82ac'; ctx.beginPath(); ctx.moveTo(K.x+d[0]*a+nx,K.y+d[1]*a+ny); ctx.lineTo(K.x+d[0]*b+nx,K.y+d[1]*b+ny); ctx.lineTo(K.x+d[0]*b-nx,K.y+d[1]*b-ny); ctx.lineTo(K.x+d[0]*a-nx,K.y+d[1]*a-ny); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=N4AOC; ctx.lineWidth=3; ctx.stroke(); ctx.fillStyle='#2a2244'; ctx.font=`700 26px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('IX',K.x+d[0]*(a+40),K.y+d[1]*(a+40)); }
  hand(q.sa,N4A_CLK.short,24,26,set?'#ffe7b0':'#c8c0e0','#7a70a0');
  hand(q.la,N4A_CLK.long,22,30,set?'#fff0c8':'#e0daf4','#8a82b4');
  ctx.fillStyle=set?'#ffd27a':'#a49ad0'; ctx.beginPath(); ctx.arc(K.x,K.y,26,0,TAU); ctx.fill(); ctx.strokeStyle=N4AOC; ctx.lineWidth=3; ctx.stroke(); ctx.fillStyle='#2a2244'; ctx.beginPath(); ctx.arc(K.x,K.y,8,0,TAU); ctx.fill();
  if(set) n4aGlow(K.x,K.y,120,'255,220,150',0.25+0.08*Math.sin(t*2));
  // the hour each hook is turning, shown by a faint ghost hand at the target (the 6 and the 9 glow gold)
  for(const h of [6,9]){ const d=n4aClkDir(n4aClkPhi(h)), x=K.x+d[0]*322, y=K.y+d[1]*322, ok=h===6?H.l===6:H.s===9; n4aGlow(x,y,36,ok?'255,210,120':'200,180,255',ok?0.5:0.22+0.1*Math.sin(t*3)); }
}
function n4aHookPostArt(g,tall){
  const h=tall?84:46; n4aShade(g,9,3,1);
  n4aBox(g,-3.5,-h,7,h+1,N4APAL.brass); g.fillStyle=N4APAL.brass[0]; g.fillRect(-7,-3,14,4); g.fillRect(-6,-h-3,12,4);
  if(tall){ for(let y=-h+14;y<-6;y+=16){ g.fillStyle=N4APAL.brass[2]; g.fillRect(-3.5,y,7,2); } }
}
function n4aDrawHook(x,y,t,glow){
  if(glow) n4aGlow(x,y,26,'255,210,120',0.45+0.15*Math.sin(t*5));
  ctx.save(); ctx.strokeStyle=N4AOC; ctx.lineWidth=5.5; ctx.beginPath(); ctx.arc(x,y,9,0,TAU); ctx.stroke(); ctx.strokeStyle='#e8c060'; ctx.lineWidth=3; ctx.stroke(); ctx.strokeStyle='#fff0b0'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x,y,9,Math.PI*1.1,Math.PI*1.6); ctx.stroke(); ctx.restore();
}
function n4aClockSignArt(g){
  n4aShade(g,16,5,2); n4aBox(g,-3,-30,6,31,N4APAL.stone);
  g.fillStyle=N4APAL.stone[1]; rrect(g,-20,-44,40,22,4); g.fill(); g.fillStyle=N4APAL.stone[2]; rrect(g,-20,-44,40,6,3); g.fill();
  g.strokeStyle='#2a2244'; g.lineWidth=1.8; g.beginPath(); g.arc(-8,-33,7,0,TAU); g.stroke(); g.beginPath(); g.moveTo(-8,-33); g.lineTo(-8,-26); g.moveTo(-8,-33); g.lineTo(-13,-35); g.stroke();
  g.fillStyle='#2a2244'; g.fillRect(2,-38,14,2); g.fillRect(2,-33,12,2); g.fillRect(2,-28,14,2);
}
// a moth veil (bible 15 n_veil): blocks walking, jumps and flight; a Shadow Dash slips through while it lasts
function n4aVeilWall(id,A,B,o){
  o=o||{}; const len=o.len;   // the drawn part (the wall goes on to B, past the edge, so no jump goes round it)
  const V=n4aAdd('veil',{id,A,B,x:(A[0]+B[0])/2,y:(A[1]+B[1])/2,r:40,rip:0});
  V.wall=n4aWall({id:'n4a_'+id,bb:n4aBB([A,B],30),test:(x,y)=>n4aSegD(x,y,A,B)<(o.th||14),on:()=>!(typeof p2Shadowed==='function'&&p2Shadowed())});
  const D=len?[A[0]+(B[0]-A[0])*len/dist(A[0],A[1],B[0],B[1]),A[1]+(B[1]-A[1])*len/dist(A[0],A[1],B[0],B[1])]:B;
  V.tick=(q,dt)=>{ q.rip=Math.max(0,q.rip-dt*2); if(typeof p2Shadowed==='function'&&p2Shadowed()&&n4aSegD(player.x,player.y,A,D)<40) q.rip=0.6; };
  V.stand=(q,t)=>n4aVeil(A,D,t,1,{h:(o.h||90)*(1-q.rip*0.4),col:'64,40,110',seed:id.length});
  V.sy=q=>Math.max(A[1],D[1]);
  n4aPrompt(V,(A[0]+D[0])/2,(A[1]+D[1])/2,50,()=>S('Look at the moth curtain','Look at the curtain'),q=>n4aSay(q.x,q.y-80,S('Moths, thick as wool. A shadow could slip right through.','Shadow Dash through it!'),'#e0d0ff','veil'+id,2));
  return V;
}
// 2B the Silk Gallery: veils in both necks (θ 262 and 306); the islands' posts are x4_world's (grapple)
function n4aBuildGallery(){
  const v1=n4aVeilWall('n_veil_gal1',n4aP(2690,262),n4aP(3010,262),{h:96});
  v1.waitT=0; v1.tick=(q,dt)=>{ q.rip=Math.max(0,q.rip-dt*2); if(typeof p2Shadowed==='function'&&p2Shadowed()&&n4aSegD(player.x,player.y,q.A,q.B)<40) q.rip=0.6;
    if(n4aF('n_gallery')) return; const a=n4aAng(player.x,player.y); if(n4aNear(q.x,q.y,320)&&n4aIn(a,250,262)){ q.waitT+=dt; if(q.waitT>20) n4aBub('n_bub_gallery','ash',S('The post is hiding in the curtain. Dash in, then grab it.','Dash into the curtain. Then grab the post.')); } else q.waitT=Math.max(0,q.waitT-dt*0.5); };
  n4aVeilWall('n_veil_gal2',n4aP(2690,306),n4aP(3010,306),{h:96});
  const F=n4aAdd('gallery',{id:'n_gallery_far',x:n4aP(2850,309)[0],y:n4aP(2850,309)[1],r:0,near:900});
  F.tick=()=>{ if(n4aF('n_gallery')||n4aAir()) return; const a=n4aAng(player.x,player.y), r=n4aR(player.x,player.y); if(n4aIn(a,306.6,318)&&r>2380&&r<3320&&n4aLvl()===3){ G.flags.n_gallery=1; n4aSnd('chime',0.6); n4aEmit('gallery',{}); n4aSave(); } };
  // lamp moths on two of the islands (x4_foes' n_lampmoth; nothing while it is not there)
  n4aAmbush('gallery_moths',{x:n4aP(2850,276)[0],y:n4aP(2850,276)[1],r:520,n:2,types:['n_lampmoth'],level:22,spread:[0,40]});
  // 2C the Chalk Climb: moth-dust boulders roll down the middle column every 4 s (the outer columns are safe)
  const B=n4aAdd('boulders',{id:'n_chalk_boulders',x:n4aP(2800,331)[0],y:n4aP(2800,331)[1],r:0,near:700,ph:0,ball:null});
  B.reset=q=>{ q.ph=0; q.ball=null; };
  B.tick=(q,dt)=>{ if(n4aLvl()>=4&&!p2Climbing()) return; q.ph+=dt; const per=n4aByDiff(5,4,3.2);
    if(!q.ball&&q.ph>per-1.1){ q.ball={t:-1.1}; } if(q.ball){ q.ball.t+=dt; if(q.ball.t>0.9){ q.ball=null; q.ph=0; } else if(q.ball.t>0){ const k=q.ball.t/0.9, P=n4aP(2800,lerp(335,325,k)); q.ball.x=P[0]; q.ball.y=P[1];
      if(dist(player.x,player.y,P[0],P[1])<34&&!(player.iframes>0)){ hurtPlayer(player.maxHp*0.04/Math.max(0.01,(G.diff?G.diff.dmg:1)),P[0],P[1],180); n4aSay(player.x,player.y-46,S('Moth dust! Try another column.','Moth dust! Try another column.'),'#e8dcff','dust',4); } } } };
  B.over=(q,t)=>{ const b=q.ball; if(!b) return; const top=n4aP(2800,334.5);
    if(b.t<0){ const k=1+b.t/1.1; ctx.fillStyle=`rgba(20,10,30,${0.25+0.35*k})`; ctx.beginPath(); ctx.ellipse(top[0],top[1],12+18*k,7+9*k,0,0,TAU); ctx.fill(); n4aRing(top[0],top[1],30,'230,210,255',0.4+0.4*k,2); return; }
    ctx.fillStyle='rgba(20,10,30,.4)'; ctx.beginPath(); ctx.ellipse(b.x,b.y+6,22,9,0,0,TAU); ctx.fill();
    ctx.fillStyle='#b8acd8'; ctx.beginPath(); ctx.arc(b.x,b.y-14,20,0,TAU); ctx.fill(); ctx.fillStyle='#e4dcff'; ctx.beginPath(); ctx.arc(b.x-6,b.y-20,8,0,TAU); ctx.fill(); ctx.strokeStyle=N4AOC; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(b.x,b.y-14,20,0,TAU); ctx.stroke();
    if(Math.random()<0.6) emit(b.x+rand(-12,12),b.y-8,1,{col:'210,200,240',glow:false,smin:10,smax:50,lmin:.3,lmax:.7,zmin:1.5,zmax:3,grow:6,alpha:0.6}); };
  n4aAmbush('chalk_moths',{x:n4aP(2850,326)[0],y:n4aP(2850,326)[1],r:500,n:2,types:['n_lampmoth'],level:22,spread:[60,160]});
}
// 2D the Gear Bridge: whip three counterweights off their shelves onto the scale plate; the gears turn a third each, and
// their teeth make a walkway; the last gap (ink spray: no jump clears it) needs the Grapple Tail to the far post
const N4A_GEAR={plate:[4600,88200],shelves:null,a0:6,a1:17.6,a2:20.6};
function n4aGearN(){ let n=0; for(let i=0;i<3;i++) if(n4aFound('n_gw'+i)) n++; return n; }
function n4aBuildGears(){
  const SH=(typeof N4G!=='undefined'&&N4G.gear&&N4G.gear.shelves)||[[2600,358],[2850,352],[3150,357]].map(([r,a])=>n4aP(r,a)); N4A_GEAR.shelves=SH;
  const PL=N4A_GEAR.plate, G0=n4aAdd('gears',{id:'n_gearbridge',x:n4aP(2850,13)[0],y:n4aP(2850,13)[1],r:0,near:1700,turn:0,fly:[]});
  G0.reset=q=>{ q.turn=n4aGearN(); q.fly=[]; };
  G0.tick=(q,dt)=>{ q.turn=lerp(q.turn,n4aGearN(),Math.min(1,dt*2.2)); for(const f of q.fly) f.t+=dt; q.fly=q.fly.filter(f=>f.t<f.dur); };
  n4aOpen({id:'n4a_gear_teeth',bb:n4aSecBB(2780,2920,N4A_GEAR.a0-1,N4A_GEAR.a1+1,20),on:()=>n4aF('n_gear'),test:(x,y)=>!N4A.paint&&n4aSec(x,y,2792,2908,N4A_GEAR.a0-0.6,N4A_GEAR.a1)});
  n4aWall({id:'n4a_gear_spray',bb:n4aSecBB(2330,3370,N4A_GEAR.a1+0.15,N4A_GEAR.a2,20),test:(x,y)=>n4aSec(x,y,2330,3372,N4A_GEAR.a1+0.15,N4A_GEAR.a2)});
  G0.ground=(q,t)=>n4aDrawGears(q,t);
  G0.over=(q,t)=>{ for(const f of q.fly){ const k=clamp(f.t/f.dur,0,1), x=lerp(f.x0,f.x1,k), y=lerp(f.y0,f.y1,k)-Math.sin(Math.PI*k)*140; n4aPut(n4aSpr('weight',36,40,18,36,n4aWeightArt),x,y); } };
  // the counterweights on their shelves
  SH.forEach((p,i)=>{
    const W=n4aAdd('weight',{id:'n_gw'+i,x:p[0],y:p[1]-6,r:20,hr:30,hz:20,i});
    W.hit=(q,src)=>{ if(n4aFound(q.id)) return false; if(src!=='whip'){ if(src!=='fire') n4aSay(q.x,q.y-60,S('It is up on a high shelf. The Chain Whip could yank it down.','Use the whip to pull it down!'),'#ffe8c0','gwhow',2); return src!=='fire'; }
      G.found[q.id]=1; const n=n4aGearN(), to=[PL[0]-24+(n-1)*24,PL[1]-(n-1)*6]; G0.fly.push({x0:q.x,y0:q.y-20,x1:to[0],y1:to[1],t:0,dur:0.8}); n4aSnd('whoosh'); later(0.8,()=>{ n4aSnd('clank'); n4aSnd('creak'); shake(4); emit(to[0],to[1],12,{col:'200,170,110',glow:false,smin:30,smax:110,lmin:.2,lmax:.5,zmin:1.5,zmax:3}); if(n>=3&&!n4aF('n_gear')){ G.flags.n_gear=1; n4aSnd('bigchime'); n4aBanner(S('The gears line up!','The gears line up!'),S('Their teeth make a bridge. Grab the far post for the last bit.','Cross the teeth. Grapple the last gap.'),3); n4aEmit('gear',{}); } n4aSave(); });
      n4aEmit('weight',{i,n}); return true; };
    W.stand=(q,t)=>{ if(n4aFound(q.id)) return; n4aPut(n4aSpr('weight',36,40,18,36,n4aWeightArt),q.x,q.y); if(curWeapon()==='whip'&&dist(player.x,player.y,q.x,q.y)<260) n4aGlow(q.x,q.y-18,30,'255,210,120',0.35+0.15*Math.sin(t*5)); };
    W.sy=q=>q.y+30;
  });
  // the scale plate and the blocks stacked on it
  const P=n4aAdd('plate',{id:'n_gear_plate',x:PL[0],y:PL[1],r:30});
  P.ground=(q,t)=>{ const n=n4aGearN(); ctx.fillStyle='rgba(6,3,12,.4)'; ctx.beginPath(); ctx.ellipse(q.x+3,q.y+5,52,26,0,0,TAU); ctx.fill(); ctx.fillStyle='#86622e'; ctx.beginPath(); ctx.ellipse(q.x,q.y,50,24,0,0,TAU); ctx.fill(); ctx.fillStyle='#c49a4a'; ctx.beginPath(); ctx.ellipse(q.x-4,q.y-3,40,17,0,0,TAU); ctx.fill(); ctx.strokeStyle=N4AOC; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(q.x,q.y,50,24,0,0,TAU); ctx.stroke();
    for(let i=0;i<3;i++){ const a=-Math.PI/2+i*TAU/3; ctx.fillStyle=i<n?'#ffd27a':'#4e3418'; ctx.beginPath(); ctx.arc(q.x+Math.cos(a)*30,q.y+Math.sin(a)*14,5,0,TAU); ctx.fill(); } if(n) n4aGlow(q.x,q.y,50,'255,200,110',0.12*n); };
  P.stand=(q,t)=>{ const n=n4aGearN()-G0.fly.length; for(let i=0;i<n;i++) n4aPut(n4aSpr('weight',36,40,18,36,n4aWeightArt),q.x-24+i*24,q.y-i*6); };
  P.sy=q=>q.y+8;
  // an ink knight guards the middle shelf
  n4aAmbush('gear_knight',{x:SH[1][0]+40,y:SH[1][1]+90,r:300,n:1,types:['n_inkknight'],level:22,spread:[0,30]});
}
function n4aWeightArt(g){ n4aShade(g,16,5,2); n4aBox(g,-14,-30,28,30,N4APAL.brass); g.fillStyle=N4APAL.brass[3]; g.fillRect(-14,-30,28,3); g.strokeStyle=N4APAL.brass[0]; g.lineWidth=2.2; g.beginPath(); g.arc(0,-34,5,Math.PI,TAU); g.stroke(); g.fillStyle=N4APAL.brass[0]; g.font=`700 13px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('3',0,-14); }
function n4aGearArt(g,R,n){
  const P=N4APAL.brass; g.save(); g.scale(1,0.62);
  g.fillStyle=P[0]; g.beginPath(); for(let i=0;i<n*2;i++){ const a=i/(n*2)*TAU, r=i%2?R:R-14; i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r); } g.closePath(); g.fill();
  g.fillStyle=P[1]; g.beginPath(); for(let i=0;i<n*2;i++){ const a=i/(n*2)*TAU, r=(i%2?R:R-14)-4; i?g.lineTo(Math.cos(a)*r-3,Math.sin(a)*r-3):g.moveTo(Math.cos(a)*r-3,Math.sin(a)*r-3); } g.closePath(); g.fill();
  g.fillStyle=P[2]; g.beginPath(); g.arc(-6,-6,R*0.62,Math.PI*0.9,Math.PI*1.6); g.lineTo(-6,-6); g.closePath(); g.fill();
  g.fillStyle=P[0]; g.beginPath(); g.arc(0,0,R*0.2,0,TAU); g.fill(); for(let i=0;i<5;i++){ const a=i/5*TAU; g.beginPath(); g.arc(Math.cos(a)*R*0.45,Math.sin(a)*R*0.45,R*0.1,0,TAU); g.fill(); }
  g.restore();
}
function n4aDrawGears(q,t){
  const C=n4aP(2850,13); if(!n4aView(C[0],C[1],700)) return;
  const set=n4aF('n_gear'), k=q.turn/3;
  [8.6,12.8,17].forEach((a,i)=>{ const p=n4aP(2850,a), R=i===1?150:130, sp=n4aSpr('gear'+i,R*2+20,R*1.3+20,R+10,R*0.65+10,g=>n4aGearArt(g,R,i===1?14:12),2.4);
    ctx.save(); ctx.translate(p[0],p[1]); ctx.fillStyle='rgba(6,3,12,.45)'; ctx.beginPath(); ctx.ellipse(6,10,R,R*0.6,0,0,TAU); ctx.fill();
    ctx.scale(1,1); ctx.rotate(0); n4aPut(sp,0,0); ctx.restore();
    // the spoke that turns (a bright bar across the gear's face)
    const ang=(i%2?-1:1)*k*TAU+i; ctx.strokeStyle='rgba(255,230,160,.7)'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(p[0]-Math.cos(ang)*R*0.55,p[1]-Math.sin(ang)*R*0.34); ctx.lineTo(p[0]+Math.cos(ang)*R*0.55,p[1]+Math.sin(ang)*R*0.34); ctx.stroke(); });
  // the walkway of teeth once all three weights are on the plate
  if(set||q.turn>2.6){ const al=set?1:clamp((q.turn-2.6)/0.4,0,1); ctx.save(); ctx.globalAlpha*=al;
    for(let a=N4A_GEAR.a0-0.4;a<N4A_GEAR.a1;a+=0.9){ const p0=n4aP(2795,a), p1=n4aP(2905,a), p2=n4aP(2905,a+0.75), p3=n4aP(2795,a+0.75);
      ctx.fillStyle='#c49a4a'; ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); ctx.lineTo(p2[0],p2[1]); ctx.lineTo(p3[0],p3[1]); ctx.closePath(); ctx.fill(); ctx.strokeStyle=N4AOC; ctx.lineWidth=2; ctx.stroke(); }
    ctx.restore(); n4aGlow(n4aP(2850,12)[0],n4aP(2850,12)[1],160,'255,210,120',0.08*al); }
  // the ink spray over the last gap: a churning curtain no jump goes through (grapple over it)
  for(let a=N4A_GEAR.a1+0.4;a<N4A_GEAR.a2;a+=0.5) for(const r of [2420,2560,2700,2850,3000,3140,3280]){ const p=n4aP(r,a); if(!n4aView(p[0],p[1],60)) continue; const h=40+30*Math.sin(t*4+r*0.01+a*3);
    ctx.fillStyle='rgba(24,12,44,.7)'; ctx.beginPath(); ctx.ellipse(p[0],p[1]-h/2,12,h/2,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(170,120,255,.35)'; ctx.beginPath(); ctx.ellipse(p[0]-3,p[1]-h+6,4,7,0,0,TAU); ctx.fill(); }
  if(Math.random()<0.5){ const p=n4aP(rand(2400,3300),rand(N4A_GEAR.a1+0.3,N4A_GEAR.a2)); emit(p[0],p[1],1,{col:'50,24,90',glow:false,ang:-Math.PI/2,spread:0.5,smin:60,smax:160,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); }
}
// the Long Climb (U2) lands on the third ring; the Clockmaker's Rest (optional arc): a music box, three numbered gear hooks,
// Moth Memory 3 on the lid once the song plays; a Heart Ember in a cage (pull the chain ring on top with the Grapple Tail)
function n4aBuildClockmaker(){
  const U=n4aAdd('longclimb',{id:'n_longclimb_top',x:n4aP(2300,115)[0],y:n4aP(2300,115)[1],r:0,near:900});
  U.tick=()=>{ if(n4aF('n_longclimb')||n4aAir()) return; if(n4aLvl()===5&&n4aNear(U.x,U.y,330)){ G.flags.n_longclimb=1; n4aSnd('chime',0.6); n4aEmit('longclimb',{}); n4aSave(); } };
  const BX=n4aP(2850,150), MB=n4aAdd('musicbox',{id:'n_musicbox',x:BX[0],y:BX[1],r:30,step:0,playT:-1});
  addCol({t:'r',x0:BX[0]-40,y0:BX[1]-26,x1:BX[0]+40,y1:BX[1]+10});
  const hooks=[{n:2,p:n4aP(2560,152)},{n:1,p:n4aP(3120,147)},{n:3,p:n4aP(2860,159.5)}];
  MB.reset=q=>{ q.step=0; q.playT=-1; };
  MB.tick=(q,dt)=>{ if(q.playT>=0) q.playT+=dt; };
  MB.stand=(q,t)=>{ const on=n4aFound('n_musicbox'); n4aPut(n4aSpr('mbox',96,90,48,64,n4aMusicBoxArt),q.x,q.y);
    if(on){ n4aGlow(q.x,q.y-40,70,'255,220,150',0.3+0.1*Math.sin(t*2)); if(Math.random()<0.08) emit(q.x+rand(-30,30),q.y-60,1,{col:'255,236,180',ang:-Math.PI/2,spread:0.6,smin:10,smax:30,lmin:.8,lmax:1.4,zmin:1,zmax:2,rise:10}); }
    // the comb and drum turn while the song plays
    const k=on?t*2:0; ctx.strokeStyle='rgba(255,230,160,.8)'; ctx.lineWidth=2; for(let i=0;i<5;i++){ const y=q.y-40+((i*7+k*20)%30); ctx.beginPath(); ctx.moveTo(q.x-22,y); ctx.lineTo(q.x+22,y); ctx.stroke(); } };
  MB.sy=q=>q.y+10;
  n4aPrompt(MB,BX[0],BX[1]+20,40,()=>n4aFound('n_musicbox')?S('Listen to the music box','Listen'):S('Look at the music box','Look at the music box'),q=>{ if(n4aFound('n_musicbox')){ n4aSong(); return; } n4aSay(q.x,q.y-90,S('A music box the size of a cart. Its key is three gears with little numbers on them.','Pull the gears in order: 1, 2, 3.'),'#ffe8c0','mbhow',2); });
  hooks.forEach((h,i)=>{ const o=n4aAdd('gearhook',{id:'n_mbhook'+h.n,x:h.p[0],y:h.p[1],r:22,hr:32,hz:30,n:h.n,spin:0});
    o.hit=(q,src)=>{ if(src!=='whip'||n4aFound('n_musicbox')) return src==='whip'; if(G.time-(q.cd||-9)<0.4) return true; q.cd=G.time; q.spin=1;
      if(q.n===MB.step+1){ MB.step++; n4aSnd('tick'); n4aSnd('chime',0.4); emit(q.x,q.y-40,10,{col:'255,220,140',smin:20,smax:80,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4});
        if(MB.step>=3){ G.found.n_musicbox=1; MB.playT=0; n4aSong({slow:false}); n4aBanner(S('The music box plays','The music box plays'),S('The lantern song, at the right speed, for the first time on the peak.','The lantern song!'),3); n4aEmit('musicbox',{}); n4aSave(); } }
      else { MB.step=0; n4aSnd('clunk'); n4aSay(q.x,q.y-70,S('Clunk. Wrong order. The numbers say 1, 2, 3.','Clunk! Try 1, 2, 3.'),'#ffe0b0','mbwrong',1.5); }
      return true; };
    o.tick=(q,dt)=>{ q.spin=Math.max(0,q.spin-dt*2); };
    o.stand=(q,t)=>{ const lit=n4aFound('n_musicbox')||MB.step>=q.n; n4aPut(n4aSpr('ghook'+q.n,52,70,26,64,g=>n4aGearHookArt(g,q.n)),q.x,q.y); n4aDrawHook(q.x,q.y-52-q.spin*5,t,!lit&&curWeapon()==='whip'&&dist(player.x,player.y,q.x,q.y)<260); if(lit) n4aGlow(q.x,q.y-30,30,'255,210,120',0.4); };
    o.sy=q=>q.y+2; addCol({t:'c',x:h.p[0],y:h.p[1],r:12});
  });
  n4aPane(3,BX[0]+56,BX[1]+4,{ready:()=>n4aFound('n_musicbox')});
  n4aChest('clockmaker',BX[0]-70,BX[1]+30,()=>n4aFound('n_musicbox'));
  // the Heart Ember's cage at θ 180: the Grapple Tail hooks the ring on its lid; walk away to lift it
  const CG=(typeof N4G!=='undefined'&&N4G.gear)?n4aP(2650,180):[4500,82550], cage=n4aAdd('cage',{id:'n_cage',x:CG[0],y:CG[1],r:30,lid:0});
  const col=addCol({t:'c',x:CG[0],y:CG[1],r:26}); Object.defineProperty(col,'off',{get(){ return n4aFound('n_cage'); },configurable:true});
  cage.reset=q=>{ q.lid=n4aFound('n_cage')?1:0; };
  cage.tick=(q,dt)=>{ q.lid=lerp(q.lid,n4aFound('n_cage')?1:0,Math.min(1,dt*3)); };
  cage.stand=(q,t)=>{ n4aPut(n4aSpr('cage0',70,80,35,74,g=>n4aCageArt(g,false)),q.x,q.y); n4aPut(n4aSpr('cagelid',70,30,35,26,g=>n4aCageLidArt(g)),q.x,q.y-56-q.lid*46,1,1); };
  cage.sy=q=>q.y+8;
  if(typeof p2Add==='function'){ try{ p2Add('chainring',{id:'n_cage_ring',x:CG[0],y:CG[1]-2,h:70,mode:'custom',need:0.7,then:()=>{ if(n4aFound('n_cage')) return; G.found.n_cage=1; n4aSnd('creak'); n4aSnd('clank'); n4aBanner(S('The cage lid lifts!','The lid lifts!'),'',2); n4aEmit('cage',{}); n4aSave(); }}); }catch(e){ console.error('n4a cage ring',e); } }
  n4aHeart('n_he2',CG[0],CG[1]+2,{ready:()=>n4aFound('n_cage')});
}
function n4aMusicBoxArt(g){
  n4aShade(g,44,12,10);
  g.fillStyle='#3a2414'; g.fillRect(-42,-34,84,42); g.fillStyle='#6a4426'; g.fillRect(-42,-34,60,42); g.fillStyle='#8a5a32'; g.fillRect(-42,-34,8,42);
  g.fillStyle='#c49a4a'; g.fillRect(-42,-38,84,6); g.fillRect(-42,4,84,4);
  g.fillStyle='#1a1028'; g.fillRect(-26,-28,52,26); g.fillStyle='#e8c060'; g.fillRect(-24,-26,48,3);
  // the lid, propped open
  g.fillStyle='#4a2c18'; g.beginPath(); g.moveTo(-42,-38); g.lineTo(42,-38); g.lineTo(36,-60); g.lineTo(-36,-60); g.closePath(); g.fill(); g.fillStyle='#6a4426'; g.beginPath(); g.moveTo(-36,-42); g.lineTo(30,-42); g.lineTo(26,-56); g.lineTo(-32,-56); g.closePath(); g.fill();
  g.strokeStyle='#c49a4a'; g.lineWidth=2; g.beginPath(); g.ellipse(0,-49,12,5,0,0,TAU); g.stroke();
  // the key on the side
  g.fillStyle='#c49a4a'; g.fillRect(42,-20,10,4); g.beginPath(); g.arc(56,-18,6,0,TAU); g.fill(); g.fillStyle='#3a2414'; g.beginPath(); g.arc(56,-18,2.5,0,TAU); g.fill();
}
function n4aGearHookArt(g,n){
  n4aShade(g,16,5,2); n4aBox(g,-4,-48,8,49,N4APAL.stone);
  g.save(); g.translate(0,-30); n4aGearArt(g,20,8); g.restore();
  g.fillStyle='#fff0c0'; g.beginPath(); g.arc(0,-30,9,0,TAU); g.fill(); g.fillStyle='#2a1a10'; g.font=`700 13px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(n),0,-29);
}
function n4aCageArt(g){
  n4aShade(g,30,8,4); g.fillStyle=N4APAL.glass[1]; g.beginPath(); g.ellipse(0,0,30,11,0,0,TAU); g.fill(); g.fillStyle=N4APAL.glass[2]; g.beginPath(); g.ellipse(-3,-2,24,7,0,0,TAU); g.fill();
  g.strokeStyle=N4APAL.brass[1]; g.lineWidth=3; for(let i=0;i<9;i++){ const a=Math.PI*(0.1+i*0.1), x=Math.cos(a)*28, y=Math.sin(a)*9; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-54); g.stroke(); }
  g.strokeStyle=N4APAL.brass[2]; g.lineWidth=1.4; for(let i=0;i<9;i++){ const a=Math.PI*(0.1+i*0.1), x=Math.cos(a)*28-1, y=Math.sin(a)*9; g.beginPath(); g.moveTo(x,y-4); g.lineTo(x,y-50); g.stroke(); }
}
function n4aCageLidArt(g){ g.fillStyle=N4APAL.brass[0]; g.beginPath(); g.ellipse(0,0,32,11,0,0,TAU); g.fill(); g.fillStyle=N4APAL.brass[1]; g.beginPath(); g.ellipse(-2,-3,28,8,0,0,TAU); g.fill(); g.fillStyle=N4APAL.brass[2]; g.beginPath(); g.ellipse(-8,-5,12,3,0,0,TAU); g.fill(); g.strokeStyle=N4APAL.brass[0]; g.lineWidth=3; g.beginPath(); g.arc(0,-12,7,Math.PI,TAU); g.stroke(); }

// ================= Tier III, the Rime Spiral (stage n_rime, Act III powers)
const n4aBlue=()=>typeof P3!=='undefined'&&!!P3.bz&&!!P3.bz.blue&&!!P3.jet;
const n4aJet=(x,y,r)=>typeof p3JetHits==='function'&&n4aBlue()&&p3JetHits(x,y,r||16);
// the jet's full reach, ignoring the face it stops at (a jet aimed at something sitting right on a ledge's edge reaches it)
function n4aJetFar(x,y,r){ if(!n4aBlue()) return false; const J=P3.jet, dx=x-J.ox, dy=y-J.oy, ca=Math.cos(J.ang), sa=Math.sin(J.ang), t=dx*ca+dy*sa; if(t<0||t>440) return false; return Math.abs(-dx*sa+dy*ca)<(r||30)+14+t*0.08; }
const n4aBreathOn=(x,y,r)=>typeof p3BreathHits==='function'&&!n4aBlue()&&!!player.breathing&&!(typeof p4MoonOn==='function'&&p4MoonOn())&&p3BreathHits(x,y,r||16);
const n4aMeltNeed=(s)=>s*(n4aDiff()===0?0.6:1)*(G.flags.f_bluefire?0.5:1);
// 3A the Wind Gate: an ice wall (Blaze melts it; plain fire only makes it sweat), then the Floe Gap (ride the wind)
function n4aBuildRimeA(){
  const W=n4aGate('n_icewall',{a:126,r0:1550,r1:2350,th:22,shut:()=>!n4aFound('n_ice_t3a'),r:120,heat:0,heatT:-9});
  W.reset=q=>{ q.heat=0; };
  W.tick=(q,dt)=>{ if(n4aFound('n_ice_t3a')) return; let hot=false, warm=false;
    for(let s=0;s<=1.001;s+=0.05){ const x=lerp(q.A[0],q.B[0],s), y=lerp(q.A[1],q.B[1],s); if(n4aJet(x,y,18)){ hot=true; break; } if(!warm&&n4aBreathOn(x,y,18)) warm=true; }
    if(hot){ q.heat+=dt; q.heatT=G.time; if(Math.random()<0.7){ const s=Math.random(); emit(lerp(q.A[0],q.B[0],s),lerp(q.A[1],q.B[1],s)-rand(10,60),1,{col:'200,236,255',ang:Math.PI/2,spread:0.4,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); } if(Math.random()<dt*6) n4aSnd('melt',0.5); }
    else if(G.time-q.heatT>1.2) q.heat=Math.max(0,q.heat-dt*0.4);
    if(warm){ n4aBub('n_bub_icewall','ash',S("My fire isn't hot enough for that. I need a BLAZE.",'Normal fire is too weak. Use Blaze!'),{once:false,again:12}); }
    if(q.heat>=n4aMeltNeed(2)){ G.found.n_ice_t3a=1; n4aSnd('ice'); shake(5); for(let i=0;i<40;i++){ const s=Math.random(); emit(lerp(q.A[0],q.B[0],s),lerp(q.A[1],q.B[1],s)-rand(0,70),1,{col:'210,240,255',ang:-Math.PI/2,spread:1.4,smin:40,smax:200,lmin:.4,lmax:1,zmin:1.5,zmax:4}); }
      n4aBanner(S('The ice wall melts!','The ice melts!'),'',2); n4aEmit('icewall',{}); n4aSave(); } };
  W.stand=(q,t)=>{ q.open=lerp(q.open,n4aFound('n_ice_t3a')?1:0,0.06); if(q.open>0.98) return; const n=Math.round(dist(q.A[0],q.A[1],q.B[0],q.B[1])/40), k=clamp(q.heat/n4aMeltNeed(2),0,1);
    for(let i=0;i<n;i++){ const s=(i+0.5)/n, x=lerp(q.A[0],q.B[0],s), y=lerp(q.A[1],q.B[1],s); n4aPut(n4aSpr('icew'+(i%3),46,92,23,86,g=>n4aIceBlockArt(g,i%3)),x,y,1,1-q.open); }
    if(k>0.05) n4aGlow(q.x,q.y-40,220*k,'200,230,255',0.35*k); };
  W.sy=q=>Math.max(q.A[1],q.B[1]);
  W.ground=(q,t)=>{ if(!n4aFound('n_ice_t3a')) return; ctx.fillStyle='rgba(150,190,240,.3)'; for(let i=0;i<9;i++){ const s=(i+0.5)/9; ctx.beginPath(); ctx.ellipse(lerp(q.A[0],q.B[0],s),lerp(q.A[1],q.B[1],s),26,12,0,0,TAU); ctx.fill(); } };
  n4aPrompt(W,W.x,W.y,80,()=>n4aFound('n_ice_t3a')?null:S('Look at the ice wall','Look at the ice wall'),q=>n4aSay(q.x,q.y-100,n4aHas('blaze')?S('Black ice, thick as a house. Hold your fire until it burns blue.','Hold your fire until it turns blue!'):S('Black ice, thick as a house. Your fire only makes it sweat.','Your fire is not hot enough.'),'#d8f0ff','icehow',2));
  // the Floe Gap: a wind stream loops out over the void and back (jump into its swirl)
  if(typeof WIND!=='undefined') WIND.stream({id:'n_wind_floe',pts:[n4aP(2000,133.9),n4aP(2190,137.4),n4aP(2320,142.5),n4aP(2190,147.6),n4aP(2000,151.2)],w:84,lv:[5,5]});
  n4aSwirl('n_floe_swirl',n4aP(2000,133.9),()=>true);
  const F=n4aAdd('floe',{id:'n_floe_far',x:n4aP(2000,153)[0],y:n4aP(2000,153)[1],r:0,near:900});
  F.tick=()=>{ if(n4aF('n_floe')||n4aAir()) return; if(n4aLvl()===5&&n4aSec(player.x,player.y,1500,2400,150.4,158)){ G.flags.n_floe=1; n4aSnd('chime',0.6); n4aEmit('floe',{}); n4aSave(); } };
}
function n4aIceBlockArt(g,v){
  n4aShade(g,22,7,2); const h=72+v*8, P=['#1a3a6a','#3a6ab0','#9ad0ff','#e8f8ff'];
  g.fillStyle=P[0]; g.fillRect(-20,-h,40,h); g.fillStyle=P[1]; g.fillRect(-20,-h,28,h); g.fillStyle=P[2]; g.fillRect(-20,-h,6,h); g.fillStyle=P[3]; g.fillRect(-20,-h-4,40,7);
  g.strokeStyle='rgba(230,248,255,.75)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-8,-h+10); g.lineTo(-2,-h*0.5); g.moveTo(6,-h+20); g.lineTo(10,-h*0.3); g.stroke();
  g.fillStyle='rgba(120,80,200,.35)'; g.fillRect(-12,-h*0.6,20,h*0.3);
}
// the swirl at a stream's start: a ring of wind on the ground so kids see where to jump in
function n4aSwirl(id,p,on){
  const o=n4aAdd('swirl',{id,x:p[0],y:p[1],r:0,near:1200});
  o.ground=(q,t)=>{ const lit=on(); for(let i=0;i<3;i++){ const r=26+i*12+Math.sin(t*3+i)*3; ctx.save(); ctx.strokeStyle=`rgba(230,244,255,${lit?0.55-i*0.12:0.15})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(q.x,q.y,r,r*0.5,0,t*(2+i)+i,t*(2+i)+i+Math.PI*1.3); ctx.stroke(); ctx.restore(); }
    if(lit&&Math.random()<0.3) emit(q.x+rand(-24,24),q.y,1,{col:'235,246,255',glow:false,ang:-Math.PI/2,spread:0.4,smin:40,smax:120,lmin:.3,lmax:.6,zmin:1.2,zmax:2.2,alpha:0.7}); };
  n4aPrompt(o,p[0],p[1],34,()=>on()?S('Look at the wind','Look at the wind'):null,()=>n4aSay(p[0],p[1]-60,n4aHas('windride')?S('A swirl of wind. Jump into it and let it carry you.','Jump into the swirl!'):S('A swirl of wind. It would carry someone who knew how to ride it.','You need Wind Riding.'),'#e8f6ff','swirl'+id,2));
  return o;
}
// 3B the Ice Dam: a bomb on the seesaw's far end; Ground Pound the near end; the bomb lands on the dam's ledge, where the
// cold puts its fuse out in a moment (3 s, Easy 5, Hard 2): Blaze it. The dam bursts; the ink channel freezes over.
const N4A_DAM={ledge:[4000,82900,4400,83020],land:[4200,82960],A:[4470,83040],B:[4670,83150]};
function n4aBuildDam(){
  const D=N4A_DAM, L=(typeof N4G!=='undefined'&&N4G.dam&&N4G.dam.ledge)||D.ledge; D.ledge=L;
  const piv=[(D.A[0]+D.B[0])/2,(D.A[1]+D.B[1])/2], ang=Math.atan2(D.B[1]-D.A[1],D.B[0]-D.A[0]), len=dist(D.A[0],D.A[1],D.B[0],D.B[1]);
  if(typeof p3Add==='function'){ try{ D.saw=p3Add('seesaw',{id:'n_seesaw',x:piv[0],y:piv[1],dir:ang,len,toB:{x:D.land[0],y:D.land[1],peak:170}}); }catch(e){ console.error('n4a seesaw',e); } }
  if(typeof armsAdd==='function'){ try{ D.flower=armsAdd('bombflower',{id:'n_dam_flower',x:D.B[0]+30,y:D.B[1]+18}); }catch(e){ console.error('n4a flower',e); } }
  const inLedge=(x,y,m)=>x>L[0]-(m||0)&&x<L[2]+(m||0)&&y>L[1]-(m||0)&&y<L[3]+(m||0);
  const O=n4aAdd('dam',{id:'n_icedam',x:(L[0]+L[2])/2,y:L[1]+16,r:120,near:1500,hr:160});
  O.hitTest=(q,x,y)=>inLedge(x,y,30);
  O.hit=(q,src,x,y)=>{ if(n4aF('n_dam')) return false; if(src==='bomb'&&inLedge(x,y,24)){ n4aDamBurst(); return true; } if(src==='fire') return false; return false; };
  O.tick=(q,dt)=>{
    if(!G.wproj) return; const cold=n4aByDiff(5,3,2);
    for(const b of G.wproj){ if(b.k!=='bomb'||b.dead) continue;
      // held on the floe's far end: the cold floe keeps the fuse from burning down
      if(!b.n4aFlung&&(b.z||0)<3&&b.st!=='fly'&&dist(b.x,b.y,D.B[0],D.B[1])<38){ b.x=D.B[0]; b.y=D.B[1]; b.vx=b.vy=0; b.st='rest'; b.fuse=Math.max(b.fuse,9); b.n4aFloe=true; if(!b.n4aHeld){ b.n4aHeld=1; n4aSay(D.B[0],D.B[1]-40,S('The cold floe holds the fuse.','The fuse waits.'),'#d8f0ff','floe',3); } continue; }
      if(b.n4aFloe&&b.st==='fly'&&!b.n4aFlung){ b.n4aFlung=true; b.fuse=Math.max(b.fuse,9); }
      if(b.n4aFlung&&b.st!=='fly'&&inLedge(b.x,b.y,30)){ b.n4aCold=(b.n4aCold||0)+dt;
        if(n4aJetFar(b.x,b.y,22)){ b.fuse=0.02; continue; }
        if(b.n4aCold>cold){ b.dead=true; emit(b.x,b.y,10,{col:'200,230,255',glow:false,ang:-Math.PI/2,spread:1,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); n4aSnd('fsst'); n4aSay(b.x,b.y-40,S('Fsss... the cold put the fuse out! Blaze it next time.','The cold put it out! Use Blaze!'),'#d8f0ff','fizz',2);
          if(D.flower) G.found['bf_'+D.flower.id]=G.worldTime-87; n4aEmit('damfizzle',{}); } continue; }
      // a bomb thrown straight up at the icy ledge slides off it
      if(!b.n4aFlung&&inLedge(b.x,b.y,6)&&(b.z||0)<40){ b.dead=true; emit(b.x,b.y,8,{col:'200,230,255',glow:false,smin:20,smax:70,lmin:.2,lmax:.5,zmin:1.5,zmax:3}); n4aSnd('fsst'); n4aSay(b.x,b.y-30,S('Too high and slippery! It slid off into the ink.','It slid off!'),'#d8f0ff','slid',2); }
    }
    // plain fire or Blaze on the dam itself
    if(!n4aF('n_dam')&&(n4aJetFar(q.x,q.y-10,60))) n4aSay(q.x,q.y-90,S('The dam is too thick to melt. Something has to blow it up.','Too thick to melt. Blow it up!'),'#d8f0ff','damblaze',6);
  };
  O.stand=(q,t)=>n4aDrawDam(q,L,t); O.sy=q=>L[3];
  O.ground=(q,t)=>{ // the frozen lake held back behind the dam, and the target ring where the bomb lands
    if(n4aF('n_dam')) return; ctx.fillStyle='rgba(150,190,240,.22)'; ctx.beginPath(); ctx.ellipse(q.x,L[1]-60,260,70,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(230,244,255,.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(q.x,L[1]-60,260,70,0,0,TAU); ctx.stroke();
    n4aRing(D.land[0],D.land[1],34,'255,210,140',0.35+0.15*Math.sin(t*3),2.4); };
  n4aPrompt(O,D.A[0]-30,D.A[1]-20,40,()=>n4aF('n_dam')?null:S('Look at the ice dam','Look at the ice dam'),q=>n4aScene('n_dam_look',[['narr',S('High on an icy ledge, an ice dam holds back a frozen lake. Below it, the ink channel cuts the ring in two. Next to you: a seesaw floe.','An ice dam up high. A seesaw floe next to you.')],
    ['ash',S('A bomb on the far end. A big jump on this end. And then... something hot. Very hot.','Bomb on that end. Pound this end. Then something hot!')]]));
  n4aAmbush('dam_far',{x:n4aP(1950,205)[0],y:n4aP(1950,205)[1],r:360,n:4,types:['n_shade_wolf','n_frostshade'],level:22,when:()=>n4aF('n_dam')});
}
function n4aDamBurst(){
  if(n4aF('n_dam')) return; G.flags.n_dam=1; n4aSnd('crack'); n4aSnd('ice'); n4aSnd('gloomp'); shake(10); flashA=Math.max(flashA,0.35); flashCol='220,240,255';
  const L=N4A_DAM.ledge; for(let i=0;i<60;i++) emit(rand(L[0],L[2]),rand(L[1]-40,L[3]),1,{col:i%2?'220,240,255':'150,190,240',ang:-Math.PI/2,spread:1.6,smin:60,smax:280,lmin:.4,lmax:1.1,zmin:1.5,zmax:4});
  N4A.flood={t:0};
  n4aBanner(S('The dam bursts!','The dam bursts!'),S('The water floods the channel and freezes in a flash. An ice bridge!','The water freezes. An ice bridge!'),3);
  n4aEmit('dam',{}); n4aSave();
}
function n4aDrawDam(q,L,t){
  if(n4aF('n_dam')){ const f=N4A.flood; if(f&&f.t<2.5){ f.t+=1/60; const k=f.t/2.5; ctx.fillStyle=`rgba(190,220,255,${0.6*(1-k)})`; ctx.beginPath(); ctx.ellipse((L[0]+L[2])/2,L[3]+120*k,200+120*k,60+120*k,0,0,TAU); ctx.fill(); } return; }
  const n=10; for(let i=0;i<n;i++){ const x=lerp(L[0]+20,L[2]-20,(i+0.5)/n), y=L[1]+12; n4aPut(n4aSpr('dam'+(i%3),46,92,23,86,g=>n4aIceBlockArt(g,i%3)),x,y,0.8); }
  n4aGlow((L[0]+L[2])/2,L[1]-20,120,'170,210,255',0.18+0.05*Math.sin(t*1.5));
}
// 3C the Aurora Bridge: S1 lifts you from the start shore to pillar 1; S2 blows back to the start until the aurora sail
// is swung round by a Ground Pound on its plate, then carries you to pillar 2; S3 takes you to the far shore. Violet
// lightning strikes the pillars (telegraphed); time your landing, or ride on.
const N4A_AUR={p1:null,p2:null};
function n4aBuildAurora(){
  const P1=n4aP(1950,248), P2=n4aP(1950,268); N4A_AUR.p1=P1; N4A_AUR.p2=P2;
  if(typeof WIND!=='undefined'){
    WIND.stream({id:'n_wind_s1',pts:[n4aP(1955,228.4),n4aP(2140,235),n4aP(2110,242),n4aP(1950,247.3)],w:84,lv:[5,6]});
    WIND.stream({id:'n_wind_s2a',pts:[n4aP(1950,249.7),n4aP(2260,253.5),n4aP(2310,244),n4aP(2240,235.5),n4aP(1900,227.2)],w:72,lv:[6,5],on:()=>!n4aF('n_sail')});
    WIND.stream({id:'n_wind_s2b',pts:[n4aP(1950,249.7),n4aP(1780,255.5),n4aP(1780,261.5),n4aP(1950,267.2)],w:84,lv:[6,6],on:()=>n4aF('n_sail')});
    WIND.stream({id:'n_wind_s3',pts:[n4aP(1950,269.7),n4aP(2120,276),n4aP(2080,283.5),n4aP(1950,289.6)],w:84,lv:[6,6]});
  }
  n4aSwirl('n_s1_swirl',n4aP(1955,228.4),()=>true);
  // the aurora sail and its pound plate on pillar 1
  const pl=[P1[0]-6,P1[1]+10], sail=n4aAdd('sail',{id:'n_sail',x:pl[0],y:pl[1],r:24,pr:30,swing:0});
  sail.reset=q=>{ q.swing=n4aF('n_sail')?1:0; };
  sail.pound=(q,info)=>{ if(dist(info.x,info.y,q.x,q.y)>info.R*0.6+34) return; if(n4aF('n_sail')){ n4aSay(q.x,q.y-60,S('The sail is already turned.','Already turned!'),'#e8f6ff','sail2',3); return; }
    G.flags.n_sail=1; n4aSnd('crack',0.5); n4aSnd('whoosh'); n4aSnd('chime',0.6); shake(5);
    for(let i=0;i<24;i++) emit(q.x,q.y-50,1,{col:i%2?'150,255,210':'200,150,255',ang:rand(0,TAU),spread:0.2,smin:40,smax:180,lmin:.4,lmax:.9,zmin:1.4,zmax:3});
    n4aBanner(S('The aurora sail swings round!','The sail turns!'),S('The wind changes. It blows toward the second pillar now.','The wind blows the other way now!'),3); n4aEmit('sail',{}); n4aSave(); };
  sail.tick=(q,dt)=>{ q.swing=lerp(q.swing,n4aF('n_sail')?1:0,Math.min(1,dt*2)); };
  sail.stand=(q,t)=>n4aDrawSail(q,t); sail.sy=q=>q.y-10;
  sail.ground=(q,t)=>{ ctx.fillStyle='#2e4c80'; ctx.beginPath(); ctx.ellipse(q.x,q.y,26,14,0,0,TAU); ctx.fill(); ctx.fillStyle=n4aF('n_sail')?'#ffe7a0':'#9ad0ff'; ctx.beginPath(); ctx.ellipse(q.x-2,q.y-2,18,9,0,0,TAU); ctx.fill(); ctx.strokeStyle=N4AOC; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(q.x,q.y,26,14,0,0,TAU); ctx.stroke();
    if(!n4aF('n_sail')){ ctx.strokeStyle=`rgba(255,240,200,${0.5+0.3*Math.sin(t*4)})`; ctx.lineWidth=2; for(let i=0;i<2;i++){ ctx.beginPath(); ctx.moveTo(q.x-8+i*16,q.y-24-((t*30)%12)); ctx.lineTo(q.x-8+i*16,q.y-14); ctx.lineTo(q.x-12+i*16,q.y-18); ctx.moveTo(q.x-8+i*16,q.y-14); ctx.lineTo(q.x-4+i*16,q.y-18); ctx.stroke(); } } };
  n4aPrompt(sail,pl[0],pl[1],30,()=>n4aF('n_sail')?null:S('Look at the plate','Look at the plate'),q=>n4aSay(q.x,q.y-80,S('A plate at the foot of a frozen aurora sail. It wants a big THUMP.','Ground Pound the plate!'),'#e8f6ff','sailhow',2));
  // the storm over the pillars
  const ST=n4aAdd('storm',{id:'n_storm_aurora',x:n4aP(1950,258)[0],y:n4aP(1950,258)[1],r:0,near:1300,t:0,k:0,strike:null});
  ST.reset=q=>{ q.t=0; q.strike=null; };
  ST.tick=(q,dt)=>{ q.t+=dt; const per=n4aByDiff(4,3,2.4), tele=n4aByDiff(1.6,1.2,0.9);
    if(!q.strike&&q.t>per){ q.t=0; q.k=(q.k+1)%2; const P=q.k?N4A_AUR.p2:N4A_AUR.p1; q.strike={x:P[0],y:P[1],r:72,t:-tele,tele}; n4aSnd('warn'); }
    const s=q.strike; if(s){ s.t+=dt; if(s.t>=0&&!s.hit){ s.hit=true; n4aSnd('zap'); flashA=Math.max(flashA,0.18); flashCol='180,130,255'; shake(4);
        const p=player; if(dist(p.x,p.y,s.x,s.y)<s.r+8&&!(typeof p4Burrowed==='function'&&p4Burrowed())){ hurtPlayer(p.maxHp*0.08/Math.max(0.01,(G.diff?G.diff.dmg:1)),s.x,s.y,0); }
        for(let i=0;i<18;i++) emit(s.x+rand(-s.r,s.r)*0.6,s.y+rand(-s.r,s.r)*0.3,1,{col:'200,160,255',ang:-Math.PI/2,spread:1,smin:40,smax:200,lmin:.2,lmax:.5,zmin:1.5,zmax:3}); }
      if(s.t>0.35) q.strike=null; } };
  ST.over=(q,t)=>n4aDrawStrike(q.strike,t);
  const F=n4aAdd('aurorafar',{id:'n_aurora_far',x:n4aP(1950,291)[0],y:n4aP(1950,291)[1],r:0,near:900});
  F.tick=()=>{ if(n4aF('n_aurora')||n4aAir()) return; if(n4aLvl()===6&&n4aSec(player.x,player.y,1500,2400,287.5,298)){ G.flags.n_aurora=1; n4aSnd('chime',0.6); n4aEmit('aurora',{}); n4aSave(); } };
}
function n4aDrawSail(q,t){
  const k=q.swing, x=q.x+18, y=q.y-6;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle=N4AOC; ctx.fillRect(-3,-96,6,96); ctx.fillStyle='#9ad0ff'; ctx.fillRect(-2,-94,3,92);
  // the sail: a sheet of frozen aurora, swung from facing back (west) to facing on (east)
  const w=lerp(-46,46,k), gr=ctx.createLinearGradient(0,-90,w,-30); gr.addColorStop(0,'rgba(140,255,210,.85)'); gr.addColorStop(1,'rgba(190,130,255,.85)');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(0,-92); ctx.quadraticCurveTo(w*0.8,-80+Math.sin(t*2)*4,w,-62); ctx.lineTo(w*0.9,-26); ctx.quadraticCurveTo(w*0.4,-30,0,-20); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(240,255,250,.8)'; ctx.lineWidth=2; ctx.stroke();
  ctx.restore();
  n4aGlow(x+lerp(-30,30,k),y-60,60,'160,255,220',0.3);
}
function n4aDrawStrike(s,t){
  if(!s) return;
  if(s.t<0){ const k=1+s.t/s.tele; ctx.save(); ctx.fillStyle=`rgba(150,90,255,${0.12+0.25*k})`; ctx.beginPath(); ctx.ellipse(s.x,s.y,s.r,s.r*0.55,0,0,TAU); ctx.fill();
    ctx.strokeStyle=`rgba(230,200,255,${0.5+0.5*k})`; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(s.x,s.y,s.r*(1.4-0.4*k),s.r*0.55*(1.4-0.4*k),0,0,TAU); ctx.stroke(); ctx.restore(); return; }
  const a=1-s.t/0.35; ctx.save(); ctx.strokeStyle=`rgba(240,220,255,${a})`; ctx.lineWidth=6; ctx.beginPath(); let x=s.x, y=s.y-420; ctx.moveTo(x,y); for(let i=0;i<7;i++){ x=s.x+rand(-30,30); y+=60; ctx.lineTo(x,y); } ctx.lineTo(s.x,s.y); ctx.stroke(); ctx.strokeStyle=`rgba(170,110,255,${a})`; ctx.lineWidth=14; ctx.globalAlpha=0.4; ctx.stroke(); ctx.restore();
  n4aGlow(s.x,s.y,s.r*1.8,'200,150,255',0.7*a);
}
// U3 the Gust Stair (after the Echo of the Ice Dragon), the Frozen Choir (optional arc) and the Heart Ember's ice lid
function n4aBuildRimeB(){
  if(typeof WIND!=='undefined') WIND.stream({id:'n_wind_gust',pts:[n4aP(1950,20),n4aP(1780,20.4),n4aP(1600,21),n4aP(1430,21.6),n4aP(1300,22)],w:84,lv:[6,7],on:()=>n4aEchoWon(3)});
  const col=n4aAdd('gust',{id:'n_gust_col',x:n4aP(1950,20)[0],y:n4aP(1950,20)[1],r:0,near:1200});
  col.ground=(q,t)=>{ const on=n4aEchoWon(3); for(let i=0;i<4;i++){ const r=22+i*13+Math.sin(t*4+i)*3; ctx.save(); ctx.strokeStyle=`rgba(235,246,255,${on?0.6-i*0.12:0.14})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(q.x,q.y,r,r*0.5,0,t*(3+i),t*(3+i)+Math.PI*1.4); ctx.stroke(); ctx.restore(); } };
  col.over=(q,t)=>{ if(!n4aEchoWon(3)) return; for(let i=0;i<10;i++){ const k=((t*0.8+i/10)%1), x=q.x+Math.sin(t*3+i*1.7)*(14+i*2), y=q.y-k*260; ctx.fillStyle=`rgba(240,248,255,${0.8*(1-k)})`; ctx.fillRect(x-1.5,y-1.5,3,3); } n4aGlow(q.x,q.y-90,70,'220,236,255',0.15); };
  n4aPrompt(col,col.x,col.y,40,()=>S('Look at the column of wind','Look at the wind'),()=>n4aSay(col.x,col.y-80,n4aEchoWon(3)?S('Snow whirls UP here, onto the last ring. Jump in!','Jump in! It goes up!'):S('The wind is holding its breath. Something up here has to be beaten first.','The wind sleeps. Beat the ice dragon first.'),'#e8f6ff','gusthow',2));
  const T=n4aAdd('gustland',{id:'n_gust_land',x:n4aP(1300,22)[0],y:n4aP(1300,22)[1],r:0,near:900});
  T.tick=()=>{ if(n4aF('n_gust')||n4aAir()) return; if(n4aLvl()===7&&n4aNear(T.x,T.y,340)){ G.flags.n_gust=1; n4aSnd('chime',0.6); n4aEmit('gust',{}); n4aSave(); } };
  // the Frozen Choir: twelve shadow people in a half circle, each holding a frosted lantern. Blaze melts the frost, then any
  // fire lights it. All twelve lit: they sing (the lantern song in twelve chimes); a chest and Moth Memory 4.
  const CC=n4aP(1950,60), N=12, R=175, ch=n4aAdd('choir',{id:'n_choir',x:CC[0],y:CC[1],r:0,near:1200,songT:-1});
  const lit=i=>(G.found['n_choir'+i]|0)>=2, frost=i=>!(G.found['n_choir'+i]|0);
  ch.reset=q=>{ q.songT=n4aFound('n_choir_sang')?99:-1; };
  ch.tick=(q,dt)=>{ if(q.songT>=0) q.songT+=dt; };
  for(let i=0;i<N;i++){ const a=Math.PI*(1.06+0.88*i/(N-1)), x=CC[0]+Math.cos(a)*R, y=CC[1]+Math.sin(a)*R*0.62, lx=x+Math.cos(a+Math.PI/2)*16, ly=y+4;
    const o=n4aAdd('choirlantern',{id:'n_choirl'+i,x:lx,y:ly,r:12,fr:18,hz:58,i,heat:0});
    o.reset=q=>{ q.heat=0; };
    o.tick=(q,dt)=>{ if(frost(q.i)&&n4aJet(q.x,q.y-50,16)){ q.heat+=dt; if(Math.random()<0.5) emit(q.x,q.y-60,1,{col:'210,240,255',ang:Math.PI/2,spread:0.4,smin:10,smax:40,lmin:.2,lmax:.5,zmin:1,zmax:2}); if(q.heat>=n4aMeltNeed(0.6)){ G.found['n_choir'+q.i]=1; n4aSnd('ice',0.6); } }
      else if(frost(q.i)&&n4aBreathOn(q.x,q.y-50,16)) n4aSay(q.x,q.y-90,S('The frost hisses. Hotter!','Hotter! Use Blaze!'),'#d8f0ff','choirfrost',3); };
    o.fire=(q,dt)=>{ if(frost(q.i)||lit(q.i)) return; G.found['n_choir'+q.i]=2; n4aSnd('lamp',0.7); emit(q.x,q.y-60,10,{col:'255,210,120',ang:-Math.PI/2,spread:1,smin:20,smax:70,lmin:.3,lmax:.7,zmin:1.4,zmax:2.6});
      let n=0; for(let k=0;k<N;k++) if(lit(k)) n++; if(n>=N&&!n4aFound('n_choir_sang')){ G.found.n_choir_sang=1; ch.songT=0; n4aSong({base:659.25,eighth:0.26}); n4aBanner(S('The Frozen Choir sings','The choir sings!'),S('Twelve soft chimes, the lantern song.','The lantern song!'),3.2); n4aEmit('choir',{}); } n4aSave(); };
    o.stand=(q,t)=>{ const L=lit(q.i), F=frost(q.i); n4aPut(n4aSpr('chl'+(L?2:F?0:1),34,92,17,86,g=>n4aLanternArt(g,L,F)),q.x,q.y,0.72); if(L){ const f=0.85+0.15*Math.sin(t*8+q.i); n4aGlow(q.x,q.y-46,44,'255,200,110',0.5*f); } else if(F) n4aGlow(q.x,q.y-46,18,'170,220,255',0.2); };
    o.sy=q=>q.y+1;
    const fo=n4aAdd('choirfolk',{id:'n_choirf'+i,x,y,r:10,v:i%3,face:a});
    fo.stand=(q,t)=>{ n4aPut(n4aSpr('folk'+q.v,40,56,20,48,g=>{ if(typeof n4FolkArt==='function') n4FolkArt(g,q.v); else{ g.fillStyle='#221c32'; g.fillRect(-7,-32,14,32); g.beginPath(); g.arc(0,-38,7,0,TAU); g.fill(); } }),q.x,q.y);
      if(ch.songT>=0&&ch.songT<8){ const k=Math.sin(ch.songT*4-q.v)*0.5+0.5; n4aGlow(q.x,q.y-36,26,'255,236,190',0.3*k); } };
    fo.sy=q=>q.y;
    addCol({t:'c',x,y,r:9});
  }
  n4aPrompt(ch,CC[0],CC[1]+40,60,()=>n4aFound('n_choir_sang')?null:S('Look at the choir','Look at the choir'),()=>n4aSay(CC[0],CC[1]-40,S('Twelve frozen singers, twelve frosted lanterns. Melt the frost with Blaze, then light them.','Melt the frost. Then light the lanterns!'),'#ffe8c0','choirhow',2));
  n4aPane(4,CC[0],CC[1]-10,{ready:()=>n4aFound('n_choir_sang')});
  n4aChest('choir',CC[0]+60,CC[1]+70,()=>n4aFound('n_choir_sang'));
  // the Heart Ember's ice ledge: a cracked ice lid hides the stairs up (Ground Pound it)
  const EL=(typeof N4G!=='undefined'&&N4G.emberLedge)||[6600,85200,70], st=[EL[0]-28,EL[1]+46,EL[0]+28,EL[1]+126];
  const lid=n4aGate('n_icelid',{A:[st[0],(st[1]+st[3])/2],B:[st[2],(st[1]+st[3])/2],x:EL[0],y:(st[1]+st[3])/2,test:(x,y)=>x>st[0]-4&&x<st[2]+4&&y>st[1]&&y<st[3]+6,bb:[st[0]-20,st[1]-20,st[2]+20,st[3]+20],shut:()=>!n4aFound('n_icelid'),r:46,pr:40});
  lid.pound=(q)=>{ if(n4aFound('n_icelid')) return; G.found.n_icelid=1; n4aSnd('crack'); n4aSnd('ice',0.6); shake(6); for(let i=0;i<30;i++) emit(q.x+rand(-30,30),q.y+rand(-30,30),1,{col:'210,240,255',ang:-Math.PI/2,spread:1.4,smin:40,smax:180,lmin:.3,lmax:.8,zmin:1.5,zmax:3.5}); n4aBanner(S('The ice lid shatters!','The lid breaks!'),S('Stairs!','Stairs!'),2); n4aEmit('icelid',{}); n4aSave(); };
  lid.hit=(q,src)=>{ if(n4aFound('n_icelid')) return false; if(src==='bomb'||src==='hammer'){ n4aSay(q.x,q.y-50,S('Too thick! Land on it, hard.','Too thick! Ground Pound it!'),'#d8f0ff','lidhow',2); return true; } return false; };
  lid.ground=(q,t)=>{ if(n4aFound('n_icelid')) return; ctx.fillStyle='#3d68a6'; rrect(ctx,st[0]-6,st[1]-4,st[2]-st[0]+12,st[3]-st[1]+8,10); ctx.fill(); ctx.fillStyle='#9ad0ff'; rrect(ctx,st[0]-2,st[1],st[2]-st[0]+2,(st[3]-st[1])*0.5,8); ctx.fill();
    ctx.strokeStyle=N4AOC; ctx.lineWidth=2.6; rrect(ctx,st[0]-6,st[1]-4,st[2]-st[0]+12,st[3]-st[1]+8,10); ctx.stroke(); ctx.strokeStyle='rgba(240,250,255,.85)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(q.x-14,st[1]+10); ctx.lineTo(q.x+2,q.y); ctx.lineTo(q.x-6,st[3]-8); ctx.moveTo(q.x+2,q.y); ctx.lineTo(q.x+16,q.y+12); ctx.stroke(); };
  n4aPrompt(lid,EL[0],st[3]+10,34,()=>n4aFound('n_icelid')?null:S('Look at the ice lid','Look at the ice lid'),()=>n4aSay(EL[0],st[1]-30,S('Cracked ice over a stair. It only needs one good THUMP.','Ground Pound it!'),'#d8f0ff','lidhow2',2));
  n4aHeart('n_he3',EL[0],EL[1]-6);
}

// ================= Tier IV, the Moonglass Crown (stage n_glass, Act IV powers)
const n4aDiving=()=>typeof p4Diving==='function'&&p4Diving();
const n4aBurrowed=()=>typeof p4Burrowed==='function'&&p4Burrowed();
const n4aMoonAt=(x,y,r)=>typeof p4MoonHits==='function'&&p4MoonHits(x,y,r||16);
// the Moth Door (θ 12): a one-way silk curtain, parted from the Cradle side only (a shortcut back to the Moonglass Shrine)
function n4aBuildMothDoor(){
  const g=n4aGate('n_mothdoor',{a:12,r0:1112,r1:1268,th:16,shut:()=>!n4aFound('n_mothdoor'),r:80});
  g.stand=(q,t)=>{ q.open=lerp(q.open,n4aFound('n_mothdoor')?1:0,0.05); if(q.open>0.98) return; n4aVeil(q.A,q.B,t,1-q.open,{h:110,col:'190,180,220',seed:12}); };
  g.sy=q=>Math.max(q.A[1],q.B[1]);
  n4aPrompt(g,g.x,g.y,60,()=>n4aFound('n_mothdoor')?null:S('Look at the silk curtain','Look at the curtain'),q=>{ const a=n4aAng(player.x,player.y);
    if(n4aIn(a,300,372-0.5)&&!n4aIn(a,12,30)){ G.found.n_mothdoor=1; n4aSnd('whoosh'); n4aSnd('chime',0.5); n4aBanner(S('The silk curtain parts','The curtain opens'),S('A shortcut back to the Moonglass Shrine.','A shortcut!'),2.4); n4aEmit('mothdoor',{}); n4aSave(); }
    else n4aSay(q.x,q.y-90,S('Moth silk, knotted shut. All the knots are on the other side.','It is tied from the other side.'),'#e8e0ff','mdoor',2); });
}
// 4A the Drowned Mirror: a glass wall across the lagoon, open only under the water (Dive); a moonstone on the far bank
// (Moonfire) raises the lagoon over the glass spikes; then walk (Stride) or swim across the high water
function n4aBuildLagoon(){
  const g=n4aGate('n_glasswall',{a:62,r0:898,r1:1482,th:16,shut:()=>!n4aDiving(),r:120});
  g.stand=(q,t)=>n4aDrawGlassWall(q,t); g.sy=q=>Math.max(q.A[1],q.B[1]);
  g.tick=q=>{ if(!n4aDiving()&&n4aNear(q.x,q.y,330)&&player.onWater) n4aSay(player.x,player.y-46,n4aHas('dive')?S('There is a dark gap under the glass. Dive!','Dive under it!'):S('Glass, top to bottom. Except a dark gap way down under the water.','There is a gap under the water.'),'#d8e8ff','gwall',6); };
  const MS=(typeof N4G!=='undefined'&&N4G.moonstone)||n4aP(1455,81);
  if(typeof p4Add==='function'){ try{ p4Add('moonstone',{id:'n_lagoon_stone',x:MS[0],y:MS[1],keep:true,then:()=>n4aLagoonRise()}); }catch(e){ console.error('n4a moonstone',e); } }
  const R=n4aAdd('lagoon',{id:'n_lagoon_rise',x:n4aP(1190,80)[0],y:n4aP(1190,80)[1],r:0,near:1300});
  R.tick=(q,dt)=>{ const r=N4A.rise; if(!r) return; r.t+=dt; if(r.t>=3&&!n4aF('n_lagoon')){ G.flags.n_lagoon=1; N4A.rise=null; n4aSave(); n4aBub('n_bub_lagoon','pip',S('Mip mip!','Mip mip!')); n4aBanner(S('The Drowned Mirror rises!','The water rises!'),S('The glass spikes are under the water now.','The spikes are under water!'),2.6); n4aEmit('lagoon',{}); } };
  R.ground=(q,t)=>{ const r=N4A.rise; if(!r) return; const k=clamp(r.t/3,0,1); for(const [a,rr] of [[74,270],[80,240],[86,260],[90,200]]){ const p=n4aP(1190,a); ctx.fillStyle=`rgba(156,184,238,${0.55*k})`; ctx.beginPath(); ctx.ellipse(p[0],p[1],rr*k,rr*k*0.9,0,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(238,242,255,${0.8*k})`; ctx.lineWidth=2.4; ctx.stroke(); } };
}
function n4aLagoonRise(){ if(n4aF('n_lagoon')||N4A.rise) return; N4A.rise={t:0}; n4aSnd('gloomp'); shake(4); n4aEmit('lagoonstart',{}); }
function n4aDrawGlassWall(q,t){
  const A=q.A, B=q.B, n=12;
  ctx.save();
  for(let i=0;i<n;i++){ const s0=i/n, s1=(i+1)/n, x0=lerp(A[0],B[0],s0), y0=lerp(A[1],B[1],s0), x1=lerp(A[0],B[0],s1), y1=lerp(A[1],B[1],s1), h=120+((i*37)%5)*6;
    ctx.fillStyle='rgba(120,110,200,.38)'; ctx.beginPath(); ctx.moveTo(x0,y0-14); ctx.lineTo(x1,y1-14); ctx.lineTo(x1,y1-h); ctx.lineTo(x0,y0-h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(220,214,255,.7)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x0,y0-h); ctx.lineTo(x1,y1-h); ctx.stroke();
    ctx.strokeStyle='rgba(240,236,255,.35)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(lerp(x0,x1,0.3),lerp(y0,y1,0.3)-h+14); ctx.lineTo(lerp(x0,x1,0.15),lerp(y0,y1,0.15)-30); ctx.stroke(); }
  // the dark gap under the waterline: only a diver goes through
  ctx.strokeStyle='rgba(8,6,24,.85)'; ctx.lineWidth=12; ctx.beginPath(); ctx.moveTo(A[0],A[1]-6); ctx.lineTo(B[0],B[1]-6); ctx.stroke();
  ctx.strokeStyle=N4AOC; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(A[0],A[1]-14); ctx.lineTo(B[0],B[1]-14); ctx.stroke();
  ctx.restore();
  if(n4aDiving()) n4aGlow((A[0]+B[0])/2,(A[1]+B[1])/2,200,'150,190,255',0.15);
}
// 4B the Glass Dunes: a lightning storm over the open sand (Burrow and it cannot find you); a moonstone's beam, three
// mirrors (a hit turns one 45 degrees: M1 any blade, M2 inside a glass pit you burrow into, M3 so tall only a thrown
// Glaive reaches it) and the Moon Lock that opens when the beam touches it
const N4A_MIR=[{id:'m1',x:5620,y:84700,start:3,src:'any'},{id:'m2',x:5300,y:84380,start:3,src:'pit'},{id:'m3',x:4988,y:84068,start:2,src:'glaive'}];
const n4aMirFace=m=>{ const v=G.found['n_mir_'+m.id]; return v==null?m.start:(v|0)%8; };
function n4aBuildDunes(){
  // the storm
  const ST=n4aAdd('dunestorm',{id:'n_storm_dunes',x:n4aP(1190,126)[0],y:n4aP(1190,126)[1],r:0,near:1600,t:0,strikes:[]});
  ST.reset=q=>{ q.t=0; q.strikes=[]; };
  ST.tick=(q,dt)=>{ const p=player, inZ=n4aSec(p.x,p.y,860,1520,93,158)&&n4aLvl()===7;
    q.t+=dt; const per=n4aByDiff(2.2,1.5,1.1), tele=n4aByDiff(1.4,1.0,0.8);
    if(inZ&&q.t>per){ q.t=0; let x=p.x+rand(-170,170), y=p.y+rand(-110,110); if(Math.random()<0.4){ x=p.x+(p.avx||0)*tele*0.5; y=p.y+(p.avy||0)*tele*0.5; } if(n4aSec(x,y,860,1520,92,159)){ q.strikes.push({x,y,r:60,t:-tele,tele}); n4aSnd('warn',0.6); } }
    for(const s of q.strikes){ s.t+=dt; if(s.t>=0&&!s.hit){ s.hit=true; n4aSnd('zap',0.7); flashA=Math.max(flashA,0.12); flashCol='180,130,255';
      if(dist(p.x,p.y,s.x,s.y)<s.r+8&&!n4aBurrowed()) hurtPlayer(p.maxHp*n4aByDiff(0.06,0.09,0.12)/Math.max(0.01,(G.diff?G.diff.dmg:1)),s.x,s.y,0);
      for(let i=0;i<12;i++) emit(s.x+rand(-30,30),s.y+rand(-16,16),1,{col:'200,160,255',ang:-Math.PI/2,spread:1,smin:40,smax:180,lmin:.2,lmax:.5,zmin:1.5,zmax:3}); } }
    q.strikes=q.strikes.filter(s=>s.t<0.35);
    if(inZ&&n4aHas('burrow')) n4aTip('dunes',S('Lightning on the dunes','Lightning!'),S('Violet lightning hunts anyone on the open sand. Burrow, and it cannot find you.','Burrow in the sand! The lightning cannot find you.'),6); };
  ST.over=(q,t)=>{ for(const s of q.strikes) n4aDrawStrike(s,t); };
  // the beam's moonstone (Moonfire lights it for good)
  const BS=(typeof N4G!=='undefined'&&N4G.moonstone)?n4aP(1190,95):[5685,85096];
  N4A.beamStone=null;
  if(typeof p4Add==='function'){ try{ N4A.beamStone=p4Add('moonstone',{id:'n_beam_stone',x:BS[0],y:BS[1],keep:true}); }catch(e){ console.error('n4a beam stone',e); } }
  // the mirrors
  N4A.mirrors=N4A_MIR.map(m=>{ const o=n4aAdd('mirror',Object.assign({},m,{id:'n_mirror_'+m.id,mid:m.id,r:14,hr:24,hz:m.src==='glaive'?70:30,turnA:0}));
    addCol({t:'c',x:m.x,y:m.y,r:10});
    o.reset=q=>{ q.turnA=n4aMirFace(m)*45; };
    o.tick=(q,dt)=>{ q.turnA=n4aAngLerp(q.turnA,n4aMirFace(m)*45,Math.min(1,dt*8)); };
    o.hit=(q,src)=>{ if(src==='fire'||src==='arrow'||src==='bomb') return false; if(n4aF('n_beam')) return true;
      if(m.src==='glaive'&&src!=='glaive'){ n4aSay(q.x,q.y-90,S('Way up on a tall stand. Throw something that comes back!','Too high! Throw the Glaive!'),'#e0e8ff','m3how',2); return true; }
      if(m.src==='pit'&&dist(player.x,player.y,q.x,q.y)>95){ return true; }
      if(G.time-(q.cd||-9)<0.3) return true; q.cd=G.time; G.found['n_mir_'+m.id]=(n4aMirFace(m)+1)%8; n4aSnd('clank'); n4aSnd('crystal',0.4); n4aSave(); return true; };
    o.stand=(q,t)=>n4aDrawMirror(q,t); o.sy=q=>q.y+4;
    n4aPrompt(o,m.x,m.y,30,()=>S('Look at the mirror','Look at the mirror'),q=>n4aSay(q.x,q.y-90,m.src==='glaive'?S('A mirror on a tall stand. Hit it to turn it. Only a thrown Glaive reaches up there.','Throw the Glaive to turn it.'):S('A mirror on a stand. Hit it to turn it an eighth of the way round.','Hit it to turn it.'),'#e0e8ff','mirhow'+m.id,2));
    return o; });
  // the beam itself (traced every frame while the stone is lit) and the Moon Lock
  const LK=(typeof N4G!=='undefined')?n4aP(1190,162):[4868,84068];
  const lock=n4aGate('n_moonlock',{a:162,r0:1112,r1:1268,th:20,shut:()=>!n4aF('n_beam'),r:90,eye:0});
  lock.cx=LK[0]; lock.cy=LK[1];
  lock.reset=q=>{ q.eye=n4aF('n_beam')?1:0; };
  lock.tick=(q,dt)=>{ q.eye=lerp(q.eye,n4aF('n_beam')?1:0,Math.min(1,dt*2)); };
  lock.stand=(q,t)=>n4aDrawMoonLock(q,t); lock.sy=q=>q.cy+20;
  n4aPrompt(lock,LK[0]+60,LK[1]+10,50,()=>n4aF('n_beam')?null:S('Look at the Moon Lock','Look at the Moon Lock'),q=>n4aSay(q.cx,q.cy-110,S('A round glass door, shut like a sleeping eye. It wants moonlight on it.','It wants moonlight!'),'#e0e8ff','lockhow',2));
  const BM=n4aAdd('beam',{id:'n_beam',x:BS[0],y:BS[1],r:0,near:1600,path:[],endHit:null,fsT:0});
  BM.tick=(q,dt)=>{ const S0=N4A.beamStone, on=!!S0&&(S0.keepOn||S0.lit>0); q.path=on?n4aBeamTrace(BS,LK):[]; q.on=on;
    for(const s of q.path) if(typeof p4MoonShine==='function') p4MoonShine(s[0],s[1],s[2],s[3],22);
    const last=q.path[q.path.length-1]; if(on&&last&&last[4]==='lock'&&!n4aF('n_beam')){ G.flags.n_beam=1; n4aSnd('eye'); n4aSnd('door',0.6); shake(5); n4aBanner(S('The Moon Lock opens like an eye','The Moon Lock opens!'),'',2.6); n4aEmit('beam',{}); n4aSave(); }
    if(on&&last&&last[4]==='end'){ q.fsT-=dt; if(q.fsT<=0&&dist(player.x,player.y,last[2],last[3])<500){ q.fsT=1.6; n4aSnd('fsst',0.6); } } };
  BM.over=(q,t)=>n4aDrawBeam(q,t);
}
// the beam: from the stone toward M1, then each mirror sends it along its facing; it ends at the lock, a mirror it
// cannot leave, or the edge of the ring (a sad "fsst")
function n4aBeamTrace(BS,LK){
  const out=[], M=N4A_MIR; let x=BS[0], y=BS[1]-22, a=Math.atan2(M[0].y-30-y,M[0].x-x), from=null;
  for(let k=0;k<6;k++){
    const ux=Math.cos(a), uy=Math.sin(a); let best=null, bt=1000;
    for(const m of M){ if(m===from) continue; const dx=m.x-x, dy=(m.y-30)-y, t=dx*ux+dy*uy; if(t<12||t>=bt) continue; if(Math.abs(-dx*uy+dy*ux)<26){ best=m; bt=t; } }
    { const dx=LK[0]-x, dy=(LK[1]-30)-y, t=dx*ux+dy*uy; if(t>12&&t<bt&&Math.abs(-dx*uy+dy*ux)<52){ best='lock'; bt=t; } }
    // the edge of the ring (the beam leaves the Crown's floor)
    let tEnd=bt; for(let s=20;s<bt;s+=16){ const px=x+ux*s, py=y+uy*s+30, r=n4aR(px,py); if(r<880||r>1530){ tEnd=s; best=null; break; } }
    const ex=x+ux*tEnd, ey=y+uy*tEnd;
    out.push([x,y,ex,ey,best==='lock'?'lock':best?'mirror':'end']);
    if(!best||best==='lock') break;
    from=best; x=best.x; y=best.y-30; a=n4aMirFace(best)*45*N4AD;
  }
  return out;
}
function n4aDrawBeam(q,t){
  if(!q.on||!q.path.length) return;
  ctx.save(); ctx.lineCap='round'; ctx.globalCompositeOperation='lighter';
  for(const s of q.path){ const f=0.85+0.15*Math.sin(t*9+s[0]*0.01);
    ctx.strokeStyle=`rgba(150,170,255,${0.28*f})`; ctx.lineWidth=22; ctx.beginPath(); ctx.moveTo(s[0],s[1]); ctx.lineTo(s[2],s[3]); ctx.stroke();
    ctx.strokeStyle=`rgba(225,232,255,${0.8*f})`; ctx.lineWidth=5; ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=1.6; ctx.stroke(); }
  ctx.restore();
  const last=q.path[q.path.length-1]; if(last[4]==='end'){ n4aGlow(last[2],last[3],30,'200,210,255',0.6); if(Math.random()<0.4) emit(last[2],last[3],1,{col:'220,226,255',ang:rand(0,TAU),spread:0.5,smin:20,smax:80,lmin:.2,lmax:.4,zmin:1.2,zmax:2.2}); }
}
function n4aDrawMirror(q,t){
  const tall=q.src==='glaive', h=tall?70:30;
  n4aPut(n4aSpr('mirped'+(tall?1:0),34,h+20,17,h+14,g=>{ n4aShade(g,12,4,2); n4aBox(g,-5,-h,10,h+1,N4APAL.stone); g.fillStyle=N4APAL.stone[0]; g.fillRect(-11,-3,22,4); g.fillRect(-9,-h-4,18,5); }),q.x,q.y);
  // the mirror disc turns: drawn as an ellipse whose bright face points along its facing (an arrow on the ground shows it)
  const a=q.turnA*N4AD, cx=q.x, cy=q.y-h-14, fx=Math.cos(a), fy=Math.sin(a);
  ctx.save(); ctx.translate(cx,cy);
  ctx.fillStyle=N4AOC; ctx.beginPath(); ctx.ellipse(0,0,15,17,0,0,TAU); ctx.fill();
  ctx.fillStyle='#b8c0f0'; ctx.beginPath(); ctx.ellipse(fx*3,fy*2,12,14,0,0,TAU); ctx.fill();
  ctx.fillStyle='#f4f6ff'; ctx.beginPath(); ctx.ellipse(fx*5-2,fy*3-3,5,7,0.3,0,TAU); ctx.fill();
  ctx.restore();
  // the pointer on the ground: where the beam goes from here
  ctx.save(); ctx.strokeStyle=`rgba(225,232,255,${0.55+0.2*Math.sin(t*3)})`; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(q.x+fx*14,q.y+fy*8); ctx.lineTo(q.x+fx*40,q.y+fy*22); ctx.lineTo(q.x+fx*30-fy*8,q.y+fy*16+fx*6); ctx.moveTo(q.x+fx*40,q.y+fy*22); ctx.lineTo(q.x+fx*30+fy*8,q.y+fy*16-fx*6); ctx.stroke(); ctx.restore();
  n4aGlow(cx,cy,24,'210,220,255',0.3);
}
function n4aDrawMoonLock(q,t){
  const k=q.eye, x=q.cx, y=q.cy;
  if(k>0.97){ n4aGlow(x,y-50,40,'210,220,255',0.25); return; }
  ctx.save(); ctx.translate(x,y-56);
  ctx.fillStyle='rgba(6,3,12,.4)'; ctx.beginPath(); ctx.ellipse(4,60,70,14,0,0,TAU); ctx.fill();
  ctx.fillStyle='#3c3680'; ctx.beginPath(); ctx.ellipse(0,0,72,66,0,0,TAU); ctx.fill(); ctx.fillStyle='#8a86d8'; ctx.beginPath(); ctx.ellipse(-4,-4,62,56,0,0,TAU); ctx.fill();
  ctx.fillStyle='#c8ccff'; ctx.beginPath(); ctx.ellipse(-18,-20,26,18,-0.5,0,TAU); ctx.fill();
  // the eye: a lid that opens when the beam touches it
  const o=k*36; ctx.fillStyle='#1a1440'; ctx.beginPath(); ctx.ellipse(0,4,40,Math.max(3,o),0,0,TAU); ctx.fill();
  if(o>6){ ctx.fillStyle='#f0f2ff'; ctx.beginPath(); ctx.arc(0,4,Math.min(16,o*0.45),0,TAU); ctx.fill(); }
  ctx.strokeStyle=N4AOC; ctx.lineWidth=3.4; ctx.beginPath(); ctx.ellipse(0,0,72,66,0,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0,4,40,Math.max(3,o),0,0,TAU); ctx.stroke();
  ctx.restore(); ctx.globalAlpha=1;
  n4aGlow(x,y-56,90,'170,170,255',0.18+0.06*Math.sin(t*2));
}
// 4C the Tendril Wood: five bands of shadow tendrils across the ring (p4 tendrils: Moonfire burns them for good, fire
// makes them flinch 4 s); each band has one gap, and the winding way between the gaps is marked by moth glyphs that only
// show in moonlight (or in Pip's glow). Moth Memory 5 on the way.
const N4A_WOOD=[{a:178,gap:[10,11]},{a:192,gap:[1,2]},{a:206,gap:[6,7]},{a:220,gap:[11,12]},{a:234,gap:[2,3]}];
function n4aBuildWood(){
  let n=0, g=0; const gapC=[];
  N4A_WOOD.forEach((B,bi)=>{ const gc=(B.gap[0]+B.gap[1])/2;
    for(let i=0;i<13;i++){ const r=905+48*i; if(B.gap.includes(i)) continue; const p=n4aP(r,B.a+((i*7)%3-1)*0.35);
      if(typeof p4Add==='function') try{ p4Add('tendril',{id:'n_td_'+n,x:p[0],y:p[1],r:28}); }catch(e){ console.error('n4a tendril',e); } n++; }
    gapC.push(n4aP(905+48*gc,B.a)); });
  // the glyph path: from the entry, through each gap, to the exit
  const way=[n4aP(1190,172)].concat(gapC,[n4aP(1190,243)]);
  for(let i=0;i<way.length-1;i++){ const a=way[i], b=way[i+1], L=dist(a[0],a[1],b[0],b[1]), m=Math.max(1,Math.floor(L/90));
    for(let k=1;k<=m;k++){ const s=k/(m+1); if(typeof p4Add==='function') try{ p4Add('glyph',{id:'n_gl_'+g,x:lerp(a[0],b[0],s),y:lerp(a[1],b[1],s),r:16}); }catch(e){} g++; } }
  N4A.woodN=n;
  n4aPane(5,n4aP(1255,226)[0],n4aP(1255,226)[1]);
  n4aAmbush('wood_moths',{x:n4aP(1190,206)[0],y:n4aP(1190,206)[1],r:420,n:4,types:['n_mothling'],level:23,spread:[60,200]});
  const W=n4aAdd('woodend',{id:'n_wood_end',x:n4aP(1190,247)[0],y:n4aP(1190,247)[1],r:0,near:900});
  W.tick=()=>{ if(n4aF('n_wood')||n4aAir()) return; if(n4aLvl()===7&&n4aSec(player.x,player.y,880,1500,243.5,251)){ G.flags.n_wood=1; n4aSnd('chime',0.6); n4aEmit('wood',{}); n4aSave(); } };
  const E=n4aAdd('woodin',{id:'n_wood_in',x:n4aP(1190,172)[0],y:n4aP(1190,172)[1],r:0,near:700});
  E.tick=()=>{ if(n4aNear(E.x,E.y,260)&&n4aHas('moonfire')) n4aTip('wood',S('The Tendril Wood','The Tendril Wood'),S('Fire makes tendrils flinch for a moment. Moonfire burns them away for good, and shows the moth glyphs that mark the safe way.','Moonfire burns the vines. It shows the safe path too.'),7); };
}
// the Moth's Cradle (optional arc): big cocoons hatch mothlings, a sleeping shadow moth on her nest (do not breathe fire
// near her), Moth Memory 6 inside a ring of glass spikes (burrow under), a Heart Ember
function n4aBuildCradle(){
  const NE=(typeof N4G!=='undefined'&&N4G.nest)||n4aP(1190,328), P6=(typeof N4G!=='undefined'&&N4G.pane6)||[4093,86318];
  [n4aP(1290,313),n4aP(1060,334),n4aP(1330,352)].forEach((p,i)=>{
    const c=n4aAdd('cocoon',{id:'n_cocoon'+i,x:p[0],y:p[1],r:18,ph:i});
    c.stand=(q,t)=>{ const A=N4A.amb.find(a=>a.id==='cocoon'+i), hatched=A&&(A.live||G.found['n_amb_'+A.id]&&G.worldTime-G.found['n_amb_'+A.id]<300);
      n4aPut(n4aSpr('bigcoc'+(hatched?1:0),50,100,25,94,g=>n4aCocoonArt(g,hatched)),q.x,q.y+Math.sin(t*1.2+q.ph)*2); if(!hatched) n4aGlow(q.x,q.y-50,30,'190,170,240',0.18+0.08*Math.sin(t*2+q.ph)); };
    c.sy=q=>q.y+2; addCol({t:'c',x:p[0],y:p[1],r:10,low:true});
    n4aAmbush('cocoon'+i,{x:p[0],y:p[1],r:120,n:3,types:['n_mothling'],level:23,spread:[10,50],respawn:300});
  });
  const M=n4aAdd('sleepmoth',{id:'n_cradle_moth',x:NE[0],y:NE[1],r:40,awake:false,near:1400});
  M.reset=q=>{ q.awake=false; };
  M.fireTest=(q,mx,my)=>dist(player.x,player.y,q.x,q.y)<200;
  M.fire=q=>{ if(q.awake||n4aFound('n_amb_cradle_moth')) return; q.awake=true; n4aSnd('whoosh'); shake(4); n4aSay(q.x,q.y-90,S('The great moth wakes up!','She wakes up!'),'#e8dcff','mothwake',3); n4aEmit('mothwake',{}); };
  M.stand=(q,t)=>{ if(q.awake||n4aFound('n_amb_cradle_moth')) return; n4aDrawSleepMoth(q,t); };
  M.sy=q=>q.y;
  M.tick=q=>{ if(!q.awake&&!n4aFound('n_amb_cradle_moth')&&n4aNear(q.x,q.y,260)) n4aSay(q.x,q.y-110,S('Zzz... A moth the size of a pony is asleep on the nest. Tiptoe. And maybe no fire.','Shh! She is asleep. No fire!'),'#e8dcff','mothzz',12); };
  n4aAmbush('cradle_moth',{x:NE[0],y:NE[1],r:600,n:1,types:['n_mothling'],level:23,opt:{elite:true,hpScale:3},spread:[0,10],when:()=>M.awake});
  n4aPane(6,P6[0],P6[1]+6);
  n4aHeart('n_he4',3735,86112);
}
function n4aCocoonArt(g,hatched){
  g.fillStyle='rgba(6,3,12,.35)'; g.beginPath(); g.ellipse(2,1,12,4,0,0,TAU); g.fill();
  g.strokeStyle=N4APAL.glass[0]; g.lineWidth=4; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(-6,-40,6,-88); g.stroke(); g.strokeStyle=N4APAL.glass[2]; g.lineWidth=1.6; g.beginPath(); g.moveTo(-1,-2); g.quadraticCurveTo(-7,-40,5,-86); g.stroke();
  const cx=6, cy=-62; g.fillStyle=hatched?'#4a4266':'#8a80aa'; g.beginPath(); g.ellipse(cx,cy,13,24,0.1,0,TAU); g.fill();
  if(hatched){ g.fillStyle='#120c1c'; g.beginPath(); g.ellipse(cx,cy+6,8,14,0.1,0,TAU); g.fill(); }
  else{ g.fillStyle='#c4bce0'; g.beginPath(); g.ellipse(cx-4,cy-6,6,13,0.1,0,TAU); g.fill(); g.strokeStyle='rgba(70,60,100,.6)'; g.lineWidth=1.2; for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(cx-12,cy-14+i*9); g.quadraticCurveTo(cx,cy-10+i*9,cx+12,cy-15+i*9); g.stroke(); } }
}
function n4aDrawSleepMoth(q,t){
  const b=Math.sin(t*1.3)*0.06+1, x=q.x, y=q.y;
  ctx.save(); ctx.translate(x,y-20); ctx.scale(b,1/b);
  ctx.fillStyle='rgba(6,3,12,.4)'; ctx.beginPath(); ctx.ellipse(4,26,74,18,0,0,TAU); ctx.fill();
  for(const sd of [-1,1]){ ctx.fillStyle='#2a2244'; ctx.beginPath(); ctx.moveTo(0,-4); ctx.bezierCurveTo(sd*30,-46,sd*86,-34,sd*74,6); ctx.bezierCurveTo(sd*62,26,sd*20,20,0,10); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#4a3e70'; ctx.beginPath(); ctx.moveTo(0,-2); ctx.bezierCurveTo(sd*24,-34,sd*62,-26,sd*56,2); ctx.bezierCurveTo(sd*44,16,sd*18,12,0,6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(190,170,255,.5)'; ctx.beginPath(); ctx.arc(sd*44,-12,8,0,TAU); ctx.fill(); }
  ctx.fillStyle='#1a1430'; ctx.beginPath(); ctx.ellipse(0,0,12,26,0,0,TAU); ctx.fill();
  ctx.strokeStyle='#e8e0ff'; ctx.lineWidth=1.6; for(const sd of [-1,1]){ ctx.beginPath(); ctx.arc(sd*5,-18,3,0.2*Math.PI,0.8*Math.PI); ctx.stroke(); }
  ctx.restore();
  if(Math.random()<0.02) ftext(x+20,y-70,'z','#d8d0ff',12);
}
// ================= the Crown and the Moon Road (stage n_crown): one power per act, then the Ember Heart opens the Moon Door
// I1 (a step: Double Jump), I2 (Grapple Tail to its post), I3 (Wind Riding on a looping stream), the moon-glass strip to
// the door (Moonfire: solid 12 s, Easy 20, Hard 8; solid for good once crossed). Each step lights a lantern on the road.
function n4aRoad(){ return (typeof N4G!=='undefined'&&N4G.road)||{I1:n4aP(830,300),r1:66,I2:n4aP(808,320),r2:60,I3:n4aP(808,340),r3:60,strip:[n4aP(808,341),n4aP(812,348),n4aP(806,354.5),n4aP(780,359.2),n4aP(740,0.2),n4aP(706,0)],w:56,door:[4500,85920]}; }
const N4A_ROADCOL=['255,150,80','190,140,255','150,210,255','230,236,255'];
function n4aBuildRoad(){
  const R=n4aRoad(), DOOR=n4aP(728,0), END=n4aP(792,359.3);
  if(typeof WIND!=='undefined') WIND.stream({id:'n_wind_road',pts:[n4aP(800,321.2),n4aP(930,325),n4aP(1000,330.5),n4aP(960,336.5),n4aP(870,339.2),n4aP(812,339.6)],w:76,lv:[8,8]});
  n4aSwirl('n_road_swirl',n4aP(800,321.2),()=>true);
  let glass=null; if(typeof p4Add==='function'){ try{ glass=p4Add('moonglass',{id:'n_road_glass',pts:R.strip,w:R.w}); }catch(e){ console.error('n4a glass',e); } }
  N4A.roadGlass=glass;
  const RD=n4aAdd('road',{id:'n_road',x:R.I2[0],y:R.I2[1],r:0,near:1600});
  RD.reset=q=>{ N4A.glassT=0; if(glass){ glass.keepOn=(G.flags.n_road|0)>=4; } };
  RD.tick=(q,dt)=>{ const p=player, st=G.flags.n_road|0;
    if(!n4aAir()&&n4aLvl()===8){ let k=0; if(dist(p.x,p.y,R.I1[0],R.I1[1])<R.r1+4) k=1; else if(dist(p.x,p.y,R.I2[0],R.I2[1])<R.r2+4) k=2; else if(dist(p.x,p.y,R.I3[0],R.I3[1])<R.r3+4) k=3; else if(dist(p.x,p.y,END[0],END[1])<46) k=4;
      if(k>st){ G.flags.n_road=k; n4aSnd('lamp'); n4aSnd('chime',0.5); emit(p.x,p.y-30,20,{col:N4A_ROADCOL[k-1],ang:-Math.PI/2,spread:1.2,smin:30,smax:140,lmin:.4,lmax:.9,zmin:1.4,zmax:3}); n4aEmit('road',{step:k}); if(k>=4&&glass){ glass.keepOn=true; G.found[glass.id]=1; } n4aSave(); } }
    // the moon-glass: Moonfire lights it for 12 s (Easy 20, Hard 8); once crossed it stays
    if(glass&&st>=4&&!glass.keepOn) glass.keepOn=true;
    if(glass&&!glass.keepOn){ let hit=false; for(let i=0;i<R.strip.length&&!hit;i++){ const a=R.strip[i]; if(n4aMoonAt(a[0],a[1],26)) hit=true; } if(hit){ if(N4A.glassT<=0) n4aSnd('crystal',0.5); N4A.glassT=n4aByDiff(20,12,8); }
      if(N4A.glassT>0){ N4A.glassT-=dt; glass.litT=Math.max(glass.litT||0,0.25); if(N4A.glassT<2.5&&Math.random()<dt*3) emit(R.strip[2][0],R.strip[2][1],1,{col:'214,226,255',smin:10,smax:40,lmin:.3,lmax:.6,zmin:1.2,zmax:2}); } } };
  RD.ground=(q,t)=>{ // the timer ring on the glass, the step marks
    if(glass&&!glass.keepOn&&N4A.glassT>0){ const k=N4A.glassT/n4aByDiff(20,12,8), m=R.strip[3]; n4aArcRing(m[0],m[1],40,k<0.25?'255,170,140':'214,226,255',0.8,k,3); } };
  // the four lanterns
  const spots=[[R.I1[0]-36,R.I1[1]+12],[R.I2[0]+30,R.I2[1]+20],[R.I3[0]+30,R.I3[1]+10],[END[0]+40,END[1]+4]];
  spots.forEach((s,i)=>{ const L=n4aAdd('roadlantern',{id:'n_roadlan'+i,x:s[0],y:s[1],r:10,i}); L.light=n4aLight(s[0],s[1]-50,220);
    L.tick=q=>{ q.light.i=(G.flags.n_road|0)>i?0.8:0; };
    L.stand=(q,t)=>{ const on=(G.flags.n_road|0)>q.i; n4aPut(n4aSpr('rlan'+(on?1:0),34,92,17,86,g=>n4aLanternArt(g,on,false)),q.x,q.y,0.7); if(on){ const f=0.85+0.15*Math.sin(t*7+q.i); n4aGlow(q.x,q.y-44,50,N4A_ROADCOL[q.i],0.6*f); n4aGlow(q.x,q.y-44,14,'255,250,235',0.7*f); } };
    L.sy=q=>q.y+1; });
  // the Moon Door
  const D=n4aGate('n_moondoor',{A:[DOOR[0]-40,DOOR[1]],B:[DOOR[0]+40,DOOR[1]],x:DOOR[0],y:DOOR[1],test:(x,y)=>dist(x,y,DOOR[0],DOOR[1])<48,bb:[DOOR[0]-60,DOOR[1]-60,DOOR[0]+60,DOOR[1]+60],shut:()=>!n4aF('n_door'),r:60,k:0});
  D.reset=q=>{ q.k=n4aF('n_door')?1:0; };
  D.tick=(q,dt)=>{ q.k=lerp(q.k,n4aF('n_door')?1:0,Math.min(1,dt*1.2)); };
  D.stand=(q,t)=>n4aDrawMoonDoor(q,DOOR,t); D.sy=q=>DOOR[1]+10;
  D.light=n4aLight(DOOR[0],DOOR[1]-60,260); D.tick2=D.tick; D.tick=(q,dt)=>{ D.tick2(q,dt); q.light.i=0.5+0.5*q.k; };
  n4aPrompt(D,END[0],END[1],36,()=>n4aF('n_door')?null:S('Hold up the Ember Heart','Hold up the Heart'),()=>n4aOpenDoor());
}
function n4aOpenDoor(){
  if(n4aF('n_door')) return;
  n4aScene('n_moondoor',[['narr',S("At the end of the Moon Road stands a round door of pale glass. There's no handle. Just a hollow in the middle, the size of a plum.",'A round glass door. It has a hole the size of a plum.')],
    ['ash',S('The Heart. The door wants the Heart.','The door wants the Heart.')],['pip',S('Mip?!','Mip?!')],
    ['ash',S("I know. She WANTS me to bring it. That's the scary part.",'I know. She wants the Heart. That is scary.')],['ash',S('But Mom made it whole. Not her. Mom.','But Mom fixed it. Not her.')],
    ['narr',S('You hold up the Ember Heart. Its three seams glow, dusk-violet, ice-blue and moon-silver, around a core of warm orange. The door sighs open.','You hold up the Heart. It glows. The door opens.')]],
    ()=>{ G.flags.n_door=1; n4aSnd('door'); shake(6); flashA=Math.max(flashA,0.5); flashCol='255,220,170'; n4aEmit('door',{}); n4aSave(); });
}
function n4aDrawMoonDoor(q,P,t){
  const k=q.k, x=P[0], y=P[1];
  n4aGlow(x,y-60,110,'230,220,255',0.2+0.2*k);
  if(k>0.97) return;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(6,3,12,.45)'; ctx.beginPath(); ctx.ellipse(4,4,66,16,0,0,TAU); ctx.fill();
  // two halves of a pale glass disc that slide apart as it opens
  for(const sd of [-1,1]){ const dx=sd*k*60; ctx.save(); ctx.globalAlpha*=1-k*0.7; ctx.beginPath(); ctx.rect(sd<0?-80+dx:dx,-140,80,150); ctx.clip();
    ctx.fillStyle='#8c80cc'; ctx.beginPath(); ctx.ellipse(dx,-62,62,64,0,0,TAU); ctx.fill(); ctx.fillStyle='#d8d0ff'; ctx.beginPath(); ctx.ellipse(dx-5,-66,52,54,0,0,TAU); ctx.fill(); ctx.fillStyle='#f4f0ff'; ctx.beginPath(); ctx.ellipse(dx-20,-86,18,12,-0.5,0,TAU); ctx.fill();
    ctx.strokeStyle=N4AOC; ctx.lineWidth=3.4; ctx.beginPath(); ctx.ellipse(dx,-62,62,64,0,0,TAU); ctx.stroke(); ctx.restore(); }
  if(k<0.1){ ctx.fillStyle='#2a2050'; ctx.beginPath(); ctx.arc(0,-62,12,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(255,210,150,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,-62,12+2*Math.sin(t*3),0,TAU); ctx.stroke(); }
  ctx.restore();
}

// ================= building it all into map 4 (after x4_world's own build), the frame hooks, drawing
function n4aBuild(B){
  if(N4A.built) return; N4A.built=true;
  const step=(name,fn)=>{ try{ fn(); }catch(e){ console.error('n4a build '+name,e); } };
  // the Bridgefoot and Tier I
  step('lanterns',n4aBuildLanterns); step('sluice',n4aBuildSluice);
  step('crack1',()=>n4aCrackWall('t1',n4aP(3366,66),n4aP(4034,66),{th:22}));
  step('falls',n4aBuildFalls); step('terraces',n4aBuildTerraces); step('trials',n4aBuildTrials);
  step('echo1',()=>{ n4aEchoStand(1,()=>(G.flags.n_flames|0)>=3); n4aEchoGate(1,188.5,3235,4165); });
  step('silent',n4aBuildSilent);
  // Tier II
  step('clock',n4aBuildClock); step('gallery',n4aBuildGallery); step('gears',n4aBuildGears);
  step('echo2',()=>{ n4aEchoStand(2,()=>n4aF('n_gear')); n4aEchoGate(2,55,2335,3365); });
  step('clockmaker',n4aBuildClockmaker);
  // Tier III
  step('rimeA',n4aBuildRimeA); step('dam',n4aBuildDam); step('aurora',n4aBuildAurora);
  step('echo3',()=>{ n4aEchoStand(3,()=>n4aF('n_aurora')); n4aEchoGate(3,329.5,1445,2455); });
  step('rimeB',n4aBuildRimeB);
  // Tier IV and the Crown
  step('mothdoor',n4aBuildMothDoor); step('lagoon',n4aBuildLagoon); step('dunes',n4aBuildDunes); step('wood',n4aBuildWood);
  step('echo4',()=>{ n4aEchoStand(4,()=>n4aF('n_wood')); n4aEchoGate(4,281,862,1518); });
  step('cradle',n4aBuildCradle); step('road',n4aBuildRoad);
}
if(MAPS[4]&&!MAPS[4].placeholder){ const M=MAPS[4], base=M.build; M.build=function(B){ if(base) base.call(this,B); n4aBuild(B); }; }
else console.warn('x4_ascent: map 4 is not built (x4_world missing?)');

// ---------- every frame: the live state is rebuilt when G changes; objects near Ash tick; the stretch fights
function n4aTick(dt){
  if(N4A.g!==G) n4aReset();
  if(!n4aOn4()) return;
  N4A.t+=dt; const p=player;
  for(const o of N4A.objs){ if(!o.tick) continue; if(o.near<9999&&dist2(p.x,p.y,o.x,o.y)>o.near*o.near) continue; try{ o.tick(o,dt); }catch(e){ if(!o.err){ o.err=1; console.error('n4a tick',o.id,e); } } }
  n4aAmbTick(dt);
}
{ const base=update; update=function(dt){ const r=base(dt); try{ if(G&&scene==='play'&&G.mode!=='menu') n4aTick(dt); }catch(e){ console.error('n4a',e); } return r; }; }
// Moonfire and the Blaze jet on our pieces (objects with moon() handlers)
function n4aDraw(layer,t){
  for(const o of N4A.objs){ const f=o[layer]; if(!f) continue; if(!inView(o.x,o.y,(o.r||40)+(o.vr||420))) continue; try{ f(o,t); }catch(e){ if(!o.errD){ o.errD=1; console.error('n4a draw',layer,o.id,e); } } }
}
{ const base=drawHazards; drawHazards=function(){ base(); try{ if(n4aOn4()) n4aDraw('ground',G.time); }catch(e){ console.error(e); } }; }
{ const base=eventsForRender; eventsForRender=function(list){ base(list); if(!n4aOn4()) return; const t=G.time;
    try{ for(const o of N4A.objs){ if(!o.stand) continue; if(!inView(o.x,o.y,(o.r||40)+160)) continue; const y=o.sy?o.sy(o):o.y; list.push({x:o.x,y,r:8,flying:true,draw:()=>{ try{ o.stand(o,t); }catch(e){ if(!o.errS){ o.errS=1; console.error('n4a stand',o.id,e); } } }}); } }catch(e){ console.error(e); } }; }
{ const base=drawMarkers; drawMarkers=function(t){ try{ if(n4aOn4()) n4aDraw('over',G.time); }catch(e){ console.error(e); } return base(t); }; }

// ================= debug (window.__ebX.n4a, also __eb.n4a)
const N4A_SPOT={
  lanterns:[4500,89700],lan_green:[4250,89660],lan_pond:[5100,89740],lan_high:[3700,89660],stairs:[4500,89430],
  sluice:[4925,88960],sluice_mid:n4aP(3700,30),sluice_top:n4aP(3860,50.5),crystal_bank:n4aP(3960,51.6),landing:n4aP(3760,62),
  crack:n4aP(3700,64.4),crack_far:n4aP(3700,68),falls:n4aP(3700,71),falls_far:n4aP(3700,89),launch:[8398,85030],shelf:n4aP(3700,104),
  leap:n4aP(3480,116),leap_in:n4aP(3800,117),leap_end:n4aP(3900,125.9),tide:n4aP(3450,139),tide_bank:n4aP(3560,139),sky:n4aP(3420,160),sky_isle:[5765,81640],
  echogate:n4aP(3900,170),echo1:[4500,81560],echo1_exit:n4aP(3700,190),chimney:n4aP(3520,200),chimney_top:n4aP(3150,204),
  silent:n4aP(3700,240),raid:[900,84420],yara:[760,84700],ashhouse:[1123,87230],
  sh_clock:[3296,82910],clock6:[2486,83540],tower:[2165,83185],tower_top:[2165,83070],alcove_out:[2480,83680],alcove:[2440,83800],clock9:[2120,83880],
  gallery:n4aP(2850,259),gallery_in:n4aP(2850,263.6),gallery_far:n4aP(2850,309),climb:n4aP(2850,326),climb_top:n4aP(2850,338),
  gear:n4aP(2850,2.5),plate:[4600,88250],shelf1:n4aP(2600,0.5),gear_end:n4aP(2850,17.2),gear_far:n4aP(2850,24),echo2:[6515,87215],echo2_exit:n4aP(2850,58),
  u2:n4aP(2850,92),clockmaker:n4aP(2850,147),cage:n4aP(2650,177),
  sh_rime:[6443,84363],icewall:n4aP(1950,122),icewall_far:n4aP(1950,129),floe:n4aP(2000,132.6),floe_far:n4aP(2000,154),
  dam:n4aP(2100,176),dam_A:[4486,83062],dam_B:[4690,83170],dam_far:n4aP(1950,204),aurora:n4aP(1950,225.5),pillar1:n4aP(1950,248),pillar2:n4aP(1950,268),aurora_far:n4aP(1950,292),
  echo3:[3121,86579],echo3_exit:n4aP(1950,333),gust:n4aP(1950,18.5),gust_land:n4aP(1300,22),choir:n4aP(1950,66),emberlid:[6600,85350],
  sh_glass:[5043,86329],lagoon:n4aP(1190,40),lagoon_far:n4aP(1190,70),moonstone:n4aP(1390,80),lagoon_exit:n4aP(1190,96),dunes:n4aP(1190,110),
  m1:[5650,84740],m2:[5300,84400],m3:[5040,84110],lock:n4aP(1190,158),wood:n4aP(1190,172),wood_mid:n4aP(1190,213),wood_end:n4aP(1190,247),
  echo4:[3315,85096],echo4_exit:n4aP(1190,285),sh_crown:[3371,85925],cradle:n4aP(1190,318),mothdoor:n4aP(1190,8),
  road:n4aP(950,300),I1:n4aP(830,300),I2:n4aP(808,320),I3:n4aP(808,340),road_end:n4aP(792,359.3),summit:[4500,85300]};
// the flags each stretch sets (solve sets them all up to and including that stretch: a quick way to a later part)
const N4A_ORDER=[['gate',{n_gate:1,n_lanterns:3}],['sluice',{n_bridge1:1,n_sluice:1}],['crack1',null,['n_crack_t1']],['terrace',{n_terrace:1}],
  ['flames',{n_flames:3},['n_flame_leap','n_flame_tide','n_flame_sky','n_eye_tide','n_roots_leap']],['echo1',{n_echo1_done:1}],['chimney',{n_chimney:1}],
  ['clock',{n_clockset:1},null,{n_clk_l:6,n_clk_s:9}],['gallery',{n_gallery:1}],['gear',{n_gear:1},['n_gw0','n_gw1','n_gw2']],['echo2',{n_echo2_done:1}],['longclimb',{n_longclimb:1}],
  ['ice',null,['n_ice_t3a']],['floe',{n_floe:1}],['dam',{n_dam:1}],['sail',{n_sail:1}],['aurora',{n_aurora:1}],['echo3',{n_echo3_done:1}],['gust',{n_gust:1}],
  ['lagoon',{n_lagoon:1}],['beam',{n_beam:1}],['wood',{n_wood:1}],['echo4',{n_echo4_done:1}],['road',{n_road:4}],['door',{n_door:1}]];
function n4aSolve(id,only){
  const i=N4A_ORDER.findIndex(s=>s[0]===id); if(i<0) return null;
  for(let k=only?i:0;k<=i;k++){ const [,f,fd,vals]=N4A_ORDER[k]; if(f) Object.assign(G.flags,f); if(fd) for(const q of fd) G.found[q]=1; if(vals) Object.assign(G.found,vals); }
  if(G.flags.n_gate) for(const L of N4A.lans||[]) L.lit=1e9;
  N4A.g=null; try{ if(typeof n4wRefresh==='function'&&window.__ebX.n4w) window.__ebX.n4w.sync(); }catch(e){}
  return Object.keys(G.flags).filter(k=>/^n_/.test(k)).length;
}
function n4aLinks(){ // the wind streams as [x0,y0,x1,y1] links for x4_world's reachability flood (only the ones blowing)
  const out=[]; if(typeof WIND==='undefined') return out;
  for(const s of WIND.list()){ if(!/^n_wind_/.test(s.id)) continue; if(s.on&&!s.on(s)) continue; const a=s.pts[0], b=s.pts[s.pts.length-1]; out.push([a[0],a[1],b[0],b[1],60,s.id]); }
  return out;
}
const N4A_DBG={N4A,spots:N4A_SPOT,order:N4A_ORDER.map(s=>s[0]),
  go(name,dy){ const s=typeof name==='string'?N4A_SPOT[name]:name; if(!s) return null; const r=window.__ebX.goMap?window.__ebX.goMap(4,s[0],s[1]+(dy||0)):null; return r; },
  solve:(id,only)=>n4aSolve(id,only),
  flags:()=>{ const o={}; for(const k in G.flags) if(/^n_/.test(k)) o[k]=G.flags[k]; for(const k in G.found) if(/^n_|^he_n_/.test(k)) o['found.'+k]=G.found[k]; return o; },
  objs:()=>N4A.objs.map(o=>({id:o.id,kind:o.kind,x:Math.round(o.x),y:Math.round(o.y)})),
  obj:(id)=>{ const o=N4A.byId[id]; if(!o) return null; const r={}; for(const k in o){ const v=o[k]; if(typeof v==='number'||typeof v==='string'||typeof v==='boolean') r[k]=v; } return r; },
  hit:(id,src)=>{ const o=N4A.byId[id]; if(!o||!o.hit) return null; return !!o.hit(o,src,o.x,o.y,10); },
  hitAt:(x,y,r,src)=>n4aHitAll(x,y,r,src),
  pound:(x,y,R)=>{ for(const f of (typeof P3!=='undefined'?P3.poundL:[])) try{ f({x,y,R:R||92}); }catch(e){ console.error(e); } return true; },
  fire:(id,blue,dt)=>{ const o=N4A.byId[id]; if(!o||!o.fire) return null; o.fire(o,dt||0.1,!!blue); return true; },
  wall:(x,y)=>({blocked:blockedAt(x,y),haz:n4aHazAt(x,y),air:window.__ebX.n4w?window.__ebX.n4w.air(x,y):null}),
  echo:(k,v)=>{ G.flags['n_echo'+k+'_done']=v===undefined?1:v; return n4aEchoWon(k); },
  echoWon:(k)=>n4aEchoWon(k),
  amb:()=>N4A.amb.map(a=>({id:a.id,done:!!G.found['n_amb_'+a.id],live:a.live?a.live.filter(e=>!e.dead).length:0})),
  ambClear:()=>{ let n=0; for(const a of N4A.amb){ if(a.live){ for(const e of a.live){ if(!e.dead){ e.hp=0; e.dead=true; n++; } } } } G.enemies=G.enemies.filter(e=>!e.n4a); return n; },
  beam:()=>{ const b=N4A.byId.n_beam; return b?{on:!!b.on,path:(b.path||[]).map(s=>[Math.round(s[2]),Math.round(s[3]),s[4]])}:null; },
  mirrors:()=>N4A_MIR.map(m=>({id:m.id,face:n4aMirFace(m)})),
  hands:()=>n4aClkHands(),
  links:n4aLinks,
  lans:()=>(N4A.lans||[]).map(L=>+L.lit.toFixed(1)),
  glassT:()=>+N4A.glassT.toFixed(2),
  skim:()=>N4A.skim,
  reset:()=>{ N4A.g=null; return true; },
  stand:()=>Object.fromEntries([1,2,3,4].map(k=>[k,{real:n4aEchoReal(k),won:n4aEchoWon(k)}]))
};
window.__ebX=Object.assign(window.__ebX||{},{n4a:N4A_DBG});
