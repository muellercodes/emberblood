
// ================= Act III main story: The Long Winter (x2_story)
// The twelve Act III stages (f_snow, f_pass, f_hearth, f_maze, f_kindle, f_thaw, f_sky, f_gap, f_deep, f_dreadgate,
// f_dread, f_glaciar), Mom's snow letter (f_intro, the first thing Act III plays), every main-story scene of
// bible/ACT3.md section 6, the story lines of the four dungeons (section 7, played by the dungeon helpers by key),
// Tove's hints, the frozen-folk beats on the main path (the mitten seller, Grandmother Ylva), the Great Hearth and the
// North Gate, the Drum Stone, Hush at the Dreadgate, the Crown of Dread and Glaciar's two outcomes
// (G.choices.f_glaciar 'free' or 'defeat', G.choices.f_glaciar_home), Shard 2, Nyxara's name, the second and third
// bites of the moon (moonSet(85)), endAct(3) and the hand-off into Act IV (m_sail).
// Everything is a wrapper or a registry entry: no other module is edited. When a helper module of this act is not in
// the build yet (x2_world, x2_people, x2_foes, x2_dun_a, x2_dun_b), small stand-ins keep the main path playable:
// people at the bible's spots, the High Pass crossing, the frozen Ylva and Fergus, a flame at each dungeon door, a lamp
// puzzle for Hush and the four frost locks for Glaciar. Each stand-in checks for the real thing at runtime (CASTBY,
// CROSSINGS, LANDMARKS, AREADEFS, SITES) and steps aside when it is there.
// Contract for the other Act III helpers: scratchpad/F2STORY.md (stages, flags, STORY keys, the calls to make).
// Top-level names start with f2s / F2S; debug hooks are window.__ebX.f2s (plus the bible's fThawAll, fChains, fSong,
// fStage, fFrozen when no other module took those names).
// Lines are [speaker, S(full, simple)]; Pip is "he"; "Mom"; no em dash anywhere.

// ---------- 0. small helpers
const F2ST={q:[],cam:null,glac:null,hush:null,lamps:null,locks:null,boss:null,bt:0,yara:{},seenChains:0,n9:false,fade:false,nightT:0,lmT:0,pcT:0,tick:0,dbg:{}};
const f2sEasy=()=>!!(G&&G.diff&&G.diff.name==='Easy');
const f2sOn=()=>!!G&&G.mode==='story'&&!G.done&&actOf(G.stage)===3;
const f2sOut=()=>!AREA&&curMap()===2;
const f2sAbil=id=>typeof hasAbil==='function'?!!hasAbil(id):!!(G.abil&&G.abil[id]);
// once-only scenes: every main script starts with a silent mark (G.flags.f_sn[key]), so a scene played by any route
// (a dungeon helper, a foe module, a fallback, a debug call) never plays twice
function f2sSeen(k){ const s=G&&G.flags&&G.flags.f_sn; return !!(s&&s[k]); }
function f2sMark(k){ if(!G||!G.flags) return; (G.flags.f_sn=G.flags.f_sn||{})[k]=1; }
function f2sDef(key,lines){ STORY[key]=[xdo(()=>f2sMark(key))].concat(lines); return STORY[key]; }
const f2sIf=(who,f,s,cond)=>({who,text:S(f,s),skipIf:()=>!cond()});
const f2sPip=(f,s)=>({who:'pip',text:S(f,s||f),skipIf:()=>!(G.flags&&G.flags.pip)});
// play a STORY key (or a list of lines); done runs after the scene closes
function f2sPlay(key,done,opt){
  const L0=typeof key==='string'?STORY[key]:key, L=typeof L0==='function'?L0():L0;
  if(!L||!L.length){ if(done) try{ done(); }catch(e){ console.error(e); } return false; }
  runDialogue(L,()=>{ scene='play'; F2ST.cam=null; if(done) try{ done(); }catch(e){ console.error(e); } try{ saveGame(); }catch(e){} },opt);
  return true;
}
// a dialogue stops the breath (runDialogue turns the fire sound off and lets go of the keys), so the blue Blaze jet
// goes too: p3_frost only clears it on a play frame, and a thaw or a story scene that starts while Ash holds Blaze
// kept the jet drawn on screen for the whole scene
{ const base=runDialogue; runDialogue=function(lines,done,opt){ try{ if(typeof P3!=='undefined'&&P3&&P3.bz){ const B=P3.bz; B.hold=0; B.blue=false; B.jetA=0; P3.jet=null; P3.jetOn=false; } }catch(e){} return base(lines,done,opt); }; }
function f2sChain(keys,done,opt){ const L=[]; for(const k of keys){ const v=STORY[k]; const a=typeof v==='function'?v():v; if(Array.isArray(a)&&a.length) L.push(...a); } return f2sPlay(L,done,opt); }
// a beat that waits for a calm moment: f2sWhen(id, cond, fn); an id already queued is not queued again
function f2sWhen(id,cond,fn){ if(F2ST.q.some(q=>q.id===id)) return; F2ST.q.push({id,cond,fn,t:0}); }
function f2sCalm(){
  if(scene!=='play'||DLG||G.mini||player.dead||G.fightIntro) return false;
  if(G.boss&&!G.boss.dead) return false;
  if(typeof PEBRT!=='undefined'&&PEBRT.crow) return false;
  return true;
}
// a top-of-screen line, unless the same words are already up, queued or were just said (another module may say the
// same bible line: the foe module during a fight, the people module at a landmark)
function f2sSay(who,text){
  const t=simplify(String(text==null?'':text)); if(!t) return false;
  const same=q=>q&&String(q.text||'')===t;
  if(same(G.taunt)||(G.tauntQ||[]).some(same)) return false;
  try{ const L=LOG.items; for(let i=L.length-1,n=0;i>=0&&n<8;i--,n++) if(L[i]&&L[i].k==='taunt'&&L[i].text===t&&Date.now()-(L[i].t||L[i].time||0)<12000) return false; }catch(e){}
  taunt(who,text); return true;
}
function f2sQueue(dt){
  if(!F2ST.q.length) return;
  for(const q of F2ST.q) q.t+=dt;
  if(!f2sCalm()) return;
  for(let i=0;i<F2ST.q.length;i++){ const q=F2ST.q[i]; let ok=false; try{ ok=!q.cond||q.cond(q); }catch(e){ console.error(e); }
    if(ok){ F2ST.q.splice(i,1); try{ q.fn(); }catch(e){ console.error(e); } return; } }
}
function f2sMoon(p){ if(typeof moonSet==='function') moonSet(p); else G.flags.moon=Math.min(G.flags.moon==null?100:G.flags.moon,p); }
const f2sVesper=()=>typeof vesperFriend==='function'?!!vesperFriend():G.choices.c_vesper==='friend';
function f2sEnding(){ return (G&&G.choices&&G.choices.ending)||'hero'; }
// the bible's places (absolute coordinates); x2_world's POI keys win when they exist
const F2SP={lodge:{x:1500,y:3400},passS:{x:950,y:3250},arrive:{x:2600,y:50500},fergus:{x:3300,y:50000},
  westGate:{x:6180,y:49000},hearth:{x:6800,y:48950},brynja:{x:6880,y:49040},northGate:{x:6800,y:48380},hearthold:{x:6800,y:49000},
  moat:{x:5600,y:44470},mazeDoor:{x:5600,y:44420},rime:{x:1900,y:47000},tower:{x:1950,y:46750},
  windRoad:{x:10050,y:47650},eastRim:{x:10950,y:46700},isles:{x:11400,y:46900},temple:{x:12650,y:46480},templeIsle:{x:12650,y:46150},
  gap:{x:10000,y:44450},horned:{x:12200,y:42450},dreadgate:{x:7300,y:44160},plaza:{x:7300,y:44300},windRoadStart:{x:8800,y:44450},
  drum:{x:8350,y:43380},shoulder:{x:8400,y:43420},crown:{x:7300,y:41250},crownIn:{x:7060,y:41700},night:{x:6850,y:49100},vesper:{x:7440,y:44380}};
const F2S_POI={hearthold:'f_hearthold',rime:'f_rimeholm',moat:'f_glacier',temple:'f_skyreach',horned:'f_stonehorn',plaza:'f_dreadgate',shoulder:'f_shoulder',crown:'f_crown'};
function f2sAt(k){ const pk=F2S_POI[k], P=pk&&typeof POI!=='undefined'?POI[pk]:null; if(P&&P.x!=null&&(k!=='temple'||!P.door)) return {x:P.x,y:P.y}; return F2SP[k]; }
// where Ash comes out on the Crown from the summit door (x2_world's spot when it has one)
function f2sCrownIn(){ try{ if(typeof f2wSpot==='function'){ const P=f2wSpot('crowndoor'); if(P&&P.x!=null) return {x:P.x,y:P.y}; } }catch(e){} return F2SP.crownIn; }
// a landmark x2_world placed (by id), else the bible spot
function f2sLm(id,k){ const L=typeof LANDMARKS!=='undefined'?LANDMARKS.find(o=>o&&o.id===id):null; return L?{x:L.x,y:L.y,lm:L}:F2SP[k]; }
const f2sNear=(P,r)=>f2sOut()&&!!P&&dist(player.x,player.y,P.x,P.y)<r;
const f2sInArea=id=>!!AREA&&(AREA.id===id||String(AREA.id).startsWith(id+'_'));
// where a person is: outdoors, inside their house (the door), or the stand-in spot
function f2sWho(id,x,y){
  const n=(G.npcs||[]).find(q=>q.id===id); if(n) return {x:n.x,y:n.y,npc:id};
  const c=CASTBY[id];
  if(c&&c.inside&&AREADEFS[c.inside]){ if(AREA&&AREA.id===c.inside){ const m=AREA.npcs.find(q=>q.id===id); if(m) return {x:m.x,y:m.y,npc:id,area:AREA.id}; }
    const d=DOORS.find(q=>q.area===c.inside); if(d) return {x:d.x,y:d.y,area:c.inside,npc:id}; }
  const P=F2S_PEOPLE[id]; if(P&&F2ST.fb&&F2ST.fb[id]) return {x:P.at[0],y:P.at[1],npc:id};
  return {x,y,npc:id};
}
const f2sObj=(f,s,at,extra)=>Object.assign({text:S(f,s),x:at.x,y:at.y},at.area?{area:at.area}:{},at.npc?{npc:at.npc}:{},extra||{});
// a dungeon objective: inside it follows Ash; outside it points at the door (the area id lets the map route to it, only
// when the dungeon is really registered)
const f2sDunObj=(id,f,s,P)=>f2sInArea(id)?{text:S(f,s),x:player.x,y:player.y,area:AREA.id}:Object.assign({text:S(f,s),x:P.x,y:P.y},typeof AREADEFS!=='undefined'&&AREADEFS[id]?{area:id}:{});

// ---------- 1. speakers, portraits, items, the wolf-fur hat
const F2S_SPK={f_glaciar:{name:'Glaciar',col:'#a8dcff'},f_bellows:{name:'Old Bellows',col:'#e8a050'},f_frostfeather:{name:'Old Frostfeather',col:'#e8f0ff'},
  f_grumblehorn:{name:'King Grumblehorn',col:'#c8b8a8'},f_hjalmar:{name:'Hjalmar',col:'#8ab0d0'},f_sigrid:{name:'Sigrid',col:'#d07a5a'},
  f_blubberton:{name:'Lord Blubberton',col:'#b08a6a'},f_squall:{name:'Squall',col:'#7ab8ff'},f_squeak:{name:'Squeak',col:'#ffe060'},
  f_rockjaw:{name:'Rockjaw',col:'#b8906a'},f_grumbo:{name:'Grumbo',col:'#d8d0ff'},f_mumble:{name:'Mumble',col:'#bfe0ff'},
  f_eider:{name:'Brother Eider',col:'#6a9a7a'},f_soldier:{name:'A Hearthold soldier',col:'#8aa8c8'},f_lamb:{name:'A baby Stonehorn',col:'#d8d0c0'},
  goat:{name:'Duchess',col:'#e8e0d0'},pebble:{name:'Pebble',col:'#9aa0b8'},dell:{name:'Dell',col:'#5aa0c8'},quill:{name:'Professor Quill',col:'#a8a0e0'}};
for(const k in F2S_SPK) if(!SPK[k]) SPK[k]=F2S_SPK[k];
if(!SPK.f_hush) SPK.f_hush={name:'Hush',col:'#e4e0f4'};
if(!SPK.nyxara) SPK.nyxara={get name(){ return G&&G.flags&&(G.flags.f_nyx_named||G.flags.f_moon_bite3)?'Nyxara':'The Lady of the Moths'; },col:'#b8a8e8'};
if(typeof ITEM_NAMES!=='undefined'){
  if(!ITEM_NAMES.f_shard2) ITEM_NAMES.f_shard2=S('The Frost Shard (Shard 2 of the Ember Heart)','The Frost Shard');
  if(!ITEM_NAMES.f_icediary) ITEM_NAMES.f_icediary=S("Ember's Ice Diary","Ember's Ice Diary");
}
// Glaciar's eyes follow the story: violet under the spell, blue once she is herself
function f2sGlacEyes(){ const c=G&&G.choices&&G.choices.f_glaciar; return c==='free'||(F2ST.glac&&F2ST.glac.mode==='awake')?'#9ae0ff':'#c890ff'; }
function f2sFaceOwl(g){ const O='#2a2a3a'; g.lineWidth=3; g.strokeStyle=O;
  g.fillStyle='#f4f6fc'; g.beginPath(); g.ellipse(0,8,56,52,0,0,TAU); g.fill(); g.stroke();
  for(const s of [-1,1]){ g.fillStyle='#e0e6f4'; g.beginPath(); g.moveTo(s*30,-36); g.lineTo(s*44,-62); g.lineTo(s*14,-42); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#fff'; g.beginPath(); g.arc(s*22,-2,18,0,TAU); g.fill(); g.stroke();
    const free=G&&G.flags&&G.flags.trial_f_sky_done; g.fillStyle=free?'#f0b830':'#b07ae8'; g.beginPath(); g.arc(s*22,-2,11,0,TAU); g.fill();
    g.fillStyle=O; g.beginPath(); g.arc(s*22,-2,5.5,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(s*19,-6,2.4,0,TAU); g.fill(); }
  g.fillStyle='#e8b040'; g.beginPath(); g.moveTo(-8,14); g.lineTo(8,14); g.lineTo(0,30); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle='rgba(150,160,190,.7)'; g.lineWidth=1.6; for(let i=0;i<6;i++){ const x=-30+i*12; g.beginPath(); g.moveTo(x,36); g.quadraticCurveTo(x+6,42,x+12,36); g.stroke(); } }
function f2sFaceGolem(g){ const O='#2a1a10'; g.lineWidth=3; g.strokeStyle=O;
  g.fillStyle='#c89040'; rrect(g,-52,-48,104,100,22); g.fill(); g.stroke();
  g.fillStyle='#a87030'; for(const [x,y] of [[-40,-36],[40,-36],[-40,38],[40,38]]){ g.beginPath(); g.arc(x,y,5,0,TAU); g.fill(); g.stroke(); }
  for(const s of [-1,1]){ g.fillStyle='#2a1a14'; g.beginPath(); g.ellipse(s*22,-12,12,10,0,0,TAU); g.fill(); g.stroke(); g.save(); g.shadowColor='#ffb040'; g.shadowBlur=12; g.fillStyle='#ffc050'; g.beginPath(); g.arc(s*22,-12,5,0,TAU); g.fill(); g.restore(); }
  g.fillStyle='#3a2014'; rrect(g,-24,12,48,26,6); g.fill(); g.stroke(); g.fillStyle='rgba(255,150,60,.85)'; for(let i=0;i<4;i++){ g.fillRect(-18+i*11,18,6,14); }
  if(!(G&&G.flags&&G.flags.trial_f_maze_done)){ g.fillStyle='rgba(196,178,242,.75)'; g.beginPath(); g.moveTo(-52,-48); g.lineTo(-10,-48); g.lineTo(-30,-20); g.lineTo(-52,-22); g.closePath(); g.fill(); g.strokeStyle='#8a6ad0'; g.lineWidth=2; g.stroke(); } }
function f2sFaceRam(g){ const O='#2a2420'; g.lineWidth=3; g.strokeStyle=O;
  for(const s of [-1,1]){ g.strokeStyle=G&&G.flags&&G.flags.trial_f_deep_done?'#c8b090':'#b090e0'; g.lineWidth=13; g.beginPath(); g.arc(s*42,-16,20,0,TAU); g.stroke(); g.lineWidth=7; g.beginPath(); g.arc(s*42,-16,7,0,TAU); g.stroke(); g.strokeStyle=O; g.lineWidth=3; }
  g.fillStyle='#a8a098'; for(let i=0;i<9;i++){ const a=Math.PI*(1.05+i/8*0.9), x=Math.cos(a)*40, y=Math.sin(a)*30-14; g.beginPath(); g.arc(x,y,14,0,TAU); g.fill(); }
  g.fillStyle='#d8cfc4'; g.beginPath(); g.ellipse(0,6,30,42,0,0,TAU); g.fill(); g.stroke();
  for(const s of [-1,1]){ g.fillStyle='#f0d070'; g.beginPath(); g.ellipse(s*14,-8,7,5,0,0,TAU); g.fill(); g.stroke(); g.fillStyle=O; g.fillRect(s*14-4,-9,8,2.5); }
  g.fillStyle='#8a7a70'; g.beginPath(); g.ellipse(0,32,14,10,0,0,TAU); g.fill(); g.fillStyle='#e8f4ff'; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(-14+i*7,44); g.lineTo(-11+i*7,60+(i%2)*6); g.lineTo(-8+i*7,44); g.fill(); } }
function f2sFaceYeti(g,o){ const O='#1a2030'; g.lineWidth=3; g.strokeStyle=O;
  g.fillStyle='#f4f8ff'; for(let i=0;i<14;i++){ const a=i/14*TAU; g.beginPath(); g.arc(Math.cos(a)*42,Math.sin(a)*40+4,18,0,TAU); g.fill(); }
  g.fillStyle='#7aa8d8'; g.beginPath(); g.ellipse(0,8,30,32,0,0,TAU); g.fill(); g.stroke();
  for(const s of [-1,1]){ g.fillStyle='#fff'; g.beginPath(); g.ellipse(s*12,0,8,9,0,0,TAU); g.fill(); g.stroke(); g.fillStyle=o.eye; g.beginPath(); g.arc(s*12,1,4,0,TAU); g.fill(); }
  g.strokeStyle=O; g.lineWidth=2.4; g.beginPath(); g.moveTo(-10,24); g.quadraticCurveTo(0,o.grin?32:28,10,24); g.stroke();
  if(o.hat){ g.fillStyle='#c84a3a'; g.beginPath(); g.ellipse(0,-36,16,9,0,Math.PI,TAU); g.fill(); g.stroke(); g.fillStyle='#ffe0a0'; g.beginPath(); g.arc(0,-46,5,0,TAU); g.fill(); } }
const F2S_PORT={
  f_glaciar:{bg:'#0e2236',f:g=>{ if(typeof faceDragon==='function') faceDragon(g,{skin:'#eaf6ff',dark:'#5a7aa8',snout:'#cfe4f8',horn:'#c8ecff',eye:f2sGlacEyes(),k:0.9,big:true,frill:true});
    g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=2; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*18,30); g.quadraticCurveTo(s*40,40,s*52,62); g.stroke(); } }},
  f_bellows:{bg:'#2a1a10',f:f2sFaceGolem}, f_frostfeather:{bg:'#1a2438',f:f2sFaceOwl}, f_grumblehorn:{bg:'#2a2018',f:f2sFaceRam},
  f_mumble:{bg:'#14243a',f:g=>f2sFaceYeti(g,{eye:'#3a6ab8',hat:true})}, f_grumbo:{bg:'#1a1430',f:g=>f2sFaceYeti(g,{eye:'#a060e8',grin:true})}
};
for(const k in F2S_PORT) if(typeof EVPORT!=='undefined'&&!EVPORT[k]) EVPORT[k]=F2S_PORT[k];
// the wolf-fur hat (Ulf's gift at the Lodge), worn like any hat; the hat's name is its key
const F2S_HAT='Wolf-fur Hat';
function f2sHat(){ G.hats=G.hats||{}; G.hats[F2S_HAT]=true; G.hat=F2S_HAT; setBanner(S('Wolf-fur Hat','Wolf-fur Hat'),S('Ear flaps! Warm as toast, and smells a bit of sheep.','Ear flaps! Warm and fluffy.'),2.6); }
if(typeof drawHatShape==='function'){ const base=drawHatShape; drawHatShape=function(x,y,k,s){
  if(k!==F2S_HAT) return base(x,y,k,s); s=s||1; ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ctx.fillStyle='#8a7a6a'; ctx.beginPath(); ctx.arc(0,0,8.5,0,TAU); ctx.fill(); ctx.fillStyle='#b8a890'; ctx.beginPath(); ctx.arc(-1,-1,5,0,TAU); ctx.fill();
  ctx.fillStyle='#6a5a4a'; ctx.beginPath(); ctx.ellipse(-8,4,3,5,0.4,0,TAU); ctx.ellipse(8,4,3,5,-0.4,0,TAU); ctx.fill(); ctx.restore(); }; }
if(typeof ashHat==='function'){ const base=ashHat; ashHat=function(k){
  if(k!==F2S_HAT) return base(k); const z0=6.2;
  aE(0,0,z0-0.4,8.2,8.6,4.8,'#8a7a6a'); aE(-0.4,0,z0+1.6,6.4,6.8,3.6,'#b8a890');
  aE(-1,6.4,z0-3.6,2.6,1.8,3.4,'#6a5a4a'); aE(-1,-6.4,z0-3.6,2.6,1.8,3.4,'#6a5a4a'); aB(-0.6,0,z0+5.2,1.6,'#d8ccb8'); }; }

// ---------- 2. the people the main story needs. x2_people owns them (CAST, homes, talk); when a run has no x2_people
// yet, a stand-in with the bible's look waits at the bible's spot (F2ST.fb) so the main path still works.
const F2S_PEOPLE={
  f_brynja:{name:'Old Brynja',col:'#e8a050',at:[6880,49040],look:{skin:'#e8c0a0',hair:'#efeae0',hairdo:'bun',outfit:'robe',shirt:'#3a2a2a',low:'#2a1e1e',shawl:'#1a1414',soot:true,build:'old',hold:'staff'}},
  f_brann:{name:'Captain Brann Stoutmitt',col:'#3a6aaa',at:[6270,48900],look:{skin:'#f0c8a8',hair:'#c86a2a',beard:'big',beardc:'#c86a2a',outfit:'armor',helm:true,plume:'#3a6aaa',cape:'#2a4a7a',frost:true,build:'big',hold:'spear',mittens:'#2a4a7a'}},
  f_toastwhistle:{name:'Mayor Ottilie Toastwhistle',col:'#e8c060',at:[6720,49110],look:{skin:'#f2d0b8',hair:'#e8c060',hairdo:'curly',outfit:'coat',shirt:'#7a2a4a',low:'#5a1a3a',hat:'fur',hatc:'#efeae0',sash:'#e0c080',necklace:'#e0c080',blush:true}},
  f_ylva:{name:'Grandmother Ylva',col:'#5a7aaa',at:[2000,46880],thawed:true,look:{skin:'#f4d6c2',hair:'#efeae0',hairdo:'bun',outfit:'dress',shirt:'#5a7aaa',shawl:'#e8e4dc',glasses:true,build:'old',hold:'yarn',yarnc:'#c84a3a'}},
  f_pennant:{name:'Brother Pennant',col:'#e8a030',at:[12620,46580],from:'f_sky',look:{skin:'#a87050',hood:'#e8a030',outfit:'robe',shirt:'#e8a030',low:'#c87a1a',sash:'#c83a2a',build:'short',hairdo:'bald'}}
};
F2ST.fb={};
for(const id in F2S_PEOPLE){ const P=F2S_PEOPLE[id]; if(CASTBY[id]||SPECIAL[id]) continue;
  SPECIAL[id]={id,name:P.name,col:P.col,inside:'ev',look:P.look,lines:[S('Brr. Cold enough to freeze a snowman.','Brr. So cold.')]};
  if(!SPK[id]) SPK[id]={name:P.name,col:P.col}; F2ST.fb[id]=true; }
// the two frozen explorers of the Glacier Maze, for their portraits and names (the dungeon helper places them)
for(const [id,nm,look] of [['f_hjalmar','Hjalmar',{skin:'#e8bc98',hair:'#c8a060',beard:true,beardc:'#c8a060',outfit:'fur',shirt:'#5a6a7a',low:'#3a4a5a',hat:'fur',hatc:'#6a5a4a',back:'pack',build:'tall'}],
  ['f_sigrid','Sigrid',{skin:'#f0c8a8',hair:'#c8582a',hairdo:'braids',outfit:'coat',shirt:'#c8582a',low:'#5a3a2a',hat:'beanie',hatc:'#3a6aaa',mittens:'#3a6aaa',back:'pack',build:'slim'}]])
  if(!SPECIAL[id]&&!CASTBY[id]) SPECIAL[id]={id,name:nm,col:F2S_SPK[id].col,inside:'ev',look,lines:[S('Brrrr.','Brrrr.')]};

// ---------- 3. the main story (bible/ACT3.md section 6). Every scene is STORY.<key>; F2STORY.md lists when each plays
// Chapter 1, A Letter in the Snow
f2sDef('f_intro',[
  f2sIf('narr',`Snow. In the middle of summer. It falls on the clock towers of Gearhaven and fizzles on the warm brass, like the sky is sneezing.`,`Snow! In summer! It fizzles on the warm clocks.`,()=>curMap()===1),
  f2sIf('narr',`Snow. In the middle of summer. It falls on the roofs and fizzles on the warm chimneys, like the sky is sneezing.`,`Snow! In summer! It fizzles on the chimneys.`,()=>curMap()!==1),
  xl('narr',`A crow lands on your horn. She has a letter in her beak and a look on her face that says you owe her a button.`,`A crow lands on your horn. She has a letter.`),
  xl('ash',`Pebble! Did Yara send you?`,`Pebble! Did Yara send you?`),
  xl('narr',`Pebble drops the letter, takes one shiny coin out of your pouch, and does not apologize.`,`Pebble drops the letter. She takes a coin. She is not sorry.`),
  xl('maren',`(the letter) Ash. It's snowing in Emberhollow. In SUMMER. The lanterns on the green have little snow hats. Bertram's buns froze solid. He's using them as doorstops.`,`Ash. It's snowing at home. In SUMMER! Bertram's buns froze solid.`),
  xl('maren',`Yara says the cold is coming down from the north, over the High Pass by Frostpine Lodge. Ulf says that pass has been shut for a hundred years. It isn't now.`,`The cold comes from the north. Over the High Pass by Frostpine Lodge. It was shut for 100 years. Not now.`),
  xl('maren',`Don't come home first. Go straight to the Lodge. Wear a scarf. Love, Mom.`,`Go straight to the Lodge. Wear a scarf. Love, Mom.`),
  xl('maren',`P.S. Come home first. I made soup.`,`P.S. Come home first. I made soup.`),
  f2sPip(`Mip! (Pip sneezes on a snowflake. It sizzles.)`,`Mip! (Pip sneezes on a snowflake.)`),
  f2sIf('narr',`In your pocket, the Shard of the Ember Heart has gone cold. Not cold like a stone. Cold like it's scared of something.`,`The Shard in your pocket feels cold. Like it is scared.`,()=>!!(G.items&&G.items.c_shard1)),
  xl('ash',`Okay. North. Scarf. Soup. Not in that order.`,`Okay. North. Scarf. Soup.`)
]);
f2sDef('f_lodge',[
  xl('ulf',`Ash! You came. Good. Look at this. LOOK at it.`,`Ash! You came. Look at this!`),
  xl('narr',`Ulf points north. Where the High Pass used to be a wall of ice, there is a road. A white road, glittering, climbing up into the clouds.`,`Ulf points north. The wall of ice is gone. A white road climbs into the clouds.`),
  xl('ulf',`A hundred years that pass was shut. Then one night, crack, the ice split right down the middle. Like something big flew through it. Something with wings.`,`The pass was shut for 100 years. Then, crack! Something big with wings flew through.`),
  xl('ulf',`And my sheep. My sheep won't stop looking north. Sheep don't look at things, Ash. Sheep look at grass.`,`And my sheep keep looking north. Sheep only look at grass!`),
  xl('ash',`Where's Elka?`,`Where is Elka?`),
  xl('ulf',`...She left a note.`,`She left a note.`),
  xl('narr',`The note says: GONE SLEDDING. VERY FAR. BACK FOR SUPPER. (NOT TONIGHT'S.)`,`The note says: GONE SLEDDING. VERY FAR. BACK FOR SUPPER. (NOT TONIGHT.)`),
  f2sIf('brisket',`I'm not going. I want that written down somewhere. I have been an ice cube once, and once was plenty.`,`I'm not going. I was an ice cube once. Once was enough.`,()=>!!G.flags.brisket_thawed),
  xl('ulf',`Find her. And whatever is making winter up there, give it a good kick from me.`,`Find her. And kick the winter for me.`),
  xl('ulf',`Here. A wolf-fur hat, with ear flaps. Your fire ears won't need it. Wear it anyway. For me.`,`Here. A fur hat with ear flaps. Wear it for me.`),
  xl('narr',`The High Pass is just north of the Lodge.`,`The High Pass is just north of the Lodge.`)
]);
// Chapter 1, the High Pass and the White Road
f2sDef('f_arrive',[
  xl('narr',`The High Pass climbs and climbs. Your breath puffs out in little clouds. Your tail goes numb. Then the clouds open.`,`The pass climbs up and up. Your tail goes numb. Then the clouds open.`),
  xl('narr',`The whole north is white. White hills, white forests, a white lake as flat as a plate. And far away, a black mountain wrapped in a purple storm.`,`The whole north is white. And far away: a black mountain in a purple storm.`),
  xl('tove',`Brr. Oh, brr. Oh, I know this cold.`,`Brr. Oh, I know this cold.`),
  xl('ash',`Tove? Is that you? Where are you?`,`Tove? Is that you? Where are you?`),
  xl('tove',`In your fire, Ash. All five of us ride along in there, remember? The others are napping. I volunteered for this trip. I don't know why. I hate this trip.`,`In your fire, Ash. All five of us ride in there. The others are napping. I came on this trip. I hate this trip.`),
  xl('tove',`That mountain is Mount Dread. That storm is not a normal storm. Normal storms don't hum.`,`That is Mount Dread. That storm hums. Normal storms don't hum.`),
  xl('ash',`It's humming the same note as the Shard.`,`It hums the same note as the Shard.`),
  xl('tove',`Then that's where the second piece went. Follow the road. There's a town down there with a fire in it. A big one. Mostly.`,`Then the second piece is there. Follow the road. There's a town with a big fire.`)
]);
f2sDef('f_fergus_cold',[
  xl('narr',`A traveler stands in the middle of the road, frozen solid. He's holding up a mitten like he's trying to sell it to the wind.`,`A man is frozen on the road. He holds up a mitten.`),
  xl('narr',`You breathe on him. Your best breath. The ice sweats a little. That's all.`,`You breathe fire on him. The ice only drips.`),
  xl('tove',`That's moth-frost, Ash. Normal fire won't touch it. You'll need something hotter.`,`That's moth-frost. You need a hotter fire.`),
  xl('ash',`Sorry, mitten man. I'll come back.`,`Sorry, mitten man. I'll come back.`)
]);
f2sDef('f_gate',[
  xl('f_brann',`HALT! Who goes there? State your name, your business, and whether you are a moth.`,`HALT! Who are you? Are you a moth?`),
  xl('ash',`Ash Emberblood. I'm here about the winter. And I'm not a moth.`,`I'm Ash. I'm here about the winter. I'm not a moth.`),
  xl('f_brann',`That is EXACTLY what a moth would say.`,`That is EXACTLY what a moth would say.`),
  xl('f_brann',`...Hm. Moths don't have horns. Or tails. Is that smoke coming out of your nose?`,`Hm. Moths don't have horns. Is that smoke from your nose?`),
  xl('ash',`Only when I sneeze.`,`Only when I sneeze.`),
  xl('f_brann',`An Emberblood! A real one! OPEN THE GATE! ...It's frozen. Hang on. Everybody push.`,`An Emberblood! OPEN THE GATE! It's frozen. Everybody push!`),
  xl('narr',`Six guards push. The gate groans open exactly as wide as a kid with a tail.`,`Six guards push. The gate opens just wide enough for you.`),
  xl('f_brann',`Welcome to Hearthold, the last warm town in the north. Go and see the Hearthkeeper at the Great Hearth. She's been waiting for someone like you. For a month. Loudly.`,`Welcome to Hearthold! See the Hearthkeeper at the Great Hearth. She has waited a month. Loudly.`)
]);
// Chapter 2, The Dying Hearth
f2sDef('f_brynja',[
  xl('narr',`In the middle of town stands a fireplace as big as a house. The Great Hearth. Its fire is tiny. A little orange flicker, like a candle at the bottom of a well.`,`In the middle of town is a fireplace as big as a house. Its fire is tiny.`),
  xl('f_brynja',`There, there, old girl. Somebody's come to see you.`,`There, there, old girl. Someone came to see you.`),
  xl('f_brynja',`You're the Emberblood? Good. Come here. Closer. Let me look at you. ...Skinny. Your mother doesn't feed you.`,`You're the Emberblood? Come closer. Skinny! Your mom doesn't feed you.`),
  xl('ash',`She feeds me SO much.`,`She feeds me SO much.`),
  xl('f_brynja',`I'm Brynja. Hearthkeeper. Seventy years I've kept this fire, and my mother before me, and hers before her, all the way back to the night it was lit.`,`I'm Brynja. I have kept this fire for 70 years. My mother did too, and hers.`),
  xl('f_brynja',`Then a moth came. A great white moth, big as a barn, flying north to that mountain. Its wings went over the town, and the Hearth went cold as a fish.`,`Then a white moth came. Big as a barn. It flew over, and the Hearth went cold.`),
  xl('f_brynja',`Now the frost creeps in a little more every night. The folk on the edges froze first. Then the farms. If the Hearth goes out, Hearthold goes white. That's the end of us.`,`The frost creeps in every night. People froze. If the Hearth goes out, so do we.`),
  xl('ash',`Let me try.`,`Let me try.`),
  xl('narr',`You breathe your biggest, hottest breath into the Hearth. The flicker jumps up. Then it shivers and shrinks back down.`,`You breathe your biggest fire. The flame jumps up. Then it shrinks again.`),
  xl('f_brynja',`Kind of you. But that's a breath for candles, child. The Great Hearth was lit with Blaze.`,`Kind of you. But that fire is for candles. The Hearth was lit with Blaze.`),
  xl('ash',`What's Blaze?`,`What's Blaze?`),
  xl('f_brynja',`Fire so hot it burns blue. The old Emberbloods had it. They kept a forge up north, where the glacier comes down to the Glimmerfrost. The ice swallowed it long ago.`,`Fire so hot it burns blue. The old Emberbloods had a forge up north. The ice ate it.`),
  xl('f_brynja',`Folk call it the Glacier Maze, because people who go in get lost, and people who get lost don't come out to complain about the name.`,`Folk call it the Glacier Maze. People get lost in it.`),
  xl('tove',`Ember's North Forge. I'd forgotten. She built it with... with someone. I can't remember who. The cold makes my memory slippery.`,`Ember's North Forge! She built it with... someone. The cold makes me forget.`),
  xl('f_brynja',`Take the road north to Glimmer Point, then cross the ice. Find the Blaze. Come back and wake my old girl up.`,`Go north to Glimmer Point. Cross the ice. Find the Blaze. Then wake my old girl up.`)
]);
STORY.f_brynja_wait=[xl('f_brynja',`Blaze is up north, child, in the Glacier Maze. Past Glimmer Point, over the ice. My old girl can wait. Just about.`,`Blaze is north, in the Glacier Maze. Past Glimmer Point.`)];
STORY.f_brynja_blue=[xl('f_brynja',`Hold your breath on her until your fire burns blue. Don't be shy. She likes it hot.`,`Hold your fire on her until it turns blue!`)];
f2sDef('f_moat',[
  xl('tove',`Open water all around the door. Good thing you can walk on water. You CAN walk on water? Please say you can.`,`Water all around the door. You CAN walk on water? Please say yes.`),
  xl('ash',`I can walk on water, run on water, and skip on water. I can't swim, though.`,`I can walk on water and skip on water. I can't swim, though.`),
  xl('tove',`Let's not find out today.`,`Let's not find out today.`)
]);
f2sDef('f_kindle',[
  xl('f_brynja',`Blue! Your breath's gone BLUE! Oh, my old girl will like that. Go on. Give her everything.`,`Blue! Your fire is BLUE! Give her everything!`),
  {who:'narr',text:S(`The Blaze hits the Great Hearth. For one second nothing happens. Then, WHOOMPH. A column of blue and gold fire roars up out of the stones, higher than every roof in town.`,`WHOOMPH! Blue and gold fire roars up. Higher than every roof!`),fn:()=>{ G.flags.f_hearth_lit=1; f2sKindleFx(); }},
  xl('narr',`Snow slides off every roof in Hearthold at once. Somebody cheers. Somebody else gets snow down their shirt and screams. Then they cheer too.`,`Snow slides off every roof. People cheer!`),
  xl('f_brynja',`Ha! HA! Look at her! She hasn't burned like that since I was a girl!`,`Ha! Look at her! She hasn't burned like that in years!`),
  xl('f_brynja',`She won't stay this bright, mind. Not while that purple storm sits on the mountain. But she'll hold now. She'll hold.`,`She won't stay this bright. Not with that storm. But she will hold now.`),
  f2sIf('narr',`Pip hops up onto the edge of the Hearth, sniffs a blue ember, and licks it. Pip's belly starts to glow, warm and orange, like a tiny stove.`,`Pip licks a blue ember. His belly glows warm, like a tiny stove.`,()=>!!G.flags.pip),
  f2sPip(`Mip! (Pip is VERY pleased with himself.)`,`Mip! (Pip is very proud.)`),
  xdo(()=>{ if(G.flags.pip) G.flags.f_pip_warm=1; }),
  xl('f_toastwhistle',`Everything is FINE! I said it was fine! I've been saying it all month! Mostly to my pillow!`,`Everything is FINE! I said so all month! Mostly to my pillow!`),
  xl('f_brann',`Hearthkeeper! The North Gate's still frozen solid. We tried pushing. We tried pulling. Gunnar tried licking it. That was a mistake. He's fine. Mostly.`,`The North Gate is still frozen! Gunnar tried licking it. He's fine. Mostly.`),
  xl('f_brynja',`Then let the child do it. North of the gate is the road to the lake and the moor. Rimeholm went quiet the night the moth came over. Not one letter since. Go and see.`,`Then let the child do it. And Rimeholm went quiet when the moth came. Go and see.`)
]);
f2sDef('f_northgate',[
  xl('narr',`The ice on the North Gate sags, drips, and slides off in one big slab, SPLOOSH, right onto Captain Brann's boots.`,`The ice on the gate slides off. SPLOOSH! Right onto Captain Brann's boots.`),
  xl('narr',`The gate swings open with a sound like a happy sigh.`,`The gate swings open with a happy sigh.`),
  xl('f_brann',`...My boots are full of gate. Thank you, Emberblood! GUNNAR! You can stop licking things now!`,`My boots are full of gate. Thank you! GUNNAR! Stop licking things!`),
  xl('tove',`Rimeholm is west, Ash. Along the cliffs. Take a scarf. Take two.`,`Rimeholm is west, on the cliffs. Take a scarf. Take two.`)
]);
// Chapter 3, One Thaw at a Time
f2sDef('f_rime_arrive',[
  xl('narr',`Rimeholm is a fishing village on the cliffs above the frozen sea. Every house is white. Every window is white. Every person is white.`,`Rimeholm is a fishing village on the cliffs. Everything is white. Even the people.`),
  xl('narr',`On the quay below, a fisher girl stands with her line cast out, frozen solid. The fish on the end of her line is frozen in mid-air, mid-flop, looking extremely surprised.`,`A fisher girl is frozen on the quay. Her fish is frozen in the air. It looks surprised.`),
  xl('tove',`The whole village. Frozen in one night.`,`The whole village froze in one night.`),
  xl('ash',`Can I thaw them?`,`Can I thaw them?`),
  xl('tove',`One at a time, I think. Start with whoever knows the most. In a village, that's always the oldest granny.`,`One at a time. Start with whoever knows the most. That's always the oldest granny.`),
  xl('narr',`High on top of the bell tower, a little old woman sits in a rocking chair, knitting, frozen solid.`,`On top of the bell tower, a little old woman is frozen in her rocking chair.`)
]);
f2sDef('f_ylva',[
  xl('narr',`The ice on the old woman goes soft, then slushy, then drips away. She blinks. She looks down at her knitting.`,`The ice melts away. The old woman blinks. She looks at her knitting.`),
  xl('f_ylva',`Oh, bother. I dropped a stitch.`,`Oh, bother. I dropped a stitch.`),
  xl('f_ylva',`Hello, dear. I wasn't frozen. I was resting my eyes. How long was I resting them?`,`Hello, dear. I wasn't frozen. I was resting my eyes. For how long?`),
  xl('ash',`About a month.`,`About a month.`),
  xl('f_ylva',`A MONTH? Oh dear. My tea will be cold. Well. It was cold anyway, wasn't it. Everything was.`,`A MONTH? Oh dear. My tea is cold. Everything was cold.`),
  xl('f_ylva',`I saw it, you know. Up here with my knitting. A moth, big as a barn, white as milk, with purple eyes painted on its wings. It flew over, and everything went quiet. Not a snowy hush. A hush like a held breath.`,`I saw it. A moth, big as a barn, white as milk, with purple eyes on its wings. Then everything went quiet.`),
  xl('f_ylva',`It flew to Mount Dread. That's where Glaciar sleeps.`,`It flew to Mount Dread. That's where Glaciar sleeps.`),
  xl('ash',`Who's Glaciar?`,`Who's Glaciar?`),
  xl('f_ylva',`The ice dragon, dear. The slow one. She's slept up there since before my granny's granny. She's the sister of the fire dragon down south. The loud one. What was his name. Vorla-something.`,`The ice dragon, dear. She sleeps up there. She's the sister of the fire dragon down south. Vorla-something.`),
  xl('ash',`Vorlaxis?`,`Vorlaxis?`),
  xl('f_ylva',`That's him. Terrible temper. Lovely scales.`,`That's him. Bad temper. Lovely scales.`),
  xl('ash',`...Wait. Vorlaxis is my great, great, great, great, great, great, great, great, great, great, great, great, great grandfather.`,`Wait. Vorlaxis is my great (times 13) grandpa.`),
  xl('ash',`So his sister is my... great x13 grand-AUNT?`,`So his sister is my... great x13 grand-AUNT?`),
  xl('tove',`Technically, yes.`,`Yes. Technically.`),
  xl('ash',`I have an AUNTIE! And she's a DRAGON! And she's made of ICE! Ha! HA HA HA! Does she knit? Is she going to pinch my cheeks? With CLAWS?`,`I have an AUNTIE! A DRAGON made of ICE! Ha ha ha! Will she pinch my cheeks? With CLAWS?`),
  xl('f_ylva',`She might, dear. Aunties do.`,`She might, dear. Aunties do.`),
  f2sPip(`Mip mip mip! (Pip is laughing too. Pip doesn't know why.)`,`Mip mip mip! (Pip laughs too.)`),
  xl('ash',`(hiccup) Sorry. (hiccup) I got the giggle hiccups.`,`(hiccup) Sorry. (hiccup) Giggle hiccups.`),
  xl('f_ylva',`Now listen. Nobody climbs Mount Dread in that storm. The old climbers went up the Wind Road, riding the sky like birds, the way the monks of Skyreach taught them.`,`Listen. Nobody climbs Mount Dread in that storm. The old climbers rode the sky up the Wind Road.`),
  xl('f_ylva',`And the Dreadgate only opens for the Stonehorn knock. A knock so loud it cracks ice.`,`And the Dreadgate only opens for the Stonehorn knock. A knock so loud it cracks ice.`),
  xl('ash',`Where do I learn to ride the sky?`,`Where do I learn to ride the sky?`),
  xl('f_ylva',`Skyreach. On the sky isles past the Windscour, east of Hearthold. And the Stonehorns live past the Howling Gap, which you can't cross unless you can ride the sky. So: sky first, dear. Then knocking.`,`Skyreach, on the sky isles east of Hearthold. The Stonehorns live past the Howling Gap. So: sky first. Then knocking.`),
  xl('f_ylva',`And if you've a spare minute, thaw my neighbors. They'll be cranky. Be patient. Sigrun's soup is worth it.`,`And thaw my neighbors, if you can. They'll be cranky. Sigrun's soup is worth it.`)
]);
// Chapter 3, the Windscour and the Sky Isles
STORY.f_rim_tove=S(`See those isles? Floating. In the sky. I'm cold just looking at them.`,`Floating isles! I'm cold just looking at them.`);
f2sDef('f_pennant',[
  xl('f_pennant',`Wheeee... oh! Hello! Sorry. Hello! I'm Brother Pennant. Last of the Wind Monks of Skyreach. Also the first. Also the middle. It's just me.`,`Wheee! Oh! Hello! I'm Brother Pennant. The last Wind Monk. It's just me.`),
  xl('f_pennant',`The others blew away. Not sadly! On purpose! They went to ride the winds of the far south. They send postcards. The postcards blow away.`,`The others blew away. On purpose! They send postcards. The postcards blow away.`),
  xl('f_pennant',`Then the purple moth came, and Old Frostfeather went funny, and now I live on this kite.`,`Then the purple moth came. Old Frostfeather went funny. Now I live on this kite.`),
  xl('ash',`Who's Old Frostfeather?`,`Who's Old Frostfeather?`),
  xl('f_pennant',`The temple owl! Big as a house. Gentle as a pillow. She ate one of those purple moths and now she's all... pecky. She lives at the very top.`,`The temple owl! Big as a house. She ate a purple moth. Now she's pecky. She lives at the top.`),
  xl('f_pennant',`Ember came here once, a long, long time ago, and learned to ride the wind from the first monks. They said she left a flame inside. Maybe it's been waiting for you.`,`Ember came here long ago. She learned to ride the wind. She left a flame inside. For you, maybe.`),
  xl('ash',`Will you come in with me?`,`Will you come in with me?`),
  xl('f_pennant',`Oh, it would be lovely! But I'm a kite person now. Wheee. Good luck!`,`Oh, I'm a kite person now. Wheee! Good luck!`)
]);
STORY.f_pennant_home=S(`Ride the down-ribbon home! It's the one with the arrow pointing down! Wheee!`,`Ride the down-ribbon home! Wheee!`);
// Chapter 4, The Stonehorn Knock
STORY.f_gap_lines=[['tove',S(`The Howling Gap. Very deep. Very windy. Very no.`,`The Howling Gap. Very deep. Very no.`)],['ash',S(`Very YES!`,`Very YES!`)]];
STORY.f_horned=S(`A ram's skull as big as a house, with a door in its mouth. Somewhere deep inside, something is snoring like a rockslide.`,`A huge ram skull with a door in its mouth. Something inside snores.`);
// Chapter 5, The Dreadgate
f2sDef('f_dreadgate',[
  xl('narr',`The Dreadgate. Two doors of black ice as tall as a castle, carved with a dragon curled around the moon. A lock as big as a cart sits in the middle, sealed with purple frost.`,`The Dreadgate. Two doors of black ice, tall as a castle. A huge lock of purple frost.`),
  xl('narr',`The wind off the mountain is so cold it has a sound. It goes "nnnnnn".`,`The wind is so cold it makes a sound: "nnnnnn".`),
  xl('tove',`That's the Frost Lock. Look up. See the drum? Up on the mountain's shoulder.`,`That's the Frost Lock. Look up. See the drum on the mountain?`),
  xl('narr',`High above, on a ledge, sits a round stone drum with a ram's face carved on it.`,`High up on a ledge sits a stone drum with a ram's face.`),
  xl('ash',`The Stonehorn knock. I have to knock on THAT?`,`I have to knock on THAT?`),
  xl('tove',`From up there. The Wind Road starts at the big vent on the moor. Ride it up. Then come down on that drum like a sack of anvils.`,`The Wind Road starts at the big vent on the moor. Ride it up. Then land on the drum. HARD.`)
]);
f2sDef('f_drum',[
  xl('narr',`BOOOOOOM.`,`BOOOOOOM.`),
  xl('narr',`The sound rolls down the mountain like a wave. Snow jumps off every rock. Far below, a long crack runs across the Frost Lock.`,`The sound rolls down the mountain. Far below, the Frost Lock cracks.`),
  {who:'narr',text:S(`Then the crack stops. And above you, something white unfolds from the mountainside.`,`Then the crack stops. Something white unfolds above you.`),fn:()=>f2sHushShow('unfold')},
  xl('narr',`Two wings. Two purple eyes painted on them. And two real ones in the middle, blinking at you.`,`Two wings with purple eyes painted on them. And two real eyes, blinking.`),
  xl('f_hush',`Shhhhh. Shhhh, little ember. You're so LOUD.`,`Shhhh, little ember. You're so LOUD.`),
  xl('f_hush',`The Mother is resting. The Mother's new friend is resting. Everyone is resting. Why don't you rest too?`,`The Mother is resting. Everyone is resting. Why don't you rest too?`),
  xl('ash',`Who's "the Mother"?`,`Who's "the Mother"?`),
  xl('f_hush',`Shhhhh.`,`Shhhhh.`),
  xl('ash',`That is not an answer!`,`That is not an answer!`),
  {who:'narr',text:S(`The great moth glides down to the Dreadgate. Ride the wind back down and face her!`,`The moth glides down to the Dreadgate. Ride back down and face her!`),fn:()=>f2sHushShow('glide')}
]);
f2sDef('f_hush_intro',[
  xl('f_hush',`Shhh. Sleep now.`,`Shhh. Sleep now.`),
  f2sIf('c_vesper',`Hello, cousin. Miss me?`,`Hello, cousin. Miss me?`,()=>f2sVesper()),
  f2sIf('ash',`Vesper! What are you doing here?`,`Vesper! What are you doing here?`,()=>f2sVesper()),
  f2sIf('c_vesper',`That's the moth that whispered in my dreams. Every night for a year. "Bring me the Heart, little thief." I have a score to settle. Let's make it LOUD.`,`That moth whispered in my dreams for a year. Let's make it LOUD.`,()=>f2sVesper()),
  xdo(()=>{ if(f2sVesper()) G.flags.f_vesper_hush=1; })
]);
f2sDef('f_hush_outro',[
  {who:'narr',text:S(`Hush tumbles down into the snow. As she falls, she shrinks. And shrinks. Until she's just a little white moth, sitting on your claw.`,`Hush falls into the snow. She shrinks and shrinks. Now she's a little white moth on your claw.`),fn:()=>f2sHushShow('small')},
  xl('f_hush',`...Cold. It's so cold out here. The Mother promised a warm dark. A soft dark. Forever and ever.`,`Cold. It's so cold. The Mother promised a warm dark. Forever.`),
  xl('ash',`Get a sweater, little moth.`,`Get a sweater, little moth.`),
  {who:'narr',text:S(`The moth flutters up toward the moon and is gone.`,`The moth flies up to the moon. She is gone.`),fn:()=>f2sHushShow('away')},
  {who:'narr',text:S(`Behind you, the crack in the Frost Lock finishes its job. CRACK. The lock falls apart, and the Dreadgate opens.`,`CRACK! The Frost Lock falls apart. The Dreadgate opens!`),fn:()=>{ G.flags.f_hush_done=1; shake(8); try{ SFX.play('boom'); }catch(e){} }},
  f2sIf('c_vesper',`Go on, cousin. I'll watch the gate. Thieves are very good at watching gates. We know every trick.`,`Go on, cousin. I'll watch the gate. Thieves are good at that.`,()=>f2sVesper()),
  xdo(()=>f2sHushDone())
]);
// Chapter 5, into the mountain
f2sDef('f_dread_in',[
  xl('narr',`Inside Mount Dread it is quiet. Too quiet. The walls are black rock and purple ice, and everywhere you look there are chains. Big ones. Little ones. Chains on statues. Chains on bridges. Chains on nothing at all.`,`Inside the mountain it is too quiet. Black rock, purple ice, and chains everywhere.`),
  xl('tove',`Moth-frost chains. Glaciar's were the first. These are... practice ones, I think. Somebody practiced for a long time.`,`Moth-frost chains. Somebody practiced for a long time.`),
  xl('ash',`Then I'll practice melting them.`,`Then I'll practice melting them.`),
  f2sPip(`(Pip climbs into your hood and stays there.)`,`(Pip hides in your hood.)`)
]);
f2sDef('f_crown_door',[
  xl('narr',`The last chain snaps. The door at the top of the mountain swings open, and the blizzard pours in, howling.`,`The last chain snaps. The top door swings open. The blizzard howls in.`),
  xl('narr',`Then, all at once, the wind stops. Like someone pressed a button.`,`Then the wind stops. All at once.`),
  xl('tove',`She's right there, Ash. I can feel her. She's so cold she's almost warm.`,`She's right there, Ash. She's so cold she's almost warm.`),
  xl('ash',`Okay. Okay. I'm going to meet my auntie. Hat off. Be polite. Drink the ice tea.`,`Okay. I'm going to meet my auntie. Hat off. Be polite. Drink the ice tea.`)
]);
// Final Chapter, Auntie: the Crown of Dread
f2sDef('f_glaciar_intro',[
  {who:'narr',text:S(`The top of Mount Dread. No wind. No sound. In the middle of the summit, coiled around a spike of black ice, lies a dragon.`,`The top of Mount Dread. No wind. No sound. A dragon lies curled around a spike of black ice.`),fn:()=>f2sGlacShow('spell')},
  xl('narr',`She is white and blue and silver, as long as a river, with icicle horns and frost for whiskers. Four chains of purple frost hold her down, one to each corner of the summit. In her chest, something glows. The Shard.`,`She is white and blue, long as a river, with icicle horns. Four purple chains hold her down. In her chest glows the Shard.`),
  xl('ash',`Hi... Auntie?`,`Hi... Auntie?`),
  xl('f_glaciar',`...Fire. I smell fire. My brother's fire.`,`Fire. I smell fire. My brother's fire.`),
  xl('f_glaciar',`No. No, the Mother says fire is a lie. The Mother says dark is kind and cold is kind and sleep is the kindest of all. The Mother says...`,`No. The Mother says fire is a lie. Dark is kind. Cold is kind. Sleep is kindest. The Mother says...`),
  xl('narr',`Her eyes open. They're purple.`,`Her eyes open. They're purple.`),
  xl('f_glaciar',`The Mother says to put you out.`,`The Mother says to put you out.`),
  xl('tove',`Ash! Those chains aren't hers! Melt them, and maybe she'll remember who she is!`,`Ash! Those chains aren't hers! Melt them! Then she might remember!`)
]);
// one of these four by the Act I ending (G.choices.ending), for the free outro's "My brother. Is he...?"
const F2S_BROTHER=[
  f2sIf('ash',`He's gone, Auntie. His fire went out. I'm sorry.`,`He's gone, Auntie. His fire went out. I'm sorry.`,()=>f2sEnding()==='hero'),
  f2sIf('f_glaciar',`...Gone. Well. He chose to be a very loud, very angry dragon for a very long time. You chose something better. Don't be sorry, dumpling. Be warm.`,`Gone. Well. He chose to be loud and angry. You chose better. Don't be sorry, dumpling. Be warm.`,()=>f2sEnding()==='hero'),
  f2sIf('ash',`He's asleep on his mountain. I keep a fire there so he stays that way. I say goodnight to him every Lantern Day.`,`He's asleep on his mountain. I say goodnight to him every Lantern Day.`,()=>f2sEnding()==='warden'),
  f2sIf('f_glaciar',`Goodnight? To VORLAX? Ha! He must hate that. Good. Keep doing it.`,`Goodnight? To VORLAX? Ha! He must hate that. Keep doing it.`,()=>f2sEnding()==='warden'),
  f2sIf('ash',`He's, um. Small now. He lives in a birdcage. In a bakery. Bertram charges admission.`,`He's small now. He lives in a birdcage. In a bakery.`,()=>f2sEnding()==='heir'),
  f2sIf('narr',`Glaciar laughs. It sounds like a thousand icicles chiming at once. Snow slides off the whole mountain.`,`Glaciar laughs like a thousand icicles. Snow slides off the mountain.`,()=>f2sEnding()==='heir'),
  f2sIf('f_glaciar',`A BIRDCAGE! Oh, I must visit. I'll bring a mirror so he can see his own face.`,`A BIRDCAGE! I must visit. I'll bring a mirror.`,()=>f2sEnding()==='heir'),
  f2sIf('ash',`He came home. He's about the size of a goat now. He lives with my mom. He really, really likes cake.`,`He came home. He's goat-sized now. He lives with my mom. He LOVES cake.`,()=>f2sEnding()==='lantern'),
  f2sIf('f_glaciar',`...Vorlax likes CAKE? He always said cake was for hatchlings. Oh, the old fibber. Oh, I'm so glad.`,`Vorlax likes CAKE? He said cake was for babies. Oh, I'm so glad.`,()=>f2sEnding()==='lantern')
];
f2sDef('f_glaciar_free',[
  {who:'narr',text:S(`The Shard pops out of Glaciar's chest like a cork from a bottle and lands in the snow, ringing like a tiny bell.`,`The Shard pops out of her chest like a cork. It rings in the snow.`),fn:()=>f2sGlacShow('awake')},
  xl('narr',`The last of the purple drains out of her eyes. They're blue now. Pale, kind, sleepy blue, like a winter morning.`,`The purple leaves her eyes. They're blue now. Kind and sleepy.`),
  xl('f_glaciar',`Oh. Oh my. Oh, my head. Did I... did I make a blizzard?`,`Oh my. My head. Did I make a blizzard?`),
  xl('ash',`A big one. Over the whole north. And a bit of the south. And a lot of the coast.`,`A big one. Over the whole north. And the coast.`),
  xl('f_glaciar',`Oh, I'm so sorry. I'm a slow-winter dragon. One gentle snow a year, for the sledding. I don't DO blizzards. Blizzards are rude.`,`Oh, I'm so sorry. I make one gentle snow a year, for sledding. Blizzards are rude.`),
  xl('f_glaciar',`Come here. Let me look at you. ...Horns. Tail. That nose. You're Ember's. You're one of Ember's!`,`Come here. Horns. Tail. That nose. You're one of Ember's!`),
  xl('ash',`I'm Ash. Hi. I'm your great, great... Auntie, I'm your great x13 grand-nephew.`,`I'm Ash. I'm your great x13 grand-nephew.`),
  xl('f_glaciar',`A NEPHEW! I have a NEPHEW! Come here, dumpling, let me pinch your cheeks!`,`A NEPHEW! Come here, dumpling! Let me pinch your cheeks!`),
  xl('narr',`She pinches your cheek with one enormous claw. Very, very gently. It's cold. It's also the nicest pinch you have ever had.`,`She pinches your cheek with a huge claw. Very gently. It's the nicest pinch ever.`),
  xl('ash',`(squished) Hi, Auntie.`,`(squished) Hi, Auntie.`),
  xl('f_glaciar',`Wait. Thirteen greats? Ember was my NIECE, dumpling. If she's thirteen, then I'm fourteen.`,`Wait. Ember was my NIECE. So I'm fourteen greats.`),
  xl('ash',`I am NOT saying fourteen.`,`I am NOT saying fourteen.`),
  f2sPip(`Mip? (Pip hides behind your leg. Then he decides she's nice.)`,`Mip? (Pip hides. Then he decides she's nice.)`),
  f2sIf('f_glaciar',`And you... you made the big snowflake with me. In a dream? Dragons dream long dreams, dumpling.`,`You made the big snowflake with me. In a dream!`,()=>G.flags.dr_f_auntie==='flake'),
  xl('f_glaciar',`Tell me, dumpling. My brother. Vorlaxis. Is he...?`,`Tell me. My brother, Vorlaxis. Is he...?`),
  ...F2S_BROTHER,
  xl('f_glaciar',`Now. The Shard. Take it. It doesn't belong in a dragon. It belongs to your family.`,`Now take the Shard. It belongs to your family.`),
  xdo(()=>{ if(!G.items.f_shard2) giveItems({f_shard2:1}); }),
  xl('narr',`You pick up the Shard. It's warm again. Next to the first one in your pocket, it hums, like two notes of the same song.`,`You pick up the Shard. It's warm again. It hums with the first one.`),
  xl('f_glaciar',`Listen, dumpling, because this is important. The one who put that spell on me. The one the moths call the Mother.`,`Listen, dumpling. This is important. The one the moths call the Mother.`),
  xl('f_glaciar',`Her name is Nyxara. She's old. Older than me. Older than my brother. She's the moon's old moth.`,`Her name is Nyxara. She's older than me. She's the moon's old moth.`),
  xdo(()=>{ G.flags.f_nyx_named=1; }),
  xl('ash',`The moon has a MOTH?`,`The moon has a MOTH?`),
  xl('f_glaciar',`Every light has a moth, dumpling. She circled the moon so long she forgot it wasn't hers. Now she wants to eat it. All of it. A night that never ends.`,`Every light has a moth. She thinks the moon is hers. She wants to eat it. A night that never ends.`),
  xl('f_glaciar',`But a moon doesn't just go out. To make the endless night she needs a black fire. A fire that burns dark instead of bright. And there's only one fire old enough to turn black.`,`To make the endless night, she needs a black fire. Only one fire is old enough.`),
  xl('ash',`The First Flame. The Ember Heart.`,`The First Flame. The Ember Heart.`),
  xl('f_glaciar',`That's why she stole it. That's why she broke it. One piece went to the coast, one came to me, and one went east, to where the moon's light fell, a long time ago.`,`That's why she broke it. One piece went to the coast. One came to me. One went east.`),
  xl('f_glaciar',`I can't stay here, dumpling. I made a blizzard. I'm a danger. I'll fly north, past the edge of the ice, where I can't hurt anybody.`,`I can't stay. I made a blizzard. I'll fly far north, where I can't hurt anyone.`),
  xc('ash',`What do you say?`,`What do you say?`,()=>[
    xo(`You're the Snow Mother. Hearthold still sings about you.`,`You're the Snow Mother!`,{tone:'kind',cond:()=>!!G.flags.f_song,fn:()=>{ G.choices.f_glaciar_home='stay'; },then:()=>STORY.f_glaciar_stay}),
    xo(`Go and rest, Auntie. Come back when you're ready.`,`Go and rest, Auntie.`,{tone:'kind',fn:()=>{ G.choices.f_glaciar_home='north'; },then:()=>STORY.f_glaciar_north})
  ])
]);
f2sDef('f_glaciar_stay',[
  xl('ash',`They put a flower on the Great Hearth every Lantern Day. They sing a song about a Snow Mother with icicle horns who kept the town safe. It's you, Auntie. Listen.`,`Hearthold sings about a Snow Mother with icicle horns. It's you, Auntie. Listen.`),
  xl('narr',`You sing it. All three verses. Your voice cracks on the high bit. You keep going.`,`You sing all three verses. Your voice cracks. You keep going.`),
  xl('narr',`Glaciar closes her eyes. A tear rolls down her face and freezes into a perfect little star before it hits the snow.`,`Glaciar closes her eyes. A tear freezes into a little star.`),
  xl('f_glaciar',`Ember wrote that song. My Ember. She sang it to me every winter. She called me Auntie Glee, because she said I laughed like wind chimes.`,`Ember wrote that song. She called me Auntie Glee. She said I laughed like wind chimes.`),
  xl('f_glaciar',`...They still sing it? After a thousand years?`,`They still sing it? After a thousand years?`),
  xl('ash',`They didn't know who it was about. Now they will.`,`They didn't know it was about you. Now they will.`),
  xl('f_glaciar',`Then I'll stay. Someone has to keep the north. One gentle snow a year. For the sledding.`,`Then I'll stay. One gentle snow a year. For sledding.`),
  xl('narr',`Glaciar breathes out, slow and soft. Far below, in Rimeholm and on the roads and the moor, every frozen person in the north gives a little shiver, and wakes up.`,`Glaciar breathes out, slow and soft. Every frozen person in the north wakes up.`),
  xdo(()=>{ f2sThawAll(); }),
  xl('tove',`Oh. OH. I remember now. Ember's North Forge. She built it with her auntie. With HER. How could I forget a dragon?`,`Oh! I remember now. Ember built the North Forge with her auntie. With HER!`),
  xl('f_glaciar',`Easily, dear. I'm very quiet.`,`Easily, dear. I'm very quiet.`)
]);
f2sDef('f_glaciar_north',[
  xl('f_glaciar',`I will, dumpling. I will. And if you ever need a dragon, a cold one, a slow one, the kind that's good for cooling soup, call me. I'll come.`,`I will, dumpling. If you ever need a cold, slow dragon, call me. I'll come.`),
  xl('narr',`She shakes the snow off her wings.`,`She shakes the snow off her wings.`)
]);
f2sDef('f_glaciar_defeat',[
  {who:'narr',text:S(`Glaciar crashes down into the snow. The whole mountain shakes. The purple chains pull tight around her.`,`Glaciar crashes into the snow. The mountain shakes. The chains pull tight.`),fn:()=>f2sGlacShow('down')},
  xl('narr',`The Shard cracks out of the ice over her heart and rolls to your feet.`,`The Shard cracks out of her heart. It rolls to your feet.`),
  xdo(()=>{ if(!G.items.f_shard2) giveItems({f_shard2:1}); }),
  xl('f_glaciar',`(very sleepy) ...Nyxara. The moon's... old moth. She wants... the night. Forever. She needs... your fire... burned black...`,`(sleepy) Nyxara. The moon's moth. She wants the night forever. She needs your fire... burned black...`),
  xdo(()=>{ G.flags.f_nyx_named=1; }),
  xl('f_glaciar',`(a whisper) ...Ember? Is that you?`,`(a whisper) Ember? Is that you?`),
  {who:'narr',text:S(`Her eyes close. Snow begins to cover her, gently, like a blanket.`,`Her eyes close. Snow covers her like a blanket.`),fn:()=>f2sGlacShow('sleep')},
  xl('tove',`She's asleep. Not hurt. Just asleep. The chains will keep her that way, I think. A long, long time.`,`She's asleep. Not hurt. The chains keep her asleep. For a long time.`),
  xc('ash',`What do you do?`,`What do you do?`,()=>[
    xo(`Sing her the Snow Mother's Song`,`Sing her the song`,{tone:'kind',cond:()=>!!G.flags.f_song,fn:()=>{ G.choices.f_glaciar='free'; G.flags.f_glaciar_sung=1; G.choices.f_glaciar_home='stay'; },then:()=>STORY.f_glaciar_sung}),
    xo(`Let her sleep`,`Let her sleep`,{then:[xl('ash',`Sleep well, Auntie. I'm sorry. I'll come back for you. I promise.`,`Sleep well, Auntie. I'll come back. I promise.`),xl('narr',`You tuck the snow around her horns, the way Mom tucks your blanket. It's the best you can do.`,`You tuck the snow around her horns, like Mom tucks your blanket.`),
      f2sIf('narr',`(If you knew the Snow Mother's Song, you could sing her awake. Brynja in Hearthold knows where the verses are.)`,`(A song could wake her. Ask Brynja in Hearthold.)`,()=>!G.flags.f_song)]})
  ])
]);
f2sDef('f_glaciar_sung',[
  xl('narr',`You kneel by her ear and sing. The first verse is about a sleepy dragon. The second is about a girl with horns. The third is about a fire that never goes out.`,`You kneel by her ear and sing. A sleepy dragon. A girl with horns. A fire that never goes out.`),
  xl('narr',`One by one, the chains go soft. Then slushy. Then they drip away into nothing.`,`One by one, the chains melt away.`),
  {who:'narr',text:S(`Glaciar opens one eye. It's blue.`,`Glaciar opens one eye. It's blue.`),fn:()=>f2sGlacShow('awake')},
  xl('f_glaciar',`...Ember used to sing me that. Who taught you that, dumpling?`,`Ember sang me that. Who taught you, dumpling?`),
  xl('ash',`Hearthold did. They still sing it. It's about you, Auntie.`,`Hearthold did. It's about you, Auntie.`),
  xl('f_glaciar',`Oh. Oh, my. Then I suppose I'd better stay and earn it.`,`Oh my. Then I'd better stay and earn it.`),
  xl('narr',`She breathes out, slow and soft, and every frozen person in the north gives a little shiver and wakes up.`,`She breathes out, soft and slow. Every frozen person in the north wakes up.`),
  xdo(()=>{ f2sThawAll(); }),
  xl('f_glaciar',`Nyxara wants the last piece, dumpling. It's east, where the moon's light fell. When you're ready to go, I'll fly you. Slowly. I only do slowly.`,`Nyxara wants the last piece. It's east. I'll fly you there. Slowly. I only do slowly.`)
]);
// Duchess on the spike (THREADS 14.3): x2_people may own the words (it loads first); these stand in otherwise
if(!STORY.f_duchess) f2sDef('f_duchess',[
  xl('narr',`On the very tip of the black ice spike, at the top of the tallest mountain in the north, stands a goat. In a tiny scarf.`,`On top of the black ice spike stands a goat. In a tiny scarf.`),
  xl('goat',`Meh.`,`Meh.`),
  xl('ash',`DUCHESS? How did you even... You know what. I don't want to know.`,`DUCHESS? How did you... I don't want to know.`),
  xdo(()=>{ G.flags.f_duchess=1; addCoins(30); gainXp(60); })
]);
f2sDef('f_night',[
  xl('narr',`That night the Great Hearth burns gold and blue and doesn't flicker once. Pim gives out free cocoa. Captain Brann is not afraid of anything at all, and says so, loudly, until he falls asleep in a chair.`,`That night the Great Hearth burns gold and blue. Free cocoa! Captain Brann is brave. Then he falls asleep in a chair.`),
  xl('f_brynja',`Thank you, child. My old girl says thank you too. She says it in sparks.`,`Thank you, child. My old girl says thank you too. In sparks.`),
  f2sIf('narr',`Somewhere on the mountain, an ice dragon sleeps under a blanket of snow. You promised to come back. You will.`,`An ice dragon sleeps under the snow. You promised to come back. You will.`,()=>G.choices.f_glaciar==='defeat'),
  f2sIf('narr',`High on the mountain, an ice dragon hums an old song to herself, and the snow falls slow and gentle, the way it should.`,`On the mountain, an ice dragon hums an old song. The snow falls soft and slow.`,()=>G.choices.f_glaciar==='free'),
  xl('narr',`Before you close your eyes, you look up. The moon is out. It's beautiful. It's also smaller. Like somebody took a bite out of the edge.`,`You look up at the moon. It's beautiful. But smaller. Someone took another bite.`),
  xdo(()=>{ G.flags.f_moon_bite3=1; G.flags.f_nyx_named=1; f2sMoon(85); }),
  xl('nyxara',`Two pieces, little ember. Two out of three. You're doing so well.`,`Two pieces, little ember. Two of three. You're doing so well.`),
  xl('nyxara',`Come east. Bring them both. I'll leave a light on.`,`Come east. Bring them both. I'll leave a light on.`),
  xl('ash',`...I really, really hate moths.`,`I really, really hate moths.`)
]);
// Tove's "where now" hints (bible 6.14): the journal Hint button and Yara's talk
STORY.f_hints={
  f_snow:S(`Frostpine Lodge, in the far north-west of Embermere. Ulf will know about the pass.`,`Go to Frostpine Lodge, far north-west. Ask Ulf about the pass.`),
  f_pass:S(`Up the High Pass, then follow the White Road east to Hearthold. Look for the town with the round wall and the chimney smoke.`,`Climb the High Pass. Follow the White Road east to Hearthold.`),
  f_hearth:S(`The Hearthkeeper is at the Great Hearth, right in the middle of town. Big fireplace. Can't miss it.`,`The Hearthkeeper is at the Great Hearth, in the middle of town.`),
  f_maze:S(`The North Gate is frozen shut. Ask Captain Brann at the West Gate for the way round to the Glacier Maze.`,`The North Gate is frozen. Ask Captain Brann the way round.`),
  f_kindle:S(`Hold your fire breath until it turns blue and give it to the Great Hearth. Don't be shy.`,`Hold your fire until it turns blue. Give it to the Hearth.`),
  f_thaw:S(`Rimeholm is west, on the sea cliffs. Somebody there must have seen what froze it. Look closely at everything.`,`Rimeholm is west, on the cliffs. Who saw what froze it?`),
  f_sky:S(`East on the Wind Road, up onto the Windscour. From the east rim, fly the updraft out to the Sky Isles.`,`Go east up the Wind Road. Fly from the east rim to the Sky Isles.`),
  f_gap:S(`The wind ribbons on the Windscour's north rim cross the Howling Gap. Stonehorn Deep is the giant ram skull.`,`Ride the wind ribbons over the Howling Gap. Find the giant ram skull.`),
  f_deep:S(`Deep in the Stonehorn halls. Pound everything that looks cracked.`,`Pound everything that looks cracked.`),
  f_dreadgate:S(`Those doors won't open for asking. Look at the Frost Lock, and look up at the mountain. Then think.`,`Look at the lock. Look up at the mountain. Think.`),
  f_dread:S(`Up through the mountain. Melt every chain. I'm right here with you.`,`Go up through the mountain. Melt every chain.`),
  f_glaciar:S(`She's on the summit. Melt the four chains, Ash. She's not bad. She's under a spell.`,`She's on top. Melt the four chains. She's under a spell.`)
};
// Tove's line in Yara's talk: the story data's own hint for the step Ash is on when the data owns the stage (the data's
// hints say where to look and never a Case Book answer), else the table above
function f2sToveHint(){ let h=''; try{ const D=typeof stageDef==='function'?stageDef(G.stage):null; if(D&&D._s10&&typeof D.hint==='function') h=D.hint()||''; }catch(e){ console.error(e); } return h||STORY.f_hints[G.stage]||STORY.f_hints.f_snow; }
STORY.f_yara=S(`Pebble tells me how you're getting on up there, Ash. Listen to Tove.`,`Pebble tells me how you are. Listen to Tove.`);

// ---------- 4. the dungeon story lines (bible section 7), played by the dungeon helpers (x2_dun_a, x2_dun_b).
// Pass f2sDunStory(id) as defineDungeon's `story` (or play any key with f2sPlay(key)); F2STORY.md lists each key.
// The Glacier Maze (f_maze): Blaze Breath
f2sDef('f_maze_in',[
  xl('tove',`Oh, it's beautiful. Oh, it's FREEZING. Oh, both.`,`Oh, it's pretty. Oh, it's FREEZING.`),
  xl('tove',`Mind the ice, Ash. Ice is just floor that wants you to fall over.`,`Mind the ice. Ice is floor that wants you to fall.`)
]);
f2sDef('f_maze_hjalmar_cold',[xl('narr',`A frozen explorer stands in the ice, caught in the middle of a sneeze. Your breath only makes the ice sweat a little.`,`A frozen explorer, mid-sneeze. Your fire only makes the ice drip.`)]);
f2sDef('f_maze_hjalmar',[
  xl('f_hjalmar',`...ACHOO! Oh. Excuse me. How long was I mid-sneeze?`,`ACHOO! Oh. Excuse me. How long was I sneezing?`),
  xl('ash',`About a month.`,`About a month.`),
  xl('f_hjalmar',`Longest sneeze in history. Here, for your trouble. And bless me.`,`The longest sneeze ever! Here, take this. Bless me.`)
]);
f2sDef('f_maze_pantry',[xl('tove',`A whole mammoth steak, frozen in a block. Somebody was saving that for a very big supper.`,`A frozen mammoth steak! Somebody saved it for supper.`)]);
f2sDef('f_maze_diary',[
  xl('narr',`Inside the chest, wrapped in oilcloth, is a little book with a snowflake on the cover. Ember's Ice Diary.`,`In the chest is a little book with a snowflake on it. Ember's Ice Diary.`),
  xl('narr',`"Auntie took me sledding today. She makes the hill and I make the cocoa. She laughs like wind chimes. I call her Auntie Glee. She pretends to hate it."`,`"Auntie took me sledding. She makes the hill. I make the cocoa. I call her Auntie Glee."`),
  xl('ash',`Auntie Glee. Ember had an auntie who laughed like wind chimes.`,`Auntie Glee. Ember had an auntie who laughed like wind chimes.`),
  xdo(()=>{ if(G.items&&!G.items.f_icediary) giveItems({f_icediary:1},true); G.flags.f_icediary=1; })
]);
f2sDef('f_maze_shrine',[
  xl('ember',`Oh! A visitor. In the cold! Hello, little ember.`,`Oh! A visitor in the cold! Hello, little ember.`),
  xl('ash',`Grandma Ember! I mean, just Ember.`,`Grandma Ember! I mean, just Ember.`),
  xl('ember',`You remembered! I built this forge a long, long time ago, with my auntie. She did the cold parts. I did the hot parts. We were a very good team.`,`I built this forge long ago with my auntie. She did the cold parts. I did the hot parts.`),
  xl('ash',`Your AUNTIE? Wait, then she's my great great great...`,`Your AUNTIE? Then she's my great great great...`),
  xl('ember',`Don't. You'll be here all day.`,`Don't. You'll be here all day.`),
  xl('ember',`I left a little of my hottest fire here. The blue kind. For a day when the cold got too big. I think that day is today.`,`I left my hottest fire here. The blue kind. For a day when the cold got too big. That's today.`)
]);
f2sDef('f_maze_gift',[
  xl('narr',`The flame turns from gold to white to blue. It pours into you like hot cocoa on a snowy day.`,`The flame turns gold, then white, then blue. It pours into you like hot cocoa.`),
  xl('ember',`Blaze! Hold your fire breath a moment longer and it burns blue and reaches far. It melts ice walls, wakes frozen folk, and lights braziers even far away.`,`Blaze! Hold your fire longer. It burns blue and reaches far. It melts ice and wakes frozen folk.`),
  xl('ash',`I'm going to melt EVERYTHING.`,`I'm going to melt EVERYTHING.`),
  xl('ember',`Not everything. Leave the snowmen. Snowmen have feelings.`,`Not everything. Leave the snowmen. They have feelings.`)
]);
STORY.f_maze_how=S(`Hold FIRE BREATH. After a moment the flame turns blue and reaches far: that's Blaze. Melt ice, thaw people, light far braziers.`,`Hold fire breath. It turns blue: Blaze! Melt ice. Thaw people.`);
f2sDef('f_maze_sigrid',[
  xl('f_sigrid',`Brrrr. Thank you, dragon! I've been stuck since the moth. I was looking for the furnace key.`,`Brrrr. Thank you, dragon! I was stuck since the moth came.`),
  xl('f_sigrid',`Here, take my small key. It opens the shaft door. I'm going home to Hearthold for a very long bath.`,`Take my small key. It opens the shaft door. I'm going home for a bath.`)
]);
f2sDef('f_maze_dam',[xl('narr',`The last ice wall gives way. A rumble. Then the whole lake of meltwater roars west and pours down a shaft in the floor, like the biggest bath ever emptied.`,`The last ice wall melts. The water roars down a hole in the floor!`)]);
f2sDef('f_blubberton_intro',[
  xl('narr',`A huge walrus in a dented helmet waddles out from behind an ice shield. He adjusts his monocle.`,`A huge walrus in a helmet waddles out. He fixes his monocle.`),
  xl('f_blubberton',`I say! Unhand my hall, you scaly scamp!`,`I say! Leave my hall, you scaly scamp!`),
  xl('ash',`It's not your hall. It's Ember's forge.`,`It's not your hall. It's Ember's forge.`),
  xl('f_blubberton',`Possession is nine tenths of the law! Tally ho!`,`I'm sitting in it, so it's mine! Tally ho!`)
]);
f2sDef('f_blubberton_won',[
  xl('f_blubberton',`Harrumph. Jolly good show, old bean. Here, the furnace key. I was only guarding it because nobody told me to stop.`,`Harrumph. Jolly good show. Here's the furnace key. Nobody told me to stop guarding it.`),
  xl('narr',`Lord Blubberton waddles off to take a bath.`,`Lord Blubberton waddles off to take a bath.`)
]);
f2sDef('f_bellows_intro',[
  xl('narr',`In the middle of the dead forge stands a golem as big as a cottage. Brass belly, anvil fists, a great leather bellows on his back. Plates of purple moth-frost cover his chest and arms.`,`A golem as big as a cottage stands in the forge. Brass belly. Anvil fists. Purple frost armor.`),
  xl('f_bellows',`CLANK. Bellows... cold... Purple cold says: no fire.`,`CLANK. Bellows cold. Purple cold says: no fire.`),
  xl('tove',`That's Old Bellows, Ember's forge keeper! The frost has got him. Melt it off!`,`That's Old Bellows, Ember's forge keeper! Melt the frost off him!`)
]);
STORY.f_maze_bossline=S(`Old Bellows! Blaze melts his ice armor. Melt a plate, then hit what's under it. Seal the frost vents when he tries to freeze back up!`,`Blaze his ice armor! Then hit him. Seal the frost vents!`);
f2sDef('f_maze_won',[
  xl('narr',`The purple frost cracks off Old Bellows like an eggshell. Underneath he is warm brass and soot and rivets.`,`The purple frost cracks off Old Bellows. Underneath he is warm brass.`),
  xl('f_bellows',`...Fff. Fwooosh. Warm?`,`Fff. Fwooosh. Warm?`),
  xl('f_bellows',`Little ember. You smell like the boss.`,`Little ember. You smell like the boss.`),
  xl('ash',`The boss? You mean Ember?`,`The boss? You mean Ember?`),
  xl('f_bellows',`Ember. And the Cold One. They made Bellows. Bellows kept the forge. Then the bad cold came. The purple cold. Bellows forgot.`,`Ember and the Cold One made Bellows. Then the purple cold came. Bellows forgot.`),
  xl('f_bellows',`Bellows will light the forge again. Bellows will keep it warm until somebody needs it.`,`Bellows will light the forge again. And keep it warm.`),
  xl('narr',`Old Bellows gives you a hug. It's like being hugged by a toasty oven that loves you.`,`Old Bellows hugs you. Like a warm oven that loves you.`)
]);
f2sDef('f_maze_end',[
  xl('ember',`The forge is warm again. I can feel it, all the way from wherever I am.`,`The forge is warm again. I can feel it.`),
  xl('ember',`Go and wake the Great Hearth, little ember. My auntie and I lit it together, a thousand years ago. It's been waiting for someone with the right fire.`,`Go and wake the Great Hearth. My auntie and I lit it long ago. It waits for the right fire.`),
  xl('narr',`Step into the warp ring to go back outside.`,`Step into the warp ring to go outside.`)
]);
// Skyreach Temple (f_sky): Wind Riding
f2sDef('f_sky_in',[xl('tove',`A temple in the sky. Full of wind. Full of cold wind. Of course it is.`,`A temple in the sky. Full of cold wind. Of course.`)]);
f2sDef('f_sky_hats',[xl('tove',`Hats! Hundreds of hats! There's MY hat! I lost that in the year 312!`,`Hats! Hundreds of hats! There's MY hat!`)]);
f2sDef('f_sky_lesson',[xl('f_pennant',`(from outside, on his kite) Wheee! Good! Steer with your feet!`,`(from outside) Wheee! Good! Steer with your feet!`)]);
f2sDef('f_sky_mural',[xl('narr',`A mural on the wall: three birds in a row. A small one. A big one. A medium one. Under them, three bells.`,`A picture: a small bird, a big bird, a medium bird. And three bells.`)]);
f2sDef('f_sky_shrine',[
  xl('ember',`You found my flame! I hid this one up high, so only someone who wasn't afraid of heights would find it.`,`You found my flame! I hid it up high. For someone not afraid of heights.`),
  xl('ash',`I'm a little afraid of heights.`,`I'm a little afraid of heights.`),
  xl('ember',`So was I. That's why it counts.`,`So was I. That's why it counts.`)
]);
f2sDef('f_sky_gift',[
  xl('narr',`The flame turns into a ribbon of warm wind. It wraps around you once, twice, and tucks itself in under your scales.`,`The flame turns into warm wind. It wraps around you and tucks in.`),
  xl('ember',`Wind Riding! Jump into a wind ribbon and it will carry you, like a leaf on a river. Steer with your feet. Jump to hop off. And updrafts will lift you right up.`,`Wind Riding! Jump into a wind ribbon. It carries you like a leaf. Jump to hop off.`),
  xl('ash',`I'm a LEAF.`,`I'm a LEAF.`),
  xl('ember',`The bravest leaf.`,`The bravest leaf.`)
]);
STORY.f_sky_how=S(`Jump into a wind ribbon to ride it. Steer a little left and right. Press JUMP to hop off. Stand in an updraft to rise.`,`Jump into a wind ribbon to ride. Jump again to hop off.`);
f2sDef('f_squall_intro',[
  xl('f_squall',`Whoosh! Visitors!`,`Whoosh! Visitors!`),
  xl('f_squeak',`Wheeee-hee! Can we keep him?`,`Wheeee-hee! Can we keep him?`),
  xl('f_squall',`Tag, you're IT!`,`Tag, you're IT!`)
]);
f2sDef('f_squall_won',[xl('f_squeak',`No fair! You're too good at tag!`,`No fair! You're too good at tag!`),xl('f_squall',`Fine. FINE. The key's in the chest. Whoosh.`,`Fine. The key is in the chest. Whoosh.`)]);
f2sDef('f_frostfeather_intro',[
  xl('narr',`At the top of the tower, on a nest as wide as a pond, sits an owl as big as a house. Violet dust glitters in her eyes. The little tuft on her head is sticking straight up.`,`At the top sits an owl as big as a house. Purple dust glitters in her eyes. Her tuft sticks up.`),
  xl('f_frostfeather',`HOO! HOOOOO!`,`HOO! HOOOOO!`),
  xl('f_pennant',`(from outside, on his kite) Be gentle with her! She's just poorly!`,`(from outside) Be gentle! She's just poorly!`)
]);
STORY.f_sky_bossline=S(`Old Frostfeather! Hit her when she lands. When she flies too high, ride the updraft up and Blaze the moth dust out of her eyes!`,`Hit her when she lands! When she flies high, ride up and Blaze her eyes!`);
f2sDef('f_sky_won',[
  xl('narr',`Glittery purple dust pours out of Old Frostfeather's feathers. She sneezes. A whole cloud of little moths shoots out of her beak and flutters away, looking embarrassed.`,`Purple dust falls out of her feathers. She sneezes. Little moths fly out of her beak.`),
  xl('f_frostfeather',`Hoo? Hoooo.`,`Hoo? Hoooo.`),
  xl('narr',`Her eyes are gold now, round and kind. She tilts her head all the way upside down and looks at you.`,`Her eyes are gold now, round and kind. She tilts her head upside down.`),
  xl('f_pennant',`(from outside, on his kite) She's back! Her eyes are gold again! Old girl! OLD GIRL!`,`(from outside) She's back! Her eyes are gold again!`),
  xl('narr',`Frostfeather tucks Brother Pennant under one wing, kite and all, like a chick. He doesn't seem to mind one bit.`,`Frostfeather tucks Brother Pennant under her wing, kite and all.`)
]);
f2sDef('f_sky_end',[
  xl('ember',`Two of my flames in one winter. My auntie would be proud of you. I am.`,`Two of my flames in one winter. My auntie would be proud. I am.`),
  xl('ember',`The Howling Gap is no match for you now. Go and find the Stonehorns. Knock loudly. They're a bit deaf.`,`Now cross the Howling Gap. Find the Stonehorns. Knock loudly.`),
  xl('narr',`Step into the warp ring to go back outside.`,`Step into the warp ring to go outside.`)
]);
// Stonehorn Deep (f_deep): Ground Pound
f2sDef('f_deep_in',[
  xl('tove',`It's warmer down here. Not WARM. Warmer. I'll take it.`,`It's warmer down here. Not WARM. Warmer.`),
  xl('narr',`From somewhere deep below comes a snore like a rockslide.`,`From deep below comes a snore like a rockslide.`)
]);
f2sDef('f_deep_shrine',[
  xl('ember',`Hello again! This flame I learned from a very grumpy ram. He taught me to knock.`,`Hello again! A grumpy ram taught me this one. He taught me to knock.`),
  xl('ash',`Knock? Like on a door?`,`Knock? Like on a door?`),
  xl('ember',`Like on a door the size of a mountain.`,`Like on a door the size of a mountain.`)
]);
f2sDef('f_deep_gift',[
  xl('narr',`The flame drops into you like a stone into a pond. Your feet feel heavy. In a good way. In a SMASHING way.`,`The flame drops into you like a stone. Your feet feel heavy. In a SMASHING way.`),
  xl('ember',`Ground Pound! Jump, then come down HARD. You'll break cracked floors, flip pound switches, and knock the armor right off grumpy things.`,`Ground Pound! Jump, then come down HARD. Break cracked floors. Knock off armor.`),
  xl('ash',`I'm a ROCK.`,`I'm a ROCK.`),
  xl('ember',`The bravest rock.`,`The bravest rock.`)
]);
STORY.f_deep_how=S(`Jump, then press POUND (attack in the air) to slam down. Break cracked floors, flip pound switches, crack armor and ice.`,`Jump, then attack in the air to slam down!`);
f2sDef('f_deep_crack',[xl('narr',`A sign by the cracked floor says: GOING DOWN? KNOCK.`,`A sign says: GOING DOWN? KNOCK.`)]);
f2sDef('f_deep_echo',[xl('tove',`It's pitch black. Pound the floor and listen. Knock, look, walk. Knock, look, walk.`,`It's dark. Pound and look. Knock, look, walk.`)]);
f2sDef('f_rockjaw_intro',[xl('f_rockjaw',`ROLL ROLL ROLL! I'm not round, I'm big-boned!`,`ROLL ROLL ROLL! I'm not round! I'm big-boned!`)]);
f2sDef('f_rockjaw_won',[xl('f_rockjaw',`Dizzy. So dizzy. The key's over there. Don't roll it. I'm begging.`,`So dizzy. The key is over there.`)]);
f2sDef('f_grumblehorn_intro',[
  xl('narr',`On a throne carved out of the mountain sits a ram the size of a barn. His wool is like grey stone. His huge curled horns ring with violet light.`,`On a stone throne sits a ram as big as a barn. His horns glow purple.`),
  xl('f_grumblehorn',`HRRRMPH! Who's KNOCKING?`,`HRRRMPH! Who's KNOCKING?`),
  xl('ash',`Me! Ash! I came about the Dreadgate.`,`Me! Ash! I came about the Dreadgate.`),
  xl('f_grumblehorn',`Get off my lawn! I don't have a lawn! Get off it anyway!`,`Get off my lawn! I don't have a lawn! Get off it anyway!`)
]);
STORY.f_deep_bossline=S(`King Grumblehorn! When he charges, raise a pillar in his way. When his horns are stuck, jump up and POUND him!`,`When he charges, raise a pillar! When his horns stick, POUND him!`);
f2sDef('f_deep_won',[
  xl('narr',`King Grumblehorn's horns stop glowing purple. He sits down so hard the whole room bounces.`,`The King's horns stop glowing. He sits down so hard the room bounces.`),
  xl('f_grumblehorn',`Hrrrrmph. My head. Who's been banging on my head?`,`Hrrrmph. My head. Who banged on my head?`),
  xl('ash',`Me. Sorry.`,`Me. Sorry.`),
  xl('f_grumblehorn',`Hrm. Good drumming. VERY good. Haven't heard drumming like that since the old days.`,`Hrm. Good drumming. VERY good.`),
  xl('f_grumblehorn',`You want the Dreadgate? Climb to the Drum Stone on the mountain's shoulder. Knock like that, and she'll open.`,`You want the Dreadgate? Go up to the Drum Stone on the mountain. Knock like that. She'll open.`),
  xl('ash',`She?`,`She?`),
  xl('f_grumblehorn',`The Gate. Or the dragon. One of them. Both are very old ladies. Both are very cold. Hrrrmph. Off you go.`,`The Gate. Or the dragon. Both are very old ladies. Both are cold. Off you go.`)
]);
f2sDef('f_deep_lamb',[xl('f_lamb',`Baaa! (A baby Stonehorn with tiny rock horns headbutts your knee. It's adorable. It also hurts.)`,`Baaa! (A baby ram headbutts your knee. Cute. Ouch.)`)]);
f2sDef('f_deep_end',[
  xl('ember',`Three flames in one winter. You have all the fire I left in the north now. The rest is up to you.`,`Three flames in one winter. You have all my northern fire now.`),
  xl('ember',`Go and knock on the mountain, little ember. And when you see her... tell my auntie I miss her.`,`Go and knock on the mountain. And tell my auntie I miss her.`),
  xl('narr',`Step into the warp ring to go back outside.`,`Step into the warp ring to go outside.`)
]);
// The Heart of Dread (f_dread): every power, no gift (f_dread_in and f_crown_door are in section 3)
f2sDef('f_dread_bridge',[xl('tove',`That drawbridge is chained up. Pound the plate to crack the dome, then Blaze the lock before it freezes over again.`,`Pound the plate. Then Blaze the lock, quick!`)]);
f2sDef('f_dread_eye',[xl('tove',`That violet eye on the wall keeps refreezing everything. Shoot it shut first. Arrows in the pupil.`,`That purple eye refreezes things. Shoot it shut!`)]);
f2sDef('f_dread_choir',[xl('narr',`Twelve Hearthold soldiers stand frozen in rows, mouths open, as if they were singing. Four of them are wearing purple frost armor. One of them opens an eye.`,`Twelve frozen soldiers stand in rows, like a choir. One opens an eye.`)]);
STORY.f_dread_soldier=S(`Where's my lunch? Was there a lunch? I was promised a lunch!`,`Where's my lunch? I was promised a lunch!`);
f2sDef('f_dread_choir_key',[xl('f_soldier',`Here, I found this in my boot. It's not my boot. Thank you, dragon. Which way is lunch?`,`I found this key in my boot. It's not my boot. Which way is lunch?`)]);
f2sDef('f_dread_nest',[xl('tove',`Moths love lamps. Every moth. It's very embarrassing for them. Light the corner lamps and they'll forget all about the stairs.`,`Moths love lamps. Light the corner lamps. They'll forget the stairs.`)]);
f2sDef('f_dread_chimney',[xl('tove',`A wind chimney! Ride the ribbons up. Hide in the niches when the blizzard blows across.`,`Ride the ribbons up! Hide when the blizzard blows.`)]);
f2sDef('f_grumbo_intro',[
  xl('narr',`A huge white yeti with violet eyes thumps his chest. A small lunchbox is chained to his belt.`,`A huge yeti with purple eyes thumps his chest. A lunchbox hangs on his belt.`),
  f2sIf('f_mumble',`(peeking in, very quietly) (squeak) ...that's Grumbo. He took my lunch every day for ninety years.`,`(squeak) That's Grumbo. He took my lunch for ninety years.`,()=>!!(G.flags.f_mumble_ally||(G.quests.f_mumble&&G.quests.f_mumble.done))),
  xl('f_grumbo',`Grumbo SMASH! Grumbo smash... a little.`,`Grumbo SMASH! Grumbo smash a little.`)
]);
f2sDef('f_grumbo_won',[
  xl('f_grumbo',`Okay okay okay! I give up! Mumble can have his lunch back!`,`Okay! I give up! Mumble can have his lunch back!`),
  f2sIf('f_mumble',`(squeak) ...thank you.`,`(squeak) Thank you.`,()=>!!(G.flags.f_mumble_ally||(G.quests.f_mumble&&G.quests.f_mumble.done))),
  f2sIf('f_grumbo',`...Sorry, Mumble.`,`Sorry, Mumble.`,()=>!!(G.flags.f_mumble_ally||(G.quests.f_mumble&&G.quests.f_mumble.done)))
]);
f2sDef('f_dread_dragons',[xl('tove',`Ice statues of old dragons. All chained. Don't wake the big ones. Please. I'm begging.`,`Old dragon statues. Don't wake the big ones. Please.`)]);
f2sDef('f_dread_egg',[xl('narr',`The ice egg in the little dragon's arms cracks open. Inside, warm and red, is a Heart Ember.`,`The ice egg cracks open. Inside is a warm Heart Ember!`)]);
f2sDef('f_dread_nursery',[
  xl('narr',`A tiny round room with a nest of frost and very old toys: giant ice knitting needles, a snowglobe, and a carving of two baby dragons. One is breathing fire on the other one's tail. The other is crying icicles.`,`A tiny room with old toys. A carving of two baby dragons: one breathes fire on the other's tail.`),
  xl('tove',`Siblings. Some things never change.`,`Siblings. Some things never change.`)
]);
f2sDef('f_dread_stair',[
  xl('tove',`Last room. Then her. Are you scared?`,`Last room. Then her. Are you scared?`),
  xl('ash',`Yes.`,`Yes.`),
  xl('tove',`Good. Me too. Let's go.`,`Good. Me too. Let's go.`)
]);
f2sDef('f_dread_lastchain',[xl('tove',`Four chains on the last door. One of them you can only reach from outside. Through that window, I think. Brr.`,`Four chains on the door. One is outside, by the window.`)]);
// boss and miniboss taunts and lines (x2_foes may use them: each is S(full,simple))
const F2S_TAUNTS={
  f_bellows:[S('CLANK.','CLANK.'),S('Bellows... cold...','Bellows cold.'),S('Purple cold says: no fire.','Purple cold says no fire.')],
  f_bellows3:[S('FWOOOOSH!','FWOOOOSH!')],
  f_frostfeather:[S('HOO!','HOO!'),S('HOOOOO!','HOOOOO!')], f_frostfeather2:[S('Hoo hoo hoo!','Hoo hoo hoo!')],
  f_grumblehorn:[S('HRRRMPH!','HRRRMPH!'),S(`Get off my lawn! I don't have a lawn! Get off it anyway!`,`Get off my lawn!`),S('My HORNS!','My HORNS!')],
  f_hush:[S('Shhhh.','Shhhh.'),S('Too loud, too loud.','Too loud!'),S('Rest, little ember.','Rest, little ember.')], f_hush_lamp:[S('Ooooh. Prettyyy.','Ooooh. Pretty.')],
  f_glaciar:[S('Sleep, little ember. Sleep under the snow.','Sleep under the snow.'),S('The Mother says cold is kind.','The Mother says cold is kind.'),S('The long night is coming. Lie down.','The long night is coming.')],
  // (the same words as x2_foes' F2_CHAIN_LINES, full and simple: f2sSay does not repeat a line the foe module just said)
  f_glaciar_chain:[S(`...Fire? Warm fire? I knew a little girl with fire like that...`,`Fire? Warm fire? I knew a girl with fire like that...`),
    S(`The Mother says... no. NO. Who IS the Mother? I don't have a mother. I have a brother. A loud one.`,`Who is the Mother? I have a brother. A loud one.`),
    S(`Little one. Your horns. You have her horns. Ember's horns!`,`Your horns! You have Ember's horns!`),
    S(`The Shard! It's in my heart! Get it OUT, dumpling, before it freezes me again! And mind my tail, I can't help the tail!`,`The Shard is in my heart! Get it out, dumpling!`)],
  f_glaciar_warn:[S('Duck, dumpling!','Duck!'),S('Jump!','Jump!'),S('Mind your head!','Mind your head!')],
  tove_glaciar:[S('Melt the chains!','Melt the chains!'),S('Up on the ledge! Climb!','Climb up the ledge!'),S('The vent! Ride it to the slab!','Ride the vent up!'),S('Her chest! Hit the Shard!','Hit the Shard!')],
  nyxara_n9:S('Sleep, little cold one. Be cold for me.','Sleep, cold one. Be cold for me.'),
  f_blubberton:[S('I say! Unhand my hall, you scaly scamp!','Leave my hall!'),S('Tally ho!','Tally ho!'),S('Ow! Most rude!','Ow! Rude!')],
  f_squall:[S('Whoosh!','Whoosh!')], f_squeak:[S('Wheeee-hee!','Wheeee-hee!')], f_squalls:[S(`Tag, you're IT!`,`Tag, you're IT!`)],
  f_rockjaw:[S('ROLL ROLL ROLL!','ROLL ROLL ROLL!'),S(`I'm not round, I'm big-boned!`,`I'm big-boned!`)],
  f_grumbo:[S('Grumbo SMASH! Grumbo smash... a little.','Grumbo SMASH!'),S('My KNUCKLES!','My KNUCKLES!')]
};
// the fight lines are also on STORY, for x2_foes: STORY.f_taunts.f_glaciar_chain[n-1] and so on
STORY.f_taunts=F2S_TAUNTS;
// what defineDungeon's `story` should be for each Act III dungeon (keys as e9a expects them)
const F2S_DUNKEYS={
  f_maze:{in:'f_maze_in',shrine:'f_maze_shrine',gift:'f_maze_gift',how:'f_maze_how',boss:'f_bellows_intro',bossline:'f_maze_bossline',won:'f_maze_won',end:'f_maze_end'},
  f_sky:{in:'f_sky_in',shrine:'f_sky_shrine',gift:'f_sky_gift',how:'f_sky_how',boss:'f_frostfeather_intro',bossline:'f_sky_bossline',won:'f_sky_won',end:'f_sky_end'},
  f_deep:{in:'f_deep_in',shrine:'f_deep_shrine',gift:'f_deep_gift',how:'f_deep_how',boss:'f_grumblehorn_intro',bossline:'f_deep_bossline',won:'f_deep_won',end:'f_deep_end'},
  f_dread:{in:'f_dread_in'}};
function f2sDunStory(id){ const M=F2S_DUNKEYS[id]||{}; const o={}; for(const k in M) o[k]=STORY[M[k]]; return o; }
// defaults, so a dungeon registered without a `story` still says the right things (a later defineDungeon story wins)
for(const id in F2S_DUNKEYS){ const st=f2sDunStory(id); for(const k in st) if(st[k]&&!STORY['trial_'+id+'_'+k]) STORY['trial_'+id+'_'+k]=st[k]; }
// the two outdoor bosses' words, through the stock boss flow (a9c_story plays STORY.bosses[type].intro when Ash walks
// into the site and .outro when the boss falls at hp 0). x2_foes owns the sites and the fights; the story owns the
// words: STORY.bosses.f_hush and .f_glaciar get these lines (again at world build, in case a site was defined late).
// Glaciar's .outro is a getter that picks the outcome when she falls (free: all four chains melted; defeat: any chain
// left); .outroFree / .outroDefeat are the two full sequences for a foe module that decides by itself. Fight set-up
// belongs in the site's onStart, not in these lines.
const f2sHasLines=(arr,mine)=>Array.isArray(arr)&&Array.isArray(mine)&&mine.length>1&&arr.includes(mine[1]);
STORY.f_glaciar_outro_free=[xdo(()=>{ f2sQuiet(); G.choices.f_glaciar='free'; G.bossDone.f_glaciar=true; F2ST.glacEnd=true; }),...STORY.f_glaciar_free,xdo(()=>f2sAfterGlaciar())];
STORY.f_glaciar_outro_defeat=[xdo(()=>{ f2sQuiet(); if(G.choices.f_glaciar!=='free') G.choices.f_glaciar='defeat'; G.bossDone.f_glaciar=true; F2ST.glacEnd=true; }),...STORY.f_glaciar_defeat,xdo(()=>f2sAfterGlaciar())];
function f2sBossWords(){
  if(!STORY.bosses) STORY.bosses={};
  const H=STORY.bosses.f_hush||(STORY.bosses.f_hush={intro:[],outro:[]});
  if(!f2sHasLines(H.intro,STORY.f_hush_intro)) H.intro=STORY.f_hush_intro;
  if(!f2sHasLines(H.outro,STORY.f_hush_outro)) H.outro=STORY.f_hush_outro;
  const Gl=STORY.bosses.f_glaciar||(STORY.bosses.f_glaciar={intro:[],outro:[]});
  if(!f2sHasLines(Gl.intro,STORY.f_glaciar_intro)) Gl.intro=STORY.f_glaciar_intro;
  const d=Object.getOwnPropertyDescriptor(Gl,'outro');
  if(!(d&&d.get&&d.get.f2s)){ const get=()=>f2sGlaciarOutro(); get.f2s=true;
    try{ Object.defineProperty(Gl,'outro',{get,set(v){ Gl._f2sOther=v; },configurable:true,enumerable:true}); }catch(e){ console.error(e); } }
  Gl.outroFree=STORY.f_glaciar_outro_free; Gl.outroDefeat=STORY.f_glaciar_outro_defeat;
}
f2sBossWords();

// ---------- 5. the stages (bible 6.0). Cards as the bible gives them; f_snow's card shows after Mom's letter.
const F2S_CARD={f_snow:['Act III · Chapter 1',S('A Letter in the Snow','A Letter in the Snow')],f_hearth:['Act III · Chapter 2',S('The Dying Hearth','The Dying Hearth')],
  f_thaw:['Act III · Chapter 3',S('One Thaw at a Time','One Thaw at a Time')],f_gap:['Act III · Chapter 4',S('The Stonehorn Knock','The Stonehorn Knock')],
  f_dreadgate:['Act III · Chapter 5',S('The Dreadgate','The Dreadgate')],f_glaciar:['Act III · Final Chapter',S('Auntie','Auntie')]};
const f2sHint=st=>()=>STORY.f_hints[st];
// on the Windscour plateau / on the Sky Isles (by elevation when the map has it, by area when it does not)
function f2sElev(){ try{ return typeof elevOf==='function'?elevOf(player)|0:0; }catch(e){ return 0; } }
function f2sLvlAt(x,y){ try{ return typeof elevLvl==='function'?elevLvl(x,y)|0:0; }catch(e){ return 0; } }
const f2sOnWindscour=()=>f2sOut()&&player.x>8600&&player.x<11050&&player.y>44300&&player.y<47650&&(f2sLvlAt(9800,46000)<2||f2sElev()>=2);
const f2sOnIsles=()=>f2sOut()&&player.x>11100&&player.y>45600&&player.y<48200&&(f2sLvlAt(F2SP.templeIsle.x,F2SP.templeIsle.y)<3||f2sElev()>=3);
const f2sAcrossGap=()=>f2sOut()&&player.y<43600&&player.x>9200;
defineStages(3,[
  {id:'f_snow',chapter:S('A Letter in the Snow','A Letter in the Snow'),at:{x:1560,y:3540},
    objectives:()=>[f2sObj('Go to Frostpine Lodge and talk to Ulf','Go to Frostpine Lodge. Talk to Ulf.',f2sWho('ulf',F2SP.lodge.x,F2SP.lodge.y))],
    hint:f2sHint('f_snow'),
    soFar:S('It is snowing in summer. Mom\'s letter says the cold comes over the High Pass by Frostpine Lodge.','It snows in summer. The cold comes over the High Pass by Frostpine Lodge.'),
    mom:[S(`Snow in summer! Did you get my letter? Did you get my SOUP?`,`Snow in summer! Did you get my letter?`)],
    marker:id=>id==='ulf',
    enter(o){ if(!f2sSeen('f_intro')) later(o.load?1.6:3.4,()=>f2sWhen('intro',null,()=>f2sIntro())); },
    talk(n){ if(n.id!=='ulf') return false;
      // (Mom's letter first, if Pebble has not brought it yet: Ash cannot know about the pass without it)
      const pre=f2sSeen('f_intro')?[]:[xdo(()=>{ if(!G.flags.f_pb_1){ G.flags.f_pb_1=1; G.coins=Math.max(0,(G.coins|0)-1); } }),...STORY.f_intro];
      f2sPlay([...pre,...STORY.f_lodge],()=>{ F2ST.introDone=true; f2sHat(); gainXp(150); later(1.4,()=>goStage('f_pass')); }); return true; }},
  {id:'f_pass',chapter:S('A Letter in the Snow','A Letter in the Snow'),at:{x:1000,y:3330},
    objectives:()=>curMap()===2?[{text:S('Follow the White Road to Hearthold','Follow the White Road to Hearthold'),x:F2SP.westGate.x,y:F2SP.westGate.y}]
      :[{text:S('Climb the High Pass north of the Lodge','Climb the High Pass, north of the Lodge'),x:F2SP.passS.x,y:F2SP.passS.y}],
    hint:f2sHint('f_pass'),
    soFar:S('The High Pass is open. Beyond it lies Frostreach, a white land under a humming purple storm.','The High Pass is open. Beyond it is Frostreach, white and snowy.'),
    mom:[S(`Over the High Pass? Two scarves. I mean it.`,`Over the High Pass? Two scarves!`)],
    update(dt){ const F=G.flags;
      if(f2sOut()&&!F.f_arrived){ F.f_arrived=1; later(1.8,()=>f2sWhen('arrive',()=>f2sOut(),()=>f2sPlay('f_arrive',()=>questUpdated()))); }
      if(scene==='play'&&f2sNear(F2SP.westGate,260)&&!f2sSeen('f_gate')) f2sPlay('f_gate',()=>{ gainXp(200); goStage('f_hearth'); }); }},
  {id:'f_hearth',chapter:S('The Dying Hearth','The Dying Hearth'),card:F2S_CARD.f_hearth,at:{x:6260,y:49040},
    objectives:()=>[f2sObj('Talk to the Hearthkeeper at the Great Hearth','Talk to the Hearthkeeper at the Great Hearth',f2sWho('f_brynja',F2SP.brynja.x,F2SP.brynja.y))],
    hint:f2sHint('f_hearth'),
    soFar:S('Hearthold huddles around its dying Great Hearth. The Hearthkeeper needs Blaze to wake it.','Hearthold has a dying Great Hearth. It needs Blaze to wake up.'),
    mom:[S(`A town with a giant fireplace? That's my kind of town.`,`A town with a giant fireplace? Nice!`)],
    marker:id=>id==='f_brynja',
    talk(n){ if(n.id!=='f_brynja') return false; f2sPlay('f_brynja',()=>{ gainXp(200); goStage('f_maze'); }); return true; }},
  {id:'f_maze',chapter:S('The Dying Hearth','The Dying Hearth'),at:{x:6700,y:44900},
    objectives:()=>[f2sDunObj('f_maze','Cross the Glimmerfrost to the Glacier Maze','Cross the ice to the Glacier Maze',f2sAt('moat'))],
    hint:f2sHint('f_maze'),
    soFar:S('Blaze is in Ember\'s old North Forge, deep in the Glacier Maze across the Glimmerfrost.','Blaze is in the Glacier Maze, across the frozen lake.'),
    mom:[S(`A maze made of ice? Don't lick the walls.`,`An ice maze? Don't lick the walls.`)],
    talk(n){ if(n.id==='f_brynja'){ f2sPlay(STORY.f_brynja_wait); return true; } return false; },
    update(dt){ const F=G.flags;
      // (on the shore: x2_world's moat ring is open water out to r 380, so the "walk on water" lines play before Ash
      // has to step onto it)
      if(!f2sSeen('f_moat')&&scene==='play'&&f2sNear(F2SP.moat,490)) f2sPlay('f_moat');
      if(F.trial_f_maze_done) goStage('f_kindle'); }},
  {id:'f_kindle',chapter:S('The Dying Hearth','The Dying Hearth'),at:{x:6800,y:49160},
    objectives(){ const F=G.flags;
      if(!F.f_hearth_lit) return [{text:S('Wake the Great Hearth with Blaze','Wake the Great Hearth with Blaze'),x:F2SP.hearth.x,y:F2SP.hearth.y}];
      return [{text:S('Melt Hearthold\'s frozen North Gate with Blaze','Melt the frozen North Gate'),x:F2SP.northGate.x,y:F2SP.northGate.y}]; },
    hint:f2sHint('f_kindle'),
    soFar:S('Ash has Blaze! Now to wake the Great Hearth and melt Hearthold\'s North Gate.','Ash has Blaze! Now wake the Great Hearth.'),
    mom:[S(`BLUE fire? Your grandmother set a river on fire once. Don't.`,`Blue fire? Don't set a river on fire.`)],
    marker:id=>id==='f_brynja'&&!G.flags.f_hearth_lit,
    talk(n){ if(n.id==='f_brynja'&&!G.flags.f_hearth_lit){ f2sPlay(STORY.f_brynja_blue); return true; } return false; },
    update(dt){ const F=G.flags;
      if(!F.f_pb_2&&!F2ST.pb2&&f2sOut()){ F2ST.pb2=1; later(2.4,()=>f2sLetter('f_pb_2')); }
      if(F.f_hearth_lit&&!f2sSeen('f_kindle')) f2sWhen('kindle',null,()=>f2sKindle());
      if(F.f_northgate&&F.f_hearth_lit&&f2sSeen('f_kindle')&&!f2sSeen('f_northgate')) f2sWhen('northgate',null,()=>f2sNorthGate()); }},
  {id:'f_thaw',chapter:S('One Thaw at a Time','One Thaw at a Time'),card:F2S_CARD.f_thaw,at:{x:2850,y:47380},
    objectives(){
      if(!f2sSeen('f_rime_arrive')) return [{text:S('Go to Rimeholm and find whoever knows the most','Go to Rimeholm. Find who knows the most.'),x:F2SP.tower.x,y:F2SP.tower.y}];
      return [{text:S('Climb the bell tower and thaw Grandmother Ylva with Blaze','Climb the bell tower. Thaw Grandmother Ylva.'),x:F2SP.tower.x,y:F2SP.tower.y}]; },
    hint:f2sHint('f_thaw'),
    soFar:S('Rimeholm froze in one night when the great moth flew over. Thaw whoever knows the most.','Rimeholm froze in one night. Thaw whoever knows the most.'),
    mom:[S(`A whole frozen village? Take them soup. Take them ALL soup.`,`A frozen village? Take them soup!`)],
    update(dt){ const F=G.flags;
      if(!f2sSeen('f_rime_arrive')&&scene==='play'&&f2sNear(f2sAt('rime'),600)) f2sPlay('f_rime_arrive',()=>questUpdated());
      if(f2sYlvaDue()) f2sWhen('ylva',null,()=>f2sYlva()); }},
  {id:'f_sky',chapter:S('One Thaw at a Time','One Thaw at a Time'),at:{x:10050,y:47800},
    objectives(){ const F=G.flags;
      if(f2sInArea('f_sky')) return [{text:S('Climb Skyreach Temple','Climb Skyreach Temple'),x:player.x,y:player.y,area:AREA.id}];
      if(!f2sSeen('f_on_windscour')&&!f2sSeen('f_on_isles')) return [{text:S('Climb onto the Windscour by the Wind Road','Go up onto the Windscour by the Wind Road'),x:F2SP.windRoad.x,y:F2SP.windRoad.y}];
      if(!f2sSeen('f_on_isles')) return [{text:S('Fly from the east rim to the Sky Isles (updraft, then wings)','Fly from the east rim to the Sky Isles'),x:F2SP.eastRim.x,y:F2SP.eastRim.y}];
      return [f2sDunObj('f_sky','Reach Skyreach Temple','Reach Skyreach Temple',F2SP.temple)]; },
    hint:f2sHint('f_sky'),
    soFar:S('Glaciar, the ice dragon, is Ash\'s great x13 grand-aunt. To climb Mount Dread, Ash must learn to ride the sky at Skyreach.','Glaciar the ice dragon is Ash\'s auntie! Ash must learn to ride the sky at Skyreach.'),
    mom:[S(`An AUNT? A dragon aunt? I'm going to need a minute.`,`A dragon aunt? I need a minute.`)],
    update(dt){ const F=G.flags;
      if(f2sOnWindscour()) f2sMark('f_on_windscour');
      if(f2sOnIsles()&&!f2sSeen('f_on_isles')){ f2sMark('f_on_isles'); questUpdated(); }
      if(!f2sSeen('f_rim_t')&&f2sNear(F2SP.eastRim,320)){ f2sMark('f_rim_t'); taunt('tove',STORY.f_rim_tove); }
      if(!f2sSeen('f_pennant')&&scene==='play'&&f2sNear(F2SP.templeIsle,400)&&(f2sLvlAt(F2SP.templeIsle.x,F2SP.templeIsle.y)<4||f2sElev()>=4)) f2sPlay('f_pennant',()=>{ gainXp(200); questUpdated(); });
      if(F.trial_f_sky_done) goStage('f_gap'); }},
  {id:'f_gap',chapter:S('The Stonehorn Knock','The Stonehorn Knock'),card:F2S_CARD.f_gap,at:{x:10000,y:44620},
    objectives(){ const F=G.flags;
      if(!F.f_gap_crossed) return [{text:S('Ride the wind across the Howling Gap','Ride the wind across the Howling Gap'),x:F2SP.gap.x,y:F2SP.gap.y}];
      return [f2sDunObj('f_deep','Find Stonehorn Deep in the Badlands (the giant ram skull)','Find Stonehorn Deep, the giant ram skull',F2SP.horned)]; },
    hint:f2sHint('f_gap'),
    soFar:S('Ash can ride the wind. Now across the Howling Gap to Stonehorn, for the knock that opens the Dreadgate.','Ash can ride the wind! Now cross the Howling Gap to Stonehorn.'),
    mom:[S(`Riding the WIND? Hold on to your hat. And your scarf. And your little brother. You don't have a little brother. Hold on anyway.`,`Riding the wind? Hold on to your hat!`)],
    update(dt){ const F=G.flags;
      if(!f2sSeen('f_pennant_home')&&f2sOut()&&scene==='play'){ f2sMark('f_pennant_home'); later(1.4,()=>taunt('f_pennant',STORY.f_pennant_home)); }
      const R=typeof WIND!=='undefined'&&WIND.ride?WIND.ride():null;
      if(R&&String(R.id||'').startsWith('f_rib_gap')&&!f2sSeen('f_gap_say')){ f2sMark('f_gap_say'); taunt('tove',STORY.f_gap_lines[0][1]); later(2.4,()=>taunt('ash',STORY.f_gap_lines[1][1])); }
      if(!F.f_gap_crossed&&f2sAcrossGap()&&!R){ F.f_gap_crossed=1; setBanner(S('Across the Howling Gap!','Across the Gap!'),S('Stonehorn country. Look for the giant ram skull.','Look for the giant ram skull.'),3); questUpdated(); saveGame(); }
      if(!f2sSeen('f_horned')&&f2sNear(F2SP.horned,400)){ f2sMark('f_horned'); setBanner(S('The Horned Gate','The Horned Gate'),STORY.f_horned,4.2); }
      if(f2sInArea('f_deep')){ F.f_gap_crossed=1; goStage('f_deep',{card:false}); } }},
  {id:'f_deep',chapter:S('The Stonehorn Knock','The Stonehorn Knock'),at:{x:12200,y:42600},
    objectives:()=>[f2sDunObj('f_deep','Explore Stonehorn Deep','Explore Stonehorn Deep',F2SP.horned)],
    hint:f2sHint('f_deep'),
    soFar:S('Stonehorn Deep: halls of giant rams, cracked floors and drums.','Stonehorn Deep: halls of giant rams and drums.'),
    update(dt){ if(G.flags.trial_f_deep_done) goStage('f_dreadgate'); }},
  {id:'f_dreadgate',chapter:S('The Dreadgate','The Dreadgate'),card:F2S_CARD.f_dreadgate,at:{x:7300,y:44620},
    objectives(){ const F=G.flags;
      if(G.boss&&!G.boss.dead&&G.boss.type==='f_hush') return [{text:S('Defeat Hush. Light the lamps!','Defeat Hush! Light the lamps!'),x:G.boss.x,y:G.boss.y,fight:true}];
      if(F.f_drum) return [{text:S('Defeat Hush at the Dreadgate','Defeat Hush at the Dreadgate'),x:F2SP.plaza.x,y:F2SP.plaza.y}];
      if(!f2sSeen('f_dreadgate')) return [{text:S('Go to the Dreadgate at the foot of Mount Dread','Go to the Dreadgate, below Mount Dread'),x:F2SP.dreadgate.x,y:F2SP.dreadgate.y}];
      if(f2sNear(F2SP.drum,420)&&(f2sLvlAt(F2SP.drum.x,F2SP.drum.y)<3||f2sElev()>=3)) return [{text:S('Knock on the Drum Stone with a Ground Pound','Ground Pound the Drum Stone'),x:F2SP.drum.x,y:F2SP.drum.y}];
      return [{text:S('Ride the Wind Road up to the Drum Stone (the big vent on the moor)','Ride the Wind Road up to the drum'),x:F2SP.windRoadStart.x,y:F2SP.windRoadStart.y}]; },
    hint:f2sHint('f_dreadgate'),
    soFar:S('Ash can pound like a Stonehorn. The Drum Stone waits on the mountain\'s shoulder.','Ash can pound like a Stonehorn. Now knock on the Drum Stone.'),
    mom:[S(`Knocking on a MOUNTAIN? Wipe your feet first.`,`Knocking on a mountain? Wipe your feet.`)],
    update(dt){ const F=G.flags;
      if(!F.f_pb_3&&!F2ST.pb3&&f2sOut()){ F2ST.pb3=1; later(2.4,()=>f2sLetter('f_pb_3')); }
      if(!f2sSeen('f_dreadgate')&&scene==='play'&&f2sNear(F2SP.dreadgate,300)) f2sPlay('f_dreadgate',()=>questUpdated());
      if(F.f_drum&&!f2sSeen('f_drum')) f2sWhen('drum',null,()=>f2sDrum());
      if(F.f_drum&&f2sSeen('f_drum')&&!F.f_hush_done) f2sHushTick(dt);
      if(F.f_hush_done) f2sWhen('hushdone',null,()=>f2sHushDone()); }},
  {id:'f_dread',chapter:S('The Dreadgate','The Dreadgate'),at:{x:7300,y:44420},
    objectives:()=>[f2sDunObj('f_dread','Climb through the Heart of Dread','Climb through the Heart of Dread',F2SP.dreadgate)],
    hint:f2sHint('f_dread'),
    soFar:S('Hush the moth is gone and the Dreadgate is open. Up through the Heart of Dread.','Hush is gone. The Dreadgate is open. Climb up inside the mountain.'),
    mom:[S(`Inside a mountain? Take a lantern. Take two. Take Pip, he glows.`,`Inside a mountain? Take a lantern!`)],
    update(dt){ const F=G.flags;
      // (the dungeon engine plays STORY.trial_f_dread_in, the same lines, half a second into the first room; this only
      // covers a Heart of Dread registered without them)
      if(!f2sSeen('f_dread_in')&&f2sInArea('f_dread')) f2sWhen('dread_in',q=>q.t>1.4&&f2sInArea('f_dread'),()=>{ if(!f2sSeen('f_dread_in')) f2sPlay('f_dread_in'); });
      if(!F.f_crown_open&&f2sOut()&&scene==='play'&&dist(player.x,player.y,F2SP.crown.x,F2SP.crown.y)<760) f2sCrownDoor(); }},
  {id:'f_glaciar',chapter:S('Auntie','Auntie'),card:F2S_CARD.f_glaciar,at:{x:F2SP.crownIn.x,y:F2SP.crownIn.y},
    objectives(){ if(G.flags.f_done||G.choices.f_glaciar) return [];
      if(G.boss&&!G.boss.dead&&G.boss.type==='f_glaciar'){ const n=f2sChains(); return [{text:n>=4?S('All four chains are gone! Hit the Shard in her chest','Hit the Shard in her chest!'):S(`Melt the four chains on the Chain Stones (${n} of 4)`,`Melt the chains (${n} of 4)`),x:G.boss.x,y:G.boss.y,fight:true}]; }
      const L=f2sNextLock(); if(L){ const n=f2sChains(); return [{text:S(`Melt the four chains on the Chain Stones (${n} of 4)`,`Melt the chains (${n} of 4)`),x:L.x,y:L.y}]; }
      // (Ash who fell in the fight wakes at the shrine he last used, below the mountain or on another map: the way back
      // up is through the Heart of Dread; e1_maps routes the marker over the crossings from another map)
      const onCrown=curMap()===2&&!AREA&&f2sElev()>=6;
      if(f2sInArea('f_dread')||!onCrown) return [f2sDunObj('f_dread','Climb back up through the Heart of Dread to the Crown','Climb back up to the top of the mountain',F2SP.dreadgate)];
      return [{text:S('Face Glaciar on the Crown of Dread','Face Glaciar on top of the mountain'),x:F2SP.crown.x,y:F2SP.crown.y}]; },
    idle:()=>G.flags.f_done?S('The north is warm again. Rest at a shrine or an inn when you are ready for the next part of the story.','Rest when you are ready for more story.')
      :G.choices.f_glaciar?S('The Crown of Dread is quiet. Night is coming to Hearthold.','The mountain is quiet. Night is coming.'):'',
    hint:()=>G.flags.f_done?S(`You did it, Ash. The north is warm again. When you're ready, the story goes east. I'll stay here, if you don't mind. I've had enough wind for one winter.`,`You did it! When you're ready, the story goes east.`):STORY.f_hints.f_glaciar,
    soFar:()=>G.flags.f_done?(G.choices.f_glaciar==='free'?S('Glaciar is free and herself again. She gave Ash the second Shard and told him the name of the one behind it all: Nyxara, the moon\'s old moth, who wants a night that never ends. That night the moon had another bite out of it.','Glaciar is free! She gave Ash Shard 2. The one behind it all is Nyxara, the moon\'s moth. The moon has another bite gone.')
      :S('Glaciar fell asleep under the snow, still chained. She gave Ash the second Shard and whispered a name: Nyxara, the moon\'s old moth. That night the moon had another bite out of it.','Glaciar sleeps under the snow. Ash has Shard 2. The name is Nyxara. The moon has another bite gone.'))
      :S('At the top of Mount Dread, Glaciar lies bound in purple chains with the second Shard in her heart.','At the top of Mount Dread, Glaciar lies in purple chains. Shard 2 is in her heart.'),
    mom:[S(`Tell your auntie I said hello. And to stop it with the snow.`,`Say hello to your auntie for me.`)],
    update(dt){ f2sGlaciarTick(dt); }}
]);
// the whole act: Mom's snow letter plays when Act III starts (from Act II's "Continue the story", or a rest after it);
// __eb.actStart(3) puts a test save outside Frostpine Lodge at f_snow (the bible's loadout: section 13.2)
defineAct(3,{arrive:'f_snow',at:{x:1560,y:3540},intro(o){ later(3.3,()=>f2sWhen('intro',null,()=>f2sIntro())); },
  kit:{level:13,abil:['jump','stride','wings','dbljump','skimmer','claws','grapple','shadow'],weapons:['sword','daggers','spear','hammer','bow','boomerang','whip','chainwhip'],tier:3,coins:400,bless:12,items:{c_shard1:1}}});
// story talk outside the stage hooks: Yara's line about Pebble's letters, Brynja after the Hearth, Vesper at the gate
onTalk(n=>{
  if(!f2sOn()) return false;
  const F=G.flags;
  if(n.id==='yara'&&!F2ST.yara[G.stage]){ F2ST.yara[G.stage]=1; f2sPlay([['yara',STORY.f_yara],['tove',f2sToveHint()]]); return true; }
  if(n.id==='c_vesper'&&n.f2sGate){ f2sPlay([xl('c_vesper',`Nobody gets past me, cousin. I know every way into a place. I've used most of them.`,`Nobody gets past me, cousin.`),
    f2sIf('c_vesper',`Go on up. Bring your auntie home.`,`Go on up. Bring your auntie home.`,()=>!G.choices.f_glaciar)]); return true; }
  return false;
});
// Elka has gone sledding by the time Ulf shows Ash the pass (she turns up again in the north: x2_people)
{ const base=npcPresent; npcPresent=function(id){ try{ if(id==='elka'&&G&&G.mode==='story'&&G.stage==='f_snow') return false; }catch(e){} return base(id); }; }
// the stock list adds "Travel to <site>" for open boss sites: during Act III the stage objectives already point there
{ const base=objectiveList; objectiveList=function(){ const out=base(); try{ if(f2sOn()&&out.some(o=>!o.site)) return out.filter(o=>o.site!=='f_hush'&&o.site!=='f_glaciar'); }catch(e){} return out; }; }
// the boss sites open only when the story is there (x2_foes' sites may add their own open tests)
{ const base=siteOpen; siteOpen=function(k){
  try{ if(G&&G.mode==='story'){ if(k==='f_hush'&&!(G.flags.f_drum&&reached('f_dreadgate'))) return false; if(k==='f_glaciar'&&!(reached('f_glaciar')&&!G.choices.f_glaciar)) return false; } }catch(e){}
  return base(k); }; }

// ---------- 6. the big beats (each one is safe to call twice)
// Mom's letters come by Pebble (e7b_threads' PEBBLE_MAIL); the act's first letter is the intro itself
function f2sLetter(id){
  if(G.flags[id]) return false;
  if(typeof pebbleNow==='function'&&typeof pebbleAll==='function'&&pebbleAll().some(d=>d.id===id)) return pebbleNow(id);
  // no shared letters module: read it straight away (Pebble still takes her coin)
  const d=F2S_MAIL[id]; if(!d) return false; G.flags[id]=1;
  const L=typeof d.lines==='function'?d.lines():d.lines;
  f2sPlay(L,()=>{ if(d.coin!==0){ G.coins=Math.max(0,(G.coins|0)-1); setBanner(S('Pebble took a shiny coin.','Pebble took a coin.'),'',2.4); } if(d.then) d.then(); });
  return true;
}
function f2sIntro(){
  if(f2sSeen('f_intro')){ f2sIntroDone(); return; }
  if(G.flags.f_pb_1||!f2sLetter('f_pb_1')) f2sPlay('f_intro',()=>f2sIntroDone());
  // if Pebble gives up (no calm for a long while), the letter is read the plain way on the next calm moment
  later(60,()=>{ if(G.stage==='f_snow'&&!f2sSeen('f_intro')){ G.flags.f_pb_1=0; f2sWhen('intro',null,()=>f2sPlay('f_intro',()=>f2sIntroDone())); } });
}
function f2sIntroDone(){
  if(F2ST.introDone) return; F2ST.introDone=true;
  const c=F2S_CARD.f_snow; showCard(simplify(c[0]),simplify(c[1])); later(3.1,questUpdated);
}
// the Great Hearth: Blaze held on it for 3 s at f_kindle
function f2sKindleFx(){
  const P=f2sLm('f_lm_hearth','hearth'); F2ST.hearthFx=3.2; flashA=0.6; flashCol='170,210,255'; shake(10);
  try{ SFX.play('boom'); jingle('levelup','level'); }catch(e){}
  for(let i=0;i<6;i++) later(i*0.16,()=>emit(P.x+rand(-30,30),P.y-30,30,{col:i%2?'120,190,255':'255,210,110',ang:-Math.PI/2,spread:0.5,smin:120,smax:460,lmin:.6,lmax:1.3,zmin:4,zmax:9,grow:10,rise:60}));
}
// the fire column out of the Great Hearth after the WHOOMPH (it also roars while the scene talks: see liteUpdate below)
function f2sHearthCol(dt){ if(!(F2ST.hearthFx>0)) return; F2ST.hearthFx-=dt; const P=f2sLm('f_lm_hearth','hearth'); if(Math.random()<0.9) emit(P.x+rand(-26,26),P.y-20,2,{kind:Math.random()<0.5?'bfire':'fire',ang:-Math.PI/2,spread:0.3,smin:200,smax:520,lmin:.5,lmax:1,zmin:4,zmax:9,grow:8}); }
// the story data (game/story/act3) asks for this module's pictures with storyEmit('f3fx:<name>'): the data has no
// flash or shake of its own. whoomph: the Hearth roars up (f_kindle.js f3_kindle). The engine's storyListen (I5) when
// it is there, else a wrapper round storyEmit
const F2S_FX={whoomph:()=>f2sKindleFx()};
{ const run=rest=>{ const m=/^(\w+)/.exec(String(rest||'')); if(!m) return; if(!F2S_FX[m[1]]){ console.error('x2_story: unknown f3fx:'+rest); return; } if(G&&G.mode==='story') F2S_FX[m[1]](); };
  if(typeof storyListen==='function') storyListen('f3fx:',rest=>{ try{ run(rest); }catch(e){ console.error(e); } });
  else { const base=storyEmit; storyEmit=function(name){ const r=base.apply(this,arguments); try{ const n=String(name||''); if(n.startsWith('f3fx:')) run(n.slice(5)); }catch(e){ console.error(e); } return r; }; window.storyEmit=storyEmit; } }
function f2sKindle(){
  if(f2sSeen('f_kindle')) return;
  f2sPlay('f_kindle',()=>{
    G.flags.f_hearth_lit=1; gainXp(400); addCoins(40);
    if(G.flags.f_pip_warm&&!F2ST.warmBanner){ F2ST.warmBanner=1; later(0.6,()=>setBanner(S('Pip learned Warm!','Pip can Warm!'),S('His belly glows. Frost near Pip melts faster.','Pip glows warm. Frost melts faster.'),3.6)); }
    later(G.flags.f_pip_warm?4.4:0.8,questUpdated);
  },{mood:'victory'});
}
// the North Gate: Blaze 2 s once the Hearth is lit
function f2sNorthGate(){
  if(f2sSeen('f_northgate')) return;
  G.flags.f_northgate=1;
  const P=f2sLm('f_lm_northgate','northGate');
  for(let i=0;i<24;i++) emit(P.x+rand(-70,70),P.y-rand(0,80),1,{col:'235,248,255',glow:false,ang:Math.PI/2,spread:0.6,smin:40,smax:160,lmin:.5,lmax:1,zmin:2,zmax:5});
  shake(5); try{ SFX.play('boom'); }catch(e){}
  f2sPlay('f_northgate',()=>{ gainXp(300); goStage('f_thaw'); });
}
// Grandmother Ylva on top of the bell tower: the frozen landmark's own flag (p3 'frozen', id f_ylva)
function f2sYlvaThawed(){ const F=G.flags; return !!(F.f_thaw_ylva||F.f_thaw_f_ylva||F.f_ylva_thawed); }
// (x2_people's frozen Ylva may play STORY.f_ylva itself as her thaw lines and set G.flags.f_ylva: then only the end
// of the beat runs here, once: the reward, Ylva's quest offer and the stage)
const f2sYlvaDue=()=>(f2sYlvaThawed()||!!G.flags.f_ylva)&&!f2sSeen('f_ylva_end');
function f2sYlva(){
  if(f2sSeen('f_ylva_end')) return;
  const fin=()=>{
    if(f2sSeen('f_ylva_end')) return; f2sMark('f_ylva_end');
    const F=G.flags; F.f_ylva=1; gainXp(500); addCoins(30); setupNPCs();
    // Ylva's own quest (x2_people, bible 10.5) is offered right after (G.flags.f_rime_offered: x2_people's own offer
    // uses the same flag, so it is offered once)
    const declined=()=>!!(G.declined&&G.declined.f_rime);
    if(typeof QDEFS!=='undefined'&&QDEFS.f_rime&&!G.quests.f_rime&&!F.f_rime_offered&&!declined()) later(1.2,()=>f2sWhen('rime_offer',null,()=>{ if(G.quests.f_rime||F.f_rime_offered||declined()) return; F.f_rime_offered=1; try{ offerQuest('f_rime'); }catch(e){ console.error(e); } }));
    if(G.stage==='f_thaw') later(0.4,()=>goStage('f_sky'));
    saveGame();
  };
  if(f2sSeen('f_ylva')) fin(); else f2sPlay('f_ylva',fin);
}
// the Drum Stone on the mountain's shoulder: only a Ground Pound (or a drum ring) there counts
function f2sDrumHit(x,y){
  if(!G||G.mode!=='story'||G.flags.f_drum||AREA||curMap()!==2||!reached('f_dreadgate')) return false;
  const P=f2sLm('f_lm_drum','drum'); if(dist(x,y,P.x,P.y)>96) return false;
  G.flags.f_drum=1; shake(14); flashA=0.4; flashCol='255,240,220';
  try{ SFX.play('boom'); }catch(e){}
  for(let i=0;i<3;i++) later(i*0.2,()=>emit(P.x,P.y,40,{col:'240,244,255',glow:false,smin:100,smax:420,lmin:.5,lmax:1,zmin:1.5,zmax:3,drag:1.5}));
  f2sWhen('drum',null,()=>f2sDrum()); saveGame(); return true;
}
function f2sDrum(){
  if(f2sSeen('f_drum')) return;
  // (knocked before Ash ever stood at the gate: Tove's "see the drum?" scene is past)
  f2sMark('f_dreadgate');
  // (Tove's "Jump, then slam down on it" nudge is said as Ash walks up to the drum: it is done now, and a line on the
  // top of the screen would stay up over the whole scene)
  f2sQuiet();
  F2ST.cam={x:(player.x+F2SP.plaza.x)/2,y:(player.y+F2SP.plaza.y)/2,k:0.35};
  f2sPlay('f_drum',()=>{ gainXp(300); questUpdated(); });
}
// Hush beaten: the Frost Lock breaks and the Dreadgate opens
function f2sHushDone(){
  const F=G.flags;
  if(F2ST.hushDoneRun) return; F2ST.hushDoneRun=true;
  F.f_hush_done=1; G.bossDone.f_hush=true; F2ST.hush=null; f2sLampsClear();
  if(G.stage==='f_dreadgate'){ later(0.6,()=>{ setBanner(S('The Dreadgate is open','The Dreadgate is open'),S('The way into Mount Dread.','Go inside the mountain.'),3.4); }); later(1.2,()=>goStage('f_dread')); }
  setupNPCs(); saveGame();
}
// the summit door at the top of the Heart of Dread (x2_dun_b calls f2sBeat('crown_door'); walking out onto the Crown
// at stage f_dread does it too)
function f2sCrownDoor(){
  if(G.flags.f_crown_open) return;
  G.flags.f_crown_open=1;
  f2sPlay('f_crown_door',()=>{ gainXp(400); goStage('f_glaciar'); });
}
// how many of Glaciar's four chains are melted. Sources: G.flags.f_chains (f2sBeat('chain',n) keeps it), the fight's
// foe (e.chainsMelted, or e.chains as a list of chain objects with done/melted/broken), a foe-module helper
// f2fChains(), and the stand-in's four locks
function f2sChainsOf(b){
  if(!b) return 0; let n=0;
  for(const k of ['chainsMelted','meltedChains','chainsDone']) if(typeof b[k]==='number') n=Math.max(n,b[k]|0);
  for(const k of ['chains','locks','chainLocks']){ const v=b[k]; if(Array.isArray(v)) n=Math.max(n,v.filter(c=>c&&(c===true||c.done||c.melted||c.broken||c.snapped||c.gone)).length); }
  return n;
}
function f2sGlacFoe(){ const b=G.boss&&G.boss.type==='f_glaciar'&&!G.boss.dead?G.boss:(F2ST.boss&&F2ST.boss.type==='f_glaciar'?F2ST.boss:null); return b||(G.enemies||[]).find(e=>e.type==='f_glaciar')||null; }
function f2sChains(){
  let n=Math.max(G.flags.f_chains|0,f2sChainsOf(f2sGlacFoe()),F2ST.locks?F2ST.locks.filter(o=>o&&(o.done||o.f2sDone||G.found[o.id])).length:0);
  try{ if(typeof f2fChains==='function') n=Math.max(n,f2fChains()|0); }catch(e){}
  return Math.min(4,n);
}
// the outcome when Glaciar falls: free when all four chains were melted, else defeat (a value the foe module set
// during this fight wins; it is cleared when a fresh fight starts)
function f2sGlaciarDecide(){
  const C=G.choices;
  if(C.f_glaciar!=='free'&&C.f_glaciar!=='defeat') C.f_glaciar=f2sChains()>=4?'free':'defeat';
  return C.f_glaciar;
}
function f2sGlaciarOutro(){ return f2sGlaciarDecide()==='free'?STORY.f_glaciar_outro_free:STORY.f_glaciar_outro_defeat; }
// the fight's top-of-screen lines are over once a big scene starts (they wait while a scene plays, and would hang on)
function f2sQuiet(){ try{ G.taunt=null; if(G.tauntQ) G.tauntQ.length=0; }catch(e){} }
// play the outcome now (x2_foes may call this from its own win code: f2sGlaciarEnd('free'|'defeat'), or with no
// argument to let the chains decide). Safe to call more than once.
function f2sGlaciarEnd(how){
  if(F2ST.glacEndRun||f2sSeen('f_glaciar_free')||f2sSeen('f_glaciar_defeat')){ if(G.choices.f_glaciar) f2sAfterGlaciar(); return false; }
  F2ST.glacEndRun=true;
  if(how==='free'||how==='defeat') G.choices.f_glaciar=how;
  // called during a fight (a debug call, or the foe module's own win code before the stock flow): end it cleanly
  for(const e of G.enemies) if(!e.dead&&(e.type==='f_glaciar'||(F2ST.boss&&e===F2ST.boss))) e.dead=true;
  try{ if(typeof bossFightEnd==='function') bossFightEnd(false); }catch(e){ console.error(e); }
  F2ST.boss=null; G.boss=null; G.fightSite=null; G.fightIntro=false; G.bossDone.f_glaciar=true;
  f2sQuiet();
  f2sPlay(f2sGlaciarOutro());
  return true;
}
// after either outcome: the journal sentences, Duchess on the spike, then the night in Hearthold and the act's end
function f2sAfterGlaciar(){
  if(F2ST.afterRun) return; F2ST.afterRun=true;
  const C=G.choices, X=C.extra=C.extra||{};
  X.f_glaciar=G.flags.f_glaciar_sung?S('You sang the Snow Mother\'s Song and Glaciar woke up.','You sang, and Glaciar woke up.')
    :C.f_glaciar==='free'?S('You melted Glaciar\'s chains and she woke up as herself.','You melted the chains. Glaciar woke up.'):S('Glaciar fell asleep under the snow, still chained.','Glaciar sleeps under the snow.');
  if(C.f_glaciar_home) X.f_glaciar_home=C.f_glaciar_home==='stay'?S('Glaciar stayed in the north as the Snow Mother.','Glaciar stayed as the Snow Mother.'):S('Glaciar flew north to rest.','Glaciar flew north to rest.');
  if(C.f_glaciar==='free'&&C.f_glaciar_home==='north') F2ST.glacLeave=0.01;
  G.flags.f_nyx_named=1; saveGame();
  const go=()=>later(0.6,()=>f2sWhen('night',null,()=>f2sNight()));
  // (x2_people's goat may have played her lines already, walking up to her: then straight on to the night)
  const duch=()=>{ if(G.flags.f_duchess||f2sSeen('f_duchess')){ go(); return; }
    f2sPlay(STORY.f_duchess,()=>{ f2sMark('f_duchess'); if(!G.flags.f_duchess){ G.flags.f_duchess=1; addCoins(30); gainXp(60); } go(); }); };
  if(!G.flags.f_duchess&&!f2sSeen('f_duchess')) later(1.0,()=>f2sWhen('duchess',null,duch)); else go();
}
function f2sNight(){
  if(G.flags.f_done||f2sSeen('f_night')) { f2sEndActSoon(); return; }
  // a fade, and Hearthold by the Hearth, at night
  G.fade=1; F2ST.fade=true; G.tod=0.93; f2sQuiet();
  try{ if(AREA) exitArea(true); mapTravel(F2SP.night.x,F2SP.night.y,{noSave:true}); }catch(e){ console.error(e); }
  player.facing=-Math.PI/2; G.tod=0.93;
  F2ST.cam={x:F2SP.hearth.x,y:F2SP.hearth.y+20,k:0.5};
  later(0.9,()=>f2sPlay('f_night',()=>f2sEndActSoon()));
}
// the moon's bite plays on the HUD once it is calm; the act's card waits for it (6 s at most)
function f2sEndActSoon(){ F2ST.endT=0; f2sWhen('endact',q=>{ const anim=typeof MOON!=='undefined'&&MOON&&MOON.anim, pend=typeof moonPending==='function'&&moonPending(); return q.t>6||(!anim&&!pend&&q.t>1.2); },()=>f2sEndAct()); }
function f2sEndAct(){
  if(G.flags.f_done&&F2ST.ended) return; F2ST.ended=true;
  gainXp(800);
  const free=G.choices.f_glaciar==='free';
  const L=[S('Act III complete. The Long Winter is over.','The Long Winter is over.'),S('Shards found: 2 of 3.','Shards: 2 of 3.'),
    free?S('Glaciar is free.','Glaciar is free.'):S('Glaciar sleeps under the snow.','Glaciar sleeps under the snow.')];
  if(G.flags.f_mumble_ally) L.push(S('Mumble the yeti roared with you on the mountain.','Mumble roared with you!'));
  L.push(S('Next: Act IV, The Night Mother.','Next: Act IV, The Night Mother.'));
  endAct(3,{title:S('Act III: The Long Winter','Act III: The Long Winter'),lines:L,next:()=>f2sToAct4()});
}
// "Continue the story": Act IV begins with m_sail (x3_story); until it exists, a banner says so
// (Act IV opens "the morning after, in Hearthold": after the night scene the sky turns to morning first)
function f2sToAct4(){
  const has=typeof STAGEDEF!=='undefined'&&!!STAGEDEF.m_sail;
  if(has||(typeof actStages==='function'&&actStages(4).length)){ if(curMap()===2&&!AREA&&isNight()){ G.fade=1; G.tod=0.3; } }
  if(has&&startAct(4,{stage:'m_sail'})) return true;
  if(startAct(4)) return true;
  setBanner(S('To be continued!','To be continued!'),S('The next part of the story is still being written.','The next part is coming soon.'),3.4); return false;
}
// thaw every frozen person in the north (the Snow Mother's breath): the p3 frozen folk of this map and the bible's list
const F2S_FROZEN=['f_fergus','f_frz_milk','f_frz_guard1','f_frz_guard2','f_frz_skater','f_frz_fisher','f_frz_monk','f_frz_hiker','f_frz_trapper','f_frz_postman','f_frz_knight','f_frz_kid',
  'f_ylva','f_tollef','f_saga','f_sigrun','f_bo','f_nils','f_oskar','f_rasmus'];
function f2sThawAll(){
  const F=G.flags; let n=0;
  const list=(typeof P3!=='undefined'&&P3.out?P3.out:[]).filter(o=>o&&o.p3==='frozen'&&mapAt(o.y)===2);
  for(const o of list){ if(typeof p3Thawed==='function'&&p3Thawed(o)) continue;
    const fl=typeof p3FrozenFlag==='function'?p3FrozenFlag(o):(o.flag||('f_thaw_'+String(o.id).replace(/^f_/,'')));
    if(!F[fl]){ F[fl]=1; F.f_frozen_n=(F.f_frozen_n||0)+1; n++; }
    o.st='free'; o.heat=0; if(o.npc) o.npc.face=o.face; if(o.col&&typeof p3Uncol==='function') p3Uncol(o);
    for(let i=0;i<6;i++) emit(o.x+rand(-14,14),o.y-30+rand(-20,20),1,{col:'210,235,255',smin:40,smax:120,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); }
  // (the bible's twenty, under both spellings of the flag: f_thaw_f_ylva and p3's default f_thaw_ylva; counted once)
  for(const id of F2S_FROZEN){ const a='f_thaw_'+id, b='f_thaw_'+id.replace(/^f_/,''); if(!F[a]&&!F[b]){ F.f_frozen_n=(F.f_frozen_n||0)+1; n++; } F[a]=1; F[b]=1; }
  F.f_thaw_all=1;
  try{ questPoke(); setupNPCs(); }catch(e){}
  return n;
}
// the one entry point for the other Act III helpers (F2STORY.md section 5): f2sBeat(name, arg)
//   'maze_done' 'sky_done' 'deep_done'   a dungeon is finished (same as its altar's trial_<id>_done)
//   'crown_door'                         Ash goes through the summit door of the Heart of Dread
//   'ylva'                               Grandmother Ylva is thawed (her frozen landmark's onThaw)
//   'drum'                               the Drum Stone is pounded (arg: {x,y}, optional)
//   'hearth' 'northgate'                 the Great Hearth / the North Gate took Blaze (x2_world's own landmarks)
//   'hush_won'                           Hush is beaten (if the foe module plays no outro of its own)
//   'chain' (arg n)                      a chain of Glaciar's snapped: n melted so far (the story says her chain line)
//   'glaciar_free' 'glaciar_defeat'      the Glaciar fight is over with that outcome
function f2sBeat(name,arg){
  const F=G.flags;
  switch(name){
    case 'maze_done': F.trial_f_maze_done=true; return true;
    case 'sky_done': F.trial_f_sky_done=true; return true;
    case 'deep_done': F.trial_f_deep_done=true; return true;
    case 'crown_door': f2sCrownDoor(); return true;
    case 'ylva': F.f_ylva_thawed=1; return true;
    case 'drum': if(!F.f_drum){ const P=arg&&arg.x!=null?arg:f2sLm('f_lm_drum','drum'); if(!f2sDrumHit(P.x,P.y)){ F.f_drum=1; f2sWhen('drum',null,()=>f2sDrum()); } } return true;
    case 'hearth': if(G.stage==='f_kindle'&&!F.f_hearth_lit) f2sWhen('kindle',null,()=>f2sKindle()); return true;
    case 'northgate': if(G.stage==='f_kindle'){ F.f_northgate=1; } return true;
    case 'hush_won': if(!f2sSeen('f_hush_outro')) f2sWhen('hushout',null,()=>f2sPlay('f_hush_outro')); else f2sHushDone(); return true;
    case 'chain': F.f_chains=Math.max(F.f_chains|0,arg|0); return true;
    case 'glaciar_free': return f2sGlaciarEnd('free');
    case 'glaciar_defeat': return f2sGlaciarEnd('defeat');
  }
  return false;
}

// ---------- 7. stand-ins for parts of the act another helper builds (each steps aside when the real thing exists)
const f2sHasX=id=>(typeof XBY!=='undefined'&&XBY.some(L=>L&&L.some(d=>d&&d.id===id)))||(typeof CROSSINGS!=='undefined'&&!!CROSSINGS[id]);
const f2sHasFrozen=(id,who)=>LANDMARKS.some(o=>o&&o.p3==='frozen'&&(o.id===id||(who&&o.who===who)));
const F2S_FERGUS={skin:'#e6b494',hair:'#8a4a2a',beard:true,beardc:'#8a4a2a',outfit:'coat',shirt:'#c84a3a',low:'#4a3a2a',hat:'beanie',hatc:'#e8c03a',mittens:'#e8c03a',bag:'#7a5a32',build:'wide'};
function f2sWorldInit(){
  // the High Pass between Embermere and Frostreach (x2_world's crossing wins)
  if(typeof defineCrossing==='function'){
    if(!f2sHasX('f_pass_s')) defineCrossing({id:'f_pass_s',x:F2SP.passS.x,y:F2SP.passS.y,to:{x:F2SP.arrive.x,y:F2SP.arrive.y},label:S('Climb the High Pass','Climb the High Pass'),name:S('The High Pass','The High Pass'),kind:'pass',dir:-Math.PI/2,
      need:()=>reached('f_pass'),locked:S('The High Pass is a wall of ice. Ulf might know more.','The pass is ice. Ask Ulf.'),hidden:()=>!(G&&G.mode==='story'&&reached('f_snow')),arrive:S('Snow in summer. It squeaks under your claws.','The snow squeaks!'),f2s:true});
    if(!f2sHasX('f_pass_n')) defineCrossing({id:'f_pass_n',x:F2SP.arrive.x,y:F2SP.arrive.y+220,to:{x:F2SP.passS.x,y:F2SP.passS.y+170},label:S('Go down to Embermere','Go down to Embermere'),name:S('The High Pass','The High Pass'),kind:'pass',dir:Math.PI/2,f2s:true});
  }
  // the frozen folk the main path needs: the mitten seller on the White Road and Grandmother Ylva on the bell tower
  if(typeof p3Add==='function'&&typeof P3K!=='undefined'&&P3K.frozen){
    if(!f2sHasFrozen('f_ylva','f_ylva')) p3Add('frozen',{id:'f_ylva',who:'f_ylva',look:(CASTBY.f_ylva&&CASTBY.f_ylva.look)||F2S_PEOPLE.f_ylva.look,name:S('Grandmother Ylva','Grandmother Ylva'),x:F2SP.tower.x,y:F2SP.tower.y,face:Math.PI/2,f2s:true});
    if(!f2sHasFrozen('f_fergus','f_fergus')) p3Add('frozen',{id:'f_fergus',look:F2S_FERGUS,name:S('Fergus Fiddlesticks','Fergus'),x:F2SP.fergus.x,y:F2SP.fergus.y,face:Math.PI/2,coins:20,
      line:S('...MITTENS! Get your mittens! ...Why is it so quiet? How long was I standing here?','MITTENS! Get your mittens! Why is it so quiet?'),after:S('Mittens for the dragon! Free! You saved my fingers, I can spare a mitten.','Free mittens for the dragon!'),f2s:true});
  }
  // the Great Hearth and the North Gate take Blaze (x2_world's landmarks may report it with f2sBeat too)
  if(typeof p3On==='function'){
    const H=f2sLm('f_lm_hearth','hearth'), N=f2sLm('f_lm_northgate','northGate');
    F2ST.hearthHook=p3On({x:H.x,y:H.y,r:120,f2s:'hearth'},{blaze:{need:3,h:40,repeat:true,when:()=>G.stage==='f_kindle'&&!G.flags.f_hearth_lit,then:()=>f2sBeat('hearth')}});
    F2ST.gateHook=p3On({x:N.x,y:N.y,r:90,f2s:'northgate'},{blaze:{need:2,h:40,repeat:true,when:()=>G.stage==='f_kindle'&&!!G.flags.f_hearth_lit&&!G.flags.f_northgate,then:()=>f2sBeat('northgate')}});
  }
  if(typeof p3OnPound==='function'&&!F2ST.poundL){ F2ST.poundL=p3OnPound(info=>{ try{ if(info&&G.stage==='f_dreadgate') f2sDrumHit(info.x,info.y); if(info&&F2ST.locks) f2sLockPound(info); }catch(e){ console.error(e); } }); }
  // the bosses' words once more, now that every module has defined its sites
  f2sBossWords();
  f2sFoeHooks();
}
// x2_foes' story hooks (its F2.hook: a chain snapped, Hush beaten). Read at run time only, and only hooks it left empty.
function f2sFoeHooks(){
  let H=null; try{ H=typeof F2!=='undefined'&&F2&&F2.hook&&typeof F2.hook==='object'?F2.hook:null; }catch(e){ H=null; }
  if(!H) return;
  if(!H.chain) H.chain=n=>{ f2sBeat('chain',n); };
  if(!H.hushDone) H.hushDone=()=>{ if(!G.flags.f_hush_done||!F2ST.hushDoneRun) f2sHushDone(); };
}
// Tove's little nudges on the main path, once each (top of the screen), where a kid is most likely to get stuck
const F2S_NUDGE=[
  {k:'f_nudge_tower',st:['f_thaw'],at:{x:1950,y:46860},r:230,when:()=>!f2sYlvaThawed()&&f2sElev()<3,line:S(`Granny's on top of the bell tower. The south side has handholds. Climb!`,`Climb the bell tower. The south side has handholds.`)},
  {k:'f_nudge_gap',st:['f_gap'],at:{x:10000,y:44450},r:260,when:()=>!G.flags.f_gap_crossed,line:S(`See the swirl at the vent? Jump in, and the wind ribbon does the rest. Don't look down. I just did. I wish I hadn't.`,`Jump into the swirl at the vent. The wind carries you!`)},
  {k:'f_nudge_vent',st:['f_dreadgate'],at:{x:8800,y:44450},r:260,when:()=>f2sSeen('f_dreadgate')&&!G.flags.f_drum,line:S(`This is the Drum Wind. Jump into the swirl and ride it all the way up to the drum.`,`Jump into the swirl. Ride up to the drum!`)},
  {k:'f_nudge_drum',st:['f_dreadgate'],at:{x:8350,y:43380},r:200,when:()=>!G.flags.f_drum,line:S(`That's the drum. Jump, then slam down on it. Like a sack of anvils!`,`Jump, then slam down on the drum!`)}
];
function f2sNudgeTick(){
  if(!f2sOut()||scene!=='play'||DLG) return;
  for(const N of F2S_NUDGE){ if(!N.st.includes(G.stage)||f2sSeen(N.k)) continue;
    if(dist(player.x,player.y,N.at.x,N.at.y)<N.r&&(!N.when||N.when())){ f2sMark(N.k); f2sSay('tove',N.line); return; } }
}
// Pip's Warm (bible 6.5b, THREADS 8): once Pip has licked the blue Hearth, frozen folk and frost locks near him melt
// 30 percent faster, and his glow at night is a little bigger and warmer
const f2sPipWarmAt=o=>!!(G&&G.flags&&G.flags.f_pip_warm&&G.pip&&o&&dist(G.pip.x,G.pip.y,o.x,o.y)<120);
if(typeof P3K!=='undefined') for(const kind of ['frozen','frostlock']){ const K=P3K[kind]; if(!K||!K.blaze) continue; const base=K.blaze;
  K.blaze=function(o,dt){ const h0=o.heat; base.call(this,o,dt); try{ if(o.heat>h0&&f2sPipWarmAt(o)) o.heat+=dt*0.3; }catch(e){} }; }
if(typeof pipGlowR==='function'){ const base=pipGlowR; pipGlowR=function(){ const r=base(); return G&&G.flags&&G.flags.f_pip_warm&&!G.flags.m_pip_lamp?Math.max(r,104):r; }; }
{ const base=initWorld; initWorld=function(){ base.apply(this,arguments); try{ f2sWorldInit(); }catch(e){ console.error(e); } }; }
// the fallback Fergus beat: before Blaze, walking up to the frozen traveler (bible 6.2b)
function f2sFergusTick(){
  if(f2sSeen('f_fergus_cold')||f2sAbil('blaze')||!f2sOut()||scene!=='play') return;
  const o=LANDMARKS.find(q=>q&&q.p3==='frozen'&&(q.id==='f_fergus'||q.who==='f_fergus'))||{x:F2SP.fergus.x,y:F2SP.fergus.y,st:'ice'};
  if(o.st&&o.st!=='ice') return;
  if(dist(player.x,player.y,o.x,o.y)<150) f2sPlay('f_fergus_cold');
}
// a dungeon that is not in the build yet: Ember's flame waits just inside its door, so the act can still be played
const F2S_DUN={
  f_maze:{at:F2SP.mazeDoor,stages:['f_maze'],abil:'blaze',name:S('Step into the Glacier Maze','Go into the Glacier Maze'),
    say:S('Just inside the door, a little flame burns blue in a nook of the ice. The rest of the maze is sealed with frost, for now.','A little blue flame burns inside the door.')},
  f_sky:{at:F2SP.temple,stages:['f_sky'],abil:'windride',name:S('Step into Skyreach Temple','Go into Skyreach Temple'),
    say:S('Just inside the temple gate, a little flame flickers in the wind. The halls beyond are full of gales, for now.','A little flame flickers inside the gate.')},
  f_deep:{at:F2SP.horned,stages:['f_gap','f_deep'],abil:'pound',name:S('Step into Stonehorn Deep','Go into Stonehorn Deep'),
    say:S('Just inside the skull\'s mouth, a little flame burns on top of a drum stone. Deeper down, something snores.','A little flame burns on a drum stone.')},
  // (also at f_glaciar: Ash who falls in the Glaciar fight wakes at a shrine below, and the placeholder has no stair of
  // its own back up to the Crown)
  f_dread:{at:F2SP.dreadgate,stages:['f_dread','f_glaciar'],name:S('Climb into the Heart of Dread','Go into the mountain'),
    say:S('A long stair of black ice winds up through the mountain, chains on every step. You climb, and climb, and melt every lock you pass.','You climb up the long stair. You melt every chain.')}
};
// (x2_world registers a one-room placeholder for a dungeon no helper has built: then the stand-in runs inside it)
const f2sDunPh=id=>{ try{ return !!(typeof DUNGEONS!=='undefined'&&DUNGEONS[id]&&DUNGEONS[id].placeholder); }catch(e){ return false; } };
const f2sStubOK=id=>!(typeof AREADEFS!=='undefined'&&AREADEFS[id]);
// leave the area (if inside) and stand at (x,y) outdoors
function f2sPutOut(x,y){ try{ if(AREA){ G.ow={x,y}; exitArea(); } else mapTravel(x,y,{noSave:true}); }catch(e){ console.error(e); } }
function f2sStub(id){
  const D=F2S_DUN[id]; if(!D) return;
  if(id==='f_deep'&&G.stage==='f_gap') goStage('f_deep',{card:false,quiet:true});
  if(id==='f_dread'){ f2sPlay([...(f2sSeen('f_dread_in')?[]:STORY.f_dread_in||[]),xl('narr',D.say,simplify(D.say))],()=>{ const P=f2sCrownIn(); f2sPutOut(P.x,P.y); later(0.8,()=>f2sCrownDoor()); }); return; }
  const K=F2S_DUNKEYS[id], L=[xl('narr',D.say,simplify(D.say))];
  for(const k of ['in','shrine','gift']){ const v=STORY[K[k]]; if(Array.isArray(v)) L.push(...v); }
  L.push(xdo(()=>{ if(D.abil&&!f2sAbil(D.abil)){ grantAbility(D.abil); later(2.4,()=>setBanner(D.abil==='blaze'?S('Blaze Breath!','Blaze Breath!'):D.abil==='windride'?S('Wind Riding!','Wind Riding!'):S('Ground Pound!','Ground Pound!'),STORY[K.how]||'',4.2)); } }));
  for(const k of ['won','end']){ const v=STORY[K[k]]; if(Array.isArray(v)) L.push(...v); }
  f2sPlay(L,()=>{ const p=player; G.flags['trial_'+id+'_done']=true; p.maxHp+=10; p.hp=p.maxHp; p.potions=p.potionsMax; gainXp(600); addCoins(60); if(AREA) try{ exitArea(); }catch(e){} questPoke(); saveGame(); });
}
// ---- Hush's stand-in (no f_hush boss in the build): three lamp-braziers on the plaza; she can't help herself
const F2S_LAMPS=[{id:'f2s_lamp_w',x:7000,y:44250},{id:'f2s_lamp_e',x:7600,y:44250},{id:'f2s_lamp_s',x:7300,y:44560}];
const f2sHushReal=()=>typeof SITES!=='undefined'&&!!SITES.f_hush&&typeof EDEF!=='undefined'&&!!EDEF[SITES.f_hush.boss];
function f2sLampsMake(){
  if(F2ST.lamps||typeof p3Add!=='function'||!P3K.fbraz) return;
  F2ST.lamps=F2S_LAMPS.map(L=>LANDMARKS.find(o=>o&&o.id===L.id)||p3Add('fbraz',{id:L.id,x:L.x,y:L.y,h:64,timed:0,f2s:true,then:o=>{ taunt('f_hush',pick(F2S_TAUNTS.f_hush_lamp)); }}));
  F2ST.hush={mode:'high',x:F2SP.plaza.x,y:F2SP.plaza.y-40,t:0};
  setBanner(S('Hush!','Hush!'),S('Moths love lamps. Light all three lamp-braziers!','Light all three lamps!'),3.6);
}
function f2sLampsClear(){ /* the lamps stay on the plaza, lit (they are part of the Dreadgate now) */ }
function f2sHushTick(dt){
  const F=G.flags;
  if(f2sHushReal()){ if(G.bossDone.f_hush&&!F.f_hush_done&&scene==='play'&&!DLG) f2sBeat('hush_won'); return; }
  if(!f2sOut()) return;
  if(!F2ST.lamps&&scene==='play'&&!DLG&&dist(player.x,player.y,F2SP.plaza.x,F2SP.plaza.y)<340){ if(!f2sSeen('f_hush_intro')) f2sPlay('f_hush_intro',()=>f2sLampsMake()); else f2sLampsMake(); return; }
  if(F2ST.lamps){ const lit=F2ST.lamps.filter(o=>o&&(o.lit||o.on||G.found[o.id])).length; F2ST.hush&&(F2ST.hush.lit=lit);
    if(lit>=3&&!F2ST.hushFall){ F2ST.hushFall=true; F2ST.hush={mode:'low',x:F2SP.plaza.x,y:F2SP.plaza.y,t:0}; later(1.6,()=>f2sWhen('hushout',null,()=>f2sPlay('f_hush_outro',()=>{ gainXp(1200); G.pendingBless=(G.pendingBless|0)+1; later(1.2,()=>{ try{ offerPending(); }catch(e){} }); }))); } }
}
// ---- Glaciar's stand-in (no f_glaciar boss in the build): the four chain locks round the Crown (bible 5.2)
const F2S_STONES=[{id:'f2s_chain_s',x:7300,y:41700},{id:'f2s_chain_w',x:6820,y:41250},{id:'f2s_chain_e',x:7780,y:41150},{id:'f2s_chain_n',x:7300,y:40780}];
const f2sGlacReal=()=>typeof SITES!=='undefined'&&!!SITES.f_glaciar&&typeof EDEF!=='undefined'&&!!EDEF[SITES.f_glaciar.boss];
function f2sLocksMake(){
  if(F2ST.locks||typeof p3Add!=='function'||!P3K.frostlock) return;
  F2ST.locks=F2S_STONES.map(L=>LANDMARKS.find(o=>o&&o.id===L.id)||p3Add('frostlock',{id:L.id,x:L.x,y:L.y,h:34,dome:true,crackT:f2sEasy()?12:8,f2s:true,then:o=>{ o.f2sDone=true; }}));
  F2ST.glac=F2ST.glac||{mode:'spell'};
  setBanner(S('Those chains aren\'t hers!','Melt the chains!'),S('Crack each lock\'s ice with a Ground Pound, then Blaze the lock.','Pound the ice. Then Blaze the lock.'),4);
}
function f2sLockPound(info){ /* the frostlock kind cracks its own dome on a pound within 70 px (p3_frost); nothing to add */ }
function f2sGlaciarTick(dt){
  const F=G.flags, C=G.choices;
  f2sFightWatch(dt);
  if(F.f_done||F2ST.glacEndRun||F2ST.glacEnd) return;
  if(C.f_glaciar&&!f2sSeen('f_glaciar_free')&&!f2sSeen('f_glaciar_defeat')&&G.bossDone.f_glaciar&&scene==='play'&&!DLG){ f2sGlaciarEnd(C.f_glaciar); return; }
  if(f2sGlacReal()){ if(G.bossDone.f_glaciar&&scene==='play'&&!DLG&&!f2sSeen('f_glaciar_free')&&!f2sSeen('f_glaciar_defeat')) f2sGlaciarEnd(); return; }
  if(!f2sOut()) return;
  if(!F2ST.locks&&scene==='play'&&!DLG&&dist(player.x,player.y,F2SP.crown.x,F2SP.crown.y)<460){ if(!f2sSeen('f_glaciar_intro')) f2sPlay('f_glaciar_intro',()=>f2sLocksMake()); else f2sLocksMake(); return; }
  if(F2ST.locks){ const n=F2ST.locks.filter(o=>o&&(o.done||o.f2sDone||G.found[o.id])).length; F.f_chains=Math.max(F.f_chains|0,n);
    // (the stand-in has no fight: with all four chains melted she shakes off the spell, the 'free' outcome)
    // (after her last chain line has been read)
    if(n>=4&&!F2ST.glacFreeQ){ F2ST.glacFreeQ=true; later(2.8,()=>f2sWhen('glacfree',q=>q.t>6||!G.taunt||G.taunt.t>=G.taunt.dur-0.4,()=>{ if(!G.choices.f_glaciar||G.choices.f_glaciar==='free') f2sGlaciarEnd('free'); })); } }
}
// the next frost lock still to melt (the stand-in's objective points there)
function f2sNextLock(){ if(!F2ST.locks) return null; let best=null, bd=1e9; for(const o of F2ST.locks){ if(!o||o.done||o.f2sDone||G.found[o.id]) continue; const d=dist(player.x,player.y,o.x,o.y); if(d<bd){ bd=d; best=o; } } return best; }
// during a fight with Glaciar (the real one or the stand-in): her chain lines, Tove, and Nyxara at the phase change
// (each line goes through f2sSay: when the foe module already said the same words, they are not said twice)
function f2sFightWatch(dt){
  const b=G.boss&&!G.boss.dead&&G.boss.type==='f_glaciar'?G.boss:null;
  if(b&&F2ST.boss!==b){ F2ST.boss=b; F2ST.n9=false;
    // a fresh fight (after a fall, the fight starts over): no outcome yet
    if(!f2sSeen('f_glaciar_free')&&!f2sSeen('f_glaciar_defeat')&&b.hp>=b.maxHp*0.98){ delete G.choices.f_glaciar; G.flags.f_chains=0; }
    F2ST.seenChains=f2sChains();
    // (a foe module that says "Melt the chains!" itself goes first; f2sSay does not repeat it)
    later(3.4,()=>{ if(G.boss===b&&!b.dead) f2sSay('tove',F2S_TAUNTS.tove_glaciar[0]); }); }
  if(!b&&!F2ST.locks){ if(F2ST.boss&&!F2ST.boss.dead&&!G.bossDone.f_glaciar){ F2ST.boss=null; } return; }
  const n=f2sChains();
  if(n>F2ST.seenChains){ F2ST.seenChains=n; const L=F2S_TAUNTS.f_glaciar_chain[Math.min(3,n-1)]; if(L) later(0.6,()=>f2sSay('f_glaciar',L));
    // (the real fight shows its own chain pips on the boss bar; the stand-in says it with a banner)
    if(F2ST.locks){ setBanner(S(`Chain ${n} of 4 melted!`,`Chain ${n} of 4 gone!`),n>=4?S('She is fighting the spell!','She fights the spell!'):'',2.4); try{ SFX.play('shrine'); }catch(e){} } }
  if(b&&!F2ST.n9&&(b.bph|0)>=1){ F2ST.n9=true; f2sSay('nyxara',F2S_TAUNTS.nyxara_n9); }
}
// any Act III dungeon boss or miniboss: its intro the first time it shows up, its "won" lines after it falls (once, by
// any route). x2_foes and the dungeon helpers may play them themselves; a played script is marked and never repeats.
const F2S_BOSS={f_bellows:{intro:'f_bellows_intro',won:'f_maze_won'},f_frostfeather:{intro:'f_frostfeather_intro',won:'f_sky_won'},f_grumblehorn:{intro:'f_grumblehorn_intro',won:'f_deep_won'},
  f_blubberton:{intro:'f_blubberton_intro',won:'f_blubberton_won'},f_squall:{intro:'f_squall_intro',won:'f_squall_won'},f_squeak:{intro:'f_squall_intro',won:'f_squall_won'},
  f_rockjaw:{intro:'f_rockjaw_intro',won:'f_rockjaw_won'},f_grumbo:{intro:'f_grumbo_intro',won:'f_grumbo_won'}};
// (when another module plays its own words for a boss, STORY.bosses[type].intro/outro without these lines, the
// watcher leaves that boss alone)
function f2sOtherWords(type,k,key){ const SB=STORY.bosses&&STORY.bosses[type], v=SB&&SB[k]; return Array.isArray(v)&&v.length>0&&!f2sHasLines(v,STORY[key]); }
function f2sBossTick(dt){
  F2ST.bt-=dt; if(F2ST.bt>0) return; F2ST.bt=0.25;
  let b=G.boss&&F2S_BOSS[G.boss.type]?G.boss:null;
  if(!b&&AREA) b=G.enemies.find(e=>!e.dead&&F2S_BOSS[e.type])||null;
  if(b&&!b.dead){ F2ST.rb=b; const B=F2S_BOSS[b.type];
    if(B.intro&&!f2sSeen(B.intro)&&!f2sOtherWords(b.type,'intro',B.intro)&&scene==='play'&&!DLG) f2sPlay(B.intro); return; }
  const o=F2ST.rb; if(!o) return;
  // a boss taken away with hp left (Ash fell and woke at a shrine, or left the room) is not beaten: only hp 0 wins
  if(o.dead&&o.hp>0){ F2ST.rb=null; return; }
  if(o.hp<=0){ const pair=o.type==='f_squall'||o.type==='f_squeak';
    if(pair&&G.enemies.some(e=>!e.dead&&(e.type==='f_squall'||e.type==='f_squeak'))) return;
    F2ST.rb=null; const B=F2S_BOSS[o.type];
    if(B&&B.won&&!f2sSeen(B.won)&&!f2sOtherWords(o.type,'outro',B.won)) later(4.0,()=>f2sWhen('won_'+o.type,()=>!f2sSeen(B.won),()=>f2sPlay(B.won))); }
}
// ---------- prompts outdoors: the dungeon stand-ins
{ const base=miniPrompts; miniPrompts=function(offer){ base(offer); try{ if(f2sOn()&&f2sOut()) f2sPrompts(offer); }catch(e){ console.error(e); } }; }
function f2sPrompts(offer){
  const p=player, st=G.stage;
  for(const id in F2S_DUN){ const D=F2S_DUN[id]; if(!D.stages.includes(st)||!f2sStubOK(id)||G.flags['trial_'+id+'_done']) continue;
    if(id==='f_dread'&&!G.flags.f_hush_done) continue;
    const d=dist(p.x,p.y,D.at.x,D.at.y); if(d<90) offer(d-60,D.name,()=>f2sStub(id),D.at.x,D.at.y); }
}
// inside x2_world's placeholder for a dungeon that is not built yet: the stand-in plays a moment after Ash walks in
function f2sStubTick(){
  if(!AREA||scene!=='play'||DLG||F2ST.stubRun) return;
  const id=typeof dunRoot==='function'?dunRoot(AREA.id):AREA.id, D=F2S_DUN[id];
  if(!D||!f2sDunPh(id)||!D.stages.includes(G.stage)||G.flags['trial_'+id+'_done']) return;
  if(id==='f_dread'&&!G.flags.f_hush_done) return;
  F2ST.stubRun=true; later(0.8,()=>{ F2ST.stubRun=false; if(AREA&&scene==='play'&&!DLG) f2sStub(id); });
}
// ---------- people: the stand-ins (when x2_people is not there), Vesper at the Dreadgate, Brother Pennant on his kite
{ const base=setupNPCs; setupNPCs=function(){ base(); try{ if(G&&G.mode==='story') f2sPeople(); }catch(e){ console.error(e); } }; }
function f2sPeople(){
  if(actOf(G.stage)<3) return;
  for(const id in F2ST.fb){ const P=F2S_PEOPLE[id]; if(!P||!SPECIAL[id]||G.npcs.some(n=>n.id===id)) continue;
    if(P.thawed&&!f2sYlvaThawed()) continue; if(P.from&&!reached(P.from)) continue;
    const n=mkNPC(SPECIAL[id],P.at[0],P.at[1]); n.walker=false; G.npcs.push(n); }
  if(G.flags.f_hush_done&&!G.choices.f_glaciar&&f2sVesper()&&SPECIAL.c_vesper&&!G.npcs.some(n=>n.id==='c_vesper')){ const n=mkNPC(SPECIAL.c_vesper,F2SP.vesper.x,F2SP.vesper.y); n.walker=false; n.f2sGate=true; n.face=Math.PI; G.npcs.push(n); }
}

// ---------- 8. per frame (outdoors through updateStory, inside areas through updateArea)
function f2sTick(dt){
  if(!G||G.mode!=='story'||G.done) return;
  f2sQueue(dt); f2sBossTick(dt);
  if(actOf(G.stage)!==3) return;
  const F=G.flags;
  // Mom's snow letter (f_pb_1): the data's f_snow sends Pebble once, when its first step starts. A save made before
  // she landed (her flight is not saved), or a long spell with no calm moment (she gives up), sends her again, so the
  // letter never just stops coming
  if(G.stage==='f_snow'&&!F.f_pb_1&&!f2sSeen('f_intro')&&typeof PEBRT!=='undefined'&&!PEBRT.crow&&!PEBRT.want&&!(G.time<F2ST.pbT)){ F2ST.pbT=G.time+20; try{ pebbleNow('f_pb_1'); }catch(e){ console.error(e); } }
  f2sFergusTick(); f2sNudgeTick(); f2sStubTick();
  // Rimeholm and Grandmother Ylva can be reached by the Rim Road before the North Gate: their scenes play whenever
  // Ash gets there with Blaze (the stage then moves on by itself)
  if(reached('f_kindle')&&!reached('f_sky')){
    if(!f2sSeen('f_rime_arrive')&&scene==='play'&&!DLG&&f2sNear(f2sAt('rime'),600)) f2sPlay('f_rime_arrive',()=>questUpdated());
    if(f2sYlvaDue()) f2sWhen('ylva',null,()=>f2sYlva());
  }
  if(G.stage==='f_thaw'&&f2sSeen('f_ylva_end')&&!DLG&&scene==='play') goStage('f_sky');
  f2sHearthCol(dt);
  if(F2ST.glacLeave>0){ F2ST.glacLeave+=dt; if(F2ST.glacLeave>4) F2ST.glacLeave=-1; }
  if(F2ST.hush) F2ST.hush.t+=dt;
}
{ const base=updateStory; updateStory=function(dt){ base(dt); try{ f2sTick(dt); }catch(e){ console.error(e); } }; }
{ const base=updateArea; updateArea=function(dt){ base(dt); try{ if(AREA&&G&&G.mode==='story'&&!G.done){ f2sTick(dt); const d=STAGEDEF[G.stage]; if(d&&d.update&&actOf(G.stage)===3) d.update(dt); } }catch(e){ console.error(e); } }; }
// a fade a scene starts under (the night in Hearthold) clears while the scene plays
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt); try{ if(G&&G.mode==='story'&&scene==='dialogue'&&G.fade>0&&F2ST.fade) G.fade=Math.max(0,G.fade-dt*1.2); if(F2ST.fade&&G.fade<=0) F2ST.fade=false; if(F2ST.hush&&scene==='dialogue') F2ST.hush.t+=dt; if(G&&G.mode==='story'&&scene==='dialogue') f2sHearthCol(dt); }catch(e){} }; }
// the camera leans toward a scene (F2ST.cam = {x,y,k})
{ const base=updateCam; updateCam=function(dt,snap){
  const C=F2ST.cam; if(!C||AREA||!player||!G||G.mode!=='story') return base(dt,snap);
  if(scene!=='dialogue'){ F2ST.cam=null; return base(dt,snap); }
  const px=player.x, py=player.y; player.x=px+(C.x-px)*C.k; player.y=py+(C.y-py)*C.k; try{ base(dt,snap); }finally{ player.x=px; player.y=py; } }; }
// inside Hearthold's walls the snow thins once the Great Hearth burns again
{ const base=ambHere; ambHere=function(){ const a=base(); try{ if(a&&G&&G.flags&&G.flags.f_hearth_lit&&curMap()===2&&!AREA&&(a.snow||0)>0.15&&dist(player.x,player.y,F2SP.hearthold.x,F2SP.hearthold.y)<620){ if(F2ST.ambSrc!==a){ F2ST.ambSrc=a; F2ST.amb=Object.assign({},a,{snow:0.15}); } return F2ST.amb; } }catch(e){} return a; }; }

// ---------- 9. drawing: Glaciar on the Crown, Hush, the Great Hearth's new flame (only where no other module draws them)
// (the camera leans most of the way up to her head: she is tall, and Ash stands at the south edge of the Crown)
function f2sGlacShow(mode){ F2ST.glac={mode,t:0}; if(mode==='spell'||mode==='awake'||mode==='down') F2ST.cam={x:F2SP.crown.x,y:F2SP.crown.y-150,k:0.8}; }
function f2sHushShow(mode){
  const P=f2sAt('shoulder'), Q=F2SP.plaza;
  if(mode==='unfold') F2ST.hush={mode,x:P.x-60,y:P.y-30,t:0};
  else if(mode==='glide') F2ST.hush={mode,x0:(F2ST.hush&&F2ST.hush.x)||P.x,y0:(F2ST.hush&&F2ST.hush.y)||P.y,x:P.x,y:P.y,t:0};
  else if(mode==='small') F2ST.hush={mode,x:player.x+14,y:player.y-30,t:0};
  else if(mode==='away') F2ST.hush={mode,x:player.x+14,y:player.y-30,t:0};
  if(mode==='glide'){ F2ST.hush.tx=Q.x; F2ST.hush.ty=Q.y; }
}
const F2S_GSPR={};
// the ice dragon coiled round her spike of black ice; mode 'spell' (violet eyes), 'awake' (blue), 'sleep'/'down' (eyes shut, snow)
const F2S_GW=600,F2S_GH=420,F2S_GOY=60;
function f2sGlacPts(){ if(F2ST.gp) return F2ST.gp; const pts=[]; for(let i=0;i<=64;i++){ const t=i/64, a=0.5+t*3.2*Math.PI, r=210*(1-0.62*t); pts.push({x:Math.cos(a)*r,y:Math.sin(a)*r*0.42-t*160,w:9+31*Math.pow(t,0.7),back:Math.sin(a)<-0.05,t}); } return (F2ST.gp=pts); }
function f2sGlacSprite(mode){
  const sb=typeof LOOK!=='undefined'&&LOOK.sb, key=mode+(sb?'|sb':''); if(F2S_GSPR[key]) return F2S_GSPR[key];
  const cv=mkCanvas(F2S_GW,F2S_GH), g=cv.getContext('2d'); g.translate(F2S_GW/2,F2S_GH-F2S_GOY); g.lineJoin='round'; g.lineCap='round';
  const O=sb?'#2a3450':'#4a6488', P=f2sGlacPts(), sleep=mode==='sleep'||mode==='down';
  const pass=list=>{ g.fillStyle=O; for(const p of list){ g.beginPath(); g.arc(p.x,p.y,p.w+3.2,0,TAU); g.fill(); }
    for(const p of list){ g.fillStyle='#eaf5ff'; g.beginPath(); g.arc(p.x,p.y,p.w,0,TAU); g.fill(); }
    for(let i=0;i<list.length;i+=2){ const p=list[i]; g.fillStyle='rgba(150,200,240,.55)'; g.beginPath(); g.ellipse(p.x,p.y+p.w*0.45,p.w*0.8,p.w*0.38,0,0,TAU); g.fill();
      g.fillStyle='rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(p.x-p.w*0.3,p.y-p.w*0.45,p.w*0.32,p.w*0.16,-0.3,0,TAU); g.fill(); }
    for(let i=3;i<list.length;i+=4){ const p=list[i]; g.fillStyle='#bfe4fa'; g.strokeStyle=O; g.lineWidth=2; g.beginPath(); g.moveTo(p.x-6,p.y-p.w+2); g.lineTo(p.x,p.y-p.w-12-p.w*0.2); g.lineTo(p.x+6,p.y-p.w+2); g.closePath(); g.fill(); g.stroke(); } };
  const back=P.filter(p=>p.back), front=P.filter(p=>!p.back);
  // the wings, folded behind (frosted glass)
  const wa=P[52]; g.fillStyle='rgba(200,230,255,.5)'; g.strokeStyle='rgba(120,170,220,.9)'; g.lineWidth=2.5;
  for(const s of [1,0.7]){ g.beginPath(); g.moveTo(wa.x,wa.y); g.lineTo(wa.x+150*s,wa.y-150*s); g.lineTo(wa.x+190*s,wa.y-60*s); g.lineTo(wa.x+130*s,wa.y-10); g.lineTo(wa.x+60,wa.y+10); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(wa.x+20,wa.y); g.lineTo(wa.x+150*s,wa.y-150*s); g.moveTo(wa.x+40,wa.y); g.lineTo(wa.x+190*s,wa.y-60*s); g.stroke(); }
  pass(back);
  // the spike of black ice, streaked with violet
  g.fillStyle='#1c1a2a'; g.strokeStyle=O; g.lineWidth=3; g.beginPath(); g.moveTo(-34,8); g.lineTo(-6,-330); g.lineTo(8,-300); g.lineTo(36,8); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle='rgba(180,140,255,.75)'; g.lineWidth=3; g.beginPath(); g.moveTo(-14,-20); g.lineTo(-4,-150); g.lineTo(-10,-240); g.moveTo(12,-40); g.lineTo(6,-130); g.stroke();
  g.fillStyle='rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(-28,0); g.lineTo(-6,-320); g.lineTo(-14,0); g.closePath(); g.fill();
  pass(front);
  // the head, at the end of the neck, looking left
  const h=P[P.length-1], hx=h.x-30, hy=h.y-26;
  g.fillStyle=O; g.beginPath(); g.ellipse(hx,hy,52,30,-0.15,0,TAU); g.fill();
  g.fillStyle='#f2f9ff'; g.beginPath(); g.ellipse(hx,hy,49,27,-0.15,0,TAU); g.fill();
  g.fillStyle='#d6eafa'; g.beginPath(); g.ellipse(hx-34,hy+10,24,13,-0.1,0,TAU); g.fill(); g.strokeStyle=O; g.lineWidth=2.5; g.stroke();
  g.fillStyle=O; g.beginPath(); g.ellipse(hx-50,hy+6,3,2.2,0,0,TAU); g.fill();
  g.strokeStyle=O; g.lineWidth=2.4; g.beginPath(); g.moveTo(hx-56,hy+16); g.quadraticCurveTo(hx-30,hy+24,hx-4,hy+16); g.stroke();
  // icicle horns curling back like a crown
  for(const [ox,oy,len,k] of [[14,-20,70,1],[2,-24,58,0.8],[24,-14,48,0.7]]){ g.strokeStyle=O; g.lineWidth=11*k+3; g.beginPath(); g.moveTo(hx+ox,hy+oy); g.quadraticCurveTo(hx+ox+len*0.7,hy+oy-len*0.8,hx+ox+len,hy+oy-len*0.3); g.stroke();
    g.strokeStyle='#cfeeff'; g.lineWidth=11*k; g.stroke(); g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=2.5; g.stroke(); }
  // frost whiskers
  g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=2.2; for(const s of [-1,1]){ g.beginPath(); g.moveTo(hx-40,hy+12); g.quadraticCurveTo(hx-70,hy+20+s*10,hx-96,hy+40+s*16); g.stroke(); }
  // the eye
  if(sleep){ g.strokeStyle=O; g.lineWidth=3; g.beginPath(); g.arc(hx-6,hy-6,9,0.2,Math.PI-0.2); g.stroke(); }
  else{ const ec=mode==='spell'?'#c890ff':'#8ad8ff'; g.save(); g.shadowColor=ec; g.shadowBlur=16; g.fillStyle=ec; g.beginPath(); g.ellipse(hx-6,hy-8,10,6.5,-0.2,0,TAU); g.fill(); g.restore();
    g.fillStyle='#10142a'; g.beginPath(); g.ellipse(hx-6,hy-8,2.4,5.5,0,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(hx-9,hy-11,2,0,TAU); g.fill(); }
  // snow over her when she sleeps
  if(sleep){ g.fillStyle='#f8fbff'; g.strokeStyle='rgba(150,180,215,.9)'; g.lineWidth=2;
    for(let i=0;i<P.length;i+=3){ const p=P[i]; if(p.back) continue; g.beginPath(); g.ellipse(p.x,p.y-p.w*0.55,p.w*0.95,p.w*0.5,0,Math.PI,TAU); g.fill(); g.stroke(); }
    g.beginPath(); g.ellipse(hx+6,hy-22,30,10,-0.2,Math.PI,TAU); g.fill(); g.stroke(); }
  return (F2S_GSPR[key]=cv);
}
function f2sGlacMode(){
  if(typeof EDEF!=='undefined'&&G.enemies.some(e=>!e.dead&&e.type==='f_glaciar')) return null;   // the fight's own figure is out
  const C=G.choices;
  if(F2ST.glacLeave<0||(C.f_glaciar==='free'&&C.f_glaciar_home==='north'&&!F2ST.glacLeave)) return null;
  if(F2ST.glac) return F2ST.glac.mode;
  // (the finale: once Ash has sung her awake or she has flown to the peak with him, flag n5_glaciar, she is not here)
  if(G.flags.n5_glaciar&&actOf(G.stage)>=5&&!F2ST.glac) return null;
  if(C.f_glaciar==='defeat') return 'sleep';
  if(C.f_glaciar==='free') return 'awake';
  if(reached('f_glaciar')&&!f2sGlacReal()) return 'spell';
  return null;
}
function f2sDrawGlac(mode){
  const X=F2SP.crown.x, Y=F2SP.crown.y, t=G.time, sp=f2sGlacSprite(mode==='down'?'sleep':mode);
  const a=F2ST.glacLeave>0?clamp(1-F2ST.glacLeave/3.6,0,1):1, lift=F2ST.glacLeave>0?F2ST.glacLeave*90:0, breathe=mode==='sleep'?Math.sin(t*1.2)*1.5:Math.sin(t*1.6)*2.5;
  ctx.save(); ctx.globalAlpha=0.28*a; ctx.fillStyle='#1a2440'; ctx.beginPath(); ctx.ellipse(X,Y+8,250,70,0,0,TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha=a; ctx.drawImage(sp,X-F2S_GW/2,Y-(F2S_GH-F2S_GOY)-lift+breathe); ctx.restore();
  // (asleep after the 'defeat' outcome she is still chained: the chains left on her stay drawn)
  if(mode==='spell'||((mode==='sleep'||mode==='down')&&G.choices.f_glaciar!=='free')){ const P=f2sGlacPts();
    // the Shard glowing violet in her chest
    const c=P[50]; if(mode==='spell') glowAt(X+c.x,Y+c.y+breathe,46+6*Math.sin(t*3),'190,140,255',0.45);
    // the chains, from her coils to the chain stones (melted ones are gone)
    const stones=F2S_STONES; ctx.save(); ctx.lineCap='round';
    for(let i=0;i<4;i++){ const L=stones[i], done=F2ST.locks?F2ST.locks[i]&&(F2ST.locks[i].done||G.found[L.id]):(G.flags.f_chains|0)>i; if(done) continue; const q=P[16+i*10];
      ctx.strokeStyle='rgba(60,30,110,.85)'; ctx.lineWidth=7; ctx.setLineDash([10,6]); ctx.lineDashOffset=-t*8; ctx.beginPath(); ctx.moveTo(X+q.x,Y+q.y); ctx.lineTo(L.x,L.y-30); ctx.stroke();
      ctx.strokeStyle='rgba(196,160,255,.9)'; ctx.lineWidth=3.5; ctx.stroke(); }
    ctx.setLineDash([]); ctx.restore(); }
  if(mode==='awake'&&!G.items.f_shard2){ const c=f2sGlacPts()[50]; glowAt(X+c.x,Y+c.y,30,'150,220,255',0.4); }
}
// Hush: a barn-sized white moth (e7b_threads' moth portrait is her picture); the little moth after the fight
let F2S_HSPR=null;
function f2sHushSprite(){
  if(F2S_HSPR) return F2S_HSPR; const cv=mkCanvas(240,220), g=cv.getContext('2d'); g.translate(120,120);
  if(typeof thrFaceMoth==='function') thrFaceMoth(g,{wing:'#f4f2fa',wing2:'#d4d0e6',eye:'#b890f0',iris:'#6a3ac8',fur:'#ffffff',fur2:'#e8e4f6',eyes:'#3a2a5a',ant:'#f0ecff'});
  else{ g.fillStyle='#f4f2fa'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*50,-20,50,34,s*0.4,0,TAU); g.fill(); g.fillStyle='#b890f0'; g.beginPath(); g.arc(s*60,-24,12,0,TAU); g.fill(); g.fillStyle='#f4f2fa'; } g.fillStyle='#fff'; g.beginPath(); g.ellipse(0,6,22,36,0,0,TAU); g.fill(); }
  return (F2S_HSPR=cv);
}
function f2sHushPos(){
  const H=F2ST.hush; if(!H) return null; const t=H.t;
  if(H.mode==='unfold') return {x:H.x,y:H.y,z:60+t*8,k:Math.min(1.5,0.4+t*0.9),a:Math.min(1,t*1.5)};
  if(H.mode==='glide'){ const u=Math.min(1,t/4); H.x=lerp(H.x0,H.tx,u); H.y=lerp(H.y0,H.ty,u); return {x:H.x,y:H.y,z:150-60*u,k:1.5,a:1}; }
  if(H.mode==='high') return {x:H.x+Math.sin(t*0.7)*120,y:H.y+Math.sin(t*1.1)*40,z:150+Math.sin(t*2)*12,k:1.5,a:1};
  if(H.mode==='low') return {x:H.x,y:H.y,z:Math.max(20,90-t*40),k:1.5,a:1};
  if(H.mode==='small') return {x:player.x+16,y:player.y,z:26+Math.sin(t*6)*2,k:0.16,a:1};
  if(H.mode==='away') return {x:player.x+16+t*40,y:player.y-t*20,z:26+t*90,k:0.16,a:clamp(1-t/3,0,1)};
  return null;
}
function f2sDrawHush(q){
  const sp=f2sHushSprite(), f=1+0.14*Math.sin(G.time*(q.k<0.5?18:5));
  ctx.save(); ctx.globalAlpha=0.22*q.a; ctx.fillStyle='#1a1430'; ctx.beginPath(); ctx.ellipse(q.x,q.y,90*q.k,26*q.k,0,0,TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha=q.a; ctx.translate(q.x,q.y-q.z); ctx.scale(q.k*f,q.k); ctx.drawImage(sp,-120,-120); ctx.restore();
  if(q.k>0.5) glowAt(q.x,q.y-q.z,120,'220,210,255',0.18*q.a);
}
// the Great Hearth's blue and gold flame, when x2_world has no Hearth of its own
function f2sDrawHearth(){
  const P=F2SP.hearth, t=G.time;
  glowAt(P.x,P.y-50,120,'140,190,255',0.35+0.05*Math.sin(t*5));
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){ const ph=t*3+i*1.3, hgt=70+20*Math.sin(ph), w=18+6*Math.sin(ph*1.7); const x=P.x-30+i*15;
    ctx.fillStyle=i%2?'rgba(255,200,90,.55)':'rgba(110,170,255,.6)'; ctx.beginPath(); ctx.moveTo(x-w/2,P.y-6); ctx.quadraticCurveTo(x-w*0.4,P.y-hgt*0.6,x+Math.sin(ph)*6,P.y-hgt); ctx.quadraticCurveTo(x+w*0.4,P.y-hgt*0.6,x+w/2,P.y-6); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
const F2S_LT=[];
function f2sLights(){
  for(const L of F2S_LT){ const i=LIGHTS.indexOf(L); if(i>=0) LIGHTS.splice(i,1); } F2S_LT.length=0;
  if(AREA||curMap()!==2) return; const add=(x,y,r,i)=>{ const L={x,y,r,i,f2s:true}; F2S_LT.push(L); LIGHTS.push(L); };
  if(G.flags.f_hearth_lit&&!f2sLm('f_lm_hearth','hearth').lm) add(F2SP.hearth.x,F2SP.hearth.y-50,360,0.9);
  const q=f2sHushPos(); if(q&&q.k>0.5) add(q.x,q.y-q.z,220,0.5);
}
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{ if(G&&G.mode==='story') f2sRender(list); }catch(e){ console.error(e); } }; }
function f2sRender(list){
  if(AREA||curMap()!==2){ if(F2S_LT.length) f2sLights(); return; }
  f2sLights();
  if(actOf(G.stage)<3) return;
  const gm=f2sGlacMode(); if(gm&&inView(F2SP.crown.x,F2SP.crown.y-120,360)) list.push({x:F2SP.crown.x,y:F2SP.crown.y+40,draw:()=>f2sDrawGlac(gm)});
  const live=G.enemies.some(e=>!e.dead&&e.type==='f_hush');
  if(!live){ const q=f2sHushPos(); if(q&&q.a>0.02&&inView(q.x,q.y-q.z,200)) list.push({x:q.x,y:q.y+(q.z>40?200:2),draw:()=>f2sDrawHush(q)}); }
  if(G.flags.f_hearth_lit&&!f2sLm('f_lm_hearth','hearth').lm&&inView(F2SP.hearth.x,F2SP.hearth.y,160)) list.push({x:F2SP.hearth.x,y:F2SP.hearth.y+4,draw:f2sDrawHearth});
}

// ---------- 10. cross-act threads Act III owns (bible 6.13, 6.14, 11; THREADS 9.3, 12, 14.3, 18.3)
// Pebble's Act III letters: f_pb_1 is the intro (Mom's snow letter), f_pb_2 and f_pb_3 come the first time Ash is
// outdoors after the Glacier Maze and Stonehorn Deep, f_pb_4 (Dell) and f_pb_5 (Quill) after the act
const F2S_MAIL={
  f_pb_1:{from:'maren',quiet:true,when:()=>false,lines:()=>STORY.f_intro,then:()=>f2sIntroDone()},
  f_pb_2:{from:'maren',quiet:true,when:()=>reached('f_kindle'),lines:()=>[
    xl('narr',`Pebble lands on your head with another letter, and takes another coin. She must have quite a pile by now.`,`Pebble brings a letter. She takes a coin. Again.`),
    xl('maren',`(the letter) Ash. Yara says you have BLUE fire now. Pebble told her. Don't ask me how. Your grandmother had blue fire once. She set the river on fire. Rivers are not supposed to burn.`,`Yara says you have BLUE fire! Grandma set a river on fire once.`),
    xl('maren',`Please don't set any rivers on fire. If you do, put them out. Eat something. Love, Mom. P.S. Bertram says the frozen buns make excellent paperweights. He's selling them.`,`Don't set rivers on fire. Eat something. Love, Mom. P.S. Bertram sells frozen buns as paperweights.`),
    xl('maren',`P.P.S. The bakery exploded. Unrelated.`,`P.P.S. The bakery exploded. Not your fault.`),
    f2sIf('maren',`P.P.P.S. Tikka sent you a lumpy bun. It froze. It is still lumpy. Lumpy means love, she says.`,`P.P.P.S. Tikka sent a lumpy bun. It froze. Lumpy means love.`,()=>G.flags.tk_home==='baker')]},
  f_pb_3:{from:'maren',when:()=>reached('f_dreadgate'),lines:()=>[
    xl('maren',`(the letter) Ash. Yara says you are about to climb a mountain to visit your AUNT. If she's your auntie, she's mine too, a few greats back. Nobody tells me anything.`,`Yara says you will visit your AUNT on a mountain. She's my auntie too!`),
    xl('maren',`Be polite. Take your hat off indoors. If she offers you tea, drink it, even if it's made of ice. Love, Mom.`,`Be polite. Hat off indoors. Drink her tea, even ice tea. Love, Mom.`),
    xl('maren',`P.S. Wendel wrote a new song about you. It rhymes "Ash" with "succotash". I've asked him to stop.`,`P.S. Wendel's new song rhymes "Ash" with "succotash".`),
    f2sIf('maren',`P.P.S. Grandpa wants me to tell her he says hello. He also says "she started it." I don't know what that means.`,`P.P.S. Grandpa says hello. And "she started it."`,()=>f2sEnding()==='lantern')]},
  f_pb_4:{from:'dell',when:()=>!!G.flags.f_done,lines:()=>[
    xl('dell',`Dear Ash. I bought a SEA boat in Gearhaven. I have not lost it yet. It has been four days.`,`Dear Ash. I bought a SEA boat. I have not lost it yet!`),
    xl('dell',`When you need to go east, come to the dock. Dell.`,`When you go east, come to the dock. Dell.`)]},
  f_pb_5:{from:'quill',when:()=>(G.flags.moon==null?100:G.flags.moon)<=85,lines:()=>[
    xl('quill',`Fifteen percent. Something is EATING it. Nothing is supposed to eat moons.`,`Something is eating the moon!`),
    xl('quill',`I have measured it every night this week. Professor Quill. P.S. Please stop whatever is eating it.`,`I measure it every night. Professor Quill.`)]}
};
// (Mom's three letters are the story's. Dell's and Quill's belong to x2_people, which loads first: these two stand in
// only when no other Act III letter from that writer is registered)
if(typeof PEBBLE_MAIL!=='undefined'&&Array.isArray(PEBBLE_MAIL)) for(const id in F2S_MAIL){
  const d=F2S_MAIL[id]; if(PEBBLE_MAIL.some(m=>m&&m.id===id)) continue;
  if(d.from!=='maren'&&PEBBLE_MAIL.some(m=>m&&m.from===d.from&&String(m.id).startsWith('f_pb'))) continue;
  PEBBLE_MAIL.push(Object.assign({id},d)); }
// dreams: f_auntie (bible 6.14) and the optional f_lullaby (THREADS 12), added only when nobody has
const F2S_DREAMS={
  f_auntie:{stages:['f_thaw','f_sky','f_gap'],title:S('Snowflakes with Auntie','Snowflakes with Auntie'),scene:'auntie',lines:()=>[
    xl('narr',`You dream you're Ember, a girl with little red horns, on top of a white mountain. Beside you lies a huge, gentle ice dragon, curled up like a cat.`,`You dream you are young Ember on a white mountain. A big, gentle ice dragon lies beside you.`),
    xl('ember_kid',`Auntie, teach me to make a snowflake!`,`Auntie, teach me to make a snowflake!`),
    xl('narr',`You breathe. Too hot. Every snowflake turns into a raindrop and plops on your nose. The dragon laughs. It sounds like wind chimes.`,`You breathe. Too hot! The snowflakes turn to raindrops. The dragon laughs like wind chimes.`),
    xc('ember_kid',`What do you do?`,`What do you do?`,[
      xo(`Make a snowflake together`,`Make one together`,{tone:'kind',fn:()=>{ G.flags.dr_f_auntie='flake'; },then:[xl('narr',`You breathe warm. She breathes cold. Between you, a perfect snowflake forms, as big as a shield, and floats away over the hills.`,`You breathe warm. She breathes cold. A huge, perfect snowflake floats away.`)]}),
      xo(`Have a snowball fight`,`Snowball fight!`,{tone:'silly',fn:()=>{ G.flags.dr_f_auntie='snowball'; },then:[xl('narr',`You throw a snowball. She throws one back. It is the size of a house. She wins. Gently.`,`You throw a snowball. She throws one as big as a house. She wins. Gently.`)]}),
      xo(`Ask her to sing`,`Ask her to sing`,{fn:()=>{ G.flags.dr_f_auntie='sing'; },then:[
        xl('narr',`"Sleep now, the snow is falling slow, the Snow Mother sings it soft and low. She tucks the hills in white and blue, and saves one gentle snow for you."`,`"Sleep now, the snow falls slow. The Snow Mother sings soft and low. She tucks the hills in white and blue, and saves one snow for you."`)]})]),
    xl('narr',`You wake up with snow on your nose. It isn't melting.`,`You wake up with snow on your nose. It is not melting.`)]},
  f_lullaby:{stages:['f_dreadgate','f_dread'],title:S('Everyone Asleep','Everyone Asleep'),scene:'lullaby',lines:()=>[
    xl('narr',`You dream of Emberhollow, but it's wrong. Everyone is asleep. Standing up. In the street. Mom at the forge, her hammer in the air. Bertram in the middle of a sneeze.`,`Everyone in Emberhollow is asleep, standing up.`),
    xl('narr',`Snow falls very gently. Nothing moves. Somewhere, someone is humming the lantern song. Backwards.`,`Snow falls. Someone hums the lantern song backwards.`),
    xc('nyxara',`Isn't it peaceful? Nobody is sad. Nobody is leaving. Nobody ever has to say goodbye.`,`Isn't it nice? Nobody leaves. Nobody says goodbye.`,[
      xo(`It isn't peaceful. It's just quiet.`,`It is not nice. It is just quiet.`,{tone:'kind',fn:()=>{ G.flags.dr_f_lullaby='quiet'; }}),
      xo(`WAKE UP, MOM!`,`WAKE UP, MOM!`,{tone:'brave',fn:()=>{ G.flags.dr_f_lullaby='wake'; },then:[xl('narr',`You shout so loud the snow stops in the air. Mom's hammer twitches.`,`You shout! Mom's hammer moves a little.`)]})]),
    xl('narr',`You wake up with frost on your blanket.`,`You wake up. There is frost on your blanket.`)]}
};
// (the dream's sung verse, dr_f_auntie 'sing', counts as verse one of the Snow Mother's Song: x2_people's f_song reads it)
if(typeof DREAMS!=='undefined') for(const id in F2S_DREAMS) if(!DREAMS[id]){ if(typeof defineDream==='function') defineDream(id,F2S_DREAMS[id]); else { DREAMS[id]=F2S_DREAMS[id]; if(typeof DREAM_ORDER!=='undefined'&&!DREAM_ORDER.includes(id)) DREAM_ORDER.push(id); } }
if(typeof DREAM_TALK!=='undefined'&&!DREAM_TALK.f_lullaby) DREAM_TALK.f_lullaby={maren:S(`I dreamed everybody fell asleep standing up. Then I dreamed you shouted at me. Rude. Thank you.`,`I dreamed you shouted at me. Thank you.`)};
// the Act III epilogue lines (bible 6.13), for the finale (EPI.f): x2_people owns them (it loads first); the bible's
// list stands in when EPI.f is still empty, and the defeat line (Glaciar asleep) is added once either way
const F2S_EPI_DEFEAT={pri:3,cond:()=>G.choices.f_glaciar==='defeat',line:['narr',S(`On Mount Dread an ice dragon slept on under her blanket of snow, and every spring a small dragon with red horns climbed up to say hello.`,`Glaciar slept on. Every spring, Ash climbed up to say hello.`)]};
if(typeof EPI!=='undefined'&&EPI&&Array.isArray(EPI.f)&&EPI.f.length&&!EPI.f.some(e=>e&&e.line&&e.line[1]===F2S_EPI_DEFEAT.line[1])) EPI.f.push(F2S_EPI_DEFEAT);
if(typeof EPI!=='undefined'&&EPI&&Array.isArray(EPI.f)&&!EPI.f.length) EPI.f.push(
  {pri:9,cond:()=>G.choices.f_glaciar_home==='stay',line:['narr',S(`Glaciar stayed in the north as the Snow Mother. Once a year she breathed one gentle snow over Hearthold, for the sledding, and pinched the cheek of every child who asked.`,`Glaciar stayed. She made one gentle snow a year, for sledding.`)]},
  {pri:7,cond:()=>G.choices.f_glaciar==='free'&&G.choices.f_glaciar_home!=='stay',line:['narr',S(`Glaciar rested in the far north, past the edge of the ice. Every Lantern Day a single snowflake the size of a shield landed on Mom's forge.`,`Glaciar rested far north. Every Lantern Day, a giant snowflake landed on the forge.`)]},
  {pri:6,cond:()=>!!G.flags.f_mumble_ally,line:['narr',S(`Mumble the yeti joined the Hearthold choir. He sings the low notes. All of them. Very loudly. Not sorry at all.`,`Mumble joined the choir. He sings very loudly now.`)]},
  {pri:5,cond:()=>!!(G.quests.f_rime&&G.quests.f_rime.done),line:['narr',S(`Rimeholm's bell rang every morning after that, and nobody in the village ever rested their eyes for a whole month again.`,`Rimeholm's bell rang every morning. Nobody froze again.`)]},
  {pri:4,cond:()=>!!(G.quests.f_bombs&&G.quests.f_bombs.done),line:['narr',S(`Mags Sprocket opened Hearthold's first fireworks shop. Captain Brann fell out of his tower every New Year.`,`Mags opened a fireworks shop. Brann fell off his tower.`)]},
  F2S_EPI_DEFEAT);
// villager barks (bible 6.14) belong to x2_people (the Hearthold, Rimeholm and Snow Mother barks are all there). The
// bitten-moon bark for kids anywhere (THREADS 4.5) is the story's.
B('f2s_moon85','kid',()=>!!G.flags&&(G.flags.moon==null?100:G.flags.moon)<=85&&(G.flags.moon==null?100:G.flags.moon)>60,S('Somebody took ANOTHER bite out of the moon! It wasn\'t me. I only bite cookies.','Another bite out of the moon! Not me!'));

// ---------- 11. the journal: Tove gives the hints in Act III (the Hint line says "Warden Tove")
{ const base=renderJour; renderJour=function(){ base(); try{ if(f2sOn()) f2sJourHint(); }catch(e){} }; }
function f2sJourHint(){
  const el=document.querySelectorAll('#jBody .qs'); if(!el||!el.length) return;
  const yn=typeof personName==='function'?personName('yara'):'Elder Yara', tn=(SPK.tove&&SPK.tove.name)||'Warden Tove';
  for(const q of el){ const t=q.textContent||''; if(t.startsWith(yn+':')){ q.textContent=tn+t.slice(yn.length); q.style.color='#d2e6ff'; } }
}

// ---------- 12. saves: transient state resets on a new run or a load (all story state lives in G.flags / G.choices)
function f2sReset(){ Object.assign(F2ST,{q:[],cam:null,glac:null,hush:null,lamps:null,locks:null,boss:null,rb:null,bt:0,yara:{},seenChains:0,n9:false,fade:false,introDone:false,hushDoneRun:false,glacEnd:false,glacEndRun:false,glacFreeQ:false,afterRun:false,ended:false,hushFall:false,hearthFx:0,glacLeave:0,pb2:0,pb3:0,warmBanner:0}); }
{ const base=newRun; newRun=function(mode){ base(mode); try{ f2sReset(); }catch(e){} }; }
{ const base=loadGame; loadGame=function(s){ base(s); try{ f2sReset(); f2sMigrate(); }catch(e){ console.error(e); } }; }
{ const base=startAct; startAct=function(n,o){ const r=base(n,o); try{ if(r&&n===3){ F2ST.introDone=false; f2sMigrate(); setupNPCs(); } }catch(e){ console.error(e); } return r; }; }
// saves from later in the act: the flags and marks implied by the stages before it (a beat already past never replays)
function f2sMigrate(){
  const F=G.flags; if(actOf(G.stage)!==3) return;
  const at=s=>reached(s), mark=(...k)=>{ for(const x of k) f2sMark(x); };
  if(at('f_pass')){ mark('f_intro','f_lodge'); F.f_pb_1=1; }
  if(at('f_hearth')){ F.f_arrived=1; mark('f_arrive','f_gate'); }
  if(at('f_maze')) mark('f_brynja');
  if(at('f_kindle')) mark('f_moat');
  if(at('f_thaw')){ F.f_hearth_lit=1; F.f_northgate=1; mark('f_kindle','f_northgate','f_fergus_cold'); if(F.pip) F.f_pip_warm=1; F.f_pb_2=1; }
  if(at('f_sky')){ F.f_ylva=1; mark('f_rime_arrive','f_ylva','f_ylva_end'); }
  if(at('f_gap')) mark('f_pennant','f_on_windscour','f_on_isles','f_rim_t');
  if(at('f_deep')){ F.f_gap_crossed=1; mark('f_gap_say','f_horned','f_pennant_home'); }
  if(at('f_dread')){ F.f_drum=1; F.f_hush_done=1; mark('f_dreadgate','f_drum','f_hush_intro','f_hush_outro'); F.f_pb_3=1; G.bossDone.f_hush=true; }
  if(at('f_glaciar')){ F.f_crown_open=1; mark('f_dread_in','f_crown_door'); }
  if(F.f_done){ F.f_moon_bite3=1; F.f_nyx_named=1; f2sMoon(85); if(!G.items.f_shard2) G.items.f_shard2=1; if(!G.choices.f_glaciar) G.choices.f_glaciar='defeat'; }
}

// ---------- 13. debug hooks (tests: scratchpad/c_f2s/t_f2s.py); the bible's names (13.3) are here too
// __eb.actStart(3,'<stage>') also gets the world flags and the powers implied by the stage (the same fill-in as an
// old save), and the bible's test choices (13.2): the 'lantern' ending, Greymane as an ally
const F2S_POW={f_kindle:['blaze'],f_gap:['blaze','windride'],f_dreadgate:['blaze','windride','pound']};
function f2sStageKit(st){
  const order=['f_snow','f_pass','f_hearth','f_maze','f_kindle','f_thaw','f_sky','f_gap','f_deep','f_dreadgate','f_dread','f_glaciar'];
  const i=order.indexOf(st); if(i<0) return;
  for(const k in F2S_POW) if(order.indexOf(k)<=i) for(const a of F2S_POW[k]) if(!f2sAbil(a)){ G.abil[a]=true; }
  const F=G.flags;
  if(i>=order.indexOf('f_kindle')) F.trial_f_maze_done=true;
  if(i>=order.indexOf('f_gap')) F.trial_f_sky_done=true;
  if(i>=order.indexOf('f_dreadgate')) F.trial_f_deep_done=true;
}
{ const base=window.__ebX&&window.__ebX.actStart; if(typeof base==='function') window.__ebX.actStart=function(n,w){ const r=base(n,w); try{ if((n|0)===3&&G.mode==='story'){ Object.assign(G.choices,{ending:'lantern',greymane:'ally'}); f2sStageKit(G.stage); f2sMigrate(); setupNPCs(); } }catch(e){ console.error(e); } return r; }; }
// the bible's names (13.3) go on __ebX only when no other module took them; all of them are also on __ebX.f2s
const F2S_BIBLE_DBG={
  fThawAll:()=>f2sThawAll(), fChains:n=>{ G.flags.f_chains=clamp(n|0,0,4); return G.flags.f_chains; },
  fSong:()=>{ Object.assign(G.flags,{f_song:1,f_v1:1,f_v2:1,f_v3:1}); return true; },
  fStage:id=>{ if(!STAGEDEF[id]) return false; G.stage=id; f2sStageKit(id); f2sMigrate(); goStage(id,{card:false,quiet:true}); return G.stage; },
  fFrozen:()=>LANDMARKS.filter(o=>o&&o.p3==='frozen').map(o=>({id:o.id,who:o.who||null,x:Math.round(o.x),y:Math.round(o.y),st:o.st,flag:typeof p3FrozenFlag==='function'?p3FrozenFlag(o):null,f2s:!!o.f2s}))};
window.__ebX=window.__ebX||{};
for(const k in F2S_BIBLE_DBG) if(!window.__ebX[k]) window.__ebX[k]=F2S_BIBLE_DBG[k];
Object.assign(window.__ebX,{
  f2s:{...F2S_BIBLE_DBG,F2ST,F2SP,F2S_DUN,F2S_TAUNTS,F2S_MAIL,chains:()=>f2sChains(),
    prompts:()=>{ const o=[]; try{ miniPrompts((d,t,f,x,y)=>o.push({d:Math.round(d),text:simplify(String(t)),x:Math.round(x||0),y:Math.round(y||0)})); }catch(e){ o.push(String(e)); } return o; },play:f2sPlay,chain:f2sChain,seen:f2sSeen,mark:f2sMark,beat:f2sBeat,dunStory:f2sDunStory,intro:()=>f2sIntro(),
    stub:id=>f2sStub(id),glaciarEnd:how=>f2sGlaciarEnd(how),endAct:()=>f2sEndAct(),thaw:()=>f2sThawAll(),drum:()=>{ const P=f2sLm('f_lm_drum','drum'); return f2sDrumHit(P.x,P.y); },
    blaze:(what)=>{ const o=what==='gate'?F2ST.gateHook:F2ST.hearthHook; if(o&&o.p3on&&o.p3on.blaze&&o.p3on.blaze.then){ const B=o.p3on.blaze; if(!B.when||B.when(o)){ B.then(o); return true; } } return false; },
    lamps:()=>F2ST.lamps?F2ST.lamps.map(o=>({id:o.id,x:o.x,y:o.y,lit:!!o.lit})):null, lightLamps:()=>{ if(!F2ST.lamps) return false; for(const o of F2ST.lamps){ o.lit=true; if(G.found) G.found[o.id]=true; } return true; },
    locks:()=>F2ST.locks?F2ST.locks.map(o=>({id:o.id,x:o.x,y:o.y,done:!!(o.done||G.found[o.id])})):null, meltLocks:n=>{ if(!F2ST.locks) return false; let k=0; for(const o of F2ST.locks){ if(k>=(n==null?4:n)) break; if(!o.done){ o.done=true; o.snap=1; if(o.col&&typeof p3Uncol==='function') p3Uncol(o); G.found[o.id]=true; } k++; } return true; },
    glac:()=>({mode:f2sGlacMode(),glac:F2ST.glac,chains:f2sChains(),choice:G.choices.f_glaciar||null,home:G.choices.f_glaciar_home||null,shard:!!(G.items&&G.items.f_shard2),named:!!G.flags.f_nyx_named,moon:G.flags.moon==null?100:G.flags.moon}),
    dlg:()=>{ if(!DLG) return null; const L=lineParts(DLG.lines[DLG.i]); return {who:typeof L.who==='function'?L.who():L.who,text:DLG.text,i:DLG.i,n:DLG.lines.length,opts:DLG.opts?DLG.opts.map(o=>simplify(typeof o.t==='function'?o.t():o.t)):null}; },
    choose:i=>{ if(!DLG||!DLG.opts) return false; DLG.chars=1e9; DLG.fullAt=performance.now()-2000; DLG.optsAt=performance.now()-2000; dlgChoose(i); return true; },
    next:()=>{ if(!DLG) return false; if(DLG.opts) return false; advanceDialogue(); return true; },
    npc:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); return n?{x:Math.round(n.x),y:Math.round(n.y)}:null; },
    talk:id=>{ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); if(!n) return false; talkTo(n); return true; },
    prompt:()=>G.prompt?{text:G.prompt.text,x:Math.round(G.prompt.x||0),y:Math.round(G.prompt.y||0)}:null,
    use:()=>{ if(G.prompt){ const p=G.prompt; G.prompt=null; p.act(); return true; } return false; },
    rest:k=>{ if(k==='inn') innRest(); else restAtShrine(SHRINES.find(q=>mapAt(q.y)===curMap()&&q.x<IZX-50)||SHRINES[0]); return true; },
    state:()=>({stage:G.stage,act:G.act,map:curMap(),area:AREA?AREA.id:null,x:Math.round(player.x),y:Math.round(player.y),seen:Object.keys(G.flags.f_sn||{}),q:F2ST.q.map(q=>q.id),fb:Object.keys(F2ST.fb),
      flags:Object.fromEntries(['f_arrived','f_hearth_lit','f_northgate','f_ylva','f_gap_crossed','f_drum','f_hush_done','f_crown_open','f_moon_bite3','f_nyx_named','f_pip_warm','f_duchess','f_done','f_chains','f_glaciar_sung','f_pb_1','f_pb_2','f_pb_3','moon'].map(k=>[k,G.flags[k]==null?null:G.flags[k]])),
      choices:{f_glaciar:G.choices.f_glaciar||null,f_glaciar_home:G.choices.f_glaciar_home||null},abil:['blaze','windride','pound'].filter(a=>f2sAbil(a)),
      obj:(()=>{ try{ const o=questObjective(); return o?{text:o.text,x:Math.round(o.x||0),y:Math.round(o.y||0)}:null; }catch(e){ return String(e); } })()})
  }});

