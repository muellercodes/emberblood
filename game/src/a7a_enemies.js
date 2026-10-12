
// ================= enemies
function makeEnemy(type,x,y,opt){
  opt=opt||{};
  const d=EDEF[type], lvl=opt.level||1, lk=1+0.26*(lvl-1);
  const hs=opt.hpScale!=null?opt.hpScale:(G.hpMul||1);
  const elite=!d.boss&&type!=='egg'&&(opt.elite!=null?opt.elite:Math.random()<(G.eliteChance||0));
  const hp=d.hp*G.diff.hp*hs*lk*(elite?1.6:1)*(opt.small?0.35:1);
  const e={id:++EID,type,x,y,r:d.r*(elite?1.12:1),hp,maxHp:hp,speed:d.speed*rand(0.92,1.08),level:lvl,
    dmg:d.dmg*(G.dmgMul||1)*(1+0.15*(lvl-1))*(elite?1.25:1),value:d.value*(elite?2:1),elite,
    flying:!!d.flying,shield:!!d.shield,kbRes:d.kbRes!=null?d.kbRes:1,boss:!!d.boss,
    vx:0,vy:0,dx:0,dy:0,face:opt.face!=null?opt.face:angTo(x,y,player.x,player.y),t:rand(0,10),state:'chase',st:0,cd:rand(0.6,1.6),
    flash:0,stun:0,burnT:0,burnTick:0,burnDps:0,tele:null,dead:false,spawnIn:0.2,blocking:false,alpha:1,
    orbit:angTo(player.x,player.y,x,y),orbitDir:Math.random()<0.5?-1:1,strafe:Math.random()<0.5?-1:1,
    summonT:8,eggT:5,hitWall:false,lastBlocked:false,
    homeX:opt.homeX!=null?opt.homeX:x,homeY:opt.homeY!=null?opt.homeY:y,leash:opt.leash||850,
    aggro:opt.aggro!=null?opt.aggro:true,camp:opt.camp||null,questTag:!!opt.questTag,snowy:!!opt.snowy,small:!!opt.small,tint:opt.tint||null};
  if(opt.small){ e.r*=0.62; e.value*=0.4; e.dmg*=0.6; }
  if(type==='egg'){ e.hatch=opt.hatch||4; e.state='egg'; }
  if(d.boss){ e.cd=1.2; e.aggro=true; }
  if(type==='gloamjaw'){ e.state='chase'; e.sub=false; e.cd=1.6; }
  if(type==='greymane'){ e.howled=0; e.cd=1.4; }
  if(type==='vorlaxis'){ Object.assign(e,{phase:1,state:'walk',headRel:0,alt:0,scale:1,cd:1.6,summonCd:6,flyCd:3,mouthGlow:0,tailFx:0,staggered:false,noClip:false}); updateHeadPos(e); }
  G.enemies.push(e); return e;
}
function updateHeadPos(e){
  const ang=e.face+e.headRel;
  e.headX=e.x+Math.cos(e.face)*48+Math.cos(ang)*58; e.headY=e.y+Math.sin(e.face)*48+Math.sin(ang)*58;
  e.mouthX=e.headX+Math.cos(ang)*44; e.mouthY=e.headY+Math.sin(ang)*44;
}
function countType(t){ let n=0; for(const e of G.enemies) if(!e.dead&&e.type===t) n++; for(const h of G.hazards) if(h.kind==='spawn'&&h.type===t) n++; return n; }
function freeSpot(x,y,r){ return !blockedAt(x,y)&&!colAt(x,y,r||20); }
function spotNear(x,y,r0,r1,avoidPlayer){
  for(let i=0;i<30;i++){
    const a=rand(0,TAU), r=rand(r0,r1), px=clamp(x+Math.cos(a)*r,60,WORLD.w-60), py=clamp(y+Math.sin(a)*r,60,WORLD.h-60);
    if(G.arena&&dist(px,py,G.arena.x,G.arena.y)>G.arena.r-40) continue;
    if(avoidPlayer&&dist(px,py,player.x,player.y)<avoidPlayer) continue;
    if(!freeSpot(px,py)) continue;
    return {x:px,y:py};
  }
  return {x:clamp(x,60,WORLD.w-60),y:clamp(y,60,WORLD.h-60)};
}
function spawnRune(type,x,y,opt,delay){ G.hazards.push({kind:'spawn',x,y,t:0,delay:delay||0.85,type,opt:opt||{},big:EDEF[type].boss}); }
function steer(e,tx,ty,spd){
  let ax=tx-e.x, ay=ty-e.y; const d=Math.hypot(ax,ay);
  if(d<1){ e.dx=e.dy=0; return; }
  ax/=d; ay/=d;
  if(!e.flying||e.inArea){
    forCols(e.x,e.y,e.r+60,c=>{
      if(c.t!=='c'||!colActive(c)) return;
      const ox=c.x-e.x, oy=c.y-e.y, od=Math.hypot(ox,oy)||1, rr=c.r+e.r+18;
      if(od>rr+40) return;
      const nx=ox/od, ny=oy/od, dot=nx*ax+ny*ay; if(dot<0.1) return;
      const t1x=-ny, t1y=nx, s=(t1x*ax+t1y*ay)>=0?1:-1, w=clamp(1-(od-rr)/40,0,1)*1.3*dot;
      ax+=t1x*s*w-nx*w*0.3; ay+=t1y*s*w-ny*w*0.3;
    });
    const l=Math.hypot(ax,ay)||1; ax/=l; ay/=l;
    const look=e.r+34;
    if(blockedAt(e.x+ax*look,e.y+ay*look)){
      const base=Math.atan2(ay,ax); let found=false;
      for(const off of [0.6,-0.6,1.2,-1.2,1.8,-1.8,2.5,-2.5]){ const a=base+off*e.strafe; if(!blockedAt(e.x+Math.cos(a)*look,e.y+Math.sin(a)*look)){ ax=Math.cos(a); ay=Math.sin(a); found=true; break; } }
      if(!found){ ax=-ax; ay=-ay; }
    }
  }
  const k=Math.min(1,d/12); e.dx=ax*spd*k; e.dy=ay*spd*k;
}
function kite(e,p,d,a,near,far,mul){
  mul=mul||1;
  if(d>far) steer(e,p.x,p.y,e.speed*mul);
  else if(d<near) steer(e,e.x-(p.x-e.x),e.y-(p.y-e.y),e.speed*1.1*mul);
  else{ const px=-Math.sin(a)*e.strafe, py=Math.cos(a)*e.strafe; steer(e,e.x+px*60,e.y+py*60,e.speed*0.6*mul); if(Math.random()<0.006) e.strafe*=-1; }
}
function integrate(e,dt){
  e.hitWall=false;
  const kd=Math.exp(-dt*7); e.vx*=kd; e.vy*=kd;
  const ox=e.x, oy=e.y;
  e.x+=(e.dx+e.vx)*dt; e.y+=(e.dy+e.vy)*dt;
  if(!e.noClip){ if(!e.flying) collideObs(e); boundE(e); terrainFix(e,ox,oy); }
}
function separate(){
  const es=G.enemies, p=player;
  for(let i=0;i<es.length;i++){
    const a=es[i]; if(a.dead||a.noClip||a.frozen) continue;
    for(let j=i+1;j<es.length;j++){
      const b=es[j]; if(b.dead||b.noClip||b.frozen||a.flying!==b.flying) continue;
      const dx=b.x-a.x, dy=b.y-a.y, m=a.r+b.r, d2=dx*dx+dy*dy;
      if(d2<m*m&&d2>0.0001){ const d=Math.sqrt(d2), o=m-d, wa=(b.r*b.r)/(a.r*a.r+b.r*b.r), wb=1-wa; a.x-=dx/d*o*wa; a.y-=dy/d*o*wa; b.x+=dx/d*o*wb; b.y+=dy/d*o*wb; }
    }
    if(a.flying||p.dead||a.alpha<0.5||p.flying||(p.z||0)>12) continue;
    const dx=p.x-a.x, dy=p.y-a.y, m=a.r+p.r, d2=dx*dx+dy*dy;
    if(d2<m*m&&d2>0.0001){
      const d=Math.sqrt(d2), o=m-d;
      if(a.type==='vorlaxis'||a.r>24){ p.x+=dx/d*o; p.y+=dy/d*o; }
      else if(p.dashT<=0){ p.x+=dx/d*o*0.35; p.y+=dy/d*o*0.35; a.x-=dx/d*o*0.65; a.y-=dy/d*o*0.65; }
    }
  }
  const ox=p.x, oy=p.y; collideObs(p); boundE(p); if(blockedAt(p.x,p.y)){ p.x=ox; p.y=oy; }
}
function toRecover(e,t){ e.state='recover'; e.st=t; e.tele=null; }
function newTele(o){ o.t=0; return o; }
function alertCamp(e){ if(!e.camp) return; for(const o of G.enemies) if(o.camp===e.camp&&!o.dead) o.aggro=true; }
function idleAI(e,dt){
  e.tele=null; e.blocking=!!e.shield;
  if(e.returning){
    steer(e,e.homeX,e.homeY,e.speed*0.8);
    if(dist(e.x,e.y,e.homeX,e.homeY)<70){ e.returning=false; e.hp=e.maxHp; e.burnT=0; }
  }else{
    e.wt=(e.wt||0)-dt;
    if(e.wt<=0){ e.wt=rand(2,5); const a=rand(0,TAU), r=rand(0,150); e.wx=e.homeX+Math.cos(a)*r; e.wy=e.homeY+Math.sin(a)*r; e.waiting=Math.random()<0.45; }
    if(e.waiting||dist(e.x,e.y,e.wx,e.wy)<15){ e.dx=e.dy=0; } else steer(e,e.wx,e.wy,e.speed*0.3);
  }
  if(Math.hypot(e.dx,e.dy)>2) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),3*dt);
  if(e.type!=='egg') e.state='chase';
}
function updateEnemies(dt){
  const p=player, night=isNight();
  G.inCombat=false;
  for(const e of G.enemies){
    if(e.dead) continue;
    const d=dist(e.x,e.y,p.x,p.y);
    e.frozen=d>2300&&!e.boss;
    if(e.frozen) continue;
    e.t+=dt; if(e.flash>0) e.flash-=dt; if(e.blockTxtT>0) e.blockTxtT-=dt; if(e.swung>0) e.swung-=dt;
    if(e.tele) e.tele.t+=dt;
    if(e.spawnIn>0) e.spawnIn-=dt;
    if(e.burnT>0){
      e.burnT-=dt; e.burnTick-=dt;
      if(e.burnTick<=0){ e.burnTick=0.33; damageEnemy(e,e.burnDps*0.33,{src:'burn'}); if(e.dead) continue; }
      if(Math.random()<dt*14) emit(e.x+rand(-e.r,e.r)*0.6,e.y+rand(-e.r,e.r)*0.6,1,{kind:'fire',ang:-Math.PI/2,spread:0.4,smin:20,smax:50,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:4,drag:1});
    }else e.burnDps=0;
    if(!e.aggro&&!p.dead&&!e.returning&&d<(e.type==='wolf'?(night?460:300):(night?300:380))){ e.aggro=true; alertCamp(e); if(e.type==='wolf'&&Math.random()<0.5) SFX.play('howl'); }
    if(e.aggro&&!e.boss&&G.mode==='story'){
      const hd=dist(e.x,e.y,e.homeX,e.homeY);
      if((hd>e.leash&&d>420)||p.dead){ e.aggro=false; e.returning=true; e.tele=null; }
    }
    if(e.aggro&&d<750) G.inCombat=true;
    if(e.stun>0){ e.stun-=dt; e.dx=e.dy=0; e.blocking=false; }
    else if(!e.aggro&&e.type!=='egg') idleAI(e,dt);
    else{ const f=AI[e.type]; if(f) f(e,dt); }
    if(e.dead) continue;
    integrate(e,dt);
  }
  separate();
}

// ================= wolves
const AIW={};
AIW.wolf=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0;
  switch(e.state){
    case 'chase':
      if(d>170) steer(e,p.x,p.y,e.speed);
      else{ e.orbit+=dt*1.4*e.orbitDir; steer(e,p.x+Math.cos(e.orbit)*125,p.y+Math.sin(e.orbit)*125,e.speed*0.75); }
      if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),7*dt);
      if(d<200&&e.cd<=0){ e.state='crouch'; e.st=0.42; e.tele=newTele({shape:'line',len:160,w:e.r*1.6,dur:0.42}); }
      break;
    case 'crouch': e.face=turnTo(e.face,a,5*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='lunge'; e.st=0.32; e.hitP=false; } break;
    case 'lunge':
      e.dx=Math.cos(e.face)*500; e.dy=Math.sin(e.face)*500;
      if(!e.hitP&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+6){ if(hurtPlayer(e.dmg,e.x,e.y,200)) e.hitP=true; }
      e.st-=dt; if(e.st<=0) toRecover(e,0.6);
      break;
    case 'recover': steer(e,e.x-(p.x-e.x),e.y-(p.y-e.y),e.speed*0.45); e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(1.1,2.2); } break;
    default: e.state='chase';
  }
};

// ================= wildlife (passive)
function updateCritters(dt){
  const p=player;
  for(const c of G.critters){
    c.t+=dt;
    const d=dist(c.x,c.y,p.x,p.y);
    if(d>1900){ c.gone=true; continue; }
    const scare=c.type==='deer'?280:190;
    if(d<scare||c.flee>0){
      if(d<scare) c.flee=2.5; c.flee-=dt;
      const a=angTo(p.x,p.y,c.x,c.y), sp=c.type==='deer'?270:300;
      const e=c; steer(e,c.x+Math.cos(a)*200,c.y+Math.sin(a)*200,sp);
      e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),8*dt); c.moving=true;
    }else{
      c.wt-=dt;
      if(c.wt<=0){ c.wt=rand(2,6); c.graze=Math.random()<0.6; c.tx=c.x+rand(-120,120); c.ty=c.y+rand(-120,120); }
      if(c.graze){ c.dx=c.dy=0; c.moving=false; } else { steer(c,c.tx,c.ty,c.type==='deer'?50:70); c.moving=Math.hypot(c.dx,c.dy)>5; if(c.moving) c.face=turnTo(c.face,Math.atan2(c.dy,c.dx),3*dt); }
    }
    const ox=c.x, oy=c.y; c.x+=c.dx*dt; c.y+=c.dy*dt; collideObs(c); boundE(c); terrainFix(c,ox,oy);
  }
  if(G.critters.some(c=>c.gone)) G.critters=G.critters.filter(c=>!c.gone);
}
function spawnCritters(){
  if(AREA) return;
  if(G.mode!=='story'||G.critters.length>=7||!isDay()) return;
  const p=player, a=rand(0,TAU), r=rand(650,1100), x=p.x+Math.cos(a)*r, y=p.y+Math.sin(a)*r;
  if(x<100||y<100||x>WORLD.w-100||y>WORLD.h-100||y<WALL_Y+100) return;
  const s=T(x,y,{}); if((s.b>1&&s.b!==5)||s.water||s.road>0||s.bog>0.2||inClearing(x,y)) return;
  if(!freeSpot(x,y)) return;
  const deer=Math.random()<0.55, n=deer?randi(2,4):randi(1,2);
  for(let i=0;i<n;i++){ const sx=x+rand(-50,50), sy=y+rand(-50,50); if(!freeSpot(sx,sy)) continue; G.critters.push({type:deer?'deer':'rabbit',x:sx,y:sy,r:deer?12:5,face:rand(0,TAU),t:rand(0,9),wt:rand(0,3),dx:0,dy:0,flee:0,strafe:1,flying:false,antlers:Math.random()<0.4}); }
}
function updateBirds(dt){
  if(AREA){ G.birds=[]; return; }
  if(G.mode==='story'&&isDay()&&Math.random()<dt*0.05&&G.birds.length<2){
    const a=rand(0,TAU), cx=player.x-Math.cos(a)*900, cy=player.y-Math.sin(a)*700, n=randi(4,8), birds=[];
    for(let i=0;i<n;i++) birds.push({ox:rand(-50,50),oy:rand(-40,40),ph:rand(0,TAU)});
    G.birds.push({x:cx,y:cy,a,sp:rand(160,220),t:0,birds,alt:rand(110,180)});
  }
  for(const f of G.birds){ f.t+=dt; f.x+=Math.cos(f.a)*f.sp*dt; f.y+=Math.sin(f.a)*f.sp*dt; if(f.t>14) f.gone=true; }
  if(G.birds.some(f=>f.gone)) G.birds=G.birds.filter(f=>!f.gone);
}
