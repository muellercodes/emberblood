
// ================= Finale: Nightfall Peak, the story (x4_story)
// The finale's eight stages (n_bridge to n_end) and every scene of bible/FINALE.md: the departure from the Moon Pier,
// the arrival, the Bridgefoot, the words of every stretch on the four rings, the echo intros and outros, the allies'
// joins and goodbyes, the Crown gathering, the Moon Door, Nyxara's words, the ally runtime on the peak, the Heart moment
// (its whole screen), the fall and the final choice, the three endings with each Act I ending's lines, the dawn, the
// grand epilogue (a storybook through all four lands), the final victory screen with endAct(5), and free roam on
// Dawnlight Peak. Owners elsewhere: the map, its look and the dawn's look (x4_world), the fights (x4_foes), the puzzles
// (x4_ascent), the themes (x9_music2). This file hooks in by wrapping and through the calls in scratchpad/N4STORY.md;
// every stand-in switches itself off when the real thing is in the build.
// Top-level names start with n4s / N4ST; the debug hooks are window.__ebX.n4s (also __eb.n4s).
// Lines are [speaker, S(full, simple)]; Pip is "he"; "Mom"; no em dash anywhere.

// ---------- 0. small helpers
const N4ST={gone:{},q:[],rep:{},cam:null,heart:null,book:null,cut:null,end:null,arr:null,allies:[],ally:{},has:{},t:0,wasF:{},stand:{},
  big:0,bigT:0,duch:null,dbg:{},hurt:[],gal:0,ttT:0,run:false,fallFin:null,fallE:null,heartDone:null,phaseSeen:{},voiceL:null};
const n4sDi=()=>{ const d=typeof diffIdx==='number'?diffIdx:1; return d<=0?0:d>=2?2:1; };   // 0 Easy, 1 Normal, 2 Hard
const n4sBy=(e,n,h)=>[e,n,h][n4sDi()];
const n4sOn=()=>!!G&&G.mode==='story'&&actOf(G.stage)===5;
const n4sMap4=()=>!!G&&!!player&&!AREA&&player.x<IZX-50&&curMap()===4;
const n4sF=k=>!!(G&&G.flags&&G.flags[k]);
const n4sEnd=()=>(G&&G.choices&&G.choices.ending)||'hero';
// the three friends Nyxara hurt count when an earlier act freed them, or when they were won back on the peak (the act 5
// data's flags n5_vesper, n5_glaciar, n5_hush: Vesper's second chance on the Silk Gallery, the errands)
const n4sVes=()=>(typeof vesperFriend==='function'?!!vesperFriend():!!(G&&G.choices&&G.choices.c_vesper==='friend'))||!!(G&&G.flags&&G.flags.n5_vesper);
const n4sGla=()=>!!(G&&G.choices&&G.choices.f_glaciar==='free')||!!(G&&G.flags&&G.flags.n5_glaciar);
const n4sHushF=()=>!!(G&&G.choices&&G.choices.m_hush==='free')||!!(G&&G.flags&&G.flags.n5_hush);
// a Hush won back on the peak (not freed in Act IV) is small: a moth cut free goes back to her own size (q_n5_hush)
const n4sHushSmall=()=>!!(G&&G.flags&&G.flags.n5_hush)&&!(G&&G.choices&&G.choices.m_hush==='free');
// the act 5 data (v10): a scene of the act's chapters, the act file
const n4sData=k=>{ try{ return typeof S10!=='undefined'&&S10.scenes&&S10.scenes[k]||null; }catch(e){ return null; } };
const n4sAct5=()=>{ try{ return typeof S10!=='undefined'&&S10.acts&&S10.acts[5]||null; }catch(e){ return null; } };
const n4sGrey=()=>!!(G&&G.choices&&G.choices.greymane==='ally');
const n4sCin=()=>!!(G&&G.choices&&G.choices.cinder==='ally');
const n4sTikka=()=>!!(G&&G.flags&&G.flags.tk_come==='yes');
const n4sMom=()=>!!(G&&G.flags&&(G.flags.m_maren||G.flags.m_reforged));
const n4sKnows=()=>typeof nKnowsNyx==='function'?!!nKnowsNyx():!!(G.flags.dr_seen_m_moth||G.flags.f_page11||G.flags.m_page11||G.found.n_pane_3);
// how many of those three are here, and whether the kind ending is open: with the act 5 data, its trust track
// `friends` and its moth ending's condition (so this file, x4_foes and the data's choice agree); else the old counts
const n4sFreed=()=>{ const A=n4sAct5(); if(A&&A.trust&&A.trust.friends) return +(G.flags[A.trust.friends]||0); return typeof nFreed==='function'?nFreed():(n4sVes()?1:0)+(n4sGla()?1:0)+(n4sHushF()?1:0); };
const n4sMercy=()=>{ const A=n4sAct5(), m=A&&A.ending&&A.ending.moth; if(m&&m.if!=null&&typeof s10Cond==='function'){ try{ return !!s10Cond(m.if); }catch(e){ return false; } }
  return typeof nCanMercy==='function'?!!nCanMercy():n4sKnows()&&n4sFreed()>=2; };
const n4sQ=q=>!!(G&&G.quests&&G.quests[q]&&G.quests[q].done);
const n4sIfL=(c,...L)=>{ let ok=false; try{ ok=typeof c==='function'?!!c():!!c; }catch(e){} return ok?L:[]; };
const n4sDo=fn=>({who:'narr',text:'',fn,skipIf:()=>true});
const n4sTry=fn=>{ try{ fn(); }catch(e){ console.error(e); } };
const n4sPC=(r,a)=>({x:4500+r*Math.sin(a*Math.PI/180),y:85200+r*Math.cos(a*Math.PI/180)});
function n4sAng(x,y){ let a=Math.atan2(x-4500,y-85200)*180/Math.PI; return a<0?a+360:a; }
const n4sR=(x,y)=>Math.hypot(x-4500,y-85200);
function n4sInA(a,a0,a1){ let d=(a-a0)%360; if(d<0) d+=360; return d<=a1-a0; }
// is Ash inside a ring sector (r0..r1, angle a0..a1), on map 4, outdoors
function n4sSec(r0,r1,a0,a1){ if(!n4sMap4()) return false; const r=n4sR(player.x,player.y); return r>=r0&&r<=r1&&n4sInA(n4sAng(player.x,player.y),a0,a1); }
const n4sNear=(x,y,r)=>n4sMap4()&&dist(player.x,player.y,x,y)<r;
const n4sLvl=()=>{ try{ return typeof elevLvl==='function'?elevLvl(player.x,player.y):0; }catch(e){ return 0; } };
// the other finale modules: x4_world loads before this file, x4_foes before it, x4_ascent after it (tested at run time)
function n4sHasAscent(){
  if(N4ST.has.asc) return true;
  let v=false; try{ const X=window.__ebX||{}; v=!!(X.n4a||X.n4asc||X.ascent||X.x4a); }catch(e){}
  try{ if(!v&&typeof N4A!=='undefined'&&N4A) v=true; }catch(e){}
  if(v) N4ST.has.asc=true; return v;
}
const n4sSpot=k=>{ try{ if(typeof N4SPOT!=='undefined'&&N4SPOT[k]) return {x:N4SPOT[k][0],y:N4SPOT[k][1]}; }catch(e){} return null; };
function n4sJ(name,sfx){ try{ if(typeof jingle==='function') jingle(name,sfx); else if(sfx) SFX.play(sfx); }catch(e){} }
function n4sSfx(n,v){ try{ SFX.play(n,v); }catch(e){} }
const n4sExtra=(k,t)=>{ G.choices.extra=G.choices.extra||{}; G.choices.extra[k]=t; };
// once-only scenes: STORY.<key> is built when it is read (the lines follow the choices), and starts with a silent mark,
// so a scene played by any route (this file, x4_ascent, x4_foes) is never played twice
const N4S_SC={}, N4S_OVR={};
function n4sSeen(k){ const s=G&&G.flags&&G.flags.n_sn; return !!(s&&s[k]); }
function n4sMark(k){ if(!G||!G.flags) return; (G.flags.n_sn=G.flags.n_sn||{})[k]=1; }
function n4sWrapL(key,L,again){
  const rep=()=>!again&&!!N4ST.rep[key];
  const w=l=>{ if(Array.isArray(l)) return l[2]?{who:l[0],text:l[1],opts:l[2],skipIf:rep}:{who:l[0],text:l[1],skipIf:rep};
    if(!l||typeof l!=='object') return l; const c=Object.assign({},l), s0=l.skipIf, f0=l.fn; c.skipIf=()=>rep()||(s0?!!s0():false); if(f0) c.fn=function(){ if(!rep()) return f0.apply(this,arguments); }; return c; };
  const head={who:'narr',text:'',fn:()=>{ N4ST.rep[key]=!again&&n4sSeen(key); n4sMark(key); },skipIf:()=>true};
  return [head].concat((L||[]).map(w));
}
function n4sBuild(key){ const d=N4S_SC[key]; if(!d) return []; let L=[]; try{ L=d.fn()||[]; }catch(e){ console.error('n4s scene',key,e); } return n4sWrapL(key,L,d.again); }
function n4sDef(key,fn,o){
  N4S_SC[key]={fn,again:!!(o&&o.again)};
  try{ Object.defineProperty(STORY,key,{configurable:true,enumerable:true,get(){ const v=N4S_OVR[key]; if(v) return typeof v==='function'?v():v; return n4sBuild(key); },set(v){ N4S_OVR[key]=v; }}); }catch(e){ STORY[key]=n4sBuild(key); }
}
// play a scene (a STORY key or lines); done runs after it closes; a key that was played already only runs done
function n4sPlay(key,done,opt){
  opt=opt||{};
  const isK=typeof key==='string', again=opt.again||(isK&&N4S_SC[key]&&N4S_SC[key].again);
  if(isK&&!again&&n4sSeen(key)){ if(done) n4sTry(done); return false; }
  let L=isK?STORY[key]:(typeof key==='function'?key():key);
  if(!L||!L.length){ if(isK) n4sMark(key); if(done) n4sTry(done); return false; }
  runDialogue(L,()=>{ scene='play'; N4ST.cam=null; if(done) n4sTry(done); try{ saveGame(); }catch(e){} },opt.mood?{mood:opt.mood}:undefined);
  return true;
}
function n4sChain(keys,done,opt){ const L=[]; for(const k of keys){ if(n4sSeen(k)&&!(N4S_SC[k]&&N4S_SC[k].again)) continue; const a=STORY[k]; if(a&&a.length) L.push(...a); } return n4sPlay(L,done,opt); }
// a beat that waits for a calm moment (playing, no dialogue, no minigame, no fight unless asked)
function n4sCalm(fight){ return scene==='play'&&!DLG&&!G.mini&&!player.dead&&(fight||!(G.boss&&!G.boss.dead))&&!(typeof MOON!=='undefined'&&MOON&&MOON.anim)&&!N4ST.heartLock; }
function n4sWhen(id,cond,fn,fight){ if(N4ST.q.some(q=>q.id===id)) return; N4ST.q.push({id,cond,fn,fight:!!fight}); }
function n4sQueue(){
  if(!N4ST.q.length) return;
  for(let i=0;i<N4ST.q.length;i++){ const q=N4ST.q[i]; if(!n4sCalm(q.fight)) continue; let ok=false; try{ ok=!q.cond||q.cond(); }catch(e){ console.error(e); }
    if(ok){ N4ST.q.splice(i,1); n4sTry(q.fn); return; } }
}
// speech bubbles (once each): narr bubbles over Ash, Ash's own words, Pip's chirps
const N4S_BUB={};
function n4sBubDef(k,who,f,s){ N4S_BUB[k]={who,t:S(f,s)}; }
function n4sSay(k,again){
  const b=N4S_BUB[k]; if(!b||!G||!player) return false;
  const key='b_'+k; if(!again&&n4sSeen(key)) return false; n4sMark(key);
  try{ if(b.who==='pip'&&G.pip) bubble(G.pip,b.t,{who:'Pip',col:(SPK.pip&&SPK.pip.col)||null});
    else if(b.who==='narr') bubble(player,b.t,{kind:'narr',dy:-58});
    else bubble(player,b.t,{who:(SPK[b.who]&&SPK[b.who].name)||'Ash',col:(SPK[b.who]&&SPK[b.who].col)||null}); }catch(e){ console.error(e); }
  return true;
}

// ---------- 1. speakers, portraits, items (FINALE 0, 15 of THREADS)
const N4S_SPK={n_echo_vor:{name:'Echo of the First Flame',col:'#9a7ac8'},n_echo_vesper:{name:'Echo of the Moth Mask',col:'#8a7ab0'},
  n_echo_glaciar:{name:'Echo of the Ice Dragon',col:'#7a8ac0'},n_echo_hush:{name:'Echo of the Hush',col:'#9a9ab0'},n_memory:{name:'A memory',col:'#c8c0e8'},
  c_vesper:{name:'Vesper',col:'#b8a8e8'},f_glaciar:{name:'Glaciar',col:'#a8e0ff'},f_hush:{name:'Hush',col:'#e4e0f4'},goat:{name:'Duchess',col:'#e8e0d0'},
  ev_tikka:{name:'Tikka',col:'#e8a05a'},ev_tock:{name:'Tock',col:'#b8a070'},grandpa:{name:'Grandpa',col:'#ff9a5a'}};
for(const k in N4S_SPK) if(!SPK[k]) SPK[k]=N4S_SPK[k];
for(const [k,v] of [['n_map',S("Juniper's Peak Map","Juniper's map of the peak")],['n_spark',S("Cindervane's Spark","Cindervane's Spark")]]) if(!ITEM_NAMES[k]) ITEM_NAMES[k]=v;
function n4sGlowG(g,x,y,r,col,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${col},${a})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
// an echo's face: the old boss in shadow (near-black, violet rim, white eyes, moth flecks peeling off)
function n4sShadowFace(g,draw){
  g.save(); n4sGlowG(g,0,0,92,'150,100,255',0.35); draw(g); g.restore();
  g.save(); g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(18,10,34,.78)'; g.fillRect(-90,-90,180,180); g.restore();
  g.save(); g.fillStyle='rgba(210,190,255,.75)'; for(const [x,y,s] of [[-64,-40,3],[58,-58,2.4],[70,20,2.8],[-72,30,2.2],[40,62,2]]){ g.beginPath(); g.ellipse(x,y,s*1.6,s,0.6,0,TAU); g.fill(); } g.restore();
}
const N4S_PORT={
  n_echo_vor:{bg:'#120a1e',f:g=>{ n4sShadowFace(g,q=>{ if(typeof faceDragon==='function') faceDragon(q,{skin:'#5a3a6a',dark:'#2a1a3a',snout:'#6a4a7a',horn:'#8a6aa8',eye:'#ffffff',k:0.92}); });
    g.fillStyle='#ffffff'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*20,-8,6,4,0,0,TAU); g.fill(); } }},
  n_echo_vesper:{bg:'#120a1e',f:g=>{ n4sShadowFace(g,q=>{ const P=EVPORT.c_vesper||EVPORT.c_thief||EVPORT.vesper; if(P&&P.f) P.f(q); else { q.fillStyle='#6a5a84'; q.beginPath(); q.arc(0,0,48,0,TAU); q.fill(); } });
    g.fillStyle='#ffffff'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*16,-6,5,3.4,0,0,TAU); g.fill(); } }},
  n_echo_glaciar:{bg:'#0e1024',f:g=>{ n4sShadowFace(g,q=>{ if(typeof faceDragon==='function') faceDragon(q,{skin:'#4a5a8a',dark:'#22284a',snout:'#5a6a9a',horn:'#8a9ac8',eye:'#ffffff',k:0.86,frill:true}); });
    g.fillStyle='#ffffff'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*20,-8,6,4,0,0,TAU); g.fill(); } }},
  n_echo_hush:{bg:'#100c1c',f:g=>{ n4sShadowFace(g,q=>{ if(typeof thrFaceMoth==='function') thrFaceMoth(q,{wing:'#5a5a6a',wing2:'#3a3a4a',eye:'#d8c8ff',iris:'#7a5ad8',fur:'#6a6a7a',fur2:'#7a7a8a',eyes:'#ffffff',ant:'#9a9ab0'}); }); }},
  n_memory:{bg:'#1a1430',f:g=>{ const t=(G?G.time:0); n4sGlowG(g,0,0,80,'200,190,240',0.55); for(let i=0;i<7;i++){ const a=t*0.6+i*0.9, r=26+i*6; g.fillStyle=`rgba(232,226,255,${0.5-i*0.05})`; g.beginPath(); g.arc(Math.cos(a)*r,Math.sin(a)*r*0.6,3.2-i*0.3,0,TAU); g.fill(); }
    g.fillStyle='#f4f0ff'; g.beginPath(); g.arc(0,0,10,0,TAU); g.fill(); }}
};
for(const k in N4S_PORT) if(!EVPORT[k]) EVPORT[k]=N4S_PORT[k];
// echoes speak only old words (their text wobbles, dim violet); a memory is told in italics, like the narrator
(function n4sCss(){ try{ if(document.getElementById('n4sCss')) return; const st=document.createElement('style'); st.id='n4sCss';
  st.textContent=`@keyframes n4wob{0%,100%{transform:translate(0,0)}25%{transform:translate(.6px,-.5px)}50%{transform:translate(-.5px,.4px)}75%{transform:translate(.4px,.6px)}}
.dlg.n4echo .say{color:#cbbcf0;animation:n4wob 1.6s ease-in-out infinite;text-shadow:0 0 8px rgba(150,110,255,.55)}
.dlg.n4mem .say{font-style:italic;color:#e6e0ff;text-shadow:0 0 10px rgba(200,190,255,.5)}
#n4sBook{position:fixed;inset:0;z-index:4;pointer-events:none;opacity:0;transition:opacity 1.2s ease;display:none}
#n4sBook canvas{position:absolute;inset:0;width:100%;height:100%}
#n4sBook .n4t{position:absolute;left:0;right:0;top:max(18px,env(safe-area-inset-top,0px));text-align:center;font:600 12px ${UIF};letter-spacing:.24em;text-transform:uppercase;color:rgba(255,236,206,.9);text-shadow:0 2px 10px rgba(0,0,0,.7)}
#n4sBook .n4n{position:absolute;left:0;right:0;top:calc(max(18px,env(safe-area-inset-top,0px)) + 20px);text-align:center;font:700 24px ${UIF};color:#fff3e0;text-shadow:0 2px 14px rgba(160,90,40,.85)}
#n4sWinX{margin:10px 0 16px;font-size:12px;color:var(--muted);letter-spacing:.04em}
#n4sWinSub{margin:6px 0 2px;font-size:13px;color:var(--gold);letter-spacing:.06em}
#n4sWinMore{margin-top:12px;font-size:13px;color:#7a5ab0;font-style:italic}`;
  document.head.appendChild(st); }catch(e){} })();
{ const base=setLine; setLine=function(){ base.apply(this,arguments); try{ const b=$('#dlgBox'); if(!b) return; const L=DLG&&DLG.lines[DLG.i], w=L?(Array.isArray(L)?L[0]:(typeof L.who==='function'?L.who():L.who)):'';
  b.classList.toggle('n4echo',/^n_echo_/.test(String(w))); b.classList.toggle('n4mem',w==='n_memory'); if(w==='n_memory') b.classList.add('narr'); }catch(e){} }; }

// ---------- 2. the scenes (bible/FINALE.md 5 to 12). Every one is STORY.<key>, built when played.
// 5.0 the departure: the Moonfall end of the moonfire bridge, the first time Ash takes it (before the fade)
n4sDef('n_depart',()=>{
  const mom=n4sMom();
  return [
    n4sDo(()=>{ N4ST.cam={x:13760,y:65430,k:0.55}; }),
    xl('narr',`The moonfire bridge hums at the edge of the world. It's made of silver flame, and it goes on and on into the dark.`,`The bridge is made of silver fire. It goes far into the dark.`),
    xl('quill',`I measured the moon tonight. There is none left to measure. I have never been so upset about a number.`,`I tried to measure the moon. There is none left!`),
    xl('quill',`The moon has watched every night that ever happened, Ash. If she ate it, she ate all of that too. Every memory.`,`The moon saw every night. She ate its memories too.`),
    xl('juniper',`Here. I drew the peak through the Professor's telescope. It's a spiral. Four rings, one on top of the other, all the way up.`,`I drew the mountain for you. Four rings, going up and up.`),
    n4sDo(()=>{ if(!(G.items.n_map>0)) giveItems({n_map:1}); }),
    xl('ash',`Four rings. One for each place I've been.`,`Four rings. One for each place I went.`),
    xl('juniper',`That's what I thought too. Creepy, right? Also cool. Mostly creepy.`,`Creepy, right? A bit cool too.`),
    ...n4sIfL(G.flags.m_ship!=='glaciar',xl('dell',`I'll keep the boat right here at the foot of the bridge. Engine warm. Lantern lit. Fish... not biting. Never mind the fish.`,`I will wait here with the boat.`)),
    ...(mom?[
      xl('maren',`Come here.`,`Come here.`),
      xl('narr',`Mom hugs you so hard your horns creak.`,`Mom gives you a big, big hug.`),
      xl('maren',`I made the Heart whole again. You bring it home again. Deal?`,`I fixed the Heart. You bring it home. Deal?`),
      xl('ash',`Deal.`,`Deal.`),
      xl('maren',`And eat something. There's a sandwich in your satchel. It's a little squashed. It's been through a lot. Like you.`,`And eat something. There is a sandwich in your bag.`)
    ]:[
      xl('narr',`Flap, flap. Pebble lands on your horn with a folded note in her beak, and takes a coin for it.`,`Pebble lands on your horn with a note. She takes a coin.`),
      n4sDo(()=>{ G.coins=Math.max(0,(G.coins|0)-1); }),
      xl('maren',`(the note) Your mother says: I made the Heart whole again. You bring it home again. Deal?`,`(the note) I fixed the Heart. You bring it home. Deal?`),
      xl('ash',`Deal.`,`Deal.`),
      xl('maren',`(the note) And eat something. There's a sandwich in your satchel. It's a little squashed. It's been through a lot. Like you. Love, Mom.`,`(the note) Eat something. There is a sandwich in your bag. Love, Mom.`)
    ]),
    ...n4sIfL(()=>G.flags.pip,
      xl('pip',`Mip.`,`Mip.`),
      xl('narr',`Pip climbs onto your shoulder. Pip is far too big for your shoulder now. Pip does not care.`,`Pip climbs on your shoulder. Pip is too big now. Pip does not care.`))
  ];
});
// 5.0 the arrival (the first three lines are bubbles while Ash walks north on the deck; the box for the rest)
n4sBubDef('arr1','narr',`Behind you, the bridge flickers. Ahead, a mountain of black glass rises out of a sea of ink.`,`A black glass mountain rises out of a black sea.`);
n4sBubDef('arr2','narr',`Nothing moves. No birds. No wind in any trees. Just a broken moon over the peak, like a cracked plate.`,`Nothing moves. The broken moon hangs over the top.`);
n4sBubDef('arr3','ash',`Hello? ...Okay. Nobody. Great. Love that.`,`Hello? ...Nobody. Great.`);
n4sDef('n_arrive',()=>[
  xl('nyxara',`Come up, little ember. Bring your heart.`,`Come up, little ember. Bring your heart.`),
  xl('ash',`She says "little ember" just like Grandpa used to. I REALLY wish she would stop.`,`She talks like Grandpa did. I wish she would stop.`),
  ...n4sIfL(()=>G.flags.pip,xl('pip',`Mip!`,`Mip!`))
]);
n4sDef('n_green',()=>[
  n4sDo(()=>{ N4ST.cam={x:4500,y:89660,k:0.6}; }),
  xl('narr',`At the foot of the peak there is a little green with three lantern posts. All black glass. All dark.`,`There is a little green with three dark lanterns.`),
  xl('ash',`That's... that's OUR green. From home. She copied it.`,`That is our green from home! She copied it.`),
  xl('ash',`She built a mountain out of the moon's memories. My memories. Okay. That's the creepiest thing anyone has ever done.`,`She made a mountain from my memories. So creepy.`),
  xl('ash',`Three lanterns. A gentle breath, Ash. Gentle.`,`Three lanterns. Breathe gently.`)
]);
n4sBubDef('lanterns','ash',`Three lanterns, and not one bakery on fire. Mom would be proud.`,`Not one bakery burned!`);
n4sDef('n_gate_open',()=>[
  n4sDo(()=>{ N4ST.cam={x:4500,y:89400,k:0.5}; }),
  xl('narr',`The third lantern catches. For one moment the whole green glows warm, like home on Lantern Day.`,`The lanterns glow. It feels like home for a moment.`),
  xl('narr',`Then the shadow gate melts away, and a whisper comes down the mountain, soft as a moth's wing.`,`The dark gate melts. A whisper comes down the mountain.`),
  xl('nyxara',`Shhh. Such pretty lanterns. Light as many as you like, little ember. Up here, they all go out.`,`Pretty lanterns. Up here, they all go out.`),
  xl('ash',`Not if I keep lighting them.`,`Not if I keep lighting them.`),
  ...(n4sGrey()?[
    n4sDo(()=>{ n4sAllyArrive('greymane'); try{ SFX.play('howl'); }catch(e){} }),
    xl('narr',`A howl rolls up out of the dark. Long, and loud, and very, very familiar.`,`A howl! You know that howl.`),
    xl('narr',`Greymane bounds out of the ink, shakes himself off, and soaks you completely.`,`Greymane jumps out of the sea and shakes water all over you.`),
    xl('ash',`GREYMANE! How did you even get here?`,`Greymane! How did you get here?`),
    xl('narr',`Greymane looks at the sea. Greymane looks at you. Greymane is clearly not going to tell you.`,`Greymane looks at the sea. He will not say.`),
    xl('ash',`You SWAM? ...You know what? I'm just happy you're here.`,`You swam?! I'm so happy you came.`)
  ]:G.choices.greymane==='home'?[
    xl('narr',`Far, far away, across the dark water, a wolf howls. Not close enough to help. Close enough to hear.`,`Far away, a wolf howls. You are not alone.`)
  ]:[])
]);
// 5.1 Tier I, the Ember Stair
n4sBubDef('sluice','ash',`Walking won't beat that. But a skim might.`,`Walking is too slow. Try skimming!`);
n4sDef('n_trials',()=>[
  xl('ember',`Oh, she copied my Trials too? That is just RUDE.`,`She copied my Trials? So rude!`),
  xl('ash',`Grandma Ember? You're here?`,`Grandma Ember? You are here?`),
  xl('ember',`A little bit. The moon remembers me, so I'm in her mountain. Like a song stuck in your head. And it's just Ember, please.`,`A little bit. The moon remembers me. Just call me Ember.`),
  xl('ember',`Three courts, three flames. Leap, Tide and Sky. You've done them all before. Do them faster. With style.`,`Three flames: Leap, Tide and Sky. You can do it!`)
]);
n4sDef('n_flame_leap',()=>[xl('ember',`The Leap! You still jump like you mean it.`,`The Leap! Great jumping!`)]);
n4sDef('n_flame_tide',()=>[xl('ember',`The Tide! Water never stood a chance.`,`The Tide! The water can't stop you.`)]);
n4sDef('n_flame_sky',()=>[xl('ember',`The Sky! Every time you fly, I feel it in my wings. Well. My ghost wings.`,`The Sky! I feel it when you fly.`)]);
n4sDef('n_trials_done',()=>[
  xl('ember',`That's all three. Up ahead, there's a shadow sitting on a throne. Don't be fooled. It's only a memory.`,`All three! Up ahead is a shadow on a throne. It is only a memory.`),
  xl('ember',`Memories can't hurt you. ...These ones can, a bit. Be careful, little ember.`,`Memories can't hurt you. Well. These can. Be careful!`)
]);
n4sBubDef('raid','ash',`Kobolds in the village. Again. Even the shadows have no manners.`,`Shadow raiders! Again!`);
n4sBubDef('bed','ash',`She even copied my bed. ...It's made of glass. I'm never complaining about my lumpy pillow again.`,`My bed! It is glass. Not comfy!`);
n4sDef('n_helmet',()=>[
  xl('narr',`You pick up the helmet. It's warm. Inside is one small spark that never went out.`,`The helmet is warm. A spark is inside.`),
  n4sDo(()=>{ if(!(G.items.n_spark>0)) giveItems({n_spark:1}); })
]);
n4sDef('n_grey_bye',()=>[
  xl('narr',`Greymane looks up the Wind Chimney, then at you, then trots off along the cliff with his nose to the ground.`,`Greymane looks up. Then he runs off along the cliff.`),
  n4sDo(()=>n4sAllyLeave('greymane')),
  xl('ash',`He'll find his own way up. Wolves always do.`,`He will find his own way up.`)
]);
// 5.2 Tier II, the Clockstop Cliffs
n4sDef('n_clocks_in',()=>[
  xl('narr',`The second ring looks like Gearhaven. Clock towers. Brass gears. Chalk cliffs. All made of black glass.`,`The second ring looks like Gearhaven. All black glass.`),
  xl('narr',`Every clock says midnight. Not one of them ticks.`,`Every clock says midnight. None of them tick.`),
  xl('ash',`Gearhaven was never this quiet. Gearhaven was so loud you could hear it think.`,`Gearhaven was never this quiet.`),
  ...n4sIfL(()=>G.flags.pip,xl('pip',`Mip?`,`Mip?`),xl('ash',`I know, Pip. I miss the ticking too.`,`I miss the ticking too, Pip.`)),
  xl('nyxara',`Midnight is the best time, little ember. Nothing ends at midnight. Nothing begins. Everything just... waits.`,`At midnight, nothing ends. Everything just waits.`)
]);
n4sBubDef('chime','ash',`Lantern Time. Somebody has to keep the right time around here.`,`Lantern Time! That's the right time.`);
n4sBubDef('gallery','ash',`The post is hiding in the curtain. Dash in, then grab it.`,`Dash into the curtain. Then grab the post.`);
n4sBubDef('nyx','ash',`Nyx. Ember called her Nyx.`,`Ember called her Nyx.`);
n4sDef('n_vesper_join',()=>[
  n4sDo(()=>n4sAllyArrive('vesper')),
  xl('narr',`Someone drops out of the dark on a silk line and lands beside you without a sound. A moth mask. A crooked grin.`,`Someone drops down on a silk rope. A moth mask. A grin.`),
  xl('c_vesper',`You're climbing a copy of my city. Badly.`,`You are climbing a copy of my city. Badly.`),
  xl('ash',`VESPER!`,`Vesper!`),
  xl('c_vesper',`Hi, cousin. Thought you might need a thief. Thieves are good at getting into places nobody wants you in.`,`Hi, cousin! You need a thief. Thieves get in anywhere.`),
  xl('ash',`How many greats is a cousin?`,`How many greats is a cousin?`),
  xl('c_vesper',`None. Cousins don't get greats.`,`None. Cousins have no greats.`),
  xl('ash',`Then you're my favorite relative.`,`Then you are my favorite!`),
  xl('c_vesper',`Don't tell the dragon grandpa. Now. See that dark knob on the pillar? That's a grapple post. She hid it. I find things people hide.`,`Don't tell Grandpa. See that dark knob? It is a hidden grapple post.`),
  n4sDo(()=>{ G.flags.n_vline=1; })
]);
n4sDef('n_vesper_absent',()=>[
  xl('narr',`On a ledge lies a moth mask. A real one, not glass. It's cracked down the middle.`,`A real moth mask lies here. It is cracked.`),
  xl('narr',`Under it is a scrap of paper. It says: "Sorry. V."`,`A note says: "Sorry. V."`),
  xl('ash',`...Me too.`,`Me too.`)
]);
n4sDef('n_vesper_bye',()=>[
  xl('c_vesper',`I'll go up my own way. Thieves never take the stairs. See you at the top, cousin.`,`I will go my own way. See you at the top!`),
  n4sDo(()=>n4sAllyLeave('vesper'))
]);
// 5.3 Tier III, the Rime Spiral
n4sDef('n_rime_in',()=>[
  xl('narr',`The third ring is winter. Black ice. Snow that falls up instead of down. A frozen aurora hangs in the air like a curtain.`,`The third ring is winter. The snow falls UP.`),
  xl('narr',`Shadow people stand in the snow, frozen mid-step. Copies of the people of Hearthold. They aren't real. You check anyway.`,`Shadow people stand frozen in the snow. They are not real.`),
  xl('ash',`It's okay. They're just memories. ...I'm going to say hi to all of them anyway.`,`They are just memories. I will say hi anyway.`),
  xl('nyxara',`Cold is kind, little ember. Cold keeps things. Ask my little cold one.`,`Cold keeps things safe. Ask the ice dragon.`)
]);
n4sBubDef('icewall','ash',`My fire isn't hot enough for that. I need a BLAZE.`,`Normal fire is too weak. Use Blaze!`);
n4sDef('n_glaciar_join',()=>[
  n4sDo(()=>{ n4sAllyArrive('glaciar'); try{ shake(10); }catch(e){} }),
  xl('narr',`CRASH. Something enormous lands on the ice behind you, and the whole ring shakes.`,`CRASH! Something huge lands behind you.`),
  xl('f_glaciar',`DUMPLING! You are climbing the Moth's mountain without a scarf!`,`Dumpling! You have no scarf!`),
  xl('ash',`Great-great-great-great-great-great-great-great-great-great-great-great-great Grand-aunt Glaciar! ...I counted. I counted every great.`,`Great x13 Grand-aunt Glaciar! I counted them all!`),
  xl('f_glaciar',`I heard, my little hot cross bun. The whole sea heard. Go on, then. Fly. If you fall, I will catch you. I only do slowly, but I am very good at catching.`,`I heard you. Go and fly. If you fall, I will catch you.`)
]);
n4sDef('n_glaciar_absent',()=>[
  xl('narr',`Half buried in the snow lies a single dragon scale, blue as deep ice. It's still cold.`,`A blue dragon scale lies in the snow. It is cold.`),
  xl('ash',`Glaciar's. She's still asleep under the snow on Mount Dread. One day the right song will wake her.`,`She is still asleep. A song could wake her.`)
]);
n4sDef('n_glaciar_bye',()=>[
  xl('f_glaciar',`I will circle the peak. When you need a dragon, roar.`,`I will fly around the top. Roar if you need me.`),
  n4sDo(()=>n4sAllyLeave('glaciar'))
]);
// 5.4 Tier IV, the Moonglass Crown
n4sDef('n_glass_in',()=>[
  xl('narr',`The last ring before the top. Glass dunes. Drowned mirrors. Shadow tendrils curling out of every crack, reaching for your light.`,`The last ring. Glass sand, mirrors, and shadow vines.`),
  xl('narr',`Up here the broken moon is so close you could almost touch it. It doesn't shine. It just hangs there, empty.`,`The broken moon is so close now. It does not shine.`),
  ...(G.flags.pip?[
    xl('ash',`Okay. Last ring. You can do this, Ash. Pip, tell me I can do this.`,`Last ring. Pip, tell me I can do this.`),
    xl('pip',`Mip!`,`Mip!`),
    xl('ash',`Thanks, Pip.`,`Thanks, Pip.`)
  ]:[xl('ash',`Okay. Last ring. You can do this, Ash.`,`Last ring. You can do this.`)]),
  xl('nyxara',`So close now. Come closer. Bring it to me. I have been so cold, for so long.`,`Come closer. Bring it to me. I am so cold.`)
]);
n4sBubDef('lagoon','pip',`Mip mip!`,`Mip mip!`);
n4sDef('n_hush_join',()=>[
  n4sDo(()=>n4sAllyArrive('hush')),
  xl('narr',`A great white moth glides down through the tendrils, as big as a barn. Two painted violet eyes on her wings, two real ones in the middle, blinking. A broken silver thread trails from her neck.`,`A huge white moth flies down. A broken silver thread hangs from her neck.`),
  xl('narr',`Wherever her soft glow touches them, the tendrils shiver and shrink away.`,`Her glow makes the shadow vines shrink away.`),
  xl('ash',`HUSH! You came!`,`Hush! You came!`),
  xl('f_hush',`Shhhh. Not so LOUD, little ember. ...It's so cold up here. The Mother promised a warm dark. She didn't mean it.`,`Shhh. Not so loud. It is cold. The Mother lied.`),
  xl('narr',`Hush lands beside you, close enough that her fuzzy wing brushes your arm.`,`Hush lands close to you.`),
  xl('ash',`...Yeah. I'm scared too. Let's go. Quietly.`,`I am scared too. Let's go. Quietly.`)
]);
n4sDef('n_hush_absent',()=>[
  xl('narr',`A single white moth scale drifts past, glittering. Then it's gone.`,`A white sparkle floats by. Then it is gone.`),
  xl('ash',`Hush?`,`Hush?`),
  xl('narr',`Nothing answers. Of course nothing answers.`,`Nothing answers.`)
]);
// 5.5 the Crown gathering (7.5): lines only for the friends who are here, in this order; it works with nobody too
n4sDef('n_gather',()=>{
  const n=n4sGatherCount(), L=[
    n4sDo(()=>{ N4ST.cam={x:3331,y:85860,k:0.55}; n4sGatherPose(true); }),
    xl('narr',`The Crown Shrine sits at the edge of the last ring. Above it, the summit. Around the summit, a moat of nothing, and a road of floating stones.`,`The shrine is at the top ring. The summit is across a dark moat.`)];
  if(n4sGrey()) L.push(xl('narr',`Greymane is already here, sitting by the shrine as if he has been waiting all day. He is wet. He definitely swam again.`,`Greymane is here! He is wet. He swam again.`));
  if(n4sTikka()) L.push(xl('ev_tikka',`ASH! I came on Dell's boat! I brought snacks! And my brother! And a BIGGER spoon!`,`Ash! I came on Dell's boat! I brought snacks and a bigger spoon!`),
    xl('ev_tock',`It's a ladle.`,`It is a ladle.`),
    xl('ev_tikka',`It's a BIGGER SPOON, Tock.`,`It is a BIGGER SPOON, Tock.`));
  if(n4sVes()) L.push(xl('c_vesper',`Told you. Thieves never take the stairs.`,`Told you. Thieves don't use stairs.`));
  if(n4sGla()) L.push(xl('narr',`Glaciar curls around the whole shrine like a wall of ice, and sniffs.`,`Glaciar curls around the shrine and sniffs.`),
    xl('f_glaciar',`Hmph. I have been to warmer funerals, dumpling.`,`Hmph. It is cold up here.`),
    xl('ash',`Nobody is having a funeral!`,`Nobody is having a sad party!`),
    xl('f_glaciar',`Good. I hate them.`,`Good.`));
  if(n4sHushF()) L.push(xl('narr',`Hush settles on the shrine roof, folds her wings, and shushes everybody. Nobody minds.`,`Hush sits on the roof. She says shhh to everyone.`));
  if(!n) L.push(xl('ash',`Just you and me, Pip.`,`Just you and me, Pip.`),...n4sIfL(()=>G.flags.pip,xl('pip',`Mip.`,`Mip.`)),xl('ash',`Yeah. That's plenty.`,`Yeah. That is enough.`));
  else L.push(xl('ash',`Look at all of you. I didn't bring an army. I brought... friends.`,`Look at you all. I brought friends!`));
  L.push(xl('ash',`Okay. Big moth. Broken moon. Let's go and give it back.`,`Okay. Big moth. Broken moon. Let's give it back.`));
  return L;
});
n4sDef('n_moondoor',()=>[
  n4sDo(()=>{ N4ST.cam={x:4500,y:85900,k:0.5}; }),
  xl('narr',`At the end of the Moon Road stands a round door of pale glass. There's no handle. Just a hollow in the middle, the size of a plum.`,`A round glass door. It has a hole the size of a plum.`),
  xl('ash',`The Heart. The door wants the Heart.`,`The door wants the Heart.`),
  ...n4sIfL(()=>G.flags.pip,xl('pip',`Mip?!`,`Mip?!`)),
  xl('ash',`I know. She WANTS me to bring it. That's the scary part.`,`I know. She wants the Heart. That is scary.`),
  xl('ash',`But Mom made it whole. Not her. Mom.`,`But Mom fixed it. Not her.`),
  n4sDo(()=>{ N4ST.doorFx={t:0}; n4sSfx('shrine'); }),
  xl('narr',`You hold up the Ember Heart. Its three seams glow, dusk-violet, ice-blue and moon-silver, around a core of warm orange. The door sighs open.`,`You hold up the Heart. It glows. The door opens.`)
]);
// 8.1 Nyxara (her fight's intro: STORY.bosses.n_nyxara.intro reads this)
n4sDef('n_nyxara_intro',()=>[
  n4sDo(()=>{ N4ST.cam={x:4500,y:85080,k:0.6}; }),
  xl('narr',`The summit is a wide round floor of pale glass, right under the broken moon.`,`The top is a round glass floor under the broken moon.`),
  xl('narr',`Something enormous is folded over the edge of the moon, like a blanket over a lamp. It unfolds.`,`Something huge is wrapped over the moon. It unfolds.`),
  xl('narr',`Wings. Wings as wide as a town square, grey and soft as dust, with two pale moons painted on them. A moth the size of a house.`,`Wings as big as a town! A moth the size of a house.`),
  xl('nyxara',`There you are. Little ember. Look how big you've grown.`,`There you are, little ember. How big you are.`),
  xl('ash',`Are you... my great-great-great...`,`Are you my great-great-great...`),
  xl('nyxara',`No.`,`No.`),
  xl('ash',`Oh, thank goodness.`,`Oh, good.`),
  xl('nyxara',`I am much older than your family, dear. I was here when the moon was new.`,`I am older than your family. I was here when the moon was new.`),
  xl('nyxara',`And you brought me your heart. Whole again. Your mother did such lovely work. A cracked heart can't burn, you see. A whole one can.`,`You brought me the Heart. Whole again. Now it can burn.`),
  xl('ash',`You wanted me to fix it. This whole time.`,`You wanted me to fix it. All along.`),
  xl('nyxara',`Shh. Shh. Don't be sad. Give it to me, and I'll make it burn black. Then the sun will go out, and the night will never end, and nobody, nobody will ever have to say goodbye again.`,`Give it to me. I will make it burn black. Then night never ends, and nobody says goodbye.`),
  xl('ash',`That's not a night. That's just a really long nap with no breakfast.`,`That is just a long nap with no breakfast!`),
  xl('ash',`Give the moon back, Nyxara.`,`Give the moon back, Nyxara.`),
  xl('nyxara',`Hush now, little ember. Go to sleep.`,`Hush, little ember. Go to sleep.`)
]);
// 8.3 the transitions between her phases (x4_foes plays them with n4sPhase(p,done), or reads N4S_PHASE)
n4sDef('n_trans12',()=>[
  xl('nyxara',`Enough of the floor. Let the sea come up and tuck you in.`,`No more floor. Let the dark sea come up.`),
  xl('narr',`Ink pours up out of the glass, and the summit floods with shadow. Only the rim and three pale platforms stay dry.`,`Black ink floods the floor. Only the edge and three platforms stay dry.`)
]);
n4sDef('n_trans23',()=>[
  xl('nyxara',`Fine. If you won't sleep, I will finish my supper.`,`Fine. I will finish my supper.`),
  xl('narr',`The ink drains up into the sky like rain falling the wrong way. Nyxara rises toward the last floating pieces of the moon.`,`The ink goes up into the sky. Nyxara flies to the last moon pieces.`),
  xl('ash',`She's eating the last pieces! Wings, Ash. Ride the wind!`,`She is eating the last pieces! Fly! Ride the wind!`)
]);
// her taunts during the fight (8.3, 8.5), and the friends' big moments in phase 4 (taunt lines, once each)
const N4S_TAUNT={
  p1:[S(`Shh, shh.`,`Shh, shh.`),S(`Why fight? Sleep is so soft.`,`Why fight? Sleep is so soft.`),S(`Nowhere to hide from the moonlight, dear. Except the pillars. I should have made fewer pillars.`,`You cannot hide. Except behind a pillar.`)],
  pulled:[S(`Tied down like a kite? That isn't kind, dear.`,`You tied me down? Not kind!`)],
  p2:[S(`Under the dark it's quiet. Come down. Stay.`,`Under the dark it is quiet. Stay.`)],
  pounded:[S(`Ow. That was a piece of my own moon you dropped on me.`,`Ow! You hit me with my own moon!`)],
  p3:[S(`Mmm. Crunchy.`,`Mmm. Crunchy.`),S(`The moon is mine. There's hardly any left now.`,`The moon is mine.`)],
  choked:[S(`*cough* Hot! Who puts fire in a moon?`,`*cough* Hot!`)],
  p4:[S(`Stop! You're letting it all OUT!`,`Stop! It is all coming out!`),S(`It's leaking! My moon is LEAKING!`,`My moon is leaking!`),S(`Everyone leaves. EVERYONE LEAVES.`,`Everyone leaves. EVERYONE LEAVES.`)]
};
const N4S_ALLYBEAT={
  greymane:['narr',S(`Greymane leaps and pins one of her wings to the floor!`,`Greymane pins her wing down!`)],
  glaciar:['f_glaciar',S(`Hold STILL, old moth.`,`Hold still!`)],
  grandpa:['grandpa',S(`Get AWAY from my grandchild, you oversized sock!`,`Get away from my grandchild, you big sock!`)],
  wardens:['iska',S(`Five lights, one for each of us. Stand close, Warden.`,`Five lights for you. Stand close!`)],
  ember:['ember',S(`I'm right here, Ash. Aim for the cracks.`,`I am here. Aim for the cracks!`)],
  tikka:['ev_tikka',S(`One lumpy bun, coming UP!`,`Here comes a bun!`)],
  cinder:['cinder',S(`None shall pass! Not even moths!`,`Nobody gets past me!`)],
  vesper:['c_vesper',S(`Hey, Night Mother! You've got a crack. Let me help with that.`,`Hey! You have a crack. Let me help!`)]
};
const N4S_HINT={
  1:S('Light the moon anchors with Moonfire. Then grapple the chains to pull her down!','Moonfire the pillars. Grapple the chains!'),
  2:S('Dive into a shadow pool to reach the glowing platform. Ground Pound it!','Dive in a pool. Pound the glowing platform!'),
  3:S('Fly! Ride the wind to the piece she is eating. Moonfire in her face!','Fly to her. Moonfire her face!'),
  4:S('Break the glowing cracks on her wings!','Hit the glowing cracks!')
};

// 6. the echoes: intros and outros (STORY.bosses[type] reads these), with the Act I ending's lines and the allies'
const n4sByEnd=(o)=>{ const e=n4sEnd(); return o[e]||o.hero||[]; };
n4sDef('n_echo1_intro',()=>[
  xl('narr',`On a black glass throne sits a dragon made of shadow. It looks exactly like Grandpa. It even has his frown.`,`A shadow dragon sits on a throne. It looks like Grandpa.`),
  xl('n_echo_vor',`So. You are what Ember's line became. Small. Soft. Barely a spark.`,`So. You are Ember's child. Small. Barely a spark.`),
  n4sByEnd({hero:xl('ash',`I heard you the first time, Grandpa. And I already won.`,`I heard you the first time. And I won.`),
    warden:xl('ash',`You're supposed to be asleep on the mountain. ...Oh. You're not him. You're a copy.`,`You should be asleep. Oh. You are just a copy.`),
    heir:xl('ash',`Small? I'm the dragon now. Sit.`,`Small? I am the dragon now. Sit!`),
    lantern:xl('ash',`That's not my grandpa. My grandpa wipes his feet.`,`You are not my grandpa. My grandpa wipes his feet.`)}),
  xl('n_echo_vor',`Then come and take it from me, hatchling.`,`Then come and take it, little one.`),
  xl('ash',`Okay. Again.`,`Okay. Again!`),
  ...(n4sCin()?[
    n4sDo(()=>n4sAllyArrive('cinder')),
    xl('cinder',`Halt! ...Oh. It is you, Emberblood. I said one last fight. It seems I miscounted.`,`Oh! It is you! I said one last fight. I counted wrong.`),
    xl('ash',`Sir Cindervane! You came back!`,`Sir Cindervane! You came back!`),
    xl('cinder',`Some knights do not know when to sit down. I hold the stairs. Go.`,`I will guard the stairs. Go!`)]:[]),
  ...n4sIfL(()=>n4sGrey()&&n4sAllyHere('greymane'),xl('narr',`Greymane's hackles rise. He has met this dragon before, too.`,`Greymane growls. He knows this dragon.`))
]);
n4sDef('n_echo1_outro',()=>[
  xl('narr',`The shadow dragon cracks like old glass and bursts into a cloud of moths.`,`The shadow dragon breaks into moths.`),
  xl('narr',`For a moment, one last memory hangs in the air. A voice, younger and sadder than any you ever heard him use.`,`A memory floats in the air. A sad voice.`),
  xl('n_memory',`...Ember? Is that you, up there with the lanterns?`,`Ember? Is that you with the lanterns?`),
  xl('ash',`Even the moon remembers you missing her, Grandpa.`,`The moon remembers you missed her, Grandpa.`),
  n4sByEnd({hero:xl('ash',`I hope you found her.`,`I hope you found her.`),
    warden:xl('ash',`Goodnight, Grandpa. The real one.`,`Goodnight, real Grandpa.`),
    heir:xl('ash',`I'm telling the little one on the shelf above Bertram's oven. He'll pretend he doesn't care. He'll care.`,`I will tell tiny Grandpa. He will care.`),
    lantern:xl('ash',`I'm telling him the moon remembers. He'll pretend he doesn't care. He'll care.`,`I will tell Grandpa. He will care.`)}),
  n4sDo(()=>n4sAllyLeave('cinder')),
  xl('narr',`Up ahead, a column of silver air roars up the cliff. The Wind Chimney.`,`Up ahead, the wind roars up the cliff.`)
]);
n4sDef('n_echo2_intro',()=>[
  xl('narr',`In a hall full of moth lamps, a masked figure waits. Then there are three of her. Then five.`,`A masked shadow waits. Then there are lots of her!`),
  xl('n_echo_vesper',`The Heart will give my family its fire back. She promised. She PROMISED.`,`The Heart will give my family fire. She promised!`),
  xl('ash',`She promised you lots of things. She lied about all of them.`,`She promised lots of things. She lied.`),
  ...n4sIfL(n4sVes,xl('c_vesper',`Do I really stand like that? With my elbow out? Ugh. Help me knock her down. I can't watch this.`,`Do I really stand like that? Ugh. Let's knock her down.`))
]);
n4sDef('n_echo2_outro',()=>[
  xl('narr',`The shadow thief spins, stumbles, and pops into a cloud of moths.`,`The shadow thief pops into moths.`),
  xl('narr',`A memory hangs in the air. A small voice, in a small room by the sea.`,`A memory floats by. A small voice by the sea.`),
  xl('n_memory',`Granny, why can't I make fire like the stories?`,`Granny, why can't I make fire?`),
  xl('n_memory',`Oh, duck. Fire isn't the only warm thing.`,`Oh, duck. Fire is not the only warm thing.`),
  ...(n4sVes()?[xl('c_vesper',`...She used to say that. Every night.`,`She used to say that every night.`),
    xl('ash',`She was right.`,`She was right.`),
    xl('c_vesper',`Don't make it a whole thing.`,`Don't make it a big thing.`)]
   :[xl('ash',`I hope you heard that, Vesper. Wherever you are.`,`I hope Vesper heard that.`)])
]);
n4sDef('n_echo3_intro',()=>[
  xl('narr',`On a throne of black ice, chained in frost, a shadow dragon lifts her head. Her breath is a blizzard.`,`A shadow ice dragon sits on an ice throne, in chains.`),
  xl('n_echo_glaciar',`The Mother says cold is kind. The Mother says sleep is kindest. The Mother says fire is a lie.`,`The Mother says cold is kind. Fire is a lie.`),
  xl('ash',`That's not you talking. That's the Shard. Well. A copy of you, with a copy of the Shard. This is very confusing.`,`That is the Shard talking. This is confusing!`),
  ...n4sIfL(n4sGla,xl('f_glaciar',`Was I really that dreary? Dumpling, I need a scarf. And you need to melt those chains.`,`Was I that gloomy? Melt those chains, dumpling!`))
]);
n4sDef('n_echo3_outro',()=>[
  xl('narr',`The ice cracks. The shadow dragon shatters into a flurry of moths.`,`The ice dragon breaks into moths.`),
  xl('n_memory',`Auntie Glee! Can we make the big snow? For the sledding?`,`Auntie Glee! Can we make snow for sledding?`),
  xl('n_memory',`Every year, dumpling. Every single year.`,`Every year, dumpling.`),
  ...(n4sGla()?[xl('f_glaciar',`I forgot the sledding. For a thousand years, I forgot it. Thank you for reminding me, dumpling.`,`I forgot the sledding. Thank you for reminding me.`),
    xl('ash',`Every Lantern Day. Sleds AND cake.`,`Every Lantern Day. Sleds and cake!`)]
   :[xl('ash',`Even ice dragons get lonely, huh, Pip?`,`Ice dragons get lonely too, Pip.`),...n4sIfL(()=>G.flags.pip,xl('pip',`Mip.`,`Mip.`))])
]);
n4sDef('n_echo4_intro',()=>[
  xl('narr',`In a hall of brass rings and drowned stars, a great shadow moth unfolds her wings. Two painted eyes stare at you. Then the two real ones blink.`,`A shadow moth opens her wings. Her eyes blink at you.`),
  xl('n_echo_hush',`Shhhhhh.`,`Shhhhh.`),
  ...n4sIfL(n4sHushF,xl('narr',`Beside you, the real Hush folds her wings over her eyes.`,`The real Hush covers her eyes.`),
    xl('ash',`It's okay, Hush. You don't have to watch.`,`It's okay, Hush. Don't look.`))
]);
n4sDef('n_echo4_outro',()=>[
  xl('narr',`The shadow moth falls apart into a hundred little moths that flutter away into the dark.`,`The shadow moth breaks into little moths.`),
  xl('n_memory',`My quiet one. Stay with me. Everyone else leaves.`,`My quiet one. Stay with me. Everyone else leaves.`),
  ...(n4sHushF()?[xl('narr',`Hush trembles. Then, slowly, she turns toward the top of the mountain.`,`Hush shakes. Then she looks up at the top.`),
    xl('ash',`We're going to go and see her, aren't we.`,`We are going to see her.`),
    n4sDo(()=>n4sAllyLeave('hush'))]
   :[xl('ash',`She said that to Hush every night. No wonder Hush only ever whispered.`,`She said that every night. No wonder Hush only whispers.`)])
]);
// 8.4 the Heart moment: the start, a voice for each seam (25, 50, 75, 90 percent) and the end
n4sDef('n_heart_start',()=>[
  xl('narr',`Nyxara swallows the last piece of the moon.`,`Nyxara eats the last piece of the moon.`),
  n4sDo(()=>{ if(N4ST.heart) N4ST.heart.darkTo=1; }),
  xl('narr',`And everything goes black.`,`Everything goes black.`),
  xl('narr',`Not dark. Black. No lanterns. No stars. You can't even see your own claws.`,`So black. You cannot see your claws.`),
  n4sDo(()=>{ if(N4ST.heart) N4ST.heart.puff=1.2; }),
  xl('narr',`You breathe fire. Nothing comes out but a little puff of smoke.`,`You breathe fire. Only smoke comes out.`),
  xl('ash',`My fire. My fire's going out.`,`My fire is going out!`),
  xl('nyxara',`Shh. There. Isn't that better? No more fighting. No more goodbyes. Give me the Heart, and we'll all just... rest.`,`There. No more fighting. Give me the Heart. Let's rest.`),
  n4sDo(()=>{ if(N4ST.heart) N4ST.heart.float=1; }),
  xl('narr',`Something tugs at your satchel. The Ember Heart floats up out of it, glowing faintly. Black flames lick at its edges.`,`The Heart floats out of your bag. Black fire licks at it.`),
  xl('narr',`It's still warm. Barely. And then you hear voices. Not from the dark. From the Heart.`,`It is still a little warm. Then you hear voices from the Heart.`)
],{again:true});
// the four voices: [speaker, line, light colour, who it is for the light]
function n4sSeamLines(k){
  // the act 5 data's four voices (n_seam_0..3; each voice's light is its emit n4fx:voice:<who>)
  const D=n4sData('n_seam_'+k); if(D&&typeof s10Lines==='function') return s10Lines(D,{sc:'n_seam_'+k});
  const v=(who,f,s,col)=>[n4sDo(()=>n4sVoice(who,col)),xl(who,f,s)];
  if(k===0) return n4sVes()?v('c_vesper',`Hey. Cousin. Emberbloods without fire still have warm hands. Here. Take mine.`,`Cousin. I have no fire. But my hands are warm. Take them.`,'180,140,255')
    :v('juniper',`Ash! You can't get lost now. I drew you a map. Follow it home!`,`Ash! You can't get lost. I drew you a map!`,'180,140,255');
  if(k===1) return n4sGla()?v('f_glaciar',`Cold keeps things, she says. Warm GIVES things. Give, dumpling.`,`Cold keeps things. Warm gives things. Give, dumpling!`,'150,210,255')
    :v('elka',`Faster than a wolf, Ash! FASTER!`,`Faster than a wolf, Ash!`,'150,210,255');
  if(k===2) return n4sHushF()?[n4sDo(()=>n4sVoice('f_hush','236,232,255')),xl('narr',`A soft white light settles on your shoulder. Hush. For once, she doesn't say shhh.`,`Hush lands on your shoulder. She does not say shhh.`),
      xl('f_hush',`...Hold on, little ember. Hold on.`,`Hold on.`)]
    :v('quill',`The moon always comes back, Ash. I have measured it. Every month. It's the most reliable thing I know.`,`The moon always comes back. I measured it.`,'226,232,255');
  // the core: Mom, Tikka's lantern (if she stayed home), then the Act I ending
  const L=[...v('maren',`Ash! I can feel it from here. Don't you dare go out. You still haven't eaten your sandwich.`,`Ash! Don't you go out! You did not eat your sandwich!`,'255,170,90')];
  if(G.flags.tk_come==='home') L.push(n4sDo(()=>n4sVoice('ev_tikka','255,200,120')),xl('narr',`Far, far away in Embermere, in one small window, a lantern is burning. Tikka promised.`,`Far away, Tikka's lantern burns in her window.`));
  const e=n4sEnd();
  if(e==='lantern') L.push(n4sDo(()=>{ n4sVoice('grandpa','255,140,70'); N4ST.heart&&(N4ST.heart.grandpa=1); }),
    xl('narr',`Far below, a small orange light is climbing up out of the dark. It's flapping very hard.`,`A small orange light flies up from below. It flaps very hard.`),
    xl('grandpa',`Nobody. Puts out. MY. Grandchild.`,`Nobody puts out MY grandchild!`),
    xl('narr',`Grandpa lands on your head, which is rude, and breathes into the Heart with you. It's the first fire he has breathed in a whole year. It's a big one.`,`Grandpa lands on your head and breathes fire into the Heart with you.`));
  else if(e==='warden') L.push(n4sDo(()=>{ if(N4ST.heart) N4ST.heart.wardens=1; n4sVoice('iska','255,214,150'); }),
    xl('narr',`Five small lights blink on around you. One, two, three, four, five.`,`Five little lights shine around you.`),
    xl('iska',`Sixth Warden. We felt the dark from our Ward-fires. We came.`,`Sixth Warden. We felt the dark. We came.`),
    xl('bram',`And to SHOUT! BREATHE, kid!`,`BREATHE, kid!`),
    n4sDo(()=>n4sVoice('vor','255,120,60')),
    xl('vor',`...Breathe from your belly, hatchling. Not your nose.`,`Breathe from your belly, little one.`));
  else if(e==='heir') L.push(n4sDo(()=>{ if(N4ST.heart) N4ST.heart.belly=1; n4sVoice('ash','255,150,60'); }),
    xl('narr',`The fire you took from Grandpa, the fire that once made you huge, wakes up deep in your belly.`,`The big fire you once had wakes up in your belly.`),
    xl('grandpa',`(very far away, from the warm shelf above Bertram's oven) You call that a flame? Do it BIGGER.`,`(far away) Is that a flame? Do it BIGGER!`),
    xl('ash',`Thanks, Grandpa.`,`Thanks, Grandpa.`));
  else L.push(n4sDo(()=>n4sVoice('ember','255,190,120')),
    xl('ember',`Little ember. Remember what my father taught me? Breathe from your belly. Not your nose.`,`Little ember. Breathe from your belly.`));
  return L;
}
n4sDef('n_heart_end',()=>[
  xl('narr',`The Heart flickers. Almost. Almost.`,`The Heart flickers. Almost!`),
  ...(G.flags.pip?[
    n4sDo(()=>{ if(N4ST.heart) N4ST.heart.pip=1; }),
    xl('narr',`Then Pip climbs up your arm, puffs out every single scale, and says, very loudly, the first word Pip has ever said.`,`Then Pip climbs up your arm. Pip says a word for the very first time.`),
    {who:'pip',text:S(`ASH!`,`ASH!`),fn:()=>{ if(N4ST.heart) N4ST.heart.word=1; n4sSfx('levelup'); try{ shake(6); }catch(e){} }},
    n4sDo(()=>{ if(N4ST.heart) N4ST.heart.spark=1; }),
    xl('narr',`And Pip breathes one tiny spark into the Heart.`,`Pip breathes one tiny spark into the Heart.`)
  ]:[xl('narr',`You breathe one last time, from your belly. One tiny spark catches.`,`You breathe one more time. A tiny spark catches.`)]),
  {who:'narr',text:S(`The Ember Heart blazes like a sunrise.`,`The Heart shines like the sun!`),fn:()=>n4sHeartBlaze()},
  ...n4sIfL(()=>G.flags.pip,xl('ash',`Did Pip just... TALK?`,`Did Pip just TALK?`),xl('pip',`Mip.`,`Mip.`)),
  xl('nyxara',`No. No, no, no. That light is MINE!`,`No! That light is MINE!`),
  xl('ash',`It's not yours. It never was. Let's finish this.`,`It is not yours. Let's finish this.`)
],{again:true});
// 9. the fall, the plea (or the hint), the choice
n4sDef('n_fall',()=>[
  n4sDo(()=>{ n4sCutFall(); }),
  xl('narr',`The last crack bursts. Light pours out of Nyxara's wings in a great silver river, up, up, into the empty moon.`,`The last crack breaks. Silver light pours up into the moon.`),
  n4sDo(()=>{ if(N4ST.cut) N4ST.cut.fillTo=0.6; }),
  xl('narr',`The moon starts to fill. Slowly. Like a cup.`,`The moon starts to fill up, like a cup.`),
  n4sDo(()=>{ if(N4ST.cut&&N4ST.cut.nyx) N4ST.cut.nyx.sTo=0.62; }),
  xl('narr',`Nyxara crumples onto the glass. She's still big. But she's getting smaller. Every second, smaller.`,`Nyxara falls down. She gets smaller and smaller.`),
  n4sDo(()=>{ if(N4ST.cut&&N4ST.cut.nyx) N4ST.cut.nyx.sliver=1; }),
  xl('narr',`In her claws she holds one last sliver of moon, tight, the way you'd hold a blanket.`,`She holds the last bit of moon tight, like a blanket.`),
  xl('nyxara',`Don't. Please. It always leaves. Every morning it goes away. Every month it gets thin. I only wanted it to stay.`,`Please don't. It always goes away. I only wanted it to stay.`),
  xl('ash',`My grandpa said "mine" too. About the whole valley. It made him so lonely he turned into a mountain.`,`My grandpa said "mine" too. It made him so lonely.`),
  xl('nyxara',`Everyone leaves, little ember.`,`Everyone leaves.`),
  xl('ash',`Yeah. The moon leaves every morning. And it comes back every night. That's not leaving. That's... visiting.`,`The moon goes every morning. And comes back every night. That is visiting!`)
]);
n4sDef('n_plea',()=>[
  ...n4sIfL(n4sVes,xl('c_vesper',`She found me when I was little and alone, and she promised me fire. I know what lonely sounds like. That's what it sounds like.`,`She found me when I was lonely. I know that sound.`)),
  ...n4sIfL(n4sGla,xl('f_glaciar',`You froze my mountain to keep things, old moth. It kept nothing. It only kept me asleep.`,`Your cold kept nothing. It only kept me asleep.`)),
  ...n4sIfL(n4sHushF,xl('narr',`Hush lands in front of her mother and folds her wings around her mother's claws.`,`Hush folds her wings around her mother.`),
    xl('f_hush',`Mother. Let go.`,`Mother. Let go.`)),
  xl('ash',`Nyx.`,`Nyx.`),
  xl('narr',`Nyxara goes very, very still.`,`Nyxara goes very still.`),
  xl('nyxara',`Nobody has called me that in a thousand years. Not since the girl with the lantern.`,`Nobody has called me that in a thousand years.`),
  xl('ash',`Ember was sorry she stopped climbing the hill. So I climbed it instead. I can light you a lantern.`,`Ember was sorry she stopped coming. I came instead. I can light you a lantern.`)
]);
// (why the kind ending is closed: so kids know next time)
function n4sClosedLines(){
  const L=[];
  if(!n4sKnows()) L.push(xl('narr',`You wish you knew her real name. Something tells you she had one, once.`,`You wish you knew her real name.`));
  if(n4sFreed()<2) L.push(xl('narr',`She won't listen to you. Maybe she would listen to someone she hurt, if they were here to speak for her.`,`She won't listen. Maybe the friends she hurt could help.`));
  return L;
}
// 10. the three endings (the title, the number on the victory screen, the lines)
const N4S_ENDINGS={
  dawn:{title:S('Morning','Morning'),n:1,msg:S('You ended the Long Night, and the morning came.','You ended the Long Night. Morning came!'),lines:()=>{
    const e=n4sEnd(); return [
    xl('ash',`I'm not giving it to you. And there's no more Long Night, for anyone.`,`I will not give it to you. No more Long Night.`),
    n4sDo(()=>n4sCutDo('breath')),
    xl('narr',`You breathe Heartfire, gold and silver, the biggest breath of your whole life.`,`You breathe gold and silver fire. Your biggest breath ever.`),
    n4sDo(()=>n4sCutDo('moths')),
    xl('narr',`Nyxara doesn't scream. She sighs, like someone falling asleep. And she comes apart into a thousand tiny silver moths.`,`Nyxara sighs. She turns into a thousand tiny silver moths.`),
    n4sDo(()=>n4sCutDo('stitch')),
    xl('narr',`The moths fly up and up, to the moon, and settle on its cracks, and stitch it back together like a quilt.`,`The moths fly up and fix the moon, like sewing a quilt.`),
    n4sDo(()=>n4sCutDo('mended')),
    xl('narr',`When they're done, the moon is whole again. You can still see the seams if you look. Silver lines, like a mended cup.`,`The moon is whole again. You can see silver lines where it was fixed.`),
    n4sDo(()=>n4sCutDo('sunrise')),
    xl('narr',`Then, far away at the edge of the world, the sky goes pink. Then gold. Then blue.`,`Far away, the sky turns pink. Then gold. Then blue.`),
    xl('ash',`Morning. It's actually morning.`,`Morning! It is really morning!`),
    ...n4sIfL(n4sHushF,xl('narr',`Hush watches the silver moths stitch the moon. She doesn't say anything, not even shhh. But she stays until the very last one.`,`Hush watches the moths fix the moon. She stays till the end.`)),
    ...n4sIfL(e==='lantern',xl('grandpa',`A mended moon. Like a mended sock. Very practical. Ember would have liked it.`,`A fixed moon. Like a fixed sock. Ember would like it.`)),
    ...n4sIfL(e==='warden',xl('bram',`HA! Morning! I'd forgotten what it looked like!`,`Ha! Morning! I forgot what it looks like!`)),
    ...n4sIfL(e==='hero',xl('ember',`Good morning, Ash. It's a lovely one.`,`Good morning, Ash.`)),
    ...n4sIfL(n4sVes,xl('c_vesper',`Morning. I've never stayed up all night for something good before.`,`Morning. I never stayed up all night for a good thing before.`)),
    xl('narr',`The Long Night was over. And the night after it was just a night: dark, and starry, and short, and completely normal.`,`The Long Night was over. The next night was just a normal night.`)]; }},
  embermoon:{title:S('The Ember Moon','The Ember Moon'),n:2,msg:S('You gave the Ember Heart to the sky, and the moon burned gold.','You gave the Heart to the moon. It glows gold!'),lines:()=>{
    const e=n4sEnd(); return [
    xl('ash',`You can't keep the moon by eating it. But maybe you could keep warm by it.`,`You can't keep the moon by eating it. But it could keep you warm.`),
    n4sDo(()=>n4sCutDo('hold')),
    xl('narr',`You hold up the Ember Heart. It's blazing, gold and silver, the warmest thing in the world.`,`You hold up the Heart. It is so warm.`),
    n4sDo(()=>n4sCutDo('throw')),
    xl('narr',`Then you give it away: straight up, as high as you can throw.`,`Then you throw it up to the moon, a gift.`),
    ...n4sIfL(()=>G.flags.pip,xl('pip',`MIP?!`,`MIP?!`)),
    n4sDo(()=>n4sCutDo('catch')),
    xl('narr',`The Heart flies up and up, into the empty moon. And the moon catches fire.`,`The Heart flies into the empty moon. The moon catches fire!`),
    xl('narr',`Not a scary fire. A lantern fire. Warm and orange and soft, like a window at night when somebody is waiting up for you.`,`A warm lantern fire. Like a window when someone waits for you.`),
    xl('narr',`Nyxara looks up at it. Her eyes fill with orange light. For the first time in a thousand years, she isn't cold.`,`Nyxara looks at it. For the first time, she is not cold.`),
    xl('nyxara',`...Oh.`,`Oh.`),
    n4sDo(()=>n4sCutDo('curl')),
    xl('narr',`She lets go of the last sliver of moon, flies up, and curls round the new warm moon like a cat round a stove. And she falls asleep.`,`She lets go of the last bit of moon. She curls up on the warm moon like a cat, and sleeps.`),
    xl('narr',`From then on, the moon over all four lands was gold, like a Lantern Day lantern. Every night was a little bit Lantern Night.`,`From then on the moon was gold. Every night was a bit like Lantern Night.`),
    xl('narr',`The Ember Heart was gone from the family. But everyone, everywhere, could see it. Every single night.`,`The Heart was gone. But everyone could see it every night.`),
    ...n4sIfL(n4sHushF,n4sDo(()=>{ N4ST.gone.hush=1; n4sAllyLeave('hush'); }),xl('narr',`Hush flew up to the warm gold moon and curled up next to her mother.`,`Hush flew up and curled up next to her mother.`)),
    ...n4sIfL(e==='lantern',xl('grandpa',`Now THAT is a proper moon. Orange. Like a dragon's eye. Like... hers.`,`Now that is a good moon. Orange, like Ember's eyes.`)),
    ...n4sIfL(e==='warden',xl('tove',`A warm moon! That's the best kind of moon there is.`,`A warm moon! The best kind!`)),
    ...n4sIfL(e==='hero',xl('ember',`My Heart, up in the sky. Oh, Ash. Now everyone can see it.`,`My Heart in the sky! Now everyone can see it.`)),
    ...n4sIfL(n4sVes,xl('c_vesper',`You gave the moon a magic heart, cousin. Gran is going to want the whole story. Twice.`,`You gave the moon a magic heart! Gran will want the whole story.`))]; }},
  moth:{title:S('The Moth and the Moon','The Moth and the Moon'),n:3,msg:S('You called her Nyx and lit her a lantern, and the moon came home.','You lit Nyx a lantern. The moon came home.'),lines:()=>{
    const e=n4sEnd(); return [
    n4sDo(()=>n4sCutDo('lantern')),
    xl('narr',`You take out a little paper lantern. It's a bit squashed. It's been through a lot. You light it, very gently.`,`You take out a little paper lantern. You light it gently.`),
    xl('ash',`Here. This one's yours. It won't last forever. Lanterns don't. That's why we light a new one every year.`,`This one is yours. Lanterns don't last forever. So we light new ones every year.`),
    xl('narr',`Nyxara looks at the lantern for a long, long time. Then she opens her claws.`,`Nyxara looks at the lantern for a long time. Then she lets go.`),
    n4sDo(()=>n4sCutDo('click')),
    xl('narr',`The last sliver of moon floats up out of them, up into the sky, and clicks into place like the last piece of a puzzle.`,`The last bit of moon floats up. It clicks into place.`),
    n4sDo(()=>n4sCutDo('whole')),
    xl('narr',`The moon is whole. Round and silver and enormous. The whole peak lights up as if it's made of milk.`,`The moon is whole and bright again!`),
    n4sDo(()=>n4sCutDo('small')),
    xl('narr',`And Nyxara gets small. Smaller. Until she's just a little grey moth with two pale moons on her wings, sitting on a paper lantern.`,`Nyxara gets small. She is a little grey moth again, sitting on the lantern.`),
    xl('nyxara',`...It's so warm.`,`It is so warm.`),
    xl('narr',`Every night after that, if you looked very closely at the full moon, you could see a tiny moth sitting on it. Waiting. She got very good at waiting.`,`After that, you could see a tiny moth on the full moon. Waiting.`),
    xl('narr',`And every month, when the moon grew thin, she didn't panic. She knew. It always comes back.`,`When the moon got thin, she did not worry. It always comes back.`),
    ...n4sIfL(n4sHushF,n4sDo(()=>{ N4ST.gone.hush=1; n4sAllyLeave('hush'); }),xl('narr',`Hush flew up to sit beside her. The two moths watched the moon together, and neither of them said anything, and it was perfect.`,`Hush sat next to her. They watched the moon together.`)),
    ...n4sIfL(e==='lantern',xl('grandpa',`Hmph. I wanted to say "mine" about that moon. I'm glad I didn't.`,`I wanted to say "mine" about the moon. I am glad I didn't.`)),
    ...n4sIfL(e==='warden',xl('iska',`Light one more than you need. You did, Warden. You lit one for her.`,`You lit one more lantern. One for her.`)),
    ...n4sIfL(e==='hero',xl('ember',`You lit her a lantern. That's what I did, a thousand years ago. Thank you for finishing it, Ash.`,`You lit her a lantern, like I did. Thank you.`)),
    ...n4sIfL(n4sGla,xl('f_glaciar',`She will be cold sometimes. Everyone is. That is what friends are for.`,`Everyone is cold sometimes. That is what friends are for.`)),
    ...n4sIfL(n4sVes,xl('c_vesper',`A moth on the moon. Of course. Of COURSE she's a moth again.`,`Of course she is a little moth again.`))]; }}
};
const N4S_SOFAR_END={
  dawn:S(`Ash would not hand the Heart over in fear. He breathed the biggest fire of his life, and Nyxara came apart into a thousand silver moths that stitched the moon back together. Then the sky turned pink, and it was morning.`,`Ash would not give her the Heart. The moths fixed the moon. Morning came.`),
  embermoon:S(`Ash gave the Ember Heart away, freely, to the empty moon. Given, it burned gold instead of black, and Nyx sleeps curled round it like a cat round a stove, warm at last.`,`Ash gave the Heart to the moon. The moon is gold and warm now. Nyx sleeps on it.`),
  moth:S(`Ash called her by her old name and lit her Mom's paper lantern. It won't last forever. Lanterns never do, which is why you light new ones. She let the moon go home and became a small grey moth again, one who visits.`,`Ash lit a lantern for Nyx. She let the moon go. Now she is a little moth who visits.`)};
// the journal's "story so far" for n_end (e7b_threads' recap reads it too)
function endingSoFar(){ return N4S_SOFAR_END[G&&G.choices&&G.choices.n_end]||''; }
// 11. the dawn (after every ending)
n4sDef('n_dawn_lines',()=>{
  const e=n4sEnd(), L=[];
  if(e==='heir'&&(N4ST.big>0.05||G.flags.n_big)) L.push(n4sDo(()=>{ N4ST.bigTo=0; }),xl('narr',`You shrink back to your normal size, which is a relief. The Moon Door was not built for dragons your size.`,`You shrink back to normal. Good thing!`));
  L.push(n4sDo(()=>{ N4ST.dawnTo=1; N4ST.cam={x:4500,y:85100,k:0.5}; }),
    xl('narr',`As the light comes back, the black glass of the peak turns as clear as water. Little white flowers push up through the cracks. Nobody knows where they came from.`,`The black glass turns clear. Little white flowers grow in the cracks.`),
    n4sDo(()=>{ N4ST.duchShow=1; const D=n4sDuchPlace(); N4ST.cam={x:D.x,y:D.y,k:0.5}; }),
    xl('narr',`And there, at the very top of the summit, where nothing could possibly have climbed...`,`And there, at the very top, where nobody could climb...`),
    xl('goat',`Meh.`,`Meh.`),
    {who:'ash',text:S(`DUCHESS?! HOW?!`,`DUCHESS?! HOW?!`),fn:()=>n4sDuchessSeen()},
    xl('goat',`Meh.`,`Meh.`));
  if(e==='lantern') L.push(xl('grandpa',`Not HER.`,`Not HER.`),xl('goat',`Meh.`,`Meh.`));
  if(G.flags.pip) L.push(xl('pip',`Mip!`,`Mip!`));
  L.push(n4sDo(()=>{ N4ST.homeBound=1; }));
  if(n4sGla()) L.push(xl('f_glaciar',`Climb on, dumplings. All of you. Yes, even the goat. ...Especially not the goat. Fine. The goat. Slowly, mind. I only do slowly.`,`Climb on, everyone. Even the goat.`));
  else L.push(xl('dell',`All aboard the Soggy Biscuit! Mind the fish. There aren't any fish. Mind them anyway.`,`All aboard! Let's go home.`));
  return L;
});
// 16. the Moth Memories: six glass panes (x4_ascent places them and calls n4sPane(k); stand-ins below when it is absent)
const N4S_PANE={
 1:{title:S(`The New Moon`,`The New Moon`),at:[650,84700],lines:()=>[
   xl('narr',`In the glass: a brand-new moon, round and bright, and one tiny grey moth dancing round it.`,`A new moon. A tiny moth dances around it.`),
   xl('n_memory',`When the moon was new, it had one moth. She loved it more than anything.`,`The moon had one moth. She loved it so much.`)]},
 2:{title:S(`Every Morning`,`Every Morning`),at:[5765,81600],lines:()=>[
   xl('narr',`The moon is sinking behind the hills. The little moth is chasing it, and she can't keep up.`,`The moon goes down. The moth chases it.`),
   xl('n_memory',`Every morning the moon went away, and every morning she waited for it to come back. It always did. She worried every time that it wouldn't.`,`Every morning the moon left. It always came back. She always worried.`)]},
 3:{title:S(`The Girl with the Lantern`,`The Girl with the Lantern`),at:[5475,82522],lines:()=>[
   xl('narr',`A hill at night. A girl with little horns holds up a paper lantern, and the little moth sits on it, warming her wings.`,`A girl with horns holds a lantern. The moth sits on it to get warm.`),
   xl('n_memory',`On the very first Lantern Day, a girl named Ember lit a lantern on a hill. The cold little moth came down to be warm. Ember called her Nyx.`,`On the first Lantern Day, Ember lit a lantern. The moth came to be warm. Ember named her Nyx.`)]},
 4:{title:S(`Someone Else Lit It`,`Someone Else Lit It`),at:[6332,85867],lines:()=>[
   xl('narr',`The same hill, many years later. Someone else is lighting the lantern. The moth looks for the girl with horns. She isn't there.`,`Years later. Someone else lights the lantern. The girl is gone.`),
   xl('n_memory',`Ember lit a lantern every year. Then one year someone else lit it. Ember had grown old and gone, the way people do. Nyx did not understand.`,`One year, Ember was gone. Nyx did not understand.`)]},
 5:{title:S(`Thinner Every Month`,`Thinner Every Month`),at:[3659,84359],lines:()=>[
   xl('narr',`The moon is a thin silver curl. The moth is wrapped round it, holding on.`,`The moon is thin. The moth holds on to it.`),
   xl('n_memory',`Every month the moon grew thin. "It will leave me too," thought Nyx. "Everyone leaves." She grew bigger, and colder, and very, very afraid.`,`"The moon will leave me too," Nyx thought. She grew big and cold and scared.`)]},
 6:{title:S(`Just One Bite`,`Just One Bite`),at:[4093,86318],lines:()=>[
   xl('narr',`A huge grey moth with her mouth open, and a bite out of the moon.`,`A huge moth takes a bite of the moon.`),
   xl('n_memory',`So she took a bite. Just a small one. To keep it safe inside her, where it could never leave. Then she took another.`,`She took a bite to keep it safe inside her. Then another.`)]}
};
n4sDef('n_panes_all',()=>[
  xl('ash',`All six pictures, and she's scared in every one. Even when she was tiny.`,`She is scared in every picture. Even when she was tiny.`)
]);

// 12. the grand epilogue: the Thousand-and-First Lantern Day. A storybook read over painted scenes, one per land.
// Every condition adds at most one line; each act gets at most two side-quest lines from EPI (THREADS 18.3), never one
// about a friend whose own line is already here (Vesper, Glaciar, Hush) and never the Great Hearth twice.
function n4sEpiPick(k,skip){
  let L=[]; try{ if(typeof EPI!=='undefined'&&EPI[k]){ const ok=EPI[k].map((e,i)=>({e,i})).filter(({e})=>{ try{ if(!e||!e.line) return false; const t=String(e.line[1]||''); if(skip&&skip.test(t)) return false; return !e.cond||!!e.cond(); }catch(err){ return false; } });
    ok.sort((a,b)=>((b.e.pri||0)-(a.e.pri||0))||(a.i-b.i)); L=ok.slice(0,2).map(({e})=>e.line); } }catch(e){ console.error(e); }
  return typeof pbNorm==='function'?pbNorm(L):L;
}
function n4sSimpleOf(full){ try{ const v=SIMPLE&&SIMPLE.map&&SIMPLE.map[h32(full)]; return v||full; }catch(e){ return full; } }
function n4sDuchessAll(){ const F=G.flags; return n4sQ('duchess')&&!!F.c_duchess&&!!F.f_duchess&&!!F.m_duchess&&!!F.n_duchess; }
function n4sDuchessN(){ const F=G.flags; return (n4sQ('duchess')?1:0)+(F.c_duchess?1:0)+(F.f_duchess?1:0)+(F.m_duchess?1:0)+(F.n_duchess?1:0); }
function n4sPanesN(){ let n=0; for(let k=1;k<=6;k++) if(G.found['n_pane_'+k]) n++; return Math.max(n,G.flags.n_panes|0); }
function n4sEpiLines(){
  const c=G.choices, e=n4sEnd(), F=G.flags, end=c.n_end, L=[], sc=k=>n4sDo(()=>n4sBookScene(k));
  L.push(n4sDo(()=>{ n4sBookOpen(); F.n_epi=1; }),sc('green'),
    xl('narr',`This is what happened after the Long Night, to everyone in this story.`,`This is what happened next, to everyone.`));
  // ---- Embermere (the green at dusk)
  if(c.fennick==='forgive') L.push(xl('narr',`When the moon was gone, Fennick Wick kept every lantern in Emberhollow burning all night, every night, so nobody had to be scared of the dark. After that, nobody called him "the lamp-man." They called him "the light-man." He cried a bit.`,`Fennick kept every lantern lit in the dark. Now people call him the light-man.`));
  else if(c.fennick==='jail') L.push(xl('narr',`During the Long Night the Watch House was the brightest place in Brindlecross, because Fennick polished every lamp in it. When it was over, Captain Osric gave him a medal. It was a lamp.`,`Fennick polished every lamp in the Watch House. He got a medal. It was a lamp.`));
  if(c.morrow==='free') L.push(xl('narr',`Morrow's pumpkins grew so big in the new moonlight that he won a ribbon. The ribbon was not on fire. He framed it.`,`Morrow grew giant pumpkins and won a ribbon.`));
  else if(c.morrow==='jail') L.push(xl('narr',`Morrow wrote a book in the Watch House library: "Never Trust a Voice in Your Dreams." It sold very well.`,`Morrow wrote a book: "Never Trust a Voice in Your Dreams."`));
  if(c.greymane==='ally') L.push(xl('narr',`Greymane's pack ran the high snow again, and on every full moon they howled at it, just to make sure it was still there.`,`Greymane's wolves howl at the moon to check it is still there.`));
  else if(c.greymane==='home') L.push(xl('narr',`Greymane's pack howled at the moon every night it came back. Farmer Hollis said it was the happiest howling he'd ever heard.`,`Greymane's wolves howl happily at the moon every night.`));
  if(c.cinder==='ally') L.push(xl('narr',`Sir Cindervane finally, finally sat down. He said "good." Then he said "no more echoes, please." Then he rested.`,`Sir Cindervane finally sat down and rested.`));
  else if(c.cinder==='rest'){ const k=F.dr_knight;
    if(k==='spark') L.push(xl('narr',`The little spark in Sir Cindervane's gauntlet at the Obsidian Gate never went out. Not even in the Long Night.`,`The spark in Sir Cindervane's glove never went out.`));
    else if(k==='joke') L.push(xl('narr',`Visitors to the Obsidian Gate say you can still hear a knight chuckling under his helmet. He laughed all through the Long Night.`,`At the Gate, you can still hear a knight laughing.`));
    else L.push(xl('narr',`The red flower on Sir Cindervane's helmet at the Obsidian Gate never wilted. Not even in the Long Night.`,`The flower on Sir Cindervane's helmet never wilted.`)); }
  try{ const t=typeof evEpilogue==='function'?evEpilogue():null;
    if(t){ if(F.tk_come==='yes'){ const full=String(t[1]), simp=n4sSimpleOf(full); L.push(['narr',S(full+` She hung her bigger spoon over the oven. Tock still says it's a ladle.`,simp+` She hung her big spoon over the oven.`)]); } else L.push(t); } }catch(err){ console.error(err); }
  L.push({hero:xl('narr',`On Lantern Day, Ash lit one lantern for Grandpa, the way Ember used to, so he'd know where home was, wherever he was.`,`Ash lit one lantern for Grandpa, so he would know where home was.`),
    warden:xl('narr',`Ash climbed Cinder Mountain to tell Grandpa the whole story. He pretended to be asleep. He was listening to every word.`,`Ash told sleeping Grandpa the whole story. He listened to every word.`),
    heir:xl('narr',`From his warm shelf above the oven, tiny Grandpa told everyone in the bakery that he had saved the moon himself. Bertram saved him the darkest bun in the batch. It is his favorite.`,`Tiny Grandpa said he saved the moon. Bertram gave him a bun.`),
    lantern:xl('narr',`Grandpa told all of Emberhollow that he had saved the moon single-handed. Duchess bit him. Mom made them both wipe their feet.`,`Grandpa said he saved the moon. Duchess bit him. Mom made them wipe their feet.`)}[e]);
  if(n4sQ('hollow')) L.push(xl('narr',`Juniper Ashby's map of Embermere grew three new pages: the Clockwork Coast, Frostreach and Moonfall. And one small one: a spiral mountain, labelled "DON'T."`,`Juniper drew maps of every land. And one mountain, labelled "DON'T."`));
  // ---- the Clockwork Coast (Gearhaven's clock towers at sunrise)
  L.push(sc('clocks'),xl('narr',`Every clock in Gearhaven started ticking again at the very same second. The tinkers called it a malfunction. It was a celebration.`,`Every clock in Gearhaven started ticking again at once.`));
  if(n4sVes()) L.push(xl('narr',`Vesper took off her moth mask and hung it in Mom's forge. "Emberblood without fire," she said. "Still an Emberblood." Every Lantern Day she lights her lantern from the forge, with Mom's tongs.`,`Vesper hung up her mask. She lights her lantern from the forge. She is still family.`));
  else if(c.c_vesper==='foe') L.push(xl('narr',`Nobody in Gearhaven saw the Moth Mask again. But every Lantern Day, a small lantern appeared on the forge doorstep in Emberhollow, with no note. Maren always lit it.`,`Every Lantern Day, a lantern with no note appears at the forge. Mom lights it.`));
  L.push(...n4sEpiPick('c',/Vesper|Moth Mask/));
  // ---- Frostreach (Hearthold's Great Hearth)
  L.push(sc('hearth'),xl('narr',`The Great Hearth of Hearthold burned so high that the whole town took off their scarves for the first time in a hundred years. Then they put them back on. It's still the north.`,`The Great Hearth burned so high that everyone took off their scarves. Then put them back on.`));
  if(n4sGla()) L.push(xl('narr',`Auntie Glee came to Lantern Day with far too much ice cream, and stayed until the very last lantern went out. She said she had slept through enough of them.`,`Auntie Glee came to Lantern Day. She stayed until the last lantern went out.`));
  else if(c.f_glaciar==='defeat') L.push(xl('narr',`On Mount Dread the snow fell softly, and stopped when it was supposed to. Glaciar slept, and dreamed, and for the first time in a long while her dreams were warm. Every Lantern Day somebody climbed up and sang her a verse of the Snow Mother's Song, just in case.`,`On Mount Dread, Glaciar slept. Her dreams were warm.`));
  L.push(...n4sEpiPick('f',/Glaciar|Great Hearth/));
  // ---- Moonfall (the Eclipse Observatory under the new moon)
  L.push(sc('observatory'));
  if(n4sHushF()&&end==='dawn') L.push(xl('narr',`Hush stayed in Moonfall and became the Eclipse Observatory's first moth astronomer. She shushes anyone who is loud near the telescopes. Professor Quill says she is the best colleague she has ever had.`,`Hush works at the Observatory now. She shushes loud people. Professor Quill loves her.`));
  else if(c.m_hush==='foe') L.push(xl('narr',`Some nights in the Glass Desert, little white moths gather round travellers' lanterns. They never bite. They only want to be warm.`,`In the desert, little white moths sit by lanterns. They just want to be warm.`));
  L.push(...n4sEpiPick('m',/Hush/));
  // ---- the moon (over the green)
  L.push(sc('moon'));
  if(end==='moth') L.push(xl('narr',`If you look at the full moon on a clear night, you'll see her: a tiny moth, sitting very still, keeping it company.`,`Look at the full moon. You will see a tiny moth there.`));
  else if(end==='dawn') L.push(xl('narr',`The moon kept its silver seams forever, like a scar you are secretly proud of.`,`The moon kept its silver lines forever.`));
  else if(end==='embermoon') L.push(xl('narr',`The moon stayed gold, and every night, everywhere, looked a little bit like Lantern Night.`,`The moon stayed gold. Every night felt like Lantern Night.`));
  if(n4sPanesN()>=6) L.push(xl('narr',`Sister Wren wrote it all down: The Account of the Long Night. It had six glass pictures of a moth in it, and it was much, much longer than ten pages. Ash was on page eleven after all.`,`Sister Wren wrote a book about it all. Ash was on page eleven.`));
  else L.push(xl('narr',`Sister Wren wrote it all down: The Account of the Long Night. It was much, much longer than ten pages. Ash was on page eleven after all.`,`Sister Wren wrote a book about it all. Ash was on page eleven.`));
  if(n4sDuchessAll()) L.push(xl('narr',`Nobody ever found out how Duchess gets anywhere. Farmer Hollis says she takes the bus. There is no bus.`,`Nobody knows how Duchess gets anywhere. Hollis says she takes the bus. There is no bus.`));
  if(F.pip) L.push(xl('narr',`Pip never said another word. Except once, very quietly, at breakfast: "Pancake."`,`Pip never talked again. Except once, at breakfast: "Pancake."`));
  // ---- Lantern Day (the green, every friend who came stands round Ash)
  L.push(sc('lanternday'),
    xl('narr',`And on the next Lantern Day, the thousand-and-first, everyone came to the green in Emberhollow.`,`On the next Lantern Day, everyone came to the green.`),
    {who:'narr',text:S(`Ash lit the first lantern. And then one more than needed. Just in case.`,`Ash lit the first lantern. And one more, just in case.`),fn:()=>{ if(N4ST.book) N4ST.book.lit=1; }},
    xl('narr',`And whatever the moon looked like, it always, always came back.`,`And the moon always, always came back.`));
  return L;
}
// the act 5 data's epilogue book: the act file's book: [{ page, epi?, skip? }], each page scene in order (its first beat
// turns to its painted plate with n4fx:book:<plate>), and after a page with epi at most one side-quest line of that land
// (EPI, THREADS 18.3) that does not match skip. null when the data has no book (the lines above play instead).
function n4sBookLines(){
  const A=n4sAct5(); if(!A||!Array.isArray(A.book)||!A.book.length||typeof s10Lines!=='function') return null;
  const L=[n4sDo(()=>{ if(!N4ST.book) n4sBookOpen(); G.flags.n_epi=1; })];
  for(const pg of A.book){ const sc=n4sData(pg.page); if(!sc){ console.error('n4s book: no scene',pg.page); continue; }
    L.push(...s10Lines(sc,{sc:pg.page}));
    if(pg.epi){ let re=null; try{ re=pg.skip?new RegExp(pg.skip):null; }catch(e){} L.push(...n4sEpiPick(pg.epi,re).slice(0,1)); } }
  return L;
}
// ---------- the storybook: a painted scene behind the dialogue (DOM, under the dialogue box, never takes clicks)
const N4S_BOOKT={green:S('Embermere','Embermere'),clocks:S('The Clockwork Coast','The Clockwork Coast'),hearth:S('Frostreach','Frostreach'),
  observatory:S('Moonfall','Moonfall'),moon:S('The Moon','The Moon'),lanternday:S('The Thousand-and-First Lantern Day','Lantern Day'),pane:''};
function n4sBookEl(){
  let el=document.getElementById('n4sBook'); if(el) return el;
  el=document.createElement('div'); el.id='n4sBook'; el.setAttribute('aria-hidden','true');
  const cv=document.createElement('canvas'); el.appendChild(cv);
  const t=document.createElement('div'); t.className='n4t'; el.appendChild(t);
  const n=document.createElement('div'); n.className='n4n'; el.appendChild(n);
  document.body.appendChild(el); return el;
}
function n4sBookOpen(kind){
  const el=n4sBookEl(); el.style.display='block';
  N4ST.book={scene:null,prev:null,fade:1,t:0,lit:0,kind:kind||'epi',pane:0,seed:1+Math.floor(Math.random()*999)};
  el.querySelector('.n4t').textContent=kind==='pane'?simplify(S('A Moth Memory','A Moth Memory')):simplify(S('The Thousand-and-First Lantern Day','The next Lantern Day'));
  el.querySelector('.n4n').textContent='';
  requestAnimationFrame(()=>{ el.style.opacity='1'; });
  let last=performance.now();
  const loop=()=>{ if(!N4ST.book) return; const now=performance.now(), dt=Math.min(0.1,Math.max(0,(now-last)/1000)); last=now; N4ST.book.t+=dt; N4ST.book.fade=Math.min(1,N4ST.book.fade+dt/0.8); n4sBookDraw(); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
}
function n4sBookScene(k,pane){ const B=N4ST.book; if(!B) return; if(B.scene!==k||pane){ B.prev=B.scene; B.prevPane=B.pane; B.scene=k; B.pane=pane||0; B.fade=0; B.st=B.t; }
  const el=document.getElementById('n4sBook'); if(el) el.querySelector('.n4n').textContent=simplify(k==='pane'?(N4S_PANE[pane]?N4S_PANE[pane].title:''):(N4S_BOOKT[k]||'')); }
function n4sBookClose(now){ const el=document.getElementById('n4sBook'); N4ST.book=null; if(!el) return; el.style.opacity='0'; if(now) el.style.display='none'; else setTimeout(()=>{ if(!N4ST.book) el.style.display='none'; },1300); }
function n4sBookDraw(){
  const el=document.getElementById('n4sBook'), B=N4ST.book; if(!el||!B) return; const cv=el.querySelector('canvas');
  const w=innerWidth, h=innerHeight, dpr=Math.min(2,window.devicePixelRatio||1); if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){ cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); }
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);
  g.fillStyle='rgba(10,6,18,.97)'; g.fillRect(0,0,w,h);
  if(B.prev&&B.fade<1){ g.save(); g.globalAlpha=1; n4sPaint(g,w,h,B.prev,B.t,B.prevPane); g.restore(); }
  if(B.scene){ g.save(); g.globalAlpha=B.prev?smooth(B.fade):smooth(B.fade); n4sPaint(g,w,h,B.scene,B.t,B.pane); g.restore(); }
  // the page: a soft vignette and a thin gold frame, like a storybook plate
  const vg=g.createLinearGradient(0,h*0.5,0,h); vg.addColorStop(0,'rgba(8,4,14,0)'); vg.addColorStop(1,'rgba(8,4,14,.88)'); g.fillStyle=vg; g.fillRect(0,h*0.5,w,h*0.5);
  const fr=Math.min(w,h)*0.035; g.strokeStyle='rgba(232,196,120,.35)'; g.lineWidth=2; g.strokeRect(fr,fr,w-fr*2,h-fr*2);
}
// the painted scenes: a 1000 x 560 storybook plate, scaled to the screen (the dialogue box covers the bottom)
function n4sPaint(g,w,h,k,t,pane){
  // on a tall phone screen the plate is cropped a little at the sides and sits in the middle of the space above the words
  const port=h>w*1.2, sc=port?Math.min(w/800,h*0.64/560):Math.min(w/1000,h*0.64/560), ox=w/2-500*sc, oy=port?Math.max(100,h*0.44-280*sc):Math.max(54,h*0.07), yT=port?-oy/sc:0;
  const R=mulberry32(77+(k||'').length*13);
  // sky
  const SK={green:['#2a1e4e','#8a4a7a','#f2a46a'],clocks:['#3a5a9a','#f0a0a8','#ffd890'],hearth:['#0e1a3a','#24406e','#5a7ab0'],observatory:['#120a2c','#2e1e5a','#6a4a8a'],
    moon:['#0c1030','#20306a','#4a5a9a'],lanternday:['#1a1440','#6a3a6a','#e8905a'],pane:['#140c22','#2a1a40','#3a2a58']}[k]||['#101020','#202040','#303060'];
  const sky=g.createLinearGradient(0,oy,0,oy+560*sc); sky.addColorStop(0,SK[0]); sky.addColorStop(0.62,SK[1]); sky.addColorStop(1,SK[2]); g.fillStyle=sky; g.fillRect(0,0,w,oy+560*sc);
  g.fillStyle=SK[0]; g.fillRect(0,0,w,oy);
  g.save(); g.translate(ox,oy); g.scale(sc,sc);
  const x0=-ox/sc-20, x1=(w-ox)/sc+20, yB=(h-oy)/sc+20;
  const stars=(n,a)=>{ for(let i=0;i<n;i++){ const x=x0+R()*(x1-x0), y=yT+R()*(300-yT), s=R()*1.6+0.5, tw=0.5+0.5*Math.sin(t*(1+R()*2)+i); g.fillStyle=`rgba(255,250,235,${(0.2+0.6*tw*R())*a})`; g.beginPath(); g.arc(x,y,s,0,TAU); g.fill(); } };
  const glow=(x,y,r,col,a)=>{ const q=g.createRadialGradient(x,y,0,x,y,r); q.addColorStop(0,`rgba(${col},${a})`); q.addColorStop(1,`rgba(${col},0)`); g.fillStyle=q; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); };
  const hill=(y0,amp,f,col)=>{ g.fillStyle=col; g.beginPath(); g.moveTo(x0,yB); for(let x=x0;x<=x1;x+=30) g.lineTo(x,y0+Math.sin(x*f+amp)*amp*9); g.lineTo(x1,yB); g.closePath(); g.fill(); };
  const lantern=(x,y,s,a,col)=>{ glow(x,y,40*s,col||'255,190,110',0.55*a); g.fillStyle=`rgba(255,216,150,${a})`; g.beginPath(); g.ellipse(x,y,7*s,10*s,0,0,TAU); g.fill(); g.fillStyle=`rgba(120,60,30,${a*0.6})`; g.fillRect(x-4*s,y-12*s,8*s,2.4*s); };
  const post=(x,y,lit)=>{ g.fillStyle='#1a1028'; g.fillRect(x-2.5,y-56,5,56); g.fillRect(x-9,y-58,18,4); if(lit) lantern(x,y-64,0.9,1); else { g.fillStyle='#2a2040'; g.beginPath(); g.ellipse(x,y-64,6,8,0,0,TAU); g.fill(); } };
  const house=(x,y,wd,ht,col,roof,win)=>{ g.fillStyle=col; g.fillRect(x-wd/2,y-ht,wd,ht); g.fillStyle=roof; g.beginPath(); g.moveTo(x-wd/2-8,y-ht); g.lineTo(x,y-ht-wd*0.45); g.lineTo(x+wd/2+8,y-ht); g.closePath(); g.fill();
    if(win){ g.fillStyle='rgba(255,200,120,.95)'; g.fillRect(x-wd*0.22,y-ht*0.6,wd*0.16,ht*0.24); g.fillRect(x+wd*0.08,y-ht*0.6,wd*0.16,ht*0.24); glow(x,y-ht*0.5,wd*0.7,'255,180,100',0.25); } };
  const person=(x,y,s,col,o)=>{ o=o||{}; g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=col||'#1a1028'; g.beginPath(); g.moveTo(-13,0); g.quadraticCurveTo(-15,-32,0,-34); g.quadraticCurveTo(15,-32,13,0); g.closePath(); g.fill(); g.beginPath(); g.arc(0,-44,10,0,TAU); g.fill();
    if(o.hat){ g.beginPath(); g.moveTo(-12,-50); g.lineTo(0,-70); g.lineTo(12,-50); g.closePath(); g.fill(); }
    if(o.bun){ g.beginPath(); g.arc(0,-56,6,0,TAU); g.fill(); }
    if(o.lute){ g.beginPath(); g.ellipse(12,-18,8,11,0.5,0,TAU); g.fill(); g.fillRect(14,-40,3,22); }
    if(o.mask){ g.fillStyle='#e8e0f4'; g.beginPath(); g.ellipse(0,-46,9,5,0,0,TAU); g.fill(); }
    if(o.crow){ g.fillStyle='#0c0812'; g.beginPath(); g.ellipse(-12,-38,6,4,0.3,0,TAU); g.fill(); g.beginPath(); g.arc(-15,-42,3.4,0,TAU); g.fill(); }
    g.restore(); };
  const kid=(x,y,s,col)=>{ g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=col||'#1a1028'; g.beginPath(); g.ellipse(0,-14,13,16,0,0,TAU); g.fill(); g.beginPath(); g.arc(0,-36,11,0,TAU); g.fill();
    for(const d of [-1,1]){ g.beginPath(); g.moveTo(d*5,-44); g.lineTo(d*10,-58); g.lineTo(d*1,-46); g.fill(); }
    g.beginPath(); g.moveTo(-10,-6); g.quadraticCurveTo(-30,4,-34,-10); g.lineTo(-30,-8); g.quadraticCurveTo(-24,-2,-10,-12); g.fill(); g.restore(); };
  const pip=(x,y,s,col)=>{ g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=col||'#1a1028'; g.beginPath(); g.ellipse(0,-8,9,8,0,0,TAU); g.fill(); g.beginPath(); g.arc(7,-16,6,0,TAU); g.fill(); for(const d of [-1,1]){ g.beginPath(); g.moveTo(-2,-12); g.lineTo(-12,-24+d*4); g.lineTo(-4,-8); g.fill(); } g.restore(); };
  const wolf=(x,y,s,col)=>{ g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=col||'#1a1028'; g.beginPath(); g.ellipse(0,-16,26,13,0,0,TAU); g.fill(); g.beginPath(); g.moveTo(18,-22); g.lineTo(40,-34); g.lineTo(44,-22); g.lineTo(30,-14); g.fill(); g.beginPath(); g.moveTo(34,-30); g.lineTo(36,-44); g.lineTo(40,-31); g.fill(); g.fillRect(-18,-8,5,10); g.fillRect(12,-8,5,10); g.beginPath(); g.moveTo(-24,-18); g.quadraticCurveTo(-44,-26,-46,-10); g.lineTo(-24,-12); g.fill(); g.restore(); };
  const goat=(x,y,s,col)=>{ g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=col||'#1a1028'; g.beginPath(); g.ellipse(0,-14,16,10,0,0,TAU); g.fill(); g.beginPath(); g.ellipse(16,-24,6,8,0.4,0,TAU); g.fill(); g.fillRect(-12,-6,3,8); g.fillRect(9,-6,3,8); g.beginPath(); g.moveTo(14,-30); g.quadraticCurveTo(12,-40,6,-38); g.lineTo(13,-28); g.fill(); g.restore(); };
  const moth=(x,y,s,col,eye)=>{ if(typeof thrMoth==='function') thrMoth(g,x,y,s,t*8+x,col,eye); };
  const bigDragon=(x,y,s,col,curl)=>{ g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=col; g.beginPath(); g.ellipse(0,0,120,40,0,0,TAU); g.fill();
    if(curl){ g.beginPath(); g.moveTo(-110,0); g.quadraticCurveTo(-200,40,-150,70); g.quadraticCurveTo(-110,80,-80,40); g.fill(); }
    g.beginPath(); g.ellipse(124,-40,36,24,-0.3,0,TAU); g.fill(); g.beginPath(); g.moveTo(100,-30); g.quadraticCurveTo(110,-10,90,0); g.lineTo(80,-10); g.fill();
    for(const d of [-1,1]){ g.beginPath(); g.moveTo(118,-60); g.lineTo(112+d*8,-96); g.lineTo(132,-62); g.fill(); }
    g.beginPath(); g.moveTo(-20,-30); g.quadraticCurveTo(10,-110,80,-70); g.quadraticCurveTo(40,-50,20,-20); g.fill(); g.restore(); };
  const end=G&&G.choices&&G.choices.n_end, look=typeof moonLook==='function'?moonLook():'dawn';
  const moonAt=(x,y,r,a)=>{ glow(x,y,r*2.4,end==='embermoon'?'255,190,110':'210,220,255',0.35*(a==null?1:a)); try{ if(typeof drawMoon==='function') drawMoon(g,x,y,r,{bites:0,look,alpha:a==null?1:a}); }catch(e){} };
  switch(k){
    case 'green': { stars(60,0.6); glow(500,470,420,'255,150,90',0.25);
      g.fillStyle='#24183a'; g.beginPath(); g.moveTo(560,470); g.lineTo(760,200); g.lineTo(820,250); g.lineTo(880,190); g.lineTo(1060,470); g.closePath(); g.fill();
      if(n4sEnd()==='warden'){ glow(820,206,26,'255,170,90',0.9); }
      hill(470,1.6,0.006,'#2e2048');
      for(const [x,ww,hh] of [[120,90,70],[250,80,60],[720,90,72],[860,84,64]]) house(x,470,ww,hh,'#3a2a4c','#22182e',true);
      hill(520,1.1,0.008,'#1c1430');
      g.fillStyle='rgba(120,170,90,.5)'; g.beginPath(); g.ellipse(500,520,250,44,0,0,TAU); g.fill();
      const lit=n4sF('n_dawn');
      for(let i=0;i<6;i++){ const a=i/6*TAU+0.3; post(500+Math.cos(a)*230,522+Math.sin(a)*40,true); }
      if(G.choices.fennick==='forgive') for(let i=0;i<14;i++) lantern(60+i*64,300+Math.sin(i*1.3)*20+(i%2)*14,0.55,0.9);
      kid(500,540,1.25,'#2a1c3c'); break; }
    case 'clocks': { glow(500,560,380,'255,210,140',0.55);
      g.fillStyle='#ffe0a0'; g.beginPath(); g.arc(500,560,70,Math.PI,TAU); g.fill();
      g.fillStyle='#e8dcd0'; g.beginPath(); g.moveTo(x0,380); g.lineTo(150,370); g.lineTo(260,460); g.lineTo(260,yB); g.lineTo(x0,yB); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(x1,360); g.lineTo(820,380); g.lineTo(720,470); g.lineTo(720,yB); g.lineTo(x1,yB); g.closePath(); g.fill();
      g.fillStyle='#3a5a8a'; g.fillRect(260,470,460,yB-470); for(let i=0;i<9;i++){ g.fillStyle=`rgba(255,220,160,${0.4-i*0.03})`; g.fillRect(460-i*6,480+i*12,80+i*12,3); }
      for(const [x,y,s] of [[110,370,1],[205,330,1.25],[880,350,1.1]]){ g.fillStyle='#4a3a5a'; g.fillRect(x-22*s,y-150*s,44*s,150*s); g.beginPath(); g.moveTo(x-28*s,y-150*s); g.lineTo(x,y-200*s); g.lineTo(x+28*s,y-150*s); g.fill();
        g.fillStyle='#fff4dc'; g.beginPath(); g.arc(x,y-112*s,16*s,0,TAU); g.fill(); g.strokeStyle='#3a2a20'; g.lineWidth=2.4*s; const a1=t*0.9+x, a2=t*0.08+x;
        g.beginPath(); g.moveTo(x,y-112*s); g.lineTo(x+Math.cos(a1)*13*s,y-112*s+Math.sin(a1)*13*s); g.moveTo(x,y-112*s); g.lineTo(x+Math.cos(a2)*9*s,y-112*s+Math.sin(a2)*9*s); g.stroke(); }
      g.strokeStyle='#5a4a6a'; g.lineWidth=3; for(let i=0;i<5;i++){ const x=300+((i*170+t*30)%600), y=120+Math.sin(t+i)*20+i*18; g.beginPath(); g.moveTo(x-10,y-4); g.quadraticCurveTo(x-5,y-8,x,y); g.quadraticCurveTo(x+5,y-8,x+10,y-4); g.stroke(); }
      if(n4sVes()) person(640,470,1.1,'#2a2040',{mask:true}); break; }
    case 'hearth': { stars(90,0.8);
      g.fillStyle='#e8f0ff'; for(let i=0;i<70;i++){ const x=x0+((R()*(x1-x0))+t*14)%(x1-x0), y=(R()*560+t*(20+R()*30))%560; g.globalAlpha=0.6; g.beginPath(); g.arc(x,y,1.4+R(),0,TAU); g.fill(); } g.globalAlpha=1;
      hill(430,1.4,0.005,'#c8d8f0'); hill(470,1.1,0.007,'#a8bce0');
      g.fillStyle='#4a5a7a'; g.fillRect(180,380,640,100); for(let x=180;x<820;x+=36) g.fillRect(x,368,22,14);
      for(const [x,hh] of [[260,80],[360,96],[640,90],[740,76]]) house(x,400,70,hh,'#5a6a8a','#3a4a6a',true);
      const f=0.85+0.15*Math.sin(t*6); glow(500,360,200,'255,180,90',0.55*f); glow(500,360,120,'140,190,255',0.45);
      for(let i=0;i<5;i++){ g.fillStyle=['#5a9aff','#9ad0ff','#ffd27a','#ffb050','#fff4d0'][i]; g.beginPath(); g.ellipse(500,380-i*12,46-i*8,(70-i*10)*f,0,0,TAU); g.fill(); }
      g.fillStyle='#3a3050'; g.fillRect(450,380,100,30);
      for(let i=0;i<7;i++) person(330+i*50,500,0.8,'#2a2a44',{hat:i%3===0});
      if(n4sGla()) bigDragon(840,250,0.7,'rgba(190,225,255,.75)',true); break; }
    case 'observatory': { stars(120,1);
      moonAt(760,150,60);
      hill(440,1.8,0.004,'#3a2a5a'); hill(480,1.2,0.006,'#2a1e48');
      for(let i=0;i<40;i++){ const x=x0+R()*(x1-x0), y=450+R()*100, tw=0.5+0.5*Math.sin(t*3+i); g.fillStyle=`rgba(220,210,255,${0.6*tw})`; g.fillRect(x,y,2,2); }
      g.fillStyle='#4a3a6a'; g.fillRect(380,330,240,130); g.beginPath(); g.arc(500,330,120,Math.PI,TAU); g.fill();
      g.strokeStyle='#d8a84a'; g.lineWidth=5; g.beginPath(); g.ellipse(500,300,140,40,-0.2+Math.sin(t*0.3)*0.05,0,TAU); g.stroke(); g.beginPath(); g.ellipse(500,300,120,50,0.6+Math.sin(t*0.25)*0.05,0,TAU); g.stroke();
      g.fillStyle='#6a5a8a'; g.save(); g.translate(560,250); g.rotate(-0.7); g.fillRect(0,-12,120,24); g.restore();
      if(n4sHushF()&&end==='dawn') moth(600,230,2.2,'#f4f2fa','#b890f0');
      else if(G.choices.m_hush==='foe') for(let i=0;i<4;i++){ lantern(200+i*40,470,0.5,0.9); moth(200+i*40+Math.sin(t*3+i)*10,452+Math.cos(t*2+i)*6,0.5,'#f4f2fa'); }
      person(420,470,0.9,'#2a1e40',{hat:true}); break; }
    case 'moon': { stars(140,1); moonAt(500,210,120);
      if(end==='moth'){ moth(500+Math.sin(t*0.5)*4,170,0.9,'#9a8ab0','#ece6ff'); }
      hill(470,1.4,0.006,'#1a1430'); hill(510,1.0,0.008,'#140e26');
      for(let i=0;i<6;i++){ const a=i/6*TAU+0.3; post(500+Math.cos(a)*220,525+Math.sin(a)*36,true); }
      glow(495,515,120,'200,215,255',0.32); kid(470,540,1.1,'#241838'); if(G.flags.pip) pip(520,540,1.2,'#241838'); break; }
    case 'lanternday': { stars(30,0.4); glow(500,560,460,'255,170,100',0.35);
      if(end) moonAt(820,110,46,0.95);
      hill(450,1.4,0.006,'#3a2a50'); for(const [x,ww,hh] of [[90,80,62],[200,70,54],[800,84,66],[920,76,58]]) house(x,450,ww,hh,'#4a3458','#2a1c38',true);
      // lanterns floating up (more once Ash lights the first)
      const B=N4ST.book, n=B&&B.lit?26:12; for(let i=0;i<n;i++){ const u=((t*0.04+i*0.137)%1), x=60+((i*97)%880)+Math.sin(t*0.7+i)*14, y=470-u*430; lantern(x,y,0.55,Math.min(1,u*4)*(1-u*0.4)); }
      g.fillStyle='rgba(120,170,90,.55)'; g.beginPath(); g.ellipse(500,520,330,48,0,0,TAU); g.fill();
      if(n4sGla()) bigDragon(500,400,0.85,'rgba(200,232,255,.8)',true);
      const ring=[]; const add=f=>ring.push(f);
      add((x,y)=>person(x,y,1.05,'#3a2238',{bun:true}));                     // Mom
      add((x,y)=>person(x,y,1,'#2a2a40',{crow:true}));                       // Yara with Pebble
      if(n4sVes()) add((x,y)=>person(x,y,0.95,'#2a2040',{mask:true}));
      if(G.choices.greymane==='ally'||G.choices.greymane==='home') add((x,y)=>wolf(x,y+4,1,'#3a3a50'));
      if(n4sTikka()||G.flags.tk_n>=1) add((x,y)=>{ kid(x,y,0.7,'#5a4030'); kid(x+20,y,0.6,'#4a3628'); });
      if(n4sQ('hollow')||G.flags.juniper_found) add((x,y)=>{ person(x,y,0.8,'#3a2a40'); person(x+18,y,0.7,'#2a2034',{hat:true}); });
      add((x,y)=>person(x,y,0.95,'#2a1e3a',{lute:true}));                    // Tamsin
      const e=n4sEnd(); if(e==='lantern') add((x,y)=>bigDragon(x,y-10,0.2,'#7a2a1a'));
      if(e==='heir') add((x,y)=>{ g.strokeStyle='#d8b060'; g.lineWidth=2; for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(x+i*6,y-36); g.lineTo(x+i*6,y); g.stroke(); } g.beginPath(); g.ellipse(x,y-36,14,4,0,0,TAU); g.stroke(); });
      add((x,y)=>goat(x,y,1,'#4a3a3a'));                                      // Duchess
      ring.forEach((f,i)=>{ const a=Math.PI*(1.05+0.9*i/Math.max(1,ring.length-1)), x=500+Math.cos(a)*270, y=520+Math.sin(a)*-34+12; f(x,y); });
      if(n4sHushF()) moth(300,330,2.2,'#f4f2fa','#b890f0');
      if(end==='moth') { lantern(700,330,0.8,1); moth(700,316,0.6,'#9a8ab0','#ece6ff'); }
      kid(500,540,1.3,'#3a1c2c'); if(G.flags.pip) pip(540,540,1.3,'#3a1c2c'); lantern(472,470,1.1,1); if(B&&B.lit) lantern(530,456,0.9,1);
      break; }
    case 'pane': n4sPaneArt(g,pane,t); break;
  }
  g.restore();
}

// a Moth Memory pane: a small stained-glass picture, lit from behind (the six pictures of FINALE 16)
function n4sPaneArt(g,k,t){
  const cx=500, cy=270, W0=230, H0=300;
  g.save();
  // the arched window and its glow
  const glow=(x,y,r,col,a)=>{ const q=g.createRadialGradient(x,y,0,x,y,r); q.addColorStop(0,`rgba(${col},${a})`); q.addColorStop(1,`rgba(${col},0)`); g.fillStyle=q; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); };
  glow(cx,cy,360,'200,170,255',0.35+0.05*Math.sin(t*1.5));
  const arch=()=>{ g.beginPath(); g.moveTo(cx-W0/2,cy+H0/2); g.lineTo(cx-W0/2,cy-H0/2+W0/2); g.arc(cx,cy-H0/2+W0/2,W0/2,Math.PI,TAU); g.lineTo(cx+W0/2,cy+H0/2); g.closePath(); };
  g.save(); arch(); g.clip();
  const bg=g.createLinearGradient(0,cy-H0/2,0,cy+H0/2); bg.addColorStop(0,'#2a2a7a'); bg.addColorStop(0.6,'#4a3a9a'); bg.addColorStop(1,'#2a5a6a'); g.fillStyle=bg; g.fillRect(cx-W0,cy-H0,W0*2,H0*2);
  // glass panes of colour (a quiet mosaic under the picture)
  const rng=mulberry32(100+k*7); for(let i=0;i<26;i++){ const x=cx-W0/2+rng()*W0, y=cy-H0/2+rng()*H0, r=18+rng()*26; g.fillStyle=`hsla(${230+rng()*60},55%,${30+rng()*20}%,.45)`; g.beginPath(); for(let j=0;j<5;j++){ const a=j/5*TAU+rng(); j?g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } g.closePath(); g.fill(); }
  const moon=(x,y,r,thin)=>{ g.fillStyle='#f4f0d8'; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); if(thin){ g.fillStyle='#2a2a7a'; g.beginPath(); g.arc(x+r*thin,y-r*0.1,r*0.96,0,TAU); g.fill(); } };
  const mothA=(x,y,s,col)=>{ if(typeof thrMoth==='function') thrMoth(g,x,y,s,t*6+x*0.1,col||'#c8c0d8','#f4f0ff'); };
  const hill=()=>{ g.fillStyle='#2a6a4a'; g.beginPath(); g.moveTo(cx-W0,cy+H0/2); g.quadraticCurveTo(cx,cy+40,cx+W0,cy+H0/2); g.closePath(); g.fill(); };
  const girl=(x,y,col)=>{ g.fillStyle=col||'#c84a3a'; g.beginPath(); g.ellipse(x,y-16,12,18,0,0,TAU); g.fill(); g.beginPath(); g.arc(x,y-40,10,0,TAU); g.fill(); for(const d of [-1,1]){ g.beginPath(); g.moveTo(x+d*4,y-48); g.lineTo(x+d*9,y-60); g.lineTo(x+d*1,y-49); g.fill(); } };
  const lamp=(x,y,on)=>{ if(on) glow(x,y,40,'255,200,120',0.7); g.fillStyle=on?'#ffd890':'#8a7a6a'; g.beginPath(); g.ellipse(x,y,9,12,0,0,TAU); g.fill(); };
  switch(k){
    case 1: moon(cx,cy-30,52); for(let i=0;i<1;i++){ const a=t*0.9; mothA(cx+Math.cos(a)*80,cy-30+Math.sin(a)*46,1.2); } break;
    case 2: hill(); g.save(); g.beginPath(); g.rect(cx-W0,cy-H0,W0*2,H0/2+60); g.clip(); moon(cx+40,cy+70,46); g.restore(); hill(); mothA(cx-40+Math.sin(t)*6,cy-10,1.1); break;
    case 3: hill(); girl(cx-20,cy+80); g.strokeStyle='#5a3a2a'; g.lineWidth=2; g.beginPath(); g.moveTo(cx-10,cy+40); g.lineTo(cx+22,cy+10); g.stroke(); lamp(cx+24,cy+20,true); mothA(cx+24,cy+4,0.8); g.fillStyle='#f4f0d8'; g.beginPath(); g.arc(cx+60,cy-90,16,0,TAU); g.fill(); break;
    case 4: hill(); girl(cx+30,cy+80,'#3a5a8a'); lamp(cx+56,cy+24,true); g.strokeStyle='#5a3a2a'; g.lineWidth=2; g.beginPath(); g.moveTo(cx+40,cy+40); g.lineTo(cx+56,cy+30); g.stroke(); mothA(cx-60,cy-40+Math.sin(t*2)*6,0.9); break;
    case 5: moon(cx,cy-20,70,0.82); g.save(); g.translate(cx-56,cy-20); mothA(0,0,1.3); g.restore(); break;
    case 6: { moon(cx+40,cy-40,58); g.fillStyle='#2a2a7a'; g.beginPath(); g.arc(cx-6,cy-60,26,0,TAU); g.fill(); mothA(cx-50,cy+20,3,'#9a8ab0'); break; }
  }
  g.restore();
  // the leading (black lines) and the frame
  g.strokeStyle='#120c1c'; g.lineWidth=5; arch(); g.stroke();
  g.lineWidth=2.4; for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(cx-W0/2,cy-H0/2+W0/2+i*(H0-W0/2)/4); g.lineTo(cx+W0/2,cy-H0/2+W0/2+i*(H0-W0/2)/4+((i%2)?14:-14)); g.stroke(); }
  g.beginPath(); g.moveTo(cx,cy-H0/2); g.lineTo(cx,cy+H0/2); g.stroke();
  g.strokeStyle='#8a7a5a'; g.lineWidth=8; g.save(); g.translate(0,0); arch(); g.globalCompositeOperation='destination-over'; g.stroke(); g.restore();
  g.fillStyle='#3a3046'; g.fillRect(cx-W0/2-20,cy+H0/2,W0+40,16); g.fillRect(cx-8,cy+H0/2+16,16,60);
  g.restore();
}
// read a pane: the picture large, its lines; pane 3 teaches her name; all six: +10 max HP and Wren's line
function n4sPane(k,done){
  k=k|0; const P=N4S_PANE[k]; if(!P){ if(done) n4sTry(done); return false; }
  const first=!G.found['n_pane_'+k];
  const fin=()=>{ n4sBookClose(); if(done) n4sTry(done); };
  const L=[n4sDo(()=>{ n4sBookOpen('pane'); n4sBookScene('pane',k); }),...P.lines(),
    n4sDo(()=>{ G.found['n_pane_'+k]=true; G.flags.n_panes=n4sPanesN(); if(k===3) G.flags.n_knows=1; })];
  if(first&&k===3) L.push(n4sDo(()=>n4sSay('nyx')));
  if(first&&n4sPanesN()+(G.found['n_pane_'+k]?0:1)>=6) L.push(...STORY.n_panes_all,n4sDo(()=>{ if(!G.flags.n_panes_hp){ G.flags.n_panes_hp=1; player.maxHp+=10; player.hp=player.maxHp; setBanner(S('All six Moth Memories','All six Moth Memories'),S('You understand her now. +10 max health.','+10 health!'),3.4); } }));
  runDialogue(L,()=>{ scene='play'; fin(); if(first) setBanner(S('Moth Memory','Moth Memory'),simplify(P.title)+' · '+n4sPanesN()+' / 6',2.6); saveGame(); });
  return true;
}
// the journal's Story tab lists the Moth Memories found
{ const base=renderJour; renderJour=function(){ base(); try{ if(G&&G.mode==='story'&&typeof jTab!=='undefined'&&jTab==='story'&&n4sPanesN()>0){ const el=$('#jBody'); if(!el) return; const E=t=>escapeHtml(simplify(t));
  const li=[]; for(let k=1;k<=6;k++) li.push(`<li>${G.found['n_pane_'+k]?E(N4S_PANE[k].title):'<span style="opacity:.55">?</span>'}</li>`);
  el.insertAdjacentHTML('beforeend',`<div class="jh2">${E(S('Moth Memories','Moth Memories'))} (${n4sPanesN()}/6)</div><ol>${li.join('')}</ol>`); } }catch(e){ console.error(e); } }; }

// ---------- 3. the stages, the journal and the act (FINALE 4)
const N4S_HINTS={
  n_bridge:S(`Juniper's map says the bridge comes down by a green with three lanterns. Light all three.`,`Light the three lanterns by the bridge.`),
  n_stair:S(`Pebble has flown round the first ring for me. She says it looks like home. Skim, fly, and take Ember's three flames.`,`Skim, fly, and get the three flames.`),
  n_clocks:S(`The second ring is clocks and cliffs, Pebble says. Climb, grapple, and dash through the dark curtains.`,`Climb, grapple, and dash.`),
  n_rime:S(`The third ring is winter. Blaze the ice, ride the wind, and pound anything cracked.`,`Melt ice. Ride wind. Pound!`),
  n_glass:S(`The fourth ring is glass and grabbing vines. Dive, dig, and burn the dark with moonfire.`,`Dive, dig, and use moonfire.`),
  n_crown:S(`Whoever came to help you will be waiting at the Crown Shrine. After that comes the Moon Road.`,`Go to the shrine. Then the Moon Road.`),
  n_nyxara:S(`Phase by phase. Watch her glow, and listen to Pip.`,`Watch her and listen to Pip.`)};
const N4S_SOFAR={
  n_bridge:S(`Nyxara ate the last of the moon, and Nightfall Peak rose out of the sea at the edge of the world. Ash crossed a bridge of moonfire with the Ember Heart, whole again, warm in the satchel. Nyxara wants it. Ash is bringing it anyway.`,`Nyxara ate the moon. A black mountain rose up. Ash crossed the bridge with the Ember Heart.`),
  n_stair:S(`The peak is made of the moon's memories, and the moon saw everything Ash ever did at night. The first ring is a dark copy of Embermere: the lantern green, Ember's Trials, a shadow throne.`,`The mountain is made of the moon's memories. The first ring looks like home.`),
  n_clocks:S(`Ash beat the Echo of the First Flame and rode the wind up to the second ring: a copy of Gearhaven where every clock is stuck at midnight.`,`Ash beat the shadow dragon. Now Ash climbs the clock cliffs.`),
  n_rime:S(`The second ring's echo was a shadow of the Moth Mask. The third ring is a copy of Frostreach: black ice, frozen shadow people, wind like a river.`,`Ash beat the shadow thief. The third ring is ice and wind.`),
  n_glass:S(`The ice dragon's echo shattered into moths. The fourth ring is glass dunes, drowned mirrors and tendrils that reach for every light. The broken moon is very close now.`,`Ash beat the shadow ice dragon. The last ring is glass and shadow vines.`),
  n_crown:S(`Four rings climbed, four echoes broken. Friends Ash made on the long road are waiting at the Crown Shrine. Above it all, Nyxara waits for the Heart.`,`Ash climbed all four rings. Friends are waiting at the top.`),
  n_nyxara:S(`The Moon Door opened for the Ember Heart, just as Nyxara wanted. Now Ash has to stop the Night Mother before she makes the Heart burn black.`,`The door opened. Now Ash must stop Nyxara.`)};
const N4S_YARA=[S(`Pebble came back with frost on her feathers and would not stop cawing. Be careful up there, Ash.`,`Pebble came back cold. Be careful up there!`)];
const n4sObj=(f,s,x,y,o)=>Object.assign({text:S(f,s),x,y},o||{});
// what the stage flags read (x4_ascent writes most of them; a count can come from G.found too)
const N4S_FLAMES=[['leap',7599,82882],['tide',6993,82332],['sky',5765,81600]];
function n4sLanterns(){ return clamp(Math.max(G.flags.n_lanterns|0,G.flags.n_gate?3:0),0,3); }
function n4sFlames(){ let n=0; for(const [id] of N4S_FLAMES) if(G.found['n_flame_'+id]||G.flags['n_flame_'+id]) n++; return clamp(Math.max(n,G.flags.n_flames|0),0,3); }
const N4S_ECHO=[null,{site:'n_echo1',type:'n_echo_vor',x:4500,y:81500,r:380,stage:'n_stair',name:S('The Shadow Throne','The Shadow Throne')},
  {site:'n_echo2',type:'n_echo_vesper',x:6515,y:87215,r:360,stage:'n_clocks',name:S('The Mask Hall','The Mask Hall')},
  {site:'n_echo3',type:'n_echo_glaciar',x:3121,y:86579,r:400,stage:'n_rime',name:S('The Rime Throne','The Rime Throne')},
  {site:'n_echo4',type:'n_echo_hush',x:3315,y:85096,r:290,stage:'n_glass',name:S('The Eclipse Hall','The Eclipse Hall')}];
function n4sEchoDone(k){ const E=N4S_ECHO[k]; return !!(G&&E&&((G.bossDone&&G.bossDone[E.type])||G.flags['n_echo'+k+'_done'])); }
function n4sNyxDone(){ return !!(G&&((G.bossDone&&G.bossDone.n_nyxara)||G.flags.n_nyx_done)); }
// Nyxara's phase now: the boss's own nPhase (x4_foes), else her health bar (FINALE 8.2: 30 / 25 / 25 / 20 percent)
function n4sNyxE(){ return G.boss&&G.boss.type==='n_nyxara'&&!G.boss.dead?G.boss:(G.enemies||[]).find(e=>e.type==='n_nyxara'&&!e.dead)||null; }
function n4sPhase(){
  if(G.flags.n_heart_done) return 4; const e=n4sNyxE();
  if(e){ if(e.nPhase) return e.nPhase|0; const f=e.hp/Math.max(1,e.maxHp); return f>0.7?1:f>0.45?2:f>0.2?3:4; }
  return clamp(G.flags.n_phase|0||1,1,4);
}
defineStages(5,[
  {id:'n_bridge',chapter:S('The Moonfire Bridge','The Moonfire Bridge'),card:['Finale',S('The Moonfire Bridge','The Moonfire Bridge')],at:{x:13450,y:65450},
    objectives(){ if(curMap()!==4) return [n4sObj('Cross the moonfire bridge at the edge of Moonfall','Cross the moonfire bridge',13700,65450)];
      const n=n4sLanterns(); if(n>=3) return [];
      return [{text:`Light the three lanterns at the Bridgefoot (${n}/3)`,x:4500,y:89650}]; },
    hint:()=>N4S_HINTS.n_bridge, soFar:()=>N4S_SOFAR.n_bridge, yara:N4S_YARA,
    mom:[S(`A bridge made of fire? Hold my hand on the way to it. Then let go. Then come back.`,`A fire bridge! Come back safe.`)],
    update(dt){ n4sBridgeTick(dt); }},
  {id:'n_stair',chapter:S('The Ember Stair','The Ember Stair'),card:['Finale · The First Ring',S('The Ember Stair','The Ember Stair')],at:{x:4500,y:88980},
    objectives(){ const F=G.flags;
      if(!F.n_sluice) return [n4sObj('Skim up the Sluice','Skim up the river',6450,88577)];
      if(!F.n_terrace) return [n4sObj('Fly up the Updraft Terraces','Fly up the cliff',8398,85064)];
      const n=n4sFlames(); if(n<3){ let b=null,bd=1e18; for(const [id,x,y] of N4S_FLAMES){ if(G.found['n_flame_'+id]||F['n_flame_'+id]) continue; const d=dist2(player.x,player.y,x,y); if(d<bd){ bd=d; b=[x,y]; } } if(!b) b=[7007,82212];
        return [{text:`Take the three memory flames (${n}/3)`,x:b[0],y:b[1]}]; }
      if(!n4sEchoDone(1)) return [n4sObj('Face the Echo of the First Flame','Fight the shadow dragon',4500,81500)];
      return []; },
    hint:()=>N4S_HINTS.n_stair, soFar:()=>N4S_SOFAR.n_stair, yara:N4S_YARA, update(dt){ n4sRingTick(1,dt); }},
  {id:'n_clocks',chapter:S('The Clockstop Cliffs','The Clockstop Cliffs'),card:['Finale · The Second Ring',S('The Clockstop Cliffs','The Clockstop Cliffs')],at:{x:3256,y:82910},
    objectives(){ const F=G.flags;
      if(!F.n_chimney) return [n4sObj('Ride the Wind Chimney up to the second ring','Fly up the Wind Chimney',3303,81911)];
      if(!F.n_clockset) return [n4sObj('Set the Midnight Clock to Lantern Time','Fix the big clock',2165,83565)];
      if(!F.n_gallery) return [n4sObj('Cross the Silk Gallery','Cross the silk bridge',1712,85793)];
      if(!F.n_gear) return [n4sObj('Turn the Gear Bridge','Turn the gears',4748,88039)];
      if(!n4sEchoDone(2)) return [n4sObj('Face the Echo of the Moth Mask','Fight the shadow thief',6515,87215)];
      return []; },
    hint:()=>N4S_HINTS.n_clocks, soFar:()=>N4S_SOFAR.n_clocks, yara:N4S_YARA, update(dt){ n4sRingTick(2,dt); }},
  {id:'n_rime',chapter:S('The Rime Spiral','The Rime Spiral'),card:['Finale · The Third Ring',S('The Rime Spiral','The Rime Spiral')],at:{x:6443,y:84363},
    objectives(){ const F=G.flags;
      if(!F.n_longclimb) return [n4sObj('Climb the Long Climb to the third ring','Climb up',6878,84427)];
      if(!F.n_floe) return [n4sObj('Ride the wind over the Floe Gap','Ride the wind',5793,83545)];
      if(!F.n_dam) return [n4sObj('Break the Ice Dam','Break the ice dam',4500,83250)];
      if(!F.n_aurora) return [n4sObj('Cross the Aurora Bridge','Cross the aurora',2420,84908)];
      if(!n4sEchoDone(3)) return [n4sObj('Face the Echo of the Ice Dragon','Fight the shadow ice dragon',3121,86579)];
      return []; },
    hint:()=>N4S_HINTS.n_rime, soFar:()=>N4S_SOFAR.n_rime, yara:N4S_YARA, update(dt){ n4sRingTick(3,dt); }},
  {id:'n_glass',chapter:S('The Moonglass Crown','The Moonglass Crown'),card:['Finale · The Fourth Ring',S('The Moonglass Crown','The Moonglass Crown')],at:{x:5043,y:86329},
    objectives(){ const F=G.flags;
      if(!F.n_gust) return [n4sObj('Ride the Gust Stair to the fourth ring','Ride the wind up',5167,87032)];
      if(!F.n_lagoon) return [n4sObj('Raise the Drowned Mirror','Make the water rise',5475,85883)];
      if(!F.n_beam) return [n4sObj('Bend the moonbeam to the Moon Lock','Point the moonbeam at the lock',5095,84169)];
      if(!F.n_wood) return [n4sObj('Burn a path through the Tendril Wood','Burn the shadow vines',3997,84121)];
      if(!n4sEchoDone(4)) return [n4sObj('Face the Echo of the Hush','Fight the shadow moth',3315,85096)];
      return []; },
    hint:()=>N4S_HINTS.n_glass, soFar:()=>N4S_SOFAR.n_glass, yara:N4S_YARA, update(dt){ n4sRingTick(4,dt); }},
  {id:'n_crown',chapter:S('The Moon Road','The Moon Road'),card:['Finale · The Summit',S('The Moon Road','The Moon Road')],at:{x:3371,y:85925},
    objectives(){ const F=G.flags;
      if(!F.n_gather) return [n4sObj('Rest at the Crown Shrine','Rest at the shrine',3331,85875)];
      if((F.n_road|0)<4&&F.n_road!==true) return [n4sObj('Cross the Moon Road','Cross the Moon Road',3986,85813)];
      if(!F.n_door) return [n4sObj('Open the Moon Door with the Ember Heart','Open the door with the Heart',4500,85920)];
      return []; },
    hint:()=>N4S_HINTS.n_crown, soFar:()=>N4S_SOFAR.n_crown, yara:N4S_YARA, update(dt){ n4sCrownTick(dt); }},
  {id:'n_nyxara',chapter:S('The Night Mother','The Night Mother'),card:['Finale · The Last Fight',S('The Night Mother','The Night Mother')],at:{x:4500,y:85860},
    objectives(){ if(n4sNyxDone()||N4ST.run) return []; return [{text:N4S_HINT[n4sPhase()],x:4500,y:85200}]; },
    idle:()=>N4ST.run?S('The Long Night is ending.','The Long Night is ending.'):'',
    hint:()=>N4S_HINTS.n_nyxara, soFar:()=>N4S_SOFAR.n_nyxara, yara:N4S_YARA, update(dt){ n4sNyxTick(dt); }},
  {id:'n_end',chapter:S('The Long Night Is Over','The Long Night Is Over'),at:{x:4500,y:85300},
    objectives:()=>[], idle:()=>S('The Long Night is over. Go anywhere you like.','Go anywhere you like!'),
    hint:()=>S('The Long Night is over. Go anywhere you like.','Go anywhere you like!'),
    soFar:()=>endingSoFar()||N4S_SOFAR.n_nyxara, update(dt){ n4sEndTick(dt); }}
]);
defineAct(5,{name:S('Nightfall Peak','Nightfall Peak'),map:4,arrive:'n_bridge',at:{x:13450,y:65450},intro:o=>n4sActIntro(o||{})});
// the Act IV hand-off: Ash is on the Moon Pier; the bridge is open from the first stage on
function n4sActIntro(o){ /* the cards are startAct's; the bridge opens by itself (x4_world reads reached('n_bridge')) */
  // Duchess leaves Hollis Farm: she is following Ash up the peak (placeGoat leaves her off map 0 until the dawn)
  try{ placeGoat(); }catch(e){ console.error(e); } }
// during the finale the stock "Travel to <site>" lines for older boss sites would pull Ash off the peak: only the peak's own
// (I5) from her fall to the final choice there is nothing left to defeat or travel to (she lies there alive, so the
// HUD said "Defeat Nyxara", or "Travel to The Moon's Rest"): it says what is being asked
{ const base=objectiveList; objectiveList=function(){ const out=base(); try{ if(G&&G.mode==='story'&&!G.done&&actOf(G.stage)===5){
  if(N4ST.run&&!(G.choices&&G.choices.n_end)) return [{text:S('Choose how the Long Night ends','Choose how it ends')}];
  return out.filter(o=>!o.site||/^n_/.test(String(o.site))); } }catch(e){} return out; }; }

// ---------- 4. the departure (before the fade), the arrival, the Bridgefoot
// the moonfire bridge from Moonfall: the first time, the departure plays on the Moon Pier, then the fade
{ const base=useCrossing; useCrossing=function(def){
  try{ if(def&&def.id==='n_bridge_in'&&G&&G.mode==='story'&&!G.flags.n_depart&&(!def.need||def.need())&&!(G.boss&&!G.boss.dead)&&!G.inCombat&&scene==='play'){
    player.facing=0; N4ST.cam={x:13760,y:65430,k:0.55};
    n4sPlay('n_depart',()=>{ G.flags.n_depart=1; try{ setupNPCs(); }catch(e){} base(def); },{mood:'n_bridge'}); return; } }catch(e){ console.error(e); }
  return base(def); }; }
if(typeof N4W!=='undefined'&&N4W&&Array.isArray(N4W.onBridge)) N4W.onBridge.push(()=>{ if(G&&!G.flags.n_depart) G.flags.n_depart=1; });
// the Bridgefoot: the arrival (bubbles, then the box), the green, the three lanterns, the gate
function n4sBridgeTick(dt){
  if(!n4sMap4()) return; const F=G.flags, p=player;
  // the arrival: the first time Ash walks north of y 90500 on the deck
  if(!n4sSeen('n_arrive')&&!N4ST.arr&&p.y<90500&&scene==='play'){ N4ST.arr={t:0,i:0}; }
  const A=N4ST.arr;
  if(A&&scene==='play'){ A.t+=dt;
    if(A.i===0){ n4sSay('arr1'); A.i=1; A.t=0; }
    else if(A.i===1&&A.t>4.6){ n4sSay('arr2'); A.i=2; A.t=0; }
    else if(A.i===2&&A.t>4.6){ n4sSay('arr3'); A.i=3; A.t=0; }
    else if(A.i===3&&A.t>3.4&&n4sCalm()){ A.i=4; N4ST.arr=null; n4sPlay('n_arrive',()=>questUpdated()); } }
  // the green (the lanterns' story), after the arrival
  if(!n4sSeen('n_green')&&n4sSeen('n_arrive')&&!N4ST.arr&&dist(p.x,p.y,4500,89650)<300&&n4sCalm()) n4sPlay('n_green',()=>questUpdated());
  // the third lantern catches: Ash's bubble (x4_ascent may say it first; it plays once either way)
  if(n4sLanterns()>=3&&!n4sSeen('b_lanterns')) n4sSay('lanterns');
  // the gate melts: the scene, then the first ring
  if(F.n_gate&&G.stage==='n_bridge'&&!N4ST.gateQ){ N4ST.gateQ=true;
    n4sWhen('gate',null,()=>{ n4sPlay('n_gate_open',()=>{ N4ST.gateQ=false; if(G.stage==='n_bridge') goStage('n_stair'); }); }); }
}
// ---------- 5. the four rings: the words at their places, the allies' joins and goodbyes, the way on after each echo
function n4sAt(key,cond,done){ if(n4sSeen(key)||N4ST.q.some(q=>q.id===key)) return; let ok=false; try{ ok=cond(); }catch(e){} if(ok) n4sWhen(key,null,()=>n4sPlay(key,done)); }
function n4sFlagWatch(flag,fn){ const v=!!G.flags[flag]; if(N4ST.wasF[flag]===undefined){ N4ST.wasF[flag]=v; return; } if(v&&!N4ST.wasF[flag]) n4sTry(fn); N4ST.wasF[flag]=v; }
const N4S_NEXT={1:'n_clocks',2:'n_rime',3:'n_glass',4:'n_crown'};
function n4sRingTick(k,dt){
  const F=G.flags;
  // the way on after this ring's echo (after its outro and blessing: a calm moment)
  if(n4sEchoDone(k)&&G.stage===N4S_ECHO[k].stage&&!N4ST.nextQ){ N4ST.nextQ=true; n4sWhen('next'+k,null,()=>{ N4ST.nextQ=false; if(G.stage===N4S_ECHO[k].stage) goStage(N4S_NEXT[k]); }); }
  if(!n4sMap4()) return;
  const p=player, lv=n4sLvl(), r=n4sR(p.x,p.y);
  if(k===1){
    n4sAt('n_trials',()=>(n4sSec(3200,4200,112,121)&&lv>=2)||n4sFlames()>0);
    if(n4sSeen('n_trials')) for(const [id] of N4S_FLAMES){ if((G.found['n_flame_'+id]||F['n_flame_'+id])&&!n4sSeen('n_flame_'+id)) n4sAt('n_flame_'+id,()=>true); }
    if(n4sFlames()>=3&&N4S_FLAMES.every(([id])=>n4sSeen('n_flame_'+id))) n4sAt('n_trials_done',()=>true,()=>questUpdated());
    F.n_flames=Math.max(F.n_flames|0,n4sFlames());
    // the optional Silent Green: the shadow raid, Ash's own bed
    if(n4sNear(776,84300,420)) n4sSay('raid');
    if(n4sNear(1123,87150,150)) n4sSay('bed');
    // fallbacks (x4_ascent sets these itself): past the drawbridge, up on the shelf
    if(!F.n_sluice&&F.n_bridge1&&n4sSec(3200,4250,60,99)&&lv<=1) F.n_sluice=1;
    if(!F.n_terrace&&lv>=2&&n4sSec(3200,4250,100,175)) { F.n_sluice=1; F.n_terrace=1; questUpdated(); }
  }
  if(k===2){
    if(n4sGrey()&&n4sAllyHere('greymane')) n4sAt('n_grey_bye',()=>(n4sNear(3303,81911,320)||F.n_chimney||lv>=3));
    if(!F.n_chimney&&lv>=3&&r<3300){ F.n_chimney=1; questUpdated(); }
    n4sAt('n_clocks_in',()=>n4sNear(3256,82860,330)&&lv>=3);
    if(n4sVes()) n4sAt('n_vesper_join',()=>n4sNear(1760,84900,250));
    else n4sAt('n_vesper_absent',()=>n4sNear(1760,84900,250));
    n4sFlagWatch('n_clockset',()=>n4sSay('chime'));
    if(!F.n_gallery&&n4sNear(1678,84803,320)){ N4ST.gal+=dt; if(N4ST.gal>20) n4sSay('gallery'); } else N4ST.gal=0;
  }
  if(k===3){
    if(n4sVes()&&n4sAllyHere('vesper')) n4sAt('n_vesper_bye',()=>{ const u=n4sSpot('u2')||n4sPC(2850,92); return n4sNear(u.x,u.y,340)||F.n_longclimb||lv>=5; });
    if(!F.n_longclimb&&lv>=5&&r<2400){ F.n_longclimb=1; questUpdated(); }
    n4sAt('n_rime_in',()=>n4sNear(6403,84313,330)&&lv>=5);
    const fl=n4sSpot('floe')||n4sPC(1950,131);
    if(n4sGla()) n4sAt('n_glaciar_join',()=>n4sNear(fl.x,fl.y,320)||n4sSec(1440,2460,128,152));
    else n4sAt('n_glaciar_absent',()=>n4sNear(fl.x,fl.y,320));
  }
  if(k===4){
    if(n4sGla()&&n4sAllyHere('glaciar')) n4sAt('n_glaciar_bye',()=>n4sNear(5167,87032,320)||F.n_gust||lv>=7);
    if(!F.n_gust&&lv>=7&&r<1500){ F.n_gust=1; questUpdated(); }
    n4sAt('n_glass_in',()=>n4sNear(5003,86279,330)&&lv>=7);
    n4sFlagWatch('n_lagoon',()=>n4sSay('lagoon'));
    const hw=n4sPC(1190,180);
    if(n4sHushF()) n4sAt('n_hush_join',()=>n4sNear(hw.x,hw.y,270)||n4sSec(880,1500,174,190));
    else n4sAt('n_hush_absent',()=>n4sNear(hw.x,hw.y,270));
  }
}
// the Crown: the gathering at the Crown Shrine (the Nyxara respawn point), the Moon Road, the Moon Door
function n4sGatherCount(){ return (n4sGrey()?1:0)+(n4sTikka()?1:0)+(n4sVes()?1:0)+(n4sGla()?1:0)+(n4sHushF()?1:0); }
function n4sCrownTick(dt){
  const F=G.flags; if(!n4sMap4()) return;
  if(!F.n_gather&&!N4ST.gatherQ&&n4sNear(3331,85875,230)&&n4sCalm()){ N4ST.gatherQ=true;
    G.lastShrine='n_sh_crown'; G.shrines.n_sh_crown=true;
    n4sPlay('n_gather',()=>{ N4ST.gatherQ=false; F.n_gather=1; n4sGatherPose(false); G.lastShrine='n_sh_crown'; questUpdated(); saveGame(true); }); }
  if(F.n_road===true) F.n_road=4;
}
// the Moon Door: x4_ascent's prompt calls n4sMoonDoor(); its stand-in prompt is below
function n4sMoonDoor(done){
  if(G.flags.n_door){ if(done) n4sTry(done); return false; }
  if(N4ST.doorQ) return true; N4ST.doorQ=true;
  n4sWhen('door',null,()=>{ n4sPlay('n_moondoor',()=>{ N4ST.doorQ=false; G.flags.n_door=1; if(G.stage==='n_crown') goStage('n_nyxara'); if(done) n4sTry(done); }); });
  return true;
}
// ---------- stand-ins for x4_ascent's puzzles (only while it is not in the build): a prompt at each stretch that
// marks it solved and carries Ash past it, so the whole finale can be played and tested end to end
const N4S_STAND=[
  {id:'lanterns',stage:'n_bridge',at:[4500,89650],need:()=>!G.flags.n_gate&&n4sSeen('n_green'),t:S('(stand-in) Light the three lanterns','(stand-in) Light the lanterns'),do(){ G.flags.n_lanterns=3; G.flags.n_gate=1; }},
  {id:'sluice',stage:'n_stair',spot:'sluice_in',need:()=>!G.flags.n_sluice,t:S('(stand-in) Skim up the Sluice','(stand-in) Skim up'),do(){ G.flags.n_bridge1=1; G.flags.n_sluice=1; },to:'drawbridge'},
  {id:'terrace',stage:'n_stair',spot:'launch',need:()=>G.flags.n_sluice&&!G.flags.n_terrace,t:S('(stand-in) Fly up the Updraft Terraces','(stand-in) Fly up'),do(){ G.flags.n_terrace=1; },to:'shelf'},
  {id:'flames',stage:'n_stair',spot:'leap',need:()=>G.flags.n_terrace&&n4sFlames()<3,t:S('(stand-in) Take the three memory flames','(stand-in) Take the flames'),do(){ for(const [id] of N4S_FLAMES) G.found['n_flame_'+id]=true; G.flags.n_flames=3; },to:'gate'},
  {id:'chimney',stage:'n_clocks',spot:'chimney',need:()=>!G.flags.n_chimney,t:S('(stand-in) Ride the Wind Chimney','(stand-in) Fly up'),do(){ G.flags.n_chimney=1; },to:'sh_clock'},
  {id:'clock',stage:'n_clocks',spot:'clock',need:()=>G.flags.n_chimney&&!G.flags.n_clockset,t:S('(stand-in) Set the Midnight Clock','(stand-in) Fix the clock'),do(){ G.flags.n_clockset=1; },to:'clock_exit'},
  {id:'gallery',stage:'n_clocks',spot:'gallery',need:()=>G.flags.n_clockset&&!G.flags.n_gallery,t:S('(stand-in) Cross the Silk Gallery','(stand-in) Cross'),do(){ G.flags.n_gallery=1; },to:'climb_top'},
  {id:'gear',stage:'n_clocks',spot:'gear',need:()=>G.flags.n_gallery&&!G.flags.n_gear,t:S('(stand-in) Turn the Gear Bridge','(stand-in) Turn the gears'),do(){ G.flags.n_gear=1; },to:'gear_far'},
  {id:'longclimb',stage:'n_rime',spot:'u2',need:()=>!G.flags.n_longclimb,t:S('(stand-in) Climb the Long Climb','(stand-in) Climb up'),do(){ G.flags.n_longclimb=1; },to:'sh_rime'},
  {id:'floe',stage:'n_rime',spot:'icewall',need:()=>G.flags.n_longclimb&&!G.flags.n_floe,t:S('(stand-in) Melt the wall, ride over the Floe Gap','(stand-in) Ride the wind'),do(){ G.flags.n_floe=1; },to:'floe_far'},
  {id:'dam',stage:'n_rime',spot:'dam',need:()=>G.flags.n_floe&&!G.flags.n_dam,t:S('(stand-in) Break the Ice Dam','(stand-in) Break the dam'),do(){ G.flags.n_dam=1; },to:'dam_far'},
  {id:'aurora',stage:'n_rime',spot:'aurora',need:()=>G.flags.n_dam&&!G.flags.n_aurora,t:S('(stand-in) Cross the Aurora Bridge','(stand-in) Cross'),do(){ G.flags.n_sail=1; G.flags.n_aurora=1; },to:'aurora_far'},
  {id:'gust',stage:'n_glass',spot:'gust',need:()=>!G.flags.n_gust,t:S('(stand-in) Ride the Gust Stair','(stand-in) Ride up'),do(){ G.flags.n_gust=1; },to:'sh_glass'},
  {id:'lagoon',stage:'n_glass',spot:'lagoon',need:()=>G.flags.n_gust&&!G.flags.n_lagoon,t:S('(stand-in) Raise the Drowned Mirror','(stand-in) Raise the water'),do(){ G.flags.n_lagoon=1; },to:'lagoon_far'},
  {id:'beam',stage:'n_glass',spot:'dunes',need:()=>G.flags.n_lagoon&&!G.flags.n_beam,t:S('(stand-in) Bend the moonbeam to the Moon Lock','(stand-in) Open the lock'),do(){ G.flags.n_beam=1; },toP:[1190,166]},
  {id:'wood',stage:'n_glass',spot:'wood',need:()=>G.flags.n_beam&&!G.flags.n_wood,t:S('(stand-in) Burn through the Tendril Wood','(stand-in) Burn the vines'),do(){ G.flags.n_wood=1; },toP:[1190,248]},
  {id:'road',stage:'n_crown',spot:'road',need:()=>G.flags.n_gather&&(G.flags.n_road|0)<4,t:S('(stand-in) Cross the Moon Road','(stand-in) Cross the road'),do(){ G.flags.n_road=4; },to:'door'},
  {id:'door',stage:'n_crown',at:[4500,85900],need:()=>(G.flags.n_road|0)>=4&&!G.flags.n_door,t:S('Hold up the Ember Heart','Hold up the Heart'),door:true}
];
function n4sStandAt(s){ if(s.at) return {x:s.at[0],y:s.at[1]}; return n4sSpot(s.spot); }
function n4sStandGo(s){
  s.do&&s.do();
  let to=null; if(s.to) to=n4sSpot(s.to); else if(s.toP) to=n4sPC(s.toP[0],s.toP[1]);
  try{ if(typeof n4Sync==='function') n4Sync(); }catch(e){}
  if(to){ try{ mapTravel(to.x,to.y,{}); }catch(e){ player.x=to.x; player.y=to.y; } }
  questUpdated(); saveGame();
}
// prompts on the peak: the stand-ins, Cindervane's helmet, the stand-in panes, Duchess at the summit
{ const base=miniPrompts; miniPrompts=function(offer){ base(offer); try{ if(G&&G.mode==='story'&&n4sMap4()) n4sPrompts(offer); }catch(e){ console.error(e); } }; }
function n4sPrompts(offer){
  const p=player, F=G.flags;
  if(actOf(G.stage)===5&&!G.done){
    const asc=n4sHasAscent();
    for(const s of N4S_STAND){ if(s.stage!==G.stage||(asc&&!s.alwaysStand)) continue; if(s.door&&asc) continue; let ok=false; try{ ok=s.need(); }catch(e){} if(!ok) continue; const P=n4sStandAt(s); if(!P) continue;
      const d=dist(p.x,p.y,P.x,P.y); if(d<120) offer(d,simplify(s.t),()=>{ if(s.door) n4sMoonDoor(); else n4sStandGo(s); },P.x,P.y,true); }
    // Cindervane's Spark (cinder 'rest'): a black glass helmet on a rock in the Echo 1 arena
    if(G.choices.cinder==='rest'&&!(G.items.n_spark>0)&&reached('n_stair')){ const d=dist(p.x,p.y,4620,81820); if(d<90) offer(d,simplify(S('Look at the knight\'s helmet','Look at the helmet')),()=>n4sPlay('n_helmet',null,{again:true}),4620,81820,true); }
    // the Moth Memory panes (x4_ascent places the real ones)
    if(!asc) for(let k=1;k<=6;k++){ if(G.found['n_pane_'+k]) continue; const P=N4S_PANE[k].at, d=dist(p.x,p.y,P[0],P[1]); if(d<90) offer(d,simplify(S('Look at the glass pane','Look at the glass')),()=>n4sPane(k),P[0],P[1],true); }
  }
  // Duchess on the summit after the dawn
  const D=n4sDuchObj(); if(D&&!DLG){ const d=dist(p.x,p.y,D.x,D.y); if(d<80) offer(d,simplify(S('Talk to the goat','Talk to the goat')),()=>n4sDuchTalk(),D.x,D.y,true); }
}
// Cindervane's Spark: it blocks the first hit Ash takes in each boss fight on the peak (a CLANG and a gold flash)
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){
  try{ if(G&&G.mode==='story'&&n4sMap4()&&amt>0&&!(player.iframes>0)&&!player.dead&&scene==='play'&&!(window.__eb&&window.__eb.god)){
    if(N4ST.heart&&!N4ST.heart.blazed) return false;   // the Heart moment cannot be lost
    const lava=typeof HURT_SRC!=='undefined'&&HURT_SRC==='lava';
    const fight=G.boss&&!G.boss.dead&&G.fightSite;
    if(fight&&!lava&&G.items.n_spark>0&&N4ST.sparkFor!==G.fightSite+':'+(G.boss.id||0)){ N4ST.sparkFor=G.fightSite+':'+(G.boss.id||0); flashA=Math.max(flashA,0.35); flashCol='255,214,120'; n4sSfx('block'); ftext(player.x,player.y-40,simplify(S('CLANG! The Spark holds.','CLANG!')),'#ffd878',15); player.iframes=Math.max(player.iframes,0.6); return false; }
    if(fight&&!lava&&N4ST.wardLights>0){ N4ST.wardLights--; flashA=Math.max(flashA,0.25); flashCol='255,214,150'; n4sSfx('block'); ftext(player.x,player.y-40,simplify(S('A Ward-light takes the hit!','A Ward-light blocks it!')),'#ffe0a0',13); player.iframes=Math.max(player.iframes,0.5); return false; }
    if(N4ST.big>0.5) amt*=0.7;
  } }catch(e){ console.error(e); }
  return base(amt,sx,sy,kb); }; }

// ---------- 6. allies on the peak (FINALE 7). Earned across the whole game; rebuilt from the choices every frame (not
// saved: G.nAllies is the live list). Each joins in the ring of its own act, helps there (never by solving a puzzle,
// only by making mistakes cheaper or fights easier), leaves at the way up, waits at the Crown Shrine and fights Nyxara.
// x4_foes can ask: n4sAllyHere(id), n4sAllyBeat(id) (plays that friend's big-moment line once; true when they are
// here), n4sGlaciarCalm() (Glaciar is cancelling the echo's blizzard now), n4sHushGlow(x,y) (Hush's glow is there).
const N4S_ALLY_IDS=['greymane','cinder','vesper','glaciar','hush','tikka','grandpa'];
function n4sSummitOn(){ const F=G.flags; return !!F.n_gather&&(G.stage==='n_crown'||G.stage==='n_nyxara'||(G.stage==='n_end'&&!G.done))&&!N4ST.homeBound; }
function n4sNyxFight(){ return !!(G.boss&&!G.boss.dead&&G.boss.type==='n_nyxara'); }
function n4sEchoFight(k){ return !!(G.boss&&!G.boss.dead&&N4S_ECHO[k]&&G.boss.type===N4S_ECHO[k].type); }
function n4sAllyWant(id){
  if(!G||G.mode!=='story'||actOf(G.stage)!==5||!n4sMap4()||G.done) return false;
  const F=G.flags, st=G.stage;
  if(N4ST.gone&&N4ST.gone[id]) return false;
  if(N4ST.gatherPose&&id!=='cinder'&&id!=='grandpa') return n4sAllyEarned(id);
  switch(id){
    case 'greymane': return n4sGrey()&&((!!F.n_gate&&!n4sSeen('n_grey_bye')&&(st==='n_bridge'||st==='n_stair'||st==='n_clocks'))||n4sSummitOn());
    case 'cinder': return n4sCin()&&(n4sEchoFight(1)||n4sNyxFight());
    case 'vesper': return n4sVes()&&((n4sSeen('n_vesper_join')&&!n4sSeen('n_vesper_bye')&&(st==='n_clocks'||st==='n_rime'))||n4sSummitOn());
    case 'glaciar': return n4sGla()&&((n4sSeen('n_glaciar_join')&&!n4sSeen('n_glaciar_bye')&&(st==='n_rime'||st==='n_glass'))||n4sSummitOn());
    case 'hush': return n4sHushF()&&((n4sSeen('n_hush_join')&&!n4sEchoDone(4)&&st==='n_glass')||n4sSummitOn());
    case 'tikka': return n4sTikka()&&n4sSummitOn();
    case 'grandpa': return n4sEnd()==='lantern'&&(n4sNyxFight()||(N4ST.run&&!N4ST.homeBound))&&(!!F.n_heart_done||!!(N4ST.heart&&N4ST.heart.grandpa));
  }
  return false;
}
function n4sAllyEarned(id){ return id==='greymane'?n4sGrey():id==='vesper'?n4sVes():id==='glaciar'?n4sGla():id==='hush'?n4sHushF():id==='tikka'?n4sTikka():id==='cinder'?n4sCin():id==='grandpa'?n4sEnd()==='lantern':false; }
function n4sAllyHere(id){ const a=N4ST.ally[id]; return !!(a&&a.mode!=='leave'); }
function n4sAllyArrive(id){ if(!player) return null; let a=N4ST.ally[id]; if(a&&a.mode!=='leave') return a; a=n4sAllyMk(id); N4ST.ally[id]=a; return a; }
function n4sAllyLeave(id){ const a=N4ST.ally[id]; if(a&&a.mode!=='leave'){ a.mode='leave'; a.lt=0; a.la=rand(0,TAU); } }
const N4S_SLOT={greymane:[-56,34,0],vesper:[54,26,0],tikka:[-30,58,0],hush:[16,-30,64],glaciar:[0,0,170],grandpa:[0,-6,46],cinder:[0,0,0]};
function n4sAllyMk(id){
  const p=player, s=N4S_SLOT[id]||[0,40,0], a={id,x:p.x+s[0]*2,y:p.y+s[1]*2,z:s[2],t:rand(0,9),cd:1.5,cd2:3,mode:'follow',face:0,dx:0,dy:0,alpha:0,lt:0};
  if(id==='glaciar'){ a.x=p.x-500; a.y=p.y-300; a.z=260; }
  if(id==='hush'){ a.x=p.x+300; a.y=p.y-260; a.z=140; }
  if(id==='grandpa'){ a.x=p.x; a.y=p.y+400; a.z=120; }
  if(id==='cinder'){ const C=n4sEchoFight(1)?{x:4500,y:81240}:{x:4500,y:85840}; a.x=C.x; a.y=C.y; a.post=C; a.face=-Math.PI/2; }
  return a;
}
// the Crown gathering: everyone takes a place round the shrine for the scene
const N4S_POSE={greymane:[3282,85910,0],vesper:[3392,85862,0],glaciar:[3331,85790,0],hush:[3331,85840,62],tikka:[3268,85872,0]};
function n4sGatherPose(on){ N4ST.gatherPose=!!on; if(on) for(const id in N4S_POSE){ if(!n4sAllyEarned(id)) continue; const a=n4sAllyArrive(id); if(!a) continue; const P=N4S_POSE[id]; a.x=P[0]; a.y=P[1]; a.z=P[2]; a.mode='pose'; a.alpha=1; } else for(const id in N4ST.ally){ const a=N4ST.ally[id]; if(a.mode==='pose') a.mode='follow'; } }
// the foes the friends deal with (any of these types; the peak's shades by name, plus anything small in an echo's room)
const n4sIsShade=e=>!!e&&!e.dead&&!e.boss&&/^n_(shade|mothling|frostshade|glasswing|inkknight|lampmoth)/.test(String(e.type));
function n4sNearFoe(x,y,r,f){ let b=null,bd=r*r; for(const e of G.enemies){ if(e.dead||e.boss||e.passive||(f&&!f(e))) continue; const d=dist2(x,y,e.x,e.y); if(d<bd){ bd=d; b=e; } } return b; }
function n4sHitFoe(e,frac,col,word){ if(!e||e.dead) return; damageEnemy(e,Math.max(20,e.maxHp*frac),{src:'comp',fx:e.x,fy:e.y-40}); emit(e.x,e.y,10,{col:col||'230,230,250',smin:60,smax:180,lmin:.2,lmax:.45,zmin:1.5,zmax:3}); if(word) ftext(e.x,e.y-34,simplify(word),'#ffe8c0',13); }
function n4sHitBoss(frac,col,word){ const b=G.boss; if(!b||b.dead||b.invuln) return false; damageEnemy(b,b.maxHp*frac,{src:'comp'}); emit(b.x,b.y,16,{col:col||'230,240,250',smin:60,smax:200,lmin:.3,lmax:.6,zmin:2,zmax:4}); if(word) ftext(b.x,b.y-60,simplify(word),'#ffe8c0',14); try{ shake(4); }catch(e){} return true; }
function n4sAllyBeat(id){ if(!n4sAllyHere(id)&&!(id==='wardens'&&n4sEnd()==='warden')&&!(id==='ember'&&n4sEnd()==='hero')) return false; const k='ab_'+id; if(N4ST.phaseSeen[k]) return true; N4ST.phaseSeen[k]=1; const L=N4S_ALLYBEAT[id]; if(L) try{ taunt(L[0],L[1]); }catch(e){} return true; }
function n4sGlaciarCalm(){ return (N4ST.glaCalm||0)>0; }
function n4sHushGlow(x,y){ const a=N4ST.ally.hush; return !!(a&&a.mode!=='leave'&&dist(a.x,a.y,x,y)<200); }
function n4sAllyTick(dt){
  // who should be here, who should go
  for(const id of N4S_ALLY_IDS){ const want=n4sAllyWant(id), a=N4ST.ally[id];
    if(want&&(!a||a.mode==='leave')) n4sAllyArrive(id); else if(!want&&a&&a.mode!=='leave'&&a.mode!=='pose') n4sAllyLeave(id); }
  if(N4ST.glaCalm>0) N4ST.glaCalm-=dt;
  const p=player, list=[]; let k=0;
  for(const id in N4ST.ally){ const a=N4ST.ally[id]; a.t+=dt; a.cd-=dt; a.cd2-=dt;
    if(a.mode==='leave'){ a.lt+=dt; a.alpha=Math.max(0,1-a.lt/1.6); const sp=id==='glaciar'||id==='hush'||id==='grandpa'?420:300; a.x+=Math.cos(a.la)*sp*dt; a.y+=Math.sin(a.la)*sp*dt; if(id==='glaciar'||id==='hush') a.z+=120*dt; if(a.lt>1.8){ delete N4ST.ally[id]; continue; } list.push(a); continue; }
    a.alpha=Math.min(1,a.alpha+dt*1.5);
    if(a.mode==='pose'){ list.push(a); continue; }
    // movement
    let tx,ty; const s=N4S_SLOT[id]||[0,40,0], nyx=n4sNyxE(), fightE=G.boss&&!G.boss.dead?G.boss:null;
    if(id==='cinder'){ tx=a.post.x; ty=a.post.y; }
    else if(id==='glaciar'){ const C=fightE||p, R=fightE?560:240, ang=a.t*(fightE?0.35:0.5); tx=C.x+Math.cos(ang)*R; ty=C.y+Math.sin(ang)*R*0.6; a.z=fightE?220:170; }
    else if(id==='grandpa'){ const ang=a.t*1.6; tx=p.x+Math.cos(ang)*70; ty=p.y+Math.sin(ang)*40; a.z=50+Math.sin(a.t*3)*8; }
    else if(id==='hush'&&n4sHushSmall()){ tx=p.x+7; ty=p.y+1; a.z=46+Math.sin(a.t*3)*3; }   // (small Hush rides on Ash's horn)
    else if(id==='greymane'&&fightE&&a.cd>4&&a.tx!=null){ tx=a.tx; ty=a.ty; }
    else if(id==='greymane'&&fightE){ tx=fightE.x; ty=fightE.y; }
    else { const f=p.facing||0, ca=Math.cos(f), sa=Math.sin(f); tx=p.x-ca*Math.abs(s[1])*0.7+(-sa)*s[0]; ty=p.y-sa*Math.abs(s[1])*0.7+ca*s[0]; }
    const d=dist(a.x,a.y,tx,ty);
    if(d>900&&id!=='cinder'){ a.x=tx+rand(-40,40); a.y=ty+rand(-40,40); }
    else if(d>14){ const sp=(id==='greymane'?Math.min(420,90+d*2.2):Math.min(360,60+d*1.8)); const an=angTo(a.x,a.y,tx,ty); a.face=an; a.dx=Math.cos(an)*sp; a.dy=Math.sin(an)*sp; a.x+=a.dx*Math.min(dt,d/sp); a.y+=a.dy*Math.min(dt,d/sp); }
    else { a.dx=a.dy=0; if(id!=='cinder') a.face=angTo(a.x,a.y,p.x,p.y); }
    n4sAllyAct(a,dt);
    list.push(a); k++;
  }
  G.nAllies=list;
  N4ST.allies=list;
}
// under dialogue: friends keep their poses and fades, and stay drawn (the renderer reads G.allies)
function n4sAllyLite(dt){
  if(!G||G.mode!=='story'||curMap()!==4||AREA) return;
  const list=[];
  for(const id in N4ST.ally){ const a=N4ST.ally[id]; a.t+=dt; if(a.mode==='leave'){ a.lt+=dt; a.alpha=Math.max(0,1-a.lt/1.6); if(a.lt>1.8){ delete N4ST.ally[id]; continue; } } else a.alpha=Math.min(1,a.alpha+dt*1.5); list.push(a); }
  N4ST.allies=list; G.nAllies=list; n4sAllyRender();
}
function n4sAllyRender(){ if(!N4ST.allies.length){ return; } G.allies=N4ST.allies.map(a=>{ const o=a.r4||(a.r4={draw:null,x:0,y:0,r:10}); o.x=a.x; o.y=a.y+(a.id==='glaciar'?140:a.id==='hush'?40:0); o.draw=()=>n4sDrawAlly(a); return o; }); }
// what each friend does (generic help; the fights' own mechanics are x4_foes', which can read the friends above)
function n4sAllyAct(a,dt){
  if(N4ST.heart&&!N4ST.heart.blazed) return;   // (in the Heart moment the friends wait in the dark)
  const p=player, b=G.boss&&!G.boss.dead?G.boss:null, id=a.id;
  if(id==='greymane'){
    if(b&&a.cd<=0&&dist(a.x,a.y,b.x,b.y)<150&&!b.invuln&&(b.type==='n_echo_vor'||b.type==='n_nyxara')){ a.cd=b.type==='n_nyxara'?6:7; n4sHitBoss(0.03,'230,240,250',S('Bite!','Bite!')); n4sSfx('slash3'); a.tx=b.x+rand(-360,360); a.ty=b.y+rand(-300,300); }
    else if(!b&&a.cd<=0){ const e=n4sNearFoe(a.x,a.y,280,n4sIsShade); if(e){ a.cd=2.2; a.x=e.x-Math.cos(angTo(e.x,e.y,a.x,a.y))*-30; n4sHitFoe(e,0.45,'230,240,250'); } }
    if(a.cd2<=0){ a.cd2=20; const foes=G.enemies.filter(e=>!e.dead&&!e.boss&&dist(e.x,e.y,p.x,p.y)<420); if(foes.length){ for(const e of foes) e.stun=Math.max(e.stun||0,1.2); try{ SFX.play('howl'); }catch(e){} ftext(a.x,a.y-40,simplify(S('AROOOO!','AROOOO!')),'#e0e8ff',14); } }
  } else if(id==='cinder'){
    if(a.cd<=0){ a.cd=3.2; const e=n4sNearFoe(a.x,a.y,900,q=>!q.boss); if(e){ n4sHitFoe(e,2,'255,200,140'); if(Math.random()<0.35) try{ taunt('cinder',pick([S('None shall pass!','Nobody passes!'),S('Not while I stand!','Not while I stand!'),S('Ha! Too slow, little moth!','Too slow!')])); }catch(err){} } }
  } else if(id==='vesper'){
    if(b&&b.type==='n_echo_vesper'){ if(a.cd<=0){ a.cd=6; const e=n4sNearFoe(b.x,b.y,600); if(e){ n4sHitFoe(e,2,'200,170,255',S('Pop!','Pop!')); } ftext(b.x,b.y-70,simplify(S('That one is real!','That one!')),'#e8d8ff',14); } }
    else if(!b&&a.cd<=0){ const e=n4sNearFoe(a.x,a.y,520,q=>/lampmoth/.test(q.type)); if(e){ a.cd=8; n4sHitFoe(e,0.6,'255,230,170',S('Lamp out!','Lamp out!')); } }
  } else if(id==='glaciar'){
    if(b&&b.type==='n_echo_glaciar'){ if(a.cd<=0){ a.cd=15; N4ST.glaCalm=5; try{ taunt('f_glaciar',S('Enough snow, copy of me! There, dumpling, calm air. Quick!','Calm air! Go!')); }catch(e){} } }
    else if(!b&&a.cd<=0){ const e=n4sNearFoe(p.x,p.y,420,q=>/wolf|frost/.test(q.type)); if(e){ a.cd=4; e.stun=Math.max(e.stun||0,2); n4sHitFoe(e,0.3,'190,230,255',S('Frozen!','Frozen!')); } }
  } else if(id==='hush'){
    if(a.cd<=0){ a.cd=10; const foes=G.enemies.filter(e=>!e.dead&&!e.boss&&/mothling/.test(e.type)&&dist(e.x,e.y,p.x,p.y)<420); if(foes.length){ for(const e of foes) e.stun=Math.max(e.stun||0,2); ftext(a.x,a.y-(a.z||0)-30,simplify(S('Shhhh.','Shhh.')),'#f0ecff',14); } }
  } else if(id==='tikka'){
    if(a.cd<=0){ a.cd=2.5; const e=n4sNearFoe(a.x,a.y,130,n4sIsShade); if(e) n4sHitFoe(e,0.8,'255,220,160',S('BONK!','BONK!')); }
    if(a.cd2<=0){ a.cd2=11; if(b&&dist(a.x,a.y,p.x,p.y)<420&&p.hp<p.maxHp){ heal(p.maxHp*0.15); N4ST.bun={x:a.x,y:a.y,t:0}; ftext(a.x,a.y-40,simplify(S('Lumpy bun!','Bun!')),'#ffd890',14); } }
  } else if(id==='grandpa'){
    if(b&&b.type==='n_nyxara'&&G.flags.n_heart_done&&a.cd<=0){ a.cd=5; n4sHitBoss(0.02,'255,150,70',S('Grandpa fire!','Fire!')); for(let i=0;i<14;i++) emit(lerp(a.x,b.x,i/14),lerp(a.y-(a.z||0),b.y,i/14),1,{kind:'fire',smin:20,smax:60,lmin:.3,lmax:.5,zmin:2,zmax:4}); }
  }
}
// drawing: each friend with the figure their own act made for them (3D toys or the Classic look), else a simple one
const N4S_FIG={};
function n4sFig(id,a,o){ const f=N4S_FIG[id]||(N4S_FIG[id]=Object.assign({hp:1,maxHp:1,ally:true,level:1,flash:0,alpha:1,spawnIn:0},o||{})); Object.assign(f,{x:a.x,y:a.y,face:a.face,t:a.t,dx:a.dx||0,dy:a.dy||0,state:Math.hypot(a.dx||0,a.dy||0)>20?'chase':'idle',st:0}); return f; }
function n4sDrawAlly(a){
  const id=a.id, al=a.alpha==null?1:a.alpha; if(al<=0.02) return;
  ctx.save(); ctx.globalAlpha*=al;
  try{
    if(id==='greymane'){ if(T3.on&&T3A.grey) T3A.grey(Object.assign(a,{k:'grey',snowy:true})); else drawWolf(Object.assign(a,{k:'grey'}),false,1.9,true,true); }
    else if(id==='cinder'){ ctx.globalAlpha*=0.82; if(T3.on&&T3A.cinder) T3A.cinder(Object.assign(a,{k:'cinder'})); else drawKnight(Object.assign({r:27,state:'chase',blocking:true,swung:0},a),1.3,false,true); glowAt(a.x,a.y-30,46,'255,190,120',0.25); }
    else if(id==='vesper'){ const f=n4sFig('vesper',a,{r:13,r0:13,speed:220}); if(T3.on&&typeof c1FigVesper==='function') c1FigVesper(f,false); else if(typeof c1Vesper2==='function') c1Vesper2(f,false); else n4sSimpleFig(a,'#4a3a6a','#ece8f6'); }
    else if(id==='glaciar'){ const z=a.z||170, sh=0.9; ctx.save(); ctx.fillStyle='rgba(20,30,60,.22)'; ctx.beginPath(); ctx.ellipse(a.x,a.y+10,110*sh,40*sh,0,0,TAU); ctx.fill(); ctx.restore();
      const f=n4sFig('glaciar',a,{r:60,r0:60,type:'f_glaciar',mode:'air'}); f.z=z; f.state='chase';
      ctx.save(); ctx.translate(a.x,a.y); ctx.scale(sh,sh); ctx.translate(-a.x,-a.y);
      if(T3.on&&typeof f2FigGlaciar==='function') f2FigGlaciar(f,false); else if(typeof f2Glaciar2==='function') f2Glaciar2(f,false); else n4sSimpleDragon(a.x,a.y-z,'#bfe6f8');
      ctx.restore(); }
    else if(id==='hush'){ const f=n4sFig('hush',a,{r:42,r0:42}); const small=n4sHushSmall(), sc=small?0.24:0.62; f.z=small?(a.z||46)/sc:(a.z||60); f.state='chase'; f.shadow=false;
      ctx.save(); ctx.translate(a.x,a.y); ctx.scale(sc,sc); ctx.translate(-a.x,-a.y);
      if(T3.on&&typeof m3FigHush==='function') m3FigHush(f,false); else if(typeof m3Hush2==='function') m3Hush2(f,false); else if(typeof thrMoth==='function') thrMoth(ctx,a.x,a.y-f.z,4,a.t*5,'#f4f2fa','#b890f0');
      ctx.restore(); glowAt(a.x,a.y-(small?(a.z||46):(a.z||60)*0.6),small?60:150,'236,232,255',small?0.22:0.16); }
    else if(id==='tikka'){ const o=N4S_FIG.tikka||(N4S_FIG.tikka={k:'kob',id:'ev_tikka',kk:0.86,scarf:'#c84a3a',apron:true,spoon:true,t:0}); Object.assign(o,{x:a.x,y:a.y,face:a.face,t:a.t});
      const o2=N4S_FIG.tock||(N4S_FIG.tock={k:'kob',id:'ev_tock',kk:0.95,t:0}); Object.assign(o2,{x:a.x-26,y:a.y+10,face:a.face,t:a.t+1});
      if(typeof evDrawKob==='function'){ evDrawKob(o2); evDrawKob(o); } else { n4sSimpleFig(a,'#b8a060','#e8d0a0'); } }
    else if(id==='grandpa'){ const z=a.z||40; if(typeof drawMiniDragon==='function') drawMiniDragon(a.x,a.y-z,a.face>Math.PI/2||a.face<-Math.PI/2?-1:1,false); else n4sSimpleDragon(a.x,a.y-z,'#c8482a',0.3); glowAt(a.x,a.y-z,40,'255,150,70',0.3); }
  }catch(e){ if(!N4ST.errA){ N4ST.errA=1; console.error('n4s ally draw',id,e); } }
  ctx.restore();
}
function n4sSimpleFig(a,body,head){ const x=a.x, y=a.y; ctx.fillStyle='rgba(10,8,20,.25)'; ctx.beginPath(); ctx.ellipse(x,y+4,11,4,0,0,TAU); ctx.fill(); ctx.fillStyle=body; ctx.beginPath(); ctx.ellipse(x,y-12,9,13,0,0,TAU); ctx.fill(); ctx.fillStyle=head; ctx.beginPath(); ctx.arc(x,y-28,7,0,TAU); ctx.fill(); ctx.strokeStyle='#120a1c'; ctx.lineWidth=1.6; ctx.stroke(); }
function n4sSimpleDragon(x,y,col,s){ s=s||1; ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.fillStyle=col; ctx.strokeStyle='#14203a'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(0,0,80,30,0,0,TAU); ctx.fill(); ctx.stroke(); for(const d of [-1,1]){ ctx.beginPath(); ctx.moveTo(-10,-10); ctx.quadraticCurveTo(d*40,-90,d*140,-40); ctx.quadraticCurveTo(d*60,-20,10,0); ctx.fill(); ctx.stroke(); } ctx.beginPath(); ctx.ellipse(84,-20,26,18,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
// the friends go into the stock "allies" list the renderer draws (updateAllies clears it outside the Act I summit)
{ const base=updateAllies; updateAllies=function(dt){ base(dt); try{ if(G&&G.mode==='story'&&curMap()===4&&!AREA){ n4sAllyTick(dt); n4sAllyRender(); } else if(N4ST.allies.length){ N4ST.allies=[]; N4ST.ally={}; G.nAllies=[]; } }catch(e){ console.error(e); } }; }
// Glaciar catches Ash in the Floe Gap and the Aurora chasm (no harm: back to the start shore, FINALE 7)
{ const base=backToSafe; backToSafe=function(p,bad){
  try{ if(bad==='void'&&p===player&&n4sAllyHere('glaciar')&&n4sMap4()){ const r=n4sR(p.x,p.y), a=n4sAng(p.x,p.y);
    const floe=r>1400&&r<2500&&n4sInA(a,133,152), aur=r>1400&&r<2500&&n4sInA(a,228,292);
    if(floe||aur){ const s=floe?(n4sSpot('floe')||n4sPC(1950,131)):(n4sSpot('aurora')||n4sPC(1950,224));
      p.z=0; p.vz=0; p.flying=false; p.landing=false; p.gliding=false; p.x=s.x; p.y=s.y; p.avx=p.avy=0; p.kvx=p.kvy=0; p.iframes=Math.max(p.iframes,1);
      try{ if(typeof MV!=='undefined'&&MV){ MV.hover=null; MV.lx=p.x; MV.ly=p.y; } }catch(e){}
      const g=N4ST.ally.glaciar; if(g){ g.x=p.x-80; g.y=p.y-40; }
      emit(p.x,p.y,16,{col:'200,235,255',smin:40,smax:140,lmin:.3,lmax:.7,zmin:1.5,zmax:3});
      try{ bubble(player,simplify(S('Caught you, dumpling! Slow at everything except catching.','Caught you, dumpling!')),{who:'Glaciar',col:'#a8e0ff'}); }catch(e){}
      return; } } }catch(e){ console.error(e); }
  return base(p,bad); }; }

// ---------- 7. the fights' words (x4_foes owns the fights): STORY.bosses[type] reads this file's scenes, so a
// defineBoss with no intro or outro of its own plays them; Nyxara's outro is empty (the fall is n4sFall, below)
const N4S_BOSSW={n_echo_vor:['n_echo1_intro','n_echo1_outro'],n_echo_vesper:['n_echo2_intro','n_echo2_outro'],n_echo_glaciar:['n_echo3_intro','n_echo3_outro'],
  n_echo_hush:['n_echo4_intro','n_echo4_outro'],n_nyxara:['n_nyxara_intro',null]};
function n4sBossWords(){
  for(const t in N4S_BOSSW){ const [i,o]=N4S_BOSSW[t]; const B=STORY.bosses[t]||(STORY.bosses[t]={});
    try{ Object.defineProperty(B,'intro',{configurable:true,enumerable:true,get(){ return STORY[i]; },set(v){}});
      Object.defineProperty(B,'outro',{configurable:true,enumerable:true,get(){ return o?STORY[o]:[n4sDo(()=>{})]; },set(v){}}); }catch(e){ console.error(e); } }
}
n4sBossWords();
// her phase changes: x4_foes calls n4sPhase(p, done) as phase p begins (2 and 3 have scenes), n4sTaunt(kind) for a taunt
function n4sPhaseStart(p,done){ G.flags.n_phase=Math.max(G.flags.n_phase|0,p|0); const k=p===2?'n_trans12':p===3?'n_trans23':null; if(!k||N4ST.phaseSeen[k]){ if(done) n4sTry(done); return false; } N4ST.phaseSeen[k]=1; return n4sPlay(STORY[k],done,{mood:p===2?'n_nyxara2':'n_nyxara3'}); }
function n4sTaunt(kind){ const L=N4S_TAUNT[kind]; if(!L||!L.length) return false; try{ taunt('nyxara',pick(L)); }catch(e){} return true; }
// ---------- stand-in fights (only while x4_foes is not in the build; it loads before this file, so this is decided
// now): a shadow for each echo and a plain Nyxara that reaches the Heart moment at 20 percent and falls at 0
const n4sSiteFor=t=>{ for(const k in SITES){ if(SITES[k]&&SITES[k].boss===t) return k; } return null; };
N4ST.stand.echo=!EDEF.n_echo_vor&&!n4sSiteFor('n_echo_vor');
N4ST.stand.nyx=!EDEF.n_nyxara&&!n4sSiteFor('n_nyxara');
function n4sShadowDraw(e,fl,kind){
  const x=e.x, y=e.y, r=e.r, t=e.t||0, z=(e.flying?18:0)+(e.z||0);
  ctx.save(); ctx.fillStyle='rgba(8,4,16,.35)'; ctx.beginPath(); ctx.ellipse(x,y+r*0.5,r*1.3,r*0.5,0,0,TAU); ctx.fill();
  glowAt(x,y-z-r*0.4,r*2.2,'150,100,255',0.25);
  const body=fl?'#ffffff':'#1a1028', rim='rgba(180,140,255,.8)';
  ctx.translate(x,y-z); ctx.lineWidth=3; ctx.strokeStyle=rim; ctx.fillStyle=body;
  if(kind==='moth'||kind==='nyx'){ const s=r/22; if(typeof thrMoth==='function'){ thrMoth(ctx,0,-r*0.3,s*(kind==='nyx'?1.4:1),t*4,body,kind==='nyx'?'#ece6ff':'#d8c8ff'); } else { ctx.beginPath(); ctx.ellipse(0,-r*0.3,r*1.6,r*0.7,0,0,TAU); ctx.fill(); ctx.stroke(); } }
  else if(kind==='thief'){ ctx.beginPath(); ctx.ellipse(0,-r*0.9,r*0.7,r,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0,-r*2,r*0.55,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#e8e0f4'; ctx.beginPath(); ctx.ellipse(0,-r*2,r*0.5,r*0.22,0,0,TAU); ctx.fill(); }
  else { ctx.beginPath(); ctx.ellipse(0,-r*0.5,r*1.2,r*0.7,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(r*0.9,-r*1.1,r*0.5,r*0.38,-0.3,0,TAU); ctx.fill(); ctx.stroke();
    for(const d of [-1,1]){ ctx.beginPath(); ctx.moveTo(-r*0.2,-r*0.8); ctx.quadraticCurveTo(d*r*0.8,-r*2.2,d*r*1.8,-r*1.2); ctx.quadraticCurveTo(d*r*0.6,-r*0.9,0,-r*0.5); ctx.fill(); ctx.stroke(); }
    if(kind==='ice'){ ctx.strokeStyle='rgba(170,220,255,.8)'; ctx.stroke(); } }
  ctx.fillStyle='#ffffff'; for(const d of [-1,1]){ ctx.beginPath(); ctx.arc((kind==='dragon'||kind==='ice'?r*0.95:0)+d*r*0.18,(kind==='dragon'||kind==='ice'?-r*1.15:kind==='thief'?-r*2.02:-r*0.5),Math.max(2,r*0.08),0,TAU); ctx.fill(); }
  ctx.restore();
  if(Math.random()<0.12) emit(x+rand(-r,r),y-z-rand(0,r*1.5),1,{col:'200,180,255',smin:10,smax:40,lmin:.4,lmax:.8,zmin:1,zmax:2,rise:20});
}
if(N4ST.stand.echo){
  const mk=(k,type,name,title,kind,o)=>{ const E=N4S_ECHO[k];
    defineFoe(type,Object.assign({boss:true,name,title,short:name,r:o.r||34,hp:o.hp||8000,lv:21,speed:o.speed||110,dmg:30,value:900,kbRes:0.2,dcol:'150,110,230',flying:!!o.flying,
      ai:FK.brain({move:o.move||'approach',stop:o.stop||60,orbit:o.orbit||170,turn:4,cd:[0.9,1.6],moves:o.moves}),
      draw2d:(e,fl)=>n4sShadowDraw(e,fl,kind),draw3d:(e,fl)=>n4sShadowDraw(e,fl,kind)},o.extra||{}));
    defineBoss(E.site,{boss:type,at:{x:E.x,y:E.y,r:E.r,name:E.name,level:21+k/2},stage:E.stage,flyOK:k===3,
      open:o.open,arena:{shape:'ring',r:E.r-20,style:'obsidian',glow:'170,120,255'},music:k===4?'n_echo_hush':'n_echo',
      onWin(){ G.flags['n_echo'+k+'_done']=1; } }); };
  mk(1,'n_echo_vor','Echo of the First Flame',S('a shadow on the throne','a shadow dragon'),'dragon',{r:40,hp:8200,moves:[{k:'slash',reach:96,windup:0.6,dmgN:30,w:2},{k:'stomp',rings:1,max:380,dmgN:22,w:1},{k:'shoot',mode:'spread',n:3,kind:'fireball',dmgN:20,w:1,min:140}],open:()=>n4sFlames()>=3});
  mk(2,'n_echo_vesper','Echo of the Moth Mask',S('a shadow in a mask','a shadow thief'),'thief',{r:16,hp:7000,speed:170,move:'strafe',moves:[{k:'lunge',len:220,dmgN:24,w:2},{k:'shoot',mode:'spread',n:3,kind:'bolt',dmgN:16,w:1,min:120}],open:()=>!!G.flags.n_gear});
  mk(3,'n_echo_glaciar','Echo of the Ice Dragon',S('a shadow on an ice throne','a shadow ice dragon'),'ice',{r:46,hp:8800,speed:90,moves:[{k:'breath',len:300,frost:true,slow:true,dmgN:6,w:2},{k:'stomp',rings:2,max:420,dmgN:22,w:1}],open:()=>!!G.flags.n_aurora});
  mk(4,'n_echo_hush','Echo of the Hush',S('a shadow moth','a shadow moth'),'moth',{r:34,hp:7600,speed:150,flying:true,move:'hover',orbit:200,moves:[{k:'swoop',len:260,dmgN:24,w:2},{k:'ring',n:10,kind:'orb',dmgN:16,w:1}],open:()=>!!G.flags.n_wood});
}
if(N4ST.stand.nyx){
  defineFoe('n_nyxara',{boss:true,name:'Nyxara, the Night Mother',title:S('Eater of the Moon','Eater of the Moon'),short:'The Night Mother',r:70,hp:16000,lv:23,speed:120,dmg:34,value:3000,kbRes:0,flying:true,dcol:'170,140,230',
    ai:FK.brain({move:'hover',orbit:260,wobble:40,turn:3,cd:[1.2,2.0],moves:[{k:'swoop',len:300,dmgN:30,w:2},{k:'ring',n:12,kind:'orb',dmgN:18,w:1.5},{k:'shoot',mode:'spread',n:5,kind:'bolt',dmgN:16,w:1}]}),
    draw2d:(e,fl)=>n4sShadowDraw(e,fl,'nyx'),draw3d:(e,fl)=>n4sShadowDraw(e,fl,'nyx')});
  defineBoss('n_summit',{boss:'n_nyxara',at:{x:4500,y:85200,r:600,name:S("The Moon's Rest","The Moon's Rest"),level:23},stage:'n_nyxara',flyOK:true,bless:false,
    open:()=>!!G.flags.n_door&&!G.choices.n_end,arena:{shape:'ring',r:600,style:'obsidian',glow:'190,150,255'},music:'n_nyxara',
    hpScale:()=>G.flags.n_heart_done?0.2:1,
    onWin(){ G.flags.n_nyx_done=1; n4sFall(null,null); }});
}
// the stand-in Nyxara: her two scenes between phases, the Heart moment at 20 percent (she waits, frozen, until it ends)
function n4sStandNyxTick(dt){
  if(!N4ST.stand.nyx) return; const e=n4sNyxE(); if(!e||e.dead) return; const f=e.hp/Math.max(1,e.maxHp);
  if(f<=0.7&&!N4ST.phaseSeen.n_trans12&&n4sCalm(true)) n4sPhaseStart(2);
  else if(f<=0.45&&!N4ST.phaseSeen.n_trans23&&n4sCalm(true)) n4sPhaseStart(3);
  if(f<=0.2&&!G.flags.n_heart_done&&!N4ST.heart&&n4sCalm(true)){ e.hp=Math.max(e.hp,e.maxHp*0.2); n4sHeart(()=>{}); }
  if(N4ST.heart&&!N4ST.heart.blazed){ e.invuln=true; e.stun=Math.max(e.stun||0,0.2); e.hp=Math.max(e.hp,e.maxHp*0.2); } else if(e.invuln&&!N4ST.heart) e.invuln=false;
}

// ---------- 8. the Heart moment (FINALE 8.4): x4_foes calls n4sHeart(done) when she gulps the last piece of the moon;
// done runs when the Heart blazes and phase 4 can begin. It cannot be lost and never plays twice. While it runs the
// world is black (only Ash, Pip and the Heart are drawn, and each voice's small light), enemies wait, fire is smoke.
const N4S_MARKS=[0.25,0.5,0.75,0.9];
const N4S_SEAMC=['168,120,255','140,210,255','228,234,255','255,150,60'];
function n4sHeart(done){
  if(G.flags.n_heart_done){ if(done) n4sTry(done); return false; }
  if(N4ST.heart){ if(done) N4ST.heart.dones.push(done); return true; }
  const p=player;
  const HM=N4ST.heart={t:0,dark:0,darkTo:0.55,meter:0,mark:0,phase:'intro',dones:done?[done]:[],lx:p.x,ly:p.y,voices:[],seam:[0,0,0,0],float:0,fl:0,puff:0,
    hold:0,idle:0,grandpa:0,wardens:0,belly:0,pip:0,word:0,wordT:0,spark:0,sparkT:0,blazed:false,blaze:0,end:0,warm:0};
  G.flags.n_heart_on=1; N4ST.heartLock=true; G.banner=null; G.bannerQ=[]; try{ if(typeof MV!=='undefined'&&MV) MV.tip=null; }catch(e){}
  p.flying=false; p.landing=false; p.gliding=false; p.z=0; p.vz=0; p.kvx=p.kvy=0; p.facing=-Math.PI/2;
  for(const pr of G.projectiles) if(pr.owner==='enemy') pr.dead=true;
  try{ if(typeof P3!=='undefined'&&P3) P3.ride=null; }catch(e){}
  n4sPlay('n_heart_start',()=>{ HM.phase='hold'; HM.darkTo=1; HM.float=1; },{again:true,mood:'n_heart'});
  return true;
}
// a voice speaks from the Heart: its small coloured light appears beside Ash and flies into the seam
function n4sVoice(who,col){ const HM=N4ST.heart; if(!HM) return; const a=rand(-2.6,-0.5); HM.voices.push({who,col,t:0,x:HM.lx+Math.cos(a)*130,y:HM.ly-60+Math.sin(a)*70}); }
function n4sHeartTick(dt){
  const HM=N4ST.heart; if(!HM) return; const p=player;
  // Ash stands still, safe; the fight waits (x4_foes reads G.flags.n_heart_on; enemies are frozen here too)
  p.x=HM.lx; p.y=HM.ly; p.kvx=p.kvy=0; p.iframes=Math.max(p.iframes,0.5); p.energy=p.maxEnergy; p.exhausted=false;
  if(!HM.blazed){ G.banner=null; try{ if(typeof MV!=='undefined'&&MV) MV.tip=null; }catch(e){} }
  for(const e of G.enemies) if(!e.dead){ e.stun=Math.max(e.stun||0,0.25); e.dx=e.dy=0; }
  if(HM.phase!=='hold') return;
  const fill=n4sBy(0.25,0.2,0.18), back=n4sBy(0.05,0.12,0.2), floor=HM.mark>0?N4S_MARKS[HM.mark-1]:0;
  const holding=!!p.breathing;
  if(holding){ HM.meter=Math.min(1,HM.meter+fill*dt); HM.idle=0; HM.hold+=dt; } else { HM.meter=Math.max(floor,HM.meter-back*dt); HM.idle+=dt; }
  HM.warm=lerp(HM.warm,holding?1:0,1-Math.exp(-dt*6));
  if(HM.mark<4&&HM.meter>=N4S_MARKS[HM.mark]){ HM.meter=N4S_MARKS[HM.mark]; HM.phase='voice'; const k=HM.mark;
    runDialogue(n4sSeamLines(k),()=>{ scene='play'; HM.seam[k]=1; HM.mark=k+1; HM.phase='hold'; HM.flash=1; n4sSfx('shrine'); if(k===3&&HM.wardens) N4ST.wardLights=5; },{mood:'n_heart'}); return; }
  if(HM.mark>=4&&HM.meter>=1){ HM.phase='end'; n4sPlay('n_heart_end',()=>n4sHeartDone(),{again:true,mood:'n_heart'}); }
}
function n4sHeartBlaze(){ const HM=N4ST.heart; if(!HM) return; HM.blazed=true; HM.blaze=0.001; HM.darkTo=0; flashA=Math.max(flashA,0.85); flashCol='255,236,190'; n4sJ('levelup','levelup'); try{ shake(10); }catch(e){} }
function n4sHeartDone(){
  const HM=N4ST.heart; if(!HM) return;
  if(!HM.blazed) n4sHeartBlaze();
  G.flags.n_heart_on=0; G.flags.n_heart_done=1; G.flags.n_phase=4; N4ST.heartLock=false; HM.phase='after'; HM.end=0.001;
  if(n4sEnd()==='heir'){ N4ST.bigTo=1; G.flags.n_big=1; try{ SFX.play('roar'); }catch(e){} }
  if(n4sEnd()==='warden') N4ST.wardLights=5;
  if(n4sEnd()==='hero') N4ST.emberSpirit=1;
  const D=HM.dones.slice(); HM.dones.length=0; for(const d of D) n4sTry(d);
  try{ setBanner(S('Heartfire!','Heartfire!'),N4S_HINT[4],3.2); }catch(e){}
  saveGame();
}
// fire breath during the Heart moment is only smoke; afterwards it is Heartfire (gold and silver)
{ const base=doBreath; doBreath=function(dt){
  const HM=N4ST.heart;
  if(HM&&!HM.blazed&&G&&G.mode==='story'){ const p=player, ang=p.facing, mx=p.x+Math.cos(ang)*16, my=p.y+Math.sin(ang)*16;
    if(Math.random()<0.5) emit(mx,my-6,1,{col:'90,80,100',glow:false,ang:-Math.PI/2,spread:0.8,smin:10,smax:40,lmin:.5,lmax:1,zmin:2,zmax:5,grow:8,drag:1});
    if(HM.phase==='hold'&&Math.random()<0.6){ const hx=HM.lx, hy=HM.ly-78; emit(hx+rand(-6,6),hy+rand(-6,6),1,{col:'255,170,90',smin:10,smax:40,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); }
    return; }
  base(dt);
  try{ if(G.flags.n_heart_done&&n4sNyxFight()&&Math.random()<0.6){ const p=player, a=p.facing; emit(p.x+Math.cos(a)*60,p.y+Math.sin(a)*60,2,{col:Math.random()<0.5?'255,214,120':'226,232,255',ang:a,spread:0.3,smin:200,smax:360,lmin:.3,lmax:.5,zmin:2,zmax:4,drag:1}); } }catch(e){}
}; }
// Heartfire: x2 to her while the Heart burns (FINALE 8.5), and the New Dragon (heir) hits harder while huge
{ const base=damageEnemy; damageEnemy=function(e,amt,o){
  try{ if(e&&G&&G.mode==='story'&&curMap()===4){ o=o||{}; let k=1;
    if(e.type==='n_nyxara'&&G.flags.n_heart_done&&(o.src==='fire'||o.src==='burn')) k*=2;
    if(N4ST.big>0.5&&o.src!=='comp'&&o.src!=='burn') k*=1.3;
    if(k!==1) amt*=k; } }catch(err){}
  return base(e,amt,o); }; }
// ---- drawing: the black, Ash and Pip, the Heart with its seams, the meter, the voices; the blaze
function n4sHeartPos(){ const HM=N4ST.heart; const p=player; const f=smooth(clamp(HM.fl,0,1)); return {x:lerp(p.x+10,HM.lx,f),y:lerp(p.y-16,HM.ly-104,f)+Math.sin(HM.t*2)*3*f}; }
function n4sDrawHeartW(){
  const HM=N4ST.heart; if(!HM) return;
  const a=HM.dark, t=HM.t, pos=n4sHeartPos(), x=pos.x, y=pos.y;
  ctx.save();
  if(a>0.01){ ctx.fillStyle=`rgba(0,0,0,${a})`; ctx.fillRect(cam.x-200,cam.y-200,W/zoom+400,H/zoom+400); }
  if(a>0.4){ try{ drawPlayer(); }catch(e){} try{ if(G.pip) drawPip(G.pip); }catch(e){} }
  // the warden lights, Grandpa on Ash's head, the belly fire
  if(HM.wardens){ for(let i=0;i<5;i++){ const an=t*1.2+i/5*TAU; glowAt(player.x+Math.cos(an)*70,player.y-30+Math.sin(an)*28,26,'255,214,150',0.6); ctx.fillStyle='#fff4d8'; ctx.beginPath(); ctx.arc(player.x+Math.cos(an)*70,player.y-30+Math.sin(an)*28,3.5,0,TAU); ctx.fill(); } }
  if(HM.grandpa&&typeof drawMiniDragon==='function'){ try{ drawMiniDragon(player.x,player.y-52,1,false); }catch(e){} glowAt(player.x,player.y-56,40,'255,140,70',0.4); }
  if(HM.belly) glowAt(player.x,player.y-14,40+10*Math.sin(t*6),'255,140,60',0.55);
  if(HM.float||HM.fl>0){
    const warm=0.25+0.75*HM.meter, R=22+2*Math.sin(t*3)*HM.warm;
    // the warm glow round the Heart grows with the meter; the black flames shrink
    glowAt(x,y,70+90*HM.meter+(HM.blaze>0?HM.blaze*900:0),'255,170,90',0.18+0.32*warm);
    if(!HM.blazed){ ctx.save(); for(let i=0;i<9;i++){ const an=i/9*TAU+t*0.7, l=(26-14*HM.meter)*(0.7+0.3*Math.sin(t*7+i*2)), bx=x+Math.cos(an)*R*0.9, by=y+Math.sin(an)*R*0.9;
      ctx.fillStyle=i%2?'rgba(40,14,70,.92)':'rgba(16,6,30,.95)'; ctx.beginPath(); ctx.moveTo(bx-Math.sin(an)*5,by+Math.cos(an)*5); ctx.quadraticCurveTo(bx+Math.cos(an)*l*0.6+Math.sin(t*9+i)*4,by+Math.sin(an)*l*0.6,bx+Math.cos(an)*l,by+Math.sin(an)*l-l*0.3); ctx.quadraticCurveTo(bx+Math.cos(an)*l*0.4,by+Math.sin(an)*l*0.4,bx+Math.sin(an)*5,by-Math.cos(an)*5); ctx.fill(); } ctx.restore(); }
    // the stone: an orange core, three seams (violet, ice-blue, silver)
    ctx.fillStyle='#3a1206'; ctx.beginPath(); ctx.ellipse(x,y,R+2,R*1.12+2,0,0,TAU); ctx.fill();
    const g=ctx.createRadialGradient(x-4,y-5,2,x,y,R*1.1); g.addColorStop(0,`rgba(255,${200+40*warm|0},${120+60*warm|0},1)`); g.addColorStop(0.55,`rgba(${220+30*warm|0},${90+60*warm|0},40,1)`); g.addColorStop(1,'rgba(110,30,14,1)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,R,R*1.12,0,0,TAU); ctx.fill();
    const seams=[[[-R*0.9,-R*0.2],[-R*0.2,-R*0.5],[R*0.3,-R*0.9]],[[-R*0.7,R*0.6],[0,R*0.1],[R*0.9,R*0.3]],[[-R*0.1,-R*1.05],[R*0.15,-R*0.2],[-R*0.25,R*0.6],[R*0.1,R*1.08]]];
    for(let i=0;i<3;i++){ const lit=HM.seam[i]||HM.blazed, c=N4S_SEAMC[i]; ctx.strokeStyle=lit?`rgba(${c},1)`:'rgba(40,20,30,.85)'; ctx.lineWidth=lit?2.6:1.6; ctx.beginPath(); seams[i].forEach((q,j)=>j?ctx.lineTo(x+q[0],y+q[1]):ctx.moveTo(x+q[0],y+q[1])); ctx.stroke(); if(lit) glowAt(x+seams[i][1][0],y+seams[i][1][1],22,c,0.45); }
    if(HM.seam[3]||HM.blazed) glowAt(x,y,30,'255,200,120',0.4);
    ctx.strokeStyle='#2a0c06'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y,R,R*1.12,0,0,TAU); ctx.stroke();
    // the meter: a ring with four marks (three seams and the core)
    if(!HM.blazed&&HM.phase!=='intro'){ const RR=50;
      ctx.lineCap='round'; ctx.strokeStyle='rgba(40,30,60,.85)'; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(x,y,RR,0,TAU); ctx.stroke();
      ctx.strokeStyle=`rgba(255,${180+60*HM.warm|0},${90+40*HM.warm|0},1)`; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x,y,RR,-Math.PI/2,-Math.PI/2+TAU*HM.meter); ctx.stroke();
      for(let i=0;i<4;i++){ const an=-Math.PI/2+TAU*N4S_MARKS[i], lit=HM.mark>i, c=N4S_SEAMC[i]; ctx.fillStyle=lit?`rgba(${c},1)`:'rgba(120,110,140,.9)'; ctx.beginPath(); ctx.arc(x+Math.cos(an)*RR,y+Math.sin(an)*RR,lit?5:3.5,0,TAU); ctx.fill(); if(lit) glowAt(x+Math.cos(an)*RR,y+Math.sin(an)*RR,14,c,0.8); } }
  }
  // the voices' lights fly into the Heart
  for(const v of HM.voices){ const k=clamp(v.t/2.2,0,1), e=smooth(k), vx=lerp(v.x,x,e), vy=lerp(v.y,y,e)-Math.sin(e*Math.PI)*30; if(k>=1) continue; glowAt(vx,vy,26,v.col,0.85); ctx.fillStyle=`rgba(${v.col},1)`; ctx.beginPath(); ctx.arc(vx,vy,4.5,0,TAU); ctx.fill(); }
  // Pip's spark
  if(HM.spark&&HM.sparkT<1&&G.pip){ const k=smooth(HM.sparkT), sx=lerp(G.pip.x,x,k), sy=lerp(G.pip.y-14,y,k)-Math.sin(k*Math.PI)*20; glowAt(sx,sy,18,'255,220,140',1); ctx.fillStyle='#fff8e0'; ctx.beginPath(); ctx.arc(sx,sy,3,0,TAU); ctx.fill(); }
  // Pip's first word
  if(HM.word&&HM.wordT<3.2&&G.pip){ const k=clamp(HM.wordT/0.35,0,1), s=0.6+0.6*k-0.15*Math.max(0,HM.wordT-0.35)/3, al=1-clamp((HM.wordT-2.4)/0.8,0,1);
    ctx.save(); ctx.translate(G.pip.x+74,G.pip.y-34-k*14); ctx.scale(s,s); ctx.globalAlpha=al; ctx.font=`900 30px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=6; ctx.strokeStyle='#3a1806'; ctx.strokeText('ASH!',0,0); ctx.fillStyle='#ffe28a'; ctx.fillText('ASH!',0,0); ctx.restore(); }
  ctx.restore();
}
function n4sDrawHeartS(){
  const HM=N4ST.heart; if(!HM) return;
  // the blaze: a sunrise from the Heart that washes the black away
  if(HM.blaze>0&&HM.blaze<1){ const k=HM.blaze, g=ctx.createRadialGradient(W/2,H*0.42,0,W/2,H*0.42,Math.max(W,H)*(0.2+k*1.2)); g.addColorStop(0,`rgba(255,248,220,${0.9*(1-k)})`); g.addColorStop(0.4,`rgba(255,200,120,${0.6*(1-k)})`); g.addColorStop(1,'rgba(255,150,80,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  if(HM.phase==='hold'&&scene==='play'){
    const big=HM.idle>5, t=HM.t, s=big?1.15+0.06*Math.sin(t*5):1;
    const band=ctx.createLinearGradient(0,H*0.64,0,H*0.8); band.addColorStop(0,'rgba(0,0,0,0)'); band.addColorStop(0.5,'rgba(40,16,4,.55)'); band.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=band; ctx.fillRect(0,H*0.64,W,H*0.16);
    ctx.save(); ctx.translate(W/2,H*0.71); ctx.scale(s,s); ctx.textAlign='center'; ctx.font=`800 ${W<600?18:24}px ${UIF}`;
    const tx=simplify(S('Hold BREATHE to keep the Heart warm!','Hold FIRE to warm the Heart!'));
    ctx.lineWidth=5; ctx.strokeStyle='rgba(30,12,4,.9)'; ctx.strokeText(tx,0,0); ctx.fillStyle=`rgba(255,${210+40*Math.sin(t*4)|0},150,1)`; ctx.fillText(tx,0,0);
    ctx.font=`600 ${W<600?12:14}px ${UIF}`; ctx.fillStyle='rgba(255,236,206,.85)'; ctx.fillText(simplify(S('(the fire button, as long as you can)','(hold the fire button)')),0,24);
    ctx.restore(); }
}

// ---------- 9. the fall and the final choice (FINALE 9). x4_foes calls n4sFall(e, finish) when the last crack breaks
// (she should stay down, alive, and stop attacking); finish() runs once, after the choice, to end its fight. A Nyxara
// beaten some other way (hp 0, G.bossDone.n_nyxara) gets the same sequence from the watcher in n4sNyxTick.
function n4sFall(e,finish){
  if(G.choices.n_end&&G.done){ if(finish) n4sTry(finish); return false; }
  if(N4ST.run){ if(finish&&!N4ST.fallFin) N4ST.fallFin=finish; return true; }
  N4ST.run=true; N4ST.fallE=e||n4sNyxE(); N4ST.fallFin=finish||null;
  n4sWhen('fall',null,()=>n4sFallPlay(),true);
  return true;
}
function n4sFallPlay(){
  const e=N4ST.fallE; if(e){ e.alpha=0; e.invuln=true; e.passive=true; e.stun=999; e.tele=null; e.dx=e.dy=0; }
  for(const q of G.enemies) if(!q.dead&&!q.boss){ q.dead=true; try{ puff(q.x,q.y); }catch(err){} }
  for(const pr of G.projectiles) if(pr.owner==='enemy') pr.dead=true;
  G.fz=[]; N4ST.cam={x:4500,y:85150,k:0.55};
  // the climax gets the screen to itself; and Ash stands where the scene can see both of them
  G.banner=null; if(Array.isArray(G.bannerQ)) G.bannerQ.length=0;
  // (and the fight's callouts: a friend's phase 4 line still waiting in the queue would float up after the ending, at home)
  n4sQuiet();
  if(player&&dist(player.x,player.y,4500,85250)>460){ player.x=4500; player.y=85440; try{ updateCam(0,true); }catch(err){} }
  const L=[...STORY.n_fall];
  // the act 5 data: its plea and its final choice (every option shows; the moth one locked with its reason; each pick
  // sets G.choices.n_end, emits n4fx:choose and plays its ending)
  const C5=n4sData('n_choice');
  if(C5&&typeof s10Lines==='function'){ L.push(...STORY.n_plea,...s10Lines(C5,{sc:'n_choice'}));
    runDialogue(L,()=>{ scene='play'; if(G.choices.n_end&&G.stage!=='n_end') n4sChoose(G.choices.n_end); n4sAfterChoice(); },{mood:'n_fall'}); return; }
  if(n4sMercy()) L.push(...STORY.n_plea); else L.push(...n4sClosedLines());
  L.push(ch('ash',S(`What will you do?`,`What will you do?`),[
    {t:S(`Light her a lantern, and let the moon go home`,`Light her a lantern. Let the moon go home.`),tone:'kind',cond:()=>n4sMercy(),fn:()=>n4sChoose('moth'),then:()=>N4S_ENDINGS.moth.lines()},
    {t:S(`End the Long Night for good`,`End the Long Night.`),tone:'brave',fn:()=>n4sChoose('dawn'),then:()=>N4S_ENDINGS.dawn.lines()},
    {t:S(`Give the Ember Heart to the moon`,`Give the Heart to the moon.`),tone:'kind',fn:()=>n4sChoose('embermoon'),then:()=>N4S_ENDINGS.embermoon.lines()}]));
  runDialogue(L,()=>{ scene='play'; n4sAfterChoice(); },{mood:'n_fall'});
}
function n4sChoose(end){
  G.choices.n_end=end; G.flags.n_nyx_done=1; G.flags.n_heart_on=0;
  if(DLG) DLG.mood={dawn:'n_end_dawn',embermoon:'n_end_ember',moth:'n_end_moth'}[end]||null;
  n4sExtra('n_end',{dawn:S('You ended the Long Night for good, and the morning came.','You ended the Long Night.'),embermoon:S('You gave the Ember Heart to the moon.','You gave the Heart to the moon.'),moth:S('You called her Nyx and lit her a lantern.','You lit Nyx a lantern.')}[end]);
  if(G.stage!=='n_end'){ G.stage='n_end'; try{ ACT_RT.last=null; }catch(e){} }
  try{ saveGame(true); }catch(e){}
}
// after the ending's lines: x4_foes ends its fight, then the dawn, the epilogue, the victory screen
function n4sAfterChoice(){
  const fin=N4ST.fallFin; N4ST.fallFin=null;
  if(fin) n4sTry(fin);
  const e=n4sNyxE(); if(e&&!e.dead&&!fin){ e.dead=true; e.hp=0; }
  if(G.boss&&G.boss.type==='n_nyxara') G.boss=null;
  G.bossDone.n_nyxara=true; G.flags.n_nyx_done=1;
  try{ if(G.bf) bossFightEnd(false); }catch(err){}
  n4sWhen('dawn',null,()=>n4sDawn(),true);
}
function n4sDawn(){
  N4ST.run=true; if(!N4ST.cut){ if(player&&curMap()===4&&!AREA&&dist(player.x,player.y,4500,85250)>460){ player.x=4500; player.y=85440; try{ updateCam(0,true); }catch(err){} } n4sCutFall(true); const C=N4ST.cut; C.nyx.alpha=0; C.nyx.mode='gone'; C.fill=C.fillTo=1; C.whole=1; if(G.choices.n_end==='embermoon') C.gold=C.goldTo=1; }
  if(typeof moonRestore==='function') moonRestore(); else G.flags.moon=100;
  if(N4ST.cut) N4ST.cut.fillTo=1;
  n4sPlay('n_dawn_lines',()=>{ N4ST.dawnTo=1; G.flags.n_dawn=1; n4sWhen('epi',null,()=>n4sEpilogue(),true); },{again:true,mood:'n_dawn'});
}
function n4sEpilogue(){
  const L=n4sBookLines()||n4sEpiLines();
  runDialogue(L,()=>{ scene='play'; G.flags.n_epi=0; n4sBookClose(); n4sVictory(); },{mood:'n_epilogue'});
}
// ---------- 10. the victory screen (FINALE 13): "Ending n of 3", the stats, Keep exploring / Title screen
function n4sVictory(){
  const end=G.choices.n_end||'dawn', E=N4S_ENDINGS[end]||N4S_ENDINGS.dawn;
  let seen={}; try{ seen=store.get('eb_n_endings',{})||{}; seen[end]=true; store.set('eb_n_endings',seen); }catch(e){}
  const k=Object.keys(seen).length;
  N4ST.run=false; N4ST.cut=null; N4ST.cam=null; G.flags.n_dawn=1; G.flags.n_done=1; G.flags.n_phase=0; G.flags.moon=100;
  if(G.stage!=='n_end') G.stage='n_end';
  N4ST.bigTo=0; N4ST.big=0; G.flags.n_big=0;
  endAct(5,{title:E.title,lines:[E.msg]});
  try{
    const F1=(typeof ENDINGS!=='undefined'&&ENDINGS[G.choices.ending||'hero'])||{title:''};
    $('#winTag').textContent=simplify(S('THE LONG NIGHT IS OVER','THE LONG NIGHT IS OVER'));
    $('#winTitle').textContent=simplify(E.title); $('#winMsg').textContent=simplify(E.msg);
    const panel=$('#winTitle').parentElement;
    let sub=$('#n4sWinSub'); if(!sub){ sub=document.createElement('div'); sub.id='n4sWinSub'; $('#winMsg').insertAdjacentElement('afterend',sub); }
    sub.hidden=false; sub.textContent=simplify(`Ending ${E.n} of 3 · Endings found: ${k} of 3 · First journey: ${F1.title||''}`);
    // (every friend who came: the earlier acts' allies and the friends won back on the peak, plus Grandpa)
    const allies=['greymane','cinder','tikka','vesper','glaciar','hush'].filter(id=>n4sAllyEarned(id)).length+(n4sEnd()==='lantern'?1:0);
    const rows=[[playClock(),S('Time','Time')],[player.level,S('Level','Level')],[Object.values(G.quests||{}).filter(q=>q&&q.done).length,S('Quests done','Quests')],
      [allies,S('Friends on the peak','Friends')],[`${n4sPanesN()}/6`,S('Moth Memories','Moth Memories')],[`${n4sDuchessN()}/5`,S('Duchess sightings','Duchess')],
      [G.found.heartEmbers|0,S('Heart Embers','Heart Embers')],[G.deaths|0,S('Times knocked down','Falls')]];
    $('#winStats').innerHTML=rows.map(([v,l])=>`<div class="stat"><b>${escapeHtml(String(v))}</b><span>${escapeHtml(simplify(l))}</span></div>`).join('');
    let x=$('#n4sWinX'); if(!x){ x=document.createElement('div'); x.id='n4sWinX'; $('#winStats').insertAdjacentElement('afterend',x); } x.hidden=false; x.textContent='Made for Toby, Gus, Linus and Rosemary.';
    let more=$('#n4sWinMore'); if(!more){ more=document.createElement('div'); more.id='n4sWinMore'; panel.appendChild(more); }
    more.hidden=k>=3; more.textContent=simplify(S('There are other ways this story can end.','There are other endings to find.'));
    const mb=$('#bWinMenu'); if(mb){ if(!mb.dataset.n4s) mb.dataset.n4s=mb.textContent; mb.textContent=simplify(S('Title screen','Title screen')); }
    if(ACT_RT.win) ACT_RT.win.explore=()=>{ n4sFreeRoam(); setBanner(S('The Long Night is over','The Long Night is over'),S('The Long Night is over. Go anywhere you like.','Go anywhere you like!'),3.6); };
  }catch(err){ console.error(err); }
  try{ saveGame(true); }catch(e){}
}
// any other act screen hides the finale's extra lines
{ const base=actScreen; actScreen=function(o){ try{ for(const id of ['n4sWinSub','n4sWinX','n4sWinMore']){ const el=$('#'+id); if(el) el.hidden=true; } const mb=$('#bWinMenu'); if(mb&&mb.dataset.n4s) mb.textContent=mb.dataset.n4s; }catch(e){} return base(o); }; }
function n4sFreeRoam(){ N4ST.cut=null; N4ST.cam=null; N4ST.ally={}; N4ST.allies=[]; G.flags.n_dawn=1; G.flags.n_epi=0; try{ if(typeof n4Sync==='function') n4Sync(); }catch(e){} }
// Duchess on the summit from the dawn on (her last sighting: Meh.)
function n4sDuchObj(){ if(!G||!(N4ST.duchShow||G.flags.n_dawn>=1||G.done)||curMap()!==4||AREA) return null; if(!(G.choices.n_end)) return null;
  const D=N4ST.duch||(N4ST.duch={x:4470,y:84900,face:Math.PI/2,t:0,kind:'goat',moving:false,id:'n_duchess_goat'}); D.t=G.time; return D; }
// at the dawn she stands up the slope from Ash and a little to the left (the mended moon hangs top right of the screen)
function n4sDuchPlace(){ const p=player, D=N4ST.duch||(N4ST.duch={face:Math.PI/2,t:0,kind:'goat',moving:false,id:'n_duchess_goat'});
  D.x=clamp(p.x-70,4250,4750); D.y=clamp(p.y-190,84800,85700); D.face=Math.atan2(p.y-D.y,p.x-D.x); D.t=G.time; return D; }
function n4sDuchessSeen(){ if(G.flags.n_duchess) return; G.flags.n_duchess=1; try{ addCoins(30,player.x,player.y); gainXp(60); }catch(e){} }
function n4sDuchTalk(){ const first=!G.flags.n_duchess; runDialogue([xl('goat',`Meh.`,`Meh.`),...(first?[xl('ash',`How did you even get up here? There's a MOAT.`,`How did you get up here?`),xl('goat',`Meh.`,`Meh.`)]:[])],()=>{ scene='play'; n4sDuchessSeen(); saveGame(); }); }
// ---------- the cutscene on the summit: Nyxara fallen, the moon filling, and what each ending does (world and sky)
function n4sCutFall(quiet){
  const e=N4ST.fallE||n4sNyxE(), x=e?e.x:4500, y=e?e.y:85150;
  N4ST.cut={t:0,nyx:{x,y:Math.min(y,85250),s:1,sTo:1,alpha:1,mode:'fall',sliver:0,fly:0},fill:0,fillTo:0.15,fx:[],moths:[],beam:quiet?0:1,heart:null,lantern:null,gold:0,goldTo:0,whole:0,dawnK:0};
}
function n4sCutDo(k){
  const C=N4ST.cut||(n4sCutFall(true),N4ST.cut), n=C.nyx, p=player;
  if(k==='breath'){ C.breath=1.6; }
  else if(k==='moths'){ n.mode='moths'; for(let i=0;i<90;i++) C.moths.push({x:n.x+rand(-120,120)*n.s,y:n.y+rand(-70,40)*n.s,vx:rand(-60,60),vy:rand(-160,-60),t:rand(0,0.6),ph:rand(0,TAU),s:rand(0.4,0.8)}); }
  else if(k==='stitch'){ C.stitch=1; C.fillTo=0.85; }
  else if(k==='mended'){ C.fillTo=1; C.whole=1; if(typeof moonRestore==='function') moonRestore(); }
  else if(k==='sunrise'){ N4ST.dawnTo=0.35; }
  else if(k==='hold'){ C.heart={x:p.x,y:p.y-70,vy:0,up:0}; }
  else if(k==='throw'){ if(!C.heart) C.heart={x:p.x,y:p.y-70,vy:0,up:0}; C.heart.up=1; n4sSfx('cast'); }
  else if(k==='catch'){ C.gold=0; C.goldTo=1; C.fillTo=1; C.whole=1; if(typeof moonRestore==='function') moonRestore(); if(C.heart) C.heart.gone=1; }
  else if(k==='curl'){ n.mode='fly'; }
  else if(k==='lantern'){ C.lantern={x:p.x+34,y:p.y-6,lit:1,t:0}; }
  else if(k==='click'){ n.sliver=0; C.sliver={x:n.x,y:n.y-20,t:0}; }
  else if(k==='whole'){ C.fillTo=1; C.whole=1; flashA=Math.max(flashA,0.5); flashCol='240,244,255'; if(typeof moonRestore==='function') moonRestore(); }
  else if(k==='small'){ n.sTo=0.06; n.mode='small'; }
}
let N4S_NYXCV=null;
function n4sNyxCv(){ if(N4S_NYXCV) return N4S_NYXCV; const c=mkCanvas(240,240), g=c.getContext('2d'); g.translate(120,130);
  try{ thrFaceMoth(g,{wing:'#8a7aaa',wing2:'#5c4c7c',eye:'#ece6ff',iris:'#8a62d8',fur:'#b8aad8',fur2:'#e2daf4',eyes:'#241640',ant:'#d8ccf0',smile:false}); }catch(e){ g.fillStyle='#8a7aaa'; g.beginPath(); g.ellipse(0,0,100,50,0,0,TAU); g.fill(); }
  N4S_NYXCV=c; return c; }
function n4sDrawCutW(){
  const C=N4ST.cut; if(!C) return; const n=C.nyx, t=C.t;
  // the silver river of light from her wings up into the moon (it fades as the moon fills)
  if(C.beam>0&&n.mode==='fall'){ const a=C.beam*(1-C.fill*0.6); ctx.save(); ctx.globalCompositeOperation='lighter'; for(let i=0;i<5;i++){ const ox=Math.sin(t*2+i)*14; ctx.strokeStyle=`rgba(220,228,255,${0.12*a})`; ctx.lineWidth=18-i*3; ctx.beginPath(); ctx.moveTo(n.x+ox,n.y-40); ctx.lineTo(n.x+ox*3,cam.y-200); ctx.stroke(); } ctx.restore(); }
  if(n.mode!=='moths'&&n.alpha>0.01){
    const s=n.s, cv=n4sNyxCv(), y=n.y-(n.fly||0), wob=Math.sin(t*1.3)*0.04;
    ctx.save(); ctx.globalAlpha=n.alpha; ctx.fillStyle='rgba(10,6,20,.3)'; ctx.beginPath(); ctx.ellipse(n.x,n.y+30*s,120*s,30*s,0,0,TAU); ctx.fill();
    if(n.mode==='small'&&s<0.2&&typeof thrMoth==='function'){ const L=C.lantern, mx=L?L.x:n.x, my=L?L.y-26:y; thrMoth(ctx,mx,my,0.9,t*3,'#8a7aaa','#ece6ff'); }
    else { ctx.translate(n.x,y); ctx.scale(1.5*s,(1.5+wob)*s); ctx.drawImage(cv,-120,-130); }
    ctx.restore();
    if(n.sliver){ const sx=n.x+10*s, sy=y+40*s; glowAt(sx,sy,40*s+10,'230,236,255',0.6); ctx.fillStyle='#eef2ff'; ctx.beginPath(); ctx.arc(sx,sy,14*s+4,0.3,TAU-0.3); ctx.arc(sx+6*s,sy,12*s+3,TAU-0.3,0.3,true); ctx.fill(); }
  }
  // Heartfire, the dawn ending's great breath
  if(C.breath>0&&Math.random()<0.9){ const p=player, a=angTo(p.x,p.y,n.x,n.y); for(let i=0;i<3;i++) emit(p.x+Math.cos(a)*20,p.y+Math.sin(a)*20-10,1,{col:Math.random()<0.5?'255,214,120':'230,236,255',ang:a,spread:0.25,smin:320,smax:480,lmin:.4,lmax:.7,zmin:2.5,zmax:5,drag:0.5}); }
  // the paper lantern (the Moth and the Moon)
  if(C.lantern){ const L=C.lantern; glowAt(L.x,L.y-10,60,'255,190,110',0.7); ctx.fillStyle='#f4dca8'; ctx.strokeStyle='#5a3a1a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(L.x,L.y-10,10,13,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='rgba(255,170,80,.7)'; ctx.beginPath(); ctx.ellipse(L.x,L.y-8,5,7,0,0,TAU); ctx.fill(); }
  // the Ember Heart thrown up into the moon
  if(C.heart&&!C.heart.gone){ const H0=C.heart; glowAt(H0.x,H0.y,50,'255,190,110',0.8); ctx.fillStyle='#ffb050'; ctx.beginPath(); ctx.ellipse(H0.x,H0.y,11,12,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(220,200,255,.9)'; ctx.lineWidth=1.6; ctx.stroke(); }
}
// the sky part: x4_world draws the broken moon over the peak; while the moon fills, a whole one shows through it
function n4sMoonSpot(){ const p=player, r=Math.hypot(p.x-4500,p.y-85200), k=1-clamp((r-700)/3400,0,1), R=Math.min(W,H)*lerp(0.13,0.22,k); return {x:W*(W<600?0.5:0.66)-(p.x-4500)*0.01*zoom,y:W<600?H*0.27:84+R*0.72,R}; }
function n4sDrawCutS(){
  const C=N4ST.cut; if(!C) return; const M=n4sMoonSpot(), dn=clamp(+G.flags.n_dawn||0,0,1);
  if(C.fill>0.01&&dn<1){ const r=Math.round(M.R*0.62/4)*4||40; const a=C.fill*(1-dn);
    const gl=ctx.createRadialGradient(M.x,M.y,r*0.5,M.x,M.y,r*2.2); gl.addColorStop(0,`rgba(${C.gold>0.3?'255,200,120':'220,228,255'},${0.35*a})`); gl.addColorStop(1,'rgba(220,228,255,0)'); ctx.fillStyle=gl; ctx.fillRect(M.x-r*2.2,M.y-r*2.2,r*4.4,r*4.4);
    try{ if(typeof drawMoon==='function'&&C.whole) drawMoon(ctx,M.x,M.y,r,{bites:0,look:moonLook(),alpha:a}); else { ctx.save(); ctx.beginPath(); ctx.arc(M.x,M.y,r,0,TAU); ctx.clip(); const top=M.y+r-2*r*C.fill, wv=Math.sin(C.t*2)*r*0.04; ctx.fillStyle=`rgba(236,240,255,${0.9*(1-dn)})`; ctx.beginPath(); ctx.moveTo(M.x-r,top+wv); ctx.quadraticCurveTo(M.x,top-wv*2,M.x+r,top+wv); ctx.lineTo(M.x+r,M.y+r); ctx.lineTo(M.x-r,M.y+r); ctx.closePath(); ctx.fill(); ctx.restore(); } }catch(e){}
    if(C.gold>0.01){ const g2=ctx.createRadialGradient(M.x,M.y,0,M.x,M.y,r*1.05); g2.addColorStop(0,`rgba(255,214,140,${0.85*C.gold*(1-dn*0.5)})`); g2.addColorStop(1,`rgba(255,150,70,${0.5*C.gold*(1-dn*0.5)})`); ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(M.x,M.y,r*1.02,0,TAU); ctx.fill(); }
  }
  // the thousand silver moths fly up and stitch the moon
  if(C.moths.length){ const sc=zoom||1; for(const m of C.moths){ const sx=(m.x-cam.x)*sc, sy=(m.y-cam.y)*sc; if(typeof thrMoth==='function') thrMoth(ctx,sx,sy,m.s,C.t*10+m.ph,'rgba(232,236,255,.95)',null); } }
  // the Heart flying up (screen space once it leaves the world)
  if(C.heart&&C.heart.up&&!C.heart.gone){ const H0=C.heart, sx=(H0.x-cam.x)*(zoom||1), sy=(H0.y-cam.y)*(zoom||1); if(sy<M.y+20){ H0.gone=1; } }
  // the last sliver of moon floats up and clicks into place
  if(C.sliver&&C.sliver.t<2.2){ const k=smooth(clamp(C.sliver.t/2,0,1)), sx0=(C.sliver.x-cam.x)*(zoom||1), sy0=(C.sliver.y-cam.y)*(zoom||1), sx=lerp(sx0,M.x,k), sy=lerp(sy0,M.y,k);
    glowAt(sx,sy,26,'235,240,255',0.9); ctx.fillStyle='#f4f6ff'; ctx.beginPath(); ctx.arc(sx,sy,8,0.3,TAU-0.3); ctx.fill(); }
}
function n4sCutTick(dt){
  const C=N4ST.cut; if(!C) return; C.t+=dt; const n=C.nyx;
  C.fill+=(C.fillTo-C.fill)*(1-Math.exp(-dt*0.9)); C.gold+=(C.goldTo-C.gold)*(1-Math.exp(-dt*0.8));
  n.s+=(n.sTo-n.s)*(1-Math.exp(-dt*(n.mode==='small'?1.2:0.5)));
  if(C.breath>0) C.breath-=dt;
  if(n.mode==='moths'){ n.alpha=Math.max(0,n.alpha-dt*1.2); }
  if(n.mode==='fly'){ n.fly=(n.fly||0)+dt*160; n.alpha=Math.max(0,n.alpha-dt*0.35); n.sTo=0.4; }
  for(const m of C.moths){ m.t+=dt; if(m.t<0) continue; m.vy-=dt*40; m.x+=m.vx*dt+Math.sin(C.t*3+m.ph)*20*dt; m.y+=m.vy*dt; }
  if(C.moths.length&&C.moths[0].y<cam.y-400) C.moths.length=0;
  if(C.heart&&C.heart.up&&!C.heart.gone){ C.heart.vy-=dt*900; C.heart.y+=C.heart.vy*dt; if(C.heart.y<cam.y-200) C.heart.gone=1; }
  if(C.lantern) C.lantern.t+=dt;
  if(C.sliver) C.sliver.t+=dt;
}

// ---------- 11. the summit fight's story side, the end, free roam
function n4sNyxTick(dt){
  n4sStandNyxTick(dt);
  const e=n4sNyxE();
  // (x4_foes should call n4sHeart at 20 percent; if a real Nyxara waits there long without it, the Heart comes anyway)
  if(e&&!N4ST.stand.nyx&&!G.flags.n_heart_done&&!N4ST.heart){ const f=e.hp/Math.max(1,e.maxHp); if(f<=0.2&&!e.nPhase||e.nPhase===4&&!G.flags.n_heart_done){ N4ST.hwT=(N4ST.hwT||0)+dt; if(N4ST.hwT>6&&n4sCalm(true)) n4sHeart(()=>{}); } else N4ST.hwT=0; }
  // her fall by any route: the sequence plays once
  if(n4sNyxDone()&&!G.choices.n_end&&!N4ST.run) n4sFall(null,null);
  // the friends' Ember ('hero'): a little ember spirit orbits Ash in phase 4 and shoots at her cracks
  if(N4ST.emberSpirit&&e&&G.flags.n_heart_done){ N4ST.emT=(N4ST.emT||0)-dt; if(N4ST.emT<=0){ N4ST.emT=3; n4sHitBoss(0.01,'255,190,120'); } }
}
function n4sEndTick(dt){}
// resume after a reload in the middle of the end (the choice is saved; the rest plays again from the dawn)
function n4sResume(){
  const C=G.choices;
  if(actOf(G.stage)===5&&C.n_end&&!G.done&&!N4ST.run){ N4ST.run=true; N4ST.resume=false;
    n4sWhen('resume',null,()=>{ if((+G.flags.n_dawn||0)>=1) n4sEpilogue(); else n4sDawn(); }); }
}
// the main tick (every play frame, outdoors and inside areas)
function n4sTick(dt){
  if(!G||G.mode!=='story') return;
  n4sQueue();
  if(N4ST.heart) n4sHeartTick(dt);
  if(actOf(G.stage)!==5) return;
  if(N4ST.resume) n4sResume();
  if(N4ST.doorFx) N4ST.doorFx.t+=dt;
  if(G.done&&G.choices.n_end&&curMap()===4){ N4ST.duchShow=1; }
  if(!G.done&&!AREA&&curMap()===4) n4sCheckpoint();
}
// (I5) the peak's shrines are its checkpoints: "Rise again" wakes Ash at the last one he walked past. Before, he woke
// where he last rested or travelled, often Emberhollow or Moonfall (run B fell in the Tendril Wood and woke on the
// village green, a whole act away)
function n4sCheckpoint(){
  const p=player; if(!p||p.dead||!G.shrines) return;
  for(const s of SHRINES){ if(!/^n_sh_/.test(s.id)||!G.shrines[s.id]||G.lastShrine===s.id) continue;
    if(dist2(p.x,p.y,s.x,s.y)<200*200){ G.lastShrine=s.id; break; } }
}
// animations that also run under dialogue: the Heart's dark, the dawn, the cutscene, Ash's size
function n4sAnim(dt){
  if(!G||G.mode!=='story') return;
  const HM=N4ST.heart;
  if(HM){ HM.t+=dt; HM.dark+=(HM.darkTo-HM.dark)*(1-Math.exp(-dt*(HM.darkTo>HM.dark?1.4:0.9)));
    if(HM.float) HM.fl=Math.min(1,HM.fl+dt*0.6); for(const v of HM.voices) v.t+=dt;
    if(HM.word) HM.wordT+=dt; if(HM.spark) HM.sparkT=Math.min(1,HM.sparkT+dt*0.8);
    if(HM.blaze>0) HM.blaze=Math.min(1,HM.blaze+dt*0.55);
    if(HM.phase==='after'){ HM.end+=dt; if(HM.end>2.6&&HM.dark<0.02) N4ST.heart=null; } }
  if(N4ST.bigTo!=null){ N4ST.big+=(N4ST.bigTo-N4ST.big)*(1-Math.exp(-dt*2.2)); if(Math.abs(N4ST.big-N4ST.bigTo)<0.002) N4ST.big=N4ST.bigTo; }
  if(N4ST.dawnTo!=null){ const v=+G.flags.n_dawn||0; if(v<N4ST.dawnTo){ G.flags.n_dawn=Math.min(N4ST.dawnTo,v+dt*0.22); } }
  if(N4ST.cut) n4sCutTick(dt);
}
{ const base=simUpdate; simUpdate=function(dt){ base(dt); try{ n4sTick(dt); n4sAnim(dt); }catch(e){ console.error(e); } }; }
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt); try{ n4sAnim(dt); n4sAllyLite(dt); }catch(e){ console.error(e); } }; }
// the camera leans toward a scene (N4ST.cam = {x,y,k}) while it plays
{ const base=updateCam; updateCam=function(dt,snap){
  const C=N4ST.cam; if(!C||AREA||!player||!G||G.mode!=='story') return base(dt,snap);
  if(scene!=='dialogue'){ N4ST.cam=null; return base(dt,snap); }
  const px=player.x, py=player.y; player.x=px+(C.x-px)*C.k; player.y=py+(C.y-py)*C.k; try{ base(dt,snap); }finally{ player.x=px; player.y=py; } }; }
// drawing: the cutscene, the door and the ember in the world; the moon filling and the Heart's dark over the sky
{ const base=drawTexts; drawTexts=function(){ base(); try{ if(G&&G.mode==='story'&&curMap()===4&&!AREA){ N4ST.wT=ctx.getTransform(); n4sDrawCutW(); n4sDrawWorldFx(); } }catch(e){ if(!N4ST.errW){ N4ST.errW=1; console.error('n4s world',e); } } }; }
{ const base=drawHUD; drawHUD=function(){
  try{ if(G&&G.mode==='story'&&curMap()===4&&!AREA){ if(N4ST.cut) n4sDrawCutS(); if(N4ST.heart&&N4ST.wT){ const HM=N4ST.heart; ctx.save(); if(HM.dark>0.01){ ctx.fillStyle=`rgba(0,0,0,${HM.dark})`; ctx.fillRect(0,0,W,H); } ctx.setTransform(N4ST.wT); n4sDrawHeartW(); ctx.restore(); } } }catch(e){ if(!N4ST.errS){ N4ST.errS=1; console.error('n4s sky',e); } }
  base();
  try{ if(N4ST.heart) n4sDrawHeartS(); }catch(e){ if(!N4ST.errH){ N4ST.errH=1; console.error('n4s heart',e); } } }; }
function n4sDrawWorldFx(){
  const t=G.time, p=player;
  // the Moon Door sighs open
  if(N4ST.doorFx&&N4ST.doorFx.t<3){ const k=N4ST.doorFx.t/3; glowAt(4500,85900,80+160*k,'226,232,255',0.6*(1-k)); }
  // Heartfire: Ash glows gold and silver in phase 4
  if(G.flags.n_heart_done&&n4sNyxFight()){ glowAt(p.x,p.y-18,60,'255,214,140',0.25+0.08*Math.sin(t*5)); glowAt(p.x,p.y-18,34,'230,236,255',0.2); }
  // Ember's spirit ('hero') orbits Ash like a second Pip
  if(N4ST.emberSpirit&&n4sNyxFight()){ const a=t*2.2, x=p.x+Math.cos(a)*54, y=p.y-34+Math.sin(a)*20; glowAt(x,y,26,'255,170,90',0.8); ctx.fillStyle='#fff0c8'; ctx.beginPath(); ctx.arc(x,y,4,0,TAU); ctx.fill(); }
  // the warden lights in phase 4: one blocks each hit
  if(N4ST.wardLights>0&&n4sNyxFight()){ for(let i=0;i<N4ST.wardLights;i++){ const a=t*1.3+i/5*TAU; glowAt(p.x+Math.cos(a)*44,p.y-20+Math.sin(a)*18,16,'255,214,150',0.7); } }
  // Tikka's bun in the air
  const B=N4ST.bun; if(B){ B.t+=1/60; const k=clamp(B.t/0.7,0,1), x=lerp(B.x,p.x,k), y=lerp(B.y,p.y,k)-Math.sin(k*Math.PI)*60; if(k<1){ ctx.fillStyle='#c88a48'; ctx.beginPath(); ctx.ellipse(x,y-20,7,5,0,0,TAU); ctx.fill(); } else N4ST.bun=null; }
}
// Duchess on the summit (after the dawn) and the friends in the world list
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{ const D=n4sDuchObj(); if(D&&inView(D.x,D.y,60)) list.push(D); }catch(e){} }; }
// the New Dragon ('heir') grows huge for phase 4 (and shrinks back at the dawn)
{ const base=drawPlayer; drawPlayer=function(){ if(N4ST.big>0.01&&G&&G.mode==='story'&&curMap()===4){ const s=1+0.5*N4ST.big, p=player; ctx.save(); ctx.translate(p.x,p.y); ctx.scale(s,s); ctx.translate(-p.x,-p.y); try{ base(); }finally{ ctx.restore(); } return; } return base(); }; }
// ---------- 12. the one entry point for x4_ascent and x4_foes (N4STORY.md): n4sBeat(name, ...args), true when it acted
function n4sBeat(name,a,b){
  try{
    if(name==='ascent'){ N4ST.has.asc=true; return true; }
    if(name==='say') return n4sSay(a);
    if(name==='flame'){ if(a){ G.found['n_flame_'+a]=true; G.flags.n_flames=n4sFlames(); } const k='n_flame_'+a; if(N4S_SC[k]) n4sWhen(k,null,()=>n4sPlay(k,()=>{ if(n4sFlames()>=3) n4sWhen('n_trials_done',null,()=>n4sPlay('n_trials_done',()=>questUpdated())); })); return true; }
    if(name==='pane') return n4sPane(a,b);
    if(name==='door'||name==='moondoor'||name==='n_moondoor') return n4sMoonDoor(a);
    if(name==='heart') return n4sHeart(a);
    if(name==='fall') return n4sFall(a,b);
    if(name==='phase') return n4sPhaseStart(a,b);
    if(name==='taunt') return n4sTaunt(a);
    if(name==='ally') return n4sAllyBeat(a);
    if(name==='helmet') return n4sPlay('n_helmet',null,{again:true});
    if(name==='gate'){ G.flags.n_gate=1; return true; }
    if(N4S_SC[name]){ if(n4sSeen(name)&&!N4S_SC[name].again) return false; n4sWhen(name,null,()=>n4sPlay(name,a),!!b); return true; }
    if(N4S_BUB[name]) return n4sSay(name);
  }catch(e){ console.error('n4sBeat',name,e); }
  return false;
}
// ---------- 12b. the act 5 data's visual beats: a data scene says `emit n4fx:<name>[:<arg>]` where this file's own
// lines ran code (n4sDo): the Heart's dark and its voices' lights, the fall's cutscene, the gathering, the door, the dawn,
// Duchess on the top, the storybook's plates, and the way home after the victory screen
const N4S_VCOL={c_vesper:'180,140,255',juniper:'180,140,255',f_glaciar:'150,210,255',elka:'150,210,255',tove:'150,210,255',f_hush:'236,232,255',quill:'226,232,255',
  maren:'255,170,90',ev_tikka:'255,200,120',grandpa:'255,140,70',iska:'255,214,150',vor:'255,120,60',ash:'255,150,60',ember:'255,190,120'};
function n4sFx(s){
  const i=s.indexOf(':'), k=i<0?s:s.slice(0,i), a=i<0?'':s.slice(i+1), HM=N4ST.heart, C=N4ST.cut;
  switch(k){
    case 'heart_dark': if(HM) HM.darkTo=1; break;
    case 'heart_puff': if(HM) HM.puff=1.2; break;
    case 'heart_float': if(HM) HM.float=1; break;
    case 'voice': n4sVoice(a,N4S_VCOL[a]||N4S_SEAMC[HM?Math.min(3,HM.mark):0]); break;
    case 'heart_grandpa': if(HM) HM.grandpa=1; break;
    case 'heart_wardens': if(HM) HM.wardens=1; break;
    case 'heart_belly': if(HM) HM.belly=1; break;
    case 'heart_pip': if(HM) HM.pip=1; break;
    case 'heart_word': if(HM) HM.word=1; n4sSfx('levelup'); try{ shake(6); }catch(e){} break;
    case 'heart_spark': if(HM) HM.spark=1; break;
    case 'heart_blaze': n4sHeartBlaze(); break;
    case 'cut_fall': n4sCutFall(); break;
    case 'cut_fill': if(C) C.fillTo=+a||0; break;
    case 'cut_shrink': if(C&&C.nyx) C.nyx.sTo=+a||0; break;
    case 'cut_sliver': if(C&&C.nyx) C.nyx.sliver=1; break;
    case 'cut': n4sCutDo(a); break;
    case 'choose': if(G.choices.n_end) n4sChoose(G.choices.n_end); break;
    case 'ally_leave': n4sAllyLeave(a); break;
    case 'ally_arrive': n4sAllyArrive(a); break;
    case 'gather_pose': if(a==='off') n4sGatherPose(false); else { N4ST.cam={x:3331,y:85860,k:0.55}; n4sGatherPose(true); } break;
    case 'door_fx': N4ST.doorFx={t:0}; break;
    case 'dawn': N4ST.dawnTo=1; N4ST.cam={x:4500,y:85100,k:0.5}; break;
    case 'duchess_show': { N4ST.duchShow=1; const D=n4sDuchPlace(); N4ST.cam={x:D.x,y:D.y,k:0.5}; break; }
    case 'duchess_seen': n4sDuchessSeen(); break;
    case 'home_bound': N4ST.homeBound=1; break;
    case 'big_off': N4ST.bigTo=0; break;
    case 'book_open': if(!N4ST.book) n4sBookOpen(); G.flags.n_epi=1; break;
    case 'book': if(!N4ST.book) n4sBookOpen(); n4sBookScene(a); break;
    case 'book_lit': if(N4ST.book) N4ST.book.lit=1; break;
    case 'home': n4sGoHome(); break;
    default: console.error('n4fx: unknown beat',s);
  }
}
if(typeof storyListen==='function') storyListen('n4fx:',a=>n4sFx(a));
// after the victory screen's "Keep exploring": Ash wakes up on the green in Emberhollow on Lantern Day, at dusk (the
// data's n_end then plays n_home there). Duchess is back at the farm.
function n4sQuiet(){ G.taunt=null; if(Array.isArray(G.tauntQ)) G.tauntQ.length=0; try{ if(typeof MV!=='undefined'&&MV) MV.tip=null; }catch(e){} }
function n4sGoHome(){
  n4sFreeRoam(); N4ST.homeBound=1; n4sQuiet();
  const w=typeof s10Where==='function'?s10Where('n5_green_wake'):null, x=w?w.x:2620, y=w?w.y:9330;
  G.tod=0.78; G.flags.moon=100;
  mapTravel(x,y,{});
  try{ placeGoat(); setupNPCs(); }catch(e){ console.error(e); }
}
// ---------- 13. Pebble's notes on the peak (THREADS 9.3: Yara's "where now", one per ring, at a rest)
if(typeof pebbleLetter==='function'){
  for(const st of ['n_stair','n_clocks','n_rime','n_glass','n_crown']) pebbleLetter('n_pb_'+st.slice(2),{from:'yara',when:()=>G.stage===st&&curMap()===4,lines:()=>{ const h=N4S_HINTS[st]; return [['yara',S(`(Yara's note, in very small writing) ${h}`,`(Yara's note) ${n4sSimpleOf(h)}`)]]; }});
}
// ---------- 14. saves: the transient state resets; a reload in the middle of the end goes on from the dawn
function n4sReset(){
  Object.assign(N4ST,{q:[],rep:{},cam:null,heart:null,cut:null,end:null,arr:null,allies:[],ally:{},wasF:{},big:0,bigTo:null,duch:null,run:false,fallFin:null,fallE:null,
    phaseSeen:{},homeBound:0,gone:{},gal:0,gateQ:false,nextQ:false,gatherQ:false,doorQ:false,doorFx:null,dawnTo:null,duchShow:0,wardLights:0,emberSpirit:0,glaCalm:0,bun:null,hwT:0,resume:false,gatherPose:false,sparkFor:null});
  N4ST.heartLock=false; n4sBookClose(true);
}
{ const base=newRun; newRun=function(mode){ base(mode); try{ n4sReset(); }catch(e){} }; }
{ const base=loadGame; loadGame=function(s){ base(s); try{ n4sReset(); n4sLoaded(); }catch(e){ console.error(e); } }; }
function n4sLoaded(){
  const F=G.flags; if(actOf(G.stage)!==5) return;
  F.n_heart_on=0; F.n_epi=0;
  if(F.n_heart_done&&n4sEnd()==='heir'&&!G.choices.n_end){ N4ST.big=1; N4ST.bigTo=1; }
  if(G.choices.n_end&&!G.done){ N4ST.resume=true; if((+F.n_dawn||0)>0) N4ST.dawnTo=1; }
  if(G.done&&G.choices.n_end){ F.n_dawn=1; N4ST.duchShow=1; }
}
// a test save at a later finale stage gets the beats its stage implies (the scenes before it are marked as seen)
const N4S_PAST={
  n_stair:{flags:{n_depart:1,n_lanterns:3,n_gate:1},seen:['n_depart','n_arrive','n_green','n_gate_open','b_lanterns']},
  n_clocks:{flags:{n_sluice:1,n_bridge1:1,n_terrace:1,n_flames:3},found:['n_flame_leap','n_flame_tide','n_flame_sky'],boss:'n_echo_vor',seen:['n_trials','n_flame_leap','n_flame_tide','n_flame_sky','n_trials_done']},
  n_rime:{flags:{n_chimney:1,n_clockset:1,n_gallery:1,n_gear:1},boss:'n_echo_vesper',seen:['n_grey_bye','n_clocks_in','n_vesper_join','n_vesper_absent']},
  n_glass:{flags:{n_longclimb:1,n_floe:1,n_dam:1,n_sail:1,n_aurora:1},boss:'n_echo_glaciar',seen:['n_vesper_bye','n_rime_in','n_glaciar_join','n_glaciar_absent']},
  n_crown:{flags:{n_gust:1,n_lagoon:1,n_beam:1,n_wood:1},boss:'n_echo_hush',seen:['n_glaciar_bye','n_glass_in','n_hush_join','n_hush_absent']},
  n_nyxara:{flags:{n_gather:1,n_road:4,n_door:1},seen:['n_gather','n_moondoor']}};
function n4sMigrate(){
  if(actOf(G.stage)!==5) return; const F=G.flags;
  for(const st of ['n_stair','n_clocks','n_rime','n_glass','n_crown','n_nyxara']){ if(!reached(st)) break; const P=N4S_PAST[st];
    Object.assign(F,P.flags); for(const k of P.found||[]) G.found[k]=true; for(const k of P.seen) n4sMark(k);
    if(P.boss){ G.bossDone[P.boss]=true; const k=N4S_ECHO.findIndex(E=>E&&E.type===P.boss); if(k>0) F['n_echo'+k+'_done']=1; } }
  if(reached('n_stair')&&!(G.items.n_map>0)) G.items.n_map=1;
  if(reached('n_nyxara')){ G.lastShrine='n_sh_crown'; G.shrines.n_sh_crown=true; }
  for(const s of ['n_sh_foot','n_sh_clock','n_sh_rime','n_sh_glass','n_sh_crown']){ const need={n_sh_foot:'n_bridge',n_sh_clock:'n_rime',n_sh_rime:'n_glass',n_sh_glass:'n_crown',n_sh_crown:'n_nyxara'}[s]; if(reached(need)&&need!=='n_bridge') G.shrines[s]=true; }
}
{ const X=window.__ebX, base=X&&X.actStart; if(typeof base==='function') X.actStart=function(n,w){ const r=base(n,w); try{ if((n|0)===5&&G.mode==='story'){ n4sReset(); n4sMigrate(); if(typeof bitesOf==='function') G.flags.moon_hud=bitesOf(); setupNPCs(); saveGame(true); } }catch(e){ console.error(e); } return r; }; }
// ---------- 15. debug hooks: window.__eb.n4s (tests: scratchpad/e_n4s/t_n4s.py), and the bible's names (FINALE 17)
const N4S_GO={bridge:['n_bridge',null],foot:['n_bridge',[4500,90300]],stair:['n_stair',[4500,88980]],clocks:['n_clocks',[3296,82910]],rime:['n_rime',[6443,84363]],
  glass:['n_glass',[5043,86329]],crown:['n_crown',[3371,85925]],summit:['n_nyxara',[4500,85860]]};
function n4sGo(part){
  const G0=N4S_GO[part]||N4S_GO.bridge, X=window.__ebX;
  X.actStart(5,G0[0]);
  if(G0[1]){ G.flags.n_depart=1; n4sMark('n_depart'); if(part!=='foot'){ n4sMark('n_arrive'); n4sMark('n_green'); n4sMark('b_arr1'); n4sMark('b_arr2'); n4sMark('b_arr3'); } try{ mapTravel(G0[1][0],G0[1][1],{noSave:true}); }catch(e){ player.x=G0[1][0]; player.y=G0[1][1]; }
    G.fade=0; setupNPCs(); saveGame(true); }
  return {stage:G.stage,x:Math.round(player.x),y:Math.round(player.y),map:curMap()};
}
function n4sWinEcho(k){ const E=N4S_ECHO[k]; if(!E) return false; G.bossDone[E.type]=true; G.flags['n_echo'+k+'_done']=1; return true; }
const N4S_DBG={N4ST,N4S_SC,N4S_ECHO,N4S_STAND,N4S_PANE,N4S_ENDINGS,play:n4sPlay,seen:n4sSeen,mark:n4sMark,beat:n4sBeat,say:n4sSay,go:n4sGo,migrate:n4sMigrate,
  lines:k=>{ const L=k==='epilogue'?n4sEpiLines():k==='closed'?n4sClosedLines():/^seam/.test(k)?n4sSeamLines(+k.slice(4)):(N4S_ENDINGS[k]?N4S_ENDINGS[k].lines():STORY[k]); return (L||[]).filter(l=>Array.isArray(l)||(l&&l.text)).map(l=>{ const P=Array.isArray(l)?{who:l[0],text:l[1]}:l; return [typeof P.who==='function'?P.who():P.who,typeof P.text==='function'?P.text():P.text]; }).filter(l=>l[1]); },
  dlg:()=>{ if(!DLG) return null; const L=lineParts(DLG.lines[DLG.i]); return {who:typeof L.who==='function'?L.who():L.who,text:DLG.text,i:DLG.i,n:DLG.lines.length,mood:DLG.mood||null,opts:DLG.opts?DLG.opts.map(o=>simplify(typeof o.t==='function'?o.t():o.t)):null}; },
  choose:i=>{ if(!DLG||!DLG.opts) return false; DLG.chars=1e9; DLG.fullAt=performance.now()-2000; DLG.optsAt=performance.now()-2000; dlgChoose(i); return true; },
  next:()=>{ if(!DLG) return false; if(DLG.opts) return false; advanceDialogue(); return true; },
  prompt:()=>G.prompt?{text:G.prompt.text,x:Math.round(G.prompt.x||0),y:Math.round(G.prompt.y||0)}:null,
  use:()=>{ if(G.prompt){ const p=G.prompt; G.prompt=null; p.act(); return true; } return false; },
  solve:id=>{ const s=N4S_STAND.find(q=>q.id===id); if(s){ s.do&&s.do(); try{ n4Sync(); }catch(e){} return true; } G.flags[id]=G.flags[id]||1; return true; },
  stand:id=>{ const s=N4S_STAND.find(q=>q.id===id); if(!s) return false; if(s.door) n4sMoonDoor(); else n4sStandGo(s); return true; },
  echo:k=>{ const E=N4S_ECHO[k]; if(!E) return false; const P=POI[E.site]; if(!P) return false; mapTravel(E.x,E.y+E.r*0.55,{noSave:true}); G.fade=0; return E.site; },
  win:k=>n4sWinEcho(k),
  nyx:()=>{ const e=n4sNyxE(); return e?{hp:Math.round(e.hp),max:Math.round(e.maxHp),f:+(e.hp/e.maxHp).toFixed(3),phase:n4sPhase(),invuln:!!e.invuln,x:Math.round(e.x),y:Math.round(e.y)}:null; },
  hurtNyx:f=>{ const e=n4sNyxE(); if(!e) return false; e.hp=Math.max(1,e.maxHp*f); return true; },
  heart:()=>n4sHeart(()=>{}), heartState:()=>{ const HM=N4ST.heart; return HM?{phase:HM.phase,meter:+HM.meter.toFixed(3),mark:HM.mark,dark:+HM.dark.toFixed(2),seam:HM.seam.slice(),blazed:HM.blazed,voices:HM.voices.length}:null; },
  heartFill:v=>{ const HM=N4ST.heart; if(!HM) return false; HM.meter=clamp(+v,0,1); return true; },
  fall:()=>n4sFall(null,null), choice:e=>{ if(!N4ST.run) n4sFall(null,null); return e; },
  allies:o=>{ o=o||{}; const C=G.choices, F=G.flags; if('greymane' in o) C.greymane=o.greymane; if('cinder' in o) C.cinder=o.cinder; if('vesper' in o) C.c_vesper=o.vesper; if('glaciar' in o) C.f_glaciar=o.glaciar; if('hush' in o) C.m_hush=o.hush; if('tikka' in o) F.tk_come=o.tikka; if('ending' in o) C.ending=o.ending; if('knows' in o){ F.n_knows=o.knows?1:0; if(!o.knows){ delete F.dr_seen_m_moth; delete F.f_page11; delete F.m_page11; delete G.found.n_pane_3; delete F.n_pane_3; } } return {allies:typeof nAllies==='function'?nAllies():[],freed:n4sFreed(),knows:n4sKnows(),mercy:n4sMercy()}; },
  allyList:()=>Object.values(N4ST.ally).map(a=>({id:a.id,mode:a.mode,x:Math.round(a.x),y:Math.round(a.y)})),
  dps:()=>{ const e=n4sNyxE()||G.boss; return e?{type:e.type,hp:Math.round(e.hp),max:Math.round(e.maxHp)}:null; },
  book:(k,p)=>{ if(!N4ST.book) n4sBookOpen(k==='pane'?'pane':'epi'); n4sBookScene(k,p); return true; }, bookSettle:()=>{ const B=N4ST.book; if(!B) return false; B.fade=1; B.prev=null; B.t+=2; const el=document.getElementById('n4sBook'); if(el){ el.style.transition='none'; el.style.opacity='1'; } n4sBookDraw(); return true; }, bookClose:()=>{ n4sBookClose(true); return true; },
  pane:k=>n4sPane(k), victory:()=>{ if(!G.choices.n_end) G.choices.n_end='dawn'; n4sVictory(); return true; },
  epiLines:()=>n4sEpiLines().filter(l=>Array.isArray(l)||(l&&l.text)).map(l=>Array.isArray(l)?l[1]:(typeof l.text==='function'?l.text():l.text)).filter(Boolean),
  cut:()=>N4ST.cut?{fill:+N4ST.cut.fill.toFixed(2),gold:+N4ST.cut.gold.toFixed(2),nyx:N4ST.cut.nyx.mode,s:+N4ST.cut.nyx.s.toFixed(2)}:null,
  anim:sec=>{ for(let t=0;t<(sec||1);t+=1/30) n4sAnim(1/30); return true; },
  texts:()=>{ const out=[], add=v=>{ if(typeof v==='string') out.push(v); else if(Array.isArray(v)) v.forEach(add); else if(v&&typeof v==='object') for(const k in v) if(k!=='who'&&k!=='at'&&k!=='lines'&&k!=='n') add(v[k]); };
    add([N4S_TAUNT,N4S_HINT,N4S_HINTS,N4S_SOFAR,N4S_SOFAR_END,N4S_YARA]); for(const k in N4S_ALLYBEAT) add(N4S_ALLYBEAT[k][1]); for(const k in N4S_BUB) add(N4S_BUB[k].t);
    for(const k in N4S_PANE) add(N4S_PANE[k].title); for(const k in N4S_ENDINGS) add([N4S_ENDINGS[k].title,N4S_ENDINGS[k].msg]);
    for(const st of ['n_bridge','n_stair','n_clocks','n_rime','n_glass','n_crown','n_nyxara','n_end']){ const D=STAGEDEF[st]; if(D) add(D.chapter); }
    return out.filter(t=>t&&t.length>3); },
  state:()=>({stage:G.stage,act:G.act,map:curMap(),x:Math.round(player.x),y:Math.round(player.y),lvl:n4sLvl(),done:!!G.done,end:G.choices.n_end||null,run:N4ST.run,scene,
    dawn:+(+G.flags.n_dawn||0).toFixed(2),moon:typeof moonLeft==='function'?moonLeft():null,look:typeof moonLook==='function'?moonLook():null,heart:!!N4ST.heart,heartDone:!!G.flags.n_heart_done,big:+N4ST.big.toFixed(2),
    lanterns:n4sLanterns(),flames:n4sFlames(),echo:[1,2,3,4].map(n4sEchoDone),nyxDone:n4sNyxDone(),phase:n4sPhase(),gather:!!G.flags.n_gather,road:G.flags.n_road||0,door:!!G.flags.n_door,
    allies:Object.keys(N4ST.ally),q:N4ST.q.map(q=>q.id),seen:Object.keys(G.flags.n_sn||{}),asc:n4sHasAscent(),standEcho:!!N4ST.stand.echo,standNyx:!!N4ST.stand.nyx,
    panes:n4sPanesN(),duchess:n4sDuchessN(),spark:!!G.items.n_spark,peakMap:!!G.items.n_map,depart:!!G.flags.n_depart,book:N4ST.book?N4ST.book.scene:null,
    obj:(()=>{ try{ const o=questObjective(); return o?{text:o.text,x:Math.round(o.x||0),y:Math.round(o.y||0)}:null; }catch(e){ return String(e); } })()})
};
window.__ebX=Object.assign(window.__ebX||{},{n4s:N4S_DBG});
{ const X=window.__ebX, B={
    n_go:p=>n4sGo(p), n_solve:id=>N4S_DBG.solve(id), n_echo:k=>N4S_DBG.echo(k), n_phase:p=>{ const e=n4sNyxE(); if(e){ const f=[1,0.69,0.44,0.19][clamp(p|0,1,4)-1]; e.hp=e.maxHp*f; e.nPhase=p|0; } if((p|0)>=4) G.flags.n_heart_done=G.flags.n_heart_done||0; return p; },
    n_heart:()=>n4sHeart(()=>{}), n_choice:e=>{ G.flags.n_nyx_done=1; if(!N4ST.run) n4sFall(null,null); return e; }, n_allies:o=>N4S_DBG.allies(o), n_dps:()=>N4S_DBG.dps()};
  for(const k in B) if(!(k in X)) X[k]=B[k]; }
