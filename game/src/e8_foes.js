
// ================= e8_foes: the foes and boss framework (v9 wave 1)
// One place to add enemies and bosses on any map (scratchpad/FOES.md is the guide):
//   defineFoe(type,{...})      EDEF entry + AI + death colour + 2D and 3D drawers + hooks (init, idle, onHurt, onDeath, over, lift)
//   FK.*                       an AI kit: tuned behaviours built on FK.brain (moves with telegraphs, difficulty aware)
//   defineBoss(siteKey,{...})  a story boss site: stage gate, guards, an arena that rises for the fight, flight rule, music
//   bossPhase(e,[0.66,0.33])   phase index, with a banner, a short invulnerable transition and an onPhase hook
// The six Act I site bosses are rebuilt on it further down (harder, each with a phase that needs a skill or a tool).

// ---------- difficulty: one helper for every AI (read through foeDiff(), safe when fields are missing).
// With e6_balance in the build (DIFFS has wind/cad), its runAI already speeds up e.cd, scales wind-ups and recoveries,
// and makeEnemy scales speed, so the kit leaves those alone (cdK, tele and spd are 1) and only custom boss timers read
// atk (= DIFFS.cad). Without it the kit does its own: atk/cad, spd, tele (Easy 1.3, Normal 1, Hard 0.88).
//   atk   custom timers (higher = sooner)       cdK   how fast the brain's cooldown e.cd runs
//   spd   kit movement speed                     tele  kit wind-up length        edmg  extra boss hit damage (bdmg)
const FDV={atk:1,cdK:1,spd:1,aggro:1,edmg:1,tele:1,i:1,easy:false,hard:false,bal:false};
const FOE_TELE=[1.3,1,0.88];
function foeDiff(){
  const d=(G&&G.diff)||DIFFS[1]; let i=DIFFS.indexOf(d); if(i<0) i=clamp(typeof diffIdx==='number'?diffIdx:1,0,2);
  const bal=d.wind!=null||d.cad!=null, cad=d.cad>0?d.cad:(d.atk>0?d.atk:1);
  FDV.bal=bal; FDV.atk=cad; FDV.cdK=bal?1:cad; FDV.spd=bal?1:(d.spd>0?d.spd:1); FDV.aggro=d.aggro>0?d.aggro:1; FDV.edmg=d.edmg>0?d.edmg:1;
  FDV.tele=bal?1:(d.tele>0?d.tele:(FOE_TELE[i]||1)); FDV.i=i; FDV.easy=i===0; FDV.hard=i===2;
  return FDV;
}
const byDiff=(easy,normal,hard)=>{ const i=foeDiff().i; return i===0?easy:i===2?hard:normal; };
// a boss hit of n (like ed(n), plus the difficulty's enemy damage)
function bdmg(n){ return ed(n)*foeDiff().edmg; }

// ================= defineFoe
const FOES={};
const FOE_KEYS=['r','hp','lv','speed','dmg','value','flying','shield','kbRes','swim','boss','mini','name','title','short'];
const FOE_STOCK2D=new Set(['kobold','grizzlefang','cultist','morrow','drakeling','broodmother','knight','cindervane','wolf','egg','greymane','gloamjaw','bat','slime','gnarl','serpent','skrae','knot','bramble','crab','eel','gust','sneak','vorlaxis']);
function defineFoe(type,d){
  d=d||{}; if(!type) throw new Error('defineFoe needs a type');
  const E=Object.assign({r:14,hp:30,speed:100,dmg:8,value:10},EDEF[type]||{});
  for(const k of FOE_KEYS) if(d[k]!==undefined) E[k]=d[k];
  EDEF[type]=E;
  if(d.dcol) DCOL[type]=d.dcol; else if(!DCOL[type]) DCOL[type]='200,170,120';
  const F=FOES[type]||(FOES[type]={type,base:AI[type]||null});
  for(const k in d) F[k]=d[k];
  if(d.ai){ if(d.ai.idle&&!d.idle) F.idle=d.ai.idle; if(d.ai.init&&!d.init) F.init=d.ai.init; }
  if(!F.ai&&!F.base) F.ai=FK.chaser();   // a new foe with no AI yet walks up and swings
  if(F.ai||F.phases) AI[type]=foeAI(F);
  if(d.draw2d) FOE2D[type]=d.draw2d;
  if(d.draw3d) T3E[type]=d.draw3d;
  if(!FOE2D[type]&&!FOE_STOCK2D.has(type)) FOE2D[type]=(e,fl)=>foeBlob(e,fl);
  if(d.speaker&&d.speaker.id&&!SPK[d.speaker.id]) SPK[d.speaker.id]={name:d.speaker.name||E.name||type,col:d.speaker.col||'#d8c3a0'};
  return E;
}
function foeAI(F){
  return function(e,dt){
    if(e.phaseT>0){ phaseTick(e,dt); return; }
    if(F.phases&&e.boss){ bossPhase(e,F.phases); if(e.phaseT>0) return; }
    const f=F.ai||F.base; if(f) f(e,dt,player);
  };
}
// what kind of hit this is, for onHurt hooks
const FH={src:'',melee:false,ranged:false,fire:false,roar:false,comp:false,behind:false};
function foeHit(e,o){
  o=o||{}; const s=o.src||'slash'; FH.src=s;
  FH.melee=s==='slash'||s==='hammer'; FH.ranged=s==='arrow'||s==='boomerang'||s==='proj'; FH.fire=s==='fire'||s==='burn'||s==='ember'; FH.roar=s==='roar'; FH.comp=s==='comp';
  const fx=o.fx!=null?o.fx:player.x, fy=o.fy!=null?o.fy:player.y; FH.behind=Math.abs(angDiff(e.face,angTo(e.x,e.y,fx,fy)))>1.95;
  return FH;
}
// hooks on the stock enemy code (wrapping, so the stock files stay as they are)
{ const base=makeEnemy; makeEnemy=function(type,x,y,opt){
    const e=base(type,x,y,opt), F=FOES[type];
    if(F){ if(F.phases&&e.boss){ e.phases=F.phases; e.bph=0; } if(F.init) F.init(e,opt||{}); }
    const b=G&&G.bf; if(b&&b.A&&b.A.on&&arenaIn(b.A,e.x,e.y,0)) e.inArena=b.A;
    return e; }; }
{ const base=damageEnemy; damageEnemy=function(e,amt,o){
    const F=FOES[e.type];
    if(F&&F.onHurt&&!e.dead&&!e.invuln&&!(e.spawnIn>0)&&!e.passive){ o=o||{}; const r=F.onHurt(e,amt,o); if(r===false) return 0; if(typeof r==='number') amt=r; }
    return base(e,amt,o); }; }
{ const base=killEnemy; killEnemy=function(e){ if(e.dead) return; const F=FOES[e.type]; base(e); if(F&&F.onDeath) F.onDeath(e); }; }
{ const base=idleAI; idleAI=function(e,dt){ const F=FOES[e.type]; if(F&&F.idle){ F.idle(e,dt); return; } base(e,dt); }; }
// movement bookkeeping: e._stall grows while a foe that wants to move barely moves (a wall, a cliff face, a collider).
// foeBumped(e) is the reliable "I ran into something" test for chargers (e.hitWall alone misses blocks that do not set it).
{ const base=integrate; integrate=function(e,dt){
    const ox=e.x, oy=e.y, wx=(e.dx+e.vx)*dt, wy=(e.dy+e.vy)*dt, w=wx*wx+wy*wy;
    base(e,dt);
    if(w>4){ const gx=e.x-ox, gy=e.y-oy; e._stall=(gx*gx+gy*gy<w*0.12)?(e._stall||0)+dt:0; } else e._stall=0; }; }
function foeBumped(e){ return !!e.hitWall||(e._stall||0)>0.05; }
// drawing: lift (draw the foe higher, like a bird on a crag) and over (overlays such as armour, shields, ice)
{ const base=drawEnemy; drawEnemy=function(e){
    const F=FOES[e.type]; if(!F||(!F.lift&&!F.over)){ base(e); return; }
    const l=F.lift?(F.lift(e)||0):0;
    if(l){ e.y-=l; base(e); e.y+=l; } else base(e);
    if(F.over) F.over(e,l); }; }
// points inside caves and dungeons: clampMap used to pull them back onto the outdoor map (summons and bombs in a
// dungeon landed thousands of pixels away). Inside an area they are clamped to the area instead.
{ const base=clampMap; clampMap=function(x,y,m,refY){
    if(x>=IZX-50){ if(AREA&&AREA.x1>AREA.x0){ m=m||0; return [clamp(x,AREA.x0+m,AREA.x1-m),clamp(y,AREA.y0+m,AREA.y1-m)]; } return [x,y]; }
    return base(x,y,m,refY); }; }

// a plain stand-in drawer so a new foe shows up before it has art: a round critter in its death colour with eyes
function foeBlob(e,fl){
  const c=(DCOL[e.type]||'200,170,120').split(',').map(Number), r=e.r, f=e.face;
  const col=fl?'#ffffff':`rgb(${c[0]},${c[1]},${c[2]})`, dk=`rgb(${c[0]*0.45|0},${c[1]*0.45|0},${c[2]*0.45|0})`;
  ctx.save(); ctx.translate(e.x,e.y);
  if(e.hidden){ ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0,r*0.4,r*1.2,r*0.5,0,0,TAU); ctx.fill(); ctx.fillStyle=dk; ctx.beginPath(); ctx.ellipse(0,0,r*1.1,r*0.65,0,0,TAU); ctx.fill(); ctx.restore(); return; }
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0,r*0.55,r*0.95,r*0.4,0,0,TAU); ctx.fill();
  const bob=Math.sin((e.t||0)*8)*(Math.hypot(e.dx||0,e.dy||0)>5?1.5:0.4);
  ctx.fillStyle=col; ctx.strokeStyle=dk; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,-bob,r,0,TAU); ctx.fill(); ctx.stroke();
  for(const s of [-1,1]){ const a=f+s*0.5, ex=Math.cos(a)*r*0.55, ey=Math.sin(a)*r*0.55-bob-r*0.2; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(ex,ey,r*0.24,0,TAU); ctx.fill(); ctx.fillStyle='#120a06'; ctx.beginPath(); ctx.arc(ex+Math.cos(f)*r*0.08,ey+Math.sin(f)*r*0.08,r*0.12,0,TAU); ctx.fill(); }
  ctx.restore();
}

// ================= the AI kit
// A brain walks a foe with a movement mode and, when its cooldown is up, picks one of its moves by weight.
// Each move owns e.state while it runs (with the stock state names, so the 3D figures animate) and telegraphs.
const FM={};
const FKC=[];
function fkW(o,def){ return (o.windup!=null?o.windup:def)*foeDiff().tele; }
function fkDmg(e,o){ return o.dmgN!=null?bdmg(o.dmgN):e.dmg*(o.dmg!=null?o.dmg:1); }
function fkLevel(e,o){ if(o&&o.level!=null) return o.level; if(!G||G.mode!=='story') return 1; if(G.bf) return bossSiteLevel(); return e.level||1; }
function fkWallStun(e,t){ e.dx=e.dy=0; e.vx*=0.2; e.vy*=0.2; e.stun=Math.max(e.stun,t); e.blocking=false; e.tele=null; shake(9); SFX.play('boom'); ftext(e.x,e.y-e.r-10,'STUNNED!','#ffe066',15); }
function fkTrail(e,o,dt){ e._trT=(e._trT||0)-dt; if(e._trT>0) return; e._trT=0.07; const L=o.trailLife||2.4; G.pools.push({x:e.x,y:e.y,r:o.trailR||24,life:L,max:L,owner:'enemy',dmg:bdmg(o.trailDmg||4),tick:0}); }
// melee swing with an arc telegraph (states windup, strike)
FM.slash={
  start(e,m){ const o=m.o; e.state=o.st||'windup'; e.st=fkW(o,0.38); m.R=o.reach||e.r+32; m.H=o.half||0.9; e.tele=newTele({shape:'arc',r:m.R,half:m.H,dur:e.st,col:o.col}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.hit){ e.face=turnTo(e.face,a,(o.track||3)*dt); e.st-=dt; if(e.st>0) return false;
      m.hit=true; e.tele=null; e.state=o.st2||'strike'; e.st=0.18; e.swung=0.25; if(o.snap) e.snap=0.25;
      const L=o.lunge!=null?o.lunge:220; e.vx+=Math.cos(e.face)*L; e.vy+=Math.sin(e.face)*L;
      if(inCone(e.x,e.y,e.face,m.R+2,m.H+0.1,p.x,p.y,p.r)) hurtPlayer(fkDmg(e,o),e.x,e.y,o.kb||180);
      SFX.play(o.sfx||'slash'); if(o.onHit) o.onHit(e); return false; }
    e.st-=dt; return e.st<=0; } };
// dash along a line telegraph (lunge: crouch, lunge; charge: chargeAim, charge with a wall stun; swoop: aim, swoop)
FM.lunge={
  start(e,m){ const o=m.o; m.n=o.chain||1; e.state=o.st||'crouch'; e.st=fkW(o,0.42); e.tele=newTele({shape:'line',len:o.len||160,w:o.w||e.r*1.6,dur:e.st,col:o.col}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ if(e.st>0.12) e.face=turnTo(e.face,a,(o.track||5)*dt); e.st-=dt; if(e.st>0) return false; m.go=true; m.hit=false; e.tele=null; e.state=o.st2||'lunge'; e.st=m.T=o.time||0.32; SFX.play('dash'); return false; }
    const s=(o.spd||500)*foeDiff().spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
    if(!m.hit&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+6){ if(hurtPlayer(fkDmg(e,o),e.x,e.y,o.kb||220)) m.hit=true; }
    if(o.trail) fkTrail(e,o,dt);
    if(o.wallStun&&e.st<m.T-0.07&&foeBumped(e)){ fkWallStun(e,o.wallStun); return true; }
    e.st-=dt; if(e.st>0) return false;
    if(--m.n>0){ m.go=false; e.state=o.st||'crouch'; e.st=fkW(o,0.42)*0.6; e.tele=newTele({shape:'line',len:o.len||160,w:o.w||e.r*1.6,dur:e.st,col:o.col}); return false; }
    return true; } };
// ranged: aimed or spread bolts, a ring burst, or lobbed blasts (state cast unless st says otherwise)
FM.shoot={
  start(e,m){ const o=m.o; m.n=o.volleys||1; e.state=o.st||'cast'; e.st=fkW(o,0.65); if(o.tele) e.tele=newTele(Object.assign({dur:e.st},o.tele)); },
  tick(e,dt,d,a,m){ const o=m.o; e.face=turnTo(e.face,a,(o.track!=null?o.track:6)*dt); e.st-=dt; if(e.st>0) return false;
    e.tele=null; fkFire(e,o,d,a); if(--m.n>0){ e.st=o.gap||0.4; return false; } return true; } };
function fkFire(e,o,d,a){
  const p=player, n=o.n||1, mode=o.mode||'aimed', dmg=fkDmg(e,o), spd=(o.spd||250)*(o.fast?foeDiff().spd:1), r=o.r||7, kind=o.kind||'bolt', k0=G.projectiles.length;
  if(o.turret) a=e.face;
  const mx=e.x+Math.cos(a)*e.r*0.7, my=e.y+Math.sin(a)*e.r*0.7;
  if(mode==='ring'){ const off=o.off!=null?o.off:rand(0,TAU); for(let i=0;i<n;i++) shoot(e.x,e.y,off+i/n*TAU,spd,r,dmg,kind,'enemy',{life:o.life}); }
  else if(mode==='lob'){ const sc=o.scatter!=null?o.scatter:90; for(let i=0;i<n;i++){ const [tx,ty]=clampMap(p.x+(i?rand(-sc,sc):0),p.y+(i?rand(-sc,sc):0),30,p.y); blast(tx,ty,o.blastR||46,(o.delay||0.9)*foeDiff().tele+i*0.13,dmg,{lob:true,fx:e.x,fy:e.y,toxic:!!o.toxic,pool:!!o.pool}); } }
  else { const sp=o.spread!=null?o.spread:(mode==='spread'?0.3:0.2); for(let i=0;i<n;i++) shoot(mx,my,a+(i-(n-1)/2)*sp,spd,r,dmg,kind,'enemy',{homing:o.homing||0,life:o.life}); }
  if(o.back) for(let i=k0;i<G.projectiles.length;i++) G.projectiles[i].rf=e.id;   // these can be sent back at their owner (onReflect)
  SFX.play(o.sfx||'cast'); if(o.onFire) o.onFire(e);
}
// ground shockwaves to jump (stompW)
FM.stomp={
  start(e,m){ const o=m.o; e.state=o.st||'stompW'; e.st=fkW(o,0.7); e.tele=newTele({shape:'circle',r:o.teleR||e.r+30,dur:e.st,col:o.col||'255,170,60'}); },
  tick(e,dt,d,a,m){ const o=m.o; e.st-=dt; if(e.st>0) return false; e.tele=null; shake(7); SFX.play('boom');
    for(let i=0;i<(o.rings||1);i++) G.rings.push({x:e.x,y:e.y,rad:e.r,max:o.max||420,speed:o.speed||280,thick:o.thick||16,dmg:fkDmg(e,o),delay:i*(o.gap||0.45)});
    emit(e.x,e.y,18,{col:'150,130,110',glow:false,smin:60,smax:220,lmin:.3,lmax:.7,zmin:3,zmax:6,grow:6}); return true; } };
// breath cone, fire or frost (breathW, breath)
FM.breath={
  start(e,m){ const o=m.o; e.state=o.st||'breathW'; e.st=fkW(o,0.75); e.tele=newTele({shape:'cone',len:o.len||260,half:o.half||0.42,dur:e.st,col:o.col||(o.frost?'160,210,255':null)}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st>0) return false; m.go=true; m.tk=0; e.tele=null; e.state=o.st2||'breath'; e.st=o.dur||1.0; return false; }
    e.face=turnTo(e.face,a,(o.sweep||0.9)*dt); const L=o.len||260, mx=e.x+Math.cos(e.face)*(e.r+6), my=e.y+Math.sin(e.face)*(e.r+6);
    emit(mx,my,3,o.frost?{col:'200,230,255',ang:e.face,spread:0.32,smin:L*1.4,smax:L*1.75,lmin:.4,lmax:.55,zmin:4,zmax:7,grow:18,drag:1}:{kind:'fire',ang:e.face,spread:0.3,smin:L*1.6,smax:L*1.9,lmin:.45,lmax:.6,zmin:5,zmax:8,grow:22,drag:0.9});
    m.tk-=dt; if(m.tk<=0){ m.tk=0.12; if(inCone(mx,my,e.face,L,o.half||0.42,p.x,p.y,p.r)){ hurtPlayer(fkDmg(e,o),mx,my,90); if(o.slow) p.slowT=Math.max(p.slowT||0,o.slow); } }
    if(o.onTick) o.onTick(e,mx,my,dt);
    e.st-=dt; return e.st<=0; } };
// call helpers through spawn runes (summon). cap: at most this many of the type alive
FM.summon={
  start(e,m){ const o=m.o; e.state=o.st||'summon'; e.st=fkW(o,0.8); e.tele=newTele({shape:'circle',r:o.teleR||44,dur:e.st,col:o.col||'190,110,255'}); },
  tick(e,dt,d,a,m){ const o=m.o; e.st-=dt; if(e.st>0) return false; e.tele=null; const n=o.n||2, lv=fkLevel(e,o);
    for(let i=0;i<n;i++){ const s=spotNear(e.x,e.y,o.r0||80,o.r1||170); spawnRune(o.type,s.x,s.y,Object.assign({level:lv,aggro:true},o.opt||{}),o.delay); }
    if(o.say) taunt(o.say[0],o.say[1]); SFX.play('cast'); return true; } };
// fade out, appear near Ash (blinkOut, blinkIn); invulnerable while gone
FM.blink={
  start(e,m){ e.state='blinkOut'; e.st=0.35; e.invuln=true; e.tele=null; },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(e.state==='blinkOut'){ e.st-=dt; e.alpha=Math.max(0,e.st/0.35); if(e.st<=0){ puff(e.x,e.y); const s=spotNear(p.x,p.y,o.near||220,o.far||330); e.x=s.x; e.y=s.y; puff(e.x,e.y); e.state='blinkIn'; e.st=0.35; } return false; }
    e.st-=dt; e.alpha=1-Math.max(0,e.st/0.35); if(e.st>0) return false; e.alpha=1; e.invuln=false; return true; } };
// dig under, chase Ash unseen, pop up with a circle telegraph (diveDown, under, emergeW)
FM.burrow={
  start(e,m){ e.state='diveDown'; e.st=0.5; e.invuln=true; e.sub=true; e.tele=null; SFX.play('roll'); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(e.state==='diveDown'){ e.st-=dt; e.alpha=Math.max(0.12,e.st/0.5); if(e.st<=0){ e.state='under'; e.st=o.under||1.5; } return false; }
    if(e.state==='under'){ steer(e,p.x,p.y,e.speed*(o.fast||1.7)*foeDiff().spd); e.alpha=0.12; e.st-=dt; if(Math.random()<dt*12) G.ripples.push({x:e.x+rand(-10,10),y:e.y+rand(-10,10),t:0,max:0.8,r:rand(8,16)});
      if(e.st<=0){ e.state='emergeW'; e.st=fkW(o,0.7); m.R=o.r||e.r+50; e.tele=newTele({shape:'circle',r:m.R,dur:e.st,col:o.col||'140,220,90'}); } return false; }
    e.st-=dt; if(e.st>0) return false;
    e.tele=null; e.alpha=1; e.invuln=false; e.sub=false; shake(8); SFX.play('boom');
    if(dist(e.x,e.y,p.x,p.y)<m.R+p.r*0.6&&!airborne()) hurtPlayer(fkDmg(e,o),e.x,e.y,360);
    emit(e.x,e.y,22,{col:o.dirt||'120,100,70',glow:false,smin:60,smax:220,lmin:.3,lmax:.7,zmin:3,zmax:6,grow:5});
    if(o.ring!==false) G.rings.push({x:e.x,y:e.y,rad:e.r,max:200,speed:480,thick:16,dmg:0,kb:260});
    return true; } };
// presets merged into a move spec (k picks the code, the rest are tuning knobs)
const FM_DEF={
  charge:{st:'chargeAim',st2:'charge',len:460,windup:0.8,time:0.75,spd:560,wallStun:1.6,kb:400,dmg:1.2,recover:0.7,track:3},
  swoop:{st:'aim',st2:'swoop',len:220,windup:0.3,time:0.34,spd:430,kb:120,recover:0.3,track:8},
  pinch:{st:'snapW',st2:'strike',snap:true,after:'open',recover:0.9,half:0.9,lunge:60},
  lob:{mode:'lob',st:'bombs',windup:0.5,n:3},
  ring:{mode:'ring',st:'ring',n:12,spd:190,windup:0.8,tele:{shape:'circle',r:56,col:'190,110,255'}},
  blink:{recover:0.1}
};
const FM_IMPL={charge:'lunge',swoop:'lunge',pinch:'slash',lob:'shoot',ring:'shoot'};
let FK_ID=0;
function fkSpec(m){
  if(!m) return null; if(typeof m==='string') m={k:m};
  const s=Object.assign({},FM_DEF[m.k]||{},m); s.impl=FM[FM_IMPL[s.k]||s.k];
  if(!s.impl) throw new Error('unknown foe move '+s.k);
  s.id=s.id||(s.k+'#'+(++FK_ID)); return s;
}
function fkRange(e,m){ if(m.max!=null) return m.max; if(m.k==='slash'||m.k==='pinch') return (m.reach||e.r+32)+player.r-6; return 1e9; }
function fkPick(e,list,d,a){
  let tot=0; FKC.length=0;
  for(const m of list){
    if(m.min!=null&&d<m.min) continue; if(d>fkRange(e,m)) continue;
    if(m.ph!=null&&(e.bph||0)<m.ph) continue;
    if(m.every&&e.mcd&&e.mcd[m.id]>G.time) continue;
    if(m.cap!=null&&m.type&&countType(m.type)>=m.cap) continue;
    if(m.if&&!m.if(e,d,a)) continue;
    const w=typeof m.w==='function'?m.w(e,d,a):(m.w!=null?m.w:1); if(!(w>0)) continue;
    FKC.push(m,w); tot+=w;
  }
  if(!tot) return null; let r=Math.random()*tot;
  for(let i=0;i<FKC.length;i+=2){ r-=FKC[i+1]; if(r<=0) return FKC[i]; }
  return FKC[FKC.length-2];
}
function fkCd(o){ const c=o.cd||[0.6,1.3]; return rand(c[0],c[1]); }
function fkAbort(e){ e.mv=null; e.tele=null; if(e.alpha<1&&!e.hidden) e.alpha=1; if(e.invuln&&!(e.phaseT>0)) e.invuln=false; e.sub=false; }
// how a foe moves while it is not attacking. modes: approach, orbit, kite, strafe, hover, swarm, hold
function fkMove(e,dt,d,a,o,mul){
  const p=player, D=foeDiff(), k=(o.speed||1)*D.spd*(mul==null?1:mul), sp=e.speed*k;
  switch(o.move||'approach'){
    case 'approach': if(d>(o.stop!=null?o.stop:e.r+p.r+8)) steer(e,p.x,p.y,sp); break;
    case 'orbit': { const R=o.orbit||140; if(d>R+70) steer(e,p.x,p.y,sp); else { e.orbit+=dt*(o.spin||1.2)*e.orbitDir; steer(e,p.x+Math.cos(e.orbit)*R,p.y+Math.sin(e.orbit)*R,sp*0.8); } break; }
    case 'kite': kite(e,p,d,a,o.near||190,o.far||320,k); break;
    case 'strafe': { const sa=a+e.strafe*(o.slant||0.8); if(d>(o.stop||e.r+p.r+14)) steer(e,e.x+Math.cos(sa)*60,e.y+Math.sin(sa)*60,sp); if(Math.random()<dt*0.5) e.strafe*=-1; break; }
    case 'hover': { e.orbit+=dt*(o.spin||2.2)*e.orbitDir; const R=(o.orbit||110)+Math.sin(e.t*3)*(o.wobble!=null?o.wobble:34); steer(e,p.x+Math.cos(e.orbit)*R,p.y+Math.sin(e.orbit)*R,sp); break; }
    case 'swarm': { e.orbit+=dt*(o.spin||2.6)*e.orbitDir; const R=(o.orbit||70)+Math.sin(e.t*5+e.id)*30; steer(e,p.x+Math.cos(e.orbit)*R+Math.sin(e.t*7+e.id)*20,p.y+Math.sin(e.orbit)*R+Math.cos(e.t*6+e.id)*16,sp); break; }
    default: break;
  }
  const turn=(o.turn||8)*dt;
  if(o.faceMove&&Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),turn); else e.face=turnTo(e.face,a,turn);
}
const FK={};
// the brain: o = {move, stop, orbit, spin, near, far, turn, faceMove, speed, cd:[min,max], guard, touch, moves:[...], pre(e,dt,d,a), post(e,dt,d,a)}
FK.brain=function(o){
  o=Object.assign({},o); const moves=(o.moves||[]).filter(Boolean).map(fkSpec); o.moves=moves;
  const ai=function(e,dt,p){
    p=p||player; const D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
    e.cd-=dt*D.cdK; e.dx=e.dy=0; if(e.snap>0) e.snap-=dt;
    if(o.touch){ e.touchCd=(e.touchCd||0)-dt; if(e.touchCd<=0&&d<e.r+p.r&&!e.sub){ if(hurtPlayer(e.dmg*(o.touchDmg||1),e.x,e.y,140)) e.touchCd=0.8; } }
    if(o.pre&&o.pre(e,dt,d,a)) return;
    let m=e.mv;
    if(m&&e.state!==m.s){ fkAbort(e); m=null; }
    if(o.guard) e.blocking=e.stun<=0&&(e.state==='chase'||(!!m&&m.o.guard!==false&&e.state===m.ws));   // m.ws: the move's wind-up state
    if(m){ m.t+=dt; if(m.o.impl.tick(e,dt,d,a,m)){ e.mv=null; e.tele=null; e.state=m.o.after||'recover'; e.st=m.o.recover!=null?m.o.recover:0.5; } else if(e.mv) m.s=e.state; return; }
    if(e.state!=='chase'){ fkMove(e,dt,d,a,o,o.recoverMove!=null?o.recoverMove:0.35); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=fkCd(o); } return; }
    fkMove(e,dt,d,a,o,1);
    if(e.cd<=0){ const s=fkPick(e,moves,d,a); if(s){ e.mv={o:s,t:0,s:''}; if(s.every) (e.mcd||(e.mcd={}))[s.id]=G.time+s.every; s.impl.start(e,e.mv,d,a); e.mv.s=e.mv.ws=e.state; } else e.cd=0.25; }
    if(o.post) o.post(e,dt,d,a);
  };
  ai.brain=o; return ai;
};
const fkO=(o,base,moves)=>Object.assign(base,o,{moves:moves.concat(o.moves||[])});
// presets: each returns an ai(e,dt,p) for defineFoe. Every option is optional (FOES.md lists them).
FK.chaser=(o={})=>FK.brain(fkO(o,{move:'approach',turn:8,cd:[0.3,0.8]},[Object.assign({k:'slash',reach:o.reach,windup:o.windup,dmg:o.dmg,lunge:o.lunge,kb:o.kb,half:o.half},o.slash||{})]));
FK.lunger=(o={})=>FK.brain(fkO(o,{move:'orbit',orbit:125,spin:1.4,faceMove:true,turn:7,cd:[1.1,2.2],recoverMove:0.45},[{k:'lunge',max:o.reach||210,len:o.len||160,spd:o.spd||500,time:o.time,windup:o.windup,dmg:o.dmg}]));
FK.charger=(o={})=>FK.brain(fkO(o,{move:'approach',stop:70,turn:2.2,cd:[0.7,1.4]},[{k:'charge',min:110,max:o.range||520,len:o.len,spd:o.spd,time:o.time,windup:o.windup,wallStun:o.stun!=null?o.stun:1.6,dmg:o.dmg,chain:o.chain,trail:o.trail,w:2},o.melee===false?null:{k:'slash',reach:o.reach,half:1.0,windup:0.5,lunge:120,dmg:o.dmg}]));
FK.shooter=(o={})=>{ const keep=o.keep===false?null:(o.keep||[190,320]); return FK.brain(fkO(o,{move:keep?'kite':'hold',near:keep?keep[0]:0,far:keep?keep[1]:0,turn:6,cd:[1.9,2.8]},
  [{k:o.mode==='lob'?'lob':o.mode==='ring'?'ring':'shoot',mode:o.mode||'aimed',max:o.range||560,n:o.n,spread:o.spread,spd:o.spd,kind:o.kind,r:o.r,windup:o.windup,homing:o.homing,dmg:o.dmg,blastR:o.blastR,toxic:o.toxic,pool:o.pool,volleys:o.volleys,back:o.back}])); };
FK.kiter=(o={})=>FK.shooter(Object.assign({keep:[190,320]},o));
FK.guard=(o={})=>FK.brain(fkO(o,{move:'approach',stop:o.stop,guard:true,turn:o.turn||2,cd:[0.9,1.5]},[{k:'slash',reach:o.reach,half:o.half||0.95,windup:o.windup||0.7,track:1.2,lunge:o.lunge!=null?o.lunge:60,kb:o.kb||320,dmg:o.dmg,recover:o.recover||0.9,sfx:'hit'}]));
FK.burrower=(o={})=>FK.brain(fkO(o,{move:'approach',cd:[0.8,1.6]},[{k:'burrow',min:110,under:o.under,r:o.emergeR,dmg:o.dmg||1.4,w:2},{k:'slash',dmg:o.dmg},o.spit?{k:'lob',st:'spitW',toxic:true,pool:true,n:2,min:140,max:420}:null]));
FK.flyer=(o={})=>FK.brain(fkO(o,{move:'hover',orbit:o.orbit||110,faceMove:true,turn:8,cd:[1,2.2]},[{k:'swoop',max:o.reach||260,spd:o.spd,time:o.time,windup:o.windup,dmg:o.dmg}]));
FK.summoner=(o={})=>FK.brain(fkO(o,{move:'kite',near:220,far:340,cd:[1.4,2.4]},[{k:'summon',type:o.type||'kobold',n:o.n||2,cap:o.cap||4,every:o.every||10,level:o.level,w:3},o.shoot===false?null:Object.assign({k:'shoot',max:520},o.shoot||{})]));
FK.bomber=(o={})=>FK.brain(fkO(o,{move:'kite',near:200,far:360,cd:[1.6,2.6]},[{k:'lob',n:o.n||3,scatter:o.scatter,blastR:o.r||46,delay:o.delay,toxic:o.toxic,pool:o.pool,max:o.range||480,dmg:o.dmg}]));
FK.blinker=(o={})=>FK.brain(fkO(o,{move:'kite',near:200,far:320,cd:[0.9,1.6]},[{k:'blink',every:o.every||5,near:o.near,far:o.far,w:2},Object.assign({k:'shoot',max:520,n:3,mode:'spread'},o.shoot||{})]));
FK.turret=(o={})=>FK.brain(fkO(o,{move:'hold',turn:o.turn||2.4,cd:[o.rate||1.6,(o.rate||1.6)*1.3]},[{k:'shoot',mode:o.mode||'aimed',n:o.n||1,spread:o.spread,max:o.range||520,windup:o.windup||0.6,spd:o.spd||300,kind:o.kind||'bolt',r:o.r||7,dmg:o.dmg,track:o.track!=null?o.track:1.2,turret:true,back:o.back,
  tele:o.tele===false?null:{shape:'line',len:Math.min(o.range||520,260),w:10,col:o.col||'255,200,80'},if:(e,d,a)=>Math.abs(angDiff(e.face,a))<(o.arc||0.5)}]));
FK.swarm=(o={})=>FK.brain(fkO(o,{move:'swarm',orbit:o.orbit||70,faceMove:true,turn:9,cd:[0.8,1.8],touch:o.touch!==false},[{k:'swoop',max:180,len:120,windup:0.18,time:0.22,spd:o.spd||380,dmg:o.dmg||1}]));
// swimmer: stays under the water, rises to spit (states chase, rise, spit, up, dive like the Mirrow eels)
const FKT={};
function fkWet(x,y){ if(AREA&&AREA.tri&&typeof tWet==='function') return tWet(tCell(x,y)); if(AREA) return false; const s=T(x,y,FKT); return s.water>0&&!s.bridge; }
FK.swimmer=(o={})=>{ const spec=fkSpec(Object.assign({k:'shoot',mode:o.mode||'aimed',kind:o.kind||'ice',n:o.n||1,spd:o.spd||270,dmg:o.dmg},o.shoot||{}));
  return function(e,dt,p){ p=p||player; const D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.cd-=dt*D.cdK; e.dx=e.dy=0;
    switch(e.state){
      case 'rise': e.st-=dt; if(e.st<=0){ e.tele=null; e.sub=false; e.invuln=false; e.alpha=1; e.state='spit'; e.st=0.35; SFX.play('pop'); G.ripples.push({x:e.x,y:e.y,t:0,max:0.9,r:20,splash:true}); } break;
      case 'spit': e.face=turnTo(e.face,a,8*dt); e.st-=dt; if(e.st<=0){ fkFire(e,spec,d,a); e.state='up'; e.st=o.up||1.2; } break;
      case 'up': e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(d<e.r+p.r+4){ if(hurtPlayer(e.dmg,e.x,e.y,160)) e.st=Math.min(e.st,0.3); } if(e.st<=0){ e.state='dive'; e.st=0.3; } break;
      case 'dive': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(1.6,2.8); G.ripples.push({x:e.x,y:e.y,t:0,max:0.8,r:16}); } break;
      default: { e.state='chase'; e.sub=true; e.invuln=true; e.alpha=0.15;
        e.orbit+=dt*(o.spin||1.1)*e.orbitDir; const R=o.orbit||150; steer(e,p.x+Math.cos(e.orbit)*R,p.y+Math.sin(e.orbit)*R,e.speed*D.spd*(d>260?1:0.6));
        if(!fkWet(e.x+e.dx*0.15,e.y+e.dy*0.15)){ e.orbitDir*=-1; e.dx*=-0.5; e.dy*=-0.5; }
        if(Math.random()<dt*5) G.ripples.push({x:e.x+rand(-6,6),y:e.y+rand(-6,6),t:0,max:0.7,r:rand(8,14)});
        if(e.cd<=0&&d<(o.range||440)&&fkWet(e.x,e.y)){ e.state='rise'; e.st=fkW(o,0.55); e.tele=newTele({shape:'circle',r:e.r+12,dur:e.st,col:'120,200,255'}); } }
    } }; };
// ambusher: hidden and still (e.hidden, e.sleep) until Ash comes within wake px, then it pops up and uses o.then
function fkWake(e){ e.sleep=false; e.hidden=false; e.returning=false; e.aggro=true; e.alpha=1; alertCamp(e); e.state='pop'; e.st=0.45; e.tele=null; SFX.play('pop'); shake(3);
  emit(e.x,e.y,14,{col:'150,130,100',glow:false,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4}); ftext(e.x,e.y-e.r-12,'!','#ffe066',18); }
FK.ambusher=(o={})=>{ const then=o.then||FK.chaser(), wake=o.wake||110;
  const ai=function(e,dt,p){ if(e.sleep) fkWake(e); if(e.state==='pop'){ e.dx=e.dy=0; e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=0.15; } return; } then(e,dt,p); };
  ai.init=e=>{ e.sleep=true; e.hidden=true; e.returning=true; e.aggro=false; };
  ai.idle=(e,dt)=>{ e.tele=null; e.dx=e.dy=0;
    if(e.sleep){ e.returning=true; e.aggro=false; if(!player.dead&&dist(e.x,e.y,player.x,player.y)<wake) fkWake(e); return; }
    steer(e,e.homeX,e.homeY,e.speed*0.8); if(dist(e.x,e.y,e.homeX,e.homeY)<30){ e.sleep=true; e.hidden=true; e.hp=e.maxHp; e.returning=true; } };
  return ai; };

// ================= arenas: walls that rise around a boss fight and sink after it
// def: {shape:'ring'|'ellipse'|'rect', r | rx,ry | w,h, dx,dy (centre offset), style, tint, glow:'r,g,b', gaps:[angle|{a,w}],
//       seg (spacing, 34), cr (collider radius, 18), props:[{k:'mesa',dx,dy,r}], skipBlocked (default true)}
// Ash is held inside while it is up (also in the air), and so is every foe that is inside it. Gaps leave segments out,
// so only put them where something else closes the ring (a cliff, deep water, the Obsidian Wall).
const ARENAS=[];
function arenaBuild(def,cx,cy){
  const A={def,cx,cy,shape:def.shape||'ring',style:def.style||'stone',tint:def.tint||null,segs:[],cols:[],props:[],items:[],on:false,t:0,rise:0};
  A.r=def.r||380; A.rx=def.rx||A.r; A.ry=def.ry||A.r; A.w=def.w||A.r*2; A.h=def.h||A.r*2;
  const sp=def.seg||34, pts=[];
  if(A.shape==='rect'){
    const x0=cx-A.w/2, x1=cx+A.w/2, y0=cy-A.h/2, y1=cy+A.h/2;
    const edge=(ax,ay,bx,by)=>{ const n=Math.max(1,Math.round(dist(ax,ay,bx,by)/sp)); for(let i=0;i<n;i++) pts.push([lerp(ax,bx,i/n),lerp(ay,by,i/n)]); };
    edge(x0,y0,x1,y0); edge(x1,y0,x1,y1); edge(x1,y1,x0,y1); edge(x0,y1,x0,y0);
  }else{
    const per=Math.PI*(3*(A.rx+A.ry)-Math.sqrt((3*A.rx+A.ry)*(A.rx+3*A.ry))), n=Math.max(12,Math.round(per/sp));
    for(let i=0;i<n;i++){ const a=i/n*TAU; pts.push([cx+Math.cos(a)*A.rx,cy+Math.sin(a)*A.ry]); }
  }
  const gaps=(def.gaps||[]).map(g=>typeof g==='number'?{a:g,w:0.45}:g);
  let vi=0;
  for(const [x,y] of pts){
    const a=angTo(cx,cy,x,y);
    if(gaps.some(g=>Math.abs(angDiff(a,g.a))<g.w/2)) continue;
    if(def.skipBlocked!==false&&blockedAt(x,y)) continue;
    const s={x,y,a,v:(vi++)%3,h:0,dl:0};
    A.segs.push(s); A.cols.push(addCol({t:'c',x,y,r:def.cr||18,off:true,arena:true}));
    A.items.push({x,y,flying:true,draw:()=>arenaDrawSeg(A,s)});
  }
  for(const q of def.props||[]){
    const pr=Object.assign({h:0},q,{x:cx+(q.dx||0),y:cy+(q.dy||0)}); A.props.push(pr);
    if(q.r) pr.col=addCol({t:'c',x:pr.x,y:pr.y,r:q.r,off:true,noProj:q.noProj!==false,arena:true});
    A.items.push({x:pr.x,y:pr.y,flying:true,draw:()=>arenaDrawProp(A,pr)});
  }
  ARENAS.push(A); return A;
}
function arenaRise(A,fromA){
  A.on=true; A.t=0; for(const c of A.cols) c.off=false; for(const pr of A.props) if(pr.col) pr.col.off=false;
  for(const s of A.segs) s.dl=fromA==null?Math.random()*0.3:Math.abs(angDiff(s.a,fromA))/Math.PI*0.6;
  shake(8); SFX.play('boom'); SFX.play('warn');
}
function arenaSink(A,now){ A.on=false; A.t=0; for(const c of A.cols) c.off=true; for(const pr of A.props) if(pr.col) pr.col.off=true; if(now){ for(const s of A.segs) s.h=0; for(const pr of A.props) pr.h=0; } }
function arenaTick(A,dt){
  A.t+=dt; let any=false;
  for(const s of A.segs){ const tg=A.on&&A.t>=s.dl?1:0; if(s.h!==tg){ s.h=tg>s.h?Math.min(1,s.h+dt*2.4):Math.max(0,s.h-dt*1.6); any=true; if(tg>0&&s.h<0.9&&Math.random()<dt*7&&inView(s.x,s.y,40)) emit(s.x+rand(-14,14),s.y+4,1,{col:'130,115,95',glow:false,ang:-Math.PI/2,spread:1.3,smin:20,smax:70,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:6,drag:2}); } }
  for(const pr of A.props){ const tg=A.on?1:0; if(pr.h!==tg){ pr.h=tg>pr.h?Math.min(1,pr.h+dt*1.4):Math.max(0,pr.h-dt*1.2); any=true; } }
  A.rise=any?0.5:(A.on?1:0);
}
function arenaIn(A,x,y,m){
  m=m||0;
  if(A.shape==='rect') return x>A.cx-A.w/2+m&&x<A.cx+A.w/2-m&&y>A.cy-A.h/2+m&&y<A.cy+A.h/2-m;
  const rx=A.rx-m, ry=A.ry-m; if(rx<=0||ry<=0) return false; const dx=(x-A.cx)/rx, dy=(y-A.cy)/ry; return dx*dx+dy*dy<=1;
}
// pushes e back inside (margin m from the wall line); true when it had to
function arenaHold(A,e,m){
  if(A.shape==='rect'){ const x0=A.cx-A.w/2+m, x1=A.cx+A.w/2-m, y0=A.cy-A.h/2+m, y1=A.cy+A.h/2-m; let h=false;
    if(e.x<x0){ e.x=x0; h=true; } if(e.x>x1){ e.x=x1; h=true; } if(e.y<y0){ e.y=y0; h=true; } if(e.y>y1){ e.y=y1; h=true; } return h; }
  const rx=Math.max(10,A.rx-m), ry=Math.max(10,A.ry-m), dx=(e.x-A.cx)/rx, dy=(e.y-A.cy)/ry, q=dx*dx+dy*dy; if(q<=1) return false;
  const k=1/Math.sqrt(q); e.x=A.cx+dx*k*rx; e.y=A.cy+dy*k*ry; return true;
}
function arenaR(A){ return A.shape==='rect'?Math.min(A.w,A.h)/2:Math.min(A.rx,A.ry); }
// ---------- wall art: one cached sprite per style, tint and variant (48 x 60, the foot of the wall at y 54)
const ASPR=new Map();
const ARENA_STY={
  stone(g,rng,v,tint){ const base=tint||'#8e8a84', out='#2a2420', w=30+rng()*6, h=36+rng()*8, x=24-w/2, y=54-h;
    g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(24,55,w*0.62,4.5,0,0,TAU); g.fill();
    rrect(g,x,y,w,h,8); g.fillStyle=base; g.fill();
    g.save(); rrect(g,x,y,w,h,8); g.clip();
    g.fillStyle=shd(base,-0.42); g.globalAlpha=0.6; g.fillRect(x+w*0.64,y,w,h); g.fillStyle=shd(base,0.3); g.globalAlpha=0.55; g.fillRect(x,y,w*0.28,h*0.6);
    g.globalAlpha=1; g.fillStyle=shd(base,0.16); g.fillRect(x,y,w,7); g.fillStyle=shd(base,-0.25); g.fillRect(x,y+h-6,w,6);
    g.strokeStyle=shd(base,-0.6); g.lineWidth=0.9; for(let i=0;i<2;i++){ let cx2=x+4+rng()*(w-8), cy2=y+9+rng()*8; g.beginPath(); g.moveTo(cx2,cy2); for(let j=0;j<3;j++){ cx2+=rng()*6-3; cy2+=4+rng()*6; g.lineTo(cx2,cy2); } g.stroke(); }
    if(v===1){ g.fillStyle='#5f7f3a'; for(let i=0;i<5;i++){ g.beginPath(); g.ellipse(x+3+rng()*(w-6),y+2+rng()*5,3+rng()*3,2+rng()*1.5,0,0,TAU); g.fill(); } }
    if(v===2){ g.strokeStyle=shd(base,-0.5); g.lineWidth=1.2; g.beginPath(); g.moveTo(x,y+h*0.55); g.lineTo(x+w,y+h*0.5); g.stroke(); }
    g.restore(); rrect(g,x,y,w,h,8); g.lineWidth=1.7; g.strokeStyle=out; g.stroke(); },
  thorn(g,rng,v){ const out='#1a0e06', vines=['#6a4426','#4e321c','#7a5230'];
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(24,55,21,5,0,0,TAU); g.fill();
    // a dark tangled mass first, then vines over it
    g.fillStyle='#2e1c10'; g.beginPath(); for(let i=0;i<7;i++){ const x=6+i*6+rng()*3, y=47-rng()*14-(i>1&&i<5?6:0), r=7+rng()*5; g.moveTo(x+r,y); g.arc(x,y,r,0,TAU); } g.fill();
    g.fillStyle='#3e5a24'; for(let i=0;i<5;i++){ g.beginPath(); g.ellipse(6+rng()*36,30+rng()*20,4+rng()*3,2.4,rng()*3,0,TAU); g.fill(); }
    g.lineCap='round'; const tips=[];
    for(let i=0;i<8;i++){ const x0=6+rng()*36, h=22+rng()*26, bend=(rng()-0.5)*30, tx=x0+bend*0.5+(rng()-0.5)*8, ty=55-h;
      const path=()=>{ g.beginPath(); g.moveTo(x0,55); g.quadraticCurveTo(x0+bend,55-h*0.6,tx,ty); };
      path(); g.strokeStyle=out; g.lineWidth=7; g.stroke(); path(); g.strokeStyle=vines[i%3]; g.lineWidth=4.4; g.stroke();
      g.strokeStyle=out; g.lineWidth=2.2; g.beginPath(); g.arc(tx+2*Math.sign(bend||1),ty+1,2.4,Math.PI,TAU*0.9); g.stroke();
      for(let j=1;j<4;j++){ const u=j/4, qx=(1-u)*(1-u)*x0+2*(1-u)*u*(x0+bend)+u*u*tx, qy=(1-u)*(1-u)*55+2*(1-u)*u*(55-h*0.6)+u*u*ty, s=j%2?1:-1;
        g.fillStyle='#f0e2c4'; g.strokeStyle=out; g.lineWidth=0.7; g.beginPath(); g.moveTo(qx-1.8,qy); g.lineTo(qx+s*5.5,qy-2.4); g.lineTo(qx+1.8,qy-1.2); g.closePath(); g.fill(); g.stroke(); }
      tips.push([tx,ty]); }
    for(let i=0;i<4;i++){ const [lx,ly]=tips[i]; g.fillStyle='#5a8a32'; g.strokeStyle='#1e3010'; g.lineWidth=0.8; g.beginPath(); g.ellipse(lx+3,ly+4,4.5,2.4,0.6,0,TAU); g.fill(); g.stroke(); }
    if(v!==1) for(let i=4;i<(v===2?7:5);i++){ const [bx,by]=tips[i]; g.fillStyle='#d8344a'; g.strokeStyle='#5a0a14'; g.lineWidth=0.7; g.beginPath(); g.arc(bx,by+3,2.4,0,TAU); g.fill(); g.stroke(); g.fillStyle='#ffd0d8'; g.beginPath(); g.arc(bx-0.8,by+2.2,0.7,0,TAU); g.fill(); } },
  ice(g,rng,v){ const out='#356f98', fill='#bfe8f8', lit='#f0fcff';
    g.fillStyle='rgba(30,60,90,.25)'; g.beginPath(); g.ellipse(24,55,19,4.5,0,0,TAU); g.fill();
    g.fillStyle='#eef7fb'; g.beginPath(); g.ellipse(24,53,19,5,0,0,TAU); g.fill();
    const sh=[[24,12,44+rng()*8],[12,9,24+rng()*8],[36,10,28+rng()*8]];
    if(v===1) sh.push([30,6,16]);
    for(const [x,w,h] of sh){ const pts=[[x-w/2,54],[x+w/2,54],[x+w*0.32,54-h*0.72],[x+rng()*2-1,54-h],[x-w*0.36,54-h*0.66]];
      g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(const q of pts) g.lineTo(q[0],q[1]); g.closePath(); g.fillStyle=fill; g.fill(); g.lineWidth=1.4; g.strokeStyle=out; g.stroke();
      g.beginPath(); g.moveTo(x-w/2+1,53); g.lineTo(pts[4][0]+1,pts[4][1]+1); g.lineTo(pts[3][0],pts[3][1]+2); g.lineTo(x,53); g.closePath(); g.fillStyle=lit; g.globalAlpha=0.7; g.fill(); g.globalAlpha=1;
      g.strokeStyle='#ffffff'; g.lineWidth=0.9; g.beginPath(); g.moveTo(x-1,54-h*0.85); g.lineTo(x-w*0.18,54-h*0.35); g.stroke(); } },
  iron(g,rng,v){ const out='#121318', bar='#3c3f48', post='#4c505b', lit='#8a909e';
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(24,55,16,4,0,0,TAU); g.fill();
    for(const y of [24,42]){ g.fillStyle=bar; g.fillRect(-2,y,52,4); g.strokeStyle=out; g.lineWidth=1.2; g.strokeRect(-2,y,52,4); g.fillStyle=lit; g.globalAlpha=0.5; g.fillRect(-2,y,52,1); g.globalAlpha=1; }
    g.fillStyle=post; g.fillRect(20,14,8,40); g.fillStyle=lit; g.fillRect(20.5,14,2,40); g.strokeStyle=out; g.lineWidth=1.5; g.strokeRect(20,14,8,40);
    g.beginPath(); g.moveTo(18.5,15); g.lineTo(24,2); g.lineTo(29.5,15); g.closePath(); g.fillStyle='#9aa0ae'; g.fill(); g.stroke();
    g.fillStyle='#c8ccd8'; for(const y of [26,44]){ g.beginPath(); g.arc(24,y+2,1.3,0,TAU); g.fill(); }
    if(v===1){ g.strokeStyle='#ff9a4a'; g.lineWidth=1; g.beginPath(); g.moveTo(27,20); g.lineTo(27,30); g.stroke(); } },
  wood(g,rng,v){ const out='#2c180a';
    g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(24,55,18,4.5,0,0,TAU); g.fill();
    for(const dx of [-10,0,10]){ const x=24+dx-5, h=36+rng()*9, top=54-h;
      g.beginPath(); g.moveTo(x,54); g.lineTo(x,top+7); g.lineTo(x+5,top); g.lineTo(x+10,top+7); g.lineTo(x+10,54); g.closePath(); g.fillStyle=dx===0?'#8e5e32':'#7e5028'; g.fill(); g.lineWidth=1.5; g.strokeStyle=out; g.stroke();
      g.beginPath(); g.moveTo(x,top+7); g.lineTo(x+5,top); g.lineTo(x+10,top+7); g.lineTo(x+5,top+5); g.closePath(); g.fillStyle='#d2a874'; g.fill(); g.lineWidth=0.8; g.stroke();
      g.strokeStyle='#4e3014'; g.lineWidth=0.8; for(let i=0;i<3;i++){ const yy=top+12+rng()*(h-16); g.beginPath(); g.moveTo(x+2,yy); g.lineTo(x+4+rng()*3,yy+3); g.stroke(); } }
    g.fillStyle='#c8a060'; g.fillRect(9,39,30,4); g.strokeStyle=out; g.lineWidth=1; g.strokeRect(9,39,30,4);
    if(v===2){ g.fillStyle='#e8e0d0'; g.beginPath(); g.arc(24,30,3.2,0,TAU); g.fill(); g.fillStyle='#2a1a10'; g.fillRect(22.4,29.6,1.2,1.2); g.fillRect(24.6,29.6,1.2,1.2); } },
  obsidian(g,rng,v){ const out='#0c0810', fill='#2c2236', lit='#6a5a8a';
    g.fillStyle='rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(24,55,18,4.5,0,0,TAU); g.fill();
    for(const [x,w,h] of [[24,13,42+rng()*8],[12,9,26],[36,10,30]]){ const pts=[[x-w/2,54],[x+w/2,54],[x+w*0.3,54-h*0.74],[x,54-h],[x-w*0.34,54-h*0.68]];
      g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(const q of pts) g.lineTo(q[0],q[1]); g.closePath(); g.fillStyle=fill; g.fill(); g.lineWidth=1.4; g.strokeStyle=out; g.stroke();
      g.strokeStyle=lit; g.lineWidth=1; g.beginPath(); g.moveTo(x-1,54-h*0.9); g.lineTo(x-w*0.2,54-h*0.3); g.stroke(); g.strokeStyle='#b89ae8'; g.globalAlpha=0.6; g.beginPath(); g.moveTo(x+w*0.2,54-h*0.6); g.lineTo(x+w*0.1,54-h*0.2); g.stroke(); g.globalAlpha=1; } }
};
function arenaSpr(style,tint,v){
  const key=style+'|'+(tint||'')+'|'+v; let c=ASPR.get(key); if(c) return c;
  const S=2; c=mkCanvas(48*S,60*S); const g=c.getContext('2d'); g.scale(S,S);
  (ARENA_STY[style]||ARENA_STY.stone)(g,mulberry32(phash(key)),v,tint);
  ASPR.set(key,c); return c;
}
function arenaDrawSeg(A,s){
  if(s.h<=0.01||!inView(s.x,s.y,60)) return;
  const c=arenaSpr(A.style,A.tint,s.v), f=smooth(s.h), sh=54*f, gy=s.y+6;
  ctx.drawImage(c,0,0,c.width,c.height*(54/60)*f,s.x-24,gy-sh,48,sh);
  if(f<0.98){ ctx.fillStyle=`rgba(90,75,60,${0.35*(1-f)})`; ctx.beginPath(); ctx.ellipse(s.x,gy,20,5,0,0,TAU); ctx.fill(); }
  if(A.def.glow&&f>0.6){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.35+0.25*Math.sin(G.time*3+s.a*3); ctx.drawImage(foGlowSpr(A.def.glow),s.x-10,gy-sh*0.55-10,20,20); ctx.restore(); }
}
// a crag with a nest on top (the Brood Mother's perch)
const MSPR=new Map();
function mesaSpr(r,tint){
  const key=r+'|'+(tint||''); let c=MSPR.get(key); if(c) return c;
  const S=2, w=r*2+24, h=r*1.1+70; c=mkCanvas(Math.ceil(w*S),Math.ceil(h*S)); const g=c.getContext('2d'); g.scale(S,S);
  const cx=w/2, base=tint||'#9a6a52', ry=r*0.55, top=36, out='#2a1810', rng=mulberry32(r*31+7);
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(cx,top+40+ry*0.15,r+8,ry+6,0,0,TAU); g.fill();
  g.fillStyle=shd(base,-0.35); g.beginPath(); g.ellipse(cx,top+40,r,ry,0,0,Math.PI); g.lineTo(cx-r,top); g.ellipse(cx,top,r,ry,0,Math.PI,0,true); g.closePath(); g.fill(); g.lineWidth=2; g.strokeStyle=out; g.stroke();
  g.strokeStyle=shd(base,-0.55); g.lineWidth=1; for(let i=1;i<4;i++){ g.beginPath(); g.ellipse(cx,top+i*10,r,ry,0,0.15,Math.PI-0.15); g.stroke(); }
  g.fillStyle=base; g.beginPath(); g.ellipse(cx,top,r,ry,0,0,TAU); g.fill(); g.stroke();
  g.fillStyle=shd(base,0.18); g.beginPath(); g.ellipse(cx-r*0.2,top-ry*0.2,r*0.6,ry*0.5,0,0,TAU); g.fill();
  // the nest
  g.lineCap='round';
  for(let i=0;i<42;i++){ const a=rng()*TAU, rr=r*0.42+rng()*r*0.16, x=cx+Math.cos(a)*rr, y=top+Math.sin(a)*rr*0.55; g.strokeStyle=i%3?'#6a4626':'#8a6034'; g.lineWidth=2.2; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a+1.6)*10,y+Math.sin(a+1.6)*5); g.stroke(); }
  g.fillStyle='#3a2410'; g.beginPath(); g.ellipse(cx,top,r*0.36,r*0.36*0.55,0,0,TAU); g.fill();
  c.lw=w; c.lh=h; c.top=top; c.cx=cx; MSPR.set(key,c); return c;
}
function arenaDrawProp(A,pr){
  if(pr.h<=0.01||!inView(pr.x,pr.y,(pr.r||40)+80)) return;
  if(pr.k==='mesa'){ const c=mesaSpr(pr.r,pr.tint||A.tint), f=smooth(pr.h), lw=c.lw, lh=c.lh, sx=pr.x-c.cx, dy=pr.y-c.top-40, vis=lh*f;
    ctx.drawImage(c,0,0,c.width,c.height*f,sx,dy+lh-vis,lw,vis);
    if(f>0.95){ // eggs in the nest while the brood mother lives
      const b=G.boss; if(b&&b.type==='broodmother'&&!b.dead&&b.nst!=='perch'){ for(let i=0;i<3;i++){ const a=i*2.1+0.4, x=pr.x+Math.cos(a)*pr.r*0.18, y=pr.y-40+Math.sin(a)*pr.r*0.1; ctx.fillStyle='#f2e8d0'; ctx.strokeStyle='#5a4a30'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(x,y,5,6.5,0,0,TAU); ctx.fill(); ctx.stroke(); } } } return; }
  if(FZP[pr.k]) FZP[pr.k](A,pr);
}
const FZP={};   // more prop kinds: FZP[k]=(A,pr)=>{ draw at pr.x, pr.y with height pr.h (0..1) }

// ================= boss sites
const BOSSES={};
function defineBoss(k,d){
  d=Object.assign({},d); d.k=k; BOSSES[k]=d;
  let poi=typeof d.at==='string'?d.at:k;
  if(d.at&&typeof d.at==='object'){ POI[k]=Object.assign({r:400,level:1,name:(EDEF[d.boss]&&EDEF[d.boss].name)||k},POI[k]||{},d.at); poi=k; }
  if(!POI[poi]) console.warn('defineBoss: no POI',poi);
  d.poi=poi;
  const S0=SITES[k]||{};
  SITES[k]=Object.assign(S0,{poi,boss:d.boss,stage:d.stage!==undefined?d.stage:S0.stage,guards:d.guards||S0.guards||[]});
  if(d.ward) SITES[k].ward=d.ward;
  if(d.open) SITES[k].open=d.open;
  if(d.area||(d.at&&d.at.area)) SITES[k].area=d.area||d.at.area;
  if(!STORY.bosses[d.boss]) STORY.bosses[d.boss]={intro:[],outro:[]};
  if(d.intro) STORY.bosses[d.boss].intro=d.intro;
  if(d.outro) STORY.bosses[d.boss].outro=d.outro;
  return SITES[k];
}
function bossSiteLevel(){ const k=G&&G.fightSite, s=k&&SITES[k], P=s&&POI[s.poi]; return (P&&P.level)||1; }
// the centre and size of the fight the boss is in (story arena, the arena mode ring, or its home)
function bossCtx(e){
  const b=G&&G.bf; if(b&&b.A&&b.A.on) return {cx:b.A.cx,cy:b.A.cy,R:arenaR(b.A),A:b.A};
  if(G&&G.arena) return {cx:G.arena.x,cy:G.arena.y,R:G.arena.r-60,A:null};
  return {cx:e.homeX,cy:e.homeY,R:340,A:null};
}
function bossIn(C,x,y,m){ return C.A?arenaIn(C.A,x,y,m):dist(x,y,C.cx,C.cy)<C.R-m; }
// smarter timing: when the AI comes back to chase, the next attack comes sooner (k<1), and it punishes a potion
function bossCad(e,k){
  if(e._bst!==e.state){ if(e.state==='chase'&&e._bst&&e._bst!=='chase'){ e.cd*=k/foeDiff().cdK; if(player.drinkT>0&&!foeDiff().easy) e.cd=Math.min(e.cd,0.25); } e._bst=e.state; }
}
function bossFightBegin(k){
  const d=BOSSES[k]; if(!d) return;
  const s=SITES[k], P=POI[s.poi], p=player;
  let A=null;
  if(d.arena){
    A=d._A||(d._A=arenaBuild(d.arena,P.x+(d.arena.dx||0),P.y+(d.arena.dy||0)));
    // Ash, his friends and the guards all start inside
    const m=(d.arena.cr||18)+p.r+24;
    if(!arenaIn(A,p.x,p.y,m)){ const a=angTo(A.cx,A.cy,p.x,p.y); p.x=A.cx+Math.cos(a)*(arenaR(A)-m-10); p.y=A.cy+Math.sin(a)*(arenaR(A)-m-10); arenaHold(A,p,m); }
    arenaRise(A,angTo(A.cx,A.cy,p.x,p.y));
    const g=G.siteGuards[k];
    if(g) for(const e of G.enemies){ if(e.dead||e.camp!==g) continue; if(!arenaIn(A,e.x,e.y,e.r+30)){ const a=rand(0,TAU), rr=rand(0.3,0.7)*arenaR(A); e.x=A.cx+Math.cos(a)*rr; e.y=A.cy+Math.sin(a)*rr; arenaHold(A,e,e.r+30); puff(e.x,e.y); } e.inArena=A; }
    if(typeof compsOnMove==='function'&&G.comp) compsOnMove();
    if(G.goat&&G.side&&G.side.duchess==='follow'&&!arenaIn(A,G.goat.x,G.goat.y,30)){ G.goat.x=p.x-30; G.goat.y=p.y+20; }
  }
  G.bf={k,d,A,t:0};
  if(d.onStart) d.onStart();
}
function bossFightEnd(instant){
  const b=G&&G.bf; if(!b) return;
  if(b.A) arenaSink(b.A,instant);
  G.fz=[];
  if(instant&&b.d.onReset) b.d.onReset();
  G.bf=null;
}
// ---------- the stock story flow, with registered bosses
{ const base=startBossFight; startBossFight=function(k){
    const d=BOSSES[k]; if(!d){ base(k); return; }
    const h0=G.hazards.length; base(k);
    const h=G.hazards.slice(h0).find(q=>q.kind==='spawn'&&q.type===d.boss);
    if(h){ if(d.hpScale!=null) h.opt.hpScale=typeof d.hpScale==='function'?d.hpScale():d.hpScale;
      if(d.spawn){ const P=POI[SITES[k].poi], s=typeof d.spawn==='function'?d.spawn(P):{x:P.x+(d.spawn.dx||0),y:P.y+(d.spawn.dy||0)}; h.x=s.x; h.y=s.y; } }
    bossFightBegin(k); }; }
{ const base=resetBoss; resetBoss=function(){ base(); bossFightEnd(true); }; }
{ const base=onBossDefeated; onBossDefeated=function(e){
    base(e);
    for(const z of G.fz||[]) if(FZK[z.k]&&FZK[z.k].out) FZK[z.k].out(z);
    G.fz=[];
    const b=G.bf; if(b&&b.A){ const A=b.A; later(1.4,()=>{ if(!(G.bf&&G.bf.A===A&&G.boss&&!G.boss.dead)) arenaSink(A); }); } }; }
{ const base=storyBossDone; storyBossDone=function(){
    const k=G.fightSite, d=k&&BOSSES[k];
    if(G.bf){ if(G.bf.A) arenaSink(G.bf.A); G.bf=null; G.fz=[]; }
    if(!d||!d.onWin){ base(); return; }
    const site=SITES[k]; G.fightSite=null; G.boss=null; G.bossDone[site.boss]=true; delete G.siteGuards[k];
    runDialogue((STORY.bosses[site.boss]&&STORY.bosses[site.boss].outro)||[],()=>{ scene='play'; if(d.bless!==false) G.pendingBless++; try{ d.onWin(); }catch(err){ console.error(err); } saveGame(); later(1.2,offerPending); }); }; }
{ const base=siteOpen; siteOpen=function(k){ const s=SITES[k]; if(s&&s.open&&!s.open()) return false; return base(k); }; }
{ const base=canFlyHere; canFlyHere=function(){ const b=G&&G.bf; if(b&&b.d.flyOK&&G.mode==='story'&&!AREA&&hasAbil('wings')&&G.boss&&!G.boss.dead) return true; return base(); }; }
{ const base=musicMood; musicMood=function(dt){ const m=base(dt); const b=G&&G.bf; if(m==='boss'&&b&&b.d.music&&MSCORE[b.d.music]) return b.d.music; return m; }; }
// helpers summoned during a registered fight come at the site's level (the stock summons were level 1),
// and they appear inside the walls
{ const base=spawnRune; spawnRune=function(type,x,y,opt,delay){
    opt=opt||{}; const b=G&&G.bf;
    if(b&&G.mode==='story'&&opt.level==null&&EDEF[type]&&!EDEF[type].boss) opt=Object.assign({},opt,{level:bossSiteLevel()});
    if(b&&b.A&&b.A.on&&!opt.free){ const q={x,y}; if(arenaHold(b.A,q,(EDEF[type]?EDEF[type].r:14)+34)){ x=q.x; y=q.y; } }
    return base(type,x,y,opt,delay); }; }
{ const base=spotNear; spotNear=function(x,y,r0,r1,avoid){
    const s=base(x,y,r0,r1,avoid), b=G&&G.bf;
    if(b&&b.A&&b.A.on&&arenaIn(b.A,x,y,0)&&!arenaIn(b.A,s.x,s.y,40)){ arenaHold(b.A,s,46); }
    return s; }; }
{ const base=newRun; newRun=function(mode){ base(mode); for(const A of ARENAS) arenaSink(A,true); }; }
{ const base=doRoar; doRoar=function(free){ base(free); foeRoar(player.x,player.y); }; }
// a boss site inside a cave or dungeon (def.area): the stock trigger only runs outdoors
function areaSites(){
  if(!AREA||G.fightSite||scene!=='play'||player.dead) return;
  for(const k in BOSSES){ const s=SITES[k]; if(!s||s.area!==AREA.id||!siteOpen(k)) continue; const P=POI[s.poi];
    if(dist(player.x,player.y,P.x,P.y)<P.r*0.72){ G.fightSite=k; G.fightIntro=true; runDialogue((STORY.bosses[s.boss]&&STORY.bosses[s.boss].intro)||[],()=>{ scene='play'; G.fightIntro=false; startBossFight(k); }); return; } }
}
// ---------- (v11 polish) boss intro framing: nobody swings while the boss is talking
// The intro opens the moment Ash walks into the site, and foes already on him kept their wind-up (a red wedge behind
// the dialogue box) and struck the instant it closed. Now, when an intro starts (the stock trigger, areaSites above, or
// an act's own), every foe near Ash drops its wind-up, steps back to a respectful distance while the boss talks and
// waits a beat after the talk before its first swing (on top of the dialogue's own grace, a12a_dlg.js).
const INTRO_BACK=190;
function introCalm(){
  const p=player; if(!G||!p) return;
  G._introCalm=G.fightSite||true;
  for(const e of G.enemies){
    if(e.dead||e.boss||dist2(e.x,e.y,p.x,p.y)>520*520) continue;
    if(e.tele||/^(windup|strike|aim|charge|lunge|swoop|crouch|leap|pounce|dive)/.test(e.state||'')){ e.tele=null; e.state='chase'; e.st=0; }
    e.cd=Math.max(e.cd||0,1.1+Math.random()*0.5); e.vx=0; e.vy=0;
    const d=dist(e.x,e.y,p.x,p.y);
    if(d<INTRO_BACK){ const a=d>1?angTo(p.x,p.y,e.x,e.y):Math.random()*TAU; e._introTo={x:p.x+Math.cos(a)*INTRO_BACK,y:p.y+Math.sin(a)*INTRO_BACK}; }
  }
}
// while the intro talk runs (liteUpdate runs, the AI does not): the foes that were too close walk back, facing Ash
function introStep(dt){
  for(const e of G.enemies){
    const T=e._introTo; if(!T) continue; if(e.dead){ e._introTo=null; continue; }
    const d=dist(e.x,e.y,T.x,T.y); if(d<2){ e._introTo=null; continue; }
    const s=Math.min(d,170*dt), a=angTo(e.x,e.y,T.x,T.y), nx=e.x+Math.cos(a)*s, ny=e.y+Math.sin(a)*s;
    if(freeSpot(nx,ny,e.r||12)){ e.x=nx; e.y=ny; e.face=angTo(e.x,e.y,player.x,player.y); } else e._introTo=null;
  }
}
{ const base=updateStory; updateStory=function(dt){ const was=G&&G.fightIntro; base(dt); if(G&&!was&&G.fightIntro) introCalm(); }; }
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt);
    try{ if(G&&G.fightIntro){ if(G._introCalm!==(G.fightSite||true)) introCalm(); introStep(dt); } else if(G&&G._introCalm){ G._introCalm=null; for(const e of G.enemies) e._introTo=null; } }catch(err){ console.error(err); } }; }
{ const base=objectiveList; objectiveList=function(){ const out=base(); for(const o of out){ const s=o.site&&SITES[o.site]; if(s&&s.area&&!(AREA&&AREA.id===s.area)){ const d=DOORS.find(q=>q.area===s.area); if(d){ o.x=d.x; o.y=d.y; } o.area=s.area; } } return out; }; }

// ================= phases
// bossPhase(e,[0.66,0.33]) returns the phase index (0 first). When the health crosses a mark, the boss roars, shows
// the phase banner (FOES[type].phaseText[i-1] = [title, sub, [speaker, line]]), is invulnerable for a moment
// (e.phaseT), and FOES[type].onPhase(e,i) runs (plus the optional hook).
function bossPhase(e,th,hook){
  th=th||e.phases||[0.66,0.33]; e.phases=th; if(e.bph==null) e.bph=0;
  if(e.dead||e.phaseT>0) return e.bph;
  const f=e.hp/e.maxHp; let n=0; for(const t of th) if(f<t) n++;
  if(n>e.bph&&!e.invuln&&!e.noPhase&&!(e.stun>0)){ e.bph++; phaseStart(e,e.bph,hook); }
  return e.bph;
}
function phaseStart(e,i,hook){
  const F=FOES[e.type]||{}, T=F.phaseText&&F.phaseText[i-1];
  e.phaseT=byDiff(1.6,1.3,1.1); e.invuln=true; e.tele=null; e.mv=null; e.state='chase'; e.dx=e.dy=0; e.alpha=1; e.sub=false;
  G.rings.push({x:e.x,y:e.y,rad:e.r,max:300,speed:520,thick:22,dmg:0,kb:380});
  shake(10); SFX.play('roar'); flashA=Math.max(flashA,0.2); flashCol='255,200,120';
  if(T){ setBanner(T[0],T[1]||'',2.6); if(T[2]) taunt(T[2][0],T[2][1]); }
  if(F.onPhase) F.onPhase(e,i);
  if(hook) hook(e,i);
}
function phaseTick(e,dt){
  e.phaseT-=dt; e.dx=e.dy=0; e.tele=null; e.invuln=true;
  if(Math.random()<dt*24) emit(e.x+rand(-e.r,e.r),e.y+rand(-e.r,e.r)*0.6,1,{col:'255,200,120',ang:-Math.PI/2,spread:0.6,smin:30,smax:90,lmin:.4,lmax:.8,zmin:2,zmax:4,rise:30});
  if(e.phaseT<=0){ e.phaseT=0; e.invuln=false; e.state='chase'; e.cd=Math.min(e.cd,0.5); }
}

// ================= fight zones: ground and tall effects owned by a fight (fire rings, muck, frozen ground)
// FZK[k] = {tick(z,dt), drawG(z) ground layer, tall(z,list) items in the y-sorted list, out(z) when the boss falls}
const FZK={};
function fzAdd(k,o){ const z=Object.assign({k,t:0,life:1e9},o); const L=G.fz||(G.fz=[]); L.push(z); return z; }
function fzTick(dt){ const L=G.fz; if(!L||!L.length) return; for(const z of L){ z.t+=dt; const K=FZK[z.k]; if(K&&K.tick) K.tick(z,dt); if(z.t>=z.life) z.done=true; } if(L.some(z=>z.done)) G.fz=L.filter(z=>!z.done); }
// a soft green circle that marks the safe gap in a bomb barrage
FZK.safe={ drawG(z){ const k=clamp(z.t/0.25,0,1)*clamp((z.life-z.t)/0.3,0,1); ctx.save(); ctx.globalAlpha=k; ctx.fillStyle='rgba(120,255,140,.16)'; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,TAU); ctx.fill(); ctx.setLineDash([8,6]); ctx.lineDashOffset=-G.time*30; ctx.strokeStyle='rgba(170,255,180,.75)'; ctx.lineWidth=2.5; ctx.stroke(); ctx.setLineDash([]); ctx.restore(); } };
// Morrow's ring of fire pillars. Standing inside fills Ash's roar; a roar puts the pillars out
FZK.firering={
  tick(z,dt){ const p=player, e=z.owner; z.rotA=(z.rotA||0)+(z.rot||0)*dt; z.up=clamp(z.t/z.rise,0,1);
    if(!e||e.dead){ z.done=true; return; }
    let live=0; for(const q of z.pil) if(!q.out) live++;
    if(!live){ z.done=true; z.snuffed=true; return; }
    if(z.t>=z.life-0.05){ z.done=true; for(const q of z.pil) if(!q.out) fzPuff(fzPil(z,q),'255,150,60'); return; }
    if(z.up<1||p.dead) return;
    const d=dist(p.x,p.y,z.x,z.y);
    if(d<z.R+40){
      if(p.roar<100){ p.roar=Math.min(100,p.roar+z.feed*dt); if(Math.random()<dt*14){ const q=pick(z.pil); if(!q.out){ const P=fzPil(z,q); emit(P.x,P.y-20,1,{kind:'fire',ang:angTo(P.x,P.y,p.x,p.y),spread:0.2,smin:d*0.9,smax:d*1.2,lmin:.6,lmax:.8,zmin:3,zmax:5,grow:-2,drag:0.6}); } } }
      if(!z.saidFeed){ z.saidFeed=true; ftext(p.x,p.y-44,S('The flames fill your ROAR!','The fire fills your ROAR!'),'#ffcf6a',14); }
      if(p.roar>=100&&!z.saidRoar){ z.saidRoar=true; setBanner(S('ROAR now!','ROAR now!'),S('A roar puts the fire pillars out.','Roar to put the fire out.'),2); }
    }
    for(let i=0;i<z.n;i++){ const A=z.pil[i], B=z.pil[(i+1)%z.n]; if(A.out||B.out) continue; const a=fzPil(z,A), b=fzPil(z,B,_fzq);
      if(segD(p.x,p.y,a.x,a.y,b.x,b.y)<10+p.r*0.6){ const sx=z.x+(p.x-z.x)*1.6, sy=z.y+(p.y-z.y)*1.6; if(d>z.R) hurtPlayer(bdmg(9),z.x+(p.x-z.x)*0.4,z.y+(p.y-z.y)*0.4,260); else hurtPlayer(bdmg(9),sx,sy,260); } }
    for(const q of z.pil){ if(q.out) continue; q.bt-=dt*foeDiff().atk; if(q.bt<=0){ q.bt=byDiff(3.2,2.5,2.0)+rand(0,0.5); const P=fzPil(z,q); shoot(P.x,P.y,angTo(P.x,P.y,z.x,z.y)+rand(-0.35,0.35),byDiff(105,135,155),6,bdmg(6),'fireball','enemy',{life:2.8}); } }
    if(Math.random()<dt*10){ const i=randi(0,z.n-1), A=z.pil[i], B=z.pil[(i+1)%z.n]; if(!A.out&&!B.out){ const a=fzPil(z,A), b=fzPil(z,B,_fzq), u=Math.random(); emit(lerp(a.x,b.x,u),lerp(a.y,b.y,u),1,{kind:'fire',ang:-Math.PI/2,spread:0.4,smin:20,smax:60,lmin:.3,lmax:.6,zmin:3,zmax:6,grow:8,drag:1}); } }
  },
  drawG(z){ const k=z.up||0; ctx.save();
    if(k<1){ for(const q of z.pil){ const P=fzPil(z,q); ctx.fillStyle=`rgba(255,90,40,${0.12+0.15*k})`; ctx.beginPath(); ctx.arc(P.x,P.y,22,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(255,120,60,${0.5+0.4*k})`; ctx.lineWidth=2; ctx.stroke(); } }
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<z.n;i++){ const A=z.pil[i], B=z.pil[(i+1)%z.n]; if(A.out||B.out) continue; const a=fzPil(z,A), b=fzPil(z,B,_fzq), fl=0.7+0.3*Math.sin(G.time*14+i);
      ctx.strokeStyle=`rgba(255,110,40,${0.55*k*fl})`; ctx.lineWidth=12; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.strokeStyle=`rgba(255,220,140,${0.6*k})`; ctx.lineWidth=3; ctx.stroke(); }
    ctx.restore(); },
  tall(z,list){ for(const q of z.pil){ if(q.out) continue; const P=fzPil(z,q); if(!q.it) q.it={flying:true,draw:()=>fzDrawPillar(z,q)}; q.it.x=P.x; q.it.y=P.y; list.push(q.it); } },
  out(z){ for(const q of z.pil) if(!q.out) fzPuff(fzPil(z,q),'255,150,60'); }
};
const _fzp={x:0,y:0}, _fzq={x:0,y:0};
function fzPil(z,q,o){ o=o||_fzp; const a=q.a+(z.rotA||0); o.x=z.x+Math.cos(a)*z.R; o.y=z.y+Math.sin(a)*z.R; return o; }
function fzPuff(P,col){ emit(P.x,P.y-16,14,{col:'90,80,80',glow:false,ang:-Math.PI/2,spread:0.8,smin:30,smax:110,lmin:.6,lmax:1.1,zmin:4,zmax:8,grow:8,drag:1}); emit(P.x,P.y-10,8,{col,smin:40,smax:120,lmin:.2,lmax:.4,zmin:2,zmax:3}); }
function fzDrawPillar(z,q){
  const P=fzPil(z,q), x=P.x, y=P.y, k=smooth(z.up||0), t=G.time+q.a*3, H=(46+6*Math.sin(t*9))*k;
  if(H<2) return;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=0.8; ctx.drawImage(foGlowSpr('255,120,40'),x-34,y-24-H*0.4,68,68);
  ctx.globalAlpha=1;
  const flame=(w,h,col)=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x-w,y); ctx.quadraticCurveTo(x-w*1.1,y-h*0.5,x+Math.sin(t*7)*w*0.4,y-h); ctx.quadraticCurveTo(x+w*1.1,y-h*0.5,x+w,y); ctx.closePath(); ctx.fill(); };
  flame(15,H,'rgba(255,90,30,.75)'); flame(10,H*0.78,'rgba(255,170,60,.85)'); flame(5,H*0.5,'rgba(255,245,200,.95)');
  ctx.restore();
  ctx.fillStyle='#3a2a24'; ctx.strokeStyle='#120a08'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x,y+2,13,5,0,0,TAU); ctx.fill(); ctx.stroke();
}
// muck: the flooded bog around the Sunken Ward. Slow and biting unless Ash walks on water (Water Stride)
FZK.muck={
  tick(z,dt){ z.r=Math.min(z.R,(z.r||0)+dt*z.R*0.7); const p=player, e=z.owner; if(!e||e.dead){ z.done=true; return; }
    if(p.dead) return; const d=dist(p.x,p.y,z.x,z.y);
    if(d>z.r||airborne()) return;
    if(canWalkWater()){ if(p.moving&&Math.random()<dt*8) G.ripples.push({x:p.x+rand(-6,6),y:p.y+rand(-4,4),t:0,max:0.7,r:rand(8,14)}); if(!z.saidStride){ z.saidStride=true; ftext(p.x,p.y-44,S('You stride over the muck!','You walk on the mud!'),'#bfe8a0',14); } return; }
    p.slowT=Math.max(p.slowT||0,0.15); z.bite=(z.bite||0)-dt; if(z.bite<=0){ z.bite=0.75; hurtPlayer(bdmg(4),p.x,p.y,0); }
    if(!z.saidMuck){ z.saidMuck=true; ftext(p.x,p.y-44,S('The muck bites! Water Stride would keep you on top.','Ouch, mud! Water Stride helps.'),'#c8e090',13); } },
  drawG(z){ const r=z.r||0; if(r<4) return; const t=G.time; ctx.save();
    ctx.beginPath(); for(let i=0;i<=56;i++){ const a=i/56*TAU, rr=r*(1+0.045*Math.sin(a*3+t*0.8)+0.025*Math.sin(a*5-t*1.3)); if(i) ctx.lineTo(z.x+Math.cos(a)*rr,z.y+Math.sin(a)*rr*0.92); else ctx.moveTo(z.x+Math.cos(a)*rr,z.y+Math.sin(a)*rr*0.92); }
    ctx.closePath(); ctx.lineJoin='round'; ctx.lineWidth=12; ctx.strokeStyle='rgba(84,90,40,.9)'; ctx.stroke(); ctx.fillStyle='rgba(44,48,20,.94)'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='rgba(190,200,120,.6)'; ctx.stroke();
    ctx.fillStyle='rgba(120,130,70,.35)'; ctx.beginPath(); ctx.ellipse(z.x-r*0.25,z.y-r*0.3,r*0.35,r*0.12,-0.3,0,TAU); ctx.fill();
    for(let i=0;i<7;i++){ const ph=(t*0.6+i*0.37)%1, a=i*2.39+Math.floor(t*0.6+i*0.37)*1.7, rr=r*0.75*((i*0.61)%1), bx=z.x+Math.cos(a)*rr, by=z.y+Math.sin(a)*rr*0.9; ctx.strokeStyle=`rgba(190,200,120,${0.6*(1-ph)})`; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(bx,by,2+ph*6,0,TAU); ctx.stroke(); }
    ctx.restore(); }
};
// frozen ground from Greymane's breath: slows and chills; fire breath melts it
FZK.ice={
  tick(z,dt){ const p=player; z.a=clamp(Math.min(z.t/0.4,(z.life-z.t)/0.6),0,1);
    if(typeof inBreath==='function'&&inBreath(z.x,z.y,z.r*0.7)){ z.melt=(z.melt||0)+dt; if(Math.random()<dt*20) emit(z.x+rand(-z.r,z.r)*0.6,z.y+rand(-z.r,z.r)*0.5,1,{col:'230,240,250',glow:false,ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.5,lmax:.9,zmin:3,zmax:6,grow:8,drag:1}); if(z.melt>0.45){ z.done=true; SFX.play('pop'); return; } }
    if(p.dead||airborne()||dist(p.x,p.y,z.x,z.y)>z.r) return;
    p.slowT=Math.max(p.slowT||0,0.2); z.chill=(z.chill||0)-dt; if(z.chill<=0){ z.chill=0.9; hurtPlayer(bdmg(4),p.x,p.y,0); }
    if(!G.flags.foe_iceTip){ G.flags.foe_iceTip=true; ftext(p.x,p.y-44,S('Frozen ground! Melt it with fire breath.','Ice! Melt it with fire.'),'#cfeaff',13); } },
  drawG(z){ const a=z.a==null?1:z.a; if(a<=0) return; ctx.save(); ctx.globalAlpha=a;
    ctx.fillStyle='rgba(150,205,245,.7)'; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r,z.r*0.8,0,0,TAU); ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle='rgba(245,252,255,.95)'; ctx.stroke();
    ctx.fillStyle='rgba(225,245,255,.55)'; ctx.beginPath(); ctx.ellipse(z.x-z.r*0.25,z.y-z.r*0.22,z.r*0.45,z.r*0.2,-0.4,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(70,130,190,.75)'; ctx.lineWidth=1.3; for(let i=0;i<5;i++){ const an=i*1.37+z.x*0.01; ctx.beginPath(); ctx.moveTo(z.x,z.y); ctx.lineTo(z.x+Math.cos(an)*z.r*0.55,z.y+Math.sin(an)*z.r*0.42); ctx.lineTo(z.x+Math.cos(an+0.3)*z.r*0.85,z.y+Math.sin(an+0.3)*z.r*0.66); ctx.stroke(); }
    const sp=0.5+0.5*Math.sin(G.time*5+z.x); ctx.fillStyle=`rgba(255,255,255,${0.5+0.5*sp})`; for(const [ox,oy] of [[0.35,-0.2],[-0.4,0.25]]){ const x=z.x+ox*z.r, y=z.y+oy*z.r, q=2+sp*2; ctx.beginPath(); ctx.moveTo(x,y-q*2); ctx.lineTo(x+q*0.5,y); ctx.lineTo(x,y+q*2); ctx.lineTo(x-q*0.5,y); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
};
function foeRoar(x,y){
  for(const z of G.fz||[]){ if(z.k!=='firering'||z.done) continue; let n=0; for(const q of z.pil){ if(q.out) continue; const P=fzPil(z,q); if(dist(x,y,P.x,P.y)<330){ q.out=true; n++; fzPuff(P,'255,150,60'); } } if(n) ftext(x,y-50,S('The fire goes out!','The fire is out!'),'#ffe066',15); }
}

// ================= the per-frame work: arena walls, holding Ash and the fighters inside, zones, sent-back shots
{ const base=updateEnemies; updateEnemies=function(dt){ base(dt); foeFrame(dt); }; }
function foeFrame(dt){
  for(const A of ARENAS) if(A.on||A.rise>0) arenaTick(A,dt);
  const b=G.bf;
  if(b){ b.t+=dt; const A=b.A;
    if(A&&A.on){ const p=player;
      if(!p.dead&&arenaHold(A,p,(A.def.cr||18)+p.r-2)){ p.kvx*=0.3; p.kvy*=0.3; }
      for(const e of G.enemies){ if(e.dead) continue;
        if(!e.inArena&&(e.boss||arenaIn(A,e.x,e.y,e.r+20))) e.inArena=A;
        if(e.inArena===A&&arenaHold(A,e,e.r+(A.def.cr||18)-4)){ e.hitWall=true; } } } }
  fzTick(dt);
  if(AREA) areaSites();
}
// shots a foe threw that Ash sent back (pr.rf = the thrower's id): they hit their owner even through a raised guard.
// Checked along the step the shot is about to take, before the stock projectile code moves it and tests hits.
{ const base=updateProjectiles; updateProjectiles=function(dt){ foeBackShots(dt); base(dt); }; }
function foeBackShots(dt){
  for(const pr of G.projectiles){ if(pr.rf==null||pr.dead||pr.owner!=='player') continue;
    for(const e of G.enemies){ if(e.id!==pr.rf) continue; if(e.dead||e.invuln) break;
      if(segD(e.x,e.y,pr.x,pr.y,pr.x+pr.vx*dt,pr.y+pr.vy*dt)<e.r+pr.r+4){ pr.dead=true; const F=FOES[e.type]; if(F&&F.onReflect) F.onReflect(e,pr); else { e.blocking=false; damageEnemy(e,pr.dmg,{src:'proj',kb:220,ka:Math.atan2(pr.vy,pr.vx),crit:true}); } }
      break; } }
}
// rendering: walls, props and tall zone pieces go in the y-sorted list; ground zones under everything
{ const base=eventsForRender; eventsForRender=function(list){ base(list);
    for(const A of ARENAS){ if(!A.on&&A.rise<=0) continue; for(const it of A.items) list.push(it); }
    for(const z of G.fz||[]){ const K=FZK[z.k]; if(K&&K.tall) K.tall(z,list); } }; }
{ const base=drawPools; drawPools=function(){ base(); for(const z of G.fz||[]){ const K=FZK[z.k]; if(K&&K.drawG) K.drawG(z); } }; }

// ================= the Act I site bosses, rebuilt on the framework
// Health: e6_balance's BAL_BOSS owns the Act I boss health and level (lv) when it is in the build (it sets EDEF before
// this module runs), so defineFoe leaves hp alone then; without it these are the new numbers (v8 was 520 to 1150).
function actIHp(v){ return typeof BAL_BOSS==='undefined'?v:undefined; }
// e6_balance's keep-moving rule pauses in punish windows (BAL_OPEN state names). The Brood Mother's perch pose is 'eggs':
// shooting her from one spot is the point of that window, so it counts as open too.
if(typeof BAL_OPEN==='object'&&BAL_OPEN) BAL_OPEN.eggs=1;
// shared: a boss taunt that does not repeat too often
function bossSay(e,who,line,gap){ if(e._sayT>G.time) return; e._sayT=G.time+(gap||6); taunt(who,line); }
// ---------- Grizzlefang: a bomb barrage (find the gap, roll or jump through) and an iron pot armor (hit his back, or the hammer)
// GRZ: the v10 on-ramp numbers for Easy and Normal (Hard keeps the v9 ones written next to them in the code). He is the
// first boss a new player meets, so his warnings are long enough for a kid to react to (about 0.4 s, then a roll), his bomb
// lines have wide gaps, fewer kobolds come later, and his iron pot lets more through and cracks from the front too.
// The numbers and the casual-kid bot tables behind them: scratchpad v10/BAL.md.
// Story only: the Arena's champion Grizzlefang keeps the v9 numbers (the [Easy, Normal, Hard] array passed to grzK).
const GRZ={wind:[1.6,1.75], lob:[1.3,1.15], front:[0.5,0.35], need:[1,2], dent:[5,7], back:24,
  sumAt:[0.4,0.4], sumN:[2,2], gap:[250,210], bombT:[1.8,1.5], lineT:[1.8,1.45], waves:[[2,3],[3,3]]};
function grzK(k,v9){ return onrampOn()?byDiff(GRZ[k][0],GRZ[k][1],v9[2]):byDiff(v9[0],v9[1],v9[2]); }
defineFoe('grizzlefang',{hp:actIHp(760),phases:[0.66,0.33],
  phaseText:[[S('Bomb Barrage!','Bombs!'),S('Lines of bombs. Find the gap, or roll through them!','Find the gap. Or roll!'),['griz',S('Boys! Light the fuses!','Boys! Light the bombs!')]],
             [S('Iron Pot Armor!','Iron pot!'),S('His front is iron now. Hit him from behind, or smash it with the hammer!','Hit his back! Or use the hammer!'),['griz',S('Ha! Try cutting through THIS!','Ha! Try hitting this!')]]],
  init(e){ e.barT=7; },
  onPhase(e,i){ if(i===1) e.barT=0.6; if(i===2){ grizArmor(e,false); e.barT=Math.max(e.barT,4); } },
  ai:grizAI,
  onHurt(e,amt,o){ if(!e.armor) return; const h=foeHit(e,o);
    if(h.src==='hammer'){ grizCrack(e,true); return amt; }
    if(h.melee&&h.behind){ grizCrack(e,false); return amt; }
    if(!(e._clangT>G.time)){ e._clangT=G.time+0.55; ftext(e.x,e.y-e.r-16,'CLANG!','#c9d0dc',13); SFX.play('block'); }
    // v10 (Act I on-ramp): on Easy and Normal, front hits dent the pot too, so a kid who never gets behind him still breaks it
    if(h.melee&&onrampOn()){ e.dents=(e.dents||0)+1; if(e.dents>=byDiff(GRZ.dent[0],GRZ.dent[1],99)){ e.dents=0; grizCrack(e,false); } }
    return amt*grzK('front',[0.25,0.12,0.08]); },
  over(e){ if(!e.armor) return; const top=(T3.on&&e._t3top!=null)?e._t3top:e.y-e.r*1.6, x=e.x, y=top+e.r*0.32, rx=e.r*0.62, ry=e.r*0.4;
    ctx.save(); ctx.fillStyle='#4a4c56'; ctx.strokeStyle='#121318'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,Math.PI,TAU); ctx.lineTo(x+rx*1.15,y); ctx.lineTo(x-rx*1.15,y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#8a909e'; ctx.beginPath(); ctx.ellipse(x-rx*0.35,y-ry*0.55,rx*0.28,ry*0.2,-0.3,0,TAU); ctx.fill();
    ctx.fillStyle='#2a2c32'; ctx.fillRect(x-rx*1.2,y-1.5,rx*2.4,3); ctx.fillStyle='#c8ccd8'; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.arc(x+i*rx*0.42,y-ry*0.2,1.3,0,TAU); ctx.fill(); }
    ctx.strokeStyle='#ffd27a'; ctx.lineWidth=1.4; for(let i=0;i<(e.cracks||0);i++){ const cx2=x-rx*0.4+i*rx*0.4; ctx.beginPath(); ctx.moveTo(cx2,y-ry*0.9); ctx.lineTo(cx2+3,y-ry*0.5); ctx.lineTo(cx2-2,y-ry*0.2); ctx.stroke(); }
    ctx.strokeStyle='rgba(180,190,210,.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(e.x,e.y+e.r*0.4,e.r*1.15,e.r*0.5,0,0,TAU); ctx.stroke(); ctx.restore(); }
});
function grizAI(e,dt,p){
  const F=FOES.grizzlefang, D=foeDiff(), d=dist(e.x,e.y,p.x,p.y);
  e.barT-=dt*D.atk;
  if(!e.summoned&&e.hp<e.maxHp*grzK('sumAt',[0.5,0.5,0.5])){ e.summoned=true; taunt('griz','Get the hatchling, boys!'); const L=fkLevel(e,{}); for(let i=0;i<grzK('sumN',[3,4,5]);i++){ const s=spotNear(e.x,e.y,90,180); spawnRune('kobold',s.x,s.y,{level:L,aggro:true}); } }
  if(e.bph>=2&&!e.armor&&e.armorBack&&G.time>e.armorBack&&e.hp>e.maxHp*0.12&&e.state==='chase'&&e.stun<=0) grizArmor(e,true);
  if(e.bar){ grizBarrage(e,dt); return; }
  if(e.bph>=1&&e.barT<=0&&e.state==='chase'&&e.stun<=0){ grizBarrageStart(e); return; }
  // smarter than the old coin flip: bombs at range, a spin when Ash hovers just out of reach, the cleave up close
  if(e.state==='chase'&&e.cd<=0&&d>=e.r+p.r+40){
    if(d>250||Math.random()<0.3){ e.state='bombs'; e.st=0.5; }
    else { e.state='spinW'; e.st=0.65*D.tele; e.tele=newTele({shape:'circle',r:e.r+38,dur:e.st}); }
  }
  const f0=e.face, sp0=e.speed, t0=e.tele, h0=G.hazards.length; if(e.armor) e.speed=sp0*0.78;
  F.base(e,dt);
  e.speed=sp0;
  // longer red warnings for the cleave and the spin, and later lobbed bombs, on Easy and Normal (runAI then applies DIFFS.wind)
  if(onrampOn()){ if(e.tele&&e.tele!==t0&&(e.state==='cleave'||e.state==='spinW')){ const k=byDiff(GRZ.wind[0],GRZ.wind[1],1); e.st*=k; e.tele.dur*=k; }
    for(let i=h0;i<G.hazards.length;i++){ const h=G.hazards[i]; if(h.kind==='blast'&&h.lob) h.delay*=byDiff(GRZ.lob[0],GRZ.lob[1],1); } }
  if(e.armor&&(e.state==='chase'||e.state==='cleave'||e.state==='recover')){ const lim=byDiff(1.6,2.1,2.5)*dt; e.face=f0+clamp(angDiff(f0,e.face),-lim,lim); }   // heavy: he turns slowly, so circle behind him
  bossCad(e,e.bph>=1?0.8:1);
}
function grizBarrageStart(e){ const W=onrampOn()?byDiff(GRZ.waves[0],GRZ.waves[1],[3,4]):[3,4]; e.bar={n:0,waves:e.bph>=2?W[1]:W[0],t:0.8*foeDiff().tele,last:rand(0,TAU)}; e.state='bombs'; e.st=0.4; e.dx=e.dy=0; e.tele=newTele({shape:'circle',r:e.r+26,dur:e.bar.t,col:'255,170,60'}); SFX.play('warn'); e.barT=e.bph>=2?13:10.5; bossSay(e,'griz',S('More bombs! MORE!','More bombs!'),12); }
function grizBarrage(e,dt){
  const B=e.bar; e.dx=e.dy=0; e.face=turnTo(e.face,angTo(e.x,e.y,player.x,player.y),3*dt); e.state='bombs'; e.st=0.4;
  B.t-=dt; if(B.t>0) return;
  e.tele=null;
  if(B.n>=B.waves){ e.bar=null; toRecover(e,byDiff(1.3,0.9,0.7)); return; }
  grizBombLine(e,B); B.n++; B.t=grzK('lineT',[1.5,1.15,0.95]);
}
// a line of lobbed bombs across the arena, through where Ash stands, with one gap (marked green)
function grizBombLine(e,B){
  // each line runs through Ash toward the middle of the arena (so it crosses the whole floor), turned a little more each wave
  const p=player, C=bossCtx(e), off=[0,0.8,-0.8,1.6][B.n%4]+rand(-0.15,0.15);
  const base=dist(p.x,p.y,C.cx,C.cy)>70?angTo(p.x,p.y,C.cx,C.cy):(B.last+1.2), th=base+off; B.last=base;
  const ux=Math.cos(th), uy=Math.sin(th), gap=rand(-90,90), gw=grzK('gap',[200,155,130]), delay=grzK('bombT',[1.5,1.2,1.05]);
  for(let s=-760;s<=760;s+=60){
    if(Math.abs(s-gap)<gw/2) continue;
    const x=p.x+ux*s, y=p.y+uy*s; if(!bossIn(C,x,y,24)) continue;
    blast(x,y,44,delay+Math.abs(s)*0.00035,bdmg(13),{lob:true,fx:e.x,fy:e.y});
  }
  fzAdd('safe',{x:p.x+ux*gap,y:p.y+uy*gap,r:gw*0.4,life:delay+0.35});
  SFX.play('slash3'); shake(3);
}
function grizArmor(e,back){ e.armor=1; e.cracks=0; e.dents=0; e.armorBack=0; shake(6); SFX.play('block'); emit(e.x,e.y-e.r,16,{col:'190,200,215',smin:60,smax:180,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); if(back) bossSay(e,'griz',S('Pot is back on! Ha!','My pot is back!'),4); }
function grizCrack(e,full){
  const need=grzK('need',[2,3,4]); e.cracks=(e.cracks||0)+(full?need:1);
  SFX.play('block'); shake(4); emit(e.x,e.y-e.r,10,{col:'255,220,150',smin:80,smax:220,lmin:.15,lmax:.3,zmin:1.2,zmax:2.4});
  if(e.cracks<need){ ftext(e.x,e.y-e.r-22,'CRACK!','#ffd27a',15); return; }
  e.armor=0; e.cracks=0; e.bar=null; e.tele=null; e.state='recover'; e.st=0.3; e.stun=Math.max(e.stun,byDiff(3,2.4,2));
  shake(10); SFX.play('boom'); emit(e.x,e.y-e.r,30,{col:'120,124,136',glow:false,smin:80,smax:280,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:2});
  ftext(e.x,e.y-e.r-28,S('ARMOR BROKEN!','ARMOR OFF!'),'#ffe066',17);
  e.armorBack=foeDiff().easy?0:G.time+(onrampOn()?GRZ.back:16); e.dents=0;
  bossSay(e,'griz',S('My best pot! You will pay for that!','My pot! You will pay!'),3);
}
// ---------- High Priest Morrow: a ring of fire pillars with a shield; soak up the flames, then roar them out
defineFoe('morrow',{hp:actIHp(860),phases:[0.66,0.33],
  phaseText:[[S('Ring of Fire!','Ring of fire!'),S('His shield feeds on the pillars. Stand in the ring until your ROAR is full, then roar!','Wait for ROAR. Then roar!'),['morrow',S('Burn in the holy fire of the Oath!','Burn in the Oath fire!')]],
             [S('The Fire Spins!','Spinning fire!'),S('More pillars, and they turn. Same trick: fill your ROAR, then roar!','Fill ROAR. Then roar!'),['morrow',S('The Oath will not break!','The Oath is strong!')]]],
  init(e){ e.ringT=99; },
  onPhase(e,i){ e.ringT=0.5; },
  ai:morrowAI,
  onHurt(e,amt,o){ if(e.broke>G.time) return amt*1.5; },
  over(e){ if(!e.shielded) return; const top=(T3.on&&e._t3top!=null)?e._t3top:e.y-e.r*2, cy=(top+e.y)/2+2, r=Math.max(e.r+12,(e.y-top)*0.62), t=G.time;
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+0.15*Math.sin(t*6); ctx.drawImage(foGlowSpr('255,130,60'),e.x-r*1.3,cy-r*1.3,r*2.6,r*2.6);
    ctx.globalAlpha=0.9; ctx.strokeStyle='rgba(255,190,110,.8)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(e.x,cy,r,r*1.05,0,0,TAU); ctx.stroke();
    ctx.strokeStyle='rgba(200,120,255,.7)'; ctx.lineWidth=1.5; ctx.setLineDash([6,8]); ctx.lineDashOffset=-t*40; ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
});
function morrowAI(e,dt,p){
  const F=FOES.morrow, D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  const R=e.fring;
  if(R&&!R.done){   // behind his shield: he keeps away and sends slow orbs
    e.shielded=true; e.invuln=true; e.alpha=1; e.dx=e.dy=0; e.face=turnTo(e.face,a,5*dt); kite(e,p,d,a,250,340,0.7*D.spd);
    e.orbT=(e.orbT==null?1.4:e.orbT)-dt*D.atk; if(e.orbT<0.35){ e.state='orbs'; e.st=0.3; } else { e.state='recover'; e.st=1; }
    if(e.orbT<=0){ e.orbT=byDiff(2.6,2.0,1.6); shoot(e.x,e.y,a,byDiff(115,140,160),9,bdmg(9),'orb','enemy',{homing:1.1,life:5}); SFX.play('cast'); }
    return; }
  if(e.shielded){ e.shielded=false; e.invuln=false; e.state='chase'; e.cd=0.8; e.fring=null;
    if(R&&R.snuffed){ e.stun=Math.max(e.stun,byDiff(3.6,3,2.6)); e.broke=G.time+e.stun+0.5; shake(9); SFX.play('boom'); emit(e.x,e.y-20,30,{col:'200,140,255',smin:80,smax:260,lmin:.3,lmax:.7,zmin:2,zmax:4}); ftext(e.x,e.y-e.r-30,S('His shield breaks!','Shield broken!'),'#ffe066',16); bossSay(e,'morrow',S('No! My holy fire!','No! My fire!'),3); }
    return; }
  if(e.ringGo){ e.dx=e.dy=0; e.state='summon'; e.st-=dt; if(e.st<=0){ e.ringGo=false; e.tele=null; e.fring=morrowRing(e); e.state='chase'; } return; }
  e.ringT-=dt*D.atk;
  if(e.bph>=1&&e.ringT<=0&&e.state==='chase'&&!e.invuln&&e.stun<=0){ e.ringT=e.bph>=2?16:19; e.ringGo=true; e.state='summon'; e.st=0.9*D.tele; e.tele=newTele({shape:'circle',r:64,dur:e.st,col:'255,140,60'}); SFX.play('cast'); return; }
  F.base(e,dt);
  bossCad(e,e.bph>=2?0.75:e.bph>=1?0.88:1);
}
function morrowRing(e){
  const p=player, C=bossCtx(e), n=e.bph>=2?10:8, R=byDiff(170,155,145), q={x:p.x,y:p.y};
  if(C.A) arenaHold(C.A,q,R+46); else if(dist(q.x,q.y,C.cx,C.cy)>C.R-R){ const a=angTo(C.cx,C.cy,q.x,q.y); q.x=C.cx+Math.cos(a)*(C.R-R); q.y=C.cy+Math.sin(a)*(C.R-R); }
  const z=fzAdd('firering',{x:q.x,y:q.y,R,n,owner:e,rise:byDiff(1.25,1.0,0.9),life:byDiff(11,13,14),rot:e.bph>=2?byDiff(0.18,0.24,0.3):0,feed:byDiff(36,27,22),pil:[]});
  for(let i=0;i<n;i++) z.pil.push({a:i/n*TAU,out:false,bt:1.2+i*0.3});
  SFX.play('warn'); shake(4); return z;
}
// ---------- the Brood Mother: flies up to her nest crag, out of reach of claws and fire; arrows, the Wing-rang or a
// swing that sends her fireballs back knock her down
defineFoe('broodmother',{hp:actIHp(1080),phases:[0.66,0.33],
  phaseText:[[S('To the Nest!','To the nest!'),S('Too high for claws. Use arrows, the Wing-rang, or swing to send her fireballs back!','Too high! Shoot her, or hit her fire back!'),['brood',S('Up, up! You cannot reach me up here, egg-thief!','You cannot reach me up here!')]],
             [S('Brood Fury!','Angry mother!'),S('She charges twice and flies home more often. Knock her down again!','She is fast now! Knock her down!'),['brood',S('My children! Avenge your mother!','My babies! Help me!')]]],
  init(e){ e.nestT=99; e.knock=0; },
  onPhase(e,i){ e.nestT=0.5; },
  ai:broodAI,
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(e.nst==='perch'||e.nst==='fly'){
      if(h.ranged||h.roar){ if(e.nst==='perch'){ e.knock=(e.knock||0)+1; if(e.knock>=byDiff(2,3,4)) broodNestLeave(e,true); else ftext(e.x,e.y-e.r-40,S('Again! Knock her down!','Again!'),'#ffe066',13); } return amt; }
      if(!(e._highT>G.time)){ e._highT=G.time+1.4; ftext(e.x,e.y-e.r-40,S('Too high! Use arrows, or hit her fireballs back.','Too high! Shoot her!'),'#ffd27a',13); }
      return false; }
    if(e.fallen>G.time) return amt*1.3; },
  lift(e){ return e.nestLift||0; }
});
function broodAI(e,dt,p){
  const F=FOES.broodmother, D=foeDiff();
  if(e.nst){ broodNest(e,dt); return; }
  e.nestT-=dt*D.atk;
  if(e.bph>=1&&e.nestT<=0&&e.state==='chase'&&e.stun<=0){ broodNestGo(e); return; }
  const n0=G.enemies.length;
  F.base(e,dt);
  if(G.enemies.length>n0){ const L=fkLevel(e,{}); for(let i=n0;i<G.enemies.length;i++){ const q=G.enemies[i]; if(q.type==='egg'&&!q._lv){ q._lv=true; q.level=L; } } }
  if(e.bph>=2&&e._bst==='charge'&&e.state==='recover'&&!e.charge2){ e.charge2=true; e.state='aim'; e.st=0.55*D.tele; e.tele=newTele({shape:'line',len:430,w:e.r*1.8,dur:e.st}); }
  if(e.state==='chase') e.charge2=false;
  bossCad(e,e.bph>=2?0.75:e.bph>=1?0.88:1);
}
function broodNestSpot(e){ const b=G.bf; if(b&&b.A){ const m=b.A.props.find(q=>q.k==='mesa'); if(m) return m; } const C=bossCtx(e); return {x:C.cx,y:C.cy-Math.min(180,C.R*0.5),r:0}; }
function broodNestGo(e){ e.nest=broodNestSpot(e); e.nst='fly'; e.state='charge'; e.st=9; e.noClip=true; e.tele=null; e.knock=0; SFX.play('roar'); bossSay(e,'brood',S('Back to my nest!','Back to my nest!'),10); }
function broodNest(e,dt){
  const p=player, D=foeDiff(), N=e.nest, a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0; e.vx*=0.85; e.vy*=0.85;
  if(e.nst==='fly'){ const dd=dist(e.x,e.y,N.x,N.y), sp=300*D.spd; e.face=turnTo(e.face,angTo(e.x,e.y,N.x,N.y),6*dt); if(dd>6){ const k=Math.min(1,sp*dt/dd); e.x+=(N.x-e.x)*k; e.y+=(N.y-e.y)*k; } e.nestLift=lerp(e.nestLift||0,40,1-Math.exp(-dt*4)); e.state='charge'; e.st=9;
    if(dd<8){ e.nst='perch'; e.nstT=byDiff(10,12,13); e.spitT=1.1; e.eggT2=2.5; e.state='eggs'; e.st=0; shake(5); SFX.play('boom'); ftext(e.x,e.y-e.r-40,S('Too high to reach!','Too high!'),'#ffd27a',14); }
    return; }
  if(e.nst==='perch'){ e.x=N.x; e.y=N.y; e.nestLift=40; e.face=turnTo(e.face,a,3*dt); e.nstT-=dt;
    e.spitT-=dt*D.atk; if(e.spitT<0.5){ e.state='breathW'; e.st=Math.max(0.01,e.spitT*1.5); } else { e.state='eggs'; e.st=0; }
    if(e.spitT<=0){ e.spitT=byDiff(1.8,1.4,1.15); const n=e.bph>=2?3:2; for(let i=0;i<n;i++) shoot(e.x,e.y+4,a+(i-(n-1)/2)*0.3,byDiff(165,195,225),11,bdmg(11),'fireball','enemy',{life:3.6}); SFX.play('cast'); }
    e.eggT2-=dt; if(e.eggT2<=0){ e.eggT2=byDiff(6.5,5,4); if(countType('egg')+countType('drakeling')<byDiff(3,4,5)){ const r=(N.r||0)+34, s=spotNear(N.x+Math.cos(a)*r,N.y+Math.sin(a)*r,0,50); makeEnemy('egg',s.x,s.y,{hatch:4.6,level:fkLevel(e,{})}); } }
    if(e.nstT<=0) broodNestLeave(e,false);
    return; }
  if(e.nst==='down'){ const tx=e.downX, ty=e.downY, dd=dist(e.x,e.y,tx,ty); e.nestLift=Math.max(0,(e.nestLift||0)-dt*(e.knocked?110:55)); if(dd>4){ const k=Math.min(1,(e.knocked?380:240)*dt/dd); e.x+=(tx-e.x)*k; e.y+=(ty-e.y)*k; }
    e.state=e.knocked?'recover':'charge'; e.st=1;
    if(dd<6&&e.nestLift<=0){ e.nst=null; e.noClip=false; e.nestT=e.bph>=2?15:21; e.state='chase'; e.cd=0.5;
      if(e.knocked){ e.stun=Math.max(e.stun,byDiff(3.8,3.1,2.6)); e.fallen=G.time+e.stun+0.4; shake(9); SFX.play('boom'); emit(e.x,e.y,24,{col:'150,120,100',glow:false,smin:60,smax:220,lmin:.3,lmax:.7,zmin:3,zmax:6,grow:6}); ftext(e.x,e.y-e.r-20,S('She is down! Strike now!','She fell! Hit her!'),'#ffe066',16); }
      e.knocked=false; } }
}
function broodNestLeave(e,knocked){
  const N=e.nest, a=angTo(N.x,N.y,player.x,player.y), r=(N.r||0)+46, q={x:N.x+Math.cos(a)*r,y:N.y+Math.sin(a)*r}, C=bossCtx(e);
  if(C.A) arenaHold(C.A,q,e.r+30);
  e.nst='down'; e.knocked=knocked; e.downX=q.x; e.downY=q.y;
  if(knocked){ shake(8); SFX.play('hurt'); emit(e.x,e.y-30,20,{col:'240,150,180',glow:false,smin:40,smax:160,lmin:.4,lmax:.9,zmin:2,zmax:4}); ftext(e.x,e.y-e.r-40,S('She tumbled out of her nest!','She fell out!'),'#ffe066',16); bossSay(e,'brood',S('My nest! You horrid little egg-thief!','My nest!'),3); }
}
// ---------- Gloamjaw: the bog floods and he hides in the muck; stride over it to strike him (or wait for him to lunge out)
defineFoe('gloamjaw',{hp:actIHp(1150),phases:[0.66,0.33],
  phaseText:[[S('The Bog Floods!','The bog floods!'),S('He hides in the muck. Walk on the water to reach him, or wait for him to lunge out!','He hides in the mud! Walk on it, or wait.'),['gloam',S('Come swim with me, little snack!','Come swim, snack!')]],
             [S('Deep Muck!','Deep mud!'),S('The muck spreads and he surfaces faster. Keep moving!','More mud! Keep moving!'),['gloam',S('Glorp! The whole bog is mine!','The whole bog is mine!')]]],
  onPhase(e,i){ const C=bossCtx(e);
    if(i===1){ e.pool=fzAdd('muck',{x:C.cx,y:C.cy,R:byDiff(140,150,160),r:0,owner:e}); e.pc=0; e.pst='dive'; e.landT=0; }
    if(i===2&&e.pool) e.pool.R=byDiff(175,190,205); },
  ai:gloamAI,
  onHurt(e,amt,o){ if(e.pst==='up'&&e.pool&&dist(e.x,e.y,e.pool.x,e.pool.y)<e.pool.r) return amt*1.15; }
});
function gloamAI(e,dt,p){
  const F=FOES.gloamjaw;
  if(e.pool&&!e.pool.done&&e.bph>=1){ gloamPool(e,dt); return; }
  F.base(e,dt);
  bossCad(e,1);
}
function gloamSpot(e,Z,f0,f1){ for(let i=0;i<20;i++){ const a=rand(0,TAU), r=rand(f0,f1)*Z.r, x=Z.x+Math.cos(a)*r, y=Z.y+Math.sin(a)*r; if(!colAt(x,y,e.r*0.6)) return {x,y}; } return {x:Z.x+Z.r*0.4,y:Z.y}; }
function gloamPool(e,dt){
  const p=player, Z=e.pool, D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  if(!e.summoned&&e.hp<e.maxHp*0.5){ e.summoned=true; taunt('gloam','Little bog-kobolds! Dinner is served!'); const L=fkLevel(e,{}); for(let i=0;i<3;i++){ const s=spotNear(Z.x,Z.y,Z.r+30,Z.r+130); spawnRune('kobold',s.x,s.y,{level:L,aggro:true}); } }
  e.dx=e.dy=0; if(e.mouth>0) e.mouth-=dt;
  switch(e.pst){
    case 'land':   // on the shore for a while, with his old moves
      e.landT-=dt; FOES.gloamjaw.base(e,dt);
      if(e.landT<=0&&e.state==='chase'){ e.pst='dive'; }
      return;
    case 'dive': e.state='diveDown'; e.st=0.5; e.invuln=true; e.sub=true; e.tele=null; e.noClip=true; SFX.play('roll'); e.pst='diving'; return;
    case 'diving': e.st-=dt; e.alpha=Math.max(0.12,e.st/0.5); if(e.st<=0){ e.pst='lurk'; e.state='under'; e.lurkT=byDiff(2.6,2.2,1.8)*(e.bph>=2?0.75:1); const s=gloamSpot(e,Z,0.25,0.6); e.lx=s.x; e.ly=s.y; } return;
    case 'lurk': { e.state='under'; e.sub=true; e.invuln=true; e.alpha=0.12;
      const dd=dist(e.x,e.y,e.lx,e.ly); if(dd>6){ const k=Math.min(1,260*D.spd*dt/dd); e.x+=(e.lx-e.x)*k; e.y+=(e.ly-e.y)*k; }
      if(Math.random()<dt*12) G.ripples.push({x:e.x+rand(-14,14),y:e.y+rand(-14,14),t:0,max:0.9,r:rand(10,20)});
      e.lurkT-=dt; if(e.lurkT>0) return;
      e.pc=(e.pc||0)+1;
      const pd=dist(p.x,p.y,Z.x,Z.y), wading=pd<Z.r&&!canWalkWater()&&!airborne(), striding=pd<Z.r&&canWalkWater();
      let tx=e.lx, ty=e.ly, shore=false;
      if(wading&&Math.random()<0.75){ tx=p.x; ty=p.y; }
      else if(striding&&Math.random()<0.5){ const s=gloamSpot(e,Z,0.1,0.5); tx=s.x; ty=s.y; }
      else if(e.pc%byDiff(2,3,3)===0){ const sa=angTo(Z.x,Z.y,p.x,p.y), r=Z.r+46, q={x:Z.x+Math.cos(sa)*r,y:Z.y+Math.sin(sa)*r}, C=bossCtx(e); if(C.A) arenaHold(C.A,q,e.r+30); tx=q.x; ty=q.y; shore=true; }
      e.ex=tx; e.ey=ty; e.shore=shore; e.pst='swim'; return; }
    case 'swim': { const dd=dist(e.x,e.y,e.ex,e.ey); e.alpha=0.12; if(dd>6){ const k=Math.min(1,(e.shore?340:300)*D.spd*dt/dd); e.x+=(e.ex-e.x)*k; e.y+=(e.ey-e.y)*k; if(Math.random()<dt*14) G.ripples.push({x:e.x+rand(-12,12),y:e.y+rand(-12,12),t:0,max:0.8,r:rand(10,18)}); return; }
      e.pst='emergeW'; e.state='emergeW'; e.st=0.8*D.tele; e.tele=newTele({shape:'circle',r:e.r+54,dur:e.st,col:'140,220,90'}); return; }
    case 'emergeW': e.st-=dt; if(e.st>0) return;
      e.tele=null; e.alpha=1; e.invuln=false; e.sub=false; e.noClip=false; shake(10); SFX.play('boom');
      if(d<e.r+54+p.r*0.6&&!airborne()) hurtPlayer(bdmg(18),e.x,e.y,400);
      emit(e.x,e.y,30,{col:'90,120,60',glow:false,smin:80,smax:260,lmin:.4,lmax:.8,zmin:3,zmax:7,grow:6}); G.rings.push({x:e.x,y:e.y,rad:e.r,max:240,speed:520,thick:18,dmg:0,kb:300});
      if(e.shore){ e.pst='land'; e.landT=byDiff(7,6,5); e.state='recover'; e.st=0.6; bossSay(e,'gloam',S('Here I come, snack!','Here I come!'),8); return; }
      e.pst='up'; e.upT=byDiff(3.4,3.0,2.6); e.spits=e.bph>=2?2:1; e.state='recover'; e.st=0.5; return;
    case 'up':   // surfaced in the muck: spits, open to a hit
      e.face=turnTo(e.face,a,3*dt); e.upT-=dt;
      if(e.state==='spitW'){ e.st-=dt; if(e.st<=0){ const n=e.bph>=2?5:3; for(let i=0;i<n;i++){ const [tx,ty]=clampMap(p.x+rand(-110,110),p.y+rand(-110,110),40,p.y); blast(tx,ty,46,0.85*D.tele+i*0.14,bdmg(10),{lob:true,fx:e.x,fy:e.y,toxic:true,pool:true}); } SFX.play('cast'); e.state='recover'; e.st=0.7; e.spits--; } return; }
      if(d<e.r+p.r+46&&e.state!=='chompW'&&!(e.chompCd>G.time)){ e.state='chompW'; e.st=0.55*D.tele; e.tele=newTele({shape:'arc',r:e.r+54,half:0.95,dur:e.st}); e.chompCd=G.time+2; return; }
      if(e.state==='chompW'){ e.face=turnTo(e.face,a,2*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.mouth=0.3; if(inCone(e.x,e.y,e.face,e.r+56,1.0,p.x,p.y,p.r)) hurtPlayer(bdmg(17),e.x,e.y,340); SFX.play('slash3'); shake(4); e.state='recover'; e.st=0.6; } return; }
      e.st-=dt; if(e.st<=0&&e.spits>0){ e.state='spitW'; e.st=0.5*D.tele; return; }
      if(e.upT<=0&&e.state==='recover'&&e.st<=0) e.pst='dive';
      return;
    default: e.pst='dive';
  }
}
// ---------- Greymane: an ice coat that only fire melts, frozen ground from his breath, and the pack leaping the wall
defineFoe('greymane',{hp:actIHp(1100),phases:[0.66,0.33],
  phaseText:[[S('Frost Coat!','Ice coat!'),S('Ice covers him. Melt it with fire breath! His breath freezes the ground, so melt that too.','Melt his ice with fire!'),['ember',S('Ice? You are a fire dragon, Ash. Melt it!','Melt it, Ash! Use fire!')]],
             [S('The Pack!','The pack!'),S('He howls for his pack. If wolves leap the wall, keep moving, and keep melting his coat!','He calls wolves! Keep moving!'),['ember',S('He is calling his pack, Ash!','He calls his pack!')]]],
  onPhase(e,i){ if(i===1) e.coatGo=true; if(i===2) e.packCall=true; },
  ai:greyAI,
  onHurt(e,amt,o){ if(!e.coat) return; const h=foeHit(e,o);
    if(h.fire){ e.melt=(e.melt||0)+(o.src==='burn'?0.14:0.1); if(Math.random()<0.5) emit(e.x,e.y-e.r,2,{col:'230,240,250',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:70,lmin:.5,lmax:.9,zmin:3,zmax:6,grow:8,drag:1}); if(e.melt>=byDiff(1.0,1.6,2.0)) greyCoatBreak(e); return amt*0.6; }
    if(!(e._clinkT>G.time)){ e._clinkT=G.time+0.6; ftext(e.x,e.y-e.r-16,S('CLINK! Melt the ice!','CLINK! Use fire!'),'#cfeaff',13); SFX.play('block'); }
    return amt*0.2; },
  over(e){ if(!e.coat) return; const k=clamp(1-(e.melt||0)/byDiff(1.0,1.6,2.0),0.25,1), top=(T3.on&&e._t3top!=null)?e._t3top:e.y-e.r*1.5, cy=(top+e.y)/2+4, rx=e.r*1.45, ry=Math.max(e.r,(e.y-top)*0.6);
    ctx.save(); ctx.globalAlpha=0.35*k+0.1; ctx.fillStyle='rgba(190,230,255,1)'; ctx.beginPath(); ctx.ellipse(e.x,cy,rx,ry,0,0,TAU); ctx.fill();
    ctx.globalAlpha=0.85*k; ctx.strokeStyle='#eefaff'; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='#dff4ff'; ctx.strokeStyle='#6aa4cc'; ctx.lineWidth=1;
    for(let i=0;i<6;i++){ const a=Math.PI+0.3+i*(Math.PI-0.6)/5, x=e.x+Math.cos(a)*rx*0.85, y=cy+Math.sin(a)*ry*0.85; ctx.beginPath(); ctx.moveTo(x-3,y+2); ctx.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9); ctx.lineTo(x+3,y+2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore(); }
});
function greyAI(e,dt,p){
  const F=FOES.greymane, D=foeDiff(), a=angTo(e.x,e.y,p.x,p.y);
  if(e.myHowl){ e.dx=e.dy=0; e.face=turnTo(e.face,a,2*dt); e.st-=dt; if(e.st<=0){ const k=e.myHowl; e.myHowl=null; e.tele=null; if(k==='pack') greyPack(e); else greyCoatOn(e); toRecover(e,0.6); } return; }
  if(e.state==='chase'&&e.stun<=0){
    if(e.packCall){ e.packCall=false; e.myHowl='pack'; e.state='howl'; e.st=1.0*D.tele; e.tele=newTele({shape:'circle',r:90,dur:e.st,col:'200,230,255'}); SFX.play('howl'); return; }
    if(e.coatGo||(e.bph>=1&&!e.coat&&e.coatBack&&G.time>e.coatBack)){ e.coatGo=false; e.coatBack=0; e.myHowl='coat'; e.state='howl'; e.st=0.8*D.tele; e.tele=newTele({shape:'circle',r:60,dur:e.st,col:'160,210,255'}); return; }
  }
  const sp0=e.speed; if(e.coat) e.speed=sp0*0.9;
  F.base(e,dt);
  e.speed=sp0;
  if(e.bph>=1&&e._bst==='frost'&&e.state==='recover') greyIce(e);
  bossCad(e,e.bph>=2?0.75:e.bph>=1?0.85:1);
}
function greyCoatOn(e){ e.coat=1; e.melt=0; shake(5); SFX.play('block'); emit(e.x,e.y-e.r,24,{col:'210,240,255',smin:60,smax:200,lmin:.3,lmax:.7,zmin:2,zmax:4}); ftext(e.x,e.y-e.r-24,S('Ice coat!','Ice coat!'),'#cfeaff',15); }
function greyCoatBreak(e){ e.coat=0; e.melt=0; e.stun=Math.max(e.stun,byDiff(2.8,2.2,1.8)); e.tele=null; e.state='recover'; e.st=0.3; e.coatBack=G.time+byDiff(18,14,12);
  shake(9); SFX.play('boom'); emit(e.x,e.y-e.r,34,{col:'220,245,255',glow:false,smin:80,smax:280,lmin:.4,lmax:.9,zmin:2,zmax:5}); ftext(e.x,e.y-e.r-26,S('The ice cracks!','The ice breaks!'),'#ffe066',16); }
function greyIce(e){
  const C=bossCtx(e), L=G.fz||[];
  for(const [dl,r] of [[80,44],[160,52],[245,58]]){ const x=e.x+Math.cos(e.face)*(e.r+dl), y=e.y+Math.sin(e.face)*(e.r+dl); if(bossIn(C,x,y,20)) fzAdd('ice',{x,y,r:r*byDiff(0.85,1,1.12),life:byDiff(7,9,11)}); }
  const ice=(G.fz||[]).filter(z=>z.k==='ice'); if(ice.length>9) for(let i=0;i<ice.length-9;i++) ice[i].done=true;
}
function greyPack(e){
  const C=bossCtx(e), n=byDiff(2,G.mode==='story'?2:3,4), L=fkLevel(e,{}), a0=rand(0,TAU);   // v10 on-ramp: 2 wolves on Normal (v9: 3)
  shake(6); SFX.play('howl'); G.rings.push({x:e.x,y:e.y,rad:e.r,max:260,speed:500,thick:16,dmg:0,kb:280});
  for(let i=0;i<n;i++){ const a=a0+i*TAU/n+rand(-0.3,0.3), r=C.R-40, x=C.cx+Math.cos(a)*r, y=C.cy+Math.sin(a)*r;
    const w=makeEnemy('wolf',x,y,{level:L,aggro:true,snowy:true,homeX:C.cx,homeY:C.cy,leash:2500}); w.spawnIn=0.25; w.inArena=C.A||null;
    emit(x,y-30,20,{col:'235,245,255',glow:false,smin:60,smax:200,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:4}); }
  ftext(e.x,e.y-e.r-24,S('The pack leaps the wall!','Wolves jump in!'),'#cfeaff',15);
}
// ---------- Sir Cindervane: chained burning charges, then blade waves you send back with a swing
defineFoe('cindervane',{hp:actIHp(1500),phases:[0.66,0.33],
  phaseText:[[S('Burning Charge!','Fire charge!'),S('He charges twice and leaves fire behind. Make him hit a wall!','He charges twice! Make him hit a wall!'),['cinder',S('Feel the fire of the Obsidian Gate!','Feel my fire!')]],
             [S('Blade Waves!','Sword waves!'),S('Swing your weapon at his blade waves to send them back. A wave that hits him breaks his guard!','Swing to hit his waves back!'),['cinder',S('A thousand years of sword work! Face it!','Face my sword!')]]],
  ai:cinderAI,
  onReflect(e,pr){ e.blocking=false; e.wv=null; e.tele=null; damageEnemy(e,pr.dmg,{src:'proj',kb:260,ka:Math.atan2(pr.vy,pr.vx),crit:true});
    if(!e.dead){ e.stun=Math.max(e.stun,byDiff(2.6,2.1,1.8)); e.state='recover'; e.st=0.3; shake(8); SFX.play('boom'); ftext(e.x,e.y-e.r-24,S('STAGGERED!','STAGGERED!'),'#ffe066',16); } }
});
function cinderAI(e,dt,p){
  const F=FOES.cindervane, D=foeDiff();
  if(e.wv){ cinderWaves(e,dt); return; }
  // the old check only reads e.hitWall; foeBumped also catches a stop against a cliff face or a ledge
  if(e.state==='charge'&&e.st<0.68&&!e.hitWall&&foeBumped(e)){ e.dx=e.dy=0; e.stun=Math.max(e.stun,1.6); e.blocking=false; toRecover(e,0.3); shake(9); SFX.play('boom'); ftext(e.x,e.y-e.r-10,'STUNNED!','#ffe066',15); return; }
  if(e.bph>=2){ e.waveT=(e.waveT==null?1.2:e.waveT)-dt*D.atk; if(e.waveT<=0&&e.state==='chase'&&e.stun<=0){ cinderWaveStart(e); return; } }
  const wasCharge=e.state==='charge';
  F.base(e,dt);
  if(e.bph>=1&&e.state==='charge') fkTrail(e,{trailR:22,trailLife:byDiff(1.8,2.4,2.8),trailDmg:4},dt);
  if(e.bph>=1&&wasCharge&&e.state==='recover'&&!(e.stun>0)&&!e.chained){ e.chained=true; e.state='chargeAim'; e.st=0.5*D.tele; e.tele=newTele({shape:'line',len:520,w:e.r*2,dur:e.st}); }
  if(e.state==='chase') e.chained=false;
  bossCad(e,e.bph>=2?0.8:e.bph>=1?0.88:1);
}
function cinderWaveStart(e){ const D=foeDiff(); e.wv={n:byDiff(2,3,3)}; e.state='slashW'; e.st=0.55*D.tele; e.tele=newTele({shape:'arc',r:e.r+90,half:0.9,dur:e.st,col:'255,150,60'}); e.waveT=byDiff(10,8.5,7); bossSay(e,'cinder',S('Blade of the Gate!','My blade!'),9); }
function cinderWaves(e,dt){
  const p=player, D=foeDiff(), a=angTo(e.x,e.y,p.x,p.y), W=e.wv;
  if(e.state!=='slashW'){ e.wv=null; return; }
  e.dx=e.dy=0; e.blocking=e.stun<=0; e.face=turnTo(e.face,a,2.4*dt); e.st-=dt;
  if(e.st>0) return;
  const n=byDiff(2,3,3), k0=G.projectiles.length;
  for(let i=0;i<n;i++) shoot(e.x+Math.cos(a)*e.r,e.y+Math.sin(a)*e.r,a+(i-(n-1)/2)*0.42,byDiff(185,225,255),14,bdmg(15),'wave','enemy',{life:2.6});
  for(let i=k0;i<G.projectiles.length;i++) G.projectiles[i].rf=e.id;
  e.swung=0.25; SFX.play('slash3'); e.tele=null;
  if(--W.n>0){ e.st=byDiff(1.0,0.78,0.62); e.tele=newTele({shape:'arc',r:e.r+90,half:0.9,dur:e.st,col:'255,150,60'}); }
  else { e.wv=null; toRecover(e,byDiff(1.5,1.15,0.9)); }
}
// ---------- the six sites, with their arenas
defineBoss('warcamp',{boss:'grizzlefang',at:'warcamp',stage:'warcamp',guards:[['kobold',5]],arena:{shape:'ring',r:352,style:'wood'}});
defineBoss('oath',{boss:'morrow',at:'oath',stage:'oath',ward:'ash',guards:[['cultist',3],['kobold',3]],arena:{shape:'ring',r:352,style:'stone',glow:'190,120,255'}});
defineBoss('crag',{boss:'broodmother',at:'nests',stage:'three',ward:'crag',guards:[['drakeling',3]],arena:{shape:'ring',r:368,style:'stone',tint:'#9a6a52',props:[{k:'mesa',dx:0,dy:-192,r:86}]}});
defineBoss('mire',{boss:'gloamjaw',at:'mire',stage:'three',ward:'mire',guards:[['kobold',3],['cultist',2]],arena:{shape:'ring',r:368,style:'thorn'}});
defineBoss('frost',{boss:'greymane',at:'frost',stage:'three',ward:'frost',guards:[['wolf',3]],arena:{shape:'ring',r:360,style:'ice'}});
defineBoss('gate',{boss:'cindervane',at:'gate',stage:'gate',guards:[['knight',2],['cultist',2]],arena:{shape:'rect',w:590,h:500,dy:46,style:'iron',gaps:[{a:-Math.PI/2,w:1.8}]}});

// ================= v10: the Act I on-ramp (Easy and Normal, story only; Hard keeps every v9 number)
// Drew could not beat Grizzlefang on Normal, and the casual-kid bot (a new player: about 0.4 s to react, a dodge only half
// the time) lost most Act I fights on Normal while some later bosses were easier than earlier ones. These knobs make the
// warnings readable, the openings longer and the crowds smaller, so each boss is a little harder than the one before.
// [Easy, Normal] pairs; the tables and the reasoning are in scratchpad v10/BAL.md. Health factors live in BAL_BOSS (e6).
const ONRAMP={
  // longer red warnings: the wind-up that starts in this state is this many times longer (DIFFS.wind still applies after)
  wind:{
    grizzlefang:{},   // his own wind-ups are in GRZ
    gnarl:{swipeW:[1.45,1.45],stompW:[1.2,1.2]},
    serpent:{riseW:[1.3,1.25]},
    gloamjaw:{chompW:[1.6,1.55],tongueW:[1.3,1.25],emergeW:[1.4,1.4]},
    cindervane:{slashW:[1.7,1.65],chargeAim:[1.25,1.15],quakeW:[1.25,1.15]}
  },
  // a longer pause after these attacks (the opening to hit back)
  rec:{ grizzlefang:{cleave:[1.3,1.4]}, gnarl:{swipeW:[1.3,1.25]}, cindervane:{slashW:[1.6,1.4]} },
  // a longer breather between attacks: his cooldown is this many times longer each time he goes back to the chase
  // (High Priest Morrow is the one boss that was too easy for his place in the act: he casts a little more often)
  cd:{ grizzlefang:[1.3,1.3], gnarl:[1.2,1.25], morrow:[0.85,0.75], gloamjaw:[1.7,1.7], greymane:[1.1,1.15], cindervane:[2.2,2.2] },
  serpentBolt:[0.75,0.8],    // the serpent's ice bolts fly slower (easier to step aside)
  gnarlRing:[0.8,0.8],       // Old Gnarl's stomp rings roll slower
  serpentUp:[1.5,1.3],       // the serpent stays up out of the water longer (the time to shoot it)
  serpentSpit:[2,2],         // ice bolts in each spit (v9: 3, or 5 once angry; angry adds one)
  serpentSweep:[1.3,1.25],   // a longer warning before its tail sweeps
  gloamChomp:[3.2,2.8],      // seconds between his chomps while he sits up in the muck (v9: 2)
  gloamSum:[1,1],            // kobolds he calls at half health (v9: 3)
  gloamSpit:[2,2],           // toxic blobs in each spit, one more once he is angry (v9: 3, then 5)
  gloamPool:[0.5,0.5],       // the green puddles they leave dry up this much sooner (v9: 4 s)
  cinderCombo:[2,2],         // slashes in Sir Cindervane's combo (v9: 3)
  cinderGuard:[0.55,0.5],    // share of a front hit that gets through his raised guard (v9: 0.15)
  guards:{ gate:[[['cultist',1]],[['cultist',1]]],     // site guards (v9: 2 knights and 2 cultists; a knight hits for a fifth of Ash's health)
    warcamp:[[['kobold',2]],[['kobold',2]]],         // (v9: 5 kobolds)
    mire:[[['kobold',2]],[['kobold',2]]] }            // (v9: 3 kobolds and 2 cultists)
};
function onrampOn(){ return G&&G.mode==='story'&&!foeDiff().hard; }
const orK=a=>byDiff(a[0],a[1],1);
function onrampWrap(type,post){ const base=AI[type]; if(!base) return;
  AI[type]=function(e,dt){ const t0=e.tele, s0=e.state, h0=G.hazards.length, p0=G.projectiles.length; base(e,dt); if(onrampOn()) post(e,dt,t0,s0,h0,p0); }; }
function onrampTele(e,t0,s0){
  const W=ONRAMP.wind[e.type], T=e.tele;
  if(W&&T&&T!==t0&&W[e.state]&&!T._or&&Math.abs((e.st||0)-T.dur)<0.03){ const k=orK(W[e.state]); T._or=1; e.st*=k; T.dur*=k; }
  const R=ONRAMP.rec[e.type];
  if(R&&e.state==='recover'&&s0!=='recover'&&R[s0]&&e.st>0) e.st*=orK(R[s0]);
}
for(const t of ['grizzlefang','gnarl','morrow','serpent','gloamjaw','greymane','cindervane']) onrampWrap(t,(e,dt,t0,s0,h0,p0)=>{
  onrampTele(e,t0,s0);
  const C=ONRAMP.cd[e.type]; if(C&&e.state==='chase'&&s0!=='chase'&&e.cd>0) e.cd*=orK(C);
  if(e.type==='serpent'){
    let n=0; const cap=orK(ONRAMP.serpentSpit)+(e.angry?1:0), drop=[];
    for(let i=p0;i<G.projectiles.length;i++){ const q=G.projectiles[i]; if(q.owner==='enemy'&&q.kind==='ice'&&!q._or){ q._or=1; if(++n>cap){ drop.push(q); continue; } const k=orK(ONRAMP.serpentBolt); q.vx*=k; q.vy*=k; } }
    if(drop.length) G.projectiles=G.projectiles.filter(q=>!drop.includes(q));
    if(e.state==='up'&&s0==='riseW') e.st*=orK(ONRAMP.serpentUp);
    const T=trialT(); if(T) for(const z of T.zones) if(z.kind==='sweep'&&!z._or){ z._or=1; z.delay*=orK(ONRAMP.serpentSweep); } }
  if(e.type==='gloamjaw') for(const q of G.pools) if(q.kind==='toxic'&&!q._or){ q._or=1; q.life*=orK(ONRAMP.gloamPool); q.max=q.life; }
  if(e.type==='gloamjaw'){ const cap=orK(ONRAMP.gloamSpit)+((e.bph>=2||e.hp<e.maxHp*0.5)?1:0); let n=0; const drop=[];
    for(let i=h0;i<G.hazards.length;i++){ const h=G.hazards[i]; if(h.kind==='blast'&&h.toxic&&++n>cap) drop.push(h); }
    if(drop.length) G.hazards=G.hazards.filter(h=>!drop.includes(h)); }
  if(e.type==='gnarl'){ const T=trialT(); if(T) for(const R of T.rings) if(!R._or&&R.dmg>0){ R._or=1; R.speed*=orK(ONRAMP.gnarlRing); } }
  if(e.type==='gloamjaw'&&e.chompCd>G.time+1.95&&e._orC!==e.chompCd){ e.chompCd=G.time+orK(ONRAMP.gloamChomp); e._orC=e.chompCd; }
  if(e.type==='cindervane'&&e.state==='slashW'&&s0==='slashW'&&e.tele&&e.tele!==t0&&(e.combo|0)>=orK(ONRAMP.cinderCombo)){ toRecover(e,1.0*orK(ONRAMP.rec.cindervane.slashW)); }
});
// Gloamjaw's bog kobolds and Sir Cindervane's guard: through their own hooks
{ const base=AI.gloamjaw; AI.gloamjaw=function(e,dt){ const was=!!e.summoned; if(!onrampOn()||was){ base(e,dt); return; }
    // the old code calls three at half health: keep the on-ramp count of their spawn runes and drop the rest
    const n0=G.hazards.length; base(e,dt);
    if(e.summoned){ let keep=orK(ONRAMP.gloamSum); const drop=new Set(); for(let i=n0;i<G.hazards.length;i++){ const h=G.hazards[i]; if(h.kind==='spawn'&&h.type==='kobold'){ if(keep>0) keep--; else drop.add(h); } } if(drop.size) G.hazards=G.hazards.filter(h=>!drop.has(h)); } }; }
{ const F=FOES.cindervane, prev=F.onHurt; F.onHurt=function(e,amt,o){
    if(prev){ const r=prev(e,amt,o); if(r===false) return false; if(typeof r==='number') amt=r; }
    if(onrampOn()&&e.shield&&e.blocking&&o&&o.src!=='burn'&&o.src!=='roar'&&o.src!=='ember'){ const fx=o.fx!=null?o.fx:player.x, fy=o.fy!=null?o.fy:player.y;
      if(Math.abs(angDiff(e.face,angTo(e.x,e.y,fx,fy)))<1.15) return amt*orK(ONRAMP.cinderGuard)/0.15; }
    return amt; }; }
// fewer guards at a site on Easy and Normal (read each time the guards are spawned)
// v11: and on Easy and Normal they wait for their boss. Nobody is out front as Ash walks into the war camp, the bog or the
// gate yard (real play: Grizzlefang's two guards had cost Ash 33 of his 116 health before the fight even began); they come
// running out of spawn runes beside the boss when his fight starts, so Ash meets the boss with the health he walked in with.
for(const k in ONRAMP.guards){ const s=SITES[k]; if(!s) continue; const full=s.guards;
  Object.defineProperty(s,'guards',{configurable:true,enumerable:true,get(){ return onrampOn()?[]:full; },set(v){ /* keep the on-ramp table */ }}); }
{ const base=startBossFight; startBossFight=function(k){ base(k);
    try{ const L=ONRAMP.guards[k], s=SITES[k];
      if(L&&s&&onrampOn()){ const list=byDiff(L[0],L[1],null), P=POI[s.poi];
        if(list&&list.length&&P){ const g=G.siteGuards[k]||(G.siteGuards[k]={id:'g_'+k,alive:0}); let i=0;
          for(const [type,n] of list) for(let j=0;j<n;j++,i++){ const q=spotNear(P.x,P.y,110,210);
            spawnRune(type,q.x,q.y,{level:P.level,aggro:true,camp:g,homeX:P.x,homeY:P.y,leash:700},1.9+i*0.35); g.alive++; } } } }catch(e){ console.error(e); } }; }

// ================= v11: fair crowds (story, Easy and Normal, Act I; Hard, the Arena and later acts keep their behaviour)
// Drew (an adult on keyboard and mouse) still found ordinary fights hard on Normal, and the casual-kid bot lost most of
// its health to a stream of kobold swings. Ash's 0.6 s of flinch time after a hit already swallows two swings that land
// together, so what hurts is how often a new attack starts near him. Now foes near Ash take turns: a foe may only start
// an attack some time after the last one started (longer while a boss is up, so his guards and summons do not chip at
// Ash while he watches the boss, and never while the boss's own red warning is up); one that has to wait keeps circling
// and tries again a moment later. Kobold and wolf warnings are a little longer, and bats, the one foe that struck with no
// warning, show a short red line first; a wolf pants for a moment after its lunge before it runs off, so it can be hit.
// The bot tables: scratchpad v11/SET_NOTES.md.
const CROWD={
  gap:[1.4,1.1],       // [Easy, Normal] seconds from one foe's attack start near Ash to the next
  bossGap:[2.4,1.9],   // the same for a boss's guards and summons while the boss is up
  most:[1,2],          // foes near Ash that may be winding up or striking at the same moment
  near:480,            // px from Ash that counts as near
  retry:[0.25,0.5],    // seconds before a foe that had to wait tries again
  batWarn:[0.36,0.3],  // seconds of red line before a bat swoops (before DIFFS.wind)
  wolfPant:[0.6,0.45], // a wolf that has lunged stands panting this long before it backs off (the moment to hit it)
  free:{wolf:1},       // without a boss, a wolf pack keeps its own rhythm: a wolf made to wait circles out of reach,
                       // which made pack fights longer and so more lunges landed (its pant and longer warning stay)
  // longer red warnings: the wind-up that starts in this state is this many times longer (after DIFFS.wind). A kobold's
  // swing warned for 0.33 s on Normal, less than a kid needs to see it and press roll.
  wind:{kobold:{windup:[1.35,1.25]}, wolf:{crouch:[1.25,1.15]}}
};
const CROWD_START={kobold:'windup',wolf:'crouch',knight:'windup',drakeling:'aim',cultist:'cast',bat:'swoopW'};
const CROWD_BUSY=new Set(['windup','strike','crouch','lunge','aim','charge','cast','swoop','swoopW']);
function crowdOn(){ return onrampOn()&&(G.act||1)===1; }
function crowdBusy(skip){
  const p=player, R2=CROWD.near*CROWD.near; let n=0;
  for(const o of G.enemies){ if(o===skip||o.dead||o.boss||!CROWD_START[o.type]) continue;
    if(CROWD_BUSY.has(o.state)&&dist2(o.x,o.y,p.x,p.y)<R2) n++; }
  return n;
}
// may e start its attack now? (e is near Ash and just tried)
function crowdOk(e){
  const b=G.boss, withBoss=!!(b&&!b.dead&&dist2(b.x,b.y,player.x,player.y)<900*900);
  if(!withBoss&&CROWD.free[e.type]) return true;
  if(withBoss&&b.tele) return false;
  const last=G._crowdT!=null&&G._crowdT<=G.time?G._crowdT:-99;
  if(G.time-last<orK(withBoss?CROWD.bossGap:CROWD.gap)) return false;
  return crowdBusy(e)<orK(CROWD.most);
}
// the bat's warning: hover with a red line for a moment, then the swoop the stock bat does
{ const base=AI.bat; if(base) AI.bat=function(e,dt){
    if(e.state==='swoopW'){ const p=player; e.dx=e.dy=0; e.face=turnTo(e.face,angTo(e.x,e.y,p.x,p.y),2.5*dt); e.st-=dt;
      if(e.st<=0){ e.tele=null; e.state='swoop'; e.st=0.34; e.hitP=false; } return; }
    const s0=e.state; base(e,dt);
    if(e.state==='swoop'&&s0!=='swoop'&&crowdOn()){ const w=orK(CROWD.batWarn); e.state='swoopW'; e.st=w; e.tele=newTele({shape:'line',len:150,w:e.r*2.4,dur:w}); }
  }; }
{ const base=runAI; runAI=function(f,e,dt){
    const s0=e.state; base(f,e,dt);
    if(e.type==='wolf'&&!e.boss){
      if(s0==='lunge'&&e.state==='recover'&&crowdOn()){ e._pant=orK(CROWD.wolfPant); e.st+=e._pant; }
      if(e._pant>0){ if(e.state!=='recover') e._pant=0; else { e._pant-=dt; e.dx=e.dy=0; } } }
    if(e.boss||s0===e.state||CROWD_START[e.type]!==e.state||!crowdOn()) return;
    if(dist2(e.x,e.y,player.x,player.y)<CROWD.near*CROWD.near){
      if(!crowdOk(e)){ e.state=s0; e.tele=null; e.st=0; e.cd=Math.max(e.cd||0,rand(CROWD.retry[0],CROWD.retry[1])); return; }
      G._crowdT=G.time; }
    const W=CROWD.wind[e.type], T=e.tele; if(W&&W[e.state]&&T&&!T._cw&&T.dur>0&&Math.abs((e.st||0)-T.dur)<0.03){ const k=orK(W[e.state]); T._cw=1; e.st*=k; T.dur*=k; }
  }; }

// ================= debug hooks
function foeSheet2d(type,rows,o){
  o=o||{}; const sc=o.scale||2, cw=o.cw||64, chh=o.ch||72, n=8, c=mkCanvas(n*cw*sc,rows.length*chh*sc), g=c.getContext('2d'), on=T3.on;
  T3.on=o.mode==='3d'; ctx.save();
  try{ for(let j=0;j<rows.length;j++) for(let i=0;i<n;i++){
      ctx.setTransform(sc,0,0,sc,0,0); ctx.clearRect(0,0,cw,chh); ctx.fillStyle=o.bg||'#6a8a4a'; ctx.fillRect(0,0,cw,chh);
      const r0=EDEF[type]?EDEF[type].r:14, e=Object.assign({id:-1-i,type,r:r0,t:1.3,state:'chase',st:0.2,dx:0,dy:0,vx:0,vy:0,speed:100,alpha:1,hp:100,maxHp:100,stun:0,cd:1,tint:null,elite:false,swung:0,blocking:false,snap:0,spawnIn:0,flash:0,aggro:false,boss:false,level:1,orbit:0},rows[j]);
      e.face=i*TAU/8; e._vf=e.face; e.x=cw/2; e.y=chh*0.66;
      ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+e.r*0.45,e.r*0.9,e.r*0.4,0,0,TAU); ctx.fill();
      drawEnemy(e);
      ctx.setTransform(1,0,0,1,0,0); g.drawImage(cvs,0,0,cw*sc,chh*sc,i*cw*sc,j*chh*sc,cw*sc,chh*sc);
      g.fillStyle='#fff'; g.font='12px sans-serif'; if(i===0) g.fillText(rows[j].label||rows[j].state||'',4,j*chh*sc+14);
    } }finally{ ctx.restore(); T3.on=on; }
  return c.toDataURL();
}
function foeSheet(type,o){
  o=o||{}; const F=FOES[type]||{}, rows=o.rows||F.sheet||[{state:'chase',label:'idle'},{state:'chase',dx:60,label:'walk'},{state:'windup',st:0.2,label:'windup'}];
  const out={};
  if(T3E[type]&&typeof t3FoeSheet==='function') out.d3=t3FoeSheet(type,rows,o);
  out.d2=foeSheet2d(type,rows,Object.assign({},o,{mode:'2d'}));
  return out;
}
function bossTest(k,o){
  o=o||{}; const s=SITES[k]; if(!s) return null; const P=POI[s.poi];
  if(G.fightSite) resetBoss();
  for(const e of G.enemies) if(!e.dead&&dist(e.x,e.y,P.x,P.y)<P.r+1000) e.dead=true;
  delete G.siteGuards[k]; G.bossDone[s.boss]=false; G.fightIntro=false;
  if(s.stage&&!reached(s.stage)&&window.__eb&&window.__eb.setStage) window.__eb.setStage(s.stage);
  if(s.stage&&window.__eb&&window.__eb.setStage&&o.stage!==false&&G.stage!==s.stage) window.__eb.setStage(s.stage);
  if(k==='summit') G.flags.gate=true;
  if(s.ward){ G.wards[s.ward]=false; G.wardReady[s.ward]=false; }
  player.x=P.x; player.y=P.y+P.r*0.48; player.kvx=player.kvy=0; player.dead=false; player.hp=player.maxHp; updateCam(0,true); G.chunkBurst=16;
  if(o.intro===false){ G.fightSite=k; startBossFight(k); }
  return {k,boss:s.boss,x:P.x,y:P.y,r:P.r};
}
function foeInfo(){
  const b=G.boss, f=G.bf;
  return {site:G.fightSite,boss:b&&!b.dead?{type:b.type,hp:Math.round(b.hp),max:Math.round(b.maxHp),state:b.state,bph:b.bph||0,phaseT:b.phaseT||0,invuln:!!b.invuln,stun:+(b.stun||0).toFixed(2),armor:b.armor||0,coat:b.coat||0,nst:b.nst||null,pst:b.pst||null,shielded:!!b.shielded,x:Math.round(b.x),y:Math.round(b.y),level:b.level}:null,
    arena:f&&f.A?{on:f.A.on,segs:f.A.segs.length,up:f.A.segs.filter(s=>s.h>0.99).length,cx:f.A.cx,cy:f.A.cy}:null,
    arenasUp:ARENAS.map(A=>({on:A.on,h:A.segs.reduce((m,s)=>Math.max(m,s.h),0),cols:A.cols.filter(c=>!c.off).length})),
    zones:(G.fz||[]).map(z=>({k:z.k,x:Math.round(z.x),y:Math.round(z.y),r:Math.round(z.r||z.R||0),out:z.pil?z.pil.filter(q=>q.out).length:0})),
    foes:G.enemies.filter(e=>!e.dead).map(e=>({type:e.type,level:e.level,boss:e.boss,inA:!!e.inArena}))};
}
window.__ebX=Object.assign(window.__ebX||{},{
  spawnFoe(type,x,y,o){ if(!EDEF[type]) return null; if(x==null){ x=player.x+90; y=player.y; } o=typeof o==='number'?{level:o}:(o||{}); const e=makeEnemy(type,x,y,Object.assign({aggro:true,homeX:x,homeY:y,leash:1500},o)); e.spawnIn=0; if(AREA) e.inArea=AREA.id; return e.id; },
  bossTest, foeSheet, foeInfo,
  foes:{defineFoe,defineBoss,bossPhase,FK,FM,FOES,BOSSES,ARENAS,FZK,FZP,foeDiff,byDiff,bdmg,foeHit,foeBumped,arenaBuild,arenaRise,arenaSink,arenaIn,bossCtx,fzAdd,foeSheet2d,
    hit(src,amt,o){ const e=(o&&o.id)?G.enemies.find(q=>q.id===o.id):G.boss; if(!e||e.dead) return 0; return damageEnemy(e,amt,Object.assign({src},o||{})); },
    roar(){ player.roar=100; doRoar(); },
    swing(){ const p=player; let n=0; for(const pr of G.projectiles){ if(pr.owner!=='enemy'||pr.dead) continue; if(dist(p.x,p.y,pr.x,pr.y)<110){ reflectProj(pr); n++; } } return n; },
    face(e){ e=e||G.boss; if(e) player.facing=angTo(player.x,player.y,e.x,e.y); },
    // debug only: runs a snippet inside the game's scope, so the FOES.md examples run exactly as written (tests)
    devEval(src){ return eval(src); },
    // runs the game sim for sec seconds of game time right now (no drawing), for scripted fights in tests
    step(sec,dt,each){ dt=dt||1/30; let t=0;
      while(t<sec){ t+=dt;
        if(scene==='play'){ updateTimers(dt); if(scene==='play'){ if(G.slowT>0){ G.slowT-=dt; if(G.slowT<=0) G.timeScale=1; } update(dt*G.timeScale); } }
        else if(scene==='dying'){ dyingT-=dt; liteUpdate(dt); if(dyingT<=0) showDeath(); }
        else if(scene==='dialogue'){ updateDialogue(dt); liteUpdate(dt); }
        if(each&&each(t)===true) break; }
      return t; },
    G:()=>G}
});
