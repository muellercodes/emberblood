
// ================= people, quests, coins, shops, fishing, landmarks
const SPECIAL={
  juniper:{id:'juniper',name:'Juniper Ashby',col:'#a0e0b0',look:{shirt:'#3a7a5a',hair:'#2a1a10',hat:'cap'},lines:[`I'm mapping the valley's caves next. Don't worry, I'm bringing two lanterns this time.`,`Rook told everyone you saved me. He's also telling everyone you're seven feet tall.`]},
  shellby:{id:'shellby',name:'Old Shellby',col:'#a0c890',turtle:true,lines:[]},
  morrow:{id:'morrow',name:'Morrow',col:'#c792ea',look:{hood:'#5a1f6e',shirt:'#4e1e60'},lines:[]},
  sal:{id:'sal',name:'Old Sal',col:'#d8c8b0',look:{shirt:'#5a5a6a',hair:'#efeae0'},lines:[]}
};
const PEOPLE=()=>CAST.concat(Object.values(SPECIAL));
function registerSpeakers(){ for(const c of PEOPLE()){ if(!SPK[c.id]) SPK[c.id]={name:c.name,col:c.col||'#d8c3a0'}; } SPK.juniper=SPK.juniper||{name:'Juniper Ashby',col:'#a0e0b0'}; }
const TOWN_NAME={village:'Emberhollow',brindle:'Brindlecross',copper:'Coppergulch',lodge:'Frostpine Lodge',way:'the Smoky Kettle',farm:'Hollis Farm',mire:'the Mirefen'};
function personName(id){ const c=CASTBY[id]||SPECIAL[id]; return c?c.name:id; }
function personWhere(id){ const c=CASTBY[id]; if(!c) return ''; if(c.inside&&AREADEFS[c.inside]) return `${AREADEFS[c.inside].name}${c.town&&c.town!=='way'&&c.town!=='lodge'?' in '+TOWN_NAME[c.town]:''}`; return TOWN_NAME[c.town]||''; }
function fmtNames(t){ return String(t).replace(/@(\w+)/g,(m,id)=>`${personName(id)} (${personWhere(id)})`); }
function npcPresent(id){
  const c=G.choices;
  if(id==='fennick') return c.fennick!=='jail';
  if(id==='brisket') return !!G.flags.brisket_thawed;
  if(id==='juniper') return !!G.flags.juniper_found;
  if(id==='morrow') return c.morrow==='free'&&reached('three');
  return true;
}
function PRISONERS(){ const out=[]; if(G.choices.morrow==='jail') out.push({id:'morrow',area:'h_osric',dx:-50}); if(G.choices.fennick==='jail') out.push({id:'fennick',area:'h_osric',dx:50}); return out; }
function mkNPC(c,x,y){ return {kind:c.id,id:c.id,name:c.name,col:c.col||'#d8c3a0',look:c.look||{},x,y,face:Math.PI/2,t:rand(0,9),home:[x,y],wt:0,walker:!!(c.generic||c.kid),r:10,turtle:c.turtle,hair:(c.look&&c.look.hair)||'#2a1a10',li:0}; }
function homeDoor(id){ const d=DOORS.find(q=>q.owner===id); return d; }
function npcSpot(c){
  const V=POI.village, B=POI.brindle;
  switch(c.spot){
    case 'forge': return NPCSPOT.maren; case 'well': return NPCSPOT.yara; case 'farm': return NPCSPOT.hollis; case 'moss': return NPCSPOT.moss;
    case 'market': return [B.x-20,B.y+230]; case 'dock': return [6520,7400];
  }
  if(c.id==='juniper'){ const d=homeDoor('rook'); if(d) return [d.x-30,d.y+34]; }
  if(c.id==='morrow') return [POI.mosshut.x-140,POI.mosshut.y+70];
  if(c.id==='tamsin') return [POI.way.x+60,POI.way.y+120];
  if(c.id==='elka'||c.id==='brisket'){ const d=homeDoor('ulf'); if(d) return [d.x+(c.id==='elka'?60:-60),d.y+50]; }
  if(c.id==='nib') return [B.x+140,B.y+120];
  if(c.id==='gorran') return [POI.copper.x+60,POI.copper.y+90];
  if(c.id==='pick') return [POI.copper.x-80,POI.copper.y+120];
  const d=homeDoor(c.id); if(d) return [d.x+26,d.y+30];
  const P=POI[c.town]||V; return [P.x+rand(-120,120),P.y+rand(-120,120)];
}
function setupNPCs(){
  G.npcs=[];
  for(const c of PEOPLE()){
    if(c.inside||c.id==='shellby'||c.id==='sal') continue;
    if(!npcPresent(c.id)) continue;
    if(!c.town&&!SPECIAL[c.id]) continue;
    const [x,y]=npcSpot(c);
    const n=mkNPC(c,x,y); if(G.stage==='raid'&&c.town==='village'&&(c.generic||c.kid)) continue;
    G.npcs.push(n);
  }
  for(const c of CAST) if(c.inside) c.insideNow=npcPresent(c.id);
}
function updateNPCs(dt){
  const list=AREA?AREA.npcs:G.npcs;
  for(const n of list){
    if(dist2(n.x,n.y,player.x,player.y)>1800*1800) continue;
    n.t+=dt;
    if(n.walker&&!AREA){
      n.wt-=dt; if(n.wt<=0){ n.wt=rand(3,7); n.tx=n.home[0]+rand(-110,110); n.ty=n.home[1]+rand(-110,110); n.walk=Math.random()<0.6; }
      if(dist(n.x,n.y,player.x,player.y)<90){ n.walk=false; n.face=turnTo(n.face,angTo(n.x,n.y,player.x,player.y),4*dt); }
      if(n.walk&&dist(n.x,n.y,n.tx,n.ty)>10){ const a=angTo(n.x,n.y,n.tx,n.ty); n.face=turnTo(n.face,a,4*dt); const ox=n.x,oy=n.y; n.x+=Math.cos(n.face)*40*dt; n.y+=Math.sin(n.face)*40*dt; collideObs(n); terrainFix(n,ox,oy); n.moving=true; } else n.moving=false;
    }else{ n.moving=false; n.face=turnTo(n.face,angTo(n.x,n.y,player.x,player.y),dist(n.x,n.y,player.x,player.y)<220?3*dt:0); }
  }
}
// ---------- items and coins
function giveItems(obj,quiet){
  for(const k in obj){ const n=obj[k];
    if(k==='star_iron'){ G.iron+=n; if(!quiet) setBanner('Star-iron','Take it to Mom at the forge.',2.2); continue; }
    G.items[k]=(G.items[k]||0)+n; if(!quiet) setBanner(`Got: ${ITEM_NAMES[k]||k}`,n>1?`×${n}`:'',1.8);
  }
  questPoke();
}
function takeItems(obj){ for(const k in obj){ if(k==='star_iron') continue; G.items[k]=Math.max(0,(G.items[k]||0)-obj[k]); if(!G.items[k]) delete G.items[k]; } }
function haveAll(obj){ if(!obj) return true; for(const k in obj){ if(k==='star_iron') continue; if((G.items[k]||0)<obj[k]) return false; } return true; }
function addCoins(n,x,y){ G.coins=(G.coins||0)+n; if(x!=null&&settings.nums!==null) ftext(x,y-20,'+'+n,'#ffd84a',13); SFX.play('pickup'); }
function dropCoins(x,y,n){ for(let i=0;i<n;i++) G.pickups.push({x,y,vx:rand(-90,90),vy:rand(-90,90),coin:1,t:0,life:22}); }
// ---------- the quest engine
function qAvail(id){
  const d=QDEFS[id]; if(G.quests[id]) return false; if(!reached(d.min)) return false;
  if(d.after&&!(G.quests[d.after]&&G.quests[d.after].done)) return false;
  if(d.errand){ const to=d.steps[0].npc; if(!npcPresent(to)||!npcPresent(d.giver)) return false; if(Object.values(G.quests).filter(q=>!q.done&&q.errand).length>=3) return false; }
  if(id==='lure'&&!G.bossDone.gloamjaw) return false;
  if(id==='gate'&&!G.flags.gateHint) return false;
  return true;
}
function availableFrom(id){ let err=null; for(const k in QDEFS) if(QDEFS[k].giver===id&&qAvail(k)){ if(!QDEFS[k].errand) return k; if(!err) err=k; } return err; }
function stepOf(id){ const q=G.quests[id]; return q&&!q.done?QDEFS[id].steps[q.step]:null; }
function stepText(id){ const st=stepOf(id); if(!st) return ''; if(st.mini&&G.mini&&G.mini.qid===id&&MINI[G.mini.kind].hud){ const h=MINI[G.mini.kind].hud(G.mini); if(h) return h; } if(st.t==='camps'){ const q=G.quests[id]; return `${st.text} (${Math.min(st.n,(G.stats.camps||0)-q.camps0)}/${st.n})`; } if(st.t==='item'&&st.n>1) return `${fmtNames(st.text)} (${Math.min(st.n,G.items[st.item]||0)}/${st.n})`; if(st.t==='pages') return `${st.text} (${Object.keys(G.pages).length}/10 found, ${G.pagesGiven||0} delivered)`; if(st.t==='flags') return `${fmtNames(st.text)} (${st.flags.filter(f=>G.flags[f]).length}/${st.n} clues)`; return fmtNames(st.text); }
function startQuest(id){
  const d=QDEFS[id]; G.quests[id]={step:0,camps0:G.stats.camps||0,errand:!!d.errand};
  if(d.give) giveItems(d.give,true);
  onQuestStarted(id); setBanner(d.errand?'New errand':'New side quest',`${d.title.replace('Errand: ','')}: ${stepText(id)}`,3.2); G.lastQ=id;
  questPoke(); saveGame();
}
function offerQuest(id){
  const d=QDEFS[id], g=d.giver; let ok=false;
  const lines=d.offer.slice();
  lines.push(ch('ash',d.errand?'Will you take it?':'Will you help?',[
    {t:d.errand?'Sure, I can carry that.':`Of course I'll help.`,tone:'kind',fn:()=>{ ok=true; befriend(g,0.25,true); },then:[[g,d.errand?pick([`Thank you, Ash!`,`You're a star.`]):pick([`Thank you, Ash. Really.`,`I knew I could count on you.`,`Oh, thank goodness.`])]]},
    {t:d.errand?'On my way.':'Leave it to me.',tone:'brave',fn:()=>{ ok=true; },then:[[g,pick([`Ha! That's the spirit.`,`Be careful out there.`])]]},
    {t:'Not right now, sorry.',fn:()=>{ G.declined=G.declined||{}; G.declined[id]=dayNow(); },then:[[g,`That's all right. Come back if you change your mind.`]]}
  ]));
  runDialogue(lines,()=>{ scene='play'; if(ok) startQuest(id); else saveGame(); });
}
function giveReward(r){
  if(!r) return;
  if(r.coins) addCoins(r.coins,player.x,player.y);
  if(r.xp) gainXp(r.xp);
  if(r.bless){ G.pendingBless+=r.bless; later(1.5,offerPending); }
  if(r.maxhp){ player.maxHp+=r.maxhp; player.hp=player.maxHp; }
  if(r.potmax){ player.potionsMax+=r.potmax; player.potions=player.potionsMax; }
  if(r.stamina){ player.maxStamina+=r.stamina; player.stamina=player.maxStamina; }
  if(r.fn==='quillchart') G.flags.chart=true;
  if(r.fn==='reforge') reforgeIron();
  if(r.weapon) giveWeapon(r.weapon); if(r.abil) grantAbility(r.abil); if(r.sp) giveSkillPoint(r.sp);
}
function advanceQuest(id){
  const q=G.quests[id], d=QDEFS[id], st=d.steps[q.step];
  q.step++;
  if(st.reward) giveReward(st.reward);
  if(id==='mine'&&q.step===3) reforgeIron();
  if(q.step>=d.steps.length){ q.done=true; onQuestDone(id); setBanner(d.errand?'Errand done':'Quest complete',d.title.replace('Errand: ',''),2.6); G.stats.quests=(G.stats.quests||0)+1; if(d.giver) befriend(d.giver,d.errand?0.5:1.5); }
  else{ q.camps0=G.stats.camps||0; setBanner(d.title,stepText(id),2.8); SFX.play('quest'); }
  G.lastQ=id; questPoke(); saveGame();
}
function runQuestLines(id,st){
  const lines=typeof st.lines==='string'?STORY[st.lines]:st.lines;
  runDialogue(lines,()=>{ scene='play'; if(st.take) takeItems(st.take); if(st.give) giveItems(st.give); advanceQuest(id); if(id==='gate'&&G.choices.fennick==='jail') setupNPCs(); });
}
let pokeBusy=false;
function questPoke(){
  if(pokeBusy||!G||G.mode!=='story') return; pokeBusy=true;
  for(let guard=0;guard<10;guard++){
    let changed=false;
    for(const id in G.quests){ const q=G.quests[id]; if(q.done) continue; const st=QDEFS[id].steps[q.step]; if(!st) continue;
      let ok=false;
      if(st.t==='item') ok=(G.items[st.item]||0)>=st.n;
      else if(st.t==='flag') ok=!!G.flags[st.flag];
      else if(st.t==='camps') ok=(G.stats.camps||0)-q.camps0>=st.n;
      else if(st.t==='flags') ok=st.flags.filter(f=>G.flags[f]).length>=st.n;
      if(ok){ advanceQuest(id); changed=true; }
    }
    if(!changed) break;
  }
  pokeBusy=false;
}
function reforgeIron(){ if(G.iron<=0) return; while(G.iron>0){ G.iron--; G.tier++; player.stats.slash*=1.15; } setBanner(`Blade reforged · tier ${G.tier+1}`,'Each star-iron makes your sword hit 15% harder.',2.8); SFX.play('upgrade'); }
// markers: ! = has a quest for you, ? = waiting on you
function npcMarker(id){
  for(const qid in G.quests){ const st=stepOf(qid); if(st&&st.t==='talk'&&st.npc===id) return haveAll(st.take)?'?':'…'; if(st&&st.mini&&st.npc===id&&!G.mini) return '?'; const T=QDEFS[qid].topics; if(st&&T&&T[id]&&!G.flags[T[id].flag]&&G.quests[qid].step===0) return '?'; }
  if(id==='wren'&&G.quests.pages&&Object.keys(G.pages).length>(G.pagesGiven||0)) return '?';
  const av=availableFrom(id); if(av&&!QDEFS[av].errand) return '!';
  if(storyMarker(id)) return '!';
  if(av) return '✉';
  return null;
}
function storyMarker(id){
  const st=G.stage;
  if(id==='maren'&&(st==='wake'||G.iron>0)) return true;
  if(id==='yara'&&st==='lore') return true;
  if(id==='wren'&&st==='wren') return true;
  return false;
}
function questSpot(spec,npc){
  if(!spec&&npc) spec='npc:'+npc;
  if(!spec) return null;
  const [k,v]=spec.split(':');
  if(k==='npc'){ const c=CASTBY[v]; if(c&&c.inside){ const d=DOORS.find(q=>q.area===c.inside); return d?{x:d.x,y:d.y}:null; } const n=G.npcs.find(q=>q.id===v); if(n) return {x:n.x,y:n.y}; if(c&&c.inside2){ const d=DOORS.find(q=>q.area===c.inside2); return d?{x:d.x,y:d.y}:null; } return null; }
  if(k==='poi') return POI[v]?{x:POI[v].x,y:POI[v].y}:null;
  if(k==='cave'){ const m=CAVEMOUTHS.find(q=>q.area===v); return m?{x:m.x,y:m.y}:null; }
  if(k==='area'){ const d=DOORS.find(q=>q.area===v); return d?{x:d.x,y:d.y}:null; }
  if(k==='lm'){ const l=LANDMARKS.find(q=>q.id===v); return l?{x:l.x,y:l.y}:null; }
  if(k==='xy'){ const [x,y]=v.split(',').map(Number); return {x,y}; }
  if(k==='goat') return G.goat?{x:G.goat.x,y:G.goat.y}:null;
  if(k==='mini') return G.mini&&G.mini.target?G.mini.target():null;
  return null;
}
function questTargetOf(id){ const st=stepOf(id); if(!st) return null; if(st.mini){ if(G.mini&&G.mini.qid===id){ const f=MINI[G.mini.kind].target; return f?f(G.mini):null; } return questSpot(null,st.npc); } const at=typeof st.at==='function'?st.at():st.at; return questSpot(at,st.t==='talk'?st.npc:null); }
function questTargets(){
  // map + compass positions for every active side quest step
  const out=[];
  for(const id in G.quests){ const p=questTargetOf(id); if(p) out.push(Object.assign({},p,{id,text:stepText(id)})); }
  return out;
}
// ---------- talking
function talkTo(n){
  const id=n.id, done=()=>{ scene='play'; };
  if(storyTalk(n)) return;
  if(miniTalk(n)) return;
  for(const qid in G.quests){ const st=stepOf(qid); if(st&&st.t==='talk'&&st.npc===id){ if(haveAll(st.take)){ runQuestLines(qid,st); return; } } }
  if(id==='wren'&&G.quests.pages&&Object.keys(G.pages).length>(G.pagesGiven||0)){ deliverPages(); return; }
  const av=availableFrom(id); if(av&&!QDEFS[av].errand&&!(G.declined&&G.declined[av]===dayNow())){ offerQuest(av); return; }
  talkHub(n);
}
function moodLine(id){
  const c=G.choices;
  if(id==='osric'&&c.morrow==='jail') return `Morrow's in the cell. He's reorganized it alphabetically. I didn't know you could do that to a cell.`;
  if(id==='fennick'&&c.fennick==='forgive') return `Every lantern, every night. I promised. Look at them glow, Ash.`;
  if(id==='tilly'&&G.quests.bun&&G.quests.bun.done) return `Bertram came to visit! With a bun! We cried. Then it exploded a little. Then we laughed.`;
  if(id==='rook'&&G.quests.hollow&&G.quests.hollow.done) return `Juniper says I can carry her map case next time. That's basically being a knight.`;
  if(id==='maren'&&G.flags.pip) return `Pip ate a horseshoe. Is that normal? Don't answer that.`;
  if(id==='yara'&&reached('three')) return `${Object.keys(G.pages).length} pages of the Wardens' Account found. Wren must be dancing. Badly.`;
  return null;
}
function storyTalk(n){
  const id=n.id, st=G.stage, done=()=>{ scene='play'; };
  if(id==='yara'){
    if(st==='lore'){ runDialogue(STORY.lore,()=>{ scene='play'; G.stage='hollow'; G.shrines.s_village=true; questUpdated(); saveGame(); }); return true; }
    if(st==='raid'){ runDialogue([['yara','Kobolds, Ash! Drive them out first. We can talk after.']],done); return true; }
    if(st==='wake'||st==='lanterns'){ runDialogue([['yara',st==='wake'?'Your mother is waiting at the forge, Ash. Go on.':'Three lanterns on the green. Gently, now. I am counting.']],done); return true; }
    if(reached('warcamp')&&!G.flags.gateHint){ G.flags.gateHint=true; }
    if(availableFrom('yara')) return false;
    runDialogue([['yara',hintLine()]],done); return true;
  }
  if(id==='maren'){
    if(st==='wake'){ runDialogue(STORY.forge,()=>{ scene='play'; G.flags.forge=true; G.stage='lanterns'; setBanner('Grandmother’s sword','You can fight now. Left click or J to slash.',3); questUpdated(); saveGame(); }); return true; }
    if(stepOf('mine')&&stepOf('mine').npc==='maren') return false;
    if(G.iron>0){ runDialogue(STORY.maren.reforge,()=>{ scene='play'; reforgeIron(); saveGame(); }); return true; }
    if(reached('wren')&&!G.flags.ironHint&&G.tier<3){ G.flags.ironHint=true; runDialogue(STORY.maren.hint,()=>{ scene='play'; saveGame(); }); return true; }
    if(st==='raid'){ runDialogue([['maren','I’ve got the forge, you’ve got the kobolds. Go!']],done); return true; }
    return false;
  }
  if(id==='wren'&&st==='wren'){ runDialogue(STORY.wren,()=>{ scene='play'; setStage('oath',['Chapter 4','The Ash Ward']); G.shrines.s_brindle=true; questUpdated(); saveGame(); }); return true; }
  if(id==='juniper'&&AREA&&!G.flags.juniper_found){ runDialogue([['juniper',`Ash? ASH! Oh thank goodness. The bats took my lantern and I've been mapping by smell for three days.`],['juniper',`It smells like bats in here. That's my whole map. "Bats."`],['ash',`Rook's worried sick. Come on, the way out is clear.`],['juniper',`Race you! No wait, you're faster. I'll see you at home!`]],()=>{ scene='play'; G.flags.juniper_found=true; AREA.npcs=AREA.npcs.filter(q=>q.id!=='juniper'); questPoke(); setupNPCs(); saveGame(); }); return true; }
  if(id==='shellby'){ talkShellby(); return true; }
  if(id==='morrow'&&n.prisoner){ runDialogue([['morrow',pick([`The dragon promised me youth. Captain Osric promised me three meals and a blanket. Osric keeps his promises.`,`If you see Fennick, tell him to stop humming. Oh. He's in the next cell. FENNICK.`,`I've started reading. Did you know there are books that don't mention dragons at all?`])]],done); return true; }
  if(id==='morrow'){ runDialogue([['morrow',pick([`Pumpkins, Ash! Pumpkins that aren't on fire! I didn't know they came that way.`,`Granny Moss says I have a gift for gardening. Also for talking too much. Both true.`])]],done); return true; }
  if(id==='fennick'&&n.prisoner){ runDialogue([['fennick',pick([`I polish Osric's lamps now. It's honest work. Shiny, honest work.`,`Morrow alphabetized the cell. I'm under F. It's very orderly.`])]],done); return true; }
  return false;
}
function tamsinSong(){
  const L=[['tamsin',`Ah, the hero of my latest song! Want to hear it? You don't get a choice, I'm already singing.`]];
  const v=[];
  v.push(`🎵 In Emberhollow on Lantern Day, a dragon child lit the way...`);
  if(G.bossDone.grizzlefang) v.push(`🎵 Grizzlefang came with his kobold crew, and Ash said "no thank you," and that was true...`);
  if(G.bossDone.morrow) v.push(G.choices.morrow==='free'?`🎵 The High Priest fell and begged on his knees, and Ash said "go home and plant some trees"...`:`🎵 The High Priest fell and was marched to jail, where he sorts the cells by head and tail...`);
  if(G.flags.pip) v.push(`🎵 From a crag-top egg came a spark named Pip, who says "Mip!" and also "mip"...`);
  if(G.choices.fennick) v.push(G.choices.fennick==='forgive'?`🎵 The lamp-man lied, but he made it right, and now he lights the lanterns every night...`:`🎵 The lamp-man lied and he went to the cell, where he polishes lamps exceedingly well...`);
  if(G.wards.crag&&G.wards.mire&&G.wards.frost) v.push(`🎵 Five Wards burning, bright and warm, and Grandpa up the mountain, waiting out the storm...`);
  if(v.length<3) v.push(`🎵 ...that's all I've got so far. Go do something heroic so I can rhyme it.`);
  for(const s of v) L.push(['tamsin',s]);
  return L;
}
function talkShellby(){
  const done=()=>{ scene='play'; };
  if(G.pages.p2){ runDialogue([['shellby',pick([`Still here. Still old. Still a turtle.`,`Iska used to sit on my shell to think. She was heavier than she looked. Don't tell her I said so.`])]],done); return; }
  if(G.items.fish){ runDialogue([['shellby',`Is that... a fish? For me? Oh, it's been two hundred years since anyone brought me a fish.`],['shellby',`I'm Shellby. I'm one thousand and forty-one years old. I was a very small turtle when the Five came through here. Bram stepped on me. He apologized for a week.`],['shellby',`Iska tucked a page from their book under my shell for safekeeping. I forgot it was there. For nine hundred years. Here.`]],()=>{ scene='play'; takeItems({fish:1}); findPage('p2'); }); return; }
  runDialogue([['shellby',`Hmm? A visitor? Oh, I'm Shellby. I'm very old and very hungry. If you brought me a fish, I'd tell you a story about the Wardens.`],['shellby',`I hear the fisherman in Brindlecross has a spare rod. Just saying.`]],done);
}
// ---------- the Wardens' pages
function findPage(id){
  if(G.pages[id]) return;
  G.pages[id]=true; jingle('item','shrine'); const P=PAGES[id];
  const lines=[['narr',`You found a lost page of the Wardens' Account.`],['narr',`${P.title}`]].concat(P.text.map(t=>['narr',t]));
  runDialogue(lines,()=>{ scene='play'; setBanner(`${Object.keys(G.pages).length} of 10 pages found`,G.quests.pages?'Bring them to Sister Wren in Brindlecross.':'Sister Wren in Brindlecross would love to see this.',2.6); saveGame(); });
}
function deliverPages(){
  const have=Object.keys(G.pages).length, given=G.pagesGiven||0, n=have-given;
  const lines=[['wren',`${n===1?'A page':n+' pages'}! Of the Wardens' Account! Oh, oh, oh. Let me look.`]];
  let coins=n*15, bless=0;
  for(const m of [3,6,10]) if(given<m&&have>=m) bless++;
  if(have>=10) lines.push(['wren',`That's all ten. The whole book. You've given the valley back its own story, Ash. I don't know what to say. I'm a librarian. I always know what to say.`]);
  else if(bless) lines.push(['wren',`That's ${have} now! This deserves more than coins. Here.`]);
  else lines.push(['wren',`${10-have} to go. They could be anywhere. Caves, attics, under turtles. You never know.`]);
  runDialogue(lines,()=>{ scene='play'; G.pagesGiven=have; addCoins(coins,player.x,player.y); gainXp(40*n); if(bless){ G.pendingBless+=bless; later(1.2,offerPending); } if(have>=10&&G.quests.pages&&!G.quests.pages.done){ G.quests.pages.done=true; onQuestDone('pages'); setBanner('Quest complete','The Wardens’ Account',2.6); } saveGame(); });
}
// ---------- shops and inns
const HATS=[['party','Party Hat',15],['wizard','Wizard Hat',30],['crown','Flower Crown',20],['top','Top Hat',40]];
let shopWho=null;
function shopOpts(list){ return list.map(([label,price0,fn,ok])=>{ const price=price0&&shopWho==='pell'&&G.flags.perk_discount?Math.ceil(price0*0.8):price0; return {t:price?`${label} · ${price} coins`:label,fn:()=>{ if(price&&(G.coins||0)<price){ G.shopMsg='Not enough coins.'; return; } if(ok&&ok()!==true){ G.shopMsg=ok(); return; } if(price) G.coins-=price; fn(); SFX.play(price?'chest':'ui'); }}; }); }
function runShop(who,greet,list){
  G.shopMsg=null; shopWho=who;
  const opts=shopOpts(list).concat([{t:'Just looking',fn:()=>{}}]);
  runDialogue([ch(who,`${greet} You have ${G.coins||0} coins.`,opts)],()=>{ scene='play'; if(G.shopMsg) setBanner(G.shopMsg,'',1.6); saveGame(); });
}
const SHOPTALK={
  pell:()=>runShop('pell','Pell’s Wonderful Wagon! Everything is wonderful and some of it is safe.',[
    ['Refill your healing draughts',10,()=>{ player.potions=player.potionsMax; setBanner('Draughts refilled','',1.4); },()=>player.potions<player.potionsMax||'Your flasks are already full.'],
    ['A Pip treat (Pip breathes fire faster)',35,()=>{ G.pipTreats=(G.pipTreats||0)+1; setBanner('Pip treat','Mip! Mip! MIP!',1.6); },()=>G.flags.pip?((G.pipTreats||0)<3||'Pip is too full. Mip.'):'You don’t have a dragon to feed. Yet.'],
    ['A cave lantern (see farther underground)',50,()=>{ G.items.lantern=1; setBanner('Cave lantern','Caves will be a lot less scary.',1.8); },()=>!G.items.lantern||'You already have one.'],
    ['A fishing rod',25,()=>{ G.items.rod=1; setBanner('Fishing rod','Look for ripples by the water.',1.8); },()=>!G.items.rod||'You already have a rod.'],
    ['An Ember Charm (a blessing)',120,()=>{ G.stats.charms=(G.stats.charms||0)+1; G.pendingBless++; later(0.6,offerPending); },()=>(G.stats.charms||0)<3||'Sold out of charms. Come back never.']
  ]),
  marigold:()=>runShop('marigold','Vane’s Fine Hats. Every hero needs a hat.',HATS.map(([k,nm,p])=>[nm,G.hats&&G.hats[k]?0:p,()=>{ G.hats=G.hats||{}; G.hats[k]=true; G.hat=k; setBanner(nm,'Looking fabulous.',1.6); }]).concat([['Take your hat off',0,()=>{ G.hat=null; }]])),
  hob:()=>runShop('hob','The Smoky Kettle! Stew, beds, and gossip.',[
    ['A bowl of Kettle Stew (full heal)',8,()=>{ player.hp=player.maxHp; setBanner('Kettle Stew','It tastes like courage and onions.',1.8); }],
    ['Refill your healing draughts',12,()=>{ player.potions=player.potionsMax; },()=>player.potions<player.potionsMax||'Your flasks are already full.'],
    ['Rent a bed for the night',6,()=>{ innRest(); }]
  ]),
  tilly:()=>runShop('tilly','The Sleepy Salmon Inn. Soft beds, mostly-soup soup.',[
    ['Rent a bed for the night',G.flags.perk_freeinn?0:5,()=>{ innRest(); }],
    ['A slice of pie (heal)',4,()=>{ player.hp=Math.min(player.maxHp,player.hp+60); setBanner('Pie','Crust burnt, the way Bertram likes it.',1.6); }]
  ]),
  cookie:()=>runShop('cookie','Rock Soup! Now with fewer rocks!',[['A bowl of Rock Soup (heal, crunchy)',3,()=>{ player.hp=Math.min(player.maxHp,player.hp+45); setBanner('Rock Soup','Crunchy.',1.4); }]])
};
function innRest(){ player.hp=player.maxHp; player.potions=player.potionsMax; player.stamina=player.maxStamina; player.energy=player.maxEnergy; player.stats.phoenix=player.stats.phoenixMax||0; G.tod=0.3; flashA=0.6; flashCol='20,10,30'; later(0.4,()=>setBanner('Good morning','Fully rested. Game saved.',2)); saveGame(true); }
function restHome(){ innRest(); setBanner('Home sweet home','Fully rested. Game saved.',2); }
// ---------- fishing
const FISHES=['a Mirrow trout','a grumpy perch','a lantern minnow','a speckled pike','a very surprised carp','an old boot (it’s not a fish)'];
function startFishing(spot){
  if(!G.items.rod){ runDialogue([['narr',`Fish are jumping here. If only you had a rod. Dell the fisherman in Brindlecross might lend you one.`]],()=>{ scene='play'; }); return; }
  let wx=spot.x, wy=spot.y; for(let a=0;a<TAU;a+=0.3){ const x=spot.x+Math.cos(a)*70, y=spot.y+Math.sin(a)*70; if(T(x,y,{}).water){ wx=x; wy=y; break; } }
  G.fishing={spot,wx,wy,t:rand(2,5)*(G.flags.perk_lure?0.55:1),bite:0,px:player.x,py:player.y}; player.facing=angTo(player.x,player.y,wx,wy); SFX.play('roll'); setBanner('Fishing','Press E when the bobber splashes',1.6);
}
function updateFishing(dt,inp){
  const F=G.fishing; if(!F) return;
  if(dist(player.x,player.y,F.px,F.py)>12||G.inCombat){ G.fishing=null; return; }
  if(F.bite>0){ F.bite-=dt; if(inp.use||inp.attack){ G.fishing=null; catchFish(); return; } if(F.bite<=0){ G.fishing=null; setBanner('It got away','',1.2); } return; }
  if(inp.use){ G.fishing=null; setBanner('Too soon!','The fish got away.',1.2); return; }
  F.t-=dt; if(F.t<=0){ F.bite=0.95; SFX.play('hit'); G.ripples.push({x:F.wx,y:F.wy,t:0,max:0.8,r:18,splash:true}); }
}
function catchFish(){
  const r=Math.random();
  if(r<0.08){ addCoins(3,player.x,player.y); setBanner('You caught an old boot','There are 3 coins in it!',2); return; }
  giveItems({fish:1},true); G.stats.fish=(G.stats.fish||0)+1; setBanner(`You caught ${pick(FISHES.slice(0,5))}!`,'+1 fish',1.8); SFX.play('upgrade');
}
// ---------- landmarks
const FORTUNES=['You will meet a goat with strong opinions.','Today is a good day to roll out of the way.','Someone, somewhere, is counting on their fingers. For you.','A small dragon will make a big difference.','Never trust a lamp-man in a hurry.','The bakery will survive. Probably.','You will find something under a turtle.'];
const RIDDLES=[['What has a mouth but never eats, and a bed but never sleeps?',['A river','A dragon','A bakery'],0],['The more you take, the more you leave behind. What are they?',['Cookies','Footsteps','Coins'],1],['I am tall when I am young and short when I am old. What am I?',['A goat','A wizard','A candle'],2]];
const STATUE_TEXT={iska:`ISKA, WHO MADE THE FIRST LANTERN. "Light one more than you think you need."`,bram:`BRAM, WHO CARRIED THE HAMMER. "If it's stuck, hit it. If it's still stuck, hit it nicer."`,oriel:`ORIEL, WHO SPOKE WITH DRAKES. "Not every dragon is your enemy. Most are just hungry."`,sedge:`SEDGE, WHO WAS NEVER DRY. "Mud is just water that stayed for supper."`,tove:`TOVE, WHO WAS NEVER WARM. "Bring a scarf. Bring two."`};
function lmAct(o){
  const done=()=>{ scene='play'; }, say=(t,cb)=>runDialogue([['narr',t]],()=>{ scene='play'; if(cb) cb(); saveGame(); });
  const once=k=>{ if(G.found[k]) return false; G.found[k]=true; return true; };
  switch(o.k){
    case 'statue': if(PAGE_SPOTS.p7==='st_'+o.who&&!G.pages.p7){ runDialogue([['narr',STATUE_TEXT[o.who]],['narr',`Something papery is tucked into the crack under the statue's feet.`]],()=>{ scene='play'; findPage('p7'); }); return; } say(STATUE_TEXT[o.who]); return;
    case 'wishwell': if((G.coins||0)<1){ say(`You have no coins to wish with. The well looks disappointed.`); return; } G.coins--; SFX.play('pickup'); if(Math.random()<0.12&&once('well_'+Math.floor(G.worldTime/600))) say(`You toss in a coin. A moment later four coins come flying back out. The well says "keep the change."`,()=>addCoins(4,o.x,o.y)); else say(`You toss in a coin and make a wish. A voice from the bottom says: "${pick(FORTUNES)}"`); return;
    case 'facetree': riddleTree(); return;
    case 'fairyring': if(isNight()&&once('fairy')){ say(`You step into the ring. Tiny lights dance around you, and somebody giggles. You feel very, very lucky.`,()=>{ G.pendingBless++; later(0.6,offerPending); }); } else say(G.found.fairy?`The mushrooms are just mushrooms now. They seem pleased with themselves.`:`Just mushrooms. Suspiciously round ones. Maybe come back at night.`); return;
    case 'ribs': if(once('ribs')) say(`Something very big lived here a long time ago. Something even bigger did not like that. There are a few old coins between the ribs.`,()=>addCoins(10,o.x,o.y)); else say(`Very big bones. You feel small. Pip feels smaller.`); return;
    case 'wagon': if(once('wagon')){ runDialogue([['narr',`An abandoned trader's wagon. Inside: a crate of turnips, a broken umbrella, and a note.`],['narr',`"Pell, if you find this, the kettle's gone again. Bet it's those cultists. Also I buried my savings by the big rock east of Brindlecross and drew a map so I wouldn't forget. Then I lost the map. Hob."`],['narr',`Under the turnips: a smudged map.`]],()=>{ scene='play'; giveItems({map_x2:1}); saveGame(); }); } else say(`Turnips. Still turnips.`); return;
    case 'scarecrow': say(once('knight')?`Sir Strawsworth the scarecrow regards you gravely. You have been knighted. You are now Sir Ash, Knight of the Turnips.`:`Sir Strawsworth stands watch over the turnips. He has never lost a turnip. He has lost several hats.`); return;
    case 'grave': say(once('reggie')?`HERE LIES SIR REGINALD THE UNLUCKY. HE TRIPPED.`:`Someone stole Sir Reginald's flowers. Still unlucky.`); return;
    case 'iceblock': say(G.flags.brisket_thawed?`Just a puddle now. A very proud puddle.`:`There's a whole adventurer frozen inside this block of ice. He's giving you a thumbs-up. Some fire might help.`); return;
    case 'hotspring': player.hp=Math.min(player.maxHp,player.hp+player.maxHp*0.5); player.stamina=player.maxStamina; emit(o.x,o.y,20,{col:'230,240,255',glow:false,ang:-Math.PI/2,spread:1,smin:10,smax:40,lmin:1,lmax:2,zmin:4,zmax:9,grow:8,drag:0.5}); say(`Ahhhhh. You soak your tail in the hot spring. Every ache melts away.`); return;
    case 'boatframe': say(G.quests.lure&&G.quests.lure.done?`The Soggy Biscuit Two, finished at last. It's beautiful. It's also slightly crooked.`:`A half-built boat. A sign says: SOGGY BISCUIT TWO. WORK IN PROGRESS. (SIX YEARS.)`); return;
    case 'prints': runDialogue([['narr',`Soot-black bootprints, leading from the Ward stone straight to the north gate. They smell strongly of lamp oil.`],['ash',`Who walks around smelling like lamp oil?`]],()=>{ scene='play'; G.flags.clue_prints=true; questPoke(); saveGame(); }); return;
    case 'kettle': giveItems({kettle:1}); SFX.play('shrine'); ftext(o.x,o.y-30,'WHEEEEE','#fff',15); return;
    case 'helm': say(`Sir Cindervane's helmet rests on the steps. Someone has left flowers. The gate stands open behind it.`); return;
    case 'greywolf': emit(o.x,o.y-10,8,{col:'255,120,140',ang:-Math.PI/2,spread:0.8,smin:20,smax:60,lmin:.6,lmax:1,zmin:2,zmax:3,rise:20}); say(pick([`Greymane rolls over for belly rubs. A thousand-pound wolf, belly up. You'll never forget this.`,`Greymane's pack watches you pet their alpha. One of them very clearly wants a turn.`])); return;
    case 'snowman': say(G.found[o.id]?`A puddle with a carrot in it.`:`A very proud snowman. Its carrot nose looks... important. It would be a shame if someone breathed on it.`); return;
    case 'beehive': say(G.found[o.id]?`The bees are sleepy and friendly now. Mostly sleepy.`:`BZZZZ. The bees suggest you leave. A little smoke would calm them down.`); return;
    case 'frostberry': { const k='berry_'+o.id; if(G.found[k]&&G.worldTime-G.found[k]<240){ say(`No ripe berries left. They'll grow back.`); return; } G.found[k]=G.worldTime; giveItems({frostberry:1}); SFX.play('pickup'); return; }
    case 'sign': say(o.text); return;
    case 'fishspot': startFishing(o); return;
    case 'xmark': if(G.found[o.id]) return; G.found[o.id]=true; SFX.play('chest'); shake(3);
      if(o.id==='x1') say(`You dig up a little chest. Inside: 60 coins and a note that says "Nib was here."`,()=>addCoins(60,o.x,o.y));
      else if(o.id==='x2') say(`You dig up Hob's savings jar! There's a note: "If someone else finds this, at least have a stew on me." 50 coins.`,()=>addCoins(50,o.x,o.y));
      else say(`You dig up an old Warden's cache: 40 coins and a warm feeling.`,()=>{ addCoins(40,o.x,o.y); G.pendingBless++; later(0.6,offerPending); });
      return;
  }
}
function riddleTree(){
  if(G.found.barkley){ runDialogue([['narr',`Old Barkley the talking tree is asleep. He snores in a very woody way.`]],()=>{ scene='play'; }); return; }
  G.riddle=0; let right=0;
  const ask=(i)=>{ const [q,opts,ans]=RIDDLES[i]; return ch('narr',`Old Barkley creaks: "${q}"`,opts.map((t,k)=>({t,fn:()=>{ if(k===ans) right++; }}))); };
  runDialogue([['narr',`The old tree opens one enormous eye. "Hrrrm. A dragon. Answer my three riddles, little dragon, and I'll give you something nice."`],ask(0),ask(1),ask(2)],()=>{
    scene='play';
    if(right===3){ G.found.barkley=true; runDialogue([['narr',`"HRRRM! All three! Clever little dragon. Here. A blessing from a very old tree."`]],()=>{ scene='play'; G.pendingBless++; later(0.4,offerPending); saveGame(); }); }
    else runDialogue([['narr',`"${right} out of 3. Hrrrm. Try again. I'm a tree, I've got time."`]],()=>{ scene='play'; });
  });
}
// ---------- fire breath on the world
function breathWorld(mx,my,ang,dt){
  const hit=(x,y,r)=>inArcC(mx,my,ang,175,0.45,{x,y,r:r||16});
  if(!AREA){
    for(const o of LANDMARKS){
      if(o.meltable&&!G.found[o.id]&&hit(o.x,o.y)){ o.heat=(o.heat||0)+dt; if(o.heat>0.6){ G.found[o.id]=true; emit(o.x,o.y,20,{col:'230,240,255',glow:false,smin:30,smax:120,lmin:.4,lmax:.8,zmin:2,zmax:5,grow:4}); addCoins(5,o.x,o.y); const n=LANDMARKS.filter(q=>q.k==='snowman'&&G.found[q.id]).length; if(n>=5&&!G.found.carrot){ G.found.carrot=true; later(0.5,()=>{ giveItems({carrot:1}); runDialogue([['narr',`The last snowman melts, and its carrot falls into your claws. It's glowing faintly. It's the Carrot of Destiny. Nobody knows what it does. That's the destiny part.`]],()=>{ scene='play'; addCoins(30,player.x,player.y); saveGame(); }); }); } } }
      if(o.k==='iceblock'&&!G.flags.brisket_thawed&&hit(o.x,o.y,22)){ o.heat=(o.heat||0)+dt; if(o.heat>1.2){ G.flags.brisket_thawed=true; emit(o.x,o.y,30,{col:'200,230,255',glow:false,smin:30,smax:140,lmin:.4,lmax:.9,zmin:2,zmax:5}); later(0.3,()=>runDialogue([['brisket',`GAAAH! Warm! Thank you! I've been in there since Tuesday!`],['ash',`Which Tuesday?`],['brisket',`...That's a really good question. I'm Brisket. Former adventurer. I'll be at the Frostpine Lodge if you need me. Being warm. Forever.`]],()=>{ scene='play'; addCoins(20,player.x,player.y); setupNPCs(); saveGame(); })); } }
      if(o.smokeable&&!G.found[o.id]&&hit(o.x,o.y)){ o.heat=(o.heat||0)+dt; if(o.heat>0.5){ G.found[o.id]=true; emit(o.x,o.y,14,{col:'150,150,150',glow:false,ang:-Math.PI/2,spread:0.8,smin:15,smax:50,lmin:1,lmax:2,zmin:4,zmax:8,grow:8}); later(0.2,()=>{ giveItems({honey:1}); setBanner('Honey','The bees get sleepy and wander off.',1.6); }); } }
    }
    if(G.choices.fennick==='forgive') {}
    return;
  }
  caveBreath(hit,dt);
  for(const o of AREA.objs){
    if((o.k==='fireplace'||o.k==='brazier')&&!o.lit&&hit(o.x,o.y)){ o.lit=true; SFX.play('pickup'); emit(o.x,o.y,14,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:20,smax:80,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:5});
      if(o.k==='brazier'&&o.room){ const br=AREA.objs.filter(q=>q.k==='brazier'&&q.room===o.room); if(!br.every(q=>q.lit)) setBanner(`${br.filter(q=>q.lit).length} of ${br.length} braziers lit`,o.timed?'Quick, before they burn out!':'',1.2); }
      else if(o.k==='brazier'){ const br=AREA.objs.filter(q=>q.k==='brazier'); if(br.every(q=>q.lit)){ G.found[AREA.def.id+'_solved']=true; for(const c of AREA.objs) if(c.k==='cchest') c.sealed=false; setBanner('The seal breaks','The treasure chest is open.',2.2); SFX.play('shrine'); } else setBanner(`${br.filter(q=>q.lit).length} of ${br.length} braziers lit`,'',1.2); }
      if(o.k==='fireplace'&&once2(o.id)) { addCoins(3,o.x,o.y+20); setBanner('Something glints in the ashes','',1.4); } }
    if(o.k==='oven'&&hit(o.x,o.y,30)){ if(stepOf('bun')&&stepOf('bun').flag==='oven_lit'){ o.heat=(o.heat||0)+dt; if(o.heat>1.4){ G.flags.oven_lit=true; o.lit=true; questPoke(); } } else if(!o.warned){ o.warned=true; ftext(o.x,o.y-30,'Bertram looks VERY nervous','#ffd9a0',13); } }
  }
}
function once2(k){ if(G.found[k]) return false; G.found[k]=true; return true; }
// ---------- breakables
function activeBreakables(){ if(AREA) return AREA.objs.filter(o=>o.breakable&&!o.broken); return LANDMARKS.filter(o=>o.breakable&&(!o.broken||G.worldTime-o.brokenT>300)&&dist2(o.x,o.y,player.x,player.y)<200*200); }
function swingBreakables(px,py,dir,range,half){
  if(AREA&&AREA.rooms) caveSwing(px,py,dir,range,half);
  for(const o of activeBreakables()){
    if(o.broken&&G.worldTime-o.brokenT>300) o.broken=false;
    if(o.broken||!inArcC(px,py,dir,range,half,{x:o.x,y:o.y,r:14})) continue;
    o.broken=true; o.brokenT=G.worldTime; SFX.play('pop'); shake(2);
    emit(o.x,o.y,14,{col:o.k==='barrel'?'120,80,40':'170,120,80',glow:false,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4});
    const r=Math.random(); if(r<0.5) dropCoins(o.x,o.y,randi(1,3)); else if(r<0.65&&player.hp<player.maxHp) dropHeal(o.x,o.y,10);
    if(o.col){ removeCol(o.col); o.col=null; }
  }
}
// ---------- what you can press E on
function areaObjAct(o){
  const done=()=>{ scene='play'; }, say=(t,cb)=>runDialogue([['narr',t]],()=>{ scene='play'; if(cb) cb(); saveGame(); });
  const owner=AREA.def.owner, oc=CASTBY[owner];
  switch(o.k){
    case 'bed': if(o.home) { runDialogue([['narr',`Your bed. It's slightly scorched, as all your beds have been.`]],()=>{ scene='play'; restHome(); }); return; } if(o.mom){ say(`Mom's bed. Made with military precision. Don't sit on it.`); return; } if(o.inn){ say(`A soft inn bed. Ask the innkeeper if you want to rent it.`); return; } say(`This isn't your bed. You fluff the pillow anyway, to be polite.`); return;
    case 'shelf': if(o.page&&!G.pages[o.page]){ runDialogue([['narr',`Tucked between two books is a very old page.`]],()=>{ scene='play'; findPage(o.page); }); return; } if(o.jars){ say(`Jars of things. One jar is labeled "DO NOT." Another is labeled "OKAY, MAYBE."`); return; } if(o.lamps){ say(`Lamps, lamps and more lamps. One is shaped like a duck.`); return; } say(`You pull out a book: "${BOOKS[Math.abs(hashStr(o.id+(G.visits||0)))%BOOKS.length]}".`); G.visits=(G.visits||0)+1; return;
    case 'fireplace': if(o.lit){ player.hp=Math.min(player.maxHp,player.hp+10); say(`You warm your claws by the fire. Cozy.`); } else say(`A cold fireplace. You could fix that.`); return;
    case 'oven': say(AREA.def.style==='baker'&&stepOf('bun')&&stepOf('bun').flag==='oven_lit'?`Bertram whispers: "Gently. Breathe on it GENTLY."`:`It smells like a thousand years of bread.`); return;
    case 'counter': say({bread:`Loaves, rolls, and one suspiciously round bun labeled "DO NOT BREATHE ON."`,buns:`Lantern-shaped buns. They're still warm.`,lamps:`A counter full of lamps. A sign says: "ALL SALES FINAL. ALSO ALL FIRES FINAL."`,mugs:`Mugs. A sign: "No dragons behind the bar (this means you, Ash)."`,cloth:`Bolts of cloth in every colour. One is plaid. It's very loud.`,rocks:`A pot labeled ROCKS (FOR SOUP).`}[o.goods]||`A counter.`); return;
    case 'desk': say(AREA.def.style==='guard'?`Osric's desk. A half-written letter: "Dear Mum, thank you for the sweater. It is very warm and only a little itchy..."`:AREA.def.style==='scholar'?`Notes in tiny handwriting: "Smoke over Cinder Mountain thicker every night. Possibly breathing? Ask Wren. Do NOT ask the mountain."`:AREA.def.style==='mayor'?`A speech titled "Why Brindlecross Is Named After Me (Technically My Ancestor) (Still Counts)".`:`A tidy desk.`); return;
    case 'board': { const b=G.quests.bounty, b2=G.quests.bounty2; say(!b?`BOUNTY BOARD. "WANTED: Somebody to clear out the Oath's camps. Ask the Captain. He's right there. Hi."`:b2&&!b2.done?`BOUNTY BOARD: ${stepText('bounty2')}`:!b.done?`BOUNTY BOARD: ${stepText('bounty')}`:`BOUNTY BOARD. Someone has drawn a little dragon next to every crossed-out bounty.`); return; }
    case 'rack': say(o.picks?`Pickaxes. One has a face drawn on it. Its name is Pickaxe Pete.`:`Spears, a sword, and a very old broom labeled "EMERGENCY."`); return;
    case 'telescope': say(G.done?`The mountain is quiet now. Someone up there waves. No, just a bird.`:reached('summit')?`The summit glows. Something enormous is pacing around up there.`:`You look at Cinder Mountain. The smoke is thick. Something up there is breathing.`); return;
    case 'chart': say(`A star chart. Little x's mark where stars fell. Three are labeled "star-iron?" in very excited handwriting.`,()=>{ G.flags.chart=true; }); return;
    case 'trophy': say(o.antler?`Antlers from a very old deer who died peacefully of old age. Ulf insists on this.`:`A gold trophy: "BEST MAYOR." Awarded by: the Mayor.`); return;
    case 'bearrug': say(`A bear rug. Ulf says the bear is "just napping." The bear is very flat.`); return;
    case 'sled': say(`Elka's racing sled. It's named "Wolfbeater." There are tooth marks on it.`); return;
    case 'cauldron': say(AREA.def.style==='cook'?`Rock Soup. You can see the rocks. The rocks can see you.`:`It smells like moss, mint and mystery.`); return;
    case 'hatstand': SHOPTALK.marigold(); return;
    case 'portraits': say(`Thirteen family portraits, all the way back. Great ×13 Grandpa's frame just has a drawing of a scary cloud in it. The one before that is a girl with horns, holding a lantern.`); return;
    case 'gchest': if(!G.pages.p9){ runDialogue([['narr',`Grandma's old chest. Under her scarf and a bundle of lantern wicks, there's a very old, very carefully folded letter.`]],()=>{ scene='play'; findPage('p9'); }); return; } say(`Grandma's chest. An old lantern, old letters, and the smell of campfire.`); return;
    case 'heights': say(`Marks on the doorframe. "Ash, age 4." "Ash, age 6." "Ash, age 8 (scorch mark)."`); return;
    case 'toybox': say(AREA.def.style==='ash'?(G.flags.pip?`Your old wooden dragon. Pip has chewed its tail off. Pip is very proud.`:`Your old wooden dragon, a wooden knight, and a lantern-shaped rattle.`):pick(EGGS.find(e=>e.k==='toybox').say)); return;
    case 'abacus': say(`One thousand beads, all counted. A note underneath: "Correct. Y."`); return;
    case 'perch': say(`Pebble the crow steals a button off your sleeve. Pebble is very pleased with this transaction.`); return;
    case 'mapwall': say(G.flags.juniper_found?`Juniper's maps. There's a new one of Whisperwood Hollow, with a big X labeled "where Ash saved me."`:`Juniper's maps of the whole valley. The insides of the caves are still blank.`); return;
    case 'yarn': say(`Yarn. So much yarn. Some of it is moving. Oh. It's the cat.`); return;
    case 'rocker': say(`Nana's rocking chair. It creaks a lullaby all by itself.`); return;
    case 'herbs': case 'planter': if(once2(o.id+'_'+Math.floor(G.worldTime/300))){ player.hp=Math.min(player.maxHp,player.hp+15); say(`Little purple flowers. They taste awful and they work. (+15 health)`); } else say(`Little purple flowers. You've had enough for now.`); return;
    case 'pail': say(`Milk. Moo-rgaret's finest.`); return;
    case 'hay': say(`Hay. You find a needle in it. Who does that?`); return;
    case 'bunk': say(AREA.def.style==='kid'?`Bunk beds. The top bunk has a sign: "JUNIPER'S. KEEP OUT. THIS MEANS ROOK."`:`Bunk beds. The top bunk says "PICK." The bottom says "NO, PICK."`); return;
    case 'cart': say(`A mine cart full of very ordinary rocks. Gorran says they're "character building."`); return;
    case 'drawer': if(o.clue&&stepOf('gate')&&stepOf('gate').flag==='clue_badge'){ runDialogue([['narr',`Under a pile of wicks: a little brass badge shaped like a dragon's scale. The badge of the Scaled Oath.`],['ash',`Oh, Fennick.`]],()=>{ scene='play'; giveItems({oath_badge:1}); G.flags.clue_badge=true; questPoke(); saveGame(); }); return; } say(o.clue?`Wicks. So many wicks.`:pick(o.egg?o.egg.say:EGGS[4].say)); return;
    case 'note': say(o.text); return;
    case 'painting': say(o.mayor!=null?[`Mayor Brindle the First. He looks exactly like the current mayor, but with a worse mustache.`,`Mayor Brindle the Second. He looks exactly like the current mayor, but with a better mustache.`,`Mayor Brindle the Third. It's just a mustache. No mayor.`,`Mayor Brindle the Fourth, the current mayor. He commissioned this one himself. It's very large.`][o.mayor]:o.caption||PAINTINGS[0]); return;
    case 'cat': case 'mirror': case 'rock': case 'goose': case 'clock': case 'lute':
      if(o.k==='cat'||o.k==='goose') emit(o.x,o.y-10,6,{col:'255,120,140',ang:-Math.PI/2,spread:0.8,smin:20,smax:60,lmin:.6,lmax:1,zmin:2,zmax:3,rise:20});
      if(o.k==='lute') SFX.play('level');
      say(pick((o.egg||EGGS.find(e=>e.k===o.k)).say)); return;
    case 'cell': say(`The Watch House cell. It's very clean. Someone has alphabetized it.`); return;
    case 'cchest':
      if(G.found[o.id]){ say(`Empty. You already took the good stuff.`); return; }
      if(o.sealed){ say(`The chest is sealed with a glowing rune. Somewhere in this cave, cold braziers are waiting for fire.`); return; }
      G.found[o.id]=true; SFX.play('chest'); { const lv=AREA.def.level, coins=20+10*lv; addCoins(coins,o.x,o.y); gainXp(40+20*lv); if(AREA.def.id==='whisper') giveItems({map_x1:1},true); if(AREA.def.id==='mirrow') G.pipTreats=(G.pipTreats||0)+(G.flags.pip?1:0); setBanner('Cave treasure',`+${coins} coins${AREA.def.id==='whisper'?' and a treasure map':''}`,2.4); if(player.potions<player.potionsMax) player.potions++; } saveGame(); return;
    case 'brazier': say(o.lit?`The brazier burns brightly.`:`A cold brazier. It wants fire. You have fire.`); return;
    case 'qitem':
      if(G.items[o.item]||G.found[o.id]){ return; }
      if(o.item==='lucky_lure'&&!G.quests.lure){ runDialogue([['narr',`A sunken rowboat with SOGGY BISCUIT painted on the side. There's a tackle box inside. You take it. Dell the fisherman will want this.`]],()=>{ scene='play'; G.found[o.id]=true; giveItems({lucky_lure:1}); saveGame(); }); return; }
      if(o.item==='oath_plans'){ runDialogue([['narr',`A table covered in maps of the five Wards, each one crossed out in red. On top: a thick scroll stamped with a scale. The Oath's plans.`]],()=>{ scene='play'; G.found[o.id]=true; giveItems({oath_plans:1}); G.flags.tunnel_plans=true; questPoke(); saveGame(); }); return; }
      G.found[o.id]=true; giveItems({[o.item]:1}); SFX.play('shrine'); saveGame(); return;
    case 'page': findPage(o.page); return;
    case 'cave_ore': if(G.found[o.id]) return; G.found[o.id]=true; G.iron++; SFX.play('chest'); setBanner('Star-iron','A big vein of it. Take it to Mom.',2.2); saveGame(); return;
    case 'stairs': case 'trig': case 'hchest': case 'nest': case 'recipebook': case 'musicbox': case 'ghost': case 'moosehead': case 'telescope2': case 'mousehole': case 'crate': case 'cobweb': case 'banner': case 'candles': case 'piedish': floorObjAct(o); return;
    case 'cgate': case 'lever': case 'mural': case 'resetstone': case 'csign': case 'plate': case 'block': case 'crystal': caveObjAct(o); return;
    case 'relic': if(G.found[o.id]) return; G.found[o.id]=true; runDialogue([['narr',`On a stone shelf, wrapped in cloth that hasn't rotted in a thousand years: a cloak stitched with five small flames. The Warden's Mantle.`],['narr',`You put it on. It's warm, and it fits, like it was waiting for you. (You take 15% less damage.)`]],()=>{ scene='play'; G.items.relic=1; player.stats.armor=(player.stats.armor||1)*0.85; saveGame(); }); return;
  }
}
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return h; }
const FURN_LABEL={bed:'Look at the bed',shelf:'Browse the shelf',fireplace:'Sit by the fireplace',oven:'Look at the oven',counter:'Look at the counter',desk:'Look at the desk',board:'Read the bounty board',rack:'Look at the rack',telescope:'Look through the telescope',chart:'Read the star chart',trophy:'Look at the trophy',bearrug:'Look at the rug',sled:'Look at the sled',cauldron:'Sniff the cauldron',hatstand:'Try on hats',portraits:'Look at the family portraits',gchest:'Open Grandma’s chest',heights:'Look at the doorframe',toybox:'Rummage in the toy box',abacus:'Count the beads',perch:'Say hi to Pebble',mapwall:'Look at Juniper’s maps',yarn:'Look at the yarn',rocker:'Look at the rocking chair',herbs:'Pick an herb',planter:'Pick an herb',pail:'Look in the pail',hay:'Search the hay',bunk:'Look at the bunks',cart:'Look in the cart',drawer:'Search the drawer',note:'Read the note',painting:'Look at the painting',cell:'Look at the cell',cchest:'Open the chest',brazier:'Look at the brazier',qitem:'Pick it up',page:'Pick up the old page',cave_ore:'Chip out the star-iron',relic:'Take the cloak',cat:'Pet the cat',mirror:'Look in the mirror',rock:'Look at the rock',goose:'Pet the goose',clock:'Check the clock',lute:'Play a tune'};
function updateInteractions(dt){
  const p=player; let best=null, bd=1e9;
  const offer=(d,text,act,x,y,always)=>{ if(d<bd){ bd=d; best={text,act,x,y,always}; } };
  if(AREA){
    for(const o of AREA.objs){
      const lab=o.prompt?o.prompt():FLOOR_LABEL[o.k]?FLOOR_LABEL[o.k](o):CAVE_LABEL[o.k]!==undefined?CAVE_LABEL[o.k]:o.k==='qitem'?(G.items[o.item]||G.found[o.id]?null:`Look at ${o.label}`):o.k==='bed'&&o.home?'Sleep in your bed (heal and save)':o.egg&&o.k!=='drawer'?o.egg.label:FURN_LABEL[o.k];
      if(!lab||o.broken) continue; if(o.k==='page'&&G.pages[o.page]) continue; if((o.k==='cave_ore'||o.k==='relic')&&G.found[o.id]) continue;
      const reach=(o.w?Math.max(o.w,o.h||0)/2:o.r||16)+34; const d=dist(p.x,p.y,o.x,o.y); if(d<reach) offer(d-reach,lab,()=>areaObjAct(o),o.x,o.y,o.k==='cchest');
    }
    for(const n of AREA.npcs){ const d=dist(p.x,p.y,n.x,n.y); if(d<(n.turtle?90:70)) offer(d-70,`Talk to ${n.name}`,()=>talkTo(n),n.x,n.y); }
    const e=AREA.exit; if(!e.none&&dist(p.x,p.y,e.x,e.y)<80) offer(10,'Leave',()=>exitArea(),e.x,e.y,true);
  }else{
    for(const s of SHRINES){
      const d=dist(p.x,p.y,s.x,s.y);
      if(!G.shrines[s.id]&&d<260){ G.shrines[s.id]=true; SFX.play('shrine'); setBanner('Shrine found',s.name,2.4); fogReveal(s.x,s.y,900); }
      if(d<64) offer(d,`Rest at ${s.name}`,()=>restAtShrine(s),s.x,s.y);
    }
    for(const c of CHESTS) if(!c.open){ const d=dist(p.x,p.y,c.x,c.y); if(d<48) offer(d,'Open the chest',()=>openChest(c),c.x,c.y,true); }
    for(const n of G.npcs){ const d=dist(p.x,p.y,n.x,n.y); if(d<70) offer(d,`Talk to ${n.name.replace(', your mom','')}`,()=>talkTo(n),n.x,n.y); }
    for(const o of ORES) if(!G.ores[o.id]){ const d=dist(p.x,p.y,o.x,o.y); if(d<60) offer(d,'Chip out the star-iron',()=>mineOre(o),o.x,o.y,true); }
    for(const l of LILIES) if(!l.taken){ const d=dist(p.x,p.y,l.x,l.y); if(d<46) offer(d,'Pick the moonlily',()=>pickLily(l),l.x,l.y,true); }
    for(const o of LANDMARKS){ if(!o.prompt||(o.hidden&&o.hidden())) continue; if(o.k==='kettle'&&G.items.kettle) continue; const d=dist(p.x,p.y,o.x,o.y); if(d<(o.r||20)+46) offer(d,o.prompt,()=>lmAct(o),o.x,o.y,o.k==='kettle'); }
    for(const dr of DOORS){ const d=dist(p.x,p.y,dr.x,dr.y); if(d<46) offer(d-6,dr.label,()=>enterArea(dr.area,dr),dr.x,dr.y); }
    miniPrompts(offer);
    if(G.goat&&G.side.duchess!=='home'&&G.side.duchess!=='follow'){ const d=dist(p.x,p.y,G.goat.x,G.goat.y); if(d<70) offer(d,'Talk to the goat',talkGoat,G.goat.x,G.goat.y); }
  }
  G.prompt=best&&(!G.inCombat||best.always)?best:null;
  if(G.fishing) G.prompt=null;
  if(p.hp<p.maxHp&&!AREA){
    const cx=Math.floor(p.x/CH), cy=Math.floor(p.y/CH), props=PROPS.get(ckey(cx,cy));
    if(props) for(const pr of props) if(pr.k==='herb'&&!pr.taken&&dist2(pr.x,pr.y,p.x,p.y)<22*22){ pr.taken=true; heal(18*G.diff.heal); SFX.play('pickup'); emit(pr.x,pr.y,10,{col:'200,170,255',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); setBanner('Healing herb','+HP',1.1); }
  }
}
function talkGoat(){ runDialogue(STORY.duchess,()=>{ scene='play'; G.side.duchess='follow'; G.flags.duchess_follow=true; if(!G.quests.duchess) startQuest('duchess'); questPoke(); setBanner('Duchess is following you','Bring her home to Hollis Farm.',2.6); saveGame(); }); }
// ---------- allies in the final battle
function updateAllies(dt){
  const b=G.boss; if(!b||b.dead||b.type!=='vorlaxis') { G.allies=null; return; }
  if(!G.allies) G.allies=[];
  if(G.choices.greymane==='ally'&&!G.allies.some(a=>a.k==='grey')&&b.hp<b.maxHp*0.72){ G.allies.push({k:'grey',x:b.x-600,y:b.y+380,t:0,cd:0.5,face:0,dx:0,dy:0,snowy:true}); taunt('narr','A howl splits the air. Greymane has come!'); SFX.play('howl'); }
  if(G.choices.cinder==='ally'&&!G.allies.some(a=>a.k==='cinder')&&b.hp<b.maxHp*0.9){ G.allies.push({k:'cinder',x:POI.summit.x,y:POI.summit.y+430,t:0,cd:2,face:-Math.PI/2,dx:0,dy:0}); taunt('cinder','I hold the stairs, Emberblood! Fight!'); }
  for(const a of G.allies){
    a.t+=dt; a.cd-=dt;
    if(a.k==='grey'){
      const d=dist(a.x,a.y,b.x,b.y);
      if(a.cd<=0&&d<110&&b.alpha>0.5&&!b.invuln){ a.cd=7; damageEnemy(b,b.maxHp*0.035,{src:'roar'}); shake(6); SFX.play('slash3'); emit(b.x,b.y,16,{col:'230,240,250',smin:60,smax:200,lmin:.3,lmax:.6,zmin:2,zmax:4}); a.tx=b.x+rand(-380,380); a.ty=b.y+rand(-300,300); }
      const tx=a.cd>4&&a.tx!=null?a.tx:b.x, ty=a.cd>4&&a.ty!=null?a.ty:b.y, sp=a.cd>4?260:380, ang=angTo(a.x,a.y,tx,ty);
      if(dist(a.x,a.y,tx,ty)>20){ a.face=turnTo(a.face,ang,8*dt); a.dx=Math.cos(a.face)*sp; a.dy=Math.sin(a.face)*sp; a.x+=a.dx*dt; a.y+=a.dy*dt; } else { a.dx=a.dy=0; }
    }else{
      a.face=-Math.PI/2;
      if(a.cd<=0){ a.cd=3.2; const dr=G.enemies.find(e=>!e.dead&&e.type==='drakeling'); if(dr){ killEnemy(dr); emit(dr.x,dr.y,10,{col:'255,200,140',smin:60,smax:180,lmin:.2,lmax:.4,zmin:2,zmax:4}); if(Math.random()<0.3) taunt('cinder',pick(['None shall pass!','Not while I stand!','Ha! Too slow, lizard!'])); } }
    }
  }
}
