// ================= gamepads: PlayStation, Xbox and Nintendo controllers through the browser Gamepad API (controls build)
// Buttons are read by physical position (the "standard" mapping): 0 bottom face, 1 right face, 2 left face, 3 top face,
// 4 L1/LB/L, 5 R1/RB/R, 6 L2/LT/ZL, 7 R2/RT/ZR, 8 Back/View/Share/Create/minus, 9 Start/Menu/Options/plus,
// 10 L3, 11 R3, 12 to 15 d-pad up/down/left/right, 16 home, 17 touchpad. So on a Nintendo pad the bottom button (B) jumps.
//
// Play:  left stick move (all the way for a moment sprints, L3 toggles sprint) · right stick aim
//        bottom jump · right roll · left attack (held) · top use/talk · R2 attack · L2 fire breath
//        R1/L1 next/previous weapon · R3 or L1+R1 together Roar · d-pad up drink · d-pad down companion
//        d-pad left/right previous/next followed quest (Normal Mode: previous/next weapon)
//        Back/View/Share/minus: map, hold for the journal · Start/Menu/Options/plus: pause, hold for skills
// Menus: d-pad or left stick moves the focus · bottom picks · right goes back (swappable in Settings)
//        L1/R1 switch tabs (on the world map they pick a shrine) · right stick scrolls · Start closes pause
const PB={S:0,E:1,W:2,N:3,L1:4,R1:5,L2:6,R2:7,SEL:8,ST:9,L3:10,R3:11,UP:12,DN:13,LF:14,RT:15,HOME:16,TP:17}, NPB=18;
Object.assign(settings,{rumble:store.get('eb_rumble',true)!==false, padOk:['auto','south','east'].includes(store.get('eb_padok','auto'))?store.get('eb_padok','auto'):'auto'});
const PADK={
  xbox:{name:'Xbox controller',short:'Xbox',face:['A','B','X','Y'],bg:['#3e9a36','#cc3b2d','#2c6ecf','#e3ae25'],fg:['#fff','#fff','#fff','#2b1c00'],sh:['LB','RB','LT','RT'],sel:'View',st:'Menu',l3:'LS',r3:'RS'},
  ps:{name:'PlayStation controller',short:'PlayStation',face:['✕','○','□','△'],bg:['#1c2230','#1c2230','#1c2230','#1c2230'],fg:['#8fb4ff','#ff7b7b','#f39ad9','#45dcb0'],sh:['L1','R1','L2','R2'],sel:'Create',st:'Options',l3:'L3',r3:'R3'},
  nin:{name:'Nintendo controller',short:'Nintendo',face:['B','A','Y','X'],bg:['#35373d','#35373d','#35373d','#35373d'],fg:['#fff','#fff','#fff','#fff'],sh:['L','R','ZL','ZR'],sel:'−',st:'+',l3:'L stick',r3:'R stick'}
};
const PAD={idx:-1,id:'',kind:'xbox',gen:false,sel:null,dev:'kb',known:new Map(),st:new Map(),s:null,ui:false,q:{},full:0,latch:false,still:0,
  sh:[-1,-1],chord:false,nav:{d:'',t:0},stickBlock:false,scene:'',toastT:0,rum:{until:0,str:0},rw:{G:null,hp:0,lvl:0,hs:0,sk:0,dead:false},lastBtn:'',mem:{},rootId:''};
try{ if('gamepadInputEmulation' in navigator) navigator.gamepadInputEmulation='gamepad'; }catch(e){}
function padKindOf(id){
  const s=String(id||'').toLowerCase();
  if(/045e|xbox|xinput/.test(s)) return 'xbox';
  if(/054c|dualsense|dualshock|playstation|sony|wireless controller/.test(s)) return 'ps';
  if(/057e|nintendo|pro controller|joy-con|switch/.test(s)) return 'nin';
  return 'gen';
}
const padK=k=>PADK[k==='gen'?'xbox':k]||PADK.xbox;
// the name of physical button i on pad kind k
function padBtnName(i,k){
  k=k||PAD.kind; const K=padK(k);
  if(i<4) return K.face[i];
  if(i<8) return K.sh[i-4];
  if(i===8) return k===PAD.kind&&PAD.sel?PAD.sel:K.sel;
  if(i===9) return K.st;
  if(i===10) return K.l3; if(i===11) return K.r3;
  if(i>=12&&i<=15) return 'D-pad '+['↑','↓','←','→'][i-12];
  return i===17?'Touchpad':'Home';
}
const curDevice=()=>padActive()?'pad':usingTouch?'touch':'kb';
function padActive(){ return PAD.idx>=0&&PAD.dev==='pad'; }
function padDev(d){
  if(PAD.dev===d) return; PAD.dev=d;
  try{ document.body.classList.toggle('padnav',d==='pad'); }catch(e){}
  if(d==='pad'){ usingTouch=false; if(aimMode==='touch'||aimMode==='mouse') aimMode='pad'; }
}
addEventListener('keydown',e=>{ if(!/^Gamepad/.test(e.key||'')&&!/^Gamepad/.test(e.code||'')) padDev('kb'); },true); // some browsers echo pad buttons as Gamepad* keys
addEventListener('mousedown',()=>padDev('mouse'),true);
addEventListener('mousemove',e=>{ if(Math.abs(e.movementX||0)+Math.abs(e.movementY||0)>3) padDev('mouse'); },true);
addEventListener('touchstart',()=>padDev('touch'),{capture:true,passive:true});

// ---------- button labels for whatever the player is using right now
// btnLabel(action[,dev]): action is attack, fire, roll, jump, use, drink, roar, map, journal, pause, weapon, whistle or skills.
// dev is 'kb', 'touch' or 'pad' (default: the device used last). Pad labels follow the detected controller.
const ACT_KEY={attack:'J',fire:'K',roll:'Space',jump:'C',use:'E',drink:'R',roar:'Q',map:'M',journal:'I',pause:'Esc',weapon:'X',whistle:'G',skills:'U'};
const ACT_TOUCH={attack:'the SLASH button',fire:'the FIRE button',roll:'the ROLL button',jump:'the JUMP button',use:'the USE button',drink:'the DRINK button',roar:'the ROAR button',map:'the minimap',journal:'the quest list',pause:'the pause button',weapon:'the WEAPON button',whistle:'the CALL button',skills:'Skills in the pause menu'};
const ACT_PAD={attack:PB.W,fire:PB.L2,roll:PB.E,jump:PB.S,use:PB.N,drink:PB.UP,roar:PB.R3,map:PB.SEL,journal:PB.SEL,pause:PB.ST,weapon:PB.R1,whistle:PB.DN,skills:PB.ST};
const ACT_HOLD={journal:1,skills:1};
function btnLabel(action,dev){
  dev=dev||curDevice();
  if(dev==='pad'){ const i=ACT_PAD[action]; if(i==null) return ''; return (ACT_HOLD[action]?'Hold ':'')+padBtnName(i); }
  if(dev==='touch') return ACT_TOUCH[action]||'';
  return ACT_KEY[action]||'';
}
// the same thing as a little HTML chip (styles .pg in body.html)
function btnHTML(action,dev){
  dev=dev||curDevice();
  if(dev==='pad'){ const i=ACT_PAD[action]; if(i==null) return ''; return (ACT_HOLD[action]?'hold ':'')+padChip(i); }
  if(dev==='touch') return escapeHtml(ACT_TOUCH[action]||'');
  return `<kbd class="pg k">${escapeHtml(ACT_KEY[action]||'')}</kbd>`;
}
function padChip(i,k){
  k=k||PAD.kind; const K=padK(k), t=escapeHtml(padBtnName(i,k).replace('D-pad ',''));
  if(i<4) return `<i class="pg f" style="background:${K.bg[i]};color:${K.fg[i]}">${t}</i>`;
  if(i>=12&&i<=15) return `<i class="pg d" title="D-pad">${t}</i>`;
  return `<i class="pg s">${t}</i>`;
}
// canvas glyph for physical button i (pad kind k) centred at x,y with radius r; returns the width used
function drawPadGlyph(g,i,k,x,y,r){
  k=k||PAD.kind; const K=padK(k);
  g.save(); g.textAlign='center'; g.textBaseline='middle';
  let w=r*2;
  if(i<4){
    g.fillStyle='rgba(0,0,0,.35)'; g.beginPath(); g.arc(x,y+r*0.12,r,0,TAU); g.fill();
    g.fillStyle=K.bg[i]; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
    g.strokeStyle='rgba(255,255,255,.38)'; g.lineWidth=Math.max(1,r*0.1); g.stroke();
    const fg=K.fg[i];
    if(k==='ps'){
      const q=r*0.44; g.strokeStyle=fg; g.lineWidth=Math.max(1.4,r*0.17); g.lineCap='round'; g.lineJoin='round'; g.beginPath();
      if(i===0){ g.moveTo(x-q,y-q); g.lineTo(x+q,y+q); g.moveTo(x+q,y-q); g.lineTo(x-q,y+q); }
      else if(i===1) g.arc(x,y,q*1.02,0,TAU);
      else if(i===2) g.rect(x-q*0.86,y-q*0.86,q*1.72,q*1.72);
      else { g.moveTo(x,y-q*1.05); g.lineTo(x+q*1.02,y+q*0.72); g.lineTo(x-q*1.02,y+q*0.72); g.closePath(); }
      g.stroke();
    }else{ g.fillStyle=fg; g.font=`800 ${Math.round(r*1.15)}px ${UIF}`; g.fillText(K.face[i],x,y+r*0.07); }
  }else if(i>=12&&i<=15){
    const a=r*0.98, t=r*0.6;
    g.fillStyle='#2b2521'; rrect(g,x-t/2,y-a,t,a*2,t*0.25); g.fill(); rrect(g,x-a,y-t/2,a*2,t,t*0.25); g.fill();
    g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=1; rrect(g,x-t/2,y-a,t,a*2,t*0.25); g.stroke(); rrect(g,x-a,y-t/2,a*2,t,t*0.25); g.stroke();
    const d=[[0,-1],[0,1],[-1,0],[1,0]][i-12]; g.fillStyle='#ffd27a';
    g.beginPath(); g.arc(x+d[0]*a*0.55,y+d[1]*a*0.55,t*0.34,0,TAU); g.fill();
  }else{
    const t=padBtnName(i,k); g.font=`800 ${Math.round(r*0.92)}px ${UIF}`;
    const tw=g.measureText(t).width, h=r*1.72; w=Math.max(r*2,tw+r*1.1);
    g.fillStyle='rgba(0,0,0,.35)'; rrect(g,x-w/2,y-h/2+r*0.12,w,h,i===6||i===7?h*0.32:h/2); g.fill();
    g.fillStyle='#2e2622'; rrect(g,x-w/2,y-h/2,w,h,i===6||i===7?h*0.32:h/2); g.fill();
    g.strokeStyle='rgba(255,236,210,.45)'; g.lineWidth=1; g.stroke();
    g.fillStyle='#f6ead8'; g.fillText(t,x,y+r*0.06);
  }
  g.restore(); return w;
}
// glyph for an action on the current device (pad button, or a key cap); returns the width used, 0 on touch
function drawBtnGlyph(g,action,x,y,r,dev){
  dev=dev||curDevice();
  if(dev==='pad'){ const i=ACT_PAD[action]; return i==null?0:drawPadGlyph(g,i,PAD.kind,x,y,r); }
  if(dev==='touch') return 0;
  const t=ACT_KEY[action]||'?'; g.save(); g.font=`800 ${Math.round(r*1.05)}px ${UIF}`; g.textAlign='center'; g.textBaseline='middle';
  const w=Math.max(r*2,g.measureText(t).width+r*0.9), h=r*2;
  g.fillStyle='#4a2a1a'; rrect(g,x-w/2,y-h/2+2,w,h,r*0.45); g.fill();
  g.fillStyle='#6a3c24'; rrect(g,x-w/2,y-h/2,w,h,r*0.45); g.fill(); g.strokeStyle='rgba(255,220,180,.5)'; g.lineWidth=1; g.stroke();
  g.fillStyle='#fff2de'; g.fillText(t,x,y+0.5); g.restore(); return w;
}

// ---------- reading the pads
function padDz(x,y,d){ const m=Math.hypot(x,y); if(m<d) return [0,0,0]; const k=Math.min(1,(m-d)/(1-d-0.06)); return [x/m*k,y/m*k,k]; }
function padRead(gp,dt){
  let s=PAD.st.get(gp.index);
  if(!s){ s={cur:[],prev:[],val:[],hold:[],block:[],ed:[],tap:[],arm:[],fired:[],ax:[0,0,0,0],act:0,first:true};
    for(let i=0;i<NPB;i++){ s.cur[i]=s.prev[i]=s.block[i]=s.ed[i]=s.tap[i]=s.arm[i]=s.fired[i]=false; s.val[i]=s.hold[i]=0; }
    PAD.st.set(gp.index,s); }
  const B=gp.buttons||[], A=gp.axes||[]; let busy=false;
  for(let i=0;i<NPB;i++){
    const b=B[i]; let v=0,p=false;
    if(b!=null){ if(typeof b==='object'){ v=+b.value||0; p=!!b.pressed; } else { v=+b||0; p=v>0.5; } }
    if(i===PB.L2||i===PB.R2) p=v>0.35||(p&&!(v>0));
    s.prev[i]=s.cur[i]; s.cur[i]=p; s.val[i]=v;
  }
  // some non-standard pads put the d-pad on a hat axis
  if(gp.mapping!=='standard'&&B.length<16&&A.length>=8){ const hx=+A[6]||0, hy=+A[7]||0; s.cur[12]=hy<-0.5; s.cur[13]=hy>0.5; s.cur[14]=hx<-0.5; s.cur[15]=hx>0.5; }
  for(let i=0;i<NPB;i++){
    const c=s.cur[i], p=s.prev[i];
    if(!c) s.block[i]=false;
    s.ed[i]=c&&!p&&!s.block[i]&&!s.first;
    if(s.ed[i]){ s.arm[i]=true; busy=true; }
    s.tap[i]=!c&&p&&s.arm[i]&&!s.fired[i]&&s.hold[i]<0.5;
    if(!c){ s.arm[i]=false; s.fired[i]=false; }
    s.hold[i]=c?s.hold[i]+dt:0;
  }
  s.ax=[+A[0]||0,+A[1]||0,+A[2]||0,+A[3]||0];
  if(Math.hypot(s.ax[0],s.ax[1])>0.5||Math.hypot(s.ax[2],s.ax[3])>0.5||s.val[6]>0.3||s.val[7]>0.3) busy=true;
  if(s.first){ for(let i=0;i<NPB;i++) s.block[i]=s.cur[i]; s.first=false; }
  s.busy=busy; return s;
}
// the topmost visible overlay: menus, pause, settings, journal, map, dialogue, skills and so on
const vis=el=>!!el&&el.getClientRects().length>0;
function navRoot(){
  let best=null, bz=-1e9;
  for(const o of document.querySelectorAll('.ov.on,#skills')){
    if(o.id==='card'||!vis(o)) continue;
    if(o.id==='skills'&&!o.classList.contains('on')&&!Array.from(o.querySelectorAll('button')).some(vis)) continue;
    const z=parseFloat(getComputedStyle(o).zIndex)||0; if(z>=bz){ bz=z; best=o; }
  }
  return best;
}
function padPoll(dt){
  PAD.q={}; PAD.ui=false;
  let list=[]; try{ list=navigator.getGamepads?Array.from(navigator.getGamepads()||[]):[]; }catch(e){ list=[]; }
  const seen=new Set(); let act=null;
  for(const gp of list){
    if(!gp||gp.connected===false) continue;
    seen.add(gp.index);
    if(PAD.known.get(gp.index)!==gp.id){ PAD.known.set(gp.index,gp.id); PAD.st.delete(gp.index); padHello(gp); }
    const s=padRead(gp,dt);
    if(s.busy) s.act=performance.now();
    if(!act||s.act>act.s.act) act={gp,s};
  }
  for(const [i,id] of Array.from(PAD.known)) if(!seen.has(i)){ PAD.known.delete(i); PAD.st.delete(i); padBye(i,id); }
  const s=act?act.s:null;
  if(act){ const gp=act.gp; if(PAD.idx!==gp.index||PAD.id!==gp.id){ PAD.idx=gp.index; PAD.id=gp.id; padSetKind(gp.id); } PAD.s=s; if(s.busy){ padDev('pad'); SFX.init(); } }
  else if(PAD.idx>=0){ PAD.idx=-1; PAD.s=null; }
  padLabels();
  // a new screen: buttons still held from the last one do nothing until they are let go,
  // and backing out of a sub-screen puts the focus back on the button that opened it
  const root=navRoot(), key=scene+'|'+(root?root.id:''), ae=document.activeElement;
  if(key===PAD.scene&&root&&ae&&ae!==document.body&&root.contains(ae)&&!PAD.restoring) PAD.mem[root.id]=ae;
  if(key!==PAD.scene){
    const first=!PAD.scene, from=PAD.rootId; PAD.scene=key; PAD.rootId=root?root.id:'';
    if(!first){
      if(s){ for(let i=0;i<NPB;i++){ if(s.cur[i]){ s.block[i]=true; s.arm[i]=false; } s.ed[i]=false; s.tap[i]=false; } PAD.stickBlock=Math.hypot(s.ax[0],s.ax[1])>0.4; }
      PAD.nav.d=''; PAD.sh=[-1,-1];
      if(root&&['settings','how','slots','acct'].includes(from)&&['menu','pause'].includes(root.id)) navRestore(root);
      else if(root&&PAD.dev==='pad'&&root.id!=='dialogue') setTimeout(()=>{ if(navRoot()===root&&PAD.dev==='pad'){ const it=navItems(root); if(it.length&&!it.includes(document.activeElement)) navFocus(navDefault(root,it)); } },90);
    }
  }
  if(!s) return;
  rumbleWatch();
  if(PAD.stickBlock&&Math.hypot(s.ax[0],s.ax[1])<0.3) PAD.stickBlock=false;
  if(PAD.dev!=='pad') return;
  if(root) padMenu(root,s,dt);
  else if(scene==='play') padPlayUI(s,dt);
}
function padSetKind(id){
  const k=padKindOf(id); PAD.gen=k==='gen'; PAD.kind=k==='gen'?'xbox':k;
  PAD.sel=PAD.kind==='ps'?(/0ce6|0df2|dualsense/i.test(id)?'Create':'Share'):null;
  padRenderSettings();
}
const padName=id=>{ const k=padKindOf(id); return k==='gen'?'Controller':PADK[k].name; };
function padHello(gp){
  const k=padKindOf(gp.id), kk=k==='gen'?'xbox':k, ok=padOkBtn(kk), back=ok?0:1;
  padToast(`${padName(gp.id)} connected`, scene==='play'?`${padChip(PB.ST,kk)} pauses · ${padChip(PB.SEL,kk)} opens the map`:`${padChip(ok,kk)} picks · ${padChip(back,kk)} goes back`);
  padRenderSettings();
}
function padBye(i,id){
  if(i!==PAD.idx&&PAD.known.size) return;
  padToast('Controller disconnected','Plug it back in, or keep going with the keyboard.');
  if(PAD.dev==='pad'){ PAD.dev=''; padDev('kb'); }
  PAD.idx=-1; PAD.s=null;
  if(scene==='play') pauseGame();
  padRenderSettings();
}
function padToast(title,sub){
  let el=document.getElementById('padToast');
  if(!el){ el=document.createElement('div'); el.id='padToast'; el.setAttribute('role','status'); el.setAttribute('aria-live','polite'); document.body.appendChild(el); }
  el.innerHTML=`<b>${escapeHtml(title)}</b>${sub?`<span>${sub}</span>`:''}`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  // up long enough to read, and kept in the log (UX build)
  const plain=String(sub||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
  logAdd({k:'toast',text:title,sub:plain});
  clearTimeout(PAD.toastT); PAD.toastT=setTimeout(()=>el.classList.remove('on'),readT(title+' '+plain,3.5,9)*1000);
}
// which face button picks things in menus: the bottom one, or the right one (Nintendo style)
function padOkBtn(k){ const v=settings.padOk; if(v==='south') return PB.S; if(v==='east') return PB.E; return (k||PAD.kind)==='nin'?PB.E:PB.S; }

// ---------- in the world: pause, map, journal, skills and quest focus (the rest is merged in readInput by padInput)
function padPlayUI(s,dt){
  const story=G&&G.mode==='story';
  // both sticks clicked in together also pause (Edge on an Xbox keeps the Menu button for itself)
  if(s.cur[PB.L3]&&s.cur[PB.R3]&&(s.ed[PB.L3]||s.ed[PB.R3])){ PAD.ui=true; PAD.latch=false; pauseGame(); return; }
  if(story){
    if(s.cur[PB.ST]&&s.arm[PB.ST]&&!s.fired[PB.ST]&&s.hold[PB.ST]>=0.5){ s.fired[PB.ST]=true; PAD.ui=true; openSkills(); }
    else if(s.tap[PB.ST]){ PAD.ui=true; pauseGame(); }
    for(const i of [PB.SEL,PB.TP]){
      if(s.cur[i]&&s.arm[i]&&!s.fired[i]&&s.hold[i]>=0.5){ s.fired[i]=true; PAD.ui=true; openJournal(); }
      else if(s.tap[i]){ PAD.ui=true; openMap(); }
    }
    if(s.ed[PB.RT]) cycleFocus();
    if(s.ed[PB.LF]) focusPrev();
  }else{
    if(s.ed[PB.ST]){ PAD.ui=true; pauseGame(); }
    if(s.ed[PB.RT]) PAD.q.wN=true;
    if(s.ed[PB.LF]) PAD.q.wP=true;
  }
  // shoulders: a tap switches weapons, both together roar
  for(const i of [PB.L1,PB.R1]){ const j=i-PB.L1; if(s.ed[i]) PAD.sh[j]=0; else if(PAD.sh[j]>=0) PAD.sh[j]+=dt; }
  if(s.cur[PB.L1]&&s.cur[PB.R1]&&(PAD.sh[0]>=0||PAD.sh[1]>=0)&&!PAD.chord){ PAD.chord=true; PAD.q.roar=true; PAD.sh=[-1,-1]; }
  if(!s.cur[PB.L1]&&!s.cur[PB.R1]) PAD.chord=false;
  for(const i of [PB.L1,PB.R1]){ const j=i-PB.L1; if(PAD.sh[j]>=0&&(!s.cur[i]||PAD.sh[j]>0.12)){ if(!PAD.chord){ if(j) PAD.q.wN=true; else PAD.q.wP=true; } PAD.sh[j]=-1; } }
}
function focusPrev(){
  const list=[null].concat(tracked()); let i=list.indexOf(G.focus||null); i=(i-1+list.length)%list.length;
  followQuest(list[i]); SFX.play('ui');
}
function padInput(o,dt){
  const s=PAD.s; if(!s||!padActive()||PAD.ui) return;
  const h=i=>s.cur[i]&&!s.block[i], e=i=>s.ed[i];
  // left stick: analog walking; all the way out for a moment sprints, like the touch stick
  const [lx,ly,lm]=PAD.stickBlock?[0,0,0]:padDz(s.ax[0],s.ax[1],0.17);
  if(lm>0&&Math.hypot(o.mx,o.my)<0.05){ o.mx=lx; o.my=ly; }
  if(lm>0.93) PAD.full+=dt; else if(lm<0.85) PAD.full=0;
  if(e(PB.L3)) PAD.latch=!PAD.latch;
  if(lm<0.2){ PAD.still+=dt; if(PAD.still>0.25) PAD.latch=false; } else PAD.still=0;
  if(PAD.full>0.3||(PAD.latch&&lm>0.2)) o.sprint=true;
  if(h(PB.W)||h(PB.R2)) o.attack=true;
  if(h(PB.L2)) o.fire=true;
  if(e(PB.E)) o.roll=true;
  if(e(PB.S)) o.jump=true;
  if(h(PB.S)) o.jumpHeld=true;
  if(e(PB.N)) o.use=true;
  if(e(PB.UP)) o.drink=true;
  if(e(PB.DN)) o.whistle=true;
  if(e(PB.R3)||PAD.q.roar) o.roar=true;
  if(PAD.q.wN) o.wNext=true;
  if(PAD.q.wP) o.wPrev=true;
  // right stick aims; without it Ash faces where he walks, with a gentle nudge toward a close enemy while attacking
  const [rx,ry,rm]=padDz(s.ax[2],s.ax[3],0.22);
  if(rm>0){ o.aimX=rx; o.aimY=ry; }
  let ang=rm>0.15?Math.atan2(ry,rx):null;
  if(ang==null&&(o.attack||o.fire)){ const t=padAssist(o); if(t) ang=Math.atan2(t.y-player.y,t.x-player.x); }
  if(ang!=null&&player){ aimMode='mouse'; const k=150; mouse.x=(player.x-cam.x)*zoom+Math.cos(ang)*k; mouse.y=(player.y-cam.y)*zoom+Math.sin(ang)*k; }
  else if(aimMode==='mouse') aimMode='pad';
  o.pad=s.busy||lm>0||rm>0||s.cur.some(Boolean);
  if(PAD.dbg) for(const k of ['jump','jumpHeld','roll','use','drink','whistle','roar','wNext','wPrev','attack','fire','sprint']) if(o[k]) PAD.dbg[k]=(PAD.dbg[k]||0)+1;
}
function padAssist(o){
  const p=player; if(!p||!G) return null;
  const base=Math.hypot(o.mx,o.my)>0.2?Math.atan2(o.my,o.mx):p.facing; let best=null, bd=200*200;
  for(const e of G.enemies){
    if(e.dead||e.passive||e.alpha<0.3||e.spawnIn>0) continue;
    const d=dist2(p.x,p.y,e.x,e.y); if(d>=bd) continue;
    const da=Math.abs(((Math.atan2(e.y-p.y,e.x-p.x)-base)%TAU+TAU*1.5)%TAU-Math.PI);
    if(da<1.15){ bd=d; best=e; }
  }
  return best;
}
// labels in the DOM that name buttons (the dialogue "next" and "skip" hints), kept in step with the device
function padLabels(){
  if(scene!=='dialogue') return;
  const n=$('#dlgNext'), sk=$('#dlgSkip'); if(!n||!sk) return;
  const dev=curDevice();
  if(dev==='pad'){
    const ok=padOkBtn(), bk=ok===PB.S?PB.E:PB.S, key=PAD.kind+ok;
    if(n.dataset.pad!==key||!n.querySelector('.pg')){ n.dataset.pad=key; n.innerHTML=`${padChip(ok)} next &#9656;`; sk.innerHTML=`Skip scene ${padChip(bk)}`; }
  }else if(n.querySelector('.pg')){ n.dataset.pad=''; n.textContent=usingTouch?'Tap ▸':'Click or Space ▸'; sk.innerHTML='Skip scene &#9197;'; }
  dlgLogLabel(dev);
}

// ---------- menus and overlays: a focus ring you move with the d-pad or stick
const NAV_SEL='button,input:not([type=hidden]),select,textarea,a[href],[tabindex]';
function navItems(root){
  if(!root) return [];
  if(root.id==='dialogue') return Array.from(root.querySelectorAll('#dlgOpts button')).filter(vis);
  return Array.from(root.querySelectorAll(NAV_SEL)).filter(el=>!el.disabled&&!el.hidden&&el.tabIndex>=0&&!el.classList.contains('dlg')&&!el.closest('[hidden]')&&vis(el));
}
function navFocus(el){
  if(!el) return;
  try{ el.focus({preventScroll:true}); }catch(e){ try{ el.focus(); }catch(e2){} }
  try{ el.scrollIntoView({block:'nearest',inline:'nearest'}); }catch(e){}
}
function navRestore(root){
  const el=PAD.mem[root.id]; if(!el||!el.isConnected||usingTouch) return;
  PAD.restoring=true;
  setTimeout(()=>{ PAD.restoring=false; if(navRoot()===root&&navItems(root).includes(el)) navFocus(el); },60);
}
function navDefault(root,items){ return items.find(el=>el.matches('[data-focus]'))||items[0]; }
function navNear(root,r){
  const items=navItems(root); if(!items.length) return; const cx=(r.left+r.right)/2, cy=(r.top+r.bottom)/2; let best=null,bd=1e12;
  for(const el of items){ const b=el.getBoundingClientRect(), d=((b.left+b.right)/2-cx)**2+((b.top+b.bottom)/2-cy)**2; if(d<bd){ bd=d; best=el; } }
  navFocus(best);
}
function isScroll(n){ if(!n||n.scrollHeight<=n.clientHeight+4) return false; const oy=getComputedStyle(n).overflowY; return oy==='auto'||oy==='scroll'; }
function navScroller(root,el){
  for(let n=el&&el.parentElement;n&&n!==document.body;n=n.parentElement){ if(n!==root&&isScroll(n)) return n; if(n===root) break; }
  const inner=Array.from(root.querySelectorAll('.jbody,.hbody,[data-scroll]')).find(isScroll); if(inner) return inner;
  return isScroll(root)?root:null;
}
const canScroll=(sc,sg)=>sg>0?sc.scrollTop+sc.clientHeight<sc.scrollHeight-3:sc.scrollTop>2;
function navMove(root,dir){
  const items=navItems(root), cur=document.activeElement, V=dir==='u'||dir==='d', sg=(dir==='d'||dir==='r')?1:-1;
  const sc=navScroller(root,items.includes(cur)?cur:null);
  if(!items.length){ if(sc&&V) sc.scrollBy({top:sg*sc.clientHeight*0.5,behavior:'smooth'}); return; }
  if(!items.includes(cur)){ navFocus(navDefault(root,items)); return; }
  const a=cur.getBoundingClientRect(), acx=(a.left+a.right)/2, acy=(a.top+a.bottom)/2;
  let best=null,bs=1e9;
  for(const el of items){
    if(el===cur) continue;
    const b=el.getBoundingClientRect(), bcx=(b.left+b.right)/2, bcy=(b.top+b.bottom)/2;
    let main,off,cross;
    if(V){ if((bcy-acy)*sg<=2) continue; main=sg>0?b.top-a.bottom:a.top-b.bottom; if(main<-Math.min(a.height,b.height)*0.5) continue; off=Math.max(0,b.left-a.right,a.left-b.right); cross=Math.abs(bcx-acx); }
    else { if((bcx-acx)*sg<=2) continue; main=sg>0?b.left-a.right:a.left-b.right; if(main<-Math.min(a.width,b.width)*0.5) continue; off=Math.max(0,b.top-a.bottom,a.top-b.bottom); if(off>0) continue; cross=Math.abs(bcy-acy); }
    const sc2=Math.max(0,main)+off*3+cross*0.12+(off>0?30:0);
    if(sc2<bs){ bs=sc2; best=el; }
  }
  // inside a scrolling box, scroll to read the rest before jumping out of it
  if(V&&sc&&canScroll(sc,sg)&&(!best||!sc.contains(best))){ sc.scrollBy({top:sg*sc.clientHeight*0.5,behavior:'smooth'}); return; }
  if(!best&&V&&items.length>2){
    // wrap around: the far end, nearest in x
    let ex=null, ev=sg>0?1e9:-1e9;
    for(const el of items){ const b=el.getBoundingClientRect(), v=sg>0?b.top:b.bottom; if(sg>0?v<ev-2:v>ev+2){ ev=v; ex=el; } else if(Math.abs(v-ev)<=2&&ex){ const e0=ex.getBoundingClientRect(); if(Math.abs((b.left+b.right)/2-acx)<Math.abs((e0.left+e0.right)/2-acx)) ex=el; } }
    best=ex;
  }
  if(!best) return;
  // stepping into a row of toggles lands on the one that is switched on
  const seg=best.parentElement;
  if(V&&seg&&seg.classList.contains('seg')&&!seg.contains(cur)){ const on=Array.from(seg.children).find(b=>b.getAttribute('aria-pressed')==='true'&&items.includes(b)); if(on) best=on; }
  navFocus(best); SFX.play('ui',0.35);
}
function navOk(root){
  if(root.id==='dialogue'){
    const opts=navItems(root);
    if(opts.length){ const f=opts.includes(document.activeElement)?document.activeElement:opts[0]; f.click(); }
    else dlgNext();
    return;
  }
  const items=navItems(root), el=document.activeElement;
  if(!items.includes(el)){ navFocus(navDefault(root,items)); return; }
  if(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'){ try{ el.focus(); el.click(); }catch(e){} return; }
  const r=el.getBoundingClientRect(); SFX.init(); el.click();
  // the click may rebuild this screen (journal, save slots): keep the ring close to where it was
  const r2=navRoot(); if(r2===root&&!navItems(root).includes(document.activeElement)) navNear(root,r);
}
// "back" for each screen: the same as Escape there; every screen has a way out
const DLG_EXIT=/^(goodbye|bye|see you|just looking|not right now|not now|maybe later|give me a minute|no thanks|never mind|i'll come back)/i;
function ovBack(root){
  const id=root&&root.id; if(!id) return;
  const click=s=>{ const b=$(s); if(b&&vis(b)){ b.click(); return true; } return false; };
  if(id==='dialogue'){
    // with choices up, back moves to the way-out choice (Goodbye, Just looking...), and a second press takes it;
    // story decisions have no way-out choice, so back never makes one by accident
    const opts=navItems(root), ex=opts.slice().reverse().find(b=>DLG_EXIT.test(b.textContent.replace(/^\s*\d+/,'').trim()));
    if(ex){ if(document.activeElement===ex) ex.click(); else { navFocus(ex); SFX.play('ui',0.35); } }
    else dlgAskSkip('pad');
  }
  else if(id==='how') closeHow();
  else if(id==='settings') closeSettings();
  else if(id==='slots'){ if(slotConfirm){ slotConfirm=null; renderSlots(); SFX.play('ui'); } else click('#bSlotsClose'); }
  else if(id==='acct') click('#acClose');
  else if(id==='pause') resumeGame();
  else if(id==='mapov') closeMap();
  else if(id==='jour') closeJournal();
  else if(id==='dead') click('#bRetry');
  else if(id==='victory') click('#bWinExplore');
  else if(id==='menu'||id==='upgrade') return;
  else {
    // a screen from another module (skills and so on): its close button, or Escape
    const b=Array.from(root.querySelectorAll('button')).find(x=>vis(x)&&(/close|back|done/i.test(x.id)||/^\s*(close|done|back|got it|resume)\b/i.test(x.textContent)));
    if(b) b.click();
    else { for(const t of ['keydown','keyup']) dispatchEvent(new KeyboardEvent(t,{key:'Escape',code:'Escape',bubbles:true})); }
  }
}
function navTab(root,d){
  if(root.id==='mapov'){ if(typeof mapCycle==='function') mapCycle(d); return; }
  const bar=Array.from(root.querySelectorAll('[data-tabs],.jtabs,.sktabs,#acTabs,[role="tablist"]')).find(vis); if(!bar) return;
  const bs=Array.from(bar.querySelectorAll('button')).filter(b=>!b.disabled&&!b.hidden&&vis(b)); if(bs.length<2) return;
  let i=bs.findIndex(b=>b.getAttribute('aria-pressed')==='true'||b.getAttribute('aria-selected')==='true'||b.classList.contains('on')); if(i<0) i=0;
  const n=bs[(i+d+bs.length)%bs.length], keep=bar.contains(document.activeElement)||!navItems(root).includes(document.activeElement);
  n.click(); if(keep) navFocus(n);
}
function padMenu(root,s,dt){
  PAD.ui=true;
  const ok=padOkBtn(), back=ok===PB.S?PB.E:PB.S, h=i=>s.cur[i]&&!s.block[i];
  let d='';
  if(h(PB.UP)) d='u'; else if(h(PB.DN)) d='d'; else if(h(PB.LF)) d='l'; else if(h(PB.RT)) d='r';
  if(!d&&!PAD.stickBlock){ const x=s.ax[0], y=s.ax[1]; if(Math.hypot(x,y)>0.55) d=Math.abs(x)>Math.abs(y)?(x>0?'r':'l'):(y>0?'d':'u'); }
  const N=PAD.nav;
  if(d&&d!==N.d){ N.d=d; N.t=0.42; navMove(root,d); }
  else if(d){ N.t-=dt; if(N.t<=0){ N.t=0.12; navMove(root,d); } }
  else N.d='';
  if(s.ed[ok]) navOk(root);
  else if(s.ed[back]) ovBack(root);
  else if(root.id==='dialogue'&&s.ed[PB.N]&&!(DLG&&DLG.opts)) dlgNext();
  if(s.ed[PB.L1]) navTab(root,-1);
  if(s.ed[PB.R1]) navTab(root,1);
  if(s.ed[PB.ST]){ if(root.id==='pause') resumeGame(); else if(root.id==='mapov') closeMap(); else if(root.id==='jour') closeJournal(); }
  if(s.ed[PB.SEL]||s.ed[PB.TP]){ if(root.id==='mapov') closeMap(); else if(root.id==='jour') closeJournal(); else if(root.id==='dialogue') openLog(); else if(root.id==='logov') closeLog(); }
  // right stick scrolls long pages
  const ry=s.ax[3]; if(Math.abs(ry)>0.25){ const sc=navScroller(root,document.activeElement); if(sc) sc.scrollTop+=Math.sign(ry)*(Math.abs(ry)-0.2)*1100*dt; }
}
// keyboard: the arrow keys move the same focus ring on menu screens
function navKey(e){
  const dir={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'}[e.code]; if(!dir) return false;
  const root=navRoot(); if(!root) return false;
  e.preventDefault(); navMove(root,dir); return true;
}

// ---------- rumble
function rumble(strong,weak,ms){
  if(!settings.rumble||!padActive()) return false;
  let gp=null; try{ gp=navigator.getGamepads()[PAD.idx]; }catch(e){}
  if(!gp) return false;
  const now=performance.now(), R=PAD.rum;
  if(now<R.until&&Math.max(strong,weak)<R.str*0.85) return false;
  R.until=now+ms; R.str=Math.max(strong,weak);
  try{
    const va=gp.vibrationActuator;
    if(va&&va.playEffect){ const p=va.playEffect('dual-rumble',{startDelay:0,duration:ms,weakMagnitude:clamp(weak,0,1),strongMagnitude:clamp(strong,0,1)}); if(p&&p.catch) p.catch(()=>{}); return true; }
    const ha=gp.hapticActuators&&gp.hapticActuators[0]; if(ha&&ha.pulse){ ha.pulse(clamp(Math.max(strong,weak),0,1),ms); return true; }
  }catch(e){}
  return false;
}
// rumble follows the game: Ash gets hurt, big hits land (hitstop), the ground shakes (boss stomps), level ups
function rumbleWatch(){
  const W0=PAD.rw;
  if(!G||!player||!(scene==='play'||scene==='dying')){ W0.G=null; return; }
  if(W0.G!==G){ W0.G=G; W0.hp=player.hp; W0.lvl=player.level; W0.hs=hitstop; W0.sk=shakeMag; W0.dead=player.dead; return; }
  let st=0, wk=0, ms=0;
  const ask=(a,b,m)=>{ if(Math.max(a,b)>Math.max(st,wk)){ st=a; wk=b; ms=m; } };
  if(player.hp<W0.hp-0.5){ const f=clamp((W0.hp-player.hp)/player.maxHp*5,0.25,1); ask(0.3+0.6*f,0.75,130+f*140); }
  if(hitstop>W0.hs+0.02) ask(hitstop>0.06?0.32:0.12,hitstop>0.06?0.55:0.32,hitstop>0.06?90:55);
  if(shakeMag>W0.sk+5&&shakeMag>=9) ask(clamp(shakeMag/18,0.4,1),0.45,170+shakeMag*7);
  if(player.dead&&!W0.dead) ask(1,1,480);
  if(player.level>W0.lvl){ rumble(0.15,0.55,110); setTimeout(()=>rumble(0.55,0.9,240),190); }
  if(ms) rumble(st,wk,ms);
  W0.hp=player.hp; W0.lvl=player.level; W0.hs=hitstop; W0.sk=shakeMag; W0.dead=player.dead;
}

// ---------- settings: controller, vibration, confirm button and fullscreen (built here so the rows sit in one place)
const fsOn=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
const fsCan=()=>!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
function toggleFullscreen(){
  try{
    let p;
    if(fsOn()) p=(document.exitFullscreen||document.webkitExitFullscreen).call(document);
    else { const el=document.documentElement; p=(el.requestFullscreen||el.webkitRequestFullscreen).call(el); }
    if(p&&p.catch) p.catch(()=>{ const n=$('#setFullNote'); if(n) n.textContent='The browser said no. Try its own fullscreen button, or F11.'; });
  }catch(e){}
}
function padSettingsInit(){
  const done=$('#bSettingsClose'); if(!done||$('#setPadBox')) return;
  const box=document.createElement('div'); box.id='setPadBox';
  box.innerHTML=`<div class="setsec">Controller and screen</div>
<p class="setnote" id="setPadName"></p>
<div class="setrow"><span>Vibration<small>The controller rumbles when you get hit, land big blows and level up.</small></span><div class="seg" id="setRumble" role="group"><button type="button" data-v="on" aria-pressed="false">On</button><button type="button" data-v="off" aria-pressed="false">Off</button></div></div>
<div class="setrow"><span>Menu confirm button<small>Auto uses the right button on Nintendo controllers and the bottom one on the others.</small></span><div class="seg" id="setPadOk" role="group"><button type="button" data-v="auto" aria-pressed="false">Auto</button><button type="button" data-v="south" aria-pressed="false">Bottom</button><button type="button" data-v="east" aria-pressed="false">Right</button></div></div>
<div class="setrow"><span>Fullscreen<small id="setFullNote">Great on a TV, a tablet or an Xbox.</small></span><button type="button" class="btn c sm" id="bFull">Go fullscreen</button></div>`;
  done.parentElement.before(box);
  for(const b of box.querySelectorAll('#setRumble button')) b.addEventListener('click',()=>{ settings.rumble=b.dataset.v==='on'; store.set('eb_rumble',settings.rumble); SFX.play('ui'); padRenderSettings(); if(settings.rumble) rumble(0.4,0.7,160); });
  for(const b of box.querySelectorAll('#setPadOk button')) b.addEventListener('click',()=>{ settings.padOk=b.dataset.v; store.set('eb_padok',settings.padOk); SFX.play('ui'); PAD.lastBtn=''; padRenderSettings(); });
  $('#bFull').addEventListener('click',()=>{ SFX.play('ui'); toggleFullscreen(); });
  for(const ev of ['fullscreenchange','webkitfullscreenchange']) document.addEventListener(ev,padRenderSettings);
  padRenderSettings();
}
function padRenderSettings(){
  const nm=$('#setPadName'); if(!nm) return;
  const any=PAD.known.size>0, id=PAD.idx>=0?PAD.id:(any?Array.from(PAD.known.values())[0]:'');
  nm.innerHTML=any?`${escapeHtml(padName(id))} found. ${padChip(padOkBtn(padKindOf(id)==='gen'?'xbox':padKindOf(id)),padKindOf(id)==='gen'?'xbox':padKindOf(id))} picks in menus.`:'None found yet. Plug one in or pair it, then press any button.';
  const seg=(sel,v)=>{ for(const b of document.querySelectorAll(sel+' button')) b.setAttribute('aria-pressed',String(b.dataset.v===v)); };
  seg('#setRumble',settings.rumble?'on':'off'); seg('#setPadOk',settings.padOk);
  const fb=$('#bFull'); if(fb){ fb.textContent=fsOn()?'Leave fullscreen':'Go fullscreen'; fb.hidden=!fsCan(); }
  const how=$('#how'); if(how&&how.classList.contains('on')&&typeof renderHow==='function') renderHow();
}
padSettingsInit();

// ---------- the controller picture on the How to Play page
function drawPadDiagram(cv,k){
  const K=padK(k), g=cv.getContext('2d'), Wd=720, Hd=300, sc=cv.width/Wd;
  g.setTransform(sc,0,0,sc,0,0); g.clearRect(0,0,Wd,Hd);
  // body
  const body=()=>{ g.beginPath(); g.moveTo(272,74); g.lineTo(448,74); g.bezierCurveTo(500,74,522,110,532,160); g.bezierCurveTo(546,230,540,272,506,274); g.bezierCurveTo(480,276,466,252,452,228);
    g.bezierCurveTo(441,210,422,206,402,206); g.lineTo(318,206); g.bezierCurveTo(298,206,279,210,268,228); g.bezierCurveTo(254,252,240,276,214,274); g.bezierCurveTo(180,272,174,230,188,160); g.bezierCurveTo(198,110,220,74,272,74); g.closePath(); };
  // shoulders and triggers
  for(const [x,i] of [[262,6],[458,7]]){ g.fillStyle='#2a2320'; rrect(g,x-34,30,68,30,10); g.fill(); }
  for(const [x,i] of [[262,4],[458,5]]){ g.fillStyle='#3a302b'; rrect(g,x-40,56,80,22,9); g.fill(); }
  g.save(); g.shadowColor='rgba(0,0,0,.5)'; g.shadowBlur=18; g.shadowOffsetY=8; body(); g.fillStyle=k==='ps'?'#e9e6e1':k==='nin'?'#2f3136':'#3a3d42'; g.fill(); g.restore();
  body(); g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=2; g.stroke();
  const light=k==='ps';
  const stick=(x,y)=>{ g.fillStyle=light?'#2a2b30':'#1f2023'; g.beginPath(); g.arc(x,y,24,0,TAU); g.fill(); g.fillStyle=light?'#43454c':'#33353a'; g.beginPath(); g.arc(x,y,17,0,TAU); g.fill(); g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=2; g.beginPath(); g.arc(x,y,12,0,TAU); g.stroke(); };
  const P=k==='ps'?{dp:[262,128],ls:[318,176],rs:[402,176],fb:[458,128]}:{ls:[262,128],dp:[318,176],rs:[402,176],fb:[458,128]};
  stick(...P.ls); stick(...P.rs);
  const [dx,dy]=P.dp; g.fillStyle=light?'#2a2b30':'#1f2023'; rrect(g,dx-9,dy-28,18,56,4); g.fill(); rrect(g,dx-28,dy-9,56,18,4); g.fill();
  g.fillStyle='#ffd27a'; for(const [ax,ay] of [[0,-1],[0,1],[-1,0],[1,0]]){ g.save(); g.translate(dx+ax*19,dy+ay*19); g.rotate(Math.atan2(ay,ax)); g.beginPath(); g.moveTo(5,0); g.lineTo(-3,-5); g.lineTo(-3,5); g.closePath(); g.fill(); g.restore(); }
  const [fx,fy]=P.fb; const fp=[[fx,fy+24],[fx+24,fy],[fx-24,fy],[fx,fy-24]];
  for(let i=0;i<4;i++) drawPadGlyph(g,i,k,fp[i][0],fp[i][1],12);
  const MB=k==='ps'?[[300,104],[420,104]]:[[326,112],[394,112]];
  if(k==='ps'){ g.fillStyle='#d6d3ce'; rrect(g,326,80,68,34,8); g.fill(); g.strokeStyle='rgba(0,0,0,.12)'; g.lineWidth=1; g.stroke(); }
  drawPadGlyph(g,8,k,MB[0][0],MB[0][1],k==='ps'?7:8); drawPadGlyph(g,9,k,MB[1][0],MB[1][1],k==='ps'?7:8);
  for(const [x,i] of [[262,6],[458,7]]) drawPadGlyph(g,i,k,x,40,9);
  for(const [x,i] of [[262,4],[458,5]]) drawPadGlyph(g,i,k,x,67,8);
  // small labels on the body for the middle buttons and the left face button, callouts for the rest
  const tcol=light?'#3a3330':'#e9dcc8';
  g.textAlign='center'; g.textBaseline='middle'; g.font=`700 11px ${UIF}`; g.fillStyle=tcol;
  g.fillText('Map',MB[0][0],MB[0][1]-16); g.fillText('Pause',MB[1][0],MB[1][1]-16);
  g.textAlign='right'; g.fillText('Attack',fp[2][0]-16,fp[2][1]);
  const L=[[262,40,22,'Fire breath'],[262,67,40,'Previous weapon'],[P.ls[0],P.ls[1],24,'Move, click: sprint'],[P.dp[0],P.dp[1],30,'↑ drink · ↓ call friend\n← → switch quest']].sort((a,b)=>a[1]-b[1]);
  const R=[[458,40,22,'Attack'],[458,67,40,'Next weapon'],[fp[3][0],fp[3][1],12,'Talk and use'],[fp[1][0],fp[1][1],12,'Roll'],[fp[0][0],fp[0][1],12,'Jump'],[P.rs[0],P.rs[1],24,'Aim, click: Roar']];
  const line=(x0,y0,x1,y1)=>{ g.strokeStyle='rgba(255,200,140,.6)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); g.fillStyle='#ffc35a'; g.beginPath(); g.arc(x0,y0,2.4,0,TAU); g.fill(); g.beginPath(); g.arc(x1,y1,1.6,0,TAU); g.fill(); };
  const label=(t,x,y,al)=>{ g.font=`600 13px ${UIF}`; g.textAlign=al; g.fillStyle='#f3e4cc'; const ls=t.split('\n'); ls.forEach((s,i)=>g.fillText(s,x,y+(i-(ls.length-1)/2)*16)); };
  let prev=-1e9; for(const [x,y,r,t] of L){ const ly=Math.max(y,prev+36); prev=ly; line(x-r,y,178,ly); label(t,172,ly,'right'); }
  prev=-1e9; for(const [x,y,r,t] of R){ const ly=Math.max(y,prev+24); prev=ly; line(x+r,y,542,ly); label(t,548,ly,'left'); }
}
// the controller table on the How to Play page, for the pad kind k
function padHelpRows(k){
  const c=i=>padChip(i,k), ok=padOkBtn(k), bk=ok===PB.S?PB.E:PB.S, chip=t=>`<i class="pg s">${t}</i>`;
  return [
    [chip('Left stick'),`Move. Push it all the way to sprint, or click it (${escapeHtml(padBtnName(PB.L3,k))}).`],
    [chip('Right stick'),'Aim. Without it Ash faces where he walks.'],
    [c(PB.S),'Jump, once Ash learns how. With wings, jump again in the air to fly.'],
    [`${c(PB.W)} ${c(PB.R2)}`,'Attack. Hold for a combo.'],
    [c(PB.L2),'Fire breath'],
    [c(PB.E),'Dodge roll'],
    [c(PB.N),'Talk, open, rest at a shrine'],
    [`${c(PB.R1)} ${c(PB.L1)}`,'Next or previous weapon'],
    [`${c(PB.R3)} or ${c(PB.L1)}+${c(PB.R1)}`,'Dragon Roar, once the meter is full'],
    [c(PB.UP),'Drink a healing draught'],
    [c(PB.DN),'Call your companion'],
    [`${c(PB.LF)} ${c(PB.RT)}`,'Switch which quest you follow (in Normal Mode: switch weapons)'],
    [c(PB.SEL),'World map. Hold it for the journal. In a conversation it opens the log of everything said.'],
    [c(PB.ST),'Pause. Hold it for your skills. Clicking both sticks in at once pauses too.'],
    [`${c(ok)} ${c(bk)}`,'In menus: pick, go back. The d-pad or left stick moves, L1 and R1 switch tabs.'.replace('L1 and R1',`${padBtnName(PB.L1,k)} and ${padBtnName(PB.R1,k)}`)]
  ];
}
window.__ebX=Object.assign(window.__ebX||{},{btnLabel,btnHTML,rumble,toggleFullscreen,padActive,curDevice,padKindOf,
  padInfo:()=>({idx:PAD.idx,kind:PAD.kind,dev:PAD.dev,id:PAD.id,known:PAD.known.size,rumble:settings.rumble,padOk:settings.padOk,aimMode,usingTouch,root:(navRoot()||{}).id||null,focus:document.activeElement&&(document.activeElement.id||document.activeElement.textContent.trim().slice(0,40))}),
  padSeen(){ const d=PAD.dbg||{}; PAD.dbg={}; return d; }, touchLayout(){ return {btn:tLayout(),mini:MINI_R(),pause:PAUSE_R(),mute:MUTE_R(),prompt:PROMPT_R,W,H}; }, offerUpgrades(){ offerUpgrades(null); }, killPlayer(){ playerDied(); }});
