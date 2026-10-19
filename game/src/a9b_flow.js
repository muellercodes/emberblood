
// ================= boss defeat
function onBossDefeated(e){
  G.corpse=e; e.deathT=0; player.iframes=99;
  G.timeScale=0.3; G.slowT=1.1; flashA=0.6; flashCol='255,220,160'; shake(16);
  for(const pr of G.projectiles) if(pr.owner==='enemy') pr.dead=true;
  G.hazards=G.hazards.filter(h=>h.kind!=='spawn'&&!h.meteor);
  G.rings=G.rings.filter(r=>r.owner==='player'); G.pools=G.pools.filter(p=>p.owner==='player');
  if(G.mode==='story'){ for(const o of G.enemies) if(!o.dead&&((G.fightSite&&o.camp===G.siteGuards[G.fightSite])||o.type==='egg'||o.questTag||(o.type==='drakeling'&&dist(o.x,o.y,e.x,e.y)<900))){ o.dead=true; deathFx(o); if(o.type!=='egg'&&o!==e) gainXp(foeXp(o)); } }
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
  setupNPCs(); placeGoat();
  wakeInBed();   // (v11) asleep upstairs at home; if the house is missing he starts on the street, as before
  updateCam(0,true); G.chunkBurst=16;
  G.hintT=30;
  runDialogue(STORY.prologue||STORY.open,()=>{ wakeUp(); scene='play'; hideAll(); showCard('Chapter 1','Lantern Day'); later(2.9,questUpdated); saveGame(); });
}
// ---------- a new story wakes Ash in his own bed (v11). Drew: "Why is Ash outside when his mom calls him awake?"
// He sleeps in the attic hideout at home (h_ash_up, the bed is in a2e_interiors.js); the opening plays there with him
// asleep under the quilt, Mom calling up the stairs; then he gets up, and walks down the stairs and out of the door
// himself. Old saves never come here (loadGame puts them where they saved).
const WAKE={on:false,bed:null};
function wakeInBed(){
  const d=DOORS.find(q=>q.area==='h_ash'); if(!d||!AREADEFS.h_ash||!AREADEFS.h_ash_up) return false;
  enterArea('h_ash',d); if(!AREA||AREA.id!=='h_ash') return false;
  goFloor({to:'h_ash_up'});
  G.banner=null; if(G.bannerQ) G.bannerQ.length=0;   // no "Home" or room name over the opening
  const bed=AREA&&AREA.id==='h_ash_up'&&AREA.objs.find(o=>o.k==='bed'&&o.home); if(!bed) return true;
  WAKE.on=true; WAKE.bed=bed;
  player.x=bed.x; player.y=bed.y+8; player.facing=Math.PI/2; player.kvx=player.kvy=0;   // under the quilt (drawn by drawSleeper)
  return true;
}
function wakeUp(){
  const b=WAKE.bed; WAKE.on=false; WAKE.bed=null; if(!b||!AREA||AREA.id!=='h_ash_up') return;
  // out of bed on the side that faces the room, facing the stairs down
  const r=player.r||14, spots=[[b.x+b.w/2+r+6,b.y+b.h*0.18],[b.x+b.w/2+r+6,b.y-b.h*0.18],[b.x,b.y+b.h/2+r+6]];
  const s=spots.find(([x,y])=>stairStandFree(AREA,x,y,r,null))||spots[0];
  player.x=s[0]; player.y=s[1]; player.kvx=player.kvy=0;
  const st=AREA.objs.find(q=>q.k==='stairs'&&q.back); player.facing=st?angTo(player.x,player.y,st.x,st.y):Math.PI/2;
  emit(b.x+b.w*0.3,b.y,10,{col:'240,228,206',glow:false,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1,zmax:4});
  SFX.play('step',0.8);
}
// Ash asleep: the top of his head on the pillow (eyes shut, horns over the pillow), the quilt pulled up to his chin and
// rising and falling over him, one claw on top, his tail hanging off the side with its little ember, and Z's.
{ const base=drawPlayer; drawPlayer=function(){ if(WAKE.on&&WAKE.bed&&AREA&&AREA.id==='h_ash_up'){ drawSleeper(WAKE.bed,G.time||0); return; } return base.apply(this,arguments); }; }
function drawSleeper(b,t){
  const g=ctx, x0=b.x-b.w/2, y0=b.y-b.h/2, w=b.w, cx=b.x+3, br=Math.sin(t*1.6), hx=cx, hy=y0+21;
  g.save(); g.lineJoin='round'; g.lineCap='round';
  // the tail, out from under the quilt and over the side of the bed, an ember at its tip
  g.strokeStyle='#4a1208'; g.lineWidth=7; g.beginPath(); g.moveTo(x0+w-8,y0+64); g.quadraticCurveTo(x0+w+10,y0+66,x0+w+9,y0+84); g.stroke();
  g.strokeStyle='#9a3420'; g.lineWidth=4.6; g.stroke();
  g.fillStyle='#b0402a'; g.beginPath(); g.moveTo(x0+w+5,y0+82); g.lineTo(x0+w+9,y0+92); g.lineTo(x0+w+13,y0+82); g.closePath(); g.fill();
  glowAt(x0+w+9,y0+92,12,'255,170,70',0.45+0.15*Math.sin(t*7));
  // head on the pillow
  for(const s of [-1,1]){ // horns, curling back over the pillow
    g.strokeStyle='#5e4a30'; g.lineWidth=4.4; g.beginPath(); g.moveTo(hx+s*4.5,hy-5); g.quadraticCurveTo(hx+s*7,hy-12,hx+s*12.5,hy-13); g.stroke();
    g.strokeStyle='#efe0bf'; g.lineWidth=2.8; g.stroke(); }
  g.fillStyle='#5e1a10'; g.beginPath(); g.ellipse(hx,hy,10.6,9.6,0,0,TAU); g.fill();
  g.fillStyle='#b0402a'; g.beginPath(); g.ellipse(hx,hy,9.4,8.4,0,0,TAU); g.fill();
  g.fillStyle='#e2694a'; g.beginPath(); g.ellipse(hx-3,hy-3,4,3,-0.4,0,TAU); g.fill();
  g.fillStyle='#c8573a'; g.beginPath(); g.ellipse(hx,hy+5,5.2,3.8,0,0,TAU); g.fill();
  g.fillStyle='#4a1208'; g.fillRect(hx-2.2,hy+4.2,1.2,1.2); g.fillRect(hx+1,hy+4.2,1.2,1.2);
  g.strokeStyle='#3a0e06'; g.lineWidth=1.3; for(const s of [-1,1]){ g.beginPath(); g.arc(hx+s*4,hy-0.5,2,0.15*Math.PI,0.85*Math.PI); g.stroke(); }
  // the quilt raised over him (the bed's own patchwork shows through): lit on the top left, in shade on the bottom
  // right, a soft shadow along its edge; it rises and falls as he breathes
  const qy=y0+60, qw=17+br*0.5, qh=24+br*0.9;
  g.save(); g.beginPath(); g.ellipse(cx,qy,qw,qh,0,0,TAU); g.clip();
  const lg=g.createLinearGradient(cx-qw,qy-qh,cx+qw*0.8,qy+qh); lg.addColorStop(0,'rgba(255,238,206,.42)'); lg.addColorStop(0.42,'rgba(255,238,206,.08)'); lg.addColorStop(0.62,'rgba(40,8,2,.06)'); lg.addColorStop(1,'rgba(40,8,2,.46)');
  g.fillStyle=lg; g.fillRect(cx-qw,qy-qh,qw*2,qh*2); g.restore();
  g.strokeStyle='rgba(40,8,2,.32)'; g.lineWidth=2.2; g.beginPath(); g.ellipse(cx+0.8,qy+0.8,qw,qh,0,-0.35*Math.PI,0.85*Math.PI); g.stroke();
  g.strokeStyle='rgba(255,236,200,.35)'; g.lineWidth=1.2; g.beginPath(); g.ellipse(cx,qy,qw-0.6,qh-0.6,0,0.95*Math.PI,1.6*Math.PI); g.stroke();
  // the hem pulled up to his chin, and one claw on top of it
  g.fillStyle='#f4eee2'; rrect(g,x0+3,y0+29,w-6,6.5,2.5); g.fill(); g.fillStyle='rgba(120,100,80,.3)'; g.fillRect(x0+4,y0+34.5,w-8,1);
  g.fillStyle='#5e1a10'; g.beginPath(); g.ellipse(hx+11,y0+33,4.4,3.4,0.3,0,TAU); g.fill(); g.fillStyle='#b0402a'; g.beginPath(); g.ellipse(hx+11,y0+32.6,3.4,2.5,0.3,0,TAU); g.fill();
  // Z's drifting up from the pillow
  for(let i=0;i<3;i++){ const k=(t*0.45+i/3)%1, a=Math.sin(k*Math.PI), sz=7+k*7, zx=hx+10+k*18+Math.sin(t*1.3+i*2)*2, zy=hy-10-k*34;
    g.globalAlpha=a; g.font=`800 ${sz.toFixed(1)}px ${UIF}`; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=3; g.strokeStyle='rgba(40,20,10,.7)'; g.strokeText('z',zx,zy); g.fillStyle='#fff4dc'; g.fillText('z',zx,zy); }
  g.restore();
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

// ================= the Arena (internal mode id 'normal'): endless waves in the Proving Grounds
function startNormal(){
  SFX.init(); newRun('normal'); const P=POI.proving;
  G.arena={x:P.x,y:P.y,r:600}; G.tod=0.74; for(const k in SHRINES) G.shrines[SHRINES[k].id]=true;
  player.x=P.x; player.y=P.y+120; updateCam(0,true); G.chunkBurst=16;
  scene='play'; hideAll(); setBanner('Arena','Survive the endless horde in the Proving Grounds',2.4); G.hintT=14;
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
