
// ================= cloud accounts and saves (Cloudflare Worker + D1)
const API_BASE='__API_BASE__';
const Cloud=(()=>{
  const base=(API_BASE.startsWith('http')?API_BASE:'').replace(/\/$/,'');
  let token=store.get('eb_token',null), user=store.get('eb_user',null), online=null, pending=null, pushT=null, lastPush=0, busy=false, lastErr='', paused='', viewing=false;
  // (v12) approved: false while a new name waits for a grown-up (null when not known; an older server never says)
  let approved=token?store.get('eb_approved',null):null, cfgP=null;
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
  function setSession(t,u,ap){ token=t; user=u; approved=t&&ap===false?false:null; paused=''; viewing=false; adminReset(true); store.set('eb_token',t); store.set('eb_user',u); store.set('eb_approved',approved); changed(); }
  // (v12 CHEAT2) is the signed-in account an admin (the test kit in Settings, z1_cheats.js)? Only the server says so:
  // GET /api/admin/me answers {admin:true} for an admin account and never for a "View as" session. The answer lives in
  // memory only (never in localStorage) and belongs to the token it was asked with. It is asked on load and on sign-in,
  // again when Settings opens with an answer older than ADMIN_RECHECK (adminCheck()), and every few minutes while it is
  // yes. A no (401, 403), signing out, another account or a "View as" session ends a yes at once; a check that cannot
  // reach the server keeps a yes only while it is younger than ADMIN_KEEP, so a device that stays offline loses it.
  const ADMIN_RECHECK=3*60e3, ADMIN_KEEP=10*60e3;
  let adminOk=false, adminAt=0, adminAsked=0, adminTok=null, adminP=null, adminTimer=null;
  function adminReset(quiet){ const was=adminLive(); adminOk=false; adminAt=0; adminAsked=0; adminTok=null; adminP=null; clearInterval(adminTimer); adminTimer=null; if(was&&!quiet) changed(); }
  function adminLive(){ return !!(adminOk&&token&&adminTok===token&&!viewing&&Date.now()-adminAt<ADMIN_KEEP); }
  function adminCheck(force){
    if(!token||!base||viewing){ adminReset(); return Promise.resolve(false); }
    if(!force&&adminTok===token&&Date.now()-adminAsked<ADMIN_RECHECK&&(adminLive()||!adminOk)) return Promise.resolve(adminLive());
    if(adminP) return adminP;
    const tok=token;
    const p=adminP=(async()=>{
      let ok=false, net=false;
      try{ const j=await req('/api/admin/me',{timeout:8000}); ok=!!(j&&j.admin===true); }catch(e){ net=!!e.offline; }
      if(adminP===p) adminP=null;
      if(tok!==token||viewing||!token) return false;
      const was=adminLive();
      if(ok){ adminOk=true; adminAt=adminAsked=Date.now(); adminTok=tok; if(!adminTimer) adminTimer=setInterval(()=>{ if(adminOk) adminCheck(true); },ADMIN_RECHECK+20e3); }
      else if(!net){ adminOk=false; adminAt=0; adminAsked=Date.now(); adminTok=tok; clearInterval(adminTimer); adminTimer=null; }
      else if(!adminLive()){ adminOk=false; }
      if(was!==adminLive()) changed();
      return adminLive();
    })();
    return p;
  }
  async function check(){
    if(!base){ online=false; changed(); return false; }
    try{ await req('/api/health',{timeout:7000}); }catch(e){ changed(); return false; }
    if(token){ try{ const j=await req('/api/me'); user=j.user; viewing=!!j.view; approved=j.approved===false?false:null; paused=''; store.set('eb_user',user); store.set('eb_approved',approved); }catch(e){} }
    changed();
    if(token&&!viewing) adminCheck(true); else adminReset();
    return true;
  }
  async function auth(kind,name,pass,extra){ const j=await req('/api/'+kind,{method:'POST',body:Object.assign({username:name,password:pass},extra||{})}); setSession(j.token,j.user,j.approved); adminCheck(true); return j.user; }
  // what the server wants before Create account (the bot check's public key, or none); asked once
  function config(){ if(!base) return Promise.resolve({}); if(!cfgP) cfgP=req('/api/config',{timeout:7000}).catch(()=>{ cfgP=null; return {}; }); return cfgP; }
  async function logout(){ try{ await req('/api/logout',{method:'POST'}); }catch(e){} setSession(null,null); }
  async function pull(){ if(!token) return null; const j=await req('/api/save'); return j.save||null; }
  async function push(save){ if(!token) return; await req('/api/save',{method:'PUT',body:{save}}); lastPush=Date.now(); lastErr=''; }
  function queueSave(save,now){ if(!token||!base) return; pending=save; clearTimeout(pushT); pushT=setTimeout(flush,now?0:Math.max(0,20000-(Date.now()-lastPush))); }
  async function flush(){ if(!pending||busy) return; const s=pending; pending=null; busy=true; try{ await push(s); }catch(e){ lastErr=e.message; if(!pending) pending=s; } busy=false; changed(); }
  // (v12) an Arena run asks for a score ticket as it starts (a9b_flow.js startNormal): signed in only, never in a "view
  // as" session and never with a cheat on (z1_cheats.js). The score goes up with that ticket or not at all; the server
  // checks the ticket, the time and the wave, and quietly keeps a score that does not fit off the board.
  function startRun(diff){
    if(!token||!base||viewing||paused) return null;
    if((G&&G.cheated)||(typeof chAny==='function'&&chAny())) return null;
    return req('/api/arena/start',{method:'POST',body:{diff}}).then(j=>(j&&j.run)||null,()=>null);
  }
  async function submitScore(diff,wave,score,ticket){
    if(!token||!base||(G&&G.cheated)||!(wave>=1)||!ticket) return;
    let run=null; try{ run=await ticket; }catch(e){}
    if(!run||(G&&G.cheated)) return;
    try{ await req('/api/score',{method:'POST',body:{diff,wave,score,run}}); }catch(e){}
  }
  // the top names (approved ones only) and, when signed in, this player's own best (me)
  async function board(diff){ const j=await req('/api/leaderboard?diff='+diff); return {rows:j.rows||[],me:j.me||null}; }
  addEventListener('pagehide',()=>{ if(pending&&token&&base){ try{ fetch(base+'/api/save',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({save:pending}),keepalive:true,mode:'cors'}); pending=null; }catch(e){} } });
  return {get user(){return user;},get online(){return online;},get signedIn(){return !!token;},get hasBase(){return !!base;},get lastErr(){return lastErr;},get paused(){return paused;},get viewing(){return viewing;},
    get waiting(){return !!token&&approved===false&&!viewing;},
    // (v12 CHEAT2) true only while the server has said this account is an admin (see adminCheck)
    get admin(){return adminLive();}, adminCheck,
    check,auth,logout,pull,push,queueSave,flush,config,startRun,submitScore,board,onChange:f=>listeners.add(f)};
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
// (v12) the Create account bot check's state (botShow below)
const BOT={key:null,id:null,theme:null,token:'',loading:null,failed:false,busy:false};
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
  $('#acWait').hidden=off||!Cloud.waiting;
  for(const b of document.querySelectorAll('#acTabs button')) b.setAttribute('aria-pressed',String(b.dataset.t===acTab));
  $('#acGo').textContent=acTab==='login'?'Sign in':'Create account';
  $('#acPass').setAttribute('autocomplete',acTab==='login'?'current-password':'new-password');
  $('#acHelp').textContent=acTab==='login'?'':'Pick a name (3 to 20 letters, numbers, - or _) and a password of at least 8 characters. There is no email, so keep your password somewhere safe.';
  if(!off&&!Cloud.signedIn&&acTab==='register') botShow(); else $('#acBot').hidden=true;
  $('#acBoardDiff').textContent=DIFFS[diffIdx].name;
}
async function loadBoard(){
  const el=$('#acBoard');
  if(!Cloud.hasBase||Cloud.online===false){ el.innerHTML='<p class="muted">The leaderboard needs the cloud connection.</p>'; return; }
  el.innerHTML='<p class="muted">Loading…</p>';
  try{
    const {rows,me}=await Cloud.board(diffIdx), mine=Cloud.user&&Cloud.user.name;
    let list=rows.map((r,i)=>`<li${mine&&r.name===mine?' class="me"':''}><span class="rk">${i+1}</span><span class="nm">${escapeHtml(r.name)}</span><span class="wv">Wave ${r.wave}</span><span class="sc">${fmt(r.score)}</span></li>`).join('');
    // (v12) your own best always shows to you: below the board while your name waits for approval, or when it is not in the top 20
    if(me&&me.score>0&&!rows.some(r=>r.name===me.name)) list+=`<li class="me mine"><span class="rk">·</span><span class="nm">${escapeHtml(me.name)}<small>${me.approved?'your best':'only you can see this for now'}</small></span><span class="wv">Wave ${me.wave}</span><span class="sc">${fmt(me.score)}</span></li>`;
    if(!list){ el.innerHTML='<p class="muted">No scores yet. Be the first.</p>'; return; }
    el.innerHTML=(rows.length?'':'<p class="muted">No scores on the board yet.</p>')+'<ol class="lb">'+list+'</ol>';
  }catch(e){ el.innerHTML='<p class="muted">Could not load the leaderboard right now.</p>'; }
}
async function acctSubmit(){
  const name=$('#acName').value.trim(), pass=$('#acPass').value, err=$('#acErr'), go=$('#acGo');
  err.textContent='';
  if(!/^[A-Za-z0-9_-]{3,20}$/.test(name)){ err.textContent='Names are 3 to 20 letters, numbers, - or _.'; return; }
  if(pass.length<8){ err.textContent='Passwords need at least 8 characters.'; return; }
  // (v12) the bot check on Create account: wait for its token while the widget is working on it. If the widget could not
  // load or keeps failing, the server decides (it only asks once the keys exist).
  const reg=acTab==='register';
  if(reg&&BOT.key&&BOT.id!=null&&!BOT.token&&!BOT.failed){ err.textContent='Please finish the robot check above first.'; return; }
  go.disabled=true; go.textContent=acTab==='login'?'Signing in…':'Creating…';
  try{
    await Cloud.auth(acTab,name,pass,reg&&BOT.token?{turnstile:BOT.token}:null); $('#acPass').value='';
    const r=await syncSaves();
    $('#acStatus').textContent=r==='pulled'?'Loaded your cloud saves.':r==='pushed'?'Uploaded the saves from this device.':r==='merged'?'Synced your journeys both ways.':'You are all set.';
    SFX.play('quest');
  }catch(e){ err.textContent=e.offline?'Could not reach the server. Try again in a moment.':e.message; }
  if(reg) botReset();
  go.disabled=false; renderAcct(); acctLabel(); refreshMenu(); loadBoard();
}
// ---------- (v12) the bot check (Cloudflare Turnstile), only on Create account and only when the server has a key.
// Cloudflare's script is the one outside script the game loads, and only once Create account is opened.
const botTheme=()=>document.documentElement.classList.contains('sb')?'light':'dark';
function botLoad(){
  if(window.turnstile&&window.turnstile.render) return Promise.resolve();
  if(!BOT.loading) BOT.loading=new Promise((ok,no)=>{
    const sc=document.createElement('script'); sc.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; sc.async=true;
    sc.onload=()=>window.turnstile&&window.turnstile.render?ok():no(new Error('no turnstile'));
    sc.onerror=()=>{ BOT.loading=null; sc.remove(); no(new Error('could not load')); };
    document.head.appendChild(sc);
  });
  return BOT.loading;
}
async function botShow(){
  const box=$('#acBot'), msg=$('#acBotMsg');
  if(BOT.busy) return; BOT.busy=true;
  try{
    const c=await Cloud.config(); BOT.key=(c&&c.turnstile)||null;
    if(!BOT.key||acTab!=='register'||Cloud.signedIn){ box.hidden=true; return; }
    box.hidden=false;
    try{ await botLoad(); }catch(e){ BOT.failed=true; msg.textContent='The robot check could not load here. You can still try to create your account.'; return; }
    if(acTab!=='register'||Cloud.signedIn){ box.hidden=true; return; }
    const th=botTheme(); if(BOT.id!=null&&BOT.theme===th) return;
    if(BOT.id!=null){ try{ turnstile.remove(BOT.id); }catch(e){} BOT.id=null; }
    const w=$('#acBotW'); w.innerHTML=''; BOT.token=''; BOT.theme=th; BOT.failed=false; msg.textContent='';
    BOT.id=turnstile.render(w,{sitekey:BOT.key,theme:th,size:w.clientWidth>=300?'flexible':'compact',action:'register',
      callback:t=>{ BOT.token=t; BOT.failed=false; msg.textContent=''; },
      'expired-callback':()=>{ BOT.token=''; },
      'error-callback':()=>{ BOT.token=''; BOT.failed=true; msg.textContent='The robot check had a hiccup. It will try again by itself.'; }});
  }catch(e){ BOT.failed=true; }
  finally{ BOT.busy=false; }
}
function botReset(){ BOT.token=''; if(BOT.id!=null&&window.turnstile){ try{ turnstile.reset(BOT.id); }catch(e){} } }
$('#acGo').addEventListener('click',acctSubmit);
for(const id of ['#acName','#acPass']) $(id).addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); acctSubmit(); } });
for(const b of document.querySelectorAll('#acTabs button')) b.addEventListener('click',()=>{ acTab=b.dataset.t; $('#acErr').textContent=''; renderAcct(); });
$('#acOut').addEventListener('click',async()=>{ await Cloud.logout(); $('#acStatus').textContent=''; renderAcct(); acctLabel(); });
$('#acSync').addEventListener('click',async()=>{ const s=$('#acStatus'); s.textContent='Syncing…'; const r=await syncSaves(); s.textContent=r==='offline'?'Could not reach the server.':r==='pulled'?'Loaded your cloud saves.':r==='pushed'?'Uploaded the saves from this device.':r==='merged'?'Synced your journeys both ways.':'Already up to date.'; refreshMenu(); });
$('#acClose').addEventListener('click',()=>{ show('menu'); acctLabel(); });
Cloud.onChange(acctLabel);
