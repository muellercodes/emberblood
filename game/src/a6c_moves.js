// ================= jump, water stride and wings (Ember's three gifts)
// Contract: player.z (height in px), player.vz, player.flying, player.onWater. grantAbility('jump'|'stride'|'wings').
// updatePlayer calls movesPre (input), movesAirVel (air steering), movesTryJump (take-off) and movesPost (height, landing, water fx).
const JUMP_V=224, JUMP_G=896, FLY_Z=60, FLY_K=1.6, FLY_SEC=14;
const MV={jumpBuf:0,holdT:0,zoomK:1,lx:null,ly:null,gustT:0,tip:null,lk:null,hover:null,meterA:0,steamT:0,rippleT:0,emberT:0,scorchT:0,flapPh:0,showWings:0,lastG:null,noFlyT:0,flights:0,landHintT:0,trailT:0};
let HURT_SRC='';   // set to 'proj' (or 'air') around hurtPlayer calls that can reach a flying Ash
const flyMax=()=>FLY_SEC*((player&&player.stats&&player.stats.flyMax)||1);
function canJump(){ return !!G&&(G.mode==='normal'||hasAbil('jump')); }
function canWalkWater(){ return !!G&&G.mode==='story'&&hasAbil('stride'); }
// v9: Double Jump and Skimmer are powers found in Act I side quests, Meteor Slam came back as Ground Pound (Act III)
function canDblJump(){ return !!G&&(G.mode==='normal'||hasAbil('dbljump'))&&canJump(); }
function canSkim(){ return !!G&&G.mode==='story'&&hasAbil('skimmer')&&canWalkWater(); }
function canPound(){ return !!G&&G.mode==='story'&&hasAbil('pound'); }
function canFlyHere(){
  if(!G||G.mode!=='story'||!hasAbil('wings')) return false;
  if(AREA) return !!(AREA.canFly||(AREA.def&&AREA.def.canFly));
  if(G.boss&&!G.boss.dead) return false;     // no flying over a boss fight in the open
  return true;
}
// what to call the jump control on this device
function jumpCtl(){
  if(typeof padActive==='function'&&padActive()) return {k:'A',v:'press A (Cross on PlayStation)'};
  if(touchy()) return {k:'JUMP',v:'tap JUMP'};
  const k=btnLabel('jump','kb')||'C'; return {k,v:'press '+k};
}
const capF=s=>s.charAt(0).toUpperCase()+s.slice(1);
function mvEnsure(p){ if(p.z==null){ p.z=0; p.vz=0; p.flying=false; p.onWater=false; } if(p.flyE==null) p.flyE=flyMax(); if(p.wingO==null) p.wingO=0; }
function moveReset(p){ p=p||player; p.z=0; p.vz=0; p.flying=false; p.landing=false; p.gliding=false; p.slam=false; p.dbl=false; p.avx=p.avy=0; MV.hover=null; MV.lk=null; }
// ---------- small synthesized sounds (bypass SFX.play so jumps, splashes and wing beats get their own voices)
function mvSnd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted||!SFX.noise) return;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.45*(v==null?1:v); out.connect(ac.destination);
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.01,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(kind){
      case 'jump': nz(0.16,0.16,'bandpass',500,1500,1.3); tn('sine',260,470,0.11,0.035); break;
      case 'dbl': nz(0.14,0.14,'bandpass',700,2000,1.5); tn('sine',380,700,0.1,0.035); break;
      case 'land': nz(0.12,0.22,'lowpass',520,110,0.8); break;
      case 'splash': nz(0.55,0.32,'lowpass',2600,260,0.6); nz(0.22,0.14,'bandpass',900,2800,2,0.04); for(let i=0;i<4;i++) tn('sine',560+i*180,880+i*210,0.06,0.025,0.08+i*0.05); break;
      case 'sizzle': nz(0.7,0.22,'highpass',2600,5200,0.5); nz(0.35,0.22,'lowpass',420,70,0.7); break;
      case 'flap': nz(0.16,0.15,'lowpass',380,120,0.9); break;
      case 'takeoff': nz(0.55,0.22,'bandpass',260,1400,0.8); tn('triangle',200,420,0.32,0.045); break;
      case 'hiss': nz(0.3,0.035,'highpass',3200,6500,0.4); break;
      case 'gust': nz(1.1,0.24,'bandpass',260,820,0.6); break;
      case 'slam': nz(0.55,0.42,'lowpass',900,45,0.7); tn('sine',96,30,0.42,0.26); break;
      case 'hoop': [784,988,1319].forEach((f,i)=>tn('triangle',f,f,0.16,0.045,i*0.06)); break;
      case 'reel': tn('square',900,1500,0.05,0.02); tn('square',1000,1600,0.05,0.02,0.07); break;
    }
  }catch(e){}
}
// ---------- per-frame movement pieces, called from updatePlayer (a6_player.js)
function movesPre(dt,inp){
  const p=player; mvEnsure(p);
  if(!MV.late){ MV.late=true; reachLate(); }   // place things that need the finished world (a1j_quests4.js)
  if(MV.lastG!==G){ MV.lastG=G; moveReset(p); p.flyE=flyMax(); MV.tip=null; MV.zoomK=1; if(G.mode==='normal') mvTip('Jump',`${capF(jumpCtl().v)} to jump over rocks and shockwaves.`,8,'mv_jump'); }
  // a teleport (fast travel, a door, a respawn) drops Ash out of the sky
  if(MV.lx!=null&&dist2(p.x,p.y,MV.lx,MV.ly)>420*420) moveReset(p);
  if(inp.jump) MV.jumpBuf=0.14; else MV.jumpBuf-=dt;
  MV.holdT=inp.jumpHeld?MV.holdT+dt:0;
  if(MV.showWings>0) MV.showWings-=dt;
  if(MV.noFlyT>0) MV.noFlyT-=dt;
  if(MV.lk) lkUpdate(dt,inp);
  if(p.flying){
    if(MV.jumpBuf>0){ MV.jumpBuf=0; if(p.landing&&p.flyE>0.3&&!MV.hover){ p.landing=false; mvSnd('flap'); } else if(!p.gliding){ p.landing=true; } }
    if(!canFlyHere()&&!p.landing&&!p.gliding){ p.landing=true; if(G.boss&&!G.boss.dead) ftext(p.x,p.y-p.z-30,'Too dangerous to fly here!','#ffd9a0',13); }
    if(inp.use) inp.use=false;
    return true;
  }
  const air=p.z>0||p.vz>0;
  if(air){
    const fly=canFlyHere()&&p.flyE>=1;
    if(MV.jumpBuf>0){
      if(canDblJump()&&!p.dbl&&!p.slam){ MV.jumpBuf=0; p.dbl=true; p.vz=Math.max(p.vz,JUMP_V*(p.stats.jumpK||1)*0.92); MV.flapT=0.35; mvSnd('dbl'); emit(p.x,p.y-p.z,10,{col:'255,190,110',smin:40,smax:120,lmin:.2,lmax:.45,zmin:1.5,zmax:3,drag:4}); }
      else if(fly&&!p.slam){ MV.jumpBuf=0; takeOff(p); return true; }
      else if(hasAbil('wings')&&!p.slam&&!AREA&&G.mode==='story'&&MV.noFlyT<=0){ MV.noFlyT=2; ftext(p.x,p.y-p.z-30,p.flyE<1?'Your wings need a rest':'No room to fly here','#ffd9a0',12); }
    }else if(MV.holdT>0.3&&fly&&!p.slam&&p.vz<90){ takeOff(p); return true; }
    if(canPound()&&inp.attack&&!p.slam&&p.z>6){ p.slam=true; p.vz=-560; mvSnd('takeoff',0.6); }
    if(p.slam) inp.attack=false;
  }
  return air;
}
function takeOff(p){
  p.flying=true; p.landing=false; p.gliding=false; p.slam=false; p.vz=Math.max(p.vz,140); MV.flights++; MV.hover=null;
  mvSnd('takeoff'); MV.flapPh=0; p.sqT=0.16; p.sqD=0.16; p.sqA=-0.1;
  emit(p.x,p.y,16,{col:'190,170,140',glow:false,smin:60,smax:180,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:8});
  if(MV.flights<=2) MV.landHintT=5;
}
// horizontal velocity while airborne: a jump keeps its momentum (a little steering), flight is fast and floaty
function movesAirVel(dt,inp){
  const p=player, st=p.stats, moving=Math.abs(inp.mx)+Math.abs(inp.my)>0.05;
  if(p.flying){
    let spd=st.speed*FLY_K*(p.gliding?0.8:1)*(p.breathing?0.72:1);
    let tx=inp.mx*spd, ty=inp.my*spd;
    if(MV.hover){ const a=angTo(p.x,p.y,MV.hover.x,MV.hover.y), d=dist(p.x,p.y,MV.hover.x,MV.hover.y), s=Math.min(240,d*4); tx=Math.cos(a)*s; ty=Math.sin(a)*s; }
    const k=1-Math.exp(-dt*3.4); p.avx=lerp(p.avx||0,tx,k); p.avy=lerp(p.avy||0,ty,k);
    return [p.avx,p.avy];
  }
  if(moving){
    const base=st.speed*1.1*(st.jumpK||1), sp=Math.max(base,MV.takeSpd||0), k=1-Math.exp(-dt*3);
    p.avx=lerp(p.avx||0,inp.mx*sp,k); p.avy=lerp(p.avy||0,inp.my*sp,k);
  }
  return [p.avx||0,p.avy||0];
}
function movesTryJump(vx,vy,inp){
  const p=player;
  if(MV.jumpBuf<=0||!canJump()||p.flying||p.z>0||p.drinkT>0||G.fishing||MV.lk||p.dead) return;
  if(p.dashT>0.1) return;
  MV.jumpBuf=0; p.dashT=0;
  const k=p.stats.jumpK||1, sp=Math.hypot(vx,vy), cap=p.stats.speed*1.55*1.1*k;
  let m=1.1*k; if(sp*m>cap) m=cap/Math.max(1,sp);
  p.avx=vx*m; p.avy=vy*m; MV.takeSpd=sp*m;
  p.vz=JUMP_V*k; p.z=0.01; p.dbl=false; p.slam=false; MV.flapT=0.5; MV.jrec={x0:p.x,y0:p.y,t0:G.time,zmax:0};
  p.sqT=0.12; p.sqD=0.12; p.sqA=-0.12;
  mvSnd('jump'); if(p.onWater){ G.ripples.push({x:p.x,y:p.y,t:0,max:0.7,r:18,splash:true}); } else emit(p.x,p.y+5,5,{col:'150,130,110',glow:false,smin:20,smax:60,lmin:.2,lmax:.4,zmin:2,zmax:4,grow:5});
  if(G.stats) G.stats.jumps=(G.stats.jumps||0)+1;
}
// height, landing, water and lava, the wall's winds, ripples and steam
function movesPost(dt,ox,oy,inp){
  const p=player, st=p.stats, mx=flyMax();
  if(p.flying){
    p.flyE=Math.max(0,p.flyE-dt);
    if(p.flyE<=0&&!p.gliding){ p.gliding=true; p.landing=false; ftext(p.x,p.y-p.z-34,'Wings tired! Gliding down','#ffd9a0',13); }
    if(p.landing||p.gliding){
      p.z-=dt*(MV.hover?40:p.gliding?24:115);
      if(MV.hover&&p.z<8) p.z=8;
      if(p.z<=1||(MV.hover&&dist(p.x,p.y,MV.hover.x,MV.hover.y)<8)){
        if(landOK(p.x,p.y)) touchDown(p);
        else{ if(!MV.hover||dist(p.x,p.y,MV.hover.x,MV.hover.y)<8){ const s=nearestLand(p.x,p.y); MV.hover=s||{x:p.safeX||p.x,y:p.safeY||p.y}; } p.z=Math.max(p.z,8); }
      }
    }else{ p.z+=(FLY_Z-p.z)*(1-Math.exp(-dt*3.2)); }
    const ph0=MV.flapPh; MV.flapPh+=dt*(p.gliding?1.2:p.z<FLY_Z-12?10:6.2);
    if(Math.floor(MV.flapPh/TAU)!==Math.floor(ph0/TAU)&&!p.gliding) mvSnd('flap',0.55);
    // the Obsidian Wall's storm winds until the gate is open
    if(!AREA&&!G.flags.gate&&p.y<WALL_Y+170){
      const k=clamp((WALL_Y+170-p.y)/110,0,1); p.avy=Math.max(p.avy,320*k); p.y=Math.max(p.y,WALL_Y+64);
      if(Math.random()<0.6) emit(p.x+rand(-160,160),p.y-p.z-rand(20,120),1,{col:'230,236,245',glow:false,ang:Math.PI/2,spread:0.15,smin:300,smax:480,lmin:.25,lmax:.45,zmin:1,zmax:1.8,drag:0.5,alpha:0.5});
      MV.gustT-=dt; if(MV.gustT<=0){ MV.gustT=3.5; mvSnd('gust'); ftext(p.x,p.y-p.z-34,'The Wall’s storm winds push you back!','#e6eef8',13); mvTip('The Obsidian Wall','The winds over the Wall are too strong to fly through. The gate has to open first.',5,'mv_wall'); }
    }
    // wingtip embers
    MV.emberT-=dt; if(MV.emberT<=0){ MV.emberT=0.08; const s=Math.random()<0.5?-1:1, f=p.facing, lx=-14, ly=52*s; emit(p.x+Math.cos(f)*lx-Math.sin(f)*ly,p.y-p.z+Math.sin(f)*lx+Math.cos(f)*ly,1,{col:'255,170,90',smin:5,smax:25,lmin:.3,lmax:.6,zmin:1,zmax:2,drag:2,rise:-30}); }
    p.onWater=false;
  }else if(p.z>0||p.vz>0){
    const k=st.jumpK||1;
    const gz=JUMP_G*k*(p.slam?1.6:1); p.z+=p.vz*dt-0.5*gz*dt*dt; p.vz-=gz*dt; if(MV.jrec) MV.jrec.zmax=Math.max(MV.jrec.zmax,p.z);   // an exact arc at any frame rate
    if(p.z<=0){ p.z=0; const sl=p.slam; p.vz=0; if(MV.jrec){ MV.jrec.x1=p.x; MV.jrec.y1=p.y; MV.jrec.t=G.time-MV.jrec.t0; MV.jrec.d=Math.round(dist(MV.jrec.x0,MV.jrec.y0,p.x,p.y)); } landed(p,sl); }
  }
  if(!p.flying&&p.z<=0){
    // refill the wing meter on the ground
    if(p.flyE<mx) p.flyE=Math.min(mx,p.flyE+mx/3.4*dt);
    // water underfoot (striding)
    p.onWater=!AREA&&canWalkWater()&&T(p.x,p.y,PT).water&&blockedAt(p.x,p.y);
    if(!playerBlocked(p.x,p.y)&&!p.onWater){ p.safeX=p.x; p.safeY=p.y; }
    if(p.onWater){
      MV.rippleT-=dt*(p.moving?(p.sprinting?2.2:1.4):0.5); if(MV.rippleT<=0){ MV.rippleT=0.16; G.ripples.push({x:p.x+rand(-3,3),y:p.y+4,t:0,max:0.9,r:p.sprinting?20:15}); }
      MV.steamT-=dt; if(MV.steamT<=0){ MV.steamT=p.moving?0.07:0.16; emit(p.x+rand(-8,8),p.y+rand(-2,8),1,{col:'236,240,246',glow:false,ang:-Math.PI/2,spread:0.7,smin:8,smax:26,lmin:.7,lmax:1.3,zmin:3,zmax:6,grow:9,drag:1,alpha:0.32}); }
      MV.hissT-=dt; if(MV.hissT<=0){ MV.hissT=rand(0.7,1.4); mvSnd('hiss'); }
      if(p.sprinting&&Math.random()<0.4) emit(p.x-Math.cos(p.facing)*10,p.y-Math.sin(p.facing)*10+4,1,{col:'210,230,240',glow:false,ang:p.facing+Math.PI,spread:0.9,smin:30,smax:90,lmin:.2,lmax:.4,zmin:1.5,zmax:3,drag:3});
    }
  }
  // wing pose: spread in flight, half open while jumping, folded at rest
  const wt=p.flying?1:MV.showWings>0?1:p.z>0?0.5:0; p.wingO=lerp(p.wingO||0,wt,1-Math.exp(-dt*(wt>p.wingO?9:5)));
  if(MV.flapT>0) MV.flapT-=dt;
  if(!p.flying&&MV.showWings>0) MV.flapPh+=dt*3;
  if(p.sqT>0) p.sqT-=dt;
  if(MV.landHintT>0) MV.landHintT-=dt;
  if(MV.tip){ MV.tip.t+=dt; if(MV.tip.t>MV.tip.dur) MV.tip=null; }
  MV.lx=p.x; MV.ly=p.y;
}
function touchDown(p){
  p.flying=false; p.landing=false; p.gliding=false; p.z=0; p.vz=0; MV.hover=null;
  p.sqT=0.18; p.sqD=0.18; p.sqA=0.14; mvSnd('land',1.2); shake(2);
  if(!AREA&&T(p.x,p.y,PT).water&&blockedAt(p.x,p.y)){ G.ripples.push({x:p.x,y:p.y+4,t:0,max:0.9,r:26,splash:true}); emit(p.x,p.y,10,{col:'220,235,245',glow:false,smin:40,smax:120,lmin:.25,lmax:.5,zmin:1.5,zmax:3,drag:3}); }
  else emit(p.x,p.y+4,14,{col:'150,130,110',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:8});
}
// a jump just ended
function landed(p,slam){
  p.dbl=false; p.slam=false; MV.takeSpd=0;
  if(!AREA){
    const bad=landBad(p.x,p.y);
    if(bad){ backToSafe(p,bad); return; }
  }
  p.sqT=0.14; p.sqD=0.14; p.sqA=slam?0.2:0.11;
  if(T(p.x,p.y,PT).water&&canWalkWater()&&!AREA){ G.ripples.push({x:p.x,y:p.y+4,t:0,max:0.8,r:22,splash:true}); emit(p.x,p.y,6,{col:'220,235,245',glow:false,smin:30,smax:90,lmin:.2,lmax:.45,zmin:1.5,zmax:3,drag:3}); }
  else emit(p.x,p.y+5,slam?24:8,{col:'150,130,110',glow:false,smin:30,smax:slam?220:100,lmin:.25,lmax:.55,zmin:2,zmax:slam?7:4,grow:7});
  mvSnd('land',slam?1.6:0.9);
  if(slam) slamImpact(p);
}
function landBad(x,y){
  if(outOfMap(x,y,30)) return null;
  if(!blockedAt(x,y)) return null;
  if(y<2850&&lavaAt(x,y,segsDist(x,y,ROAD_SEGS))) return 'lava';
  if(canWalkWater()) return null;
  return T(x,y,{}).water?'water':null;
}
function backToSafe(p,bad){
  const x=p.x, y=p.y;
  if(bad==='water'){
    mvSnd('splash'); for(let i=0;i<3;i++) G.ripples.push({x:x+rand(-6,6),y:y+rand(-4,4),t:0,max:0.7+i*0.25,r:16+i*10,splash:true});
    emit(x,y,22,{col:'215,232,245',glow:false,ang:-Math.PI/2,spread:1.3,smin:60,smax:200,lmin:.3,lmax:.7,zmin:1.5,zmax:3.5,drag:2,rise:-160});
    ftext(x,y-26,'Splash!','#bfe6ff',14);
  }else{
    mvSnd('sizzle'); emit(x,y,30,{kind:'fire',smin:60,smax:220,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:8,drag:3});
    emit(x,y,10,{col:'70,60,55',glow:false,ang:-Math.PI/2,spread:0.8,smin:20,smax:70,lmin:.8,lmax:1.4,zmin:5,zmax:9,grow:10,drag:1});
  }
  let sx=p.safeX, sy=p.safeY;
  if(sx==null||dist(sx,sy,x,y)>900||playerBlocked(sx,sy)){ const s=nearestLand(x,y); if(s){ sx=s.x; sy=s.y; } }
  if(sx!=null){ p.x=sx; p.y=sy; }
  p.avx=p.avy=0; p.kvx=p.kvy=0; MV.lx=p.x; MV.ly=p.y;
  emit(p.x,p.y,12,{col:'255,210,150',smin:30,smax:100,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
  if(bad==='lava'){ const a=p.stats.armor||1, dm=G.diff?G.diff.dmg:1; p.iframes=0; HURT_SRC='lava'; hurtPlayer(p.maxHp*0.15/Math.max(0.01,dm*a),x,y,0); HURT_SRC=''; ftext(p.x,p.y-30,'Too hot!','#ffb070',14); }
  else p.iframes=Math.max(p.iframes,0.5);
}
function slamImpact(p){
  const st=p.stats, R=70, dmg=st.slash*st.dmgMul*(st.wpnMul||1)*1.7;
  shake(9); hitstop=Math.max(hitstop,0.05); mvSnd('slam');
  for(const e of G.enemies){
    if(e.dead||e.invuln||e.spawnIn>0||e.passive||e.flying) continue;
    if(dist(p.x,p.y,e.x,e.y)<R+e.r&&ashHits(e)){ damageEnemy(e,dmg*rand(0.9,1.1),{src:'slam',kb:380,ka:angTo(p.x,p.y,e.x,e.y)}); if(!e.dead) stunEnemy(e,0.9); }   // (v12: not through a wall)
  }
  for(let i=0;i<18;i++){ const a=i/18*TAU; emit(p.x+Math.cos(a)*20,p.y+Math.sin(a)*14,1,{col:'255,190,110',ang:a,spread:0.1,smin:160,smax:260,lmin:.2,lmax:.35,zmin:2,zmax:4,drag:5}); }
  G.ripples.push({x:p.x,y:p.y,t:0,max:0.5,r:R*1.3,splash:true});
  scorch(p.x,p.y,R*0.8);
  try{ areaObjHit(p.x,p.y,R,'hammer'); }catch(e){}
  if(G.mode==='story') try{ swingBreakables(p.x,p.y,p.facing,R,Math.PI); }catch(e){}
}
// ---------- terrain for Ash (enemies and followers keep using blockedAt)
function lavaSpot(x,y){ return y<2850&&lavaAt(x,y,segsDist(x,y,ROAD_SEGS)); }
function playerBlocked(x,y){
  const p=player;
  if(x>=IZX-50) return areaBlocked(x,y);
  if(outOfMap(x,y,30)) return true;
  if(p&&(p.flying||(p.z||0)>0)) return false;      // water and lava never block in the air
  if(!blockedAt(x,y)) return false;
  if(!canWalkWater()) return true;
  return lavaSpot(x,y);
}
function landOK(x,y){
  if(x>=IZX-50){ if(areaBlocked(x,y)) return false; if(AREA&&AREA.tri&&AREA.cave){ const k=tCell(x,y); if(!(tGround(k)||(canWalkWater()&&tWet(k)))) return false; } }
  else{
    if(outOfMap(x,y,40)) return false;
    if(Math.abs(y-WALL_Y)<70) return false;
    if(blockedAt(x,y)&&!(canWalkWater()&&!lavaSpot(x,y))) return false;
  }
  let hit=false; const r=(player&&player.r)||14;
  forCols(x,y,r+2,c=>{ if(hit||!colActive(c)) return; if(c.t==='c'){ if(dist2(x,y,c.x,c.y)<(c.r+r)**2) hit=true; } else if(x>c.x0-r&&x<c.x1+r&&y>c.y0-r&&y<c.y1+r) hit=true; });
  return !hit;
}
function nearestLand(x,y){
  if(landOK(x,y)) return {x,y};
  for(let d=24;d<1400;d+=24){ const n=Math.max(8,Math.round(d/14)); for(let i=0;i<n;i++){ const a=i/n*TAU, px=x+Math.cos(a)*d, py=y+Math.sin(a)*d; if(landOK(px,py)) return {x:px,y:py}; } }
  return null;
}
// can this hit reach Ash while he flies? Projectiles and flying foes can; ground melee cannot
function airHitOK(sx,sy){
  if(HURT_SRC==='proj'||HURT_SRC==='air'||HURT_SRC==='lava') return true;
  for(const e of G.enemies) if(e.flying&&!e.dead&&Math.abs(e.x-sx)<3&&Math.abs(e.y-sy)<3) return true;
  return false;
}
// fire breath from the sky: the flame pours down onto the ground ahead of Ash's shadow
function breathFly(dt){
  const p=player, ang=p.facing, z=p.z||0, mx=p.x+Math.cos(ang)*16, my=p.y+Math.sin(ang)*16;
  for(let i=0;i<4;i++){
    const L=rand(30,170), a=ang+rand(-0.38,0.38), gx=p.x+Math.cos(a)*L, gy=p.y+Math.sin(a)*L, sx=mx, sy=my-z*0.92, d=Math.max(1,dist(sx,sy,gx,gy)), sp=rand(380,470);
    G.particles.length<950&&G.particles.push({x:sx,y:sy,vx:(gx-sx)/d*sp,vy:(gy-sy)/d*sp,life:d/sp*1.05,max:d/sp*1.05,size:rand(3,5.5),grow:20,drag:0.3,kind:'fire',col:'255,190,90',glow:true,rise:0,al:1});
  }
  if(Math.random()<0.55){ const L=rand(40,170), a=ang+rand(-0.4,0.4); emit(p.x+Math.cos(a)*L,p.y+Math.sin(a)*L,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.3,lmax:.6,zmin:3,zmax:6,grow:10,drag:1}); }
  MV.scorchT-=dt; if(MV.scorchT<=0){ MV.scorchT=0.18; const L=rand(50,160), a=ang+rand(-0.3,0.3); scorch(p.x+Math.cos(a)*L,p.y+Math.sin(a)*L,rand(14,26)); }
  breathIgnite(p.x+Math.cos(ang)*10,p.y+Math.sin(ang)*10,ang,dt);
  p.breathTick-=dt;
  if(p.breathTick<=0){
    p.breathTick=0.1;
    for(const e of G.enemies){
      if(e.dead||e.invuln||e.spawnIn>0||e.passive) continue;
      for(const c of hitCircles(e)){
        if(inArcC(p.x,p.y,ang,180,0.5,c)){
          damageEnemy(e,4.6*p.stats.fire*p.stats.dmgMul*rand(0.9,1.1),{src:'fire',kb:20,ka:angTo(p.x,p.y,e.x,e.y),mult:c.m>1?1.2:1});
          if(!e.dead&&!e.lastBlocked){ e.burnT=2.2; e.burnDps=Math.max(e.burnDps,5*p.stats.fire*p.stats.dmgMul); }
          break;
        }
      }
    }
  }
}
// a tip pill that stays up long enough to read and goes in the log; the same tip again just stays up longer.
// id names it for the X that closes it for good (controls build); Settings > Tips: Off keeps them all away (still logged)
function mvTip(title,text,dur,id){
  title=simplify(title); text=simplify(text);
  const d=Math.max(dur||0,readT(text,4,10));
  if(MV.tip&&MV.tip.text===text){ MV.tip.dur=Math.max(MV.tip.dur,MV.tip.t+d); return; }
  logAdd({k:'tip',text:title,sub:text,key:'tip:'+text});
  id=id||'mv:'+title; if(!tipOn(id)) return;
  MV.tip={title,text,t:0,dur:d,id};
}
// ---------- getting a new gift (the Trials call this)
const ABIL_INFO={
  jump:{name:'The Ember Leap',sub:c=>`You can jump! ${capF(c.v)} to hop over fences, rocks, gaps and shockwaves.`,plain:'You can jump over fences, rocks, gaps and shockwaves!',tip:c=>`Jump with ${c.k}. Sprint first to jump farther. Jumping over water is fine. Landing in it is not!`},
  stride:{name:'The Tide Stride',sub:()=>`Your fire runs so hot the water holds you up. Walk right across rivers and lakes!`,tip:c=>`Just walk onto the water. Sprint on it to skim even faster. Islands are waiting out there.`},
  wings:{name:'The Ember Wings',sub:c=>`You have wings! Jump, then ${c.v} again in the air to fly.`,plain:'You have wings! Now you can fly.',tip:c=>`Fly: jump, then ${c.k} again in the air (or hold ${c.k}). ${c.k} once more to land. Your wings tire, so watch the wing meter.`}
};
function grantAbility(id){
  G.abil=G.abil||{}; const had=!!G.abil[id]; G.abil[id]=true;
  if(had||!player) return;
  const I=ABIL_INFO[id]||{name:id,sub:()=>'New ability',tip:()=>''}, c=jumpCtl(), p=player;
  setBanner(I.name,!tipsOn()&&I.plain?I.plain:I.sub(c),4.2);
  try{ jingle('chapter','quest'); }catch(e){}
  mvTip('New ability',I.tip(c),10,'abil_'+id);
  flashA=0.3; flashCol='255,200,130'; shake(5);
  emit(p.x,p.y,46,{col:id==='stride'?'170,220,255':'255,200,120',ang:-Math.PI/2,spread:1.6,smin:40,smax:220,lmin:.5,lmax:1.2,zmin:1.5,zmax:3.5,rise:30});
  if(id==='wings'){ MV.showWings=3; p.flyE=flyMax(); }
  if(id==='stride'){ for(let i=0;i<4;i++) G.ripples.push({x:p.x,y:p.y,t:0,max:0.8+i*0.3,r:30+i*16}); }
  if(G.stats) G.stats['abil_'+id]=G.playTime|0;
  if(G.mode==='story') saveGame();
}
// ---------- camera: zoom out a little while flying (updateCam calls this every frame)
function moveZoom(dt){
  const want=(player&&player.flying&&!player.dead&&scene!=='menu'&&!MV.noZoom)?0.84:1;
  if(want===1&&MV.zoomK===1) return;
  MV.zoomK+=(want-MV.zoomK)*(1-Math.exp(-dt*2.4));
  if(want===1&&Math.abs(MV.zoomK-1)<0.003) MV.zoomK=1;
  zoom=ZOOM0*MV.zoomK;
}
// no doors or prompts while flying
// (and treasure chests marked `always` can still be opened in a fight, like the stock chests)
{ const base=updateInteractions; updateInteractions=function(dt){
  base(dt); const p=player; if(!p) return;
  if(p.flying){ G.prompt=null; return; }
  if(!G.prompt&&G.inCombat&&!AREA&&!G.fishing){ let bd=1e9; for(const o of LANDMARKS){ if(!o.always||!o.prompt||(o.hidden&&o.hidden())) continue; const d=dist(p.x,p.y,o.x,o.y); if(d<(o.r||20)+46&&d<bd){ bd=d; G.prompt={text:o.prompt,act:()=>lmAct(o),x:o.x,y:o.y,always:true}; } } }
}; }

// ================= drawing: wings, shadows, flight extras and the HUD
// Ash's wings, drawn inside drawHero after the tail (ctx is at Ash, rotated so he faces +x)
const WFOLD={R:[-2,7],W:[-6,17],F:[[-27,16.5],[-30,14],[-31.5,11.5],[-31,8.5]],H:[-19,6]};
const WOPEN={R:[-1,8],W:[4,45],F:[[-11,57],[-25,48],[-31,34],[-27,19]],H:[-17,9]};
function wingPts(o,fk){
  const l=(a,b)=>[lerp(a[0],b[0],o),lerp(a[1],b[1],o)], fy=q=>[q[0]+(1-fk)*7*o,8+(q[1]-8)*fk];
  return {R:l(WFOLD.R,WOPEN.R),W:fy(l(WFOLD.W,WOPEN.W)),F:WFOLD.F.map((f,i)=>fy(l(f,WOPEN.F[i]))),H:l(WFOLD.H,WOPEN.H)};
}
function wingPath(g,P){
  const R=P.R,W=P.W,F=P.F,H=P.H, pull=(a,b,k)=>[lerp((a[0]+b[0])/2,W[0],k),lerp((a[1]+b[1])/2,W[1],k)];
  g.beginPath(); g.moveTo(R[0],R[1]);
  g.quadraticCurveTo(lerp(R[0],W[0],0.45)+2,lerp(R[1],W[1],0.5),W[0],W[1]);
  g.lineTo(F[0][0],F[0][1]);
  for(let i=0;i<F.length-1;i++){ const c=pull(F[i],F[i+1],0.22); g.quadraticCurveTo(c[0],c[1],F[i+1][0],F[i+1][1]); }
  const c=pull(F[3],H,0.2); g.quadraticCurveTo(c[0],c[1],H[0],H[1]);
  g.closePath();
}
function drawWingsHook(p,L,fl){
  if(!G) return;
  const t=p.t||0;
  if(hasAbil('wings')){
    const o=clamp(p.wingO||0,0,1), fly=p.flying, ph=MV.flapPh;
    const fk=o<0.02?1:fly?(p.gliding?0.94+Math.sin(t*3)*0.03:0.66+0.34*Math.cos(ph)):MV.showWings>0?0.8+0.2*Math.cos(ph):0.9+Math.sin(t*28)*0.08*(p.z>0?1:0);
    const P=wingPts(o,fk), night=G?1-daylight():0;
    for(const s of [-1,1]){
      ctx.save(); ctx.scale(1,s);
      const lit=0.5+0.5*clamp(L.y*s*-1,-1,1), up=fly?0.5-0.5*Math.cos(ph):0;
      // membrane
      const g=ctx.createRadialGradient(P.R[0],P.R[1],2,P.R[0],P.R[1],Math.max(16,dist(P.R[0],P.R[1],P.F[0][0],P.F[0][1])));
      g.addColorStop(0,fl?'#fff':'#4a140c'); g.addColorStop(0.42,fl?'#fff':'#8a2c1a'); g.addColorStop(0.85,fl?'#fff':'#b0402a'); g.addColorStop(1,fl?'#fff':'#c8553a');
      ctx.fillStyle=g; wingPath(ctx,P); ctx.fill();
      if(o>0.15){ ctx.fillStyle=`rgba(255,200,150,${(0.05+0.1*lit+0.08*up)*o})`; ctx.fill(); }
      // membrane veins, faint, from the wrist into the webbing
      if(o>0.3){ ctx.strokeStyle=`rgba(60,14,8,${0.35*o})`; ctx.lineWidth=0.6; ctx.beginPath(); for(let i=0;i<P.F.length-1;i++){ const a=P.F[i], b=P.F[i+1]; ctx.moveTo(lerp(P.W[0],a[0],0.35),lerp(P.W[1],a[1],0.35)); ctx.quadraticCurveTo((a[0]+b[0])/2+1,(a[1]+b[1])/2,(a[0]*0.55+b[0]*0.45),(a[1]*0.55+b[1]*0.45)); } ctx.stroke(); }
      // trailing edge glow (warm, brighter at night and in flight)
      if(o>0.08){
        ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,${120+40*up|0},60,${(0.1+0.32*night+0.08*(fly?1:0))*o})`; ctx.lineWidth=2;
        const F=P.F, W=P.W, H=P.H, pull=(a,b,k)=>[lerp((a[0]+b[0])/2,W[0],k),lerp((a[1]+b[1])/2,W[1],k)];
        ctx.beginPath(); ctx.moveTo(F[0][0],F[0][1]); for(let i=0;i<F.length-1;i++){ const c=pull(F[i],F[i+1],0.22); ctx.quadraticCurveTo(c[0],c[1],F[i+1][0],F[i+1][1]); } const c=pull(F[3],H,0.2); ctx.quadraticCurveTo(c[0],c[1],H[0],H[1]); ctx.stroke();
        ctx.restore();
      }
      // bones: the arm along the leading edge, then four fingers
      ctx.lineCap='round';
      ctx.strokeStyle=fl?'#fff':'#3a0e08'; ctx.lineWidth=2.6+0.6*o; ctx.beginPath(); ctx.moveTo(P.R[0],P.R[1]); ctx.quadraticCurveTo(lerp(P.R[0],P.W[0],0.45)+2,lerp(P.R[1],P.W[1],0.5),P.W[0],P.W[1]); ctx.stroke();
      ctx.strokeStyle=fl?'#fff':'#9a3420'; ctx.lineWidth=0.9; ctx.stroke();
      ctx.strokeStyle=fl?'#fff':`rgba(58,14,8,${0.25+0.75*o})`; ctx.lineWidth=0.8+0.5*o;
      for(const f of P.F){ ctx.beginPath(); ctx.moveTo(P.W[0],P.W[1]); ctx.quadraticCurveTo(lerp(P.W[0],f[0],0.5)+1.5,lerp(P.W[1],f[1],0.5),f[0],f[1]); ctx.stroke(); }
      // the wrist claw
      ctx.fillStyle=fl?'#fff':'#efe2c4'; ctx.beginPath(); ctx.moveTo(P.W[0]-1.6,P.W[1]-1); ctx.quadraticCurveTo(P.W[0]+3.5,P.W[1]+0.5,P.W[0]+4.5,P.W[1]+3.2); ctx.quadraticCurveTo(P.W[0]+1.2,P.W[1]+1.8,P.W[0]-0.6,P.W[1]+1.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle=fl?'#fff':'#5e1a10'; ctx.beginPath(); ctx.arc(P.W[0],P.W[1],1.9+0.5*o,0,TAU); ctx.fill();
      ctx.restore();
    }
    return;
  }
  if(hasAbil('jump')||G.mode==='normal'){
    // little wing nubs on his back, fluttering when he jumps
    const up=p.z>0||MV.flapT>0, f=up?0.55+0.45*Math.sin(t*46):0;
    for(const s of [-1,1]){
      ctx.save(); ctx.scale(1,s); ctx.translate(-4,9); ctx.rotate(0.5*f-0.15);
      // a little bud of a wing: a bony edge with a leathery fan behind it
      const tx=-9-f*3, ty=10+f*5;
      ctx.fillStyle=fl?'#fff':r2lg(ctx,0,0,tx,ty,'#5e1a10','#9a3420','#d0583a');
      ctx.beginPath(); ctx.moveTo(1,-1); ctx.quadraticCurveTo(-1,ty*0.7,tx,ty); ctx.quadraticCurveTo(tx*0.55,ty*0.45,tx*0.9,ty*0.25); ctx.quadraticCurveTo(tx*0.6,ty*0.12,-8,-1.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle=fl?'#fff':'#3a0e08'; ctx.lineWidth=1.1; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(1,-1); ctx.quadraticCurveTo(-1,ty*0.7,tx,ty); ctx.stroke();
      ctx.fillStyle=fl?'#fff':'#efe2c4'; ctx.beginPath(); ctx.arc(tx,ty,1.1,0,TAU); ctx.fill();
      ctx.restore();
    }
  }
}
// the shadow under a jumping or flying Ash (drawn first by drawPlayer)
function drawMoveShadow(p){
  const z=p.z||0; if(z<0.5&&!p.flying) return;
  const sun=AREA?{dx:4,dy:6,a:0.28}:sunInfo(), off=0.5+z/35, sx=p.x+sun.dx*off, sy=p.y+sun.dy*off, k=clamp(1-z/80,0.3,1);
  const a=(AREA?0.3:0.16+0.2*daylight())*(p.flying?1.35:1);
  ctx.save(); ctx.translate(sx,sy);
  ctx.globalAlpha=a*(0.6+0.4*k); ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(0,0,15*(0.55+0.45*k),11*(0.55+0.45*k),0,0,TAU); ctx.fill();
  ctx.globalAlpha=a*0.55*k; ctx.beginPath(); ctx.ellipse(0,0,8*k+2,6*k+1.5,0,0,TAU); ctx.fill();
  if(hasAbil('wings')&&(p.wingO||0)>0.3){
    ctx.rotate(p.facing); ctx.globalAlpha=a*0.9*(p.wingO||0); const ph=MV.flapPh, fk=p.flying?(p.gliding?0.94:0.66+0.34*Math.cos(ph)):0.8, P=wingPts(clamp(p.wingO,0,1),fk);
    for(const s of [-1,1]){ ctx.save(); ctx.scale(1,s); wingPath(ctx,P); ctx.fill(); ctx.restore(); }
  }
  ctx.restore(); ctx.globalAlpha=1;
}
// world space, after the trees: flying Ash, wind streaks, the sky race hoops
function drawAirborneHook(){
  const p=player; if(!p) return;
  if(G&&G.mini&&G.mini.kind==='skyrace'&&typeof drawSkyHoops==='function') drawSkyHoops(G.mini,G.time);
  if(!p.flying||p.dead) return;
  drawPlayer();
  const sp=Math.hypot(p.avx||0,p.avy||0); if(sp<60) return;
  // short streaks of wind rushing past Ash (in a box around him, fading toward its edges)
  const a=Math.atan2(p.avy,p.avx), ca=Math.cos(a), sa=Math.sin(a), t=G.time, n=14, k=clamp((sp-60)/260,0,1), B=260, cx=p.x, cy=p.y-p.z;
  ctx.save(); ctx.lineWidth=1.2; ctx.lineCap='round';
  for(let i=0;i<n;i++){
    const h1=((i*7919)%1000)/1000, h2=((i*104729)%1000)/1000, len=16+h2*26;
    const u=((h1*B*2-t*sp*1.1*ca)%(B*2)+B*2)%(B*2)-B, v=((h2*B*2-t*sp*1.1*sa)%(B*2)+B*2)%(B*2)-B, f=Math.max(0,1-Math.hypot(u,v)/B);
    if(f<0.05) continue;
    ctx.strokeStyle=`rgba(240,246,252,${0.3*k*f})`; ctx.beginPath(); ctx.moveTo(cx+u,cy+v); ctx.lineTo(cx+u-ca*len,cy+v-sa*len); ctx.stroke();
  }
  ctx.restore();
}
// the wing meter (a slim ring beside Ash), landing hints and the new-ability tip
function drawMoveHud(){
  const p=player; if(!p||!G) return;
  const mx=flyMax(), show=p.flying||(hasAbil('wings')&&p.flyE<mx-0.05);
  MV.meterA=lerp(MV.meterA,show?1:0,show?0.25:0.06);
  if(MV.meterA>0.02&&scene==='play'){
    const sx=(p.x-cam.x)*zoom, sy=(p.y-(p.z||0)-cam.y)*zoom, cx=sx+34*zoom+8, cy=sy-26*zoom, R=10, f=clamp(p.flyE/mx,0,1), low=f<0.25;
    ctx.save(); ctx.globalAlpha=MV.meterA;
    ctx.fillStyle='rgba(20,10,6,.45)'; ctx.beginPath(); ctx.arc(cx,cy,R+3.5,0,TAU); ctx.fill();
    ctx.lineCap='round'; ctx.lineWidth=5.5; ctx.strokeStyle='rgba(20,10,6,.55)'; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke();
    const col=p.gliding?`rgb(255,${90+60*Math.sin(G.time*10)|0},60)`:low?'#ff7a3a':'#ffc864';
    ctx.lineWidth=3.2; ctx.strokeStyle=col; ctx.beginPath(); ctx.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+TAU*f); ctx.stroke();
    // a tiny wing glyph inside
    ctx.fillStyle=low?'#ffb080':'#ffe2b0'; ctx.beginPath(); ctx.moveTo(cx-5,cy+2.5); ctx.quadraticCurveTo(cx-3,cy-5,cx+5,cy-4.5); ctx.quadraticCurveTo(cx+2,cy-2.5,cx+3.5,cy-0.5); ctx.quadraticCurveTo(cx+0.5,cy-0.5,cx+1.5,cy+2); ctx.quadraticCurveTo(cx-1.5,cy+1.2,cx-5,cy+2.5); ctx.fill();
    let hint=''; const c=jumpCtl();
    if(p.flying){ if(MV.hover) hint='Finding a spot to land'; else if(p.gliding) hint='Gliding down'; else if(p.landing) hint='Landing'; else if(low) hint='Landing soon'; else if(MV.landHintT>0&&tipsOn()) hint=`${c.k} to land`; }
    if(hint){ ctx.font=`700 11px ${UIF}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.6)'; ctx.strokeText(hint,cx+R+7,cy); ctx.fillStyle='#fff1dc'; ctx.fillText(hint,cx+R+7,cy); }
    ctx.restore();
  }
  // the new-ability tip, a pill above the bottom of the screen
  const tp=MV.tip;
  if(tp&&scene==='play'){
    const a=clamp(Math.min(tp.t/0.35,(tp.dur-tp.t)/0.6),0,1); if(a>0){
      ctx.save(); ctx.globalAlpha=a; ctx.textBaseline='middle';
      ctx.font=`500 13px ${UIF}`; const maxW=Math.min(520,W-60), lines=wrapText(tp.text,maxW-36).slice(0,3);
      let tw=0; for(const l of lines) tw=Math.max(tw,ctx.measureText(l).width); ctx.font=`800 10px ${UIF}`; tw=Math.max(tw,ctx.measureText(tp.title.toUpperCase()).width);
      // room on the right for the X that closes it (controls build); on touch it sits above the buttons
      const bw=tw+62, bh=26+lines.length*17;
      let bx=W/2-bw/2, by=H-SAFE.b-(G.prompt?150:104)-bh;
      if(usingTouch){ const at=touchClear(bw,bh,touchBase()-40-bh/2); bx=at.x-bw/2; by=at.y-bh/2; }
      by=Math.max(SAFE.t+110,by);
      ctx.fillStyle='rgba(14,9,6,.78)'; rr(bx,by,bw,bh,12); ctx.fill(); ctx.strokeStyle='rgba(255,190,110,.45)'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='rgba(255,150,70,.9)'; rr(bx+10,by+9,3,bh-18,1.5); ctx.fill();
      ctx.textAlign='left'; ctx.font=`800 10px ${UIF}`; ctx.fillStyle='#ffc66a'; ctx.fillText(tp.title.toUpperCase(),bx+22,by+13);
      ctx.font=`500 13px ${UIF}`; ctx.fillStyle='#f6ead8'; lines.forEach((l,i)=>ctx.fillText(l,bx+22,by+30+i*17));
      ctx.restore();
      if(a>0.3) tipX(bx+bw-16,by+15,()=>{ if(MV.tip===tp){ tipShut(tp.id); MV.tip=null; } },usingTouch?11:9);
    }
  }
}
window.__ebX=Object.assign(window.__ebX||{},{
  grant:id=>grantAbility(id), abil:()=>JSON.stringify(G.abil||{}), MV,
  jump:()=>{ MV.jumpBuf=0.14; }, fly:()=>{ const p=player; mvEnsure(p); if(!p.flying){ p.z=Math.max(p.z,10); takeOff(p); p.z=FLY_Z; } }, land:()=>{ if(player.flying) player.landing=true; },
  flyMeter:v=>{ if(v!=null) player.flyE=v; return player.flyE; }, landOK, nearestLand, playerBlocked, canFlyHere,
  spawn:(type,x,y)=>{ const e=makeEnemy(type,x,y,{aggro:true,level:1}); e.spawnIn=0; return e.id; },
  setZoom:z=>{ ZOOM0=z; zoom=z*MV.zoomK; }, scr:()=>({x:(player.x-cam.x)*zoom,y:(player.y-(player.z||0)-cam.y)*zoom})
});
