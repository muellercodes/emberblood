
// ================= meta systems: music direction, quest tracking, save slots, settings
Object.assign(settings,{
  touch:['two','right','left'].includes(store.get('eb_touch','two'))?store.get('eb_touch','two'):'two',
  btn:clamp(+store.get('eb_btn',1)||1,0.85,1.2),
  auto:store.get('eb_auto',null)
});
const autoAttackOn=()=>settings.auto==null?settings.touch!=='two'&&usingTouch:!!settings.auto;

// ---------- music direction
const MUSIC_BIOME=['meadow','forest','road','crags','cinder','frost','mire'];
const TOWN_KEYS={village:'village',brindle:'town',copper:'town',lodge:'town',way:'town',farm:'town'};
let mHeat=0, mCombat=false, mLast=null;
function musicMood(dt){
  if(!G||scene==='menu') return 'menu';
  if(scene==='dead'||scene==='dying') return 'dead';
  if(scene==='victory') return 'victory';
  if(DLG&&DLG.mood) return DLG.mood;
  const b=G.boss&&!G.boss.dead?G.boss:null;
  if(b) return b.type==='vorlaxis'?'final':'boss';
  if(G.mode==='normal') return 'arena';
  if(G.mini&&G.mini.music) return G.mini.music;
  let n=0;
  if(G.inCombat) for(const e of G.enemies) if(!e.dead&&e.aggro&&e.type!=='egg'&&dist2(e.x,e.y,player.x,player.y)<620*620) n++;
  mHeat=clamp(mHeat+((n>=2||(n&&mCombat))?dt:-dt*0.35),0,3);
  if(!mCombat&&mHeat>0.8) mCombat=true; else if(mCombat&&mHeat<=0) mCombat=false;
  if(mCombat) return 'combat';
  if(AREA){
    if(AREA.kind==='cave') return AREA.def.id==='deep'?'deep':(AREA.puzzleOn?'puzzle':'cave');
    const st=AREA.def.style; return st==='inn'||st==='cook'?'inn':'house';
  }
  for(const k in TOWN_KEYS){ const p=POI[k]; if(p&&dist2(player.x,player.y,p.x,p.y)<(p.r+80)**2) return isNight()?'night':TOWN_KEYS[k]; }
  if(isNight()) return 'night';
  return MUSIC_BIOME[biomeInfo(player.x,player.y,{}).b]||'meadow';
}
function musicUpdate(dt){
  let m; try{ m=musicMood(dt); }catch(e){ m=mLast; }
  if(m!==mLast){ mLast=m; try{ Music.setTheme(m); }catch(e){} }
}
// musical cue when music is on, a plain sound effect otherwise
function jingle(name,sfx){ let ok=false; try{ ok=!Music.silent&&!!SFX.ac; if(ok) Music.stinger(name); }catch(e){ ok=false; } if(!ok&&sfx) SFX.play(sfx); }

// ---------- quest tracking: up to three quests shown on screen, one "followed" by the compass
const TRACK_MAX=3;
function activeQuests(){ return Object.keys(G.quests||{}).filter(id=>!G.quests[id].done&&QDEFS[id]); }
function tracked(){ G.track=(G.track||[]).filter(id=>G.quests[id]&&!G.quests[id].done); return G.track; }
function isTracked(id){ return tracked().includes(id); }
function trackQuest(id,quiet){
  const t=tracked().filter(q=>q!==id); t.unshift(id); G.track=t.slice(0,TRACK_MAX);
  if(!quiet) setBanner('Tracking',QDEFS[id].title.replace('Errand: ',''),1.4);
}
function untrackQuest(id){ G.track=tracked().filter(q=>q!==id); if(G.focus===id) G.focus=null; }
function toggleTrack(id){ if(isTracked(id)) untrackQuest(id); else trackQuest(id,true); }
function followQuest(id){ G.focus=id||null; if(id&&!isTracked(id)) trackQuest(id,true); setBanner(id?'Following':'Following the story',id?QDEFS[id].title.replace('Errand: ',''):(questObjectiveWorld()||{}).text||'',1.6); }
function cycleFocus(){
  const list=[null].concat(tracked()); let i=list.indexOf(G.focus||null); i=(i+1)%list.length;
  followQuest(list[i]); SFX.play('ui');
}
function onQuestStarted(id){ trackQuest(id,true); jingle('quest','quest'); }
function onQuestDone(id){ untrackQuest(id); jingle('complete','upgrade'); }
// where the compass points: the followed side quest, or the story
function focusObjective(){
  const id=G.focus;
  if(id&&G.quests[id]&&!G.quests[id].done){
    const t=questTargetOf(id);
    if(t){
      if(AREA&&t.x<IZX-50){ if(AREA.exit) return {title:QDEFS[id].title,text:stepText(id)+' (leave here first)',x:AREA.exit.x,y:AREA.exit.y,side:true}; }
      return {title:QDEFS[id].title,text:stepText(id),x:t.x,y:t.y,side:true};
    }
  }
  return questObjective();
}

// ---------- save slots: three journeys, each its own save; the cloud keeps all three
const SLOT_KEYS=['eb_world3','eb_slot2','eb_slot3'];
let curSlot=clamp(store.get('eb_cur_slot',0)|0,0,2);
function slotRaw(i){ return store.get(SLOT_KEYS[i],null); }
function slotSave(i){ const s=slotRaw(i); return s&&s.v===3&&!s.deleted?s:null; }
function setSlot(i){ curSlot=clamp(i|0,0,2); store.set('eb_cur_slot',curSlot); }
function latestSlot(){ let best=-1,bt=-1; for(let i=0;i<3;i++){ const s=slotSave(i); if(s&&(s.at||0)>bt){ bt=s.at||0; best=i; } } return best; }
function deleteSlot(i){ store.set(SLOT_KEYS[i],{v:3,at:Date.now(),deleted:true}); try{ Cloud.queueSave(packSaves(),true); }catch(e){} }
// the cloud blob is the newest journey at the top level (older game versions read that), with every slot in `slots`
function packSaves(){
  const slots=[0,1,2].map(slotRaw);
  let top=null; for(const s of slots) if(s&&!s.deleted&&s.v===3&&(!top||(s.at||0)>(top.at||0))) top=s;
  const at=Math.max(0,...slots.map(s=>(s&&s.at)||0));
  return Object.assign({},top||{empty:true},{v:3,at,slots});
}
function unpackSaves(blob){
  if(!blob||blob.v!==3) return [null,null,null];
  if(Array.isArray(blob.slots)) return [0,1,2].map(i=>blob.slots[i]||null);
  return [blob.empty?null:blob,null,null];
}
function fmtPlay(t){ t=Math.floor(t||0); const h=Math.floor(t/3600), m=Math.floor(t%3600/60); return h?`${h}h ${m}m`:`${m}m`; }
function fmtAgo(at){ if(!at) return ''; const d=(Date.now()-at)/1000; if(d<90) return 'just now'; if(d<3600) return `${Math.round(d/60)} min ago`; if(d<86400) return `${Math.round(d/3600)} h ago`; const n=Math.round(d/86400); return n===1?'yesterday':`${n} days ago`; }
function slotDetail(s){
  const q=s.quests?Object.values(s.quests).filter(x=>x.done).length:0, pg=s.pages?Object.keys(s.pages).length:0;
  return {head:`${stageLabel(s)} · Level ${(s.p&&s.p.level)||1}`,
    sub:`${DIFFS[clamp(s.diff|0,0,2)].name} · ${fmtPlay(s.time)} played · ${q} quests · ${pg}/10 pages`, ago:fmtAgo(s.at)};
}
let slotConfirm=null;
function openSlots(){ slotConfirm=null; renderSlots(); show('slots'); }
function renderSlots(){
  const el=$('#slotList'); if(!el) return;
  el.innerHTML=[0,1,2].map(i=>{
    const s=slotSave(i), d=s&&slotDetail(s);
    if(slotConfirm&&slotConfirm.i===i){
      const msg=slotConfirm.kind==='delete'?`Delete Journey ${i+1}? This can't be undone.`:`Start Journey ${i+1} over? The old one will be gone.`;
      return `<div class="slot warn"><div class="sn">Journey ${i+1}</div><p class="sd">${msg}</p><div class="row"><button class="btn c sm hot" data-a="yes" data-i="${i}">${slotConfirm.kind==='delete'?'Yes, delete it':'Yes, start over'}</button><button class="btn c sm" data-a="no" data-i="${i}">Keep it</button></div></div>`;
    }
    if(!s) return `<div class="slot empty"><div class="sn">Journey ${i+1}</div><p class="sd">An empty page. A brand new story.</p><div class="row"><button class="btn c sm hot" data-a="new" data-i="${i}">Start a new journey</button></div></div>`;
    return `<div class="slot${i===latestSlot()?' cur':''}"><div class="sn">Journey ${i+1}<span>${escapeHtml(d.ago)}</span></div><p class="sh">${escapeHtml(d.head)}</p><p class="sd">${escapeHtml(d.sub)}</p><div class="row"><button class="btn c sm hot" data-a="play" data-i="${i}">Continue</button><button class="btn c sm" data-a="over" data-i="${i}">Start over</button><button class="btn c sm" data-a="del" data-i="${i}">Delete</button></div></div>`;
  }).join('');
  for(const b of el.querySelectorAll('button')) b.addEventListener('click',()=>slotAction(b.dataset.a,+b.dataset.i));
  bringSlotRow(el);   // (v12) "Bring a save from the old address" (a13_cloud.js)
}
function slotAction(a,i){
  SFX.init(); SFX.play('ui');
  if(a==='play'){ setSlot(i); startStory(true); return; }
  if(a==='new'){ setSlot(i); startStory(false); return; }
  if(a==='over'){ slotConfirm={i,kind:'over'}; renderSlots(); return; }
  if(a==='del'){ slotConfirm={i,kind:'delete'}; renderSlots(); return; }
  if(a==='no'){ slotConfirm=null; renderSlots(); return; }
  if(a==='yes'){ const k=slotConfirm&&slotConfirm.kind; slotConfirm=null; if(k==='delete'){ deleteSlot(i); renderSlots(); refreshMenu(); } else { setSlot(i); startStory(false); } }
}

// ---------- settings screen
let settingsFrom='menu';
function openSettings(from){ settingsFrom=from||'menu'; renderSettings(); show('settings'); }
function closeSettings(){ show(settingsFrom==='pause'?'pause':'menu'); if(settingsFrom==='menu') refreshMenu(); }
function renderSettings(){
  const seg=(id,val)=>{ for(const b of document.querySelectorAll(`#${id} button`)) b.setAttribute('aria-pressed',String(b.dataset.v===String(val))); };
  seg('setNums',settings.nums?'on':'off');
  seg('setChat',settings.chat==='off'?'off':'some');
  seg('setTouch',settings.touch); seg('setBtn',settings.btn<0.95?'s':settings.btn>1.05?'l':'m'); seg('setAuto',autoAttackOn()?'on':'off');
  seg('setAllBtn',settings.allBtn?'on':'off');
}
function applySetting(id,v){
  if(id==='setNums'){ settings.nums=v==='on'; store.set('eb_nums',settings.nums); }
  else if(id==='setChat'){ settings.chat=v==='off'?'off':'some'; store.set('eb_chat',settings.chat); }   // v11: Chatter (a9i_comps.js chatterOK)
  else if(id==='setTouch'){ settings.touch=v; store.set('eb_touch',v); }
  else if(id==='setBtn'){ settings.btn=v==='s'?0.88:v==='l'?1.16:1; store.set('eb_btn',settings.btn); }
  else if(id==='setAuto'){ settings.auto=v==='on'; store.set('eb_auto',settings.auto); }
  else if(id==='setAllBtn'){ settings.allBtn=v==='on'; store.set('eb_allbtn',settings.allBtn); }   // v12: Show every button (a5_input.js allBtns)
  renderSettings(); refreshSoundLabels();
}
// (v12) Settings > Show every button (the other rows are wired in a12b_ui.js)
for(const b of document.querySelectorAll('#setAllBtn button')) b.addEventListener('click',()=>{ SFX.init(); applySetting('setAllBtn',b.dataset.v); SFX.play('ui'); });
// ---------- small always-on perks from friendships
function perkUpdate(dt){
  if(!G||G.mode!=='story'||!player||player.dead) return;
  if(G.flags.perk_regen&&!G.inCombat&&player.hp<player.maxHp&&G.time-player.lastHurt>4) player.hp=Math.min(player.maxHp,player.hp+dt*1.4);
}

// simple words for quest steps and objectives (a1k_simple.js); the full text stays in the quest data
{ const _st=stepText; stepText=function(id){ return simplify(_st(id)); };
  const _qo=questObjective; questObjective=function(){ const o=_qo(); return o&&SIMPLE.on&&o.text?Object.assign({},o,{text:simplify(o.text)}):o; };
  const _fo=focusObjective; focusObjective=function(){ const o=_fo(); return o&&SIMPLE.on&&o.text?Object.assign({},o,{text:simplify(o.text)}):o; }; }
