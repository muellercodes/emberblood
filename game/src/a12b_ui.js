
// ================= blessings
let upChoices=null, upCb=null;
function offerUpgrades(cb,title,sub){
  scene='upgrade'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null;
  $('#upTitle').textContent=simplify(title||'Choose a Blessing'); $('#upSub').textContent=simplify(sub||'The fire in your blood grows stronger. Pick one.');
  const pool=UPGRADES.filter(u=>!(u.once&&player.ups[u.id]));
  upChoices=shuffle(pool.slice()).slice(0,3); upCb=cb;
  const wrap=$('#cards'); wrap.innerHTML='';
  upChoices.forEach((u,i)=>{
    const b=document.createElement('button'); b.type='button'; b.className='card';
    const lv=player.ups[u.id]||0;
    b.innerHTML=`<span class="k">${i+1}</span><span class="ico" aria-hidden="true">${u.icon}</span><span class="txt"><span class="nm">${simplify(u.name)}</span><span class="ds">${simplify(u.desc)}</span>${lv?`<span class="lv">Level ${lv+1}</span>`:''}</span>`;
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
  mapSel=null; $('#bTravel').hidden=true; mapHintSet();
  MAPUI.view=curMap(); mapTabsSync(); $('#mapInfo').textContent=mapInfoText();
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
  const el=$('#jBody'), rows=[], E=t=>escapeHtml(simplify(t));
  if(jTab==='quests'){
    const o=questObjectiveWorld(), sf=!G.focus;
    rows.push(`<div class="jq${sf?' foc':''}"><div class="qt">${sf?'◆ ':''}${E(CHAPTER[G.stage]||'The story')}<small>Main story</small></div><div class="qs">${E(o?o.text:'')}</div><div class="row">${sf?'<button class="btn c sm" disabled>Following</button>':'<button class="btn c sm hot" data-f="">Follow</button>'}</div></div>`);
    const act=activeQuests(), side=act.filter(id=>!QDEFS[id].errand), err=act.filter(id=>QDEFS[id].errand);
    const card=id=>{ const d=QDEFS[id], f=G.focus===id, t=isTracked(id);
      return `<div class="jq${f?' foc':''}"><div class="qt">${f?'◆ ':''}${E(d.title.replace('Errand: ',''))}<small>${E(giverLine(d))}</small></div><div class="qs">${E(stepText(id))}</div><div class="row">${f?'<button class="btn c sm" disabled>Following</button>':`<button class="btn c sm hot" data-f="${id}">Follow</button>`}<button class="btn c sm" data-t="${id}">${t?'Hide from screen':'Show on screen'}</button></div></div>`; };
    rows.push(`<div class="jh2">Side quests (${side.length})</div>`);
    rows.push(side.length?side.map(card).join(''):'<p>Look for people with a gold <b style="color:#ffcf4a">!</b> over their heads. Some of them are inside their houses.</p>');
    if(err.length){ rows.push(`<div class="jh2">Errands (${err.length})</div>`); rows.push(err.map(card).join('')); }
    rows.push(`<p style="margin-top:8px">Up to ${TRACK_MAX} quests show on screen. The one you follow gets the gold diamond on the compass and minimap. ${usingTouch?'Tap the quest list on screen to open this journal.':padActive()?`Press ${padChip(PB.LF)} or ${padChip(PB.RT)} to switch which quest you follow. ${btnHTML('journal')} opens the journal.`:'Press T to switch which quest you follow, I to open the journal.'}</p>`);
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
  else if(jTab==='log') rows.push(logJourHtml());
  el.innerHTML=rows.join('');
  if(jTab==='hero') heroTabWire(el);
  if(jTab==='log') logJourWire(el);
  for(const b of el.querySelectorAll('button[data-f]')) b.addEventListener('click',()=>{ followQuest(b.dataset.f||null); SFX.play('ui'); renderJour(); });
  for(const b of el.querySelectorAll('button[data-t]')) b.addEventListener('click',()=>{ toggleTrack(b.dataset.t); SFX.play('ui'); renderJour(); });
}
function closeMap(silent){ if(scene!=='map') return; scene='play'; hideAll(); if(!silent) SFX.play('ui'); }
function mapXY(x,y){ const F=mapFit(MAPUI.view); return [F.ox+x*F.s,F.oy+(y-F.y0)*F.s]; }
function drawMapScreen(){
  const g=mapG, w=mapCv.width, h=mapCv.height, V=MAPUI.view, MF=mapFit(V), O=ovOf(V), FG=fogOf(V), on=o=>itemMap(o)===V;
  g.setTransform(1,0,0,1,0,0); g.fillStyle='#0e0a08'; g.fillRect(0,0,w,h);
  if(O.cv){ g.imageSmoothingEnabled=true; g.drawImage(O.cv,MF.ox,MF.oy,MF.w,MF.h); }
  const fcv=fogCanvas(V), fcg=fcv.getContext('2d'), img=fcg.createImageData(FG.w,FG.h);
  for(let i=0;i<FG.bits.length;i++){ img.data[i*4]=18; img.data[i*4+1]=13; img.data[i*4+2]=10; img.data[i*4+3]=FG.bits[i]?0:235; }
  fcg.putImageData(img,0,0); g.imageSmoothingEnabled=true; g.drawImage(fcv,MF.ox,MF.oy,FG.w*FG.cs*MF.s,FG.h*FG.cs*MF.s);
  const seen=(x,y)=>fogSeen(V,x,y);
  g.textAlign='center'; g.textBaseline='middle';
  if(V===0){ g.strokeStyle='rgba(30,26,36,.9)'; g.lineWidth=6; const [, wy]=mapXY(0,WALL_Y); g.beginPath(); g.moveTo(0,wy); g.lineTo(w,wy); g.stroke(); }
  for(const k in POI){ const p=POI[k]; if(!on(p)||!seen(p.x,p.y)) continue; const [x,y]=mapXY(p.x,p.y); g.font='700 21px Cinzel, Georgia, serif'; g.lineWidth=5; g.strokeStyle='rgba(0,0,0,.75)'; g.strokeText(p.name,x,y-22); g.fillStyle='#f2e2c4'; g.fillText(p.name,x,y-22); g.fillStyle='#e8d0a0'; g.beginPath(); g.arc(x,y,6,0,TAU); g.fill(); }
  for(const c of mapList(CAMPS,V)){ if(!seen(c.x,c.y)) continue; const cl=G.campsCleared[c.id]; if(cl!=null&&G.worldTime-cl<300) continue; const [x,y]=mapXY(c.x,c.y); g.fillStyle='#ff6a4a'; g.beginPath(); g.moveTo(x,y-9); g.lineTo(x+8,y+6); g.lineTo(x-8,y+6); g.closePath(); g.fill(); }
  for(const s of mapList(SHRINES,V)){ const found=G.shrines[s.id]; if(!found&&!seen(s.x,s.y)) continue; const [x,y]=mapXY(s.x,s.y); g.fillStyle=found?'#7fd0ff':'#6b6f7a'; g.strokeStyle=mapSel===s?'#fff':'#0a0a0a'; g.lineWidth=mapSel===s?4:2; g.beginPath(); g.arc(x,y,mapSel===s?13:9,0,TAU); g.fill(); g.stroke(); }
  for(const o of objectiveList()){ if(o.x==null||!on(o)) continue; const [x,y]=mapXY(o.x,o.y); g.save(); g.translate(x,y); g.rotate(Math.PI/4); g.fillStyle='#ffb547'; g.strokeStyle='#2a1606'; g.lineWidth=3; g.fillRect(-11,-11,22,22); g.strokeRect(-11,-11,22,22); g.restore(); }
  for(const q of questTargets()){ if(!on(q)) continue; const [x,y]=mapXY(q.x,q.y); g.save(); g.translate(x,y); g.rotate(Math.PI/4); g.fillStyle='#7fe0ff'; g.strokeStyle='#08303a'; g.lineWidth=3; g.fillRect(-8,-8,16,16); g.strokeRect(-8,-8,16,16); g.restore(); }
  const jm=!!G.items.juniper_map;
  for(const m of mapList(CAVEMOUTHS,V)){ if(!jm&&!seen(m.x,m.y)) continue; const [x,y]=mapXY(m.x,m.y); g.fillStyle='#120c08'; g.strokeStyle='#e8d0a0'; g.lineWidth=2.5; g.beginPath(); g.arc(x,y,10,Math.PI,TAU); g.lineTo(x+10,y+6); g.lineTo(x-10,y+6); g.closePath(); g.fill(); g.stroke(); if(G.found['seen_'+m.area]||jm){ g.font='600 15px Rubik, system-ui, sans-serif'; g.lineWidth=4; g.strokeStyle='rgba(0,0,0,.75)'; g.strokeText(m.name,x,y+22); g.fillStyle='#e8d8c0'; g.fillText(m.name,x,y+22); } }
  for(const o of mapList(LANDMARKS,V)){ if(o.k==='pot'||o.k==='crossing'||o.k==='barrel'||o.k==='fishspot'||o.k==='sign'||o.k==='frostberry'||o.k==='beehive'||(o.hidden&&o.hidden())) continue; if(!jm&&!seen(o.x,o.y)) continue; const [x,y]=mapXY(o.x,o.y); g.fillStyle=o.k==='xmark'?'#ff5a3a':'#d8c8f0'; g.beginPath(); g.arc(x,y,o.k==='xmark'?7:4.5,0,TAU); g.fill(); }
  for(const c of crossingsOn(V)){ if((c.hidden&&c.hidden())||!seen(c.x,c.y)) continue; const [x,y]=mapXY(c.x,c.y); g.fillStyle='#ffd27a'; g.strokeStyle='#2a1606'; g.lineWidth=2.5; g.beginPath(); g.moveTo(x-8,y-6); g.lineTo(x+6,y-6); g.lineTo(x+11,y-1); g.lineTo(x+6,y+4); g.lineTo(x-8,y+4); g.closePath(); g.fill(); g.stroke(); g.font='600 15px Rubik, system-ui, sans-serif'; g.lineWidth=4; g.strokeStyle='rgba(0,0,0,.75)'; const nm=simplify(c.name||c.label||''); g.strokeText(nm,x,y+20); g.fillStyle='#ffe2a8'; g.fillText(nm,x,y+20); }
  if(G.flags.chart) for(const o of mapList(ORES,V)){ if(G.ores[o.id]) continue; const [x,y]=mapXY(o.x,o.y); g.fillStyle='#7ab8ff'; g.beginPath(); g.moveTo(x,y-9); g.lineTo(x+7,y); g.lineTo(x,y+9); g.lineTo(x-7,y); g.closePath(); g.fill(); }
  for(const id in WARDS){ if(!on(WARDS[id])||!seen(WARDS[id].x,WARDS[id].y)) continue; const [x,y]=mapXY(WARDS[id].x,WARDS[id].y); g.fillStyle=G.wards[id]?'#ffcf6a':'#7a8aa8'; g.strokeStyle='#1a1008'; g.lineWidth=2; g.beginPath(); for(let i=0;i<6;i++){ const a=i/6*TAU+Math.PI/6; i?g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9):g.moveTo(x+Math.cos(a)*9,y+Math.sin(a)*9); } g.closePath(); g.fill(); g.stroke(); }
  const pp=AREA&&G.ow?G.ow:player; if(curMap()===V){ const [px,py]=mapXY(pp.x,pp.y); g.save(); g.translate(px,py); g.rotate(player.facing); g.fillStyle='#ffd27a'; g.strokeStyle='#2a1606'; g.lineWidth=3; g.beginPath(); g.moveTo(17,0); g.lineTo(-11,-11); g.lineTo(-5,0); g.lineTo(-11,11); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  g.font='600 20px Rubik, system-ui, sans-serif'; g.fillStyle='rgba(240,225,200,.7)'; g.textAlign='left'; g.fillText('N ↑',16,22);
}
mapCv.addEventListener('click',e=>{
  if(scene!=='map') return;
  const r=mapCv.getBoundingClientRect(), [x,y]=mapInv((e.clientX-r.left)/r.width*mapCv.width,(e.clientY-r.top)/r.height*mapCv.height);
  let best=null,bd=420*420; for(const s of mapList(SHRINES,MAPUI.view)){ if(!G.shrines[s.id]) continue; const d=dist2(x,y,s.x,s.y); if(d<bd){bd=d;best=s;} }
  mapSelect(best);
});
function mapHintSet(){ const h=$('#mapHint'); if(padActive()) h.innerHTML=`Press ${padChip(PB.L1)} or ${padChip(PB.R1)} to pick a shrine you have found, then travel there.`; else h.textContent='Tap a blue shrine you have found to fast travel there.'; }
function mapSelect(best){
  mapSel=best; const bt=$('#bTravel');
  if(best){ if(G.inCombat||(G.boss&&!G.boss.dead)){ bt.hidden=true; $('#mapHint').textContent='You can’t fast travel while enemies are close.'; } else { bt.hidden=false; bt.textContent=`Travel to ${best.name}`; $('#mapHint').textContent=best.name; } }
  else{ bt.hidden=true; mapHintSet(); }
  drawMapScreen();
}
// controller and keyboard ([ and ]): step through the shrines you have found, west to east
function mapCycle(d){
  if(scene!=='map') return;
  const list=mapList(SHRINES,MAPUI.view).filter(s=>G.shrines[s.id]).sort((a,b)=>a.x-b.x); if(!list.length) return;
  let i=list.indexOf(mapSel);
  if(i<0){ const pp=AREA&&G.ow?G.ow:player; let bd=1e18; list.forEach((s,k)=>{ const q=dist2(s.x,s.y,pp.x,pp.y); if(q<bd){ bd=q; i=k; } }); }
  else i=(i+d+list.length)%list.length;
  mapSelect(list[i]); SFX.play('ui');
  const bt=$('#bTravel'); if(!bt.hidden) navFocus(bt);
}
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
  $('#diffNote').textContent=simplify(DIFFS[diffIdx].note);
  const best=store.get('eb_best_'+diffIdx,null);
  $('#bestLine').textContent=best&&best.score?simplify(`Arena best on ${DIFFS[diffIdx].name}: wave ${best.wave}, ${fmt(best.score)} points`):'';
  refreshSoundLabels(); acctLabel();
}
function toMenu(){
  if(G&&G.mode==='story'&&!player.dead) saveGame(true);
  SFX.setFire(false); SFX.ambient({}); DLG=null; setupMenuScene(); scene='menu'; show('menu'); refreshMenu();
}
let howFrom='menu', howTab='keys', howKind=null;
// How to Play opens on the page for the device in use: Keyboard, Touch or Controller
function openHow(from){
  let coarse=false; try{ coarse=matchMedia('(pointer: coarse)').matches; }catch(e){}
  howFrom=from; howTab=padActive()?'pad':(usingTouch||PAD.dev==='touch'||(coarse&&PAD.dev!=='kb'))?'touch':'keys'; howKind=null; howTabs(); show('how'); renderHow();
}
function closeHow(){ show(howFrom==='pause'?'pause':'menu'); }
function howTabs(){
  for(const b of document.querySelectorAll('#howTabs button')){ const on=b.dataset.h===howTab; b.setAttribute('aria-pressed',String(on)); if(on) b.setAttribute('data-focus',''); else b.removeAttribute('data-focus'); }
  for(const s of document.querySelectorAll('#how .hsec')) s.hidden=s.dataset.h!==howTab;
}
function renderHow(){
  howTabs(); if(typeof handSync==='function') handSync();
  const hb=$('#how .hbody'); if(hb) hb.scrollTop=0;
  if(howTab!=='pad') return;
  const k=howKind||(PAD.idx>=0?PAD.kind:'xbox');
  for(const b of document.querySelectorAll('#howPadKind button')) b.setAttribute('aria-pressed',String(b.dataset.k===k));
  $('#howPadName').innerHTML=PAD.idx>=0?`<b>${escapeHtml(padName(PAD.id))}</b> found. Here is what every button does.`:'No controller yet. Plug one in or pair it, then press any button. PlayStation, Xbox and Nintendo Switch Pro controllers all work.';
  const cv=$('#howPadCv'); if(cv&&vis(cv)) drawPadDiagram(cv,k);
  $('#howPadKeys').innerHTML=padHelpRows(k).map(([c,t])=>`<div class="pk">${c}</div><span>${t}</span>`).join('');
}
for(const b of document.querySelectorAll('#howTabs button')) b.addEventListener('click',()=>{ howTab=b.dataset.h; SFX.play('ui'); renderHow(); });
for(const b of document.querySelectorAll('#howPadKind button')) b.addEventListener('click',()=>{ howKind=b.dataset.k; SFX.play('ui'); renderHow(); });
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
// ---------- two more rows (UX build), injected like the depth row so body.html stays as it is:
// "Aim with the mouse" (off: Ash faces the way he walks) and "Characters" (3D toy figures or the classic flat art)
// (a3e_toy3d.js reads eb_chars at load; this flips it live)
function setChars(v){ v=v==='classic'?'classic':'3d'; T3.on=v==='3d'; store.set('eb_chars',v); uxSyncRows(); return v; }
function setMouseAim(on){ settings.mouseAim=!!on; store.set('eb_mouseaim',settings.mouseAim); if(!on&&player) player.faceGoal=player.facing; uxSyncRows(); return settings.mouseAim; }
function uxSyncRows(){
  for(const b of document.querySelectorAll('#setChars button')) b.setAttribute('aria-pressed',String(b.dataset.v===(T3.on?'3d':'classic')));
  for(const b of document.querySelectorAll('#setAim button')) b.setAttribute('aria-pressed',String(b.dataset.v===(settings.mouseAim?'on':'off')));
}
(function uxRows(){
  try{
    const panel=document.querySelector('#settings .panel'); if(!panel||$('#setChars')) return;
    const mk=(html)=>{ const r=document.createElement('div'); r.className='setrow'; r.innerHTML=html; return r; };
    const aim=mk('<span>Aim with the mouse<small>Off: Ash faces where he walks, and attacks find the foe in front. On: he faces the pointer.</small></span><div class="seg" id="setAim" role="group" aria-label="Aim with the mouse"><button type="button" data-v="on" aria-pressed="false">On</button><button type="button" data-v="off" aria-pressed="false">Off</button></div>');
    const chars=mk('<span>Characters<small>3D toy figures that turn to face every way, or the classic flat look.</small></span><div class="seg" id="setChars" role="group" aria-label="Characters"><button type="button" data-v="3d" aria-pressed="false">3D</button><button type="button" data-v="classic" aria-pressed="false">Classic</button></div>');
    // the aim row sits under Damage numbers; Characters goes just above the 3D depth row (or the end of the list)
    const nums=$('#setNums'), nr=nums&&nums.closest('.setrow');
    if(nr) nr.after(aim); else panel.prepend(aim);
    const dep=$('#setDepth'), dr=dep&&dep.closest('.setrow'), done=$('#bSettingsClose'); let ref=dr||done; while(ref&&ref.parentElement!==panel) ref=ref.parentElement;
    if(ref) panel.insertBefore(chars,ref); else panel.appendChild(chars);
    for(const b of aim.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); setMouseAim(b.dataset.v==='on'); SFX.play('ui'); });
    for(const b of chars.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); setChars(b.dataset.v); SFX.play('ui'); });
    uxSyncRows();
  }catch(e){}
})();
// ---------- "Handed" and "Tips" (controls build), injected the same way
// Handed: Left mirrors the touch buttons (the one-hand layout follows the hand), shows the left-handed keys and makes
// controllers southpaw. Tips: Off hides the how-to tips and the first-play help; switching them back on brings back
// any that were closed with their X.
function setHand(v){
  v=v==='left'?'left':'right'; settings.hand=v; store.set('eb_hand',v);
  if(settings.touch&&settings.touch!=='two'&&settings.touch!==v) applySetting('setTouch',v);
  handSync(); try{ padRenderSettings(); }catch(e){}
  return v;
}
function setTips(on){ const was=settings.tips; settings.tips=!!on; store.set('eb_tips',settings.tips); if(on&&!was) tipsReset(); handSync(); return settings.tips; }
function handSync(){
  for(const b of document.querySelectorAll('#setHand button,#howHand button')) b.setAttribute('aria-pressed',String(b.dataset.v===settings.hand));
  for(const b of document.querySelectorAll('#setTips button')) b.setAttribute('aria-pressed',String(b.dataset.v===(settings.tips?'on':'off')));
  const one=$('#setTouchOne'); if(one){ one.dataset.v=settings.touch&&settings.touch!=='two'?settings.touch:settings.hand; one.setAttribute('aria-pressed',String(settings.touch===one.dataset.v)); }
  for(const el of document.querySelectorAll('#how [data-hand]')) el.hidden=el.dataset.hand!==settings.hand;
}
(function handRows(){
  try{
    const panel=document.querySelector('#settings .panel'); if(!panel||$('#setHand')) return;
    const mk=(html)=>{ const r=document.createElement('div'); r.className='setrow'; r.innerHTML=html; return r; };
    const hand=mk('<span>Handed<small>Left: the touch buttons go under your left thumb, the keyboard uses the arrow keys with the mouse in your left hand, and controllers swap the sticks (southpaw).</small></span><div class="seg" id="setHand" role="group" aria-label="Handed"><button type="button" data-v="right" aria-pressed="false">Right</button><button type="button" data-v="left" aria-pressed="false">Left</button></div>');
    const tips=mk('<span>Tips<small>How-to tips and the first-play help. Each one has an X to close it. Turning tips back on brings back the ones you closed.</small></span><div class="seg" id="setTips" role="group" aria-label="Tips"><button type="button" data-v="on" aria-pressed="false">On</button><button type="button" data-v="off" aria-pressed="false">Off</button></div>');
    const tr=$('#setTouch')&&$('#setTouch').closest('.setrow'); if(tr) tr.before(hand); else panel.appendChild(hand);
    const ar=($('#setAim')||$('#setNums')); const arr=ar&&ar.closest('.setrow'); if(arr) arr.after(tips); else hand.before(tips);
    for(const b of hand.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); setHand(b.dataset.v); SFX.play('ui'); });
    for(const b of tips.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); setTips(b.dataset.v==='on'); SFX.play('ui'); });
    for(const b of document.querySelectorAll('#howHand button')) b.addEventListener('click',()=>{ SFX.init(); setHand(b.dataset.v); SFX.play('ui'); });
    // the settings screen redraws its rows when it opens or a row changes: keep these in step
    for(const id of ['#bSettings','#bPauseSettings']){ const b=$(id); if(b) b.addEventListener('click',()=>handSync()); }
    for(const b of document.querySelectorAll('#setTouch button')) b.addEventListener('click',()=>handSync());
    handSync();
  }catch(e){}
})();
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
    else if(scene!=='paused'&&scene!=='map'&&scene!=='journal'&&!(scene==='log'&&LOG.from==='paused')) liteUpdate(dt);
    musicUpdate(dt); if(scene==='play') perkUpdate(dt);
    overviewStep(scene==='menu'?14:6);
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
window.__ebX=Object.assign(window.__ebX||{},{setHand,setTips,useMode:()=>useMode(),promptKind,tipsShut:()=>Object.keys(TIPS_SHUT),atkPress:()=>ATK.press,hudHits:()=>HUD_HITS.map(h=>({x:h.x,y:h.y,w:h.w,h:h.h,tipx:!!h.tipx})),hintText:()=>hintText(),setChars,setMouseAim,T3,readT,setBanner,taunt,bannerSkip,dlgNext,dlgChoose,dlgAskSkip,
  aimInfo:()=>({facing:player.facing,goal:player.faceGoal,aim:player.aim,mouseAim:settings.mouseAim,aimMode}),
  banner:()=>G.banner?{text:G.banner.text,sub:G.banner.sub,t:G.banner.t,dur:G.banner.dur,q:(G.bannerQ||[]).map(b=>b.text)}:{q:(G.bannerQ||[]).map(b=>b.text)},
  dlgState:()=>DLG?{i:DLG.i,text:DLG.text,chars:DLG.chars,opts:!!DLG.opts,skipArm:DLG.skipArm}:null,
  say:(id,t)=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); return n?!!npcBubble(n,t):false; }, view:()=>({x:cam.x,y:cam.y,zoom,W,H})});
// debug hooks from feature modules: each one adds to window.__ebX
if(window.__ebX) Object.defineProperties(window.__eb,Object.getOwnPropertyDescriptors(window.__ebX));
})();
