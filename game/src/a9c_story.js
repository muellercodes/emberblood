
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
  else if(st==='wren'){ const w=npcOf('wren'); out.push({text:'Find Sister Wren at the Brindlecross library',x:w?w.x:NPCSPOT.wren[0],y:w?w.y:NPCSPOT.wren[1]}); }
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
  if(G.done) return {title:'Free roam',text:'Explore the valley. Camps, chests, shrines and star-iron are still out there.'};
  const list=objectiveList(); if(!list.length) return {title:CHAPTER[G.stage]||'',text:'Explore the valley.'};
  let o=list.length>1?nearestOf(list):list[0];
  let text=o.text;
  if(G.stage==='three'&&!o.fight){ const left=threeLeft(); text=`${o.text} · ${3-left.length}/3 lit`; }
  return {title:CHAPTER[G.stage],text,x:o.x,y:o.y,near:o.near};
}
function questUpdated(){ SFX.play('quest'); const o=questObjective(); if(o) setBanner('Quest updated',o.text,2.6); }
function spawnRaid(n){
  const V=POI.village;
  for(let i=0;i<n;i++){ const s=spotNear(V.x,V.y,140,520,240); makeEnemy('kobold',s.x,s.y,{level:1,aggro:i<3,homeX:s.x,homeY:s.y,leash:1100,questTag:true,elite:false}); }
}
function setStage(s,card){ G.stage=s; if(card) showCard(card[0],card[1]); }
function updateStory(dt){
  if(G.done) return;
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
  const d=EDEF[boss]; setBanner(d.name,(W<560&&d.short)?d.short:d.title,2.8,'boss');
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
  runDialogue(STORY.bosses[site.boss].outro,()=>{
    scene='play';
    if(site.boss==='vorlaxis'){ G.stage='done'; G.done=true; saveGame(); victory(); return; }
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
    const tx=p.x-Math.cos(p.facing)*34+Math.cos(q.t*1.3)*14, ty=p.y-Math.sin(p.facing)*34+Math.sin(q.t*1.7)*10-8;
    const d=dist(q.x,q.y,tx,ty); if(d>1400){ q.x=tx; q.y=ty; }
    const k=1-Math.exp(-dt*(d>200?6:3)); q.x+=(tx-q.x)*k; q.y+=(ty-q.y)*k;
    let tgt=null,bd=330*330; for(const e of G.enemies){ if(e.dead||!e.aggro||e.invuln||e.spawnIn>0||e.alpha<0.5) continue; const dd=dist2(e.x,e.y,q.x,q.y); if(dd<bd){ bd=dd; tgt=e; } }
    q.face=turnTo(q.face,tgt?angTo(q.x,q.y,tgt.x,tgt.y):angTo(q.x,q.y,tx+Math.cos(p.facing)*40,ty+Math.sin(p.facing)*40),6*dt);
    if(tgt&&q.cd<=0){ q.cd=2.4; shoot(q.x,q.y,angTo(q.x,q.y,tgt.x,tgt.y),430,6,(5+player.level*1.6)*player.stats.fire,'pip','player',{life:0.9}); SFX.play('cast'); }
    if(q.chirp<=0){ q.chirp=rand(35,70); if(!G.inCombat&&scene==='play') taunt('pip',pick(['Mip!','Mip mip!','Mrrp?','Mip! Mip!'])); }
  }
  const gt=G.goat; if(!gt) return;
  gt.t+=dt;
  if(G.side.duchess==='follow'){
    const d=dist(gt.x,gt.y,p.x,p.y);
    if(d>1500){ gt.x=p.x-40; gt.y=p.y+30; }
    if(d>70){ const a=angTo(gt.x,gt.y,p.x,p.y), sp=Math.min(260,d*2); gt.face=turnTo(gt.face,a,8*dt); const ox=gt.x,oy=gt.y; gt.x+=Math.cos(a)*sp*dt; gt.y+=Math.sin(a)*sp*dt; collideObs(gt); terrainFix(gt,ox,oy); gt.moving=true; } else gt.moving=false;
    const H=NPCSPOT.hollis; if(dist(gt.x,gt.y,H[0],H[1])<260&&dist(p.x,p.y,H[0],H[1])<300&&scene==='play'&&!G.inCombat){ G.side.duchess='home'; runDialogue(STORY.hollis.done,()=>{ scene='play'; G.pendingBless++; setBanner('Duchess is home','Farmer Hollis gave you his lucky charm. A blessing awaits.',2.8); saveGame(); }); }
  }else{
    gt.wt=(gt.wt||0)-dt;
    if(gt.wt<=0){ gt.wt=rand(2,5); gt.tx=gt.hx+rand(-40,40); gt.ty=gt.hy+rand(-30,30); }
    if(dist(gt.x,gt.y,gt.tx,gt.ty)>6){ const a=angTo(gt.x,gt.y,gt.tx,gt.ty); gt.face=turnTo(gt.face,a,4*dt); gt.x+=Math.cos(a)*30*dt; gt.y+=Math.sin(a)*30*dt; gt.moving=true; } else gt.moving=false;
  }
}
function placeGoat(){
  const st=G.side.duchess;
  if(st==='home'){ const P=POI.farm; G.goat={x:P.x+60,y:P.y+150,hx:P.x+60,hy:P.y+150,face:0,t:0,r:10}; }
  else if(st==='follow'){ G.goat={x:player.x-40,y:player.y+30,hx:0,hy:0,face:0,t:0,r:10}; }
  else G.goat={x:GOAT_SPOT[0],y:GOAT_SPOT[1],hx:GOAT_SPOT[0],hy:GOAT_SPOT[1],face:0,t:0,r:10};
}
// ---------- NPCs
function setupNPCs(){
  const V=POI.village, raid=G.stage==='raid';
  const mk=(kind,x,y,extra)=>Object.assign({kind,x,y,face:Math.PI/2,t:rand(0,9),home:[x,y],wt:0},extra||{});
  G.npcs=[mk('yara',...NPCSPOT.yara),mk('maren',...NPCSPOT.maren),mk('wren',...NPCSPOT.wren),mk('moss',...NPCSPOT.moss),mk('hollis',...NPCSPOT.hollis)];
  if(!raid) for(let i=0;i<4;i++){ const s=spotNear(V.x,V.y,140,420); G.npcs.push(mk('villager',s.x,s.y,{face:rand(0,TAU),col:pick(['#6a4a8a','#3a6a8a','#8a5a3a','#5a7a3a']),hair:pick(['#2a1a10','#6a4a2a','#b8a070','#1a1a1a']),walker:true})); }
  for(const [x,y] of NPCSPOT.town) G.npcs.push(mk('townsfolk',x,y,{face:rand(0,TAU),col:pick(['#3a5a8a','#8a3a3a','#6a6a3a','#4a7a7a','#7a4a6a']),hair:pick(['#2a1a10','#6a4a2a','#b8a070','#1a1a1a','#8a3a1a']),walker:true}));
}
function updateNPCs(dt){
  for(const n of G.npcs){
    if(dist2(n.x,n.y,player.x,player.y)>1800*1800) continue;
    n.t+=dt;
    if(n.walker){
      n.wt-=dt; if(n.wt<=0){ n.wt=rand(3,7); n.tx=n.home[0]+rand(-120,120); n.ty=n.home[1]+rand(-120,120); n.walk=Math.random()<0.6; }
      if(dist(n.x,n.y,player.x,player.y)<90){ n.walk=false; n.face=turnTo(n.face,angTo(n.x,n.y,player.x,player.y),4*dt); }
      if(n.walk&&dist(n.x,n.y,n.tx,n.ty)>10){ const a=angTo(n.x,n.y,n.tx,n.ty); n.face=turnTo(n.face,a,4*dt); const ox=n.x,oy=n.y; n.x+=Math.cos(n.face)*40*dt; n.y+=Math.sin(n.face)*40*dt; n.r=10; collideObs(n); terrainFix(n,ox,oy); n.moving=true; } else n.moving=false;
    }else{ n.face=turnTo(n.face,angTo(n.x,n.y,player.x,player.y),dist(n.x,n.y,player.x,player.y)<220?3*dt:0); }
  }
}
const NPC_LABEL={yara:'Talk to Elder Yara',maren:'Talk to Mom',wren:'Talk to Sister Wren',moss:'Talk to Granny Moss',hollis:'Talk to Farmer Hollis'};
function updateInteractions(dt){
  const p=player; let best=null, bd=1e9;
  const offer=(d,text,act,x,y,always)=>{ if(d<bd){ bd=d; best={text,act,x,y,always}; } };
  for(const s of SHRINES){
    const d=dist(p.x,p.y,s.x,s.y);
    if(!G.shrines[s.id]&&d<260){ G.shrines[s.id]=true; SFX.play('shrine'); setBanner('Shrine found',s.name,2.4); fogReveal(s.x,s.y,900); }
    if(d<64) offer(d,`Rest at ${s.name}`,()=>restAtShrine(s),s.x,s.y);
  }
  for(const c of CHESTS) if(!c.open){ const d=dist(p.x,p.y,c.x,c.y); if(d<48) offer(d,'Open the chest',()=>openChest(c),c.x,c.y,true); }
  for(const n of G.npcs){ const d=dist(p.x,p.y,n.x,n.y); if(d<70) offer(d,NPC_LABEL[n.kind]||'Talk',()=>talkTo(n),n.x,n.y); }
  for(const o of ORES) if(!G.ores[o.id]){ const d=dist(p.x,p.y,o.x,o.y); if(d<60) offer(d,'Chip out the star-iron',()=>mineOre(o),o.x,o.y,true); }
  for(const l of LILIES) if(!l.taken){ const d=dist(p.x,p.y,l.x,l.y); if(d<46) offer(d,'Pick the moonlily',()=>pickLily(l),l.x,l.y,true); }
  if(G.goat&&G.side.duchess!=='home'&&G.side.duchess!=='follow'){ const d=dist(p.x,p.y,G.goat.x,G.goat.y); if(d<70) offer(d,'Talk to the goat',talkGoat,G.goat.x,G.goat.y); }
  G.prompt=best&&(!G.inCombat||best.always)?best:null;
  // healing herbs
  if(p.hp<p.maxHp){
    const cx=Math.floor(p.x/CH), cy=Math.floor(p.y/CH), props=PROPS.get(ckey(cx,cy));
    if(props) for(const pr of props) if(pr.k==='herb'&&!pr.taken&&dist2(pr.x,pr.y,p.x,p.y)<22*22){ pr.taken=true; heal(18*G.diff.heal); SFX.play('pickup'); emit(pr.x,pr.y,10,{col:'200,170,255',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); setBanner('Healing herb','+HP',1.1); }
  }
}
function mineOre(o){
  G.ores[o.id]=true; G.iron++; SFX.play('chest'); shake(3);
  emit(o.x,o.y,30,{col:'150,200,255',smin:60,smax:200,lmin:.3,lmax:.8,zmin:1.5,zmax:3});
  setBanner('Star-iron',G.flags.forge?'Take it to Mom at the forge in Emberhollow.':'It hums in your claws.',2.6); saveGame();
}
function pickLily(l){
  l.taken=true; G.lilyN++; SFX.play('pickup');
  emit(l.x,l.y,18,{col:'170,210,255',ang:-Math.PI/2,spread:1,smin:30,smax:100,lmin:.4,lmax:.8,zmin:1.2,zmax:2.6,rise:12});
  setBanner(`Moonlily ${Math.min(G.lilyN,5)} of 5`,G.side.moss==='active'?(G.lilyN>=5?'Bring them to Granny Moss.':''):'Someone in the Mirefen might want these.',2);
  saveGame();
}
function talkGoat(){ runDialogue(STORY.duchess,()=>{ scene='play'; G.side.duchess='follow'; setBanner('Duchess is following you','Bring her home to Hollis Farm.',2.6); saveGame(); }); }
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
function talkTo(n){
  const done=()=>{ scene='play'; };
  const st=G.stage;
  switch(n.kind){
    case 'yara':
      if(st==='lore'){ runDialogue(STORY.lore,()=>{ scene='play'; G.stage='hollow'; G.shrines.s_village=true; questUpdated(); saveGame(); }); return; }
      if(st==='raid'){ runDialogue([['yara','Kobolds, Ash! Drive them out first. We can talk after.']],done); return; }
      if(st==='wake'||st==='lanterns'){ runDialogue([['yara',st==='wake'?'Your mother is waiting at the forge, Ash. Go on.':'Three lanterns on the green. Gently, now. I am counting.']],done); return; }
      runDialogue([['yara',hintLine()]],done); return;
    case 'maren':
      if(st==='wake'){ runDialogue(STORY.forge,()=>{ scene='play'; G.flags.forge=true; G.stage='lanterns'; setBanner('Grandmother’s sword','You can fight now. Left click or J to slash.',3); questUpdated(); saveGame(); }); return; }
      if(G.iron>0){ const lines=STORY.maren.reforge.slice(); runDialogue(lines,()=>{ scene='play'; while(G.iron>0){ G.iron--; G.tier++; player.stats.slash*=1.15; } setBanner(`Blade reforged · tier ${G.tier+1}`,'Your sword hits 15% harder for each star-iron.',2.8); SFX.play('upgrade'); saveGame(); }); return; }
      if(reached('wren')&&!G.flags.ironHint&&G.tier<3){ G.flags.ironHint=true; runDialogue(STORY.maren.hint,()=>{ scene='play'; saveGame(); }); return; }
      runDialogue([['maren',st==='raid'?'I’ve got the forge, you’ve got the kobolds. Go!':pick(STORY.maren.idle)[1]]],done); return;
    case 'wren':
      if(st==='wren'){ runDialogue(STORY.wren,()=>{ scene='play'; setStage('oath',['Chapter 4','The Ash Ward']); G.shrines.s_brindle=true; questUpdated(); saveGame(); }); return; }
      runDialogue([['wren',reached('oath')?hintLine():'Oh! A visitor. I am very busy reading. Come back when the world is ending. Not before.']],done); return;
    case 'moss':
      if(!G.side.moss){ runDialogue(STORY.moss.start,()=>{ scene='play'; G.side.moss='active'; if(G.lilyN>=5) later(0.2,()=>talkTo(n)); else setBanner('Side quest','Find five moonlilies in the Mirefen',2.6); saveGame(); }); return; }
      if(G.side.moss==='active'){
        if(G.lilyN>=5){ runDialogue(STORY.moss.done,()=>{ scene='play'; G.side.moss='done'; player.potionsMax++; player.potions=player.potionsMax; setBanner('New flask','You can carry one more healing draught.',2.6); SFX.play('upgrade'); saveGame(); }); return; }
        runDialogue([['moss',`${STORY.moss.wait[0][1]} You have ${G.lilyN}.`]],done); return;
      }
      runDialogue(STORY.moss.after,done); return;
    case 'hollis':
      if(!G.side.duchess){ runDialogue(STORY.hollis.start,()=>{ scene='play'; G.side.duchess='lost'; setBanner('Side quest','Find Duchess the goat in the high snow',2.6); saveGame(); }); return; }
      if(G.side.duchess==='lost'){ runDialogue(STORY.hollis.wait,done); return; }
      if(G.side.duchess==='follow'){ runDialogue([['hollis','Is that... DUCHESS! Bring her over here!']],done); return; }
      runDialogue(STORY.hollis.after,done); return;
    case 'townsfolk': runDialogue([['townsfolk',pick(TOWN_LINES)]],done); return;
    default: runDialogue([['villager',reached('raid')?pick(VILLAGER_LINES):pick(FEST_LINES)]],done);
  }
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
}
function openChest(c){
  c.open=true; G.chestsOpened[c.id]=true; SFX.play('chest');
  const lvl=regionAt(c.x,c.y).level, xp=30+15*lvl;
  emit(c.x,c.y,30,{col:'255,210,120',ang:-Math.PI/2,spread:1,smin:40,smax:160,lmin:.5,lmax:1,zmin:1.5,zmax:3,rise:15});
  if(player.potions<player.potionsMax){ player.potions++; setBanner('Ember cache',`+${xp} experience and a healing draught`,2.4); }
  else setBanner('Ember cache',`+${xp} experience`,2.2);
  gainXp(xp); saveGame();
}

// ================= save / load (v3)
const SAVE_KEY='eb_world3';
function saveData(){
  return {v:3,at:Date.now(),diff:diffIdx,x:Math.round(player.x),y:Math.round(player.y),shrine:G.lastShrine,p:snapshotPlayer(),hp:Math.round(player.hp),potions:player.potions,
    stage:G.stage,flags:G.flags,wards:G.wards,ready:G.wardReady,bosses:G.bossDone,side:G.side,ores:G.ores,iron:G.iron,tier:G.tier,
    lilies:LILIES.filter(l=>l.taken).map(l=>l.id),lilyN:G.lilyN,lan:G.lanterns,qk:G.questKills,goat:G.goat?{x:Math.round(G.goat.x),y:Math.round(G.goat.y)}:null,
    shrines:G.shrines,camps:G.campsCleared,chests:G.chestsOpened,tod:G.tod,wt:G.worldTime,kills:G.kills,deaths:G.deaths,time:G.playTime,done:G.done,fog:fogStr(),pend:G.pendingBless};
}
function saveGame(now){
  if(!G||G.mode!=='story') return;
  const s=saveData(); store.set(SAVE_KEY,s);
  Cloud.queueSave(s,now);
}
function loadGame(s){
  diffIdx=clamp(s.diff|0,0,2); newRun('story'); clearStatic();
  player=restorePlayer(s.p); player.x=s.x; player.y=s.y; player.hp=Math.max(1,s.hp||player.maxHp); player.hpShow=player.hp; player.potions=s.potions!=null?s.potions:player.potionsMax;
  Object.assign(G,{stage:s.stage||'wake',flags:s.flags||{},wards:s.wards||{hollow:true},wardReady:s.ready||{},bossDone:s.bosses||{},side:s.side||{},ores:s.ores||{},iron:s.iron||0,tier:s.tier||0,lilyN:s.lilyN||0,lanterns:s.lan||{},questKills:s.qk||0,
    shrines:s.shrines||{},lastShrine:s.shrine||'s_village',campsCleared:s.camps||{},chestsOpened:s.chests||{},tod:s.tod!=null?s.tod:0.32,worldTime:s.wt||0,kills:s.kills||0,deaths:s.deaths||0,playTime:s.time||0,done:!!s.done,pendingBless:s.pend||0});
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
  if(!s||s.v!==3) return null;
  return `Level ${(s.p&&s.p.level)||1} · ${s.done?'Free roam':CHAPTER[s.stage]||'Lantern Day'} · ${DIFFS[clamp(s.diff|0,0,2)].name}`;
}
