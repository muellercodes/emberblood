
// ================= cloud accounts and saves (Cloudflare Worker + D1)
const API_BASE='__API_BASE__';
const Cloud=(()=>{
  const base=(API_BASE.startsWith('http')?API_BASE:'').replace(/\/$/,'');
  let token=store.get('eb_token',null), user=store.get('eb_user',null), online=null, pending=null, pushT=null, lastPush=0, busy=false, lastErr='', paused='', viewing=false;
  const listeners=new Set();
  const changed=()=>{ for(const f of listeners){ try{ f(); }catch(e){} } };
  async function req(path,opt){
    opt=opt||{};
    if(!base){ const er=new Error('offline'); er.offline=true; throw er; }
    const h={'Content-Type':'application/json'}; if(token) h.Authorization='Bearer '+token;
    const ctl=typeof AbortController!=='undefined'?new AbortController():null, to=setTimeout(()=>ctl&&ctl.abort(),opt.timeout||10000);
    let r;
    try{ r=await fetch(base+path,{method:opt.method||'GET',headers:h,body:opt.body?JSON.stringify(opt.body):undefined,signal:ctl?ctl.signal:undefined,mode:'cors',credentials:'omit'}); }
    catch(e){ online=false; changed(); const er=new Error('offline'); er.offline=true; throw er; }
    finally{ clearTimeout(to); }
    let j=null; try{ j=await r.json(); }catch(e){}
    online=true;
    if(r.status===401&&token&&path!=='/api/login'){ setSession(null,null); }
    if(r.status===403&&token&&/paused/i.test((j&&j.error)||'')&&paused!==j.error){ paused=j.error; changed(); }
    if(!r.ok){ const er=new Error((j&&j.error)||('Something went wrong ('+r.status+')')); er.status=r.status; throw er; }
    return j||{};
  }
  function setSession(t,u){ token=t; user=u; paused=''; viewing=false; store.set('eb_token',t); store.set('eb_user',u); changed(); }
  async function check(){
    if(!base){ online=false; changed(); return false; }
    try{ await req('/api/health',{timeout:7000}); }catch(e){ changed(); return false; }
    if(token){ try{ const j=await req('/api/me'); user=j.user; viewing=!!j.view; paused=''; store.set('eb_user',user); }catch(e){} }
    changed(); return true;
  }
  async function auth(kind,name,pass){ const j=await req('/api/'+kind,{method:'POST',body:{username:name,password:pass}}); setSession(j.token,j.user); return j.user; }
  async function logout(){ try{ await req('/api/logout',{method:'POST'}); }catch(e){} setSession(null,null); }
  async function pull(){ if(!token) return null; const j=await req('/api/save'); return j.save||null; }
  async function push(save){ if(!token) return; await req('/api/save',{method:'PUT',body:{save}}); lastPush=Date.now(); lastErr=''; }
  function queueSave(save,now){ if(!token||!base) return; pending=save; clearTimeout(pushT); pushT=setTimeout(flush,now?0:Math.max(0,20000-(Date.now()-lastPush))); }
  async function flush(){ if(!pending||busy) return; const s=pending; pending=null; busy=true; try{ await push(s); }catch(e){ lastErr=e.message; if(!pending) pending=s; } busy=false; changed(); }
  // (v12) never for a run that used a cheat (v10_art_cheats.js)
  async function submitScore(diff,wave,score){ if(!token||!base||(G&&G.cheated)) return; try{ await req('/api/score',{method:'POST',body:{diff,wave,score}}); }catch(e){} }
  async function board(diff){ const j=await req('/api/leaderboard?diff='+diff); return j.rows||[]; }
  addEventListener('pagehide',()=>{ if(pending&&token&&base){ try{ fetch(base+'/api/save',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({save:pending}),keepalive:true,mode:'cors'}); pending=null; }catch(e){} } });
  return {get user(){return user;},get online(){return online;},get signedIn(){return !!token;},get hasBase(){return !!base;},get lastErr(){return lastErr;},get paused(){return paused;},get viewing(){return viewing;},
    check,auth,logout,pull,push,queueSave,flush,submitScore,board,onChange:f=>listeners.add(f)};
})();
// merge cloud and device saves slot by slot: whichever is newer wins (deleted slots carry a dated marker)
async function syncSaves(){
  if(!Cloud.signedIn) return 'none';
  let blob=null; try{ blob=await Cloud.pull(); }catch(e){ return 'offline'; }
  const remote=unpackSaves(blob); let pulled=false, push=false;
  for(let i=0;i<3;i++){
    const L=slotRaw(i), R=remote[i], la=(L&&L.v===3&&L.at)||0, ra=(R&&R.v===3&&R.at)||0;
    if(ra>la){ store.set(SLOT_KEYS[i],R); pulled=true; } else if(la>ra) push=true;
  }
  if(pulled&&scene==='menu') refreshMenu();
  if(push){ try{ await Cloud.push(packSaves()); }catch(e){ return 'offline'; } }
  return pulled&&push?'merged':pulled?'pulled':push?'pushed':'same';
}
// ---------- account panel
let acTab='login';
function acctLabel(){
  const b=$('#bAcct'); if(!b) return;
  if(!Cloud.hasBase||Cloud.online===false){ b.innerHTML='Account<small>Cloud saves are offline here. Progress saves on this device.</small>'; return; }
  const nm=escapeHtml((Cloud.user&&Cloud.user.name)||'you');
  if(Cloud.signedIn&&Cloud.paused){ b.innerHTML=`Account paused<small>${escapeHtml(Cloud.paused)}</small>`; return; }
  if(Cloud.signedIn&&Cloud.viewing){ b.innerHTML=`Viewing as ${nm} (look only)<small>Nothing you do here changes their save.</small>`; return; }
  b.innerHTML=Cloud.signedIn?`Signed in as ${nm}<small>Your story saves to the cloud automatically.</small>`:'Sign in or create an account<small>Keep your journey safe in the cloud and join the leaderboard.</small>';
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function openAcct(){
  show('acct'); $('#acErr').textContent=''; renderAcct(); loadBoard();
  if(Cloud.online===null) Cloud.check().then(()=>{ renderAcct(); loadBoard(); });
}
function renderAcct(){
  const off=!Cloud.hasBase||Cloud.online===false;
  $('#acOff').hidden=!off; $('#acForm').hidden=off||Cloud.signedIn; $('#acIn').hidden=off||!Cloud.signedIn;
  if(Cloud.signedIn) $('#acWho').textContent=((Cloud.user&&Cloud.user.name)||'you')+(Cloud.viewing?' (look only, nothing here saves to their account)':Cloud.paused?' (paused)':'');
  for(const b of document.querySelectorAll('#acTabs button')) b.setAttribute('aria-pressed',String(b.dataset.t===acTab));
  $('#acGo').textContent=acTab==='login'?'Sign in':'Create account';
  $('#acPass').setAttribute('autocomplete',acTab==='login'?'current-password':'new-password');
  $('#acHelp').textContent=acTab==='login'?'':'Pick a name (3 to 20 letters, numbers, - or _) and a password of at least 8 characters. There is no email, so keep your password somewhere safe.';
  $('#acBoardDiff').textContent=DIFFS[diffIdx].name;
}
async function loadBoard(){
  const el=$('#acBoard');
  if(!Cloud.hasBase||Cloud.online===false){ el.innerHTML='<p class="muted">The leaderboard needs the cloud connection.</p>'; return; }
  el.innerHTML='<p class="muted">Loading…</p>';
  try{
    const rows=await Cloud.board(diffIdx);
    if(!rows.length){ el.innerHTML='<p class="muted">No scores yet. Be the first.</p>'; return; }
    el.innerHTML='<ol class="lb">'+rows.map((r,i)=>`<li${Cloud.user&&r.name===Cloud.user.name?' class="me"':''}><span class="rk">${i+1}</span><span class="nm">${escapeHtml(r.name)}</span><span class="wv">Wave ${r.wave}</span><span class="sc">${fmt(r.score)}</span></li>`).join('')+'</ol>';
  }catch(e){ el.innerHTML='<p class="muted">Could not load the leaderboard right now.</p>'; }
}
async function acctSubmit(){
  const name=$('#acName').value.trim(), pass=$('#acPass').value, err=$('#acErr'), go=$('#acGo');
  err.textContent='';
  if(!/^[A-Za-z0-9_-]{3,20}$/.test(name)){ err.textContent='Names are 3 to 20 letters, numbers, - or _.'; return; }
  if(pass.length<8){ err.textContent='Passwords need at least 8 characters.'; return; }
  go.disabled=true; go.textContent=acTab==='login'?'Signing in…':'Creating…';
  try{
    await Cloud.auth(acTab,name,pass); $('#acPass').value='';
    const r=await syncSaves();
    $('#acStatus').textContent=r==='pulled'?'Loaded your cloud saves.':r==='pushed'?'Uploaded the saves from this device.':r==='merged'?'Synced your journeys both ways.':'You are all set.';
    SFX.play('quest');
  }catch(e){ err.textContent=e.offline?'Could not reach the server. Try again in a moment.':e.message; }
  go.disabled=false; renderAcct(); acctLabel(); refreshMenu(); loadBoard();
}
$('#acGo').addEventListener('click',acctSubmit);
for(const id of ['#acName','#acPass']) $(id).addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); acctSubmit(); } });
for(const b of document.querySelectorAll('#acTabs button')) b.addEventListener('click',()=>{ acTab=b.dataset.t; $('#acErr').textContent=''; renderAcct(); });
$('#acOut').addEventListener('click',async()=>{ await Cloud.logout(); $('#acStatus').textContent=''; renderAcct(); acctLabel(); });
$('#acSync').addEventListener('click',async()=>{ const s=$('#acStatus'); s.textContent='Syncing…'; const r=await syncSaves(); s.textContent=r==='offline'?'Could not reach the server.':r==='pulled'?'Loaded your cloud saves.':r==='pushed'?'Uploaded the saves from this device.':r==='merged'?'Synced your journeys both ways.':'Already up to date.'; refreshMenu(); });
$('#acClose').addEventListener('click',()=>{ show('menu'); acctLabel(); });
Cloud.onChange(acctLabel);

// ================= (v12) bring saves over from the old address
// The game moved from https://muellercodes.github.io/emberblood/ to https://playemberblood.com (the old path answers 301).
// Saves made without an account stayed in the old origin's localStorage. Drew's old personal site still serves that
// origin, so a small page there (tools/oldsite/emberblood-move.html, live at BRING_URL) reads the eb_ keys and hands them
// over, as {t:'eb-carry',v:1,keys:{key:raw string}}:
//  - opened by this game (the button below): it posts the object to us; we take it only from BRING_ORIGIN and answer
//    {t:'eb-carry-ok'} so that page can say "Sent" and close
//  - opened on its own, or when the phone dropped the opener: it opens playemberblood.com/#carry=1.<data>, the same JSON
//    as UTF-8, LZW-packed (16-bit codes) in base64url; read once at start, then the hash is cleared
// Only allow-listed keys are kept: strings, size limits, JSON of the right shape, saves must be v3 saves (never eb_token
// or eb_user). The player picks where each save goes: an empty slot at once, a used one only after "Replace ...?".
// Endings and Arena bests merge (the better one is kept). Settings come along only when this device has none of its own,
// and switch on with a reload when the player taps Done. A placed save gets a fresh `at`, so it is the newest journey and
// syncs up the normal way when signed in; an old-format save loads through loadGame and the act migration like any other.
const BRING_URL='https://muellercodes.github.io/emberblood-move.html', BRING_ORIGIN='https://muellercodes.github.io';
const BRING_LIM={save:400000,key:20000,total:1500000,hash:1000000,unpacked:3000000};
const BRING={win:null,wait:false,got:null,ask:null,from:'menu',err:'',copied:false};
const bringObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const bringFin=v=>typeof v==='number'&&isFinite(v);
const bringIs=(...a)=>v=>a.includes(v), bringBool=v=>typeof v==='boolean', bringNum=(a,b)=>v=>bringFin(v)&&v>=a&&v<=b;
// the settings keys (store.get calls in a1_core, a1c_state, a1k_simple, a3e_toy3d, a5_input, a5b_pad, a9e_meta, a9i_comps,
// a11c_depth, a14_music, e5_look, e6_balance), each with the values the game itself writes
const BRING_SET={eb_reading:bringIs('full','simple'),eb_diff:bringNum(0,2),eb_music_off:bringBool,eb_muted:bringBool,eb_vol_sfx:bringNum(0,100),eb_vol_music:bringNum(0,100),
  eb_touch:bringIs('two','right','left'),eb_tipshut:v=>bringObj(v)&&Object.keys(v).length<=300,eb_tips:bringBool,eb_padok:bringIs('auto','south','east'),eb_rumble:bringBool,
  eb_nums:bringBool,eb_mouseaim:bringBool,eb_look:bringIs('storybook','classic'),eb_hand:bringIs('left','right'),eb_depth:v=>typeof v==='string'&&v.length<=16,
  eb_chat:bringIs('some','off'),eb_btn:bringNum(0.5,2),eb_auto:v=>v===null||bringBool(v),eb_bosshelp:bringBool,eb_chars:bringIs('3d','classic')};
const bringEnds=v=>bringObj(v)&&Object.keys(v).length<=60&&Object.keys(v).every(k=>/^[A-Za-z0-9_-]{1,40}$/.test(k));
const bringBest=v=>bringObj(v)&&bringNum(0,1e9)(v.wave)&&bringNum(0,1e12)(v.score);
const bringSave=v=>bringObj(v)&&v.v===3&&!v.deleted&&bringObj(v.p)&&bringFin(v.x)&&bringFin(v.y)&&(v.stage==null||(typeof v.stage==='string'&&v.stage.length<=60))
  &&(v.time==null||bringFin(v.time))&&(v.at==null||bringFin(v.at))&&(v.flags==null||bringObj(v.flags))&&(v.quests==null||bringObj(v.quests));
// what arrived, checked: {saves:[{o,s,put}], ends:[[key,obj]], best:{key:obj}, set:{key:raw}} or null when it is not ours
function bringCheck(d){
  if(!bringObj(d)||d.t!=='eb-carry'||d.v!==1||!bringObj(d.keys)) return null;
  const c={saves:[],ends:[],best:{},set:{},notes:[]}; let total=0;
  for(const k of Object.keys(d.keys)){
    const raw=d.keys[k]; if(typeof raw!=='string') continue;
    total+=raw.length; if(total>BRING_LIM.total) return null;
    const si=SLOT_KEYS.indexOf(k);
    if(raw.length>(si>=0?BRING_LIM.save:BRING_LIM.key)) continue;
    let v; try{ v=JSON.parse(raw); }catch(e){ continue; }
    if(si>=0){ if(bringSave(v)) c.saves.push({o:si,s:v,put:-1}); }
    else if(k==='eb_endings'||k==='eb_n_endings'){ if(bringEnds(v)) c.ends.push([k,v]); }
    else if(/^eb_best_[0-2]$/.test(k)){ if(bringBest(v)) c.best[k]=v; }
    else if(BRING_SET[k]&&BRING_SET[k](v)) c.set[k]=raw;
    // anything else (eb_cur_slot, unknown keys, and eb_token / eb_user, which the old page never sends) is dropped
  }
  c.saves.sort((a,b)=>a.o-b.o);
  return c;
}
// settings here? A fresh start writes a few keys with their defaults (the volumes in a1_core.js, eb_reading in
// a1k_simple.js), so a key that still holds that default does not count as the player's own setting.
const BRING_START={eb_vol_sfx:'100',eb_vol_music:'100',eb_reading:'"full"',eb_muted:'false',eb_music_off:'false'};
function bringHasSettings(){
  for(const k in BRING_SET){
    let v=null; try{ v=localStorage.getItem(k); }catch(e){ return true; }
    if(v==null||v===BRING_START[k]) continue;
    return true;
  }
  return false;
}
// endings seen and Arena bests: keep the better of both; settings only when there are none here
function bringMerge(c){
  const notes=[]; let ne=0, nb=0;
  for(const [k,v] of c.ends){
    const h0=store.get(k,{}), h=bringObj(h0)?h0:{}; let n=0;
    for(const id in v) if(v[id]&&!h[id]){ h[id]=true; n++; }
    if(n){ store.set(k,h); ne+=n; }
  }
  for(const k in c.best){ const v=c.best[k], h=store.get(k,null); if(!bringBest(h)||v.score>h.score){ store.set(k,{wave:v.wave,score:v.score}); nb++; } }
  if(ne) notes.push(ne===1?'an ending you had seen':`${ne} endings you had seen`);
  if(nb) notes.push(nb===1?'your Arena best':'your Arena bests');
  const sk=Object.keys(c.set);
  if(sk.length&&!bringHasSettings()){ for(const k of sk){ try{ localStorage.setItem(k,c.set[k]); }catch(e){} } BRING.copied=true; notes.push('your settings'); }
  return notes;
}
function bringArrive(d){
  BRING.wait=false; BRING.ask=null; BRING.err=''; BRING.got=null;
  if(Cloud.viewing) BRING.err='look';
  else{ const c=bringCheck(d); if(!c) BRING.err='bad'; else { c.notes=bringMerge(c); BRING.got=c; } }
  bringShow();
}
// the hand-off link: LZW with 16-bit codes over UTF-8, in base64url (the old page packs it the same way)
function bringB64(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; const bin=atob(s), b=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i); return b; }
function bringLzw(b,max){
  if(b.length%2) throw new Error('odd'); const n=b.length>>1, dict=[]; for(let i=0;i<256;i++) dict.push(String.fromCharCode(i));
  if(!n) return new Uint8Array(0);
  let prev=dict[(b[0]<<8)|b[1]]; if(prev==null) throw new Error('code'); const parts=[prev]; let total=prev.length;
  for(let i=1;i<n;i++){
    const k=(b[2*i]<<8)|b[2*i+1]; let e;
    if(k<dict.length) e=dict[k]; else if(k===dict.length) e=prev+prev[0]; else throw new Error('code');
    total+=e.length; if(total>max) throw new Error('too big'); parts.push(e);
    if(dict.length<65536) dict.push(prev+e[0]);
    prev=e;
  }
  const s=parts.join(''), out=new Uint8Array(s.length); for(let i=0;i<s.length;i++) out[i]=s.charCodeAt(i); return out;
}
function bringFromHash(){
  let h=''; try{ h=String(location.hash||''); }catch(e){}
  if(!/^#carry=/.test(h)) return;
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){ try{ location.hash=''; }catch(er){} }
  const m=/^#carry=1\.([A-Za-z0-9_-]+)$/.exec(h);
  let d=null;
  if(m&&m[1].length<=BRING_LIM.hash){ try{ d=JSON.parse(new TextDecoder().decode(bringLzw(bringB64(m[1]),BRING_LIM.unpacked))); }catch(e){ d=null; } }
  if(scene!=='menu') return;
  BRING.from='menu'; bringArrive(d);
}
setTimeout(bringFromHash,0);
// the old page posts here; only that origin, only the eb-carry shape, and never in the middle of play
addEventListener('message',e=>{
  if(e.origin!==BRING_ORIGIN) return;
  const d=e.data; if(!bringObj(d)||d.t!=='eb-carry') return;
  if(scene!=='menu') return;
  bringArrive(d);
  try{ if(e.source) e.source.postMessage({t:'eb-carry-ok'},BRING_ORIGIN); }catch(err){}
});
function bringOpen(){
  SFX.init();
  BRING.got=null; BRING.ask=null; BRING.err=''; BRING.copied=false;
  if(Cloud.viewing){ BRING.err='look'; bringShow(); return; }
  let w=null; try{ w=window.open(BRING_URL,'ebbring'); }catch(e){ w=null; }
  if(!w){ location.href=BRING_URL; return; }   // no new tab allowed: go there in this tab, that page brings the saves back by link
  BRING.win=w; BRING.wait=true; bringShow();
}
function bringClose(){
  const copied=BRING.copied;
  BRING.wait=false; BRING.got=null; BRING.ask=null; BRING.err=''; BRING.copied=false; BRING.win=null;
  if(copied){   // the copied settings are read at start: let the cloud push go, then start again
    $('#bring .bbody').innerHTML='<p>Switching on your settings…</p>';
    Promise.race([Cloud.flush().catch(()=>{}),new Promise(r=>setTimeout(r,1500))]).then(()=>location.reload());
    return;
  }
  if(BRING.from==='slots') openSlots(); else { show('menu'); refreshMenu(); }
}
function bringPut(g,t){
  const it=BRING.got&&BRING.got.saves[g]; if(!it||it.put>=0||!(t>=0&&t<3)) return;
  const s=Object.assign({},it.s,{at:Date.now(),slot:t});
  store.set(SLOT_KEYS[t],s);
  const back=slotSave(t);
  if(!back||back.at!==s.at){ BRING.err='full'; bringRender(); return; }
  it.put=t; BRING.ask=null;
  try{ if(!Cloud.viewing) Cloud.queueSave(packSaves(),true); }catch(e){}
  jingle('quest','quest');
  bringRender(); refreshMenu();
}
function bringAct(a,g,t){
  SFX.init(); SFX.play('ui');
  if(a==='put'){ if(slotSave(t)){ BRING.ask={g,t}; bringRender(); } else bringPut(g,t); }
  else if(a==='yes'){ if(BRING.ask&&BRING.ask.g===g&&BRING.ask.t===t) bringPut(g,t); }
  else if(a==='no'){ BRING.ask=null; bringRender(); }
  else if(a==='open') bringOpen();
  else if(a==='close') bringClose();
}
function bringEl(){
  let el=document.getElementById('bring'); if(el) return el;
  const st=document.createElement('style');
  st.textContent='#bring .panel{max-width:460px}#bring .bto{margin:8px 0 6px;font-size:13px}#bring .bpick .btn{min-width:80px;padding:8px 4px;font-size:14px;white-space:nowrap}#bring .bpick .btn small{font-size:12px}'
    +'#bring .bok{margin:6px 0 2px;font-weight:700;color:#8fd46e}#bring .bnote{font-size:13px;margin:10px 0 0}#bring .bfoot{margin-top:14px}#bring .slots{margin-top:10px}#bring .slot.warn{border-color:#e0782c;box-shadow:0 0 0 2px rgba(224,120,44,.25)}'
    +'html.sb #bring .bok{color:#3f7a34}.slot.bringc .sd{margin-bottom:10px}#slotList .bringq{margin-top:2px}';
  document.head.appendChild(st);
  el=document.createElement('div'); el.id='bring'; el.className='ov dim';
  el.innerHTML='<div class="panel" role="dialog" aria-labelledby="bringH"><h2 id="bringH">Saves from the old address</h2><div class="bbody"></div></div>';
  document.body.appendChild(el);
  el.addEventListener('click',e=>{ const b=e.target.closest('button[data-b]'); if(b) bringAct(b.dataset.b,+b.dataset.g,+b.dataset.t); });
  addEventListener('keydown',e=>{
    if(e.key!=='Escape'||!el.classList.contains('on')) return;
    e.preventDefault(); if(BRING.ask){ BRING.ask=null; bringRender(); } else bringClose();
  });
  return el;
}
function bringShow(){ bringEl(); bringRender(); show('bring'); }
const bringBtn=(a,label,o)=>`<button class="btn c sm${o&&o.hot?' hot':''}" type="button" data-b="${a}"${o&&o.g!=null?` data-g="${o.g}"`:''}${o&&o.t!=null?` data-t="${o.t}"`:''}>${label}</button>`;
function bringShort(s){ let L='Saved'; try{ L=stageLabel(s).split(' · ')[0]; }catch(e){} return `${L} · Lv ${(s.p&&s.p.level)||1}`; }
function bringRender(){
  const el=bringEl(), body=el.querySelector('.bbody'), G0=BRING.got;
  let h='';
  if(BRING.err){
    const msg={look:'This is a look-only session, so nothing can be brought in here.',
      full:'This device ran out of room for saves, so that one could not be put in. Try deleting a journey you do not need.',
      bad:'Those saves did not come through right, so nothing here was changed. Try again from the old address.'}[BRING.err]||'';
    h=`<p>${msg}</p><div class="row bfoot">${bringBtn('close','Close')}</div>`;
  }
  else if(!G0){
    h=`<p>The old address is opening in a new tab. It looks for your saves there and sends them back here.</p>`
     +`<p class="muted">Nothing happening? On that page, tap <b>Take my journeys to playemberblood.com</b>. Your journeys come over in that tab instead.</p>`
     +`<div class="row bfoot">${bringBtn('open','Open it again')}${bringBtn('close','Cancel')}</div>`;
  }
  else if(!G0.saves.length){
    h=G0.notes.length?`<p>No journeys came over, but ${escapeHtml(bringList(G0.notes))} did.</p>`
      :`<p><b>No saves came over.</b> The old address has no Emberblood saves in this browser. If you played on another phone, tablet or computer, or in another browser, open muellercodes.github.io/emberblood-move.html there.</p>`;
    if(BRING.copied) h+=`<p class="bnote">Your settings switch on when you tap Done.</p>`;
    h+=`<div class="row bfoot">${bringBtn('close',G0.notes.length?'Done':'Close',{hot:true})}</div>`;
  }
  else{
    let firstFree=-1; for(let t=0;t<3;t++) if(!slotSave(t)){ firstFree=t; break; }
    h=`<p class="muted">These journeys were saved at the old address, muellercodes.github.io. Pick a slot here for each one.</p><div class="slots">`;
    G0.saves.forEach((it,g)=>{
      let d; try{ d=slotDetail(it.s); }catch(e){ d={head:'A saved journey',sub:'',ago:''}; }
      const ask=BRING.ask&&BRING.ask.g===g?BRING.ask:null;
      h+=`<div class="slot${ask?' warn':''}"><div class="sn">Old Journey ${it.o+1}<span>${escapeHtml(d.ago)}</span></div><p class="sh">${escapeHtml(d.head)}</p><p class="sd">${escapeHtml(d.sub)}</p>`;
      if(it.put>=0) h+=`<p class="bok">Now in Journey ${it.put+1}.</p>`;
      else if(ask){
        const there=slotSave(ask.t);
        h+=`<p class="sd"><b>Replace Journey ${ask.t+1} (${escapeHtml(saveSummary(there)||'a saved journey')})?</b> That journey will be gone.</p>`
          +`<div class="row">${bringBtn('yes','Yes, replace it',{hot:true,g,t:ask.t})}${bringBtn('no','Keep it',{g,t:ask.t})}</div>`;
      }
      else{
        h+=`<p class="bto">Put it in:</p><div class="row bpick">`;
        for(let t=0;t<3;t++){ const s=slotSave(t); h+=bringBtn('put',`Journey ${t+1}<small>${s?escapeHtml(bringShort(s)):'Empty'}</small>`,{hot:t===firstFree,g,t}); }
        h+=`</div>`;
        if(firstFree>=0) firstFree=-2;   // only the first waiting journey gets the suggestion
      }
      h+=`</div>`;
    });
    h+=`</div>`;
    if(G0.notes.length) h+=`<p class="bnote">Also brought over: ${escapeHtml(bringList(G0.notes))}.</p>`;
    if(BRING.copied) h+=`<p class="bnote">Your settings switch on when you tap Done.</p>`;
    const all=G0.saves.every(it=>it.put>=0);
    h+=`<div class="row bfoot">${bringBtn('close','Done',{hot:all})}</div>`;
  }
  body.innerHTML=h;
}
const bringList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
// the button: on the title screen while every slot is empty, and on the slot screen (a card at the top while every slot is
// empty, a quiet button under the slots once there is a journey here)
function bringMenuSync(){
  const st=$('#bStory'); if(!st) return;
  let b=$('#bBring');
  if(!b){
    b=document.createElement('button'); b.className='btn'; b.id='bBring'; b.type='button';
    b.innerHTML='Bring a save from the old address<small>Played Emberblood at muellercodes.github.io before? Get your journeys back.</small>';
    st.insertAdjacentElement('afterend',b);
    b.addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); BRING.from='menu'; bringOpen(); });
  }
  b.hidden=latestSlot()>=0||!!Cloud.viewing;
  const ov=document.getElementById('bring'); if(ov&&ov.classList.contains('on')&&BRING.got) bringRender();
}
function bringSlotRow(el){
  if(!el||Cloud.viewing) return;
  const empty=latestSlot()<0;
  el.insertAdjacentHTML(empty?'afterbegin':'beforeend',empty
    ?'<div class="slot cur bringc"><div class="sn">Played before?</div><p class="sd">Emberblood used to live at muellercodes.github.io. Bring the journeys you saved there.</p><div class="row"><button class="btn c sm hot" type="button" data-a="bring">Bring a save from the old address</button></div></div>'
    :'<button class="btn c sm bringq" type="button" data-a="bring">Bring a save from the old address<small>Played at muellercodes.github.io before? Bring that journey here.</small></button>');
  const b=el.querySelector('[data-a="bring"]');
  if(b) b.addEventListener('click',()=>{ SFX.init(); SFX.play('ui'); BRING.from='slots'; bringOpen(); });
}
{ const base=refreshMenu; refreshMenu=function(){ const r=base.apply(this,arguments); try{ bringMenuSync(); }catch(e){ console.error(e); } return r; }; }
Cloud.onChange(()=>{ try{ bringMenuSync(); }catch(e){} });
window.__ebX=Object.assign(window.__ebX||{},{bring:{state:()=>({wait:BRING.wait,err:BRING.err,copied:BRING.copied,from:BRING.from,
  saves:BRING.got?BRING.got.saves.map(it=>({o:it.o,put:it.put,stage:it.s.stage})):null,notes:BRING.got?BRING.got.notes:null}),check:bringCheck,open:bringOpen,url:BRING_URL}});
