
// ================= hidden cheats (v12): God mode and cheats for Drew, on a desktop keyboard only
// HOW IT OPENS: with the Settings screen open and no text field focused, type CHEAT_WORD on a real keyboard. A soft
// chime plays and a "Cheats" section appears at the bottom of Settings for this session. Nothing shows before that,
// and touch screens never see it. To change the word, change CHEAT_WORD (letters only, any length from 4 up).
const CHEAT_WORD='emberlord';
// The file name puts it in the build (build.mjs adds every game/src/v10_art*.js after e10c_gates). It wraps the
// game's functions only once everything has loaded (chInit, a microtask after the script), so it sits outside every
// other module's wrappers whatever the load order is.
// Rules: every switch is for this session only (a reload turns them all off). Switches never write to the save; the
// three labelled buttons and Time of day are real changes. Using any cheat marks the journey (G.cheated, kept in the
// save) and the Arena posts no score for a run that used one (a9b_flow.js showDeath, a13_cloud.js submitScore).
// None of it works in a "View as" session from the admin page (Cloud.viewing).
const CH_STRONG=10, CH_FAST=1.6;
const CHT={open:false,buf:'',bufAt:0,on:{god:false,endless:false,strong:false,fast:false,wings:false,peace:false,tp:false},
  hitE:null,floor:null,boost:null,el:null,chip:null,tpMsgT:0,ready:false};
const CH_SW=[
  ['god','God mode','Ash takes no damage and cannot die: foes, bosses, falls, lava, water and traps.'],
  ['endless','Endless flasks, stamina and fire','Drinking never uses up a flask. Stamina and fire breath stay full.'],
  ['strong','Strong hits','Ash hits 10 times as hard. Bosses still stop at every phase, so each scene plays.'],
  ['fast','Fast feet','Ash moves about 1.6 times as fast.'],
  ['wings','Wings anywhere','Ash can fly before he has earned his wings. Only while this is on, never saved.'],
  ['peace','Peaceful','Foes do not notice or attack Ash. Bosses still fight.'],
  ['tp','Map teleport','Click a spot on the big map (M) to go there. Only places Ash has seen, never past a shut gate, never in a boss fight.']];
const CH_TOD=[['Morning',0.3],['Noon',0.5],['Evening',0.74],['Night',0.92]];
const chBlocked=()=>!!(typeof Cloud!=='undefined'&&Cloud&&Cloud.viewing);
const chOn=k=>!!CHT.on[k]&&!chBlocked();
function chAny(){ for(const k in CHT.on) if(CHT.on[k]) return true; return false; }
function chInGame(){ return !!(G&&player&&(G.mode==='story'||G.mode==='normal')&&scene!=='menu'); }
// mark the journey: G.cheated, and (story) the one field in the stored save, so a reload keeps the mark
function chMark(){
  if(!chInGame()||G.cheated||chBlocked()) return;
  G.cheated=true;
  if(G.mode!=='story') return;
  try{ const K=SLOT_KEYS[curSlot], s=store.get(K,null); if(s&&typeof s==='object'&&s.v===3&&!s.deleted&&!s.cheated){ s.cheated=true; store.set(K,s); Cloud.queueSave(packSaves()); } }catch(e){}
}
function chFill(p){ if(!p) return; p.stamina=p.maxStamina; p.stamDelay=0; p.energy=p.maxEnergy; p.exhausted=false; p.regenDelay=0; }
function chAllOff(){ let any=false; for(const k in CHT.on){ if(CHT.on[k]) any=true; CHT.on[k]=false; } if(any){ chSync(); chChip(); } }
// ---------- the soft chime (on the Sounds bus, so it follows the Sounds slider and mute)
function chChime(){
  try{ SFX.init(); const ac=SFX.ac; if(!ac||SFX.muted) return;
    const t0=ac.currentTime+0.02, out=ac.createGain(); out.gain.value=0.2; out.connect(ac.destination);
    [880,1318.5,1760].forEach((f,i)=>{ const o=ac.createOscillator(), g=ac.createGain(), t=t0+i*0.1; o.type='sine'; o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.5,t+0.015); g.gain.exponentialRampToValueAtTime(0.0008,t+1.1);
      o.connect(g); g.connect(out); o.start(t); o.stop(t+1.15); });
  }catch(e){}
}
// ---------- the word: typed on a real keyboard while Settings is open, no text field focused
function chTextFocus(){
  const a=document.activeElement; if(!a||a===document.body) return false;
  if(a.isContentEditable||a.tagName==='TEXTAREA'||a.tagName==='SELECT') return true;
  if(a.tagName==='INPUT') return !/^(range|checkbox|radio|button|submit|reset|color)$/i.test(a.type||'text');
  return false;
}
function chSettingsOpen(){ const o=document.getElementById('settings'); return !!(o&&o.classList.contains('on')); }
addEventListener('keydown',e=>{
  try{
    if(CHT.open||!e.isTrusted||e.repeat||e.ctrlKey||e.metaKey||e.altKey) return;
    if(!chSettingsOpen()||chTextFocus()||chBlocked()) return;
    const k=typeof e.key==='string'&&e.key.length===1?e.key.toLowerCase():'';
    if(!/^[a-z]$/.test(k)){ CHT.buf=''; return; }
    const now=performance.now(); if(now-CHT.bufAt>2500) CHT.buf=''; CHT.bufAt=now;
    CHT.buf=(CHT.buf+k).slice(-CHEAT_WORD.length);
    if(CHT.buf===CHEAT_WORD.toLowerCase()){ CHT.buf=''; chUnlock(); }
  }catch(err){}
},true);
// ---------- the Cheats section (built here so body.html stays as it is)
function chCss(){
  if(document.getElementById('cheatCss')) return;
  const s=document.createElement('style'); s.id='cheatCss';
  s.textContent=`#cheatSec{margin-top:18px;padding-top:6px;border-top:2px solid var(--edge);text-align:left}
#cheatSec h3{margin:6px 0 2px;font-size:17px;letter-spacing:.04em;color:var(--gold)}
#cheatSec .chtop{margin:0 0 4px;font-size:12px;color:var(--muted);line-height:1.4}
#cheatSec .chstat{margin:2px 0 0;font-size:12px;color:var(--gold)}
#cheatSec .chbtns{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto}
#cheatSec .chbtns .btn{width:auto;flex:none;padding:7px 11px;font-size:13px}
#cheatSec .btn:disabled{opacity:.45;cursor:default}
#cheatChip{position:fixed;z-index:6;top:max(10px,env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);padding:3px 10px 4px;border-radius:999px;
  font:700 11px/1.2 ${UIF};letter-spacing:.06em;text-transform:uppercase;color:#ffe6b8;background:rgba(120,30,16,.82);border:1px solid rgba(255,170,90,.6);
  pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.35)}
@media (max-width:899px),(hover:none){#cheatChip{display:none!important}}`;
  document.head.appendChild(s);
}
function chBuild(){
  const panel=document.querySelector('#settings .panel'); if(!panel) return null;
  let sec=document.getElementById('cheatSec'); if(sec) return sec;
  chCss();
  sec=document.createElement('div'); sec.id='cheatSec'; sec.setAttribute('role','group'); sec.setAttribute('aria-label','Cheats');
  const seg=(id,label)=>`<div class="seg" role="group" aria-label="${label}" data-ch="${id}"><button type="button" data-v="on" aria-pressed="false">On</button><button type="button" data-v="off" aria-pressed="true">Off</button></div>`;
  sec.innerHTML=`<h3>Cheats</h3><p class="chtop">For testing. Every switch turns off when the page reloads. Using any cheat marks this journey, and an Arena run that used one posts no score.</p>`
    +CH_SW.map(([id,label,note])=>`<div class="setrow"><span>${label}<small>${note}</small></span>${seg(id,label)}</div>`).join('')
    +`<div class="setrow"><span>Time of day<small>Sets the clock now (a real change). It keeps running from there.</small></span><div class="chbtns" data-chg="tod">${CH_TOD.map(([n],i)=>`<button type="button" class="btn c sm" data-tod="${i}">${n}</button>`).join('')}</div></div>`
    +`<div class="setrow"><span>Real changes<small>These change the journey for real and are saved.</small><small class="chstat" id="cheatStat" hidden></small></span><div class="chbtns" data-chg="act"><button type="button" class="btn c sm" data-act="coins">+500 coins</button><button type="button" class="btn c sm" data-act="level">+1 level</button><button type="button" class="btn c sm" data-act="refill">Refill everything</button></div></div>`;
  // the bottom of Settings: right above the Done button
  const done=document.getElementById('bSettingsClose'); let ref=done; while(ref&&ref.parentElement!==panel) ref=ref.parentElement;
  if(ref) panel.insertBefore(sec,ref); else panel.appendChild(sec);
  for(const g of sec.querySelectorAll('.seg[data-ch]')) for(const b of g.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); chSet(g.dataset.ch,b.dataset.v==='on'); SFX.play('ui'); });
  for(const b of sec.querySelectorAll('button[data-tod]')) b.addEventListener('click',()=>{ SFX.init(); chTime(CH_TOD[+b.dataset.tod][1]); SFX.play('ui'); });
  for(const b of sec.querySelectorAll('button[data-act]')) b.addEventListener('click',()=>{ SFX.init(); chAct(b.dataset.act); });
  return sec;
}
function chUnlock(){
  if(CHT.open||chBlocked()) return;
  const sec=chBuild(); if(!sec) return;
  CHT.open=true; chSync(); chChime();
  try{ sec.scrollIntoView({block:'nearest',behavior:'smooth'}); }catch(e){}
}
function chSync(){
  const sec=document.getElementById('cheatSec'); if(!sec) return;
  if(chBlocked()){ sec.remove(); CHT.open=false; return; }
  for(const g of sec.querySelectorAll('.seg[data-ch]')){ const on=!!CHT.on[g.dataset.ch]; for(const b of g.querySelectorAll('button')) b.setAttribute('aria-pressed',String((b.dataset.v==='on')===on)); }
  const live=chInGame(), story=live&&G.mode==='story';
  for(const b of sec.querySelectorAll('button[data-tod]')) b.disabled=!story;
  for(const b of sec.querySelectorAll('button[data-act]')) b.disabled=b.dataset.act==='refill'?!live:!story;
  const st=document.getElementById('cheatStat'); if(st){ st.hidden=story; st.textContent=live?'Coins, levels and the clock are for story journeys.':'Start or continue a journey to use these.'; }
}
function chSet(k,on){
  if(!(k in CHT.on)||chBlocked()) return false;
  on=!!on; if(CHT.on[k]===on){ chSync(); return on; }
  CHT.on[k]=on;
  if(on) chMark();
  else chOff(k);
  chSync(); chChip(); return on;
}
// switching off puts things back the way they were (the speed boost and the wing checks only live inside calls)
function chOff(k){
  if(!G||!player) return;
  if(k==='wings'&&!hasAbil('wings')&&player.flying&&!player.landing&&!player.gliding) player.landing=true;
}
function chTime(t){ if(!chInGame()||G.mode!=='story'||chBlocked()) return; G.tod=t; chMark(); }
function chAct(a){
  if(!chInGame()||chBlocked()) return;
  const p=player, story=G.mode==='story';
  if(a==='coins'&&story){ addCoins(500,p.x,p.y); setBanner('+500 coins',`${G.coins} coins`,1.6); }
  else if(a==='level'&&story){ const L=p.level; let n=0; while(p.level===L&&n++<4) gainXp(Math.max(1,xpNeed(p.level)-p.xp+1)); setBanner('+1 level',`Level ${p.level}`,1.6); SFX.play('quest'); }
  else if(a==='refill'){ p.hp=p.hpShow=p.maxHp; p.potions=p.potionsMax; chFill(p); p.roar=100; if(p.stats) p.stats.phoenix=p.stats.phoenixMax||0; if(p.flyE!=null) p.flyE=flyMax(); setBanner('Refilled','Health, flasks, stamina and fire',1.6); SFX.play('drink'); }
  else return;
  chMark(); if(story) saveGame();
}
// ---------- the chip in the HUD corner (desktop sizes only; the CSS hides it on narrow and touch screens)
function chChip(){
  let c=CHT.chip;
  const want=chAny()&&!chBlocked()&&!!G&&scene!=='menu'&&!usingTouch;
  if(!want){ if(c) c.hidden=true; return; }
  if(!c){ chCss(); c=document.createElement('div'); c.id='cheatChip'; c.textContent='Cheats on'; c.setAttribute('aria-hidden','true'); document.body.appendChild(c); CHT.chip=c; }
  c.hidden=false;
}
// ---------- map teleport
function chTpSay(t){ const h=document.getElementById('mapHint'); if(!h) return; h.textContent=t; CHT.tpMsgT=performance.now(); }
function chTpWhy(V,x,y){
  if(!G||G.mode!=='story') return 'Teleport works in a story journey.';
  if((G.boss&&!G.boss.dead)||G.fightSite||G.fightIntro) return 'Not during a boss fight.';
  if(G.mini||G.fishing) return 'Not in the middle of a game.';
  if(V==null||V<0||!MAPS[V]) return 'Teleport works on the world maps, not the dungeon page.';
  if(!mapsSeenList().includes(V)) return 'Ash has not found this map yet.';
  const M=MAPS[V]; if(x<40||x>M.w-40||y<M.y0+40||y>M.y0+M.h-40) return 'That is off the map.';
  if(!fogSeen(V,x,y)) return 'Ash has not been there yet. Teleport goes only to the clear parts of the map.';
  return null;
}
function chTpBlocked(V,x,y){
  if(V===0&&y<WALL_Y+70&&!(G.flags&&G.flags.gate)) return 'The Obsidian Gate is still shut.';
  if(!fogSeen(V,x,y)) return 'Ash has not been there yet. Teleport goes only to the clear parts of the map.';
  try{ if(typeof GT!=='undefined'&&GT&&GT.list) for(const g of GT.list){ if(g.map!=null&&g.map!==V) continue; if(gateIsOpen(g.id)) continue; if(gateInside(g.id,x,y)||dist(x,y,g.x,g.y)<(g.r||0)+30) return 'That is past a gate the story has not opened.'; } }catch(e){}
  return null;
}
function chTeleport(V,x,y){
  let why=chTpWhy(V,x,y); if(!why) why=chTpBlocked(V,x,y);
  if(why){ chTpSay(why); SFX.play('ui'); return false; }
  const s=typeof nearestLand==='function'?nearestLand(x,y):{x,y};
  if(!s||dist(s.x,s.y,x,y)>500||mapAt(s.y)!==V){ chTpSay('There is no safe ground there.'); SFX.play('ui'); return false; }
  why=chTpBlocked(V,s.x,s.y); if(why){ chTpSay(why); SFX.play('ui'); return false; }
  chMark();
  mapTravel(s.x,s.y,{noSave:true});
  let nm=''; try{ const r=regionAt(player.x,player.y); nm=(r&&r.name)||''; }catch(e){}
  setBanner('Teleport',nm,1.6);
  return true;
}
addEventListener('click',e=>{
  try{
    if(!chOn('tp')||scene!=='map'||typeof mapCv==='undefined'||e.target!==mapCv) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const r=mapCv.getBoundingClientRect(), [x,y]=mapInv((e.clientX-r.left)/r.width*mapCv.width,(e.clientY-r.top)/r.height*mapCv.height);
    chTeleport(MAPUI.view,x,y);
  }catch(err){ console.error(err); }
},true);
// ---------- strong hits on bosses: never past the next phase mark in one go
// A boss with FOES[type].phases (bossPhase in e8_foes.js) stops just under its next mark until that phase has started,
// so a one-hit kill can never skip a phase; a boss without them stops once just under half health (most older bosses
// get angry there). The bosses' own health gates (c1Floor, f2Floor, vorOnHurt) still apply on top.
function chBossFloor(e){
  if(!e||!(e.maxHp>0)) return null;
  const F=typeof FOES!=='undefined'?FOES[e.type]:null;
  if(F&&Array.isArray(F.phases)&&F.phases.length){
    if(e.noPhase) return null;
    const i=e.bph|0; if(i>=F.phases.length) return null;
    return Math.max(1,Math.min(e.hp,e.maxHp*F.phases[i]*0.98));
  }
  if(e._chHalf) return null;
  if(e.hp>e.maxHp*0.5) return e.maxHp*0.49;
  e._chHalf=true; return null;
}
// ---------- the hooks (installed once everything has loaded)
function chInit(){
  if(CHT.ready) return; CHT.ready=true;
  // God mode rides on the game's own switch (window.__eb.god, which every damage path already checks)
  try{ const E=window.__eb; if(E){ let raw=!!E.god; Object.defineProperty(E,'god',{configurable:true,enumerable:true,
    get(){ return raw||chOn('god'); }, set(v){ v=!!v; if(v===(raw||chOn('god'))) return; raw=v; }}); } }catch(e){}
  { const base=playerDied; playerDied=function(){ if(chOn('god')&&player&&G){ player.dead=false; player.hp=player.hpShow=Math.max(player.hp||0,player.maxHp); return; } return base.apply(this,arguments); }; }
  // every frame: mark the journey, keep the meters full, undo any damage that got past God mode
  { const base=update; update=function(dt){
      if(!chAny()) return base.apply(this,arguments);
      if(chBlocked()){ chAllOff(); return base.apply(this,arguments); }
      chMark();
      const p0=player, hp0=p0?p0.hp:0;
      if(CHT.on.endless) chFill(p0);
      try{ return base.apply(this,arguments); }
      finally{ if(player===p0&&p0){ if(CHT.on.god&&!p0.dead&&p0.hp<hp0) p0.hp=Math.min(p0.maxHp,hp0); if(CHT.on.endless) chFill(p0); } }
    }; }
  // Endless flasks: a drink never uses one up (and works with none left). Fast feet: the speed stat is raised only for
  // the length of the call (snapshotPlayer below saves the real one if anything saves in between)
  { const base=updatePlayer; updatePlayer=function(dt,inp){
      const p=player; if(!p||!G||chBlocked()||(!CHT.on.endless&&!CHT.on.fast)) return base.apply(this,arguments);
      const end=CHT.on.endless; let p0=0, pre=0, bump=false;
      if(end){ p0=p.potions; if(!(p.potions>=1)&&p.potionsMax>0){ p.potions=1; bump=true; } pre=p.potions; chFill(p); }
      const st=CHT.on.fast&&p.stats&&p.stats.speed>0?p.stats:null; if(st){ st.speed*=CH_FAST; CHT.boost=st; }
      try{ return base.apply(this,arguments); }
      finally{
        if(st){ st.speed/=CH_FAST; CHT.boost=null; }
        if(end&&player===p){ if(p.potions===pre-1||(bump&&p.potions===pre)) p.potions=p0; chFill(p); }
      } }; }
  { const base=snapshotPlayer; snapshotPlayer=function(){ const st=CHT.boost; if(st&&player&&player.stats===st){ st.speed/=CH_FAST; try{ return base.apply(this,arguments); } finally{ st.speed*=CH_FAST; } } return base.apply(this,arguments); }; }
  // Strong hits
  { const base=damageEnemy; damageEnemy=function(e,amt,o){
      if(!chOn('strong')||!e||e.dead||!(amt>0)) return base.apply(this,arguments);
      const src=o&&o.src; if(src==='comp'||src==='pip') return base.apply(this,arguments);
      if(!(e.boss||(G&&G.boss===e))) return base(e,amt*CH_STRONG,o);
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
  // a gate nook reached by cheat wings is not recorded as passed with the power
  if(typeof gtGot==='function'){ const base=gtGot; gtGot=function(g,v){ if(v===1&&chOn('wings')&&g&&g.K&&g.K.power&&typeof s10HasPower==='function'&&!s10HasPower(g.K.power)) return; return base.apply(this,arguments); }; }
  // Peaceful: foes (not bosses) lose interest every frame and cannot spot Ash
  { const calm=()=>{ for(const e of G.enemies){ if(e.dead||e.boss||G.boss===e) continue; if(e.aggro){ e.aggro=false; e.tele=null; } } };
    const base=updateEnemies; updateEnemies=function(dt){
      if(!chOn('peace')||!G||!G.enemies) return base.apply(this,arguments);
      const D=G.diff, had=!!D&&Object.prototype.hasOwnProperty.call(D,'aggro'), a0=D?D.aggro:undefined;
      calm(); if(D) D.aggro=1e-9;
      try{ return base.apply(this,arguments); }
      finally{ if(D){ if(had) D.aggro=a0; else delete D.aggro; } calm(); } }; }
  // the mark rides in the save; an old save has none
  { const base=saveData; saveData=function(){ const s=base.apply(this,arguments); try{ if(G&&G.cheated&&s) s.cheated=true; }catch(e){} return s; }; }
  { const base=loadGame; loadGame=function(s){ const r=base.apply(this,arguments); try{ if(G) G.cheated=!!(s&&s.cheated); }catch(e){} return r; }; }
  // Settings shows the switches as they are; the map says how to teleport
  { const base=openSettings; openSettings=function(){ const r=base.apply(this,arguments); try{ CHT.buf=''; chSync(); }catch(e){} return r; }; }
  { const base=mapHintSet; mapHintSet=function(){ const r=base.apply(this,arguments); try{ if(chOn('tp')){ const h=document.getElementById('mapHint'); if(h) h.textContent='Teleport is on: click any clear spot on the map to go there.'; } }catch(e){} return r; }; }
  setInterval(()=>{ try{ if(chBlocked()&&(chAny()||CHT.open)){ chAllOff(); chSync(); } chChip(); if(CHT.tpMsgT&&performance.now()-CHT.tpMsgT>3500){ CHT.tpMsgT=0; if(scene==='map') mapHintSet(); } }catch(e){} },400);
}
Promise.resolve().then(()=>{ try{ chInit(); }catch(e){ console.error('cheats',e); } });
// test hooks: read-only state (switches are only set from the Settings screen)
window.__ebDbg=Object.assign(window.__ebDbg||{},{cheats:()=>({open:CHT.open,on:Object.assign({},CHT.on),cheated:!!(G&&G.cheated),word:CHEAT_WORD,god:!!(window.__eb&&window.__eb.god)}),
  chTp:(V,x,y)=>{ const w=chTpWhy(V,x,y)||chTpBlocked(V,x,y); return w||'ok'; }, chFloor:e=>chBossFloor(e)});
