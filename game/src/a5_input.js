
// ================= input
const keys=new Set(), pressed=new Set();
const mouse={x:0,y:0,l:false,r:false};
const touch={stickId:null,ox:0,oy:0,sx:0,sy:0,btn:{},held:{},pressed:{},full:0};
addEventListener('keydown',e=>{ if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')){ if(e.code==='Escape'&&scene==='menu'){ show('menu'); } return; } SFX.init(); if(!keys.has(e.code)) pressed.add(e.code); keys.add(e.code); onKey(e); });
addEventListener('keyup',e=>{ keys.delete(e.code); });
addEventListener('blur',()=>{ keys.clear(); mouse.l=mouse.r=false; touch.held={}; touch.stickId=null; if(scene==='play') pauseGame(); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&scene==='play') pauseGame(); });
cvs.addEventListener('mousemove',e=>{ mouse.x=e.clientX; mouse.y=e.clientY; if(!usingTouch) aimMode='mouse'; });
cvs.addEventListener('mousedown',e=>{
  SFX.init(); mouse.x=e.clientX; mouse.y=e.clientY;
  if(scene==='play'&&hudClick(e.clientX,e.clientY)) return;
  usingTouch=false; aimMode='mouse';
  if(e.button===0) mouse.l=true; if(e.button===2) mouse.r=true;
});
addEventListener('mouseup',e=>{ if(e.button===0) mouse.l=false; if(e.button===2) mouse.r=false; });
cvs.addEventListener('contextmenu',e=>e.preventDefault());
function tLayout(){
  const s=clamp(Math.min(W,H)/430,0.78,1.15), R=W-SAFE.r, B=H-SAFE.b;
  const L=[
    {id:'attack',x:R-82*s,y:B-96*s,r:48*s,label:'SLASH'},
    {id:'fire',x:R-192*s,y:B-62*s,r:35*s,label:'FIRE'},
    {id:'roll',x:R-74*s,y:B-208*s,r:33*s,label:'ROLL'},
    {id:'roar',x:R-178*s,y:B-170*s,r:30*s,label:'ROAR'},
    {id:'drink',x:R-266*s,y:B-140*s,r:25*s,label:'DRINK'}
  ];
  if(G&&G.prompt) L.push({id:'use',x:R-150*s,y:B-268*s,r:30*s,label:'USE'});
  return L;
}
const PAUSE_R=()=>({x:W-SAFE.r-54,y:SAFE.t+14,w:40,h:40});
const MUTE_R=()=>({x:W-SAFE.r-54,y:SAFE.t+60,w:40,h:40});
const MINI_R=()=>{ const r=W<560?52:70; return {x:W-SAFE.r-68-r*2,y:SAFE.t+14,w:r*2,h:r*2,r}; };
const inRect=(r,x,y)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
let TRACK_R=null;
function hudClick(x,y){
  if(inRect(PAUSE_R(),x,y)){ pauseGame(); return true; }
  if(TRACK_R&&G&&G.mode==='story'&&inRect(TRACK_R,x,y)){ openJournal(); return true; }
  if(inRect(MUTE_R(),x,y)){ toggleAllSound(); return true; }
  if(G&&G.mode==='story'&&inRect(MINI_R(),x,y)){ openMap(); return true; }
  return false;
}
cvs.addEventListener('touchstart',e=>{
  usingTouch=true; aimMode='touch'; SFX.init();
  if(scene!=='play') return;
  e.preventDefault();
  for(const t of e.changedTouches){
    const x=t.clientX,y=t.clientY;
    if(hudClick(x,y)) continue;
    let hit=null; for(const b of tLayout()) if(dist(x,y,b.x,b.y)<b.r+12){hit=b;break;}
    if(hit){ touch.btn[t.identifier]=hit.id; touch.held[hit.id]=true; touch.pressed[hit.id]=true; }
    else if(touch.stickId===null&&x<W*0.6){ touch.stickId=t.identifier; touch.ox=touch.sx=x; touch.oy=touch.sy=y; touch.full=0; }
  }
},{passive:false});
cvs.addEventListener('touchmove',e=>{
  if(scene!=='play') return; e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===touch.stickId){
      touch.sx=t.clientX; touch.sy=t.clientY;
      const d=dist(touch.ox,touch.oy,touch.sx,touch.sy);
      if(d>70){ const a=angTo(touch.sx,touch.sy,touch.ox,touch.oy); touch.ox=touch.sx+Math.cos(a)*70; touch.oy=touch.sy+Math.sin(a)*70; }
    }
  }
},{passive:false});
const tEnd=e=>{
  for(const t of e.changedTouches){
    if(t.identifier===touch.stickId){ touch.stickId=null; touch.full=0; }
    const id=touch.btn[t.identifier];
    if(id){ delete touch.btn[t.identifier]; if(!Object.values(touch.btn).includes(id)) touch.held[id]=false; }
  }
};
cvs.addEventListener('touchend',tEnd); cvs.addEventListener('touchcancel',tEnd);
function readInput(dt){
  let mx=0,my=0,stickFull=false;
  if(keys.has('KeyW')||keys.has('ArrowUp')) my-=1;
  if(keys.has('KeyS')||keys.has('ArrowDown')) my+=1;
  if(keys.has('KeyA')||keys.has('ArrowLeft')) mx-=1;
  if(keys.has('KeyD')||keys.has('ArrowRight')) mx+=1;
  if(touch.stickId!==null){
    const dx=touch.sx-touch.ox, dy=touch.sy-touch.oy, m=Math.hypot(dx,dy);
    if(m>6){ const k=Math.min(1,m/55); mx=dx/m*k; my=dy/m*k; }
    if(m>=62){ touch.full+=dt; stickFull=touch.full>0.35; } else touch.full=0;
  }
  const l=Math.hypot(mx,my); if(l>1){mx/=l;my/=l;}
  return {mx,my,
    attack:keys.has('KeyJ')||mouse.l||!!touch.held.attack,
    fire:keys.has('KeyK')||mouse.r||!!touch.held.fire,
    roll:pressed.has('Space')||!!touch.pressed.roll,
    roar:pressed.has('KeyQ')||pressed.has('KeyL')||!!touch.pressed.roar,
    drink:pressed.has('KeyR')||!!touch.pressed.drink,
    use:pressed.has('KeyE')||pressed.has('KeyF')||!!touch.pressed.use,
    sprint:keys.has('ShiftLeft')||keys.has('ShiftRight')||stickFull};
}
function onKey(e){
  const c=e.code;
  if(c==='KeyN'&&!e.repeat&&scene!=='dialogue'){ toggleAllSound(); return; }
  if(scene==='play'){
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(c)) e.preventDefault();
    if(c==='Escape'||c==='KeyP') pauseGame();
    else if((c==='KeyM'||c==='Tab')&&G.mode==='story') openMap();
    else if(c==='KeyI'&&G.mode==='story') openJournal();
    else if(c==='KeyT'&&G.mode==='story') cycleFocus();
    if((c==='KeyJ'||c==='KeyK')&&!usingTouch) aimMode='keys';
  }else if(scene==='map'){
    if(c==='Escape'||c==='KeyM'||c==='Tab'){ e.preventDefault(); closeMap(); }
  }else if(scene==='journal'){
    if(c==='Escape'||c==='KeyI'){ e.preventDefault(); closeJournal(); }
  }else if(scene==='paused'){
    if((c==='Escape'||c==='KeyP')&&!$('#how').classList.contains('on')){ e.preventDefault(); resumeGame(); }
    else if(c==='Escape') closeHow();
  }else if(scene==='dialogue'){
    const dn={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Numpad1:0,Numpad2:1,Numpad3:2,Numpad4:3}[c];
    if(dn!=null&&DLG&&DLG.opts){ e.preventDefault(); chooseOpt(dn); return; }
    if(c==='Space'||c==='Enter'||c==='KeyJ'||c==='KeyE'){ e.preventDefault(); if(!e.repeat) advanceDialogue(); }
    else if(c==='Escape'){ e.preventDefault(); skipDialogue(); }
  }else if(scene==='upgrade'){
    const n={Digit1:0,Digit2:1,Digit3:2,Numpad1:0,Numpad2:1,Numpad3:2}[c];
    if(n!=null){ e.preventDefault(); chooseUpgrade(n); }
  }else if(scene==='menu'){
    if(c==='Escape'&&$('#how').classList.contains('on')) closeHow();
  }
}
function toWorld(sx,sy){ return {x:sx/zoom+cam.x,y:sy/zoom+cam.y}; }
function updateCam(dt,snap){
  if(!player) return;
  const vw=W/zoom, vh=H/zoom;
  let fx=player.x, fy=player.y;
  const b=G&&G.boss;
  if(b&&!b.dead&&!b.noClip){ fx+=clamp((b.x-player.x)*0.3,-160,160); fy+=clamp((b.y-player.y)*0.3,-120,120); }
  if(aimMode==='mouse'&&!usingTouch&&scene==='play'){ const w=toWorld(mouse.x,mouse.y); fx+=clamp((w.x-player.x)*0.12,-60,60); fy+=clamp((w.y-player.y)*0.12,-60,60); }
  let tx=clamp(fx-vw/2,-200,WORLD.w-vw+200), ty=clamp(fy-vh/2,-200,WORLD.h-vh+200);
  if(AREA){ const aw=AREA.x1-AREA.x0, ah=AREA.y1-AREA.y0; tx=aw<vw?AREA.x0+aw/2-vw/2:clamp(fx-vw/2,AREA.x0-60,AREA.x1-vw+60); ty=ah<vh?AREA.y0+ah/2-vh/2:clamp(fy-vh/2,AREA.y0-60,AREA.y1-vh+60); }
  if(snap){ cam.x=tx; cam.y=ty; return; }
  const k=1-Math.exp(-dt*6); cam.x+=(tx-cam.x)*k; cam.y+=(ty-cam.y)*k;
}
function inView(x,y,m){ return x>cam.x-m&&y>cam.y-m&&x<cam.x+W/zoom+m&&y<cam.y+H/zoom+m; }
