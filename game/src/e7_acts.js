
// ================= v9 acts engine (wave 1): the story goes on after the old ending
// Acts and stages after 'done', act screens, old finished saves, and the bridge from Act I to Act II: Lantern Night,
// the heist, the chase over the rooftops of Emberhollow, the southern cliffs and the Southern Pass.
// API (scratchpad/ACTS.md has examples): defineAct, defineStages, actOf, G.act, startAct, endAct, goStage, onTalk,
// actLabel, stageLabel, __eb.actStart(n). G.done now means "the whole game is finished"; "Act I is over" is
// G.flags.act1_done. Every act keeps its state in G.flags / G.items / G.quests with its prefix (a1_ c_ f_ m_ n_).

// ---------- acts
const ACT_ROMAN=['','I','II','III','IV','V'];
const ACT_PRE={1:'a1_',2:'c_',3:'f_',4:'m_',5:'n_'};
const ACTS={};
const STAGEDEF={};
const TALK_HOOKS=[];
const ACT_RT={last:null,prev:null,stageT:0,fromLoad:false,migrated:false,win:null,rested:false};
function actLabel(n){ return n>=5?'Finale':'Act '+(ACT_ROMAN[n]||n); }
// defineAct(n,{name,map,first?,arrive?,at?,kit?,intro?}): first = the stage startAct begins with, arrive = the stage
// __eb.actStart puts a test save in (default: the first stage of the act), at = where (default: that stage's `at`,
// else MAPS[map].spawn), kit = the fair loadout for a test save at the start of this act (merged over earlier acts)
function defineAct(n,def){ const A=ACTS[n]||(ACTS[n]={n,prefix:ACT_PRE[n]||'',kit:{}}); const kit=def&&def.kit; Object.assign(A,def||{}); if(kit) A.kit=Object.assign({},ACTS[n]._kit0||{},kit); return A; }
function actOf(st){
  const d=STAGEDEF[st]; if(d) return d.act;
  const i=stageAt(st); if(i>=0&&i<=stageAt('done')) return 1;
  for(let n=5;n>=2;n--) if(String(st||'').startsWith(ACT_PRE[n])) return n;
  return 1;
}
function actStages(n){ return STAGES.filter(s=>actOf(s)===n); }
// defineStages(n,[{id,chapter,card:[num,name],objectives:()=>[{text,x,y,area?,npc?}],hint,enter(o),update(dt),talk(n),
//   marker:[npcIds]|fn(id),soFar,idle,at:{x,y},mom:[lines],yara:[lines]}]). New ids go after the last stage of acts <= n
// (so 'done' and every Act I stage stay first and reached() keeps working); an id that exists is merged.
function defineStages(n,list){
  for(const s0 of list||[]){
    if(!s0||!s0.id) continue;
    const s=Object.assign(STAGEDEF[s0.id]||{},s0,{act:n});
    STAGEDEF[s.id]=s;
    if(stageAt(s.id)<0){ let at=STAGES.length; while(at>0&&actOf(STAGES[at-1])>n) at--; STAGES.splice(at,0,s.id); }
    if(s.chapter) CHAPTER[s.id]=s.chapter;
    if(s.mom) MOM_CH[s.id]=s.mom;
    if(s.yara) YARA_CH[s.id]=s.yara;
  }
  return list;
}
const stageDef=st=>STAGEDEF[st==null?(G&&G.stage):st]||null;
const fval=v=>typeof v==='function'?v():v;
// move the story to a registered stage: card (the stage's own unless o.card is false or a [num,name]), people, quest
// banner, save. The stage's enter hook runs on the next frame.
function goStage(id,o){
  o=o||{}; const d=STAGEDEF[id];
  ACT_RT.prev=G.stage; G.stage=id; G.done=false; if(actOf(id)>=2) G.flags.act1_done=true;
  const card=o.card===false?null:Array.isArray(o.card)?o.card:d&&d.card;
  if(card) showCard(simplify(card[0]),simplify(card[1]));
  ACT_RT.last=null; setupNPCs();
  if(!o.quiet) later(card?3.1:0.4,questUpdated);
  saveGame();
}
// the story talk hook: fn(npc) returns true when it handled the talk (runs before the stock story talk)
function onTalk(fn){ TALK_HOOKS.push(fn); return fn; }
// the label for a save slot, the title screen and the journal: "Act II · Lantern Night"
function stageLabel(s){
  const st=s?s.stage:G.stage, done=s?!!s.done:!!G.done, f=(s?s.flags:G.flags)||{};
  if(st==='done') return done&&f.act1_done?'The End':'Act I complete';
  if(done) return 'The End';
  return `${actLabel(actOf(st))} · ${CHAPTER[st]||'Lantern Day'}`;
}
function soFarText(st){ const d=STAGEDEF[st]; if(d&&d.soFar){ const v=fval(d.soFar); if(v) return v; } return SO_FAR[st]||''; }

// ---------- engine hooks: objectives, hints, markers, talk, the per-frame stage update
function stageObjs(){ const d=STAGEDEF[G.stage]; if(!d||!d.objectives) return []; let r=null; try{ r=d.objectives(); }catch(e){ console.error(e); } return (r||[]).filter(o=>o&&o.text); }
{ const base=objectiveList; objectiveList=function(){ const out=base(); if(G.mode!=='story'||G.done||out.some(o=>o.fight)) return out; for(const o of stageObjs()) out.push(o); return out; }; }
{ const base=questObjectiveWorld; questObjectiveWorld=function(){
  if(G.mode==='story'&&G.done) return {title:S('The End','The End'),text:S('You finished the whole story! Every land is yours to explore.','You won! Go explore anywhere.')};
  const o=base(), d=STAGEDEF[G.stage];
  if(o&&d){ if(!o.title) o.title=d.chapter||''; if(o.x==null&&d.idle){ const t=fval(d.idle); if(t) o.text=t; } }
  return o; }; }
{ const base=hintLine; hintLine=function(){ if(G&&!G.done){ const d=STAGEDEF[G.stage]; if(d&&d.hint){ const h=fval(d.hint); if(h) return h; } } return base(); }; }
{ const base=storyMarker; storyMarker=function(id){ if(base(id)) return true; const d=STAGEDEF[G.stage]; if(!d||!d.marker||G.done) return false; return typeof d.marker==='function'?!!d.marker(id):d.marker.includes(id); }; }
{ const base=storyTalk; storyTalk=function(n){
  if(G.mode==='story'){
    for(const fn of TALK_HOOKS){ try{ if(fn(n)) return true; }catch(e){ console.error(e); } }
    const d=STAGEDEF[G.stage]; if(d&&d.talk&&!G.done){ try{ if(d.talk(n)) return true; }catch(e){ console.error(e); } }
  }
  return base(n); }; }
{ const base=updateStory; updateStory=function(dt){ base(dt); if(G.mode!=='story'||G.done) return; try{ actsTick(dt); }catch(e){ console.error(e); } }; }
function actsTick(dt){
  hsVisual(dt);
  if(ACT_RT.last!==G.stage){
    const prev=ACT_RT.prev!=null?ACT_RT.prev:ACT_RT.last; ACT_RT.prev=null; ACT_RT.last=G.stage; ACT_RT.stageT=G.time;
    const d=STAGEDEF[G.stage]; if(d&&d.enter) try{ d.enter({load:ACT_RT.fromLoad,prev}); }catch(e){ console.error(e); }
    ACT_RT.fromLoad=false;
  }
  const d=STAGEDEF[G.stage]; if(d&&d.update) d.update(dt);
  if(ACT_RT.migrated&&scene==='play'&&!DLG){ ACT_RT.migrated=false; later(1.6,()=>{ showCard(simplify(S('Act I complete','Act I complete')),simplify(S('The story continues!','The story goes on!'))); later(3.2,()=>setBanner(S('The story continues!','The story goes on!'),S('Something is happening in Emberhollow tonight. Watch the sky for a crow.','Something is up in Emberhollow. Watch for a crow!'),4)); }); }
}
// G.act: the act of the current stage
{ const base=newRun; newRun=function(mode){ base(mode); try{ Object.defineProperty(G,'act',{get(){ return actOf(this.stage); },configurable:true,enumerable:false}); }catch(e){} HS_reset(); ACT_RT.last=null; ACT_RT.win=null; ACT_RT.rested=false; }; }

// ---------- saves: an old finished save (stage 'done', G.done true) is Act I complete, and the story goes on
{ const base=loadGame; loadGame=function(s){ base(s); try{ actsLoaded(s); }catch(e){ console.error(e); } }; }
function actsLoaded(s){
  HS_reset(); ACT_RT.last=null; ACT_RT.fromLoad=true; ACT_RT.rested=false;
  if(G.stage==='done'&&!G.flags.act1_done){ G.flags.act1_done=true; if(G.done){ G.done=false; ACT_RT.migrated=true; } G.flags.c_wait=G.flags.c_wait||0; }
  if(actOf(G.stage)>=2) G.flags.act1_done=true;
}
// resting (shrine, inn, your own bed) brings Yara's letter during the Act I free roam; after a later act's screen
// was closed with "Keep exploring", the next rest starts the next act (once it has stages)
function actsRested(){
  if(G.mode!=='story'||G.done) return;
  if(G.stage==='done'&&G.flags.act1_done){ ACT_RT.rested=true; return; }
  const n=G.act; if(n>=2&&G.flags['act'+n+'_done']&&ACTS[n+1]&&actStages(n+1).length) later(2.2,()=>{ if(G.act===n&&scene==='play') startAct(n+1); });
}
{ const base=restAtShrine; restAtShrine=function(s){ base(s); try{ actsRested(); }catch(e){} }; }
{ const base=innRest; innRest=function(){ base(); try{ actsRested(); }catch(e){} }; }

// ---------- act screens (the #victory overlay): an act is complete, then the story continues
(function winButton(){
  try{
    const ex=$('#bWinExplore'); if(!ex||$('#bWinNext')) return;
    const b=document.createElement('button'); b.type='button'; b.className='btn c hot'; b.id='bWinNext'; b.hidden=true; b.textContent='Continue the story';
    ex.parentElement.insertBefore(b,ex);
    b.addEventListener('click',()=>{ if(scene!=='victory') return; try{ SFX.play('ui'); }catch(e){} const w=ACT_RT.win; ACT_RT.win=null; scene='play'; hideAll(); if(w&&w.next) w.next(); });
  }catch(e){}
})();
function actScreen(o){
  scene='victory'; try{ SFX.play('win'); }catch(e){}
  $('#winTag').textContent=o.tag||''; $('#winTitle').textContent=simplify(o.title||''); $('#winMsg').textContent=simplify(o.msg||'');
  if(o.stats) $('#winStats').innerHTML=o.stats.map(([v,l])=>`<div class="stat"><b>${escapeHtml(String(v))}</b><span>${escapeHtml(simplify(l))}</span></div>`).join('');
  const nx=$('#bWinNext'), ex=$('#bWinExplore');
  if(nx){ nx.hidden=!o.next; nx.textContent=simplify(o.nextLabel||S('Continue the story','Keep going!')); }
  if(ex){ ex.textContent=simplify(o.exploreLabel||S('Keep exploring','Keep exploring')); ex.className=o.next?'btn c':'btn c hot'; }
  ACT_RT.win=o; show('victory');
}
const playClock=()=>{ const m=Math.floor(G.playTime/60), s=Math.floor(G.playTime%60); return m>=60?`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`; };
// endAct(n,{title,lines,next}): the act-complete card (title, a line, time, level, falls), then continue. The Finale
// (n 5) sets G.done (the whole game is finished) and shows the true final screen with no Continue button.
function endAct(n,o){
  o=o||{}; const A=ACTS[n]||{name:''}, fin=n>=5;
  G.flags['act'+n+'_done']=true; if(A.prefix) G.flags[A.prefix+'done']=true;
  if(fin) G.done=true;
  saveGame(true);
  actScreen({tag:fin?S('The End','The End'):`${actLabel(n)} complete`,title:o.title||A.name,msg:(o.lines||[]).map(t=>simplify(t)).join(' '),
    stats:[[playClock(),S('Time','Time')],[player.level,S('Level','Level')],[G.deaths|0,S('Times you fell','Falls')]],
    next:fin?null:()=>{ if(o.next) o.next(); else if(!startAct(n+1)) setBanner(S('To be continued!','To be continued!'),S('The next part of the story is still being written.','The next part is coming soon.'),3.4); },
    exploreLabel:fin?S('Keep exploring','Keep exploring'):S('Keep exploring for now','Explore for now'),
    explore:()=>setBanner(S('Free roam','Free roam'),fin?S('Every land is yours to explore.','Go anywhere!'):S('The story waits for you. Talk to people to find the way on.','The story waits for you.'),3)});
}
// startAct(n,{stage,quiet}): moves a save into act n. Earlier acts count as done; the act card, then the stage card.
function startAct(n,o){
  o=o||{}; const A=ACTS[n]; if(!A) return false;
  for(let k=1;k<n;k++) G.flags['act'+k+'_done']=true;
  G.done=false;
  const first=o.stage||A.first||actStages(n)[0]; if(!first) return false;
  G.stage=first; ACT_RT.last=null;
  const d=STAGEDEF[first];
  if(!o.quiet){ showCard(actLabel(n),simplify(A.name||'')); if(d&&d.card) later(3.1,()=>showCard(simplify(d.card[0]),simplify(d.card[1]))); later(d&&d.card?6.2:3.2,questUpdated); }
  if(A.intro) try{ A.intro(o); }catch(e){ console.error(e); }
  setupNPCs(); saveGame();
  return true;
}
// the Act I ending: after the epilogue, the victory screen says Act I is complete and the story goes on
{ const base=victory; victory=function(){ try{ ACT_RT.win=null; const nx=$('#bWinNext'), ex=$('#bWinExplore'); if(nx) nx.hidden=true; if(ex){ ex.textContent='Keep exploring'; ex.className='btn c hot'; } }catch(e){} base(); try{ if(G.mode==='story'&&!G.done&&G.flags.act1_done&&G.stage==='done') actOneScreen(); }catch(e){ console.error(e); } }; }
function actOneScreen(){
  const E=ENDINGS[G.choices.ending||'hero'], seen=Object.keys(store.get('eb_endings',{})).length;
  actScreen({tag:`Act I complete · Ending ${E.n} of 4`,title:E.title,
    msg:S('The First Flame is quiet. But a warm red stone glows in the forge, and tonight Emberhollow has one more party. The story is not over yet!','Grandpa is quiet now. But the story is not over yet!')+' '+(seen<4?simplify(S(`You've found ${seen} of 4 endings so far.`,`You found ${seen} of 4 endings.`)):simplify(S('You found every ending!','You found every ending!'))),
    next:continueLanternNight,nextLabel:S('Continue the story','Keep going!'),exploreLabel:S('Keep exploring Embermere','Explore Embermere'),
    explore:()=>{ G.flags.c_wait=0; setBanner(S('Free roam','Free roam'),S('Explore Embermere. Tonight is Lantern Night, and Yara will send word.','Explore! Yara will send word tonight.'),3.4); }});
}
// #bWinExplore (a12b_ui.js) calls this after it closes the screen
function actsWinExplore(){ const w=ACT_RT.win; ACT_RT.win=null; if(w&&w.explore){ w.explore(); return true; } return false; }

// ================= the Act I free roam (stage 'done'): Yara's letter comes when Ash rests, or after a little while
const LETTER_T=90;
function letterTick(dt){
  const F=G.flags; if(!F.act1_done||HS.crow) return;
  if(scene!=='play'||AREA||DLG||G.inCombat||(G.boss&&!G.boss.dead)||G.pendingBless>0||G.mini||player.dead) return;
  F.c_wait=(F.c_wait||0)+dt;
  if(ACT_RT.rested){ ACT_RT.rested=false; F.c_wait=Math.max(F.c_wait,LETTER_T-2.5); }
  if(F.c_wait>=LETTER_T) crowStart();
}
function crowStart(){ const p=player; HS.crow={mode:'in',t:0,x:p.x-560,y:p.y-420,x0:p.x-560,y0:p.y-420,flap:0}; try{ SFX.play('bird',0.9); }catch(e){} }
function letterLines(){
  return [xl('narr',`Flap. Flap. FLOMP. A crow lands right on your head. It's Pebble, Elder Yara's crow, with a letter tied to her leg.`,`A crow lands on your head! It's Pebble, Yara's crow. She has a letter.`),
    xl('c_letter',`"Dear Ash. Come home tonight for Lantern Night, the party after the party. There will be music and fireworks. Your mother made a cake shaped like you. It is a little scary. Love, Yara."`,`"Come home tonight for Lantern Night! Music! Fireworks! A cake shaped like you! Love, Yara."`),
    xl('c_letter',`"P.S. Pebble bites. Do not offer her cake."`,`"P.S. Pebble bites."`),
    xl('ash',`A party AND fireworks AND a cake shaped like me? I'm on my way!`,`Fireworks and cake? On my way!`),
    xl('narr',`Pebble nibbles your horn, just a little, and flaps away toward home.`,`Pebble bites your horn. Then she flies home.`)];
}
function crowArrived(){
  HS.crow.mode='sit';
  runDialogue(letterLines(),()=>{ scene='play'; if(HS.crow){ HS.crow.mode='out'; HS.crow.t=0; } G.flags.c_letter=true; startAct(2); });
}
// "Continue the story" on the Act I screen: home to Emberhollow at sundown, and Lantern Night begins
function continueLanternNight(){
  G.flags.c_wait=0;
  if(curMap()!==0||AREA||dist(player.x,player.y,POI.village.x,POI.village.y)>900) mapTravel(HV.arrive.x,HV.arrive.y,{noSave:true});
  G.tod=0.85; startAct(2);
}

// ================= Lantern Night: the heist (stages c_fest, c_clue, c_pass; c_coast starts the Clockwork Coast)
const HV={village:{x:2600,y:9300},green:{x:2620,y:9400},arrive:{x:2660,y:9470},rocket:{x:2712,y:9405},pedestal:{x:2398,y:9600},forge:{x:2300,y:9520},
  cliff:{x:2760,y:10918},ship:{x:2950,y:11066},gear:{x:2722,y:10892},pass:{x:3350,y:10830},cake:{x:2465,y:9292},
  talk:{maren:[2650,10842],yara:[2852,10838],wren:[2585,10808]},guest:[[2512,9468],[2770,9338],[2478,9396],[2752,9488],[2556,9226],[2826,9416]],wren:[2548,9430]};
// the thief's way over the roofs of Emberhollow and down to the cliffs: x,y where she stands, roof (on a house), g (a
// spot on the ground below for Ash; tests steer for it), wait (seconds she lingers), say, drop (barrels), bomb (smoke)
const HROUTE=[
  {x:2300,y:9492,roof:1,g:[2420,9478]},
  {x:2281,y:9180,roof:1,g:[2392,9296],say:0},
  {x:2067,y:9116,roof:1,g:[2165,9292]},
  {x:2133,y:8902,roof:1,g:[2236,8962],wait:0.9,say:1},
  {x:2468,y:8962,g:[2468,8962],drop:1},
  {x:2606,y:8866,roof:1,g:[2702,8988]},
  {x:2932,y:8898,roof:1,g:[2860,9018],say:2},
  {x:3062,y:9128,g:[3062,9128],bomb:1},
  {x:3178,y:9296,roof:1,g:[3092,9402],wait:0.9,say:3},
  {x:3002,y:9452,g:[3002,9452],drop:1},
  {x:2813,y:9490,roof:1,g:[2908,9560],say:4},
  {x:2719,y:9850,roof:1,g:[2805,9965]},
  {x:2594,y:9774,roof:1,g:[2528,9915]},
  {x:2455,y:9674,roof:1,g:[2526,9800],say:5},
  {x:2269,y:9688,roof:1,g:[2366,9792]},
  {x:2172,y:9905,g:[2205,9935],bomb:1,say:6},
  {x:2150,y:10090,g:[2150,10090],hide:[[2058,10046],[2242,10118],[2128,10232]]},
  {x:2420,y:10170,g:[2420,10170],drop:1,wait:0.6},
  {x:2900,y:9990,g:[2900,9990],say:7},
  {x:3180,y:10180,g:[3180,10180],bomb:1},
  {x:3215,y:10540,g:[3215,10540],wait:0.8,say:8},
  {x:3200,y:10700,g:[3200,10700]},
  {x:3110,y:10900,g:[3110,10900],say:9},
  {x:2760,y:10918,g:[2726,10900],end:1}
];
const HSAY=[
  [`Too slow, little dragon!`,`Too slow!`],
  [`Ooh, bouncy roofs! Emberhollow has the best roofs.`,`Ooh, bouncy roofs!`],
  [`Sorry about the barrels! Not really!`,`Sorry about the barrels!`],
  [`Still there? You're fast for someone with a tail!`,`Fast, for a tail!`],
  [`Cozy house. Is this one yours? Nice chimney!`,`Is this your house? Nice!`],
  [`Mmm, a bakery! It smells amazing. No time!`,`A bakery! Yum! No time!`],
  [`This way! No, that way! Ha!`,`This way! No, that way!`],
  [`Round the pond we go! Mind the frogs!`,`Round the pond! Mind the frogs!`],
  [`Still following? You're very stubborn. I like that.`,`Still here? You're stubborn!`],
  [`Almost there! Well. I'm almost there. You're almost here.`,`Almost there!`]
];
const HWAIT=[[`Yoo-hoo! Up here!`,`Up here!`],[`I can wait. I'm very patient. For a thief.`,`I can wait!`],[`*yawns* Are you coming?`,`*yawn* Coming?`],[`Lovely night for a chase!`,`Nice night for a chase!`]];
const HSHOUT=[[`Thief! THIEF!`,`Thief!`],[`She went that way!`,`That way!`],[`My hat! She bounced on my hat!`,`She bounced on my hat!`],[`Go get her, Ash!`,`Go, Ash!`],[`Was that a giant moth?`,`A giant moth?`],[`Not the roof! I just fixed the roof!`,`Not my roof!`]];
const HS={on:false,phase:'',t:0,thief:null,fw:[],rockets:[],flash:[],pops:[],bales:null,found:0,pets:[],smoke:[],bombs:[],obst:[],moth:null,ship:null,gear:null,crow:null,cam:null,runIn:null,
  talked:{},sent:{},shoutT:0,fwNext:0,bgT:0,chaseT:0,crash:false,toastT:0,coughT:0};
function HS_reset(){
  for(const b of HS.obst) if(b.col) removeCol(b.col);
  Object.assign(HS,{on:false,phase:'',t:0,thief:null,fw:[],rockets:[],flash:[],pops:[],bales:null,found:0,pets:[],smoke:[],bombs:[],obst:[],moth:null,ship:null,gear:null,crow:null,cam:null,runIn:null,talked:{},sent:{},shoutT:0,fwNext:0,bgT:0,chaseT:0,crash:false,toastT:0,coughT:0});
}
const festDecor=()=>!!G&&G.mode==='story'&&(G.stage==='c_fest'||G.stage==='c_clue'||G.stage==='c_pass');
const heartHome=()=>G.stage==='c_fest'&&!G.flags.c_stolen&&!HS.crash;
// friends Ash helped come to the party (up to six stand on the green; the first two say hello in the opening scene)
const GUESTS=[
  {id:'bertram',q:'bun',t:[`Lantern Buns for everybody! They only explode a little. That's the fun part.`,`Lantern Buns! They only explode a little.`]},
  {id:'juniper',f:'juniper_found',t:[`I mapped the whole festival, Ash. It's mostly snacks. The snacks are in the middle.`,`I mapped the party. It's mostly snacks.`]},
  {id:'pell',q:'thief',t:[`I'm keeping one eye on my purse tonight. Old habit! Ha. Who would steal at a party?`,`I'm watching my purse tonight. Ha!`]},
  {id:'hollis',q:'duchess',t:[`Duchess sends her love. She ate two party hats and a napkin. Best night of her life.`,`Duchess ate two party hats. She loves parties.`]},
  {id:'dell',q:'dell',t:[`I rowed all the way from Brindlecross! Well, I rowed, then I walked. The lake doesn't come this far.`,`I rowed here! Then I walked.`]},
  {id:'elka',q:'race',t:[`Race you to the cake! Ready, go! ...Okay, I already won. And ate some.`,`Race you to the cake! I won.`]},
  {id:'nib',q:'seek',t:[`I'm hiding! You can't see me! ...You can see me, can't you.`,`I'm hiding! Can you see me?`]},
  {id:'gorran',q:'mine',t:[`Brought you a lump of star-iron for the bonfire. It doesn't burn. It just sits there looking expensive.`,`I brought star-iron. It just looks shiny.`]},
  {id:'osric',q:'bounty',t:[`Captain Osric, on duty. Even at parties. ESPECIALLY at parties.`,`On duty, even at parties!`]},
  {id:'moss',q:'moss',t:[`I came all the way out of the bog for this! My knees are grumpy. My heart is very happy.`,`I came out of the bog for this!`]}
];
function guestList(){
  const out=[];
  for(const g of GUESTS){ if(out.length>=6) break; if(g.q&&!(G.quests[g.q]&&G.quests[g.q].done)) continue; if(g.f&&!G.flags[g.f]) continue; const c=CASTBY[g.id]||SPECIAL[g.id]; if(!c) continue; out.push(g); }
  return out;
}
// people for the party and for the send-off at the cliffs (the ones at the party are not at home indoors as well)
function festAway(id){ if(!festDecor()) return false; if(id==='wren') return true; return G.stage==='c_fest'&&GUESTS.some(g=>g.id===id)&&guestList().some(g=>g.id===id); }
{ const base=npcPresent; npcPresent=function(id){ try{ if(G&&G.mode==='story'&&festAway(id)) return false; }catch(e){} return base(id); }; }
{ const base=setupNPCs; setupNPCs=function(){ base(); try{ if(G&&G.mode==='story') festPeople(); }catch(e){ console.error(e); } }; }
function festPeople(){
  if(!festDecor()) return;
  for(const L of LANTERNS){ L.lit=true; G.lanterns[L.id]=true; }
  const put=(id,x,y)=>{ let n=G.npcs.find(q=>q.id===id); const c=CASTBY[id]||SPECIAL[id]; if(!c) return null; if(!n){ n=mkNPC(c,x,y); G.npcs.push(n); } n.x=x; n.y=y; n.home=[x,y]; n.walker=false; return n; };
  if(G.stage==='c_fest'){
    put('wren',HV.wren[0],HV.wren[1]); if(CASTBY.wren) CASTBY.wren.insideNow=false;
    guestList().forEach((g,i)=>{ const [x,y]=HV.guest[i]; put(g.id,x,y); });
  }else{
    for(const id in HV.talk){ const [x,y]=HV.talk[id]; put(id,x,y); }
    if(CASTBY.wren) CASTBY.wren.insideNow=false;
  }
}
// ---------- the heist, step by step
function festIntroLines(day){
  const L=[], e=G.choices.ending||'hero', gs=guestList();
  if(day) L.push(xl('narr',`You get home just as the sun goes down. By the time you reach the green, the first stars are out.`,`You get home at sunset. The stars come out.`));
  L.push(xl('narr',`That night, Emberhollow glowed. Paper lanterns on every roof. Music on the green. Somebody's goat was wearing a party hat.`,`That night, the village glowed. Lanterns everywhere! A goat in a party hat!`),
    xl('maren',`There's my kid! Come here. No, closer. I am hugging you and you can't stop me.`,`There's my kid! Come here for a hug!`),
    xl('ash',`Mom. Everybody's watching. Also my horns are stuck in your apron.`,`Mom! My horns are stuck in your apron.`),
    xl('yara',`Welcome to Lantern Night, Ash. The party after the party. I counted the lanterns. Twice. Four hundred and twelve.`,`Welcome to Lantern Night! I counted the lanterns. 412!`),
    xl('wren',`I came all the way from Brindlecross! I brought books. Nobody wanted books. Apparently this is a party.`,`I came from Brindlecross. I brought books. Nobody wanted books.`));
  for(const g of gs.slice(0,2)) L.push([g.id,S(g.t[0],g.t[1])]);
  if(G.flags.pip) L.push(xl('pip',`Mip! Mip mip!`,`Mip! Mip mip!`),xl('narr',`Pip has cake on his nose. He is extremely proud of it.`,`Pip has cake on his nose. He is proud.`));
  if(e==='lantern') L.push(xl('c_grandpa',`Is that cake? Is that a cake shaped like YOU? May I eat the tail?`,`Is that a cake shaped like you? Can I eat the tail?`),xl('maren',`After the fireworks, Grandpa. And wipe your feet.`,`After the fireworks, Grandpa. Wipe your feet.`));
  else if(e==='heir') L.push(xl('narr',`Grandpa watches the party from his birdcage on the cake table. He has been glaring at the cake for an hour.`,`Grandpa sits in his birdcage. He glares at the cake.`),xl('c_grandpa',`That stone by the forge was MY fire, you know. I'm only saying.`,`That stone was MY fire. Just saying.`));
  else if(e==='warden') L.push(xl('ash',`I carried the Ember Heart down from the summit, so everyone could see it tonight. It's warm as toast.`,`I brought the Ember Heart down from the mountain. It's warm!`),xl('maren',`It can sit by the forge for the night. Safest spot in the valley.`,`It can sit by the forge. It's safe there.`));
  else L.push(xl('maren',`And look. The Ember Heart, all cozy on its little stand by the forge. It hums when I hammer. I think it likes the music.`,`Look, the Ember Heart! It hums when I hammer.`));
  L.push(xl('narr',`By the forge, the Ember Heart glows on its stand, warm and red, like a little sun that came to the party.`,`The Ember Heart glows by the forge. Warm and red.`),
    xl('yara',`It's time. The first firework is yours, Ash. The big rocket by the well. One breath. A GENTLE breath.`,`Time for fireworks! Light the big rocket. Gently!`),
    xl('ash',`Gentle. I can do gentle. I have done gentle at least twice.`,`I can be gentle. I did it twice!`));
  return L;
}
function festStart(){
  const day=G.tod>0.24&&G.tod<0.8;
  HS.on=true; HS.phase='intro'; HS.t=0; if(day) G.fade=1; G.banner=null; G.bannerQ=[]; G.tod=Math.max(G.tod>0.5?G.tod:0.86,0.86);
  setupNPCs();
  HS.cam={x:HV.green.x,y:HV.green.y,k:0.55};
  if(G.flags.c_fest_seen){ HS.cam=null; HS.phase='rocket'; runDialogue([xl('yara',`There you are! The fireworks are waiting for you, Ash. The big rocket by the well. Gently!`,`There you are! Light the big rocket. Gently!`)],()=>{ scene='play'; questUpdated(); }); return; }
  runDialogue(festIntroLines(day),()=>{ scene='play'; HS.cam=null; G.flags.c_fest_seen=true; HS.phase='rocket'; questUpdated(); saveGame(); },{mood:'village'});
}
// the fireworks: the big rocket, then a show over the green [time, x offset, height, colour]
const FW_COLS=['255,200,90','255,110,110','140,210,255','190,140,255','140,255,170','255,160,220','255,240,200'];
const FW_PLAN=[[1.6,-220,250,1],[2.0,190,300,2],[2.5,-60,330,3],[2.9,260,220,4],[3.3,-300,280,5],[3.9,40,360,0],[4.4,-160,240,2],[4.8,200,300,1],[5.3,-40,280,3],[5.8,140,330,5],[6.2,-260,300,4]];
function rocketLaunch(){
  if(HS.phase!=='rocket') return;
  HS.phase='show'; HS.t=0; HS.fwNext=0; HS.crash=false; G.banner=null; G.bannerQ=[];
  HS.rockets.push({x:HV.rocket.x,y:HV.rocket.y-26,h:0,top:fwTop(HV.rocket.y-26,0.26),v:520,col:'255,214,120',big:true,t:0});
  try{ SFX.play('cast'); SFX.play('roar',0.4); }catch(e){} shake(3);
  emit(HV.rocket.x,HV.rocket.y-20,24,{col:'255,190,90',ang:-Math.PI/2,spread:0.5,smin:60,smax:220,lmin:.3,lmax:.7,zmin:1.5,zmax:3});
  const y=G.npcs.find(n=>n.id==='yara'); if(y) npcBubble(y,S(`Here we go!`,`Here we go!`));
}
// how high a rocket climbs so that it bursts in the upper part of the screen
function fwTop(y0,k){ const vh=H/zoom, ty=cam.y+vh*(k!=null?k:rand(0.2,0.4)); return clamp(y0-ty,120,560); }
function fwBurst(x,y,col,big){
  const n=big?80:52, sp=big?290:215;
  for(let i=0;i<n;i++){ const a=i/n*TAU+rand(-0.05,0.05), s=sp*(0.75+Math.random()*0.35); HS.fw.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(1.2,1.8),max:1.8,col:i%7===0?'255,250,235':col,sz:big?4.6:3.6,gl:i%5===0}); }
  if(big) for(let i=0;i<26;i++){ const a=rand(0,TAU), s=rand(20,90); HS.fw.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(1.4,2.2),max:2.2,col:'255,240,200',sz:2.4,tw:true}); }
  HS.pops.push({x,y,col,t:0,r:big?150:105});
  HS.flash.push({x,y:y+180,r:big?520:380,i:big?0.75:0.55,t:0,life:0.6});
  try{ SFX.play('boom',big?0.7:0.45); }catch(e){} if(big) shake(2);
}
function fwLaunch(dx,h,ci){ const x=HV.green.x+dx, y=HV.green.y+rand(-30,40); HS.rockets.push({x,y,h:0,top:fwTop(y),v:430+rand(-40,40),col:FW_COLS[ci%FW_COLS.length],t:0}); try{ SFX.play('cast',0.35); }catch(e){} }
function crowdSay(i){
  const L=[[`Ooooh!`,`Ooooh!`],[`Aaaah!`,`Aaaah!`],[`Do a dragon one!`,`Do a dragon one!`],[`Was that a moth? A really big moth?`,`Was that a big moth?`],[`My ears! My beautiful ears!`,`My ears!`]];
  const near=G.npcs.filter(n=>n.id!=='maren'&&dist2(n.x,n.y,HV.green.x,HV.green.y)<520*520);
  const n=near[(i*3+1)%Math.max(1,near.length)]; if(n) npcBubble(n,S(L[i][0],L[i][1]));
}
function theftLines(){
  const L=[xl('narr',`CRASH! Something tips over inside the forge. The Ember Heart's glow goes out like a blown candle.`,`CRASH! Something falls in the forge. The glow goes out.`),
    xl('maren',`The Heart! Ash, the Ember Heart is GONE!`,`The Heart! It's GONE!`),
    xl('narr',`On the forge roof stands a figure in a cloak like two great moth wings. A white mask hides her face. In her gloved hand, the Ember Heart glows.`,`On the roof stands a masked thief with moth wings. She has the Heart!`),
    xl('c_thief',`Lovely fireworks. So loud. So bright. Nobody even looked at the forge. Thank you, Emberhollow!`,`Lovely fireworks! Nobody looked at the forge. Thanks!`),
    xl('ash',`Hey! That's ours! Put it back, or I'll... I'll ask you VERY firmly!`,`Hey! That's ours! Put it back!`)];
  if(G.flags.pip) L.push(xl('pip',`MIP!!`,`MIP!!`));
  L.push(xl('c_thief',`Catch me first, little dragon. If you can.`,`Catch me first, little dragon!`));
  return L;
}
function cliffLines(){
  return [xl('c_thief',`Here we are. The edge of Embermere. You run fast, little dragon. Almost fast enough.`,`The edge of Embermere. You almost caught me!`),
    xl('ash',`Why do you even want it? It's a warm rock! A very important warm rock, but still!`,`Why do you want it? It's just a warm rock!`),
    xl('c_thief',`Because someone promised me it would fix something that has been broken for a long, long time.`,`Someone promised it would fix something broken.`),
    xl('c_thief',`...Sorry. Really. I'm a thief, not a liar.`,`Sorry. Really.`),
    xl('narr',`She spreads her cloak. It opens like a pair of enormous moth wings, dusty silver and violet, with two great golden eyes painted on them.`,`She opens her cloak. It's a pair of huge moth wings!`),
    xl('c_thief',`Goodnight, Emberblood!`,`Goodnight, Emberblood!`)];
}
function gearLines(){
  return [xl('narr',`A brass gear, still warm from her pocket. Tiny, perfect teeth. Stamped on one side in curly letters: GEARHAVEN.`,`A brass gear! It says GEARHAVEN.`),
    xl('ash',`Gearhaven. Okay, Gearhaven. I'm coming for you. Right after I find out where you are.`,`Gearhaven. I'm coming! Wherever you are.`),
    xl('narr',`Footsteps pound up the path behind you. Mom, Elder Yara and Sister Wren, all very out of breath.`,`Mom, Yara and Wren come running.`)];
}
const CLUE_TALK={
  maren:()=>[xl('maren',`Ash! Are you hurt? Let me see your tail. All of it. Good.`,`Are you hurt? Let me see. Good.`),
    xl('ash',`She got away, Mom. On a boat with a moth sail. But she dropped this.`,`She got away on a boat. But she dropped this.`),
    xl('maren',`Brass. Lovely work. Look at those teeth, every one perfect. Whoever made this has a better workshop than mine, and I hate that.`,`Brass! Great work. Better than mine. I hate that.`),
    xl('maren',`And Ash? The Heart is hot as a coal. I can't hold it without tongs. She picked it up like a bun.`,`The Heart is so hot! She held it like a bun.`),
    xl('ash',`So she's... fireproof?`,`So she's fireproof?`),
    xl('maren',`So she's something. Be careful.`,`She's something. Be careful.`)],
  yara:()=>[xl('yara',`Gearhaven. I haven't heard that name in fifty years. Let me see that.`,`Gearhaven! Let me see.`),
    xl('yara',`It's a port of tinkerers on the Clockwork Coast. Clock towers, steam, and the loudest gulls in the world. Down the cliffs and beyond the Southern Pass.`,`It's a port by the sea. Clocks, steam, loud gulls. Past the Southern Pass.`),
    xl('yara',`The pass is the old road down the cliffs, just east of here by the signpost. Mind the steps. There are two hundred and six. I counted. Twice.`,`The pass is east, by the signpost. 206 steps. I counted.`)],
  wren:()=>[xl('wren',`A moth-wing cloak? A white mask? Ash. ASH! That was the Moth Mask!`,`Moth wings and a mask? That was the Moth Mask!`),
    xl('ash',`The what?`,`The what?`),
    xl('wren',`The thief of Gearhaven! A legend! I have three books about her. Two of them are wrong and one of them bit me.`,`A famous thief! I have three books about her. One bit me.`),
    xl('wren',`In every story, the Moth Mask only steals things that glow. Lamps. Gems. A lighthouse, once. Never anything to sell. Curious, isn't it?`,`She only steals things that glow. Never to sell. Odd!`)]
};
function sendOffLines(){
  const L=[xl('maren',`So. You're going after her.`,`So. You're going after her.`),
    xl('ash',`I have to, Mom. The Heart is the last of the First Flame. If somebody bad wants it, that's... bad.`,`I have to. Someone bad wants the Heart.`),
    xl('maren',`...Fine. But you write. You eat. You take a scarf, the sea is windy. And you come HOME.`,`Fine. Write. Eat. Take a scarf. Come home.`),
    xl('yara',`Pebble will find you wherever you go. She always does. Usually at breakfast.`,`Pebble the crow will find you.`),
    xl('wren',`Take notes! Draw everything! Especially the clocks!`,`Take notes! Draw the clocks!`)];
  if(G.flags.pip) L.push(xl('pip',`Mip!`,`Mip!`),xl('narr',`Pip is coming too. That was never a question.`,`Pip is coming too!`));
  return L;
}
const SEND_LINE={maren:[`Scarf! Did you pack a scarf? Pack two.`,`Scarf! Pack two.`],yara:[`Two hundred and six steps. East, by the signpost. Go on.`,`206 steps. East, by the sign.`],wren:[`The Moth Mask only steals things that glow. Hmm. You glow a little, Ash.`,`She steals things that glow. You glow a little!`]};
// ---------- the per-frame heist
function heistResume(ph){
  HS.on=true; HS.t=0;
  if(ph==='gear'){ HS.phase='gear'; HS.gear={x:HV.gear.x,y:HV.gear.y,landed:true,t:1}; return; }
  HS.phase='chase'; thiefNew(0); HS.chaseT=0;
  bubble(HS.thief,S(`Looking for me? Up here!`,`Up here!`),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-56});
  const m=G.npcs.find(n=>n.id==='maren'); if(m) npcBubble(m,S(`She went over the roofs! Go, Ash!`,`Over the roofs! Go!`));
  questUpdated();
}
function chaseStart(){
  HS.phase='chase'; HS.chaseT=0; HS.cam=null; if(!HS.thief) thiefNew(0);
  setBanner(S('Chase the thief!','Chase the thief!'),S('Follow her over the rooftops. She leaves smoke and barrels behind!','Follow her! Watch for smoke and barrels.'),3);
  saveGame();
}
function thiefNew(i){ const n=HROUTE[i]; HS.thief={x:n.x,y:n.y,z:0,seg:i,mode:'wait',t:0,u:0,face:-1,heart:true,alpha:1,bombCd:1.5,sayT:4,ax:n.x,ay:n.y,bx:n.x,by:n.y,len:1,H:0,leap:false,onShip:false,poof:0}; }
function thiefGo(T){
  const i=T.seg, a=HROUTE[i], b=HROUTE[i+1]; if(!b) return;
  T.ax=T.x; T.ay=T.y; T.bx=b.x; T.by=b.y; T.len=Math.max(30,dist(T.ax,T.ay,T.bx,T.by)); T.u=0;
  T.leap=!!(a.roof||b.roof); T.mode='move'; T.H=T.leap?34+T.len*0.16:0; T.spd=T.leap?340:285; T.face=b.x>=T.x?1:-1;
  if(T.leap) try{ SFX.play('roll',0.6); }catch(e){}
}
function thiefArrive(T){
  T.seg++; T.mode='wait'; T.t=0; T.z=0; const n=HROUTE[T.seg]; T.x=n.x; T.y=n.y;
  if(n.say!=null&&HSAY[n.say]) bubble(T,S(HSAY[n.say][0],HSAY[n.say][1]),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-56});
  if(n.drop) dropBarrels(T);
  if(n.hide){ T.mode='hide'; T.alpha=0; smokeAt(T.x,T.y,1.1); HS.bales=n.hide.map(([x,y])=>({x,y,checked:false,shake:0})); HS.found=0; bubble(T,S(`Hide and seek, little dragon! Ready or not!`,`Hide and seek! Ready or not!`),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-56}); later(0.2,questUpdated); }
  if(n.end){ T.face=player.x>=T.x?1:-1; bubble(T,S(`End of the line, little dragon. Come closer. I won't bite.`,`Come closer. I won't bite.`),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-56}); }
}
function thiefPoof(T){
  smokeAt(T.x,T.y,1);
  if(T.seg<HROUTE.length-2){ T.seg++; const n=HROUTE[T.seg]; T.x=n.x; T.y=n.y; T.z=0; T.mode='wait'; T.t=0; T.poof=0.45; smokeAt(T.x,T.y,0.6); }
  bubble(T,S(`Too close! Poof!`,`Poof!`),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-56});
  try{ SFX.play('pop'); }catch(e){}
}
function smokeAt(x,y,k){ HS.smoke.push({x,y,r:78*(k||1),t:0,life:3.4,seed:Math.random()*99,hit:false}); emit(x,y,16,{col:'190,180,210',glow:false,smin:30,smax:120,lmin:.4,lmax:.9,zmin:4,zmax:9,grow:14}); }
function dropBarrels(T){
  const p=player, a=angTo(T.x,T.y,p.x,p.y), cx=T.x+Math.cos(a)*95, cy=T.y+Math.sin(a)*95, px=-Math.sin(a), py=Math.cos(a);
  for(const k of [-1,0,1]){ const x=cx+px*k*34, y=cy+py*k*34; HS.obst.push({x,y,x0:T.x,y0:T.y,t:0,landed:false,life:9,col:null,rot:rand(-0.3,0.3)}); }
  try{ SFX.play('roll'); }catch(e){}
}
function barrelBreak(b){ if(b.col){ removeCol(b.col); b.col=null; } b.life=0; emit(b.x,b.y,14,{col:'130,90,50',glow:false,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4}); try{ SFX.play('pop'); }catch(e){} }
function baleNext(){ if(!HS.bales) return null; let b=null,bd=1e18; for(const q of HS.bales){ if(q.checked) continue; const d=dist2(q.x,q.y,player.x,player.y); if(d<bd){ bd=d; b=q; } } return b; }
function heistGuide(){ const T=HS.thief; if(!T) return null; if(T.mode==='hide'){ const b=baleNext(); if(b) return {x:b.x,y:b.y+30,i:T.seg,bale:true}; } const i=T.mode==='wait'?T.seg:Math.min(HROUTE.length-1,T.seg+1); const g=HROUTE[i].g; return {x:g[0],y:g[1],i}; }
function chaseTick(dt){
  const T=HS.thief, p=player; if(!T) return;
  HS.chaseT+=dt; T.t+=dt; T.bombCd-=dt; T.sayT-=dt; if(T.poof>0) T.poof-=dt;
  const d=dist(p.x,p.y,T.x,T.y);
  // lost her (fast travel, a long way off): she goes back to the forge roof and waits there
  if(d>2600){ HS.on=false; HS.phase=''; HS.thief=null; HS.cam=null; setBanner(S('You lost her trail','You lost her'),S('She was last seen on the forge roof in Emberhollow.','Look on the forge roof.'),3); return; }
  if(T.mode==='hide'){
    for(const b of HS.bales||[]){ if(b.checked||dist(p.x,p.y,b.x,b.y)>62) continue; b.checked=true; b.shake=0.7; HS.found++; try{ SFX.play('pop'); }catch(e){}
      emit(b.x,b.y-10,14,{col:'230,200,110',glow:false,smin:30,smax:120,lmin:.3,lmax:.7,zmin:1.5,zmax:3});
      if(HS.found<3){ const k=HS.found===1?'hen':'cat', pet={k,x:b.x,y:b.y,t:0,dir:p.x<b.x?1:-1}; HS.pets.push(pet); bubble(pet,k==='hen'?S(`BAWK!`,`BAWK!`):S(`Mrrrow?`,`Mrrow?`),{who:'',col:'#f2e2c4',dy:-30}); later(0.1,questUpdated); }
      else{ T.x=b.x; T.y=b.y-2; T.alpha=1; T.mode='wait'; T.t=0; T.poof=1.1; bubble(T,S(`Peekaboo! You found me!`,`Peekaboo!`),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-56}); thiefGo(T); }
      break; }
    HS.cam={x:p.x,y:p.y,k:0}; return;
  }
  if(T.mode==='wait'){
    const n=HROUTE[T.seg];
    if(n.end){ T.face=p.x>=T.x?1:-1; if(d<300&&scene==='play') cliffStart(); return; }
    if(d>560&&T.sayT<=0){ T.sayT=rand(4.5,6.5); const w=pick(HWAIT); bubble(T,S(w[0],w[1]),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-56}); }
    if((d<310&&T.t>=(n.wait||0.3))||d<150) thiefGo(T);
  }else if(T.mode==='move'){
    T.u+=dt*T.spd/T.len; const u=Math.min(1,T.u);
    T.x=lerp(T.ax,T.bx,u); T.y=lerp(T.ay,T.by,u); T.z=T.leap?Math.sin(Math.PI*u)*T.H:0;
    if(T.u>=1) thiefArrive(T);
  }
  // Ash can never quite catch her
  if(d<56&&T.poof<=0&&!HROUTE[T.seg].end) thiefPoof(T);
  // smoke bombs when he gets close
  if(d<160&&T.bombCd<=0&&!HROUTE[T.seg].end){ T.bombCd=3.2; HS.bombs.push({x0:T.x,y0:T.y-T.z-20,x1:p.x+rand(-18,18),y1:p.y+rand(-12,12),t:0,dur:0.45}); bubble(T,pick([S(`Catch!`,`Catch!`),S(`Smoke bomb!`,`Smoke bomb!`),S(`Achoo! Oops.`,`Oops!`)]),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-56}); }
  if(HROUTE[T.seg].bomb&&T.mode==='wait'&&T.t<dt*1.5) smokeAt(T.x+rand(-20,20),T.y+50,0.9);
  // people shout as she goes past
  HS.shoutT-=dt;
  if(HS.shoutT<=0){ HS.shoutT=rand(2.2,3.4); const near=G.npcs.filter(n=>n.id!=='maren'&&dist2(n.x,n.y,T.x,T.y)<300*300); if(near.length){ const s=pick(HSHOUT); npcBubble(pick(near),S(s[0],s[1])); } }
  HS.cam={x:T.x,y:T.y-T.z,k:0.38,mx:260,my:200};
}
function cliffStart(){
  HS.phase='cliff'; HS.cam={x:2830,y:11000,k:0.6};
  runDialogue(cliffLines(),()=>{ scene='play'; leapStart(); },{mood:'tender'});
}
function leapStart(){
  const T=HS.thief; G.flags.c_leapt=true; saveGame();
  HS.phase='leap'; HS.t=0; T.mode='dive'; T.ax=T.x; T.ay=T.y; T.bx=HV.ship.x-6; T.by=HV.ship.y-12; T.u=0; T.face=1;
  HS.gear={x:T.x,y:T.y,x0:T.x,y0:T.y,t:0,landed:false};
  try{ SFX.play('roll'); SFX.play('cast',0.5); }catch(e){}
  emit(T.x,T.y-20,20,{col:'200,190,240',glow:true,smin:30,smax:140,lmin:.4,lmax:.9,zmin:1.5,zmax:3,rise:10});
}
function leapTick(dt){
  const T=HS.thief; HS.t+=dt;
  if(T&&T.mode==='dive'){ T.u+=dt/1.6; const u=Math.min(1,T.u); T.x=lerp(T.ax,T.bx,u); T.y=lerp(T.ay,T.by,u); T.z=Math.sin(Math.PI*u)*60+(1-u)*6; if(u>=1){ T.onShip=true; T.mode='ship'; try{ SFX.play('block',0.5); }catch(e){} bubble(T,S(`Bye bye, little dragon! Say hello to your mum!`,`Bye bye, little dragon!`),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-70}); } }
  if(HS.ship&&T&&T.onShip){ if(HS.t>2.1) HS.ship.vx=Math.min(95,(HS.ship.vx||0)+dt*40); T.x=HS.ship.x-6; T.y=HS.ship.y-12; }
  if(HS.t>2.2&&HS.t-dt<=2.2) setBanner(S(`She's gone`,`She's gone`),S('Something small and shiny rolled to your feet.','Something shiny is by your feet.'),3);
  if(HS.gear&&HS.gear.landed&&HS.t>1.2&&HS.phase==='leap') HS.phase='gear';
  HS.cam=HS.t<4?{x:2840,y:11010,k:0.55}:null;
}
function gearPick(){
  if(!HS.gear) return;
  HS.gear=null; giveItems({c_gear:1},true); try{ SFX.play('chest'); }catch(e){}
  HS.cam=null;
  runDialogue(gearLines(),()=>{ scene='play'; HS.on=false; HS.phase=''; HS.thief=null; goStage('c_clue',{card:false}); });
}
// visuals that keep moving while a dialogue is up: fireworks, smoke, barrels, the ship, the crow
function hsVisual(dt){
  for(let i=HS.rockets.length-1;i>=0;i--){ const r=HS.rockets[i]; r.t+=dt; r.h+=r.v*dt; r.v*=Math.exp(-dt*0.9); if(Math.random()<0.7) HS.fw.push({x:r.x+rand(-2,2),y:r.y-r.h,vx:rand(-10,10),vy:rand(10,40),life:0.45,max:0.5,col:'255,200,120',sz:1.6,trail:true}); if(r.h>=r.top){ fwBurst(r.x,r.y-r.h,r.col,r.big); HS.rockets.splice(i,1); } }
  for(let i=HS.fw.length-1;i>=0;i--){ const q=HS.fw[i]; q.life-=dt; if(q.life<=0){ HS.fw.splice(i,1); continue; } const k=Math.exp(-dt*1.6); q.vx*=k; q.vy=q.vy*k+40*dt; q.x+=q.vx*dt; q.y+=q.vy*dt; }
  for(let i=HS.flash.length-1;i>=0;i--){ const f=HS.flash[i]; f.t+=dt; if(f.t>=f.life) HS.flash.splice(i,1); }
  if(HS.bales) for(const b of HS.bales) if(b.shake>0) b.shake=Math.max(0,b.shake-dt);
  for(let i=HS.pets.length-1;i>=0;i--){ const q=HS.pets[i]; q.t+=dt; q.x+=q.dir*(q.k==='hen'?150:190)*dt; q.y+=Math.sin(q.t*14)*20*dt; if(q.t>1.6) HS.pets.splice(i,1); }
  for(let i=HS.pops.length-1;i>=0;i--){ const f=HS.pops[i]; f.t+=dt; if(f.t>=0.45) HS.pops.splice(i,1); }
  for(let i=HS.smoke.length-1;i>=0;i--){ const s=HS.smoke[i]; s.t+=dt; if(s.t>=s.life) HS.smoke.splice(i,1); }
  for(let i=HS.bombs.length-1;i>=0;i--){ const b=HS.bombs[i]; b.t+=dt; if(b.t>=b.dur){ smokeAt(b.x1,b.y1,1); HS.bombs.splice(i,1); try{ SFX.play('pop'); }catch(e){} } }
  for(let i=HS.obst.length-1;i>=0;i--){ const b=HS.obst[i]; b.t+=dt; if(!b.landed&&b.t>=0.5){ b.landed=true; b.col=addCol({t:'c',x:b.x,y:b.y,r:15,low:true}); shake(1.5); try{ SFX.play('block',0.4); }catch(e){} } if(b.landed) b.life-=dt; if(b.life<=0){ if(b.col){ removeCol(b.col); b.col=null; emit(b.x,b.y,8,{col:'130,90,50',glow:false,smin:20,smax:80,lmin:.3,lmax:.5,zmin:2,zmax:3}); } HS.obst.splice(i,1); } }
  if(HS.gear&&!HS.gear.landed){ const g=HS.gear; g.t+=dt; const u=Math.min(1,g.t/0.8); g.x=lerp(g.x0,HV.gear.x,u); g.y=lerp(g.y0,HV.gear.y,u); g.z=Math.abs(Math.sin(u*Math.PI*2.2))*(1-u)*26; if(u>=1){ g.landed=true; g.z=0; try{ SFX.play('pickup'); }catch(e){} } }
  if(HS.ship){ const s=HS.ship; s.t=(s.t||0)+dt; s.x+=(s.vx||0)*dt; if(s.vx>0) s.a=Math.max(0,(s.a==null?1:s.a)-dt*0.18); if(s.a!=null&&s.a<=0) HS.ship=null; }
  else if(HS.on&&(HS.phase==='chase'||HS.phase==='cliff'||HS.phase==='theft'||HS.phase==='show')) HS.ship={x:HV.ship.x,y:HV.ship.y,vx:0,t:0,a:1};
  if(HS.moth){ HS.moth.t+=dt; if(HS.moth.t>1.3) HS.moth=null; }
  // background fireworks while the thief talks on the roof
  if(HS.phase==='theft'){ HS.bgT-=dt; if(HS.bgT<=0){ HS.bgT=rand(0.9,1.5); fwLaunch(rand(-300,300),rand(220,340),(Math.random()*7)|0); } }
  const C=HS.crow; if(C){ C.t+=dt; C.flap+=dt*(C.mode==='sit'?2:14);
    if(C.mode==='in'){ const tx=player.x+4, ty=player.y-50, u=Math.min(1,C.t/1.7), e=1-(1-u)*(1-u); C.x=lerp(C.x0,tx,e); C.y=lerp(C.y0,ty,e)-Math.sin(u*Math.PI)*40; if(u>=1&&scene==='play') crowArrived(); }
    else if(C.mode==='sit'){ C.x=player.x+4; C.y=player.y-50; }
    else{ C.x+=260*dt; C.y-=170*dt; if(C.t>2.2) HS.crow=null; } }
}
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt); try{ if(G&&G.mode==='story'){ hsVisual(dt); if(HS.on&&G.fade>0&&scene==='dialogue') G.fade=Math.max(0,G.fade-dt*1.3); } }catch(e){ console.error(e); } }; }
function heistTick(dt){
  if(!HS.on) return;
  if(G.tod<0.86&&G.tod>0.3&&HS.phase&&HS.phase!=='gear') G.tod=0.86;
  switch(HS.phase){
    case 'show':{
      HS.t+=dt;
      while(HS.fwNext<FW_PLAN.length&&HS.t>=FW_PLAN[HS.fwNext][0]){ const f=FW_PLAN[HS.fwNext++]; fwLaunch(f[1],f[2],f[3]); }
      for(const [tt,i] of [[1.4,0],[2.3,1],[3.1,2],[4.5,3],[5.4,4]]) if(HS.t>=tt&&HS.t-dt<tt) crowdSay(i);
      if(HS.t>=3.6&&HS.t-dt<3.6) HS.moth={t:0,x0:cam.x+W/zoom+60,x1:cam.x-60,y:cam.y+H/zoom*0.26};
      if(HS.t>=6.9&&!HS.crash){ HS.crash=true; G.flags.c_stolen=true; shake(5); try{ SFX.play('block'); SFX.play('boom',0.5); }catch(e){} emit(HV.pedestal.x,HV.pedestal.y-24,18,{col:'255,150,80',smin:30,smax:140,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); const m=G.npcs.find(n=>n.id==='maren'); if(m) npcBubble(m,S(`The Heart!`,`The Heart!`)); saveGame(); }
      if(HS.t>=7.4&&!HS.thief){ thiefNew(0); HS.cam={x:HV.forge.x,y:HV.forge.y-40,k:0.88}; emit(HS.thief.x,HS.thief.y-20,12,{col:'200,190,230',glow:false,smin:20,smax:80,lmin:.3,lmax:.6,zmin:3,zmax:6,grow:8}); }
      if(HS.t>=8.4){ HS.phase='theft'; runDialogue(theftLines(),()=>{ scene='play'; chaseStart(); },{mood:'combat'}); }
      break; }
    case 'chase': chaseTick(dt); break;
    case 'leap': case 'gear': leapTick(dt); break;
  }
}
// ---------- prompts (light the rocket, pick up the gear), fire breath on the rocket, smashing barrels, smoke
{ const base=miniPrompts; miniPrompts=function(offer){ base(offer); try{
  if(!G||G.mode!=='story'||!HS.on||AREA) return; const p=player;
  if(HS.phase==='rocket'){ const d=dist(p.x,p.y,HV.rocket.x,HV.rocket.y); if(d<64) offer(d,S('Light the firework','Light the firework'),rocketLaunch,HV.rocket.x,HV.rocket.y,true); }
  if(HS.gear&&HS.gear.landed){ const d=dist(p.x,p.y,HS.gear.x,HS.gear.y); if(d<56) offer(d-20,S('Pick up the shiny thing','Pick up the shiny thing'),gearPick,HS.gear.x,HS.gear.y,true); }
  }catch(e){ console.error(e); } }; }
{ const base=breathIgnite; breathIgnite=function(mx,my,ang,dt){ base(mx,my,ang,dt); try{
  if(!G||G.mode!=='story'||!HS.on||AREA) return;
  if(HS.phase==='rocket'&&inArcC(mx,my,ang,175,0.45,{x:HV.rocket.x,y:HV.rocket.y-12,r:18})) rocketLaunch();
  const T=HS.thief; if(T&&HS.phase==='chase'&&G.time-HS.toastT>4&&inArcC(mx,my,ang,190,0.5,{x:T.x,y:T.y-T.z,r:20})){ HS.toastT=G.time; bubble(T,S(`Ooh, toasty! Missed!`,`Toasty! Missed!`),{who:SPK.c_thief.name,col:SPK.c_thief.col,dy:-56}); }
  }catch(e){} }; }
{ const base=swingBreakables; swingBreakables=function(px,py,dir,range,half){ base(px,py,dir,range,half); try{ for(const b of HS.obst) if(b.landed&&b.life>0&&inArcC(px,py,dir,range,half,{x:b.x,y:b.y,r:16})) barrelBreak(b); }catch(e){} }; }
function smokeTick(){
  if(!HS.smoke.length||AREA) return; const p=player;
  for(const s of HS.smoke){ if(s.t>s.life-0.4) continue; if(dist2(p.x,p.y,s.x,s.y)<(s.r*0.8)**2&&!(p.flying)){ p.slowT=Math.max(p.slowT||0,0.25); if(!s.hit){ s.hit=true; if(G.time-HS.coughT>2.5){ HS.coughT=G.time; bubble(p,S(`*cough cough*`,`*cough*`),{who:'Ash',col:'#ffb070',dy:-52}); } } } }
}
// no wolves, no world events in the middle of the party and the chase
{ const base=updateWolves; updateWolves=function(dt){ if(HS.on) return; return base(dt); }; }
{ const base=evExploring; evExploring=function(){ if(HS.on||HS.crow) return false; return base(); }; }
// party music, then the chase music
{ const base=musicMood; musicMood=function(dt){ const m=base(dt); try{ if(G&&G.mode==='story'&&HS.on&&scene==='play'&&!(DLG&&DLG.mood)){ if(HS.phase==='chase') return 'combat'; if(HS.phase==='intro'||HS.phase==='rocket'||HS.phase==='show') return 'village'; } }catch(e){} return m; }; }
// the camera leans toward the thief (and pans to the forge roof and the cliffs for the scenes)
{ const base=updateCam; updateCam=function(dt,snap){
  const C=HS.cam; if(!C||AREA||!player||!G||G.mode!=='story') return base(dt,snap);
  const px=player.x, py=player.y; let ox=(C.x-px)*C.k, oy=(C.y-py)*C.k; if(C.mx){ ox=clamp(ox,-C.mx,C.mx); oy=clamp(oy,-C.my,C.my); }
  player.x=px+ox; player.y=py+oy; try{ base(dt,snap); }finally{ player.x=px; player.y=py; } }; }

// ---------- the Southern Pass: a crossing at the south edge of Embermere down to the Clockwork Coast, and back
// (the arrival point on map 1, (2600,20700), is a placeholder: the Act II world helper moves both ends)
defineCrossing({id:'c_pass_s',x:HV.pass.x,y:HV.pass.y,to:{x:2600,y:20700},label:S('Take the Southern Pass','Go down the Southern Pass'),name:S('The Southern Pass','The Southern Pass'),kind:'pass',dir:Math.PI/2,
  need:()=>reached('c_pass'),locked:S('A sign says: SOUTHERN PASS. CLOSED BY ROCKFALL. The old road down the cliffs, buried in rocks. You will need it soon.','The pass is blocked by rocks.'),
  hidden:()=>!(G&&G.flags&&G.flags.act1_done),arrive:S('Salt and steam on the wind. Somewhere, a thousand clocks are ticking.','It smells like the sea! Clocks tick everywhere.')});
defineCrossing({id:'c_pass_n',x:2600,y:20480,to:{x:HV.pass.x,y:HV.pass.y-150},label:S('Climb back up to Embermere','Go back up to Embermere'),name:S('The Southern Pass','The Southern Pass'),kind:'pass',dir:-Math.PI/2,
  arrive:S('Home air. It smells like bread and woodsmoke.','It smells like home!')});

// ================= the stages
defineAct(1,{name:S('The First Flame','The First Flame'),map:0,first:'wake'});
defineAct(2,{name:S('The Masked Thief','The Masked Thief'),map:1,first:'c_fest',arrive:'c_coast',
  kit:{level:9,abil:['jump','stride','wings','dbljump','skimmer'],weapons:['sword','daggers','spear','hammer','boomerang','bow'],tier:2,coins:300,bless:8,items:{c_gear:1},
    flags:{c_letter:true,c_fest_seen:true,c_stolen:true,c_leapt:true,c_t_maren:true,c_t_yara:true,c_t_wren:true}}});
defineAct(3,{name:S('The Long Winter','The Long Winter'),map:2,kit:{level:13,abil:['claws','grapple','shadow'],weapons:['whip','chainwhip'],tier:3,coins:450,bless:12}});
defineAct(4,{name:S('The Night Mother','The Night Mother'),map:3,kit:{level:17,abil:['blaze','windride','pound'],weapons:['bombs','blastbombs'],tier:3,coins:600,bless:16}});
defineAct(5,{name:S('Nightfall Peak','Nightfall Peak'),map:4,kit:{level:21,abil:['dive','burrow','moonfire'],weapons:['glaive','moonglaive'],tier:3,coins:800,bless:20}});
for(const n of [2,3,4,5]) ACTS[n]._kit0=ACTS[n].kit;
// the Act I free roam after the ending (stage 'done' with act1_done): Yara's letter brings Lantern Night
defineStages(1,[{id:'done',
  idle:()=>G.flags.act1_done?S('Explore Embermere. Yara is planning something for tonight.','Explore! Yara has a plan for tonight.'):'',
  hint:()=>G.flags.act1_done?S(`Go wherever you like, Ash. Tonight is Lantern Night. I'll send Pebble when it's time.`,`Go explore! Tonight is Lantern Night.`):'',
  soFar:()=>G.flags.act1_done?S('Vorlaxis is quiet at last. He left behind a warm red stone called the Ember Heart, and Mom keeps it safe in the forge. Tonight is Lantern Night.','Grandpa is quiet now. He left a warm stone, the Ember Heart. Tonight is Lantern Night.'):'',
  marker:id=>!!G.flags.act1_done&&id==='yara'&&!HS.crow,
  // Yara or Mom can tell Ash about Lantern Night themselves, before Pebble finds him
  talk(n){
    if(!G.flags.act1_done||HS.crow||(n.id!=='yara'&&n.id!=='maren')||availableFrom(n.id)||(n.id==='maren'&&(G.iron>0||hammerPitchDue()))) return false;
    const L=n.id==='yara'?[xl('yara',`There you are! Didn't Pebble find you? That crow. Never mind. Tonight is Lantern Night, Ash: the party after the party. The whole village is coming. Even the goat.`,`There you are! Tonight is Lantern Night! The whole village is coming.`),xl('yara',`The fireworks start at sundown. Don't be late.`,`The fireworks start at sundown!`)]
      :[xl('maren',`Tonight's Lantern Night, love. I made a cake. It looks like you. Mostly. The horns went a bit wobbly.`,`Tonight is Lantern Night! I made a cake that looks like you.`)];
    runDialogue(L,()=>{ scene='play'; G.flags.c_wait=0; G.flags.c_letter=true; startAct(2); });
    return true;
  },
  update:dt=>letterTick(dt)}]);
defineStages(2,[
  {id:'c_fest',chapter:S('Lantern Night','Lantern Night'),card:['Act II · Chapter 1',S('Lantern Night','Lantern Night')],at:{x:HV.arrive.x,y:HV.arrive.y},
    objectives(){
      const F=G.flags, V=POI.village, T=HS.thief;
      if(HS.on){
        if(HS.phase==='rocket') return [{text:S('Light the big firework by the well. Breathe fire on it, gently!','Breathe fire on the big firework by the well!'),x:HV.rocket.x,y:HV.rocket.y}];
        if(HS.phase==='show') return [{text:S('Watch the fireworks!','Watch the fireworks!'),x:HV.green.x,y:HV.green.y,near:true}];
        if(HS.phase==='chase'&&T&&T.mode==='hide'){ const b=baleNext(); return [{text:S('Where did she go? Search the hay bales!','Where is she? Look in the hay!'),x:b?b.x:T.x,y:b?b.y:T.y}]; }
        if((HS.phase==='chase'||HS.phase==='theft'||HS.phase==='cliff')&&T) return [{text:S('Chase the masked thief!','Chase the thief!'),x:T.x,y:T.y}];
        if(HS.phase==='leap'||HS.phase==='gear') return [{text:S('Pick up what the thief dropped','Pick up what she dropped'),x:HV.gear.x,y:HV.gear.y}];
        return [{text:S('Lantern Night is starting!','The party is starting!'),x:HV.green.x,y:HV.green.y,near:true}];
      }
      if(F.c_leapt) return [{text:S('Pick up what the thief dropped at the cliffs','Pick up what she dropped'),x:HV.gear.x,y:HV.gear.y}];
      if(F.c_stolen) return [{text:S('Find the masked thief. She ran over the rooftops from the forge.','Find the thief! Start at the forge.'),x:HV.forge.x,y:HV.forge.y+80}];
      if(curMap()===0&&dist(player.x,player.y,V.x,V.y)<760) return [{text:S('Lantern Night is about to start on the village green!','The party is about to start!'),x:HV.green.x,y:HV.green.y,near:true}];
      return [{text:S('Go home to Emberhollow for Lantern Night','Go home for Lantern Night!'),x:V.x,y:V.y}];
    },
    hint:()=>HS.on&&HS.phase==='rocket'?S(`One breath on the big rocket by the well, Ash. Gently. Everyone is waiting.`,`Breathe on the big rocket. Gently!`):G.flags.c_stolen?S(`She went over the rooftops from the forge! Follow her, Ash. Quickly!`,`Chase the thief! Start at the forge.`):S(`Lantern Night is in Emberhollow, Ash. Come home. There's cake. It looks like you.`,`Come home to Emberhollow! There's cake.`),
    soFar:()=>G.flags.c_stolen?S('During the Lantern Night fireworks, a masked thief in a moth-wing cloak stole the Ember Heart from the forge and ran off over the rooftops.','A masked thief stole the Ember Heart! She ran over the roofs.'):S(`It's Lantern Night in Emberhollow: music, lanterns and fireworks for the end of the thousand years.`,`It's Lantern Night! Music, lanterns and fireworks.`),
    mom:[S(`Lantern Night, Ash! Did you see the cake? I made the horns out of toffee.`,`Did you see the cake? The horns are toffee!`)],
    yara:[S(`Four hundred and twelve lanterns. I may count them a third time.`,`412 lanterns. I might count again.`)],
    talk(n){
      if(!HS.on) return false;
      if(HS.phase==='chase'||HS.phase==='leap'){ if(n.id==='maren'||n.id==='yara'||n.id==='wren'||G.npcs.includes(n)){ runDialogue([[n.id,pick([S(`Go, Ash! She's getting away!`,`Go! She's getting away!`),S(`After her! We'll catch up!`,`After her!`)])]],()=>{ scene='play'; }); return true; } return false; }
      if(HS.phase!=='rocket'&&HS.phase!=='intro') return false;
      if(HS.talked[n.id]) return false;
      const gl=GUESTS.find(g=>g.id===n.id);
      const line=gl?S(gl.t[0],gl.t[1]):n.id==='maren'?S(`Go on, light it! I've got my fingers in my ears already.`,`Go on, light it!`):n.id==='yara'?S(`One breath on the big rocket. Gentle. I am counting.`,`One gentle breath on the rocket!`):n.id==='wren'?S(`I've read all about fireworks. Reading was quieter.`,`I read about fireworks. Reading is quieter.`):null;
      if(!line) return false;
      HS.talked[n.id]=true; runDialogue([[n.id,line]],()=>{ scene='play'; }); return true;
    },
    update(dt){
      if(AREA) return;
      if(!HS.on){
        const F=G.flags;
        if(scene!=='play'||G.inCombat||G.time-ACT_RT.stageT<(F.c_stolen?1:6)||curMap()!==0) return;
        if(F.c_leapt){ heistResume('gear'); return; }
        if(F.c_stolen){ if(dist(player.x,player.y,HV.forge.x,HV.forge.y)<700) heistResume('chase'); return; }
        if(dist(player.x,player.y,HV.village.x,HV.village.y)<560) festStart();
        return;
      }
      heistTick(dt); smokeTick();
    }},
  {id:'c_clue',chapter:S('Lantern Night','Lantern Night'),at:{x:2730,y:10880},
    objectives(){
      const out=[], F=G.flags;
      const nm={maren:S('Show the brass gear to Mom','Show Mom the gear'),yara:S('Show the brass gear to Elder Yara','Show Yara the gear'),wren:S('Show the brass gear to Sister Wren','Show Wren the gear')};
      for(const id of ['maren','yara','wren']){ if(F['c_t_'+id]) continue; const n=G.npcs.find(q=>q.id===id); const [x,y]=HV.talk[id]; out.push({text:nm[id],x:n?n.x:x,y:n?n.y:y,npc:id}); }
      return out;
    },
    marker:id=>(id==='maren'||id==='yara'||id==='wren')&&!G.flags['c_t_'+id],
    hint:S(`Show that gear to your mother, to me and to Sister Wren. Between the three of us we know nearly everything. Nearly.`,`Show the gear to Mom, Yara and Wren.`),
    soFar:S('The masked thief leapt off the southern cliffs onto a waiting ship and sailed away. She dropped a brass gear stamped GEARHAVEN.','The thief jumped onto a ship and sailed away. She dropped a gear. It says GEARHAVEN.'),
    enter(o){ if(o.load) return; HS.runIn=[]; for(const id of ['maren','yara','wren']){ const n=G.npcs.find(q=>q.id===id); if(n){ n.y-=440; n.x+=rand(-60,60); HS.runIn.push(n); } } },
    talk(n){
      if(!CLUE_TALK[n.id]||G.flags['c_t_'+n.id]) return false;
      runDialogue(CLUE_TALK[n.id](),()=>{ scene='play'; G.flags['c_t_'+n.id]=true; saveGame();
        if(['maren','yara','wren'].every(id=>G.flags['c_t_'+id])) later(0.5,()=>runDialogue(sendOffLines(),()=>{ scene='play'; goStage('c_pass'); })); else questUpdated(); });
      return true;
    },
    update(dt){ if(HS.runIn){ let busy=false; for(const n of HS.runIn){ const d=dist(n.x,n.y,n.home[0],n.home[1]); if(d>4){ busy=true; const a=angTo(n.x,n.y,n.home[0],n.home[1]), s=Math.min(d,190*dt); n.x+=Math.cos(a)*s; n.y+=Math.sin(a)*s; n.face=a; n.moving=true; } } if(!busy) HS.runIn=null; } }},
  {id:'c_pass',chapter:S('The Southern Pass','The Southern Pass'),card:['Act II · Chapter 2',S('The Southern Pass','The Southern Pass')],at:{x:3300,y:10760},
    objectives:()=>curMap()===0?[{text:S('Take the Southern Pass down to the Clockwork Coast','Go down the Southern Pass'),x:HV.pass.x,y:HV.pass.y}]:[],
    hint:S(`The Southern Pass is just east along the cliffs, by the old signpost. Two hundred and six steps down to the Clockwork Coast.`,`The pass is east, by the signpost.`),
    soFar:S('Gearhaven is a clockwork port on the coast beyond the Southern Pass. Sister Wren says the thief is the Moth Mask, a legend who only steals things that glow.','Gearhaven is a port past the Southern Pass. The thief is the Moth Mask. She steals things that glow.'),
    mom:[S(`Scarf. Did you pack a scarf? Pack two.`,`Did you pack a scarf?`)],
    yara:[S(`Two hundred and six steps. East, by the signpost.`,`206 steps. East, by the sign.`)],
    talk(n){ const L=SEND_LINE[n.id]; if(!L||HS.sent[n.id]) return false; HS.sent[n.id]=true; runDialogue([[n.id,S(L[0],L[1])]],()=>{ scene='play'; }); return true; },
    update(dt){ if(!AREA&&curMap()===1&&scene==='play') goStage('c_coast'); }},
  {id:'c_coast',chapter:S('The Clockwork Coast','The Clockwork Coast'),card:['Act II · Chapter 3',S('The Clockwork Coast','The Clockwork Coast')],at:{x:2600,y:20700},
    objectives:()=>[{text:S('Find Gearhaven','Find Gearhaven'),x:7000,y:26000}],
    hint:S(`Gearhaven is somewhere down the coast. Follow the road and look for clock towers. Pebble says hello.`,`Find Gearhaven. Look for clock towers.`),
    soFar:S('Ash took the Southern Pass down to the Clockwork Coast to find Gearhaven, the Moth Mask, and the stolen Ember Heart.','Ash went down to the Clockwork Coast to find Gearhaven and the thief.'),
    enter(o){ if(o.load||o.prev!=='c_pass') return; later(3.4,()=>{ if(scene!=='play') return; const L=[xl('narr',`Two hundred and six steps later, the land opens out. White chalk cliffs. Salt grass. Gulls yelling about something important.`,`206 steps later: white cliffs, grass and loud gulls.`),xl('ash',`The Clockwork Coast. Okay, Moth Mask. Ready or not, here I come.`,`The Clockwork Coast. Here I come!`)]; if(G.flags.pip) L.push(xl('pip',`Mip!`,`Mip!`)); runDialogue(L,()=>{ scene='play'; }); }); }}
]);

// ---------- words of our own: speakers, items, portraits, the Ember Heart in the epilogue
Object.assign(SPK,{c_thief:{name:'The Masked Thief',col:'#c8b4f0'},c_letter:{name:"Yara's letter",col:'#f0dcb0'},c_pebble:{name:'Pebble',col:'#9aa0b8'},c_grandpa:{name:'Grandpa',col:'#ff9a66'}});
Object.assign(ITEM_NAMES,{c_gear:S('Brass gear (stamped GEARHAVEN)','Brass gear (GEARHAVEN)')});
// one line per ending: what the First Flame left behind (finalChoice in a9c_story.js adds it to the epilogue)
function heartLines(e){
  const L={
    hero:xl('narr',`Where the First Flame went out, something was left in the ashes: a warm red stone the size of a plum, beating softly like a heart. Mom named it the Ember Heart and kept it in the forge, where it hummed whenever she worked.`,`Something was left in the ashes: a warm red stone, like a heart. Mom called it the Ember Heart. She kept it in the forge.`),
    warden:xl('narr',`Inside the new sixth Ward-fire sat a warm red stone the size of a plum, beating softly like a heart: the last spark of the First Flame. The Wardens called it the Ember Heart.`,`In the sixth Ward-fire sat a warm red stone, like a heart. The Wardens called it the Ember Heart.`),
    heir:xl('narr',`When the fire poured into Ash, one small piece did not fit: a warm stone the size of a plum, beating like a tiny heart. Mom put the Ember Heart on a shelf in the forge. Grandpa glared at it from his birdcage.`,`One small piece of fire did not fit: a warm stone, like a heart. Mom put the Ember Heart in the forge.`),
    lantern:xl('narr',`Grandpa coughed up a warm red stone the size of a plum, beating softly like a heart. "The last of my old fire," he said. "Keep it safe, Maren. I don't trust myself with it." Mom put the Ember Heart over the forge.`,`Grandpa coughed up a warm stone, like a heart. "Keep it safe," he said. Mom put the Ember Heart in the forge.`)};
  return [L[e]||L.hero];
}
Object.assign(EVPORT,{
  c_thief:{bg:'#1e1630',f:g=>faceThief(g)},
  c_letter:{bg:'#3a2c1c',f:g=>faceLetter(g)},
  c_pebble:{bg:'#24283a',f:g=>{ g.save(); g.scale(2.4,2.4); drawCrowAt(g,0,4,0.5,true); g.restore(); }},
  c_grandpa:{bg:'#3a1810',f:g=>{ faceDragon(g,{skin:'#c8482a',dark:'#7a2412',snout:'#e8784a',horn:'#fff0d4',eye:'#ffcf4a',k:0.78}); if(G&&G.choices&&G.choices.ending==='lantern'){ g.fillStyle='#4ac0e8'; g.beginPath(); g.moveTo(-14,-46); g.lineTo(2,-86); g.lineTo(16,-44); g.closePath(); g.fill(); g.strokeStyle='#1a2a3a'; g.lineWidth=2.5; g.stroke(); g.fillStyle='#ffe066'; g.beginPath(); g.arc(2,-88,5,0,TAU); g.fill(); } }}
});

// ================= art: the southern cliffs, the party, the thief, her ship, the fireworks, the crow
const TH={ink:'#1c1328',suit:'#3b2b52',suit2:'#2a1e3c',cloak:'#9e90c2',cloak2:'#6f6296',mask:'#f6f0e6',gold:'#e2b65c',spot:'#f2b45a',hood:'#4c3a6a'};
function faceThief(g){
  const O=TH.ink; g.lineWidth=3; g.strokeStyle=O;
  // wings behind the head
  for(const s of [-1,1]){ g.fillStyle=TH.cloak2; g.beginPath(); g.moveTo(s*20,30); g.bezierCurveTo(s*70,10,s*86,-50,s*62,-70); g.bezierCurveTo(s*40,-40,s*30,0,s*20,30); g.closePath(); g.fill(); g.stroke(); g.fillStyle=TH.spot; g.beginPath(); g.arc(s*58,-30,10,0,TAU); g.fill(); g.stroke(); g.fillStyle=O; g.beginPath(); g.arc(s*58,-30,4.5,0,TAU); g.fill(); }
  // hood
  g.fillStyle=TH.hood; g.beginPath(); g.ellipse(0,0,44,50,0,0,TAU); g.fill(); g.stroke();
  // antennae
  for(const s of [-1,1]){ g.strokeStyle=TH.gold; g.lineWidth=2.5; g.beginPath(); g.moveTo(s*12,-46); g.quadraticCurveTo(s*22,-78,s*44,-82); g.stroke(); for(let i=1;i<6;i++){ const t=i/6, x=s*(12+t*30), y=-46-t*34; g.beginPath(); g.moveTo(x,y); g.lineTo(x+s*7,y-6); g.stroke(); } }
  // the mask
  g.fillStyle=TH.mask; g.strokeStyle=O; g.lineWidth=3; g.beginPath(); g.moveTo(-32,-14); g.quadraticCurveTo(0,-38,32,-14); g.quadraticCurveTo(30,18,0,30); g.quadraticCurveTo(-30,18,-32,-14); g.closePath(); g.fill(); g.stroke();
  g.fillStyle=O; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*6,-6); g.quadraticCurveTo(s*16,-18,s*26,-10); g.quadraticCurveTo(s*18,-2,s*6,-6); g.closePath(); g.fill(); }
  g.fillStyle='#fff'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*17,-9,1.8,0,TAU); g.fill(); }
  g.strokeStyle=TH.gold; g.lineWidth=2; g.beginPath(); g.arc(0,-22,4,Math.PI*0.2,Math.PI*1.9); g.stroke(); g.beginPath(); g.moveTo(-10,12); g.quadraticCurveTo(0,18,10,12); g.stroke();
  // a smile under the mask
  g.strokeStyle='#7a5a6a'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-8,36); g.quadraticCurveTo(0,42,8,36); g.stroke();
}
function faceLetter(g){
  g.save(); g.rotate(-0.12);
  g.fillStyle='#f2e6c8'; g.strokeStyle='#5a4428'; g.lineWidth=3; g.fillRect(-56,-38,112,80); g.strokeRect(-56,-38,112,80);
  g.strokeStyle='#8a7048'; g.lineWidth=1.5; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(-44,-22+i*13); g.lineTo(44-(i===4?40:0),-22+i*13); g.stroke(); }
  g.fillStyle='#b8302a'; g.beginPath(); g.arc(30,30,11,0,TAU); g.fill(); g.fillStyle='#e8584a'; g.beginPath(); g.arc(28,28,4,0,TAU); g.fill();
  g.restore();
  g.save(); g.translate(-40,46); g.rotate(-0.6); g.fillStyle='#1a1a24'; g.beginPath(); g.ellipse(0,0,8,30,0,0,TAU); g.fill(); g.restore();
}
// a crow: in the sky (live) and in portraits. g is a 2D context, (x,y) her body, k the wing beat (0..1)
function drawCrowAt(g,x,y,k,sit){
  g.save(); g.translate(x,y); g.lineJoin='round';
  const w=sit?0.25:Math.sin(k*TAU);
  g.fillStyle='#16161e'; g.strokeStyle='#05050a'; g.lineWidth=1.2;
  for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*2,-1); g.quadraticCurveTo(s*10,-8-w*9,s*19,-4-w*12); g.quadraticCurveTo(s*11,1,s*3,3); g.closePath(); g.fill(); g.stroke(); }
  g.beginPath(); g.ellipse(0,1,5,7,0,0,TAU); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-3,7); g.lineTo(0,12); g.lineTo(3,7); g.closePath(); g.fill();
  g.beginPath(); g.arc(0,-6,3.6,0,TAU); g.fill(); g.stroke();
  g.fillStyle='#e8b830'; g.beginPath(); g.moveTo(-1.2,-4); g.lineTo(0,-0.6); g.lineTo(1.2,-4); g.closePath(); g.fill();
  g.fillStyle='#fff'; g.fillRect(-2.2,-7.4,1.2,1.2); g.fillRect(1,-7.4,1.2,1.2);
  if(sit){ g.fillStyle='#f2e6c8'; g.fillRect(4,4,7,5); g.strokeStyle='#8a7048'; g.strokeRect(4,4,7,5); }
  g.restore();
}
// the thief. Poses: stand, run0, run1, wings. Facing right; feet at (0,0)
function thiefSpr(pose){
  return rSpr('c_thief_'+pose,120,100,60,84,g=>{
    const O=TH.ink, wings=pose==='wings', run=pose==='run0'?1:pose==='run1'?-1:0;
    g.lineWidth=2.2; g.strokeStyle=O;
    if(wings){
      for(const s of [-1,1]){
        g.beginPath(); g.moveTo(s*2,-31); g.bezierCurveTo(s*14,-60,s*46,-66,s*52,-46); g.bezierCurveTo(s*55,-34,s*38,-25,s*6,-24); g.closePath();
        g.fillStyle=TH.cloak; g.fill(); g.stroke();
        g.beginPath(); g.moveTo(s*3,-24); g.bezierCurveTo(s*28,-22,s*42,-6,s*30,3); g.bezierCurveTo(s*18,8,s*8,-4,s*3,-15); g.closePath(); g.fillStyle=TH.cloak2; g.fill(); g.stroke();
        g.strokeStyle='rgba(40,28,60,.45)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(s*5,-30); g.lineTo(s*44,-52); g.moveTo(s*5,-28); g.lineTo(s*48,-38); g.moveTo(s*5,-22); g.lineTo(s*30,-4); g.stroke();
        g.lineWidth=2.2; g.strokeStyle=O;
        g.fillStyle=TH.spot; g.beginPath(); g.arc(s*34,-45,7.5,0,TAU); g.fill(); g.stroke(); g.fillStyle=O; g.beginPath(); g.arc(s*34,-45,3.4,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(s*33,-46.5,1.3,0,TAU); g.fill();
        g.fillStyle='rgba(255,255,255,.35)'; for(let i=0;i<5;i++){ g.beginPath(); g.arc(s*(18+i*7),-57+i*2.5,2.2,0,TAU); g.fill(); }
      }
    }else{
      g.beginPath(); g.moveTo(-7,-33); g.quadraticCurveTo(-23,-16,-20,-2);
      for(let i=0;i<5;i++){ const x0=-20+i*8; g.quadraticCurveTo(x0+4,4,x0+8,-2); }
      g.quadraticCurveTo(11,-16,7,-33); g.closePath(); g.fillStyle=TH.cloak; g.fill(); g.stroke();
      g.fillStyle=TH.spot; for(const s of [-1,1]){ g.beginPath(); g.arc(s*13,-9,3.6,0,TAU); g.fill(); g.stroke(); }
    }
    // legs
    g.lineCap='round'; g.strokeStyle=O; g.lineWidth=5.6; g.beginPath(); g.moveTo(-3,-14); g.lineTo(-3-run*6,-1); g.moveTo(3,-14); g.lineTo(3+run*6,-1); g.stroke();
    g.strokeStyle=TH.suit2; g.lineWidth=3.2; g.beginPath(); g.moveTo(-3,-14); g.lineTo(-3-run*6,-1); g.moveTo(3,-14); g.lineTo(3+run*6,-1); g.stroke();
    // body, belt and pouch
    g.lineWidth=2.2; g.strokeStyle=O; g.fillStyle=TH.suit; g.beginPath(); g.ellipse(0,-22,7.6,10.5,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle=TH.gold; g.fillRect(-7,-17,14,2.6); g.fillStyle='#7a5a3a'; g.fillRect(3,-17,5,5); g.strokeRect(3,-17,5,5);
    // the arm that holds the Heart
    g.strokeStyle=O; g.lineWidth=5; g.beginPath(); g.moveTo(3,-27); g.lineTo(11,-25); g.stroke(); g.strokeStyle=TH.suit; g.lineWidth=3; g.beginPath(); g.moveTo(3,-27); g.lineTo(11,-25); g.stroke();
    // hood and feathery antennae
    g.lineWidth=2.2; g.strokeStyle=O; g.fillStyle=TH.hood; g.beginPath(); g.arc(0,-39,9.6,0,TAU); g.fill(); g.stroke();
    for(const s of [-1,1]){ g.strokeStyle=TH.gold; g.lineWidth=1.6; g.beginPath(); g.moveTo(s*3,-47); g.quadraticCurveTo(s*6,-57,s*14,-60); g.stroke(); for(let i=1;i<5;i++){ const t=i/5, x=s*(3+t*10), y=-47-t*12; g.beginPath(); g.moveTo(x,y); g.lineTo(x+s*3,y-3); g.stroke(); } }
    // the white mask with slanted eyes
    g.fillStyle=TH.mask; g.strokeStyle=O; g.lineWidth=1.8; g.beginPath(); g.moveTo(-1,-45); g.quadraticCurveTo(10,-47,10.8,-39); g.quadraticCurveTo(9.5,-31.5,1.5,-31.5); g.quadraticCurveTo(-3,-38,-1,-45); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=O; g.beginPath(); g.ellipse(6,-39.5,2.8,1.3,-0.35,0,TAU); g.fill();
    g.strokeStyle=TH.gold; g.lineWidth=1; g.beginPath(); g.arc(3,-43,1.5,0,Math.PI*1.5); g.stroke();
  });
}
function drawThief(T){
  const t=G.time, x=T.x, y=T.y-T.z, f=T.face||1;
  const pose=T.mode==='dive'||(T.mode==='move'&&T.leap)?'wings':T.mode==='move'?(Math.floor(t*10)%2?'run0':'run1'):'stand';
  ctx.save();
  ctx.globalAlpha=0.3*(T.alpha==null?1:T.alpha); ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(T.x,T.y+2,13,5,0,0,TAU); ctx.fill();
  ctx.globalAlpha=T.poof>0?0.35:(T.alpha==null?1:T.alpha);
  ctx.translate(x,y+(T.mode==='wait'?Math.sin(t*3)*0.8:0)); ctx.scale(f,1);
  const sp=thiefSpr(pose); rPut(sp,0,0);
  if(T.heart){ const hx=13, hy=-25, pu=0.75+0.25*Math.sin(t*5); ctx.fillStyle='#7a1a10'; ctx.beginPath(); ctx.arc(hx,hy,5,0,TAU); ctx.fill(); ctx.fillStyle=`rgb(255,${110+pu*60|0},60)`; ctx.beginPath(); ctx.arc(hx,hy,4,0,TAU); ctx.fill(); ctx.fillStyle='#ffe0a0'; ctx.beginPath(); ctx.arc(hx-1,hy-1.2,1.5,0,TAU); ctx.fill(); glowAt(hx,hy,26*pu,'255,140,60',0.7); }
  ctx.restore();
}
// the stand by the forge, with (or without) the Ember Heart on it
function drawPedestal(){
  const x=HV.pedestal.x, y=HV.pedestal.y, t=G.time;
  rPut(rSpr('c_pedestal',44,66,22,58,g=>{
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,2,15,5,0,0,TAU); g.fill();
    g.strokeStyle='#2a2420'; g.lineWidth=2;
    g.fillStyle='#8c847a'; g.fillRect(-12,-6,24,8); g.strokeRect(-12,-6,24,8);
    g.fillStyle='#a49c90'; g.fillRect(-7,-36,14,30); g.strokeRect(-7,-36,14,30); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(-6,-35,4,28);
    g.fillStyle='#8c847a'; g.fillRect(-11,-41,22,6); g.strokeRect(-11,-41,22,6);
    g.fillStyle='#c89a44'; g.beginPath(); g.moveTo(-9,-41); g.quadraticCurveTo(0,-34,9,-41); g.lineTo(6,-46); g.quadraticCurveTo(0,-41,-6,-46); g.closePath(); g.fill(); g.stroke();
  }),x,y);
  if(heartHome()){ const pu=0.75+0.25*Math.sin(t*3); ctx.fillStyle='#7a1a10'; ctx.beginPath(); ctx.arc(x,y-50,6.5,0,TAU); ctx.fill(); ctx.fillStyle=`rgb(255,${100+pu*70|0},55)`; ctx.beginPath(); ctx.arc(x,y-50,5.4,0,TAU); ctx.fill(); ctx.fillStyle='#ffe2a8'; ctx.beginPath(); ctx.arc(x-1.6,y-52,2,0,TAU); ctx.fill(); glowAt(x,y-50,40*pu,'255,130,50',0.8); }
}
function drawRocket(){
  const x=HV.rocket.x, y=HV.rocket.y, t=G.time;
  rPut(rSpr('c_rocket',44,96,22,86,g=>{
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,1,16,5,0,0,TAU); g.fill();
    g.strokeStyle='#3a2414'; g.lineWidth=3; g.beginPath(); g.moveTo(-13,0); g.lineTo(-4,-40); g.moveTo(13,0); g.lineTo(4,-40); g.moveTo(-9,-16); g.lineTo(9,-16); g.stroke();
    g.strokeStyle='#1e140c'; g.lineWidth=2;
    g.fillStyle='#d8382a'; g.fillRect(-6,-70,12,40); g.strokeRect(-6,-70,12,40);
    g.fillStyle='#ffd24a'; for(let i=0;i<4;i++) g.fillRect(-6,-66+i*10,12,4);
    g.fillStyle='#ffd24a'; g.beginPath(); g.moveTo(-8,-70); g.lineTo(0,-84); g.lineTo(8,-70); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='#5a3a1a'; g.lineWidth=1.5; g.beginPath(); g.moveTo(0,-30); g.quadraticCurveTo(6,-22,3,-14); g.stroke();
  }),x,y);
  if(HS.phase==='rocket'){ const k=0.5+0.5*Math.sin(t*6); glowAt(x+3,y-14,10+k*6,'255,200,90',0.8); }
}
// the cake table (a cake shaped like Ash), with Grandpa next to it in the 'lantern' ending, or in a birdcage ('heir')
function drawCake(){
  const x=HV.cake.x, y=HV.cake.y, e=G.choices.ending;
  rPut(rSpr('c_cake',130,96,65,64,g=>{
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,4,56,10,0,0,TAU); g.fill();
    g.strokeStyle='#2a1a0e'; g.lineWidth=2.2;
    g.fillStyle='#7a4e2c'; g.fillRect(-48,-8,6,12); g.fillRect(42,-8,6,12);
    g.fillStyle='#f4ecdc'; g.beginPath(); g.moveTo(-54,-26); g.lineTo(54,-26); g.lineTo(52,-6); g.lineTo(-52,-6); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#e8584a'; for(let i=0;i<9;i++){ g.beginPath(); g.arc(-48+i*12,-8,3,0,Math.PI); g.fill(); }
    // the cake: a round cake with Ash's face (red, two horns, big eyes)
    g.fillStyle='#f2d8a8'; g.beginPath(); g.ellipse(0,-30,26,9,0,0,TAU); g.fill(); g.stroke(); g.fillRect(-26,-46,52,16); g.strokeRect(-26,-46,52,16);
    g.fillStyle='#fff6ea'; g.beginPath(); g.ellipse(0,-46,26,9,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#d8482e'; g.beginPath(); g.ellipse(0,-56,14,12,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#ffe2a0'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*7,-64); g.lineTo(s*12,-76); g.lineTo(s*12,-63); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle='#fff'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*5,-58,3.6,0,TAU); g.fill(); g.stroke(); } g.fillStyle='#1a0e08'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*5+1,-57.6,1.6,0,TAU); g.fill(); }
    g.strokeStyle='#5a1a10'; g.lineWidth=1.5; g.beginPath(); g.moveTo(-4,-51); g.quadraticCurveTo(0,-48,4,-51); g.stroke();
    // cups
    for(const cx of [-42,36]){ g.fillStyle='#8ab8d8'; g.fillRect(cx,-34,8,9); g.strokeStyle='#2a1a0e'; g.lineWidth=1.5; g.strokeRect(cx,-34,8,9); }
  }),x,y);
  if(e==='lantern') drawMiniDragon(x-74,y+6,1,true);
  else if(e==='heir') drawCage(x+58,y-26);
}
function drawMiniDragon(x,y,f,hat){
  const t=G.time;
  ctx.save(); ctx.translate(x,y); ctx.scale(f,1);
  rPut(rSpr('c_minidragon'+(hat?'h':''),80,80,40,66,g=>{
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,1,18,6,0,0,TAU); g.fill();
    g.strokeStyle='#2a0c06'; g.lineWidth=2.2;
    g.fillStyle='#b8402a'; g.beginPath(); g.moveTo(-10,-4); g.quadraticCurveTo(-32,-2,-30,-16); g.quadraticCurveTo(-26,-10,-12,-12); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#8a2a18'; g.beginPath(); g.moveTo(-6,-26); g.quadraticCurveTo(-22,-44,-18,-20); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#c8482a'; g.beginPath(); g.ellipse(0,-14,13,15,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#f0a868'; g.beginPath(); g.ellipse(3,-11,7,10,0,0,TAU); g.fill();
    g.fillStyle='#c8482a'; g.beginPath(); g.ellipse(8,-34,11,9,0.2,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#e8784a'; g.beginPath(); g.ellipse(16,-31,6,5,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#fff0d4'; g.beginPath(); g.moveTo(2,-41); g.lineTo(-4,-52); g.lineTo(6,-43); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#ffcf4a'; g.beginPath(); g.arc(10,-36,2.6,0,TAU); g.fill(); g.fillStyle='#1a0806'; g.fillRect(9.6,-38,1.2,4);
    if(hat){ g.fillStyle='#4ac0e8'; g.beginPath(); g.moveTo(2,-42); g.lineTo(9,-60); g.lineTo(14,-41); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#ffe066'; g.beginPath(); g.arc(9,-61,3,0,TAU); g.fill(); }
  }),0,Math.sin(t*2)*0.6);
  ctx.restore();
  if(isNight()) glowAt(x+16*f,y-31,8,'255,140,60',0.3+0.2*Math.sin(t*4));
}
function drawCage(x,y){
  rPut(rSpr('c_cage',46,70,23,62,g=>{
    g.strokeStyle='#8a6420'; g.lineWidth=1.6;
    g.fillStyle='#c89a44'; g.fillRect(-15,-6,30,5);
    for(let i=0;i<7;i++){ const xx=-13+i*4.3; g.beginPath(); g.moveTo(xx,-6); g.quadraticCurveTo(xx*0.6,-44,0,-48); g.stroke(); }
    g.fillStyle='#c8482a'; g.beginPath(); g.ellipse(0,-14,6,7,0,0,TAU); g.fill(); g.strokeStyle='#2a0c06'; g.stroke(); g.beginPath(); g.ellipse(3,-23,5,4,0,0,TAU); g.fill(); g.stroke();
    g.fillStyle='#ffcf4a'; g.beginPath(); g.arc(5,-24,1.3,0,TAU); g.fill();
    g.strokeStyle='#c89a44'; g.lineWidth=2; g.beginPath(); g.arc(0,-52,4,0,TAU); g.stroke();
  }),x,y);
}
// paper lanterns strung over the green
const FEST_POSTS=(()=>{ const out=[]; for(let i=0;i<6;i++){ const a=i/6*TAU+0.3; out.push([Math.round(HV.green.x+Math.cos(a)*250),Math.round(HV.green.y-20+Math.sin(a)*180)]); } return out; })();
const FEST_STRINGS=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,3],[1,4]];
const LANT_COLS=['#ff6a4a','#ffd24a','#ff9ad0','#6ad8c8','#b89aff'];
function drawPost(x,y){
  rPut(rSpr('c_post',30,92,15,86,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,1,8,3,0,0,TAU); g.fill(); g.strokeStyle='#2a1a0e'; g.lineWidth=2; g.fillStyle='#7a5434'; g.fillRect(-2.5,-80,5,80); g.strokeRect(-2.5,-80,5,80); g.fillStyle='#ffd27a'; g.beginPath(); g.ellipse(0,-82,6,7,0,0,TAU); g.fill(); g.stroke(); }),x,y);
}
function drawBunting(t){
  const night=isNight();
  ctx.save(); ctx.lineWidth=1.4; ctx.strokeStyle='rgba(40,30,20,.75)';
  FEST_STRINGS.forEach(([a,b],si)=>{
    const [x0,y0]=FEST_POSTS[a], [x1,y1]=FEST_POSTS[b], ax=x0, ay=y0-82, bx=x1, by=y1-82, mx=(ax+bx)/2, my=(ay+by)/2+46;
    if(!inView(mx,my,320)) return;
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.quadraticCurveTo(mx,my,bx,by); ctx.stroke();
    for(let i=1;i<9;i++){ const u=i/9, x=(1-u)*(1-u)*ax+2*(1-u)*u*mx+u*u*bx, y=(1-u)*(1-u)*ay+2*(1-u)*u*my+u*u*by+Math.sin(t*2+i+si)*1.2;
      ctx.fillStyle=LANT_COLS[(i+si)%LANT_COLS.length]; ctx.beginPath(); ctx.ellipse(x,y+5,4.2,5.4,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(30,20,10,.8)'; ctx.lineWidth=1; ctx.stroke();
      if(night) glowAt(x,y+5,15,'255,200,120',0.45); }
    ctx.lineWidth=1.4; ctx.strokeStyle='rgba(40,30,20,.75)';
  });
  ctx.restore();
}
// barrels the thief kicks down onto the lane
function drawBarrel(b){
  const z=b.landed?0:Math.sin(Math.min(1,b.t/0.5)*Math.PI)*50, u=Math.min(1,b.t/0.5), x=b.landed?b.x:lerp(b.x0,b.x,u), y=b.landed?b.y:lerp(b.y0,b.y,u);
  const sp=rSpr('c_barrel',40,46,20,38,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(1,1,13,5,0,0,TAU); g.fill(); g.strokeStyle='#2a1a0c'; g.lineWidth=2; g.fillStyle='#9a6a3a'; g.beginPath(); g.moveTo(-11,-30); g.quadraticCurveTo(-15,-14,-11,0); g.lineTo(11,0); g.quadraticCurveTo(15,-14,11,-30); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#b8844e'; g.beginPath(); g.ellipse(0,-30,11,4,0,0,TAU); g.fill(); g.stroke(); g.strokeStyle='#4a4a52'; g.lineWidth=2.4; for(const yy of [-24,-7]){ g.beginPath(); g.moveTo(-13,yy); g.lineTo(13,yy); g.stroke(); } });
  ctx.save(); ctx.translate(x,y-z); ctx.rotate(b.landed?b.rot:u*4); if(b.landed&&b.life<1.2) ctx.globalAlpha=Math.max(0,b.life/1.2); rPut(sp,0,0); ctx.restore();
}
function drawBale(b){
  const sh=b.shake>0?Math.sin(G.time*60)*2*b.shake:0;
  ctx.save(); ctx.translate(b.x+sh,b.y);
  rPut(rSpr('c_bale',60,48,30,38,g=>{
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,1,24,7,0,0,TAU); g.fill();
    g.strokeStyle='#5a4012'; g.lineWidth=2.2; g.fillStyle='#e0b850'; rrect(g,-23,-30,46,30,7); g.fill(); g.stroke();
    g.fillStyle='#f2d278'; rrect(g,-21,-30,42,9,5); g.fill();
    g.strokeStyle='rgba(120,84,20,.6)'; g.lineWidth=1.2; for(let i=0;i<9;i++){ g.beginPath(); g.moveTo(-19+i*4.6,-20); g.lineTo(-21+i*4.6,-3); g.stroke(); }
    g.strokeStyle='#8a4a22'; g.lineWidth=2; for(const x of [-9,9]){ g.beginPath(); g.moveTo(x,-30); g.lineTo(x,0); g.stroke(); }
    g.strokeStyle='#e8c860'; g.lineWidth=1.4; for(const [x,y,a] of [[-20,-30,-0.6],[14,-31,0.5],[22,-12,1.2],[-23,-8,-1.3]]){ g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a-1.57)*6,y+Math.sin(a-1.57)*6); g.stroke(); }
  }),0,0);
  ctx.restore();
}
function drawPet(q){
  const hop=Math.abs(Math.sin(q.t*14))*5, f=q.dir;
  ctx.save(); ctx.translate(q.x,q.y-hop); ctx.scale(f,1); ctx.lineWidth=1.6; ctx.strokeStyle='#2a1a0e';
  if(q.k==='hen'){ ctx.fillStyle='#f6f2ea'; ctx.beginPath(); ctx.ellipse(0,-8,9,7,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(7,-15,4.5,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#e8402a'; ctx.beginPath(); ctx.arc(7,-20,2.4,0,TAU); ctx.fill(); ctx.fillStyle='#f0b030'; ctx.beginPath(); ctx.moveTo(11,-15); ctx.lineTo(15,-14); ctx.lineTo(11,-13); ctx.closePath(); ctx.fill(); }
  else{ ctx.fillStyle='#e89040'; ctx.beginPath(); ctx.ellipse(0,-7,10,6,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(9,-12,5,0,TAU); ctx.fill(); ctx.stroke(); for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(9+s*3,-15); ctx.lineTo(9+s*4,-20); ctx.lineTo(9+s*0.5,-16); ctx.closePath(); ctx.fill(); } ctx.beginPath(); ctx.moveTo(-9,-8); ctx.quadraticCurveTo(-18,-16,-14,-22); ctx.stroke(); }
  ctx.restore();
}
function drawGear(gr){
  const t=G.time, z=gr.z||0;
  ctx.save(); ctx.translate(gr.x,gr.y-z-4); ctx.rotate(gr.landed?0.3:t*8);
  ctx.fillStyle='#c8963a'; ctx.strokeStyle='#4a3010'; ctx.lineWidth=1.5; ctx.beginPath();
  for(let i=0;i<16;i++){ const a=i/16*TAU, r=i%2?6.5:8.5; i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#3a2410'; ctx.beginPath(); ctx.arc(0,0,2.4,0,TAU); ctx.fill(); ctx.restore();
  if(gr.landed){ const k=0.5+0.5*Math.sin(t*5); glowAt(gr.x,gr.y-4,14+k*6,'255,220,140',0.55); if(Math.random()<0.05) emit(gr.x+rand(-6,6),gr.y-8,1,{col:'255,240,200',smin:5,smax:20,lmin:.3,lmax:.6,zmin:1,zmax:2,rise:20}); }
}
// smoke clouds (lilac-grey puffs that drift and fade)
let PUFF=null;
function puffSpr(){ if(PUFF) return PUFF; const c=mkCanvas(64,64), g=c.getContext('2d'), gr=g.createRadialGradient(28,26,4,32,32,32); gr.addColorStop(0,'rgba(236,232,244,1)'); gr.addColorStop(0.55,'rgba(196,188,214,.85)'); gr.addColorStop(1,'rgba(160,150,186,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); PUFF=c; return c; }
function drawSmoke(){
  for(const s of HS.smoke){ if(!inView(s.x,s.y,s.r+40)) continue; const a=Math.min(1,s.t*4)*Math.max(0,1-(s.t-s.life+1)); if(a<=0) continue;
    const R=mulberry32(Math.floor(s.seed*1000)), sp=puffSpr(); ctx.save();
    for(let i=0;i<8;i++){ const ang=R()*TAU, d=R()*s.r*0.6, rr=s.r*(0.42+R()*0.32)*(1+s.t*0.12); ctx.globalAlpha=a*0.5; ctx.drawImage(sp,s.x+Math.cos(ang)*d+Math.sin(G.time+i)*3-rr,s.y+Math.sin(ang)*d*0.6-s.t*6-20-rr,rr*2,rr*2); }
    ctx.restore(); }
  for(const b of HS.bombs){ const u=b.t/b.dur, x=lerp(b.x0,b.x1,u), y=lerp(b.y0,b.y1,u)-Math.sin(u*Math.PI)*60; ctx.fillStyle='#4a3a6a'; ctx.beginPath(); ctx.arc(x,y,5,0,TAU); ctx.fill(); ctx.strokeStyle=TH.ink; ctx.lineWidth=1.5; ctx.stroke(); glowAt(x,y-5,6,'255,200,120',0.8); }
}
// the fireworks, drawn after the night shade so they shine
function drawFireworks(){
  if(!HS.fw.length&&!HS.rockets.length&&!HS.moth&&!HS.pops.length) return;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const f of HS.pops){ const k=f.t/0.45; glowAt(f.x,f.y,f.r*(0.5+k*0.7),f.col,0.85*(1-k)); }
  ctx.lineCap='round';
  for(const q of HS.fw){ const a=Math.max(0,q.life/q.max)*(q.tw?0.5+0.5*Math.sin(G.time*30+q.x):1), s=q.sz*(0.6+0.4*a);
    if(q.tw||q.trail){ ctx.fillStyle=`rgba(${q.col},${a})`; ctx.fillRect(q.x-s/2,q.y-s/2,s,s); continue; }
    ctx.strokeStyle=`rgba(${q.col},${a})`; ctx.lineWidth=s; ctx.beginPath(); ctx.moveTo(q.x-q.vx*0.07,q.y-q.vy*0.07); ctx.lineTo(q.x,q.y); ctx.stroke();
    if(q.gl) glowAt(q.x,q.y,s*3.4,q.col,a*0.55); }
  for(const r of HS.rockets){ glowAt(r.x,r.y-r.h,12,r.col,0.95); ctx.fillStyle='#fff8e0'; ctx.fillRect(r.x-1.5,r.y-r.h-1.5,3,3); }
  ctx.restore();
  if(HS.moth){ const M=HS.moth, u=M.t/1.3, x=lerp(M.x0,M.x1,u), y=M.y+u*60+Math.sin(u*12)*10, w=Math.sin(HS.moth.t*22); ctx.save(); ctx.translate(x,y); ctx.fillStyle='rgba(20,14,30,.92)'; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(s*14,-14-w*8,s*26,-4-w*10); ctx.quadraticCurveTo(s*16,6,0,4); ctx.closePath(); ctx.fill(); } ctx.fillRect(-1.5,-6,3,12); ctx.restore(); }
}
// the southern cliffs of Embermere and the sea beyond them (a cached strip at the south edge, near Emberhollow)
const CL={x0:1200,x1:4400,top:10922,lip:10940,sea:10982,bot:11210};
const clLip=x=>CL.lip+Math.sin(x*0.013)*3+Math.sin(x*0.051+1)*2.5;
const clSea=x=>CL.sea+Math.sin(x*0.009+2)*3+Math.sin(x*0.037)*2;
let CLIFF_CV=null;
function cliffCanvas(){
  if(CLIFF_CV) return CLIFF_CV;
  const w=CL.x1-CL.x0, h=CL.bot-CL.top, c=mkCanvas(w,h), g=c.getContext('2d'), rng=mulberry32(7711), X=x=>x-CL.x0, Y=y=>y-CL.top;
  // the sea
  const sg=g.createLinearGradient(0,Y(CL.sea),0,h); sg.addColorStop(0,'#2b86a0'); sg.addColorStop(0.3,'#1f6688'); sg.addColorStop(1,'#123c5c'); g.fillStyle=sg; g.fillRect(0,Y(CL.sea)-12,w,h);
  for(let i=0;i<w*h/900;i++){ const x=rng()*w, y=Y(CL.sea)+8+rng()*(h-8); g.strokeStyle=`rgba(210,240,250,${0.07+rng()*0.16})`; g.lineWidth=1.4; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+6,y-3,x+12+rng()*12,y); g.stroke(); }
  // rocks in the surf
  for(let i=0;i<34;i++){ const x=rng()*w, y=Y(clSea(x+CL.x0))+10+rng()*70, r=3+rng()*9; g.fillStyle='rgba(240,250,255,.5)'; g.beginPath(); g.ellipse(x,y+2,r+5,(r+5)*0.45,0,0,TAU); g.fill(); g.fillStyle='#4a4a50'; g.strokeStyle='#1e1e24'; g.lineWidth=1.5; g.beginPath(); g.ellipse(x,y,r,r*0.7,0,0,TAU); g.fill(); g.stroke(); g.fillStyle='rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(x-r*0.3,y-r*0.25,r*0.4,r*0.25,0,0,TAU); g.fill(); }
  // the cliff face
  g.beginPath(); g.moveTo(0,Y(clLip(CL.x0))); for(let x=0;x<=w;x+=6) g.lineTo(x,Y(clLip(x+CL.x0))); for(let x=w;x>=0;x-=6) g.lineTo(x,Y(clSea(x+CL.x0))); g.closePath();
  const cg=g.createLinearGradient(0,Y(CL.lip),0,Y(CL.sea)); cg.addColorStop(0,'#c7b493'); cg.addColorStop(0.5,'#a8957a'); cg.addColorStop(1,'#76675a'); g.fillStyle=cg; g.fill();
  g.save(); g.clip();
  for(let x=0;x<w;x+=5+rng()*14){ const y0=Y(clLip(x+CL.x0)), y1=Y(clSea(x+CL.x0)); g.strokeStyle=`rgba(70,56,44,${0.22+rng()*0.3})`; g.lineWidth=0.8+rng()*1.6; g.beginPath(); g.moveTo(x,y0+rng()*8); g.lineTo(x+rng()*5-2.5,y1-rng()*8); g.stroke(); }
  for(let i=0;i<3;i++){ g.strokeStyle='rgba(255,245,225,.18)'; g.lineWidth=2; g.beginPath(); for(let x=0;x<=w;x+=10){ const y=Y(clLip(x+CL.x0))+10+i*10+Math.sin(x*0.02+i)*2; x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
  g.restore();
  // the stairs of the Southern Pass, cut into the cliff
  const sx=X(HV.pass.x);
  for(let i=0;i<6;i++){ const yy=Y(CL.lip)+2+i*7, xx=sx-18+((i%2)?14:0); g.fillStyle='#d8c8a8'; g.fillRect(xx,yy,22,5); g.strokeStyle='#4a3a2a'; g.lineWidth=1.2; g.strokeRect(xx,yy,22,5); }
  g.fillStyle='#6a5034'; g.fillRect(sx-30,Y(CL.sea)-6,46,8); g.strokeStyle='#2a1a0e'; g.strokeRect(sx-30,Y(CL.sea)-6,46,8);
  // foam at the foot of the cliff
  for(let x=0;x<w;x+=3){ const y=Y(clSea(x+CL.x0)); g.fillStyle='rgba(250,252,255,.92)'; g.fillRect(x,y-1.5,3,3+Math.sin(x*0.3)*1.2); g.fillStyle='rgba(235,248,255,.38)'; g.fillRect(x,y+5+Math.sin(x*0.07)*2,3,2); }
  // the grassy lip with a bold dark edge (storybook outline) and tufts hanging over
  g.strokeStyle='#22301a'; g.lineWidth=3; g.beginPath(); for(let x=0;x<=w;x+=6){ const y=Y(clLip(x+CL.x0)); x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
  for(let x=0;x<w;x+=4+rng()*6){ const y=Y(clLip(x+CL.x0)); g.fillStyle=rng()<0.5?'#5d8a3a':'#4a7430'; g.beginPath(); g.moveTo(x-3,y-1); g.lineTo(x+rng()*2,y+3+rng()*5); g.lineTo(x+3,y-1); g.closePath(); g.fill(); }
  // soft ends: the strip fades into the dark at both sides
  g.globalCompositeOperation='destination-in'; const fg=g.createLinearGradient(0,0,w,0); fg.addColorStop(0,'rgba(0,0,0,0)'); fg.addColorStop(380/w,'rgba(0,0,0,1)'); fg.addColorStop(1-380/w,'rgba(0,0,0,1)'); fg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=fg; g.fillRect(0,0,w,h); g.globalCompositeOperation='source-over';
  CLIFF_CV=c; return c;
}
let CLIFF_COL=null;
{ const base=genProps; genProps=function(cx,cy){ let out=base(cx,cy); if(cy*CH+CH<10000||cy*CH>11000||cx*CH>CL.x1||cx*CH+CH<CL.x0) return out;
  const B=HROUTE.find(n=>n.hide).hide;
  return out.filter(p=>{ const cliff=p.y>CL.lip-34&&p.x>CL.x0+250&&p.x<CL.x1-250, hay=B.some(([x,y])=>dist2(p.x,p.y,x,y)<70*70); if(cliff||hay){ if(p.col) p.col.off=true; return false; } return true; }); }; }
{ const base=initWorld; initWorld=function(){ base(); if(!CLIFF_COL) CLIFF_COL=addCol({t:'r',x0:CL.x0+330,y0:CL.lip-4,x1:CL.x1-330,y1:11000}); }; }
function drawCliffs(t){
  if(!inView((CL.x0+CL.x1)/2,(CL.top+CL.bot)/2,(CL.x1-CL.x0)/2+60)) return;
  ctx.drawImage(cliffCanvas(),CL.x0,CL.top);
  // moving foam along the foot of the cliff
  ctx.save(); ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1.6;
  const a0=Math.max(CL.x0+360,cam.x-40), a1=Math.min(CL.x1-360,cam.x+W/zoom+40);
  for(let x=Math.floor(a0/70)*70;x<a1;x+=70){ const ph=t*0.9+x*0.05, y=clSea(x)+8+Math.sin(ph)*4; ctx.globalAlpha=0.35+0.3*Math.sin(ph*1.3); ctx.beginPath(); ctx.moveTo(x-14,y); ctx.quadraticCurveTo(x,y-4,x+14,y); ctx.stroke(); }
  ctx.restore();
}
function drawShip(S0,t){
  const x=S0.x, y=S0.y+Math.sin(t*1.4)*1.6, a=S0.a==null?1:S0.a; if(!inView(x,y,160)) return;
  ctx.save(); ctx.globalAlpha=a;
  ctx.strokeStyle='rgba(240,250,255,.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y+10,70,10,0,0,TAU); ctx.stroke();
  rPut(rSpr('c_ship',176,150,88,118,g=>{ g.scale(0.82,0.82);
    const O='#1e140c'; g.lineWidth=2.4; g.strokeStyle=O;
    g.fillStyle='#6a4428'; g.beginPath(); g.moveTo(-60,-12); g.lineTo(62,-12); g.quadraticCurveTo(54,10,32,12); g.lineTo(-42,12); g.quadraticCurveTo(-58,6,-60,-12); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='rgba(30,18,8,.5)'; g.lineWidth=1.2; for(const yy of [-4,4]){ g.beginPath(); g.moveTo(-56,yy); g.lineTo(56,yy); g.stroke(); }
    g.fillStyle='#8a5a34'; g.fillRect(-60,-16,122,5); g.strokeStyle=O; g.lineWidth=2; g.strokeRect(-60,-16,122,5);
    g.fillStyle='#4a3020'; g.fillRect(-3,-104,5,90); g.strokeRect(-3,-104,5,90);
    // the moth-wing sail
    g.fillStyle='#b4a8d8'; g.beginPath(); g.moveTo(3,-100); g.bezierCurveTo(56,-92,66,-40,4,-22); g.closePath(); g.fill(); g.lineWidth=2.4; g.stroke();
    g.fillStyle='#8a7cb4'; g.beginPath(); g.moveTo(-3,-94); g.bezierCurveTo(-40,-80,-46,-40,-3,-26); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=TH.spot; g.beginPath(); g.arc(30,-60,9,0,TAU); g.fill(); g.stroke(); g.fillStyle=O; g.beginPath(); g.arc(30,-60,4,0,TAU); g.fill();
    g.fillStyle=TH.spot; g.beginPath(); g.arc(-22,-56,6,0,TAU); g.fill(); g.stroke(); g.fillStyle=O; g.beginPath(); g.arc(-22,-56,2.6,0,TAU); g.fill();
    g.fillStyle='#e2b65c'; g.beginPath(); g.moveTo(2,-104); g.lineTo(22,-110); g.lineTo(2,-114); g.closePath(); g.fill(); g.stroke();
  }),x,y);
  glowAt(x-54,y-22,22+Math.sin(t*5)*3,'255,190,110',0.7);
  const T=HS.thief; if(T&&T.onShip){ ctx.save(); ctx.translate(x-6,y-12); rPut(thiefSpr('stand'),0,0,0.9); ctx.restore(); }
  ctx.restore();
}
// ---------- render hooks
{ const base=drawPools; drawPools=function(){ base(); try{ if(G&&!AREA&&curMap()===0&&player){ drawCliffs(G.time); if(HS.ship&&G.mode==='story') drawShip(HS.ship,G.time); } }catch(e){ console.error(e); } }; }
const HLT=[], HSDBG={};
function hsLightsSync(){
  for(const L of HLT){ const i=LIGHTS.indexOf(L); if(i>=0) LIGHTS.splice(i,1); }
  HLT.length=0;
  if(!G||G.mode!=='story'||AREA||curMap()!==0||HSDBG.lights) return;
  const add=(x,y,r,i,fire)=>{ const L={x,y,r,i,fire:!!fire,c7:true}; HLT.push(L); LIGHTS.push(L); };
  if(festDecor()&&dist2(player.x,player.y,HV.green.x,HV.green.y)<1800*1800){ for(const p of FEST_POSTS) add(p[0],p[1]-50,200,0.6,true); add(HV.cake.x,HV.cake.y-20,140,0.5,true); }
  if(heartHome()) add(HV.pedestal.x,HV.pedestal.y-46,160,0.85,true);
  const T=HS.thief; if(T&&T.heart&&!T.onShip&&T.mode!=='hide') add(T.x,T.y-T.z-26,120,0.65,true);
  for(const f of HS.flash){ const k=1-f.t/f.life; add(f.x,f.y,f.r,f.i*k); }
  if(HS.ship) add(HS.ship.x-54,HS.ship.y-22,120,0.6*(HS.ship.a==null?1:HS.ship.a),true);
  if(HS.gear&&HS.gear.landed) add(HS.gear.x,HS.gear.y,70,0.5);
}
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{
  hsLightsSync();
  if(!G||G.mode!=='story'||AREA||curMap()!==0) return;
  if(festDecor()&&!HSDBG.ents){
    for(const [x,y] of FEST_POSTS) if(inView(x,y,90)) list.push({x,y,draw:()=>drawPost(x,y)});
    if(inView(HV.cake.x,HV.cake.y,120)) list.push({x:HV.cake.x,y:HV.cake.y,draw:drawCake});
  }
  if(G.stage==='c_fest'&&inView(HV.pedestal.x,HV.pedestal.y,80)) list.push({x:HV.pedestal.x,y:HV.pedestal.y,draw:drawPedestal});
  if(G.stage==='c_fest'&&!G.flags.c_stolen&&HS.phase!=='show'&&HS.phase!=='theft'&&inView(HV.rocket.x,HV.rocket.y,100)) list.push({x:HV.rocket.x,y:HV.rocket.y,draw:drawRocket});
  const T=HS.thief; if(T&&!T.onShip&&inView(T.x,T.y-T.z,120)){ const n=HROUTE[T.seg]; const sy=(T.mode==='wait'&&n.roof)?roofFront(T.x,T.y)+2:T.y+(T.z>4?60:0); list.push({x:T.x,y:sy,draw:()=>drawThief(T)}); }
  for(const b of HS.obst) if(inView(b.x,b.y,60)) list.push({x:b.x,y:b.y,draw:()=>drawBarrel(b)});
  if(HS.bales) for(const b of HS.bales) if(inView(b.x,b.y,60)) list.push({x:b.x,y:b.y,draw:()=>drawBale(b)});
  for(const q of HS.pets) if(inView(q.x,q.y,40)) list.push({x:q.x,y:q.y,draw:()=>drawPet(q)});
  if(HS.gear&&inView(HS.gear.x,HS.gear.y,40)) list.push({x:HS.gear.x,y:HS.gear.y,draw:()=>drawGear(HS.gear)});
  }catch(e){ console.error(e); } }; }
// the front (south) edge of the house a roof spot belongs to, so the thief sorts in front of it
function roofFront(x,y){ for(const h of mapList(HOUSES,0)){ if(Math.abs(x-h.x)<h.w/2+8&&y>h.y-h.h/2-14&&y<h.y+h.h/2) return h.y+h.h/2; } return y; }
{ const base=drawMarkers; drawMarkers=function(t){ base(t); try{ if(!G||G.mode!=='story'||AREA||curMap()!==0) return; if(festDecor()&&!HSDBG.bunt) drawBunting(t); drawSmoke(); const C=HS.crow; if(C) drawCrowAt(ctx,C.x,C.y,C.flap/TAU,C.mode==='sit'); }catch(e){ console.error(e); } }; }
{ const base=drawTexts; drawTexts=function(){ try{ if(G&&G.mode==='story'&&!AREA&&curMap()===0) drawFireworks(); }catch(e){ console.error(e); } base(); }; }

// ================= __eb.actStart(n): a fresh save at the start of act n with a fair loadout (for tests)
const UP_ORDER=['scales','claws','tempered','stamina','lungs','warding','arc','furnace','heart','blood','wings','scales','claws','tempered','warding','lungs','stamina','arc','heart','furnace'];
function kitFor(n){
  const K={level:1,abil:[],weapons:['sword'],tier:0,coins:0,bless:0,items:{},flags:{}};
  for(let k=2;k<=n;k++){ const A=ACTS[k]; const k0=(A&&A.kit)||{};
    for(const f of ['level','tier','coins','bless']) if(k0[f]!=null) K[f]=Math.max(K[f],k0[f]);
    for(const id of k0.abil||[]) if(!K.abil.includes(id)) K.abil.push(id);
    for(const id of k0.weapons||[]) if(!K.weapons.includes(id)) K.weapons.push(id);
    Object.assign(K.items,k0.items||{}); Object.assign(K.flags,k0.flags||{}); }
  return K;
}
function actOneDone(){
  const F=G.flags; Object.assign(F,{forge:true,pip:true,gate:true,gateHint:true,ironHint:true,act1_done:true,trial_leap_done:true,trial_tide_done:true,trial_sky_done:true,trial_leap_boss:true,trial_tide_boss:true,trial_sky_boss:true});
  for(const b of ['grizzlefang','morrow','broodmother','gloamjaw','greymane','cindervane','vorlaxis']) G.bossDone[b]=true;
  G.wards={hollow:true,ash:true,crag:true,mire:true,frost:true}; G.wardReady={ash:true,crag:true,mire:true,frost:true};
  Object.assign(G.choices,{morrow:'free',fennick:'forgive',greymane:'ally',cinder:'ally',ending:'hero'});
  for(const L of LANTERNS){ L.lit=true; G.lanterns[L.id]=true; } if(GATE_COL) GATE_COL.off=true;
  for(const s of SHRINES) if(s.x<IZX-50&&mapAt(s.y)===0) G.shrines[s.id]=true;
}
function actStartDebug(n,where){
  n=clamp(n|0,1,5);
  try{ SFX.init(); }catch(e){}
  DLG=null; hideAll(); newRun('story'); clearStatic(); fogInit('');
  player.x=POI.village.x+60; player.y=POI.village.y+150; player.facing=-Math.PI/2;
  if(n===1){ setupNPCs(); placeGoat(); scene='play'; updateCam(0,true); G.chunkBurst=16; saveGame(true); later(0.4,questUpdated); return {stage:G.stage,act:G.act,x:Math.round(player.x),y:Math.round(player.y),level:player.level,map:curMap()}; }
  actOneDone();
  const K=kitFor(n), p=player;
  for(let i=0;i<60&&p.level<K.level;i++) gainXp(Math.max(1,xpNeed(p.level)-p.xp));
  G.pendingBless=0;
  for(let i=0;i<K.bless;i++){ const u=UPGRADES.find(q=>q.id===UP_ORDER[i%UP_ORDER.length]); if(u&&!(u.once&&p.ups[u.id])){ u.apply(p); p.ups[u.id]=(p.ups[u.id]||0)+1; } }
  for(const id of K.abil){ G.abil[id]=true; if(id==='dbljump'||id==='skimmer') G.skills[id]=1; }
  G.weapons={}; for(const id of K.weapons) if(WEAPONS[id]) G.weapons[id]=true; G.weapons.sword=true; G.weapon='sword';
  G.tier=K.tier; G.coins=K.coins; Object.assign(G.items,K.items); Object.assign(G.flags,K.flags);
  for(let k=1;k<n;k++){ G.flags['act'+k+'_done']=true; if(ACT_PRE[k]) G.flags[ACT_PRE[k]+'done']=true; }
  const A=ACTS[n]||{};
  let st=null;
  if(n===2&&where==='heist'){ st='c_fest'; for(const k of ['c_fest_seen','c_stolen','c_leapt','c_t_maren','c_t_yara','c_t_wren']) delete G.flags[k]; delete G.items.c_gear; }
  else st=(typeof where==='string'&&STAGEDEF[where])?where:(A.arrive&&STAGEDEF[A.arrive]?A.arrive:actStages(n)[0]);
  if(!st){ const L=STAGES.filter(s=>actOf(s)<n); st=L[L.length-1]||'done'; }
  G.stage=st;
  const d=STAGEDEF[st], M=MAPS[A.map];
  const at=(where&&typeof where==='object'&&where.x!=null)?where:(d&&actOf(st)===n&&d.at)||A.at||(M&&M.spawn)||{x:POI.village.x+60,y:POI.village.y+150};
  G.mapsSeen=G.mapsSeen||{0:true}; for(let k=0;k<=(A.map||0);k++) if(MAPS[k]) G.mapsSeen[k]=true;
  p.x=at.x; p.y=at.y; p.hp=p.maxHp; p.hpShow=p.hp; p.potions=p.potionsMax; p.stamina=p.maxStamina; p.energy=p.maxEnergy;
  if(where==='heist') G.tod=0.84;
  G.banner=null; G.bannerQ=[];
  setupNPCs(); spawnPip(); placeGoat();
  scene='play'; hideAll(); updateCam(0,true); G.chunkBurst=16;
  ACT_RT.last=null; ACT_RT.prev=null; ACT_RT.stageT=G.time; ACT_RT.fromLoad=true;
  saveGame(true); later(0.6,questUpdated);
  return {stage:G.stage,act:G.act,x:Math.round(p.x),y:Math.round(p.y),level:p.level,map:curMap()};
}
window.__ebX=Object.assign(window.__ebX||{},{
  actStart:actStartDebug, goStage, startAct, endAct, actOf, actLabel, stageLabel, ACTS, STAGEDEF, STAGES, HROUTE, HV,
  heist:()=>{ const T=HS.thief; return {on:HS.on,phase:HS.phase,t:HS.t,chaseT:HS.chaseT,stage:G.stage,thief:T?{x:Math.round(T.x),y:Math.round(T.y),z:Math.round(T.z),seg:T.seg,mode:T.mode,onShip:T.onShip}:null,guide:heistGuide(),obst:HS.obst.filter(b=>b.landed).map(b=>({x:Math.round(b.x),y:Math.round(b.y)})),smoke:HS.smoke.length,gear:HS.gear?{x:Math.round(HS.gear.x),y:Math.round(HS.gear.y),landed:HS.gear.landed}:null,ship:!!HS.ship,crow:HS.crow?HS.crow.mode:null,runIn:!!HS.runIn}; },
  heistFest:()=>{ if(G.stage!=='c_fest') goStage('c_fest',{card:false,quiet:true}); ACT_RT.stageT=-99; festStart(); return HS.phase; },
  heistRocket:()=>rocketLaunch(),
  letterNow:()=>{ if(G.stage==='done'&&G.flags.act1_done){ G.flags.c_wait=LETTER_T; return true; } return false; },
  hsBench(n){ n=n||50; const now=()=>performance.now(), out={}, Z=DPR*zoom; const tm=(k,f)=>{ ctx.save(); ctx.setTransform(Z,0,0,Z,-cam.x*Z,-cam.y*Z); const t0=now(); for(let i=0;i<n;i++) f(); out[k]=+((now()-t0)/n).toFixed(3); ctx.restore(); };
    tm('bunting',()=>drawBunting(G.time)); tm('cliffs',()=>drawCliffs(G.time)); tm('fireworks',()=>drawFireworks()); tm('smoke',()=>drawSmoke()); tm('lights',()=>hsLightsSync());
    tm('props',()=>{ for(const [x,y] of FEST_POSTS) drawPost(x,y); drawCake(); drawPedestal(); drawRocket(); if(HS.thief) drawThief(HS.thief); });
    return out; },
  HSDBG, actsRT:()=>({last:ACT_RT.last,stageT:ACT_RT.stageT,time:G.time,fromLoad:ACT_RT.fromLoad,inCombat:G.inCombat,map:curMap(),scene,d:Math.round(dist(player.x,player.y,HV.village.x,HV.village.y))}),
  actsWin:()=>ACT_RT.win?{next:!!ACT_RT.win.next,tag:$('#winTag').textContent,title:$('#winTitle').textContent}:null,
  actsDbg:()=>({HOUSES:HOUSES.filter(h=>h.x<6000&&h.y>8000).map(h=>({x:h.x|0,y:h.y|0,w:h.w,h:h.h,k:h.k,town:h.town}))}),
  pBlocked:(x,y)=>playerBlocked(x,y), colAt:(x,y,r)=>colAt(x,y,r), propsAt:(x,y)=>propsFor(Math.floor(x/CH),Math.floor(y/CH)).length
});
