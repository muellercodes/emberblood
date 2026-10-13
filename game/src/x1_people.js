
// ================= Act II, the Clockwork Coast: the people and the side quests (x1_people.js)
// The 21 named people of Gearhaven, Saltmarsh and the small places (looks, homes, talk, barks, chats, greetings,
// shops), the ten Act II side quests (c_oona, c_notes, c_gifts, c_whip, c_bolt, c_tail, c_logbook, c_regatta,
// c_chalk, c_bob) with their minigames (c_dogchase, c_regatta, c_chalkwalk) and the Saltbeard fight, Vesper's trust,
// Pebble's letters c_pb_1..7, Tamsin's Act II verse, Duchess on the Great Clock and the EPI.c epilogue lines.
// Design: scratchpad/bible/ACT2.md sections 2, 3.6, 7, 8 and 10. Doc for other helpers: scratchpad/C1PEOPLE.md.
// Everything is wrapped from here (no engine edits). Names in this file start with x1p / X1P (one shared scope).

// ---------- small helpers
const x1pL=(who,full,simple)=>[who,S(full,simple)];
const x1pN=(full,simple)=>['narr',S(full,simple)];
const x1pDo=fn=>({who:'narr',text:'',fn,skipIf:()=>true});
const x1pQ=id=>!!(G&&G.quests&&G.quests[id]&&G.quests[id].done);
const x1pAt=(id,n)=>{ const q=G&&G.quests&&G.quests[id]; return !!q&&!q.done&&q.step===n; };
const x1pOn=id=>{ const q=G&&G.quests&&G.quests[id]; return !!q&&!q.done; };
const x1pR=st=>stageAt(st)>=0&&reached(st);   // reached() on an unknown id is always true: never trust it
const X1P={err:0,carry:null,stove:null,gust:null,bolt:null,bob:null,trustSeen:null,snow:null,base:{},pebT:0,ready:false};
const X1P_COAST=['c_gearhaven','c_saltmarsh','c_gullsrest','c_lanternpt','c_fold'];
const X1P_CT=X1P_COAST.map(t=>'town:'+t).join('|');
const X1P_NOTCOAST=X1P_COAST.map(t=>'!town:'+t).join('|');
function x1pCoastId(id){ const c=CASTBY[id]; return !!c&&X1P_COAST.includes(c.town); }
function x1pSay(lines,cb){ runDialogue(lines,()=>{ scene='play'; if(cb) cb(); saveGame(); }); }
function x1pHeart(id){ if(typeof gainHeartEmber==='function') return gainHeartEmber(id); if(G.found['he_'+id]) return false; G.found['he_'+id]=true; player.maxHp+=10; player.hp=player.maxHp; setBanner(S('Heart Ember!','Heart Ember!'),S('Your heart burns brighter. +10 health.','+10 health!'),2.6); return true; }
function x1pLvl(o){ return typeof elevLvl==='function'?elevLvl(o.x,o.y):0; }
function x1pHere(){ return typeof elevOf==='function'?elevOf(player):0; }
// a spot up high: on the real elevation (x1_world) Ash must stand at its level; where the map has none, the power is enough
function x1pHigh(o,abil){ const l=x1pLvl(o); if(l>0&&l>x1pGround(o)) return x1pHere()>=l; return hasAbil(abil); }
function x1pGround(o){ if(typeof elevLvl!=='function') return 0; let m=99; for(const [dx,dy] of [[160,0],[-160,0],[0,160],[0,-160]]) m=Math.min(m,elevLvl(o.x+dx,o.y+dy)); return m===99?0:m; }
function x1pWaitDark(cb){ G.fade=1; G.tod=0.875; flashA=0.5; flashCol='10,10,30'; later(0.5,()=>{ setBanner(S('Night falls','Night'),S('The lamps come on. The moths come out.','It is dark now.'),2.4); if(cb) cb(); saveGame(); }); }
function x1pFoe(type,alt,x,y,o){ const t=EDEF[type]?type:alt; const e=makeEnemy(t,x,y,Object.assign({level:Math.max(9,(regionAt(x,y)||{}).level||10),aggro:true,homeX:x,homeY:y,leash:900},o||{})); e.spawnIn=0.3; return e; }

// ---------- speakers who are not people
Object.assign(SPK,{
  c_squawk:SPK.c_squawk||{name:'Captain Squawk',col:'#6ad06a'},
  c_bolt:SPK.c_bolt||{name:'Bolt',col:'#e8c060'},
  c_saltbeard:SPK.c_saltbeard||{name:'Captain Saltbeard',col:'#9ad8f0'},
  c_bob3:SPK.c_bob3||{name:'The Third Bob',col:'#7aa0e8'}
});
// a parrot in a tiny captain's hat, a brass dog, a ghost pirate
function x1pFaceParrot(g){
  g.fillStyle='#2e9a3a'; g.beginPath(); g.ellipse(0,10,44,52,0,0,TAU); g.fill();
  g.fillStyle='#3cc04a'; g.beginPath(); g.ellipse(-6,-6,36,40,0,0,TAU); g.fill();
  g.fillStyle='#e8402a'; g.beginPath(); g.ellipse(-14,-30,22,18,0,0,TAU); g.fill();
  g.fillStyle='#f6f0e0'; g.beginPath(); g.ellipse(14,-14,16,14,0,0,TAU); g.fill();
  g.fillStyle='#1a1410'; g.beginPath(); g.arc(16,-14,6,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(18,-16,2,0,TAU); g.fill();
  g.fillStyle='#f0c040'; g.beginPath(); g.moveTo(24,-6); g.quadraticCurveTo(54,-2,40,24); g.quadraticCurveTo(34,8,22,10); g.closePath(); g.fill(); g.strokeStyle='#5a3a10'; g.lineWidth=2.5; g.stroke();
  g.fillStyle='#1a2644'; g.beginPath(); g.moveTo(-34,-44); g.lineTo(30,-44); g.lineTo(18,-64); g.lineTo(-22,-64); g.closePath(); g.fill(); g.fillStyle='#e0b84a'; g.fillRect(-28,-48,52,5); g.beginPath(); g.arc(-2,-56,4,0,TAU); g.fill();
}
function x1pFaceBolt(g){
  g.fillStyle='#8a6a2a'; g.beginPath(); g.ellipse(-36,-30,12,24,-0.5,0,TAU); g.fill();
  g.fillStyle='#b88a3a'; g.beginPath(); g.ellipse(34,-34,12,20,0.6,0,TAU); g.fill();
  const gr=g.createRadialGradient(-14,-20,6,0,0,62); gr.addColorStop(0,'#fff0b0'); gr.addColorStop(0.5,'#e0b050'); gr.addColorStop(1,'#8a6020'); g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,48,44,0,0,TAU); g.fill();
  g.strokeStyle='#5a3a10'; g.lineWidth=3; g.stroke();
  for(const [x,y] of [[-30,-10],[30,-10],[-22,26],[22,26],[0,-36]]){ g.fillStyle='#6a4a1a'; g.beginPath(); g.arc(x,y,3,0,TAU); g.fill(); }
  for(const s of [-1,1]){ g.save(); g.shadowColor='#ffe066'; g.shadowBlur=14; g.fillStyle='#fff6c0'; g.beginPath(); g.arc(s*16,-6,9,0,TAU); g.fill(); g.restore(); g.fillStyle='#2a1a08'; g.beginPath(); g.arc(s*16,-6,3.5,0,TAU); g.fill(); }
  g.fillStyle='#d8a848'; g.beginPath(); g.ellipse(0,20,22,16,0,0,TAU); g.fill(); g.strokeStyle='#5a3a10'; g.lineWidth=2.5; g.stroke();
  g.fillStyle='#2a1a08'; g.beginPath(); g.ellipse(0,12,7,5,0,0,TAU); g.fill();
  g.strokeStyle='#5a3a10'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-8,26); g.quadraticCurveTo(0,32,8,26); g.stroke();
}
function x1pFaceGhost(g){
  g.save(); g.globalAlpha=0.9;
  const gr=g.createRadialGradient(0,-10,8,0,0,70); gr.addColorStop(0,'#e8f8ff'); gr.addColorStop(1,'#7ab8d8'); g.fillStyle=gr; g.beginPath(); g.ellipse(0,-6,40,44,0,0,TAU); g.fill();
  g.fillStyle='#f4fbff'; g.beginPath(); for(let i=0;i<=12;i++){ const a=Math.PI*0.05+i/12*Math.PI*0.9, r=i%2?46:58; g.lineTo(Math.cos(a)*r*0.9,14+Math.sin(a)*r); } g.closePath(); g.fill();
  g.fillStyle='#1a2a3a'; g.beginPath(); g.moveTo(-50,-38); g.lineTo(50,-38); g.lineTo(30,-62); g.lineTo(0,-50); g.lineTo(-30,-62); g.closePath(); g.fill();
  for(const s of [-1,1]){ g.fillStyle='#1a3a5a'; g.beginPath(); g.ellipse(s*15,-12,7,8,0,0,TAU); g.fill(); g.fillStyle='#bff6ff'; g.beginPath(); g.arc(s*15,-13,2.5,0,TAU); g.fill(); }
  g.restore();
}
if(typeof EVPORT!=='undefined'){
  if(!EVPORT.c_squawk) EVPORT.c_squawk={bg:'#1c3424',f:x1pFaceParrot};
  if(!EVPORT.c_bolt) EVPORT.c_bolt={bg:'#3a2a12',f:x1pFaceBolt};
  if(!EVPORT.c_saltbeard) EVPORT.c_saltbeard={bg:'#14243a',f:x1pFaceGhost};
}

// ---------- items (ACT2 10.1)
Object.assign(ITEM_NAMES,{
  c_diary:'Vesper’s dream diary',c_letters:'Gran’s letters',c_lampoil:'Fennick’s Brightest Lamp Oil',c_lumpybun:'Tikka’s lumpy bun',
  c_biscuit:'Granny Oona’s very old biscuit',c_musicbox:'A golden music box',c_seapepper:'Sea pepper',c_chowder:'Ghost Pepper Chowder',
  c_chain:'Saltbeard’s anchor chain',c_sock:'A very old sock',c_spring:'Spring core',c_mainspring:'The weathervane mainspring',
  c_page1:'Pearl’s Logbook, page 1',c_page2:'Pearl’s Logbook, page 2',c_page3:'Pearl’s Logbook, page 3',c_page4:'Pearl’s Logbook, page 4',
  c_page5:'Pearl’s Logbook, page 5',c_page6:'Pearl’s Logbook, page 6',c_pearl_letter:'Pearl’s letter',c_map:'Ravel’s treasure map',
  c_scarf:'The Saltwhistle Scarf',c_newscap:'Penny’s Press Pass',c_badge:'A Clockwatch badge',c_shard1:ITEM_NAMES.c_shard1||'The Dusk Shard'
});
// cosmetic hats (worn like the Sky Feather; the hat name is the key)
const X1P_HATS={c_scarf:'Saltwhistle Scarf',c_newscap:'Press Pass',c_badge:'Clockwatch Badge'};
function x1pHat(item){ const h=X1P_HATS[item]; if(!h) return; G.hats=G.hats||{}; G.hats[h]=true; G.hat=h; }
{ const base=drawHatShape; drawHatShape=function(x,y,k,s){
  if(k==='Saltwhistle Scarf'||k==='Press Pass'||k==='Clockwatch Badge'){ s=s||1; ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
    if(k==='Saltwhistle Scarf'){ ctx.fillStyle='#6a8aa0'; ctx.beginPath(); ctx.arc(0,0,8,0,TAU); ctx.fill(); ctx.fillStyle='#a06a4a'; for(let i=0;i<4;i++){ ctx.fillRect(-7+i*4,-2,2,4); } }
    else if(k==='Press Pass'){ ctx.fillStyle='#8a6a4a'; ctx.beginPath(); ctx.arc(0,0,8.5,0,TAU); ctx.fill(); ctx.fillStyle='#6a4a30'; ctx.beginPath(); ctx.arc(3,0,5,0,TAU); ctx.fill(); ctx.fillStyle='#f0e8d0'; ctx.fillRect(-5,-3,4,6); }
    else { ctx.fillStyle='#1a2644'; ctx.beginPath(); ctx.arc(0,0,7.5,0,TAU); ctx.fill(); ctx.fillStyle='#e0b84a'; ctx.beginPath(); ctx.arc(0,0,3,0,TAU); ctx.fill(); ctx.fillStyle='#3a6ac8'; ctx.fillRect(-1,-9,2,6); }
    ctx.restore(); return; }
  return base(x,y,k,s); }; }
{ const base=ashHat; ashHat=function(k){
  const z0=6.2;
  if(k==='Saltwhistle Scarf'){ aE(0,0,z0-0.9,7.8,8.2,5.0,'#6a8aa0'); aE(0,0,z0-3.0,8.1,8.5,1.4,'#a06a4a'); aL(-5.6,4.4,z0-3.4,-9.4,7.2,z0-8.6,1.4,'#6a8aa0',1.0); aL(-5.8,3.2,z0-3.4,-10.6,4.4,z0-8.8,1.3,'#a06a4a',0.8); return; }
  if(k==='Press Pass'){ aE(0.3,0,z0-0.6,7.8,8.2,4.4,'#8a6a4a'); aE(6.2,0,z0-1.9,4.4,6.0,0.7,'#6a4a30',{pitch:0.1}); aB(0,0,z0+3.6,1.1,'#6a4a30'); aD(2.8,-5.6,z0+0.6,1.3,'#f0e8d0',0.05); return; }
  if(k==='Clockwatch Badge'){ aE(0.3,0,z0-0.9,7.4,7.8,4.4,'#1a2644'); aE(6.6,0,z0-1.8,4.0,5.4,0.7,'#1a2644',{pitch:0.12}); aD(5.4,0,z0+0.8,1.5,'#e0b84a',0.06); aL(-1,0,z0+3,-3,0,z0+9,1.1,'#3a6ac8',0.6); return; }
  return base(k); }; }

// ---------- the Act II stage ids (ACTS.md): registered here only if the story module does not ship them, so `min`
// gates never meet an unknown stage (reached('typo') is always true). Runs at world build, after every module loaded.
const X1P_STAGES=['c_coast','c_gear','c_salt','c_claws','c_brass','c_light','c_spire','c_snow'];
function x1pStagesFallback(){
  const miss=X1P_STAGES.filter(s=>stageAt(s)<0); if(!miss.length) return;
  const CH={c_gear:'The City of Clocks',c_salt:'The Girl from Saltmarsh',c_claws:'The Girl from Saltmarsh',c_brass:'The Brassworks',c_light:'The Spinning Lighthouse',c_spire:'The Shadow Spire',c_snow:'Snow in Summer'};
  if(typeof defineStages==='function') defineStages(2,miss.map(id=>({id,chapter:CH[id]||'The Clockwork Coast'})));
  else for(const s of miss) STAGES.push(s);
}

// ---------- the 21 people (ACT2 2.4). Home order inside each town is a save key (assignHomesNew): append only.
// Gearhaven: hester, hettie, ottoline, whirligig, mo, ingrid, fig, ambrose. Saltmarsh: mina, charlie, dory, oona, tarbuckle.
const X1P_CAST=[
  {id:'c_hester',name:'Captain Hester Ticklebrass',town:'c_gearhaven',home:true,house:'The Clockwatch Hall',job:'guard',col:'#7a9ae0',ix:0.5,iy:0.35,
    look:{skin:'#e8b894',hair:'#b8b0a8',hairdo:'bun',outfit:'coat',shirt:'#24345e',low:'#1a2644',trim:'#e0b84a',hat:'cap',hatc:'#1a2644',hatband:'#e0b84a',build:'tall',glasses:true,neck:'#e0b84a',hold:'behind'},
    lines:[S(`The Clockwatch has thirty-one watchmen. Two of them are Bob.`,`I have thirty-one guards. Two are Bob.`),
      S(`Without the Great Clock, nobody in this city knows when lunch is. I had lunch at nine in the morning. NINE.`,`No clock means no lunch time. I ate lunch at nine!`),
      S(`Captain Osric of Brindlecross writes to me. He has two old dogs. I have two Bobs. We compare.`,`Captain Osric writes to me. He has dogs. I have Bobs.`)]},
  {id:'c_hettie',name:'Professor Hettie Sprocket',town:'c_gearhaven',home:true,house:'Sprocket’s Workshop',job:'scholar',col:'#f0a040',
    look:{skin:'#f2c8a6',hair:'#e8762a',hairdo:'wild',outfit:'overalls',shirt:'#e8d8b8',low:'#4a5a6a',trim:'#e0a040',goggles:true,oil:true,soot:true,freckles:true,build:'short',hold:'mallet',bag:'#8a5a32'},
    lines:[S(`Don't touch that. Or that. That one you can touch. No, not like that.`,`Don't touch that. Or that. Okay, that one.`),
      S(`I invented a self-buttering toaster. It buttered the cat. We don't talk about it.`,`My toaster buttered the cat. Oops.`),
      S(`Every gear in Gearhaven says Gearhaven on it. Finding one is like finding a sock with SOCK written on it.`,`Every gear here says Gearhaven. Like a sock that says SOCK.`)]},
  {id:'c_ottoline',name:'Archivist Ottoline Inkwell',town:'c_gearhaven',home:true,house:'The Turning Library',job:'library',style:'library',col:'#c8a0e0',ix:0.5,iy:0.4,
    look:{skin:'#c8946c',hair:'#d8d4cc',hairdo:'bun',pin:true,outfit:'robe',shirt:'#5a3a7a',low:'#3a2450',trim:'#c8a0e0',glasses:true,build:'short',hold:'book',bookc:'#6a2a3a',shawl:'#c8a0e0'},
    lines:[S(`Welcome to the Turning Library. Please don't run. The shelves run for you.`,`Please don't run. The shelves run for you.`),
      S(`SHHH. Sorry. I shushed myself. It happens.`,`SHHH. Oops. I shushed me.`),
      S(`Mother Pearl founded this city with a clock and a stubborn streak. We still have both.`,`Pearl built this city with a clock. And a stubborn heart.`)]},
  {id:'c_whirligig',name:'Lord Percival Whirligig',town:'c_gearhaven',home:true,house:'Whirligig Manor',job:'mayor',col:'#e0c060',
    look:{skin:'#f0c4a2',hair:'#4a3a2a',hat:'top',hatc:'#1a1a1a',hatband:'#e0c060',stache:'big',beardc:'#5a4a3a',outfit:'coat',shirt:'#5a2a4a',low:'#3a1a30',trim:'#e0c060',sash:'#e0c060',necklace:'#e0c060',glasses:true,build:'wide',hold:'cane'},
    lines:[S(`Do you know who I AM? I'm on four coins. FOUR.`,`Do you know who I am? I am on four coins!`),
      S(`The Moth Mask has robbed me nine times. NINE! I've started leaving out snacks so she'll at least be polite.`,`The Moth Mask robbed me nine times! Now I leave snacks.`),
      S(`I'm never late. I'm early to everything. I was early to my own birth.`,`I am never late. I was early to my own birth.`)]},
  {id:'c_mo',name:'Harbormaster Mo Barnacle',town:'c_gearhaven',home:true,house:'The Harbor Office',job:'fisher',col:'#e8c03a',
    look:{skin:'#d8a07c',hair:'#c8582a',beard:'big',beardc:'#c8582a',hat:'rain',hatc:'#e8c03a',outfit:'coat',shirt:'#24345e',low:'#1a2a40',trim:'#e8c03a',scarf:'#c83a2a',pipe:true,build:'big',hold:'rod'},
    lines:[S(`AHOY! Welcome to the finest harbor on the coast! Nothing's sailing, mind. Not since the lighthouse went dark.`,`AHOY! Best harbor on the coast! No ships sail, though.`),
      S(`Gave up smoking. Took up bubbling. Much nicer for the gulls.`,`I don't smoke. I blow bubbles. The gulls like it.`),
      S(`Out past the Far Pier there's only sea, and past the sea, they say, the moon falls into the water. Sailors' stories. Probably.`,`Far out at sea, the moon falls in the water. Or so sailors say.`)]},
  {id:'c_ingrid',name:'Ingrid Anvilsong',town:'c_gearhaven',home:true,house:'The Bright Anvil',job:'miner',col:'#f0d060',ix:0.5,iy:0.45,
    look:{skin:'#f0d0b8',hair:'#f0d060',hairdo:'braids',outfit:'tunic',shirt:'#8a3a2a',low:'#4a3a2a',apron:'#5a4030',trim:'#e0a040',soot:true,build:'strong',hold:'hammer',belt:'#3a2a1a'},
    lines:[S(`Hammer, hammer, ding! Hammer, hammer, dong! This is my song. It is not a long song.`,`Hammer, hammer, ding! Hammer, hammer, dong! Short song.`),
      S(`Bring me star-iron and I will make your blade sing. Not literally. Once, literally. It sang flat.`,`Bring me star-iron. Your blade will sing! Well, almost.`),
      S(`Your mother wrote me a letter. It said "do not let my child near the big hammer." I said ja. Here is the big hammer.`,`Your mom said no big hammers. Ja. Here is a big hammer.`)]},
  {id:'c_fig',name:'Auntie Fig',town:'c_gearhaven',home:true,house:'The Steaming Teapot',job:'inn',col:'#e090b0',ix:0.5,iy:0.42,
    look:{skin:'#b07a56',hair:'#efeae0',hairdo:'curly',outfit:'dress',shirt:'#c86a8a',low:'#8a3a5a',pattern:'dots',patc:'#f0d0dc',apron:true,shawl:'#e0b0c0',build:'wide',blush:true,hold2:'kettle'},
    lines:[S(`Sit down, dearie, you look like you've been chasing something.`,`Sit down, dearie. You look tired.`),
      S(`Everyone in this town pretends to hate the Moth Mask. Then they leave their windows open. Funny, that.`,`People say they hate the Moth Mask. Then they leave windows open.`),
      S(`Tea fixes most things. The rest it makes warmer.`,`Tea fixes most things.`)]},
  {id:'c_ambrose',name:'Clockkeeper Ambrose Tickett',town:'c_gearhaven',home:true,house:'The Clock Keeper’s Workshop',job:'scholar',col:'#c8a040',ix:0.5,iy:0.45,
    look:{skin:'#e8bc98',hair:'#efeae0',beard:'big',beardc:'#efeae0',outfit:'robe',shirt:'#6a4a2a',low:'#4a3420',trim:'#c8a040',glasses:true,build:'old',hold:'lamp',hat:'cap',hatc:'#4a3420',beardgears:true},
    lines:[S(`Eh? The clock? Yes, it's stopped. Tick.`,`Eh? The clock stopped. Tick.`),
      S(`Ninety years I've wound her. Never stopped once. Not for storms, not for weddings, not for the year of the giant pigeon. Tick.`,`I wound her for ninety years. She never stopped. Tick.`),
      S(`Something flew over the night she stopped. Big. Soft. Wings like old curtains. Dust everywhere. Tick.`,`Something big flew over. Wings like curtains. Tick.`)]},
  {id:'c_penny',name:'Penny Press',town:'c_gearhaven',kid:true,col:'#e88a5a',
    look:{skin:'#9a6444',hair:'#2a1a10',hairdo:'short',hat:'cap',hatc:'#8a6a4a',outfit:'coat',shirt:'#e8e0c8',low:'#5a4a3a',trim:'#c8643a',freckles:true,bag:'#c8b890',hold:'scrolls'},
    lines:[S(`Every good story has a mystery, a chase, and a really good quote. Say something quotable.`,`Every story needs a mystery and a chase. Say something good!`),
      S(`The Moth Mask Watch board says what I say. The board is me. I am the board.`,`I write the Moth Mask board. I am the board!`),
      S(`One day I'll have a printing press. Right now I have a very loud voice.`,`One day I will have a press. Now I just shout.`)]},
  {id:'c_ravel',name:'Madame Ravel',town:'c_gearhaven',col:'#3ab0b0',
    look:{skin:'#a87050',hair:'#1a1a1a',hairdo:'pony',hat:'feather',hatc:'#2a7a7a',outfit:'coat',shirt:'#2a7a7a',low:'#1a4a4a',trim:'#e0c060',earrings:true,scarf:'#e0c060',scarfLen:1.4,build:'tall'},
    lines:[S(`This draught? Brewed by a mermaid. Well. By a man named Merv. Close enough.`,`A mermaid made this draught. Well, a man named Merv.`),
      S(`This map shows where treasure is buried. Or where a dog sneezed. Either way, exciting.`,`This map shows treasure. Or where a dog sneezed.`),
      S(`Everything is for sale except the hat. The hat is for staring at.`,`Everything is for sale. Not the hat.`)]},
  {id:'c_jo',name:'Skipper Jo',town:'c_gearhaven',kid:true,col:'#e85a4a',
    look:{skin:'#c8946c',hair:'#6a3a1a',hairdo:'short',hat:'kerchief',hatc:'#c83a2a',outfit:'tunic',shirt:'#e8e8f0',low:'#24345e',pattern:'stripes',patc:'#24345e',belt:'#8a6a3a',freckles:true,build:'teen'},
    lines:[S(`My skiff's called the Sea Biscuit. Not to be confused with the Soggy Biscuit. Totally different biscuit.`,`My boat is the Sea Biscuit. Not the Soggy Biscuit!`),
      S(`When the lighthouse is dark, no boats go out at night. Not even me. Okay, once me. I hit a seal. He was fine. I was not.`,`No boats at night now. Once I hit a seal. He was fine.`),
      S(`Port is left. Starboard is right. Down is wet.`,`Port is left. Starboard is right. Down is wet.`)]},
  {id:'c_bobs',name:'Bob and Bob',town:'c_gearhaven',col:'#a8b8e8',
    look:{skin:'#c8ccd8',hair:'#8a8e98',helm:true,plume:'#3a6ac8',outfit:'armor',shirt:'#a8acb8',low:'#7a7e8a',trim:'#e0b84a',hold:'spear',twin:true,build:'tall',tin:true},
    lines:[S(`I'm Bob. He's also Bob. We are both Bob.`,`I am Bob. He is Bob too.`),
      S(`Tick. Tock. That's not the clock. That's us. The clock's broken.`,`Tick. Tock. That is us, not the clock.`),
      S(`There used to be three of us. We don't talk about Bob.`,`There were three of us. We don't talk about Bob.`)]},
  {id:'c_mina',name:'Tide Warden Mina Mudge',town:'c_saltmarsh',home:true,house:'The Tide Warden\'s Cottage',job:'scholar',col:'#e8c03a',
    look:{skin:'#e8bc98',hair:'#8a5a2a',hairdo:'braids',hat:'rain',hatc:'#e8c03a',outfit:'coat',shirt:'#e8c03a',low:'#3a4a5a',trim:'#3a4a5a',build:'slim',hold:'staff',freckles:true},
    lines:[S(`The Tide Clock doesn't make the tide, exactly. It reminds it. The sea is very forgetful.`,`The Tide Clock reminds the sea. The sea forgets things.`),
      S(`When it's low tide you can walk all the way to Gullcrag. Nobody does. Gulls. So many gulls.`,`At low tide you can walk to Gullcrag. So many gulls!`),
      S(`Forty-one waves since you started talking. Sorry. Habit.`,`Forty-one waves since you spoke. Sorry. Habit.`)]},
  {id:'c_charlie',name:'Chowder Charlie',town:'c_saltmarsh',home:true,house:'The Chowder Pot',job:'cook',col:'#e8b070',ix:0.5,iy:0.42,
    look:{skin:'#94603e',hair:'#2a1a10',hat:'chef',outfit:'tunic',shirt:'#efe6d6',low:'#5a4a3a',apron:'#d8c8a8',stache:true,build:'wide',hold:'ladle',soot:true},
    lines:[S(`Chowder! It's soup that's been hugged.`,`Chowder is soup that got a hug.`),
      S(`A cook up in your valley puts ROCKS in soup? Rocks? Ridiculous. Shells, now. Shells are flavor.`,`A cook up north puts ROCKS in soup? Silly! Shells are better.`),
      S(`Eat. You're all horns and no lunch.`,`Eat! You are all horns and no lunch.`)]},
  {id:'c_dory',name:'Dory Cockle',town:'c_saltmarsh',home:true,house:'Cockle Cottage',job:'fisher',col:'#3a9a9a',
    look:{skin:'#b98058',hair:'#3a2a1a',hat:'kerchief',hatc:'#2a7a7a',outfit:'vest',shirt:'#c8b890',low:'#4a5a4a',apron:'#7a6a4a',build:'strong',hold2:'basket',basketc:'nets'},
    lines:[S(`Mind the nets. Mind the hooks. Mind the gulls. Mind everything, really.`,`Mind the nets. And the hooks. And the gulls.`),
      S(`The Moth Mask leaves things on doorsteps. Roof tiles. Medicine. Once a whole goose. Don't ask me what we did with the goose.`,`The Moth Mask leaves gifts. Once a whole goose!`),
      S(`Granny Oona's been cold for seventy years. Someone ought to do something.`,`Granny Oona is always cold. Someone should help.`)]},
  {id:'c_oona',name:'Granny Oona Saltwhistle',town:'c_saltmarsh',home:true,house:'Oona’s Stilt House',job:'knitter',col:'#a0b8d0',ix:0.6,iy:0.55,
    look:{skin:'#d8aa84',hair:'#efeae0',hairdo:'braids',hood:'#6a8aa0',shawl:'#a06a4a',blanket:'#7a8aa0',outfit:'dress',shirt:'#4a5a6a',low:'#3a4a5a',build:'old',frost:true,mittens:'#c86a4a',hold:'yarn',yarnc:'#e0d0a0',horns:'tiny'},
    lines:[S(`I've been cold since I was a girl. Our family always is. We're Emberbloods, you know. Just without the fire.`,`I am always cold. We are Emberbloods with no fire.`),
      S(`My Vesper brings me fish every morning. Leaves it on the step and runs. She thinks I don't know it's her. I know it's her.`,`My Vesper leaves fish on my step. I know it's her.`),
      S(`Mother Pearl climbed every cliff on this coast. I can't climb my own stairs. Funny old world.`,`Pearl climbed every cliff. I can't climb my stairs!`)]},
  {id:'c_tarbuckle',name:'Old Tarbuckle',town:'c_saltmarsh',home:true,house:'Old Tarbuckle’s Hut',job:'home',col:'#c8b090',
    look:{skin:'#c08860',hair:'#efeae0',beard:'big',beardc:'#efeae0',eyepatch:true,hat:'cap',hatc:'#1a2a40',outfit:'coat',shirt:'#24345e',low:'#1a2a40',trim:'#e0b84a',pipe:true,build:'old',hold:'cane'},
    lines:[S(`In my day the sea was twice as wet. You could drown in a puddle.`,`In my day the sea was twice as wet!`),
      S(`At low tide, on dark nights, you can hear a chain on the Rockpools. Clank. Clank. He's waiting for something. Hungry, I'd say.`,`At night, a chain clanks on the rocks. Clank. Clank.`),
      S(`You remind me of Pearl's statue in the old cave. Same horns. Better posture.`,`You look like Pearl's statue. Same horns!`)]},
  {id:'c_posy',name:'Little Posy Cockle',town:'c_saltmarsh',kid:true,col:'#6aa0d8',
    look:{skin:'#b98058',hair:'#c8823a',hairdo:'pigtails',outfit:'dress',shirt:'#6aa0d8',low:'#3a6aa0',freckles:true,blush:true,hold:'clasp'},
    lines:[S(`A moth lady left my music box on our step. Moths are nice. Except the big ones. The big ones are rude.`,`A moth lady gave me my music box. Big moths are rude.`),
      S(`When I grow up I'm going to be a dragon. Or a crab. I haven't decided.`,`I will be a dragon when I grow up. Or a crab.`),
      S(`Don't tell anyone, but I can't sleep without my music box.`,`Shh. I can't sleep without my music box.`)]},
  {id:'c_maudie',name:'Maudie Gale',town:'c_gullsrest',home:true,house:'The Gull’s Rest',job:'inn',col:'#e86a5a',
    look:{skin:'#f0c8a6',hair:'#e8c060',hairdo:'wild',outfit:'dress',shirt:'#2a7a5a',low:'#1a4a3a',apron:true,scarf:'#e86a5a',scarfLen:1.6,shawl:'#e0b0c0',build:'slim',hold2:'tray',windswept:true},
    lines:[S(`THE GULLS HERE ARE THIEVES! HOLD ON TO YOUR CHIPS!`,`THE GULLS STEAL! HOLD YOUR CHIPS!`),
      S(`THE TELESCOPE'S FREE! THE TEA ISN'T!`,`THE TELESCOPE IS FREE! TEA IS NOT!`),
      S(`SOMEONE KEEPS CLIMBING MY CHIMNEY AT NIGHT! I THINK IT'S A VERY LARGE MOTH!`,`SOMEONE CLIMBS MY CHIMNEY AT NIGHT! A BIG MOTH?`)]},
  {id:'c_agatha',name:'Keeper Agatha Brightwater',town:'c_lanternpt',home:true,house:'The Keeper’s Cottage',job:'home',col:'#e8c03a',
    look:{skin:'#e6b494',hair:'#efeae0',hairdo:'bun',outfit:'coat',shirt:'#24345e',low:'#3a3a4a',trim:'#e8c03a',glasses:true,build:'strong',hold2:'lantern',crow:true},
    lines:[S(`Forty years I've kept that light. Forty years. Never missed a night. Until the moths.`,`I kept the light for forty years. Then the moths came.`),
      S(`Squawk, stop telling people I'm old. I'm vintage.`,`Squawk, I am not old. I am vintage.`),
      S(`A lighthouse is just a lantern that refuses to go to bed.`,`A lighthouse is a lantern that won't go to bed.`)]},
  {id:'c_barley',name:'Old Barley',town:'c_fold',col:'#d8d0b0',
    look:{skin:'#d39f78',hair:'#d8d4cc',beard:true,beardc:'#d8d4cc',hat:'straw',outfit:'tunic',shirt:'#e8e0c8',low:'#6a5a3a',belt:'#5a3a1e',build:'old',hold:'staff',pipe:true},
    lines:[S(`That's Duchess the Second, she's in charge. That's Gerald, he's in charge of nothing. He's happy.`,`Duchess the Second is in charge. Gerald is in charge of nothing.`),
      S(`Sit a while. The sea will still be there.`,`Sit a while. The sea will wait.`),
      S(`The sheep can tell when it's going to rain. They stand in a line and look at me. As if it's my fault.`,`When rain comes, the sheep stare at me. Like it's my fault.`)]}
];
for(const c of X1P_CAST){ if(CASTBY[c.id]) continue; CAST.push(c); CASTBY[c.id]=c; X1P.base[c.id]=c.look; }
for(const id of ['c_hester','c_hettie','c_ottoline','c_ingrid','c_fig','c_ambrose','c_charlie','c_oona']) INDOOR[id]=1;
// the third Bob (a person once he is home) and Bolt (his own figure; a companion after c_bolt)
SPECIAL.c_bob3=SPECIAL.c_bob3||{id:'c_bob3',name:'The Third Bob',col:'#7aa0e8',inside:'ev',look:{skin:'#c8ccd8',hair:'#8a8e98',helm:true,plume:'#3a6ac8',outfit:'armor',shirt:'#a8acb8',low:'#7a7e8a',trim:'#e0b84a',hold:'spear',build:'tall',tin:true},lines:[]};
for(const k of X1P_COAST) if(!TOWN_NAME[k]) TOWN_NAME[k]={c_gearhaven:'Gearhaven',c_saltmarsh:'Saltmarsh',c_gullsrest:'the Gull’s Rest',c_lanternpt:'Lantern Point',c_fold:'the Chalk Downs'}[k];
{ const base=shortName; shortName=function(id){ const m={c_ottoline:'Ottoline',c_whirligig:'Lord Whirligig',c_mo:'Harbormaster Mo',c_ambrose:'Ambrose',c_mina:'Mina',c_agatha:'Agatha',c_charlie:'Charlie',c_bobs:'the Bobs',c_penny:'Penny',c_ravel:'Madame Ravel',c_jo:'Jo',c_posy:'Posy',c_dory:'Dory',c_maudie:'Maudie',c_ingrid:'Ingrid',c_fig:'Auntie Fig',c_hester:'Captain Hester',c_hettie:'Professor Hettie',c_oona:'Granny Oona',c_tarbuckle:'Old Tarbuckle',c_barley:'Old Barley'}; return m[id]||base(id); }; }
// the Bobs are a pair (twin), both with spears (the stock twin gives a pick and a shovel)
{ const base=pProfile; pProfile=function(n){ const P=base(n); try{ if(P&&P.twin&&String(n.id)==='c_bobs'&&!P._x1p){ const c=CASTBY.c_bobs, o=Object.assign({},n.look||c.look,{twin:false}); P.ta=pResolve('c_bobs#a',Object.assign({},o,{hold:'spear'}),false,c); P.tb=pResolve('c_bobs#b',Object.assign({},o,{hold:'spear',plume:'#c83a3a'}),false,c); P.ta.k=P.tb.k=0.93*PSCALE; P._x1p=1; } }catch(e){} return P; }; }

// ---------- homes: each named home owner gets the town house nearest to the building the bible names (ACT2 2.1 to 2.3),
// whatever order the town's houses are in; the rest of the houses go to the stock assignment (generics n_<town>_<i>)
const X1P_HOME={c_hester:[6700,24500],c_hettie:[6600,25750],c_ottoline:[7700,24400],c_whirligig:[7900,24900],c_mo:[8100,26350],c_ingrid:[7700,25800],c_fig:[7300,26200],c_ambrose:[7200,24700],
  c_mina:[2250,26300],c_charlie:[2000,26800],c_dory:[2500,26550],c_oona:[1150,27050],c_tarbuckle:[1500,27250],c_maudie:[4300,25850],c_agatha:[12300,28500]};
// fixed outdoor spots (people the player must find) and where a home owner stands when the map has no house for them
const X1P_SPOT={c_penny:[7050,25880],c_ravel:[7200,25980],c_jo:[6700,26500],c_posy:[2580,26650],c_barley:[3900,21140],c_tarbuckle:[1400,27350],
  c_bobs_gate:[6950,24300],c_bobs_lift:[7700,25260]};
{ const base=assignHomesNew; assignHomesNew=function(){
  const took=[];
  try{
    let i=0;
    for(const c of CAST){
      const at=X1P_HOME[c.id]; if(!at||!c.home||c.generic) continue; i++;
      if(DOORS.some(d=>d.owner===c.id)){ c.home=false; took.push(c); continue; }
      // x1_world plans the named homes itself (house.want, or a virtual home like Ambrose's workshop at the foot of the
      // Great Clock): leave those to it, so nobody ends up in a neighbour's house
      if(HOUSES.some(h=>h.want===c.id&&!h.area)||(typeof C1WD!=='undefined'&&C1WD.homes&&C1WD.homes.some(v=>v.want===c.id))) continue;
      const hs=HOUSES.filter(h=>h.town===c.town&&h.k==='house'&&!h.area); if(!hs.length) continue;
      let h=null, bd=1e18; for(const q of hs){ const d=dist2(q.x,q.y,at[0],at[1]); if(d<bd){ bd=d; h=q; } }
      if(!h||bd>900*900) continue;
      const style=STYLE_OF[c.job]||c.style||'home', door=doorOf(h);
      const def=defHouse('h_'+c.id,{name:c.house||'House',owner:c.id,style,seed:1000+i+c.town.length*31,painting:i,egg:i+3,w:style==='inn'||style==='lodge'?680:560,h:style==='inn'?460:400,town:c.town});
      if(INDOOR[c.id]) c.inside=def.id;
      h.owner=c.id; h.area=def.id; h.door=door;
      DOORS.push({x:door.x,y:door.y,area:def.id,label:`Enter ${def.name}`,outY:door.outY||0,hs:h,owner:c.id});
      c.home=false; took.push(c);
    }
  }catch(e){ console.error('x1_people homes',e); }
  try{ base(); } finally { for(const c of took) c.home=true; }
}; }
{ const base=npcSpot; npcSpot=function(c){
  const id=c&&c.id;
  if(id==='c_bobs'){ const s=x1pR('c_salt')?X1P_SPOT.c_bobs_lift:X1P_SPOT.c_bobs_gate; return [s[0],s[1]]; }
  if(id==='c_bob3'){ const s=X1P_SPOT.c_bobs_lift; return [s[0]+44,s[1]+6]; }
  if(id==='dell'&&x1pDell()) return [1450,27420];
  if(X1P_SPOT[id]){ const s=X1P_SPOT[id]; return [s[0],s[1]]; }
  if(X1P_HOME[id]&&!homeDoor(id)){ const s=X1P_HOME[id]; return [s[0],s[1]+70]; }
  if(id==='c_maudie'||id==='c_agatha'){ const d=homeDoor(id); if(d) return [d.x+(id==='c_maudie'?60:-70),d.y+40]; }
  return base(c);
}; }
// Dell came down the river with the Soggy Biscuit Two (Act I `lure` done): from Chapter 3 he ferries Ash on the coast
function x1pDell(){ return !!G&&G.mode==='story'&&x1pQ('lure')&&x1pR('c_salt')&&actOf(G.stage)===2; }
{ const base=npcPresent; npcPresent=function(id){ if(id==='c_bob3') return x1pQ('c_bob')&&!X1P.bob3follow; return base(id); }; }
// the third Bob stands with the other two once he is home (a SPECIAL with inside:'ev' is skipped by setupNPCs)
{ const base=setupNPCs; setupNPCs=function(){ base(); try{ if(G&&G.mode==='story'&&npcPresent('c_bob3')){ const [x,y]=npcSpot(SPECIAL.c_bob3); G.npcs.push(mkNPC(SPECIAL.c_bob3,x,y)); } }catch(e){ console.error(e); }
  // a coast person whose spot by the door ends up in water or a cliff face steps onto the nearest dry ground
  try{ if(G&&G.npcs) for(const n of G.npcs){ if(n.y<20000||n.y>31000||n.x>=IZX-50||!blockedAt(n.x,n.y)) continue; const q=x1pDry(n.x,n.y); if(q){ n.x=q.x; n.y=q.y; if(n.home) n.home=[q.x,q.y]; } } }catch(e){ console.error(e); } }; }
function x1pDry(x,y){ for(let d=12;d<=240;d+=12){ const k=Math.max(8,Math.round(d/8)); for(let i=0;i<k;i++){ const a=i/k*TAU+Math.PI/2, px=x+Math.cos(a)*d, py=y+Math.sin(a)*d; if(!blockedAt(px,py)&&!colAt(px,py,12)&&(typeof elevLvl!=='function'||elevLvl(px,py)===elevLvl(x,y-40))) return {x:px,y:py}; } } return null; }

// a stand-in for the towns while the Act II world module is not in the build (the placeholder map 1): the five POIs,
// the towns and a house at each named building, so homes, talk and quests can be played and tested
function x1pStandIn(B){
  B.poi('c_gearhaven',{x:7200,y:25200,r:1100,name:'Gearhaven',level:10,town:true});
  B.poi('c_saltmarsh',{x:1900,y:26600,r:650,name:'Saltmarsh',level:9,town:true});
  B.poi('c_gullsrest',{x:4300,y:25850,r:260,name:'the Gull’s Rest',level:10,town:true});
  B.poi('c_lanternpt',{x:12300,y:28500,r:320,name:'Lantern Point',level:12,town:true});
  B.poi('c_fold',{x:3900,y:21100,r:260,name:'Old Barley’s Fold',level:9});
  B.town('c_gearhaven',{name:'Gearhaven',music:'town',generics:{ties:['Harbormaster Mo','Auntie Fig at the Teapot','Professor Sprocket','the two Bobs']},hz:()=>({wc:'#efe2c4',rc:'#3f6a8a'})});
  B.town('c_saltmarsh',{name:'Saltmarsh',music:'town',generics:{ties:['Chowder Charlie','Old Tarbuckle','the Tide Warden']},hz:()=>({wc:'#c8b48a',rc:'#6a8aa0'})});
  B.town('c_gullsrest',{name:'the Gull’s Rest',music:'town',generics:false});
  B.town('c_lanternpt',{name:'Lantern Point',music:'town',generics:false});
  for(const id in X1P_HOME){ const [x,y]=X1P_HOME[id], c=CASTBY[id]; B.house({x,y:y-40,w:130,h:84,town:c.town,roof:c.town==='c_saltmarsh'?'#6a8aa0':'#3f6a8a'}); }
  B.shrine({id:'c_s_clock',x:6850,y:24800,name:'Clocktower Shrine'});
  B.shrine({id:'c_s_salt',x:2450,y:26800,name:'Saltmarsh Shrine'});
}
if(MAPS[1]&&MAPS[1].placeholder){ const b0=MAPS[1].build; MAPS[1].build=function(B){ if(b0) b0.call(this,B); try{ x1pStandIn(B); }catch(e){ console.error('x1_people stand-in',e); } }; }
// ---------- talk (a1g_talk.js format): bio, about (people in other towns), rumor (points at a quest or a place), gifts,
// deep (2 hearts), secret (3 hearts), best (5 hearts), and a one-time chat with three ways to answer
const x1pChat=(q,qs,a,b,c,best)=>({q:S(q,qs),opts:[{t:S(a[0],a[1]),tone:'kind',r:S(a[2],a[3]),f:a[4]},{t:S(b[0],b[1]),tone:'brave',r:S(b[2],b[3]),f:b[4]},{t:S(c[0],c[1]),tone:'silly',r:S(c[2],c[3]),f:c[4]}],best});
Object.assign(TALK,{
  c_hester:{bio:S('Captain of the Clockwatch, Gearhaven’s guard. Counts everything in seconds.','Captain of the city guard. She counts seconds.'),
    about:{osric:S(`Captain Osric and I trade letters every week. He sends dog news. I send Bob news. Neither of us is winning.`,`Captain Osric writes to me. Dog news and Bob news.`),c_mina:S(`The Tide Warden in Saltmarsh counts waves. I count seconds. We get along terribly well.`,`Mina counts waves. I count seconds. We are friends.`)},
    rumor:{t:S(`My weathervane has a spring in it the size of a cat. Nobody touches it. I will know.`,`My weathervane has a big spring in it. Don't touch it!`),hint:'c_lm_vane',need:()=>x1pR('c_brass')},
    loves:['frostberry'],hates:['moonlily'],
    deep:S(`I was not always the Captain. I was a lost girl crying on the Great Stair, and an old clockkeeper counted to sixty with me until I stopped. I have been counting ever since.`,`I was once a lost girl on the stairs. An old man counted with me. I still count.`),
    secret:{t:S(`This is my spare whistle. Blow it in a fight and everyone stands up a bit straighter. Including you.`,`My spare whistle. It makes you stand tall. Take less hurt.`),reward:{armor:0.05}},
    best:{t:S(`You are the most punctual dragon I have ever met. That is a compliment. Take my old coat lining. It is warm, and it is never late.`,`You are never late. Take my warm coat lining.`),reward:{maxhp:15}},
    chat:x1pChat(`Quick question. How many seconds should a hero wait before charging in?`,`How long should a hero wait?`,
      [`As many as it takes to make a plan.`,`Long enough to make a plan.`,`Correct. Planning is just bravery with a clock.`,`Correct! A plan is bravery with a clock.`,1],
      [`Zero. I just go!`,`Zero! I just go!`,`Zero seconds. Hm. I admire it. I would also like the paperwork first.`,`Zero. Brave. I want paperwork first.`,0.5],
      [`Seven. Seven is a lucky number.`,`Seven. It's lucky.`,`Seven is not a plan. ...Seven is a nice number, though.`,`Seven is not a plan. It is a nice number.`,0.5],'kind')},
  c_hettie:{bio:S('Inventor in Sprocket’s Workshop. Lost her brass dog, Bolt, when the moths came.','An inventor. Her brass dog Bolt ran away.'),
    about:{quill:S(`Professor Quill up north? We write about stars and screws. She thinks the moon is rock. I think it's gears. One of us is right.`,`Professor Quill and I write letters. She says the moon is rock. I say gears.`),c_ingrid:S(`Ingrid makes the parts I can't. I make the parts she won't. Mostly the exploding ones.`,`Ingrid makes my parts. I make the ones that explode.`)},
    rumor:{t:S(`The Steam Rams in the Brass Yards have springs in their bellies. Knock one dizzy and BOING. Science!`,`Steam Rams have springs inside. Knock one dizzy. BOING!`),hint:null,need:()=>x1pR('c_brass')},
    loves:['honey'],hates:['fish'],
    deep:S(`My mother built clocks. My grandmother built clocks. I built a clock that runs backwards. It tells you how long until you were born. Nobody wants it. I love it.`,`My family built clocks. Mine runs backwards. Nobody wants it. I love it.`),
    secret:{t:S(`Here. A pocket gear-spring. Clip it to your boots. You'll roll quicker. Probably. Possibly. It's fine.`,`A spring for your boots. You will roll faster!`),reward:{roll:true}},
    best:{t:S(`You're my favorite test subject. I mean friend. FRIEND. Take this whirligoo. It makes your draughts fizz harder.`,`You're my best friend! This makes your draughts heal more.`),reward:{heal:0.15}},
    chat:x1pChat(`If you could invent anything at all, what would it be?`,`What would you invent?`,
      [`Something that keeps everyone warm.`,`Something to keep people warm.`,`Oh, that's lovely. And hard. I'll start tonight. Where's my spanner?`,`Lovely! I'll start tonight.`,0.5],
      [`A rocket I can ride!`,`A rocket to ride!`,`YES. Rockets! I have three. Two of them are on fire. Which is normal for rockets.`,`YES! Rockets! Two are on fire. That's normal.`,1],
      [`A sandwich that makes more sandwiches.`,`A sandwich that makes sandwiches.`,`A self-sandwiching sandwich. Write that down. Where's my pencil? Both of them?`,`Ha! Write that down! Where is my pencil?`,0.5],'brave')},
  c_ottoline:{bio:S('Keeper of the Turning Library. Whispers, then SHOUTS, then says sorry.','The librarian. She whispers, then shouts.'),
    about:{wren:S(`Sister Wren and I have written to each other for thirty years. We have never agreed about anything. It's wonderful.`,`Sister Wren and I write letters. We never agree. It's fun.`),c_whirligig:S(`Lord Whirligig owes me eleven books. ELEVEN. Sorry. Eleven.`,`Lord Whirligig owes me eleven books! Sorry. Eleven.`)},
    rumor:{t:S(`Madame Ravel swears Pearl kept a page on Gull Isle, off the White Cliffs. Madame Ravel swears a lot of things. But that one I'd like to be true.`,`Ravel says a page of Pearl's is on Gull Isle. I hope so.`),hint:'c_lm_gullisle',need:()=>x1pR('c_salt')},
    loves:['moonlily'],hates:['fish'],
    deep:S(`When I was little I hid in the library during a storm, and the shelves kept turning, and I read every book that came past. Twice. I never really left.`,`As a girl I hid here in a storm. I read every book. I never left.`),
    secret:{t:S(`A bookmark Mother Pearl used. It's just a bit of rope. But it's HER rope. Sorry. Here.`,`Pearl's old bookmark. Just rope. Her rope!`),reward:{energy:15}},
    best:{t:S(`You've become a regular. Regulars get the good chair. And this map of every cove on the coast.`,`You get the good chair. And a map of the coast.`),reward:{reveal:true}},
    chat:x1pChat(`What's the best book you've ever read? Quietly, please.`,`What is the best book you read?`,
      [`One my mom read to me. Over and over.`,`One my mom read to me.`,`The best kind. The ones with somebody's voice still in them.`,`The best kind. You can still hear her voice.`,1],
      [`One about a dragon who saved everyone!`,`A dragon hero book!`,`I've read that one. I think you're in it now. QUIETLY in it.`,`I read it. I think you're in it now!`,0.5],
      [`A cookbook. I ate it.`,`A cookbook. I ate it.`,`You ATE... sorry. You ate a cookbook? Was it good? Don't tell Wren.`,`You ATE it? Sorry. Was it good?`,0.5],'kind')},
  c_whirligig:{bio:S('The richest clock baron in Gearhaven. Owns the Brassworks. Pompous, slowly softening.','A rich clock lord. Grumpy, but getting nicer.'),
    about:{mayor:S(`The Mayor of Brindlecross? We met once. He tried to name a street after me. In HIS town. I approved.`,`The Mayor up north named a street after me. Good.`),c_ravel:S(`Madame Ravel sold me a "genuine mermaid comb". It was a fork. I keep it anyway.`,`Ravel sold me a mermaid comb. It was a fork.`)},
    rumor:{t:S(`My Brassworks has a smokestack Pearl built. Nobody can climb it. Nobody should. ESPECIALLY not dragons.`,`Pearl built a big chimney at my Brassworks. Don't climb it!`),hint:null,need:()=>x1pR('c_brass')},
    loves:['frostberry'],hates:['fish'],
    deep:S(`My father had one clock. He wound it every morning and sang to it. I have four hundred clocks, and I've never once sung. Perhaps I'm doing it wrong.`,`My dad had one clock. He sang to it. I have four hundred. I never sing.`),
    secret:{t:S(`Take this. A coin with my face on it. It's a lucky coin. My face is very lucky.`,`A lucky coin. With my face on it.`),reward:{coins:150}},
    best:{t:S(`You've taught an old baron something, dragon. I'm not sure what. Here, a little gold for your blade. Don't tell anyone I was generous.`,`You taught me something. Gold for your blade. Shh.`),reward:{dmg:0.05}},
    chat:x1pChat(`Be honest, dragon. Am I a good lord?`,`Am I a good lord?`,
      [`You could be. You're getting there.`,`You're getting there.`,`Getting there. Hmph. I'll take it. I'll take it and frame it.`,`Getting there. Hmph. I'll frame that.`,1],
      [`Not yet. Be kinder.`,`Not yet. Be kinder.`,`KINDER? I'm... hm. Kinder. Like leaving snacks out. I can do kinder.`,`KINDER? Hm. I can do kinder.`,0.5],
      [`You have a very nice hat.`,`Nice hat!`,`I DO have a very nice hat. Thank you. That is the correct answer.`,`I DO have a nice hat. Correct!`,0.5],'kind')},
  c_mo:{bio:S('Harbormaster of Gearhaven. Booms like a sea shanty. Blows bubbles from his pipe.','He runs the harbor. He blows bubbles.'),
    about:{dell:S(`There's a fella up your river named Dell? Boats that sink? He'd fit right in here. We've got a whole harbor of sinking.`,`Dell's boats sink? He'd fit right in here!`),c_jo:S(`Skipper Jo is the fastest little skiff on the coast. Don't tell her I said that. She'll be impossible.`,`Jo is the fastest sailor here. Don't tell her!`)},
    rumor:{t:S(`Past the Lantern Point beach there's a rip that throws boats out to Seal Rocks. Old Sir Blubbington the seal sleeps out there on a chest. Bring a fish.`,`A seal sleeps on a chest at Seal Rocks. Bring a fish!`),hint:'c_seal',need:()=>x1pR('c_light')},
    loves:['fish'],hates:['moonlily'],
    deep:S(`My granny was harbormaster. Every night she'd stand on the Far Pier and wave a lantern at the dark, just in case somebody was out there. I still do it. Barnacles, I do.`,`My granny waved a lantern at the sea every night. I still do.`),
    secret:{t:S(`Here. A ship's biscuit from the year of the long storm. Hard as an anchor. Keep it in your pack. Makes you feel steady.`,`An old ship biscuit. It makes you steady.`),reward:{stamina:15}},
    best:{t:S(`You're harbor family now, dragon. The bell rings for you. And take this, my old lucky float.`,`You're harbor family! Take my lucky float.`),reward:{potmax:1}},
    chat:x1pChat(`AHOY! Quick one. What's the best thing about the sea?`,`What is best about the sea?`,
      [`It brings people home.`,`It brings people home.`,`Aye. That's the truth of it. Barnacles, you'll make me cry.`,`Aye. You'll make me cry.`,0.5],
      [`The big waves!`,`Big waves!`,`HA! A storm-lover! You'd have liked my granny. She sailed INTO storms. For fun.`,`HA! My granny loved storms too!`,1],
      [`The fish. They live there for free.`,`Fish live there for free.`,`Free rent! Never thought of it! Lucky little fish.`,`Free rent! Lucky fish!`,0.5],'brave')},
  c_ingrid:{bio:S('The smith of the Bright Anvil. Sings while she hammers. Says ja a lot. Reforges star-iron.','The smith. She sings and hammers. Bring her star-iron.'),
    about:{maren:S(`Maren of Emberhollow? The smith who forged a sword for a dragon? I have heard SONGS about your mother.`,`Your mom Maren is famous! There are songs about her.`),c_hettie:S(`Hettie brings me broken robots. I fix them. They explode. She brings them back. It is a good friendship.`,`Hettie brings robots. I fix them. They explode. Good friends!`)},
    rumor:{t:S(`Star-iron falls from the sky, ja? On the Downs' east crag there is a lump of it. I can smell it from here. Bring it.`,`There is star-iron on the east hills. Bring it to me!`),hint:null},
    loves:['honey'],hates:['moonlily'],
    deep:S(`I come from far in the north where the forges are cold. My father said, Ingrid, go south, where the fire is easy. Ja. Easy. Look at my arms. Nothing here is easy. It is wonderful.`,`I came from the cold north. Work here is hard. It is wonderful.`),
    secret:{t:S(`I made this for you at night. A new grip for your sword. Hammer, hammer, ding! It fits your claws.`,`A new sword grip! It fits your claws.`),reward:{crit:0.04}},
    best:{t:S(`You are a smith's best friend: you break things and bring them back. Take this. Good iron for your scales. Ja!`,`You break things and bring them back! Iron for your scales.`),reward:{armor:0.06}},
    chat:x1pChat(`Every smith has a song. What would yours be about?`,`What would your song be about?`,
      [`The people I'm making things for.`,`My friends.`,`Ja! That is the best song. It is long, too, if you have many friends.`,`Ja! The best song!`,0.5],
      [`Fire! Big fire!`,`Fire! Big fire!`,`FIRE! JA! Hammer, hammer, FWOOSH! I like you.`,`FIRE! JA! I like you.`,1],
      [`Snacks.`,`Snacks.`,`Snack, snack, ding! Snack, snack, dong! It is a short song. Like mine.`,`Snack, snack, ding! Short song.`,0.5],'brave')},
  c_fig:{bio:S('Keeper of the Steaming Teapot, cafe and inn. Calls everyone dearie. Rest here.','She runs the tea shop and inn. You can rest here.'),
    about:{tilly:S(`There's an inn up north, the Sleepy Salmon? The owner sends me soup recipes. Some of it is very nearly soup.`,`The Sleepy Salmon inn sends me soup recipes.`),c_oona:S(`Oona Saltwhistle and I were girls together. She was always cold. I was always making tea. We met in the middle.`,`Oona and I were girls together. She was cold. I made tea.`)},
    rumor:{t:S(`A girl used to wash dishes here. Lovely thing. Terrible with plates. She hummed while she worked, always the same tune.`,`A girl washed dishes here. She always hummed one tune.`),hint:null},
    loves:['honey','frostberry'],hates:[],
    deep:S(`I never had children, dearie. I had customers. Hundreds of them. Every one came in cold and went out warm. That's a family, if you squint.`,`I had no kids. I had customers. They came in cold and left warm.`),
    secret:{t:S(`Here's my teapot cosy pattern. Well, it's a scarf. Same thing. You'll be warmer in the wind.`,`A scarf! You'll be warm in the wind.`),reward:{stamina:15}},
    best:{t:S(`You're my favorite customer, dearie. Don't tell the others. Free beds for life, everywhere I can talk anyone into it.`,`My favorite! Free beds for life!`),reward:{freeinn:true}},
    chat:x1pChat(`Sit, dearie. Tell Auntie Fig. What's the bravest thing you ever did?`,`What is the bravest thing you did?`,
      [`Said sorry when I was wrong.`,`I said sorry.`,`Oh, that's the bravest kind. Most people never manage it. Have a biscuit.`,`That's the bravest kind. Have a biscuit.`,1],
      [`Fought a dragon on a mountain!`,`Fought a dragon!`,`A DRAGON! Well. You are a dragon. So it was a fair fight. Have a biscuit.`,`A dragon! A fair fight, then. Biscuit?`,0.5],
      [`Ate one of Bertram's buns.`,`Ate Bertram's bun.`,`I don't know who Bertram is, dearie, but I believe you. Have a safe biscuit.`,`I believe you. Have a safe biscuit.`,0.5],'kind')},
  c_ambrose:{bio:S('Keeper of the Great Clock for ninety years. A bit deaf. Ends sentences with tick.','He winds the Great Clock. A bit deaf. Tick.'),
    about:{yara:S(`Your Elder Yara? Counts everything? Eh. I count ticks. Ninety years of them. Shall we compare? Tick.`,`Yara counts things? I count ticks. Tick.`),c_hester:S(`Captain Hester was a little girl crying on the Great Stair once. I counted to sixty with her. Now she counts at everybody. Tick.`,`I once counted to sixty with Hester. Now she counts at everyone.`)},
    rumor:{t:S(`Her heart's not up the tower, young dragon. It's down in the Brassworks. The great drive. Tick... tock.`,`The clock's heart is in the Brassworks. Tick.`),hint:null,need:()=>x1pR('c_brass')},
    loves:['honey'],hates:['frostberry'],
    deep:S(`Eh? My wife used to say the clock was my sweetheart. She wasn't wrong. But I'd stop every clock in the world to hear her laugh again. Tick.`,`My wife said the clock was my sweetheart. I miss her laugh. Tick.`),
    secret:{t:S(`A key from the clock's works. Keeps good time. Hold it and your breath lasts longer. Don't ask how. Tick.`,`A clock key. Your breath lasts longer. Tick.`),reward:{energy:15}},
    best:{t:S(`You've a good rhythm, young dragon. Tick, tock. Here. A spring from her very first year. She'd want you to have it.`,`You have good rhythm. Take this old spring. Tick.`),reward:{maxhp:15}},
    chat:x1pChat(`Eh? Speak up. What's the best sound in the world?`,`What is the best sound?`,
      [`Someone you love laughing.`,`A friend laughing.`,`Eh? Laughing? Yes. YES. That's the one. Tick.`,`Laughing? Yes. That's it. Tick.`,1],
      [`A dragon's roar!`,`A roar!`,`A ROAR? Do one. ...EH? Was that it? I'm a bit deaf, lad. Tick.`,`A roar? Eh? I'm a bit deaf. Tick.`,0.5],
      [`TICK.`,`TICK.`,`TOCK! Ha! Somebody finally answered! Tick.`,`TOCK! Ha! Tick.`,0.5],'kind')},
  c_penny:{bio:S('Kid reporter, the whole staff of the Gearhaven Gazette. Speaks in HEADLINES.','A kid reporter. She talks in HEADLINES.'),
    about:{rook:S(`A kid up north wants to be a knight? HEADLINE: SOME KIDS HAVE WEIRD DREAMS. Mine is a printing press. Normal.`,`A kid up north wants to be a knight? I want a printing press.`),c_jo:S(`Skipper Jo? HEADLINE: LOCAL SAILOR CANNOT LOSE NICELY. Source: me. I raced her once.`,`Jo hates losing. I know. I raced her.`)},
    rumor:{t:S(`HEADLINE: CHALK DRAGON ON THE DOWNS GOES GREY. OLD BARLEY SAD. SHEEP SADDER. Somebody should do something. Somebody with feet.`,`HEADLINE: CHALK DRAGON GOES GREY! Old Barley is sad.`),hint:null},
    loves:['frostberry'],hates:['fish'],
    deep:S(`My mom and dad ran the Gazette's old press. It broke. Now I'm the Gazette. I shout the news on corners so nobody has to miss it.`,`Our press broke. Now I shout the news so nobody misses it.`),
    secret:{t:S(`EXCLUSIVE: a lucky pencil. Every big scoop I ever got, I got with this pencil. Okay, the scoop was a cat in a bin. Still. Take it.`,`My lucky pencil. Take it!`),reward:{coins:120}},
    best:{t:S(`HEADLINE: REPORTER MAKES FRIEND. Okay, it's not a headline. It's just nice. Here. My map of every rooftop path.`,`HEADLINE: I MADE A FRIEND! Here is my map.`),reward:{reveal:true}},
    chat:x1pChat(`OFF THE RECORD. What do YOU think the Moth Mask is really like?`,`What is the Moth Mask really like?`,
      [`Lonely, maybe.`,`Lonely, maybe.`,`...Huh. That's not a headline. That's a feeling. I'll think about it.`,`Huh. That's a feeling, not a headline.`,1],
      [`Fast. Faster than me. For now.`,`Fast. For now.`,`HEADLINE: DRAGON VOWS TO CATCH MASK. Ooh. Good one.`,`HEADLINE: DRAGON WILL CATCH MASK!`,0.5],
      [`Mothy.`,`Mothy.`,`HEADLINE: MASK IS MOTHY, SAYS EXPERT. I can't print that. I'm printing that.`,`HEADLINE: MASK IS MOTHY! I'm printing it.`,0.5],'kind')},
  c_ravel:{bio:S('Owner of Ravel’s Remarkable Rarities in the Gear Market. Every item has a story. Most are not true.','She runs a shop. Her stories are not always true.'),
    about:{pell:S(`A peddler up north named Pell? Wonderful wagon, I hear. Tell him Ravel says his socks are cheap. He'll know.`,`Tell Pell up north his socks are cheap. He'll know.`),c_hettie:S(`The Professor buys my broken clocks to fix. I buy her fixed clocks to sell as broken. Everyone's happy.`,`Hettie fixes my clocks. I sell them. Everyone is happy.`)},
    rumor:{t:S(`Pearl's lost logbook page? On Gull Isle, under the gulls. There's no map. Fly off the cliff updraft and look.`,`A page of Pearl's is on Gull Isle. Fly from the cliff!`),hint:'c_lm_gullisle'},
    loves:['moonlily'],hates:['honey'],
    deep:S(`I was a sailor once. I brought back one thing from every port. Then I ran out of ship and opened a shop. The hat came from the moon. Probably.`,`I was a sailor. I kept one thing from every port. The hat is from the moon.`),
    secret:{t:S(`A gift from me, which is very rare. This charm was blessed by a seal. A real seal. Sir Blubbington himself.`,`A charm blessed by a seal!`),reward:{bless:1}},
    best:{t:S(`Best customer! Here. My one true treasure: a draught really brewed by a mermaid. Her name was also Merv.`,`Best customer! A mermaid draught. Her name was Merv.`),reward:{potmax:1}},
    chat:x1pChat(`Tell me, dragon. What's the most remarkable thing you own?`,`What is your best thing?`,
      [`My mom's hugs. They're not for sale.`,`Mom's hugs.`,`Ah. The only thing I can't stock. Lucky dragon.`,`The one thing I can't sell. Lucky you.`,0.5],
      [`My sword. It's beaten a mountain!`,`My sword!`,`A mountain-beating sword! I'd give you four coins for it. No? Fine.`,`I'll give you four coins! No? Fine.`,0.5],
      [`This pebble. It looks like a duck.`,`A duck pebble.`,`It DOES look like a duck. Two coins. No? Keep it. Keep the duck.`,`It IS a duck! Keep the duck.`,1],'silly')},
  c_jo:{bio:S('Sailor kid with the fastest skiff in the harbor, the Sea Biscuit. Terrible at losing.','A sailor kid. Fast boat. Hates losing.'),
    about:{elka:S(`There's a girl up north who races on SNOW? Snow's just slow water. I'd beat her. Probably. Ask her.`,`Elka races on snow? I'd beat her. Probably.`),c_mo:S(`Harbormaster Mo taught me to tie knots. I taught him to lose at cards. Fair trade.`,`Mo taught me knots. I beat him at cards.`)},
    rumor:{t:S(`The harbor mouth has a rip that'll drag you out to sea. Unless you skip across it. Can you skip? On water? Course you can't.`,`The harbor mouth pulls you out to sea. Unless you skip.`),hint:null},
    loves:['fish'],hates:['moonlily'],
    deep:S(`My mom sailed north with the fleet last spring, with Posy's dad and the rest. I race because when I'm fast, I'm not waiting. Waiting is the worst.`,`My mom sailed away. I race so I don't just wait.`),
    secret:{t:S(`Here. A sailor's knot charm. Keeps your feet under you. Don't tell anyone I'm nice.`,`A knot charm. Don't tell anyone I'm nice.`),reward:{stamina:20}},
    best:{t:S(`You're my best mate, lizard. Here. My spare compass. It points at the nearest good time.`,`Best mate! Take my compass.`),reward:{reveal:true}},
    chat:x1pChat(`Truth time, landlubber. Are you scared of the sea?`,`Are you scared of the sea?`,
      [`A little. That's okay, right?`,`A little. Okay?`,`...Yeah. It's okay. Everyone is. Even me. Don't tell.`,`Yeah. It's okay. Me too. Shh.`,0.5],
      [`Nope. Bring on the waves!`,`Nope! Waves!`,`HA! That's the spirit! You'll make a sailor yet!`,`HA! You'll be a sailor yet!`,1],
      [`Only the wet bits.`,`Only the wet bits.`,`The wet bits are ALL the bits! ...Okay, that's funny.`,`It's ALL wet bits! Okay, funny.`,0.5],'brave')},
  c_bobs:{bio:S('Two friendly clockwork watchmen of the Clockwatch. Both are Bob. There used to be three.','Two tin guards. Both are named Bob.'),
    about:{osric:S(`Captain Osric of Brindlecross has two dogs. We are better than dogs. We do not bark. We tick.`,`Captain Osric has dogs. We are better. We tick.`),c_hester:S(`The Captain is very strict. She once wound us up for being late. ...That is how we work, Bob.`,`The Captain winds us up. That is how we work.`)},
    rumor:{t:S(`A Tin Watchman with a blue plume was seen in the Brass Yards, going tick tock in a scary voice. That's Bob. Our Bob.`,`A blue-plumed tin man is in the Brass Yards. That is our Bob!`),hint:null,need:()=>x1pR('c_brass')},
    loves:['honey'],hates:['fish'],
    deep:S(`Mother Pearl built the first three Bobs. She said, you'll guard this city when I'm gone. We said, where are you going? She just laughed. We are still guarding it. Tick.`,`Pearl built us to guard the city. We still do. Tick.`),
    secret:{t:S(`We are giving you a spare rivet. Our most precious rivet. Bob was keeping it for a special occasion. This is the occasion, Bob.`,`Our best rivet. For you.`),reward:{armor:0.04}},
    best:{t:S(`You are an honorary Bob. That is the highest honor. Here is a key. It winds nothing. It is the thought that counts.`,`You are an honorary Bob! Take this key.`),reward:{maxhp:15}},
    chat:x1pChat(`Question. Which of us is the clever Bob?`,`Which of us is the clever Bob?`,
      [`You're both clever in your own way.`,`You both are.`,`Hear that, Bob? Both of us! ...I think that means you, Bob.`,`Both of us, Bob! Hooray!`,1],
      [`Him. Definitely him.`,`Him!`,`HA! Told you, Bob. ...Wait. Which one did it point at?`,`Ha! Wait. Which one?`,0.5],
      [`The third one.`,`The third one.`,`...We don't talk about Bob. But. Yes. Fair.`,`We don't talk about Bob. But fair.`,0.5],'kind')},
  c_mina:{bio:S('Tide Warden of Saltmarsh. Keeps the Tide Clock. Counts waves under her breath.','She keeps the Tide Clock. She counts waves.'),
    about:{dell:S(`A fisherman up north named Dell? I hear his boats know the bottom of every lake. Personally.`,`Dell's boats know the bottom of every lake.`),c_hester:S(`Captain Hester counts seconds, I count waves. Once we counted together for an hour. Best afternoon of my life.`,`Hester and I once counted together. Best day ever.`)},
    rumor:{t:S(`At low tide the Rockpools show their peppers. Little red ones. The crabs guard them like gold.`,`Red peppers grow in the Rockpools. Crabs guard them.`),hint:'c_lm_pep1',need:()=>x1pOn('c_whip')},
    loves:['fish'],hates:['honey'],
    deep:S(`My granddad was Tide Warden. One night he forgot to set the clock, and the sea came up to the doorsteps. Nobody was hurt. But he never forgot again. Neither will I.`,`My granddad forgot the clock once. The sea came in. I never forget.`),
    secret:{t:S(`A tide charm. Wear it near water and you'll feel the waves in your feet.`,`A tide charm. Feel the waves.`),reward:{energy:15}},
    best:{t:S(`You're the best thing to happen to the tide in years. Here. A bit of my spare tide pole. It's lucky.`,`You helped the tide! A lucky piece of my pole.`),reward:{potmax:1}},
    chat:x1pChat(`Sorry. Can I ask? Do you like the sea, or does it make you nervous?`,`Do you like the sea?`,
      [`Both. Is that okay?`,`Both.`,`Oh, that's the right answer. The sea is both. Thank you.`,`Right answer. The sea is both.`,1],
      [`I love it! It's huge!`,`I love it!`,`It IS huge. Forty-two waves since you said that. Sorry.`,`It is huge. Forty-two waves. Sorry.`,0.5],
      [`It's a lake that forgot to stop.`,`A lake that forgot to stop.`,`A lake that... ha! Oh, I'm telling the Tide Clock that.`,`Ha! I'll tell the Tide Clock!`,0.5],'kind')},
  c_charlie:{bio:S('Cook at the Chowder Pot, Saltmarsh’s inn. Everything comes back to chowder. Rest here.','The chowder cook. You can rest at his inn.'),
    about:{cookie:S(`Cookie of Coppergulch puts ROCKS in her soup. We write. We argue. She's wrong. She's my best enemy.`,`Cookie puts rocks in soup! We argue by letter.`),c_tarbuckle:S(`Old Tarbuckle eats my chowder every night and says it was better in his day. It was not. I wasn't born.`,`Tarbuckle says chowder was better in his day. Ha.`)},
    rumor:{t:S(`My grandpa made a Ghost Pepper Chowder so hot it woke a ghost. Or so the story goes. Old Tarbuckle knows the rest.`,`My grandpa's chowder woke a ghost! Ask Old Tarbuckle.`),hint:null},
    loves:['fish'],hates:['frostberry'],
    deep:S(`My mom made chowder for the whole village every winter, in a pot so big I could sit in it. I did, once. She was not pleased. The chowder was.`,`Mom's pot was so big I sat in it once. Oops.`),
    secret:{t:S(`A jar of my secret stock. Drink a little when you're tired and you'll feel like a warm boat.`,`My secret stock. Your draughts heal more.`),reward:{heal:0.12}},
    best:{t:S(`You're family now. Family gets the bottom of the pot. That's where the flavor hides.`,`You're family! The best part of the pot.`),reward:{maxhp:15}},
    chat:x1pChat(`Settle a fight for me. Chowder: with shells or without?`,`Chowder: shells or no shells?`,
      [`However the person eating it likes it.`,`How they like it.`,`A diplomat! Ha! Fine. With shells. For you, without.`,`Ha! Fine. Yours with no shells.`,0.5],
      [`With shells! More crunch!`,`Shells! Crunch!`,`YES! Crunch! That's what I keep telling Cookie!`,`YES! Crunch! Tell Cookie!`,1],
      [`With rocks.`,`With rocks.`,`Don't you DARE. ...Ha! You've been talking to Cookie.`,`Don't you DARE! Ha!`,0.5],'brave')},
  c_dory:{bio:S('Fisher and net-mender of Cockle Cottage. Posy’s mom. Short sentences.','A fisher. Posy is her girl.'),
    about:{hal:S(`A farmer up north worries about pumpkins? I worry about nets. Same worry. Different vegetables.`,`Hal worries about pumpkins. I worry about nets.`),c_oona:S(`Granny Oona's been cold for seventy years. Someone ought to do something. Someone with fire.`,`Granny Oona is always cold. Someone with fire should help.`)},
    rumor:{t:S(`The Saucy Gull wreck is out on the Rockpools. Don't go there at night. Something clanks.`,`Don't go to the old wreck at night. Something clanks.`),hint:'c_lm_deck'},
    loves:['honey'],hates:['moonlily'],
    deep:S(`Posy's dad sailed north with the fleet. I mend his net every night. Nobody's using it. I mend it anyway.`,`Posy's dad is at sea. I mend his net every night anyway.`),
    secret:{t:S(`Here. A spare net bag. Holds more draughts. Don't argue.`,`A net bag. More draughts.`),reward:{potmax:1}},
    best:{t:S(`You looked after Posy. That's everything. Take my mother's knife sharpener. Your sword will thank me.`,`You looked after Posy. Take this sharpener.`),reward:{dmg:0.05}},
    chat:x1pChat(`Posy asks why the sea takes people. What do I tell her?`,`Why does the sea take people?`,
      [`That the sea brings people home too.`,`It brings them home too.`,`...Yes. It does. I'll tell her that. Thank you.`,`Yes. I'll tell her. Thank you.`,1],
      [`That someone will always go and look.`,`Someone will look.`,`Someone always does. Maybe you. Maybe her, one day.`,`Someone always does. Maybe you.`,0.5],
      [`That the sea is a big grumpy fish.`,`A big grumpy fish.`,`Ha. She'd like that. The big grumpy fish. Fine.`,`Ha. She'd like that.`,0.5],'kind')},
  c_oona:{bio:S('The oldest woman in Saltmarsh, Vesper’s gran. Always a little frosty. Calls everyone duck.','Vesper’s gran. Always cold. Calls you duck.'),
    about:{moss:S(`There's a granny in your bog up north who brews potions? Tell her I'd like one for warm toes. Two, if she's offering.`,`A granny up north makes potions? I want one for warm toes.`),c_fig:S(`Fig and I were girls together. Seventy years and she's never once let my cup go cold.`,`Fig never lets my tea go cold.`)},
    rumor:{t:S(`Pearl's old place, the Gullcrag Caves, is full of her things. Her rope. Her bell. Her pages. Bring me word of her one day, duck.`,`Pearl's things are in the Gullcrag Caves. Her pages too.`),hint:null,need:()=>x1pR('c_salt')},
    loves:['honey'],hates:['frostberry'],
    deep:S(`My Vesper's mom and dad sailed a boat called the Moth. One night it didn't come back. Vesper was five. She stopped crying after a week, and she started climbing. She hasn't stopped since.`,`Vesper's mom and dad were lost at sea. She was five. She started climbing.`),
    secret:{t:S(`I knitted you mittens, duck. With holes for your claws. I'm not daft.`,`Mittens! With claw holes.`),reward:{armor:0.05}},
    best:{t:S(`You're one of us now, duck. Emberblood to Emberblood. Here. My mother's last biscuit. Don't eat it. It's for luck.`,`You're one of us, duck. A lucky biscuit.`),reward:{maxhp:20}},
    chat:x1pChat(`Tell an old woman something, duck. What makes YOU warm?`,`What makes you warm?`,
      [`People. Being with people.`,`Being with people.`,`That's Pearl's answer, that is. Fire isn't the only warm thing. Come here.`,`That's Pearl's answer. Come here, duck.`,1],
      [`My fire! It's always on!`,`My fire!`,`Lucky duck. Don't you ever let it go out. Promise.`,`Lucky duck. Never let it go out.`,0.5],
      [`Socks. Two pairs.`,`Two pairs of socks.`,`Two pairs! Ha! I wear three. Still cold. Funny old world.`,`I wear three! Still cold.`,0.5],'kind')},
  c_tarbuckle:{bio:S('Retired sea captain and Saltmarsh’s teller of ghost stories. Exaggerates everything.','An old sea captain. He tells ghost stories.'),
    about:{sal:S(`There's an Old Sal up north building a boat for six years? In my day we built boats in six minutes. They sank in seven.`,`Six years for a boat? In my day, six minutes!`),c_charlie:S(`Young Charlie makes good chowder. Not as good as his grandpa's. His grandpa's woke the dead. ...and THAT'S why I don't eat eels.`,`Charlie's grandpa's chowder woke the dead!`)},
    rumor:{t:S(`Captain Saltbeard and I sailed together. Then apart. Then into each other. He cheated at cards. He still owes me a sock.`,`Captain Saltbeard owes me a sock. He cheated at cards.`),hint:'c_lm_deck'},
    loves:['fish'],hates:['moonlily'],
    deep:S(`In my day I sailed to the edge of the world. Out east the sea goes still and glassy and the moon looks too big. I turned around. Bravest thing I ever did, turning around.`,`Far east, the moon looks too big. I turned back. That was brave.`),
    secret:{t:S(`Here. My old spyglass. Doesn't work. Never did. But you look very wise holding it.`,`My old spyglass. It doesn't work. You look wise.`),reward:{coins:100}},
    best:{t:S(`You're a proper sailor now. Take my lucky eyepatch. The spare one. It's been washed. Once.`,`You're a real sailor! My lucky eyepatch.`),reward:{crit:0.05}},
    chat:x1pChat(`In my day, a sailor had to answer a riddle to board my ship. What's the best part of a voyage?`,`What is the best part of a trip?`,
      [`Coming home.`,`Coming home.`,`Aye. Aye, it is. You can board.`,`Aye. You can board.`,1],
      [`The storm in the middle!`,`The storm!`,`HA! A storm sailor! You can board AND steer.`,`HA! You can steer!`,1],
      [`The snacks.`,`Snacks.`,`...In my day we had no snacks. You can board. Bring snacks.`,`No snacks in my day. Bring some.`,0.5],'kind')},
  c_posy:{bio:S('A fierce small girl of Saltmarsh. Carries a golden music box everywhere.','A small, fierce girl with a music box.'),
    about:{nib:S(`A kid up north sells maps of cats? I'd buy one. If the cat was a crab.`,`Maps of cats? I want a crab map.`),c_penny:S(`Penny shouts the news. I shout back. We're friends.`,`Penny shouts news. I shout back.`)},
    rumor:{t:S(`Granny Oona's chimney has a gull nest on it. A BIG gull. He's rude. He sits there and looks at people.`,`A big rude gull sits on Granny Oona's chimney.`),hint:null,need:()=>x1pR('c_salt')},
    loves:['frostberry'],hates:['fish'],
    deep:S(`My dad sails a boat with a red sail. When he comes home I'm going to play him the moth song. The whole thing. I practiced.`,`When Dad comes home, I'll play him the moth song.`),
    secret:{t:S(`I'm giving you my best shell. It's pink. It's MINE. Now it's yours. Don't lose it.`,`My best pink shell. Don't lose it!`),reward:{coins:40}},
    best:{t:S(`You're my best friend. Even more than the crab I found. Here's a drawing of you. You're a dragon AND a crab.`,`Best friend! A drawing of you as a crab dragon.`),reward:{bless:1}},
    chat:x1pChat(`Are dragons scared of anything?`,`Are dragons ever scared?`,
      [`Sure. Being scared is okay.`,`Sure. It's okay.`,`Okay. Then I'm a little scared of the big moths. That's okay.`,`Then I'm a bit scared of big moths. Okay.`,1],
      [`Nope! Not one thing!`,`Nope!`,`Not even CRABS? Wow.`,`Not even CRABS? Wow.`,0.5],
      [`Only of bath time.`,`Bath time.`,`ME TOO! Bath time is the WORST.`,`ME TOO! The WORST.`,1],'kind')},
  c_maudie:{bio:S('Innkeeper of the Gull’s Rest on the cliff top. SHOUTS, because of the wind. Rest here.','She runs the cliff inn. She SHOUTS.'),
    about:{tamsin:S(`THERE'S A BARD UP NORTH WRITING SONGS ABOUT YOU? I'D LISTEN! IF I COULD HEAR ANYTHING UP HERE!`,`A BARD SINGS ABOUT YOU? I CAN'T HEAR UP HERE!`),c_agatha:S(`AGATHA AT THE LIGHTHOUSE AND I WAVE LANTERNS AT EACH OTHER AT NIGHT! IT MEANS GOODNIGHT! OR HELP! WE NEVER DECIDED!`,`AGATHA AND I WAVE LANTERNS! IT MEANS GOODNIGHT! OR HELP!`)},
    rumor:{t:S(`SOMEONE KEEPS CLIMBING MY CHIMNEY AT NIGHT! I SAW A NOTE UP THERE! THE GULLS WANT IT!`,`SOMEONE LEFT A NOTE ON MY CHIMNEY!`),hint:'c_lm_note3',need:()=>x1pR('c_brass')},
    loves:['honey'],hates:['fish'],
    deep:S(`I CAME UP HERE FOR A QUIET LIFE! FORTY YEARS AGO! STILL WAITING! ...Sorry. It's very nice when the wind drops. Like now. Oh. It's back.`,`I CAME FOR A QUIET LIFE! STILL WAITING! Oh. Wind's back.`),
    secret:{t:S(`HERE! A SCARF THAT DOESN'T BLOW AWAY! I SEWED A ROCK INTO IT!`,`A SCARF WITH A ROCK IN IT!`),reward:{stamina:15}},
    best:{t:S(`YOU'RE MY FAVORITE GUEST! YOU DON'T STEAL CHIPS! FREE BEDS FOR LIFE!`,`MY FAVORITE GUEST! FREE BEDS!`),reward:{freeinn:true}},
    chat:x1pChat(`WHAT'S THE BEST VIEW YOU'VE EVER SEEN?`,`WHAT IS THE BEST VIEW?`,
      [`HOME, FROM A HILL!`,`HOME, FROM A HILL!`,`OH, THAT'S THE ONE! THAT'S ALWAYS THE ONE!`,`THAT'S THE ONE!`,1],
      [`THE WORLD FROM THE SKY!`,`FROM THE SKY!`,`YOU CAN FLY?! TAKE ME! NO, DON'T!`,`YOU FLY?! TAKE ME! NO!`,0.5],
      [`WHAT?`,`WHAT?`,`WHAT?! ...HA! VERY GOOD!`,`WHAT?! HA!`,0.5],'kind')},
  c_agatha:{bio:S('Keeper of the Spinning Lighthouse on Lantern Point. Gruff. Talks to her parrot, Captain Squawk, as an equal.','She keeps the lighthouse. Her parrot is Captain Squawk.'),
    about:{fennick:S(`A lamp-man up north named Fennick? If he knows lamps, he knows lonely. Tell him a lighthouse keeper says hello.`,`Tell Fennick up north a lighthouse keeper says hello.`),c_maudie:S(`Maudie on the cliff waves her lantern at me every night. I wave back. We have never agreed what it means.`,`Maudie and I wave lanterns. We don't know what it means.`)},
    rumor:{t:S(`There's a cabbage in my garden the size of a sheep. Squawk wants to call it Captain. I said no. It's a cabbage.`,`My cabbage is as big as a sheep. It's still a cabbage.`),hint:null},
    loves:['fish'],hates:['moonlily'],
    deep:S(`My father kept the light before me. On his last night he said, Agatha, the lamp isn't for the ships. It's for the people waiting for the ships. I didn't understand. I do now.`,`Dad said the lamp is for people waiting at home. Now I know.`),
    secret:{t:S(`A lens from the old lamp. Look through it in the dark and you'll see a little further.`,`An old lens. See further in the dark.`),reward:{reveal:true}},
    best:{t:S(`Squawk likes you. Squawk likes nobody. Take my father's oilskin cape. Keeps out the wind and the worst of everything.`,`Squawk likes you! Take my dad's cape.`),reward:{armor:0.06}},
    chat:x1pChat(`Squawk wants to know. Why do you keep helping people?`,`Why do you help people?`,
      [`Because someone helped me.`,`Someone helped me.`,`Hm. Good answer. Squawk agrees. Squawk, stop nodding.`,`Good answer. Squawk agrees.`,1],
      [`Because I can!`,`Because I can!`,`Hm. Simple. I like simple.`,`Simple. I like it.`,0.5],
      [`Squawk is very nosy.`,`Squawk is nosy.`,`He is. SQUAWK. Mind your own business.`,`He is! Mind your business, Squawk.`,0.5],'kind')},
  c_barley:{bio:S('The shepherd of the Chalk Downs. Talks about his sheep as if they had jobs.','The shepherd. His sheep have jobs.'),
    about:{hollis:S(`A farmer up north lost a goat called Duchess? I have a Duchess too. Duchess the Second. No relation. Probably.`,`I have a sheep named Duchess the Second. No relation. Probably.`),c_penny:S(`The Press girl comes up here for news. I tell her the sheep news. She never prints it. Gerald is very hurt.`,`Penny never prints my sheep news. Gerald is sad.`)},
    rumor:{t:S(`The Chalk Dragon on the hill used to shine white. Mother Pearl cut it for her mother, so she'd see it from the sky. It's gone grey now. Like me.`,`The Chalk Dragon on the hill went grey. Like me.`),hint:'c_lm_eye'},
    loves:['honey'],hates:['fish'],
    deep:S(`My wife used to walk the Chalk Dragon's line every spring, to keep it white. When she went, I tried. My knees said no. The dragon's been greying ever since.`,`My wife kept the Chalk Dragon white. My knees can't. It went grey.`),
    secret:{t:S(`A bell off my best ewe. Ring it and you'll feel calm as a field. Gerald will faint, but you'll feel calm.`,`A sheep bell. It calms you. Gerald faints.`),reward:{energy:15}},
    best:{t:S(`You're a good one, young dragon. The sheep think so too. Here. A whistle. Blow it and the world slows down a bit.`,`The sheep like you. A whistle for you.`),reward:{stamina:20}},
    chat:x1pChat(`Gerald wants to know. What's the best thing to do on a nice day?`,`What is best on a nice day?`,
      [`Sit with a friend.`,`Sit with a friend.`,`That's Gerald's answer too. He fainted when he heard you say it.`,`Gerald agrees. He fainted.`,1],
      [`Climb the biggest hill!`,`Climb a big hill!`,`The hill's right there. Mind the chalk. Gerald's fainted.`,`The hill is right there. Gerald fainted.`,0.5],
      [`Count sheep.`,`Count sheep.`,`I do that every day. I always get one more than I have. Gerald.`,`I always count one extra. Gerald.`,1],'kind')}
});
// first meetings and everyday greetings in each person's own voice (the stock ones say "Maren's kid" and mention wolves)
const X1P_FIRST={
  c_hester:S(`You are forty seconds late. I have been expecting you for forty seconds. Captain Hester Ticklebrass, the Clockwatch.`,`You are forty seconds late. I am Captain Hester.`),
  c_hettie:S(`Visitor! Oh, you're a DRAGON. Don't touch anything. Can I measure your tail? Later. Professor Hettie Sprocket. Inventor.`,`A dragon! I'm Professor Hettie. Can I measure your tail?`),
  c_ottoline:S(`Welcome to the Turning Library... WELCOME! Sorry. Sorry. Ottoline Inkwell, archivist. Welcome.`,`WELCOME! Sorry. I'm Ottoline. Welcome.`),
  c_whirligig:S(`Do you know who I AM? Lord Percival Whirligig. I'm on four coins. FOUR. Do dragons wipe their feet?`,`I am Lord Whirligig! On four coins! Wipe your feet.`),
  c_mo:S(`AHOY! A dragon on my docks! Harbormaster Mo Barnacle. Welcome to the finest harbor on the coast!`,`AHOY! I'm Harbormaster Mo! Welcome!`),
  c_ingrid:S(`A dragon in my smithy! Maren's child? Ja! I am Ingrid Anvilsong. I have heard SONGS about your mother.`,`Maren's child! Ja! I am Ingrid. Your mom is famous!`),
  c_fig:S(`Sit down, dearie, you look like you've been chasing something. I'm Auntie Fig. Everybody's auntie.`,`Sit down, dearie. I'm Auntie Fig.`),
  c_ambrose:S(`Eh? A visitor? Speak up. Ambrose Tickett. I keep the Great Clock. Tick.`,`Eh? I'm Ambrose. I keep the clock. Tick.`),
  c_penny:S(`HEADLINE: DRAGON KID TALKS TO PENNY PRESS. Any comment?`,`HEADLINE: DRAGON TALKS TO PENNY! Comment?`),
  c_ravel:S(`Welcome to Ravel's Remarkable Rarities! Everything is remarkable. Some of it is rare. I'm Madame Ravel.`,`Welcome to my shop! I'm Madame Ravel.`),
  c_jo:S(`Ahoy, lizard! Skipper Jo. Ever raced on water? Course you haven't, you've got feet.`,`Ahoy, lizard! I'm Skipper Jo. Can you race on water?`),
  c_bobs:S(`Halt! Who goes there? ...It's a lizard, Bob.`,`Halt! Who are you? ...A lizard, Bob.`),
  c_mina:S(`High tide, high tide... oh! A dragon. Hello. Sorry. I was counting. Mina Mudge, Tide Warden.`,`Oh! A dragon. Sorry. I'm Mina, the Tide Warden.`),
  c_charlie:S(`Welcome to the Chowder Pot! Chowder Charlie. Sit. Eat. You're all horns and no lunch.`,`Welcome! I'm Charlie. Eat something!`),
  c_dory:S(`Mind the nets. Mind the hooks. Dory Cockle. Who are you? Never mind. Mind the nets.`,`Mind the nets! I'm Dory.`),
  c_oona:S(`Come in, duck, come in. Shut the door, the wind's got opinions. I'm Oona. Granny Oona to everybody.`,`Come in, duck. Shut the door. I'm Granny Oona.`),
  c_tarbuckle:S(`In my day dragons were twice the size. You'll do, though. Captain Elias Tarbuckle. Old Tarbuckle, they say. Sit.`,`In my day dragons were bigger. I'm Old Tarbuckle.`),
  c_posy:S(`I'm Posy. This is my music box. You can listen but you can't hold it.`,`I'm Posy. You can't hold my music box.`),
  c_maudie:S(`WELCOME TO THE GULL'S REST! I'M MAUDIE! SORRY! WIND!`,`WELCOME! I'M MAUDIE! WIND!`),
  c_agatha:S(`A dragon? Hm. Smaller than I pictured. Agatha Brightwater. I keep the light. Or I did.`,`A dragon? Small. I'm Agatha. I keep the light.`),
  c_barley:S(`Evening. You'll be the dragon, then. The sheep said there'd be a dragon. Barley. Old Barley.`,`Hello. You're the dragon. The sheep said so. I'm Barley.`)
};
const X1P_HELLO={
  c_hester:[S(`On time. Good.`,`On time. Good.`),S(`Report.`,`Report!`),S(`Ash. Seven seconds early. Excellent.`,`Seven seconds early. Good.`)],
  c_hettie:[S(`Ash! Don't touch that. Hello!`,`Ash! Don't touch. Hello!`),S(`Oh good, a dragon. I need a light. For SCIENCE.`,`A dragon! I need a light. For science!`)],
  c_ottoline:[S(`Hello, Ash. HELLO. Sorry.`,`Hello. HELLO. Sorry.`),S(`Shh. Oh, it's you. Shh anyway.`,`Shh. Oh, it's you.`)],
  c_whirligig:[S(`Dragon. Hmph. Feet wiped?`,`Dragon. Feet wiped?`),S(`Ah. You. Good. I mean. Hmph.`,`Ah. You. Good. Hmph.`)],
  c_mo:[S(`AHOY, dragon!`,`AHOY!`),S(`Ash! Fair winds and fat fish!`,`Fair winds, Ash!`)],
  c_ingrid:[S(`Ja! Ash! Hammer, hammer, hello!`,`Ja! Hello, Ash!`),S(`Ash! Come, the forge is hot!`,`Ash! The forge is hot!`)],
  c_fig:[S(`Hello, dearie. Kettle's on.`,`Hello, dearie. Tea?`),S(`There's my favorite dragon. Sit, sit.`,`My favorite dragon! Sit.`)],
  c_ambrose:[S(`Eh? Ash? Tick.`,`Eh? Ash? Tick.`),S(`There you are. Tick. Tock.`,`There you are. Tick.`)],
  c_penny:[S(`HEADLINE: ASH IS BACK.`,`HEADLINE: ASH IS BACK!`),S(`Any news? I need news.`,`Any news? I need news!`)],
  c_ravel:[S(`Ah, my favorite customer!`,`My favorite customer!`),S(`Back for something remarkable?`,`Back for something good?`)],
  c_jo:[S(`Ahoy, lizard!`,`Ahoy, lizard!`),S(`Still got feet? Shame.`,`Still got feet? Shame.`)],
  c_bobs:[S(`Halt! Oh. It's Ash, Bob.`,`Halt! Oh, it's Ash.`),S(`Tick. Tock. Hello.`,`Tick. Tock. Hello.`)],
  c_mina:[S(`Hello! Seven waves. Sorry. Hello!`,`Hello! Sorry. Hello!`),S(`The tide says hello. Well. I do.`,`The tide says hi. Well, I do.`)],
  c_charlie:[S(`Hungry? You look hungry.`,`Hungry? You look hungry.`),S(`Ash! Chowder's on.`,`Ash! Chowder's ready.`)],
  c_dory:[S(`Ash. Mind the nets.`,`Ash. Mind the nets.`),S(`Hm. Hello.`,`Hm. Hello.`)],
  c_oona:[S(`Come in, duck.`,`Come in, duck.`),S(`There's my warm duck.`,`My warm duck!`)],
  c_tarbuckle:[S(`Ahoy, young'un.`,`Ahoy, young one.`),S(`In my day you'd say hello first. Hello.`,`Say hello first! Hello.`)],
  c_posy:[S(`Ash! Listen to my box!`,`Ash! Listen to my box!`),S(`Hi, dragon. Hi.`,`Hi, dragon!`)],
  c_maudie:[S(`ASH! WIND!`,`ASH! WIND!`),S(`HELLO! TEA? TEA!`,`HELLO! TEA?`)],
  c_agatha:[S(`Hm. You again.`,`Hm. You again.`),S(`Ash. Squawk says hello. Squawk, say hello.`,`Squawk says hello.`)],
  c_barley:[S(`Evening, young dragon.`,`Hello, young dragon.`),S(`Gerald says hello. Then he fainted.`,`Gerald says hi. He fainted.`)]
};
const X1P_NIGHT=[S(`Late for walking, Ash. The moths are out.`,`It's late. The moths are out.`),S(`Mind the lamps. The moths love them.`,`Moths love the lamps.`),S(`Can't sleep either? Me neither.`,`Can't sleep? Me neither.`)];
{ const base=greetLine; greetLine=function(id){
  if(!X1P_FIRST[id]) return base(id);
  if(!(G.seenTalk&&G.seenTalk['met_'+id])) return X1P_FIRST[id];
  const dg=deedGreet(id); if(dg) return dg;
  const f=friendOf(id);
  if(f>=5) return pick([S(`Ash! My favorite person on the coast!`,`Ash! My favorite!`),S(`There's my best friend.`,`My best friend!`)]);
  if(isNight()&&id!=='c_maudie'&&Math.random()<0.4) return pick(X1P_NIGHT);
  return pick(X1P_HELLO[id]||[S(`Hello, Ash.`,`Hello, Ash.`)]);
}; }
// "What's new?" lines that follow the story and the player's choices (every third time)
{ const base=moodLine; moodLine=function(id){
  const F=G.flags, Q=x1pQ;
  if(id==='c_hester'&&G.choices.fennick==='jail') return S(`Captain Osric writes that his lamps have never been so shiny. He has a prisoner who polishes.`,`Osric's lamps are shiny. A prisoner polishes them.`);
  if(id==='c_mo'&&F.ev_fish) return S(`You beat my sister Bess? She wrote and said it was luck. In capital letters. Three pages.`,`You beat my sister Bess? She says it was luck!`);
  if(id==='c_ingrid'&&(F.a1_bram||(G.weapons&&G.weapons.thunder))) return S(`A Warden's hammer! May I hold it? ...I may not hold it. I understand. I would not let me hold it either.`,`A Warden's hammer! Can I hold it? No? Fair.`);
  if(id==='c_oona'&&Q('c_oona')) return S(`The stove's been going all week. My Vesper sat by it on Tuesday. Didn't say a word. Didn't have to.`,`My stove is warm. Vesper sat by it. Lovely.`);
  if(id==='c_whirligig'&&F.c_gifts==='truth') return S(`I've sent the fishing girl a clock. A small one. With a little bird. She named the bird after me. Percy.`,`I sent Posy a clock. She named the bird Percy!`);
  if(id==='c_posy'&&(F.c_gifts==='kept'||F.c_gifts==='truth'||F.c_gifts==='bought')) return S(`I play the moth song every night. Mom says I'm getting better. Mom is lying. I don't care.`,`I play my box every night. I'm getting better!`);
  if(id==='c_jo'&&F.c_regatta_won) return S(`I'm training. Next year I'm beating you. On FEET. I'm practicing skipping. I keep falling in.`,`Next year I'll beat you. I'm practicing skipping.`);
  if(id==='c_bobs'&&Q('c_bob')) return S(`All three of us! Bob, Bob, and Bob. It's very confusing for everyone. We love it.`,`All three Bobs! Very confusing. We love it.`);
  if(id==='c_hettie'&&Q('c_bolt')) return S(`Bolt sneezed once this morning. ONCE. A record. Science!`,`Bolt only sneezed once today! A record!`);
  if(id==='c_barley'&&Q('c_chalk')) return S(`She's white again. The Chalk Dragon. I sit here and look at her every evening. So does Gerald, when he's awake.`,`The Chalk Dragon is white again. I look at her every night.`);
  if(id==='c_tarbuckle'&&Q('c_whip')) return S(`The Rockpools are quiet at night now. No clanking. I miss it, a bit. Don't tell him.`,`No more clanking at night. I miss it a bit.`);
  if(id==='c_ottoline'&&F.c_pages_given) return S(`${F.c_pages_given} of Pearl's six pages, back on the shelf. Wren is beside herself. By post.`,`Pearl's pages are coming home!`);
  if(F.c_snow&&x1pCoastId(id)) return S(`Snow! In summer! Nobody on this coast has ever seen snow. The gulls are furious.`,`Snow in summer! The gulls are cross.`);
  if(F.c_clock_on&&x1pCoastId(id)&&Math.random()<0.5) return S(`The clocks are ticking again. I keep checking mine just to hear it.`,`The clocks tick again! I love the sound.`);
  return base(id);
}; }
// ---------- what the coast says out loud. The stock Embermere barks, chats and deed greetings (kobolds, Lake Mirrow,
// Pell's socks, "Maren's kid") stay in Embermere mouths; a short list of universal ones (Pip, rain, the night, weapons)
// still works everywhere.
{ const OKB={pip1:1,pip2:1,pip3:1,pip4:1,duC2:1,duC3:1,brC2:1,grC1:1,grC2:1,grC3:1,rain1:1,rain2:1,rain3:1,rain4:1,night3:1,night4:1,low1:1,low2:1,dag1:1,boom1:1,bow1:1,bow2:1,lvl2:1};
  const OKC={pip:1,rain:1,night:1,wings:1,whisper:1,breath:1,mip:1,goat:1,hat:1,duch:1,wolf:1,brisk:1,map:1};
  const notCoast=f=>n=>f(n)&&!X1P_COAST.includes(n.town);
  for(const b of BARKS) if(!OKB[b.k]&&!String(b.k).startsWith('c_')) b.w=notCoast(b.w);
  for(const c of CHATS) if(!OKC[c.k]&&!String(c.k).startsWith('c_')){ c.a=notCoast(c.a); c.b=notCoast(c.b); }
  for(const k in DGREET) for(const e of DGREET[k]) if(!k.includes('@')) e[0]=e[0]+'|'+X1P_NOTCOAST; }
const X1P_GH='town:c_gearhaven', X1P_SM='town:c_saltmarsh';
const x1pPre=()=>!G.flags.c_clock_on, x1pTicks=()=>!!G.flags.c_clock_on;
// personal barks
B('c_hes1','id:c_hester',ALWAYS,S(`Forty seconds. Thirty-nine. Thirty-eight. I count when I'm nervous.`,`Forty. Thirty-nine. I count when I'm nervous.`));
B('c_hes2','id:c_hester',x1pPre,S(`One minute to midnight, all day long. I am losing my mind, very precisely.`,`One minute to midnight, all day. Ugh.`));
B('c_het1','id:c_hettie',ALWAYS,S(`If you hear a bang, that was the toaster. Probably.`,`A bang? That's the toaster.`));
B('c_het2','id:c_hettie',()=>!x1pQ('c_bolt'),S(`Bolt? Boooolt? Here, boy! ...He's not here, is he.`,`Bolt? Here, boy! ...Not here.`));
B('c_ott1','id:c_ottoline',ALWAYS,S(`shhh... SHHHH! ...sorry.`,`shhh... SHHH! Sorry.`));
B('c_whi1','id:c_whirligig',ALWAYS,S(`*checks his pocket watch* Still stopped. *checks again* Still stopped.`,`*checks his watch* Still stopped.`));
B('c_whi2','id:c_whirligig',x1pTicks,S(`Listen to them! Four hundred clocks, all ticking. I may sing. I won't. I might.`,`My clocks tick again! I might sing.`));
B('c_mo1','id:c_mo',ALWAYS,S(`*blows a bubble* Lovely day for it. For what? For it.`,`*blows a bubble* Lovely day.`));
B('c_mo2','id:c_mo',x1pPre,S(`Barnacles! The harbor chain's stuck again!`,`Barnacles! The chain is stuck!`));
B('c_ing1','id:c_ingrid',ALWAYS,S(`Hammer, hammer, DING!`,`Hammer, hammer, DING!`));
B('c_ing2','id:c_ingrid',()=>G.iron>0,S(`You have star-iron! I can smell it! Bring it here, ja!`,`I smell star-iron! Bring it here!`));
B('c_fig1','id:c_fig',ALWAYS,S(`Kettle's on, dearie. It's always on.`,`Kettle's on, dearie.`));
B('c_amb1','id:c_ambrose',ALWAYS,S(`Tick. ...Tick. ...Eh? Was that me?`,`Tick. Was that me?`));
B('c_pen1','id:c_penny',ALWAYS,S(`EXTRA! EXTRA! GULL STEALS CHIPS! AGAIN!`,`EXTRA! GULL STEALS CHIPS!`));
B('c_pen2','id:c_penny',()=>!x1pR('c_brass'),S(`EXTRA! MOTH MASK SEEN ON ROOFTOPS! DRAGON IN TOWN! THESE THINGS MAY BE CONNECTED!`,`EXTRA! MOTH MASK AND A DRAGON!`));
B('c_rav1','id:c_ravel',ALWAYS,S(`Remarkable rarities! Rarely remarkable! I mean the other way round!`,`Remarkable things for sale!`));
B('c_jo1','id:c_jo',ALWAYS,S(`Race you to the pier! ...Oh, right. Feet.`,`Race you! Oh. Feet.`));
B('c_bob1','id:c_bobs',ALWAYS,S(`Tick. Tock. All quiet, Bob. All quiet, Bob.`,`Tick. Tock. All quiet.`));
B('c_bob2','id:c_bobs',()=>!x1pQ('c_bob'),S(`We miss Bob. We do not talk about Bob. We miss him.`,`We miss Bob.`));
B('c_min1','id:c_mina',ALWAYS,S(`Thirty-one, thirty-two... sorry. Waves.`,`Thirty-one... sorry. Waves.`));
B('c_min2','id:c_mina',()=>!G.flags.c_lowtide,S(`High tide. Still. Again. Forever.`,`Still high tide. Forever.`));
B('c_cha1','id:c_charlie',ALWAYS,S(`Chowder! Get your chowder! Hugged soup!`,`Chowder! Hugged soup!`));
B('c_dor1','id:c_dory',ALWAYS,S(`Mind the nets.`,`Mind the nets.`));
B('c_oon1','id:c_oona',ALWAYS,S(`Brrr. Shut the door, duck.`,`Brrr. Shut the door.`));
B('c_tar1','id:c_tarbuckle',ALWAYS,S(`In my day the gulls were the size of cows. Nicer, though.`,`In my day gulls were as big as cows!`));
B('c_pos1','id:c_posy',ALWAYS,S(`*winds her music box* Listen! Shh! LISTEN!`,`Listen to my box! Shh!`));
B('c_mau1','id:c_maudie',ALWAYS,S(`WIND!`,`WIND!`));
B('c_mau2','id:c_maudie',ALWAYS,S(`HOLD ON TO YOUR CHIPS!`,`HOLD YOUR CHIPS!`));
B('c_aga1','id:c_agatha',ALWAYS,S(`Squawk. Stop it. Squawk. ...He's doing my voice again.`,`Squawk. Stop it. He's copying me.`));
B('c_bar1','id:c_barley',ALWAYS,S(`Easy, Gerald. Easy. ...He's fainted.`,`Easy, Gerald. ...He fainted.`));
// town barks: the stopped clocks, the stuck tide, the Moth Mask, and later the snow and the bitten moon
B('c_gh1',X1P_GH+'|!id:c_hester',x1pPre,S(`Is it lunch? Nobody knows when lunch is anymore.`,`Is it lunch? Nobody knows!`));
B('c_gh2',X1P_GH,x1pPre,S(`One minute to midnight. At breakfast. It's very confusing.`,`Midnight at breakfast? Odd.`));
B('c_gh3',X1P_GH,x1pTicks,S(`Tick, tock! I'd forgotten how much I like that sound.`,`Tick, tock! I missed that.`),{d:'c_clock'});
B('c_gh4',X1P_GH,()=>!x1pR('c_brass'),S(`The Moth Mask? She's a menace. She's a legend. She fixed my roof. She's a menace.`,`The Moth Mask fixed my roof. She's a menace!`));
B('c_gh5',X1P_GH,()=>isNight(),S(`Never seen so many moths. They are eating my curtains. And my CLOCKS.`,`So many moths! They eat my curtains!`));
B('c_gh6',X1P_GH,()=>isNight(),S(`Forty moths on my lamp last night. Forty! I counted. Then I screamed.`,`Forty moths on my lamp!`));
B('c_gh7',X1P_GH+'|kid',()=>x1pR('c_light')&&!G.flags.c_snow,S(`Did you see the lighthouse beam? There's a black tower out at sea! It wasn't there yesterday!`,`There's a black tower out at sea!`));
B('c_sm1',X1P_SM,()=>!G.flags.c_lowtide&&x1pR('c_salt'),S(`Three days of high tide. The fish are getting cheeky.`,`High tide for days! Cheeky fish.`));
B('c_sm2',X1P_SM,()=>!!G.flags.c_lowtide,S(`Low tide at last! Mina's been dancing on the boardwalk.`,`Low tide! Mina is dancing.`),{d:'c_tide'});
B('c_sm3',X1P_SM+'|!id:c_oona',ALWAYS,S(`Somebody left roof tiles on my step again. Nobody saw who. Nobody ever does.`,`Someone left roof tiles on my step. Nobody saw who.`));
B('c_sm4',X1P_SM,()=>x1pQ('c_oona'),S(`Granny Oona's chimney is smoking! First time in twenty years! The gulls don't know what to do.`,`Granny Oona's chimney is smoking!`),{d:'q_c_oona'});
B('c_cst1',X1P_CT,()=>!!G.flags.c_snow,S(`Snow! In summer! I've put my winter hat on my summer hat.`,`Snow in summer! Two hats!`),{d:'c_snowfall'});
B('c_cst2',X1P_CT+'|kid',()=>(G.flags.moon==null?100:G.flags.moon)<100,S(`Somebody took a BITE out of the moon! Was it you?`,`Who bit the moon? Was it you?`));
B('c_cst3',X1P_CT,()=>hasAbil('claws'),S(`I saw you go straight up a wall! Like a lizard! A big brave lizard!`,`You climbed a wall! Like a lizard!`),{d:'trial_claws'});
B('c_cst4',X1P_CT,()=>hasAbil('grapple'),S(`Your tail's a rope? Your TAIL is a ROPE?`,`Your tail is a rope?`),{d:'trial_grapple'});
B('c_cst5',X1P_CT,()=>!!(G.weapons&&G.weapons.whip)&&G.weapon==='whip',S(`Mind that chain! Is that old Saltbeard's? It still smells of sea.`,`Mind that chain! It smells of the sea.`),{d:'wpn_whip'});
B('c_cst6',X1P_CT,()=>G.comp==='c_bolt'&&compNear('c_bolt'),S(`Bolt! Who's a shiny boy? Who's a shiny sneezy boy?`,`Bolt! Who's a shiny boy?`),{r:['c_bolt',S(`Bark! (whirr) ACHOO.`,`Bark! ACHOO.`)]});
B('c_cst7',X1P_CT,()=>!!G.flags.act1_done,S(`You're the dragon from up north! The one who beat the mountain! Word travels. Mostly by gull.`,`You beat the mountain up north! We heard.`),{d:'done'});
// two people talking
VCH('c_ch1','id:c_hester','id:c_bobs',ALWAYS,[[0,S(`Report, Bob.`,`Report, Bob.`)],[1,S(`All quiet, Captain. Except Bob.`,`All quiet. Except Bob.`)],[0,S(`Which Bob?`,`Which Bob?`)],[1,S(`...Yes, Captain.`,`Yes, Captain.`)]]);
VCH('c_ch2','id:c_hettie','id:c_ingrid',ALWAYS,[[0,S(`Ingrid! I need a gear the size of a hat.`,`I need a gear as big as a hat!`)],[1,S(`Why?`,`Why?`)],[0,S(`For a hat.`,`For a hat.`)],[1,S(`...Ja. Fair.`,`Ja. Fair.`)]]);
VCH('c_ch3','id:c_whirligig','id:c_penny',ALWAYS,[[1,S(`Lord Whirligig! Any comment on the Moth Mask?`,`Any comment on the Moth Mask?`)],[0,S(`NO comment.`,`NO comment.`)],[1,S(`HEADLINE: LORD SAYS NO COMMENT.`,`HEADLINE: NO COMMENT!`)],[0,S(`Don't print that! ...Is that my name in big letters? Print that.`,`Don't print that! ...Big letters? Print it.`)]]);
VCH('c_ch4','id:c_mo','id:c_jo',ALWAYS,[[1,S(`Mo, can I take the Biscuit out?`,`Can I take my boat out?`)],[0,S(`No ships sail, Jo.`,`No boats, Jo.`)],[1,S(`It's a SKIFF.`,`It's a SKIFF.`)],[0,S(`No skiffs sail either. Barnacles.`,`No skiffs either. Barnacles.`)]]);
VCH('c_ch5','id:c_fig','any',()=>x1pR('c_gear'),[[0,S(`More tea, dearie?`,`More tea?`)],[1,S(`I've had six cups.`,`I've had six cups.`)],[0,S(`So that's a yes.`,`So, yes.`)]]);
VCH('c_ch6','id:c_ravel','id:c_whirligig',ALWAYS,[[0,S(`A genuine sea-dragon scale, my lord!`,`A real sea-dragon scale!`)],[1,S(`That is a crisp.`,`That is a crisp.`)],[0,S(`A sea-dragon crisp. Very rare.`,`A sea-dragon crisp. Rare!`)]]);
VCH('c_ch7','id:c_mina','id:c_dory',()=>!G.flags.c_lowtide,[[0,S(`Still high tide.`,`Still high tide.`)],[1,S(`I can see that.`,`I can see.`)],[0,S(`I know. I just like saying it. It helps.`,`I just like saying it.`)]]);
VCH('c_ch8','id:c_charlie','id:c_tarbuckle',ALWAYS,[[1,S(`In my day chowder had a proper bite.`,`In my day chowder bit back.`)],[0,S(`That was the eels, Elias.`,`That was the eels.`)],[1,S(`...and THAT'S why I don't eat eels.`,`And THAT'S why I don't eat eels.`)]]);
VCH('c_ch9','id:c_posy','id:c_dory',ALWAYS,[[0,S(`Mom, can dragons swim?`,`Mom, can dragons swim?`)],[1,S(`Ask the dragon.`,`Ask the dragon.`)],[0,S(`I'm SHY.`,`I'm SHY.`)]]);
VCH('c_ch10',X1P_GH,X1P_GH,x1pPre,[[0,S(`What time is it?`,`What time is it?`)],[1,S(`One minute to midnight.`,`One minute to midnight.`)],[0,S(`It's the middle of the afternoon!`,`It's the afternoon!`)],[1,S(`Tell the clock.`,`Tell the clock.`)]]);
VCH('c_ch11',X1P_SM,X1P_SM,ALWAYS,[[0,S(`Did you leave a goose on my step?`,`Did you leave me a goose?`)],[1,S(`No. Did you?`,`No. Did you?`)],[0,S(`...The Moth Mask, then.`,`The Moth Mask, then.`)],[1,S(`Bless her.`,`Bless her.`)]]);
VCH('c_ch12',X1P_GH,X1P_GH,()=>!!G.flags.c_snow,[[0,S(`Snow in June.`,`Snow in June.`)],[1,S(`The gulls are wearing it like hats.`,`The gulls wear it like hats.`)],[0,S(`So am I.`,`So am I.`)]]);
VCH('c_ch13','id:c_bobs','id:c_bob3',ALWAYS,[[0,S(`Bob!`,`Bob!`)],[1,S(`Bob!`,`Bob!`)],[0,S(`...We just like saying it.`,`We just like saying it.`)]]);
// greetings that react to what Ash did, up north and on the coast
Object.assign(DGREET,{
  'done@c_ingrid':[['any',S(`Maren's child beat a whole mountain of dragon! I will write a song. Ja. It will be short.`,`You beat a dragon mountain! I'll write a song!`)]],
  'done@c_penny':[['any',S(`HEADLINE: DRAGON WHO BEAT A MOUNTAIN WALKS INTO MY NEWSSTAND. Is it true? Say it's true.`,`HEADLINE: MOUNTAIN DRAGON HERE! Is it true?`)]],
  'pip@c_hettie':[['any',S(`Is that a baby DRAGON on your head? May I measure him? Gently? He bit my ruler. Fair.`,`A baby dragon! Can I measure him? He bit my ruler.`)]],
  'pip@c_oona':[['any',S(`Oh, look at the little one. Warm as a teapot. Come here, little duck.`,`Look at the little one! Warm as a teapot.`)]],
  'trial_wings@c_maudie':[['any',S(`I SAW YOU FLY PAST MY WINDOW! I DROPPED A WHOLE TRAY!`,`YOU FLEW PAST MY WINDOW!`)]],
  'q_duchess@c_barley':[['any',S(`You found a goat called Duchess, up north? I've a Duchess too. Duchess the Second. She says hello. Well. She chews.`,`You found Duchess? I have Duchess the Second!`)]],
  'ch_fennick_forgive@c_agatha':[['any',S(`I hear you gave a lamp-man a second chance. Good. Lamps deserve second chances. So do people.`,`You gave a lamp-man a second chance. Good.`)]],
  trial_claws:[[X1P_CT,S(`You climbed the Great Clock? On the OUTSIDE? Ambrose is telling everyone. Tick.`,`You climbed the Great Clock? Wow!`)]],
  'trial_claws@c_ambrose':[['any',S(`Eh? You climbed her? On the outside? Nobody's done that since the girl. Tick.`,`You climbed my clock? Like the girl did. Tick.`)]],
  trial_grapple:[[X1P_CT,S(`Is it true your tail is a rope now? Can I see? From over here?`,`Your tail is a rope? Show me!`)]],
  'trial_grapple@c_hettie':[['any',S(`Pearl's hook! In your TAIL! I need to sit down. I need to take notes. I need both.`,`Pearl's hook in your tail! I need notes!`)]],
  trial_shadow:[[X1P_CT,S(`You went all shadowy! Penny saw it! She says it's the scoop of the year.`,`You turned into a shadow!`)]],
  wpn_whip:[[X1P_CT,S(`Is that Saltbeard's anchor chain? As a WHIP? Old Tarbuckle must be thrilled.`,`Saltbeard's chain is a whip now!`)]],
  'wpn_whip@c_ingrid':[['any',S(`How is my chain whip? Is it cracking? Is it singing? Not literally. Ja?`,`How is the whip? Is it cracking? Ja?`)]],
  c_clock:[[X1P_GH,S(`You restarted the Great Clock! I had lunch at the right time today! I cried!`,`You fixed the clock! Lunch on time! I cried!`)]],
  'c_clock@c_whirligig':[['any',S(`My clocks. All four hundred. Ticking. Dragon, I... hmph. Thank you. Wipe your feet.`,`My clocks tick! Hmph. Thank you.`)]],
  'c_clock@c_ambrose':[['any',S(`Tick. Tock. TICK. TOCK. Oh, young dragon. Listen to her.`,`Tick. Tock. Listen to her!`)]],
  c_tide:[[X1P_SM,S(`Low tide at last! The fish are sulking. We're delighted.`,`Low tide! The fish sulk. We cheer.`)]],
  'c_tide@c_mina':[['any',S(`LOW. TIDE. I've counted every wave going out. All of them. Sorry. Thank you.`,`LOW TIDE! I counted every wave. Thank you!`)]],
  c_snowfall:[[X1P_CT,S(`It's snowing! In summer! Is this your doing, dragon? No? Then whose?`,`Snow in summer! Whose doing is that?`)]],
  q_c_oona:[[X1P_SM,S(`You lit Granny Oona's stove! The whole boardwalk smells of toast!`,`You lit Granny Oona's stove!`)]],
  q_c_regatta:[[X1P_GH,S(`You beat Skipper Jo! Nobody beats Skipper Jo! She's still checking the rules.`,`You beat Skipper Jo! Nobody does that!`)]],
  q_c_chalk:[[X1P_CT,S(`The Chalk Dragon's white again! You can see it from the harbor!`,`The Chalk Dragon is white again!`)]],
  q_c_bob:[[X1P_GH,S(`Three Bobs! It's like a cutlery drawer on legs!`,`Three Bobs! Like a cutlery drawer!`)]],
  q_c_bolt:[[X1P_GH,S(`Bolt's home! He chased my hat for an hour. Lovely dog.`,`Bolt is home! He chased my hat.`)]],
  q_c_whip:[[X1P_SM,S(`No more clanking on the Rockpools at night. Old Tarbuckle's been smiling. It's unsettling.`,`No more clanking at night! Tarbuckle smiles now.`)]],
  q_c_gifts:[[X1P_SM,S(`Posy hasn't stopped playing that music box. We're all humming it now. Even the gulls.`,`We all hum Posy's tune now. Even gulls.`)]],
  boss_c_saltbeard:[[X1P_CT,S(`You fought a GHOST? On the Rockpools? At NIGHT? I'd have stayed in bed.`,`You fought a ghost? At night? Wow.`)]]
});
{ const base=syncDeeds; syncDeeds=function(){ base(); try{ if(G&&G.mode==='story'){ const F=G.flags; if(F.c_clock_on) deed('c_clock'); if(F.c_lowtide) deed('c_tide'); if(F.c_snow) deed('c_snowfall'); if(F.c_spire_up) deed('c_spireup'); } }catch(e){} }; }
Object.assign(DEED_PRI,{c_clock:8,c_tide:6,c_snowfall:8,c_spireup:7,trial_claws:7,trial_grapple:7,trial_shadow:7,wpn_whip:5});
// ---------- shops, the smith and the inns (prices about twice Act I's, BALANCE.md 8)
SHOPTALK.c_ravel=()=>runShop('c_ravel',S(`Ravel's Remarkable Rarities! Everything is remarkable. Some of it is rare.`,`Ravel's shop! Everything is special.`),[
  [S('Refill your healing draughts (brewed by a mermaid. Merv.)','Refill your draughts'),12,()=>{ player.potions=player.potionsMax; setBanner(S('Draughts refilled','Draughts full'),S('Merv says hello.','Merv says hi.'),1.6); },()=>player.potions<player.potionsMax||S('Your flasks are already full.','Your flasks are full.')],
  [S('A Pip treat (made from the dreams of tiny dragons. And oats.)','A Pip treat'),40,()=>{ G.pipTreats=(G.pipTreats||0)+1; setBanner(S('Pip treat','Pip treat'),S('Mip! Mip! MIP!','Mip! Mip!'),1.6); },()=>G.flags.pip?((G.pipTreats||0)<3||S('Pip is too full. Mip.','Pip is full.')):S('You don’t have a dragon to feed.','No dragon to feed.')],
  [S('Lantern oil (a cave lantern, already filled)','Lantern oil (a cave lantern)'),30,()=>{ G.items.lantern=1; setBanner(S('Cave lantern','Cave lantern'),S('Caves will be a lot less scary.','Caves are less scary now.'),1.8); },()=>!G.items.lantern||S('Your lantern is already full.','Your lantern is full.')],
  [S('A treasure map (or a map of where a dog sneezed)','A treasure map'),60,()=>{ giveItems({c_map:1},true); setBanner(S('Ravel’s treasure map','Treasure map'),S('Three X marks: the Downs, the Rockpools and Lantern Point. Dig where X marks the spot.','Three X marks. Dig there!'),3); },()=>!G.items.c_map&&!G.found.c_lm_x1||S('You already have it. The dog only sneezed once.','You have it already.')],
  [S('An Ember Charm (a blessing)','An Ember Charm (a blessing)'),140,()=>{ G.stats.charms=(G.stats.charms||0)+1; G.pendingBless++; later(0.6,offerPending); },()=>(G.stats.charms||0)<5||S('Sold out of charms. Come back never.','No more charms.')]
]);
function x1pReforge(){ runDialogue([x1pL('c_ingrid',`Star-iron! JA! Give it here. Hammer, hammer, DING!`,`Star-iron! Ja! Hammer, hammer, DING!`),x1pN(`Sparks fly. Ingrid sings a very short song, very loudly, and hands your blade back. It hums.`,`Sparks fly. Ingrid sings. Your blade hums.`)],()=>{ scene='play'; reforgeIron(); saveGame(); }); }
SHOPTALK.c_ingrid=()=>runShop('c_ingrid',S(`The Bright Anvil! Ja! What do you need?`,`The Bright Anvil! Ja!`),[
  [S('Reforge your blade with your star-iron','Reforge with star-iron'),0,()=>later(0.05,x1pReforge),()=>G.iron>0||S('You have no star-iron. Bring me some, ja?','No star-iron. Bring some!')],
  [S('Warm your claws at the forge (full heal)','Warm up at the forge (heal)'),6,()=>{ player.hp=player.maxHp; setBanner(S('Toasty','Toasty'),S('Your scales glow like a horseshoe.','You feel warm.'),1.6); },()=>player.hp<player.maxHp||S('You are already toasty, ja.','You are already warm.')],
  [S('A smith’s whetstone (a blessing)','A whetstone (a blessing)'),160,()=>{ G.flags.c_whet=(G.flags.c_whet|0)+1; G.pendingBless++; later(0.6,offerPending); },()=>(G.flags.c_whet|0)<2||S('Two is enough. Three would be showing off.','Two is enough.')]
]);
const X1P_INN={
  c_fig:()=>runShop('c_fig',S(`The Steaming Teapot, dearie. Tea, cake, and soft beds.`,`Tea, cake and beds, dearie.`),[
    [S('Rent a bed for the night','Rent a bed'),G.flags.perk_freeinn?0:10,()=>{ innRest(); }],
    [S('A pot of tea and a slice of cake (heal)','Tea and cake (heal)'),6,()=>{ player.hp=Math.min(player.maxHp,player.hp+player.maxHp*0.6); setBanner(S('Tea and cake','Tea and cake'),S('Tea fixes most things.','Tea fixes things.'),1.6); }]]),
  c_charlie:()=>runShop('c_charlie',S(`The Chowder Pot! Chowder, beds, and more chowder.`,`Chowder and beds!`),[
    [S('Rent a bed for the night','Rent a bed'),G.flags.perk_freeinn?0:10,()=>{ innRest(); }],
    [S('A bowl of chowder (full heal)','Chowder (full heal)'),12,()=>{ player.hp=player.maxHp; setBanner(S('Chowder','Chowder'),S('Soup that has been hugged.','Hugged soup!'),1.6); }]]),
  c_maudie:()=>runShop('c_maudie',S(`THE GULL'S REST! BEDS! TEA! WIND!`,`BEDS! TEA! WIND!`),[
    [S('Rent a bed for the night','Rent a bed'),G.flags.perk_freeinn?0:10,()=>{ innRest(); }],
    [S('A cup of tea, held very tight (heal)','Tea (heal)'),6,()=>{ player.hp=Math.min(player.maxHp,player.hp+player.maxHp*0.5); setBanner(S('Tea','Tea'),S('MIND THE GULLS!','MIND THE GULLS!'),1.6); }]])
};
// extra options in the talk menu of coast people (the inns, waiting for dark, quest topics)
{ const base=compTalkOpts; compTalkOpts=function(id,n){
  const o=base(id,n); if(!n||!G||G.mode!=='story') return o;
  try{
    if(X1P_INN[id]) o.unshift({t:S('A bed, or something warm?','A bed, or something warm?'),tag:'shop',fn:()=>X1P_INN[id](),end:true});
    const dark=(id==='c_fig'&&x1pAt('c_gifts',2))||(id==='c_tarbuckle'&&x1pAt('c_whip',3))||(id==='c_maudie'&&x1pAt('c_notes',1));
    if(dark&&!isNight()) o.push({t:S('Can I wait here until dark?','Can I wait for dark?'),fn:()=>later(0.1,()=>x1pWaitDark()),end:true,then:[[id,id==='c_tarbuckle'?S(`Sit, sit. I'll tell you about the time I wrestled an octopus. It took all day. So will this.`,`Sit. I'll tell you about an octopus.`):S(`Of course, dearie. Put your feet up.`,`Of course. Put your feet up.`)]]});
    if(id==='c_jo'&&!G.quests.c_regatta&&x1pR('c_brass')&&!hasAbil('skimmer')) o.push({t:S('Can I race in the regatta?','Can I race?'),then:[['c_jo',S(`You walk on water but you can't SKIP? Come back when you can, landlubber.`,`You can't skip on water? Come back when you can!`)]],back:true});
    if(id==='c_ottoline'&&G.items.c_diary&&!G.flags.c_diary_sent) o.push({t:S('Can you read this dream diary?','Can you read this diary?'),tag:'quest',fn:()=>{ G.flags.c_diary_sent=true; },then:[['c_ottoline',S(`Moon letters in the margins. I can't read them. But I know somebody who can, and she'll be insufferable about it. I'll send a copy to Wren.`,`Moon letters! I can't read them. Wren can. I'll send her a copy.`)]],back:true});
    if(id==='c_whirligig'&&G.flags.c_gifts==='taken'&&x1pQ('c_gifts')) o.push({t:S('Can I buy the music box back for Posy? (100 coins)','Buy the music box for Posy (100 coins)'),tag:'quest',fn:()=>{ if((G.coins||0)<100){ setBanner(S('Not enough coins.','Not enough coins.'),'',1.6); return; } G.coins-=100; G.flags.c_gifts='bought'; x1pTrust(1); giveItems({c_musicbox:1}); },then:()=>(G.flags.c_gifts==='bought'?[['c_whirligig',S(`You'll BUY it? For a fishing girl? ...Well, I never. Take it. Take it to the child. Hmph.`,`For the fishing girl? Well! Take it to her. Hmph.`)]]:[['c_whirligig',S(`Come back with the coins, dragon.`,`Come back with coins.`)]]),back:true});
    if(id==='c_posy'&&G.flags.c_gifts==='bought'&&G.items.c_musicbox) o.push({t:S('Here. Your music box. It’s yours.','Here is your music box.'),tag:'gift',fn:()=>{ takeItems({c_musicbox:1}); G.flags.c_box_home=true; },then:[['c_posy',S(`MY BOX! You're a GOOD dragon. The best dragon. Listen! LISTEN!`,`MY BOX! You're a GOOD dragon!`)],x1pN(`The moth song tinkles out over the boardwalk. Dory turns away to mend a net that doesn't need mending.`,`The moth song plays. Dory smiles.`)],back:true});
    if(id==='c_penny'&&G.flags.c_box_home&&!G.flags.c_penny_kind){ o.push({t:S('Posy has her music box back.','Posy has her box back.'),fn:()=>{ G.flags.c_penny_kind=true; },then:[['c_penny',S(`HEADLINE: DRAGON BUYS BACK MUSIC BOX. CHILD HAPPY. LORD... ALSO HAPPY? I'm not printing her name. Some stories are better kept.`,`HEADLINE: CHILD HAPPY! I won't print her name.`)]],back:true}); }
    if(id==='c_oona'&&G.flags.dr_c_twins&&!G.seenTalk.c_oona_twins) o.push({t:S('I had a dream about Pearl. In a basket.','I dreamed of Pearl in a basket.'),key:'c_oona_twins',then:[['c_oona',S(`You dreamed about Pearl? In a basket? Oh, duck. That's our family story. How did you know about the curtains?`,`You dreamed of Pearl? That's our story! How did you know?`)]],back:true});
  }catch(e){ console.error(e); }
  return o; }; }
// the smith shows a gold ! while Ash carries star-iron (Maren's job, on the coast)
{ const base=storyMarker; storyMarker=function(id){ if(base(id)) return true; return id==='c_ingrid'&&G&&G.iron>0&&actOf(G.stage)===2; }; }
// Dell and the Soggy Biscuit Two (Act I `lure`): a ferry between the Saltmarsh jetty, the Gearhaven quay and Lantern Point
const X1P_FERRY={jetty:{x:1460,y:27470,n:S('the Saltmarsh jetty','the Saltmarsh jetty')},quay:{x:7400,y:26560,n:S('the Gearhaven quay','the Gearhaven quay')},point:{x:11000,y:28760,n:S('the Lantern Point beach','the Lantern Point beach')}};
function x1pFerry(k){ const P=X1P_FERRY[k]; if(typeof mapTravel==='function') mapTravel(P.x,P.y,{banner:P.n}); else { player.x=P.x; player.y=P.y; G.fade=1; } }
onTalk(n=>{
  if(n.id!=='dell'||!x1pDell()) return false;
  const first=!G.flags.c_dell_met; G.flags.c_dell_met=true;
  const L=first?[x1pL('dell',`Ash! Followed the river all the way down! Took a wrong turn at a waterfall. Took a right turn after.`,`Ash! I followed the river down here!`),x1pL('dell',`See that big one in the harbor? Brass whistle, steam paddle? That's a SEA boat. One day, Ash. One day.`,`See that big sea boat? One day, Ash. One day.`)]:[x1pL('dell',pick([`The Soggy Biscuit Two, at your service! Mostly floating.`,`All aboard! Mind the wet bit. It's all the wet bit.`]),`All aboard the Soggy Biscuit Two!`)];
  const opts=[{t:S('Row me to the Gearhaven quay','To the Gearhaven quay'),fn:()=>later(0.2,()=>x1pFerry('quay'))},{t:S('Row me to the Saltmarsh jetty','To the Saltmarsh jetty'),fn:()=>later(0.2,()=>x1pFerry('jetty'))}];
  if(x1pR('c_light')) opts.push({t:S('Row me to Lantern Point','To Lantern Point'),fn:()=>later(0.2,()=>x1pFerry('point'))});
  opts.push({t:S('Just saying hello','Just saying hi'),then:[['dell',S(`Hello! Hello back! Sorry. I get excited about the sea.`,`Hello! I love the sea!`)]]});
  L.push(ch('dell',S('Where to?','Where to?'),opts));
  runDialogue(L,()=>{ scene='play'; saveGame(); }); return true;
});
// Juniper follows the maps down south: she camps at the mouth of each dungeon from the chapter it opens and sells
// (or, after Act I's `hollow`, gives) that dungeon's map
const X1P_JUN=[['c_spire',7100,28850,'c_spire'],['c_light',12650,28900,'c_lighthouse'],['c_brass',10150,24900,'c_brassworks'],['c_claws',1550,29300,'c_gullcrag']];
function x1pJunAt(){ if(!G||actOf(G.stage)!==2) return null; for(const j of X1P_JUN) if(x1pR(j[0])) return j; return null; }
{ const base=npcSpot; npcSpot=function(c){ if(c&&c.id==='juniper'){ const j=x1pJunAt(); if(j) return [j[1],j[2]]; } return base(c); }; }
onTalk(n=>{
  if(n.id!=='juniper'||!x1pJunAt()) return false;
  const j=x1pJunAt(), dun=j[3], D=typeof DUNGEONS!=='undefined'&&DUNGEONS[dun], key='dmap_'+((D&&D.save)||dun);
  const free=x1pQ('hollow'), have=!!G.found[key], first=!G.flags.c_jun_met; G.flags.c_jun_met=true;
  const L=[];
  if(first){ L.push(x1pL('juniper',`Ash! I heard there were caves down here. Sea caves! I had to come. Rook says hi. Rook says bring him a shell.`,`Ash! Sea caves! I had to come. Rook says hi.`)); }
  if(have){ L.push(x1pL('juniper',pick([`You've got my map of this one. The inside is your problem. Good luck!`,`I'm sketching the cliffs. They keep moving. No wait, that's the gulls.`]),`You have my map. Good luck!`)); runDialogue(L,()=>{ scene='play'; }); return true; }
  L.push(x1pL('juniper',`Here, I drew this from the outside. The inside is your problem.`,`I drew this from outside. Inside is your job.`));
  if(free){ L.push(x1pDo(()=>{ G.found[key]=true; setBanner(S('Juniper’s map','Juniper’s map'),S('Every room of this place shows on your map.','Every room shows on your map.'),2.6); })); }
  else { L.push(ch('juniper',S(`Mapping isn't free. Well. For you it's nearly free. Twenty-five coins.`,`Mapping costs 25 coins. For you.`),[
    {t:S('Here you go (25 coins)','Pay 25 coins'),cond:()=>(G.coins||0)>=25,fn:()=>{ G.coins-=25; G.found[key]=true; setBanner(S('Juniper’s map','Juniper’s map'),S('Every room of this place shows on your map.','Every room shows on your map.'),2.6); },then:[['juniper',S(`Pleasure doing business! Rook will be so jealous.`,`Thanks! Rook will be jealous.`)]]},
    {t:S('Maybe later','Maybe later'),then:[['juniper',S(`The dungeon's own map is in there somewhere. Probably in a chest. Probably guarded.`,`There's a map chest inside too.`)]]}])); }
  runDialogue(L,()=>{ scene='play'; saveGame(); }); return true;
});
// ---------- Vesper's trust (ACT2 3.6): G.flags.c_trust 0..7; every rise (from any module) gets the banner
function x1pTrust(n){ G.flags.c_trust=Math.max(0,Math.min(7,(G.flags.c_trust|0)+n)); }
function x1pTrustWatch(){
  const t=G.flags.c_trust|0; if(X1P.trustSeen==null||X1P.trustG!==G){ X1P.trustG=G; X1P.trustSeen=G.flags.c_trust_seen!=null?G.flags.c_trust_seen:t; }
  if(t>X1P.trustSeen&&scene==='play'){ X1P.trustSeen=t; G.flags.c_trust_seen=t; setBanner(S('Vesper trusts you a little more.','Vesper trusts you more.'),'🦋'.repeat(t)+'·'.repeat(Math.max(0,7-t)),2.8); }
  else if(t<X1P.trustSeen){ X1P.trustSeen=t; G.flags.c_trust_seen=t; }
}

// ---------- the ten side quests (ACT2 7). QDEFS order matters for Hettie: c_bolt before c_tail.
// rewards: XP and coins from BALANCE.md 8 (a side quest about 500 XP, a big one about 1000); x1p:fn runs custom payoffs
{ const base=giveReward; giveReward=function(r){ base(r); if(r&&typeof r.x1p==='function') try{ r.x1p(); }catch(e){ console.error(e); } }; }
{ const base=qAvail; qAvail=function(id){ if(id==='c_regatta'&&!G.flags.c_clock_on) return false; if(id==='c_notes') return false; return base(id); }; }
const x1pKind=()=>['c_reply3','c_reply4','c_reply5'].filter(k=>G.flags[k]==='kind').length;
Object.assign(QDEFS,{
  c_oona:{title:S('Warm Hands for Granny Oona','Warm Hands for Granny Oona'),giver:'c_oona',min:'c_salt',
    offer:[x1pL('c_oona',`Oh, look at you. Horns. A tail. And you're WARM. I can feel it from here. Like standing next to a loaf.`,`Look at you. Horns, a tail, and WARM! Like a loaf.`),
      x1pL('c_oona',`I haven't been warm since I was a girl. My old stove hasn't lit in twenty years. The gulls built a nest on my chimney, and I can't climb up to move it, and even if I could, I've nothing to light it with.`,`My stove hasn't lit in twenty years. Gulls built a nest on my chimney. I can't climb up.`),
      x1pL('c_oona',`Our family's never had a spark, you see. Not one. Would you? If you've a minute? I'd pay you in biscuits. They're very old biscuits.`,`We have no fire. Would you help? I'll pay in very old biscuits.`)],
    steps:[
      {t:'flag',flag:'c_oona_nest',text:S('Climb Granny Oona’s roof and move the gull nest off her chimney','Move the gull nest off Granny Oona’s roof'),at:()=>X1P.carry?'lm:c_lm_oonapost':'lm:c_lm_oonanest'},
      {t:'flag',flag:'c_oona_lit',text:S('Light Granny Oona’s old stove. Gently.','Light Granny Oona’s stove. Gently!'),at:()=>DOORS.some(d=>d.area==='h_c_oona')?'area:h_c_oona':'npc:c_oona'},
      {t:'talk',npc:'c_oona',text:S('Sit with Granny Oona by the fire','Sit with Granny Oona by the fire'),lines:'c_oona_fire',reward:{xp:250,x1p:()=>{ giveItems({c_scarf:1,c_biscuit:3},true); x1pHat('c_scarf'); setBanner(S('The Saltwhistle Scarf','The Saltwhistle Scarf'),S('And three very old biscuits. They heal you when you are hurt.','And 3 old biscuits. They heal you.'),3); }}},
      {t:'flag',flag:'c_oona_note',text:S('Get some rest on the coast tonight (a shrine or an inn)','Rest at a shrine or an inn'),reward:{xp:250}}]},
  c_notes:{title:S('Notes in the Rafters','Notes in the Rafters'),min:'c_brass',
    steps:[
      {t:'flags',flags:['c_note3','c_note4','c_note5'],n:3,text:S('Find the Moth Mask’s other note drops: the Gull’s Rest chimney, the top of a harbor crane, behind the Cogwater Falls','Find 3 notes: a chimney, a crane, behind the falls'),at:()=>x1pNextNote()},
      {t:'flag',flag:'c_note6',text:S('One more note waits in the Moth Wood, at the Moon Ring','The last note is at the Moon Ring'),at:'lm:c_lm_note6',reward:{xp:500,x1p:()=>{ if(x1pKind()>=2) x1pTrust(1); }}}]},
  c_gifts:{title:S('The Moth Mask’s Gifts','The Moth Mask’s Gifts'),giver:'c_penny',min:'c_salt',
    offer:[x1pL('c_penny',`HEADLINE: MOTH MASK STEALS GOLDEN MUSIC BOX. LORD WHIRLIGIG FAINTS. TWICE.`,`HEADLINE: MOTH MASK STEALS MUSIC BOX!`),
      x1pL('c_penny',`Every time she robs someone, the stuff turns up in Saltmarsh. Roof tiles. Medicine. Once a whole goose. If we follow the music box, we follow HER. Scoop of the century. Help me?`,`Her loot ends up in Saltmarsh. Follow the box, find HER! Help me?`)],
    steps:[
      {t:'talk',npc:'c_whirligig',text:S('Ask Lord Whirligig what the Moth Mask took','Ask Lord Whirligig what she took'),lines:[x1pL('c_whirligig',`My golden music box! It plays the Moth Waltz. I bought it to annoy my neighbor. Now I miss it. Isn't that strange? Don't answer that.`,`My golden music box! It plays the Moth Waltz. I miss it.`)]},
      {t:'talk',npc:'c_fig',text:S('Ask Auntie Fig at the Steaming Teapot about the tune','Ask Auntie Fig about the tune'),lines:[x1pL('c_fig',`The Moth Waltz? Oh, dearie. A girl used to wash dishes here. She hummed that tune every single day. Lovely thing. Terrible with plates.`,`The Moth Waltz? A girl here hummed it every day. Terrible with plates.`),
        x1pL('c_fig',`She'd walk home to Saltmarsh along the cliff road at night. You can still see her silver footprints some nights, if you look. Moth dust. It gets everywhere.`,`She walked home to Saltmarsh at night. Her silver footprints still show at night.`)]},
      {t:'flag',flag:'c_gift_trail',text:S('Follow the silver footprints west (they glitter at night)','Follow the silver footprints (at night)'),at:()=>x1pTrailNext()},
      {t:'talk',npc:'c_posy',text:S('Talk to Little Posy in Saltmarsh','Talk to Little Posy'),lines:'c_gifts_posy'},
      {t:'talk',npc:'c_whirligig',text:S('Tell Lord Whirligig what you found','Tell Lord Whirligig'),lines:'c_gifts_tell'},
      {t:'talk',npc:'c_penny',text:S('Give Penny her story','Tell Penny the story'),lines:'c_gifts_penny',reward:{xp:500,x1p:()=>{ giveItems({c_newscap:1},true); x1pHat('c_newscap'); if(G.flags.c_gifts!=='taken') addCoins(40,player.x,player.y); setBanner(S('Penny’s Press Pass','Press Pass'),S('A newsboy cap. You look very official.','A cap. Very official!'),2.6); }}}]},
  c_whip:{title:S('The Ghost of the Saucy Gull','The Ghost of the Saucy Gull'),giver:'c_tarbuckle',min:'c_salt',
    offer:[x1pL('c_tarbuckle',`In my day there was a pirate on this coast called Captain Saltbeard. Beard so salty you could season soup with it. We sailed together. Then apart. Then into each other.`,`There was a pirate called Captain Saltbeard. We sailed together. Then we crashed.`),
      x1pL('c_tarbuckle',`His ship, the Saucy Gull, went down on the Rockpools forty years ago. On dark nights, at low tide, you can still hear his anchor chain. Clank. Clank. He's out there.`,`His ship sank on the Rockpools. At night you hear his chain. Clank. Clank.`),
      x1pL('c_tarbuckle',`He died hungry, you know. Missed his supper the night she sank. Old Charlie's grandpa's Ghost Pepper Chowder. Ghosts don't forget a missed supper.`,`He missed his supper. Ghost Pepper Chowder. Ghosts don't forget.`),
      x1pL('c_tarbuckle',`Bring him a bowl. Let the old fool rest. And if he still owes me a sock, get the sock.`,`Bring him a bowl. Let him rest. And get my sock.`)],
    steps:[
      {t:'talk',npc:'c_charlie',text:S('Ask Chowder Charlie about the Ghost Pepper Chowder','Ask Charlie about Ghost Pepper Chowder'),lines:[x1pL('c_charlie',`Ghost Pepper Chowder? My grandpa's recipe? Nobody's been brave enough to make that in forty years. It's so hot it once woke a ghost. Or so the story goes.`,`My grandpa's Ghost Pepper Chowder? It's so hot it woke a ghost!`),
        x1pL('c_charlie',`I need three sea peppers. Little red ones, they grow in the tide pools on the Rockpools. The crabs love them. The crabs will not share.`,`I need 3 sea peppers from the Rockpools. The crabs won't share.`)]},
      {t:'item',item:'c_seapepper',n:3,text:S('Pick 3 sea peppers in the Rockpools tide pools','Pick 3 sea peppers on the Rockpools'),at:()=>x1pNextPepper()},
      {t:'talk',npc:'c_charlie',take:{c_seapepper:3},give:{c_chowder:1},text:S('Bring the sea peppers to Chowder Charlie','Bring the peppers to Charlie'),lines:[x1pL('c_charlie',`Three sea peppers. Here we go. Stand back.`,`Three peppers. Stand back!`),x1pN(`The chowder bubbles. It glows faintly red. Your eyes water from across the room.`,`The chowder glows red. Your eyes water.`),x1pL('c_charlie',`Don't eat it. I mean it. That's for the dead.`,`Don't eat it! It's for the dead.`)]},
      {t:'flag',flag:'c_saltbeard_won',text:S('At night, at low tide, set the chowder on the deck of the Saucy Gull','At night, put the chowder on the old wreck'),at:'lm:c_lm_deck'},
      {t:'talk',npc:'c_tarbuckle',text:S('Tell Old Tarbuckle','Tell Old Tarbuckle'),lines:[x1pL('c_tarbuckle',`He's gone? Properly gone? ...Good. Good. The old fool. Is that my sock? That's my sock.`,`He's gone? Good. The old fool. Is that my sock?`),
        x1pL('c_tarbuckle',`...Keep it. For luck. It's never been washed. Now take that chain to Ingrid at the Bright Anvil. A chain that held a ghost wants a better job.`,`Keep it. For luck. Take the chain to Ingrid the smith.`)]},
      {t:'talk',npc:'c_ingrid',take:{c_chain:1},text:S('Take the anchor chain to Ingrid at the Bright Anvil','Take the chain to Ingrid'),lines:[x1pL('c_ingrid',`An anchor chain off a ghost ship? JA! This is the best day of my life! Hammer, hammer, ding! Give me one minute.`,`A ghost's chain? JA! Best day ever! One minute.`),
        x1pN(`CLANG. CLANG. CLANG. Sparks, steam, singing. Ingrid holds up a chain with a curved brass grip at one end and a heavy hook at the other.`,`CLANG! CLANG! Ingrid holds up a chain with a hook.`),
        x1pL('c_ingrid',`The Chain Whip! Crack it and it reaches far. It pulls things. Shields, crabs, levers, the odd baron. Swing it round your head for a big crack. Mind your horns.`,`The Chain Whip! It reaches far and pulls things. Mind your horns!`)],reward:{weapon:'whip',coins:60,xp:1000}}]},
  c_bolt:{title:S('A Dog Made of Brass','A Dog Made of Brass'),giver:'c_hettie',min:'c_light',ab:'grapple',
    offer:[x1pL('c_hettie',`Ash. You've got a TAIL that GRABS things. That's wonderful. Unrelated question. Can you grab a dog?`,`Your tail grabs things! Can you grab a dog?`),
      x1pL('c_hettie',`Bolt! My brass dog. He ran off the night the moths came. Dust in his nose gears. He sneezes every five seconds and he's terrified of his own sneezes.`,`My brass dog Bolt ran off. He sneezes and it scares him.`),
      x1pL('c_hettie',`Penny's board says he's up on the harbor cranes. He climbs things when he's scared. I built him that way. I regret it.`,`He's up on the harbor cranes. He climbs when he's scared.`)],
    steps:[
      {t:'flag',flag:'c_bolt_caught',text:S('Catch Bolt. Penny’s board says he’s up on the harbor cranes.','Catch Bolt on the harbor cranes!'),at:()=>x1pBoltAt()},
      {t:'flag',flag:'c_bolt_clean',text:S('Take Bolt to the workshop and clean his gears','Take Bolt home and clean his gears'),at:()=>DOORS.some(d=>d.area==='h_c_hettie')?'area:h_c_hettie':'npc:c_hettie'},
      {t:'talk',npc:'c_hettie',text:S('Talk to Professor Hettie','Talk to Professor Hettie'),lines:[x1pL('c_hettie',`BOLT! Oh, you clanky idiot. Come here.`,`BOLT! You clanky silly. Come here.`),
        x1pL('c_hettie',`He likes you, Ash. Take him along, if you like. He's got a nose for shadows. He can smell a fib from a mile away. He barked at Lord Whirligig for an hour once. Whirligig had said he'd "never once been late."`,`He likes you! Take him along. He can smell a fib a mile away.`),
        x1pL('c_bolt',`Bark! (whirr) Bark bark! (tick)`,`Bark! Bark bark!`)],reward:{xp:500,x1p:()=>{ G.flags.c_bolt_follow=false; recruitComp('c_bolt'); }}}]},
  c_tail:{title:S('The Longer Tail','The Longer Tail'),giver:'c_hettie',min:'c_brass',ab:'grapple',
    offer:[x1pL('c_hettie',`May I see your tail? Professionally. Oh, it's MAGNIFICENT. Pearl's hook! I've only ever seen drawings.`,`Can I see your tail? Pearl's hook! Wonderful!`),
      x1pL('c_hettie',`I could make it marvel-ier. A reel, inside the hook. You'd pull things TO you. Little crabs. Big shields. Biscuits off high shelves.`,`I can add a reel. You'd pull things to you!`),
      x1pL('c_hettie',`I need three spring cores from Steam Rams. They only pop out when a Ram's knocked dizzy. And the old mainspring off the Clockwatch weathervane. Captain Ticklebrass will say no. Don't ask her.`,`Bring 3 springs from dizzy Steam Rams. And the spring on the weathervane. Don't tell Hester.`)],
    steps:[
      {t:'item',item:'c_spring',n:3,text:S('Get 3 spring cores from Steam Rams (they only drop one when beaten while dizzy)','Get 3 springs from dizzy Steam Rams'),at:()=>'poi:c_brassyards'},
      {t:'flag',flag:'c_mainspring',text:S('Fetch the old mainspring from the Clockwatch Hall’s weathervane','Get the spring from the weathervane'),at:'lm:c_lm_vane'},
      {t:'talk',npc:'c_hettie',take:{c_spring:3,c_mainspring:1},text:S('Bring the springs to Professor Hettie','Bring the springs to Hettie'),lines:[x1pL('c_hettie',`There! The Reel-In. Grapple a shield and PULL. Grapple a crab and PULL. Grapple Lord Whirligig and... don't grapple Lord Whirligig.`,`The Reel-In! Grab a shield and PULL! Not Lord Whirligig.`),
        x1pL('c_hester',`(from somewhere up the hill) WHO TOOK MY WEATHERVANE SPRING?`,`(far away) WHO TOOK MY SPRING?`)],reward:{xp:500,x1p:()=>{ G.flags.c_reel=true; setBanner(S('Reel-In!','Reel-In!'),S('Your Grapple Tail reaches farther. Aim it at a shield or a small foe and it pulls them to you.','Your tail reaches farther. It pulls shields and small foes.'),3.4); }}}]},
  c_logbook:{title:S('Pearl’s Logbook','Pearl’s Logbook'),giver:'c_ottoline',min:'c_salt',
    offer:[x1pL('c_ottoline',`Mother Pearl kept a logbook. Every day of her life on this coast. It's the city's greatest treasure. And six of its pages are MISSING. Sorry. Missing.`,`Pearl's logbook is missing six pages! Sorry. Missing.`),
      x1pL('c_ottoline',`They blew away in the great storm three hundred years ago. A very windy librarian. Not me. My great-great-great... you know.`,`They blew away in a storm long ago.`),
      x1pL('c_ottoline',`If you find any pages in Pearl's old places, bring them here. I'll pay you in coins. And in being quiet. Mostly coins.`,`Find them in Pearl's old places. Bring them here. I'll pay.`)],
    steps:[{t:'flag',flag:'c_logbook_done',text:S('Find the six lost pages of Pearl’s Logbook and bring them to Archivist Ottoline','Find Pearl’s 6 pages. Bring them to Ottoline.'),at:()=>x1pPagesHeld()>0?'npc:c_ottoline':x1pR('c_light')?'lm:c_lm_gullisle':null}]},
  c_regatta:{title:S('The Harbor Regatta','The Harbor Regatta'),giver:'c_jo',min:'c_brass',ab:'skimmer',
    offer:[x1pL('c_jo',`Ahoy, lizard! The chain's up, the harbor's open, and it's REGATTA DAY. Every year I win. Every year I win by more.`,`The harbor is open! It's REGATTA DAY! I always win.`),
      x1pL('c_jo',`Eight buoys, round the harbor, out the mouth and back. Boats only. ...You don't have a boat. You've got feet.`,`Eight buoys round the harbor. Boats only. You have feet.`),
      x1pL('ash',`I can skip.`,`I can skip.`),x1pL('c_jo',`You can WHAT?`,`You can WHAT?`)],
    steps:[
      {t:'flag',flag:'c_regatta_won',npc:'c_jo',mini:'c_regatta',text:S('Beat Skipper Jo round the harbor’s eight buoys (talk to Jo to start)','Race Skipper Jo round 8 buoys. Talk to Jo.'),
        ready:[x1pL('c_jo',`Eight buoys. Follow the flags. First one back to my shed wins. Sprint to skip, lizard. If you can.`,`Eight buoys. First back wins. Sprint to skip!`),x1pL('c_jo',`Ready?`,`Ready?`)]},
      {t:'talk',npc:'c_jo',text:S('Talk to Skipper Jo','Talk to Skipper Jo'),lines:[x1pL('c_jo',`You BEAT me. On FOOT. On WATER. That's not allowed. I'm checking the rules. ...It's allowed. Barnacles.`,`You BEAT me! On FOOT! ...It's allowed. Barnacles.`),
        x1pL('c_jo',`Here. My skiff whistle. Blow it at any landing and one of my cousins will row you anywhere on the coast. I've got a lot of cousins.`,`Here's my skiff whistle. My cousins will row you anywhere.`),
        x1pL('c_mo',`(from the Harbor Office) THE DRAGON WINS THE REGATTA! BARNACLES! Somebody write that down!`,`(far away) THE DRAGON WINS! Write it down!`),x1pL('c_penny',`Already did.`,`Already did.`)],reward:{coins:50,xp:500,x1p:()=>{ G.flags.c_skiffs=true; setBanner(S('The Skiff Whistle','The Skiff Whistle'),S('At a skiff landing, call a skiff to row you to any other landing on the coast.','Call a skiff at a landing. It rows you anywhere.'),3.4); }}}]},
  c_chalk:{title:S('The Chalk Dragon','The Chalk Dragon'),giver:'c_barley',min:'c_coast',ab:'dbljump',
    offer:[x1pL('c_barley',`See the hill? Look close. That grey shape. That's the Chalk Dragon. Mother Pearl cut it into the hill a thousand years back. Scraped the grass off, down to the white chalk.`,`See the grey shape on the hill? The Chalk Dragon. Pearl cut it long ago.`),
      x1pL('c_barley',`She did it for her mother. So her mother, flying high, could look down and see a dragon waving up at her. Gerald thinks that's the nicest thing he ever heard. Gerald fainted.`,`She made it for her mom, so she could see it from the sky. Gerald fainted.`),
      x1pL('c_barley',`It's gone grey now. Grass and moth dust. Walk the old line, would you? Your feet are warm. Chalk likes warm feet.`,`It's grey now. Walk the old line? Chalk likes warm feet.`)],
    steps:[
      {t:'flag',flag:'c_chalk_drawn',npc:'c_barley',mini:'c_chalkwalk',text:S('Walk the Chalk Dragon’s outline in one go, before the chalk dust blows away (talk to Old Barley to start)','Walk the Chalk Dragon’s line. Talk to Barley to start.'),
        ready:[x1pL('c_barley',`Step on every mark, in order, all the way round. Head, wing, tail, legs. Two bits go up the steep steps, so hop high. And don't let anything knock you about, or the line fades.`,`Step on every mark in order. Hop high on the steps. Don't get hit!`),x1pL('c_barley',`Ready, young dragon?`,`Ready?`)]},
      {t:'flag',flag:'c_chalk_eye',text:S('Look into the dragon’s eye at the top of the hill','Look into the dragon’s eye'),at:'lm:c_lm_eye'},
      {t:'talk',npc:'c_barley',text:S('Tell Old Barley','Tell Old Barley'),lines:[x1pL('c_barley',`I saw her from down here. White as a gull. Waving. My wife would've cried. I did, a bit. Gerald fainted.`,`I saw her. White as a gull! I cried a bit. Gerald fainted.`),x1pL('c_barley',`Here. It's not much. It's what's in the tin.`,`Here. It's what's in the tin.`)],reward:{coins:40,xp:500}}]},
  c_bob:{title:S('The Third Bob','The Third Bob'),giver:'c_bobs',min:'c_brass',
    offer:[x1pL('c_bobs',`There used to be three of us. Bob, Bob, and Bob.`,`There were three of us. Bob, Bob and Bob.`),
      x1pL('c_bobs',`The night the moths came, Bob went funny. Silver dust in his ears. He walked off into the Brass Yards going "tick tock tick tock" in a scary voice.`,`The moths came. Bob went funny. He walked off to the Brass Yards.`),
      x1pL('c_bobs',`He's got a blue plume. Bring him home? Gently? He's the clever Bob.`,`He has a blue plume. Bring him home? Gently?`),x1pL('c_bobs',`He is NOT the clever Bob.`,`He is NOT the clever Bob.`)],
    steps:[
      {t:'flag',flag:'c_bob_found',text:S('Find the third Bob, a Tin Watchman with a blue plume, somewhere in the Brass Yards','Find the third Bob in the Brass Yards. Blue plume!'),at:'xy:11300,24400'},
      {t:'flag',flag:'c_bob_calm',text:S('Knock the moth dust out of Bob without breaking him: break his shield, then breathe on him gently while he is dizzy','Break his shield. Then breathe on him gently.'),at:()=>X1P.bob&&!X1P.bob.e.dead?`xy:${Math.round(X1P.bob.e.x)},${Math.round(X1P.bob.e.y)}`:'xy:11300,24400'},
      {t:'talk',npc:'c_bobs',text:S('Bring Bob home to the Clockwork Lift','Bring Bob home to the Lift'),lines:[x1pL('c_bobs',`BOB!`,`BOB!`),x1pL('c_bob3',`BOB!`,`BOB!`),x1pN(`Three tin watchmen hug. It sounds like a cutlery drawer falling down the stairs.`,`Three tin men hug. CLANG!`),
        x1pL('c_bobs',`The Clockwatch owes you, Mostly Part Dragon. When you need us, we'll be there. All of us. All three Bobs.`,`We owe you. When you need us, all three Bobs will come.`)],reward:{coins:40,xp:500,x1p:()=>{ X1P.bob3follow=false; giveItems({c_badge:1},true); x1pHat('c_badge'); setBanner(S('A Clockwatch badge','A Clockwatch badge'),S('The Bobs will hold the breakwater and the Spire door for you.','The Bobs will help you at the Spire.'),3.2); if(!AREA&&!G.npcs.some(n=>n.id==='c_bob3')){ const [x,y]=npcSpot(SPECIAL.c_bob3); G.npcs.push(mkNPC(SPECIAL.c_bob3,x,y)); } }}}]}
});
// lines that depend on choices (getters, so a talk step can name them by STORY key)
Object.assign(STORY,{
  c_oona_note:[x1pN(`When you wake up, there's a note on your pillow. And a fish.`,`You wake up. A note and a fish are on your pillow.`),
    x1pN(`"You lit Gran's stove. She hasn't stopped talking about it. She made me sit by it for an hour. ...Thanks. - V."`,`"You lit Gran's stove. She made me sit by it. Thanks. - V."`),
    x1pN(`The fish has a little bow on it.`,`The fish has a little bow.`)],
  c_note6:[x1pN(`The Moon Ring. Seven pale stones in a circle in the grey birch wood. The grass in the middle is flattened, as if something huge once landed here. Silver dust glitters everywhere.`,`Seven pale stones in a ring. Something huge landed here once.`),
    x1pN(`On the tallest stone, a note, weighed down with a little box.`,`A note sits on the tallest stone, with a little box.`),
    x1pN(`"You found all of them. Nobody finds all of them. This is where I met her. The Lady. Don't stay here after dark. The moths remember. I left you something. It's warm. Somebody ought to have something warm. - V."`,`"You found them all. I met the Lady here. Don't stay after dark. I left you something warm. - V."`),
    x1pN(`In the box, a Heart Ember glows softly.`,`In the box, a Heart Ember glows.`)],
  c_saltbeard_intro:[x1pN(`You set the steaming bowl on the tilted deck of the Saucy Gull. The tide whispers. Somewhere in the dark, a chain goes clank. Clank. CLANK.`,`You set the bowl on the deck. A chain goes clank. CLANK.`),
    x1pN(`A huge pale pirate rises up through the deck, beard like sea foam, an anchor on a chain over his shoulder.`,`A huge ghost pirate rises up through the deck!`),
    x1pL('c_saltbeard',`WHO DARES set food on MY deck without SAYING GRACE?`,`WHO puts food on MY deck?`),x1pL('ash',`Um. Grace?`,`Um. Grace?`),
    x1pL('c_saltbeard',`TOO LATE! Fight me for it, landlubber! Winner gets the chowder!`,`TOO LATE! Fight me for it!`)],
  c_saltbeard_won:[x1pN(`Captain Saltbeard sits down heavily on his own deck. He picks up the bowl in both ghostly hands, and slurps.`,`Saltbeard sits down. He slurps the chowder.`),
    x1pL('c_saltbeard',`...Oh. Oh, that's the stuff. Forty years. Forty YEARS I waited for this bowl.`,`Oh. That's the stuff. Forty years I waited!`),
    x1pN(`He glows a little brighter with every spoonful. When the bowl is empty, he's almost see-through.`,`He glows brighter. Then he fades.`),
    x1pL('c_saltbeard',`Tell Elias I'm sorry about the cards. And the sock. Here.`,`Tell Elias sorry about the cards. And the sock.`),
    x1pN(`He drops his anchor chain at your feet. It's real, cold and heavy, and it clinks like it wants something to do.`,`He drops his anchor chain at your feet.`),
    x1pL('c_saltbeard',`Take my chain, little dragon. Give it a better job than holding me down.`,`Take my chain. Give it a better job.`),
    x1pN(`Then he's gone, and there's only the tide, an empty bowl, and one very old sock.`,`Then he is gone. Just a bowl and an old sock.`)]
});
Object.defineProperty(STORY,'c_oona_fire',{configurable:true,get(){ return [
  x1pN(`The old stove catches with a soft whump. Orange light fills the little house. Granny Oona holds out her hands to it and closes her eyes.`,`The stove lights. Granny Oona holds out her hands.`),
  x1pL('c_oona',`Oh. Oh, duck. Oh, that's... I'd forgotten. I'd forgotten what it feels like.`,`Oh, duck. I forgot what warm feels like.`),
  x1pN(`She laughs. Then she cries a bit. Then she laughs again, wipes her eyes with her shawl, and pats the stool next to her.`,`She laughs. She cries a bit. She pats the stool by her.`),
  x1pL('c_oona',`Sit. I'll tell you a story. We're Emberbloods, you know. The Saltwhistles. From Ember's second girl, Pearl, who came south with no fire and built Gearhaven out of stubbornness.`,`We are Emberbloods. From Ember's second girl, Pearl. She had no fire. She built Gearhaven.`),
  x1pL('c_oona',`Pearl's fire never came. Not to her, not to her children, not to anyone since. We got her claws, now and then. Her climbing. Her shadows. Never the fire.`,`None of us ever had fire. Some got her claws and her shadows.`),
  x1pL('c_oona',`My granddaughter has the claws. Climbs like a cat, my Vesper. Out every night, back every morning, with fish for my step and silver dust on her boots. She thinks I don't know.`,`My granddaughter Vesper has the claws. Out every night. She thinks I don't know.`),
  x1pL('ash',`Know what?`,`Know what?`),
  x1pL('c_oona',`Oh, duck. Everybody in Saltmarsh knows who the Moth Mask is. We just don't say. She keeps our roofs on.`,`Everyone here knows who the Moth Mask is. We just don't say.`),
  x1pL('c_oona',`She's been strange since the winter. Dreaming. Talking about a Lady. She says she'll bring the fire home for me. I don't want the fire. I want my girl to come in and sit down.`,`She dreams of a Lady. She wants to bring me fire. I just want her home.`),
  x1pL('c_oona',`Oh, duck. Fire isn't the only warm thing. That's what Pearl used to say. We still say it in this house, every night, at bedtime.`,`Fire isn't the only warm thing. Pearl said that. We say it every night.`),
  {who:'pip',text:S(`Mip. (Pip climbs into Granny Oona's lap and curls up like a warm bun.)`,`Mip. (Pip curls up in Gran's lap.)`),skipIf:()=>!(G.flags.pip&&(x1pQ('a1_pip')||G.flags.a1_pip))},
  Object.assign(ch('narr',S(`You still have the shell locket from the stranger's camp up north.`,`You still have the shell locket.`),[
    {t:S(`Show Granny Oona the locket`,`Show Gran the locket`),tone:'kind',fn:()=>{ G.flags.c_locket_given=true; x1pTrust(1); takeItems({a1_locket:1}); },then:[
      x1pL('c_oona',`That's... that's my daughter's locket. Vesper's mom's. Vesper wears it everywhere. She came home in the spring without it and cried for a week.`,`That's my daughter's locket! Vesper lost it. She cried for a week.`),
      x1pL('c_oona',`I'll give it back to her. She'll know who found it. Thank you, duck.`,`I'll give it back to her. Thank you, duck.`)]},
    {t:S(`Keep it for now`,`Keep it for now`),then:[x1pL('ash',`(Maybe I'll give it to her myself.)`,`(Maybe I'll give it to her myself.)`)]}]),{skipIf:()=>!G.items.a1_locket||!!G.flags.c_locket_given}),
  x1pL('c_oona',`Here. A scarf I knitted for Vesper, years ago. She's never once worn it. And three of my biscuits. They're very old. They'll see you right when you're hurt.`,`A scarf I made. And three old biscuits. Eat them when you're hurt.`)]; }});
Object.defineProperty(STORY,'c_gifts_posy',{configurable:true,get(){ return [
  x1pL('c_dory',`It was on our step one morning, with a note. "For Posy, who can't sleep." Posy hasn't slept a night without it since her dad went out with the fleet.`,`It was on our step. "For Posy, who can't sleep." She sleeps with it every night.`),
  x1pL('c_posy',`This is my music box. It plays the moth song. You can listen but you can't hold it.`,`My music box plays the moth song. You can't hold it.`),
  ch('ash',S(`What do you do?`,`What do you do?`),[
    {t:S(`Ask Posy to give it back`,`Ask Posy for the box`),fn:()=>{ G.flags.c_gifts='taken'; giveItems({c_musicbox:1}); },then:[x1pL('c_posy',`...Okay. If it's really his.`,`...Okay. If it's really his.`),x1pN(`She holds it out. Her lip wobbles. Dory says nothing at all, which is worse.`,`She gives it to you. Her lip wobbles.`)]},
    {t:S(`Let her keep it. I'll talk to Lord Whirligig.`,`Let her keep it.`),tone:'kind',fn:()=>{ G.flags.c_gifts='kept'; },then:[x1pL('c_posy',`You're a GOOD dragon.`,`You're a GOOD dragon.`)]}])]; }});
Object.defineProperty(STORY,'c_gifts_tell',{configurable:true,get(){
  if(G.flags.c_gifts==='taken') return [x1pL('c_whirligig',`My music box! Splendid! Here, a reward. ...Why do you look so glum? It's MY music box. Hmph.`,`My music box! Here's a reward. Why so glum? Hmph.`),
    x1pDo(()=>{ takeItems({c_musicbox:1}); addCoins(80,player.x,player.y); })];
  return [x1pL('c_whirligig',`Well? Did you find my music box, dragon?`,`Well? Did you find my box?`),
    ch('ash',S(`What do you tell Lord Whirligig?`,`What do you tell him?`),[
      {t:S(`The truth: a little girl needs it to sleep`,`The truth: a girl needs it to sleep`),tone:'kind',fn:()=>{ G.flags.c_gifts='truth'; x1pTrust(1); },then:[
        x1pL('c_whirligig',`A child? Can't sleep? Without MY music box?`,`A child can't sleep without it?`),
        x1pL('c_whirligig',`...Hmph. I have eleven music boxes. ELEVEN. Let the child keep it. Does she like clocks? I have rather a lot of clocks.`,`Hmph. I have eleven boxes. She can keep it. Does she like clocks?`)]},
      {t:S(`Pay him for it (100 coins)`,`Pay him (100 coins)`),tone:'kind',cond:()=>(G.coins||0)>=100,fn:()=>{ G.coins-=100; G.flags.c_gifts='bought'; x1pTrust(1); },then:[
        x1pL('c_whirligig',`You'll BUY it? For a fishing girl? ...Well, I never. Keep your coins, dragon. No. Give me the coins. No. Keep them. Oh, I don't know what I am anymore.`,`You'll buy it for her? Keep your coins. No. Give them. Oh, I don't know!`),
        x1pN(`He takes the coins. Then he gives half of them back. Then he walks off muttering about clocks.`,`He takes the coins. He gives half back.`),x1pDo(()=>addCoins(50,player.x,player.y))]}])]; }});
Object.defineProperty(STORY,'c_gifts_penny',{configurable:true,get(){ return [
  x1pL('c_penny',`I did some digging. The Moth Mask is Vesper Saltwhistle. Granny Oona's girl. Washed dishes at the Teapot. Hums the Moth Waltz.`,`The Moth Mask is Vesper Saltwhistle. Granny Oona's girl!`),
  {who:'c_penny',text:S(`It's the scoop of the century. And I'm not printing it. Some stories are better kept. HEADLINE: REPORTER KEEPS SECRET. Nobody will ever read that one either.`,`Big scoop. I won't print it. HEADLINE: REPORTER KEEPS SECRET.`),skipIf:()=>G.flags.c_gifts==='taken'},
  {who:'c_penny',text:S(`HEADLINE: MUSIC BOX RETURNED. LORD HAPPY. CHILD SAD. ...It's true. I don't like it much.`,`HEADLINE: BOX RETURNED. CHILD SAD. I don't like it.`),skipIf:()=>G.flags.c_gifts!=='taken'},
  x1pDo(()=>{ G.flags.c_vesper_named=true; })]; }});
// step text with counters for these quests (stepText would say "clues")
{ const base=stepText; stepText=function(id){
  const st=stepOf(id); if(!st||!String(id).startsWith('c_')) return base(id);
  if(id==='c_notes'&&st.t==='flags') return `${simplify(st.text)} (${st.flags.filter(f=>G.flags[f]).length}/3)`;
  if(id==='c_logbook') return `${simplify(st.text)} (${x1pPagesFound()}/6, ${G.flags.c_pages_given|0} ${simplify(S('given','given'))})`;
  return base(id); }; }
// ---------- Pearl's Logbook (c_logbook): six pages. Pages 1 to 5 are in the dungeons: the dungeon helpers call
// cPearlPage(n) when Ash picks one up (Gullcrag p and z, the Brassworks d and z, the Lighthouse d). Page 6 is on Gull Isle.
const X1P_PAGES={
  1:S(`"Day one. Sailed into a bay with a rope, a lantern and no plan. Climbed the biggest cliff to see where I was. Still don't know. Nice view."`,`"Day one. A rope, a lantern, no plan. I climbed a cliff. Nice view."`),
  2:S(`"The tide here breathes. I timed it with a bell. Then I made the bell bigger, so the sea could hear it. The sea is a little deaf."`,`"The tide breathes. I made a big bell so the sea could hear it."`),
  3:S(`"Built a clock. Everyone laughed. Now nobody is allowed to be late, and they've all stopped laughing. Ha."`,`"I built a clock. They laughed. Now nobody is late. Ha."`),
  4:S(`"Made a guardian for my workshop. Called him Ticktock. He's very loyal and very bad at stairs."`,`"I made a guardian called Ticktock. Loyal. Bad at stairs."`),
  5:S(`"Lit the lighthouse. Mother flew down to see it. She cried. She's always crying, my mother. Happy crying. Dragons leak."`,`"I lit the lighthouse. Mother flew down and cried. Happy crying."`),
  6:S(`"A moth came to my lighthouse tonight. A big one, with a voice like a lullaby. It asked me for a light that never goes out. I told it lights are for sharing. It went away. I don't think it liked my answer."`,`"A big moth asked me for a light that never goes out. I said lights are for sharing. It left."`)
};
const X1P_LETTER=S(`"To my children with no fire. Don't be sad. Fire isn't the only warm thing. Hands are warm. Soup is warm. A lit window is warm. I had no fire, so I built a city full of warm windows. You can too. - P."`,`"To my children with no fire. Fire isn't the only warm thing. Hands, soup and windows are warm. - P."`);
function cPearlPage(n){
  n=n|0; if(n<1||n>6||G.flags['c_pg'+n]) return false;
  G.flags['c_pg'+n]=1; giveItems({['c_page'+n]:1},true); try{ jingle('item','shrine'); }catch(e){}
  const L=[x1pN(`A page torn from an old ship's logbook. The handwriting leans, like it was written on a rolling deck.`,`An old page from a ship's logbook.`),['narr',X1P_PAGES[n]]];
  if(n===6) L.push(x1pN(`Below it, in the same hand, a letter.`,`Below it is a letter.`),['narr',X1P_LETTER]);
  runDialogue(L,()=>{ scene='play'; setBanner(S(`Pearl’s Logbook: ${x1pPagesFound()} of 6 pages`,`Pearl’s pages: ${x1pPagesFound()} of 6`),G.quests.c_logbook?S('Bring them to Archivist Ottoline in the Turning Library.','Bring them to Ottoline.'):S('The Turning Library in Gearhaven would love to see this.','The library in Gearhaven wants this.'),2.8); questPoke(); saveGame(); });
  return true;
}
const x1pPagesFound=()=>{ let n=0; for(let i=1;i<=6;i++) if(G.flags['c_pg'+i]) n++; return n; };
const x1pPagesHeld=()=>{ let n=0; for(let i=1;i<=6;i++) if(G.items['c_page'+i]&&!G.flags['c_pgd'+i]) n++; return n; };
onTalk(n=>{
  if(n.id!=='c_ottoline'||!G.quests.c_logbook||G.quests.c_logbook.done) return false;
  const L=[];
  if(G.flags.c_pb_5&&!G.flags.c_ott_wren){ G.flags.c_ott_wren=true; L.push(x1pL('c_ottoline',`A letter from Sister Wren of Emberhollow came this morning. About you. And about commas. She's wrong about commas.`,`Sister Wren wrote about you. And commas. She's wrong.`),x1pL('c_ottoline',`She's wrong about everything. Lovely woman. We've been arguing by post for thirty years.`,`She's always wrong. Lovely woman.`)); }
  const held=[]; for(let i=1;i<=6;i++) if(G.items['c_page'+i]&&!G.flags['c_pgd'+i]) held.push(i);
  if(!held.length){ if(!L.length) return false; runDialogue(L,()=>{ scene='play'; talkHub(n); }); return true; }
  const before=G.flags.c_pages_given|0, after=before+held.length;
  L.push(x1pL('c_ottoline',held.length===1?`A page! Of Pearl's logbook! Oh. OH. Sorry. Oh.`:`${held.length} pages! Of Pearl's logbook! OH. Sorry. Oh!`,held.length===1?`A page of Pearl's! OH. Sorry.`:`Pages of Pearl's! OH! Sorry.`));
  for(const i of held) if(i<6) L.push(x1pL('c_ottoline',`Listen. ${X1P_PAGES[i]}`,`Listen. ${simplify(X1P_PAGES[i])}`));
  if(held.includes(6)){ L.push(x1pL('c_ottoline',`The last page. Oh, Ash. Listen.`,`The last page. Listen.`),x1pL('c_ottoline',`A moth with a voice like a lullaby. A thousand years ago. Asking for a light that never goes out.`,`A moth, long ago, wanting a light that never goes out.`),
    x1pL('c_ottoline',`I'll copy this out for Wren tonight. And Ash? Remember everything that moth ever says to you. Everything.`,`I'll copy it for Wren. Remember what that moth says. Everything.`)); }
  if(after>=6) L.push(x1pL('c_ottoline',`That's all six. The whole logbook, home on its shelf. Here. Pearl's letter is yours to carry. It was always meant for someone like you. And this was pressed between the pages.`,`All six! Pearl's letter is yours. And this was in the pages.`));
  else if(before<3&&after>=3) L.push(x1pL('c_ottoline',`That's ${after}! This deserves more than coins.`,`That's ${after}! More than coins for you.`));
  else L.push(x1pL('c_ottoline',`${6-after} to go. Pearl's old places. Caves, lofts, lighthouses. QUIETLY. Sorry.`,`${6-after} to go. Look in Pearl's old places.`));
  runDialogue(L,()=>{ scene='play';
    for(const i of held){ G.flags['c_pgd'+i]=1; takeItems({['c_page'+i]:1}); }
    G.flags.c_pages_given=after; addCoins(15*held.length,player.x,player.y); gainXp(40*held.length);
    if(before<3&&after>=3){ G.pendingBless++; later(1.2,offerPending); }
    if(after>=6){ giveItems({c_pearl_letter:1},true); x1pHeart('c_logbook'); G.flags.c_logbook_done=true; questPoke(); }
    saveGame(); });
  return true;
});
{ const base=npcMarker; npcMarker=function(id){ if(id==='c_ottoline'&&x1pOn('c_logbook')&&x1pPagesHeld()>0) return '?'; return base(id); }; }

// ---------- the places the side quests need on the map (built after the world module's own build)
const X1P_TRAIL=(()=>{ const pts=[[7300,26260],[7050,25900],[7050,25400],[7020,25150],[6600,25120],[6300,25120],[5600,25520],[4600,25880],[3600,26080],[3200,26120],[3050,26400],[2700,26480],[2520,26600]], out=[];
  for(let i=1;i<pts.length;i++){ const [ax,ay]=pts[i-1], [bx,by]=pts[i], n=Math.max(1,Math.round(dist(ax,ay,bx,by)/140)); for(let k=0;k<n;k++) out.push([ax+(bx-ax)*k/n,ay+(by-ay)*k/n]); } out.push(pts[pts.length-1]); return out; })();
const X1P_PEP=[[3300,28400,'crab',2],[5200,28500,'c_gulper',1],[4500,27900,null,0]];
const X1P_SKIFF=[['quay',7400,26500,S('the Gearhaven quay','the Gearhaven quay')],['jetty',1360,27430,S('the Saltmarsh jetty','the Saltmarsh jetty')],['beach',11000,28800,S('the Lantern Point beach','the Lantern Point beach')],['break',7150,28950,S('the breakwater','the breakwater')]];
function x1pHouseNear(x,y,town){ let h=null,bd=1e18; for(const q of HOUSES){ if(q.k!=='house'||(town&&q.town!==town)) continue; const d=dist2(q.x,q.y,x,y); if(d<bd){ bd=d; h=q; } } return h&&bd<700*700?h:null; }
function x1pLM(o){ if(LANDMARKS.some(q=>q.id===o.id)) return null; o.noNudge=true; if(o.always===undefined&&'prompt' in o) o.always=true; return addLandmark(o); }
// x1_world has its own look-at landmark on some of the same spots (the wreck, the sealed stone in the dragon's eye):
// while ours is shown, theirs steps aside, so the quest prompt is the one Ash gets
function x1pOver(o,worldId){ const w=o&&LANDMARKS.find(q=>q.id===worldId); if(!w) return o;
  const p0=Object.getOwnPropertyDescriptor(w,'prompt')||{value:w.prompt};   // (only the prompt steps aside: its art stays)
  Object.defineProperty(w,'prompt',{configurable:true,enumerable:true,get(){ if(!(o.hidden&&o.hidden())) return null; return p0.get?p0.get.call(w):p0.value; }});
  return o; }
function x1pBuild(B){
  // Granny Oona's chimney nest and the empty post beside her house
  { const h=x1pHouseNear(1150,27050,'c_saltmarsh'), x=h?h.x+h.w*0.25:1180, y=h?h.y-h.h*0.42:26990;
    x1pLM({id:'c_lm_oonanest',k:'c_nest',x,y,house:h,hidden:()=>!x1pAt('c_oona',0)||!!X1P.carry,prompt:S('Lift the gull nest','Lift the gull nest'),draw:x1pDrawNest,act:x1pNestAct});
    x1pLM({id:'c_lm_oonapost',k:'c_post',x:h?h.x+h.w/2+60:1260,y:h?h.y+h.h/2+12:27080,hidden:()=>!X1P.carry,prompt:S('Set the nest down on the post','Put the nest on the post'),draw:x1pDrawPost,act:x1pPostAct}); }
  // Vesper's note drops (c_notes) and the Moon Ring
  // (x1_world gives the Gull's Rest a level 3 roof with a level 4 chimney: the note goes on the chimney top, so the
  //  claws are really needed; without that world it sits on the house front as before)
  { const h=x1pHouseNear(4300,25850,'c_gullsrest'); let x=h?h.x-h.w*0.3:4320, y=h?h.y+h.h/2-6:25800;
    try{ if(typeof elevLvl==='function'&&elevLvl(4357,25752)>=4){ x=4357; y=25790; } }catch(e){}
    x1pLM({id:'c_lm_note3',k:'c_note',n:3,x,y,hidden:()=>!x1pR('c_brass')||!!G.flags.c_note3,prompt:S('Reach for the note on the chimney','Get the note on the chimney'),draw:x1pDrawNote,act:x1pNoteAct}); }
  x1pLM({id:'c_lm_note4',k:'c_note',n:4,x:8100,y:26900,hidden:()=>!x1pR('c_brass')||!!G.flags.c_note4,prompt:S('Reach for the note on the crane','Get the note on the crane'),draw:x1pDrawNote,act:x1pNoteAct});
  // note 5: x1_world's alcove behind the falls (reached by riding the shadow lane c_lane_falls from the Great Stair
  // landing) holds the note; the "look behind the falls" hint stays at the landing where the lane starts
  { const lane=LANDMARKS.find(q=>q.id==='c_lane_falls'&&q.pts&&q.pts.length>1);
    if(lane){ const a=lane.pts[0], b=lane.pts[lane.pts.length-1]; X1P.falls={x:b[0]+12,y:b[1]-22,r:95};
      x1pLM({id:'c_lm_note5',k:'c_note',n:5,x:X1P.falls.x,y:X1P.falls.y,hidden:()=>!x1pR('c_brass')||!!G.flags.c_note5,draw:x1pDrawNote});
      x1pOver(x1pLM({id:'c_lm_note5h',k:'c_note',n:5,x:a[0]-10,y:a[1],hidden:()=>!x1pR('c_brass')||!!G.flags.c_note5,prompt:S('Look behind the falls','Look behind the falls'),draw:()=>{},act:x1pNoteAct}),'c_lm_falls'); }
    else{ X1P.falls={x:7300,y:25180,r:95}; x1pLM({id:'c_lm_note5',k:'c_note',n:5,x:7300,y:25180,hidden:()=>!x1pR('c_brass')||!!G.flags.c_note5,prompt:S('Look behind the falls','Look behind the falls'),draw:x1pDrawNote,act:x1pNoteAct}); } }
  x1pLM({id:'c_lm_note6',k:'c_note',n:6,x:1300,y:22600,hidden:()=>!(G.flags.c_note3&&G.flags.c_note4&&G.flags.c_note5)||!!G.flags.c_note6,prompt:S('Read the note on the tallest stone','Read the note on the stone'),draw:x1pDrawNote,act:x1pNoteAct});
  // the silver footprints (c_gifts), drawn only at night
  X1P_TRAIL.forEach(([x,y],i)=>{ if(i<X1P_TRAIL.length-1) x1pLM({id:'c_lm_trail'+i,k:'c_trail',i,x,y,hidden:()=>true,draw:x1pDrawTrail}); });
  // three sea peppers on the Rockpools (c_whip)
  X1P_PEP.forEach(([x,y],i)=>x1pLM({id:'c_lm_pep'+(i+1),k:'c_pepper',i,x,y,hidden:()=>!x1pAt('c_whip',1)||!!G.flags['c_pep'+(i+1)],prompt:S('Pick the sea pepper','Pick the sea pepper'),draw:x1pDrawPepper,act:x1pPepperAct}));
  // the deck of the Saucy Gull (c_whip): the ghost comes at night, at low tide, for the chowder
  { const dk=x1pLM({id:'c_lm_deck',k:'c_deck',x:4600,y:28300,hidden:()=>!!G.flags.c_saltbeard_won&&!x1pOn('c_whip'),get prompt(){ return x1pAt('c_whip',3)&&!G.flags.c_chowder_set?S('Set the chowder on the deck','Put the chowder on the deck'):S('Look at the wreck','Look at the wreck'); },draw:x1pDrawDeck,act:x1pDeckAct});
    // x1_world has its own "Look at the wreck" 60 px south: while the deck is shown, the deck is the one prompt here
    x1pOver(dk,'c_lm_wreck'); }
  // the Clockwatch Hall weathervane (c_tail)
  // (on the Clockwatch Hall roof: with no roof height on the map, it sits on the ridge, reached from behind the hall)
  { const h=x1pHouseNear(6700,24440,null); if(h&&dist(h.x,h.y,6700,24440)<260&&x1pLvl({x:6700,y:24440})<=0) X1P.vaneAt=[h.x,h.y-h.h*0.46]; }
  x1pLM({id:'c_lm_vane',k:'c_vane',x:X1P.vaneAt?X1P.vaneAt[0]:6700,y:X1P.vaneAt?X1P.vaneAt[1]:24440,hidden:()=>!x1pAt('c_tail',1),prompt:S('Grab the mainspring','Grab the mainspring'),draw:x1pDrawVane,act:x1pVaneAct});
  // Gull Isle: Pearl's last page (c_logbook)
  x1pLM({id:'c_lm_gullisle',k:'c_isle',x:4100,y:29700,hidden:()=>!!G.flags.c_pg6,prompt:S('Look under the gull nests','Look under the nests'),draw:x1pDrawIslePage,act:()=>{ if(!x1pR('c_salt')){ x1pSay([x1pN(`Gulls. Hundreds of gulls. They glare at you. You glare back. Nobody wins.`,`Lots of gulls glare at you.`)]); return; } cPearlPage(6); }});
  // the Chalk Dragon's eye (c_chalk)
  x1pOver(x1pLM({id:'c_lm_eye',k:'c_eye',x:6950,y:21700,hidden:()=>!x1pAt('c_chalk',1),prompt:S('Look into the dragon’s eye','Look into the eye'),draw:x1pDrawEye,act:x1pEyeAct}),'c_lm_sealed');
  // skiff landings (c_regatta's Skiff Whistle)
  for(const [k,x,y,nm] of X1P_SKIFF) x1pLM({id:'c_lm_skiff_'+k,k:'c_skiff',key:k,x,y,hidden:()=>!G.flags.c_skiffs||(k==='break'&&!G.flags.c_spire_up),prompt:S('Call a skiff','Call a skiff'),draw:x1pDrawSkiff,act:x1pSkiffAct});
  // Ravel's treasure map: three X marks
  [[8400,23000,'c_lm_x1'],[3100,28500,'c_lm_x2'],[13600,28200,'c_lm_x3']].forEach(([x,y,id],i)=>x1pLM({id,k:'xmark',x,y,hidden:()=>!G.items.c_map||!!G.found[id],prompt:S('Dig at the X','Dig here'),act:o=>x1pDig(o,i)}));
  // x1_world dug its own chests at the same three X marks for the same map: Ravel's quest here is the one that counts
  for(const id of ['c_x_downs','c_x_pools','c_x_lantern']){ const w=LANDMARKS.find(q=>q.id===id); if(w) w.hidden=()=>true; }
  // Duchess on top of the Great Clock (THREADS 14.3), if the story module has not placed her
  x1pLM({id:'c_lm_duchess',k:'c_goat',x:7200,y:24600,hidden:()=>true,draw:x1pDrawDuchess});
  // the moving things: the nest on Ash's head, Bolt trotting after Ash, the third Bob walking home
  x1pLM({id:'c_lm_carry',k:'c_carry',x:0,y:20000,hidden:()=>true,draw:x1pDrawCarry});
  x1pLM({id:'c_lm_boltf',k:'c_boltf',x:0,y:20000,hidden:()=>true,draw:x1pDrawBoltF});
  x1pLM({id:'c_lm_bob3f',k:'c_bob3f',x:0,y:20000,hidden:()=>true,draw:x1pDrawBob3F});
}
{ const M=MAPS[1]; if(M){ const b0=M.build; M.build=function(B){ if(b0) b0.call(this,B); try{ x1pBuild(B); }catch(e){ console.error('x1_people build',e); } }; } }
const x1pLMid=id=>LANDMARKS.find(q=>q.id===id);

// ---------- c_oona: the nest, the post, the gulls, the stove
function x1pNestAct(o){
  if(!x1pHigh(o,'claws')){ x1pSay([x1pN(`On top of the chimney sits an enormous gull nest. In it sits an enormous gull. It's up on the roof. You'd have to climb.`,`A big gull nest is on the roof. You'd have to climb up.`)]); return; }
  x1pSay([x1pN(`On top of the chimney sits an enormous gull nest. In it sits an enormous gull. It looks at you like you owe it money.`,`A huge gull sits in a huge nest. It glares at you.`),x1pN(`You lift the whole nest, gull and all. The gull does not approve.`,`You lift the nest, gull and all.`)],()=>{
    X1P.carry={k:'nest',t:0}; X1P.gulls=[];
    for(let i=0;i<3;i++){ const a=i*TAU/3; const e=x1pFoe('c_gull','bat',player.x+Math.cos(a)*200,player.y+Math.sin(a)*160-60,{level:9}); e.x1pGull=true; e.hp=e.maxHp=Math.min(e.maxHp,30); X1P.gulls.push(e); }
    setBanner(S('Carry the nest to the empty post','Take the nest to the post'),S('The gulls are not happy about this.','The gulls are cross!'),2.4);
  });
}
function x1pPostAct(){
  if(!X1P.carry) return;
  X1P.carry=null; for(const e of X1P.gulls||[]) if(!e.dead){ e.dead=true; emit(e.x,e.y,8,{col:'240,240,240',glow:false,smin:30,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } X1P.gulls=[];
  G.flags.c_oona_nest=true; SFX.play('pickup');
  x1pSay([x1pN(`You set the nest on the post. The gull settles in, fluffs up, and gives you one last look. It might be a thank-you. It's probably not.`,`You put the nest on the post. The gull settles down.`)],()=>questPoke());
}
// the stove in Granny Oona's house, and Hettie's gear panel and bench (area objects added when the house is built)
{ const base=areaNPCs; areaNPCs=function(){ base(); try{ x1pAreaObjs(AREA); }catch(e){ console.error(e); } try{ x1pIndoorSpots(AREA); }catch(e){ console.error(e); } }; }
// the stock house layouts put shelves, desks and counters where a person's ix/iy spot is: then Ash cannot walk up to
// them, or the furniture's own prompt ("Browse the shelf") wins over "Talk to". Step such a person forward onto the
// floor, to the first spot where Ash can stand in front of them and their prompt is the nearest one.
function x1pIndoorSpots(A){
  if(!A||!A.npcs||!A.npcs.length) return;
  const reachOf=o=>(o.w?Math.max(o.w,o.h||0)/2:o.r||16)+34;
  const good=(x,y)=>{ const sx=x, sy=y+36;
    if(areaBlocked(x,y)||areaBlocked(sx,sy)||colAt(x,y,10)||colAt(sx,sy,12)) return false;
    for(const o of A.objs||[]){ if(o.broken) continue; const d=dist(sx,sy,o.x,o.y), r=reachOf(o); if(d<r&&!(dist(sx,sy,x,y)-70<d-r-2)) return false; }
    return true; };
  for(const n of A.npcs){ if(!n.id||!String(n.id).startsWith('c_')||good(n.x,n.y)) continue;
    let best=null;
    for(let dy=20;dy<=220&&!best;dy+=20) for(const dx of [0,-30,30,-60,60]){ if(good(n.x+dx,n.y+dy)){ best={x:n.x+dx,y:n.y+dy}; break; } }
    if(best){ n.x=best.x; n.y=best.y; if(n.home) n.home=[best.x,best.y]; }
  }
}
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&o.x1pAct){ o.x1pAct(o); return; } return base(o); }; }
{ const base=drawFurn; drawFurn=function(o,t){ if(o&&o.x1pDraw){ o.x1pDraw(o,t); return; } return base(o,t); }; }
function x1pAreaObjs(A){
  if(!A||A.kind!=='house') return;
  if(A.id==='h_c_oona'){
    const fp=A.objs.find(q=>q.k==='fireplace'); const sx=fp?fp.x:A.rx+A.rw*0.3, sy=fp?fp.y:A.ry+A.rh*0.32;
    A.objs=A.objs.filter(q=>q.k!=='fireplace'); A.lights=A.lights.filter(L=>!(L.obj&&L.obj.k==='fireplace'));
    const st={id:'c_stove',k:'c_stove',x:sx,y:sy,w:46,h:40,get lit(){ return !!G.flags.c_oona_lit; },x1pDraw:x1pDrawStove,
      prompt:()=>x1pAt('c_oona',1)?S('Light the old stove (breathe gently)','Breathe gently on the stove'):G.flags.c_oona_lit?S('Warm your claws','Warm your claws'):S('Look at the old stove','Look at the stove'),
      x1pAct:()=>{ if(x1pAt('c_oona',1)) setBanner(S('Breathe on the stove. Gently!','Breathe gently!'),S('Hold your fire breath for a moment, then stop.','Breathe a little, then stop.'),2.4); else if(G.flags.c_oona_lit){ player.hp=Math.min(player.maxHp,player.hp+20); x1pSay([x1pN(`The little stove ticks and glows. Granny Oona hums. You feel very warm.`,`The stove glows. You feel warm.`)]); } else x1pSay([x1pN(`An old iron stove, cold as a rock. A gull feather is stuck in the flue.`,`An old, cold stove.`)]); }};
    A.objs.push(st); A.lights.push({x:sx,y:sy-10,r:190,i:0,obj:st});
  }
  if(A.id==='h_c_hettie'){
    const gx=A.rx+A.rw*0.78, gy=A.ry+A.rh*0.2;
    // clear the corner for the gear panel and Bolt's bench
    A.objs=A.objs.filter(o=>{ if(o.k==='rug'||o.k==='window'||Math.abs(o.x-gx)>130||o.y<gy-40||o.y>gy+175) return true;
      for(const c of [o.col].concat(o.bars||[])) if(c){ removeCol(c); const i=A.cols.indexOf(c); if(i>=0) A.cols.splice(i,1); }
      A.lights=A.lights.filter(L=>L.obj!==o); return false; });
    for(let i=0;i<3;i++) A.objs.push({id:'c_gear'+i,k:'c_gear',i,x:gx-60+i*60,y:gy,w:40,h:40,x1pDraw:x1pDrawGear,
      prompt:()=>x1pAt('c_bolt',1)&&!G.flags.c_bolt_mesh?S('Turn the gear','Turn the gear'):null,
      x1pAct:o=>{ const R=G.flags.c_bolt_gears=G.flags.c_bolt_gears||[1,3,2]; R[o.i]=(R[o.i]+1)%4; SFX.play('ui'); if(R.every(r=>r===0)){ G.flags.c_bolt_mesh=true; SFX.play('shrine'); setBanner(S('Click! The gears mesh.','Click! The gears fit!'),S('Now one gentle breath on Bolt to blow out the dust.','Now breathe gently on Bolt.'),2.6); } }});
    A.objs.push({id:'c_boltbench',k:'c_bench',x:gx,y:gy+115,w:70,h:34,x1pDraw:x1pDrawBench,
      prompt:()=>x1pAt('c_bolt',1)?(G.flags.c_bolt_mesh?S('Blow the dust out of Bolt (one gentle breath)','Breathe gently on Bolt'):S('Bolt’s gears are stuck. Turn the gears on the wall first.','Turn the wall gears first.')):null,
      x1pAct:()=>{ if(G.flags.c_bolt_mesh) setBanner(S('One gentle breath','One gentle breath'),S('Breathe on Bolt for about a second, then stop.','Breathe for a second. Then stop.'),2.4); }});
  }
}
// gentle breaths: the stove (1 to 2 s), Bolt's ears (about 1 s), the third Bob (about 1 s, while he is dizzy)
{ const base=breathIgnite; breathIgnite=function(mx,my,ang,dt){ base(mx,my,ang,dt); try{ x1pBreath(mx,my,ang,dt); }catch(e){ console.error(e); } }; }
function x1pBreath(mx,my,ang,dt){
  if(G.mode!=='story') return;
  const hit=(x,y,r)=>inArcC(mx,my,ang,175,0.45,{x,y,r:r||20});
  const go=(key,x,y,r)=>{ if(!hit(x,y,r)) return; const b=X1P[key]||(X1P[key]={t:0}); b.t+=dt; b.last=G.time; if(Math.random()<0.3) emit(x+rand(-8,8),y+rand(-8,8),1,{col:'255,190,90',ang:-Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.4,lmax:.7,zmin:1.5,zmax:3,rise:15}); };
  if(AREA&&AREA.id==='h_c_oona'&&x1pAt('c_oona',1)){ const o=AREA.objs.find(q=>q.k==='c_stove'); if(o) go('stove',o.x,o.y,26); if(X1P.stove&&X1P.stove.t>2.0){ X1P.stove=null; x1pWhoomph(); } }
  if(AREA&&AREA.id==='h_c_hettie'&&x1pAt('c_bolt',1)&&G.flags.c_bolt_mesh){ const o=AREA.objs.find(q=>q.k==='c_bench'); if(o) go('boltb',o.x,o.y,30); if(X1P.boltb&&X1P.boltb.t>1.7){ X1P.boltb=null; x1pSay([x1pN(`Too hot! Bolt yelps, spins his tail and hides under the bench. Try again. Gently.`,`Too hot! Bolt hides. Try again, gently.`)]); } }
  const B=X1P.bob; if(B&&B.e&&!B.e.dead&&B.dizzy>0){ go('bobb',B.e.x,B.e.y,B.e.r+6); if(X1P.bobb&&X1P.bobb.t>1.8){ X1P.bobb=null; B.dizzy=0; B.e.stun=0; x1pBobSay(S('TICK TOCK! TOO HOT! TICK TOCK!','TOO HOT! TICK TOCK!')); } }
}
function x1pWhoomph(){ shake(5); emit(player.x,player.y-10,30,{col:'255,150,60',smin:60,smax:220,lmin:.3,lmax:.7,zmin:2,zmax:4}); SFX.play('boom'); x1pSay([x1pN(`WHOOMPH.`,`WHOOMPH!`),x1pL('c_oona',`Gently, duck! I'm fond of my eyebrows.`,`Gently, duck! Mind my eyebrows!`)]); }
function x1pBreathDone(){
  // a breath that stopped: judge it
  const S1=X1P.stove; if(S1&&G.time-S1.last>0.25){ X1P.stove=null; if(S1.t<1.0) setBanner(S('It smoulders. A little longer.','It smoulders. A bit longer.'),'',1.8); else { G.flags.c_oona_lit=true; SFX.play('shrine'); questPoke(); } }
  const S2=X1P.boltb; if(S2&&G.time-S2.last>0.25){ X1P.boltb=null; if(S2.t<0.6) setBanner(S('A little puff of dust. Not enough.','A little puff. A bit longer.'),'',1.8); else { G.flags.c_bolt_clean=true; x1pSay([x1pN(`One last gentle breath, and a little cloud of silver dust puffs out of Bolt's ears. His lamp eyes blink bright. His tail spins. He barks, once, perfectly.`,`Silver dust puffs out of Bolt's ears. His eyes light up. He barks!`),x1pL('c_bolt',`Bark!`,`Bark!`)],()=>questPoke()); } }
  const S3=X1P.bobb; if(S3&&G.time-S3.last>0.25){ X1P.bobb=null; const B=X1P.bob; if(B&&B.e&&!B.e.dead){ if(S3.t<0.6) x1pBobSay(S('tick... tock...','tick... tock...')); else x1pBobCalm(); } }
}
// ---------- c_notes: the note drops (ACT2 3.7) and Ash's replies
const X1P_NOTE={
  3:{t:S(`"If you're reading this, you climbed a chimney. Weird hobby. The gulls up here steal everything. Don't leave your lunch. - M."`,`"You climbed a chimney? Weird. The gulls steal lunch. - M."`),
    r:[[`The gulls took my lunch anyway. Hope you had yours.`,`The gulls ate my lunch. Hope you ate yours.`],[`I'll climb every chimney on this coast till I find you.`,`I'll climb every chimney to find you.`],[`I left you a sandwich. The gulls left you the crusts.`,`I left you a sandwich. Gulls ate it.`]]},
  4:{t:S(`"Cranes are for crates, not lizards. If you're up here, look at the harbor at night. Pretty, isn't it? Gran used to bring me. - M."`,`"Look at the harbor at night. Pretty, right? Gran used to bring me. - M."`),
    r:[[`It's beautiful. Your gran's right.`,`It's beautiful. Your gran is right.`],[`It'd be prettier with the lighthouse lit.`,`Prettier with the lighthouse lit.`],[`I can see my house from here. Wait. No I can't. I live in a valley.`,`I can see my house! No I can't.`]]},
  5:{t:S(`"Fine. You're good. But you're not me. You've got a mom and a mountain and real fire. You don't know what cold is. - V."`,`"You're good. But you have a mom and fire. You don't know cold. - V."`),
    r:[[`Then tell me. I'll listen.`,`Then tell me. I'll listen.`],[`I know what it's like to be scared, though.`,`I know what scared feels like.`],[`I know what cold is. It's when Mom opens the window in winter.`,`Cold is when Mom opens the window.`]]}
};
const x1pDarkFalls=()=>isNight()||x1pR('c_spire');
function x1pNoteAct(o){
  const n=o.n;
  if(n===3&&!x1pHigh(o,'claws')){ x1pSay([x1pN(`A folded note is tucked behind the chimney pot, way up high. You'd have to climb the chimney.`,`A note is up on the chimney. Climb up!`)]); return; }
  if(n===4&&!x1pHigh(o,'grapple')){ x1pSay([x1pN(`Something white flutters at the very top of the crane. Far too high to reach from here. A good grapple would do it.`,`A note flaps on top of the crane. Too high! Grapple up.`)]); return; }
  if(n===5){
    if(!hasAbil('shadow')) x1pSay([x1pN(`There's a narrow gap behind the falling water. Too narrow to walk through. A shadow might slip in.`,`A tiny gap behind the water. A shadow could slip in.`)]);
    else if(!x1pDarkFalls()) x1pSay([x1pN(`The lamps behind the falls are lit. Their light leaves no shadow to slip through. Come back after dark.`,`The lamps are lit. No shadow. Come back at night.`)]);
    else setBanner(S('Slip into the shadow of the falls','Dash into the falls’ shadow'),S('Shadow Dash into the gap behind the water.','Dash into the gap!'),2.6);
    return; }
  if(n===6&&isNight()&&!X1P.ringFoes){ X1P.ringFoes=true; for(let i=0;i<4;i++) x1pFoe('c_moth','bat',o.x+rand(-260,260),o.y+rand(-220,220),{}); x1pFoe('c_silkspinner','bat',o.x+240,o.y-160,{}); setBanner(S('The moths remember','The moths are coming!'),S('Something stirs in the birches.','Something stirs!'),2.2); }
  x1pReadNote(n);
}
function x1pReadNote(n){
  if(!G.quests.c_notes) startQuest('c_notes');
  if(n===6){ runDialogue(STORY.c_note6,()=>{ scene='play'; x1pHeart('c_moonring'); G.flags.c_note6=true; questPoke(); saveGame(); }); return; }
  const N=X1P_NOTE[n], tone=['kind','brave','silly'];
  runDialogue([['narr',N.t],ch('narr',S(`You turn the note over. There's room on the back for a reply. What do you write?`,`You can write a reply. What do you write?`),N.r.map((r,i)=>({t:S(r[0],r[1]),tone:tone[i],fn:()=>{ G.flags['c_reply'+n]=tone[i]; }}))),
    x1pN(`You tuck the reply where the note was. Somebody will find it. Somebody who climbs.`,`You leave your reply there.`)],()=>{ scene='play'; G.flags['c_note'+n]=true; questPoke(); saveGame(); });
}
function x1pNextNote(){ for(const n of [3,4,5]) if(!G.flags['c_note'+n]) return 'lm:c_lm_note'+n; return 'lm:c_lm_note6'; }
// ---------- c_gifts: the silver footprints (night only), from the Teapot to Cockle Cottage
function x1pTrailNext(){ const seen=G.flags.c_trail||0; for(let i=0;i<X1P_TRAIL.length;i+=4) if(!(seen&(1<<Math.floor(i/4)))){ const p=X1P_TRAIL[i]; return `xy:${Math.round(p[0])},${Math.round(p[1])}`; } const e=X1P_TRAIL[X1P_TRAIL.length-1]; return `xy:${e[0]},${e[1]}`; }
function x1pTrailTick(){
  if(!x1pAt('c_gifts',2)||AREA||!isNight()) return;
  const p=player; let seen=G.flags.c_trail||0;
  for(let i=0;i<X1P_TRAIL.length;i+=4){ const q=X1P_TRAIL[i]; if(dist2(p.x,p.y,q[0],q[1])<220*220&&!(seen&(1<<(i/4)))){ seen|=1<<(i/4); if(Math.random()<0.6) ftext(q[0],q[1]-20,S('silver prints...','silver prints...'),'#e0e8ff',11); } }
  G.flags.c_trail=seen;
  const e=X1P_TRAIL[X1P_TRAIL.length-1], n=X1P_TRAIL.length, got=[...Array(Math.ceil(n/4)).keys()].filter(k=>seen&(1<<k)).length;
  if(dist(p.x,p.y,e[0],e[1])<170&&got>=Math.ceil(n/4)*0.5){ G.flags.c_gift_trail=true; setBanner(S('The prints stop at Cockle Cottage','The prints stop here'),S('A little girl is humming a tune inside. The same tune.','Someone hums the same tune.'),3); questPoke(); saveGame(); }
}
// ---------- c_whip: the peppers and their guards, the deck
function x1pNextPepper(){ for(let i=0;i<3;i++) if(!G.flags['c_pep'+(i+1)]) return 'lm:c_lm_pep'+(i+1); return null; }
function x1pPepperTick(){
  if(!x1pAt('c_whip',1)||AREA) return;
  X1P.pepG=X1P.pepG||[];
  X1P_PEP.forEach(([x,y,type,n],i)=>{ if(!type||G.flags['c_pep'+(i+1)]||X1P.pepG[i]) return; if(dist(player.x,player.y,x,y)>520) return;
    const L=[]; for(let k=0;k<n;k++) L.push(x1pFoe(type==='crab'&&EDEF.crab?'crab':type,'slime',x+rand(-90,90),y+rand(-60,60),{})); X1P.pepG[i]=L; });
}
function x1pPepperAct(o){
  const i=o.i, g=X1P.pepG&&X1P.pepG[i];
  if(i===2&&!x1pHigh(o,'claws')){ x1pSay([x1pN(`A little red pepper grows on a ledge halfway down the cliff. You'd have to climb down to it.`,`A pepper grows on a cliff ledge. Climb down to it.`)]); return; }
  if(g&&g.some(e=>!e.dead)){ x1pSay([i===0?x1pN(`Two crabs click their claws at you. They will not share.`,`The crabs won't share!`):x1pN(`A Mudgulper burps at you from the sand. It thinks this pepper is its pepper.`,`A Mudgulper guards this pepper!`)]); return; }
  G.flags['c_pep'+(i+1)]=true; SFX.play('pickup'); emit(o.x,o.y,10,{col:'255,80,60',smin:30,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); giveItems({c_seapepper:1});
}
function x1pDeckAct(o){
  if(G.flags.c_saltbeard_won){ x1pSay([x1pN(`The wreck is quiet now. An empty bowl sits on the deck. Somebody has polished it.`,`The wreck is quiet. An empty bowl sits there.`)]); return; }
  if(!x1pAt('c_whip',3)||!G.items.c_chowder){ x1pSay([x1pN(`The wreck of the Saucy Gull, tilted on the rocks. Barnacles, kelp, and somewhere below, a chain that clanks now and then.`,`An old shipwreck. Somewhere a chain clanks.`)]); return; }
  if(G.flags.c_chowder_set) return;
  if(!G.flags.c_lowtide){ x1pSay([x1pN(`The tide is right up around the wreck. You'd need low tide to stand on the deck. (The Tide Clock in Saltmarsh is stuck.)`,`The tide is too high. Fix the Tide Clock first.`)]); return; }
  if(!isNight()){ x1pSay([x1pN(`The deck is empty and the sun is bright. Ghosts keep to dark nights. Come back after dark. (Old Tarbuckle will happily wait with you.)`,`Ghosts come out at night. Come back after dark.`)]); return; }
  // c_saltbeard_call is the flag x1_foes' own Saucy Gull site listens for (C1FOES.md 3.4)
  takeItems({c_chowder:1}); G.flags.c_chowder_set=true; G.flags.c_saltbeard_call=true; saveGame();
}
// the ghost fight: an open-world boss site on the wreck (the foes module ships c_saltbeard; a stand-in is made at world
// build if it does not)
if(typeof defineBoss==='function') defineBoss('c_saucygull',{boss:'c_saltbeard',at:{x:4600,y:28300,r:380,name:'The Wreck of the Saucy Gull',level:11},stage:'c_salt',
  open:()=>!!G.flags.c_chowder_set&&!G.flags.c_saltbeard_won,arena:{shape:'ring',r:330,style:'wood',tint:'#6a5a4a',glow:'150,210,255'},flyOK:false,music:'boss',
  intro:STORY.c_saltbeard_intro,outro:STORY.c_saltbeard_won,
  onWin(){ G.flags.c_saltbeard_won=true; G.flags.c_chowder_set=false; giveItems({c_chain:1,c_sock:1}); questPoke(); saveGame(); }});
{ const base=objectiveList; objectiveList=function(){ return base().filter(o=>o.site!=='c_saucygull'); }; }
function x1pStandInFoes(){
  if(typeof defineFoe!=='function'||typeof FK==='undefined') return;
  if(!EDEF.c_saltbeard) defineFoe('c_saltbeard',{boss:true,name:'Captain Saltbeard’s Ghost',title:S('The Ghost of the Saucy Gull','The ghost pirate'),short:'Saltbeard',r:22,hp:1100,speed:120,dmg:14,value:1000,lv:11,kbRes:0.1,dcol:'160,220,255',phases:[0.5],
    ai:FK.brain({move:'approach',stop:60,turn:2.2,cd:[0.9,1.5],moves:[{k:'slash',reach:80,half:1.1,windup:0.6,dmgN:14,kb:280,w:2},{k:'charge',min:120,max:460,dmgN:16,w:1}]}),
    draw3d:(e,fl)=>{ if(typeof foKnight==='function') foKnight(e,fl,false,false); }});
}
// ---------- c_tail: the weathervane and the gust; spring cores from dizzy Steam Rams
function x1pVaneAct(o){
  if(!x1pHigh(o,'grapple')){ x1pSay([x1pN(`The weathervane spins high on the Clockwatch Hall roof, shaped like a whistle. The old mainspring glints inside it. You'd have to grapple up.`,`The spring is in the weathervane, up high. Grapple up!`)]); return; }
  G.flags.c_mainspring=true; X1P.gust=null; giveItems({c_mainspring:1}); SFX.play('chest');
  setBanner(S('Got the mainspring!','Got the spring!'),S('Now get down before the wind does it for you.','Now get down!'),2.4);
}
function x1pVaneTick(dt){
  if(!x1pAt('c_tail',1)||AREA){ X1P.gust=null; return; }
  const o=x1pLMid('c_lm_vane'); if(!o) return;
  const near=dist(player.x,player.y,o.x,o.y)<120&&x1pHigh(o,'grapple');
  if(!near){ X1P.gust=null; return; }
  if(!X1P.gust){ X1P.gust={t:0}; setBanner(S('The wind is picking up!','Windy!'),S('Grab the mainspring before a gust blows you off.','Grab it before the wind blows you off!'),2.4); }
  X1P.gust.t+=dt; const lim=diffIdx===0?14:8;
  if(X1P.gust.t>lim-2&&Math.random()<0.2) emit(player.x+rand(-60,60),player.y+rand(-40,40),1,{col:'230,240,255',glow:false,ang:0,spread:0.3,smin:120,smax:260,lmin:.3,lmax:.6,zmin:2,zmax:4});
  if(X1P.gust.t>lim){ X1P.gust=null; const d=DOORS.find(q=>q.owner==='c_hester'); const s=nearestLand(d?d.x+80:o.x+80,d?d.y+120:o.y+260)||{x:player.x,y:player.y+200}; player.x=s.x; player.y=s.y; player.z=0; player.vz=0; shake(4); SFX.play('roll'); setBanner(S('WHOOSH!','WHOOSH!'),S('A gust blew you off the roof. Try again, quicker!','The wind blew you off! Try again.'),2.6); }
}
{ const base=killEnemy; killEnemy=function(e){ const ram=e&&!e.dead&&(e.type==='c_ram'||e.x1pRam)&&(e.stun>0||['dizzy','stun','stuck','open','recover'].includes(e.state)); base(e);
  try{ if(ram&&x1pAt('c_tail',0)&&(G.items.c_spring||0)<3){ emit(e.x,e.y,12,{col:'255,220,120',smin:40,smax:140,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); ftext(e.x,e.y-30,S('BOING!','BOING!'),'#ffe8a0',15); giveItems({c_spring:1}); } }catch(er){ console.error(er); } }; }
// ---------- c_chalk: the eye
function x1pEyeAct(){
  runDialogue([x1pN(`From the top of the hill, the whole Chalk Dragon blazes white across the Downs. Its tail curls. Its wings spread. It's waving.`,`The Chalk Dragon shines white. It's waving!`),
    x1pN(`In its eye, a little stone door you never noticed slides open, and warm air breathes out of the hill.`,`A little stone door opens in its eye. Warm air comes out.`),
    x1pL('c_barley',`(from far below) She's white again! Gerald! GERALD! ...He's fainted.`,`(far away) She's white! Gerald! ...He fainted.`)],()=>{ scene='play';
    x1pHeart('c_chalkeye'); G.flags.c_chalk_eye=true; G.flags.c_chalk_breath=true; if(G.shrines) G.shrines.c_s_chalk=true; questPoke(); saveGame(); });
}
// ---------- c_regatta's Skiff Whistle: sea fast travel between the landings
function x1pSkiffAct(o){
  const opts=X1P_SKIFF.filter(([k])=>k!==o.key&&(k!=='break'||G.flags.c_spire_up)).map(([k,x,y,nm])=>({t:S(`Row me to ${nm}`,`Go to ${nm}`),fn:()=>later(0.2,()=>{ if(typeof mapTravel==='function') mapTravel(x,y+30,{banner:nm}); })}));
  opts.push({t:S('Never mind','Never mind')});
  runDialogue([x1pN(`You blow the Skiff Whistle. A moment later one of Skipper Jo's cousins rows round the corner, waving.`,`You blow the whistle. A skiff rows up.`),ch('narr',S('Where to?','Where to?'),opts)],()=>{ scene='play'; });
}
// ---------- Ravel's treasure map
function x1pDig(o,i){
  if(G.found[o.id]) return; G.found[o.id]=true; SFX.play('chest'); shake(3);
  const say=(t,cb)=>runDialogue([t],()=>{ scene='play'; if(cb) cb(); saveGame(); });
  if(i===0) say(x1pN(`You dig up a little tin box. Inside: 70 coins and a note. "Ravel was here. Or a dog."`,`A tin box! 70 coins and a note: "Ravel was here."`),()=>addCoins(70,o.x,o.y));
  else if(i===1) say(x1pN(`You dig up a smugglers' purse, crusty with salt. 60 coins. Somebody called Bilgewater wrote his name on it.`,`A smugglers' purse! 60 coins.`),()=>addCoins(60,o.x,o.y));
  else say(x1pN(`You dig up an old lighthouse keeper's tin: 50 coins and a little brass lantern charm that feels warm.`,`An old tin: 50 coins and a warm charm.`),()=>{ addCoins(50,o.x,o.y); G.pendingBless++; later(0.6,offerPending); });
}
// ---------- c_bob: the third Bob wanders the Brass Yards; break his shield, then a gentle breath while he is dizzy.
// He is never destroyed: when his health runs out he just sits down, dizzy.
function x1pBobSay(t){ const B=X1P.bob; if(B&&B.e) bubble(B.e,t,{who:SPK.c_bob3.name,col:SPK.c_bob3.col,dy:-38}); }
function x1pBobTick(dt){
  const on=x1pAt('c_bob',0)||x1pAt('c_bob',1);
  if(!on||AREA){ if(X1P.bob&&X1P.bob.e&&!X1P.bob.e.dead&&!on){ X1P.bob.e.dead=true; } if(!on) X1P.bob=null; return; }
  const H=[11300,24400];
  if(!X1P.bob||!X1P.bob.e||X1P.bob.e.dead){
    if(dist(player.x,player.y,H[0],H[1])>950) return;
    const e=x1pFoe('c_tinman','knight',H[0],H[1],{leash:700}); e.x1pBob=true; e.look=SPECIAL.c_bob3.look; e.plume='#3a6ac8'; e.name='Bob'; e.questTag=false;
    for(let i=0;i<2;i++){ const t=x1pFoe('c_tickbug','slime',H[0]+rand(-120,120),H[1]+rand(-90,90),{}); t.x1pBobPal=true; }
    X1P.bob={e,dizzy:0,shieldT:0,saidT:0};
  }
  const B=X1P.bob, e=B.e;
  if(!G.flags.c_bob_found&&dist(player.x,player.y,e.x,e.y)<300){ G.flags.c_bob_found=true; setBanner(S('That’s the third Bob!','The third Bob!'),S('Blue plume. A name plate that says BOB. Silver dust leaking from his ears.','Blue plume. Silver dust in his ears.'),3); questPoke(); }
  B.saidT-=dt; if(B.saidT<=0&&dist(player.x,player.y,e.x,e.y)<380){ B.saidT=rand(4,7); x1pBobSay(B.dizzy>0?S('tick... tock... where... am... I...','tick... tock...'):pick([S('TICK TOCK TICK TOCK','TICK TOCK'),S('INTRUDER. TICK. TOCK.','TICK. TOCK.'),S('BOB. IS. BUSY.','BOB IS BUSY.')])); }
  if(B.shieldT>0){ B.shieldT-=dt; e.blocking=false; e.shield=false; if(B.shieldT<=0) e.shield=true; }
  if(e.p2shT>0&&B.shieldT<=0) B.shieldT=e.p2shT;
  if(B.dizzy>0){ B.dizzy-=dt; e.stun=Math.max(e.stun||0,0.3); e.blocking=false; if(B.dizzy<=0){ e.hp=Math.max(e.hp,e.maxHp*0.5); x1pBobSay(S('TICK! TOCK! BOB IS BACK!','TICK! TOCK!')); } }
}
function x1pBobDizzy(t){ const B=X1P.bob; if(!B) return; if(B.dizzy<=0) setBanner(S('Bob is dizzy!','Bob is dizzy!'),S('Now breathe on him gently. About one second.','Breathe on him gently. One second.'),2.4); B.dizzy=Math.max(B.dizzy,t||5); }
{ const base=damageEnemy; damageEnemy=function(e,amt,o){
  if(!(e&&e.x1pBob)) return base(e,amt,o);
  const B=X1P.bob; o=o||{};
  if(B&&(o.src==='hammer'||o.src==='whip'||o.src==='shield')&&B.shieldT<=0){ B.shieldT=8; e.blocking=false; e.shield=false; ftext(e.x,e.y-e.r-20,S('SHIELD OFF!','SHIELD OFF!'),'#ffd27a',13); }
  if(B&&B.dizzy>0) return 0;
  if(e.dead||e.invuln||e.spawnIn>0) return base(e,amt,o);
  if(e.hp-amt*(o.mult||1)<=1){ e.hp=1; e.flash=0.08; e.aggro=true; x1pBobDizzy(6); return 0; }   // never broken: he sits down
  const hp0=e.hp, r=base(e,amt,o);
  if(B&&(e.hp<=e.maxHp*0.35||(B.shieldT>0&&hp0>e.hp&&(o.src==='hammer'||o.src==='whip')))) x1pBobDizzy(4.5);
  return r; }; }
function x1pBobCalm(){
  const B=X1P.bob; if(!B||!B.e) return; const e=B.e; const at={x:e.x,y:e.y};
  e.dead=true; for(const q of G.enemies) if(q.x1pBobPal&&!q.dead){ q.dead=true; deathFx(q); }
  emit(at.x,at.y-10,24,{col:'220,225,240',glow:false,ang:-Math.PI/2,spread:1,smin:30,smax:110,lmin:.6,lmax:1.2,zmin:2,zmax:4,grow:6});
  X1P.bob=null; X1P.bob3follow=true; X1P.bob3={x:at.x,y:at.y,face:Math.PI/2,t:0};
  runDialogue([x1pN(`A puff of silver dust blows out of the blue-plumed watchman's ears. He blinks. He ticks. He salutes.`,`Silver dust puffs out of his ears. He blinks. He salutes.`),
    x1pL('c_bob3',`I'm Bob. Where am I? Why is there a lizard?`,`I'm Bob. Where am I? Why is there a lizard?`),x1pL('ash',`Your Bobs miss you. Come on. Let's go home.`,`Your Bobs miss you. Let's go home.`)],()=>{ scene='play'; G.flags.c_bob_calm=true; questPoke(); saveGame(); });
}

// ---------- c_bolt: Bolt trots after Ash from the crane to the workshop; the third Bob walks home the same way
function x1pFollowTick(dt){
  const p=player, fol=(o,back)=>{ const tx=p.x-Math.cos(p.facing)*back, ty=p.y-Math.sin(p.facing)*back, d=dist(o.x,o.y,tx,ty); if(d>900){ o.x=tx; o.y=ty; } const k=1-Math.exp(-dt*(d>200?5:3)); const ox=o.x, oy=o.y; o.x+=(tx-o.x)*k; o.y+=(ty-o.y)*k; o.moving=Math.hypot(o.x-ox,o.y-oy)>0.6; if(o.moving) o.face=Math.atan2(o.y-oy,o.x-ox); o.t=(o.t||0)+dt; };
  const bf=x1pLMid('c_lm_boltf');
  if(bf){ const on=!AREA&&G.flags.c_bolt_caught&&!G.flags.c_bolt_clean&&x1pOn('c_bolt'); if(on){ if(!X1P.boltF) X1P.boltF={x:p.x-40,y:p.y,face:0}; fol(X1P.boltF,46); bf.x=X1P.boltF.x; bf.y=X1P.boltF.y; } else { X1P.boltF=null; bf.x=0; bf.y=20000; } }
  const b3=x1pLMid('c_lm_bob3f');
  if(b3){ const on=!AREA&&x1pAt('c_bob',2)&&X1P.bob3follow!==false; if(on){ if(!X1P.bob3) X1P.bob3={x:p.x-50,y:p.y,face:0}; fol(X1P.bob3,58); b3.x=X1P.bob3.x; b3.y=X1P.bob3.y; } else { b3.x=0; b3.y=20000; } }
  const c=x1pLMid('c_lm_carry'); if(c){ if(X1P.carry&&!AREA){ c.x=p.x; c.y=p.y+2; } else { c.x=0; c.y=20000; } }
}
// ---------- Duchess on the top of the Great Clock (THREADS 14.3, sighting 2): once, walking near her up there
if(!STORY.c_duchess) STORY.c_duchess=[x1pN(`On the very top of the Great Clock, higher than any roof in Gearhaven, a goat is eating a weathervane.`,`On top of the Great Clock, a goat eats a weathervane.`),['goat',S(`Meh.`,`Meh.`)],
  x1pL('ash',`That's not Duchess the Second. That's DUCHESS. How did you get UP here? I needed CLAWS!`,`That's DUCHESS! How did you get up here? I needed CLAWS!`),['goat',S(`Meh.`,`Meh.`)],
  x1pN(`Duchess has left a little pile of coins by the hatch. Nobody knows where goats get coins. Nobody asks.`,`Duchess left some coins. Nobody knows where goats get coins.`),x1pDo(()=>{ G.flags.c_duchess=true; addCoins(30); gainXp(40); })];
const x1pDuchessUp=()=>!G.flags.c_duchess&&x1pR('c_brass');
function x1pDuchessTick(){
  if(AREA||!x1pDuchessUp()||scene!=='play') return;
  const o=x1pLMid('c_lm_duchess'); if(!o||dist(player.x,player.y,o.x,o.y)>110||!x1pHigh(o,'claws')) return;
  G.flags.c_duchess=true; const L=STORY.c_duchess.slice(); runDialogue(L,()=>{ scene='play'; saveGame(); });
}
// ---------- Granny Oona's very old biscuits and Tikka's lumpy bun heal Ash by themselves when he is badly hurt
function x1pSnackTick(){
  const p=player; if(p.dead||p.hp<=0||scene!=='play') return;
  if(p.hp<p.maxHp*0.25&&G.items.c_lumpybun){ takeItems({c_lumpybun:1}); p.hp=p.maxHp; setBanner(S('Tikka’s lumpy bun','Tikka’s bun'),S('Lumpy. Wonderful. All better.','All better!'),2.2); SFX.play('upgrade'); return; }
  if(p.hp<p.maxHp*0.3&&G.items.c_biscuit&&G.time>(X1P.biscT||0)){ X1P.biscT=G.time+6; takeItems({c_biscuit:1}); heal(p.maxHp*0.2); setBanner(S('One of Granny Oona’s very old biscuits','An old biscuit'),S('Crunch. +20% health. It tasted of the sea.','Crunch! +20% health.'),2.2); }
}
// ---------- snow on the coast (after the Spire): the coast folk put scarves on (a new look object, so the figures rebake)
function x1pSnowTick(){
  const on=!!G.flags.c_snow; if(X1P.snow===on) return; X1P.snow=on;
  const SC=['#c83a3a','#3a6ac8','#e8c03a','#5a9a5a','#c86a8a'];
  for(const c of X1P_CAST){ const C=CASTBY[c.id]; if(!C) continue; const b=X1P.base[c.id]||C.look; C.look=on?Object.assign({},b,b.scarf?{}:{scarf:SC[c.id.length%SC.length],scarfLen:1.2},c.id==='c_fig'?{hat:'beanie',hatc:'#e0b0c0'}:{}):b; }
  if(G.npcs) setupNPCs();
}
// ---------- the per-frame tick (outdoors and in houses)
function x1pFrame(dt){
  if(!G||G.mode!=='story'||!player) return;
  x1pTrustWatch(); x1pSnowTick();
  if(scene!=='play') return;
  x1pBreathDone(); x1pFollowTick(dt); x1pSnackTick();
  if(actOf(G.stage)<2&&!G.flags.c_done) return;
  x1pTrailTick(); x1pPepperTick(); x1pVaneTick(dt); x1pBobTick(dt); x1pDuchessTick();
  // the falls note: a Shadow Dash into the shadow behind the water, in the dark
  { const F=X1P.falls||{x:7300,y:25180,r:95};
    if(!AREA&&x1pR('c_brass')&&!G.flags.c_note5&&hasAbil('shadow')&&typeof p2Shadowed==='function'&&(p2Shadowed()||F.x!==7300)&&x1pDarkFalls()&&dist(player.x,player.y,F.x,F.y)<F.r&&!DLG){ x1pReadNote(5); } }
  // the notes quest starts when Ash reads note 2 in the Moth's Nest (the story module); a safety net if it did not
  if(!G.quests.c_notes&&(x1pR('c_light')||(AREA&&AREA.id==='c_mothnest'&&G.time-(X1P.nestT||G.time)>6))) startQuest('c_notes');
  if(AREA&&AREA.id==='c_mothnest'&&!X1P.nestT) X1P.nestT=G.time; if(!AREA) X1P.nestT=0;
  // gulls give up once the nest is down; the Moon Ring moths come back the next night
  if(!isNight()) X1P.ringFoes=false;
  // carrying the nest: walking up to the post sets it down (the gulls keep Ash "in combat", which hides prompts)
  if(X1P.carry&&!AREA&&!DLG){ const o=x1pLMid('c_lm_oonapost'); if(o&&dist(player.x,player.y,o.x,o.y)<44) x1pPostAct(); }
  // the Dog Chase starts when Ash comes near the cranes with the quest on that step
  if(!AREA&&x1pAt('c_bolt',0)&&!G.mini&&!G.flags.c_bolt_caught&&dist(player.x,player.y,7600,26520)<420) startMini('c_dogchase','c_bolt');
}
{ const base=updateComps; updateComps=function(dt){ base(dt); if(X1P.err>20) return; try{ x1pFrame(dt); }catch(e){ X1P.err++; console.error('x1_people',e); } }; }
// ---------- rests: Vesper's note after Granny Oona's stove (c_oona step 4), and the shrine's five colours (Act I 'warden')
function x1pRested(kind){
  if(G.mode!=='story'||curMap()!==1) return;
  if(x1pAt('c_oona',3)) later(1.2,()=>{ if(scene!=='play'){ later(2,()=>x1pRested(kind)); return; } runDialogue(STORY.c_oona_note,()=>{ scene='play'; if(!G.flags.c_oona_note){ G.flags.c_oona_note=true; x1pTrust(2); } questPoke(); saveGame(); }); });
  else if(kind==='shrine'&&G.choices.ending==='warden'&&G.flags.c_clock_on&&!G.flags.c_warden_whisper&&STORY.c_warden_whisper) later(1.4,()=>{ if(scene==='play') runDialogue(STORY.c_warden_whisper,()=>{ scene='play'; G.flags.c_warden_whisper=1; saveGame(); }); });
}
if(!STORY.c_warden_whisper) STORY.c_warden_whisper=[x1pN(`The shrine flame flickers red, then blue, then green, then gold, then white.`,`The shrine flame turns five colors.`),
  x1pL('iska',`(very far away, inside the flame) Little ember. We're still here. All five of us. Keep your fire close. It's getting dark out there.`,`We are still here, little ember. Keep your fire close.`),
  x1pL('bram',`(even further away) AND EAT YOUR VEGETABLES!`,`EAT YOUR VEGETABLES!`),x1pDo(()=>{ G.flags.c_warden_whisper=1; })];
{ const base=restAtShrine; restAtShrine=function(s){ base(s); try{ x1pRested('shrine'); x1pMailRest(); }catch(e){ console.error(e); } }; }
{ const base=innRest; innRest=function(){ base(); try{ x1pRested('inn'); x1pMailRest(); }catch(e){ console.error(e); } }; }
// ---------- minigames (a9g_mini.js format)
// c_dogchase: Bolt bolts over the Lower Town roofs, the cranes and a moored barge; follow with the grapple. He runs on
// whenever Ash gets close, and gets stuck on top of the east crane. Nothing fails it; lose him and he runs back to the quay.
const X1P_DOG=[[7600,26520,0],[7380,26300,1],[7700,26700,3],[7900,26820,0],[8100,26900,3]];
function x1pBoltAt(){ const M=G.mini; if(M&&M.kind==='c_dogchase') return `xy:${Math.round(M.bx)},${Math.round(M.by)}`; return `xy:${X1P_DOG[0][0]},${X1P_DOG[0][1]}`; }
MINI.c_dogchase={
  start(){ return {i:0,bx:X1P_DOG[0][0],by:X1P_DOG[0][1],run:false,z:0,face:0,far:0,sneeze:3,music:'arena'}; },
  update(M,dt){
    const P=X1P_DOG[M.i], last=M.i===X1P_DOG.length-1;
    if(M.run){ const d=dist(M.bx,M.by,P[0],P[1]), sp=300*dt; if(d<=sp){ M.bx=P[0]; M.by=P[1]; M.run=false; M.z=0; } else { const a=angTo(M.bx,M.by,P[0],P[1]); M.face=a; M.bx+=Math.cos(a)*sp; M.by+=Math.sin(a)*sp; M.z=Math.abs(Math.sin(G.time*9))*10; } return; }
    M.sneeze-=dt; if(M.sneeze<=0){ M.sneeze=5; bubble({x:M.bx,y:M.by},S('ACHOO! (clank)','ACHOO!'),{who:'Bolt',col:SPK.c_bolt.col,dy:-30}); }
    const d=dist(player.x,player.y,M.bx,M.by), lvlOK=!P[2]||x1pHigh({x:M.bx,y:M.by},'grapple');
    if(d<110&&lvlOK){
      if(!last){ M.i++; M.run=true; bubble({x:M.bx,y:M.by},pick([S('Bark! (whirr)','Bark!'),S('ACHOO! Bark!','ACHOO!'),S('Yip! (clank clank)','Yip!')]),{who:'Bolt',col:SPK.c_bolt.col,dy:-30}); SFX.play('pop'); return; }
      const L=[x1pN(`At the very top of the east crane, a small brass dog is shaking, sneezing, and spinning his tail so fast he's slowly lifting off.`,`On top of the crane, a little brass dog shakes and sneezes.`),
        x1pL('c_bolt',`Bark! (whirr) ...ACHOO. (clank) Bark?`,`Bark! ...ACHOO. Bark?`),x1pL('ash',`Hey, buddy. Hey. Let's go home.`,`Hey, buddy. Let's go home.`)];
      G.mini.done=true; runDialogue(L,()=>{ scene='play'; miniEnd(true,S('Caught Bolt!','Got Bolt!'),S('Take him home to Sprocket’s Workshop.','Take him home to the workshop.')); }); return; }
    if(d>1100){ M.far+=dt; if(M.far>12){ M.far=0; M.i=0; M.run=true; setBanner(S('Bolt ran back to the quay','Bolt ran back'),S('Follow him again!','Follow him!'),2); } } else M.far=0;
  },
  target:M=>({x:M.bx,y:M.by}),
  hud:M=>simplify(S('Catch Bolt! Follow him. Grapple up the cranes.','Catch Bolt! Grapple up the cranes.')),
  draw(M,t){ if(!G.mini||G.mini.done) return; if(inView(M.bx,M.by,80)) x1pDrawDog(M.bx,M.by-M.z,M.face,t,M.run); }
};
// c_regatta: eight buoys round the harbor against Jo's skiff, the Sea Biscuit (MINI.race on water). Easy: she waits at buoy 4.
const X1P_BUOY=[[7200,26820],[8450,27320],[7950,27020],[7600,28250],[7600,29300],[8400,29180],[6250,29120],[6700,26560]];
function x1pWaterOK(x,y){ try{ return !playerBlocked(x,y); }catch(e){ return true; } }
MINI.c_regatta={
  start(){
    const C=[7400,27600], bs=X1P_BUOY.map(([x,y])=>{ let px=x, py=y; for(let k=0;k<30&&!x1pWaterOK(px,py);k++){ px+=(C[0]-px)*0.12; py+=(C[1]-py)*0.12; } return {x:px,y:py}; });
    let len=dist(player.x,player.y,bs[0].x,bs[0].y); for(let i=1;i<bs.length;i++) len+=dist(bs[i-1].x,bs[i-1].y,bs[i].x,bs[i].y);
    const sp=diffIdx===0?205:diffIdx===2?265:235;
    return {bs,i:0,len,sp,jo:0,joWait:0,sx:player.x,sy:player.y,music:'arena'};
  },
  update(M,dt){
    const b=M.bs[M.i];
    if(dist(player.x,player.y,b.x,b.y)<72){ M.i++; SFX.play('pickup'); emit(b.x,b.y,14,{col:'255,220,120',smin:30,smax:100,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
      if(M.i>=M.bs.length){ miniEnd(true,S('You win the regatta!','You win!'),S('Talk to Skipper Jo. She is checking the rules.','Talk to Jo.')); return; } }
    // Jo sails the course; on Easy she waits at buoy 4 until Ash has rounded buoy 3
    const at4=x1pRaceLen(M,4);
    if(diffIdx===0&&M.jo>=at4&&M.i<3) M.joWait+=dt; else M.jo+=M.sp*dt;
    const n=G.npcs.find(q=>q.id==='c_jo'); if(n){ const p=x1pRaceAt(M,M.jo); n.x=p.x; n.y=p.y; n.face=p.a; n.moving=false; }
    if(M.jo>=M.len+M.sp*1.5) miniEnd(false,S('Skipper Jo wins!','Jo wins!'),S('So close. Talk to Jo for a rematch.','Talk to Jo to race again.'));
  },
  end(){ const n=G.npcs.find(q=>q.id==='c_jo'); if(n){ n.x=n.home[0]; n.y=n.home[1]; n.moving=false; } },
  target:M=>M.bs[Math.min(M.i,M.bs.length-1)],
  hud:M=>`${simplify(S('Regatta! Buoy','Buoy'))} ${Math.min(M.i+1,8)}/8 · ${simplify(S('Jo','Jo'))} ${Math.round(Math.min(1,M.jo/M.len)*100)}%`,
  draw(M,t){
    M.bs.forEach((b,i)=>{ if(!inView(b.x,b.y,60)) return; x1pDrawBuoy(b.x,b.y,i,i===M.i,i<M.i,t); });
    const p=x1pRaceAt(M,M.jo); if(inView(p.x,p.y,80)) x1pDrawSkiffBoat(p.x,p.y+6,p.a,t);
  }
};
function x1pRaceLen(M,k){ let L=dist(M.sx,M.sy,M.bs[0].x,M.bs[0].y); for(let i=1;i<k;i++) L+=dist(M.bs[i-1].x,M.bs[i-1].y,M.bs[i].x,M.bs[i].y); return L; }
function x1pRaceAt(M,s){ const pts=[{x:M.sx,y:M.sy}].concat(M.bs); let acc=0; for(let i=1;i<pts.length;i++){ const d=dist(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y); if(acc+d>=s){ const u=(s-acc)/d; return {x:lerp(pts[i-1].x,pts[i].x,u),y:lerp(pts[i-1].y,pts[i].y,u),a:angTo(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y)}; } acc+=d; } const L=pts[pts.length-1]; return {x:L.x,y:L.y,a:0}; }
// c_chalkwalk: 40 faint chalk marks round the Chalk Dragon on its hill, in order, before the dust blows away. A hit
// fades the last three; two Hushers and some tickbugs try to scuff the line on the way.
const X1P_CHALK=(()=>{ const P=[[-6.5,-1],[-5.5,-2],[-4.5,-1.5],[-3.5,-0.5],[-1.5,-1],[-0.5,-1.5],[1,-5],[2,-2],[3,-1],[5,0],[6.5,1],[6,2.5],[5,2],[3,1.5],[2.5,3],[1.8,3],[0,1.5],[-1.5,3],[-2.2,3],[-3,1],[-5,0.5],[-6.5,-1]].map(([x,y])=>[6600+x*118,21900+y*118]);
  let L=0; const seg=[]; for(let i=1;i<P.length;i++){ const d=dist(P[i-1][0],P[i-1][1],P[i][0],P[i][1]); seg.push(d); L+=d; }
  const out=[]; for(let k=0;k<40;k++){ let s=k/40*L, i=0; while(i<seg.length-1&&s>seg[i]){ s-=seg[i]; i++; } const u=s/seg[i]; out.push([lerp(P[i][0],P[i+1][0],u),lerp(P[i][1],P[i+1][1],u)]); } return out; })();
MINI.c_chalkwalk={
  start(){
    const ms=X1P_CHALK.map(([x,y])=>{ if(!blockedAt(x,y)) return {x,y,lit:false}; for(let r=20;r<120;r+=20) for(let a=0;a<TAU;a+=0.6){ const px=x+Math.cos(a)*r, py=y+Math.sin(a)*r; if(!blockedAt(px,py)) return {x:px,y:py,lit:false}; } return {x,y,lit:false}; });
    return {ms,i:0,limit:diffIdx===0?140:90,hp:player.hp,foes:[],spawned:false,music:'arena'};
  },
  update(M,dt){
    const m=M.ms[M.i];
    if(m&&dist(player.x,player.y,m.x,m.y)<50&&x1pHere()>=x1pLvl(m)){ m.lit=true; M.i++; SFX.play('pickup'); emit(m.x,m.y,8,{col:'255,255,255',glow:false,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.2,zmax:2.5});
      if(M.i>=M.ms.length){ miniEnd(true,S('The Chalk Dragon shines!','The Chalk Dragon shines!'),S('Climb to its eye at the top of the hill.','Go to the eye on the hilltop.')); return; } }
    if(!M.spawned&&M.i>=18){ M.spawned=true; const q=M.ms[24]; for(let k=0;k<2;k++) M.foes.push(x1pFoe('c_husher','cultist',q.x+rand(-120,120),q.y+rand(-90,90),{})); for(let k=0;k<3;k++) M.foes.push(x1pFoe('c_tickbug','slime',q.x+rand(-140,140),q.y+rand(-100,100),{})); for(const e of M.foes) e.mini=true; }
    if(player.hp<M.hp-0.5&&M.i>0){ const k=Math.min(3,M.i); for(let j=0;j<k;j++){ M.i--; M.ms[M.i].lit=false; } setBanner(S('Scuffed!','Scuffed!'),S('The last chalk marks fade. Keep going!','Some marks faded. Keep going!'),1.6); }
    M.hp=player.hp;
    if(M.t>M.limit) miniEnd(false,S('The chalk dust blew away!','The dust blew away!'),S('Talk to Old Barley to try again.','Talk to Barley to try again.'));
  },
  end(M){ for(const e of M.foes) if(!e.dead){ e.dead=true; deathFx(e); } },
  target:M=>M.ms[Math.min(M.i,M.ms.length-1)],
  hud:M=>`${simplify(S('The Chalk Dragon','Chalk Dragon'))} ${M.i}/40 · ${Math.max(0,Math.ceil(M.limit-M.t))}s`,
  draw(M,t){
    ctx.save(); ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=7;
    ctx.beginPath(); let on=false; for(let k=0;k<M.ms.length;k++){ const m=M.ms[k]; if(!m.lit){ on=false; continue; } if(!on){ ctx.moveTo(m.x,m.y); on=true; } else ctx.lineTo(m.x,m.y); } ctx.stroke();
    M.ms.forEach((m,k)=>{ if(!inView(m.x,m.y,40)) return; const nx=k===M.i; ctx.fillStyle=m.lit?'#ffffff':nx?`rgba(255,255,255,${0.55+0.35*Math.sin(t*6)})`:'rgba(230,230,220,.32)'; ctx.beginPath(); ctx.arc(m.x,m.y,m.lit?9:nx?10:7,0,TAU); ctx.fill(); if(nx){ ctx.strokeStyle='rgba(255,240,180,.8)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(m.x,m.y,18+3*Math.sin(t*5),0,TAU); ctx.stroke(); } });
    ctx.restore();
  }
};
// ---------- drawings (world coordinates, small and cheap; Storybook outlines)
const X1P_INK='rgba(28,17,12,.85)';
function x1pShadow(x,y,rx,ry){ ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,TAU); ctx.fill(); }
function x1pNestShape(x,y,gull){
  ctx.fillStyle='#8a6a3a'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y,20,9,0,0,TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='#5a4220'; ctx.lineWidth=1.2; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x-18,y+i*2.5); ctx.lineTo(x+18,y-i*2); ctx.stroke(); }
  if(gull){ ctx.fillStyle='#f4f4f0'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=1.8; ctx.beginPath(); ctx.ellipse(x,y-8,13,8,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x+9,y-14,6,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#9aa0aa'; ctx.beginPath(); ctx.ellipse(x-4,y-9,8,4,0.2,0,TAU); ctx.fill(); ctx.fillStyle='#f0b030'; ctx.beginPath(); ctx.moveTo(x+14,y-14); ctx.lineTo(x+21,y-12); ctx.lineTo(x+14,y-11); ctx.fill(); ctx.fillStyle='#14100c'; ctx.beginPath(); ctx.arc(x+10,y-15.5,1.4,0,TAU); ctx.fill(); ctx.strokeStyle='#14100c'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x+7,y-18); ctx.lineTo(x+12,y-17); ctx.stroke(); }
}
function x1pDrawNest(o){ const c=o.house&&o.house.chim; if(c&&!o.snap){ o.snap=1; o.x=c[0]; } if(!x1pAt('c_oona',0)||X1P.carry) return; ctx.save(); const ny=c?c[1]-2:o.y-34; x1pNestShape(o.x,ny,true); if(Math.sin(G.time*3)>0.6){ ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font=`800 10px ${UIF}`; ctx.textAlign='center'; ctx.fillText('!',o.x+22,ny-22); } ctx.restore(); }
function x1pDrawPost(o){ ctx.save(); x1pShadow(o.x,o.y+2,8,4); ctx.fillStyle='#7a5a32'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2; ctx.fillRect(o.x-4,o.y-30,8,32); ctx.strokeRect(o.x-4,o.y-30,8,32); ctx.fillStyle='#5a4220'; ctx.fillRect(o.x-6,o.y-32,12,4);
  if(G.flags.c_oona_nest) x1pNestShape(o.x,o.y-36,true); else if(X1P.carry&&Math.sin(G.time*5)>0){ ctx.strokeStyle='rgba(255,230,140,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(o.x,o.y-34,16,0,TAU); ctx.stroke(); } ctx.restore(); }
function x1pDrawCarry(o){ if(!X1P.carry||AREA) return; ctx.save(); x1pNestShape(o.x,o.y-58+Math.sin(G.time*6)*1.5,true); ctx.restore(); }
function x1pDrawNote(o){
  if(o.hidden()) return; const n=o.n, t=G.time;
  if(n===5&&!x1pDarkFalls()) return;
  ctx.save(); const y=o.y-(n===3?40:n===4?54:n===6?18:12)+Math.sin(t*2+n)*1.5;
  if(n===6){ ctx.fillStyle='#c8c0b0'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(o.x-16,o.y+6); ctx.lineTo(o.x-12,o.y-34); ctx.lineTo(o.x+12,o.y-36); ctx.lineTo(o.x+16,o.y+6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle='#c84a3a'; ctx.fillRect(o.x-6,o.y-14,12,9); ctx.strokeRect(o.x-6,o.y-14,12,9); }
  glowAt(o.x,y,26,'220,220,255',0.18+0.08*Math.sin(t*3));
  ctx.fillStyle='#f6f0e0'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=1.6; ctx.save(); ctx.translate(o.x,y-(n===6?20:0)); ctx.rotate(Math.sin(t*1.7+n)*0.15); ctx.fillRect(-7,-5,14,10); ctx.strokeRect(-7,-5,14,10); ctx.strokeStyle='#8a7aa0'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-4,-1); ctx.lineTo(4,-1); ctx.moveTo(-4,2); ctx.lineTo(2,2); ctx.stroke(); ctx.restore();
  ctx.fillStyle='#8a7aa0'; ctx.beginPath(); ctx.ellipse(o.x+9,y-8,3,2,0.6,0,TAU); ctx.ellipse(o.x+13,y-8,3,2,-0.6,0,TAU); ctx.fill();
  ctx.restore();
}
// the prints glitter: they are drawn after the night tint (drawTexts runs in world space right after the lights)
function x1pDrawTrail(o,glow){
  if(glow!==true||!x1pAt('c_gifts',2)||!isNight()) return; const a=X1P_TRAIL[o.i], b=X1P_TRAIL[o.i+1]; if(!b) return;
  const ang=angTo(a[0],a[1],b[0],b[1]), d=dist(a[0],a[1],b[0],b[1]), n=Math.max(1,Math.floor(d/46)), t=G.time;
  ctx.save(); for(let k=0;k<n;k++){ const u=k/n, x=lerp(a[0],b[0],u), y=lerp(a[1],b[1],u), s=(k+o.i)%2?1:-1, px=x-Math.sin(ang)*s*8, py=y+Math.cos(ang)*s*8, tw=0.6+0.35*Math.sin(t*4+k*1.7+o.i);
    ctx.shadowColor='rgba(200,215,255,.9)'; ctx.shadowBlur=6; ctx.fillStyle=`rgba(232,238,255,${tw})`; ctx.save(); ctx.translate(px,py); ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(0,0,7,3.6,0,0,TAU); ctx.fill(); for(const k2 of [-1,0,1]){ ctx.beginPath(); ctx.arc(8.6,k2*2.6,1.5,0,TAU); ctx.fill(); } ctx.restore();
    if(Math.random()<0.01) emit(px,py,1,{col:'220,225,255',ang:-Math.PI/2,spread:1,smin:5,smax:20,lmin:.5,lmax:1,zmin:1,zmax:2,rise:10}); }
  ctx.restore();
}
function x1pDrawPepper(o){
  if(G.flags['c_pep'+(o.i+1)]||!x1pOn('c_whip')) return; const t=G.time;
  ctx.save(); x1pShadow(o.x,o.y+3,10,4); ctx.fillStyle='#3a8a4a'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=1.6; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(o.x+s*6,o.y-2,7,3,s*0.5,0,TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle='#e8402a'; ctx.beginPath(); ctx.moveTo(o.x,o.y-4); ctx.quadraticCurveTo(o.x+8,o.y-10,o.x+3,o.y-22); ctx.quadraticCurveTo(o.x-6,o.y-12,o.x,o.y-4); ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(o.x+1,o.y-14,1.4,3,0.3,0,TAU); ctx.fill(); glowAt(o.x,o.y-12,18,'255,90,60',0.15+0.08*Math.sin(t*4)); ctx.restore();
}
function x1pDrawDeck(o){
  const t=G.time; ctx.save();
  if(G.flags.c_chowder_set&&!G.flags.c_saltbeard_won){ ctx.fillStyle='#d8d0c0'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(o.x,o.y-4,9,4,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#d8402a'; ctx.beginPath(); ctx.ellipse(o.x,o.y-5,7,2.5,0,0,TAU); ctx.fill(); glowAt(o.x,o.y-8,30,'255,90,60',0.25+0.1*Math.sin(t*5)); if(Math.random()<0.1) emit(o.x,o.y-6,1,{col:'230,230,230',glow:false,ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:.6,lmax:1.2,zmin:3,zmax:5,grow:5}); }
  else if(x1pAt('c_whip',3)&&isNight()&&Math.sin(t*0.7)>0.85){ ctx.fillStyle='rgba(160,220,255,.35)'; ctx.font=`800 12px ${UIF}`; ctx.textAlign='center'; ctx.fillText(S('clank... clank...','clank...'),o.x,o.y-40); }
  ctx.restore();
}
function x1pDrawVane(o){ if(!x1pAt('c_tail',1)) return; const t=G.time; ctx.save(); glowAt(o.x,o.y-30,24,'255,220,120',0.2+0.1*Math.sin(t*4)); ctx.strokeStyle='#e0b84a'; ctx.lineWidth=2.5; ctx.beginPath(); for(let k=0;k<4;k++){ const a=t*2+k; ctx.lineTo(o.x+Math.cos(a)*6,o.y-30+k*-3); } ctx.stroke(); ctx.restore(); }
function x1pDrawIslePage(o){ if(G.flags.c_pg6||!x1pR('c_salt')) return; const t=G.time; ctx.save(); glowAt(o.x,o.y-8,26,'255,240,200',0.2+0.1*Math.sin(t*3)); ctx.fillStyle='#efe2c0'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=1.5; ctx.save(); ctx.translate(o.x,o.y-8); ctx.rotate(0.2+Math.sin(t)*0.08); ctx.fillRect(-8,-6,16,12); ctx.strokeRect(-8,-6,16,12); ctx.restore(); ctx.restore(); }
function x1pDrawEye(o){ if(!x1pAt('c_chalk',1)) return; const t=G.time; ctx.save(); glowAt(o.x,o.y,40,'255,250,230',0.3+0.15*Math.sin(t*3)); ctx.fillStyle='#ffffff'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(o.x,o.y,22,12,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#3a3a3a'; ctx.beginPath(); ctx.ellipse(o.x,o.y,5,10,0,0,TAU); ctx.fill(); ctx.restore(); }
function x1pDrawSkiff(o){ if(!G.flags.c_skiffs||(o.key==='break'&&!G.flags.c_spire_up)) return; ctx.save(); ctx.fillStyle='#8a6a3a'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2; ctx.fillRect(o.x-3,o.y-26,6,28); ctx.strokeRect(o.x-3,o.y-26,6,28); ctx.fillStyle='#c83a2a'; ctx.beginPath(); ctx.moveTo(o.x+3,o.y-26); ctx.lineTo(o.x+18,o.y-21); ctx.lineTo(o.x+3,o.y-16); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
// (x1_story draws Duchess by its clock hatch when it is in the build: then she is drawn once, by it)
function x1pDrawDuchess(o){ if(!x1pDuchessUp()||typeof c1Hatch==='function') return; const v=X1P.duch||(X1P.duch={x:o.x,y:o.y,face:Math.PI*0.6,t:0,kind:'goat',moving:false}); v.x=o.x; v.y=o.y; v.t=G.time; if(T3.on&&T3B.goat) T3B.goat(v); else drawGoat(v); }
function x1pDrawDog(x,y,face,t,run){
  ctx.save(); ctx.translate(x,y); x1pShadow(0,8,13,5);
  const f=Math.cos(face)<0?-1:1; ctx.scale(f,1); const leg=run?Math.sin(t*20)*3:0;
  ctx.strokeStyle=X1P_INK; ctx.lineWidth=2; ctx.fillStyle='#c89a3a';
  for(const [lx,ph] of [[-7,1],[6,-1]]){ ctx.beginPath(); ctx.moveTo(lx,2); ctx.lineTo(lx+leg*ph,10); ctx.stroke(); }
  const g=ctx.createLinearGradient(0,-10,0,6); g.addColorStop(0,'#ffe08a'); g.addColorStop(1,'#b8862a'); ctx.fillStyle=g;
  ctx.beginPath(); ctx.ellipse(0,-2,12,7,0,0,TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(11,-9,7,6,0,0,TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#8a6a2a'; ctx.beginPath(); ctx.ellipse(9,-15,2.5,5,-0.4,0,TAU); ctx.fill(); ctx.fillStyle='#d8b050'; ctx.beginPath(); ctx.ellipse(13,-15,2.5,4,0.5,0,TAU); ctx.fill();
  ctx.fillStyle='#fff6c0'; ctx.beginPath(); ctx.arc(14,-10,2,0,TAU); ctx.fill(); glowAt(14,-10,6,'255,240,160',0.6);
  ctx.fillStyle='#2a1a08'; ctx.beginPath(); ctx.arc(17.5,-8,1.5,0,TAU); ctx.fill();
  ctx.save(); ctx.translate(-12,-5); ctx.rotate(t*(run?30:10)); ctx.fillStyle='#e8c060'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=1.2; for(let k=0;k<3;k++){ ctx.rotate(TAU/3); ctx.beginPath(); ctx.ellipse(4,0,4,1.6,0,0,TAU); ctx.fill(); ctx.stroke(); } ctx.restore();
  ctx.fillStyle='#a07a2a'; ctx.fillRect(-3,-12,3,4); ctx.fillRect(-5,-14,7,2);
  ctx.restore();
}
function x1pDrawBoltF(o){ if(!X1P.boltF||AREA) return; x1pDrawDog(o.x,o.y,X1P.boltF.face||0,G.time,!!X1P.boltF.moving); }
function x1pDrawBob3F(o){ if(!X1P.bob3||AREA||!x1pAt('c_bob',2)) return; const n=X1P.bob3; n.id='c_bob3'; n.kind='c_bob3'; n.look=SPECIAL.c_bob3.look; n.name='Bob'; drawNPC(n); }
function x1pDrawStove(o,t){
  const lit=!!G.flags.c_oona_lit; ctx.save(); x1pShadow(o.x,o.y+16,24,8);
  ctx.fillStyle='#3a3a42'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2.4; rrect(ctx,o.x-20,o.y-14,40,30,5); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#2a2a30'; ctx.fillRect(o.x-6,o.y-44,12,30); ctx.strokeRect(o.x-6,o.y-44,12,30);
  ctx.fillStyle=lit?'#ffb040':'#1a1a1e'; rrect(ctx,o.x-11,o.y-4,22,13,3); ctx.fill(); ctx.stroke();
  if(lit){ glowAt(o.x,o.y+2,60,'255,170,80',0.5+0.12*Math.sin(t*7)); if(Math.random()<0.15) emit(o.x,o.y-46,1,{col:'200,200,200',glow:false,ang:-Math.PI/2,spread:0.3,smin:10,smax:30,lmin:.8,lmax:1.4,zmin:3,zmax:5,grow:5}); }
  else if(X1P.stove&&X1P.stove.t>0){ glowAt(o.x,o.y+2,30,'255,120,40',Math.min(0.5,X1P.stove.t*0.25)); }
  ctx.restore();
}
function x1pDrawGear(o,t){ const R=(G.flags.c_bolt_gears||[1,3,2])[o.i], a=R*Math.PI/2, ok=!!G.flags.c_bolt_mesh;
  ctx.save(); ctx.translate(o.x,o.y); ctx.fillStyle='#5a4a3a'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2; ctx.fillRect(-22,-22,44,44); ctx.strokeRect(-22,-22,44,44);
  ctx.rotate(a+(ok?t*1.5*(o.i%2?-1:1):0)); ctx.fillStyle=ok?'#f0c860':'#c8a048';
  ctx.beginPath(); for(let k=0;k<16;k++){ const r=k%2?16:12, b=k/16*TAU; ctx.lineTo(Math.cos(b)*r,Math.sin(b)*r); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#5a4a3a'; ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill(); ctx.fillStyle='#e8402a'; ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(-4,-8); ctx.lineTo(4,-8); ctx.fill();
  ctx.restore(); }
function x1pDrawBench(o,t){
  ctx.save(); ctx.fillStyle='#7a5a3a'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2; ctx.fillRect(o.x-34,o.y-8,68,14); ctx.strokeRect(o.x-34,o.y-8,68,14);
  if(x1pAt('c_bolt',1)||x1pAt('c_bolt',2)||(x1pQ('c_bolt')&&G.comp!=='c_bolt')){ x1pDrawDog(o.x,o.y-14,0,t,false); if(!G.flags.c_bolt_clean&&Math.random()<0.05) emit(o.x+14,o.y-26,2,{col:'210,210,230',glow:false,smin:10,smax:30,lmin:.4,lmax:.8,zmin:2,zmax:3}); }
  ctx.restore(); }
function x1pDrawBuoy(x,y,i,next,done,t){
  ctx.save(); const bob=Math.sin(t*2+i)*1.5; x1pShadow(x,y+5,10,4);
  ctx.fillStyle=done?'#8a8a8a':'#e8402a'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y+bob,10,7,0,0,TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#ffffff'; ctx.fillRect(x-10,y-2+bob,20,3); ctx.fillStyle='#4a3420'; ctx.fillRect(x-1.2,y-28+bob,2.4,26);
  ctx.fillStyle=done?'#9a9a9a':next?'#ffd84a':'#ffffff'; ctx.beginPath(); ctx.moveTo(x+1,y-28+bob); ctx.lineTo(x+16,y-23+bob); ctx.lineTo(x+1,y-18+bob); ctx.fill();
  ctx.fillStyle='#1a1410'; ctx.font=`800 9px ${UIF}`; ctx.textAlign='center'; ctx.fillText(String(i+1),x+7,y-21+bob);
  if(next){ ctx.strokeStyle=`rgba(255,220,120,${0.45+0.3*Math.sin(t*5)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,48,0,TAU); ctx.stroke(); }
  ctx.restore();
}
function x1pDrawSkiffBoat(x,y,a,t){
  ctx.save(); ctx.translate(x,y); ctx.rotate(a); x1pShadow(0,4,26,9);
  ctx.fillStyle='#8a5a2a'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(-24,-8); ctx.lineTo(18,-8); ctx.quadraticCurveTo(30,0,18,8); ctx.lineTo(-24,8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#c8a070'; ctx.fillRect(-18,-5,30,10);
  ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-30,-10); ctx.lineTo(-40,-14-Math.sin(t*8)*2); ctx.moveTo(-30,10); ctx.lineTo(-40,14+Math.sin(t*8)*2); ctx.stroke();
  ctx.fillStyle='#f0e8d8'; ctx.strokeStyle=X1P_INK; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(2,-2); ctx.lineTo(2,-34); ctx.lineTo(-16,-4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// ---------- Bolt the brass dog, a companion after c_bolt (a9i_comps.js): he nips foes, barks at hidden things nearby,
// and (for the Spire fight, x1_dun_b) barks at the real Vesper among her clones: see boltHelps()
CDEF.c_bolt={name:'Bolt',spk:'c_bolt',col:'#e8c060',r:10,hp:0.9,spd:250,home:'Sprocket’s Workshop',bg:'#3a2a12'};
CLINES.c_bolt={
  join:[S('Bark! (whirr whirr)','Bark!'),S('(Bolt spins his tail so fast he hovers a little.)','(Bolt spins his tail!)')],
  hello:[S('Bark! (tick)','Bark!'),S('(Bolt sneezes. ACHOO. Then looks proud.)','(Bolt sneezes. ACHOO.)')],
  come:[S('Bark! (clank clank clank)','Bark!'),S('(Bolt zooms over.)','(Bolt zooms over.)'),S('Yip!','Yip!')],
  stay:[S('(Bolt sits. His tail ticks like a clock.)','(Bolt sits.)'),S('Bark. (tick)','Bark.')],
  down:[S('Yelp! (sproing)','Yelp!'),S('(Bolt falls over. His key spins.)','(Bolt falls over.)')],
  up:[S('BARK! (whirr)','BARK!'),S('(Bolt winds himself back up.)','(Bolt gets up.)')],
  kill:[S('Bark bark!','Bark bark!'),S('(Bolt wags so hard his back half spins.)','(Bolt wags!)')],
  idle:[S('ACHOO. (clank)','ACHOO.'),S('(Bolt chases his own tail. He catches it. He is very surprised.)','(Bolt catches his tail!)'),S('(Bolt ticks happily.)','(Bolt ticks.)'),S('Bark? (whirr)','Bark?')],
  point:[S('BARK! BARK! (over there!)','BARK! BARK!'),S('Grrr... bark! (something hidden!)','Grrr... bark!')],
  low:[S('Whine. (creak)','Whine.')],lowAsh:[S('(Bolt nudges your hand. Whine.)','(Bolt nudges you.)')],
  boss:[S('GRRRR. (all his gears are spinning)','GRRRR.')],bye:[S('Bark! (He trots off home to the workshop.)','Bark! (He goes home.)')],
  cave:[S('(Bolt\'s lamp eyes light up the walls.)','(Bolt\'s eyes light the cave.)')],house:[S('(Bolt sniffs every corner. ACHOO.)','(Bolt sniffs. ACHOO.)')],
  region:[S('Bark! (new smells!)','Bark!')],cheer:[S('BARK! (you can do it!)','BARK!')],whistleDown:[S('(Bolt\'s key is still spinning.)','(Bolt is still dizzy.)')],
  night:[S('(Bolt\'s eyes glow like two little lamps.)','(Bolt\'s eyes glow.)')],rain:[S('(Bolt hides under your tail. Rust!)','(Bolt hides from the rain.)')]
};
const boltHelps=()=>x1pQ('c_bolt');
{ const base=canRecruit; canRecruit=function(id){ if(id==='c_bolt') return !!G&&G.mode==='story'&&x1pQ('c_bolt'); return base(id); }; }
{ const base=compFight; compFight=function(c,e,dt){ if(c.id!=='c_bolt') return base(c,e,dt);
  const d=dist(c.x,c.y,e.x,e.y), a=angTo(c.x,c.y,e.x,e.y), sp=CDEF.c_bolt.spd, reach=e.r+c.r+6;
  if(c.mode!=='stay'&&dist(c.x,c.y,player.x,player.y)>460){ compFollow(c,dt); return; }
  c.face=turnTo(c.face,a,9*dt);
  if(d>reach) compGo(c,e.x-Math.cos(a)*reach,e.y-Math.sin(a)*reach,sp*1.1);
  else if(c.cd2<=0){ c.cd2=0.9; compHit(e,7*c.k,{kb:150,ka:a}); hitSpark(e.x-Math.cos(a)*e.r,e.y-Math.sin(a)*e.r,'255,230,150'); SFX.play('hit',0.5); c.nip=0.18; } }; }
{ const base=compIdle; compIdle=function(c,dt){ base(c,dt); if(c.id!=='c_bolt'||G.inCombat) return;
  if(c.point){ c.point.t-=dt; c.face=turnTo(c.face,angTo(c.x,c.y,c.point.x,c.point.y),6*dt); if(c.point.t<=0) c.point=null; }
  else if(c.pointCd<=0){ c.pointCd=5; const s=nearSecret(player.x,player.y,420,'bolt'); if(s){ c.point={x:s.x,y:s.y,t:2.4}; bubble(c,pickC('c_bolt','point'),{who:'Bolt',col:CDEF.c_bolt.col,kind:'bang'}); c.lastSay=G.time; CFX.push({k:'spark',x:s.x,y:s.y,t:0,dur:2.4}); } } }; }
T3C.c_bolt=(c,v,down)=>{ if(down){ ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(1.2); x1pDrawDog(0,0,0,G.time,false); ctx.restore(); return; } x1pDrawDog(c.x,c.y,c.face,G.time,!!c.moving); };
{ const base=drawComp; drawComp=function(c,alpha){ if(c&&c.id==='c_bolt'&&!T3.on){ T3.on=true; try{ base(c,alpha); } finally { T3.on=false; } return; } return base(c,alpha); }; }
{ const base=compPortrait; compPortrait=function(id){ if(id!=='c_bolt') return base(id); if(CPORT.c_bolt) return CPORT.c_bolt; const S0=128, cv=mkCanvas(S0,S0), g=cv.getContext('2d'); g.translate(S0/2,S0/2+10); g.scale(S0/176,S0/176); try{ x1pFaceBolt(g); }catch(e){} return CPORT.c_bolt=cv; }; }
{ const base=compTalkOpts; compTalkOpts=function(id,n){ const o=base(id,n); try{ if(n&&id==='c_hettie'&&canRecruit('c_bolt')&&G.comp!=='c_bolt') o.push({t:S('Can Bolt come with me?','Can Bolt come with me?'),tag:'friend',fn:()=>later(0.2,()=>recruitComp('c_bolt')),then:[['c_hettie',S(`Take him! He's been sitting on that bench sneezing at the door all morning.`,`Take him! He's been waiting all morning.`)]],end:true}); }catch(e){} return o; }; }

// ---------- Pebble's letters c_pb_1..7 (ACT2 8.2, THREADS 9.3), through the shared helper (e7b_threads' PEBBLE_MAIL).
// Without it, a small stand-in delivers one due letter per rest on the coast, the same way.
const X1P_MAIL=[
  {id:'c_pb_1',from:'maren',when:()=>x1pR('c_coast'),lines:[
    {who:'maren',text:S(`Ash. The forge is very quiet without that stone humming in it. Catch that thief. Eat something. Love, Mom.`,`The forge is so quiet. Catch that thief. Eat something! Love, Mom.`),skipIf:()=>G.flags.a1_heart==='ward'},
    {who:'maren',text:S(`Ash. The mountain looks very bare without that stone on top. Catch that thief. Eat something. Love, Mom.`,`The mountain looks bare. Catch that thief. Eat something! Love, Mom.`),skipIf:()=>G.flags.a1_heart!=='ward'},
    {who:'maren',text:S(`P.S. The mountain is quiet. I keep looking at it anyway.`,`P.S. The mountain is quiet now.`),skipIf:()=>G.choices.ending!=='hero'},
    {who:'maren',text:S(`P.S. I climbed up and told your grandfather you'd gone south. He grunted. It was a nice grunt.`,`P.S. I told Grandpa. He grunted. A nice grunt.`),skipIf:()=>G.choices.ending!=='warden'},
    {who:'maren',text:S(`P.S. Your grandfather says, and I quote, "The hatchling will fail." Bertram charges extra to hear him say it.`,`P.S. Grandpa says you will fail. He is grumpy.`),skipIf:()=>G.choices.ending!=='heir'},
    {who:'maren',text:S(`P.S. Grandpa ate four of Bertram's buns and the doormat. He says hello. He says it with smoke.`,`P.S. Grandpa ate the doormat. He says hello.`),skipIf:()=>G.choices.ending!=='lantern'},
    x1pN(`Pebble eyes your coin pouch. Pebble is Elder Yara's crow, and Pebble does not work for free.`,`Pebble wants a coin. She does not work for free.`)]},
  {id:'c_pb_2',from:'morrow',when:()=>!!G.flags.dr_c_whisper,lines:[
    {who:'narr',text:S(`The letter smells of pumpkins.`,`The letter smells of pumpkins.`),skipIf:()=>G.choices.morrow==='jail'},
    {who:'narr',text:S(`The letter is stamped "Watch House Library. Please Return."`,`The letter is from the Watch House.`),skipIf:()=>G.choices.morrow!=='jail'},
    x1pL('morrow',`Young Ash. Word reaches even my pumpkins. A voice in your dreams that promises you things? I had one of those once. Do not answer it. Ever. Morrow.`,`A voice in your dreams? I had one once. Don't answer it. Morrow.`),
    {who:'morrow',text:S(`P.S. The cells are in alphabetical order now.`,`P.S. I tidied the cells.`),skipIf:()=>G.choices.morrow!=='jail'}]},
  {id:'c_pb_3',from:'yara',when:()=>(G.flags.moon==null?100:G.flags.moon)<100,lines:[
    x1pL('yara',`I counted the moon tonight. That sounds strange. But it is smaller, Ash. By about one bite. Pebble and I are keeping an eye on it.`,`The moon is one bite smaller. Pebble and I are watching it.`)]},
  {id:'c_pb_4',from:'maren',when:()=>!!G.flags.c_clock_on,lines:[
    x1pL('maren',`Ash! Pebble says you fixed a CLOCK. A whole city's clock! I told everyone. I told the chickens.`,`You fixed a whole city's clock! I told the chickens.`),
    x1pL('maren',`Yara says the best smith on that coast is Ingrid Anvilsong. Tell her I said her braids are too long for a forge. Tell her nicely. She's bigger than me.`,`Tell Ingrid her braids are too long for a forge. Nicely!`),
    {who:'maren',text:S(`Fennick sends a can of his Brightest Lamp Oil. He says it's for "any lamp that's having a bad night." He's been very good, you know. Every lantern, every night.`,`Fennick sent lamp oil, for any lamp having a bad night.`),skipIf:()=>G.choices.fennick!=='forgive'},
    {who:'maren',text:S(`Tikka sent you a bun. It's lumpy. It's wonderful. Eat it when you're hurt.`,`Tikka sent a lumpy bun. Eat it when you are hurt.`),skipIf:()=>!G.flags.tk_home},
    x1pL('maren',`Wendel wrote you a poem. "Ash, Ash, as brave as an eyelash." He says eyelashes are very brave. They stand in front of your eyes all day.`,`Wendel wrote a poem: "Ash, Ash, as brave as an eyelash."`),
    x1pL('maren',`Bertram's bakery exploded on Tuesday. Nothing to do with moths. Nobody was hurt. The ceiling is a skylight now.`,`Bertram's bakery blew up again. Nobody was hurt.`),
    x1pL('maren',`Eat something. Love, Mom. P.S. It's very cold here for summer. Odd.`,`Eat something. Love, Mom. P.S. It is cold here. Odd.`),
    x1pDo(()=>{ if(G.choices.fennick==='forgive') giveItems({c_lampoil:1}); if(G.flags.tk_home) giveItems({c_lumpybun:1}); })]},
  {id:'c_pb_5',from:'wren',when:()=>x1pR('c_salt'),lines:[
    x1pL('wren',`Dear Ash. I knew it! The torn page said Pearl sailed south, and now YOU have gone south. Well, walked. Same thing.`,`Dear Ash. Pearl went south, and so did you!`),
    x1pL('wren',`My old friend Ottoline keeps the Turning Library in Gearhaven. We have written to each other for thirty years and never once agreed about anything. It's been wonderful.`,`My friend Ottoline runs the library there. We never agree. It is wonderful.`),
    x1pL('wren',`Ask her about Pearl's logbook. And tell her she's wrong about commas. Your friend, Sister Wren.`,`Ask her about Pearl's logbook. Your friend, Wren.`)]},
  {id:'c_pb_6',from:'wren',when:()=>!!G.flags.c_diary_sent,lines:[
    x1pL('wren',`Ash. Ottoline copied out the moon letters from that girl's diary and sent them to me. They are very old. Older than the Wardens.`,`The moon letters in the diary are very, very old.`),
    x1pL('wren',`They spell the same two words over and over. "Night." And "Mother." I don't like this, Ash. I don't like it at all.`,`They spell "Night" and "Mother." I don't like it.`),
    x1pL('wren',`Keep your fire close. Wren.`,`Keep your fire close. Wren.`)]},
  {id:'c_pb_7',from:'quill',when:()=>(G.flags.moon==null?100:G.flags.moon)<100,lines:[
    x1pL('quill',`The moon is five percent smaller. I measured twice. I hate it.`,`The moon is smaller. I measured!`),
    x1pL('quill',`I have checked my telescope, my glasses and my eyes. All fine. The moon is not. Professor Quill.`,`It is not my glasses. Professor Quill.`)]}
];
X1P.mailShared=false;
try{ if(typeof PEBBLE_MAIL!=='undefined'&&PEBBLE_MAIL&&typeof PEBBLE_MAIL.push==='function'){ for(const m of X1P_MAIL) if(!PEBBLE_MAIL.some(q=>q.id===m.id)) PEBBLE_MAIL.push(m); X1P.mailShared=true; } }catch(e){}
function x1pMailRest(){
  if(X1P.mailShared||G.mode!=='story'||curMap()!==1) return;
  const m=X1P_MAIL.find(q=>!G.flags[q.id]&&q.when()); if(!m) return;
  later(3.4,()=>{ if(scene!=='play'||G.flags[m.id]) return; const who=SPK.pebble?'pebble':'c_pebble';
    runDialogue([[who,S('Caw.','Caw.')],x1pN(`Pebble lands on your horn with a letter.`,`Pebble brings a letter.`)].concat(m.lines),()=>{ scene='play'; G.flags[m.id]=1; if((G.coins||0)>0){ G.coins--; setBanner(S('Pebble took a shiny coin.','Pebble took a coin.'),'',1.8); } if(AREA&&AREA.id==='h_c_hettie'&&!G.flags.c_pb_gear){ G.flags.c_pb_gear=true; later(0.4,()=>runDialogue([x1pL('c_hettie',`THAT CROW TOOK MY SIZE FOUR!`,`THAT CROW TOOK MY GEAR!`)],()=>{ scene='play'; })); } saveGame(); }); });
}
// ---------- Tamsin's Act II verse, the epilogue lines (EPI.c), a dream echo
EV_TAMSIN.push([()=>!!G.flags.c_done,S(`\u{1F3B5} A thief in a moth mask ran off with our light, and Ash chased her south through the clockwork and night...`,`\u{1F3B5} Ash chased a thief through the night...`)]);
const X1P_EPI=[
  {pri:9,cond:()=>G.choices.c_vesper==='friend',line:['narr',S(`Vesper Saltwhistle still climbs the Great Clock every night. Now she sits on the top and waves at the moon, and Granny Oona leaves the window open for her.`,`Vesper still climbs the Great Clock. Now Gran leaves the window open.`)]},
  {pri:8,cond:()=>G.choices.c_vesper==='foe',line:['narr',S(`Nobody on the coast saw the Moth Mask again. But every winter, Granny Oona found a fish on her step, with a little bow on it.`,`Every winter, Gran found a fish on her step.`)]},
  {pri:6,cond:()=>x1pQ('c_oona'),line:['narr',S(`Granny Oona's stove never went out again. She keeps a kettle on it for anyone who climbs in through the window.`,`Gran's stove never went out again.`)]},
  {pri:5,cond:()=>x1pQ('c_bolt'),line:['narr',S(`Bolt the brass dog learned to fetch. Mostly he fetches Lord Whirligig's hat.`,`Bolt learned to fetch. Mostly hats.`)]},
  {pri:4,cond:()=>x1pQ('c_bob'),line:['narr',S(`Captain Hester promoted all three Bobs. They now have one very long badge between them.`,`All three Bobs got one long badge.`)]},
  {pri:3,cond:()=>!!G.flags.c_regatta_won,line:['narr',S(`The Harbor Regatta has a new rule: no dragons. It's called the Ash Rule.`,`The Regatta has a new rule: no dragons.`)]},
  {pri:2,cond:()=>true,line:['narr',S(`The Great Clock has not stopped once since. Clockkeeper Ambrose says "Tick." Everyone agrees.`,`The Great Clock never stopped again.`)]}
];
function x1pEpiPush(){ if(X1P.epi) return; try{ if(typeof EPI!=='undefined'&&EPI&&EPI.c&&typeof EPI.c.push==='function'){ for(const e of X1P_EPI) EPI.c.push(e); X1P.epi=true; } }catch(e){ /* EPI comes from a later module: tried again at world build */ } }
x1pEpiPush();
if(typeof DREAM_TALK!=='undefined'){ DREAM_TALK.c_twins=Object.assign(DREAM_TALK.c_twins||{},{c_oona:S(`You dreamed about Pearl? In a basket? Oh, duck. That's our family story. How did you know about the curtains?`,`You dreamed of Pearl? That's our story! How did you know?`)}); }
// ---------- the journal: Vesper's card (moth icons for trust) once her name is known
const x1pVesperKnown=()=>!!(G.flags.c_vesper_named||G.items.c_diary||G.items.c_letters||G.choices.c_vesper||x1pR('c_light'));
{ const base=renderJour; renderJour=function(){ base(); try{
  if(typeof jTab==='undefined'||jTab!=='people'||!G||actOf(G.stage)<2||!x1pVesperKnown()) return;
  const el=$('#jBody .ppl'); if(!el||el.querySelector('.x1pves')) return;
  const t=G.flags.c_trust|0, moths='<span style="color:#ffcf4a">'+'🦋'.repeat(t)+'</span><span style="opacity:.35">'+'🦋'.repeat(Math.max(0,7-t))+'</span>';
  const d=document.createElement('div'); d.className='x1pves';
  d.innerHTML=`<b>${escapeHtml(simplify(S('Vesper Saltwhistle','Vesper')))}</b> <span class="hz">${moths}</span><small>${escapeHtml(simplify(S('The Moth Mask, of Saltmarsh. Granny Oona’s granddaughter. The moths show how much she trusts you.','The Moth Mask. The moths show her trust.')))}</small>`;
  el.prepend(d); }catch(e){ console.error(e); } }; }

function x1pNightGlow(){
  if(AREA||!G||G.mode!=='story'||!isNight()||curMap()!==1||!x1pAt('c_gifts',2)) return;
  for(const o of LANDMARKS) if(o.k==='c_trail'&&inView(o.x,o.y,200)) x1pDrawTrail(o,true);
}
{ const base=drawTexts; drawTexts=function(){ try{ x1pNightGlow(); }catch(e){ X1P.err++; } return base(); }; }
// ---------- once every module has loaded (world build): missing stage ids, stand-in foes, the epilogue hook
function x1pInit(){ x1pStagesFallback(); x1pStandInFoes(); x1pEpiPush(); X1P.trustSeen=null; X1P.snow=null; }
{ const base=initWorld; initWorld=function(){ try{ x1pInit(); }catch(e){ console.error('x1_people init',e); } return base(); }; }
{ const base=loadGame; loadGame=function(s){ const r=base(s); X1P.trustSeen=null; X1P.snow=null; X1P.carry=null; X1P.bob=null; X1P.boltF=null; X1P.bob3=null; X1P.gust=null; X1P.pepG=null; return r; }; }
{ const base=newRun; newRun=function(m){ base(m); X1P.trustSeen=null; X1P.snow=null; X1P.carry=null; X1P.bob=null; X1P.boltF=null; X1P.bob3=null; X1P.gust=null; X1P.pepG=null; }; }

// ---------- debug hooks for tests
window.__ebX=Object.assign(window.__ebX||{},{c1p:{
  X1P, cast:()=>X1P_CAST.map(c=>c.id), lm:id=>{ const o=x1pLMid(id); return o?{x:Math.round(o.x),y:Math.round(o.y),hidden:o.hidden?!!o.hidden():false}:null; },
  npc:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); return n?{x:Math.round(n.x),y:Math.round(n.y)}:null; },
  where:id=>{ const c=CASTBY[id]; const n=G.npcs.find(q=>q.id===id); return {inside:c&&c.inside||null,door:(DOORS.find(d=>d.owner===id)||null)&&(({x,y,area})=>({x:Math.round(x),y:Math.round(y),area}))(DOORS.find(d=>d.owner===id)),out:n?{x:Math.round(n.x),y:Math.round(n.y)}:null}; },
  talk:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); if(!n) return false; talkTo(n); return true; },
  step:id=>{ const q=G.quests[id]; return q?{step:q.step,done:!!q.done,text:stepText(id)}:null; },
  page:cPearlPage, trust:()=>G.flags.c_trust|0, mini:()=>G.mini?{kind:G.mini.kind,i:G.mini.i,t:+G.mini.t.toFixed(1)}:null,
  miniState:()=>G.mini, bob:()=>X1P.bob&&X1P.bob.e?{x:Math.round(X1P.bob.e.x),y:Math.round(X1P.bob.e.y),hp:Math.round(X1P.bob.e.hp),max:X1P.bob.e.maxHp,dizzy:+X1P.bob.dizzy.toFixed(1),shield:+X1P.bob.shieldT.toFixed(1)}:null,
  bobHit:(src,amt)=>{ const e=X1P.bob&&X1P.bob.e; return e?damageEnemy(e,amt||40,{src:src||'slash',fx:e.x,fy:e.y-40}):0; },
  breath:(x,y,secs)=>{ const a=angTo(player.x,player.y,x,y); for(let t=0;t<secs;t+=1/30) x1pBreath(player.x,player.y,a,1/30); },
  breathDone:()=>{ for(const k of ['stove','boltb','bobb']) if(X1P[k]) X1P[k].last=-99; x1pBreathDone(); },
  waitDark:()=>{ G.tod=0.875; }, rest:()=>{ x1pRested('inn'); x1pMailRest(); }, mail:()=>X1P_MAIL.map(m=>[m.id,!!G.flags[m.id],!!m.when()]), mailShared:()=>X1P.mailShared,
  epi:()=>X1P_EPI.filter(e=>e.cond()).map(e=>e.line[1]), stages:()=>X1P_STAGES.map(s=>[s,stageAt(s)]), frame:x1pFrame, readNote:x1pReadNote, dig:x1pDig,
  dlg:()=>DLG?{who:$('#dlgWho').textContent,text:DLG.text,opts:DLG.opts?DLG.opts.map(o=>simplify(String(typeof o.t==='function'?o.t():o.t))):null,scene}:{scene},
  choose:i=>{ if(DLG&&DLG.opts){ DLG.chars=1e9; chooseOpt(i); return true; } return false; }, next:()=>{ if(!DLG) return false; DLG.chars=1e9; advanceDialogue(); return true; },
  // play dialogues through in one go (tests on a slow machine): picks are option substrings in priority order, or 'last'
  play:(picks,max)=>{ const said=[], used=new Set(); picks=picks||[]; let n=0;
    while(n<(max||300)){ n++;
      if(scene==='upgrade'&&typeof chooseUpgrade==='function'){ chooseUpgrade(0); continue; }
      if(!DLG) break;
      if(DLG.text) said.push([$('#dlgWho').textContent,DLG.text]);
      if(DLG.opts){ const lab=DLG.opts.map(o=>simplify(String(typeof o.t==='function'?o.t():o.t))); let i=-1; for(const p of picks){ if(p==='last'){ i=lab.length-1; break; } if(used.has(p)) continue; i=lab.findIndex(l=>l.toLowerCase().includes(String(p).toLowerCase())); if(i>=0){ used.add(p); break; } } if(i<0) i=lab.findIndex(l=>/^(Goodbye|Bye|Never mind|Just looking|Not right now|Nothing)/i.test(l)); if(i<0) i=0; said.push(['>',lab[i]]); DLG.chars=1e9; chooseOpt(i); }
      else { DLG.chars=1e9; advanceDialogue(); } }
    return said; },
  go:id=>{ const c=CASTBY[id]||SPECIAL[id]; if(c&&c.inside){ if(!AREA||AREA.id!==c.inside){ if(AREA) exitArea(true); enterArea(c.inside,DOORS.find(q=>q.area===c.inside)); } } else if(AREA) exitArea(true);
    const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); if(!n) return null; if(!AREA){ player.x=n.x; player.y=n.y+40; } else { player.x=n.x; player.y=n.y+50; } return n; },
  say:(id,picks)=>{ const n=window.__ebX.c1p.go(id); if(!n) return null; talkTo(n); return window.__ebX.c1p.play(picks); },
  reading:v=>setReading(v), simple:t=>simplify(t), prompt:()=>G.prompt?G.prompt.text:null, use:()=>{ if(G.prompt){ const p=G.prompt; G.prompt=null; p.act(); return true; } return false; },
  foe:(type,x,y)=>{ const e=x1pFoe(type,'kobold',x,y,{}); e.spawnIn=0; return e.id; },
  ram:()=>{ const e=x1pFoe('c_ram','kobold',player.x+80,player.y,{}); e.spawnIn=0; e.x1pRam=true; e.stun=2; killEnemy(e); return G.items.c_spring||0; }, killNear:(r)=>{ let n=0; for(const e of G.enemies) if(!e.dead&&!e.boss&&dist(e.x,e.y,player.x,player.y)<(r||900)){ killEnemy(e); n++; } return n; }
}});
