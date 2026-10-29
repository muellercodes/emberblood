// ================= quests that need the new gifts: Clover the jumping sheep, the Lake King, Elka's sky hoops
// Each def carries ab:'jump'|'stride'|'wings'. The engine reads `after` (a quest that must be done), so the getter
// below keeps the quest hidden until Ash has the gift. (A native check would be one line in qAvail:
// `if(d.ab&&!hasAbil(d.ab)) return false;`.)
const abGate=(ab,after)=>function(){ return hasAbil(ab)?(after||null):'__needs_'+ab; };
QDEFS.sheep={title:S('A Woolly Jumper','Clover Goes Missing'),giver:'hal',min:'warcamp',ab:'jump',
  offer:[['hal',`Ash! My best sheep, Clover, has gone and done it again.`],['hal',`She hopped across the stepping stone on Bramble Pond, just south of town, and now she's stuck on the little island. She can jump out there. She cannot jump back. She's very proud and very silly.`],['ash',`So you want me to jump out and fetch her?`],['hal',`Can you jump? Since when can you jump?`]],
  steps:[
    {t:'flag',flag:'clover_found',text:'Jump across Bramble Pond, south of Emberhollow, and help Clover the sheep off the island',at:'lm:rc_clover'},
    {t:'talk',npc:'hal',text:'Tell Hal that Clover is safe',lines:[['hal',`She came trotting home all by herself, bouncing like a frog! What did you DO?`],['ash',`I showed her how to jump back.`],['hal',S(`Now she won't stop. Over the fence, over the dog, over me. Moo-rgaret is furious. Here. You've earned it.`,`Now she jumps over everything. Even me! Here.`)]],reward:{coins:40,xp:90}}
  ]};
Object.defineProperty(QDEFS.sheep,'after',{get:abGate('jump')});
QDEFS.lakeking={title:S('Is the Lake King Reel?','The Lake King'),giver:'dell',min:'warcamp',ab:'stride',
  offer:[['dell',`Ash. You've been walking on the lake. Don't deny it. I saw the steam.`],['dell',`Out in Lake Mirrow lives the Lake King. Biggest fish in the valley. He has a fin shaped like a crown. Thirty years I've tried to catch him from this dock, and he just laughs at me.`],['dell',`Walk out there, stand right by his big ripples in the north of the lake, and fish him up. Then let him go, mind. I just want to know he's real.`]],
  steps:[
    {t:'flag',flag:'lakeking_caught',text:'Walk out onto Lake Mirrow and fish up the Lake King at the big ripples in the north of the lake',at:'lm:rc_lakeking'},
    {t:'talk',npc:'dell',text:'Tell Dell you caught the Lake King',lines:[['dell',`You CAUGHT him? How big? ...THAT big? With the crown and everything?`],['dell',`Thirty years. I knew it. I KNEW it. Thank you, Ash. Here. And go easy on him, he's got grandchildren.`]],reward:{coins:60,xp:160,bless:1}}
  ]};
Object.defineProperty(QDEFS.lakeking,'after',{get:abGate('stride','dell')});
QDEFS.skyhoops={title:'Hoops in the Sky',giver:'elka',min:'oath',ab:'wings',
  offer:[['elka',`ASH. You can FLY now? That is so unfair. I love it.`],['elka',`Ulf flies kites. I tied eight hoops to eight kites around the lodge. Fly through all of them before my sand timer runs out and I'll give you the fastest thing I own.`],['ash',`What's the fastest thing you own?`],['elka',S(`My lucky boots. My second luckiest, anyway.`,`My lucky boots. Well, second luckiest.`)]],
  steps:[
    {t:'flag',flag:'skyhoops_won',npc:'elka',mini:'skyrace',text:'Fly through Elka’s eight kite hoops around Frostpine Lodge before her sand timer runs out (talk to Elka to start)',ready:[['elka',`Take off, then fly through the glowing hoop. Then the next one. Each hoop gives your wings a little rest. Ready? The sand is falling!`]]},
    {t:'talk',npc:'elka',text:'Collect your prize from Elka',lines:[['elka',S(`All eight! That was the best thing I have ever seen. Ulf let go of his kite. He says he did it on purpose.`,`All eight! The best thing ever! Ulf let go of his kite.`)],['elka',S(`Here, my boots. You don't need them, you have wings. But now you'll look fast standing still.`,`Here, my boots. Now you look fast too.`)]],reward:{xp:180,stamina:10,sp:1}}
  ]};
Object.defineProperty(QDEFS.skyhoops,'after',{get:abGate('wings')});

// ---------- quest places (called from reachPlaces in a2i_reach.js, while the world is built)
function reachQuestPlaces(){
  // Clover on the Bramble Pond islet
  addLandmark({id:'rc_clover',k:'reach',x:2866,y:10344,noNudge:true,r:9,prompt:'Talk to the sheep',hidden:()=>!!G.flags.clover_found,draw:(o,t)=>{ if(!G.flags.clover_found) drawSheep(o.x,o.y,t,0,-0.4); },act:cloverAct});
  // Clover back home with Hal (placed next to Hal once the world knows where he lives)
  addLandmark({id:'rc_clover_home',k:'reach',x:-999,y:-999,noNudge:true,prompt:'Pet Clover',hidden:()=>!G.flags.clover_found,draw:(o,t)=>{ if(!G.flags.clover_found) return; o.hop=Math.max(0,(o.hop||0)-1/60); const z=Math.max(0,Math.sin((t%2.6)/0.5*Math.PI))*(t%2.6<0.5?14:0); drawSheep(o.x,o.y,t,z,0.6); },act:o=>{ runDialogue([['narr',pick([`Clover jumps straight up in the air. Then again. She looks at you like you started this. You did.`,`You pet Clover. She is very fluffy and slightly smug.`,`Clover jumps over a bucket, lands, and bows. Hal sighs from somewhere nearby.`])]],()=>{ scene='play'; }); }});
  // the Lake King's ripples, out in the north of Lake Mirrow
  addLandmark({id:'rc_lakeking',k:'reach',x:6250,y:6900,noNudge:true,prompt:'Fish for the Lake King',hidden:()=>!!MV.lk,draw:drawLakeKing,act:lakeKingAct});
  // Elka's kite hoops race
  MINI.skyrace=SKYRACE;
}
function reachLate(){
  const d=homeDoor('hal'), o=LANDMARKS.find(q=>q.id==='rc_clover_home');
  if(d&&o){ o.x=d.x-40; o.y=d.y+46; }
}
function cloverAct(o){
  const q=G.quests.sheep;
  if(!q||q.done){ runDialogue([['narr',`A very fluffy sheep, stuck on a tiny island. Her bell says CLOVER. PROPERTY OF HAL BURROWS.`],['narr',`She does not look worried. She looks like she is waiting for someone to be impressed.`]],()=>{ scene='play'; }); return; }
  runDialogue([['narr',`Clover looks at you. She looks at the stepping stone. She looks at you again. "Baa," she says, in a way that means "you first."`],['ash',`Okay. Watch. Jump, land, jump again. Easy.`],['narr',`You hop to the stone and back. Clover watches very carefully. Then she bounces across the pond like a woolly frog and trots off toward Emberhollow, bell jingling.`]],()=>{
    scene='play'; G.flags.clover_found=true; deed('clover'); emit(o.x,o.y,14,{col:'250,250,240',glow:false,smin:30,smax:90,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:4}); questPoke(); saveGame();
  });
}
// a fluffy sheep with a red collar and a bell (z lifts her for a hop)
function drawSheep(x,y,t,z,face){
  if(T3.on&&T3B.sheep){ T3B.sheep(x,y,t,z,face); return; }
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(2,4,14-z*0.2,7-z*0.1,0,0,TAU); ctx.fill();
  ctx.translate(0,-z); ctx.rotate(face||0);
  const br=Math.sin(t*2)*0.4;
  for(const [dx,dy,r] of [[-6,-3,7],[0,-5,7.5],[6,-3,7],[-7,3,6.5],[0,4,7],[7,3,6.5],[0,0,8]]){ ctx.fillStyle='#d8d4c8'; ctx.beginPath(); ctx.arc(dx+0.8,dy+1.2,r+br,0,TAU); ctx.fill(); }
  for(const [dx,dy,r] of [[-6,-3,6],[0,-5,6.5],[6,-3,6],[-7,3,5.5],[0,4,6],[7,3,5.5],[0,0,7]]){ ctx.fillStyle='#f6f3ea'; ctx.beginPath(); ctx.arc(dx,dy,r+br,0,TAU); ctx.fill(); }
  ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(-3,-6,3,0,TAU); ctx.fill();
  // head, ears, eyes, the collar and bell
  ctx.fillStyle='#3a3430'; ctx.beginPath(); ctx.ellipse(13,0,5.5,4.6,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10,-5.5,3.4,1.6,-0.6,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(10,5.5,3.4,1.6,0.6,0,TAU); ctx.fill();
  ctx.fillStyle='#f6f3ea'; ctx.beginPath(); ctx.arc(10.5,0,3,0,TAU); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(15,-1.8,1.2,0,TAU); ctx.arc(15,1.8,1.2,0,TAU); ctx.fill();
  ctx.fillStyle='#1a1410'; ctx.beginPath(); ctx.arc(15.4,-1.8,0.6,0,TAU); ctx.arc(15.4,1.8,0.6,0,TAU); ctx.fill();
  ctx.strokeStyle='#c8322a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(8,0,5,-1.1,1.1); ctx.stroke();
  ctx.fillStyle='#ffd84a'; ctx.beginPath(); ctx.arc(9.5+Math.sin(t*4)*0.4,0,1.8,0,TAU); ctx.fill();
  ctx.restore();
}
// ---------- the Lake King: big ripples, a huge shadow with a crown fin, and a three-tug catch
function drawLakeKing(o,t){
  if(T3.on&&T3B.lakeking){ T3B.lakeking(o,t); return; }
  const x=o.x, y=o.y;
  ctx.lineWidth=1.3;
  for(let k=0;k<3;k++){ const r=10+((t*14+k*16)%48), a=0.4*(1-r/58); ctx.strokeStyle=`rgba(225,238,248,${a})`; ctx.beginPath(); ctx.ellipse(x,y,r*1.3,r*0.75,0,0,TAU); ctx.stroke(); }
  // the shadow circling under the surface
  const caught=!!G.flags.lakeking_caught, a=t*0.55, fx=x+Math.cos(a)*30, fy=y+Math.sin(a)*18, f=a+Math.PI/2;
  ctx.save(); ctx.translate(fx,fy); ctx.rotate(f); ctx.globalAlpha=0.62;
  ctx.fillStyle='#06141c'; ctx.beginPath(); ctx.ellipse(0,0,32,12.5,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-27,0); ctx.lineTo(-46,-11+Math.sin(t*6)*2.5); ctx.lineTo(-43,11+Math.sin(t*6)*2.5); ctx.closePath(); ctx.fill();
  for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(4,s*12,9,3.5,s*0.5,0,TAU); ctx.fill(); }
  ctx.globalAlpha=0.3; ctx.strokeStyle='#8ac0d8'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(0,0,32,12.5,0,0,TAU); ctx.stroke();
  ctx.globalAlpha=1;
  if(Math.sin(t*0.9)>-0.3||MV.lk){ ctx.fillStyle='#f0c038'; ctx.strokeStyle='#8a5a10'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(-7,0); for(let i=0;i<4;i++){ ctx.lineTo(-4.5+i*4,-6-(i%2?1.5:4)); ctx.lineTo(-2.5+i*4,-1); } ctx.lineTo(9,0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  if(Math.random()<0.02) G.ripples.push({x:x+rand(-30,30),y:y+rand(-16,16),t:0,max:0.7,r:8});
  // the line and bobber while Ash is fishing
  const L=MV.lk;
  if(L){ const p=player, bob=Math.sin(t*4)*1.5+(L.phase==='bite'?3:0); ctx.strokeStyle='rgba(240,240,240,.75)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(p.x+Math.cos(p.facing)*24,p.y+Math.sin(p.facing)*24); ctx.quadraticCurveTo((p.x+L.wx)/2,(p.y+L.wy)/2-20,L.wx,L.wy+bob); ctx.stroke(); ctx.fillStyle='#c8322a'; ctx.beginPath(); ctx.arc(L.wx,L.wy+bob,4,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(L.wx,L.wy+bob-2,2,0,TAU); ctx.fill(); if(L.phase==='bite') drawMarker(L.wx,L.wy-26,'!',t); }
  else if(caught&&Math.sin(t*0.5)>0.9) rGlint(x+8,y-4,t,0,0.6);
}
function lakeKingAct(o){
  const p=player, q=G.quests.lakeking, active=q&&!q.done&&!G.flags.lakeking_caught;
  if(!G.items.rod){ runDialogue([['narr',`Something enormous circles under the water, wearing what looks like a little golden crown. You would need a fishing rod. Dell Fisk on the Brindlecross dock lends them out.`]],()=>{ scene='play'; }); return; }
  if(!active){ runDialogue([['narr',G.flags.lakeking_caught?`The Lake King swims past, very slowly, so you can admire him. He winks.`:`A huge shadow with a golden crown-shaped fin circles under the water. Dell the fisherman would give his best hat to hear about this.`]],()=>{ scene='play'; }); return; }
  MV.lk={phase:'wait',t:rand(1.4,2.6),n:0,px:p.x,py:p.y,wx:o.x,wy:o.y};
  p.facing=angTo(p.x,p.y,o.x,o.y); SFX.play('roll'); setBanner('The Lake King',`Press ${usingTouch||padActive()?'use':'E'} each time the bobber splashes. Three tugs!`,2.6);
}
function lkUpdate(dt,inp){
  const L=MV.lk, p=player; if(!L) return;
  const use=inp.use; inp.use=false;
  if(dist(p.x,p.y,L.px,L.py)>14||G.inCombat||p.flying||(p.z||0)>0){ MV.lk=null; setBanner('The line went slack','Stand still while you fish.',1.6); return; }
  L.t-=dt;
  if(L.phase==='wait'){
    if(use){ MV.lk=null; setBanner('Too soon!','The Lake King swims off laughing. Try again.',1.8); return; }
    if(L.t<=0){ L.phase='bite'; L.t=Math.max(0.55,0.95-L.n*0.12); SFX.play('hit'); G.ripples.push({x:L.wx,y:L.wy,t:0,max:0.8,r:24,splash:true}); }
  }else if(L.phase==='bite'){
    if(use){
      L.n++; mvSnd('reel'); emit(L.wx,L.wy,12,{col:'215,232,245',glow:false,ang:-Math.PI/2,spread:1,smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.5,zmax:3,rise:-150}); shake(3);
      if(L.n>=3){ MV.lk=null; lakeKingCaught(); return; }
      ftext(p.x,p.y-30,['He is fighting!','Again!'][L.n-1],'#bfe6ff',14); L.phase='wait'; L.t=rand(0.9,1.8);
    }else if(L.t<=0){ MV.lk=null; setBanner('He got away!','The Lake King spat out the hook. Try again.',1.8); }
  }
}
function lakeKingCaught(){
  SFX.play('upgrade'); jingle('secret',null); flashA=0.2; flashCol='200,230,255';
  runDialogue([['narr',`You heave. The lake heaves back. Then up he comes: the Lake King, as long as a cart, with a golden fin like a crown and an expression of deep offence.`],['ash',`Hello, your majesty.`],['narr',`The Lake King looks at you for a long moment. Then he gently spits the hook into your hand and sinks back down, slowly, like a king leaving a party. Dell is going to lose his mind.`]],()=>{ scene='play'; G.flags.lakeking_caught=true; G.stats.fish=(G.stats.fish||0)+1; deed('lakeking'); questPoke(); saveGame(); });
}
// ---------- Elka's kite hoops: a flying time trial around Frostpine Lodge
const SKY_HOOPS=[[1760,3620],[2160,3520],[2560,3720],[2760,4120],[2460,4460],[1960,4520],[1460,4260],[1150,3860]];
const SKYRACE={
  start(){ return {hoops:SKY_HOOPS.map(([x,y])=>({x,y})),i:0,limit:23,music:'arena',flash:0}; },
  update(M,dt){
    const p=player, h=M.hoops[M.i];
    if(M.flash>0) M.flash-=dt;
    if(p.flying&&dist(p.x,p.y,h.x,h.y)<50){
      M.i++; M.flash=0.4; mvSnd('hoop'); p.flyE=Math.min(flyMax(),p.flyE+2.4);
      emit(h.x,h.y-60,22,{col:'255,220,120',smin:60,smax:200,lmin:.3,lmax:.6,zmin:1.5,zmax:3,drag:3});
      if(M.i>=M.hoops.length){ miniEnd(true,'All eight hoops!',`${M.t.toFixed(1)} seconds. Elka is speechless. For once.`); return; }
    }
    if(M.t>M.limit) miniEnd(false,'The sand ran out!','So close. Talk to Elka for another go.');
  },
  target:M=>M.hoops[M.i],
  hud:M=>`Sky hoops: ${M.i} of 8 · ${Math.max(0,M.limit-M.t).toFixed(1)} s of sand left`,
  draw(){}
};
// hoops float at flying height, so they are drawn after the trees (drawAirborneHook calls this)
function drawSkyHoops(M,t){
  M.hoops.forEach((h,i)=>{
    if(!inView(h.x,h.y-60,120)) return;
    const next=i===M.i, done=i<M.i, hy=h.y-60, pulse=next?0.5+0.5*Math.sin(t*6):0;
    // shadow on the ground and the kite string
    ctx.fillStyle='rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(h.x+8,h.y+6,30,12,0,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(240,236,224,.55)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(h.x+30,hy-26); ctx.quadraticCurveTo(h.x+50,h.y-20,h.x+20,h.y); ctx.stroke();
    // the kite holding it up
    ctx.save(); ctx.translate(h.x+30,hy-30+Math.sin(t*2+i)*2); ctx.rotate(0.3+Math.sin(t*1.5+i)*0.1); ctx.fillStyle=done?'#8a8a8a':['#e8586a','#4ac8e8','#f2c84a','#7ad06a'][i%4]; ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(7,0); ctx.lineTo(0,12); ctx.lineTo(-7,0); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(0,12); ctx.moveTo(-7,0); ctx.lineTo(7,0); ctx.stroke(); ctx.restore();
    // the hoop
    const col=done?'150,150,150':next?'255,214,110':'232,110,70', a=done?0.35:0.95;
    if(next){ glowAt(h.x,hy,70,'255,200,110',0.18+0.12*pulse); }
    ctx.lineWidth=next?6:4.5; ctx.strokeStyle=`rgba(40,20,10,${a*0.6})`; ctx.beginPath(); ctx.ellipse(h.x,hy+2,40,34,0,0,TAU); ctx.stroke();
    ctx.lineWidth=next?4.5:3.2; ctx.strokeStyle=`rgba(${col},${a})`; ctx.beginPath(); ctx.ellipse(h.x,hy,40,34,0,0,TAU); ctx.stroke();
    if(next){ ctx.strokeStyle=`rgba(255,250,220,${0.4+0.4*pulse})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(h.x,hy,40,34,0,0,TAU); ctx.stroke(); }
    ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.font=`800 11px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(i+1),h.x,hy-44);
  });
}
