// ================= the guardians of Ember's Trials, their helpers, and the new Trial foes
// Old Gnarl (Leap), the Mirrow Serpent (Tide) and Skrae the Storm Wyvern (Sky) are e.boss so the boss bar shows,
// but they never touch the story bosses: no fight site, no G.bossDone. a2h_dungeons.js spawns them and pays out.
Object.assign(EDEF,{
  gnarl:{r:54,hp:780,speed:62,dmg:15,value:300,boss:true,kbRes:0.04,name:'Old Gnarl',title:'Root Giant of the Leap',short:'Root Giant'},
  serpent:{r:30,hp:900,speed:150,dmg:14,value:420,boss:true,kbRes:0,swim:true,name:'The Mirrow Serpent',title:'Old Coil of Lake Mirrow',short:'Old Coil'},
  skrae:{r:30,hp:1050,speed:240,dmg:15,value:560,boss:true,flying:true,kbRes:0.08,name:'Skrae',title:'The Storm Wyvern',short:'Storm Wyvern'},
  knot:{r:16,hp:99999,speed:0,dmg:0,value:0,kbRes:0},
  bramble:{r:24,hp:62,speed:92,dmg:11,value:60,kbRes:0.25,shield:true,mini:true},
  crab:{r:14,hp:40,speed:96,dmg:9,value:14,kbRes:0.55,shield:true},
  eel:{r:12,hp:30,speed:160,dmg:8,value:12,kbRes:0.5,swim:true},
  gust:{r:12,hp:22,speed:175,dmg:4,value:12,flying:true,kbRes:1.3}
});
Object.assign(DCOL,{gnarl:'110,140,70',serpent:'90,170,200',skrae:'230,230,240',knot:'255,220,120',bramble:'120,90,50',crab:'220,110,70',eel:'90,150,170',gust:'220,236,255'});
const trialT=()=>AREA&&AREA.tri;
// a push from wind or a blow counts as a shove for chasm falls
function trialShove(){ const T=trialT(); if(T) T.ext=Math.max(T.ext||0,0.2); }
// keep a custom mover inside its arena
function arenaClamp(e,m){ const A=e.arena; if(!A) return; m=m||e.r; e.x=clamp(e.x,A.x0+m,A.x1-m); e.y=clamp(e.y,A.y0+m,A.y1-m); }

// ---------- Old Gnarl, the root giant
AI.gnarl=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), T=trialT(), angry=e.hp<e.maxHp*0.5;
  e.cd-=dt; e.dx=e.dy=0; if(e.swing>0) e.swing-=dt;
  if(!e.knot){ const k=makeEnemy('knot',e.x,e.y,{aggro:true,level:1}); k.inArea=e.inArea; k.owner=e; k.flying=true; k.noClip=true; k.passive=true; k.invuln=true; k.alpha=0; e.knot=k; }
  if(!e.angry&&angry){ e.angry=true; taunt('ember',`He's angry now! Watch for double rings!`); }
  // fire breath on his roots makes him flinch and show the knot
  if(e.burnT>0&&e.state!=='stuck'&&e.state!=='flinch'){ e.scorch=(e.scorch||0)+dt; if(e.scorch>1.3){ e.scorch=0; e.state='flinch'; e.st=1.8; e.tele=null; ftext(e.x,e.y-e.r-14,'Roots burn!','#ffb060',15); SFX.play('hurt'); shake(4); } }
  const spd=e.speed*(angry?1.25:1);
  switch(e.state){
    case 'chase':
      e.face=turnTo(e.face,a,1.3*dt);
      if(d>e.r+p.r+30) steer(e,p.x,p.y,spd);
      e.walk=(e.walk||0)+dt*(d>e.r+p.r+30?1:0);
      if(e.cd<=0){
        const r=Math.random();
        if(d<e.r+p.r+60&&r<0.45){ e.state='swipeW'; e.st=0.6; e.tele=newTele({shape:'arc',r:e.r+64,half:1.1,dur:0.6}); }
        else if(r<0.62||(e.rings|0)<1){ e.state='stompW'; e.st=0.85; e.rings=(e.rings|0)+1; e.tele=newTele({shape:'circle',r:e.r+48,dur:0.85,col:'255,170,60'}); }
        else if(r<0.82){ e.state='rootsW'; e.st=0.55; }
        else { e.state='logW'; e.st=0.7; }
      }
      break;
    case 'swipeW': e.face=turnTo(e.face,a,1.6*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.swing=0.3; if(inCone(e.x,e.y,e.face,e.r+66,1.15,p.x,p.y,p.r)) hurtPlayer(ed(15),e.x,e.y,380); SFX.play('slash3'); shake(5); toRecover(e,0.7); } break;
    case 'stompW': e.st-=dt; e.lift=1-clamp(e.st/0.85,0,1); if(e.st<=0){
        e.tele=null; e.lift=0; shake(12); SFX.play('boom');
        emit(e.x,e.y,30,{col:'120,100,70',glow:false,smin:80,smax:280,lmin:.4,lmax:.9,zmin:4,zmax:9,grow:8});
        if(T){ T.rings.push({x:e.x,y:e.y,rad:e.r,max:820,speed:300,thick:18,dmg:ed(13)}); if(angry) T.rings.push({x:e.x,y:e.y,rad:e.r,max:820,speed:300,thick:18,dmg:ed(13),delay:0.55}); }
        e.state='stuck'; e.st=angry?1.9:2.4; ftext(e.x,e.y-e.r-14,'Stuck! Hit the knot!','#ffe066',14);
      } break;
    case 'stuck': case 'flinch': e.st-=dt; if(Math.random()<dt*6) emit(e.x+rand(-30,30),e.y+rand(-20,20),1,{col:'110,90,60',glow:false,smin:10,smax:40,lmin:.4,lmax:.8,zmin:2,zmax:4}); if(e.st<=0){ e.state='recover'; e.st=0.5; } break;
    case 'rootsW': e.st-=dt; e.arms=1; if(e.st<=0){
        e.arms=0; SFX.play('cast'); shake(4);
        if(T){ const n=angry?6:4; T.roots.push({x:p.x,y:p.y,r:34,t:0,delay:0.95,up:0}); for(let i=1;i<n;i++){ const ra=rand(0,TAU), rr=rand(70,190), x=p.x+Math.cos(ra)*rr, y=p.y+Math.sin(ra)*rr; if(!blockedAt(x,y)) T.roots.push({x,y,r:34,t:0,delay:0.95+i*0.12,up:0}); } }
        toRecover(e,0.6);
      } break;
    case 'logW': e.face=turnTo(e.face,a,3*dt); e.st-=dt; e.holdLog=1; if(e.st<=0){
        e.holdLog=0; SFX.play('slash3');
        if(T){ const n=angry?2:1; for(let i=0;i<n;i++){ const la=a+(i?rand(-0.5,0.5):0), sx=e.x+Math.cos(la)*(e.r+20), sy=e.y+Math.sin(la)*(e.r+20); T.logs.push({x:sx,y:sy,vx:Math.cos(la)*330,vy:Math.sin(la)*330,ang:la,len:96,life:3.2,roll:0,dmg:ed(13),delay:i*0.45}); } }
        toRecover(e,0.6);
      } break;
    case 'recover': e.face=turnTo(e.face,a,1*dt); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.7,1.3)*(angry?0.7:1); } break;
    default: e.state='chase';
  }
};
// the glowing knot on Gnarl's back: an invisible helper that passes hits on to him, much harder, while he is stuck
AI.knot=(e,dt)=>{
  const o=e.owner; if(!o||o.dead){ e.dead=true; return; }
  e.dx=e.dy=0; e.vx=e.vy=0;
  e.x=o.x-Math.cos(o.face)*o.r*0.62; e.y=o.y-Math.sin(o.face)*o.r*0.62;
  const open=o.state==='stuck'||o.state==='flinch';
  e.passive=!open; e.invuln=!open; e.alpha=open?1:0;
  if(e.hp<e.maxHp){ const dmg=e.maxHp-e.hp; e.hp=e.maxHp; damageEnemy(o,dmg*2.6,{src:'knot',crit:true}); o.flash=0.12; if(!(o.knotTxt>G.time)){ o.knotTxt=G.time+0.6; ftext(e.x,e.y-20,'KNOT!','#ffe066',16); } }
};
// ---------- Bramblehorn, the bark beetle (mini-boss of the Leap)
AI.bramble=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), T=trialT();
  e.cd-=dt; e.dx=e.dy=0;
  e.blocking=(e.state==='chase'||e.state==='chargeAim')&&e.stun<=0;
  switch(e.state){
    case 'chase':
      e.face=turnTo(e.face,a,2.2*dt); if(d>e.r+p.r+24) steer(e,p.x,p.y,e.speed);
      if(e.cd<=0){
        if(d<e.r+p.r+40){ e.state='gore'; e.st=0.45; e.tele=newTele({shape:'arc',r:e.r+40,half:0.8,dur:0.45}); }
        else if(Math.random()<0.6){ e.state='chargeAim'; e.st=0.8; e.tele=newTele({shape:'line',len:460,w:e.r*2,dur:0.8}); }
        else { e.state='stompW'; e.st=0.7; e.tele=newTele({shape:'circle',r:e.r+30,dur:0.7,col:'255,170,60'}); }
      }
      break;
    case 'gore': e.face=turnTo(e.face,a,2*dt); e.st-=dt; if(e.st<=0){ e.tele=null; if(inCone(e.x,e.y,e.face,e.r+42,0.9,p.x,p.y,p.r)) hurtPlayer(e.dmg,e.x,e.y,320); SFX.play('slash'); toRecover(e,0.6); } break;
    case 'chargeAim': if(e.st>0.2) e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='charge'; e.st=0.9; e.hitP=false; SFX.play('dash'); } break;
    case 'charge':
      e.dx=Math.cos(e.face)*540; e.dy=Math.sin(e.face)*540;
      if(Math.random()<0.5) emit(e.x,e.y,1,{col:'130,100,60',glow:false,smin:20,smax:60,lmin:.3,lmax:.6,zmin:3,zmax:5,grow:4});
      if(!e.hitP&&d<e.r+p.r+4){ if(hurtPlayer(e.dmg*1.2,e.x,e.y,420)) e.hitP=true; }
      if(e.hitWall&&e.st<0.82){ e.dx=e.dy=0; e.stun=2.2; e.blocking=false; toRecover(e,0.3); shake(9); SFX.play('boom'); ftext(e.x,e.y-e.r-10,'STUNNED!','#ffe066',15); break; }
      e.st-=dt; if(e.st<=0) toRecover(e,0.6);
      break;
    case 'stompW': e.st-=dt; if(e.st<=0){ e.tele=null; shake(7); SFX.play('boom'); if(T) T.rings.push({x:e.x,y:e.y,rad:e.r,max:560,speed:280,thick:16,dmg:e.dmg}); toRecover(e,0.8); } break;
    case 'recover': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.6,1.2); } break;
    default: e.state='chase';
  }
};
// ---------- snapper crabs: claws up in front, open after a snap
AI.crab=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0; if(e.snap>0) e.snap-=dt;
  e.blocking=e.state==='chase'&&e.stun<=0;
  switch(e.state){
    case 'chase': {
      e.face=turnTo(e.face,a,4*dt);
      const sa=a+e.strafe*0.75; if(d>e.r+p.r+14) steer(e,e.x+Math.cos(sa)*60,e.y+Math.sin(sa)*60,e.speed);
      if(Math.random()<dt*0.5) e.strafe*=-1;
      if(d<e.r+p.r+30&&e.cd<=0){ e.state='snapW'; e.st=0.42; e.tele=newTele({shape:'arc',r:e.r+30,half:0.9,dur:0.42}); }
      break; }
    case 'snapW': e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.snap=0.25; if(inCone(e.x,e.y,e.face,e.r+32,1.0,p.x,p.y,p.r)) hurtPlayer(e.dmg,e.x,e.y,200); SFX.play('hit'); e.state='open'; e.st=0.9; } break;
    case 'open': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.8,1.5); } break;
    default: e.state='chase';
  }
};
// ---------- Mirrow eels: hide under the water, pop up, spit, dive
AI.eel=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0;
  switch(e.state){
    case 'chase':
      e.sub=true; e.invuln=true; e.alpha=0.15;
      e.orbit+=dt*1.1*e.orbitDir; steer(e,p.x+Math.cos(e.orbit)*150,p.y+Math.sin(e.orbit)*150,e.speed*(d>260?1:0.6));
      if(Math.random()<dt*5) G.ripples.push({x:e.x+rand(-6,6),y:e.y+rand(-6,6),t:0,max:0.7,r:rand(8,14)});
      if(e.cd<=0&&d<440){ e.state='rise'; e.st=0.55; e.tele=newTele({shape:'circle',r:e.r+12,dur:0.55,col:'120,200,255'}); }
      break;
    case 'rise': e.st-=dt; if(e.st<=0){ e.tele=null; e.sub=false; e.invuln=false; e.alpha=1; e.state='spit'; e.st=0.35; SFX.play('pop'); G.ripples.push({x:e.x,y:e.y,t:0,max:0.9,r:20,splash:true}); } break;
    case 'spit': e.face=turnTo(e.face,a,8*dt); e.st-=dt; if(e.st<=0){ shoot(e.x+Math.cos(a)*10,e.y+Math.sin(a)*10,a,270,7,e.dmg,'ice'); SFX.play('cast'); e.state='up'; e.st=1.2; } break;
    case 'up': e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(d<e.r+p.r+4){ if(hurtPlayer(e.dmg,e.x,e.y,160)) e.st=Math.min(e.st,0.3); } if(e.st<=0){ e.state='dive'; e.st=0.3; } break;
    case 'dive': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(1.6,2.8); G.ripples.push({x:e.x,y:e.y,t:0,max:0.8,r:16}); } break;
    default: e.state='chase';
  }
};
// ---------- gust sprites: little clouds that blow you about
AI.gust=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.cd-=dt; e.dx=e.dy=0; e.puff=(e.puff||0)+dt;
  switch(e.state){
    case 'chase':
      e.orbit+=dt*1.0*e.orbitDir; steer(e,p.x+Math.cos(e.orbit)*200,p.y+Math.sin(e.orbit)*200,e.speed);
      e.face=turnTo(e.face,a,5*dt);
      if(e.cd<=0&&d<320){ e.state='blowW'; e.st=0.65; e.tele=newTele({shape:'cone',len:260,half:0.42,dur:0.65,col:'200,230,255'}); }
      break;
    case 'blowW': e.face=turnTo(e.face,a,4*dt); e.st-=dt; e.cheeks=1-clamp(e.st/0.65,0,1); if(e.st<=0){ e.tele=null; e.state='blow'; e.st=0.75; SFX.play('roll'); } break;
    case 'blow': {
      e.cheeks=0; e.st-=dt;
      emit(e.x+Math.cos(e.face)*e.r,e.y+Math.sin(e.face)*e.r,2,{col:'230,240,255',glow:false,ang:e.face,spread:0.35,smin:260,smax:360,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:5,drag:1});
      if(inCone(e.x,e.y,e.face,260,0.42,p.x,p.y,p.r)){ if(AREA&&AREA.tri) tNudge(p,Math.cos(e.face)*260*dt,Math.sin(e.face)*260*dt); else { p.kvx+=Math.cos(e.face)*900*dt; p.kvy+=Math.sin(e.face)*900*dt; } trialShove(); if(!e.hitP&&d<120){ e.hitP=hurtPlayer(e.dmg,e.x,e.y,120); } }
      if(e.st<=0){ e.hitP=false; toRecover(e,0.6); }
      break; }
    case 'recover': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(1.5,2.6); } break;
    default: e.state='chase';
  }
};

// ---------- the Mirrow Serpent: swims under the arena, surfaces to spit, sweeps its tail, stirs a whirlpool
function serpentSpot(e){
  const p=player, A=e.arena;
  for(let t=0;t<40;t++){ const a=rand(0,TAU), r=rand(170,330), x=clamp(p.x+Math.cos(a)*r,A.x0+90,A.x1-90), y=clamp(p.y+Math.sin(a)*r,A.y0+90,A.y1-90); if(AREA&&AREA.tri&&tWet(tCell(x,y))&&tWet(tCell(x+40,y))&&tWet(tCell(x-40,y))&&tWet(tCell(x,y+40))&&tWet(tCell(x,y-40))) return {x,y}; }
  return {x:A.cx+rand(-200,200),y:A.cy+rand(-150,150)};
}
AI.serpent=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), T=trialT(), angry=e.hp<e.maxHp*0.5;
  e.noClip=true; e.cd-=dt; e.dx=e.dy=0; e.vx*=0.8; e.vy*=0.8; e.whirlCd=(e.whirlCd==null?10:e.whirlCd)-dt;
  if(!e.trail){ e.trail=[]; for(let i=0;i<60;i++) e.trail.push({x:e.x-i*7,y:e.y+Math.sin(i*0.3)*20}); e.state='dive'; e.st=0.3; }
  if(!e.angry&&angry){ e.angry=true; taunt('ember','He is stirring up the lake! Keep away from the middle!'); }
  const swimTo=(tx,ty,spd)=>{ const dd=dist(e.x,e.y,tx,ty); if(dd>4){ const k=Math.min(1,spd*dt/dd); e.x+=(tx-e.x)*k; e.y+=(ty-e.y)*k; e.face=turnTo(e.face,angTo(e.x,e.y,tx,ty),5*dt); } return dd; };
  switch(e.state){
    case 'dive': e.st-=dt; e.rise=clamp(e.st/0.6,0,1); if(e.st<=0){ e.sub=true; e.invuln=true; e.state='under'; e.goal=serpentSpot(e); e.st=4; } break;
    case 'under': {
      e.sub=true; e.invuln=true; e.rise=0; e.alpha=0.15;
      if(e.whirlCd<=0&&angry){ e.state='whirlGo'; e.goal={x:e.arena.cx,y:e.arena.cy}; break; }
      const dd=swimTo(e.goal.x,e.goal.y,e.speed*(angry?2.6:2.2)); e.st-=dt;
      if(Math.random()<dt*8) G.ripples.push({x:e.x+rand(-14,14),y:e.y+rand(-14,14),t:0,max:0.9,r:rand(10,22)});
      if(dd<10||e.st<=0){ e.state='riseW'; e.st=0.85; e.tele=newTele({shape:'circle',r:e.r+44,dur:0.85,col:'120,210,255'}); }
      break; }
    case 'riseW': e.st-=dt; if(Math.random()<dt*14) G.ripples.push({x:e.x+rand(-30,30),y:e.y+rand(-30,30),t:0,max:0.6,r:rand(8,16)}); if(e.st<=0){
        e.tele=null; e.sub=false; e.invuln=false; e.alpha=1; e.state='up'; e.st=angry?3.0:3.6; e.acts=angry?2:1; e.cd=0.4;
        SFX.play('boom'); shake(7); G.ripples.push({x:e.x,y:e.y,t:0,max:1.1,r:46,splash:true});
        emit(e.x,e.y,30,{col:'190,230,255',glow:false,ang:-Math.PI/2,spread:1.4,smin:60,smax:240,lmin:.4,lmax:.9,zmin:2,zmax:5});
        if(d<e.r+52+p.r*0.5&&!airborne()) hurtPlayer(ed(14),e.x,e.y,380);
      } break;
    case 'up': {
      e.rise=Math.min(1,(e.rise||0)+dt*4); e.face=turnTo(e.face,a,2.5*dt); e.st-=dt;
      if(e.cd<=0&&e.acts>0){ e.acts--; e.cd=1.1;
        if(Math.random()<0.55||d>380){ const n=angry?5:3; for(let i=0;i<n;i++) shoot(e.x+Math.cos(a)*20,e.y+Math.sin(a)*20,a+(i-(n-1)/2)*0.24,280,9,ed(11),'ice'); SFX.play('cast'); e.spit=0.3; }
        else if(T){ const ta=rand(0,TAU), tx=clamp(p.x+Math.cos(ta)*120,e.arena.x0+60,e.arena.x1-60), ty=clamp(p.y+Math.sin(ta)*120,e.arena.y0+60,e.arena.y1-60), a0=angTo(tx,ty,p.x,p.y)-1.5; T.zones.push({kind:'sweep',x:tx,y:ty,r:190,a0,a1:a0+3.0,t:0,delay:0.9,dur:0.55,dmg:ed(14)}); SFX.play('warn'); }
      }
      if(d<e.r+p.r+2){ if(hurtPlayer(ed(10),e.x,e.y,320)) {} }
      if(e.st<=0){ e.state='dive'; e.st=0.6; SFX.play('roll'); }
      break; }
    case 'whirlGo': { e.sub=true; e.invuln=true; e.alpha=0.15; const dd=swimTo(e.goal.x,e.goal.y,e.speed*2.6); if(dd<12){ e.state='whirl'; e.st=6; e.whirlCd=15; if(T) T.zones.push({kind:'whirl',x:e.x,y:e.y,r:300,t:0,dur:6,dmg:ed(9)}); SFX.play('roar'); shake(6); setBanner('Whirlpool!','Swim hard away from the middle!',1.6); } break; }
    case 'whirl': {
      e.sub=false; e.invuln=false; e.alpha=1; e.rise=0.55; e.st-=dt;
      e.spin=(e.spin||0)+dt*2.4; const r=150; e.x=e.arena.cx+Math.cos(e.spin)*r; e.y=e.arena.cy+Math.sin(e.spin)*r*0.8; e.face=e.spin+Math.PI/2;
      e.cd-=dt; if(e.cd<=0){ e.cd=0.9; shoot(e.x,e.y,a,250,8,ed(10),'ice'); }
      if(e.st<=0){ e.state='dive'; e.st=0.6; }
      break; }
    default: e.state='dive'; e.st=0.5;
  }
  arenaClamp(e,60);
  // the body follows the head
  const tr=e.trail, gap=dist(tr[0].x,tr[0].y,e.x,e.y);
  if(gap>7){ const n=Math.min(20,Math.floor(gap/7)), x0=tr[0].x, y0=tr[0].y; for(let i=1;i<=n;i++) tr.unshift({x:lerp(x0,e.x,i/n),y:lerp(y0,e.y,i/n)}); while(tr.length>60) tr.pop(); } else { tr[0].x=e.x; tr[0].y=e.y; }
};

// ---------- Skrae the Storm Wyvern: flies over the open sky, dives, calls lightning, beats up gales, rests on perches
AI.skrae=(e,dt)=>{
  const p=player, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), T=trialT(), angry=e.hp<e.maxHp*0.5;
  e.noClip=true; e.cd-=dt; e.dx=e.dy=0; e.vx*=0.9; e.vy*=0.9; e.flap=(e.flap||0)+dt*(e.state==='perched'?2:9); e.perchCd=(e.perchCd==null?9:e.perchCd)-dt;
  if(!e.angry&&angry){ e.angry=true; taunt('ember',`She's calling the whole storm! Keep moving!`); }
  const fly=(tx,ty,spd,turn)=>{ const ta=angTo(e.x,e.y,tx,ty); e.face=turnTo(e.face,ta,(turn||3)*dt); e.x+=Math.cos(e.face)*spd*dt; e.y+=Math.sin(e.face)*spd*dt; };
  e.flying=e.state!=='perched';
  switch(e.state){
    case 'chase': {
      e.orbit+=dt*0.9*e.orbitDir; const tx=p.x+Math.cos(e.orbit)*260, ty=p.y+Math.sin(e.orbit)*230;
      fly(tx,ty,e.speed*(angry?1.15:1),2.6);
      if(e.cd<=0){
        const r=Math.random();
        if(e.perchCd<=0&&T&&T.perches.length){ e.state='toPerch'; let best=null,bd=-1; for(const q of T.perches){ const dd=dist(q.x,q.y,p.x,p.y); if(dd>bd&&dd<900){ bd=dd; best=q; } } e.goal=best||T.perches[0]; }
        else if(r<0.34){ e.state='diveAim'; e.st=0.8; e.tele=newTele({shape:'line',len:520,w:e.r*1.8,dur:0.8,col:'180,220,255'}); }
        else if(r<0.6){ e.state='orbs'; e.st=0.6; }
        else if(r<0.84){ e.state='storm'; e.st=0.5; }
        else { e.state='galeW'; e.st=0.7; e.tele=newTele({shape:'cone',len:420,half:0.6,dur:0.7,col:'200,230,255'}); }
      }
      break; }
    case 'diveAim': e.face=turnTo(e.face,a,5*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='dive'; e.st=0.62; e.hitP=false; SFX.play('dash'); } break;
    case 'dive': e.x+=Math.cos(e.face)*760*dt; e.y+=Math.sin(e.face)*760*dt; if(Math.random()<0.6) emit(e.x,e.y,1,{col:'220,235,255',glow:false,smin:10,smax:40,lmin:.3,lmax:.5,zmin:3,zmax:6,grow:5}); if(!e.hitP&&d<e.r+p.r+6){ if(hurtPlayer(ed(17),e.x,e.y,420)){ e.hitP=true; trialShove(); } } e.st-=dt; if(e.st<=0) toRecover(e,0.5); break;
    case 'orbs': e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(e.st<=0){ const n=angry?4:3; for(let i=0;i<n;i++) shoot(e.x,e.y,a+(i-(n-1)/2)*0.6,170,10,ed(11),'orb','enemy',{homing:1.5,life:4.5}); SFX.play('thunder'); toRecover(e,0.5); } break;
    case 'storm': e.st-=dt; e.charge=1; if(e.st<=0){ e.charge=0; if(T){ const n=angry?7:5; for(let i=0;i<n;i++){ const ra=i?rand(0,TAU):0, rr=i?rand(60,240):0; T.zones.push({kind:'bolt',x:p.x+Math.cos(ra)*rr,y:p.y+Math.sin(ra)*rr,r:46,t:0,delay:1.0+i*0.14,dmg:ed(13)}); } } SFX.play('cast'); toRecover(e,0.8); } break;
    case 'galeW': e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='gale'; e.st=0.9; SFX.play('roll'); } break;
    case 'gale': { e.st-=dt; emit(e.x+Math.cos(e.face)*e.r,e.y+Math.sin(e.face)*e.r,3,{col:'230,240,255',glow:false,ang:e.face,spread:0.55,smin:300,smax:440,lmin:.4,lmax:.7,zmin:3,zmax:6,grow:8,drag:0.8});
      if(inCone(e.x,e.y,e.face,420,0.6,p.x,p.y,p.r)){ if(AREA&&AREA.tri) tNudge(p,Math.cos(e.face)*300*dt,Math.sin(e.face)*300*dt); trialShove(); }
      if(e.st<=0) toRecover(e,0.6); break; }
    case 'toPerch': { const dd=dist(e.x,e.y,e.goal.x,e.goal.y); fly(e.goal.x,e.goal.y,e.speed*1.1,6); if(dd<26){ e.x=e.goal.x; e.y=e.goal.y; e.state='perched'; e.st=angry?3.2:4.0; e.perchCd=12; shake(6); SFX.play('boom'); emit(e.x,e.y,20,{col:'220,220,230',glow:false,smin:40,smax:140,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:5}); ftext(e.x,e.y-e.r-12,'She landed! Strike!','#ffe066',14); } break; }
    case 'perched': e.st-=dt; e.face=turnTo(e.face,a,1.5*dt); if(d<e.r+p.r+40&&e.cd<=0){ e.cd=1.3; e.state='peck'; e.st=0.5; e.tele=newTele({shape:'arc',r:e.r+46,half:0.8,dur:0.5}); } if(e.st<=0){ e.state='takeoff'; e.st=0.4; SFX.play('roar'); } break;
    case 'peck': e.st-=dt; if(e.st<=0){ e.tele=null; if(inCone(e.x,e.y,e.face,e.r+48,0.85,p.x,p.y,p.r)) hurtPlayer(ed(14),e.x,e.y,360); SFX.play('slash3'); e.state='perched'; e.st=Math.max(0.6,e.st); } break;
    case 'takeoff': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=0.8; } break;
    case 'recover': fly(p.x+Math.cos(e.orbit)*300,p.y+Math.sin(e.orbit)*260,e.speed*0.8,2); e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.6,1.2)*(angry?0.75:1); } break;
    default: e.state='chase';
  }
  arenaClamp(e,40);
};

// ---------- ground effects for the guardians: shockwave rings to jump, rolling logs, root spikes, tail sweeps, whirlpools, lightning
function trialBossFx(dt){
  const T=trialT(); if(!T) return;
  const p=player, air=airborne(), alive=!p.dead&&scene==='play';
  if(T.ext>0) T.ext-=dt;
  for(const R of T.rings){
    if(R.delay>0){ R.delay-=dt; continue; }
    R.rad+=R.speed*dt;
    if(alive&&!R.hit&&!air){ const d=dist(R.x,R.y,p.x,p.y); if(Math.abs(d-R.rad)<R.thick/2+p.r*0.55){ if(hurtPlayer(R.dmg,R.x,R.y,280)) R.hit=true; } }
    if(alive&&air&&!R.hopped){ const d=dist(R.x,R.y,p.x,p.y); if(Math.abs(d-R.rad)<R.thick/2+p.r*0.55){ R.hopped=true; R.hit=true; ftext(p.x,p.y-30,pick(['Hop!','Nice jump!','Over it!']),'#c8ffb0',13); } }
  }
  T.rings=T.rings.filter(R=>R.rad<R.max);
  for(const L of T.logs){
    if(L.delay>0){ L.delay-=dt; continue; }
    L.life-=dt; L.x+=L.vx*dt; L.y+=L.vy*dt; L.roll+=dt*9;
    if(blockedAt(L.x+Math.cos(L.ang)*20,L.y+Math.sin(L.ang)*20)||colAt(L.x,L.y,18)){ L.life=0; emit(L.x,L.y,18,{col:'120,84,50',glow:false,smin:40,smax:160,lmin:.3,lmax:.7,zmin:2,zmax:5}); SFX.play('hit'); continue; }
    if(alive&&!L.hit){
      const nx=-Math.sin(L.ang), ny=Math.cos(L.ang), rx=p.x-L.x, ry=p.y-L.y, along=rx*nx+ry*ny, across=Math.abs(rx*Math.cos(L.ang)+ry*Math.sin(L.ang));
      if(Math.abs(along)<L.len/2+p.r*0.5&&across<16+p.r*0.6){ if(air){ if(!L.hopped){ L.hopped=true; ftext(p.x,p.y-30,'Hop!','#c8ffb0',13); } } else if(hurtPlayer(L.dmg,L.x,L.y,300)) L.hit=true; }
    }
  }
  T.logs=T.logs.filter(L=>L.life>0);
  for(const r of T.roots){
    r.t+=dt;
    if(r.up===0&&r.t>=r.delay&&!r.burnt){ r.up=0.9; SFX.play('slash3'); emit(r.x,r.y,12,{col:'110,80,50',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:5}); shake(2); if(alive&&!air&&dist(r.x,r.y,p.x,p.y)<r.r+p.r*0.4) hurtPlayer(ed(12),r.x,r.y,240); }
    else if(r.up>0){ r.up-=dt; if(alive&&!air&&!r.burnt&&dist(r.x,r.y,p.x,p.y)<r.r*0.7+p.r*0.3) hurtPlayer(ed(8),r.x,r.y,200); if(r.up<=0) r.done=true; }
  }
  T.roots=T.roots.filter(r=>!r.done&&!(r.burnt&&r.t>r.delay+0.3));
  for(const z of T.zones){
    z.t+=dt;
    if(z.kind==='sweep'){ if(z.t>=z.delay&&z.t<z.delay+z.dur){ const k=(z.t-z.delay)/z.dur, ang=lerp(z.a0,z.a1,k), d=dist(z.x,z.y,p.x,p.y); if(!z.sfx){ z.sfx=1; SFX.play('slash3'); G.ripples.push({x:z.x,y:z.y,t:0,max:0.8,r:30,splash:true}); } if(alive&&!z.hit&&d<z.r+p.r*0.5&&d>20&&Math.abs(angDiff(ang,angTo(z.x,z.y,p.x,p.y)))<0.3){ if(air){ if(!z.hopped){ z.hopped=true; ftext(p.x,p.y-30,'Hop!','#c8ffb0',13); } } else if(hurtPlayer(z.dmg,z.x,z.y,420)){ z.hit=true; trialShove(); } } } if(z.t>z.delay+z.dur+0.2) z.done=true; }
    else if(z.kind==='whirl'){ const d=dist(z.x,z.y,p.x,p.y), k=clamp(Math.min(z.t/0.6,(z.dur-z.t)/0.6),0,1); if(alive&&d<z.r&&!p.flying&&!air){ const a=angTo(p.x,p.y,z.x,z.y), pull=(110+150*(1-d/z.r))*k; tNudge(p,Math.cos(a)*pull*dt+Math.cos(a+Math.PI/2)*60*k*dt,Math.sin(a)*pull*dt+Math.sin(a+Math.PI/2)*60*k*dt); z.tick=(z.tick||0)-dt; if(d<70&&z.tick<=0){ z.tick=0.5; hurtPlayer(z.dmg,z.x,z.y,0); } } if(Math.random()<dt*20) G.ripples.push({x:z.x+rand(-z.r,z.r)*0.7,y:z.y+rand(-z.r,z.r)*0.6,t:0,max:0.9,r:rand(10,24)}); if(z.t>=z.dur) z.done=true; }
    else if(z.kind==='bolt'){ if(z.t>=z.delay&&!z.struck){ z.struck=true; T.bolts.push({x:z.x,y:z.y,t:0}); SFX.play('thunder'); shake(5); flashA=Math.max(flashA,0.12); flashCol='220,230,255'; emit(z.x,z.y,16,{col:'200,220,255',smin:60,smax:200,lmin:.2,lmax:.5,zmin:2,zmax:4}); if(alive&&dist(z.x,z.y,p.x,p.y)<z.r+p.r*0.5) hurtPlayer(z.dmg,z.x,z.y,260); } if(z.t>z.delay+0.35) z.done=true; }
  }
  T.zones=T.zones.filter(z=>!z.done);
  for(const b of T.bolts) b.t+=dt; T.bolts=T.bolts.filter(b=>b.t<0.35);
}
