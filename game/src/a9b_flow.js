
// ================= boss defeat
function onBossDefeated(e){
  G.corpse=e; e.deathT=0; player.iframes=99;
  G.timeScale=0.3; G.slowT=1.1; flashA=0.6; flashCol='255,220,160'; shake(16);
  for(const pr of G.projectiles) if(pr.owner==='enemy') pr.dead=true;
  G.hazards=G.hazards.filter(h=>h.kind!=='spawn'&&!h.meteor);
  G.rings=G.rings.filter(r=>r.owner==='player'); G.pools=G.pools.filter(p=>p.owner==='player');
  if(G.mode==='story'){ for(const o of G.enemies) if(!o.dead&&((G.fightSite&&o.camp===G.siteGuards[G.fightSite])||o.type==='egg'||o.questTag||(o.type==='drakeling'&&dist(o.x,o.y,e.x,e.y)<900))){ o.dead=true; deathFx(o); } }
  else { for(const o of G.enemies) if(o!==e&&!o.dead){ o.dead=true; deathFx(o); } G.queue=[]; G.phase='bossDead'; }
  if(e.type==='vorlaxis') for(let i=0;i<8;i++) later(0.15+i*0.22,()=>{ const x=e.x+rand(-90,90), y=e.y+rand(-70,70); emit(x,y,30,{kind:'fire',smin:80,smax:340,lmin:.4,lmax:.8,zmin:5,zmax:11,grow:12}); SFX.play('boom'); shake(10); });
  later(e.type==='vorlaxis'?2.8:1.9,()=>{ player.iframes=0.5; if(G.mode==='story') storyBossDone(); else normalBossDone(); });
}

// ================= story start, death, travel
function startStory(fromSave){
  SFX.init();
  const s=fromSave?slotSave(curSlot):null;
  if(s&&s.v===3){ loadGame(s); scene='play'; hideAll(); updateCam(0,true); G.chunkBurst=16; setBanner(regionAt(player.x,player.y).name,'Journey resumed',2.2); return; }
  newRun('story'); clearStatic(); fogInit('');
  player.x=POI.village.x+60; player.y=POI.village.y+150; player.facing=-Math.PI/2;
  setupNPCs(); placeGoat(); updateCam(0,true); G.chunkBurst=16;
  G.hintT=30;
  runDialogue(STORY.prologue,()=>{ scene='play'; hideAll(); showCard('Chapter 1','Lantern Day'); later(2.9,questUpdated); saveGame(); });
}
function playerDied(){
  const p=player; p.dead=true; p.breathing=false; SFX.setFire(false); SFX.play('death'); shake(12);
  emit(p.x,p.y,40,{kind:'fire',smin:50,smax:240,lmin:.4,lmax:.9,zmin:3,zmax:8,grow:6});
  G.deaths++; scene='dying'; dyingT=1.4;
}
function showDeath(){
  scene='dead';
  const st=$('#deadStats');
  if(G.mode==='story'){
    const sh=SHRINES.find(s=>s.id===G.lastShrine);
    $('#deadTitle').textContent='You fell'; $('#deadMsg').textContent=pick(DEATH_LINES);
    st.innerHTML=`<div class="stat"><b>${player.level}</b><span>Level</span></div><div class="stat"><b>${sh?sh.name.replace(' Shrine',''):'Emberhollow'}</b><span>You will wake at</span></div>`;
    $('#bRetry').textContent='Rise again';
  }else{
    const key='eb_best_'+diffIdx, best=store.get(key,{wave:0,score:0});
    const isBest=G.score>best.score; if(isBest) store.set(key,{wave:G.wave,score:G.score});
    Cloud.submitScore(diffIdx,G.wave,G.score);
    $('#deadTitle').textContent=isBest?'New best!':'Game over';
    $('#deadMsg').textContent=`You made it to wave ${G.wave} on ${G.diff.name}.`;
    st.innerHTML=`<div class="stat"><b>${fmt(G.score)}</b><span>Score</span></div><div class="stat"><b>${fmt(G.kills)}</b><span>Enemies defeated</span></div><div class="stat"><b>${G.wave}</b><span>Wave</span></div><div class="stat"><b>${fmt(Math.max(best.score,G.score))}</b><span>Best score</span></div>`;
    $('#bRetry').textContent='Play again';
  }
  show('dead');
}
function respawn(){
  const p=player, sh=SHRINES.find(s=>s.id===G.lastShrine)||SHRINES[0];
  if(AREA) exitArea(true);
  if(G.fightSite) resetBoss();
  for(const e of G.enemies){ if(e.roam) e.dead=true; else if(e.camp&&!Object.values(G.siteGuards).includes(e.camp)){ e.dead=true; } else { e.aggro=false; e.returning=true; e.hp=e.maxHp; } }
  for(const k in G.campState) G.campState[k].active=false;
  G.projectiles=[]; G.hazards=[]; G.pools=[]; G.rings=[];
  p.dead=false; p.hp=p.hpShow=p.maxHp; p.potions=p.potionsMax; p.stamina=p.maxStamina; p.energy=p.maxEnergy; p.iframes=1.5; p.stats.phoenix=p.stats.phoenixMax||0; p.drinkT=0;
  p.x=sh.x+40; p.y=sh.y+50; p.kvx=p.kvy=0;
  updateCam(0,true); G.chunkBurst=16; scene='play'; hideAll(); setBanner('You wake at the shrine',sh.name,2.2); saveGame();
}
function travelTo(s){
  closeMap(true);
  if(AREA) exitArea(true);
  player.x=s.x+40; player.y=s.y+50; player.kvx=player.kvy=0; player.iframes=1;
  for(const e of G.enemies) if(!e.boss&&dist(e.x,e.y,player.x,player.y)<500){ e.aggro=false; }
  if(G.fightSite) resetBoss();
  if(G.pip){ G.pip.x=player.x-30; G.pip.y=player.y; } compsOnMove();
  if(G.goat&&G.side.duchess==='follow'){ G.goat.x=player.x-40; G.goat.y=player.y+30; }
  G.lastShrine=s.id; updateCam(0,true); G.chunkBurst=16; flashA=0.6; flashCol='255,220,170'; SFX.play('shrine');
  setBanner(s.name,'Fast travel',1.8); saveGame();
}

// ================= normal mode (Proving Grounds)
function startNormal(){
  SFX.init(); newRun('normal'); const P=POI.proving;
  G.arena={x:P.x,y:P.y,r:600}; G.tod=0.74; for(const k in SHRINES) G.shrines[SHRINES[k].id]=true;
  player.x=P.x; player.y=P.y+120; updateCam(0,true); G.chunkBurst=16;
  scene='play'; hideAll(); setBanner('Normal Mode','Survive the endless horde in the Proving Grounds',2.4); G.hintT=14;
  later(2.4,nextNormalWave);
}
function genWave(n){
  let budget=4+n*1.8; const pool=[['kobold',1]];
  if(n>=2) pool.push(['cultist',2]); if(n>=3) pool.push(['wolf',1.5],['drakeling',2]); if(n>=6) pool.push(['knight',4]);
  const counts={}; let guard=0;
  while(budget>=1&&guard++<300){ const [t,c]=pick(pool); if(c>budget) continue; counts[t]=(counts[t]||0)+1; budget-=c; }
  return Object.entries(counts);
}
function startWave(list){ const q=[]; for(const [t,c] of list) for(let i=0;i<c;i++) q.push(t); G.queue=shuffle(q); G.spawnT=0.3; G.phase='waves'; }
function arenaSpawnPoint(){ const A=G.arena; for(let i=0;i<20;i++){ const g=pick([0,Math.PI/2,Math.PI,-Math.PI/2]), r=rand(420,540), a=g+rand(-0.25,0.25), x=A.x+Math.cos(a)*r, y=A.y+Math.sin(a)*r; if(dist(x,y,player.x,player.y)>260&&freeSpot(x,y)) return {x,y}; } return spotNear(A.x,A.y,200,520,200); }
function updateSpawner(dt){
  if(!G.queue.length) return;
  let pending=0; for(const h of G.hazards) if(h.kind==='spawn') pending++;
  if(G.enemies.length+pending>=G.maxAlive) return;
  G.spawnT-=dt;
  if(G.spawnT<=0){ G.spawnT=rand(0.25,0.55); const t=G.queue.pop(), s=arenaSpawnPoint(); spawnRune(t,s.x,s.y,{level:1,aggro:true}); }
}
function checkWave(){
  if(G.mode!=='normal'||G.phase!=='waves'||G.queue.length) return;
  if(G.hazards.some(h=>h.kind==='spawn')||G.enemies.some(e=>!e.dead&&!e.boss)) return;
  G.phase='inter'; SFX.play('quest'); heal(player.maxHp*0.12); player.energy=player.maxEnergy; player.potions=Math.min(player.potionsMax,player.potions+1);
  G.score+=G.wave*100; setBanner(`Wave ${G.wave} cleared!`,`+${fmt(G.wave*100)} bonus`,1.8);
  const up=G.wave%2===0;
  later(1.7,()=>{ if(up) offerUpgrades(()=>later(0.8,nextNormalWave)); else later(0.5,nextNormalWave); });
}
function nextNormalWave(){
  G.wave++; const n=G.wave;
  G.hpMul=1+(n-1)*0.07; G.dmgMul=1+(n-1)*0.03; G.eliteChance=clamp((n-4)*0.04,0,0.5); G.maxAlive=Math.min(22,9+Math.floor(n/2));
  if(n%5===0){
    const k=n/5-1, BL=['grizzlefang','morrow','gloamjaw','broodmother','greymane','cindervane','vorlaxis'], bt=BL[k%BL.length], cyc=Math.floor(k/BL.length);
    G.phase='boss'; setBanner(`Wave ${n}`,'A champion approaches!',2);
    later(1.0,()=>{ const s=arenaSpawnPoint(); const A=G.arena; SFX.play('warn'); spawnRune(bt,bt==='vorlaxis'?A.x:s.x,bt==='vorlaxis'?A.y-200:s.y,{homeX:A.x,homeY:A.y,hpScale:(1+(n-5)*0.03)*(1+cyc*0.4)},1.5); const d=EDEF[bt]; setBanner(d.name,(W<560&&d.short)?d.short:d.title,2.8,'boss'); });
    const adds=genWave(Math.max(1,Math.floor(n/3)));
    later(3,()=>{ const q=[]; for(const [t,c] of adds) for(let i=0;i<c;i++) q.push(t); G.queue=shuffle(q); });
  }else{ setBanner(`Wave ${n}`,'',1.6); startWave(genWave(n)); }
}
function normalBossDone(){ G.phase='inter'; G.boss=null; G.score+=G.wave*250; SFX.play('quest'); heal(player.maxHp*0.3); offerUpgrades(()=>later(1.2,nextNormalWave)); }

// ================= main update
function simUpdate(dt){
  if(G.mode!=='story') return;
  if(G.fade>0) G.fade=Math.max(0,G.fade-dt*2.5);
  if(AREA){
    updateArea(dt); if(!AREA) return; updateNPCs(dt); updateInteractions(dt); updateFollowers(dt); updateComps(dt); villagerBarks(dt); updateWeather(dt);
    if(G.spirit){ G.spirit.t+=dt; }
    G.regionT-=dt; if(G.regionT<=0){ G.regionT=0.6; G.region=regionAt(player.x,player.y); }
    if(G.pendingBless>0&&!G.inCombat&&!G.mini&&scene==='play'){ G.blessDelay-=dt; if(G.blessDelay<=0){ G.blessDelay=2; offerPending(); } } else G.blessDelay=2;
    return;
  }
  updateAllies(dt);
  updateCamps(); updateWolves(dt); cullFar(); updateNPCs(dt); if(G.mode==='story') miniUpdate(dt); updateStory(dt); updateInteractions(dt); updateComps(dt); villagerBarks(dt); updateEvents(dt); updateWeather(dt);
  if(G.spirit){ G.spirit.t+=dt; if(!G.spirit.on){ G.spirit.fade=(G.spirit.fade||0)+dt; if(G.spirit.fade>1.5) G.spirit=null; } }
  G.critterT-=dt; if(G.critterT<=0){ G.critterT=rand(2,4); spawnCritters(); }
  G.fogT-=dt; if(G.fogT<=0){ G.fogT=0.3; fogReveal(player.x,player.y,650); }
  G.regionT-=dt;
  if(G.regionT<=0){ G.regionT=0.6; const r=regionAt(player.x,player.y); if(!G.region||r.key!==G.region.key){ const first=!G.region||String(G.region.key).startsWith('area_'); G.region=r; if(!first&&!G.banner){ const help=CAST.filter(c=>c.town===r.key&&npcMarker(c.id)==='!').length; setBanner(r.name,help?`${help} ${help===1?'person here could':'people here could'} use your help`:`Danger level ${r.level}`,2.4,'region'); } } }
  if(G.pendingBless>0&&!G.inCombat&&!G.mini&&!(G.boss&&!G.boss.dead)&&scene==='play'){ G.blessDelay-=dt; if(G.blessDelay<=0){ G.blessDelay=2; offerPending(); } } else G.blessDelay=2;
  G.autoSaveT-=dt; if(G.autoSaveT<=0){ G.autoSaveT=60; if(!G.inCombat) saveGame(); }
}
function update(dt){
  G.time+=dt; G.playTime+=dt;
  if(G.mode==='story'){ G.worldTime+=dt; G.tod=(G.tod+dt/540)%1; }
  const inp=readInput(dt);
  if(inp.roll) G.dashBuf=0.15;
  if(inp.roar) G.roarBuf=0.2;
  if(hitstop>0){ hitstop-=dt; updateCam(dt); return; }
  ensureProps(player.x,player.y,1100);
  if(!player.dead) updatePlayer(dt,{...inp,use:inp.use});
  updateSpawner(dt);
  updateEnemies(dt); updateCritters(dt); updateBirds(dt);
  updateProjectiles(dt); updateHazards(dt); updateRings(dt); updatePools(dt); updatePickups(dt);
  updateParticles(dt); updateTexts(dt); ambientEmit(dt); updateAmbience(dt);
  if(scene==='play') simUpdate(dt);
  if(G.enemies.some(e=>e.dead)) G.enemies=G.enemies.filter(e=>!e.dead);
  if(G.corpse){ G.corpse.deathT+=dt; if(G.corpse.deathT>3) G.corpse=null; }
  if(G.comboT>0){ G.comboT-=dt; if(G.comboT<=0) G.combo=0; }
  if(G.banner){ G.banner.t+=dt; if(G.banner.t>=G.banner.dur) G.banner=null; }
  if(G.taunt){ G.taunt.t+=dt; if(G.taunt.t>=G.taunt.dur) G.taunt=null; }
  if(G.hintT>0) G.hintT-=dt;
  if(G.hurtVig>0) G.hurtVig-=dt*1.5;
  player.hpShow=lerp(player.hpShow,player.hp,1-Math.exp(-dt*3));
  checkWave();
  updateCam(dt);
}
function liteUpdate(dt){
  if(!G) return;
  G.time+=dt; updateParticles(dt); updateTexts(dt); ambientEmit(dt); updateAmbience(dt);
  if(G.corpse) G.corpse.deathT+=dt;
  if(player) player.hpShow=lerp(player.hpShow,player.hp,1-Math.exp(-dt*3));
  updateCam(dt);
}
function victory(){
  scene='victory'; SFX.play('win');
  const m=Math.floor(G.playTime/60), s=Math.floor(G.playTime%60);
  const E=ENDINGS[G.choices.ending||'hero'], seen=store.get('eb_endings',{});
  $('#winTag').textContent=`Ending ${E.n} of 4`; $('#winTitle').textContent=E.title;
  $('#winMsg').textContent=Object.keys(seen).length<4?`You've found ${Object.keys(seen).length} of 4 endings. Different choices along the way lead to different endings.`:'You found every ending. The Wardens would be proud. Iska would want a word.';
  $('#winStats').innerHTML=`<div class="stat"><b>${m}:${String(s).padStart(2,'0')}</b><span>Time</span></div><div class="stat"><b>${player.level}</b><span>Level</span></div><div class="stat"><b>${Object.values(G.quests).filter(q=>q.done).length}</b><span>Quests done</span></div><div class="stat"><b>${Object.keys(G.pages).length}/10</b><span>Lost pages</span></div>`;
  show('victory');
}
function pauseGame(){
  if(scene!=='play') return;
  scene='paused'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null;
  $('#bRestart').hidden=G.mode==='story'; $('#bPauseMap').hidden=G.mode!=='story';
  $('#bQuit').textContent=G.mode==='story'?'Save and quit to menu':'Quit to menu';
  refreshSoundLabels(); show('pause');
}
function resumeGame(){ if(scene!=='paused') return; scene='play'; hideAll(); }
function toggleMute(){ SFX.init(); SFX.toggle(); refreshSoundLabels(); }
// the speaker button on the HUD mutes or unmutes everything at once
function toggleAllSound(){ SFX.init(); const anyOn=!SFX.muted||!Music.muted; if(anyOn){ if(!SFX.muted) SFX.toggle(); if(!Music.muted) Music.toggle(); } else { SFX.toggle(); Music.toggle(); mLast=null; } refreshSoundLabels(); }
function allMuted(){ return SFX.muted&&Music.muted; }
function refreshSoundLabels(){ if($('#settings').classList.contains('on')) renderSettings(); }
