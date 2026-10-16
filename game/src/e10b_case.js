// ================= v10 Case Book (e10b_case): a journal tab with the mysteries, the clue cards Ash found and the
// questions he can work out (deductions from the story data, e10_story). A wrong pick shows a hint and never fails;
// on Easy the right pick glows after one miss. A small book on the HUD pulses when there is something new; tapping it
// opens this tab. Everything is drawn with the journal's own colour variables, so the Storybook and Classic looks both
// work, and every button is at least 46 px tall for fingers.

const CB10={wrong:{},flash:{},bookR:null,iconCache:new Map(),openAt:0};

// the tab button (a12b_ui binds every #jTabs button when it loads, after this file)
(function cbTab(){
  try{
    const jt=$('#jTabs'); if(!jt||jt.querySelector('[data-t="case"]')) return;
    const b=document.createElement('button'); b.type='button'; b.dataset.t='case'; b.setAttribute('aria-pressed','false'); b.hidden=true;
    b.innerHTML='Case Book<i class="cb10-dot" hidden></i>';
    const after=jt.querySelector('[data-t="story"]'); if(after&&after.nextSibling) jt.insertBefore(b,after.nextSibling); else jt.appendChild(b);
  }catch(e){}
})();
(function cbCss(){
  if(document.getElementById('cb10css')) return;
  const st=document.createElement('style'); st.id='cb10css';
  st.textContent=`
#jTabs button[data-t="case"]{position:relative}
.cb10-dot{position:absolute;top:4px;right:6px;width:9px;height:9px;border-radius:50%;background:#ff6a3a;box-shadow:0 0 0 2px rgba(0,0,0,.35);animation:cb10pulse 1.2s ease-in-out infinite}
.cb10-dot[hidden]{display:none}
@keyframes cb10pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}
.cb10{color:var(--ink);font-size:15px;line-height:1.45}
.cb10-head{display:flex;gap:12px;align-items:center;margin:0 0 12px}
.cb10-head svg{flex:none}
.cb10-head b{display:block;font-family:var(--f-display,inherit);font-size:18px;color:var(--gold);letter-spacing:.03em}
.cb10-head small{display:block;color:var(--muted);font-size:13px}
.cb10-m{border:1px solid rgba(255,190,110,.22);border-radius:14px;padding:12px;margin:0 0 14px;background:rgba(0,0,0,.18)}
.cb10-mt{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0 0 10px}
.cb10-mt h4{margin:0;font-size:16px;color:var(--ink);flex:1 1 220px;font-family:var(--f-display,inherit);letter-spacing:.02em}
.cb10-tag{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--ember);border:1px solid currentColor;border-radius:999px;padding:2px 8px}
.cb10-prog{font-size:12px;color:var(--muted)}
.cb10-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:10px;margin:0 0 10px}
.cb10-card{position:relative;display:flex;gap:10px;align-items:flex-start;padding:10px 10px 10px 8px;border-radius:10px;background:rgba(255,236,200,.08);border:1px solid rgba(255,214,150,.25);transform:rotate(-.5deg)}
.cb10-card:nth-child(2n){transform:rotate(.6deg)}
.cb10-card p{margin:0;font-size:14px;color:var(--ink)}
.cb10-ic{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(255,200,120,.16);border:1px solid rgba(255,214,150,.35);color:var(--gold)}
.cb10-ic img{width:30px;height:30px;image-rendering:auto}
.cb10-new{position:absolute;top:-8px;right:8px;font-size:10px;font-weight:900;letter-spacing:.1em;background:#ff6a3a;color:#fff;border-radius:6px;padding:1px 6px;box-shadow:0 2px 0 rgba(0,0,0,.3);animation:cb10pop .5s ease-out}
@keyframes cb10pop{0%{transform:scale(.3)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
.cb10-q{border-radius:12px;padding:12px;margin:0 0 10px;border:2px solid rgba(255,200,110,.55);background:rgba(255,190,90,.08)}
.cb10-q.locked{border-style:dashed;border-color:rgba(255,214,150,.3);background:none;color:var(--muted)}
.cb10-q.solved{border-color:rgba(120,210,130,.7);background:rgba(110,200,120,.08)}
.cb10-ask{display:flex;gap:10px;align-items:center;font-weight:800;font-size:16px;color:var(--ink);margin:0 0 10px}
.cb10-ask i{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:900;background:var(--gold);color:#2a1408}
.cb10-q.solved .cb10-ask i{background:#5ac86a}
.cb10-q.locked .cb10-ask{font-weight:600;font-size:14px;color:var(--muted);margin:0}
.cb10-q.locked .cb10-ask i{background:none;border:2px dashed currentColor;color:var(--muted)}
.cb10-picks{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}
.cb10-pick{font:inherit;font-size:16px;font-weight:700;min-height:48px;padding:10px 12px;border-radius:12px;cursor:pointer;color:var(--ink);text-align:center;
  background:linear-gradient(180deg,var(--btn-hi,#3a2418),var(--btn,#2a1810));border:2px solid var(--edge,rgba(255,170,90,.4));touch-action:manipulation}
.cb10-pick:hover,.cb10-pick:focus-visible{border-color:var(--gold);outline:none}
.cb10-pick.no{opacity:.55;border-color:#c85a4a;animation:cb10shake .35s}
@keyframes cb10shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.cb10-pick.glow{border-color:#ffd24a;box-shadow:0 0 0 3px rgba(255,210,74,.45),0 0 18px rgba(255,200,60,.65);animation:cb10glow 1.1s ease-in-out infinite}
@keyframes cb10glow{0%,100%{box-shadow:0 0 0 3px rgba(255,210,74,.35),0 0 10px rgba(255,200,60,.4)}50%{box-shadow:0 0 0 4px rgba(255,210,74,.7),0 0 22px rgba(255,200,60,.85)}}
.cb10-hint{margin:10px 0 0;padding:9px 12px;border-radius:12px;background:rgba(255,236,200,.1);border:1px solid rgba(255,214,150,.3);color:var(--ink);font-size:14px;position:relative}
.cb10-hint b{color:var(--gold)}
.cb10-ans{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:16px;font-weight:800;color:var(--ink)}
.cb10-stamp{display:inline-block;transform:rotate(-6deg);border:3px solid #5ac86a;color:#5ac86a;border-radius:8px;padding:0 8px;font-size:13px;font-weight:900;letter-spacing:.12em}
.cb10-q.solved.just .cb10-stamp{animation:cb10pop .6s ease-out}
.cb10-dots{display:inline-flex;gap:5px;margin-left:6px;vertical-align:middle}
.cb10-dots span{width:10px;height:10px;border-radius:50%;border:2px solid currentColor}
.cb10-dots span.on{background:var(--gold);border-color:var(--gold)}
.cb10-empty{text-align:center;color:var(--muted);padding:18px 8px}
.cb10-empty svg{opacity:.8;margin-bottom:6px}
html.sb .cb10-m{background:#fffaf0;border:2px solid #3b2233;box-shadow:0 3px 0 #3b2233}
html.sb .cb10-card{background:#fff;border:2px solid #3b2233;box-shadow:0 3px 0 rgba(59,34,51,.85)}
html.sb .cb10-ic{background:#ffe7b6;border:2px solid #3b2233;color:#c8542a}
html.sb .cb10-q{background:#fff4d6;border:2px solid #3b2233;box-shadow:0 3px 0 #3b2233}
html.sb .cb10-q.locked{background:transparent;border:2px dashed rgba(59,34,51,.45);box-shadow:none}
html.sb .cb10-q.solved{background:#eaf8e4;border-color:#3b8a4a}
html.sb .cb10-pick{background:linear-gradient(180deg,#fff6dc 0%,#ffe6b0 60%,#f6d494 100%);border:3px solid #3b2233;box-shadow:inset 0 2px 0 rgba(255,255,255,.75),0 4px 0 #3b2233}
html.sb .cb10-pick.no{border-color:#c8542a}
html.sb .cb10-pick.glow{box-shadow:0 0 0 4px #ffd24a,0 4px 0 #3b2233}
html.sb .cb10-hint{background:#fff;border:2px solid #3b2233}
html.sb .cb10-new{box-shadow:0 2px 0 #3b2233}
@media (max-width:520px){.cb10-cards{grid-template-columns:1fr}.cb10-picks{grid-template-columns:1fr}.cb10-m{padding:10px}.cb10-ask{font-size:15px}}
`;
  document.head.appendChild(st);
})();

// ---------- icons: a look called icon_<name> (art files) wins; else a small built-in drawing; else a question mark
const CB10_SVG={
  gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5l1.6 2.6 3-.7.6 3 2.8 1.3-1.3 2.8 1.3 2.8-2.8 1.3-.6 3-3-.7L12 21.5l-1.6-2.6-3 .7-.6-3-2.8-1.3 1.3-2.8-1.3-2.8 2.8-1.3.6-3 3 .7z"/>',
  board:'<rect x="3.5" y="4" width="17" height="12" rx="1.5"/><path d="M7 20l2-4M17 20l-2-4M7 8h10M7 11h7"/>',
  bird:'<path d="M4 14c3 0 5-3 8-3 2 0 3-2 3-4 0-1.5 1.5-2.5 3-2 1 .3 1.5 1 2 1.5l-2 .5c.5 3-1.5 7-6 8.5L8 19H5l2-2c-1.5-.5-2.5-1.5-3-3z"/><circle cx="17.5" cy="6.5" r=".6"/>',
  prints:'<ellipse cx="8" cy="8" rx="2.4" ry="3.4"/><ellipse cx="8" cy="3.6" rx="1.4" ry="1.2"/><ellipse cx="15.5" cy="16" rx="2.4" ry="3.4"/><ellipse cx="15.5" cy="11.6" rx="1.4" ry="1.2"/>',
  news:'<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M7 8h7M7 11h7M7 14h4"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  moth:'<path d="M12 7c-2-4-8-4-8 1 0 3 4 4 8 3 4 1 8 0 8-3 0-5-6-5-8-1z"/><path d="M12 11c-1.5 2-5 3-5 6 0 1.5 2 2 3 1l2-3 2 3c1 1 3 .5 3-1 0-3-3.5-4-5-6z"/><path d="M12 6V3M11 3l-2-1M13 3l2-1"/>',
  letter:'<rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="M4 7l8 6 8-6"/>',
  note:'<path d="M6 3.5h9l3 3v14H6z"/><path d="M9 10h6M9 13h6M9 16h4"/>',
  key:'<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H20M17 12v3M19.5 12v2"/>',
  eye:'<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.6"/>',
  map:'<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>',
  book:'<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v13c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v13"/>',
  lamp:'<path d="M9 3h6l1 4H8z"/><path d="M8 7h8v6a4 4 0 0 1-8 0z"/><path d="M10 17h4v3h-4z"/>',
  rope:'<path d="M6 4c6 2 6 6 0 8s-6 6 0 8M14 4c6 2 6 6 0 8"/>',
  dust:'<circle cx="7" cy="8" r="1.2"/><circle cx="13" cy="6" r="1"/><circle cx="17" cy="11" r="1.3"/><circle cx="10" cy="13" r="1"/><circle cx="15" cy="17" r="1.2"/><circle cx="7" cy="17" r=".9"/>',
  magnifier:'<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/>',
  fish:'<path d="M3 12c3-4 8-5 12-2l5-3v10l-5-3c-4 3-9 2-12-2z"/><circle cx="8" cy="11" r=".7"/>',
  wave:'<path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  star:'<path d="M12 3l2.6 5.6 6 .6-4.5 4 1.3 6L12 16.3 6.6 19.2l1.3-6-4.5-4 6-.6z"/>',
  heart:'<path d="M12 20s-7-4.5-8.5-9C2.5 7.5 5 4.5 8 5c2 .3 3 1.8 4 3 1-1.2 2-2.7 4-3 3-.5 5.5 2.5 4.5 6-1.5 4.5-8.5 9-8.5 9z"/>',
  mask:'<path d="M3 9c3-2 6-2 9 0 3-2 6-2 9 0-.5 5-3 7-5 7s-3-2-4-2-2 2-4 2-4.5-2-5-7z"/><ellipse cx="8" cy="11" rx="2" ry="1.3"/><ellipse cx="16" cy="11" rx="2" ry="1.3"/>',
  salt:'<path d="M8 21h8l-1-12H9z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/><circle cx="11" cy="5" r=".5"/><circle cx="13" cy="5" r=".5"/>',
  claw:'<path d="M6 18c0-6 2-10 4-12M11 19c0-6 1-11 3-14M16 19c0-5 1-9 3-11"/>',
  fire:'<path d="M12 21c-4 0-6.5-2.5-6.5-6 0-4 4-6 4-10 2 1.5 3 3 3 5 1-1 1.5-2 1.5-3 2 2 4.5 4.5 4.5 8 0 3.5-2.5 6-6.5 6z"/>',
  question:'<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7"/><circle cx="12" cy="16.5" r=".6"/>'
};
function cbIcon(name){
  const n=String(name||'question');
  if(CB10.iconCache.has(n)) return CB10.iconCache.get(n);
  let html=null;
  try{
    if(s10LookHas('icon_'+n)){ const cv=mkCanvas(64,64), g=cv.getContext('2d'); g.scale(2,2);
      let ok=false; try{ if(typeof lookDraw==='function') ok=lookDraw(g,'icon_'+n,16,16,0,null)!==false; }catch(e){}
      if(!ok){ const L=window.__ebLooks&&window.__ebLooks['icon_'+n]; if(L&&L.draw){ L.draw(g,16,16,0,null); ok=true; } }
      if(ok) html=`<img alt="" src="${cv.toDataURL()}">`; }
  }catch(e){ html=null; }
  if(!html){ const p=CB10_SVG[n]||CB10_SVG.question; html=`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`; }
  CB10.iconCache.set(n,html); return html;
}
const CB10_BOOK='<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 8c5-2 10-2 14 1 4-3 9-3 14-1v24c-5-2-10-2-14 1-4-3-9-3-14-1z" fill="#c8542a" stroke="#3b2233" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 9v24" stroke="#3b2233" stroke-width="2"/><circle cx="27" cy="18" r="5" fill="#fff3d6" stroke="#3b2233" stroke-width="2"/><path d="M30.5 21.5l4 4" stroke="#3b2233" stroke-width="3" stroke-linecap="round"/></svg>';

// ---------- what the Case Book shows
function cbFound(){ return Object.keys((G&&G.case&&G.case.clues)||{}); }
function cbUnseen(){ const C=G&&G.case; if(!C) return 0; return Object.keys(C.clues).filter(k=>!C.seen[k]).length; }
function cbReadyQ(){ return Object.values(S10.deduce).filter(D=>!G.case.solved[D.id]&&s10DeduceReady(D)); }
function cbVisible(){ return !!(G&&G.mode==='story'&&G.case&&(cbFound().length||Object.keys(G.case.solved).length)); }
// a clue's mystery: its own, else a deduction that needs it, else its chapter's first deduction's, else notes
function cbClueMystery(id){
  const C=S10.clues[id]; if(C&&C.mystery) return C.mystery;
  for(const k in S10.deduce){ const D=S10.deduce[k]; if(s10Arr(D.needs).includes(id)) return D.mystery||'notes'; }
  const own=C&&C._owner&&C._owner.d; if(own&&own.deduce){ for(const k in own.deduce) if(own.deduce[k].mystery) return own.deduce[k].mystery; }
  return 'notes';
}
function cbModel(){
  const M={}, get=id=>M[id]||(M[id]={id,def:id==='notes'?{title:S('Notes','Notes'),act:null}:s10Mystery(id),clues:[],qs:[]});
  for(const id of cbFound()) get(cbClueMystery(id)).clues.push(id);
  for(const id in S10.deduce){ const D=S10.deduce[id], need=s10Arr(D.needs), got=need.filter(c=>G.case.clues[c]).length;
    if(G.case.solved[id]||got>0) get(D.mystery||'notes').qs.push({D,got,need:need.length,state:G.case.solved[id]?'solved':got>=need.length?'ready':'locked'}); }
  const cur=G.act;
  return Object.values(M).sort((a,b)=>{ const am=a.def.main?1:0, bm=b.def.main?1:0, aa=a.def.act===cur?1:0, ba=b.def.act===cur?1:0, ar=a.qs.some(q=>q.state==='ready')?1:0, br=b.qs.some(q=>q.state==='ready')?1:0;
    return (ba-aa)||(br-ar)||(bm-am)||(a.id==='notes')-(b.id==='notes')||String(a.id).localeCompare(String(b.id)); });
}
function cbHtml(){
  const E=t=>escapeHtml(simplify(t)), model=cbModel(), C=G.case, easy=!!(G.diff&&G.diff.name==='Easy');
  const rows=[`<div class="cb10"><div class="cb10-head">${CB10_BOOK}<div><b>${E(S('Case Book','Case Book'))}</b><small>${E(S('The clues you found. Put them together and work out the answers!','Your clues. Work out the answers!'))}</small></div></div>`];
  if(!model.length) rows.push(`<div class="cb10-empty">${CB10_BOOK}<p>${E(S('No clues yet. Look closely at things, follow tracks, and ask people the right questions.','No clues yet. Look at things. Follow tracks. Ask people.'))}</p></div>`);
  for(const m of model){
    const solved=m.qs.filter(q=>q.state==='solved').length, all=m.qs.length;
    rows.push(`<section class="cb10-m" data-cbm="${escapeHtml(m.id)}"><div class="cb10-mt">${m.def.main?`<span class="cb10-tag">${E(S('Main mystery','Main mystery'))}</span>`:''}<h4>${E(s10T(m.def.title||m.def.name||m.id))}</h4><span class="cb10-prog">${m.clues.length} ${m.clues.length===1?E(S('clue','clue')):E(S('clues','clues'))}${all?` · ${solved}/${all} ${E(S('solved','solved'))}`:''}</span></div>`);
    // the questions first (what to do), then the cards
    for(const q of m.qs){
      const D=q.D, ask=E(s10T(D.ask));
      if(q.state==='locked'){ rows.push(`<div class="cb10-q locked"><div class="cb10-ask"><i>?</i><span>${E(S('A question is forming... find more clues.','Find more clues to ask a question.'))} <span class="cb10-dots" aria-label="${q.got} of ${q.need}">${Array.from({length:q.need},(_,i)=>`<span class="${i<q.got?'on':''}"></span>`).join('')}</span></span></div></div>`); continue; }
      if(q.state==='solved'){ const P=s10Arr(D.pick).find(p=>p.right); rows.push(`<div class="cb10-q solved${CB10.flash[D.id]?' just':''}"><div class="cb10-ask"><i>✓</i><span>${ask}</span></div><div class="cb10-ans"><span>${E(P?s10T(P.t):'')}</span><span class="cb10-stamp">${E(S('SOLVED','SOLVED'))}</span></div></div>`); continue; }
      const W=CB10.wrong[D.id], tries=C.tries[D.id]|0, glowOn=easy&&D.easy_glow!==false&&tries>=1;
      rows.push(`<div class="cb10-q" data-cbq="${escapeHtml(D.id)}"><div class="cb10-ask"><i>?</i><span>${ask}</span></div><div class="cb10-picks">`+
        s10Arr(D.pick).map((p,i)=>`<button type="button" class="cb10-pick${W&&W.no&&W.no.includes(i)?' no':''}${glowOn&&p.right?' glow':''}" data-cbd="${escapeHtml(D.id)}" data-cbi="${i}">${E(s10T(p.t))}</button>`).join('')+
        `</div>${W&&W.hint?`<div class="cb10-hint" role="status"><b>${E(S('Hmm.','Hmm.'))}</b> ${escapeHtml(W.hint)}</div>`:''}</div>`);
    }
    if(m.clues.length){ rows.push('<div class="cb10-cards">'); for(const id of m.clues){ const K=S10.clues[id]; rows.push(`<div class="cb10-card">${!C.seen[id]?`<span class="cb10-new">${E(S('NEW','NEW'))}</span>`:''}<span class="cb10-ic">${cbIcon(K&&K.icon)}</span><p>${E(K?s10T(K.text):id)}</p></div>`); } rows.push('</div>'); }
    rows.push('</section>');
  }
  rows.push('</div>');
  return rows.join('');
}
function cbWire(el){
  for(const b of el.querySelectorAll('button[data-cbd]')) b.addEventListener('click',e=>{ e.stopPropagation(); cbPick(b.dataset.cbd,+b.dataset.cbi); });
}
function cbPick(id,i){
  const r=s10Deduce(id,i);
  if(r.right){ delete CB10.wrong[id]; CB10.flash[id]=1; setTimeout(()=>{ delete CB10.flash[id]; },1500); }
  else if(!r.notReady&&!r.err){ const W=CB10.wrong[id]||(CB10.wrong[id]={no:[]}); if(!W.no.includes(i)) W.no.push(i); W.hint=r.hint; }
  const el=$('#jBody'), top=el?el.scrollTop:0;
  renderJour(); if(el) el.scrollTop=top;
  if(r.right) try{ const q=el&&el.querySelector('.cb10-q.solved.just'); if(q) q.scrollIntoView({block:'nearest'}); }catch(e){}
}
function cbRender(){
  const el=$('#jBody'); if(!el) return;
  el.innerHTML=cbHtml(); cbWire(el);
  // the cards are seen now (the NEW tags go next time), and the HUD book stops pulsing for them
  for(const k in G.case.clues) G.case.seen[k]=1;
}
// the tab: hidden until the first clue; a dot while there is something new
function cbTabSync(){
  const b=document.querySelector('#jTabs [data-t="case"]'); if(!b) return;
  const vis=cbVisible(); b.hidden=!vis; if(!vis&&jTab==='case') jTab='quests';
  const d=b.querySelector('.cb10-dot'); if(d) d.hidden=!(vis&&(cbUnseen()||cbReadyQ().length));
}
{ const base=renderJour; renderJour=function(){ try{ cbTabSync(); }catch(e){} base(); try{ if(jTab==='case'&&G&&G.case) cbRender(); }catch(e){ console.error(e); } }; }
function cbOpen(){ if(!G||G.mode!=='story'||scene!=='play') return; jTab='case'; openJournal(); }

// ---------- the HUD book: under the pause and sound buttons (and the weapon chip when it sits there)
function cbHud(){
  CB10.bookR=null;
  if(!G||G.mode!=='story'||scene!=='play'||!cbVisible()) return;
  const M=MUTE_R(); let y=M.y+M.h+8; const x=M.x;
  for(const h of HUD_HITS) if(h.x+h.w>x-6&&h.x<x+M.w+6&&h.y<y+44&&h.y+h.h>y-4) y=Math.max(y,h.y+h.h+8);
  const r={x,y,w:M.w,h:M.w}, unseen=cbUnseen(), ready=cbReadyQ().length, hot=unseen>0||ready>0, t=G.time;
  const fresh=S10.pulseT>G.time, k=hot?(fresh?1+0.12*Math.abs(Math.sin(t*6)):1+0.05*Math.sin(t*3.2)):1;
  ctx.save();
  if(hot){ const g0=ctx.createRadialGradient(r.x+r.w/2,r.y+r.h/2,4,r.x+r.w/2,r.y+r.h/2,34); g0.addColorStop(0,`rgba(255,200,90,${fresh?0.55:0.3})`); g0.addColorStop(1,'rgba(255,200,90,0)'); ctx.fillStyle=g0; ctx.fillRect(r.x-16,r.y-16,r.w+32,r.h+32); }
  if(LOOK.sb) sbPanel(r.x,r.y,r.w,r.h,11); else{ ctx.fillStyle='rgba(12,10,8,.6)'; rr(r.x,r.y,r.w,r.h,9); ctx.fill(); ctx.strokeStyle=hot?'rgba(255,210,120,.7)':'rgba(255,220,180,.22)'; ctx.lineWidth=1; ctx.stroke(); }
  const cx=r.x+r.w/2, cy=r.y+r.h/2;
  ctx.translate(cx,cy); ctx.scale(k,k); ctx.lineJoin='round';
  ctx.fillStyle='#c8542a'; ctx.strokeStyle='#3b2233'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(-13,-9); ctx.quadraticCurveTo(-6,-12,0,-8); ctx.quadraticCurveTo(6,-12,13,-9); ctx.lineTo(13,10); ctx.quadraticCurveTo(6,7,0,11); ctx.quadraticCurveTo(-6,7,-13,10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,11); ctx.stroke();
  ctx.fillStyle='#fff3d6'; ctx.beginPath(); ctx.arc(6,-1,4,0,TAU); ctx.fill(); ctx.stroke();
  ctx.lineWidth=2.6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(9,2); ctx.lineTo(12,5); ctx.stroke();
  ctx.setTransform(1,0,0,1,0,0); ctx.restore();
  ctx.save();
  if(hot){ const bx=r.x+r.w-4, by=r.y+4, lab=unseen?String(Math.min(9,unseen)):'?';
    ctx.fillStyle='#ff6a3a'; ctx.beginPath(); ctx.arc(bx,by,8,0,TAU); ctx.fill(); ctx.strokeStyle='#3b2233'; ctx.lineWidth=1.6; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font=`900 10px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(lab,bx,by+0.5); }
  if(!usingTouch&&!(typeof padActive==='function'&&padActive())){ ctx.font=`700 9px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.6)'; ctx.fillStyle='#ffe0b0'; ctx.strokeText('B',r.x+r.w/2,r.y+r.h+8); ctx.fillText('B',r.x+r.w/2,r.y+r.h+8); }
  ctx.restore();
  CB10.bookR=r; HUD_HITS.push({x:r.x,y:r.y,w:r.w,h:r.h,fn:cbOpen});
}
{ const base=drawHUD; drawHUD=function(){ base(); try{ cbHud(); }catch(e){ console.error(e); } }; }
// the B key opens the Case Book (when there is one)
addEventListener('keydown',e=>{ try{ if(e.code==='KeyB'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&G&&G.mode==='story'&&scene==='play'&&cbVisible()){ cbOpen(); } }catch(err){} });
window.__ebX=Object.assign(window.__ebX||{},{caseBook:{open:cbOpen,html:()=>cbHtml(),pick:cbPick,book:()=>CB10.bookR,unseen:()=>cbUnseen(),ready:()=>cbReadyQ().map(D=>D.id)}});
