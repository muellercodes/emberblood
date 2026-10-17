// ================= v9 balance (e6_balance): levels and XP, foe level scaling, star-iron tiers, boss tuning and the
// boss "keep moving" rule, difficulty extras, the powers registry (defineAbility), old-save fixes and debug hooks.
// The per-difficulty numbers live in DIFFS (a1b_data.js); every other knob is in BAL below. The tables, the formulas
// and the reasoning are in scratchpad/BALANCE.md.
const BAL={
  maxLevel:25,
  hpLv:8,            // max health per level up (was 6)
  dmgLv:1.07,        // Ash's damage per level: stats.dmgMul = dmgLv^(level-1), so weapons, breath, roar and slam all grow (was 1.04)
  foeHp:1.145,       // foe health per foe level, compounding (was +26% of the level 1 health per level, which outran Ash after level 10)
  foeDmg:1.10,       // foe damage per foe level, compounding (was +15% per level)
  foeXp:0.25,        // kill XP: value x (1 + foeXp x (level - 1)), against the foe's own lv
  // xp[l]: XP to go from level l to l+1. About 11k to reach 9 (end of Act I), 30k to 13 (Act II), 55k to 17 (Act III),
  // 85k to 21 (Act IV) and 102k to 23 (Nightfall Peak). Kill, chest and quest XP all grow with level, so the steps grow too.
  xp:[0, 300,500,750,1050,1400,1800,2300,2900, 3900,4500,5000,5600, 5900,6100,6300,6500, 7000,7400,7700,8100, 8400,8600, 9000,9500],
  tierEarly:1.15,    // star-iron: the first three reforges add 15% each (as before)
  tierLate:1.08,     // every reforge after that adds 8%
  tierMax:12,        // tier cap; star-iron past it becomes coins
  tierCoins:40,
  arenaBoss:0.55,    // Arena champions: about 1 to 1.5 times their old health (story bosses got about 2.3 times tougher)
  still:{r:56,blastR:62,delay:[1.0,0.85,0.7],dmg:12},  // the boss "keep moving" eruption (seconds before it comes: DIFFS.still)
  // v10: per boss [Easy, Normal] factor on those seconds (0: no eruptions). The Mirrow Serpent is fought from the shore
  // with the bow, so standing still there is the plan, not a mistake.
  stillK:{serpent:[0,0], grizzlefang:[1.5,1.4], gnarl:[1.3,1.3]}
};
function balHpK(L){ return Math.pow(BAL.foeHp,Math.max(0,(L||1)-1)); }
function balDmK(L){ return Math.pow(BAL.foeDmg,Math.max(0,(L||1)-1)); }
function balXpK(L){ return 1+BAL.foeXp*Math.max(0,(L||1)-1); }
function balLvlDmg(L){ return Math.pow(BAL.dmgLv,Math.max(0,(L||1)-1)); }
function balXpNeed(l){ l=Math.max(1,l|0); const t=BAL.xp; return t[l]!=null?t[l]:Math.round(t[t.length-1]*Math.pow(1.05,l-t.length+1)); }
function balXpTo(L){ let n=0; for(let l=1;l<L;l++) n+=balXpNeed(l); return n; }
function balTierMul(t){ return t<=3?BAL.tierEarly:BAL.tierLate; }   // the multiplier of the reforge that reaches tier t
function balTierK(t){ let k=1; for(let i=1;i<=t;i++) k*=balTierMul(i); return k; }

// ---------- Act I bosses: lv is the level their EDEF numbers (and literal ed(N) hits) are written for, and the level they
// fight at; hp is their health on Normal (Easy x0.8, Hard x1.25, DIFFS.bossHp). hp = target seconds x 18 x P(level Ash
// usually has there), where 18 x P is a real fight's damage per second (measured: a sword held on a dummy does 26 per second
// at level 1 once stamina runs low, times P, Ash's expected damage multiplier). Targets on Normal: 40 s for Grizzlefang up
// to 70 s for Sir Cindervane and 140 s for Vorlaxis (about 1.6 times as long as before on every difficulty).
const BAL_BOSS={
  grizzlefang:{lv:2,hp:950}, gnarl:{lv:3,hp:1250}, morrow:{lv:4,hp:1450}, serpent:{lv:5,hp:1700},
  gloamjaw:{lv:5,hp:2000}, broodmother:{lv:6,hp:2100}, greymane:{lv:7,hp:2400}, skrae:{lv:7,hp:2700},
  cindervane:{lv:8,hp:3300}, vorlaxis:{lv:10,hp:7800}
};
for(const k in BAL_BOSS) if(EDEF[k]) Object.assign(EDEF[k],BAL_BOSS[k]);
// v10 on-ramp: Act I boss health on [Easy, Normal] in the story, times the health above (Hard keeps hp x DIFFS.bossHp).
// Measured with the casual-kid bot so each boss is a little harder than the one before (scratchpad v10/BAL.md).
// (Easy never gets more health than Normal: Easy hp x 0.8 <= Normal hp, so an Easy factor is at most 1.25 x the Normal one.)
const BAL_BOSS_EZ={grizzlefang:[0.75,0.65], gnarl:[0.6,0.65], morrow:[1.6,1.9], serpent:[0.6,0.6], gloamjaw:[0.55,0.45], broodmother:[1.15,0.95],
  greymane:[0.9,1.25], skrae:[1.1,1.1], cindervane:[0.85,0.7]};
{ const base=makeEnemy; makeEnemy=function(type,x,y,opt){ const e=base(type,x,y,opt);
    try{ const k=e&&e.boss&&G&&G.mode==='story'&&BAL_BOSS_EZ[type]; const i=k?DIFFS.indexOf(G.diff):-1; if(k&&i>=0&&i<2&&k[i]!==1){ e.maxHp*=k[i]; e.hp=e.maxHp; } }catch(err){}
    return e; }; }

// ---------- difficulty: the story elite chance
{ const base=newRun; newRun=function(mode){ base(mode); if(G.mode==='story') G.eliteChance=G.diff.elite!=null?G.diff.elite:0.06; }; }

// ---------- star-iron: more tiers (Mom's forge)
reforgeIron=function(){
  if(!G||G.iron<=0) return;
  let n=0, extra=0;
  while(G.iron>0){ G.iron--; if(G.tier>=BAL.tierMax){ extra++; continue; } G.tier++; player.stats.slash*=balTierMul(G.tier); n++; }
  if(extra) addCoins(extra*BAL.tierCoins,player.x,player.y);
  const nx=Math.round((balTierMul(G.tier+1)-1)*100);
  const sub=G.tier>=BAL.tierMax?S('Your blade is as sharp as a blade can be. Mom pays you coins for any extra star-iron.','The blade is as sharp as it gets!')
    :S(`Every weapon hits harder. The next star-iron adds ${nx}% more.`,`Stronger weapons! The next one adds ${nx}%.`);
  setBanner(n?`Blade reforged · tier ${G.tier+1}`:'Mom counts the coins',sub,2.8); SFX.play('upgrade');
};

// ---------- companions keep up with foe health at high levels
{ const base=compStats; compStats=function(full){ base(full); try{ if(typeof CM!=='undefined'&&CM&&player) CM.k=Math.max(CM.k||1,0.55*balHpK(player.level||1)); }catch(e){} }; }

// ---------- bosses punish standing still: stay in one spot too long during a boss fight and the ground erupts under Ash
// (a red ring, then a fire blast; jump, roll or step aside). Hitting a dazed, stuck or staggered boss from one spot is fine.
const BST={t:0,ax:null,ay:null,n:0};
const BAL_OPEN={dizzy:1,stuck:1,stun:1,stagger:1,perched:1,flinch:1,open:1,recover:1,takeoff:1,flying:1,landW:1};
function balStill(dt){
  const b=G&&G.boss, p=player;
  if(!b||b.dead||!b.aggro||b.spawnIn>0||scene!=='play'||!p||p.dead||G.fightIntro||DLG||dist(b.x,b.y,p.x,p.y)>820){ BST.t=0; BST.ax=null; return; }
  const R=BAL.still.r;
  if(BST.ax==null||dist2(p.x,p.y,BST.ax,BST.ay)>R*R){ BST.ax=p.x; BST.ay=p.y; BST.t=0; return; }
  if(airborne()||p.dashT>0){ BST.t=Math.max(0,BST.t-dt*2); return; }   // a jump or a roll counts as moving
  if(b.stun>0||b.staggered||BAL_OPEN[b.state]) return;
  const sk=BAL.stillK[b.type], di0=DIFFS.indexOf(G.diff), sf=sk&&di0>=0&&di0<2&&G.mode==='story'?sk[di0]:1;
  if(!(sf>0)){ BST.t=0; return; }
  BST.t+=dt;
  if(BST.t<(G.diff.still||2.6)*sf) return;
  BST.t=0; BST.ax=p.x; BST.ay=p.y; BST.n++;
  const di=clamp(DIFFS.indexOf(G.diff),0,2), dm=BAL.still.dmg*(b.edK||1)*(G.mode==='story'?1:(G.dmgMul||1));
  blast(p.x,p.y,BAL.still.blastR,BAL.still.delay[di],dm,{still:true});
  emit(p.x,p.y,14,{col:'255,150,70',ang:-Math.PI/2,spread:1.2,smin:20,smax:80,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4,rise:30});
  ftext(p.x,p.y-36,simplify('Keep moving!'),'#ffd27a',15);
  if(G.flags&&!G.flags.bal_stillTip){ G.flags.bal_stillTip=1; mvTip('Keep moving',S('Bosses hate it when you stand still: the ground erupts under your feet. Step, roll or jump out of the red ring!','Do not stand still! Run out of the red ring.'),8,'bal_still'); }
}
{ const base=updateEnemies; updateEnemies=function(dt){ base(dt); try{ balStill(dt); }catch(e){} }; }

// ---------- powers: defineAbility(id,{name,how,tip,icon,act,where,skill,plain,col}) over ABIL_INFO
// how and tip are text or a function of the control names c ({jump,attack,roll,fire,sprint,use}: what to press on the
// device in use). icon: a skSym id (a9h_skills.js) or a function (g,pal) drawing in a 100 x 100 box centred on 0,0.
// act: which act it belongs to (the Powers page groups by it), where: a hint shown while it is not found yet (Act I
// powers only; later ones stay '???'), skill: the skill node it opens. grantAbility(id) shows the name, how and tip.
// A second call for the same id merges, so the power helpers can refine the text once their power is built.
const ABIL_DEFS={}, ABIL_ORDER=[];
function balCtls(){
  const L=a=>{ try{ return btnLabel(a)||''; }catch(e){ return ''; } };
  const c={jump:L('jump')||'C',attack:L('attack')||'J',roll:L('roll')||'Space',fire:L('fire')||'K',use:L('use')||'E',sprint:L('sprint')||'Shift'};
  try{ if(padActive()) c.sprint='the left stick (push it all the way)'; else if(touchy()) c.sprint='the stick (push it all the way)'; }catch(e){}
  return c;
}
function abilTxt(v,c){ return typeof v==='function'?v(c||balCtls()):(v||''); }
function defineAbility(id,def){
  def=def||{};
  const old=ABIL_DEFS[id]; if(!old) ABIL_ORDER.push(id);
  const A=ABIL_DEFS[id]=Object.assign(old||{id,act:1,_info:!!ABIL_INFO[id]},def);
  const I=ABIL_INFO[id]=ABIL_INFO[id]||{};
  I.name=A.name||I.name||id;
  // the three Trial gifts keep their own banner lines (a6c_moves.js) unless a banner is given
  if(!A._info||def.banner){ I.sub=()=>abilTxt(A.banner||A.how); I.tip=()=>abilTxt(A.tip||A.how); if(A.plain) I.plain=A.plain; }
  return A;
}
function abilHow(id){ const A=ABIL_DEFS[id]; return A?simplify(abilTxt(A.how)):''; }
const BAL_ACTS=[null,'Act I · The First Flame','Act II · The Masked Thief','Act III · The Long Winter','Act IV · The Night Mother'];
defineAbility('jump',{act:1,icon:'a_jump',name:'The Ember Leap',short:'Jump',
  how:c=>S(`Press ${c.jump} to hop over fences, rocks, gaps and shockwaves. Sprint first to jump farther.`,`Press ${c.jump} to jump. Run first to jump far.`),
  where:S('Waiting in the Trial of the Leap, deep in Whisperwood.','In the Trial of the Leap, in Whisperwood.')});
defineAbility('stride',{act:1,icon:'a_stride',name:'The Tide Stride',short:'Water Stride',
  how:()=>S('Walk right onto lakes and rivers. Sprinting on water is a little faster.','Walk on lakes and rivers!'),
  where:S('Waiting in the Trial of the Tide, on an island in Lake Mirrow.','In the Trial of the Tide, on Lake Mirrow.')});
defineAbility('wings',{act:1,icon:'a_wings',name:'The Ember Wings',short:'Wings',skill:'strongwings',
  how:c=>S(`Jump, then press ${c.jump} again in the air to take off. Press it once more to land. Keep an eye on the wing meter.`,`Jump, then press ${c.jump} again to fly. Press it again to land.`),
  where:S('Waiting in the Trial of the Sky, up in the Drakeling Crags.','In the Trial of the Sky, up in the Crags.')});
defineAbility('dbljump',{act:1,icon:'dbljump',name:'Double Jump',
  how:c=>S(`Press ${c.jump} again in midair to jump a second time. Hop up short ledges and clear wide gaps.`,`Press ${c.jump} again in the air. Jump twice!`),
  tip:c=>S(`Jump, then press ${c.jump} again at the top of the jump. A double jump can reach short ledges a single jump cannot.`,`Jump, then press ${c.jump} again up high.`),
  where:S('Someone in Embermere knows how to jump twice. Help people and listen.','Someone in Embermere can teach you.')});
defineAbility('skimmer',{act:1,icon:'skimmer',name:'Skimmer',
  how:c=>S(`Sprint on water to skim across it, fast and free: it costs no stamina, so even the widest lakes are easy.`,`Run on water for free. Cross big lakes fast!`),
  tip:c=>S(`Sprint while you walk on water. Skimming costs no stamina and is extra fast.`,`Run on water. It is free and fast!`),
  where:S('Someone by the water knows the trick. Help people and listen.','Someone by the water can teach you.')});
defineAbility('claws',{act:2,icon:'a_claws',name:'Climbing Claws',skill:'climb2',
  how:()=>S('Walk into a cliff with cracks or vines to climb it. Climb to ledges nobody else can reach.','Walk into a cracked cliff to climb it.')});
defineAbility('grapple',{act:2,icon:'a_grapple',name:'Grapple Tail',skill:'hook2',
  how:()=>S('Throw your tail at a brass grapple post to pull yourself across gaps and up cliffs.','Throw your tail at a brass post to zip to it.')});
defineAbility('shadow',{act:2,icon:'a_shadow',name:'Shadow Dash',skill:'dash2',
  how:c=>S(`Roll (${c.roll}) while you sprint to melt into shadow and dash through bars, thin walls and attacks.`,`Run, then roll to dash through bars.`)});
defineAbility('blaze',{act:3,icon:'a_blaze',name:'Blaze Breath',skill:'blaze2',
  how:c=>S(`Hold fire breath (${c.fire}) until it burns white-hot. Blaze Breath melts thick ice and frees frozen people.`,`Hold fire breath to make it white-hot. It melts ice!`)});
defineAbility('windride',{act:3,icon:'a_windride',name:'Wind Riding',skill:'wind2',
  how:()=>S('Fly into a gust of wind to ride it far and high. Updrafts carry you over cliffs and walls.','Fly into the wind to ride it up high.')});
defineAbility('pound',{act:3,icon:'slam',name:'Ground Pound',skill:'pound2',
  how:c=>S(`Jump, then attack (${c.attack}) in midair to crash down. Smash cracked floors, stun foes and ring big bells.`,`Jump, then attack in the air to smash down.`)});
defineAbility('dive',{act:4,icon:'a_dive',name:'Dive',skill:'dive2',
  how:()=>S('Swim into deep water and dive under it. Watch your breath and look for sunken paths.','Dive under deep water. Watch your air!')});
defineAbility('burrow',{act:4,icon:'a_burrow',name:'Burrow',skill:'burrow2',
  how:()=>S('Dig into soft sand to travel under walls and slip past foes.','Dig into sand and go under walls.')});
defineAbility('moonfire',{act:4,icon:'a_moonfire',name:'Moonfire',skill:'moon2',
  how:()=>S('Breathe silver moonfire to light moon lamps, show hidden bridges and burn away shadow.','Breathe moonfire to light moon lamps.')});

// ---------- old saves (made before v9): Double Jump and Skimmer become powers, Meteor Slam becomes a power for later,
// every point spent on them comes back, and levels move onto the new curve (damage, health, XP into the level, tiers).
const OLD_XP=l=>120+90*(l-1)+15*(l-1)*(l-1);
function balMigrate(){
  if(!G||G.mode!=='story'||!player) return;
  const p=player, f=G.flags=G.flags||{}; G.skills=G.skills||{}; G.abil=G.abil||{};
  let back=0; const moved=[];
  for(const id of ['dbljump','skimmer']) if(G.skills[id]){ back+=G.skills[id]|0; delete G.skills[id]; G.abil[id]=true; moved.push(ABIL_DEFS[id].name); }
  let slam=false; if(G.skills.slam){ back+=G.skills.slam|0; delete G.skills.slam; slam=true; }
  if(back) G.sp=(G.sp|0)+back;
  if(!f.bal_v9){
    f.bal_v9=1; const L=Math.max(1,p.level|0);
    if(L>1){ const add=(BAL.hpLv-6)*(L-1); p.maxHp+=add; p.hp=Math.min(p.maxHp,(p.hp||p.maxHp)+add); p.hpShow=p.hp; }
    p.stats.dmgMul=balLvlDmg(L);
    p.xp=Math.max(0,Math.min(xpNeed(L)-1,Math.round((p.xp||0)/OLD_XP(L)*xpNeed(L))));
    if((G.tier|0)>3) p.stats.slash*=balTierK(G.tier)/Math.pow(1.15,G.tier);
  }
  if(moved.length) later(2.6,()=>setBanner(S('Your moves are powers now','Your moves are powers now'),S(`${moved.join(' and ')} ${moved.length>1?'are':'is'} now a power you keep for good, and your skill point${back>1?'s are':' is'} back.`,`You keep ${moved.join(' and ')}. Your points are back!`),4.2));
  if(slam&&!f.bal_slam){ f.bal_slam=1; later(2.8,()=>setBanner(S('Meteor Slam became a power you will find later','Meteor Slam is a power now'),S('Your skill point is back. Look for the power far to the north one day.','Your point is back. Find the power later!'),4.4)); }
  if(back||moved.length||slam) saveGame();
}
{ const base=loadGame; loadGame=function(s){ base(s); balMigrate(); }; }

// ---------- boss help after a fall (v10, every boss in every act): after Ash falls to the same boss twice (once on Easy),
// the next try that boss starts with 20% less health, 40% after one more fall (never more), and a friendly banner says so.
// Beating the boss resets it. Settings > "Boss help after a fall" (on by default, saved as eb_bosshelp like the other
// settings). The falls live in G.flags.bal_falls (saved with the game; an old save has none, so nothing changes for it),
// keyed by the fight site (G.fightSite) or, for a dungeon guardian, the boss type.
settings.bossHelp=store.get('eb_bosshelp',true)!==false;
const BHELP={need:[1,2,2],per:0.2,max:0.4,lastT:-99};
function bhFalls(){ const f=G.flags||(G.flags={}); const o=f.bal_falls; return o&&typeof o==='object'&&!Array.isArray(o)?o:(f.bal_falls={}); }
function bhKey(b){ return (G&&G.fightSite)||(b&&b.type)||''; }
function bhDi(){ const i=DIFFS.indexOf(G&&G.diff); return i<0?clamp(typeof diffIdx==='number'?diffIdx:1,0,2):i; }
function bossHelpCut(key){
  if(!settings.bossHelp||!G||G.mode!=='story'||!key) return 0;
  const n=bhFalls()[key]|0, need=BHELP.need[bhDi()];
  return n<need?0:Math.min(BHELP.max,BHELP.per*(n-need+1));
}
function bhName(b){ const d=EDEF[b.type]||{}; return String(d.name||'The boss').split(',')[0]; }
// a fall while a boss fight is on counts for that boss
{ const base=playerDied; playerDied=function(){
    try{ const b=G&&G.boss; if(G.mode==='story'&&b&&b.boss&&!b.dead&&player&&dist(b.x,b.y,player.x,player.y)<1800){ const F=bhFalls(), k=bhKey(b); if(k) F[k]=(F[k]|0)+1; } }catch(e){}
    base(); }; }
// beating the boss resets its help
{ const base=onBossDefeated; onBossDefeated=function(e){
    try{ if(G&&G.mode==='story'&&e){ const F=bhFalls(); for(const k of [G.fightSite,e.type]) if(k&&F[k]!=null) delete F[k]; } }catch(err){}
    base(e); }; }
// the boss of a new try starts weaker (health and its health bar, in proportion, so every phase mark stays where it was)
function bossHelpTick(){
  const b=G&&G.boss; if(!b||b.dead||b._bh||G.mode!=='story') return;
  b._bh=1; const cut=bossHelpCut(bhKey(b)); if(!(cut>0)) return;
  b.maxHp*=1-cut; b.hp=Math.min(b.maxHp,b.hp*(1-cut)); b._bhCut=cut;
  if(G.time-BHELP.lastT<20) return; BHELP.lastT=G.time;
  const nm=bhName(b), pct=Math.round(cut*100);
  setBanner(S('Boss help','Boss help'),S(`${nm} starts this fight with ${pct}% less health. You can do it!`,`${nm} is weaker now. You can do it!`),3.6);
}
{ const base=updateEnemies; updateEnemies=function(dt){ base(dt); try{ bossHelpTick(); }catch(e){} }; }
function bhSync(){ for(const b of document.querySelectorAll('#setBossHelp button')) b.setAttribute('aria-pressed',String(b.dataset.v===(settings.bossHelp?'on':'off'))); }
function setBossHelp(on){ settings.bossHelp=!!on; store.set('eb_bosshelp',settings.bossHelp); bhSync(); return settings.bossHelp; }
(function bhRow(){
  try{
    const panel=document.querySelector('#settings .panel'); if(!panel||document.getElementById('setBossHelp')) return;
    const r=document.createElement('div'); r.className='setrow';
    r.innerHTML='<span>Boss help after a fall<small>Fall to the same boss twice (once on Easy) and it starts the next fight with less health. Beat it and it is back to normal.</small></span><div class="seg" id="setBossHelp" role="group" aria-label="Boss help after a fall"><button type="button" data-v="on" aria-pressed="false">On</button><button type="button" data-v="off" aria-pressed="false">Off</button></div>';
    // it goes with the gameplay rows, right under Auto-attack
    const a=document.getElementById('setAuto'), row=a&&a.closest('.setrow');
    if(row&&row.parentElement===panel) row.after(r);
    else { let ref=document.getElementById('bSettingsClose'); while(ref&&ref.parentElement!==panel) ref=ref.parentElement; if(ref) panel.insertBefore(r,ref); else panel.appendChild(r); }
    for(const b of r.querySelectorAll('button')) b.addEventListener('click',()=>{ SFX.init(); setBossHelp(b.dataset.v==='on'); SFX.play('ui'); });
    bhSync();
  }catch(e){}
})();
{ const base=renderSettings; renderSettings=function(){ base(); bhSync(); }; }

// ---------- debug hooks (tests): __eb.bal.*
window.__ebX=Object.assign(window.__ebX||{},{bal:{
  BAL,BAL_BOSS,DIFFS,ABIL_DEFS,ABIL_ORDER,balHpK,balDmK,balXpK,balLvlDmg,balXpNeed,balXpTo,balTierK,
  setDiff(i){ diffIdx=clamp(i|0,0,2); store.set('eb_diff',diffIdx); if(G){ G.diff=DIFFS[diffIdx]; if(G.mode==='story') G.eliteChance=G.diff.elite; } return G&&G.diff.name; },
  // an "expected" Ash at level L: tier is star-iron (default: the expected tier for that level), extras on by default
  hero(L,o){ o=o||{}; const p=player; L=clamp(L|0,1,BAL.maxLevel); const tier=o.tier!=null?o.tier:balExpTier(L);
    p.level=L; p.xp=0; p.stats.dmgMul=balLvlDmg(L); G.tier=tier; p.stats.slash=15*balTierK(tier); p.stats.wpnMul=o.bare?1:1+0.02*(L-1); p.stats.armor=o.bare?1:balExpArmor(L);
    p.maxHp=100+BAL.hpLv*(L-1)+(o.bare?0:balExpExtraHp(L)); p.hp=p.hpShow=p.maxHp; p.stamina=p.maxStamina=100+3*(L-1); p.energy=p.maxEnergy; p.iframes=0;
    return {level:L,tier,maxHp:p.maxHp,dmgMul:p.stats.dmgMul,slash:p.stats.slash,wpnMul:p.stats.wpnMul,armor:p.stats.armor}; },
  spawn(type,L,dx,dy,o){ const e=makeEnemy(type,player.x+(dx||0),player.y+(dy==null?-60:dy),Object.assign({level:L||1,aggro:true,elite:false,homeX:player.x,homeY:player.y,leash:5000},o||{})); e.spawnIn=0; if(AREA) e.inArea=true; return e.id; },
  foe(id){ const e=G.enemies.find(q=>q.id===id); return e?{id:e.id,type:e.type,hp:e.hp,maxHp:e.maxHp,dmg:e.dmg,level:e.level,edK:e.edK,speed:e.speed,dead:!!e.dead,state:e.state,x:e.x,y:e.y,elite:e.elite,value:e.value,xp:foeXp(e)}:null; },
  hold(id,on){ const e=G.enemies.find(q=>q.id===id); if(e){ e.stun=on===false?0:999; } },
  clear(){ for(const e of G.enemies) e.dead=true; G.enemies=[]; G.projectiles=[]; G.hazards=[]; G.rings=[]; G.pools=[]; G.boss=null; },
  still:()=>({t:BST.t,n:BST.n,ax:BST.ax}), migrate:balMigrate,
  help:()=>({on:settings.bossHelp,falls:Object.assign({},bhFalls()),cut:G.boss?(G.boss._bhCut||0):null}), setBossHelp, bossHelpCut,
  moves:()=>({dbl:canDblJump(),skim:canSkim(),pound:canPound()}),
  abil:id=>{ const A=ABIL_DEFS[id]; return A?{name:A.name,how:abilHow(id),act:A.act,skill:A.skill||null,own:hasAbil(id)}:null; }
}});
// the expected loadout by level (main path plus some side quests): star-iron tier, armor and bonus health
function balExpTier(L){ return L<3?0:L<5?1:L<7?2:L<10?3:Math.min(BAL.tierMax,3+Math.floor((L-9)/2)); }
function balExpArmor(L){ return L<5?1:L<9?0.95:L<13?0.9:L<17?0.88:0.85; }
function balExpExtraHp(L){ return Math.round(L<2?0:L<9?5*(L-1):L<23?40+10*(L-9):180); }
