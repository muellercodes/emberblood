
// ================= Vorlaxis, the First Flame
function phaseShift(e,n){
  e.phase=n; e.state='roarShift'; e.st=1.5; e.invuln=true; e.tele=null; e.alpha=1; e.alt=0; e.scale=1; e.noClip=false; e.volleys=0;
  shake(14); flashA=0.25; flashCol='255,120,60'; SFX.play('roar');
  G.rings.push({x:e.x,y:e.y,rad:e.r,max:430,speed:540,thick:26,dmg:0,kb:520});
  taunt('vor',n===2?'You bite! Good. A dragon should bite.':'ENOUGH! I will bring the whole sky down on you!');
  if(n===3) e.flyCd=1.5;
}
function dragonChoose(e,d,a,enr){
  const behind=Math.abs(angDiff(e.face,a))>1.25, o=[];
  if(d<215) o.push(['tail',behind?6:2.5]);
  if(d<430&&!behind) o.push(['breath',3]);
  o.push(['stomp',d<320?2:0.8]);
  o.push(['fb',d>240?3:1]);
  if(e.phase>=2&&e.summonCd<=0&&countType('drakeling')<3) o.push(['summon',2.5]);
  if(e.phase>=3&&e.flyCd<=0) o.push(['fly',5]);
  let tot=0; for(const x of o) tot+=x[1];
  let r=Math.random()*tot, ch=o[0][0];
  for(const [k,w] of o){ r-=w; if(r<=0){ ch=k; break; } }
  switch(ch){
    case 'tail': e.state='tailW'; e.st=0.65; e.tele=newTele({shape:'donut',r1:e.r,r2:205,dur:0.65}); break;
    case 'breath': e.state='breathW'; e.st=0.95*Math.max(0.8,enr); e.tele=newTele({shape:'cone',mouth:true,len:400,half:0.85,dur:e.st}); break;
    case 'stomp': e.state='stompW'; e.st=0.75; e.tele=newTele({shape:'circle',r:e.r+40,dur:0.75}); break;
    case 'fb': e.state='fbW'; e.st=0.55; e.volleys=e.phase===3?2:1; break;
    case 'summon': e.state='summonW'; e.st=0.9; e.summonCd=13; taunt('vor',pick(['Children! To me!','Rise, my brood!'])); break;
    case 'fly': e.state='takeoff'; e.st=0.9; e.flyCd=15; e.invuln=true; e.tele=null; taunt('vor','The sky is mine, hatchling!'); SFX.play('roar'); break;
  }
}
AI.vorlaxis=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), f=e.hp/e.maxHp;
  const air=e.state==='takeoff'||e.state==='flying'||e.state==='landW';
  if(e.phase===1&&f<0.66&&!air) phaseShift(e,2);
  else if(e.phase===2&&f<0.33&&!air) phaseShift(e,3);
  const enr=e.phase===3?0.72:e.phase===2?0.86:1;
  e.summonCd-=dt; e.flyCd-=dt; e.cd-=dt;
  if(e.tailFx>0) e.tailFx=Math.max(0,e.tailFx-dt*2.5);
  e.mouthGlow=Math.max(0,e.mouthGlow-dt*2);
  const relT=e.state==='breath'?0:clamp(angDiff(e.face,a),-0.75,0.75);
  e.headRel=lerp(e.headRel,relT,1-Math.exp(-dt*5));
  e.dx=0; e.dy=0;
  switch(e.state){
    case 'roarShift': e.st-=dt; e.mouthGlow=1; if(e.st<=0){ e.invuln=false; e.state='walk'; e.cd=0.6; } break;
    case 'walk':
      e.face=turnTo(e.face,a,1.05*dt);
      if(d>250) steer(e,p.x,p.y,e.speed*(e.phase===3?1.25:1));
      if(e.cd<=0) dragonChoose(e,d,a,enr);
      break;
    case 'breathW':
      e.face=turnTo(e.face,a,1.5*dt); e.st-=dt; e.mouthGlow=1;
      if(e.st<=0){ e.state='breath'; e.tdur=e.st=1.8; e.sweep=Math.random()<0.5?-1:1; e.base=e.face; e.tick=0; e.tele=null; }
      break;
    case 'breath': {
      e.st-=dt; const pr=1-e.st/e.tdur; e.face=e.base+e.sweep*(-0.55+1.1*pr); e.mouthGlow=1;
      updateHeadPos(e);
      const ang=e.face+e.headRel;
      emit(e.mouthX,e.mouthY,6,{kind:'fire',ang,spread:0.2,smin:600,smax:720,lmin:.5,lmax:.72,zmin:6,zmax:10,grow:34,drag:0.5});
      e.tick-=dt;
      if(e.tick<=0){ e.tick=0.12; if(inCone(e.mouthX,e.mouthY,ang,400,0.3,p.x,p.y,p.r)) hurtPlayer(ed(13),e.mouthX,e.mouthY,160); if(Math.random()<0.5){ const L=rand(120,380); scorch(e.mouthX+Math.cos(ang)*L,e.mouthY+Math.sin(ang)*L,rand(20,36)); } }
      if(e.st<=0) toRecover(e,0.9*enr);
      break; }
    case 'tailW':
      e.st-=dt;
      if(e.st<=0){ e.tailFx=1; shake(7); SFX.play('slash3'); if(d<205+p.r) hurtPlayer(ed(18),e.x,e.y,460); emit(e.x,e.y,24,{col:'120,105,95',glow:false,smin:120,smax:320,lmin:.3,lmax:.6,zmin:4,zmax:8,grow:8}); toRecover(e,0.6*enr); }
      break;
    case 'stompW':
      e.st-=dt;
      if(e.st<=0){
        shake(11); SFX.play('boom');
        G.rings.push({x:e.x,y:e.y,rad:e.r,max:560,speed:330,thick:22,dmg:ed(15)});
        if(e.phase>=2) G.rings.push({x:e.x,y:e.y,rad:e.r,max:560,speed:330,thick:22,dmg:ed(15),delay:0.45});
        emit(e.x,e.y,30,{col:'150,120,100',glow:false,smin:100,smax:300,lmin:.4,lmax:.8,zmin:5,zmax:10,grow:10});
        toRecover(e,0.7*enr);
      }
      break;
    case 'fbW':
      e.face=turnTo(e.face,a,2*dt); e.st-=dt; e.mouthGlow=1;
      if(e.st<=0){
        updateHeadPos(e);
        const n=e.phase===1?3:5, ta=angTo(e.mouthX,e.mouthY,p.x,p.y);
        for(let i=0;i<n;i++) shoot(e.mouthX,e.mouthY,ta+(i-(n-1)/2)*0.22,310,11,ed(12),'fireball');
        SFX.play('cast'); e.volleys--;
        if(e.volleys>0) e.st=0.45; else toRecover(e,0.5*enr);
      }
      break;
    case 'summonW':
      e.st-=dt; e.mouthGlow=1;
      if(e.st<=0){ const n=e.phase===3?3:2; for(let i=0;i<n;i++){ const s=spotNear(e.x,e.y,150,260); spawnRune('drakeling',s.x,s.y); } toRecover(e,0.5); }
      break;
    case 'takeoff': {
      e.st-=dt; const k=clamp(1-e.st/0.9,0,1); e.alt=k*260; e.alpha=1-k; e.scale=1+k*0.35;
      if(e.st<=0){ e.state='flying'; e.st=4.6; e.meteorT=0.3; e.alpha=0; e.noClip=true; }
      break; }
    case 'flying':
      e.st-=dt; steer(e,p.x,p.y,170); e.meteorT-=dt;
      if(e.meteorT<=0){
        e.meteorT=0.26; const near=Math.random()<0.6;
        const tx=near?p.x+rand(-80,80):p.x+rand(-420,420), ty=near?p.y+rand(-80,80):p.y+rand(-300,300);
        const hx=e.homeX||p.x, hy=e.homeY||p.y; blast(clamp(tx,hx-700,hx+700),clamp(ty,Math.max(40,hy-700),hy+700),52,1.1,ed(16),{meteor:true,pool:true});
      }
      if(e.st<=0){ e.state='landW'; e.st=1.3; e.landX=clamp(p.x,(e.homeX||p.x)-520,(e.homeX||p.x)+520); e.landY=clamp(p.y,Math.max(140,(e.homeY||p.y)-520),(e.homeY||p.y)+520); blast(e.landX,e.landY,135,1.3,ed(24),{}); }
      break;
    case 'landW':
      e.st-=dt; e.x=e.landX; e.y=e.landY;
      if(e.st<0.5){ const k=clamp(1-e.st/0.5,0,1); e.alpha=k; e.alt=(1-k)*260; e.scale=1+(1-k)*0.35; }
      if(e.st<=0){ e.alpha=1; e.alt=0; e.scale=1; e.invuln=false; e.noClip=false; shake(16); G.rings.push({x:e.x,y:e.y,rad:e.r,max:300,speed:500,thick:20,dmg:0,kb:420}); e.state='stagger'; e.st=1.7; e.staggered=true; ftext(e.headX,e.headY-30,'STAGGERED!','#ffe066',16); }
      break;
    case 'stagger': e.st-=dt; e.headRel=lerp(e.headRel,0,0.1); if(e.st<=0){ e.staggered=false; e.state='walk'; e.cd=0.5; } break;
    case 'recover': e.face=turnTo(e.face,a,0.6*dt); e.st-=dt; if(e.st<=0){ e.state='walk'; e.cd=rand(0.4,1.0)*enr; } break;
    default: e.state='walk';
  }
  updateHeadPos(e);
};

// ================= projectiles
function shoot(x,y,ang,spd,r,dmg,kind,owner,extra){
  extra=extra||{};
  G.projectiles.push({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,r,dmg,kind,owner:owner||'enemy',life:extra.life||3.2,homing:extra.homing||0,t:0,dead:false,hit:extra.pierce?new Set():null});
}
function smallBoom(x,y,col){ emit(x,y,8,{kind:col?'spark':'fire',col,smin:40,smax:160,lmin:.2,lmax:.4,zmin:3,zmax:6,grow:6,drag:4}); }
function updateProjectiles(dt){
  const p=player;
  for(const pr of G.projectiles){
    if(pr.dead) continue;
    pr.t+=dt; pr.life-=dt;
    if(pr.life<=0){ pr.dead=true; smallBoom(pr.x,pr.y,pr.kind==='orb'?'200,120,255':null); continue; }
    if(pr.homing&&pr.owner==='enemy'){ const a=Math.atan2(pr.vy,pr.vx), na=turnTo(a,angTo(pr.x,pr.y,p.x,p.y),pr.homing*dt), sp=Math.hypot(pr.vx,pr.vy); pr.vx=Math.cos(na)*sp; pr.vy=Math.sin(na)*sp; }
    pr.x+=pr.vx*dt; pr.y+=pr.vy*dt;
    if(Math.random()<0.7) emit(pr.x,pr.y,1,pr.kind==='ice'?{col:'200,230,255',smin:5,smax:30,lmin:.2,lmax:.35,zmin:2,zmax:4,grow:-4,drag:2}:pr.kind==='orb'?{col:'200,120,255',smin:5,smax:30,lmin:.2,lmax:.35,zmin:2,zmax:4,grow:-4,drag:2}:{kind:'fire',smin:5,smax:30,lmin:.2,lmax:.35,zmin:pr.r*0.4,zmax:pr.r*0.7,grow:-4,drag:2});
    if(pr.kind!=='wave'&&colAt(pr.x,pr.y,pr.r*0.5)){ pr.dead=true; smallBoom(pr.x,pr.y); }
    if(pr.x<-20||pr.y<-20||pr.x>WORLD.w+20||pr.y>WORLD.h+20) pr.dead=true;
    if(pr.dead) continue;
    if(pr.owner==='enemy'){
      if(!p.dead&&dist2(pr.x,pr.y,p.x,p.y)<(pr.r+p.r*0.8)**2){ if(hurtPlayer(pr.dmg,pr.x,pr.y,140)){ pr.dead=true; smallBoom(pr.x,pr.y); } }
    }else{
      for(const e of G.enemies){
        if(e.dead||e.invuln||e.spawnIn>0) continue;
        if(pr.hit&&pr.hit.has(e.id)) continue;
        let hc=null; for(const c of hitCircles(e)) if(dist2(pr.x,pr.y,c.x,c.y)<(pr.r+c.r)**2){ hc=c; break; }
        if(!hc) continue;
        damageEnemy(e,pr.dmg,{src:'proj',kb:200,ka:Math.atan2(pr.vy,pr.vx),mult:hc.m,crit:hc.m>1,fx:pr.x-pr.vx*0.05,fy:pr.y-pr.vy*0.05});
        if(pr.hit) pr.hit.add(e.id); else { pr.dead=true; smallBoom(pr.x,pr.y,'140,230,255'); break; }
      }
    }
  }
  G.projectiles=G.projectiles.filter(q=>!q.dead);
}

// ================= hazards (delayed blasts, spawn runes), rings, pools, pickups
function blast(x,y,r,delay,dmg,o){ G.hazards.push(Object.assign({kind:'blast',x,y,r,t:0,delay,dmg},o||{})); }
function explode(h){
  if(!player.dead&&dist(h.x,h.y,player.x,player.y)<h.r+player.r*0.6) hurtPlayer(h.dmg,h.x,h.y,300);
  if(h.toxic){ emit(h.x,h.y,18,{col:'130,200,70',smin:40,smax:h.r*3,lmin:.3,lmax:.6,zmin:3,zmax:7,grow:6,drag:3}); SFX.play('hit'); G.pools.push({x:h.x,y:h.y,r:h.r*0.85,life:4,max:4,owner:'enemy',kind:'toxic',dmg:ed(5),tick:0}); return; }
  emit(h.x,h.y,Math.min(40,h.r*0.6),{kind:'fire',smin:60,smax:h.r*4,lmin:.3,lmax:.6,zmin:4,zmax:9,grow:10,drag:3});
  emit(h.x,h.y,10,{col:'80,70,70',glow:false,smin:20,smax:80,lmin:.6,lmax:1,zmin:5,zmax:9,grow:8});
  SFX.play('boom'); shake(Math.min(10,h.r/10)); scorch(h.x,h.y,h.r*0.9);
  if(h.pool) G.pools.push({x:h.x,y:h.y,r:h.r*0.75,life:3,max:3,owner:'enemy',dmg:ed(6),tick:0});
}
function updateHazards(dt){
  for(const h of G.hazards){
    h.t+=dt;
    if(h.t<h.delay){
      if(h.kind==='spawn'&&Math.random()<dt*20) emit(h.x+rand(-14,14),h.y+rand(-14,14),1,{col:'190,110,255',ang:-Math.PI/2,spread:0.4,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
      if(h.meteor){ const k=h.t/h.delay; emit(h.x+(1-k)*160,h.y-(1-k)*520,1,{kind:'fire',smin:10,smax:40,lmin:.2,lmax:.4,zmin:4,zmax:7,grow:6}); }
      continue;
    }
    h.done=true;
    if(h.kind==='spawn'){
      const e=makeEnemy(h.type,h.x,h.y,h.opt);
      if(e.boss){ G.boss=e; shake(10); SFX.play('boom'); emit(h.x,h.y,40,{col:'190,110,255',smin:80,smax:300,lmin:.4,lmax:.8,zmin:2,zmax:5}); }
      else emit(h.x,h.y,14,{col:'190,110,255',smin:40,smax:160,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
    }else if(h.kind==='blast') explode(h);
  }
  if(G.hazards.some(h=>h.done)) G.hazards=G.hazards.filter(h=>!h.done);
}
function updateRings(dt){
  const p=player;
  for(const R of G.rings){
    if(R.delay>0){ R.delay-=dt; continue; }
    R.rad+=R.speed*dt;
    if(R.owner==='player'){
      for(const e of G.enemies){
        if(e.dead||e.invuln||e.spawnIn>0||R.hit.has(e.id)) continue;
        let inside=false; for(const c of hitCircles(e)) if(dist(R.x,R.y,c.x,c.y)-c.r<=R.rad){ inside=true; break; }
        if(!inside) continue;
        R.hit.add(e.id);
        damageEnemy(e,R.dmg,{src:'roar',kb:520,ka:angTo(R.x,R.y,e.x,e.y)});
        stunEnemy(e,1.4);
      }
    }else if(!p.dead&&!R.hitP){
      const d=dist(R.x,R.y,p.x,p.y);
      if(Math.abs(d-R.rad)<R.thick/2+p.r*0.6){
        if(R.dmg>0){ if(hurtPlayer(R.dmg,R.x,R.y,300)) R.hitP=true; }
        else{ R.hitP=true; const a=angTo(R.x,R.y,p.x,p.y); p.kvx+=Math.cos(a)*(R.kb||400); p.kvy+=Math.sin(a)*(R.kb||400); }
      }
    }
  }
  G.rings=G.rings.filter(R=>R.rad<R.max);
}
function updatePools(dt){
  const p=player;
  for(const pl of G.pools){
    pl.life-=dt;
    if(pl.kind==='toxic'){ if(Math.random()<dt*pl.r*0.15) emit(pl.x+rand(-pl.r,pl.r)*0.6,pl.y+rand(-pl.r,pl.r)*0.6,1,{col:'170,230,110',glow:false,ang:-Math.PI/2,spread:0.3,smin:5,smax:20,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:2,drag:1}); }
    else if(Math.random()<dt*pl.r*0.25) emit(pl.x+rand(-pl.r,pl.r)*0.7,pl.y+rand(-pl.r,pl.r)*0.7,1,{kind:'fire',ang:-Math.PI/2,spread:0.3,smin:20,smax:60,lmin:.3,lmax:.6,zmin:3,zmax:6,grow:6,drag:1});
    if(pl.owner==='enemy'){ if(!p.dead&&dist(pl.x,pl.y,p.x,p.y)<pl.r+p.r*0.4){ if(pl.kind==='toxic') p.slowT=Math.max(p.slowT||0,0.4); hurtPlayer(pl.dmg,pl.x,pl.y,0); } }
    else{
      pl.tick-=dt;
      if(pl.tick<=0){ pl.tick=0.3; for(const e of G.enemies){ if(e.dead||e.flying||e.invuln) continue; if(dist(pl.x,pl.y,e.x,e.y)<pl.r+e.r){ damageEnemy(e,5*p.stats.fire,{src:'ember'}); if(!e.dead){ e.burnT=Math.max(e.burnT,1.5); e.burnDps=Math.max(e.burnDps,4*p.stats.fire); } } } }
    }
  }
  G.pools=G.pools.filter(q=>q.life>0);
}
function updatePickups(dt){
  const p=player;
  for(const k of G.pickups){
    k.t+=dt; k.life-=dt;
    const d=dist(k.x,k.y,p.x,p.y);
    if(d<120&&!p.dead){ const a=angTo(k.x,k.y,p.x,p.y), s=(1-d/120)*900*dt; k.vx+=Math.cos(a)*s; k.vy+=Math.sin(a)*s; }
    const f=Math.exp(-dt*3); k.vx*=f; k.vy*=f; k.x+=k.vx*dt; k.y+=k.vy*dt;
    k.x=clamp(k.x,10,WORLD.w-10); k.y=clamp(k.y,10,WORLD.h-10);
    if(d<p.r+10&&!p.dead){ k.life=0; heal(k.amt*G.diff.heal); SFX.play('pickup'); emit(k.x,k.y,10,{col:'140,255,150',smin:40,smax:140,lmin:.3,lmax:.5,zmin:1.5,zmax:3}); }
  }
  G.pickups=G.pickups.filter(k=>k.life>0);
}

// ================= particles & floating text
function emit(x,y,n,o){
  o=o||{}; const P=G.particles;
  for(let i=0;i<n;i++){
    if(P.length>950) return;
    const a=o.ang!=null?o.ang+rand(-(o.spread||0),(o.spread||0)):rand(0,TAU);
    const s=rand(o.smin!=null?o.smin:40,o.smax!=null?o.smax:160);
    const life=rand(o.lmin!=null?o.lmin:0.3,o.lmax!=null?o.lmax:0.7);
    P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,max:life,size:rand(o.zmin!=null?o.zmin:2,o.zmax!=null?o.zmax:4),grow:o.grow||0,drag:o.drag!=null?o.drag:3,kind:o.kind||'spark',col:o.col||'255,190,90',glow:o.glow!==false,rise:o.rise||0,al:o.alpha||1});
  }
}
function updateParticles(dt){
  const P=G.particles; let j=0;
  for(let i=0;i<P.length;i++){
    const q=P[i]; q.life-=dt; if(q.life<=0) continue;
    const k=Math.exp(-q.drag*dt); q.vx*=k; q.vy*=k; q.vy-=q.rise*dt; q.x+=q.vx*dt; q.y+=q.vy*dt; q.size=Math.max(0.3,q.size+q.grow*dt);
    P[j++]=q;
  }
  P.length=j;
}
function ftext(x,y,txt,col,size){ if(G.texts.length>60) G.texts.shift(); G.texts.push({x,y,txt:String(txt),col,size:size||14,life:0.8,max:0.8,vy:-70,vx:rand(-20,20)}); }
function updateTexts(dt){ for(const t of G.texts){ t.life-=dt; t.x+=t.vx*dt; t.y+=t.vy*dt; t.vy*=Math.exp(-dt*3); } G.texts=G.texts.filter(t=>t.life>0); }
