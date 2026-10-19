
// ================= v9 shared threads (e7b_threads.js): the cross-act helpers every act and the finale call
// THREADS.md 4 (the moon), 5 (the Ember Heart and the Shards), 9.3 (Pebble's letters), 10 (allies), 12 (dreams),
// 14.1 (Tamsin's verses), 15 (shared speakers), 17 (the journal's story so far), 18.3 (EPI), 18.4 (the helpers).
// Every helper with an example call: scratchpad/THREADS_API.md. Everything here wraps; the one edit elsewhere is the
// radius of Ash's and Pip's own light in drawLights (a11_render.js), which calls moonGlowK() and pipGlowR().

// ================= 1. the moon (THREADS 4): one value, G.flags.moon, percent left (absent means 100)
const MOON_DARK=[0,0.02,0.04,0.07,0.10,0.13,0.16];        // extra night darkness per bite (index = bitesOf)
const MOON_BEATS=[100,95,85,60,40,20,0];                   // the suggested beats, one per bite count
const MOON_COL={full:[200,216,255],none:[138,138,154]};    // moonlight: silver #c8d8ff (full) to grey #8a8a9a (none)
const MOON={anim:null,crumbs:[],pulse:0,hud:null,last:0,spr:new Map(),img:new Map()};
function moonLeft(){ const F=G&&G.flags, v=F?F.moon:null; if(v==null||v===''||!isFinite(+v)) return 100; return clamp(+v,0,100); }
// bites shown for a percentage: 100 -> 0; 95+ -> 1; 85+ -> 2; 60+ -> 3; 40+ -> 4; above 0 -> 5; 0 -> 6
function bitesOf(pct){ const m=pct==null?moonLeft():+pct; if(!(m<100)) return 0; if(m>=95) return 1; if(m>=85) return 2; if(m>=60) return 3; if(m>=40) return 4; if(m>0) return 5; return 6; }
// moonSet(pct): the moon only shrinks (min of now and pct); the HUD notices and plays the bite animation once
function moonSet(pct){
  if(!G||!G.flags) return 100;
  const p=+pct; if(!isFinite(p)) return moonLeft();
  const v=Math.min(moonLeft(),clamp(p,0,100)); G.flags.moon=v; moonWatch(); return v;
}
// the finale's ending only: the moon comes back whole (its look then follows G.choices.n_end), no bite animation
function moonRestore(){ if(!G||!G.flags) return 100; G.flags.moon=100; G.flags.moon_hud=0; MOON.anim=null; MOON.crumbs.length=0; return 100; }
// 'bitten' until the finale; then 'dawn' (silver with three seams), 'moth' (a tiny moth sits on it at full moon), 'ember' (gold)
function moonLook(){ const e=G&&G.choices&&G.choices.n_end; if(!e||moonLeft()<100) return 'bitten'; return e==='embermoon'?'ember':e==='moth'?'moth':e==='dawn'?'dawn':'bitten'; }
function moonFullNight(){ try{ return dayNow()%8===0; }catch(e){ return false; } }
// the extra night dark the moon adds outdoors (drawLights adds it through mapNight)
function moonDark(){ if(!G||G.mode!=='story'||AREA) return 0; return (1-daylight())*MOON_DARK[bitesOf()]; }
// Ash's own light at night grows 6 percent per bite, so a moonless night stays playable
function moonGlowK(){ if(!G||G.mode!=='story'||AREA) return 1; return 1+0.06*bitesOf()*(1-daylight()); }
// Pip's light: 90 px, and a bigger silver-gold glow once Pip learns Lantern (G.flags.m_pip_lamp, THREADS 8)
function pipGlowR(){ return G&&G.flags&&G.flags.m_pip_lamp?120:90; }
function pipGlowI(){ return G&&G.flags&&G.flags.m_pip_lamp?0.72:0.5; }
// the HUD keeps G.flags.moon_hud = the bites it shows; a drop queues the animation (it waits until combat is over)
function moonWatch(){
  if(!G||!G.flags) return; const F=G.flags, b=bitesOf();
  if(F.moon_hud==null||!isFinite(+F.moon_hud)){ F.moon_hud=b; return; }
  if(b<F.moon_hud){ F.moon_hud=b; MOON.anim=null; }
}
const moonPending=()=>!!(G&&G.flags&&G.flags.moon_hud!=null&&bitesOf()>G.flags.moon_hud);
const moonShown=()=>{ const F=G&&G.flags; if(!F) return 0; if(MOON.anim) return MOON.anim.t<MOON_CRUNCH?MOON.anim.from:MOON.anim.to; return F.moon_hud!=null?clamp(F.moon_hud|0,0,6):bitesOf(); };
function moonCalm(){
  return G&&G.mode==='story'&&scene==='play'&&!DLG&&!G.inCombat&&!(G.boss&&!G.boss.dead)&&!(player&&player.dead)&&!G.mini&&!(G.fade>0.3)
    &&!(typeof EV!=='undefined'&&EV.dream)&&!PEBRT.crow&&!moonCardOn();
}
// a chapter or act card on screen (showCard): the bite waits for it, so the two never stack
let MOON_CARD_EL=null;
function moonCardOn(){ if(!MOON_CARD_EL) MOON_CARD_EL=document.getElementById('card'); return !!(MOON_CARD_EL&&MOON_CARD_EL.classList.contains('on')); }
// what a tap on the HUD moon (and the journal) says
function moonText(b){
  b=b==null?bitesOf():b; const L=moonLook();
  if(L==='dawn') return S('The moon is back, with silver seams, like a mended cup.','The moon is back! It has shiny lines.');
  if(L==='moth') return S('The moon is back. A tiny grey moth visits it.','The moon is back. A tiny moth visits it.');
  if(L==='ember') return S('The moon is back, glowing gold, like a window when somebody is waiting up.','The moon is back. It is gold!');
  if(b<=0) return S('The moon is whole. No bites gone.','The moon is whole.');
  if(b===1) return S('The moon: 1 bite gone.','1 bite gone.');
  if(b>=6) return S('The moon: 6 bites gone. There is no moon left at all.','No moon left at all!');
  return S(`The moon: ${b} bites gone.`,`${b} bites gone.`);
}
function moonSub(b){
  b=b==null?bitesOf():b; if(moonLook()!=='bitten') return '';
  return [S('Round and bright. A good moon.','A good, round moon.'),S('Something has taken a bite out of the moon.','Something bit the moon!'),S('The nights are a little darker now.','The nights are darker now.'),
    S('Half of it is gone, and the tide has started to wander.','Half the moon is gone!'),S('People leave a lamp in the window now, all night.','People leave lamps in windows.'),S('Only a thin curl of moon is left.','Only a thin bit is left.'),
    S('Every window has a lantern in it. Keep your fire close.','Keep your fire close.')][clamp(b,0,6)];
}
function moonTap(){ try{ SFX.play('ui'); }catch(e){} MOON.pulse=1; const b=moonShown(); setBanner(moonText(b),moonSub(b),3); }

// ---------- the moon's picture: a pale disc with scalloped COOKIE bites at fixed spots (so kids can count them)
// unit coords (radius 1, y down): x, y, r of the bite, n teeth. 1 to 3 eat the right side (3 = the half-eaten cookie),
// 4 and 5 leave a thin curl on the left, 6 leaves only a cracked rim round a violet hole with a tiny moth in it
const MOON_BITES=[{x:0.7,y:-0.78,r:0.42,n:4},{x:1.04,y:0.16,r:0.44,n:4},{x:0.5,y:0.8,r:0.6,n:5},{x:0.46,y:-0.12,r:0.62,n:5},{x:0.27,y:0.06,r:0.95,n:7}];
const MOON_CRATERS=[[0.22,-0.18,0.17],[-0.34,0.34,0.13],[0.42,0.42,0.1],[-0.5,-0.12,0.09],[-0.12,0.6,0.07]];
const MOON_CRUNCH=0.78, MOON_ANIM_T=1.6;
function biteShape(q,B,R,grow){
  const k=grow||1, a0=Math.atan2(-B.y,-B.x), n=B.n, sp=1.95;
  q.moveTo(B.x*R+B.r*R*0.86*k,B.y*R); q.arc(B.x*R,B.y*R,B.r*R*0.86*k,0,TAU);
  for(let i=0;i<n;i++){ const a=a0+(i/(n-1)-0.5)*sp, tx=(B.x+Math.cos(a)*B.r*0.8)*R, ty=(B.y+Math.sin(a)*B.r*0.8)*R, tr=B.r*R*0.3*k; q.moveTo(tx+tr,ty); q.arc(tx,ty,tr,0,TAU); }
}
// a moth, from above: wings out, two painted eyes. col body colour, eye the painted eye colour (null: none)
function thrMoth(g,x,y,s,flap,col,eye){
  g.save(); g.translate(x,y); g.scale(s,s); const f=0.55+0.45*Math.abs(Math.cos(flap||0));
  g.fillStyle=col;
  for(const d of [-1,1]){
    g.beginPath(); g.moveTo(0,-2); g.bezierCurveTo(d*6,-14*f,d*20,-16*f,d*22,-6*f); g.bezierCurveTo(d*20,0,d*10,2,0,1); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0,1); g.bezierCurveTo(d*10,3,d*16,10*f,d*12,14*f); g.bezierCurveTo(d*7,15*f,d*3,8,0,4); g.closePath(); g.fill();
  }
  g.beginPath(); g.ellipse(0,1,2.6,7,0,0,TAU); g.fill();
  g.strokeStyle=col; g.lineWidth=1.1; for(const d of [-1,1]){ g.beginPath(); g.moveTo(d*1,-5); g.quadraticCurveTo(d*3,-10,d*6,-11); g.stroke(); }
  if(eye){ g.fillStyle=eye; for(const d of [-1,1]){ g.beginPath(); g.arc(d*13,-7*f,2.6,0,TAU); g.fill(); } }
  g.restore();
}
// paint the moon centred on (0,0) of g with radius R (device px); b bites; look as moonLook()
function moonPaint(g,R,b,look,o){
  o=o||{}; b=clamp(b|0,0,6);
  const ember=look==='ember', S0=Math.ceil(R*2.7)+8;
  // a soft glow that follows what is left of the moon (so the eaten part stays dark, it never reads as a phase)
  const gc=b>=6?'160,120,240':ember?'255,190,100':'214,226,255';
  const cv=mkCanvas(S0,S0), q=cv.getContext('2d'); q.translate(S0/2,S0/2); q.lineJoin='round';
  const base=ember?'#ffbe5a':'#e8ecff', hi=ember?'#ffe6a8':'#ffffff', sh=ember?'#e08a3a':'#bcc3ea', cr=ember?'#eca04c':'#cdd3f2', edge=ember?'#c8742e':'#a9a6d8';
  if(b>=6){
    // the empty moon: a violet hole, a cracked rim, a tiny moth inside
    const hg=q.createRadialGradient(0,0,R*0.1,0,0,R*0.86); hg.addColorStop(0,'#8a5ad8'); hg.addColorStop(0.55,'#4a2a7a'); hg.addColorStop(1,'#24123c');
    q.fillStyle=hg; q.beginPath(); q.arc(0,0,R*0.86,0,TAU); q.fill();
    q.strokeStyle=base; q.lineWidth=R*0.17; q.lineCap='butt';
    const gaps=[0.35,1.6,2.55,3.9,5.2];
    for(let i=0;i<gaps.length;i++){ const a0=gaps[i]+0.12, a1=(i+1<gaps.length?gaps[i+1]:gaps[0]+TAU)-0.12; q.beginPath(); q.arc(0,0,R*0.92,a0,a1); q.stroke(); }
    q.strokeStyle=sh; q.lineWidth=Math.max(1,R*0.05); for(const a of [0.9,2.1,3.3,4.6,5.8]){ const x=Math.cos(a)*R*0.92, y=Math.sin(a)*R*0.92; q.beginPath(); q.moveTo(x-Math.sin(a)*R*0.05,y+Math.cos(a)*R*0.05); q.lineTo(x+Math.cos(a)*R*0.06,y+Math.sin(a)*R*0.06); q.lineTo(x+Math.sin(a)*R*0.04,y-Math.cos(a)*R*0.04); q.stroke(); }
    thrMoth(q,0,R*0.05,R/34,0.6,'#140a24','rgba(220,200,255,.9)');
  }else{
    // the body: cel shaded, light from the top left, a few soft craters
    q.fillStyle=sh; q.beginPath(); q.arc(0,0,R,0,TAU); q.fill();
    q.fillStyle=base; q.beginPath(); q.arc(-R*0.1,-R*0.1,R*0.9,0,TAU); q.fill();
    q.fillStyle=hi; q.globalAlpha=0.85; q.beginPath(); q.arc(-R*0.36,-R*0.4,R*0.3,0,TAU); q.fill(); q.globalAlpha=1;
    for(const [cx,cy,cr0] of MOON_CRATERS){ q.fillStyle=cr; q.beginPath(); q.arc(cx*R,cy*R,cr0*R,0,TAU); q.fill(); q.strokeStyle=hi; q.globalAlpha=0.7; q.lineWidth=Math.max(0.8,R*0.03); q.beginPath(); q.arc(cx*R,cy*R,cr0*R,0.2,1.8); q.stroke(); q.globalAlpha=1; }
    if(look==='dawn'){ // three thin shining seams, like a mended cup
      q.strokeStyle='#ffe98a'; q.lineWidth=Math.max(1.2,R*0.075); q.shadowColor='rgba(255,220,120,1)'; q.shadowBlur=R*0.3;
      const seams=[[[-0.2,-0.98],[-0.05,-0.6],[-0.22,-0.3],[0.02,0.05]],[[0.95,0.3],[0.6,0.18],[0.42,0.32],[0.02,0.05]],[[-0.7,0.7],[-0.42,0.42],[-0.3,0.2],[0.02,0.05]]];
      for(const sm of seams){ q.beginPath(); sm.forEach(([x,y],i)=>i?q.lineTo(x*R,y*R):q.moveTo(x*R,y*R)); q.stroke(); } q.shadowBlur=0; }
    // the bites: cut out, then a darker band along each bitten edge (the cookie inside)
    if(b>0){
      q.globalCompositeOperation='destination-out'; q.fillStyle='#000';
      for(let i=0;i<b;i++){ q.beginPath(); biteShape(q,MOON_BITES[i],R); q.fill(); }
      q.globalCompositeOperation='source-atop'; q.strokeStyle=edge; q.lineWidth=Math.max(1.2,R*0.14);
      for(let i=0;i<b;i++){ q.beginPath(); biteShape(q,MOON_BITES[i],R); q.stroke(); }
      q.globalCompositeOperation='source-over';
    }
  }
  // the plum outline: the silhouette, tinted, stamped round it
  const ow=Math.max(1.1,R*0.085), tint=mkCanvas(S0,S0), tq=tint.getContext('2d');
  tq.drawImage(cv,0,0); tq.globalCompositeOperation='source-in'; tq.fillStyle=SBC.outline; tq.fillRect(0,0,S0,S0);
  if(o.glow!==false){ g.save(); g.shadowColor=`rgba(${gc},${b>=6?0.8:0.75})`; g.shadowBlur=Math.max(3,R*0.55); g.drawImage(tint,-S0/2,-S0/2); g.restore(); }
  for(let i=0;i<12;i++){ const a=i/12*TAU; g.drawImage(tint,-S0/2+Math.cos(a)*ow,-S0/2+Math.sin(a)*ow); }
  g.drawImage(cv,-S0/2,-S0/2);
  // crumbs by the bites (cute, and it reads as EATEN)
  if(b>0&&b<6){ const rng=mulberry32(77+b);
    for(let i=0;i<b;i++){ const B=MOON_BITES[i], a=Math.atan2(B.y,B.x)+(rng()-0.5)*0.9, d=i<3?1.18+rng()*0.16:1.05+rng()*0.25;
      for(let j=0;j<(i<3?2:1);j++){ const x=Math.cos(a+j*0.5)*R*(d+j*0.12), y=Math.sin(a+j*0.5)*R*(d+j*0.12), cr1=Math.max(0.9,R*(0.07-j*0.02));
        g.fillStyle=SBC.outline; g.beginPath(); g.arc(x,y,cr1+ow*0.6,0,TAU); g.fill(); g.fillStyle=base; g.beginPath(); g.arc(x,y,cr1,0,TAU); g.fill(); } } }
  // the moth ending: at full moon a tiny moth sits on top
  if(look==='moth'&&(o.moth||moonFullNight())) thrMoth(g,R*0.2,-R*0.9,R/52,0.5,'#4a3a6a','#e8dcff');
}
// cached sprites: radius in CSS px; drawn at the device pixel ratio
function moonSprite(b,look,R){
  const dpr=Math.min(2,DPR||1), Rd=Math.max(4,Math.round(R*dpr)), key=`${b}|${look}|${Rd}|${look==='moth'&&moonFullNight()?1:0}`;
  let s=MOON.spr.get(key); if(s) return s;
  const S0=Math.ceil(Rd*3.6)+8; s=mkCanvas(S0,S0); const g=s.getContext('2d'); g.translate(S0/2,S0/2); moonPaint(g,Rd,b,look); s.dpr=dpr;
  if(MOON.spr.size>40) MOON.spr.clear(); MOON.spr.set(key,s); return s;
}
// draw the moon anywhere (screen or world): drawMoon(ctx,x,y,r,{bites,look,alpha})
function drawMoon(g,x,y,r,o){
  o=o||{}; const s=moonSprite(o.bites!=null?o.bites:bitesOf(),o.look||moonLook(),r), w=s.width/s.dpr;
  const a0=g.globalAlpha; if(o.alpha!=null) g.globalAlpha=a0*o.alpha; g.drawImage(s,x-w/2,y-w/2,w,w); g.globalAlpha=a0;
}
// a PNG of the moon for the DOM (the journal)
function moonImgURL(b,look){
  const key=`${b}|${look}|${look==='moth'&&moonFullNight()?1:0}`; let u=MOON.img.get(key); if(u) return u;
  const c=mkCanvas(112,112), g=c.getContext('2d'); g.translate(56,56); moonPaint(g,32,b,look); u=c.toDataURL(); MOON.img.set(key,u); return u;
}

// ---------- the HUD moon: beside the clock under the minimap (22 px, 28 on touch), on every map, every act
function moonHudSpot(){
  const M=MINI_R(), r=M.r, cx=M.x+r, R=usingTouch?14:11;
  ctx.save(); ctx.font=`600 10px ${UIF}`; const tw=ctx.measureText('☾ 00:00').width; ctx.restore();
  return {x:cx+tw/2+7+R,y:M.y+r*2+6,R};   // right of the clock: clear of the quest list and the tips on a phone
}
{ const base=drawMinimap; drawMinimap=function(obj){ base(obj); try{ if(G&&G.mode==='story') moonHud(); }catch(e){ console.error(e); } }; }
function moonHud(){
  const h=moonHudSpot(); MOON.hud=h;
  if(MOON.anim&&MOON.anim.t<MOON_ANIM_T) return;      // the moon is away at the centre of the screen
  MOON.pulse=Math.max(0,MOON.pulse-0.06);
  const k=1+0.25*Math.sin(MOON.pulse*Math.PI);
  drawMoon(ctx,h.x,h.y,h.R*k,{bites:moonShown()});
  const hb=Math.max(usingTouch?40:26,h.R*2+8);
  HUD_HITS.push({x:h.x-hb/2,y:h.y-h.R-4,w:hb,h:h.R*2+12,fn:moonTap});
}
// the bite animation (screen space, over everything): fly to the centre at 3x, a moth shadow crosses, CRUNCH, back
{ const base=drawHUD; drawHUD=function(){ base(); try{ moonAnimStep(); }catch(e){ console.error(e); } }; }
function moonAnimStep(){
  const now=performance.now(), dt=Math.min(0.05,Math.max(0,(now-(MOON.last||now))/1000)); MOON.last=now;
  if(!G||G.mode!=='story') return;
  if(!MOON.anim&&moonPending()&&moonCalm()&&MOON.hud) MOON.anim={t:0,from:clamp(G.flags.moon_hud|0,0,6),to:bitesOf(),crunched:false};
  const A=MOON.anim; if(!A) return;
  if(MOON.freeze!=null) A.t=MOON.freeze; else if(scene==='play'||scene==='dialogue') A.t+=dt;
  if(A.t>=MOON_CRUNCH&&!A.crunched) moonCrunch(A);
  if(A.t>=MOON_ANIM_T){ G.flags.moon_hud=A.to; MOON.anim=null; MOON.crumbs.length=0; setBanner(moonText(A.to),moonSub(A.to),3.2); return; }
  drawMoonAnim(A,dt);
}
function moonCrunch(A){
  A.crunched=true; try{ SFX.play('hit',1.3); SFX.play('pop',1); }catch(e){}
  shakeMag=Math.max(shakeMag,2.5);
  const B=MOON_BITES[clamp(A.to-1,0,4)], R1=moonAnimR();
  for(let i=0;i<14;i++){ const a=Math.atan2(B.y,B.x)+rand(-1.1,1.1), v=rand(60,190); MOON.crumbs.push({x:B.x*R1*0.9,y:B.y*R1*0.9,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,r:rand(1.4,3.4),t:0,life:rand(0.5,0.9)}); }
}
const moonAnimR=()=>{ const h=MOON.hud||{R:11}; return Math.max(h.R*3.2,Math.min(W,H)*0.065); };
function drawMoonAnim(A,dt){
  const h=MOON.hud, t=A.t, R1=moonAnimR(), cx=W/2, cy=H*0.38;
  let u; if(t<0.3) u=smooth(t/0.3); else if(t>1.3) u=1-smooth((t-1.3)/0.3); else u=1;
  const x=lerp(h.x,cx,u), y=lerp(h.y,cy,u); let R=lerp(h.R,R1,u);
  if(A.crunched&&t<1.05) R*=1+0.08*Math.sin((t-MOON_CRUNCH)*40)*Math.max(0,1-(t-MOON_CRUNCH)*4);
  const g=ctx; g.save();
  // a soft dark halo so the moon stands out
  if(u>0.05){ const k=g.createRadialGradient(x,y,R*0.8,x,y,R*2.6); k.addColorStop(0,`rgba(20,12,40,${0.38*u})`); k.addColorStop(1,'rgba(20,12,40,0)'); g.fillStyle=k; g.beginPath(); g.arc(x,y,R*2.6,0,TAU); g.fill(); }
  drawMoon(g,x,y,R,{bites:t<MOON_CRUNCH?A.from:A.to});
  // the moth's shadow crosses the moon
  if(t>0.28&&t<0.92){ const v=(t-0.28)/0.64, mx=cx+lerp(-R1*2.4,R1*2.4,v), my=cy-R1*0.15-Math.sin(v*Math.PI)*R1*0.35;
    g.globalAlpha=0.82*Math.sin(v*Math.PI); thrMoth(g,mx,my,R1/16,t*30,'#1a1030','rgba(200,170,255,.85)'); g.globalAlpha=1; }
  // crumbs fly off the new bite
  for(const c of MOON.crumbs){ c.t+=dt; c.x+=c.vx*dt; c.y+=c.vy*dt; c.vy+=260*dt; const a=clamp(1-c.t/c.life,0,1); if(a<=0) continue;
    g.globalAlpha=a; g.fillStyle=SBC.outline; g.beginPath(); g.arc(cx+c.x,cy+c.y,c.r+1.2,0,TAU); g.fill(); g.fillStyle='#e8ecff'; g.beginPath(); g.arc(cx+c.x,cy+c.y,c.r,0,TAU); g.fill(); }
  g.globalAlpha=1;
  // CRUNCH! and the count
  g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round';
  if(A.crunched&&t<1.3){ const v=(t-MOON_CRUNCH)/0.5, s=1+0.35*Math.max(0,1-v*3); g.save(); g.translate(cx,cy-R1-24); g.rotate(-0.08); g.scale(s,s);
    g.globalAlpha=clamp((1.3-t)/0.15,0,1); g.font=`900 ${Math.round(R1*0.62)}px ${TF}`; g.lineWidth=7; g.strokeStyle=SBC.outline; g.strokeText(simplify(S('CRUNCH!','CRUNCH!')),0,0); g.fillStyle='#ffe6a0'; g.fillText(simplify(S('CRUNCH!','CRUNCH!')),0,0); g.restore(); }
  if(t>0.85&&t<1.35){ g.globalAlpha=clamp(Math.min((t-0.85)/0.1,(1.35-t)/0.1),0,1); g.font=`700 15px ${UIF}`; const txt=simplify(moonText(A.to)); g.lineWidth=5; g.strokeStyle=SBC.outline; g.strokeText(txt,cx,cy+R1+24); g.fillStyle='#fff4dc'; g.fillText(txt,cx,cy+R1+24); }
  g.restore();
}
// night darkness: drawLights adds mapNight() to its dark, so the moon's dark rides on it (outdoors, every map)
{ const base=mapNight; mapNight=function(){ let v=base(); try{ v+=moonDark(); }catch(e){} return v; }; }
// moonlight colour: as the moon is eaten the night tint slides from silver toward grey; the Ember Moon warms every night
{ const base=ambientTint; ambientTint=function(){
  const c=base(); try{
    if(!G||AREA||G.mode!=='story') return c; const n=1-daylight(); if(n<=0.01) return c;
    if(moonLook()==='ember') return mixRGB(c,[255,192,112],n*0.08);
    const m=moonLeft()/100; if(m>=1) return c;
    return mixRGB(c,mixRGB(MOON_COL.full,MOON_COL.none,1-m),n*0.34*(1-m));
  }catch(e){ return c; } }; }

// ================= 2. the Ember Heart and the three Shards (THREADS 5)
const HEART_SHARDS=[{id:'c_shard1',name:S('the Dusk Shard','the Dusk Shard'),col:'#9a6ad8',hi:'#cdb0f6',sh:'#5a3a8a'},
  {id:'f_shard2',name:S('the Frost Shard','the Frost Shard'),col:'#7ad0f0',hi:'#d8f6ff',sh:'#3a86b8'},
  {id:'m_shard3',name:S('the Moon Shard','the Moon Shard'),col:'#d8dcec',hi:'#ffffff',sh:'#8a90aa'}];
for(const [k,v] of [['a1_heart',S('The Ember Heart (a warm red stone, beating softly)','The Ember Heart')],['c_shard1',S('The Dusk Shard (violet, warm in your claws)','The Dusk Shard')],
  ['f_shard2',S('The Frost Shard (ice-blue, its frost never melts)','The Frost Shard')],['m_shard3',S('The Moon Shard (silver, cold until you hold it)','The Moon Shard')],
  ['m_heart',S('The Ember Heart, mended (three shining seams)','The mended Ember Heart')]]) if(!ITEM_NAMES[k]) ITEM_NAMES[k]=v;
function shardsHeld(){ const I=(G&&G.items)||{}; return HEART_SHARDS.map(s=>(I[s.id]|0)>0); }
function shardCount(){ return shardsHeld().filter(Boolean).length; }
// 'none' (Act I), 'home' (in the forge or the sixth Ward-fire), 'stolen', 'shards' (Ash holds 1 to 3), 'whole' (reforged)
function heartState(){
  if(!G) return 'none'; const I=G.items||{}, F=G.flags||{};
  if((I.m_heart|0)>0||F.m_heart) return 'whole';
  if(shardCount()>0) return 'shards';
  if(F.c_stolen||F.c_heart_stolen) return 'stolen';
  if(F.act1_done||(I.a1_heart|0)>0||F.a1_heart) return 'home';
  return 'none';
}
function heartText(){
  const st=heartState(), F=G.flags, n=shardCount();
  if(st==='whole') return G.choices.n_end==='embermoon'?S('The Ember Heart burns in the moon now, gold and warm.','The Ember Heart is in the moon now.')
    :S('The Ember Heart is whole again: an orange core with three shining seams, violet, ice-blue and silver.','The Ember Heart is fixed! It has three shiny lines.');
  if(st==='shards') return n>=3?S('You have all 3 Shards. Apart, they keep getting colder. They need a smith.','You have all 3 Shards! They need fixing.')
    :(n===1?S('The Heart was cracked into three Shards. You have 1 of the 3. It tugs gently toward the next one.','You have 1 of 3 Shards.')
    :S(`The Heart was cracked into three Shards. You have ${n} of the 3. Apart, they are going cold. They tug toward the last one.`,`You have ${n} of 3 Shards.`));
  if(st==='stolen') return S("A masked thief stole the Ember Heart from Mom's forge.",'A thief stole the Ember Heart!');
  if(st==='home') return (F.a1_heart==='ward'||(!F.a1_heart&&G.choices.ending==='warden'))?S('The Ember Heart glows in the sixth Ward-fire on top of Cinder Mountain.','The Ember Heart glows on the mountain.')
    :S("The Ember Heart is safe in Mom's forge, humming softly.",'The Ember Heart is safe in the forge.');
  return '';
}
// the Heart's picture for the journal: the warm stone, the empty space, the three Shards (held ones bright), or mended
const HEART_IMG=new Map();
function heartImgURL(st,held){
  const key=st+'|'+(held||[]).map(v=>v?1:0).join('');
  let u=HEART_IMG.get(key); if(u) return u;
  const c=mkCanvas(112,112), g=c.getContext('2d'); g.translate(56,58); heartPaint(g,st,held||[]); u=c.toDataURL(); HEART_IMG.set(key,u); return u;
}
function heartPaint(g,st,held){
  const R=30, O=SBC.outline; g.lineJoin='round';
  const stone=(q)=>{ q.beginPath(); q.ellipse(0,0,R*0.86,R,0,0,TAU); };
  const glow=(col,a,r)=>{ const k=g.createRadialGradient(0,0,R*0.4,0,0,r||R*1.7); k.addColorStop(0,`rgba(${col},${a})`); k.addColorStop(1,`rgba(${col},0)`); g.fillStyle=k; g.beginPath(); g.arc(0,0,r||R*1.7,0,TAU); g.fill(); };
  // the crack lines: zigzags from the centre to the rim at -90, 30 and 150 degrees (shared, so the shards fit together)
  const rim=a=>[Math.cos(a)*R*0.86,Math.sin(a)*R];
  const ray=a=>{ const [ex,ey]=rim(a), pts=[[0,0]]; for(let i=1;i<=4;i++){ const f=i/4, d=(i%2?1:-1)*R*0.09*(i<4?1:0); pts.push([ex*f-Math.sin(a)*d,ey*f+Math.cos(a)*d]); } return pts; };
  const A=[-Math.PI/2,Math.PI/6,Math.PI*5/6];
  // one Shard's outline (moved off the centre by off along its middle); returns that offset
  const wedge=(q,k,off)=>{ const a0=A[k], a1=A[(k+1)%3]+(k===2?TAU:0), am=(a0+a1)/2, ox=Math.cos(am)*off, oy=Math.sin(am)*off, r0=ray(a0), r1=ray(a1);
    q.beginPath(); q.moveTo(ox,oy); for(const p of r0) q.lineTo(p[0]+ox,p[1]+oy);
    for(let i=1;i<=12;i++){ const p=rim(a0+(a1-a0)*i/12); q.lineTo(p[0]+ox,p[1]+oy); }
    for(let i=r1.length-1;i>=0;i--) q.lineTo(r1[i][0]+ox,r1[i][1]+oy); q.closePath(); return [ox,oy]; };
  if(st==='home'||st==='none'){
    glow('255,120,60',0.5); g.fillStyle=O; stone(g); g.lineWidth=5; g.strokeStyle=O; g.stroke();
    g.fillStyle='#8a1e1a'; stone(g); g.fill(); g.fillStyle='#cc3a2a'; g.beginPath(); g.ellipse(-R*0.08,-R*0.08,R*0.74,R*0.88,0,0,TAU); g.fill();
    g.fillStyle='#ff8a5a'; g.beginPath(); g.ellipse(-R*0.3,-R*0.42,R*0.2,R*0.28,-0.5,0,TAU); g.fill();
    g.fillStyle='rgba(255,220,150,.9)'; g.beginPath(); g.arc(-R*0.36,-R*0.5,R*0.07,0,TAU); g.fill(); return;
  }
  if(st==='stolen'){
    g.setLineDash([5,5]); g.lineWidth=3; g.strokeStyle='rgba(90,64,110,.75)'; stone(g); g.stroke(); g.setLineDash([]);
    thrMoth(g,0,R*0.15,0.9,0.5,'#6a5a82','#e8e2ff');
    g.font=`900 26px ${TF}`; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=5; g.strokeStyle=O; g.strokeText('?',R*0.62,-R*0.62); g.fillStyle='#ffcf5a'; g.fillText('?',R*0.62,-R*0.62); return;
  }
  if(st==='whole'){
    glow('255,140,60',0.55,R*1.8);
    g.lineWidth=5; g.strokeStyle=O; stone(g); g.stroke();
    g.fillStyle='#c8501a'; stone(g); g.fill(); g.fillStyle='#ff8a3a'; g.beginPath(); g.ellipse(-R*0.08,-R*0.08,R*0.74,R*0.88,0,0,TAU); g.fill();
    g.fillStyle='#ffd27a'; g.beginPath(); g.ellipse(-R*0.28,-R*0.4,R*0.2,R*0.27,-0.5,0,TAU); g.fill();
    g.save(); stone(g); g.clip(); g.lineCap='round';
    A.forEach((a,k)=>{ const S1=HEART_SHARDS[k]; g.shadowColor=S1.col; g.shadowBlur=8; g.strokeStyle=S1.hi; g.lineWidth=3.2; g.beginPath(); ray(a).forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.stroke(); g.shadowBlur=0; g.strokeStyle=S1.col; g.lineWidth=1.6; g.stroke(); });
    g.restore(); return;
  }
  // the shards, a little apart: held ones bright and outlined, missing ones a dashed ghost
  const off=R*0.16;
  for(let k=0;k<3;k++){ const S1=HEART_SHARDS[k], am=(A[k]+A[(k+1)%3]+(k===2?TAU:0))/2;
    if(held[k]){ g.save(); g.translate(Math.cos(am)*off,Math.sin(am)*off); const k2=g.createRadialGradient(0,0,2,0,0,R*0.85); k2.addColorStop(0,S1.col+'77'); k2.addColorStop(1,S1.col+'00'); g.fillStyle=k2; g.beginPath(); g.arc(0,0,R*0.85,0,TAU); g.fill(); g.restore(); } }
  for(let k=0;k<3;k++){ const S1=HEART_SHARDS[k];
    if(held[k]){
      g.save(); const [ox,oy]=wedge(g,k,off); g.lineWidth=5; g.strokeStyle=O; g.stroke(); g.fillStyle=S1.sh; g.fill(); g.clip();
      g.fillStyle=S1.col; g.beginPath(); g.ellipse(ox-R*0.1,oy-R*0.1,R*0.76,R*0.9,0,0,TAU); g.fill();
      g.fillStyle=S1.hi; g.globalAlpha=0.85; g.beginPath(); g.ellipse(ox-R*0.3,oy-R*0.4,R*0.17,R*0.24,-0.5,0,TAU); g.fill(); g.restore(); }
    else{ g.save(); wedge(g,k,off); g.setLineDash([4,4]); g.lineWidth=2; g.strokeStyle='rgba(90,64,110,.55)'; g.stroke(); g.restore(); } }
}

// ================= 3. Pebble's letters (THREADS 9.3): Yara's crow lands, says "Caw.", and delivers a letter
// PEBBLE_MAIL.push({id:'c_pb_1', from:'maren', when:()=>reached('c_coast'), lines:[...]}) or pebbleLetter(id,{...}).
// Fields: id (act prefix: c_pb_1, f_pb_2, m_pb_3), from (the writer's speaker id), when() (due test), lines (array or
// fn returning one; ['who',`full`,`simple`] lines are fine), coin (what Pebble takes, default 1, 0 for none),
// gift:{coins,items:{k:n}} (given to Ash after reading), then() (runs after), quiet (no arrival line, the letter's own
// lines say it). One letter per rest (shrine, inn or bed) or fast-travel arrival; due letters wait their turn in id order.
// G.flags[id]=1 once read. Keyed entries (PEBBLE_MAIL.m_pb_3={...}) work too.
const PEBBLE_MAIL=[];
const PEBRT={crow:null,want:0,force:null,wait:0,giveUp:0,letter:null,seenPeak:false};
function pebbleLetter(id,def){ const d=Object.assign({id},def||{}); const i=PEBBLE_MAIL.findIndex(q=>q&&q.id===id); if(i>=0) PEBBLE_MAIL[i]=d; else PEBBLE_MAIL.push(d); return d; }
const PB_ACT={a1_:1,c_:2,f_:3,m_:4,n_:5};
function pbAct(id){ for(const p in PB_ACT) if(String(id).startsWith(p)) return PB_ACT[p]; return 9; }
function pebbleAll(){
  const out=[], seen=new Set();
  for(const d of PEBBLE_MAIL) if(d&&d.id&&!seen.has(d.id)){ seen.add(d.id); out.push(d); }
  for(const k of Object.keys(PEBBLE_MAIL)) if(!/^\d+$/.test(k)&&!seen.has(k)){ const v=PEBBLE_MAIL[k]; if(v&&typeof v==='object'){ seen.add(k); out.push(Object.assign({id:k},v)); } }
  return out.sort((a,b)=>pbAct(a.id)-pbAct(b.id)||String(a.id).localeCompare(String(b.id),'en',{numeric:true}));
}
const pebbleRead=id=>!!(G&&G.flags&&G.flags[id]);
// a letter from an act (its id prefix a1_, c_, f_, m_, n_) arrives in that act or the one right after it, never later,
// and on Nightfall Peak only the peak's own: Mom's "catch that thief" must not land in Moonfall, and a test save made
// by __eb.actStart(5) (every earlier letter's `when` is true) gets no Gearhaven news on the black glass. Data letters
// (other ids) and a letter asked for by pebbleNow(id) are never held back.
function pbStale(id){ const a=pbAct(id); if(a>=9) return false; let cur=0; try{ cur=actOf(G.stage)|0; }catch(e){} if(!cur) return false; return cur>=5?a<5:cur-a>1; }
function pebbleDue(){
  if(!G||G.mode!=='story') return [];
  return pebbleAll().filter(d=>{ if(pebbleRead(d.id)||pbStale(d.id)) return false; try{ return typeof d.when==='function'?!!d.when():!!d.when; }catch(e){ console.error(e); return false; } }).map(d=>d.id);
}
// pebbleNow(id?): Pebble comes as soon as it is calm, with that letter (even if its `when` is not true yet), or the next due one
function pebbleNow(id){ if(id&&pebbleRead(id)) return false; if(id&&!pebbleAll().some(d=>d.id===id)) return false; PEBRT.force=id||null; PEBRT.want=1; PEBRT.wait=0.6; PEBRT.giveUp=0; return true; }
function pebbleRested(wait){ if(!G||G.mode!=='story') return; if(!pebbleDue().length&&!PEBRT.force) return; PEBRT.want=1; PEBRT.wait=wait; PEBRT.giveUp=0; }
{ const base=restAtShrine; restAtShrine=function(s){ base(s); try{ pebbleRested(2.6); }catch(e){} }; }
{ const base=innRest; innRest=function(){ base(); try{ pebbleRested(2.6); }catch(e){} }; }
{ const base=travelTo; travelTo=function(s){ base(s); try{ pebbleRested(1.6); }catch(e){} }; }
function pbCalm(){
  if(!moonCalm()) return false;
  if(MOON.anim||moonPending()) return false;
  if(typeof HS!=='undefined'&&(HS.crow||HS.on)) return false;
  if(G.pendingBless>0) return false;
  return true;
}
function pebbleTick(dt){
  const C=PEBRT.crow;
  if(C){ C.t+=dt; C.flap+=dt*(C.mode==='sit'?2:14);
    if(C.mode==='in'){ const u=Math.min(1,C.t/1.6), e=1-(1-u)*(1-u), T=pbPerch(); C.x=lerp(C.x0,T.x,e); C.y=lerp(C.y0,T.y,e)-Math.sin(u*Math.PI)*40; if(u>=1&&scene==='play'&&!DLG) pebbleLand(); }
    else if(C.mode==='sit'){ const T=pbPerch(); C.x=T.x; C.y=T.y; }
    else { C.x+=260*dt; C.y-=170*dt; if(C.t>2.2) PEBRT.crow=null; }
    return;
  }
  if(!PEBRT.want||scene!=='play') return;
  PEBRT.wait-=dt; if(PEBRT.wait>0) return;
  if(!pbCalm()){ PEBRT.giveUp+=dt; if(PEBRT.giveUp>45){ PEBRT.want=0; PEBRT.force=null; } return; }
  const id=PEBRT.force&&!pebbleRead(PEBRT.force)?PEBRT.force:pebbleDue()[0];
  PEBRT.want=0; PEBRT.force=null; if(!id) return;
  const d=pebbleAll().find(q=>q.id===id); if(!d) return;
  PEBRT.letter=d;
  const p=player; PEBRT.crow={mode:'in',t:0,x0:p.x-520,y0:p.y-400,x:p.x-520,y:p.y-400,flap:0};
  try{ SFX.play('bird',0.9); }catch(e){}
}
// where she sits: on the ground beside Ash, or on his horn on Nightfall Peak (she will not land on the black glass)
function pbPerch(){ const p=player; return curMap()===4?{x:p.x+7,y:p.y-40-(p.z||0),horn:true}:{x:p.x+36,y:p.y+6,horn:false}; }
const PB_ARRIVE=[
  [`Wings, then a thump. Pebble lands beside you with a letter in her beak.`,`Pebble the crow lands. She has a letter.`],
  [`A crow drops out of the sky onto your foot. It's Pebble, with another letter.`,`Pebble lands on your foot. A letter!`],
  [`Pebble lands, looks at you sideways, and drops a letter on your toes.`,`Pebble drops a letter on your toes.`]];
function pbNorm(L){
  const out=[];
  for(const l of (L||[])){ if(Array.isArray(l)&&l.length>=3&&typeof l[1]==='string'&&typeof l[2]==='string') out.push([l[0],S(l[1],l[2])]); else if(l) out.push(l); }
  return out;
}
function pebbleLand(){
  const C=PEBRT.crow, d=PEBRT.letter; if(!C||!d){ PEBRT.crow=null; return; }
  C.mode='sit'; C.t=0; G.flags[d.id]=1;   // read: marked as she lands, so it never comes twice
  const L=[], peak=curMap()===4;
  if(!d.quiet){
    if(peak&&!PEBRT.seenPeak){ PEBRT.seenPeak=true; L.push(xl('narr',`Pebble will not land on the black glass. She perches on your horn instead and holds out a letter.`,`Pebble sits on your horn. She has a letter.`)); }
    else { const v=PB_ARRIVE[(G.flags.pb_n|0)%PB_ARRIVE.length]; L.push(xl('narr',v[0],v[1])); }
    L.push(['pebble',S('Caw.','Caw.')]);
  }
  let body=[]; try{ body=pbNorm(typeof d.lines==='function'?d.lines():d.lines); }catch(e){ console.error(e); }
  L.push(...body);
  G.flags.pb_n=(G.flags.pb_n|0)+1;
  runDialogue(L,()=>{ scene='play'; pebbleAfter(d); if(PEBRT.crow){ PEBRT.crow.mode='out'; PEBRT.crow.t=0; } PEBRT.letter=null; saveGame(); });
}
function pebbleAfter(d){
  const fee=d.coin==null?1:Math.max(0,d.coin|0);
  if(fee>0){ const had=G.coins|0; G.coins=Math.max(0,had-fee);
    if(had<=0) setBanner(S('Pebble checks your pouch. Empty! She takes a button instead.','Pebble takes a button.'),'',2.6);
    else if(fee===1) setBanner(S('Pebble took a shiny coin.','Pebble took a coin.'),'',2.4);
    else setBanner(S(`Pebble took ${fee} shiny coins.`,`Pebble took ${fee} coins.`),'',2.6); }
  const gf=d.gift; if(gf){ if(gf.coins) addCoins(gf.coins|0); if(gf.items) giveItems(gf.items); }
  if(d.then) try{ d.then(); }catch(e){ console.error(e); }
}
{ const base=drawMarkers; drawMarkers=function(t){ base(t); try{ const C=PEBRT.crow; if(C){ ctx.save(); ctx.translate(C.x,C.y); ctx.scale(1.3,1.3); drawCrowAt(ctx,0,0,C.flap/TAU,C.mode==='sit'); ctx.restore(); } }catch(e){ console.error(e); } }; }

// ================= 4. allies and the finale's counts (THREADS 10, FINALE 7 and 9)
// vesperFriend: Act II may define its own `function vesperFriend()` (a later function declaration wins); never as a const
function vesperFriend(){ return !!(G&&G.choices&&G.choices.c_vesper==='friend'); }
// knows Nyx's old name: the Act IV moth dream, the Wardens' eleventh page (Act III or IV), or Moth Memory pane 3
function nKnowsNyx(){ if(!G) return false; const F=G.flags||{}, f=G.found||{}; return !!(F.dr_seen_m_moth||F.f_page11||F.m_page11||f.n_pane_3||F.n_pane_3||F.n_knows); }
// how many of the three Shard-keepers Ash freed: Vesper (friend), Glaciar (free), Hush (free)
function nFreed(){ if(!G) return 0; const C=G.choices||{}; return (vesperFriend()?1:0)+(C.f_glaciar==='free'?1:0)+(C.m_hush==='free'?1:0); }
// the kind ending (The Moth and the Moon) is open
function nCanMercy(){ return nKnowsNyx()&&nFreed()>=2; }
// the allies earned across the game (FINALE 7): id, name, the act, and the test
const THR_ALLIES=[
  {id:'greymane',act:1,name:S('Greymane','Greymane'),cond:()=>G.choices.greymane==='ally',line:S('Greymane and his pack will run with you.','Greymane will run with you.')},
  {id:'cinder',act:1,name:S('Sir Cindervane','Sir Cindervane'),cond:()=>G.choices.cinder==='ally',line:S('Sir Cindervane will hold the stairs for you.','Sir Cindervane will help you.')},
  {id:'tikka',act:1,name:S('Tikka','Tikka'),cond:()=>G.flags.tk_come==='yes',line:S('Tikka promised to stay close, with buns.','Tikka will come, with buns.')},
  {id:'vesper',act:2,name:S('Vesper','Vesper'),cond:()=>vesperFriend(),line:S('Vesper, your cousin the Moth Mask, is on your side.','Vesper is on your side.')},
  {id:'glaciar',act:3,name:S('Glaciar','Glaciar'),cond:()=>G.choices.f_glaciar==='free',line:S('Auntie Glee, the ice dragon, will fly to help.','Auntie Glee will fly to help.')},
  {id:'hush',act:4,name:S('Hush','Hush'),cond:()=>G.choices.m_hush==='free',line:S('Hush, free of her leash, glows for you in the dark.','Hush glows for you.')}];
const THR_ALLY_BY={}; for(const a of THR_ALLIES) THR_ALLY_BY[a.id]=a;
// nAllies(): ids of the earned allies, in the order they join on the peak; Pip is always there and is not listed
function nAllies(){ if(!G) return []; return THR_ALLIES.filter(a=>{ try{ return !!a.cond(); }catch(e){ return false; } }).map(a=>a.id); }
function allyEarned(id){ const a=THR_ALLY_BY[id]; try{ return !!(a&&a.cond()); }catch(e){ return false; } }

// ================= 5. the epilogue hook (THREADS 18.3)
// EPI.c.push({pri:5, cond:()=>bool, line:['narr',S(full,simple)]}); the finale shows at most 2 per act, highest pri first
const EPI={c:[],f:[],m:[]};
const EPI_KEY={2:'c',3:'f',4:'m',c:'c',f:'f',m:'m'};
function epiPick(k,max){
  const key=EPI_KEY[k]||k, L=EPI[key]||[], n=max==null?2:max;
  const ok=L.map((e,i)=>({e,i})).filter(({e})=>{ try{ return e&&(!e.cond||e.cond()); }catch(err){ console.error(err); return false; } });
  ok.sort((a,b)=>((b.e.pri||0)-(a.e.pri||0))||(a.i-b.i));
  return pbNorm(ok.slice(0,n).map(({e})=>e.line));
}
function epiAdd(k,pri,cond,full,simple){ const key=EPI_KEY[k]||k; (EPI[key]=EPI[key]||[]).push({pri,cond,line:['narr',S(full,simple)]}); }

// ================= 6. dreams (THREADS 12): a small helper, and no dreams on Nightfall Peak until the end
function defineDream(id,def){ DREAMS[id]=Object.assign({stages:[]},def); if(!DREAM_ORDER.includes(id)) DREAM_ORDER.push(id); return DREAMS[id]; }
const dreamSeen=id=>!!(G&&G.flags&&G.flags['dr_seen_'+id]);
{ const base=dreamFor; dreamFor=function(st){ try{ if(G&&curMap()===4&&!(G.choices&&G.choices.n_end)) return null; }catch(e){} return base(st); }; }

// ================= 7. Tamsin's song (THREADS 14.1): EV_TAMSIN is the registry; tamsinVerse adds a verse once
function tamsinVerse(cond,text){ if(!EV_TAMSIN.some(v=>v&&v[1]===text)) EV_TAMSIN.push([cond,text]); }
tamsinVerse(()=>!!G.flags.f_done,S(`\u{1F3B5} The north wind was howling, the Hearth fire was low, so Ash found an auntie made out of snow...`,`\u{1F3B5} Ash found an ice dragon auntie...`));
tamsinVerse(()=>G.choices.n_end==='dawn',S(`\u{1F3B5} The night was so long, and it begged for his flame, but Ash would not give it, and morning still came...`,`\u{1F3B5} The night wanted his fire. Ash said no, and morning came...`));
tamsinVerse(()=>G.choices.n_end==='embermoon',S(`\u{1F3B5} The moon was all eaten, the sky had gone cold, so Ash gave his Heart, and the moon came back gold...`,`\u{1F3B5} Ash gave the Heart, and the moon came back gold...`));
tamsinVerse(()=>G.choices.n_end==='moth',S(`\u{1F3B5} The grey moth was scared to be left in the night, so Ash lit her a lantern, and she let go of the light...`,`\u{1F3B5} Ash lit the moth a lantern, and she let the moon go...`));
// if two modules add the same verse, Tamsin still sings it once
{ const base=tamsinSong; tamsinSong=function(){ const L=base(); try{ const seen=new Set(); return L.filter(l=>{ if(!Array.isArray(l)||typeof l[1]!=='string'||l[1].indexOf('\u{1F3B5}')<0) return true; if(seen.has(l[1])) return false; seen.add(l[1]); return true; }); }catch(e){ return L; } }; }

// ================= 8. the shared speakers (THREADS 15): nyxara, pebble, grandpa (and a fallback f_hush until Act III)
function thrNyxName(){ const F=G&&G.flags; return F&&(F.f_nyx_named||F.f_moon_bite3)?'Nyxara':'The Lady of the Moths'; }
SPK.nyxara={get name(){ return thrNyxName(); },col:'#b8a8e8'};
SPK.pebble={name:'Pebble',col:'#5a5a6a'};
SPK.grandpa={name:'Grandpa',col:'#ff9a5a'};
if(!SPK.f_hush) SPK.f_hush={name:'Hush',col:'#e4e0f4'};
// Hush wears the silver leash in Act IV until it is cut (THREADS 6)
const thrHushLeashed=()=>!!G&&(G.act===4||String(G.stage||'').startsWith('m_'))&&G.choices&&G.choices.m_hush!=='free';
function thrFaceMoth(g,o){
  const O='#1a1030', wing=o.wing, wing2=o.wing2, eye=o.eye, iris=o.iris, fur=o.fur, fur2=o.fur2;
  g.lineJoin='round'; g.lineWidth=3; g.strokeStyle=O;
  // wings behind the head, each with a painted eye
  for(const s of [-1,1]){
    g.fillStyle=wing2; g.beginPath(); g.moveTo(s*14,22); g.bezierCurveTo(s*50,44,s*82,40,s*86,10); g.bezierCurveTo(s*70,0,s*40,6,s*14,22); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=wing; g.beginPath(); g.moveTo(s*16,0); g.bezierCurveTo(s*40,-60,s*92,-74,s*96,-30); g.bezierCurveTo(s*98,-6,s*60,10,s*16,8); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle=wing2; g.lineWidth=2; for(const k of [0.35,0.6]){ g.beginPath(); g.moveTo(s*20,0); g.quadraticCurveTo(s*(30+60*k),-50*k,s*(50+44*k),-40-10*k); g.stroke(); } g.strokeStyle=O; g.lineWidth=3;
    g.fillStyle=eye; g.beginPath(); g.arc(s*62,-30,15,0,TAU); g.fill(); g.stroke();
    g.fillStyle=iris; g.beginPath(); g.arc(s*62,-30,8.5,0,TAU); g.fill();
    g.fillStyle=O; g.beginPath(); g.arc(s*62,-30,4,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.85)'; g.beginPath(); g.arc(s*59,-33,2.2,0,TAU); g.fill();
  }
  // feathery antennae
  for(const s of [-1,1]){ g.strokeStyle=o.ant; g.lineWidth=2.6; g.beginPath(); g.moveTo(s*10,-40); g.quadraticCurveTo(s*18,-78,s*40,-86); g.stroke(); g.lineWidth=1.8; for(let i=1;i<7;i++){ const t=i/7, x=s*(10+t*28), y=-40-t*44; g.beginPath(); g.moveTo(x,y); g.lineTo(x+s*8,y-4); g.moveTo(x,y); g.lineTo(x-s*3,y-8); g.stroke(); } }
  g.strokeStyle=O; g.lineWidth=3;
  // the fluffy head and collar
  g.fillStyle=fur2; for(let i=0;i<7;i++){ const a=Math.PI*(0.14+0.72*i/6), x=Math.cos(a)*40, y=Math.sin(a)*22+24, r=i%2?15:17; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); g.stroke(); }
  g.beginPath(); g.ellipse(0,28,34,16,0,0,TAU); g.fill();
  g.fillStyle=fur; g.beginPath(); for(let i=0;i<24;i++){ const a=i/24*TAU, r=i%2?40:36; const x=Math.cos(a)*r, y=Math.sin(a)*r*1.02-4; i?g.lineTo(x,y):g.moveTo(x,y); } g.closePath(); g.fill(); g.stroke();
  // big soft eyes with starry highlights
  for(const s of [-1,1]){ g.fillStyle=o.eyes; g.beginPath(); g.ellipse(s*15,-6,12,14,s*0.15,0,TAU); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,.95)'; g.beginPath(); g.arc(s*15-4,-11,3.6,0,TAU); g.fill(); g.beginPath(); g.arc(s*15+4,-1,1.6,0,TAU); g.fill(); }
  if(o.smile){ g.strokeStyle='rgba(40,20,60,.6)'; g.lineWidth=2.2; g.beginPath(); g.moveTo(-6,16); g.quadraticCurveTo(0,20,6,16); g.stroke(); }
  if(o.leash){ g.strokeStyle='#e8eef8'; g.lineWidth=2.4; g.shadowColor='#cfe0ff'; g.shadowBlur=8; g.beginPath(); g.moveTo(-26,34); g.quadraticCurveTo(-8,44,10,36); g.quadraticCurveTo(24,10,30,-100); g.stroke(); g.shadowBlur=0; }
}
Object.assign(EVPORT,{
  nyxara:{bg:'#140c26',f:g=>{ g.save(); g.fillStyle='rgba(220,210,255,.7)'; for(const [x,y,r] of [[-70,-70,1.6],[64,-82,1.2],[78,40,1.4],[-84,30,1],[30,-96,1.1]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); } g.restore();
    thrFaceMoth(g,{wing:'#8a7aaa',wing2:'#5c4c7c',eye:'#ece6ff',iris:'#8a62d8',fur:'#b8aad8',fur2:'#e2daf4',eyes:'#241640',ant:'#d8ccf0',smile:true}); }},
  pebble:{bg:'#24283a',f:g=>{ g.save(); g.translate(0,-10); g.scale(3.6,3.6); drawCrowAt(g,0,2,0.5,true); g.restore(); }},
  grandpa:{bg:'#3a1810',f:g=>{ const P=EVPORT.c_grandpa; if(P&&P.f) P.f(g); else faceDragon(g,{skin:'#c8482a',dark:'#7a2412',snout:'#e8784a',horn:'#fff0d4',eye:'#ffcf4a',k:0.78});
    if(G&&G.choices&&G.choices.ending==='heir'){ g.strokeStyle='#d8b060'; g.lineWidth=3; for(let x=-72;x<=72;x+=24){ g.beginPath(); g.moveTo(x,-96); g.lineTo(x,74); g.stroke(); } g.beginPath(); g.ellipse(0,-96,78,10,0,0,TAU); g.stroke(); } }}
});
if(!EVPORT.f_hush) EVPORT.f_hush={bg:'#1c1a30',f:g=>thrFaceMoth(g,{wing:'#f4f2fa',wing2:'#d4d0e6',eye:'#b890f0',iris:'#6a3ac8',fur:'#ffffff',fur2:'#e8e4f6',eyes:'#3a2a5a',ant:'#f0ecff',leash:thrHushLeashed()})};

// ================= 9. the journal's "story so far" (THREADS 17): one recap per finished part of the story
// ACT_RECAP[key] = {label:()=>'Act II · The Masked Thief', done:()=>bool, paras:()=>[S(full,simple),...]}; an act may
// replace its own entry (ACT_RECAP[3]={...}) or add paragraphs by wrapping paras. storySoFar() returns the finished ones.
const ACT_RECAP_ORDER=[1,'lantern',2,3,4,5];
const thrActName=n=>{ const A=ACTS[n]; return actLabel(n)+(A&&A.name?' · '+A.name:''); };
const ACT_RECAP={
  1:{label:()=>thrActName(1),done:()=>!!G.flags.act1_done,paras:()=>{
    const e=G.choices.ending||'hero', P=[S(`On the thousandth Lantern Day, the shortest night of the year, Ash only wanted to light the three lanterns on the green and get it right. Then the North Gate swung open, and Elder Yara told him the family secret. The First Flame asleep under Cinder Mountain is Vorlaxis, Ember's father, and half the fire in Ash was once his.`,`On Lantern Day, Ash learned a secret. The dragon under the mountain is his very old grandpa. Half of Ash's fire was once his.`),
      S(`Ash relit the five Ward-fires on the way to the mountain, and his grandfather's voice followed him: "Are you sure you're not mine?" Mom told him his fire had been given, not taken. Given is different.`,`Ash relit the five Ward-fires. A voice asked, "Are you sure you're not mine?" Mom said his fire was a gift. Gifts are different.`)];
    if(G.flags.pip) P.push(S(`On a crag in the east an egg hatched: Pip, a baby dragon the size of a loaf, who decided Ash was his mother and has not left his side since.`,`And Pip hatched. Pip has stayed by Ash ever since.`));
    P.push({hero:S(`At the top, Ash told his grandfather the fire was not his anymore, and put the First Flame out. It went quietly, like a candle at bedtime. It was right for the valley. He was still Ash's grandfather. In the ashes lay a warm red stone that beat like a heart: the Ember Heart. Mom keeps it in her forge.`,`Ash put out the First Flame. A warm stone was left: the Ember Heart. Mom keeps it in the forge.`),
      warden:S(`Ash would not destroy his grandfather, and he would not set him free. He lit a sixth Ward-fire with his own flame and became the Sixth Warden. The Ember Heart, the last spark of the old fire, glows in it on the summit, and every Lantern Day Ash climbs up to say goodnight.`,`Ash became the Sixth Warden. The Ember Heart glows on the mountain. Every Lantern Day he says goodnight to Grandpa.`),
      heir:S(`Ash took all of the First Flame and grew until the throne was too small for him. For one night he knew exactly how "mine" feels. The next morning he let most of it go, on purpose, because Mom's doorway does not fit a dragon. Vorlaxis, small and bitter now, sits on the warm shelf above Bertram's oven. The Ember Heart sits on a shelf in Mom's forge.`,`Ash took the First Flame, then let most of it go. Grandpa is small now. He sits on a warm shelf at the bakery. Mom keeps the Ember Heart.`),
      lantern:S(`Ash lit his grandfather a paper lantern, the way Ember had every year, so he would know where home was. The anger went out of the old dragon like a fire nobody feeds. He came home for Lantern Day, about the size of a goat, coughed up the Ember Heart and asked Mom to keep it safe.`,`Ash lit Grandpa a lantern. Grandpa stopped being angry and came home, the size of a goat. Mom keeps the Ember Heart.`)}[e]||'');
    P.push(S(`As Ash turned for home, a grey moth with two pale moons on her wings landed on the empty throne, looked at him, and flew up toward the moon.`,`A grey moth sat on the empty throne. Then it flew up to the moon.`));
    return P; }},
  lantern:{label:()=>S('Lantern Night','Lantern Night'),done:()=>!!G.flags.c_leapt&&G.stage!=='c_fest'&&G.stage!=='c_clue',paras:()=>[
    S(`That night the valley lit its lanterns, and a girl in a grey cloak watched from a far roof. In the middle of the fireworks she stole the Ember Heart from Mom's forge. Ash chased her over the rooftops, but she got away on a waiting sail and left a brass gear stamped "Gearhaven". Mom took it hard. It was her forge. She packed him a scarf and sent him south anyway.`,`On Lantern Night a thief stole the Ember Heart from Mom's forge. She dropped a gear that says "Gearhaven". Mom sent Ash south.`)]},
  2:{label:()=>thrActName(2),done:()=>!!(G.flags.act2_done||G.flags.c_done),paras:()=>{
    const P=[S(`Ash followed the gear down the Southern Pass to the Clockwork Coast. In Gearhaven every clock had stopped at one minute to midnight, and the papers were full of the Moth Mask, a rooftop thief who only steals things that glow and never sells them.`,`Ash went south to Gearhaven. Every clock had stopped. The thief was called the Moth Mask.`),
      S(`Under the mask was Vesper Saltwhistle, his cousin. Her side of the family goes back to Pearl, Ember's child who was born without fire, and in their house a match is out by morning. A soft voice in Vesper's dreams, the Lady of the Moths, had promised that the Heart would give them their fire back.`,`The thief was Vesper, Ash's cousin. Her family has no fire. A voice in her dreams promised her some.`)];
    if(G.choices.c_vesper==='friend') P.push(S(`On the roof of the Shadow Spire, Ash asked her why instead of fighting to the end. She told him. He said he would have lit her gran's stove himself, if she had only asked, and he came down with a Shard and a cousin.`,`Ash asked Vesper why. She told the truth. Now she is his cousin and his friend.`));
    else if(G.choices.c_vesper==='foe') P.push(S(`On the roof of the Shadow Spire, Ash stood his ground. Vesper threw him the one Shard she had and ran, more ashamed than beaten.`,`Ash stood his ground. Vesper threw him the Shard and ran.`));
    P.push(S(`Her notebook told the rest. She had given the Heart to the Lady herself, a grey moth with two pale moons painted on her wings: the Mother of all the moths. Ember's fire burns any moth that takes it, so the Mother cracked it in three for her moths to carry. A white moth flew north with one piece, the Mother flew east with another, and the third fell at Vesper's feet.`,`Vesper gave the Heart to a great grey moth, the Mother of the moths. She broke it in three. One piece fell to Vesper. Now Ash has it.`),
      S(`Then a soft voice in the dark thanked Ash. That night it snowed at midsummer, and there was a bite out of the moon.`,`Then a soft voice said thank you. Snow fell in summer. The moon had a bite out of it.`));
    return P; }},
  3:{label:()=>thrActName(3),done:()=>!!(G.flags.act3_done||G.flags.f_done),paras:()=>{
    const P=[S(`Mom wrote that it was snowing at home in June, and the Shard in Ash's pocket went cold, as if it were scared. He crossed the High Pass into Frostreach, where Hearthold huddled round its dying Great Hearth, and woke the Hearth with Blaze Breath. It burned blue.`,`It snowed at home in June. Ash went north and woke the Great Hearth. It burned blue.`),
      S(`Hush, the Mother's white moth, had carried the second Shard north and frozen Rimeholm because its bell rang every morning. Up on Mount Dread slept Glaciar, Vorlaxis's sister and Ember's Auntie Glee, the dragon who chose to be gentle. The Mother had chained her and turned her one gentle snow a year into a winter without end. Cold keeps things, the Mother says. Nothing leaves in the cold.`,`Hush, a white moth, froze a village and took the second Shard north. On the mountain slept Glaciar, Grandpa's sister. The Mother chained her and made her dream a winter.`)];
    P.push(G.choices.f_glaciar==='defeat'?S(`Ash beat her and took the Frost Shard, and she sank back to sleep under the snow, still chained. Before she slept she whispered the soft voice's name: Nyxara, the moon's old moth.`,`Ash beat Glaciar and got the Frost Shard. She fell asleep, still chained. She said the voice's name: Nyxara.`)
      :S(`Instead of beating her, Ash melted the four chains, and Glaciar woke up as herself, horrified by the blizzard. She gave him the Frost Shard and the soft voice's name: Nyxara, the moon's old moth.`,`Ash melted the chains. Glaciar woke up. She gave him the Frost Shard and told him the voice's name: Nyxara.`));
    P.push(S(`That night another bite was gone from the moon.`,`That night the moon got smaller.`));
    return P; }},
  4:{label:()=>thrActName(4),done:()=>!!(G.flags.act4_done||G.flags.m_done),paras:()=>{
    const P=[S(`Ash sailed east to Moonfall, where the tide had started to wander and old Lumen already lay drowned under the sea. On a dark beach Nyxara came herself, took a bite of the moon, and asked him for the Shards. She could have crushed him with one wing. She asked, because Ember's fire can't be taken. It can only be given.`,`Ash sailed east to Moonfall. Nyxara came and bit the moon. She asked for the Shards, because fire can't be taken. It must be given.`)];
    if(G.choices.m_hush==='free') P.push(S(`At the Eclipse Observatory, Hush guarded the last Shard on a silver leash. Ash melted the leash and let her go.`,`Hush guarded the last Shard on a leash. Ash melted it. She flew away, free.`));
    else if(G.choices.m_hush==='foe') P.push(S(`At the Eclipse Observatory, Hush guarded the last Shard on a silver leash. Ash took the Shard and left the leash on, to be safe, and she crumbled into a hundred small white moths that flew up to their Mother.`,`Hush guarded the last Shard on a leash. Ash left it on. She turned into little moths.`));
    P.push(S(`Then Mom came up the moonlight stairs to the Eclipse Lens, out of breath, and mended the Heart with three taps of her hammer. Nyxara wanted it whole. So did Mom: it was theirs. Ash decided he would never hand it over.`,`Mom climbed the moon stairs and fixed the Heart. Ash decided he would never give it to Nyxara.`),
      S(`Nyxara ate the last of the moon, and a mountain of black glass rose out of the sea. Mom walked Ash to the bridge, and let him go on without her.`,`Nyxara ate the rest of the moon. A black mountain rose. Mom walked Ash to the bridge.`));
    return P; }},
  5:{label:()=>thrActName(5),done:()=>!!(G.done&&(G.flags.act5_done||G.flags.n_done||G.choices.n_end)),paras:()=>{
    const P=[S(`Ash climbed Nightfall Peak, a mountain of black glass made of every place he had been. On each ring an old fear was waiting, and he had an answer for each one from the road behind him.`,`Ash climbed Nightfall Peak. Old fears waited on the way. He had an answer for each one.`),
      S(`At the top, the Night Mother turned out to be Nyx, the cold little moth Ember once warmed on a lantern, who waited for her to come back and grew huge and frightened in the dark. Then Ash's own fire went out. It came back from what he had given away: his friends and Mom speaking through the Heart, and Pip, the one who stayed, shouting his first word.`,`At the top was Nyx, a moth Ember once warmed on a lantern. She was scared of being left. Ash's fire went out. His friends, Mom and Pip brought it back.`)];
    let e=''; try{ if(typeof endingSoFar==='function') e=endingSoFar(); }catch(err){}
    if(!e) e={dawn:S(`Ash would not hand the Heart over in fear. He breathed the biggest fire of his life, and Nyxara came apart into a thousand silver moths that stitched the moon back together. Then, far off, the sky turned pink, and it was morning.`,`Ash would not give her the Heart. The moths fixed the moon. Morning came.`),
      embermoon:S(`Ash gave the Ember Heart away, freely, to the empty moon. Given, it burned gold instead of black, and Nyx sleeps curled round it like a cat round a stove, warm at last.`,`Ash gave the Heart to the moon. The moon is gold and warm now. Nyx sleeps on it.`),
      moth:S(`Ash called her by her old name and lit her Mom's paper lantern. It won't last forever. Lanterns never do, which is why you light new ones. She let the moon go home and became a small grey moth again, one who visits.`,`Ash lit a lantern for Nyx. She let the moon go. Now she is a little moth who visits.`)}[G.choices.n_end]||'';
    if(e) P.push(e);
    P.push(S(`Then it was Lantern Day again, and Ash lit one more lantern than he needed.`,`Then it was Lantern Day again. Ash lit one more lantern, just in case.`));
    return P; }}
};
function storySoFar(){
  if(!G) return [];
  const out=[];
  for(const k of ACT_RECAP_ORDER){ const R=ACT_RECAP[k]; if(!R) continue; let ok=false; try{ ok=!!R.done(); }catch(e){} if(!ok) continue;
    let paras=[]; try{ paras=(R.paras()||[]).filter(Boolean); }catch(e){ console.error(e); } if(!paras.length) continue;
    out.push({key:k,label:fval(R.label),paras}); }
  return out;
}
const actRecap=k=>{ const R=ACT_RECAP[k]; if(!R) return []; try{ return (R.paras()||[]).filter(Boolean); }catch(e){ return []; } };
// the journal: the moon and the Heart, the story so far, and the friends who will help (Story tab); treasures (Bag)
{ const base=renderJour; renderJour=function(){ base(); try{ if(G&&G.mode==='story') threadsJour(); }catch(e){ console.error(e); } }; }
function threadsJour(){
  const el=$('#jBody'); if(!el) return; const E=t=>escapeHtml(simplify(t));
  const row=(img,title,text)=>`<div class="thr-row" style="display:flex;align-items:center;gap:10px;margin:8px 0"><img alt="" src="${img}" style="width:56px;height:56px;flex:0 0 56px"><div><b style="color:var(--ink)">${E(title)}</b><br>${E(text)}</div></div>`;
  if(jTab==='story'){
    const H=[], st=heartState();
    if(G.flags.act1_done){ const b=moonShown(); H.push(row(moonImgURL(b,moonLook()),S('The moon','The moon'),moonText(b))); }
    if(st!=='none') H.push(row(heartImgURL(st,shardsHeld()),S('The Ember Heart','The Ember Heart'),heartText()));
    const sf=storySoFar();
    if(sf.length){ H.push(`<div class="jh2">${E(S('The story so far','The story so far'))}</div>`); for(const r of sf) H.push(`<p><b style="color:var(--ink)">${E(r.label)}</b><br>${r.paras.map(E).join(' ')}</p>`); }
    const al=G.flags.act1_done?nAllies():[];
    if(al.length) H.push(`<div class="jh2">${E(S('Friends who will stand with you','Friends who will help you'))}</div><ul>${al.map(id=>`<li>${E(THR_ALLY_BY[id].line)}</li>`).join('')}</ul>`);
    if(!H.length) return;
    const first=el.querySelector('p'); if(first) first.insertAdjacentHTML('afterend',H.join('')); else el.insertAdjacentHTML('afterbegin',H.join(''));
  }else if(jTab==='bag'){
    const st=heartState(); if(st!=='shards'&&st!=='whole') return;
    const ul=el.querySelector('ul'); const h=`<div class="jh2">${E(S('Treasures','Treasures'))}</div>`+row(heartImgURL(st,shardsHeld()),st==='whole'?S('The Ember Heart','The Ember Heart'):S('The Shards of the Ember Heart','The Heart Shards'),heartText());
    if(ul) ul.insertAdjacentHTML('afterend',h); else el.insertAdjacentHTML('beforeend',h);
  }
}

// ================= 10. per frame, saves, and test saves
function threadsTick(dt){ if(!G||G.mode!=='story') return; moonWatch(); pebbleTick(dt); }
{ const base=simUpdate; simUpdate=function(dt){ base(dt); try{ threadsTick(dt); }catch(e){ console.error(e); } }; }
// Pebble keeps flapping while a letter is read (dialogue runs liteUpdate, not simUpdate)
{ const base=liteUpdate; liteUpdate=function(dt){ base(dt); try{ const C=PEBRT.crow; if(C&&C.mode==='sit'){ C.flap+=dt*2; const T=pbPerch(); C.x=T.x; C.y=T.y; } }catch(e){} }; }
function threadsReset(){ MOON.anim=null; MOON.crumbs.length=0; MOON.pulse=0; PEBRT.crow=null; PEBRT.want=0; PEBRT.force=null; PEBRT.letter=null; PEBRT.seenPeak=false; }
{ const base=newRun; newRun=function(mode){ base(mode); threadsReset(); }; }
// an old save has no moon (100) and no moon_hud: the HUD starts from what the save shows, with no animation
{ const base=loadGame; loadGame=function(s){ base(s); try{ threadsReset(); if(G.flags.moon_hud==null) G.flags.moon_hud=bitesOf(); }catch(e){ console.error(e); } }; }
// __eb.actStart(n): the cross-act state a fair test save at the start of act n should have (only fills what is missing)
function threadKit(n){
  if(!G||n<2) return; const F=G.flags, I=G.items, C=G.choices;
  if(n>=3){ F.c_heart_stolen=1; F.c_stolen=true; if(!(I.c_shard1>0)) I.c_shard1=1; if(!C.c_vesper) C.c_vesper='friend'; F.c_pip_fetch=1; F.c_snow=true; if(F.c_trust==null) F.c_trust=5; F.moon=Math.min(moonLeft(),95); }
  if(n>=4){ if(!(I.f_shard2>0)) I.f_shard2=1; if(!C.f_glaciar) C.f_glaciar='free'; if(!C.f_glaciar_home) C.f_glaciar_home='stay'; F.f_nyx_named=1; F.f_moon_bite3=1; F.f_hush_done=1; F.f_pip_warm=1; F.moon=Math.min(moonLeft(),85); }
  if(n>=5){ delete I.c_shard1; delete I.f_shard2; delete I.m_shard3; I.m_heart=1; F.m_heart=1; F.m_reforged=1; if(!C.m_hush) C.m_hush='free'; F.m_pip_lamp=1; if(!F.m_ship) F.m_ship='ship'; F.moon=0; }
  F.moon_hud=bitesOf(); threadsReset(); saveGame(true);
}
{ const base=actStartDebug; actStartDebug=function(n,where){ const r=base(n,where); try{ threadKit(clamp(n|0,1,5)); }catch(e){ console.error(e); } return r; }; }

window.__ebX=Object.assign(window.__ebX||{},{
  actStart:actStartDebug,
  moonSet, moonLeft, bitesOf, moonRestore, moonLook, MOON_DARK, MOON_BEATS, MOON_BITES, drawMoon,
  // __eb.moon(pct, anim): set the moon to any value (also up, for tests); anim true plays the bite animation from the bites shown now
  moon(pct,anim){ G.flags.moon=clamp(+pct,0,100); if(!anim) G.flags.moon_hud=bitesOf(); MOON.anim=null; return {moon:moonLeft(),bites:bitesOf(),hud:G.flags.moon_hud}; },
  moonInfo:()=>({moon:moonLeft(),bites:bitesOf(),hud:G.flags.moon_hud,shown:moonShown(),pending:moonPending(),calm:!!moonCalm(),anim:MOON.anim?{t:+MOON.anim.t.toFixed(2),from:MOON.anim.from,to:MOON.anim.to}:null,dark:+moonDark().toFixed(3),glow:+moonGlowK().toFixed(3),look:moonLook(),spot:MOON.hud,text:moonText(moonShown())}),
  moonTap, moonText, moonSub, moonHudSpot, moonFreeze(t){ MOON.freeze=t==null?null:+t; return MOON.anim?{t:MOON.anim.t,from:MOON.anim.from,to:MOON.anim.to}:null; }, pebbleRested,
  PEBBLE_MAIL, pebbleLetter, pebbleDue, pebbleNow, pebbleAll:()=>pebbleAll().map(d=>d.id), pebbleInfo:()=>({crow:PEBRT.crow?PEBRT.crow.mode:null,want:PEBRT.want,wait:+PEBRT.wait.toFixed(2),force:PEBRT.force,letter:PEBRT.letter&&PEBRT.letter.id,due:pebbleDue()}),
  EPI, epiPick, epiAdd, vesperFriend, nKnowsNyx, nFreed, nCanMercy, nAllies, allyEarned, THR_ALLIES,
  thrTalk(lines){ runDialogue(pbNorm(lines),()=>{ scene='play'; }); return true; }, dreamFor:st=>dreamFor(st==null?G.stage:st), heartState, heartText, shardsHeld, heartImg:heartImgURL, moonImg:moonImgURL, storySoFar, actRecap, ACT_RECAP, defineDream, tamsinVerse, threadKit
});
