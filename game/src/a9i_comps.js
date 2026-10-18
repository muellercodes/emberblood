// ================= companions and villagers who notice things
// One active companion (G.comp) follows Ash, fights beside him, gets knocked down instead of dying and talks in little
// speech bubbles. Pip follows too (updateFollowers in a9c_story.js asks pipExtras here for errands and chirps).
// Villagers notice what Ash has done (G.deeds), say so in bubbles, chat with each other and greet him with it.
// Nothing here is saved except G.comp, G.comps, G.deeds and a few G.flags.comp_* keys.

// ---------- a few quiet sounds of our own (SFX has no whistle, bleat or chirp); they respect the mute
const CSND={};
function csfx(name,vol){
  const ac=SFX.ac; if(!ac||SFX.muted) return;
  const now=performance.now(); if(CSND[name]&&now-CSND[name]<70) return; CSND[name]=now;
  const v=vol==null?1:vol;
  try{
    const out=ac.createGain(); out.gain.value=0.45*v; out.connect(ac.destination);
    const t0=ac.currentTime;
    const tone=(type,f0,f1,dur,vol,delay,vib)=>{ const t=t0+(delay||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
      if(vib){ const l=ac.createOscillator(), lg=ac.createGain(); l.frequency.value=vib; lg.gain.value=f0*0.07; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t+dur+0.05); }
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(name){
      case 'whistle': tone('sine',1500,2300,0.15,0.06); tone('sine',2300,1650,0.2,0.06,0.16); break;
      case 'bleat': tone('sawtooth',430,330,0.42,0.035,0,26); tone('triangle',860,660,0.4,0.02,0,26); break;
      case 'chirp': tone('sine',1700,2600,0.07,0.04); tone('sine',2000,2900,0.08,0.04,0.09); break;
      case 'pop': tone('sine',880,1250,0.05,0.018); break;
      case 'bang': tone('square',300,170,0.12,0.05); tone('triangle',900,700,0.16,0.04); break;
      case 'sling': tone('triangle',280,620,0.12,0.025); break;
      case 'bonk': tone('square',230,90,0.1,0.06); tone('triangle',660,380,0.1,0.035); break;
      case 'drip': tone('sine',1300,700,0.07,0.025); break;
      case 'up': [523,659,784].forEach((f,i)=>tone('triangle',f,f,0.12,0.04,i*0.07)); break;
    }
  }catch(e){}
}

// ---------- speech bubbles (world anchored, drawn on the HUD layer so night never hides them)
const BUB=[];
function bubble(a,text,o){
  if(!a||!text) return null; o=o||{}; text=simplify(String(text));
  for(let i=BUB.length-1;i>=0;i--) if(BUB[i].a===a) BUB.splice(i,1);
  const kind=o.kind||(/^[(*]/.test(text)?'narr':'say');
  // long enough to read (UX build): about 1.5 s plus 0.07 s a letter, 3 to 8 s; a quick sound bubble (Fweet!) stays quick
  const b={a,text,t:0,dur:o.dur&&o.dur<1.5?o.dur:Math.max(o.dur||0,readT(text,3,8)),who:o.who||'',col:o.col||null,kind,dy:o.dy!=null?o.dy:-34,ax:a.x,ay:a.y,area:!!AREA};
  BUB.push(b); while(BUB.length>7) BUB.shift();
  logBubble(a,text,o,kind);
  if(kind!=='far') csfx('pop');
  return b;
}
function updateBubbles(dt){
  for(const b of BUB){ b.t+=dt; if(b.a&&b.a.x!=null){ b.ax=b.a.x; b.ay=b.a.y; } }
  for(let i=BUB.length-1;i>=0;i--){ const b=BUB[i]; if(b.t>=b.dur||b.area!==!!AREA) BUB.splice(i,1); }
}
function bubbleOn(a){ return BUB.some(b=>b.a===a); }
function darkCol(hex){ try{ const c=mixRGB(hexRGB(hex),[38,22,12],0.42); return `rgb(${c.map(Math.round)})`; }catch(e){ return '#5a3a20'; } }
function drawBubbles(){
  if(!BUB.length||scene!=='play') return;
  ctx.save(); ctx.textBaseline='middle'; ctx.textAlign='left'; ctx.lineJoin='round';
  const maxW=W<560?138:176, placed=[];
  const list=[];
  for(const b of BUB){ const a3=b.a, up=T3.on&&a3&&a3._t3pp&&a3._t3top!=null&&b.kind!=='far'?Math.min(0,a3._t3top-a3.y+(b.dy<=-40?15:31)):0; // 3D heads are taller
    const sx=(b.ax-cam.x)*zoom, sy=(b.ay+b.dy+up-cam.y)*zoom; if(sx>-140&&sx<W+140&&sy>-60&&sy<H+80) list.push({b,sx,sy}); }
  list.sort((p,q)=>q.sy-p.sy);
  for(const q of list){
    const b=q.b, narr=b.kind==='narr', far=b.kind==='far', bang=b.kind==='bang', pipk=b.kind==='pip';
    const font=`${narr||far?'italic 600':'600'} ${far?11:12}px ${UIF}`; ctx.font=font;
    const lines=wrapText(b.text,maxW); let tw=0; for(const l of lines) tw=Math.max(tw,ctx.measureText(l).width);
    let nameW=0; if(b.who){ ctx.font=`800 9px ${UIF}`; nameW=ctx.measureText(b.who.toUpperCase()).width; }
    const nameH=b.who?11:0, padX=8, ic=bang?16:0, w=Math.ceil(Math.max(tw,nameW))+padX*2+ic, h=lines.length*15+9+nameH;
    let x=clamp(q.sx-w/2,SAFE.l+4,W-SAFE.r-w-4), y=q.sy-h-9;
    for(let g=0;g<8;g++){ let hit=null; for(const r of placed) if(x<r.x+r.w+3&&x+w+3>r.x&&y<r.y+r.h+3&&y+h+3>r.y){ hit=r; break; } if(!hit) break; y=hit.y-h-5; }
    if(y<SAFE.t+4) y=SAFE.t+4;
    placed.push({x,y,w,h});
    const pop=b.t<0.16?0.55+0.45*Math.sin(b.t/0.16*Math.PI/2):1, a=clamp(Math.min(b.t/0.1,(b.dur-b.t)/0.35),0,1);
    const tx=clamp(q.sx,x+12,x+w-12);
    ctx.save(); ctx.globalAlpha=a; ctx.translate(tx,y+h); ctx.scale(pop,pop); ctx.translate(-tx,-(y+h));
    const fill=narr?'rgba(22,15,10,.86)':far?'rgba(226,236,250,.72)':bang?'#ffeaa6':pipk?'#ffe6cc':'#fbf4e6';
    const edge=narr?'rgba(255,220,170,.35)':far?'rgba(80,100,140,.35)':bang?'#b8741a':pipk?'#d0702e':'rgba(74,44,22,.6)';
    // soft drop shadow, body, tail
    ctx.fillStyle='rgba(0,0,0,.22)'; rr(x+1.5,y+2.5,w,h,8); ctx.fill();
    ctx.fillStyle=fill; rr(x,y,w,h,8); ctx.fill(); ctx.strokeStyle=edge; ctx.lineWidth=1.3; ctx.stroke();
    if(!far){ ctx.beginPath(); ctx.moveTo(tx-6,y+h-1); ctx.lineTo(clamp(q.sx,tx-14,tx+14),Math.min(q.sy-1,y+h+9)); ctx.lineTo(tx+6,y+h-1); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); ctx.stroke();
      ctx.fillStyle=fill; ctx.fillRect(tx-5,y+h-2.5,10,2.4); }
    let ty=y+5+nameH;
    if(b.who){ ctx.font=`800 9px ${UIF}`; ctx.fillStyle=narr?(b.col||'#ffd9a0'):darkCol(b.col||'#a0603a'); ctx.fillText(b.who.toUpperCase(),x+padX+ic,y+10); }
    if(bang){ ctx.fillStyle='#e8541f'; ctx.beginPath(); ctx.arc(x+padX+5,y+h/2,7,0,TAU); ctx.fill(); ctx.font=`900 11px ${UIF}`; ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText('!',x+padX+5,y+h/2+0.5); ctx.textAlign='left'; }
    ctx.font=font; ctx.fillStyle=narr?'#f2e6d4':far?'#34445e':'#2a1a10';
    lines.forEach((l,i)=>ctx.fillText(l,x+padX+ic,ty+7+i*15));
    ctx.restore();
  }
  ctx.restore();
}

// ---------- who can come along
const CDEF={
  duchess:{name:'Duchess',spk:'goat',col:'#e8e2d0',r:11,hp:1.0,spd:240,home:'Hollis Farm',bg:'#2a2620'},
  brisket:{name:'Brisket',spk:'brisket',col:'#e0d0b0',r:12,hp:1.3,spd:225,home:'the Frostpine Lodge',bg:'#24303a'},
  juniper:{name:'Juniper',spk:'juniper',col:'#a0e0b0',r:10,hp:0.85,spd:245,home:'Emberhollow',bg:'#1c3024'},
  greymane:{name:'Greymane',spk:'greymane',col:'#cfe0f0',r:15,hp:1.7,spd:265,home:'the high pines',bg:'#1c2634'}
};
SPK.greymane=SPK.greymane||{name:'Greymane',col:'#cfe0f0'};
const qDone=id=>!!(G&&G.quests&&G.quests[id]&&G.quests[id].done);
function canRecruit(id){
  if(!G||G.mode!=='story') return false;
  if(id==='duchess') return qDone('duchess')&&G.side.duchess==='home';
  if(id==='brisket') return !!G.flags.brisket_thawed;
  if(id==='juniper') return !!G.flags.juniper_found&&qDone('hollow');
  if(id==='greymane') return G.choices.greymane==='ally'&&!!G.bossDone.greymane;
  return false;
}
const BRISKET_JOKES=[`Why did the kobold cross the road? To steal the road.`,`I used to be frozen. Now I'm just chill.`,`What's a wolf's favorite holiday? Howl-oween!`,`What did the shield say to the sword? You're sharp, but I've got your back.`,
  `Why did the slime go to school? To get a little more solid.`,`I told a joke to a frozen lake once. It was an ice-breaker.`,`Knock knock. Who's there? Ice. Ice who? Ice to meet you!`,`Why don't skeletons fight? They don't have the guts.`,
  `What do you call a bear with no teeth? A gummy bear!`,`Why did the bat get a job? It was tired of just hanging around.`,`How does a snowman get around? He rides an icicle!`,`Why do dragons sleep all day? So they can fight knights!`,
  `What do you call a sleepy bull? A bulldozer!`,`Why was the sword so tired? Long day of being pointy.`,`What's an adventurer's favorite pasta? Brave-ioli!`,`What do you call cheese that isn't yours? Nacho cheese!`];
const CLINES={
  duchess:{
    join:['Meh.','(Duchess has decided to come along. It was her idea.)'],
    hello:['Meh.','Meh?','(Duchess looks at you like you are late.)'],
    come:['Meh!','(Duchess trots over. Slowly. On purpose.)','Meeeh.'],
    stay:['(Duchess sits. She was going to sit anyway.)','Meh.'],
    down:['MEEEH!','(Duchess has fainted. Dramatically.)'],
    up:['MEH!','(Duchess gets up and pretends that never happened.)'],
    charge:['MEH!','MEEEH!'],
    kill:['Meh.','(Duchess looks very pleased with herself.)'],
    idle:['Meh.','(Duchess is judging a tree.)','(Duchess eats a flower. Then another one.)','Meh?','(Duchess sniffs your tail. Rude.)','(Duchess stares at a cloud until it leaves.)'],
    low:['Meh...'], lowAsh:['(Duchess looks worried. For a goat.)','Meh?'],
    boss:['(Duchess lowers her horns. She has opinions about this.)'],
    bye:['Meh.','(Duchess walks home without looking back. Classic Duchess.)'],
    cave:['(Duchess does not like caves. She tells you with her eyes.)'],
    region:['Meh.','(Duchess approves. Barely.)'],
    cheer:['MEH! MEH!','(Duchess headbutts you gently. You feel better!)'],
    whistleDown:['(Duchess heard you. She is lying down. She is ignoring you.)'],
    eat:['Nom.','(crunch crunch)','Nom nom.'], spit:['Ptoo!','(Duchess spits out some coins. Ew. Thanks?)'],
    rain:['(Duchess hates rain. She blames you.)'], night:['(Duchess yawns. Even her yawn is rude.)']
  },
  brisket:{
    join:[`Brisket the Bold, at your service! Well. Brisket the Slightly Damp.`,`Adventure! Real adventure! Lead the way, Ash!`],
    hello:[`What's the plan, boss?`,`Brisket here! Still warm!`],
    come:[`Coming! My boots are still squishy!`,`Right behind you!`,`On my way!`],
    stay:[`I'll guard this spot. With my life. Or at least my lunch.`,`Waiting right here!`],
    down:[`Oof! I'll just... lie here a moment.`,`Seeing stars! Pretty ones!`,`I meant to do that!`],
    up:[`Back on my feet! Where was I?`,`Brisket the Bold returns!`,`That was a nap. A tactical nap.`],
    taunt:[`Over here, you lumps!`,`Hey! Yes, you! Hit my shield!`,`Come and get some Brisket!`,`My shield is lonely! Visit it!`,`Is that all you've got? My granny hits harder!`],
    kill:[`Ha! Take that!`,`Another one for the song!`,`Brisket, one. Bad guys, zero.`],
    idle:BRISKET_JOKES,
    low:[S(`Ow! Nothing broken! Probably!`,`Ow! I'm okay!`)], lowAsh:[`Ash! Drink something!`,`You're hurt! I'll cover you!`],
    boss:[`That's a big one. I'll hold the shield, you do the hero part.`,`Whoa. Okay. Big. Very big.`],
    bye:[`Off to the lodge! Call me if you need a shield!`,`Back to being warm! See you, Ash!`],
    cave:[`Caves! Cold, dark and full of bats. Feels like home.`,`Ooh, echoes! HELLO! ...hello... hello...`],
    house:[`Wipe your feet, Brisket. Wipe your feet.`,`Nice place! Is there soup?`],
    region:[`New place! Smells like adventure. And a bit like socks.`,`I've been here before! I think. Everything looks different when you're not frozen.`],
    cheer:[`You've got this, Ash!`,`Go, Ash, go!`,`That's my hero!`],
    night:[`Night time. Perfect for jokes. Want one? Too late.`], rain:[`Rain! At least it isn't snow.`],
    whistleDown:[`Give me a second! Still seeing stars!`]
  },
  juniper:{
    join:[`Let's go! I'll map everything. Even the boring bits.`,`Adventure time! Rook is going to be SO jealous.`],
    hello:[`Hi, Ash! Want to see my map? It's mostly bats.`,`What's up? I'm drawing you right now. Hold still.`],
    come:[`Coming! Don't step on my map!`,`Right here!`,`Wait for me!`],
    stay:[`I'll wait here and draw this rock. It's a good rock.`,`Okay! I'll map this spot. Very carefully.`],
    down:[`Ow! Okay. I'm drawing a map of the sky now.`,`Ugh! My pencil!`],
    up:[`I'm up! I didn't even drop the map!`,`Okay, okay. Where was I? Oh. Fighting.`],
    point:[`Ooh! Something over there!`,`Ash! Look! Over there!`,`That's not on my map yet!`,`I see something shiny!`],
    kill:[`Bullseye!`,`Sling, one. Kobolds, zero.`,`Did you see that? Tell Rook!`],
    idle:[`I'm calling this spot "Ash Was Here".`,`Rook would love this. Don't tell him.`,S(`I've drawn nine hundred trees on this map. My hand hurts.`,`I drew so many trees. My hand hurts.`),`Hold still, I'm drawing you. Okay, you can move.`,`Every map needs a dragon on it. Now mine has a real one.`],
    low:[S(`Ow! I'm okay. The map's okay too.`,`Ow! I'm okay. So is my map.`)], lowAsh:[`Ash, you're hurt! Drink a draught!`,`Ash! Careful!`],
    boss:[`Okay, that one is NOT going on my map. Too scary.`,`That's the biggest thing I've ever seen. Draw fast, Juniper.`],
    bye:[`See you, Ash! I'll be at home, finishing the map!`,`Bye! Come get me for the next adventure!`],
    cave:[`Caves are my favorite! This time I brought two lanterns.`,`Bats. It's always bats.`],
    house:[`Ooh, nice house! Can I draw the furniture?`],
    region:[`New place! Drawing it now!`,`Ooh, this bit is empty on my map!`],
    cheer:[`Go, Ash! You're amazing!`,`You can do it!`],
    night:[`My lantern's on. Stay close.`], rain:[`My map! Hold on, I've got a cover!`],
    whistleDown:[`One second! The ground is spinning!`]
  },
  greymane:{
    join:['AWOOOO!'], hello:['*huff*','*Greymane sniffs your face*'],
    come:['*bounds over*','Rrruff!','*trots to your side*'],
    stay:['*sits. Very good boy.*','*lies down and watches*'],
    down:['*whimper*','*flops over in the snow*'],
    up:['*shakes off the hit* AWOO!','Grrr!'],
    howl:['AWOOOOO!','AWOO-OOO!'], kill:['Grrr!','*happy growl*'],
    idle:['*sniffs the air*','*wag wag*','*huff*','*Greymane watches a bird. The bird leaves.*'],
    low:['*growls*'], lowAsh:['*whines and nudges you*'],
    boss:['*Greymane bares his teeth. GRRRR.*'],
    bye:['*Greymane licks your face and lopes off toward the pines*'],
    cave:['*sniff sniff*'], house:['*Greymane knocks over a chair with his tail. Oops.*'],
    region:['*sniffs*'], cheer:['AWOO! *you feel braver*'], whistleDown:['*whimper*'],
    rain:['*shakes. You are now very wet.*'], night:['*his eyes glow blue in the dark*']
  }
};
function pickC(id,kind){ const L=(CLINES[id]&&CLINES[id][kind])||(CLINES[id]&&CLINES[id].idle)||['...']; return pick(L); }

// ---------- runtime state (rebuilt from G.comp whenever needed)
let CM=null, CMG=null, CSPAWN=null, COMP_INP=null, COMP_TAP=false;
const CLEAVE=[], CSTONES=[], CFX=[], TRAIL=[];
const CF={pointed:{},bT:0,howlT:30,lastRegion:'',bossSaid:null,flyDeed:false,g:null,whistleT:-9,whistleOne:false,prevMode:'follow',lowAshT:0};
const MELT={p:0,last:0,said:0,need:4.4};
// remember this frame's input so the whistle (key G, pad, touch) reaches us without touching other modules
{ const base=readInput; readInput=function(dt){ const o=base(dt); COMP_INP=o; return o; }; }
function compRT(){
  if(!G||G.mode!=='story'||!G.comp||!CDEF[G.comp]||!player){ CM=null; return null; }
  if(CM&&CM.id===G.comp&&CMG===G) return CM;
  const id=G.comp, d=CDEF[id];
  let s=CSPAWN&&CSPAWN.id===id?CSPAWN:null; CSPAWN=null;
  if(!s||!freeSpot(s.x,s.y,12)) s=compSpotNear(s?s.x:player.x,s?s.y:player.y,player.facing+Math.PI);
  CM={id,x:s.x,y:s.y,r:d.r,face:player.facing,t:rand(0,9),hp:1,maxHp:1,k:1,down:0,downMax:12,mode:'follow',sx:s.x,sy:s.y,cd:1,cd2:0,act:null,actT:0,dir:0,hitSet:null,
    tgt:null,stuckT:0,chkT:0.5,cx:s.x,cy:s.y,trailI:-1,dx:0,dy:0,kvx:0,kvy:0,strafe:Math.random()<0.5?-1:1,side:(id==='juniper'||id==='duchess')?-1:1,
    iframes:0,flash:0,callT:0,tauntCd:3,howlCd:2,cheerCd:rand(10,16),idleCd:rand(25,40),pointCd:5,eatCd:rand(18,30),eat:null,spit:0,fogT:0,still:0,lpx:player.x,lpy:player.y,
    outside:false,hidden:false,moving:false,vis:{id,kind:id,t:0},lastSay:-9,lowSaid:false,point:null,region:null,npc:null};
  compStats(true); CMG=G; return CM;
}
function compStats(full){ const lv=player.level||1, d=CDEF[CM.id], mx=Math.round((70+12*lv)*d.hp); if(full) CM.hp=mx; else if(mx!==CM.maxHp&&CM.maxHp>0) CM.hp=CM.hp*mx/CM.maxHp; CM.maxHp=mx; CM.k=1+0.17*(lv-1); }
function compSpotNear(x,y,ang){
  ang=ang==null?rand(0,TAU):ang;
  for(const r of [46,66,92,30,124,160]) for(const o of [0,0.6,-0.6,1.2,-1.2,1.9,-1.9,2.6,-2.6,Math.PI]){ const a=ang+o, px=x+Math.cos(a)*r, py=y+Math.sin(a)*r; if(freeSpot(px,py,14)) return {x:px,y:py}; }
  return {x,y:y+18};
}
function compSay(c,kind,force){
  if(!c||c.hidden||c.outside) return null;
  if(!force&&G.time-c.lastSay<5) return null;
  c.lastSay=G.time; const d=CDEF[c.id];
  const t=pickC(c.id,kind);
  if(c.id==='duchess'&&!/^\(/.test(t)) csfx('bleat',0.8);
  return bubble(c,t,{who:d.name,col:d.col,dy:c.id==='greymane'?-40:-34});
}
function cpuff(x,y,n){ emit(x,y,n||14,{col:'230,225,215',glow:false,smin:30,smax:110,lmin:.35,lmax:.7,zmin:3,zmax:6,grow:6}); }
// swap and goodbye
function recruitComp(id,at){
  if(!CDEF[id]||!G) return;
  const old=G.comp&&G.comp!==id?G.comp:null;
  if(old) compSendHome(old,true);
  G.comp=id; G.comps=G.comps||{}; const r=Object.assign({n:0},typeof G.comps[id]==='object'?G.comps[id]:{}); r.n++; r.at=Math.round(G.worldTime||0); G.comps[id]=r;
  CSPAWN=at?{id,x:at.x,y:at.y}:null; CM=null;
  if(id==='duchess') G.goat=null;
  compFilterNPCs(); const c=compRT(); deed('comp_'+id);
  if(c){ c.lastSay=-9; cpuff(c.x,c.y,8); }
  later(0.5,()=>{ if(CM&&CM.id===id) compSay(CM,'join',true); });
  setBanner(`${CDEF[id].name} joined you!`,usingTouch?'Tap their picture to call them. Tap twice to make them wait.':'Press G to call them. Press G twice to make them wait.',3);
  saveGame();
}
function compSendHome(id,swap){
  if(!G||G.comp!==id) return;
  const c=CM&&CM.id===id?CM:null;
  if(c) for(let i=BUB.length-1;i>=0;i--) if(BUB[i].a===c) BUB.splice(i,1);
  if(c&&!c.outside&&!c.hidden){ const L={id,x:c.x,y:c.y,face:angTo(player.x,player.y,c.x,c.y),t:0,vis:c.vis,r:c.r,moving:true}; CLEAVE.push(L); bubble(L,pickC(id,'bye'),{who:CDEF[id].name,col:CDEF[id].col}); }
  G.comp=null; CM=null;
  if(id==='duchess') placeGoat();
  setupNPCs();
  if(!swap) setBanner(`${CDEF[id].name} went home`,`Find them at ${CDEF[id].home} to ask again.`,2.4);
  saveGame();
}
function compFilterNPCs(){
  const id=G&&G.comp; if(!id||id==='duchess'||id==='greymane') return;
  if(G.npcs.some(n=>n.id===id)) G.npcs=G.npcs.filter(n=>n.id!==id);
  if(AREA&&AREA.npcs.some(n=>n.id===id)) AREA.npcs=AREA.npcs.filter(n=>n.id!==id);
}

// ---------- the trail Ash leaves (companions walk it when the straight way is blocked)
function recordTrail(){
  const p=player; if(airborne()||p.onWater||p.dead) return;
  const L=TRAIL[TRAIL.length-1];
  if(!L||dist2(L.x,L.y,p.x,p.y)>24*24){ if(blockedAt(p.x,p.y)) return; TRAIL.push({x:p.x,y:p.y}); if(TRAIL.length>60){ TRAIL.shift(); if(CM&&CM.trailI>0) CM.trailI--; } }
}
function trailNext(c){
  if(!TRAIL.length) return null;
  if(c.trailI<0||c.trailI>=TRAIL.length){ let bi=-1,bd=300*300; for(let i=0;i<TRAIL.length;i++){ const d2=dist2(c.x,c.y,TRAIL[i].x,TRAIL[i].y); if(d2<bd){ bd=d2; bi=i; } } if(bi<0) return null; c.trailI=bi; }
  let tp=TRAIL[c.trailI]; if(dist(c.x,c.y,tp.x,tp.y)<20){ c.trailI++; if(c.trailI>=TRAIL.length){ c.trailI=-1; return null; } tp=TRAIL[c.trailI]; }
  return tp;
}

// ---------- the main update (simUpdate calls this every frame in play)
function updateComps(dt){
  if(!G||!player) return;
  if(CF.g!==G){ CF.g=G; BUB.length=0; CLEAVE.length=0; CSTONES.length=0; CFX.length=0; TRAIL.length=0; CF.pointed={}; MELT.p=0; MELT.last=0; MELT.said=0; CF.bossSaid=null; }
  if(G.mode!=='story') return;
  const tap=COMP_TAP; COMP_TAP=false;
  const wh=!!((COMP_INP&&COMP_INP.whistle)||tap); if(COMP_INP) COMP_INP.whistle=false;
  updateBubbles(dt);
  recordTrail();
  if(G.comp&&!canKeep(G.comp)){ G.comp=null; CM=null; }
  const c=compRT();
  compFilterNPCs();
  if(G.comp==='duchess'&&G.goat) G.goat=null;
  updateThaw(dt);
  greyWorld(dt);
  compFx(dt);
  compEnemyFx(dt);
  if(wh) compWhistle();
  if(c){
    compStats(false);
    // Greymane runs in as the battle ally at the summit; the companion steps aside so there is only one of him
    const ally=G.allies&&G.allies.find(a=>a.k==='grey');
    if(c.id==='greymane'&&ally){ if(!c.hidden){ c.hidden=true; ally.x=c.x; ally.y=c.y; } }
    else if(c.hidden){ c.hidden=false; compBlink(c,false); }
    if(c.outside&&!AREA) c.outside=false;
    if(!c.hidden&&!c.outside) compUpdate(c,dt);
  }
  compPrompts();
  compFollowUps(dt);
}
function canKeep(id){ if(id==='greymane') return G.choices.greymane==='ally'; return !!CDEF[id]; }
function foeOK(e){ return e&&!e.dead&&!e.frozen&&!e.invuln&&!(e.spawnIn>0)&&e.alpha>=0.5&&!e.passive&&e.type!=='sneak'&&!(e.type==='vorlaxis'&&e.noClip); }
function countFoes(x,y,r){ let n=0; for(const e of G.enemies) if(foeOK(e)&&e.aggro&&dist2(e.x,e.y,x,y)<r*r) n++; return n; }
function lineClear(x0,y0,x1,y1){
  const d=dist(x0,y0,x1,y1), n=Math.floor(d/22);
  for(let i=1;i<n;i++){ const k=i/n, x=lerp(x0,x1,k), y=lerp(y0,y1,k); if(colAt(x,y,3)) return false; if(AREA&&AREA.kind==='cave'&&areaBlocked(x,y)) return false; }
  return true;
}
function compUpdate(c,dt){
  const p=player; c.t+=dt; c.vis.t=c.t; c.cd-=dt; c.cd2-=dt; c.iframes-=dt; c.flash-=dt; c.callT-=dt; c.tauntCd-=dt; c.howlCd-=dt; c.idleCd-=dt; c.pointCd-=dt; c.eatCd-=dt; c.cheerCd-=dt;
  const pm=dist(p.x,p.y,c.lpx,c.lpy); c.still=pm<0.5?c.still+dt:0; c.lpx=p.x; c.lpy=p.y;
  const ox=c.x, oy=c.y; c.dx=c.dy=0;
  if(c.down>0){
    const near=dist(c.x,c.y,p.x,p.y)<70; c.down-=dt*(near?2:1);
    if(c.down<=0) compGetUp(c);
    compPhys(c,dt,ox,oy); return;
  }
  compHurtCheck(c,dt);
  if(c.down>0){ compPhys(c,dt,ox,oy); return; }
  if(!G.inCombat) c.hp=Math.min(c.maxHp,c.hp+c.maxHp*0.06*dt);
  if(c.hp>c.maxHp*0.5) c.lowSaid=false;
  const busy=compAct(c,dt);
  if(!busy){
    const tg=compPickTarget(c); if(tg!==c.tgt&&tg&&tg.boss&&CF.bossSaid!==tg){ CF.bossSaid=tg; compSay(c,'boss',true); } c.tgt=tg;
    if(tg&&c.callT<=0) compFight(c,tg,dt); else compFollow(c,dt);
    compIdle(c,dt);
  }
  compDodge(c,dt);
  // keep from standing inside foes
  for(const e of G.enemies){ if(e.dead||e.frozen||e.flying||e.noClip) continue; const d=dist(c.x,c.y,e.x,e.y), m=c.r+e.r-2; if(d<m&&d>0.01){ c.x=e.x+(c.x-e.x)/d*m; c.y=e.y+(c.y-e.y)/d*m; } }
  compPhys(c,dt,ox,oy);
  // stuck check (used by the follower to switch to Ash's trail, then to hop over)
  c.chkT-=dt; if(c.chkT<=0){ c.chkT=0.5; const mv=dist(c.x,c.y,c.cx,c.cy), far=dist(c.x,c.y,p.x,p.y)>120&&c.mode!=='stay'; c.cx=c.x; c.cy=c.y; if(mv<14&&far&&!c.act) c.stuckT+=0.5; else if(mv>30) c.stuckT=Math.max(0,c.stuckT-1); }
  // rally: a cheer now and then that heals Ash a little
  if(hasSkill('rally')&&G.inCombat&&c.cheerCd<=0&&!p.dead){ c.cheerCd=rand(16,24); if(p.hp<p.maxHp*0.92){ heal(p.maxHp*0.06); compSay(c,'cheer',true); emit(p.x,p.y,14,{col:'140,255,150',ang:-Math.PI/2,spread:1.2,smin:30,smax:110,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:16}); csfx('up'); } }
  if(p.hp<p.maxHp*0.3&&!p.dead&&G.time>CF.lowAshT){ CF.lowAshT=G.time+30; compSay(c,'lowAsh',true); }
}
function compPhys(c,dt,ox,oy){
  const kd=Math.exp(-dt*7); c.kvx*=kd; c.kvy*=kd;
  c.x+=(c.dx+c.kvx)*dt; c.y+=(c.dy+c.kvy)*dt;
  c.hitWall=false; collideObs(c); boundE(c); terrainFix(c,ox,oy);
  const p=player, d=dist(c.x,c.y,p.x,p.y), m=c.r+p.r-3;
  if(d<m&&d>0.01&&!airborne()&&c.down<=0){ const bx=c.x, by=c.y; c.x=p.x+(c.x-p.x)/d*m; c.y=p.y+(c.y-p.y)/d*m; if(blockedAt(c.x,c.y)||colAt(c.x,c.y,c.r*0.6)){ c.x=bx; c.y=by; } }
  const sp=Math.hypot(c.x-ox,c.y-oy)/Math.max(dt,0.001); c.moving=sp>18; c.speedNow=sp;
  if(Math.hypot(c.dx,c.dy)>8&&!c.act&&c.down<=0) c.face=turnTo(c.face,Math.atan2(c.dy,c.dx),10*dt);
}
function compGo(c,tx,ty,spd){ c.flying=false; steer(c,tx,ty,spd); }
function compBlink(c,fx){ const p=player, s=compSpotNear(p.x,p.y,p.facing+Math.PI); if(fx) cpuff(c.x,c.y); c.x=s.x; c.y=s.y; c.cx=c.x; c.cy=c.y; c.stuckT=0; c.trailI=-1; c.kvx=c.kvy=0; if(fx) cpuff(c.x,c.y); }
function compFollow(c,dt){
  const p=player, d=dist(c.x,c.y,p.x,p.y), sp0=CDEF[c.id].spd;
  if(c.mode==='stay'){ const ds=dist(c.x,c.y,c.sx,c.sy); if(ds>14) compGo(c,c.sx,c.sy,sp0*0.9); else c.face=turnTo(c.face,angTo(c.x,c.y,p.x,p.y),3*dt); return; }
  const ground=!airborne()&&!p.onWater&&!blockedAt(p.x,p.y);
  if(ground&&(d>720||(c.stuckT>2.6&&d>140))){ compBlink(c,true); return; }
  const back=p.facing+Math.PI+c.side*0.75, fx=p.x+Math.cos(back)*52, fy=p.y+Math.sin(back)*52;
  if(d<(c.callT>0?46:80)&&c.stuckT<1){ c.trailI=-1; if(c.still>0.6) c.face=turnTo(c.face,angTo(c.x,c.y,p.x,p.y),2.5*dt); else c.face=turnTo(c.face,p.facing,2*dt); return; }
  let tx=fx, ty=fy;
  if(c.trailI>=0||c.stuckT>0.6){ const tp=trailNext(c); if(tp){ tx=tp.x; ty=tp.y; } }
  else if(!lineClear(c.x,c.y,fx,fy)){ const tp=trailNext(c); if(tp){ tx=tp.x; ty=tp.y; } }
  let sp=sp0; if(d>200) sp*=1.45; if(p.sprinting) sp*=1.3; if(c.callT>0) sp*=1.5;
  compGo(c,tx,ty,Math.min(sp,d*3+60));
}
function compPickTarget(c){
  if(G.mini&&G.mini.kind==='chase') return null;
  const p=player, stay=c.mode==='stay', ax=stay?c.sx:p.x, ay=stay?c.sy:p.y, R=stay?240:360;
  let best=null, bs=1e9;
  for(const e of G.enemies){
    if(!foeOK(e)||!e.aggro) continue;
    const da=dist(e.x,e.y,ax,ay); if(da>R+e.r) continue;
    const dc=dist(e.x,e.y,c.x,c.y); let s=dc*0.55+da*0.45; if(e===c.tgt) s-=70; if(e.boss) s+=50; if(e.flying&&c.id!=='juniper') s+=40;
    if(s<bs){ bs=s; best=e; }
  }
  return best;
}
// hits that never take the last bit of a boss (the final blow belongs to Ash)
function compHit(e,amt,o){
  if(!foeOK(e)) return 0;
  if(e.boss){ amt*=0.5; const floor=Math.max(1,e.maxHp*0.04); if(e.hp-amt<floor) amt=e.hp-floor; if(amt<=0.5) return 0; }
  const roar=player.roar, a=damageEnemy(e,amt,Object.assign({src:'comp',fx:CM?CM.x:player.x,fy:CM?CM.y:player.y},o||{}));
  player.roar=roar+(player.roar-roar)*0.5;
  if(e.dead&&CM&&Math.random()<0.25) compSay(CM,'kill');
  return a;
}
function hitSpark(x,y,col){ emit(x,y,8,{col:col||'255,240,210',smin:60,smax:200,lmin:.12,lmax:.3,zmin:1.5,zmax:3,drag:5}); }
function compFight(c,e,dt){
  const d=dist(c.x,c.y,e.x,e.y), a=angTo(c.x,c.y,e.x,e.y), sp=CDEF[c.id].spd, p=player;
  if(c.mode!=='stay'&&dist(c.x,c.y,p.x,p.y)>460){ compFollow(c,dt); return; }
  switch(c.id){
    case 'brisket': {
      const reach=e.r+c.r+12;
      if(d>reach) compGo(c,e.x-Math.cos(a)*(reach-6),e.y-Math.sin(a)*(reach-6),sp*1.1);
      c.face=turnTo(c.face,a,8*dt);
      if(d<reach+8&&c.cd<=0){ c.act='swing'; c.actT=0.3; c.hitSet=new Set(); c.cd=0.85; c.dir=a; }
      if(c.tauntCd<=0&&countFoes(p.x,p.y,280)>=2){ c.tauntCd=rand(10,13); compTaunt(c); }
      break; }
    case 'juniper': {
      const far=320, near=110;
      if(d>far) compGo(c,e.x,e.y,sp);
      else if(d<near) compGo(c,c.x-Math.cos(a)*90,c.y-Math.sin(a)*90,sp*0.95);
      else { const sa=a+Math.PI/2*c.side, tx=p.x+Math.cos(sa)*58, ty=p.y+Math.sin(sa)*58; if(dist(c.x,c.y,tx,ty)>30) compGo(c,tx,ty,sp*0.7); }
      c.face=turnTo(c.face,a,9*dt);
      if(d<far+30&&c.cd<=0&&lineClear(c.x,c.y,e.x,e.y)){ c.act='sling'; c.actT=0.34; c.cd=1.15; c.tgtE=e; c.dir=a; }
      break; }
    case 'duchess': {
      c.face=turnTo(c.face,a,7*dt);
      if(c.cd<=0&&d>60&&d<250&&lineClear(c.x,c.y,e.x,e.y)){ c.act='wind'; c.actT=0.45; c.dir=a; c.cd=3.4; c.hitSet=new Set(); csfx('bleat'); if(Math.random()<0.4) compSay(c,'charge'); break; }
      const reach=e.r+c.r+6;
      if(d>reach) compGo(c,e.x-Math.cos(a)*reach,e.y-Math.sin(a)*reach,sp);
      else if(c.cd2<=0){ c.cd2=1.1; compHit(e,6*c.k,{kb:220,ka:a}); hitSpark(e.x-Math.cos(a)*e.r,e.y-Math.sin(a)*e.r); csfx('bonk'); c.butt=0.2; }
      break; }
    case 'greymane': {
      const reach=e.r+c.r+16;
      c.face=turnTo(c.face,a,9*dt);
      if(d>reach) compGo(c,e.x-Math.cos(a)*(reach-4),e.y-Math.sin(a)*(reach-4),sp*1.15);
      if(d<reach+46&&c.cd<=0){ c.act='lunge'; c.actT=0.24; c.dir=a; c.cd=1.25; c.hitSet=new Set(); }
      if(c.howlCd<=0&&countFoes(c.x,c.y,320)>=2){ c.howlCd=rand(13,16); compHowl(c); }
      break; }
  }
}
function compAct(c,dt){
  if(!c.act) return false;
  c.actT-=dt;
  switch(c.act){
    case 'swing': c.face=c.dir;
      if(c.actT<0.17&&c.hitSet){ let n=0; for(const e of G.enemies){ if(!foeOK(e)||c.hitSet.has(e)) continue; if(!inArcC(c.x,c.y,c.dir,c.r+36,1.05,{x:e.x,y:e.y,r:e.r})) continue; c.hitSet.add(e); compHit(e,10*c.k,{kb:190,ka:c.dir}); hitSpark(e.x,e.y); n++; } if(n) SFX.play('hit',0.6); SFX.play('slash',0.5); c.hitSet=null; }
      break;
    case 'sling': c.face=c.dir; if(c.actT<=0&&c.tgtE){ throwStone(c,c.tgtE); c.tgtE=null; } break;
    case 'wind': c.face=c.dir; if(Math.random()<0.4) emit(c.x-Math.cos(c.dir)*10,c.y-Math.sin(c.dir)*10,1,{col:'170,150,120',glow:false,smin:10,smax:40,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:5});
      if(c.actT<=0){ c.act='charge'; c.actT=0.5; return true; } break;
    case 'charge': c.dx=Math.cos(c.dir)*500; c.dy=Math.sin(c.dir)*500; c.face=c.dir;
      if(Math.random()<0.7) emit(c.x-Math.cos(c.dir)*12,c.y-Math.sin(c.dir)*12,1,{col:'180,160,130',glow:false,smin:10,smax:50,lmin:.3,lmax:.6,zmin:3,zmax:6,grow:6});
      for(const e of G.enemies){ if(!foeOK(e)||c.hitSet.has(e)) continue; if(dist(c.x,c.y,e.x,e.y)<c.r+e.r+6){ c.hitSet.add(e); compHit(e,15*c.k,{kb:440,ka:c.dir}); if(!e.boss) stunEnemy(e,0.9); hitSpark(e.x,e.y,'255,230,160'); csfx('bonk'); shake(3); ftext(e.x,e.y-e.r-8,'BONK','#fff2c0',13); } }
      if(c.hitWall&&c.actT<0.42) c.actT=0;
      break;
    case 'lunge': c.dx=Math.cos(c.dir)*430; c.dy=Math.sin(c.dir)*430; c.face=c.dir;
      for(const e of G.enemies){ if(!foeOK(e)||c.hitSet.has(e)) continue; if(dist(c.x,c.y,e.x,e.y)<c.r+e.r+10){ c.hitSet.add(e); compHit(e,15*c.k,{kb:230,ka:c.dir}); hitSpark(e.x,e.y,'220,240,255'); SFX.play('hit',0.7); c.actT=Math.min(c.actT,0.04); c.snap=0.18; } }
      break;
    case 'recover': break;
  }
  if(c.actT<=0){ const was=c.act; c.act=(was==='charge'||was==='lunge')?'recover':null; if(c.act) c.actT=was==='charge'?0.4:0.28; }
  return true;
}
function throwStone(c,e){
  const sp=520, d=dist(c.x,c.y,e.x,e.y), t=d/sp, tx=e.x+(e.dx||0)*t*0.7, ty=e.y+(e.dy||0)*t*0.7, a=angTo(c.x,c.y,tx,ty);
  CSTONES.push({x:c.x+Math.cos(a)*10,y:c.y+Math.sin(a)*10,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:Math.min(1,t*1.4+0.12),t:0,T:Math.max(0.12,t),dmg:9*c.k,area:!!AREA});
  csfx('sling');
}
function compTaunt(c){
  compSay(c,'taunt',true); csfx('bang'); SFX.play('block');
  CFX.push({k:'ring',x:c.x,y:c.y,t:0,dur:0.5,r0:12,r1:150,col:'255,220,150',w:4});
  for(const e of G.enemies){ if(!foeOK(e)||!e.aggro||e.boss) continue; if(dist(e.x,e.y,c.x,c.y)>260) continue; e._ctaunt=G.time+3.6; e._cpx=e.x; e._cpy=e.y; const a=angTo(e.x,e.y,c.x,c.y); e.vx+=Math.cos(a)*240*e.kbRes; e.vy+=Math.sin(a)*240*e.kbRes; ftext(e.x,e.y-e.r-10,'!','#ffd27a',15); }
}
function compHowl(c){
  SFX.play('howl'); compSay(c,'howl',true); c.howlT=0.9;
  for(let i=0;i<3;i++) CFX.push({k:'ring',x:c.x,y:c.y,t:-i*0.16,dur:0.8,r0:20,r1:320,col:'190,225,255',w:5});
  for(const e of G.enemies){ if(!foeOK(e)) continue; if(dist(e.x,e.y,c.x,c.y)>330) continue; e._cslow=G.time+(e.boss?2.5:4.5); e._spx=e.x; e._spy=e.y; }
}
// taunted foes walk at Brisket instead of Ash; howled-at foes move at half speed
function compEnemyFx(dt){
  const b=CM&&CM.id==='brisket'&&CM.down<=0&&!CM.hidden&&!CM.outside?CM:null;
  for(const e of G.enemies){
    if(e.dead) continue;
    if(e._ctaunt){
      if(e._ctaunt>G.time&&b&&!e.frozen&&e._cpx!=null){
        const ox=e.x, oy=e.y, d=dist(e._cpx,e._cpy,b.x,b.y), m=e.r+b.r+6, a=angTo(e._cpx,e._cpy,b.x,b.y);
        let nx=e._cpx+e.vx*dt, ny=e._cpy+e.vy*dt; if(d>m){ const s=Math.min(d-m,e.speed*0.9*dt); nx+=Math.cos(a)*s; ny+=Math.sin(a)*s; }
        e.x=lerp(e.x,nx,0.85); e.y=lerp(e.y,ny,0.85); e.face=turnTo(e.face,a,6*dt);
        if(!e.flying) collideObs(e); terrainFix(e,e._cpx,e._cpy); if(blockedAt(e.x,e.y)){ e.x=ox; e.y=oy; }
      } else if(e._ctaunt<=G.time||!b) e._ctaunt=0;
      e._cpx=e.x; e._cpy=e.y;
    }
    if(e._cslow){
      if(e._cslow>G.time&&e._spx!=null&&!e.frozen){ const k=e.boss?0.75:0.5; e.x=e._spx+(e.x-e._spx)*k; e.y=e._spy+(e.y-e._spy)*k; if(Math.random()<0.15) emit(e.x+rand(-e.r,e.r),e.y+rand(-e.r,e.r),1,{col:'200,230,255',glow:false,smin:5,smax:25,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:10}); }
      else if(e._cslow<=G.time) e._cslow=0;
      e._spx=e.x; e._spy=e.y;
    }
  }
}
// ---------- getting hurt and knocked down
function teleHits(e,T,c,pad){
  const r=c.r*0.7+(pad||0);
  if(T.shape==='circle') return dist(e.x,e.y,c.x,c.y)<T.r+r;
  if(T.shape==='donut'){ const d=dist(e.x,e.y,c.x,c.y); return d>T.r1-r&&d<T.r2+r; }
  if(T.shape==='line'){ const a=e.face, dx=c.x-e.x, dy=c.y-e.y, lx=dx*Math.cos(a)+dy*Math.sin(a), ly=-dx*Math.sin(a)+dy*Math.cos(a); return lx>-r&&lx<T.len+r&&Math.abs(ly)<T.w/2+r; }
  if(T.shape==='arc'||T.shape==='cone'){ let ox=e.x,oy=e.y,ang=e.face; if(T.mouth){ ox=e.mouthX; oy=e.mouthY; ang=e.face+e.headRel; } else if(T.shape==='cone'){ ox=e.x+Math.cos(ang)*e.r; oy=e.y+Math.sin(ang)*e.r; } return inArcC(ox,oy,ang,T.r||T.len||60,T.half||0.5,{x:c.x,y:c.y,r}); }
  return false;
}
function compHurtCheck(c,dt){
  for(const e of G.enemies){
    if(e.dead||e.frozen||!e.aggro||e.spawnIn>0||e.alpha<0.5||e.passive||e.type==='sneak'||e.type==='egg'||!(e.dmg>0)) continue;
    const d=dist(e.x,e.y,c.x,c.y), m=e.r+c.r;
    if(d<m+8&&!e.flying){ e._chit=(e._chit||0)+dt*(e._ctaunt>G.time?1.3:1); if(e._chit>=(e.boss?1.6:1.25)){ e._chit=0; compHurt(c,e.dmg*(e.boss?0.5:0.6),e.x,e.y); } }
    else if(d<m+8&&e.flying){ e._chit=(e._chit||0)+dt*0.7; if(e._chit>=1.4){ e._chit=0; compHurt(c,e.dmg*0.5,e.x,e.y); } }
    else if(e._chit>0) e._chit=Math.max(0,e._chit-dt*0.5);
    const T=e.tele; if(T&&!T._ch&&T.t>T.dur*0.85&&teleHits(e,T,c)){ T._ch=true; compHurt(c,e.dmg*0.9,e.x,e.y); }
    if(c.down>0) return;
  }
  for(const pr of G.projectiles){ if(pr.dead||pr.owner!=='enemy') continue; if(dist2(pr.x,pr.y,c.x,c.y)<(pr.r+c.r*0.8)**2){ pr.dead=true; smallBoom(pr.x,pr.y); compHurt(c,pr.dmg*0.8,pr.x,pr.y); if(c.down>0) return; } }
  for(const h of G.hazards){ if(h.kind!=='blast'||h._ch) continue; if(h.t>h.delay*0.9&&dist(h.x,h.y,c.x,c.y)<h.r+c.r*0.5){ h._ch=true; compHurt(c,(h.dmg||10)*0.8,h.x,h.y); if(c.down>0) return; } }
}
function compDodge(c,dt){
  if(c.act==='charge'||c.act==='lunge'||c.down>0) return;
  for(const e of G.enemies){
    const T=e.tele; if(!T||e.dead||e.frozen||T.t>T.dur*0.85) continue;
    if(T._dodge===undefined) T._dodge=Math.random()<0.7;
    if(!T._dodge||!teleHits(e,T,c,10)) continue;
    let a;
    if(T.shape==='line'){ const s=Math.sign(-(c.x-e.x)*Math.sin(e.face)+(c.y-e.y)*Math.cos(e.face))||1; a=e.face+s*Math.PI/2; }
    else if(T.shape==='donut'){ const d=dist(e.x,e.y,c.x,c.y); a=angTo(e.x,e.y,c.x,c.y)+(d<(T.r1+T.r2)/2?Math.PI:0); }
    else a=angTo(e.x,e.y,c.x,c.y);
    c.dx=Math.cos(a)*300; c.dy=Math.sin(a)*300; return;
  }
  for(const h of G.hazards){ if(h.kind!=='blast'||h.t>h.delay*0.85) continue; if(dist(h.x,h.y,c.x,c.y)<h.r+c.r+6){ const a=angTo(h.x,h.y,c.x,c.y); c.dx=Math.cos(a)*300; c.dy=Math.sin(a)*300; return; } }
}
function compHurt(c,amt,sx,sy){
  if(!c||c.down>0||c.iframes>0||(window.__eb&&window.__eb.compGod)) return;
  let a=amt*(G.diff?G.diff.dmg:1);
  if(c.id==='brisket'&&Math.abs(angDiff(c.face,angTo(c.x,c.y,sx,sy)))<1.4){ a*=0.4; SFX.play('block'); hitSpark(c.x+Math.cos(c.face-0.9)*10,c.y+Math.sin(c.face-0.9)*10,'210,225,255'); }
  if(c.id==='greymane') a*=0.85;
  c.hp-=a; c.iframes=0.3; c.flash=0.14; const k=angTo(sx,sy,c.x,c.y); c.kvx+=Math.cos(k)*140; c.kvy+=Math.sin(k)*140;
  if(settings.nums) ftext(c.x,c.y-22,'-'+Math.max(1,Math.round(a)),'#ffb0a0',12);
  if(c.hp<=0) compKnockDown(c);
  else if(c.hp<c.maxHp*0.3&&!c.lowSaid){ c.lowSaid=true; compSay(c,'low',true); }
}
function compKnockDown(c){
  c.hp=0; c.down=c.downMax=hasSkill('rally')?6:12; c.act=null; c.tgt=null; c.lowSaid=false;
  compSay(c,'down',true); SFX.play('pop'); emit(c.x,c.y,12,{col:'255,240,170',ang:-Math.PI/2,spread:1.4,smin:30,smax:100,lmin:.4,lmax:.8,zmin:1.5,zmax:3});
}
function compGetUp(c){ c.down=0; c.hp=c.maxHp*0.5; c.iframes=1.5; compSay(c,'up',true); csfx('up'); emit(c.x,c.y,16,{col:'255,220,140',ang:-Math.PI/2,spread:1.2,smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:16}); }
// ---------- little things they do when nobody is fighting
function compIdle(c,dt){
  const p=player;
  if(c.id==='juniper'){
    if(!AREA){ c.fogT-=dt; if(c.fogT<=0){ c.fogT=1; fogReveal(p.x,p.y,1250); } }
    if(c.point){ c.point.t-=dt; c.face=turnTo(c.face,angTo(c.x,c.y,c.point.x,c.point.y),6*dt); if(c.point.t<=0) c.point=null; }
    else if(c.pointCd<=0&&!G.inCombat){ c.pointCd=4; const s=nearSecret(p.x,p.y,460,'jun'); if(s){ c.point={x:s.x,y:s.y,t:2.6}; const d=CDEF.juniper; bubble(c,pickC('juniper','point'),{who:d.name,col:d.col,kind:'bang'}); c.lastSay=G.time; CFX.push({k:'spark',x:s.x,y:s.y,t:0,dur:2.6}); } }
  }
  if(c.id==='duchess'){
    if(c.spit>0){ c.spit-=dt; if(c.spit<=0){ dropCoins(c.x+Math.cos(c.face)*12,c.y+Math.sin(c.face)*12,randi(2,4)); compSay(c,'spit',true); csfx('bleat'); } }
    if(c.eat){ const k=c.eat; if(G.inCombat||k.life<=0||!G.pickups.includes(k)){ c.eat=null; } else { compGo(c,k.x,k.y,170); if(dist(c.x,c.y,k.x,k.y)<14){ k.life=0; c.eat=null; c.spit=2.6; compSay(c,'eat',true); csfx('bleat'); emit(k.x,k.y,6,{col:'255,220,120',smin:20,smax:60,lmin:.2,lmax:.4,zmin:1.5,zmax:2.5}); } } }
    else if(c.eatCd<=0&&!G.inCombat&&c.mode!=='stay'){ c.eatCd=rand(25,45); if(p.hp>p.maxHp*0.7){ const k=G.pickups.find(q=>q.life>2&&dist(q.x,q.y,c.x,c.y)<230&&dist(q.x,q.y,p.x,p.y)>90); if(k&&Math.random()<0.65) c.eat=k; } }
  }
  if(G.inCombat) return;
  const rk=G.region?G.region.key:''; if(c.region===null) c.region=rk; else if(rk&&rk!==c.region&&!AREA){ c.region=rk; if(Math.random()<0.6){ compSay(c,'region'); return; } }
  if(c.idleCd<=0){ c.idleCd=rand(40,75); const kind=G.rainK>0.5&&!AREA&&Math.random()<0.5?'rain':isNight()&&Math.random()<0.35?'night':'idle'; compSay(c,kind); }
}
function nearSecret(x,y,r,who){
  let best=null, bd=r*r; const P=CF.pointed, now=G.time;
  const consider=(id,ox,oy)=>{ if(P[id]&&now-P[id]<150) return; const d=dist2(x,y,ox,oy); if(d<bd&&d>60*60){ bd=d; best={id,x:ox,y:oy}; } };
  if(AREA){ for(const o of AREA.objs){ const k=o.k; if((k==='cchest'&&!G.found[o.id]&&!o.sealed)||(k==='page'&&!G.pages[o.page])||((k==='cave_ore'||k==='relic')&&!G.found[o.id])) consider('ao_'+o.id,o.x,o.y); } }
  else{
    for(const c of CHESTS) if(!c.open) consider('ch_'+c.id,c.x,c.y);
    for(const o of ORES) if(!G.ores[o.id]) consider('ore_'+o.id,o.x,o.y);
    for(const o of LANDMARKS){ if(o.hidden&&o.hidden()) continue; const k=o.k; if((k==='xmark'&&!G.found[o.id])||(o.meltable&&!G.found[o.id])||(o.smokeable&&!G.found[o.id])||(k==='facetree'&&!G.found.barkley)||(k==='iceblock'&&!G.flags.brisket_thawed)||(k==='wagon'&&!G.found.wagon)||(k==='ribs'&&!G.found.ribs)||(k==='fairyring'&&isNight()&&!G.found.fairy)) consider('lm_'+o.id,o.x,o.y); }
    if(G.quests.moss&&!G.quests.moss.done) for(const l of LILIES) if(!l.taken) consider('li_'+l.id,l.x,l.y);
  }
  if(best) P[best.id]=now;
  return best;
}
// ---------- the whistle: once to call, twice to make them wait
function compWhistle(){
  const now=G.time, dbl=now-CF.whistleT<0.55&&CF.whistleOne; CF.whistleT=now;
  csfx('whistle'); bubble(player,'♪ Fweet!',{dy:-38,dur:1.1});
  const c=compRT();
  if(!c||c.hidden){ CF.whistleOne=false; if(G.pip){ G.pip.chirp=Math.max(G.pip.chirp,8); later(0.25,()=>{ if(G.pip){ bubble(G.pip,pick(['Mip?','Mip!','Mrrp?']),{kind:'pip',dy:-22}); csfx('chirp'); } }); } return; }
  if(dbl){ CF.whistleOne=false;
    if(CF.prevMode==='stay'){ c.mode='follow'; compSay(c,'come',true); }
    else{ c.mode='stay'; c.sx=c.x; c.sy=c.y; c.callT=0; compSay(c,'stay',true); }
    return; }
  CF.whistleOne=true; CF.prevMode=c.mode;
  if(c.outside){ bubble(player,'(Duchess is waiting outside. She heard you. Probably.)',{kind:'narr',dy:-40}); return; }
  if(c.down>0){ compSay(c,'whistleDown',true); return; }
  c.mode='follow'; c.callT=2.4; c.tgt=null; c.act=null; c.stuckT=0;
  if(dist(c.x,c.y,player.x,player.y)>600&&!airborne()) compBlink(c,true);
  compSay(c,'come',true);
  if(G.pip) later(0.3,()=>{ if(G.pip) bubble(G.pip,'Mip!',{kind:'pip',dy:-22}); });
}
// ---------- moving between places (doors, floors, caves, fast travel)
function compsOnMove(){
  TRAIL.length=0; CSTONES.length=0;
  if(!G||G.mode!=='story'||!player) return;
  const c=compRT(); if(!c) return;
  c.mode='follow'; c.act=null; c.stuckT=0; c.trailI=-1; c.kvx=c.kvy=0; c.tgt=null; c.callT=0; c.eat=null;
  if(c.id==='duchess'&&AREA&&AREA.kind==='house'){
    if(!c.outside){ c.outside=true; const ow=G.ow||{x:player.x,y:player.y}; c.x=ow.x+26; c.y=ow.y+14; later(0.6,()=>{ if(AREA) bubble(player,'(Duchess waits outside, judging you.)',{kind:'narr',dy:-40,dur:3.4}); }); }
    return;
  }
  c.outside=false;
  const s=compSpotNear(player.x,player.y,player.facing+Math.PI); c.x=s.x; c.y=s.y; c.cx=c.x; c.cy=c.y; c.lpx=player.x; c.lpy=player.y;
  if(AREA&&!c.hidden){ const k=AREA.kind==='cave'?'cave':'house'; later(1.1,()=>{ if(CM===c&&AREA&&Math.random()<0.7) compSay(c,k); }); }
}
// ---------- talking to companions and recruits
function compNPC(c){ if(!c.npc){ const src=CASTBY[c.id]||SPECIAL[c.id]; c.npc=mkNPC(src,c.x,c.y); } c.npc.x=c.x; c.npc.y=c.y; c.npc.face=c.face; return c.npc; }
function compTalk(){
  const c=CM; if(!c) return;
  if(c.id==='brisket'||c.id==='juniper'){ c.face=angTo(c.x,c.y,player.x,player.y); talkTo(compNPC(c)); return; }
  const id=c.id, S=CDEF[id].spk, o=[];
  o.push(...compTalkOpts(id,null));
  if(id==='duchess') o.push({t:'Who’s a good goat?',key:'cg_'+dayNow(),then:[['goat','MEH.'],['narr',pick([`Duchess is not a good goat. Duchess is a GREAT goat. And she knows it.`,`Duchess lets you scratch behind one horn. Only one. Don't push it.`])]],back:true});
  if(id==='greymane') o.push({t:'Good boy!',key:'cgm_'+dayNow(),then:[['narr',pick([`Greymane's tail thumps the ground. Snow flies everywhere. You are now a snowman.`,`Greymane rolls over for a belly rub. A thousand-pound wolf, belly up.`])]],back:true});
  o.push({t:'Never mind.',end:true});
  const h=ch(S,pickC(id,'hello'),o); h.again=()=>id==='duchess'?'Meh?':'*tilts head*';
  runDialogue([h],()=>{ scene='play'; saveGame(); });
}
// options added to a villager's talk menu (called from talkHub in a9f_talk.js)
function compTalkOpts(id,n){
  const o=[]; if(!G||G.mode!=='story') return o;
  const c=G.comp===id?compRT():null;
  if(c){
    const S=CDEF[id].spk;
    if(c.mode==='stay') o.push({t:'Come on, let’s go!',tag:'friend',fn:()=>{ c.mode='follow'; },then:[[S,pickC(id,'come')]],end:true});
    else o.push({t:'Wait here for me.',tag:'friend',fn:()=>{ c.mode='stay'; c.sx=c.x; c.sy=c.y; },then:[[S,pickC(id,'stay')]],end:true});
    if(id==='brisket') o.push({t:'Tell me a joke!',key:'joke_'+dayNow(),then:()=>[['brisket',pick(BRISKET_JOKES)],['ash',pick([`...`,`Oh no.`,`That was terrible.`,`I'm laughing on the inside.`])],['brisket',pick([`Ha! I'll be here all week.`,`You'll laugh later. Trust me.`,`I've got four hundred more.`])]],back:true});
    if(id==='juniper') o.push({t:'What’s on your map?',key:'map_'+dayNow(),then:()=>{ const s=nearSecret(player.x,player.y,1400,'talk'); return [['juniper',s?`My map says there's something ${dirWord(player.x,player.y,s.x,s.y)} of here. Not far! Want to look?`:`Everything around here is mapped! I even drew the rocks. Some of them twice.`]]; },back:true});
    o.push({t:'How are you holding up?',then:()=>[[S,c.hp<c.maxHp*0.4?(id==='brisket'?`A bit dented! Nothing a snack can't fix.`:id==='juniper'?`Ouch. But my map is fine! That's what matters.`:id==='duchess'?'Meh...':'*licks a scratch*'):(id==='brisket'?`Never better! Warm, armed and full of jokes.`:id==='juniper'?`Great! I've drawn eleven new trees today.`:id==='duchess'?'Meh.':'*wag wag*')]],back:true});
    o.push({t:'You can go home for now.',then:[[S,pickC(id,'bye')]],fn:()=>{ later(0.15,()=>compSendHome(id)); },end:true});
    return o;
  }
  const swapLine=()=>G.comp&&CDEF[G.comp]&&G.comp!==id?[['narr',`${CDEF[G.comp].name} heads home to ${CDEF[G.comp].home}.`]]:[];
  const at=n?{x:n.x,y:n.y+16}:null;
  if(id==='brisket'&&canRecruit('brisket')) o.push({t:'Want to come along?',tag:'friend',fn:()=>recruitComp('brisket',at),then:()=>[['brisket',`Do I? DO I? I've been thawed for ages! Let me grab my sword. I mean. It's right here. Let's go!`]].concat(swapLine()),end:true});
  if(id==='juniper'&&canRecruit('juniper')) o.push({t:'Want to come along?',tag:'friend',fn:()=>recruitComp('juniper',at),then:()=>[['juniper',`YES. I'll bring my sling and my map. And two lanterns. Rook, tell Mom!`]].concat(swapLine()),end:true});
  if(id==='hollis'&&canRecruit('duchess')&&G.comp!=='duchess') o.push({t:'Can Duchess come with me?',tag:'friend',then:()=>[['hollis',`Take her! Please. I mean, sure, if she wants to. Ask her yourself. She's by the fence, judging the fence.`]],back:true});
  if(id==='hollis'&&G.comp==='duchess') o.push({t:'How’s the farm without Duchess?',key:'hd_'+dayNow(),then:[['hollis',`Quiet. Too quiet. Nobody has eaten my hat in days. I miss it.`]],back:true});
  if(id==='rook'&&G.comp==='juniper') o.push({t:'Juniper is with me!',key:'rj_'+dayNow(),then:[['rook',`I KNOW. She's going on adventures with a DRAGON. I'm not jealous. I'm a little jealous.`]],back:true});
  if(id==='ulf'&&G.comp==='brisket') o.push({t:'Brisket is with me!',key:'ub_'+dayNow(),then:[['ulf',`Good. He kept telling jokes at breakfast. The sheep were getting upset.`]],back:true});
  return o;
}
function dirWord(x0,y0,x1,y1){ const a=Math.atan2(y1-y0,x1-x0), k=Math.round(a/(Math.PI/4)); return ['east','south-east','south','south-west','west','north-west','north','north-east'][(k+8)%8]; }
function talkDuchess(){
  const g=G.goat, swap=G.comp&&G.comp!=='duchess'?[['narr',`${CDEF[G.comp].name} heads home to ${CDEF[G.comp].home}.`]]:[];
  runDialogue([['goat','Meh.'],ch('ash','Hey, Duchess.',[
    {t:'Want to come along?',tag:'friend',fn:()=>recruitComp('duchess',g?{x:g.x,y:g.y}:null),then:()=>[['goat','...Meh.'],['narr',`Duchess looks at you for a long time. Then she walks right past you, as if this was her idea all along.`]].concat(swap),end:true},
    {t:'Who’s a good goat?',then:[['goat','MEH.'],['narr',`Duchess is not a good goat. Duchess is a GREAT goat. And she knows it.`]],end:true},
    {t:'Bye, Duchess.',then:[['goat','Meh.']],end:true}])],()=>{ scene='play'; });
}
function talkGreymane(){
  const swap=G.comp&&G.comp!=='greymane'?[['narr',`${CDEF[G.comp].name} heads home to ${CDEF[G.comp].home}.`]]:[];
  runDialogue([['narr',`Greymane lifts his huge head. His ice-blue eyes are calm. He remembers you.`],ch('ash','Hi, Greymane.',[
    {t:'Want to come along?',tag:'friend',fn:()=>recruitComp('greymane',{x:GREYW.x,y:GREYW.y}),then:()=>[['narr',`Greymane stands. He is much taller than you. He howls once, and the pines shake. Then he trots to your side like a very big puppy.`]].concat(swap),end:true},
    {t:'Just saying hi.',then:[['narr',`Greymane huffs. Snow blows off your horns. That's wolf for "hi."`]],end:true}])],()=>{ scene='play'; });
}
function brisketAsk(){
  const o=CF.ice||iceLM(), at=o?{x:o.x+10,y:o.y+34}:null, old=G.comp&&G.comp!=='brisket'?CDEF[G.comp]:null;
  runDialogue([['brisket',`Actually... being warm sounds a bit boring. I've been an ice cube for ages. I want an ADVENTURE.`],['brisket',`I've got a sword. I've got a shield. I've got about four hundred jokes. Can I come with you?`],
    ch('ash','Bring Brisket along?',[
      {t:old?`Yes! Come on! (${old.name} heads home)`:'Yes! Come on!',tag:'friend',fn:()=>recruitComp('brisket',at),then:[['brisket',`Brisket the Bold rides again! Walks again, anyway. Squishily.`]]},
      {t:'Maybe later.',then:[['brisket',`Fair enough! I'll be at the Frostpine Lodge, thawing my toes. Ask me any time.`]]}])],()=>{ scene='play'; saveGame(); });
}
// prompts of our own: Duchess at the farm, Greymane in the pines, your companion when you stop next to them
function compPrompts(){
  if(scene!=='play'||!player||player.dead) return;
  const p=player; let best=null, bd=1e9;
  const offer=(d,text,act,x,y)=>{ if(d<bd){ bd=d; best={text,act,x,y}; } };
  const c=CM&&!CM.hidden&&!CM.outside?CM:null;
  if(c){ const d=dist(p.x,p.y,c.x,c.y);
    if(c.down>0){ if(d<64) offer(d-10,`Help ${CDEF[c.id].name} up`,()=>{ if(CM===c&&c.down>0){ c.down=0.01; } },c.x,c.y); }
    else if(!G.inCombat&&d<56&&(c.mode==='stay'||c.still>2.5||(c.npc&&npcMarker(c.id)))) offer(d+45,`Talk to ${CDEF[c.id].name}`,compTalk,c.x,c.y); }
  if(!AREA&&!G.inCombat){
    const g=G.goat; if(g&&G.side.duchess==='home'&&canRecruit('duchess')&&G.comp!=='duchess'){ const d=dist(p.x,p.y,g.x,g.y); if(d<70) offer(d,'Talk to Duchess',talkDuchess,g.x,g.y); }
    if(greyHere()){ const d=dist(p.x,p.y,GREYW.x,GREYW.y); if(d<90) offer(d-10,'Talk to Greymane',talkGreymane,GREYW.x,GREYW.y); }
  }
  if(!best) return;
  if(G.prompt&&G.prompt.x!=null&&dist(p.x,p.y,G.prompt.x,G.prompt.y)<=bd) return;
  if(G.fishing) return;
  G.prompt=best;
}
// one-off follow ups: Brisket asks to come along right after the thaw
function compFollowUps(dt){
  if(scene!=='play'||AREA) return;
  if(G.flags.brisket_thawed&&!G.flags.comp_bAsk){
    const o=iceLM();
    if(o&&dist(player.x,player.y,o.x,o.y)<700){ if(!CF.bT) CF.bT=G.time; if(G.time-CF.bT>0.8&&G.comp!=='brisket'){ G.flags.comp_bAsk=true; brisketAsk(); } }
    else G.flags.comp_bAsk=true;
  }
}

// ---------- Brisket's block of ice melts slowly, with drips and steam
function iceLM(){ if(CF.ice===undefined) CF.ice=LANDMARKS.find(o=>o.k==='iceblock')||null; return CF.ice; }
function updateThaw(dt){
  if(AREA||G.flags.brisket_thawed) return;
  const o=iceLM(); if(!o||dist2(o.x,o.y,player.x,player.y)>500*500) return;
  const h=o.heat||0, gain=h-MELT.last;
  if(gain>0.0001){
    MELT.p+=gain; MELT.hot=0.25;
    if(Math.random()<0.25) emit(o.x+rand(-16,16),o.y-rand(10,34),1,{col:'235,242,255',glow:false,ang:-Math.PI/2,spread:0.5,smin:15,smax:40,lmin:.6,lmax:1.1,zmin:2,zmax:3.5,grow:3,drag:0.6,alpha:0.35});
    if(Math.random()<0.35){ emit(o.x+rand(-18,18),o.y-rand(0,26),1,{col:'150,200,255',glow:false,ang:Math.PI/2,spread:0.15,smin:30,smax:60,lmin:.3,lmax:.5,zmin:1.2,zmax:2}); if(Math.random()<0.3) csfx('drip',0.7); }
    const k=MELT.p/MELT.need;
    if(MELT.said<1&&k>0.15){ MELT.said=1; bubble(o,'Mmf! Mmmf mmf!',{who:'???',col:'#e0d0b0',dy:-52}); }
    else if(MELT.said<2&&k>0.5){ MELT.said=2; bubble(o,'MMF! (Keep going!)',{who:'???',col:'#e0d0b0',dy:-52}); }
    else if(MELT.said<3&&k>0.82){ MELT.said=3; bubble(o,'Mmmmf... warm...',{who:'???',col:'#e0d0b0',dy:-52}); }
  }
  if(MELT.hot>0) MELT.hot-=dt;
  if(MELT.p<MELT.need){ if(o.heat>1.1) o.heat=1.1; } else if(o.heat<1.19) o.heat=1.19;
  MELT.last=o.heat||0;
}
function drawMelt(){
  const o=iceLM(); if(!o||G.flags.brisket_thawed) return; const k=clamp(MELT.p/MELT.need,0,1), x=o.x, y=o.y, t=G.time;
  ctx.save();
  ctx.fillStyle=`rgba(140,190,230,${0.25+0.25*k})`; ctx.beginPath(); ctx.ellipse(x,y+10,20+22*k,7+8*k,0,0,TAU); ctx.fill();
  ctx.fillStyle=`rgba(255,255,255,${0.25*k})`; ctx.beginPath(); ctx.ellipse(x-8,y+8,6+6*k,1.6+1.2*k,0,0,TAU); ctx.fill();
  for(let i=0;i<5;i++){ const dx=-16+i*8+Math.sin(i*7.3)*3, ph=(t*(0.7+i*0.13)+i*0.37)%1; if(i/5>k*1.4) continue; const dy=-30+ph*36; ctx.fillStyle=`rgba(190,225,255,${0.8*(1-ph*0.6)})`; ctx.beginPath(); ctx.ellipse(x+dx,y+dy,1.3,2.2,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(220,240,255,.35)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+dx,y-32); ctx.lineTo(x+dx,y+dy-2); ctx.stroke(); }
  if(k>0.45){ ctx.strokeStyle=`rgba(255,255,255,${0.5*(k-0.45)*2})`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x-10,y-26); ctx.lineTo(x-4,y-16); ctx.lineTo(x-8,y-6); ctx.moveTo(x+6,y-30); ctx.lineTo(x+12,y-18); ctx.stroke(); }
  if(MELT.hot>0){ ctx.globalCompositeOperation='lighter'; glowAt(x,y-14,30,'255,170,90',0.25); }
  ctx.restore();
}

// ---------- Greymane waits in the pines if you asked him to stand with you; the pack howls at night
const GREYW={x:0,y:0,face:Math.PI/2,t:0,dx:0,dy:0,state:'idle',r:20,snowy:true};
function greyHere(){ return !AREA&&canRecruit('greymane')&&G.comp!=='greymane'; }
function greyWorld(dt){
  if(!GREYW.set){ const o=LANDMARKS.find(q=>q.id==='greyhome'); if(o){ GREYW.x=o.x; GREYW.y=o.y; GREYW.set=true; } else if(POI.frost){ GREYW.x=POI.frost.x+200; GREYW.y=POI.frost.y+60; GREYW.set=true; } }
  if(greyHere()&&dist2(GREYW.x,GREYW.y,player.x,player.y)<900*900){ GREYW.t+=dt; GREYW.face=turnTo(GREYW.face,angTo(GREYW.x,GREYW.y,player.x,player.y),dist(GREYW.x,GREYW.y,player.x,player.y)<300?2*dt:0); }
  // night howls near the Frostpine once Greymane has been met
  if(AREA||!G.bossDone.greymane||!isNight()||scene!=='play') return;
  const P=POI.frost, L=POI.lodge, near=(P&&dist(player.x,player.y,P.x,P.y)<1900)||(L&&dist(player.x,player.y,L.x,L.y)<1600);
  if(!near) return;
  CF.howlT-=dt; if(CF.howlT>0) return; CF.howlT=rand(45,85);
  SFX.play('howl');
  const a=rand(-Math.PI*0.9,-Math.PI*0.1), r=rand(230,330), anchor={x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r*0.7};
  bubble(anchor,pick(['Awoooo...','Awooo-oo-ooo...','(Far away, the pack is howling.)','Aoooooo...']),{kind:'far',dy:0,dur:3.4});
  if(CM&&CM.id==='greymane'&&!CM.hidden) later(1.6,()=>{ if(CM&&CM.id==='greymane'){ SFX.play('howl'); compSay(CM,'howl',true); } });
}

// ---------- stones, rings, sparks, embers and goodbyes
function compFx(dt){
  for(const s of CSTONES){
    s.t+=dt; s.life-=dt; if(s.area!==!!AREA){ s.life=0; continue; }
    s.x+=s.vx*dt; s.y+=s.vy*dt;
    if(s.t>0.05&&(colAt(s.x,s.y,3)||(AREA&&AREA.kind==='cave'&&areaBlocked(s.x,s.y)))){ s.life=0; emit(s.x,s.y,5,{col:'150,140,130',glow:false,smin:20,smax:80,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); continue; }
    for(const e of G.enemies){ if(!foeOK(e)) continue; let hit=false; for(const hc of hitCircles(e)) if(dist2(s.x,s.y,hc.x,hc.y)<(hc.r+4)**2){ hit=true; break; } if(!hit) continue; compHit(e,s.dmg,{kb:130,ka:Math.atan2(s.vy,s.vx),fx:s.x-s.vx*0.05,fy:s.y-s.vy*0.05}); hitSpark(s.x,s.y,'220,210,190'); SFX.play('hit',0.4); s.life=0; break; }
  }
  for(let i=CSTONES.length-1;i>=0;i--) if(CSTONES[i].life<=0) CSTONES.splice(i,1);
  for(const f of CFX){ f.t+=dt;
    if(f.k==='ember'){ const p=player, a=angTo(f.x,f.y,p.x,p.y), d=dist(f.x,f.y,p.x,p.y); f.x+=Math.cos(a)*Math.min(d,260*dt); f.y+=Math.sin(a)*Math.min(d,260*dt); if(d<10&&!f.done){ f.done=true; f.t=99; heal(4+player.level*0.8); emit(p.x,p.y,10,{col:'140,255,150',ang:-Math.PI/2,spread:1,smin:20,smax:80,lmin:.3,lmax:.6,zmin:1.5,zmax:2.5,rise:14}); } if(Math.random()<0.5) emit(f.x,f.y,1,{kind:'fire',smin:5,smax:20,lmin:.2,lmax:.35,zmin:1.2,zmax:2.2,grow:-3}); }
  }
  for(let i=CFX.length-1;i>=0;i--){ const f=CFX[i]; if(f.t>(f.dur||6)) CFX.splice(i,1); }
  for(const L of CLEAVE){ L.t+=dt; L.x+=Math.cos(L.face)*90*dt; L.y+=Math.sin(L.face)*90*dt; if(L.vis) L.vis.t=(L.vis.t||0)+dt; }
  for(let i=CLEAVE.length-1;i>=0;i--) if(CLEAVE[i].t>1.8) CLEAVE.splice(i,1);
}

// ---------- Pip: fetches coins, chirps toward secrets, and with Pip's Best Friend drops tiny heal embers (called from updateFollowers)
function pipExtras(q,dt,tgt){
  if(!G||G.mode!=='story'||!player) return null;
  const p=player; q.fx=q.fx||{fetch:null,fetchCd:3,pt:null,ptCd:8,healCd:rand(8,14)};
  const F=q.fx; F.fetchCd-=dt; F.ptCd-=dt; F.healCd-=dt;
  if(hasSkill('pipbond')&&G.inCombat&&p.hp<p.maxHp*0.8&&F.healCd<=0&&!p.dead){ F.healCd=rand(12,18); CFX.push({k:'ember',x:q.x,y:q.y-6,t:0,dur:4}); bubble(q,'Mip ♥',{kind:'pip',dy:-22}); csfx('chirp'); }
  if(tgt){ if(F.fetch&&F.fetch._pip) F.fetch._pip=false; F.fetch=null; F.pt=null; return null; }
  if(F.fetch){
    const k=F.fetch;
    if(k.life<=0||!G.pickups.includes(k)) F.fetch=null;
    else{
      if(!k._pip&&dist(q.x,q.y,k.x,k.y-6)<14){ k._pip=true; csfx('chirp'); }
      if(k._pip){ k.x=q.x; k.y=q.y+5; k.vx=k.vy=0; k.life=Math.max(k.life,6); if(dist(q.x,q.y,p.x,p.y)<66){ k._pip=false; F.fetch=null; F.fetchCd=1.2; } return {x:p.x,y:p.y-6}; }
      return {x:k.x,y:k.y-6};
    }
  }else if(F.fetchCd<=0){
    F.fetchCd=0.6; let best=null, bd=1e9;
    for(const k of G.pickups){ if(!k.coin||k.life<1) continue; const dp=dist(k.x,k.y,p.x,p.y); if(dp<120||dp>340) continue; if(dp<bd){ bd=dp; best=k; } }
    if(best){ F.fetch=best; if(Math.random()<0.5) bubble(q,'Mip!',{kind:'pip',dy:-22}); return {x:best.x,y:best.y-6}; }
  }
  if(F.pt){ F.pt.t-=dt; if(F.pt.t<=0) F.pt=null; else return {x:F.pt.x+Math.cos(q.t*3)*14,y:F.pt.y-22+Math.sin(q.t*4)*6}; }
  else if(F.ptCd<=0&&!G.inCombat&&scene==='play'){ F.ptCd=rand(8,12); const s=nearSecret(p.x,p.y,360,'pip'); if(s){ F.pt={x:s.x,y:s.y,t:3.2}; bubble(q,pick(['Mip! Mip!','MIP!','Mip mip mip!']),{kind:'pip',dy:-22}); csfx('chirp'); CFX.push({k:'spark',x:s.x,y:s.y,t:0,dur:3}); } }
  return null;
}
function pipChirp(q){ bubble(q,pick(['Mip!','Mip mip!','Mrrp?','Mip! Mip!']),{kind:'pip',dy:-22}); csfx('chirp'); }
function pipCd(){ return hasSkill('pipbond')?0.6:1; }

// ================= deeds: what Ash has done, kept up to date from the story state
function deed(id){ if(!G) return; G.deeds=G.deeds||{}; if(!G.deeds[id]||G.deeds[id]===true) G.deeds[id]=Math.max(1,Math.round(G.worldTime||1)); }
const DEED_PRI={done:9,boss_vorlaxis:9,trial_wings:8,boss_cindervane:7,trial_stride:7,trial_jump:7,boss_grizzlefang:6,boss_morrow:6,boss_broodmother:6,boss_gloamjaw:6,boss_greymane:6,ward_ash:5,ward_crag:5,ward_mire:5,ward_frost:5,pip:5,wpn_hammer:4,wpn_bow:4,wpn_boomerang:4};
function syncDeeds(){
  if(!G||G.mode!=='story') return;
  const D=G.deeds=G.deeds||{};
  for(const q in G.quests) if(G.quests[q]&&G.quests[q].done) deed('q_'+q);
  for(const b in G.bossDone) if(G.bossDone[b]) deed('boss_'+b);
  for(const w in G.wards) if(G.wards[w]&&(w!=='hollow'||reached('warcamp'))) deed('ward_'+w);
  for(const a in (G.abil||{})) if(G.abil[a]) deed('trial_'+a);
  for(const w in (G.weapons||{})) if(G.weapons[w]&&w!=='sword') deed('wpn_'+w);
  for(const c of ['morrow','fennick','greymane','cinder']) if(G.choices[c]) deed('ch_'+c+'_'+G.choices[c]);
  if(G.flags.pip) deed('pip'); if(G.flags.brisket_thawed) deed('thaw'); if(G.flags.juniper_found) deed('juniper');
  for(const k of ['barkley','carrot','fairy','knight','ribs','wagon']) if(G.found[k]) deed('f_'+k);
  if(G.found.x1||G.found.x2||G.found.x3) deed('f_dig');
  const pg=Object.keys(G.pages||{}).length; if(pg>=3) deed('pages3'); if(pg>=10) deed('pages10');
  for(const id in (G.friends||{})) if(friendOf(id)>=5) deed('best_'+id);
  if(player&&player.level>=5) deed('lvl5'); if(player&&player.level>=10) deed('lvl10');
  if(G.tier>=2) deed('tier2'); if(G.flags&&G.flags.act1_done) deed('done');
  if(player&&player.flying&&!D.flew) deed('flew');
}
const DAGE=k=>{ const t=G.deeds&&G.deeds[k]; return typeof t==='number'?(G.worldTime||0)-t:1e9; };

// ================= villagers who notice: barks (one-liners), chats (two villagers) and greetings
// who: 'any', 'kid', 'adult', 'gen' (generic neighbours), 'town:x', 'id:a,b'; several joined with | (any matches); a leading ! negates one token
function whoFn(spec){
  const parts=String(spec||'any').split('|').map(tok=>{ const neg=tok[0]==='!'; if(neg) tok=tok.slice(1); let f;
    if(tok==='any') f=()=>true; else if(tok==='kid') f=n=>n.kid; else if(tok==='adult') f=n=>!n.kid; else if(tok==='gen') f=n=>n.gen;
    else if(tok.startsWith('town:')){ const t=tok.slice(5); f=n=>n.town===t; } else if(tok.startsWith('id:')){ const s=tok.slice(3).split(','); f=n=>s.includes(n.id); } else f=()=>false;
    return neg?{neg:true,f}:{neg:false,f}; });
  const pos=parts.filter(p=>!p.neg), neg=parts.filter(p=>p.neg);
  return n=>(!pos.length||pos.some(p=>p.f(n)))&&!neg.some(p=>p.f(n));
}
function npcInfo(n){ const c=CASTBY[n.id]||SPECIAL[n.id]||{}; return {id:n.id,town:n.id==='juniper'?'village':c.town||'',kid:!!c.kid,gen:!!c.generic}; }
const dSt=s=>reached(s), dBd=b=>!!G.bossDone[b], dAb=a=>hasAbil(a), dHw=w=>!!(G.weapons&&G.weapons[w]), dEq=w=>G.weapon===w&&dHw(w), dCh=(k,v)=>G.choices[k]===v;
const wardLit=w=>!!G.wards[w]&&(w!=='hollow'||reached('warcamp'));
const rainy=()=>!AREA&&G.rainK>0.45, pageN=()=>Object.keys(G.pages||{}).length;
const compNear=id=>G.comp===id&&CM&&!CM.hidden&&!CM.outside&&dist(CM.x,CM.y,player.x,player.y)<220;
const pipNear=()=>!!G.pip&&dist(G.pip.x,G.pip.y,player.x,player.y)<200;
const lowHp=()=>player.hp<player.maxHp*0.45;
const HATLINE={party:`A party hat! Is it your birthday? Is it MY birthday?`,wizard:`Ooh, a wizard hat. Do a magic trick! Breathing fire counts.`,crown:`A flower crown! You look like a springtime dragon.`,top:`A top hat! Very fancy, Sir Ash.`};
const BARKS=[];
function B(k,who,c,t,o){ BARKS.push(Object.assign({k,w:whoFn(who),c,t},o||{})); }
const ALWAYS=()=>true;
// --- the story so far
B('raid1','town:village|!kid',()=>dSt('lore')&&!dSt('warcamp'),`You chased the kobolds off! My chickens thank you.`);
B('raid2','town:village|!id:bertram',()=>dSt('lore'),`Kobolds in the bakery! Bertram screamed louder than the kobolds did.`);
B('raid3','kid',()=>dSt('lore'),`Did you see the kobolds run? Like this! Wheee!`);
B('hollowW','town:village',()=>wardLit('hollow'),`The old oak feels warm again. Did you do that?`,{d:'ward_hollow'});
B('camp0','adult',()=>dSt('warcamp')&&!dBd('grizzlefang'),`They say the kobold war camp is north of the village. Be careful, Ash.`);
B('grizz1','any',()=>dBd('grizzlefang'),`Grizzlefang is gone? The kobold chieftain? You're braver than my goose.`,{d:'boss_grizzlefang'});
B('grizz2','adult',()=>dBd('grizzlefang'),`No more kobolds stealing socks! Thank you, Ash!`,{d:'boss_grizzlefang'});
B('grizz3','kid',()=>dBd('grizzlefang'),`Did Grizzlefang smell bad? I bet he smelled SO bad.`,{d:'boss_grizzlefang'});
B('oath0','adult',()=>dSt('oath')&&!dBd('morrow'),`People in robes keep walking past at night. The Scaled Oath. Creepy.`);
B('mfree','any',()=>dCh('morrow','free')&&dBd('morrow'),`Morrow is growing pumpkins in the Mirefen now. Very nervous pumpkins.`,{d:'ch_morrow_free'});
B('mjail','any|!id:osric',()=>dCh('morrow','jail'),`High Priest Morrow, in Osric's cell! I hear he alphabetized it.`,{d:'ch_morrow_jail'});
B('wAsh','any',()=>wardLit('ash'),`I saw the Ash Ward light up from my window. Like a sunrise at night!`,{d:'ward_ash'});
B('three0','adult',()=>G.stage==='three',()=>`${threeLeft().length} ${threeLeft().length===1?'Ward is':'Wards are'} still dark. You'll get ${threeLeft().length===1?'it':'them'}, Ash.`);
B('brood1','any',()=>dBd('broodmother'),`The Brood Mother is beaten? No more drakelings stealing my laundry!`,{d:'boss_broodmother'});
B('gloam1','any',()=>dBd('gloamjaw'),`You fought the thing in the Mirefen? I won't even go in my own cellar.`,{d:'boss_gloamjaw'});
B('gloam2','town:brindle|!id:dell',()=>dBd('gloamjaw'),`Dell says the lake smells less like swamp now. Thanks, I think.`,{d:'boss_gloamjaw'});
B('ghome','any',()=>dCh('greymane','home'),`You let Greymane go home to his pack? That's a kind dragon.`,{d:'ch_greymane_home'});
B('gally','any',()=>dCh('greymane','ally'),`Greymane is your FRIEND now? The giant wolf? Does he fetch?`,{d:'ch_greymane_ally'});
B('glodge','town:lodge',()=>dBd('greymane'),`The wolves stopped bothering the lodge. They still sing at night, though.`,{d:'boss_greymane'});
B('wCrag','any',()=>wardLit('crag'),`Somebody saw a big fire on the Drakeling Crags. A GOOD fire.`,{d:'ward_crag'});
B('wMire','any',()=>wardLit('mire'),`The Sunken Ward is lit? Under all that mud? Wow.`,{d:'ward_mire'});
B('wFrost','any',()=>wardLit('frost'),`The Frost Ward is burning! The snow up there melted a tiny bit.`,{d:'ward_frost'});
B('w5','any',()=>wardLit('crag')&&wardLit('mire')&&wardLit('frost'),`Five Wards burning! I can feel it in my toes. My toes are warm.`);
B('gate0','adult',()=>G.stage==='gate',`The Obsidian Gate. Be careful up there, Ash. Wear a scarf.`);
B('cinder1','any',()=>dBd('cindervane'),`The Obsidian Gate is open! My granddad said that would never happen.`,{d:'boss_cindervane'});
B('cinder2','any',()=>dCh('cinder','ally'),`Sir Cindervane is on your side now? The big burning knight? Wow.`,{d:'ch_cinder_ally'});
B('summit0','any',()=>G.stage==='summit',`Everyone keeps looking at the mountain. Good luck, Ash. We mean it.`);
B('done1','any',()=>!!G.flags.act1_done,`You did it, Ash. The whole valley is talking about you.`,{d:'done'});
B('done2','kid',()=>!!G.flags.act1_done,`When I grow up I want to be you. But taller.`,{d:'done'});
B('done3','adult',()=>!!G.flags.act1_done,`The biggest Lantern Day in a thousand years. And you were the best part.`,{d:'done'});
// --- Ember's Trials
B('jump1','any',()=>dAb('jump'),`I saw you jump right over a fence! Do it again!`,{d:'trial_jump'});
B('jump2','kid',()=>dAb('jump'),`Can you jump over my house? Over the chimney? Please?`,{d:'trial_jump'});
B('stride1','any',()=>dAb('stride'),`Somebody saw you walking ON Lake Mirrow. On top of it!`,{d:'trial_stride'});
B('stride2','town:brindle|!id:dell',()=>dAb('stride'),S(`Dell says you walked right across the lake. He dropped his sandwich in it.`,`Dell saw you walk on the lake. He dropped his sandwich!`),{d:'trial_stride'});
B('wings1','any',()=>dAb('wings'),`WINGS! Ash has WINGS! I need to sit down.`,{d:'trial_wings'});
B('wings2','kid',()=>dAb('wings'),`Can you give me a ride? Just one? Just to the bakery?`,{d:'trial_wings'});
B('wings3','adult',()=>dAb('wings'),`All three of Ember's Trials? Your great-great-lots-of-greats grandma would be proud.`,{d:'trial_wings'});
B('trial2','adult',()=>dAb('jump')&&dAb('stride')&&!dAb('wings'),`Two Trials done! One more and you'll be flying, they say.`);
// --- weapons
B('ham1','any|!id:maren',()=>dEq('hammer'),`Nice hammer. Mom made that?`,{d:'wpn_hammer'});
B('ham2','id:maren',()=>dEq('hammer'),`That hammer suits you. Swing from the hips, like I showed you.`,{d:'wpn_hammer'});
B('dag1','any',()=>dEq('daggers'),`Twin daggers! Twice as pointy. Be careful with those.`,{d:'wpn_daggers'});
B('spear1','any|!id:pell',()=>dEq('spear'),`Is that Pell's spear? I hope you haggled.`,{d:'wpn_spear'});
B('spear2','id:pell',()=>dHw('spear'),`How's that spear treating you? No refunds. Well. Maybe one.`,{d:'wpn_spear'});
B('boom1','any',()=>dEq('boomerang'),`Does your boomerang come back? Mine is still stuck in a tree.`,{d:'wpn_boomerang'});
B('bow1','adult',()=>dEq('bow'),`A bow! Can you hit an apple? Not on my head, please.`,{d:'wpn_bow'});
B('bow2','kid',()=>dEq('bow'),`Teach me archery! I'll be the target. No wait.`,{d:'wpn_bow'});
B('sword1','id:maren',()=>G.weapon==='sword'&&G.tier>=2,`Grandmother's sword looks sharper every day. Keep it oiled.`);
// --- side quests
B('seek1','town:brindle',()=>qDone('seek'),`You found Jem in the BARREL? Jem has been in that barrel since spring.`,{d:'q_seek'});
B('seek2','kid|!id:nib',()=>qDone('seek'),`Nib says you're the best seeker ever. Nib NEVER says that!`,{d:'q_seek'});
B('thief1','town:brindle|!id:pell',()=>qDone('thief'),`Pell says you outran a kobold. Pell talks a lot, but I believe it.`,{d:'q_thief'});
B('pump1','town:village|!id:hal',()=>qDone('pumpkins'),`Gertrude the pumpkin is safe! Hal threw her a little party.`,{d:'q_pumpkins'});
B('race1','town:lodge|!id:elka',()=>qDone('race'),`You beat Elka? Nobody beats Elka. She's still sulking in the snow.`,{d:'q_race'});
B('race2','id:rook',()=>qDone('race'),`Elka wrote me that you beat her! She drew you as a big red blur.`,{d:'q_race'});
B('song1','town:village|!id:wendel',()=>qDone('song'),`Wendel plays the Lantern Waltz every single night now. Thanks. I think.`,{d:'q_song'});
B('pie1','town:brindle|!id:mayor',()=>qDone('pie'),`The pie mystery is solved! I knew it was the mustache all along.`,{d:'q_pie'});
B('pie2','adult|!id:mayor',()=>qDone('pie'),`Don't tell anyone, but I heard the Mayor sleep-bakes.`,{d:'q_pie'});
B('swap1','any|!id:hal',()=>qDone('swap'),`A wheel of cheese for a piece of a star? Hal's grandpa only got a cow.`,{d:'q_swap'});
B('bun1','town:village|town:brindle|!id:bertram,tilly',()=>qDone('bun'),`Bertram and Tilly are talking again. All thanks to one exploding bun.`,{d:'q_bun'});
B('hollow1','town:village|!id:rook',()=>qDone('hollow'),`Rook won't stop telling everyone how you saved Juniper.`,{d:'q_hollow'});
B('duch1','town:farm|town:lodge',()=>qDone('duchess')&&G.comp!=='duchess',`Duchess is home! She's ignoring everyone again. Back to normal.`,{d:'q_duchess'});
B('horn1','town:lodge|!id:ulf',()=>qDone('horn'),`Ulf's horn is back! Now the whole lodge wakes up at dawn. Hooray.`,{d:'q_horn'});
B('mine1','town:copper|!id:pick',()=>qDone('mine'),`The mine is safe again! Pick and Shovel only scream a little now.`,{d:'q_mine'});
B('lure1','any|!id:dell',()=>qDone('lure'),`Dell has a new boat! The Soggy Biscuit Two. It floats. Mostly.`,{d:'q_lure'});
B('dell1','town:brindle|!id:dell',()=>qDone('dell'),`Dell tells everyone about your three fish. They get bigger every time.`,{d:'q_dell'});
B('bounty1','town:brindle|!id:osric',()=>qDone('bounty'),`Captain Osric wrote your name on the bounty board. In gold ink!`,{d:'q_bounty'});
B('bounty2','any|!id:osric',()=>qDone('bounty2'),`The Big Bounty! Osric says you're his best Watch helper ever. Except the dogs.`,{d:'q_bounty2'});
B('kettle1','town:way|town:brindle|!id:hob',()=>qDone('kettle'),`Hob got his kettle back! The Smoky Kettle is smoky again.`,{d:'q_kettle'});
B('fenF','any|!id:fennick',()=>dCh('fennick','forgive'),`Fennick lights every lantern in town now. Even the ones already lit.`,{d:'ch_fennick_forgive'});
B('fenJ','any|!id:fennick',()=>dCh('fennick','jail'),`Fennick's in Osric's cell, polishing the bars. Very shiny bars.`,{d:'ch_fennick_jail'});
B('pages1','town:brindle|!id:wren',()=>pageN()>=3,`Sister Wren says you found pages of the Wardens' book. She did a little dance.`,{d:'pages3'});
B('pages2','any|!id:wren',()=>pageN()>=10,`All ten pages! Wren is going to write a whole new book. About you.`,{d:'pages10'});
B('moss1','town:village|town:mire|!id:moss',()=>qDone('moss'),S(`Granny Moss got her basket! And she wrote back. One whole sentence.`,`Granny Moss got her basket. She wrote back!`),{d:'q_moss'});
// --- secrets Ash found
B('knight','any',()=>!!G.found.knight,`Sir Ash, Knight of the Turnips! I heard. Very fancy.`,{d:'f_knight'});
B('barkley','any',()=>!!G.found.barkley,`You beat Old Barkley's riddles? Nobody does that. He must be so grumpy.`,{d:'f_barkley'});
B('carrot','any',()=>!!G.found.carrot,`Is that the Carrot of Destiny? Don't eat it. Probably.`,{d:'f_carrot'});
B('fairy','adult',()=>!!G.found.fairy,`You look lucky today. Mushroom ring lucky.`,{d:'f_fairy'});
B('thaw1','town:lodge|!id:brisket',()=>!!G.flags.brisket_thawed,`You melted Brisket out of the ice! He hasn't stopped talking since.`,{d:'thaw'});
B('dig1','any',()=>!!(G.found.x1||G.found.x2||G.found.x3),`Somebody dug up treasure out in the wilds. Was it you? It was you.`,{d:'f_dig'});
B('best1','adult',()=>CAST.some(c=>!c.generic&&friendOf(c.id)>=5),()=>{ const c=CAST.find(q=>!q.generic&&friendOf(q.id)>=5); return `I hear you and ${shortName(c.id)} are best friends now. That's sweet.`; });
// --- Pip and the companions (with a reply from the friend in question)
B('pip1','any',pipNear,`Is that a baby dragon? He's so small! Can I pet him?`,{r:['pip','Mip!']});
B('pip2','kid',pipNear,`Your little dragon just sneezed on my boots. Best day ever!`,{r:['pip','Mip mip!']});
B('pip3','adult',pipNear,S(`Your little friend keeps chewing my shoelace. I don't mind. Much.`,`Your little dragon chews my shoelace!`),{r:['pip','Mrrp?']});
B('pip4','any',pipNear,`Mip! ...Sorry. I've been practicing.`,{r:['pip','Mip?']});
B('pip5','id:maren',()=>!!G.flags.pip,S(`Pip's been at the nail box again. I'm missing six nails and he's very pleased with himself.`,`Pip ate my nails again. He looks happy.`));
B('duC1','any|!id:hollis',()=>compNear('duchess'),`Is that a goat following you?`,{r:['duchess','Meh.']});
B('duC2','any',()=>compNear('duchess'),`Why is your goat wearing a tiara?`,{r:['duchess','(Duchess does not explain herself.)']});
B('duC3','adult',()=>compNear('duchess'),`That goat is looking at me like I owe her money.`,{r:['duchess','Meh.']});
B('duC4','id:hollis',()=>compNear('duchess'),`Duchess! Be good! ...She won't be good.`,{r:['duchess','Meh.']});
B('brC1','any|!id:ulf,elka',()=>compNear('brisket'),`Is that Brisket? I thought he was a big ice cube!`,{r:['brisket',`Not anymore! Now I'm a regular cube.`]});
B('brC2','adult',()=>compNear('brisket'),`Brisket told me a joke this morning. I'm still waiting for it to be funny.`,{r:['brisket',`It'll hit you later!`]});
B('brC3','town:lodge',()=>compNear('brisket'),`Brisket! Your room still has a puddle in it.`,{r:['brisket',`That's MY puddle! Don't touch it!`]});
B('juC1','any|!id:rook',()=>compNear('juniper'),`Juniper! Put me on your map! Draw me tall!`,{r:['juniper',`I'll draw you SUPER tall.`]});
B('juC2','id:rook',()=>compNear('juniper'),`Juniper! Bring me back a cave rock! A shiny one!`,{r:['juniper',`Only if you feed my newt!`]});
B('juC3','town:village|!id:rook',()=>compNear('juniper'),`The Ashby girl is out mapping again. With a dragon this time.`,{r:['juniper',`Best mapping buddy ever.`]});
B('grC1','any',()=>compNear('greymane'),`THAT'S A WOLF. A huge... friendly... wolf. Hi, wolf.`,{r:['greymane','*wag wag*']});
B('grC2','kid',()=>compNear('greymane'),`Is he a good boy? He looks like a good boy!`,{r:['greymane','*very good boy noises*']});
B('grC3','adult',()=>compNear('greymane'),`Keep that wolf away from my chickens. Please. Nice wolf.`,{r:['greymane','*huff*']});
// --- weather, time, places, Ash himself
B('rain1','any',rainy,`Rain, rain. Ash, come stand under my hat.`);
B('rain2','adult',rainy,`Wet dragon smell. Lovely. Really.`);
B('rain3','kid',rainy,`Puddles! Want to jump in puddles with me?`);
B('rain4','any',rainy,S(`Don't breathe fire at the rain, Ash. It just makes steam, and then everybody's hair goes frizzy.`,`Don't breathe fire at the rain. It makes steam!`));
B('night1','adult',isNight,`Out late, Ash? Mind the wolves.`);
B('night2','any',isNight,`The stars are out. Professor Quill must be so happy.`);
B('night3','kid',isNight,`I'm not sleepy. I'm NOT. ...Okay, a little.`);
B('night4','adult',isNight,`Your eyes glow in the dark a little. Did you know that?`);
B('morn','adult',()=>G.tod>0.25&&G.tod<0.36,`Morning, Ash! The early dragon gets the... worm? Gross.`);
B('snow1','town:lodge|town:farm',()=>!AREA,`Brr! Breathe on my hands, would you? Just a little.`);
B('snow2','town:lodge',()=>!AREA,`If you're cold, stand next to Ash. Best heater in the valley.`);
B('copper1','town:copper',ALWAYS,`Mind the carts. And the rocks. And the soup.`);
B('vill1','town:village|!id:maren',()=>!!G.flags.forge,`Your mom's forge is ringing again. Best sound in Emberhollow.`);
B('brin1','town:brindle|!id:pell',ALWAYS,`Market day! Pell has new socks. With holes. On purpose.`);
B('low1','adult',lowHp,`You look singed. Sit down a minute. Drink something green.`);
B('low2','kid',lowHp,`Are you okay? You look like a burnt marshmallow.`);
B('low3','id:mabel,moss',lowHp,S(`You're hurt! Drink a draught, Ash, and sit down before you fall down.`,`You're hurt! Drink a draught and sit down.`));
B('coins1','any',()=>(G.coins||0)>=150,`You're jingling, Ash. Spend some at Pell's!`);
B('lvl1','adult',()=>player.level>=5,`You've grown, Ash. Your tail is longer. I think.`,{d:'lvl5'});
B('lvl2','kid',()=>player.level>=8,()=>`Level ${player.level}? That's like a million in dragon years.`);
B('hat1','any|!id:marigold',()=>!!G.hat&&!!HATLINE[G.hat],()=>HATLINE[G.hat]);
B('hat2','any|!id:marigold',()=>!!G.hat&&!HATLINE[G.hat],`Nice hat, Ash! Marigold would approve.`);
B('hat3','id:marigold',()=>!!G.hat,S(`That hat! On you! Turn round, I need to see the back.`,`That hat! Turn around, let me see!`));
B('hat4','id:marigold',()=>!G.hat,S(`No hat today? I'm trying not to take it personally.`,`No hat today? Oh well.`));
// --- Lantern Day and the early story
B('lant1','any',()=>G.stage==='lanterns'||G.stage==='wake',`Happy Lantern Day! Gently with those lanterns, Ash.`);
B('lant2','kid',()=>G.stage==='lanterns'||G.stage==='wake',`Did you see the dragon buns? I ate four.`);
B('lant3','adult',()=>G.stage==='lanterns',`Happy Lantern Day, Ash! Try not to light anything that isn't a lantern.`);
B('lore1','town:village|!id:yara',()=>G.stage==='lore',`Elder Yara is looking for you. Something about old stories.`);
B('wren1','town:brindle|!id:wren',()=>G.stage==='wren',`Sister Wren is in the library. She says she's been waiting for a dragon.`);
// --- people being themselves
B('maren1','id:maren',ALWAYS,`Did you eat? Dragons need breakfast too.`);
B('maren2','id:maren',()=>compNear(G.comp),()=>`Bring ${CDEF[G.comp].name} by for supper sometime.`,{r:['comp','come']});
B('yara1','id:yara',ALWAYS,S(`Pebble left a button on your windowsill this morning. That means she likes you.`,`Pebble left you a button. She likes you.`));
B('nana1','id:nana',ALWAYS,`Do you need a sweater? You look like you need a sweater.`);
B('nana2','id:nana',rainy,`Rain! Where is your sweater? I KNITTED you a sweater.`);
B('bert1','id:bertram',ALWAYS,`Fresh buns! Only one of them explodes. Probably.`);
B('rook1','id:rook',()=>dAb('wings'),`When I grow up I'm going to fly. Like you!`);
B('rook2','id:rook',ALWAYS,`Teach me to breathe fire! I've been practicing. I just cough.`);
B('elka1','id:elka',ALWAYS,`Race you to that tree! ...Never mind. You'd win.`);
B('nib1','id:nib',ALWAYS,`Want a treasure map? This one's of a cat. The cat is the treasure.`);
B('tam1','id:tamsin',ALWAYS,`Ooh, that face! That's going in my next song.`);
B('tam2','id:tamsin',()=>compNear(G.comp),()=>`A song about Ash and ${CDEF[G.comp].name}! What rhymes with ${CDEF[G.comp].name}? Hmm.`,{r:['comp','hello']});
B('quill1','id:quill',ALWAYS,`Did you know stars are just very far away fires? Like you, but farther.`);
B('osric1','id:osric',ALWAYS,`Halt! Oh, it's you. Carry on, hero. Wipe your feet.`);
B('mayor1','id:mayor',()=>dSt('wren')&&!qDone('pie'),`Have you seen my prize pie? No? Nobody has. Suspicious.`);
B('pell1','id:pell',ALWAYS,`Psst! New stock! Mostly spoons. Fancy spoons.`);
B('dell2','id:dell',ALWAYS,`The fish aren't biting today. They're nibbling. Rudely.`);
B('gorran1','id:gorran',ALWAYS,`Tell your mom Old Gorran says hello. And that I still owe her a hammer.`);
B('holl1','id:hollis',()=>G.comp!=='duchess',`Duchess is in a mood. Duchess is always in a mood.`);
B('ulf1','id:ulf',ALWAYS,`People think I hunt wolves. I prefer sheep. To look at.`);
B('hob1','id:hob',ALWAYS,S(`Lost my scarf again. Don't tell Marigold. She'll only knit another one.`,`I lost my scarf again. Don't tell Marigold!`));
B('moss2','id:moss',ALWAYS,`My frog says you smell like smoke. He means it nicely.`);
B('mabel1','id:mabel',ALWAYS,`Mind the herbs! The purple ones bite.`);
B('wend1','id:wendel',ALWAYS,`Want to hear a new tune? It's called "Ash Walks By".`);
B('fen1','id:fennick',()=>dCh('fennick','forgive'),`Lantern number forty-one, lit! For you, Ash.`);
B('hal1','id:hal',ALWAYS,`Want some cheese? I have SO much cheese.`);
B('tilly1','id:tilly',ALWAYS,`There's a room at the Sleepy Salmon for you, any time. The bed's only a little lumpy.`);
B('wren2','id:wren',()=>pageN()>0,()=>`${pageN()} of the Wardens' pages! I've read them all eleven times.`);
B('cookie1','id:cookie',ALWAYS,`Rock Soup? It's mostly rocks. Good rocks.`);
B('pick1','id:pick',ALWAYS,`We're officially scared of the mine. Both of us. Officially.`);
B('jun1','id:juniper',ALWAYS,`I'm mapping the whole valley! Want to help? You can hold the pencil.`);
B('jun2','id:juniper',()=>canRecruit('juniper')&&G.comp!=='juniper',`If you're going exploring, take me! I'm a great mapper.`);
B('bris1','id:brisket',ALWAYS,`Still a bit damp. But warm! Warm is good.`);
B('bris2','id:brisket',()=>canRecruit('brisket')&&G.comp!=='brisket',`Need a sword arm? Mine's thawed now. Just ask!`);
B('morrow1','id:morrow',()=>dCh('morrow','free'),`Pumpkins, Ash! Pumpkins that aren't on fire!`);
// --- neighbours with opinions
B('gen1','gen',ALWAYS,`Lovely weather for a dragon.`);
B('gen2','gen',ALWAYS,`Have you seen my cat? She's orange. Like you!`);
B('gen3','gen',ALWAYS,S(`That goose chased me again this morning. I don't know what I did to it.`,`A goose chased me again!`));
B('gen4','gen',ALWAYS,`Mind the puddle. It's deeper than it looks. Ask my left boot.`);
B('gen5','gen',()=>dSt('lore'),S(`My nephew bet me your horns are hot. Are they? Can I touch one? No? Okay.`,`Are your horns hot? Can I touch one? No? Okay.`));
B('gen6','gen',ALWAYS,S(`I've been weeding since sunrise. My back is one big knot.`,`I weeded all morning. My back hurts.`));
B('gen7','gen',()=>!!G.flags.forge,`Careful with that sword near my washing line.`);
B('gen8','gen|kid',()=>dSt('warcamp'),`My cousin says dragons are scary. I told him about you. Now he wants to meet you.`);
// live reactions when Ash flies, jumps or walks on water nearby
const LIVE={
  fly:[['any',`Ash, did you just FLY over my house?`],['any',`Look! Up in the sky! It's Ash!`],['adult',`Don't land on my roof! I just fixed it!`],['kid',`MOM! MOM! Ash is FLYING!`],['any',`Show-off! ...Do a loop!`]],
  jump:[['any',`Boing! Nice jump!`],['adult',`You bounce like a frog. A dragon frog.`],['kid',`Higher! Higher!`],['adult',`Careful! You'll bump your horns on a cloud.`]],
  water:[['any',`You're walking on the WATER. Show-off.`],['kid',`Don't splash me! ...Okay, splash me a little.`],['adult',`Dell is going to be so jealous. He needs a boat for that.`]]
};
for(const k in LIVE) LIVE[k]=LIVE[k].map(([w,t])=>({w:whoFn(w),t}));
// chats between two villagers: lines are [0 or 1, text] (0 is the first speaker)
const CHATS=[];
function VCH(k,a,b,c,l){ CHATS.push({k,a:whoFn(a),b:whoFn(b),c,l}); }
VCH('grizz','any','any',()=>dBd('grizzlefang'),[[0,`Did you hear? Ash beat Grizzlefang!`],[1,`The kobold chieftain? Our Ash?`],[0,`Our Ash!`]]);
VCH('pip','any','any',pipNear,[[0,`Look at the little dragon!`],[1,`He's chewing on my shoelace.`],[0,`Lucky shoelace.`]]);
VCH('rain','any','any',rainy,[[0,`Think it'll stop raining?`],[1,`Ask Ash to breathe on the clouds.`],[0,`That's not how clouds work.`],[1,`Isn't it?`]]);
VCH('night','adult','any',isNight,[[0,`Did you hear the wolves last night?`],[1,`That was my uncle snoring.`]]);
VCH('duch','any','any',()=>compNear('duchess'),[[0,`Is that Duchess?`],[1,`She's judging us.`],[0,`She judges everyone. It's her job.`]]);
VCH('buns','town:village','town:village',()=>dSt('lore'),[[0,`Bertram's buns exploded again.`],[1,`Again?`],[0,`Three times this week. It's a record.`]]);
VCH('pie','town:brindle|!id:mayor','town:brindle|!id:mayor',()=>qDone('pie'),[[0,`Did the Mayor really eat his own pie?`],[1,`You didn't hear it from me.`],[0,`I didn't hear it from anyone.`]]);
VCH('wings','any','any',()=>dAb('wings'),[[0,`Ash can FLY now.`],[1,`My cousin can fly.`],[0,`Your cousin fell off a roof.`],[1,`Briefly, he flew.`]]);
VCH('stride','any','any',()=>dAb('stride'),[[0,`Ash walked right across Lake Mirrow!`],[1,`Dell will want a ride.`],[0,`Dell will want a boat that doesn't sink.`]]);
VCH('sock','any','any',ALWAYS,[[0,`Lovely day.`],[1,`Is it? I lost a sock.`],[0,`Ask Nib. Nib sells maps to socks.`]]);
VCH('soup','adult','adult',ALWAYS,[[0,`What's for supper?`],[1,`Rock Soup.`],[0,`Again?`],[1,`Cookie sent it. You can't say no to Cookie.`]]);
VCH('hammer','any','any',()=>dHw('hammer'),[[0,`Maren made Ash a hammer!`],[1,`Bet it's heavier than my aunt's fruitcake.`],[0,`Nothing is heavier than that fruitcake.`]]);
VCH('brisk','any|!id:brisket','any|!id:brisket',()=>compNear('brisket'),[[0,`Brisket was frozen for how long?`],[1,`Since Tuesday.`],[0,`Which Tuesday?`],[1,`Nobody knows.`]]);
VCH('wolf','any','any',()=>compNear('greymane'),[[0,`There's a giant wolf in town!`],[1,`It's with Ash.`],[0,`...Is that better or worse?`],[1,`It's wagging. Better.`]]);
VCH('wards','any','any',()=>wardLit('crag')&&wardLit('mire')&&wardLit('frost'),[[0,`Can you feel it? The Wards are warm.`],[1,`That's just my tea.`],[0,`No, really. Feel the air.`],[1,`...Oh. Oh, that's nice.`]]);
VCH('lbuns','any','any',()=>G.stage==='lanterns',[[0,`Have you seen the dragon buns?`],[1,`I ate four.`],[0,`They were decorations!`]]);
VCH('map','any','any',()=>compNear('juniper'),[[0,`Juniper is drawing a map of us.`],[1,`Make my nose smaller!`]]);
VCH('over','any','any',()=>!!G.flags.act1_done&&G.stage==='done',[[0,`Is it really over?`],[1,`Ash says so.`],[0,`Then I'm having a nap.`]]);
VCH('cold','town:lodge','town:lodge',()=>!AREA,[[0,`Cold today.`],[1,`It's always cold. It's the Frostpine.`],[0,`Colder than always, then.`]]);
VCH('rhyme','id:tamsin','id:hob',ALWAYS,[[0,`Hob, what rhymes with Ash?`],[1,`Cash? Splash? Mustache?`],[0,`Mustache! Perfect!`]]);
VCH('race','id:elka','id:brisket',()=>G.comp!=='brisket',[[0,`Brisket, race me!`],[1,`I'm still thawing!`],[0,`Excuses!`]]);
VCH('mine','id:gorran','id:pick',ALWAYS,[[0,`Back to work, you two.`],[1,`In the MINE? It has bats!`],[0,`It's a mine. Of course it has bats.`]]);
VCH('wagon','id:pell','id:nib',ALWAYS,[[0,`Nib, stop selling maps of my wagon.`],[1,`But your wagon is a treasure!`],[0,`...It is, isn't it.`]]);
VCH('pie2','id:mayor','id:nib',()=>!!G.quests.pie&&!qDone('pie'),[[0,`Nib! Did you eat my pie?`],[1,`I was hiding from your dog all night!`],[0,`Hmm. Likely story.`]]);
VCH('old','id:rook','id:yara',ALWAYS,[[0,`Elder Yara, were you alive when the Wardens were?`],[1,`I'm old, Rook. Not THAT old.`]]);
VCH('breath','any','any',()=>!!G.flags.forge,[[0,`Did you see Ash breathe fire?`],[1,`I felt it. My eyebrows are still warm.`]]);
VCH('goat','adult','any',ALWAYS,[[0,`I'm going to name my goat Ash.`],[1,`You don't have a goat.`],[0,`I'll get one. Then I'll name it Ash.`]]);
VCH('mip','any','any',()=>!!G.flags.pip,[[0,`What does "Mip" mean?`],[1,`I think it means "Mip".`],[0,`Deep.`]]);
VCH('three','adult','adult',()=>G.stage==='three',[[0,`Three Wards, three monsters.`],[1,`Ash has done harder things.`],[0,`Name one.`],[1,`He ate one of Bertram's buns.`]]);
VCH('whisper','any','any',isNight,[[0,`Why are you whispering?`],[1,`It's night. You whisper at night.`],[0,`...Why?`],[1,`I don't know! Everyone does it!`]]);
VCH('hat','any','any',()=>!!G.hat,[[0,`Did you see Ash's hat?`],[1,`Marigold must be thrilled.`]]);
VCH('osric','id:osric','any',()=>dCh('morrow','jail'),[[0,`Morrow alphabetized the cell again.`],[1,`Is that allowed?`],[0,`I don't know. It's very tidy.`]]);
// greetings: the first line of a talk can be about the latest big thing Ash did. [who, text]; 'deed@id' overrides for one person
const DGREET={
  boss_grizzlefang:[['any',`Ash! Is it true? You beat Grizzlefang?`],['adult',`The kobold chieftain, gone! Thanks to you, Ash.`]],
  'boss_grizzlefang@maren':[['any',`My kid beat the kobold chieftain. MY kid. I'm telling everyone.`]],
  'boss_grizzlefang@yara':[['any',S(`Grizzlefang is gone, and you came home in one piece. That's the part I care about.`,`Grizzlefang is gone, and you are home safe. Good.`)]],
  boss_morrow:[['any',`Ash! The Scaled Oath is broken. People say you did it.`]],
  ward_ash:[['any',`I saw the Ash Ward burning from my window. That was you, wasn't it?`]],
  boss_broodmother:[['any',`No more drakelings over the hills! You're amazing, Ash.`]],
  boss_gloamjaw:[['any',`You went into the Mirefen and came back out! And you beat the thing in there!`]],
  boss_greymane:[['any',`They say you faced Greymane himself. And you're still here!`]],
  boss_cindervane:[['any',`The Obsidian Gate stands open! Ash, you're a legend.`]],
  'boss_cindervane@yara':[['any',`The Gate is open. The summit waits. Be careful, Ash.`]],
  done:[['any',`Hello, hero. Hello, Ash. I like saying both.`],['kid',`It's ASH! The real one! Hi!`]],
  trial_jump:[['any',`Was that you bouncing over the hedges? The Trial of the Leap, they say!`]],
  trial_stride:[['any',`Ash! Somebody saw you walk across the lake. Like it was a floor!`]],
  trial_wings:[['any',`Ash! You can FLY! Is that a thing now? That's a thing now.`]],
  'trial_wings@maren':[['any',`You can fly. You can FLY. Promise me you'll land gently.`]],
  'trial_wings@rook':[['any',`YOU CAN FLY! Teach me! Throw me! Something!`]],
  wpn_hammer:[['any',`Is that a new hammer? Your mom does good work.`]],
  'wpn_hammer@maren':[['any',`How's the hammer? Heavy, right? That's how you know it's good.`]],
  wpn_bow:[['any',`A bow! Where did you find that?`]],
  wpn_boomerang:[['any',`I heard you've got a boomerang now. I'll duck if you say duck.`]],
  wpn_daggers:[['any',`Pell's twin daggers! You earned those, I hear.`]],
  wpn_spear:[['any',`Got yourself a spear! Point it away from me, please.`]],
  q_seek:[['town:brindle',`Ash! Found any more kids in barrels?`]],
  q_pie:[['town:brindle|!id:mayor',`Ash! Don't worry, the Mayor's secret is safe with me. Mostly.`]],
  q_race:[['town:lodge|!id:elka',`Ash! Faster than Elka! Who knew?`]],
  'q_hollow@rook':[['any',S(`Ash! Juniper says you're her hero. Her second hero. I'm first. Brothers always come first.`,`Juniper says you are her hero! Her second one. I'm first.`)]],
  pip:[['any',`Ash! I heard you have a baby dragon now! Where is he?`]],
  'pip@maren':[['any',`Is Pip eating properly? He ate my tongs.`]],
  ch_greymane_ally:[['any',`Is it true Greymane stands with you now? The giant wolf? Wow.`]],
  ch_greymane_home:[['adult',`They say you sent Greymane home to his family. That was kind, Ash.`]],
  ch_morrow_free:[['adult',`You let Morrow go? To grow pumpkins? People can change, I suppose.`]],
  ch_morrow_jail:[['adult',`Morrow's in a cell now. Osric says he's the tidiest prisoner ever.`]],
  ch_fennick_forgive:[['town:village|!id:fennick',`Fennick says you gave him a second chance. He's been lighting lanterns ever since.`]],
  comp_brisket:[['any',`I see you've thawed out a friend!`]],
  comp_juniper:[['town:village|!id:rook',`Out exploring with Juniper? Bring her back by supper!`]],
  comp_duchess:[['adult',`Is it true you're travelling with a GOAT now?`]],
  comp_greymane:[['any',`There's a wolf the size of a cart following you around. Just so you know.`]],
  f_knight:[['any',`Ah, Sir Ash of the Turnips! Welcome.`]],
  pages3:[['town:brindle',`Wren says you're finding the Wardens' pages! History, Ash. History!`]],
  ward_crag:[['any',`Another Ward burning! The Crag Ward, they say.`]],
  ward_mire:[['any',`The Sunken Ward is burning again! Even the frogs look happier.`]],
  ward_frost:[['any',`The Frost Ward is lit! I bet it's a bit warmer up there now.`]],
  q_mine:[['town:copper',`The mine's safe! Ash, you're welcome in Coppergulch any day.`]],
  thaw:[['town:lodge|!id:brisket',`You melted Brisket! Thanks, I think. He talks a LOT.`]]
};
function deedGreet(id){
  if(!G||G.mode!=='story'||!G.deeds) return null;
  const c=CASTBY[id]||SPECIAL[id]; if(!c) return null;
  syncDeeds();
  const info=npcInfo({id}), seen=G.seenTalk=G.seenTalk||{};
  const keys=Object.keys(G.deeds).filter(k=>(DGREET[k]||DGREET[k+'@'+id])&&(!k.startsWith('comp_')||G.comp===k.slice(5)));
  if(!keys.length) return null;
  keys.sort((a,b)=>(typeof G.deeds[b]==='number'?G.deeds[b]:0)-(typeof G.deeds[a]==='number'?G.deeds[a]:0)||(DEED_PRI[b]||1)-(DEED_PRI[a]||1));
  for(const k of keys.slice(0,3)){
    if(seen['dg_'+id+'_'+k]) continue;
    const L=(DGREET[k+'@'+id]||DGREET[k]).filter(([w])=>whoFn(w)(info)); if(!L.length) continue;
    if(Math.random()>(DAGE(k)<900?0.75:0.35)) return null;
    seen['dg_'+id+'_'+k]=1;
    return pick(L)[1];
  }
  return null;
}
// ---------- the bark engine
const BK={g:null,next:0,said:{},npcT:{},chat:null,chatNext:0,checkT:0,syncT:0,flyT:0,jumpT:0,waterT:0,log:[]};
function blog(who,text){ BK.log.push([Math.round(G.time*10)/10,who,text]); if(BK.log.length>200) BK.log.shift(); }
function villagerBarks(dt){
  if(!G||G.mode!=='story'||!player) return;
  if(BK.g!==G){ BK.g=G; BK.said={}; BK.npcT={}; BK.chat=null; BK.next=G.time+7; BK.chatNext=G.time+16; BK.log.length=0; }
  BK.syncT-=dt; if(BK.syncT<=0){ BK.syncT=2; syncDeeds(); }
  if(scene!=='play'||player.dead) return;
  const list=AREA?AREA.npcs:G.npcs; if(!list||!list.length) return;
  if(BK.chat){ runChat(dt); return; }
  liveBarks(list);
  BK.checkT-=dt; if(BK.checkT>0) return; BK.checkT=0.5;
  if(G.inCombat||G.mini||(G.boss&&!G.boss.dead)) return;
  if(G.time>=BK.next){ const n=barkTarget(list,215,45); if(n){ const b=pickBark(n); if(b){ sayBark(n,b); BK.next=G.time+rand(7,12); } else BK.next=G.time+3; } }
  if(G.time>=BK.chatNext){ BK.chatNext=G.time+rand(6,10); tryChat(list); }
}
function npcOK(n){ return n&&!n.turtle&&n.kind!=='goat'&&n.id!=='shellby'&&(CASTBY[n.id]||SPECIAL[n.id]); }
function barkTarget(list,R,cool){
  let best=null, bd=R*R;
  for(const n of list){ if(!npcOK(n)) continue; const d=dist2(n.x,n.y,player.x,player.y); if(d>bd||!inView(n.x,n.y,-20)||bubbleOn(n)) continue; if(G.time-(BK.npcT[n.id]==null?-999:BK.npcT[n.id])<cool) continue; bd=d; best=n; }
  return best;
}
function barkCount(k){ return ((G.flags.comp_bk||{})[k])|0; }
function pickBark(n){
  const info=npcInfo(n), cand=[]; let tot=0;
  for(const b of BARKS){
    if(!b.w(info)) continue;
    if(BK.said[b.k]!=null&&G.time-BK.said[b.k]<480) continue;
    if(b.d&&barkCount(b.k)>=3) continue;
    let ok=false; try{ ok=!!b.c(); }catch(e){ ok=false; } if(!ok) continue;
    let w=b.r?2.2:1; if(b.d){ const age=DAGE(b.d); w*=age<300?5:age<1500?2.4:0.8; }
    if(b.c===ALWAYS) w*=0.8;
    cand.push([b,w]); tot+=w;
  }
  if(!cand.length) return null;
  let r=Math.random()*tot; for(const [b,w] of cand){ r-=w; if(r<=0) return b; } return cand[cand.length-1][0];
}
function npcBubble(n,text){ const s=SPK[n.id]; n.face=angTo(n.x,n.y,player.x,player.y); blog(n.id,text); return bubble(n,text,{who:shortName(n.id),col:s?s.col:'#d8c3a0',dy:npcMarker(n.id)?-46:-34}); }
function sayBark(n,b){
  const text=typeof b.t==='function'?b.t(n):b.t; if(!text) return;
  BK.said[b.k]=G.time; BK.npcT[n.id]=G.time;
  if(b.d){ const m=G.flags.comp_bk=G.flags.comp_bk||{}; m[b.k]=(m[b.k]|0)+1; }
  npcBubble(n,text);
  if(b.r) later(Math.min(2.4,1.2+text.length*0.02),()=>{ const [who,t]=b.r;
    if(who==='pip'&&G.pip){ bubble(G.pip,t,{kind:'pip',dy:-22}); csfx('chirp'); blog('pip',t); }
    else if(CM&&!CM.hidden&&!CM.outside&&(who==='comp'||who===CM.id)){ const line=who==='comp'?pickC(CM.id,t):t; const d=CDEF[CM.id]; CM.lastSay=G.time; if(CM.id==='duchess') csfx('bleat',0.8); bubble(CM,line,{who:d.name,col:d.col,dy:CM.id==='greymane'?-40:-34}); blog(CM.id,line); } });
}
function liveBarks(list){
  const p=player; let kind=null, R=0, cd=0;
  if(p.flying&&G.time>BK.flyT){ kind='fly'; R=340; cd=26; }
  else if((p.z||0)>12&&!p.flying&&G.time>BK.jumpT){ kind='jump'; R=170; cd=34; }
  else if(p.onWater&&!p.flying&&G.time>BK.waterT){ kind='water'; R=320; cd=40; }
  if(!kind) return;
  const n=barkTarget(list,R,14); if(!n) return;
  const info=npcInfo(n), opts=LIVE[kind].filter(o=>o.w(info)); if(!opts.length) return;
  BK[kind+'T']=G.time+cd; BK.npcT[n.id]=G.time; BK.next=Math.max(BK.next,G.time+4);
  if(kind==='fly') deed('flew');
  npcBubble(n,pick(opts).t);
}
function tryChat(list){
  const p=player, near=list.filter(n=>npcOK(n)&&!n.prisoner&&dist2(n.x,n.y,p.x,p.y)<380*380&&inView(n.x,n.y,-30)&&!bubbleOn(n));
  if(near.length<2) return;
  const pairs=[]; for(let i=0;i<near.length;i++) for(let j=i+1;j<near.length;j++) if(dist2(near[i].x,near[i].y,near[j].x,near[j].y)<230*230) pairs.push([near[i],near[j]]);
  if(!pairs.length) return;
  shuffle(pairs);
  const scripts=shuffle(CHATS.slice());
  for(const [x,y] of pairs){
    const ix=npcInfo(x), iy=npcInfo(y);
    for(const s of scripts){
      if(BK.said['c_'+s.k]!=null&&G.time-BK.said['c_'+s.k]<720) continue;
      let ok=false; try{ ok=!!s.c(); }catch(e){} if(!ok) continue;
      let a=null,b=null; if(s.a(ix)&&s.b(iy)){ a=x; b=y; } else if(s.a(iy)&&s.b(ix)){ a=y; b=x; } if(!a) continue;
      BK.said['c_'+s.k]=G.time; BK.chat={a,b,l:s.l,i:0,t:0.2,k:s.k};
      for(const n of [a,b]){ n.walk=false; n.wt=9; }
      return;
    }
  }
}
function runChat(dt){
  const C=BK.chat; C.t-=dt;
  if(G.inCombat||scene!=='play'||dist2(C.a.x,C.a.y,player.x,player.y)>560*560){ BK.chat=null; return; }
  C.a.face=turnTo(C.a.face,angTo(C.a.x,C.a.y,C.b.x,C.b.y),5*dt); C.b.face=turnTo(C.b.face,angTo(C.b.x,C.b.y,C.a.x,C.a.y),5*dt);
  for(const n of [C.a,C.b]){ n.walk=false; if(n.wt<2) n.wt=2; }
  if(C.t>0) return;
  if(C.i>=C.l.length){ BK.chat=null; BK.next=Math.max(BK.next,G.time+5); BK.chatNext=G.time+rand(30,48); return; }
  const [w,txt]=C.l[C.i++], n=w?C.b:C.a, other=w?C.a:C.b, s=SPK[n.id];
  blog(n.id,txt); const bb=bubble(n,txt,{who:shortName(n.id),col:s?s.col:'#d8c3a0',dy:npcMarker(n.id)?-46:-34});
  n.face=angTo(n.x,n.y,other.x,other.y);
  C.t=Math.max(1.9,(bb?bb.dur:2.5)*0.72);
}

// ================= drawing: companions, stones, rings, the melting ice, Greymane in the pines
let BLOOK=null;
function brisketLook(){ return BLOOK||(BLOOK=Object.assign({},CASTBY.brisket.look,{hold:null})); }
function compsForRender(list){
  if(!G||G.mode!=='story') return;
  // the active friend is drawn here, so their villager copy never shows twice
  if(G.comp==='brisket'||G.comp==='juniper'){ for(let i=list.length-1;i>=0;i--){ const e=list[i]; if(e&&e.kind===G.comp&&e.id===G.comp) list.splice(i,1); } }
  const c=CM&&CMG===G?CM:null;
  for(const f of CFX) if(f.k==='ring'&&inView(f.x,f.y,f.r1||100)) list.push({x:f.x,y:-1e9,draw:()=>drawCFX(f)});
  if(c&&!c.hidden&&!c.outside&&inView(c.x,c.y,70)) list.push({x:c.x,y:c.y,draw:()=>drawComp(c,1)});
  for(const L of CLEAVE) if(inView(L.x,L.y,70)) list.push({x:L.x,y:L.y,draw:()=>drawComp(L,clamp(1-L.t/1.8,0,1))});
  for(const s of CSTONES) if(inView(s.x,s.y,20)) list.push({x:s.x,y:s.y+30,draw:()=>drawStone(s)});
  for(const f of CFX) if(f.k!=='ring'&&inView(f.x,f.y,40)) list.push({x:f.x,y:f.y+80,draw:()=>drawCFX(f)});
  if(AREA) return;
  if(greyHere()&&inView(GREYW.x,GREYW.y,90)) list.push({x:GREYW.x,y:GREYW.y,draw:drawGreyWait});
  const o=iceLM(); if(o&&MELT.p>0&&!G.flags.brisket_thawed&&inView(o.x,o.y,90)) list.push({x:o.x,y:o.y+14,draw:drawMelt});
  const g=G.goat; if(g&&G.side.duchess==='home'&&canRecruit('duchess')&&!(G.comps&&G.comps.duchess)&&inView(g.x,g.y,60)) list.push({x:g.x,y:g.y+200,draw:()=>drawMarker(g.x,g.y-28,'!',G.time)});
}
function drawComp(c,alpha){
  const id=c.id, v=c.vis||(c.vis={id,kind:id}), down=c.down>0;
  v.x=c.x; v.y=c.y; v.face=c.face; v.t=c.t!=null?c.t:G.time; v.moving=!!c.moving||(c.t==null);
  ctx.save(); if(alpha<1) ctx.globalAlpha*=alpha;
  if(c.flash>0) glowAt(c.x,c.y,c.r*2.2,'255,70,50',0.5*c.flash/0.14);
  if(T3.on&&T3C[id]) T3C[id](c,v,down);
  else if(id==='brisket') drawBrisketC(c,v,down);
  else if(id==='juniper') drawJuniperC(c,v,down);
  else if(id==='duchess') drawDuchessC(c,v,down);
  else if(id==='greymane') drawGreyC(c,v,down);
  ctx.restore();
  if(c!==CM) return;
  if(down) drawDizzy(c);
  else if(c.mode==='stay') drawWaitTag(c);
  if(!down&&(id==='brisket'||id==='juniper')){ const m=npcMarker(id); if(m) drawMarker(c.x,c.y-36,m,G.time); }
}
function lieDown(c,v,fn){ ctx.save(); ctx.translate(c.x,c.y+2); ctx.rotate(0.55); const x=v.x, y=v.y; v.x=0; v.y=0; v.moving=false; fn(); v.x=x; v.y=y; ctx.restore(); }
function drawBrisketC(c,v,down){
  v.look=brisketLook();
  if(down){ v.face=-1.2; lieDown(c,v,()=>{ drawNPC(v); drawBlade(0,0,-1.2,1.2); drawShield(0,0,-1.2); }); return; }
  let f=c.face, ba=0.3; const sw=c.act==='swing'?1-clamp(c.actT/0.3,0,1):-1;
  if(sw>=0){ const e=smooth(sw); f=c.dir+lerp(-0.45,0.45,e); ba=lerp(1.5,-1.25,e); }
  v.face=f; drawNPC(v); drawBlade(c.x,c.y,f,ba); drawShield(c.x,c.y,f);
  if(sw>0.15&&sw<0.98){ ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.dir); ctx.lineCap='round';
    ctx.strokeStyle=`rgba(255,250,235,${0.75*(1-sw)})`; ctx.lineWidth=3.2; ctx.beginPath(); ctx.arc(0,0,c.r+24,lerp(1.1,-1.0,sw),1.1); ctx.stroke();
    ctx.strokeStyle=`rgba(255,220,160,${0.4*(1-sw)})`; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(0,0,c.r+19,lerp(0.95,-0.85,sw),0.95); ctx.stroke(); ctx.restore(); }
}
// Brisket's sword: an old steel blade with an iron guard in his right hand (local +y); a is the angle from straight ahead
function drawBlade(x,y,f,a){
  const k=1.1;
  ctx.save(); ctx.translate(x,y); ctx.rotate(f); ctx.translate(2.6*k,10.0*k); ctx.rotate(a); ctx.scale(k,k);
  ctx.fillStyle='rgba(28,17,12,.85)'; ctx.fillRect(-5.6,-1.6,5.2,3.2);
  ctx.fillStyle='#5a3a1e'; ctx.fillRect(-5.2,-1.1,4.6,2.2); ell(-5.8,0,1.4,1.4,'#8a929c');
  ctx.fillStyle='rgba(28,17,12,.85)'; ctx.fillRect(-1.2,-4.4,2.8,8.8); ctx.fillStyle='#9aa2ae'; ctx.fillRect(-0.8,-4,2,8);
  ctx.strokeStyle='rgba(28,17,12,.7)'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(1,-2.2); ctx.lineTo(17,-2.2); ctx.lineTo(21.5,0); ctx.lineTo(17,2.2); ctx.lineTo(1,2.2); ctx.closePath(); ctx.stroke();
  drawSteel(21.5,2.0,false,0);
  ctx.restore();
}
function drawShield(x,y,f){
  const k=1.1, L=lightLocal(f), sx=6.2*k, sy=-11.2*k, rx=4.4*k, ry=7.9*k;
  ctx.save(); ctx.translate(x,y); ctx.rotate(f);
  ctx.fillStyle='rgba(28,17,12,.85)'; ctx.beginPath(); ctx.ellipse(sx,sy,rx+0.9,ry+0.9,0,0,TAU); ctx.fill();
  ctx.fillStyle=rg(sx,sy,ry,L,'#dcae70','#94602e','#4a2a12'); ctx.beginPath(); ctx.ellipse(sx,sy,rx,ry,0,0,TAU); ctx.fill();
  ctx.strokeStyle='#a4aebc'; ctx.lineWidth=1.3; ctx.stroke();
  ctx.strokeStyle='rgba(60,30,12,.35)'; ctx.lineWidth=0.6; for(const d of [-0.5,0.5]){ ctx.beginPath(); ctx.moveTo(sx+d*rx*1.2,sy-ry*0.9); ctx.lineTo(sx+d*rx*1.2,sy+ry*0.9); ctx.stroke(); }
  ctx.strokeStyle='#b03a2a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sx,sy-ry+1); ctx.lineTo(sx,sy+ry-1); ctx.stroke();
  ell(sx+0.4,sy,1.9*k,2.3*k,'#c8ced8'); ell(sx,sy-0.7,0.7*k,0.9*k,'#ffffff');
  ctx.restore();
}
function drawJuniperC(c,v,down){
  v.look=SPECIAL.juniper.look;
  if(down){ v.face=-1.2; lieDown(c,v,()=>drawNPC(v)); return; }
  const f=c.face; v.face=f; drawNPC(v);
  // the sling in her right hand: it whirls before a throw
  const k=0.96, hx=2.4*k, hy=9.8*k;
  ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(f); ctx.lineCap='round';
  let px,py; if(c.act==='sling'){ const a=G.time*30; px=hx+Math.cos(a)*7.5; py=hy+Math.sin(a)*7.5; ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(hx,hy,7.5,0,TAU); ctx.stroke(); }
  else { px=hx-3.5; py=hy+3.2+Math.sin(G.time*3)*0.6; }
  ctx.strokeStyle='#6a4a2a'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(px,py); ctx.stroke();
  ell(px,py,1.9,1.5,'#7a5432'); ell(px-0.3,py-0.3,1.0,0.8,'#9a9288');
  ctx.restore();
  if(c.point){ const a=angTo(c.x,c.y,c.point.x,c.point.y); ctx.save(); ctx.translate(c.x+Math.cos(a)*20,c.y+Math.sin(a)*20); ctx.rotate(a); ctx.globalAlpha*=0.5+0.4*Math.sin(G.time*8); ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(-3,-4.5); ctx.lineTo(-1,0); ctx.lineTo(-3,4.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
}
function drawDuchessC(c,v,down){
  if(down){ lieDown(c,v,()=>{ ctx.rotate(1.0); drawGoat(v); }); return; }
  if(c.act==='wind'){ ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(Math.sin(G.time*40)*0.08); const x=v.x,y=v.y; v.x=0; v.y=0; drawGoat(v); v.x=x; v.y=y; ctx.restore(); return; }
  if(c.act==='charge'){ ctx.save(); ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=1.4; for(let i=-1;i<=1;i++){ const ox=-Math.sin(c.dir)*i*6, oy=Math.cos(c.dir)*i*6; ctx.beginPath(); ctx.moveTo(c.x-Math.cos(c.dir)*16+ox,c.y-Math.sin(c.dir)*16+oy); ctx.lineTo(c.x-Math.cos(c.dir)*(30+Math.abs(i)*-6)+ox,c.y-Math.sin(c.dir)*(30+Math.abs(i)*-6)+oy); ctx.stroke(); } ctx.restore(); }
  if(c.butt>0){ c.butt-=1/60; ctx.save(); ctx.translate(Math.cos(c.face)*3,Math.sin(c.face)*3); drawGoat(v); ctx.restore(); return; }
  drawGoat(v);
}
function drawGreyC(c,v,down){
  v.snowy=true; v.state=c.howlT>0?'frost':'chase'; v.dx=c.moving?Math.cos(c.face)*80:0; v.dy=c.moving?Math.sin(c.face)*80:0;
  if(c.howlT>0) c.howlT-=1/60;
  if(down){ ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(0.4); ctx.drawImage(pShadow(),-24,-14,48,28); const x=v.x,y=v.y; v.x=0; v.y=0; v.face=Math.PI*0.9; v.dx=v.dy=0; drawWolf(v,false,1.5,true,true); v.x=x; v.y=y; ctx.restore(); return; }
  ctx.drawImage(pShadow(),c.x-27,c.y-17,54,34);
  drawWolf(v,false,1.55,true,true);
  if(c.snap>0){ c.snap-=1/60; const hx=c.x+Math.cos(c.face)*34, hy=c.y+Math.sin(c.face)*34; ctx.save(); ctx.translate(hx,hy); ctx.rotate(c.face); ctx.strokeStyle=`rgba(255,255,255,${c.snap*4})`; ctx.lineWidth=2; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(-2,s*7); ctx.lineTo(6,s*2); ctx.stroke(); } ctx.restore(); }
}
function star5(x,y,r,col){ ctx.fillStyle=col; ctx.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, q=i%2?r*0.45:r; ctx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q); } ctx.closePath(); ctx.fill(); }
function drawDizzy(c){
  const t=G.time, y=c.y-(c.id==='greymane'?30:24);
  ctx.save();
  const k=1-c.down/c.downMax; ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(c.x,c.y+5,c.r+9,(c.r+9)*0.5,0,0,TAU); ctx.stroke();
  ctx.strokeStyle='rgba(255,226,140,.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(c.x,c.y+5,c.r+9,(c.r+9)*0.5,0,-Math.PI/2,-Math.PI/2+TAU*k); ctx.stroke();
  for(let i=0;i<3;i++){ const a=t*4.5+i*TAU/3, sx=c.x+Math.cos(a)*11, sy=y+Math.sin(a)*4; const front=Math.sin(a)>0; star5(sx,sy,front?3.6:2.8,front?'#ffe066':'#e8b840'); }
  ctx.restore();
}
function drawWaitTag(c){
  const x=c.x, y=c.y-(c.id==='greymane'?34:30)+Math.sin(G.time*3)*1.5;
  ctx.save(); ctx.font=`800 8px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(12,9,6,.72)'; rr(x-15,y-6,30,12,6); ctx.fill(); ctx.strokeStyle='rgba(160,230,255,.6)'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='#bfefff'; ctx.fillText('WAIT',x,y+0.5); ctx.restore();
}
function drawStone(s){
  const k=clamp(s.t/s.T,0,1), h=Math.sin(Math.PI*k)*14;
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(s.x,s.y+2,3,1.6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#4a4038'; ctx.beginPath(); ctx.arc(s.x,s.y-h,3,0,TAU); ctx.fill();
  ctx.fillStyle='#9a9286'; ctx.beginPath(); ctx.arc(s.x,s.y-h,2.4,0,TAU); ctx.fill();
  ctx.fillStyle='#d8d0c4'; ctx.beginPath(); ctx.arc(s.x-0.8,s.y-h-0.8,0.9,0,TAU); ctx.fill();
}
function drawCFX(f){
  if(f.t<0) return;
  const k=clamp(f.t/(f.dur||1),0,1);
  if(f.k==='ring'){ ctx.save(); ctx.strokeStyle=`rgba(${f.col},${0.7*(1-k)})`; ctx.lineWidth=(f.w||4)*(1-k*0.6); ctx.beginPath(); ctx.ellipse(f.x,f.y,lerp(f.r0,f.r1,smooth(k)),lerp(f.r0,f.r1,smooth(k))*0.62,0,0,TAU); ctx.stroke(); ctx.restore(); }
  else if(f.k==='spark'){ const a=Math.sin(f.t*9)*0.5+0.5, y=f.y-14-Math.sin(f.t*3)*3; ctx.save(); ctx.globalAlpha=(1-k*0.6)*(0.5+0.5*a); glowAt(f.x,y,14,'255,230,140',0.6); star5(f.x,y,4+a*2,'#fff6c0'); ctx.restore(); }
  else if(f.k==='ember'){ glowAt(f.x,f.y,12,'255,170,80',0.8); ctx.fillStyle='#ffe2a0'; ctx.beginPath(); ctx.arc(f.x,f.y,2.6,0,TAU); ctx.fill(); }
}
function drawGreyWait(){
  if(T3.on&&T3C.greywait){ T3C.greywait(GREYW); return; }
  const t=G.time, b=Math.sin(t*1.6)*0.02;
  ctx.drawImage(pShadow(),GREYW.x-27,GREYW.y-17,54,34);
  GREYW.t=t; ctx.save(); ctx.translate(GREYW.x,GREYW.y); ctx.scale(1+b,1-b); const x=GREYW.x, y=GREYW.y; GREYW.x=0; GREYW.y=0; drawWolf(GREYW,false,1.55,true,true); GREYW.x=x; GREYW.y=y; ctx.restore();
  if(!(G.comps&&G.comps.greymane)) drawMarker(GREYW.x,GREYW.y-42,'!',t);
}

// ================= HUD: a portrait chip with a health ring, tap or click it to whistle
const CPORT={};
function faceWolf(g){
  const fur='#e4eaf0', mid='#a8b4c2', dk='#4a5462';
  for(const s of [-1,1]){ g.fillStyle=mid; g.beginPath(); g.moveTo(s*12,-38); g.lineTo(s*38,-80); g.lineTo(s*50,-24); g.closePath(); g.fill(); g.fillStyle='#d8a8b4'; g.beginPath(); g.moveTo(s*22,-40); g.lineTo(s*37,-66); g.lineTo(s*42,-32); g.closePath(); g.fill(); }
  g.fillStyle=mid; g.beginPath(); for(let i=0;i<=16;i++){ const a=Math.PI*0.02+i/16*Math.PI*0.96, r=i%2?54:64; g.lineTo(Math.cos(a)*r,Math.sin(a)*r*0.86+8); } g.lineTo(0,-20); g.closePath(); g.fill();
  const hg=g.createRadialGradient(-12,-24,6,0,-4,52); hg.addColorStop(0,'#ffffff'); hg.addColorStop(0.6,fur); hg.addColorStop(1,'#b8c4d0'); g.fillStyle=hg; g.beginPath(); g.ellipse(0,-6,42,44,0,0,TAU); g.fill();
  g.fillStyle='rgba(90,104,124,.45)'; g.beginPath(); g.moveTo(0,-48); g.quadraticCurveTo(10,-30,6,-12); g.lineTo(-6,-12); g.quadraticCurveTo(-10,-30,0,-48); g.fill();
  g.fillStyle='#f6f9fc'; g.beginPath(); g.ellipse(0,24,24,20,0,0,TAU); g.fill();
  g.fillStyle='#1e2228'; g.beginPath(); g.ellipse(0,12,9,7,0,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-3,10,3,1.6,0,0,TAU); g.fill();
  g.strokeStyle=dk; g.lineWidth=2.5; g.beginPath(); g.moveTo(0,19); g.lineTo(0,28); g.moveTo(-10,32); g.quadraticCurveTo(0,38,10,32); g.stroke();
  for(const s of [-1,1]){ g.save(); g.shadowColor='#7ac8ff'; g.shadowBlur=10; g.fillStyle='#9fd8ff'; g.beginPath(); g.ellipse(s*17,-10,8,5.5,s*-0.25,0,TAU); g.fill(); g.restore(); g.fillStyle='#10202e'; g.beginPath(); g.ellipse(s*17,-10,2.2,4.6,0,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(s*17-2,-12,1.4,0,TAU); g.fill(); g.strokeStyle=dk; g.lineWidth=3; g.beginPath(); g.moveTo(s*8,-20); g.lineTo(s*26,-17); g.stroke(); }
}
function compPortrait(id){
  if(CPORT[id]) return CPORT[id];
  const S=128, c=mkCanvas(S,S), g=c.getContext('2d');
  g.translate(S/2,S/2+10); g.scale(S/176,S/176);
  try{
    if(id==='duchess') faceGoat(g);
    else if(id==='brisket') facePerson(g,CASTBY.brisket.look,false);
    else if(id==='juniper') facePerson(g,Object.assign({},SPECIAL.juniper.look,PEXTRA.juniper||{}),false);
    else if(id==='greymane') faceWolf(g);
    else faceDragon(g,{skin:'#f0884a',dark:'#9a4018',snout:'#ffb070',horn:'#fff0d0',eye:'#ffe066',k:0.82});
  }catch(e){}
  return CPORT[id]=c;
}
function chipFace(id,cx,cy,r,dim){
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.clip();
  ctx.fillStyle=(CDEF[id]&&CDEF[id].bg)||'#3a1a0a'; ctx.fillRect(cx-r,cy-r,r*2,r*2);
  const g=ctx.createRadialGradient(cx,cy-r*0.3,1,cx,cy,r*1.2); g.addColorStop(0,'rgba(255,170,90,.28)'); g.addColorStop(1,'rgba(0,0,0,.3)'); ctx.fillStyle=g; ctx.fillRect(cx-r,cy-r,r*2,r*2);
  const s=r*2.45; if(dim) ctx.globalAlpha*=0.5; ctx.drawImage(compPortrait(id),cx-s/2,cy-s/2+r*0.12,s,s);
  ctx.restore();
}
function drawCompHud(){
  if(!G||G.mode!=='story'||!player) return;
  drawBubbles();
  const c=CM&&CMG===G&&!c0hidden()?CM:null, pip=!!G.pip;
  if(!c&&!pip) return;
  const L=SAFE.l+14, T=SAFE.t+14, M=MINI_R(), pw=Math.min(250,M.x-L-10), R=c?21:16;
  let cx, cy; const rx=Math.max(L+pw+4,HUD_RX); if(M.x-rx>=R*2+26){ cx=rx+8+R; cy=T+R+3; HUD_RX=cx+R+12; } else { cx=M.x+M.r; cy=M.y+M.r*2+38+R; }
  const id=c?c.id:'pip', down=!!c&&c.down>0, k=c?clamp(c.hp/c.maxHp,0,1):1, t=G.time;
  ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(10,8,6,.62)'; ctx.beginPath(); ctx.arc(cx,cy,R+4,0,TAU); ctx.fill();
  chipFace(id,cx,cy,R-3,down);
  ctx.lineWidth=3.6; ctx.strokeStyle='rgba(50,14,10,.92)'; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke();
  if(c){
    if(down){ ctx.strokeStyle='#ffe28c'; ctx.beginPath(); ctx.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+TAU*(1-c.down/c.downMax)); ctx.stroke();
      for(let i=0;i<3;i++){ const a=t*3.5+i*TAU/3; star5(cx+Math.cos(a)*R*0.6,cy-R*0.55+Math.sin(a)*3,3.4,'#ffe066'); } }
    else{ ctx.strokeStyle=k>0.5?'#6ad06a':k>0.25?'#e8c040':'#e8541f'; ctx.beginPath(); ctx.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+TAU*k); ctx.stroke(); }
    if(c.flash>0){ ctx.strokeStyle=`rgba(255,140,110,${clamp(c.flash/0.14,0,1)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R+4,0,TAU); ctx.stroke(); }
  }else{ ctx.strokeStyle='#ffb070'; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke(); }
  // name, wait tag, key hint
  const name=c?CDEF[id].name:'Pip';
  ctx.font=`700 9px ${UIF}`; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.65)'; ctx.lineJoin='round'; ctx.strokeText(name,cx,cy+R+10); ctx.fillStyle='#f2e6d4'; ctx.fillText(name,cx,cy+R+10);
  if(c&&c.mode==='stay'&&!down){ ctx.fillStyle='rgba(12,9,6,.85)'; rr(cx-14,cy-R-9,28,12,6); ctx.fill(); ctx.strokeStyle='rgba(160,230,255,.7)'; ctx.lineWidth=1; ctx.stroke(); ctx.font=`800 8px ${UIF}`; ctx.fillStyle='#bfefff'; ctx.fillText('WAIT',cx,cy-R-2.5); }
  if(!usingTouch){ const kx=cx+R*0.78, ky=cy+R*0.72; ctx.fillStyle='rgba(12,9,6,.9)'; ctx.beginPath(); ctx.arc(kx,ky,6.5,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(255,220,180,.5)'; ctx.lineWidth=1; ctx.stroke(); ctx.font=`800 8px ${UIF}`; ctx.fillStyle='#ffe6c0'; ctx.fillText('G',kx,ky+0.5); }
  if(c&&pip){ const px=cx-R*0.82, py=cy+R*0.7, pr=8; ctx.fillStyle='rgba(10,8,6,.8)'; ctx.beginPath(); ctx.arc(px,py,pr+2,0,TAU); ctx.fill(); chipFace('pip',px,py,pr,false); ctx.strokeStyle='#ffb070'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(px,py,pr,0,TAU); ctx.stroke(); }
  ctx.restore();
  HUD_HITS.push({x:cx-R-6,y:cy-R-6,w:R*2+12,h:R*2+16,fn:()=>{ COMP_TAP=true; }});
}
function c0hidden(){ return !!(CM&&CM.hidden); }

// ---------- debug hooks for tests
window.__ebX=Object.assign(window.__ebX||{},{
  recruit(id,x,y){ recruitComp(id,x!=null?{x,y}:null); }, sendHome(id){ compSendHome(id||G.comp); },
  compState(){ const c=compRT(); return c?{id:c.id,x:Math.round(c.x),y:Math.round(c.y),hp:Math.round(c.hp),maxHp:c.maxHp,down:+c.down.toFixed(2),mode:c.mode,act:c.act,outside:c.outside,hidden:c.hidden,inArea:!!AREA,area:AREA?AREA.id:null,dist:Math.round(dist(c.x,c.y,player.x,player.y)),blocked:blockedAt(c.x,c.y)}:null; },
  whistle(){ compWhistle(); }, compDown(){ const c=compRT(); if(c) compKnockDown(c); }, compHurt(n){ const c=compRT(); if(c){ c.iframes=0; compHurt(c,n||10,player.x+20,player.y); } },
  spawnFoe(type,x,y,lvl){ const e=makeEnemy(type,x,y,{level:lvl||1,aggro:true,homeX:x,homeY:y,leash:1500}); e.spawnIn=0; if(AREA) e.inArea=true; return e.id; },
  foes(){ return G.enemies.filter(e=>!e.dead).map(e=>({id:e.id,type:e.type,hp:Math.round(e.hp),max:Math.round(e.maxHp),x:Math.round(e.x),y:Math.round(e.y),taunt:!!(e._ctaunt>G.time),slow:!!(e._cslow>G.time)})); },
  bubbles(){ return BUB.map(b=>({text:b.text,who:b.who,kind:b.kind,t:+b.t.toFixed(2)})); }, barkLog(){ return BK.log.slice(); },
  deeds(){ syncDeeds(); return Object.assign({},G.deeds); }, deedGreet(id){ return deedGreet(id); }, canRecruit(id){ return canRecruit(id); },
  compOpts(id){ return compTalkOpts(id,null).map(o=>o.t); }, talkComp(){ compTalk(); }, talkDuchess(){ talkDuchess(); }, talkGreymane(){ talkGreymane(); },
  forceBark(){ BK.next=0; BK.checkT=0; }, forceChat(){ BK.chatNext=0; BK.checkT=0; },
  barkStats(){ return {barks:BARKS.length,chats:CHATS.length,greets:Object.keys(DGREET).length,live:LIVE.fly.length+LIVE.jump.length+LIVE.water.length,comp:Object.values(CLINES).reduce((n,o)=>n+Object.values(o).reduce((m,a)=>m+a.length,0),0)}; },
  melt(){ return {p:MELT.p,need:MELT.need}; }, pipFx(){ return G.pip&&G.pip.fx?{fetch:!!G.pip.fx.fetch,pt:!!G.pip.fx.pt}:null; },
  promptText(){ return G.prompt?G.prompt.text:null; }, usePrompt(){ if(G.prompt){ const p=G.prompt; G.prompt=null; p.act(); } }, greySpot(){ return {x:GREYW.x,y:GREYW.y}; }, iceSpot(){ const o=iceLM(); return o?{x:o.x,y:o.y}:null; },
  makeEnemy(type,x,y,o){ return makeEnemy(type,x,y,o||{}).id; }, killAll(){ for(const e of G.enemies) if(!e.dead&&!e.boss) killEnemy(e); },
  portraitURL(id){ return compPortrait(id).toDataURL('image/png'); },
  placeGoat(){ placeGoat(); }, spawnPip(){ G.flags.pip=true; spawnPip(); }, setZoom(k){ zoom=ZOOM0*(k||1); updateCam(0,true); }, goat(){ return G.goat?{x:Math.round(G.goat.x),y:Math.round(G.goat.y)}:null; }
});
