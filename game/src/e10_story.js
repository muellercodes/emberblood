// ================= v10 story engine (e10_story): the story is DATA, this one module runs it
// Contract: scratchpad/v10/STORY_SPEC.md and _plan_format.md. How to write data for it: scratchpad/v10/ENGINE.md.
// The data files (game/story/**/*.js) run after the game's own code: build.mjs appends them after the IIFE closes, so
// they only see the window globals act(), chapter(), quest(), legacy() defined here; window.__ebStoryBoot() then checks
// everything (errors()) and hooks it into the game. Nothing in the data is a function: every rule is a string the
// engine parses (conditions, effects, steps) and the checker can read.
// State (saved with the game, old saves start empty): G.case = {clues:{id:1}, solved:{id:1}, tries:{id:n}, seen:{id:1}}
// (seen: clues the Case Book has shown), G.story = {[chapterId]: {[stepId]: 1, [stepId.partIndex]: 1}, 'q:<quest>': {...},
// _ev (events heard), _seen (scenes played), _once (talk lines used), _ex (things examined), _w (world states),
// _npc (people moved by effects), _trk (prints followed)}.
// Chapters are stages: a chapter is active while G.stage is its id. A chapter whose id is an old defineStages stage
// takes it over: objectives, update, marker, hint, talk, enter, card and "so far" come from the data, and the old
// triggers for that stage are silenced (the takeover adapters at the end of this file).

const S10={booted:false,acts:{},chapters:{},chOrder:[],quests:{},qOrder:[],legacy:{},places:{},clues:{},deduce:{},mysteries:{},trust:{},scenes:{},sceneOwner:{},
  talk:{},items:{},npcs:{},errs:[],errSeen:new Set(),raw:[],cam:null,actors:{},walks:[],after:[],pend:{},queue:[],pulseT:0,newClue:null,tickAt:-1,npcT:0,barkT:{},watchT:0,
  lookMiss:new Set(),quiet:false,auto:null,mini:{lostAt:-99,tries:0,owner:null},lastObj:null,talkCache:null};
// Vesper's trust keeps the old flag name (saves); an act file's trust:{...} adds or overrides tracks
S10.trust.vesper='c_trust';
function s10Err(msg){ const m=String(msg); if(S10.errSeen.has(m)) return; S10.errSeen.add(m); S10.errs.push(m); }
const s10Arr=v=>v==null?[]:Array.isArray(v)?v:[v];

// ---------- 1. the data globals (window: the story files run outside the game's scope)
function s10File(d){ try{ Object.defineProperty(d,'_file',{value:window.__ebStoryFile||null,enumerable:false,configurable:true}); }catch(e){} return d; }
function s10Take(kind,d){
  if(!d||typeof d!=='object'||Array.isArray(d)){ s10Err(`${kind}() needs one object (${window.__ebStoryFile||'?'})`); return d; }
  s10File(d); S10.raw.push([kind,d]); if(S10.booted) try{ s10Register(kind,d); s10Late(); }catch(e){ s10Err(`${kind} ${d.id}: ${e.message}`); }
  return d;
}
window.act=d=>s10Take('act',d);
window.chapter=d=>s10Take('chapter',d);
window.quest=d=>s10Take('quest',d);
window.legacy=d=>s10Take('legacy',d);
// (A2S) act-wide people talk and world places that belong to no chapter or quest
window.people=d=>s10Take('people',d);
window.places=d=>s10Take('places',d);
window.__ebStoryLoadErr=(f,e)=>{ s10Err(`${f}: ${e&&e.message||e}`); try{ console.warn('story data',f,e); }catch(err){} };

// ---------- 2. text: [full, simple] or a plain string (S registers the simple version for Words: Simple)
function s10T(x){ if(x==null) return '';
  // variants (A4S, A4b): { if, t: [full, simple] } is that text while its condition holds (else nothing); a list of
  // them is the first whose condition holds (a quest title, an end card line)
  if(s10IsVar(x)) return x.if==null||s10Cond(x.if)?s10T(x.t):'';
  if(Array.isArray(x)){ if(!x.length) return ''; if(s10IsVar(x[0])){ for(const v of x){ const t=s10T(v); if(t) return t; } return ''; }
    return x.length>1&&x[1]!=null&&x[1]!==''?S(String(x[0]),String(x[1])):String(x[0]); } return String(x); }
const s10IsVar=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&'t' in x;
const s10Tx=x=>simplify(s10T(x));
function s10Name(id){
  const e=s10Ent(id); if(e&&e.name) return s10T(e.name);
  const c=(typeof CASTBY!=='undefined'&&CASTBY[id])||(typeof SPECIAL!=='undefined'&&SPECIAL[id]); if(c) return c.name;
  if(SPK[id]) return SPK[id].name; return String(id||'').replace(/^[a-z0-9]+_/,'').replace(/_/g,' ');
}

// ---------- 3. conditions (space separated, all must hold; {any:[...]}, {all:[...]}, {not:...}; ! negates one test)
const S10C=new Map();
function s10Cond(src){
  if(src==null||src===true||src==='') return true; if(src===false) return false;
  const key=typeof src==='string'?src:null; let f=key?S10C.get(key):null;
  if(!f){ f=s10CondParse(src); if(key) S10C.set(key,f); }
  try{ return !!f(); }catch(e){ s10Err(`condition "${key||JSON.stringify(src)}": ${e.message}`); return false; }
}
const s10Num=v=>/^-?\d+(\.\d+)?$/.test(String(v))?+v:v;
// "name", "name>=3", "name=v": a test on get(name)
function s10Cmp(arg,get,numeric){
  const m=/^([^<>=!]+)(>=|<=|!=|==|=|>|<)(.*)$/.exec(String(arg||''));
  if(!m){ const k=arg; return numeric?()=>(+get(k)||0)>0:()=>!!get(k); }
  const k=m[1], op=m[2], v=s10Num(m[3]);
  return ()=>{ let a=get(k); if(typeof v==='number'){ a=+a||0; } else a=a==null?'':String(a);
    switch(op){ case '>=': return a>=v; case '<=': return a<=v; case '>': return a>v; case '<': return a<v; case '!=': return a!=v; default: return a==v; } };
}
function s10Hour(){ return ((G.tod%1)+1)%1*24; }
function s10HourFn(a){
  const m=/^(\d+)(?:-(\d+))?$/.exec(String(a||'')); if(!m){ s10Err(`hour "${a}" should be like 21 or 21-23`); return ()=>false; }
  const h0=+m[1], h1=m[2]!=null?+m[2]:null;
  return ()=>{ const h=s10Hour(); if(h1==null) return Math.floor(h)>=h0||(h0>=18&&h<5); return h0<=h1?(h>=h0&&h<h1+1):(h>=h0||h<h1+1); };
}
function s10StageCmp(op,id){
  return ()=>{ const a=stageAt(G.stage), b=stageAt(id); if(b<0){ s10Err(`stage ${id} is not a stage`); return false; }
    switch(op){ case '>=': return a>=b; case '>': return a>b; case '<=': return a<=b; case '<': return a<b; case '!=': return G.stage!==id; default: return G.stage===id; } };
}
function s10ActCmp(op,n){ n=+n; return ()=>{ const a=actOf(G.stage); switch(op){ case '>=': return a>=n; case '>': return a>n; case '<=': return a<=n; case '<': return a<n; case '!=': return a!==n; default: return a===n; } }; }
function s10CondParse(src){
  if(Array.isArray(src)){ const fs=src.map(s10CondParse); return ()=>fs.every(f=>f()); }
  if(src&&typeof src==='object'){
    const fs=[];
    if(src.any!=null){ const a=s10Arr(src.any).map(s10CondParse); fs.push(()=>a.some(f=>f())); }
    if(src.all!=null){ const a=s10Arr(src.all).map(s10CondParse); fs.push(()=>a.every(f=>f())); }
    if(src.not!=null){ const a=s10CondParse(src.not); fs.push(()=>!a()); }
    if(src.if!=null){ const a=s10CondParse(src.if); fs.push(a); }
    if(!fs.length){ s10Err(`condition ${JSON.stringify(src)} has no any/all/not`); return ()=>false; }
    return ()=>fs.every(f=>f());
  }
  const tk=String(src).trim().split(/\s+/).filter(Boolean), out=[];
  for(let i=0;i<tk.length;i++){
    let t=tk[i], neg=false; while(t[0]==='!'){ neg=!neg; t=t.slice(1); }
    let f=null; const arg=()=>{ const a=tk[++i]; if(a==null) s10Err(`condition "${src}": "${t}" needs a name`); return a; };
    const m=/^(stage|act)(>=|<=|!=|==|=|>|<)(.+)$/.exec(t);
    if(m) f=m[1]==='stage'?s10StageCmp(m[2],m[3]):s10ActCmp(m[2],m[3]);
    else switch(t){
      case 'flag': f=s10Cmp(arg(),k=>G.flags[k]); break;
      case 'item': f=s10Cmp(arg(),k=>k==='coins'?(G.coins||0):(G.items[k]||0),true); break;
      case 'coins': f=s10Cmp('coins'+(tk[i+1]&&/^[<>=!]/.test(tk[i+1])?tk[++i]:'>0'),()=>G.coins||0,true); break;
      case 'power': { const a=arg(); f=()=>s10HasPower(a); break; }
      case 'trust': f=s10Cmp(arg(),k=>s10Trust(k),true); break;
      case 'choice': f=s10Cmp(arg(),k=>G.choices&&G.choices[k]); break;
      case 'clue': { const a=arg(); f=()=>!!(G.case&&G.case.clues[a]); break; }
      case 'solved': { const a=arg(); f=()=>!!(G.case&&G.case.solved[a]); break; }
      case 'seen': { const a=arg(); f=()=>s10Seen(a); break; }
      case 'event': { const a=arg(); f=()=>!!(G.story&&G.story._ev&&G.story._ev[a]); break; }
      case 'quest': { const a=arg(); let w='done'; if(/^(done|active|started|open|available)$/.test(tk[i+1]||'')) w=tk[++i]; f=()=>s10QuestIs(a,w); break; }
      case 'step': { const a=arg(); f=()=>s10StepDone(a); break; }
      case 'near': { const a=arg(); let r=300; if(/^\d+$/.test(tk[i+1]||'')) r=+tk[++i]; f=()=>s10Near(a,r); break; }
      case 'night': f=()=>isNight(); break;
      case 'day': f=()=>!isNight(); break;
      case 'hour': f=s10HourFn(arg()); break;
      case 'diff': { const a=String(arg()||'').toLowerCase(); f=()=>String(G.diff&&G.diff.name||'').toLowerCase()===a; break; }
      case 'world': { const a=arg(); f=s10Cmp(a.includes('=')?a:a+'!=',k=>s10World(k)); break; }
      case 'stage': { const a=arg(); f=s10StageCmp('=',a); break; }
      case 'act': { const a=arg(); f=s10ActCmp('=',a); break; }
      case 'area': { const a=arg(); f=()=>!!AREA&&(AREA.id===a||String(AREA.id).startsWith(a+'_')); break; }
      case 'outdoors': f=()=>!AREA; break;
      case 'ending': { const a=arg(); f=()=>s10Ending(actOf(G.stage))===a; break; }
      // (v11 talk) what Ash answered: a reply's then: ['said key'] sets it (G.story.said, saved; old saves start empty)
      case 'said': { const a=arg(); f=()=>!!(G.story&&G.story.said&&G.story.said[a]); break; }
      case 'true': f=()=>true; break;
      case 'false': f=()=>false; break;
      default: s10Err(`condition "${src}": unknown test "${t}"`); f=()=>false;
    }
    if(neg){ const g0=f; f=()=>!g0(); }
    out.push(f);
  }
  return ()=>out.every(f=>f());
}
// an act's ending: the first entry of act.ending whose `if` holds (or the `else` one)
function s10Ending(n){ const A=S10.acts[n], E=A&&A.ending; if(!E) return null; let other=null; for(const k in E){ const e=E[k]||{}; if(e.else){ other=other||k; continue; } if(e.if!=null&&s10Cond(e.if)) return k; } return other; }
function s10HasPower(x){ return !!(hasAbil(x)||(G.weapons&&G.weapons[x])||(typeof hasSkill==='function'&&(()=>{ try{ return hasSkill(x); }catch(e){ return false; } })())); }
function s10TrustFlag(name){ return S10.trust[name]||('trust_'+name); }
function s10Trust(name){ return +(G.flags[s10TrustFlag(name)]||0); }
function s10Seen(id){ return !!((G.story&&G.story._seen&&G.story._seen[id])||(G.flags&&G.flags.c_sn&&G.flags.c_sn[id])); }
function s10World(id){ const w=G.story&&G.story._w?G.story._w[id]:undefined; if(w==null&&S10.places[id]&&S10.places[id].kind==='gate'){ try{ if(typeof gateIsOpen==='function'&&gateIsOpen(id)) return 'open'; }catch(e){} } return w; }
function s10QuestIs(id,w){
  const q=G.quests&&G.quests[id];
  if(w==='done') return !!(q&&q.done);
  if(w==='active') return !!(q&&!q.done);
  if(w==='started') return !!q;
  return !q&&!!S10.quests[id]&&s10QuestOpen(S10.quests[id]);
}
function s10StepDone(path){ const [c,s]=String(path).split('.'); const st=G.story&&G.story[c]; return !!(st&&st[s]); }

// ---------- 4. effects ('set x', 'give item 2', 'trust vesper +1', ..., {banner:[full,simple]})
function s10Do(list,ctx){
  S10.ver++;
  for(const e of s10Arr(list)){ try{ s10Effect(e,ctx||{}); }catch(err){ s10Err(`effect ${JSON.stringify(e)}: ${err.message}`); console.error(err); } }
}
function s10Effect(e,ctx){
  if(e==null) return;
  if(typeof e==='object'){
    if(Array.isArray(e)){ s10Do(e,ctx); return; }
    if(e.if!=null){ if(s10Cond(e.if)) s10Do(e.then,ctx); else if(e.else) s10Do(e.else,ctx); return; }
    if(e.banner){ if(!S10.quiet) setBanner(s10T(e.banner),e.sub?s10T(e.sub):'',e.dur||3); return; }
    if(e.journal!=null){ const t=s10T(e.journal), X=G.choices.extra||(G.choices.extra={}); X[e.key||('s10_'+h32(t))]=t; return; }
    if(e.say){ const L=s10Arr(e.say); if(L.length&&!S10.quiet){ const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===L[0]); const tx=s10T(L.slice(1,3)); if(n) npcBubble(n,tx); else bubble(player,tx,{who:'Ash',col:'#ffb070',dy:-52}); } return; }
    s10Err(`effect ${JSON.stringify(e)} is not understood`); return;
  }
  const tk=String(e).trim().split(/\s+/), k=tk[0], a=tk[1], b=tk[2], c=tk[3];
  const kv=s=>{ const i=String(s).indexOf('='); return i<0?[s,1]:[s.slice(0,i),s10Num(s.slice(i+1))]; };
  switch(k){
    case 'set': { const [f,v]=kv(a); G.flags[f]=v===true?1:v; break; }
    case 'clear': delete G.flags[a]; break;
    case 'give': { const n=b!=null?+b:1; if(a==='coins') addCoins(n,player.x,player.y); else if(a==='xp') gainXp(n); else if(typeof WEAPONS!=='undefined'&&WEAPONS[a]&&!(ITEM_NAMES[a])) giveWeapon(a,S10.quiet); else giveItems({[a]:n},S10.quiet); break; }
    case 'take': { const n=b!=null?+b:1; if(a==='coins') G.coins=Math.max(0,(G.coins||0)-n); else takeItems({[a]:n}); break; }
    case 'coins': addCoins(+a||0,player.x,player.y); break;
    case 'xp': gainXp(+a||0); break;
    case 'trust': { const f=s10TrustFlag(a), m=/^([+-=]?)(\d+)$/.exec(b||'+1'), n=m?+m[2]:1, cur=+(G.flags[f]||0);
      G.flags[f]=clamp(m&&m[1]==='='?n:m&&m[1]==='-'?cur-n:cur+n,0,99); break; }
    case 'power': if(typeof WEAPONS!=='undefined'&&WEAPONS[a]) giveWeapon(a,S10.quiet); else grantAbility(a); break;
    case 'upgrade': { G.flags['up_'+a]=1; if(!S10.quiet) setBanner(S('Upgrade!','Upgrade!'),s10Name(a),3); break; }
    case 'heart_ember': {
      if(typeof gainHeartEmber==='function'){ gainHeartEmber(a||null); break; }
      if(a&&G.found['he_'+a]) break; if(a) G.found['he_'+a]=true;
      G.found.heartEmbers=(G.found.heartEmbers||0)+1; if(player){ player.maxHp+=10; player.hp=player.maxHp; }
      if(!S10.quiet){ setBanner(S('A Heart Ember!','A Heart Ember!'),S('Your fire burns stronger. Max health +10.','Max health +10!'),3.4); try{ SFX.play('upgrade'); }catch(err){} } break; }
    case 'weapon': giveWeapon(a,S10.quiet); break;
    case 'ally': if(typeof recruitComp==='function') recruitComp(a); else s10Err(`effect "${e}": no companions module`); break;
    case 'hat': s10Hat(a); break;
    case 'deed': if(typeof deed==='function') deed(a); break;
    case 'open': case 'close': s10Gate(a,k==='open'); break;
    case 'spawn': { const at=b==='at'?c:b; s10NpcSet(a,{at,off:false}); break; }
    case 'despawn': s10NpcSet(a,{off:true}); break;
    case 'move': s10NpcSet(a,{at:b==='to'?c:b,off:false}); break;
    case 'world': s10WorldSet(a,b); break;
    case 'clue': s10Clue(a,ctx); break;
    case 'quest': if(a==='start') s10QuestStart(b); else if(a==='done') s10QuestFinish(b); else s10Err(`effect "${e}": quest start|done id`); break;
    case 'stage': later(0.05,()=>{ if(G.stage!==a) goStage(a); }); break;
    case 'time': s10Time(a,b); break;
    case 'people': if(DLG) S10.after.push(()=>{ try{ setupNPCs(); }catch(err){ console.error(err); } }); else setupNPCs(); break;
    case 'emit': storyEmit(a); break;
    case 'mail': s10Mail(a,ctx); break;
    case 'epi': s10Epi(a,b,ctx); break;
    case 'music': try{ Music.stinger(a); }catch(err){} break;
    case 'sfx': try{ SFX.play(a); }catch(err){} break;
    case 'heal': if(player){ player.hp=player.maxHp; } break;
    case 'choice': { const [f,v]=kv(a); G.choices[f]=v; break; }
    case 'solve': s10Solve(a,true); break;
    case 'bombbag': if(typeof bombBag==='function') bombBag(+a||5); else s10Err(`effect "${e}": no bomb bag`); break;
    case 'bless': { G.pendingBless=(G.pendingBless||0)+(+a||1); later(1.5,()=>{ try{ offerPending(); }catch(err){} }); break; }
    case 'moon': if(typeof moonSet==='function') moonSet(+a); else G.flags.moon=Math.min(G.flags.moon==null?100:G.flags.moon,+a); break;
    case 'warp': { const w=s10Where(a); if(!w){ s10Err(`effect "${e}": ${a} is not a place`); break; }
      // (I5, I4's request) the next step waits while a warp is on its way (it lands on the next play frame), so its
      // scene or cutscene starts where Ash lands, not where Ash was
      S10.warpAt=G.time;
      later(0.05,()=>{ S10.warpAt=null; G.fade=1; if(w.area&&AREADEFS[w.area]&&!s10InArea(w.area)){ if(AREA) exitArea(true); enterArea(w.area,s10DoorFor(w.area)||{x:player.x,y:player.y}); } else { if(AREA&&!w.area) exitArea(true); player.x=w.x; player.y=w.y; player.z=0; updateCam(0,true); G.chunkBurst=16; } }); break; }
    case 'end_act': { const n=+a||actOf(G.stage), A=S10.acts[n], ea=A&&A.end_act||{}; later(0.3,()=>endAct(n,{title:ea.title?s10T(ea.title):undefined,lines:s10Arr(ea.lines).map(x=>s10T(x)).filter(Boolean)})); break; }
    case 'page': s10Page(a); break;
    case 'shrine': { const sid=s10ShrineId(a); if(!sid){ s10Err(`effect "${e}": ${a} is not a shrine`); break; } G.shrines=G.shrines||{}; G.shrines[sid]=true; G.lastShrine=sid; break; }
    case 'said': if(!a){ s10Err(`effect "${e}": said <key>`); break; } (G.story.said||(G.story.said={}))[a]=1; break;
    default: s10Err(`effect "${e}": unknown "${k}"`);
  }
}
// Case Book pages (a letter, a journal page): page:{ id:{ title:[full,simple], text:[[full,simple], ...] } } on an act,
// chapter, quest or places(); the effect `page id` adds it (G.case.pages) with a banner
// the outside door of an area; an upper floor, a cellar or a dungeon floor has none of its own: its house's or dungeon's
// (A4b: autoplay and warp into m_obs_4)
function s10DoorFor(area){ let id=area; for(let k=0;k<8&&id;k++){ const d=DOORS.find(q=>q.area===id)||(typeof CAVEMOUTHS!=='undefined'&&CAVEMOUTHS.find(q=>q.area===id)); if(d) return d; const def=AREADEFS[id];
  const up=(def&&def.floorOf)||(typeof dunRoot==='function'?dunRoot(id):null); if(!up||up===id) break; id=up; } return null; }
// effect "shrine id": that shrine is found and is where Ash wakes up (a SHRINES id, or a legacy entry 'SHRINES:<id>')
function s10ShrineId(a){ if(typeof SHRINES!=='undefined'&&SHRINES.some(q=>q.id===a)) return a; const e=S10.legacy[a], m=e&&/^SHRINES:(.+)$/.exec(e.src||''); return m?m[1]:null; }
// effect "hat item": unlock and wear a hat (a data hat, or a hat item from an act's own table)
function s10Hat(a){
  const it=S10.items[a], nm=it&&it.hat?(typeof it.hat==='string'?it.hat:(s10T(it.name)||a)):null;
  let name=nm;
  if(!name) for(const T of ['X1P_HATS','F2P_HATS','M3P_HATS','M3W_HATS']){ let t=null; try{ t=eval(`typeof ${T}!=='undefined'?${T}:null`); }catch(e){} if(t&&t[a]){ name=t[a]; break; } }
  if(!name){ s10Err(`effect "hat ${a}": no hat item ${a}`); return; }
  G.hats=G.hats||{}; G.hats[name]=true; G.hat=name;
}
function s10Page(id){
  const P=S10.pages&&S10.pages[id]; if(!P){ s10Err(`page ${id} is not defined`); return; }
  const C=G.case.pages||(G.case.pages={}); if(C[id]) return; C[id]=1; storyEmit('page:'+id);
  if(!S10.quiet){ S10.pulseT=G.time+6; setBanner(S('A new page in the Case Book!','A new page!'),s10T(P.title),3.4); try{ SFX.play('quest'); }catch(e){} }
}
function s10Time(a,how){
  const T={night:0.875,dusk:0.78,evening:0.8,day:0.35,morning:0.3,dawn:0.25,noon:0.5,midnight:0.0};
  const t=T[a]!=null?T[a]:/^\d+(\.\d+)?$/.test(a)?(+a)/24:null; if(t==null){ s10Err(`time ${a}: night, day, dawn, dusk, noon or an hour`); return; }
  G.fade=1; G.tod=t;
  if(!S10.quiet&&how!=='quiet') later(0.3,()=>setBanner(t>0.7||t<0.2?S('Night falls','Night falls'):S('A new day','A new day'),t>0.7||t<0.2?S('The lamps flicker on, one by one.','The lamps come on.'):S('The sun comes up.','The sun comes up.'),2.6));
}
function s10Mail(id,ctx){
  if(typeof pebbleLetter!=='function'){ s10Err(`mail ${id}: no letters module`); return; }
  if(!pebbleAll().some(d=>d.id===id)){ const beats=S10.scenes[id]; if(!beats){ s10Err(`mail ${id}: no letter or scene with that id`); return; }
    pebbleLetter(id,{from:'pebble',when:()=>true,lines:()=>s10Lines(beats,{sc:id})}); }
  pebbleNow(id);
}
function s10Epi(id,pri,ctx){
  if(typeof epiAdd!=='function') return; if(S10.epi&&S10.epi[id]) return;
  const beats=S10.scenes[id], L=beats&&beats.find(b=>Array.isArray(b)); if(!L){ s10Err(`epi ${id}: no scene with a line`); return; }
  (S10.epi=S10.epi||{})[id]=1; const own=S10.sceneOwner[id], act=own&&own.act||actOf(G.stage);
  epiAdd(act,+pri||5,()=>!!(G.story&&G.story._ev&&G.story._ev['epi:'+id]),String(L[1]),L[2]&&typeof L[2]==='string'?L[2]:String(L[1]));
  storyEmit('epi:'+id);
}

// ---------- 5. events: storyEmit(name) is global (dungeons, foes, minigames call it); everything heard is remembered
// storyListen(prefix, fn): old code that draws a story's pictures hears every emit whose name starts with prefix, as
// fn(rest, name), each time (x4_story: 'n4fx:', the finale's cutscene, Heart, gathering, dawn, book and the way home)
const S10_LISTEN=[];
function storyListen(prefix,fn){ if(typeof fn==='function'&&prefix) S10_LISTEN.push({p:String(prefix),fn}); }
window.storyListen=storyListen;
function storyEmit(name){
  if(!name||!G||!G.story) return;
  name=String(name);
  // (I5) a listened-to prefix is a visual beat for old code, not story state: it is not remembered (saves stay small)
  const L=S10_LISTEN.filter(q=>name.startsWith(q.p));
  if(L.length){ if(S10.auto) S10.auto.log.push('emit '+name); for(const q of L) try{ q.fn(name.slice(q.p.length),name); }catch(e){ console.error('storyListen',name,e); } return true; }
  const E=G.story._ev||(G.story._ev={}); const first=!E[name]; E[name]=(E[name]|0)+1; S10.ver++;
  if(S10.auto) S10.auto.log.push('emit '+name);
  return first;
}
window.storyEmit=storyEmit;

// ---------- 6. entities: story places, legacy things the old code draws, people
function s10Ent(id){ return S10.places[id]||S10.legacy[id]||S10.npcs[id]||null; }
function s10At(e){ if(!e) return null; if(e.at) return {x:+e.at[0],y:+e.at[1]}; if(e.path&&e.path.length) return {x:+e.path[0][0],y:+e.path[0][1]}; return null; }
// an area's layout origin in the world (houses: the room's top left, A.rx/A.ry; else IZX+300, IZY+300)
const s10InArea=a=>!!AREA&&!!a&&(AREA.id===a||String(AREA.id).startsWith(a+'_'));
function s10Off(e){ if(!e||!e.area) return {x:0,y:0}; if(!s10InArea(e.area)) return null; return {x:AREA.rx!=null?AREA.rx:(typeof IZX!=='undefined'?IZX+300:0),y:AREA.ry!=null?AREA.ry:(typeof IZY!=='undefined'?IZY+300:0)}; }
// where a place really is now (null for a place inside an area Ash is not in)
function s10Pos(e){ const p=s10At(e); if(!p) return null; const o=s10Off(e); if(!o) return null; return {x:p.x+o.x,y:p.y+o.y}; }
// where something is right now: {x,y,area?,npc?} (people walk and live indoors: their door when Ash is outside)
function s10Where(id){
  if(id==null) return null;
  const e=s10Ent(id);
  if(e&&(e.kind==='npc'||S10.npcs[id])||(!e&&((typeof CASTBY!=='undefined'&&CASTBY[id])||(typeof SPECIAL!=='undefined'&&SPECIAL[id])))){ const w=s10NpcWhere(id); if(w) return w; }
  if(e&&e.kind==='prints'&&!e.area){ const tr=G.story&&G.story._trk&&G.story._trk[id], P=e.path||[], i=tr==='done'||!e._story?P.length-1:clamp((tr==null?-1:tr)+1,0,P.length-1); if(P[i]) return {x:+P[i][0],y:+P[i][1]}; }
  if(e&&e.area){ const d=DOORS.find(q=>q.area===e.area), p=s10Pos(e); if(p) return Object.assign({area:AREA.id},p); return d?{x:d.x,y:d.y,area:e.area}:null; }
  if(e&&!e._story&&e.where&&e.where!==id&&e.kind==='item') return s10Where(e.where);
  if(e&&!e._story&&e.inside){ const inA=s10InArea(e.inside)&&AREA.npcs&&AREA.npcs.find(q=>q.id===id); if(inA) return {x:inA.x,y:inA.y,npc:id,area:AREA.id}; const p=s10At(e), d=DOORS.find(q=>q.area===e.inside); return d?{x:d.x,y:d.y,area:e.inside,npc:id}:p?Object.assign({area:e.inside,npc:id},p):null; }
  if(!e){ const d=DOORS.find(q=>q.area===id); if(d) return {x:d.x,y:d.y,area:id}; const m=typeof CAVEMOUTHS!=='undefined'&&CAVEMOUTHS.find(q=>q.area===id); if(m) return {x:m.x,y:m.y,area:id}; return null; }
  return s10At(e);
}
function s10NpcWhere(id){
  const inA=AREA&&AREA.npcs&&AREA.npcs.find(q=>q.id===id); if(inA) return {x:inA.x,y:inA.y,npc:id,area:AREA.id};
  const n=(G.npcs||[]).find(q=>q.id===id); if(n) return {x:n.x,y:n.y,npc:id};
  const c=(typeof CASTBY!=='undefined'&&CASTBY[id]);
  if(c&&c.inside&&AREADEFS[c.inside]){ const d=DOORS.find(q=>q.area===c.inside); if(d) return {x:d.x,y:d.y,area:c.inside,npc:id}; }
  const e=s10Ent(id), p=e&&s10At(e); return p?Object.assign({npc:id},p):null;
}
function s10Near(id,r){
  const w=s10Where(id); if(!w||!player) return false;
  if(w.area){ if(!s10InArea(w.area)) return false; }
  else{ if(AREA) return false; const e=s10Ent(id); if(e&&e.map!=null&&curMap()!==+e.map) return false; }
  return dist(player.x,player.y,w.x,w.y)<(r||300);
}
// does the real thing stand where the registry says? (legacy src forms; see ENGINE.md)
function s10Resolve(e){
  const at=s10At(e), tol=Math.max(140,(e.r||0)+60), near=(x,y)=>!at||dist(x,y,at.x,at.y)<=tol, far=(x,y)=>`found at ${Math.round(x)},${Math.round(y)}, ${Math.round(dist(x,y,at.x,at.y))} px from ${at.x},${at.y}`;
  const src=String(e.src||'');
  if(e._story){ if(e.area) return AREADEFS[e.area]?{ok:!!at,why:at?'':'no position'}:{ok:false,why:`no area ${e.area}`};
    return {ok:!!at&&(e.map==null||mapAt(at.y)===+e.map),why:at?(e.map!=null&&mapAt(at.y)!==+e.map?`y ${at.y} is on map ${mapAt(at.y)}, not ${e.map}`:''):'no position'}; }
  let m;
  if((m=/^LANDMARKS:(.+)$/.exec(src))){ const o=LANDMARKS.find(q=>q.id===m[1]); if(!o) return {ok:false,why:`no landmark ${m[1]}`}; return near(o.x,o.y)?{ok:true,real:o}:{ok:false,why:far(o.x,o.y)}; }
  if((m=/^DOORS:([^@]+)(?:@(-?\d+),(-?\d+))?$/.exec(src))){ const L=DOORS.filter(q=>q.area===m[1]); if(!L.length) return {ok:false,why:`no door into ${m[1]}`};
    // (area@x,y: one of several doors into the area, the one nearest x,y)
    const px=m[2]!=null?+m[2]:at?at.x:L[0].x, py=m[3]!=null?+m[3]:at?at.y:L[0].y, o=L.reduce((a,b)=>dist(a.x,a.y,px,py)<=dist(b.x,b.y,px,py)?a:b); return near(o.x,o.y)?{ok:true,real:o}:{ok:false,why:far(o.x,o.y)}; }
  if((m=/^(?:CAST|SPECIAL|NPC):(.+)$/.exec(src))){ const id=m[1], c=(typeof CASTBY!=='undefined'&&CASTBY[id])||(typeof SPECIAL!=='undefined'&&SPECIAL[id]); return c?{ok:true,real:c}:{ok:false,why:`nobody called ${id}`}; }
  if((m=/^HOUSES?:(.+)$/.exec(src))){ const h=HOUSES.find(q=>q.want===m[1]||q.owner===m[1]||q.id===m[1]); if(!h) return {ok:false,why:`no house for ${m[1]}`}; return near(h.x,h.y)?{ok:true,real:h}:{ok:false,why:far(h.x,h.y)}; }
  // (A1W's forms) WARDS:id SHRINES:id LANTERNS:id CROSSINGS:id CAVEMOUTHS:area SITES:site NPCSPOT:id ITEM_NAMES:id regionAt:Name GATE_COL G.goat <obj>.path
  const xy=(o,what)=>o?(o.x!=null?(near(o.x,o.y)?{ok:true,real:o}:{ok:false,why:far(o.x,o.y)}):Array.isArray(o)?(near(+o[0],+o[1])?{ok:true,real:o}:{ok:false,why:far(+o[0],+o[1])}):{ok:true,real:o}):{ok:false,why:`no ${what}`};
  if((m=/^WARDS:(.+)$/.exec(src))) return xy(typeof WARDS!=='undefined'&&WARDS[m[1]],'ward '+m[1]);
  if((m=/^SHRINES:(.+)$/.exec(src))) return xy(SHRINES.find(q=>q.id===m[1]),'shrine '+m[1]);
  if((m=/^LANTERNS:(.+)$/.exec(src))) return xy(LANTERNS.find(q=>q.id===m[1]),'lantern '+m[1]);
  if((m=/^CROSSINGS:(.+)$/.exec(src))) return xy(typeof CROSSINGS!=='undefined'&&CROSSINGS[m[1]],'crossing '+m[1]);
  if((m=/^CAVEMOUTHS:(.+)$/.exec(src))) return xy(CAVEMOUTHS.find(q=>q.area===m[1]||q.id===m[1]),'cave mouth '+m[1]);
  if((m=/^SITES:(.+)$/.exec(src))){ const S0=SITES[m[1]], P=S0&&POI[S0.poi]; return S0?xy(P||S0,'site '+m[1]):{ok:false,why:`no site ${m[1]}`}; }
  if((m=/^NPCSPOT:(.+)$/.exec(src))) return xy(NPCSPOT[m[1]],'NPC spot '+m[1]);
  if((m=/^ITEM_NAMES:(.+)$/.exec(src))) return ITEM_NAMES[m[1]]!=null?{ok:true}:{ok:false,why:`no item ${m[1]}`};
  if((m=/^regionAt:(.+)$/.exec(src))){ if(!at) return {ok:false,why:'no position'}; const r=regionAt(at.x,at.y), bare=v=>String(v||'').replace(/^the\s+/i,'').toLowerCase(), want=m[1]; return r&&(bare(r.name)===bare(want)||bare(simplify(r.name))===bare(want)||r.key===want)?{ok:true}:{ok:false,why:`region at ${at.x},${at.y} is ${r&&r.name}`}; }
  if(src==='GATE_COL') return GATE_COL?{ok:true,real:GATE_COL}:{ok:false,why:'no GATE_COL'};
  if(src==='G.goat') return G&&G.goat?xy(G.goat,'goat'):{ok:false,why:'no goat now'};
  if((m=/^([A-Za-z_$][\w$]*)(\.[\w$]+)+$/.exec(src))&&!/\.js$/.test(src)){ let v; try{ v=eval(src); }catch(e){ v=undefined; } return v!=null?{ok:true}:{ok:false,why:`${src} is not in the game`}; }
  if((m=/^POI:(.+)$/.exec(src))){ const o=typeof POI!=='undefined'&&POI[m[1]]; if(!o) return {ok:false,why:`no POI ${m[1]}`}; const r=Math.max(tol,e.r||0,o.r||0); return !at||dist(o.x,o.y,at.x,at.y)<=r?{ok:true,real:o}:{ok:false,why:far(o.x,o.y)}; }
  if((m=/^CHESTS:(.+)$/.exec(src))){ const o=CHESTS.find(q=>q.id===m[1]); if(!o) return {ok:false,why:`no chest ${m[1]}`}; return near(o.x,o.y)?{ok:true,real:o}:{ok:false,why:far(o.x,o.y)}; }
  if((m=/^furn:(.+)$/.exec(src))){ const k=m[1];
    if(e.area&&!s10InArea(e.area)) return AREADEFS[e.area]?{ok:true,why:`inside ${e.area}: checked when Ash is in there`}:{ok:false,why:`no area ${e.area}`};
    const o=AREA&&AREA.objs&&AREA.objs.find(q=>q.k===k); return o?{ok:true,real:o}:{ok:false,why:`no ${k} in ${AREA?AREA.id:'(outdoors)'}`}; }
  if((m=/^elev:(\d+)@(-?\d+),(-?\d+)$/.exec(src))){ const L=typeof elevLvl==='function'?elevLvl(+m[2],+m[3]):0; return L>=+m[1]?{ok:true}:{ok:false,why:`level ${L} at ${m[2]},${m[3]} (want ${m[1]})`}; }
  if((m=/^prop:([\w-]+)@(-?\d+),(-?\d+)$/.exec(src))){ const k=m[1], x=+m[2], y=+m[3], o=s10FindObj(k,x,y,90); return o?{ok:true,real:o}:{ok:false,why:`no ${k} near ${x},${y}`}; }
  if((m=/^[\w.]+\.js\s+([A-Za-z_$][\w$]*(?:\.[\w$]+)+)$/.exec(src))){ let v; try{ v=eval(m[1]); }catch(err){ v=undefined; } return v!=null?{ok:true}:{ok:false,why:`${m[1]} is not in the game`}; }
  if((m=/^[\w.]+\.js\s+([A-Za-z_$][\w$]*)$/.exec(src))||(m=/^(?:fn|code):([A-Za-z_$][\w$]*)$/.exec(src))){
    const id=m[1];
    const o=LANDMARKS.find(q=>q.id===id)||DOORS.find(q=>q.area===id)||HOUSES.find(q=>q.want===id)||CHESTS.find(q=>q.id===id);
    if(o) return near(o.x,o.y)?{ok:true,real:o}:{ok:false,why:far(o.x,o.y)};
    let ty='undefined'; try{ ty=eval('typeof '+id); }catch(err){ ty='undefined'; }
    return ty!=='undefined'?{ok:true}:{ok:false,why:`${id} is not in the game`};
  }
  if(!src) return {ok:false,why:'no src'};
  return {ok:false,why:`src "${src}" is not a known form`};
}
// old drawings that are not in any object list tell the engine how to find them: s10FindKind(kind, (x,y,r)=>obj|null)
// (an old module calls it once at load; legacy src 'prop:<kind>@x,y' then resolves through it)
const S10_FIND={};
function s10FindKind(k,fn){ S10_FIND[k]=fn; }
// does the story data own this thing? (old code asks before doing what the data now does: storyOwns('quest','a1_hat'))
// does this person have a data talk option to show right now? (old code that answers with a line instead of opening the
// person's menu asks first, so the option can be picked: a9d's Elder Yara)
function storyHasOption(id){ try{ return !!(S10.booted&&G&&G.mode==='story'&&s10TalkFor(id,'option')); }catch(e){ return false; } }
function storyOwns(kind,id){ const M={quest:S10.quests,chapter:S10.chapters,scene:S10.scenes,place:S10.places,clue:S10.clues}[kind]; return !!(M&&M[id]); }
function s10FindObj(k,x,y,r){
  if(S10_FIND[k]){ try{ const o=S10_FIND[k](x,y,r); if(o) return o; }catch(e){} }
  const lists=[STRUCTS,LANDMARKS,CHESTS];
  for(const n of ['C1WD','F2WD','M3WD','N4WD']){ try{ const W=eval(`typeof ${n}!=='undefined'?${n}:null`); if(W&&W.objs) lists.push(W.objs); }catch(e){} }
  for(const L of lists) for(const o of L){ if(!o) continue; if((o.k===k||o.kind===k||o.pk===k)&&Math.abs(o.x-x)<=r&&Math.abs(o.y-y)<=r) return o; }
  try{ for(const [,a] of PROPS) for(const p of a) if(p.k===k&&Math.abs(p.x-x)<=r&&Math.abs(p.y-y)<=r) return p; }catch(e){}
  return null;
}
function s10EntityInfo(id){
  const e=s10Ent(id);
  if(e&&!e._story&&e.if!=null&&!s10Cond(e.if)){ const p=s10At(e)||{}; return {id,map:e.map!=null?+e.map:null,x:p.x,y:p.y,kind:e.kind||null,ok:true,why:`not checked now: ${typeof e.if==='string'?e.if:'its if'} does not hold`}; }
  if(!e){ const c=(typeof CASTBY!=='undefined'&&CASTBY[id])||(typeof SPECIAL!=='undefined'&&SPECIAL[id]); if(c){ const w=s10NpcWhere(id); return {id,map:w?mapAt(w.y):null,x:w?Math.round(w.x):null,y:w?Math.round(w.y):null,kind:'npc',ok:true,why:'a person in the game (not in the registry)'}; } return {id,ok:false,why:'not in the registry'}; }
  if(e===S10.npcs[id]&&!e.src&&!S10.places[id]&&!S10.legacy[id]){ const w=s10NpcWhere(id)||s10At(e); const c=SPECIAL[id]||(typeof CASTBY!=='undefined'&&CASTBY[id]);
    return {id,map:e.map!=null?+e.map:w?mapAt(w.y):null,x:w?Math.round(w.x):null,y:w?Math.round(w.y):null,kind:'npc',ok:!!c,why:c?'a person the story places (its where and at say when)':'no person '+id}; }
  const r=s10Resolve(e), w=s10Where(id)||s10At(e)||{};
  if(r.ok&&e._story&&e.look&&!s10LookHas(e.look)) return {id,map:e.map,x:w.x,y:w.y,kind:e.kind,ok:false,why:`no look ${e.look}`};
  return {id,map:e.map!=null?+e.map:null,x:w.x!=null?Math.round(w.x):null,y:w.y!=null?Math.round(w.y):null,kind:e.kind||null,ok:!!r.ok,why:r.why||''};
}

// ---------- 7. looks and poses (ENG-W's e10c_gates owns defineLook/definePose; a small fallback registry if it is missing)
(function s10LookFallback(){
  let has=true; try{ has=typeof defineLook==='function'; }catch(e){ has=true; }
  if(!has){ const L=window.__ebLooks=window.__ebLooks||{}; window.defineLook=(id,d)=>{ L[id]=d; return d; }; }
  let hp=true; try{ hp=typeof definePose==='function'; }catch(e){ hp=true; }
  if(!hp){ const P=window.__ebPoses=window.__ebPoses||{}; window.definePose=(npc,pose,draw)=>{ (P[npc]=P[npc]||{})[pose]=draw; return draw; }; }
})();
function s10LookHas(id){
  try{ if(typeof lookHas==='function') return !!lookHas(id); }catch(e){}
  return !!(window.__ebLooks&&window.__ebLooks[id]);
}
function s10LookDraw(id,x,y,state){
  const t=G?G.time:0;
  // the gate library's lookDraw (ENG-W) draws its own placeholder for a missing look: then nothing more is drawn here
  if(typeof lookDraw==='function'){ let r=false; try{ r=lookDraw(ctx,id,x,y,t,state); }catch(e){ if(!S10.lookMiss.has('err'+id)){ S10.lookMiss.add('err'+id); console.error(e); } }
    if(r===false&&!S10.lookMiss.has(id)){ S10.lookMiss.add(id); s10Err(`look ${id} is not defined (drawn as a placeholder)`); } return r!==false; }
  const L=window.__ebLooks&&window.__ebLooks[id];
  if(L&&L.draw){ try{ L.draw(ctx,x,y,t,state); return true; }catch(e){ if(!S10.lookMiss.has('err'+id)){ S10.lookMiss.add('err'+id); console.error(e); } } }
  if(!S10.lookMiss.has(id)){ S10.lookMiss.add(id); s10Err(`look ${id} is not defined (drawn as a placeholder)`); try{ console.warn('story: no look',id); }catch(e){} }
  ctx.save(); ctx.setLineDash([4,3]); ctx.strokeStyle='#ff4ad8'; ctx.lineWidth=2; ctx.strokeRect(x-16,y-30,32,30); ctx.setLineDash([]);
  ctx.fillStyle='#ff4ad8'; ctx.font=`800 14px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('?',x,y-15); ctx.restore();
  return false;
}
function s10PoseGet(npc,pose){
  try{ if(typeof poseGet==='function'){ const f=poseGet(npc,pose); if(f) return f; } }catch(e){}
  const P=window.__ebPoses; return P&&P[npc]&&P[npc][pose]||null;
}

// ---------- 8. registering the data (at boot, and right away for data that arrives later)
function s10Reg(map,id,v,what,src){ if(map[id]&&map[id]!==v) s10Err(`${what} ${id} is defined twice (${src})`); map[id]=v; }
function s10Register(kind,d){
  const src=d._file||kind;
  if(kind==='act'){
    const n=typeof d.id==='number'?d.id:d.n!=null?+d.n:parseInt(String(d.id||'').replace(/\D/g,''),10);
    if(!n){ s10Err(`act() needs id: <act number> (${src})`); return; }
    S10.acts[n]=d;
    for(const k in (d.mystery||{})){ const v=d.mystery[k]; S10.mysteries[k]=Object.assign({id:k,act:n},Array.isArray(v)||typeof v==='string'?{title:v}:v||{}); }
    for(const k in (d.trust||{})){ const v=d.trust[k]; S10.trust[k]=typeof v==='string'?v:v&&v.flag||('trust_'+k); }
    s10Owned(d,{kind:'act',id:'act'+n,act:n});
    return;
  }
  if(kind==='legacy'){
    if(!d.id){ s10Err(`legacy() needs an id (${src})`); return; }
    const old=S10.legacy[d.id];
    if(old&&(String(old.src)!==String(d.src)||JSON.stringify(old.at||old.path)!==JSON.stringify(d.at||d.path))) s10Err(`legacy ${d.id}: two entries disagree (${old._file} and ${src})`);
    S10.legacy[d.id]=Object.assign({},old||{},d); s10File(S10.legacy[d.id]);
    if(d.kind==='npc'&&!SPK[d.id]&&d.name) SPK[d.id]={name:s10T(d.name),col:d.col||'#d8c3a0'};
    return;
  }
  if(!d.id){ s10Err(`${kind}() needs an id (${src})`); return; }
  if(kind==='people'||kind==='places'){ s10Owned(d,{kind,id:d.id,act:+d.act||null,d}); return; }
  if(kind==='chapter'){ s10Reg(S10.chapters,d.id,d,'chapter',src); if(!S10.chOrder.includes(d.id)) S10.chOrder.push(d.id); }
  else if(kind==='quest'){ s10Reg(S10.quests,d.id,d,'quest',src); if(!S10.qOrder.includes(d.id)) S10.qOrder.push(d.id); }
  const owner={kind,id:d.id,act:+d.act||null,d};
  s10Owned(d,owner);
  s10Steps(d);
}
// the blocks a chapter, quest or act may carry: place, clue, deduce, scene, talk, npc, item
function s10Owned(d,owner){
  for(const id in (d.place||{})){ const p=Object.assign({id,_story:true,_owner:owner},d.place[id]); if(p.kind==null) p.kind='examine'; if(p.map==null&&d.map!=null) p.map=d.map; s10Reg(S10.places,id,p,'place',d._file); }
  for(const id in (d.clue||{})) s10Reg(S10.clues,id,Object.assign({id,_owner:owner},d.clue[id]),'clue',d._file);
  for(const id in (d.deduce||{})) s10Reg(S10.deduce,id,Object.assign({id,_owner:owner},d.deduce[id]),'deduction',d._file);
  for(const id in (d.scene||{})){ s10Reg(S10.scenes,id,d.scene[id],'scene',d._file); S10.sceneOwner[id]=owner; }
  for(const who in (d.talk||{})){ const L=S10.talk[who]||(S10.talk[who]=[]); for(const t of s10Arr(d.talk[who])) L.push(Object.assign({_owner:owner,_who:who},t)); }
  for(const id in (d.npc||{})){ const n=Object.assign({id,_owner:owner},d.npc[id]); S10.npcs[id]=n; }
  for(const id in (d.page||{})){ (S10.pages||(S10.pages={}))[id]=Object.assign({id,_owner:owner},d.page[id]); }
  for(const id in (d.item||d.items||{})){ const it=(d.item||d.items)[id]; S10.items[id]=Object.assign({id},it); if(it&&it.name) ITEM_NAMES[id]=s10T(it.name);
    // a hat from data: item { name, hat: { look, col } } (the look draws it on Ash and in the hat menu)
    if(it&&it.hat&&typeof it.hat==='object'){ const nm=s10T(it.name)||id; (S10.hats||(S10.hats={}))[nm]=Object.assign({item:id},it.hat); } }
}
// steps: parse once ({do:'talk c_hettie'} -> _kind 'talk', _args ['c_hettie'])
const S10_KINDS=['talk','goto','find','examine','fight','use_power_at','give','choose','deduce','track','wait_for','cutscene','minigame','dungeon','all','any'];
function s10Steps(d){
  (d.step||[]).forEach((s,i)=>{ if(!s||typeof s!=='object'){ s10Err(`${d.id}: step ${i} is not an object`); return; } s._id=s.id||('s'+i); s._i=i; s10ParseDo(s,d,`${d.id}.${s._id}`);
    (s.parts||[]).forEach((p,j)=>{ p._id=s._id+'.'+j; s10ParseDo(p,d,`${d.id}.${p._id}`); });
    (s.extra||[]).forEach((p,j)=>{ p._id=s._id+'.x'+j; p._extra=true; s10ParseDo(p,d,`${d.id}.${p._id}`); }); });
}
function s10ParseDo(s,d,where){
  const tk=String(s.do||'').trim().split(/\s+/).filter(Boolean); s._kind=tk[0]||''; s._args=tk.slice(1);
  if(!S10_KINDS.includes(s._kind)) s10Err(`${where}: unknown step "${s.do}"`);
  if((s._kind==='all'||s._kind==='any')&&!(s.parts&&s.parts.length)) s10Err(`${where}: "${s._kind}" needs parts`);
}

// ---------- 9. scenes: beats -> lines for the old dialogue system (runDialogue), simple words through S()
function s10Line(b){ let [who,full,simple,o]=b; if(simple&&typeof simple==='object'&&!Array.isArray(simple)){ o=simple; simple=null; } return {who:String(who||'narr'),full:String(full==null?'':full),simple:simple==null||simple===''?null:String(simple),o:o||{}}; }
function s10Lines(beats,ctx){ const out=[]; for(const b of s10Arr(beats)) s10Beat(b,ctx||{},out,null); return out; }
function s10Beat(b,ctx,out,guard){
  const g=guard||(()=>true);
  if(Array.isArray(b)){
    const l=s10Line(b), o=l.o, text=l.simple!=null?S(l.full,l.simple):l.full, cond=o.if;
    const ok=()=>g()&&(cond==null||s10Cond(cond))&&!(l.who==='pip'&&!(G.flags&&G.flags.pip));
    const L={who:l.who,text,skipIf:()=>!ok()};
    // (v11 MOOD) the face the speaker makes on this line (a12a_dlg's portrait moods; untagged lines are read from their words)
    if(o.mood!=null) L.face=String(o.mood);
    if(o.clue!=null||o.do!=null) L.fn=()=>{ if(!ok()) return; for(const c of s10Arr(o.clue)) s10Clue(c,ctx); if(o.do!=null) s10Do(o.do,ctx); };
    // (v11) replies to this line: a choose whose who is the speaker and whose ask is the line (STORY_PLAN 6.3 #7)
    if(o.re!=null) L.opts=()=>s10ReOpts(o.re,ctx,l.who,{});
    out.push(L); return;
  }
  if(!b||typeof b!=='object'){ s10Err(`scene ${ctx.sc||'?'}: a beat is not a line or an object`); return; }
  if(b.choose!=null){ out.push(s10Choice(b,ctx,g)); return; }
  if(b.if!=null&&(b.then||b.else)){
    let res=null; out.push({who:'narr',text:'',skipIf:()=>true,fn:()=>{ res=g()&&s10Cond(b.if); }});
    for(const x of s10Arr(b.then)) s10Beat(x,ctx,out,()=>g()&&res===true);
    for(const x of s10Arr(b.else)) s10Beat(x,ctx,out,()=>g()&&res===false);
    return;
  }
  out.push({who:'narr',text:'',skipIf:()=>true,fn:()=>{ if(g()) s10Action(b,ctx); }});
}
// { choose:'id', ask:[full,simple], who?, pick:[{ t, tone, if?, need?, locked?, v?, then:[effects], say:[lines] }] }
function s10Choice(b,ctx,g){
  const ask=b.ask?s10T(b.ask):S('What do you do?','What do you do?');
  const L={who:b.who||'ash',text:ask,skipIf:()=>!g()};
  if(b.mood!=null) L.face=String(b.mood);
  L.opts=()=>s10Arr(b.pick).map((p,i)=>{
    const t=s10T(p.t);
    if(p.if!=null&&!s10Cond(p.if)) return null;
    if(p.need!=null&&!s10Cond(p.need)){
      const lk=String(s10T(p.locked||S("You can't choose that yet.","Not yet.")).replace(/\{trust:(\w+)\}/g,(_,n)=>String(s10Trust(n))));
      return {t:t+'  🔒',tone:'locked',then:[{who:'narr',text:lk}],back:true};
    }
    return {t,tone:p.tone,fn:()=>{ G.choices[b.choose]=p.v!=null?p.v:p.id!=null?p.id:(p.tone||i); s10Do(p.then,ctx); storyEmit('choice:'+b.choose); },then:()=>s10Lines(p.say,ctx)};
  }).filter(Boolean);
  return L;
}
// (v11 talk, STORY_PLAN 6.3 idea B) re: 2 or 3 replies to the line just said, on a talk entry (its say), an ask
// topic's answer, a scene line's tags, or a reply's next line. A reply: { t: [full, simple], tone?, f?, if?, need?,
// locked?, then?: [effects], say?: [[who, full, simple], ...] | [full, simple] (said by who), scene?, next?, id?, end? }.
// The reply's then runs when it is picked; its response (scene, then say, then next) plays; then the scene goes on, or
// a talk menu comes back under the person's idle line without the replies (o.hub: the talk visit; o.top: the replies sit
// on the menu line itself). Friendship: f (or 0.25 for a tone tag; +0.25 for the person's favorite tone), once per reply.
function s10ReOpts(re,ctx,who,o){
  o=o||{}; const V=o.hub||null;
  return s10Arr(re).map((r,i)=>{
    if(!r||typeof r!=='object') return null;
    if(r.if!=null&&!s10Cond(r.if)) return null;
    const t=s10T(r.t);
    if(r.need!=null&&!s10Cond(r.need)){
      const lk=String(s10T(r.locked||S("You can't say that yet.","Not yet.")).replace(/\{trust:(\w+)\}/g,(_,n)=>String(s10Trust(n))));
      return {t:t+'  🔒',tone:'locked',then:[{who:'narr',text:lk}],back:true};
    }
    const rk=String(who||'?')+':re:'+(r.id||h32(JSON.stringify(r.t)));
    const end=!!(V&&r.end);
    return {t,tone:r.tone,back:!!(V&&o.top&&!end),end,fn:()=>{
        if(V){ V.answered=true; if(V.key&&o.top) (G.story._ra||(G.story._ra={}))[V.key]=1; }
        s10ReFriend(who,r,rk);
        s10Do(r.then,ctx);
        if(S10.auto) S10.auto.log.push('reply '+rk);
      },then:()=>s10ReLines(r,ctx,who)};
  }).filter(Boolean);
}
function s10ReLines(r,ctx,who){
  const out=[];
  if(r.scene!=null){ const sc=S10.scenes[r.scene]; if(sc){ (G.story._seen||(G.story._seen={}))[r.scene]=1; out.push(...s10Lines(sc,Object.assign({},ctx,{sc:r.scene}))); } else s10Err(`reply "${s10T(r.t)}": scene ${r.scene} is not defined`); }
  const b=s10RespBeats(r.say,who); if(b) out.push(...s10Lines(b,ctx));
  if(r.next!=null){ const nb=s10NextBeat(r.next,who); if(nb) out.push(...s10Lines(nb,ctx)); else s10Err(`reply "${s10T(r.t)}": next should be [who, full, simple, { re }] or { say: [full, simple], re }`); }
  return out;
}
// a response: [[who, full, simple, tags?], ...], one line [who, full, simple], or [full, simple] / a string said by who
const s10IdLike=x=>typeof x==='string'&&/^[a-z][a-z0-9_]*$/.test(x);
function s10RespBeats(say,who){
  if(say==null) return null;
  if(typeof say==='string') return [[who,say]];
  if(!Array.isArray(say)) return null;
  if(say.every(Array.isArray)) return say;
  if(say.every(x=>typeof x==='string')&&say.length<=2&&!s10IdLike(say[0])) return [[who].concat(say)];
  if(s10IdLike(say[0])) return [say];
  return null;
}
// next: one more line with its own replies: [who, full, simple, { re }] or { who?, say: [full, simple], re? }
function s10NextBeat(nx,who){
  if(Array.isArray(nx)) return s10IdLike(nx[0])?[nx]:null;
  if(!nx||typeof nx!=='object') return null;
  const L=s10RespBeats(nx.say,nx.who||who); if(!L||!L.length) return null;
  if(nx.re!=null){ const k=L.length-1, b=L[k].slice(); let tg=b.length>2&&b[b.length-1]&&typeof b[b.length-1]==='object'&&!Array.isArray(b[b.length-1])?b.pop():{}; b.push(Object.assign({},tg,{re:nx.re})); L[k]=b; }
  return L;
}
function s10ReFriend(who,r,rk){
  if(typeof befriend!=='function'||!who||typeof CASTBY==='undefined'||!CASTBY[who]) return;
  const F=G.story._rf||(G.story._rf={}); if(F[rk]) return; F[rk]=1;
  const best=typeof TALK!=='undefined'&&TALK[who]&&TALK[who].chat&&TALK[who].chat.best;
  let f=r.f!=null?(+r.f||0):(r.tone?0.25:0); if(r.tone&&r.tone===best) f+=0.25;
  if(f) befriend(who,f);
}
// the beats that are not lines: cam, place, walk, anim, fade, wait, sfx, do, banner (several may share one object)
function s10Action(b,ctx){
  if(b.place) s10ActorPlace(b.place[0],b.place[1],b.place[2]);
  if(b.anim) s10ActorAnim(b.anim[0],b.anim[1]);
  if(b.walk) s10ActorWalk(b.walk[0],b.walk[1],b.s||b.dur,b.walk[2]);
  if(b.cam!=null){ const w=s10Where(b.cam); if(w&&!AREA){ S10.cam={x:w.x,y:w.y,t0:G.time,dur:Math.max(0.1,+b.s||1),k:b.k!=null?+b.k:0.92}; } else if(!w) s10Err(`scene ${ctx.sc||'?'}: cam ${b.cam} is not a place`); }
  if(b.fade!=null) G.fade=typeof b.fade==='number'?b.fade:1;
  if(b.wait!=null&&DLG) DLG.lockT=performance.now()+(+b.wait||0.5)*1000;
  if(b.sfx) try{ SFX.play(b.sfx); }catch(e){}
  if(b.banner) setBanner(s10T(b.banner),b.sub?s10T(b.sub):'',3);
  if(b.do!=null) s10Do(b.do,ctx);
}
function s10Play(id,done,ctx){
  const beats=typeof id==='string'?S10.scenes[id]:id;
  if(!beats){ s10Err(`scene ${id} is not defined`); if(done) done(); return false; }
  ctx=Object.assign({sc:typeof id==='string'?id:null},ctx||{});
  if(typeof id==='string'&&G.story) (G.story._seen||(G.story._seen={}))[id]=1;
  if(typeof id==='string'&&S10.oldMark&&S10.oldMark[id]) try{ S10.oldMark[id](); }catch(e){ console.error(e); }
  const lines=s10Lines(beats,ctx);
  if(S10.auto) S10.auto.log.push('scene '+(ctx.sc||'(inline)'));
  runDialogue(lines.length?lines:[{who:'narr',text:'',skipIf:()=>true}],()=>{ scene='play'; s10SceneEnd(); try{ if(done) done(); }catch(e){ console.error(e); } try{ saveGame(); }catch(e){} });
  return true;
}
function s10SceneEnd(){
  S10.cam=null;
  for(const id in S10.actors){ const A=S10.actors[id]; try{ if(A.end) A.end(); }catch(e){} } S10.actors={}; S10.walks.length=0;
  const after=S10.after.splice(0); for(const f of after) try{ f(); }catch(e){ console.error(e); }
}
// actors: people placed, walked and posed by a scene (put back when it ends). Vesper's masked sightings (c_mask)
// are x1_story's own drawing (C1ST.sight), driven through c1SightAt.
function s10Actor(id){
  if(S10.actors[id]) return S10.actors[id];
  const e=s10Ent(id);
  if(e&&/c1SightAt/.test(String(e.src||''))&&typeof c1SightAt==='function'){
    const A={kind:'sight',id,get S(){ return C1ST.sight; },place(x,y){ const s=c1SightAt(x,y,'wait'); s.face=x<player.x?1:-1; },
      walk(x,y,d){ const s=C1ST.sight||c1SightAt(x,y,'wait'); const far=dist(s.x,s.y,x,y); s.go={x,y,t:0,d:d||clamp(far/240,0.5,4)}; if(!s._pose) s.mode='dive'; },
      anim(a){ const s=C1ST.sight; if(!s) return; s._pose=s10PoseGet(id,a)?a:null; s.mode={climb:'move',run:'move',fly:'dive',glide:'dive',sit:'sit',stand:'wait',wait:'wait'}[a]||'wait'; },
      end(){ C1ST.sight=null; }};
    return S10.actors[id]=A;
  }
  const list=AREA?AREA.npcs:G.npcs; let n=list.find(q=>q.id===id), temp=false;
  if(!n){ const c=(typeof CASTBY!=='undefined'&&CASTBY[id])||(typeof SPECIAL!=='undefined'&&SPECIAL[id]); if(!c){ s10Err(`scene actor ${id} is not a person`); return null; } n=mkNPC(c,player.x,player.y); n.walker=false; list.push(n); temp=true; }
  const x0=n.x, y0=n.y, h0=n.home&&n.home.slice();
  const A={kind:'npc',id,n,place(x,y){ n.x=x; n.y=y; if(n.home){ n.home[0]=x; n.home[1]=y; } },walk(x,y,d){ S10.walks.push({n,x0:n.x,y0:n.y,x1:x,y1:y,t:0,d:d||Math.max(0.6,dist(n.x,n.y,x,y)/90)}); },
    anim(a){ n._pose=a; },end(){ n._pose=null; if(temp){ const i=list.indexOf(n); if(i>=0) list.splice(i,1); } else { n.x=x0; n.y=y0; if(h0) n.home=h0; } }};
  return S10.actors[id]=A;
}
// where an actor goes: [x, y], an entity, or 'player' (Ash, where he stands now), with an optional [dx, dy] offset
function s10ActTarget(where,off){
  let w=null;
  if(Array.isArray(where)) w={x:+where[0],y:+where[1]};
  else if(where==='player'||where==='ash') w=player?{x:player.x,y:player.y}:null;
  else { const q=s10Where(where); w=q?{x:q.x,y:q.y}:null; }
  if(w&&Array.isArray(off)){ w.x+=+off[0]||0; w.y+=+off[1]||0; }
  return w;
}
function s10ActorPlace(id,where,off){ const A=s10Actor(id), w=s10ActTarget(where,off); if(A&&w) A.place(w.x,w.y); }
function s10ActorWalk(id,where,d,off){ const A=s10Actor(id), w=s10ActTarget(where,off); if(A&&w) A.walk(w.x,w.y,d); }
function s10ActorAnim(id,a){ const A=s10Actor(id); if(A) A.anim(a); }
function s10WalkTick(dt){
  for(const W of S10.walks){ W.t+=dt; const k=Math.min(1,W.t/W.d); W.n.x=lerp(W.x0,W.x1,k); W.n.y=lerp(W.y0,W.y1,k); W.n.moving=k<1; W.n.face=Math.atan2(W.y1-W.y0,W.x1-W.x0); }
  S10.walks=S10.walks.filter(W=>W.t<W.d);
}

// ---------- 10. runners: one per active chapter and per active data quest. Steps run in order; the first unfinished
// step drives the objective, the marker and the hint; all/any parts in any order; extra parts any time in the chapter.
function s10Run(kind,d){ return {kind,d,key:kind==='q'?'q:'+d.id:d.id}; }
function s10St(R){ const S0=G.story||(G.story={}); return S0[R.key]||(S0[R.key]={}); }
// (after the game is won, G.done, only a chapter marked after_done: true runs on: N5b's n_end after "Keep exploring")
const s10AfterDone=()=>{ const c=G&&S10.chapters[G.stage]; return !!(c&&c.after_done); };
function s10Runners(){
  const out=[]; if(!G||G.mode!=='story'||!G.story) return out;
  const c=S10.chapters[G.stage];
  if(G.done){ if(c&&c.after_done) out.push(s10Run('ch',c)); return out; }
  if(c) out.push(s10Run('ch',c));
  for(const id of S10.qOrder){ const q=G.quests[id]; if(q&&!q.done) out.push(s10Run('q',S10.quests[id])); }
  return out;
}
function s10Active(R){ const st=s10St(R); for(const s of R.d.step||[]){ if(!s._kind||st[s._id]||s.optional) continue; return s; } return null; }
// everything that can be done right now: the active step (or its open parts), optional steps, the chapter's extras
// (cached for the frame: markers, prompts, the HUD and the tick all ask; anything that changes story state bumps S10.ver)
S10.ver=0; S10.dc={t:-1,v:-1,m:{}};
function s10Doable(R){
  const c=S10.dc, t=G?G.time:0;
  if(c.t!==t||c.v!==S10.ver){ c.t=t; c.v=S10.ver; c.m={}; }
  return c.m[R.key]||(c.m[R.key]=s10Doable0(R));
}
function s10Doable0(R){
  const st=s10St(R), out=[], act=s10Active(R);
  for(const s of R.d.step||[]){
    (s.extra||[]).forEach(p=>{ if(!st[p._id]&&(p.if==null||s10Cond(p.if))) out.push({R,s,x:p,key:p._id,extra:true}); });
    if(s.optional&&!st[s._id]&&s!==act&&(s.if==null||s10Cond(s.if))) s10DoableStep(R,s,st,out);
  }
  if(act&&(act.if==null||s10Cond(act.if))) s10DoableStep(R,act,st,out);
  return out;
}
function s10DoableStep(R,s,st,out){
  if(s._kind==='all'||s._kind==='any'){ for(const p of s.parts||[]) if(!st[p._id]&&(p.if==null||s10Cond(p.if))) out.push({R,s,x:p,key:p._id,part:true}); }
  else out.push({R,s,x:s,key:s._id});
}
function s10Finish(a,quiet){
  const R=a.R, st=s10St(R); if(st[a.key]) return;
  S10.ver++;
  st[a.key]=1; delete S10.pend[R.key+'/'+a.key];
  if(S10.auto) S10.auto.log.push('done '+R.key+'.'+a.key);
  const was=S10.quiet; if(quiet) S10.quiet=true;
  try{
    if(a.x!==a.s||a.extra) s10Do(a.x.then,{R,step:a.s});
    if(a.extra){ storyEmit('step:'+R.key+'.'+a.key); return; }
    if(a.part){ const P=a.s.parts||[], n=P.filter(p=>st[p._id]).length; if(a.s._kind==='all'?n<P.length:n<1) { storyEmit('step:'+R.key+'.'+a.key); if(!quiet) s10Poke(R,false); return; } }
    st[a.s._id]=1; s10Do(a.s.then,{R,step:a.s});
    storyEmit('step:'+R.key+'.'+a.s._id);
    if(R.kind==='q'){ s10QuestStepFlag(R,a.s); if(!s10Active(R)) s10QuestComplete(R.d); else if(!quiet) setBanner(s10T(R.d.title)||R.d.id,s10T(s10Active(R).obj)||s10DefaultObj(s10Active(R)),2.8); }
    if(!quiet) s10Poke(R,!a.s.optional);
  } finally { S10.quiet=was; }
}
// after a step: the banner for the next objective, the quest journal, a save
function s10Poke(R,main){
  if(R.kind==='q'){ try{ s10QuestSync(); }catch(e){} saveGame(); return; }
  if(main&&G.stage===R.d.id){ const nx=s10Active(R); if(nx&&nx._kind!=='cutscene') later(0.3,()=>{ if(scene==='play'&&G.stage===R.d.id&&!DLG) questUpdated(); }); }
  saveGame();
}
// play the step's scene (if it has one), then finish it; one at a time
function s10Run2(a,before){
  const k=a.R.key+'/'+a.key; if(S10.pend[k]) return; S10.pend[k]=1;
  if(before) try{ before(); }catch(e){ console.error(e); }
  const sc=a.x.scene||a.x.win||a.x.after;
  if(sc) s10Play(sc,()=>s10Finish(a),{R:a.R,step:a.s}); else s10Finish(a);
}
const s10Calm=()=>scene==='play'&&!DLG&&!G.mini&&!(G.boss&&!G.boss.dead)&&!player.dead;
function s10Tick(dt){
  if(!S10.booted) s10Boot();
  if(!G||G.mode!=='story'||!G.story) return;
  if(S10.tickAt===G.time) return; S10.tickAt=G.time;
  if(AREA!==S10.furnArea){ S10.furnArea=AREA; try{ s10FurnPrompts(AREA); }catch(e){ console.error(e); } }
  S10.watchT-=dt; if(S10.watchT<=0){ S10.watchT=1; s10Watch(); try{ s10Over(); s10QuestDoneIf(); }catch(e){ console.error(e); } }
  S10.npcT-=dt; if(S10.npcT<=0){ S10.npcT=1; s10NpcSync(); }
  if(S10.qOrder.length) try{ s10QuestSync(); }catch(e){ console.error(e); }
  if(G.done&&!s10AfterDone()) return;
  s10PlacesTick(dt);
  s10Barks(dt);
  if(scene!=='play') return;
  // (a warp still on its way: nothing starts until Ash lands; the bound only guards a warp that never landed)
  if(S10.warpAt!=null){ const wd=G.time-S10.warpAt; if(wd>=0&&wd<1.5) return; S10.warpAt=null; }
  // queued beats (a scene that waits for a calm moment)
  if(S10.queue.length&&s10Calm()){ const q=S10.queue.shift(); try{ q(); }catch(e){ console.error(e); } return; }
  for(const R of s10Runners()) for(const a of s10Doable(R)){
    if(S10.pend[R.key+'/'+a.key]) continue;
    // a step's intro scene plays once when it becomes doable (on the main path; the checker counts it)
    if(a.x.intro&&!(G.story._intro&&G.story._intro[R.key+'/'+a.key])){ if(s10Calm()){ (G.story._intro||(G.story._intro={}))[R.key+'/'+a.key]=1; s10Play(a.x.intro,null,{R,step:a.s}); return; } continue; }
    s10Poll(a); if(DLG||scene!=='play') return; }
}
// the steps that finish by themselves when something becomes true
function s10Poll(a){
  const x=a.x, A=x._args, st=s10St(a.R);
  switch(x._kind){
    case 'goto': { const r=A[1]?+A[1]:(s10Ent(A[0])&&s10Ent(A[0]).r)||220; if(s10Calm()&&s10Near(A[0],r)) s10Run2(a); break; }
    case 'find': if((G.items[A[0]]||0)>0) s10Run2(a); break;
    case 'choose': if(G.choices&&G.choices[A[0]]!=null) s10Finish(a); break;
    case 'deduce': if(G.case.solved[A[0]]&&s10Calm()) s10Run2(a); break;
    case 'wait_for': if(s10WaitOk(x)&&s10Calm()) s10Run2(a); break;
    case 'fight': { const f=A[0]; if(!(G.bossDone[f]||G.story._ev['boss_done:'+f]||G.story._ev['fight:'+f]||G.flags['trial_'+f+'_boss'])) break;
      // a kneel scene the fight never reached (the boss fell some other way): it plays first, then the win
      if(x.kneel&&!(G.story._kneel&&G.story._kneel[f])&&!s10Seen(x.kneel)){ if(s10Calm()){ const k=a.R.key+'/'+a.key+'/kneel'; if(S10.pend[k]) break; S10.pend[k]=1;
        s10Play(x.kneel,()=>{ delete S10.pend[k]; s10KneelDone(f); },{R:a.R,step:a.s}); } break; }
      s10Run2(a); break; }
    case 'dungeon': { const d=A[0]; if(G.flags['trial_'+d+'_done']||G.flags[d+'_done']||G.story._ev['dungeon_done:'+d]) s10Run2(a); break; }
    case 'use_power_at': { const gid=A[1]||A[0]; if(s10World(gid)==='open'||G.story._ev['gate_open:'+gid]) s10Run2(a); break; }
    case 'track': if(G.story._trk&&G.story._trk[A[0]]==='done') s10Run2(a); break;
    case 'cutscene': if(s10Calm()){ const k=a.R.key+'/'+a.key; S10.pend[k]=1; s10Play(x.scene||A[0],()=>s10Finish(a),{R:a.R,step:a.s}); } break;
    case 'minigame': s10MiniPoll(a); break;
  }
}
function s10WaitOk(x){
  const A=x._args, w=A[0];
  if(w==='night') return isNight();
  if(w==='day') return !isNight();
  if(w==='hour') return s10HourFn(A[1])();
  if(w==='event') return !!(G.story._ev&&G.story._ev[A[1]]);
  return s10Cond(A.join(' '));
}

// ---------- 10b. kneels: a boss that stops at low health for a choice hands it to its code's kneel hook. A fight step
// with kneel:'sceneId' plays that scene at the kneel, then the boss code's own finish() ends the fight (XP, the room),
// then the step's win (or after) scene plays and the step finishes. KNEEL_S10[foe] says how a foe's code hands it over.
const KNEEL_S10={
  // Act II's Vesper: x1_foes vesperKneel calls C1.hook.vesperKneel(e, finish) (x1_story's own handler is the fallback)
  c_mothmask:{
    install(h){ if(typeof C1==='undefined'||!C1||!C1.hook) return false; const old=C1.hook.vesperKneel; C1.hook.vesperKneel=(e,fin)=>{ if(h(e,fin)) return; if(old) old(e,fin); else fin(); }; return true; },
    clear(e){ for(const o of G.enemies) if(o!==e&&!o.dead&&(o.type==='c_mothclone'||o.clone)) o.dead=true; },
    // the old code's own flags for "the choice is made" (its watcher and its save migration read them)
    done(){ G.flags.c_choice_done=1; G.flags.c_mask_xp=1; } }
};
function s10KneelStep(foe){ for(const R of s10Runners()) for(const a of s10Doable(R)) if(a.x._kind==='fight'&&a.x._args[0]===foe&&a.x.kneel) return a; return null; }
function s10KneelDone(foe){ (G.story._kneel||(G.story._kneel={}))[foe]=1; const K=KNEEL_S10[foe]; try{ if(K&&K.done) K.done(); }catch(e){ console.error(e); } S10.ver++; }
function s10Kneel(foe,e,fin){
  const a=s10KneelStep(foe); if(!a||(G.story._kneel&&G.story._kneel[foe])) return false;
  const K=KNEEL_S10[foe]||{};
  if(e){ e.invuln=true; e.passive=true; e.tele=null; e.vx=e.vy=0; }
  try{ if(K.clear) K.clear(e); }catch(err){ console.error(err); }
  G.projectiles=(G.projectiles||[]).filter(p=>p.owner!=='enemy'); G.taunt=null; G.tauntQ=[];
  if(S10.auto) S10.auto.log.push('kneel '+foe);
  s10Play(a.x.kneel,()=>{ s10KneelDone(foe);
    try{ fin(); }catch(err){ console.error(err); }
    if(e&&!e.dead){ e.dead=true; if(G.boss===e) G.boss=null; }
    G.bossDone[foe]=true; storyEmit('boss_done:'+foe); },{R:a.R,step:a.s});
  return true;
}

// ---------- 11. minigames: the existing ones, started from a step; adapters say where and how (MINI_S10[id])
const MINI_S10={
  // Act II's rooftop chase (x1_story): Vesper waits on the manor roof, the roofs are drawn, the lamps light the route
  c_roofchase:{near:380,night:true,again:[S('She is back!','She is back!'),S('Here we go again. Keep up!','Go! Keep up!')],
    pre(){ if(typeof c1SightAt!=='function'||typeof C1R==='undefined') return; const S0=c1SightAt(C1R.L[0].x0+40,C1R.L[0].y0-10,'wait'); S0.face=1; C1ST.cam={x:C1R.L[0].x0,y:C1R.L[0].y0,k:0.6}; c1ChaseLights(true); C1ST.preRoof=true; },
    post(){ if(typeof C1ST==='undefined') return; C1ST.sight=null; C1ST.preRoof=false; },
    // won: the old rewards; Ash comes down off the roofs after the next scene (the catch on the minute hand)
    won(){ try{ gainXp(600); addCoins(60); }catch(e){} S10.after.push(()=>{ try{ if(typeof c1RDown==='function') c1RDown(); }catch(e){} }); },
    win(){ if(typeof c1RWin==='function') c1RWin(); else miniEnd(true); }}
};
function s10MiniOwner(kind){ const R=s10Runners().find(R=>s10Doable(R).some(a=>a.x._kind==='minigame'&&a.x._args[0]===kind)); return R||null; }
// a minigame that only starts at night, while it is day: its step reads "Wait for night at ..." and its skip people
// offer "Wait here until dark" (c_gear's chase, when the night step was done just before dawn)
function s10MiniNight(x){ return !!(x&&x._kind==='minigame'&&!x.day&&(MINI_S10[x._args[0]]||{}).night&&!isNight()); }
function s10MiniPoll(a){
  const x=a.x, id=x._args[0], M=MINI_S10[id]||{}, at=x.at||x._args[1];
  if(x.start==='talk') return;
  if(G.mini||!s10Calm()) return;
  if(!MINI[id]){ s10Err(`minigame ${id} does not exist`); return; }
  if(G.time<S10.mini.lostAt+4) return;
  if(at&&!s10Near(at,x.r||M.near||300)) return;
  if(M.night&&!isNight()&&!x.day) return;
  s10MiniStart(a);
}
function s10MiniStart(a){
  const x=a.x, id=x._args[0], M=MINI_S10[id]||{};
  if(G.mini||!MINI[id]) return;
  const k=a.R.key+'/'+a.key; S10.pend[k]=1;
  const go=()=>{ try{ if(M.post) M.post(); }catch(e){} later(0.1,()=>{ delete S10.pend[k]; S10.mini.owner=a.R.key+'/'+a.key; startMini(id,null); }); };
  try{ if(M.pre) M.pre(); }catch(e){ console.error(e); }
  const first=!(G.story._mini&&G.story._mini[id]); (G.story._mini||(G.story._mini={}))[id]=(G.story._mini[id]|0)+1;
  const sc=first?x.scene:(x.retry||null);
  if(sc) s10Play(sc,go,{R:a.R,step:a.s});
  else if(first) go();
  else { const A=M.again||[S('Try again!','Try again!'),S('Here we go!','Go!')]; setBanner(A[0],A[1],2.4); later(1.0,go); }
}
function s10MiniEnded(kind,win){
  const own=S10.mini.owner; S10.mini.owner=null;
  for(const R of s10Runners()) for(const a of s10Doable(R)){
    if(a.x._kind!=='minigame'||a.x._args[0]!==kind) continue;
    if(own&&own!==R.key+'/'+a.key) continue;
    if(win){ const M=MINI_S10[kind]; if(M&&M.won) try{ M.won(); }catch(e){ console.error(e); } storyEmit('mini_won:'+kind); s10Finish(a); }
    else { S10.mini.lostAt=G.time; storyEmit('mini_lost:'+kind); if(a.x.lose) S10.queue.push(()=>s10Play(a.x.lose,null,{R:a.R,step:a.s})); }
    return;
  }
}

// ---------- 12. places: prompts, prints, spots, chests, gates, doors, drawing, world states
function s10PlaceOn(p){
  if(!p||p.kind==='npc_spot') return false;
  const own=p._owner; if(own&&own.act&&actOf(G.stage)<own.act) return false;
  if(p.if!=null&&!s10Cond(p.if)) return false;
  if(p.area){ if(!s10InArea(p.area)) return false; }
  else { if(AREA) return false; if(p.map!=null&&curMap()!==+p.map) return false; }
  return true;
}
function s10PlaceShown(p){ return s10PlaceOn(p)&&(p.show==null||s10Cond(p.show)); }
// targets of a doable examine/track step get a sparkle, so a kid can see "look here"
function s10Targets(){
  const T=new Set(); for(const R of s10Runners()) for(const a of s10Doable(R)){ const k=a.x._kind; if(k==='examine'||k==='track') T.add(a.x._args[0]); } return T;
}
function s10Prompts(offer){
  if(!G||G.mode!=='story'||!S10.booted) return;
  const p=player, T=s10Targets();
  for(const id in S10.places){
    const P=S10.places[id]; if(!s10PlaceShown(P)) continue;
    const k=P.kind; if(!['examine','sign','door','prop','chest','gate'].includes(k)) continue;
    // a gate only has a prompt of ours while it is shut and Ash lacks its power (it says its `locked` line); a gate the
    // gate library built is shut while gateIsOpen says so, and its prompt sits where the power is used (I3: a kid
    // walking past learns what it needs, not only one who pushes into it)
    let gAt=null;
    if(k==='gate'){ if(!P.locked||!s10GateLocked(P)) continue;
      if(P._built){ try{ if(typeof gateIsOpen==='function'&&gateIsOpen(id)) continue; const I=typeof gateInfo==='function'?gateInfo(id):null; if(I&&I.door) gAt={x:I.door.x,y:I.door.y}; }catch(e){ continue; } }
      else if(s10World(id)==='open') continue; }
    if(k==='prop'&&!P.say&&!P.scene) continue;
    if(k==='chest'&&G.chestsOpened[id]) continue;
    // (a thing already looked at that no step waits for answers only when Ash stands at it: its prompt no longer hides
    //  the Grapple Tail's, which shows only when no other prompt is up, at the Cut's lip beside the rope fence)
    const again=(k==='examine'||k==='prop')&&!T.has(id)&&!!(G.story&&G.story._ex&&G.story._ex[id]);
    const at=gAt||s10Pos(P); if(!at) continue; const d=dist(p.x,p.y,at.x,at.y), r=again?Math.max(24,(P.r||22)+4):(P.r||22)+50; if(d>r) continue;
    if(AREA&&typeof reachPlace==='function'&&!reachPlace(at.x,at.y,P.r||22)) continue;   // (v12) indoors: close and in front (a9d_quests.js)
    // (I5) nor when the Grapple Tail can reach a post from here (Vesper's cracked mask lies on the Silk Gallery's edge,
    // right where Ash grapples the first post: E only read the mask again)
    if(again){ try{ if(typeof p2Pick==='function'&&typeof canGrapple==='function'&&canGrapple()&&!AREA&&p2Pick(p,(typeof P2!=='undefined'&&P2.inp)||{mx:0,my:0})) continue; }catch(e){} }
    const name=s10T(P.name)||id;
    const text=P.prompt?s10T(P.prompt):k==='sign'?S('Read the sign','Read the sign'):k==='door'?(S('Go in','Go in')):k==='chest'?S('Open the chest','Open the chest'):S('Look at '+name,'Look at '+name);
    // a place a step waits for wins over a person or a door about as close (kids should not have to dance for it)
    offer(d-(T.has(id)?30:6),text,()=>s10PlaceAct(id),at.x,at.y);
  }
}
{ const base=miniPrompts; miniPrompts=function(offer){ base(offer); try{ s10Prompts(offer); }catch(e){ console.error(e); } }; }
// inside houses and caves miniPrompts is not asked: the nearest story prompt wins when it is the closest thing
// (I5, I3's request) indoors a person wins a tie with plain furniture right in front of them (the old offer kept the
// first of equal scores, the furniture: Ulf stands 20 px behind his bear rug, so the way in from the door gave "Look at
// the rug"). A person's reach is 70 and a small thing's 50, so the furniture still wins wherever it is nearer.
function s10PersonFirst(){
  const cur=G.prompt; if(!AREA||!cur||G.inCombat||!AREA.npcs||!AREA.npcs.length) return;
  const o=(AREA.objs||[]).find(o=>o.x===cur.x&&o.y===cur.y&&!o.broken); if(!o) return;
  const FL=typeof FLOOR_LABEL!=='undefined'?FLOOR_LABEL:{}, CL=typeof CAVE_LABEL!=='undefined'?CAVE_LABEL:{}, FU=typeof FURN_LABEL!=='undefined'?FURN_LABEL:{};
  if(o.prompt||FL[o.k]||CL[o.k]!==undefined||['qitem','stairs','trig','page','cchest','gchest','cave_ore','relic','note'].includes(o.k)||(o.k==='bed'&&o.home)||o.egg||!FU[o.k]) return;
  const p=player; let d, reach;
  if(o.w){ const ex=Math.max(0,Math.abs(p.x-o.x)-o.w/2), ey=Math.max(0,Math.abs(p.y-o.y)-(o.h||o.w)/2); d=Math.hypot(ex,ey); reach=34; }
  else { d=dist(p.x,p.y,o.x,o.y); reach=(o.r||16)+34; }
  const fs=d-reach; let bn=null, bs=1e9;
  for(const n of AREA.npcs){ const dn=dist(p.x,p.y,n.x,n.y); if(dn>=(n.turtle?90:70)||(typeof reachPerson==='function'&&!reachPerson(n))) continue; const sc=dn-70; if(sc<=fs+0.5&&sc<bs){ bs=sc; bn=n; } }
  if(bn) G.prompt={text:`Talk to ${bn.name}`,act:()=>talkTo(bn),x:bn.x,y:bn.y};
}
{ const base=updateInteractions; updateInteractions=function(dt){ base(dt); try{ if(AREA&&G&&G.mode==='story'&&S10.booted) s10PersonFirst(); }catch(e){ console.error(e); } try{ if(AREA&&G&&G.mode==='story'&&S10.booted){ let best=null; s10Prompts((d,text,act,x,y)=>{ if(!best||d<best.d) best={d,text,act,x,y}; });
  const cur=G.prompt, cd=cur&&cur.x!=null?dist(player.x,player.y,cur.x,cur.y):1e9;
  if(best&&(!cur||best.d<cd-4)&&!(G.inCombat)) G.prompt={text:best.text,act:best.act,x:best.x,y:best.y}; } }catch(e){ console.error(e); } }; }
function s10PlaceAct(id){
  const P=S10.places[id]; if(!P) return;
  G.story._ex=G.story._ex||{}; const first=!G.story._ex[id]; G.story._ex[id]=(G.story._ex[id]|0)+1;
  storyEmit('examine:'+id);
  if(first&&P.then) s10Do(P.then,{place:id});
  if(P.kind==='door'){ s10Door(P); return; }
  if(P.kind==='gate'){ s10Play([['narr'].concat(s10Arr(P.locked))],()=>s10Examined(id),{place:id}); return; }
  if(P.kind==='chest'){ s10Chest(P); return; }
  const lines=[]; const st=s10World(id);
  const say=P.states_say&&st!=null&&P.states_say[st]?P.states_say[st]:P.say;
  const sc=P.scene||(typeof say==='string'&&S10.scenes[say]?say:null);
  if(sc){ s10Play(sc,()=>s10Examined(id),{place:id}); return; }
  if(say!=null){ if(Array.isArray(say)&&say.length&&Array.isArray(say[0])) lines.push(...say); else lines.push(['narr'].concat(Array.isArray(say)?say:[say])); }
  if(lines.length){ s10Play(lines,()=>s10Examined(id),{place:id}); return; }
  if(!s10Examined(id)) ftext(player.x,player.y-46,simplify(s10T(P.name)||id),'#ffe9b0',13);
}
// an examine step that waits for this place (or a legacy thing) finishes; true when one did
function s10Examined(id){
  let did=false;
  for(const R of s10Runners()) for(const a of s10Doable(R)){ if(a.x._kind==='examine'&&a.x._args[0]===id){ did=true; s10Run2(a); } }
  return did;
}
function s10Door(P){
  if(P.need!=null&&!s10Cond(P.need)){ s10Play([['narr'].concat(s10Arr(P.locked||S("It won't open. Not yet.","It won't open.")))],null,{place:P.id}); return; }
  const to=P.leads; if(!to) return;
  if(AREADEFS[to]){ const d=DOORS.find(q=>q.area===to)||{x:player.x,y:player.y}; enterArea(to,d); return; }
  const w=s10Where(to); if(w){ if(AREA) exitArea(); player.x=w.x; player.y=w.y+30; updateCam(0,true); G.chunkBurst=16; }
}
function s10Chest(P){
  G.chestsOpened[P.id]=true; try{ SFX.play('chest'); }catch(e){}
  const at=s10Pos(P)||{x:player.x,y:player.y}; emit(at.x,at.y,30,{col:'255,210,120',ang:-Math.PI/2,spread:1,smin:40,smax:160,lmin:.5,lmax:1,zmin:1.5,zmax:3,rise:15});
  if(P.loot) s10Do(P.loot,{place:P.id}); else { addCoins(20,at.x,at.y); gainXp(40); }
  s10Examined(P.id); saveGame();
}
// the power each gate kind opens with (_plan_format's gate table); a gate place may say need:'<condition>' instead
const S10_GATE_POWER={climb_wall:'claws',grapple_post:'grapple',shadow_curtain:'shadow',thin_bars:'shadow',whip_hook:'whip',chain_ring:'whip',vent:'wings',step_face:'dbljump',
  water:'stride',ice_wall:'blaze',wind_ribbon:'windride',pound_plate:'pound',cracked_floor:'pound',bomb_rock:'bombs',dive_spot:'dive',burrow_mound:'burrow',moon_glass:'moonfire',silk_web:'glaive'};
function s10GateLocked(P){
  if(P.need!=null) return !s10Cond(P.need);
  try{ if(typeof gateCanOpen==='function') return !gateCanOpen(P); }catch(e){}
  try{ if(typeof gateInfo==='function'){ const I=gateInfo(P.id); if(I){ if(I.open) return false; if(I.power) return !s10HasPower(I.power); } } }catch(e){}
  if(P.gate==='fetch_spot') return !(G.flags.c_pip_fetch||G.flags.pip_fetch);
  const pw=P.opens_with||S10_GATE_POWER[P.gate]; return pw?!s10HasPower(pw):false;
}
// place over:'landmarkId' (A2S): while the place shows, that landmark's own prompt steps aside
function s10Over(){
  for(const id in S10.places){ const P=S10.places[id]; if(!P.over||P._overDone) continue;
    const o=LANDMARKS.find(q=>q.id===P.over); if(!o) continue; P._overDone=true;
    const d=Object.getOwnPropertyDescriptor(o,'prompt')||{value:o.prompt}, get=()=>d.get?d.get.call(o):d.value;
    try{ Object.defineProperty(o,'prompt',{configurable:true,get(){ try{ if(G&&s10PlaceShown(P)) return null; }catch(e){} return get(); },set(v){ d.value=v; delete d.get; }}); }catch(e){} }
}
function s10Gate(id,open){
  s10WorldSet(id,open?'open':'closed');
  try{ if(typeof gateSet==='function') gateSet(id,open); }catch(e){ console.error(e); }
  if(open) storyEmit('gate_open:'+id);
}
function s10WorldSet(id,state){
  const W=G.story._w||(G.story._w={}); W[id]=state; storyEmit('world:'+id+'='+state);
  // a legacy thing's state runs its effects (legacy states:{ open:['set c_gate_open'] }); a story place's state is a look
  const L=S10.legacy[id], v=L&&L.states&&L.states[state];
  if(Array.isArray(v)) s10Do(v,{}); else if(typeof v==='string'&&/\s/.test(v)) s10Do([v],{});
}
// prints: a dotted trail along `path`, seen when `show` holds; walking it to the end finishes a track step
function s10PlacesTick(dt){
  if(!G.story) return;
  const T=G.story._trk||(G.story._trk={});
  for(const id in S10.legacy){ const L=S10.legacy[id]; if(L.kind!=='prints'||!L.path||!L.path.length||T[id]==='done') continue;
    if(L.map!=null&&(AREA||curMap()!==+L.map)) continue; if(L.if!=null&&!s10Cond(L.if)) continue;
    const q=L.path[L.path.length-1]; if(dist(player.x,player.y,+q[0],+q[1])<(L.r||70)){ T[id]='done'; storyEmit('track:'+id); } }
  for(const id in S10.places){
    const P=S10.places[id];
    if(P.kind==='prints'){
      if(T[id]==='done'||!s10PlaceShown(P)) continue;
      const path=P.path||[], o=s10Off(P)||{x:0,y:0}; let i=T[id]==null?-1:T[id];
      const nx=path[i+1]; if(!nx) continue;
      if(dist(player.x,player.y,+nx[0]+o.x,+nx[1]+o.y)<(P.r||70)){ i++; T[id]=i; if(i>=path.length-1){ T[id]='done'; storyEmit('track:'+id); try{ SFX.play('pickup'); }catch(e){} } else try{ SFX.play('ui',0.4); }catch(e){} }
    }else if(P.kind==='spot'){
      const S0=G.story._spot||(G.story._spot={}); if(!s10PlaceOn(P)) continue; const at=s10Pos(P); if(!at) continue;
      const inside=dist(player.x,player.y,at.x,at.y)<(P.r||80);
      if(inside&&!S0[id]){ S0[id]=1; storyEmit('spot:'+id); if(P.say&&scene==='play'&&!DLG) s10Play([['narr'].concat(s10Arr(P.say))],null,{place:id}); }
      else if(!inside&&S0[id]&&P.again) S0[id]=0;
    }
  }
}
// place lights (light:{r,i,night}): holes in the dark, like the town's lamps, for the places shown here and now
const S10L=[];
function s10Lights(){
  for(const L of S10L){ const i=LIGHTS.indexOf(L); if(i>=0) LIGHTS.splice(i,1); } S10L.length=0;
  if(!G||G.mode!=='story') return;
  for(const id in S10.places){ const P=S10.places[id]; if(!P.light||!s10PlaceShown(P)) continue; const st=s10World(id); if(P.light.state&&P.light.state!==st) continue; if(P.light.off&&s10Arr(P.light.off).includes(st)) continue;
    const at=s10Pos(P); if(!at||!inView(at.x,at.y,400)) continue; const L={x:at.x,y:at.y-(P.light.dy!=null?P.light.dy:20),r:P.light.r||90,i:P.light.i!=null?P.light.i:0.6,night:P.light.night!==false,fire:!!P.light.fire,s10:true}; S10L.push(L); LIGHTS.push(L); }
}
function s10Render(list){
  if(!G||G.mode!=='story'||!S10.booted) return;
  s10Lights();
  const T=s10Targets(), t=G.time;
  for(const id in S10.places){
    const P=S10.places[id]; if(!s10PlaceOn(P)) continue;
    if(P.kind==='prints'){ if(s10PlaceShown(P)) list.push({x:0,y:-1e9+1,draw:()=>s10DrawPrints(P,T.has(id))}); continue; }
    if(P.kind==='spot'||P.kind==='gate'||P.layer==='screen') continue;
    if(P.show!=null&&!s10Cond(P.show)) continue;
    const at=s10Pos(P); if(!at||!inView(at.x,at.y,160)) continue;
    const st=s10World(id), look=P.states&&st!=null&&P.states[st]?P.states[st]:P.look, sy=s10SortY(P,at);
    if(look||P.kind==='chest') list.push({x:at.x,y:sy,draw:()=>{ if(P.kind==='chest'&&!look) s10DrawChest(at.x,at.y,!!G.chestsOpened[id]); else s10LookDraw(look,at.x,at.y,st); }});
    if(T.has(id)) list.push({x:at.x,y:sy+1,draw:()=>s10Sparkle(at.x,at.y-((P.h||40)+14),t)});
  }
  // legacy things a step waits for (the Moth Mask Watch board): a sparkle over them too
  for(const id of T){ if(S10.places[id]) continue; const w=s10Where(id), e=s10Ent(id); if(!w||w.area||AREA||(e&&e.map!=null&&curMap()!==+e.map)||!inView(w.x,w.y,120)) continue; list.push({x:w.x,y:w.y+1,draw:()=>s10Sparkle(w.x,w.y-54,t)}); }
}
{ const base=eventsForRender; eventsForRender=function(list){ base(list); try{ s10Render(list); }catch(e){ console.error(e); } }; }
// place layer:'screen': its look is drawn in screen space over the world and the fade, under the HUD (a storybook
// picture over a faded-out world); the look gets (x, y) = the middle of the screen and should be anim (W, H are the
// screen's size)
{ const base=drawHUD; drawHUD=function(){ try{ if(G&&G.mode==='story'&&S10.booted) s10DrawScreen(); }catch(e){ console.error(e); } return base.apply(this,arguments); }; }
function s10DrawScreen(){
  for(const id in S10.places){ const P=S10.places[id]; if(P.layer!=='screen'||!s10PlaceShown(P)) continue;
    const st=s10World(id), look=P.states&&st!=null&&P.states[st]?P.states[st]:P.look; if(!look) continue;
    ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0); s10LookDraw(look,W/2,H/2,st); ctx.restore(); }
}
// a place on a house wall (inside the house's footprint) is drawn after the house, so it shows on the wall
function s10SortY(P,at){
  if(P._sy!=null&&P._syN===HOUSES.length) return P._sy;
  let y=at.y; for(const h of HOUSES){ if(!h||h.w==null) continue; if(Math.abs(at.x-h.x)<=h.w/2&&at.y>=h.y-h.h/2&&at.y<=h.y+h.h/2+4) y=Math.max(y,h.y+h.h/2+3); }
  P._sy=y; P._syN=HOUSES.length; return y;
}
function s10Sparkle(x,y,t){
  const b=Math.sin(t*3)*3, a=0.75+Math.sin(t*5)*0.25;
  glowAt(x,y+b,26,'255,226,140',0.35*a);
  ctx.save(); ctx.translate(x,y+b); ctx.rotate(t*0.8); ctx.fillStyle=`rgba(255,240,190,${a})`; ctx.strokeStyle='rgba(120,70,20,.8)'; ctx.lineWidth=1.4;
  ctx.beginPath(); for(let i=0;i<8;i++){ const r=i%2?3.2:9, an=i*Math.PI/4; ctx.lineTo(Math.cos(an)*r,Math.sin(an)*r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function s10DrawChest(x,y,open){
  ctx.save(); ctx.translate(x,y); ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0,4,18,6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#8a5a2a'; ctx.strokeStyle='#3a2210'; ctx.lineWidth=2; ctx.fillRect(-15,-16,30,18); ctx.strokeRect(-15,-16,30,18);
  ctx.fillStyle=open?'#5a3a1a':'#a06a30'; ctx.fillRect(-15,open?-26:-22,30,open?6:8); ctx.strokeRect(-15,open?-26:-22,30,open?6:8);
  ctx.fillStyle='#e0b84a'; ctx.fillRect(-3,-12,6,6); ctx.restore();
}
// boot prints (a girl's size): pairs of soles and heels every 28 px along the path, silver with a dark rim so they read
// on pale streets too; the ones already followed fade, the next one to step on has a ring
function s10DrawPrints(P,target){
  const o=s10Off(P); if(!o) return;
  const path=(P.path||[]).map(q=>[+q[0]+o.x,+q[1]+o.y]); if(path.length<2) return;
  const tr=G.story._trk&&G.story._trk[P.id], reached=tr==='done'?path.length:(tr==null?-1:tr), t=G.time;
  const claw=P.look==='claw'||P.prints==='claw', hoof=P.look==='hoof'||P.prints==='hoof', fill=P.col||'222,232,255';
  let s0=0; const segs=[]; for(let i=0;i<path.length-1;i++){ const a=path[i], b=path[i+1], L=Math.hypot(b[0]-a[0],b[1]-a[1]); segs.push({a,b,L,s0,i}); s0+=L; }
  if(!inView((path[0][0]+path[path.length-1][0])/2,(path[0][1]+path[path.length-1][1])/2,s0/2+200)) return;
  ctx.save(); let k=0;
  for(const g of segs){
    const ux=(g.b[0]-g.a[0])/g.L, uy=(g.b[1]-g.a[1])/g.L, ang=Math.atan2(uy,ux);
    for(let s=(k===0?8:((28-(g.s0%28))%28));s<g.L;s+=28,k++){
      const side=k%2?1:-1, x=g.a[0]+ux*s-uy*side*7, y=g.a[1]+uy*s+ux*side*7, done=g.i<reached;
      const tw=0.5+0.5*Math.sin(t*3+k*1.3), al=done?0.4:0.95;
      if(!done) glowAt(x,y,14,'190,210,255',0.16+0.12*tw);
      ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
      ctx.fillStyle=`rgba(${fill},${al})`; ctx.strokeStyle=`rgba(40,46,104,${al*0.85})`; ctx.lineWidth=1.4;
      if(hoof){ for(const dy of [-2.6,2.6]){ ctx.beginPath(); ctx.ellipse(1,dy,4.6,2.2,0,0,TAU); ctx.fill(); ctx.stroke(); } }
      else if(claw){ for(const dy of [-3.6,0,3.6]){ ctx.beginPath(); ctx.ellipse(4,dy,3.6,1.4,0,0,TAU); ctx.fill(); ctx.stroke(); } ctx.beginPath(); ctx.ellipse(-3,0,3.6,4,0,0,TAU); ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.ellipse(2.5,0,6.4,4,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-6.5,0,3.2,3.2,0,0,TAU); ctx.fill(); ctx.stroke(); }
      ctx.restore();
      if(!done&&tw>0.96){ ctx.fillStyle='rgba(255,255,255,.95)'; ctx.fillRect(x-1,y-6,2,12); ctx.fillRect(x-6,y-1,12,2); }
    }
  }
  // the next point to reach
  const nx=path[Math.min(path.length-1,reached+1)];
  if(target&&tr!=='done'&&nx){ const r=16+Math.sin(t*4)*3; ctx.strokeStyle='rgba(40,46,104,.6)'; ctx.lineWidth=4; ctx.beginPath(); ctx.ellipse(+nx[0],+nx[1],r,r*0.55,0,0,TAU); ctx.stroke(); ctx.strokeStyle='rgba(235,242,255,.95)'; ctx.lineWidth=2; ctx.stroke(); }
  ctx.restore();
}
// Vesper's sightings drawn with a data pose (definePose('c_mask', pose)) while a scene has posed her
if(typeof drawThief==='function'){ const base=drawThief; drawThief=function(T){ try{ if(T&&T._pose&&typeof C1ST!=='undefined'&&T===C1ST.sight){ const f=s10PoseGet('c_mask',T._pose); if(f){ f(ctx,T.x,T.y,G.time); return; } } }catch(e){ console.error(e); } return base(T); }; }
// people posed by a scene (definePose); creature actors (npc sprite:'look', drawn only by their poses or that look,
// never as a person); overlays (npc overlay:'look', drawn over the person: Agatha's parrot on her shoulder)
{ const base=drawNPC; drawNPC=function(n){
  const d=n&&S10.npcs[n.id];
  if(n&&n._pose){ const f=s10PoseGet(n.id,n._pose); if(f){ try{ f(ctx,n.x,n.y,G.time); return; }catch(e){ console.error(e); } } }
  if(d&&d.sprite){ try{ const f=s10PoseGet(n.id,'idle'); if(f) f(ctx,n.x,n.y,G.time); else s10LookDraw(d.sprite,n.x,n.y,n._pose||null); }catch(e){ console.error(e); } return; }
  const r=base(n);
  if(d&&d.overlay&&!(G&&G.mode==='story'&&d._owner&&d._owner.act&&actOf(G.stage)<d._owner.act)) try{ s10LookDraw(d.overlay,n.x,n.y,null); }catch(e){ console.error(e); }
  return r; }; }
// data hats: the look draws them (the flat sprite and the hat menu); the toy model wears a plain cap in the hat's colour
{ const base=drawHatShape; drawHatShape=function(x,y,k,s){ const H=S10.hats&&S10.hats[k]; if(H){ ctx.save(); ctx.translate(x,y); if(s) ctx.scale(s,s); if(H.look&&s10LookHas(H.look)) s10LookDraw(H.look,0,0,null); ctx.restore(); return; } return base(x,y,k,s); }; }
{ const base=ashHat; ashHat=function(k){ const H=S10.hats&&S10.hats[k]; if(H){ try{ aE(0.3,0,5.4,7.6,8.0,4.2,H.col||'#8a6a4a'); }catch(e){} return; } return base(k); }; }
// data people who are nobody in the old code (npc blocks with a name and no CAST or SPECIAL entry) become SPECIAL
// people (inside 'ev': only the story places them), with a speaker entry, so scenes, talk and steps can use them
function s10People(){
  for(const id in S10.npcs){ const d=S10.npcs[id]; if(!d||!d.name) continue;
    if((typeof CASTBY!=='undefined'&&CASTBY[id])||SPECIAL[id]) continue;
    SPECIAL[id]={id,name:s10T(d.name),col:d.col||'#d8c3a0',kid:!!d.kid,look:Object.assign({},d.look||{}),inside:'ev',lines:[],_s10:true};
    if(!SPK[id]) SPK[id]={name:s10T(d.name),col:d.col||'#d8c3a0'}; }
}

// ---------- 13. people: data NPCs (npc blocks) added, moved by conditions and effects; legacy people moved or re-dressed
function s10NpcSet(id,o){ const N=G.story._npc||(G.story._npc={}); N[id]=Object.assign({},N[id]||{},o); s10NpcSync(true); }
function s10NpcWant(id,d){
  const o=G.story&&G.story._npc&&G.story._npc[id];
  if(o&&o.off) return null;
  const pos=v=>{ if(v==null) return null; if(Array.isArray(v)) return {x:+v[0],y:+v[1]}; const w=s10Where(v); return w&&!w.area?{x:w.x,y:w.y}:null; };
  if(o&&o.at!=null) return pos(o.at);
  if(!d) return null;
  const own=d._owner; if(own&&own.act&&actOf(G.stage)<own.act) return null;
  if(d.if!=null&&!s10Cond(d.if)) return null;
  for(const w of d.where||[]){ if(w&&(w.if==null||s10Cond(w.if))) return w.at===null||w.off?null:pos(w.at); }
  return pos(d.at);
}
function s10NpcSync(force){
  if(!G||G.mode!=='story'||!G.npcs) return;
  const ids=new Set(Object.keys(S10.npcs)); for(const k in (G.story&&G.story._npc)||{}) ids.add(k);
  for(const id of ids){
    const d=S10.npcs[id], legacyP=(typeof CASTBY!=='undefined'&&CASTBY[id])||(typeof SPECIAL!=='undefined'&&SPECIAL[id]&&!d);
    if(!d&&!legacyP) continue;
    if(d&&!legacyP&&!SPECIAL[id]) continue;
    if(!d&&!(G.story._npc&&G.story._npc[id])) continue;
    // (A4S) a block stops placing a person the old code places (a CAST person, an old SPECIAL) once its act is over: the
    // old code places them again (x3_people's Vesper in Act IV after Act II's c_vesper block); people only the data
    // has keep their block, and spawn/move/despawn states still hold
    if(d&&d._owner&&d._owner.act&&actOf(G.stage)>+d._owner.act&&((typeof CASTBY!=='undefined'&&CASTBY[id])||(SPECIAL[id]&&!SPECIAL[id]._s10))&&!(G.story._npc&&G.story._npc[id])) continue;
    const want=s10NpcWant(id,d), i=G.npcs.findIndex(q=>q.id===id);
    if(legacyP&&d&&d.look&&i>=0&&!G.npcs[i]._s10look){ G.npcs[i].look=Object.assign({},G.npcs[i].look||{},d.look); G.npcs[i]._s10look=true; }
    if(!want){ if(i>=0&&(d&&!legacyP||(G.story._npc&&G.story._npc[id]&&G.story._npc[id].off))) G.npcs.splice(i,1); continue; }
    if(i<0){ const c=SPECIAL[id]||CASTBY[id]; if(!c) continue; if(c.inside&&!d) continue; const n=mkNPC(c,want.x,want.y); n.walker=!!(d&&d.walk); n._s10=true; G.npcs.push(n); }
    else{ const n=G.npcs[i]; if(dist(n.home?n.home[0]:n.x,n.home?n.home[1]:n.y,want.x,want.y)>6){ n.x=want.x; n.y=want.y; n.home=[want.x,want.y]; } }
  }
}
{ const base=setupNPCs; setupNPCs=function(){ base(); try{ if(G&&G.mode==='story'&&S10.booted) s10NpcSync(true); }catch(e){ console.error(e); } }; }

// ---------- 14. talk: a step "talk npc" wins; then the first matching talk entry (a "what's new" line before the menu);
// option entries are menu options; bark entries are one-line bubbles over the head
function s10TalkHook(n){
  if(!G||G.mode!=='story'||G.done||!S10.booted) return false;
  const id=n.id;
  // quests that start by talking to their giver (first step "talk <giver>")
  for(const qid of S10.qOrder){ const q=S10.quests[qid]; if(G.quests[qid]||!s10QuestOpen(q)) continue; const s0=(q.step||[]).find(s=>!s.optional);
    if(s0&&s0._kind==='talk'&&s0._args[0]===id&&q.giver===id&&(s0.if==null||s10Cond(s0.if))){ s10QuestStart(qid,true); const R=s10Run('q',q); s10Run2({R,s:s0,x:s0,key:s0._id}); return true; } }
  for(const R of s10Runners()) for(const a of s10Doable(R)){
    const x=a.x, k=x._kind;
    if(a.s.legacy) continue;
    if(k==='talk'&&x._args[0]===id){ if(x.scene){ s10Run2(a); return true; } s10Finish(a); talkHub(n); return true; }
    if(k==='give'&&x._args[1]===id&&(G.items[x._args[0]]||0)>0){ s10Run2(a,()=>takeItems({[x._args[0]]:1})); return true; }
    if(k==='minigame'&&x.start==='talk'&&(x.at||x._args[1])===id&&!G.mini&&G.time>=S10.mini.lostAt+1){ if(!MINI[x._args[0]]){ s10Err(`minigame ${x._args[0]} does not exist`); return false; } s10MiniStart(a); return true; }
  }
  // a talk entry with first: true (A4S) plays once, ahead of the old modules' own talk hooks, then the person's menu
  const F=s10TalkFor(id,'first');
  if(F){ (G.story._once||(G.story._once={}))[s10TalkKey(F)]=1; S10.ver++;
    const L=s10AnswerLines(F,id,null); L.push({who:'narr',text:'',skipIf:()=>true,fn:()=>{ s10Do(F.then,{talk:id}); }}); talkHub(n,L); return true; }
  return false;
}
onTalk(n=>s10TalkHook(n));
// (v11 talk, STORY_PLAN 6.3 idea A) the opener: the first matching talk entry IS the person's greeting, and the menu
// sits under its last line (talkHub in a9f_talk.js calls s10Opener; the generic greetLine runs only when there is no
// data line). It rides on the menu rather than taking the talk over, so the old code's quest steps, offers and
// minigames with that person still run. An opener heard today is not said again: the person's idle line instead (a
// list of [full, simple] variants plays the next one not heard today, then idle). G.story._hd: { key: day } heard.
const s10Day=()=>Math.floor((G.worldTime||0)/540);   // dayNow() in a9f_talk.js
function s10Heard(){ return G.story._hd||(G.story._hd={}); }
// the next variant of a variant entry not heard today (from the rotation), or -1
function s10VarNext(T,k){ const n=T.say.length, R=G.story._rot||(G.story._rot={}), H=s10Heard(), d=s10Day(), i0=(R[k]|0)%n;
  for(let j=0;j<n;j++){ const i=(i0+j)%n; if(H[k+'#'+i]!==d) return i; } return -1; }
function s10VarTake(T,k,i){ const R=G.story._rot||(G.story._rot={}); R[k]=i+1; s10Heard()[k+'#'+i]=s10Day(); return s10Lines([[T._who].concat(T.say[i])],{talk:T._who}); }
// -> null (no data line), { T, heard:true } (heard today), or { T, pre:[lines], last: line|null, re, key, run() }
function s10Opener(n){
  if(!G||G.mode!=='story'||(G.done&&!s10AfterDone())||!S10.booted||!n) return null;
  const id=n.id, T=s10TalkFor(id,'line'); if(!T) return null;
  const k=s10TalkKey(T), H=s10Heard(), vars=!T.scene&&s10SayVariants(T.say);
  let lines;
  if(vars){ const i=s10VarNext(T,k); if(i<0) return {T,heard:true}; lines=s10VarTake(T,k,i); }
  else{ if(!T.once&&H[k]===s10Day()) return {T,heard:true}; H[k]=s10Day(); lines=s10TalkLines(T,id); }
  if(T.once) (G.story._once||(G.story._once={}))[k]=1;
  S10.ver++;
  // the menu sits under the opener's last line when that line is the person's own
  let last=null; const j=s10LastLine(lines);
  if(j>=0&&lines[j].who===id&&!lines[j].opts){ last=lines[j]; lines.splice(j,1); }
  const answered=!!(G.story._ra&&G.story._ra[k]);
  return {T,heard:false,pre:lines,last,key:k,re:T.re&&!answered?T.re:null,run:()=>{ s10Do(T.then,{talk:id}); }};
}
const s10LastLine=L=>{ for(let j=L.length-1;j>=0;j--) if(L[j]&&L[j].text!=='') return j; return -1; };
// "Anything else going on?": the opener's next variant not heard today (only for a variant entry)
function s10VarOpt(id){
  if(!G||G.mode!=='story'||!S10.booted) return null;
  const T=s10TalkFor(id,'line'); if(!T||T.scene||!s10SayVariants(T.say)) return null;
  const k=s10TalkKey(T); if(s10VarNext(T,k)<0) return null;
  return {t:S('Anything else going on?','Anything else new?'),then:()=>{ const i=s10VarNext(T,k); return i<0?[]:s10VarTake(T,k,i); },back:true};
}
// (v11 talk is per act: topics, idle and bye lines come from the current act's data, or from data with no act)
function s10ThisAct(T){ const o=T._owner; return !(o&&o.act)||+o.act===actOf(G.stage); }
// a person's idle line (what they say when the opener was heard today, and the prompt over the menu after an answer)
// and bye line: the opener's own idle when it has one, else the first matching { idle } / { bye } entry of the latest act
function s10MetaText(id,field,T0){
  if(!G||G.mode!=='story'||!S10.booted) return null;
  let src=T0&&T0[field]!=null?T0:null;
  if(!src){ let bestAct=-1; for(const T of S10.talk[id]||[]){ if(T[field]==null||s10TalkKind(T)!=='meta'||!s10ThisAct(T)) continue; const a=+(T._owner&&T._owner.act)||0; if(a<=bestAct) continue; if(s10TalkOk(T)){ src=T; bestAct=a; } } }
  if(!src) return null;
  const v=src[field];
  if(Array.isArray(v)&&v.length&&Array.isArray(v[0])){ const R=G.story._rot||(G.story._rot={}), k=field+':'+s10TalkKey(src), i=(R[k]|0)%v.length; R[k]=i+1; return s10T(v[i]); }
  return s10T(v)||null;
}
function s10Idle(id,T0){ return s10MetaText(id,'idle',T0); }
function s10Bye(id){ return s10MetaText(id,'bye'); }
// (v11 idea C) ask topics: { ask: [full, simple], if?, once?, say | scene | then, re?, end? } with a real label, shown
// only while its if holds. Up to three, by priority: a chapter's topics (the story step), then a quest's, then the
// person's own (people()); topics asked today go after the rest; then the latest act, then the data's order.
// G.story._hd['a:'+key]: the day a topic was asked.
function s10AskOpts(id,V){
  if(!G||G.mode!=='story'||!S10.booted) return [];
  const H=s10Heard(), day=s10Day(), L=[];
  (S10.talk[id]||[]).forEach((T,i)=>{ if(s10TalkKind(T)!=='ask'||!s10ThisAct(T)||!s10TalkOk(T)) return;
    const k=s10TalkKey(T), own=T._owner, pri=own&&own.kind==='chapter'?0:own&&own.kind==='quest'?1:2;
    L.push({T,i,k,pri,a:+(own&&own.act)||0,asked:H['a:'+k]===day?1:0}); });
  L.sort((x,y)=>x.pri-y.pri||x.asked-y.asked||y.a-x.a||x.i-y.i);
  return L.slice(0,3).map(({T,k})=>({t:s10T(T.ask),key:'s10a_'+k,back:!T.end,end:!!T.end,
    fn:()=>{ if(T.once) (G.story._once||(G.story._once={}))[k]=1; H['a:'+k]=day; S10.ver++; s10Do(T.then,{talk:id}); },
    then:()=>s10AnswerLines(T,id,V)}));
}
// a topic's answer; its re sits on the answer's last line (by the person) and goes on to the menu after the response
function s10AnswerLines(T,id,V){
  const L=s10TalkLines(T,id);
  if(T.re!=null){ const j=s10LastLine(L); if(j>=0&&!L[j].opts) L[j].opts=()=>s10ReOpts(T.re,{talk:id},L[j].who,{hub:V}); }
  if(V&&L.length){ const j=s10LastLine(L); if(j>=0) V.said.add(String(L[j].text)); }
  return L;
}
// a person converted to v11 talk IN THIS ACT (an opener with replies, or an ask topic, owned by the current act): the
// new menu (talkHub). In an act nobody has written v11 talk for yet, they keep the old menu (minus the repeat fix).
function s10V11(id){ if(!S10.booted||!G) return false; return (S10.talk[id]||[]).some(T=>(T.ask!=null||T.re!=null)&&s10ThisAct(T)); }
function s10HasTalk(id){ const L=S10.talk[id]; if(!L||!L.length) return false; return L.some(T=>{ const own=T._owner; return !(own&&own.act&&actOf(G.stage)<own.act); }); }
// at boot: CAST lines become the data's current line for people who have data talk
function s10TalkTakeover(){
  for(const id in S10.talk){
    const c=(typeof CASTBY!=='undefined'&&CASTBY[id])||(typeof SPECIAL!=='undefined'&&SPECIAL[id]); if(!c||c._s10lines) continue;
    let old=c.lines; c._s10lines=true;
    try{ Object.defineProperty(c,'lines',{configurable:true,get(){ try{ if(G&&s10HasTalk(id)){ const T=s10TalkFor(id,'line')||(S10.talk[id]||[]).find(t=>s10TalkKind(t)==='line'&&!t.once&&s10TalkOk(t)); if(T){ const say=s10SayVariants(T.say)?T.say.map(v=>s10T(v)):Array.isArray(T.say)&&Array.isArray(T.say[0])?[s10T(T.say[0].slice(1))]:T.say!=null?[s10T(T.say)]:null; if(say) return say; } } }catch(e){} return old; },set(v){ old=v; /* the old code may set lines: kept for when there is no data line */ }}); }catch(e){}
  }
  if(typeof BARKS!=='undefined') for(const b of BARKS){ const m=/^id:([\w]+)$/.exec(String(b._who||'')); if(!m||b._s10) continue; const id=m[1], c0=b.c; b._s10=true; b.c=function(){ if(G&&s10HasTalk(id)) return false; return typeof c0==='function'?c0.apply(this,arguments):!!c0; }; }
}
// (personal barks are told apart by their "who": B('c_x', 'id:c_hester', ...))
{ const base=B; B=function(k,who,c,t,o){ const r=base(k,who,c,t,o); try{ const b=BARKS[BARKS.length-1]; if(b&&b.k===k) b._who=who; }catch(e){} return r; }; }
// (the key of an entry without ask, idle or bye is what it was before v11, so saves keep their once marks)
function s10TalkKey(T){ return T.id||(T._who+':'+h32(JSON.stringify(T.ask!=null||T.idle!=null||T.bye!=null?[T.if,T.say,T.scene,T.option,T.then,T.ask,T.idle,T.bye]:[T.if,T.say,T.scene,T.option,T.then]))); }
// what an entry is: option (a menu option), bark, ask (a topic), first, meta (only idle or bye), line (an opener)
function s10TalkKind(T){ if(T.option) return 'option'; if(T.bark) return 'bark'; if(T.ask!=null) return 'ask'; if(T.first) return 'first'; if(T.say==null&&T.scene==null&&T.then==null) return 'meta'; return 'line'; }
// (v11) an opener with replies is done once Ash has answered it (the next opener down the list takes its place)
function s10TalkOk(T){ const own=T._owner; if(own&&own.act&&actOf(G.stage)<own.act) return false; if((T.once||T.first)&&G.story._once&&G.story._once[s10TalkKey(T)]) return false;
  if(T.re&&G.story._ra&&G.story._ra[s10TalkKey(T)]) return false; return T.if==null||s10Cond(T.if); }
// the first matching entry, top to bottom, of the latest act that has one (an act-5 line wins over an act-2 line that
// would also match; inside one act the order is the data's)
function s10TalkFor(id,kind){
  let best=null, bestAct=-1;
  for(const T of S10.talk[id]||[]){ const k=s10TalkKind(T); if(k!==kind) continue; const a=+(T._owner&&T._owner.act)||0; if(a<=bestAct) continue; if(s10TalkOk(T)){ best=T; bestAct=a; } }
  return best;
}
// say forms: [full, simple] or a string (said by that person); a list of lines [[who, full, simple], ...]; or (A2S)
// a list of [full, simple] variants, the next one each time it plays (what CAST.lines did)
const s10Speaker=w=>typeof w==='string'&&(w==='narr'||w==='ash'||w==='pip'||!!SPK[w]||!!S10.npcs[w]||!!(typeof CASTBY!=='undefined'&&CASTBY[w]));
function s10SayVariants(say){ return Array.isArray(say)&&say.length>0&&say.every(v=>Array.isArray(v)&&v.length<=2&&!s10Speaker(v[0])); }
function s10SayPick(T,say){ const k=s10TalkKey(T), R=G.story._rot||(G.story._rot={}), i=(R[k]|0)%say.length; R[k]=i+1; return say[i]; }
function s10TalkLines(T,id){
  if(T.scene) return s10Lines(S10.scenes[T.scene]||(s10Err(`talk ${id}: scene ${T.scene} is not defined`),[]),{sc:T.scene,talk:id});
  let say=T.say; if(say==null) return [];
  if(s10SayVariants(say)) say=s10SayPick(T,say);
  else if(Array.isArray(say)&&say.length&&Array.isArray(say[0])) return s10Lines(say,{talk:id});
  return s10Lines([[id].concat(Array.isArray(say)?say:[say])],{talk:id});
}
// talk menu options: data `option` entries, and "Wait here until dark" for a wait step's skip people (the wrapper is
// put on at boot, outside the old modules' own, so it sees and replaces their waits)
function s10WrapTalkOpts(){ const base=compTalkOpts; compTalkOpts=function(id,n){ const o=base(id,n); try{ s10TalkOpts(id,n,o); }catch(e){ console.error(e); } return o; }; }
function s10TalkOpts(id,n,o){
  if(!G||G.mode!=='story'||!S10.booted) return;
  const own=!!S10.chapters[G.stage];
  // a data chapter's own waits replace the old code's "Wait here until dark" for its stage
  if(own){ const wt=S('Wait here until dark','Wait until dark'); for(let i=o.length-1;i>=0;i--) if(o[i]&&o[i].t===wt&&!o[i]._s10) o.splice(i,1); }
  for(const R of s10Runners()) for(const a of s10Doable(R)){
    const x=a.x, nm=s10MiniNight(x); if(!(x._kind==='wait_for'&&!s10WaitOk(x))&&!nm) continue;
    const sk=s10Arr(x.skip).map(v=>typeof v==='string'?{npc:v}:v).find(v=>v&&v.npc===id); if(!sk) continue;
    const w=nm?'night':x._args[0], night=w==='night', hr=w==='hour'?+String(x._args[1]).split('-')[0]:null;
    if(w==='event') continue;
    const label=night?S('Wait here until dark','Wait until dark'):w==='day'?S('Wait here until morning','Wait until morning'):S(`Wait here until ${hr}:00`,`Wait until ${hr}:00`);
    const reply=sk.say?s10T(sk.say):night?S('Very well. Sit with me. It will be dark soon.','Sit with me. It gets dark soon.'):S('Sit with me a while.','Sit with me a while.');
    o.unshift({t:label,tag:'quest',_s10:true,fn:()=>later(0.2,()=>s10Time(night?'night':w==='day'?'day':String(hr))),then:[[id,reply]],end:true});
  }
  for(const T of S10.talk[id]||[]){
    if(!T.option||!s10TalkOk(T)) continue;
    o.unshift({t:s10T(T.option),tag:T.tag||'story',key:'s10_'+s10TalkKey(T),fn:()=>{ if(T.once) (G.story._once||(G.story._once={}))[s10TalkKey(T)]=1; s10Do(T.then,{talk:id}); },then:()=>s10AnswerLines(T,id,null),back:!T.end,end:!!T.end});
  }
}
function s10Barks(dt){
  if(!G.npcs||DLG||scene!=='play') return;
  S10.barkPoll=(S10.barkPoll||0)-dt; if(S10.barkPoll>0) return; S10.barkPoll=0.5;
  for(const id in S10.talk){
    if((S10.barkT[id]||0)>G.time) continue;
    const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===id); if(!n||dist(n.x,n.y,player.x,player.y)>260) continue;
    // (v11 polish) a bark line is chatter: it keeps to the chatter rules (Settings > Chatter, one bubble at a time,
    // long gaps; chatterOK in a9i_comps.js), and the same person waits 60 to 90 s before the next one
    if(typeof chatterOK==='function'&&!chatterOK(n)) continue;
    const L=(S10.talk[id]||[]).filter(T=>T.bark&&s10TalkOk(T)); if(!L.length){ S10.barkT[id]=G.time+5; continue; }
    const T=pick(L); S10.barkT[id]=G.time+rand(60,90);
    const say=s10SayVariants(T.say)?s10SayPick(T,T.say):Array.isArray(T.say)&&Array.isArray(T.say[0])?T.say[0].slice(1):T.say;
    try{ if(npcBubble(n,s10T(say),true)){ if(T.once) (G.story._once||(G.story._once={}))[s10TalkKey(T)]=1; if(typeof BK!=='undefined') BK.npcT[n.id]=G.time; return; } }catch(e){}
  }
}
// the marker over a person a step waits for ("!"), and over the giver of a quest that can start ("!")
{ const base=storyMarker; storyMarker=function(id){ if(base(id)) return true; try{ return s10MarkerFor(id); }catch(e){ return false; } }; }
function s10MarkerFor(id){
  if(!G||G.mode!=='story'||G.done||!S10.booted) return false;
  for(const R of s10Runners()) for(const a of s10Doable(R)){ if(a.extra||a.s.optional) continue; const x=a.x; if((x._kind==='talk'&&x._args[0]===id)||(x._kind==='give'&&x._args[1]===id)) return true; if(a.s.marker===id) return true; }
  for(const qid of S10.qOrder){ const q=S10.quests[qid]; if(q.giver===id&&!G.quests[qid]&&s10QuestOpen(q)){ const s0=(q.step||[]).find(s=>!s.optional); if(!s0||s0.if==null||s10Cond(s0.if)) return true; } }
  return false;
}

// ---------- 15. clues and deductions (the Case Book reads these; e10b_case.js draws it)
function s10Clue(id,ctx){
  if(!id||!G||!G.case) return;
  const C=S10.clues[id]; if(!C){ s10Err(`clue ${id} is not defined`); }
  if(G.case.clues[id]) return;
  G.case.clues[id]=1;
  storyEmit('clue:'+id);
  if(S10.quiet){ G.case.seen[id]=1; return; }
  S10.newClue={id,t:G.time}; S10.pulseT=G.time+6;
  setBanner(S('New clue!','New clue!'),C?s10T(C.text):id,3.6,'clue');
  try{ SFX.play('quest'); }catch(e){}
}
function s10Mystery(id){ const M=S10.mysteries[id]; return M||{id,title:String(id||'').split('_').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '),act:null}; }
function s10DeduceReady(D){ return s10Arr(D.needs).every(c=>G.case.clues[c]); }
// answer a deduction: { right, hint }. A wrong pick counts a try and never fails.
function s10Deduce(id,i){
  const D=S10.deduce[id]; if(!D) return {right:false,hint:'',err:`no deduction ${id}`};
  if(G.case.solved[id]) return {right:true,hint:'',already:true};
  if(!s10DeduceReady(D)) return {right:false,hint:simplify(S('You need more clues first.','Find more clues first.')),notReady:true};
  const P=s10Arr(D.pick)[i]; if(!P) return {right:false,hint:'',err:`no pick ${i}`};
  if(P.right){ s10Solve(id,false); return {right:true,hint:''}; }
  G.case.tries[id]=(G.case.tries[id]|0)+1; storyEmit('wrong:'+id);
  try{ SFX.play('warn',0.5); }catch(e){}
  saveGame();
  return {right:false,hint:simplify(s10T(P.hint)||S('Hmm. Look at your clues again.','Look at your clues again.'))};
}
function s10Solve(id,quiet){
  const D=S10.deduce[id]; if(!D||G.case.solved[id]) return;
  G.case.solved[id]=1; storyEmit('solved:'+id);
  const was=S10.quiet; if(quiet) S10.quiet=true;
  try{ s10Do(D.then,{deduce:id}); } finally { S10.quiet=was; }
  if(!quiet){ const P=s10Arr(D.pick).find(p=>p.right); setBanner(S('Solved!','Solved!'),P?s10T(P.t):'',3.4); try{ SFX.play('upgrade'); }catch(e){} }
  saveGame();
}

// ---------- 16. data quests: the same runner. The engine owns G.quests[id] for them: QDEFS[id] is a stand-in whose
// step (any index, and -1) shows the data step's text and target, so the old quest journal, HUD tracker and compass
// show them, while the old quest engine never advances or offers them (ab: never). takeover:true replaces an old
// QDEFS entry: old_steps[i] is the data step an old save at G.quests[id].step==i resumes at; a data step with
// legacy:true keeps the old mechanic: while it is current G.quests[id].step is its old index (other steps -1), and
// when the old code moves that step on, the data step finishes.
// (I5, I4's request) `until: <act>`: an optional quest of an earlier act is no longer offered or started after that act
// (a giver who comes along to a later act's map does not offer a quest whose things are back home)
function s10QuestOpen(q){ if(!q) return false; const a=actOf(G.stage); if(q.act&&a<+q.act) return false; if(q.until!=null&&a>+q.until) return false; if(q.if!=null&&!s10Cond(q.if)) return false; return true; }
function s10QDyn(q){
  const R=()=>s10Run('q',q);
  return {t:'flag',flag:'__s10_quest',_s10dyn:true,
    get text(){ const s=s10Active(R()); return s?(s10T(s.obj)||s10DefaultObj(s)):s10T(q.title); },
    at:()=>{ const r=R(), s=s10Active(r); if(!s) return null; const a=s10Doable(r).find(a=>a.s===s); const w=a&&s10StepWhere(a); return w?(w.npc&&!w.area?'npc:'+w.npc:`xy:${Math.round(w.x)},${Math.round(w.y)}`):null; }};
}
function s10QOld(q,s){ const o=s10Arr(q.old_steps); const i=o.indexOf(s._id); return i; }
function s10QuestDefs(){
  for(const id of S10.qOrder){
    const q=S10.quests[id]; if(q._qdef) continue;
    const old=QDEFS[id]&&!QDEFS[id]._s10?QDEFS[id]:null;
    if(old&&!q.takeover){ s10Err(`quest ${id}: the old quest table already has that id (use takeover: true)`); continue; }
    if(old) (S10.oldQ||(S10.oldQ={}))[id]=old;
    const dyn=s10QDyn(q), steps=[];
    if(old){ (old.steps||[]).forEach((st,i)=>{ const sid=s10Arr(q.old_steps)[i], ds=(q.step||[]).find(s=>s._id===sid);
      steps[i]=ds&&ds.legacy?Object.assign({},st,{text:s10T(ds.obj)||st.text}):dyn;
      // a legacy talk step's own scene is what the old code plays for it (its lines, clue tags and effects)
      if(ds&&ds.legacy&&ds.scene&&st&&st.t==='talk'&&S10.scenes[ds.scene]){ const sc=ds.scene;
        Object.defineProperty(steps[i],'lines',{configurable:true,enumerable:true,get(){ if(G.story) (G.story._seen||(G.story._seen={}))[sc]=1; return s10Lines(S10.scenes[sc],{sc,R:s10Run('q',q),step:ds}); }}); } }); }
    else steps[0]=dyn;
    // (one more after the old steps, so the old code moving its last legacy step on never finishes the quest itself)
    if(old) steps[(old.steps||[]).length]=dyn;
    steps[-1]=dyn;
    // (the title is read each time: a title with variants follows its conditions)
    const oldT=old&&old.title;
    q._qdef=QDEFS[id]={_s10:true,get title(){ let t=''; try{ t=G?s10T(q.title):''; }catch(e){} return t||oldT||id; },set title(v){},giver:q.giver||(old&&old.giver)||null,ab:'__story_data__',min:old&&old.min,steps,errand:false,offer:[],topics:old&&old.topics};
  }
}
// the index G.quests[id].step should have for the current data step
function s10QStepIdx(q){ const s=s10Active(s10Run('q',q)); if(s&&s.legacy){ const i=s10QOld(q,s); if(i>=0) return i; } return S10.oldQ&&S10.oldQ[q.id]?-1:0; }
function s10QuestDoneIf(){
  for(const id of S10.qOrder){ const q=S10.quests[id]; if(q.done_if==null) continue; const Q=G.quests[id]; if(Q&&Q.done) continue;
    if(!s10Cond(q.done_if)) continue;
    const was=S10.quiet; S10.quiet=true;
    try{ if(!G.quests[id]) G.quests[id]={step:0}; const R=s10Run('q',q), st=s10St(R); for(const s of q.step||[]) if(!s.optional) st[s._id]=1; G.quests[id].done=true; if(typeof deed==='function') deed('q_'+id); storyEmit('quest_done:'+id); }
    finally{ S10.quiet=was; } }
}
function s10QuestSync(){
  for(const id of S10.qOrder){
    const q=S10.quests[id], Q=G.quests[id]; if(!Q||Q.done) continue;
    const R=s10Run('q',q), s=s10Active(R);
    if(s&&s.legacy){ const i=s10QOld(q,s); if(i>=0&&Q.step>i&&S10.qLegacy&&S10.qLegacy[id]===i){ S10.qLegacy[id]=null; s10Finish({R,s,x:s,key:s._id}); continue; } }
    const want=s10QStepIdx(q); if(Q.step!==want) Q.step=want;
    (S10.qLegacy||(S10.qLegacy={}))[id]=s&&s.legacy?want:null;
  }
}
function s10QuestStepFlag(R,s){ G.flags[`sq_${R.d.id}_${s._id}`]=1; }
function s10QuestStart(id,quiet){
  const q=S10.quests[id];
  if(!q){ if(QDEFS[id]&&!QDEFS[id]._s10){ if(!G.quests[id]) startQuest(id); return; } s10Err(`quest ${id} is not defined`); return; }
  if(G.quests[id]) return;
  // (I5) a quest's own act and `if` gate it here too: the finale's errands are started from scenes that every player
  // sees (`quest start q_n5_glaciar` at the Floe Gap), and the quest's if keeps a friend freed earlier out of it
  if(!s10QuestOpen(q)) return;
  // (quiet: started by talking to the giver; the old "New side quest" banner would name the talk that is just
  // playing, so it is left out: the step's own banner names the next thing to do once the scene ends)
  const B0=G.banner, Q0=(G.bannerQ||[]).slice();
  startQuest(id); if(G.quests[id]) G.quests[id].step=s10QStepIdx(q);
  if(quiet){ G.banner=B0; G.bannerQ=Q0; }
  storyEmit('quest_start:'+id);
}
// a data quest whose last step is done: done, banner, friendship, deed q_<id> (later acts read them)
function s10QuestComplete(q){
  const id=q.id, Q=G.quests[id]||(G.quests[id]={step:0}); if(Q.done) return;
  Q.done=true; try{ onQuestDone(id); }catch(e){}
  if(!S10.quiet) setBanner(S('Quest complete','Quest complete'),s10T(q.title)||id,2.6);
  G.stats.quests=(G.stats.quests||0)+1; if(q.giver) try{ befriend(q.giver,1.5); }catch(e){}
  if(typeof deed==='function') deed('q_'+id);
  storyEmit('quest_done:'+id); G.lastQ=id; try{ questPoke(); }catch(e){} saveGame();
}
function s10QuestFinish(id){
  const q=S10.quests[id];
  if(!q){ const d=QDEFS[id]; if(d&&!d._s10){ if(!G.quests[id]) startQuest(id); const Q=G.quests[id]; if(Q&&!Q.done){ Q.step=(d.steps||[]).length; Q.done=true; try{ onQuestDone(id); }catch(e){} storyEmit('quest_done:'+id); } return; } s10Err(`quest ${id} is not defined`); return; }
  if(!G.quests[id]) s10QuestStart(id);
  const R=s10Run('q',q), st=s10St(R);
  for(const s of q.step||[]) if(!s.optional&&!st[s._id]){ st[s._id]=1; s10QuestStepFlag(R,s); }
  s10QuestComplete(q);
}
// an old save in the middle of a quest the data took over: resume at old_steps[G.quests[id].step]
function s10QuestResume(){
  for(const id of S10.qOrder){
    const q=S10.quests[id], Q=G.quests[id], key='q:'+id; if(!Q||!(S10.oldQ&&S10.oldQ[id])) continue;
    const st0=G.story[key]; if(st0&&(st0._r||Object.keys(st0).length)) continue;
    const st=G.story[key]={_r:1};
    if(Q.done){ for(const s of q.step||[]) st[s._id]=1; continue; }
    const sid=s10Arr(q.old_steps)[Q.step]; if(sid==null) continue;
    const R=s10Run('q',q);
    for(const s of q.step||[]){ if(s._id===sid) break; if(!s.optional) s10MigrateStep(R,s); }
  }
}

// ---------- 17. objectives, markers and hints for the old journal, HUD and compass
function s10DefaultObj(s){
  const A=s._args||[], n=i=>s10Name(A[i]);
  switch(s._kind){
    case 'talk': return S(`Talk to ${n(0)}`,`Talk to ${n(0)}`);
    case 'goto': return S(`Go to ${n(0)}`,`Go to ${n(0)}`);
    case 'find': return S(`Find ${ITEM_NAMES[A[0]]||n(0)}`,`Find ${ITEM_NAMES[A[0]]||n(0)}`);
    case 'examine': return S(`Look at ${n(0)}`,`Look at ${n(0)}`);
    case 'fight': return S(`Defeat ${n(0)}`,`Defeat ${n(0)}`);
    case 'use_power_at': return S(`Use your power at ${n(1)}`,`Use your power at ${n(1)}`);
    case 'give': return S(`Give ${ITEM_NAMES[A[0]]||n(0)} to ${n(1)}`,`Give it to ${n(1)}`);
    case 'deduce': return S('Work it out in the Case Book','Open the Case Book');
    case 'track': return S(`Follow ${n(0)}`,`Follow ${n(0)}`);
    case 'wait_for': return A[0]==='night'?S('Wait for night','Wait for night'):A[0]==='day'?S('Wait for morning','Wait for morning'):S('Wait','Wait');
    case 'minigame': if(s10MiniNight(s)) return s.at?S(`Wait for night at ${s10Name(s.at)}`,`Wait for night at ${s10Name(s.at)}`):S('Wait for night','Wait for night');
      return s.at?S(`Go to ${s10Name(s.at)}`,`Go to ${s10Name(s.at)}`):S('Get ready!','Get ready!');
    case 'dungeon': return S(`Explore ${n(0)}`,`Explore ${n(0)}`);
    case 'choose': return S('Make your choice','Make your choice');
  }
  return '';
}
function s10StepWhere(a){
  const x=a.x, A=x._args||[], s=a.s;
  if(s&&s.marker&&a.x===a.s) return s10Where(s.marker);
  switch(x._kind){
    case 'talk': return s10Where(A[0]);
    case 'give': return s10Where(A[1]);
    case 'goto': case 'examine': case 'track': case 'fight': case 'dungeon': return s10Where(A[0]);
    case 'use_power_at': return s10Where(A[1]||A[0]);
    case 'find': return x.at?s10Where(x.at):null;
    case 'wait_for': case 'minigame': { if(x._kind==='minigame'&&G.mini&&G.mini.kind===A[0]&&MINI[A[0]].target){ const t=MINI[A[0]].target(G.mini); if(t) return t; } return x.at?s10Where(x.at):null; }
  }
  return null;
}
function s10Objs(c){
  const R=s10Run('ch',c), s=s10Active(R); if(!s) return [];
  if(G.mini&&s._kind==='minigame'&&G.mini.kind===s._args[0]){ const M=G.mini, D=MINI[M.kind]; const t=D.target?D.target(M):null; const h=D.hud?D.hud(M):null; return [Object.assign({text:h||s10T(s.obj)||s10DefaultObj(s),near:true},t?{x:t.x,y:t.y}:{})]; }
  const text=s10T(s.obj)||s10DefaultObj(s);
  const as=s10Doable(R).filter(a=>a.s===s);
  const out=[], t2=text||(c.card&&s10T(c.card[1]))||s10T(c.name)||'';
  for(const a of as){ const w=s10StepWhere(a); if(w) out.push(Object.assign({text:t2},w)); }
  if(!out.length) out.push({text:t2});
  return out;
}
function s10Hint(c){
  const R=s10Run('ch',c), s=s10Active(R);
  if(s&&s.hint) return s10T(s.hint);
  const h=c.hint; if(h){ if(Array.isArray(h)||typeof h==='string') return s10T(h); if(s&&h[s._id]) return s10T(h[s._id]); }
  return s?s10T(s.obj)||s10DefaultObj(s):'';
}

// ---------- 18. watchers: dungeon and boss done flags become events (thin adapters; the old code is not changed)
function s10Watch(){
  if(!G||!G.flags||!G.story) return;
  const E=G.story._ev||(G.story._ev={});
  for(const k in G.flags){ if(!G.flags[k]) continue; let m=/^trial_(.+)_done$/.exec(k); if(m&&!E['dungeon_done:'+m[1]]) storyEmit('dungeon_done:'+m[1]); m=/^trial_(.+)_boss$/.exec(k); if(m&&!E['boss_done:'+m[1]]) storyEmit('boss_done:'+m[1]); }
  for(const k in (G.bossDone||{})) if(G.bossDone[k]&&!E['boss_done:'+k]) storyEmit('boss_done:'+k);
}

// ---------- 19. the camera leans toward a scene's cam target ({cam:'place', s:seconds})
{ const base=updateCam; updateCam=function(dt,snap){
  const C=S10.cam; if(!C||AREA||!player||!G||scene!=='dialogue') return base(dt,snap);
  const k=C.k*Math.min(1,(G.time-C.t0)/C.dur), e=k*k*(3-2*k), px=player.x, py=player.y;
  player.x=px+(C.x-px)*e; player.y=py+(C.y-py)*e; try{ return base(dt,snap); } finally { player.x=px; player.y=py; } }; }

// ---------- 20. per frame: outdoors (updateStory) and inside (updateArea); actors walk during scenes (liteUpdate)
{ const base=updateStory; updateStory=function(dt){ base(dt); try{ s10Tick(dt); }catch(e){ console.error(e); } }; }
{ const base=updateArea; updateArea=function(dt){ base(dt); try{ if(AREA) s10Tick(dt); }catch(e){ console.error(e); } }; }
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt); try{ if(S10.walks.length) s10WalkTick(dt); if(S10.cam&&!DLG) S10.cam=null; }catch(e){ console.error(e); } }; }
{ const base=simUpdate; simUpdate=function(dt){ base(dt); try{ if(S10.walks.length) s10WalkTick(dt); }catch(e){ console.error(e); } }; }
// minigames that end (win or lose) tell the step that started them
{ const base=miniEnd; miniEnd=function(win,title,sub){ const M=G&&G.mini; base(win,title,sub); try{ if(M&&S10.booted) s10MiniEnded(M.kind,!!win); }catch(e){ console.error(e); } }; }
// legacy things examined through their own prompt (the Moth Mask Watch board): the step waiting for them finishes
// once their own lines are read
// (put on at boot, outside every module's own lmAct wrapper: p3_frost's returns early for a frozen person)
function s10WrapLm(){ const base=lmAct; lmAct=function(o){ try{ if(s10LmTakes(o)) return; }catch(e){ console.error(e); } const r=base(o); try{ s10LegacyExamined(o); }catch(e){ console.error(e); } return r; }; }
function s10LmIds(o){ return Object.keys(S10.legacy).filter(id=>{ const e=S10.legacy[id]; return String(e.src||'')==='LANDMARKS:'+o.id||new RegExp('\\.js\\s+'+o.id+'$').test(String(e.src||'')); }); }
// an examine step with its own scene waits on this landmark: the scene plays instead of the landmark's own lines
function s10LmTakes(o){
  if(!o||!S10.booted||!G||G.mode!=='story') return false;
  const ids=s10LmIds(o); if(!ids.length) return false;
  if(!s10Runners().some(R=>s10Doable(R).some(a=>a.x._kind==='examine'&&ids.includes(a.x._args[0])&&(a.x.scene||a.x.win)))) return false;
  G.story._ex=G.story._ex||{}; for(const id of ids){ G.story._ex[id]=(G.story._ex[id]|0)+1; storyEmit('examine:'+id); s10Examined(id); }
  return true;
}
function s10LegacyExamined(o){
  if(!o||!S10.booted) return;
  const ids=s10LmIds(o);
  if(!ids.length) return;
  G.story._ex=G.story._ex||{};
  for(const id of ids){ G.story._ex[id]=(G.story._ex[id]|0)+1; storyEmit('examine:'+id); }
  const go=()=>{ for(const id of ids) s10Examined(id); };
  if(DLG){ const d=DLG, prev=d.done; d.done=()=>{ if(prev) prev(); go(); }; } else go();
}

// (A3b) a fade from a scene's { fade } beat, a warp or a time effect clears while the scene is still talking (G.fade
// decays in simUpdate only, so the screen stayed black until the scene ended); the hearth story keeps its own slow fade
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt); try{ if(G&&G.fade>0&&scene==='dialogue'&&!(typeof HS!=='undefined'&&HS.on)) G.fade=Math.max(0,G.fade-dt*2.5); }catch(e){} }; }

// ---------- 21. saves: G.case and G.story ride along with the game; old saves start empty
function s10Fresh(){ G.case={clues:{},solved:{},tries:{},seen:{},pages:{}}; G.story={_ev:{},_seen:{},_once:{},_ex:{},_w:{},_npc:{},_trk:{},said:{}}; }
{ const base=newRun; newRun=function(mode){ base(mode); try{ s10Fresh(); S10.queue.length=0; S10.pend={}; S10.cam=null; S10.actors={}; S10.walks.length=0; S10.mini={lostAt:-99,tries:0,owner:null}; }catch(e){ console.error(e); } }; }
{ const base=saveData; saveData=function(){ const s=base(); try{ if(G&&G.case) s.case=G.case; if(G&&G.story) s.story=G.story; }catch(e){} return s; }; }
{ const base=loadGame; loadGame=function(s){ base(s); try{ s10Loaded(s); }catch(e){ console.error(e); } }; }
function s10Loaded(s){
  const C=s&&s.case, T=s&&s.story;
  G.case={clues:Object.assign({},C&&C.clues),solved:Object.assign({},C&&C.solved),tries:Object.assign({},C&&C.tries),seen:Object.assign({},C&&C.seen),pages:Object.assign({},C&&C.pages)};
  G.story=Object.assign({_ev:{},_seen:{},_once:{},_ex:{},_w:{},_npc:{},_trk:{},said:{}},T&&typeof T==='object'?JSON.parse(JSON.stringify(T)):{});
  S10.queue.length=0; S10.pend={}; S10.cam=null; S10.actors={}; S10.walks.length=0; S10.mini={lostAt:-99,tries:0,owner:null};
  if(S10.booted){ s10Silence(S10.chapters[G.stage]); s10Migrate(); s10ActMigrate(); s10QuestResume(); try{ s10QuestDoneIf(); }catch(e){} s10NpcSync(true); }
}
// a save made by the old code in the middle of a chapter the data now runs: steps the old code already did are done
// (a step whose `then` sets a flag the save has, a talk/goto/cutscene whose scene the old code marked seen, and every
// step before a done one). Their scene effects and clues are given quietly, so nothing is missing later.
function s10Migrate(){
  for(const id of S10.chOrder){
    const c=S10.chapters[id]; if(!c||G.story[id]) continue;
    if(stageAt(G.stage)<stageAt(id)||G.stage!==id) continue;
    const R=s10Run('ch',c), st=s10St(R), steps=(c.step||[]).filter(s=>s._kind&&!s.optional);
    let last=-1;
    steps.forEach((s,i)=>{ const sets=s10Arr(s.then).some(e=>typeof e==='string'&&/^set\s/.test(e)&&(()=>{ const f=e.split(/\s+/)[1].split('=')[0]; return !!G.flags[f]; })());
      // (a key the chapter silences itself is marked seen by that, not by the old code having played it)
      const sn2=G.flags[S10_SN[+c.act]], seen=['talk','goto','cutscene'].includes(s._kind)&&s.scene&&!s10Arr(c.silence).includes(s.scene)&&((G.flags.c_sn&&G.flags.c_sn[s.scene])||(sn2&&sn2[s.scene]));
      // (A2B) migrate_if: <condition>: an old save where it holds has done this step
      let mig=false; if(s.migrate_if!=null) try{ mig=s10Cond(s.migrate_if); }catch(e){ mig=false; }
      if(sets||seen||mig) last=i; });
    for(let i=0;i<=last;i++){ const s=steps[i]; s10MigrateStep(R,s); }
  }
}
// (A2B) an act's migrate: [{ if, then }]: once per save, at load (or boot), when its condition holds, its effects run
// quietly (old saves that skipped clues a later step asks for). G.story._mig remembers which ran.
function s10ActMigrate(){
  if(!G||G.mode!=='story'||!G.story) return;
  const M=G.story._mig||(G.story._mig={});
  for(const n in S10.acts){ const L=s10Arr(S10.acts[n]&&S10.acts[n].migrate);
    L.forEach((m,i)=>{ const k=n+'/'+i; if(M[k]||!m) return; let ok=false; try{ ok=m.if==null||s10Cond(m.if); }catch(e){ ok=false; } if(!ok) return;
      M[k]=1; const was=S10.quiet; S10.quiet=true; try{ s10Do(m.then,{act:+n}); }catch(e){ console.error(e); } finally{ S10.quiet=was; } }); }
}
function s10MigrateStep(R,s){
  const st=s10St(R), was=S10.quiet; S10.quiet=true;
  try{
    const sc=s.scene&&S10.scenes[s.scene]; if(sc) s10QuietScene(sc);
    for(const p of s.parts||[]){ if(!st[p._id]){ st[p._id]=1; s10Do(s10Arr(p.then).filter(e=>typeof e==='string'&&/^(clue|set|give)\s/.test(e)),{R}); } }
    if(s._kind==='deduce'){ const D=S10.deduce[s._args[0]]; if(D){ for(const c of s10Arr(D.needs)) if(!G.case.clues[c]){ G.case.clues[c]=1; G.case.seen[c]=1; } s10Solve(D.id,true); } }
    st[s._id]=1;
    s10Do(s10Arr(s.then).filter(e=>!(typeof e==='string'&&/^stage\s/.test(e))),{R});
  } finally { S10.quiet=was; }
}
function s10QuietScene(beats){
  for(const b of s10Arr(beats)){
    if(Array.isArray(b)){ const o=s10Line(b).o; for(const c of s10Arr(o.clue)) s10Clue(c); if(o.do) s10Do(s10Arr(o.do).filter(e=>typeof e==='string'&&/^(give|set|clue)\s/.test(e)),{}); }
    else if(b&&b.do) s10Do(s10Arr(b.do).filter(e=>typeof e==='string'&&/^(give|set|clue)\s/.test(e)),{});
  }
}

// ---------- 22. boot: register everything, check it, take over old stages, wire the adapters
function s10Boot(){
  if(S10.booted) return; S10.booted=true;
  for(const [k,d] of S10.raw) try{ s10Register(k,d); }catch(e){ s10Err(`${k} ${d&&d.id}: ${e.message}`); console.error(e); }
  try{ s10Link(); }catch(e){ s10Err('link: '+e.message); console.error(e); }
  try{ s10Adapt(); }catch(e){ s10Err('adapters: '+e.message); console.error(e); }
  try{ s10Gates(); }catch(e){ s10Err('gates: '+e.message); console.error(e); }
  try{ s10StoryKeys(); s10Replaces(); }catch(e){ s10Err('old STORY keys: '+e.message); console.error(e); }
  try{ s10TalkTakeover(); }catch(e){ s10Err('talk takeover: '+e.message); console.error(e); }
  try{ s10Check(); }catch(e){ s10Err('check: '+e.message); console.error(e); }
  if(G&&!G.story) s10Fresh();
  if(G&&G.mode==='story'){ s10Migrate(); s10ActMigrate(); s10QuestResume(); s10NpcSync(true); }
}
window.__ebStoryBoot=()=>{ try{ s10Boot(); }catch(e){ console.error(e); } };
// data registered after boot (tests, a late file) is linked the same way
function s10Late(){ s10Link(); s10Gates(); s10StoryKeys(); s10Replaces(); s10TalkTakeover(); if(G&&G.mode==='story'){ s10QuestResume(); s10NpcSync(true); } }
// chapters become stages (new ones after their `after`), the old stage of the same id is taken over
function s10Link(){
  s10People();
  for(const id of S10.chOrder){
    const c=S10.chapters[id]; if(c._linked) continue; c._linked=true;
    const old=STAGEDEF[id], take=!!old&&c.takeover!==false;
    if(!old){ defineStages(+c.act||2,[{id}]); if(c.after&&stageAt(c.after)>=0){ const i=stageAt(id); STAGES.splice(i,1); STAGES.splice(stageAt(c.after)+1,0,id); } }
    const D=STAGEDEF[id]; if(!D) continue;
    if(old) D._old={objectives:D.objectives,update:D.update,marker:D.marker,hint:D.hint,talk:D.talk,enter:D.enter,soFar:D.soFar,idle:D.idle,card:D.card,chapter:D.chapter};
    const card=c.card===null?null:c.card?[String(c.card[0]),s10T(c.card[1])]:D.card;
    if(c.mom&&typeof MOM_CH!=='undefined') MOM_CH[id]=s10Arr(c.mom).map(x=>s10T(x));
    // takeover: false: the old stage keeps every hook of its own (the data's steps run beside it; the engine's enter runs
    // first). keep: ['update', 'enter', ...] (N5b R7, A4a keep_enter): those hooks of a taken-over stage keep running
    // (enter runs after the engine's own; the others are the old ones instead of the data's)
    const own=!old||take, keep=new Set(own?s10Arr(c.keep).concat(c.keep_enter?['enter']:[]):['objectives','update','marker','hint','talk','idle','soFar','enter']);
    for(const h of keep) if(!['objectives','update','marker','hint','talk','idle','soFar','enter'].includes(h)) s10Err(`${id}: keep "${h}" is not a stage hook (objectives, update, marker, hint, talk, idle, soFar, enter)`);
    const O=D._old||{}, has=h=>keep.has(h)&&O[h]!=null;
    const N={card,chapter:card?card[1]:(c.name?s10T(c.name):D.chapter),objectives:has('objectives')?O.objectives:()=>s10Objs(c),hint:has('hint')?O.hint:()=>s10Hint(c),
      soFar:has('soFar')?O.soFar:()=>s10T(c.so_far),marker:has('marker')?O.marker:nid=>false,talk:has('talk')?O.talk:()=>false,
      enter:o=>{ s10Enter(c,o); if(has('enter')&&typeof O.enter==='function') try{ O.enter(o); }catch(e){ console.error(e); } },update:has('update')?O.update:()=>{},idle:keep.has('idle')?O.idle||null:null};
    if(own) N._s10=id;
    Object.assign(D,N);
    if(D.chapter) CHAPTER[id]=D.chapter;
    for(const s of c.step||[]){ if(s._kind==='minigame'){ const m=s._args[0]; if(!MINI[m]) s10Err(`${id}.${s._id}: minigame ${m} does not exist`); } }
  }
  s10QuestDefs();
}
// the old modules' once-only marks: Act II c_sn (x1_story), Act III f_sn (x2_story), Act IV m_sn, the finale n_sn
const S10_SN={2:'c_sn',3:'f_sn',4:'m_sn',5:'n_sn'};
function s10Silence(c){ if(!c||!c.silence||!G||!G.flags) return; const keys=['c_sn']; const k2=S10_SN[+c.act]; if(k2&&!keys.includes(k2)) keys.push(k2);
  for(const f of keys){ const sn=G.flags[f]||(G.flags[f]={}); for(const k of s10Arr(c.silence)) sn[k]=1; } }
function s10Enter(c,o){
  if(!G.story) s10Fresh();
  s10Silence(c); s10Migrate(); s10ActMigrate(); s10NpcSync(true);
  storyEmit('chapter:'+c.id);
}
// the takeover adapters: the old code's own triggers for a stage the data now runs
// a legacy area object (src 'furn:<k>', A2a's Moth's Nest bell and biscuit tin): examining it plays the data's text
// (the entry's say or scene, or the waiting step's scene) instead of the object's own action
function s10FurnAct(o,base,args){
  const ids=Object.keys(S10.legacy).filter(id=>{ const e=S10.legacy[id]; return String(e.src||'')==='furn:'+o.k&&(!e.area||s10InArea(e.area)); });
  if(!ids.length) return false;
  G.story._ex=G.story._ex||{}; for(const id of ids){ G.story._ex[id]=(G.story._ex[id]|0)+1; storyEmit('examine:'+id); }
  const e=S10.legacy[ids[0]], say=e.say, sc=e.scene||(typeof say==='string'&&S10.scenes[say]?say:null), done=()=>{ for(const id of ids) s10Examined(id); };
  // a waiting examine step's own scene wins (it plays once, from the step); else the entry's own say or scene
  const waiting=s10Runners().some(R=>s10Doable(R).some(a=>a.x._kind==='examine'&&ids.includes(a.x._args[0])&&(a.x.scene||a.x.win)));
  if(waiting){ done(); return true; }
  if(sc){ s10Play(sc,done,{place:ids[0]}); return true; }
  if(say!=null){ const L=Array.isArray(say)&&say.length&&Array.isArray(say[0])?say:[['narr'].concat(Array.isArray(say)?say:[say])]; s10Play(L,done,{place:ids[0]}); return true; }
  base.apply(this,args);
  if(DLG){ const d=DLG, prev=d.done; d.done=()=>{ if(prev) prev(); done(); }; } else done();
  return true;
}
// a legacy furn:<k> entry whose furniture has no prompt of its own (house barrels): while a step wants it examined, or
// the entry has its own say or scene, that furniture in its area says "Look at <the entry's name>"
function s10FurnPrompts(A){
  if(!A||!A.objs||typeof FURN_LABEL==='undefined') return;
  const ents=Object.keys(S10.legacy).map(id=>S10.legacy[id]).filter(e=>/^furn:/.test(String(e.src||''))&&(!e.area||e.area===A.id||(A.def&&A.def.id===e.area)));
  for(const e of ents){ const k=String(e.src).slice(5);
    for(const o of A.objs){ if(o.k!==k||o.prompt||FURN_LABEL[k]||(typeof FLOOR_LABEL!=='undefined'&&FLOOR_LABEL[k])||(typeof CAVE_LABEL!=='undefined'&&CAVE_LABEL[k]!==undefined)) continue;
      const nm=s10T((e.aliases&&e.aliases[0])||e.name)||k;
      o.prompt=()=>{ try{ const want=s10Runners().some(R=>s10Doable(R).some(a=>a.x._kind==='examine'&&a.x._args[0]===e.id)); return want||e.say!=null||e.scene?simplify(S('Look at '+nm,'Look at '+nm)):null; }catch(err){ return null; } }; } }
}
function s10Adapt(){
  s10WrapTalkOpts(); s10WrapLm();
  // (A3S) old code that offers a quest the data took over (offerQuest(id): x2_story's f2sYlva for f_rime) plays the data
  // quest's own `offer: '<scene id>'` instead of the stand-in's bare "Will you help?"
  { const base=offerQuest; offerQuest=function(id){ try{ const q=S10.quests[id], d=QDEFS[id];
      if(q&&d&&d._s10&&q.offer&&S10.scenes[q.offer]){ s10Play(q.offer,null,{quest:id}); return; } }catch(e){ console.error(e); } return base.apply(this,arguments); }; }
  // N5A (d): while a data chapter's step has an objective, the stock "Travel to <boss site>" lines step aside (they
  // would win the HUD's nearest-of), unless the step is the fight at that site
  { const base=objectiveList; objectiveList=function(){ const out=base(); try{ const c=G&&G.mode==='story'&&!G.done&&S10.chapters[G.stage];
      if(c&&out.some(o=>!o.site&&!o.fight)){ const s=s10Active(s10Run('ch',c)), foe=s&&s._kind==='fight'?s._args[0]:null; return out.filter(o=>!o.site||(foe&&SITES[o.site]&&SITES[o.site].boss===foe)); } }catch(e){ console.error(e); } return out; }; }
  { const base=areaObjAct; areaObjAct=function(o){ try{ if(o&&S10.booted&&s10FurnAct(o,base,arguments)) return; }catch(e){ console.error(e); } return base.apply(this,arguments); }; }
  // (outside the acts' own moodLine wrappers, so a person with data talk gets no old mood lines)
  { const base=moodLine; moodLine=function(id){ try{ if(G&&s10HasTalk(id)) return null; }catch(e){} return base(id); }; }
  // Act II's rooftop chase: winning it no longer plays the old ending and jumps to c_salt when the data owns the chase
  if(typeof c1RWin==='function'&&!c1RWin._s10){ const base=c1RWin; c1RWin=function(){ if(!s10MiniOwner('c_roofchase')) return base(); G.flags.c_chase_won=1; later(0.05,()=>miniEnd(true,S('Caught up!','Caught up!'),S('The roofs end at the Clockwatch Hall.','The roofs end here.'))); }; c1RWin._s10=true; }
  // kneels (section 10b)
  for(const f in KNEEL_S10){ try{ if(KNEEL_S10[f].install((e,fin)=>s10Kneel(f,e,fin))) S10.adapted=(S10.adapted||[]).concat('kneel:'+f); }catch(e){ console.error(e); } }
  // thin adapters: the later acts' story beats also become events
  for(const name of ['f2sBeat','m3sBeat','n4sBeat']){
    let f=null; try{ f=eval(`typeof ${name}==='function'?${name}:null`); }catch(e){ f=null; }
    if(!f||f._s10) continue;
    const w=function(b,...a){ const r=f.call(this,b,...a); try{ storyEmit('beat:'+b); }catch(e){} return r; }; w._s10=true;
    try{ if(name==='f2sBeat') f2sBeat=w; else if(name==='m3sBeat') m3sBeat=w; else n4sBeat=w; S10.adapted=(S10.adapted||[]).concat(name); }catch(e){}
  }
}
function s10StoryKeys(){
  if(typeof STORY==='undefined') return;
  for(const id in S10.scenes){
    if(!(id in STORY)||S10.storyDone&&S10.storyDone[id]) continue;
    (S10.storyDone=S10.storyDone||{})[id]=1;
    const desc=Object.getOwnPropertyDescriptor(STORY,id), byGetter=!!(desc&&(desc.get||desc.set));
    const old=STORY[id], lines=s10Lines(S10.scenes[id],{sc:id}), mark={who:'narr',text:'',skipIf:()=>true,fn:()=>{ if(G&&G.story) (G.story._seen||(G.story._seen={}))[id]=1; }};
    // the old module's own "seen" mark (its first, silent line: c_sn, f_sn, m_sn, n_sn) is kept, and also runs when the
    // engine plays the scene itself, so the old code's seen checks still hold
    const L0=Array.isArray(old)?old[0]:null, keep=L0&&!Array.isArray(L0)&&L0.text===''&&L0.fn&&L0.skipIf?[L0]:[];
    if(keep.length) (S10.oldMark||(S10.oldMark={}))[id]=keep[0].fn;
    // (a getter without a setter builds a fresh array on every read, so changing it in place would be lost: the key
    // becomes a plain value; x4's getters have a setter that keeps what it is given)
    const L2=[...keep,mark,...lines];
    if(desc&&desc.set) STORY[id]=L2;
    else if(byGetter) Object.defineProperty(STORY,id,{configurable:true,enumerable:true,writable:true,value:L2});
    else if(Array.isArray(old)){ old.length=0; old.push(...L2); }
    else STORY[id]=L2;
  }
  s10MailKeys();
}
// (A4S) a data scene whose id is a Pebble letter's id is that letter's text: the letter keeps its from, when, coin,
// gift and then, and its lines are the scene's (letters put in later are done on the next call: boot, a load, s10Late)
function s10MailKeys(){
  if(typeof PEBBLE_MAIL==='undefined'||!PEBBLE_MAIL) return;
  const fix=d=>{ if(!d||!d.id||d._s10||!S10.scenes[d.id]) return; const id=d.id; d._s10=true; d.lines=()=>s10Lines(S10.scenes[id],{sc:id}); };
  for(const d of PEBBLE_MAIL) fix(d);
  for(const k of Object.keys(PEBBLE_MAIL)) if(!/^\d+$/.test(k)){ const v=PEBBLE_MAIL[k]; if(v&&typeof v==='object'){ if(!v.id) v.id=k; fix(v); } }
}
// replaces: { 'STORY.a.b': sceneId } puts a data scene in place of a nested old STORY entry; { 'TALK.who.topic': null }
// (or any STORY or TALK path with null) takes the old entry out, when a data talk entry says it instead
function s10Replaces(){
  if(typeof STORY==='undefined') return;
  for(const [kind,d] of S10.raw){ const R=d&&d.replaces; if(!R||typeof R!=='object') continue;
    for(const path in R){ const key=path+'>'+R[path]; if(S10.replDone&&S10.replDone[key]) continue; (S10.replDone=S10.replDone||{})[key]=1;
      const root=/^TALK\./.test(path)&&typeof TALK!=='undefined'?TALK:STORY;
      const parts=String(path).replace(/^(STORY|TALK)\./,'').split('.'); let o=root; for(let i=0;i<parts.length-1&&o;i++) o=o[parts[i]];
      const last=parts[parts.length-1]; if(!o||!(last in o)){ s10Err(`replaces ${path}: there is no such old entry`); continue; }
      if(R[path]===null){ delete o[last]; continue; }
      // a text ([full, simple]) for an old entry that is a text (STORY.f_hints.<stage>, a TALK line): read in the mode
      // the player is in each time
      const v=R[path]; if(Array.isArray(v)&&v.length&&v.every(x=>typeof x==='string')||typeof v==='string'&&!S10.scenes[v]&&typeof o[last]==='string'){
        Object.defineProperty(o,last,{configurable:true,enumerable:true,get(){ return s10T(v); },set(x){}}); continue; }
      const beats=S10.scenes[R[path]]; if(!beats){ s10Err(`replaces ${path}: no scene ${R[path]}`); continue; }
      const lines=s10Lines(beats,{sc:R[path]}), mark={who:'narr',text:'',skipIf:()=>true,fn:()=>{ if(G&&G.story) (G.story._seen||(G.story._seen={}))[R[path]]=1; }};
      const desc=Object.getOwnPropertyDescriptor(o,last);
      if(desc&&desc.set) o[last]=[mark,...lines];
      else if(desc&&desc.get) Object.defineProperty(o,last,{configurable:true,enumerable:true,writable:true,value:[mark,...lines]});
      else if(Array.isArray(o[last])){ const old=o[last]; old.length=0; old.push(mark,...lines); } else o[last]=[mark,...lines]; } }
}
// gate places are built by the gate library (ENG-W, e10c_gates: gateBuild(place)) once everything is loaded
function s10Gates(){
  for(const id in S10.places){ const P=S10.places[id]; if(P.kind!=='gate'||P._built) continue;
    if(typeof gateBuild!=='function'){ s10Err(`gate ${id}: no gate library (gateBuild) in this build`); continue; }
    try{ gateBuild(P); P._built=true; }catch(e){ s10Err(`gate ${id}: ${e.message}`); console.error(e); } }
}
// errors(): what the engine finds wrong in the data at load (the checker does the full job)
function s10Check(){
  const has=id=>!!(s10Ent(id)||(typeof CASTBY!=='undefined'&&CASTBY[id])||(typeof SPECIAL!=='undefined'&&SPECIAL[id])||DOORS.some(d=>d.area===id)||AREADEFS[id]);
  const spk=w=>w==='narr'||w==='ash'||w==='pip'||!!SPK[w]||!!S10.npcs[w]||!!(typeof CASTBY!=='undefined'&&CASTBY[w]);
  const scanScene=(id,beats)=>{ for(const b of s10Arr(beats)){ if(Array.isArray(b)){ const l=s10Line(b); if(!spk(l.who)) s10Err(`scene ${id}: speaker ${l.who} is unknown`); for(const c of s10Arr(l.o.clue)) if(!S10.clues[c]) s10Err(`scene ${id}: clue ${c} is not defined`); if(/\u2014/.test(l.full+(l.simple||''))) s10Err(`scene ${id}: an em dash`); }
    else if(b&&typeof b==='object'){ if(b.then) scanScene(id,b.then); if(b.else) scanScene(id,b.else); for(const p of s10Arr(b.pick)) if(p&&p.say) scanScene(id,p.say); for(const k of ['cam']) if(b[k]!=null&&!has(b[k])) s10Err(`scene ${id}: ${k} ${b[k]} is not a place`);
      for(const k of ['place','walk']) if(b[k]&&b[k][1]!=null&&!Array.isArray(b[k][1])&&b[k][1]!=='player'&&b[k][1]!=='ash'&&!has(b[k][1])) s10Err(`scene ${id}: ${k} target ${b[k][1]} is not a place`); } } };
  for(const id in S10.scenes) scanScene(id,S10.scenes[id]);
  const stepCheck=(d,s,where)=>{
    const A=s._args||[];
    switch(s._kind){
      case 'talk': if(!has(A[0])) s10Err(`${where}: nobody called ${A[0]}`); break;
      case 'goto': case 'examine': case 'track': if(!has(A[0])) s10Err(`${where}: ${A[0]} is not a place`); if(s._kind==='track'&&S10.places[A[0]]&&S10.places[A[0]].kind!=='prints') s10Err(`${where}: ${A[0]} is not prints`); break;
      case 'deduce': if(!S10.deduce[A[0]]) s10Err(`${where}: no deduction ${A[0]}`); break;
      case 'cutscene': if(!S10.scenes[s.scene||A[0]]) s10Err(`${where}: no scene ${s.scene||A[0]}`); break;
      case 'give': if(!has(A[1])) s10Err(`${where}: nobody called ${A[1]}`); break;
      case 'wait_for': if(!A.length) s10Err(`${where}: wait_for needs night, day, hour N, event name or a condition`); break;
    }
    if(s.scene&&!S10.scenes[s.scene]) s10Err(`${where}: no scene ${s.scene}`);
    if(s.lose&&!S10.scenes[s.lose]) s10Err(`${where}: no scene ${s.lose}`);
    if(s.at&&!has(s.at)) s10Err(`${where}: at ${s.at} is not a place`);
    for(const e of s10Arr(s.then)) if(typeof e==='string'&&/^clue\s/.test(e)&&!S10.clues[e.split(/\s+/)[1]]) s10Err(`${where}: clue ${e.split(/\s+/)[1]} is not defined`);
  };
  for(const d of S10.chOrder.map(id=>S10.chapters[id]).concat(S10.qOrder.map(id=>S10.quests[id]))){
    for(const s of d.step||[]){ stepCheck(d,s,`${d.id}.${s._id}`); for(const p of (s.parts||[]).concat(s.extra||[])) stepCheck(d,p,`${d.id}.${p._id}`); }
    if(d.act&&!S10.acts[+d.act]) s10Err(`${d.id}: act ${d.act} has no act() file yet`);
  }
  for(const id in S10.deduce){ const D=S10.deduce[id]; for(const c of s10Arr(D.needs)) if(!S10.clues[c]) s10Err(`deduction ${id}: clue ${c} is not defined`); if(!s10Arr(D.pick).some(p=>p.right)) s10Err(`deduction ${id}: no right pick`); for(const p of s10Arr(D.pick)) if(!p.right&&!p.hint) s10Err(`deduction ${id}: wrong pick "${s10T(p.t)}" has no hint`); if(D.mystery&&!S10.mysteries[D.mystery]) s10Err(`deduction ${id}: mystery ${D.mystery} is not in an act() file`); }
  for(const id in S10.places){ const P=S10.places[id]; if(P.kind==='prints'&&!(P.path&&P.path.length>1)) s10Err(`place ${id}: prints need a path`); else if(P.kind!=='prints'&&!P.at) s10Err(`place ${id}: no at`); }
  for(const id in S10.legacy){ const L=S10.legacy[id]; if(!L.src) s10Err(`legacy ${id}: no src`); }
}

// ---------- 23. the runtime API (tests and the checker): window.__eb.story
function s10ApiState(){
  const c=S10.chapters[G.stage], s=c?s10Active(s10Run('ch',c)):null;
  return {chapter:c?c.id:null,step:s?s._id:null,stage:G.stage,clues:Object.keys((G.case&&G.case.clues)||{}),solved:Object.keys((G.case&&G.case.solved)||{}),
    done:c?Object.keys(G.story[c.id]||{}):[],tries:Object.assign({},G.case&&G.case.tries)};
}
function s10ApiEntities(){
  const out=[];
  for(const id in S10.places){ const P=S10.places[id], a=s10At(P)||{}; out.push({id,map:P.map!=null?+P.map:null,x:a.x,y:a.y,kind:P.kind,src:'story'}); }
  for(const id in S10.legacy){ const L=S10.legacy[id], a=s10At(L)||{}; out.push({id,map:L.map!=null?+L.map:null,x:a.x,y:a.y,kind:L.kind||null,src:L.src||null}); }
  for(const id in S10.npcs){ if(S10.legacy[id]||S10.places[id]) continue; const N=S10.npcs[id], a=Array.isArray(N.at)?{x:N.at[0],y:N.at[1]}:{}; out.push({id,map:N.map!=null?+N.map:null,x:a.x,y:a.y,kind:'npc',src:'story'}); }
  return out;
}
// the entities a chapter uses (steps, scenes, speakers): for tests ("every entity c_gear uses is really there")
function s10Uses(cid){
  const c=S10.chapters[cid]||S10.quests[cid]; if(!c) return [];
  const U=new Set(), add=v=>{ if(v!=null&&typeof v==='string'&&v!=='narr'&&v!=='ash'&&v!=='pip') U.add(v); };
  const step=s=>{ const A=s._args||[]; if(['talk','goto','examine','track','fight','dungeon'].includes(s._kind)) add(A[0]); if(s._kind==='give') add(A[1]); if(s._kind==='use_power_at') add(A[1]||A[0]); add(s.at); add(s.marker); for(const k of s10Arr(s.skip)) add(typeof k==='string'?k:k&&k.npc); };
  for(const s of c.step||[]){ step(s); for(const p of (s.parts||[]).concat(s.extra||[])) step(p); }
  const scan=beats=>{ for(const b of s10Arr(beats)){ if(Array.isArray(b)) add(String(b[0])); else if(b&&typeof b==='object'){ if(b.cam) add(b.cam); for(const k of ['place','walk','anim']) if(b[k]){ add(b[k][0]); if(k!=='anim'&&!Array.isArray(b[k][1])) add(b[k][1]); } if(b.then) scan(b.then); if(b.else) scan(b.else); for(const p of s10Arr(b.pick)) if(p&&p.say) scan(p.say); } } };
  for(const id in (c.scene||{})) scan(c.scene[id]);
  for(const id in (c.place||{})) U.add(id);
  for(const who in (c.talk||{})) add(who);
  return [...U];
}
const S10API={
  // (v11 talk) the said keys Ash has set, and a person's talk entries by kind (tests)
  said:()=>Object.keys((G&&G.story&&G.story.said)||{}),
  talkKinds:id=>(S10.talk[id]||[]).map(T=>s10TalkKind(T)),
  opener:id=>{ const T=s10TalkFor(id,'line'); if(!T) return null; const k=s10TalkKey(T); return {key:k,say:s10T(Array.isArray(T.say)&&Array.isArray(T.say[0])?T.say[0]:T.say),heard:s10Heard()[k]===s10Day(),re:!!T.re,v11:s10V11(id)}; },
  chapters:()=>S10.chOrder.slice().sort((a,b)=>{ const i=stageAt(a), j=stageAt(b); return (i<0?1e9:i)-(j<0?1e9:j); }).map(id=>{ const c=S10.chapters[id]; return {id,act:+c.act||null,active:G&&G.stage===id,done:!!G&&stageAt(G.stage)>stageAt(id)&&stageAt(id)>=0}; }),
  state:()=>s10ApiState(),
  entities:()=>s10ApiEntities(),
  entity:id=>s10EntityInfo(id),
  emit:name=>storyEmit(name),
  clue:id=>{ s10Clue(id); return !!(G.case&&G.case.clues[id]); },
  deduce:(id,i)=>s10Deduce(id,i),
  autoplay:(cid,o)=>s10Autoplay(cid,o||{}),
  errors:()=>S10.errs.slice(),
  // extras for tests
  uses:cid=>s10Uses(cid),
  quests:()=>S10.qOrder.map(id=>({id,active:!!(G.quests[id]&&!G.quests[id].done),done:!!(G.quests[id]&&G.quests[id].done)})),
  doable:()=>s10Runners().flatMap(R=>s10Doable(R).map(a=>({run:R.key,key:a.key,do:a.x.do,extra:!!a.extra}))),
  // (tests) what each doable step is and where it points: its kind, args, scene, and the marker spot (x, y, area, npc)
  targets:()=>s10Runners().flatMap(R=>s10Doable(R).map(a=>{ let w=null; try{ w=s10StepWhere(a); }catch(e){} const x=a.x;
    return {run:R.key,key:a.key,kind:x._kind,args:x._args.slice(),extra:!!a.extra,optional:!!a.s.optional,part:!!a.part,scene:x.scene||null,kneel:x.kneel||null,legacy:!!x.legacy,
      at:x.at||null,skip:s10Arr(x.skip).map(v=>typeof v==='string'?v:v&&v.npc),pend:!!S10.pend[R.key+'/'+a.key],
      x:w?Math.round(w.x):null,y:w?Math.round(w.y):null,area:w&&w.area||null,npc:w&&w.npc||null}; })),
  where:id=>{ const w=s10Where(id); return w?{x:Math.round(w.x),y:Math.round(w.y),area:w.area||null,npc:w.npc||null}:null; },
  objective:()=>{ const c=S10.chapters[G.stage]; return c?s10Objs(c):[]; },
  place:id=>{ const P=S10.places[id]; return P?Object.assign({},P,{_owner:undefined}):null; },
  act:id=>s10PlaceAct(id),
  scene:(id,cb)=>s10Play(id,cb),
  // (tests) run effects as a step's then would: 'shrine x', ['set a', 'clue b']; offer a quest as old code does
  do:e=>s10Do(e,{}),
  offer:id=>offerQuest(id),
  world:(id,st)=>{ if(st!=null) s10WorldSet(id,st); return s10World(id); },
  talkLine:id=>{ const T=s10TalkFor(id,'line'); return T?{say:T.say?s10T(Array.isArray(T.say)&&Array.isArray(T.say[0])?T.say[0].slice(1):T.say):null,scene:T.scene||null}:null; },
  track:id=>G.story&&G.story._trk?G.story._trk[id]:undefined,
  mysteries:()=>Object.assign({},S10.mysteries),
  // a running minigame won through its own win hook (the rooftop chase: x1_story's c1RWin)
  miniWin:k=>{ if(!G.mini||(k&&G.mini.kind!==k)) return false; const M=MINI_S10[G.mini.kind]; if(M&&M.win) M.win(); else miniEnd(true); return true; },
  ending:n=>s10Ending(n==null?actOf(G.stage):n),
  reach:(from,to,powers)=>null,
  do:list=>{ s10Do(list,{}); return true; },
  // the text lines of an old STORY entry by path ('c_whirl_wait', 'bosses.grizzlefang.outro'): tests of the replacing rules
  storyText:path=>{ let o=typeof STORY!=='undefined'?STORY:null; for(const k of String(path).replace(/^STORY\./,'').split('.')){ if(!o) break; o=o[k]; } if(typeof o==='function') try{ o=o(); }catch(e){ o=null; } return Array.isArray(o)?o.map(l=>Array.isArray(l)?String(l[1]):l&&l.text?String(typeof l.text==='function'?'':l.text):'').filter(Boolean):null; },
  cond:c=>s10Cond(c),
  adapters:()=>(S10.adapted||[]).concat(typeof c1RWin==='function'&&c1RWin._s10?['c1RWin']:[]),
  get S10(){ return S10; }
};
window.__ebX=Object.assign(window.__ebX||{},{story:S10API});

// ---------- 24. autoplay(chapterId): drives a chapter's steps by teleport and action (tests, the checker's rule 17)
const s10Frames=n=>new Promise(r=>{ let k=0; const f=()=>{ if(++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
const s10Sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function s10AutoTp(w){
  if(!w) return false;
  if(w.area){ if(!AREA||AREA.id!==w.area){ if(AREA) exitArea(); const d=s10DoorFor(w.area); enterArea(w.area,d||{x:player.x,y:player.y}); await s10Frames(4); }
    const n=w.npc&&AREA&&AREA.npcs.find(q=>q.id===w.npc); if(n){ player.x=n.x; player.y=n.y+34; } return true; }
  if(AREA) { exitArea(); await s10Frames(3); }
  player.x=w.x; player.y=w.y+(w.npc?34:24); player.z=0; updateCam(0,true); G.chunkBurst=16; await s10Frames(3); return true;
}
async function s10AutoDlg(limit){
  const t0=performance.now();
  while(performance.now()-t0<(limit||20000)){
    if(DLG){ if(DLG.opts){ DLG.chars=1e9; const o=DLG.opts; let i=o.findIndex(q=>q.tone==='kind'); if(i<0) i=o.findIndex(q=>q.tone!=='locked'); chooseOpt(Math.max(0,i)); } else skipDialogue(); await s10Frames(1); continue; }
    if(scene==='upgrade'){ try{ chooseUpgrade(0); }catch(e){} await s10Frames(1); continue; }
    // (A4b) the act's end card: "Continue the story" (or, at the very end, "Keep exploring")
    if(scene==='victory'){ const nx=document.getElementById('bWinNext'), ex=document.getElementById('bWinExplore'), b=nx&&!nx.hidden?nx:ex; if(b) b.click(); await s10Frames(4); continue; }
    if(scene!=='play'){ await s10Frames(2); continue; }
    await s10Frames(2); if(!DLG&&scene==='play') return true;
  }
  return false;
}
async function s10AutoDo(a,log){
  const x=a.x, A=x._args, K=x._kind;
  log.push(`do ${a.R.key}.${a.key}: ${x.do}`);
  switch(K){
    case 'goto': await s10AutoTp(s10Where(A[0])); break;
    case 'talk': case 'give': { const who=K==='talk'?A[0]:A[1]; if(K==='give'&&!(G.items[A[0]]>0)) giveItems({[A[0]]:1},true); const w=s10Where(who); await s10AutoTp(w);
      const n=(AREA?AREA.npcs:G.npcs).find(q=>q.id===who); if(n) talkTo(n); else { log.push('  no '+who+' here'); s10Finish(a); } break; }
    case 'examine': { const w=s10Where(A[0]); await s10AutoTp(w); if(S10.places[A[0]]) s10PlaceAct(A[0]); else { const e=S10.legacy[A[0]], m=e&&/^LANDMARKS:(.+)$/.exec(e.src||''), o=m&&LANDMARKS.find(q=>q.id===m[1]); if(o) lmAct(o); else s10Examined(A[0]); } break; }
    case 'track': { const P=S10.places[A[0]]; if(P&&P.show!=null&&!s10Cond(P.show)) log.push('  prints not shown: '+P.show); for(const pt of (P&&P.path)||[]){ await s10AutoTp({x:+pt[0],y:+pt[1]-24}); player.x=+pt[0]; player.y=+pt[1]; await s10Frames(3); } break; }
    case 'deduce': { const D=S10.deduce[A[0]]; if(D){ for(const c of s10Arr(D.needs)) if(!G.case.clues[c]){ log.push('  missing clue '+c); } const i=s10Arr(D.pick).findIndex(p=>p.right); const r=s10Deduce(A[0],i); log.push('  deduce '+JSON.stringify(r)); } break; }
    case 'wait_for': { const w=A[0]; if(x.at) await s10AutoTp(s10Where(x.at)); if(w==='night') G.tod=0.875; else if(w==='day') G.tod=0.35; else if(w==='hour') G.tod=(+String(A[1]).split('-')[0]+0.2)/24; else if(w==='event') storyEmit(A[1]);
      // (N5A c) a condition of flags: autoplay sets them, as it emits the event of wait_for event
      else { const tk=A.slice(); for(let i=0;i<tk.length;i++){ if(tk[i]!=='flag'||!tk[i+1]) continue; const m=/^([\w]+)(?:(>=|=)(.+))?$/.exec(tk[++i]); if(m) G.flags[m[1]]=m[3]!=null?s10Num(m[3]):1; } }
      break; }
    case 'cutscene': break;
    case 'minigame': { const M=MINI_S10[A[0]]||{}; if(x.at) await s10AutoTp(s10Where(x.at)); if(M.night&&!isNight()) G.tod=0.875;
      const t0=performance.now(); while(!G.mini&&performance.now()-t0<15000){ await s10AutoDlg(4000); await s10Frames(2); }
      if(G.mini&&G.mini.kind===A[0]){ log.push('  minigame started, win hook'); if(M.win) M.win(); else miniEnd(true); await s10Frames(4); } else log.push('  minigame did not start'); break; }
    case 'fight': G.bossDone[A[0]]=true; storyEmit('boss_done:'+A[0]); break;
    case 'dungeon': G.flags['trial_'+A[0]+'_done']=true; storyEmit('dungeon_done:'+A[0]); break;
    case 'use_power_at': { const p=A[1]?A[0]:null, gid=A[1]||A[0]; if(p&&!s10HasPower(p)) grantAbility(p); s10Gate(gid,true); break; }
    case 'find': if(x.at) await s10AutoTp(s10Where(x.at)); if(!(G.items[A[0]]>0)) giveItems({[A[0]]:1},true); break;
    case 'choose': G.choices[A[0]]=G.choices[A[0]]||'auto'; break;
  }
  await s10AutoDlg(20000);
}
async function s10Autoplay(cid,o){
  const log=[], c=S10.chapters[cid]||S10.quests[cid];
  if(!c) return {ok:false,log:['no chapter '+cid],failAt:null};
  const isQ=!!S10.quests[cid]&&!S10.chapters[cid];
  S10.auto={log}; const god=window.__eb&&window.__eb.god; if(window.__eb) window.__eb.god=true;
  try{
    if(!isQ&&G.stage!==cid){ goStage(cid,{card:false,quiet:true}); await s10Frames(4); }
    if(isQ&&!G.quests[cid]) s10QuestStart(cid);
    await s10AutoDlg(8000);
    const R=s10Run(isQ?'q':'ch',c); let guard=0, last=null, same=0;
    while(guard++<200){
      if(isQ?(G.quests[cid]&&G.quests[cid].done):G.stage!==cid){ log.push('chapter over: stage '+G.stage); return {ok:true,log,failAt:null}; }
      const s=s10Active(R); if(!s){ log.push('no step left'); return {ok:true,log,failAt:null}; }
      const as=s10Doable(R).filter(a=>a.s===s&&!a.extra);
      const key=s._id+':'+as.map(a=>a.key).join(','); if(key===last){ if(++same>4){ log.push('stuck at '+s._id); return {ok:false,log,failAt:s._id}; } } else { last=key; same=0; }
      for(const a of as){ await s10AutoDo(a,log); }
      // the extras too (optional clues), once each, on the way
      for(const a of s10Doable(R).filter(a=>a.extra)){ await s10AutoDo(a,log); }
      for(let k=0;k<40&&s10Active(R)===s;k++){ await s10Frames(2); await s10AutoDlg(3000); }
    }
    return {ok:false,log,failAt:'guard'};
  } catch(e){ log.push('error '+e.message); return {ok:false,log,failAt:(s10Active(s10Run(isQ?'q':'ch',c))||{})._id||null}; }
  finally { S10.auto=null; if(window.__eb) window.__eb.god=god; }
}
