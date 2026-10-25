
// ================= the admin's test kit (v12 CHEAT2): cheats for the MuellerCodes account only, on every device
// WHO: the Cheats section is in Settings only while the signed-in account is an admin as the server says (Cloud.admin,
// a13_cloud.js: GET /api/admin/me with the account's token, held in memory only, asked on load and sign-in and again
// when Settings opens with an answer older than a few minutes). Signed out, any other account, a "View as" session, or
// offline with no fresh answer: no section, no hint it exists, and every switch goes off. Nothing else turns a cheat on
// (window.__ebDbg below is read-only state for tests). window.__eb.god stays the test drivers' own hook: an Arena run
// where it was ever on counts as cheated, so it never posts a score.
// WHERE: the section is built here at the bottom of Settings, above Done, from the same rows, On/Off toggles and buttons
// as the rest of Settings, so mouse, touch, keys and a controller (a5b_pad.js) all reach it. Groups open and close
// (closed at first, so a phone is not a wall of switches). The "Cheats on" chip hangs from the top left edge, above
// the HUD panels, while any switch is on; a tap or click opens Settings at the Cheats.
// RULES: switches last for this session and never go in the save (a reload turns them all off). The buttons marked
// Real change the journey for good and save it; the story ones ask first and offer to copy the journey to an empty
// slot. Any cheat marks the run (G.cheated, in memory): the Arena posts no score for it (a9b_flow.js showDeath,
// a13_cloud.js startRun and submitScore). A real change also marks the journey's save (cheated:true).
// build.mjs loads this just before a12b_ui (ORDER). It wraps the game's functions only once everything has loaded
// (chInit, a microtask after the script, after the story data has booted), so it sits outside every other wrapper.
const CH_STRONG=10, CH_FAST=1.6;
// the switches: id -> [group, label, note]
const CH_SW={
  god:['surv','God mode','Ash takes no damage and cannot fall: foes, bosses, lava, water, pits and traps.'],
  endless:['surv','Endless flasks, stamina and fire','Drinking never uses up a flask. Stamina and fire breath stay full.'],
  strong:['surv','Strong hits','Ash hits ten times as hard. Bosses still stop at every phase, so each scene plays.'],
  onehit:['surv','One-hit kills','Any hit that lands fells an ordinary foe at once. Bosses, guardians and the trial champions are not ordinary.'],
  fast:['move','Fast feet','Ash moves about 1.6 times as fast.'],
  wings:['move','Wings anywhere','Ash can fly before he has earned his wings (the same no-fly rules for caves and boss fights). Off: he lands.'],
  noclip:['move','Walk through walls','Through walls, rock and water, but never off the edge of a map or out of a room. Off: he lands on the nearest open ground.'],
  tp:['move','Map teleport','Click or tap a spot on the big map (M) to go there. Never in a boss fight or past a gate the story has not opened.'],
  peace:['world','Peaceful foes','Foes do not notice or attack Ash. Bosses still fight.'],
  freeze:['world','Freeze time of day','The clock stops where it is. Set it with the buttons below.'],
  rooms:['world','Show every room','Caves and dungeons: every room is lit, not only the one Ash is in. Foes there stay asleep.'],
  reveal:['world','Reveal the map','The big map shows everything, with no fog. Nothing is marked as found.'],
  gates:['world','Open shut gates and doors','Story gates, locked doors and cave doors let Ash through. Trials stay sealed until the story opens them.'],
  boxes:['world','Show hit boxes and sight','Draws bodies, hit circles, shots, walls near Ash, how far foes notice him, and their line of sight to him.'],
  fps:['world','Show FPS','Frames per second, in the Cheats on chip.']
};
const CH_GROUPS=[['surv','Survival'],['move','Moving'],['world','World'],['story','Story'],['gear','Gear'],['arena','Arena']];
const CH_TOD=[['Morning',0.3],['Noon',0.5],['Evening',0.74],['Night',0.92]];
const CH_FOGMAPS=[4];
const CHT={on:{},open:{},chip:null,ready:false,rawGod:false,arenaTaint:false,nc:false,gp:false,gpc:false,tmpFound:new Set(),gFound:new Set(),
  fps:{n:0,t:0,v:0},goMap:null,jumpAct:null,wave:5,conf:null,copied:-1,boost:null,hitE:null,floor:null,tpMsgT:0,fogReal:null};
for(const k in CH_SW) CHT.on[k]=false;
try{ const o=store.get('eb_cheat_open',null); if(o&&typeof o==='object') for(const [g] of CH_GROUPS) CHT.open[g]=!!o[g]; }catch(e){}

// ---------- who: the admin, as the server says
const chAdmin=()=>!!(typeof Cloud!=='undefined'&&Cloud&&Cloud.admin);
const chOn=k=>!!CHT.on[k]&&chAdmin();
function chAnyRaw(){ for(const k in CHT.on) if(CHT.on[k]) return true; return false; }
// any switch on (the chip, Cloud.startRun asks this too)
function chAny(){ return chAnyRaw()&&chAdmin(); }
function chInGame(){ return !!(G&&player&&(G.mode==='story'||G.mode==='normal')&&scene!=='menu'); }
function chStory(){ return chInGame()&&G.mode==='story'; }
// the run used a cheat (memory only: the Arena posts nothing); a real change also marks the journey's save
function chTaint(){ if(G&&player&&(G.mode==='story'||G.mode==='normal')) G.cheated=true; }
function chMarkSave(){ if(G&&G.mode==='story'){ G.cheated=true; G.cheatSaved=true; } }
function chFill(p){ if(!p) return; p.stamina=p.maxStamina; p.stamDelay=0; p.energy=p.maxEnergy; p.exhausted=false; p.regenDelay=0; }
function chAllOff(){ let any=false; for(const k in CHT.on){ if(!CHT.on[k]) continue; any=true; CHT.on[k]=false; try{ chOff(k); }catch(e){ console.error(e); } } if(any){ chSync(); chChip(); } return any; }
// the section goes and every switch turns off the moment the account is not a confirmed admin
function chAdminSync(){
  if(!chAdmin()){ chAllOff(); const s=document.getElementById('cheatSec'); if(s) s.remove(); CHT.conf=null; return false; }
  if(chSettingsOpen()){ chBuild(); chSync(); }
  return true;
}
function chSettingsOpen(){ const o=document.getElementById('settings'); return !!(o&&o.classList.contains('on')); }
function chSet(k,on){
  if(!(k in CHT.on)) return false;
  if(!chAdmin()){ chAdminSync(); return false; }
  on=!!on; if(CHT.on[k]===on){ chSync(); return on; }
  CHT.on[k]=on;
  try{ if(on){ chTaint(); chOnSw(k); } else chOff(k); }catch(e){ console.error(e); }
  chSync(); chChip(); return on;
}
function chOnSw(k){
  if(k==='gates'){ chGates(true); if(AREA) try{ refreshCaveGates(); }catch(e){} }
  if(k==='reveal'&&scene==='map') try{ drawMapScreen(); }catch(e){}
}
// switching off puts things back the way they were (the speed boost, the wing checks and the gate pass live only in calls)
function chOff(k){
  if(k==='gates'){ chGates(false); if(AREA) try{ refreshCaveGates(); }catch(e){} }
  if(k==='reveal'&&scene==='map') try{ drawMapScreen(); }catch(e){}
  if(!G||!player||G.mode==='menu') return;
  if(k==='wings'&&!hasAbil('wings')&&player.flying&&!player.landing&&!player.gliding) player.landing=true;
  if(k==='noclip') chDropSafe();
  if(k==='noclip'||k==='gates'||k==='wings') chOutOfNook();
}
// Walk through walls off: Ash lands on the nearest open ground
function chDropSafe(){
  const p=player; if(!p||p.flying||p.dead) return false;
  let ok=true; try{ ok=landOK(p.x,p.y)&&!playerBlocked(p.x,p.y); }catch(e){}
  if(!ok){ const s=nearestLand(p.x,p.y); if(!s) return false; p.x=s.x; p.y=s.y; p.z=0; p.vz=0; p.kvx=p.kvy=0; updateCam(0,true); G.chunkBurst=16; }
  p.safeX=p.x; p.safeY=p.y;   // (the safe spot he walked through walls with may be inside one)
  return !ok;
}
// a gate's nook reached without its power (cheat wings, walking through walls, open gates): back out of its door, so the
// story never counts the gate as passed
function chOutOfNook(){
  if(!G||G.mode!=='story'||AREA||!player||typeof GT==='undefined'||!GT.list) return false;
  const p=player, k=curMap();
  for(const g of GT.list){
    if(g.map!=null&&g.map!==k) continue; if(gtSt(g.id)>=1) continue;
    try{ if(g.K&&g.K.power&&gtHas(g.K.power)) continue; if(!gtIsIn(g,p.x,p.y)) continue; }catch(e){ continue; }
    let d={x:g.x,y:g.y}; try{ const I=gateInfo(g.id); if(I&&I.door) d=I.door; }catch(e){}
    const u=GT_FACE[g.face]||[0,1]; let s=null;
    for(const r of [90,160,240,340]){ const q=nearestLand(d.x+u[0]*r,d.y+u[1]*r); if(q&&!gtIsIn(g,q.x,q.y)){ s=q; break; } }
    if(!s) continue;
    p.x=s.x; p.y=s.y; p.flying=false; p.landing=false; p.gliding=false; p.z=0; p.vz=0; p.kvx=p.kvy=0; updateCam(0,true); G.chunkBurst=16;
    setBanner('Back outside','That gate is still shut for Ash.',1.8);
    return true;
  }
  return false;
}

// ---------- Open shut gates and doors (for the session): gates look open and let Ash through; nothing is saved
// The gate library's gates (e10c_gates) get their open look from their own sync, and a ramp where the open state has one;
// their colliders, zones, fly walls and water let Ash pass only inside his own move. Every G.found key the open look
// writes is kept out of the save (saveData below) and goes again when the switch goes off (the real sync).
const chGateCols=()=>[typeof GATE_COL!=='undefined'?GATE_COL:null,typeof VOR!=='undefined'&&VOR?VOR.gateCol:null,typeof F2WD!=='undefined'&&F2WD?F2WD.ngateCol:null].filter(Boolean);
function chPatchCol(c){
  if(!c||c._chP) return; c._chP=true;
  const d=Object.getOwnPropertyDescriptor(c,'off'), get=d&&d.get, set=d&&d.set; let v=!!(d&&!d.get&&d.value);
  try{ Object.defineProperty(c,'off',{configurable:true,enumerable:true,get(){ return CHT.gpc||(get?get.call(c):v); },set(x){ if(set) set.call(c,x); else v=!!x; }}); }catch(e){}
}
// the colliders a gate is made of: its own parts, its door's and its fences' (gtCol, gtColWrap)
function chGateColsOf(g){ const L=[]; for(const c of g.parts||[]) if(c&&typeof c==='object'&&c.t) L.push(c); if(g.doorObj&&g.doorObj.col) L.push(g.doorObj.col); if(g.fences) for(const k in g.fences){ const o=g.fences[k]; if(o&&o.col) L.push(o.col); } return L; }
function chGateOpenLook(g){
  if(!g||gtSt(g.id)>=2) return;
  for(const c of chGateColsOf(g)) chPatchCol(c);
  try{ if(g.D&&g.D.sync) g.D.sync(g,2); if(g.custom&&g.D&&g.D.sync!==gtPlainSync) gtRampSync(g,2); }catch(e){ console.error('[cheats] gate '+g.id,e); }
  for(const c of chGateColsOf(g)) chPatchCol(c);
  g._chOpen=true;
}
function chGates(on){
  if(typeof GT==='undefined'||!GT.list||!G) return;
  if(on){
    if(G.mode!=='story') return;
    for(const c of chGateCols()) chPatchCol(c);
    try{ for(const a of GRID.values()) for(const c of a) if(c.gate) chPatchCol(c); }catch(e){}
    const before=new Set(Object.keys(G.found||{}));
    for(const g of GT.list) if(!g._chOpen) chGateOpenLook(g);
    for(const k in (G.found||{})) if(!before.has(k)) CHT.gFound.add(k);
  }else{
    for(const g of GT.list){ if(!g._chOpen) continue; delete g._chOpen; try{ gtSync(g); }catch(e){ console.error(e); } }
    for(const k of CHT.gFound) if(G.found&&G.found[k]&&!chGateKeyReal(k)) delete G.found[k];
    CHT.gFound.clear();
  }
}
// a found key the gates' own sync writes for a gate that is really open stays
function chGateKeyReal(k){ for(const g of GT.list){ if(gtSt(g.id)<2) continue; const o=g.doorObj||g.plate||g.crack; if((o&&o.id===k)||k==='p4r_gate_'+g.id) return true; } return false; }
// run fn with a door's own locks (need, m3need, a key) lifted for the call (the trials and the story's own doors keep theirs)
function chPassing(d,fn){
  const sv=[], lift=(o,k)=>{ if(!o) return; const D=Object.getOwnPropertyDescriptor(o,k); if(!D||D.get||!D.writable||D.value==null) return; sv.push([o,k,D.value]); o[k]=null; };
  lift(d,'need'); lift(d,'m3need');
  const def=d&&AREADEFS[d.area], key=def&&def.locked&&G&&G.found?def.id+'_unlocked':null, had=!!(key&&G.found[key]);
  if(key&&!had){ G.found[key]=true; CHT.tmpFound.add(key); }
  try{ return fn(); }
  finally{ for(const [o,k,v] of sv) o[k]=v; if(key&&!had){ delete G.found[key]; CHT.tmpFound.delete(key); } }
}

// ---------- map teleport and Go to
function chTpSay(t){ const h=document.getElementById('mapHint'); if(!h) return; h.textContent=t; CHT.tpMsgT=performance.now(); }
const chPrologue=()=>typeof PRO!=='undefined'&&!!PRO&&!!PRO.on;
function chTpWhy(V,x,y){
  if(!G||G.mode!=='story') return 'Teleport works in a story journey.';
  if(chPrologue()) return 'Not during Lantern Eve. Skip it first.';
  if((G.boss&&!G.boss.dead)||G.fightSite||G.fightIntro) return 'Not during a boss fight.';
  if(G.mini||G.fishing) return 'Not in the middle of a game.';
  if(V==null||V<0||!MAPS[V]) return 'Teleport works on the world maps, not the dungeon page.';
  if(!mapsSeenList().includes(V)) return 'Ash has not found this map yet. Jump to its act first.';
  const M=MAPS[V]; if(x<40||x>M.w-40||y<M.y0+40||y>M.y0+M.h-40) return 'That is off the map.';
  return null;
}
// what the story has not opened yet: a closed gate's nook (e10c_gates), north of the Obsidian Gate before it opens, and on
// Nightfall Peak (map 4, walled rings climbed in order) anywhere Ash has not been yet (the real fog, not Reveal the map)
function chTpBlocked(V,x,y){
  const fog=CHT.fogReal||fogSeen;
  if(CH_FOGMAPS.includes(V)&&!fog(V,x,y)) return 'On this map, teleport goes only where Ash has already been (the clear parts).';
  if(chOn('gates')) return null;
  if(V===0&&y<WALL_Y+70&&!(G.flags&&G.flags.gate)) return 'The Obsidian Gate is still shut.';
  try{ if(typeof GT!=='undefined'&&GT&&GT.list) for(const g of GT.list){ if(g.map!=null&&g.map!==V) continue; if(gateIsOpen(g.id)) continue; if(gateInside(g.id,x,y)||dist(x,y,g.x,g.y)<(g.r||0)+30) return 'That is past a gate the story has not opened.'; } }catch(e){}
  return null;
}
function chTeleport(V,x,y,name){
  let why=chTpWhy(V,x,y); if(!why) why=chTpBlocked(V,x,y);
  if(why) return why;
  const s=typeof nearestLand==='function'?nearestLand(x,y):{x,y};
  if(!s||dist(s.x,s.y,x,y)>500||mapAt(s.y)!==V) return 'There is no safe ground there.';
  why=chTpBlocked(V,s.x,s.y); if(why) return why;
  chTaint();
  mapTravel(s.x,s.y,{noSave:true});
  let nm=name||''; if(!nm) try{ const r=regionAt(player.x,player.y); nm=(r&&r.name)||''; }catch(e){}
  setBanner('Teleport',nm,1.6);
  return null;
}
addEventListener('click',e=>{
  try{
    if(!chOn('tp')||scene!=='map'||typeof mapCv==='undefined'||e.target!==mapCv) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const r=mapCv.getBoundingClientRect(), [x,y]=mapInv((e.clientX-r.left)/r.width*mapCv.width,(e.clientY-r.top)/r.height*mapCv.height);
    const why=chTeleport(MAPUI.view,x,y);
    if(why){ chTpSay(why); try{ SFX.play('ui'); }catch(err){} }
  }catch(err){ console.error(err); }
},true);
// the named places the maps know, for Go to: towns and places (POI), shrines, cave, dungeon and trial doors, crossings
const CH_KIND=[['town','Town'],['spot','Place'],['shrine','Shrine'],['trial','Trial'],['cave','Cave or dungeon'],['crossing','Crossing']];
function chPlaces(){
  const out=[], seen=new Set(), named=new Set();
  // (a place with the same name on the same map once: a Trial's door before the Trial's spot on the map)
  const add=(kind,name,x,y,key)=>{ try{ if(typeof name==='function') name=name(); }catch(e){ name=''; } if(Array.isArray(name)) name=name[0];
    if(!name||!isFinite(x)||!isFinite(y)||x>=IZX-50) return; const m=mapAt(y); if(!MAPS[m]) return;
    const id=kind+':'+key, nm=simplify(String(name)), nk=m+'|'+nm.toLowerCase(); if(seen.has(id)||named.has(nk)) return; seen.add(id); named.add(nk); out.push({map:m,kind,name:nm,x:Math.round(x),y:Math.round(y),key:id}); };
  try{ for(const d of DOORS){ if(d.hs) continue; const def=AREADEFS[d.area]; if(!def||!(d.cave||d.trial||def.kind==='cave'||def.kind==='dungeon'||def.trial)) continue; add(def.trial||d.trial?'trial':'cave',def.name,d.x,d.y+(d.outY||40),d.area); } }catch(e){}
  try{ for(const m of CAVEMOUTHS){ const def=AREADEFS[m.area]; if(def) add(def.trial?'trial':'cave',def.name,m.x,m.y+40,m.area); } }catch(e){}
  try{ for(const k in POI){ const p=POI[k]; if(p&&p.name) add(p.town?'town':'spot',p.name,p.x,p.y+60,k); } }catch(e){}
  try{ for(const s of SHRINES) add('shrine',s.name,s.x+40,s.y+50,s.id); }catch(e){}
  try{ for(let k=0;k<MAPS.length;k++){ if(!MAPS[k]) continue; for(const c of crossingsOn(k)){ if(c.hidden&&c.hidden()) continue; add('crossing',c.name||c.label,c.x,c.y,c.id||(c.x+'_'+c.y)); } } }catch(e){}
  const ko=Object.fromEntries(CH_KIND.map(([k],i)=>[k,i]));
  out.sort((a,b)=>a.map-b.map||ko[a.kind]-ko[b.kind]||a.name.localeCompare(b.name));
  return out;
}
// a map's tab: the act it belongs to (its first act), and its own name above the list
function chMapAct(k){ let n=null; for(const a in ACTS) if(ACTS[a]&&ACTS[a].map===k&&(n==null||+a<n)) n=+a; return n; }
function chMapTab(k){ const n=chMapAct(k); return n==null?simplify((MAPS[k]&&MAPS[k].name)||'Map '+k):n>=5?'Finale':'Act '+ACT_ROMAN[n]; }
function chMapName(k){ const n=chMapAct(k), M=MAPS[k]; return simplify((M&&M.name)||'Map '+k)+(n!=null?` (the ${n>=5?'Finale':actLabel(n)} map)`:''); }
function chGoTo(key){
  const P=chPlaces().find(q=>q.key===key); if(!P) return 'That place is gone.';
  if(!chStory()) return 'Start or continue a journey first.';
  const why=chTeleport(P.map,P.x,P.y,P.name); if(why) return why;
  chResume(); return null;
}

// ---------- strong hits on bosses: never past the next phase mark in one go
// A boss with FOES[type].phases (bossPhase in e8_foes.js) stops just under its next mark until that phase has started,
// so a one-hit kill can never skip a phase; a boss without them stops once just under half health (most older bosses
// get angry there). The bosses' own health gates (c1Floor, f2Floor, vorOnHurt) still apply on top.
function chBossFloor(e,peek){
  if(!e||!(e.maxHp>0)) return null;
  const F=typeof FOES!=='undefined'?FOES[e.type]:null;
  if(F&&Array.isArray(F.phases)&&F.phases.length){
    if(e.noPhase) return null;
    const i=e.bph|0; if(i>=F.phases.length) return null;
    return Math.max(1,Math.min(e.hp,e.maxHp*F.phases[i]*0.98));
  }
  if(e._chHalf) return null;
  if(e.hp>e.maxHp*0.5) return e.maxHp*0.49;
  if(!peek) e._chHalf=true; return null;
}

// Pip's fire shots come in as Ash's own projectiles (owner 'player', kind 'pip'): the hit's from-point finds the shot
function chPipShot(o){
  if(!o||o.src!=='proj'||o.fx==null||!G||!G.projectiles) return false;
  for(const pr of G.projectiles) if(Math.abs(pr.x-pr.vx*0.05-o.fx)<0.01&&Math.abs(pr.y-pr.vy*0.05-o.fy)<0.01) return pr.kind==='pip'||pr.owner!=='player';
  return false;
}
// ---------- story tools (real changes, behind a confirm)
// the step "Finish" and "Skip" act on: the side quest Ash follows (a story-data quest), else the chapter
function chStepTarget(){
  if(!chStory()) return {why:'Start or continue a journey first.'};
  if(typeof S10==='undefined'||!S10.booted) return {why:'The story is still loading.'};
  let R=null;
  const q=G.focus&&S10.quests[G.focus]&&G.quests[G.focus]&&!G.quests[G.focus].done?S10.quests[G.focus]:null;
  if(q) R=s10Run('q',q);
  else if(G.focus&&G.quests[G.focus]&&!G.quests[G.focus].done) return {why:'The quest Ash follows runs on the older quest code. Follow the story to finish its steps.'};
  else if(S10.chapters[G.stage]&&(!G.done||S10.chapters[G.stage].after_done)) R=s10Run('ch',S10.chapters[G.stage]);
  if(!R) return {why:G.done?'The story is finished.':'This chapter runs on the older story code. Use Jump to a chapter to move on.'};
  const s=s10Active(R); if(!s) return {why:'Nothing is left to do here.'};
  let txt=''; try{ txt=s10T(s.obj)||s10DefaultObj(s)||''; }catch(e){} txt=simplify(String(txt||s._id));
  const who=R.kind==='q'?simplify(s10T(R.d.title)||R.d.id):simplify(CHAPTER[G.stage]||G.stage);
  if(s._kind==='choose') return {R,s,txt,who,why:'This step is a choice. Make it in the talk, so the story knows what Ash chose.'};
  return {R,s,txt,who};
}
function chBossTarget(){
  if(!chInGame()||player.dead) return null;
  let b=G.boss&&!G.boss.dead?G.boss:null;
  if(!b) try{ b=bossHere(); }catch(e){}
  return b&&!b.dead?b:null;
}
function chBossName(b){ try{ const d=bossInfo(b)||{}; return simplify(d.name||b.name||'the boss'); }catch(e){ return 'the boss'; } }
// the effects a quiet catch-up skips (they move Ash, end an act, pop a screen or change the time); powers are given
// quietly, without their banners
const CH_FX_SKIP=/^(stage|end_act|warp|time|bless|music|sfx|epi|mail)\b/;
function chQuietPower(id){
  if(typeof WEAPONS!=='undefined'&&WEAPONS[id]&&!(typeof ITEM_NAMES!=='undefined'&&ITEM_NAMES[id])){ G.weapons=G.weapons||{sword:true}; G.weapons[id]=true; return; }
  G.abil=G.abil||{}; G.abil[id]=true; if(id==='dbljump'||id==='skimmer'){ G.skills=G.skills||{}; G.skills[id]=Math.max(1,G.skills[id]|0); }
}
// the power a dungeon's gift shrine gives (defineDungeon abil, e9a_dungeon.js)
function chDunGift(id){ try{ const D=typeof DUNGEONS!=='undefined'&&DUNGEONS[id]; return (D&&D.abil)||null; }catch(e){ return null; } }
function chSafeFx(list){ const out=[]; for(const e of s10Arr(list)){ const f=chSafeFx1(e); if(f!=null) out.push(f); } return out; }
function chSafeFx1(e){
  if(e==null) return null;
  if(typeof e==='string'){ const t=e.trim(); if(CH_FX_SKIP.test(t)) return null; const m=/^(power|weapon)\s+(\S+)/.exec(t); if(m){ chQuietPower(m[2]); return null; } return e; }
  if(Array.isArray(e)) return chSafeFx(e);
  if(typeof e==='object'){ if(e.if!=null) return Object.assign({},e,{then:chSafeFx(e.then),else:e.else!=null?chSafeFx(e.else):undefined}); if(e.banner||e.say) return null; return e; }
  return null;
}
// one step done the way an old save catches up (s10MigrateStep), with the effects above left out
function chMigStep(R,s){
  const st=s10St(R), was=S10.quiet; S10.quiet=true;
  try{
    const sc=s.scene&&S10.scenes[s.scene]; if(sc) s10QuietScene(sc);
    for(const p of s.parts||[]){ if(!st[p._id]){ st[p._id]=1; s10Do(chSafeFx(p.then),{R}); } }
    if(s._kind==='deduce'){ const D=S10.deduce[s._args[0]]; if(D){ for(const c of s10Arr(D.needs)) if(!G.case.clues[c]){ G.case.clues[c]=1; G.case.seen[c]=1; } s10Solve(D.id,true); } }
    // its boss beaten, its dungeon done (the world agrees: the boss site closes)
    for(const x of [s].concat(s.parts||[])){ const A=x._args||[]; if(x._kind==='fight'&&A[0]) G.bossDone[A[0]]=true; if(x._kind==='dungeon'&&A[0]){ G.flags['trial_'+A[0]+'_done']=true; const gift=chDunGift(A[0]); if(gift) chQuietPower(gift); } }
    st[s._id]=1;
    s10Do(chSafeFx(s.then),{R});
  }finally{ S10.quiet=was; }
}
// the data chapters before st in its own act, done (the flags, clues, items and people a normal arrival would have)
function chMigrateBefore(st){
  const n=actOf(st), i0=stageAt(st); let n0=0;
  for(const id of STAGES.slice()){
    const i=stageAt(id); if(i<0||i>=i0||actOf(id)!==n) continue;
    const c=S10.chapters[id]; if(!c) continue;
    const R=s10Run('ch',c), done=s10St(R);
    for(const s of c.step||[]){ if(!s._kind||s.optional||done[s._id]) continue; try{ chMigStep(R,s); n0++; }catch(e){ console.error('[cheats] catch-up '+id+'.'+s._id,e); } }
  }
  return n0;
}
// the chapters to jump to: every stage of Acts II to V (the engine's own stages, data or old code); Act I only to its
// end (its chapters run on the older story code, which keeps its state in many flags)
function chJumpList(n){
  if(n===1) return [{st:'done',label:'Act I complete',sub:'Free roam in Embermere, before Lantern Night'}];
  const L=STAGES.filter(s=>actOf(s)===n&&STAGEDEF[s]);
  const cnt={}, k={}; for(const s of L){ const c=CHAPTER[s]||s; cnt[c]=(cnt[c]||0)+1; }
  return L.map(s=>{ const c=CHAPTER[s]||s; k[c]=(k[c]||0)+1; return {st:s,label:simplify(String(c))+(cnt[c]>1?' · part '+k[c]:''),sub:s}; });
}
function chActs(){ return Object.keys(ACTS).map(Number).filter(n=>n===1||chJumpList(n).length).sort((a,b)=>a-b); }
// Jump: the story engine's own stage setter (goStage), after what a normal arrival has: Act I done (the choices made
// stay), the earlier acts finished, at least the act's fair kit (level, powers, weapons, coins, items, flags: e7_acts.js
// kitFor, the same as __eb.actStart), the data chapters before it in this act caught up quietly, and Ash at its start
function chJump(st){
  if(!chStory()||!STAGEDEF[st]) return 'Start or continue a journey first.';
  if(chPrologue()) return 'Not during Lantern Eve. Skip it first.';
  if(G.boss&&!G.boss.dead) return 'Not during a boss fight. Beat the boss first.';
  if(G.mini) return 'Not in the middle of a game.';
  const n=actOf(st), A=ACTS[n]||{}, p=player;
  if(AREA) exitArea(true);
  if(G.fightSite) try{ resetBoss(); }catch(e){}
  { const ch0=Object.assign({},G.choices); actOneDone(); G.choices=Object.assign(G.choices||{},ch0); }
  if(n>=2){
    const K=kitFor(n);
    for(let i=0;i<60&&p.level<K.level;i++) gainXp(Math.max(1,xpNeed(p.level)-p.xp));
    for(const id of K.abil) chQuietPower(id);
    G.weapons=G.weapons||{sword:true}; for(const id of K.weapons) if(WEAPONS[id]) G.weapons[id]=true;
    G.tier=Math.max(G.tier|0,K.tier|0); G.coins=Math.max(G.coins|0,K.coins|0);
    for(const k in K.items) G.items[k]=Math.max(G.items[k]|0,K.items[k]|0);
    for(const k in K.flags) if(G.flags[k]==null) G.flags[k]=K.flags[k];
    for(let k=1;k<n;k++){ G.flags['act'+k+'_done']=true; if(ACT_PRE[k]) G.flags[ACT_PRE[k]+'done']=true; }
    // the earlier acts' bosses beaten and their dungeons done (their boss sites close, as after a real playthrough)
    try{ for(const k in SITES){ const S0=SITES[k]; if(S0&&S0.boss&&S0.stage&&stageAt(S0.stage)>=0&&actOf(S0.stage)<n) G.bossDone[S0.boss]=true; } }catch(e){}
    try{ for(const id of S10.chOrder){ const c=S10.chapters[id]; if(!c||stageAt(id)<0||actOf(id)>=n) continue; for(const s of c.step||[]){ const A=s._args||[]; if(s._kind==='fight'&&A[0]) G.bossDone[A[0]]=true; if(s._kind==='dungeon'&&A[0]) G.flags['trial_'+A[0]+'_done']=true; } } }catch(e){}
    // Lantern Night itself: before the theft (actStartDebug's 'heist')
    if(st==='c_fest'){ for(const k of ['c_fest_seen','c_stolen','c_leapt','c_t_maren','c_t_yara','c_t_wren']) delete G.flags[k]; delete G.items.c_gear; }
    G.mapsSeen=G.mapsSeen||{0:true}; for(let k=0;k<=(A.map||0);k++) if(MAPS[k]) G.mapsSeen[k]=true;
    chMigrateBefore(st);
  }
  const d=STAGEDEF[st], M=MAPS[A.map];
  let at=st==='done'?{x:POI.village.x+60,y:POI.village.y+150}:(d&&actOf(st)===n&&d.at)||A.at||(M&&M.spawn)||{x:POI.village.x+60,y:POI.village.y+150};
  const s=nearestLand(at.x,at.y)||at;
  p.x=s.x; p.y=s.y; p.z=0; p.vz=0; p.kvx=p.kvy=0; p.flying=false; p.landing=false; p.gliding=false;
  p.hp=p.hpShow=p.maxHp; p.potions=p.potionsMax; chFill(p);
  G.banner=null; G.bannerQ=[]; G.fade=1;
  chMarkSave();
  goStage(st);
  try{ if(G.flags.pip) spawnPip(); placeGoat(); compsOnMove(); }catch(e){ console.error(e); }
  updateCam(0,true); G.chunkBurst=16;
  return null;
}
function chFinishOne(a){
  const x=a.x, A=x._args||[], K=x._kind;
  switch(K){
    case 'fight': { const b=chBossTarget(); if(b&&b.type===A[0]){ chBeatBoss(); break; } G.bossDone[A[0]]=true; storyEmit('boss_done:'+A[0]); break; }   // the step's poll plays the kneel and win scenes
    case 'dungeon': G.flags['trial_'+A[0]+'_done']=true; storyEmit('dungeon_done:'+A[0]); break;
    case 'use_power_at': s10Gate(A[1]||A[0],true); break;
    case 'find': if(!(G.items[A[0]]>0)) giveItems({[A[0]]:1},true); break;
    case 'give': if(!(G.items[A[0]]>0)) giveItems({[A[0]]:1},true); s10Run2(a); break;
    case 'deduce': { const D=S10.deduce[A[0]]; if(D){ for(const c of s10Arr(D.needs)) if(!G.case.clues[c]){ G.case.clues[c]=1; G.case.seen[c]=1; } const i=s10Arr(D.pick).findIndex(q=>q&&q.right); s10Deduce(A[0],Math.max(0,i)); } break; }
    case 'track': (G.story._trk||(G.story._trk={}))[A[0]]='done'; break;
    case 'minigame': if(G.mini&&G.mini.kind===A[0]){ const M=MINI_S10[A[0]]; if(M&&M.win) M.win(); else miniEnd(true); } else s10Run2(a); break;
    default: s10Run2(a);   // talk, goto, examine, wait_for, cutscene: its scene plays, then it is done
  }
}
function chStepActs(R,s){
  const A=s10Doable(R).filter(a=>a.s===s&&!a.extra);
  if(A.length) return A;
  if(s._kind==='all'||s._kind==='any'){ const st=s10St(R); return (s.parts||[]).filter(p=>!st[p._id]).map(p=>({R,s,x:p,key:p._id,part:true})); }
  return [{R,s,x:s,key:s._id}];
}
function chFinish(){
  const T=chStepTarget(); if(T.why) return T.why;
  chMarkSave();
  const acts=chStepActs(T.R,T.s);
  for(const a of (T.s._kind==='any'?acts.slice(0,1):acts)) chFinishOne(a);
  return null;
}
// Skip: the step is done without its scenes (their clues, items and flags still come, quietly), and the story moves on
function chSkip(){
  const T=chStepTarget(); if(T.why) return T.why;
  const {R,s}=T; chMarkSave();
  const seen=G.story._seen||(G.story._seen={}), intro=G.story._intro||(G.story._intro={});
  const acts=chStepActs(R,s);
  for(const a of (s._kind==='any'?acts.slice(0,1):acts)){
    const x=a.x;
    for(const id of [x.intro,x.scene,x.win,x.after,x.kneel]){ if(!id||typeof id!=='string') continue; const sc=S10.scenes[id]; if(sc){ const was=S10.quiet; S10.quiet=true; try{ s10QuietScene(sc); }finally{ S10.quiet=was; } } seen[id]=1; }
    intro[R.key+'/'+a.key]=1;
    if(x._kind==='fight'){ G.bossDone[x._args[0]]=true; if(x.kneel) (G.story._kneel||(G.story._kneel={}))[x._args[0]]=1; }
    if(x._kind==='dungeon') G.flags['trial_'+x._args[0]+'_done']=true;
    delete S10.pend[R.key+'/'+a.key];
    s10Finish(a,false);
  }
  return null;
}
function chBeatBoss(){
  const b=chBossTarget(); if(!b) return 'There is no boss fight here right now.';
  chMarkSave();
  const all=[b]; try{ for(const e of G.enemies) if(e!==b&&!e.dead&&!e.passive&&isBossFoe(e)&&bossShares(e)) all.push(e); }catch(e){}
  for(const e of all) if(!e.dead) try{ killEnemy(e); }catch(err){ console.error(err); }
  return null;
}
// copy the journey to an empty slot first (the newest stays the one being played)
function chEmptySlot(){ for(let i=0;i<3;i++) if(i!==curSlot&&!slotSave(i)) return i; return -1; }
function chCopyJourney(){
  if(!chStory()) return -1; const j=chEmptySlot(); if(j<0) return -1;
  saveGame(true); const s=store.get(SLOT_KEYS[curSlot],null); if(!s||s.v!==3) return -1;
  const c=JSON.parse(JSON.stringify(s)); c.slot=j; c.at=Date.now()-1000;
  store.set(SLOT_KEYS[j],c); try{ Cloud.queueSave(packSaves(),true); }catch(e){}
  return j;
}

// ---------- gear (real changes)
// what the story would have given Ash by now: the fair kit of this act, the Trials' gifts, and the powers and weapons
// that the chapters before this one (and the steps of this one already done) hand out
function chScanPow(o,abil,wp,depth){
  if(o==null||depth>8) return;
  if(typeof o==='string'){ const m=/^(power|weapon|give)\s+(\S+)/.exec(o.trim()); if(m){ const id=m[2]; if(typeof WEAPONS!=='undefined'&&WEAPONS[id]&&!(typeof ITEM_NAMES!=='undefined'&&ITEM_NAMES[id])) wp.add(id); else if(m[1]==='power') abil.add(id); } return; }
  if(Array.isArray(o)){ for(const v of o) chScanPow(v,abil,wp,depth+1); return; }
  if(typeof o==='object') for(const k of ['then','else','do','parts']) if(o[k]!=null) chScanPow(o[k],abil,wp,depth+1);
}
function chKitSoFar(){
  const n=actOf(G.stage), K=kitFor(Math.max(1,n)), abil=new Set(n>=2?K.abil:[]), wp=new Set(n>=2?K.weapons:['sword']);
  const F=G.flags||{};
  try{ for(const id in TRIALS){ const T=TRIALS[id]; if(!F['trial_'+id+'_done']) continue; if(T.abil) abil.add(T.abil); if(T.item&&WEAPONS[T.item]) wp.add(T.item); } }catch(e){}
  const cur=stageAt(G.stage);
  try{ for(const id of S10.chOrder){ const c=S10.chapters[id], i=stageAt(id); if(!c||i<0||i>cur) continue; const st=(G.story&&G.story[id])||{};
    for(const s of c.step||[]){ if(i===cur&&!st[s._id]) continue; chScanPow(s,abil,wp,0); const sc=s.scene&&S10.scenes[s.scene]; if(sc) chScanPow(sc,abil,wp,0);
      for(const x of [s].concat(s.parts||[])) if(x._kind==='dungeon'&&x._args&&x._args[0]){ const gift=chDunGift(x._args[0]); if(gift) abil.add(gift); } } } }catch(e){}
  return {abil:[...abil].filter(id=>typeof ABIL_INFO==='undefined'||ABIL_INFO[id]||(typeof ABIL_DEFS!=='undefined'&&ABIL_DEFS[id])),weapons:[...wp].filter(id=>WEAPONS[id])};
}
function chGivePowers(all){
  const K=all?{abil:ABIL_ORDER.slice(),weapons:Object.keys(WEAPONS)}:chKitSoFar();
  const got=[];
  for(const id of K.abil) if(!(G.abil&&G.abil[id])){ chQuietPower(id); got.push(simplify((ABIL_INFO[id]&&ABIL_INFO[id].name)||id)); }
  for(const id of K.weapons) if(!(G.weapons&&G.weapons[id])){ G.weapons=G.weapons||{sword:true}; G.weapons[id]=true; got.push(simplify((WEAPONS[id]&&WEAPONS[id].name)||id)); }
  if(got.length&&player.flyE!=null) player.flyE=flyMax();
  return got;
}
function chFillBag(){ const got=[]; for(const id in ITEMDEF){ const d=ITEMDEF[id]; if(d.kind!=='use'||!(d.cap>0)) continue; if((G.items[id]|0)<d.cap){ G.items[id]=d.cap; got.push(id); } } return got; }
function chAct(a){
  if(!chAdmin()||!chInGame()) return 'Start or continue a journey first.';
  const p=player, story=G.mode==='story';
  if(a==='refill'){ p.hp=p.hpShow=p.maxHp; p.potions=p.potionsMax; chFill(p); p.roar=100; if(p.stats) p.stats.phoenix=p.stats.phoenixMax||0; if(p.flyE!=null) p.flyE=flyMax(); setBanner('Refilled','Health, flasks, stamina, fire and roar',1.6); SFX.play('drink'); chTaint(); if(story){ chMarkSave(); saveGame(); } return 'Refilled.'; }
  if(!story) return 'Gear is for story journeys.';
  let msg='';
  if(a==='coins'){ addCoins(500,p.x,p.y); setBanner('+500 coins',`${G.coins} coins`,1.6); msg=`${G.coins} coins now.`; }
  else if(a==='level'){ const L=p.level; let n=0; while(p.level===L&&n++<4) gainXp(Math.max(1,xpNeed(p.level)-p.xp+1)); setBanner('+1 level',`Level ${p.level}`,1.6); SFX.play('quest'); msg=`Level ${p.level} now.`; }
  else if(a==='bag'){ const got=chFillBag(); setBanner('The bag is full',got.length?`${got.length} kinds topped up`:'Everything was already full',1.8); SFX.play('pickup'); msg=got.length?`Filled ${got.length} kinds to their cap.`:'Everything was already at its cap.'; }
  else if(a==='pow'||a==='powall'){ const got=chGivePowers(a==='powall'); setBanner(a==='pow'?'Powers so far':'Every power',got.length?got.slice(0,4).join(', ')+(got.length>4?` and ${got.length-4} more`:''):'Ash had them all already',2.4); SFX.play('quest'); msg=got.length?'Gave: '+got.join(', ')+'.':'Ash had them all already.'; }
  else return '';
  chMarkSave(); saveGame(); return msg;
}
function chTime(t){ if(!chAdmin()||!chStory()) return; G.tod=t; chTaint(); }
// the Arena from any wave: the run is cheated (no score ticket, nothing posted); a story journey is saved first
function chArena(n){
  if(!chAdmin()) return;
  n=clamp(n|0,1,99);
  if(G&&G.mode==='story'&&player&&!player.dead) try{ saveGame(true); }catch(e){}
  CHT.arenaTaint=true;
  try{ startNormal(); }finally{ CHT.arenaTaint=false; }
  G.cheated=true; G.wave=n-1;
  setBanner('Arena',`Starting at wave ${n}. Cheats are on, so no score is posted.`,2.4);
}
// close Settings and go back to the game (the pause menu under it is closed too)
function chResume(){ if(scene==='menu') return; scene='play'; hideAll(); }

// ---------- the Cheats section in Settings (built here, so body.html and a12b_ui.js stay as they are)
function chCss(){
  if(document.getElementById('cheatCss')) return;
  const s=document.createElement('style'); s.id='cheatCss';
  s.textContent=`#cheatSec{margin-top:18px;padding-top:2px;border-top:2px solid var(--edge);text-align:left}
#cheatSec .chwho{margin:2px 0 6px;font-size:13px;color:var(--muted)}
#cheatSec .chbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:8px 0 6px}
#cheatSec .chbar .btn{width:auto;flex:1 1 210px;min-height:48px}
#cheatSec .chcount{flex:1 1 120px;font-size:13px;color:var(--gold)}
#cheatSec .chgh{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;margin:8px 0 0;padding:10px 16px;font:inherit;font-size:16px;font-weight:700;color:var(--ink);text-align:left;background:linear-gradient(180deg,var(--btn-hi),var(--btn));border:1px solid var(--edge);border-radius:12px;cursor:pointer}
#cheatSec .chgh .chgt{flex:1}
#cheatSec .chgh .chgn{font-size:12px;font-weight:700;color:var(--gold)}
#cheatSec .chgh .chgc{flex:none;width:9px;height:9px;margin:0 4px 4px;border-right:2.5px solid currentColor;border-bottom:2.5px solid currentColor;transform:rotate(45deg);transition:transform .15s}
#cheatSec .chgh[aria-expanded=false] .chgc{transform:rotate(-45deg);margin:2px 4px 0}
#cheatSec .chgb{padding:0 4px 4px}
#cheatSec .seg button{min-height:44px;min-width:58px}
#cheatSec .chbtns{display:flex;flex-wrap:wrap;gap:8px;margin-left:auto;justify-content:flex-end}
#cheatSec .chbtns .btn{width:auto;flex:none;min-height:44px;padding:8px 14px;font-size:14px}
#cheatSec .setrow.chfull{display:block}
#cheatSec .setrow.chfull>span{display:block}
#cheatSec .setrow.chfull>.chbtns{margin:8px 0 0;justify-content:flex-start}
#cheatSec .chlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px;margin:8px 0 2px}
#cheatSec .chlist .btn{width:100%;min-height:48px;padding:7px 10px;font-size:14px;line-height:1.2;text-align:left;white-space:normal}
#cheatSec .chlist .btn small{display:block;margin-top:2px;font-size:11px;font-weight:500;opacity:.75}
#cheatSec .chlist .btn.here{border-color:var(--gold)}
#cheatSec .chtabs{display:inline-flex;flex-wrap:wrap;max-width:100%;margin-top:10px}
#cheatSec .chmapnm{margin:8px 0 0;font-size:13px;font-weight:700;color:var(--ink)}
#cheatSec .chreal{display:inline-block;margin-left:6px;padding:2px 7px 1px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#fff3e0;background:rgba(176,58,30,.9);vertical-align:2px}
#cheatSec small.chmsg{color:var(--gold)}
#cheatSec .chconf{margin:10px 0 4px;padding:12px 14px;border:2px solid var(--gold);border-radius:12px;background:rgba(0,0,0,.16)}
#cheatSec .chconf p{margin:0 0 8px;font-size:14px;line-height:1.45;color:var(--ink)}
#cheatSec .chconf p.chnote{font-size:13px;color:var(--muted)}
#cheatSec .chconf .chbtns{justify-content:flex-start;margin:4px 0 0}
#cheatSec .btn:disabled{opacity:.45;cursor:default}
#cheatSec .chwave{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px}
#cheatSec .chwave output{min-width:46px;text-align:center;font-size:20px;font-weight:800;color:var(--ink)}
#cheatChip{position:fixed;z-index:7;left:calc(env(safe-area-inset-left,0px) + 26px);top:env(safe-area-inset-top,0px);display:flex;align-items:center;height:16px;margin:0;padding:1px 11px 0;border:1px solid rgba(255,170,90,.75);border-top:0;border-radius:0 0 9px 9px;
  font:800 9.5px/1 ${UIF};letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;color:#ffe6b8;background:rgba(122,30,16,.92);box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
#cheatChip::after{content:'';position:absolute;left:-10px;right:-10px;top:0;bottom:-14px}
#cheatChip[hidden]{display:none}
#cheatChip:focus-visible{outline:2px solid var(--gold);outline-offset:2px}`;
  document.head.appendChild(s);
}
const chEsc=s=>escapeHtml(String(s==null?'':s));
const CH_REAL='<span class="chreal">Real</span>';
function chSegHtml(id,label){ return `<div class="seg" role="group" aria-label="${chEsc(label)}" data-ch="${id}"><button type="button" data-v="on" aria-pressed="false">On</button><button type="button" data-v="off" aria-pressed="true">Off</button></div>`; }
function chSwRow(id){ const [,label,note]=CH_SW[id]; return `<div class="setrow" data-row="${id}"><span>${chEsc(label)}<small>${chEsc(note)}</small></span>${chSegHtml(id,label)}</div>`; }
function chGroupBody(g){
  const sw=Object.keys(CH_SW).filter(k=>CH_SW[k][0]===g).map(chSwRow).join('');
  if(g==='surv') return sw;
  if(g==='move') return sw+`<div class="setrow chfull" data-row="goto"><span>Go to a place<small>Moves Ash there now, on the maps he has found. Places on the others wait for their act.</small><small class="chmsg" data-msg="goto" hidden></small></span>
<div class="seg chtabs" role="group" aria-label="Map" data-gomaps></div><p class="chmapnm" data-goname></p><div class="chlist" data-golist></div></div>`;
  if(g==='world') return sw+`<div class="setrow chfull"><span>Time of day${CH_REAL}<small>Sets the clock now. It runs on from there unless it is frozen.</small><small class="chmsg" data-msg="tod" hidden></small></span><div class="chbtns">${CH_TOD.map(([n],i)=>`<button type="button" class="btn c sm" data-tod="${i}">${n}</button>`).join('')}</div></div>`;
  if(g==='story') return `<div class="chconf" id="chConf" hidden></div>
<div class="setrow chfull" data-row="jump"><span>Jump to a chapter${CH_REAL}<small>The story moves there with what a normal arrival has: the earlier acts finished, their powers and weapons, and the chapters before it caught up. Nothing is taken away.</small><small class="chmsg" data-msg="jump" hidden></small></span>
<div class="seg chtabs" role="group" aria-label="Act" data-jacts></div><div class="chlist" data-jlist></div><p class="setnote" data-jnote hidden>Act I's chapters run on the older story code, which keeps its place in many flags. Start a new journey to play them from the beginning.</p></div>
<div class="setrow"><span>Finish this step${CH_REAL}<small data-st="finish">The step is done as if Ash did it: its scene plays.</small><small class="chmsg" data-msg="finish" hidden></small></span><div class="chbtns"><button type="button" class="btn c sm" data-story="finish">Finish it</button></div></div>
<div class="setrow"><span>Skip this step's scene${CH_REAL}<small data-st="skip">The step is done without its scene. Its clues and items still come.</small><small class="chmsg" data-msg="skip" hidden></small></span><div class="chbtns"><button type="button" class="btn c sm" data-story="skip">Skip it</button></div></div>
<div class="setrow"><span>Beat this boss${CH_REAL}<small data-st="boss">The fight ends through the boss's own ending, so its scenes and rewards still come.</small><small class="chmsg" data-msg="boss" hidden></small></span><div class="chbtns"><button type="button" class="btn c sm" data-story="boss">Beat it</button></div></div>`;
  if(g==='gear') return `<p class="setnote">These change the journey for real and are saved.</p>
<div class="setrow"><span>Powers and weapons${CH_REAL}<small>So far: what the story would have given Ash by this chapter. All: every power and weapon in the game.</small><small class="chmsg" data-msg="pow" hidden></small></span><div class="chbtns"><button type="button" class="btn c sm" data-gear="pow">So far</button><button type="button" class="btn c sm" data-gear="powall">All of them</button></div></div>
<div class="setrow"><span>Coins and level${CH_REAL}<small>A level brings its blessing as usual.</small><small class="chmsg" data-msg="coins" hidden></small></span><div class="chbtns"><button type="button" class="btn c sm" data-gear="coins">+500 coins</button><button type="button" class="btn c sm" data-gear="level">+1 level</button></div></div>
<div class="setrow"><span>Fill the bag${CH_REAL}<small>Every kind of bun, candy, stone and pudding up to as many as Ash can carry.</small><small class="chmsg" data-msg="bag" hidden></small></span><div class="chbtns"><button type="button" class="btn c sm" data-gear="bag">Fill it</button></div></div>
<div class="setrow"><span>Refill everything${CH_REAL}<small>Health, flasks, stamina, fire, roar and wings. Works in the Arena too.</small><small class="chmsg" data-msg="refill" hidden></small></span><div class="chbtns"><button type="button" class="btn c sm" data-gear="refill">Refill</button></div></div>`;
  if(g==='arena') return `<div class="setrow chfull"><span>Start an Arena run at a wave<small>The run counts as cheated: it keeps no best score and posts nothing. A story journey is saved first.</small></span>
<div class="chwave"><button type="button" class="btn c sm" data-wave="-5" aria-label="5 waves fewer">−5</button><button type="button" class="btn c sm" data-wave="-1" aria-label="One wave fewer">−1</button><output id="chWaveN" aria-live="polite">5</output><button type="button" class="btn c sm" data-wave="1" aria-label="One wave more">+1</button><button type="button" class="btn c sm" data-wave="5" aria-label="5 waves more">+5</button><button type="button" class="btn c sm hot" data-arena="go">Start at wave 5</button></div></div>`;
  return '';
}
function chBuild(){
  if(!chAdmin()) return null;
  const panel=document.querySelector('#settings .panel'); if(!panel) return null;
  let sec=document.getElementById('cheatSec'); if(sec) return sec;
  chCss();
  sec=document.createElement('div'); sec.id='cheatSec'; sec.setAttribute('role','region'); sec.setAttribute('aria-label','Cheats');
  sec.innerHTML=`<div class="setsec">Cheats</div><p class="chwho" id="chWho"></p>
<p class="setnote">For testing. Switches last until the page reloads and never go in the save. Buttons marked Real change this journey for good. An Arena run that used any cheat posts no score.</p>
<div class="chbar"><button type="button" class="btn c" id="chOffAll">Turn everything off</button><span class="chcount" id="chCount" aria-live="polite"></span></div>`
    +CH_GROUPS.map(([g,name])=>`<div class="chgrp" data-g="${g}"><button type="button" class="chgh" data-grp="${g}" aria-expanded="${CHT.open[g]?'true':'false'}" aria-controls="chg_${g}"><span class="chgt">${name}</span><span class="chgn" data-gn="${g}"></span><span class="chgc" aria-hidden="true"></span></button><div class="chgb" id="chg_${g}"${CHT.open[g]?'':' hidden'}>${chGroupBody(g)}</div></div>`).join('');
  // the bottom of Settings: right above the Done button
  const done=document.getElementById('bSettingsClose'); let ref=done; while(ref&&ref.parentElement!==panel) ref=ref.parentElement;
  if(ref) panel.insertBefore(sec,ref); else panel.appendChild(sec);
  sec.addEventListener('click',chClick);
  for(const g of CH_GROUPS) if(CHT.open[g[0]]) chFill2(g[0]);
  return sec;
}
// the lists that depend on the journey are filled when their group opens
function chFill2(g){ if(g==='move') chRenderGo(); if(g==='story') chRenderJump(); }
function chRenderGo(){
  const sec=document.getElementById('cheatSec'); if(!sec) return;
  const tabs=sec.querySelector('[data-gomaps]'), list=sec.querySelector('[data-golist]'); if(!tabs||!list) return;
  const P=chPlaces(), maps=[...new Set(P.map(q=>q.map))].sort((a,b)=>a-b);
  if(CHT.goMap==null||!maps.includes(CHT.goMap)) CHT.goMap=chInGame()?curMap():0;
  if(!maps.includes(CHT.goMap)) CHT.goMap=maps[0]||0;
  const found=chStory()?mapsSeenList():[];
  const tk=maps.join(',');
  if(tabs.dataset.k!==tk){ tabs.dataset.k=tk; tabs.innerHTML=maps.map(k=>`<button type="button" data-gomap="${k}" aria-pressed="false" aria-label="${chEsc(chMapName(k))}">${chEsc(chMapTab(k))}</button>`).join(''); }
  const gn=sec.querySelector('[data-goname]'); if(gn){ const t=chMapName(CHT.goMap); if(gn.textContent!==t) gn.textContent=t; }
  for(const b of tabs.querySelectorAll('button')) b.setAttribute('aria-pressed',String(+b.dataset.gomap===CHT.goMap));
  const ok=found.includes(CHT.goMap), kn=Object.fromEntries(CH_KIND);
  const lk=CHT.goMap+'|'+ok+'|'+P.length;
  if(list.dataset.k!==lk){ list.dataset.k=lk;
    list.innerHTML=P.filter(q=>q.map===CHT.goMap).map(q=>`<button type="button" class="btn c sm" data-go="${chEsc(q.key)}"${ok?'':' disabled'}>${chEsc(q.name)}<small>${chEsc(kn[q.kind]||'')}</small></button>`).join(''); }
  chMsg('goto',chStory()?(ok?'':'Ash has not found this map yet. Jump to its act to get there.'):'Start or continue a journey to go places.');
}
function chRenderJump(){
  const sec=document.getElementById('cheatSec'); if(!sec) return;
  const tabs=sec.querySelector('[data-jacts]'), list=sec.querySelector('[data-jlist]'); if(!tabs||!list) return;
  const acts=chActs(); if(CHT.jumpAct==null||!acts.includes(CHT.jumpAct)) CHT.jumpAct=chStory()?clamp(actOf(G.stage),1,5):2;
  if(!acts.includes(CHT.jumpAct)) CHT.jumpAct=acts[0]||1;
  const tk=acts.join(',');
  if(tabs.dataset.k!==tk){ tabs.dataset.k=tk; tabs.innerHTML=acts.map(n=>`<button type="button" data-jact="${n}" aria-pressed="false">${n>=5?'Finale':'Act '+ACT_ROMAN[n]}</button>`).join(''); }
  for(const b of tabs.querySelectorAll('button')) b.setAttribute('aria-pressed',String(+b.dataset.jact===CHT.jumpAct));
  const L=chJumpList(CHT.jumpAct), story=chStory(), here=story?G.stage:null, lk=CHT.jumpAct+'|'+story+'|'+here;
  if(list.dataset.k!==lk){ list.dataset.k=lk;
    list.innerHTML=L.map(q=>`<button type="button" class="btn c sm${q.st===here?' here':''}" data-jump="${chEsc(q.st)}"${story?'':' disabled'}>${chEsc(q.label)}<small>${chEsc(q.st===here?'Ash is here now':q.sub)}</small></button>`).join('')
; const nt=sec.querySelector('[data-jnote]'); if(nt) nt.hidden=CHT.jumpAct!==1; }
  chMsg('jump',story?'':'Start or continue a journey first.');
}
function chMsg(k,t){ const sec=document.getElementById('cheatSec'); const el=sec&&sec.querySelector(`[data-msg="${k}"]`); if(!el) return; t=t||''; if(el.textContent!==t) el.textContent=t; el.hidden=!t; }
// keep the section as things are: the switches, the counts, what can be used now
function chSync(){
  const sec=document.getElementById('cheatSec'); if(!sec) return;
  if(!chAdmin()){ chAdminSync(); return; }
  for(const g of sec.querySelectorAll('.seg[data-ch]')){ const on=!!CHT.on[g.dataset.ch]; for(const b of g.querySelectorAll('button')){ const v=String((b.dataset.v==='on')===on); if(b.getAttribute('aria-pressed')!==v) b.setAttribute('aria-pressed',v); } }
  let total=0; const per={}; for(const k in CHT.on) if(CHT.on[k]){ total++; const g=CH_SW[k][0]; per[g]=(per[g]||0)+1; }
  for(const el of sec.querySelectorAll('[data-gn]')){ const n=per[el.dataset.gn]||0, t=n?`${n} on`:''; if(el.textContent!==t) el.textContent=t; }
  const cnt=document.getElementById('chCount'); if(cnt){ const t=total?`${total} switch${total===1?' is':'es are'} on`:'Every switch is off'; if(cnt.textContent!==t) cnt.textContent=t; }
  const off=document.getElementById('chOffAll'); if(off) off.disabled=!total;
  const who=document.getElementById('chWho'); if(who){ const nm=(Cloud.user&&Cloud.user.name)||'admin', t=`Signed in as ${nm}, an admin account. Only admin accounts see this.`; if(who.textContent!==t) who.textContent=t; }
  const live=chInGame(), story=chStory();
  for(const b of sec.querySelectorAll('button[data-tod]')) b.disabled=!story;
  chMsg('tod',story?'':'Start or continue a journey to set the clock.');
  for(const b of sec.querySelectorAll('button[data-gear]')) b.disabled=b.dataset.gear==='refill'?!live:!story;
  if(!story) for(const k of ['pow','coins','bag']) chMsg(k,live?'Gear is for story journeys.':'Start or continue a journey first.');
  if(!live) chMsg('refill','Start or continue a journey first.');
  // story: what Finish and Skip would do, and the boss
  const T=chStepTarget(), fb=sec.querySelector('[data-story="finish"]'), sb=sec.querySelector('[data-story="skip"]'), bb=sec.querySelector('[data-story="boss"]');
  if(fb) fb.disabled=!!T.why; if(sb) sb.disabled=!!T.why;
  const stp=T.why?T.why:`Now: ${T.who}: “${T.txt}”`;
  for(const k of ['finish','skip']) chMsg(k,stp);
  const B=chBossTarget(); if(bb) bb.disabled=!B||!story; chMsg('boss',B?(story?`Now: ${chBossName(B)}.`:'Boss fights in the Arena are not beaten this way.'):'There is no boss fight here right now.');
  const ab=sec.querySelector('[data-arena="go"]'), wn=document.getElementById('chWaveN'); if(wn&&wn.textContent!==String(CHT.wave)) wn.textContent=String(CHT.wave); if(ab){ const t=`Start at wave ${CHT.wave}`; if(ab.textContent!==t) ab.textContent=t; }
  if(CHT.open.move) chRenderGo(); if(CHT.open.story) chRenderJump();
}
// one click handler for the whole section
function chClick(e){
  const b=e.target.closest('button'); if(!b||b.disabled||!this.contains(b)) return;
  if(!chAdmin()){ chAdminSync(); return; }
  try{ SFX.init(); }catch(err){}
  const D=b.dataset, sg=b.parentElement&&b.parentElement.dataset&&b.parentElement.dataset.ch;
  if(sg){ chSet(sg,D.v==='on'); SFX.play('ui'); return; }
  if(b.id==='chOffAll'){ chAllOff(); SFX.play('ui'); return; }
  if(D.grp){ const g=D.grp, open=!CHT.open[g]; CHT.open[g]=open; b.setAttribute('aria-expanded',String(open)); const body=document.getElementById('chg_'+g); if(body) body.hidden=!open; store.set('eb_cheat_open',CHT.open); if(open){ chFill2(g); chSync(); } SFX.play('ui'); return; }
  if(D.gomap!=null){ CHT.goMap=+D.gomap; chRenderGo(); SFX.play('ui'); return; }
  if(D.go){ const why=chGoTo(D.go); if(why){ chMsg('goto',why); SFX.play('ui'); } return; }
  if(D.tod!=null){ chTime(CH_TOD[+D.tod][1]); chMsg('tod',`The clock says ${CH_TOD[+D.tod][0].toLowerCase()} now.`); SFX.play('ui'); return; }
  if(D.jact!=null){ CHT.jumpAct=+D.jact; chRenderJump(); SFX.play('ui'); return; }
  if(D.jump){ chAsk('jump',D.jump); return; }
  if(D.story){ chAsk(D.story); return; }
  if(D.conf){ chConfirm(D.conf); return; }
  if(D.gear){ const m=chAct(D.gear), k=D.gear==='powall'?'pow':D.gear==='level'?'coins':D.gear; chSync(); chMsg(k,m); return; }
  if(D.wave){ CHT.wave=clamp(CHT.wave+(+D.wave),1,99); chSync(); SFX.play('ui'); return; }
  if(D.arena){ chArena(CHT.wave); return; }
}
// the confirm for the story tools: what will change, a copy to an empty slot first, then Yes or Cancel
function chAsk(kind,arg){
  const box=document.getElementById('chConf'); if(!box||!chStory()) return;
  let title='', text='';
  if(kind==='jump'){ const n=actOf(arg), q=chJumpList(n).find(x=>x.st===arg)||{label:arg}; title=`Jump to ${n>=5?'the Finale':actLabel(n)}: ${q.label}?`;
    text=arg==='done'?'The story goes to the end of Act I, free roam before Lantern Night, with every Act I boss, Trial and Ward done (the choices Ash made stay).':
      `The story moves to this chapter. Ash gets what a normal arrival has: the earlier acts finished, at least level ${kitFor(n).level} with that act's powers and weapons, and the chapters before this one in the act caught up. Nothing is taken away, and jumping back does not undo later chapters.`; }
  else if(kind==='finish'||kind==='skip'){ const T=chStepTarget(); if(T.why){ chMsg(kind,T.why); return; } title=kind==='finish'?'Finish this step?':'Skip this step\'s scene?';
    text=`${T.who}: “${T.txt}”. `+(kind==='finish'?'It is done as if Ash did it: its scene plays and the story moves on.':'It is done without its scene. The clues, items and flags from it still come, and the story moves on.'); }
  else if(kind==='boss'){ const B=chBossTarget(); if(!B){ chMsg('boss','There is no boss fight here right now.'); return; } title=`Beat ${chBossName(B)} now?`; text='The fight ends through the boss\'s own ending: its scenes, rewards and the story after it still come.'; }
  else return;
  CHT.conf={kind,arg};
  const j=chEmptySlot(), cp=CHT.copied;
  const copy=cp>=0?`<p class="chnote">Copied: Journey ${cp+1} is this journey from before the change.</p>`:j>=0?'':'<p class="chnote">There is no empty journey slot to copy into. Delete one on the title screen to make room.</p>';
  box.innerHTML=`<p><b>${chEsc(title)}</b></p><p>${chEsc(text)} This changes Journey ${curSlot+1} for good, and it is saved.</p>${copy}<div class="chbtns">`
    +(j>=0&&cp<0?`<button type="button" class="btn c sm" data-conf="copy">Copy this journey to Journey ${j+1} first</button>`:'')
    +`<button type="button" class="btn c sm hot" data-conf="yes">Yes, change the journey</button><button type="button" class="btn c sm" data-conf="no">Cancel</button></div>`;
  box.hidden=false;
  try{ box.scrollIntoView({block:'nearest'}); }catch(e){}
  const f=box.querySelector('[data-conf="no"]'); if(f) try{ f.focus({preventScroll:true}); }catch(e){}
  SFX.play('ui');
}
function chConfirm(v){
  const box=document.getElementById('chConf'), C=CHT.conf;
  if(v==='copy'){ const j=chCopyJourney(); CHT.copied=j; if(C) chAsk(C.kind,C.arg); if(j>=0){ setBanner('Journey copied',`Journey ${j+1} keeps this journey as it is now`,2); SFX.play('quest'); } return; }
  CHT.conf=null; if(box){ box.hidden=true; box.innerHTML=''; }
  if(v!=='yes'||!C){ SFX.play('ui'); return; }
  CHT.copied=-1;
  let why=null;
  // Ash goes back to the game first; the change runs on the next play frame, so its scenes play over the world
  if(C.kind==='jump'){ why=chJump(C.arg); if(!why){ chResume(); SFX.play('quest'); } }
  else { const T=C.kind==='boss'?null:chStepTarget(); if(T&&T.why) why=T.why; else if(C.kind==='boss'&&!chBossTarget()) why='There is no boss fight here right now.';
    if(!why){ chResume(); const k=C.kind; later(0.1,()=>{ let w=null; try{ w=k==='finish'?chFinish():k==='skip'?chSkip():chBeatBoss(); }catch(e){ console.error(e); w='That did not work: '+e.message; } if(w) setBanner('Cheats',w,2.4); }); } }
  if(why){ chMsg(C.kind==='jump'?'jump':C.kind,why); SFX.play('ui'); }
}

// ---------- the "Cheats on" chip: hangs from the top left edge, above the HUD panels (the HUD starts 14 px down from the
// safe area on every device, the touch buttons are at the bottom), while any switch is on and the game is in play
function chChip(){
  let c=CHT.chip;
  const want=chAny()&&!!G&&scene==='play';
  if(!want){ if(c&&!c.hidden) c.hidden=true; return; }
  if(!c){ chCss(); c=document.createElement('button'); c.type='button'; c.id='cheatChip'; c.setAttribute('aria-label','Cheats are on. Open them in Settings');
    c.addEventListener('click',chChipTap); for(const ev of ['touchstart','pointerdown','mousedown']) c.addEventListener(ev,e=>e.stopPropagation(),{passive:true});
    document.body.appendChild(c); CHT.chip=c; }
  const t='Cheats on'+(chOn('fps')&&CHT.fps.v?` · ${CHT.fps.v} fps`:'');
  if(c.textContent!==t) c.textContent=t;
  if(c.hidden) c.hidden=false;
}
function chChipTap(e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  try{ if(CHT.chip) CHT.chip.blur(); }catch(err){}
  if(!chAdmin()||scene!=='play') return;
  try{ SFX.init(); SFX.play('ui'); }catch(err){}
  pauseGame(); openSettings('pause'); chReveal();
}
// Settings opens at the Cheats: the section is scrolled into view (with the controller, the ring goes to its first button)
function chReveal(){
  const sec=chBuild(); if(!sec) return;
  chSync();
  requestAnimationFrame(()=>{ try{ const o=document.getElementById('settings'), r=sec.getBoundingClientRect(), ro=o.getBoundingClientRect(); o.scrollTop+=r.top-ro.top-12;
    if(typeof padActive==='function'&&padActive()&&typeof navFocus==='function') navFocus(document.getElementById('chOffAll').disabled?sec.querySelector('.chgh'):document.getElementById('chOffAll')); }catch(e){} });
}

// ---------- hit boxes and sight (drawn over the world, after the floating words)
function chDrawBoxes(){
  if(!chOn('boxes')||!G||!player||scene==='menu') return;
  const p=player, g=ctx, z=zoom||1, lw=2.2/z, night=isNight();
  g.save(); g.lineWidth=lw; g.setLineDash([]);
  const circ=(x,y,r)=>{ g.beginPath(); g.arc(x,y,Math.max(1,r),0,TAU); g.stroke(); };
  // walls near Ash: the colliders round him (low ones dashed: a jump clears them)
  try{ g.strokeStyle='rgba(200,200,210,.55)'; forCols(p.x,p.y,320,c=>{ if(!colActive(c)) return; g.setLineDash(c.low?[5/z,4/z]:[]); if(c.t==='c') circ(c.x,c.y,c.r); else g.strokeRect(c.x0,c.y0,c.x1-c.x0,c.y1-c.y0); }); }catch(e){}
  g.setLineDash([]);
  // Ash: his body and the way he faces
  g.strokeStyle='rgba(80,220,255,.95)'; circ(p.x,p.y,p.r||14);
  g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x+Math.cos(p.facing)*((p.r||14)+22),p.y+Math.sin(p.facing)*((p.r||14)+22)); g.stroke();
  for(const e of G.enemies){
    if(e.dead||e.frozen||!inView(e.x,e.y,140)) continue;
    const boss=(()=>{ try{ return isBossFoe(e); }catch(err){ return !!e.boss; } })();
    g.setLineDash([]); g.strokeStyle=boss?'rgba(255,90,210,.95)':'rgba(255,72,60,.95)';
    g.fillStyle=boss?'rgba(255,90,210,.16)':'rgba(255,72,60,.16)';
    try{ for(const c of hitCircles(e)){ g.beginPath(); g.arc(c.x,c.y,Math.max(1,c.r),0,TAU); g.fill(); g.stroke(); } }catch(err){ circ(e.x,e.y,e.r||12); }
    if(!e.aggro&&!boss&&!e.passive){ const R=(e.type==='wolf'?(night?460:300):(night?300:380))*((G.diff&&G.diff.aggro)||1); g.setLineDash([8/z,7/z]); g.strokeStyle='rgba(255,170,90,.35)'; circ(e.x,e.y,R); }
    const d=dist(e.x,e.y,p.x,p.y);
    if(d<1100&&!p.dead){
      let t=Infinity; try{ t=(!AREA&&e.flying)?Infinity:losHitT(e.x,e.y,p.x,p.y,p.r,{lt:elevOf(p),fly:!AREA&&!!p.flying}); }catch(err){}
      const clear=t===Infinity, ux=(p.x-e.x)/(d||1), uy=(p.y-e.y)/(d||1), ex=clear?p.x:e.x+ux*t, ey=clear?p.y:e.y+uy*t;
      g.setLineDash(clear?[]:[6/z,5/z]); g.strokeStyle=clear?'rgba(110,255,140,.85)':'rgba(255,210,70,.85)';
      g.beginPath(); g.moveTo(e.x,e.y); g.lineTo(ex,ey); g.stroke();
      if(!clear){ g.setLineDash([]); const s=6/z; g.beginPath(); g.moveTo(ex-s,ey-s); g.lineTo(ex+s,ey+s); g.moveTo(ex-s,ey+s); g.lineTo(ex+s,ey-s); g.stroke(); }
    }
  }
  g.setLineDash([]);
  for(const pr of G.projectiles||[]){ if(pr.dead||!inView(pr.x,pr.y,40)) continue; g.strokeStyle=pr.owner==='player'||pr.friendly||pr.mine?'rgba(120,180,255,.95)':'rgba(255,150,40,.95)'; circ(pr.x,pr.y,pr.r||5); }
  g.strokeStyle='rgba(255,235,80,.8)';
  for(const h of (G.hazards||[]).concat(G.pools||[])){ if(!h||!(h.r>0)||!inView(h.x,h.y,h.r+20)) continue; circ(h.x,h.y,h.r); }
  for(const r of G.rings||[]){ if(!r||!(r.r>0)) continue; circ(r.x,r.y,r.r); }
  g.restore();
}

// ---------- the hooks (installed once everything has loaded)
function chInit(){
  if(CHT.ready) return; CHT.ready=true;
  // God mode rides on the game's own switch (window.__eb.god, which every damage path already checks). The drivers' own
  // setting of it stays (raw); an Arena run with it on is cheated.
  try{ const E=window.__eb; if(E){ CHT.rawGod=!!E.god; Object.defineProperty(E,'god',{configurable:true,enumerable:true,
    get(){ return CHT.rawGod||chOn('god'); }, set(v){ CHT.rawGod=!!v; if(CHT.rawGod&&G&&G.mode==='normal') G.cheated=true; }}); } }catch(e){}
  { const base=playerDied; playerDied=function(){ if(chOn('god')&&player&&G){ player.dead=false; player.hp=player.hpShow=Math.max(player.hp||0,player.maxHp); return; } return base.apply(this,arguments); }; }
  // a new run: the Arena started from here, or with the drivers' god on, is cheated from its first frame (before it asks
  // for a score ticket)
  { const base=newRun; newRun=function(mode){ const r=base.apply(this,arguments); try{ if(G&&mode==='normal'&&(CHT.arenaTaint||CHT.rawGod||chAny())) G.cheated=true; }catch(e){} return r; }; }
  // every frame: mark the run, keep the meters full, undo any damage that got past God mode, hold the clock
  { const base=update; update=function(dt){
      if(CHT.rawGod&&G&&G.mode==='normal') G.cheated=true;
      if(!chAnyRaw()) return base.apply(this,arguments);
      if(!chAdmin()){ chAdminSync(); return base.apply(this,arguments); }
      chTaint();
      const p0=player, hp0=p0?p0.hp:0, tod0=G?G.tod:0, fr=CHT.on.freeze&&G&&G.mode==='story';
      if(CHT.on.endless) chFill(p0);
      // the walls let Ash through for the whole frame (the foes' push-apart pass in updateEnemies checks walls for him too)
      CHT.nc=CHT.on.noclip; CHT.gp=CHT.on.gates&&!!G&&G.mode==='story';
      try{ return base.apply(this,arguments); }
      finally{ CHT.nc=false; CHT.gp=false; if(player===p0&&p0){ if(CHT.on.god&&!p0.dead&&p0.hp<hp0) p0.hp=Math.min(p0.maxHp,hp0); if(CHT.on.endless) chFill(p0); } if(fr&&G) G.tod=tod0; }
    }; }
  // Endless flasks: a drink never uses one up (and works with none left). Fast feet: the speed stat is raised only for
  // the length of the call (snapshotPlayer below saves the real one). Walk through walls and Open gates: Ash's own move
  // skips the walls (or only the gates)
  { const base=updatePlayer; updatePlayer=function(dt,inp){
      const p=player; if(!p||!G||!chAnyRaw()||!chAdmin()) return base.apply(this,arguments);
      const end=CHT.on.endless, nc=CHT.on.noclip, gp=CHT.on.gates&&G.mode==='story'; let p0=0, pre=0, bump=false;
      if(end){ p0=p.potions; if(!(p.potions>=1)&&p.potionsMax>0){ p.potions=1; bump=true; } pre=p.potions; chFill(p); }
      const st=CHT.on.fast&&p.stats&&p.stats.speed>0?p.stats:null; if(st){ st.speed*=CH_FAST; CHT.boost=st; }
      let gz=null; if(gp&&typeof GT!=='undefined'){ gz=[GT.zones,GT.fly,GT.water]; GT.zones=[]; GT.fly=[]; GT.water=[]; }
      const nc0=CHT.nc, gp0=CHT.gp; CHT.nc=nc; CHT.gp=gp;
      try{ return base.apply(this,arguments); }
      finally{
        CHT.nc=nc0; CHT.gp=gp0; if(gz){ GT.zones=gz[0]; GT.fly=gz[1]; GT.water=gz[2]; }
        if(st){ st.speed/=CH_FAST; CHT.boost=null; }
        if(end&&player===p){ if(p.potions===pre-1||(bump&&p.potions===pre)) p.potions=p0; chFill(p); }
      } }; }
  { const base=snapshotPlayer; snapshotPlayer=function(){ const st=CHT.boost; if(st&&player&&player.stats===st){ st.speed/=CH_FAST; try{ return base.apply(this,arguments); } finally{ st.speed*=CH_FAST; } } return base.apply(this,arguments); }; }
  // walking through walls: no colliders, no water or cliff stops for Ash; the edges of the map and of the room still hold
  // (boundE). With the gates open, only the gate pieces let him through.
  { const base=collideObs; collideObs=function(e){ if(player&&e===player){ if(CHT.nc) return; if(CHT.gp){ CHT.gpc=true; try{ return base.apply(this,arguments); } finally{ CHT.gpc=false; } } } return base.apply(this,arguments); }; }
  { const base=terrainFix; terrainFix=function(e){ if(CHT.nc&&player&&e===player) return; return base.apply(this,arguments); }; }
  { const base=playerBlocked; playerBlocked=function(x,y){ if(CHT.nc){ if(x>=IZX-50){ const A=AREA, r=(player&&player.r)||14; return !A||x<A.x0+r||x>A.x1-r||y<A.y0+r||y>A.y1-r; } return outOfMap(x,y,30); } return base.apply(this,arguments); }; }
  { const base=landBad; landBad=function(){ if(CHT.nc) return null; return base.apply(this,arguments); }; }
  // Strong hits and One-hit kills (Ash's own hits: not a companion's or Pip's)
  { const base=damageEnemy; damageEnemy=function(e,amt,o){
      if(!e||e.dead||!(amt>0)||!chAnyRaw()||!chAdmin()) return base.apply(this,arguments);
      const src=o&&o.src; if(src==='comp'||src==='pip'||chPipShot(o)) return base.apply(this,arguments);
      const strong=CHT.on.strong, one=CHT.on.onehit;
      if(!strong&&!one) return base.apply(this,arguments);
      let boss=false; try{ boss=!!(e.boss||(G&&G.boss===e)||isBossFoe(e)); }catch(err){ boss=!!e.boss; }
      if(!boss){ const h0=e.hp, r=base(e,strong?amt*CH_STRONG:amt,o); if(one&&!e.dead&&e.hp<h0&&!e.passive) killEnemy(e); return r; }
      if(!strong) return base.apply(this,arguments);
      const fl=chBossFloor(e), h0=CHT.hitE, f0=CHT.floor; CHT.hitE=e; CHT.floor=fl;
      try{ const r=base(e,amt*CH_STRONG,o); if(fl!=null&&!e.dead&&e.hp<fl) e.hp=fl; return r; }
      finally{ CHT.hitE=h0; CHT.floor=f0; } }; }
  { const base=killEnemy; killEnemy=function(e){ if(e&&!e.dead&&CHT.hitE===e&&CHT.floor!=null){ e.hp=Math.max(1,CHT.floor); return; } return base.apply(this,arguments); }; }
  // Wings anywhere: flight and the hop to take off, without the ability being granted (hasAbil stays false, so the
  // story never sees wings); his wings are drawn while it is on
  { const base=canFlyHere; canFlyHere=function(){
      if(chOn('wings')&&G&&G.mode==='story'&&!hasAbil('wings')){ if(AREA) return !!(AREA.canFly||(AREA.def&&AREA.def.canFly)); return !(G.boss&&!G.boss.dead); }
      return base.apply(this,arguments); }; }
  { const base=canJump; canJump=function(){ if(chOn('wings')&&G&&G.mode==='story') return true; return base.apply(this,arguments); }; }
  const wingsLook=base=>function(){
    if(!chOn('wings')||!G||G.mode!=='story'||!G.abil||G.abil.wings) return base.apply(this,arguments);
    const A=G.abil, had=Object.prototype.hasOwnProperty.call(A,'wings'), v0=A.wings;
    A.wings=true; try{ return base.apply(this,arguments); } finally{ if(had) A.wings=v0; else delete A.wings; } };
  drawPlayer=wingsLook(drawPlayer); drawMoveHud=wingsLook(drawMoveHud);
  // a gate nook reached by a cheat (wings, walls, open gates) is not recorded as passed with the power
  if(typeof gtGot==='function'){ const base=gtGot; gtGot=function(g,v){ if(v===1&&(chOn('wings')||chOn('noclip')||chOn('gates'))&&g&&g.K&&g.K.power&&!gtHas(g.K.power)) return; return base.apply(this,arguments); }; }
  // Open gates: a gate the real sync closes again (a load, a story change) opens again for the session
  if(typeof gtSync==='function'){ const base=gtSync; gtSync=function(g){ const r=base.apply(this,arguments); try{ if(chOn('gates')&&G&&G.mode==='story'&&g&&gtSt(g.id)<2){ const before=new Set(Object.keys(G.found||{})); chGateOpenLook(g); for(const k in (G.found||{})) if(!before.has(k)) CHT.gFound.add(k); } }catch(e){} return r; }; }
  { const base=refreshCaveGates; refreshCaveGates=function(){ const r=base.apply(this,arguments); try{ const A=AREA; if(chOn('gates')&&A){ for(const o of A.gates||[]) o.closed=false; if(A.p4&&A.p4.vines) for(const o of A.p4.vines) o.closed=false; } }catch(e){} return r; }; }
  { const base=doorLockText; doorLockText=function(d){ if(!chOn('gates')||!d) return base.apply(this,arguments); const def=AREADEFS[d.area]; if(def&&def.trial) return base.apply(this,arguments); return chPassing(d,()=>base(d)); }; }
  { const base=enterArea; enterArea=function(id,door){ if(!chOn('gates')||!door||!G||G.mode!=='story') return base.apply(this,arguments); const def=AREADEFS[id]; if(def&&def.trial) return base.apply(this,arguments); return chPassing(door,()=>base(id,door)); }; }
  if(typeof s10Door==='function'){ const base=s10Door; s10Door=function(P){ if(!chOn('gates')||!P||P.need==null) return base.apply(this,arguments); const n=P.need; P.need=null; try{ return base.apply(this,arguments); } finally{ P.need=n; } }; }
  // Peaceful: foes (not bosses) lose interest every frame and cannot spot Ash
  { const calm=()=>{ for(const e of G.enemies){ if(e.dead||e.boss||G.boss===e) continue; if(e.aggro){ e.aggro=false; e.tele=null; } } };
    const base=updateEnemies; updateEnemies=function(dt){
      if(!chOn('peace')||!G||!G.enemies) return base.apply(this,arguments);
      const D=G.diff, had=!!D&&Object.prototype.hasOwnProperty.call(D,'aggro'), a0=D?D.aggro:undefined;
      calm(); if(D) D.aggro=1e-9;
      try{ return base.apply(this,arguments); }
      finally{ if(D){ if(had) D.aggro=a0; else delete D.aggro; } calm(); } }; }
  // Show every room
  if(typeof roomLifted==='function'){ const base=roomLifted; roomLifted=function(R){ if(chOn('rooms')&&AREA&&AREA.rooms) return true; return base.apply(this,arguments); }; }
  // Reveal the map: no fog on the big map (the fog itself is never touched), and its legend entries are not kept
  CHT.fogReal=fogSeen;
  { const base=fogSeen; fogSeen=function(k,x,y){ if(chOn('reveal')&&scene==='map') return 1; return base.apply(this,arguments); }; }
  if(typeof mapHdFog==='function'){ const base=mapHdFog; mapHdFog=function(){ if(chOn('reveal')&&scene==='map') return null; return base.apply(this,arguments); }; }
  if(typeof mapOldFog==='function'){ const base=mapOldFog; mapOldFog=function(g,k,F,ground){ if(chOn('reveal')&&scene==='map'){ if(ground){ const O=ovOf(k); if(O&&O.cv){ g.imageSmoothingEnabled=true; g.drawImage(O.cv,F.ox,F.oy,F.w,F.h); } } return; } return base.apply(this,arguments); }; }
  if(typeof mapHdSeen==='function'){ const base=mapHdSeen; mapHdSeen=function(){ if(chOn('reveal')&&scene==='map') return true; return base.apply(this,arguments); }; }
  { const base=drawMapScreen; drawMapScreen=function(){ if(!chOn('reveal')||!G) return base.apply(this,arguments); const L0=G.mapLeg; G.mapLeg=Object.assign({},L0||{}); try{ return base.apply(this,arguments); } finally{ G.mapLeg=L0; } }; }
  // hit boxes over the world, frames per second
  { const base=drawTexts; drawTexts=function(){ const T=CHT.on.boxes?ctx.getTransform():null; const r=base.apply(this,arguments); if(T) try{ ctx.setTransform(T); chDrawBoxes(); }catch(e){ console.error(e); } return r; }; }
  { const base=render; render=function(){ const r=base.apply(this,arguments); if(CHT.on.fps){ const F=CHT.fps, now=performance.now(); F.n++; if(!F.t) F.t=now; if(now-F.t>=500){ F.v=Math.round(F.n*1000/(now-F.t)); F.n=0; F.t=now; } } return r; }; }
  // the save: no switch goes in it; what the open gates and doors wrote for the session is left out; a real change marks it
  { const base=saveData; saveData=function(){ const s=base.apply(this,arguments); try{
      if(s&&(CHT.tmpFound.size||CHT.gFound.size)&&s.found){ s.found=Object.assign({},s.found); for(const k of CHT.tmpFound) delete s.found[k]; for(const k of CHT.gFound) if(!chGateKeyReal(k)) delete s.found[k]; }
      if(s&&G&&G.cheatSaved) s.cheated=true; }catch(e){} return s; }; }
  { const base=loadGame; loadGame=function(s){ const r=base.apply(this,arguments); try{ if(G){ G.cheatSaved=!!(s&&s.cheated); G.cheated=G.cheatSaved; } if(chOn('gates')) chGates(true); }catch(e){} return r; }; }
  // Settings: the section is there only for a confirmed admin, asked again when the answer is old
  { const base=openSettings; openSettings=function(){ const r=base.apply(this,arguments); try{ CHT.conf=null; CHT.copied=-1; const b=document.getElementById('chConf'); if(b){ b.hidden=true; b.innerHTML=''; }
      chAdminSync();
      if(Cloud.signedIn&&!Cloud.viewing) Cloud.adminCheck().then(()=>chAdminSync(),()=>chAdminSync()); }catch(e){} return r; }; }
  { const base=mapHintSet; mapHintSet=function(){ const r=base.apply(this,arguments); try{ if(chOn('tp')){ const h=document.getElementById('mapHint'); if(h) h.textContent=`Teleport is on: ${usingTouch||coarsePtr()?'tap':'click'} a spot on the map to go there.`; } }catch(e){} return r; }; }
  try{ Cloud.onChange(()=>{ try{ chAdminSync(); chChip(); }catch(e){} }); }catch(e){}
  setInterval(()=>{ try{
    if(chAnyRaw()&&!chAdmin()) chAdminSync();
    chChip();
    if(chOn('gates')&&G&&G.mode==='story'&&GT&&GT.list&&GT.list.some(g=>!g._chOpen&&gtSt(g.id)<2)) chGates(true);
    if(CHT.tpMsgT&&performance.now()-CHT.tpMsgT>3500){ CHT.tpMsgT=0; if(scene==='map') mapHintSet(); }
    if(chSettingsOpen()){ if(document.getElementById('cheatSec')) chSync(); else if(chAdmin()&&chBuild()) chSync(); }
  }catch(e){} },400);
}
Promise.resolve().then(()=>{ try{ chInit(); }catch(e){ console.error('cheats',e); } });
// test hooks: read-only state (nothing here turns a cheat on; the switches are only in the admin's Settings)
window.__ebDbg=Object.assign(window.__ebDbg||{},{
  cheats:()=>({admin:chAdmin(),sec:!!document.getElementById('cheatSec'),on:Object.assign({},CHT.on),any:chAny(),cheated:!!(G&&G.cheated),saved:!!(G&&G.cheatSaved),
    god:!!(window.__eb&&window.__eb.god),chip:!!(CHT.chip&&!CHT.chip.hidden),chipText:CHT.chip?CHT.chip.textContent:'',fps:CHT.fps.v,tmpFound:[...CHT.tmpFound],gFound:[...CHT.gFound]}),
  chTp:(V,x,y)=>chTpWhy(V,x,y)||chTpBlocked(V,x,y)||'ok', chFloor:e=>chBossFloor(e,true),
  chMap:()=>({view:MAPUI.view,maps:MAPS.map(M=>M?{w:M.w,h:M.h,y0:M.y0}:null)}),
  chMapPt:(x,y)=>{ const F=mapFit(MAPUI.view), r=mapCv.getBoundingClientRect(); return {x:r.left+(F.ox+x*F.s)/mapCv.width*r.width,y:r.top+(F.oy+(y-F.y0)*F.s)/mapCv.height*r.height}; },
  chPlaces:()=>chPlaces().map(q=>Object.assign({},q)),
  chJumps:n=>chJumpList(n).map(q=>Object.assign({},q)),
  chStep:()=>{ const T=chStepTarget(); return T.why?{why:T.why}:{who:T.who,txt:T.txt,kind:T.s._kind,step:T.s._id,run:T.R.key}; },
  chKit:()=>{ const K=chKitSoFar(); return {abil:K.abil.slice(),weapons:K.weapons.slice()}; },
  chBoss:()=>{ const b=chBossTarget(); return b?{type:b.type,hp:b.hp,name:chBossName(b)}:null; }
});
