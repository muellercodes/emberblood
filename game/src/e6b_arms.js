// ================= v9 arms: three new weapons on the weapon registry (a6b_weapons.js defineWeapon), one per act
//   Act II  Chain Whip  ('whip')    a long lash that pulls things to Ash, cracks to stun, swings him from hook posts
//   Act III Blast Bombs ('bombs')   thrown in an arc, 1.6 s fuse, breaks cracked walls and boulders, lights fuses
//   Act IV  Moon Glaive ('glaive')  thrown, bounces off one wall and comes back, or held to orbit Ash; stronger at night
// plus the world pieces they need: boulders, bomb flowers, whip hooks, moon silk webs and fuses (outdoors as landmarks,
// inside areas as objects). Numbers, puzzle uses and the API: scratchpad ARMS.md. Debug: __eb.giveAllWeapons(),
// __eb.refillBombs(n), __eb.armsSpawn(kind,x,y,opts), __eb.armsState().
const ARMS={g:null,lm:[],yanks:[],drops:[],swing:null,once:null,hamCh:0,regen:0,kickT:0,hissT:0,shops:['pell']};
const WHIP_LEN=220, WHIP_HOLD=0.16, WHIP_CHARGE=0.55;
const BOMB_FUSE=1.6, BOMB_R=96, BOMB_MAX=10, BOMB_G=900, BOMB_NEAR=70, BOMB_FAR=300, BOMB_LIVE=3;
const GLV_SPD=760, GLV_RANGE=400, GLV_HOLD=0.22, GLV_ORB=58;
const ARMS_SRC={whip:'whip',bomb:'bombs',glaive:'glaive'};   // hit source -> weapon id
const AT=(full,simple)=>simplify(S(full,simple));             // player-facing text for ftext (which does not simplify by itself)

// ---------- small shared helpers
function armsReset(){ ARMS.g=G; ARMS.yanks.length=0; ARMS.drops.length=0; ARMS.swing=null; ARMS.regen=0; for(const o of ARMS.lm) armsSync(o); }
function armsNag(o,txt){ if(o.nag>G.time) return; o.nag=G.time+1.3; ftext(o.x,o.y-30,txt,'#ffe0b0',12); }
function armsNear(o,x,y,r){ if(o.w) return x>o.x-o.w/2-r&&x<o.x+o.w/2+r&&y>o.y-o.h/2-r&&y<o.y+o.h/2+r; return dist2(x,y,o.x,o.y)<(r+(o.r||16))**2; }
// a wall for things that fly over the floor: cave pools are not walls (the bow and boomerang keep the old rule)
function armsWall(x,y){
  if(AREA&&AREA.cave){ const A=AREA, c=A.cave, i=Math.floor((x-A.x0)/c.cell), j=Math.floor((y-A.y0)/c.cell); if(i<0||j<0||i>=c.w||j>=c.h) return true; const k=j*c.w+i; if(c.grid[k]===1&&c.typ&&c.typ[k]===1) return wColAt(x,y,2); }
  return wWall(x,y);
}
// what a bomb would land in: null, 'water', 'pit' or 'lava'
const ABT={};
function armsHazard(x,y){
  if(AREA){
    const A=AREA, c=A.cave; if(!c) return null;
    const i=Math.floor((x-A.x0)/c.cell), j=Math.floor((y-A.y0)/c.cell); if(i<0||j<0||i>=c.w||j>=c.h) return null; const k=j*c.w+i;
    if(c.grid[k]===1&&c.typ&&c.typ[k]===1) return 'water';
    if(A.tri&&typeof tHole==='function'){ if(tHole(k)||c.typ[k]===TY.chasm) return 'pit'; if(tWet(k)) return 'water'; }
    return null;
  }
  const t=T(x,y,ABT); if(t.bridge) return null; if(t.lava>0.5) return 'lava'; if(t.water>0.5) return 'water'; return null;
}
// the screen point of Ash's weapon hand (the 3D figure records it while drawing; 2D falls back to his side)
function armsHand(p){
  if(T3.on&&typeof AINFO!=='undefined'&&AINFO.ht!=null&&G&&Math.abs(AINFO.ht-G.time)<0.06) return [AINFO.hx,AINFO.hy];
  const f=p.facing; return [p.x+Math.cos(f)*10-Math.sin(f)*10,p.y+Math.sin(f)*10+Math.cos(f)*10-(T3.on?15:0)-(p.z||0)];
}
function armsLift(){ return T3.on?T3.st:0; }
// little synthesized sounds of our own, through the game's audio context (a whip crack and a fuse hiss)
const asnd=(()=>{
  let ac0=null,out=null; const last={};
  function bus(){ const ac=SFX.ac; if(!ac) return null; if(ac!==ac0){ ac0=ac; out=ac.createGain(); out.gain.value=0.45; out.connect(ac.destination); } return ac; }
  function nz(ac,dur,vol,ft,f0,f1,q,dl){ const nb=SFX.noise; if(!nb) return; const t=ac.currentTime+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=nb; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.03); }
  function tn(ac,type,f0,f1,dur,vol,dl){ const t=ac.currentTime+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.01,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.03); }
  return (name,v)=>{
    if(SFX.muted) return; const now=performance.now(); if(last[name]&&now-last[name]<40) return; last[name]=now; v=v==null?1:v;
    try{ const ac=bus(); if(!ac) return;
      if(name==='crack'){ nz(ac,0.05,0.32*v,'highpass',5200,2600,0.6); nz(ac,0.12,0.12*v,'bandpass',2400,900,1.5,0.012); tn(ac,'square',1900,700,0.04,0.05*v); }
      else if(name==='hiss') nz(ac,0.26,0.035*v,'highpass',4200,6800,0.5);
      else if(name==='hum'){ tn(ac,'sine',520,560,0.14,0.03*v); nz(ac,0.12,0.04*v,'bandpass',1400,2200,6); }
      else if(name==='kick'){ tn(ac,'triangle',240,120,0.07,0.06*v); nz(ac,0.06,0.08*v,'lowpass',900,300); }
    }catch(e){}
  };
})();
// cached sprites
const ARMSPR=new Map();
// (drawn at twice the size so they stay crisp when zoomed or on sharp screens; aPut draws one at its own size)
function aSpr(key,w,h,fn){ let c=ARMSPR.get(key); if(!c){ c=mkCanvas(w*2,h*2); c._w=w; c._h=h; const g=c.getContext('2d'); g.scale(2,2); g.lineJoin='round'; g.lineCap='round'; fn(g,w,h); ARMSPR.set(key,c); } return c; }
function aPut(c,x,y){ ctx.drawImage(c,x,y,c._w,c._h); }

// ================================================================== Chain Whip
function whipExt(pr,crack){
  const pk=crack?0.38:0.42;
  return pr<pk?1-Math.pow(1-pr/pk,2.2):pr<pk+0.16?1:Math.max(0,1-(pr-pk-0.16)/(1-pk-0.16));
}
// the lash's shape this frame: 12 points from Ash to the tip on a lazy curve, clipped at the first wall
function whipGeo(p){
  const L=p.wl; if(!L||!(p.swingT>0)||p.swingW!=='whip') return null;
  const pr=clamp(1-p.swingT/p.swingDur,0,1), s=p.swingSide||1, ext=whipExt(pr,L.crack);
  const sweep=L.crack?0:s*lerp(0.5,-0.22,smooth(clamp(pr/0.55,0,1))), a=p.swingDir+sweep;
  const ox=p.x+Math.cos(p.swingDir)*8, oy=p.y+Math.sin(p.swingDir)*8;
  let len=L.len*ext;
  for(let d=14;d<len;d+=12) if(armsWall(ox+Math.cos(a)*d,oy+Math.sin(a)*d)){ len=Math.max(0,d-6); break; }
  const tx=ox+Math.cos(a)*len, ty=oy+Math.sin(a)*len, bend=(L.crack?0.05:0.2)*s*Math.sin(Math.PI*Math.min(1,ext))*len*(pr<0.42?1:0.45);
  const cx=(ox+tx)/2-Math.sin(a)*bend, cy=(oy+ty)/2+Math.cos(a)*bend, P=L.pts||(L.pts=new Array(24));
  for(let i=0;i<12;i++){ const t=i/11, u=1-t; P[i*2]=u*u*ox+2*u*t*cx+t*t*tx; P[i*2+1]=u*u*oy+2*u*t*cy+t*t*ty; }
  L.ox=ox; L.oy=oy; L.tx=tx; L.ty=ty; L.ext=ext; L.a=a; L.pr=pr; L.len2=len;
  return L;
}
function whipInput(dt,atk,free,p){
  const W=p.whip;
  if(W){
    W.t+=dt;
    if(p.dashT>0||p.drinkT>0){ p.whip=null; return; }
    if(W.ph==='wind'){ if(!atk){ p.whip=null; whipLash(p,false); } else if(W.t>=WHIP_HOLD){ W.ph='twirl'; W.t=0; W.ch=0; W.sT=0; } return; }
    W.ch=Math.min(1,W.t/WHIP_CHARGE); p.slowT=Math.max(p.slowT||0,0.05);
    if(p.aim!=null) p.facing=turnTo(p.facing,p.aim,12*dt);
    W.sT-=dt; if(W.sT<=0){ W.sT=W.ch>=1?0.11:0.16; wsnd('whirr',0.9); }
    if(W.ch>=1&&!W.full){ W.full=true; wsnd('ping',0.6); }
    if(!atk){ p.whip=null; whipLash(p,W.ch>=1); }
    return;
  }
  if(atk&&free&&!(p.swingT>0)){ if(p.stamina<2.5){ p.atkCd=0.2; return; } p.whip={ph:'wind',t:0}; }
}
function whipLash(p,crack){
  if(!useStamina(crack?10:5)){ p.atkCd=0.2; return; }
  const st=p.stats, n=crack?0:p.comboTimer>0&&p.comboW==='whip'?(p.combo+1)%2:0;
  p.combo=n; p.comboW='whip'; p.swingW='whip'; p.swingDir=p.facing; p.swingHit=new Set(); p.swingHitstop=false; p.swingObj=false;
  p.swingSide=crack?1:n===0?1:-1; p.swingFin=crack; p.swingSpin=false;
  p.swingDur=crack?0.34:0.27; p.swingT=p.swingDur;
  p.atkCd=(crack?0.44:0.25)/st.atkSpeed; p.comboTimer=p.atkCd+0.38;
  p.wl={len:WHIP_LEN*(crack?1.1:1),crack,objs:new Set(),snapped:false,swung:false};
  wsnd('whoosh',crack?1:0.6); SFX.play('slash',crack?0.6:0.35);
}
function whipHits(p){
  const L=whipGeo(p); if(!L) return;
  const P=L.pts, crack=L.crack;
  if(L.ext>=0.97&&!L.snapped){ L.snapped=true; asnd('crack',crack?1:0.55); G.wfx.push({k:'snap',x:L.tx,y:L.ty,t:0,dur:crack?0.34:0.22,big:crack});
    emit(L.tx,L.ty,crack?14:6,{col:'255,245,220',smin:80,smax:crack?320:180,lmin:.08,lmax:.2,zmin:1,zmax:2.2,drag:6}); if(crack){ shake(4); hitstop=Math.max(hitstop,0.03); } }
  if(L.ext<0.3||L.pr>0.78) return;
  let any=false;
  for(const e of G.enemies){
    if(!wFoeOk(e)||p.swingHit.has(e.id)) continue;
    let best=null, bi=-1;
    for(const c of hitCircles(e)) for(let i=4;i<12;i++){ if(dist2(P[i*2],P[i*2+1],c.x,c.y)<(c.r+8)**2){ if(i>bi){ bi=i; best=c; } } }
    if(!best) continue;
    p.swingHit.add(e.id); any=true;
    const tip=bi>=9, small=!e.boss&&!e.mini&&(e.r||10)<=16&&e.type!=='vorlaxis', d=dist(e.x,e.y,p.x,p.y);
    const k=(crack?1.9:p.combo===1?1.05:0.85)*(tip?1.25:0.62), pull=small&&tip;
    if(crack&&e.shield&&e.blocking){ e.blocking=false; ftext(e.x,e.y-e.r-20,'GUARD BREAK!','#ffd27a',12); }
    const kb=pull?Math.min(1300,7*Math.max(0,d-(p.r||12)-(e.r||10)-18))/Math.max(0.3,e.kbRes||1):90;
    wStrike(e,best,k,'whip',{src:'whip',kb,ka:pull?angTo(e.x,e.y,p.x,p.y):L.a,fx:L.ox,fy:L.oy});
    if(!e.dead){ if(e.flying){ stunEnemy(e,1.4); if(!(e.whipT>G.time)){ e.whipT=G.time+2; ftext(e.x,e.y-e.r-18,AT('Stunned!','Stunned!'),'#cfe6ff',11); } } else if(crack) stunEnemy(e,0.9); }
    emit(best.x,best.y,tip?8:4,{col:'235,240,250',smin:70,smax:220,lmin:.08,lmax:.2,zmin:1,zmax:2,drag:6});
  }
  if(any&&!p.swingHitstop){ p.swingHitstop=true; hitstop=Math.max(hitstop,crack?0.06:0.025); shake(crack?4:1.5); SFX.play('hit',0.7); }
  // the tip swats enemy shots out of the air
  for(const q of G.projectiles) if(q.owner==='enemy'&&!q.dead) for(let i=7;i<12;i++) if(dist2(q.x,q.y,P[i*2],P[i*2+1])<(q.r+10)**2){ q.dead=true; smallBoom(q.x,q.y); break; }
  if(L.ext<0.55) return;
  const tx=L.tx, ty=L.ty;
  // the outer part of the chain touches things as it sweeps (the tip alone moves too fast to rely on)
  const near=(x,y,r)=>{ for(let i=6;i<12;i++) if(dist2(x,y,P[i*2],P[i*2+1])<r*r) return true; return false; };
  // loose things: coins and hearts fly to Ash
  for(const k of G.pickups) if(k.life>0&&near(k.x,k.y,30)){ const a=angTo(k.x,k.y,p.x,p.y); k.vx=Math.cos(a)*720; k.vy=Math.sin(a)*720; }
  for(const b of ARMS.drops) if(near(b.x,b.y,30)){ const a=angTo(b.x,b.y,p.x,p.y); b.vx=Math.cos(a)*700; b.vy=Math.sin(a)*700; }
  // bombs on the ground: a lash yanks them back to Ash, a crack drives them far away
  for(const b of G.wproj) if(b.k==='bomb'&&!b.dead&&b.st!=='fly'&&!L.objs.has(b)&&near(b.x,b.y,22)){
    L.objs.add(b); asnd('kick');
    if(crack){ const a=L.a; b.st='fly'; b.vx=Math.cos(a)*430; b.vy=Math.sin(a)*430; b.vz=230; b.z=2; b.bounce=0; }
    else{ const a=angTo(b.x,b.y,p.x,p.y), dd=dist(b.x,b.y,p.x,p.y); b.vx=Math.cos(a)*Math.min(520,2.3*Math.max(0,dd-30)); b.vy=Math.sin(a)*Math.min(520,2.3*Math.max(0,dd-30)); b.st='slide'; }
  }
  // hook posts: wrap around and swing
  if(!L.swung&&L.ext>0.7){ for(let i=8;i<12;i++){ const h=armsHookAt(P[i*2],P[i*2+1],26); if(h){ L.swung=true; whipSwing(p,h); return; } } }
  // objects: inside areas through areaObjHit (levers, keys, pots, crystals, switches...), outdoors our own pass
  ARMS.once=L.objs;
  for(let i=7;i<12;i+=2){ const x=P[i*2], y=P[i*2+1];
    if(AREA) areaObjHit(x,y,14,'whip');
    else{ armsWorldHit(x,y,14,'whip'); for(const o of mapList(LANDMARKS,curMap())) if(o.breakable&&!o.broken&&!L.objs.has(o)&&dist2(o.x,o.y,x,y)<28*28){ L.objs.add(o); armsYank(o,'lmpot'); } } }
  ARMS.once=null;
}
function armsHookAt(x,y,r){
  if(AREA){ for(const o of AREA.objs) if(o.k==='whiphook'&&dist2(o.x,o.y,x,y)<r*r) return o; return null; }
  for(const o of ARMS.lm) if(o.k==='whiphook'&&dist2(o.x,o.y,x,y)<r*r) return o; return null;
}
// the swing: Ash leaps past the hook in an arc (the game's own jump, so pits, water and spikes are cleared in the air)
function whipSwing(p,h){
  const d=Math.max(40,dist(p.x,p.y,h.x,h.y)), ux=(h.x-p.x)/d, uy=(h.y-p.y)/d;
  let tx, ty; if(h.to){ tx=h.to.x; ty=h.to.y; } else { const far=Math.min(d*0.95,170); tx=h.x+ux*far; ty=h.y+uy*far; }
  const D=dist(p.x,p.y,tx,ty), t=clamp(D/560,0.42,0.8), sp=D/t, a=angTo(p.x,p.y,tx,ty);
  p.swingT=0; p.whip=null; p.dashT=0;
  p.z=Math.max(p.z||0,0.01); p.vz=0.5*JUMP_G*(p.stats.jumpK||1)*t; p.avx=Math.cos(a)*sp; p.avy=Math.sin(a)*sp; MV.takeSpd=sp; p.dbl=true; p.slam=false;
  p.sqT=0.14; p.sqD=0.14; p.sqA=-0.12; p.facing=a;
  ARMS.swing={h,t:0,dur:t,vx:p.avx,vy:p.avy};
  asnd('crack',0.7); wsnd('whoosh'); mvSnd('jump');
  if(!G.flags.wpn_hookSwing){ G.flags.wpn_hookSwing=true; setBanner(S('Whip swing!','Whip swing!'),S('Lash a hook post to swing over a gap.','Lash a hook to swing over gaps.'),2.6); }
}
function whipUpdate(dt,eq){
  const p=player, S2=ARMS.swing;
  if(S2){ S2.t+=dt; if(S2.t<S2.dur*0.9){ p.avx=S2.vx; p.avy=S2.vy; } if(S2.t>S2.dur+0.1||!(p.z>0||p.vz>0)) ARMS.swing=null; }
  if(!eq&&p.whip) p.whip=null;
  if(p.wl&&!(p.swingT>0&&p.swingW==='whip')) p.wl=null;
}
// drawing: the chain from the hand to the tip, the twirl over his head, the snap
function whipChain(pts,n,hx,hy,lift,crack,alpha){
  ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.lineJoin='round'; ctx.lineCap='round';
  const X=i=>pts[i*2], Y=i=>pts[i*2+1];
  const path=()=>{ ctx.beginPath(); ctx.moveTo(hx,hy); for(let i=1;i<n;i++){ const t=i/(n-1), k=Math.pow(1-t,1.5); ctx.lineTo(X(i)+(hx-X(0))*k,Y(i)+(hy-Y(0))*k-lift*(1-k)); } };
  path(); ctx.strokeStyle='#1c140e'; ctx.lineWidth=4.4; ctx.stroke();
  ctx.strokeStyle=crack?'#d8e2ee':'#9aa6b4'; ctx.lineWidth=2.4; ctx.setLineDash([3.4,2.2]); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=0.9; ctx.lineDashOffset=1.6; ctx.stroke(); ctx.setLineDash([]);
  const ex=X(n-1), ey=Y(n-1)-lift;
  ctx.fillStyle='#1c140e'; ctx.beginPath(); ctx.arc(ex,ey,4.2,0,TAU); ctx.fill(); ctx.fillStyle='#e0b24a'; ctx.beginPath(); ctx.arc(ex,ey,2.8,0,TAU); ctx.fill();
  ctx.restore();
}
function whipFx(t3){
  const p=player; if(!p||p.dead||!G.wfx) return;
  for(const f of G.wfx){ if(f.k!=='snap') continue; const k=f.t/f.dur, a=1-k, r=(f.big?10:6)+(f.big?26:14)*k, lift=4*armsLift();
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,250,235,${0.85*a})`; ctx.lineWidth=f.big?2.6:1.6;
    for(let i=0;i<8;i++){ const b=i*TAU/8+f.x*0.02; ctx.beginPath(); ctx.moveTo(f.x+Math.cos(b)*r*0.35,f.y-lift+Math.sin(b)*r*0.35); ctx.lineTo(f.x+Math.cos(b)*r,f.y-lift+Math.sin(b)*r); ctx.stroke(); }
    ctx.restore(); }
  const L=p.wl;
  if(p.swingT>0&&p.swingW==='whip'&&L&&L.pts&&L.ox!=null){ const [hx,hy]=armsHand(p); whipChain(L.pts,12,hx,hy,4*armsLift(),L.crack); return; }
  if(p.whip&&p.whip.ph==='twirl'){
    const [hx,hy]=armsHand(p), ch=p.whip.ch||0, R=20+6*ch, cy=hy-8, sp=G.time*(ch>=1?20:13);
    ctx.save(); ctx.lineCap='round';
    ctx.strokeStyle=`rgba(230,236,245,${0.18+0.2*ch})`; ctx.lineWidth=6; ctx.beginPath(); ctx.ellipse(hx,cy,R,R*0.42,0,0,TAU); ctx.stroke();
    const tx=hx+Math.cos(sp)*R, ty=cy+Math.sin(sp)*R*0.42;
    ctx.strokeStyle='#1c140e'; ctx.lineWidth=3.6; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.quadraticCurveTo(hx+Math.cos(sp-0.9)*R*0.8,cy+Math.sin(sp-0.9)*R*0.34,tx,ty); ctx.stroke();
    ctx.strokeStyle='#a8b2be'; ctx.lineWidth=2; ctx.setLineDash([3,2]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=ch>=1?'#ffe08a':'#e0b24a'; ctx.beginPath(); ctx.arc(tx,ty,3,0,TAU); ctx.fill();
    if(ch>=1) glowAt(tx,ty,10,'255,230,150',0.6);
    ctx.restore(); return;
  }
  const S2=ARMS.swing;
  if(S2&&S2.t<S2.dur*0.6){ const [hx,hy]=armsHand(p), h=S2.h, a=1-S2.t/(S2.dur*0.6), lift=30*armsLift();
    ctx.save(); ctx.globalAlpha=0.4+0.6*a; ctx.lineCap='round'; ctx.strokeStyle='#1c140e'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(h.x,h.y-lift); ctx.stroke();
    ctx.strokeStyle='#a8b2be'; ctx.lineWidth=2.2; ctx.setLineDash([3.4,2.2]); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
}
// the held whip: a wooden grip with a gold collar; idle, the chain hangs coiled at his side
function whipDraw2d(p,idle){
  const lash=!idle&&p.swingT>0&&p.swingW==='whip';
  ctx.save(); ctx.translate(lash?13:8,lash?4:12); ctx.rotate(lash?0:0.5);
  ctx.fillStyle='#1c140e'; ctx.fillRect(-6.5,-2.3,12,4.6); ctx.fillStyle='#7a4a22'; ctx.fillRect(-6,-1.6,11,3.2); ctx.fillStyle='#e0b24a'; ctx.fillRect(4,-2.4,2.4,4.8); ctx.beginPath(); ctx.arc(-6.6,0,2.2,0,TAU); ctx.fill();
  if(!lash&&!(p.whip&&p.whip.ph==='twirl')){ ctx.strokeStyle='#1c140e'; ctx.lineWidth=3.6; ctx.beginPath(); ctx.ellipse(9,2,6,4.6,0,0,TAU); ctx.stroke(); ctx.strokeStyle='#a8b2be'; ctx.lineWidth=1.8; ctx.setLineDash([2.6,1.8]); ctx.stroke(); ctx.beginPath(); ctx.ellipse(9.5,2.5,3.6,2.6,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}
function whipPose3d(p,W,bz,sw,pr,sp){
  W.useR=true;
  if(sp){
    const crack=p.swingFin, s=p.swingSide||1, ext=whipExt(pr,crack), ez=smooth(clamp(pr/0.45,0,1));
    const a=crack?lerp(-0.15,0.05,ez):lerp(-s*0.85,s*0.45,ez), up=lerp(0.9,-0.25,ez);
    vSet(W.hR,4.2+ext*5,4.5+Math.sin(a)*5,bz+10+(1-ez)*5); vDir(W.uR,a,up); vPerp(W.vR,a);
    W.twist=a*0.28; W.lean=0.12*ext;
  }else if(p.whip&&p.whip.ph==='twirl'){
    const ang=G.time*(p.whip.ch>=1?20:13); vSet(W.hR,1.6,5.2,bz+17.5); vDir(W.uR,ang,0.95); vPerp(W.vR,ang); W.lean=-0.08;
  }else{ vSet(W.hR,3.4-sw*1.2,7.4,bz+3.2); vDir(W.uR,-0.2,-0.55); vPerp(W.vR,-0.2); }
}
function whipDraw3d(p,W,pal){
  const h=W.hR, u=W.uR, v=W.vR;
  aSeg(h,u,-2.4,3.0,1.05,'#6a3e1c'); aB(h[0]-u[0]*2.9,h[1]-u[1]*2.9,h[2]-u[2]*2.9,1.25,pal.gold); aSeg(h,u,3.0,4.2,1.25,pal.gold);
  const lash=p.swingT>0&&p.swingW==='whip', tw=p.whip&&p.whip.ph==='twirl';
  if(!lash&&!tw){
    // the coil: a ring of chain hanging from the grip
    const cx=h[0]+u[0]*4.6, cy=h[1]+u[1]*4.6, cz=h[2]+u[2]*4.6-3.2;
    for(const [rr,oz] of [[4.4,0],[3.3,-0.8]]){ let px=cx+rr, py=cy, pz=cz+oz; for(let i=1;i<=8;i++){ const b=i/8*TAU, x=cx+Math.cos(b)*rr, y=cy+Math.sin(b)*1.4, z=cz+oz+Math.sin(b)*rr*0.9; aL(px,py,pz,x,y,z,0.8,i%2?'#aeb8c6':'#7e8a98'); px=x; py=y; pz=z; } }
  }else aSeg(h,u,4.2,7.6,0.75,'#9aa6b4');
  aMark('hand',h[0]+u[0]*4,h[1]+u[1]*4,h[2]+u[2]*4);
}
function whipIcon(g){
  // a spiral of chain links around a short grip, ending in a gold weight
  const L=[]; for(let i=0;i<=17;i++){ const t=i/17, a=2.5-t*Math.PI*1.7, r=10.4-5.6*t; L.push([4+Math.cos(a)*r,-3+Math.sin(a)*r,a]); }
  g.save(); g.translate(L[0][0],L[0][1]); g.rotate(Math.PI*0.75); g.beginPath(); g.rect(-0.5,-2.4,11,4.8); iconPath(g,'#8a5226',2.2); g.beginPath(); g.rect(-2.2,-3.1,2.8,6.2); iconPath(g,'#d8a840',1.6); g.beginPath(); g.arc(11.4,0,2.4,0,TAU); iconPath(g,'#d8a840',1.6); g.restore();
  g.strokeStyle=ICON_INK; g.lineWidth=4.6; g.beginPath(); L.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])); g.stroke();
  for(let i=0;i<L.length;i++){ const [x,y,a]=L[i]; g.save(); g.translate(x,y); g.rotate(a+Math.PI/2); g.beginPath(); g.ellipse(0,0,i%2?2.5:2.1,i%2?1.3:1.7,0,0,TAU); g.fillStyle=i%2?'#c8d2de':'#8e9aa8'; g.fill(); g.restore(); }
  const e=L[L.length-1]; g.beginPath(); g.arc(e[0],e[1],3,0,TAU); iconPath(g,'#e0b24a',1.8);
}
defineWeapon('whip',{name:'Chain Whip',short:'Whip',crit:0.07,melee:true,stamina:5,mcol:'220,230,245',order:7,
  desc:S('A long chain lash. Tap for two quick lashes, hold for a big CRACK that stuns. The tip pulls small foes, pots, keys and levers to you.','A long chain. Tap to lash. Hold for a big CRACK. It pulls things to you.'),
  how:S('Tap to lash. Hold, then let go to CRACK and stun. It pulls foes, pots, keys and levers. Lash hook posts to swing.','Tap to lash. Hold, then let go to CRACK. It pulls things to you. Lash a hook to swing.'),
  acts:['whip','boomerang','slash'], reach:WHIP_LEN, aimR:300,
  input:whipInput, swingHits:whipHits, update:whipUpdate, drawFx:whipFx, draw2d:whipDraw2d, pose3d:whipPose3d, draw3d:whipDraw3d, icon:whipIcon,
  chip:p=>({prog:p.whip&&p.whip.ph==='twirl'?p.whip.ch:0}),
  auto:p=>{ if(p.whip||p.swingT>0) return false; const t=nearestEnemy(p.x,p.y,WHIP_LEN+10); return !!t&&(t.aggro||t.boss); },
  unequip:p=>{ p.whip=null; if(p.swingW==='whip'){ p.swingT=0; p.wl=null; } },
  reset:()=>{ if(player){ player.whip=null; player.wl=null; } ARMS.swing=null; },
  moment:()=>{ asnd('crack'); const p=player; emit(p.x,p.y-24,18,{col:'220,230,245',smin:60,smax:200,lmin:.2,lmax:.5,zmin:1,zmax:2.2,drag:4}); }
});

// ================================================================== Blast Bombs
const bombsOwned=()=>!!(G&&G.weapons&&G.weapons.bombs);
function bombsMax(){ return (G&&G.flags&&G.flags.wpn_bombMax)||BOMB_MAX; }
function bombsN(){ if(!G) return 0; G.flags=G.flags||{}; if(G.flags.wpn_bombs==null) G.flags.wpn_bombs=bombsMax(); return G.flags.wpn_bombs; }
function addBombs(n,x,y){
  if(!G) return 0; const had=bombsN(), now=clamp(had+n,0,bombsMax()); G.flags.wpn_bombs=now;
  if(now>had&&x!=null) ftext(x,y-24,`+${now-had}`,'#ffcf8a',13);
  return now-had;
}
// a bigger bag (story rewards): +n capacity, filled
function bombBag(n){ if(!G) return; const m=G.flags.wpn_bombMax=bombsMax()+(n||5); G.flags.wpn_bombs=m; setBanner(S('Bigger bomb bag','Bigger bomb bag'),S(`${m} bombs fit in your bag now.`,`${m} bombs fit now.`),2.4); }
function bombDist(k){ return lerp(BOMB_NEAR,BOMB_FAR,k); }
function bombInput(dt,atk,free,p){
  const b=p.bombAim;
  if(b){
    if(p.dashT>0||p.drinkT>0){ p.bombAim=null; return; }
    b.t+=dt; b.k=Math.min(1,b.t/0.85); p.slowT=Math.max(p.slowT||0,0.05);
    if(p.aim!=null) p.facing=turnTo(p.facing,p.aim,12*dt);
    ARMS.hissT-=dt; if(ARMS.hissT<=0){ ARMS.hissT=0.28; asnd('hiss',0.7); }
    if(b.k>=1&&!b.full){ b.full=true; wsnd('ping',0.5); }
    if(!atk){ p.bombAim=null; throwBomb(p,b.k); }
    return;
  }
  if(atk&&free){
    if(bombsN()<=0){ p.atkCd=0.6; if(!(ARMS.outT>G.time)){ ARMS.outT=G.time+2; ftext(p.x,p.y-30,AT('Out of bombs! Pots and bomb flowers have more.','No bombs! Look in pots and bomb flowers.'),'#ffd0a0',12); SFX.play('block',0.5); } return; }
    if(G.wproj.filter(q=>q.k==='bomb'&&!q.dead).length>=BOMB_LIVE){ p.atkCd=0.3; return; }
    p.bombAim={t:0,k:0,full:false}; wsnd('lift',0.6);
  }
}
function throwBomb(p,k){
  if(bombsN()<=0) return;
  G.flags.wpn_bombs=bombsN()-1;
  // it lands a little short of the mark, then a small bounce and a roll carry it there
  const D=bombDist(k), a=p.facing, x=p.x+Math.cos(a)*14, y=p.y+Math.sin(a)*14, z0=18, Dl=Math.max(20,D*0.82-14), T0=0.3+Dl/700;
  G.wproj.push({k:'bomb',x,y,z:z0+(p.z||0),vx:Math.cos(a)*Dl/T0,vy:Math.sin(a)*Dl/T0,vz:(0.5*BOMB_G*T0*T0-z0)/T0,fuse:BOMB_FUSE,st:'fly',bounce:0,spin:0,t:0,id:Math.random()});
  p.atkCd=0.32/p.stats.atkSpeed; p.throwT=0.18; wsnd('whoosh',0.7);
  if(G.flags.wpn_bombs<=2&&G.flags.wpn_bombs>=0&&!(ARMS.lowT>G.time)){ ARMS.lowT=G.time+20; ftext(p.x,p.y-34,G.flags.wpn_bombs?AT(`${G.flags.wpn_bombs} bombs left`,`${G.flags.wpn_bombs} bombs left`):AT('That was your last bomb!','Last bomb!'),'#ffd0a0',12); }
}
// move a bomb one step: flight with gravity, a bounce, then a slide that slows down; walls bounce it back
function stepBomb(b,dt){
  b.t+=dt; b.fuse-=dt;
  if(!(b.fuse>0)){ b.dead=true; armsBlast(b.x,b.y); return; }
  if(inBreath(b.x,b.y,6)) b.fuse=Math.min(b.fuse,0.14);
  const n=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/8)), sx=b.vx*dt/n, sy=b.vy*dt/n;
  for(let i=0;i<n;i++){
    const nx=b.x+sx, ny=b.y+sy;
    if(armsWall(nx,ny)){ const wx=armsWall(nx,b.y), wy=armsWall(b.x,ny); if(wx||!wy) b.vx*=-0.45; if(wy||!wx) b.vy*=-0.45; wsnd('thunk',0.4); break; }
    b.x=nx; b.y=ny;
  }
  if(b.st==='fly'){
    b.z+=b.vz*dt; b.vz-=BOMB_G*dt; b.spin+=dt*9;
    if(b.z<=0){
      b.z=0; const hz=armsHazard(b.x,b.y);
      if(hz){ b.dead=true; armsFizzle(b,hz); return; }
      if(b.vz<-150&&b.bounce<1){ b.vz=-b.vz*0.3; b.vx*=0.35; b.vy*=0.35; b.bounce++; wsnd('thunk',0.6); emit(b.x,b.y,4,{col:'150,130,110',glow:false,smin:20,smax:60,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); }
      else{ b.st='slide'; b.vz=0; b.vx*=0.3; b.vy*=0.3; }
    }
  }else{
    const f=Math.exp(-dt*2.4); b.vx*=f; b.vy*=f; if(b.vx*b.vx+b.vy*b.vy<200){ b.vx=b.vy=0; b.st='rest'; } else b.spin+=Math.hypot(b.vx,b.vy)*dt*0.08;
    if(b.st==='slide'){ const hz=armsHazard(b.x,b.y); if(hz){ b.dead=true; armsFizzle(b,hz); return; } }
    // a kick: walk into it
    const p=player;
    if(!airborne()&&p.moving&&!(b.kickT>G.time)&&dist2(p.x,p.y,b.x,b.y)<(p.r+9)**2){
      const ma=Math.atan2(p.inMy||0,p.inMx||0), ta=angTo(p.x,p.y,b.x,b.y);
      if(Math.abs(angDiff(ma,ta))<1.1){ b.vx=Math.cos(ma)*380; b.vy=Math.sin(ma)*380; b.st='slide'; b.kickT=G.time+0.25; asnd('kick'); emit(b.x,b.y,4,{col:'150,130,110',glow:false,smin:20,smax:70,lmin:.2,lmax:.4,zmin:1.5,zmax:3});
        if(!G.flags.wpn_kick){ G.flags.wpn_kick=true; ftext(b.x,b.y-24,AT('Kick!','Kick!'),'#ffe0b0',12); } }
    }
  }
  if(Math.random()<0.5) emit(b.x+3,b.y-(b.z||0)-9*(T3.on?1:0.6),1,{col:'255,200,110',ang:-Math.PI/2,spread:1.2,smin:10,smax:40,lmin:.12,lmax:.3,zmin:1,zmax:1.8,drag:3});
}
function armsFizzle(b,hz){
  if(hz==='water'){ if(G.ripples) G.ripples.push({x:b.x,y:b.y,t:0,max:0.7,r:16,splash:true}); emit(b.x,b.y,10,{col:'220,235,255',glow:false,ang:-Math.PI/2,spread:1,smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); SFX.play('pop'); ftext(b.x,b.y-20,AT('Fizzle...','Fizzle...'),'#cfe6ff',11); }
  else if(hz==='lava') armsBlast(b.x,b.y,{R:70});
  else{ emit(b.x,b.y,6,{col:'60,50,50',glow:false,smin:10,smax:40,lmin:.3,lmax:.6,zmin:2,zmax:4}); SFX.play('pop',0.5); }
}
// the boom: foes, Ash, enemy shots, the world (cracked walls, boulders, pots, crystals, switches, braziers, fuses, other bombs)
function armsBlast(x,y,o){
  o=o||{}; const R=o.R||BOMB_R, p=player;
  for(const e of G.enemies){
    if(!wFoeOk(e)) continue;
    let best=null,bd=1e9; for(const c of hitCircles(e)){ const d=dist(x,y,c.x,c.y)-c.r; if(d<bd){ bd=d; best=c; } }
    if(!best||bd>R) continue;
    e.blocking=false;
    const k=bd<36?3.0:2.3*(1-0.4*bd/R);
    wStrike(e,best,k*(o.dmgK||1),'bombs',{src:'bomb',kb:460*(1-0.5*bd/R),ka:angTo(x,y,e.x,e.y),fx:x,fy:y});
    if(!e.dead) stunEnemy(e,1.2);
  }
  if(p&&!p.dead&&!o.noAsh){ const d=dist(x,y,p.x,p.y); if(d<R*0.72){ const a=angTo(x,y,p.x,p.y), k=1-d/(R*0.72); p.kvx+=Math.cos(a)*420*k; p.kvy+=Math.sin(a)*420*k; if(G.mode==='story'&&G.diff&&G.diff.dmg>=0.75&&!(p.z>3)) hurtPlayer(Math.round(4+6*k),x,y,0); } }
  for(const q of G.projectiles) if(q.owner==='enemy'&&!q.dead&&dist2(q.x,q.y,x,y)<(R+10)**2){ q.dead=true; smallBoom(q.x,q.y); }
  for(const b of G.wproj) if(b.k==='bomb'&&!b.dead&&dist2(b.x,b.y,x,y)<(R*0.85)**2) b.fuse=Math.min(b.fuse,0.14+Math.random()*0.08);
  if(AREA){ areaObjHit(x,y,R*0.8,'bomb'); if(AREA.rooms) caveRoar(x,y,R*0.6); wIgnite(x,y,R*0.55,2.2); }
  else{ armsWorldHit(x,y,R*0.85,'bomb'); armsWorldHit(x,y,R*0.55,'fire'); armsLmPots(x,y,R*0.8,null); scorch(x,y,R*0.32); }
  G.wfx.push({k:'blast',x,y,t:0,dur:0.6,r:R});
  emit(x,y,26,{kind:'fire',smin:60,smax:300,lmin:.25,lmax:.6,zmin:3,zmax:7,grow:10,drag:3});
  emit(x,y,16,{col:'80,70,70',glow:false,smin:30,smax:150,lmin:.6,lmax:1.2,zmin:5,zmax:9,grow:12,drag:2,rise:20});
  emit(x,y,10,{col:'120,100,80',glow:false,smin:120,smax:340,lmin:.3,lmax:.6,zmin:1.5,zmax:3,drag:3});
  flashA=Math.max(flashA,0.16); flashCol='255,210,140'; shake(10); hitstop=Math.max(hitstop,0.045); SFX.play('boom',1);
}
// the bomb in flight or on the ground, its shadow, its fuse spark; the aim arc while aiming; bomb pickups; blasts
function bombSprite(){ return aSpr('bomb',36,36,(g)=>{
  g.translate(18,20);
  g.fillStyle='#120e14'; g.beginPath(); g.arc(0,0,11.2,0,TAU); g.fill();
  const gr=g.createRadialGradient(-3.4,-3.6,1,0,0,10.4); gr.addColorStop(0,'#6a78a0'); gr.addColorStop(0.45,'#2e3656'); gr.addColorStop(1,'#141826'); g.fillStyle=gr; g.beginPath(); g.arc(0,0,9.6,0,TAU); g.fill();
  g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-3.6,-4,2.6,1.6,-0.6,0,TAU); g.fill();
  g.fillStyle='#120e14'; g.fillRect(-4.2,-12.6,8.4,4.6); g.fillStyle='#8a929c'; g.fillRect(-3.4,-12,6.8,3.4);
  g.strokeStyle='#120e14'; g.lineWidth=3.2; g.beginPath(); g.moveTo(0,-12); g.quadraticCurveTo(3,-16,6,-15.4); g.stroke(); g.strokeStyle='#d8b078'; g.lineWidth=1.6; g.stroke();
}); }
function drawBombAt(x,y,z,fuse,spin,s){
  s=s||1; const lift=z*(T3.on?1:0.9);
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+3,10*s*(1-Math.min(0.5,z/120)),4.4*s*(1-Math.min(0.5,z/120)),0,0,TAU); ctx.fill();
  const bl=fuse!=null&&fuse<0.7&&Math.floor(fuse*16)%2===0, sp=bombSprite();
  ctx.save(); ctx.translate(x,y-lift-(T3.on?8:6)*s); ctx.rotate(Math.sin(spin||0)*0.25); ctx.drawImage(sp,-18*s,-20*s,36*s,36*s);
  if(bl){ ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,90,60,.55)'; ctx.beginPath(); ctx.arc(0,0,10*s,0,TAU); ctx.fill(); }
  ctx.restore();
  if(fuse!=null){ const fx=x+6*s, fy=y-lift-(T3.on?8:6)*s-15.4*s, fl=0.7+0.3*Math.sin(G.time*40); glowAt(fx,fy,7*fl,'255,200,110',0.9); ctx.fillStyle='#fff6d0'; ctx.beginPath(); ctx.arc(fx,fy,1.6,0,TAU); ctx.fill(); }
}
function bombDrawProj(b){ drawBombAt(b.x,b.y,b.z||0,b.fuse,b.spin); }
function bombFx(t3){
  const p=player; if(!p||!G.wfx) return;
  for(const f of G.wfx){ if(f.k!=='blast') continue; const k=f.t/f.dur, a=1-k, r=f.r*(0.3+0.7*(1-Math.pow(1-k,3)));
    if(k<0.25){ glowAt(f.x,f.y,f.r*1.1,'255,220,150',0.9*(1-k/0.25)); }
    ctx.fillStyle=`rgba(255,170,80,${0.22*a})`; ctx.beginPath(); ctx.arc(f.x,f.y,r,0,TAU); ctx.fill();
    ctx.strokeStyle=`rgba(255,240,200,${0.8*a})`; ctx.lineWidth=2+6*a; ctx.stroke(); }
  for(const d of ARMS.drops){ const bob=Math.sin(G.time*5+d.x)*2, al=clamp(d.life/1.5,0,1); ctx.globalAlpha=al; drawBombAt(d.x,d.y,4+bob,null,0,0.7); glowAt(d.x,d.y-12,12,'255,210,140',0.25); ctx.globalAlpha=1; }
  const b=p.bombAim; if(!b||p.dead) return;
  const D=bombDist(b.k), a=p.facing, tx=p.x+Math.cos(a)*D, ty=p.y+Math.sin(a)*D, [hx,hy]=armsHand(p), pul=0.5+0.5*Math.sin(G.time*10);
  ctx.save(); ctx.setLineDash([4,7]); ctx.lineDashOffset=-G.time*30; ctx.lineWidth=1.8; ctx.strokeStyle=`rgba(255,200,130,${0.5+0.3*b.k})`;
  ctx.beginPath(); for(let i=0;i<=14;i++){ const t=i/14, x=lerp(hx,tx,t), y=lerp(hy,ty,t)-Math.sin(Math.PI*t)*(26+D*0.18)*(T3.on?1:0.6); if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); } ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle=`rgba(255,120,80,${0.25+0.15*pul})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(tx,ty,BOMB_R,BOMB_R*0.8,0,0,TAU); ctx.stroke();
  ctx.strokeStyle='rgba(255,230,180,.85)'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.ellipse(tx,ty,13+3*pul,9+2*pul,0,0,TAU); ctx.stroke();
  ctx.restore();
}
function bombUpdate(dt,eq){
  const p=player;
  if(!eq&&p.bombAim) p.bombAim=null;
  if(G.mode==='normal'){ ARMS.regen+=dt; if(ARMS.regen>=2.5){ ARMS.regen=0; if(bombsN()<bombsMax()) G.flags.wpn_bombs++; } }
  // bomb pickups (from pots): a magnet like coins
  for(const d of ARMS.drops){
    d.life-=dt; const dd=dist(d.x,d.y,p.x,p.y);
    if(dd<110&&!p.dead){ const a=angTo(d.x,d.y,p.x,p.y), s=(1-dd/110)*900*dt; d.vx+=Math.cos(a)*s; d.vy+=Math.sin(a)*s; }
    const f=Math.exp(-dt*3); d.vx*=f; d.vy*=f; d.x+=d.vx*dt; d.y+=d.vy*dt;
    if(dd<p.r+12&&!p.dead){ d.life=0; if(addBombs(1,p.x,p.y)) SFX.play('pickup'); }
  }
  if(ARMS.drops.length) ARMS.drops=ARMS.drops.filter(d=>d.life>0);
}
function bombPose3d(p,W,bz,sw){
  const b=p.bombAim, th=p.throwT>0?clamp(p.throwT/0.18,0,1):0;
  if(b){ const k=b.k||0; W.useR=true; vSet(W.hR,-1.4-k*2,7.4,bz+15.5+k*1.5); vSet(W.uR,0,0,1); vSet(W.vR,1,0,0); W.lean=-0.1*k; W.useL=true; vSet(W.hL,7.5,-4.2,bz+9.5); W.twist=-0.2*k; }
  else if(th>0){ W.useR=true; vSet(W.hR,lerp(9.5,1,th),6.2,bz+lerp(8,15,th)); vSet(W.uR,0,0,1); vSet(W.vR,1,0,0); W.lean=0.14*(1-th); }
  else{ vSet(W.hR,1.2,7.2,bz+2.4); vSet(W.uR,0,0,1); vSet(W.vR,1,0,0); }
}
function bombDraw3d(p,W,pal){
  const aim=!!p.bombAim, h=W.hR;
  if(aim){ const cx=h[0], cy=h[1], cz=h[2]+4; aB(cx,cy,cz,4.3,'#2e3656'); aD(cx+1.6,cy-1.4,cz+2,1.1,'#c8d2ea',0.05); aCyl(cx,cy,cz+3.6,1.4,1.4,1.2,'#8a929c'); aL(cx,cy,cz+4.6,cx-1,cy,cz+7,0.6,'#d8b078'); aMark('tip',cx-1,cy,cz+7.2);
    AINFO.wg={col:'255,190,90',r:6+1.5*Math.sin(G.time*40),a:0.9}; aMark('hand',h[0],h[1],h[2]); return; }
  // idle: a bomb clipped to his belt
  if(!(p.throwT>0)){ const bz=h[2]-2.4+0.6; aB(0.6,6.9,bz+1.4,2.5,'#2e3656'); aD(1.8,6.2,bz+2.6,0.7,'#c8d2ea',0.05); aL(0.6,6.9,bz+3.6,0.2,6.9,bz+5.2,0.45,'#d8b078'); }
  aMark('hand',h[0],h[1],h[2]);
}
function bombDraw2d(p,idle){
  const s=p.bombAim?1.15:0.75; ctx.save(); ctx.translate(p.bombAim?-2:2,p.bombAim?13:12); ctx.drawImage(bombSprite(),-18*s*0.6,-20*s*0.6,36*s*0.6,36*s*0.6); ctx.restore();
  if(p.bombAim) glowAt(4,4,6,'255,200,110',0.8);
}
function bombIcon(g){
  g.translate(-1,2.5);
  g.beginPath(); g.arc(0,0,10,0,TAU); const gr=g.createRadialGradient(-3.4,-3.6,1,0,0,10); gr.addColorStop(0,'#7a88b0'); gr.addColorStop(0.5,'#323a5c'); gr.addColorStop(1,'#161a2a'); iconPath(g,gr,2.6);
  g.fillStyle='rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-3.8,-4.2,2.8,1.6,-0.6,0,TAU); g.fill();
  g.beginPath(); g.rect(-4,-13,8,4.4); iconPath(g,'#9aa2ac',1.8);
  g.strokeStyle=ICON_INK; g.lineWidth=3.4; g.beginPath(); g.moveTo(0,-12.8); g.quadraticCurveTo(3.4,-17,7.4,-15.8); g.stroke(); g.strokeStyle='#d8b078'; g.lineWidth=1.6; g.stroke();
  g.fillStyle='#ffd27a'; g.beginPath(); for(let i=0;i<8;i++){ const r=i%2?1.6:4.4, a=i/8*TAU; g.lineTo(8.6+Math.cos(a)*r,-16.4+Math.sin(a)*r); } g.closePath(); g.fill(); g.fillStyle='#fff6d0'; g.beginPath(); g.arc(8.6,-16.4,1.3,0,TAU); g.fill();
}
defineWeapon('bombs',{name:'Blast Bombs',short:'Bombs',crit:0.05,melee:false,flyOK:true,stamina:0,mcol:'255,190,110',order:8,
  desc:S('Hold attack to aim, let go to throw. BOOM in 1.6 seconds! The blast opens cracked walls and boulders, and lights fuses. Walk into a bomb to kick it.','Hold to aim. Let go to throw. BOOM! It breaks walls and big rocks.'),
  how:S('Hold to aim, let go to throw. Walk into a bomb to kick it. Bombs break cracked walls and boulders and light fuses.','Hold to aim. Let go to throw. Kick bombs. They break walls and big rocks.'),
  acts:['bomb','hammer'], reach:BOMB_FAR, aimR:340,
  proj:{bomb:{step:stepBomb,draw:bombDrawProj}},
  input:bombInput, update:bombUpdate, drawFx:bombFx, draw2d:bombDraw2d, pose3d:bombPose3d, draw3d:bombDraw3d, icon:bombIcon,
  chip:p=>{ const n=bombsN(); return {prog:p.bombAim?p.bombAim.k:0,count:n,low:n<=2}; },
  auto:()=>false,
  unequip:p=>{ p.bombAim=null; },
  moment:()=>{ if(G){ G.flags.wpn_bombs=bombsMax(); } const p=player; emit(p.x,p.y-24,20,{kind:'fire',ang:-Math.PI/2,spread:1.4,smin:40,smax:160,lmin:.3,lmax:.7,zmin:2,zmax:4,grow:4}); SFX.play('boom',0.4); }
});

// ================================================================== Moon Glaive
// how much moonlight there is: 0 by day, 1 at night (or always, in an area marked moonlit)
function glvNight(){ if(AREA&&AREA.def&&AREA.def.moonlit) return 1; return clamp((0.4-daylight())/0.3,0,1); }
const glvOut=()=>{ if(!G||!G.wproj) return null; for(const a of G.wproj) if(a.k==='glaive'&&!a.dead) return a; return null; };
function glvInput(dt,atk,free,p){
  const out=glvOut();
  if(p.glv){
    p.glv.t+=dt;
    if(p.dashT>0||p.drinkT>0){ p.glv=null; return; }
    if(!atk){ if(!out&&p.glv.t<GLV_HOLD) glvThrow(p); p.glv=null; return; }
    if(p.glv.t>=GLV_HOLD&&!out&&!p.glv.orbited){ p.glv.orbited=true; glvOrbit(p); }
    return;
  }
  if(atk&&free){
    if(out){ if(out.ph==='out'){ out.ph='back'; out.hit.clear(); wsnd('catch',0.5); } p.atkCd=0.15; return; }
    p.glv={t:0};
  }
}
function glvThrow(p){
  if(!useStamina(7)){ p.atkCd=0.2; return; }
  const a=p.facing, nk=glvNight();
  G.wproj.push({k:'glaive',x:p.x+Math.cos(a)*16,y:p.y+Math.sin(a)*16,vx:Math.cos(a)*GLV_SPD,vy:Math.sin(a)*GLV_SPD,ph:'out',d:0,max:GLV_RANGE,bounced:false,hit:new Set(),objs:new Set(),cd:new Map(),spin:0,trail:[],nk,t:0,th:a,R:GLV_ORB});
  p.atkCd=0.18; p.throwT=0.16; wsnd('whoosh'); asnd('hum',0.8);
}
function glvOrbit(p){
  if(!useStamina(8)){ p.atkCd=0.2; return; }
  const a=p.facing, nk=glvNight();
  G.wproj.push({k:'glaive',x:p.x+Math.cos(a)*GLV_ORB,y:p.y+Math.sin(a)*GLV_ORB,vx:0,vy:0,ph:'orbit',d:0,max:0,bounced:false,hit:new Set(),objs:new Set(),cd:new Map(),spin:0,trail:[],nk,t:0,th:a,R:GLV_ORB+8*nk,sT:0});
  wsnd('whoosh',0.8);
  if(!G.flags.wpn_orbit){ G.flags.wpn_orbit=true; mvTip(S('Glaive spin','Glaive spin'),S('Keep holding attack to keep it spinning. It uses stamina.','Keep holding. It uses stamina.'),5,'wpn_orbit'); }
}
function glvHitFoe(a,e,c,k,kb,ka){
  wStrike(e,c,k*(1+0.35*a.nk),'glaive',{src:'glaive',kb,ka,fx:a.x,fy:a.y});
  emit(c.x,c.y,6,{col:a.nk>0.3?'190,215,255':'235,240,250',smin:70,smax:220,lmin:.1,lmax:.25,zmin:1,zmax:2.2,drag:6}); SFX.play('hit',0.55);
}
// what the blade touches between (ox,oy) and (x,y): enemy shots bounce back, bombs go off, objects react
function glvTouch(a,x,y,ox,oy){
  if(ox==null){ ox=x; oy=y; }
  for(const q of G.projectiles) if(q.owner==='enemy'&&!q.dead&&segD(q.x,q.y,ox,oy,x,y)<q.r+14) reflectProj(q);
  for(const b of G.wproj) if(b.k==='bomb'&&!b.dead&&segD(b.x,b.y,ox,oy,x,y)<18) b.fuse=Math.min(b.fuse,0.02);
  ARMS.once=a.objs;
  const n=dist(ox,oy,x,y)>14?2:1;
  for(let i=n===2?0:1;i<=1;i++){ const px=lerp(ox,x,i===0?0.5:1), py=lerp(oy,y,i===0?0.5:1);
    if(AREA) areaObjHit(px,py,12,'glaive'); else{ armsWorldHit(px,py,12,'glaive'); armsLmPots(px,py,12,a.objs); } }
  ARMS.once=null;
}
function stepGlaive(a,dt){
  const p=player; a.t+=dt; a.spin+=dt*(a.ph==='orbit'?26:22);
  a.nk=lerp(a.nk,glvNight(),Math.min(1,dt*2));
  a.trail.push(a.x,a.y); if(a.trail.length>(a.ph==='orbit'?16:10)) a.trail.splice(0,2);
  if(a.ph==='orbit'){
    const held=!!p.glv&&curWeapon()==='glaive'&&!p.dead;
    p.stamina=Math.max(0,p.stamina-11*dt); p.stamDelay=Math.max(p.stamDelay||0,0.5); p.slowT=Math.max(p.slowT||0,0.05);
    if(!held||p.stamina<=0){ a.ph='back'; a.hit.clear(); return; }
    const ox=a.x, oy=a.y;
    a.th+=dt*13; a.R=lerp(a.R,GLV_ORB+8*a.nk,Math.min(1,dt*4));
    a.x=p.x+Math.cos(a.th)*a.R; a.y=p.y+Math.sin(a.th)*a.R*0.9;
    a.sT-=dt; if(a.sT<=0){ a.sT=0.13; wsnd('whirr',0.8); }
    for(const e of G.enemies){
      if(!wFoeOk(e)||(a.cd.get(e.id)||0)>G.time) continue;
      let hc=null; for(const c of hitCircles(e)) if(segD(c.x,c.y,ox,oy,a.x,a.y)<c.r+12){ hc=c; break; }
      if(!hc) continue; a.cd.set(e.id,G.time+0.2);
      glvHitFoe(a,e,hc,0.42,160,angTo(p.x,p.y,e.x,e.y));
    }
    glvTouch(a,a.x,a.y,ox,oy);
    return;
  }
  if(a.ph==='back'){
    const h=angTo(a.x,a.y,p.x,p.y), sp=Math.min(940,Math.hypot(a.vx,a.vy)+1100*dt), cur=Math.atan2(a.vy,a.vx), na=turnTo(cur,h,12*dt);
    a.vx=Math.cos(na)*Math.max(380,sp); a.vy=Math.sin(na)*Math.max(380,sp);
    if(dist(a.x,a.y,p.x,p.y)<(p.r||12)+16||a.t>7){ a.dead=true; wsnd('catch'); p.atkCd=Math.min(p.atkCd,0.08); p.throwT=0.1; return; }
  }
  const sp=Math.hypot(a.vx,a.vy), n=Math.max(1,Math.ceil(sp*dt/10)), sx=a.vx*dt/n, sy=a.vy*dt/n;
  for(let i=0;i<n&&!a.dead;i++){
    const nx=a.x+sx, ny=a.y+sy;
    if(a.ph==='out'){
      if(armsWall(nx,ny)){
        glvTouch(a,nx,ny); if(!armsWall(nx,ny)){ a.x=nx; a.y=ny; continue; }   // it cut through (moon silk)
        if(!a.bounced){ const wx=armsWall(nx,a.y), wy=armsWall(a.x,ny); if(wx||!wy) a.vx=-a.vx; if(wy||!wx) a.vy=-a.vy; a.bounced=true; a.hit.clear(); a.max=Math.max(a.max,a.d+190);
          wsnd('clink'); asnd('hum'); shake(1.5); emit(a.x,a.y,10,{col:'200,220,255',smin:60,smax:200,lmin:.1,lmax:.28,zmin:1,zmax:2.2,drag:5}); return; }
        a.ph='back'; a.hit.clear(); wsnd('clink'); return;
      }
      a.d+=Math.hypot(sx,sy); if(a.d>=a.max){ a.ph='back'; a.hit.clear(); }
    }
    a.x=nx; a.y=ny;
    for(const e of G.enemies){
      if(!wFoeOk(e)||a.hit.has(e.id)) continue;
      let hc=null; for(const c of hitCircles(e)) if(dist2(a.x,a.y,c.x,c.y)<(c.r+11)**2){ hc=c; break; }
      if(!hc) continue; a.hit.add(e.id);
      glvHitFoe(a,e,hc,0.95,140,Math.atan2(a.vy,a.vx));
    }
    if(i%2===0||i===n-1){ glvTouch(a,a.x,a.y,a.lx,a.ly); a.lx=a.x; a.ly=a.y; }
  }
}
// the blade: a silver crescent around a dark grip, with a moonstone
function glvPath(g,R){ g.beginPath(); for(let i=0;i<=12;i++){ const b=-2.45+4.9*i/12; g.lineTo(Math.cos(b)*R,Math.sin(b)*R); } for(let i=0;i<=12;i++){ const b=2.2-4.4*i/12; g.lineTo(-R*0.3+Math.cos(b)*R*0.78,Math.sin(b)*R*0.78); } g.closePath(); }
function glvShape(g,R,nk,lite){
  glvPath(g,R); g.strokeStyle='#1a1e34'; g.lineWidth=2.4; g.stroke();
  const gr=g.createLinearGradient(-R,-R,R,R); gr.addColorStop(0,nk>0.3?'#ffffff':'#f2f6ff'); gr.addColorStop(0.5,nk>0.3?'#b8d4ff':'#b4c2dc'); gr.addColorStop(1,'#56688e'); g.fillStyle=gr; g.fill();
  if(lite) return;
  g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=0.9; g.beginPath(); g.arc(0,0,R*0.88,-2.2,-0.6); g.stroke();
  g.fillStyle=nk>0.3?'#cfe8ff':'#8ec4ff'; g.strokeStyle='#1a1e34'; g.lineWidth=1; g.beginPath(); g.arc(R*0.74,0,R*0.17,0,TAU); g.fill(); g.stroke();
}
// the blade, cached (a day look and a moonlit look)
function glvSprite(nk){ const n=nk>0.3; return aSpr(n?'glvn':'glvd',32,32,(g)=>{ g.translate(16,16); glvShape(g,11,n?1:0,false); }); }
function glvDrawProj(a,t3){
  const lift=12*armsLift(), nk=a.nk;
  ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(a.x+2,a.y+4,10,5,0,0,TAU); ctx.fill();
  if(a.ph==='orbit'){ const p=player; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
    ctx.strokeStyle=nk>0.3?`rgba(170,205,255,${0.2+0.3*nk})`:'rgba(235,240,252,.22)'; ctx.lineWidth=7; ctx.beginPath(); ctx.ellipse(p.x,p.y-lift,a.R,a.R*0.9,0,a.th-1.5,a.th); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(p.x,p.y-lift,a.R,a.R*0.9,0,a.th-0.9,a.th); ctx.stroke(); ctx.restore(); }
  const sp=glvSprite(nk), sq=T3.on?0.55:1;
  for(let i=0;i<a.trail.length-2;i+=2){ const k=i/a.trail.length; ctx.save(); ctx.globalAlpha=0.08+0.22*k; ctx.translate(a.trail[i],a.trail[i+1]-lift); ctx.scale(1,sq); ctx.rotate(a.spin-0.4*(a.trail.length-i)); ctx.drawImage(sp,-14,-14,28,28); ctx.restore(); }
  if(nk>0.05) glowAt(a.x,a.y-lift,26,'170,205,255',0.55*nk);
  ctx.save(); ctx.translate(a.x,a.y-lift); ctx.scale(1,sq); ctx.rotate(a.spin); ctx.drawImage(sp,-16,-16,32,32); ctx.restore();
  if(nk>0.4&&Math.random()<0.5) emit(a.x,a.y-lift,1,{col:'200,225,255',smin:5,smax:30,lmin:.2,lmax:.45,zmin:1,zmax:2,drag:2});
}
function glvPose3d(p,W,bz,sw){
  const out=glvOut(); W.useR=true; vSet(W.uR,1,0,0); vSet(W.vR,0,0.45,0.89);
  if(out){ W.hideR=true; if(out.ph==='orbit'){ vSet(W.hR,2.6,7.4,bz+13.5); W.lean=-0.06; } else if(p.throwT>0){ const k=clamp(p.throwT/0.16,0,1); vSet(W.hR,lerp(4,10.5,k),6.4,bz+lerp(5,9,k)); W.lean=0.1*k; } else vSet(W.hR,4.8,7.4,bz+5.4); }
  else if(p.glv){ const k=clamp(p.glv.t/GLV_HOLD,0,1); vSet(W.hR,lerp(2,-3.4,k),8.6,bz+8+3*k); W.twist=-0.35*k; }
  else vSet(W.hR,3.6-sw*1.1,7.8,bz+3.8);
}
function glvDraw3d(p,W,pal){
  const h=W.hR; aMark('hand',h[0],h[1],h[2]);
  if(W.hideR) return;
  const u=W.uR, v=W.vR, R=8.2, nk=glvNight();
  let n=0; for(let i=0;i<=7;i++){ const b=-2.45+4.9*i/7; aPtUV(n++,h,u,Math.cos(b)*R+1.6,v,Math.sin(b)*R); } for(let i=0;i<=7;i++){ const b=2.2-4.4*i/7; aPtUV(n++,h,u,1.6-R*0.3+Math.cos(b)*R*0.78,v,Math.sin(b)*R*0.78); }
  aPoly(n,nk>0.3?'#cfdcf4':'#b8c4da',{edge:'#2a3456'});
  aL(h[0]-v[0]*3.2,h[1]-v[1]*3.2,h[2]-v[2]*3.2,h[0]+v[0]*3.2,h[1]+v[1]*3.2,h[2]+v[2]*3.2,1.0,'#4a3460');
  const mx=h[0]+u[0]*(1.6+R*0.74), my=h[1]+u[1]*(1.6+R*0.74), mz=h[2]+u[2]*(1.6+R*0.74);
  aD(mx,my,mz,1.5,nk>0.3?'#e2f2ff':'#8ec4ff',0.08);
  aMark('tip',mx,my,mz);
  if(nk>0.05) AINFO.wg={col:'170,205,255',r:14,a:0.6*nk};
}
function glvDraw2d(p,idle){
  if(glvOut()&&!idle) return;
  ctx.save(); ctx.translate(p.glv?-3:8,13); ctx.rotate(p.glv?-0.6:0.4); ctx.drawImage(glvSprite(glvNight()),-11.6,-11.6,23.2,23.2); ctx.restore();
}
function glvIcon(g){ g.rotate(-0.5); glvPath(g,12.5); g.strokeStyle=ICON_INK; g.lineWidth=2.6; g.stroke(); const gr=g.createLinearGradient(-12,-12,12,12); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.5,'#b8ccee'); gr.addColorStop(1,'#4a5c86'); g.fillStyle=gr; g.fill();
  g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=1; g.beginPath(); g.arc(0,0,11,-2.2,-0.7); g.stroke(); g.beginPath(); g.moveTo(-3.6,-6.6); g.lineTo(-6.4,6.6); g.strokeStyle=ICON_INK; g.lineWidth=4; g.stroke(); g.strokeStyle='#6a4a8a'; g.lineWidth=2; g.stroke(); g.beginPath(); g.arc(9,0,2.6,0,TAU); iconPath(g,'#9fd4ff',1.4); }
defineWeapon('glaive',{name:'Moon Glaive',short:'Glaive',crit:0.1,melee:false,flyOK:true,stamina:7,mcol:'190,215,255',order:9,
  desc:S('Tap to throw it: it bounces off one wall and flies back. Hold to spin it around you. It cuts moon silk, bats shots back, and glows stronger at night.','Tap to throw. It bounces back. Hold to spin it. Strong at night.'),
  how:S('Tap to throw: it bounces off a wall and comes back. Hold to spin it. It cuts moon silk and is stronger at night.','Tap to throw. It comes back. Hold to spin it. It cuts moon silk. Strong at night.'),
  acts:['glaive','boomerang','slash'], reach:GLV_RANGE, aimR:420,
  proj:{glaive:{step:stepGlaive,draw:glvDrawProj}},
  input:glvInput, pose3d:glvPose3d, draw3d:glvDraw3d, draw2d:glvDraw2d, icon:glvIcon,
  chip:p=>{ const o=glvOut(); return {away:!!o&&o.ph!=='orbit',prog:o&&o.ph==='orbit'?p.stamina/p.maxStamina:p.glv?clamp(p.glv.t/GLV_HOLD,0,1):0}; },
  auto:p=>{ if(glvOut()||p.glv) return false; const t=nearestEnemy(p.x,p.y,GLV_RANGE-20); return !!t&&(t.aggro||t.boss); },
  unequip:p=>{ p.glv=null; const o=glvOut(); if(o&&o.ph==='orbit'){ o.ph='back'; o.hit.clear(); } },
  update:(dt,eq)=>{ if(!eq&&player.glv) player.glv=null; },
  moment:()=>{ const p=player; for(let i=0;i<24;i++){ const a=i/24*TAU; emit(p.x+Math.cos(a)*30,p.y+Math.sin(a)*24-18,1,{col:'190,215,255',ang:a,spread:0.1,smin:40,smax:90,lmin:.5,lmax:.9,zmin:1.5,zmax:2.5,drag:2}); } wsnd('ping'); }
});
// text shown on the Hero page before you own them (the Hero page reads W.hint each time it opens)
for(const [id,full,simple] of [['whip','Somewhere on the Clockwork Coast','On the Clockwork Coast'],['bombs','Somewhere in Frostreach','In Frostreach'],['glaive','Somewhere in Moonfall','In Moonfall']]){
  S(full,simple); Object.defineProperty(WEAPONS[id],'hint',{get:()=>simplify(full),configurable:true});
}

// ================================================================== world pieces: boulders, bomb flowers, whip hooks, moon silk, fuses
// AK[kind]: hit(o,src,x,y,r) -> true when it reacted; draw(o,t). Outdoors they are LANDMARKS (ARMS.lm), inside areas AREA.objs.
const flowerRipe=o=>!(G.found['bf_'+o.id]!=null&&G.worldTime-G.found['bf_'+o.id]<90);
const armsGone=o=>!!(G&&G.found[o.id]);
function armsSync(o){ if(o.col) o.col.off=armsGone(o)&&(o.k==='boulder'||o.k==='web'); }
function breakBoulder(o){
  G.found[o.id]=true; armsSync(o); if(o.col&&AREA&&o.inArea){ removeCol(o.col); o.col=null; }
  SFX.play('boom',0.8); shake(8); hitstop=Math.max(hitstop,0.05);
  emit(o.x,o.y,34,{col:'140,124,108',glow:false,smin:60,smax:280,lmin:.4,lmax:1,zmin:3,zmax:7,grow:3,drag:3});
  emit(o.x,o.y,14,{col:'90,80,70',glow:false,ang:-Math.PI/2,spread:1.2,smin:20,smax:80,lmin:.8,lmax:1.5,zmin:6,zmax:10,grow:10,drag:1,rise:15});
  if(!G.flags.wpn_boulder){ G.flags.wpn_boulder=true; setBanner(S('The boulder bursts!','The big rock breaks!'),'',1.8); }
  if(o.then) o.then(o); saveGame();
}
function popFlower(o){
  G.found['bf_'+o.id]=G.worldTime; SFX.play('pop'); emit(o.x,o.y-8,10,{col:'255,150,80',smin:30,smax:110,lmin:.2,lmax:.5,zmin:1.5,zmax:3});
  G.wproj.push({k:'bomb',x:o.x,y:o.y+4,z:6,vx:0,vy:0,vz:120,fuse:1.3,st:'fly',bounce:1,spin:0,t:0,id:Math.random()});
}
function pickFlower(o){
  if(!bombsOwned()||bombsN()>=bombsMax()) return false;
  G.found['bf_'+o.id]=G.worldTime; addBombs(3,o.x,o.y); SFX.play('pickup'); emit(o.x,o.y-8,8,{col:'255,190,110',ang:-Math.PI/2,spread:0.8,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.5,zmax:2.5});
  if(!G.flags.wpn_flower){ G.flags.wpn_flower=true; setBanner(S('Bomb flower!','Bomb flower!'),S('It grows a fresh bomb every minute and a half.','It grows new bombs.'),2.4); }
  return true;
}
function cutWeb(o){
  G.found[o.id]=true; armsSync(o); if(o.col&&o.inArea){ removeCol(o.col); o.col=null; }
  SFX.play('slash3',0.7); wsnd('ping',0.6);
  for(let i=0;i<22;i++) emit(o.x+rand(-(o.w||40)/2,(o.w||40)/2),o.y+rand(-(o.h||40)/2,(o.h||40)/2),1,{col:'220,232,255',smin:20,smax:120,lmin:.4,lmax:.9,zmin:1,zmax:2.4,drag:2,rise:-10});
  if(!G.flags.wpn_web){ G.flags.wpn_web=true; setBanner(S('Moon silk, cut!','Cut!'),S('Only the Moon Glaive can cut it.','Only the glaive cuts it.'),2.2); }
  if(o.then) o.then(o); saveGame();
}
// fuses: a rope along o.pts ([[x,y],...]); fire or a blast anywhere on it lights it, and it burns to the far end
function fuseLen(o){ if(o._len==null){ let L=0; for(let i=1;i<o.pts.length;i++) L+=dist(o.pts[i-1][0],o.pts[i-1][1],o.pts[i][0],o.pts[i][1]); o._len=L; } return o._len; }
function fuseAt(o,s){ let L=0; for(let i=1;i<o.pts.length;i++){ const a=o.pts[i-1], b=o.pts[i], d=dist(a[0],a[1],b[0],b[1]); if(L+d>=s){ const k=d?(s-L)/d:0; return [lerp(a[0],b[0],k),lerp(a[1],b[1],k)]; } L+=d; } const e=o.pts[o.pts.length-1]; return [e[0],e[1]]; }
function fuseHitS(o,x,y,r){ let L=0, best=-1, bd=1e9; for(let i=1;i<o.pts.length;i++){ const a=o.pts[i-1], b=o.pts[i], d=dist(a[0],a[1],b[0],b[1]); for(let s=0;s<=d;s+=8){ const k=d?s/d:0, px=lerp(a[0],b[0],k), py=lerp(a[1],b[1],k), q=dist(px,py,x,y); if(q<r&&q<bd){ bd=q; best=L+s; } } L+=d; } return best; }
function lightFuse(o,s){ o.lit=true; o.burn=Math.max(0,s); asnd('hiss'); SFX.play('pickup',0.5); }
function fuseDone(o){
  o.lit=false; G.found[o.id]=true; const e=o.pts[o.pts.length-1];
  if(AREA&&o.inArea){ wIgnite(e[0],e[1],22,2.2); if(o.target){ const t=AREA.objs.find(q=>q.id===o.target); if(t&&t.k==='cgate'&&t.type==='crack'&&!t.opened) breakCrack(t); else if(t&&t.onHit) t.onHit('fire',t.x,t.y,10); } }
  else armsWorldHit(e[0],e[1],22,'fire');
  if(o.blast) armsBlast(e[0],e[1],{noAsh:false});
  if(o.then) o.then(o);
  saveGame();
}
const AK={
  boulder:{hit(o,src,x,y,r){ if(armsGone(o)||!armsNear(o,x,y,r)) return false;
      if(src==='bomb'||(src==='hammer'&&ARMS.hamCh>=0.99)){ breakBoulder(o); return true; }
      if(src==='hammer') armsNag(o,AT('So close! Charge the hammer all the way, or use a bomb.','Charge the hammer all the way!'));
      else if(src!=='fire'&&src!=='whip'&&src!=='arrow') armsNag(o,AT('Too big to cut. A bomb might do it.','Too big. Try a bomb.'));
      return src!=='fire'&&src!=='whip'; },
    draw:drawBoulder},
  bombflower:{hit(o,src,x,y,r){ if(!flowerRipe(o)||!armsNear(o,x,y,r)) return false; if(src==='bomb'){ popFlower(o); return true; } if(src==='whip'&&bombsOwned()&&pickFlower(o)) return true; popFlower(o); return true; },
    draw:drawFlower},
  whiphook:{hit(){ return false; },draw:drawHook},
  web:{hit(o,src,x,y,r){ if(armsGone(o)||!armsNear(o,x,y,r)) return false;
      if(src==='glaive'){ cutWeb(o); return true; }
      armsNag(o,src==='fire'?AT('Moon silk does not burn. It just glows.','It will not burn.'):AT('Too tough! Only a moon blade can cut moon silk.','Too tough! Try a moon blade.'));
      return src!=='fire'; },
    draw:drawWeb},
  fuse:{hit(o,src,x,y,r){ if(o.lit||armsGone(o)||(src!=='fire'&&src!=='bomb')) return false; const s=fuseHitS(o,x,y,r+12); if(s<0) return false; lightFuse(o,s); return true; },draw:drawFuse}
};
// outdoors: our landmarks near a point (bombs, the whip tip, the glaive, the hammer, fire)
function armsWorldHit(x,y,r,src){
  let hit=false; const m=curMap();
  for(const o of ARMS.lm){ if(mapAt(o.y)!==m) continue; const K=AK[o.k]; if(K&&K.hit(o,src,x,y,r)) hit=true; }
  return hit;
}
// outdoor pots near a point (the glaive and bombs fly far from Ash, so they cannot use activeBreakables)
function armsLmPots(x,y,r,seen){
  if(G.mode!=='story') return;
  for(const o of mapList(LANDMARKS,curMap())){
    if(!o.breakable) continue; if(o.broken&&G.worldTime-o.brokenT>300) o.broken=false;
    if(o.broken||(seen&&seen.has(o))||dist2(o.x,o.y,x,y)>(r+14)**2) continue;
    if(seen) seen.add(o); armsBreakLm(o);
  }
}
function armsBreakLm(o){
  o.broken=true; o.brokenT=G.worldTime; SFX.play('pop'); shake(2);
  emit(o.x,o.y,14,{col:o.k==='barrel'?'120,80,40':'170,120,80',glow:false,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4});
  const r=Math.random(); if(r<0.5) dropCoins(o.x,o.y,randi(1,3)); else if(r<0.65&&player.hp<player.maxHp) dropHeal(o.x,o.y,10);
  if(o.col){ removeCol(o.col); o.col=null; }
  potDrop(o);
}
function armsBreakAreaPot(o){
  o.broken=true; SFX.play('pop'); emit(o.x,o.y,14,{col:o.k==='barrel'?'120,80,40':'170,120,80',glow:false,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4});
  if(Math.random()<0.6) dropCoins(o.x,o.y,randi(1,3)); if(o.col){ removeCol(o.col); o.col=null; }
  potDrop(o);
}
// a broken pot sometimes has a bomb in it (once Ash carries bombs and his bag is not full)
function potDrop(o){ if(bombsOwned()&&bombsN()<bombsMax()&&Math.random()<0.25) ARMS.drops.push({x:o.x,y:o.y,vx:rand(-60,60),vy:rand(-60,60),life:20}); }
// the whip pulls loose things to Ash: pots (they break at his feet), keys, coins
function armsYank(o,kind){ if(o.yank) return; o.yank=true; if(kind==='lmpot'){ o.hx0=o.hx0!=null?o.hx0:o.x; o.hy0=o.hy0!=null?o.hy0:o.y; } ARMS.yanks.push({o,kind,x0:o.x,y0:o.y,t:0,dur:0.24}); wsnd('whoosh',0.5); }
function armsYanks(dt){
  const p=player;
  for(const Y of ARMS.yanks){
    Y.t+=dt; const k=smooth(clamp(Y.t/Y.dur,0,1)), f=p.facing, tx=p.x+Math.cos(f)*(Y.kind==='key'?0:26), ty=p.y+Math.sin(f)*(Y.kind==='key'?0:26);
    Y.o.x=lerp(Y.x0,tx,k); Y.o.y=lerp(Y.y0,ty,k);
    if(Math.random()<0.5) emit(Y.o.x,Y.o.y,1,{col:'150,130,110',glow:false,smin:10,smax:40,lmin:.2,lmax:.4,zmin:1.5,zmax:3});
    if(Y.t>=Y.dur){ Y.done=true; Y.o.yank=false;
      if(Y.kind==='pot') armsBreakAreaPot(Y.o);
      else if(Y.kind==='lmpot'){ armsBreakLm(Y.o); Y.o.x=Y.o.hx0; Y.o.y=Y.o.hy0; } }
  }
  if(ARMS.yanks.length) ARMS.yanks=ARMS.yanks.filter(Y=>!Y.done);
}
// ---- inside areas: what the new weapons do to the objects there (the old weapons keep areaObjHit's own rules)
function armsObjHit(x,y,r,src){
  const A=AREA, D=WEAPONS[ARMS_SRC[src]], acts=D.acts||[src], once=ARMS.once; let hit=false;
  const mark=o=>{ if(once) once.add(o); hit=true; };
  for(const o of A.objs){
    if(once&&once.has(o)) continue;
    const d=dist(x,y,o.x,o.y);
    if(o.k==='tswitch'){ if(d<r+o.r){ if(o.acc.some(s=>acts.includes(s))){ trialSwitchOn(o); mark(o); } else if(!(o.nope>G.time)){ o.nope=G.time+1; const n=o.acc[0]; ftext(o.x,o.y-28,n==='boomerang'?'Needs a boomerang':n==='arrow'?'Needs an arrow':`Needs the ${(WEAPONS[ARMS_SRC[n]||n]||{}).name||n}`,'#c8d8ff',12); } } }
    else if(o.k==='teye'){ if(d<r+o.r&&!o.lit&&src!=='bomb'&&!(o.nope>G.time)){ o.nope=G.time+1; ftext(o.x,o.y-28,'Only an arrow wakes it','#ffe0b0',12); } }
    else if(o.k==='crystal'){ if(o.cd<=0&&d<r+18){ hitCrystal(o); mark(o); } }
    else if(o.breakable&&!o.broken&&!o.yank&&d<r+14){ if(src==='whip') armsYank(o,'pot'); else armsBreakAreaPot(o); mark(o); }
    else if(o.k==='cgate'&&o.type==='crack'&&!o.opened&&src==='bomb'&&d<r+56){ breakCrack(o); mark(o); }
    else if(o.k==='lever'&&!o.on&&src==='whip'&&d<r+(o.r||14)){ caveObjAct(o); ftext(o.x,o.y-30,AT('Yank!','Yank!'),'#ffe0b0',12); mark(o); }
    else if((o.k==='smallkey'||o.k==='coinpile'||o.k==='treatpick')&&src==='whip'&&!G.found[o.id]&&!o.yank&&d<r+16){ armsYank(o,'key'); mark(o); }
  }
  return hit;
}
{ const base=areaObjHit;
  areaObjHit=function(x,y,r,src){
    const A=AREA; if(!A||!A.objs) return false; r=r||8;
    if(ARMS.g!==G) armsReset();
    let hit=false; const mine=!!ARMS_SRC[src], once=ARMS.once;
    const pots=!mine&&bombsOwned()?A.objs.filter(o=>o.breakable&&!o.broken&&dist2(x,y,o.x,o.y)<(r+14)**2):null;
    for(const o of A.objs){
      if(once&&once.has(o)) continue;
      if(o.onHit&&armsNear(o,x,y,r)&&o.onHit(src,x,y,r)){ if(once) once.add(o); hit=true; continue; }
      const K=AK[o.k]; if(K&&K.hit(o,src,x,y,r)){ if(once) once.add(o); hit=true; }
    }
    hit=(mine?armsObjHit(x,y,r,src):base(x,y,r,src))||hit;
    if(pots) for(const o of pots) if(o.broken) potDrop(o);
    return hit;
  };
}
// outdoor fire, pots and swings reach the new world pieces too
{ const base=wIgnite; wIgnite=function(x,y,r,heat){ base(x,y,r,heat); if(G.mode!=='story') return; if(!AREA) armsWorldHit(x,y,r,'fire'); for(const b of G.wproj) if(b.k==='bomb'&&!b.dead&&dist2(b.x,b.y,x,y)<(r+12)**2) b.fuse=Math.min(b.fuse,0.14); }; }
{ const base=swingBreakables; swingBreakables=function(px,py,dir,range,half){
    const before=bombsOwned()?activeBreakables().filter(o=>!o.broken):null;
    base(px,py,dir,range,half);
    if(before) for(const o of before) if(o.broken) potDrop(o);
    if(!AREA&&G.mode==='story'&&!ARMS.inHam) for(const o of ARMS.lm){ const K=AK[o.k]; if(K&&inArcC(px,py,dir,range,half,{x:o.x,y:o.y,r:o.w?Math.max(o.w,o.h)/2:(o.r||16)})) K.hit(o,'slash',o.x,o.y,4); }
  }; }
{ const base=breathWorld; breathWorld=function(mx,my,ang,dt){
    base(mx,my,ang,dt);
    const hitA=(o)=>inArcC(mx,my,ang,175,0.45,{x:o.x,y:o.y,r:o.w?Math.max(o.w,o.h)/2:(o.r||16)});
    const list=AREA?AREA.objs:ARMS.lm;
    for(const o of list){ const K=AK[o.k]; if(!K) continue; if(o.k==='fuse'){ if(!o.lit&&!armsGone(o)){ for(let s=0;s<=fuseLen(o);s+=10){ const q=fuseAt(o,s); if(inArcC(mx,my,ang,175,0.45,{x:q[0],y:q[1],r:6})){ lightFuse(o,s); break; } } } continue; } if(hitA(o)) K.hit(o,'fire',o.x,o.y,0); }
    for(const b of G.wproj) if(b.k==='bomb'&&!b.dead&&inArcC(mx,my,ang,175,0.45,{x:b.x,y:b.y,r:8})) b.fuse=Math.min(b.fuse,0.14);
  }; }
// the Forge Hammer: a full charge breaks boulders (outdoors and in areas)
{ const base=hammerImpact; hammerImpact=function(h){
    ARMS.hamCh=h.ch||0; ARMS.inHam=true;
    try{ base(h); }finally{ ARMS.hamCh=0; ARMS.inHam=false; }
    const p=player, K=wReachK(), ix=p.x+Math.cos(p.facing)*34*K, iy=p.y+Math.sin(p.facing)*34*K, R=(70+45*(h.ch||0))*K;
    if(!AREA){ ARMS.hamCh=h.ch||0; armsWorldHit(ix,iy,R*0.6,'hammer'); ARMS.hamCh=0; }
  }; }
// a new weapon fills its own bag the first time
{ const base=giveWeapon; giveWeapon=function(id,quiet){ const had=!!(G&&G.weapons&&G.weapons[id]); base(id,quiet); if(id==='bombs'&&!had&&G){ G.flags.wpn_bombs=bombsMax(); } }; }
// shops: Pell (and any shop listed in ARMS.shops) sells bombs once Ash carries them
function armsShopRows(){
  if(!bombsOwned()) return [];
  return [[S('Blast Bombs (fill your bomb bag)','Bombs (fill your bag)'),30,()=>{ G.flags.wpn_bombs=bombsMax(); setBanner(S('Bomb bag full','Bomb bag full'),S('Ready to go boom.','Ready!'),1.6); },()=>bombsN()<bombsMax()||S('Your bomb bag is already full.','Your bag is full.')]];
}
{ const base=runShop; runShop=function(who,greet,list){ if(ARMS.shops.includes(who)) list=list.concat(armsShopRows()); return base(who,greet,list); }; }

// ---------- per frame: our landmarks (colliders after a load, bomb flowers you walk over), area pieces, fuses, yanks
function armsWorldTick(dt){
  if(ARMS.g!==G) armsReset();
  if(!G||!player||G.mode!=='story') { if(G&&G.mode!=='story') armsYanks(dt); return; }
  const p=player, list=AREA?AREA.objs:ARMS.lm, m=curMap();
  for(const o of list){
    if(!AK[o.k]) continue;
    if(!AREA&&mapAt(o.y)!==m) continue;
    if(o.col&&(o.k==='boulder'||o.k==='web')){ const off=armsGone(o); if(o.col.off!==off) o.col.off=off; }
    if(o.k==='bombflower'&&flowerRipe(o)&&!airborne()&&dist2(p.x,p.y,o.x,o.y)<30*30) pickFlower(o);
    else if(o.k==='fuse'&&o.lit){ o.burn+=150*dt; ARMS.hissT-=dt; if(ARMS.hissT<=0){ ARMS.hissT=0.25; asnd('hiss',0.8); } const q=fuseAt(o,o.burn); if(Math.random()<0.8) emit(q[0],q[1],1,{col:'255,200,110',ang:-Math.PI/2,spread:1.4,smin:20,smax:70,lmin:.1,lmax:.3,zmin:1,zmax:2,drag:3}); if(o.burn>=fuseLen(o)) fuseDone(o); }
  }
  armsYanks(dt);
}
{ const base=updateWeapon; updateWeapon=function(dt,inp){ base(dt,inp); armsWorldTick(dt); }; }

// ---------- drawing the world pieces
function drawBoulder(o,t){
  if(armsGone(o)){ const v=aSpr('rubble',90,50,(g)=>{ const rng=mulberry32(7); for(let i=0;i<9;i++){ const x=45+(rng()-0.5)*66, y=28+(rng()-0.5)*22, r=3+rng()*6; g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x+1.5,y+2.5,r,r*0.6,0,0,TAU); g.fill(); g.fillStyle=rng()<0.5?'#8a7c6c':'#6e6254'; g.strokeStyle='#2a2018'; g.lineWidth=1.6; g.beginPath(); g.ellipse(x,y,r,r*0.75,rng(),0,TAU); g.fill(); g.stroke(); } });
    aPut(v,o.x-45,o.y-28); return; }
  const v=(o.id.length+(o.id.charCodeAt(o.id.length-1)||0))%3, sp=aSpr('boulder'+v,104,96,(g)=>{
    const rng=mulberry32(91+v*13); g.translate(52,62);
    g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(4,22,44,13,0,0,TAU); g.fill();
    g.beginPath(); for(let i=0;i<14;i++){ const a=i/14*TAU, r=(38+rng()*6)*(a>Math.PI?1.04:1), y=Math.sin(a)*r*(a>0&&a<Math.PI?0.62:0.95); g.lineTo(Math.cos(a)*r,y-6); } g.closePath();
    g.strokeStyle='#241a14'; g.lineWidth=5; g.stroke();
    const gr=g.createLinearGradient(-30,-44,24,26); gr.addColorStop(0,'#b8ab98'); gr.addColorStop(0.5,'#8c7e6c'); gr.addColorStop(1,'#5a4e42'); g.fillStyle=gr; g.fill();
    g.save(); g.clip(); g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-12,-30,22,12,-0.4,0,TAU); g.fill(); g.fillStyle='rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(16,18,36,16,0,0,TAU); g.fill();
    g.fillStyle='#6a8a3e'; for(let i=0;i<5;i++){ g.beginPath(); g.ellipse(-26+rng()*30,-38+rng()*10,6+rng()*6,3+rng()*2,0,0,TAU); g.fill(); } g.restore();
    g.strokeStyle='#2a1e16'; g.lineWidth=2.2; g.beginPath(); g.moveTo(-6,-40); g.lineTo(2,-22); g.lineTo(-4,-10); g.lineTo(6,6); g.moveTo(2,-22); g.lineTo(16,-18); g.moveTo(-4,-10); g.lineTo(-18,-2); g.stroke();
    g.strokeStyle='rgba(255,230,200,.35)'; g.lineWidth=1; g.beginPath(); g.moveTo(-5,-39); g.lineTo(3,-23); g.stroke();
  });
  aPut(sp,o.x-52,o.y-62);
}
function drawFlower(o,t){
  const ripe=flowerRipe(o), sw=Math.sin(t*2+o.x*0.1)*0.08;
  const leaves=aSpr('bfleaf',40,26,(g)=>{ g.translate(20,18); g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(1,4,16,5,0,0,TAU); g.fill(); for(const s of [-1,1]){ g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(s*10,-10,s*17,-2); g.quadraticCurveTo(s*9,3,0,0); g.strokeStyle='#1c2a10'; g.lineWidth=2.4; g.stroke(); g.fillStyle='#5aa03a'; g.fill(); } });
  aPut(leaves,o.x-20,o.y-18);
  if(!ripe){ ctx.fillStyle='#3a6a22'; ctx.beginPath(); ctx.arc(o.x,o.y-4,3.4,0,TAU); ctx.fill(); return; }
  ctx.save(); ctx.translate(o.x,o.y-6); ctx.rotate(sw);
  ctx.fillStyle='#1c2a10'; for(let i=0;i<5;i++){ const a=i/5*TAU-Math.PI/2; ctx.beginPath(); ctx.ellipse(Math.cos(a)*7,Math.sin(a)*4-6,5.4,3.4,a,0,TAU); ctx.fill(); }
  ctx.fillStyle='#ff8a3a'; for(let i=0;i<5;i++){ const a=i/5*TAU-Math.PI/2; ctx.beginPath(); ctx.ellipse(Math.cos(a)*7,Math.sin(a)*4-6,4.2,2.4,a,0,TAU); ctx.fill(); }
  ctx.drawImage(bombSprite(),-12.6,-23,25.2,25.2);
  ctx.restore();
  glowAt(o.x+4,o.y-25,5+Math.sin(t*9)*1.2,'255,200,110',0.5);
}
function drawHook(o,t){
  const sp=aSpr('whiphook',44,70,(g)=>{ g.translate(22,62);
    g.fillStyle='rgba(0,0,0,.26)'; g.beginPath(); g.ellipse(2,2,12,5,0,0,TAU); g.fill();
    g.fillStyle='#241a14'; g.fillRect(-5.4,-44,10.8,46); const gr=g.createLinearGradient(-4,0,4,0); gr.addColorStop(0,'#a8743e'); gr.addColorStop(1,'#5e3a1c'); g.fillStyle=gr; g.fillRect(-3.8,-43,7.6,44);
    g.fillStyle='#d8a840'; g.fillRect(-5,-30,10,3); g.fillRect(-5,-10,10,3);
    g.strokeStyle='#241a14'; g.lineWidth=5.4; g.beginPath(); g.arc(0,-50,8,0,TAU); g.stroke(); g.strokeStyle='#e0b24a'; g.lineWidth=2.8; g.stroke(); g.strokeStyle='rgba(255,250,220,.8)'; g.lineWidth=0.9; g.beginPath(); g.arc(0,-50,8,-2.4,-1.2); g.stroke(); });
  aPut(sp,o.x-22,o.y-62);
  const p=player; if(p&&curWeapon()==='whip'&&dist2(p.x,p.y,o.x,o.y)<(WHIP_LEN+40)**2){ glowAt(o.x,o.y-50,14,'255,220,140',0.25+0.15*Math.sin(t*5)); }
}
function drawWeb(o,t){
  if(armsGone(o)) return;
  const w=o.w||60, h=o.h||60, key='web'+w+'x'+h, sp=aSpr(key,w+8,h+8,(g)=>{
    g.translate(w/2+4,h/2+4); const rng=mulberry32(w*7+h); g.lineCap='round';
    for(const pass of [0,1]){ g.strokeStyle=pass?'rgba(235,242,255,.9)':'rgba(30,34,60,.55)'; g.lineWidth=pass?1.1:2.6;
      for(let i=0;i<9;i++){ const a=i/9*TAU+0.2; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*w*0.62,Math.sin(a)*h*0.62); g.stroke(); }
      for(let k=1;k<=4;k++){ g.beginPath(); for(let i=0;i<=9;i++){ const a=i/9*TAU+0.2, r=k/4*(0.92+rng()*0.1); g.lineTo(Math.cos(a)*w*0.5*r,Math.sin(a)*h*0.5*r); } g.stroke(); } }
  });
  const nk=1-daylight();
  if(nk>0.1) glowAt(o.x,o.y,Math.max(w,h)*0.55,'170,200,255',0.2*nk);
  ctx.globalAlpha=0.85+0.15*Math.sin(t*2+o.x); aPut(sp,o.x-w/2-4,o.y-h/2-4); ctx.globalAlpha=1;
}
function drawFuse(o,t){
  const P=o.pts, done=armsGone(o), L=fuseLen(o), b=o.lit?o.burn:done?L:0;
  ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.strokeStyle='#241a14'; ctx.lineWidth=4; ctx.beginPath(); P.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  ctx.strokeStyle=done?'#3a3430':'#c89a5a'; ctx.lineWidth=2.2; ctx.setLineDash([5,3]); ctx.stroke(); ctx.setLineDash([]);
  if(b>0&&!done){ ctx.strokeStyle='#3a3430'; ctx.lineWidth=2.4; ctx.beginPath(); let acc=0; ctx.moveTo(P[0][0],P[0][1]); for(let i=1;i<P.length;i++){ const d=dist(P[i-1][0],P[i-1][1],P[i][0],P[i][1]); if(acc+d<b){ ctx.lineTo(P[i][0],P[i][1]); acc+=d; } else { const q=fuseAt(o,b); ctx.lineTo(q[0],q[1]); break; } } ctx.stroke(); }
  ctx.restore();
  if(o.lit){ const q=fuseAt(o,o.burn); glowAt(q[0],q[1],10+3*Math.sin(t*30),'255,200,110',0.9); }
  else if(!done){ const s=P[0]; ctx.fillStyle='#8a929c'; ctx.strokeStyle='#241a14'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(s[0],s[1],4,0,TAU); ctx.fill(); ctx.stroke(); }
}
for(const k in AK) FL[k]=(o,t)=>AK[k].draw(o,t);
{ const base=drawLandmark; drawLandmark=function(o,t){ const K=AK[o.k]; if(K&&o.arms){ K.draw(o,t); return; } return base(o,t); }; }

// ---------- placing the world pieces (for the map and dungeon helpers)
//   outdoors: armsAdd(kind,{id,x,y,...}) -> the landmark; inside an area builder: armsAdd(kind,{id,x,y,...},A)
//   kinds: boulder {r}, bombflower, whiphook {to:{x,y}}, web {w,h}, fuse {pts:[[x,y],...],target?,blast?,then?}
function armsAdd(kind,o,A){
  if(!AK[kind]) throw new Error('armsAdd: unknown kind '+kind);
  o.k=kind; o.arms=true; if(!o.id) o.id=`arms_${kind}_${Math.round(o.x)}_${Math.round(o.y)}`;
  if(kind==='fuse'&&o.pts){ o.x=o.pts[0][0]; o.y=o.pts[0][1]; }
  let c=null;
  if(kind==='boulder'){ o.r=o.r||34; c={t:'c',x:o.x,y:o.y,r:o.r}; }
  else if(kind==='whiphook'){ o.r=o.r||9; c={t:'c',x:o.x,y:o.y,r:o.r}; }
  else if(kind==='web'){ o.w=o.w||60; o.h=o.h||60; c={t:'r',x0:o.x-o.w/2,y0:o.y-o.h/2,x1:o.x+o.w/2,y1:o.y+o.h/2}; }
  if(A){ o.inArea=true; A.objs.push(o); if(c&&!(G&&G.found[o.id]&&(kind==='boulder'||kind==='web'))){ if(A===AREA) addAreaCol(c); else{ addCol(c); A.cols.push(c); } o.col=c; } }
  else{ LANDMARKS.push(o); ARMS.lm.push(o); if(c){ addCol(c); o.col=c; armsSync(o); } }
  return o;
}

// ---------- debug
window.__ebX=Object.assign(window.__ebX||{},{
  defineWeapon, armsAdd, bombBag, armsShopRows, addBombs,
  giveAllWeapons(){ for(const id of WEAPON_IDS) giveWeapon(id,true); if(G){ G.flags.wpn_bombs=bombsMax(); } },
  refillBombs(n){ if(!G) return 0; G.flags.wpn_bombs=n==null?bombsMax():clamp(n,0,bombsMax()); return G.flags.wpn_bombs; },
  armsSpawn(kind,x,y,o){ const q=armsAdd(kind,Object.assign({x,y,id:`dbg_${kind}_${Math.round(x)}_${Math.round(y)}_${(Math.random()*1e4)|0}`},o||{}),AREA||null); return q.id; },
  armsObj(id){ const o=(AREA?AREA.objs:ARMS.lm).find(q=>q.id===id); return o?{k:o.k,x:o.x,y:o.y,gone:armsGone(o),lit:!!o.lit,burn:o.burn||0,ripe:o.k==='bombflower'?flowerRipe(o):null,colOff:o.col?!!o.col.off:null}:null; },
  armsState(){ const p=player; return {weapon:curWeapon(),bombs:bombsN(),bombMax:bombsMax(),whip:p.whip?{ph:p.whip.ph,ch:p.whip.ch||0}:null,lash:p.wl?{crack:p.wl.crack,ext:p.wl.ext||0,tx:p.wl.tx,ty:p.wl.ty}:null,swing:!!ARMS.swing,aim:p.bombAim?p.bombAim.k:null,glv:p.glv?p.glv.t:null,
    proj:(G.wproj||[]).filter(a=>a.k==='bomb'||a.k==='glaive').map(a=>({k:a.k,x:Math.round(a.x),y:Math.round(a.y),st:a.st||a.ph,fuse:a.fuse!=null?+a.fuse.toFixed(2):null,bounced:!!a.bounced})),drops:ARMS.drops.length,yanks:ARMS.yanks.length,yankT:ARMS.yanks.map(Y=>+Y.t.toFixed(3)),night:+glvNight().toFixed(2)}; },
  armsBlast:(x,y)=>armsBlast(x,y), glvNight,
  armsTouchBtn(id){ const b=tLayout().find(q=>q.id===id); return b?{x:b.x,y:b.y,r:b.r}:null; },
  armsShoot(x,y,ang,spd){ shoot(x,y,ang,spd||200,9,10,'orb','enemy',{life:5}); return G.projectiles.length-1; },
  projOwners(){ return G.projectiles.filter(q=>!q.dead).map(q=>q.owner); },
  // an open spot near (x,y): no walls, colliders, water or pits within r (for tests)
  armsOpen(x,y,r){ for(let d=0;d<3000;d+=60) for(let a=0;a<TAU;a+=0.7){ const cx=x+Math.cos(a)*d, cy=y+Math.sin(a)*d; let ok=true; for(let rr=0;rr<=r&&ok;rr+=24) for(let b=0;b<TAU&&ok;b+=0.4){ const px=cx+Math.cos(b)*rr, py=cy+Math.sin(b)*rr; if(armsWall(px,py)||armsHazard(px,py)||blockedAt(px,py)) ok=false; } if(ok) return [Math.round(cx),Math.round(cy)]; } return null; }
});
