// ================= the log: everything people said and every message, so a missed line is one tap away (UX build)
// logAdd() is called by the dialogue (lines, narration, the choice picked, and lines a skip jumps over), banners and
// chapter cards, taunts, speech bubbles, floating hints, ability tips and controller toasts. It lives in memory
// only (about 300 entries) and is not saved. It opens as an overlay from the dialogue box (the Log button, the
// L key or the controller's View / Share / minus button), from the pause menu, with L during play (controls build), and
// as a Log tab in the Journal.
const LOG={items:[],max:300,filter:'all',from:null,focus:null,open:false,timer:0,seq:0,cur:null};
// which entries count as Dialogue (somebody said it); everything else is a Message
const LOG_DLG={line:1,narr:1,choice:1,taunt:1,bubble:1,sep:1};
const LOG_FILTERS=[['all','All'],['dlg','Dialogue'],['msg','Messages']];
function logAdd(o){
  try{
    if(!o) return null;
    const L=LOG.items, now=Date.now();
    if(o.k==='sep'){ const last=L[L.length-1]; if(!last||last.k==='sep') return null; }
    else{
      const text=String(o.text==null?'':o.text).trim(); if(!text&&!o.sub) return null; o.text=text;
      // the same thing said again soon after: move it to the bottom with a count instead of a new row
      const same=q=>q.k===o.k&&(o.key?q.key===o.key:(q.who||'')===(o.who||'')&&q.text===text&&(q.sub||'')===(o.sub||''));
      if(o.k==='line'||o.k==='narr'){ const last=L[L.length-1]; if(last&&same(last)){ last.n++; last.t=now; return last; } }
      else if(o.k!=='choice'){
        for(let i=L.length-1,j=0;i>=0&&j<12;i--,j++){ const q=L[i]; if(now-q.t>90000) break;
          if(same(q)){ L.splice(i,1); const e=Object.assign(q,o,{t:now,n:q.text===text?q.n+1:1}); L.push(e); logChanged(); return e; } }
      }
    }
    const e={id:++LOG.seq,t:now,k:o.k,who:o.who||'',col:o.col||'',text:o.text||'',sub:o.sub||'',key:o.key||'',style:o.style||'',sk:!!o.sk,n:1};
    L.push(e); while(L.length>LOG.max) L.shift();
    if(o.k==='line'||o.k==='narr') LOG.cur=e;
    logChanged(); return e;
  }catch(err){ return null; }
}
// a speech bubble (a9i_comps.js bubble()): Pip and Ash have no name tag on their bubbles, so name them here
function logBubble(a,text,o,kind){
  let who=(o&&o.who)||'', col=(o&&o.col)||'';
  if(G&&a===G.pip){ who='Pip'; col=SPK.pip.col; }
  else if(a===player&&!who&&kind!=='narr'){ who='Ash'; col=SPK.ash.col; }
  if(who==='???') col=col||'#e0d0b0';
  logAdd({k:kind==='narr'||kind==='far'?'narr':'bubble',who:kind==='narr'||kind==='far'?'':who,col,text,bub:1});
}
let logDirty=0;
function logChanged(){ if(LOG.open&&!logDirty){ logDirty=requestAnimationFrame(()=>{ logDirty=0; if(LOG.open) logRender(logAtEnd()); }); } }

// ---------- how it looks: the journal and skills panels' style (this file builds its own DOM, body.html stays as is)
const LOG_SVG={
  log:'<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5h7.5a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 12.5V3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.6 6h5M5.6 8.5h5M5.6 11h3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  x:'<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  pick:'<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M5 3l6 5-6 5z" fill="currentColor"/></svg>'
};
const LOG_CSS=`
#logov{z-index:7}
#logov .lgp{max-width:760px;width:100%;max-height:100%;display:flex;flex-direction:column;padding:16px 18px 14px;overflow:hidden;background:rgba(22,11,9,.985)}
.lghd{display:flex;align-items:center;gap:12px;flex:none}
.lghd h2{margin:0!important;flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:10px}
.lghd h2 svg{width:24px;height:24px;color:var(--ember)}
.lgx{flex:none;width:40px;height:40px;border-radius:10px;border:1px solid var(--edge);background:linear-gradient(180deg,var(--btn-hi),var(--btn));color:var(--ink);display:grid;place-items:center;cursor:pointer;padding:0}
.lgx:hover{border-color:var(--ember)}.lgx:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.lgsub{margin:4px 0 10px!important;font-size:13px;flex:none}
.lgtabs{margin:0 0 6px;flex:none}
.lgtabs button,.lgf button{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:600}
.lgtabs button i,.lgf button i{font-style:normal;font-size:11px;font-weight:700;min-width:18px;padding:1px 6px;border-radius:9px;background:rgba(0,0,0,.35);color:var(--muted);font-variant-numeric:tabular-nums}
.lgtabs button[aria-pressed="true"] i,.lgf button[aria-pressed="true"] i{color:var(--ink)}
.lglist{flex:1 1 auto;min-height:120px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;text-align:left;padding:8px 4px 6px 2px;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 10px,#000 calc(100% - 6px),transparent 100%);mask-image:linear-gradient(180deg,transparent 0,#000 10px,#000 calc(100% - 6px),transparent 100%)}
.lglist:focus{outline:none}
.lge{position:relative;padding:8px 12px 9px 16px;margin:0 0 6px;border-radius:10px;background:rgba(0,0,0,.24);border:1px solid rgba(255,140,70,.11);--c:#d8c3a0}
.lge::before{content:'';position:absolute;left:5px;top:9px;bottom:9px;width:3px;border-radius:2px;background:var(--c);opacity:.85}
.lgh{display:flex;align-items:baseline;gap:8px;min-height:15px}
.lgw{font-family:var(--f-display);font-weight:800;font-size:12.5px;letter-spacing:.08em;color:var(--c);text-transform:uppercase;line-height:1.2}
.lgtag{font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:1px 6px;border-radius:5px;background:rgba(255,200,120,.12);color:#e8c898;font-weight:700}
.lgn{font-size:11px;font-weight:800;color:var(--gold);font-variant-numeric:tabular-nums}
.lgtm{margin-left:auto;font-size:11px;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums;opacity:.85}
.lgt{font-size:15.5px;line-height:1.45;color:var(--ink);margin-top:2px;overflow-wrap:anywhere}
.lge.k-narr{background:rgba(0,0,0,.14);--c:#7a6656}
.lge.k-narr .lgt{font-style:italic;color:#e8d8bf}
.lge.k-taunt .lgt{font-style:italic}
.lge.k-bubble{background:rgba(255,240,215,.05)}
.lge.k-bubble .lgt{font-size:14.5px}
.lge.k-choice{margin-left:28px;background:linear-gradient(90deg,rgba(120,60,20,.32),rgba(0,0,0,.18));border-color:rgba(255,195,90,.32)}
.lge.k-choice .lgt{color:var(--gold);font-weight:600;display:flex;gap:7px;align-items:baseline}
.lge.k-choice .lgt svg{flex:none;position:relative;top:1px}
.lge.msg{--c:var(--gold);background:rgba(60,30,10,.28);border-style:dashed;border-color:rgba(255,195,90,.24)}
.lge.msg .lgt b{font-family:var(--f-display);font-weight:800;color:var(--gold);letter-spacing:.03em;font-size:15px}
.lge.msg .lgs{display:block;color:var(--muted);font-size:13.5px;line-height:1.45;margin-top:1px}
.lge.k-hint .lgt{font-size:14.5px;color:#f0dcc0}
.lge.sk{opacity:.72}
.lge.cur{border-color:rgba(255,200,110,.7);box-shadow:0 0 0 1px rgba(255,200,110,.2),0 6px 22px rgba(255,140,50,.12)}
.lgsep{display:flex;align-items:center;gap:10px;margin:12px 0 8px;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ember)}
.lgsep::before,.lgsep::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(255,140,70,0),rgba(255,140,70,.35),rgba(255,140,70,0))}
.lgsep:first-child{margin-top:0}
.lgsep b{font-weight:600;color:var(--muted);letter-spacing:.06em;text-transform:none;font-size:11px}
.lgempty{padding:30px 10px;text-align:center;color:var(--muted);font-size:14px}
.lgft{display:flex;gap:12px;align-items:center;justify-content:flex-end;margin-top:10px;flex:none}
.lgkeys{flex:1;font-size:12px;color:var(--muted);text-align:left}
.lgkeys kbd{font-family:var(--f-ui);font-weight:700;color:var(--ink);background:#3a1a10;border:1px solid var(--edge);border-bottom-width:2px;border-radius:5px;padding:0 5px;font-size:11px}
.lgft .btn{width:auto;min-width:150px;text-align:center}
.lgf{margin:2px 0 10px}
.skip.dlglog{right:auto;left:0;display:inline-flex;align-items:center;gap:7px}
.skip.dlglog svg{color:var(--gold)}
.skip.dlglog .pg{font-size:.8em}
.skip.arm{border-color:var(--gold);color:var(--gold);box-shadow:0 0 0 3px rgba(255,195,90,.14),0 0 18px rgba(255,150,60,.35)}
.skip.arm b{color:var(--ink);font-weight:700}
@media (max-width:640px){
  #logov.ov{padding-left:max(10px,env(safe-area-inset-left,0px));padding-right:max(10px,env(safe-area-inset-right,0px))}
  #logov .lgp{padding:14px 12px 12px}
  .lghd h2{font-size:24px!important}
  .lge{padding:7px 10px 8px 14px}
  .lge.k-choice{margin-left:14px}
  .lgt{font-size:15px}
  .lgkeys{display:none}.lgft .btn{flex:1}
}
@media (max-height:520px){
  #logov.ov{padding-top:max(6px,env(safe-area-inset-top,0px));padding-bottom:max(6px,env(safe-area-inset-bottom,0px))}
  #logov .lgp{padding:10px 14px 8px}
  .lgsub,.lgkeys{display:none}
  .lghd h2{font-size:22px!important}
  .lgx{width:36px;height:36px}
}
`;
(function logBuildDom(){
  const st=document.createElement('style'); st.id='logCss'; st.textContent=LOG_CSS; document.body.appendChild(st);
  const ov=document.createElement('div'); ov.id='logov'; ov.className='ov dim';
  ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-labelledby','logTitle');
  ov.innerHTML=`<div class="panel lgp" id="logPanel">
    <div class="lghd"><h2 id="logTitle">${LOG_SVG.log}Log</h2><button type="button" class="lgx" id="logX" aria-label="Close the log">${LOG_SVG.x}</button></div>
    <p class="lgsub">Everything people said and every message, newest at the bottom.</p>
    <div class="seg jtabs lgtabs" id="logTabs" data-tabs role="group" aria-label="What to show">${LOG_FILTERS.map(([v,t])=>`<button type="button" data-lf="${v}" aria-pressed="${v==='all'}">${t}<i>0</i></button>`).join('')}</div>
    <div class="lglist" id="logList" data-scroll aria-live="off"></div>
    <div class="lgft"><span class="lgkeys" id="logKeys"></span><button type="button" class="btn c hot" id="logClose" data-focus>Back</button></div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',e=>{ if(e.target===ov) closeLog(); });
  $('#logX').addEventListener('click',()=>closeLog());
  $('#logClose').addEventListener('click',()=>closeLog());
  $('#logTabs').addEventListener('click',e=>{ const b=e.target.closest('button[data-lf]'); if(b) logSetFilter(b.dataset.lf); });
  // the Log button in the dialogue box, top left (the Skip button is top right, far from it)
  const box=$('#dlgBox');
  if(box){ const b=document.createElement('button'); b.type='button'; b.id='dlgLog'; b.className='skip dlglog'; b.setAttribute('aria-label','Log: everything that was said');
    b.addEventListener('click',e=>{ e.stopPropagation(); openLog(); }); box.appendChild(b); dlgLogLabel(); }
  // Log in the pause menu, under Journal (and Skills)
  const after=$('#bPauseSkills')||$('#bPauseJournal');
  if(after){ const b=document.createElement('button'); b.type='button'; b.className='btn c'; b.id='bPauseLog'; b.textContent='Log';
    after.insertAdjacentElement('afterend',b); b.addEventListener('click',()=>{ if(scene==='paused') openLog(); }); }
  // a Log tab in the Journal (a12b_ui binds every #jTabs button when it loads, after this file)
  const jt=$('#jTabs'); if(jt&&!jt.querySelector('[data-t="log"]')){ const b=document.createElement('button'); b.type='button'; b.dataset.t='log'; b.setAttribute('aria-pressed','false'); b.textContent='Log'; jt.appendChild(b); }
})();
// the dialogue box's Log button names the key or controller button that opens it
function dlgLogLabel(dev){
  const b=$('#dlgLog'); if(!b) return;
  dev=dev||curDevice(); if(dev==='kb'&&(PAD.dev==='touch'||coarsePtr())) dev='touch';
  const key=dev+(dev==='pad'?PAD.kind:'');
  if(b.dataset.dev===key) return; b.dataset.dev=key;
  b.innerHTML=`${LOG_SVG.log}<span>Log</span>${dev==='pad'?padChip(PB.SEL):dev==='kb'||dev==='mouse'?'<kbd class="pg k">L</kbd>':''}`;
}

function coarsePtr(){ try{ return matchMedia('(pointer: coarse)').matches; }catch(e){ return false; } }
// ---------- open and close (an overlay on top of the dialogue or the pause menu, which stay just as they were)
function openLog(){
  // from a conversation, the pause menu, or (key L, controls build) straight from play: the world waits while it is open
  if(LOG.open||(scene!=='dialogue'&&scene!=='paused'&&scene!=='play')) return;
  if(scene==='play'){ SFX.setFire(false); keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null; }
  LOG.from=scene; LOG.focus=document.activeElement; LOG.open=true; scene='log';
  try{ SFX.play('ui'); }catch(e){}
  LOG.filter=LOG.filter||'all';
  $('#logov').classList.add('on'); logRender(true);
  requestAnimationFrame(()=>{ const el=$('#logList'); if(LOG.open&&el) el.scrollTop=el.scrollHeight; });
  $('#logKeys').innerHTML=curDevice()==='kb'||curDevice()==='mouse'?'<kbd>Q</kbd> <kbd>E</kbd> show · <kbd>PgUp</kbd> <kbd>PgDn</kbd> scroll · <kbd>Esc</kbd> or <kbd>L</kbd> back':'';
  if(!usingTouch&&curDevice()!=='pad') setTimeout(()=>{ if(LOG.open) try{ $('#logClose').focus({preventScroll:true}); }catch(e){} },30);
  clearInterval(LOG.timer); LOG.timer=setInterval(()=>{ if(LOG.open) logRender(logAtEnd()); },20000);
}
function closeLog(){
  if(!LOG.open) return;
  LOG.open=false; clearInterval(LOG.timer);
  $('#logov').classList.remove('on');
  scene=LOG.from==='paused'?'paused':DLG?'dialogue':'play';
  try{ SFX.play('ui'); }catch(e){}
  if(scene==='play') hideAll();
  let f=LOG.focus; LOG.focus=null;
  if(f&&f.id==='dlgLog') f=$('#dlgBox');   // back on the talking box itself, not on its Log button
  if(f&&f.isConnected&&f!==document.body&&!usingTouch) setTimeout(()=>{ try{ f.focus({preventScroll:true}); }catch(e){} },20);
}
function logSetFilter(f){
  if(!LOG_FILTERS.some(q=>q[0]===f)) return;
  const ch=LOG.filter!==f; LOG.filter=f; logRender(true);
  if(ch) try{ SFX.play('ui'); }catch(e){}
}
function logFilterStep(d){ const i=LOG_FILTERS.findIndex(q=>q[0]===LOG.filter); const f=LOG_FILTERS[(i+d+LOG_FILTERS.length)%LOG_FILTERS.length][0]; logSetFilter(f); const b=$(`#logTabs button[data-lf="${f}"]`); if(b&&!usingTouch) try{ b.focus({preventScroll:true}); }catch(e){} }
function logScroll(c){ const el=$('#logList'); if(!el) return; const h=el.clientHeight*0.85; if(c==='PageUp') el.scrollTop-=h; else if(c==='PageDown') el.scrollTop+=h; else if(c==='Home') el.scrollTop=0; else el.scrollTop=el.scrollHeight; }
function logAtEnd(){ const el=$('#logList'); return !el||el.scrollTop+el.clientHeight>=el.scrollHeight-24; }

// ---------- the rows
function logAgo(t){
  const s=(Date.now()-t)/1000;
  if(s<45) return 'just now';
  if(s<90) return '1 min ago';
  if(s<3600) return `${Math.round(s/60)} min ago`;
  const h=Math.floor(s/3600); return h===1?'1 hour ago':`${h} hours ago`;
}
const logShow=(e,f)=>f==='all'||(f==='dlg'?!!LOG_DLG[e.k]:!LOG_DLG[e.k]);
function logCount(f){ let n=0; for(const e of LOG.items) if(e.k!=='sep'&&logShow(e,f)) n++; return n; }
function logRowsHtml(f){
  const E=escapeHtml, out=[]; let last='', prevSep=false;
  const list=LOG.items.filter(e=>logShow(e,f));
  for(let i=0;i<list.length;i++){
    const e=list[i];
    if(e.k==='sep'){ if(prevSep||i===list.length-1||list[i+1].k==='sep') continue; const ago=logAgo(list[i+1].t); last=ago; prevSep=true; out.push(`<div class="lgsep"><span>Conversation <b>${E(ago)}</b></span></div>`); continue; }
    prevSep=false;
    const ago=logAgo(e.t), tm=ago!==last?`<span class="lgtm">${E(ago)}</span>`:''; last=ago;
    const n=e.n>1?`<span class="lgn">×${e.n}</span>`:'', sk=e.sk?'<span class="lgtag">skipped</span>':'';
    const col=e.col||(e.k==='choice'?SPK.ash.col:'#d8c3a0'), cur=LOG.from==='dialogue'&&e===LOG.cur&&DLG?' cur':'';
    if(e.k==='banner'||e.k==='tip'||e.k==='toast'||e.k==='hint'){
      const tag=e.k==='tip'?'<span class="lgtag">Tip</span>':e.k==='toast'?'<span class="lgtag">Controller</span>':e.k==='hint'?'<span class="lgtag">Hint</span>':'';
      const body=e.k==='hint'?E(e.text):`<b>${E(e.text)}</b>${e.sub?`<span class="lgs">${E(e.sub)}</span>`:''}`;
      out.push(`<div class="lge msg k-${e.k}"${e.k==='hint'&&e.col?` style="--c:${E(e.col)}"`:''}>${tag||tm||n?`<div class="lgh">${tag}${n}${tm}</div>`:''}<div class="lgt">${body}</div></div>`);
      continue;
    }
    if(e.k==='narr'){ out.push(`<div class="lge k-narr${e.sk?' sk':''}${cur}">${tm||n||sk?`<div class="lgh">${sk}${n}${tm}</div>`:''}<div class="lgt">${E(e.text)}</div></div>`); continue; }
    if(e.k==='choice'){ out.push(`<div class="lge k-choice" style="--c:${E(col)}"><div class="lgh"><span class="lgw">You chose</span>${tm}</div><div class="lgt">${LOG_SVG.pick}<span>${E(e.text)}</span></div></div>`); continue; }
    const nm=e.who?`<span class="lgw">${E(e.who)}</span>`:'', tag=e.k==='bubble'?'<span class="lgtag">nearby</span>':'';
    const txt=e.k==='taunt'?`“${E(e.text)}”`:E(e.text);
    out.push(`<div class="lge k-${e.k}${e.sk?' sk':''}${cur}" style="--c:${E(col)}"><div class="lgh">${nm}${tag}${sk}${n}${tm}</div><div class="lgt">${txt}</div></div>`);
  }
  if(!out.length) out.push(`<div class="lgempty">${f==='msg'?'No messages yet.':'Nothing yet. Talk to someone, and what they say shows up here.'}</div>`);
  return out.join('');
}
function logRender(toEnd){
  const el=$('#logList'); if(!el) return;
  const keep=el.scrollTop;
  for(const b of document.querySelectorAll('#logTabs button')){ b.setAttribute('aria-pressed',String(b.dataset.lf===LOG.filter)); const i=b.querySelector('i'); if(i) i.textContent=String(logCount(b.dataset.lf)); }
  el.innerHTML=logRowsHtml(LOG.filter);
  if(toEnd) el.scrollTop=el.scrollHeight; else el.scrollTop=keep;
}
// the Journal's Log tab (renderJour in a12b_ui.js): the same rows, with the filter as small buttons on top
function logJourHtml(){
  return `<div class="seg lgf" role="group" aria-label="What to show">${LOG_FILTERS.map(([v,t])=>`<button type="button" data-lf="${v}" aria-pressed="${v===LOG.filter}">${t}<i>${logCount(v)}</i></button>`).join('')}</div>${logRowsHtml(LOG.filter)}`;
}
function logJourWire(el){
  for(const b of el.querySelectorAll('button[data-lf]')) b.addEventListener('click',()=>{ LOG.filter=b.dataset.lf; try{ SFX.play('ui'); }catch(e){} renderJour(); const nb=$(`#jBody button[data-lf="${LOG.filter}"]`); if(nb&&!usingTouch) try{ nb.focus({preventScroll:true}); }catch(e){} });
  // the journal may still be hidden on the first render: scroll once it shows
  el.scrollTop=el.scrollHeight; requestAnimationFrame(()=>{ if(jTab==='log') el.scrollTop=el.scrollHeight; });
}
window.__ebX=Object.assign(window.__ebX||{},{openLog,closeLog,logAdd,logFilter:f=>logSetFilter(f),
  log:()=>LOG.items.map(e=>({k:e.k,who:e.who,text:e.text,sub:e.sub,n:e.n,sk:e.sk})), logOpen:()=>LOG.open, logClear(){ LOG.items.length=0; LOG.cur=null; }});
