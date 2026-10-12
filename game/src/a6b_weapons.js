// ================= weapons: Ember Blade, Twin Fangs, Pike, Forge Hammer, Ash Bow, Wing-rang
// Contract (V6.md): WEAPON_IDS, WEAPONS, giveWeapon(id,quiet), curWeapon(), drawWeaponIcon(g,id,x,y,size), drawWeaponHud(),
// autoSwing(), drawHeroWeapon(p), drawWeaponFx(). updatePlayer (a6_player.js) calls updateWeapon(dt,inp) where the sword used to be.
// Every weapon hits for p.stats.slash (forge tiers raise it) x its own factor x dmgMul x wpnMul, and rolls crits (base + stats.critCh).
const WEAPON_IDS=['sword','daggers','spear','hammer','bow','boomerang'];
const WEAPONS={
  sword:{name:'Ember Blade',short:'Sword',desc:'Three quick swings, and the third one is big.',melee:true,crit:0.05},
  daggers:{name:'Twin Fangs',short:'Daggers',desc:'Very fast little stabs. Hit a foe from behind for extra damage.',melee:true,crit:0.18},
  spear:{name:'Pike',short:'Spear',desc:'Long reach. It pokes through a whole line of foes and pushes them back.',melee:true,crit:0.05},
  hammer:{name:'Forge Hammer',short:'Hammer',desc:'Slow and HUGE. Hold attack to charge. It stuns, breaks shields and cracks walls.',melee:true,crit:0.03},
  bow:{name:'Ash Bow',short:'Bow',desc:'Hold attack to pull back, let go to shoot. A full pull shoots right through foes.',melee:false,crit:0.08},
  boomerang:{name:'Wing-rang',short:'Boomerang',desc:'Throw it and it comes back. It stuns whatever it hits.',melee:false,crit:0}
};
const WS={paused:false,pop:null,get:null,pulse:0,area:undefined,side:1,flyT:0,backT:0,whirT:0};
const BOW_FULL=0.6;
function ownedWeapons(){ return WEAPON_IDS.filter(id=>id==='sword'||!!(G&&G.weapons&&G.weapons[id])); }
function curWeapon(){ if(!G) return 'sword'; const w=G.weapon; return w&&WEAPONS[w]&&(w==='sword'||(G.weapons&&G.weapons[w]))?w:'sword'; }
function equipWeapon(id,quiet){
  if(!G||!WEAPONS[id]||(id!=='sword'&&!(G.weapons&&G.weapons[id]))) return false;
  const p=player, was=curWeapon();
  G.weapon=id;
  if(p){ p.bow=null; if(p.ham){ p.ham=null; p.swingT=0; } p.comboTimer=0; if(id!==was) p.wEquipT=0.35; }
  if(!quiet&&id!==was){ WS.pop={id,t:0}; WS.pulse=1; wsnd('equip'); SFX.play('ui'); }
  return true;
}
function cycleWeapon(d){
  if(!G||(G.mode==='story'&&!G.flags.forge)) return;
  const own=ownedWeapons(); if(own.length<2) return;
  const i=own.indexOf(curWeapon()); equipWeapon(own[(i+(d||1)+own.length)%own.length]);
}
function switchTip(){
  const n=ownedWeapons().length;
  if(usingTouch) return 'Tap the WEAPON button, or the weapon icons at the top, to switch.';
  if(padActive()) return 'Press R1 (RB on Xbox, R on Switch) to switch weapons.';
  return `Press X to switch weapons, or the number keys 1 to ${Math.max(2,n)}.`;
}
function giveWeapon(id,quiet){
  if(!G||!WEAPONS[id]) return;
  G.weapons=G.weapons||{sword:true};
  const had=!!G.weapons[id]; G.weapons[id]=true;
  if(quiet) return;
  equipWeapon(id,true); WS.pulse=1;
  if(!had) later(0.05,()=>weaponMoment(id,0));
  try{ saveGame(); }catch(e){}
}
// the "you got a new weapon" moment waits politely for any banner that is already up (quest complete, chest, and so on)
function weaponMoment(id,n){
  const b=G.banner;
  if(n<14&&b&&!b.wpn&&b.dur-b.t>0.5){ later(0.35,()=>weaponMoment(id,n+1)); return; }
  const D=WEAPONS[id];
  setBanner('New weapon: '+D.name,D.desc+' '+switchTip(),4.2); G.banner.wpn=true;
  jingle('item','chest'); WS.get={id,t:0}; WS.pulse=1; shake(3);
  const p=player; emit(p.x,p.y-20,34,{col:'255,220,140',ang:-Math.PI/2,spread:1.6,smin:40,smax:190,lmin:.5,lmax:1.1,zmin:1.5,zmax:3,rise:30});
}

// ---------- little sounds of our own (bow twang, arrow thunk, boomerang whirr), played through the same audio context as SFX
const wsnd=(()=>{
  let ac0=null, out=null; const last={};
  function bus(){ const ac=SFX.ac; if(!ac) return null; if(ac!==ac0){ ac0=ac; out=ac.createGain(); out.gain.value=0.45; out.connect(ac.destination); } return ac; }
  function tone(ac,type,f0,f1,dur,vol,delay){ const t=ac.currentTime+(delay||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.01,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.03); }
  function noise(ac,dur,vol,ft,f0,f1,q,delay){ const nb=SFX.noise; if(!nb) return; const t=ac.currentTime+(delay||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=nb; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.03); }
  return (name,v)=>{
    if(SFX.muted) return; const now=performance.now(); if(last[name]&&now-last[name]<45) return; last[name]=now; v=v==null?1:v;
    try{ const ac=bus(); if(!ac) return;
      switch(name){
        case 'twang': tone(ac,'triangle',360,150,0.16,0.08*v); tone(ac,'sine',720,320,0.09,0.04*v); noise(ac,0.07,0.07*v,'highpass',3200,1600,0.7); break;
        case 'draw': noise(ac,0.45,0.035*v,'bandpass',380,900,5); tone(ac,'sawtooth',85,125,0.4,0.012*v); break;
        case 'thunk': tone(ac,'square',170,60,0.07,0.06*v); noise(ac,0.05,0.09*v,'lowpass',1300,300); break;
        case 'whirr': noise(ac,0.13,0.05*v,'bandpass',800,1500,7); break;
        case 'whoosh': noise(ac,0.2,0.1*v,'bandpass',500,2400,1.4); break;
        case 'ping': tone(ac,'sine',1320,1320,0.25,0.05*v); tone(ac,'sine',1980,1980,0.18,0.03*v,0.04); break;
        case 'equip': tone(ac,'triangle',660,660,0.06,0.05*v); tone(ac,'triangle',990,990,0.09,0.05*v,0.06); noise(ac,0.08,0.05*v,'highpass',4200,2600,0.7); break;
        case 'lift': noise(ac,0.3,0.07*v,'lowpass',520,200,0.8); tone(ac,'sine',110,170,0.3,0.05*v); break;
        case 'catch': tone(ac,'triangle',520,700,0.07,0.05*v); noise(ac,0.05,0.05*v,'bandpass',1800,1200,2); break;
        case 'clink': tone(ac,'square',1200,900,0.05,0.04*v); tone(ac,'triangle',1800,1500,0.08,0.04*v); break;
      }
    }catch(e){}
  };
})();

// ---------- helpers
const wReachK=()=>((player&&player.stats.range)||60)/60;
function wPower(){ const s=player.stats; return s.slash*s.dmgMul*(s.wpnMul||1); }
function wCritRoll(id,bonus){ return Math.random()<((WEAPONS[id]?WEAPONS[id].crit:0)+(bonus||0)+(player.stats.critCh||0)); }
// hit one foe (c is the hit circle from hitCircles) for k times the weapon's power
function wStrike(e,c,k,id,o){
  o=o||{}; const crit=wCritRoll(id,o.critB);
  const amt=wPower()*k*rand(0.9,1.1)*(crit?1.75:1)*(o.extra||1);
  return damageEnemy(e,amt,{src:o.src||'slash',mult:c.m,crit:crit||c.m>1,kb:o.kb||0,ka:o.ka!=null?o.ka:angTo(player.x,player.y,e.x,e.y),fx:o.fx,fy:o.fy});
}
const wFoeOk=e=>!(e.dead||e.invuln||e.spawnIn>0||e.passive);
function segD(px,py,ax,ay,bx,by){ const dx=bx-ax, dy=by-ay, l2=dx*dx+dy*dy||1, t=clamp(((px-ax)*dx+(py-ay)*dy)/l2,0,1); return Math.hypot(px-(ax+dx*t),py-(ay+dy*t)); }
// solid things for arrows and the boomerang (low fences, hedges and rocks are flown over)
function wColAt(x,y,r){ let hit=false; forCols(x,y,r,c=>{ if(hit||!colActive(c)||c.noProj||c.low) return; if(c.t==='c'){ if(dist2(x,y,c.x,c.y)<(c.r+r)**2) hit=true; } else if(x>c.x0-r&&x<c.x1+r&&y>c.y0-r&&y<c.y1+r) hit=true; }); return hit; }
function wWall(x,y){
  if(AREA) return areaBlocked(x,y)||wColAt(x,y,2);
  if(x<20||y<20||x>WORLD.w-20||y>WORLD.h-20) return true;
  return wColAt(x,y,2);
}
function inBreath(x,y,r){ const p=player; if(!p.breathing) return false; const f=p.facing; return inArcC(p.x+Math.cos(f)*16,p.y+Math.sin(f)*16,f,175,0.45,{x,y,r:r||4}); }
// pots, barrels and cave crystals: returns true when something solid was hit
function wPoke(x,y,dir){
  if(G.mode!=='story') return false;
  let hit=false;
  for(const o of activeBreakables()) if(!o.broken&&dist2(o.x,o.y,x,y)<18*18){ hit=true; break; }
  if(!hit&&AREA&&AREA.rooms) for(const o of AREA.objs) if(o.k==='crystal'&&o.cd<=0&&dist2(o.x,o.y,x,y)<26*26){ hit=true; break; }
  if(hit) swingBreakables(x,y,dir,6,Math.PI);
  return hit;
}
// fire arrows: braziers, fireplaces, cave torches, cracked walls (a little heat each), and dungeon objects
function wIgnite(x,y,r,heat){
  areaObjHit(x,y,r,'fire');
  if(G.mode!=='story'||!AREA) return;
  const hit=(ox,oy,orr)=>dist2(x,y,ox,oy)<((orr||16)+r)**2;
  if(AREA.rooms) caveBreath(hit,heat||0.05);
  for(const o of AREA.objs){
    if((o.k==='fireplace'||o.k==='brazier')&&!o.lit&&hit(o.x,o.y,16)){
      o.lit=true; SFX.play('pickup'); emit(o.x,o.y,14,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:20,smax:80,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:5});
      if(o.k==='brazier'&&!o.room&&!AREA.rooms){ const br=AREA.objs.filter(q=>q.k==='brazier'); if(br.every(q=>q.lit)){ G.found[AREA.def.id+'_solved']=true; for(const c of AREA.objs) if(c.k==='cchest') c.sealed=false; setBanner('The seal breaks','The treasure chest is open.',2.2); SFX.play('shrine'); } else setBanner(`${br.filter(q=>q.lit).length} of ${br.length} braziers lit`,'',1.2); }
      else if(o.k==='brazier'&&o.room){ const br=AREA.objs.filter(q=>q.k==='brazier'&&q.room===o.room); if(!br.every(q=>q.lit)) setBanner(`${br.filter(q=>q.lit).length} of ${br.length} braziers lit`,o.timed?'Quick, before they burn out!':'',1.2); }
    }
  }
}
function wAimAssist(aim){
  const p=player; let best=null,bs=1e9;
  for(const e of G.enemies){
    if(!wFoeOk(e)||e.alpha<0.3) continue;
    const d=dist(p.x,p.y,e.x,e.y); if(d>620) continue;
    const da=Math.abs(angDiff(aim,angTo(p.x,p.y,e.x,e.y))); if(da>0.32) continue;
    const s=d*(1+da*3); if(s<bs){ bs=s; best=e; }
  }
  return best?angTo(p.x,p.y,best.x,best.y):aim;
}
function wReach(w){ const K=wReachK(), st=player.stats; return w==='daggers'?48*K:w==='spear'?100*K:w==='hammer'?76*K:(st.range||60); }
function nextCombo(w){ const p=player, n=w==='daggers'?4:3; return p.comboTimer>0&&p.comboW===w?(p.combo+1)%n:0; }
function wClearFlight(){
  if(!G.wproj) return;
  for(const a of G.wproj) if(a.k==='rang') for(const k of a.carry){ k.x=player.x; k.y=player.y; k.rang=null; }
  G.wproj.length=0; G.wstuck.length=0; G.wfx.length=0;
}

// ---------- the update (called from updatePlayer in place of the old sword lines)
function updateWeapon(dt,inp){
  const p=player;
  if(!G.wproj){ G.wproj=[]; G.wstuck=[]; G.wfx=[]; }
  if(G.mode==='normal'&&!G.wpnAll){ G.wpnAll=true; G.weapons=G.weapons||{}; for(const id of WEAPON_IDS) G.weapons[id]=true; }
  if(WS.area!==AREA){ WS.area=AREA; wClearFlight(); }
  if(WS.paused){ WS.paused=false; p.bow=null; if(p.ham) p.ham.held=false; }
  const armed=!(G.mode==='story'&&!G.flags.forge);
  if(armed){
    if(inp.wNext) cycleWeapon(1); else if(inp.wPrev) cycleWeapon(-1);
    else if(inp.wSel!=null&&inp.wSel>=0){ const own=ownedWeapons(); if(own[inp.wSel]) equipWeapon(own[inp.wSel]); }
  }
  if(WS.pop){ WS.pop.t+=dt; if(WS.pop.t>1.3) WS.pop=null; }
  if(WS.get){ WS.get.t+=dt; if(WS.get.t>2.3) WS.get=null; }
  if(WS.pulse>0) WS.pulse=Math.max(0,WS.pulse-dt*3);
  if(WS.flyT>0) WS.flyT-=dt; if(WS.backT>0) WS.backT-=dt;
  if(p.wEquipT>0) p.wEquipT-=dt; if(p.throwT>0) p.throwT-=dt; if(p.bowSnap>0) p.bowSnap-=dt;
  const w=curWeapon(), atk=!!inp.attack, free=p.atkCd<=0&&p.dashT<=0&&p.drinkT<=0;
  if(atk&&!armed){ if(!(G.noSwordT>0)){ G.noSwordT=2.5; ftext(p.x,p.y-28,'Mom has your sword at the forge','#ffd9a0',13); } }
  else if(armed){
    if(w==='bow') updateBow(dt,atk);
    else if(w==='boomerang'){ if(atk&&free) throwRang(); }
    else if(p.flying){ if(p.ham){ p.ham=null; p.swingT=0; } if(atk&&!(WS.flyT>0)){ WS.flyT=3; ftext(p.x,p.y-30,'Land to swing! (The bow and boomerang work up here.)','#cfe6ff',12); } }
    else if(airborne()&&hasSkill('slam')){ /* attack in the air is Meteor Slam (abilities build) */ }
    else if(w==='hammer') hammerInput(atk,free);
    else if(atk&&free){
      const n=nextCombo(w), fin=n===(w==='daggers'?3:2), cost=w==='daggers'?(fin?6:3):w==='spear'?(fin?13:8):(fin?14:9);
      if(useStamina(cost)) startSwing(); else p.atkCd=0.2;
    }
  }
  if(p.swingT>0){ p.swingT-=dt; swingHits(); }
  updateHammer(dt);
  updateWProj(dt);
}

// ---------- melee: daggers and spear (the sword lives in startSwing/swingHits in a6_player.js)
function startWeaponSwing(w){
  const p=player, st=p.stats, n=nextCombo(w), dir=p.facing;
  p.combo=n; p.comboW=w; p.swingW=w; p.swingDir=dir; p.swingHit=new Set(); p.swingHitstop=false; p.swingObj=false;
  if(w==='daggers'){
    const fin=n===3, spin=fin&&hasSkill('spin')>0;
    p.swingFin=fin; p.swingSpin=spin; p.swingSide=n%2===0?1:-1;
    p.swingDur=spin?0.26:fin?0.16:0.09; p.atkCd=(spin?0.42:fin?0.3:0.13)/st.atkSpeed; p.comboTimer=p.atkCd+0.32;
    const lunge=spin?60:fin?420:70; p.kvx+=Math.cos(dir)*lunge; p.kvy+=Math.sin(dir)*lunge;
    if(fin&&!spin){ p.ghosts.push({x:p.x,y:p.y,f:dir,a:0.55}); wsnd('whoosh',0.7); }
    SFX.play(fin?'slash3':'slash',fin?0.8:0.5);
  }else if(w==='spear'){
    const fin=n===2, spin=fin&&hasSkill('spin')>0;
    p.swingFin=fin; p.swingSpin=spin; p.swingSide=1;
    p.swingDur=spin?0.32:fin?0.24:0.17; p.atkCd=(spin?0.56:fin?0.55:0.36)/st.atkSpeed; p.comboTimer=p.atkCd+0.42;
    const lunge=spin?50:fin?330:60; p.kvx+=Math.cos(dir)*lunge; p.kvy+=Math.sin(dir)*lunge;
    SFX.play(fin?'slash3':'slash',0.75); wsnd('whoosh',fin?0.9:0.5);
  }
  p.swingT=p.swingDur;
}
function spearExt(pr){ return pr<0.35?1-Math.pow(1-pr/0.35,3):pr<0.68?1:Math.max(0,1-(pr-0.68)/0.32); }
function weaponSwingHits(){
  const p=player, w=p.swingW, K=wReachK(), dir=p.swingDir, pr=1-p.swingT/p.swingDur;
  let any=false;
  if(w==='daggers'){
    const fin=p.swingFin, spin=p.swingSpin, R=44*K*(spin?1.45:fin?1.3:1), half=spin?Math.PI:fin?0.5:0.85;
    for(const e of G.enemies){
      if(!wFoeOk(e)||p.swingHit.has(e.id)) continue;
      let best=null; for(const c of hitCircles(e)) if(inArcC(p.x,p.y,dir,R,half,c)&&(!best||c.m>best.m)) best=c;
      if(!best) continue;
      p.swingHit.add(e.id); any=true;
      const back=e.type!=='vorlaxis'&&Math.abs(angDiff(e.face,angTo(e.x,e.y,p.x,p.y)))>1.95;
      wStrike(e,best,spin?0.9:fin?1.1:0.6,'daggers',{extra:back?1.5:1,critB:back?0.1:0,kb:fin?260:80,ka:dir});
      const a=angTo(best.x,best.y,p.x,p.y);
      emit(best.x+Math.cos(a)*best.r,best.y+Math.sin(a)*best.r,back?9:5,{col:back?'210,160,255':'255,240,225',smin:110,smax:300,lmin:.08,lmax:.18,zmin:1,zmax:2.2,drag:6});
      if(back&&!e.dead&&!(WS.backT>0)){ WS.backT=1.6; ftext(e.x,e.y-e.r-20,'Sneak attack!','#d8b4ff',11); }
    }
    if(!p.swingObj){ p.swingObj=true; areaObjHit(p.x+Math.cos(dir)*R*0.7,p.y+Math.sin(dir)*R*0.7,R*0.5,'daggers'); if(G.mode==='story') swingBreakables(p.x,p.y,dir,R,half); }
    if(any&&!p.swingHitstop){ p.swingHitstop=true; hitstop=Math.max(hitstop,fin?0.045:0.016); shake(fin?3:1); SFX.play('hit',0.6); }
  }else if(w==='spear'){
    const fin=p.swingFin, spin=p.swingSpin;
    if(spin){
      const R=92*K;
      for(const e of G.enemies){
        if(!wFoeOk(e)||p.swingHit.has(e.id)) continue;
        let best=null; for(const c of hitCircles(e)) if(dist(p.x,p.y,c.x,c.y)-c.r<R&&(!best||c.m>best.m)) best=c;
        if(!best) continue; p.swingHit.add(e.id); any=true;
        wStrike(e,best,1.3,'spear',{kb:380,ka:angTo(p.x,p.y,e.x,e.y)});
      }
      for(const q of G.projectiles) if(q.owner==='enemy'&&!q.dead&&dist(p.x,p.y,q.x,q.y)<R+10) reflectProj(q);
      if(!p.swingObj){ p.swingObj=true; areaObjHit(p.x,p.y,R,'spear'); if(G.mode==='story') swingBreakables(p.x,p.y,dir,R,Math.PI); }
    }else{
      const len=100*K*(fin?1.2:1), ext=spearExt(pr), tip=34+(len-34)*ext;
      const ax=p.x+Math.cos(dir)*8, ay=p.y+Math.sin(dir)*8, bx=p.x+Math.cos(dir)*tip, by=p.y+Math.sin(dir)*tip;
      if(pr<0.75){
        for(const e of G.enemies){
          if(!wFoeOk(e)||p.swingHit.has(e.id)) continue;
          let best=null; for(const c of hitCircles(e)) if(segD(c.x,c.y,ax,ay,bx,by)<c.r+8&&(!best||c.m>best.m)) best=c;
          if(!best) continue; p.swingHit.add(e.id); any=true;
          wStrike(e,best,fin?1.6:0.9,'spear',{kb:fin?560:320,ka:dir});
          emit(best.x-Math.cos(dir)*best.r,best.y-Math.sin(dir)*best.r,fin?12:6,{col:'255,235,200',ang:dir+Math.PI,spread:0.8,smin:100,smax:320,lmin:.1,lmax:.22,zmin:1.2,zmax:2.4,drag:6});
        }
        for(const q of G.projectiles) if(q.owner==='enemy'&&!q.dead&&segD(q.x,q.y,ax,ay,bx,by)<q.r+12) reflectProj(q);
      }
      if(!p.swingObj&&ext>=0.99){ p.swingObj=true; areaObjHit(bx,by,12,'spear'); if(G.mode==='story') swingBreakables(p.x,p.y,dir,tip,0.2); }
    }
    if(any&&!p.swingHitstop){ p.swingHitstop=true; hitstop=Math.max(hitstop,fin?0.07:0.035); shake(fin?5:2); SFX.play('hit'); }
  }
}

// ---------- the forge hammer: wind up, hold to charge, smash
function hammerInput(atk,free){
  const p=player;
  if(p.ham){ p.ham.held=atk; return; }
  if(atk&&free){
    if(useStamina(14)){ p.ham={ph:'wind',t:0,ch:0,held:true,full:false}; p.swingW='hammer'; p.swingT=0.05; p.swingDur=1; p.swingHit=new Set(); wsnd('lift'); }
    else p.atkCd=0.2;
  }
}
function updateHammer(dt){
  const p=player, h=p.ham; if(!h) return;
  if(p.dashT>0||p.drinkT>0||curWeapon()!=='hammer'||p.flying){ p.ham=null; p.swingT=0; return; }
  h.t+=dt; p.swingT=Math.max(p.swingT,0.05); p.swingW='hammer';
  if(h.ph==='wind'||h.ph==='hold') p.facing=turnTo(p.facing,p.aim!=null?p.aim:p.facing,(h.ph==='wind'?8:4)*dt);
  const wind=0.34/p.stats.atkSpeed;
  if(h.ph==='wind'){ if(h.t>=wind){ h.ph=h.held?'hold':'fall'; h.t=0; } }
  else if(h.ph==='hold'){
    h.ch=Math.min(1,h.ch+dt/0.9);
    const f=p.facing, hx=p.x-Math.cos(f)*27-Math.sin(f)*9, hy=p.y-Math.sin(f)*27+Math.cos(f)*9;
    if(Math.random()<dt*(10+30*h.ch)) emit(hx+rand(-6,6),hy+rand(-6,6),1,{col:'255,180,80',ang:-Math.PI/2,spread:1.2,smin:20,smax:70,lmin:.2,lmax:.45,zmin:1,zmax:2.2,rise:20});
    if(h.ch>=1&&!h.full){ h.full=true; wsnd('ping'); emit(hx,hy,12,{col:'255,210,120',smin:60,smax:160,lmin:.2,lmax:.4,zmin:1.2,zmax:2.5}); }
    if(!h.held||h.t>1.7){ h.ph='fall'; h.t=0; }
  }
  else if(h.ph==='fall'){ if(h.t>=0.09){ hammerImpact(h); h.ph='rest'; h.t=0; } }
  else if(h.ph==='rest'){ if(h.t>=0.26){ p.ham=null; p.swingT=0; p.atkCd=0.12/p.stats.atkSpeed; } }
}
function hammerImpact(h){
  const p=player, K=wReachK(), ch=h.ch, dir=p.facing;
  const ix=p.x+Math.cos(dir)*34*K, iy=p.y+Math.sin(dir)*34*K, R=(70+45*ch)*K;
  let any=false, guard=false;
  for(const e of G.enemies){
    if(!wFoeOk(e)) continue;
    let best=null, bd=1e9; for(const c of hitCircles(e)){ const d=dist(ix,iy,c.x,c.y)-c.r; if(d<bd){ bd=d; best=c; } }
    if(!best) continue;
    const direct=bd<24*K, wave=bd<R&&!e.flying;
    if(!direct&&!wave) continue;
    any=true; if(e.shield&&e.blocking) guard=true;
    e.blocking=false;   // nothing blocks the hammer
    wStrike(e,best,direct?2.4+1.8*ch:1.1+0.8*ch,'hammer',{src:'hammer',kb:(direct?320:230)+180*ch,ka:angTo(ix,iy,e.x,e.y)});
    if(!e.dead) stunEnemy(e,(direct?0.7:0.5)+1.1*ch);
  }
  if(guard) ftext(ix,iy-34,'GUARD BREAK!','#ffd27a',14);
  G.wfx.push({k:'ring',x:ix,y:iy,t:0,dur:0.5,r:R,ch});
  emit(ix,iy,22+16*ch,{col:'150,130,110',glow:false,smin:60,smax:240+120*ch,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:5,drag:3});
  emit(ix,iy,10+8*ch,{col:'255,200,120',smin:80,smax:300,lmin:.15,lmax:.35,zmin:1.2,zmax:2.4,drag:4});
  shake(7+7*ch); hitstop=Math.max(hitstop,0.05+0.04*ch); SFX.play('boom',0.55+0.45*ch); if(any) SFX.play('hit');
  if(!AREA) scorch(ix,iy,R*0.32);
  // the world: cracked cave walls (the roar's code), crystals and pots, dungeon objects, enemy bolts
  if(AREA&&AREA.rooms) caveRoar(ix,iy,R);
  if(G.mode==='story') swingBreakables(ix,iy,dir,R*0.7,Math.PI);
  areaObjHit(ix,iy,R,'hammer');
  for(const q of G.projectiles) if(q.owner==='enemy'&&!q.dead&&dist(ix,iy,q.x,q.y)<R+10) reflectProj(q);
}

// ---------- the bow: hold to draw, release to shoot
function updateBow(dt,atk){
  const p=player, b=p.bow, st=p.stats;
  if(b){
    if(p.dashT>0||p.drinkT>0){ p.bow=null; return; }
    b.k=Math.min(1,b.k+dt*st.atkSpeed/BOW_FULL);
    if(b.k>=1&&!b.full){ b.full=true; wsnd('ping',0.7); }
    p.slowT=Math.max(p.slowT||0,0.05);
    if(p.aim!=null) p.facing=turnTo(p.facing,p.aim,14*dt);
    if(!atk) fireArrow(b.k);
    return;
  }
  if(atk&&p.atkCd<=0&&p.dashT<=0&&p.drinkT<=0){ p.bow={k:0,full:false}; wsnd('draw'); }
}
function fireArrow(k){
  const p=player, st=p.stats; p.bow=null;
  if(!useStamina(4)){ p.atkCd=0.25; return; }
  const full=k>=1, spd=lerp(560,980,k), a=p.facing, sx=p.x+Math.cos(a)*18, sy=p.y+Math.sin(a)*18, range=620;
  G.wproj.push({k:'arrow',x:sx,y:sy,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,a,life:range/spd,dmg:0.35+1.85*Math.pow(k,1.3),full,pierce:full,hit:new Set(),fire:hasSkill('firearrow')>0,objCd:0,n:0,t:0});
  p.atkCd=0.2/st.atkSpeed; p.bowSnap=0.14;
  wsnd('twang',full?1:0.7); if(full) SFX.play('slash',0.5);
}
function lightArrow(a){
  a.fire=true; emit(a.x,a.y,10,{kind:'fire',smin:40,smax:140,lmin:.2,lmax:.4,zmin:2,zmax:4,grow:4,drag:3});
  if(G.flags&&!G.flags.wpn_fireArrow){ G.flags.wpn_fireArrow=true; setBanner('Fire arrow!','Your arrow flew through your own fire breath, and now it burns!',2.8); jingle('secret','shrine'); }
}
function arrowHitFoe(a,e,c){
  const st=player.stats;
  wStrike(e,c,a.dmg,'bow',{src:'arrow',critB:a.full?0.1:0,kb:a.full?220:120,ka:a.a,fx:a.x-a.vx*0.05,fy:a.y-a.vy*0.05});
  if(a.fire&&!e.dead&&!e.lastBlocked){ e.burnT=Math.max(e.burnT,2.6); e.burnDps=Math.max(e.burnDps,5.5*st.fire*st.dmgMul); }
  emit(a.x,a.y,a.fire?8:5,a.fire?{kind:'fire',smin:40,smax:140,lmin:.2,lmax:.4,zmin:2,zmax:4,grow:4,drag:3}:{col:'255,240,220',smin:60,smax:200,lmin:.1,lmax:.22,zmin:1,zmax:2.2,drag:6});
}
function stickArrow(a){
  a.dead=true; G.wstuck.push({x:a.x-Math.cos(a.a)*3,y:a.y-Math.sin(a.a)*3,a:a.a,t:0,life:1.4,fire:a.fire});
  wsnd('thunk'); emit(a.x,a.y,4,{col:'170,150,120',glow:false,smin:20,smax:80,lmin:.2,lmax:.4,zmin:1.5,zmax:3});
  if(a.fire) wIgnite(a.x,a.y,12,0.45);
  if(G.wstuck.length>24) G.wstuck.shift();
}
function stepArrow(a,dt){
  a.life-=dt; a.t+=dt; if(a.objCd>0) a.objCd-=dt;
  if(a.life<=0){ a.dead=true; G.wstuck.push({x:a.x,y:a.y,a:a.a,t:0,life:0.7,ground:true,fire:a.fire}); return; }
  const sp=Math.hypot(a.vx,a.vy), n=Math.max(1,Math.ceil(sp*dt/10)), sx=a.vx*dt/n, sy=a.vy*dt/n;
  for(let i=0;i<n&&!a.dead;i++){
    a.x+=sx; a.y+=sy; a.n++;
    if(!a.fire&&inBreath(a.x,a.y)) lightArrow(a);
    if(a.objCd<=0){
      let r=areaObjHit(a.x,a.y,5,'arrow');
      if(a.fire&&a.n%3===0) wIgnite(a.x,a.y,8,0.03);
      if(a.n%2===0&&wPoke(a.x,a.y,a.a)) r=true;
      if(r){ if(!a.pierce){ stickArrow(a); return; } a.objCd=0.25; }
    }
    if(wWall(a.x,a.y)){ a.x-=sx*0.5; a.y-=sy*0.5; stickArrow(a); return; }
    for(const e of G.enemies){
      if(!wFoeOk(e)||a.hit.has(e.id)) continue;
      let hc=null; for(const c of hitCircles(e)) if(dist2(a.x,a.y,c.x,c.y)<(c.r+3)**2){ hc=c; break; }
      if(!hc) continue;
      a.hit.add(e.id); arrowHitFoe(a,e,hc);
      if(!a.pierce){ a.dead=true; SFX.play('hit',0.6); return; }
    }
  }
  if(a.fire&&Math.random()<0.6) emit(a.x,a.y,1,{kind:'fire',smin:5,smax:30,lmin:.15,lmax:.3,zmin:1.5,zmax:3,grow:-3,drag:2});
}

// ---------- the boomerang: out on a curve, back to Ash, one at a time
function throwRang(){
  const p=player; if(G.wproj.some(q=>q.k==='rang')) return;
  if(!useStamina(6)){ p.atkCd=0.2; return; }
  const a=p.facing, lt=hasSkill('longthrow')>0; WS.side=-WS.side;
  G.wproj.push({k:'rang',x:p.x+Math.cos(a)*14,y:p.y+Math.sin(a)*14,a0:a,h:a,side:WS.side,ph:'out',d:0,max:300*(lt?1.5:1),sp:640,t:0,spin:0,hit:new Set(),carry:[],lt,fire:false,objCd:0,trail:[]});
  p.atkCd=0.22; p.throwT=0.14; wsnd('whoosh');
}
function rangBack(r){ if(r.ph==='back') return; r.ph='back'; r.hit.clear(); r.sp=Math.max(r.sp,360); }
function catchRang(r){
  const p=player; r.dead=true;
  for(const k of r.carry){ k.x=p.x; k.y=p.y; k.vx=k.vy=0; k.rang=null; }
  wsnd('catch'); p.atkCd=Math.min(p.atkCd,0.08); p.throwT=0.1;
}
function stepRang(r,dt){
  const p=player; r.t+=dt; r.spin+=dt*24; if(r.objCd>0) r.objCd-=dt;
  WS.whirT-=dt; if(WS.whirT<=0){ WS.whirT=0.16; wsnd('whirr',0.8); }
  if(r.ph==='out'){ const k=clamp(r.d/r.max,0,1); r.h=r.a0+r.side*1.0*k*k*k; r.sp=lerp(660,380,k); }
  else{ r.h=turnTo(r.h,angTo(r.x,r.y,p.x,p.y),10*dt); r.sp=Math.min(780,r.sp+900*dt); if(dist(r.x,r.y,p.x,p.y)<p.r+14||r.t>6){ catchRang(r); return; } }
  r.trail.push(r.x,r.y); if(r.trail.length>8) r.trail.splice(0,2);
  const step=r.sp*dt, n=Math.max(1,Math.ceil(step/10)), sx=Math.cos(r.h)*step/n, sy=Math.sin(r.h)*step/n;
  for(let i=0;i<n;i++){
    r.x+=sx; r.y+=sy; r.d+=step/n;
    if(r.ph==='out'){
      if(r.d>=r.max) rangBack(r);
      else if(wWall(r.x,r.y)){ r.x-=sx; r.y-=sy; rangBack(r); wsnd('clink'); emit(r.x,r.y,6,{col:'255,230,180',smin:60,smax:160,lmin:.1,lmax:.25,zmin:1,zmax:2,drag:5}); }
    }
    if(!r.fire&&inBreath(r.x,r.y,8)){ r.fire=true; emit(r.x,r.y,10,{kind:'fire',smin:40,smax:140,lmin:.2,lmax:.4,zmin:2,zmax:4,grow:4,drag:3}); }
    for(const e of G.enemies){
      if(!wFoeOk(e)||r.hit.has(e.id)) continue;
      let hc=null; for(const c of hitCircles(e)) if(dist2(r.x,r.y,c.x,c.y)<(c.r+10)**2){ hc=c; break; }
      if(!hc) continue;
      r.hit.add(e.id);
      wStrike(e,hc,0.5,'boomerang',{src:'boomerang',kb:90,ka:r.h,fx:r.x-sx,fy:r.y-sy});
      if(!e.dead&&!e.lastBlocked){ stunEnemy(e,1.0); if(r.fire){ e.burnT=Math.max(e.burnT,2); e.burnDps=Math.max(e.burnDps,4*p.stats.fire*p.stats.dmgMul); } }
      SFX.play('hit',0.5); emit(r.x,r.y,6,{col:'255,225,160',smin:60,smax:180,lmin:.1,lmax:.25,zmin:1,zmax:2.2,drag:5});
    }
    for(const q of G.projectiles) if(q.owner==='enemy'&&!q.dead&&dist2(q.x,q.y,r.x,r.y)<(q.r+10)**2){ q.dead=true; smallBoom(q.x,q.y); }
    if(r.lt) for(const k of G.pickups) if(!k.rang&&k.life>0&&dist2(k.x,k.y,r.x,r.y)<30*30){ k.rang=r; r.carry.push(k); }
    if(r.objCd<=0){
      let hitObj=areaObjHit(r.x,r.y,10,'boomerang');
      if(r.fire&&i%3===0) wIgnite(r.x,r.y,10,0.03);
      if(wPoke(r.x,r.y,r.h)) hitObj=true;
      if(hitObj){ r.objCd=0.4; rangBack(r); }
    }
  }
  for(const k of r.carry){ k.x=r.x; k.y=r.y; k.vx=k.vy=0; k.life=Math.max(k.life,1.5); }
  if(r.fire&&Math.random()<0.7) emit(r.x,r.y,1,{kind:'fire',smin:5,smax:30,lmin:.15,lmax:.3,zmin:1.5,zmax:3,grow:-3,drag:2});
}
function updateWProj(dt){
  for(const a of G.wproj){ if(a.dead) continue; if(a.k==='arrow') stepArrow(a,dt); else if(a.k==='rang') stepRang(a,dt); }
  if(G.wproj.some(a=>a.dead)) G.wproj=G.wproj.filter(a=>!a.dead);
  for(const s of G.wstuck) s.t+=dt; if(G.wstuck.length&&G.wstuck[0].t>G.wstuck[0].life) G.wstuck=G.wstuck.filter(s=>s.t<s.life);
  for(const f of G.wfx) f.t+=dt; if(G.wfx.length) G.wfx=G.wfx.filter(f=>f.t<f.dur);
}

// auto-attack (touch): swing when a foe is within the current weapon's reach; the bow draws fully then lets go
function autoSwing(){
  if(scene!=='play'||!player||!autoAttackOn()||(G.mode==='story'&&!G.flags.forge)) return false;
  const p=player, w=curWeapon();
  if(w==='bow'||w==='boomerang'){
    if(w==='boomerang'&&G.wproj&&G.wproj.some(q=>q.k==='rang')) return false;
    const t=nearestEnemy(p.x,p.y,350); if(!t||!(t.aggro||t.boss)) return false;
    if(w==='bow') return !(p.bow&&p.bow.k>=1);
    return true;
  }
  if(p.flying||(w==='hammer'&&p.ham)) return false;
  const reach=wReach(w)+22;
  for(const e of G.enemies){ if(e.dead||e.alpha<0.4) continue; const d=dist(p.x,p.y,e.x,e.y)-e.r; if(d<reach&&(e.aggro||e.boss||d<reach*0.7)) return true; }
  return false;
}

// ---------- the hammer offer at the forge (called from Maren's talk in a9d_quests.js)
function hammerPitchDue(){ return !!(G&&G.mode==='story'&&reached('wren')&&!(G.weapons&&G.weapons.hammer)&&!G.flags.wpn_hamPitch); }
function forgeHammerTalk(){
  if(G.mode!=='story'||!reached('wren')||(G.weapons&&G.weapons.hammer)) return false;
  const iron=G.iron>0, coins=(G.coins||0)>=150, first=!G.flags.wpn_hamPitch;
  if(!first&&!iron&&!coins) return false;
  G.flags.wpn_hamPitch=true;
  let made=false, no=false;
  const make=how=>()=>{ if(how==='iron') G.iron--; else G.coins-=150; made=true; SFX.play('chest'); };
  const opts=[];
  if(iron) opts.push({t:'Use one star-iron',tone:'brave',fn:make('iron'),then:STORY.maren.hammerMade});
  if(coins) opts.push({t:'Pay 150 coins',fn:make('coins'),then:STORY.maren.hammerMade});
  opts.push({t:iron||coins?'Maybe later':'I’ll be back',fn:()=>{ no=true; },then:[['maren',iron||coins?`Suit yourself. The offer stands. So does the hammer rack.`:`Bring me one star-iron, or 150 coins for the good iron, and it's yours.`]]});
  const L=STORY.maren.hammerOffer, lines=(first?L.slice(0,-1):[]).concat([ch('maren',first?L[L.length-1][1]:`Still want that hammer? One star-iron, or 150 coins.`,opts)]);
  runDialogue(lines,()=>{ scene='play';
    if(made){ giveWeapon('hammer'); return; }
    if(no&&G.iron>0) runDialogue(STORY.maren.reforge,()=>{ scene='play'; reforgeIron(); saveGame(); });
    else saveGame();
  });
  return true;
}

// ---------- icons (cached per size, so they stay crisp and cheap at 24 to 48 px)
function wSteelG(g,x0,y0,x1,y1,tier,warm){
  const s=g.createLinearGradient(x0,y0,x1,y1);
  if(tier>0){ s.addColorStop(0,'#f2fbff'); s.addColorStop(0.45,tier>=3?'#7ac8ff':tier===2?'#9ccfee':'#b4cfe2'); s.addColorStop(1,tier>=3?'#2a5a9a':'#4a6070'); }
  else{ s.addColorStop(0,warm?'#fff2d8':'#f4f7fa'); s.addColorStop(0.45,warm?'#e8c8a0':'#aeb6c0'); s.addColorStop(1,'#5a626c'); }
  return s;
}
const ICON_INK='#140a05';
function iconPath(g,fill,lw){ g.strokeStyle=ICON_INK; g.lineWidth=lw||2.4; g.stroke(); g.fillStyle=fill; g.fill(); }
function fangPath(g,len){ g.beginPath(); g.moveTo(0,-2.4); g.quadraticCurveTo(len*0.55,-3.6,len,1.4); g.quadraticCurveTo(len*0.5,0.8,0,2.4); g.closePath(); }
function rangPath(g){
  g.beginPath(); g.moveTo(5,0);
  g.quadraticCurveTo(0,-6,-7,-10.5); g.lineTo(-5.4,-7.6); g.lineTo(-7.4,-6.6); g.lineTo(-4.8,-4.4); g.lineTo(-6.2,-3.2); g.quadraticCurveTo(-3,-1.4,-2,0);
  g.quadraticCurveTo(-3,1.4,-6.2,3.2); g.lineTo(-4.8,4.4); g.lineTo(-7.4,6.6); g.lineTo(-5.4,7.6); g.lineTo(-7,10.5); g.quadraticCurveTo(0,6,5,0); g.closePath();
}
function drawRangShape(g,s,fire){
  g.save(); g.scale(s,s); g.lineJoin='round';
  rangPath(g); g.strokeStyle='#2a0e06'; g.lineWidth=2.2; g.stroke();
  const gr=g.createLinearGradient(-7,-10,5,8); gr.addColorStop(0,fire?'#fff4b0':'#ffe2a6'); gr.addColorStop(0.45,fire?'#ff9a3a':'#e8963a'); gr.addColorStop(1,fire?'#c8321a':'#a8401e'); g.fillStyle=gr; g.fill();
  g.strokeStyle='rgba(255,250,235,.7)'; g.lineWidth=0.9; g.beginPath(); g.moveTo(3.6,-0.8); g.quadraticCurveTo(-0.5,-5.4,-6,-9.2); g.moveTo(3.6,0.8); g.quadraticCurveTo(-0.5,5.4,-6,9.2); g.stroke();
  g.fillStyle='#ff5a35'; g.beginPath(); g.arc(1.4,0,1.7,0,TAU); g.fill(); g.fillStyle='rgba(255,230,200,.9)'; g.beginPath(); g.arc(0.9,-0.5,0.6,0,TAU); g.fill();
  g.restore();
}
const WICON={
  sword(g,tier){
    g.rotate(-Math.PI/4);
    g.beginPath(); g.moveTo(-4,-2.6); g.lineTo(10,-2.6); g.lineTo(14.5,0); g.lineTo(10,2.6); g.lineTo(-4,2.6); g.closePath(); iconPath(g,wSteelG(g,0,-2.6,0,2.6,tier));
    g.strokeStyle='rgba(60,66,74,.7)'; g.lineWidth=0.7; g.beginPath(); g.moveTo(-2,0); g.lineTo(11,0); g.stroke();
    g.beginPath(); g.rect(-11.5,-1.9,7,3.8); iconPath(g,'#5a3418',2);
    g.beginPath(); g.rect(-6,-7,3,14); iconPath(g,'#d8a840',2);
    g.beginPath(); g.arc(-12.6,0,2.4,0,TAU); iconPath(g,'#d8a840',2);
  },
  daggers(g,tier){
    for(const s of [-1,1]){
      g.save(); g.rotate(-Math.PI/2+s*0.62); g.translate(-3,0);
      fangPath(g,16); iconPath(g,wSteelG(g,0,-3,0,3,tier));
      g.beginPath(); g.rect(-9,-1.8,8,3.6); iconPath(g,'#7a2418',2);
      g.beginPath(); g.rect(-1.6,-4.2,2.6,8.4); iconPath(g,'#d8a840',1.8);
      g.restore();
    }
  },
  spear(g,tier){
    g.rotate(-Math.PI/4);
    g.beginPath(); g.rect(-15,-1.5,20,3); iconPath(g,'#9a6838',2);
    g.fillStyle='#c8322a'; g.strokeStyle=ICON_INK; g.lineWidth=1.6; g.beginPath(); g.moveTo(4,-1); g.quadraticCurveTo(-1,-5,-4,-4.4); g.lineTo(-2,0); g.lineTo(-4,4.4); g.quadraticCurveTo(-1,5,4,1); g.closePath(); g.stroke(); g.fill();
    g.beginPath(); g.rect(3.5,-2.6,3,5.2); iconPath(g,'#d8a840',1.8);
    g.beginPath(); g.moveTo(6.5,-2.2); g.quadraticCurveTo(10.5,-5.4,16,0); g.quadraticCurveTo(10.5,5.4,6.5,2.2); g.closePath(); iconPath(g,wSteelG(g,0,-5,0,5,tier));
  },
  hammer(g,tier){
    g.rotate(-Math.PI/4);
    g.translate(-1.5,0);
    g.beginPath(); g.rect(-14,-1.9,19,3.8); iconPath(g,'#8a5a32',2.2);
    g.fillStyle='#3a2414'; g.fillRect(-13,-1.9,5,3.8);
    g.beginPath(); rrect(g,1.5,-9.5,10.5,19,2.2); iconPath(g,wSteelG(g,1.5,-9.5,12,9.5,tier),2.4);
    g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(1.5,-9.5,10.5,3); g.fillRect(1.5,6.5,10.5,3);
    g.fillStyle='#c9963a'; g.fillRect(5.5,-9.5,2.6,19);
    g.fillStyle='#ff8a3a'; g.beginPath(); g.moveTo(6.8,-3.2); g.lineTo(9.3,0); g.lineTo(6.8,3.2); g.lineTo(4.3,0); g.closePath(); g.fill();
  },
  bow(g){
    g.rotate(-Math.PI/4);
    g.strokeStyle='rgba(245,240,225,.95)'; g.lineWidth=1.1; g.beginPath(); g.moveTo(-4,-13); g.lineTo(-4,13); g.stroke();
    g.beginPath(); g.moveTo(-4,-13.5); g.quadraticCurveTo(9,-9,6,0); g.quadraticCurveTo(9,9,-4,13.5);
    g.lineCap='round'; g.strokeStyle=ICON_INK; g.lineWidth=5.2; g.stroke(); g.strokeStyle='#a8522a'; g.lineWidth=3; g.stroke(); g.strokeStyle='rgba(255,200,130,.7)'; g.lineWidth=0.9; g.stroke();
    g.strokeStyle=ICON_INK; g.lineWidth=3.2; g.beginPath(); g.moveTo(-12,0); g.lineTo(11,0); g.stroke(); g.strokeStyle='#d8b078'; g.lineWidth=1.6; g.stroke();
    g.beginPath(); g.moveTo(15,0); g.lineTo(10,-3.2); g.lineTo(10,3.2); g.closePath(); iconPath(g,'#e8eef4',1.8);
    g.fillStyle='#c8322a'; g.strokeStyle=ICON_INK; g.lineWidth=1.4; g.beginPath(); g.moveTo(-8,0); g.lineTo(-13,-3.4); g.lineTo(-10.5,0); g.lineTo(-13,3.4); g.closePath(); g.stroke(); g.fill();
    g.fillStyle='#e0b050'; for(const s of [-1,1]){ g.beginPath(); g.arc(-4,s*13.2,1.6,0,TAU); g.fill(); }
  },
  boomerang(g){ g.translate(-1.8,-1.6); g.rotate(-Math.PI/2-0.3); g.translate(1.2,0); drawRangShape(g,1.25,false); }
};
const WICACHE=new Map();
function drawWeaponIcon(g,id,x,y,s){
  if(!WICON[id]||!g||!(s>0)) return;
  let sc=DPR; try{ const m=g.getTransform(); sc=Math.hypot(m.a,m.b)||DPR; }catch(e){}
  const raw=s*sc, q=raw<32?2:4, px=Math.max(8,Math.min(256,Math.ceil(raw/q)*q)), tier=Math.min(3,(G&&G.tier)||0), key=id+'|'+px+'|'+tier;
  let cv=WICACHE.get(key);
  if(!cv){
    cv=mkCanvas(px,px); const c=cv.getContext('2d');
    c.translate(px/2,px/2); c.scale(px/32,px/32); c.lineJoin='round'; c.lineCap='round';
    try{ WICON[id](c,tier); }catch(e){}
    if(WICACHE.size>160) WICACHE.clear(); WICACHE.set(key,cv);
  }
  g.drawImage(cv,x-s/2,y-s/2,s,s);
}

// ---------- the HUD chip: current weapon plus a mini row of the owned ones (tap to switch)
function wChipIcon(cx,cy,size,id,pulse){
  const p=player, r=size/2;
  ctx.fillStyle='rgba(44,26,14,.92)'; ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.fill();
  ctx.lineWidth=2; ctx.strokeStyle=`rgba(255,${190+Math.round(50*pulse)},120,${0.55+0.45*pulse})`; ctx.stroke();
  let prog=0, col='#ffb060';
  if(id==='bow'&&p.bow) prog=p.bow.k; else if(id==='hammer'&&p.ham&&p.ham.ph==='hold') prog=p.ham.ch;
  if(prog>0){ ctx.lineWidth=3; ctx.strokeStyle=prog>=1?'#ffe08a':col; ctx.beginPath(); ctx.arc(cx,cy,r-2.5,-Math.PI/2,-Math.PI/2+TAU*prog); ctx.stroke(); }
  const away=id==='boomerang'&&G.wproj&&G.wproj.some(q=>q.k==='rang');
  ctx.globalAlpha=away?0.35:1; drawWeaponIcon(ctx,id,cx,cy,size*0.8*(1+0.18*pulse)); ctx.globalAlpha=1;
}
function wPanel(x,y,w,h){ ctx.fillStyle='rgba(10,8,6,.58)'; rr(x,y,w,h,10); ctx.fill(); ctx.strokeStyle='rgba(255,220,180,.16)'; ctx.lineWidth=1; ctx.stroke(); }
function drawWeaponHud(){
  if(!G||!player) return;
  if(scene!=='play') WS.paused=true;
  drawWeaponPopups();
  if(G.mode==='story'&&!G.flags.forge) return;
  const own=ownedWeapons(); if(own.length<2) return;
  const L=SAFE.l+14, T=SAFE.t+14, MR=MINI_R(), pw=Math.min(250,MR.x-L-10), cur=curWeapon(), n=own.length, pulse=WS.pulse;
  const keysOn=!usingTouch&&!padActive(), big=38, mini=18, gap=5, cw=8+big+10+n*(mini+gap)-gap+9, chh=52;
  const bossTop=usingTouch&&W>=720&&G.boss&&!G.boss.dead;
  let x=L+pw+8, y=T, hx, hy;
  ctx.save(); ctx.textBaseline='middle';
  if(x+cw+8<=MR.x&&!bossTop){
    wPanel(x,y,cw,chh);
    wChipIcon(x+8+big/2,y+chh/2,big,cur,pulse);
    if(keysOn){ ctx.font=`800 8px ${UIF}`; ctx.fillStyle='rgba(20,12,6,.9)'; rr(x+5,y+4,11,11,3); ctx.fill(); ctx.fillStyle='#ffe0b0'; ctx.textAlign='center'; ctx.fillText('X',x+10.5,y+10); }
    HUD_HITS.push({x,y,w:8+big+5,h:chh,fn:()=>cycleWeapon(1)});
    let mx=x+8+big+10;
    for(let i=0;i<n;i++){
      const id=own[i], on=id===cur, ix=mx+mini/2, iy=y+(keysOn?chh/2-5:chh/2);
      if(on){ ctx.fillStyle='rgba(255,190,110,.22)'; ctx.beginPath(); ctx.arc(ix,iy,mini*0.62,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(255,210,140,.8)'; ctx.lineWidth=1.2; ctx.stroke(); }
      ctx.globalAlpha=on?1:0.6; drawWeaponIcon(ctx,id,ix,iy,mini); ctx.globalAlpha=1;
      if(keysOn){ ctx.font=`700 9px ${UIF}`; ctx.fillStyle=on?'#ffe0a0':'rgba(230,215,190,.55)'; ctx.textAlign='center'; ctx.fillText(String(i+1),ix,y+chh-8); }
      HUD_HITS.push({x:mx-gap/2,y,w:mini+gap,h:chh,fn:()=>equipWeapon(id)});
      mx+=mini+gap;
    }
    hx=x; hy=y+chh+12;
  }else{
    // narrow screens: a small chip under the pause and sound buttons
    const M=MUTE_R(), w2=44, h2=56; x=M.x+M.w/2-w2/2; y=M.y+M.h+8;
    wPanel(x,y,w2,h2); wChipIcon(x+w2/2,y+22,32,cur,pulse);
    for(let i=0;i<n;i++){ const on=own[i]===cur; ctx.fillStyle=on?'#ffcf7a':'rgba(230,215,190,.45)'; ctx.beginPath(); ctx.arc(x+w2/2+(i-(n-1)/2)*6.4,y+h2-8,on?2.6:1.8,0,TAU); ctx.fill(); }
    HUD_HITS.push({x,y,w:w2,h:h2,fn:()=>cycleWeapon(1)});
    hx=null; hy=y+h2+12;
  }
  if(G.mode==='normal'&&G.time<16&&scene==='play'){
    const a=clamp((16-G.time)/1.5,0,1), txt=usingTouch?'Tap a weapon to switch':padActive()?'R1 / RB: switch weapon':'Try every weapon: X or 1 to 6';
    ctx.globalAlpha=a; ctx.font=`600 11px ${UIF}`; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.6)'; ctx.fillStyle='#ffe0b0';
    if(hx!=null){ ctx.textAlign='left'; ctx.strokeText(txt,hx+2,hy); ctx.fillText(txt,hx+2,hy); }
    else{ ctx.textAlign='right'; ctx.strokeText(txt,W-SAFE.r-14,hy); ctx.fillText(txt,W-SAFE.r-14,hy); }
    ctx.globalAlpha=1;
  }
  ctx.restore();
}
// screen-space popups near Ash: the switch cue, and the big "new weapon" pose
function drawWeaponPopups(){
  const p=player; if(!p||p.dead||scene==='menu') return;
  const sx=(p.x-cam.x)*zoom, sy=(p.y-cam.y)*zoom, zk=Math.max(zoom,0.8);
  if(WS.get){
    const t=WS.get.t, a=clamp(Math.min(t/0.2,(2.3-t)/0.5),0,1), lift=1-Math.pow(1-Math.min(1,t/0.35),3), y=sy-(40+lift*14)*zk, s=46*(0.6+0.4*lift);
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.translate(sx,y);
    const gl=ctx.createRadialGradient(0,0,0,0,0,56); gl.addColorStop(0,`rgba(255,220,140,${0.55*a})`); gl.addColorStop(1,'rgba(255,160,60,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,56,0,TAU); ctx.fill();
    ctx.rotate(t*0.7); ctx.fillStyle=`rgba(255,215,140,${0.16*a})`; for(let i=0;i<10;i++){ const b=i*TAU/10; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,60,b,b+0.17); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.globalAlpha=a; drawWeaponIcon(ctx,WS.get.id,sx,y,s); ctx.globalAlpha=1;
  }else if(WS.pop){
    const t=WS.pop.t, a=clamp(Math.min(t/0.1,(1.3-t)/0.35),0,1), y=sy-38*zk-t*12, D=WEAPONS[WS.pop.id];
    ctx.save(); ctx.globalAlpha=a; ctx.font=`700 12px ${UIF}`; ctx.textBaseline='middle';
    const w=ctx.measureText(D.name).width+40, h=26;
    ctx.fillStyle='rgba(12,9,6,.8)'; rr(sx-w/2,y-h/2,w,h,13); ctx.fill(); ctx.strokeStyle='rgba(255,210,150,.5)'; ctx.lineWidth=1; ctx.stroke();
    drawWeaponIcon(ctx,WS.pop.id,sx-w/2+15,y,21); ctx.fillStyle='#ffe6c0'; ctx.textAlign='left'; ctx.fillText(D.name,sx-w/2+29,y+0.5);
    ctx.restore();
  }
}

// ---------- world-space effects: arrows, stuck arrows, the boomerang, hammer shockwaves, the bow's aim line
function drawArrowShape(len,fire,full){
  ctx.strokeStyle='#2a1a0e'; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(-len,0); ctx.lineTo(3,0); ctx.stroke();
  ctx.strokeStyle='#c89a62'; ctx.lineWidth=1.3; ctx.stroke();
  ctx.fillStyle=fire?'#ffd27a':'#e8eef4'; ctx.strokeStyle='#2a2e34'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(2,-2.8); ctx.lineTo(2,2.8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#c8322a'; ctx.beginPath(); ctx.moveTo(-len+5,0); ctx.lineTo(-len-1,-3.2); ctx.lineTo(-len+1.5,0); ctx.lineTo(-len-1,3.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#f4ece0'; ctx.fillRect(-len+3.5,-0.6,3,1.2);
}
function drawWeaponFx(){
  if(!G||!G.wproj) return;
  const p=player, t=G.time;
  for(const f of G.wfx){
    if(f.k!=='ring') continue;
    const k=f.t/f.dur, e=1-Math.pow(1-k,3), r=f.r*(0.25+0.75*e), a=1-k;
    ctx.fillStyle=`rgba(120,100,80,${0.16*a})`; ctx.beginPath(); ctx.arc(f.x,f.y,r,0,TAU); ctx.fill();
    ctx.strokeStyle=`rgba(240,220,190,${0.65*a})`; ctx.lineWidth=2+7*a; ctx.stroke();
    ctx.strokeStyle=`rgba(255,180,90,${0.45*a*(0.4+f.ch)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(f.x,f.y,r*0.72,0,TAU); ctx.stroke();
    if(k<0.6){ ctx.strokeStyle=`rgba(40,26,16,${0.55*(1-k/0.6)})`; ctx.lineWidth=1.6; for(let i=0;i<7;i++){ const b=i*TAU/7+f.x*0.01, r0=8, r1=f.r*(0.35+0.12*((i*37)%5)/5); ctx.beginPath(); ctx.moveTo(f.x+Math.cos(b)*r0,f.y+Math.sin(b)*r0); ctx.lineTo(f.x+Math.cos(b+0.2)*r1*0.6,f.y+Math.sin(b+0.2)*r1*0.6); ctx.lineTo(f.x+Math.cos(b)*r1,f.y+Math.sin(b)*r1); ctx.stroke(); } }
  }
  for(const s of G.wstuck){
    const a=clamp((s.life-s.t)/0.3,0,1), wob=s.ground?0:Math.sin(s.t*45)*0.16*Math.max(0,1-s.t*4);
    ctx.save(); ctx.globalAlpha=a; ctx.translate(s.x,s.y); ctx.rotate(s.a+wob);
    if(s.ground){ ctx.globalAlpha=a*0.85; drawArrowShape(15,false,false); }
    else{ ctx.beginPath(); ctx.rect(-30,-6,30,12); ctx.clip(); drawArrowShape(15,s.fire,false); }
    ctx.restore();
  }
  for(const a of G.wproj){
    if(a.k==='arrow'){
      ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(a.a);
      if(a.full||a.fire){ ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createLinearGradient(-46,0,0,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,a.fire?'rgba(255,150,60,.55)':'rgba(220,240,255,.45)'); ctx.strokeStyle=g; ctx.lineWidth=a.fire?4:2.4; ctx.beginPath(); ctx.moveTo(-46,0); ctx.lineTo(0,0); ctx.stroke(); ctx.restore(); }
      drawArrowShape(15,a.fire,a.full);
      if(a.fire){ ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(6,0,0,6,0,12); g.addColorStop(0,'rgba(255,230,160,.9)'); g.addColorStop(1,'rgba(255,110,30,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(6,0,12,0,TAU); ctx.fill(); }
      ctx.restore();
    }else if(a.k==='rang'){
      for(let i=0;i<a.trail.length;i+=2){ ctx.save(); ctx.globalAlpha=0.12+0.06*i; ctx.translate(a.trail[i],a.trail[i+1]); ctx.rotate(a.spin-0.5*(a.trail.length-i)); drawRangShape(ctx,1.2,a.fire); ctx.restore(); }
      ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(a.spin);
      if(a.fire){ ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(0,0,0,0,0,18); g.addColorStop(0,'rgba(255,220,140,.7)'); g.addColorStop(1,'rgba(255,110,30,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,18,0,TAU); ctx.fill(); ctx.restore(); }
      drawRangShape(ctx,1.25,a.fire); ctx.restore();
    }
  }
  // aim line while the bow is drawn
  if(p&&p.bow&&p.bow.k>0.2&&!p.dead){
    const k=p.bow.k, f=p.facing, L0=26, L1=L0+160+440*k, fire=hasSkill('firearrow')>0||p.breathing;
    ctx.save(); ctx.setLineDash([5,9]); ctx.lineDashOffset=-t*40; ctx.lineWidth=1.6; ctx.strokeStyle=fire?`rgba(255,170,90,${0.35*k})`:`rgba(255,250,235,${0.32*k})`;
    ctx.beginPath(); ctx.moveTo(p.x+Math.cos(f)*L0,p.y+Math.sin(f)*L0); ctx.lineTo(p.x+Math.cos(f)*L1,p.y+Math.sin(f)*L1); ctx.stroke(); ctx.restore();
  }
}

// ---------- Ash's held weapon, drawn inside drawHero (translated to Ash and rotated to his facing, +x is forward)
function wSteel(w,fin){ return wSteelG(ctx,0,-w,0,w,(G&&G.tier)||0,fin); }
function wSweep(R,lo,hi,col,inner){
  const r0=R*(inner||0.3), g=ctx.createRadialGradient(0,0,r0,0,0,R); g.addColorStop(0,'rgba(255,240,220,0)'); g.addColorStop(0.8,col); g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,R,lo,hi); ctx.arc(0,0,r0,hi,lo,true); ctx.closePath(); ctx.fill();
}
function drawFang(len,fin){
  ctx.fillStyle='#2a0e08'; ctx.fillRect(-6.6,-2.1,6.6,4.2);
  ctx.fillStyle='#7a2418'; ctx.fillRect(-6,-1.5,6,3);
  ctx.fillStyle='#c9963a'; ctx.fillRect(-0.9,-3.6,2,7.2);
  fangPath(ctx,len); ctx.fillStyle=wSteel(3,fin); ctx.fill(); ctx.strokeStyle='rgba(40,40,46,.65)'; ctx.lineWidth=0.6; ctx.stroke();
  const tier=(G&&G.tier)||0; if(tier>=2){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(120,190,255,${0.2+0.08*tier})`; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(2,0); ctx.quadraticCurveTo(len*0.55,-1.6,len-1,1); ctx.stroke(); ctx.restore(); }
}
function drawPike(L,fin){
  const hl=15, sl=L-hl;
  ctx.fillStyle='#24160c'; ctx.fillRect(-1.5,-2.3,sl+1.5,4.6);
  const g=ctx.createLinearGradient(0,-1.7,0,1.7); g.addColorStop(0,'#d4a46a'); g.addColorStop(0.5,'#8e5c30'); g.addColorStop(1,'#4e3018'); ctx.fillStyle=g; ctx.fillRect(-0.5,-1.6,sl,3.2);
  ctx.fillStyle='#3a2414'; for(const x of [sl*0.32,sl*0.32+4,sl*0.32+8]) ctx.fillRect(x,-1.8,1.6,3.6);
  ctx.fillStyle='#7a828c'; ctx.fillRect(-2.5,-2.2,3,4.4);
  const sway=Math.sin(((G&&G.time)||0)*7)*1.2;
  ctx.fillStyle='#c8322a'; ctx.beginPath(); ctx.moveTo(sl-2,-1); ctx.quadraticCurveTo(sl-7,-4.5+sway,sl-13,-3.4+sway); ctx.lineTo(sl-10,sway*0.5); ctx.lineTo(sl-13,3.4+sway); ctx.quadraticCurveTo(sl-7,4.5+sway,sl-2,1); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#c9963a'; ctx.fillRect(sl-3,-2.6,3.4,5.2);
  ctx.save(); ctx.translate(sl,0); ctx.fillStyle=wSteel(4.6,fin); ctx.beginPath(); ctx.moveTo(0,-2.2); ctx.quadraticCurveTo(hl*0.45,-4.8,hl,0); ctx.quadraticCurveTo(hl*0.45,4.8,0,2.2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(36,42,50,.75)'; ctx.lineWidth=0.7; ctx.stroke(); ctx.beginPath(); ctx.moveTo(1,0); ctx.lineTo(hl-2,0); ctx.stroke(); ctx.restore();
}
function drawHammerAt(phi,glow){
  const px=1, py=9, L=30, c=Math.cos(phi), hx=px+c*L, lift=Math.max(0,Math.sin(phi)), sc=1+0.42*lift, tier=(G&&G.tier)||0;
  ctx.lineCap='round';
  ctx.strokeStyle='#24160c'; ctx.lineWidth=4.6; ctx.beginPath(); ctx.moveTo(px-c*6,py); ctx.lineTo(hx,py); ctx.stroke();
  ctx.strokeStyle='#8e5c30'; ctx.lineWidth=2.8; ctx.stroke();
  ctx.save(); ctx.translate(hx,py); ctx.scale(sc,sc);
  const hw=6.5, hh=11.5;
  ctx.fillStyle='#1a120c'; rrect(ctx,-hw-1.2,-hh-1.2,hw*2+2.4,hh*2+2.4,3.2); ctx.fill();
  const g=ctx.createLinearGradient(-hw,-hh,hw,hh);
  if(tier>0){ g.addColorStop(0,'#e8f4ff'); g.addColorStop(0.5,tier>=3?'#6aaee8':'#8aaccc'); g.addColorStop(1,tier>=3?'#22406e':'#3a4a5a'); }
  else{ g.addColorStop(0,'#c8ccd2'); g.addColorStop(0.5,'#7a828c'); g.addColorStop(1,'#33383e'); }
  ctx.fillStyle=g; rrect(ctx,-hw,-hh,hw*2,hh*2,2.4); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(-hw,-hh,hw*2,3.2); ctx.fillRect(-hw,hh-3.2,hw*2,3.2);
  ctx.fillStyle='#c9963a'; ctx.fillRect(-1.4,-hh,2.8,hh*2);
  ctx.fillStyle='#5a3a1a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(0,s*6,0.9,0,TAU); ctx.fill(); }
  const gl=clamp(glow,0,1), pul=gl>=1?0.75+0.25*Math.sin(((G&&G.time)||0)*14):1;
  ctx.fillStyle=`rgb(255,${Math.round(110+110*gl)},${Math.round(40+60*gl)})`; ctx.beginPath(); ctx.moveTo(0,-3.4); ctx.lineTo(2.6,0); ctx.lineTo(0,3.4); ctx.lineTo(-2.6,0); ctx.closePath(); ctx.fill();
  if(gl>0){ ctx.globalCompositeOperation='lighter'; const rg2=ctx.createRadialGradient(0,0,0,0,0,16+8*gl); rg2.addColorStop(0,`rgba(255,200,110,${0.7*gl*pul})`); rg2.addColorStop(1,'rgba(255,100,30,0)'); ctx.fillStyle=rg2; ctx.beginPath(); ctx.arc(0,0,16+8*gl,0,TAU); ctx.fill(); }
  ctx.restore();
  return hx;
}
const HAM_IDLE=0.55;
function hammerPose(p){
  const h=p.ham, idle=HAM_IDLE; if(!h) return {phi:idle,glow:0};
  const wind=0.34/p.stats.atkSpeed;
  if(h.ph==='wind'){ const k=clamp(h.t/wind,0,1); return {phi:lerp(idle,2.85,1-Math.pow(1-k,2)),glow:0}; }
  if(h.ph==='hold') return {phi:2.85+Math.sin(G.time*55)*0.04*h.ch,glow:h.ch};
  if(h.ph==='fall'){ const k=clamp(h.t/0.09,0,1); return {phi:lerp(2.85,-0.1,k*k),glow:h.ch,fall:k}; }
  const k=clamp(h.t/0.26,0,1); return {phi:k<0.45?-0.1:lerp(-0.1,idle,(k-0.45)/0.55),glow:h.ch*(1-k),rest:k};
}
function drawAshBow(k,arrow,snap,fire){
  const span=15.5-1.5*k, back=3.5+5.5*k, nx=-back-15*k;
  ctx.lineCap='round';
  if(arrow){
    ctx.strokeStyle='#2a1a0e'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(nx,0); ctx.lineTo(nx+27,0); ctx.stroke(); ctx.strokeStyle='#c89a62'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.fillStyle=fire?'#ffd27a':'#e8eef4'; ctx.beginPath(); ctx.moveTo(nx+32,0); ctx.lineTo(nx+26,-2.6); ctx.lineTo(nx+26,2.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#c8322a'; ctx.beginPath(); ctx.moveTo(nx+5,0); ctx.lineTo(nx-1,-3); ctx.lineTo(nx+1.5,0); ctx.lineTo(nx-1,3); ctx.closePath(); ctx.fill();
    if(fire){ ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(nx+30,0,0,nx+30,0,10); g.addColorStop(0,'rgba(255,230,150,.9)'); g.addColorStop(1,'rgba(255,110,30,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(nx+30,0,10,0,TAU); ctx.fill(); ctx.restore(); }
  }
  ctx.beginPath(); ctx.moveTo(-back,-span); ctx.quadraticCurveTo(4,-span*0.62,0,0); ctx.quadraticCurveTo(4,span*0.62,-back,span);
  ctx.strokeStyle='#22100a'; ctx.lineWidth=4.4; ctx.stroke(); ctx.strokeStyle='#9a4a24'; ctx.lineWidth=2.8; ctx.stroke(); ctx.strokeStyle='rgba(255,190,120,.55)'; ctx.lineWidth=0.9; ctx.stroke();
  const vib=snap>0?Math.sin(((G&&G.time)||0)*90)*2.5*snap:0;
  ctx.strokeStyle='rgba(245,240,225,.95)'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(-back,-span); ctx.lineTo(nx+vib,0); ctx.lineTo(-back,span); ctx.stroke();
  ctx.fillStyle='#e0b050'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(-back,s*span,1.6,0,TAU); ctx.fill(); }
  ctx.fillStyle='#3a2414'; ctx.fillRect(-1.6,-3.2,3.6,6.4);
}
function heroSword(p){
  const st=p.stats;
  if(p.swingT>0&&p.swingW==='sword'){
    const pr=1-p.swingT/p.swingDur, ez=1-Math.pow(1-pr,2.2);
    if(p.swingSpin){
      const R=st.range*1.2, a0=-p.swingSide*0.5, a=a0+p.swingSide*TAU*ez;
      wSweep(R,Math.min(a0,a),Math.max(a0,a),'rgba(255,190,110,.42)'); drawHeroBlade(a,R*0.92,true,false); return;
    }
    const span=p.swingFin?1.4:1.15, a0=-p.swingSide*span, a1=p.swingSide*span, a=lerp(a0,a1,ez), R=st.range*(p.swingFin?1.25:1);
    wSweep(R,Math.min(a0,a),Math.max(a0,a),p.swingFin?'rgba(255,190,110,.42)':'rgba(240,244,250,.3)');
    drawHeroBlade(a,R*0.92,p.swingFin,false);
  }else drawHeroBlade(0,30,false,true);
}
function heroDaggers(p){
  const K=wReachK();
  if(p.swingT>0&&p.swingW==='daggers'){
    const pr=1-p.swingT/p.swingDur, ez=1-Math.pow(1-pr,2), s=p.swingSide;
    if(p.swingSpin){
      const R=44*K*1.45, a=ez*TAU*s; wSweep(R,Math.min(0,a),Math.max(0,a),'rgba(225,205,255,.42)',0.4);
      for(const q of [0,Math.PI]){ ctx.save(); ctx.rotate(a+q); ctx.translate(R*0.5,0); ctx.rotate(Math.PI/2*s); drawFang(15,true); ctx.restore(); }
      return;
    }
    if(p.swingFin){
      const ext=Math.sin(Math.min(1,pr*1.6)*Math.PI*0.5)*22*(pr<0.75?1:1-(pr-0.75)/0.25);
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
      for(const q of [-1,1]){ const g=ctx.createLinearGradient(-14,0,20+ext,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,`rgba(235,225,255,${0.6*(1-pr)})`); ctx.strokeStyle=g; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(-14,q*10); ctx.lineTo(20+ext,q*5); ctx.stroke(); }
      ctx.restore();
      for(const q of [-1,1]){ ctx.save(); ctx.translate(7+ext,q*7); ctx.rotate(-q*0.08); drawFang(15,true); ctx.restore(); }
      return;
    }
    const R=44*K, a0=s*0.85, a=lerp(a0,-a0,ez), ext=Math.sin(pr*Math.PI)*15;
    wSweep(R,Math.min(a0,a),Math.max(a0,a),'rgba(240,236,255,.34)',0.45);
    ctx.save(); ctx.translate(7,-s*11.5); ctx.rotate(-s*0.3); drawFang(13,false); ctx.restore();
    ctx.save(); ctx.translate(7,s*10); ctx.rotate(a*0.55); ctx.translate(ext,0); drawFang(14,false); ctx.restore();
    return;
  }
  for(const q of [-1,1]){ ctx.save(); ctx.translate(7,q*11.5); ctx.rotate(q*0.3); drawFang(13,false); ctx.restore(); }
}
const PIKE_L=96;
function pikeIdle(){ ctx.save(); ctx.translate(-44,10); ctx.rotate(-0.08); drawPike(PIKE_L,false); ctx.restore(); }
function heroSpear(p){
  const K=wReachK();
  if(p.swingT>0&&p.swingW==='spear'){
    const pr=1-p.swingT/p.swingDur;
    if(p.swingSpin){
      const a=(1-Math.pow(1-pr,2))*TAU, R=92*K; wSweep(R,Math.min(-0.3,a-0.3),Math.max(-0.3,a-0.3),'rgba(255,220,170,.38)',0.35);
      ctx.save(); ctx.rotate(a); ctx.translate(-PIKE_L*0.45,0); drawPike(Math.max(PIKE_L,PIKE_L*0.45+R*0.9),true); ctx.restore(); return;
    }
    const fin=p.swingFin, len=100*K*(fin?1.2:1), e=spearExt(pr), tip=34+(len-34)*e;
    if(e>0.05){
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const g=ctx.createLinearGradient(14,0,tip+10,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,fin?'rgba(255,210,130,.75)':'rgba(230,240,255,.6)');
      const hw=(fin?4.6:3)*(pr<0.68?1:e); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(14,2-hw); ctx.lineTo(tip+10,2); ctx.lineTo(14,2+hw); ctx.closePath(); ctx.fill();
      if(fin&&pr<0.6){ ctx.strokeStyle=`rgba(255,220,160,${0.5*(1-pr/0.6)})`; ctx.lineWidth=1.4; for(const q of [-1,1]){ ctx.beginPath(); ctx.moveTo(tip-30,2+q*9); ctx.quadraticCurveTo(tip-8,2+q*4,tip+4,2); ctx.stroke(); } }
      ctx.restore();
    }
    ctx.save(); ctx.translate(tip-PIKE_L,2+4*(1-e)); drawPike(PIKE_L,fin); ctx.restore();
    return;
  }
  pikeIdle();
}
function heroHammer(p){
  const s=hammerPose(p);
  if(s.fall!=null&&s.fall>0.15){
    ctx.save();
    for(let i=1;i<=4;i++){ const k=Math.max(0,s.fall-i*0.16), ph=lerp(2.85,-0.1,k*k); ctx.globalAlpha=0.22*(1-i/5); drawHammerAt(ph,s.glow*0.5); }
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation='lighter'; const x0=1+Math.cos(2.85)*30, x1=1+Math.cos(s.phi)*30; const g=ctx.createLinearGradient(x0,0,x1,0); g.addColorStop(0,'rgba(255,200,140,0)'); g.addColorStop(1,`rgba(255,${200-Math.round(60*s.glow)},140,.45)`); ctx.fillStyle=g; ctx.fillRect(Math.min(x0,x1),-6,Math.abs(x1-x0),30); ctx.restore();
  }
  drawHammerAt(s.phi,s.glow);
}
function heroBow(p){
  const b=p.bow, fire=hasSkill('firearrow')>0||p.breathing;
  if(b||p.bowSnap>0){ ctx.save(); ctx.translate(15,-1); drawAshBow(b?b.k:0,!!b,!b&&p.bowSnap>0?p.bowSnap/0.14:0,fire); ctx.restore(); return; }
  ctx.save(); ctx.translate(5,-14); ctx.rotate(-Math.PI/2+0.32); ctx.scale(0.9,0.9); drawAshBow(0,false,0,false); ctx.restore();
}
function heroRang(p){
  if(G.wproj&&G.wproj.some(q=>q.k==='rang')) return;   // it is out flying
  const t=p.throwT>0?p.throwT/0.14:0;
  ctx.save(); ctx.translate(11+t*8,14-t*3); ctx.rotate(0.75-t*0.75); drawRangShape(ctx,1.2,false); ctx.restore();
}
function heroIdle(w,p){
  if(w==='daggers') heroDaggers(p); else if(w==='spear') pikeIdle();
  else if(w==='hammer') drawHammerAt(HAM_IDLE,0); else if(w==='bow'){ ctx.save(); ctx.translate(5,-14); ctx.rotate(-Math.PI/2+0.32); ctx.scale(0.9,0.9); drawAshBow(0,false,0,false); ctx.restore(); }
  else if(w==='boomerang') heroRang(p); else drawHeroBlade(0,30,false,true);
}
function drawHeroWeapon(p){
  const armed=!(G&&G.mode==='story'&&!G.flags.forge);
  const w=p.swingT>0&&p.swingW?p.swingW:curWeapon();
  if(p.drinkT>0){ ctx.fillStyle='rgba(120,255,160,.85)'; ctx.beginPath(); ctx.arc(15,7,3,0,TAU); ctx.fill(); if(armed){ ctx.strokeStyle='#d8e8e0'; ctx.lineWidth=1; ctx.stroke(); heroIdle(curWeapon(),p); } return; }
  if(!armed) return;
  const pk=p.wEquipT>0?Math.sin(clamp(p.wEquipT/0.35,0,1)*Math.PI):0;
  if(pk>0){ ctx.save(); ctx.translate(6,10); ctx.scale(1+0.28*pk,1+0.28*pk); ctx.translate(-6,-10); }
  if(w==='daggers') heroDaggers(p); else if(w==='spear') heroSpear(p); else if(w==='hammer') heroHammer(p);
  else if(w==='bow') heroBow(p); else if(w==='boomerang') heroRang(p); else heroSword(p);
  if(pk>0){ ctx.restore(); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,220,150,${0.6*pk})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(8,10,10+12*(1-pk),0,TAU); ctx.stroke(); ctx.restore(); }
}

window.__ebX=Object.assign(window.__ebX||{},{
  giveWeapon, equipWeapon, cycleWeapon, curWeapon, ownedWeapons, forgeHammerTalk, drawWeaponIcon, wPower,
  giveAllWeapons(){ for(const id of WEAPON_IDS) giveWeapon(id,true); },
  spawnFoe(type,x,y,o){ const e=makeEnemy(type,x,y,Object.assign({aggro:true},o||{})); e.spawnIn=0; if(AREA){ e.inArea=AREA.id; } return e.id; },
  foe(id){ const e=G.enemies.find(q=>q.id===id); return e?{hp:e.hp,maxHp:e.maxHp,stun:e.stun,burnT:e.burnT,x:e.x,y:e.y,dead:e.dead,blocking:e.blocking}:null; },
  wpnState(){ const p=player; return {weapon:curWeapon(),owned:ownedWeapons(),proj:(G.wproj||[]).map(a=>({k:a.k,x:Math.round(a.x),y:Math.round(a.y),ph:a.ph,fire:!!a.fire,full:!!a.full,carry:a.carry?a.carry.length:0})),stuck:(G.wstuck||[]).length,fx:(G.wfx||[]).length,bow:p.bow?p.bow.k:null,ham:p.ham?{ph:p.ham.ph,ch:p.ham.ch}:null,swingT:p.swingT,swingW:p.swingW||null}; }
});
