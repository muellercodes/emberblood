
// ================= blessings
let upChoices=null, upCb=null;
function offerUpgrades(cb,title,sub){
  scene='upgrade'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null;
  $('#upTitle').textContent=title||'Choose a Blessing'; $('#upSub').textContent=sub||'The fire in your blood grows stronger. Pick one.';
  const pool=UPGRADES.filter(u=>!(u.once&&player.ups[u.id]));
  upChoices=shuffle(pool.slice()).slice(0,3); upCb=cb;
  const wrap=$('#cards'); wrap.innerHTML='';
  upChoices.forEach((u,i)=>{
    const b=document.createElement('button'); b.type='button'; b.className='card';
    const lv=player.ups[u.id]||0;
    b.innerHTML=`<span class="k">${i+1}</span><span class="ico" aria-hidden="true">${u.icon}</span><span class="txt"><span class="nm">${u.name}</span><span class="ds">${u.desc}</span>${lv?`<span class="lv">Level ${lv+1}</span>`:''}</span>`;
    b.addEventListener('click',()=>chooseUpgrade(i)); wrap.appendChild(b);
  });
  show('upgrade');
}
function chooseUpgrade(i){
  if(scene!=='upgrade'||!upChoices||!upChoices[i]) return;
  const u=upChoices[i]; u.apply(player); player.ups[u.id]=(player.ups[u.id]||0)+1;
  SFX.play('upgrade'); upChoices=null; const cb=upCb; upCb=null;
  scene='play'; hideAll(); setBanner(u.name,'Blessing gained',1.6);
  if(G.mode==='story') saveGame();
  if(cb) cb();
}

// ================= world map
let mapSel=null;
const mapCv=$('#mapcv'), mapG=mapCv.getContext('2d');
const fogCv=mkCanvas(FOG.w,FOG.h), fogG=fogCv.getContext('2d');
function openMap(){
  if(!G||G.mode!=='story'||scene!=='play') return;
  scene='map'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null;
  mapSel=null; $('#bTravel').hidden=true; $('#mapHint').textContent='Tap a blue shrine you have found to fast travel there.';
  const r=G.region||regionAt(player.x,player.y); $('#mapInfo').textContent=`${AREA?'Inside '+AREA.name:r.name} · Level ${player.level} · ${G.coins||0} coins · ${Object.keys(G.shrines).length} of ${SHRINES.length} shrines`;
  drawMapScreen(); renderJournal(); show('mapov');
}
const SO_FAR={wake:'It is Lantern Day in Emberhollow, the thousandth one. Mom has something for you at the forge.',lanterns:'Mom reforged Grandmother’s sword for you. Now the festival lanterns need lighting.',raid:'Kobolds crashed the festival. Drive them out of the village.',
  lore:'Emberhollow is safe for now. Elder Yara has something important to tell you.',hollow:'Yara told you the truth. Vorlaxis, the dragon sealed under Cinder Mountain, is your great ×13 grandfather, and only Emberblood fire can keep his Wards burning.',
  warcamp:'Warden Iska says a cult called the Scaled Oath is snuffing the Wards. Their kobolds answer to Grizzlefang.',wren:'Grizzlefang is beaten, but Vorlaxis spoke to you through the fire. Sister Wren in Brindlecross knows where the Wards are.',
  oath:'The Scaled Oath holds the Ash Ward. High Priest Morrow is trying to put it out for good.',three:'Two Wards burn again. The Crag, Sunken and Frost Wards are still out there.',
  gate:'All five Wards burn. The Obsidian Gate will open for their fire, if you can get past its guardian.',summit:'The gate is open. Your grandfather is waiting at the Throne of Cinders.',done:'Vorlaxis is quiet at last. Lantern Day will never be the same.'};
function renderJournal(){
  const el=$('#journal'); if(!el) return;
  const o=questObjective(), n=activeQuests().length;
  el.innerHTML=`<div class="jh">${escapeHtml(CHAPTER[G.stage]||'')}</div>${o?`<div class="jq">◆ ${escapeHtml(o.text)}</div>`:''}<p style="margin-top:6px">${n?`${n} side quest${n>1?'s':''} on the go. Blue diamonds on the map show where they lead.`:'No side quests yet. Look for a gold ! over people’s heads.'} Open the Journal to choose which ones to follow.</p>`;
}
// ---------- journal
let jTab='quests';
function openJournal(){
  if(!G||G.mode!=='story'||scene!=='play') return;
  scene='journal'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null; SFX.play('ui');
  renderJour(); show('jour');
}
function closeJournal(){ if(scene!=='journal') return; scene='play'; hideAll(); SFX.play('ui'); }
function giverLine(d){ const g=d.giver; if(!g) return ''; const w=personWhere(g); return `From ${personName(g)}${w?', '+w:''}`; }
function renderJour(){
  for(const b of document.querySelectorAll('#jTabs button')) b.setAttribute('aria-pressed',String(b.dataset.t===jTab));
  const el=$('#jBody'), rows=[], E=escapeHtml;
  if(jTab==='quests'){
    const o=questObjectiveWorld(), sf=!G.focus;
    rows.push(`<div class="jq${sf?' foc':''}"><div class="qt">${sf?'◆ ':''}${E(CHAPTER[G.stage]||'The story')}<small>Main story</small></div><div class="qs">${E(o?o.text:'')}</div><div class="row">${sf?'<button class="btn c sm" disabled>Following</button>':'<button class="btn c sm hot" data-f="">Follow</button>'}</div></div>`);
    const act=activeQuests(), side=act.filter(id=>!QDEFS[id].errand), err=act.filter(id=>QDEFS[id].errand);
    const card=id=>{ const d=QDEFS[id], f=G.focus===id, t=isTracked(id);
      return `<div class="jq${f?' foc':''}"><div class="qt">${f?'◆ ':''}${E(d.title.replace('Errand: ',''))}<small>${E(giverLine(d))}</small></div><div class="qs">${E(stepText(id))}</div><div class="row">${f?'<button class="btn c sm" disabled>Following</button>':`<button class="btn c sm hot" data-f="${id}">Follow</button>`}<button class="btn c sm" data-t="${id}">${t?'Hide from screen':'Show on screen'}</button></div></div>`; };
    rows.push(`<div class="jh2">Side quests (${side.length})</div>`);
    rows.push(side.length?side.map(card).join(''):'<p>Look for people with a gold <b style="color:#ffcf4a">!</b> over their heads. Some of them are inside their houses.</p>');
    if(err.length){ rows.push(`<div class="jh2">Errands (${err.length})</div>`); rows.push(err.map(card).join('')); }
    rows.push(`<p style="margin-top:8px">Up to ${TRACK_MAX} quests show on screen. The one you follow gets the gold diamond on the compass and minimap. ${usingTouch?'Tap the quest list on screen to open this journal.':'Press T to switch which quest you follow, I to open the journal.'}</p>`);
    const done=Object.keys(G.quests).filter(id=>G.quests[id].done&&QDEFS[id]);
    if(done.length) rows.push(`<div class="jh2">Done (${done.length})</div><p>${E(done.map(id=>QDEFS[id].title.replace('Errand: ','')).join(' · '))}</p>`);
  }else if(jTab==='story'){
    rows.push(`<div class="jh2">${E(CHAPTER[G.stage]||'')}</div><p>${E(SO_FAR[G.stage]||'')}</p>`);
    const c=G.choices, ch=[];
    if(c.morrow) ch.push(c.morrow==='free'?'You let High Priest Morrow go home.':'You took High Priest Morrow to the Watch House.');
    if(c.fennick) ch.push(c.fennick==='forgive'?'You forgave Fennick Wick.':'You turned Fennick Wick in to Captain Osric.');
    if(c.greymane) ch.push(c.greymane==='home'?'You sent Greymane home to his pack.':'Greymane promised to stand with you.');
    if(c.cinder) ch.push(c.cinder==='rest'?'Sir Cindervane finally rests.':'Sir Cindervane will hold the stairs for you.');
    for(const k in (G.choices.extra||{})) ch.push(G.choices.extra[k]);
    if(ch.length) rows.push(`<div class="jh2">Choices you made</div><ul>${ch.map(t=>`<li>${E(t)}</li>`).join('')}</ul>`);
    rows.push(`<div class="jh2">The Wardens’ Account</div><p>${Object.keys(G.pages).length} of 10 lost pages found.</p>`+Object.keys(G.pages).sort((a,b)=>+a.slice(1)-+b.slice(1)).map(k=>`<p><b style="color:var(--ink)">${E(PAGES[k].title)}</b><br>${E(PAGES[k].text.join(' '))}</p>`).join(''));
    const seen=store.get('eb_endings',{}), ne=Object.keys(seen).length;
    rows.push(`<div class="jh2">Endings found</div><p>${ne} of 4${ne?': '+E(Object.keys(seen).map(k=>ENDINGS[k].title).join(' · ')):''}. Different choices lead to different endings.</p>`);
  }else if(jTab==='people'){
    const met=CAST.filter(c=>!c.generic&&(G.seenTalk&&G.seenTalk['met_'+c.id]));
    rows.push(`<p>People you've met: ${met.length}. Hearts show how good friends you are. Help people, chat, and bring gifts they like.</p>`);
    rows.push('<div class="ppl">'+met.map(c=>{ const f=friendOf(c.id), h='♥'.repeat(Math.floor(f))+'♡'.repeat(5-Math.floor(f)); const T=TALK[c.id]||{}; return `<div><b>${E(c.name.replace(', your mom',''))}</b> <span class="hz">${h}</span><small>${E(TOWN_NAME[c.town]||'')}${T.bio?' · '+E(T.bio):''}</small></div>`; }).join('')+'</div>');
  }else if(jTab==='bag'){
    const inv=Object.keys(G.items).filter(k=>G.items[k]>0).map(k=>`${ITEM_NAMES[k]||k}${G.items[k]>1?' ×'+G.items[k]:''}`);
    rows.push(`<div class="jh2">Satchel</div><p>${G.coins||0} coins</p><ul>${inv.map(t=>`<li>${E(t)}</li>`).join('')||'<li>Nothing yet</li>'}</ul>`);
    const hats=Object.keys(G.hats||{}); if(hats.length) rows.push(`<div class="jh2">Hats</div><p>${E(hats.map(h=>(HATS.find(x=>x[0]===h)||[h,h])[1]).join(' · '))}${G.hat?' (wearing one)':''}</p>`);
    rows.push(`<div class="jh2">Blade</div><p>Tier ${G.tier+1}. Bring star-iron to Mom at the forge to sharpen it.</p>`);
  }else if(jTab==='secrets'){
    const S=secretTally();
    rows.push('<p>The valley is full of hidden things. Here is how many you have found.</p><ul>'+S.map(([n,a,b])=>`<li><b style="color:var(--ink)">${E(n)}</b>: ${a} of ${b}</li>`).join('')+'</ul>');
  }else if(jTab==='hero') rows.push(heroTabHtml());
  el.innerHTML=rows.join('');
  if(jTab==='hero') heroTabWire(el);
  for(const b of el.querySelectorAll('button[data-f]')) b.addEventListener('click',()=>{ followQuest(b.dataset.f||null); SFX.play('ui'); renderJour(); });
  for(const b of el.querySelectorAll('button[data-t]')) b.addEventListener('click',()=>{ toggleTrack(b.dataset.t); SFX.play('ui'); renderJour(); });
}
function closeMap(silent){ if(scene!=='map') return; scene='play'; hideAll(); if(!silent) SFX.play('ui'); }
function mapXY(x,y){ return [x/WORLD.w*mapCv.width,y/WORLD.h*mapCv.height]; }
function drawMapScreen(){
  const g=mapG, w=mapCv.width, h=mapCv.height;
  g.setTransform(1,0,0,1,0,0); g.fillStyle='#0e0a08'; g.fillRect(0,0,w,h);
  if(OV.cv){ g.imageSmoothingEnabled=true; g.drawImage(OV.cv,0,0,w,h); }
  const img=fogG.createImageData(FOG.w,FOG.h);
  for(let i=0;i<FOG.bits.length;i++){ img.data[i*4]=18; img.data[i*4+1]=13; img.data[i*4+2]=10; img.data[i*4+3]=FOG.bits[i]?0:235; }
  fogG.putImageData(img,0,0); g.imageSmoothingEnabled=true; g.drawImage(fogCv,0,0,w,h);
  const seen=(x,y)=>FOG.bits[clamp(Math.floor(y/FOG.cs),0,FOG.h-1)*FOG.w+clamp(Math.floor(x/FOG.cs),0,FOG.w-1)];
  g.textAlign='center'; g.textBaseline='middle';
  g.strokeStyle='rgba(30,26,36,.9)'; g.lineWidth=6; const [, wy]=mapXY(0,WALL_Y); g.beginPath(); g.moveTo(0,wy); g.lineTo(w,wy); g.stroke();
  for(const k in POI){ const p=POI[k]; if(!seen(p.x,p.y)) continue; const [x,y]=mapXY(p.x,p.y); g.font='700 21px Cinzel, Georgia, serif'; g.lineWidth=5; g.strokeStyle='rgba(0,0,0,.75)'; g.strokeText(p.name,x,y-22); g.fillStyle='#f2e2c4'; g.fillText(p.name,x,y-22); g.fillStyle='#e8d0a0'; g.beginPath(); g.arc(x,y,6,0,TAU); g.fill(); }
  for(const c of CAMPS){ if(!seen(c.x,c.y)) continue; const cl=G.campsCleared[c.id]; if(cl!=null&&G.worldTime-cl<300) continue; const [x,y]=mapXY(c.x,c.y); g.fillStyle='#ff6a4a'; g.beginPath(); g.moveTo(x,y-9); g.lineTo(x+8,y+6); g.lineTo(x-8,y+6); g.closePath(); g.fill(); }
  for(const s of SHRINES){ const found=G.shrines[s.id]; if(!found&&!seen(s.x,s.y)) continue; const [x,y]=mapXY(s.x,s.y); g.fillStyle=found?'#7fd0ff':'#6b6f7a'; g.strokeStyle=mapSel===s?'#fff':'#0a0a0a'; g.lineWidth=mapSel===s?4:2; g.beginPath(); g.arc(x,y,mapSel===s?13:9,0,TAU); g.fill(); g.stroke(); }
  for(const o of objectiveList()){ if(o.x==null) continue; const [x,y]=mapXY(o.x,o.y); g.save(); g.translate(x,y); g.rotate(Math.PI/4); g.fillStyle='#ffb547'; g.strokeStyle='#2a1606'; g.lineWidth=3; g.fillRect(-11,-11,22,22); g.strokeRect(-11,-11,22,22); g.restore(); }
  for(const q of questTargets()){ const [x,y]=mapXY(q.x,q.y); g.save(); g.translate(x,y); g.rotate(Math.PI/4); g.fillStyle='#7fe0ff'; g.strokeStyle='#08303a'; g.lineWidth=3; g.fillRect(-8,-8,16,16); g.strokeRect(-8,-8,16,16); g.restore(); }
  const jm=!!G.items.juniper_map;
  for(const m of CAVEMOUTHS){ if(!jm&&!seen(m.x,m.y)) continue; const [x,y]=mapXY(m.x,m.y); g.fillStyle='#120c08'; g.strokeStyle='#e8d0a0'; g.lineWidth=2.5; g.beginPath(); g.arc(x,y,10,Math.PI,TAU); g.lineTo(x+10,y+6); g.lineTo(x-10,y+6); g.closePath(); g.fill(); g.stroke(); if(G.found['seen_'+m.area]||jm){ g.font='600 15px Rubik, system-ui, sans-serif'; g.lineWidth=4; g.strokeStyle='rgba(0,0,0,.75)'; g.strokeText(m.name,x,y+22); g.fillStyle='#e8d8c0'; g.fillText(m.name,x,y+22); } }
  for(const o of LANDMARKS){ if(o.k==='pot'||o.k==='barrel'||o.k==='fishspot'||o.k==='sign'||o.k==='frostberry'||o.k==='beehive'||(o.hidden&&o.hidden())) continue; if(!jm&&!seen(o.x,o.y)) continue; const [x,y]=mapXY(o.x,o.y); g.fillStyle=o.k==='xmark'?'#ff5a3a':'#d8c8f0'; g.beginPath(); g.arc(x,y,o.k==='xmark'?7:4.5,0,TAU); g.fill(); }
  if(G.flags.chart) for(const o of ORES){ if(G.ores[o.id]) continue; const [x,y]=mapXY(o.x,o.y); g.fillStyle='#7ab8ff'; g.beginPath(); g.moveTo(x,y-9); g.lineTo(x+7,y); g.lineTo(x,y+9); g.lineTo(x-7,y); g.closePath(); g.fill(); }
  for(const id in WARDS){ if(!seen(WARDS[id].x,WARDS[id].y)) continue; const [x,y]=mapXY(WARDS[id].x,WARDS[id].y); g.fillStyle=G.wards[id]?'#ffcf6a':'#7a8aa8'; g.strokeStyle='#1a1008'; g.lineWidth=2; g.beginPath(); for(let i=0;i<6;i++){ const a=i/6*TAU+Math.PI/6; i?g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9):g.moveTo(x+Math.cos(a)*9,y+Math.sin(a)*9); } g.closePath(); g.fill(); g.stroke(); }
  const pp=AREA&&G.ow?G.ow:player; const [px,py]=mapXY(pp.x,pp.y); g.save(); g.translate(px,py); g.rotate(player.facing); g.fillStyle='#ffd27a'; g.strokeStyle='#2a1606'; g.lineWidth=3; g.beginPath(); g.moveTo(17,0); g.lineTo(-11,-11); g.lineTo(-5,0); g.lineTo(-11,11); g.closePath(); g.fill(); g.stroke(); g.restore();
  g.font='600 20px Rubik, system-ui, sans-serif'; g.fillStyle='rgba(240,225,200,.7)'; g.textAlign='left'; g.fillText('N ↑',16,22);
}
mapCv.addEventListener('click',e=>{
  if(scene!=='map') return;
  const r=mapCv.getBoundingClientRect(), x=(e.clientX-r.left)/r.width*WORLD.w, y=(e.clientY-r.top)/r.height*WORLD.h;
  let best=null,bd=420*420; for(const s of SHRINES){ if(!G.shrines[s.id]) continue; const d=dist2(x,y,s.x,s.y); if(d<bd){bd=d;best=s;} }
  mapSel=best; const bt=$('#bTravel');
  if(best){ if(G.inCombat||(G.boss&&!G.boss.dead)){ bt.hidden=true; $('#mapHint').textContent='You can’t fast travel while enemies are close.'; } else { bt.hidden=false; bt.textContent=`Travel to ${best.name}`; $('#mapHint').textContent=best.name; } }
  else{ bt.hidden=true; $('#mapHint').textContent='Tap a blue shrine you have found to fast travel there.'; }
  drawMapScreen();
});
$('#bTravel').addEventListener('click',()=>{ if(mapSel) travelTo(mapSel); });
$('#bMapClose').addEventListener('click',()=>closeMap());

// ================= menu
function setupMenuScene(){
  newRun('menu'); clearStatic(); fogInit('');
  G.tod=0.27; player.x=POI.village.x+60; player.y=POI.village.y+140; player.facing=-Math.PI/2;
  G.npcs=[{kind:'yara',x:POI.village.x+100,y:POI.village.y+90,face:Math.PI,t:0,home:[0,0]}];
  for(const L of LANTERNS) L.lit=true;
  menuCam(0,true); G.chunkBurst=6;
}
function menuCam(dt,snap){
  const tx=POI.village.x-W/zoom/2+Math.sin((G?G.time:0)*0.08)*120, ty=POI.village.y-H/zoom/2+60+Math.cos((G?G.time:0)*0.06)*60;
  if(snap){ cam.x=tx; cam.y=ty; } else { cam.x=lerp(cam.x,tx,1-Math.exp(-dt*1.5)); cam.y=lerp(cam.y,ty,1-Math.exp(-dt*1.5)); }
}
function menuUpdate(dt){
  G.time+=dt; player.t+=dt; G.chunkBurst=2;
  ambientEmit(dt); updateParticles(dt); menuCam(dt);
  if(Math.random()<dt*0.4) SFX.play('bird',0.6);
}
function refreshMenu(){
  const li=latestSlot(), s=li>=0?slotSave(li):null, cont=$('#bContinue'), sum=saveSummary(s);
  if(sum){ cont.hidden=false; $('#contSub').textContent=`Journey ${li+1} · ${sum}`; $('#bStory').classList.remove('hot'); $('#storySub').textContent='Pick a journey: three save slots.'; }
  else{ cont.hidden=true; $('#bStory').classList.add('hot'); $('#storySub').textContent='An open world to explore. One very old grandfather.'; }
  for(const b of document.querySelectorAll('.seg button[data-d]')) b.setAttribute('aria-pressed',String(+b.dataset.d===diffIdx));
  $('#diffNote').textContent=DIFFS[diffIdx].note;
  const best=store.get('eb_best_'+diffIdx,null);
  $('#bestLine').textContent=best&&best.score?`Normal Mode best on ${DIFFS[diffIdx].name}: wave ${best.wave}, ${fmt(best.score)} points`:'';
  refreshSoundLabels(); acctLabel();
}
function toMenu(){
  if(G&&G.mode==='story'&&!player.dead) saveGame(true);
  SFX.setFire(false); SFX.ambient({}); DLG=null; setupMenuScene(); scene='menu'; show('menu'); refreshMenu();
}
let howFrom='menu';
function openHow(from){ howFrom=from; show('how'); }
function closeHow(){ show(howFrom==='pause'?'pause':'menu'); }
$('#bStory').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); openSlots(); });
let newArmed=0;
function confirmNew(){ if(Date.now()-newArmed<4000) return true; newArmed=Date.now(); $('#bStory').firstChild.textContent='Tap again to start over'; setTimeout(()=>{ if(scene==='menu') refreshMenu(); },4000); return false; }
$('#bAcct').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); openAcct(); });
$('#bContinue').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); const li=latestSlot(); if(li<0){ openSlots(); return; } setSlot(li); startStory(true); });
$('#bNormal').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); startNormal(); });
for(const b of document.querySelectorAll('.seg button[data-d]')) b.addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); diffIdx=+b.dataset.d; store.set('eb_diff',diffIdx); refreshMenu(); });
$('#bHow').addEventListener('click',()=>{ SFX.init(); openHow('menu'); });
$('#bHowClose').addEventListener('click',closeHow);
$('#bSettings').addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); openSettings('menu'); });
$('#bPauseSettings').addEventListener('click',()=>{ SFX.play('ui'); openSettings('pause'); });
$('#bSettingsClose').addEventListener('click',()=>{ SFX.play('ui'); closeSettings(); });
for(const id of ['setSfx','setMusic','setNums','setTouch','setBtn','setAuto']) for(const b of document.querySelectorAll(`#${id} button`)) b.addEventListener('click',()=>{ SFX.init(); applySetting(id,b.dataset.v); SFX.play('ui'); });
$('#bSlotsClose').addEventListener('click',()=>{ SFX.play('ui'); show('menu'); refreshMenu(); });
$('#bPauseJournal').addEventListener('click',()=>{ scene='play'; hideAll(); openJournal(); });
$('#bMapJournal').addEventListener('click',()=>{ closeMap(true); openJournal(); });
$('#bJourClose').addEventListener('click',()=>closeJournal());
for(const b of document.querySelectorAll('#jTabs button')) b.addEventListener('click',()=>{ jTab=b.dataset.t; SFX.play('ui'); renderJour(); });
$('#bPauseHow').addEventListener('click',()=>openHow('pause'));
$('#bPauseMap').addEventListener('click',()=>{ scene='play'; hideAll(); openMap(); });
$('#bResume').addEventListener('click',resumeGame);
$('#bRestart').addEventListener('click',()=>startNormal());
$('#bQuit').addEventListener('click',toMenu);
$('#bRetry').addEventListener('click',()=>{ SFX.play('ui'); if(G.mode==='story') respawn(); else startNormal(); });
$('#bDeadMenu').addEventListener('click',()=>{ if(G.mode==='story'){ respawn(); } toMenu(); });
$('#bWinExplore').addEventListener('click',()=>{ scene='play'; hideAll(); setBanner('Free roam','The valley is yours to explore.',2.4); });
$('#bWinMenu').addEventListener('click',toMenu);

// ================= loop
function resize(){
  DPR=Math.min(window.devicePixelRatio||1,2); W=Math.max(320,window.innerWidth); H=Math.max(320,window.innerHeight);
  cvs.width=Math.round(W*DPR); cvs.height=Math.round(H*DPR);
  lightCvs.width=Math.ceil(W/2); lightCvs.height=Math.ceil(H/2);
  zoom=clamp(Math.min(W/900,H/620),0.6,1.3); ZOOM0=zoom; readSafe(); vigKey='';
  if(G&&player){ if(scene==='menu') menuCam(0,true); else updateCam(0,true); }
  if(scene==='map') drawMapScreen();
}
addEventListener('resize',resize);
let last=performance.now();
function frame(now){
  let dt=(now-last)/1000; last=now; if(!(dt>0)) dt=0; dt=Math.min(dt,0.05);
  shakeMag=Math.max(0,shakeMag-dt*30); flashA=Math.max(0,flashA-dt*1.6);
  try{
    padPoll(dt);
    if(scene==='menu') menuUpdate(dt);
    else if(scene==='play'){ updateTimers(dt); if(scene==='play'){ if(G.slowT>0){ G.slowT-=dt; if(G.slowT<=0) G.timeScale=1; } update(dt*G.timeScale); } }
    else if(scene==='dying'){ dyingT-=dt; liteUpdate(dt); if(dyingT<=0) showDeath(); }
    else if(scene==='dialogue'){ updateDialogue(dt); liteUpdate(dt); }
    else if(scene!=='paused'&&scene!=='map'&&scene!=='journal') liteUpdate(dt);
    musicUpdate(dt); if(scene==='play') perkUpdate(dt);
    if(!OV.done) overviewStep(scene==='menu'?14:6);
    render();
  }catch(err){ console.error(err); }
  pressed.clear(); touch.pressed={};
  requestAnimationFrame(frame);
}
initWorld(); buildSprites(); fogInit('');
resize(); setupMenuScene(); refreshMenu();
Cloud.check().then(ok=>{ if(ok&&Cloud.signedIn) syncSaves(); acctLabel(); });
requestAnimationFrame(t=>{ last=t; frame(t); });
window.__eb={god:false,get G(){return G;},get player(){return player;},get scene(){return scene;},
  startStory,startNormal,newStory(i){ setSlot(i||0); startStory(false); },openSlots,openJournal,closeJournal,openSettings,cycleFocus,followQuest,tracked,slotSave,latestSlot,talkHub,befriend,friendOf,secretTally,get Music(){return Music;},CAVEMAP,MINI,startMini,miniEnd,get mini(){return G.mini;},solveRoom,FLOORS,SECRET_ROOMS,goFloor,floorObjAct,AREADEFS,refreshCaveGates,caveRoomAt,hitCrystal,breakCrack,caveObjAct,resetBlocks,skipDialogue,advanceDialogue,drawPortrait,chooseUpgrade,toMenu,openMap,closeMap,
  tp(x,y){ player.x=x; player.y=y; updateCam(0,true); G.chunkBurst=16; },
  setStage(st){ G.stage=st; if(stageAt(st)>=stageAt('lanterns')) G.flags.forge=true; if(stageAt(st)>stageAt('raid')) for(const L of LANTERNS) L.lit=true; if(stageAt(st)>=stageAt('summit')){ G.flags.gate=true; GATE_COL.off=true; } setupNPCs(); },
  lightWard, wardReady(id){ G.wardReady[id]=true; }, enterArea:(id)=>{ const d=DOORS.find(q=>q.area===id); enterArea(id,d||{x:player.x,y:player.y}); }, exitArea, get AREA(){return AREA;}, DOORS, CAVEMOUTHS, LANDMARKS, QDEFS, CAST, startQuest, giveItems, npcMarker, talkTo, findPage, questPoke, lmAct, areaObjAct,
  bossWin(k){ G.fightSite=k; storyBossDone(); }, breath(n){ for(let i=0;i<(n||60);i++) breathIgnite(player.x+Math.cos(player.facing)*20,player.y+Math.sin(player.facing)*20,player.facing,1/30); }, finalChoice, setupNPCs, saveGame,
  killQuest(){ for(const e of G.enemies) if(!e.dead&&e.questTag) killEnemy(e); },
  killBoss(){ if(G.boss&&!G.boss.dead) killEnemy(G.boss); },
  hurtBoss(f){ if(G.boss&&!G.boss.dead){ G.boss.hp=G.boss.maxHp*f; } },
  face(a){ player.facing=a; }, WARDS, POI, LANTERNS, NPCSPOT, SITES, LILIES, ORES, bossDone(b){ G.bossDone[b]=true; }, Cloud, syncSaves, objectiveList,
  travel(id){ const s=SHRINES.find(z=>z.id===id); G.shrines[id]=true; scene='map'; travelTo(s); },
  setTime(t){ G.tod=t; }, rain(on){ G.weather.type=on?'rain':'clear'; G.weather.t=999; G.rainK=on?1:0; }};
// debug hooks from feature modules: each one adds to window.__ebX
if(window.__ebX) Object.defineProperties(window.__eb,Object.getOwnPropertyDescriptors(window.__ebX));
})();
