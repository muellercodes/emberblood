
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
  async function submitScore(diff,wave,score){ if(!token||!base) return; try{ await req('/api/score',{method:'POST',body:{diff,wave,score}}); }catch(e){} }
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
