
// ================= story progression: stages, boss sites, wards, side quests
const STAGES=['wake','lanterns','raid','lore','hollow','warcamp','wren','oath','three','gate','summit','done'];
const stageAt=s=>STAGES.indexOf(s);
const reached=s=>stageAt(G.stage)>=stageAt(s);
const SITES={
  warcamp:{poi:'warcamp',boss:'grizzlefang',stage:'warcamp',guards:[['kobold',5]]},
  oath:{poi:'oath',boss:'morrow',stage:'oath',ward:'ash',guards:[['cultist',3],['kobold',3]]},
  crag:{poi:'nests',boss:'broodmother',stage:'three',ward:'crag',guards:[['drakeling',3]]},
  mire:{poi:'mire',boss:'gloamjaw',stage:'three',ward:'mire',guards:[['kobold',3],['cultist',2]]},
  frost:{poi:'frost',boss:'greymane',stage:'three',ward:'frost',guards:[['wolf',3]]},
  gate:{poi:'gate',boss:'cindervane',stage:'gate',guards:[['knight',2],['cultist',2]]},
  summit:{poi:'summit',boss:'vorlaxis',stage:'summit',guards:[]}
};
const WARD_NAME={hollow:'the Hollow Ward',ash:'the Ash Ward',crag:'the Crag Ward',mire:'the Sunken Ward',frost:'the Frost Ward'};
const CHAPTER={wake:'Lantern Day',lanterns:'Lantern Day',raid:'Lantern Day',lore:'The Real Story',hollow:'The Real Story',warcamp:'The Kobold Chieftain',wren:'The Lorekeeper',oath:'The Ash Ward',three:'Three Wards',gate:'The Obsidian Gate',summit:'The First Flame',done:'Free Roam'};
const GOAT_SPOT=[2750,3380];
const FEST_LINES=['Happy Lantern Day, Ash! Try not to light anything that isn’t a lantern.','The bakery made dragon-shaped buns this year. In your honor. Also as a warning.','A thousand Lantern Days! Elder Yara says she remembers the first one. I think she’s joking.','Your mom’s been in the forge since dawn. Something about a surprise.'];
function siteOpen(k){ const s=SITES[k]; if(G.bossDone[s.boss]||!reached(s.stage)) return false; if(k==='summit'&&!G.flags.gate) return false; return true; }
function threeLeft(){ return ['crag','mire','frost'].filter(id=>!G.wards[id]); }
function nearestOf(list){ let b=null,bd=1e18; for(const o of list){ const d=dist2(o.x,o.y,player.x,player.y); if(d<bd){ bd=d; b=o; } } return b; }
function npcOf(kind){ return G.npcs.find(n=>n.kind===kind); }
function wardTarget(id){ return {x:WARDS[id].x,y:WARDS[id].y}; }
function siteTarget(k){ const P=POI[SITES[k].poi]; return {x:P.x,y:P.y,name:P.name}; }
function objectiveList(){
  // every place the story currently wants you to go
  const out=[];
  if(G.mode!=='story'||G.done) return out;
  const st=G.stage;
  if(st==='wake'){ const m=npcOf('maren'); out.push({text:'Visit Mom at the forge',x:m?m.x:NPCSPOT.maren[0],y:m?m.y:NPCSPOT.maren[1]}); }
  else if(st==='lanterns'){ const n=LANTERNS.filter(l=>l.lit).length; for(const L of LANTERNS) if(!L.lit) out.push({text:`Light the festival lanterns with a gentle breath (${n}/3)`,x:L.x,y:L.y}); }
  else if(st==='raid') out.push({text:`Drive the kobolds out of Emberhollow (${Math.min(G.questKills,8)}/8)`,x:POI.village.x,y:POI.village.y,near:true});
  else if(st==='lore'){ const y=npcOf('yara'); out.push({text:'Talk to Elder Yara by the well',x:y?y.x:POI.village.x,y:y?y.y:POI.village.y}); }
  else if(st==='hollow') out.push({text:'Relight the Hollow Ward under the old oak. Hold your fire breath on it.',...wardTarget('hollow')});
  else if(st==='wren'){ const d=DOORS.find(q=>q.area==='h_library'); out.push({text:'Find Sister Wren inside the Brindlecross library',x:d?d.x:NPCSPOT.wren[0],y:d?d.y:NPCSPOT.wren[1],area:'h_library',npc:'wren'}); }
  if(G.fightSite&&G.boss&&!G.boss.dead){ out.length=0; out.push({text:`Defeat ${EDEF[G.boss.type].name.split(',')[0]}`,x:G.boss.x,y:G.boss.y,fight:true}); return out; }
  for(const k in SITES){
    const s=SITES[k];
    if(siteOpen(k)){ const t=siteTarget(k); out.push({text:`Travel to ${t.name}`,x:t.x,y:t.y,site:k}); }
    else if(s.ward&&G.wardReady[s.ward]&&!G.wards[s.ward]) out.push({text:`Relight ${WARD_NAME[s.ward]}. Hold your fire breath on it.`,...wardTarget(s.ward)});
  }
  return out;
}
function questObjective(){
  if(G.mode!=='story') return null;
  if(AREA){
    const o=questObjectiveWorld(); if(!o) return o;
    const here=AREA.npcs.find(n=>n.id===o.npc);
    if(o.area===AREA.id&&here) return Object.assign({},o,{x:here.x,y:here.y});
    if(AREA.kind==='cave'&&AREA.rooms&&!(o.area===AREA.id)) return {title:AREA.name,text:`Explore ${AREA.name}. ${caveProgressText()}. The way out is the south door of the first room.`,x:AREA.exit.x,y:AREA.exit.y};
    if(AREA.camp&&AREA.camp.alive>0&&AREA.kind==='cave') return {title:AREA.name,text:`Explore ${AREA.name}. ${AREA.camp.alive} ${AREA.camp.alive===1?'enemy':'enemies'} left. The way out is at the bottom.`,x:AREA.exit.x,y:AREA.exit.y};
    return Object.assign({},o,{text:o.text+(o.x!=null&&o.x<IZX?' (leave here first)':''),x:AREA.exit.x,y:AREA.exit.y});
  }
  return questObjectiveWorld();
}
function questObjectiveWorld(){
  if(G.mode!=='story') return null;
  if(G.done) return {title:'Free roam',text:'Explore the valley. Camps, chests, shrines and star-iron are still out there.'};
  const list=objectiveList(); if(!list.length) return {title:CHAPTER[G.stage]||'',text:'Explore the valley.'};
  let o=list.length>1?nearestOf(list):list[0];
  let text=o.text;
  if(G.stage==='three'&&!o.fight){ const left=threeLeft(); text=`${o.text} · ${3-left.length}/3 lit`; }
  return {title:CHAPTER[G.stage],text,x:o.x,y:o.y,near:o.near,area:o.area,npc:o.npc};
}
function questUpdated(){ SFX.play('quest'); const o=questObjective(); if(o) setBanner('Quest updated',o.text,2.6); }
function spawnRaid(n){
  const V=POI.village;
  for(let i=0;i<n;i++){ const s=spotNear(V.x,V.y,140,520,240); makeEnemy('kobold',s.x,s.y,{level:1,aggro:i<3,homeX:s.x,homeY:s.y,leash:1100,questTag:true,elite:false}); }
}
function setStage(s,card){ G.stage=s; if(card) showCard(card[0],card[1]); }
function updateStory(dt){
  if(G.done||AREA) { if(!AREA) updateFollowers(dt); return; }
  const p=player;
  if(G.stage==='lanterns'&&LANTERNS.every(l=>l.lit)&&scene==='play'){
    G.stage='raid';
    runDialogue(STORY.lanternsDone,()=>{
      scene='play'; G.wards.hollow=false; const w=WARDS.hollow;
      emit(w.x,w.y,30,{col:'60,55,60',glow:false,ang:-Math.PI/2,spread:1,smin:30,smax:120,lmin:1,lmax:2,zmin:5,zmax:10,grow:10});
      SFX.play('warn'); setupNPCs(); spawnRaid(8); questUpdated(); saveGame();
    });
    return;
  }
  if(G.stage==='raid'&&G.questKills>=8){ G.stage='lore'; setupNPCs(); setBanner('Emberhollow is safe','For now.',2.4); later(2.6,questUpdated); saveGame(); }
  // ward heat cools off when you stop breathing on it
  for(const id in G.wardHeat){ if(!G.wards[id]&&G.time-(G.wardHeatT[id]||0)>0.25) G.wardHeat[id]=Math.max(0,G.wardHeat[id]-dt*0.35); }
  if(G.wardMsgT>0) G.wardMsgT-=dt;
  // boss sites
  for(const k in SITES){
    if(!siteOpen(k)) continue;
    const s=SITES[k], P=POI[s.poi], d=dist(p.x,p.y,P.x,P.y);
    if(!G.siteGuards[k]&&s.guards.length&&d<P.r+800&&!G.fightSite){ const g={id:'g_'+k,alive:0}; g.alive=spawnGroup(s.guards,P.x,P.y,{level:P.level,aggro:false,camp:g,homeX:P.x,homeY:P.y,leash:700}); G.siteGuards[k]=g; }
    if(G.siteGuards[k]&&d>P.r+2200&&G.fightSite!==k){ for(const e of G.enemies) if(e.camp===G.siteGuards[k]) e.dead=true; delete G.siteGuards[k]; }
    if(!G.fightSite&&d<P.r*(k==='summit'?0.62:0.72)&&!p.dead&&scene==='play'){
      G.fightSite=k; G.fightIntro=true;
      runDialogue(STORY.bosses[s.boss].intro,()=>{ scene='play'; G.fightIntro=false; startBossFight(k); });
      return;
    }
  }
  if(G.fightSite&&!G.fightIntro){
    const s=SITES[G.fightSite], P=POI[s.poi], b=G.boss;
    if(b&&!b.dead&&dist(p.x,p.y,P.x,P.y)>P.r+750){ const nm=EDEF[s.boss].name.split(',')[0]; resetBoss(); setBanner('The fight is lost for now',`${nm} waits at ${P.name}.`,2.6); }
  }
  updateFollowers(dt);
}
function startBossFight(k){
  const site=SITES[k], P=POI[site.poi], boss=site.boss;
  G.fightSite=k;
  const a=angTo(player.x,player.y,P.x,P.y);
  let bx=P.x+Math.cos(a)*130, by=P.y+Math.sin(a)*130;
  if(boss==='vorlaxis'){ bx=P.x; by=P.y-150; }
  const s=freeSpot(bx,by,EDEF[boss].r)?{x:bx,y:by}:spotNear(P.x,P.y,0,200);
  SFX.play('warn'); shake(6);
  const done3=['crag','mire','frost'].filter(q=>G.bossDone[SITES[q].boss]).length;
  spawnRune(boss,s.x,s.y,{homeX:P.x,homeY:P.y,hpScale:site.stage==='three'?1+0.12*done3:1,level:1},1.5);
  const g=G.siteGuards[k]; if(g) for(const e of G.enemies) if(e.camp===g) e.aggro=true;
  const d=EDEF[boss]; setBanner(d.name,(W<560&&d.short)?d.short:d.title,2.8,'boss'); jingle('boss_intro',null);
}
function resetBoss(){
  if(G.boss&&!G.boss.dead) G.boss.dead=true;
  G.hazards=G.hazards.filter(h=>!(h.kind==='spawn'&&EDEF[h.type].boss)&&!h.meteor);
  const k=G.fightSite; G.boss=null; G.fightSite=null; G.fightIntro=false;
  if(k&&G.siteGuards[k]){ for(const e of G.enemies) if(e.camp===G.siteGuards[k]) e.dead=true; delete G.siteGuards[k]; }
}
function storyBossDone(){
  const k=G.fightSite, site=SITES[k]; if(!site) return;
  G.fightSite=null; G.boss=null; G.bossDone[site.boss]=true; delete G.siteGuards[k];
  if(site.boss==='vorlaxis'){ finalChoice(); return; }
  runDialogue(STORY.bosses[site.boss].outro,()=>{
    scene='play';
    if(site.boss==='morrow'){ if(!G.items.oath_letter) giveItems({oath_letter:1},true); G.flags.clue_letter=true; G.flags.gateHint=true; questPoke(); if(G.choices.morrow==='jail') setupNPCs(); }
    G.pendingBless++;
    if(k==='warcamp'){ setStage('wren',['Chapter 3','The Lorekeeper']); }
    else if(k==='gate'){ G.flags.gate=true; GATE_COL.off=true; setStage('summit',['Final Chapter','The First Flame']); shake(8); SFX.play('boom'); later(3.2,()=>setBanner('The Obsidian Gate is open','The road to the summit is clear.',2.6)); }
    else if(site.ward){ G.wardReady[site.ward]=true; later(0.4,()=>setBanner('The Ward is cold',`Breathe fire on ${WARD_NAME[site.ward]} to relight it.`,3)); }
    if(k==='warcamp'||k==='gate') questUpdated();
    saveGame(); later(1.2,offerPending);
  });
}
// ---------- fire breath lights things
function wardCanLight(id){ return id==='hollow'?reached('hollow'):!!G.wardReady[id]; }
function breathIgnite(mx,my,ang,dt){
  if(G.mode!=='story') return;
  breathWorld(mx,my,ang,dt); if(AREA) return;
  for(const L of LANTERNS){
    if(L.lit||!inArcC(mx,my,ang,175,0.45,{x:L.x,y:L.y,r:12})) continue;
    if(!G.flags.forge){ if(!(G.wardMsgT>0)){ G.wardMsgT=2.5; ftext(L.x,L.y-26,'Visit Mom first','#ffd9a0',13); } continue; }
    L.lit=true; G.lanterns[L.id]=true; SFX.play('pickup'); emit(L.x,L.y,24,{col:'255,200,110',ang:-Math.PI/2,spread:1.2,smin:30,smax:120,lmin:.4,lmax:.9,zmin:1.5,zmax:3,rise:20});
    const n=LANTERNS.filter(l=>l.lit).length; if(n<3) setBanner(`${n} of 3 lanterns lit`,'',1.4);
  }
  for(const id in WARDS){
    if(G.wards[id]) continue; const w=WARDS[id];
    if(!inArcC(mx,my,ang,175,0.45,{x:w.x,y:w.y,r:24})) continue;
    if(!wardCanLight(id)){ if(!(G.wardMsgT>0)){ G.wardMsgT=3; ftext(w.x,w.y-34,id==='hollow'?'Not yet. Talk to Yara.':'Something here is still feeding on the Ward','#c9d6ff',13); } continue; }
    G.wardHeat[id]=(G.wardHeat[id]||0)+dt/2.2; G.wardHeatT[id]=G.time;
    if(Math.random()<0.4) emit(w.x+rand(-10,10),w.y+rand(-10,10),1,{col:'255,190,90',ang:-Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.4,lmax:.7,zmin:1.5,zmax:3,rise:15});
    if(G.wardHeat[id]>=1) lightWard(id);
  }
}
function lightWard(id){
  if(G.wards[id]) return;
  G.wards[id]=true; G.wardHeat[id]=1; const w=WARDS[id];
  SFX.play('shrine'); SFX.play('boom'); shake(8); flashA=0.45; flashCol='255,205,130';
  emit(w.x,w.y,60,{col:'255,200,110',ang:-Math.PI/2,spread:1.5,smin:60,smax:280,lmin:.6,lmax:1.3,zmin:2,zmax:4,rise:30});
  player.hp=player.maxHp; player.potions=player.potionsMax;
  G.spirit={id,x:w.x+46,y:w.y-30,t:0,on:true};
  later(1.0,()=>runDialogue(STORY['ward_'+id],()=>afterWard(id)));
}
function finalChoice(){
  const kind=Object.values(G.choices).filter(v=>v==='free'||v==='forgive'||v==='home').length, pages=Object.keys(G.pages).length;
  const canLantern=pages>=5&&kind>=2&&G.pages.p9;
  const pickEnd=k=>()=>{ G.choices.ending=k; };
  const opts=[{t:'End it. For the valley.',fn:pickEnd('hero')},{t:'Bind him again, forever. Become the Sixth Warden.',fn:pickEnd('warden')},{t:'Take his fire for yourself.',fn:pickEnd('heir')}];
  if(canLantern) opts.splice(1,0,{t:'Light a lantern for him, like Ember did.',fn:pickEnd('lantern')});
  const lines=[['vor',`Impossible... the fire... it chose you...`],['narr',`The First Flame flickers on the mountaintop, small and tired. For the first time in a thousand years, it's your move.`]];
  if(!canLantern&&pages>=3) lines.push(['narr',`You remember something from the Wardens' pages. Something about lanterns. You can't quite put it together.`]);
  lines.push(ch('ash',`What will you do?`,opts));
  runDialogue(lines,()=>{
    const E=ENDINGS[G.choices.ending||'hero'];
    runDialogue(E.lines.concat(heartLines(G.choices.ending||'hero'),[['narr',`Emberhollow held the biggest Lantern Day in a thousand years. Maren made a speech. Yara counted the lanterns twice.`]],EPILOGUE_FMT()),()=>{
      // Act I is over (G.flags.act1_done); G.done stays false, it means the whole game is finished (e7_acts.js)
      scene='play'; G.stage='done'; G.flags.act1_done=true; G.done=false;
      const seen=store.get('eb_endings',{}); seen[G.choices.ending||'hero']=true; store.set('eb_endings',seen);
      saveGame(true); victory();
    });
  });
}
function afterWard(id){
  scene='play'; if(G.spirit) G.spirit.on=false;
  if(id==='hollow'){ setStage('warcamp',['Chapter 2','The Kobold Chieftain']); G.pendingBless++; }
  else if(id==='ash'){ setStage('three',['Chapter 5','Three Wards']); }
  else{
    if(id==='crag'){ G.flags.pip=true; spawnPip(); }
    const n=3-threeLeft().length;
    if(n>=3){ runDialogue(STORY.allWards,()=>{ scene='play'; setStage('gate',['Chapter 6','The Obsidian Gate']); questUpdated(); saveGame(); }); saveGame(); return; }
    setBanner(`${n} of 3 Wards burning`,threeLeft().map(k=>WARD_NAME[k].replace('the ','')).join(' and ')+' still dark',2.6);
    saveGame(); return;
  }
  questUpdated(); saveGame();
}
// ---------- companions
function spawnPip(){ G.pip={x:player.x-30,y:player.y,face:0,t:0,cd:2,chirp:rand(20,40)}; }
function updateFollowers(dt){
  const p=player;
  if(G.pip){
    const q=G.pip; q.t+=dt; q.cd-=dt; q.chirp-=dt;
    let tx=p.x-Math.cos(p.facing)*34+Math.cos(q.t*1.3)*14, ty=p.y-Math.sin(p.facing)*34+Math.sin(q.t*1.7)*10-8;
    let tgt=null,bd=330*330; for(const e of G.enemies){ if(e.dead||!e.aggro||e.invuln||e.spawnIn>0||e.alpha<0.5) continue; const dd=dist2(e.x,e.y,q.x,q.y); if(dd<bd){ bd=dd; tgt=e; } }
    // errands of his own (fetching coins, chirping at secrets) pull him off his spot for a moment (a9i_comps.js)
    const go=pipExtras(q,dt,tgt); if(go){ tx=go.x; ty=go.y; }
    const d=dist(q.x,q.y,tx,ty); if(d>1400){ q.x=tx; q.y=ty; }
    const k=1-Math.exp(-dt*(go?4.5:d>200?6:3)); q.x+=(tx-q.x)*k; q.y+=(ty-q.y)*k;
    q.face=turnTo(q.face,tgt?angTo(q.x,q.y,tgt.x,tgt.y):go?angTo(q.x,q.y,tx,ty):angTo(q.x,q.y,tx+Math.cos(p.facing)*40,ty+Math.sin(p.facing)*40),6*dt);
    if(tgt&&q.cd<=0){ q.cd=2.4*Math.pow(0.8,G.pipTreats||0)*pipCd(); shoot(q.x,q.y,angTo(q.x,q.y,tgt.x,tgt.y),430,6,(5+player.level*1.6)*player.stats.fire,'pip','player',{life:0.9}); SFX.play('cast'); }
    if(q.chirp<=0){ q.chirp=rand(35,70); if(!G.inCombat&&scene==='play') pipChirp(q); }
  }
  const gt=G.goat; if(!gt) return;
  gt.t+=dt;
  if(G.side.duchess==='follow'){
    const d=dist(gt.x,gt.y,p.x,p.y);
    if(d>1500){ gt.x=p.x-40; gt.y=p.y+30; }
    if(d>70){ const a=angTo(gt.x,gt.y,p.x,p.y), sp=Math.min(260,d*2); gt.face=turnTo(gt.face,a,8*dt); const ox=gt.x,oy=gt.y; gt.x+=Math.cos(a)*sp*dt; gt.y+=Math.sin(a)*sp*dt; collideObs(gt); terrainFix(gt,ox,oy); gt.moving=true; } else gt.moving=false;
    const H=NPCSPOT.hollis; if(!AREA&&dist(gt.x,gt.y,H[0],H[1])<260&&dist(p.x,p.y,H[0],H[1])<320&&scene==='play'){ G.side.duchess='home'; G.flags.duchess_home=true; const P=POI.farm; gt.hx=P.x+60; gt.hy=P.y+150; setBanner('Duchess is home!','Talk to Farmer Hollis.',2.4); questPoke(); saveGame(); }
  }else{
    gt.wt=(gt.wt||0)-dt;
    if(gt.wt<=0){ gt.wt=rand(2,5); gt.tx=gt.hx+rand(-40,40); gt.ty=gt.hy+rand(-30,30); }
    if(dist(gt.x,gt.y,gt.tx,gt.ty)>6){ const a=angTo(gt.x,gt.y,gt.tx,gt.ty); gt.face=turnTo(gt.face,a,4*dt); gt.x+=Math.cos(a)*30*dt; gt.y+=Math.sin(a)*30*dt; gt.moving=true; } else gt.moving=false;
  }
}
function placeGoat(){
  const st=G.side.duchess;
  // the finale: Duchess is up on Nightfall Peak (she follows Ash to the top), so Hollis's pen is really empty until the
  // dawn (the act 5 Duchess mystery, q_n5_follower). A Duchess walking with Ash stays with him.
  if(G.mode==='story'&&st!=='follow'&&typeof actOf==='function'&&actOf(G.stage)===5&&!G.done&&!(G.flags&&G.flags.n_dawn>=1)){ G.goat=null; return; }
  if(st==='home'){ const P=POI.farm; G.goat={x:P.x+60,y:P.y+150,hx:P.x+60,hy:P.y+150,face:0,t:0,r:10}; }
  else if(st==='follow'){ G.goat={x:player.x-40,y:player.y+30,hx:0,hy:0,face:0,t:0,r:10}; }
  else G.goat={x:GOAT_SPOT[0],y:GOAT_SPOT[1],hx:GOAT_SPOT[0],hy:GOAT_SPOT[1],face:0,t:0,r:10};
}
function mineOre(o){
  G.ores[o.id]=true; G.iron++; SFX.play('chest'); shake(3);
  emit(o.x,o.y,30,{col:'150,200,255',smin:60,smax:200,lmin:.3,lmax:.8,zmin:1.5,zmax:3});
  setBanner('Star-iron',G.flags.forge?'Take it to Mom at the forge in Emberhollow.':'It hums in your claws.',2.6); saveGame();
}
function pickLily(l){
  l.taken=true; G.lilyN++; G.items.moonlily=(G.items.moonlily||0)+1; questPoke(); SFX.play('pickup');
  emit(l.x,l.y,18,{col:'170,210,255',ang:-Math.PI/2,spread:1,smin:30,smax:100,lmin:.4,lmax:.8,zmin:1.2,zmax:2.6,rise:12});
  setBanner(`Moonlily ×${G.items.moonlily||0}`,G.quests.moss?((G.items.moonlily||0)>=5?'Bring them to Granny Moss.':'Granny Moss needs five.'):'Someone in the Mirefen might want these.',2);
  saveGame();
}
function hintLine(){
  if(G.done) return STORY.yaraHints.done;
  const st=G.stage;
  if(st==='warcamp') return STORY.yaraHints.warcamp;
  if(st==='wren') return STORY.yaraHints.wren;
  if(st==='oath') return STORY.yaraHints.oath;
  if(st==='three') return STORY.yaraHints.three;
  if(st==='gate') return STORY.yaraHints.gate;
  if(st==='summit') return STORY.yaraHints.summit;
  if(st==='hollow') return 'The Hollow Ward, Ash. Under the old oak. Breathe on it and keep breathing.';
  return 'Happy Lantern Day, Ash.';
}
function offerPending(){
  if(G.pendingBless<=0||scene!=='play') return;
  G.pendingBless--;
  offerUpgrades(()=>{ if(G.pendingBless>0) later(0.4,offerPending); },'Choose a blessing',`The fire in your blood grows stronger. Level ${player.level}.`);
}
function restAtShrine(s){
  const p=player; G.lastShrine=s.id; G.shrines[s.id]=true;
  p.hp=p.maxHp; p.potions=p.potionsMax; p.stamina=p.maxStamina; p.energy=p.maxEnergy; p.stats.phoenix=p.stats.phoenixMax||0;
  SFX.play('shrine'); flashA=0.25; flashCol='255,210,150';
  emit(s.x,s.y,40,{col:'255,200,120',ang:-Math.PI/2,spread:1.2,smin:30,smax:140,lmin:.6,lmax:1.2,zmin:1.5,zmax:3,rise:20});
  saveGame(true); setBanner('Rested','Health and draughts restored. Game saved.',2.2);
  if(G.pendingBless>0) later(0.6,offerPending);
  dreamHook('shrine');
}
function openChest(c){
  c.open=true; G.chestsOpened[c.id]=true; SFX.play('chest');
  const lvl=regionAt(c.x,c.y).level, xp=30+15*lvl; addCoins(8+4*lvl,c.x,c.y);
  emit(c.x,c.y,30,{col:'255,210,120',ang:-Math.PI/2,spread:1,smin:40,smax:160,lmin:.5,lmax:1,zmin:1.5,zmax:3,rise:15});
  if(player.potions<player.potionsMax){ player.potions++; setBanner('Ember cache',`+${xp} experience and a healing draught`,2.4); }
  else setBanner('Ember cache',`+${xp} experience`,2.2);
  gainXp(xp); saveGame();
}

// ================= save / load (v3)
function saveData(){
  return {v:3,at:Date.now(),diff:diffIdx,x:Math.round(player.x),y:Math.round(player.y),shrine:G.lastShrine,p:snapshotPlayer(),hp:Math.round(player.hp),potions:player.potions,
    stage:G.stage,flags:G.flags,wards:G.wards,ready:G.wardReady,bosses:G.bossDone,side:G.side,ores:G.ores,iron:G.iron,tier:G.tier,
    lilies:LILIES.filter(l=>l.taken).map(l=>l.id),lilyN:G.lilyN,lan:G.lanterns,qk:G.questKills,goat:G.goat?{x:Math.round(G.goat.x),y:Math.round(G.goat.y)}:null,
    shrines:G.shrines,camps:G.campsCleared,chests:G.chestsOpened,tod:G.tod,wt:G.worldTime,kills:G.kills,deaths:G.deaths,time:G.playTime,done:G.done,fog:fogStr(),pend:G.pendingBless,
    rev:4,coins:G.coins,items:G.items,quests:G.quests,choices:G.choices,found:G.found,pages:G.pages,pgiven:G.pagesGiven||0,stats:G.stats,hat:G.hat,hats:G.hats,treats:G.pipTreats||0,caves:G.caveCleared,
    rev:5,slot:curSlot,track:G.track||[],focus:G.focus||null,friends:G.friends||{},talk:G.seenTalk||{},secrets:G.secrets||{},mini:G.miniDone||{},
    rev:6,weapons:G.weapons,weapon:G.weapon,abil:G.abil,skills:G.skills,sp:G.sp,comp:G.comp,comps:G.comps,deeds:G.deeds};
}
function saveGame(now){
  if(!G||G.mode!=='story') return;
  const s=saveData(); if(AREA&&G.ow){ s.x=Math.round(G.ow.x); s.y=Math.round(G.ow.y); } store.set(SLOT_KEYS[curSlot],s);
  Cloud.queueSave(packSaves(),now);
}
function loadGame(s){
  diffIdx=clamp(s.diff|0,0,2); newRun('story'); clearStatic();
  player=restorePlayer(s.p); player.x=s.x; player.y=s.y; player.hp=Math.max(1,s.hp||player.maxHp); player.hpShow=player.hp; player.potions=s.potions!=null?s.potions:player.potionsMax;
  Object.assign(G,{stage:s.stage||'wake',flags:s.flags||{},wards:s.wards||{hollow:true},wardReady:s.ready||{},bossDone:s.bosses||{},side:s.side||{},ores:s.ores||{},iron:s.iron||0,tier:s.tier||0,lilyN:s.lilyN||0,lanterns:s.lan||{},questKills:s.qk||0,
    shrines:s.shrines||{},lastShrine:s.shrine||'s_village',campsCleared:s.camps||{},chestsOpened:s.chests||{},tod:s.tod!=null?s.tod:0.32,worldTime:s.wt||0,kills:s.kills||0,deaths:s.deaths||0,playTime:s.time||0,done:!!s.done,pendingBless:s.pend||0,
    coins:s.coins||0,items:s.items||{},quests:s.quests||{},choices:s.choices||{},found:s.found||{},pages:s.pages||{},pagesGiven:s.pgiven||0,stats:s.stats||{},hat:s.hat||null,hats:s.hats||{},pipTreats:s.treats||0,caveCleared:s.caves||{},
    track:s.track||[],focus:s.focus||null,friends:s.friends||{},seenTalk:s.talk||{},secrets:s.secrets||{},miniDone:s.mini||{},
    weapons:s.weapons||{sword:true},weapon:s.weapon||'sword',abil:s.abil||{},skills:s.skills||{},sp:s.sp!=null?s.sp:Math.max(0,(player.level||1)-1),comp:s.comp||null,comps:s.comps||{},deeds:s.deeds||{}});
  if(!s.track){ G.track=Object.keys(G.quests).filter(k=>!G.quests[k].done).slice(-3).reverse(); }
  if(!s.rev){ if(G.side.moss==='done'&&!G.quests.moss) G.quests.moss={step:4,done:true}; if(G.side.duchess==='home'&&!G.quests.duchess) G.quests.duchess={step:4,done:true}; if(reached('warcamp')) G.flags.gateHint=true; }
  for(const c of CHESTS) c.open=!!G.chestsOpened[c.id];
  for(const L of LANTERNS) L.lit=!!G.lanterns[L.id];
  const lt=new Set(s.lilies||[]); for(const l of LILIES) l.taken=lt.has(l.id);
  GATE_COL.off=!!G.flags.gate; fogInit(s.fog||'');
  if(G.stage==='raid'){ G.wards.hollow=false; }
  setupNPCs(); if(G.stage==='raid') spawnRaid(Math.max(1,8-G.questKills));
  if(G.flags.pip) spawnPip();
  placeGoat(); if(s.goat&&G.side.duchess==='follow'){ G.goat.x=s.goat.x; G.goat.y=s.goat.y; }
}
function clearStatic(){ for(const c of CHESTS) c.open=false; for(const L of LANTERNS) L.lit=false; for(const l of LILIES) l.taken=false; if(GATE_COL) GATE_COL.off=false; for(const [,a] of PROPS) for(const p of a) p.taken=false; }
function saveSummary(s){
  if(!s||s.v!==3||s.deleted) return null;
  return `${stageLabel(s)} · Level ${(s.p&&s.p.level)||1} · ${DIFFS[clamp(s.diff|0,0,2)].name}`;
}
