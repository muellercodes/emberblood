// ================= v12 wave 7 (ITEMS): the item registry, the eight things Ash can carry and use, their boosts, the
// fairness limits, and where they come from (each shop's Supplies row, chests, pots and barrels, elites).
// The design is scratchpad v12/PLAN_ITEMS.md; Drew's decisions are in v12/WAVE7.md.
//
// The contract the bag screen and the HUD read (a12b_ui.js, a11b_hud.js):
//   ITEMDEF {id:{name,simple,kind:'use'|'auto'|'tool'|'quest'|'keep',desc,simpleDesc,cap,price:[I,II,III,IV],icon}}
//     (the eight new ones and the old items this file knows; an id it does not know is 'quest')
//   itemInfo(id)   -> {id,name,kind,desc,count,cap,usable,icon}  name and desc are full text registered with
//                     S(full,simple): show them through simplify() (renderJour's E() does) to get Simple words
//   canUseItem(id) -> true, or a short reason ("Your health is full", "One item per boss fight", "Not in the Arena")
//   useItem(id)    -> true if used: takes one, plays the drink-like use (0.5 s at 45% walking speed, a hit does not
//                     stop it), then starts the effect; saves the count (not mid boss fight). A refusal floats the reason
//   quickItem()    -> the id in the quick slot or null; setQuick(id) (null empties it). Kept in G.flags.qslot. The
//                     first thing to use that Ash gets goes in by itself (also when the slot's item has run out)
//   itemBuffs()    -> [{id,icon,left,total}] for the boosts running now
// Boosts live only in IT.buffs: never in player.stats, never in the save. They wrap hurtPlayer (Hearth Stone),
// damageEnemy (Fish Pudding) and updatePlayer (the rest). A rest (inn, bed, shrine) or a death ends them.
// Limits: one item per boss fight attempt, two on Easy (the keep-moving rule's live-boss test: G.boss alive, angry and
// within 820 px); Pim's cocoa counts (x2_people.js f2pCocoaTick calls itemBossTake). Pebble's Feather never in a boss
// fight, a minigame or a place with no way out. No items at all in the Arena (any mode but story).
// World drops (pots, elites, chests) call UI's drawItemIcon(g,id,x,y,size) with x,y the CENTRE when it exists.

// ---------- 1. the registry
const IT_USE_T=0.5, IT_FLASKS=10, IT_PELL5={x:4060,y:89780};
const ITEMDEF={};
// the eight: act = the first act that sells or hides one; w = how often a find is this one; t = boost seconds
const IT_NEW={
  it_bun:{act:1,cap:3,price:[8,16,22,28],w:3,t:3,
    name:['Lantern Bun','Lantern Bun'],
    desc:['Warm all the way through. Heals 25% of your health over 3 seconds.','Heals you a bit.'],
    short:['heals you','heals you']},
  it_pepper:{act:1,cap:2,price:[20,40,56,70],w:2,t:10,
    name:['Ember Pepper','Ember Pepper'],
    desc:['Fills your fire meter. Fire breath and Blaze cost nothing for 10 seconds.','Free fire for 10 seconds!'],
    short:['free fire breath','free fire']},
  it_feather:{act:1,cap:1,price:[30,60,84,105],w:2,
    name:['Pebble\'s Feather','Pebble\'s Feather'],
    desc:['Pebble the crow leads you out of a cave, dungeon or house, back to its door.','Pebble takes you out to the door.'],
    short:['a way out of caves','a way out']},
  it_taffy:{act:2,cap:2,price:[null,30,42,53],w:2,t:15,
    name:['Salt Taffy','Salt Taffy'],
    desc:['Chewy and very salty. Your stamina stays full for 15 seconds.','Full stamina for 15 seconds.'],
    short:['endless stamina','lots of stamina']},
  it_drop:{act:2,cap:2,price:[null,45,63,79],w:2,
    name:['Thunder Drop','Thunder Drop'],
    desc:['A candy that rumbles in your tummy. Your Roar meter fills up at once.','Fills your Roar!'],
    short:['fills your Roar','fills your Roar']},
  it_stone:{act:3,cap:2,price:[null,null,50,63],w:2,t:30,
    name:['Hearth Stone','Hearth Stone'],
    desc:['A warm stone for your pocket. Hits hurt 25% less for 30 seconds.','Hits hurt less for 30 seconds.'],
    short:['hits hurt less','hits hurt less']},
  it_snowball:{act:3,cap:3,price:[null,null,45,56],w:2,
    name:['Snowgob Snowball','Snowgob Snowball'],
    desc:['A burst of frost all round you. Foes close by freeze for 2.5 seconds, a boss for a blink.','Freezes foes near you!'],
    short:['freezes foes','freezes foes']},
  it_pudding:{act:4,cap:2,price:[null,null,null,60],w:1,t:30,
    name:['Gilly\'s Fish Pudding','Gilly\'s Fish Pudding'],
    desc:['Heals 15% of your health, and your hits do 20% more for 30 seconds.','Heals a bit. Hit harder for 30 seconds.'],
    short:['heals, hit harder','hit harder']}
};
for(const id in IT_NEW){ const d=IT_NEW[id];
  ITEMDEF[id]={id,kind:'use',name:S(d.name[0],d.name[1]),simple:d.name[1],desc:S(d.desc[0],d.desc[1]),simpleDesc:d.desc[1],
    short:S(d.short[0],d.short[1]),shortS:d.short[1],cap:d.cap,price:d.price.slice(),icon:id,act:d.act,w:d.w,t:d.t||0}; }
const IT_USE_IDS=Object.keys(IT_NEW);
// the old items: works by itself, tools, keepsakes (hats among them). Every other id is 'quest'.
const IT_OLD={
  auto:{c_biscuit:['Granny Oona baked it long ago. When you are badly hurt, you eat it by yourself.','Heals you by itself when you are badly hurt.'],
    c_lumpybun:['Tikka made it. When you are badly hurt, you eat it by yourself.','Heals you by itself when you are badly hurt.'],
    f_cocoa:['When you are badly hurt, it warms you up by itself.','Heals you by itself when you are badly hurt.'],
    m_airjar:['When your air runs low under water, you open it by yourself.','Gives you air under water by itself.']},
  tool:{lantern:['Lights up dark caves.','Lights up caves.'],rod:['Fish where you see ripples by the water.','Fish where the water ripples.'],
    map_x1:null,map_x2:null,map_x3:null,c_map:null,juniper_map:null,f_northmaps:null,n_map:null},
  keep:{m_pearl:null,a1_skipstone:null,f_medal:null,relic:null,
    sky_feather:'hat',f_earmuffs:'hat',f3_plume:'hat',c_badge:'hat',n5_goathorns:'hat',c_scarf:'hat',f3_wolf_hat:'hat',
    m_hat_desert:'hat',m_hat_firefly:'hat',m_hat_mirage:'hat',m_hat_pirate:'hat'}
};
const IT_KIND_DESC={
  tool:['A map. It shows on your map screen.','A map.'],
  keep:['A keepsake. It is yours to keep.','A keepsake.'],
  hat:['Something to wear. Looking good.','Something to wear.'],
  quest:['For a quest. Somebody will want this.','For a quest.']
};
for(const kind in IT_OLD) for(const id in IT_OLD[kind]){
  const v=IT_OLD[kind][id], dd=Array.isArray(v)?v:IT_KIND_DESC[v==='hat'?'hat':kind];
  const D={id,kind,simple:null,desc:S(dd[0],dd[1]),simpleDesc:dd[1],cap:0,price:null,icon:id};
  if(v==='hat') D.hat=true;
  Object.defineProperty(D,'name',{enumerable:true,get(){ return (typeof ITEM_NAMES!=='undefined'&&ITEM_NAMES[id])||itPretty(id); }});
  ITEMDEF[id]=D;
}
for(const id of IT_USE_IDS) ITEM_NAMES[id]=ITEMDEF[id].name;
function itPretty(id){ return String(id).replace(/^[a-z0-9]{1,3}_/,'').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase()); }
function itemKind(id){ const d=ITEMDEF[id]; return d?d.kind:'quest'; }
function itemInfo(id){
  const d=ITEMDEF[id]||null, kind=d?d.kind:'quest';
  const name=d?d.name:((typeof ITEM_NAMES!=='undefined'&&ITEM_NAMES[id])||itPretty(id));
  const desc=d?d.desc:S(IT_KIND_DESC.quest[0],IT_KIND_DESC.quest[1]);
  const o={id,name,kind,desc,count:(G&&G.items&&G.items[id])||0,cap:d?d.cap:0,usable:kind==='use',icon:d?d.icon:id};
  if(d&&d.hat) o.hat=true;
  if(d&&d.short) o.short=d.short;
  return o;
}

// ---------- 2. runtime state (reset with each new G: a new game or a load)
const IT={G:null,use:null,buffs:{},boss:{e:null,n:0},crow:null,drops:[],fx:[],brk:[],brkSet:new Set(),brkT:0,pl:null,peak:0,
  sayT:0,pellT:0,pellCol:null};
function itSync(){
  if(IT.G===G) return;
  IT.G=G; IT.use=null; IT.buffs={}; IT.boss={e:null,n:0}; IT.crow=null; IT.drops=[]; IT.fx=[]; IT.brk=[]; IT.brkSet=new Set();
  IT.brkT=0; IT.pl=null; IT.peak=0; IT.pellT=0;
}
function itStory(){ return !!G&&G.mode==='story'; }
// a hash of a string to [0,1): the same chest always gives the same thing, so a reload never rerolls it
function itHash(s){ let h=2166136261>>>0; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } h^=h>>>13; h=Math.imul(h,0x5bd1e995)>>>0; h^=h>>>15; return (h>>>0)/4294967296; }
// the act a place belongs to, 0 (Act I) to 4 (the finale): an outdoor y gives its map, inside an area the door's map
function itActAt(x,y){ try{ if(x!=null&&y!=null&&!AREA&&x<IZX-50) return clamp(mapAt(y),0,4); return clamp(curMap(),0,4); }catch(e){ return 0; } }
// the price of one at act k (0..4; the finale uses Act IV's), or its first price when that act has none
function itPrice(id,k){ const d=ITEMDEF[id]; if(!d||!d.price) return 0; k=clamp(k==null?itActAt():k,0,3); let p=d.price[k]; if(p==null) p=d.price.find(v=>v!=null); return p||0; }

// ---------- 3. getting one: carry limits, the coin fallback, the quick slot
// returns {got, coins}; o: {quiet, x, y, why}
function itAdd(id,n,o){
  o=o||{}; n=Math.max(0,n|0); const d=ITEMDEF[id];
  if(!G||!n) return {got:0,coins:0};
  if(!d||d.kind!=='use'){ G.items[id]=(G.items[id]||0)+n; return {got:n,coins:0}; }
  const have=G.items[id]||0, room=Math.max(0,d.cap-have), got=Math.min(n,room), extra=n-got;
  if(got>0){ G.items[id]=have+got; const q=quickItem(); if(!q||!(G.items[q]>0)) setQuick(id); }
  let coins=0;
  if(extra>0){ coins=extra*itPrice(id,itActAt(o.x,o.y)); if(coins>0){ G.coins=(G.coins||0)+coins; try{ SFX.play('pickup'); }catch(e){} if(o.x!=null&&settings.nums!==null) ftext(o.x,o.y-20,'+'+coins,'#ffd84a',13); } }
  if(!o.quiet){
    const nm=d.name, sm=d.simple, c=G.items[id]||0;
    if(got>0){
      const first=!G.flags.it_first;
      if(first) G.flags.it_first=1;
      const more=coins>0?[` ${extra} more did not fit, so you get ${coins} coins for ${extra>1?'them':'it'}.`,` ${coins} coins for the rest.`]:['',''];
      const sub=first?S(`${d.desc} It is in your Satchel (in the Journal), and in the quick slot under your Roar meter.${more[0]}`,`${d.simpleDesc} It is in your bag now.${more[1]}`)
        :S(`In your bag: ${c} of ${d.cap}. ${d.desc}${more[0]}`,`You have ${c}. ${d.simpleDesc}${more[1]}`);
      setBanner(S(`Got: ${nm}`,`Got: ${sm}`),sub,first?4:2.4);
    }else if(coins>0) setBanner(S(`${nm}`,`${sm}`),S(`You can only carry ${d.cap}, so it turns into ${coins} coins.`,`Bag full! You get ${coins} coins.`),2.6);
  }
  try{ questPoke(); }catch(e){}
  return {got,coins};
}
function quickItem(){ if(!G||!G.flags) return null; const q=G.flags.qslot; return q&&ITEMDEF[q]&&ITEMDEF[q].kind==='use'?q:null; }
function setQuick(id){ if(!G||!G.flags) return false; if(id==null){ delete G.flags.qslot; return true; } if(!ITEMDEF[id]||ITEMDEF[id].kind!=='use') return false; G.flags.qslot=id; return true; }
// a found one (a chest, a pot, an elite) pops out on the ground and hops to Ash
function itDrop(id,x,y){ if(!G||!ITEMDEF[id]) return null; const a=rand(0,TAU), d={id,x,y,z:0,vz:170,vx:Math.cos(a)*50,vy:Math.sin(a)*40+20,t:0,area:AREA?AREA.id:null,life:120}; IT.drops.push(d); return d; }
// what a find is: weighted by the act the place is in (only things that act or an earlier one knows)
function itPick(k,r){
  const pool=IT_USE_IDS.filter(id=>ITEMDEF[id].act-1<=k), tot=pool.reduce((s,id)=>s+ITEMDEF[id].w,0);
  let x=r*tot; for(const id of pool){ x-=ITEMDEF[id].w; if(x<0) return id; }
  return pool[pool.length-1]||'it_bun';
}
// an overworld chest: 1 in 4 (1 in 2 on Nightfall Peak, where no shop is); seeded by the chest's id
function itChestRoll(id,y){ const k=clamp(mapAt(y),0,4); return itHash('itc|'+id)<(k>=4?0.5:0.25)?itPick(k,itHash('itp|'+id)):null; }
// a cave or dungeon treasure chest: always one
function itAreaChestItem(o){ return itPick(itActAt(),itHash('itp|'+(AREA?AREA.id:'')+'|'+o.id)); }

// ---------- 4. the limits
function itBossLive(){ const b=G&&G.boss, p=player; return !!(b&&!b.dead&&b.aggro&&!(b.spawnIn>0)&&p&&dist(b.x,b.y,p.x,p.y)<=820); }
function itBossMax(){ return G&&G.diff&&G.diff.name==='Easy'?2:1; }
// one attempt: the story boss site while one is on (a fight whose boss changes hands, like a pair, stays one attempt),
// else the boss itself; a death starts a new attempt (playerDied below)
function itBossTrack(){ const k=G.fightSite?'site:'+G.fightSite:G.boss; if(IT.boss.e!==k) IT.boss={e:k,n:0}; return IT.boss; }
// Pim's cocoa (and anything else that works by itself and should count): true when it may fire now (and counts it)
function itemBossTake(id){
  try{ itSync(); if(!itStory()||!itBossLive()) return true; const B=itBossTrack(); if(B.n>=itBossMax()) return false; B.n++; return true; }catch(e){ return true; }
}
// somewhere to lead Ash out to: an area with an outdoor door to go back to (house floors and dungeon floors keep the
// first door's); a cave with no start room and no door is a place with no way out
function itWayOut(){
  const A=AREA; if(!A||!G.ow) return false;
  if(A.exit&&A.exit.none&&!(A.def&&A.def.floorOf)&&!A.dn) return false;
  if(G.fightSite||(typeof WAKE!=='undefined'&&WAKE.on)) return false;
  return true;
}
function canUseItem(id){
  itSync();
  const d=ITEMDEF[id], p=player;
  if(!G||G.mode!=='story') return S('Not in the Arena','Not in the Arena');
  if(!d||d.kind!=='use') return d&&d.kind==='auto'?S('It works by itself','It works by itself'):S('You cannot use that','You cannot use that');
  if(!(G.items[id]>0)) return S('You have none left','None left');
  if(!p||p.dead||DLG) return S('Not now','Not now');
  if(IT.use||(IT.crow&&IT.crow.mode!=='out')||p.drinkT>0) return S('Wait a moment','Wait a moment');
  if(G.mini) return S('Not during a game','Not in a game');
  const boss=itBossLive();
  if(id==='it_feather'){
    if(boss) return S('Not in a boss fight','Not in a boss fight');
    if(!AREA) return S('Use it inside a cave, dungeon or house','Use it inside');
    if(!itWayOut()) return S('Pebble cannot find a way out of here','No way out here');
  }
  if(boss&&itBossTrack().n>=itBossMax()) return itBossMax()>1?S('Two items per boss fight','Two items per boss fight'):S('One item per boss fight','One item per boss fight');
  if(id==='it_bun'&&p.hp>=p.maxHp-0.5) return S('Your health is full','Your health is full');
  if(id==='it_drop'&&p.roar>=100) return S('Your Roar is already full','Your Roar is full');
  return true;
}
function itSay(t){ const p=player; if(!p||!G||G.time<IT.sayT) return; IT.sayT=G.time+0.7; ftext(p.x,p.y-38,simplify(t),'#ffe0b0',13); try{ SFX.play('ui'); }catch(e){} }
function useItem(id){
  const ok=canUseItem(id);
  if(ok!==true){ if(G&&player) itSay(ok); return false; }
  const d=ITEMDEF[id], p=player, boss=itBossLive();
  G.items[id]--; if(!(G.items[id]>0)) delete G.items[id];
  if(boss) itBossTrack().n++;
  IT.use={id,t:IT_USE_T};
  p.drinkPool=0; p.drinkT=0.9; p.useIco=id;   // (v12) the pose shows this item in his hand, not the green flask (a10c_t3ash.js)
  try{ SFX.play('drink'); }catch(e){}
  ftext(p.x,p.y-34,simplify(d.name),'#ffe6a8',13);
  if(!boss) saveGame();
  return true;
}
function itemBuffs(){ if(IT.G!==G) return []; const o=[]; for(const id in IT.buffs){ const b=IT.buffs[id]; o.push({id,icon:ITEMDEF[id].icon,left:Math.max(0,b.left),total:b.total}); } return o; }
function itEndBuffs(){ IT.buffs={}; }

// ---------- 5. the effects (when the 0.5 s use is over)
function itEffect(id){
  const p=player, H=(G.diff&&G.diff.heal)||1, d=ITEMDEF[id];
  if(!p||p.dead) return;
  switch(id){
    case 'it_bun': { const pool=p.maxHp*0.25*H, old=IT.buffs.it_bun, rem=old?old.rate*Math.max(0,old.left):0;
      IT.buffs.it_bun={left:d.t,total:d.t,rate:(pool+rem)/d.t};
      if(settings.nums) ftext(p.x,p.y-24,'+'+Math.round(pool),'#8dff9a',14);
      emit(p.x,p.y,14,{col:'255,214,140',ang:-Math.PI/2,spread:1,smin:20,smax:70,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:20}); break; }
    case 'it_pepper': p.energy=p.maxEnergy; p.exhausted=false; p.regenDelay=0; IT.buffs.it_pepper={left:d.t,total:d.t};
      emit(p.x,p.y-8,22,{kind:'fire',ang:-Math.PI/2,spread:1.2,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6}); try{ SFX.play('pickup'); }catch(e){} break;
    case 'it_feather': itCrowStart(); break;
    case 'it_taffy': p.stamina=p.maxStamina; p.stamDelay=0; IT.buffs.it_taffy={left:d.t,total:d.t};
      emit(p.x,p.y,16,{col:'255,170,210',ang:-Math.PI/2,spread:1.3,smin:30,smax:110,lmin:.3,lmax:.7,zmin:1.5,zmax:3,rise:15}); break;
    case 'it_drop': p.roar=100; shake(4); flashA=Math.max(flashA,0.16); flashCol='255,220,120';
      emit(p.x,p.y,26,{col:'255,226,120',smin:80,smax:260,lmin:.25,lmax:.5,zmin:1.5,zmax:3,drag:3}); try{ SFX.play('upgrade'); }catch(e){}
      ftext(p.x,p.y-50,simplify(S('ROAR is ready!','ROAR is ready!')),'#ffd84a',14); break;
    case 'it_stone': IT.buffs.it_stone={left:d.t,total:d.t};
      emit(p.x,p.y,16,{col:'255,150,90',ang:-Math.PI/2,spread:1.2,smin:20,smax:80,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:20}); break;
    case 'it_snowball': itFrost(); break;
    case 'it_pudding': heal(p.maxHp*0.15*H); IT.buffs.it_pudding={left:d.t,total:d.t};
      emit(p.x,p.y,18,{col:'255,240,200',ang:-Math.PI/2,spread:1.2,smin:30,smax:110,lmin:.3,lmax:.7,zmin:1.5,zmax:3,rise:15}); break;
  }
}
// the frost burst: foes within 90 px (plus their size) freeze, 2.5 s; a boss only 0.9 s (stunEnemy gives a boss 35%)
function itFrost(){
  const p=player, R=90; let n=0;
  for(const e of G.enemies){
    if(e.dead||e.passive||e.spawnIn>0||e.invuln||e.type==='vorlaxis'||e.type==='egg') continue;
    if(dist(p.x,p.y,e.x,e.y)>R+(e.r||10)||!ashHits(e,null,p.x,p.y)) continue;   // (v12: the frost does not pass through walls)
    stunEnemy(e,e.boss?0.9/0.35:2.5); e.itIceT=G.time+(e.boss?0.9:2.5); e.aggro=true; n++;
    emit(e.x,e.y-6,8,{col:'215,240,255',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:2.5,drag:3});
  }
  IT.fx.push({k:'frost',x:p.x,y:p.y,t:0,dur:0.7,R});
  for(let i=0;i<28;i++){ const a=i/28*TAU; emit(p.x+Math.cos(a)*20,p.y+Math.sin(a)*14,1,{col:'225,245,255',ang:a,spread:0.15,smin:150,smax:240,lmin:.3,lmax:.45,zmin:1.5,zmax:3,drag:4}); }
  shake(4); try{ SFX.play('block'); }catch(e){}
  return n;
}
// Pebble's Feather: Pebble flies down, circles Ash, and the screen fades to his door outside
function itCrowStart(){
  const p=player;
  IT.crow={mode:'in',t:0,x0:p.x-320,y0:p.y-280,x:p.x-320,y:p.y-280,flap:0,area:AREA?AREA.id:null};
  try{ SFX.play('bird',0.9); }catch(e){}
  setBanner(S('Pebble\'s Feather','Pebble\'s Feather'),S('Pebble the crow knows the way out. Follow that crow!','Pebble shows you the way out!'),2);
}
function itCrowTick(dt){
  const C=IT.crow, p=player; if(!C) return;
  C.t+=dt; C.flap+=dt*14;
  if(C.mode==='in'||C.mode==='lead'){
    if(!AREA||AREA.id!==C.area||p.dead){ C.mode='out'; C.t=0; G.fade=Math.min(G.fade||0,0.4); return; }
    p.iframes=Math.max(p.iframes,0.25);
    if(C.mode==='in'){ const u=Math.min(1,C.t/0.85), e=1-(1-u)*(1-u); C.x=lerp(C.x0,p.x+16,e); C.y=lerp(C.y0,p.y-46,e)-Math.sin(u*Math.PI)*30; if(u>=1){ C.mode='lead'; C.t=0; } }
    else{
      const a=C.t*7; C.x=p.x+Math.cos(a)*26; C.y=p.y-48+Math.sin(a)*10; G.fade=Math.max(G.fade||0,Math.min(1,C.t/0.45));
      if(C.t>=0.5){
        if(itWayOut()&&!itBossLive()){ exitArea(); C.x=player.x+20; C.y=player.y-50; try{ SFX.play('bird',0.7); }catch(e){} }
        C.mode='out'; C.t=0;
      }
    }
    return;
  }
  C.x+=250*dt; C.y-=190*dt; if(C.t>2.2) IT.crow=null;
}

// ---------- 6. every frame Ash plays: the use, the boosts, drops, pots, the flask belt, Pell on the peak
function itTick(dt){
  const p=player; if(!p||!itStory()) return;
  const U=IT.use;
  if(U){ U.t-=dt; if(U.t<=0){ IT.use=null; p.drinkT=0; itEffect(U.id); } }
  for(const id in IT.buffs){
    const b=IT.buffs[id], k=Math.min(dt,Math.max(0,b.left)); b.left-=dt;
    if(id==='it_bun') heal(b.rate*k,true);
    else if(id==='it_pepper'){ p.energy=p.maxEnergy; p.exhausted=false; if(Math.random()<dt*6) emit(p.x+rand(-8,8),p.y-6,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:50,lmin:.3,lmax:.5,zmin:1.5,zmax:3,grow:3}); }
    else if(id==='it_taffy'){ p.stamina=p.maxStamina; p.stamDelay=0; }
    else if((id==='it_stone'||id==='it_pudding')&&Math.random()<dt*3) emit(p.x+rand(-10,10),p.y+rand(-6,6),1,{col:id==='it_stone'?'255,150,90':'255,236,190',ang:-Math.PI/2,spread:0.5,smin:15,smax:40,lmin:.4,lmax:.7,zmin:1.2,zmax:2.2,rise:15});
    if(b.left<=0) delete IT.buffs[id];
  }
  itCrowTick(dt);
  for(const f of IT.fx) f.t+=dt; if(IT.fx.length) IT.fx=IT.fx.filter(f=>f.t<f.dur);
  itDropsTick(dt);
  itBrkTick(dt);
  itFlaskCap();
  IT.pellT-=dt; if(IT.pellT<=0){ IT.pellT=0.5; itPellTick(); }
}
function itDropsTick(dt){
  if(!IT.drops.length) return;
  const p=player, here=AREA?AREA.id:null;
  for(const d of IT.drops){
    if(d.area!==here){ d.gone=true; continue; }
    d.t+=dt; d.life-=dt; if(d.life<=0){ d.gone=true; continue; }
    if(d.z>0||d.vz>0){ d.vz-=520*dt; d.z=Math.max(0,d.z+d.vz*dt); if(d.z<=0&&d.vz<0){ d.vz=d.vz<-120?-d.vz*0.35:0; } d.x+=d.vx*dt; d.y+=d.vy*dt; }
    const dd=dist(d.x,d.y,p.x,p.y);
    if(d.t>0.45&&dd<115&&!p.dead){ const a=angTo(d.x,d.y,p.x,p.y), sp=Math.min(dd,360*dt+dd*4*dt); d.x+=Math.cos(a)*sp; d.y+=Math.sin(a)*sp; }
    if(d.t>0.45&&dist(d.x,d.y,p.x,p.y)<20&&!p.dead){ d.gone=true; itAdd(d.id,1,{x:d.x,y:d.y}); try{ SFX.play('pickup'); }catch(e){} emit(d.x,d.y,10,{col:'255,226,150',ang:-Math.PI/2,spread:1,smin:30,smax:90,lmin:.3,lmax:.5,zmin:1.5,zmax:2.5,rise:20}); }
  }
  IT.drops=IT.drops.filter(d=>!d.gone);
}
// pots and barrels: every break is noticed here (sword, bombs, whip, hammer, arrows), 1 in 25 drops a Lantern Bun
function itBrkTick(dt){
  const p=player;
  IT.brkT-=dt;
  if(IT.brkT<=0){
    IT.brkT=0.5; const next=[], src=AREA?AREA.objs:mapList(LANDMARKS,curMap());
    for(const o of src){ if(!o||!o.breakable) continue; if(!AREA&&dist2(o.x,o.y,p.x,p.y)>760*760) continue; if(!IT.brkSet.has(o)) o._itB=o.broken?1:0; next.push(o); }
    IT.brk=next; IT.brkSet=new Set(next);
  }
  for(const o of IT.brk){
    if(o.broken){ if(!o._itB){ o._itB=1; if(Math.random()<1/25) itDrop('it_bun',o.x,o.y); } }
    else o._itB=0;
  }
}
// new flask gains stop at 10 (a save that already has more keeps them, and a respec can win them back)
function itFlaskCap(){
  const p=player; if(!p||!itStory()) return;
  if(IT.pl!==p){ IT.pl=p; IT.peak=p.potionsMax; return; }
  if(p.potionsMax<=IT.peak) return;
  const top=Math.max(IT_FLASKS,IT.peak);
  if(p.potionsMax>top){ p.potionsMax=top; p.potions=p.potionsMax;
    setBanner(S('Your flask belt is full','Your flask belt is full'),S(`It holds ${top} flasks, and they are all full.`,`It holds ${top}. They are all full.`),2.6); }
  IT.peak=Math.max(IT.peak,p.potionsMax);
}

// ---------- 7. the hooks into the game
{ const base=updatePlayer; updatePlayer=function(dt,inp){
    try{ itSync(); const U=IT.use, p=player; if(U&&p){ p.drinkPool=0; p.drinkT=Math.max(0.02,0.9*U.t/IT_USE_T); p.useIco=U.id; } else if(p&&p.useIco) p.useIco=null; }catch(e){ console.error('items',e); }
    const r=base(dt,inp);
    try{ itTick(dt); }catch(e){ console.error('items',e); }
    return r; }; }
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){ if(IT.G===G&&IT.buffs.it_stone&&amt>0) amt*=0.75; return base(amt,sx,sy,kb); }; }
{ const base=damageEnemy; damageEnemy=function(e,amt,o){ if(IT.G===G&&IT.buffs.it_pudding&&amt>0) amt*=1.2; return base(e,amt,o); }; }
{ const base=playerDied; playerDied=function(){ const r=base.apply(this,arguments); try{ itEndBuffs(); IT.use=null; IT.crow=null; IT.boss={e:null,n:0}; }catch(e){} return r; }; }
{ const base=innRest; innRest=function(){ const r=base.apply(this,arguments); try{ itEndBuffs(); }catch(e){} return r; }; }
{ const base=restAtShrine; restAtShrine=function(){ const r=base.apply(this,arguments); try{ itEndBuffs(); }catch(e){} return r; }; }
{ const base=saveGame; saveGame=function(){ try{ itSync(); itFlaskCap(); }catch(e){} return base.apply(this,arguments); }; }
{ const base=giveReward; giveReward=function(){ const r=base.apply(this,arguments); try{ itFlaskCap(); }catch(e){} return r; }; }
{ const base=giveTalkReward; giveTalkReward=function(){ const r=base.apply(this,arguments); try{ itFlaskCap(); }catch(e){} return r; }; }
// the eight go through the carry limit (story `give`, rewards, anything that hands one over)
{ const base=giveItems; giveItems=function(obj,quiet){
    if(!obj||!G) return base(obj,quiet);
    let rest=null;
    for(const k in obj){ const d=ITEMDEF[k]; if(d&&d.kind==='use'){ if(!rest) rest=Object.assign({},obj); delete rest[k]; itAdd(k,obj[k],{quiet,x:player&&player.x,y:player&&player.y}); } }
    return base(rest||obj,quiet); }; }
// finds: overworld chests (seeded), cave and dungeon treasure chests (always), elites (1 in 10)
{ const base=openChest; openChest=function(c){ const was=!!(c&&G&&G.chestsOpened[c.id]); const r=base.apply(this,arguments);
    try{ if(c&&!was&&G.chestsOpened[c.id]&&itStory()){ const id=itChestRoll(c.id,c.y); if(id) itDrop(id,c.x,c.y+6); } }catch(e){ console.error('items',e); } return r; }; }
{ const base=areaObjAct; areaObjAct=function(o){ const was=!!(o&&o.k==='cchest'&&G&&!G.found[o.id]); const r=base.apply(this,arguments);
    try{ if(was&&G.found[o.id]&&AREA&&itStory()) itDrop(itAreaChestItem(o),o.x,o.y+6); }catch(e){ console.error('items',e); } return r; }; }
{ const base=dChestOpen; dChestOpen=function(o){ const was=!!(o&&o.kind==='treasure'&&G&&!G.found[o.id]); const r=base.apply(this,arguments);
    try{ if(was&&G.found[o.id]&&AREA&&itStory()) itDrop(itAreaChestItem(o),o.x,o.y+6); }catch(e){ console.error('items',e); } return r; }; }
{ const base=killEnemy; killEnemy=function(e){ const was=!!(e&&!e.dead); const r=base.apply(this,arguments);
    try{ if(was&&e.dead&&e.elite&&!e.boss&&itStory()&&Math.random()<0.1) itDrop('it_bun',e.x,e.y); }catch(e2){} return r; }; }

// ---------- 8. shops: one Supplies row in each shop the plan lists, opening a short list that stays open after a buy
const IT_SUPPLY={
  pell:['it_bun','it_pepper','it_feather'], hob:['it_bun'], tilly:['it_bun'],
  c_ravel:['it_pepper','it_feather','it_drop'], c_fig:['it_bun'], c_charlie:['it_bun','it_taffy'], c_maudie:['it_bun','it_taffy'],
  f_pim:['it_snowball'], f_gunnhild:['it_stone'], f_mags:['it_drop','it_snowball'], f_hask:['it_feather'],
  f_hilde:['it_bun','it_taffy','it_stone'], f_sigrun:['it_bun','it_pepper'],
  m_kelp:['it_feather','it_stone'], m_jinx:['it_pepper','it_drop'], m_gilly:['it_bun','it_taffy','it_pudding']
};
// Pell at the foot of Nightfall Peak (Act V has no other shop): the four a climb wants most, at Act IV prices
const IT_SUPPLY_PELL5=['it_bun','it_pepper','it_drop','it_stone'];
function itSupplyList(who){ if(who==='pell'&&itPell5()) return IT_SUPPLY_PELL5; return IT_SUPPLY[who]||null; }
function itShopPrice(who,id){ const p=itPrice(id,itActAt()); return who==='pell'&&G.flags.perk_discount?Math.ceil(p*0.8):p; }
function itBuy(who,id){
  const d=ITEMDEF[id], pr=itShopPrice(who,id), have=G.items[id]||0, nm=d.name, sm=d.simple;
  if(have>=d.cap) return [`You can only carry ${d.cap} of those.`,`You can only carry ${d.cap}.`];
  if((G.coins||0)<pr){ try{ SFX.play('ui'); }catch(e){} return ['Not enough coins.','Not enough coins.']; }
  G.coins-=pr; itAdd(id,1,{quiet:true}); try{ SFX.play('chest'); }catch(e){}
  const c=G.items[id]||0;
  return [`${nm}! You carry ${c} of ${d.cap}.`,`${sm}! You have ${c}.`];
}
function itSupLine(who,M){
  return {who,
    text:()=>{ const c=G.coins||0, m=M.msg||['Supplies for the road.','Supplies!'];
      return S(`${m[0]} You have ${c} coins.`,`${m[1]} You have ${c} coins.`); },
    opts:()=>{
      const ids=itSupplyList(who)||[], o=[];
      for(const id of ids.slice(0,4)){
        const d=ITEMDEF[id], pr=itShopPrice(who,id), have=G.items[id]||0, full=have>=d.cap;
        const t=full?S(`${d.name} (you carry ${have}, the most you can)`,`${d.simple} (bag full)`)
          :S(`${d.name} (${d.short}) · ${pr} coins`,`${d.simple} (${d.shortS}) · ${pr} coins`);
        o.push({t,tone:full||(G.coins||0)<pr?'locked':undefined,fn:()=>{ M.msg=itBuy(who,id); },then:()=>[itSupLine(who,M)]});
      }
      o.push({t:S('Done','Done'),then:[]});
      return o; }};
}
function itSupplies(who){ const M={msg:null}; runDialogue([itSupLine(who,M)],()=>{ scene='play'; saveGame(); }); }
{ const base=runShop; runShop=function(who,greet,list){
    try{ if(itStory()&&itSupplyList(who)&&Array.isArray(list)) list=list.concat([[S('Supplies for the road (things to carry and use)','Supplies (things to use)'),0,()=>itSupplies(who)]]); }catch(e){ console.error('items',e); }
    return base(who,greet,list); }; }

// ---------- 9. Pell's wagon at the foot of Nightfall Peak while the Long Night is on (act 5, before the dawn)
// he packs up and goes once Ash first sets foot on the peak in act 5 (until then he sells on the market square), and goes
// home to the market after the dawn
function itPell5(){ try{ if(!(G&&G.mode==='story'&&actOf(G.stage)===5&&!(G.flags&&G.flags.n_dawn))) return false;
    if(!G.flags.it_pell5go&&player&&!AREA&&curMap()===4) G.flags.it_pell5go=1;
    return !!G.flags.it_pell5go; }catch(e){ return false; } }
{ const base=npcSpot; npcSpot=function(c){ if(c&&c.id==='pell'&&itPell5()) return [IT_PELL5.x+64,IT_PELL5.y+34]; return base(c); }; }
function itPellTick(){
  const on=itPell5();
  if(!IT.pellCol) IT.pellCol=addCol({t:'r',x0:IT_PELL5.x-52,y0:IT_PELL5.y-26,x1:IT_PELL5.x+52,y1:IT_PELL5.y+10,off:true});
  IT.pellCol.off=!on;
  const n=G.npcs&&G.npcs.find(q=>q.id==='pell'), C=CASTBY.pell; if(!n||!C) return;
  const want=npcSpot(C), atPeak=n.home&&n.home[1]>4*BAND-5000;
  if(on!==atPeak||(on&&(n.home[0]!==want[0]||n.home[1]!==want[1]))){ n.x=want[0]; n.y=want[1]; n.home=[want[0],want[1]]; }
  if(on&&!AREA&&!G.flags.it_pell5&&scene==='play'&&player&&dist(player.x,player.y,n.x,n.y)<300){
    G.flags.it_pell5=1;
    bubble(n,S(`Ash! Last shop before the top! I pushed this wagon up here myself.`,`Last shop before the top!`),{who:'pell',dur:6});
  }
}
let IT_WAGON=null;
function itWagonArt(){
  if(IT_WAGON) return IT_WAGON;
  const sc=2, w=140, h=104, ox=70, oy=78, c=mkCanvas(w*sc,h*sc), g=c.getContext('2d'); g.scale(sc,sc); g.translate(ox,oy); g.lineJoin='round';
  g.fillStyle='rgba(20,10,30,.35)'; g.beginPath(); g.ellipse(2,6,62,13,0,0,TAU); g.fill();
  // shafts
  g.strokeStyle='#4a2c18'; g.lineWidth=3; g.beginPath(); g.moveTo(44,-4); g.lineTo(66,4); g.moveTo(44,4); g.lineTo(66,10); g.stroke();
  // body
  g.fillStyle='#5a1e50'; rrect(g,-48,-34,92,34,4); g.fill(); g.strokeStyle='#2a0c26'; g.lineWidth=1.6; g.stroke();
  g.fillStyle='#7a2a6a'; rrect(g,-45,-31,86,24,3); g.fill();
  g.strokeStyle='#ffd27a'; g.lineWidth=1.4; g.strokeRect(-41,-28,78,18);
  for(let i=0;i<4;i++){ g.fillStyle=['#e86a5a','#6ac8e8','#ffd27a','#8ad86a'][i]; g.beginPath(); g.arc(-30+i*18,-19,3.2,0,TAU); g.fill(); }
  // canopy
  g.fillStyle='#efe2c6'; g.beginPath(); g.moveTo(-50,-34); g.quadraticCurveTo(-2,-74,46,-34); g.closePath(); g.fill(); g.strokeStyle='#8a6a48'; g.lineWidth=1.4; g.stroke();
  g.save(); g.beginPath(); g.moveTo(-50,-34); g.quadraticCurveTo(-2,-74,46,-34); g.closePath(); g.clip(); g.fillStyle='#9a3a8a'; for(let x=-46;x<46;x+=16){ g.beginPath(); g.moveTo(x,-34); g.lineTo(x+8,-34); g.lineTo(x+4+(x+2)*0.2,-80); g.lineTo(x-4+(x+2)*0.2,-80); g.closePath(); g.fill(); } g.restore();
  // sign
  g.fillStyle='#ffd27a'; rrect(g,-22,-56,40,13,3); g.fill(); g.strokeStyle='#8a6a1a'; g.lineWidth=1; g.stroke();
  g.fillStyle='#5a1e50'; g.font=`800 9px ${typeof UIF!=='undefined'?UIF:'sans-serif'}`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('PELL',-2,-49.5);
  // a lantern on a hook
  g.strokeStyle='#3a2a1a'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-46,-36); g.lineTo(-56,-40); g.lineTo(-56,-34); g.stroke();
  g.fillStyle='#ffcf6a'; g.beginPath(); g.arc(-56,-30,3.6,0,TAU); g.fill(); g.strokeStyle='#6a4a1a'; g.stroke();
  // wheels
  for(const wx of [-30,26]){ g.fillStyle='#3a2414'; g.beginPath(); g.arc(wx,0,11,0,TAU); g.fill(); g.fillStyle='#8a5e32'; g.beginPath(); g.arc(wx,0,8.5,0,TAU); g.fill(); g.strokeStyle='#3a2414'; g.lineWidth=1.3; for(let k=0;k<6;k++){ const a=k/6*Math.PI; g.beginPath(); g.moveTo(wx+Math.cos(a)*8,Math.sin(a)*8); g.lineTo(wx-Math.cos(a)*8,-Math.sin(a)*8); g.stroke(); } g.fillStyle='#ffd27a'; g.beginPath(); g.arc(wx,0,2,0,TAU); g.fill(); }
  c.w2=w; c.h2=h; c.ox=ox; c.oy=oy; IT_WAGON=c; return c;
}
function itDrawWagon(){ const c=itWagonArt(), x=IT_PELL5.x, y=IT_PELL5.y; ctx.drawImage(c,x-c.ox,y-c.oy,c.w2,c.h2); if(isNight()) glowAt(x-56,y-30,40,'255,200,110',0.35); }
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{ if(!AREA&&itPell5()&&inView(IT_PELL5.x,IT_PELL5.y,160)) list.push({x:IT_PELL5.x,y:IT_PELL5.y,draw:itDrawWagon}); }catch(e){} }; }

// ---------- 10. drawing in the world: drops, the frost ring, frozen foes, Pebble
function itDraw(t){
  if(IT.G!==G||!G) return;
  const here=AREA?AREA.id:null;
  for(const d of IT.drops){
    if(d.area!==here||!inView(d.x,d.y,40)) continue;
    if(d.life<5&&Math.floor(d.life*8)%2) continue;
    const bob=d.z>0?d.z:Math.sin((G.time+d.x*0.01)*4)*2+2;
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(d.x,d.y+2,9,3.5,0,0,TAU); ctx.fill();
    glowAt(d.x,d.y-8-bob,20,'255,226,150',0.3);
    if(typeof drawItemIcon==='function'){ try{ drawItemIcon(ctx,d.id,d.x,d.y-9-bob,20); }catch(e){ itDisc(d.x,d.y-9-bob); } }
    else itDisc(d.x,d.y-9-bob);
  }
  for(const f of IT.fx){ if(f.k!=='frost') continue; const u=f.t/f.dur, r=f.R*(0.25+0.75*Math.sqrt(u));
    ctx.save(); ctx.globalAlpha=0.3*(1-u); ctx.fillStyle='#bfe6ff'; ctx.beginPath(); ctx.ellipse(f.x,f.y,r,r*0.72,0,0,TAU); ctx.fill();
    ctx.globalAlpha=0.85*(1-u); ctx.strokeStyle='#eefaff'; ctx.lineWidth=9*(1-u)+2; ctx.stroke();
    ctx.globalAlpha=0.6*(1-u); ctx.strokeStyle='#7ec8f0'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(f.x,f.y,r*0.82,r*0.59,0,0,TAU); ctx.stroke();
    ctx.restore(); }
  for(const e of G.enemies){ if(e.dead||!(e.itIceT>G.time)||!inView(e.x,e.y,60)) continue; itFlake(e.x,e.y-(e.r||12)-16,6+Math.sin(G.time*6)*0.6,Math.min(1,(e.itIceT-G.time)*2)); }
  const C=IT.crow; if(C){ ctx.save(); ctx.translate(C.x,C.y); ctx.scale(1.3,1.3); drawCrowAt(ctx,0,0,C.flap/TAU,false); ctx.restore(); }
}
function itDisc(x,y){ ctx.fillStyle='#ffd84a'; ctx.beginPath(); ctx.arc(x,y,7,0,TAU); ctx.fill(); ctx.strokeStyle='#8a6a1a'; ctx.lineWidth=1.4; ctx.stroke(); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x-2,y-2,2,0,TAU); ctx.fill(); }
function itFlake(x,y,r,a){ ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle='#e8f8ff'; ctx.lineWidth=1.8; ctx.lineCap='round'; ctx.beginPath(); for(let i=0;i<3;i++){ const q=i/3*Math.PI+0.3; ctx.moveTo(x-Math.cos(q)*r,y-Math.sin(q)*r); ctx.lineTo(x+Math.cos(q)*r,y+Math.sin(q)*r); } ctx.stroke(); ctx.restore(); }
{ const base=drawMarkers; drawMarkers=function(t){ base(t); try{ itDraw(t); }catch(e){ console.error('items draw',e); } }; }

window.__ebDbg=Object.assign(window.__ebDbg||{},{items:{IT,ITEMDEF,IT_SUPPLY,IT_SUPPLY_PELL5,IT_PELL5,itemInfo,canUseItem,useItem,quickItem,setQuick,itemBuffs,itemBossTake,
  add:itAdd,drop:itDrop,pick:itPick,price:itPrice,shopPrice:itShopPrice,chestRoll:itChestRoll,areaChestItem:itAreaChestItem,bossLive:itBossLive,bossMax:itBossMax,
  wayOut:itWayOut,pell5:itPell5,supplies:itSupplies,flaskCap:itFlaskCap,hash:itHash,frost:itFrost,names:()=>Object.assign({},ITEM_NAMES),
  dbg:{spawn:(type,x,y,o)=>{ const e=makeEnemy(type,x,y,Object.assign({aggro:true},o||{})); if(AREA) e.inArea=true; if(!G.enemies.includes(e)) G.enemies.push(e); return e.id; },
    boss:(type,dx)=>{ const p=player, e=makeEnemy(type||'gloamjaw',p.x+(dx||200),p.y,{aggro:true}); e.boss=true; e.aggro=true; e.spawnIn=0; if(!G.enemies.includes(e)) G.enemies.push(e); G.boss=e; return e.id; },
    hurt:a=>{ player.iframes=0; return hurtPlayer(a,player.x+20,player.y,0); },dmg:(i,a)=>{ const e=G.enemies.find(q=>q.id===i); return e?damageEnemy(e,a,{src:'slash'}):null; },
    foe:i=>{ const e=G.enemies.find(q=>q.id===i); return e?{hp:e.hp,stun:e.stun,dead:e.dead,ice:e.itIceT>G.time}:null; },
    die:()=>{ player.hp=0; playerDied(); },respawn:()=>respawn(),inn:()=>innRest(),chests:()=>CHESTS.map(c=>({id:c.id,x:c.x,y:c.y,open:!!c.open})),open:id=>{ const c=CHESTS.find(q=>q.id===id); if(c) openChest(c); return !!c; },
    diff:i=>{ G.diff=DIFFS[i]; return G.diff.name; },shop:id=>{ SHOPTALK[id](); },npc:id=>{ const n=(G.npcs||[]).find(q=>q.id===id); return n?{x:n.x,y:n.y,home:n.home}:null; },
    dungeons:()=>typeof DUNGEONS!=='undefined'?Object.keys(DUNGEONS):[],
    dchest:()=>{ const o=AREA&&AREA.objs.find(q=>q.kind==='treasure'&&!G.found[q.id]); if(!o) return null; o.sealed=false; dChestOpen(o); return o.id; },
    cchest:()=>{ const o=AREA&&AREA.objs.find(q=>q.k==='cchest'&&!G.found[q.id]); if(!o) return null; o.sealed=false; areaObjAct(o); return o.id; },
    pots:()=>(AREA?AREA.objs:mapList(LANDMARKS,curMap())).filter(o=>o.breakable).length},
  state:()=>({use:IT.use&&{id:IT.use.id,t:+IT.use.t.toFixed(2)},buffs:itemBuffs(),boss:{n:IT.boss.n,live:itBossLive(),max:itBossMax()},crow:IT.crow&&IT.crow.mode,drops:IT.drops.map(d=>d.id),qslot:quickItem(),peak:IT.peak,brk:IT.brk.length})}});
