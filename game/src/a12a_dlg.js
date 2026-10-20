// ================= overlays
function show(id){
  for(const o of document.querySelectorAll('.ov')){ if(o.id==='card') continue; o.classList.toggle('on',o.id===id); }
  const el=id&&document.getElementById(id);
  if(el&&!usingTouch){ const f=el.querySelector('[data-focus]')||el.querySelector('.dlg')||el.querySelector('button:not([hidden])'); if(f) setTimeout(()=>{ try{ f.focus({preventScroll:true}); }catch(e){} },30); }
}
function hideAll(){ show(null); if(document.activeElement&&document.activeElement.blur) document.activeElement.blur(); }
let cardTimer=null;
function showCard(num,name){
  try{ jingle('chapter',null); }catch(e){}
  const c=$('#card'); $('#cardNum').textContent=num; $('#cardName').textContent=name;
  c.classList.remove('on'); void c.offsetWidth; c.classList.add('on');
  clearTimeout(cardTimer); cardTimer=setTimeout(()=>c.classList.remove('on'),2850);
  logAdd({k:'banner',text:`${num}: ${name}`,sub:'',key:'card:'+num+name});
}

// ================= dialogue
let DLG=null;
function runDialogue(lines,done,opt){
  scene='dialogue'; SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null;
  const cp=l=>Array.isArray(l)?l:Object.assign({},l); DLG={lines:lines.map(cp),i:0,chars:0,shown:-1,done,mood:opt&&opt.mood||null,fullAt:0,lockT:0,optsAt:0,skipArm:0,pWho:null,pFace:null,pAnim:null};
  pcacheReset();
  $('#dlgNext').textContent=usingTouch||PAD.dev==='touch'||coarsePtr()?'Tap ▸':'Click or Space ▸';
  logAdd({k:'sep'}); dlgSkipLabel();
  try{ Music.duck(true); }catch(e){}
  show('dialogue'); setLine();
}
// an old-code line is [who, text, opts] or { who, text, opts, ... }; (v11 MOOD) a face mood rides along as a string:
// [who, text, 'sad'], [who, text, opts, 'sad'] or { who, text, face: 'sad' } (the line's `mood` field is the music's)
function lineParts(l){ if(!Array.isArray(l)) return l; const o2=typeof l[2]==='string'&&!!moodName(l[2]); return {who:l[0],text:l[1],opts:o2?undefined:l[2],face:o2?l[2]:l[3]}; }
function endDialogue(){ const d=DLG&&DLG.done; DLG=null; hideAll(); try{ Music.duck(false); }catch(e){} if(d) d();
  // (v11) a talk that ends with foes close (a boss's opening words with his guards already swinging) gives Ash a moment
  // to get his hands back on the keys before the first hit can land (he blinks while it lasts)
  try{ if(G&&player&&!player.dead&&(G.inCombat||(G.boss&&!G.boss.dead)||foeNear(160))) player.iframes=Math.max(player.iframes,0.9); }catch(e){} }
function setLine(){
  const L=lineParts(DLG.lines[DLG.i]), who=typeof L.who==='function'?L.who():L.who, s=SPK[who]||{name:personName(who),col:'#d8c3a0'};
  if(L.fn&&!L._ran){ L._ran=true; L.fn(); if(!DLG) return; }
  if(L.mood) DLG.mood=L.mood;
  DLG.text=simplify(String(typeof L.text==='function'?L.text():L.text));
  if(L.skipIf&&L.skipIf()){ DLG.i++; if(DLG.i>=DLG.lines.length) endDialogue(); else setLine(); return; }
  $('#dlgWho').textContent=s.name; $('#dlgWho').style.color=s.col;
  logAdd({k:who==='narr'?'narr':'line',who:s.name,col:s.col,text:DLG.text});
  DLG.fullAt=0; DLG.optsAt=0;
  $('#dlgBox').classList.toggle('narr',who==='narr');
  portraitLine(who,L); DLG.chars=0; DLG.shown=-1; $('#dlgSay').textContent='';
  const box=$('#dlgOpts'); box.innerHTML=''; DLG.opts=null; box.hidden=true; $('#dlgNext').hidden=false;
  if(L.opts){ let o=typeof L.opts==='function'?L.opts():L.opts; o=o.filter(q=>q&&(!q.cond||q.cond())); if(o.length) DLG.opts=o; DLG.hub=L; }
}
// (v11) an answer's tone (kind, brave, silly) is hidden metadata for friendship points: no colored numbers unless
// DLG_TONES is turned on. A locked option is always shown greyed (t-locked), with its reason when picked.
let DLG_TONES=false;
function showOpts(){
  const box=$('#dlgOpts'); if(!DLG||!DLG.opts||box.childElementCount) return;
  DLG.opts.forEach((o,i)=>{ const b=document.createElement('button'); b.type='button'; b.className='opt'+(o.key&&G&&G.seenTalk&&G.seenTalk[o.key]?' seen':'')+(o.tone&&(o.tone==='locked'||DLG_TONES)?' t-'+o.tone:''); b.innerHTML=`<span class="k">${i+1}</span>${escapeHtml(simplify(typeof o.t==='function'?o.t():o.t))}${o.tag?`<span class="tag">${escapeHtml(o.tag)}</span>`:''}`; b.addEventListener('click',e=>{ e.stopPropagation(); dlgChoose(i); }); box.appendChild(b); });
  box.hidden=false; $('#dlgNext').hidden=true; DLG.optsAt=performance.now();
  if(!usingTouch) setTimeout(()=>{ const f=box.querySelector('button'); if(f) try{ f.focus({preventScroll:true}); }catch(e){} },30);
}
function chooseOpt(i){
  if(!DLG||!DLG.opts||!DLG.opts[i]) return;
  const o=DLG.opts[i], hub=DLG.hub; DLG.opts=null; SFX.play('ui');
  logAdd({k:'choice',who:'You',col:SPK.ash.col,text:String(typeof o.t==='function'?o.t():o.t)});
  if(o.key&&G){ G.seenTalk=G.seenTalk||{}; G.seenTalk[o.key]=1; }
  const cur=DLG; if(o.fn) o.fn();
  if(!DLG||DLG!==cur) return;
  let then=typeof o.then==='function'?o.then():o.then; then=(then||[]).map(l=>Array.isArray(l)?l:Object.assign({},l));
  if(o.back&&hub){ const H=Object.assign({},lineParts(hub),{_ran:true}); if(H.again) H.text=H.again; then.push(H); }
  const rest=o.end?[]:DLG.lines.slice(DLG.i+1);
  DLG.lines=DLG.lines.slice(0,DLG.i+1).concat(then,rest);
  DLG.i++;
  if(DLG.i>=DLG.lines.length) endDialogue(); else setLine();
}
function updateDialogue(dt){
  if(!DLG) return;
  if(DLG.pAnim) portraitAnim();
  const text=DLG.text||'';
  if(DLG.opts&&DLG.chars>=text.length) showOpts();
  DLG.chars=Math.min(text.length,DLG.chars+dt*DLG_CPS);
  if(DLG.chars>=text.length&&!DLG.fullAt) DLG.fullAt=performance.now();
  const n=Math.floor(DLG.chars); if(n!==DLG.shown){ DLG.shown=n; $('#dlgSay').textContent=text.slice(0,n); }
}
// __eb.advanceDialogue (tests) and the old callers: finish the typing, else go on at once
function advanceDialogue(){
  if(!DLG) return;
  const text=DLG.text||'';
  if(DLG.chars<text.length){ DLG.chars=text.length; DLG.fullAt=performance.now(); return; }
  if(DLG.opts) return;
  SFX.play('ui'); DLG.i++;
  if(DLG.i>=DLG.lines.length) endDialogue();
  else setLine();
}
function skipDialogue(){
  if(!DLG) return;
  DLG.skipArm=0; dlgSkipLabel();
  // skipping fast-forwards to the next choice, so you never skip a decision by accident
  if(DLG.opts){ DLG.chars=1e9; return; }
  for(let i=DLG.i+1;i<DLG.lines.length;i++){ const L=lineParts(DLG.lines[i]); if(L.fn&&!L._ran){ L._ran=true; L.fn(); if(!DLG) return; } if(L.opts){ DLG.i=i; setLine(); if(DLG) DLG.chars=1e9; return; } dlgLogSkipped(L); }
  endDialogue();
}
// lines a skip jumps over still go in the log, so they can be read later
function dlgLogSkipped(L){
  try{ if(L.skipIf&&L.skipIf()) return; const who=typeof L.who==='function'?L.who():L.who, s=SPK[who]||{name:personName(who),col:'#d8c3a0'};
    logAdd({k:who==='narr'?'narr':'line',who:s.name,col:s.col,text:String(typeof L.text==='function'?L.text():L.text),sk:true}); }catch(e){}
}
// ---------- dialogue input from people (clicks, taps, keys, controller): nothing gets skipped by accident (UX build)
// A click first finishes the typing. The next one goes on only once the whole line has been up for 0.4 s, and a
// double click never moves more than one line. Choices wait 0.35 s after they appear. Escape (and the controller's
// back button, and the Skip button) asks once before it skips the conversation.
// (v11) a desktop click that finishes the typing and then goes on felt dead for most of a second: the wait after a full
// line is now 0.28 s (still longer than a double click) and the text types a little faster (75 letters a second)
const DLG_FULL=280, DLG_LOCK=200, DLG_OPTS=300, DLG_CPS=75;
function dlgNext(){
  if(!DLG) return;
  const now=performance.now(), text=DLG.text||'';
  if(now<DLG.lockT) return;
  if(DLG.chars<text.length){ DLG.chars=text.length; DLG.fullAt=now; return; }
  if(DLG.opts) return;
  if(now-(DLG.fullAt||now)<DLG_FULL) return;
  DLG.lockT=now+DLG_LOCK; advanceDialogue();
}
function dlgChoose(i){
  if(!DLG||!DLG.opts) return;
  const text=DLG.text||'';
  if(DLG.chars<text.length||!DLG.optsAt){ DLG.chars=text.length; DLG.fullAt=performance.now(); return; }
  if(performance.now()-DLG.optsAt<DLG_OPTS) return;
  chooseOpt(i);
}
function dlgAskSkip(src){
  if(!DLG) return;
  // at a choice there is nothing to skip (a skip never makes a decision): just show the choices
  if(DLG.opts){ skipDialogue(); return; }
  const now=performance.now(); DLG.skipKey=src||'key';
  if(DLG.skipArm&&now-DLG.skipArm<3500){ skipDialogue(); return; }
  DLG.skipArm=now; dlgSkipLabel(); SFX.play('ui',0.5);
  const d=DLG; setTimeout(()=>{ if(DLG===d&&d.skipArm&&performance.now()-d.skipArm>=3400){ d.skipArm=0; dlgSkipLabel(); } },3500);
}
// the Skip button says what to do while a skip is waiting for the second press
function dlgSkipLabel(){
  const sk=$('#dlgSkip'); if(!sk) return;
  const dev=curDevice(), arm=!!(DLG&&DLG.skipArm);
  sk.classList.toggle('arm',arm);
  if(arm){ const again=dev==='pad'?`Press ${padChip(padOkBtn()===PB.S?PB.E:PB.S)} again`:usingTouch||PAD.dev==='touch'||coarsePtr()?'Tap again':(DLG.skipKey==='key'?'Press Esc again':'Click again'); sk.innerHTML=`Skip this conversation? <b>${again}</b>`; }
  else if(dev==='pad') sk.innerHTML=`Skip scene ${padChip(padOkBtn()===PB.S?PB.E:PB.S)}`;
  else sk.innerHTML='Skip scene &#9197;';
}
$('#dialogue').addEventListener('click',()=>{ SFX.init(); dlgNext(); });
$('#dlgSkip').addEventListener('click',e=>{ e.stopPropagation(); dlgAskSkip('click'); });
// (v11) a talk menu can have more than four options now (replies, topics, More, Goodbye): the number keys 5 to 9 pick
// them too (1 to 4 are a5_input's)
addEventListener('keydown',e=>{ if(scene!=='dialogue'||!DLG||!DLG.opts) return; const m=/^(?:Digit|Numpad)([5-9])$/.exec(e.code||''); if(!m) return;
  e.preventDefault(); if(!e.repeat) dlgChoose(+m[1]-1); });
// test hooks: the whole line being typed, whether options are up, and finish the typing now
window.__ebDbg=Object.assign(window.__ebDbg||{},{dlgText:()=>DLG?String(DLG.text||''):'',dlgHasOpts:()=>!!(DLG&&DLG.opts),
  dlgFinish:()=>{ if(DLG){ DLG.chars=(DLG.text||'').length; DLG.fullAt=performance.now()-1000; } },tones:v=>{ if(v!=null) DLG_TONES=!!v; return DLG_TONES; }});

// ================= portrait moods (v11 MOOD): the face shows what the line feels
// A line can carry a mood: data lines [who, full, simple, { mood: 'sad' }], old-code lines [who, text, 'sad'] or
// { who, text, face: 'sad' }, a scene's choose block { mood }. A line without one gets a mood from its own words
// (moodRead, a small careful reader that falls back to neutral), or from MOOD_SHEET (old-code peaks, by their words).
// The face functions read PX, the expression being drawn: eyes (open, lids, pupils, look), brows, mouth, ears or
// horns or antennae, and the small things (blush, a tear, a sweat drop, an anger mark, zz, frost, a glint).
// (v12 FACES) seven more for the bosses and creatures (every face draws them): hurt (a blow lands), ashamed (caught,
// sorry for it), proud (chin up), peaceful (eyes closed, at rest), smug (the goat), furious (a boss's rage) and
// defeated (beaten, dizzy). tools/check.mjs MOODS lists the same words.
const MOOD_LIST=['neutral','happy','laughing','sad','worried','scared','angry','surprised','determined','sleepy','sly','cold','shy','tender',
  'hurt','ashamed','proud','peaceful','smug','furious','defeated'];
const MOOD_ALIAS={laugh:'laughing',giggle:'laughing',glad:'happy',joy:'happy',smile:'happy',pleased:'happy',mad:'angry',cross:'angry',
  afraid:'scared',fear:'scared',frightened:'scared',shocked:'surprised',shock:'surprised',amazed:'surprised',tired:'sleepy',sleep:'sleepy',
  brave:'determined',firm:'determined',resolute:'determined',soft:'tender',warm:'tender',gentle:'tender',loving:'tender',sorry:'sad',cry:'sad',crying:'sad',
  upset:'sad',nervous:'worried',anxious:'worried',uneasy:'worried',embarrassed:'shy',bashful:'shy',sneaky:'sly',icy:'cold',blank:'cold',
  pain:'hurt',ouch:'hurt',shame:'ashamed',guilty:'ashamed',peace:'peaceful',calm:'peaceful',serene:'peaceful',rage:'furious',enraged:'furious',
  beaten:'defeated',defeat:'defeated',dizzy:'defeated',dazed:'defeated'};
// br: brows' inner ends up (+) or down (-); bh: brows raised; eo: eyes open (0 shut, 1 normal, 1.3 wide); ec: how shut
// eyes look ('arc' a happy curve, else a lid line); ls: lid slant (+ inner corner lower, cross; - outer lower, sad);
// pu: pupil size; lx, ly: where the eyes look; m: mouth; ear: ears, fins or antennae up (+) or down (-)
const MOOD_SPEC={
  neutral:{},
  happy:{br:-0.1,bh:1,eo:0.9,m:'smile',blush:0.6,ear:0.4,lift:0.02},
  laughing:{bh:2.5,eo:0,ec:'arc',m:'laugh',blush:1,ear:1,tilt:-0.06,lift:0.03},
  sad:{br:1,eo:0.8,ls:-0.55,ly:0.9,m:'frown',tear:1,ear:-1,tilt:0.04,sink:0.04},
  worried:{br:0.9,bh:1,eo:1.06,ls:-0.25,m:'wobble',sweat:1,ear:-0.5,small:0.025},
  scared:{br:1,bh:3.2,eo:1.32,pu:0.55,m:'scream',sweat:2,gloom:1,ear:-1,small:0.06,tilt:0.03},
  angry:{br:-1.15,eo:0.88,ls:1,m:'teeth',vein:1,ear:-0.4,near:0.035},
  surprised:{bh:4.2,eo:1.34,pu:0.72,m:'o',ear:1,lift:0.05},
  determined:{br:-0.7,eo:0.94,ls:0.55,m:'set',glint:1,ear:0.6,near:0.025},
  sleepy:{br:0.25,bh:-1,eo:0,m:'small',zz:1,ear:-0.6,tilt:0.08,sink:0.03},
  sly:{asym:1,eo:0.62,ls:0.15,lx:1,m:'smirk',ear:0.2,tilt:0.04},
  cold:{bh:-0.5,eo:1,blank:1,m:'flat',frost:1},
  shy:{br:0.55,eo:0.9,lx:-1,ly:0.8,m:'tiny',blush:1.6,ear:-0.3,tilt:0.06,sink:0.02},
  tender:{br:0.3,eo:0,ec:'arc',m:'smile',blush:0.7,tilt:0.05},
  // wince: one eye squeezed shut; ow: little pain marks; daze: stars going round; aura: a glow behind the head (rgb);
  // the pose a creature face takes (pxPose): tilt (radians), sink or lift (squash or stretch from the bottom), near
  // (leans in), small (shrinks back)
  hurt:{br:1.1,bh:0.6,eo:0.92,ls:-0.2,wince:1,m:'teeth',sweat:1,ow:1,ear:-0.7,tilt:-0.07,sink:0.03},
  ashamed:{br:0.9,eo:0.6,ls:-0.45,lx:-0.85,ly:1,m:'frown',blush:1.2,gloom:0.6,ear:-1,tilt:0.08,sink:0.07},
  proud:{br:-0.2,bh:1.8,eo:0.5,ls:-0.15,m:'smile',glint:1,ear:0.9,tilt:-0.05,lift:0.045},
  peaceful:{br:0.25,bh:0.6,eo:0,m:'tiny',ear:0.15,aura:'255,226,160'},
  smug:{asym:1,eo:0.45,ls:-0.1,lx:-0.75,m:'smirk',ear:0.35,tilt:-0.06,lift:0.03},
  furious:{br:-1.45,eo:1.12,ls:1.25,pu:0.42,m:'roar',vein:2,ear:-0.9,near:0.06,aura:'255,70,40'},
  defeated:{br:0.95,bh:-0.4,eo:0.4,ls:-0.6,ly:1,m:'wobble',sweat:1,daze:1,ear:-1,tilt:0.1,sink:0.09}
};
for(const k in MOOD_SPEC) MOOD_SPEC[k].n=k;
let PX=MOOD_SPEC.neutral;
function moodName(m){ if(m==null||m==='') return null; m=String(m).toLowerCase().trim(); m=MOOD_ALIAS[m]||m; return MOOD_SPEC[m]?m:null; }
function moodSpec(m,blink){ const s=MOOD_SPEC[moodName(m)||'neutral']; return blink?Object.assign({},s,{blink:true}):s; }
// is the expression being drawn more than neutral (faces that show no brows or mouth at rest show them then)
const pxBusy=()=>PX.n!=='neutral'||!!PX.blink;

// ---------- the reader: a mood from the line's own words. Careful on purpose: a wrong face is worse than a plain one.
// A stage direction in brackets at the start ("(laughing)", "(very softly)") is the writer's own word and wins.
const MR={
  dirLaugh:/\b(laugh|giggl|chuckl|snort|cackl|guffaw)/, dirSad:/\b(sob|crying|cries|tearful|in tears|sniff|sigh|sadly|sorrow)/,
  dirSleep:/\b(yawn|sleepy|drowsy|half asleep|half-asleep|mumbl|snor)/, dirAngry:/\b(angr|furious|snarl|growl|seeth|through (his|her|their) teeth)/,
  dirScared:/\b(scared|terrified|trembl|shaking|shiver|frightened|whimper)/, dirHappy:/\b(grin|smil|beam|delight|cheer)/,
  dirShy:/\b(blush|shy|embarrass|sheepish)/, dirSly:/\b(sly|smirk|wink)/, dirWorry:/\b(nervous|worried|anxious|uneasy|hesitant)/,
  dirSoft:/\b(softly|gently|quietly|very softly|tenderly|warmly)/, dirSurprise:/\b(gasp|startled|surprised|amazed)/,
  laugh:/(^|[\s"(])(ha(ha)+|hah(ah)+|heh(eh)+|hee(hee)+|hehe|ahaha|hoho(ho)*|bwaha\w*|pfft|snrk)\b/i,
  sleep:/\b(yawn\w*|y+a+a+w+n+|zzz+|so sleepy|so tired|i'?m sleepy|i'?m tired|i'?m so tired|need a nap)\b/i,
  angry:/\b(how dare|you lied|liar|thief!|get out|leave (me|him|her|us|them) alone|stop it|never forgive|i hate|furious|enough!|you monster|give (it|that|them|her|him|my \w+) back|put (it|that|him|her) down|that'?s not fair|not fair|cheat(er|ing)?!)\b/i,
  scaredHard:/\b(help( me| us)?!|run!|aa+h+|eek|yikes|look out|watch out|it'?s coming|they'?re coming)\b/i,
  fear:/\b(scared|afraid|terrified|frightened|danger|dangerous)\b/i,
  worry:/\b(careful|be careful|what if|i hope (he|she|you|they)('?s|'?re| is| are) (ok|okay|all right|alright|safe)|are you (ok|okay|alright|all right|hurt)|uh[- ]oh|oh no|is it safe|i don'?t like (this|it)|something'?s wrong|i'?m (so |a bit |a little |very )?(worried|nervous))\b/i,
  sad:/\b(i'?m (so |very |really )?sorry|i miss|miss (him|her|you|them)|lonely|all alone|so alone|i'?m alone|gone forever|never came back|funeral|i wish i|heartbroken|broke my heart|nobody came|forgot (me|her|him))\b/i,
  surpriseStart:/^(oh!|oh,? my|whoa|woah|wow|what\?!|what!|huh\?!|wait,? what|really\?!|no way|you'?re kidding|goodness!|gosh!|my word|great gears|blimey)/i,
  happy:/\b(thank you|thanks|yay|hooray|hurrah|huzzah|wonderful|brilliant|lovely|marvell?ous|fantastic|amazing|perfect|splendid|adorable|we did it|you did it|well done|good job|i love|love it|so happy|i'?m glad|so glad|welcome|congratulations|beautiful|delicious|best (day|thing))\b/i,
  greet:/^(hello|hi|good morning|good evening|morning|evening|welcome|there you are|there he is|there'?s my)\b/i,
  determined:/\b(i'?ll do it|i will do it|i won'?t let|i won'?t give up|i won'?t hand|let'?s go|let'?s do (this|it)|we can do this|i can do this|i'?m ready|i'?m coming (for|to get)|not until|watch me|leave it to me|count on me|i'?ll find (her|him|it|them|you)|i'?ll stop (her|him|it|them)|i'?ll save|i'?ll get it back|stand back|we'?ll see about that)\b/i,
  tender:/(\b(little one|sweetheart|my dear|my darling|love you|i'?m proud of you|proud of you|you'?re safe|you did well|good night|goodnight|sleep well)\b|(^|[.!?]\s+)(it'?s all right|it'?s okay)\b|\blet'?s go home\b)/i,
  shy:/^(um+|uh+m*|erm+|er+)\b/i,
  sly:/\b(our little secret|don'?t tell|wouldn'?t you like to know|maybe i did|maybe i didn'?t|guess who|finders keepers|not telling)\b/i,
  happyBang:/(^ha!|\b(ahoy|bravo|bravissimo|whe+e+|yippee|woo+|hurray|ooh|lucky|magnificent|splendid|adorable|i like (you|it|that)|good (lad|boy|girl|dragon|job|work|news|show)|my favou?rite|happy lantern day|fair winds|come again|free (soup|cocoa|tea|buns?)|you'?re back|it'?s you|the best)\b)/i,
  worryBang:/\b(hurry|quick|quickly|get it out|look out|watch out|find out why|somebody (help|stop|find|catch)|don'?t let (it|him|her|them)|oh dear|dear me|goodness me|not fine|keeps crying|i'?m hiding|still here! hiding)\b/i,
  angryBang:/\b(unhand|nobody (puts|touches|takes|steals)|scamp|villain|scoundrel|rascal|how could you|what have you done|get off (it|me|my \w+)|you'?ll pay|grr+|h+r+m+p+h+|harrumph)\b/i,
  neg:/\b(not|n'?t|never|no|nothing|nobody)\s+(\w+\s+)?$/i
};
// a hit only counts when it isn't just after a "not" ("I'm not scared")
function mrHit(re,t){ const m=re.exec(t); if(!m) return false; const before=t.slice(Math.max(0,m.index-18),m.index); return !MR.neg.test(before); }
function moodRead(who,text){
  const raw=String(text||'').trim(); if(!raw||who==='narr') return 'neutral';
  const dm=/^\(([^)]{1,60})\)\s*/.exec(raw), dir=dm?dm[1].toLowerCase():'', t=dm?raw.slice(dm[0].length):raw;
  if(dir){
    if(MR.dirLaugh.test(dir)) return 'laughing'; if(MR.dirSleep.test(dir)) return 'sleepy'; if(MR.dirSad.test(dir)) return 'sad';
    if(MR.dirAngry.test(dir)) return 'angry'; if(MR.dirScared.test(dir)) return 'scared'; if(MR.dirShy.test(dir)) return 'shy';
    if(MR.dirSly.test(dir)) return 'sly'; if(MR.dirWorry.test(dir)) return 'worried'; if(MR.dirSurprise.test(dir)) return 'surprised';
    if(MR.dirHappy.test(dir)) return 'happy';
    if(MR.dirSoft.test(dir)) return mrHit(MR.sad,t)||/\blonely\b/i.test(t)?'sad':/\b(sorry|um|uh)\b/i.test(t)?'shy':'tender';
  }
  const bang=/!/.test(t), q=/\?/.test(t), short=t.split(/\s+/).length<=14;
  if(mrHit(MR.laugh,t)) return 'laughing';
  if(mrHit(MR.sleep,t)) return 'sleepy';
  if(bang&&(mrHit(MR.angry,t)||mrHit(MR.angryBang,t))) return 'angry';
  if(bang&&mrHit(MR.scaredHard,t)) return 'scared';
  if(/\?!|!\?/.test(t)&&short) return 'surprised';
  if(MR.surpriseStart.test(t)) return 'surprised';
  if(bang&&mrHit(MR.worryBang,t)) return 'worried';
  const happy=mrHit(MR.happy,t)||(bang&&mrHit(MR.happyBang,t));
  if(/\blet'?s go home\b/i.test(t)&&!bang) return 'tender';
  if(mrHit(MR.sad,t)&&!bang) return 'sad';
  if(mrHit(MR.worry,t)&&!happy) return 'worried';
  if(happy&&bang) return 'happy';
  if(q&&mrHit(MR.fear,t)) return 'worried';
  if(mrHit(MR.determined,t)) return 'determined';
  if(mrHit(MR.sly,t)) return 'sly';
  if(mrHit(MR.tender,t)&&!bang) return 'tender';
  if(happy&&/\b(thank you|thanks|welcome|i'?m glad|so glad|i love)\b/i.test(t)) return 'happy';
  if(bang&&MR.greet.test(t)) return 'happy';
  // excited: a shout with a question ("Vesper! How did you get up here?"), or a word in capitals in a shout or a question
  const n=t.split(/\s+/).length, caps=/\b(?!HEADLINE\b|EXTRA\b)[A-Z]{3,}\b/.test(t)&&t.replace(/[^a-z]/g,'').length>t.replace(/[^A-Z]/g,'').length;
  if(bang&&q&&n<=24) return 'surprised';
  if((bang||q)&&caps&&n<=16) return 'surprised';
  if(/^oh dear\b/i.test(t)) return 'worried';
  if(MR.shy.test(t)) return 'shy';
  if(who==='pip'&&bang) return 'happy';
  return 'neutral';
}
// some speakers have a resting face: Glaciar under the Mother's spell is cold, the finale's echoes are cold, the masked
// thief is sly (each still yields to a line's own tag)
function moodRest(who,m){
  try{
    if(who==='f_glaciar'&&typeof f2sGlacEyes==='function'&&f2sGlacEyes()==='#c890ff'&&!(G.bossDone&&G.bossDone.f_glaciar)) return 'cold';
    if(/^n_echo_/.test(who)) return m==='neutral'||m==='tender'||m==='happy'?'cold':m;
    if(who==='c_mask'&&m==='neutral') return 'sly';
    if(who==='nyxara'&&m==='happy') return 'sly';
  }catch(e){}
  return m;
}
// old-code lines tagged by their words (the files that hold them belong to other writers): [who, start of the full
// text, mood]. The start is matched case-blind, spaces folded, on its first 40 letters (or fewer, if it is shorter).
const MOOD_SHEET=[];
const MOOD_SHEET_IX=new Map();
function moodSheetKey(who,t){ return who+'|'+String(t).toLowerCase().replace(/\s+/g,' ').trim().slice(0,40); }
function moodSheetAdd(rows){ for(const [who,start,mood] of rows){ MOOD_SHEET.push([who,start,mood]); MOOD_SHEET_IX.set(moodSheetKey(who,start),mood); } }
function moodSheetGet(who,full){
  if(!MOOD_SHEET_IX.size) return null;
  const k=moodSheetKey(who,full); let m=MOOD_SHEET_IX.get(k); if(m) return m;
  // a sheet row shorter than 40 letters matches a line that starts with it
  for(const [w,start,mood] of MOOD_SHEET) if(w===who&&start.length<40&&k.startsWith(moodSheetKey(w,start))) return mood;
  return null;
}
// Act I's peaks, which live in old code: the opening morning, Mom's Three Lanterns, Ember before the last climb,
// Grandpa, the four endings and Mom's three little lights (STORY_PLAN 3.4)
moodSheetAdd([
  // the opening (a1d_story STORY.prologue, forge, lanternsDone)
  ['maren','(from the kitchen) Ash! Up you get!','happy'], ['ash',"(under the blanket) I wasn't snoring.",'sleepy'],
  ['maren',"Practice on the lanterns. I'm off to the forge.",'happy'], ['maren','And Ash? Gently this year.','sly'],
  ['maren','There you are. Hold out your claws.','happy'], ['maren',"Your grandmother's sword.",'tender'],
  ['maren','Gran used to say it was made for','sly'], ['ash',"It's beautiful. Is it fireproof?",'happy'],
  ['maren','It is now. Go on, the three festival lanterns','happy'], ['yara','Beautiful work, Ash.','happy'],
  ['ash','And nothing else caught fire.','happy'], ['yara','Kobolds! In the village!','scared'],
  // Mom's Three Lanterns (x0_vorlaxis QDEFS.a1_lanterns) and her three little lights at the end
  ['maren',"The gate's open. So you're going up there.",'worried'], ['maren','I made these. Three paper lanterns.','tender'],
  ['ash','What if I forget?','worried'], ['maren',"You won't forget. Because if I don't see",'determined'], ['ash',"...I'll light them.",'determined'],
  ['maren','Three little lights on the mountain.','tender'],
  // Ember before the summit, and Grandpa (x0_vorlaxis)
  ['ember','Ash. Wait. Just for a moment.','tender'], ['ash','Ember?','surprised'], ['ember',"He's my father. He taught me to breathe fire",'sad'],
  ['ember',"I'm not asking you to be gentle.",'determined'], ['ash',"I'm ready. Mostly.",'determined'], ['ember',"Then go on. I'll be right here.",'tender'],
  ['vor','You have her horns. And my fire.','sly'], ['vor',"For a thousand years my daughter's children",'angry'],
  ['ash','She gave it to us. It was never yours','determined'], ['vor','Come then, hatchling.','angry'], ['vor','Back again, hatchling?','sly'],
  ['vor','How? How does something so small','surprised'], ['ember','(everywhere at once) Because it','tender'], ['vor','Ember?','surprised'],
  ['vor','Impossible... the fire... it chose you...','sad'],
  // the four endings (a1d_story ENDINGS) and what comes after (x0_vorlaxis)
  ['ash',"I'm sorry, Grandpa.",'sad'], ['ember','(very softly, from the rim) Goodnight, Father.','sad'],
  ['ash',"I'm not going to destroy you, Grandpa.",'determined'], ['iska','Welcome, Sixth Warden.','happy'],
  ['ember',"(from the rim) He'll pretend he hates the visits.",'tender'],
  ['ash',"Fine. If it's fire you want to fight over",'angry'], ['ember','(from the rim, quietly) That','sad'],
  ['ash','Ember lit one of these for you every year','tender'], ['vor','...She did?','surprised'], ['ash','She wrote it down.','tender'],
  ['ember','(from the rim, very quietly) I used to fold','tender'], ['vor','Is there cake? At this festival','shy'],
  ['ash','Is that... spare fire?','surprised'], ['vor',"Hm. That's the last of it.",'shy'], ['vor','Give it to your mother.','shy']
]);
// the mood for a line: its own tag, else the sheet, else the reader; then the speaker's resting face
function lineMood(who,L,full){
  const m=moodName(L&&L.face)||moodName(moodSheetGet(who,full));
  return m||moodRest(who,moodRead(who,full));
}

// the portrait is a little bigger on screen, so a face can be read (the box is no taller: the text column sets it)
(function portraitSize(){ try{ const st=document.createElement('style'); st.id='moodPortrait';
  st.textContent='#dlgBox #portrait{width:112px;height:112px}@media (max-width:640px){#dlgBox #portrait{width:72px;height:72px}}'; document.head.appendChild(st); }catch(e){} })();
// ---------- the portrait cache: one picture per (speaker, mood, look, story state), cleared with each conversation
const PCACHE=new Map();
function pcacheReset(){ PCACHE.clear(); }
function pcacheSig(){ try{ const c=G&&G.choices||{}; let s=(G&&G.stage)||''; for(const k in c) s+=','+c[k]; return s; }catch(e){ return ''; } }
function portraitGet(who,mood,blink){
  const key=who+'|'+mood+(blink?'|b':'')+'|'+(LOOK.sb?1:0)+'|'+pcacheSig();
  let c=PCACHE.get(key); if(c) return c;
  const prev=PX; PX=moodSpec(mood,blink);
  try{ drawPortrait(who); }catch(e){ console.error(e); } finally{ PX=prev; }
  c=mkCanvas(176,176); c.getContext('2d').drawImage($('#portrait'),0,0);
  if(PCACHE.size>96) PCACHE.clear();
  PCACHE.set(key,c); return c;
}
// put a cached picture on the portrait, squashed (sx, sy >= 1 so it always fills the frame) about its bottom middle
function portraitBlit(c,sx,sy){
  const g=$('#portrait').getContext('2d'); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,176,176);
  if(sx===1&&sy===1){ g.drawImage(c,0,0); return; }
  g.setTransform(sx,0,0,sy,88*(1-sx),176*(1-sy)); g.drawImage(c,0,0); g.setTransform(1,0,0,1,0,0);
}
// a line's portrait: when the same speaker's mood changes, a quick blink and squash (under a fifth of a second)
function portraitLine(who,L){
  let full=''; try{ full=String(typeof L.text==='function'?L.text():L.text); }catch(e){}
  const mood=lineMood(who,L,full), same=DLG.pWho===who, changed=same&&DLG.pFace!==mood;
  DLG.pWho=who; DLG.pFace=mood;
  const c=portraitGet(who,mood,false);
  if(changed&&!reducedMotion()){ DLG.pAnim={t0:performance.now(),who,mood,c}; portraitAnim(); }
  else { DLG.pAnim=null; portraitBlit(c,1,1); }
}
const PANIM_BLINK=70, PANIM_END=190;
function portraitAnim(){
  const A=DLG&&DLG.pAnim; if(!A) return;
  const t=performance.now()-A.t0;
  if(t>=PANIM_END){ DLG.pAnim=null; portraitBlit(A.c,1,1); return; }
  if(t<PANIM_BLINK){ const k=t/PANIM_BLINK; portraitBlit(MOOD_SPEC[A.mood].eo===0?A.c:portraitGet(A.who,A.mood,true),1+0.07*Math.sin(k*Math.PI*0.5),1); return; }
  const k=(t-PANIM_BLINK)/(PANIM_END-PANIM_BLINK), e=Math.sin(k*Math.PI)*(1-k*0.35);
  portraitBlit(A.c,1+0.07*(1-k)*(1-k),1+0.05*e);
}
function reducedMotion(){ try{ return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } }

// ---------- expression drawing helpers, shared by every face (the 176 px card is centred, about 60 px each way)
function pxOpen(){ return PX.blink?0:(PX.eo==null?1:PX.eo); }
// one human eye at x, y (s: -1 left, 1 right). E: { rx, ry, r (iris), white, iris, skin (lids), lash, lw, dot (a plain
// dark dot eye, villagers), spirit (a glowing white eye with no iris, the Wardens) }
function pxEye(g,x,y,s,E){
  const X=PX, wince=pxWince(s), eo=wince?0:pxOpen(), lash=E.lash||'#2a1a10';
  g.save(); g.lineCap='round'; g.lineJoin='round';
  if(eo<=0.05){
    g.strokeStyle=E.spirit&&!E.lash?(E.white||'#fff'):lash; g.lineWidth=E.lw||2.6; g.beginPath();
    const w=E.dot?E.r*1.6:E.rx;
    if(E.glow&&E.spirit&&!E.lash){ g.shadowColor=E.glow; g.shadowBlur=8; g.strokeStyle=E.white||'#fff'; }
    // (v12) squeezed shut in pain: a tight chevron pointing at the nose
    if(wince){ const h=(E.dot?E.r:E.ry)*0.95; g.moveTo(x+s*w,y-h); g.lineTo(x-s*w*0.55,y); g.lineTo(x+s*w,y+h*0.8); }
    else if(X.ec==='arc'&&!X.blink){ g.moveTo(x-w,y+1.2); g.quadraticCurveTo(x,y-(E.dot?E.r*1.8:E.ry*1.5),x+w,y+1.2); }
    else { g.moveTo(x-w,y-0.6); g.quadraticCurveTo(x,y+(E.dot?E.r*1.2:E.ry*0.85),x+w,y-0.6); }
    g.stroke(); g.restore(); return;
  }
  const wide=Math.max(1,eo), lx=(X.lx||0), ly=(X.ly||0);
  let rx, ry;
  if(E.dot){ rx=ry=E.r*(eo>1.1?2.05:1.15); }
  else { rx=E.rx*(1+(wide-1)*0.35); ry=E.ry*Math.min(1.4,wide); }
  const shape=()=>{ g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); };
  if(E.dot){
    if(eo>1.1){ g.fillStyle='#fbf6ee'; shape(); g.fill(); g.strokeStyle=lash; g.lineWidth=1.2; g.stroke(); }
    const r=E.r*(eo>1.1?(X.pu&&X.pu<0.7?0.62:0.85):1);
    g.fillStyle=X.blank?(E.blankCol||'#dff2ff'):(E.iris||lash); g.beginPath(); g.arc(x+lx*rx*0.3,y+ly*ry*0.3,r,0,TAU); g.fill();
    if(eo>1.1&&!X.blank){ g.fillStyle='#fff'; g.beginPath(); g.arc(x+lx*rx*0.3+r*0.35,y-r*0.35,r*0.32,0,TAU); g.fill(); }
  } else if(E.spirit){
    g.save(); if(E.glow){ g.shadowColor=E.glow; g.shadowBlur=8; } g.fillStyle=X.blank?'#eef8ff':(E.white||'rgba(255,255,255,.95)');
    pxLidClip(g,x,y,rx,ry,s,eo); shape(); g.fill(); if(E.ring){ g.shadowBlur=0; g.strokeStyle=E.ring; g.lineWidth=1.4; shape(); g.stroke(); }
    // (v12) a glowing eye stares with a small dark pupil when it is wide (scared, surprised) or in a rage
    if(E.pip&&!X.blank&&(eo>1.1||X.pu)){ g.shadowBlur=0; g.fillStyle=E.pip; g.beginPath(); g.arc(x+(X.lx||0)*rx*0.3,y+(X.ly||0)*ry*0.3,Math.max(1,Math.min(rx,ry)*(X.pu?0.38:0.5)),0,TAU); g.fill(); }
    g.restore();
  } else {
    g.fillStyle=X.blank?(E.blankCol||'#e4f4ff'):(E.white||'#fbf6ee'); shape(); g.fill();
    g.save(); shape(); g.clip();
    if(X.blank){ g.fillStyle='rgba(150,210,255,.55)'; g.beginPath(); g.ellipse(x,y+ry*0.3,rx,ry*0.6,0,0,TAU); g.fill(); }
    else {
      const ir=Math.max(E.r*0.45,E.r*(X.pu||1)), ix=x+0.5+lx*rx*0.36, iy=y+0.4+ly*ry*0.32;
      g.fillStyle=E.iris||'#3a2a1a'; g.beginPath(); g.arc(ix,iy,ir,0,TAU); g.fill();
      if(E.pupil){ g.fillStyle=E.pupil; g.beginPath(); g.arc(ix,iy,ir*0.5,0,TAU); g.fill(); }
      g.fillStyle='#fff'; g.beginPath(); g.arc(ix+ir*0.37,iy-ir*0.4,Math.max(0.8,ir*0.37),0,TAU); g.fill();
    }
    g.restore();
    if(E.ring){ g.strokeStyle=E.ring; g.lineWidth=1; shape(); g.stroke(); }
  }
  if(!E.spirit) pxLid(g,x,y,rx,ry,s,eo,E.skin,lash,E.dot);
  g.restore();
}
// the lid line of an eye: (1 - eo) of it covered from the top, the line slanted by PX.ls (inner corner = toward the nose)
// (v12) the eye on the right squeezes shut when hurt
function pxWince(s){ return !!PX.wince&&s>0&&!PX.blink; }
function pxLidLine(x,y,rx,ry,s,eo){
  const cover=eo<1?(1-eo)*2*ry:0, ls=(PX.ls||0)*ry*0.95;
  const xi=x-s*rx, xo=x+s*rx, yi=y-ry+cover+(ls>0?ls:0), yo=y-ry+cover+(ls<0?-ls:0);
  return {cover,ls,xi,xo,yi,yo};
}
function pxLid(g,x,y,rx,ry,s,eo,skin,lash,dot){
  const L=pxLidLine(x,y,rx,ry,s,eo); if(L.cover<0.3&&!L.ls) return;
  g.save(); g.beginPath(); g.ellipse(x,y,rx+0.7,ry+0.7,0,0,TAU); g.clip();
  g.fillStyle=skin||'#d8a888'; g.beginPath(); g.moveTo(L.xi-s*2,y-ry-3); g.lineTo(L.xo+s*2,y-ry-3); g.lineTo(L.xo+s*2,L.yo); g.quadraticCurveTo(x,(L.yi+L.yo)/2-0.8,L.xi-s*2,L.yi); g.closePath(); g.fill();
  g.restore();
  g.strokeStyle=lash; g.lineWidth=dot?1.6:1.8; g.beginPath(); g.moveTo(L.xi,L.yi); g.quadraticCurveTo(x,(L.yi+L.yo)/2-0.8,L.xo,L.yo); g.stroke();
}
// a spirit's eye is cut by its lid instead of covered (their faces are see-through light)
function pxLidClip(g,x,y,rx,ry,s,eo){
  const L=pxLidLine(x,y,rx,ry,s,eo); if(L.cover<0.3&&!L.ls) return;
  g.beginPath(); g.moveTo(L.xi-s*3,L.yi); g.quadraticCurveTo(x,(L.yi+L.yo)/2-0.8,L.xo+s*3,L.yo); g.lineTo(L.xo+s*3,y+ry+4); g.lineTo(L.xi-s*3,y+ry+4); g.closePath(); g.clip();
}
// brows. E: { x (eye centre), y (brow middle), w (half length), col, lw, arch, k (scale), busy (only when emoting) }
function pxBrows(g,E){
  if(E.busy&&!(Math.abs(PX.br||0)>0.15||Math.abs(PX.bh||0)>0.5||PX.asym)) return;
  const X=PX, k=E.k||1; g.save(); g.strokeStyle=E.col; g.lineWidth=E.lw||2.6; g.lineCap='round';
  for(const s of E.only?[E.only]:[-1,1]){
    let br=X.br||0, bh=(X.bh||0)*k;
    if(X.asym){ if(s>0){ br=0; bh+=3.6*k; } else { br=-0.75; bh-=0.6*k; } }
    const xi=s*(E.x-E.w), xo=s*(E.x+E.w), yi=E.y-bh-br*3.4*k, yo=E.y-bh+br*1.4*k, arch=(E.arch||3)*(br<-0.3?0.35:1)*(X.asym&&s>0?1.6:1);
    g.beginPath(); g.moveTo(xi,yi); g.quadraticCurveTo(s*E.x,Math.min(yi,yo)-arch,xo,yo); g.stroke();
  }
  g.restore();
}
// mouth. M: { y, w (half width), c (curve depth), col (line), lw, dark (inside), tongue, busy (only when emoting) }
function pxMouth(g,M){
  const X=PX, m=X.m||'neutral'; if(M.busy&&!pxBusy()) return;
  const y=M.y, w=M.w, c=M.c||5, dark=M.dark||'#4a1612';
  g.save(); g.lineCap='round'; g.lineJoin='round'; g.strokeStyle=M.col||'#8a3a2a'; g.lineWidth=M.lw||2.4;
  const B=()=>g.beginPath();
  switch(m){
    case 'smile': B(); g.moveTo(-w*1.22,y-1); g.quadraticCurveTo(0,y+c*2,w*1.22,y-1); g.stroke(); break;
    case 'tiny': B(); g.moveTo(-w*0.55,y+1); g.quadraticCurveTo(0,y+c*0.95,w*0.55,y+1); g.stroke(); break;
    case 'laugh': { const d=c*3, ww=w*1.3;
      B(); g.moveTo(-ww,y-1); g.quadraticCurveTo(0,y+d*1.25,ww,y-1); g.quadraticCurveTo(0,y+1.2,-ww,y-1); g.closePath(); g.fillStyle=dark; g.fill();
      g.save(); g.clip(); g.fillStyle='#f6f0e4'; g.fillRect(-ww,y-3,ww*2,3.2+c*0.25); g.fillStyle=M.tongue||'#e0606a'; g.beginPath(); g.ellipse(0,y+d*0.62,ww*0.5,d*0.3,0,0,TAU); g.fill(); g.restore();
      g.stroke(); break; }
    case 'frown': B(); g.moveTo(-w,y+c*0.85); g.quadraticCurveTo(0,y-c*0.75,w,y+c*0.85); g.stroke(); break;
    case 'wobble': { B(); g.moveTo(-w,y+1.6); const n=4; for(let i=1;i<=n;i++) g.quadraticCurveTo(-w+(i-0.5)*2*w/n,y+1.6+(i%2?-2.1:2.1),-w+i*2*w/n,y+1.6); g.stroke(); break; }
    case 'o': case 'scream': case 'small': {
      const rx=m==='scream'?w*0.62:m==='o'?w*0.48:w*0.3, ry=m==='scream'?c*1.3:m==='o'?c*1.0:c*0.58;
      B(); g.ellipse(0,y+ry*0.55,rx,ry,0,0,TAU); g.fillStyle=dark; g.fill(); g.lineWidth=(M.lw||2.4)*0.85; g.stroke();
      if(m==='scream'){ g.save(); B(); g.ellipse(0,y+ry*0.55,rx,ry,0,0,TAU); g.clip(); g.fillStyle='#f6f0e4'; g.fillRect(-rx,y+ry*0.55-ry-1,rx*2,ry*0.45); g.restore(); }
      break; }
    case 'flat': B(); g.moveTo(-w*0.8,y+1); g.lineTo(w*0.8,y+1); g.stroke(); break;
    case 'set': B(); g.moveTo(-w*0.95,y+0.4); g.quadraticCurveTo(0,y+2.6,w*0.95,y+0.4); g.stroke(); B(); g.moveTo(w*0.95,y+0.4); g.lineTo(w*1.15,y-1.2); g.stroke(); break;
    case 'smirk': B(); g.moveTo(-w*0.85,y+1.8); g.quadraticCurveTo(w*0.2,y+3.4,w*1.18,y-2.4); g.stroke(); break;
    case 'roar': { const ww=w*1.25, hh=c*2.6;
      B(); g.moveTo(-ww,y-1); g.quadraticCurveTo(0,y-3.5,ww,y-1); g.quadraticCurveTo(ww*0.8,y+hh,0,y+hh); g.quadraticCurveTo(-ww*0.8,y+hh,-ww,y-1); g.closePath(); g.fillStyle=dark; g.fill();
      g.save(); g.clip(); g.fillStyle='#f6f0e4'; g.fillRect(-ww,y-4,ww*2,4.6); g.fillRect(-ww,y+hh-3,ww*2,3.4); g.fillStyle=M.tongue||'#e0606a'; g.beginPath(); g.ellipse(0,y+hh*0.8,ww*0.45,hh*0.25,0,0,TAU); g.fill(); g.restore();
      g.stroke(); break; }
    case 'teeth': { const ww=w*1.05, hh=c*1.2;
      B(); g.moveTo(-ww,y+1); g.quadraticCurveTo(0,y-2,ww,y+1); g.lineTo(ww*0.92,y+hh); g.quadraticCurveTo(0,y+hh-1.6,-ww*0.92,y+hh); g.closePath();
      g.fillStyle='#f6f0e4'; g.fill(); g.stroke();
      g.lineWidth=1.1; B(); g.moveTo(-ww*0.9,y+hh*0.52); g.quadraticCurveTo(0,y+hh*0.3,ww*0.9,y+hh*0.52); for(const f of [-0.45,0,0.45]){ g.moveTo(f*ww,y-0.4); g.lineTo(f*ww,y+hh-1); } g.stroke(); break; }
    default: B(); g.moveTo(-w,y); g.quadraticCurveTo(0,y+c,w,y); g.stroke();
  }
  g.restore();
}
function pxDrop(g,x,y,r,col){
  g.fillStyle=col; g.beginPath(); g.moveTo(x,y-r*1.9); g.bezierCurveTo(x+r*0.35,y-r*1.0,x+r,y-r*0.35,x+r,y+r*0.2); g.arc(x,y+r*0.2,r,0,Math.PI); g.bezierCurveTo(x-r,y-r*0.35,x-r*0.35,y-r*1.0,x,y-r*1.9); g.fill();
  g.strokeStyle='rgba(30,60,110,.55)'; g.lineWidth=1; g.stroke();
  g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(x-r*0.38,y,r*0.22,r*0.42,0.3,0,TAU); g.fill();
}
function pxStar(g,x,y,r,col,n){ n=n||4; g.fillStyle=col; g.beginPath(); for(let i=0;i<n*2;i++){ const a=-Math.PI/2+i*Math.PI/n, q=i%2?r*0.28:r; i?g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q):g.moveTo(x+Math.cos(a)*q,y+Math.sin(a)*q); } g.closePath(); g.fill(); }
function pxFlake(g,x,y,r){ g.save(); g.strokeStyle='rgba(235,248,255,.95)'; g.lineWidth=1.4; g.lineCap='round'; for(let i=0;i<3;i++){ const a=i*Math.PI/3; g.beginPath(); g.moveTo(x-Math.cos(a)*r,y-Math.sin(a)*r); g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); g.stroke(); } g.restore(); }
// the small things around a face. F: { ex, ey (eye x, y), erx, ery (eye size), cheek (y), top (forehead y), side (face
// half width), k (scale), tear (colour), no: { blush: true, ... } to leave one out }
function pxExtras(g,F){
  const X=PX, k=F.k||1, no=F.no||{}; g.save(); g.lineCap='round'; g.lineJoin='round';
  if(X.blush&&!no.blush){ g.fillStyle=`rgba(240,96,110,${Math.min(0.5,0.24*X.blush)})`; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*(F.ex+2*k),F.cheek,7*k,3.8*k,0,0,TAU); g.fill(); }
    if(X.blush>1){ g.strokeStyle='rgba(214,64,80,.55)'; g.lineWidth=1.2*k; for(const s of [-1,1]) for(let i=-1;i<=1;i++){ const x=s*(F.ex+2*k)+i*3.4*k; g.beginPath(); g.moveTo(x+1.4*k,F.cheek-2*k); g.lineTo(x-1.4*k,F.cheek+2*k); g.stroke(); } } }
  if(X.gloom&&!no.gloom){ g.strokeStyle='rgba(96,96,200,.5)'; g.lineWidth=2*k; for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(i*7*k,F.top+2*k); g.lineTo(i*7*k,F.top+(i?10:13)*k); g.stroke(); } }
  if(X.tear&&!no.tear){ const x=-(F.ex+(F.erx||5)*0.3), y=F.ey+(F.ery||4)+5*k; g.strokeStyle='rgba(130,200,255,.5)'; g.lineWidth=2*k; g.beginPath(); g.moveTo(x,F.ey+(F.ery||4)); g.lineTo(x,y-3*k); g.stroke(); pxDrop(g,x,y,3*k,F.tear||'#8ad0ff'); }
  if(X.sweat&&!no.sweat){ pxDrop(g,F.side*0.84,F.top+9*k,3.5*k,'#a8dcff'); if(X.sweat>1) pxDrop(g,-F.side*0.88,F.top+15*k,2.7*k,'#a8dcff'); }
  if(X.vein&&!no.vein){ const x=F.side*0.7, y=F.top+3*k; g.strokeStyle='#e8303a'; g.lineWidth=2.3*k; for(const [a,b] of [[1,1],[-1,1],[1,-1],[-1,-1]]){ g.beginPath(); g.moveTo(x+a*1.4*k,y+b*5*k); g.quadraticCurveTo(x+a*1.4*k,y+b*1.4*k,x+a*5*k,y+b*1.4*k); g.stroke(); } }
  if(X.glint&&!no.glint) pxStar(g,F.ex+(F.erx||5)*0.75,F.ey-(F.ery||4)-1.5*k,4.4*k,'#fffbe8');
  if(X.zz&&!no.zz){ const z=(x,y,r)=>{ g.beginPath(); g.moveTo(x-r,y-r); g.lineTo(x+r,y-r); g.lineTo(x-r,y+r); g.lineTo(x+r,y+r); g.strokeStyle='#2a2040'; g.lineWidth=4.4*k; g.stroke(); g.strokeStyle='#f4f0ff'; g.lineWidth=2.2*k; g.stroke(); };
    z(F.side+7*k,F.top-2*k,3.4*k); z(F.side+17*k,F.top-15*k,4.6*k); }
  // (v12) pain marks by the head, and stars going round it (beaten)
  if(X.ow&&!no.ow){ g.strokeStyle='#ffd23a'; g.lineWidth=2.4*k; for(const [a,l] of [[-2.5,7],[-2.05,9],[-1.6,7]]){ const cx=-F.side*0.95, cy=F.top+2*k, r0=6*k; g.beginPath(); g.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0); g.lineTo(cx+Math.cos(a)*(r0+l*k),cy+Math.sin(a)*(r0+l*k)); g.stroke(); } }
  if(X.daze&&!no.daze){ const cy=F.halo!=null?F.halo:F.top-12*k, rx=F.side*0.9, ry=6*k; g.strokeStyle='rgba(255,240,170,.55)'; g.lineWidth=1.4*k; g.beginPath(); g.ellipse(0,cy,rx,ry,0,0,TAU); g.stroke();
    for(const a of [0.5,2.6,4.4]){ const x=Math.cos(a)*rx, y=cy+Math.sin(a)*ry; g.save(); g.strokeStyle='rgba(60,30,10,.55)'; g.lineWidth=1.2*k; pxStar(g,x,y,5.2*k,'#ffe25a',5); g.stroke(); g.restore(); } }
  if(X.frost&&!no.frost){ for(const [x,y,r] of [[-F.side-8*k,F.top+6*k,4],[F.side+9*k,F.top-2*k,5],[F.side*0.4,F.top-14*k,3.4],[-F.side*0.6,F.top-10*k,3]]) pxFlake(g,x,y,r*k); }
  g.restore();
}

// ---------- (v12 FACES) the creature kit: the pose a face takes, a glow behind it, a beak that opens, and eyes and
// mouths for faces that are not people. Every creature and boss face calls pxPose first (inside its own save).
// pose: tilt about the bottom of the card, squash or stretch from there (sink, lift), lean in (near) or shrink (small)
function pxPose(g,o){
  const X=PX; o=o||{}; const k=o.k==null?1:o.k, py=o.py==null?70:o.py;
  const tilt=(X.tilt||0)*k, sy=1+((X.lift||0)-(X.sink||0))*k, sc=1+((X.near||0)-(X.small||0))*k;
  if(!tilt&&sy===1&&sc===1) return;
  g.translate(0,py); g.rotate(tilt); g.scale(sc,sc*sy); g.translate(0,-py);
}
// a glow behind the head: rage burns red, peace is a soft gold (the mood's aura), or a colour of the face's own
function pxAura(g,x,y,r,col,a){
  col=col||PX.aura; if(!col) return; a=a==null?(PX.n==='furious'?0.55:0.4):a;
  const gr=g.createRadialGradient(x,y,r*0.15,x,y,r); gr.addColorStop(0,`rgba(${col},${a})`); gr.addColorStop(1,`rgba(${col},0)`);
  g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
}
// how open a mouth is for the mood (0 shut, 1 wide): beaks, maws and glowing slots use it
function pxOpenMouth(){ return {laugh:0.85,o:0.6,scream:1,roar:1,small:0.3,teeth:0.18}[PX.m]||0; }
// the mood's colour for a glow (eyes in a hood or a visor, a lamp, a flame): hot when angry, dim when sad, soft when calm
function pxGlowCol(base,hot,dim,soft){
  const n=PX.n; if(n==='angry'||n==='furious') return hot||base; if(n==='sad'||n==='ashamed'||n==='defeated'||n==='cold') return dim||base;
  if(n==='peaceful'||n==='tender'||n==='happy'||n==='laughing'||n==='proud') return soft||base; return base;
}
// a bird's beak seen from the front (x, y: where the two halves meet; w half width, h length): it opens with the mood
function crBeak(g,x,y,o){
  const w=o.w||10, h=o.h||14, op=pxOpenMouth(), gap=op*h*0.75, O=o.ol||'rgba(40,24,10,.9)';
  g.save(); g.lineJoin='round'; g.strokeStyle=O; g.lineWidth=o.lw||2.2;
  if(gap>1){ g.fillStyle=o.inside||'#5a1a14'; g.beginPath(); g.moveTo(x-w*0.95,y); g.quadraticCurveTo(x,y+gap*1.4,x+w*0.95,y); g.closePath(); g.fill();
    if(op>0.5){ g.fillStyle='#e8707a'; g.beginPath(); g.ellipse(x,y+gap*0.55,w*0.45,gap*0.32,0,0,TAU); g.fill(); } }
  // lower half (drops open), then the upper half over it
  g.fillStyle=o.low||o.col; g.beginPath(); g.moveTo(x-w*0.8,y+gap*0.6); g.quadraticCurveTo(x,y+gap+h*0.5,x+w*0.8,y+gap*0.6); g.quadraticCurveTo(x,y+gap*0.9,x-w*0.8,y+gap*0.6); g.closePath(); g.fill(); g.stroke();
  const tip=PX.m==='frown'||PX.m==='wobble'?h*1.05:h*0.95;
  g.fillStyle=o.col; g.beginPath(); g.moveTo(x-w,y-h*0.25); g.quadraticCurveTo(x,y-h*0.5,x+w,y-h*0.25); g.quadraticCurveTo(x+w*0.7,y+tip*0.35,x,y+tip*0.75); g.quadraticCurveTo(x-w*0.7,y+tip*0.35,x-w,y-h*0.25); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(x-w*0.35,y-h*0.12,w*0.28,h*0.12,-0.3,0,TAU); g.fill();
  // a smile shows as the corners turning up, a frown as them turning down
  const m=PX.m; if(m==='smile'||m==='smirk'||m==='frown'||m==='set'){ const d=m==='frown'?3:-3; g.beginPath(); for(const s of m==='smirk'?[1]:[-1,1]){ g.moveTo(x+s*w*0.95,y-h*0.2); g.quadraticCurveTo(x+s*(w+3),y-h*0.2+d*0.4,x+s*(w+4),y-h*0.2+d); } g.stroke(); }
  g.restore();
}
// how far ears, fins or a crest turn for the mood (radians; + is up): a little up when glad, further down when sad
function pxEarTurn(up,down){ const e=PX.ear||0; return e>0?e*(up==null?0.3:up):e*(down==null?0.5:down); }
// a wide mouth right across a face (frogs, fish, worms, a mimic's lid): the mood bends it, opens it, bares teeth.
// M: { y (the corners), w (half width), d (how deep the smile dips), col, lw, inside, tongue, teeth (bool), tc (tooth
// colour) }
function crWideMouth(g,M){
  const m=PX.m||'neutral', y=M.y, w=M.w, d=M.d==null?w*0.35:M.d, T=M.tc||'#f2ecdc';
  const along=(f,n,a,b)=>{ const r=[]; for(let i=0;i<=n;i++){ const t=a+(b-a)*i/n; r.push([t,f(t)]); } return r; };
  const fang=(x,yy,h)=>{ g.beginPath(); g.moveTo(x-w*0.06,yy); g.lineTo(x,yy+h); g.lineTo(x+w*0.06,yy); g.closePath(); g.fill(); };
  g.save(); g.strokeStyle=M.col||'#1e2e12'; g.lineWidth=M.lw||3.4; g.lineCap='round'; g.lineJoin='round';
  const open={teeth:0.5,roar:1,laugh:0.85,o:0.55,scream:0.85,small:0.3}[m];
  if(open){
    const wide=m==='o'||m==='small'?0.45:m==='scream'?0.62:1, ww=w*wide, dep=w*0.62*open, lift=m==='teeth'?d*0.25:d*0.5;
    const top=x=>y+(1-(x/ww)**2)*lift, bot=x=>y+(1-(x/ww)**2)*(lift+dep)+1;
    g.beginPath(); for(const [x,yy] of along(top,14,-ww,ww)) g.lineTo(x,yy); for(const [x,yy] of along(bot,14,ww,-ww)) g.lineTo(x,yy); g.closePath();
    g.fillStyle=M.inside||'#3a0e0a'; g.fill(); g.save(); g.clip();
    if(m==='laugh'||m==='roar'||m==='scream'){ g.fillStyle=M.tongue||'#d8606a'; g.beginPath(); g.ellipse(0,bot(0)-dep*0.22,ww*0.42,dep*0.3,0,0,TAU); g.fill(); }
    if(M.teeth&&m!=='o'&&m!=='small'){ g.fillStyle=T; for(const [x,yy] of along(top,8,-ww*0.8,ww*0.8)) fang(x,yy-1,w*0.13); for(const [x,yy] of along(bot,6,-ww*0.6,ww*0.6)) fang(x,yy+1,-w*0.11); }
    else if(m==='teeth'||m==='laugh'){ g.fillStyle=T; g.fillRect(-ww,y-2,ww*2,lift*0.55+2.5); }
    g.restore(); g.stroke();
  } else {
    let f;
    if(m==='smirk') f=x=>y+3-(x+w)/(2*w)*w*0.28+Math.sin((x+w)/(2*w)*Math.PI)*d*0.75;
    else if(m==='frown'||m==='wobble') f=x=>y+d*0.75-(1-(x/w)**2)*d*0.8+(m==='wobble'?Math.sin(x/w*Math.PI*3)*1.6:0);
    else if(m==='set'||m==='flat') f=x=>y+(1-(x/w)**2)*d*0.22;
    else if(m==='tiny') f=x=>y+1+(1-(x/(w*0.8))**2)*d*0.55;
    else if(m==='smile') f=x=>y-2+(1-(x/w)**2)*d*1.25;
    else f=x=>y+(1-(x/w)**2)*d;
    const a=m==='tiny'?-w*0.8:-w, b=-a; g.beginPath(); along(f,16,a,b).forEach(([x,yy],i)=>i?g.lineTo(x,yy):g.moveTo(x,yy)); g.stroke();
    if(M.teeth&&(m==='neutral'||m==='smile'||m==='smirk'||m==='set')){ g.fillStyle=T; for(const [x,yy] of along(f,8,-w*0.75,w*0.75)) fang(x,yy+1,w*0.12); }
  }
  g.restore();
}

// ================= portraits
function faceDragon(g,o){
  const X=PX, ear=X.ear||0;
  g.save(); g.scale(o.k,o.k); g.lineCap='round';
  g.strokeStyle=o.horn; g.lineWidth=10;
  for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*22,-34); g.quadraticCurveTo(s*44,-62,s*(o.big?66:50),-78); g.stroke(); }
  // the side fins are the ears: down when sad or scared, up when happy or surprised
  g.lineWidth=6; for(const s of [-1,1]){ const ex=60+(ear<0?-ear*5:-ear*3), ey=-40+(ear<0?-ear*25:-ear*9); g.beginPath(); g.moveTo(s*32,-14); g.quadraticCurveTo(s*52,-22+(ear<0?-ear*9:-ear*3),s*ex,ey); g.stroke(); }
  if(o.frill){ g.fillStyle=o.dark; for(const s of [-1,1]) for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(s*34,-6+i*12); g.lineTo(s*62,-16+i*16+(ear<0?-ear*5:0)); g.lineTo(s*36,4+i*12); g.closePath(); g.fill(); } }
  g.fillStyle=o.skin; g.beginPath(); g.moveTo(-36,-30); g.quadraticCurveTo(0,-60,36,-30); g.quadraticCurveTo(46,2,26,32); g.quadraticCurveTo(0,54,-26,32); g.quadraticCurveTo(-46,2,-36,-30); g.closePath(); g.fill();
  g.fillStyle='rgba(0,0,0,.18)'; for(let i=0;i<10;i++){ g.beginPath(); g.arc(-20+(i%5)*10,-34+Math.floor(i/5)*9+(i%2)*3,2.6,0,TAU); g.fill(); }
  if(X.blush){ g.fillStyle=`rgba(255,110,130,${Math.min(0.5,0.22*X.blush)})`; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*25,12,8,4.5,0,0,TAU); g.fill(); } }
  g.fillStyle=o.snout; g.beginPath(); g.ellipse(0,26,21,16,0,0,TAU); g.fill();
  g.fillStyle=o.dark; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*7,20,3.4*(X.n==='angry'?1.25:1),2.2*(X.n==='angry'?1.3:1),s*0.3,0,TAU); g.fill(); }
  for(const s of [-1,1]) dragonEye(g,s*18,-3,s,o);
  dragonBrows(g,o);
  dragonMouth(g,o);
  if(o.cracks){ g.strokeStyle='rgba(255,120,40,.85)'; g.lineWidth=1.8; g.beginPath(); g.moveTo(-26,-24); g.lineTo(-18,-16); g.lineTo(-22,-6); g.moveTo(24,-28); g.lineTo(16,-20); g.lineTo(20,-12); g.moveTo(-4,-44); g.lineTo(2,-34); g.lineTo(-2,-26); g.stroke(); }
  pxExtras(g,{ex:18,ey:-3,erx:7.5,ery:4.8,cheek:12,top:-30,side:36,k:1,tear:o.tear,no:{blush:true}});
  g.restore();
}
// a dragon's glowing eye with a slit pupil; lids are the skin, shut eyes a glowing line
function dragonEye(g,x,y,s,o){
  const X=PX, wince=pxWince(s), eo=wince?0:pxOpen(), rot=s*(o.rot==null?0.22:o.rot);
  g.save(); g.lineCap='round';
  if(eo<=0.05){
    g.shadowColor=o.eye; g.shadowBlur=o.noglow?0:8; g.strokeStyle=o.noglow?o.dark:o.eye; g.lineWidth=o.noglow?2.6:3.4; g.beginPath();
    if(wince){ g.moveTo(x+s*8,y-5); g.lineTo(x-s*5,y); g.lineTo(x+s*8,y+4); }
    else if(X.ec==='arc'&&!X.blink){ g.moveTo(x-8,y+1.5); g.quadraticCurveTo(x,y-9,x+8,y+1.5); }
    else { g.moveTo(x-8,y-1.5); g.quadraticCurveTo(x,y+4.5,x+8,y-1.5); }
    g.stroke(); g.shadowBlur=0; g.strokeStyle=o.dark; g.lineWidth=1.2; g.stroke(); g.restore(); return;
  }
  const wide=Math.max(1,eo), rx=7.5*(1+(wide-1)*0.3), ry=4.8*wide, shape=()=>{ g.beginPath(); g.ellipse(x,y,rx,ry,rot,0,TAU); };
  g.save(); g.shadowColor=o.eye; g.shadowBlur=o.noglow?0:X.blank?18:12; g.fillStyle=X.blank?'#f2faff':o.eye; shape(); g.fill(); if(o.noglow){ g.strokeStyle=o.dark; g.lineWidth=1.2; g.stroke(); } g.restore();
  if(!X.blank){
    g.save(); shape(); g.clip();
    const px=x+(X.lx||0)*2.8, py=y+(X.ly||0)*1.4;
    g.fillStyle='#160400'; g.beginPath();
    if(o.bar) g.ellipse(px,py,(X.n==='surprised'?3.4:4.6)*(X.pu?0.7:1),(X.n==='surprised'?2.6:1.5)*(X.pu?0.8:1),0,0,TAU);
    else if(X.n==='surprised') g.ellipse(px,py,2.5,3.2,0,0,TAU);
    else g.ellipse(px,py,1.7*(X.pu?0.7:1),4.2*Math.min(1.2,wide)*(X.pu?0.75:1),0,0,TAU);
    g.fill();
    if(X.n==='surprised'||X.n==='happy'||X.n==='shy'||X.n==='scared'){ g.fillStyle='rgba(255,255,255,.85)'; g.beginPath(); g.arc(px+1.6,py-1.6,1.1,0,TAU); g.fill(); }
    g.restore();
  }
  const L=pxLidLine(x,y,rx,ry,s,eo);
  if(L.cover>0.3||L.ls){
    g.save(); g.beginPath(); g.ellipse(x,y,rx+0.8,ry+0.8,rot,0,TAU); g.clip();
    g.fillStyle=o.skin; g.beginPath(); g.moveTo(L.xi-s*3,y-ry-5); g.lineTo(L.xo+s*3,y-ry-5); g.lineTo(L.xo+s*3,L.yo-s*rot*rx); g.lineTo(L.xi-s*3,L.yi+s*rot*rx); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle=o.dark; g.lineWidth=2; g.beginPath(); g.moveTo(L.xi,L.yi+s*rot*rx*0.9); g.lineTo(L.xo,L.yo-s*rot*rx*0.9); g.stroke();
  }
  g.restore();
}
// the brow ridges over a dragon's eyes tilt with the mood (drawn over the eyes, so a scowl can come down on them)
function dragonBrows(g,o){
  const X=PX; g.fillStyle=o.dark;
  for(const s of [-1,1]){
    let br=X.br||0, bh=X.bh||0;
    if(X.asym){ if(s>0){ br=0.1; bh+=4; } else { br=-0.8; bh-=0.5; } }
    const yi=-12-bh-br*5, yt=-20-bh+br*1.6, yb=-9-bh*0.5+br*1.6;
    g.beginPath(); g.moveTo(s*5,yi); g.lineTo(s*32,yt); g.lineTo(s*30,yb); g.quadraticCurveTo(s*18,(yi+yb)/2-1.5,s*5,yi+2.2); g.closePath(); g.fill();
  }
}
// the mouth along the bottom of the snout
function dragonMouth(g,o){
  const m=PX.m||'neutral', D=o.dark, ins='#2a0806', fang=(x,y,h,up)=>{ g.beginPath(); g.moveTo(x-2.2,y); g.lineTo(x,y+(up?-h:h)); g.lineTo(x+2.2,y); g.closePath(); g.fill(); };
  g.save(); g.strokeStyle=D; g.lineWidth=2.5; g.lineCap='round'; g.lineJoin='round';
  const B=()=>g.beginPath();
  let shut=true;
  switch(m){
    case 'smile': B(); g.moveTo(-20,33); g.quadraticCurveTo(0,48,20,33); g.stroke(); for(const s of [-1,1]){ B(); g.moveTo(s*20,33); g.lineTo(s*23,30); g.stroke(); } break;
    case 'tiny': B(); g.moveTo(-10,38); g.quadraticCurveTo(0,42.5,10,38); g.stroke(); break;
    case 'laugh': { shut=false; B(); g.moveTo(-20,33); g.quadraticCurveTo(0,62,20,33); g.quadraticCurveTo(0,40,-20,33); g.closePath(); g.fillStyle=ins; g.fill();
      g.save(); g.clip(); g.fillStyle='#e8606a'; g.beginPath(); g.ellipse(0,51,10,6,0,0,TAU); g.fill(); g.fillStyle='#f4ecd8'; fang(-9,36.5,5); fang(9,36.5,5); g.restore(); g.stroke(); break; }
    case 'frown': B(); g.moveTo(-15,42); g.quadraticCurveTo(0,33,15,42); g.stroke(); break;
    case 'wobble': { B(); g.moveTo(-15,39); for(let i=1;i<=4;i++) g.quadraticCurveTo(-15+(i-0.5)*7.5,39+(i%2?-2.6:2.6),-15+i*7.5,39); g.stroke(); break; }
    case 'o': shut=false; B(); g.ellipse(0,41,5.5,6.5,0,0,TAU); g.fillStyle=ins; g.fill(); g.stroke(); break;
    case 'scream': shut=false; B(); g.ellipse(0,42,9,10.5,0,0,TAU); g.fillStyle=ins; g.fill(); g.stroke(); g.fillStyle='#f4ecd8'; fang(-5,33.5,4); fang(5,33.5,4); break;
    case 'small': shut=false; B(); g.ellipse(0,40,3.4,4,0,0,TAU); g.fillStyle=ins; g.fill(); g.lineWidth=2; g.stroke(); break;
    case 'flat': B(); g.moveTo(-14,39); g.lineTo(14,39); g.stroke(); break;
    case 'set': B(); g.moveTo(-16,37); g.quadraticCurveTo(0,41.5,16,37); g.stroke(); B(); g.moveTo(16,37); g.lineTo(19,34); g.stroke(); break;
    case 'smirk': B(); g.moveTo(-15,40); g.quadraticCurveTo(3,43.5,19,32); g.stroke(); break;
    case 'roar': { shut=false; B(); g.moveTo(-19,34); g.quadraticCurveTo(0,37,19,34); g.quadraticCurveTo(15,58,0,59); g.quadraticCurveTo(-15,58,-19,34); g.closePath(); g.fillStyle=ins; g.fill();
      g.save(); g.clip(); g.fillStyle='#e8606a'; g.beginPath(); g.ellipse(0,55,9,5,0,0,TAU); g.fill(); g.fillStyle='#f4ecd8'; for(const x of [-12,-5,5,12]) fang(x,34.5,6.5); for(const x of [-9,9]) fang(x,58,5.5,true); g.restore(); g.stroke(); break; }
    case 'teeth': { shut=false; B(); g.moveTo(-17,35); g.quadraticCurveTo(0,39,17,35); g.lineTo(13,44); g.quadraticCurveTo(0,49,-13,44); g.closePath(); g.fillStyle=ins; g.fill();
      g.save(); g.clip(); g.fillStyle='#f4ecd8'; for(const x of [-11,-4,4,11]) fang(x,36,5.5); for(const x of [-8,8]) fang(x,47,4.5,true); g.restore(); g.stroke(); break; }
    default: B(); g.moveTo(-17,36); g.quadraticCurveTo(0,43,17,36); g.stroke();
  }
  if(o.teeth&&shut){ g.fillStyle='#efe6d2'; const y0=m==='frown'?39:m==='smile'?39:37; for(const i of [-3,-2,-1,1,2,3]){ const x=i*5; g.beginPath(); g.moveTo(x-2,y0); g.lineTo(x,y0+6); g.lineTo(x+2,y0); g.closePath(); g.fill(); } }
  g.restore();
}
// Grizzlefang, the kobold chief: one good yellow eye, one scarred shut, big leathery ears, a crown of bones. (v12
// FACES) his ears, the brow ridges, the good eye, the scarred lid and the mouth all move with the mood
function faceKobold(g){
  const X=PX, ear=X.ear||0, sk='#a58a3e', dk='#3a2a10';
  g.save(); pxPose(g,{py:64}); pxAura(g,0,-6,80);
  for(const s of [-1,1]){ const a=ear>0?ear*0.3:ear*0.5;
    g.save(); g.translate(s*28,-14); g.rotate(-s*a);
    g.fillStyle='#6a5426'; g.beginPath(); g.moveTo(-s*4,-10); g.lineTo(s*30,-32); g.lineTo(s*6,10); g.closePath(); g.fill();
    g.fillStyle='#8a6a34'; g.beginPath(); g.moveTo(s*2,-6); g.lineTo(s*22,-22); g.lineTo(s*7,4); g.closePath(); g.fill(); g.restore(); }
  g.fillStyle=sk; g.beginPath(); g.ellipse(0,-4,34,36,0,0,TAU); g.fill();
  g.fillStyle='rgba(60,40,10,.14)'; for(const [x,y] of [[-22,10],[24,12],[-6,-26],[10,-22]]){ g.beginPath(); g.arc(x,y,3,0,TAU); g.fill(); }
  g.fillStyle='#c1a65e'; g.beginPath(); g.ellipse(0,24,20,16,0,0,TAU); g.fill();
  const flare=X.n==='angry'||X.n==='furious'?1.35:1; g.fillStyle='#4a3a18'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*6,20,3*flare,2*flare,s*0.2,0,TAU); g.fill(); }
  // the good eye (his left): a yellow slit eye with lids
  g.save(); g.translate(-14,-6); g.scale(0.84,0.94); dragonEye(g,0,0,-1,{eye:'#ffdf4a',skin:sk,dark:dk,rot:0.12}); g.restore();
  // the scarred eye stays shut; its lid line follows the mood (a curve when he grins, a slant when he scowls)
  { const ls=X.ls||0, up=X.ec==='arc'||X.m==='laugh'||X.m==='smile'; g.strokeStyle=dk; g.lineWidth=2.6; g.lineCap='round'; g.beginPath();
    if(up){ g.moveTo(8,-4); g.quadraticCurveTo(14,-11,20,-4); } else { g.moveTo(8,-6+ls*2.5); g.quadraticCurveTo(14,-3+ls*0.5,20,-4-ls*1.5); } g.stroke(); }
  g.strokeStyle='#5a2a14'; g.lineWidth=3; g.beginPath(); g.moveTo(9,-18); g.lineTo(21,6); g.stroke();
  g.save(); g.translate(-1,-3); g.scale(0.82,0.95); dragonBrows(g,{dark:'#5a4420'}); g.restore();
  g.fillStyle='#8a6a2a'; g.fillRect(-30,-38,60,7);
  g.fillStyle='#efe6d2'; for(let i=-2;i<=2;i++){ const x=i*11; g.beginPath(); g.moveTo(x-5,-36); g.lineTo(x,-58+Math.abs(i)*5); g.lineTo(x+5,-36); g.closePath(); g.fill(); }
  g.save(); g.translate(0,-3); dragonMouth(g,{dark:'#4a3a18'}); g.restore();
  if(!pxOpenMouth()){ g.fillStyle='#efe6d2'; const y=X.m==='frown'?36:X.m==='smile'?37:34; g.beginPath(); g.moveTo(6,y); g.lineTo(9,y+7); g.lineTo(11.5,y-0.5); g.closePath(); g.fill(); }
  pxExtras(g,{ex:14,ey:-6,erx:6.3,ery:4.5,cheek:9,top:-28,side:34,halo:-66});
  g.restore();
}
// High Priest Morrow: a deep purple hood with gold trim and two glowing eyes in the dark. (v12 FACES) the eyes narrow,
// slant, widen, curve or close; the light in them burns red in a rage and dims when he is sad; a faint glowing mouth
// shows when he feels something
function faceHood(g,o){
  o=o||{}; const X=PX, gc=pxGlowCol(o.eye||'#ffb04a','#ff6a2a','#c8905a','#ffd27a'), hood=o.hood||'#5a1f6e', trim=o.trim||'#e8b040';
  g.save(); pxPose(g,{py:64}); pxAura(g,0,-6,80);
  g.fillStyle=hood; g.beginPath(); g.moveTo(-49,92); g.lineTo(-50,62); g.quadraticCurveTo(-58,-50,0,-66); g.quadraticCurveTo(58,-50,50,62); g.lineTo(49,92); g.closePath(); g.fill();
  g.strokeStyle=trim; g.lineWidth=3; g.stroke();
  g.fillStyle='#120610'; g.beginPath(); g.ellipse(0,4,27,34,0,0,TAU); g.fill();
  const hot=X.n==='angry'||X.n==='furious'; if(hot){ const gr=g.createRadialGradient(0,0,2,0,4,30); gr.addColorStop(0,'rgba(255,90,40,.28)'); gr.addColorStop(1,'rgba(255,90,40,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(0,4,27,34,0,0,TAU); g.fill(); }
  for(const s of [-1,1]) pxEye(g,s*10,-2,s,{spirit:true,rx:5.6,ry:2.8,white:gc,glow:gc,pip:'#2a0804'});
  pxBrows(g,{x:10,w:5,y:-9,col:'rgba(255,170,90,.38)',lw:2,arch:1.6,busy:true});
  pxMouth(g,{y:17,w:7.5,c:4.5,col:'rgba(255,160,80,.6)',lw:2.2,dark:'rgba(70,14,10,.95)',tongue:'rgba(200,70,60,.8)',busy:true});
  g.strokeStyle=trim; g.lineWidth=3; g.beginPath(); g.arc(0,-6,32,-2.6,-0.54); g.stroke();
  pxExtras(g,{ex:10,ey:-2,erx:5.6,ery:2.8,cheek:8,top:-34,side:30,no:{blush:true}});
  g.restore();
}
// Sir Cindervane, the knight in the black helm: the face is the eyes in the visor slot, the glow and the plume. (v12
// FACES) eyes of light in the slot (lids, slants, curves, shut), a glow that burns hot when he is angry, soft gold when he
// is proud or at peace and low when he is beaten, a mouth-slot that brightens when he shouts, and a plume that stands
// up, droops or bristles
function faceHelm(g){
  const X=PX, ear=X.ear||0, op=pxOpenMouth(), n=X.n;
  const hot=n==='angry'||n==='furious', dim=n==='sad'||n==='ashamed'||n==='defeated'||n==='sleepy'||n==='cold', soft=n==='peaceful'||n==='tender'||n==='proud'||n==='happy'||n==='laughing';
  const gc=hot?'255,96,36':dim?'214,132,84':soft?'255,206,120':'255,140,50', eyeC=hot?'#fff0c8':dim?'#f0b07a':soft?'#fff2c4':'#ffd08a';
  g.save(); pxPose(g,{py:62}); pxAura(g,0,-12,82);
  // the plume, hinged at the crest
  g.save(); g.translate(0,-54); g.rotate(ear>0?-ear*0.32:-ear*0.5);
  g.fillStyle=hot?'#a8160e':dim?'#6a1a14':'#8a1a14'; g.beginPath(); g.moveTo(-6,-4); g.quadraticCurveTo(30,-26,52,14); g.quadraticCurveTo(26,-2,6,4); g.closePath(); g.fill();
  if(hot){ g.fillStyle='#c8281a'; for(let i=0;i<5;i++){ const t=0.2+i*0.17, x=-6+58*t, y=-4-22*Math.sin(t*Math.PI)+18*t; g.beginPath(); g.moveTo(x-4,y+3); g.lineTo(x+2,y-9); g.lineTo(x+5,y+4); g.closePath(); g.fill(); } }
  g.strokeStyle='rgba(255,140,120,.35)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(2,-6); g.quadraticCurveTo(28,-20,44,6); g.stroke();
  g.restore();
  g.fillStyle='#3a3d47'; g.beginPath(); g.moveTo(-36,50); g.lineTo(-38,-20); g.quadraticCurveTo(0,-64,38,-20); g.lineTo(36,50); g.quadraticCurveTo(0,62,-36,50); g.closePath(); g.fill();
  g.fillStyle='#4f5360'; g.beginPath(); g.moveTo(-30,-22); g.quadraticCurveTo(0,-56,30,-22); g.lineTo(24,-18); g.quadraticCurveTo(0,-46,-24,-18); g.closePath(); g.fill();
  g.fillStyle='rgba(255,255,255,.08)'; g.beginPath(); g.ellipse(-18,-26,8,16,0.4,0,TAU); g.fill();
  g.fillStyle='#120a08'; g.fillRect(-26,-10,52,9); const vw=5+op*3; g.fillRect(-vw,-10,vw*2,40);
  // the glow in the slots: brighter when he is hot, low when he is beaten; the mouth slot opens wider when he shouts
  const ga=hot?1:dim?0.45:0.8;
  g.save(); g.shadowColor=`rgba(${gc},1)`; g.shadowBlur=hot?18:12; g.fillStyle=`rgba(${gc},${0.55*ga})`; g.fillRect(-23,-7,46,3);
  const mw=2+op*3; g.fillStyle=`rgba(${gc},${(0.6+op*0.4)*ga})`; g.fillRect(-mw,-3,mw*2,30-(op?0:4)); g.restore();
  // the eyes, kept inside the slot
  g.save(); g.beginPath(); g.rect(-26,-10,52,9); g.clip();
  for(const s of [-1,1]) pxEye(g,s*12,-5.5,s,{spirit:true,rx:5.4,ry:2.5,white:eyeC,glow:`rgba(${gc},1)`,pip:'#3a1004'});
  g.restore();
  g.fillStyle='#8a8f9c'; for(const [x,y] of [[-28,14],[28,14],[-26,36],[26,36]]){ g.beginPath(); g.arc(x,y,2.5,0,TAU); g.fill(); }
  pxExtras(g,{ex:12,ey:-5.5,erx:5.4,ery:2.5,cheek:6,top:-36,side:36,no:{blush:true}});
  g.restore();
}
function faceElder(g){
  g.fillStyle='#4a5a2e'; g.beginPath(); g.moveTo(-50,62); g.quadraticCurveTo(-58,-50,0,-64); g.quadraticCurveTo(58,-50,50,62); g.closePath(); g.fill();
  g.fillStyle='#e6e1d6'; g.beginPath(); g.ellipse(0,-6,32,40,0,0,TAU); g.fill();
  g.fillStyle='#d9a98a'; g.beginPath(); g.ellipse(0,4,24,30,0,0,TAU); g.fill();
  for(const s of [-1,1]) pxEye(g,s*9,-2,s,{rx:4.6,ry:3.7,r:2.5,iris:'#3a2a1a',skin:'#d9a98a',lash:'#6a4434'});
  pxBrows(g,{x:9,w:5.5,y:-10,col:'#f2eee6',lw:3.2,arch:2});
  g.strokeStyle='#b0806a'; g.lineWidth=1.5; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*16,2); g.lineTo(s*19,5); g.stroke(); g.beginPath(); g.moveTo(s*16,-2); g.lineTo(s*19.5,-3); g.stroke(); }
  pxMouth(g,{y:16,w:9,c:7,col:'#8a4a3a',lw:2.5});
  const gr=g.createRadialGradient(0,48,1,0,48,15); gr.addColorStop(0,'#ffe2a0'); gr.addColorStop(0.4,'#ff8a3a'); gr.addColorStop(1,'rgba(255,100,40,0)'); g.fillStyle=gr; g.beginPath(); g.arc(0,48,15,0,TAU); g.fill();
  pxExtras(g,{ex:9,ey:-2,erx:4.6,ery:3.7,cheek:8,top:-18,side:24});
}
// Ember as she is now (she gave her fire away long ago): a warm spirit with her children's horns and long hair, like
// the Wardens, holding a little flame, and with a face that shows what she says
function faceEmber(g){
  const X=PX, ear=X.ear||0;
  const gl=g.createRadialGradient(0,-4,6,0,0,86); gl.addColorStop(0,'rgba(255,200,130,.62)'); gl.addColorStop(1,'rgba(255,150,80,0)'); g.fillStyle=gl; g.beginPath(); g.arc(0,0,86,0,TAU); g.fill();
  g.fillStyle='rgba(226,112,52,.92)'; g.beginPath(); g.moveTo(-28,-22); g.quadraticCurveTo(-46,26,-40,66); g.lineTo(40,66); g.quadraticCurveTo(46,26,28,-22); g.closePath(); g.fill();
  g.fillStyle='rgba(255,178,108,.94)'; g.beginPath(); g.moveTo(-52,66); g.quadraticCurveTo(-46,30,-14,27); g.lineTo(14,27); g.quadraticCurveTo(46,30,52,66); g.closePath(); g.fill();
  g.strokeStyle='rgba(255,238,196,.95)'; g.lineWidth=2.6; g.beginPath(); g.moveTo(-14,28); g.lineTo(0,46); g.lineTo(14,28); g.stroke();
  g.fillStyle='#ffcc98'; g.fillRect(-8,16,16,14);
  for(const s of [-1,1]){ g.fillStyle='#ffc896'; g.beginPath(); g.ellipse(s*24,0,5,8,0,0,TAU); g.fill(); }
  const fg=g.createRadialGradient(-6,-12,4,0,-2,32); fg.addColorStop(0,'#fff0da'); fg.addColorStop(1,'#ffc48e'); g.fillStyle=fg; g.beginPath(); g.ellipse(0,-2,23,29,0,0,TAU); g.fill();
  // little scales at the cheeks, as on all her children
  g.fillStyle='rgba(232,120,60,.5)'; for(const s of [-1,1]) for(const [x,y] of [[15,7],[18,3],[19,9]]){ g.beginPath(); g.arc(s*x,y,1.5,0,TAU); g.fill(); }
  for(const s of [-1,1]) pxEye(g,s*10,-3,s,{rx:5.5,ry:4.5,r:3.1,iris:'#e07818',pupil:'#6a2006',skin:'#ffd3a6',lash:'#9a3e12'});
  pxBrows(g,{x:10,w:5,y:-11,col:'#c4561e',lw:2.6,arch:3});
  g.strokeStyle='rgba(176,96,50,.7)'; g.lineWidth=2; g.beginPath(); g.moveTo(-1,1); g.quadraticCurveTo(3,7,-1,8); g.stroke();
  pxMouth(g,{y:15,w:7,c:5,col:'#b8482a',lw:2.4,dark:'#5a1608'});
  // hair on top, parted, and the horns coming up through it
  g.fillStyle='#e8763a'; g.beginPath(); g.ellipse(0,-15,25,19,0,Math.PI,0); g.fill(); g.beginPath(); g.moveTo(-25,-14); g.quadraticCurveTo(-12,-2,0,-20); g.quadraticCurveTo(10,-8,25,-14); g.lineTo(25,-20); g.lineTo(-25,-20); g.fill();
  g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-9,-28,10,4,-0.3,0,TAU); g.fill();
  for(const s of [-1,1]){ g.fillStyle='#fff3dc'; g.strokeStyle='#c8783a'; g.lineWidth=2; g.beginPath(); g.moveTo(s*9,-30); g.quadraticCurveTo(s*18,-52-ear*3,s*33,-62-ear*5); g.quadraticCurveTo(s*22,-44,s*20,-26); g.closePath(); g.fill(); g.stroke(); }
  // the little flame she holds
  g.save(); g.translate(40,46); g.scale(0.32,0.32); faceFlame(g); g.restore();
  pxExtras(g,{ex:10,ey:-3,erx:5.5,ery:4.5,cheek:9,top:-22,side:25});
}
function faceFlame(g){
  const layer=(s,c)=>{ g.fillStyle=c; g.beginPath(); g.moveTo(0,-58*s); g.bezierCurveTo(30*s,-20*s,40*s,10*s,24*s,38*s); g.quadraticCurveTo(0,58*s,-24*s,38*s); g.bezierCurveTo(-40*s,10*s,-30*s,-20*s,0,-58*s); g.closePath(); g.fill(); };
  g.save(); g.translate(0,-4); layer(1,'#d9461f'); layer(0.72,'#ff9a3a'); g.translate(0,10); layer(0.42,'#ffe7a0'); g.restore();
}
function drawPortrait(who){
  const c=LOOK.sb?lookPortraitCv():$('#portrait'), g=c.getContext('2d'), S=176;
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,S,S);
  if(!LOOK.sb){
  g.fillStyle={villager:'#2a2418',townsfolk:'#1c2430',ash:'#4a170d',yara:'#1f3018',maren:'#3a1a0c',wren:'#141e34',moss:'#1e2a14',hollis:'#2e2414',pip:'#3a1a0a',goat:'#2a2620',duchess:'#2a2620',a1_soot:'#22122c',a1_strag:'#22122c',shellby:'#1c2a1a',vor:'#320605',voice:'#320605',griz:'#3a3013',morrow:'#2a1236',brood:'#381020',gloam:'#1a2410',cinder:'#251c15',narr:'#2a170c',iska:'#3a2a10',bram:'#3a2a10',oriel:'#3a2a10',sedge:'#3a2a10',tove:'#3a2a10',ember:'#3a1a0c'}[who]||'#2a170c';
  g.fillRect(0,0,S,S);
  const gl=g.createRadialGradient(S/2,S*0.42,6,S/2,S/2,S*0.75); gl.addColorStop(0,'rgba(255,150,70,.32)'); gl.addColorStop(1,'rgba(0,0,0,.45)'); g.fillStyle=gl; g.fillRect(0,0,S,S);
  }
  // (v11 MOOD) the face sits a little closer, so its expression reads at 112 px
  g.save(); g.translate(S/2,S/2+16); g.scale(1.1,1.1);
  if(who==='ash') faceDragon(g,{skin:'#b8402a',dark:'#7e2617',snout:'#d26238',horn:'#efe0bf',eye:'#ffd34d',k:1});
  else if(who==='vor'||who==='voice') faceDragon(g,{skin:'#3d0e10',dark:'#1a0405',snout:'#561a1b',horn:'#d8c49c',eye:'#ff8a1a',k:1.1,cracks:true,teeth:true,big:true});
  else if(who==='brood') faceDragon(g,{skin:'#8a2a4a',dark:'#4d1228',snout:'#a8405e',horn:'#ead2b0',eye:'#ffe066',k:1,frill:true});
  else if(who==='griz') faceKobold(g);
  else if(who==='yara') faceElder(g);
  else if(who==='morrow') faceHood(g);
  else if(who==='cinder') faceHelm(g);
  else if(who==='villager') faceVillager(g);
  else if(who==='townsfolk') faceVillager(g,'#3a4a6a','#1a1a1a');
  else if(who==='maren') faceMaren(g);
  else if(who==='wren') faceWren(g);
  else if(who==='moss') faceMoss(g);
  else if(who==='hollis') faceHollis(g);
  else if(who==='pip') faceDragon(g,{skin:'#f0884a',dark:'#9a4018',snout:'#ffb070',horn:'#fff0d0',eye:'#ffe066',k:0.82});
  else if(who==='goat'||who==='duchess') faceGoat(g);
  else if(CULTIST[who]){ g.scale(1.14,1.14); facePerson(g,CULTIST[who],who==='a1_strag'); }
  else if(who==='gloam') faceGloam(g);
  else if(['iska','bram','oriel','sedge','tove'].includes(who)) faceWarden(g,who);
  else if(who==='shellby') faceTurtle(g);
  else if(who==='ember') faceEmber(g);
  else if(CASTBY[who]||SPECIAL[who]){ g.scale(1.14,1.14); facePerson(g,(CASTBY[who]||SPECIAL[who]).look||{},!!(CASTBY[who]||SPECIAL[who]).kid); }
  else faceFlame(g);
  g.restore();
  if(LOOK.sb) lookPortraitFinish(who,c);
}

// (v12 FACES) the last of the Scaled Oath at the summit path (x0_vorlaxis): hooded cultists, with faces under the hood
const CULTIST={a1_soot:{skin:'#e2b896',hair:'#2a1a24',hood:'#4a2a5e',shirt:'#3a2048',outfit:'robe',trim:'#c89a3a',soot:true,eye:'#3a2a3a'},
  a1_strag:{skin:'#e8c0a0',hair:'#5a4030',hood:'#6a5a80',shirt:'#4a3a5a',outfit:'robe',trim:'#9a8ab0',freckles:true,eye:'#4a5a3a'}};
function faceVillager(g,shirt,hair){
  g.fillStyle=shirt||'#5a4a3a'; g.beginPath(); g.moveTo(-46,64); g.quadraticCurveTo(-40,30,0,28); g.quadraticCurveTo(40,30,46,64); g.closePath(); g.fill();
  g.fillStyle='#d8a888'; g.beginPath(); g.ellipse(0,-4,26,32,0,0,TAU); g.fill();
  g.fillStyle=hair||'#4a3020'; g.beginPath(); g.ellipse(0,-26,28,16,0,Math.PI,0); g.fill(); g.fillRect(-28,-28,8,24); g.fillRect(20,-28,8,24);
  for(const s of [-1,1]) pxEye(g,s*10,-4,s,{dot:true,r:2.6,iris:'#2a1a10',skin:'#d8a888',lash:'#2a1a10'});
  pxBrows(g,{x:10,w:5,y:-12,col:hair||'#4a3020',lw:2.6,busy:true});
  pxMouth(g,{y:14,w:8,c:5,col:'#8a4a3a',lw:2.5});
  pxExtras(g,{ex:10,ey:-4,erx:3,ery:3,cheek:6,top:-24,side:26});
}

function faceBase(g,skin,shirt){
  g.fillStyle=shirt; g.beginPath(); g.moveTo(-48,64); g.quadraticCurveTo(-42,30,0,28); g.quadraticCurveTo(42,30,48,64); g.closePath(); g.fill();
  g.fillStyle=skin; g.beginPath(); g.ellipse(0,-4,26,32,0,0,TAU); g.fill();
}
function eyes(g,y,col,sp){ g.fillStyle=col||'#2a1a10'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*(sp||10),y,2.7,0,TAU); g.fill(); } }
function faceMaren(g){
  g.fillStyle='#b8401a'; g.beginPath(); g.arc(0,-40,16,0,TAU); g.fill();
  faceBase(g,'#e0a888','#6a3a1e');
  g.fillStyle='#4a2a14'; g.fillRect(-20,30,40,34);
  g.fillStyle='#b8401a'; g.beginPath(); g.ellipse(0,-24,29,16,0,Math.PI,0); g.fill(); g.fillRect(-29,-26,7,22); g.fillRect(22,-26,7,22);
  for(const s of [-1,1]) pxEye(g,s*10,-4,s,{rx:5.3,ry:4.3,r:2.9,iris:'#4a2a12',skin:'#e0a888',lash:'#4a1e0e'});
  pxBrows(g,{x:10,w:5.5,y:-12.5,col:'#8a2e12',lw:2.9,arch:2.6});
  g.fillStyle='rgba(150,70,40,.5)'; for(const [x,y] of [[-14,6],[-10,9],[-16,10],[12,6],[15,9],[10,9]]){ g.beginPath(); g.arc(x,y,1.2,0,TAU); g.fill(); }
  g.fillStyle='rgba(40,30,30,.3)'; g.beginPath(); g.ellipse(17,12,5,2.6,-0.3,0,TAU); g.fill();
  pxMouth(g,{y:15,w:9,c:6,col:'#8a4a3a',lw:2.5});
  pxExtras(g,{ex:10,ey:-4,erx:5.3,ery:4.3,cheek:8,top:-24,side:27});
}
function faceWren(g){
  g.fillStyle='#2a4278'; g.beginPath(); g.moveTo(-50,62); g.quadraticCurveTo(-56,-46,0,-62); g.quadraticCurveTo(56,-46,50,62); g.closePath(); g.fill();
  g.fillStyle='#e6c0a0'; g.beginPath(); g.ellipse(0,0,24,30,0,0,TAU); g.fill();
  g.fillStyle='#6a3a1a'; g.beginPath(); g.ellipse(0,-22,24,12,0,Math.PI,0); g.fill();
  for(const s of [-1,1]) pxEye(g,s*10,0,s,{rx:4.5,ry:3.7,r:2.5,iris:'#1a2a4a',skin:'#e6c0a0',lash:'#3a2414'});
  pxBrows(g,{x:10,w:5,y:-10.5,col:'#5a3418',lw:2.5,arch:2.4});
  g.strokeStyle='#c8a050'; g.lineWidth=2; for(const s of [-1,1]){ g.beginPath(); g.arc(s*10,0,7,0,TAU); g.stroke(); } g.beginPath(); g.moveTo(-3,0); g.lineTo(3,0); g.stroke();
  pxMouth(g,{y:16,w:7,c:4,col:'#9a5a4a',lw:2.3});
  pxExtras(g,{ex:10,ey:0,erx:4.5,ery:4,cheek:10,top:-18,side:24});
}
function faceMoss(g){
  g.fillStyle='#4e6e34'; g.beginPath(); g.moveTo(-52,64); g.quadraticCurveTo(-58,-40,0,-58); g.quadraticCurveTo(58,-40,52,64); g.closePath(); g.fill();
  g.fillStyle='#d4a888'; g.beginPath(); g.ellipse(0,4,24,28,0,0,TAU); g.fill();
  g.fillStyle='#e8e4dc'; g.beginPath(); g.ellipse(0,-18,22,9,0,Math.PI,0); g.fill();
  for(const s of [-1,1]) pxEye(g,s*9,0,s,{dot:true,r:2.6,iris:'#2a2010',skin:'#d4a888',lash:'#2a2010'});
  pxBrows(g,{x:9,w:4.5,y:-8,col:'#e8e4dc',lw:2.6,busy:true});
  g.strokeStyle='#a87a5a'; g.lineWidth=1.4; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*14,-2); g.lineTo(s*20,-5); g.stroke(); g.beginPath(); g.moveTo(s*14,2); g.lineTo(s*20,4); g.stroke(); }
  g.fillStyle='#c08a6a'; g.beginPath(); g.ellipse(0,9,6,8,0,0,TAU); g.fill();
  pxMouth(g,{y:20,w:8,c:5,col:'#8a4a3a',lw:2.4});
  pxExtras(g,{ex:9,ey:0,erx:3,ery:3,cheek:12,top:-16,side:24});
}
function faceHollis(g){
  faceBase(g,'#d8a080','#6a5a3a');
  g.fillStyle='#8a5a32'; g.beginPath(); g.ellipse(0,18,22,16,0,0,Math.PI); g.fill(); g.fillRect(-22,10,44,9);
  for(const s of [-1,1]) pxEye(g,s*10,-4,s,{dot:true,r:2.7,iris:'#2a1a10',skin:'#d8a080',lash:'#2a1a10'});
  pxBrows(g,{x:10,w:5,y:-12,col:'#6a4424',lw:3,busy:true});
  pxMouth(g,{y:16,w:6,c:4,col:'#3a2210',lw:2.4,busy:true});
  g.fillStyle='#d8b860'; g.beginPath(); g.ellipse(0,-30,52,12,0,0,TAU); g.fill(); g.fillStyle='#c8a048'; g.beginPath(); g.ellipse(0,-36,28,18,0,Math.PI,0); g.fill(); g.fillRect(-28,-37,56,6);
  g.fillStyle='#8a3a22'; g.fillRect(-28,-34,56,4);
  pxExtras(g,{ex:10,ey:-4,erx:3,ery:3,cheek:6,top:-22,side:26});
}
// Duchess the goat: (v12 FACES) yellow eyes with goat pupils and lids, ears that droop or perk, light brows, and a
// mouth that says "Meh" at rest and smirks when she is smug
function faceGoat(g){
  const X=PX, ear=X.ear||0;
  g.save(); pxPose(g,{py:64}); pxAura(g,0,-6,74);
  g.fillStyle='#8a7a5a'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*12,-34); g.quadraticCurveTo(s*30,-58,s*44,-40); g.lineTo(s*36,-36); g.quadraticCurveTo(s*26,-48,s*16,-28); g.closePath(); g.fill(); }
  g.strokeStyle='rgba(60,46,30,.35)'; g.lineWidth=1.5; for(const s of [-1,1]) for(const t of [0.35,0.6]){ g.beginPath(); g.moveTo(s*(14+t*20),-34-t*16); g.lineTo(s*(20+t*20),-30-t*16); g.stroke(); }
  for(const s of [-1,1]){ g.save(); g.translate(s*24,-12+(ear<0?-ear*4:0)); g.rotate(s*(0.4-(ear>0?ear*0.4:ear*0.5))); g.fillStyle='#ece6d8'; g.beginPath(); g.ellipse(s*10,0,16,7,0,0,TAU); g.fill(); g.fillStyle='#e8c8bc'; g.beginPath(); g.ellipse(s*12,0.5,10,3.4,0,0,TAU); g.fill(); g.restore(); }
  g.fillStyle='#f6f2e8'; g.beginPath(); g.ellipse(0,-6,28,38,0,0,TAU); g.fill();
  g.fillStyle='#e0d8c6'; g.beginPath(); g.ellipse(0,24,16,14,0,0,TAU); g.fill();
  g.fillStyle='#d8ccb4'; g.beginPath(); g.moveTo(-8,36); g.lineTo(0,62); g.lineTo(8,36); g.closePath(); g.fill();
  for(const s of [-1,1]){ g.save(); g.translate(s*13,-8); g.scale(0.86,1.05); dragonEye(g,0,0,s,{eye:'#d8b040',skin:'#f6f2e8',dark:'#6a5a44',rot:0.06,bar:true,noglow:true}); g.restore(); }
  pxBrows(g,{x:13,w:5.5,y:-16,col:'#b0a48c',lw:2.6,arch:2,busy:true});
  g.fillStyle='#4a3a30'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*6,24,2.6,2,0,0,TAU); g.fill(); }
  if(X.m&&X.m!=='neutral') pxMouth(g,{y:30,w:6,c:3.5,col:'#6a5a4a',lw:2,dark:'#4a2a22'});
  else { g.strokeStyle='#6a5a4a'; g.lineWidth=2; g.lineCap='round'; g.beginPath(); g.moveTo(-6,31); g.quadraticCurveTo(0,28,6,31); g.stroke(); }
  pxExtras(g,{ex:13,ey:-8,erx:5.5,ery:5,cheek:6,top:-32,side:28});
  g.restore();
}
// Gloamjaw, the bog-lurker: (v12 FACES) yellow slit eyes on top that narrow, widen and look sideways, ridge brows, and a
// jaw as wide as his head that grins, curls, sulks, gapes and roars
function faceGloam(g){
  const X=PX, m=X.m||'neutral', eo=pxOpen(), D='#1e2e12';
  g.save(); pxPose(g,{py:58}); pxAura(g,0,-8,86);
  g.fillStyle='#4e6e2e'; g.beginPath(); g.ellipse(0,10,60,42,0,0,TAU); g.fill();
  g.fillStyle='#86a456'; g.beginPath(); g.ellipse(0,0,54,34,0,0,TAU); g.fill();
  g.fillStyle='rgba(20,34,10,.4)'; for(const [x,y,r] of [[-24,-6,6],[18,-12,5],[30,6,4],[-34,10,4],[4,-18,3]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  for(const s of [-1,1]){
    const x=s*24, y=-30, wince=pxWince(s), e=wince?0:eo, R=11*(e>1?1+(e-1)*0.35:1);
    g.fillStyle='#6a8a3e'; g.beginPath(); g.arc(x,y,16,0,TAU); g.fill();
    if(e<=0.05){ g.strokeStyle=D; g.lineWidth=3; g.lineCap='round'; g.beginPath();
      if(wince){ g.moveTo(x+s*9,y-6); g.lineTo(x-s*6,y); g.lineTo(x+s*9,y+5); } else if(X.ec==='arc'&&!X.blink){ g.moveTo(x-9,y+2); g.quadraticCurveTo(x,y-9,x+9,y+2); } else { g.moveTo(x-9,y-1); g.quadraticCurveTo(x,y+6,x+9,y-1); }
      g.stroke(); continue; }
    g.fillStyle=X.blank?'#f0f4e0':'#e8d84a'; g.beginPath(); g.arc(x,y,R,0,TAU); g.fill();
    if(!X.blank){ g.save(); g.beginPath(); g.arc(x,y,R,0,TAU); g.clip(); const px=x+(X.lx||0)*4.5, py=y+(X.ly||0)*3; g.fillStyle='#1a1a08'; g.beginPath();
      if(X.n==='surprised') g.ellipse(px,py,4.5,5.5,0,0,TAU); else g.ellipse(px,py,(X.pu?1.3:2.2),(X.pu?6.5:9),0,0,TAU); g.fill();
      g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.arc(px+3,py-4,1.8,0,TAU); g.fill(); g.restore(); }
    const L=pxLidLine(x,y,R,R,s,e); if(L.cover>0.3||L.ls){ g.save(); g.beginPath(); g.arc(x,y,R+0.6,0,TAU); g.clip(); g.fillStyle='#6a8a3e'; g.beginPath(); g.moveTo(L.xi-s*3,y-R-3); g.lineTo(L.xo+s*3,y-R-3); g.lineTo(L.xo+s*3,L.yo); g.quadraticCurveTo(x,(L.yi+L.yo)/2-1,L.xi-s*3,L.yi); g.closePath(); g.fill(); g.restore();
      g.strokeStyle=D; g.lineWidth=2.2; g.beginPath(); g.moveTo(L.xi,L.yi); g.quadraticCurveTo(x,(L.yi+L.yo)/2-1,L.xo,L.yo); g.stroke(); }
    g.strokeStyle='rgba(30,46,18,.6)'; g.lineWidth=1.6; g.beginPath(); g.arc(x,y,R,0,TAU); g.stroke();
  }
  pxBrows(g,{x:24,w:9,y:-48,col:'#2e4416',lw:3.6,arch:3,k:1.3,busy:true});
  // the jaw: the top line, and what opens under it
  const teeth=(pts,up)=>{ g.fillStyle='#e8e0c8'; for(const [x,y] of pts){ g.beginPath(); g.moveTo(x-3,y); g.lineTo(x,y+(up?-7:7)); g.lineTo(x+3,y); g.closePath(); g.fill(); } };
  const along=(f,n,a,b)=>{ const r=[]; for(let i=0;i<=n;i++){ const t=a+(b-a)*i/n; r.push([t,f(t)]); } return r; };
  g.strokeStyle=D; g.lineWidth=4; g.lineCap='round'; g.lineJoin='round';
  const open=m==='teeth'||m==='roar'||m==='laugh'||m==='o'||m==='scream'||m==='small';
  if(open){
    const dep={teeth:14,roar:26,laugh:22,o:14,scream:22,small:8}[m], wide=m==='o'||m==='small'?0.55:m==='scream'?0.75:1;
    const top=x=>14+(1-(x/46)**2)*(m==='teeth'?6:3), bot=x=>14+(1-(x/(46*wide))**2)*dep+4;
    g.beginPath(); g.moveTo(-46*wide,14); for(const [x,y] of along(top,12,-46*wide,46*wide)) g.lineTo(x,y); for(const [x,y] of along(bot,12,46*wide,-46*wide)) g.lineTo(x,y); g.closePath();
    g.fillStyle='#3a0e0a'; g.fill(); g.save(); g.clip(); if(m==='laugh'||m==='roar'){ g.fillStyle='#d8606a'; g.beginPath(); g.ellipse(0,14+dep,18,7,0,0,TAU); g.fill(); }
    if(m!=='o'&&m!=='small'){ teeth(along(top,8,-38*wide,38*wide).map(([x,y])=>[x,y-1]),false); teeth(along(bot,6,-30*wide,30*wide).map(([x,y])=>[x,y+1]),true); } g.restore(); g.stroke();
  } else {
    g.beginPath();
    if(m==='smirk'){ g.moveTo(-46,18); g.quadraticCurveTo(-4,36,46,4); }
    else if(m==='frown'||m==='wobble'){ g.moveTo(-44,26); g.quadraticCurveTo(0,12,44,26); }
    else if(m==='set'||m==='flat'){ g.moveTo(-46,18); g.quadraticCurveTo(0,26,46,18); }
    else if(m==='tiny'){ g.moveTo(-40,16); g.quadraticCurveTo(0,32,40,16); }
    else { g.moveTo(-46,14); g.quadraticCurveTo(0,40,46,14); }
    g.stroke();
    if(m!=='frown'&&m!=='wobble'&&m!=='tiny'){ const f=m==='smirk'?(x=>18+(x+46)/92*(-14)+Math.sin((x+46)/92*Math.PI)*12):m==='set'||m==='flat'?(x=>18+(1-(x/46)**2)*4):(x=>14+(1-(x/46)**2)*13);
      teeth(along(f,8,-36,36).map(([x,y])=>[x,y+1.5]),false); }
  }
  pxExtras(g,{ex:24,ey:-30,erx:11,ery:11,cheek:6,top:-52,side:56,k:1.15});
  g.restore();
}
function faceWarden(g,who){
  const hue={iska:'255,214,150',bram:'255,190,120',oriel:'255,226,170',sedge:'220,230,160',tove:'210,230,255'}[who];
  const gl=g.createRadialGradient(0,0,4,0,0,70); gl.addColorStop(0,`rgba(${hue},.55)`); gl.addColorStop(1,`rgba(${hue},0)`); g.fillStyle=gl; g.beginPath(); g.arc(0,0,70,0,TAU); g.fill();
  g.fillStyle=`rgba(${hue},.8)`; g.beginPath(); g.moveTo(-44,64); g.quadraticCurveTo(-40,26,0,24); g.quadraticCurveTo(40,26,44,64); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(0,-6,24,30,0,0,TAU); g.fill();
  if(who==='bram'){ g.beginPath(); g.ellipse(0,18,22,18,0,0,Math.PI); g.fill(); }
  if(who==='tove'){ g.beginPath(); g.ellipse(0,-26,30,14,0,Math.PI,0); g.fill(); }
  // a spirit's face is light: white eyes, and brows and a mouth of brighter light when it feels something
  const deep='rgba('+hue.split(',').map(v=>Math.round(+v*0.38)).join(',')+',.8)';
  for(const s of [-1,1]) pxEye(g,s*9,-6,s,{spirit:true,rx:4.6,ry:3,r:2,white:'rgba(255,255,255,.97)',glow:`rgba(${hue},1)`,ring:deep,lash:deep,lw:2.4});
  pxBrows(g,{x:9,w:4.5,y:-12.5,col:deep,lw:2.2,arch:2,busy:true});
  pxMouth(g,{y:9,w:6,c:3.6,col:deep,lw:2.1,dark:deep,busy:true});
  pxExtras(g,{ex:9,ey:-6,erx:4.4,ery:3,cheek:3,top:-26,side:24,no:{blush:true,vein:true}});
}

function facePerson(g,o,kid){
  const hx=c=>typeof c==='string'&&c[0]==='#'&&c.length===7?c:'#6a5a4a';
  const skin=hx(o.skin||'#d8a888'), hair=hx(o.hair||'#4a3020'), shirt=hx(o.shirt||'#5a4a3a'), trim=hx(o.trim||'#d8c0a0'), low=hx(o.low||shirt);
  const L=(c,k)=>mixHex(c,'#ffffff',k), D=(c,k)=>mixHex(c,'#000000',k);
  const hd=o.hood?'hood':o.hairdo||(o.bun?'bun':o.hair==='#efeae0'||o.hair==='#e8e4dc'?'short':'short');
  const hatK=o.hat||(o.helm?'helm':null), out=o.outfit||'tunic', old=o.build==='old';
  if(kid){ g.scale(0.92,0.92); g.translate(0,10); }
  g.lineJoin='round'; g.lineCap='round';
  // hair that falls behind the shoulders
  if(!o.hood&&hatK!=='helm'&&['long','braids','pigtails','pony','curly','wild'].includes(hd)){
    g.fillStyle=D(hair,0.15);
    if(hd==='long'||hd==='curly'||hd==='wild'){ g.beginPath(); g.ellipse(0,6,hd==='wild'?40:34,hd==='long'?52:42,0,0,TAU); g.fill(); }
    if(hd==='braids'||hd==='pigtails'){ for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*30,hd==='braids'?28:6,9,hd==='braids'?26:14,s*0.2,0,TAU); g.fill(); if(hd==='braids'){ g.fillStyle=o.band||'#c84a3a'; g.fillRect(s*30-5,50,10,5); g.fillStyle=D(hair,0.15); } } }
    if(hd==='pony'){ g.beginPath(); g.ellipse(26,4,9,24,0.5,0,TAU); g.fill(); }
  }
  if(o.hood){ const hc=hx(o.hood); g.fillStyle=D(hc,0.15); g.beginPath(); g.moveTo(-52,64); g.quadraticCurveTo(-58,-48,0,-64); g.quadraticCurveTo(58,-48,52,64); g.closePath(); g.fill(); }
  if(o.cape){ g.fillStyle=D(hx(o.cape),0.1); g.beginPath(); g.moveTo(-56,66); g.quadraticCurveTo(-50,34,-30,30); g.lineTo(30,30); g.quadraticCurveTo(50,34,56,66); g.closePath(); g.fill(); }
  // shoulders and outfit
  const body=g.createLinearGradient(0,26,0,66); body.addColorStop(0,L(shirt,0.12)); body.addColorStop(1,D(shirt,0.25));
  g.fillStyle=body; g.beginPath(); g.moveTo(-50,66); g.quadraticCurveTo(-46,32,-14,28); g.lineTo(14,28); g.quadraticCurveTo(46,32,50,66); g.closePath(); g.fill();
  g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=2; g.stroke();
  if(o.pattern==='stripes'){ g.save(); g.clip(); g.strokeStyle=hx(o.patc||trim); g.globalAlpha=0.45; g.lineWidth=4; for(let x=-60;x<60;x+=12){ g.beginPath(); g.moveTo(x,26); g.lineTo(x,70); g.stroke(); } g.restore(); }
  else if(o.pattern==='dots'){ g.save(); g.clip(); g.fillStyle=hx(o.patc||trim); g.globalAlpha=0.6; for(let y=34;y<70;y+=10) for(let x=-56+(y%20?5:0);x<56;x+=10){ g.beginPath(); g.arc(x,y,2.2,0,TAU); g.fill(); } g.restore(); }
  else if(o.pattern==='plaid'){ g.save(); g.clip(); g.strokeStyle=hx(o.patc||trim); g.globalAlpha=0.35; g.lineWidth=3; for(let x=-60;x<60;x+=14){ g.beginPath(); g.moveTo(x,26); g.lineTo(x,70); g.stroke(); } for(let y=32;y<70;y+=14){ g.beginPath(); g.moveTo(-60,y); g.lineTo(60,y); g.stroke(); } g.restore(); }
  else if(o.pattern==='stars'){ g.save(); g.clip(); g.fillStyle=hx(o.patc||'#ffe08a'); for(const [x,y] of [[-34,44],[-18,58],[22,40],[36,56],[4,62],[-40,62]]){ g.beginPath(); for(let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, r=k%2?1.6:4; k?g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } g.fill(); } g.restore(); }
  if(out==='coat'||out==='robe'){ g.fillStyle=D(low,0.1); g.beginPath(); g.moveTo(-12,28); g.lineTo(0,62); g.lineTo(12,28); g.closePath(); g.fill(); g.strokeStyle=trim; g.lineWidth=3; g.beginPath(); g.moveTo(-14,28); g.lineTo(0,64); g.lineTo(14,28); g.stroke(); }
  else if(out==='overalls'){ g.fillStyle=low; g.fillRect(-22,44,44,22); g.strokeStyle=D(low,0.2); g.lineWidth=5; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*14,44); g.lineTo(s*18,28); g.stroke(); } g.fillStyle='#d8b04a'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*14,46,2.6,0,TAU); g.fill(); } }
  else if(out==='vest'){ g.fillStyle=low; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*10,30); g.quadraticCurveTo(s*40,34,s*46,66); g.lineTo(s*14,66); g.closePath(); g.fill(); } }
  else if(out==='armor'){ g.fillStyle='#8a909c'; g.beginPath(); g.moveTo(-46,66); g.quadraticCurveTo(-42,34,-14,30); g.lineTo(14,30); g.quadraticCurveTo(42,34,46,66); g.closePath(); g.fill(); g.fillStyle='#b8beca'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*34,40,14,10,s*0.3,0,TAU); g.fill(); } g.strokeStyle='rgba(0,0,0,.3)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(0,32); g.lineTo(0,66); g.stroke(); }
  else if(out==='fur'){ g.fillStyle=L(hx(o.low||'#8a6a4a'),0.25); for(let x=-40;x<=40;x+=8){ g.beginPath(); g.arc(x,32+Math.abs(x)*0.05,7,0,TAU); g.fill(); } }
  else if(out==='dress'){ g.strokeStyle=trim; g.lineWidth=3; g.beginPath(); g.ellipse(0,30,18,8,0,0,Math.PI); g.stroke(); }
  else { g.strokeStyle=trim; g.lineWidth=3; g.beginPath(); g.moveTo(-12,30); g.quadraticCurveTo(0,40,12,30); g.stroke(); }
  if(o.apron){ const ac=o.apron===true?'#e8e0d0':hx(o.apron); g.fillStyle=ac; g.beginPath(); g.moveTo(-20,40); g.lineTo(20,40); g.lineTo(24,66); g.lineTo(-24,66); g.closePath(); g.fill(); g.strokeStyle=D(ac,0.25); g.lineWidth=2; g.beginPath(); g.moveTo(-14,40); g.lineTo(-18,30); g.moveTo(14,40); g.lineTo(18,30); g.stroke(); if(o.flour){ g.fillStyle='rgba(255,255,255,.6)'; for(const [x,y] of [[-8,50],[6,56],[12,46]]){ g.beginPath(); g.arc(x,y,3,0,TAU); g.fill(); } } }
  if(o.sash){ g.strokeStyle=hx(o.sash); g.lineWidth=7; g.beginPath(); g.moveTo(-34,36); g.lineTo(30,66); g.stroke(); }
  if(o.bag){ g.strokeStyle=hx(o.bag); g.lineWidth=4; g.beginPath(); g.moveTo(-30,32); g.lineTo(26,66); g.stroke(); }
  if(o.shawl){ g.fillStyle=hx(o.shawl); g.beginPath(); g.moveTo(-46,40); g.quadraticCurveTo(0,58,46,40); g.lineTo(40,32); g.quadraticCurveTo(0,46,-40,32); g.closePath(); g.fill(); }
  if(o.necklace){ g.strokeStyle=hx(o.necklace); g.lineWidth=2; g.beginPath(); g.arc(0,26,14,0.3,Math.PI-0.3); g.stroke(); g.fillStyle=hx(o.necklace); g.beginPath(); g.arc(0,40,3.5,0,TAU); g.fill(); }
  // neck
  g.fillStyle=D(skin,0.12); g.fillRect(-9,18,18,14);
  if(o.scarf){ const sc=hx(o.scarf); g.fillStyle=sc; g.beginPath(); g.ellipse(0,28,22,8,0,0,TAU); g.fill(); g.fillRect(8,28,10,24); g.fillStyle=D(sc,0.2); g.fillRect(8,46,10,6); }
  // ears
  g.fillStyle=D(skin,0.06); for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*25,0,6,9,0,0,TAU); g.fill(); }
  if(o.earrings){ g.fillStyle='#ffd84a'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*26,10,2.6,0,TAU); g.fill(); } }
  // head
  const fg=g.createRadialGradient(-8,-12,4,0,-2,34); fg.addColorStop(0,L(skin,0.18)); fg.addColorStop(1,D(skin,0.12));
  g.fillStyle=fg; g.beginPath(); g.ellipse(0,-2,24,old?29:30,0,0,TAU); g.fill(); g.strokeStyle='rgba(0,0,0,.25)'; g.lineWidth=1.5; g.stroke();
  if(o.blush||kid){ g.fillStyle='rgba(230,110,110,.28)'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*13,9,6,3.5,0,0,TAU); g.fill(); } }
  if(o.freckles){ g.fillStyle='rgba(140,80,40,.45)'; for(const [x,y] of [[-14,5],[-10,8],[-16,9],[10,7],[14,5],[13,9]]){ g.beginPath(); g.arc(x,y,1.1,0,TAU); g.fill(); } }
  if(o.soot){ g.fillStyle='rgba(40,30,25,.3)'; g.beginPath(); g.ellipse(-12,12,5,3,0.3,0,TAU); g.fill(); }
  if(old){ g.strokeStyle='rgba(120,70,50,.35)'; g.lineWidth=1.2; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*17,-6); g.lineTo(s*21,-4); g.moveTo(s*17,-3); g.lineTo(s*21,-1); g.stroke(); } }
  // eyes and brows
  const lidSkin=mixHex(skin,'#000000',0.04), browC=D(o.beardc?hx(o.beardc):hair,0.1);
  for(const s of [-1,1]){
    if(o.eyepatch&&s===1){ g.fillStyle='#1a1a1a'; g.beginPath(); g.ellipse(10,-3,7,6,0,0,TAU); g.fill(); g.strokeStyle='#1a1a1a'; g.lineWidth=2; g.beginPath(); g.moveTo(-22,-12); g.lineTo(22,-8); g.stroke(); continue; }
    pxEye(g,s*10,-3,s,{rx:5.4,ry:4.4,r:3,iris:o.eye||'#3a2a1a',skin:lidSkin,lash:D(hair,0.35)});
  }
  pxBrows(g,{x:10,w:5,y:-11,col:browC,lw:old?3.4:2.6,arch:3});
  g.strokeStyle=D(skin,0.3); g.lineWidth=2; g.beginPath(); g.moveTo(-1,0); g.quadraticCurveTo(3,7,-1,8); g.stroke();
  // mouth, mustache, beard
  const bc=o.beardc?hx(o.beardc):hair;
  if(o.beard){ const big=o.beard==='big'; g.fillStyle=bc; g.beginPath(); g.moveTo(-23,2); g.quadraticCurveTo(-24,big?38:28,0,big?44:32); g.quadraticCurveTo(24,big?38:28,23,2); g.quadraticCurveTo(12,14,0,13); g.quadraticCurveTo(-12,14,-23,2); g.fill(); }
  pxMouth(g,{y:15,w:7,c:5,col:'#8a3a2a',lw:2.4});
  if(o.stache){ const big=o.stache==='big'; g.fillStyle=bc; g.beginPath(); g.moveTo(0,10); g.quadraticCurveTo(-8,8,-big*6-12,big?16:13); g.quadraticCurveTo(-8,15,0,12); g.quadraticCurveTo(8,15,big*6+12,big?16:13); g.quadraticCurveTo(8,8,0,10); g.fill(); if(big){ g.strokeStyle=bc; g.lineWidth=2.5; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*17,15); g.quadraticCurveTo(s*22,10,s*20,6); g.stroke(); } } }
  if(o.pipe){ g.strokeStyle='#4a2e18'; g.lineWidth=3; g.beginPath(); g.moveTo(6,16); g.lineTo(18,20); g.stroke(); g.fillStyle='#4a2e18'; g.fillRect(16,14,7,8); }
  // hair on top
  if(!o.hood&&hatK!=='helm'){
    g.fillStyle=hair;
    if(hd==='bald'){ g.fillStyle=hair; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*20,-8,6,12,0,0,TAU); g.fill(); } g.fillStyle='rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-6,-24,8,4,-0.3,0,TAU); g.fill(); }
    else if(hd==='spiky'){ g.beginPath(); g.moveTo(-26,-12); for(let i=0;i<7;i++){ const x=-24+i*8; g.lineTo(x+4,-44-((i%2)?4:10)); g.lineTo(x+8,-22); } g.lineTo(26,-12); g.quadraticCurveTo(0,-28,-26,-12); g.fill(); }
    else if(hd==='curly'||hd==='wild'){ for(let i=0;i<9;i++){ const a=Math.PI+i*Math.PI/8; g.beginPath(); g.arc(Math.cos(a)*22,-6+Math.sin(a)*24,hd==='wild'?9:7.5,0,TAU); g.fill(); } }
    else if(hd==='bun'){ g.beginPath(); g.ellipse(0,-14,27,22,0,Math.PI,0); g.fill(); g.beginPath(); g.arc(0,-40,12,0,TAU); g.fill(); g.strokeStyle=D(hair,0.25); g.lineWidth=1.5; g.beginPath(); g.arc(0,-40,7,0.5,3); g.stroke(); }
    else if(hd==='crop'){ g.beginPath(); g.ellipse(0,-16,25,18,0,Math.PI,0); g.fill(); }
    else { g.beginPath(); g.ellipse(0,-14,27,22,0,Math.PI,0); g.fill(); g.beginPath(); g.moveTo(-26,-12); g.quadraticCurveTo(-14,-2,-2,-16); g.quadraticCurveTo(8,-6,24,-12); g.lineTo(26,-18); g.lineTo(-26,-18); g.fill(); }
    g.fillStyle='rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(-8,-28,10,4,-0.3,0,TAU); g.fill();
    if(o.flower){ g.fillStyle=hx(o.flower); for(let k=0;k<5;k++){ const a=k*TAU/5; g.beginPath(); g.arc(-18+Math.cos(a)*4,-24+Math.sin(a)*4,3.2,0,TAU); g.fill(); } g.fillStyle='#ffe066'; g.beginPath(); g.arc(-18,-24,2.4,0,TAU); g.fill(); }
  }
  if(o.hood){ const hc=hx(o.hood); g.fillStyle=hc; g.beginPath(); g.moveTo(-30,20); g.quadraticCurveTo(-36,-46,0,-46); g.quadraticCurveTo(36,-46,30,20); g.quadraticCurveTo(26,-30,0,-32); g.quadraticCurveTo(-26,-30,-30,20); g.fill(); }
  // glasses and goggles
  if(o.glasses){ g.strokeStyle='#3a2a1a'; g.lineWidth=2; for(const s of [-1,1]){ g.beginPath(); g.arc(s*10,-3,7,0,TAU); g.stroke(); } g.beginPath(); g.moveTo(-3,-3); g.lineTo(3,-3); g.stroke(); g.fillStyle='rgba(200,230,255,.18)'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*10,-3,6,0,TAU); g.fill(); } }
  // hats
  const hc=hx(o.hatc||'#5a4a2a');
  if(hatK==='chef'){ g.fillStyle='#f4f2ea'; for(const [x,y,r] of [[-14,-44,14],[0,-50,16],[14,-44,14]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); } g.fillRect(-22,-38,44,12); g.strokeStyle='rgba(0,0,0,.12)'; g.lineWidth=1.5; g.strokeRect(-22,-38,44,12); }
  else if(hatK==='straw'){ g.fillStyle='#d8b860'; g.beginPath(); g.ellipse(0,-28,50,12,0,0,TAU); g.fill(); g.fillStyle='#c8a048'; g.beginPath(); g.ellipse(0,-36,26,16,0,Math.PI,0); g.fill(); g.fillRect(-26,-37,52,6); g.fillStyle='#8a3a2a'; g.fillRect(-26,-34,52,4); }
  else if(hatK==='top'){ g.fillStyle='#1a1a1e'; g.beginPath(); g.ellipse(0,-28,40,9,0,0,TAU); g.fill(); g.fillRect(-22,-72,44,44); g.fillStyle=o.hatc?hc:'#8a2e22'; g.fillRect(-22,-40,44,6); g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(-18,-70,6,40); }
  else if(hatK==='cap'){ g.fillStyle=hc; g.beginPath(); g.ellipse(0,-28,28,17,0,Math.PI,0); g.fill(); g.fillStyle=D(hc,0.2); g.beginPath(); g.ellipse(14,-27,22,6,0.1,0,TAU); g.fill(); g.fillStyle=L(hc,0.3); g.beginPath(); g.arc(0,-44,3,0,TAU); g.fill(); }
  else if(hatK==='beanie'){ g.fillStyle=hc; g.beginPath(); g.ellipse(0,-26,28,24,0,Math.PI,0); g.fill(); g.fillStyle=D(hc,0.2); g.fillRect(-28,-30,56,8); g.fillStyle='#fff'; g.beginPath(); g.arc(0,-52,7,0,TAU); g.fill(); }
  else if(hatK==='feather'){ g.fillStyle=hc; g.beginPath(); g.ellipse(0,-30,38,10,0,0,TAU); g.fill(); g.beginPath(); g.ellipse(0,-38,24,14,0,Math.PI,0); g.fill(); g.strokeStyle='#ffd84a'; g.lineWidth=4; g.beginPath(); g.moveTo(14,-40); g.quadraticCurveTo(40,-70,46,-46); g.stroke(); }
  else if(hatK==='rain'){ g.fillStyle=hc; g.beginPath(); g.ellipse(0,-26,44,14,0,0,TAU); g.fill(); g.fillStyle=L(hc,0.15); g.beginPath(); g.ellipse(0,-34,26,18,0,Math.PI,0); g.fill(); g.strokeStyle=D(hc,0.3); g.lineWidth=1.5; g.beginPath(); g.ellipse(0,-26,44,14,0,0,TAU); g.stroke(); }
  else if(hatK==='fancy'){ g.fillStyle=hc; g.beginPath(); g.ellipse(0,-30,48,12,-0.1,0,TAU); g.fill(); g.beginPath(); g.ellipse(-4,-40,24,15,0,Math.PI,0); g.fill(); g.fillStyle='#ff7aa0'; for(let k=0;k<6;k++){ const a=k*TAU/6; g.beginPath(); g.arc(18+Math.cos(a)*5,-40+Math.sin(a)*5,4,0,TAU); g.fill(); } g.fillStyle='#ffe066'; g.beginPath(); g.arc(18,-40,3,0,TAU); g.fill(); g.strokeStyle='#4ac8a8'; g.lineWidth=3; g.beginPath(); g.moveTo(-14,-42); g.quadraticCurveTo(-36,-76,-44,-56); g.stroke(); }
  else if(hatK==='kerchief'){ g.fillStyle=hc; g.beginPath(); g.ellipse(0,-20,27,20,0,Math.PI,0); g.fill(); g.beginPath(); g.moveTo(22,-22); g.lineTo(36,-10); g.lineTo(26,-6); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.6)'; for(const [x,y] of [[-12,-30],[0,-34],[12,-30],[-4,-24]]){ g.beginPath(); g.arc(x,y,2,0,TAU); g.fill(); } }
  else if(hatK==='party'){ g.fillStyle='#e84a8a'; g.beginPath(); g.moveTo(-18,-30); g.lineTo(0,-78); g.lineTo(18,-30); g.closePath(); g.fill(); g.fillStyle='#ffd84a'; g.beginPath(); g.arc(0,-78,6,0,TAU); g.fill(); }
  else if(hatK==='wizard'){ g.fillStyle='#3a3a9a'; g.beginPath(); g.ellipse(0,-28,40,10,0,0,TAU); g.fill(); g.beginPath(); g.moveTo(-22,-30); g.quadraticCurveTo(4,-60,10,-88); g.lineTo(22,-30); g.closePath(); g.fill(); g.fillStyle='#ffe066'; g.beginPath(); g.arc(-4,-48,3,0,TAU); g.fill(); }
  else if(hatK==='crown'){ for(let k=0;k<8;k++){ g.fillStyle=['#ff7aa0','#ffd84a','#fff','#b48cff'][k%4]; g.beginPath(); g.arc(-26+k*7.4,-30-Math.sin(k/7*Math.PI)*8,5,0,TAU); g.fill(); } }
  else if(hatK==='helm'){ g.fillStyle='#8a8f9c'; g.beginPath(); g.ellipse(0,-20,30,26,0,Math.PI,0); g.fill(); g.fillRect(-30,-22,60,6); g.fillStyle='#b8beca'; g.beginPath(); g.ellipse(-8,-34,10,5,-0.3,0,TAU); g.fill(); if(o.plume){ g.fillStyle=hx(o.plume); g.beginPath(); g.ellipse(0,-50,7,16,0,0,TAU); g.fill(); } if(o.lamp){ g.fillStyle='#4a4a52'; g.fillRect(-7,-44,14,10); g.fillStyle='#ffe08a'; g.beginPath(); g.arc(0,-39,4.5,0,TAU); g.fill(); } }
  if(o.goggles){ g.fillStyle='#5a3a22'; g.fillRect(-26,-24,52,6); for(const s of [-1,1]){ g.fillStyle='#3a3a42'; g.beginPath(); g.arc(s*10,-22,8,0,TAU); g.fill(); g.fillStyle='#8ac8e8'; g.beginPath(); g.arc(s*10,-22,5.5,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.arc(s*10-2,-24,1.6,0,TAU); g.fill(); } }
  pxExtras(g,{ex:10,ey:-3,erx:5.4,ery:4.4,cheek:9,top:-22,side:25,no:{blush:!!(o.blush||kid)&&PX.blush<1}});
}
// Shellby, the old turtle: (v12 FACES) round eyes with lids, brows and a beak-mouth, and a head that nods or lifts
function faceTurtle(g){
  g.save(); pxPose(g,{py:60}); pxAura(g,0,0,64);
  g.fillStyle='#5a7a3a'; g.beginPath(); g.ellipse(0,40,46,16,0,Math.PI,0); g.fill(); g.fillStyle='#8a6a3a'; g.beginPath(); g.ellipse(0,46,52,14,0,Math.PI,0); g.fill();
  g.fillStyle='#7a9a5a'; g.beginPath(); g.ellipse(0,0,32,30,0,0,TAU); g.fill();
  g.fillStyle='#5a7a3a'; g.beginPath(); g.ellipse(0,26,22,12,0,0,Math.PI); g.fill();
  g.fillStyle='rgba(40,60,20,.18)'; for(const [x,y] of [[-18,-18],[16,-20],[0,-24],[-22,6],[22,8]]){ g.beginPath(); g.arc(x,y,3,0,TAU); g.fill(); }
  for(const s of [-1,1]) pxEye(g,s*12,-4,s,{rx:7,ry:7,r:3.6,white:'#fbfbf2',iris:'#1a1a0a',skin:'#7a9a5a',lash:'#3a4a1a',ring:'#4a5a2a'});
  pxBrows(g,{x:12,w:6,y:-15,col:'#4a5a2a',lw:2.4,arch:3});
  pxMouth(g,{y:13,w:9,c:5,col:'#3a4a1a',lw:2.5,dark:'#3a1a10'});
  pxExtras(g,{ex:12,ey:-4,erx:7,ery:7,cheek:8,top:-26,side:32});
  g.restore();
}

// test hooks (MOOD): the reader, a line's mood, and a contact sheet of portraits (rows: speakers, columns: moods)
window.__ebDbg=Object.assign(window.__ebDbg||{},{moodRead,moodName,MOOD_LIST,MOOD_SHEET,
  lineMood:(who,text,face)=>lineMood(who,{face},text),
  dlgFace:()=>DLG?{who:DLG.pWho,mood:DLG.pFace,anim:!!DLG.pAnim}:null,
  say:lines=>runDialogue(lines,()=>{ scene='play'; }),
  portraitSheet(whos,moods,cell,big){
    moods=moods||MOOD_LIST; cell=cell||104; const pad=big?24:18, top=22, W=pad+moods.length*cell, H=top+whos.length*(cell+(big?18:4));
    const c=mkCanvas(W,H), g=c.getContext('2d'); g.fillStyle='#16100c'; g.fillRect(0,0,W,H);
    g.fillStyle='#e8d8bf'; g.font='12px sans-serif'; g.textAlign='center';
    moods.forEach((m,i)=>g.fillText(m,pad+i*cell+cell/2,15));
    pcacheReset();
    whos.forEach((w,j)=>{ const y=top+j*(cell+(big?18:4));
      g.save(); g.translate(11,y+cell/2); g.rotate(-Math.PI/2); g.textAlign='center'; g.fillStyle='#e8d8bf'; g.fillText(w,0,0); g.restore();
      moods.forEach((m,i)=>{ const p=portraitGet(w,m,false); g.drawImage(p,pad+i*cell+2,y+2,cell-4,cell-4); }); });
    pcacheReset(); return c.toDataURL('image/png'); },
  // (v12 FACES) every speaker the box can show, and whether each one's face moves with the mood: for each speaker,
  // the share of pixels that differ from its neutral face, per mood (0 means the face ignores that mood)
  portraitKeys:()=>({spk:Object.keys(SPK),ev:typeof EVPORT!=='undefined'?Object.keys(EVPORT):[],cast:Object.keys(CASTBY),special:Object.keys(SPECIAL)}),
  portraitProbe(whos,moods){
    moods=moods||MOOD_LIST; const out={}; pcacheReset();
    const px=(w,m)=>{ const c=portraitGet(w,m,false); return c.getContext('2d').getImageData(0,0,176,176).data; };
    for(const w of whos){ const n=px(w,'neutral'), r={}; for(const m of moods){ if(m==='neutral') continue; const d=px(w,m); let k=0; for(let i=0;i<d.length;i+=4) if(Math.abs(d[i]-n[i])+Math.abs(d[i+1]-n[i+1])+Math.abs(d[i+2]-n[i+2])>24) k++; r[m]=+(k/(176*176)).toFixed(4); }
      out[w]={route:typeof EVPORT!=='undefined'&&EVPORT[w]?'ev':CASTBY[w]?'cast':SPECIAL[w]?'special':'base',d:r}; }
    pcacheReset(); return out; },
  portraitURLs(whos,mood){ pcacheReset(); const r=whos.map(w=>portraitGet(w,mood||'neutral',false).toDataURL('image/png')); pcacheReset(); return r; }});
