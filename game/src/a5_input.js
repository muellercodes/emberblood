
// ================= input
const keys=new Set(), pressed=new Set();
const mouse={x:0,y:0,l:false,r:false};
const touch={stickId:null,ox:0,oy:0,sx:0,sy:0,btn:{},held:{},pressed:{},full:0,fireT:0};
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
// touch layout. Two thumbs: SLASH in the corner, an inner ring (FIRE, JUMP, ROLL, DRINK) and an outer ring (USE, ROAR,
// WEAPON) that climbs up on tall screens and swings left on short ones, plus a small CALL button further out.
// One hand: columns hugging the edge, filled bottom to top, at most four buttons high and never under the HUD.
// Every button keeps its spot when others come and go (USE only shows with a prompt, JUMP once Ash can jump,
// WEAPON with two or more weapons, CALL with a companion), so thumbs can learn where things are.
const TBTN_LABEL={attack:'SLASH',fire:'FIRE',roll:'ROLL',roar:'ROAR',drink:'DRINK',use:'USE',weapon:'WEAPON',whistle:'CALL'};
function jumpLabel(){ return player&&player.flying?'LAND':(hasAbil('wings')&&airborne()?'FLY':'JUMP'); }
function tLayout(){
  const mode=settings.touch||'two', s=clamp(Math.min(W,H)/430,0.8,1.15)*(settings.btn||1), B=H-SAFE.b, L=[];
  const right=mode!=='left', sx=v=>right?W-SAFE.r-v:SAFE.l+v;
  const g=G||{}, story=g.mode==='story', mr=MINI_R();
  const has={use:!!g.prompt, jump:!!G&&(!story||hasAbil('jump')), weapon:Object.keys(g.weapons||{}).filter(k=>g.weapons[k]).length>=2, whistle:story&&!!g.comp};
  const add=(id,x,y,r)=>{ if(id in has&&!has[id]) return; L.push({id,x,y,r,label:id==='jump'?jumpLabel():TBTN_LABEL[id]}); };
  // keep clear of the minimap and its labels, the pause and sound buttons and the vitals panel
  const hudFree=(x,y,r)=>{
    if(x-r<SAFE.l+2||x+r>W-SAFE.r-2||y-r<SAFE.t+2||y+r>B-2) return false;
    const hit=(R)=>{ const nx=clamp(x,R.x,R.x+R.w), ny=clamp(y,R.y,R.y+R.h); return Math.hypot(x-nx,y-ny)<r+6; };
    return !hit({x:mr.x-10,y:mr.y,w:mr.w+20,h:mr.h+34})&&!hit({x:W-SAFE.r-56,y:SAFE.t+12,w:44,h:92})&&!hit({x:SAFE.l+12,y:SAFE.t+12,w:Math.min(254,mr.x-SAFE.l-22),h:84});
  };
  if(mode==='two'){
    // tall screens stack the outer ring upward; short (phone landscape) screens swing it left along the bottom
    const R1=126*s, R2=214*s, R3=292*s, top=SAFE.t+14+mr.h+34;
    const up=B-90*s-R2-38*s>top, ax=sx(82*s), ay=B-(up?90:84)*s;
    const pos=(deg,rad)=>{ const a=deg*Math.PI/180; return [ax+Math.cos(a)*rad*(right?1:-1),ay+Math.sin(a)*rad]; };
    const at=(deg,rad,id,r)=>{ const [x,y]=pos(deg,rad); add(id,x,y,r); };
    add('attack',ax,ay,50*s);
    if(up){
      at(179,R1,'fire',34*s); at(214,R1,'jump',38*s); at(249,R1,'roll',31*s); at(284,R1,'drink',24*s);
      at(221,R2,'use',35*s); at(246,R2,'roar',30*s); at(271,R2,'weapon',30*s);
      // the companion call goes high on the arc if there is room, else under the sound button
      let [wx,wy]=pos(256,R3); if(!hudFree(wx,wy,23*s)) [wx,wy]=pos(236,R3);
      if(!hudFree(wx,wy,23*s)){ wx=W-SAFE.r-34; wy=SAFE.t+130; }
      add('whistle',wx,wy,Math.min(23*s,20));
    }else{
      at(168,R1,'fire',34*s); at(203,R1,'jump',38*s); at(237,R1,'roll',31*s);
      at(165,R2,'drink',24*s); at(182,R2,'roar',30*s); at(201,R2,'use',35*s);
      at(182,R3,'weapon',30*s); at(204,R3,'whistle',23*s);
    }
  }else{
    // one hand: columns from the edge, filled bottom to top; the stick floats anywhere low that is not a button
    const order=[['attack',40],['jump',34],['roll',31],['fire',31],['use',34],['drink',26],['roar',27],['weapon',28],['whistle',22]];
    const colX=k=>sx((46+82*k)*s), y0=B-66*s;
    const lim=k=>{
      if(!right) return Math.max(B-322,SAFE.t+205);
      const x=colX(k); if(x>mr.x-46&&x<mr.x+mr.w+46) return mr.y+mr.h+36;
      return x>W-SAFE.r-80?SAFE.t+108:SAFE.t+40;
    };
    let k=0,j=0,y=y0,pr=0;
    for(const [id,r0] of order){
      const r=r0*s;
      if(j>0) y-=pr+r+8*s;
      if(j>=4||(j>0&&y-r<lim(k))){ k++; j=0; y=y0; }
      add(id,colX(k),y,r); j++; pr=r;
    }
  }
  return L;
}
function stickZone(x,y){
  const mode=settings.touch||'two';
  if(mode==='two') return x<W*0.58;
  return y>H*0.42;
}
const PAUSE_R=()=>({x:W-SAFE.r-54,y:SAFE.t+14,w:40,h:40});
const MUTE_R=()=>({x:W-SAFE.r-54,y:SAFE.t+60,w:40,h:40});
const MINI_R=()=>{ const r=W<560?52:70; return {x:W-SAFE.r-68-r*2,y:SAFE.t+14,w:r*2,h:r*2,r}; };
const inRect=(r,x,y)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
let TRACK_R=null;
// HUD_HITS: modules push {x,y,w,h,fn} while drawing the HUD each frame (cleared at the start of drawHUD)
const HUD_HITS=[];
// HUD_RX: the next free x to the right of the vitals panel; chips that sit there use it and move it along
let HUD_RX=0;
function hudClick(x,y){
  for(const h of HUD_HITS) if(inRect(h,x,y)){ h.fn(); return true; }
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
    let hit=null, hd=1e9; for(const b of tLayout()){ const d=dist(x,y,b.x,b.y)-b.r; if(d<14&&d<hd){ hd=d; hit=b; } }
    if(hit){ touch.btn[t.identifier]=hit.id; touch.held[hit.id]=true; touch.pressed[hit.id]=true; if(hit.id==='fire'&&settings.touch!=='two') touch.fireT=1.1; }
    else if(touch.stickId===null&&stickZone(x,y)){ touch.stickId=t.identifier; touch.ox=touch.sx=x; touch.oy=touch.sy=y; touch.full=0; }
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
  if(touch.fireT>0) touch.fireT-=dt;
  const WSEL={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Digit5:4,Digit6:5};
  let wSel=-1; for(const k in WSEL) if(pressed.has(k)) wSel=WSEL[k];
  const o={mx,my,
    attack:keys.has('KeyJ')||mouse.l||!!touch.held.attack||autoSwing(),
    fire:keys.has('KeyK')||mouse.r||!!touch.held.fire||(touch.fireT>0),
    roll:pressed.has('Space')||!!touch.pressed.roll,
    roar:pressed.has('KeyQ')||pressed.has('KeyL')||!!touch.pressed.roar,
    drink:pressed.has('KeyR')||!!touch.pressed.drink,
    use:pressed.has('KeyE')||pressed.has('KeyF')||!!touch.pressed.use,
    sprint:keys.has('ShiftLeft')||keys.has('ShiftRight')||stickFull,
    jump:pressed.has('KeyC')||!!touch.pressed.jump, jumpHeld:keys.has('KeyC')||!!touch.held.jump,
    wNext:pressed.has('KeyX')||!!touch.pressed.weapon, wPrev:pressed.has('KeyZ'), wSel,
    whistle:pressed.has('KeyG')||!!touch.pressed.whistle, aimX:0, aimY:0, pad:false};
  padInput(o,dt);
  return o;
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
    else if(c==='KeyU'&&G.mode==='story') openSkills();
    if((c==='KeyJ'||c==='KeyK')&&!usingTouch) aimMode='keys';
  }else if(scene==='map'){
    if(c==='Escape'||c==='KeyM'||c==='Tab'){ e.preventDefault(); closeMap(); }
    else if(c==='BracketLeft'||c==='BracketRight'){ e.preventDefault(); mapCycle(c==='BracketLeft'?-1:1); }
    else navKey(e);
  }else if(scene==='journal'){
    if(c==='Escape'||c==='KeyI'){ e.preventDefault(); closeJournal(); }
    else navKey(e);
  }else if(scene==='paused'){
    // Escape backs out one screen (settings or How to Play go back to the pause menu), P resumes from the pause menu
    const r=navRoot();
    if(c==='Escape'){ e.preventDefault(); if(r&&['pause','settings','how'].includes(r.id)) ovBack(r); else if(!r) resumeGame(); }
    else if(c==='KeyP'&&r&&r.id==='pause'){ e.preventDefault(); resumeGame(); }
    else navKey(e);
  }else if(scene==='dialogue'){
    const dn={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Numpad1:0,Numpad2:1,Numpad3:2,Numpad4:3}[c];
    if(dn!=null&&DLG&&DLG.opts){ e.preventDefault(); chooseOpt(dn); return; }
    if(navKey(e)) return;
    if(c==='Space'||c==='Enter'||c==='KeyJ'||c==='KeyE'){
      e.preventDefault(); if(e.repeat) return;
      const f=document.activeElement;
      if(DLG&&DLG.opts&&f&&f.closest&&f.closest('#dlgOpts')) f.click(); else advanceDialogue();
    }
    else if(c==='Escape'){ e.preventDefault(); skipDialogue(); }
  }else if(scene==='upgrade'){
    const n={Digit1:0,Digit2:1,Digit3:2,Numpad1:0,Numpad2:1,Numpad3:2}[c];
    if(n!=null){ e.preventDefault(); chooseUpgrade(n); }
    else navKey(e);
  }else{
    // title menu, save slots, settings, account, How to Play, game over and victory
    const r=navRoot();
    if(c==='Escape'){ if(r&&['how','settings','slots','acct'].includes(r.id)){ e.preventDefault(); ovBack(r); } }
    else navKey(e);
  }
}
function toWorld(sx,sy){ return {x:sx/zoom+cam.x,y:sy/zoom+cam.y}; }
function updateCam(dt,snap){
  if(!player) return;
  moveZoom(dt);   // zooms out a little while Ash flies (a6c_moves.js)
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
