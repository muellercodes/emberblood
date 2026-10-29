// ================= Lantern Eve: the prologue of a new journey (v12 PROLOGUE)
// Drew: "full build of the prologue to expand the start of a new adventure". A new journey now opens on the night before
// Lantern Day: the village green, the paper lanterns going up, and Nana Pettibone's puppet show of the old folk tale (a
// grumpy dragon on the mountain, five brave friends, a girl with horns who sings him to sleep), drawn here as a little
// hand-painted theatre with the puppets moving. Ash is in the crowd. Then he walks home himself (the first steps, in the
// story's own words), gets into bed, Mom comes up to say goodnight, and the old morning plays (STORY.prologue, Mom
// calling up the stairs; a9b_flow.js startMorning). The truth stays for Yara (REVEAL_PLAN): every line here is the folk
// version, or something small the story pays off later (the warm stone, Yara watching the mountain, the grey moth, Mom's
// hand when the dragon roars, the lamps low because the oil ran out, the puppet's crooked felt horn, the lullaby's "one
// more", the forge lit late for the sword).
// Only a new journey sees it (startStory loads a save first); every new journey plays it again.
// Skipping: one tap on the Skip pill (always up), Escape, the controller's back or start button, or the dialogue's own
// Skip, at any point. A skip goes straight to the morning in bed, the same place the whole prologue ends.
// Tests: __eb.skipDialogue() (one call, as the old drivers do) skips the prologue and the morning both;
// window.__ebDbg.pro has state(), skip(), beat(name); window.__ebNoPrologue=true before a new journey turns it off.

const PRO={on:false,phase:'',beat:'green',bt:0,watched:false,el:null,cv:null,skipEl:null,raf:0,last:0,t:0,
  cover:false,fade:0,fadeTo:0,fadeK:2,after:null,cx:0,cxT:0,sc:1,dpr:1,ck:'',C:{},barks:{},bed:null,titleAt:0,repeat:false,
  walkT:0,moth:null,shakeT:0,turnK:0,squeeze:0};
const PRO_SEEN='eb_lantern_eve';
function proWanted(){ try{ if(window.__ebNoPrologue) return false; }catch(e){} return !!(G&&G.mode==='story'); }
function proSeenBefore(){ try{ return localStorage.getItem(PRO_SEEN)==='1'; }catch(e){ return false; } }
function proMarkSeen(){ try{ localStorage.setItem(PRO_SEEN,'1'); }catch(e){} }

// ---------- the script. A line: proL(who, full, simple, face, beat) (beat: what the theatre does as the line comes up)
function proL(who,full,simple,face,beat,x){ const o={who,text:simple!=null?S(full,simple):full}; if(face) o.face=face; if(beat) o.fn=()=>proBeat(beat); return x?Object.assign(o,x):o; }
function proShowLines(){ return [
  proL('narr',`It's the night before Lantern Day, and all of Emberhollow is out on the green, stringing up paper lanterns. Tomorrow you light the three big ones. Everybody keeps reminding you: gently.`,`Tomorrow is Lantern Day. You light the three big lanterns. Everybody says: gently!`,null,'green'),
  proL('bertram',`Evening, Ash. You'll sit at the front tonight, won't you? Nice and far from the bun table.`,`Evening, Ash. Sit far from the buns, please.`,'worried'),
  proL('ash',`I haven't set anything on fire since spring.`,`Nothing has caught fire since spring.`,'happy'),
  proL('bertram',`Spring was when it happened, Ash.`,null,'worried'),
  proL('fennick',`Evening, Ash! Don't mind the lamps. They're low tonight. Saving the oil for tomorrow. Big day, lots of lamps.`,`Evening! The lamps are low. I'm saving oil for tomorrow.`,'shy','fennick'),
  proL('narr',`You squeeze in at the front with the little ones, on the old stone under the oak. It's warm, the way it always is, even after dark.`,`You sit on the old stone under the oak. It is warm, like always.`,null,'seat'),
  proL('rook',`Ash, sit by me! Nana says the dragon's extra scary this year.`,`Sit by me! Nana says the dragon is extra scary!`,'happy'),
  Object.assign(proL('narr',`Two of the littlest ones turn round to stare at your horns. One of them points. They do it every year.`,`Two little ones stare at your horns. One points.`,null,'point'),{opts:[
    {t:S(`Wiggle your tail at them.`,`Wiggle your tail.`),then:[proL('narr',`You flick your tail. Its ember winks. They shriek and hide behind Rook, delighted.`,`You flick your tail. They shriek and hide, giggling.`,null,'flick')]},
    {t:`Wave.`,then:[proL('narr',`You wave. The smaller one waves back with the hand she was pointing with.`,`You wave. She waves back.`,null,'wave')]},
    {t:S(`Do a very small roar.`,`Do a tiny roar.`),then:[proL('ash',`Rrrr.`,null,'sly'),proL('narr',`They shriek and hide behind Rook. Then they peek out again, hoping you'll do it again.`,`They hide, then peek out for more.`,null,'flick')]}
  ]}),
  proL('wendel',`Settle down, everyone. A little tune, and then Nana's dragon. And tomorrow at sunset, the Lantern Waltz. Very note-worthy.`,`Settle down! A tune, then the dragon. My waltz is tomorrow!`,'happy','tune'),
  proL('narr',`The little red curtains open on a cardboard mountain, with cotton smoke on a wire.`,`The curtains open on a cardboard mountain.`,null,'open'),
  proL('nana',`Once upon a time, dears, a grumpy old dragon lived at the top of the mountain. And everything he saw, he said was his.`,`Once, a grumpy dragon lived on the mountain. He said everything was his.`,'sly','dragon'),
  proL('narr',`Every child on the green shouts his word for him: "Mine!" You shout it loudest.`,`All the kids shout his word: "Mine!" You shout loudest.`,null,'mine'),
  proL('nana',`His sheep, his rivers, his sky. And if anybody argued, he roared!`,`His sheep, his sky. And if you argued, he roared!`,'sly','roar'),
  proL('narr',`The sock dragon lunges at the front row, and the little ones scream. Mom's hand comes down on your shoulder and squeezes, hard. Then it lets go.`,`The dragon lunges. Mom's hand squeezes your shoulder. Then it lets go.`,null,'squeeze'),
  proL('ash',`Mom. It's a sock.`,null,'laughing','calm'),
  proL('maren',`It's a very loud sock.`,null,'sly'),
  proL('nana',`So five brave friends climbed the mountain to make him share. A lantern-maker, a big one with a hammer, one who could talk to drakes, one with a reed pipe, and one with a spear.`,`Five brave friends climbed up to make him share.`,'happy','friends'),
  proL('narr',`The dragon sweeps his tail, and all five friends fall over in a heap. Hal laughs so hard he has to sit down on the grass.`,`The dragon swings his tail. All five fall in a heap.`,null,'tumble'),
  proL('nana',`Then up climbed a little girl with horns, called Ember. She wasn't scared of him one bit. She sat down beside him, and she sang.`,`Then a girl with horns, called Ember, climbed up. She sat by him and sang.`,'tender','girl'),
  proL('narr',`Every head on the green turns round to look at you. The puppet's horns are felt, and one of them is sewn on crooked.`,`Everyone turns to look at you. The puppet's horns are felt. One is crooked.`,null,'turn'),
  proL('narr',`Wendel plays, and everybody sings the old lullaby with her: "Little lantern, burning bright, light the way home through the night. One for you and one for me, and one more, just to see."`,`Everyone sings: "Little lantern, burning bright, light the way home through the night."`,null,'sing',{mood:'lantern'}),
  proL('nana',`And the grumpy old dragon yawned, and curled up, and fell fast asleep. That's why we hang out the lanterns every summer, dears. To keep the dark small.`,`The dragon fell asleep. That is why we hang lanterns: to keep the dark small.`,'tender','sleep'),
  proL('narr',`Far off, Cinder Mountain gives a long, low rumble. A cup rattles on the bun table.`,`Far off, the mountain rumbles. A cup rattles.`,null,'rumble',{mood:'night'}),
  proL('hal',`Hear that? The old dragon's snoring along!`,`Hear that? The dragon is snoring!`,'laughing'),
  proL('narr',`Everyone laughs and claps, Hal first. Nana peeks round the side of the booth and makes the dragon take a bow.`,`Everyone claps. Nana makes the dragon bow.`,null,'bow'),
  proL('narr',`Elder Yara isn't clapping. She's at the edge of the green with her shawl pulled tight, looking at the mountain instead of the show.`,`Yara isn't clapping. She is looking at the mountain.`,null,'yara'),
  proL('ash',`Yara? You missed the best bit.`,null,'happy'),
  proL('yara',`I saw it, Ash. Nana's dragon has lost an eye since last year. I'm being kind and not looking.`,`I saw. The dragon lost an eye. I'm being kind.`,'sly'),
  proL('narr',`A plain grey moth lands on the lantern by the stage and spreads its wings over the paper, as if the lantern were already lit.`,`A grey moth lands on a lantern, as if it were lit.`,null,'moth'),
  proL('maren',`Right. Home, you. Teeth, then bed. I'm helping Yara with the last string, and I'll be ten minutes behind you.`,`Home, you. Teeth, then bed. I'll be ten minutes behind you.`,'happy','home')
]; }
function proBedLines(){ return [
  proL('narr',`You're nearly asleep when the front door creaks. Mom's boots come up the stairs, one at a time, trying to be quiet.`,`Later, Mom comes up the stairs, very quietly.`),
  proL('maren',`Teeth?`,null,'sly'),
  proL('ash',`Teeth.`,null,'sleepy'),
  Object.assign(proL('ash',`Mom?`,null,'sleepy'),{opts:[
    {t:S(`Was there really a girl called Ember?`,`Was Ember real?`),then:[proL('maren',`Tail in, love. You'll set the quilt going.`,`Tail in. You'll burn the quilt.`,'tender'),proL('ash',`Mom.`,null,'sleepy'),proL('maren',`It's a puppet show, Ash. Go to sleep.`,null,'tender')]},
    {t:S(`Why have I got horns, when nobody else has?`,`Why do I have horns?`),then:[proL('maren',`Your great-gran had them. They skip about in our family, like red hair.`,`Your great-gran had them. They skip about, like red hair.`,'tender'),proL('ash',`Bertram says it's more like a house fire.`,`Bertram says it's like a house fire.`,'sleepy'),proL('maren',`Then Bertram can bake his own birthday cake this year.`,`Then Bertram can bake his own cake.`,'laughing')]},
    {t:S(`Did you see? I didn't even jump at the roar.`,`I didn't jump at the roar!`),then:[proL('maren',`I saw. You were very brave about the sock.`,null,'laughing')]}
  ]}),
  proL('narr',`She pinches out the candle. In the dark she sits on the end of the bed a little longer than she needs to. Then she kisses the top of your head, between the horns.`,`She puts out the candle and sits a while. Then she kisses your head.`,null,null,{fn:()=>{ if(PRO.on) proFadeTo(0.6,1.6,null); }}),
  proL('maren',`Night, Ash.`,null,'tender'),
  proL('narr',`Her boots go back down the stairs and out of the door. Soon, down the lane, the forge is lit again, and a small hammer goes tink, tink, tink.`,`Mom goes out. Down the lane, a small hammer goes tink, tink.`),
  proL('narr',`Far away, the mountain rumbles in its sleep. You don't hear it. You're already asleep.`,`Far away, the mountain rumbles. You are already asleep.`)
]; }
// on the walk home: the three still out on the green say goodnight, and Ash passes the lanterns he lights tomorrow
const PRO_TALK={
  maren:()=>[proL('maren',`Home, Ash. Teeth first. I'll be right behind you.`,`Home! Teeth first.`,'happy')],
  yara:()=>[proL('yara',`Goodnight, Ash. Sleep while you can. Tomorrow is a big day.`,`Goodnight, Ash. Sleep well.`,'tender')],
  nana:()=>[proL('nana',`The dragon's in my wheelbarrow, dear, under the curtains. He's had a long night.`,`The dragon is in my wheelbarrow, dear.`,'happy')]
};

// ---------- the flow: title, show, walk, home, bed, then the morning
function proStart(){
  if(!proWanted()) return false;
  Object.assign(PRO,{on:true,phase:'title',beat:'green',bt:0,watched:false,barks:{},bed:null,cover:true,fade:1,fadeTo:0,fadeK:1.4,after:null,
    cx:-120,cxT:-120,t:0,titleAt:performance.now(),repeat:proSeenBefore(),walkT:0,moth:null,shakeT:0,turnK:0,squeeze:0});
  G.tod=0.88; G.wolfT=1e9; G.flags.lantern_eve=0;
  proHookTests();
  scene='prologue'; try{ keys.clear(); }catch(e){} hideAll();
  proOverlay(true); proSkipShow(true);
  showCard(S('Prologue','Prologue'),S('Once Upon a Lantern','Once Upon a Lantern'));
  setTimeout(()=>{ if(PRO.on&&PRO.phase==='title') proShow(); },2700);
  return true;
}
function proShow(){
  if(!PRO.on||PRO.phase!=='title') return;
  PRO.phase='show';
  runDialogue(proShowLines(),proShowEnd);
}
function proShowEnd(){
  if(!PRO.on) return;
  PRO.watched=true; G.flags.lantern_eve=1; proMarkSeen();
  scene='prologue'; PRO.phase='towalk';
  proFadeTo(1,1.6,()=>{ if(!PRO.on) return; proWalkSetup(); PRO.cover=false; proFadeTo(0,1.2,()=>{ if(PRO.phase!=='bed') proOverlay(false); }); });
}
function proWalkSetup(){
  const V=POI.village, Wd=WARDS&&WARDS.hollow;
  PRO.phase='walk'; PRO.walkT=0; scene='play'; hideAll();
  if(AREA) exitArea(true);
  player.x=(Wd?Wd.x:V.x-40)+14; player.y=(Wd?Wd.y:V.y-190)+74; player.facing=Math.PI/2; player.kvx=player.kvy=0;
  proNpcs();
  G.prompt=null; G.banner=null; if(G.bannerQ) G.bannerQ.length=0;
  updateCam(0,true); G.chunkBurst=16;
}
// the green empties: three are still out, putting the night away (Mom and Yara at the last string, Nana at the well)
function proNpcs(){
  const V=POI.village, keep={maren:[V.x-190,V.y-270],yara:[V.x-300,V.y-190],nana:[V.x+64,V.y-52]};
  G.npcs=(G.npcs||[]).filter(n=>keep[n.id]);
  for(const n of G.npcs){ const k=keep[n.id]; n.x=k[0]; n.y=k[1]; n.home=[k[0],k[1]]; n.walk=false; n.walker=false; n.face=angTo(n.x,n.y,player.x,player.y); }
}
// Ash gets into his own bed (the bed's prompt says so during the prologue): Mom comes up to say goodnight
function proBed(bed){
  PRO.phase='bed'; PRO.bed=bed;
  WAKE.on=true; WAKE.bed=bed; player.x=bed.x; player.y=bed.y+8; player.facing=Math.PI/2; player.kvx=player.kvy=0;
  G.prompt=null; SFX.play('step',0.6);
  PRO.fade=0; proFadeTo(0.32,1.4,null);   // the attic at night, one candle
  runDialogue(proBedLines(),()=>{ scene='prologue'; proFadeTo(1,1.8,()=>proFinish(false)); });
}
// the end of the prologue, or a skip from anywhere in it: clean up, then the morning (Mom calling up the stairs)
function proFinish(skipped){
  if(!PRO.on) return;
  if(skipped&&PRO.phase!=='title'&&PRO.phase!=='show') G.flags.lantern_eve=1;
  PRO.on=false; PRO.phase='done'; PRO.after=null;
  try{ if(DLG){ DLG=null; } hideAll(); Music.duck(false); }catch(e){}
  try{ const c=document.getElementById('card'); if(c&&skipped) c.classList.remove('on'); }catch(e){}
  G.tod=0.32; G.wolfT=20; G.taunt=null; if(G.tauntQ) G.tauntQ.length=0; G.banner=null; if(G.bannerQ) G.bannerQ.length=0; G.prompt=null;
  WAKE.on=false; WAKE.bed=null;
  if(PRO.bed){ delete PRO.bed.prompt; PRO.bed=null; }
  try{ keys.clear(); mouse.l=mouse.r=false; }catch(e){}
  proSkipShow(false);
  setupNPCs(); proFree();
  PRO.cover=true; PRO.fade=1;
  startMorning();
  PRO.cover=false; proFadeTo(0,skipped?0.7:1.4,()=>proOverlay(false));
}
function proSkip(){ if(!PRO.on) return; SFX.play('ui'); proFinish(true); }
// the painting's layers are only needed while it is up: once the prologue is over they are let go (tens of MB)
function proFree(){
  for(const k in PRO.C){ const L=PRO.C[k], c=L&&(L.c||(L.getContext?L:null)); if(c&&c.width!=null){ try{ c.width=c.height=0; }catch(e){} } }
  PRO.C={}; PRO.ck=''; PRO.pat=null; PRO.patG=null; PRO.tipG=null;
}
// left for the title screen in the middle of it (pause, quit): nothing to clean up in the world (a new journey or a
// save builds it again), only the prologue's own things
function proAbort(){
  if(!PRO.on) return;
  PRO.on=false; PRO.phase='done'; PRO.after=null; PRO.fade=0; PRO.fadeTo=0;
  WAKE.on=false; WAKE.bed=null; if(PRO.bed){ delete PRO.bed.prompt; PRO.bed=null; }
  proSkipShow(false); proOverlay(false); proFree();
}
function proFadeTo(v,sec,then){ PRO.fadeTo=v; PRO.fadeK=1/Math.max(0.05,sec); PRO.after=then||null; if(!PRO.el||PRO.el.style.display==='none') proOverlay(true); }

// ---------- the walk home (scene play, the real village at night)
function proWhere(){ if(!AREA) return 'out'; if(AREA.id==='h_ash') return 'down'; if(AREA.id==='h_ash_up') return 'up'; return 'other'; }
function proTarget(){
  const w=proWhere();
  if(w==='out'){ const d=DOORS.find(q=>q.area==='h_ash'); return d?{x:d.x,y:d.y}:null; }
  if(w==='down'){ const s=AREA.objs.find(o=>o.k==='stairs'&&!o.back); return s?{x:s.x,y:s.y}:null; }
  if(w==='up'){ const b=AREA.objs.find(o=>o.k==='bed'&&o.home); return b?{x:b.x,y:b.y}:null; }
  return AREA&&AREA.exit?{x:AREA.exit.x,y:AREA.exit.y}:null;
}
function proTick(dt){
  if(!PRO.on||(PRO.phase!=='walk'&&PRO.phase!=='home')) return;
  PRO.walkT+=dt; G.wolfT=1e9; proSkipPlace(); if(PRO.skipDev!==curDevice()) proSkipLabel();
  const w=proWhere(); PRO.phase=w==='out'?'walk':'home';
  if(w==='up'){ const b=AREA.objs.find(o=>o.k==='bed'&&o.home); if(b&&!b.prompt){ b.prompt=()=>S('Get into bed','Go to bed'); PRO.bed=b; } }
  if(w==='out'){
    for(const L of LANTERNS){ if(!PRO.barks.lan&&dist(player.x,player.y,L.x,L.y)<95){ PRO.barks.lan=1; taunt('ash',S(`See you tomorrow, lanterns. Don't go out without me.`,`See you tomorrow, lanterns!`)); } }
    const V=POI.village;
    if(!PRO.barks.far&&dist(player.x,player.y,V.x,V.y)>V.r+120){ PRO.barks.far=1; taunt('maren',S(`Ash! Home is the other way!`,`Ash! Home is that way!`)); }
  }
}
// the tip at the bottom: what to do next, with the keys, in the story's words
const PRO_TIPS={
  walk:{kb:['Walk home',{k:'move'},'Walk',{k:'sprint'},'Run'],pad:['Walk home',()=>coachLeft()+' stick'],
    touch:[()=>settings.touch==='two'?`Walk home: drag on the ${lefty()?'right':'left'}`:'Walk home: drag low down']},
  door:{all:['Home. Walk into the door to go in']},
  down:{all:['Up the stairs to bed']},
  up:{kb:[{k:'use'},'Get into bed'],pad:[{k:'use'},'Get into bed'],touch:['Walk to the bed and tap it']}
};
function proTipId(){
  const w=proWhere();
  if(w==='out'){ const d=DOORS.find(q=>q.area==='h_ash'); if(d&&dist2(d.x,d.y,player.x,player.y)<170*170) return 'door'; return 'walk'; }
  return w==='down'||w==='up'?w:null;
}
function proDrawTip(){
  const id=proTipId(); if(!id||G.fade>0.5) return; const P=PRO_TIPS[id];
  const dev=curDevice(), r=usingTouch?0:9, narrow=W<600;
  let parts; try{ parts=coachParts(P,dev); }catch(e){ return; }
  const sc=PRO.tipG||(PRO.tipG=mkCanvas(8,8).getContext('2d')), TXT=`600 ${narrow?12:13}px ${UIF}`;
  ctx.font=TXT; let tw=0; const ws=parts.map((q,i)=>{ const w=q.k?drawBtnGlyph(sc,q.k,20,20,r,dev):ctx.measureText(q.t).width; const gap=i===0?0:(q.k&&!parts[i-1].k?16:q.k?6:parts[i-1].k?7:6); tw+=w+gap; return [w,gap]; });
  const bh=usingTouch?32:30, bw=tw+(usingTouch?40:36), a=clamp(PRO.walkT/0.6,0,1)*(0.85+0.15*Math.sin(G.time*3));
  let cy=H-SAFE.b-30-bh/2-(G.prompt&&!usingTouch?48:0), cx=W/2;
  if(usingTouch&&typeof touchBase==='function'){ let top=touchBase()-bh-24; if(G.prompt&&typeof PROMPT_R!=='undefined'&&PROMPT_R) top=Math.min(top,PROMPT_R.y-bh-10); cy=Math.max(SAFE.t+150,top+bh/2); }
  ctx.save(); ctx.globalAlpha=a; ctx.textBaseline='middle'; ctx.textAlign='left';
  if(LOOK.sb) sbPanel(cx-bw/2,cy-bh/2,bw,bh,bh/2); else { ctx.fillStyle='rgba(12,9,6,.82)'; rr(cx-bw/2,cy-bh/2,bw,bh,bh/2); ctx.fill(); ctx.strokeStyle='rgba(255,210,150,.3)'; ctx.lineWidth=1; ctx.stroke(); }
  let x=cx-bw/2+(usingTouch?20:18);
  parts.forEach((q,i)=>{ const [w,gap]=ws[i]; x+=gap; if(q.k) drawBtnGlyph(ctx,q.k,x+w/2,cy,r,dev); else { ctx.font=TXT; ctx.fillStyle=LOOK.sb?'#fff3d6':'#efdfc6'; ctx.fillText(q.t,x,cy+0.5); } x+=w; });
  ctx.restore();
}

// ---------- the Skip pill (DOM, always on top while the prologue runs)
function proSkipShow(on){
  let b=PRO.skipEl;
  if(!b&&on){
    b=document.createElement('button'); b.type='button'; b.id='proSkip'; b.tabIndex=-1;
    b.style.cssText=`position:fixed;z-index:8;top:max(12px,env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);display:none;align-items:center;gap:8px;padding:8px 16px 8px 18px;border-radius:999px;border:2px solid rgba(59,34,51,.9);background:rgba(255,243,214,.94);color:#3b2233;font:700 14px ${UIF};letter-spacing:.02em;cursor:pointer;box-shadow:0 3px 0 rgba(59,34,51,.85),0 8px 22px rgba(0,0,0,.35);-webkit-tap-highlight-color:transparent;touch-action:manipulation`;
    const stop=e=>{ e.stopPropagation(); };
    for(const t of ['pointerdown','mousedown','touchstart']) b.addEventListener(t,stop,{passive:true});
    b.addEventListener('click',e=>{ e.stopPropagation(); e.preventDefault(); proSkip(); });
    document.body.appendChild(b); PRO.skipEl=b;
  }
  if(!b) return;
  if(on){ proSkipLabel(); proSkipPlace(); b.style.display='flex'; } else b.style.display='none';
}
// on a narrow screen in play the HUD fills the top: the pill sits under it
function proSkipPlace(){
  const b=PRO.skipEl; if(!b) return;
  const low=PRO.on&&(PRO.phase==='walk'||PRO.phase==='home'||PRO.phase==='bed')&&innerWidth<600, k=low?'low':'top'; if(PRO.skipAt===k) return; PRO.skipAt=k;
  b.style.top=low?'calc(max(12px,env(safe-area-inset-top,0px)) + 150px)':'max(12px,env(safe-area-inset-top,0px))';
}
function proSkipLabel(){
  const b=PRO.skipEl; if(!b) return;
  const dev=curDevice(), k=dev==='pad'?'B':dev==='touch'?'':'Esc';
  const t=PRO.repeat?S('Skip to the morning','Skip'):S('Skip','Skip');
  b.innerHTML=`<span>${escapeHtml(simplify(t))}</span><span aria-hidden="true" style="font-size:12px;opacity:.75">&#9656;&#9656;</span>`+(k?`<span style="font:700 11px ${UIF};padding:2px 6px;border-radius:6px;background:rgba(59,34,51,.12);border:1px solid rgba(59,34,51,.35)">${k}</span>`:'');
  PRO.skipDev=dev;
}

// ---------- the overlay canvas the theatre is painted on (under the dialogue box, like the dreams)
function proOverlay(on){
  let el=PRO.el;
  if(!el&&on){
    el=document.createElement('div'); el.id='proStage'; el.setAttribute('aria-hidden','true');
    el.style.cssText='position:fixed;inset:0;z-index:3;display:none;background:transparent';   // (v12 STORY1) under #card (4), so the prologue's chapter card shows over the painting
    const cv=document.createElement('canvas'); cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block'; el.appendChild(cv);
    el.addEventListener('click',()=>{ if(PRO.on&&PRO.phase==='title') proShow(); });
    document.body.appendChild(el); PRO.el=el; PRO.cv=cv;
  }
  if(!el) return;
  if(on){ el.style.display='block'; if(!PRO.raf){ PRO.last=performance.now(); PRO.raf=requestAnimationFrame(proFrame); } }
  else { el.style.display='none'; if(!PRO.on&&PRO.cv){ PRO.cv.width=PRO.cv.height=1; } }
}
function proFrame(now){
  PRO.raf=0;
  const rt=clamp((now-(PRO.last||now))/1000,0,0.25), dt=Math.min(rt,0.05); PRO.last=now;
  try{ proStep(dt,rt); if(!PRO.el||PRO.el.style.display==='none') return; const t0=performance.now(); proDraw(); const ms=performance.now()-t0; PRO.ms=PRO.ms==null?ms:PRO.ms*0.9+ms*0.1; }catch(e){ console.error(e); }
  if(PRO.el&&PRO.el.style.display!=='none') PRO.raf=requestAnimationFrame(proFrame);
}
function proStep(dt,rt){
  PRO.t+=dt; PRO.bt+=rt;
  if(PRO.fade!==PRO.fadeTo){ const s=PRO.fadeK*rt; PRO.fade=PRO.fade<PRO.fadeTo?Math.min(PRO.fadeTo,PRO.fade+s):Math.max(PRO.fadeTo,PRO.fade-s);
    if(PRO.fade===PRO.fadeTo&&PRO.after){ const f=PRO.after; PRO.after=null; f(); } }
  else if(PRO.after){ const f=PRO.after; PRO.after=null; f(); }
  PRO.cx+=(PRO.cxT-PRO.cx)*Math.min(1,dt*1.6);
  if(PRO.shakeT>0) PRO.shakeT-=dt;
  PRO.turnK+=((PRO.beat==='turn'?1:0)-PRO.turnK)*Math.min(1,dt*3);
  PRO.squeeze=Math.max(0,PRO.squeeze-dt*0.55);
  if(PRO.on&&scene==='menu'){ proAbort(); return; }
  if(PRO.skipEl&&PRO.on&&PRO.skipDev!==curDevice()) proSkipLabel();
  if(PRO.skipEl&&PRO.on) proSkipPlace();
  if(((PRO.fc=(PRO.fc||0)+1)%5)===0){ let tg=0; try{ const dl=document.getElementById('dialogue'), bx=document.getElementById('dlgBox'); if(dl&&bx&&dl.classList.contains('on')&&PRO.oy){ const top=bx.getBoundingClientRect().top-52, ay=PRO.oy+(PRO_ASH.y+30)*PRO.sc; if(ay>top) tg=top-ay; } }catch(e){} PRO.oyT=tg; }
  PRO.oyS=(PRO.oyS||0)+((PRO.oyT||0)-(PRO.oyS||0))*Math.min(1,rt*5);
}
// a beat of the show: what the theatre and the camera do as a line comes up
const PRO_CAM={green:-60,fennick:60,seat:-200,point:-190,flick:-190,wave:-190,tune:90,open:0,dragon:0,mine:-40,roar:0,squeeze:-170,calm:-170,
  friends:0,tumble:0,girl:0,turn:-150,sing:0,sleep:0,rumble:220,bow:40,yara:280,moth:-160,home:-200};
function proBeat(b){
  PRO.beat=b; PRO.bt=0; if(PRO_CAM[b]!=null) PRO.cxT=PRO_CAM[b];
  if(b==='roar'||b==='squeeze'){ PRO.shakeT=0.45; try{ SFX.play('roar',0.35); }catch(e){} }
  if(b==='squeeze') PRO.squeeze=1;
  if(b==='rumble'){ PRO.shakeT=0.9; try{ SFX.play('boom',0.25); }catch(e){} }
  if(b==='moth'&&!PRO.moth) PRO.moth={t:0};
  if(b==='mine'||b==='bow'){ try{ SFX.play('ui',0.4); }catch(e){} }
}
// the theatre's state for a beat, eased in over its first moments
const PRO_ORDER=['green','fennick','seat','point','flick','wave','tune','open','dragon','mine','roar','squeeze','calm','friends','tumble','girl','turn','sing','sleep','rumble','bow','yara','moth','home'];
function proAt(b){ return PRO_ORDER.indexOf(PRO.beat)>=PRO_ORDER.indexOf(b); }
function proEase(k){ k=clamp(k,0,1); return k*k*(3-2*k); }

// ---------- painting helpers: wobbly ink, watercolour washes, paper
const PRO_INK='rgba(43,22,38,.86)';
function proRGB(h){ h=String(h).replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function proMix(a,b,k){ const A=proRGB(a), B=proRGB(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join(''); }
function proPath(g,P,closed){
  const n=P.length; if(n<2) return; g.beginPath();
  if(closed){ let ax=(P[n-1][0]+P[0][0])/2, ay=(P[n-1][1]+P[0][1])/2; g.moveTo(ax,ay);
    for(let i=0;i<n;i++){ const q=P[(i+1)%n]; g.quadraticCurveTo(P[i][0],P[i][1],(P[i][0]+q[0])/2,(P[i][1]+q[1])/2); } g.closePath(); }
  else { g.moveTo(P[0][0],P[0][1]); for(let i=1;i<n-1;i++) g.quadraticCurveTo(P[i][0],P[i][1],(P[i][0]+P[i+1][0])/2,(P[i][1]+P[i+1][1])/2); g.lineTo(P[n-1][0],P[n-1][1]); }
}
function proJit(P,R,a){ return P.map(p=>[p[0]+(R()-0.5)*a,p[1]+(R()-0.5)*a]); }
function proEll(cx,cy,rx,ry,n,rot){ n=n||18; const o=[], c=Math.cos(rot||0), s=Math.sin(rot||0); for(let i=0;i<n;i++){ const a=i/n*TAU, x=Math.cos(a)*rx, y=Math.sin(a)*ry; o.push([cx+x*c-y*s,cy+x*s+y*c]); } return o; }
// a polygon with its edges cut into short steps (so the wobble has somewhere to go)
function proPoly(V,step){ const o=[]; step=step||14; for(let i=0;i<V.length;i++){ const a=V[i], b=V[(i+1)%V.length], n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/step)); for(let k=0;k<n;k++) o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]); } return o; }
// a watercolour shape: two washes a little off each other, pigment pooled at the edge, an ink line over it
function proWash(g,P,col,seed,o){
  o=o||{}; const R=mulberry32(seed|0), c=proRGB(col), j=o.j==null?2.4:o.j, A=o.a==null?1:o.a;
  g.save();
  proPath(g,proJit(P,R,j),true); g.fillStyle=`rgba(${c},${0.72*A})`; g.fill();
  proPath(g,proJit(P,R,j*1.4),true); g.fillStyle=`rgba(${c},${0.42*A})`; g.fill();
  if(o.pool!==0){ proPath(g,proJit(P,R,1.2),true); g.strokeStyle=`rgba(${c.map(v=>Math.round(v*0.62))},${0.5*A})`; g.lineWidth=o.pool||2.2; g.stroke(); }
  if(o.bloom){ proPath(g,P,true); g.clip(); for(let i=0;i<o.bloom;i++){ const bx=o.bx0+R()*(o.bx1-o.bx0), by=o.by0+R()*(o.by1-o.by0), br=6+R()*o.br; const gr=g.createRadialGradient(bx,by,0,bx,by,br); gr.addColorStop(0,`rgba(255,248,230,${0.12+R()*0.1})`); gr.addColorStop(1,'rgba(255,248,230,0)'); g.fillStyle=gr; g.fillRect(bx-br,by-br,br*2,br*2); } }
  g.restore();
  if(o.ink!==false){ proPath(g,proJit(P,R,o.ij==null?1.3:o.ij),true); g.strokeStyle=o.inkCol||PRO_INK; g.lineWidth=o.lw||1.3; g.lineJoin='round'; g.stroke(); }
}
function proInk(g,P,lw,seed,col,closed){ const R=mulberry32(seed|0); proPath(g,proJit(P,R,1.1),!!closed); g.strokeStyle=col||PRO_INK; g.lineWidth=lw||1.3; g.lineCap='round'; g.lineJoin='round'; g.stroke(); }
function proGlow(g,x,y,r,rgb,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${rgb},${a})`); gr.addColorStop(1,`rgba(${rgb},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
// a cached layer in the theatre's own units: x0..x1, y0..y1 (scene units), painted at the current scale
function proLayer(x0,y0,x1,y1,paint){
  const s=PRO.sc*PRO.dpr, c=mkCanvas(Math.max(2,Math.ceil((x1-x0)*s)),Math.max(2,Math.ceil((y1-y0)*s))), g=c.getContext('2d');
  g.setTransform(s,0,0,s,-x0*s,-y0*s); g.lineCap='round'; g.lineJoin='round'; paint(g);
  proGrain(c);
  return {c,x0,y0,x1,y1};
}
// paper grain over a painted canvas, only where it is painted
function proGrain(c){
  try{ const t=mkCanvas(c.width,c.height), q=t.getContext('2d'); q.fillStyle=q.createPattern(proPaper(),'repeat'); q.fillRect(0,0,t.width,t.height);
    q.globalCompositeOperation='destination-in'; q.drawImage(c,0,0);
    const g=c.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.globalCompositeOperation='overlay'; g.globalAlpha=LOOK.sb?0.42:0.34; g.drawImage(t,0,0); g.globalAlpha=1; g.globalCompositeOperation='source-over'; }catch(e){}
}
function proPaper(){
  if(PRO.C.paper) return PRO.C.paper;
  const c=mkCanvas(256,256), g=c.getContext('2d'), R=mulberry32(77);
  g.fillStyle='rgb(128,128,128)'; g.fillRect(0,0,256,256);
  for(let i=0;i<5200;i++){ const v=Math.round(110+R()*40); g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(R()*256,R()*256,1+R()*1.4,1+R()*1.4); }
  g.globalAlpha=0.35; g.strokeStyle='rgb(150,150,150)'; g.lineWidth=0.6; for(let i=0;i<70;i++){ const x=R()*256, y=R()*256, a=R()*TAU, l=6+R()*18; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a+0.6)*l*0.5,y+Math.sin(a+0.6)*l*0.5,x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); }
  PRO.C.paper=c; return c;
}

// ---------- where things stand (scene units: x across, y down; 0,0 is the middle of the puppet stage's floor)
const PRO_HZ=-40;                                  // the far edge of the green
const PRO_FOCUS={x0:-290,x1:290,y0:-262,y1:206};   // what must be on screen
const PRO_SPAN=520;                                // how far the camera may look each way (the painting goes PRO.span)
const PRO_ASH={x:-212,y:166}, PRO_MOM={x:-246,y:110}, PRO_ROOK={x:-292,y:176}, PRO_LIT=[[-150,186,15],[-112,190,13.5]];
const PRO_YARA={x:396,y:150}, PRO_WEN={x:206,y:150};
function proLayout(){
  const w=innerWidth, h=innerHeight, dpr=Math.min(1.5,window.devicePixelRatio||1);
  const bottom=clamp(h*0.27,150,250), top=48, aw=w*0.98, ah=h-bottom-top;
  const fw=PRO_FOCUS.x1-PRO_FOCUS.x0, fh=PRO_FOCUS.y1-PRO_FOCUS.y0;
  let sc=Math.min(aw/fw,ah/fh); if(w<h) sc=Math.min(ah/fh,w/420);   // a phone held upright: the booth fills the width, the camera pans to the rest
  sc=clamp(sc,0.42,2.6);
  const oy=top+ah/2-((PRO_FOCUS.y0+PRO_FOCUS.y1)/2)*sc;
  const key=[w,h,dpr,sc.toFixed(3),LOOK.sb?1:0].join('|');
  if(key!==PRO.ck){ PRO.ck=key; PRO.C={paper:PRO.C.paper}; }
  PRO.sc=sc; PRO.dpr=dpr; PRO.oy=oy; PRO.w=w; PRO.h=h;
  const half=w/2/sc, lim=Math.max(0,PRO_SPAN-half); PRO.span=Math.max(PRO_SPAN+40,Math.ceil(half+lim+30));
  return {w,h,dpr,sc,oy,lim};
}
function proBuild(){
  const C=PRO.C;
  const sp=PRO.span;
  if(!C.scen) C.scen=proLayer(-sp,-310,sp,PRO_HZ+120,proPaintScenery);
  if(!C.booth) C.booth=proLayer(-170,-262,170,170,proPaintBooth);
  if(!C.crowd) C.crowd=proLayer(-sp,-60,sp,330,g=>proPaintCrowd(g,0));
  if(!C.crowdT) C.crowdT=proLayer(-sp,-60,sp,330,g=>proPaintCrowd(g,1));
  if(!C.yara) C.yara=proLayer(PRO_YARA.x-60,PRO_YARA.y-190,PRO_YARA.x+60,PRO_YARA.y+40,proPaintYara);
}
function proBlit(g,L,X,Y,a){ if(!L) return; if(a!=null) g.globalAlpha=a; g.drawImage(L.c,X(L.x0),Y(L.y0),(L.x1-L.x0)*PRO.sc,(L.y1-L.y0)*PRO.sc); if(a!=null) g.globalAlpha=1; }

// ---------- the scenery: sky things, the mountain, the far roofs, the oak, the lantern strings, the posts
function proPaintScenery(g){
  // the moon, round and bright tonight
  proGlow(g,-196,-268,120,'255,240,210',0.16);
  proWash(g,proEll(-196,-268,28,28,22),'#fbefd2',11,{pool:2,lw:1.1,j:1.4});
  g.fillStyle='rgba(200,180,170,.25)'; for(const [x,y,r] of [[-204,-274,6],[-188,-260,4.5],[-192,-280,3]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  // far hills, blue-grey
  const SP=PRO.span||PRO_SPAN; proWash(g,proPoly([[-SP-20,PRO_HZ+4],[-SP,-78],[-380,-96],[-200,-74],[60,-92],[260,-70],[420,-90],[SP,-80],[SP+20,-72],[SP+20,PRO_HZ+4]],22),'#3c3c66',21,{pool:2.6,lw:1,a:0.9});
  // Cinder Mountain, with a red throat at the top
  const M=proPoly([[-40,PRO_HZ],[60,-96],[150,-150],[214,-222],[236,-232],[252,-224],[270,-230],[292,-222],[350,-160],[470,-92],[580,PRO_HZ]],16);
  proWash(g,M,'#3a2638',31,{pool:3,lw:1.5,bloom:6,bx0:120,bx1:420,by0:-200,by1:-60,br:40});
  g.save(); proPath(g,M,true); g.clip();
  { const lg=g.createLinearGradient(40,0,300,0); lg.addColorStop(0,'rgba(150,120,170,.2)'); lg.addColorStop(1,'rgba(150,120,170,0)'); g.fillStyle=lg; g.fillRect(-40,-240,620,210); }
  proGlow(g,252,-226,46,'255,110,50',0.5);
  g.restore();
  // the far side of the green: rooftops and chimneys, a few windows still lit
  const R2=mulberry32(91);
  for(let x=-SP-10;x<SP+10;){
    const w=46+R2()*40, h=22+R2()*20, ry=PRO_HZ+2, rh=14+R2()*12, col=R2()<0.5?'#2d2a4a':'#33284a';
    if(x>-520&&x<-300&&R2()<0.5){ x+=w*0.7; continue; }
    proWash(g,proPoly([[x,ry],[x,ry-h],[x+w*0.5,ry-h-rh],[x+w,ry-h],[x+w,ry]],10),col,700+x|0,{pool:2,lw:1.1,j:1.6});
    if(R2()<0.6){ const cx=x+w*(0.2+R2()*0.5); proWash(g,proPoly([[cx,ry-h-rh*0.4],[cx,ry-h-rh-4],[cx+7,ry-h-rh-4],[cx+7,ry-h-rh*0.2]],6),col,900+x|0,{pool:1.4,lw:1,j:1}); }
    if(R2()<0.7){ const wx=x+w*(0.25+R2()*0.4), wy=ry-h*0.6; g.fillStyle='rgba(255,196,110,.9)'; g.fillRect(wx,wy,7,6); proGlow(g,wx+3.5,wy+3,14,'255,180,90',0.35); proInk(g,proPoly([[wx,wy],[wx+7,wy],[wx+7,wy+6],[wx,wy+6]],4),0.9,x|0,null,true); }
    x+=w+4+R2()*10;
  }
  // the old oak at the left, a big dark crown lit from the stage on its right
  proWash(g,proPoly([[-502,PRO_HZ+110],[-490,-30],[-480,-90],[-454,-96],[-446,-30],[-432,PRO_HZ+110]],12),'#3b2a26',41,{pool:2.4,lw:1.4});
  const crown=[]; { const R3=mulberry32(43); for(let i=0;i<26;i++){ const a=i/26*TAU, rr=128+R3()*28; crown.push([-470+Math.cos(a)*rr*1.15,-178+Math.sin(a)*rr*0.78]); } }
  proWash(g,crown,'#22382e',47,{pool:3,lw:1.5,j:6,bloom:10,bx0:-430,bx1:-330,by0:-250,by1:-120,br:34});
  { const R4=mulberry32(49); for(let i=0;i<46;i++){ const x=-520+R4()*190, y=-260+R4()*170, d=Math.hypot((x+470)/150,(y+178)/105); if(d>0.98) continue; g.fillStyle=`rgba(${x>-430?'120,150,96':'60,92,70'},${0.35+R4()*0.3})`; g.beginPath(); g.ellipse(x,y,7+R4()*6,4+R4()*3,R4()*3,0,TAU); g.fill(); } }
  // the tall pole on the right, where the strings tie off
  proWash(g,proPoly([[452,PRO_HZ+110],[456,-196],[466,-196],[468,PRO_HZ+110]],14),'#4a3428',51,{pool:1.6,lw:1.2,j:1});
  // the strings of paper lanterns, hung tonight and still dark
  const strings=[[[-330,-150],[-148,-208],38],[[150,-208],[460,-186],36],[[-SP-10,-284],[SP+10,-272],34]];
  const cols=['#c9583e','#e0a046','#5a9a8c','#c47aa6','#e8c66a'];
  strings.forEach(([a,b,sag],si)=>{
    const P=[]; for(let i=0;i<=24;i++){ const k=i/24; P.push([a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k+Math.sin(k*Math.PI)*sag]); }
    proInk(g,P,1.1,60+si,'rgba(30,18,28,.75)');
    const n=si===2?18:8;
    for(let i=1;i<n;i++){ const k=i/n, x=a[0]+(b[0]-a[0])*k, y=a[1]+(b[1]-a[1])*k+Math.sin(k*Math.PI)*sag;
      if(si===0&&i===3) continue;   // this one is the moth's lantern (painted live, so it can be lit by the moth)
      proLantern(g,x,y,cols[(i+si*2)%cols.length],0,600+si*40+i,si===2?0.8:1); }
  });
  PRO.mothLan={x:-330+(-148+330)*3/8,y:-150+(-208+150)*3/8+Math.sin(3/8*Math.PI)*38};
}
// one paper lantern hanging at x,y (its top), lit (0..1) or dark
function proLantern(g,x,y,col,lit,seed,s){
  s=s||1; const w=9*s, h=12*s, cy=y+3*s+h;
  g.strokeStyle='rgba(30,18,28,.7)'; g.lineWidth=0.9; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+3*s); g.stroke();
  const c=lit?proMix(col,'#fff2c8',0.35+0.25*lit):proMix(col,'#2a2440',0.45);
  if(lit) proGlow(g,x,cy,40*s,'255,190,100',0.45*lit);
  proWash(g,proEll(x,cy,w,h,14),c,seed,{pool:1.4,lw:1,j:1.1});
  g.strokeStyle=lit?'rgba(140,70,30,.5)':'rgba(20,12,24,.4)'; g.lineWidth=0.8;
  for(const f of [-0.5,0,0.5]){ g.beginPath(); g.ellipse(x,cy,w*Math.abs(f)*1.6+0.4,h*0.96,0,-Math.PI/2,Math.PI/2,f<0); g.stroke(); }
  g.fillStyle=lit?'#6a3a22':'#241a2a'; g.fillRect(x-w*0.55,cy-h-1.5*s,w*1.1,2.6*s); g.fillRect(x-w*0.5,cy+h-1.2*s,w,2.4*s);
  g.strokeStyle=lit?'rgba(220,120,60,.8)':'rgba(120,60,60,.6)'; g.beginPath(); g.moveTo(x,cy+h+1); g.lineTo(x,cy+h+6*s); g.stroke();
}

// ---------- the puppet booth: posts, the painted board on top, the playboard and the striped skirt
const PRO_OPEN={x0:-112,x1:112,y0:-150,y1:10};
function proPaintBooth(g){
  // side posts
  for(const sx of [-1,1]) proWash(g,proPoly([[sx*150,160],[sx*150,-196],[sx*126,-196],[sx*126,160]].map(p=>[p[0],p[1]]),12),'#6a3a2a',101+sx,{pool:2,lw:1.3,j:1.2});
  // the painted board on top: cream with a red scalloped edge, a sun-lantern in the middle and stars
  const top=proPoly([[-156,-200],[-150,-226],[-60,-238],[0,-252],[60,-238],[150,-226],[156,-200],[150,-160],[-150,-160]],10);
  proWash(g,top,'#f1dcb0',111,{pool:2.4,lw:1.5,bloom:5,bx0:-140,bx1:140,by0:-240,by1:-165,br:30});
  const sc=[]; for(let i=0;i<12;i++){ const x=-150+i*25; sc.push([x,-168]); sc.push([x+12.5,-158]); } sc.push([150,-168]);
  proWash(g,proPoly([[-150,-176],[150,-176]].concat(sc.slice().reverse().map(p=>[p[0],p[1]])),8),'#b8412e',113,{pool:1.6,lw:1.1,j:0.8});
  proWash(g,proEll(0,-208,17,17,16),'#e8a94a',115,{pool:1.6,lw:1.2,j:1});
  for(let i=0;i<12;i++){ const a=i/12*TAU; proInk(g,[[Math.cos(a)*21,-208+Math.sin(a)*21],[Math.cos(a)*28,-208+Math.sin(a)*28]],1.2,120+i,'rgba(160,80,40,.85)'); }
  proInk(g,proPoly([[-6,-216],[6,-216],[7,-200],[-7,-200]],4),1,125,'rgba(110,50,30,.8)',true);
  for(const [x,y] of [[-100,-208],[-70,-222],[80,-220],[108,-206],[-118,-188],[124,-190]]){ g.fillStyle='rgba(70,60,120,.8)'; sbStar(g,5,2,5,0.2,x,y,1); g.fill(); }
  // the frame round the stage opening
  const fr=proPoly([[-124,-160],[124,-160],[124,22],[-124,22]],12), hole=PRO_OPEN;
  g.save(); proPath(g,fr,true); g.rect(hole.x1,hole.y0,hole.x0-hole.x1,hole.y1-hole.y0); g.fillStyle='#7a3424'; g.fill('evenodd'); g.restore();
  proInk(g,proPoly([[hole.x0-2,hole.y0-2],[hole.x1+2,hole.y0-2],[hole.x1+2,hole.y1+2],[hole.x0-2,hole.y1+2]],12),1.4,131,null,true);
  proInk(g,fr,1.4,133,null,true);
  // the playboard (the shelf the puppets stand behind)
  proWash(g,proPoly([[-132,10],[132,10],[136,30],[-136,30]],12),'#8a5432',141,{pool:2,lw:1.3,j:1});
  // the striped skirt down to the grass, with a sagging hem
  const sk=[[-136,30],[136,30]]; for(let i=12;i>=0;i--){ const x=-146+i*292/12; sk.push([x,152+Math.sin(i*1.7)*3+(i%2?4:0)]); }
  g.save(); proPath(g,proPoly(sk,10),true); g.clip();
  g.fillStyle='#e9d6b0'; g.fillRect(-160,26,320,140);
  for(let i=0;i<9;i++){ const x=-146+i*34; g.fillStyle='rgba(176,60,44,.85)'; g.beginPath(); g.moveTo(x,28); g.lineTo(x+16,28); g.lineTo(x+18+i*0.3,160); g.lineTo(x+1,160); g.closePath(); g.fill(); }
  const sh=g.createLinearGradient(0,30,0,160); sh.addColorStop(0,'rgba(40,20,40,.35)'); sh.addColorStop(1,'rgba(40,20,40,.05)'); g.fillStyle=sh; g.fillRect(-160,26,320,140);
  g.restore();
  proInk(g,proPoly(sk,10),1.4,151,null,true);
}
// the inside of the stage: painted night, the cardboard mountain, the puppets, the curtains, the little footlights
function proPaintStage(g,t){
  const O=PRO_OPEN, k=PRO.bt, B=PRO.beat;
  g.save(); g.beginPath(); g.rect(O.x0,O.y0,O.x1-O.x0,O.y1-O.y0); g.clip();
  // painted backcloth
  const bg=g.createLinearGradient(0,O.y0,0,O.y1); bg.addColorStop(0,'#26305c'); bg.addColorStop(1,'#4b3c6a'); g.fillStyle=bg; g.fillRect(O.x0,O.y0,O.x1-O.x0,O.y1-O.y0);
  if(!PRO.C.cloth){ const R=mulberry32(301); PRO.C.cloth=[]; for(let i=0;i<22;i++) PRO.C.cloth.push([O.x0+R()*(O.x1-O.x0),O.y0+4+R()*70,1+R()*1.6]); }
  g.fillStyle='rgba(255,236,170,.85)'; for(const [x,y,r] of PRO.C.cloth){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  const sleepK=proAt('sleep')?proEase(PRO.beat==='sleep'?k/2.5:1):0;
  // the stage lights (warmer once the dragon is asleep)
  proGlow(g,0,O.y1,150,'255,180,90',0.28+0.2*sleepK);
  // the cardboard mountain with its cotton smoke
  const mx=-22;
  proWash(g,proPoly([[mx-78,O.y1+2],[mx-30,-96],[mx-8,-112],[mx+12,-104],[mx+96,O.y1+2]],10),'#5a3a30',311,{pool:2,lw:1.4,j:1.4});
  proWash(g,proPoly([[mx-30,-96],[mx-8,-112],[mx+12,-104],[mx+4,-92],[mx-10,-100],[mx-20,-90]],5),'#d9773a',313,{pool:1.2,lw:1,j:0.8});
  g.strokeStyle='rgba(30,20,30,.6)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(mx-6,-112); g.lineTo(mx-6,O.y0); g.stroke();
  for(let i=0;i<3;i++){ const yy=-126-i*12+Math.sin(t*1.5+i)*2, xx=mx-6+Math.sin(t+i*2)*3; proWash(g,proEll(xx,yy,9-i,6-i*0.6,10),'#e8e0e4',320+i,{pool:1,lw:0.9,j:1.2}); }
  // the dragon
  proDragon(g,t,mx);
  // the five friends and the girl
  proFriends(g,t);
  proEmber(g,t);
  // little lanterns along the top of the opening: lit one by one when he falls asleep
  for(let i=0;i<7;i++){ const x=O.x0+20+i*(O.x1-O.x0-40)/6, y=O.y0+13+Math.sin(i/6*Math.PI)*8, lit=clamp(sleepK*7-i,0,1);
    proLantern(g,x,y,['#c9583e','#e0a046','#e8c66a','#c47aa6'][i%4],lit*(0.85+0.15*Math.sin(t*4+i)),340+i,0.62); }
  // Z's
  if(proAt('sleep')&&!proAt('bow')){ g.font=`700 14px ${TF}`; g.textAlign='center'; for(let i=0;i<3;i++){ const ph=(t*0.5+i/3)%1; g.fillStyle=`rgba(255,240,210,${0.9*Math.sin(ph*Math.PI)})`; g.fillText('z',30+ph*30+i*4,-60-ph*50); } }
  // music notes while she sings
  if(B==='sing'||B==='sleep'&&k<3){ g.font=`700 13px ${UIF}`; g.textAlign='center'; for(let i=0;i<4;i++){ const ph=(t*0.4+i/4)%1; g.fillStyle=`rgba(255,226,170,${0.9*Math.sin(ph*Math.PI)})`; g.fillText(i%2?'♪':'♫',64+Math.sin(ph*6+i)*10+ph*20,-50-ph*60); } }
  // the curtains
  const open=proAt('open')?proEase(PRO.beat==='open'?k/1.3:1):0;
  proCurtains(g,open,t);
  g.restore();
  // footlights: candles in tins along the playboard
  for(let i=0;i<6;i++){ const x=O.x0+16+i*(O.x1-O.x0-32)/5, y=O.y1+4, f=0.8+0.2*Math.sin(t*9+i*1.7)+0.1*Math.sin(t*23+i);
    proGlow(g,x,y-6,26,'255,190,100',0.4*f); g.fillStyle='#5a4a40'; g.fillRect(x-5,y-2,10,5); g.fillStyle='#f2e6cc'; g.fillRect(x-1.6,y-7,3.2,5);
    g.fillStyle=`rgba(255,${190+40*f|0},90,.95)`; g.beginPath(); g.ellipse(x,y-10,2*f,4*f,0,0,TAU); g.fill(); }
}
function proCurtains(g,open,t){
  const O=PRO_OPEN, half=(O.x1-O.x0)/2, w=half*(1-open*0.78)+6;
  for(const s of [-1,1]){
    const edge=s<0?O.x0+w:O.x1-w, base=s<0?O.x0-4:O.x1+4, sway=Math.sin(t*1.3+s)*1.5*(1-open*0.6);
    const P=[[base,O.y0-4],[edge+sway,O.y0-4]]; for(let i=0;i<=8;i++){ const y=O.y0+(O.y1-O.y0+8)*i/8, tie=open>0.2?Math.sin(i/8*Math.PI)*s*open*14:0; P.push([edge+sway+tie+Math.sin(i*1.9)*1.2,y]); } P.push([base,O.y1+4]);
    proWash(g,P,'#a0262a',400+s,{pool:2.4,lw:1.3,j:0.6});
    g.strokeStyle='rgba(60,8,16,.45)'; g.lineWidth=1.4;
    for(let f=1;f<4;f++){ const x=base+(edge-base)*f/4; g.beginPath(); g.moveTo(x,O.y0); g.quadraticCurveTo(x+Math.sin(t+f)*2,(O.y0+O.y1)/2,x+(open>0.2?-s*open*8:0),O.y1+4); g.stroke(); }
  }
  // the pelmet across the top
  proWash(g,proPoly([[O.x0-6,O.y0-6],[O.x1+6,O.y0-6],[O.x1+6,O.y0+10],[O.x0-6,O.y0+10]],10),'#7a1c22',410,{pool:1.6,lw:1.2,j:0.6});
  g.fillStyle='#e8b450'; for(let i=0;i<16;i++){ const x=O.x0+i*(O.x1-O.x0)/15; g.beginPath(); g.arc(x,O.y0+12,2.2,0,TAU); g.fill(); }
}
// Nana's sock dragon: red wool, felt wings, one button eye (the other is a cross of black thread)
function proDragon(g,t,mx){
  const B=PRO.beat, k=PRO.bt;
  if(!proAt('dragon')) return;
  let up=B==='dragon'?proEase(k/1.4):1, lean=0, mouth=0.15, bob=Math.sin(t*2.2)*3, sway=Math.sin(t*1.1)*0.08, sc=1, eye=1, sleepy=0;
  if(B==='mine') { bob=Math.sin(t*9)*4; mouth=0.3+0.2*Math.sin(t*9); }
  if(B==='roar'||B==='squeeze'){ const q=B==='roar'?clamp(k/0.35,0,1):1; lean=q*(B==='squeeze'?Math.max(0,1-k/1.4):1); mouth=0.25+0.75*lean; sc=1+0.22*lean; }
  if(B==='tumble'){ sway=Math.sin(clamp(k/0.7,0,1)*Math.PI)*0.5; }
  if(proAt('sing')){ eye=0.55; sway*=0.5; }
  if(proAt('sleep')&&!proAt('bow')){ sleepy=B==='sleep'?proEase(k/2):1; eye=1-sleepy; mouth=0.08; sway*=0.3; }
  if(proAt('bow')){ sleepy=0; eye=1; const q=B==='bow'?Math.sin(clamp(k/1.6,0,1)*Math.PI):0; lean=q*0.4; mouth=0.15; }
  const x=mx+6+lean*30, y=-62+(1-up)*110+bob*(1-sleepy*0.8)+sleepy*30, rot=sway+sleepy*0.42-lean*0.15;
  g.save(); g.translate(x,y); g.rotate(rot); g.scale(sc,sc);
  // the rod he is worked on
  g.strokeStyle='rgba(40,24,20,.8)'; g.lineWidth=2; g.beginPath(); g.moveTo(-6,30); g.lineTo(-8,140); g.stroke();
  // wings (felt), behind
  for(const s of [-1,1]){ const flap=Math.sin(t*3+s)*0.12; proWash(g,proPoly([[s*8,-6],[s*44,-38+flap*30],[s*40,-18],[s*52,-12+flap*20],[s*30,6],[s*12,10]],6),'#7a2e5a',500+s,{pool:1.6,lw:1.2,j:1}); }
  // the sock body and neck, with knitting lines
  const body=proPoly([[-26,40],[-24,6],[-16,-22],[-4,-36],[14,-44],[34,-48],[48,-42],[50,-30],[38,-24],[22,-18],[18,4],[24,40]],6);
  proWash(g,body,'#c23a2a',510,{pool:2.2,lw:1.5,j:0.9});
  g.save(); proPath(g,body,true); g.clip(); g.strokeStyle='rgba(120,20,20,.35)'; g.lineWidth=1; for(let i=-30;i<50;i+=5){ g.beginPath(); for(let j=-50;j<=45;j+=4){ const yy=j, xx=i+Math.sin(j*0.6)*1.4; if(j===-50) g.moveTo(xx,yy); else g.lineTo(xx,yy); } g.stroke(); } g.restore();
  // spines (felt triangles) down the back
  for(let i=0;i<5;i++){ const bx=-18+i*7, by=-8-i*8; proWash(g,proPoly([[bx-4,by+4],[bx-8,by-8],[bx+3,by]],3),'#e8a33a',520+i,{pool:1,lw:0.9,j:0.6}); }
  // the jaw: opens to roar, with a felt flame
  const jx=40, jy=-34, ja=mouth*0.9;
  g.save(); g.translate(jx-14,jy+6); g.rotate(ja); proWash(g,proPoly([[0,0],[30,-2],[34,6],[4,10]],5),'#a8301f',530,{pool:1.4,lw:1.2,j:0.6}); g.restore();
  if(mouth>0.6){ const f=(mouth-0.6)/0.4; g.save(); g.translate(jx+12,jy+4); g.rotate(ja*0.5); for(let i=0;i<3;i++){ const L=(20+i*10)*f*(0.85+0.15*Math.sin(t*20+i)); proWash(g,proPoly([[0,-4+i*3],[L,-10+i*7],[L*0.7,i*5],[L+4,4+i*4],[0,6]],4),['#ff9a2a','#ffd04a','#ff6a2a'][i],540+i,{pool:1,lw:0.9,j:1.4,a:0.95}); } g.restore(); }
  // nostrils, eye and the missing eye
  g.fillStyle='rgba(60,10,10,.8)'; g.beginPath(); g.arc(46,-40,1.6,0,TAU); g.fill();
  const ex=26, ey=-36;
  if(eye>0.15){ g.fillStyle='#f8f0dc'; g.beginPath(); g.ellipse(ex,ey,5.4,5.4*eye,0,0,TAU); g.fill(); g.fillStyle='#1a1414'; g.beginPath(); g.arc(ex+1,ey,3.2*Math.min(1,eye+0.2),0,TAU); g.fill(); g.strokeStyle='rgba(30,20,20,.8)'; g.lineWidth=0.7; g.beginPath(); g.moveTo(ex-1,ey-1); g.lineTo(ex+3,ey+1); g.moveTo(ex+3,ey-1); g.lineTo(ex-1,ey+1); g.stroke(); }
  else { g.strokeStyle=PRO_INK; g.lineWidth=1.3; g.beginPath(); g.arc(ex,ey-1,4.5,0.15*Math.PI,0.85*Math.PI); g.stroke(); }
  g.strokeStyle='rgba(20,10,10,.95)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(12,-40); g.lineTo(18,-34); g.moveTo(18,-40); g.lineTo(12,-34); g.stroke();
  // little horns (felt)
  for(const [hx,hy] of [[14,-48],[24,-50]]) proWash(g,proPoly([[hx,hy+4],[hx+2,hy-9],[hx+6,hy+3]],3),'#f0d8a8',560+hx,{pool:0.8,lw:0.9,j:0.4});
  g.restore();
}
// the five friends: rod puppets, paper cut out, each with the thing the old stories give them
function proFriends(g,t){
  const B=PRO.beat, k=PRO.bt; if(!proAt('friends')) return;
  const inK=B==='friends'?proEase(k/2.6):1, fall=proAt('bow')?0:B==='tumble'?proEase((k-0.25)/0.7):proAt('tumble')?1:0;
  const bowK=B==='bow'?Math.sin(clamp(k/1.6,0,1)*Math.PI):0;
  const F=[['#e0a046','lantern'],['#8a6a4a','hammer'],['#6a9a5a','drake'],['#5a8aaa','reed'],['#b06a8a','spear']];
  F.forEach(([col,thing],i)=>{
    const tx=-100+i*20, x=-160+(tx+160)*inK, step=Math.abs(Math.sin(t*6+i))*4*(B==='friends'&&k<2.6?1:0.2);
    const ff=fall*(i%2?1:-1), y=-4-step+fall*14-bowK*4, rot=ff*1.25+bowK*0.4;
    g.save(); g.translate(x,y-6); g.rotate(rot); g.scale(1.35,1.35);
    g.strokeStyle='rgba(40,24,20,.8)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(0,8); g.lineTo(0,60); g.stroke();
    proWash(g,proPoly([[-7,10],[0,-10],[7,10]],4),col,600+i,{pool:1,lw:1,j:0.5});
    proWash(g,proEll(0,-15,5.6,5.6,10),'#f0c8a0',610+i,{pool:0.8,lw:0.9,j:0.4});
    g.fillStyle='#2a1a14'; g.fillRect(-2.4,-16,1.4,1.4); g.fillRect(1,-16,1.4,1.4);
    if(thing==='lantern'){ g.strokeStyle=PRO_INK; g.lineWidth=0.9; g.beginPath(); g.moveTo(6,-2); g.lineTo(11,-10); g.stroke(); proGlow(g,12,-6,10,'255,200,110',0.6); g.fillStyle='#ffd27a'; g.fillRect(9.5,-9,5,6); }
    else if(thing==='hammer'){ g.strokeStyle='#4a3020'; g.lineWidth=1.6; g.beginPath(); g.moveTo(6,4); g.lineTo(12,-12); g.stroke(); g.fillStyle='#7a7a86'; g.fillRect(8,-16,9,5); }
    else if(thing==='drake'){ proWash(g,proPoly([[5,-20],[12,-26],[16,-22],[10,-18]],3),'#5a8a3a',620,{pool:0.6,lw:0.8,j:0.3}); }
    else if(thing==='reed'){ g.strokeStyle='#c8b070'; g.lineWidth=1.4; g.beginPath(); g.moveTo(2,-12); g.lineTo(14,-4); g.stroke(); }
    else { g.strokeStyle='#5a4030'; g.lineWidth=1.2; g.beginPath(); g.moveTo(7,10); g.lineTo(9,-26); g.stroke(); g.fillStyle='#c8ccd8'; g.beginPath(); g.moveTo(9,-31); g.lineTo(11,-25); g.lineTo(7,-25); g.closePath(); g.fill(); }
    g.restore();
  });
}
// the girl with horns: yarn hair, a yellow dress, felt horns (the left one sewn on crooked)
function proEmber(g,t){
  const B=PRO.beat, k=PRO.bt; if(!proAt('girl')) return;
  const climb=B==='girl'?proEase(k/2.6):1, sit=proAt('sing')?1:0, bowK=B==='bow'?Math.sin(clamp(k/1.6,0,1)*Math.PI):0;
  const x=100-climb*44, y=6-climb*44+Math.sin(t*(sit?1.4:5))*(sit?1.2:2.5)*(1-climb*0.5)-bowK*4, rot=sit?Math.sin(t*1.4)*0.08:Math.sin(t*5)*0.06;
  g.save(); g.translate(x,y); g.rotate(rot+bowK*0.35);
  g.strokeStyle='rgba(40,24,20,.8)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(0,10); g.lineTo(2,90); g.stroke();
  proWash(g,proPoly([[-9,12],[-4,-8],[4,-8],[9,12]],4),'#e8c048',700,{pool:1.2,lw:1,j:0.6});
  g.strokeStyle='#c8401e'; g.lineWidth=1.2; for(let i=0;i<7;i++){ const a=-0.3+i*0.6; g.beginPath(); g.moveTo(Math.cos(a)*4,-16); g.quadraticCurveTo(Math.cos(a)*9,-14+Math.sin(t*2+i),Math.cos(a)*8,-6+i%3); g.stroke(); }
  proWash(g,proEll(0,-15,6,6,12),'#e8a888',705,{pool:0.8,lw:1,j:0.4});
  g.fillStyle='#2a1a14'; g.fillRect(-2.6,-16,1.4,1.6); g.fillRect(1.2,-16,1.4,1.6);
  if(B==='sing'){ g.fillStyle='#7a2a2a'; g.beginPath(); g.ellipse(0,-12,1.6,1.2+0.6*Math.sin(t*6),0,0,TAU); g.fill(); }
  proWash(g,proPoly([[-5,-20],[-11,-31],[-2,-22]],3),'#f0d8a8',710,{pool:0.6,lw:0.9,j:0.3});
  proWash(g,proPoly([[3,-21],[7,-33],[6,-20]],3),'#f0d8a8',711,{pool:0.6,lw:0.9,j:0.3});
  g.strokeStyle='rgba(60,30,30,.7)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(3,-21); g.lineTo(6,-21); g.stroke();
  g.restore();
}

// ---------- the crowd (from behind, the stage light on their heads). turn: they look round at Ash
function proHead(g,x,y,r,hair,seed,turn,o){
  o=o||{};
  proWash(g,proPoly([[x-r*1.5,y+r*2.6],[x-r*1.35,y+r*0.9],[x-r*0.6,y+r*0.55],[x+r*0.6,y+r*0.55],[x+r*1.35,y+r*0.9],[x+r*1.5,y+r*2.6]],6),o.shirt||'#4a3a5a',seed+1,{pool:1.8,lw:1.2,j:1.2});
  turn=turn||0;
  if(turn){ proWash(g,proEll(x+turn*r*0.28,y+r*0.05,r*0.86,r*0.92,14),o.skin||'#d8a080',seed+3,{pool:1,lw:1,j:0.8}); g.fillStyle='rgba(40,20,20,.85)'; g.beginPath(); g.arc(x+turn*r*0.72,y-r*0.05,r*0.08+0.5,0,TAU); g.fill(); }
  proWash(g,proEll(x-turn*r*0.12,y-r*0.1,r*0.98,r,16),hair,seed+2,{pool:1.6,lw:1.2,j:1});
  g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle='rgba(255,180,110,.32)'; g.lineWidth=2.4; g.beginPath(); g.arc(x-turn*r*0.12,y-r*0.1,r*0.86,-2.6,-0.6); g.stroke(); g.restore();
  if(o.hat==='chef'){ proWash(g,proPoly([[x-r*0.8,y-r*0.6],[x-r*1.1,y-r*1.7],[x-r*0.3,y-r*2.3],[x+r*0.5,y-r*2.2],[x+r*1.1,y-r*1.6],[x+r*0.8,y-r*0.6]],6),'#f4eee0',seed+5,{pool:1.2,lw:1.1,j:0.8}); }
  if(o.hat==='cap'){ proWash(g,proPoly([[x-r*1.02,y-r*0.3],[x-r*0.8,y-r*1.0],[x+r*0.8,y-r*1.0],[x+r*1.02,y-r*0.3]],6),'#5a4a2a',seed+5,{pool:1.2,lw:1.1,j:0.8}); }
  if(o.bun){ proWash(g,proEll(x,y-r*1.05,r*0.5,r*0.4,10),hair,seed+6,{pool:1,lw:1,j:0.5}); }
}
function proPaintCrowd(g,turnMode){
  const tw=x=>turnMode?(x<PRO_ASH.x?1:-1):0;
  // the warm old stone under the oak, where Ash and Rook sit
  proGlow(g,-232,206,90,'255,150,80',0.16);
  proWash(g,proPoly([[-318,226],[-306,200],[-250,190],[-176,196],[-150,214],[-160,236],[-300,240]],12),'#6a6270',801,{pool:2.2,lw:1.4,j:1.6});
  g.strokeStyle='rgba(255,170,100,.45)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-300,201); g.quadraticCurveTo(-240,186,-172,198); g.stroke();
  // Wendel, by the booth, his fiddle under his chin (his bow arm moves: painted live)
  proPerson(g,PRO_WEN.x,PRO_WEN.y,1.02,{shirt:'#6a3a7a',low:'#3e2a46',skin:'#e0ae88',hair:'#b8a070',curly:true,beard:true,front:true},831);
  // Bertram and Hal at the right, by the bun table
  proWash(g,proPoly([[248,118],[332,118],[332,126],[248,126]],10),'#7a5236',841,{pool:1.4,lw:1.1,j:0.6});
  for(const [x,y] of [[262,112],[278,110],[294,112],[312,111]]){ proWash(g,proEll(x,y,8,5,10),'#d99a4a',842+x,{pool:1,lw:0.9,j:0.5}); }
  g.fillStyle='#ece4d4'; g.fillRect(318,104,7,9); proInk(g,proPoly([[318,104],[325,104],[325,113],[318,113]],3),0.8,849,null,true);
  proHead(g,300,70,15,'#6a4a2a',851,tw(300),{hat:'chef',shirt:'#efe6d6'});
  proHead(g,258,88,15,'#4a3a20',861,tw(258),{hat:'cap',shirt:'#7a6a3a'});
  // the seated rows (the back of every head), the little ones nearest Ash
  const R=mulberry32(870), hairs=['#2a1a10','#6a3a1a','#b8802a','#3a2a20','#8a3a1a','#d8b060','#1a1418'], shirts=['#3a5a7a','#7a3a3a','#4a6a3a','#6a4a6a','#8a6a3a','#3a4a6a'];
  for(const [y0,r0,x0,x1,dx] of [[150,15,-120,190,40],[188,17,-60,230,44]]){
    for(let x=x0;x<x1;x+=dx+R()*8){ if(Math.abs(x-PRO_WEN.x)<26&&y0<160) continue; proHead(g,x,y0+R()*6,r0+R()*3,hairs[(R()*hairs.length)|0],880+x|0,tw(x),{shirt:shirts[(R()*shirts.length)|0],skin:R()<0.4?'#9a6444':'#e0ae88'}); }
  }
  // grown-ups standing at the far right and far left, darker
  for(const [x,y,r] of [[-470,40,18],[-380,70,17],[470,58,18],[-560,90,17],[560,84,18],[640,60,17],[-650,64,18]]) proHead(g,x,y,r,'#2a2034',900+x,0,{shirt:'#2e2640'});
  // Rook, next to Ash on the stone
  proHead(g,PRO_ROOK.x,PRO_ROOK.y,15,'#2a1a10',951,tw(PRO_ROOK.x),{shirt:'#3a6a9a',skin:'#7c4c30'});
  g.strokeStyle='rgba(42,26,16,.9)'; g.lineWidth=1.6; for(let i=0;i<5;i++){ const a=-2.6+i*0.4; g.beginPath(); g.moveTo(PRO_ROOK.x+Math.cos(a)*12,PRO_ROOK.y-1+Math.sin(a)*12); g.lineTo(PRO_ROOK.x+Math.cos(a)*19,PRO_ROOK.y-1+Math.sin(a)*19); g.stroke(); }
  // the little ones (one of them points: her arm is painted live)
  proHead(g,PRO_LIT[0][0],PRO_LIT[0][1],PRO_LIT[0][2],'#d8b060',961,-1,{shirt:'#c86a4a',skin:'#f0c8a0',bun:true});
  proHead(g,PRO_LIT[1][0],PRO_LIT[1][1],PRO_LIT[1][2],'#6a3a1a',971,-1,{shirt:'#5a8a5a',skin:'#c8946c'});
  // Mom, standing behind Ash (her hand on his shoulder is painted live)
  proMom(g);
}
// Mom kneeling behind Ash on the stone, seen from behind: her shirt, the apron's straps and bow, her red hair in a bun
function proMom(g){
  const x=PRO_MOM.x, y=PRO_MOM.y;
  proWash(g,proPoly([[x-25,y+118],[x-27,y+44],[x-22,y+24],[x-10,y+16],[x+10,y+16],[x+22,y+24],[x+27,y+44],[x+25,y+118]],8),'#8a4a2a',981,{pool:2,lw:1.3,j:1});
  g.strokeStyle='rgba(60,32,20,.9)'; g.lineWidth=3; g.beginPath(); g.moveTo(x-12,y+20); g.lineTo(x+8,y+70); g.moveTo(x+12,y+20); g.lineTo(x-8,y+70); g.stroke();
  g.lineWidth=2.6; g.beginPath(); g.moveTo(x-24,y+70); g.lineTo(x+24,y+70); g.stroke();
  proWash(g,proEll(x-7,y+72,7,4.5,10,-0.3),'#4a3020',983,{pool:1,lw:1,j:0.4}); proWash(g,proEll(x+7,y+72,7,4.5,10,0.3),'#4a3020',984,{pool:1,lw:1,j:0.4});
  proInk(g,[[x-3,y+75],[x-8,y+90]],1.6,985,'rgba(60,32,20,.9)'); proInk(g,[[x+3,y+75],[x+9,y+92]],1.6,986,'rgba(60,32,20,.9)');
  proWash(g,proEll(x,y,13,13.5,16),'#b8401a',987,{pool:1.8,lw:1.3,j:0.7});
  proWash(g,proEll(x+1,y-14,7.5,6.5,12),'#a8381a',988,{pool:1.2,lw:1.1,j:0.5});
  g.strokeStyle='rgba(90,24,10,.7)'; g.lineWidth=1; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(x-9+i*4,y-8); g.quadraticCurveTo(x-10+i*5,y+2,x-8+i*4,y+10); g.stroke(); }
  g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle='rgba(255,180,110,.3)'; g.lineWidth=2.4; g.beginPath(); g.arc(x,y,11,-2.5,-0.6); g.stroke(); g.restore();
}
// a grown-up standing, seen from behind or turned a little (face: 0 back, -1 looking left, 1 right)
function proPerson(g,x,feet,s,o,seed){
  const y=feet-120*s, R=mulberry32(seed);
  proWash(g,proPoly([[x-26*s,feet],[x-24*s,y+52*s],[x-19*s,y+26*s],[x+19*s,y+26*s],[x+24*s,y+52*s],[x+26*s,feet]],8),o.low||'#3a2a3a',seed+1,{pool:1.8,lw:1.2,j:1.2});
  proWash(g,proPoly([[x-24*s,y+70*s],[x-22*s,y+30*s],[x-12*s,y+20*s],[x+12*s,y+20*s],[x+22*s,y+30*s],[x+24*s,y+70*s]],7),o.shirt,seed+2,{pool:1.8,lw:1.2,j:1});
  if(o.apron) proWash(g,proPoly([[x-15*s,y+44*s],[x+15*s,y+44*s],[x+17*s,feet-4*s],[x-17*s,feet-4*s]],8),o.apron,seed+3,{pool:1.4,lw:1,j:0.8});
  const hx=x+(o.face||0)*3*s, hy=y+8*s;
  if(o.front){ proWash(g,proEll(hx,hy-3*s,13*s,13*s,14),o.hair,seed+5,{pool:1.6,lw:1.2,j:0.8}); proWash(g,proEll(hx,hy+1*s,9.5*s,10.5*s,12),o.skin,seed+4,{pool:1,lw:1,j:0.5});
    g.fillStyle='rgba(40,20,20,.9)'; g.beginPath(); g.arc(hx-3.6*s,hy,1.3*s,0,TAU); g.arc(hx+3.6*s,hy,1.3*s,0,TAU); g.fill();
    if(o.beard) proWash(g,proPoly([[hx-8*s,hy+4*s],[hx+8*s,hy+4*s],[hx+5*s,hy+14*s],[hx,hy+16*s],[hx-5*s,hy+14*s]],4),o.hair,seed+6,{pool:1,lw:0.9,j:0.5});
    g.strokeStyle='rgba(90,40,30,.8)'; g.lineWidth=1*s; g.beginPath(); g.arc(hx,hy+4.5*s,3*s,0.2*Math.PI,0.8*Math.PI); g.stroke();
    if(o.curly){ g.strokeStyle='rgba(120,90,40,.7)'; g.lineWidth=1.1; for(let i=0;i<7;i++){ const a=-2.9+i*0.47; g.beginPath(); g.arc(hx+Math.cos(a)*12*s,hy-3*s+Math.sin(a)*12*s,2.4*s,0,TAU); g.stroke(); } }
    return; }
  if(o.face){ proWash(g,proEll(hx+o.face*5*s,hy+2*s,10*s,11*s,12),o.skin,seed+4,{pool:1,lw:1,j:0.5}); g.fillStyle='rgba(40,20,20,.85)'; g.beginPath(); g.arc(hx+o.face*11*s,hy,1.4*s,0,TAU); g.fill(); }
  proWash(g,proEll(hx-(o.face||0)*3*s,hy-2*s,12*s,12.5*s,14),o.hair,seed+5,{pool:1.6,lw:1.2,j:0.8});
  if(o.curly){ g.strokeStyle='rgba(120,90,40,.7)'; g.lineWidth=1.1; for(let i=0;i<7;i++){ const a=-2.8+i*0.45; g.beginPath(); g.arc(hx+Math.cos(a)*10*s,hy-2*s+Math.sin(a)*10*s,2.4*s,0,TAU); g.stroke(); } }
  if(o.beard&&o.face){ proWash(g,proEll(hx+o.face*8*s,hy+10*s,6*s,5*s,10),o.hair,seed+6,{pool:1,lw:0.9,j:0.5}); }
  if(o.bun) proWash(g,proEll(hx,hy-15*s,6.5*s,5.5*s,10),o.hair,seed+7,{pool:1.2,lw:1,j:0.5});
  g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle='rgba(255,180,110,.28)'; g.lineWidth=2.4*s; g.beginPath(); g.arc(hx,hy-2*s,10.5*s,-2.4,-0.5); g.stroke(); g.restore();
}
// Elder Yara at the edge of the green, her shawl pulled tight, her face to the mountain
function proPaintYara(g){
  const x=PRO_YARA.x, f=PRO_YARA.y, s=1.06;
  proPerson(g,x,f,s,{shirt:'#4e5e32',low:'#3e4c28',skin:'#9a6444',hair:'#e8e4dc',bun:true,face:1},1001);
  proWash(g,proPoly([[x+26*s,f-92*s],[x+6*s,f-102*s],[x-20*s,f-96*s],[x-28*s,f-70*s],[x-10*s,f-60*s],[x+22*s,f-66*s]],6),'#a7d98f',1011,{pool:1.6,lw:1.2,j:0.8,a:0.85});
  g.strokeStyle='rgba(60,80,40,.6)'; g.lineWidth=1; for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(x+20*s-i*12*s,f-66*s); g.lineTo(x+22*s-i*12*s,f-56*s); g.stroke(); }
}
// Ash on the warm stone: horns, the back of his head, his tail curled round with its ember
function proPaintAsh(g,t){
  const x=PRO_ASH.x, y=PRO_ASH.y, B=PRO.beat, k=PRO.bt, jolt=(B==='roar'||B==='squeeze')&&k<0.4?-3:0, mine=B==='mine'?Math.abs(Math.sin(t*9))*3:0;
  const flick=B==='flick'?Math.sin(clamp(k/1.2,0,1)*Math.PI*3)*0.9:0;
  // the tail, out to the side along the stone, its ember at the tip
  const tw=Math.sin(t*1.6)*0.25+flick, tx=x+44+Math.cos(tw)*10, ty=y+44-Math.sin(tw)*16-Math.abs(flick)*10;
  g.strokeStyle='#5e1a10'; g.lineWidth=8; g.lineCap='round'; g.beginPath(); g.moveTo(x+12,y+48); g.quadraticCurveTo(x+34,y+58,tx,ty); g.stroke();
  g.strokeStyle='#b8402a'; g.lineWidth=5.4; g.stroke();
  proGlow(g,tx+3,ty-2,20+4*Math.sin(t*7),'255,160,60',0.6);
  g.fillStyle='#ffb04a'; g.beginPath(); g.moveTo(tx-3,ty+2); g.lineTo(tx+6,ty-5); g.lineTo(tx+3,ty+5); g.closePath(); g.fill();
  // shoulders (his tunic), the head
  proWash(g,proPoly([[x-24,y+58],[x-21,y+22],[x-10,y+14],[x+10,y+14],[x+21,y+22],[x+24,y+58]],6),'#5a6a3a',1101,{pool:1.8,lw:1.3,j:1});
  const hy=y+jolt-mine;
  proWash(g,proEll(x,hy,15,15.5,16),'#b8402a',1103,{pool:2,lw:1.4,j:0.8});
  g.fillStyle='rgba(126,38,23,.55)'; for(const [dx,dy] of [[-6,-4],[4,-8],[7,3],[-3,6]]){ g.beginPath(); g.ellipse(x+dx,hy+dy,2.6,1.8,0.4,0,TAU); g.fill(); }
  g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle='rgba(255,180,110,.35)'; g.lineWidth=2.6; g.beginPath(); g.arc(x,hy,13,-2.6,-0.5); g.stroke(); g.restore();
  // horns, curling back
  for(const s of [-1,1]){ const P=[[x+s*7,hy-10],[x+s*12,hy-20],[x+s*21,hy-25],[x+s*28,hy-22]];
    g.strokeStyle='#5e4a30'; g.lineWidth=7; g.lineCap='round'; proPath(g,P,false); g.stroke(); g.strokeStyle='#efe0bf'; g.lineWidth=4.4; proPath(g,P,false); g.stroke(); }
  // during "Mine!" every child has a fist up, Ash too
  if(B==='mine'){ proArm(g,x+16,y+24,x+24,y-12-mine,'#b8402a'); }
}
function proArm(g,x0,y0,x1,y1,col){ g.strokeStyle='rgba(43,22,38,.86)'; g.lineWidth=6; g.lineCap='round'; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); g.strokeStyle=col; g.lineWidth=4; g.stroke(); g.fillStyle=col; g.beginPath(); g.arc(x1,y1,3.6,0,TAU); g.fill(); g.strokeStyle='rgba(43,22,38,.86)'; g.lineWidth=1; g.stroke(); }
// the live bits of the crowd: Mom's hand, the little one pointing, the fists for "Mine!", Wendel's bow
function proPaintLive(g,t){
  const B=PRO.beat, k=PRO.bt;
  // Mom's hand on Ash's shoulder: it squeezes when the dragon roars
  const sq=PRO.squeeze, hx=PRO_ASH.x-15, hy=PRO_ASH.y+18;
  g.strokeStyle='rgba(43,22,38,.86)'; g.lineWidth=7; g.lineCap='round'; g.lineWidth=10; g.beginPath(); g.moveTo(PRO_MOM.x+19,PRO_MOM.y+26); g.quadraticCurveTo(PRO_MOM.x+34,PRO_MOM.y+46,hx+2,hy-2); g.stroke(); g.strokeStyle='#8a4a2a'; g.lineWidth=7.6; g.beginPath(); g.moveTo(PRO_MOM.x+19,PRO_MOM.y+26); g.quadraticCurveTo(PRO_MOM.x+33,PRO_MOM.y+40,PRO_MOM.x+30,PRO_MOM.y+52); g.stroke(); g.strokeStyle='#e2aa82'; g.lineWidth=6; g.beginPath(); g.moveTo(PRO_MOM.x+30,PRO_MOM.y+52); g.quadraticCurveTo(PRO_MOM.x+31,PRO_MOM.y+62,hx+2,hy-2); g.stroke();
  proWash(g,proEll(hx+2,hy+2,6.5-sq*1.2,4.6+sq*0.6,10,0.4),'#e2aa82',1201,{pool:1,lw:1.1,j:0.4});
  g.strokeStyle='rgba(120,60,40,.7)'; g.lineWidth=0.9; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(hx+i*2.6,hy+2); g.lineTo(hx+i*2.6+1.2,hy+6+sq*1.5); g.stroke(); }
  if(sq>0.3){ g.strokeStyle=`rgba(255,240,220,${(sq-0.3)*1.2})`; g.lineWidth=1.3; for(const a of [-2.2,-1.6,-1.0]){ g.beginPath(); g.moveTo(hx+2+Math.cos(a)*10,hy+Math.sin(a)*10); g.lineTo(hx+2+Math.cos(a)*15,hy+Math.sin(a)*15); g.stroke(); } }
  // the littlest one pointing at Ash's horns
  const L=PRO_LIT[0], point=(B==='point'||B==='wave'||B==='flick')?1:0;
  if(point){ const up=B==='wave'?Math.sin(t*8)*4:0; proArm(g,L[0]-8,L[1]+14,L[0]-30,L[1]-14+up,'#f0c8a0'); }
  // "Mine!": fists up all along the rows
  if(B==='mine'){ for(const [x,y] of [[-120,150],[-40,152],[40,150],[120,151],[-60,188],[30,190],[120,188],[200,190],[PRO_ROOK.x,PRO_ROOK.y]]){ const b=Math.abs(Math.sin(t*9+x))*3; proArm(g,x+10,y+18,x+16,y-18-b,'#e0ae88'); } }
  // Wendel's bow
  { const W=PRO_WEN, s=1.02, y=W.y-120*s, bx=W.x-34, by=y+30, a=-0.4+Math.sin(t*(proAt('tune')&&!proAt('open')||B==='sing'?5:1.2))*0.35;
    g.save(); g.translate(bx,by); g.rotate(a); g.strokeStyle='rgba(70,40,24,.9)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-34,0); g.lineTo(30,0); g.stroke(); g.restore();
    proWash(g,proEll(W.x-22,y+24,9,5,10,-0.5),'#8a4a22',1211,{pool:1,lw:1,j:0.4}); }
  // the moth's lantern, and the moth
  const ML=PRO.mothLan;
  if(ML){ const m=PRO.moth, landK=m?clamp((m.t-1.6)/0.4,0,1):0;
    proLantern(g,ML.x,ML.y,'#e8c66a',landK*0.35,1301,1);
    if(m){ m.t+=1/60; const fly=clamp(m.t/1.8,0,1), px=lerp(-330,ML.x,fly)+Math.sin(m.t*7)*(1-fly)*16, py=lerp(-120,ML.y+16,fly)+Math.cos(m.t*9)*(1-fly)*12;
      const flap=fly<1?Math.sin(m.t*30)*0.6:0.15+0.05*Math.sin(t*2);
      g.save(); g.translate(px,py); g.fillStyle='rgba(150,146,150,.95)'; g.strokeStyle='rgba(40,30,40,.8)'; g.lineWidth=0.8;
      for(const s of [-1,1]){ g.save(); g.scale(s,1); g.rotate(-flap*0.6); g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(7,-8,12,-2); g.quadraticCurveTo(10,5,0,3); g.closePath(); g.fill(); g.stroke(); g.restore(); }
      g.fillStyle='#5a5258'; g.beginPath(); g.ellipse(0,1,1.6,4,0,0,TAU); g.fill(); g.restore(); }
  }

}
// Nana, behind the booth, peeks round its side for the bow (painted before the booth, so its post hides her shoulder)
function proPaintBehind(g,t){
  const B=PRO.beat, k=PRO.bt;
  // Nana peeks round the booth for the bow
  if(B==='bow'||B==='yara'&&k<1.2){ const q=B==='bow'?proEase(k/0.8):1-proEase(k/1.2), x=136+q*28, y=-40;
    proWash(g,proPoly([[x-24,y+40],[x-20,y+14],[x-8,y+9],[x+10,y+10],[x+20,y+18],[x+22,y+40]],6),'#a05a7a',1405,{pool:1.4,lw:1.1,j:0.6});
    proWash(g,proEll(x,y,11,12,12),'#f4d6c2',1401,{pool:1,lw:1.1,j:0.5}); proWash(g,proEll(x+3,y-9,11,7,12),'#efeae0',1402,{pool:1,lw:1.1,j:0.5}); proWash(g,proEll(x+4,y-17,5,4,10),'#efeae0',1403,{pool:0.8,lw:1,j:0.4});
    g.strokeStyle='rgba(40,30,30,.85)'; g.lineWidth=1; for(const dx of [-5,3]){ g.beginPath(); g.arc(x+dx,y,3,0,TAU); g.stroke(); }
    g.fillStyle='#2a1a14'; g.fillRect(x-5.6,y-0.6,1.4,1.4); g.fillRect(x+2.4,y-0.6,1.4,1.4);
    proWash(g,proEll(x-12,y+10,4,3.5,8),'#f4d6c2',1404,{pool:0.8,lw:0.9,j:0.3}); }
}
// smoke from the real mountain: thicker on the rumble
function proSmoke(g,t){
  const big=PRO.beat==='rumble'?1+proEase(PRO.bt/0.8)*0.8:1;
  for(let i=0;i<7;i++){ const ph=(t*0.05+i/7)%1, x=250-ph*170+Math.sin(ph*5+i)*12, y=-236-ph*90, r=(10+ph*38)*big;
    g.fillStyle=`rgba(150,130,160,${0.22*Math.sin(ph*Math.PI)})`; g.beginPath(); g.ellipse(x,y,r,r*0.7,0,0,TAU); g.fill(); }
  const gl=PRO.beat==='rumble'?0.5+0.4*Math.sin(clamp(PRO.bt/1.6,0,1)*Math.PI):0.3+0.08*Math.sin(t*1.3);
  proGlow(g,252,-230,70,'255,110,50',gl);
}

// ---------- each frame: sky, scenery, booth and stage, crowd, the live bits, paper, the fade
function proDraw(){
  const cv=PRO.cv; if(!cv) return;
  const Lo=proLayout(), w=Lo.w, h=Lo.h, dpr=Lo.dpr;
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){ cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); }
  if(PRO.el) PRO.el.style.pointerEvents=PRO.on&&PRO.phase==='title'?'auto':'none';
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0);
  const show=PRO.phase==='title'||PRO.phase==='show'||PRO.phase==='towalk'&&PRO.cover;
  if(!show){ g.clearRect(0,0,w,h); if(PRO.fade>0.002){ g.fillStyle=`rgba(6,3,10,${PRO.fade})`; g.fillRect(0,0,w,h); } return; }
  proBuild();
  const t=PRO.t, sc=Lo.sc, cx=clamp(PRO.cx,-Lo.lim,Lo.lim), shake=PRO.shakeT>0?Math.sin(t*70)*2.2*Math.min(1,PRO.shakeT*3):0;
  const oy=Lo.oy+(PRO.oyS||0), X=v=>w/2+(v-cx)*sc+shake, Y=v=>oy+v*sc;
  // the sky and the green (one cached picture), the stars
  const hz=Lo.oy+PRO_HZ*sc;
  if(!PRO.C.bg){ const bc=mkCanvas(Math.max(2,Math.round(w*dpr)),Math.max(2,Math.round(h*dpr))), q=bc.getContext('2d'), Hz=hz*dpr;
    const sk=q.createLinearGradient(0,0,0,Hz); sk.addColorStop(0,'#161430'); sk.addColorStop(0.55,'#2c2652'); sk.addColorStop(1,'#5a3e62'); q.fillStyle=sk; q.fillRect(0,0,bc.width,Hz+2);
    const gr=q.createLinearGradient(0,Hz,0,bc.height); gr.addColorStop(0,'#2a3a3a'); gr.addColorStop(0.35,'#22322c'); gr.addColorStop(1,'#141c1a'); q.fillStyle=gr; q.fillRect(0,Hz,bc.width,bc.height-Hz);
    proGrain(bc); PRO.C.bg=bc; }
  { const sh=PRO.oyS||0; g.drawImage(PRO.C.bg,0,sh,w,h); if(sh<0){ g.fillStyle='#141c1a'; g.fillRect(0,h+sh-1,w,1-sh); } else if(sh>0){ g.fillStyle='#161430'; g.fillRect(0,0,w,sh+1); } }
  if(!PRO.C.stars){ const R=mulberry32(3); PRO.C.stars=[]; for(let i=0;i<90;i++) PRO.C.stars.push([R()*2-1,R(),0.5+R()*1.3,R()*9]); }
  for(const [sx,sy,r,ph] of PRO.C.stars){ const x=w/2+sx*w*0.6-cx*sc*0.3, y=sy*hz*0.82; g.fillStyle=`rgba(255,246,220,${0.35+0.4*Math.sin(t*1.3+ph)*Math.sin(t*0.7+ph*2)})`; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  // scenery, then the light of the stage spilling on the grass
  g.save(); g.setTransform(dpr*sc,0,0,dpr*sc,dpr*X(0),dpr*Y(0)); proSmoke(g,t); g.restore();
  proBlit(g,PRO.C.scen,X,Y);
  g.save(); g.globalCompositeOperation='lighter'; const pl=g.createRadialGradient(X(0),Y(60),10,X(0),Y(60),360*sc); pl.addColorStop(0,'rgba(255,170,90,.26)'); pl.addColorStop(1,'rgba(255,170,90,0)'); g.fillStyle=pl; g.fillRect(X(0)-360*sc,Y(60)-360*sc,720*sc,720*sc); g.restore();
  // the booth (Nana behind it), then the stage inside it
  g.save(); g.setTransform(dpr*sc,0,0,dpr*sc,dpr*X(0),dpr*Y(0)); g.lineCap='round'; g.lineJoin='round'; proPaintBehind(g,t); g.restore();
  proBlit(g,PRO.C.booth,X,Y);
  g.save(); g.setTransform(dpr*sc,0,0,dpr*sc,dpr*X(0),dpr*Y(0)); g.lineCap='round'; g.lineJoin='round'; proPaintStage(g,t); g.restore();
  // the crowd (turning round to look at Ash at the girl's bit), Yara, then the live bits
  const jolt=(PRO.beat==='roar'||PRO.beat==='squeeze')&&PRO.bt<0.4?-3*sc:0;
  g.save(); g.translate(0,jolt); proBlit(g,PRO.C.crowd,X,Y,1-PRO.turnK); if(PRO.turnK>0.01) proBlit(g,PRO.C.crowdT,X,Y,PRO.turnK); g.restore();
  proBlit(g,PRO.C.yara,X,Y);
  g.save(); g.setTransform(dpr*sc,0,0,dpr*sc,dpr*X(0),dpr*Y(0)); g.lineCap='round'; g.lineJoin='round'; proPaintLive(g,t); proPaintAsh(g,t); g.restore();
  // the edges darkened, like a page
  if(!PRO.C.vig||PRO.C.vigK!==w+'x'+h){ PRO.C.vigK=w+'x'+h; const vc=mkCanvas(Math.max(2,w>>1),Math.max(2,h>>1)), vg=vc.getContext('2d'), rg=vg.createRadialGradient(vc.width/2,vc.height*0.42,Math.min(vc.width,vc.height)*0.3,vc.width/2,vc.height*0.45,Math.max(vc.width,vc.height)*0.75); rg.addColorStop(0,'rgba(10,4,16,0)'); rg.addColorStop(1,'rgba(10,4,16,.62)'); vg.fillStyle=rg; vg.fillRect(0,0,vc.width,vc.height); PRO.C.vig=vc; }
  g.drawImage(PRO.C.vig,0,0,w,h);
  if(PRO.fade>0.002){ g.fillStyle=`rgba(6,3,10,${PRO.fade})`; g.fillRect(0,0,w,h); }
}

// ---------- hooks into the game
// the world is not drawn while the painting covers it (it saves a phone the work)
{ const base=render; render=function(){ if(PRO.on&&PRO.cover&&scene!=='play'){ ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#08060c'; ctx.fillRect(0,0,cvs.width,cvs.height); return; } return base.apply(this,arguments); }; }
// the walk: the tip with the keys instead of the coach; the per-frame checks
{ const base=drawCoach; drawCoach=function(){ if(PRO.on) return; return base.apply(this,arguments); }; }
// no quest marks over heads tonight (Mom's "!" is for the morning)
{ const base=drawMarkers; drawMarkers=function(){ if(PRO.on) return; return base.apply(this,arguments); }; }
{ const base=drawHUD; drawHUD=function(){ const r=base.apply(this,arguments); if(PRO.on&&scene==='play') try{ proDrawTip(); }catch(e){} return r; }; }
{ const base=update; update=function(dt){ const r=base.apply(this,arguments); if(PRO.on) try{ proTick(dt); }catch(e){ console.error(e); } return r; }; }
{ const base=setupNPCs; setupNPCs=function(){ const r=base.apply(this,arguments); if(PRO.on&&PRO.phase!=='title'&&PRO.phase!=='show') try{ proNpcs(); }catch(e){} return r; }; }
// nothing is saved until the morning (a journey quit during the prologue starts again with it)
{ const base=saveGame; saveGame=function(){ if(PRO.on) return; return base.apply(this,arguments); }; }
// the goal on the HUD and the compass: home, the stairs, the bed
{ const base=questObjective; questObjective=function(){ if(PRO.on&&G&&G.mode==='story'){ const T=proTarget(), w=proWhere();
    return {title:S('Lantern Eve','Lantern Eve'),text:w==='up'?S('Get into bed','Get into bed'):w==='down'?S('Go up to bed','Go up to bed'):S('Walk home to bed','Walk home to bed'),x:T?T.x:undefined,y:T?T.y:undefined}; }
  return base.apply(this,arguments); }; }
{ const base=questObjectiveWorld; questObjectiveWorld=function(){ if(PRO.on&&G&&G.mode==='story'){ const T=proTarget(); return {title:S('Lantern Eve','Lantern Eve'),text:S('Walk home to bed','Walk home to bed'),x:T?T.x:undefined,y:T?T.y:undefined}; } return base.apply(this,arguments); }; }
// only home tonight: other doors stay shut, and the three on the green just say goodnight
{ const base=enterArea; enterArea=function(id,door){ if(PRO.on&&PRO.phase!=='title'&&PRO.phase!=='show'&&id!=='h_ash'&&id!=='h_ash_up'){ try{ if(door){ doorNote(door.x,door.y-30,S('Everyone is still out on the green. Home is the other way.','Nobody is home. Go home.'),false); DW.hold=door; DW.holdT=0.4; } }catch(e){} return; } return base.apply(this,arguments); }; }
{ const base=talkTo; talkTo=function(n){ if(PRO.on){ const L=PRO_TALK[n&&n.id]; if(L) runDialogue(L(),()=>{ scene='play'; }); return; } return base.apply(this,arguments); }; }
// the prompts tonight: home's front door, the three on the green, the stairs, the bed (nothing else on the way)
{ const base=updateInteractions; updateInteractions=function(dt){ const r=base.apply(this,arguments);
    if(!PRO.on||(PRO.phase!=='walk'&&PRO.phase!=='home')) return r;
    const p=G.prompt, t=p?String(p.text||''):'';
    if(AREA){ if(p&&!/^(Go|Climb|Leave|Get into bed|Go to bed)/i.test(t)) G.prompt=null; return r; }
    const d=DOORS.find(q=>q.area==='h_ash'), atDoor=p&&d&&Math.abs(p.x-d.x)<2&&Math.abs(p.y-d.y)<2;
    if(p&&(atDoor||/^Talk to/i.test(t))) return r;
    G.prompt=null;
    if(d&&dist(player.x,player.y,d.x,d.y)<46) G.prompt={text:String(d.label||'Enter Home'),act:()=>enterArea(d.area,d),x:d.x,y:d.y};
    else for(const n of G.npcs){ if(dist(player.x,player.y,n.x,n.y)<70){ G.prompt={text:`Talk to ${n.name.replace(', your mom','')}`,act:()=>talkTo(n),x:n.x,y:n.y}; break; } }
    return r; }; }
{ const base=areaObjAct; areaObjAct=function(o){ if(PRO.on&&o&&o.k==='bed'&&o.home&&AREA&&AREA.id==='h_ash_up'){ proBed(o); return; } if(PRO.on&&o&&o.k!=='stairs') return; return base.apply(this,arguments); }; }
// Escape skips it (a capture listener, ahead of the game's keys: outside a talk Escape would pause), and so do the
// controller's back button and the dialogue's own Skip, at once (no second press). The pause button still pauses.
{ const base=dlgAskSkip; dlgAskSkip=function(){ if(PRO.on){ proSkip(); return; } return base.apply(this,arguments); }; }
addEventListener('keydown',e=>{
  if(!PRO.on||(scene!=='prologue'&&scene!=='play')) return;
  if(e.code==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); if(!e.repeat) proSkip(); return; }
  if(scene!=='prologue') return;
  else if(PRO.phase==='title'&&(e.code==='Space'||e.code==='Enter'||e.code==='KeyE')){ e.preventDefault(); proShow(); }
},true);
// the controller during the title: A starts the show, B or back skips (in the show it is the dialogue's own buttons)
{ const base=padPoll; padPoll=function(dt){ const r=base.apply(this,arguments);
    try{ if(PRO.on&&scene==='prologue'&&navigator.getGamepads){ const gp=[...navigator.getGamepads()].find(q=>q&&q.connected); if(gp){ const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed), now={a:b(0),b:b(1)||b(8)||b(9)}, was=PRO.padWas||{};
      if(now.b&&!was.b) proSkip(); else if(now.a&&!was.a&&PRO.phase==='title') proShow(); PRO.padWas=now; } } }catch(e){}
    return r; }; }
// a save loaded, or a new journey started, while the prologue was still running (it was left for the menu)
{ const base=startStory; startStory=function(){ proAbort(); return base.apply(this,arguments); }; }
// quit to the title from the pause menu: the save is refused first (saveGame above), then the prologue lets go
{ const base=toMenu; toMenu=function(){ const r=base.apply(this,arguments); proAbort(); return r; }; }
// the test drivers' one call (__eb.skipDialogue right after a new journey) still lands in the morning with nothing to read
function proHookTests(){
  try{ const E=window.__eb; if(E&&!E._proSkip){ const b=E.skipDialogue; E.skipDialogue=function(){ if(PRO.on) proFinish(true); return b.apply(this,arguments); }; E._proSkip=1; } }catch(e){}
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{pro:{
  state:()=>({on:PRO.on,phase:PRO.phase,beat:PRO.beat,watched:PRO.watched,where:PRO.on?proWhere():null,tip:PRO.on?proTipId():null,fade:PRO.fade,ms:PRO.ms,eve:!!(G&&G.flags&&G.flags.lantern_eve),sc:PRO.sc}),
  skip:()=>proSkip(), show:()=>proShow(), dlgText:()=>DLG?simplify(String(DLG.text||'')):null, beat:b=>proBeat(b), bed:()=>{ const b=AREA&&AREA.objs.find(o=>o.k==='bed'&&o.home); if(b) proBed(b); return !!b; },
  lines:()=>proShowLines().concat(proBedLines()).map(l=>[l.who,l.text])
}});
