
// ================= player
function makePlayer(){
  return {x:2660,y:9450,r:14,facing:-Math.PI/2,t:0,hp:100,hpShow:100,maxHp:100,energy:100,maxEnergy:100,roar:0,
    stamina:100,maxStamina:100,stamDelay:0,level:1,xp:0,potions:3,potionsMax:3,drinkT:0,sprinting:false,lastHurt:-99,
    kvx:0,kvy:0,dashT:0,dashCd:0,dashDir:0,iframes:0,hurtFlash:0,atkCd:0,combo:0,comboTimer:0,
    swingT:0,swingDur:0.15,swingDir:0,swingSide:1,swingHit:null,swingFin:false,swingHitstop:false,
    breathing:false,breathTick:0,regenDelay:0,exhausted:false,emberT:0,ghostT:0,ghosts:[],moving:false,walkT:0,stepT:0,dead:false,
    stats:{speed:200,slash:15,range:60,atkSpeed:1,fire:1,fireCost:32,energyRegen:24,rollCost:24,staminaRegen:34,roarRate:1,roarDmg:45,killHeal:0,emberDash:false,phoenix:0,phoenixMax:0,flameEdge:false,dmgMul:1,armor:1},
    ups:{}};
}
function snapshotPlayer(){ const p=player; return JSON.parse(JSON.stringify({maxHp:p.maxHp,maxEnergy:p.maxEnergy,maxStamina:p.maxStamina,stats:p.stats,ups:p.ups,level:p.level,xp:p.xp,potionsMax:p.potionsMax})); }
function restorePlayer(s){
  const p=makePlayer(); if(!s) return p;
  p.maxHp=s.maxHp; p.maxEnergy=s.maxEnergy; p.maxStamina=s.maxStamina||100; p.stats=Object.assign(p.stats,s.stats); p.ups=s.ups||{};
  p.level=s.level||1; p.xp=s.xp||0; p.potionsMax=s.potionsMax||3;
  p.hp=p.hpShow=p.maxHp; p.energy=p.maxEnergy; p.stamina=p.maxStamina; p.potions=p.potionsMax; p.stats.phoenix=p.stats.phoenixMax||0;
  return p;
}
// v9: the XP table, health per level and damage per level live in BAL (e6_balance.js)
const xpNeed=l=>balXpNeed(l);
function gainXp(n){
  const p=player; if(G.mode!=='story') return;
  p.xp+=n;
  if(p.level>=BAL.maxLevel){ p.xp=Math.min(p.xp,xpNeed(p.level)); return; }
  while(p.level<BAL.maxLevel&&p.xp>=xpNeed(p.level)){
    p.xp-=xpNeed(p.level); p.level++; p.maxHp+=BAL.hpLv; p.stats.dmgMul=balLvlDmg(p.level); p.maxStamina+=3; p.hp=p.maxHp;
    const bless=p.level%2===1; if(bless) G.pendingBless++; onLevelUp(p.level);
    jingle('levelup','level'); setBanner(`Level ${p.level}`,bless?'Health and strength increased. A blessing awaits.':'Health, strength and stamina increased.',2.4);
    emit(p.x,p.y,40,{col:'255,210,120',ang:-Math.PI/2,spread:1.4,smin:40,smax:200,lmin:.5,lmax:1.1,zmin:1.5,zmax:3,rise:30});
  }
}
const PT={};
function footprint(x,y,f,wt){
  const c=CHUNKS.get(ckey(Math.floor(x/CH),Math.floor(y/CH))); if(!c) return;
  const side=Math.sin(wt*10)>0?1:-1, px=x+Math.cos(f+Math.PI/2)*4*side, py=y+Math.sin(f+Math.PI/2)*4*side;
  const g=c.g; g.save(); g.translate(px,py); g.rotate(f); g.fillStyle='rgba(120,140,170,.35)'; g.beginPath(); g.ellipse(0,0,4,2.4,0,0,TAU); g.fill(); g.restore();
}
function drawAshHat(){ if(G&&G.hat) drawHatShape(9,0,G.hat,0.95); }
function useStamina(n){ const p=player; if(p.stamina<n*0.5) return false; p.stamina=Math.max(0,p.stamina-n); p.stamDelay=p.stamina<=0?1.0:0.55; return true; }
function nearestEnemy(x,y,maxD){
  let best=null,bd=maxD*maxD;
  for(const e of G.enemies){ if(e.dead||e.invuln||e.spawnIn>0||e.alpha<0.3||e.passive) continue; const d=dist2(x,y,e.x,e.y); if(d<bd&&ashSees(e)){bd=d;best=e;} }   // (v12: only foes Ash can see)
  return best;
}
function updatePlayer(dt,inp){
  const p=player, st=p.stats;
  p.t+=dt; p.dashCd-=dt; p.iframes-=dt; p.hurtFlash-=dt; p.atkCd-=dt; p.comboTimer-=dt; G.dashBuf-=dt; G.roarBuf-=dt;
  const moving=Math.abs(inp.mx)+Math.abs(inp.my)>0.05; p.inMx=inp.mx; p.inMy=inp.my;
  // aim (UX build): keyboard and mouse face the way Ash walks (WASD or arrows) and keep that facing when he stops;
  // attacks and fire breath turn toward the best foe in a 45 degree cone in front (aimAssist in a6b_weapons.js).
  // Settings "Aim with the mouse" faces the pointer instead. Controllers aim with the right stick, touch auto-aims.
  const wpn=curWeapon(), ranged=wpn==='bow'||wpn==='boomerang', stickAim=Math.hypot(inp.aimX||0,inp.aimY||0)>0.3;
  const mouseAim=settings.mouseAim&&!usingTouch&&!inp.pad&&aimMode==='mouse';
  // something else turned Ash (the bow and hammer turn toward the aim, cutscenes, debug hooks): he keeps that facing
  if(p.faceGoal==null||(p.fOut!=null&&p.facing!==p.fOut&&!moving)) p.faceGoal=p.facing;
  if(moving&&!stickAim){
    // releasing a diagonal (W+D) lets go of one key a frame before the other: keep the diagonal, not the last key
    const a=Math.atan2(inp.my,inp.mx);
    if(p.mvDir==null||Math.abs(angDiff(p.mvDir,a))>0.05){ p.mvPrev=p.mvDir; p.mvDir=a; p.mvT=0; } else p.mvT+=dt;
    p.faceGoal=a;
  }else if(p.mvDir!=null){ if(!stickAim&&!inp.pad&&!usingTouch&&p.mvT<0.09&&p.mvPrev!=null) p.faceGoal=p.mvPrev; p.mvDir=null; p.mvPrev=null; }
  let aim=p.faceGoal;
  if(stickAim) aim=Math.atan2(inp.aimY,inp.aimX);
  else if(usingTouch){ const tg=nearestEnemy(p.x,p.y,ranged?430:320); if(tg) aim=angTo(p.x,p.y,tg.x,tg.y); }
  else if(mouseAim){ const w=toWorld(mouse.x,mouse.y); aim=Math.atan2(w.y-p.y,w.x-p.x); }
  const fighting=inp.attack||inp.fire||p.breathing||!!p.bow||!!p.ham;
  if(!usingTouch&&!mouseAim){
    if(stickAim){ if(ranged) aim=wAimAssist(aim); }
    else if(fighting){ const cf=inp.attack&&!inp.fire&&!p.breathing?clickFoe(ranged?620:Math.max(170,wReach(wpn)+110)):null; aim=cf?angTo(p.x,p.y,cf.x,cf.y):aimAssist(aim,inp.fire||p.breathing?'breath':wpn); }
  }
  p.aim=aim;
  if(stickAim||(usingTouch&&!moving)) p.faceGoal=aim;   // letting go of the right stick (or a touch target) keeps that facing
  if(p.swingT<=0){
    const free=inp.attack&&p.atkCd<=0&&p.dashT<=0&&p.drinkT<=0;
    if(p.breathing) p.facing=turnTo(p.facing,aim,9*dt);
    else if(mouseAim||free) p.facing=aim;   // a swing or throw goes exactly where it is aimed
    else if(p.sprinting&&moving&&!stickAim) p.facing=turnTo(p.facing,aim,14*dt);
    else p.facing+=angDiff(p.facing,aim)*(1-Math.exp(-dt*24));   // a fast ease, never a snap
    if(!moving&&fighting) p.faceGoal=p.facing;   // standing still, he keeps facing the foe he turned to
  }
  p.fOut=p.facing;
  // stamina
  if(p.stamDelay>0) p.stamDelay-=dt; else p.stamina=Math.min(p.maxStamina,p.stamina+st.staminaRegen*dt);
  // roll
  if(G.dashBuf>0&&p.dashCd<=0&&p.dashT<=0&&p.drinkT<=0&&!airborne()&&!((p.z||0)>0)&&useStamina(st.rollCost)){
    G.dashBuf=0; p.dashDir=moving?Math.atan2(inp.my,inp.mx):p.facing; p.dashT=0.3; p.dashCd=0.38;
    p.iframes=Math.max(p.iframes,0.32); p.swingT=0; SFX.play('roll');
    emit(p.x,p.y,8,{col:'150,130,110',glow:false,smin:30,smax:90,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:7});
  }
  // drink
  if(inp.drink&&p.potions>0&&p.drinkT<=0&&p.dashT<=0&&p.hp<p.maxHp){ p.potions--; p.drinkT=0.9; p.drinkPool=p.maxHp*0.45*(G.diff.pot||G.diff.heal)*(p.stats.drinkMul||1); SFX.play('drink'); }
  if(p.drinkT>0){ const k=Math.min(dt,p.drinkT)/0.9; heal(p.drinkPool*k,true); p.drinkT-=dt; if(Math.random()<0.4) emit(p.x+rand(-8,8),p.y+rand(-8,8),1,{col:'140,255,170',ang:-Math.PI/2,spread:0.5,smin:20,smax:50,lmin:.4,lmax:.7,zmin:1.5,zmax:2.5,rise:20}); }
  let vx=0,vy=0;
  p.sprinting=false;
  // jump, double jump, take off, land, slam (a6c_moves.js)
  const air=movesPre(dt,inp);
  if(p.dashT>0){
    p.dashT-=dt; const k=(0.55+0.45*(p.dashT/0.3))*(st.rollK||1); vx=Math.cos(p.dashDir)*560*k; vy=Math.sin(p.dashDir)*560*k;
    p.ghostT-=dt; if(p.ghostT<=0){ p.ghostT=0.05; p.ghosts.push({x:p.x,y:p.y,f:p.facing,a:0.6}); }
    if(st.emberDash){ p.emberT-=dt; if(p.emberT<=0){ p.emberT=0.06; G.pools.push({x:p.x,y:p.y,r:22,life:1.6,max:1.6,owner:'player',tick:0}); } }
  }else if(air){
    // in the air: a jump keeps its momentum, flight is fast; no bog, no snow drag, no sprint cost
    [vx,vy]=movesAirVel(dt,inp); p.slowT=(p.slowT||0)-dt;
  }else{
    const here=T(p.x,p.y,PT); p.slowT=(p.slowT||0)-dt;
    let spd=st.speed*(p.breathing?0.55:1)*(p.swingT>0?0.55:1)*(p.drinkT>0?0.45:1)*(here.bog>0.5?(G.flags&&G.flags.perk_bog?0.86:0.72):1)*(here.b===5&&here.road<=0?(G.flags&&G.flags.perk_snow?1.02:0.93):1)*(p.slowT>0?0.6:1)*terrSpeed(here);
    const skim=p.onWater&&canSkim();
    if(inp.sprint&&moving&&!p.breathing&&p.swingT<=0&&p.drinkT<=0&&p.stamina>1){ p.sprinting=true; spd*=1.55*(p.onWater?(skim?1.22:1.1):1); if(!skim){ p.stamina=Math.max(0,p.stamina-16*(st.sprintK||1)*dt); p.stamDelay=Math.max(p.stamDelay,0.35); } }
    vx=inp.mx*spd; vy=inp.my*spd;
    // cave ice: Ash slides
    if(AREA&&AREA.cave&&AREA.cave.typ){ const c=AREA.cave, i=Math.floor((p.x-AREA.x0)/c.cell), j=Math.floor((p.y-AREA.y0)/c.cell); if(c.typ[j*c.w+i]===2){ const k=1-Math.exp(-dt*1.8); p.ivx=lerp(p.ivx||0,vx*1.1,k); p.ivy=lerp(p.ivy||0,vy*1.1,k); vx=p.ivx; vy=p.ivy; } else { p.ivx=vx; p.ivy=vy; } }
    else if(!AREA&&here.ice>0.5){ const k=1-Math.exp(-dt*1.8); p.ivx=lerp(p.ivx||0,vx*1.1,k); p.ivy=lerp(p.ivy||0,vy*1.1,k); vx=p.ivx; vy=p.ivy; } else if(!AREA&&p.y>=BAND){ p.ivx=vx; p.ivy=vy; }
  }
  if(!air) movesTryJump(vx,vy,inp);
  for(const g of p.ghosts) g.a-=dt*3; if(p.ghosts.length) p.ghosts=p.ghosts.filter(g=>g.a>0);
  const kd=Math.exp(-dt*9); p.kvx*=kd; p.kvy*=kd;
  const ox=p.x, oy=p.y;
  p.x+=(vx+p.kvx)*dt; p.y+=(vy+p.kvy)*dt;
  collideObs(p); boundE(p); terrainFix(p,ox,oy);
  movesPost(dt,ox,oy,inp);
  if(G.noSwordT>0) G.noSwordT-=dt;
  p.moving=moving&&!(p.z>0)&&!p.flying; if(p.moving){ p.walkT+=dt*(p.sprinting?1.5:1); p.stepT-=dt*(p.sprinting?1.6:1); if(p.stepT<=0){ p.stepT=0.32; SFX.play('step',p.sprinting?1.4:1); if((PT.b===5||footKind(PT))&&PT.road<=0&&!p.onWater) footprint(p.x,p.y,p.facing,p.walkT); if(PT.bog>0.4&&Math.random()<0.5) G.ripples.push({x:p.x,y:p.y+4,t:0,max:0.8,r:10}); if(p.sprinting&&!p.onWater) emit(p.x,p.y+6,2,{col:'140,120,95',glow:false,smin:10,smax:40,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:5}); } }
  // sword and the other weapons (switching, swings, the hammer, the bow and the boomerang): a6b_weapons.js
  updateWeapon(dt,inp);
  // breath
  if(p.exhausted&&p.energy>=25) p.exhausted=false;
  const want=inp.fire&&p.dashT<=0&&p.swingT<=0&&!p.exhausted&&p.drinkT<=0;
  if(want&&p.energy>0){ p.breathing=true; p.energy-=st.fireCost*dt; p.regenDelay=0.5; if(p.energy<=0){ p.energy=0; p.exhausted=true; } doBreath(dt); }
  else p.breathing=false;
  if(!p.breathing){ if(p.regenDelay>0) p.regenDelay-=dt; else p.energy=Math.min(p.maxEnergy,p.energy+st.energyRegen*dt); }
  SFX.setFire(p.breathing);
  if(G.roarBuf>0&&p.roar>=100){ G.roarBuf=0; doRoar(false); }
  if(G.fishing) updateFishing(dt,inp);
  else if(inp.use&&G.prompt){ const pr=G.prompt; G.prompt=null; pr.act(); }
  // out-of-combat recovery
  if(G.time-p.lastHurt>6&&!G.inCombat&&p.hp<p.maxHp) p.hp=Math.min(p.maxHp,p.hp+1.6*dt);
}
function startSwing(){
  const p=player, st=p.stats, w=curWeapon();
  if(w!=='sword') return startWeaponSwing(w);
  p.combo=p.comboTimer>0&&p.comboW==='sword'?(p.combo+1)%3:0; p.comboW='sword'; p.swingW='sword';
  const fin=p.combo===2, spin=fin&&hasSkill('spin')>0;
  p.swingFin=fin; p.swingSpin=spin; p.swingDur=spin?0.3:fin?0.22:0.15; p.swingT=p.swingDur; p.swingDir=p.facing; p.swingSide=p.combo===1?-1:1;
  p.swingHit=new Set(); p.swingHitstop=false; p.swingObj=false;
  p.atkCd=(spin?0.5:fin?0.44:0.27)/st.atkSpeed; p.comboTimer=p.atkCd+0.4;
  const lunge=spin?80:fin?220:110; p.kvx+=Math.cos(p.facing)*lunge; p.kvy+=Math.sin(p.facing)*lunge;
  SFX.play(fin?'slash3':'slash');
  if(fin&&st.flameEdge) shoot(p.x+Math.cos(p.facing)*20,p.y+Math.sin(p.facing)*20,p.facing,520,18,st.slash*1.3*st.dmgMul*(st.wpnMul||1),'wave','player',{life:0.75,pierce:true});
}
function swingHits(){
  const p=player; if(p.swingW&&p.swingW!=='sword') return weaponSwingHits();
  const st=p.stats, fin=p.swingFin, spin=p.swingSpin, range=st.range*(spin?1.2:fin?1.25:1), half=spin?Math.PI:fin?1.3:1.05;
  let any=false;
  for(const e of G.enemies){
    if(e.dead||p.swingHit.has(e.id)||e.invuln||e.spawnIn>0||e.passive||!foeInView(e)) continue;
    let best=null;
    for(const c of hitCircles(e)) if(inArcC(p.x,p.y,p.swingDir,range,half,c)&&(!best||c.m>best.m)) best=c;
    if(!best) continue;
    p.swingHit.add(e.id); any=true;
    wStrike(e,best,spin?1.7:fin?1.8:1,'sword',{kb:spin?340:fin?380:170,ka:spin?angTo(p.x,p.y,e.x,e.y):p.swingDir});
    const a=angTo(best.x,best.y,p.x,p.y);
    emit(best.x+Math.cos(a)*best.r,best.y+Math.sin(a)*best.r,fin?14:7,{col:'255,235,200',smin:120,smax:340,lmin:.1,lmax:.22,zmin:1.2,zmax:2.6,drag:6});
  }
  if(!p.swingObj){ p.swingObj=true; areaObjHit(p.x+Math.cos(p.swingDir)*range*0.6,p.y+Math.sin(p.swingDir)*range*0.6,spin?range:range*0.55,'slash'); }
  if(G.mode==='story') swingBreakables(p.x,p.y,p.swingDir,range,half);
  if(any&&!p.swingHitstop){ p.swingHitstop=true; hitstop=Math.max(hitstop,fin?0.07:0.035); shake(fin?5:2); SFX.play('hit'); }
  for(const pr of G.projectiles){
    if(pr.owner!=='enemy'||pr.dead) continue;
    if(dist(p.x,p.y,pr.x,pr.y)<range+14&&Math.abs(angDiff(p.swingDir,angTo(p.x,p.y,pr.x,pr.y)))<half+0.35) reflectProj(pr);
  }
}
function aimTarget(){
  const p=player; let best=null,bs=1e9;
  for(const e of G.enemies){
    if(e.dead||e.invuln||e.spawnIn>0||e.passive) continue;
    const d=dist(p.x,p.y,e.x,e.y); if(d>720) continue;
    const da=Math.abs(angDiff(p.facing,angTo(p.x,p.y,e.x,e.y))); if(da>0.8||!ashSees(e)) continue;
    const s=d*(1+da)*(e.boss?0.6:1); if(s<bs){bs=s;best=e;}
  }
  return best;
}
function reflectProj(pr){
  const t=aimTarget(), sp=Math.max(430,Math.hypot(pr.vx,pr.vy)*1.5);
  const a=t?angTo(pr.x,pr.y,t.type==='vorlaxis'?t.headX:t.x,t.type==='vorlaxis'?t.headY:t.y):player.facing;
  pr.owner='player'; pr.vx=Math.cos(a)*sp; pr.vy=Math.sin(a)*sp; pr.dmg=Math.max(18,pr.dmg*2.5)*player.stats.dmgMul*(player.stats.wpnMul||1); pr.life=2; pr.homing=0; pr.reflected=true;
  if(settings.nums) ftext(pr.x,pr.y-10,'REFLECT','#8fe6ff',12);
  SFX.play('block'); emit(pr.x,pr.y,8,{col:'140,230,255',smin:80,smax:220,lmin:.15,lmax:.3,zmin:1.5,zmax:3,drag:5});
}
function doBreath(dt){
  if(player.flying) return breathFly(dt);   // from the sky the fire pours down (a6c_moves.js)
  const p=player, ang=p.facing, mx=p.x+Math.cos(ang)*16, my=p.y+Math.sin(ang)*16;
  // v12: the flame stops at the first wall (each puff along its own line) and splashes on it
  const reach=breathCut(ang);
  breathPuffs(mx,my,ang,4,{kind:'fire',spread:0.28,smin:360,smax:460,lmin:.35,lmax:.48,zmin:3,zmax:6,grow:22});
  if(Math.random()<0.3){ const s=Math.min(120,Math.max(10,reach-20)); emit(mx+Math.cos(ang)*s,my+Math.sin(ang)*s,1,{col:'70,60,55',glow:false,ang:-Math.PI/2,spread:0.6,smin:10,smax:40,lmin:.8,lmax:1.4,zmin:4,zmax:8,grow:10,drag:1}); }
  if(reach<170) breathSplash(mx,my,ang,reach,dt,'fire');
  breathIgnite(mx,my,ang,dt);
  p.breathTick-=dt;
  if(p.breathTick<=0){
    p.breathTick=0.1;
    for(const e of G.enemies){
      if(e.dead||e.invuln||e.spawnIn>0||e.passive||!foeInView(e)) continue;
      for(const c of hitCircles(e)){
        if(inArcC(mx,my,ang,175,0.45,c)){
          damageEnemy(e,4.6*p.stats.fire*p.stats.dmgMul*rand(0.9,1.1),{src:'fire',kb:25,ka:angTo(p.x,p.y,e.x,e.y),mult:c.m>1?1.2:1});
          if(!e.dead&&!e.lastBlocked){ e.burnT=2.2; e.burnDps=Math.max(e.burnDps,5*p.stats.fire*p.stats.dmgMul); }
          break;
        }
      }
    }
  }
}
// ---------- v12: the breath and walls
// how far a breath line at angle a reaches from Ash's mouth (16 px out) before something solid, up to L
function breathRay(a,L){ const p=player, D=(L||175)+16; return clamp(losHitT(p.x,p.y,p.x+Math.cos(a)*D,p.y+Math.sin(a)*D,0,ashLosO())-16,0,L||175); }
const BRW={t:-1,reach:175,splT:0};
function breathCut(ang){ BRW.t=G.time; BRW.reach=breathRay(ang,175); return BRW.reach; }
// flame puffs like emit(), each one cut where its own line meets a wall (drag 1: a puff of speed s and life t travels
// s*(1-e^-t), so a wall at R px gives it life -ln(1-R/s))
function breathPuffs(mx,my,ang,n,o){
  const P=G.particles;
  for(let i=0;i<n;i++){
    if(P.length>950) return;
    const a=ang+rand(-o.spread,o.spread), s=rand(o.smin,o.smax); let life=rand(o.lmin,o.lmax);
    const R=breathRay(a,175), far=s*(1-Math.exp(-life));
    if(R<far) life=R<s*0.98?Math.max(0.02,-Math.log(1-R/s)):life;
    P.push({x:mx,y:my,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,max:Math.max(life,o.lmin*0.6),size:rand(o.zmin,o.zmax),grow:o.grow||0,drag:1,kind:o.kind||'fire',col:o.col||'255,190,90',glow:o.glow!==false,rise:0,al:o.alpha||1});
  }
}
// where the flame meets a wall: a small splash that rolls back and to the sides, and a curl of smoke
function breathSplash(mx,my,ang,reach,dt,kind){
  const x=mx+Math.cos(ang)*reach, y=my+Math.sin(ang)*reach;
  BRW.splT-=dt; if(BRW.splT>0) return; BRW.splT=0.03;
  const back=ang+Math.PI, moon=kind==='moon';
  for(let i=0;i<2;i++){ const a=back+rand(-1.35,1.35); emit(x-Math.cos(ang)*4,y-Math.sin(ang)*4,1,moon?{kind:'moon',col:'230,236,255',ang:a,spread:0,smin:60,smax:170,lmin:.12,lmax:.26,zmin:2,zmax:4,grow:12,drag:4,alpha:0.8}:{kind:'fire',ang:a,spread:0,smin:60,smax:170,lmin:.12,lmax:.26,zmin:2.5,zmax:4.5,grow:14,drag:4}); }
  if(Math.random()<0.3) emit(x,y,1,{col:moon?'200,210,240':'255,230,170',ang:back,spread:1.4,smin:80,smax:200,lmin:.1,lmax:.2,zmin:1,zmax:1.8,drag:5});
  if(!moon&&Math.random()<0.12) emit(x,y-6,1,{col:'70,60,55',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:30,lmin:.6,lmax:1,zmin:3,zmax:6,grow:8,drag:1});
}
// every stock breath test (the cone inArcC(mouth,facing,175,0.45) that foes, braziers, lanterns, roots, torches, Ward
// stones, ice and the rest use, and the sky cone (180,0.5) while flying) also needs a clear line from Ash to the thing
function breathSees(x,y,r){ const p=player; return losClear(p.x,p.y,x,y,r||0,ashLosO()); }
// the same for Ash's swings (LOSV.melee is set while swingHits runs): pots, barrels, crystals and switches behind a wall
// are out of reach of the sword, daggers and spear
{ const base=inArcC; inArcC=function(ox,oy,ang,range,half,c){
    if(!base(ox,oy,ang,range,half,c)) return false;
    const p=player; if(LOSV.melee&&c&&p) return breathSees(c.x,c.y,c.r||0);
    if(!c||!p||!p.breathing) return true;
    if(!((range===175&&half===0.45&&!p.flying)||(range===180&&half===0.5&&p.flying))) return true;
    return breathSees(c.x,c.y,c.r||0);
  }; }
{ const base=swingHits; swingHits=function(){ LOSV.melee=true; try{ return base.apply(this,arguments); } finally{ LOSV.melee=false; } }; }
function doRoar(free){
  const p=player; if(!free) p.roar=0;
  SFX.play('roar'); shake(14); flashA=0.25; flashCol='255,170,80'; p.iframes=Math.max(p.iframes,0.5);
  G.rings.push({x:p.x,y:p.y,rad:16,max:270,speed:950,thick:34,owner:'player',hit:new Set(),dmg:p.stats.roarDmg*p.stats.dmgMul});
  if(AREA&&AREA.rooms) caveRoar(p.x,p.y,270);
  for(const pr of G.projectiles) if(pr.owner==='enemy'&&dist(p.x,p.y,pr.x,pr.y)<300){ pr.dead=true; emit(pr.x,pr.y,5,{col:'255,200,120',smin:40,smax:120,lmin:.2,lmax:.4}); }
  emit(p.x,p.y,40,{col:'255,190,100',smin:200,smax:520,lmin:.3,lmax:.6,zmin:2,zmax:5});
}
function heal(amt,quiet){
  const p=player; if(p.dead) return;
  const before=p.hp; p.hp=Math.min(p.maxHp,p.hp+amt);
  if(!quiet&&settings.nums&&p.hp>before+0.5) ftext(p.x,p.y-24,'+'+Math.round(p.hp-before),'#8dff9a',14);
}
function hurtPlayer(amt,sx,sy,kb){
  const p=player;
  if(!p||p.dead||p.iframes>0||scene!=='play'||(window.__eb&&window.__eb.god)) return false;
  if(p.flying&&!airHitOK(sx,sy)) return false;   // ground melee cannot reach Ash in the sky (projectiles and flying foes can)
  if(!hurtSeen(sx,sy)) return false;              // v12: nothing hurts Ash through a wall
  const dmg=Math.max(1,Math.min(Math.round(amt*G.diff.dmg*(p.stats.armor||1)),G.diff.cap?Math.ceil(p.maxHp*G.diff.cap):1e9));
  p.hp-=dmg; p.iframes=0.6; p.hurtFlash=0.12; G.hurtVig=0.6; G.combo=0; p.lastHurt=G.time; p.drinkT=0;
  if(kb){ const a=angTo(sx,sy,p.x,p.y); p.kvx+=Math.cos(a)*kb; p.kvy+=Math.sin(a)*kb; }
  shake(7); hitstop=Math.max(hitstop,0.05); SFX.play('hurt');
  if(settings.nums) ftext(p.x,p.y-22,'-'+dmg,'#ff6a5a',15);
  emit(p.x,p.y,8,{col:'255,140,80',smin:60,smax:180,lmin:.2,lmax:.4,zmin:1.5,zmax:3});
  if(p.hp<=0){
    if(p.stats.phoenix>0){ p.stats.phoenix=0; p.hp=Math.ceil(p.maxHp*0.5); p.iframes=2; doRoar(true); flashA=0.6; flashCol='255,220,140'; setBanner('Phoenix Ember','You rise from the ashes',2.2); }
    else{ p.hp=0; playerDied(); }
  }
  return true;
}

// ================= combat helpers
function hitCircles(e){
  if(e.type==='vorlaxis') return [{x:e.x,y:e.y,r:e.r,m:1},{x:e.headX,y:e.headY,r:27,m:e.staggered?2:1.4}];
  return [{x:e.x,y:e.y,r:e.r,m:1}];
}
function inArcC(ox,oy,ang,range,half,c){
  const d=dist(ox,oy,c.x,c.y); if(d-c.r>range) return false;
  if(d<c.r) return true;
  return Math.abs(angDiff(ang,angTo(ox,oy,c.x,c.y)))<=half+Math.atan2(c.r,Math.max(d,1));
}
function inCone(ox,oy,ang,len,half,tx,ty,tr){ return inArcC(ox,oy,ang,len,half,{x:tx,y:ty,r:tr}); }

// ================= walls between two points (v12 WALLS): nothing hits, hurts or notices through a wall
// losHitT(x0,y0,x1,y1,tr,o) is how far along the line from (x0,y0) toward (x1,y1) the first solid thing stands (Infinity
// when there is none); losClear(...) is true when there is none. What is solid:
//   caves and dungeons: wall cells (a cave pool is low water, not a wall), shut doors and gates, push blocks and the solid
//     things the caves add: the same cells that stop shots (areaBlocked read with C2.proj set, so shafts, water, lava,
//     pits and raised floors stay open);
//   anywhere: colliders that stop arrows (buildings, Emberhollow's wall and its shut gates, pillars, big trunks, statues,
//     crates); colliders marked low (fences, hedges, rocks, wells) or noProj are flown over, as arrows fly over them, and
//     thin round ones (under 16 px: tree trunks, posts, lamps, braziers) are seen and breathed past (arrows still stick in them);
//   outdoors: ground higher than the source (a cliff or terrace face seen from below; ramps never block).
// A house is one room, so it is always clear. Not tested: the first 2 px, the last tr px before the target (its own body),
// the cave cells the two ends stand in (things set into a wall: a crack, a vent, a torch), and a collider that holds
// either end.
// o: {lv: the source's level (default: where it stands), lt: the target's level (a sight line: only ground higher than
// both ends blocks), fly: true (to or from the sky outdoors: colliders do not count)}.
const LOSV={stamp:0};
function losHitT(x0,y0,x1,y1,tr,o){
  const dx=x1-x0, dy=y1-y0, D=Math.hypot(dx,dy), end=D-(tr||0)*0.9;
  if(!(end>2)) return Infinity;
  const ux=dx/D, uy=dy/D;
  let best=Infinity;
  if(x0>=IZX-50||x1>=IZX-50){
    const A=AREA; if(!A||A.kind==='house') return Infinity;
    if(A.cave) best=losCaveT(A,x0,y0,x1,y1,ux,uy,end);
    return Math.min(best,losColT(x0,y0,ux,uy,end,x1,y1));
  }
  if(!(o&&o.fly)) best=losColT(x0,y0,ux,uy,end,x1,y1);
  return Math.min(best,losElevT(x0,y0,ux,uy,Math.min(end,best),o));
}
function losClear(x0,y0,x1,y1,tr,o){ return losHitT(x0,y0,x1,y1,tr,o)===Infinity; }
// cave cells, 8 px steps (each cell is read once)
function losCaveT(A,x0,y0,x1,y1,ux,uy,end){
  const c=A.cave, cs=c.cell, w=c.w, h=c.h, gx=A.x0, gy=A.y0;
  const ti=Math.floor((x1-gx)/cs), tj=Math.floor((y1-gy)/cs), tk=ti>=0&&tj>=0&&ti<w&&tj<h?tj*w+ti:-2;
  const oi=Math.floor((x0-gx)/cs), oj=Math.floor((y0-gy)/cs), ok=oi>=0&&oj>=0&&oi<w&&oj<h?oj*w+oi:-2;
  let lk=-3; C2.proj++;
  try{
    for(let s=2;s<end;s+=8){
      const x=x0+ux*s, y=y0+uy*s, i=Math.floor((x-gx)/cs), j=Math.floor((y-gy)/cs);
      if(i<0||j<0||i>=w||j>=h) return s;
      const k=j*w+i; if(k===lk) continue; lk=k; if(k===tk||k===ok) continue;
      if(c.grid[k]===1){ if(c.typ&&c.typ[k]===1) continue; return s; }
      if(areaBlocked(x+0.0137,y+0.0171)) return s;   // (never exactly Ash's own x or y: those mean his own feet)
    }
  }finally{ C2.proj--; }
  return Infinity;
}
// colliders: walk the collider grid cells the line crosses and take the nearest entry point
function losColT(x0,y0,ux,uy,end,x1,y1){
  const st=++LOSV.stamp, ex=x0+ux*end, ey=y0+uy*end, sx=ux>0?1:-1, sy=uy>0?1:-1;
  let cx=Math.floor(x0/GC), cy=Math.floor(y0/GC); const cxe=Math.floor(ex/GC), cye=Math.floor(ey/GC);
  let tmx=Math.abs(ux)>1e-9?((sx>0?(cx+1)*GC:cx*GC)-x0)/ux:Infinity, tmy=Math.abs(uy)>1e-9?((sy>0?(cy+1)*GC:cy*GC)-y0)/uy:Infinity;
  const tdx=Math.abs(ux)>1e-9?GC/Math.abs(ux):Infinity, tdy=Math.abs(uy)>1e-9?GC/Math.abs(uy):Infinity;
  let best=Infinity;
  for(let n=0;n<200;n++){
    const a=GRID.get(gkey(cx,cy));
    if(a) for(let q=0;q<a.length;q++){ const c=a[q]; if(c._los===st) continue; c._los=st; if(c.noProj||c.low||(c.t==='c'&&c.r<16)||!colActive(c)) continue; const t=losShapeT(c,x0,y0,ux,uy,end,x1,y1); if(t<best) best=t; }
    if(cx===cxe&&cy===cye) break;
    if(tmx<tmy){ if(tmx>best||tmx>end) break; tmx+=tdx; cx+=sx; } else { if(tmy>best||tmy>end) break; tmy+=tdy; cy+=sy; }
  }
  return best;
}
function losShapeT(c,x0,y0,ux,uy,end,x1,y1){
  if(c.t==='c'){
    const r=c.r-0.5; if(r<=0) return Infinity; const r2=r*r;
    if((x0-c.x)**2+(y0-c.y)**2<r2||(x1-c.x)**2+(y1-c.y)**2<r2) return Infinity;
    const fx=c.x-x0, fy=c.y-y0, tc=fx*ux+fy*uy, d2=fx*fx+fy*fy-tc*tc; if(tc<0||d2>=r2) return Infinity;
    const t=tc-Math.sqrt(r2-d2); return t<end?Math.max(0,t):Infinity;
  }
  const bx0=c.x0+0.5, by0=c.y0+0.5, bx1=c.x1-0.5, by1=c.y1-0.5;
  if((x0>bx0&&x0<bx1&&y0>by0&&y0<by1)||(x1>bx0&&x1<bx1&&y1>by0&&y1<by1)) return Infinity;
  let t0=0, t1=end;
  if(Math.abs(ux)<1e-9){ if(x0<=bx0||x0>=bx1) return Infinity; } else { let a=(bx0-x0)/ux, b=(bx1-x0)/ux; if(a>b){ const q=a; a=b; b=q; } if(a>t0) t0=a; if(b<t1) t1=b; if(t0>t1) return Infinity; }
  if(Math.abs(uy)<1e-9){ if(y0<=by0||y0>=by1) return Infinity; } else { let a=(by0-y0)/uy, b=(by1-y0)/uy; if(a>b){ const q=a; a=b; b=q; } if(a>t0) t0=a; if(b<t1) t1=b; if(t0>t1) return Infinity; }
  return t0;
}
// outdoor levels: a face (ground higher than the source) stops the line; ramps never do
function losElevT(x0,y0,ux,uy,end,o){
  if(!(end>4)||!elvGrid(x0,y0)) return Infinity;
  let L=o&&o.lv!=null?o.lv:losSrcLvl(x0,y0,-ux,-uy);
  if(o&&o.lt!=null&&o.lt>L) L=o.lt;
  for(let s=4;s<end;s+=6){ const x=x0+ux*s, y=y0+uy*s; if(elevFace(x,y)&EF.RAMP) continue; if(elevLvl(x,y)>L) return s; }
  return Infinity;
}
// the level a line leaves from: where it starts, or just behind that when the start lies on a cliff face
function losSrcLvl(x,y,bx,by){
  if(elevFace(x,y)&EF.FACE) for(let d=8;d<=40;d+=8){ const qx=x+bx*d, qy=y+by*d; if(!(elevFace(qx,qy)&EF.FACE)) return elevLvl(qx,qy); }
  return elevLvl(x,y);
}
// Ash as a source: from the sky outdoors his level is his flight ceiling and colliders below do not count
const LOS_ASH_FLY={lv:0,fly:true};
function ashLosO(){ const p=player; if(p&&p.flying&&!AREA){ LOS_ASH_FLY.lv=elvPlayerShotLvl(); return LOS_ASH_FLY; } return null; }
// bosses: every boss and mini boss (story bosses, cave bosses, Trial guardians, the second-edition cave bosses)
function isBossFoe(e){ if(!e) return false; const D=EDEF[e.type]; return !!(e.boss||e.caveBoss||e.trialBoss||e.c2boss||(D&&(D.boss||D.mini))); }
// a boss cannot be hurt before its fight has begun: not while its intro talks, and in a cave or dungeon not until Ash is
// inside its room (the boss door open and the room's intro played) or the room has locked for the fight
function bossReady(e){
  if(!isBossFoe(e)) return true;
  if(G.fightIntro) return false;
  const A=AREA;
  if(e.inArea&&A&&A.rooms&&e.room&&A.rooms[e.room]){ const R=A.rooms[e.room]; return !!R.locked||caveRoomAt(player.x,player.y)===R; }
  return true;
}
// is foe e in a room Ash can see right now? (ROOMS' roomSeen: a foe in a dark room is neither seen nor hit)
function foeInView(e){ return typeof roomSeen!=='function'||roomSeen(e); }
// can a hit from (x,y) (Ash's body when x is null) land on foe e at its hit circle c (its body when c is null)?
const LOS_SKY={lt:99};   // a flying foe outdoors is in the air: cliffs below it do not hide it
function ashHits(e,c,x,y,o){
  if(!bossReady(e)||!foeInView(e)) return false;
  if(x==null){ x=player.x; y=player.y; if(o===undefined) o=ashLosO(); }
  if(!o&&e.flying&&!AREA) o=LOS_SKY;
  return losClear(x,y,c?c.x:e.x,c?c.y:e.y,c?c.r:(e.r||12),o||null);
}
// does Ash see foe e (aim help and auto-aim pick only foes he can see); cached a few times a second per foe
function ashSees(e){
  if(e._asT>G.time&&e._asT<G.time+1) return !!e._as;
  e._asT=G.time+0.15+Math.random()*0.1;
  const p=player; return e._as=!!p&&bossReady(e)&&foeInView(e)&&losClear(p.x,p.y,e.x,e.y,e.r||12,ashLosO()||(e.flying&&!AREA?LOS_SKY:{lt:elevOf(e)}));
}
// can foe e see Ash (it notices him only then); cached a few times a second per foe. A foe in a room ROOMS keeps asleep
// sees nothing. e.seenT is the last time it saw him.
function foeSees(e){
  if(e._fsT>G.time&&e._fsT<G.time+1) return !!e._fs;
  e._fsT=G.time+0.18+Math.random()*0.12;
  const p=player; let v=false;
  if(p&&!p.dead&&!(typeof roomAwake==='function'&&!roomAwake(e))) v=(!AREA&&e.flying)||losClear(e.x,e.y,p.x,p.y,p.r,{lt:elevOf(p),fly:!AREA&&!!p.flying});   // (a flyer outdoors sees from the air)
  e._fs=v; if(v) e.seenT=G.time;
  return v;
}
// the boss Ash is fighting right here (same cave room, or near him outdoors), if any
function bossShares(b){
  if(!b||b.dead) return false;
  const A=AREA;
  if(A&&A.rooms){ const R=caveRoomAt(player.x,player.y); return !!R&&(caveRoomAt(b.x,b.y)===R||(!!b.room&&A.rooms[b.room]===R)); }
  return dist2(b.x,b.y,player.x,player.y)<1600*1600;
}
function bossHere(){ const g=G.boss; if(g&&!g.dead&&bossShares(g)) return g; for(const e of G.enemies) if(!e.dead&&isBossFoe(e)&&bossShares(e)) return e; return null; }
// a hit on Ash from (sx,sy) needs a clear line to him. A boss's own attacks (its AI tick, or any blast, ring or pool while
// the boss Ash is fighting shares his room) keep their own rules; so do lava and ground hazards (HURT_SRC 'lava').
// A foe asleep in a room ROOMS keeps asleep cannot hurt him.
function hurtSeen(sx,sy){
  const p=player;
  if(AIE&&typeof roomAwake==='function'&&!roomAwake(AIE)) return false;
  if(AIE&&AIE.flying&&!AREA) return true;   // outdoors a flyer comes over everything
  if(sx==null||sy==null||!isFinite(sx)||!isFinite(sy)||HURT_SRC==='lava') return true;
  if((sx-p.x)**2+(sy-p.y)**2<(p.r+8)**2) return true;
  const b=AIE?(isBossFoe(AIE)?AIE:null):bossHere();
  if(b&&bossShares(b)) return true;
  const fly=!AREA&&!!p.flying;
  return losClear(sx,sy,p.x,p.y,p.r,fly?{fly:true,lt:elevOf(p)}:null);
}
function damageEnemy(e,amt,o){
  o=o||{};
  if(e.dead||e.invuln||e.spawnIn>0||e.passive) return 0;
  // v12: a boss is not hurt before its fight has begun (its room open and its intro played); o.los (set by Ash's own hits,
  // see wStrike) also needs a clear line from o.lx,o.ly (or o.fx,o.fy, or Ash) to the foe
  if(!bossReady(e)||(o.los&&(!foeInView(e)||!losClear(o.lx!=null?o.lx:o.fx!=null?o.fx:player.x,o.ly!=null?o.ly:o.fy!=null?o.fy:player.y,e.x,e.y,e.r||12,o.lo||(o.lx==null&&o.fx==null?ashLosO():null)||(e.flying&&!AREA?LOS_SKY:null))))){ e.lastBlocked=true; return 0; }
  let a=amt*(o.mult||1), blocked=false;
  if(e.shield&&e.blocking&&o.src!=='burn'&&o.src!=='roar'&&o.src!=='ember'){
    const fx=o.fx!=null?o.fx:player.x, fy=o.fy!=null?o.fy:player.y;
    if(Math.abs(angDiff(e.face,angTo(e.x,e.y,fx,fy)))<1.15){ a*=0.15; blocked=true; }
  }
  e.lastBlocked=blocked; e.aggro=true; e.lastHit=G.time;
  a=Math.max(0.5,a); e.hp-=a; e.flash=0.08;
  if(o.kb){
    if(!blocked){ const r=e.kbRes; e.vx+=Math.cos(o.ka)*o.kb*r; e.vy+=Math.sin(o.ka)*o.kb*r; }
    else if(o.src==='slash'){ player.kvx-=Math.cos(o.ka)*140; player.kvy-=Math.sin(o.ka)*140; }
  }
  if(o.src!=='roar') player.roar=Math.min(100,player.roar+a*0.32*player.stats.roarRate/player.stats.dmgMul);
  if(blocked){
    if(!(e.blockTxtT>0)){ if(settings.nums) ftext(e.x,e.y-e.r-6,'BLOCK','#c9c9d6',12); e.blockTxtT=0.35; }
    if(o.src==='slash'){ SFX.play('block'); emit(e.x+Math.cos(e.face)*e.r,e.y+Math.sin(e.face)*e.r,6,{col:'200,220,255',smin:80,smax:200,lmin:.1,lmax:.25,zmin:1.5,zmax:2.5,drag:6}); }
  }else if(settings.nums){
    const fire=o.src==='fire'||o.src==='burn'||o.src==='ember';
    if(!fire||Math.random()<0.45) ftext(e.x+rand(-6,6),e.y-e.r-4,Math.round(a)+(o.crit?'!':''),o.crit?'#ffe066':fire?'#ffa04a':'#ffffff',o.crit?17:(o.src==='burn'?11:13));
  }
  if(e.hp<=0) killEnemy(e);
  return a;
}
function comboMult(){ return 1+Math.min(3,Math.floor(G.combo/8)*0.5); }
// kill XP: EDEF.value at the foe's own lv, growing by balXpK for every level above it (a boss at its own level gives value)
function foeXp(e){ const d=EDEF[e.type]||{}; return Math.max(0,Math.round((e.value||0)*balXpK(e.level||1)/balXpK(d.lv||1))); }
function killEnemy(e){
  if(e.dead) return;
  e.dead=true; e.hp=0;
  if(e.type!=='egg'){ G.kills++; G.combo++; G.comboT=3; }
  if(G.mode==='normal'){ G.score+=Math.round(e.value*comboMult()); if(Math.random()<0.12*G.diff.heal) dropHeal(e.x,e.y,14); }
  gainXp(foeXp(e));
  if(player.stats.killHeal&&e.type!=='egg') heal(player.stats.killHeal,true);
  if(e.type==='slime'&&!e.small&&G.mode==='story'){ for(let i=0;i<2;i++){ const k=makeEnemy('slime',e.x+rand(-14,14),e.y+rand(-14,14),{small:true,level:e.level,tint:e.tint,aggro:true,camp:e.camp,homeX:e.homeX,homeY:e.homeY}); k.inArea=e.inArea; k.spawnIn=0.1; k.room=e.room; k.cropTarget=e.cropTarget; k.mini=e.mini; if(e.room&&AREA&&AREA.rooms&&AREA.rooms[e.room]) AREA.rooms[e.room].enemies.push(k); if(e.camp) e.camp.alive++; } }
  if(e.camp){ e.camp.alive--; e.camp.kills=(e.camp.kills||0)+1; e.camp.lastKill=G.time; if(e.camp.alive<=0&&!e.camp.cave){ e.camp.cleared=G.time; G.campsCleared[e.camp.id]=G.worldTime; if(G.mode==='story'){ setBanner('Camp cleared','',1.6); G.stats.camps=(G.stats.camps||0)+1; questPoke(); } } }
  if(G.mode==='story'&&e.type!=='egg'){ if(e.boss) dropCoins(e.x,e.y,20); else if(Math.random()<(e.elite?0.9:0.35)) dropCoins(e.x,e.y,e.elite?randi(3,5):randi(1,2)); }
  if(e.questTag) G.questKills++;
  deathFx(e); SFX.play(e.boss?'boom':'pop');
  if(e.boss) onBossDefeated(e);
}
function stunEnemy(e,t){
  if(e.dead||e.invuln||e.type==='vorlaxis'||e.type==='egg') return;
  e.stun=Math.max(e.stun,e.boss?t*0.35:t); e.tele=null; e.blocking=false;
  e.state=e.boss?'recover':'chase'; e.st=0.25; e.cd=Math.max(e.cd,0.5);
}
function deathFx(e){
  const c=DCOL[e.type]||'255,180,90', big=e.boss;
  emit(e.x,e.y,big?70:12,{col:c,glow:false,smin:40,smax:big?300:160,lmin:.4,lmax:big?1.2:.7,zmin:2,zmax:big?6:4,grow:3});
  emit(e.x,e.y,big?30:6,{col:'255,200,120',ang:-Math.PI/2,spread:0.7,smin:30,smax:90,lmin:.8,lmax:1.4,zmin:1.2,zmax:2.5,drag:0.6,rise:20});
  emit(e.x,e.y,big?20:5,{col:'60,50,50',glow:false,smin:20,smax:80,lmin:.6,lmax:1,zmin:5,zmax:9,grow:10});
  scorch(e.x,e.y,e.r*1.6);
}
function dropHeal(x,y,amt){ G.pickups.push({x,y,vx:rand(-70,70),vy:rand(-70,70),amt,t:0,life:15}); }
// v12: indoors nothing is named, talked to, opened or picked up through a wall. This wraps FIXES' reach tests (reachObj,
// reachPerson, reachPlace in a9d_quests.js) when they are in the build; a function declaration is hoisted, so the wrap can
// sit here. A house is one room, so only caves and dungeons change.
if(typeof reachObj==='function'){ const base=reachObj; reachObj=function(o){ const q=base.apply(this,arguments); if(q&&q.ok&&AREA&&player&&!losClear(player.x,player.y,q.x,q.y,o&&o.w?0:((o&&o.r)||16))) q.ok=false; return q; }; }
if(typeof reachPerson==='function'){ const base=reachPerson; reachPerson=function(n){ const ok=base.apply(this,arguments); return ok&&!(AREA&&player&&n&&!losClear(player.x,player.y,n.x,n.y,14)); }; }
if(typeof reachPlace==='function'){ const base=reachPlace; reachPlace=function(x,y,r){ const ok=base.apply(this,arguments); return ok&&!(AREA&&player&&!losClear(player.x,player.y,x,y,r||22)); }; }
// test hooks (v12 WALLS)
window.__ebDbg=Object.assign(window.__ebDbg||{},{walls:{losClear,losHitT,BRW,bossReady,ashHits,ashSees,foeSees,hurtSeen,isBossFoe,
  give:id=>{ giveWeapon(id,true); equipWeapon(id,true); return curWeapon(); },
  foe:(type,x,y,o)=>{ o=o||{}; const e=makeEnemy(type,x,y,Object.assign({aggro:false},o)); if(AREA){ e.inArea=true; const R=caveRoomAt(x,y); if(R){ e.room=R.id; R.enemies.push(e); } } e.spawnIn=0; if(o.hold) e.stun=999; return e.id; },
  get:id=>{ const e=G.enemies.find(q=>q.id===id); return e?{id:e.id,type:e.type,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,dead:e.dead,aggro:e.aggro,room:e.room,boss:isBossFoe(e),ready:bossReady(e),stun:e.stun}:null; },
  rooms:()=>AREA&&AREA.rooms?Object.values(AREA.rooms).map(R=>({id:R.id,kind:R.kind,x0:R.x0,y0:R.y0,x1:R.x1,y1:R.y1,cx:R.cx,cy:R.cy,locked:!!R.locked,foes:R.enemies.filter(e=>!e.dead).map(e=>({id:e.id,type:e.type,boss:isBossFoe(e),x:Math.round(e.x),y:Math.round(e.y),hp:Math.round(e.hp)}))})):null,
  here:()=>{ const R=caveRoomAt(player.x,player.y); return R?R.id:null; }}});
