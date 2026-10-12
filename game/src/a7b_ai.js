const AI={};
AI.kobold=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0;
  switch(e.state){
    case 'chase':
      steer(e,p.x,p.y,e.speed); e.face=turnTo(e.face,a,8*dt);
      if(d<e.r+p.r+20&&e.cd<=0){ e.state='windup'; e.st=0.38; e.tele=newTele({shape:'arc',r:e.r+32,half:0.9,dur:0.38}); }
      break;
    case 'windup':
      e.face=turnTo(e.face,a,3*dt); e.st-=dt;
      if(e.st<=0){ e.state='strike'; e.st=0.18; e.tele=null; e.vx+=Math.cos(e.face)*240; e.vy+=Math.sin(e.face)*240; if(inCone(e.x,e.y,e.face,e.r+34,1.0,p.x,p.y,p.r)) hurtPlayer(e.dmg,e.x,e.y,180); }
      break;
    case 'strike': e.st-=dt; if(e.st<=0){ e.state='recover'; e.st=0.55; } break;
    case 'recover': steer(e,p.x,p.y,e.speed*0.35); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.3,0.8); } break;
    default: e.state='chase';
  }
};
AI.cultist=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.face=turnTo(e.face,a,6*dt); e.dx=e.dy=0;
  if(e.state==='cast'){
    e.st-=dt;
    if(e.st<=0){ const n=e.elite?3:1; for(let i=0;i<n;i++) shoot(e.x+Math.cos(e.face)*14,e.y+Math.sin(e.face)*14,a+(i-(n-1)/2)*0.22,250,7,e.dmg,'bolt'); e.state='chase'; e.cd=rand(1.9,2.8); }
  }else{
    e.state='chase'; kite(e,p,d,a,190,320);
    if(e.cd<=0&&d<560){ e.state='cast'; e.st=0.65; }
  }
};
AI.drakeling=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0;
  switch(e.state){
    case 'chase':
      e.orbit+=dt*1.1*e.orbitDir; steer(e,p.x+Math.cos(e.orbit)*150,p.y+Math.sin(e.orbit)*150,e.speed);
      if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),6*dt);
      if(e.cd<=0&&d<380){ e.state='aim'; e.st=0.6; e.tele=newTele({shape:'line',len:300,w:e.r*2,dur:0.6}); }
      break;
    case 'aim': if(e.st>0.18) e.face=turnTo(e.face,a,10*dt); e.st-=dt; if(e.st<=0){ e.state='charge'; e.st=0.5; e.tele=null; e.hitP=false; } break;
    case 'charge':
      e.dx=Math.cos(e.face)*560; e.dy=Math.sin(e.face)*560;
      if(!e.hitP&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+4){ if(hurtPlayer(e.dmg,e.x,e.y,260)) e.hitP=true; }
      e.st-=dt; if(e.st<=0){ e.state='recover'; e.st=0.5; }
      break;
    case 'recover': steer(e,p.x,p.y,e.speed*0.2); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(1.6,3.2); e.orbit=angTo(p.x,p.y,e.x,e.y); } break;
    default: e.state='chase';
  }
};
AI.knight=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0;
  e.blocking=(e.state==='chase'||e.state==='windup')&&e.stun<=0;
  switch(e.state){
    case 'chase':
      e.face=turnTo(e.face,a,2.0*dt);
      if(d>e.r+p.r+30) steer(e,p.x,p.y,e.speed);
      if(d<e.r+p.r+50&&e.cd<=0){ e.state='windup'; e.st=0.7; e.tele=newTele({shape:'arc',r:e.r+60,half:0.95,dur:0.7}); }
      break;
    case 'windup':
      e.face=turnTo(e.face,a,1.2*dt); e.st-=dt;
      if(e.st<=0){
        toRecover(e,0.9); e.swung=0.3;
        if(inCone(e.x,e.y,e.face,e.r+62,1.0,p.x,p.y,p.r)) hurtPlayer(e.dmg,e.x,e.y,320);
        const sx=e.x+Math.cos(e.face)*40, sy=e.y+Math.sin(e.face)*40;
        emit(sx,sy,10,{col:'170,160,150',glow:false,smin:40,smax:120,lmin:.3,lmax:.5,zmin:3,zmax:6,grow:6}); shake(3); SFX.play('hit');
      }
      break;
    case 'recover': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.9,1.5); } break;
    default: e.state='chase';
  }
};
AI.egg=(e,dt)=>{
  e.dx=e.dy=0; if(e.inArea&&dist2(e.x,e.y,player.x,player.y)>420*420) return; e.hatch-=dt;
  if(e.hatch<=0){ e.dead=true; emit(e.x,e.y,12,{col:'235,225,200',glow:false,smin:40,smax:120,lmin:.3,lmax:.6,zmin:2,zmax:3}); const k=makeEnemy('drakeling',e.x,e.y,{level:e.level,camp:e.camp,aggro:true,homeX:e.homeX,homeY:e.homeY}); k.cd=1.2; k.inArea=e.inArea; }
};
AI.grizzlefang=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0;
  if(!e.summoned&&e.hp<e.maxHp*0.5){ e.summoned=true; taunt('griz','Get the hatchling, boys!'); for(let i=0;i<4;i++){ const s=spotNear(e.x,e.y,90,180); spawnRune('kobold',s.x,s.y); } }
  switch(e.state){
    case 'chase':
      steer(e,p.x,p.y,e.speed); e.face=turnTo(e.face,a,6*dt);
      if(e.cd<=0){
        if(d<e.r+p.r+40){ e.state='cleave'; e.st=0.45; e.tele=newTele({shape:'arc',r:e.r+48,half:1.1,dur:0.45}); }
        else if(Math.random()<0.5){ e.state='spinW'; e.st=0.65; e.tele=newTele({shape:'circle',r:e.r+38,dur:0.65}); }
        else { e.state='bombs'; e.st=0.5; }
      }
      break;
    case 'cleave':
      e.face=turnTo(e.face,a,2*dt); e.st-=dt;
      if(e.st<=0){ if(inCone(e.x,e.y,e.face,e.r+50,1.15,p.x,p.y,p.r)) hurtPlayer(ed(14),e.x,e.y,300); SFX.play('slash3'); toRecover(e,0.5); }
      break;
    case 'spinW': e.st-=dt; if(e.st<=0){ e.tele=null; e.state='spin'; e.st=1.7; e.spinTick=0; } break;
    case 'spin':
      steer(e,p.x,p.y,e.speed*1.35); e.face+=dt*18; e.spinTick-=dt;
      if(e.spinTick<=0){ e.spinTick=0.12; if(d<e.r+p.r+30) hurtPlayer(ed(10),e.x,e.y,260); emit(e.x,e.y,3,{col:'190,170,140',glow:false,smin:60,smax:140,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:5}); SFX.play('slash'); }
      e.st-=dt; if(e.st<=0){ e.state='dizzy'; e.st=1.1; }
      break;
    case 'dizzy': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.8,1.4); } break;
    case 'bombs':
      e.st-=dt;
      if(e.st<=0){ const n=e.hp<e.maxHp*0.5?5:3; for(let i=0;i<n;i++){ const tx=clamp(p.x+rand(-90,90),30,WORLD.w-30), ty=clamp(p.y+rand(-90,90),30,WORLD.h-30); blast(tx,ty,55,0.9+i*0.15,ed(15),{lob:true,fx:e.x,fy:e.y}); } toRecover(e,0.6); }
      break;
    case 'recover': steer(e,p.x,p.y,e.speed*0.3); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.9,1.6); } break;
    default: e.state='chase';
  }
};
function ringBurst(e,n,spd,off){ for(let i=0;i<n;i++) shoot(e.x,e.y,(off||0)+i/n*TAU,spd,7,ed(9),'bolt'); }
function puff(x,y){ emit(x,y,18,{col:'170,100,230',smin:40,smax:160,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:6}); }
AI.morrow=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.summonT-=dt; e.face=turnTo(e.face,a,5*dt); e.dx=e.dy=0;
  const angry=e.hp<e.maxHp*0.5;
  switch(e.state){
    case 'chase':
      kite(e,p,d,a,240,320);
      if(e.summonT<=0&&countType('cultist')<3){ e.summonT=14; e.state='summon'; e.st=0.8; e.tele=newTele({shape:'circle',r:44,dur:0.8,col:'190,110,255'}); break; }
      if(e.cd<=0){
        const r=Math.random(); SFX.play('cast');
        if(r<0.3){ e.state='volley'; e.st=0.5; }
        else if(r<0.55){ e.state='ring'; e.st=0.8; e.tele=newTele({shape:'circle',r:56,dur:0.8,col:'190,110,255'}); }
        else if(r<0.8){ e.state='orbs'; e.st=0.6; }
        else { e.state='blinkOut'; e.st=0.35; e.invuln=true; }
      }
      break;
    case 'volley': e.st-=dt; if(e.st<=0){ const n=angry?7:5; for(let i=0;i<n;i++) shoot(e.x,e.y,a+(i-(n-1)/2)*0.17,270,7,ed(10),'bolt'); toRecover(e,0.5); } break;
    case 'ring': e.st-=dt; if(e.st<=0){ ringBurst(e,16,190,rand(0,1)); if(angry) later(0.35,()=>{ if(!e.dead) ringBurst(e,16,190,rand(0,1)); }); toRecover(e,0.7); } break;
    case 'orbs': e.st-=dt; if(e.st<=0){ for(let i=0;i<3;i++) shoot(e.x,e.y,a+(i-1)*0.7,150,9,ed(11),'orb','enemy',{homing:1.7,life:5}); toRecover(e,0.5); } break;
    case 'blinkOut':
      e.st-=dt; e.alpha=Math.max(0,e.st/0.35);
      if(e.st<=0){ puff(e.x,e.y); const s=spotNear(p.x,p.y,250,340); e.x=s.x; e.y=s.y; puff(e.x,e.y); e.state='blinkIn'; e.st=0.35; }
      break;
    case 'blinkIn': e.st-=dt; e.alpha=1-Math.max(0,e.st/0.35); if(e.st<=0){ e.alpha=1; e.invuln=false; e.state='chase'; e.cd=0.35; } break;
    case 'summon':
      e.st-=dt;
      if(e.st<=0){ taunt('morrow','Rise, faithful of the Oath!'); for(let i=0;i<2;i++){ const s=spotNear(e.x,e.y,90,170); spawnRune('cultist',s.x,s.y); } toRecover(e,0.5); }
      break;
    case 'recover': kite(e,p,d,a,240,320,0.6); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.8,1.4); } break;
    default: e.state='chase'; e.alpha=1; e.invuln=false;
  }
};
AI.broodmother=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.eggT-=dt; e.dx=e.dy=0;
  switch(e.state){
    case 'chase':
      e.orbit+=dt*0.8*e.orbitDir; steer(e,p.x+Math.cos(e.orbit)*230,p.y+Math.sin(e.orbit)*230,e.speed);
      if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),4*dt);
      if(e.eggT<=0&&countType('egg')+countType('drakeling')<5){ e.eggT=11; e.state='eggs'; e.st=0.7; break; }
      if(e.cd<=0&&d<560){
        if(Math.random()<0.5){ e.state='aim'; e.st=0.85; e.tele=newTele({shape:'line',len:430,w:e.r*1.8,dur:0.85}); }
        else { e.state='breathW'; e.st=0.75; e.tele=newTele({shape:'cone',len:270,half:0.42,dur:0.75}); }
      }
      break;
    case 'aim': if(e.st>0.2) e.face=turnTo(e.face,a,6*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='charge'; e.st=0.62; e.hitP=false; SFX.play('dash'); } break;
    case 'charge':
      e.dx=Math.cos(e.face)*690; e.dy=Math.sin(e.face)*690;
      if(!e.hitP&&dist(e.x,e.y,p.x,p.y)<e.r+p.r){ if(hurtPlayer(ed(18),e.x,e.y,360)) e.hitP=true; }
      e.st-=dt; if(e.st<=0) toRecover(e,0.7);
      break;
    case 'breathW': e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='breath'; e.st=1.1; e.tick=0; } break;
    case 'breath': {
      e.face=turnTo(e.face,a,0.9*dt);
      const mx=e.x+Math.cos(e.face)*(e.r+6), my=e.y+Math.sin(e.face)*(e.r+6);
      emit(mx,my,4,{kind:'fire',ang:e.face,spread:0.3,smin:430,smax:520,lmin:.45,lmax:.6,zmin:5,zmax:8,grow:22,drag:0.9});
      e.tick-=dt; if(e.tick<=0){ e.tick=0.12; if(inCone(mx,my,e.face,270,0.42,p.x,p.y,p.r)) hurtPlayer(ed(12),mx,my,140); }
      e.st-=dt; if(e.st<=0) toRecover(e,0.6);
      break; }
    case 'eggs':
      e.st-=dt;
      if(e.st<=0){ if(!e.eggTaunt){ e.eggTaunt=true; taunt('brood','Hatch, my children! Feast!'); } for(let i=0;i<3;i++){ const s=spotNear(e.x,e.y,50,110); makeEnemy('egg',s.x,s.y,{hatch:4.2+i*0.3}); } toRecover(e,0.4); }
      break;
    case 'recover': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(1,1.8); } break;
    default: e.state='chase';
  }
};
AI.cindervane=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0;
  e.blocking=(e.state==='chase'||e.state==='slashW'||e.state==='chargeAim')&&e.stun<=0;
  if(!e.angry&&e.hp<e.maxHp*0.5){ e.angry=true; taunt('cinder','I have stood for a thousand years. I will not fall to a child!'); }
  switch(e.state){
    case 'chase':
      e.face=turnTo(e.face,a,1.8*dt);
      if(d>e.r+p.r+40) steer(e,p.x,p.y,e.speed);
      if(e.cd<=0){
        if(d<e.r+p.r+70){ e.combo=0; e.state='slashW'; e.st=0.38; e.tele=newTele({shape:'arc',r:e.r+68,half:1.0,dur:0.38}); }
        else if(Math.random()<0.55){ e.state='chargeAim'; e.st=0.75; e.tele=newTele({shape:'line',len:520,w:e.r*2,dur:0.75}); }
        else { e.state='quakeW'; e.st=0.85; e.tele=newTele({shape:'circle',r:e.r+30,dur:0.85}); }
      }
      break;
    case 'slashW':
      e.face=turnTo(e.face,a,2.5*dt); e.st-=dt;
      if(e.st<=0){
        if(inCone(e.x,e.y,e.face,e.r+70,1.05,p.x,p.y,p.r)) hurtPlayer(ed(15),e.x,e.y,300);
        SFX.play('slash3'); e.swung=0.25; e.vx+=Math.cos(e.face)*200; e.vy+=Math.sin(e.face)*200; e.combo++;
        if(e.combo<3){ e.st=0.32; e.tele=newTele({shape:'arc',r:e.r+68,half:1.0,dur:0.32}); }
        else toRecover(e,1.0);
      }
      break;
    case 'chargeAim': if(e.st>0.2) e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='charge'; e.st=0.75; e.hitP=false; SFX.play('dash'); } break;
    case 'charge':
      e.dx=Math.cos(e.face)*600; e.dy=Math.sin(e.face)*600;
      if(!e.hitP&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+4){ if(hurtPlayer(ed(20),e.x,e.y,420)) e.hitP=true; }
      if(e.hitWall&&e.st<0.68){ e.dx=e.dy=0; e.stun=1.6; e.blocking=false; toRecover(e,0.3); shake(9); SFX.play('boom'); ftext(e.x,e.y-e.r-10,'STUNNED!','#ffe066',15); break; }
      e.st-=dt; if(e.st<=0) toRecover(e,0.7);
      break;
    case 'quakeW':
      e.st-=dt;
      if(e.st<=0){ shake(8); SFX.play('boom'); for(let i=0;i<3;i++) G.rings.push({x:e.x,y:e.y,rad:e.r,max:520,speed:270,thick:16,dmg:ed(13),delay:i*0.45}); toRecover(e,1.2); }
      break;
    case 'recover': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.6,1.2); } break;
    default: e.state='chase';
  }
};

AI.gloamjaw=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0;
  const angry=e.hp<e.maxHp*0.5;
  if(!e.summoned&&angry&&!e.sub){ e.summoned=true; taunt('gloam','Little bog-kobolds! Dinner is served!'); for(let i=0;i<3;i++){ const s=spotNear(e.x,e.y,100,200); spawnRune('kobold',s.x,s.y,{level:5}); } }
  switch(e.state){
    case 'chase':
      if(d>e.r+p.r+20) steer(e,p.x,p.y,e.speed); e.face=turnTo(e.face,a,3*dt);
      if(e.cd<=0){
        const r=Math.random();
        if(d<e.r+p.r+46){ e.state='chompW'; e.st=0.55; e.tele=newTele({shape:'arc',r:e.r+54,half:0.95,dur:0.55}); }
        else if(r<0.38&&d<420){ e.state='tongueW'; e.st=0.6; e.tele=newTele({shape:'line',len:360,w:26,dur:0.6,col:'255,120,160'}); }
        else if(r<0.7){ e.state='spitW'; e.st=0.5; }
        else { e.state='diveDown'; e.st=0.5; e.invuln=true; e.tele=null; SFX.play('roll'); }
      }
      break;
    case 'chompW': e.face=turnTo(e.face,a,2*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.mouth=0.3; if(inCone(e.x,e.y,e.face,e.r+56,1.0,p.x,p.y,p.r)) hurtPlayer(ed(17),e.x,e.y,340); SFX.play('slash3'); shake(4); toRecover(e,0.7); } break;
    case 'tongueW': if(e.st>0.15) e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='tongue'; e.st=0.42; e.tongue=0; e.hitP=false; } break;
    case 'tongue': {
      const k=e.st>0.21?(0.42-e.st)/0.21:e.st/0.21; e.tongue=clamp(k,0,1)*360; e.st-=dt;
      if(!e.hitP){ const tx=e.x+Math.cos(e.face)*(e.r+e.tongue), ty=e.y+Math.sin(e.face)*(e.r+e.tongue); if(dist(tx,ty,p.x,p.y)<p.r+16){ if(hurtPlayer(ed(11),tx,ty,0)){ e.hitP=true; const pa=angTo(p.x,p.y,e.x,e.y); p.kvx+=Math.cos(pa)*620; p.kvy+=Math.sin(pa)*620; ftext(p.x,p.y-30,'Yoink!','#ff9ac0',14); } } }
      if(e.st<=0){ e.tongue=0; toRecover(e,0.5); }
      break; }
    case 'spitW': e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(e.st<=0){ const n=angry?5:3; for(let i=0;i<n;i++){ const tx=clamp(p.x+rand(-110,110),40,WORLD.w-40), ty=clamp(p.y+rand(-110,110),40,WORLD.h-40); blast(tx,ty,46,0.85+i*0.14,ed(10),{lob:true,fx:e.x,fy:e.y,toxic:true,pool:true}); } SFX.play('cast'); toRecover(e,0.5); } break;
    case 'diveDown': e.st-=dt; e.alpha=Math.max(0.12,e.st/0.5); e.sub=true; if(e.st<=0){ e.state='under'; e.st=angry?1.3:1.7; } break;
    case 'under':
      steer(e,p.x,p.y,angry?300:250); e.alpha=0.12; e.st-=dt;
      if(Math.random()<dt*14) G.ripples.push({x:e.x+rand(-12,12),y:e.y+rand(-12,12),t:0,max:0.9,r:rand(10,20)});
      if(e.st<=0){ e.state='emergeW'; e.st=0.7; e.tele=newTele({shape:'circle',r:e.r+58,dur:0.7,col:'140,220,90'}); }
      break;
    case 'emergeW': e.st-=dt; if(e.st<=0){ e.tele=null; e.alpha=1; e.invuln=false; e.sub=false; shake(10); SFX.play('boom'); if(d<e.r+58+p.r*0.6) hurtPlayer(ed(20),e.x,e.y,420); emit(e.x,e.y,30,{col:'90,120,60',glow:false,smin:80,smax:260,lmin:.4,lmax:.8,zmin:3,zmax:7,grow:6}); G.rings.push({x:e.x,y:e.y,rad:e.r,max:240,speed:520,thick:18,dmg:0,kb:300}); toRecover(e,0.9); } break;
    case 'recover': e.face=turnTo(e.face,a,2*dt); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.6,1.2)*(angry?0.75:1); } break;
    default: e.state='chase'; e.alpha=1; e.invuln=false; e.sub=false;
  }
  if(e.mouth>0) e.mouth-=dt;
};
AI.greymane=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), f=e.hp/e.maxHp;
  e.cd-=dt; e.dx=e.dy=0;
  const angry=f<0.5;
  const wantHowl=(e.howled===0)||(e.howled===1&&f<0.62)||(e.howled===2&&f<0.3);
  switch(e.state){
    case 'chase':
      if(d>230) steer(e,p.x,p.y,e.speed);
      else{ e.orbit+=dt*1.3*e.orbitDir; steer(e,p.x+Math.cos(e.orbit)*200,p.y+Math.sin(e.orbit)*200,e.speed*0.8); }
      if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),6*dt);
      if(e.cd<=0){
        if(wantHowl&&countType('wolf')<4){ e.state='howl'; e.st=1.0; e.tele=newTele({shape:'circle',r:70,dur:1.0,col:'200,230,255'}); e.howled++; break; }
        const r=Math.random();
        if(d<e.r+p.r+40){ e.state='swipeW'; e.st=0.4; e.tele=newTele({shape:'arc',r:e.r+44,half:1.0,dur:0.4}); }
        else if(r<0.6||d>380){ e.chain=angry?3:1; e.state='pounceW'; e.st=angry?0.42:0.55; e.tele=newTele({shape:'line',len:320,w:e.r*2,dur:e.st}); }
        else { e.state='frostW'; e.st=0.7; e.tele=newTele({shape:'cone',len:270,half:0.5,dur:0.7,col:'160,210,255'}); }
      }
      break;
    case 'howl':
      e.face=turnTo(e.face,a,2*dt); e.st-=dt;
      if(e.st<=0){ e.tele=null; SFX.play('howl'); shake(5); for(let i=0;i<2;i++){ const s=spotNear(e.x,e.y,120,240); spawnRune('wolf',s.x,s.y,{level:7,snowy:true,aggro:true}); } G.rings.push({x:e.x,y:e.y,rad:e.r,max:260,speed:500,thick:16,dmg:0,kb:280}); toRecover(e,0.6); }
      break;
    case 'swipeW': e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.tele=null; if(inCone(e.x,e.y,e.face,e.r+46,1.05,p.x,p.y,p.r)) hurtPlayer(ed(14),e.x,e.y,300); SFX.play('slash'); toRecover(e,0.5); } break;
    case 'pounceW': if(e.st>0.15) e.face=turnTo(e.face,a,8*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='pounce'; e.st=0.38; e.hitP=false; SFX.play('dash'); } break;
    case 'pounce':
      e.dx=Math.cos(e.face)*760; e.dy=Math.sin(e.face)*760;
      if(!e.hitP&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+6){ if(hurtPlayer(ed(16),e.x,e.y,320)) e.hitP=true; }
      if(Math.random()<0.6) emit(e.x,e.y,1,{col:'230,240,250',glow:false,smin:20,smax:60,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:4});
      e.st-=dt;
      if(e.st<=0){ e.chain--; if(e.chain>0){ e.state='pounceW'; e.st=0.32; e.tele=newTele({shape:'line',len:320,w:e.r*2,dur:0.32}); } else toRecover(e,0.7); }
      break;
    case 'frostW': e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='frost'; e.st=1.0; e.tick=0; } break;
    case 'frost': {
      e.face=turnTo(e.face,a,1.1*dt);
      const mx=e.x+Math.cos(e.face)*(e.r+8), my=e.y+Math.sin(e.face)*(e.r+8);
      emit(mx,my,4,{col:'200,230,255',ang:e.face,spread:0.32,smin:380,smax:470,lmin:.4,lmax:.55,zmin:4,zmax:7,grow:18,drag:1});
      e.tick-=dt; if(e.tick<=0){ e.tick=0.12; if(inCone(mx,my,e.face,270,0.48,p.x,p.y,p.r)){ if(hurtPlayer(ed(8),mx,my,90)) {} p.slowT=1.4; } }
      e.st-=dt; if(e.st<=0) toRecover(e,0.6);
      break; }
    case 'recover': steer(e,e.x-(p.x-e.x),e.y-(p.y-e.y),e.speed*0.35); e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.5,1.1)*(angry?0.7:1); } break;
    default: e.state='chase';
  }
};
AI.bat=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0;
  if(e.state==='swoop'){ e.dx=Math.cos(e.face)*430; e.dy=Math.sin(e.face)*430; if(!e.hitP&&d<e.r+p.r+4){ if(hurtPlayer(e.dmg,e.x,e.y,120)) e.hitP=true; } e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(1,2.2); } return; }
  e.orbit+=dt*2.2*e.orbitDir; const rr=110+Math.sin(e.t*3)*34; steer(e,p.x+Math.cos(e.orbit)*rr,p.y+Math.sin(e.orbit)*rr,e.speed);
  if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),8*dt);
  if(e.cd<=0&&d<260){ e.state='swoop'; e.st=0.34; e.face=a; e.hitP=false; }
};
AI.slime=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0; if(e.hopT>0) e.hopT-=dt;
  if(e.cd<=0){ e.cd=rand(0.75,1.25); e.hopT=0.25; const sp=e.small?240:190; e.vx+=Math.cos(a)*sp; e.vy+=Math.sin(a)*sp; e.face=a; }
  e.touchCd=(e.touchCd||0)-dt; if(e.touchCd<=0&&d<e.r+p.r){ if(hurtPlayer(e.dmg,e.x,e.y,160)) e.touchCd=0.8; }
};
AI.wolf=AIW.wolf;
