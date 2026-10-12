
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
const xpNeed=l=>120+90*(l-1)+15*(l-1)*(l-1);
function gainXp(n){
  const p=player; if(G.mode!=='story') return;
  p.xp+=n;
  while(p.xp>=xpNeed(p.level)){
    p.xp-=xpNeed(p.level); p.level++; p.maxHp+=6; p.stats.dmgMul*=1.04; p.maxStamina+=3; p.hp=p.maxHp;
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
  for(const e of G.enemies){ if(e.dead||e.invuln||e.spawnIn>0||e.alpha<0.3||e.passive) continue; const d=dist2(x,y,e.x,e.y); if(d<bd){bd=d;best=e;} }
  return best;
}
function updatePlayer(dt,inp){
  const p=player, st=p.stats;
  p.t+=dt; p.dashCd-=dt; p.iframes-=dt; p.hurtFlash-=dt; p.atkCd-=dt; p.comboTimer-=dt; G.dashBuf-=dt; G.roarBuf-=dt;
  const moving=Math.abs(inp.mx)+Math.abs(inp.my)>0.05; p.inMx=inp.mx; p.inMy=inp.my;
  let aim=p.facing;
  if(usingTouch){ const tg=nearestEnemy(p.x,p.y,320); if(tg) aim=angTo(p.x,p.y,tg.x,tg.y); else if(moving) aim=Math.atan2(inp.my,inp.mx); }
  else if(aimMode==='mouse'){ const w=toWorld(mouse.x,mouse.y); aim=Math.atan2(w.y-p.y,w.x-p.x); }
  else if(moving) aim=Math.atan2(inp.my,inp.mx);
  if(p.swingT<=0) p.facing=p.breathing?turnTo(p.facing,aim,9*dt):(p.sprinting&&moving?turnTo(p.facing,Math.atan2(inp.my,inp.mx),12*dt):aim);
  // stamina
  if(p.stamDelay>0) p.stamDelay-=dt; else p.stamina=Math.min(p.maxStamina,p.stamina+st.staminaRegen*dt);
  // roll
  if(G.dashBuf>0&&p.dashCd<=0&&p.dashT<=0&&p.drinkT<=0&&!airborne()&&!((p.z||0)>0)&&useStamina(st.rollCost)){
    G.dashBuf=0; p.dashDir=moving?Math.atan2(inp.my,inp.mx):p.facing; p.dashT=0.3; p.dashCd=0.38;
    p.iframes=Math.max(p.iframes,0.32); p.swingT=0; SFX.play('roll');
    emit(p.x,p.y,8,{col:'150,130,110',glow:false,smin:30,smax:90,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:7});
  }
  // drink
  if(inp.drink&&p.potions>0&&p.drinkT<=0&&p.dashT<=0&&p.hp<p.maxHp){ p.potions--; p.drinkT=0.9; p.drinkPool=p.maxHp*0.45*G.diff.heal*(p.stats.drinkMul||1); SFX.play('drink'); }
  if(p.drinkT>0){ const k=Math.min(dt,p.drinkT)/0.9; heal(p.drinkPool*k,true); p.drinkT-=dt; if(Math.random()<0.4) emit(p.x+rand(-8,8),p.y+rand(-8,8),1,{col:'140,255,170',ang:-Math.PI/2,spread:0.5,smin:20,smax:50,lmin:.4,lmax:.7,zmin:1.5,zmax:2.5,rise:20}); }
  let vx=0,vy=0;
  p.sprinting=false;
  // jump, double jump, take off, land, slam (a6c_moves.js)
  const air=movesPre(dt,inp);
  if(p.dashT>0){
    p.dashT-=dt; const k=0.55+0.45*(p.dashT/0.3); vx=Math.cos(p.dashDir)*560*k; vy=Math.sin(p.dashDir)*560*k;
    p.ghostT-=dt; if(p.ghostT<=0){ p.ghostT=0.05; p.ghosts.push({x:p.x,y:p.y,f:p.facing,a:0.6}); }
    if(st.emberDash){ p.emberT-=dt; if(p.emberT<=0){ p.emberT=0.06; G.pools.push({x:p.x,y:p.y,r:22,life:1.6,max:1.6,owner:'player',tick:0}); } }
  }else if(air){
    // in the air: a jump keeps its momentum, flight is fast; no bog, no snow drag, no sprint cost
    [vx,vy]=movesAirVel(dt,inp); p.slowT=(p.slowT||0)-dt;
  }else{
    const here=T(p.x,p.y,PT); p.slowT=(p.slowT||0)-dt;
    let spd=st.speed*(p.breathing?0.55:1)*(p.swingT>0?0.55:1)*(p.drinkT>0?0.45:1)*(here.bog>0.5?(G.flags&&G.flags.perk_bog?0.86:0.72):1)*(here.b===5&&here.road<=0?(G.flags&&G.flags.perk_snow?1.02:0.93):1)*(p.slowT>0?0.6:1);
    const skim=p.onWater&&hasSkill('skimmer');
    if(inp.sprint&&moving&&!p.breathing&&p.swingT<=0&&p.drinkT<=0&&p.stamina>1){ p.sprinting=true; spd*=1.55*(p.onWater?(skim?1.22:1.1):1); if(!skim){ p.stamina=Math.max(0,p.stamina-16*dt); p.stamDelay=Math.max(p.stamDelay,0.35); } }
    vx=inp.mx*spd; vy=inp.my*spd;
    // cave ice: Ash slides
    if(AREA&&AREA.cave&&AREA.cave.typ){ const c=AREA.cave, i=Math.floor((p.x-AREA.x0)/c.cell), j=Math.floor((p.y-AREA.y0)/c.cell); if(c.typ[j*c.w+i]===2){ const k=1-Math.exp(-dt*1.8); p.ivx=lerp(p.ivx||0,vx*1.1,k); p.ivy=lerp(p.ivy||0,vy*1.1,k); vx=p.ivx; vy=p.ivy; } else { p.ivx=vx; p.ivy=vy; } }
  }
  if(!air) movesTryJump(vx,vy,inp);
  for(const g of p.ghosts) g.a-=dt*3; if(p.ghosts.length) p.ghosts=p.ghosts.filter(g=>g.a>0);
  const kd=Math.exp(-dt*9); p.kvx*=kd; p.kvy*=kd;
  const ox=p.x, oy=p.y;
  p.x+=(vx+p.kvx)*dt; p.y+=(vy+p.kvy)*dt;
  collideObs(p); boundE(p); terrainFix(p,ox,oy);
  movesPost(dt,ox,oy,inp);
  if(G.noSwordT>0) G.noSwordT-=dt;
  p.moving=moving&&!(p.z>0)&&!p.flying; if(p.moving){ p.walkT+=dt*(p.sprinting?1.5:1); p.stepT-=dt*(p.sprinting?1.6:1); if(p.stepT<=0){ p.stepT=0.32; SFX.play('step',p.sprinting?1.4:1); if(PT.b===5&&PT.road<=0&&!p.onWater) footprint(p.x,p.y,p.facing,p.walkT); if(PT.bog>0.4&&Math.random()<0.5) G.ripples.push({x:p.x,y:p.y+4,t:0,max:0.8,r:10}); if(p.sprinting&&!p.onWater) emit(p.x,p.y+6,2,{col:'140,120,95',glow:false,smin:10,smax:40,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:5}); } }
  // sword
  if(inp.attack&&G.mode==='story'&&!G.flags.forge){ if(!(G.noSwordT>0)){ G.noSwordT=2.5; ftext(p.x,p.y-28,'Mom has your sword at the forge','#ffd9a0',13); } }
  else if(inp.attack&&p.atkCd<=0&&p.dashT<=0&&p.drinkT<=0){ const fin=(p.comboTimer>0?(p.combo+1)%3:0)===2; if(useStamina(fin?14:9)) startSwing(); else p.atkCd=0.2; }
  if(p.swingT>0){ p.swingT-=dt; swingHits(); }
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
  const p=player, st=p.stats;
  p.combo=p.comboTimer>0?(p.combo+1)%3:0;
  const fin=p.combo===2;
  p.swingFin=fin; p.swingDur=fin?0.22:0.15; p.swingT=p.swingDur; p.swingDir=p.facing; p.swingSide=p.combo===1?-1:1;
  p.swingHit=new Set(); p.swingHitstop=false;
  p.atkCd=(fin?0.44:0.27)/st.atkSpeed; p.comboTimer=p.atkCd+0.4;
  const lunge=fin?220:110; p.kvx+=Math.cos(p.facing)*lunge; p.kvy+=Math.sin(p.facing)*lunge;
  SFX.play(fin?'slash3':'slash');
  if(fin&&st.flameEdge) shoot(p.x+Math.cos(p.facing)*20,p.y+Math.sin(p.facing)*20,p.facing,520,18,st.slash*1.3*st.dmgMul,'wave','player',{life:0.75,pierce:true});
}
function swingHits(){
  const p=player, st=p.stats, fin=p.swingFin, range=st.range*(fin?1.25:1), half=fin?1.3:1.05;
  let any=false;
  for(const e of G.enemies){
    if(e.dead||p.swingHit.has(e.id)||e.invuln||e.spawnIn>0||e.passive) continue;
    let best=null;
    for(const c of hitCircles(e)) if(inArcC(p.x,p.y,p.swingDir,range,half,c)&&(!best||c.m>best.m)) best=c;
    if(!best) continue;
    p.swingHit.add(e.id); any=true;
    damageEnemy(e,st.slash*st.dmgMul*(fin?1.8:1)*rand(0.9,1.1),{src:'slash',mult:best.m,crit:best.m>1,kb:fin?380:170,ka:p.swingDir});
    const a=angTo(best.x,best.y,p.x,p.y);
    emit(best.x+Math.cos(a)*best.r,best.y+Math.sin(a)*best.r,fin?14:7,{col:'255,235,200',smin:120,smax:340,lmin:.1,lmax:.22,zmin:1.2,zmax:2.6,drag:6});
  }
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
    const da=Math.abs(angDiff(p.facing,angTo(p.x,p.y,e.x,e.y))); if(da>0.8) continue;
    const s=d*(1+da)*(e.boss?0.6:1); if(s<bs){bs=s;best=e;}
  }
  return best;
}
function reflectProj(pr){
  const t=aimTarget(), sp=Math.max(430,Math.hypot(pr.vx,pr.vy)*1.5);
  const a=t?angTo(pr.x,pr.y,t.type==='vorlaxis'?t.headX:t.x,t.type==='vorlaxis'?t.headY:t.y):player.facing;
  pr.owner='player'; pr.vx=Math.cos(a)*sp; pr.vy=Math.sin(a)*sp; pr.dmg=Math.max(18,pr.dmg*2.5)*player.stats.dmgMul; pr.life=2; pr.homing=0; pr.reflected=true;
  if(settings.nums) ftext(pr.x,pr.y-10,'REFLECT','#8fe6ff',12);
  SFX.play('block'); emit(pr.x,pr.y,8,{col:'140,230,255',smin:80,smax:220,lmin:.15,lmax:.3,zmin:1.5,zmax:3,drag:5});
}
function doBreath(dt){
  if(player.flying) return breathFly(dt);   // from the sky the fire pours down (a6c_moves.js)
  const p=player, ang=p.facing, mx=p.x+Math.cos(ang)*16, my=p.y+Math.sin(ang)*16;
  emit(mx,my,4,{kind:'fire',ang,spread:0.28,smin:360,smax:460,lmin:.35,lmax:.48,zmin:3,zmax:6,grow:22,drag:1});
  if(Math.random()<0.3) emit(mx+Math.cos(ang)*120,my+Math.sin(ang)*120,1,{col:'70,60,55',glow:false,ang:-Math.PI/2,spread:0.6,smin:10,smax:40,lmin:.8,lmax:1.4,zmin:4,zmax:8,grow:10,drag:1});
  breathIgnite(mx,my,ang,dt);
  p.breathTick-=dt;
  if(p.breathTick<=0){
    p.breathTick=0.1;
    for(const e of G.enemies){
      if(e.dead||e.invuln||e.spawnIn>0||e.passive) continue;
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
  const dmg=Math.max(1,Math.round(amt*G.diff.dmg*(p.stats.armor||1)));
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
function damageEnemy(e,amt,o){
  o=o||{};
  if(e.dead||e.invuln||e.spawnIn>0||e.passive) return 0;
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
function killEnemy(e){
  if(e.dead) return;
  e.dead=true; e.hp=0;
  if(e.type!=='egg'){ G.kills++; G.combo++; G.comboT=3; }
  if(G.mode==='normal'){ G.score+=Math.round(e.value*comboMult()); if(Math.random()<0.12*G.diff.heal) dropHeal(e.x,e.y,14); }
  gainXp(Math.round(e.boss?e.value:e.value*(1+0.25*((e.level||1)-1))));
  if(player.stats.killHeal&&e.type!=='egg') heal(player.stats.killHeal,true);
  if(e.type==='slime'&&!e.small&&G.mode==='story'){ for(let i=0;i<2;i++){ const k=makeEnemy('slime',e.x+rand(-14,14),e.y+rand(-14,14),{small:true,level:e.level,tint:e.tint,aggro:true,camp:e.camp,homeX:e.homeX,homeY:e.homeY}); k.inArea=e.inArea; k.spawnIn=0.1; k.room=e.room; k.cropTarget=e.cropTarget; k.mini=e.mini; if(e.room&&AREA&&AREA.rooms&&AREA.rooms[e.room]) AREA.rooms[e.room].enemies.push(k); if(e.camp) e.camp.alive++; } }
  if(e.camp){ e.camp.alive--; if(e.camp.alive<=0&&!e.camp.cave){ e.camp.cleared=G.time; G.campsCleared[e.camp.id]=G.worldTime; if(G.mode==='story'){ setBanner('Camp cleared','',1.6); G.stats.camps=(G.stats.camps||0)+1; questPoke(); } } }
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
