
// ================= input
const keys=new Set(), pressed=new Set();
// keys that went down outside play (the Enter or J that closed a conversation): they do not attack until let go
const OFFK=new Set();
const mouse={x:0,y:0,l:false,r:false};
const touch={stickId:null,ox:0,oy:0,sx:0,sy:0,btn:{},held:{},pressed:{},full:0,fireT:0};
// keyboard and mouse: Ash faces the way he walks and attacks lock on to a foe in front (a6b_weapons.js aimAssist).
// Settings > "Aim with the mouse" brings back the twin-stick style where he faces the pointer.
settings.mouseAim=store.get('eb_mouseaim',false)===true;
// Settings > "Handed" (controls build). Left mirrors the touch buttons (under the left thumb, the stick on the right),
// shows the left-handed keyboard (mouse in the left hand, the right hand on the arrows) and makes controllers southpaw.
// The left-handed keys always work; the setting changes which keys the game shows and how controllers are laid out.
settings.hand=store.get('eb_hand','right')==='left'?'left':'right';
const lefty=()=>settings.hand==='left';
// on a touch screen, even before the first touch on the game itself (a phone taps the menus, then the tip is written)
const COARSE=(()=>{ try{ return matchMedia('(pointer: coarse)').matches; }catch(e){ return false; } })();
const touchy=()=>usingTouch||(COARSE&&typeof PAD!=='undefined'&&PAD.dev!=='kb'&&PAD.dev!=='pad');
// Settings > "Tips": how-to tips and the first-play help. Each one has a small X that closes it for good on this device.
settings.tips=store.get('eb_tips',true)!==false;
const TIPS_SHUT=(()=>{ const v=store.get('eb_tipshut',null); return v&&typeof v==='object'&&!Array.isArray(v)?v:{}; })();
const tipsOn=()=>settings.tips;
function tipOn(id){ return settings.tips&&!(id&&TIPS_SHUT[id]); }
function tipShut(id){ if(id&&!TIPS_SHUT[id]){ TIPS_SHUT[id]=1; store.set('eb_tipshut',TIPS_SHUT); } try{ SFX.play('ui'); }catch(e){} }
function tipsReset(){ for(const k in TIPS_SHUT) delete TIPS_SHUT[k]; store.set('eb_tipshut',null); }
// the X in the corner of a canvas tip (cx,cy is its centre); taps and clicks reach fn through HUD_HITS
function tipX(cx,cy,fn,r){
  r=r||9; const g=ctx; g.save();
  g.fillStyle='rgba(40,24,14,.96)'; g.strokeStyle='rgba(255,214,150,.75)'; g.lineWidth=1.2; g.beginPath(); g.arc(cx,cy,r,0,TAU); g.fill(); g.stroke();
  const q=r*0.38; g.strokeStyle='#ffe6c0'; g.lineWidth=1.8; g.lineCap='round'; g.beginPath(); g.moveTo(cx-q,cy-q); g.lineTo(cx+q,cy+q); g.moveTo(cx+q,cy-q); g.lineTo(cx-q,cy+q); g.stroke();
  g.restore();
  const h=usingTouch?44:Math.max(24,r*2+8); HUD_HITS.push({x:cx-h/2,y:cy-h/2,w:h,h,fn,tipx:true});
}
addEventListener('keydown',e=>{ if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')){ if(e.code==='Escape'&&scene==='menu'){ show('menu'); } return; } SFX.init(); if(!keys.has(e.code)) pressed.add(e.code); keys.add(e.code); if(scene!=='play') OFFK.add(e.code); else if(!e.repeat) OFFK.delete(e.code); onKey(e); });
addEventListener('keyup',e=>{ keys.delete(e.code); OFFK.delete(e.code); });
addEventListener('blur',()=>{ keys.clear(); OFFK.clear(); mouse.l=mouse.r=mouse.lp=false; touch.held={}; touch.stickId=null; if(scene==='play') pauseGame(); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&scene==='play') pauseGame(); });
cvs.addEventListener('mousemove',e=>{ mouse.x=e.clientX; mouse.y=e.clientY; if(!usingTouch) aimMode='mouse'; });
cvs.addEventListener('mousedown',e=>{
  SFX.init(); mouse.x=e.clientX; mouse.y=e.clientY;
  if(scene==='play'&&hudClick(e.clientX,e.clientY)) return;
  usingTouch=false; aimMode='mouse';
  if(scene==='play') bannerSkip();
  if(e.button===0){ mouse.l=true; if(scene==='play') mouse.lp=true; } if(e.button===2) mouse.r=true;
});
addEventListener('mouseup',e=>{ if(e.button===0) mouse.l=false; if(e.button===2) mouse.r=false; });
cvs.addEventListener('contextmenu',e=>e.preventDefault());
// touch layout (controls build, v12 fewer buttons). SLASH is the biggest button, right under the thumb, and it also
// talks, opens and picks things up (it says TALK, OPEN and so on when it will). Two thumbs: JUMP, FIRE and ROLL on an
// inner arc around SLASH, then a smaller outer arc that climbs on tall screens and leans left on short ones. One hand:
// columns hugging the edge, filled bottom to top. Settings > Handed: Left mirrors all of it.
// (v12) Most of the time there are only SLASH, FIRE and ROLL (and JUMP once Ash can jump). The others come only when they
// do something: DRINK when Ash is hurt enough for a draught to help and has one (the flasks at the top drink too), ROAR
// when its meter is full, CALL when the companion is away (far behind, off the screen, or told to wait; tapping their
// picture at the top calls too). WEAPON is gone: tap the weapon chip at the top. In this set DRINK takes the old WEAPON
// spot, the closest one of the outer arc. Settings > "Show every button" brings back all eight, always there, as before.
// Every button keeps its own spot when it comes and goes (TL.all holds every spot, a hidden button leaves its spot empty
// and its hit area unused), it pops in, it never pops up under a finger that is already down on that spot, and a button
// under a finger never goes away until the finger lifts. Hit areas reach past the drawn circles but never overlap.
const TBTN_LABEL={attack:'SLASH',fire:'FIRE',roll:'ROLL',roar:'ROAR',drink:'DRINK',use:'USE',weapon:'WEAPON',whistle:'CALL'};
settings.allBtn=store.get('eb_allbtn',false)===true;
const allBtns=()=>!!settings.allBtn;
function jumpLabel(){ return player&&player.flying?'LAND':(hasAbil('wings')&&airborne()?'FLY':'JUMP'); }
const TL={key:'',all:[],out:[],side:true};
// which side the buttons are on: true for the right edge
function touchRight(){ const m=settings.touch||'two'; return m==='two'?!lefty():m!=='left'; }
// the HUD a button must never sit on (fixed boxes, so buttons do not move when the HUD text changes)
function touchKeep(){
  const mr=MINI_R(), story=!!G&&G.mode==='story', qy=SAFE.t+14+(story?92:80);
  return [
    {x:mr.x-10,y:mr.y,w:mr.w+20,h:mr.h+34},                                  // minimap, its clock and the place name
    {x:W-SAFE.r-56,y:SAFE.t+12,w:44,h:156},                                  // pause, sound, the small weapon chip under them
    // vitals, and the item quick-slot chip under the ROAR dial (its 44 px hit area, a12b_ui.js / a11b_hud.js, v12 UI)
    {x:SAFE.l+12,y:SAFE.t+12,w:Math.min(254,mr.x-SAFE.l-22),h:120},
    {x:SAFE.l+6,y:qy-12,w:Math.min(312,W*0.5+12),h:70}                       // the quest goal (or the wave and score)
  ];
}
function tLayoutBuild(mode,right,s,all){
  // the HUD boxes and their mirror images, so the left-handed layout is an exact mirror of the right-handed one
  const B=H-SAFE.b, keep0=touchKeep(), keep=keep0.concat(keep0.map(R=>({x:W-R.x-R.w,y:R.y,w:R.w,h:R.h}))), P=[], gap=11*s;
  const ex=v=>right?W-SAFE.r-v:SAFE.l+v;
  const hudFree=(x,y,r)=>{
    if(x-r<SAFE.l+4||x+r>W-SAFE.r-4||y-r<SAFE.t+4||y+r>B-3) return false;
    for(const R of keep){ const nx=clamp(x,R.x,R.x+R.w), ny=clamp(y,R.y,R.y+R.h); if(Math.hypot(x-nx,y-ny)<r+7) return false; }
    return true;
  };
  const free=(x,y,r,extra)=>hudFree(x,y,r)&&(!extra||extra(x,y,r))&&P.every(q=>Math.hypot(x-q.x,y-q.y)>=q.r+r+gap-0.5);
  if(mode==='two'){
    // the anchor: SLASH sits a thumb's width in from the corner; a little lower on short screens to leave room above
    const short=B-SAFE.t<600, rS=54*s, ax=ex(88*s), ay=short?B-rS-14*s:B-96*s;
    const R1=rS+(short?62:70)*s, R2=R1+80*s, R3=R2+72*s;
    const pos=(deg,rad)=>{ const a=deg*Math.PI/180; return [ax+Math.cos(a)*rad*(right?1:-1),ay+Math.sin(a)*rad]; };
    // keep the half of the screen the other thumb moves on clear, and the ghost stick's spot
    const gx=right?SAFE.l+100:W-SAFE.r-100, gy=B-110;
    const side=(x,y,r)=>(right?x-r>=W*0.3:x+r<=W*0.7)&&Math.hypot(x-gx,y-gy)>r+66;
    P.push({id:'attack',x:ax,y:ay,r:rS});
    // [id, radius, ring, preferred angle]: 180 is toward the middle of the screen, 270 straight up
    // short screens (a phone on its side) fan out to the left along the bottom, tall ones climb
    const want=all?(short?[['jump',40,R1,181],['fire',35,R1,222],['roll',34,R1,262],['roar',29,R2,183],['weapon',28,R2,207],['whistle',23,R3,185],['drink',25,R3,205]]
                         :[['jump',40,R1,190],['fire',35,R1,229],['roll',34,R1,266],['roar',29,R2,204],['weapon',28,R2,229],['whistle',23,R2,254],['drink',25,R2,279]])
                   :(short?[['jump',40,R1,181],['fire',35,R1,222],['roll',34,R1,262],['roar',29,R2,183],['drink',28,R2,207],['whistle',25,R3,192]]
                         :[['jump',40,R1,190],['fire',35,R1,229],['roll',34,R1,266],['roar',29,R2,204],['drink',28,R2,229],['whistle',25,R2,254]]);
    for(const [id,r0,ring,deg] of want){
      const r=r0*s; let got=null;
      for(const rad of ring===R1?[R1,R2,R3]:ring===R2?[R2,R3,R3+72*s]:[R3,R3+72*s]){
        for(let d=0;d<=84&&!got;d+=3) for(const sg of d?[-1,1]:[1]){ const [x,y]=pos(deg+sg*d,rad); if(free(x,y,r,side)){ got={x,y}; break; } }
        if(got) break;
      }
      if(!got){ const [x,y]=pos(deg,ring); got={x,y}; }
      P.push({id,x:got.x,y:got.y,r});
    }
  }else{
    // one hand: columns from the edge, filled bottom to top (at most four high); the stick floats anywhere low that is not a button
    const order=all?[['attack',44],['jump',37],['fire',33],['roll',33],['roar',29],['weapon',28],['drink',26],['whistle',24]]
                   :[['attack',44],['jump',37],['fire',33],['roll',33],['roar',29],['drink',28],['whistle',25]];
    const colX=k=>ex((51+86*k)*s), y0=B-62*s, qtop=B-330;
    let k=0,j=0,y=y0,pr=0;
    for(const [id,r0] of order){
      const r=r0*s;
      for(let tries=0;tries<8;tries++){
        if(j>0) y-=pr+r+gap;
        const x=colX(k), ok=j<4&&free(x,y,r,(x2,y2,r2)=>right||y2-r2>=qtop);
        if(ok){ P.push({id,x,y,r}); j++; pr=r; break; }
        k++; j=0; y=y0; pr=0;
      }
    }
  }
  // hit areas: past the drawn circle, halfway to the nearest neighbour at most (hidden ones count, so they never change)
  for(const b of P){
    let g2=1e9; for(const q of P) if(q!==b) g2=Math.min(g2,Math.hypot(b.x-q.x,b.y-q.y)-b.r-q.r);
    b.hr=b.r+Math.max(4,Math.min((b.id==='attack'?22:16)*s,g2/2-1));
  }
  return P;
}
function tNWeapons(){ const w=(G&&G.weapons)||{}; return Object.keys(w).filter(k=>w[k]).length; }
// may this button show at all on this journey (its spot is kept clear of the prompt pill, the tips and the quest list)
function tMay(id){
  const g=G||{}, story=g.mode==='story';
  if(id==='jump') return !!G&&(!story||hasAbil('jump'));
  if(id==='weapon') return allBtns()&&tNWeapons()>=2;
  if(id==='whistle') return story&&!!g.comp;
  if(id==='drink') return allBtns()||!!player&&player.potions>0;
  return true;
}
// a draught helps once at least half of it would go into health (the drink code in a6_player.js heals 45% of max
// health times the difficulty and the drink perks): about 75% health or less on Normal, 70% on Easy
function tDrinkHelps(){
  const p=player; if(!p||p.dead||!(p.potions>0)||!G) return false;
  const d=G.diff||{}, pool=p.maxHp*0.45*(d.pot||d.heal||1)*((p.stats&&p.stats.drinkMul)||1);
  return p.hp<=p.maxHp*clamp(1-pool*0.5/p.maxHp,0.5,0.85);
}
// the companion is away: told to wait, far behind, or off the screen (CM is a9i_comps.js's companion, null when none)
function tCompAway(){
  try{
    const c=CM; if(!c||CMG!==G||!player||c.hidden||c.outside||c.down>0) return false;
    if(c.mode==='stay') return true;
    if(dist(c.x,c.y,player.x,player.y)>320) return true;
    const sx=(c.x-cam.x)*zoom, sy=(c.y-cam.y)*zoom;
    return sx<-8||sy<-8||sx>W+8||sy>H+8;
  }catch(e){ return false; }
}
// should this button be up right now
function tWant(id){
  if(!tMay(id)) return false;
  if(allBtns()) return true;
  const p=player; if(!p) return false;
  if(id==='drink') return tDrinkHelps();
  if(id==='roar') return p.roar>=100;
  if(id==='whistle') return tCompAway();
  return true;
}
function tLayout(){
  const mode=settings.touch||'two', right=touchRight(), s=clamp(Math.min(W,H)/430,0.8,1.15)*(settings.btn||1), all=allBtns();
  const key=[W,H,SAFE.l,SAFE.r,SAFE.t,SAFE.b,mode,right,s.toFixed(3),!!G&&G.mode,all].join('|');
  if(TL.key!==key){ TL.key=key; TL.all=tLayoutBuild(mode,right,s,all); TL.side=right; }
  // every spot a button is on or may pop up on, so the things that keep clear of buttons never jump when one comes
  const L=TL.out; L.length=0;
  for(const b of TL.all){ if(!tMay(b.id)) continue; b.label=b.id==='jump'?jumpLabel():TBTN_LABEL[b.id]; L.push(b); }
  return L;
}
// ---------- which buttons are up (v12): each one has {on, a (0 to 1, the pop), t (when it last came or went), w (when
// it was last wanted)}. A button that came stays at least TV_MIN seconds and TV_GRACE after its reason is gone (so a
// double tap on CALL still finds it, and DRINK does not blink when health hovers at the line).
const TV={g:null,s:{},pts:{},out:[],last:0};
const TV_MIN={drink:1.2,roar:0.6,whistle:1.8}, TV_GRACE={drink:0.5,roar:0,whistle:1.2};
const tNow=()=>performance.now()/1000;
// fingers down on the screen right now (any of them), so a button never pops up under one
function tTouches(e){ TV.pts={}; for(const t of e.touches) TV.pts[t.identifier]={x:t.clientX,y:t.clientY}; }
function tFingerOn(b){ for(const k in TV.pts){ const q=TV.pts[k]; if(Math.hypot(q.x-b.x,q.y-b.y)<b.hr+8) return true; } return false; }
function tState(b,now){ let st=TV.s[b.id]; if(!st){ const w=tWant(b.id); st=TV.s[b.id]={on:w,a:w?1:0,t:now-9,w:now}; } return st; }
// once a frame while the buttons are drawn (drawTouch, a11b_hud.js)
function tVisTick(){
  const now=tNow(), dt=clamp(now-(TV.last||now),0,0.1); TV.last=now;
  if(TV.g!==G){ TV.g=G; TV.s={}; }   // a new journey or a loaded save: the buttons are just there, no pops
  tLayout();
  const held=Object.values(touch.btn);
  for(const b of TL.all){
    const st=tState(b,now), want=tWant(b.id);
    if(want) st.w=now;
    if(st.on){ if(!want&&!held.includes(b.id)&&now-st.t>=(TV_MIN[b.id]||0)&&now-st.w>=(TV_GRACE[b.id]||0)){ st.on=false; st.t=now; } }
    else if(want&&!tFingerOn(b)){ st.on=true; st.t=now; }
    st.a=st.on?Math.min(1,st.a+dt/0.2):Math.max(0,st.a-dt/0.14);
  }
}
// the buttons on the screen now, each with a (its pop, 0 to 1), live (takes taps: up for 0.1 s and not on its way out)
// and popT (seconds since it came)
function tShown(){
  tLayout(); const out=TV.out, now=tNow(); out.length=0;
  for(const b of TL.all){
    const st=tState(b,now); if(!st.on&&st.a<=0.01) continue;
    b.label=b.id==='jump'?jumpLabel():TBTN_LABEL[b.id]; b.a=st.a; b.live=st.on&&now-st.t>=0.1; b.popT=now-st.t; b.on=st.on;
    out.push(b);
  }
  return out;
}
// the highest point the buttons reach over the x range x0..x1 (the quest list on that side stops above it)
function touchTopOver(x0,x1){ let t=H; for(const b of tLayout()) if(b.x+b.r>x0&&b.x-b.r<x1) t=Math.min(t,b.y-b.r); return t; }
function stickZone(x,y){
  const mode=settings.touch||'two';
  if(mode==='two') return touchRight()?x<W*0.58:x>W*0.42;
  return y>H*0.42;
}
// ---------- one button for attack and use (controls build)
// When there is something to talk to, open, read, enter or pick up and no foe close by, an attack press (SLASH, J, Enter,
// left click, the controller's attack buttons) does that instead of swinging. Foes near: attack attacks. A press that
// started as a swing never turns into a talk, attack stays attack for 0.4 s after a swing, and a key still held from a
// conversation or a menu does nothing until it is let go (OFFK). E, F and the controller's top button stay a dedicated use.
const ATK={press:'',swingT:-9,g:null,buf:0,lsw:0,lcd:0};
// (v11) an attack pressed while Ash cannot swing yet (the end of a swing, a roll, a drink) is kept for ATK_BUF seconds
// and swings as soon as he can, so a quick tap is never lost. A click shorter than one frame counts too (mouse.lp).
// The bow, hammer, whip, bombs and glaive read how long the button is held, so only the plain swings are buffered.
const ATK_BUF=0.3;
// the foe a fresh click landed on (or next to), while that press lasts: a6_player.js aims the swing at it
function clickFoe(R){
  const c=ATK.ck, p=player; if(!c||!G||!p||G.time-c.t>0.45) return null;
  let best=null, bd=1e9;
  for(const e of G.enemies){
    if(e.dead||e.passive||e.invuln||e.alpha<0.3||e.spawnIn>0) continue;
    const dc=dist(c.x,c.y,e.x,e.y)-(e.r||10); if(dc>48) continue;
    if(dist(p.x,p.y,e.x,e.y)-(e.r||10)>R) continue;
    if(dc<bd){ bd=dc; best=e; }
  }
  return best;
}
function atkBufOK(){ const w=curWeapon(), D=wDef(w); return !D.input||w==='boomerang'; }
const PROMPT_KINDS=[
  [/^(talk|chat|ask|speak|greet)/i,'talk','TALK'],
  [/^(open|unlock)/i,'open','OPEN'],
  [/^read/i,'read','READ'],
  [/^(enter|go in)/i,'enter','ENTER'],
  [/^(leave|exit|go out)/i,'leave','LEAVE'],
  [/^go (back )?(up|down)/i,'stairs','GO'],
  [/^(rest|sleep|sit|nap)/i,'rest','REST'],
  [/^(pick|take|grab|collect|gather|get|chip|dig|mine|fill)/i,'take','TAKE'],
  [/^(fish|cast)/i,'fish','FISH'],
  [/^(pet|hug|cuddle|feed|say hi)/i,'pet','PET'],
  [/^help/i,'help','HELP'],
  [/^(look|browse|examine|search|peek|check|count|sniff|rummage|inspect|watch|study|knock)/i,'look','LOOK'],
  [/^(play|wind|ring|try)/i,'play','PLAY']
];
const PK_LABEL={talk:'TALK',open:'OPEN',read:'READ',enter:'ENTER',leave:'LEAVE',stairs:'GO',rest:'REST',take:'TAKE',fish:'FISH',pet:'PET',help:'HELP',look:'LOOK',play:'PLAY',use:'USE',reel:'REEL',wait:'WAIT'};
const PK_CACHE=new Map();
// what a prompt does, as a short word for the SLASH button: a kind set on the prompt wins, else its first words
function promptKind(pr){
  if(!pr) return null;
  if(pr.kind&&PK_LABEL[pr.kind]) return {k:pr.kind,label:PK_LABEL[pr.kind]};
  const t=String(pr.text||'').trim();
  let r=PK_CACHE.get(t);
  if(!r){ r={k:'use',label:'USE'}; for(const [re,k,l] of PROMPT_KINDS) if(re.test(t)){ r={k,label:l}; break; } if(PK_CACHE.size>300) PK_CACHE.clear(); PK_CACHE.set(t,r); }
  return r;
}
// a foe close enough that attack should stay attack: anything angry within R, any foe right next to Ash, or a boss fight
function foeNear(R){
  const p=player; if(!p||!G) return false;
  if(G.boss&&!G.boss.dead) return true;
  for(const e of G.enemies){
    if(e.dead||e.passive||e.frozen||e.alpha<0.3) continue;
    const d=dist(p.x,p.y,e.x,e.y)-(e.r||0);
    if(d<(e.aggro?R:90)) return true;
  }
  return false;
}
// what an attack press would do right now instead of attacking (null: it attacks)
function useMode(){
  if(scene!=='play'||!G||!player||player.dead) return null;
  const p=player;
  if(G.fishing) return G.inCombat?null:(G.fishing.bite>0?{k:'reel',label:'REEL',hot:true}:{k:'wait',label:'WAIT'});
  if(!G.prompt||p.flying) return null;
  const since=G.time-ATK.swingT;
  if(p.swingT>0||p.ham||p.bow||p.dashT>0||(ATK.g===G&&since>=0&&since<0.4)) return null;
  if(foeNear(220)) return null;
  return promptKind(G.prompt);
}
// the left-handed keyboard (mouse in the left hand): arrows move, the action keys sit around them and the number pad
const LEFT_KEYS={roll:['ControlRight','Numpad0'],jump:['Slash','Numpad1'],fire:['Quote','Numpad2'],drink:['Period','Numpad3'],use:['Backslash','NumpadEnter'],roar:['Semicolon'],wNext:['BracketRight'],wPrev:['BracketLeft'],whistle:['Comma']};
const PLAY_KEYS=new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Enter','NumpadEnter','Slash','Quote','Backslash','Semicolon','Period','Comma','BracketLeft','BracketRight','ControlRight','ShiftRight','Numpad0','Numpad1','Numpad2','Numpad3']);
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
  e.preventDefault(); tTouches(e);
  for(const t of e.changedTouches){
    const x=t.clientX,y=t.clientY;
    // (v12) only the buttons that are up take taps; a tap on an empty spot does what a tap there always did. A button
    // goes first: the HUD never sits on one (touchKeep), but a banner's tap-to-skip box can reach over the outer ones,
    // and a tap on DRINK must drink, not skip "Quest updated"
    let hit=null, hd=1e9; for(const b of tShown()){ if(!b.live) continue; const d=dist(x,y,b.x,b.y)/(b.hr||b.r+14); if(d<1&&d<hd){ hd=d; hit=b; } }
    if(!hit&&hudClick(x,y)){ TV.tap={x,y,hud:true}; continue; }
    TV.tap={x,y,hit:hit?hit.id:null};
    if(hit){ touch.btn[t.identifier]=hit.id; touch.held[hit.id]=true; touch.pressed[hit.id]=true; if(hit.id==='fire'&&settings.touch!=='two') touch.fireT=1.1; }
    else if(touch.stickId===null&&stickZone(x,y)){ touch.stickId=t.identifier; touch.ox=touch.sx=x; touch.oy=touch.sy=y; touch.full=0; }
  }
},{passive:false});
cvs.addEventListener('touchmove',e=>{
  if(scene!=='play') return; e.preventDefault(); tTouches(e);
  for(const t of e.changedTouches){
    if(t.identifier===touch.stickId){
      touch.sx=t.clientX; touch.sy=t.clientY;
      const d=dist(touch.ox,touch.oy,touch.sx,touch.sy);
      if(d>70){ const a=angTo(touch.sx,touch.sy,touch.ox,touch.oy); touch.ox=touch.sx+Math.cos(a)*70; touch.oy=touch.sy+Math.sin(a)*70; }
    }
  }
},{passive:false});
const tEnd=e=>{
  tTouches(e);
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
  const WSEL={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Digit5:4,Digit6:5,Digit7:6,Digit8:7,Digit9:8};
  let wSel=-1; for(const k in WSEL) if(pressed.has(k)) wSel=WSEL[k];
  const K=c=>keys.has(c), P=c=>pressed.has(c), LP=a=>LEFT_KEYS[a].some(P), LH=a=>LEFT_KEYS[a].some(K), KA=c=>(K(c)||P(c))&&!OFFK.has(c);
  const mClick=!!mouse.lp; mouse.lp=false; ATK.f=(ATK.f||0)+1;
  const o={mx,my,
    attack:KA('KeyJ')||KA('Enter')||mouse.l||mClick||!!touch.held.attack||!!touch.pressed.attack,
    fire:K('KeyK')||LH('fire')||mouse.r||!!touch.held.fire||(touch.fireT>0),
    roll:P('Space')||LP('roll')||!!touch.pressed.roll,
    roar:P('KeyQ')||LP('roar')||!!touch.pressed.roar,
    drink:P('KeyR')||LP('drink')||!!touch.pressed.drink,
    use:P('KeyE')||P('KeyF')||LP('use')||!!touch.pressed.use,
    sprint:K('ShiftLeft')||K('ShiftRight')||stickFull,
    jump:P('KeyC')||LP('jump')||!!touch.pressed.jump, jumpHeld:K('KeyC')||LH('jump')||!!touch.held.jump,
    wNext:P('KeyX')||LP('wNext')||!!touch.pressed.weapon, wPrev:P('KeyZ')||LP('wPrev'), wSel,
    whistle:P('KeyG')||LP('whistle')||!!touch.pressed.whistle, aimX:0, aimY:0, pad:false};
  padInput(o,dt);
  // one button for attack and use: decided once, when the press starts (see useMode)
  const p=player;
  if(!o.attack) ATK.press='';
  else if(!ATK.press){ const um=useMode(); ATK.press=um?'use':'atk'; if(um) o.use=true; else{ if(p&&G&&atkBufOK()) ATK.buf=ATK_BUF;
    // a click on a foe swings at that foe (without "Aim with the mouse" Ash still faces the way he walks otherwise)
    ATK.ck=(mouse.l||mClick)&&!usingTouch&&!settings.mouseAim&&G?Object.assign(toWorld(mouse.x,mouse.y),{t:G.time}):null; } }
  if(ATK.press==='use') o.attack=false;
  // the kept press: used once a swing starts (its cooldown jumps up) or a hold weapon takes over
  if(ATK.buf>0){
    ATK.buf-=dt;
    // (a press kept from before a jump never turns into a Ground Pound in the air)
    const used=!p||(p.swingT>0&&ATK.lsw<=0)||p.atkCd>ATK.lcd+0.02||!!p.ham||!!p.bow||p.dead||!atkBufOK()||airborne();
    if(used) ATK.buf=0; else if(!o.attack&&ATK.press!=='use') o.attack=true;
  }
  // a roll pressed while the last one is still going is kept a little longer too (about 0.3 s; the game keeps 0.15 s)
  if(o.roll) ATK.rb=0.15;
  else if(ATK.rb>0){ ATK.rb-=dt; if(p&&(p.dashT>0||p.dead)) ATK.rb=0; else if(G&&G.dashBuf<=0.02&&ATK.rb>0) o.roll=true; }
  if(p&&p.atkCd>ATK.lcd+0.02) ATK.n=(ATK.n||0)+1;   // swings started (tests)
  ATK.lsw=p?p.swingT:0; ATK.lcd=p?p.atkCd:0;
  if((ATK.press==='atk'&&o.attack)||(p&&(p.swingT>0||p.ham||p.bow))){ ATK.swingT=G.time; ATK.g=G; }
  if(!o.attack&&ATK.press!=='use'&&autoSwing()) o.attack=true;
  if(o.use) bannerSkip();
  return o;
}
function onKey(e){
  const c=e.code;
  if(c==='KeyN'&&!e.repeat&&scene!=='dialogue'){ toggleAllSound(); return; }
  if(scene==='play'){
    // (the left-handed keys too: in Firefox / and ' open the find bar, and Enter would press a focused button)
    if(PLAY_KEYS.has(c)) e.preventDefault();
    if(c==='Escape'||c==='KeyP') pauseGame();
    else if((c==='KeyM'||c==='Tab')&&G.mode==='story') openMap();
    else if(c==='KeyI'&&G.mode==='story') openJournal();
    else if(c==='KeyT'&&G.mode==='story') cycleFocus();
    else if(c==='KeyU'&&G.mode==='story') openSkills();
    else if(c==='KeyL'&&!e.repeat) openLog();
    if((c==='KeyJ'||c==='KeyK'||c==='Enter'||c==='Quote')&&!usingTouch) aimMode='keys';
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
    // a held key never skips more than one line (repeats are ignored), and Escape asks before it skips
    const dn={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Numpad1:0,Numpad2:1,Numpad3:2,Numpad4:3}[c];
    if(dn!=null&&DLG&&DLG.opts){ e.preventDefault(); if(!e.repeat) dlgChoose(dn); return; }
    if(navKey(e)) return;
    if(c==='Space'||c==='Enter'||c==='NumpadEnter'||c==='KeyJ'||c==='KeyE'){
      e.preventDefault(); if(e.repeat) return;
      const f=document.activeElement;
      if(DLG&&DLG.opts&&f&&f.closest&&f.closest('#dlgOpts')) f.click(); else dlgNext();
    }
    else if(c==='Escape'){ e.preventDefault(); if(!e.repeat) dlgAskSkip('key'); }
    else if(c==='KeyL'){ e.preventDefault(); if(!e.repeat) openLog(); }
  }else if(scene==='log'){
    // the log overlay (a12c_log.js): Escape or L closes it, the arrow keys move between the filters
    if(c==='Escape'||c==='KeyL'){ e.preventDefault(); if(!e.repeat) closeLog(); }
    else if(c==='BracketLeft'||c==='BracketRight'||c==='KeyQ'||c==='KeyE'){ e.preventDefault(); logFilterStep(c==='BracketLeft'||c==='KeyQ'?-1:1); }
    else if(c==='PageUp'||c==='PageDown'||c==='Home'||c==='End'){ e.preventDefault(); logScroll(c); }
    else navKey(e);
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
const camLead={x:0,y:0};
function updateCam(dt,snap){
  if(!player) return;
  moveZoom(dt);   // zooms out a little while Ash flies (a6c_moves.js)
  const vw=W/zoom, vh=H/zoom;
  let fx=player.x, fy=player.y;
  const b=G&&G.boss;
  if(b&&!b.dead&&!b.noClip){ fx+=clamp((b.x-player.x)*0.3,-160,160); fy+=clamp((b.y-player.y)*0.3,-120,120); }
  // look ahead: toward the pointer with mouse aim (or the right stick, which steers the same pointer), else a
  // little way along the way Ash walks
  if(aimMode==='mouse'&&!usingTouch&&scene==='play'&&(settings.mouseAim||padActive())){ const w=toWorld(mouse.x,mouse.y); fx+=clamp((w.x-player.x)*0.12,-60,60); fy+=clamp((w.y-player.y)*0.12,-60,60); }
  else if(!snap){ const mv=scene==='play'&&player.moving&&!usingTouch, k=1-Math.exp(-dt*2.2); camLead.x+=((mv?Math.cos(player.facing)*34:0)-camLead.x)*k; camLead.y+=((mv?Math.sin(player.facing)*24:0)-camLead.y)*k; fx+=camLead.x; fy+=camLead.y; }
  const CM=mapOfY(fy); let tx=clamp(fx-vw/2,-200,CM.w-vw+200), ty=clamp(fy-vh/2,CM.y0-200,CM.y0+CM.h-vh+200);
  if(AREA){ const aw=AREA.x1-AREA.x0, ah=AREA.y1-AREA.y0; tx=aw<vw?AREA.x0+aw/2-vw/2:clamp(fx-vw/2,AREA.x0-60,AREA.x1-vw+60); ty=ah<vh?AREA.y0+ah/2-vh/2:clamp(fy-vh/2,AREA.y0-60,AREA.y1-vh+60); }
  if(snap){ cam.x=tx; cam.y=ty; return; }
  const k=1-Math.exp(-dt*6); cam.x+=(tx-cam.x)*k; cam.y+=(ty-cam.y)*k;
}
function inView(x,y,m){ return x>cam.x-m&&y>cam.y-m&&x<cam.x+W/zoom+m&&y<cam.y+H/zoom+m; }
// test hooks (v11 UX): spawn a foe next to Ash, and what the attack button is doing
window.__ebDbg=Object.assign(window.__ebDbg||{},{
  dlg:()=>DLG?{i:DLG.i,n:DLG.lines.length,chars:Math.floor(DLG.chars),len:(DLG.text||'').length,opts:DLG.opts?DLG.opts.length:0,shown:!document.getElementById('dlgOpts').hidden,skipArm:!!DLG.skipArm,text:String(DLG.text||'').slice(0,50)}:null,
  scr:(x,y)=>({x:(x-cam.x)*zoom,y:(y-cam.y)*zoom}),
  lvl:n=>{ let k=0; while(player.level<n&&k++<99) gainXp(xpNeed(player.level)-player.xp+1); return player.level; },
  spawn:(type,x,y,o)=>{ const e=makeEnemy(type,x,y,Object.assign({aggro:true,level:1},o||{})); return e&&e.id; },
  atk:()=>({n:ATK.n||0,frames:ATK.f||0,press:ATK.press,buf:ATK.buf||0,swingT:player?player.swingT:0,atkCd:player?player.atkCd:0,mouseL:mouse.l})
});
// (v12) test hooks for the touch buttons: every spot in this layout, and the ones on the screen now
window.__ebDbg=Object.assign(window.__ebDbg||{},{
  tbtn:()=>tShown().map(b=>({id:b.id,x:Math.round(b.x),y:Math.round(b.y),r:+b.r.toFixed(1),hr:+b.hr.toFixed(1),a:+(b.a||0).toFixed(2),live:!!b.live,label:b.label})),
  tall:()=>{ tLayout(); return TL.all.map(b=>({id:b.id,x:Math.round(b.x),y:Math.round(b.y),r:+b.r.toFixed(1),hr:+b.hr.toFixed(1),may:tMay(b.id),want:tWant(b.id)})); },
  tkeep:()=>touchKeep(), hudHits:()=>HUD_HITS.map(h=>({x:Math.round(h.x),y:Math.round(h.y),w:Math.round(h.w),h:Math.round(h.h),tipx:!!h.tipx})),
  tpress:()=>Object.assign({},touch.pressed), tlast:()=>TV.tap||null, theld:()=>Object.assign({},touch.held)
});
