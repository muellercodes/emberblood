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
  const cp=l=>Array.isArray(l)?l:Object.assign({},l); DLG={lines:lines.map(cp),i:0,chars:0,shown:-1,done,mood:opt&&opt.mood||null,fullAt:0,lockT:0,optsAt:0,skipArm:0};
  $('#dlgNext').textContent=usingTouch||PAD.dev==='touch'||coarsePtr()?'Tap ▸':'Click or Space ▸';
  logAdd({k:'sep'}); dlgSkipLabel();
  try{ Music.duck(true); }catch(e){}
  show('dialogue'); setLine();
}
function lineParts(l){ return Array.isArray(l)?{who:l[0],text:l[1],opts:l[2]}:l; }
function endDialogue(){ const d=DLG&&DLG.done; DLG=null; hideAll(); try{ Music.duck(false); }catch(e){} if(d) d(); }
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
  drawPortrait(who); DLG.chars=0; DLG.shown=-1; $('#dlgSay').textContent='';
  const box=$('#dlgOpts'); box.innerHTML=''; DLG.opts=null; box.hidden=true; $('#dlgNext').hidden=false;
  if(L.opts){ let o=typeof L.opts==='function'?L.opts():L.opts; o=o.filter(q=>q&&(!q.cond||q.cond())); if(o.length) DLG.opts=o; DLG.hub=L; }
}
function showOpts(){
  const box=$('#dlgOpts'); if(!DLG||!DLG.opts||box.childElementCount) return;
  DLG.opts.forEach((o,i)=>{ const b=document.createElement('button'); b.type='button'; b.className='opt'+(o.key&&G&&G.seenTalk&&G.seenTalk[o.key]?' seen':'')+(o.tone?' t-'+o.tone:''); b.innerHTML=`<span class="k">${i+1}</span>${escapeHtml(simplify(typeof o.t==='function'?o.t():o.t))}${o.tag?`<span class="tag">${escapeHtml(o.tag)}</span>`:''}`; b.addEventListener('click',e=>{ e.stopPropagation(); dlgChoose(i); }); box.appendChild(b); });
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

// ================= portraits
function faceDragon(g,o){
  g.save(); g.scale(o.k,o.k); g.lineCap='round';
  g.strokeStyle=o.horn; g.lineWidth=10;
  for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*22,-34); g.quadraticCurveTo(s*44,-62,s*(o.big?66:50),-78); g.stroke(); }
  g.lineWidth=6; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*32,-14); g.quadraticCurveTo(s*52,-22,s*60,-40); g.stroke(); }
  if(o.frill){ g.fillStyle=o.dark; for(const s of [-1,1]) for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(s*34,-6+i*12); g.lineTo(s*62,-16+i*16); g.lineTo(s*36,4+i*12); g.closePath(); g.fill(); } }
  g.fillStyle=o.skin; g.beginPath(); g.moveTo(-36,-30); g.quadraticCurveTo(0,-60,36,-30); g.quadraticCurveTo(46,2,26,32); g.quadraticCurveTo(0,54,-26,32); g.quadraticCurveTo(-46,2,-36,-30); g.closePath(); g.fill();
  g.fillStyle='rgba(0,0,0,.18)'; for(let i=0;i<10;i++){ g.beginPath(); g.arc(-20+(i%5)*10,-34+Math.floor(i/5)*9+(i%2)*3,2.6,0,TAU); g.fill(); }
  g.fillStyle=o.snout; g.beginPath(); g.ellipse(0,26,21,16,0,0,TAU); g.fill();
  g.fillStyle=o.dark; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*7,20,3.4,2.2,s*0.3,0,TAU); g.fill(); }
  for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*5,-12); g.lineTo(s*32,-20); g.lineTo(s*30,-9); g.closePath(); g.fill(); }
  g.save(); g.shadowColor=o.eye; g.shadowBlur=12; g.fillStyle=o.eye; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*18,-3,7.5,4.8,s*0.22,0,TAU); g.fill(); } g.restore();
  g.fillStyle='#160400'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*18,-3,1.7,4.2,0,0,TAU); g.fill(); }
  g.strokeStyle=o.dark; g.lineWidth=2.5; g.beginPath(); g.moveTo(-17,36); g.quadraticCurveTo(0,43,17,36); g.stroke();
  if(o.teeth){ g.fillStyle='#efe6d2'; for(const i of [-3,-2,-1,1,2,3]){ const x=i*5; g.beginPath(); g.moveTo(x-2,37); g.lineTo(x,43); g.lineTo(x+2,37); g.closePath(); g.fill(); } }
  if(o.cracks){ g.strokeStyle='rgba(255,120,40,.85)'; g.lineWidth=1.8; g.beginPath(); g.moveTo(-26,-24); g.lineTo(-18,-16); g.lineTo(-22,-6); g.moveTo(24,-28); g.lineTo(16,-20); g.lineTo(20,-12); g.moveTo(-4,-44); g.lineTo(2,-34); g.lineTo(-2,-26); g.stroke(); }
  g.restore();
}
function faceKobold(g){
  g.fillStyle='#6a5426'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*24,-24); g.lineTo(s*58,-46); g.lineTo(s*34,-4); g.closePath(); g.fill(); }
  g.fillStyle='#a58a3e'; g.beginPath(); g.ellipse(0,-4,34,36,0,0,TAU); g.fill();
  g.fillStyle='#c1a65e'; g.beginPath(); g.ellipse(0,24,20,16,0,0,TAU); g.fill();
  g.fillStyle='#4a3a18'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*6,20,3,2,0,0,TAU); g.fill(); }
  g.fillStyle='#ffdf4a'; g.beginPath(); g.ellipse(-14,-6,6,4.5,0,0,TAU); g.fill(); g.fillStyle='#1a1000'; g.beginPath(); g.ellipse(-14,-6,1.5,3.5,0,0,TAU); g.fill();
  g.strokeStyle='#3a2a10'; g.lineWidth=2.5; g.beginPath(); g.moveTo(9,-6); g.lineTo(20,-4); g.stroke();
  g.strokeStyle='#5a2a14'; g.lineWidth=3; g.beginPath(); g.moveTo(9,-18); g.lineTo(21,6); g.stroke();
  g.fillStyle='#8a6a2a'; g.fillRect(-30,-38,60,7);
  g.fillStyle='#efe6d2'; for(let i=-2;i<=2;i++){ const x=i*11; g.beginPath(); g.moveTo(x-5,-36); g.lineTo(x,-58+Math.abs(i)*5); g.lineTo(x+5,-36); g.closePath(); g.fill(); }
  g.strokeStyle='#4a3a18'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-14,32); g.quadraticCurveTo(0,40,14,30); g.stroke();
  g.fillStyle='#efe6d2'; g.beginPath(); g.moveTo(6,33); g.lineTo(9,40); g.lineTo(11,32); g.closePath(); g.fill();
}
function faceElder(g){
  g.fillStyle='#4a5a2e'; g.beginPath(); g.moveTo(-50,62); g.quadraticCurveTo(-58,-50,0,-64); g.quadraticCurveTo(58,-50,50,62); g.closePath(); g.fill();
  g.fillStyle='#e6e1d6'; g.beginPath(); g.ellipse(0,-6,32,40,0,0,TAU); g.fill();
  g.fillStyle='#d9a98a'; g.beginPath(); g.ellipse(0,4,24,30,0,0,TAU); g.fill();
  g.fillStyle='#2a1a10'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*9,-2,2.6,0,TAU); g.fill(); }
  g.strokeStyle='#b0806a'; g.lineWidth=1.5; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*4,-10); g.lineTo(s*14,-11); g.stroke(); g.beginPath(); g.moveTo(s*16,2); g.lineTo(s*19,5); g.stroke(); }
  g.strokeStyle='#8a4a3a'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-9,16); g.quadraticCurveTo(0,23,9,16); g.stroke();
  const gr=g.createRadialGradient(0,48,1,0,48,15); gr.addColorStop(0,'#ffe2a0'); gr.addColorStop(0.4,'#ff8a3a'); gr.addColorStop(1,'rgba(255,100,40,0)'); g.fillStyle=gr; g.beginPath(); g.arc(0,48,15,0,TAU); g.fill();
}
function faceHood(g){
  g.fillStyle='#5a1f6e'; g.beginPath(); g.moveTo(-50,62); g.quadraticCurveTo(-58,-50,0,-66); g.quadraticCurveTo(58,-50,50,62); g.closePath(); g.fill();
  g.strokeStyle='#e8b040'; g.lineWidth=3; g.stroke();
  g.fillStyle='#120610'; g.beginPath(); g.ellipse(0,4,27,34,0,0,TAU); g.fill();
  g.save(); g.shadowColor='#ff9a3a'; g.shadowBlur=14; g.fillStyle='#ffb04a'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*10,-2,5,2.5,s*0.2,0,TAU); g.fill(); } g.restore();
  g.strokeStyle='#e8b040'; g.lineWidth=3; g.beginPath(); g.arc(0,-6,32,-2.6,-0.54); g.stroke();
}
function faceHelm(g){
  g.fillStyle='#8a1a14'; g.beginPath(); g.moveTo(-6,-58); g.quadraticCurveTo(30,-80,52,-40); g.quadraticCurveTo(26,-56,6,-50); g.closePath(); g.fill();
  g.fillStyle='#3a3d47'; g.beginPath(); g.moveTo(-36,50); g.lineTo(-38,-20); g.quadraticCurveTo(0,-64,38,-20); g.lineTo(36,50); g.quadraticCurveTo(0,62,-36,50); g.closePath(); g.fill();
  g.fillStyle='#4f5360'; g.beginPath(); g.moveTo(-30,-22); g.quadraticCurveTo(0,-56,30,-22); g.lineTo(24,-18); g.quadraticCurveTo(0,-46,-24,-18); g.closePath(); g.fill();
  g.fillStyle='#120a08'; g.fillRect(-26,-10,52,9); g.fillRect(-5,-10,10,40);
  g.save(); g.shadowColor='#ff8a2a'; g.shadowBlur=14; g.fillStyle='rgba(255,140,50,.9)'; g.fillRect(-22,-7,44,3); g.fillRect(-2,-7,4,32); g.restore();
  g.fillStyle='#8a8f9c'; for(const [x,y] of [[-28,14],[28,14],[-26,36],[26,36]]){ g.beginPath(); g.arc(x,y,2.5,0,TAU); g.fill(); }
}
function faceFlame(g){
  const layer=(s,c)=>{ g.fillStyle=c; g.beginPath(); g.moveTo(0,-58*s); g.bezierCurveTo(30*s,-20*s,40*s,10*s,24*s,38*s); g.quadraticCurveTo(0,58*s,-24*s,38*s); g.bezierCurveTo(-40*s,10*s,-30*s,-20*s,0,-58*s); g.closePath(); g.fill(); };
  g.save(); g.translate(0,-4); layer(1,'#d9461f'); layer(0.72,'#ff9a3a'); g.translate(0,10); layer(0.42,'#ffe7a0'); g.restore();
}
function drawPortrait(who){
  const c=LOOK.sb?lookPortraitCv():$('#portrait'), g=c.getContext('2d'), S=176;
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,S,S);
  if(!LOOK.sb){
  g.fillStyle={villager:'#2a2418',townsfolk:'#1c2430',ash:'#4a170d',yara:'#1f3018',maren:'#3a1a0c',wren:'#141e34',moss:'#1e2a14',hollis:'#2e2414',pip:'#3a1a0a',goat:'#2a2620',vor:'#320605',voice:'#320605',griz:'#3a3013',morrow:'#2a1236',brood:'#381020',gloam:'#1a2410',cinder:'#251c15',narr:'#2a170c',iska:'#3a2a10',bram:'#3a2a10',oriel:'#3a2a10',sedge:'#3a2a10',tove:'#3a2a10'}[who]||'#2a170c';
  g.fillRect(0,0,S,S);
  const gl=g.createRadialGradient(S/2,S*0.42,6,S/2,S/2,S*0.75); gl.addColorStop(0,'rgba(255,150,70,.32)'); gl.addColorStop(1,'rgba(0,0,0,.45)'); g.fillStyle=gl; g.fillRect(0,0,S,S);
  }
  g.save(); g.translate(S/2,S/2+14);
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
  else if(who==='goat') faceGoat(g);
  else if(who==='gloam') faceGloam(g);
  else if(['iska','bram','oriel','sedge','tove'].includes(who)) faceWarden(g,who);
  else if(who==='shellby') faceTurtle(g);
  else if(CASTBY[who]||SPECIAL[who]){ g.scale(1.14,1.14); facePerson(g,(CASTBY[who]||SPECIAL[who]).look||{},!!(CASTBY[who]||SPECIAL[who]).kid); }
  else faceFlame(g);
  g.restore();
  if(LOOK.sb) lookPortraitFinish(who,c);
}

function faceVillager(g,shirt,hair){
  g.fillStyle=shirt||'#5a4a3a'; g.beginPath(); g.moveTo(-46,64); g.quadraticCurveTo(-40,30,0,28); g.quadraticCurveTo(40,30,46,64); g.closePath(); g.fill();
  g.fillStyle='#d8a888'; g.beginPath(); g.ellipse(0,-4,26,32,0,0,TAU); g.fill();
  g.fillStyle=hair||'#4a3020'; g.beginPath(); g.ellipse(0,-26,28,16,0,Math.PI,0); g.fill(); g.fillRect(-28,-28,8,24); g.fillRect(20,-28,8,24);
  g.fillStyle='#2a1a10'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*10,-4,2.6,0,TAU); g.fill(); }
  g.strokeStyle='#8a4a3a'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-8,14); g.quadraticCurveTo(0,19,8,14); g.stroke();
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
  eyes(g,-4,'#3a2010');
  g.fillStyle='rgba(150,70,40,.5)'; for(const [x,y] of [[-14,6],[-10,9],[-16,10],[12,6],[15,9],[10,9]]){ g.beginPath(); g.arc(x,y,1.2,0,TAU); g.fill(); }
  g.fillStyle='rgba(40,30,30,.35)'; g.beginPath(); g.ellipse(14,-14,7,3,0.4,0,TAU); g.fill();
  g.strokeStyle='#8a4a3a'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-9,15); g.quadraticCurveTo(0,21,9,15); g.stroke();
}
function faceWren(g){
  g.fillStyle='#2a4278'; g.beginPath(); g.moveTo(-50,62); g.quadraticCurveTo(-56,-46,0,-62); g.quadraticCurveTo(56,-46,50,62); g.closePath(); g.fill();
  g.fillStyle='#e6c0a0'; g.beginPath(); g.ellipse(0,0,24,30,0,0,TAU); g.fill();
  g.fillStyle='#6a3a1a'; g.beginPath(); g.ellipse(0,-22,24,12,0,Math.PI,0); g.fill();
  g.strokeStyle='#c8a050'; g.lineWidth=2; for(const s of [-1,1]){ g.beginPath(); g.arc(s*10,0,7,0,TAU); g.stroke(); } g.beginPath(); g.moveTo(-3,0); g.lineTo(3,0); g.stroke();
  eyes(g,0,'#1a2a4a');
  g.strokeStyle='#9a5a4a'; g.lineWidth=2.2; g.beginPath(); g.moveTo(-7,16); g.quadraticCurveTo(0,20,7,16); g.stroke();
}
function faceMoss(g){
  g.fillStyle='#4e6e34'; g.beginPath(); g.moveTo(-52,64); g.quadraticCurveTo(-58,-40,0,-58); g.quadraticCurveTo(58,-40,52,64); g.closePath(); g.fill();
  g.fillStyle='#d4a888'; g.beginPath(); g.ellipse(0,4,24,28,0,0,TAU); g.fill();
  g.fillStyle='#e8e4dc'; g.beginPath(); g.ellipse(0,-18,22,9,0,Math.PI,0); g.fill();
  eyes(g,0,'#2a2010',9);
  g.strokeStyle='#a87a5a'; g.lineWidth=1.4; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*14,-2); g.lineTo(s*20,-5); g.stroke(); g.beginPath(); g.moveTo(s*14,2); g.lineTo(s*20,4); g.stroke(); }
  g.fillStyle='#c08a6a'; g.beginPath(); g.ellipse(0,9,6,8,0,0,TAU); g.fill();
  g.strokeStyle='#8a4a3a'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-8,20); g.quadraticCurveTo(0,25,8,20); g.stroke();
}
function faceHollis(g){
  faceBase(g,'#d8a080','#6a5a3a');
  g.fillStyle='#8a5a32'; g.beginPath(); g.ellipse(0,18,22,16,0,0,Math.PI); g.fill(); g.fillRect(-22,10,44,9);
  eyes(g,-4);
  g.fillStyle='#d8b860'; g.beginPath(); g.ellipse(0,-30,52,12,0,0,TAU); g.fill(); g.fillStyle='#c8a048'; g.beginPath(); g.ellipse(0,-36,28,18,0,Math.PI,0); g.fill(); g.fillRect(-28,-37,56,6);
  g.fillStyle='#8a3a22'; g.fillRect(-28,-34,56,4);
}
function faceGoat(g){
  g.fillStyle='#8a7a5a'; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*12,-34); g.quadraticCurveTo(s*30,-58,s*44,-40); g.lineTo(s*36,-36); g.quadraticCurveTo(s*26,-48,s*16,-28); g.closePath(); g.fill(); }
  g.fillStyle='#ece6d8'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*34,-14,16,7,s*0.4,0,TAU); g.fill(); }
  g.fillStyle='#f6f2e8'; g.beginPath(); g.ellipse(0,-6,28,38,0,0,TAU); g.fill();
  g.fillStyle='#e0d8c6'; g.beginPath(); g.ellipse(0,24,16,14,0,0,TAU); g.fill();
  g.fillStyle='#d8ccb4'; g.beginPath(); g.moveTo(-8,36); g.lineTo(0,62); g.lineTo(8,36); g.closePath(); g.fill();
  g.fillStyle='#c8a040'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*13,-8,6,5,0,0,TAU); g.fill(); } g.fillStyle='#1a1408'; for(const s of [-1,1]) g.fillRect(s*13-4,-9,8,2.4);
  g.fillStyle='#4a3a30'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*6,24,2.6,2,0,0,TAU); g.fill(); }
  g.strokeStyle='#6a5a4a'; g.lineWidth=2; g.beginPath(); g.moveTo(-6,31); g.quadraticCurveTo(0,28,6,31); g.stroke();
}
function faceGloam(g){
  g.fillStyle='#4e6e2e'; g.beginPath(); g.ellipse(0,10,60,42,0,0,TAU); g.fill();
  g.fillStyle='#86a456'; g.beginPath(); g.ellipse(0,0,54,34,0,0,TAU); g.fill();
  g.fillStyle='rgba(20,34,10,.4)'; for(const [x,y,r] of [[-24,-6,6],[18,-12,5],[30,6,4],[-34,10,4],[4,-18,3]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  for(const s of [-1,1]){ g.fillStyle='#6a8a3e'; g.beginPath(); g.arc(s*24,-30,16,0,TAU); g.fill(); g.fillStyle='#e8d84a'; g.beginPath(); g.arc(s*24,-30,11,0,TAU); g.fill(); g.fillStyle='#1a1a08'; g.fillRect(s*24-2,-39,4,18); }
  g.strokeStyle='#1e2e12'; g.lineWidth=4; g.beginPath(); g.moveTo(-46,14); g.quadraticCurveTo(0,40,46,14); g.stroke();
  g.fillStyle='#e8e0c8'; for(let i=-4;i<=4;i++){ const x=i*9, y=20+Math.cos(i/4*1.3)*10; g.beginPath(); g.moveTo(x-3,y); g.lineTo(x,y+7); g.lineTo(x+3,y); g.closePath(); g.fill(); }
}
function faceWarden(g,who){
  const hue={iska:'255,214,150',bram:'255,190,120',oriel:'255,226,170',sedge:'220,230,160',tove:'210,230,255'}[who];
  const gl=g.createRadialGradient(0,0,4,0,0,70); gl.addColorStop(0,`rgba(${hue},.55)`); gl.addColorStop(1,`rgba(${hue},0)`); g.fillStyle=gl; g.beginPath(); g.arc(0,0,70,0,TAU); g.fill();
  g.fillStyle=`rgba(${hue},.8)`; g.beginPath(); g.moveTo(-44,64); g.quadraticCurveTo(-40,26,0,24); g.quadraticCurveTo(40,26,44,64); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(0,-6,24,30,0,0,TAU); g.fill();
  if(who==='bram'){ g.beginPath(); g.ellipse(0,18,22,18,0,0,Math.PI); g.fill(); }
  if(who==='tove'){ g.beginPath(); g.ellipse(0,-26,30,14,0,Math.PI,0); g.fill(); }
  g.fillStyle='rgba(255,255,255,.95)'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*9,-6,4,2.6,0,0,TAU); g.fill(); }
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
  for(const s of [-1,1]){
    if(o.eyepatch&&s===1){ g.fillStyle='#1a1a1a'; g.beginPath(); g.ellipse(10,-3,7,6,0,0,TAU); g.fill(); g.strokeStyle='#1a1a1a'; g.lineWidth=2; g.beginPath(); g.moveTo(-22,-12); g.lineTo(22,-8); g.stroke(); continue; }
    g.fillStyle='#fbf6ee'; g.beginPath(); g.ellipse(s*10,-3,5.4,4.4,0,0,TAU); g.fill();
    g.fillStyle=o.eye||'#3a2a1a'; g.beginPath(); g.arc(s*10+0.5,-2.6,3,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(s*10+1.6,-3.8,1.1,0,TAU); g.fill();
    g.strokeStyle=D(o.beardc?hx(o.beardc):hair,0.1); g.lineWidth=old?3.4:2.6; g.beginPath(); g.moveTo(s*5,-11); g.quadraticCurveTo(s*10,-14,s*15,-11); g.stroke();
  }
  g.strokeStyle=D(skin,0.3); g.lineWidth=2; g.beginPath(); g.moveTo(-1,0); g.quadraticCurveTo(3,7,-1,8); g.stroke();
  // mouth, mustache, beard
  const bc=o.beardc?hx(o.beardc):hair;
  if(o.beard){ const big=o.beard==='big'; g.fillStyle=bc; g.beginPath(); g.moveTo(-23,2); g.quadraticCurveTo(-24,big?38:28,0,big?44:32); g.quadraticCurveTo(24,big?38:28,23,2); g.quadraticCurveTo(12,14,0,13); g.quadraticCurveTo(-12,14,-23,2); g.fill(); }
  g.strokeStyle='#8a3a2a'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-7,15); g.quadraticCurveTo(0,20,7,15); g.stroke();
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
}
function faceTurtle(g){
  g.fillStyle='#7a9a5a'; g.beginPath(); g.ellipse(0,0,32,30,0,0,TAU); g.fill();
  g.fillStyle='#5a7a3a'; g.beginPath(); g.ellipse(0,26,22,12,0,0,Math.PI); g.fill();
  g.fillStyle='#fff'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*12,-4,7,0,TAU); g.fill(); } g.fillStyle='#1a1a0a'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*12,-3,3.5,0,TAU); g.fill(); }
  g.strokeStyle='#4a5a2a'; g.lineWidth=2; for(const s of [-1,1]){ g.beginPath(); g.arc(s*12,-8,9,3.6,5.8); g.stroke(); }
  g.strokeStyle='#3a4a1a'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-10,14); g.quadraticCurveTo(0,20,10,14); g.stroke();
}
