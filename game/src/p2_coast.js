// ================= p2_coast: the three Act II powers (v9, wave 1b)
//   Climbing Claws (claws)  walk into a climbable face (outdoors elevFace&2, in dungeons the `{` raised floor and the `}`
//                           climb spot between floors) and Ash climbs it, up or down; enemies cannot follow.
//   Grapple Tail (grapple)  USE at a highlighted target: ELEV.grapple posts, dungeon `@` posts, brass rings (`ring`, `&`)
//                           zip Ash over gaps, water, chasms and lava, up to one level; on a chain ring hold USE and walk
//                           away to PULL (crates, blocks, levers, drawbridges, boss chains; any thing with onPull).
//   Shadow Dash (shadow)    ROLL becomes a 220 px dash with i-frames; as a shadow Ash slips through moth curtains, shadow
//                           bars, thin bars (p2Thin) and light beams; a dash started inside a shadow rides it to its
//                           far end (over gaps).
// World objects outdoors: p2Add(kind,{...}) (a LANDMARK); inside an area builder: p2Add(kind,{...},A). Dungeon cells and
// marks come from template letters (section 5). The guide for map and dungeon helpers is scratchpad/POWERS2.md.
// Everything extends the engine by wrapping; no other file is edited.

// ---------- 0. numbers, gates and state
const P2N={climb:92, climbK:0.3, range:340, hookK:0.25, reelK:1.4, zip:720, zipK:0.12, throwT:0.12,
  dash:220, dashK:0.2, dashT:0.26, dashCd:0.42, ride:640, popMax:150, need:0.6, beamW:20, beamHurt:0.06, hangZ:30};
const P2={out:[],br:[],g:null,area:null,mv:null,dash:null,pull:null,tgt:null,tgts:[],push:null,useHeld:false,pass:0,
  shine:[],shineNext:[],trail:[],tips:{},lx:null,ly:null,t:0,dashCd:0,grace:0,flinchT:0,beamT:0,inp:null,yanks:[]};
function canClaws(){ return !!G&&G.mode==='story'&&hasAbil('claws'); }
function canGrapple(){ return !!G&&G.mode==='story'&&hasAbil('grapple'); }
function canShadow(){ return !!G&&G.mode==='story'&&hasAbil('shadow'); }
const p2Reel=()=>!!(G&&G.flags&&G.flags.c_reel);
function p2Range(){ return P2N.range*(1+P2N.hookK*hasSkill('hook2'))*(p2Reel()?P2N.reelK:1); }
function p2ClimbSpd(){ return P2N.climb*(1+P2N.climbK*hasSkill('climb2')); }
function p2DashLen(){ return P2N.dash*(1+P2N.dashK*hasSkill('dash2')); }
function p2Busy(){ return !!(P2.mv||P2.dash); }
function p2Climbing(){ return !!(P2.mv&&(P2.mv.kind==='climb'||P2.mv.kind==='xclimb')); }
function p2Shadowed(){ return !!(P2.dash||(P2.mv&&P2.mv.kind==='ride')); }
// a tip the first few times (Settings > Tips: Off keeps them away; the log still has them)
function p2Tip(id,title,text,n){ const c=P2.tips[id]||0; if(c>=(n||1)) return; P2.tips[id]=c+1; try{ mvTip(title,text,7,'p2_'+id); }catch(e){} }
function p2Say(x,y,text,col,id,gap){ const k='say_'+(id||text); if(P2.tips[k]!=null&&G.time-P2.tips[k]<(gap||3)) return; P2.tips[k]=G.time; ftext(x,y,text,col||'#ffe6b0',13); }
const p2Ctl=()=>{ try{ return balCtls(); }catch(e){ return {jump:'C',attack:'J',roll:'Space',fire:'K',use:'E',sprint:'Shift'}; } };

// ---------- 1. sounds (synthesized, like the moves module)
function p2Snd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted||!SFX.noise) return;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.42*(v==null?1:v); out.connect(ac.destination);
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.01,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(kind){
      case 'grip': nz(0.09,0.12,'highpass',2400,4200,0.7); nz(0.06,0.08,'bandpass',900,600,2,0.04); break;
      case 'top': nz(0.12,0.16,'lowpass',700,160,0.8); tn('sine',330,520,0.12,0.03,0.02); break;
      case 'throw': nz(0.18,0.14,'bandpass',600,2600,1.6); tn('triangle',500,900,0.1,0.02); break;
      case 'clink': tn('triangle',1320,1180,0.12,0.06); tn('triangle',1980,1760,0.09,0.035,0.02); nz(0.05,0.08,'highpass',3000,5000,1); break;
      case 'zip': nz(0.32,0.2,'bandpass',300,1800,0.9); break;
      case 'strain': tn('square',90,70,0.18,0.025); nz(0.16,0.06,'bandpass',300,200,3); break;
      case 'snap': tn('triangle',620,260,0.22,0.06); nz(0.1,0.12,'highpass',1800,800,1); break;
      case 'clunk': nz(0.3,0.3,'lowpass',500,60,0.8); tn('sine',120,60,0.28,0.12); break;
      case 'dash': nz(0.28,0.22,'bandpass',220,1400,0.7); tn('sine',160,90,0.22,0.05); for(let i=0;i<3;i++) tn('sine',900+i*260,1400+i*300,0.07,0.012,0.04+i*0.04); break;
      case 'sink': nz(0.4,0.16,'lowpass',900,120,0.6); tn('sine',220,110,0.3,0.04); break;
      case 'moths': nz(0.5,0.08,'bandpass',1800,3200,4); nz(0.4,0.06,'bandpass',2600,4200,5,0.1); break;
      case 'zap': nz(0.16,0.18,'highpass',2000,6000,0.6); tn('sawtooth',880,440,0.12,0.02); break;
    }
  }catch(e){}
}

// ---------- 2. geometry
// distance from (x,y) to a polyline: {d, s (arclength of the closest point), i (segment), L (total length)}
function p2PolyD(pts,x,y){
  let best=1e9, bs=0, bi=0, acc=0;
  for(let i=1;i<pts.length;i++){ const a=pts[i-1], b=pts[i], dx=b[0]-a[0], dy=b[1]-a[1], l2=dx*dx+dy*dy||1, L=Math.sqrt(l2), t=clamp(((x-a[0])*dx+(y-a[1])*dy)/l2,0,1), px=a[0]+dx*t, py=a[1]+dy*t, d=Math.hypot(x-px,y-py);
    if(d<best){ best=d; bs=acc+t*L; bi=i-1; } acc+=L; }
  return {d:best,s:bs,i:bi,L:acc};
}
function p2PolyLen(pts){ let L=0; for(let i=1;i<pts.length;i++) L+=dist(pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1]); return L; }
function p2PolyAt(pts,s){ let acc=0; for(let i=1;i<pts.length;i++){ const a=pts[i-1], b=pts[i], d=dist(a[0],a[1],b[0],b[1]); if(acc+d>=s){ const k=d?(s-acc)/d:0; return [lerp(a[0],b[0],k),lerp(a[1],b[1],k),Math.atan2(b[1]-a[1],b[0]-a[0])]; } acc+=d; } const e=pts[pts.length-1], f=pts[pts.length-2]||e; return [e[0],e[1],Math.atan2(e[1]-f[1],e[0]-f[0])]; }
const p2InRect=(x,y,o,m)=>{ m=m||0; return x>o.x-o.w/2-m&&x<o.x+o.w/2+m&&y>o.y-o.h/2-m&&y<o.y+o.h/2+m; };

// ---------- 3. light and shade
// p2Shine(x,y,r) / p2ShineSeg(x0,y0,x1,y1,w): any module lights a spot this frame (lamps, the lighthouse beam, the fog horn).
// Moth curtains open where it is lit, shadow bars turn solid, and shadows there cannot be ridden.
function p2Shine(x,y,r){ P2.shineNext.push({x,y,r:r||80}); }
function p2ShineSeg(x0,y0,x1,y1,w){ P2.shineNext.push({x0,y0,x1,y1,w:w||30}); }
function p2LitAt(x,y,m){ m=m||0; for(const s of P2.shine){ if(s.r!=null){ if(dist2(x,y,s.x,s.y)<(s.r+m)*(s.r+m)) return true; } else if(segD(x,y,s.x0,s.y0,s.x1,s.y1)<s.w/2+m) return true; } return false; }
// is (x,y) inside a shadow Ash can ride? (wrap it to add your own: the Spire's creeping dark, a boss's shadow pool)
function p2ShadeAt(x,y){
  if(AREA){ const C=AREA.p2; if(!C) return false; const k=tCell(x,y);
    if(k>=0&&C.shade[k]) return !p2LitAt(x,y);
    for(const s of C.strips) if(p2StripOn(s)&&segD(x,y,s.x0,s.y0,s.x1,s.y1)<s.w/2) return !p2LitAt(x,y);
    return false; }
  for(const o of mapList(P2.out,curMap())){ if(o.p2!=='shadowlane'||!p2LaneOn(o)) continue; if(x<o.bb[0]||x>o.bb[2]||y<o.bb[1]||y>o.bb[3]) continue; if(p2PolyD(o.pts,x,y).d<o.w/2) return !p2LitAt(x,y); }
  return false;
}
const p2LaneOn=o=>!o.on||!!o.on(o);
const p2StripOn=s=>!s.on||!!s.on(s);
// the light this frame: what other modules shone last frame, our beams, lit fires in caves and the dungeon's sun beams
function p2Lights(dt){
  P2.shine=P2.shineNext; P2.shineNext=[];
  const add=s=>P2.shine.push(s);
  if(AREA){
    const A=AREA;
    for(const o of A.objs){ if((o.k==='brazier'||o.k==='lamp2'||o.k==='lpod'||o.k==='ctorch')&&o.lit) add({x:o.x,y:o.y,r:o.k==='lpod'?130:105}); }
    if(A.dn&&A.dn.beam) for(const pts of A.dn.beam.segs) for(let i=1;i<pts.length;i++) add({x0:pts[i-1].x,y0:pts[i-1].y,x1:pts[i].x,y1:pts[i].y,w:34});
    const C=A.p2; if(C) for(const b of C.beams) if(b.lights&&p2BeamOn(b)) add({x0:b.x0,y0:b.y0,x1:b.x1,y1:b.y1,w:b.w+14});
  }else{
    for(const o of mapList(P2.out,curMap())) if(o.p2==='lightbeam'&&o.lights&&p2BeamOn(o)) add({x0:o.x0,y0:o.y0,x1:o.x1,y1:o.y1,w:o.w+14});
  }
}
// a beam is on unless it pulses (on, off in seconds, ph its phase) or has its own on() test
function p2BeamOn(b){ if(b.when) return !!b.when(b); if(!b.on||!b.off) return true; return ((G.time+(b.ph||0))%(b.on+b.off))<b.on; }
function p2BeamWarn(b){ if(b.when||!b.on||!b.off) return false; const per=b.on+b.off, ph=(G.time+(b.ph||0))%per; return ph>per-0.6; }

// ---------- 4. world objects
// P2K[kind]: init(o,A), ground(o,t) (flat, drawn under figures), stand(o,t) (upright, sorted with figures by sy(o)), tick(o,dt)
const P2K={};
function p2Add(kind,o,A){
  const K=P2K[kind]; if(!K) throw new Error('p2Add: unknown kind '+kind);
  o.k='p2_'+kind; o.p2=kind;
  if(o.pts&&o.x==null){ o.x=o.pts[0][0]; o.y=o.pts[0][1]; }
  if(o.x0!=null&&o.x==null){ o.x=(o.x0+o.x1)/2; o.y=(o.y0+o.y1)/2; }
  if(!o.id) o.id=`p2_${kind}_${Math.round(o.x)}_${Math.round(o.y)}`;
  if(A){ o.inArea=true; A.objs.push(o); if(K.init) K.init(o,A); }
  else{ LANDMARKS.push(o); P2.out.push(o); if(kind==='drawbridge') P2.br.push(o); if(K.init) K.init(o,null); }
  return o;
}
function p2Objs(){ return AREA?AREA.objs:mapList(P2.out,curMap()); }
// a collider that switches itself off (colActive reads c.off): open curtains, and Ash while he is a shadow
function p2Col(o,A,blocks){
  const c={t:'r',x0:o.x-o.w/2,y0:o.y-o.h/2,x1:o.x+o.w/2,y1:o.y+o.h/2,noProj:true};
  Object.defineProperty(c,'off',{get(){ return !blocks(o); },configurable:true});
  if(A){ if(A===AREA) addAreaCol(c); else{ addCol(c); A.cols.push(c); } } else addCol(c);
  o.col=c; return c;
}
// moth curtains: open while lit (and 2 s after), always open to a shadow
function p2CurtainOpen(o){ return o.litT!=null&&o.litT<2; }
function p2CurtainBlocks(o){ if(p2CurtainOpen(o)||o.hold) return false; return !(P2.pass>0); }
function p2BarsBlocks(o){ if(P2.pass>0&&!o.lit) return false; return true; }
P2K.mothcurtain={init(o,A){ o.w=o.w||96; o.h=o.h||16; o.litT=99; o.oa=0; p2Col(o,A,p2CurtainBlocks); },
  tick(o,dt){ const lit=p2LitAt(o.x,o.y,Math.max(o.w,o.h)*0.35); o.litT=lit?0:o.litT+dt; const p=player; o.hold=!p2CurtainOpen(o)&&o.oa>0.5&&p2InRect(p.x,p.y,o,p.r*0.6);
    const want=p2CurtainOpen(o)||o.hold?1:0; if(want&&o.oa<0.05) p2Snd('moths',0.6); o.oa+=(want-o.oa)*Math.min(1,dt*(want?5:2.5)); if(o.rip>0) o.rip-=dt; },
  ground(o,t){ const R=p2ObjRun(o); if(R.vert) p2DrawRun(R,t); }, stand(o,t){ const R=p2ObjRun(o); if(!R.vert) p2DrawRun(R,t); }, sy:o=>o.y+o.h/2};
P2K.shadowbars={init(o,A){ o.w=o.w||96; o.h=o.h||16; o.lit=false; o.rip=0; p2Col(o,A,p2BarsBlocks); },
  tick(o,dt){ o.lit=p2LitAt(o.x,o.y,Math.max(o.w,o.h)*0.3); if(o.rip>0) o.rip-=dt; },
  ground(o,t){ const R=p2ObjRun(o); if(R.vert) p2DrawRun(R,t); }, stand(o,t){ const R=p2ObjRun(o); if(!R.vert) p2DrawRun(R,t); }, sy:o=>o.y+o.h/2};
// thin barriers: iron, bone or ice bars (or a crack) that stop everything but a shadow {w,h, style:'iron'|'bone'|'ice', when(o)}
P2K.thinbars={init(o,A){ o.w=o.w||96; o.h=o.h||16; o.style=o.style||'iron'; o.lit=true; o.rip=0; p2Col(o,A,q=>!(P2.pass>0&&(!q.when||!!q.when(q)))); },
  tick(o,dt){ if(o.rip>0) o.rip-=dt; },
  ground(o,t){ const R=p2ObjRun(o); if(R.vert) p2DrawRun(R,t); }, stand(o,t){ const R=p2ObjRun(o); if(!R.vert) p2DrawRun(R,t); }, sy:o=>o.y+o.h/2};
const P2_THIN={iron:{bar:'#5e6270',beam:'#4a4e5a',hi:'rgba(230,236,245,.7)'},bone:{bar:'#dccfb2',beam:'#b4a484',hi:'rgba(255,250,235,.95)'},ice:{bar:'#9ccfe8',beam:'#78acd0',hi:'rgba(255,255,255,.9)'}};
// light beams: a hot beam from (x0,y0) to (x1,y1) that burns and shoves Ash back; a shadow passes it.
// {w:20, hurt:0.06 (of max health, 0 for a harmless barrier), block:true, on/off/ph (seconds, pulsing), when(o)->bool, lights:false}
P2K.lightbeam={init(o,A){ o.w=o.w||P2N.beamW; if(o.hurt==null) o.hurt=P2N.beamHurt; if(o.block==null) o.block=true; o.L={x:(o.x0+o.x1)/2,y:(o.y0+o.y1)/2,r:dist(o.x0,o.y0,o.x1,o.y1)/2+60,i:0}; if(A) A.lights.push(o.L); },
  tick(o,dt){ o.L.i=p2BeamOn(o)?0.55:0; p2BeamTouch(o,dt); }, ground(o,t){ p2DrawBeam(o,t); }};
// shadow lanes: a strip of shadow on the ground {pts:[[x,y],...], w:44, on?(o)->bool}; a dash that starts in it rides it
P2K.shadowlane={init(o){ o.w=o.w||44; const b=[1e9,1e9,-1e9,-1e9]; for(const q of o.pts){ b[0]=Math.min(b[0],q[0]); b[1]=Math.min(b[1],q[1]); b[2]=Math.max(b[2],q[0]); b[3]=Math.max(b[3],q[1]); } o.bb=[b[0]-o.w,b[1]-o.w,b[2]+o.w,b[3]+o.w]; o.len=p2PolyLen(o.pts); },
  ground(o,t){ p2DrawLane(o,t); }};
// brass rings: grapple targets {h:56 (height of the ring), hang:false (Ash hangs from it), pole:false, lvl?, to?:{x,y}}
P2K.ring={init(o){ if(o.h==null) o.h=o.pole?48:58; }, ground(o,t){ r2e(ctx,o.x+3,o.y+4,9,4,'rgba(40,20,40,.28)'); }, stand(o,t){ p2DrawRing(o,t); }, sy:o=>o.y};
// chain rings: PULL targets {mode:'lever'|'custom', need:0.6 (seconds of pulling), then(o), onPull(o,info), h:26}
P2K.chainring={init(o,A){ if(o.h==null) o.h=26; o.done=!!(G&&G.found[o.id]); o.strain=0; if(!o.mode) o.mode='lever'; o.r=o.r||12; addOrCol(o,A,{t:'c',x:o.x,y:o.y,r:10}); },
  stand(o,t){ p2DrawChainRing(o,t); }, sy:o=>o.y};
// pull blocks: a crate with a ring you drag {w:44,h:40, travel:420 (from home), axis:null|'x'|'y', goal:{x,y,r}, then(o)}
P2K.pullblock={init(o,A){ o.w=o.w||44; o.h=o.h||40; o.travel=o.travel||420; o.hx=o.x; o.hy=o.y; const s=G&&G.found['p2pb_'+o.id]; if(s&&s.length===2){ o.x=s[0]; o.y=s[1]; } o.done=!!(G&&G.found[o.id]);
    o.col={t:'r',x0:o.x-o.w/2,y0:o.y-o.h/2,x1:o.x+o.w/2,y1:o.y+o.h/2}; addOrCol(o,A,o.col); },
  stand(o,t){ p2DrawCrate(o,t); }, sy:o=>o.y+o.h/2};
// drawbridges: {x0,y0,x1,y1 (the deck), hinge:'n'|'s'|'e'|'w' (the edge it is fixed to), ring:{x,y}, need:0.7, then(o)}
P2K.drawbridge={init(o){ o.down=!!(G&&G.found[o.id]); o.a=o.down?1:0; o.hinge=o.hinge||'n'; if(!o.ring){ const h=o.hinge; o.ring={x:h==='e'?o.x1:h==='w'?o.x0:(o.x0+o.x1)/2,y:h==='s'?o.y1:h==='n'?o.y0:(o.y0+o.y1)/2}; } },
  tick(o,dt){ o.a+=((o.down?1:0)-o.a)*Math.min(1,dt*3.2); }, ground(o,t){ p2DrawBridge(o,t,false); }, stand(o,t){ p2DrawBridge(o,t,true); }, sy:o=>o.hinge==='s'?o.y1:o.hinge==='n'?o.y0+6:(o.y0+o.y1)/2};
function addOrCol(o,A,c){ if(A){ if(A===AREA) addAreaCol(c); else{ addCol(c); A.cols.push(c); } } else addCol(c); o.col=c; return c; }
// a lowered drawbridge is walkable for everyone (outdoors; dungeon bridges cover their pit cells instead)
function p2BridgeAt(x,y){ if(!P2.br.length||x>=IZX-50) return null; for(const o of P2.br) if(o.down&&x>o.x0&&x<o.x1&&y>o.y0&&y<o.y1) return o; return null; }

// ---------- 5. dungeon cells and marks (templates, DUNGEON.md section 5)
//   {  raised floor (like =) whose faces Ash can climb with the claws, up from the ground and back down
//   }  a climb spot between floors: put one on each floor at the same place; stepping onto it climbs to the other
//   &  a brass ring: a grapple target (over a pit or deep water Ash hangs from it and can swing on to the next)
//   (  a chain lever: PULL it to solve its room (or call the room's onPull(R,info))
//   [  a chain block: a push block with a ring on it; PULL it toward you one cell at a time
//   )  a moth curtain cell     ]  a shadow bars cell     ,  a shadow pool on the floor (ride it with a dash)
// room fields: lightbeams:[{a:[c,r],b:[c,r],w,hurt,on,off,ph,lights,block,when}], shadows:[{a:[c,r],b:[c,r],w:cells,on}],
//              bridges:[{a:[c,r],b:[c,r],ring:[c,r],need}] (pit cells a..b covered once pulled down), onPull(R,info), climbTo
// link types: 'moth' (a moth curtain across the door) and 'shadow' (shadow bars across the door)
Object.assign(TY_CH,{'{':TY.high}); TY_KEEP['{']=1;
Object.assign(DOOR_COL,{moth:'190,180,200',shadow:'150,90,210'}); Object.assign(LINK_CH,{moth:'m',shadow:'s'});
function p2Cave(A){ if(A.p2) return A.p2; const n=A.cave.w*A.cave.h; return A.p2={shade:new Uint8Array(n),strips:[],beams:[],climb:new Set(),spots:[],rings:[],chains:[],bridges:[],cover:new Set(),gates:[]}; }
const p2HoleT=t=>t===TY.pit||t===TY.chasm||t===TY.deep||t===TY.crumble||t===TY.drop;
// a ring's own cell takes the hole it hangs over (a ring in the middle of a pit is over the pit too)
{ const base=genCaveRooms; genCaveRooms=function(def){
    const c=base.apply(this,arguments); if(typeof dunOwns==='function'&&!dunOwns(def)) return c; const w=c.w;
    for(const m of c.marks){ if(m.ch!=='&') continue; const k=m.j*w+m.i; if(c.typ[k]!==0) continue; const cnt={};
      for(const d of DIRS){ const q=k+d[0]+d[1]*w, t=c.typ[q]; if(p2HoleT(t)) cnt[t]=(cnt[t]||0)+1; else if(c.grid[q]===1&&t===1) cnt[1]=(cnt[1]||0)+1; }
      let best=0, bt=0; for(const t in cnt) if(cnt[t]>best){ best=cnt[t]; bt=+t; }
      if(best>=2){ if(bt===1){ c.grid[k]=1; c.typ[k]=1; } else c.typ[k]=bt; } }
    return c; }; }
{ const base=dunBuildRoom; dunBuildRoom=function(A,def,R,ms,P,spot,freeSpot,rng){ base.apply(this,arguments); p2BuildRoom(A,def,R,ms,P); }; }
function p2BuildRoom(A,def,R,ms,P){
  const C=p2Cave(A), c=A.cave, cs=c.cell, SK=caveSid(def), RP=(a)=>P(R.ox+1+a[0],R.oy+1+a[1]);
  for(const m of ms){
    const p=P(m.i,m.j), k=m.j*c.w+m.i, id=`p2_${SK}_${R.id}_${m.ch}${m.c}_${m.r}`;
    switch(m.ch){
      case '{': C.climb.add(k); break;
      case ',': C.shade[k]=1; break;
      case ')': case ']': { const moth=m.ch===')', o={k:'cgate',type:moth?'moth':'shadow',p2t:moth?'moth':'bars',p2cell:true,x:p.x,y:p.y,id,room:R.id,r:30,closed:true,opened:false,tmp:false,litT:99,oa:0,lit:false,w:cs,h:cs};
        o.cells=[k]; o.prompt=()=>caveGatePrompt(o); A.gates.push(o); c.dyn[k]=A.gates.length; A.objs.push(o); C.gates.push(o); break; }
      case '&': { const t=c.typ[k], hang=p2HoleT(t)||(c.grid[k]===1&&t===1); const o={k:'p2_ring',p2:'ring',x:p.x,y:p.y,id,room:R.id,h:64,hang,cave:true,lvl:hang?null:Math.max(0,dunH(k))}; A.objs.push(o); C.rings.push(o); A.lights.push({x:p.x,y:p.y-40,r:120,i:0.35}); break; }
      case '(': { const o={k:'p2_chainring',p2:'chainring',mode:'room',x:p.x,y:p.y,id,room:R.id,h:26,r:12,strain:0,done:!!G.found[id]||!!R.solved,cave:true}; A.objs.push(o); C.chains.push(o); addAreaCol({t:'c',x:p.x,y:p.y+4,r:11}); break; }
      case '[': { const b={k:'block',ci:m.i,cj:m.j,si:m.i,sj:m.j,x:p.x,y:p.y,id,room:R.id,cart:false,anim:0,fx:p.x,fy:p.y,live:true,p2ring:true}; A.blocks.push(b); A.objs.push(b,{k:'p2_blockring',ref:b,x:p.x,y:p.y,id:id+'_r'}); C.chains.push(b); break; }
      case '}': { const s={k:'p2_climbspot',x:p.x,y:p.y,id,room:R.id,ck:k,ci:m.i,cj:m.j,to:null,up:true}; A.objs.push(s); C.spots.push(s); A.lights.push({x:p.x,y:p.y-20,r:110,i:0.3}); break; }
    }
  }
  for(const b of R.lightbeams||[]){ const a=RP(b.a), e=RP(b.b), o=Object.assign({},b,{x0:a.x,y0:a.y,x1:e.x,y1:e.y,room:R.id}); o.w=o.w||P2N.beamW; if(o.hurt==null) o.hurt=P2N.beamHurt; if(o.block==null) o.block=true;
    o.L={x:(a.x+e.x)/2,y:(a.y+e.y)/2,r:dist(a.x,a.y,e.x,e.y)/2+60,i:0.5}; A.lights.push(o.L); C.beams.push(o); }
  for(const s of R.shadows||[]){ const a=RP(s.a), e=RP(s.b); C.strips.push({x0:a.x,y0:a.y,x1:e.x,y1:e.y,w:(s.w||1)*cs,on:s.on||null,room:R.id}); }
  (R.bridges||[]).forEach((b,n)=>{ const id=b.id||`p2_${SK}_${R.id}_br${n}`, i0=R.ox+1+Math.min(b.a[0],b.b[0]), i1=R.ox+1+Math.max(b.a[0],b.b[0]), j0=R.oy+1+Math.min(b.a[1],b.b[1]), j1=R.oy+1+Math.max(b.a[1],b.b[1]);
    const cells=[]; for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) cells.push(j*c.w+i);
    const rp=b.ring?RP(b.ring):P(i0,j0);
    const o={id,room:R.id,cells,x0:A.x0+i0*cs,y0:A.y0+j0*cs,x1:A.x0+(i1+1)*cs,y1:A.y0+(j1+1)*cs,rx:rp.x,ry:rp.y,need:b.need||0.7,down:!!G.found[id],a:G.found[id]?1:0,strain:0};
    // the hinge is the edge of the deck nearest the ring
    const dx=Math.min(Math.abs(rp.x-o.x0),Math.abs(rp.x-o.x1)), dy=Math.min(Math.abs(rp.y-o.y0),Math.abs(rp.y-o.y1));
    o.hinge=dy<=dx?(Math.abs(rp.y-o.y0)<Math.abs(rp.y-o.y1)?'n':'s'):(Math.abs(rp.x-o.x0)<Math.abs(rp.x-o.x1)?'w':'e');
    if(o.down) for(const q of cells) C.cover.add(q);
    C.bridges.push(o); });
}
// after every room is built: doors with moth curtains or shadow bars, and where each climb spot leads
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){
    base.apply(this,arguments);
    if(typeof dunOwns==='function'&&!dunOwns(def)) return;
    const C=p2Cave(A);
    for(const o of A.gates){ if(o.p2t||(o.type!=='moth'&&o.type!=='shadow')) continue; o.p2t=o.type==='moth'?'moth':'bars'; o.litT=99; o.oa=0; o.lit=false; o.closed=true; o.w=o.vertical?144:48; o.h=o.vertical?48:144; C.gates.push(o); }
    for(const s of C.spots) p2SpotLink(A,def,s);
    refreshCaveGates(); }; }
// where a climb spot goes: the room's climbTo (an area id), or the other floor of this dungeon with a } at the same place
function p2FloorMarks(aid,ch){
  const M=CAVEMAP[aid], out=[]; if(!M) return out;
  for(const rid in M.rooms){ const R=M.rooms[rid], tpl=R.tpl?(Array.isArray(R.tpl)?R.tpl:CAVE_TPL[R.tpl]):null; if(!tpl) continue;
    tpl.forEach((row,r)=>{ for(let cc=0;cc<row.length;cc++) if(row[cc]===ch) out.push({i:R.at[0]*RSX+1+cc,j:R.at[1]*RSY+1+r,room:rid}); }); }
  return out;
}
function p2SpotLink(A,def,s){
  const R=A.rooms[s.room], D=typeof dunOfArea==='function'?dunOfArea(A):null, ids=D?D.floorIds:[def.id], me=ids.indexOf(def.id);
  if(R&&R.climbTo){ s.to=R.climbTo; const ti=ids.indexOf(s.to); s.up=R.climbDir?R.climbDir==='up':ti<me; return; }
  let best=null, bd=9;
  ids.forEach((aid,i)=>{ if(aid===def.id) return; for(const q of p2FloorMarks(aid,'}')){ const d=Math.abs(q.i-s.ci)+Math.abs(q.j-s.cj); if(d<bd){ bd=d; best={aid,i}; } } });
  if(best&&bd<=4){ s.to=best.aid; s.up=R&&R.climbDir?R.climbDir==='up':best.i<me; }
}
// moth curtains and shadow bars in doors and cells: the doors stay "closed" for carts, guards and beams; Ash slips
// through as a shadow (and through an open curtain on foot)
function p2GateOpen(g){ return g.p2t==='moth'&&(p2CurtainOpen(g)||g.hold); }
{ const base=caveBlockedAt; caveBlockedAt=function(k){
    const A=AREA, d=A&&A.cave.dyn?A.cave.dyn[k]:0, g=d&&A.gates[d-1];
    if(g&&g.p2t){ if(g.tmp) return true; if(g.p2t==='moth') return !(p2GateOpen(g)||P2.pass>0); return !(P2.pass>0&&!g.lit); }
    return base(k); }; }
{ const base=refreshCaveGates; refreshCaveGates=function(){ base.apply(this,arguments); const A=AREA; if(!A||!A.gates) return; for(const o of A.gates) if(o.p2t) o.closed=!!o.tmp||!p2GateOpen(o); }; }
function p2GateOnAsh(A,o){ const c=A.cave, p=player; return o.cells.some(k=>{ const i=k%c.w, j=(k-i)/c.w, x=A.x0+(i+0.5)*c.cell, y=A.y0+(j+0.5)*c.cell; return Math.abs(p.x-x)<c.cell*0.5+p.r*0.5&&Math.abs(p.y-y)<c.cell*0.5+p.r*0.5; }); }
function p2CaveTick(A,dt){
  const C=A.p2; if(!C) return; const cs=A.cave.cell;
  for(const o of C.gates){
    let lit=false; for(const k of o.cells){ const q=tPos(k); if(p2LitAt(q.x,q.y,cs*0.3)){ lit=true; break; } }
    if(o.p2t==='moth'){ o.litT=lit?0:(o.litT==null?99:o.litT+dt); o.hold=!p2CurtainOpen(o)&&o.oa>0.4&&p2GateOnAsh(A,o);
      const want=p2GateOpen(o)?1:0; if(want&&o.oa<0.05&&A.curRoom&&A.curRoom.id===o.room) p2Snd('moths',0.5); o.oa+=(want-o.oa)*Math.min(1,dt*(want?5:2.5)); }
    else o.lit=lit;
    if(o.rip>0) o.rip-=dt;
    o.closed=!!o.tmp||!p2GateOpen(o);
  }
  for(const b of C.beams){ b.L.i=p2BeamOn(b)?0.55:0; p2BeamTouch(b,dt); }
  for(const b of C.bridges){ b.a+=((b.down?1:0)-b.a)*Math.min(1,dt*3.2); }
}
// pits under a lowered drawbridge are floor; nothing about heights while Ash climbs, zips, hangs or rides
{ const base=dunCovered; dunCovered=function(k){ return base(k)||!!(AREA&&AREA.p2&&AREA.p2.cover.has(k)); }; }
{ const base=dunCheck; dunCheck=function(k,x,y,air,fly){ if(P2.mv) return null; return base(k,x,y,air,fly); }; }

// ---------- 6. grapple targets
// a target: {kind:'zip'|'hang'|'pull'|'yank', x,y (its foot on the ground), h (how high the ring is drawn), lvl, o, src}
function p2Lvl(x,y){ if(AREA){ if(!AREA.cave) return 0; const k=tCell(x,y); return k<0?0:Math.max(0,dunH(k)); } return elevLvl(x,y); }
function p2StandOK(x,y,lvl){
  if(AREA){ const A=AREA, c=A.cave, k=tCell(x,y); if(k<0||!A.tri) return false;
    if(!tGround(k)||caveBlockedAt(k)||tHole(k)) return false;
    if(lvl!=null){ const h=dunH(k); if(h>=0&&h!==lvl) return false; }
    return !colAt(x,y,11); }
  if(outOfMap(x,y,40)) return false;
  if(lvl!=null&&elevLvl(x,y)!==lvl) return false;
  return ELEV.standOK(x,y);
}
function p2Targets(p){
  const out=[], R=p2Range(), R2=(R+30)*(R+30), add=t=>{ if(dist2(p.x,p.y,t.x,t.y)<R2) out.push(t); };
  if(AREA){ const A=AREA, C=A.p2;
    for(const o of A.grapples||[]) add({kind:'zip',x:o.x,y:o.y,h:34,lvl:o.lvl||0,o,src:'post'});
    if(C){ for(const o of C.rings) add({kind:o.hang?'hang':'zip',x:o.x,y:o.y,h:o.h,lvl:o.lvl,o,src:'ring'});
      for(const o of C.chains) if(!o.done&&!(o.k==='block'&&o.sunk)) add({kind:'pull',x:o.x,y:o.y,h:o.k==='block'?24:o.h,o,src:o.k==='block'?'block':'chain'});
      for(const b of C.bridges) if(!b.down) add({kind:'pull',x:b.rx,y:b.ry,h:20,o:b,src:'bridge'}); }
    for(const o of A.objs){ if(!o.p2||o.cave) continue; p2ObjTarget(o,add); }
    if(p2Reel()) for(const o of A.objs) if((o.k==='lever'&&!o.on)||(o.k==='plever')) add({kind:'yank',x:o.x,y:o.y,h:16,o,src:'lever'});
  }else{
    const k=curMap();
    for(const q of ELEV.posts(k)) add({kind:'zip',x:q.x,y:q.y,h:46,lvl:q.lvl,o:q,src:'post'});
    for(const o of mapList(P2.out,k)) p2ObjTarget(o,add);
  }
  for(const e of G.enemies){ if(e.dead||e.passive||e.spawnIn>0||e.alpha<0.3) continue;
    if(e.p2rings) for(const r of e.p2rings){ if(r.done) continue; add({kind:'pull',x:e.x+(r.dx||0),y:e.y+(r.dy||0),h:r.h||18,o:r,foe:e,src:'foering'}); }
    if(p2Reel()&&!e.boss&&!e.mini){ if(e.shield&&!(e.p2shT>0)) add({kind:'yank',x:e.x,y:e.y,h:20,o:e,foe:e,src:'shield'}); else if((e.r||14)<=16&&!e.shield) add({kind:'yank',x:e.x,y:e.y,h:12,o:e,foe:e,src:'foe'}); } }
  return out;
}
function p2ObjTarget(o,add){
  if(o.p2==='ring') add({kind:o.hang?'hang':'zip',x:o.x,y:o.y,h:o.h,lvl:o.lvl!=null?o.lvl:p2Lvl(o.x,o.y),o,src:'ring'});
  else if(o.p2==='chainring'&&!o.done) add({kind:'pull',x:o.x,y:o.y,h:o.h,o,src:'chain'});
  else if(o.p2==='pullblock'&&!o.done) add({kind:'pull',x:o.x,y:o.y,h:16,o,src:'crate'});
  else if(o.p2==='drawbridge'&&!o.down) add({kind:'pull',x:o.ring.x,y:o.ring.y,h:22,o,src:'bridge'});
}
// can the tail get there? Caves: no wall or shut door in between. Outdoors: no ground higher than both ends
function p2LOS(x0,y0,x1,y1,l0,l1){
  const d=dist(x0,y0,x1,y1), n=Math.max(1,Math.ceil(d/14));
  if(AREA){ const A=AREA, c=A.cave;
    for(let i=1;i<n;i++){ const k=tCell(lerp(x0,x1,i/n),lerp(y0,y1,i/n)); if(k<0) return false; if(c.grid[k]===1&&c.typ[k]!==1) return false; const g=c.dyn[k]&&A.gates[c.dyn[k]-1]; if(g&&g.closed) return false; }
    return true; }
  const top=Math.max(l0||0,l1||0);
  for(let i=1;i<n;i++) if(elevLvl(lerp(x0,x1,i/n),lerp(y0,y1,i/n))>top) return false;
  return true;
}
// where a zip lands: the target's own spot (o.to), else the nearest good ground on its level, on Ash's side first
function p2LandSpot(t,p){
  if(t.o&&t.o.to) return {x:t.o.to.x,y:t.o.to.y};
  const a0=angTo(t.x,t.y,p.x,p.y);
  for(const r of [20,30,42,56]) for(const da of [0,0.5,-0.5,1,-1,1.6,-1.6,2.3,-2.3,Math.PI]){ const a=a0+da, x=t.x+Math.cos(a)*r, y=t.y+Math.sin(a)*r; if(p2StandOK(x,y,t.lvl)) return {x,y}; }
  return null;
}
function p2TgtOK(t,p,lv){
  const d=dist(p.x,p.y,t.x,t.y), hang=P2.mv&&P2.mv.kind==='hang';
  if(d>p2Range()+(t.kind==='pull'?20:0)) return false;
  if(hang&&t.o===P2.mv.t.o) return false;
  if(t.kind==='zip'||t.kind==='hang'){
    if(d<(hang?40:64)) return false;
    if(!AREA&&t.lvl!=null&&t.lvl>lv+1){ t.why='high'; return false; }
    if(!p2LOS(p.x,p.y,t.x,t.y,lv,t.lvl)) return false;
    if(t.kind==='zip'){ if(t.land===undefined) t.land=p2LandSpot(t,p); if(!t.land) t.kind='hang'; else if(dist(p.x,p.y,t.land.x,t.land.y)<36) return false; }
    return true;
  }
  if(d<26) return false;
  return p2LOS(p.x,p.y,t.x,t.y,lv,lv);
}
// the best target in front of Ash (where he walks, or where he faces): close, and near the aim
function p2Pick(p,inp){
  if(!canGrapple()||P2.pull) return null;
  const list=p2Targets(p); if(!list.length) return null;
  const mv=Math.hypot(inp.mx||0,inp.my||0)>0.25, aim=mv?Math.atan2(inp.my,inp.mx):p.facing, R=p2Range(), lv=P2.mv&&P2.mv.kind==='hang'?99:p2Lvl(p.x,p.y);
  for(const t of list){ const da=Math.abs(angDiff(aim,angTo(p.x,p.y,t.x,t.y))); t.da=da; t.sc=dist(p.x,p.y,t.x,t.y)/R+0.85*da/Math.PI+(t.kind==='yank'?0.25:0); }
  list.sort((a,b)=>a.sc-b.sc);
  const prev=P2.tgt; let best=null, n=0;
  for(const t of list){ if(t.da>1.65&&!(P2.mv&&P2.mv.kind==='hang')) continue; if(++n>8) break; if(p2TgtOK(t,p,lv)){ best=t; break; } }
  // keep the old pick unless the new one is clearly better (no flicker between two rings)
  if(best&&prev&&prev.o!==best.o){ const old=list.find(q=>q.o===prev.o); if(old&&old.sc<best.sc+0.12&&p2TgtOK(old,p,lv)) best=old; }
  return best;
}
function p2TgtText(t){
  if(t.kind==='pull') return t.src==='crate'?S('Hook the crate','Grab the crate'):t.src==='block'?S('Hook the block','Grab the block'):t.src==='bridge'?S('Hook the drawbridge chain','Grab the chain'):S('Hook the chain','Grab the chain');
  if(t.kind==='yank') return t.src==='shield'?S('Yank the shield','Pull the shield'):t.src==='lever'?S('Yank the lever','Pull the lever'):S('Reel it in','Pull it in');
  if(t.kind==='hang') return S('Grapple and hang on','Grab the ring');
  return S('Grapple','Grapple');
}
function p2Use(t){
  const p=player; if(!t||P2.mv&&P2.mv.kind!=='hang') return;
  if(t.kind==='pull'){ p2PullStart(p,t); return; }
  if(t.kind==='yank'){ p2Yank(p,t); return; }
  p2ZipStart(p,t);
}

// ---------- 7. moves that take over Ash's legs: climb, xclimb (between floors), zip, hang, drop, slip, ride, pop
// (updatePlayer is skipped while one runs, like e3_elev's hop, so these keep its timers going)
function p2Tick(p,dt){
  p.t+=dt; p.dashCd-=dt; p.iframes-=dt; p.hurtFlash-=dt; p.atkCd-=dt; p.comboTimer-=dt; G.dashBuf-=dt; G.roarBuf-=dt;
  if(p.stamDelay>0) p.stamDelay-=dt; else p.stamina=Math.min(p.maxStamina,p.stamina+p.stats.staminaRegen*dt);
  if(p.regenDelay>0) p.regenDelay-=dt; else p.energy=Math.min(p.maxEnergy,p.energy+p.stats.energyRegen*dt);
  p.moving=false; p.sprinting=false; p.breathing=false; p.swingT=0; p.dashT=0; p.drinkT=0; p.kvx=p.kvy=0; p.avx=p.avy=0; p.vz=0;
  try{ SFX.setFire(false); }catch(e){}
  if(typeof MV!=='undefined'){ MV.lx=p.x; MV.ly=p.y; MV.jumpBuf=0; }
  for(const g of p.ghosts) g.a-=dt*3; if(p.ghosts.length) p.ghosts=p.ghosts.filter(g=>g.a>0);
}
function p2Dust(x,y,n,col){ emit(x,y,n||8,{col:col||'150,130,110',glow:false,smin:20,smax:90,lmin:.25,lmax:.5,zmin:2,zmax:4,grow:6}); }
// a move ends on the ground at (x,y)
function p2End(p,x,y,soft){
  P2.mv=null; p.x=x; p.y=y; p.z=0; p.vz=0; p.flying=false; p.dbl=false; p.slam=false;
  if(!soft){ p.sqT=0.14; p.sqD=0.14; p.sqA=0.12; try{ mvSnd('land',0.8); }catch(e){} p2Dust(x,y+5,10); }
  // in a dungeon the landing spot is the new last good spot (so a slip off a ledge is not undone as a step into a wall);
  // pits and water: trialPlayerCells sees to it next frame, the usual way
  if(AREA){ const T=AREA.tri; if(T){ T.lx=x; T.ly=y; } return; }
  if(playerBlocked(p.x,p.y)){ const w=T(p.x,p.y,{}).water; backToSafe(p,w?'water':'lava'); return; }
  p.safeX=p.x; p.safeY=p.y; p._ex=p.x; p._ey=p.y;
}
function p2MoveStep(p,dt,inp){
  const M=P2.mv; if(!M) return;
  switch(M.kind){
    case 'climb': p2ClimbStep(p,dt,inp); break;
    case 'slip': { M.t+=dt; const k=clamp(M.t/M.dur,0,1); p.x=lerp(M.x0,M.x1,k); p.y=lerp(M.y0,M.y1,k); if(Math.random()<0.5) p2Dust(p.x,p.y,1,'170,150,130'); if(k>=1) p2End(p,M.x1,M.y1); break; }
    case 'xclimb': p2XClimbStep(p,dt); break;
    case 'xarrive': { M.t+=dt; const k=clamp(M.t/M.dur,0,1); p.z=(1-k)*(M.up?18:30); if(k>=1){ p2End(p,p.x,p.y); P2.grace={x:p.x,y:p.y}; } break; }
    case 'zip': p2ZipStep(p,dt); break;
    case 'hang': p2HangStep(p,dt,inp); break;
    case 'drop': { M.vz+=980*dt; p.z=Math.max(0,p.z-M.vz*dt); if(p.z<=0) p2End(p,p.x,p.y); break; }
    case 'ride': p2RideStep(p,dt); break;
    case 'pop': { M.t+=dt; const k=clamp(M.t/M.dur,0,1); p.x=lerp(M.x0,M.x1,k); p.y=lerp(M.y0,M.y1,k); p.z=4*k*(1-k)*M.peak; if(k>=1){ p2End(p,M.x1,M.y1); p2Snd('sink',0.4); } break; }
  }
}
// ---- climbing
function p2ClimbPlan(p,dx,dy){ return AREA?p2ClimbPlanCave(p,dx,dy):p2ClimbPlanOut(p,dx,dy); }
function p2ClimbPlanOut(p,dx,dy){
  let f=0, fx=0, fy=0;
  for(const d of [5,9,13,17]){ const x=p.x+dx*d, y=p.y+dy*d, q=elevFace(x,y); if(q&EF.FACE){ f=q; fx=x; fy=y; break; } }
  if(!(f&EF.FACE)) return null;
  if(!(f&EF.CLIMB)) return {no:true};
  const here=elevLvl(p.x,p.y), tl=elevLvl(fx,fy), up=tl>here;
  const tries=[[dx,dy]]; if(Math.abs(dx)>0.15&&Math.abs(dy)>0.15) tries.push(Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]);
  for(const [ux,uy] of tries){ const t=up?ELEV.findHop(p.x,p.y,ux,uy,'up',here,tl):ELEV.findHop(p.x,p.y,ux,uy,'down',here); if(t) return {x0:p.x,y0:p.y,x1:t.x,y1:t.y,up,l0:here,l1:t.l}; }
  return {no:true,top:true};
}
function p2ClimbPlanCave(p,dx,dy){
  const A=AREA, C=A.p2, T=A.tri; if(!C||!C.climb.size||!T) return null;
  // from the last good spot (the dungeon puts Ash back there after a step onto another height)
  const ox=T.lx!=null&&dist(T.lx,T.ly,p.x,p.y)<40?T.lx:p.x, oy=T.lx!=null&&dist(T.lx,T.ly,p.x,p.y)<40?T.ly:p.y;
  const k0=tCell(ox,oy); if(k0<0) return null; const h0=dunH(k0); if(h0<0) return null;
  let k=-1, de=0; for(let d=2;d<=22;d+=2){ const q=tCell(ox+dx*d,oy+dy*d); if(q!==k0){ k=q; de=d; break; } }
  if(k<0) return null; const h1=dunH(k); if(h1<0||h1===h0||A.cave.grid[k]!==0) return null;
  if(!C.climb.has(h1>h0?k:k0)) return {no:true};
  const cs=A.cave.cell, depth=h1>h0?(dy<-0.6?22:18):(dy>0.6?cs*0.62+10:18);
  let ex=ox+dx*(de+depth), ey=oy+dy*(de+depth);
  if(!p2StandOK(ex,ey,h1)){ const q=tPos(k); ex=q.x; ey=q.y; if(!p2StandOK(ex,ey,h1)) return {no:true,top:true}; }
  return {x0:ox,y0:oy,x1:ex,y1:ey,up:h1>h0,l0:h0,l1:h1};
}
// Ash pushes into a climbable face for a moment (or steps onto a climb spot): up he goes
function p2ClimbCheck(p,dt,inp){
  if(!canClaws()||p.flying||(p.z||0)>0.5||p.hop||p.dead||P2.pull||G.fishing||(AREA&&AREA.dn&&AREA.dn.ride)){ P2.push=null; return; }
  if(P2.grace&&dist(p.x,p.y,P2.grace.x,P2.grace.y)>44) P2.grace=null;
  const ml=Math.hypot(inp.mx||0,inp.my||0); if(ml<0.45){ P2.push=null; return; }
  const dx=inp.mx/ml, dy=inp.my/ml, a=Math.atan2(dy,dx);
  if(AREA&&AREA.p2&&!P2.grace) for(const s of AREA.p2.spots){ if(!s.to||dist(p.x,p.y,s.x,s.y)>20) continue; p2XClimbStart(p,s); P2.push=null; return; }
  const plan=p2ClimbPlan(p,dx,dy);
  if(!plan||plan.no){ P2.push=null; if(plan&&plan.top) p2Say(p.x,p.y-40,S('No handhold at the top here','No way up here'),'#ffe6b0','ctop'); return; }
  if(!P2.push||Math.abs(angDiff(P2.push.a,a))>0.6) P2.push={t:0,a};
  P2.push.t+=dt; if(P2.push.t<0.1) return;
  P2.push=null; p2ClimbStart(p,plan);
}
function p2ClimbStart(p,plan){
  const len=Math.max(1,dist(plan.x0,plan.y0,plan.x1,plan.y1)), ux=(plan.x1-plan.x0)/len, uy=(plan.y1-plan.y0)/len;
  const face=plan.up?Math.atan2(uy,ux):Math.atan2(-uy,-ux);
  P2.mv={kind:'climb',plan,s:0,len,ux,uy,face,ph:0,grab:0.12,t:0,stepS:0};
  p.facing=face; p.faceGoal=face; p2Snd('grip'); p2Dust(p.x+ux*10,p.y+uy*10,5,'170,150,130');
  const c=p2Ctl();
  p2Tip('climb',S('Climbing','Climbing'),S(`Keep pushing to climb. Let go to hang on, push the other way to climb back, or press ${c.jump} to drop.`,`Keep pushing to climb. Press ${c.jump} to drop.`),2);
  if(G.stats) G.stats.p2climbs=(G.stats.p2climbs||0)+1;
}
function p2ClimbStep(p,dt,inp){
  const M=P2.mv, P=M.plan; M.t+=dt; if(M.grab>0) M.grab-=dt;
  if(inp.jump||!canClaws()){ if(inp.jump) P2.jumpLock=true; if(M.s>3) p2Slip(p); else p2End(p,P.x0,P.y0,true); return; }
  const along=(inp.mx||0)*M.ux+(inp.my||0)*M.uy, v=M.grab>0?0:along>0.3?1:along<-0.3?-1:0, spd=p2ClimbSpd();
  M.s=clamp(M.s+v*spd*dt,0,M.len); if(v){ M.ph+=v*dt*spd*0.115; M.stepS+=spd*dt; if(M.stepS>30){ M.stepS=0; p2Snd('grip',0.6); if(Math.random()<0.6) emit(p.x+rand(-8,8),p.y-6,2,{col:'170,150,130',glow:false,ang:Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.3,lmax:.5,zmin:1.5,zmax:2.5}); } }
  p.x=lerp(P.x0,P.x1,M.s/M.len); p.y=lerp(P.y0,P.y1,M.s/M.len); p.z=0; p.facing=M.face;
  if(M.s>=M.len){ p2End(p,P.x1,P.y1); p2Snd('top'); p2Dust(p.x,p.y+4,8); return; }
  if(M.s<=0&&v<0) p2End(p,P.x0,P.y0,true);
}
// knocked off (or let go): slide down to the foot
function p2Slip(p){
  const M=P2.mv; if(!M||M.kind!=='climb') return; const P=M.plan, lowX=P.up?P.x0:P.x1, lowY=P.up?P.y0:P.y1, d=dist(p.x,p.y,lowX,lowY);
  P2.mv={kind:'slip',x0:p.x,y0:p.y,x1:lowX,y1:lowY,t:0,dur:Math.max(0.08,d/420),face:M.face}; p2Snd('grip',0.8);
}
// ---- a climb spot between floors
function p2XClimbStart(p,s){ P2.mv={kind:'xclimb',s,t:0,dur:0.75,x0:p.x,y0:p.y,face:-Math.PI/2,up:s.up,ph:0}; p2Snd('grip'); }
function p2XClimbStep(p,dt){
  const M=P2.mv, s=M.s; M.t+=dt; const k=clamp(M.t/M.dur,0,1); M.ph+=dt*9;
  const k1=Math.min(1,k/0.3); p.x=lerp(M.x0,s.x,k1); p.y=lerp(M.y0,s.y,k1);
  p.z=M.up?k*26:0; M.alpha=k>0.7?1-(k-0.7)/0.3:1; if(Math.random()<dt*8) p2Snd('grip',0.5);
  if(k>=1&&!M.go){ M.go=true; const A=AREA; if(A&&A.dn) A.dn.go={to:s.to,arrive:{x:s.x,y:s.y}}; else if(typeof dunGoFloor==='function') dunGoFloor(s.to,{x:s.x,y:s.y}); }
}
// ---- the Grapple Tail: zip to a target, or hang from it
function p2ZipStart(p,t){
  const hang=t.kind==='hang'||!t.land, land=hang?null:t.land, z0=p.z||0;
  const x1=hang?t.x:land.x, y1=hang?t.y+2:land.y, z1=hang?P2N.hangZ:0, d=dist(p.x,p.y,x1,y1), from=!!(P2.mv&&P2.mv.kind==='hang');
  P2.mv={kind:'zip',t,hang,x0:p.x,y0:p.y,z0,x1,y1,z1,tt:0,thr:P2N.throwT,dur:Math.max(0.2,d/(P2N.zip*(1+P2N.zipK*hasSkill('hook2')))),arc:from?-10:Math.min(46,12+d*0.07),face:angTo(p.x,p.y,t.x,t.y),hook:0};
  p.facing=P2.mv.face; p.faceGoal=p.facing; P2.tgt=null; G.prompt=null; p2Snd('throw');
  if(G.stats) G.stats.p2zips=(G.stats.p2zips||0)+1;
}
function p2ZipStep(p,dt){
  const M=P2.mv;
  if(M.thr>0){ M.thr-=dt; M.hook=clamp(1-M.thr/P2N.throwT,0,1); if(M.thr<=0){ M.hook=1; p2Snd('clink'); p2Snd('zip',0.8); emit(M.t.x,M.t.y-M.t.h,8,{col:'255,220,140',smin:40,smax:140,lmin:.15,lmax:.35,zmin:1.2,zmax:2.4}); } return; }
  M.tt+=dt; const k=clamp(M.tt/M.dur,0,1), e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  p.x=lerp(M.x0,M.x1,e); p.y=lerp(M.y0,M.y1,e); p.z=Math.max(M.z0>0||M.hang?6:0,lerp(M.z0,M.z1,e)+M.arc*4*e*(1-e)); p.facing=M.face;
  p.iframes=Math.max(p.iframes,0.1);
  if(Math.random()<0.7) emit(p.x+rand(-6,6),p.y-p.z+rand(-8,4),1,{col:'240,236,226',glow:false,smin:5,smax:20,lmin:.2,lmax:.35,zmin:1,zmax:2,drag:2,alpha:0.5});
  if(k>=1){ if(M.hang) p2HangStart(p,M.t); else{ p2End(p,M.x1,M.y1); p2Dust(p.x,p.y+5,6); } }
}
function p2HangStart(p,t){
  P2.mv={kind:'hang',t,tt:0,x:t.x,y:t.y+2,face:p.facing}; p.z=P2N.hangZ; p2Snd('clink',0.6);
  const c=p2Ctl(); p2Tip('hang',S('Hanging on','Hanging on'),S(`Press ${c.use} when the next ring glows to swing over to it. Press ${c.jump} to let go.`,`Press ${c.use} at the next ring. ${c.jump} lets go.`),2);
}
function p2HangStep(p,dt,inp){
  const M=P2.mv; M.tt+=dt;
  p.x=M.x+Math.sin(M.tt*2.3)*3.2; p.y=M.y; p.z=P2N.hangZ+Math.cos(M.tt*4.6)*1.1;
  const ml=Math.hypot(inp.mx||0,inp.my||0); if(ml>0.3) M.face=turnTo(M.face,Math.atan2(inp.my,inp.mx),6*dt); p.facing=M.face;
  if(inp.use&&P2.tgt&&P2.tgt.o!==M.t.o){ p2Use(P2.tgt); return; }
  if(inp.jump){ P2.mv={kind:'drop',vz:0,face:M.face}; P2.jumpLock=true; p2Snd('snap',0.5); }
}
// ---- riding a shadow (a dash that starts in one)
function p2RidePath(p,dir){
  const ux=Math.cos(dir), uy=Math.sin(dir);
  if(!AREA) for(const o of mapList(P2.out,curMap())){
    if(o.p2!=='shadowlane'||!p2LaneOn(o)) continue; const q=p2PolyD(o.pts,p.x,p.y); if(q.d>o.w/2+4) continue;
    const a=p2PolyAt(o.pts,q.s), fwd=Math.cos(a[2])*ux+Math.sin(a[2])*uy>=0, pts=[[p.x,p.y]];
    let last=q.s;
    for(let s=q.s+(fwd?16:-16);fwd?s<=q.L:s>=0;s+=fwd?16:-16){ const r=p2PolyAt(o.pts,s); if(p2LitAt(r[0],r[1])) break; pts.push([r[0],r[1]]); last=s; }
    const e=p2PolyAt(o.pts,fwd?q.L:0); if(!p2LitAt(e[0],e[1])&&Math.abs((fwd?q.L:0)-last)<16){ pts.push([e[0],e[1]]); }
    const len=p2PolyLen(pts); if(len<30) return null; return {pts,len};
  }
  let ax=ux, ay=uy;
  if(AREA&&AREA.p2) for(const s of AREA.p2.strips){ if(!p2StripOn(s)||segD(p.x,p.y,s.x0,s.y0,s.x1,s.y1)>s.w/2) continue; const L=dist(s.x0,s.y0,s.x1,s.y1)||1, sx=(s.x1-s.x0)/L, sy=(s.y1-s.y0)/L, dd=sx*ux+sy*uy; if(Math.abs(dd)>0.35){ ax=sx*Math.sign(dd); ay=sy*Math.sign(dd); } break; }
  let last=0, gap=0;
  for(let s=8;s<=1400;s+=8){ const x=p.x+ax*s, y=p.y+ay*s;
    if(AREA){ const k=tCell(x,y), c=AREA.cave; if(k<0||(c.grid[k]===1&&c.typ[k]!==1)) break; }
    if(p2ShadeAt(x,y)){ last=s; gap=0; } else { gap+=8; if(gap>16) break; } }
  if(last<36) return null;
  return {pts:[[p.x,p.y],[p.x+ax*last,p.y+ay*last]],len:last};
}
function p2RideStart(p,R,dir){
  P2.mv={kind:'ride',pts:R.pts,len:R.len,s:0,face:dir}; p.iframes=Math.max(p.iframes,R.len/P2N.ride+0.3); p.facing=dir;
  p2Snd('sink'); p2Snd('dash',0.6); for(let i=0;i<10;i++) emit(p.x+rand(-12,12),p.y+rand(-6,6),1,{col:'110,70,170',glow:false,smin:10,smax:50,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6,alpha:0.6});
  if(G.stats) G.stats.p2rides=(G.stats.p2rides||0)+1;
}
function p2RideStep(p,dt){
  const M=P2.mv; M.s=Math.min(M.len,M.s+P2N.ride*dt); const q=p2PolyAt(M.pts,M.s); p.x=q[0]; p.y=q[1]; p.z=0; M.face=q[2]; p.facing=q[2];
  p.iframes=Math.max(p.iframes,0.1); p2ShadowTouch(p,M);
  P2.trail.push({x:p.x,y:p.y,f:q[2],a:0.55,ride:true}); if(Math.random()<0.5) emit(p.x+rand(-10,10),p.y+rand(-4,4),1,{col:'150,110,220',smin:5,smax:30,lmin:.25,lmax:.5,zmin:1,zmax:2,drag:2,rise:-10,alpha:0.6});
  if(M.s>=M.len) p2RideEnd(p,q[2]);
}
// a foe (or a boss) may react when a shadow goes through it, or rides the shadow it stands in: e.onShadow(e,{dash|ride})
function p2ShadowTouch(p,M){
  M.hit=M.hit||new Set();
  for(const e of G.enemies){ if(e.dead||!e.onShadow||M.hit.has(e.id)) continue; if(dist2(e.x,e.y,p.x,p.y)<((e.r||14)+p.r)**2){ M.hit.add(e.id); try{ e.onShadow(e,{ride:true}); }catch(err){ console.warn(err); } } }
}
// thin barriers (iron bars, a crack in an ice wall, bone bars): any collider can be made passable to a shadow.
// p2Thin(c[, when(c)]) returns c; while Ash is a shadow (and when() says so) the collider is off for him only.
function p2Thin(c,when){
  if(!c||c.p2thin) return c; c.p2thin=true;
  const d=Object.getOwnPropertyDescriptor(c,'off'), get0=d&&d.get?d.get:null, set0=d&&d.set?d.set:null; let off=d&&!d.get?!!d.value:false;
  Object.defineProperty(c,'off',{get(){ return (get0?get0.call(c):off)||(P2.pass>0&&(!when||!!when(c))); },set(v){ if(set0) set0.call(c,v); else off=!!v; },configurable:true,enumerable:true});
  return c;
}
function p2RideEnd(p,ang){
  const ok=(x,y)=>p2StandOK(x,y,null)&&(AREA||!playerBlocked(x,y));
  if(ok(p.x,p.y)){ p2End(p,p.x,p.y,true); p2Snd('sink',0.4); p2Dust(p.x,p.y+3,6,'110,80,150'); return; }
  const ux=Math.cos(ang), uy=Math.sin(ang);
  for(let s=12;s<=P2N.popMax;s+=12){ const x=p.x+ux*s, y=p.y+uy*s; if(ok(x,y)){ P2.mv={kind:'pop',x0:p.x,y0:p.y,x1:x,y1:y,t:0,dur:0.16+s/900,peak:16+s*0.08,face:ang}; return; } }
  p2End(p,p.x,p.y);
}

// ---------- 8. the Shadow Dash (the roll button, once Ash has the power)
function p2DashOK(p){
  if(!canShadow()||P2.dashCd>0||p.dashCd>0||p.dashT>0||p.drinkT>0||airborne()||(p.z||0)>0||p.flying||p.dead||p.hop) return false;
  if(typeof p4RollTakes==='function'&&p4RollTakes()) return false;
  if(G.fishing||(AREA&&AREA.dn&&AREA.dn.ride)||(AREA&&AREA.c2&&(AREA.c2.lock||AREA.c2.slide))) return false;
  return true;
}
function p2DashStart(p,inp){
  if(!useStamina(p.stats.rollCost)) return false;
  G.dashBuf=0; const mv=Math.hypot(inp.mx||0,inp.my||0)>0.05, dir=mv?Math.atan2(inp.my,inp.mx):p.facing;
  P2.dashCd=P2N.dashCd; p.dashCd=P2N.dashCd; p.facing=dir; p.faceGoal=dir; p.swingT=0;
  if(p2ShadeAt(p.x,p.y)){ const R=p2RidePath(p,dir); if(R){ p2RideStart(p,R,dir); return true; } }
  P2.dash={dir,t:0,T:P2N.dashT,D:p2DashLen(),s:0,hit:new Set(),x0:p.x,y0:p.y,through:0};
  p.iframes=Math.max(p.iframes,P2N.dashT+0.12);
  p2Snd('dash'); for(let i=0;i<8;i++) emit(p.x+rand(-8,8),p.y+rand(-6,6),1,{col:'90,60,140',glow:false,smin:20,smax:80,lmin:.25,lmax:.5,zmin:2,zmax:4,grow:6,alpha:0.7});
  if(G.stats) G.stats.p2dash=(G.stats.p2dash||0)+1;
  return true;
}
// what stops a dash: walls, cliffs, deep water (without Water Stride), pits, the edge of a raised floor. Not curtains,
// bars or beams (P2.pass is up while Ash moves), not foes.
function p2DashBlocked(p,x,y){
  if(AREA){ if(areaBlocked(x,y)) return true; if(!AREA.tri) return false; const c=AREA.cave, k=tCell(x,y), k0=tCell(p.x,p.y); if(k<0) return true;
    if(tHole(k)&&!dunCovered(k)) return true; if(tWet(k)&&!canWalkWater()) return true; if(c.typ[k]===TY.chasm) return true;
    if(k!==k0&&k0>=0){ const h0=dunH(k0), h1=dunH(k); if(h0>=0&&h1>=0&&h0!==h1&&(h1>h0||c.typ[k0]!==TY.ledge)) return true; }
    return false; }
  if(playerBlocked(x,y)) return true;
  if(!elevMoveOK(p.x,p.y,x,y)) return true;
  return false;
}
function p2DashStep(p,dt){
  const D=P2.dash; D.t+=dt; const k=clamp(D.t/D.T,0,1), s1=D.D*(1-(1-k)*(1-k)), ds=s1-D.s; D.s=s1;
  const ux=Math.cos(D.dir), uy=Math.sin(D.dir), x0=p.x, y0=p.y; let stop=false;
  P2.pass++;
  try{ const n=Math.max(1,Math.ceil(ds/5)), st=ds/n;
    for(let i=0;i<n;i++){ const nx=p.x+ux*st, ny=p.y+uy*st; if(p2DashBlocked(p,nx,ny)){ stop=true; break; } p.x=nx; p.y=ny; }
    const bx=p.x, by=p.y; collideObs(p); if(!AREA&&elevFace(p.x,p.y)&EF.FACE){ p.x=bx; p.y=by; }
  } finally{ P2.pass--; }
  p.facing=D.dir; p.iframes=Math.max(p.iframes,0.1);
  // Shadow Strike (dash2): it singes every foe it passes through
  const rk=hasSkill('dash2');
  for(const e of G.enemies){ if(e.dead||e.invuln||e.spawnIn>0||e.passive||D.hit.has(e.id)) continue;
    if(segD(e.x,e.y,x0,y0,p.x,p.y)<(e.r||14)+p.r*0.8){ D.hit.add(e.id); D.through++; if(e.onShadow) try{ e.onShadow(e,{dash:true}); }catch(err){ console.warn(err); }
      if(rk>0){ damageEnemy(e,wPower()*(0.45+0.25*rk)*rand(0.9,1.1),{src:'shadow',kb:90,ka:D.dir}); if(!e.dead&&!e.lastBlocked){ e.burnT=Math.max(e.burnT||0,1.4); e.burnDps=Math.max(e.burnDps||0,2.4*rk*p.stats.fire*p.stats.dmgMul); } emit(e.x,e.y,8,{col:'170,110,255',smin:40,smax:140,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); } } }
  P2.trail.push({x:p.x,y:p.y,f:D.dir,a:0.6});
  // the curtains and bars ripple as a shadow slips through them
  if(AREA&&AREA.p2){ const k=tCell(p.x,p.y), c=AREA.cave, g=k>=0&&c.dyn[k]?AREA.gates[c.dyn[k]-1]:null; if(g&&g.p2t){ g.rip=0.45; if(g.p2t==='moth'&&Math.random()<0.6) emit(p.x,p.y-20,2,{col:'210,205,225',glow:false,smin:30,smax:90,lmin:.3,lmax:.7,zmin:1,zmax:2,drag:2,alpha:0.7}); } }
  else if(!AREA) for(const o of mapList(P2.out,curMap())) if((o.p2==='mothcurtain'||o.p2==='shadowbars'||o.p2==='thinbars')&&p2InRect(p.x,p.y,o,p.r)){ o.rip=0.45; if(o.p2==='mothcurtain'&&Math.random()<0.6) emit(p.x,p.y-20,2,{col:'210,205,225',glow:false,smin:30,smax:90,lmin:.3,lmax:.7,zmin:1,zmax:2,drag:2,alpha:0.7}); }
  if(Math.random()<0.8) emit(p.x-ux*10+rand(-5,5),p.y-uy*10+rand(-5,5),1,{col:'120,80,190',smin:5,smax:30,lmin:.25,lmax:.5,zmin:1.5,zmax:3,drag:2,alpha:0.6});
  if(stop||k>=1){ P2.dash=null; if(stop){ p2Dust(p.x+ux*12,p.y+uy*12,5,'120,100,140'); shake(1); } }
}

// ---------- 9. pulling a chain (hold USE and walk away), and the Reel-In's yanks
function p2PullStart(p,t){
  P2.pull={t,rope:Math.max(40,dist(p.x,p.y,t.x,t.y)),strain:0,acc:0,tt:0,sndT:0,hook:0,taut:false};
  P2.tgt=null; G.prompt=null; p2Snd('throw');
  const c=p2Ctl(); p2Tip('pull',S('Pulling','Pulling'),S(`Keep holding ${c.use} and walk away to pull. Let go to unhook.`,`Hold ${c.use} and walk away to pull!`),3);
}
function p2PullAnchor(P){ const t=P.t, o=t.o; if(t.src==='foering') return [t.foe.x+(o.dx||0),t.foe.y+(o.dy||0)]; if(t.src==='bridge') return AREA?[o.rx,o.ry]:[o.ring.x,o.ring.y]; return [o.x,o.y]; }
function p2PullEnd(snap){ const P=P2.pull; if(!P) return; P2.pull=null; const [ax,ay]=p2PullAnchor(P); P2.retract={x:ax,y:ay-P.t.h,t:0}; p2Snd(snap?'snap':'clink',0.5); }
function p2PullStep(p,dt,inp){
  const P=P2.pull, t=P.t, o=t.o; P.tt+=dt; P.hook=Math.min(1,P.hook+dt/P2N.throwT); if(P.hook>=1&&!P.clinked){ P.clinked=true; p2Snd('clink'); }
  if((!P2.useHeld&&P.tt>0.12)||p.flying||(p.z||0)>4||(t.foe&&t.foe.dead)||o.done||o.down){ p2PullEnd(false); return; }
  const [ax,ay]=p2PullAnchor(P), d=Math.max(1,dist(p.x,p.y,ax,ay));
  if(d>p2Range()*1.4){ p2PullEnd(true); return; }
  const ux=(p.x-ax)/d, uy=(p.y-ay)/d, away=((inp.mx||0)*ux+(inp.my||0)*uy)>0.3; P.taut=false;
  if(d>P.rope&&P.hook>=1){
    const ex=d-P.rope, gave=p2Give(P,ex,ux,uy);
    if(ex-gave>0.5){ const bx=p.x, by=p.y; p.x=ax+ux*(P.rope+0.5); p.y=ay+uy*(P.rope+0.5); if(playerBlocked(p.x,p.y)){ p.x=bx; p.y=by; } P.taut=true; if(away) P.strain+=dt; }
  }
  if(!P.taut) P.strain=Math.max(0,P.strain-dt*0.6);
  if(P.taut&&away){ P.sndT-=dt; if(P.sndT<=0){ P.sndT=0.32; p2Snd('strain'); } if(Math.random()<0.4) p2Dust(p.x-ux*8,p.y-uy*8+6,1); }
  p2Strain(P,dt);
}
// how far the hooked thing slides toward Ash this frame (a fixed ring gives nothing: Ash strains instead)
function p2Give(P,ex,ux,uy){
  const t=P.t, o=t.o;
  if(t.src==='crate'){ let mx=ux*ex, my=uy*ex; if(o.axis==='x') my=0; else if(o.axis==='y') mx=0;
    const nx=o.x+mx, ny=o.y+my; if(dist(nx,ny,o.hx,o.hy)>o.travel) return 0;
    if(p2CrateBlocked(o,nx,ny)) return 0;
    p2CrateMove(o,nx,ny); return Math.hypot(mx,my); }
  if(t.src==='block'){ if(o.anim>0) return ex; P.acc+=ex;
    if(P.acc<26) return ex;
    P.acc=0; const di=Math.abs(ux)>=Math.abs(uy)?Math.sign(ux):0, dj=di?0:Math.sign(uy);
    if(p2BlockStep(o,di,dj)){ P.rope=Math.max(40,P.rope-AREA.cave.cell*0.4); return ex; }
    p2Say(o.x,o.y-30,S('Stuck!','Stuck!'),'#ffd9a0','bstuck',1); return 0; }
  return 0;
}
function p2CrateBlocked(o,x,y){
  const hw=o.w/2-2, hh=o.h/2-2;
  for(const [dx,dy] of [[0,0],[-hw,-hh],[hw,-hh],[-hw,hh],[hw,hh],[0,hh],[0,-hh],[-hw,0],[hw,0]]){ const px=x+dx, py=y+dy;
    if(o.inArea){ if(areaBlocked(px,py)) return true; } else { if(blockedAt(px,py)) return true; if(elevFace(px,py)&EF.FACE) return true; } }
  let hit=false; forCols(x,y,Math.max(o.w,o.h),c=>{ if(hit||c===o.col||!colActive(c)) return; if(c.t==='c'){ const qx=clamp(c.x,x-o.w/2,x+o.w/2), qy=clamp(c.y,y-o.h/2,y+o.h/2); if(dist2(qx,qy,c.x,c.y)<c.r*c.r) hit=true; } else if(x-o.w/2<c.x1&&x+o.w/2>c.x0&&y-o.h/2<c.y1&&y+o.h/2>c.y0) hit=true; });
  return hit;
}
function p2CrateMove(o,x,y){
  if(o.col) removeCol(o.col); o.x=x; o.y=y; o.col={t:'r',x0:x-o.w/2,y0:y-o.h/2,x1:x+o.w/2,y1:y+o.h/2}; if(o.inArea&&AREA) addAreaCol(o.col); else addCol(o.col);
  o.rumT=0.15; if(Math.random()<0.25) p2Dust(x+rand(-o.w/2,o.w/2),y+o.h/2,1);
  G.found['p2pb_'+o.id]=[Math.round(x),Math.round(y)];
  if(o.goal&&!o.done&&dist(x,y,o.goal.x,o.goal.y)<(o.goal.r||30)){ o.done=true; G.found[o.id]=true; p2PullEnd(false); jingle('secret','shrine'); shake(3); setBanner(S('Click!','Click!'),'',1.4); if(o.then) o.then(o); saveGame(); }
}
// a chain block moves one cell (the push rules of a2f_caves.js, the other way round)
function p2BlockStep(b,di,dj){
  const A=AREA, c=A.cave, cs=c.cell, ni=b.ci+di, nj=b.cj+dj, k=nj*c.w+ni, R=A.rooms[b.room];
  if(!R||(!di&&!dj)) return false;
  const inRoom=ni>R.ox&&ni<=R.ox+R.iw&&nj>R.oy&&nj<=R.oy+R.ih, px=A.x0+(ni+0.5)*cs, py=A.y0+(nj+0.5)*cs;
  if(dist(player.x,player.y,px,py)<cs*0.5+player.r) return false;
  if(inRoom&&c.grid[k]===0&&!caveBlockedAt(k)&&typeof trialBlockInto==='function'&&trialBlockInto(b,ni,nj,k)){ p2Snd('clunk',0.6); return true; }
  if(!inRoom||c.grid[k]!==0||c.typ[k]===1||caveBlockedAt(k)||(c.typ[k]>=3&&c.typ[k]!==TY.rune&&c.typ[k]!==TY.high&&c.typ[k]!==TY.ledge)||A.objs.some(o=>(o.k==='resetstone'||o.k==='cchest'||o.k==='crystal'||o.k==='dchest')&&Math.abs(o.x-px)<cs*0.6&&Math.abs(o.y-py)<cs*0.6)) return false;
  b.fx=b.x; b.fy=b.y; b.ci=ni; b.cj=nj; b.anim=0.2; p2Snd('clunk',0.7); shake(1.5); return true;
}
// a fixed ring: enough pulling (o.need seconds) and the thing gives
function p2Strain(P,dt){
  const t=P.t, o=t.o, need=o.need||P2N.need;
  if(t.src==='foering'){ if(o.onPull) o.onPull(o,t.foe,{strain:P.strain,dt,taut:P.taut}); if(P.strain>=need){ if(!o.repeat) o.done=true; P.strain=0; p2PullEnd(true); jingle('secret','block'); shake(4); if(o.then) o.then(o,t.foe); } return; }
  if(t.src==='chain'){ o.strain=P.strain; if(o.onPull) o.onPull(o,{strain:P.strain,dt,taut:P.taut}); if(P.strain<need) return;
    o.done=true; o.strain=0; G.found[o.id]=true; p2PullEnd(true); p2Snd('clunk'); shake(4); jingle('secret','block');
    if(o.mode==='room'&&AREA){ const R=AREA.rooms[o.room]; if(R&&R.onPull) R.onPull(R,{o}); else if(R&&!R.solved) solveRoom(R); refreshCaveGates(); }
    if(o.then) o.then(o); saveGame(); return; }
  if(t.src==='bridge'){ o.strain=P.strain; if(P.strain<need) return;
    o.down=true; o.strain=0; G.found[o.id]=true; p2PullEnd(true); p2Snd('clunk'); shake(6);
    if(AREA&&AREA.p2&&o.cells){ for(const k of o.cells) AREA.p2.cover.add(k); } setBanner(S('The drawbridge drops!','The bridge is down!'),'',1.6);
    if(o.then) o.then(o); saveGame(); }
}
function p2Yank(p,t){
  const o=t.o; P2.retract={x:t.x,y:t.y-t.h,t:0,out:true}; p2Snd('throw'); p2Snd('clink',0.6);
  if(t.src==='shield'){ const e=o; e.p2sh=e.shield; e.shield=false; e.blocking=false; e.p2shT=8; stunEnemy(e,0.7); P2.yanks.push({k:'shield',x0:e.x,y0:e.y,t:0}); ftext(e.x,e.y-e.r-14,S('Yoink!','Yoink!'),'#ffe0b0',14); return; }
  if(t.src==='foe'){ P2.yanks.push({k:'foe',e:o,x0:o.x,y0:o.y,t:0}); stunEnemy(o,0.9); return; }
  if(t.src==='lever'){ if(o.k==='plever'&&typeof leverPull==='function') leverPull(o); else caveObjAct(o); ftext(o.x,o.y-30,S('Yank!','Yank!'),'#ffe0b0',12); }
}
function p2YankTick(dt){
  const p=player;
  for(const Y of P2.yanks){ Y.t+=dt; const k=clamp(Y.t/0.24,0,1);
    if(Y.k==='foe'&&Y.e&&!Y.e.dead){ const tx=p.x+Math.cos(p.facing)*30, ty=p.y+Math.sin(p.facing)*30; Y.e.x=lerp(Y.x0,tx,k*k); Y.e.y=lerp(Y.y0,ty,k*k); }
    if(k>=1) Y.done=true; }
  if(P2.yanks.length) P2.yanks=P2.yanks.filter(Y=>!Y.done);
  for(const e of G.enemies) if(e.p2shT>0){ e.p2shT-=dt; e.shield=false; e.blocking=false; if(e.p2shT<=0){ e.shield=e.p2sh; e.p2shT=0; } }
}

// ---------- 10. every frame, and the wrappers
function p2Reset(all){
  if(P2.mv&&player&&!player.dead){ player.z=0; } P2.mv=null; P2.dash=null; P2.pull=null; P2.push=null; P2.tgt=null; P2.trail=[]; P2.grace=null;
  if(all){ P2.tips={}; P2.yanks=[]; P2.retract=null; }
}
function p2Sync(p){
  if(P2.g!==G){ P2.g=G; p2Reset(true); P2.area=AREA; p2Restore(); }
  if(P2.area!==AREA){ const M=P2.mv; P2.area=AREA;
    if(M&&M.kind==='xclimb'&&M.go){ P2.mv={kind:'xarrive',t:0,dur:0.45,up:M.s.up,face:-Math.PI/2}; P2.dash=null; P2.pull=null; }
    else p2Reset(); }
  if(p.dead) p2Reset();
  else if(P2.mv&&P2.lx!=null&&dist2(p.x,p.y,P2.lx,P2.ly)>160*160&&P2.mv.kind!=='xarrive') p2Reset();
}
// outdoor pieces are built once with the world: a new game or a loaded save sets what was pulled from G.found
function p2Restore(){
  const F=(G&&G.found)||{};
  for(const o of P2.out){
    if(o.p2==='chainring'){ o.done=!!F[o.id]; o.strain=0; }
    else if(o.p2==='pullblock'){ const s=F['p2pb_'+o.id], x=s&&s.length===2?s[0]:o.hx, y=s&&s.length===2?s[1]:o.hy;
      if(x!==o.x||y!==o.y){ if(o.col) removeCol(o.col); o.x=x; o.y=y; o.col={t:'r',x0:x-o.w/2,y0:y-o.h/2,x1:x+o.w/2,y1:y+o.h/2}; addCol(o.col); }
      o.done=!!F[o.id]; }
    else if(o.p2==='drawbridge'){ o.down=!!F[o.id]; o.a=o.down?1:0; }
  }
}
function p2After(p){
  P2.lx=p.x; P2.ly=p.y;
  // the elevation tip "climbing claws could climb this" is for Ash without them
  if(canClaws()&&typeof ELV!=='undefined'&&ELV.tipT) ELV.tipT.climb=G.time;
}
function p2WorldTick(dt){
  P2.t+=dt; if(P2.dashCd>0) P2.dashCd-=dt; if(P2.flinchT>0) P2.flinchT-=dt;
  p2Lights(dt);
  for(const o of p2Objs()){ const K=o.p2&&P2K[o.p2]; if(K&&K.tick) K.tick(o,dt); if(o.rumT>0) o.rumT-=dt; }
  if(AREA&&AREA.p2) p2CaveTick(AREA,dt);
  for(let i=P2.trail.length-1;i>=0;i--){ const g=P2.trail[i]; g.a-=dt*2.6; if(g.a<=0) P2.trail.splice(i,1); }
  if(P2.trail.length>40) P2.trail.splice(0,P2.trail.length-40);
  if(P2.retract){ P2.retract.t+=dt; if(P2.retract.t>0.22) P2.retract=null; }
  p2YankTick(dt);
}
const p2Calm=inp=>Object.assign({},inp,{mx:0,my:0,attack:false,fire:false,jump:false,jumpHeld:false,roll:false,use:false,drink:false,sprint:false,whistle:false,wNext:false,wPrev:false,wSel:-1});
{ const base=updatePlayer; updatePlayer=function(dt,inp){
  const p=player; if(!p||!G) return base(dt,inp);
  p2Sync(p); P2.inp=inp; p2WorldTick(dt);
  if(P2.mv){ p2Tick(p,dt); p2MoveStep(p,dt,inp); p2After(p); return; }
  if(!P2.dash&&!P2.pull&&G.dashBuf>0&&p2DashOK(p)&&p2DashStart(p,inp)&&P2.mv){ p2Tick(p,dt); p2After(p); return; }
  if(P2.dash){ P2.pass++; try{ base(dt,p2Calm(inp)); } finally{ P2.pass--; } if(P2.dash) p2DashStep(p,dt); p2After(p); return; }
  let q=inp; if(P2.pull){ q=Object.assign({},inp,{mx:(inp.mx||0)*0.6,my:(inp.my||0)*0.6,sprint:false,roll:false,jump:false}); G.dashBuf=0; }
  base(dt,q);
  if(P2.pull&&!P2.mv) p2PullStep(p,dt,inp);
  if(!P2.mv&&!P2.dash) p2ClimbCheck(p,dt,inp);
  p2After(p);
}; }
// foes never shove Ash off a cliff face or out of a dash
{ const base=separate; separate=function(){ const p=player; if(p&&(P2.mv||P2.dash)){ const x=p.x, y=p.y; base(); p.x=x; p.y=y; return; } base(); }; }
// a hit knocks him off a climb (he slides down), off a ring (he drops) and off a chain (he lets go)
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){
  const r=base(amt,sx,sy,kb);
  if(r&&player&&!player.dead){ const M=P2.mv; if(M&&M.kind==='climb') p2Slip(player); else if(M&&M.kind==='hang'){ P2.mv={kind:'drop',vz:0,face:M.face}; } if(P2.pull) p2PullEnd(true); }
  return r; }; }
// a lowered drawbridge outdoors is walkable (never over a cliff face)
{ const base=blockedAt; blockedAt=function(x,y){ if(P2.br.length&&x<IZX-50&&p2BridgeAt(x,y)&&!(elevFace(x,y)&1)) return false; return base(x,y); }; }
{ const base=playerBlocked; playerBlocked=function(x,y){ if(P2.br.length&&x<IZX-50&&p2BridgeAt(x,y)&&!(elevFace(x,y)&1)) return false; return base(x,y); }; }
// holding USE (E or F, the left-handed key, the touch USE button, SLASH while it says USE, the controller's top button)
{ const base=readInput; readInput=function(dt){
  const o=base(dt); const K=c=>keys.has(c);
  let h=K('KeyE')||K('KeyF')||(typeof LEFT_KEYS!=='undefined'&&LEFT_KEYS.use.some(K))||!!(touch.held&&touch.held.use)||ATK.press==='use';
  try{ if(!h&&padActive()&&PAD.s&&PAD.s.cur[PB.N]&&!PAD.s.block[PB.N]) h=true; }catch(e){}
  P2.useHeld=h;
  // the JUMP that let go of a wall is not also a jump (or a hop back up the ledge) once he lands
  if(P2.jumpLock){ if(o.jump||o.jumpHeld){ o.jump=false; o.jumpHeld=false; } else P2.jumpLock=false; }
  return o; }; }
PK_LABEL.grab='GRAB'; PK_LABEL.pull='PULL';
// the grapple target and its prompt (USE grapples; on touch and controllers too, the SLASH button says GRAB)
{ const base=updateInteractions; updateInteractions=function(dt){
  base(dt);
  const p=player; P2.tgt=null; if(!p||!G||p.dead) return;
  if(P2.pull||(P2.mv&&P2.mv.kind!=='hang')||P2.dash){ if(P2.pull||P2.mv) G.prompt=null; return; }
  if(!canGrapple()||p.flying||((p.z||0)>2&&!P2.mv)) return;
  const t=p2Pick(p,P2.inp||{mx:0,my:0}); P2.tgt=t;
  if(t&&(!G.prompt||P2.mv)){ G.prompt={text:p2TgtText(t),act:()=>p2Use(t),x:t.x,y:t.y-t.h,always:true,kind:t.kind==='pull'?'pull':'grab'};
    const c=p2Ctl(); if(t.kind==='pull') p2Tip('chain',S('A chain ring','A chain ring'),S(`Press ${c.use} to hook it with your tail, then keep holding ${c.use} and walk away to pull.`,`Press ${c.use}, then hold it and walk away.`),1);
    else p2Tip('ring',S('Grapple Tail','Grapple Tail'),S(`The gold ring shows what your tail can reach. Press ${c.use} to zip over.`,`Press ${c.use} at the gold ring to zip over!`),2); }
}; }
// the moment Ash gets one of the three powers
{ const base=grantAbility; grantAbility=function(id){
  const had=!!(G&&G.abil&&G.abil[id]); base(id);
  if(had||!player||(id!=='claws'&&id!=='grapple'&&id!=='shadow')) return;
  const p=player;
  if(id==='claws'){ for(let i=0;i<24;i++){ const a=rand(0,TAU); emit(p.x+Math.cos(a)*10,p.y+Math.sin(a)*8,1,{col:'255,236,200',ang:a,spread:0.3,smin:60,smax:160,lmin:.2,lmax:.5,zmin:1.5,zmax:3}); } p2Snd('grip'); later(0.15,()=>p2Snd('grip')); }
  if(id==='grapple'){ P2.retract={x:p.x+Math.cos(p.facing)*90,y:p.y+Math.sin(p.facing)*90-40,t:0,out:true}; p2Snd('throw'); later(0.12,()=>p2Snd('clink')); }
  if(id==='shadow'){ for(let i=0;i<30;i++) emit(p.x+rand(-14,14),p.y+rand(-8,8),1,{col:'110,70,170',glow:false,smin:20,smax:90,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:8,alpha:0.7}); p2Snd('dash'); }
}; }
// fire breath on a moth curtain: the moths love fire, they just flutter
{ const base=breathWorld; breathWorld=function(mx,my,ang,dt){
  base(mx,my,ang,dt);
  if(P2.flinchT>0) return;
  const near=(x,y,r)=>inArcC(mx,my,ang,175,0.45,{x,y,r});
  let hit=null;
  if(AREA&&AREA.p2){ for(const o of AREA.p2.gates) if(o.p2t==='moth'&&!p2GateOpen(o)&&near(o.x,o.y,30)){ hit=o; break; } }
  else for(const o of mapList(P2.out,curMap())) if(o.p2==='mothcurtain'&&!p2CurtainOpen(o)&&near(o.x,o.y,Math.max(o.w,o.h)/2)){ hit=o; break; }
  if(hit){ P2.flinchT=3; p2Snd('moths'); ftext(hit.x,hit.y-40,S('The moths love fire. They just flutter.','Moths love fire!'),'#e6dcf0',13);
    if(canShadow()) p2Tip('fire',S('Moth curtain','Moth curtain'),S(`Moths cannot catch a shadow. Press ${p2Ctl().roll} to Shadow Dash through.`,`Dash through as a shadow!`),1); }
}; }
// looking at a curtain or bars
{ const base=caveGatePrompt; caveGatePrompt=function(o){ if(o&&o.p2t) return o.closed&&!o.tmp?(o.p2t==='moth'?S('Look at the moth curtain','Look at the moths'):S('Look at the shadow bars','Look at the bars')):null; return base.apply(this,arguments); }; }
{ const base=caveObjAct; caveObjAct=function(o){
  if(o&&o.k==='cgate'&&o.p2t&&!o.tmp){ const t=o.p2t==='moth'?(canShadow()?S('A curtain of gray moths, thick as wool. They shrink from bright light. And a shadow, they cannot catch at all.','Moths! Light scares them. A shadow can slip through.'):S('A curtain of gray moths, thick as wool. They will not let you through. Bright light makes them shrink away.','Moths! Bright light scares them.'))
      :(canShadow()?S('Bars made of shadow. A shadow could slip between them, as long as no light is on them.','Shadow bars. Dash through when it is dark.'):S('Bars made of shadow, cold as winter. Nothing solid gets through.','Shadow bars. Nothing gets through.'));
    runDialogue([['narr',t]],()=>{ scene='play'; }); return true; }
  return base.apply(this,arguments); }; }

// ---------- 11. drawing: Ash climbing, hanging and as a shadow
const P2V={tail:[0,0],tailT:-1,s1:[0,0,0]};
// the 3D figure on a wall (climb) or hanging from a ring by his tail (hang), built from the same parts as a10c_t3ash.js
function p2Ash3D(p,kind,M){
  const pal=ASHP, t=p.t||0, k=1, bz=HZ, z=Math.max(0,p.z||0);
  AFINE=k*zoom>=1.5; for(const km in AM) AM[km].on=false;
  const hR=[0,0,0], hL=[0,0,0], fR=[0,0,0], fL=[0,0,0];
  let pitch=0, roll=0, hp=0, csway=Math.sin(t*1.7)*0.4, cfl=0.5, clift=0;
  if(kind==='climb'){ const s=Math.sin(M.ph||0);
    vSet(hR,1.2,9.8,bz+21.6+3.2*s); vSet(hL,1.2,-9.8,bz+21.6-3.2*s);
    vSet(fR,2.8,3.6,2.2+4.8*Math.max(0,-s)); vSet(fL,2.8,-3.6,2.2+4.8*Math.max(0,s));
    pitch=0.16; hp=-0.45; clift=0.6;
  }else{ const sw=Math.sin(t*2.3);
    vSet(hR,0.6,1.9,bz+21.4); vSet(hL,0.6,-1.9,bz+21.4);
    vSet(fR,1.4+sw*1.8,3.0,-0.2); vSet(fL,-0.6+sw*1.8,-3.0,0.6);
    roll=sw*0.07; hp=-0.28; cfl=1.4; csway=sw*1.8;
  }
  for(const sd of [-1,1]){ const H=sd>0?hR:hL, sx=0.2, sy=sd*6.4, sz=bz+9.6, dx=H[0]-sx, dy=H[1]-sy, dz=H[2]-sz, d=Math.hypot(dx,dy,dz); if(d>ASH_ARM){ const q=ASH_ARM/d; H[0]=sx+dx*q; H[1]=sy+dy*q; H[2]=sz+dz*q; } }
  t3Begin(p.x,p.y+6,M.face,{k,flash:p.hurtFlash>0,alpha:M.alpha==null?1:M.alpha,z:z/(T3.st*k),g:ctx});
  arReset();
  if(pitch||roll){ arMove(0,0,10); arPitch(pitch); arRoll(roll); arMove(0,0,-10); }
  for(const sd of [-1,1]){ const F=sd>0?fR:fL, y=F[1];
    aL(0.2,sd*3.0,bz+1.2,F[0]-0.2,y,F[2]+3.6,2.5,pal.skin,2.3);
    aL(F[0]-0.25,y,F[2]+4.6,F[0]+0.1,y,F[2]+1.6,2.75,pal.boot,2.6);
    aE(F[0]+1.5,y,F[2]+1.55,3.5,2.45,1.75,pal.boot); }
  // the tail hangs down the wall, or curls up over his head as the rope
  { let px=-3.4, py=0, pz=bz-0.8, r=3.7; const TR=[3.7,2.9,2.0,1.15];
    for(let i=1;i<=3;i++){ const sw=Math.sin(t*2.4-i*0.8)*(0.5+i*1.1); let x,y,zz;
      if(kind==='hang'){ x=px-1.8+i*0.2; y=sw*0.5; zz=pz+5+i*1.8; } else { x=px-3.2; y=sw; zz=Math.max(1,pz-3.4); }
      aL(px,py,pz,x,y,zz,r,pal.skin,TR[i]); if(AFINE&&i<3) aC(x+2.4,y,zz+TR[i]*0.75,x+0.6,y,zz+TR[i]+1.9,1.15,pal.dark); px=x; py=y; pz=zz; r=TR[i]; }
    aC(px,py,pz,px-2.6,py*1.1,pz+(kind==='hang'?3:-1.5),1.4,pal.dark); aMark('tip',px-1.5,py,pz+(kind==='hang'?2.5:-0.5)); }
  aE(0.3,0,bz+1.2,4.9,5.7,2.7,pal.belt);
  aE(0,0,bz+6.6,5.5,6.3,6.1,pal.vest);
  aE(2.7,0,bz+7.6,3.0,3.3,4.6,pal.chest,{bias:0.15});
  aL(0.2,0,bz+11.6,0.9,0,bz+15.4,3.0,pal.skin,2.7);
  aE(-2.6,0,bz+11.7,3.1,6.1,2.3,pal.cloak,{bias:-0.1});
  for(const sd of [-1,1]) aE(0.3,sd*6.5,bz+10.5,3.8,3.4,2.5,pal.steel,{roll:-sd*0.42});
  for(const sd of [-1,1]){ const H=sd>0?hR:hL, sx=0.2, sy=sd*6.4, sz=bz+9.6;
    aL(sx,sy,sz,H[0],H[1],H[2],2.25,pal.skin,1.95);
    if(AFINE) aL(lerp(sx,H[0],0.56),lerp(sy,H[1],0.56),lerp(sz,H[2],0.56),lerp(sx,H[0],0.88),lerp(sy,H[1],0.88),lerp(sz,H[2],0.88),2.35,pal.vestD,2.2);
    aB(H[0],H[1],H[2],2.15,pal.head);
    if(kind==='climb') for(const q of [-1,0,1]) aC(H[0]+0.6,H[1]+q*0.9,H[2]+1.4,H[0]+2.4,H[1]+q*1.15,H[2]+3.1,0.6,pal.claw); }
  { const az=bz+11.4, hz=bz-6.2+clift, sy=csway, ed=pal.cloakE;
    const CA=[[-4.4,0,az+0.3],[-3.6,3.4,az],[-2.4,6.0,az-0.6]], CH=[[-6.9-cfl,sy,hz-0.4],[-6.1-cfl*0.85,4.9+sy*0.6,hz+0.4],[-4.4-cfl*0.6,8.7+sy*0.4,hz+2.4]];
    for(let pass=0;pass<(AFINE?2:1);pass++){ const q=pass?0.7:0, col=pass?pal.cloakIn:pal.cloak, op=pass?{shade:false}:{edge:ed};
      for(const sd of [-1,1]) for(let j=0;j<2;j++){ const a0=CA[j], a1=CA[j+1], h0=CH[j], h1=CH[j+1];
        aPt(0,a0[0]+q,a0[1]*sd*0.96,a0[2]-q*0.5); aPt(1,a1[0]+q,a1[1]*sd*0.96,a1[2]-q*0.5); aPt(2,h1[0]+q,(h1[1]-sy)*sd*0.96+sy,h1[2]+q*0.3); aPt(3,h0[0]+q,(h0[1]-sy)*sd*0.96+sy,h0[2]+q*0.3); aPoly(4,col,op); } } }
  if(hasAbil('wings')) ashWings(pal,0,0,1,bz,false); else if(hasAbil('jump')) ashNubs(pal,bz,0,false);
  arPush(); arMove(1.0,0,bz+18.6); arPitch(hp); aMark('head',0,0,0);
  ashHead(pal,false,0,((t*0.29+0.37)%1)<0.035); if(G&&G.hat) ashHat(G.hat); arPop();
  t3End();
  if(AM.tip.on){ aScr(AM.tip,P2V.s1); P2V.tail[0]=P2V.s1[0]; P2V.tail[1]=P2V.s1[1]; P2V.tailT=G.time; }
  if(AM.head.on){ aScr(AM.head,P2V.s1); p._t3top=P2V.s1[1]-(G&&G.hat?13:10)*T3.st; }
}
// the classic sprite on a wall: seen from above, arms reaching up the face with the claws out, boots stepping
function p2HeroClimb(p,M){
  const f=M.face, L=lightLocal(f), fl=p.hurtFlash>0, s=Math.sin(M.ph||0), z=p.z||0;
  ctx.save(); ctx.globalAlpha=M.alpha==null?1:M.alpha; ctx.translate(p.x,p.y-z); ctx.rotate(f); ctx.lineCap='round'; ctx.lineJoin='round';
  const ts=Math.sin(p.t*2.2)*0.5;
  ctx.strokeStyle='#5e1a10'; ctx.lineWidth=7.5; ctx.beginPath(); ctx.moveTo(-8,0); ctx.quadraticCurveTo(-20,-ts*8,-31,ts*10); ctx.stroke(); ctx.strokeStyle=fl?'#fff':'#9a3420'; ctx.lineWidth=4.5; ctx.stroke();
  drawWingsHook(p,L,fl);
  ell(-1+Math.max(0,-s)*5,-7,4.6,3,'#2a1c12'); ell(-1+Math.max(0,s)*5,7,4.6,3,'#2a1c12');
  ctx.fillStyle=rg(-8,0,16,L,'#7a2a20','#4a1410','#200606');
  ctx.beginPath(); ctx.moveTo(3,-12); ctx.quadraticCurveTo(-16,-14,-22,-6); ctx.quadraticCurveTo(-25,0,-22,6); ctx.quadraticCurveTo(-16,14,3,12); ctx.closePath(); ctx.fill();
  ctx.fillStyle=fl?'#fff':rg(0,0,12,L,'#9a7048','#6a4a2c','#3a2616'); ctx.beginPath(); ctx.ellipse(0,0,10,12.5,0,0,TAU); ctx.fill();
  for(const sd of [-1,1]){ const reach=sd<0?s:-s, hx=14+reach*4, hy=sd*9.5;
    ctx.strokeStyle=fl?'#fff':'#8a3220'; ctx.lineWidth=5.4; ctx.beginPath(); ctx.moveTo(3,sd*10); ctx.lineTo(hx,hy); ctx.stroke();
    ell(hx,hy,3.8,3.3,fl?'#fff':'#b0402a'); ctx.fillStyle='#efe2c4';
    for(const q of [-1,0,1]){ ctx.beginPath(); ctx.moveTo(hx+2,hy+q*1.9-0.8); ctx.lineTo(hx+6.4,hy+q*2.5); ctx.lineTo(hx+2,hy+q*1.9+0.8); ctx.closePath(); ctx.fill(); } }
  for(const sd of [-1,1]){ ctx.fillStyle=rg(1,sd*10.5,5.5,L,'#d8dde3','#8a929c','#3a3e44'); ctx.beginPath(); ctx.ellipse(1,sd*10.5,5.5,4.4,0,0,TAU); ctx.fill(); }
  ctx.fillStyle=fl?'#fff':rg(8,0,8,L,'#e2694a','#b0402a','#5e1a10'); ctx.beginPath(); ctx.ellipse(8,0,7.4,6.6,0,0,TAU); ctx.fill();
  for(const sd of [-1,1]){ const g=ctx.createLinearGradient(7,sd*4,-8,sd*11); g.addColorStop(0,'#f6ecd0'); g.addColorStop(1,'#9a8a6a'); ctx.strokeStyle=g; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(7,sd*4); ctx.quadraticCurveTo(1,sd*9.5,-8,sd*10.5); ctx.stroke(); }
  drawAshHat();
  ctx.restore(); ctx.globalAlpha=1;
  P2V.tail[0]=p.x-Math.cos(f)*30; P2V.tail[1]=p.y-z-Math.sin(f)*30; P2V.tailT=G.time;
}
// Ash as a shadow: a violet-black teardrop with two ember eyes and little horns (flat on the ground while he rides)
function p2DrawShadowForm(p,flat){
  const t=G.time, sb=LOOK.sb;
  for(const g of P2.trail){ if(!inView(g.x,g.y,40)) continue; ctx.save(); ctx.globalAlpha=g.a*0.5; ctx.translate(g.x,g.y-(g.ride?0:8)); ctx.rotate(g.f); ctx.scale(1,g.ride?0.45:0.8); ctx.fillStyle='#3a2458'; ctx.beginPath(); ctx.ellipse(0,0,15,8,0,0,TAU); ctx.fill(); ctx.restore(); }
  ctx.globalAlpha=1;
  const dir=flat&&P2.mv?P2.mv.face:P2.dash?P2.dash.dir:p.facing, wob=Math.sin(t*30)*0.06;
  if(flat) glowAt(p.x,p.y,30,'150,100,230',0.38+0.08*Math.sin(t*9));
  ctx.save(); ctx.translate(p.x,p.y-(flat?0:9));
  if(flat){ ctx.scale(1,0.62); }
  ctx.rotate(dir);
  const L=flat?40:30, Wd=flat?17:15;
  const body=g2=>{ g2.beginPath(); g2.moveTo(L*0.55,0); g2.bezierCurveTo(L*0.5,-Wd*0.75,-L*0.15,-Wd*(0.7+wob),-L*0.85,-Wd*0.12); g2.quadraticCurveTo(-L*1.05,0,-L*0.85,Wd*0.12); g2.bezierCurveTo(-L*0.15,Wd*(0.7-wob),L*0.5,Wd*0.75,L*0.55,0); g2.closePath(); };
  if(sb){ ctx.lineJoin='round'; ctx.strokeStyle=SBC.outline; ctx.lineWidth=4; body(ctx); ctx.stroke(); }
  body(ctx); ctx.fillStyle='rgba(42,24,64,.94)'; ctx.fill();
  if(flat){ ctx.strokeStyle='rgba(196,160,255,.85)'; ctx.lineWidth=2.2; body(ctx); ctx.stroke(); }
  ctx.save(); body(ctx); ctx.clip(); ctx.fillStyle='rgba(120,80,190,.55)'; ctx.beginPath(); ctx.ellipse(L*0.05,-Wd*0.42,L*0.5,Wd*0.32,0,0,TAU); ctx.fill(); ctx.restore();
  // horns
  ctx.fillStyle='#2a1640'; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(L*0.18,s*Wd*0.4); ctx.lineTo(-L*0.05,s*Wd*0.95); ctx.lineTo(L*0.02,s*Wd*0.35); ctx.closePath(); ctx.fill(); if(sb){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=1.4; ctx.stroke(); } }
  ctx.restore();
  // ember eyes
  const ex=p.x+Math.cos(dir)*L*0.3, ey=p.y-(flat?0:9)+Math.sin(dir)*L*0.3*(flat?0.62:1);
  for(const s of [-1,1]){ const x=ex-Math.sin(dir)*3.4*s, y=ey+Math.cos(dir)*3.4*s*(flat?0.62:1); ctx.fillStyle='#ffd34d'; ctx.beginPath(); ctx.arc(x,y,1.6,0,TAU); ctx.fill(); glowAt(x,y,5,'255,200,90',0.6); }
  if(flat&&Math.random()<0.3) G.ripples.push({x:p.x+rand(-8,8),y:p.y+rand(-3,3),t:0,max:0.5,r:12});
}
// where the tail leaves Ash (for the rope), on the figure as it is drawn this frame
function p2TailAt(p){
  if(P2V.tailT===G.time) return P2V.tail;
  const f=p.facing, z=p.z||0;
  if(T3.on) return [p.x-Math.cos(f)*13,p.y+6-Math.sin(f)*13*T3.ct-(z+6)*T3.st];
  return [p.x-Math.cos(f)*28,p.y-z-Math.sin(f)*28];
}
{ const base=drawPlayer; drawPlayer=function(){
  const p=player; if(!p||p.dead||!G) return base();
  const M=P2.mv;
  if(P2.dash){ p2DrawShadowForm(p,false); return; }
  if(M&&M.kind==='ride'){ p2DrawShadowForm(p,true); return; }
  if(M&&(M.kind==='climb'||M.kind==='slip'||M.kind==='xclimb'||M.kind==='xarrive')){ if(T3.on&&T3X.ash) p2Ash3D(p,'climb',M); else p2HeroClimb(p,M); return; }
  if(M&&M.kind==='hang'&&T3.on&&T3X.ash){ drawMoveShadow(p); p2Ash3D(p,'hang',M); return; }
  if(M&&M.kind==='zip'&&M.thr<=0&&T3.on){ const f=p.flying; p.flying=true; try{ base(); } finally{ p.flying=f; } return; }
  base(); }; }

// ---- the rope (Ash's tail), the reticle, the strain meter
function p2Rope(ax,ay,bx,by,sag,hook){
  const mx=(ax+bx)/2, my=(ay+by)/2+sag, sb=LOOK.sb;
  ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.strokeStyle=sb?SBC.outline:'#2a0e08'; ctx.lineWidth=4.6; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.quadraticCurveTo(mx,my,bx,by); ctx.stroke();
  ctx.strokeStyle='#9a3420'; ctx.lineWidth=2.8; ctx.stroke();
  ctx.strokeStyle='rgba(232,120,80,.85)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ax,ay-0.8); ctx.quadraticCurveTo(mx,my-0.8,bx,by-0.8); ctx.stroke();
  if(hook){ const a=Math.atan2(by-my,bx-mx); ctx.translate(bx,by); ctx.rotate(a);
    ctx.strokeStyle=sb?SBC.outline:'#2a1a0a'; ctx.lineWidth=4.2; ctx.beginPath(); ctx.moveTo(-3,0); ctx.lineTo(3,0); for(const s of [-1,1]){ ctx.moveTo(1,0); ctx.quadraticCurveTo(6,s*1,5,s*5); } ctx.stroke();
    ctx.strokeStyle='#e0b24a'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(-3,0); ctx.lineTo(3,0); for(const s of [-1,1]){ ctx.moveTo(1,0); ctx.quadraticCurveTo(6,s*1,5,s*5); } ctx.stroke(); }
  ctx.restore();
}
function p2Reticle(t,tm){
  const x=t.x, y=t.y-t.h, pull=t.kind==='pull'||t.kind==='yank', col=pull?'255,150,80':'255,216,110', hex=pull?'#ff9a4a':'#ffd86a', r=14+Math.sin(tm*6)*1.4;
  glowAt(x,y,r+12,col,0.35);
  ctx.save(); ctx.translate(x,y); ctx.lineCap='round';
  for(const pass of [0,1]){ ctx.strokeStyle=pass?hex:(LOOK.sb?SBC.outline:'rgba(30,14,8,.8)'); ctx.lineWidth=pass?2.6:5;
    for(let i=0;i<4;i++){ const a=tm*1.7+i*Math.PI/2; ctx.beginPath(); ctx.arc(0,0,r,a+0.25,a+Math.PI/2-0.25); ctx.stroke(); } }
  const by=-r-9+Math.sin(tm*5)*2;
  ctx.beginPath(); ctx.moveTo(-5,by-4); ctx.lineTo(5,by-4); ctx.lineTo(0,by+2); ctx.closePath(); ctx.fillStyle=hex; ctx.fill(); ctx.strokeStyle=LOOK.sb?SBC.outline:'rgba(30,14,8,.8)'; ctx.lineWidth=1.6; ctx.stroke();
  ctx.restore();
}
function p2Meter(x,y,f){
  ctx.save(); ctx.lineCap='round'; ctx.strokeStyle='rgba(40,20,30,.6)'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x,y,11,0,TAU); ctx.stroke();
  ctx.strokeStyle=f>=1?'#9cf07a':'#ffb05a'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,11,-Math.PI/2,-Math.PI/2+TAU*clamp(f,0,1)); ctx.stroke(); ctx.restore();
}
{ const base=drawAirborneHook; drawAirborneHook=function(){
  base();
  const p=player; if(!p||!G||p.dead) return; const tm=G.time, M=P2.mv;
  // beams glow over everything
  if(AREA&&AREA.p2) for(const b of AREA.p2.beams) p2BeamCore(b,tm); else if(!AREA) for(const o of mapList(P2.out,curMap())) if(o.p2==='lightbeam') p2BeamCore(o,tm);
  const tl=p2TailAt(p);
  if(M&&M.kind==='zip'){ const tx=M.t.x, ty=M.t.y-M.t.h; if(M.thr>0) p2Rope(tl[0],tl[1],lerp(tl[0],tx,M.hook),lerp(tl[1],ty,M.hook)-Math.sin(M.hook*Math.PI)*16,4,true); else p2Rope(tl[0],tl[1],tx,ty,0,true); }
  else if(M&&M.kind==='hang'){ p2Rope(tl[0],tl[1],M.t.x,M.t.y-M.t.h,0,true); }
  if(P2.pull){ const P=P2.pull, an=p2PullAnchor(P), ax=an[0], ay=an[1]-P.t.h, d=dist(tl[0],tl[1],ax,ay), k=clamp(P.hook,0,1), ex=lerp(tl[0],ax,k), ey=lerp(tl[1],ay,k);
    const sag=P.taut?Math.sin(tm*60)*0.8:Math.min(26,d*0.12); p2Rope(tl[0],tl[1],ex,ey,k<1?-8:sag,true);
    const o=P.t.o, need=o.need||P2N.need; if(P.t.src!=='crate'&&P.t.src!=='block'&&P.strain>0.02) p2Meter(ax,ay-24,P.strain/need); }
  if(P2.retract){ const r=P2.retract, k=r.out?Math.sin(clamp(r.t/0.22,0,1)*Math.PI):1-clamp(r.t/0.22,0,1); if(k>0.02) p2Rope(tl[0],tl[1],lerp(tl[0],r.x,k),lerp(tl[1],r.y,k),6*k,true); }
  if(P2.tgt&&!P2.pull&&(!M||M.kind==='hang')) p2Reticle(P2.tgt,tm);
}; }

// ---- the world objects
// a grapple post: a brass bollard with a big ring on top (ELEV.grapple posts and dungeon @ posts)
function p2PostSprite(){ return sbSprite('p2post',32,g=>{
  g.translate(0,22);
  g.fillStyle='rgba(40,20,40,.25)'; g.beginPath(); g.ellipse(2,2,13,5.5,0,0,TAU); g.fill();
  celFill(g,(q,dx,dy)=>{ q.moveTo(-10+dx,dy); q.lineTo(10+dx,dy); q.lineTo(8+dx,-6+dy); q.lineTo(-8+dx,-6+dy); q.closePath(); },'#6e6a74',{r:10});
  celFill(g,(q,dx,dy)=>{ q.rect(-4.5+dx,-38+dy,9,33); },'#c89a42',{r:6,hi:1.6,lo:2});
  g.fillStyle='#8a6428'; g.fillRect(-5,-30,10,2.6); g.fillRect(-5,-16,10,2.6);
  g.strokeStyle='#7a5a20'; g.lineWidth=5; g.beginPath(); g.arc(0,-46,7.6,0,TAU); g.stroke();
  g.strokeStyle='#f0c860'; g.lineWidth=3; g.beginPath(); g.arc(0,-46,7.6,0,TAU); g.stroke();
  g.strokeStyle='rgba(255,250,220,.9)'; g.lineWidth=1.1; g.beginPath(); g.arc(0,-46,7.6,-2.6,-1.4); g.stroke();
  g.fillStyle='#3a8a8a'; g.beginPath(); g.arc(0,-36,2.2,0,TAU); g.fill();
},1.4); }
function p2DrawPost(x,y,t){ const sp=p2PostSprite(); drawSprite(sp,x,y-22,1,0); if(canGrapple()){ const pl=player; if(pl&&dist2(pl.x,pl.y,x,y)<(p2Range()+40)**2) glowAt(x,y-46,13,'255,220,140',0.2+0.12*Math.sin(t*3+x)); } }
FL.dgpost=(o,t)=>{};   // drawn with the figures (eventsForRender below)
function p2RingSprite(){ return sbSprite('p2ring',18,g=>{
  g.strokeStyle='#6a4818'; g.lineWidth=5.6; g.beginPath(); g.arc(0,4,9,0,TAU); g.stroke();
  g.strokeStyle='#e8b850'; g.lineWidth=3.4; g.beginPath(); g.arc(0,4,9,0,TAU); g.stroke();
  g.strokeStyle='rgba(255,250,220,.9)'; g.lineWidth=1.2; g.beginPath(); g.arc(0,4,9,-2.7,-1.5); g.stroke();
  celFill(g,(q,dx,dy)=>{ q.rect(-3+dx,-10+dy,6,6); },'#a07a30',{r:4});
},1.2); }
function p2DrawRing(o,t){
  const y=o.y-o.h, sw=Math.sin(t*1.3+o.x*0.01)*0.06;
  if(o.pole){ ctx.save(); ctx.lineCap='round'; ctx.strokeStyle=LOOK.sb?SBC.outline:'#2a1a0a'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(o.x,y-6); ctx.stroke(); ctx.strokeStyle='#7a6450'; ctx.lineWidth=3.6; ctx.stroke(); ctx.restore(); }
  else{ ctx.save(); ctx.strokeStyle='rgba(60,40,30,.75)'; ctx.lineWidth=1.6; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(o.x,y-12); ctx.lineTo(o.x,y-48); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
  ctx.save(); ctx.translate(o.x,y); ctx.rotate(sw); const sp=p2RingSprite(); ctx.drawImage(sp,-sp.half,-sp.half,sp.half*2,sp.half*2); ctx.restore();
  if(canGrapple()) glowAt(o.x,y+4,12,'255,220,140',0.18+0.1*Math.sin(t*3+o.x));
}
// a chain ring on a lever post (mode 'lever' or 'room'), or a plain bolted ring (mode 'custom')
function p2DrawChainRing(o,t){
  const x=o.x, y=o.y, sb=LOOK.sb, oc=sb?SBC.outline:'#1a1008', st=o.done?1:clamp((o.strain||0)/(o.need||P2N.need),0,1);
  if(o.mode==='custom'){ r2e(ctx,x+2,y+3,9,4,'rgba(40,20,40,.3)'); ctx.fillStyle=oc; ctx.fillRect(x-7,y-o.h-7,14,12); ctx.fillStyle='#5a5a64'; ctx.fillRect(x-5.5,y-o.h-5.5,11,9); }
  else{
    r2e(ctx,x+3,y+4,13,5,'rgba(40,20,40,.3)');
    ctx.fillStyle=oc; rrect(ctx,x-9,y-14,18,16,3); ctx.fill(); ctx.fillStyle='#6a5444'; rrect(ctx,x-7.5,y-12.5,15,13,2); ctx.fill(); ctx.fillStyle='#8a7060'; ctx.fillRect(x-7.5,y-12.5,15,3);
    const a=-Math.PI/2+(o.done?1.1:st*0.9)*(o.flip||1), L=o.h+2, hx=x+Math.cos(a)*L*0.2, hy=y-12+Math.sin(a)*L;
    ctx.save(); ctx.lineCap='round'; ctx.strokeStyle=oc; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(x,y-10); ctx.lineTo(hx,hy); ctx.stroke(); ctx.strokeStyle='#9a8a7a'; ctx.lineWidth=3.4; ctx.stroke(); ctx.restore();
    ctx.fillStyle=o.done?'#7ad06a':'#c8322a'; ctx.beginPath(); ctx.arc(hx,hy,3.4,0,TAU); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=1.4; ctx.stroke();
    if(o.done) return;
  }
  const ry=y-o.h+6;
  ctx.save(); ctx.strokeStyle=oc; ctx.lineWidth=4.6; ctx.beginPath(); ctx.arc(x,ry+4,6.5,0,TAU); ctx.stroke(); ctx.strokeStyle='#b8b0a8'; ctx.lineWidth=2.6; ctx.stroke();
  ctx.strokeStyle='#ff8a3a'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x,ry+4,6.5,-2.6,-1.4); ctx.stroke(); ctx.restore();
  if(canGrapple()&&!o.done) glowAt(x,ry+4,11,'255,160,80',0.15+0.1*Math.sin(t*4));
}
function p2DrawCrate(o,t){
  const x=o.x+(o.rumT>0?Math.sin(t*80)*0.8:0), y=o.y, w=o.w, h=o.h, sb=LOOK.sb, top=h*0.42;
  r2e(ctx,x+4,y+h/2-2,w*0.56,7,'rgba(40,20,40,.3)');
  ctx.fillStyle=sb?SBC.outline:'#2a1a0a'; rrect(ctx,x-w/2-1.5,y-h/2-top-1.5,w+3,h+top+3,4); ctx.fill();
  ctx.fillStyle='#b8844a'; ctx.fillRect(x-w/2,y-h/2-top,w,top); ctx.fillStyle='#9a6a38'; ctx.fillRect(x-w/2,y-h/2,w,h);
  ctx.fillStyle='rgba(255,240,210,.25)'; ctx.fillRect(x-w/2,y-h/2-top,w,2.5);
  ctx.fillStyle='rgba(60,30,10,.45)'; for(let i=1;i<3;i++) ctx.fillRect(x-w/2+i*w/3,y-h/2-top,1.5,top); for(let i=1;i<3;i++) ctx.fillRect(x-w/2,y-h/2+i*h/3,w,1.5);
  ctx.fillStyle='#5a5a66'; ctx.fillRect(x-w/2,y-h/2+2,w,3.5); ctx.fillRect(x-w/2,y+h/2-6,w,3.5);
  if(!o.done){ ctx.save(); ctx.strokeStyle=sb?SBC.outline:'#1a1008'; ctx.lineWidth=4.2; ctx.beginPath(); ctx.arc(x,y+2,6,0,TAU); ctx.stroke(); ctx.strokeStyle='#d0c8bc'; ctx.lineWidth=2.4; ctx.stroke(); ctx.restore(); if(canGrapple()) glowAt(x,y+2,10,'255,160,80',0.14); }
  if(o.goal&&!o.done){ ctx.save(); ctx.strokeStyle=`rgba(255,220,140,${0.35+0.2*Math.sin(t*3)})`; ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.strokeRect(o.goal.x-w/2,o.goal.y-h/2,w,h); ctx.setLineDash([]); ctx.restore(); }
}
// a drawbridge: planks over the gap once it is down, an upright flap at the hinge while it is up
function p2DeckRect(o){ return AREA&&o.cells?{x0:o.x0,y0:o.y0,x1:o.x1,y1:o.y1}:o; }
function p2DrawBridge(o,t,stand){
  const R=p2DeckRect(o), a=o.a, sb=LOOK.sb, oc=sb?SBC.outline:'#1a1008', vert=(R.y1-R.y0)>=(R.x1-R.x0), h=o.hinge;
  if(!stand){ if(a<0.03) return;
    // the deck grows out from the hinge
    let x0=R.x0, y0=R.y0, x1=R.x1, y1=R.y1; const e=smooth(a);
    if(h==='n') y1=y0+(y1-y0)*e; else if(h==='s') y0=y1-(y1-y0)*e; else if(h==='w') x1=x0+(x1-x0)*e; else x0=x1-(x1-x0)*e;
    ctx.fillStyle='rgba(30,16,30,.35)'; ctx.fillRect(x0+4,y0+6,x1-x0,y1-y0);
    ctx.fillStyle=oc; ctx.fillRect(x0-1.5,y0-1.5,x1-x0+3,y1-y0+3); ctx.fillStyle='#a8784a'; ctx.fillRect(x0,y0,x1-x0,y1-y0);
    ctx.fillStyle='rgba(60,30,10,.45)'; if(vert) for(let yy=y0+12;yy<y1;yy+=12) ctx.fillRect(x0,yy,x1-x0,1.6); else for(let xx=x0+12;xx<x1;xx+=12) ctx.fillRect(xx,y0,1.6,y1-y0);
    ctx.fillStyle='#5a5a66'; if(vert){ ctx.fillRect(x0+5,y0,3,y1-y0); ctx.fillRect(x1-8,y0,3,y1-y0); } else { ctx.fillRect(x0,y0+5,x1-x0,3); ctx.fillRect(x0,y1-8,x1-x0,3); }
    return; }
  if(a>0.97) return;
  // the raised flap at the hinge, shrinking as it falls
  const k=1-smooth(a), L=(vert?R.y1-R.y0:R.x1-R.x0)*0.45*k;
  let fx0, fx1, fy;
  if(h==='n'||h==='s'){ fx0=R.x0; fx1=R.x1; fy=h==='n'?R.y0:R.y1; ctx.fillStyle=oc; ctx.fillRect(fx0-1.5,fy-L-1.5,fx1-fx0+3,L+3); ctx.fillStyle='#9a6a3e'; ctx.fillRect(fx0,fy-L,fx1-fx0,L); ctx.fillStyle='rgba(60,30,10,.4)'; for(let xx=fx0+12;xx<fx1;xx+=12) ctx.fillRect(xx,fy-L,1.6,L);
    ctx.save(); ctx.strokeStyle='#6a6a74'; ctx.lineWidth=2; for(const xx of [fx0+4,fx1-4]){ ctx.beginPath(); ctx.moveTo(xx,fy-L+3); ctx.lineTo(xx+(xx<(fx0+fx1)/2?-10:10),fy+2); ctx.stroke(); } ctx.restore(); }
  else { const x=h==='w'?R.x0:R.x1; ctx.fillStyle=oc; ctx.fillRect(x-4,R.y0-L*0.6-1.5,8,R.y1-R.y0+L*0.6+3); ctx.fillStyle='#9a6a3e'; ctx.fillRect(x-2.5,R.y0-L*0.6,5,R.y1-R.y0+L*0.6); }
  const rx=AREA&&o.cells?o.rx:o.ring.x, ry=AREA&&o.cells?o.ry:o.ring.y;
  ctx.save(); ctx.strokeStyle=oc; ctx.lineWidth=4.4; ctx.beginPath(); ctx.arc(rx,ry-14,6,0,TAU); ctx.stroke(); ctx.strokeStyle='#c0b8b0'; ctx.lineWidth=2.4; ctx.stroke(); ctx.restore();
  if(canGrapple()) glowAt(rx,ry-14,11,'255,160,80',0.16+0.1*Math.sin(t*4));
}
// moth curtains and shadow bars are drawn as runs: a line of cells (or one door, or one outdoor piece) as one curtain.
// An east-west run faces the camera (strands or bars hang from a beam); a north-south run is seen from above (a band).
// R: {t:'moth'|'bars', vert, x0,y0,x1,y1, list:[g]} where each g has oa (moths: 0 shut .. 1 rolled up) or lit and rip
function p2RunOf(t,vert,x0,y0,x1,y1,list){ return {t,vert,x0,y0,x1,y1,list,len:vert?y1-y0:x1-x0}; }
const p2RunSeg=(R,s)=>R.list.length===1?R.list[0]:R.list[clamp(Math.floor(s/R.len*R.list.length),0,R.list.length-1)];
function p2Moth(x,y,fl,oc,sb,col,a){ const wv=3.3, wh=3.2*(0.35+0.65*fl); ctx.globalAlpha=a;
  if(sb){ ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(x-3,y,wv+1,wh+1,-0.5,0,TAU); ctx.ellipse(x+3,y,wv+1,wh+1,0.5,0,TAU); ctx.fill(); }
  ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(x-3,y,wv,wh,-0.5,0,TAU); ctx.ellipse(x+3,y,wv,wh,0.5,0,TAU); ctx.fill();
  if(fl>0.55){ ctx.fillStyle='#f4ecd8'; ctx.beginPath(); ctx.arc(x-3.2,y,0.95,0,TAU); ctx.arc(x+3.2,y,0.95,0,TAU); ctx.fill(); }
  ctx.fillStyle='#4a3a4e'; ctx.fillRect(x-0.8,y-2.2,1.6,4.4); ctx.globalAlpha=1; }
function p2MothRun(R,t){
  const sb=LOOK.sb, oc=sb?SBC.outline:'#1a1018', H=58, seed=R.x0*0.013;
  ctx.save(); ctx.lineCap='round';
  if(!R.vert){ const yb=(R.y0+R.y1)/2+R.len*0;
    r2e(ctx,(R.x0+R.x1)/2+4,yb+4,R.len/2+4,6,'rgba(40,20,60,.22)');
    ctx.strokeStyle=oc; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(R.x0,yb-H); ctx.lineTo(R.x1,yb-H); ctx.stroke(); ctx.strokeStyle='#6a5a52'; ctx.lineWidth=3.4; ctx.stroke();
    for(const x of [R.x0,R.x1]){ ctx.strokeStyle=oc; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x,yb+2); ctx.lineTo(x,yb-H-3); ctx.stroke(); ctx.strokeStyle='#7a6a60'; ctx.lineWidth=2.8; ctx.stroke(); }
    const n=Math.max(3,Math.round(R.len/12));
    for(let i=0;i<n;i++){ const s=(i+0.5)/n*R.len, g=p2RunSeg(R,s), oa=g.oa||0, L=H*(1-oa*0.86), x=R.x0+s, sw=Math.sin(t*2.2+i*1.7+seed)*2.2;
      ctx.strokeStyle='rgba(200,196,210,.55)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x,yb-H); ctx.quadraticCurveTo(x+sw,yb-H+L*0.5,x+sw*0.6,yb-H+L); ctx.stroke();
      const m=Math.max(1,Math.round(L/9));
      for(let j=0;j<m;j++){ const yy=yb-H+4+j*(L-4)/Math.max(1,m-1+0.001), fl=Math.abs(Math.sin(t*(9+((i*7+j*3)%5))+i+j*2.1)); p2Moth(x+sw*(j/m)*0.8,yy,fl,oc,sb,(i+j)%3===0?'#c8c0d0':'#a8a0b4',1); }
      if(oa>0.2&&Math.random()<0.02*oa) emit(x,yb-H*0.6,1,{col:'210,205,225',glow:false,ang:-Math.PI/2,spread:1.2,smin:20,smax:70,lmin:.5,lmax:1,zmin:1,zmax:2,drag:1,rise:-20,alpha:0.7}); }
  }else{ const cx=(R.x0+R.x1)/2, hw=Math.min(16,(R.x1-R.x0)/2-3);
    for(let y=R.y0+5,j=0;y<R.y1-3;y+=8,j++){ const g=p2RunSeg(R,y-R.y0), oa=g.oa||0; if(oa>0.97) continue;
      ctx.fillStyle=`rgba(150,140,170,${0.3*(1-oa)})`; ctx.fillRect(cx-hw,y-4,hw*2,8);
      for(let i=0;i<3;i++){ const x=cx-hw*0.66+i*hw*0.66+(j%2?3:-3), fl=Math.abs(Math.sin(t*(8+((i*5+j*3)%5))+i*1.3+j)); p2Moth(x,y-2-(1-oa)*2,fl,oc,sb,(i+j)%3===0?'#c8c0d0':'#a8a0b4',1-oa); }
      if(oa>0.2&&Math.random()<0.02*oa) emit(cx+rand(-hw,hw),y,1,{col:'210,205,225',glow:false,ang:-Math.PI/2,spread:1.2,smin:20,smax:70,lmin:.5,lmax:1,zmin:1,zmax:2,drag:1,rise:-20,alpha:0.7}); }
    for(const y of [R.y0+2,R.y1-2]){ ctx.fillStyle=oc; ctx.beginPath(); ctx.arc(cx,y,4.5,0,TAU); ctx.fill(); ctx.fillStyle='#7a6a60'; ctx.beginPath(); ctx.arc(cx,y,3,0,TAU); ctx.fill(); }
  }
  ctx.restore();
  for(const g of R.list) if(g.litT!=null&&g.litT<0.1){ glowAt(g.x,g.y-(R.vert?0:H*0.5),26,'255,236,170',0.16); }
}
function p2BarsRun(R,t){
  const sb=LOOK.sb, oc=sb?SBC.outline:'#0a0610', H=56, ST=R.style?P2_THIN[R.style]||P2_THIN.iron:null;
  ctx.save(); ctx.lineCap='round';
  if(!R.vert){ const yb=(R.y0+R.y1)/2, n=Math.max(3,Math.round(R.len/12)), lit0=R.list.every(g=>g.lit);
    r2e(ctx,(R.x0+R.x1)/2+3,yb+3,R.len/2+4,6,'rgba(40,20,60,.25)');
    ctx.strokeStyle=oc; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(R.x0,yb-H); ctx.lineTo(R.x1,yb-H); ctx.stroke(); ctx.strokeStyle=ST?ST.beam:lit0?'#7a7a86':'#3a2850'; ctx.lineWidth=4; ctx.stroke();
    for(let i=0;i<=n;i++){ const s=i/n*R.len, g=p2RunSeg(R,Math.min(R.len-1,s)), lit=g.lit, rip=g.rip||0, x=R.x0+s, w=rip>0?Math.sin(t*40+i)*rip*8:Math.sin(t*3+i*1.3)*(lit?0:1.2);
      if(!lit){ ctx.strokeStyle='rgba(80,40,140,.25)'; ctx.lineWidth=9; ctx.beginPath(); ctx.moveTo(x,yb); ctx.quadraticCurveTo(x+w*2,yb-H*0.5,x,yb-H); ctx.stroke(); }
      ctx.strokeStyle=oc; ctx.lineWidth=5.6; ctx.beginPath(); ctx.moveTo(x,yb); ctx.quadraticCurveTo(x+w,yb-H*0.5,x,yb-H); ctx.stroke();
      ctx.strokeStyle=ST?ST.bar:lit?'#9a9aa8':'#2c1c42'; ctx.lineWidth=3.2; ctx.stroke();
      ctx.strokeStyle=ST?ST.hi:lit?'rgba(255,240,200,.75)':'rgba(170,120,240,.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x-1,yb-3); ctx.quadraticCurveTo(x-1+w,yb-H*0.5,x-1,yb-H+3); ctx.stroke();
      if(!lit&&Math.random()<0.01) emit(x,yb-rand(10,H),1,{col:'60,30,100',glow:false,ang:-Math.PI/2,spread:0.6,smin:5,smax:20,lmin:.6,lmax:1.1,zmin:3,zmax:6,grow:6,alpha:0.4}); }
  }else{ const cx=(R.x0+R.x1)/2, hw=Math.min(15,(R.x1-R.x0)/2-4);
    for(let y=R.y0+4;y<R.y1-2;y+=9){ const g=p2RunSeg(R,y-R.y0), lit=g.lit, w=(g.rip||0)>0?Math.sin(t*40+y)*g.rip*6:0;
      if(!lit){ ctx.strokeStyle='rgba(80,40,140,.22)'; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(cx-hw,y+w); ctx.lineTo(cx+hw,y-w); ctx.stroke(); }
      ctx.strokeStyle=oc; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(cx-hw,y+w); ctx.lineTo(cx+hw,y-w); ctx.stroke(); ctx.strokeStyle=ST?ST.bar:lit?'#9a9aa8':'#2c1c42'; ctx.lineWidth=2.8; ctx.stroke();
      ctx.strokeStyle=ST?ST.hi:lit?'rgba(255,240,200,.7)':'rgba(170,120,240,.45)'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(cx-hw+2,y-1+w); ctx.lineTo(cx+hw-2,y-1-w); ctx.stroke();
      if(!lit&&Math.random()<0.01) emit(cx+rand(-hw,hw),y,1,{col:'60,30,100',glow:false,ang:-Math.PI/2,spread:0.6,smin:5,smax:20,lmin:.6,lmax:1.1,zmin:3,zmax:6,grow:6,alpha:0.4}); }
    for(const x of [cx-hw,cx+hw]){ ctx.strokeStyle=oc; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x,R.y0); ctx.lineTo(x,R.y1); ctx.stroke(); ctx.strokeStyle=ST?ST.beam:R.list[0].lit?'#7a7a86':'#3a2850'; ctx.lineWidth=2.6; ctx.stroke(); }
  }
  ctx.restore();
}
function p2DrawRun(R,t){ if(R.t==='moth') p2MothRun(R,t); else p2BarsRun(R,t); }
// an outdoor piece is a run of its own
const p2ObjRun=o=>o._run||(o._run=Object.assign(p2RunOf(o.p2==='mothcurtain'?'moth':'bars',o.h>o.w,o.x-o.w/2,o.y-o.h/2,o.x+o.w/2,o.y+o.h/2,[o]),{style:o.p2==='thinbars'?o.style:null}));
// the runs of a dungeon floor: rows of cells, columns of cells, and the doors
function p2CaveRuns(A){
  const C=A.p2, c=A.cave, cs=c.cell, by=new Map(), used=new Set(), runs=[];
  for(const o of C.gates) if(o.p2cell) by.set(o.cells[0],o);
  const same=(q,t)=>{ const g=by.get(q); return g&&g.p2t===t&&!used.has(g)?g:null; };
  for(const o of C.gates){
    if(!o.p2cell){ const vert=!o.vertical; runs.push(p2RunOf(o.p2t,vert,o.x-(vert?cs/2:cs*1.5),o.y-(vert?cs*1.5:cs/2),o.x+(vert?cs/2:cs*1.5),o.y+(vert?cs*1.5:cs/2),[o])); continue; }
    if(used.has(o)) continue; const k=o.cells[0], t=o.p2t, i=k%c.w;
    const hz=!!(same(k-1,t)&&i>0||same(k+1,t)&&i<c.w-1), vt=!!(same(k-c.w,t)||same(k+c.w,t)), horiz=hz||!vt, step=horiz?1:c.w;
    let s0=k; while(same(s0-step,t)&&(!horiz||(s0%c.w)>0)) s0-=step;
    const list=[]; for(let q=s0;same(q,t);q+=step){ list.push(by.get(q)); used.add(by.get(q)); if(horiz&&(q%c.w)===c.w-1) break; }
    const a=list[0], b=list[list.length-1];
    runs.push(p2RunOf(t,!horiz,Math.min(a.x,b.x)-cs/2,Math.min(a.y,b.y)-cs/2,Math.max(a.x,b.x)+cs/2,Math.max(a.y,b.y)+cs/2,list));
  }
  C.runs=runs; return runs;
}
// light beams: a lens in a brass housing, a hot gold beam, a flare where it ends
function p2DrawBeam(b,t){
  const on=p2BeamOn(b), warn=p2BeamWarn(b), sb=LOOK.sb;
  const lens=(x,y,a)=>{ ctx.save(); ctx.translate(x,y-12); ctx.fillStyle=sb?SBC.outline:'#1a1008'; ctx.beginPath(); ctx.arc(0,0,9,0,TAU); ctx.fill(); ctx.fillStyle='#c89a42'; ctx.beginPath(); ctx.arc(0,0,7.4,0,TAU); ctx.fill(); ctx.fillStyle=on?'#fff6d0':warn&&Math.sin(t*30)>0?'#ffe6a0':'#8a7a60'; ctx.beginPath(); ctx.arc(Math.cos(a)*1.4,Math.sin(a)*1.4,4.2,0,TAU); ctx.fill(); ctx.restore(); };
  r2e(ctx,b.x0+2,b.y0+3,10,4,'rgba(40,20,40,.3)'); lens(b.x0,b.y0,angTo(b.x0,b.y0,b.x1,b.y1));
  if(on){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round'; ctx.strokeStyle='rgba(255,230,150,.16)'; ctx.lineWidth=b.w*2.2; ctx.beginPath(); ctx.moveTo(b.x0,b.y0); ctx.lineTo(b.x1,b.y1); ctx.stroke(); ctx.restore(); }
}
function p2BeamCore(b,t){
  if(!inView((b.x0+b.x1)/2,(b.y0+b.y1)/2,dist(b.x0,b.y0,b.x1,b.y1)/2+40)) return;
  const on=p2BeamOn(b), warn=p2BeamWarn(b);
  if(!on&&!warn) return;
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  const a=on?1:0.25*(Math.sin(t*30)>0?1:0.3), fl=0.88+0.12*Math.sin(t*11+b.x0);
  for(const [w,al] of [[b.w*1.3,0.12],[b.w*0.62,0.3],[b.w*0.22,0.95]]){ ctx.strokeStyle=`rgba(255,${on?236:200},${on?160:120},${al*a*fl})`; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(b.x0,b.y0-12); ctx.lineTo(b.x1,b.y1-12); ctx.stroke(); }
  ctx.restore();
  if(on){ glowAt(b.x1,b.y1-12,18,'255,236,170',0.5*fl); if(Math.random()<0.3){ const k=Math.random(); emit(lerp(b.x0,b.x1,k),lerp(b.y0,b.y1,k)-12,1,{col:'255,240,190',smin:5,smax:25,lmin:.3,lmax:.6,zmin:1,zmax:1.6,drag:2,rise:-15}); } }
}
// a shadow lane: a long soft strip of shade on the ground (violet motes drift in it once Ash can ride shadows)
function p2DrawLane(o,t){
  if(!p2LaneOn(o)) return; if(!inView((o.bb[0]+o.bb[2])/2,(o.bb[1]+o.bb[3])/2,Math.max(o.bb[2]-o.bb[0],o.bb[3]-o.bb[1])/2+40)) return;
  ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  const path=()=>{ ctx.beginPath(); o.pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); };
  ctx.strokeStyle='rgba(34,18,58,.22)'; ctx.lineWidth=o.w+10; path(); ctx.stroke();
  ctx.strokeStyle='rgba(34,18,58,.34)'; ctx.lineWidth=o.w; path(); ctx.stroke();
  ctx.strokeStyle='rgba(26,12,44,.28)'; ctx.lineWidth=o.w*0.45; path(); ctx.stroke();
  ctx.restore();
  if(canShadow()&&Math.random()<0.2){ const r=p2PolyAt(o.pts,rand(0,o.len)); emit(r[0]+rand(-o.w/3,o.w/3),r[1]+rand(-o.w/4,o.w/4),1,{col:'170,130,240',smin:3,smax:12,lmin:.6,lmax:1.2,zmin:0.8,zmax:1.5,drag:1,rise:-12,alpha:0.7}); }
}
// beams burn and shove whoever is not a shadow (Ash only; foes keep out of them on their own)
function p2BeamTouch(b,dt){
  const p=player; if(!p||p.dead||scene!=='play'||!p2BeamOn(b)||p2Shadowed()||P2.mv||p.flying) return;
  if(b.low&&airborne()) return;
  const d=segD(p.x,p.y,b.x0,b.y0,b.x1,b.y1), lim=b.w/2+p.r*0.6, L=dist(b.x0,b.y0,b.x1,b.y1)||1, nx=-(b.y1-b.y0)/L, ny=(b.x1-b.x0)/L, sd=(p.x-b.x0)*nx+(p.y-b.y0)*ny;
  if(d>=lim){ b.side=sd>=0?1:-1; return; }
  const side=b.side||(sd>=0?1:-1);
  if(b.block){ const push=lim-d+1.5; p.x+=nx*side*push; p.y+=ny*side*push; if(playerBlocked(p.x,p.y)){ p.x-=nx*side*push; p.y-=ny*side*push; } }
  if(b.hurt>0&&!(p.iframes>0)){ if(hurtPlayer(p.maxHp*b.hurt,p.x-nx*side*12,p.y-ny*side*12,240)){ p2Snd('zap'); emit(p.x,p.y-10,10,{col:'255,236,170',smin:40,smax:160,lmin:.2,lmax:.4,zmin:1.5,zmax:3});
    p2Say(p.x,p.y-44,S('Ouch! That light burns!','Ouch! Hot light!'),'#ffe0a0','beam');
    if(canShadow()) p2Tip('beam',S('Light beam','Light beam'),S(`A shadow passes right through light. Press ${p2Ctl().roll} to Shadow Dash across.`,'Dash across as a shadow!'),1); } }
}
// the dungeon's live floor: shadow pools and strips, drawbridges, beam glow (under every object)
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){ base.apply(this,arguments); if(A&&A.p2) p2CaveFloor(A,t); }; }
function p2CaveFloor(A,t){
  const C=A.p2, c=A.cave, cs=c.cell;
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1), j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  ctx.save();
  // a pool is one shape (one fill per layer, so no seams where cells meet): a soft rim, the pool, a darker heart
  const PL=[[new Path2D(),new Path2D(),new Path2D(),0],[new Path2D(),new Path2D(),new Path2D(),0]], sh=q=>q>=0&&C.shade[q];
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i; if(!C.shade[k]) continue; const x=A.x0+i*cs, y=A.y0+j*cs, Q=PL[p2LitAt(x+cs/2,y+cs/2)?1:0];
    const l=sh(k-1)?0:6, r=sh(k+1)?0:6, u=sh(k-c.w)?0:6, d=sh(k+c.w)?0:6;
    const rr=(R)=>[l&&u?R:0,r&&u?R:0,r&&d?R:0,l&&d?R:0], m=q=>q?q+6:-1;
    Q[0].roundRect(x+(l?l-5:-1),y+(u?u-5:-1),cs-(l?l-5:-1)-(r?r-5:-1),cs-(u?u-5:-1)-(d?d-5:-1),rr(12));
    Q[1].roundRect(x+(l||-0.5),y+(u||-0.5),cs-(l||-0.5)-(r||-0.5),cs-(u||-0.5)-(d||-0.5),rr(8));
    Q[2].roundRect(x+m(l),y+m(u),cs-m(l)-m(r),cs-m(u)-m(d),rr(6)); Q[3]++; }
  PL.forEach((Q,lit)=>{ if(!Q[3]) return; const al=lit?0.12:0.34; ctx.fillStyle=`rgba(30,14,52,${al*0.45})`; ctx.fill(Q[0]); ctx.fillStyle=`rgba(30,14,52,${al})`; ctx.fill(Q[1]); ctx.fillStyle=`rgba(40,18,72,${al*0.55})`; ctx.fill(Q[2]); });
  for(const s of C.strips){ if(!p2StripOn(s)) continue; const lit=p2LitAt((s.x0+s.x1)/2,(s.y0+s.y1)/2); ctx.lineCap='round'; ctx.strokeStyle=`rgba(30,14,52,${lit?0.1:0.24})`; ctx.lineWidth=s.w+10; ctx.beginPath(); ctx.moveTo(s.x0,s.y0); ctx.lineTo(s.x1,s.y1); ctx.stroke(); ctx.strokeStyle=`rgba(30,14,52,${lit?0.14:0.36})`; ctx.lineWidth=s.w; ctx.stroke(); }
  ctx.restore();
  for(const b of C.bridges) p2DrawBridge(b,t,false);
  for(const b of C.beams) p2DrawBeam(b,t);
  for(const R of C.runs||p2CaveRuns(A)) if(R.vert&&!R.list.some(g=>g.tmp&&g.closed)&&inView((R.x0+R.x1)/2,(R.y0+R.y1)/2,R.len/2+60)) p2DrawRun(R,t);
  if(canShadow()&&Math.random()<0.25){ const k=(Math.random()*c.w*c.h)|0; if(C.shade[k]){ const q=tPos(k); emit(q.x+rand(-18,18),q.y+rand(-18,18),1,{col:'170,130,240',smin:3,smax:12,lmin:.6,lmax:1.2,zmin:0.8,zmax:1.5,drag:1,rise:-12,alpha:0.7}); } }
}
// handholds on the faces of the climbable raised floors, baked into the cave picture
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){ base.apply(this,arguments); if(A&&A.p2&&A.p2.climb.size) p2BakeClimb(A,def); }; }
function p2BakeClimb(A,def){
  const C=A.p2, c=A.cave, cs=c.cell, g=A.canvas.getContext('2d'), st=CAVE_STYLE[def.theme]||CAVE_STYLE.earth;
  g.save(); g.setTransform(A.canvasS,0,0,A.canvasS,0,0);
  const knob=(x,y,r)=>{ g.fillStyle='rgba(30,16,20,.45)'; g.beginPath(); g.ellipse(x+0.8,y+1.4,r,r*0.7,0,0,TAU); g.fill(); g.fillStyle='#e6dcc8'; g.beginPath(); g.ellipse(x,y,r,r*0.72,0,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x-r*0.3,y-r*0.3,r*0.4,r*0.3,0,0,TAU); g.fill(); };
  for(const k of C.climb){ const i=k%c.w, j=(k-i)/c.w, x=i*cs, y=j*cs, low=q=>q>=0&&q<c.typ.length&&c.grid[q]===0&&dunH(q)===0;
    if(low(k+c.w)){ const fy=y+cs, fh=cs*0.58; g.strokeStyle='rgba(20,10,10,.5)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(x+cs*0.3,fy+2); g.lineTo(x+cs*0.36,fy+fh*0.5); g.lineTo(x+cs*0.28,fy+fh-2); g.moveTo(x+cs*0.72,fy+3); g.lineTo(x+cs*0.66,fy+fh*0.6); g.stroke();
      for(const [a,b] of [[0.18,0.22],[0.5,0.18],[0.82,0.3],[0.32,0.55],[0.66,0.5],[0.15,0.8],[0.5,0.82],[0.86,0.75]]) knob(x+cs*a,fy+fh*b,2.1);
      g.strokeStyle='rgba(90,150,70,.7)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(x+cs*0.9,fy); g.quadraticCurveTo(x+cs*0.98,fy+fh*0.5,x+cs*0.86,fy+fh); g.stroke(); }
    for(const [q,sx] of [[k-1,0],[k+1,cs]]) if(low(q)) for(const b of [0.25,0.6,0.88]) knob(x+sx+(sx?-3:3),y+cs*b,1.7);
    if(low(k-c.w)) for(const a of [0.3,0.7]) knob(x+cs*a,y+3,1.7); }
  g.restore();
}
// the drawn things that stand up (posts, rings, chains, crates, curtains, bars, flaps) sort with the figures
function p2Stand(list,o,y,fn){ list.push({x:o.x,y,r:6,flying:true,draw:fn}); }
{ const base=eventsForRender; eventsForRender=function(list){
  base(list);
  if(!G||!player) return; const t=G.time;
  if(AREA){ const A=AREA, C=A.p2;
    for(const o of A.grapples||[]) if(inView(o.x,o.y,80)) p2Stand(list,o,o.y,()=>p2DrawPost(o.x,o.y,t));
    for(const o of A.objs){ const K=o.p2&&P2K[o.p2]; if(!K||!K.stand||!inView(o.x,o.y,120)) continue; p2Stand(list,o,K.sy?K.sy(o):o.y,()=>K.stand(o,t)); }
    if(C){ for(const R of C.runs||p2CaveRuns(A)){ if(R.vert||R.list.some(g=>g.tmp&&g.closed)||!inView((R.x0+R.x1)/2,(R.y0+R.y1)/2,R.len/2+80)) continue; p2Stand(list,R,(R.y0+R.y1)/2+6,()=>p2DrawRun(R,t)); }
      for(const b of C.bridges) if(b.a<0.97&&inView(b.rx,b.ry,160)) p2Stand(list,b,b.hinge==='s'?b.y1:b.y0+4,()=>p2DrawBridge(b,t,true)); }
  }else{
    const k=curMap();
    for(const q of ELEV.posts(k)) if(inView(q.x,q.y,80)) p2Stand(list,q,q.y,()=>p2DrawPost(q.x,q.y,t));
    for(const o of mapList(P2.out,k)){ const K=P2K[o.p2]; if(!K||!K.stand||!inView(o.x,o.y,160)) continue; p2Stand(list,o,K.sy?K.sy(o):o.y,()=>K.stand(o,t)); }
  }
}; }
// the flat parts
{ const base=drawLandmark; drawLandmark=function(o,t){ if(o&&o.p2){ const K=P2K[o.p2]; if(K&&K.ground) K.ground(o,t); return; } return base(o,t); }; }
for(const kind in P2K){ const K=P2K[kind]; FL['p2_'+kind]=(o,t)=>{ if(K.ground) K.ground(o,t); }; }
{ const base=drawFurnX; drawFurnX=function(o,t){ if(o&&o.k==='cgate'&&o.p2t&&!(o.tmp&&o.closed)) return true; return base(o,t); }; }
FL.p2_blockring=(o,t)=>{ const b=o.ref; if(!b||b.sunk) return; const x=b.x, y=b.y+10, sb=LOOK.sb; ctx.save(); ctx.strokeStyle=sb?SBC.outline:'#1a1008'; ctx.lineWidth=4.4; ctx.beginPath(); ctx.arc(x,y,6,0,TAU); ctx.stroke(); ctx.strokeStyle='#d8c8a8'; ctx.lineWidth=2.4; ctx.stroke(); ctx.fillStyle='#5a5a66'; ctx.fillRect(x-5,y-9,10,4); ctx.restore(); if(canGrapple()) glowAt(x,y,10,'255,160,80',0.14+0.08*Math.sin(t*4)); };
// a climb spot: a strip of handholds (and a knotted vine) going up the wall, or over the edge and down
FL.p2_climbspot=(o,t)=>{
  const x=o.x, y=o.y, up=o.up, sb=LOOK.sb, can=canClaws();
  ctx.save(); ctx.fillStyle='rgba(20,12,16,.35)'; ctx.beginPath(); ctx.ellipse(x,y+6,18,8,0,0,TAU); ctx.fill();
  const top=up?y-78:y-30, bot=up?y-10:y+14;
  ctx.fillStyle=sb?SBC.outline:'#1a1010'; rrect(ctx,x-12,top-2,24,bot-top+4,6); ctx.fill(); ctx.fillStyle=up?'#7a6a5c':'#2a2024'; rrect(ctx,x-10.5,top,21,bot-top,5); ctx.fill();
  for(let yy=top+6,i=0;yy<bot-3;yy+=9,i++){ const xx=x+(i%2?5:-5); ctx.fillStyle='rgba(30,16,20,.45)'; ctx.beginPath(); ctx.ellipse(xx+0.8,yy+1.4,2.4,1.7,0,0,TAU); ctx.fill(); ctx.fillStyle='#e6dcc8'; ctx.beginPath(); ctx.ellipse(xx,yy,2.4,1.7,0,0,TAU); ctx.fill(); }
  ctx.strokeStyle='#6a9a4a'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(x+8,top); ctx.quadraticCurveTo(x+11,(top+bot)/2,x+7,bot); ctx.stroke();
  if(can){ const k=(t*1.2)%1; for(let n=0;n<2;n++){ const f=(k+n*0.5)%1, cy=up?lerp(y-14,y-70,f):lerp(y-24,y+8,f), al=Math.sin(f*Math.PI)*0.9; ctx.strokeStyle=`rgba(255,226,150,${al})`; ctx.lineWidth=2.4; ctx.beginPath(); if(up){ ctx.moveTo(x-6,cy+4); ctx.lineTo(x,cy-2); ctx.lineTo(x+6,cy+4); } else { ctx.moveTo(x-6,cy-4); ctx.lineTo(x,cy+2); ctx.lineTo(x+6,cy-4); } ctx.stroke(); } }
  ctx.restore();
};

// ---------- 12. the powers' names, how-to and tips (the Powers page, the banners), with the controls of the device in use
defineAbility('claws',{act:2,icon:'a_claws',name:'Climbing Claws',short:'Claws',skill:'climb2',
  how:c=>S(`Walk into a cliff or wall with cracks, handholds or vines and you climb it, one cliff at a time. Keep pushing to go up or down, let go to hang on, press ${c.jump} to drop. You cannot attack while you climb, and nothing on foot can follow you.`,`Walk into a cracked cliff to climb it. Keep pushing. ${c.jump} drops you.`),
  tip:c=>S(`Cracks and handholds mean you can climb. Walk into them and keep pushing. Press ${c.jump} to let go.`,`Walk into handholds and keep pushing!`),
  banner:()=>S('Your claws grow strong and grippy. Walk into a cracked wall to climb it!','Walk into a cracked wall to climb!'),
  plain:S('Walk into a cracked wall to climb it!','Walk into a cracked wall to climb!')});
defineAbility('grapple',{act:2,icon:'a_grapple',name:'Grapple Tail',short:'Grapple',skill:'hook2',
  how:c=>S(`When a ring or post glows gold, press ${c.use} and your tail zips you over: across gaps, water and lava, and up one level. Over a pit you hang from a ring: press ${c.use} at the next one. On a chain ring, press ${c.use}, keep holding it and walk away to pull.`,`Press ${c.use} at a gold ring to zip to it. On a chain, hold ${c.use} and walk away.`),
  tip:c=>S(`Look for brass rings and posts. When one glows gold, press ${c.use}. Hold ${c.use} and walk away from a chain ring to pull it.`,`Press ${c.use} at a gold ring!`),
  banner:c=>S(`Your tail is a rope now. Press ${c.use} at a glowing ring to zip to it!`,`Press ${c.use} at a ring to zip to it!`),
  plain:S('Your tail is a rope! Zip to glowing rings.','Your tail is a rope!')});
defineAbility('shadow',{act:2,icon:'a_shadow',name:'Shadow Dash',short:'Shadow Dash',skill:'dash2',
  how:c=>S(`Press ${c.roll} to dash as a shadow: nothing can hurt you, and you slip through moth curtains, shadow bars and light beams. Dash from inside a long shadow and you ride it all the way to its far end, even over a gap.`,`Press ${c.roll} to dash as a shadow. Slip through moths, bars and light!`),
  tip:c=>S(`Your roll is a Shadow Dash now. Moths cannot catch a shadow, and shadow bars let one through while they are dark. Start inside a shadow to ride it.`,`Dash through moth curtains. Start in a shadow to ride it!`),
  banner:c=>S(`Press ${c.roll} and you are a shadow for a moment. Moth curtains cannot stop you!`,`Press ${c.roll} to dash as a shadow!`),
  plain:S('Dash as a shadow through moths and bars!','Dash as a shadow!')});

// ---------- 13. a sandbox (__eb.p2Test) and debug hooks
// The Power Lab: a small test dungeon with every dungeon piece of the three powers (no door leads to it).
const P2_LAB={
  a:['...............','...............','...{{{{{{=====.','...{{{{{{=====.','...{{{{{{=====.','...............','...............','..,,,,,,.......','..,,,,,,.......','..........s....','...............'],
  b:['...............','...............','......P..[.....','...............','...............','...............','...............','...............','...............','.......s.......','...............'],
  c:['..]......).....','..]......).Z...','..]......).....','..]......).....','..]......).....','..].s....).....','..]......).....','..]......).....','..]......).....','..]......).....','..]......).....'],
  d:['...............','...............','....ooooooo....','..,,ooooooo,,..','....ooooooo....','...............','...............','......oooo.....','......oooo.....','......oooo.....','...............'],
  e:['..}.........===','.........(..=@=','............===','.......@.......','oooooooooooooo.','oooooo&ooooooo.','oooooooooooooo.','...............','...............','...............','...............'],
  f:['..}............','...............','...............','...............','.......s.......','...............','...............','...............','...............','...............','...............']
};
Object.assign(PUZZLE_KINDS,{chain:1});
defineDungeon('p2_lab',{name:S('The Power Lab','The Power Lab'),level:10,theme:'earth',seed:202,save:'p2_lab',noJuniper:true,giftOK:{},dark:0.3,
  dunKind:S('A test cave','A test cave'),
  story:{in:[['ash',S('A cave for practicing the powers of the coast. Handy.','A cave to practice my powers!')]]},
  floors:[
    {id:'1',name:S('The Lab','The Lab'),map:{rooms:{
      a:{at:[1,2],kind:'start',tpl:P2_LAB.a,sign:S('Claws: walk into the cracked dais to climb it. The plain stone one stays too steep.','Climb the cracked dais.'),noPots:true},
      b:{at:[1,1],kind:'plates',tpl:P2_LAB.b,sign:S('Hook the block with your tail and pull it onto the plate.','Pull the block onto the plate.'),noPots:true,noDecor:true},
      c:{at:[0,1],kind:'free',tpl:P2_LAB.c,sign:S('Moths, light and shadow bars. Dash through as a shadow.','Dash through as a shadow.'),lightbeams:[{a:[5,0],b:[5,10],on:2.2,off:1.6}],noPots:true},
      d:{at:[2,1],kind:'free',tpl:P2_LAB.d,shadows:[{a:[2,3],b:[12,3],w:1}],bridges:[{a:[6,8],b:[9,8],ring:[10,8]}],noPots:true},
      e:{at:[1,0],kind:'chain',tpl:P2_LAB.e,noPots:true,noDecor:true}},
      links:[['a','b','open'],['b','c','moth'],['b','d','shadow'],['b','e','open']]}},
    {id:'2',name:S('The Lab Loft','The Lab Loft'),map:{rooms:{f:{at:[1,0],kind:'free',tpl:P2_LAB.f,sign:S('You climbed up here. The climb spot takes you back.','Climb back down here.'),noPots:true}},links:[]}}
  ]});
const P2_SB={x:12000,y:20900,built:false};
function p2SandboxOut(){
  const S0=P2_SB, x=S0.x, y=S0.y; if(S0.built) return S0; S0.built=true;
  ELEV.clear({rect:[x-900,y-560,x+1750,y+760]});
  ELEV.plateau({rect:[x-500,y-440,x+500,y-200],lvl:1,style:'chalk',climb:true,noise:6,id:'p2sb_cliff'});
  ELEV.plateau({rect:[x+700,y-120,x+1000,y+320],lvl:1,style:'rock',noise:4,id:'p2sb_t1'});
  ELEV.plateau({rect:[x+1250,y-120,x+1550,y+320],lvl:1,style:'rock',noise:4,id:'p2sb_t2'});
  ELEV.ramp({x0:x+800,y0:y+300,x1:x+880,y1:y+380,dir:'n',kind:'stairs'});
  ELEV.grapple({x:x,y:y-262}); ELEV.grapple({x:x+960,y:y+100}); ELEV.grapple({x:x+1292,y:y+100});
  p2Add('shadowlane',{id:'p2sb_lane',pts:[[x+880,y+210],[x+1100,y+230],[x+1370,y+210]],w:46});
  p2Add('ring',{id:'p2sb_ring',x:x+1125,y:y-20,h:62,hang:true});
  p2Add('mothcurtain',{id:'p2sb_moth',x:x-300,y:y+320,w:16,h:160});
  p2Add('shadowbars',{id:'p2sb_bars',x:x-170,y:y+320,w:16,h:160});
  p2Add('thinbars',{id:'p2sb_iron',x:x-430,y:y+320,w:16,h:160,style:'iron'});
  p2Add('lightbeam',{id:'p2sb_beam',x0:x-40,y0:y+230,x1:x-40,y1:y+420,on:2,off:1.5});
  p2Add('chainring',{id:'p2sb_lever',x:x+300,y:y+60,mode:'lever',then:()=>setBanner(S('Clunk!','Clunk!'),S('The lever is down.','The lever is down.'),1.6)});
  p2Add('pullblock',{id:'p2sb_crate',x:x+220,y:y+520,axis:'y',goal:{x:x+220,y:y+330,r:26}});
  p2Add('drawbridge',{id:'p2sb_bridge',x0:x-640,y0:y+420,x1:x-560,y1:y+600,hinge:'s'});
  return S0;
}
function p2LabCell(room,c,r){ const A=AREA; if(!A||!A.rooms||!A.rooms[room]) return null; const R=A.rooms[room], cs=A.cave.cell; return {x:A.x0+(R.ox+1+c+0.5)*cs,y:A.y0+(R.oy+1+r+0.5)*cs}; }
function p2Test(kind){
  for(const id of ['jump','claws','grapple','shadow']) if(!hasAbil(id)){ G.abil=G.abil||{}; G.abil[id]=true; }
  G.flags.forge=true; P2.tips.climb=9; P2.tips.hang=9; P2.tips.pull=9; P2.tips.chain=9; P2.tips.ring=9;
  kind=kind||'cave';
  if(kind==='out'){ if(AREA) exitArea(true); const S0=p2SandboxOut(); player.x=S0.x; player.y=S0.y+40; moveReset(player); updateCam(0,true); return {x:S0.x,y:S0.y}; }
  if(kind==='cinder'){ if(AREA) exitArea(true); player.x=6070; player.y=1950; moveReset(player); updateCam(0,true); return {x:6070,y:1950,lvl:elevLvl(6070,1950)}; }
  const room=kind==='cave'?'a':kind; dunGo('p2_lab',room); return {area:AREA&&AREA.id,room};
}
window.__ebX=Object.assign(window.__ebX||{},{
  p2Test, p2Add, p2Shine, p2ShadeAt, p2LitAt, p2Thin, P2, P2N, P2K,
  p2:{ cell:p2LabCell, sandbox:p2SandboxOut, SB:P2_SB, targets:()=>{ const p=player; return p2Targets(p).map(t=>({kind:t.kind,src:t.src,x:Math.round(t.x),y:Math.round(t.y),lvl:t.lvl})); },
    tgt:()=>{ const t=P2.tgt; return t?{kind:t.kind,src:t.src,x:Math.round(t.x),y:Math.round(t.y),lvl:t.lvl,land:t.land||null}:null; },
    state:()=>{ const p=player, M=P2.mv; return {mv:M?M.kind:null,dash:!!P2.dash,pull:P2.pull?{src:P2.pull.t.src,strain:+P2.pull.strain.toFixed(2),taut:P2.pull.taut,rope:Math.round(P2.pull.rope)}:null,x:Math.round(p.x),y:Math.round(p.y),z:+(p.z||0).toFixed(1),lvl:p2Lvl(p.x,p.y),useHeld:P2.useHeld,pass:P2.pass,iframes:+p.iframes.toFixed(2)}; },
    gates:()=>AREA&&AREA.p2?AREA.p2.gates.map(o=>({id:o.id,t:o.p2t,closed:o.closed,open:p2GateOpen(o),lit:!!o.lit,oa:+o.oa.toFixed(2)})):null,
    objs:()=>p2Objs().filter(o=>o.p2).map(o=>({id:o.id,k:o.p2,x:Math.round(o.x),y:Math.round(o.y),done:!!o.done,down:!!o.down,open:o.p2==='mothcurtain'?p2CurtainOpen(o):undefined,lit:o.lit})),
    go:(x,y)=>{ if(AREA) exitArea(true); player.x=x; player.y=y; moveReset(player); updateCam(0,true); return {x,y}; },
    use:()=>{ const t=P2.tgt; if(t) p2Use(t); return !!t; }, climbPlan:(dx,dy)=>p2ClimbPlan(player,dx,dy), dashOK:()=>p2DashOK(player)}
});
