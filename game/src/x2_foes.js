
// ================= x2_foes: the Act III enemies and bosses (Frostreach, the Long Winter)
// Built on e8_foes (defineFoe, the AI kit FK, defineBoss, bossPhase) and the Act III powers of p3_frost (foe hooks
// e.onBlaze, e.onPound, e.onIcicle). Every foe has a 3D toy figure (T3E) and a 2D drawer for the Classic look.
// The guide (numbers, how to spawn, how to place each boss, hooks for the story): scratchpad/F2FOES.md.
//   foes    f_rimehound, f_snowgob, f_frostshell, f_mothling, f_stalagbat, f_rimeknight, f_shardling
//   minis   f_blubberton (Glacier Maze), f_squall + f_squeak (Skyreach), f_rockjaw (Stonehorn), f_grumbo (Heart of Dread)
//   bosses  f_bellows (Glacier Maze), f_frostfeather (Skyreach Temple), f_grumblehorn (Stonehorn Deep),
//           f_hush (outdoors, the Dreadgate), f_glaciar (outdoors, the Crown of Dread, with the four frost chains)
// Dungeon boss rooms: give the room `f2boss:'f_bellows'` (kind 'boss' or 'miniboss', no `boss:` field), or spread a
// ready room spec from F2_ROOM. The fight starts when Ash walks in, the doors lock, the room is solved when it falls.
// The finale echoes reuse the Glaciar and Hush brains: f2GlaciarAI(opt), f2HushAI(opt), f2Chain(...), f2Lamp(...).
// Colour language: orange ground hit, white sweep, red line charge or dive, frost blue breath and ice, violet moth-frost,
// lilac sleepy dust, gold weak spot.

// ---------- 0. shared bits
const F2={hook:{},won:{},corpses:[],runners:[],area:null,rooms:[],pending:null,dmg:0,hits:0,bySrc:{},bot:null,noIntro:false,
  frozenT:0,chill:[],chillImm:0,sleepT:0,yawnT:0,hushT:0,hushSay:0,whiteT:0,whiteK:0,workT:0,ivx:0,ivy:0,lamps:[],trace:false,log:[]};
const F2COL={orange:'255,160,60',white:'255,255,255',red:'255,70,60',frost:'160,215,255',violet:'175,120,255',gold:'255,210,80',dust:'215,200,245',snow:'235,245,255'};
const f2Sm=t=>t*t*(3-2*t);
// a literal hit of n at the foe's level (like bdmg, but also right outside its AI tick: zones, rings, the arena)
function f2Dmg(e,n){ return n*((e&&e.edK)||1)*foeDiff().edmg; }
// difficulty: a window (stagger, stuck, open dome) is 50 percent longer on Easy (ACT3.md 9)
function f2Win(t){ return foeDiff().easy?t*1.5:t; }
function f2W(o,def){ const d=(G&&G.diff)||{}; return fkW(o||{},def)*(d.wind||1); }
// the fight area of a foe: a dungeon room (e.arena), the raised arena, the Arena-mode ring or its home
function f2Ctx(e){
  const a=e&&e.arena; if(a) return {cx:a.cx,cy:a.cy,rect:true,x0:a.x0,y0:a.y0,x1:a.x1,y1:a.y1,R:Math.min(a.x1-a.x0,a.y1-a.y0)/2,A:null};
  if(e&&e.f2ctx) return e.f2ctx;
  const C=bossCtx(e); return {cx:C.cx,cy:C.cy,R:C.R,A:C.A,rect:false};
}
function f2In(C,x,y,m){ m=m||0; if(C.rect) return x>C.x0+m&&x<C.x1-m&&y>C.y0+m&&y<C.y1-m; if(C.A) return arenaIn(C.A,x,y,m); return dist(x,y,C.cx,C.cy)<C.R-m; }
function f2Hold(C,o,m){ m=m||0; if(C.rect){ o.x=clamp(o.x,C.x0+m,C.x1-m); o.y=clamp(o.y,C.y0+m,C.y1-m); return o; } if(C.A){ arenaHold(C.A,o,m); return o; } const d=dist(o.x,o.y,C.cx,C.cy); if(d>C.R-m){ const a=angTo(C.cx,C.cy,o.x,o.y); o.x=C.cx+Math.cos(a)*(C.R-m); o.y=C.cy+Math.sin(a)*(C.R-m); } return o; }
function f2Solid(x,y){ return blockedAt(x,y)||colAt(x,y,4); }
// Ash's floor level (dungeon raised floor, the outdoor elevation)
function f2Lvl(x,y){ const p=player; if(x==null){ x=p.x; y=p.y; } try{ return AREA?(AREA.tri?Math.max(0,dunH(tCell(x,y))):0):elevLvl(x,y); }catch(e){ return 0; } }
function f2Up(){ return airborne()||(typeof P2!=='undefined'&&P2.mv&&P2.mv.kind==='hang')||(typeof P3!=='undefined'&&!!P3.ride); }
function f2Hurt(e){ return e.lastHit!=null?clamp(1-((G?G.time:0)-e.lastHit)/0.28,0,1):0; }
function f2Say(e,who,line,gap){ bossSay(e,who,line,gap||7); }
function f2Tip(id,title,text){ if(G.flags['f2tip_'+id]) return; G.flags['f2tip_'+id]=1; try{ mvTip(title,text,7,'f2_'+id); }catch(err){ setBanner(title,text,3); } }
function f2Txt(e,t,col,sz){ ftext(e.x,(e._t3top!=null?e._t3top:e.y-e.r-20)-14,t,col||'#ffe066',sz||15); }
function f2Puff(x,y,col,n){ emit(x,y,n||16,{col:col||'235,245,255',glow:false,smin:30,smax:150,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:6,drag:1}); }
function f2Snow(x,y,n){ emit(x,y,n||14,{col:'245,250,255',glow:false,smin:40,smax:180,lmin:.3,lmax:.7,zmin:1.4,zmax:3,drag:2}); }
function f2Shards(x,y,n,col){ emit(x,y,n||14,{col:col||'200,235,255',smin:60,smax:220,lmin:.25,lmax:.55,zmin:1.2,zmax:2.8,drag:3}); }
function f2Stun(e,t,txt){ e.stun=Math.max(e.stun||0,t); e.tele=null; e.mv=null; e.blocking=false; if(txt) f2Txt(e,txt,'#ffe066',16); shake(6); }
// the blue jet (Blaze) or any fire breath on a point; the player's mouth point
function f2Blue(x,y,r){ return typeof p3JetHits==='function'&&p3JetHits(x,y,r||10); }
function f2Fire(x,y,r){ return !!player&&player.breathing&&(f2Blue(x,y,r)||(typeof inBreath==='function'&&inBreath(x,y,r||10))); }
function f2Need(s){ return typeof p3Need==='function'?p3Need(s):s; }
function f2Pounding(){ return typeof P3!=='undefined'&&P3.lastPound&&G.time-P3.lastPound.t<0.05?P3.lastPound:null; }
// Ash is working a mechanic (blazing a lock, a plate, a vent): the boss watcher does not punish standing still
function f2Work(){ F2.workT=0.35; }
if(typeof balStill==='function'){ const base=balStill; balStill=function(dt){ if(F2.workT>0){ try{ BST.t=0; }catch(e){} return; } return base(dt); }; }
function f2Ice(e){ e.ice=true; return e; }
// the power hooks p3_frost and p2_coast call on the foe itself (e.onBlaze, e.onPound, e.onIcicle, e.onShadow): our types
// declare them in defineFoe, so every one of ours gets them when it is made
{ const base=makeEnemy; makeEnemy=function(type,x,y,opt){ const e=base(type,x,y,opt), F=FOES[type];
    if(F&&F.f2) for(const k of ['onBlaze','onPound','onIcicle','onShadow']) if(F[k]&&!e[k]) e[k]=F[k];
    return e; }; }
function f2Foe(type,d){ d.f2=true; return defineFoe(type,d); }

// ---------- 1. the player side: frozen solid (shake free, or Blaze yourself out), sleepy dust (slow and yawns), hushed
// (no fire breath), the whiteout, slippery ice on the ground, and the damage log for the tests
function f2Chill(n){
  const p=player; if(!p||p.dead||F2.frozenT>0||F2.chillImm>0||(typeof p2Shadowed==='function'&&p2Shadowed())) return;
  const t=G.time; F2.chill.push(t); while(F2.chill.length&&t-F2.chill[0]>1) F2.chill.shift();
  if(F2.chill.length>=(n||byDiff(4,3,3))){ F2.chill.length=0; f2Freeze(byDiff(0.7,1,1.1)); }
}
function f2Freeze(t){ const p=player; F2.frozenT=t; F2.frozenMax=t; F2.mash=0; SFX.play('block'); shake(4); f2Shards(p.x,p.y-12,16);
  ftext(p.x,p.y-48,S('Frozen! Wiggle free!','Frozen! Wiggle!'),'#dff4ff',15);
  f2Tip('frozen',S('Frozen solid!','Frozen!'),S('Wiggle the stick or keys to shake free, or breathe Blaze to melt yourself out.','Wiggle to break free! Or use blue fire.')); }
function f2Sleep(t,k){ const p=player; F2.sleepT=Math.max(F2.sleepT,t); F2.sleepK=Math.max(k||0.4,F2.sleepT>0?(F2.sleepK||0):0); if(!(F2.yawnT>G.time)){ F2.yawnT=G.time+1.6; ftext(p.x,p.y-44,S('Yaaawn...','Yawn...'),'#e2d8ff',13); } }
function f2Hush(t){ F2.hushT=Math.max(F2.hushT,t); }
{ const base=updatePlayer; updatePlayer=function(dt,inp){
    const p=player; if(!G||!p||G.mode!=='story') return base(dt,inp);
    if(F2.workT>0) F2.workT-=dt; if(F2.chillImm>0) F2.chillImm-=dt;
    if(F2.hushT>0){ F2.hushT-=dt; if(inp&&inp.fire){ inp=Object.assign({},inp,{fire:false}); if(!(F2.hushSay>G.time)){ F2.hushSay=G.time+1.6; ftext(p.x,p.y-42,S('Shhh! Your fire is hushed.','Shh! No fire yet.'),'#e2d0ff',13); } } }
    if(F2.frozenT>0&&!p.dead){
      const m=inp?Math.hypot(inp.mx||0,inp.my||0):0, poke=!!(inp&&(inp.jump||inp.attack||inp.roll));
      if((m>0.5&&!F2.mashOn)||poke){ F2.frozenT-=0.12; F2.mash++; if(Math.random()<0.6) f2Shards(p.x,p.y-12,4); } F2.mashOn=m>0.5;
      F2.frozenT-=dt; if(typeof P3!=='undefined'&&P3.bz&&P3.bz.blue&&p.breathing){ F2.frozenT=0; ftext(p.x,p.y-44,S('Blaze! You melt free!','Blue fire! Free!'),'#bfe6ff',14); }
      if(F2.frozenT<=0){ F2.frozenT=0; F2.chillImm=0.8; SFX.play('pop'); f2Shards(p.x,p.y-14,22); }
      else inp=Object.assign({},inp||{},{mx:0,my:0,jump:false,jumpHeld:false,attack:false,roll:false,sprint:false,use:false}); }
    if(F2.sleepT>0){ F2.sleepT-=dt; p.slowT=Math.max(p.slowT||0,0.12); if(F2.sleepK>0.45&&inp&&!airborne()) inp=Object.assign({},inp,{mx:(inp.mx||0)*0.8,my:(inp.my||0)*0.8}); }
    if(F2.whiteT>0) F2.whiteT-=dt;
    const ox=p.x, oy=p.y, air=airborne();
    const r=base(dt,inp);
    // ice on the ground (frost breath, a hound's streak): Ash slides like on the Glimmerfrost
    if(!air&&!airborne()&&!p.dead&&dt>0&&!(typeof P3!=='undefined'&&(P3.ride||P3.mv))&&!(typeof P2!=='undefined'&&(P2.mv||P2.dash))&&f2IceZoneAt(p.x,p.y)){
      const vx=(p.x-ox)/dt, vy=(p.y-oy)/dt, k=1-Math.exp(-dt*1.8); F2.ivx=lerp(F2.ivx,vx*1.1,k); F2.ivy=lerp(F2.ivy,vy*1.1,k);
      const nx=ox+F2.ivx*dt, ny=oy+F2.ivy*dt; if(!playerBlocked(nx,ny)){ p.x=nx; p.y=ny; } else { F2.ivx*=-0.3; F2.ivy*=-0.3; } }
    else if(dt>0){ F2.ivx=(p.x-ox)/dt; F2.ivy=(p.y-oy)/dt; }
    return r; }; }
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){ const h0=player?player.hp:0, r=base(amt,sx,sy,kb); if(r&&player){ const d=Math.max(0,h0-player.hp); F2.dmg+=d; F2.hits++;
      let src='other', bd=300*300; if(sx!=null) for(const q of G.enemies){ if(q.dead) continue; const dd=dist2(q.x,q.y,sx,sy); if(dd<bd){ bd=dd; src=q.type; } } F2.bySrc[src]=(F2.bySrc[src]||0)+d; } return r; }; }
// the whiteout (Glaciar's Long Night), and a cold blue rim while Ash is frozen
{ const base=drawVignette; drawVignette=function(){ base();
    try{ if(!G||scene==='menu') return;
      const w=F2.whiteT>0?clamp(Math.min(F2.whiteT/0.4,(F2.whiteMax-F2.whiteT)/0.35+0.2,1),0,1):0; F2.whiteK=w;
      if(w>0.01){ ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0); const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.08,W/2,H/2,Math.max(W,H)*0.7); g.addColorStop(0,`rgba(250,252,255,${w*0.55})`); g.addColorStop(1,`rgba(235,242,255,${w*0.93})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.restore(); }
      if(F2.frozenT>0){ ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0); const a=clamp(F2.frozenT/(F2.frozenMax||1),0.3,1)*0.45, g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.66); g.addColorStop(0,'rgba(170,220,255,0)'); g.addColorStop(1,`rgba(170,220,255,${a})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.restore(); }
    }catch(err){} }; }
// over Ash: the ice block while frozen, the hush sign, sleepy z's
{ const base=drawMarkers; drawMarkers=function(t){ base(t);
    if(!G||!player||player.dead) return; const p=player;
    if(F2.frozenT>0){ const k=clamp(F2.frozenT/(F2.frozenMax||1),0,1), y=p.y-(p.z||0), wob=Math.sin(t*40)*Math.min(3,F2.mash*0.4);
      ctx.save(); ctx.globalAlpha=0.55+0.3*k; ctx.fillStyle='rgba(190,230,255,.55)'; ctx.strokeStyle='rgba(245,252,255,.95)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(p.x-17+wob,y+6); ctx.lineTo(p.x-20+wob,y-30); ctx.lineTo(p.x-6+wob,y-44); ctx.lineTo(p.x+12+wob,y-40); ctx.lineTo(p.x+20+wob,y-18); ctx.lineTo(p.x+15+wob,y+7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(p.x-10+wob,y-34); ctx.lineTo(p.x-4+wob,y-12); ctx.moveTo(p.x+8+wob,y-30); ctx.lineTo(p.x+4+wob,y-20); ctx.stroke(); ctx.restore(); }
    if(F2.hushT>0){ const y=p.y-50+Math.sin(t*5)*2; ctx.save(); ctx.globalAlpha=clamp(F2.hushT,0,1); ctx.fillStyle='rgba(60,40,90,.8)'; ctx.beginPath(); ctx.arc(p.x,y,9,0,TAU); ctx.fill(); ctx.strokeStyle='#e2d0ff'; ctx.lineWidth=1.6; ctx.stroke();
      ctx.fillStyle='#e2d0ff'; ctx.font=`800 9px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('shh',p.x,y+0.5); ctx.restore(); }
    if(F2.sleepT>0){ ctx.save(); ctx.fillStyle='#e8e0ff'; ctx.strokeStyle=LOOK.sb?SBC.outline:'#2a2040'; ctx.lineWidth=2.4; ctx.font=`800 11px ${UIF}`; ctx.textAlign='center';
      for(let i=0;i<2;i++){ const q=(t*0.7+i*0.5)%1; ctx.globalAlpha=clamp(F2.sleepT,0,1)*(1-q); const x=p.x+10+q*12+i*4, y=p.y-40-q*18; ctx.strokeText('z',x,y); ctx.fillText('z',x,y); } ctx.restore(); }
  }; }

// ---------- 2. ground marks and lingering zones (fight zones from e8: drawn under everyone, cleared when a fight ends)
// f2mark: a telegraph at any spot {shape:'circle'|'line'|'donut'|'cone', x,y,r,(r1,r2),ang,len,w,half,dur,col,fire(z),follow(z)}
FZK.f2mark={
  tick(z,dt){ if(z.follow){ const f=z.follow(z); if(f){ z.x=f.x; z.y=f.y; } } if(z.t>=z.dur&&!z.fired){ z.fired=true; z.done=true; if(z.fire) try{ z.fire(z); }catch(err){ console.error(err); } } },
  drawG(z){ const k=clamp(z.t/z.dur,0,1), col=z.col||F2COL.orange; ctx.save();
    if(z.shape==='line'){ ctx.translate(z.x,z.y); ctx.rotate(z.ang||0); const L=z.len, w=z.w||30;
      ctx.fillStyle=`rgba(${col},${0.12+0.12*k})`; ctx.fillRect(0,-w/2,L,w); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.strokeRect(0,-w/2,L,w); ctx.fillStyle=`rgba(${col},0.28)`; ctx.fillRect(0,-w/2,L*k,w); }
    else if(z.shape==='donut'){ ctx.fillStyle=`rgba(${col},${0.12+0.12*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r2,0,TAU); ctx.arc(z.x,z.y,z.r1,0,TAU,true); ctx.fill(); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(z.x,z.y,z.r2,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(z.x,z.y,z.r1,0,TAU); ctx.stroke(); }
    else if(z.shape==='cone'){ ctx.translate(z.x,z.y); ctx.rotate(z.ang||0); ctx.fillStyle=`rgba(${col},${0.12+0.12*k})`; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,z.len,-z.half,z.half); ctx.closePath(); ctx.fill(); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.stroke(); }
    else { ctx.fillStyle=`rgba(${col},${0.12+0.12*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2.2; ctx.stroke(); ctx.fillStyle=`rgba(${col},0.24)`; ctx.beginPath(); ctx.arc(z.x,z.y,Math.max(1,z.r*k),0,TAU); ctx.fill();
      if(z.drop){ const h=(1-k)*220; ctx.fillStyle='rgba(225,245,255,.85)'; ctx.strokeStyle='rgba(60,110,170,.7)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(z.x-5,z.y-h-30); ctx.lineTo(z.x+5,z.y-h-30); ctx.lineTo(z.x,z.y-h); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    ctx.restore(); }
};
function f2Mark(o){ return fzAdd('f2mark',Object.assign({dur:0.8,r:46,col:F2COL.orange},o)); }
// f2lob: a thing thrown in an arc from (x0,y0) to (x,y), its landing spot marked from the start; land(z) when it lands
FZK.f2lob={
  tick(z,dt){ if(z.t>=z.dur&&!z.fired){ z.fired=true; z.done=true; if(z.land) try{ z.land(z); }catch(err){ console.error(err); } } },
  drawG(z){ const k=clamp(z.t/z.dur,0,1), col=z.col||F2COL.frost; ctx.save();
    ctx.fillStyle=`rgba(${col},${0.12+0.14*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,TAU); ctx.fill(); ctx.setLineDash([6,5]); ctx.lineDashOffset=-G.time*30; ctx.strokeStyle=`rgba(${col},${0.6+0.3*k})`; ctx.lineWidth=2; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=`rgba(${col},0.22)`; ctx.beginPath(); ctx.arc(z.x,z.y,Math.max(1,z.r*k),0,TAU); ctx.fill(); ctx.restore(); },
  tall(z,list){ if(!z.it) z.it={flying:true,draw:()=>{ const u=clamp(z.t/Math.max(0.05,z.dur),0,1), x=lerp(z.x0,z.x,u), y=lerp(z.y0,z.y,u), h=(z.h||90)*4*u*(1-u)+12;
      ctx.save(); ctx.fillStyle='rgba(30,40,70,.2)'; ctx.beginPath(); ctx.ellipse(x,y,(z.br||7)+1,(z.br||7)*0.5,0,0,TAU); ctx.fill();
      ctx.fillStyle=z.ball||'#f4f8ff'; ctx.strokeStyle=LOOK.sb?SBC.outline:'#3a4868'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(x,y-h,z.br||7,0,TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(x-(z.br||7)*0.35,y-h-(z.br||7)*0.35,(z.br||7)*0.3,0,TAU); ctx.fill(); ctx.restore(); }};
    const u=clamp(z.t/Math.max(0.05,z.dur),0,1); z.it.x=lerp(z.x0,z.x,u); z.it.y=lerp(z.y0,z.y,u)+1; list.push(z.it); }
};
function f2Lob(e,x,y,o){ return fzAdd('f2lob',Object.assign({x0:e.x,y0:e.y,x,y,r:50,dur:1.0,col:F2COL.frost},o)); }
// f2wave: a shockwave ring along the floor. Jumping clears it, so does standing on a ledge; a pound or a drum ring can
// cancel it (z.cancel). {x,y,r0,spd,max,thick,dmg,col,wait}
FZK.f2wave={
  tick(z,dt){ if(z.t<(z.wait||0)) return; z.rad=(z.rad||z.r0||20)+z.spd*dt; if(z.rad>=z.max){ z.done=true; return; } const p=player;
    if(!z.hitP&&!p.dead&&!f2Up()&&(z.ledge===false||f2Lvl()<=(z.lvl||0))){ const d=dist(z.x,z.y,p.x,p.y); if(Math.abs(d-z.rad)<z.thick/2+p.r*0.6){ z.hitP=true; hurtPlayer(z.dmg,z.x,z.y,z.kb!=null?z.kb:280); if(z.onHit) z.onHit(z); } } },
  drawG(z){ if(z.t<(z.wait||0)||!z.rad) return; const a=clamp(1-z.rad/z.max,0,1)*0.9+0.1; ctx.save(); ctx.strokeStyle=`rgba(${z.col||F2COL.orange},${a})`; ctx.lineWidth=z.thick*0.55; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.rad,z.rad*0.86,0,0,TAU); ctx.stroke();
    ctx.strokeStyle=`rgba(255,248,230,${a*0.8})`; ctx.lineWidth=2; ctx.stroke(); ctx.restore(); }
};
function f2Wave(x,y,o){ return fzAdd('f2wave',Object.assign({x,y,r0:20,spd:300,max:420,thick:18,dmg:10},o)); }
// f2ice: slippery frozen ground for a few seconds (frost breath, a Rimehound's streak). Fire melts it.
FZK.f2ice={
  tick(z,dt){ if(f2Fire(z.x,z.y,z.r*0.6)){ z.melt=(z.melt||0)+dt*(f2Blue(z.x,z.y,z.r)?3:1); if(z.melt>0.5){ z.done=true; f2Puff(z.x,z.y,'235,245,255',6); } } },
  drawG(z){ const a=clamp(Math.min(z.t/0.25,(z.life-z.t)/0.6),0,1)*(z.a||1); if(a<=0) return; ctx.save(); ctx.globalAlpha=a;
    ctx.fillStyle='rgba(176,222,250,.62)'; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r,z.r*0.78,z.rot||0,0,TAU); ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='rgba(248,252,255,.9)'; ctx.stroke();
    ctx.fillStyle='rgba(240,250,255,.55)'; ctx.beginPath(); ctx.ellipse(z.x-z.r*0.25,z.y-z.r*0.2,z.r*0.42,z.r*0.16,-0.4,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(80,140,200,.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(z.x-z.r*0.4,z.y+z.r*0.1); ctx.lineTo(z.x+z.r*0.1,z.y-z.r*0.15); ctx.lineTo(z.x+z.r*0.45,z.y+z.r*0.2); ctx.stroke(); ctx.restore(); }
};
function f2IceAdd(x,y,r,life,o){ return fzAdd('f2ice',Object.assign({x,y,r,life:life||6,rot:rand(-0.3,0.3)},o)); }
function f2IceZoneAt(x,y){ const L=G.fz; if(!L||!L.length) return false; for(const z of L) if(z.k==='f2ice'&&!z.done&&z.t>0.1&&dist2(x,y,z.x,z.y)<z.r*z.r*0.75) return true; return false; }
const F2T={};
// ice floors that make a lunging hound overshoot: cave ice cells, the Glimmerfrost (T().ice) and our zones
function f2IceAt(x,y){ if(f2IceZoneAt(x,y)) return true; if(AREA){ const c=AREA.cave; if(!c||!c.typ) return false; const k=tCell(x,y); return k>=0&&c.typ[k]===2; } try{ return T(x,y,F2T).ice>0.5; }catch(e){ return false; } }
// f2cloud: a lingering cloud of sleepy dust {x,y,r,life,sleep (s), k (slow), dmg}
FZK.f2cloud={
  tick(z,dt){ const p=player; if(p.dead||f2Up()||dist(p.x,p.y,z.x,z.y)>z.r) return; f2Sleep(z.sleep||1.2,z.k||0.4); if(z.dmg){ z.tk=(z.tk||0)-dt; if(z.tk<=0){ z.tk=0.7; hurtPlayer(z.dmg,z.x,z.y,0); } } },
  drawG(z){ const a=clamp(Math.min(z.t/0.3,(z.life-z.t)/0.5),0,1), col=z.col||F2COL.dust; if(a<=0) return; ctx.save(); ctx.globalAlpha=a;
    for(let i=0;i<7;i++){ const ang=i*0.9+z.t*0.4*(i%2?1:-1), rr=z.r*(0.25+0.45*((i*0.31)%1)), x=z.x+Math.cos(ang)*rr, y=z.y+Math.sin(ang)*rr*0.7, s=z.r*(0.42+0.12*Math.sin(z.t*2+i));
      ctx.fillStyle=`rgba(${col},.3)`; ctx.beginPath(); ctx.ellipse(x,y,s,s*0.7,0,0,TAU); ctx.fill(); }
    ctx.strokeStyle=`rgba(${col},.6)`; ctx.lineWidth=1.5; ctx.setLineDash([4,6]); ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r,z.r*0.8,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<4;i++){ const x=z.x+Math.cos(i*1.7+z.t)*z.r*0.6, y=z.y+Math.sin(i*2.3+z.t*1.3)*z.r*0.45; ctx.fillRect(x-1,y-1,2,2); } ctx.restore(); }
};
// f2spike: an ice spike that stands for a while and blocks (Glaciar's icicles); Blaze, a pound or a bomb breaks it
FZK.f2spike={
  tick(z,dt){ if(!z.col){ const A=AREA; z.col={t:'c',x:z.x,y:z.y,r:z.r||16,f2:true}; if(A&&z.x>=IZX-50) addAreaCol(z.col); else addCol(z.col); }
    if(f2Blue(z.x,z.y-20,z.r+6)){ z.heat=(z.heat||0)+dt; if(z.heat>f2Need(0.4)) z.life=Math.min(z.life,z.t); }
    const P=f2Pounding(); if(P&&dist(P.x,P.y,z.x,z.y)<P.R+20) z.life=Math.min(z.life,z.t);
    if(z.t>=z.life-0.02) f2SpikeGone(z); },
  out(z){ f2SpikeGone(z); },
  tall(z,list){ if(!z.it) z.it={x:z.x,y:z.y,draw:()=>f2DrawSpike(z)}; list.push(z.it); }
};
function f2SpikeGone(z){ if(z.gone) return; z.gone=true; z.done=true; if(z.col){ z.col.off=true; try{ removeCol(z.col); if(AREA&&AREA.cols){ const i=AREA.cols.indexOf(z.col); if(i>=0) AREA.cols.splice(i,1); } }catch(e){} } f2Shards(z.x,z.y-18,12); SFX.play('pop'); }
{ const base=bossFightEnd; bossFightEnd=function(instant){ for(const z of G.fz||[]) if(z.k==='f2spike'||z.k==='f2wall') try{ FZK[z.k].out(z); }catch(e){} return base(instant); }; }
function f2DrawSpike(z){ const x=z.x, y=z.y, up=clamp(z.t/0.15,0,1), h=(z.h||46)*up, oc=LOOK.sb?SBC.outline:'#2e4a6a', heat=clamp((z.heat||0)/0.4,0,1); ctx.save();
  ctx.fillStyle='rgba(30,50,90,.22)'; ctx.beginPath(); ctx.ellipse(x,y+3,15,6,0,0,TAU); ctx.fill();
  const spk=(dx,w,hh,c)=>{ ctx.beginPath(); ctx.moveTo(x+dx-w,y+2); ctx.lineTo(x+dx+w,y+2); ctx.lineTo(x+dx+w*0.15,y+2-hh); ctx.closePath(); ctx.fillStyle=c; ctx.fill(); ctx.lineWidth=1.6; ctx.strokeStyle=oc; ctx.stroke(); };
  spk(-7,6,h*0.6,'#b8def6'); spk(7,6,h*0.7,'#a8d2f0'); spk(0,8,h,heat>0.1?`rgb(${200+55*heat},${230},${250})`:'#d6eefc');
  ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(x-2,y-4); ctx.lineTo(x,y-h*0.8); ctx.stroke(); ctx.restore(); }
// f2roller: a big snowball rolling across a line (Glaciar's boulders, Grumbo's thrown ones); jump it, or pound it to burst
FZK.f2roller={
  tick(z,dt){ if(z.t<(z.wait||0)) return; const s=z.spd*dt; z.x+=Math.cos(z.ang)*s; z.y+=Math.sin(z.ang)*s; z.d=(z.d||0)+s; z.rot=(z.rot||0)+s/z.r;
    const p=player; if(!z.hitP&&!p.dead&&!f2Up()&&dist(p.x,p.y,z.x,z.y)<z.r+p.r*0.7){ z.hitP=true; hurtPlayer(z.dmg,z.x,z.y,300); }
    const P=f2Pounding(); if(P&&dist(P.x,P.y,z.x,z.y)<P.R+z.r){ z.done=true; f2Snow(z.x,z.y-z.r,26); ftext(z.x,z.y-z.r-14,S('POOF!','POOF!'),'#f4f8ff',14); SFX.play('pop'); return; }
    if(z.d>z.len||(z.t>0.2&&f2Solid(z.x+Math.cos(z.ang)*z.r,z.y+Math.sin(z.ang)*z.r))){ z.done=true; f2Snow(z.x,z.y-z.r,22); SFX.play('pop'); shake(3); } },
  drawG(z){ if(z.t>=(z.wait||0)) return; const k=clamp(z.t/(z.wait||1),0,1); ctx.save(); ctx.translate(z.x,z.y); ctx.rotate(z.ang); ctx.fillStyle=`rgba(${F2COL.red},${0.1+0.12*k})`; ctx.fillRect(0,-z.r,z.len,z.r*2); ctx.strokeStyle=`rgba(${F2COL.red},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.strokeRect(0,-z.r,z.len,z.r*2); ctx.restore(); },
  tall(z,list){ if(z.t<(z.wait||0)) return; if(!z.it) z.it={x:z.x,y:z.y,draw:()=>f2DrawSnowball(z.x,z.y,z.r,z.rot||0)}; z.it.x=z.x; z.it.y=z.y; list.push(z.it); }
};
function f2DrawSnowball(x,y,r,rot){ const oc=LOOK.sb?SBC.outline:'#3a4868'; ctx.save(); ctx.fillStyle='rgba(30,40,70,.22)'; ctx.beginPath(); ctx.ellipse(x,y+2,r*1.05,r*0.42,0,0,TAU); ctx.fill();
  ctx.fillStyle='#f4f8ff'; ctx.strokeStyle=oc; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y-r,r,0,TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#d6e4f4'; ctx.beginPath(); ctx.arc(x+r*0.15,y-r*0.8,r*0.82,0.2,2.6); ctx.fill();
  ctx.strokeStyle='rgba(150,180,215,.8)'; ctx.lineWidth=1.4; for(let i=0;i<3;i++){ const a=rot+i*2.1; ctx.beginPath(); ctx.arc(x+Math.cos(a)*r*0.5,y-r+Math.sin(a)*r*0.5,r*0.22,0,TAU); ctx.stroke(); }
  ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x-r*0.4,y-r*1.4,r*0.22,0,TAU); ctx.fill(); ctx.restore(); }
function f2Roller(x,y,ang,o){ return fzAdd('f2roller',Object.assign({x,y,ang,r:24,spd:330,len:700,dmg:12,wait:0.6},o)); }
// f2push: a gust cone that shoves Ash for a moment unless he shelters behind something (a pillar, a stone) or rides
FZK.f2push={
  tick(z,dt){ if(z.t<(z.wait||0)) return; const p=player; if(p.dead||(typeof P3!=='undefined'&&P3.ride)) return;
    const d=dist(z.x,z.y,p.x,p.y), a=angTo(z.x,z.y,p.x,p.y); if(d>z.len||Math.abs(angDiff(z.ang,a))>z.half) return;
    if(z.shelter&&z.shelter(p.x,p.y,z)) { if(!z.said){ z.said=true; ftext(p.x,p.y-40,S('Sheltered!','Safe!'),'#e8f6ff',12); } return; }
    const f=z.force*dt; p.kvx+=Math.cos(z.ang)*f; p.kvy+=Math.sin(z.ang)*f; if(AREA&&AREA.tri) AREA.tri.pushed=true;
    if(z.slow) p.slowT=Math.max(p.slowT||0,z.slow); if(!z.hitP&&z.dmg){ z.hitP=true; hurtPlayer(z.dmg,z.x,z.y,0); } },
  drawG(z){ const on=z.t>=(z.wait||0), k=on?1:clamp(z.t/(z.wait||1),0,1); ctx.save(); ctx.translate(z.x,z.y); ctx.rotate(z.ang);
    ctx.fillStyle=`rgba(${z.col||F2COL.snow},${on?0.16:0.08+0.08*k})`; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,z.len,-z.half,z.half); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=`rgba(${z.col||F2COL.snow},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.setLineDash(on?[]:[8,6]); ctx.stroke(); ctx.setLineDash([]);
    if(on){ ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=2.2; for(let i=0;i<6;i++){ const u=((z.t*1.6+i/6)%1), rr=z.len*u, aa=(i/5-0.5)*z.half*1.6; ctx.beginPath(); ctx.arc(0,0,rr,aa-0.08,aa+0.08); ctx.stroke(); } }
    ctx.restore(); }
};
function f2Push(x,y,ang,o){ return fzAdd('f2push',Object.assign({x,y,ang,len:420,half:0.5,force:2600,wait:0.8,life:1.6,col:F2COL.snow},o)); }

// ---------- 3. death: every Act III foe topples and fades for half a second; freed foes (a Rimehound whose frost burnt
// off, a Rime Knight out of his armour) shake their heads and run home instead (they count as beaten, full XP)
function f2Corpse(e){
  if(e.boss||!inView(e.x,e.y,120)) return;
  const c=Object.assign({},e,{dead:false,deathT:0,aggro:false,hp:e.maxHp,stun:0,tele:null,flash:0,spawnIn:0,elite:false,alpha:1});
  F2.corpses.push(c); if(F2.corpses.length>14) F2.corpses.shift();
}
// a freed foe: dizzy for a moment (stars), then it runs away from Ash and fades out (only drawn, never hit)
function f2Free(e,o){
  o=o||{}; if(e.dead) return; e.f2free=true; const a=angTo(player.x,player.y,e.x,e.y);
  const c=Object.assign({},e,{dead:false,deathT:null,aggro:false,stun:0,tele:null,flash:0,spawnIn:0,alpha:1,freed:true,state:'dizzy',st:0,mv:null,hp:e.maxHp,elite:false,lastHit:null,
    rt:0,dizzy:o.dizzy!=null?o.dizzy:1.2,runA:a+rand(-0.4,0.4),runS:(EDEF[e.type].speed||120)*1.3,line:o.line||null});
  F2.runners.push(c); if(F2.runners.length>10) F2.runners.shift();
  killEnemy(e);
  if(o.line) ftext(e.x,e.y-(e.r||14)-30,o.line,'#fff4dc',14);
}
{ const base=deathFx; deathFx=function(e){ if(e&&e.f2free){ f2Puff(e.x,e.y-10,'235,245,255',10); return; } return base(e); }; }
function f2FrameDeaths(dt){
  if(F2.corpses.length){ for(const c of F2.corpses) c.deathT+=dt; if(F2.corpses[0].deathT>0.7) F2.corpses=F2.corpses.filter(c=>c.deathT<0.7); }
  if(F2.runners.length){ for(const c of F2.runners){ c.rt+=dt; c.t=(c.t||0)+dt;
      if(c.rt<c.dizzy){ c.state='dizzy'; c.stun=1; c.dx=c.dy=0; }
      else { c.state='chase'; c.stun=0; c.aggro=false; c.blocking=false; const s=c.runS, nx=c.x+Math.cos(c.runA)*s*dt, ny=c.y+Math.sin(c.runA)*s*dt; if(!f2Solid(nx,ny)){ c.x=nx; c.y=ny; } else c.runA+=rand(1,2.4); c.dx=Math.cos(c.runA)*s; c.dy=Math.sin(c.runA)*s; c.face=c.runA; } }
    F2.runners=F2.runners.filter(c=>c.rt<c.dizzy+2.2); }
}
{ const base=eventsForRender; eventsForRender=function(list){ base(list);
    for(const c of F2.corpses){ if(!c._it) c._it={x:c.x,y:c.y,draw:()=>{ ctx.save(); ctx.globalAlpha=clamp(1-c.deathT/0.6,0,1); drawEnemy(c); ctx.restore(); }}; c._it.y=c.y; c._it.flying=!!c.flying; list.push(c._it); }
    for(const c of F2.runners){ if(!c._it) c._it={x:c.x,y:c.y,draw:()=>{ ctx.save(); ctx.globalAlpha=clamp((c.dizzy+2.2-c.rt)/0.6,0,1); drawEnemy(c);
        if(c.rt<c.dizzy) f2DrawStars(c.x,(c._t3top!=null?c._t3top:c.y-30)-6,c.t); else if(c.rt<c.dizzy+0.9){ ctx.fillStyle='#fff4dc'; ctx.strokeStyle=LOOK.sb?SBC.outline:'#2a2018'; ctx.lineWidth=3; ctx.font=`800 15px ${UIF}`; ctx.textAlign='center'; ctx.strokeText('?',c.x,(c._t3top||c.y-30)-6); ctx.fillText('?',c.x,(c._t3top||c.y-30)-6); }
        ctx.restore(); }}; c._it.x=c.x; c._it.y=c.y; list.push(c._it); }
    f2Tall(list); }; }
function f2DrawStars(x,y,t){ ctx.save(); for(let i=0;i<3;i++){ const a=t*4+i*TAU/3, sx=x+Math.cos(a)*12, sy=y+Math.sin(a)*4; ctx.fillStyle='#ffe066'; ctx.beginPath(); for(let j=0;j<5;j++){ const b=j*TAU/5-Math.PI/2, r=j%2?1.4:3.4; ctx.lineTo(sx+Math.cos(b)*3.4,sy+Math.sin(b)*3.4); ctx.lineTo(sx+Math.cos(b+TAU/10)*1.4,sy+Math.sin(b+TAU/10)*1.4); } ctx.closePath(); ctx.fill(); } ctx.restore(); }
{ const base=updateEnemies; updateEnemies=function(dt){ base(dt); f2Frame(dt); }; }
{ const base=newRun; newRun=function(mode){ base(mode); F2.area=null; F2.rooms=[]; F2.corpses=[]; F2.runners=[]; F2.pending=null; F2.frozenT=0; F2.sleepT=0; F2.hushT=0; F2.whiteT=0; F2.chill.length=0; F2.lift=null; try{ f2SitesReset(); }catch(e){} }; }

// ---------- 4. custom moves for the kit (FM)
// f2lunge: crouch (red line), then a lunge that leaves a streak of ice; on ice the lunge overshoots, and a wall bonks it
FM.f2lunge={
  start(e,m){ const o=m.o; e.state=o.st||'crouch'; e.st=fkW(o,0.42); e.tele=newTele({shape:'line',len:o.len||170,w:o.lw||e.r*1.7,dur:e.st,col:o.col||F2COL.red}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ if(e.st>0.12) e.face=turnTo(e.face,a,(o.track||5)*dt); e.st-=dt; if(e.st>0) return false; m.go=true; m.hit=false; e.tele=null; e.state=o.st2||'lunge'; m.ice=f2IceAt(e.x,e.y); e.st=m.T=(o.time||0.32)*(m.ice?1.8:1); m.tr=0; SFX.play('dash'); return false; }
    const s=(o.spd||520)*foeDiff().spd*(m.ice?1.15:1); e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
    if(!m.hit&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+6&&!f2Up()){ if(hurtPlayer(fkDmg(e,o),e.x,e.y,o.kb||220)) m.hit=true; }
    if(o.streak){ m.tr-=s*dt; if(m.tr<=0){ m.tr=34; f2IceAdd(e.x,e.y+4,20,o.streak,{a:0.85}); } }
    if(e.st<m.T-0.07&&foeBumped(e)){ if(m.ice||o.bonk){ f2Stun(e,o.bonk||1,S('BONK!','BONK!')); SFX.play('block'); } return true; }
    e.st-=dt; return e.st<=0; } };
// f2roll: curl (red line), then roll in a straight line, growing; hitting a wall or a rock bursts it (dizzy)
FM.f2roll={
  start(e,m){ const o=m.o; e.state=o.st||'curl'; e.st=fkW(o,0.6); e.tele=newTele({shape:'line',len:o.len||420,w:(o.lw||e.r*2.4),dur:e.st,col:o.col||F2COL.red}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player, r0=EDEF[e.type].r;
    if(!m.go){ if(e.st>0.15) e.face=turnTo(e.face,a,(o.track||5)*dt); e.st-=dt; if(e.st>0) return false; m.go=true; m.hit=false; e.tele=null; e.state=o.st2||'roll'; e.st=o.time||1.4; m.T=e.st; m.spd=o.spd0||180; SFX.play('roll'); return false; }
    m.spd=Math.min(o.spd||380,m.spd+(o.acc||260)*dt); e.r=Math.min(o.rmax||24,e.r+(o.grow||12)*dt);
    const s=m.spd*foeDiff().spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
    if(Math.random()<dt*14) emit(e.x-Math.cos(e.face)*e.r,e.y+e.r*0.5,1,{col:'245,250,255',glow:false,smin:10,smax:40,lmin:.3,lmax:.5,zmin:2,zmax:3.5,grow:4});
    if(!m.hit&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+2&&!f2Up()){ if(hurtPlayer(fkDmg(e,o)*(0.6+0.6*(e.r-r0)/Math.max(1,(o.rmax||24)-r0)),e.x,e.y,o.kb||260)) m.hit=true; }
    if(e.st<m.T-0.1&&foeBumped(e)){ m.burst=true; if(o.onBurst) o.onBurst(e,m); else { f2Snow(e.x,e.y-e.r,24); e.r=r0; f2Stun(e,o.dizzy||1.2,S('Bwaah!','Bwaah!')); } return true; }
    e.st-=dt; if(e.st<=0){ if(o.onEnd) o.onEnd(e,m); else e.r=r0; return true; } return false; } };
// f2charge: a long charge (red line that tracks until the last 0.2 s). onBump(e,m,what) where what is 'pillar' or 'wall'
FM.f2charge={
  start(e,m){ const o=m.o; e.state=o.st||'chargeAim'; e.st=f2W(o,0.8); m.T0=e.st; e.tele=newTele({shape:'line',len:o.len||520,w:o.lw||e.r*2,dur:e.st,col:o.col||F2COL.red}); SFX.play('warn'); if(o.onAim) o.onAim(e,m); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ if(e.st>0.2) e.face=turnTo(e.face,a,(o.track||4)*dt); e.st-=dt; if(e.tele) e.tele.dur=Math.max(e.tele.dur,0.01); if(e.st>0) return false; m.go=true; m.hit=false; e.tele=null; e.state=o.st2||'charge'; e.st=m.T=o.time||0.9; SFX.play('dash'); return false; }
    const s=(o.spd||600)*foeDiff().spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
    if(!m.hit&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+6&&!f2Up()){ if(hurtPlayer(fkDmg(e,o),e.x,e.y,o.kb||420)) m.hit=true; }
    if(Math.random()<dt*18) emit(e.x-Math.cos(e.face)*e.r,e.y+e.r*0.4,1,{col:o.dust||'220,225,235',glow:false,smin:10,smax:50,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6});
    const pil=f2PillarHit(e);
    if(e.st<m.T-0.07&&(pil||foeBumped(e))){ const what=pil||f2PillarAhead(e)?'pillar':'wall'; if(o.onBump){ o.onBump(e,m,what);
        // onBump may put him in a state of its own (stuck): keep it (the kit would set 'recover' after a finished move)
        if(e.state!==(o.st2||'charge')){ e.mv=null; e.tele=null; return false; } } else fkWallStun(e,o.stun||1.4); return true; }
    e.st-=dt; return e.st<=0; } };
// a raised drum pillar (or any closed cave gate) right in front of a charger
// a charger's head against a raised pillar (the cave slides it round the pillar's corner, so the stall test can miss it)
function f2PillarHit(e){ const A=AREA; if(!A||!A.p3) return false; for(const g of A.p3.gates){ if(g.g!=='pillar'||!g.closed) continue;
    if(dist(g.x,g.y,e.x,e.y)<e.r+(g.r||24)+8&&Math.abs(angDiff(e.face,angTo(e.x,e.y,g.x,g.y)))<0.9) return true; } return false; }
function f2PillarAhead(e){ const A=AREA; if(!A||!A.p3) return false; const fx=e.x+Math.cos(e.face)*(e.r+26), fy=e.y+Math.sin(e.face)*(e.r+26);
  for(const g of A.p3.gates){ if(g.g==='pillar'&&g.closed&&dist(g.x,g.y,fx,fy)<60) return true; } return false; }
// f2cone: a cone in front (frost gust, sleepy dust). hit(e) if Ash is inside when the wind-up ends; push makes it a gust
FM.f2cone={
  start(e,m){ const o=m.o; e.state=o.st||'breathW'; e.st=fkW(o,0.8); e.tele=newTele({shape:'cone',len:o.len||300,half:o.half||0.5,dur:e.st,col:o.col||F2COL.frost}); if(o.onAim) o.onAim(e,m); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ e.face=turnTo(e.face,a,(o.track||2.5)*dt); e.st-=dt; if(e.st>0) return false; m.go=true; e.tele=null; e.state=o.st2||'breath'; e.st=o.dur||0.45;
      const ox=e.x+Math.cos(e.face)*e.r*0.8, oy=e.y+Math.sin(e.face)*e.r*0.8; emit(ox,oy,24,{col:o.pcol||'235,245,255',glow:!!o.glow,ang:e.face,spread:o.half||0.5,smin:(o.len||300)*1.2,smax:(o.len||300)*1.7,lmin:.3,lmax:.5,zmin:3,zmax:6,grow:14,drag:1.4});
      if(o.push) f2Push(ox,oy,e.face,{len:o.len||300,half:o.half||0.5,force:o.push,wait:0,life:o.pushT||0.5,shelter:o.shelter,dmg:o.dmgN!=null?bdmg(o.dmgN):0,slow:o.slow});
      else if(inCone(ox,oy,e.face,o.len||300,o.half||0.5,p.x,p.y,p.r)&&!(typeof p2Shadowed==='function'&&p2Shadowed())){ if(o.dmg||o.dmgN!=null) hurtPlayer(fkDmg(e,o),ox,oy,60); if(o.hit) o.hit(e); } return false; }
    e.st-=dt; return e.st<=0; } };
// f2lob: throw things at Ash's spot (a marked landing circle from the start); land(e,x,y,z) when one lands
FM.f2lob={
  start(e,m){ const o=m.o; e.state=o.st||'cast'; e.st=fkW(o,0.55); m.n=typeof o.n==='function'?o.n(e):(o.n||1); },
  tick(e,dt,d,a,m){ const o=m.o, p=player; e.face=turnTo(e.face,a,6*dt); e.st-=dt; if(e.st>0) return false;
    for(let i=0;i<m.n;i++){ const sc=i?(o.scatter||90):0, q={x:p.x+rand(-sc,sc)+(p.vx||0)*0.15,y:p.y+rand(-sc,sc)+(p.vy||0)*0.15}; const C=f2Ctx(e); if(e.arena||C.A) f2Hold(C,q,30);
      f2Lob(e,q.x,q.y,{r:o.r||50,dur:f2W({},o.flight||1.0)+i*0.14,col:o.col,ball:o.ball,br:o.br,h:o.h,land:z=>o.land(e,z.x,z.y,z)}); }
    SFX.play(o.sfx||'cast'); return true; } };
// f2slam: a slam on a marked spot ahead (orange circle), then after(e,m) (a shock ring, a stuck tusk)
FM.f2slam={
  start(e,m){ const o=m.o, p=player, a=angTo(e.x,e.y,p.x,p.y), off=o.off!=null?o.off:e.r+40, C=f2Ctx(e); e.state=o.st||'slamW'; e.st=f2W(o,0.8); e.face=a;
    const q={x:e.x+Math.cos(a)*off,y:e.y+Math.sin(a)*off}; if(e.arena||C.A) f2Hold(C,q,20); m.x=q.x; m.y=q.y; m.z=f2Mark({x:q.x,y:q.y,r:o.r||60,dur:e.st,col:o.col||F2COL.orange}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player; e.face=turnTo(e.face,angTo(e.x,e.y,m.x,m.y),4*dt); e.st-=dt; if(e.st>0) return false;
    shake(o.shake||8); SFX.play('boom'); f2Snow(m.x,m.y,18);
    if(!p.dead&&!f2Up()&&dist(p.x,p.y,m.x,m.y)<(o.r||60)+p.r*0.6) hurtPlayer(fkDmg(e,o),m.x,m.y,o.kb||320);
    if(o.then) o.then(e,m); return true; } };
// f2combo: quick strikes in a row (arc telegraphs, one hit each)
function f2ComboNext(e,m,first){ const o=m.o; m.hit=false; e.state=o.st||'windup'; e.st=fkW(o,first?(o.windup||0.4):(o.windup2||(o.windup||0.4)*0.7)); e.tele=newTele({shape:'arc',r:o.reach||e.r+34,half:o.half||0.9,dur:e.st,col:o.col||F2COL.white}); }
FM.f2combo={
  start(e,m){ const o=m.o; m.i=0; m.n=typeof o.n==='function'?o.n(e):(o.n||2); f2ComboNext(e,m,true); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.hit){ e.face=turnTo(e.face,a,(o.track||4)*dt); e.st-=dt; if(e.st>0) return false; m.hit=true; e.tele=null; e.state=o.st2||'strike'; e.st=o.gap||0.16; e.swung=0.2; e.comboI=m.i;
      const L=o.lunge!=null?o.lunge:140; e.vx+=Math.cos(e.face)*L; e.vy+=Math.sin(e.face)*L;
      if(inCone(e.x,e.y,e.face,(o.reach||e.r+34)+2,(o.half||0.9)+0.1,p.x,p.y,p.r)&&!(o.ground&&f2Up())) hurtPlayer(fkDmg(e,o),e.x,e.y,o.kb||200);
      SFX.play(o.sfx||'slash'); if(o.onHit) o.onHit(e,m.i); return false; }
    e.st-=dt; if(e.st>0) return false; if(++m.i>=m.n) return true; f2ComboNext(e,m,false); return false; } };
// f2spots: marked circles around Ash that go off together (icicle rain, dust clouds); place(e,x,y,i) for each
FM.f2spots={
  start(e,m){ const o=m.o, p=player, C=f2Ctx(e); e.state=o.st||'cast'; e.st=f2W(o,o.windup||1.0); const n=typeof o.n==='function'?o.n(e):(o.n||3);
    m.pts=[]; for(let i=0;i<n;i++){ const a=i===0?0:rand(0,TAU), r=i===0?0:rand(o.r0||60,o.r1||200), q={x:p.x+Math.cos(a)*r+(i===0?(p.vx||0)*0.2:0),y:p.y+Math.sin(a)*r+(i===0?(p.vy||0)*0.2:0)}; if(e.arena||C.A||e.f2ctx) f2Hold(C,q,30); m.pts.push(q);
      f2Mark({x:q.x,y:q.y,r:o.r||50,dur:e.st+i*(o.stagger||0),col:o.col||F2COL.frost,drop:!!o.drop,fire:z=>o.place(e,z.x,z.y,i,z)}); }
    if(o.onStart) o.onStart(e,m); },
  tick(e,dt,d,a,m){ e.face=turnTo(e.face,a,3*dt); e.st-=dt; return e.st<=0; } };
Object.assign(FM_DEF,{f2lunge:{recover:0.6},f2roll:{recover:0.5},f2charge:{recover:0.7},f2cone:{recover:0.5},f2lob:{recover:0.5},f2slam:{recover:0.6},f2combo:{recover:0.5},f2spots:{recover:0.45}});

// ---------- 5. small drawing helpers shared by the figures
const F2OL=()=>LOOK.sb?SBC.outline:'#1e2232';
function f2Eye(x,y,z,r,col,bias){ foD(x,y,z,r,col||'#ffffff',bias||0.03); foD(x+r*0.25,y,z+r*0.12,r*0.5,'#1e1428',(bias||0.03)+0.01); foD(x+r*0.3,y-r*0.22,z+r*0.45,r*0.22,'#ffffff',(bias||0.03)+0.02); }
// a glowing eye (moth-struck violet, or freed gold)
function f2Glow(x,y,z,r,col,a){ foD(x,y,z,r,col,0.03); foD(x+r*0.2,y-r*0.2,z+r*0.3,r*0.4,'#ffffff',0.05); if(a>0) foGlow(x,y,z,r*3.6,hexRGB(col).join(','),a,true); }
// a small cluster of ice crystals (moth-frost on armour, frost on a hound's back)
function f2Crystals(x,y,z,s,n,col,col2){ for(let i=0;i<n;i++){ const a=i*2.4, dx=Math.cos(a)*s*0.5, dy=Math.sin(a)*s*0.5; foC(x+dx,y+dy,z,x+dx*1.4+s*0.1,y+dy*1.4,z+s*(0.9+((i*7)%3)*0.25),s*0.28,i%2?col:(col2||col),0.03); } }
// 2D: a shaded ellipse with an outline (Classic look)
function f2E2(x,y,rx,ry,col,rot,lw){ ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot||0,0,TAU); ctx.fill(); if(lw!==0){ ctx.strokeStyle=F2OL(); ctx.lineWidth=lw||1.6; ctx.stroke(); } }
function f2Shadow2(e,k){ ctx.fillStyle='rgba(20,30,60,.25)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+e.r*0.5,e.r*(k||1.1),e.r*0.45,0,0,TAU); ctx.fill(); }
function f2Eye2(x,y,r,f,col){ ctx.fillStyle=col||'#fff'; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); ctx.fillStyle='#1a1028'; ctx.beginPath(); ctx.arc(x+Math.cos(f)*r*0.35,y+Math.sin(f)*r*0.35,r*0.5,0,TAU); ctx.fill(); }
// rows for __eb.foeSheet: idle, walk, wind-up, attack, hurt, death (plus any extra rows); `at` is how long it has been in
// that state (poses that read foSt(e))
function f2Sheet(rows){ for(const r of rows) if(r.at!=null){ const a=r.at; Object.defineProperty(r,'_sT',{get(){ return (G?G.time:0)-a; },enumerable:true}); } return rows; }
function f2Rows(w,a,extra){ const now=()=>G?G.time:0; return f2Sheet([{state:'chase',label:'idle'},{state:'chase',dx:60,label:'walk'},Object.assign({label:'windup',at:0.45},w),Object.assign({label:'attack'},a),{state:'chase',get lastHit(){ return now()-0.05; },label:'hurt'},{state:'chase',deathT:0.3,label:'death'}].concat(extra||[])); }
// heat a part of a foe with the blue jet (or any fire with any:true); returns true the frame it is done
function f2Heat(e,key,dt,need,o){ o=o||{}; e[key]=(e[key]||0)+dt; e[key+'T']=G.time; f2Work(); if(Math.random()<0.5) emit(e.x+rand(-e.r,e.r)*0.6,e.y-e.r-rand(0,10),1,{col:'235,248,255',glow:false,ang:-Math.PI/2,spread:0.8,smin:15,smax:50,lmin:.5,lmax:.9,zmin:3,zmax:6,grow:8,drag:1,alpha:0.55});
  if(e[key]>=f2Need(need)){ e[key]=0; return true; } return false; }
// heat that is not kept up cools off slowly (so short bursts still add up)
function f2Cool(e,key,dt){ if(e[key]>0&&G.time-(e[key+'T']||0)>1.2) e[key]=Math.max(0,e[key]-dt*0.5); }

// ================= 6. the foes of Frostreach (level 1 numbers; spawn them at the region's level)
// the beast figures (wolves, bats) draw into ctx: on a foe sheet they go to the sheet canvas instead
{ const base=t3Begin; t3Begin=function(x,y,face,o){ if(FO.g&&!(o&&o.g)) o=Object.assign({},o||{},{g:FO.g}); return base(x,y,face,o); }; }
// ---------- Rimehound: a snow wolf with violet eyes (moth-struck). Packs circle and lunge; each lunge leaves a streak of
// ice; on ice it overshoots and bonks into walls. Blaze 1 s burns the frost off: it shakes its head, its eyes go gold,
// and it runs home (counts as beaten, full XP). Jump the lunge.
if(typeof WPAL!=='undefined') WPAL.f_rime={fur:'#dde6f2',saddle:'#a6b4dc',lite:'#ffffff',dark:'#66709e',paw:'#565f8c',nose:'#2a2440',ear:'#b8a6d8',tail:'#c4d0ec',crest:'#c8b8ff'};
f2Foe('f_rimehound',{name:'Rimehound',r:14,hp:70,speed:190,dmg:10,value:34,kbRes:0.9,dcol:'215,225,250',
  ai:FK.brain({move:'orbit',orbit:125,spin:1.4,faceMove:true,turn:7,cd:[1.0,2.0],recoverMove:0.45,
    pre(e,dt){ if(!e.howled&&e.aggro){ e.howled=true; e.state='howl'; e.st=0.5; SFX.play('howl'); try{ alertCamp(e); }catch(err){} for(const q of G.enemies) if(!q.dead&&q.type==='f_rimehound'&&!q.aggro&&dist(q.x,q.y,e.x,e.y)<520){ q.aggro=true; q.howled=true; } }
      if(e.state==='howl'){ e.dx=e.dy=0; e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.3,0.8); } return true; } f2Cool(e,'frostH',dt); },
    moves:[{k:'f2lunge',max:220,len:170,spd:520,time:0.32,windup:0.42,streak:2,dmg:1,w:3}]}),
  init(e){ f2Ice(e); },
  onBlaze(e,dt){ if(f2Heat(e,'frostH',dt,1.0)){ SFX.play('shrine'); f2Free(e,{dizzy:1.5,line:S('Arf? ...Arf!','Arf?')}); } },
  onDeath(e){ if(!e.f2free) f2Corpse(e); },
  draw3d:f2FigHound, draw2d:f2Hound2,
  sheet:f2Rows({state:'crouch',st:0.2},{state:'lunge'},[{state:'howl',label:'howl'},{state:'dizzy',freed:true,stun:1,label:'freed (dizzy)'},{state:'chase',freed:true,dx:120,label:'freed (runs)'}])});
function f2FigHound(e,fl){
  if(typeof b3Wolf!=='function'){ f2Hound2(e,fl); return; }
  const freed=!!e.freed, pal=WPAL.f_rime, k=e.r/13, v=b3Motion(e,0.085,16), Tg=b3Tgt(), t=G.time, st=e.state;
  Tg.bound=v>150?1:0; Tg.pant=v>60&&(e.aggro||freed)?0.6:0; Tg.m=Tg.pant?0.22+Math.max(0,Math.sin(t*10))*0.2:0;
  if(e.stun>0||st==='dizzy'){ Tg.daze=1; Tg.ears=1; Tg.n=0.25; Tg.m=0.15; }
  else if(st==='howl'){ Tg.h=1; Tg.m=1; }
  else if(st==='crouch'){ Tg.c=1; Tg.ears=1; Tg.tu=-0.5; Tg.m=0.3; Tg.pant=0; }
  else if(st==='lunge'){ Tg.l=1; Tg.m=1; Tg.ears=0.85; Tg.tu=0.1; Tg.bound=1; }
  else if(st==='recover'){ Tg.ears=0.3; }
  const Sx=b3S(e), face=t3Turn(e,e.face,13), X=e.x, Y=e.y+e.r*0.45;
  const P=b3WP(k,pal,freed?'#ffd84a':'#c69cff',freed?null:'190,140,255',false,freed); P.glowA=0.8; P.crest=!freed;
  b3Wolf(e,P,Sx,face,X,Y,0,fl);
  b3WolfFx(Sx,P,k);
  // the moth-frost glitter over its back (gone once it is freed)
  if(!freed&&!fl&&G.particles&&Math.random()<0.2) emit(X+rand(-10,10)*k,Y-rand(12,22)*k,1,{col:'210,190,255',glow:true,ang:-Math.PI/2,spread:1,smin:5,smax:20,lmin:.3,lmax:.6,zmin:1,zmax:1.8,rise:10});
  e._t3top=Y-(26+Sx.l*3.4-Sx.s*1)*k*T3.st;
}
function f2Hound2(e,fl){
  const x=e.x, y=e.y, r=e.r, f=e.face, fur=fl?'#fff':'#dde6f2', dk='#66709e', cr=e.state==='crouch', lu=e.state==='lunge';
  ctx.save(); f2Shadow2(e,1.15); ctx.translate(x,y); ctx.rotate(f); const s=cr?0.9:lu?1.15:1; ctx.scale(s,1/s);
  ctx.strokeStyle=dk; ctx.lineWidth=3; ctx.lineCap='round'; for(const sd of [-1,1]) for(const lx of [-6,6]){ ctx.beginPath(); ctx.moveTo(lx,sd*4); ctx.lineTo(lx+Math.sin((e.t||0)*14+lx)*3,sd*9); ctx.stroke(); }
  ctx.fillStyle=e.freed?'#c4d0ec':'#c8b8ff'; ctx.beginPath(); ctx.moveTo(-r*0.9,0); ctx.quadraticCurveTo(-r*1.7,Math.sin((e.t||0)*6)*5,-r*1.8,0); ctx.lineTo(-r*0.9,3); ctx.fill();
  f2E2(-1,0,r*0.95,r*0.55,fur); f2E2(r*0.75,0,r*0.5,r*0.45,fur,0,1.4); ctx.fillStyle='#2a2440'; ctx.beginPath(); ctx.arc(r*1.22,0,2,0,TAU); ctx.fill();
  for(const sd of [-1,1]){ ctx.fillStyle=dk; ctx.beginPath(); ctx.moveTo(r*0.6,sd*3); ctx.lineTo(r*0.35,sd*(r*0.7)); ctx.lineTo(r*0.85,sd*4); ctx.fill(); f2Eye2(r*0.9,sd*3.4,1.9,0,e.freed?'#ffd84a':'#d0b0ff'); }
  if(!e.freed){ ctx.fillStyle='#c8b8ff'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-r*0.5+i*5,-2); ctx.lineTo(-r*0.4+i*5,-r*0.7); ctx.lineTo(-r*0.3+i*5,-1); ctx.fill(); } }
  ctx.restore();
}

// ---------- Snowgob: a giggling goblin made of snow (carrot nose, coal eyes). Walks close, then curls up and ROLLS at
// Ash in a straight line, growing and speeding up; a wall or rock bursts it into a dizzy Snowgob. Blaze (or plenty of
// normal fire) melts it into an angry little puddle that reforms in 12 s, unless you hit the puddle.
f2Foe('f_snowgob',{name:'Snowgob',r:11,hp:40,speed:120,dmg:9,value:18,kbRes:1.2,dcol:'240,246,255',
  ai:FK.brain({move:'approach',stop:24,turn:8,cd:[0.6,1.3],recoverMove:0.4,
    pre(e,dt){ f2Cool(e,'meltH',dt); e.giggle=(e.giggle||rand(2,5))-dt; if(e.giggle<=0){ e.giggle=rand(4,8); if(inView(e.x,e.y,0)&&e.aggro) ftext(e.x,e.y-26,pick([S('hee hee!','hee hee!'),S('tee hee!','tee hee!'),S('snow way!','snow way!')]),'#f4f8ff',11); }
      if(e.state==='puddle'){ e.dx=e.dy=0; e.r=EDEF.f_snowgob.r; e.puddleT-=dt; if(e.puddleT<=0){ e.state='reform'; e.st=0.7; f2Snow(e.x,e.y,14); } return true; }
      if(e.state==='reform'){ e.dx=e.dy=0; e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=0.6; e.meltF=0; } return true; } },
    moves:[{k:'slash',reach:26,half:0.9,windup:0.35,lunge:160,dmg:0.8,col:F2COL.white,w:2,recover:0.45},
           {k:'f2roll',min:90,max:280,len:440,windup:0.6,spd0:170,spd:380,acc:300,grow:12,rmax:24,time:1.5,dizzy:1.2,dmg:1,w:3,every:2.5}]}),
  init(e){ f2Ice(e); e.meltF=0; },
  onBlaze(e,dt){ if(e.state==='puddle'||e.state==='reform') return; if(f2Heat(e,'meltH',dt,0.5)) f2Puddle(e); },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(e.state==='puddle'||e.state==='reform'){ if(h.fire) return false; f2Snow(e.x,e.y,10); emit(e.x,e.y,12,{col:'150,200,240',glow:false,smin:40,smax:140,lmin:.2,lmax:.45,zmin:1.2,zmax:2.4}); ftext(e.x,e.y-20,S('Splash!','Splash!'),'#bfe6ff',12); return e.hp+1; }
    if(h.fire&&o.src==='fire'){ e.meltF=(e.meltF||0)+0.1; if(e.meltF>=1.6){ f2Puddle(e); return false; } }
    if(e.state==='roll'&&o.src!=='slam') return amt*0.5; },
  onPound(e,info){ if(e.state==='roll'&&info.d<info.R+e.r){ e.mv=null; f2Snow(e.x,e.y-e.r,22); e.r=EDEF.f_snowgob.r; f2Stun(e,1.6,S('Bwaah!','Bwaah!')); } },
  onDeath(e){ f2Corpse(e); f2Snow(e.x,e.y-8,16); },
  draw3d:f2FigGob, draw2d:f2Gob2,
  sheet:f2Rows({state:'windup',st:0.15},{state:'strike'},[{state:'curl',st:0.3,at:0.3,label:'curl'},{state:'roll',r:20,dx:300,label:'roll'},{state:'dizzy',stun:1,label:'dizzy'},{state:'puddle',puddleT:6,label:'puddle'}])});
function f2Puddle(e){ e.mv=null; e.tele=null; e.state='puddle'; e.puddleT=12; e.r=EDEF.f_snowgob.r; e.meltF=0; SFX.play('pop'); emit(e.x,e.y,14,{col:'190,225,250',glow:false,smin:30,smax:120,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); ftext(e.x,e.y-24,S('Grrr... drip.','Drip! Grrr.'),'#cfeaff',12); }
function f2FigGob(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, r0=EDEF.f_snowgob.r, k=r0/11, face=t3Turn(e,e.face,12), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const sn=fl?'#ffffff':foT(e,'#f2f6fc'), snD=foT(e,'#c8d6ea'), coal='#2a2630', carrot='#ff8a3a', dead=foDeath(e), hurt=f2Hurt(e), mv=foWalk(e,dt,5*k), w=e._wp||0;
  foBegin(fx,fy,face,k,fl,0);
  if(st==='puddle'||st==='reform'){ const up=st==='reform'?f2Sm(clamp(inS/0.7,0,1)):0, wob=Math.sin(t*3)*0.4;
    foE(0,0,0.8+up*6,11-up*3,10-up*3,1.4+up*6,'#b8dcf4'); foE(-1,-1,1.6+up*6,6,5,0.8,'#e0f2ff',0,0,0,0.02);
    for(const sd of [-1,1]){ foD(2.5,sd*2.6,2.4+up*9,1.3,coal,0.04); foN(1.4,sd*1.3,3.8+up*9,3.6,sd*3.6,3.2+up*9,0.5,coal,0.05); }
    foC(4.5,0,2.2+up*8,8.5+wob,0,2.6+up*8,1.2,carrot,0.03); foEnd(4); e._t3top=foTop(fy,8+up*14,k); return; }
  if(st==='roll'||st==='curl'){ const c=st==='curl'?f2Sm(clamp(inS/0.5,0,1)):1, R=lerp(8,(e.r/r0)*8.5,c), rl=e._rl=(e._rl||0)+dt*(st==='roll'?Math.hypot(e.dx||0,e.dy||0)/(R*k):1);
    if(c<1){ foE(0,0,8,8*(1-c)+R*c,8*(1-c)+R*c,8,sn); }
    foB(0,0,R,R,sn); for(let i=0;i<3;i++){ const a=rl+i*2.09, cx=Math.cos(a)*R, cz=Math.sin(a)*R; foD(cx*0.98,-R*0.3,R+cz*0.98,R*0.18,snD,0.03); }
    const a=rl+0.5; foC(Math.cos(a)*R*0.9,0,R+Math.sin(a)*R*0.9,Math.cos(a)*(R+5),0,R+Math.sin(a)*(R+5),1.3,carrot,0.04);
    for(const sd of [-1,1]) foD(Math.cos(a+0.35)*R*1.0,sd*R*0.25,R+Math.sin(a+0.35)*R*1.0,R*0.12,coal,0.05);
    foEnd(R); e._t3top=foTop(fy,R*2+2,k); return; }
  if(dead) foSet(FOB,0,0,dead*1.5,0,0,0,-dead*3); else if(e.stun>0||st==='dizzy') foSet(FOB,0,0,Math.sin(t*7)*0.22,0);
  let arm=0, lean=0; if(st==='windup'){ const q=f2Sm(clamp(1-e.st/0.35,0,1)); arm=q; lean=-0.18*q; } else if(st==='strike'){ arm=-0.6; lean=0.25; }
  const P=foEase(e,'_fgb',foTg(arm,lean),dt,st==='strike'?24:12); arm=P[0]; lean=P[1];
  // feet: two little snow lumps that shuffle
  foLow(); for(const sd of [-1,1]){ const s=Math.sin(w+(sd>0?0:Math.PI))*mv*2; foE(s,sd*3.6,1.6,3.2,2.4,1.8,snD); }
  foUp(); foSet(FOA,6,lean-hurt*0.3,Math.sin(t*9)*0.05*mv,0,0,0,Math.abs(Math.sin(w))*mv*0.8);
  foB(0,0,7.2,6.6,sn); foE(0.5,0,5.6,5.2,5.4,3.6,snD,0,0,0,-0.02);
  for(let i=0;i<2;i++) foD(5.9,0,8.4-i*2.6,0.8,coal,0.04);
  // head with snowy goblin ears, coal eyes, a carrot nose and a giggle
  foB(0.6,0,14.6,5.2,sn);
  for(const sd of [-1,1]){ foC(-0.4,sd*4.2,15.6,-2.6,sd*9.4,18.6,1.9,sn); foC(0,sd*4.4,15.5,-2,sd*8.2,17.8,0.9,'#d8e4f4',0.02);
    foD(4.4,sd*2.1,16,1.15,coal,0.04); foD(4.85,sd*1.8,16.5,0.36,'#ffffff',0.06);
    foN(3.6,sd*0.9,17.9,4.2,sd*3.2,17.4+(e.aggro?0.8:0),0.55,coal,0.05); }
  foC(5,0,14.4,10.5,0,13.4+Math.sin(t*4)*0.3,1.4,carrot,0.03);
  for(let i=-1;i<=1;i++) foD(4.6,i*1.5,12+Math.abs(i)*0.5,0.45,coal,0.05);
  // stick arms
  for(const sd of [-1,1]){ const sw=sd>0?arm:0, ax=4+sw*6, az=9+sw*4+Math.sin(w+sd)*mv; foN(0.5,sd*5.4,9.4,ax,sd*(10-sw*3),az,0.75,'#7a5232',0.02); foN(ax,sd*(10-sw*3),az,ax+1.6,sd*(11.4-sw*3),az+1.6,0.5,'#7a5232',0.02); }
  foEnd(8); e._t3top=foTop(fy,21,k);
}
function f2Gob2(e,fl){
  const x=e.x, y=e.y, f=e.face, sn=fl?'#fff':'#f2f6fc'; ctx.save(); f2Shadow2(e,1);
  if(e.state==='puddle'){ f2E2(x,y+2,e.r*1.1,e.r*0.6,'#b8dcf4',0,1.4); for(const s of [-1,1]){ ctx.fillStyle='#2a2630'; ctx.beginPath(); ctx.arc(x+s*3,y,1.4,0,TAU); ctx.fill(); } ctx.fillStyle='#ff8a3a'; ctx.fillRect(x+4,y,6,2); ctx.restore(); return; }
  if(e.state==='roll'||e.state==='curl'){ f2E2(x,y-e.r*0.6,e.r,e.r,sn,0,1.8); ctx.beginPath(); ctx.moveTo(x+Math.cos(f)*e.r,y-e.r*0.6+Math.sin(f)*e.r); ctx.lineTo(x+Math.cos(f)*(e.r+6),y-e.r*0.6+Math.sin(f)*(e.r+6)); ctx.lineWidth=3; ctx.strokeStyle='#ff8a3a'; ctx.stroke(); ctx.restore(); return; }
  f2E2(x,y,e.r*0.8,e.r*0.7,sn,0,1.6); f2E2(x,y-e.r*0.9,e.r*0.62,e.r*0.6,sn,0,1.6);
  for(const s of [-1,1]){ ctx.fillStyle='#2a2630'; ctx.beginPath(); ctx.arc(x+Math.cos(f+s*0.5)*4,y-e.r*0.95+Math.sin(f+s*0.5)*3,1.5,0,TAU); ctx.fill(); }
  ctx.strokeStyle='#ff8a3a'; ctx.lineWidth=2.6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x+Math.cos(f)*4,y-e.r*0.85); ctx.lineTo(x+Math.cos(f)*11,y-e.r*0.8+Math.sin(f)*4); ctx.stroke(); ctx.restore();
}

// ---------- Frostshell Beetle: a beetle under a dome of blue ice. Its shell blocks hits from the front (x0.15); it turns
// slowly and makes short charges. A Ground Pound within 120 px (or a drum ring) flips it onto its back for 3 s (belly
// x2); the hammer flips it for 1.5 s; Blaze melts the shell for 4 s. Or hit it from behind.
f2Foe('f_frostshell',{name:'Frostshell Beetle',r:16,hp:90,speed:70,dmg:14,value:32,shield:true,kbRes:0.4,dcol:'160,205,240',
  ai:FK.brain({move:'approach',stop:40,turn:2,guard:true,cd:[0.9,1.6],recoverMove:0.25,
    pre(e,dt){ f2Cool(e,'shellH',dt);
      if(e.softT>0){ e.softT-=dt; e.shield=false; e.blocking=false; if(e.softT<=0){ e.shield=true; f2Txt(e,S('The ice shell grows back!','Shell back!'),'#dff4ff',12); } }
      if(e.flipT>0){ e.flipT-=dt; e.dx=e.dy=0; e.state='flipped'; e.st=0.2; e.shield=false; e.blocking=false; e.mv=null; e.tele=null; if(e.flipT<=0){ e.state='recover'; e.st=0.5; if(!(e.softT>0)&&!(e.p3shT>0)) e.shield=true; SFX.play('roll'); } return true; } },
    moves:[{k:'slash',reach:44,half:0.8,windup:0.5,lunge:120,dmg:1,col:F2COL.white,w:2,recover:0.7},
           {k:'f2charge',min:90,max:330,len:300,lw:30,windup:0.7,time:0.5,spd:620,dmg:1.1,w:1.6,every:3,track:3,onBump:(e,m)=>{ f2Stun(e,1.2,S('Clonk!','Clonk!')); }}]}),
  init(e){ f2Ice(e); },
  onPound(e,info){ if(e.dead) return; if(info.drum||info.d<120+e.r) f2Flip(e,3); },
  onBlaze(e,dt){ if(e.softT>0||e.flipT>0) return; if(f2Heat(e,'shellH',dt,0.8)){ e.softT=4; e.shield=false; e.blocking=false; SFX.play('pop'); f2Txt(e,S('Hsss! The shell melts!','Shell melts!'),'#cfeaff',13); f2Puff(e.x,e.y-14,'235,245,255',14); } },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(e.flipT>0) return amt*2;
    if(h.src==='hammer'){ f2Flip(e,1.5); return amt*1.2; } },
  onDeath(e){ f2Corpse(e); f2Shards(e.x,e.y-10,14); },
  draw3d:f2FigShell, draw2d:f2Shell2,
  sheet:f2Rows({state:'windup',st:0.25,blocking:true},{state:'strike'},[{state:'chargeAim',st:0.4,blocking:true,label:'charge aim'},{state:'charge',dx:400,label:'charge'},{state:'flipped',flipT:2,label:'flipped'},{state:'chase',softT:3,label:'shell melted'}])});
function f2Flip(e,t){ e.flipT=Math.max(e.flipT||0,f2Win(t)); e.mv=null; e.tele=null; e.shield=false; e.blocking=false; e.state='flipped'; SFX.play('block'); shake(4); f2Txt(e,S('Flipped! Hit its belly!','Flipped! Hit it!'),'#ffe066',14); }
function f2FigShell(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/16, face=t3Turn(e,e.face,st==='charge'?14:5), fx=e.x, fy=e.y+e.r*0.45;
  const body=fl?'#ffffff':foT(e,'#3a3e66'), bodyD=foT(e,'#262848'), leg='#22243e', soft=e.softT>0, ice=soft?'#5a7aa8':'#a8dcf6', iceD=soft?'#46608a':'#6eb0e0', iceL='#e6f6ff';
  const dead=foDeath(e), hurt=f2Hurt(e), sp=Math.hypot(e.dx||0,e.dy||0); e._wp=(e._wp||0)+dt*sp/(2.6*k); const mv=clamp(sp/50,0,1), flip=st==='flipped';
  foBegin(fx,fy,face,k,fl,0);
  if(flip){ foSet(FOB,10,0,Math.PI*0.94+Math.sin(t*5)*0.08,0,0,0,2); }
  else if(dead) foSet(FOB,0,0,dead*1.4,0,0,0,-dead*3);
  else if(e.stun>0) foSet(FOB,0,0,Math.sin(t*8)*0.12,0);
  // six legs (kicking in the air when flipped)
  foLow();
  for(const sd of [-1,1]) for(let i=0;i<3;i++){ const ph=e._wp+i*2.1+(sd>0?0:Math.PI)+(flip?t*14:0), lx=6-i*6, am=Math.max(mv,flip?1:0), o=Math.sin(ph)*(flip?2.4:2)*am, lift=Math.max(0,Math.cos(ph))*am*1.6;
    foL(lx,sd*8,5,lx+o*0.4,sd*14,7+lift,1.3,leg,1.1); foL(lx+o*0.4,sd*14,7+lift,lx+o,sd*16,0.6+lift*0.5,1.1,leg,0.7); }
  foUp(); if(!flip) foSet(FOA,6,-hurt*0.25+(st==='chargeAim'?-0.12:st==='charge'?0.1:0),0,0);
  let bite=0; if(st==='windup') bite=f2Sm(clamp(1-e.st/0.5,0,1)); else if(st==='strike') bite=-0.4;
  // the dark body and belly
  foE(0,0,6,13,10,5,bodyD); foE(1,0,5,11,8.6,4,flip?'#6a6ea8':body,0,0,0,0.01);
  if(flip) for(let i=0;i<4;i++) foN(-6+i*4,-6,4.4,-6+i*4,6,4.4,0.8,'#8a8ec8',0.05);
  // the ice dome: facets with a bright rim (soft and dark blue while melted)
  foE(-2,0,10,13.5,11.5,8.6,ice);
  foE(-3,-2.6,13.6,7,5.6,3.6,iceL,0,0,0,0.02);
  for(let i=0;i<5;i++){ const a=-1.2+i*0.6; foN(-2+Math.cos(a)*5,Math.sin(a)*4.6,17.6,-2+Math.cos(a)*12.6,Math.sin(a)*10.8,11,0.8,iceD,0.03); }
  if(!soft) f2Crystals(-5,0,17,4,3,'#c8b4ff','#e2dcff');
  else for(let i=0;i<3;i++) foD(-6+i*5,-4+i*4,8,1.2,'#9ac8f0',0.05);
  // head with mandibles
  foE(12,0,6.5,5,5.6,4,body);
  for(const sd of [-1,1]){ f2Glow(15.4,sd*2.6,8.4,1.2,'#c89cff',0.25); foC(15,sd*2.4,5,20+bite*3,sd*(1.6+bite*3),4.4,1.3,'#a8dcf6',0.02); foN(14,sd*1.6,10,19,sd*4,13+Math.sin(t*5+sd)*0.6,0.45,leg,0.03); }
  foEnd(8); e._t3top=foTop(fy,flip?16:20,k);
}
function f2Shell2(e,fl){
  const r=e.r, f=e.face, flip=e.state==='flipped'; ctx.save(); f2Shadow2(e,1.1); ctx.translate(e.x,e.y); ctx.rotate(f);
  ctx.strokeStyle='#22243e'; ctx.lineWidth=2.4; for(const s of [-1,1]) for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(4-i*6,s*6); ctx.lineTo(2-i*6+(flip?Math.sin((e.t||0)*14+i)*3:0),s*(r+3)); ctx.stroke(); }
  f2E2(r*0.7,0,r*0.36,r*0.36,fl?'#fff':'#3a3e66',0,1.4);
  if(flip) f2E2(0,0,r*0.8,r*0.65,'#6a6ea8',0,1.8); else { f2E2(-2,0,r*0.85,r*0.72,fl?'#fff':(e.softT>0?'#5a7aa8':'#a8dcf6'),0,2); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-5,-4,r*0.35,r*0.2,-0.4,0,TAU); ctx.fill(); }
  for(const s of [-1,1]){ ctx.fillStyle='#c89cff'; ctx.beginPath(); ctx.arc(r*0.85,s*2.6,1.5,0,TAU); ctx.fill(); }
  ctx.restore();
}

// ---------- Mothling: a fist-sized violet moth with a fluffy collar, in swarms. Every few seconds one of them puffs
// sleepy dust at Ash (a lilac circle: slow and yawns). When Ash breathes fire, every Mothling close by flies straight INTO
// the flame. A lit moth lamp pulls them away. Any hit kills one.
f2Foe('f_mothling',{name:'Mothling',r:8,hp:14,speed:160,dmg:5,value:6,flying:true,kbRes:1.5,dcol:'200,170,250',
  ai:f2MothAI, init(e){ e.orbitR=rand(70,110); e.wob=rand(0,TAU); },
  onHurt(e,amt,o){ return e.hp+1; },
  onDeath(e){ f2Corpse(e); emit(e.x,e.y-16,10,{col:'210,190,255',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); },
  draw3d:f2FigMoth, draw2d:f2Moth2,
  sheet:f2Sheet([{state:'chase',label:'idle'},{state:'chase',dx:120,label:'fly'},{state:'cast',st:0.3,at:0.3,label:'dust windup'},{state:'flame',dx:200,label:'into the fire'},{state:'lamp',label:'at a lamp'},{state:'chase',deathT:0.3,label:'death'}])});
// a lit lamp near a moth (Hush's lamp-braziers, a dungeon's moth lamps: anything in F2.lamps with lit, or a lit room lamp)
function f2LampNear(x,y,R){ let best=null, bd=R*R;
  for(const L of F2.lamps){ if(!L.lit||(AREA?!L.area||L.area!==AREA.id:(L.area||mapAt(L.y)!==curMap()))) continue; const d=dist2(x,y,L.x,L.y); if(d<bd){ bd=d; best=L; } }
  if(AREA) for(const o of AREA.objs){ if((o.k==='mlamp'||o.mlamp)&&o.lit){ const d=dist2(x,y,o.x,o.y); if(d<bd){ bd=d; best=o; } } }
  return best; }
function f2MothAI(e,dt,p){
  p=p||player; const D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0; e.cd-=dt*D.cdK; e.wob+=dt*6;
  if(e.state==='cast'){ e.st-=dt; e.face=turnTo(e.face,a,6*dt); if(e.st<=0){ e.state='chase'; e.cd=rand(1,2); } return; }
  // fire breath close by: it cannot help itself
  if(p.breathing&&d<300&&!e.noFlame){ const fx=p.x+Math.cos(p.facing)*90, fy=p.y+Math.sin(p.facing)*90; steer(e,fx,fy,e.speed*1.5*D.spd); e.face=turnTo(e.face,angTo(e.x,e.y,fx,fy),10*dt); e.state='flame'; return; }
  // a lit lamp pulls it away from Ash (for 8 s, or for as long as the lamp wants it: L.keep)
  const L=f2LampNear(e.x,e.y,400);
  if(L){ e.lampT=(e.lampT||0)+dt; if(e.lampT<8||L.keep){ e.state='lamp'; e.orbit+=dt*3*e.orbitDir; const R=34+Math.sin(e.wob)*8, ly=L.y-(L.h||0); steer(e,L.x+Math.cos(e.orbit)*R,ly+Math.sin(e.orbit)*R*0.6,e.speed); e.face=turnTo(e.face,Math.atan2(e.dy||0.01,e.dx||0.01),8*dt); if(L.onMoth) L.onMoth(L,e,dt); return; } }
  else e.lampT=0;
  e.state='chase';
  // a jittery swarm round Ash, darting in for a touch now and then
  if(e.dart>0){ e.dart-=dt; const s=380*D.spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s; if(!e.hitP&&d<e.r+p.r+4&&!f2Up()){ if(hurtPlayer(e.dmg,e.x,e.y,90)) e.hitP=true; } return; }
  e.orbit+=dt*2.6*e.orbitDir; const R=e.orbitR+Math.sin(e.t*5+e.id)*26; steer(e,p.x+Math.cos(e.orbit)*R+Math.sin(e.wob)*16,p.y+Math.sin(e.orbit)*R+Math.cos(e.wob*1.2)*12,e.speed*D.spd);
  e.face=turnTo(e.face,Math.atan2(e.dy||0.01,e.dx||0.01),9*dt);
  if(e.cd<=0&&d<170&&e.aggro){ e.cd=rand(1.6,3); e.face=a; e.dart=0.22; e.hitP=false; }
}
// the swarm's dust: every 4 s (Easy 5, Hard 3.4) the Mothling nearest Ash puffs a sleepy cloud at him
function f2MothDust(dt){
  F2.dustT=(F2.dustT==null?3:F2.dustT)-dt; if(F2.dustT>0) return; F2.dustT=byDiff(5,4,3.4);
  const p=player; if(!p||p.dead) return; let best=null, bd=300*300; for(const e of G.enemies){ if(e.dead||e.type!=='f_mothling'||!e.aggro||e.state!=='chase'||e.spawnIn>0) continue; const d=dist2(e.x,e.y,p.x,p.y); if(d<bd){ bd=d; best=e; } }
  if(!best) return; const e=best, T=fkW({},0.6); e.state='cast'; e.st=T+0.15; e.tele=null;
  f2Mark({x:p.x,y:p.y,r:50,dur:T,col:F2COL.dust,fire:z=>{ SFX.play('pop'); emit(z.x,z.y-10,16,{col:'225,210,255',smin:30,smax:110,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:6}); fzAdd('f2cloud',{x:z.x,y:z.y,r:50,life:2.2,sleep:2,k:0.4});
    if(!player.dead&&!f2Up()&&dist(player.x,player.y,z.x,z.y)<50+player.r*0.5) f2Sleep(2,0.4); }});
}
function f2FigMoth(e,fl){
  const t=e.t||0, st=e.state, k=e.r/8, face=t3Turn(e,e.face,14), z=12+Math.sin(t*7+(e.id||0))*2.5, fx=e.x, fy=e.y+e.r*0.3, dead=foDeath(e);
  const wing=fl?'#ffffff':foT(e,'#a888e0'), wingD=foT(e,'#7458b8'), fur='#f4eefc', body='#5a4688';
  const flap=st==='cast'?-0.2:Math.sin(t*(st==='flame'?40:28)+(e.id||0))*0.8+0.2, cast=st==='cast';
  foShadow(e.x,e.y+3,7*k,0.35);
  foBegin(fx,fy,face,k,fl,z);
  if(dead) foSet(FOB,0,0,dead*2,0,0,0,-dead*8);
  for(const sd of [-1,1]){ const th=cast?0.9:flap, c=Math.cos(th), s=Math.sin(th);
    foQ([1,sd*1.5,1.5, 3.5,sd*(1.5+6*c),1.5+6*s, -1,sd*(1.5+9*c),1.5+9*s, -5,sd*(1.5+5.5*c),1.5+5.5*s, -2,sd*1.4,1],wing,wingD,-0.05);
    foQ([-1,sd*1.3,1, -4,sd*(1.3+4*c),1+4*s-1, -6.5,sd*(1.3+2.4*c),1+2.4*s-1.4, -3,sd*1.2,0.4],wingD,null,-0.06);
    foD(-0.5,sd*(1.5+5*c),1.5+5*s+0.2,1.1,'#ece4ff',0.0); }
  foE(-1,0,0.6,3.6,1.6,1.6,body); foB(1.6,0,1.4,2.3,fur); foB(3.2,0,1.8,1.6,body);
  for(const sd of [-1,1]){ foD(4.3,sd*0.8,2.2,0.6,'#e2d0ff',0.04); foN(4.2,sd*0.6,3,6.6,sd*2.6,5.6,0.35,'#3a2a5a',0.02); }
  if(cast) foGlow(4,0,2,6,'225,210,255',0.6,false);
  foEnd(2); e._t3top=foTop(fy,6,k,z);
}
function f2Moth2(e,fl){ const x=e.x, y=e.y-14+Math.sin((e.t||0)*7)*2, f=e.face, fl2=Math.sin((e.t||0)*28)*0.6; ctx.save(); ctx.fillStyle='rgba(20,30,60,.2)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+3,6,2.5,0,0,TAU); ctx.fill(); ctx.translate(x,y); ctx.rotate(f);
  for(const s of [-1,1]) f2E2(-1,s*(5+fl2*2),5,3.6+fl2,fl?'#fff':'#a888e0',s*0.3,1.2); f2E2(0,0,3.4,1.8,'#5a4688',0,1); f2E2(2,0,2,2,'#f4eefc',0,0.8); ctx.restore(); }

// ---------- Stalagbat: hangs from a ceiling or rock arch looking exactly like an icicle (a tiny glint gives it away).
// When Ash passes under it, it drops (a shadow circle) and shatters into a bat that swoops. Blaze melts it while it
// hangs (it falls as a confused bat with 1 HP); an arrow knocks it down. Keep moving under ceilings.
f2Foe('f_stalagbat',{name:'Stalagbat',r:10,hp:30,speed:220,dmg:8,value:16,flying:true,kbRes:1.2,dcol:'200,230,250',
  ai:f2BatAI,
  init(e){ e.hang=true; e.hidden=true; e.hangZ=64; },
  idle(e,dt){ e.tele=null; e.dx=e.dy=0; if(!e.hang) steer(e,e.homeX,e.homeY,e.speed*0.6); },
  onBlaze(e,dt){ if(!e.hang) return; if(f2Heat(e,'meltH',dt,0.6)) f2BatDrop(e,'melt'); },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(e.hang){ if(h.ranged||o.src==='whip'||o.src==='bomb'||o.src==='glaive'||o.src==='icicle'){ f2BatDrop(e,'shot'); return amt; } if(!(e._hiT>G.time)){ e._hiT=G.time+1.5; ftext(e.x,e.y-(e.hangZ||64)-14,S('Too high! Shoot it down.','Too high!'),'#dff4ff',12); } return false; } },
  onDeath(e){ f2Corpse(e); f2Shards(e.x,e.y-16,10); },
  draw3d:f2FigBat, draw2d:f2Bat2,
  sheet:f2Sheet([{state:'hang',hang:true,hangZ:40,label:'hanging'},{state:'dropW',hang:true,hangZ:40,st:0.3,label:'about to drop'},{state:'chase',hang:false,label:'bat'},{state:'swoop',hang:false,dx:300,label:'swoop'},{state:'chase',hang:false,stun:1,label:'confused'},{state:'chase',hang:false,deathT:0.3,label:'death'}])});
function f2BatDrop(e,how){
  e.hang=false; e.hidden=false; e.state='chase'; e.tele=null; e.mv=null;
  if(how==='melt'){ e.hp=Math.min(e.hp,1); f2Stun(e,1.4,S('Drip... what?','Drip?')); f2Puff(e.x,e.y-40,'235,245,255',10); SFX.play('pop'); }
  else if(how==='shot'){ f2Stun(e,1.0,S('Knocked down!','Down it comes!')); f2Shards(e.x,e.y-30,10); }
}
function f2BatAI(e,dt,p){
  p=p||player; const d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), D=foeDiff(); e.dx=e.dy=0;
  if(e.hang){ e.face=0;
    if(e.state!=='dropW'){ e.state='hang'; if(d<72&&!p.dead){ e.state='dropW'; e.st=fkW({},0.6); f2Mark({x:e.x,y:e.y,r:34,dur:e.st,col:F2COL.frost,drop:true}); SFX.play('warn'); } return; }
    e.st-=dt; if(e.st>0) return;
    // the drop: it smashes down where it hung, then shatters into a bat
    e.hang=false; e.hidden=false; shake(4); SFX.play('block'); f2Shards(e.x,e.y,18);
    if(!p.dead&&!f2Up()&&dist(p.x,p.y,e.x,e.y)<34+p.r*0.5) hurtPlayer(e.dmg*2,e.x,e.y,200);
    e.state='recover'; e.st=0.5; e.cd=rand(0.8,1.4); return; }
  e.cd-=dt*D.cdK;
  if(e.state==='aim'){ e.st-=dt; e.face=turnTo(e.face,a,10*dt); if(e.st<=0){ e.tele=null; e.state='swoop'; e.st=0.34; e.hitP=false; SFX.play('dash'); } return; }
  if(e.state==='swoop'){ e.dx=Math.cos(e.face)*430*D.spd; e.dy=Math.sin(e.face)*430*D.spd; if(!e.hitP&&d<e.r+p.r+4&&!f2Up()){ if(hurtPlayer(e.dmg,e.x,e.y,120)) e.hitP=true; } e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(1,2.2); } return; }
  if(e.state==='recover'){ e.st-=dt; if(e.st<=0) e.state='chase'; return; }
  e.state='chase'; e.orbit+=dt*2.2*e.orbitDir; const rr=110+Math.sin(e.t*3)*34; steer(e,p.x+Math.cos(e.orbit)*rr,p.y+Math.sin(e.orbit)*rr,e.speed*D.spd);
  if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),8*dt);
  if(e.cd<=0&&d<260){ e.state='aim'; e.st=fkW({},0.28); e.face=a; e.tele=newTele({shape:'line',len:200,w:e.r*1.6,dur:e.st,col:F2COL.red}); }
}
function f2FigBat(e,fl){
  if(!e.hang){ if(T3E.bat){ const tn=e.tint; e.tint='ice'; T3E.bat(e,fl); e.tint=tn; } return; }
  // an icicle, up on the ceiling; the glint of an eye now and then; it shivers just before it drops
  const t=e.t||0, k=e.r/10, z=e.hangZ||64, sh=e.state==='dropW'?Math.sin(t*50)*0.08:0, fx=e.x, fy=e.y;
  foShadow(e.x,e.y+2,6*k,0.25);
  foBegin(fx,fy,sh,k,fl,z);
  foY(0,0,0,4.4,5,3,'#a8d2f0','#e6f6ff',0.02);
  foC(0,0,0.4,0,0,-15,4.2,'#cfeafc',0.01);
  foC(1.2,-1,-2,1.4,-1,-11,1.2,'#f4fbff',0.03);
  foC(-3,2,0.4,-3.4,2.4,-6,1.6,'#b8def6',-0.01); foC(3,1.6,0.4,3.2,2.2,-5,1.4,'#b8def6',-0.01);
  const gl=Math.sin(t*1.7+(e.id||0))>0.97||e.state==='dropW'; if(gl){ foD(2.6,-1,-3,0.9,'#ffffff',0.06); foD(2.6,1,-3,0.9,'#ffffff',0.06); }
  foEnd(-6); e._t3top=foTop(fy,4,k,z);
}
function f2Bat2(e,fl){
  if(e.hang){ const x=e.x, y=e.y-(e.hangZ||64)*0.7; ctx.save(); ctx.fillStyle='rgba(20,30,60,.18)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+2,6,2.5,0,0,TAU); ctx.fill(); ctx.fillStyle=fl?'#fff':'#cfeafc'; ctx.strokeStyle=F2OL(); ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x-5,y-10); ctx.lineTo(x+5,y-10); ctx.lineTo(x,y+14); ctx.closePath(); ctx.fill(); ctx.stroke(); if(e.state==='dropW'||Math.sin((e.t||0)*1.7)>0.97){ ctx.fillStyle='#fff'; ctx.fillRect(x-2,y-4,1.5,1.5); ctx.fillRect(x+1,y-4,1.5,1.5); } ctx.restore(); return; }
  const x=e.x, y=e.y-14, f=e.face, w=Math.sin((e.t||0)*20)*0.7; ctx.save(); ctx.translate(x,y); ctx.rotate(f); for(const s of [-1,1]) f2E2(-2,s*(7+w*2),7,3.6,fl?'#fff':'#8c9cbc',s*0.4,1.2); f2E2(0,0,4,3.4,'#7a8aa8',0,1.2); ctx.fillStyle='#bfe6ff'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(3,s*1.6,1.2,0,TAU); ctx.fill(); } ctx.restore();
}

// ---------- Rime Knight: a Hearthold soldier asleep inside moth-frost armour, walking for the Mother. Shielded heavy
// (a slow white arc swing). Every 8 s an Ice Stamp raises a short ice wall in front of him (blocks shots and the blue
// jet; Blaze melts it in 0.6 s). Blaze 2 s melts his armour right off: he wakes up, confused, and runs home (beaten, full
// XP, G.flags.f_freed_n). A Ground Pound next to him cracks his shield for 4 s; the hammer breaks his guard.
// the Ice Stamp: he stamps, and a short wall of ice grows between him and Ash
FM.f2stamp={
  start(e,m){ e.state='stampW'; e.st=fkW({},0.6); e.stampT=byDiff(10,8,6.5); const a=angTo(e.x,e.y,player.x,player.y); m.a=a; m.x=e.x+Math.cos(a)*72; m.y=e.y+Math.sin(a)*72;
    m.z=f2Mark({shape:'line',x:m.x-Math.cos(a+Math.PI/2)*72,y:m.y-Math.sin(a+Math.PI/2)*72,ang:a+Math.PI/2,len:144,w:30,dur:e.st,col:F2COL.frost}); },
  tick(e,dt,d,a,m){ e.st-=dt; if(e.st>0) return false; shake(5); SFX.play('block'); f2WallAdd(m.x,m.y,m.a+Math.PI/2,{n:4,life:10,owner:e}); return true; } };
FM_DEF.f2stamp={recover:0.6};
f2Foe('f_rimeknight',{name:'Rime Knight',r:19,hp:180,speed:70,dmg:17,value:60,shield:true,kbRes:0.3,dcol:'190,170,250',
  ai:FK.brain({move:'approach',stop:52,guard:true,turn:2,cd:[0.9,1.5],recoverMove:0.25,
    pre(e,dt){ f2Cool(e,'armorH',dt); if(e.gbT>0){ e.gbT-=dt; e.shield=false; e.blocking=false; if(e.gbT<=0&&!(e.p3shT>0)) e.shield=true; } e.stampT=(e.stampT==null?rand(3,6):e.stampT)-dt*foeDiff().atk; },
    moves:[{k:'slash',reach:64,half:0.95,windup:0.75,track:1.2,lunge:70,kb:320,dmg:1,recover:0.9,sfx:'hit',col:F2COL.white,w:3},
           {k:'f2stamp',min:110,max:420,w:e=>e.stampT<=0?6:0}]}),
  init(e){ f2Ice(e); },
  onBlaze(e,dt){ if(f2Heat(e,'armorH',dt,2.0)) f2KnightFree(e); },
  onHurt(e,amt,o){ const h=foeHit(e,o), front=Math.abs(angDiff(e.face,angTo(e.x,e.y,o.fx!=null?o.fx:player.x,o.fy!=null?o.fy:player.y)))<1.15;
    if(h.src==='hammer'&&e.shield&&e.blocking&&front){ e.gbT=4; e.shield=false; e.blocking=false; f2Stun(e,0.8,S('CRACK! Guard broken!','CRACK!')); f2Shards(e.x,e.y-20,16,'210,190,255'); return amt*1.2; } },
  onDeath(e){ if(!e.f2free) f2Corpse(e); },
  draw3d:f2FigKnight, draw2d:f2Knight2,
  sheet:f2Rows({state:'windup',st:0.35,blocking:true,shield:true},{state:'strike'},[{state:'stampW',st:0.3,at:0.3,label:'ice stamp'},{state:'chase',blocking:true,shield:true,label:'shield up'},{state:'chase',gbT:2,label:'guard broken'},{state:'dizzy',freed:true,stun:1,label:'freed'},{state:'chase',freed:true,dx:120,label:'freed (runs)'}])});
function f2KnightFree(e){ G.flags.f_freed_n=(G.flags.f_freed_n||0)+1; SFX.play('shrine'); f2Shards(e.x,e.y-20,26,'210,190,255');
  f2Free(e,{dizzy:1.6,line:pick([S(`Where's my lunch? Was there a lunch?`,'Where is my lunch?'),S(`Where's my lunch? I was promised a lunch!`,'I was promised lunch!'),S('Huh? Why am I so cold? Why is my helmet on backwards?','Why am I so cold?')])});
  try{ if(F2.hook.freed) F2.hook.freed(e); }catch(err){ console.error(err); } questPoke(); }
// f2wall: a short wall of ice blocks along a line (blocks walking, shots and the blue jet). Blaze melts it in 0.6 s.
FZK.f2wall={
  tick(z,dt){ if(!z.cols){ z.cols=[]; const A=AREA&&z.x>=IZX-50?AREA:null; for(const q of z.pts){ const c={t:'c',x:q.x,y:q.y,r:z.r||20,f2:true}; if(A) addAreaCol(c); else addCol(c); if(z.thin&&typeof p2Thin==='function') p2Thin(c); z.cols.push(c); } }
    let hot=false; for(const q of z.pts) if(f2Blue(q.x,q.y-12,z.r||20)){ hot=true; break; }
    if(hot){ z.heat=(z.heat||0)+dt; f2Work(); if(Math.random()<0.6) emit(z.x+rand(-30,30),z.y-rand(10,40),1,{col:'235,248,255',glow:false,ang:-Math.PI/2,spread:0.8,smin:15,smax:50,lmin:.5,lmax:.9,zmin:3,zmax:6,grow:8,drag:1,alpha:0.55}); if(z.heat>=f2Need(z.need||0.6)){ z.life=Math.min(z.life,z.t); SFX.play('pop'); ftext(z.x,z.y-56,S('Hssss!','Hsss!'),'#dff4ff',13); if(z.onMelt) z.onMelt(z); } }
    if(z.t>=z.life-0.02) f2WallGone(z); },
  out(z){ f2WallGone(z); },
  tall(z,list){ for(const q of z.pts){ if(!q.it) q.it={x:q.x,y:q.y,draw:()=>f2DrawIceBlock(q.x,q.y,clamp(z.t/0.25,0,1),(z.heat||0)/f2Need(z.need||0.6),z.vio,z.crack)}; list.push(q.it); } }
};
function f2WallAdd(x,y,ang,o){ o=o||{}; const n=o.n||3, sp=o.sp||38, pts=[]; for(let i=0;i<n;i++){ const u=(i-(n-1)/2)*sp; pts.push({x:x+Math.cos(ang)*u,y:y+Math.sin(ang)*u}); }
  f2Shards(x,y-10,16); return fzAdd('f2wall',Object.assign({x,y,pts,r:20,life:10,need:0.6},o)); }
function f2WallGone(z){ if(z.gone) return; z.gone=true; z.done=true; if(z.cols) for(const c of z.cols){ c.off=true; try{ removeCol(c); if(AREA&&AREA.cols){ const i=AREA.cols.indexOf(c); if(i>=0) AREA.cols.splice(i,1); } }catch(e){} } for(const q of z.pts) f2Shards(q.x,q.y-16,8); if(z.onGone) z.onGone(z); }
function f2DrawIceBlock(x,y,up,heat,vio,crack){ const h=40*f2Sm(up), oc=LOOK.sb?SBC.outline:'#2e4a6a', hk=clamp(heat||0,0,1); if(h<1) return; ctx.save();
  ctx.fillStyle='rgba(30,50,90,.22)'; ctx.beginPath(); ctx.ellipse(x,y+3,22,7,0,0,TAU); ctx.fill();
  ctx.fillStyle=vio?'#8a6ad0':'#5c9cd8'; rrect(ctx,x-19,y-h-6,38,h+8,6); ctx.fill();
  ctx.fillStyle=vio?'#c4b2f2':`rgb(${Math.round(169+70*hk)},${Math.round(218+20*hk)},244)`; rrect(ctx,x-19,y-h,36,h,5); ctx.fill();
  ctx.fillStyle=vio?'#e4dcfa':'#e2f4ff'; rrect(ctx,x-19,y-h-6,38,10,5); ctx.fill();
  ctx.strokeStyle=oc; ctx.lineWidth=1.8; rrect(ctx,x-19,y-h-6,38,h+8,6); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x-10,y-h+6); ctx.lineTo(x-4,y-h*0.4); ctx.stroke();
  if(crack){ ctx.strokeStyle='#2a1a40'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(x+2,y-h-4); ctx.lineTo(x-3,y-h*0.6); ctx.lineTo(x+3,y-h*0.35); ctx.lineTo(x-1,y+1); ctx.stroke(); }
  if(hk>0.05){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=hk*0.6; ctx.drawImage(foGlowSpr('255,200,150'),x-26,y-h-20,52,52); } ctx.restore(); }
// his look: a stocky soldier frozen inside violet moth-frost armour (crystal spikes, a crystal shield, a frosted sword),
// eyes shut and glowing violet: he is sleepwalking. Freed, he is a cold, cross soldier in a red Hearthold tabard.
function f2FigKnight(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/19, face=t3Turn(e,e.face,7), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e), dead=foDeath(e), hurt=f2Hurt(e), freed=!!e.freed;
  const arm=fl?'#ffffff':freed?'#8a8e98':foT(e,'#a99ad8'), armD=freed?'#5a5e68':foT(e,'#7462b4'), ice='#d6ccff', iceL='#f2eeff', tab=freed?'#c0403a':'#5a4a8c', skin='#e8b894', fur='#7a5a3a';
  const mv=foWalk(e,dt,6*k), w=e._wp||0, guard=e.blocking&&e.shield&&!freed;
  let sw=0, lean=0, stamp=0, raise=0;
  if(st==='windup'){ raise=f2Sm(clamp(1-e.st/0.75,0,1)); lean=-0.08*raise; } else if(st==='strike'){ sw=1; lean=0.2; } else if(st==='stampW'){ stamp=f2Sm(clamp(inS/0.5,0,1)); lean=-0.15*stamp; } else if(st==='recover'&&e._pst==='strike'&&inS<0.4){ sw=1; }
  const P=foEase(e,'_fkn',foTg(sw,lean,stamp,raise),dt,st==='strike'?24:11); sw=P[0]; lean=P[1]; stamp=P[2]; raise=P[3];
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,-1.2*dead,0.2*dead,0,-5*dead,0,0); else if(e.stun>0||st==='dizzy') foSet(FOB,0,0,Math.sin(t*6)*0.12,0);
  foLow();
  for(const sd of [-1,1]){ const s=Math.sin(w)*mv*sd, lift=Math.max(0,Math.cos(w)*sd)*mv*1.6+(sd>0?stamp*4:0);
    foL(0,sd*4,12,1.2+s*2.4,sd*4.6,7+lift*0.5,3.3,armD,3); foL(1.2+s*2.4,sd*4.6,7+lift*0.5,s*4.2,sd*4.8,2+lift,3,arm,2.8); foE(s*4.2+2,sd*4.8,1.8,4.4,3,2,'#4a3e6a'); }
  foUp(); foSet(FOA,12,lean-hurt*0.15,0,0,0,0,Math.abs(Math.cos(w))*mv*0.6);
  foY(0,0,9,8,7.4,5,armD,arm); foQ([7.2,-3,18, 7.2,3,18, 8,2.8,9, 8,-2.8,9],tab,null,0.4);
  foE(0.5,0,20,7.4,9,7.6,freed?'#c0403a':arm); foN(7.6,0,25,7.8,0,15,1,freed?'#8a2a24':armD,0.05); if(freed) foN(7.7,-4,22,7.7,4,22,1.4,'#e8c860',0.06);
  if(!freed){ f2Crystals(-1,-8,27,5,3,ice,iceL); f2Crystals(-1,8,27,5,3,ice,iceL); f2Crystals(-4,0,25,4,2,ice); }
  for(const sd of [-1,1]) foB(-0.2,sd*9.4,26,5,arm);
  // sword arm (the right): a frosted short sword
  { const ba=1.05+raise*0.9-sw*1.75+stamp*0.3, hx=6+sw*10-raise*4, hy=9-sw*6, hz=17+raise*16+stamp*10, bx=Math.cos(ba), bz=Math.sin(ba);
    foL(0,9,25,(hx)/2,10.5,(25+hz)/2,2.7,armD,2.5); foL(hx/2,10.5,(25+hz)/2,hx,hy,hz,2.5,arm,2.3); foB(hx,hy,hz,2.4,armD);
    foL(hx,hy,hz,hx+bx*24,hy-sw*4,hz+bz*24,1.4,freed?'#c9ced6':'#e2f2ff',0.9,0.02); foC(hx+bx*24,hy-sw*4,hz+bz*24,hx+bx*28,hy-sw*4,hz+bz*28,1.2,'#ffffff',0.03); foN(hx-1,hy-3,hz,hx-1,hy+3,hz,1.2,'#7a5a3a',0.03); }
  // shield arm (the left): a round shield crusted with violet ice
  { const cx=guard?11:7, cy=guard?-6:-11, cz=guard?20:15+stamp*10;
    foL(0,-9,25,(cx)/2,-10.5,(25+cz)/2,2.7,armD,2.5); foL(cx/2,-10.5,(25+cz)/2,cx-2,cy,cz,2.5,arm,2.3);
    if(!(e.gbT>0)&&!(e.p3shT>0)&&!freed){ foE(cx,cy,cz,2.6,10,10,'#8a78d0',0,guard?0:-0.6); foE(cx+1,cy,cz,1.6,8,8,ice,0,guard?0:-0.6,0,0.02); f2Crystals(cx+2,cy,cz+6,4,2,iceL,ice); }
    else if(!freed){ foE(cx,cy,cz,2.2,8,8,'#6a5a9a',0,-0.6); for(let i=0;i<3;i++) foN(cx+2.4,cy-5+i*5,cz+5,cx+2.4,cy-3+i*5,cz-5,0.8,'#2a1a40',0.05); }
    else foE(cx,cy,cz,2.2,8.4,8.4,'#a87a4a',0,-0.6); }
  // head: a round helm with a nose guard, a fur trim; asleep (violet slits) or awake and cross
  foB(1.2,0,31.4,5.4,skin); foE(-0.8,0,34.8,6,6.6,4.4,arm); foY(-0.6,0,31.8,6.4,6.8,2.4,fur,null,0.02); foL(5.4,0,36.4,6.6,0,31.2,0.9,armD,0.8,0.05);
  for(const sd of [-1,1]){ if(freed){ f2Eye(5.2,sd*2.2,31.4,1.05,'#ffffff'); foN(4.4,sd*1.2,33.4,5.6,sd*3.2,33.1,0.5,'#5a3a20',0.06); } else { foN(4.8,sd*1.2,31.4,5.4,sd*3.2,31.6,0.7,'#d6c0ff',0.06); foGlow(5.4,sd*2.2,31.5,3,'190,150,255',0.5,true); } }
  if(!freed){ f2Crystals(0,0,38.6,4.6,4,ice,iceL); foC(-1,-4,37,-3,-6,42,1.2,iceL,0.02); }
  else foN(5.4,-1.4,29,5.6,1.4,28.6,0.5,'#8a4a3a',0.06);
  foEnd(20); e._t3top=foTop(fy,freed?38:43,k);
}
function f2Knight2(e,fl){ const r=e.r, f=e.face, fr=!!e.freed, guard=e.blocking&&e.shield&&!fr; ctx.save(); f2Shadow2(e,1.1); ctx.translate(e.x,e.y); ctx.rotate(f);
  f2E2(0,0,r*0.62,r*0.72,fl?'#fff':fr?'#8a8e98':'#a99ad8',0,2); f2E2(0,0,r*0.36,r*0.4,fr?'#c0403a':'#5a4a8c',0,1);
  ctx.strokeStyle='#e2f2ff'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(4,r*0.55); ctx.lineTo(r*1.3,r*0.6); ctx.stroke();
  if(!fr) f2E2(guard?r*0.75:r*0.4,guard?-4:-r*0.75,4,r*0.62,(e.gbT>0||e.p3shT>0)?'#6a5a9a':'#d6ccff',0,1.6);
  f2E2(r*0.2,0,r*0.42,r*0.42,fr?'#e8b894':'#a99ad8',0,1.4); if(!fr){ ctx.fillStyle='#e2d8ff'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-4+i*4,-3); ctx.lineTo(-3+i*4,-r*0.85); ctx.lineTo(-2+i*4,-2); ctx.fill(); } } ctx.restore(); }

// ---------- Shardling: a violet ice crystal sprite born from the Shard's hum (only near Mount Dread). It hovers low,
// keeps its distance and throws three ice shards in a fan. When it dies it bursts into a ring of shards (violet ring,
// after 0.4 s, jump it). Weak to fire (x1.5).
f2Foe('f_shardling',{name:'Shardling',r:12,hp:45,speed:150,dmg:10,value:24,flying:true,kbRes:1,dcol:'190,150,255',
  ai:FK.kiter({keep:[170,300],range:460,mode:'spread',n:3,spread:0.28,kind:'ice',spd:270,windup:0.5,dmg:1,r:6}),
  init(e){ f2Ice(e); e.spin=rand(0,TAU); },
  onHurt(e,amt,o){ const h=foeHit(e,o); if(h.fire) return amt*1.5; },
  onDeath(e){ f2Corpse(e); f2Shards(e.x,e.y-14,18,'210,180,255'); SFX.play('pop'); f2Wave(e.x,e.y,{wait:0.4,max:160,spd:240,thick:16,dmg:f2Dmg(e,8),col:F2COL.violet,r0:12});
    f2Mark({x:e.x,y:e.y,r:160,dur:0.4,col:F2COL.violet}); },
  draw3d:f2FigShard, draw2d:f2Shard2,
  sheet:f2Sheet([{state:'chase',label:'idle'},{state:'chase',dx:100,label:'drift'},{state:'cast',st:0.25,label:'cast'},{state:'chase',stun:1,label:'stunned'},{state:'chase',deathT:0.3,label:'death'}])});
function f2FigShard(e,fl){
  const t=e.t||0, st=e.state, k=e.r/12, face=t3Turn(e,e.face,10), z=10+Math.sin(t*3+(e.id||0))*2, fx=e.x, fy=e.y+e.r*0.3, dead=foDeath(e), cast=st==='cast';
  const c0=fl?'#ffffff':'#b49af0', c1='#8a6ad6', c2='#e4dcff', spin=(e.spin||0)+t*(cast?6:2);
  foShadow(e.x,e.y+3,9*k,0.3);
  foBegin(fx,fy,face,k,fl,z);
  if(dead) foSet(FOB,6,0,0,dead*4,0,0,dead*6);
  foC(0,0,6,0,0,20,5.2,c0,0.01); foC(0,0,6,0,0,-3,5.2,c1,0); foC(-1.5,-2,9,-3,-3.4,17,2,c2,0.03); foC(1.4,2.6,8,2.6,4.6,15,1.8,c0,0.02);
  for(let i=0;i<3;i++){ const a=spin+i*TAU/3, x=Math.cos(a)*10, y=Math.sin(a)*10, zz=8+Math.sin(spin*1.3+i)*2; foC(x,y,zz-3,x,y,zz+4,1.4,i%2?c2:c0,0.02); }
  for(const sd of [-1,1]) foD(4.6,sd*1.6,11,0.9,'#2a1840',0.05); foN(4.7,-1,8.6,4.7,1,8.6,0.45,'#2a1840',0.05);
  foGlow(0,0,10,cast?16:10,'190,150,255',cast?0.8:0.4,false);
  foEnd(10); e._t3top=foTop(fy,22,k,z);
}
function f2Shard2(e,fl){ const x=e.x, y=e.y-14+Math.sin((e.t||0)*3)*2; ctx.save(); ctx.fillStyle='rgba(20,30,60,.2)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+3,8,3,0,0,TAU); ctx.fill();
  ctx.fillStyle=fl?'#fff':'#b49af0'; ctx.strokeStyle=F2OL(); ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x,y-14); ctx.lineTo(x+7,y); ctx.lineTo(x,y+8); ctx.lineTo(x-7,y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#e4dcff'; ctx.beginPath(); ctx.moveTo(x-2,y-10); ctx.lineTo(x+1,y-2); ctx.lineTo(x-4,y-1); ctx.fill(); ctx.restore(); }

// ================= 7. shared boss machinery
// hit circles: some bosses have parts (a furnace door, a head, a tail, the Shard) with their own damage factor (m)
const F2HC={};
function f2HS(L,n,o){ return Object.assign(L[n]||(L[n]={}),o); }
{ const base=hitCircles; hitCircles=function(e){ const f=F2HC[e.type]; return f?f(e):base(e); }; }
// keep a boss's health at or above frac of its max (a gate the mechanic opens). onHurt's number is multiplied by the
// hit circle's mult after it returns, and any hit takes at least 0.5, so this returns false when nothing may go through.
function f2Floor(e,a,o,frac){ const room=e.hp-e.maxHp*frac; if(room<=0.5) return false; return Math.min(a,room/((o&&o.mult)||1)); }
function f2Gate(e,a,o,frac,okNow,txt){ if(okNow) return a; const b=a; const r=f2Floor(e,a,o,frac); if((r===false||r<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3.2; f2Txt(e,txt,'#ffd27a',13); } return r; }
// story lines: the story helper may write STORY[key] (any of the keys, first wins); until then the bible's words below
function f2Lines(type,inKeys,outKeys,introDef,outroDef){
  const B={_in:null,_out:null}, pick=(keys,def)=>{ for(const k of keys||[]){ const v=STORY[k]; if(v&&v.length) return v; } return def||[]; };
  Object.defineProperty(B,'intro',{get(){ return this._in||pick(inKeys,introDef); },set(v){ this._in=v; },enumerable:true,configurable:true});
  Object.defineProperty(B,'outro',{get(){ return this._out||pick(outKeys,outroDef); },set(v){ this._out=v; },enumerable:true,configurable:true});
  STORY.bosses[type]=B; return B;
}
function f2Spk(id,name,col){ if(!SPK[id]) SPK[id]={name,col}; }
f2Spk('f_bellows','Old Bellows','#e0a050'); f2Spk('f_frostfeather','Old Frostfeather','#e8eef8'); f2Spk('f_grumblehorn','King Grumblehorn','#b8a890');
f2Spk('f_hush','Hush','#ece4fa'); f2Spk('f_glaciar','Glaciar','#bfe2ff'); f2Spk('f_blubberton','Lord Blubberton','#c8a890'); f2Spk('f_squall','Squall','#8ac0f0');
f2Spk('f_squeak','Squeak','#f0d870'); f2Spk('f_rockjaw','Rockjaw','#b89878'); f2Spk('f_grumbo','Grumbo','#e4e8f4'); f2Spk('f_mumble','Mumble','#f2f4fa');
f2Spk('tove','Tove','#bfe6ff'); f2Spk('nyxara','The Lady of the Moths','#c8b0f0'); f2Spk('f_pennant','Brother Pennant','#f0b040');
// a top-of-screen line from Tove (the Warden riding in Ash's fire) at most once per gap seconds
function f2Tove(line,gap){ if(F2.toveT>G.time) return; F2.toveT=G.time+(gap||8); taunt('tove',line); }
// the sites: a boss type maps to its site key (defineBoss). Dungeon sites never open by themselves (open:()=>false):
// the room trigger (f2boss) or f2BossStart starts them.
const F2SITE={}, F2SITEK={};
function f2Site(type,k,d){ F2SITE[type]=k; F2SITEK[k]=type; return defineBoss(k,d); }
// a boss spawned for a dungeon room: the room is its arena (e.arena), it joins the room (the doors lock, the room is
// solved when it falls) and never wanders off
function f2BossInit(e){
  e.r0=e.r0||e.r; e.leash=99999;
  const Pd=F2.pending; if(Pd&&Pd.type===e.type&&AREA&&AREA.id===Pd.area){ const R=Pd.R; e.arena={x0:R.x0,y0:R.y0,x1:R.x1,y1:R.y1,cx:R.cx,cy:R.cy}; e.inArea=true; e.room=R.id; e.f2room=R; if(R.enemies) R.enemies.push(e); if(!Pd.keep) F2.pending=null; }
}
// a second fighter that joins the same room (Squeak with Squall)
function f2RoomJoin(e,R){ e.arena={x0:R.x0,y0:R.y0,x1:R.x1,y1:R.y1,cx:R.cx,cy:R.cy}; e.inArea=true; e.room=R.id; e.f2room=R; e.leash=99999; if(R.enemies&&!R.enemies.includes(e)) R.enemies.push(e); }
// room decor for boss rooms (built whenever the room is loaded; the fight only adds the moving parts)
const F2ROOMK={};
function f2RoomOf(e){ const R=e&&e.f2room; if(!R) return null; for(const D of F2.rooms||[]) if(D.R===R) return D; return null; }
function f2Cells(R,fn){ const A=AREA, c=A.cave; for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*c.w+i; fn(k,i,j,A.x0+(i+0.5)*c.cell,A.y0+(j+0.5)*c.cell); } }
// a cell of a room (room coordinates) in world px
function f2RC(R,c,r){ const A=AREA, cs=A.cave.cell; return {x:A.x0+(R.ox+1+c+0.5)*cs,y:A.y0+(R.oy+1+r+0.5)*cs}; }
// room templates that fit each fight (F2_TPL.<name>: rows for `tpl`, F2_FROST.<name>: rows for the p3 `frost` layer)
const F2_TPL={}, F2_FROST={};
function f2Tpl(w,h,fn){ const rows=[]; for(let j=0;j<h;j++){ let s=''; for(let i=0;i<w;i++) s+=fn(i,j)||'.'; rows.push(s); } return rows; }
const f2Round=(w,h,n)=>(i,j)=>Math.min(i,w-1-i)+Math.min(j,h-1-j)<n?'#':null;
// the dungeon helpers' hooks run when a boss or mini is beaten (after its outro)
function f2Won(type){ G.flags[type+'_won']=true; F2.won[type]=true; try{ if(F2.hook.won) F2.hook.won(type); }catch(err){ console.error(err); } questPoke(); }
// ---------- minibosses: the room trigger makes them fight like a boss (the boss bar, intro and outro); placed the stock
// way (a room's boss:[type,title]) their health is brought back to their own number (the cave would make it much bigger)
function f2MiniInit(e,opt){
  if(opt&&opt.hpScale>=2){ const f=opt.hpScale*(e.elite?1.6:1); e.hp/=f; e.maxHp/=f; if(e.elite){ e.elite=false; e.r=EDEF[e.type].r; } }
  const Pd=F2.pending; if(Pd&&Pd.type===e.type){ f2BossInit(e); G.boss=e; e.f2mini=true; } e.leash=99999; e.r0=e.r0||e.r;
}
function f2MiniDone(e){
  if(!e.f2mini) return; const k=G.fightSite, d=k&&BOSSES[k]; if(!d||d.boss!==e.type) return;
  G.boss=null; G.fightSite=null; G.fightIntro=false; G.bossDone[e.type]=true; bossFightEnd(false);
  later(1.2,()=>{ const L=(STORY.bosses[e.type]&&STORY.bosses[e.type].outro)||[]; const fin=()=>{ scene='play'; try{ if(d.onWin) d.onWin(); }catch(err){ console.error(err); } saveGame(); };
    if(L.length) runDialogue(L,fin); else fin(); });
}
// ---------- where the dungeon bosses live (site keys, the fight level, where the boss appears in its room)
const F2DUN={
  f_bellows:{k:'f_greatbellows',name:S('The Great Bellows','The Great Bellows'),level:14,dy:-170,line:['f_maze_bossline','trial_f_maze_bossline'],lineDef:S(`Old Bellows! Blaze melts his ice armour. Melt a plate, then hit what's under it. Seal the frost vents when he tries to freeze back up!`,'Old Bellows! Blue fire melts his armour. Then hit him!')},
  f_frostfeather:{k:'f_theroost',name:S('The Roost','The Roost'),level:15,dy:0,line:['f_sky_bossline','trial_f_sky_bossline'],lineDef:S('Old Frostfeather! Hit her when she lands. When she flies too high, ride the updraft up and Blaze the moth dust out of her eyes!','Hit her when she lands! Ride the updraft. Blue fire her eyes!')},
  f_grumblehorn:{k:'f_stonethrone',name:S('The Stone Throne','The Stone Throne'),level:16,dy:-200,line:['f_deep_bossline','trial_f_deep_bossline'],lineDef:S('King Grumblehorn! When he charges, raise a pillar in his way. When his horns are stuck, jump up and POUND him!','When he charges, raise a pillar! Then POUND him!')},
  f_blubberton:{k:'f_walrushall',name:S('The Walrus Hall','The Walrus Hall'),level:15,dy:-110,mini:true},
  f_squall:{k:'f_galegallery',name:S('The Gale Gallery','The Gale Gallery'),level:16,dy:-90,mini:true},
  f_rockjaw:{k:'f_armadillorun',name:S('The Armadillo Run','The Armadillo Run'),level:17,dy:-100,mini:true},
  f_grumbo:{k:'f_yetiden',name:S('The Yeti Den','The Yeti Den'),level:18,dy:-100,mini:true}};
for(const t in F2DUN){ const d=F2DUN[t]; f2Site(t,d.k,{boss:t,at:{x:IZX+200,y:IZY+200,r:600,name:d.name,level:d.level},stage:null,open:()=>false,bless:!d.mini,
  spawn:P=>({x:P.x,y:P.y+(d.dy||-120)}),onStart(){ f2FightStart(t); },onReset(){ f2FightReset(t); },onWin(){ f2Won(t); }}); }
// start a boss fight now: in a dungeon room (R = AREA.rooms[id]) or at its outdoor site. o: {intro:false, level}
function f2BossStart(type,R,o){
  o=o||{}; const k=F2SITE[type]; if(!k||G.mode!=='story'||G.fightSite) return null; const s=SITES[k], P=POI[s.poi], d=F2DUN[type];
  if(R){ P.x=R.cx; P.y=R.cy; P.r=Math.max(R.x1-R.x0,R.y1-R.y0)*0.6; if(AREA){ s.area=AREA.id; P.level=d&&d.mini?(AREA.level||P.level)+1:(d?d.level:P.level); } F2.pending={R,type,area:AREA&&AREA.id}; }
  G.fightSite=k; G.fightIntro=true;
  const go=()=>{ scene='play'; G.fightIntro=false; if(G.fightSite!==k) return; const h0=G.hazards.length; startBossFight(k);
    const h=G.hazards.slice(h0).find(q=>q.kind==='spawn'&&q.type===type); if(h&&(o.level||(d&&d.mini))) h.opt.level=o.level||P.level;
    if(d&&d.mini){ const D=EDEF[type]; setBanner(D.name,(W<560&&D.short)?D.short:D.title,2.8,'boss'); }
    if(d&&d.line){ let L=null; for(const q of d.line){ const v=STORY[q]; if(typeof v==='string'&&v){ L=v; break; } } later(3,()=>{ if(G.fightSite===k) f2Tove(L||d.lineDef,20); }); } };
  const L=o.intro===false||F2.noIntro?[]:((STORY.bosses[type]&&STORY.bosses[type].intro)||[]);
  if(L.length) runDialogue(L,go); else go();
  return k;
}
// leaving the dungeon (or falling) in the middle of a dungeon fight resets it, like walking away from an outdoor one
{ const base=exitArea; exitArea=function(silent){ if(G&&G.fightSite&&F2SITEK[G.fightSite]&&SITES[G.fightSite].area){ resetBoss(); F2.pending=null; } return base(silent); }; }
// what each fight does when it starts and when it is lost (a boss type may register F2FIGHT[type]={start,reset})
const F2FIGHT={};
function f2FightStart(t){ F2.chill.length=0; const f=F2FIGHT[t]; if(f&&f.start) try{ f.start(); }catch(err){ console.error(err); } }
function f2FightReset(t){ F2.whiteT=0; F2.lift=null; const f=F2FIGHT[t]; if(f&&f.reset) try{ f.reset(); }catch(err){ console.error(err); } }
// the room decor: built when an area loads, ticking every frame, drawn under (ground) and among (tall) the figures
function f2BuildRooms(A){
  for(const id in A.rooms){ const R=A.rooms[id], t=R.f2boss; if(!t||!F2SITE[t]) continue;
    if(G.bossDone[t]&&!R.solved){ try{ solveRoom(R,true); }catch(err){} }
    const K=F2ROOMK[t]; let D={type:t,R}; if(K&&K.build){ try{ D=K.build(R,A)||D; }catch(err){ console.error(err); } } D.type=t; D.R=R; F2.rooms.push(D); }
}
function f2RoomsFrame(dt){
  if(F2.area!==AREA){ F2.area=AREA; F2.rooms=[]; if(AREA&&AREA.rooms) f2BuildRooms(AREA); }
  for(const D of F2.rooms){ const K=F2ROOMK[D.type]; if(K&&K.tick) try{ K.tick(D,dt); }catch(err){ console.error(err); } }
  // a room boss (and its partner) never leaves its room, even a flyer in a long dive
  for(const q of G.enemies) if(!q.dead&&q.arena&&q.f2room) f2Hold(f2Ctx(q),q,Math.min(40,(q.r0||q.r)+10));
  if(AREA&&F2.rooms.length&&scene==='play'&&!G.fightSite&&!player.dead&&G.mode==='story'){ const R=caveRoomAt(player.x,player.y);
    if(R) for(const D of F2.rooms) if(D.R===R&&caveInterior(R,player.x,player.y)&&!G.bossDone[D.type]&&!R.solved){ f2BossStart(D.type,R); break; } }
}
function f2RoomsTall(list){
  if(AREA) for(const D of F2.rooms){ const K=F2ROOMK[D.type]; if(K&&K.tall&&inView(D.R.cx,D.R.cy,Math.max(D.R.x1-D.R.x0,D.R.y1-D.R.y0))) K.tall(D,list); }
}
{ const base=drawPools; drawPools=function(){ if(AREA) for(const D of F2.rooms){ const K=F2ROOMK[D.type]; if(K&&K.ground) try{ K.ground(D,G.time); }catch(err){ console.error(err); } } else f2OutGround(); base(); }; }
// ---------- outdoor fight pieces (Hush's lamps, Glaciar's Chain Stones): kinds with draw(o) (tall) and ground(o)
const F2OUT=[];
function f2OutAdd(o){ o.map=mapAt(o.y); F2OUT.push(o); return o; }
function f2OutGround(){ const k=curMap(); for(const o of F2OUT){ if(o.map!==k||!o.ground||!inView(o.x,o.y,o.vr||300)) continue; try{ o.ground(o,G.time); }catch(err){ console.error(err); } } }
function f2OutTall(list){ if(AREA) return; const k=curMap(); for(const o of F2OUT){ if(o.map!==k||!o.draw||!inView(o.x,o.y,o.vr||300)) continue; if(!o.it) o.it={x:o.x,y:o.y+(o.sy||0),draw:()=>o.draw(o,G.time)}; o.it.x=o.x; o.it.y=o.y+(o.sy||0); list.push(o.it); } }

// ================= 8. Old Bellows, the Forgekeeper (f_bellows), boss of the Glacier Maze (the Great Bellows)
// A forge golem as big as a cottage, frozen by moth-frost. Four violet plates of moth-frost armour (chest, right arm,
// back, left arm): while a plate covers the side you hit, damage is x0.1 (CLANK). Blaze on a plate for 1.5 s melts it;
// if he stands in a lava channel all his plates go soft for 5 s (they melt in 0.5 s). His furnace door (under the chest
// plate) takes x1.5.
// Phase 1: Anvil Punch (white arc), Stomp (orange circle, then a ring to jump), Bellows Pull (his back puffs up, he pulls
//   Ash in, then a Frost Gust cone: roll sideways out of it).
// Phase 2 Refreeze: every 12 s he slams the floor and the four corner vents breathe: every melted plate grows back unless
//   its vent is sealed (Blaze a vent 1 s: sealed 10 s). Ice Anvil Toss (two lobbed blasts).
// Phase 3 Overheat: Mothlings burst out of his furnace. Every 14 s his chest glows white and he swallows the forge's heat
//   (a strong pull): Blaze INTO his open furnace door for 1.5 s and he overheats (staggers 3 s, every plate pops off, the
//   furnace takes x3). Miss it and he gets warm (+30 percent speed for 6 s). Gate: his last 5 percent needs one overheat
//   (two on Hard).
f2Lines('f_bellows',['f_bellows_intro','trial_f_maze_boss'],['f_maze_won','trial_f_maze_won'],
  [['narr',S('In the middle of the cold forge stands a golem as big as a cottage. Brass belly, anvil fists, a great leather bellows on his back. Purple frost covers him like armour.','A huge forge golem! Purple frost covers him like armour.')],
   ['f_bellows',S('CLANK. Bellows... cold. Purple cold says: no fire.','CLANK. Cold. No fire.')],
   ['tove',S('His armour is moth-frost, Ash. Normal fire will not touch it. Blaze will!','Use blue fire on his armour!')]],
  [['narr',S('The purple frost cracks off Old Bellows like an eggshell. Underneath he is warm brass and soot and rivets.','The purple frost cracks off. He is warm brass again.')],
   ['f_bellows',S('...Fff. Fwooosh. Warm?','Fwoosh. Warm?')],
   ['f_bellows',S('Small hot one. You smell like the boss.','You smell like the boss.')],
   ['ash',S('The boss? You mean Ember?','The boss? Ember?')],
   ['f_bellows',S('Ember. And the Cold One. They made Bellows. Bellows kept the forge. Then the bad cold came. The purple cold. Bellows forgot.','Ember and the Cold One made me. Then the purple cold came.')],
   ['f_bellows',S('Bellows will light the forge again. Bellows will keep it warm until somebody needs it.','I will keep the forge warm.')],
   ['narr',S('Old Bellows gives you a hug. It is like being hugged by a toasty oven that loves you.','He hugs you. Like a toasty oven!')]]);
const F2BPL=['chest','right arm','back','left arm'];
// which plate covers a hit from (fx,fy): 0 chest (front), 1 right, 2 back, 3 left
function f2BelSide(e,fx,fy){ const f=e.face, dx=fx-e.x, dy=fy-e.y, lx=dx*Math.cos(f)+dy*Math.sin(f), ly=-dx*Math.sin(f)+dy*Math.cos(f); const a=Math.atan2(ly,lx); if(Math.abs(a)<0.8) return 0; if(Math.abs(a)>2.35) return 2; return a>0?1:3; }
function f2BelCore(e){ const f=e.face, k=(e.r0||46)/46; return {x:e.x+Math.cos(f)*30*k,y:e.y+Math.sin(f)*30*k}; }
const f2BelOpen=e=>e.state==='inhale'||e.state==='inhaleW'||e.state==='stagger';
F2HC.f_bellows=e=>{ const L=e._hc||(e._hc=[{},{}]); let n=0;
  f2HS(L,n++,{x:e.x,y:e.y,r:e.r,m:1});
  if(!e.plates||!e.plates[0]||f2BelOpen(e)){ const c=f2BelCore(e); f2HS(L,n++,{x:c.x,y:c.y,r:18*(e.r0||46)/46,m:e.state==='stagger'?3:1.5}); }
  L.length=n; return L; };
function f2BelMelt(e,i,how){ if(!e.plates[i]) return; e.plates[i]=0; e.pheat[i]=0; SFX.play('pop'); f2Puff(e.x,e.y-40,'235,245,255',20); f2Shards(e.x,e.y-40,16,'210,190,255');
  f2Txt(e,how==='pop'?S('POP! The plates fly off!','POP!'):S(`Hsss! His ${F2BPL[i]} plate melts!`,'Hsss! A plate melts!'),'#ffd0a0',14); }
function f2BelGrow(e,i){ if(e.plates[i]) return; e.plates[i]=1; e.pheat[i]=0; f2Shards(e.x,e.y-40,10,'210,190,255'); }
// the Bellows Pull: his back puffs up (0.6 s), he breathes in and Ash slides toward him (1.5 s), then a Frost Gust cone
FM.f2pull={
  start(e,m){ e.state='puffW'; e.st=fkW({},0.6); m.ph=0; SFX.play('warn'); },
  tick(e,dt,d,a,m){ const p=player; e.face=turnTo(e.face,a,2*dt); e.st-=dt;
    if(m.ph===0){ if(e.st>0) return false; m.ph=1; e.state='pull'; e.st=1.5; e.tele=newTele({shape:'cone',len:360,half:0.5,dur:1.5,col:F2COL.frost}); return false; }
    if(m.ph===1){ if(!p.dead&&!f2Up()&&!(typeof p2Shadowed==='function'&&p2Shadowed())&&d>e.r+30){ const k=150*dt; p.kvx-=Math.cos(a)*k*6; p.kvy-=Math.sin(a)*k*6; if(Math.random()<dt*20) emit(p.x,p.y-10,1,{col:'220,240,255',glow:false,ang:a+Math.PI,spread:0.3,smin:80,smax:160,lmin:.2,lmax:.4,zmin:1.2,zmax:2,drag:1}); }
      if(e.st>0) return false; m.ph=2; e.tele=null; e.state='gust'; e.st=0.45;
      const ox=e.x+Math.cos(e.face)*e.r, oy=e.y+Math.sin(e.face)*e.r; emit(ox,oy,30,{col:'225,240,255',glow:false,ang:e.face,spread:0.5,smin:360,smax:520,lmin:.3,lmax:.5,zmin:3,zmax:6,grow:14,drag:1.4}); SFX.play('roar',0.5);
      if(inCone(ox,oy,e.face,360,0.5,p.x,p.y,p.r)&&!(typeof p2Shadowed==='function'&&p2Shadowed())){ hurtPlayer(f2Dmg(e,18),ox,oy,220); p.slowT=Math.max(p.slowT||0,1); f2Chill(5); } return false; }
    return e.st<=0; } };
FM_DEF.f2pull={recover:0.7};
const BELLOWS_AI=FK.brain({move:'approach',stop:96,turn:2.2,cd:[0.9,1.5],recoverMove:0.2,pre:f2BelPre,
  moves:[{k:'slash',reach:126,half:0.9,windup:0.55,track:2.6,lunge:120,dmgN:30,kb:380,col:F2COL.white,max:150,w:3},
         {k:'f2slam',st:'stompW',off:0,r:74,windup:0.7,dmgN:24,max:360,w:1.8,every:4,then:(e,m)=>{ f2Wave(e.x,e.y,{dmg:f2Dmg(e,22),max:420,spd:300,thick:18}); }},
         {k:'f2pull',min:120,max:520,every:7,w:2},
         {k:'f2lob',ph:1,st:'toss',n:2,scatter:110,r:60,flight:1.0,windup:0.55,col:F2COL.frost,ball:'#cfe6ff',br:9,h:120,min:160,every:5,w:2,land:(e,x,y)=>{ f2Shards(x,y,18); SFX.play('boom'); shake(4); const p=player; if(!p.dead&&!f2Up()&&dist(x,y,p.x,p.y)<60+p.r*0.5) hurtPlayer(f2Dmg(e,28),x,y,240); }}]});
f2Foe('f_bellows',{boss:true,name:'Old Bellows',title:S('the Forgekeeper','the forge golem'),short:'Old Bellows',
  lv:14,hp:6000,r:46,speed:60,dmg:22,value:1400,kbRes:0.05,dcol:'230,170,90',phases:[0.6,0.3],
  phaseText:[[S('Refreeze!','Refreeze!'),S('The corner vents freeze his armour back! Blaze a vent to seal it.','Blue fire on the vents! Seal them!'),['f_bellows',S('Purple cold... comes back.','Cold comes back.')]],
             [S('Overheat!','Overheat!'),S('When his chest glows white, Blaze into his furnace door!','His chest glows? Blue fire in the furnace!'),['f_bellows',S('FWOOOOSH! Bellows... hungry for heat.','FWOOOSH!')]]],
  init(e){ f2BossInit(e); e.plates=[1,1,1,1]; e.pheat=[0,0,0,0]; e.refreezeT=6; e.swallowT=4; e.overheats=0; e.softT=0; },
  onPhase(e,i){ if(i===1){ e.refreezeT=3; f2Tip('bel_vents',S('Frost vents','Frost vents'),S('Blaze a corner vent to seal it for 10 seconds. A sealed vent cannot freeze his armour back.','Blue fire a vent to seal it.')); }
    if(i===2){ e.swallowT=3; const D=f2RoomOf(e); for(let j=0;j<3;j++){ const c=f2BelCore(e), s={x:c.x+rand(-30,30),y:c.y+rand(-30,30)}; spawnRune('f_mothling',s.x,s.y,{aggro:true},0.2+j*0.15); } f2Txt(e,S('Mothlings burst out of his furnace!','Moths fly out!'),'#e2d0ff',14); } },
  ai:BELLOWS_AI,
  onBlaze(e,dt,J){ if(e.dead) return;
    // the furnace door while he swallows the heat
    if(e.state==='inhale'){ const c=f2BelCore(e); if(f2Blue(c.x,c.y,16)){ e.furnH=(e.furnH||0)+dt; f2Work(); if(e.furnH>=f2Need(1.5)) f2BelOverheat(e); return; } }
    const i=f2BelSide(e,J.x,J.y); if(!e.plates[i]) return; e.pheat[i]+=dt; e.pheatT=G.time; f2Work();
    if(Math.random()<0.4) emit(e.x+rand(-30,30),e.y-rand(20,60),1,{col:'255,200,150',glow:true,ang:-Math.PI/2,spread:0.8,smin:15,smax:50,lmin:.4,lmax:.8,zmin:2,zmax:4});
    if(e.pheat[i]>=f2Need(e.softT>0?0.5:1.5)) f2BelMelt(e,i); },
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    const fx=o.fx!=null?o.fx:player.x, fy=o.fy!=null?o.fy:player.y, i=f2BelSide(e,fx,fy);
    const core=o.mult!=null&&o.mult>=1.5;
    if(e.state!=='stagger'&&e.plates[i]&&!(core&&f2BelOpen(e))){ a=amt*0.1; if(!(e._clT>G.time)){ e._clT=G.time+1.4; f2Txt(e,S('CLANK! Melt that plate with Blaze!','CLANK! Use blue fire!'),'#e0d8ff',12); SFX.play('block'); } }
    if(e.bph===2) a=f2Gate(e,a,o,0.05,(e.overheats||0)>=byDiff(1,1,2),S('He is too strong! Blaze into his furnace when his chest glows!','Blue fire in his furnace!'));
    return a; },
  draw3d:f2FigBellows, draw2d:f2Bellows2,
  sheet:f2Sheet([{state:'chase',label:'idle',plates:[1,1,1,1]},{state:'chase',dx:60,label:'walk',plates:[1,1,1,1]},{state:'windup',st:0.3,at:0.3,label:'punch windup',plates:[1,1,1,1]},{state:'strike',label:'punch',plates:[1,1,1,1]},
    {state:'stompW',st:0.3,at:0.4,label:'stomp',plates:[1,0,1,0]},{state:'puffW',st:0.3,at:0.3,label:'bellows puff',plates:[0,1,1,1]},{state:'pull',label:'pull',plates:[0,1,1,1]},{state:'inhaleW',st:0.5,at:0.5,label:'chest glows',plates:[0,0,1,1]},
    {state:'inhale',label:'swallow heat',plates:[0,0,0,0]},{state:'stagger',label:'overheated',plates:[0,0,0,0]},{state:'chase',deathT:0.3,label:'death',plates:[0,0,0,0]}])});
function f2BelOverheat(e){ e.furnH=0; e.overheats=(e.overheats||0)+1; e.mv=null; e.tele=null; e.state='stagger'; e.st=f2Win(3); e.staggerT=f2Win(3); for(let i=0;i<4;i++) if(e.plates[i]) f2BelMelt(e,i,'pop'); e.plates=[0,0,0,0];
  shake(12); SFX.play('boom'); flashA=Math.max(flashA,0.25); flashCol='255,200,120'; f2Txt(e,S('OVERHEATED! Hit his furnace!','OVERHEAT! Hit the furnace!'),'#ffd27a',17); f2Say(e,'f_bellows',S('FWOOOOSH! Too... hot... good hot!','FWOOOSH!'),4);
  emit(e.x,e.y-40,40,{kind:'fire',smin:80,smax:300,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:10}); }
function f2BelPre(e,dt,d,a){
  const D=foeDiff(), R=f2RoomOf(e); bossCad(e,e.bph>=2?0.85:1);
  if(e.softT>0) e.softT-=dt; if(e.warmT>0){ e.warmT-=dt; if(e.warmT<=0) e.speed=e.speed0||e.speed; }
  for(let i=0;i<4;i++) if(e.pheat[i]>0&&G.time-(e.pheatT||0)>1.2) e.pheat[i]=Math.max(0,e.pheat[i]-dt*0.5);
  // overheated: staggered, every plate gone, the furnace wide open (x3)
  if(e.state==='stagger'){ e.dx=e.dy=0; e.st-=dt; if(Math.random()<dt*20) emit(e.x+rand(-30,30),e.y-rand(20,70),1,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:20,smax:80,lmin:.3,lmax:.6,zmin:2,zmax:4}); if(e.st<=0){ e.state='recover'; e.st=0.6; e.cd=0.4; } return true; }
  // the refreeze (phase 2 on): a floor slam, then the vents breathe frost at his melted plates
  if(e.bph>=1&&!e.mv&&e.state==='chase'){ e.refreezeT-=dt*D.atk; if(e.refreezeT<=0){ e.refreezeT=byDiff(14,12,10)*(e.bph>=2?1.3:1); e.mv=null; e.state='refreezeW'; e.st=f2W({},0.8); f2Mark({x:e.x,y:e.y,r:110,dur:e.st,col:F2COL.frost}); SFX.play('warn'); return true; } }
  if(e.state==='refreezeW'){ e.dx=e.dy=0; e.st-=dt; if(e.st>0) return true; shake(9); SFX.play('boom'); f2Snow(e.x,e.y,26); const p=player; if(!p.dead&&!f2Up()&&dist(p.x,p.y,e.x,e.y)<110+p.r*0.5) hurtPlayer(f2Dmg(e,20),e.x,e.y,300);
    let grown=0, sealed=0; if(R&&R.vents){ for(let i=0;i<4;i++){ const v=R.vents[i]; if(v.sealT>0){ sealed++; continue; } v.breathT=1.2; if(!e.plates[i]){ f2BelGrow(e,i); grown++; } } } else { for(let i=0;i<4;i++) if(!e.plates[i]){ f2BelGrow(e,i); grown++; } }
    if(grown) f2Txt(e,S('The vents freeze his armour back!','His armour grows back!'),'#cfeaff',14); else if(sealed) f2Txt(e,S('The sealed vents stay quiet!','The vents stay quiet!'),'#ffd27a',14);
    e.state='recover'; e.st=0.7; return true; }
  // swallow the heat (phase 3): the chest glows white, then a strong pull; Blaze into the furnace door to overheat him
  if(e.bph>=2&&!e.mv&&e.state==='chase'){ e.swallowT-=dt*D.atk; if(e.swallowT<=0){ e.swallowT=byDiff(16,14,12); e.state='inhaleW'; e.st=f2W({},1.0); e.furnH=0; SFX.play('warn'); f2Txt(e,S('His chest glows white!','His chest glows!'),'#ffffff',14); return true; } }
  if(e.state==='inhaleW'){ e.dx=e.dy=0; e.face=turnTo(e.face,a,2*dt); e.st-=dt; if(e.st<=0){ e.state='inhale'; e.st=2; } return true; }
  if(e.state==='inhale'){ e.dx=e.dy=0; e.face=turnTo(e.face,a,1.6*dt); e.st-=dt; const p=player;
    if(!p.dead&&!f2Up()&&!(typeof p2Shadowed==='function'&&p2Shadowed())&&d>e.r+24){ const k=230*dt; p.kvx-=Math.cos(a)*k*5; p.kvy-=Math.sin(a)*k*5; }
    if(Math.random()<dt*30){ const q=rand(0,TAU), rr=rand(120,260); emit(e.x+Math.cos(q)*rr,e.y+Math.sin(q)*rr,1,{col:'255,220,170',glow:true,ang:q+Math.PI,spread:0.1,smin:rr*1.6,smax:rr*2,lmin:.3,lmax:.5,zmin:1.4,zmax:2.4}); }
    if(e.st<=0){ e.state='recover'; e.st=0.8; e.warmT=6; e.speed0=e.speed0||e.speed; e.speed=e.speed0*1.3; f2Txt(e,S('He swallowed the heat! He is warm and fast!','He is warm now! Fast!'),'#ffb070',14);
      if(!p.dead&&dist(p.x,p.y,e.x,e.y)<e.r+70&&!f2Up()) hurtPlayer(f2Dmg(e,30),e.x,e.y,420); emit(e.x,e.y,24,{kind:'fire',smin:60,smax:220,lmin:.3,lmax:.6,zmin:3,zmax:6}); }
    return true; }
  return false;
}
// ---- his look: a forge golem as big as a cottage. Brass belly with a round furnace door, anvil fists, a great leather
// bellows on his back, coal eyes, a little chimney hat. Violet moth-frost plates on his chest, back and both arms.
function f2FigBellows(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.f_bellows.r)/46*2.1, face=t3Turn(e,e.face,5), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e), dead=foDeath(e), hurt=f2Hurt(e);
  const pl=e.plates||[1,1,1,1], br=fl?'#ffffff':foT(e,'#d8a04a'), brD=foT(e,'#a8722e'), brL=foT(e,'#f2cc7a'), iron='#5a5e6e', ironD='#3a3c48', vio='#b6a4ee', vioD='#7c66c6', vioL='#e8e0ff';
  const mv=foWalk(e,dt,6), w=e._wp||0, open=f2BelOpen(e), hot=st==='stagger'||(e.warmT>0), pheat=e.pheat||[0,0,0,0];
  let punch=0, raise=0, lean=0, puff=0, stomp=0;
  if(st==='windup'){ raise=f2Sm(clamp(1-e.st/0.55,0,1)); lean=-0.08*raise; } else if(st==='strike'){ punch=1; lean=0.18; }
  else if(st==='stompW'||st==='refreezeW'){ stomp=f2Sm(clamp(inS/0.7,0,1)); lean=-0.06; }
  else if(st==='puffW'){ puff=f2Sm(clamp(inS/0.6,0,1)); lean=-0.1; } else if(st==='pull'||st==='inhale'){ puff=1-0.3*Math.sin(t*6)*0.5; lean=-0.12; }
  else if(st==='gust'){ puff=0.2; lean=0.12; } else if(st==='toss'){ raise=0.8; }
  const P=foEase(e,'_fbl',foTg(punch,raise,lean,puff,stomp),dt,st==='strike'?20:9); punch=P[0]; raise=P[1]; lean=P[2]; puff=P[3]; stomp=P[4];
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,-1*dead,0.15*dead,0,-6*dead,0,0); else if(st==='stagger') foSet(FOB,0,0,Math.sin(t*7)*0.08,0);
  // legs: stubby brass pillars with iron feet
  foLow(); for(const sd of [-1,1]){ const s=Math.sin(w)*mv*sd, lift=Math.max(0,Math.cos(w)*sd)*mv*1.4+(sd<0?stomp*5:0); foY(s*2.4,sd*7,lift,4.4,4.8,9,brD,brL); foE(s*2.4+1.4,sd*7,0.9+lift,6,4.6,1.8,iron); }
  foUp(); foSet(FOA,10,lean-hurt*0.08,Math.sin(t*1.5)*0.02,0,0,0,Math.abs(Math.cos(w))*mv*0.6);
  // the great leather bellows on his back (puffs up when he breathes in)
  { const bx=-15-puff*2, bw=6+puff*4;
    for(let i=0;i<3;i++) foE(bx-i*bw*0.55,0,26+i*0.4,bw*0.6,11+puff*1.5-i*0.5,9+puff*2,i%2?'#7a4a2a':'#8e5a32',0,0,0,-0.02-i*0.01);
    foQ([bx+2,-11,35, bx+2,11,35, bx+2,11,17, bx+2,-11,17],'#9a6a3a','#5a3a1a',-0.02);
    foQ([bx-bw*1.4,-10,34, bx-bw*1.4,10,34, bx-bw*1.4,10,18, bx-bw*1.4,-10,18],'#9a6a3a','#5a3a1a',-0.06);
    foN(bx-bw*1.4,0,26,bx-bw*2.6,0,24,1.4,ironD,-0.07); }
  // the brass belly, rivets, and the round furnace door in front
  foE(0,0,24,15,16,15,br); foE(1,0,30,13,14,8,brL,0,0,0,0.01);
  for(let i=0;i<6;i++){ const a=i/6*TAU; foD(Math.cos(a)*12.6,Math.sin(a)*13.4,24+Math.sin(a*2)*3,0.8,brD,0.03); }
  { const dz=21, glow=open||hot, gc=st==='inhaleW'||st==='inhale'?'#ffffff':'#ff8a3a';
    foE(13.6,0,dz,2.6,7.4,7.4,ironD,0,0,0,0.02); foE(14.4,0,dz,1.6,6,6,glow?gc:'#2a1a14',0,0,0,0.03);
    if(!open) for(let i=-1;i<=1;i++) foN(15.2,i*3.4,dz+5,15.2,i*3.4,dz-5,0.8,iron,0.04); else foQ([15,6,dz+6, 15,6,dz-6, 19,10,dz-5, 19,10,dz+5],iron,ironD,0.04);
    if(glow) foGlow(15.2,0,dz,st==='stagger'?20:14,st==='inhaleW'||st==='inhale'?'255,250,235':'255,150,60',0.6+0.3*Math.sin(t*12),false); }
  // moth-frost plates: chest (over the door), back (over the bellows), and the two arms
  const plate=(i)=>{ const h=clamp(pheat[i]/1.5,0,1); return h>0.05?`rgb(${Math.round(182+73*h)},${Math.round(164+40*h)},${Math.round(238-120*h)})`:vio; };
  if(pl[0]){ foQ([14.8,-9,32, 14.8,9,32, 15.8,8,13, 15.8,-8,13],plate(0),vioD,0.06); f2Crystals(15,0,31,4,3,vioL,vio); }
  if(pl[2]){ foE(-10,0,34,6,12,5,plate(2),0,0,0,0.05); f2Crystals(-11,-5,37,4,2,vioL,vio); f2Crystals(-11,5,37,4,2,vioL,vio); }
  // arms with anvil fists: the right one punches, both rise for a stomp
  for(const sd of [-1,1]){ const right=sd>0, rr=right?raise:raise*0.6, pu=right?punch:0, st2=stomp;
    const sx=2, sy=sd*16, sz=32, hx=8+pu*18-rr*4, hy=sd*(18-pu*6), hz=18+rr*22+st2*14-pu*4;
    foB(sx,sy,sz,5.6,brD); foL(sx,sy,sz,(sx+hx)/2,sd*19,(sz+hz)/2,4.4,br,4); foL((sx+hx)/2,sd*19,(sz+hz)/2,hx,hy,hz,4,brD,3.6);
    foY(hx,hy,hz-4,5.4,5,7,iron,'#7a7e8e',0.02); foE(hx+5,hy,hz+2.6,6,4.6,2.2,'#6a6e7e',0,0,0,0.03); foC(hx+5,hy,hz+2.6,hx+12,hy,hz+3.4,2.2,'#6a6e7e',0.03);
    const pi=right?1:3; if(pl[pi]){ foE(sx+0.6,sy+sd*1.4,sz+3,5,5,4.6,plate(pi),0,0,0,0.05); f2Crystals(sx,sy+sd*2,sz+6,3.6,2,vioL,vio); } }
  // head: an iron dome with coal eyes and a little chimney that puffs smoke
  foE(4,0,41,7,8,6,iron); foY(1,0,46,2.4,2.8,6,ironD,'#2a2a30',0.02);
  for(const sd of [-1,1]) f2Glow(9.6,sd*3.4,42,1.6,hot?'#ffd06a':'#ff6a3a',0.5);
  foN(10.2,-2.4,39.6,10.2,2.4,39.6,0.9,ironD,0.05);
  foEnd(26);
  if(!fl&&Math.random()<0.3){ const q=foTop(fy,52,k); emit(e.x-Math.cos(face)*2*k,q,1,{col:hot?'255,170,90':'110,110,120',glow:hot,ang:-Math.PI/2,spread:0.4,smin:20,smax:50,lmin:.6,lmax:1.1,zmin:3,zmax:6,grow:8,drag:1,alpha:0.5}); }
  e._t3top=foTop(fy,50,k);
}
function f2Bellows2(e,fl){ const x=e.x, y=e.y, r=e.r0||e.r, f=e.face, pl=e.plates||[1,1,1,1]; ctx.save(); f2Shadow2(e,1.15); ctx.translate(x,y); ctx.rotate(f);
  f2E2(-r*0.75,0,r*0.35,r*0.55,'#8e5a32',0,2); f2E2(0,0,r*0.8,r*0.8,fl?'#fff':'#d8a04a',0,2.4);
  f2E2(r*0.62,0,r*0.22,r*0.3,f2BelOpen(e)?'#ffd27a':'#2a1a14',0,1.6);
  for(const s of [-1,1]){ f2E2(r*0.3,s*r*0.9,r*0.28,r*0.26,'#6a6e7e',0,1.8); }
  ctx.lineWidth=5; ctx.lineCap='round'; ctx.strokeStyle='rgba(182,164,238,.9)';
  if(pl[0]){ ctx.beginPath(); ctx.arc(0,0,r*0.82,-0.6,0.6); ctx.stroke(); } if(pl[1]){ ctx.beginPath(); ctx.arc(0,0,r*0.82,0.9,1.9); ctx.stroke(); } if(pl[2]){ ctx.beginPath(); ctx.arc(0,0,r*0.82,2.5,3.8); ctx.stroke(); } if(pl[3]){ ctx.beginPath(); ctx.arc(0,0,r*0.82,-1.9,-0.9); ctx.stroke(); }
  ctx.restore(); }
// ---- the Great Bellows (room decor): a round forge floor, four lava channels in a cross (hot: Ash takes 15 percent of
// his max health and bounces out; Bellows in one goes soft), four frost vents in the corners, the great bellows on the wall
F2ROOMK.f_bellows={
  build(R,A){ const D={R,ch:[],vents:[],cold:!!R.f2cold}; const hw=(R.x1-R.x0)/2, hh=(R.y1-R.y0)/2, r0=150, w=44;
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){ const L=(dx?hw:hh)-70; D.ch.push({dx,dy,x0:R.cx+(dx?dx*r0:-w/2),y0:R.cy+(dy?dy*r0:-w/2),x1:R.cx+(dx?dx*L:w/2),y1:R.cy+(dy?dy*L:w/2)}); }
    for(const c of D.ch){ if(c.x0>c.x1){ const q=c.x0; c.x0=c.x1; c.x1=q; } if(c.y0>c.y1){ const q=c.y0; c.y0=c.y1; c.y1=q; } }
    // the vents in the order of the plates they freeze: chest, right arm, back, left arm (corners NE, SE, SW, NW)
    for(const [sx,sy] of [[1,-1],[1,1],[-1,1],[-1,-1]]){ const v={x:R.cx+sx*(hw-96),y:R.cy+sy*(hh-90),sealT:0,heat:0,breathT:0,i:D.vents.length}; D.vents.push(v); v.col=addAreaCol({t:'c',x:v.x,y:v.y,r:20}); }
    R.vents=D.vents; D.bel={x:R.cx,y:R.y0+30}; return D; },
  tick(D,dt){ const p=player, e=G.boss&&G.boss.type==='f_bellows'&&!G.boss.dead?G.boss:null;
    for(const v of D.vents){ if(v.sealT>0) v.sealT-=dt; if(v.breathT>0) v.breathT-=dt;
      if(f2Blue(v.x,v.y-12,22)){ v.heat+=dt; f2Work(); if(v.heat>=f2Need(1)&&!(v.sealT>0)){ v.heat=0; v.sealT=10; SFX.play('pop'); ftext(v.x,v.y-46,S('Sealed!','Sealed!'),'#ffd27a',14); f2Puff(v.x,v.y-20,'120,110,110',14); } } else if(v.heat>0) v.heat=Math.max(0,v.heat-dt*0.5); }
    if(D.cold) return;
    const inCh=(x,y,m)=>{ for(const c of D.ch) if(x>c.x0-m&&x<c.x1+m&&y>c.y0-m&&y<c.y1+m) return c; return null; };
    if(!p.dead&&!f2Up()&&!(F2.lavaCd>G.time)){ const c=inCh(p.x,p.y,-4); if(c){ F2.lavaCd=G.time+0.9; const nx=c.dx?0:(p.x<(c.x0+c.x1)/2?-1:1), ny=c.dy?0:(p.y<(c.y0+c.y1)/2?-1:1);
      hurtPlayer(p.maxHp*0.15,p.x-nx*20,p.y-ny*20,0); p.kvx+=nx*520; p.kvy+=ny*520; ftext(p.x,p.y-40,S('HOT! Lava!','HOT!'),'#ffb070',15); emit(p.x,p.y,16,{kind:'fire',smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4}); } }
    if(e&&inCh(e.x,e.y,4)&&!(e.softT>0)){ e.softT=f2Win(5); f2Txt(e,S('He stepped in the lava! His armour is soft!','Soft armour! Blue fire now!'),'#ffb070',14); } },
  ground(D,t){ const R=D.R; ctx.save();
    ctx.fillStyle='rgba(40,30,30,.35)'; ctx.beginPath(); ctx.ellipse(R.cx,R.cy,Math.min(R.x1-R.x0,R.y1-R.y0)*0.47,Math.min(R.x1-R.x0,R.y1-R.y0)*0.43,0,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(180,140,90,.35)'; ctx.lineWidth=6; ctx.stroke();
    for(const c of D.ch){ const w=c.x1-c.x0, h=c.y1-c.y0; ctx.fillStyle=F2OL(); ctx.fillRect(c.x0-4,c.y0-4,w+8,h+8);
      ctx.fillStyle=D.cold?'#4a4448':'#e85a20'; ctx.fillRect(c.x0,c.y0,w,h);
      if(!D.cold){ ctx.fillStyle='rgba(255,200,80,.85)'; const n=Math.max(w,h)/40; for(let i=0;i<n;i++){ const u=((i+t*0.6)%n)/n; if(c.dx) ctx.fillRect(c.x0+u*w,c.y0+h*0.3+Math.sin(t*3+i)*h*0.15,14,4); else ctx.fillRect(c.x0+w*0.3+Math.sin(t*3+i)*w*0.15,c.y0+u*h,4,14); }
        ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.35+0.1*Math.sin(t*4); ctx.fillStyle='rgba(255,120,40,.5)'; ctx.fillRect(c.x0-8,c.y0-8,w+16,h+16); ctx.restore(); } }
    for(const v of D.vents){ ctx.fillStyle='rgba(30,40,60,.3)'; ctx.beginPath(); ctx.ellipse(v.x,v.y+6,30,12,0,0,TAU); ctx.fill();
      if(v.breathT>0&&G.boss&&!G.boss.dead){ const b=G.boss, a=clamp(v.breathT/1.2,0,1); ctx.strokeStyle=`rgba(200,235,255,${0.6*a})`; ctx.lineWidth=14*a; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(v.x,v.y-20); ctx.quadraticCurveTo((v.x+b.x)/2,(v.y+b.y)/2-80,b.x,b.y-40); ctx.stroke(); } }
    ctx.restore(); },
  tall(D,list){ for(const v of D.vents){ if(!v.it) v.it={x:v.x,y:v.y+8,draw:()=>f2DrawVent(v)}; list.push(v.it); } if(!D.it) D.it={x:D.bel.x,y:D.bel.y,draw:()=>f2DrawGreatBellows(D)}; list.push(D.it); }
};
function f2DrawVent(v){ const x=v.x, y=v.y, oc=F2OL(), t=G.time, seal=v.sealT>0, hk=clamp(v.heat||0,0,1); ctx.save();
  ctx.fillStyle=oc; rrect(ctx,x-22,y-30,44,36,8); ctx.fill(); ctx.fillStyle=seal?'#8a5a3a':'#6a7488'; rrect(ctx,x-20,y-28,40,32,7); ctx.fill();
  ctx.fillStyle=seal?'#b07a4a':'#8a96ac'; rrect(ctx,x-20,y-28,40,9,6); ctx.fill();
  ctx.strokeStyle=oc; ctx.lineWidth=2.2; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(x+i*10,y-16); ctx.lineTo(x+i*10,y); ctx.stroke(); }
  if(seal){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+0.2*Math.sin(t*6); ctx.drawImage(foGlowSpr('255,140,60'),x-30,y-44,60,60); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; if(Math.random()<0.15) emit(x+rand(-8,8),y-30,1,{col:'110,100,100',glow:false,ang:-Math.PI/2,spread:0.4,smin:20,smax:50,lmin:.6,lmax:1,zmin:3,zmax:6,grow:8}); }
  else { const q=(t*0.8+v.i*0.25)%1; ctx.fillStyle=`rgba(230,245,255,${0.5*(1-q)})`; ctx.beginPath(); ctx.ellipse(x,y-34-q*30,8+q*12,5+q*6,0,0,TAU); ctx.fill(); if(hk>0.05){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=hk*0.6; ctx.drawImage(foGlowSpr('255,190,120'),x-26,y-40,52,52); } }
  ctx.restore(); }
function f2DrawGreatBellows(D){ const x=D.bel.x, y=D.bel.y, oc=F2OL(), e=G.boss, puff=e&&e.type==='f_bellows'&&(e.state==='inhale'||e.state==='pull'||e.state==='puffW')?1:0, s=1+0.08*puff*Math.sin(G.time*8); ctx.save();
  ctx.fillStyle=oc; rrect(ctx,x-110,y-96*s,220,90*s,14); ctx.fill(); ctx.fillStyle='#8e5a32'; rrect(ctx,x-106,y-92*s,212,82*s,12); ctx.fill();
  ctx.strokeStyle='#5a3a1a'; ctx.lineWidth=3; for(let i=1;i<6;i++){ ctx.beginPath(); ctx.moveTo(x-104,y-92*s+i*14*s); ctx.lineTo(x+104,y-92*s+i*14*s); ctx.stroke(); }
  ctx.fillStyle='#b07a42'; rrect(ctx,x-120,y-104*s,30,100*s,6); ctx.fill(); rrect(ctx,x+90,y-104*s,30,100*s,6); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=2; rrect(ctx,x-120,y-104*s,30,100*s,6); ctx.stroke(); rrect(ctx,x+90,y-104*s,30,100*s,6); ctx.stroke();
  ctx.fillStyle='#4a4e5e'; ctx.fillRect(x-12,y-12,24,16); ctx.restore(); }

// ================= 9. Old Frostfeather, the moth-struck owl (f_frostfeather), boss of Skyreach Temple (the Roost)
// A snow owl as big as a house, moth dust glittering in her eyes. The Roost: an open tower top, a central nest (two
// stone pillars to hide behind from her gale, an updraft grate beside it), four outer platforms on a rim, a wind loop
// round them, two wind vanes (west and east), cloud chasm everywhere else (a fall: 10 percent and back to the edge).
// Phase 1: she perches on the nest. Feather Fan (5 darts), Frost Gale (a push: hide behind a pillar or ride the loop),
//   Swoop (a hoot, a dive at Ash: her talons stick in the stone for 2 s, hit her).
// Phase 2: she flies high (only arrows, the boomerang, the whip, bombs reach her). Snowball bombs, Mothlings. THE WAY IN:
//   stand on the updraft (Wind Riding) to rise level with her for 4 s and Blaze her face 1.2 s: the dust burns out of her
//   eyes, she sneezes and falls onto the nest, dazed 4 s (hits x1.5). Gate: she will not go below 30 percent until then.
// Phase 3: Blizzard Spin: she spins on the nest, the loop runs backwards and the updraft blows out. Hit both vanes to point
//   them back (any swing, shot or bomb): the updraft restarts. Feather Storm rings (jump). Then the trick again, faster.
//   Gate: the last 4 percent needs a daze in phase 3.
f2Lines('f_frostfeather',['f_frostfeather_intro','trial_f_sky_boss'],['f_sky_won','trial_f_sky_won'],
  [['narr',S('The top of the tower is open to the sky. On a nest of sticks and old kite string, as wide as a pond, sits Old Frostfeather, the temple owl. Purple dust glitters in her eyes.','A huge snow owl sits on a nest. Purple dust is in her eyes.')],
   ['f_frostfeather',S('HOO! HOOOOO!','HOO! HOOOO!')],
   ['tove',S('Moth dust in her eyes, Ash. She cannot see who you are. When she flies high, ride the updraft and Blaze it out!','Ride the updraft. Blue fire her eyes!')]],
  [['narr',S("Glittery purple dust pours out of Old Frostfeather's feathers. She sneezes. A whole cloud of little moths shoots out of her beak and flutters away, looking embarrassed.",'Purple dust pours off her. She sneezes out a cloud of moths!')],
   ['f_frostfeather',S('Hoo? Hoooo.','Hoo? Hoooo.')],
   ['narr',S('Her eyes are gold now, round and kind. She tilts her head all the way upside down and looks at you.','Her eyes are gold now. She tilts her head at you.')],
   ['f_pennant',S("(from outside, on his kite) She's back! Her eyes are gold again! Old girl! OLD GIRL!",'She is back! Old girl!')],
   ['narr',S("Frostfeather tucks Brother Pennant under one wing, kite and all, like a chick. He doesn't seem to mind one bit.",'She tucks Brother Pennant under her wing like a chick.')]]);
function f2Ranged(o){ const s=(o&&o.src)||'slash'; return s==='arrow'||s==='boomerang'||s==='proj'||s==='whip'||s==='chain'||s==='glaive'||s==='bomb'||s==='blast'||s==='icicle'||s==='comp'||s==='pip'||s==='ember'; }
// feather darts: fast, straight, chest high (step aside; a jump does not help)
FZK.f2dart={
  tick(z,dt){ const s=z.spd*dt; z.x+=Math.cos(z.ang)*s; z.y+=Math.sin(z.ang)*s; z.d=(z.d||0)+s; const p=player;
    if(!p.dead&&!(typeof p2Shadowed==='function'&&p2Shadowed())&&dist(p.x,p.y,z.x,z.y)<p.r+(z.r||8)){ z.done=true; hurtPlayer(z.dmg,z.x-Math.cos(z.ang)*20,z.y-Math.sin(z.ang)*20,160); return; }
    if(z.d>z.len) z.done=true; },
  tall(z,list){ if(!z.it) z.it={flying:true,draw:()=>f2DrawFeather(z.x,z.y-30,z.ang,1)}; z.it.x=z.x; z.it.y=z.y; list.push(z.it); }
};
function f2DrawFeather(x,y,ang,s){ ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(s,s); ctx.fillStyle='#f6f9ff'; ctx.strokeStyle=F2OL(); ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(12,0); ctx.quadraticCurveTo(0,-6,-12,-2); ctx.lineTo(-14,0); ctx.lineTo(-12,2); ctx.quadraticCurveTo(0,6,12,0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='#a8b8d8'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(-14,0); ctx.stroke(); ctx.fillStyle='#c8b8f0'; ctx.fillRect(-14,-1.5,4,3); ctx.restore(); }
// Feather Fan: a cone (0.6 s), then five darts
FM.f2fan={
  start(e,m){ const o=m.o; e.state='fanW'; e.st=fkW(o,0.6); e.tele=newTele({shape:'cone',len:o.len||520,half:o.half||0.45,dur:e.st,col:F2COL.white}); },
  tick(e,dt,d,a,m){ const o=m.o; if(!m.go){ e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st>0) return false; m.go=true; e.tele=null; e.state='fan'; e.st=0.35;
      const n=o.n||5, h=o.half||0.45; for(let i=0;i<n;i++){ const ang=e.face+(n>1?(i/(n-1)-0.5)*2*h*0.85:0); fzAdd('f2dart',{x:e.x+Math.cos(ang)*e.r,y:e.y+Math.sin(ang)*e.r,ang,spd:o.spd||560,len:o.len||620,dmg:f2Dmg(e,o.dmgN||14),r:8,life:3}); }
      SFX.play('whoosh'); return false; }
    e.st-=dt; return e.st<=0; } };
// Swoop: she hoots (a red line at Ash), dives along it; if she ends over stone her talons stick for 2 s (STUCK)
FM.f2swoop={
  start(e,m){ const o=m.o, p=player; e.state='hoot'; e.st=f2W(o,0.7); m.ang=angTo(e.x,e.y,p.x,p.y); e.face=m.ang; m.len=clamp(dist(e.x,e.y,p.x,p.y)+60,200,o.len||560);
    e.tele=newTele({shape:'line',len:m.len,w:e.r*1.6,dur:e.st,col:F2COL.red}); f2Say(e,'f_frostfeather',S('HOOOOO!','HOOOO!'),6); SFX.play('warn'); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ e.z=lerp(e.z||0,46,Math.min(1,dt*4)); if(e.st>0.2){ m.ang=turnTo(m.ang,a,2*dt); e.face=m.ang; m.len=clamp(dist(e.x,e.y,p.x,p.y)+60,200,o.len||560); if(e.tele){ e.tele.len=m.len; } } e.st-=dt; if(e.st>0) return false;
      m.go=true; m.hit=false; e.tele=null; e.state='dive'; m.d=0; SFX.play('dash'); return false; }
    const s=(o.spd||980)*foeDiff().spd*dt; e.x+=Math.cos(m.ang)*s; e.y+=Math.sin(m.ang)*s; m.d+=s; e.dx=e.dy=0; e.z=lerp(e.z,6,Math.min(1,dt*8)); e.noClip=true;
    if(Math.random()<dt*30) emit(e.x,e.y-e.z,1,{col:'240,248,255',glow:false,ang:m.ang+Math.PI,spread:0.4,smin:40,smax:120,lmin:.2,lmax:.4,zmin:2,zmax:4,drag:2});
    if(!m.hit&&!p.dead&&!f2Up()&&dist(e.x,e.y,p.x,p.y)<e.r+p.r){ if(hurtPlayer(f2Dmg(e,o.dmgN||30),e.x,e.y,360)) m.hit=true; }
    if(m.d<m.len) return false;
    const C=f2Ctx(e); f2Hold(C,e,e.r+10);
    if(f2FloorAt(e.x,e.y)){ e.state='stuck'; e.z=0; e.stuckT=f2Win(2); shake(6); SFX.play('boom'); f2Snow(e.x,e.y,20); f2Txt(e,S('STUCK! Her talons are in the stone! Hit her!','STUCK! Hit her!'),'#ffe066',15); }
    else e.state='recover';
    return true; } };
FM_DEF.f2fan={recover:0.5}; FM_DEF.f2swoop={recover:0.2};
// is there solid floor (not chasm, not a pit) under (x,y)? (outdoors: always)
function f2FloorAt(x,y){ if(!AREA||!AREA.cave) return true; const k=tCell(x,y); if(k<0) return false; try{ return tGround(k)&&!tHole(k); }catch(err){ return !AREA.cave.grid[k]; } }
const FROST_PERCH=FK.brain({move:'hold',turn:2.6,cd:[1.2,2.0],
  moves:[{k:'f2fan',n:5,half:0.45,len:560,dmgN:14,max:700,w:2.2},
         {k:'f2cone',st:'galeW',st2:'gale',windup:0.8,len:440,half:0.55,push:2400,pushT:0.6,dmgN:0,pcol:'240,248,255',col:F2COL.snow,shelter:(x,y,z)=>f2RoostShelter(x,y,z),max:520,w:1.6,every:6},
         {k:'f2swoop',len:560,dmgN:30,min:140,max:620,w:2.2,every:3}]});
const FROST_HIGH=FK.brain({move:'hold',turn:3,cd:[1.4,2.3],
  moves:[{k:'f2spots',st:'bombs',n:3,r:60,windup:1.0,r0:70,r1:200,col:F2COL.snow,max:900,w:2,place:(e,x,y)=>{ f2Snow(x,y,20); SFX.play('pop'); const p=player; if(!p.dead&&!f2Up()&&dist(x,y,p.x,p.y)<60+p.r*0.5) hurtPlayer(f2Dmg(e,22),x,y,220); }},
         {k:'summon',type:'f_mothling',n:2,every:10,windup:0.6,st:'summon',r0:40,r1:120,opt:{aggro:true},max:900,w:1.6,if:e=>countType('f_mothling')<byDiff(3,4,5)}]});
FM_DEF.summon=FM_DEF.summon||{recover:0.5};
f2Foe('f_frostfeather',{boss:true,name:'Old Frostfeather',title:S('the moth-struck owl','the big snow owl'),short:'Old Frostfeather',
  lv:15,hp:5200,r:40,speed:150,dmg:22,value:1400,flying:true,kbRes:0.1,dcol:'235,240,252',phases:[0.65,0.3],
  phaseText:[[S('Up she goes!','Up she goes!'),S('She flies high. Stand on the updraft beside the nest to rise up, then Blaze her eyes!','Stand on the updraft. Blue fire her eyes!'),['f_frostfeather',S('Hoo hoo hoo!','Hoo hoo hoo!')]],
             [S('Blizzard Spin!','Blizzard Spin!'),S('Her whirlwind blew the updraft out! Hit both wind vanes to turn the wind back.','Hit both wind vanes!'),['f_frostfeather',S('HOOOOOOO!','HOOOOO!')]]],
  init(e){ f2BossInit(e); e.mode='perch'; e.z=0; e.dustH=0; e.dazes=[0,0,0]; e.stormT=6; e.orb=rand(0,TAU); },
  onPhase(e,i){ e.mv=null; e.tele=null; e.stuckT=0; e.mode=i===1?'rise':'spinIn'; e.mt=0; e.dustH=0; },
  ai:f2FrostAI,
  onBlaze(e,dt,J){ if(e.dead) return;
    if(e.mode==='high'&&F2.lift){ e.dustH+=dt; e.dustHT=G.time; f2Work(); if(Math.random()<0.5) emit(e.x+rand(-14,14),e.y-e.z-30,1,{col:'200,170,255',glow:true,ang:-Math.PI/2,spread:1,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
      if(e.dustH>=f2Need(e.bph>=2?1.0:1.2)) f2FrostSneeze(e); return; }
    if(e.mode==='high'&&!(e._bzT>G.time)){ e._bzT=G.time+2.5; f2Txt(e,S('Too far up! Ride the updraft, then Blaze her eyes!','Too high! Ride the updraft!'),'#e8f0ff',13); } },
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    const high=e.mode==='high'||e.mode==='rise'||e.mode==='spin'||e.mode==='spinIn'||e.mode==='takeoff'||e.mode==='return';
    if(high&&!(F2.lift&&e.mode==='high')){ if(f2Ranged(o)) a=amt; else if(h.fire) a=amt*0.5; else { if(!(e._hiT>G.time)){ e._hiT=G.time+2.2; f2Txt(e,e.bph===0?S('She is in the air! Wait till she lands.','She is up high!'):S('Too high! Arrows reach her. Or ride the updraft and Blaze her eyes!','Too high! Use arrows, or the updraft!'),'#e8f0ff',12); } return false; } }
    if(e.mode==='dizzy') a=amt*1.5;
    const ph=e.bph||0;
    if(ph===1) a=f2Gate(e,a,o,0.3,e.dazes[1]>=byDiff(1,1,2),S('She shakes it off! Ride the updraft and Blaze her eyes!','Ride the updraft! Blue fire!'));
    if(ph===2) a=f2Gate(e,a,o,0.04,e.dazes[2]>=1,S('She will not fall! Fix the vanes, ride the updraft, Blaze her eyes!','Fix the vanes! Then the updraft!'));
    return a; },
  draw3d:f2FigOwl, draw2d:f2Owl2,
  sheet:f2Sheet([{state:'chase',mode:'perch',label:'perched'},{state:'chase',mode:'high',z:120,label:'flying'},{state:'fanW',mode:'perch',st:0.3,at:0.3,label:'feather fan'},{state:'galeW',mode:'perch',st:0.4,at:0.4,label:'frost gale'},
    {state:'hoot',mode:'perch',z:40,st:0.3,at:0.3,label:'hoot'},{state:'dive',mode:'perch',z:6,label:'swoop'},{state:'stuck',mode:'perch',z:0,label:'stuck'},{state:'chase',mode:'perch',get lastHit(){ return (G?G.time:0)-0.05; },label:'hurt'},
    {state:'dizzy',mode:'dizzy',z:0,label:'dazed'},{state:'spin',mode:'spin',z:10,label:'blizzard spin'},{state:'chase',mode:'perch',deathT:0.3,label:'death'}])});
// the room's pieces (or, out of a room, the ring of her fight)
function f2FrostSpot(e){ const D=f2RoomOf(e); if(D) return D; const C=f2Ctx(e); return {nest:{x:C.cx,y:C.cy},up:{x:C.cx,y:C.cy+96},pillars:[],vanes:[],cw:true,upOn:true,orbR:Math.min(220,C.R*0.5)}; }
function f2FrostSneeze(e){ e.dazes[e.bph||0]++; e.dustH=0; e.mv=null; e.tele=null; e.mode='fall'; e.mt=0; e.state='fall';
  SFX.play('boom'); shake(8); f2Txt(e,S('A-A-ACHOO! The dust is out! She falls!','ACHOO! She falls!'),'#ffe066',16); f2Say(e,'f_frostfeather',S('HOO?!','HOO?!'),3);
  for(let i=0;i<12;i++) emit(e.x,e.y-e.z-30,1,{col:'200,170,255',glow:true,smin:40,smax:200,lmin:.4,lmax:.9,zmin:1.5,zmax:3.5});
  if(F2.lift) F2.lift.t=Math.min(F2.lift.t,0.35); }
function f2FrostAI(e,dt,p){
  p=p||player; const D=f2FrostSpot(e), N=D.nest, Df=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0; e.noClip=true; e.flying=true; e.mt=(e.mt||0)+dt;
  if(e.dustH>0&&G.time-(e.dustHT||0)>1.5) e.dustH=Math.max(0,e.dustH-dt*0.5);
  const fly=(x,y,spd,z)=>{ steer(e,x,y,spd*Df.spd); e.noClip=true; if(z!=null) e.z=lerp(e.z||0,z,Math.min(1,dt*2.5)); if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),3*dt); };
  const land=(z)=>{ e.z=lerp(e.z||0,z||0,Math.min(1,dt*5)); };
  // stuck after a swoop, then back to the nest
  if(e.state==='stuck'){ e.stuckT-=dt; land(0); if(e.stuckT<=0){ e.state='chase'; e.mode='return'; e.mt=0; f2Say(e,'f_frostfeather',S('Hoo! Hoo!','Hoo!'),5); } return; }
  switch(e.mode){
    case 'perch': { const dd=dist(e.x,e.y,N.x,N.y); if(dd>8&&!e.mv){ fly(N.x,N.y,e.speed,0); return; } FROST_PERCH(e,dt,p); if(!e.mv) land(0); bossCad(e,1); return; }
    case 'return': fly(N.x,N.y,e.speed*1.6,24); if(dist(e.x,e.y,N.x,N.y)<16){ e.mode=e.bph>=1?'takeoff':'perch'; e.mt=0; e.cd=0.6; } return;
    case 'rise': e.state='takeoff'; fly(N.x,N.y-10,e.speed,60); if(e.mt>1.2){ e.mode='high'; e.mt=0; e.cd=1; } return;
    case 'takeoff': e.state='takeoff'; e.z=lerp(e.z||0,120,Math.min(1,dt*2)); if(e.mt>0.9){ e.mode='high'; e.mt=0; e.cd=0.8; } return;
    case 'high': {
      // she circles the nest; with Ash up in the updraft she drifts closer (so the jet reaches her)
      const up=!!F2.lift, rr=up?(D.orbR||220)*0.62:(D.orbR||220), sp=(e.bph>=2?0.7:0.5)*(up?0.5:1);
      e.orb+=dt*sp*Df.spd; const tx=N.x+Math.cos(e.orb)*rr, ty=N.y+Math.sin(e.orb)*rr*0.8;
      if(e.bph>=2&&!e.mv&&e.state==='chase'){ e.stormT-=dt*Df.atk; if(e.stormT<=0){ e.stormT=byDiff(9,7.5,6); f2FrostStorm(e,N); } }
      FROST_HIGH(e,dt,p); if(!e.mv&&e.state==='chase') fly(tx,ty,e.speed*1.4,120); else { e.dx=e.dy=0; e.z=lerp(e.z||0,120,Math.min(1,dt*2)); } bossCad(e,1); return; }
    case 'fall': e.state='fall'; fly(N.x,N.y,e.speed*2,0); e.z=Math.max(0,(e.z||0)-dt*260);
      if(e.z<=2&&dist(e.x,e.y,N.x,N.y)<30){ e.mode='dizzy'; e.mt=0; e.state='dizzy'; e.dizzyT=f2Win(e.bph>=2?3:4); shake(9); SFX.play('boom'); f2Snow(e.x,e.y,26); } return;
    case 'dizzy': e.state='dizzy'; land(0); e.dizzyT-=dt; if(Math.random()<dt*6) emit(e.x+rand(-20,20),e.y-50,1,{col:'255,230,120',glow:true,smin:10,smax:40,lmin:.4,lmax:.7,zmin:1.5,zmax:2.5});
      if(e.dizzyT<=0){ f2Txt(e,S('She shakes her head and flies up again!','She flies up again!'),'#e8f0ff',13); if(e.bph>=2&&!foeDiff().easy){ e.mode='spinIn'; } else { e.mode='takeoff'; } e.mt=0; } return;
    case 'spinIn': fly(N.x,N.y,e.speed*1.6,10); if(dist(e.x,e.y,N.x,N.y)<14){ e.mode='spin'; e.mt=0; f2Mark({shape:'donut',x:N.x,y:N.y,r1:60,r2:300,dur:f2W({},1.0),col:F2COL.snow}); SFX.play('warn'); } return;
    case 'spin': { e.state='spin'; e.face+=dt*14; land(10); const T=f2W({},1.0);
      if(e.mt>T&&!e.spun){ e.spun=true; f2RoostReverse(D,e); const q=player; if(!q.dead&&!f2Up()){ const dd=dist(q.x,q.y,N.x,N.y); if(dd>60&&dd<300+q.r){ const aa=angTo(N.x,N.y,q.x,q.y); q.kvx+=Math.cos(aa)*620; q.kvy+=Math.sin(aa)*620; if(AREA&&AREA.tri) AREA.tri.pushed=true; hurtPlayer(f2Dmg(e,16),N.x,N.y,0); } } }
      if(Math.random()<dt*30){ const q=rand(0,TAU), r2=rand(30,220); emit(N.x+Math.cos(q)*r2,N.y+Math.sin(q)*r2*0.8,1,{col:'240,248,255',glow:false,ang:q+1.7,spread:0.2,smin:140,smax:260,lmin:.3,lmax:.6,zmin:1.4,zmax:2.6,drag:1}); }
      if(e.mt>T+1.6){ e.spun=false; e.mode='takeoff'; e.mt=0; e.stormT=3; } return; }
    default: e.mode='perch';
  }
}
// Feather Storm: a ring of feathers out from the nest (jump it)
function f2FrostStorm(e,N){ f2Say(e,'f_frostfeather',S('HOOOOO!','HOOOO!'),5); f2Mark({x:N.x,y:N.y,r:50,dur:0.7,col:F2COL.white}); f2Wave(N.x,N.y,{dmg:f2Dmg(e,20),max:520,spd:320,thick:20,col:F2COL.white,wait:0.7}); SFX.play('whoosh'); }
// the gale: a nest pillar between her and Ash shelters him
function f2RoostShelter(x,y,z){ const e=G.boss; if(!e||e.type!=='f_frostfeather') return false; const D=f2RoomOf(e); if(!D) return false;
  for(const q of D.pillars){ if(segD(q.x,q.y,e.x,e.y,x,y)<q.r+12&&dist(x,y,e.x,e.y)>dist(q.x,q.y,e.x,e.y)) return true; } return false; }
// phase 3: the whirlwind turns the loop backwards, blows out the updraft and spins both vanes the wrong way
function f2RoostReverse(D,e){ if(!D||!D.vanes) return; D.cw=false; D.upOn=false; for(const v of D.vanes){ v.ok=false; v.spin=1; } F2.lift=null;
  f2Txt(e,S('The whirlwind blows the updraft out! Hit both wind vanes!','Hit both wind vanes!'),'#cfeaff',15); shake(6); f2Tove(S('The vanes, Ash! Turn the wind back!','Hit the vanes!'),10);
  f2Tip('ff_vanes',S('Wind vanes','Wind vanes'),S('Hit a wind vane (a swing, an arrow, the boomerang, the whip or a bomb) to point it back. Both back: the updraft blows again.','Hit both vanes!')); }
function f2RoostCW(){ const D=F2.rooms.find(q=>q.type==='f_frostfeather'); return !D||D.cw!==false; }
// ---- the updraft lift: standing on the grate with Wind Riding lifts Ash level with her for 4 s (6 on Easy)
{ const base=updatePlayer; updatePlayer=function(dt,inp){ const L=F2.lift, p=player;
    if(!L||!G||!p) return base(dt,inp);
    L.t-=dt; if(L.t<=0||p.dead||G.mode!=='story'){ F2.lift=null; p.vz=-40; return base(dt,inp); }
    const q=Object.assign({},inp||{},{jump:false,jumpHeld:false,roll:false,sprint:false,attack:false,use:false,mx:((inp&&inp.mx)||0)*0.5,my:((inp&&inp.my)||0)*0.5});
    const r=base(dt,q);
    const d=dist(p.x,p.y,L.x,L.y); if(d>L.r){ const a=angTo(L.x,L.y,p.x,p.y); p.x=L.x+Math.cos(a)*L.r; p.y=L.y+Math.sin(a)*L.r; }
    L.z+=(L.z1-L.z)*Math.min(1,dt*3); p.z=L.z+Math.sin(G.time*3)*3; p.vz=0; p.kvx=p.kvy=0; p.slam=false;
    if(Math.random()<dt*20) emit(p.x+rand(-24,24),p.y,1,{col:'235,246,255',glow:false,ang:-Math.PI/2,spread:0.3,smin:80,smax:160,lmin:.3,lmax:.6,zmin:1.4,zmax:2.6,drag:1,alpha:0.7});
    return r; }; }
function f2LiftStart(x,y,t){ const p=player; F2.lift={x,y,r:46,t,T:t,z:Math.max(4,p.z||0),z1:96}; p3Snd&&p3Snd('wind'); ftext(p.x,p.y-60,S('Whoosh! Up you go! Now Blaze her eyes!','Up you go! Blue fire!'),'#e8f6ff',14); }
// ---- the Roost (room decor): the nest and its two pillars, the updraft grate, the wind loop, two vanes
F2ROOMK.f_frostfeather={
  build(R,A){ const cs=A.cave.cell, D={R,nest:{x:R.cx,y:R.cy},up:{x:R.cx,y:R.cy+2*cs},pillars:[],vanes:[],cw:true,upOn:true,orbR:Math.min(240,(R.y1-R.y0)*0.24),upCd:0,puffT:0};
    for(const sd of [-1,1]){ const q={x:R.cx+sd*2.4*cs,y:R.cy-0.4*cs,r:17}; q.col=addAreaCol({t:'c',x:q.x,y:q.y,r:q.r}); D.pillars.push(q); }
    for(const [c,r,id] of [[2.2,11,'w'],[27.8,11,'e']]){ const p=f2RC(R,c,r), v={k:'f2vane',x:p.x,y:p.y,r:22,id,ok:true,spin:0,hitT:0,
        onHit(src){ if(v.hitT>G.time) return true; v.hitT=G.time+0.35; v.spin=1; SFX.play('block'); if(!v.ok){ v.ok=true; ftext(v.x,v.y-70,S('The vane turns back!','Turned back!'),'#dff0ff',13); f2RoostVaneCheck(D); } else ftext(v.x,v.y-70,S('Clonk!','Clonk!'),'#dff0ff',11); return true; }};
      A.objs.push(v); D.vanes.push(v); addAreaCol({t:'c',x:v.x,y:v.y,r:10}); }
    // the wind loop round the outer platforms (clockwise; while her whirlwind blows, the other way)
    try{ const C=p3Cave(A), el=(t)=>f2RC(R,15+Math.cos(t)*11,11+Math.sin(t)*8), q4=k=>{ const pts=[]; for(let i=0;i<=3;i++){ const w=el(-Math.PI/2+k*Math.PI/2+i*Math.PI/6); pts.push([w.x,w.y]); } return pts; };
      for(let k=0;k<4;k++){ const pts=q4(k); C.ribbons.push(p3Stream({id:`f2roost_cw${k}`,pts,w:1.3*cs,speed:440,room:R.id,cave:true,on:()=>D.cw!==false}));
        C.ribbons.push(p3Stream({id:`f2roost_ccw${k}`,pts:pts.slice().reverse(),w:1.3*cs,speed:440,room:R.id,cave:true,on:()=>D.cw===false})); } }catch(err){ console.error(err); }
    return D; },
  tick(D,dt){ const p=player, e=G.boss&&G.boss.type==='f_frostfeather'&&!G.boss.dead&&G.boss.f2room===D.R?G.boss:null;
    for(const v of D.vanes) if(v.spin>0) v.spin-=dt*2.5;
    if(D.upCd>0) D.upCd-=dt; if(D.puffT>0) D.puffT-=dt;
    if(!e){ D.cw=true; D.upOn=true; for(const v of D.vanes) v.ok=true; return; }
    // the updraft: Ash on the grate rises (with Wind Riding)
    if(D.upOn&&!F2.lift&&D.upCd<=0&&!p.dead&&dist(p.x,p.y,D.up.x,D.up.y)<34&&!airborne()){
      if(canWindride()){ D.upCd=1.2; f2LiftStart(D.up.x,D.up.y,f2Win(4)); f2Tip('ff_lift',S('The updraft','The updraft'),S('The warm wind holds you up for a few seconds. Turn to face her and Blaze her eyes!','Face her. Blue fire!')); }
      else if(D.puffT<=0){ D.puffT=2; ftext(p.x,p.y-50,S('Warm air rushes up. It nearly lifts you. Nearly.','Warm air. Not strong enough.'),'#e8f6ff',12); } } },
  ground(D,t){ const N=D.nest, oc=F2OL(); ctx.save();
    // the nest: a ring of sticks and old kite string
    ctx.fillStyle='rgba(60,40,30,.28)'; ctx.beginPath(); ctx.ellipse(N.x,N.y+6,150,120,0,0,TAU); ctx.fill();
    ctx.lineCap='round'; for(let i=0;i<40;i++){ const a=i*0.157+Math.sin(i*7.3)*0.2, r0=100+((i*37)%30), x=N.x+Math.cos(a)*r0, y=N.y+Math.sin(a)*r0*0.8, b=a+1.4+((i*13)%10)/10; ctx.strokeStyle=i%3?'#8a6440':'#a8804e'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x-Math.cos(b)*22,y-Math.sin(b)*14); ctx.lineTo(x+Math.cos(b)*22,y+Math.sin(b)*14); ctx.stroke(); }
    ctx.strokeStyle='rgba(240,120,90,.7)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(N.x,N.y+2,112,88,0.3,0.4,2.2); ctx.stroke(); ctx.strokeStyle='rgba(120,180,240,.7)'; ctx.beginPath(); ctx.ellipse(N.x,N.y+2,104,82,-0.2,3.4,5.1); ctx.stroke();
    // the updraft grate
    const U=D.up, on=D.upOn; ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(U.x,U.y,34,20,0,0,TAU); ctx.fill(); ctx.fillStyle=on?'#7a8aa0':'#5a5e6a'; ctx.beginPath(); ctx.ellipse(U.x,U.y,31,17,0,0,TAU); ctx.fill();
    ctx.strokeStyle=oc; ctx.lineWidth=2; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(U.x+i*10,U.y-15+Math.abs(i)*2); ctx.lineTo(U.x+i*10,U.y+15-Math.abs(i)*2); ctx.stroke(); }
    if(on){ ctx.globalAlpha=0.6; for(let i=0;i<3;i++){ const q=(t*0.9+i/3)%1; ctx.strokeStyle=`rgba(235,246,255,${0.8*(1-q)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(U.x,U.y-q*80,20+q*16,8+q*4,0,0,TAU); ctx.stroke(); } ctx.globalAlpha=1; }
    ctx.restore(); },
  tall(D,list){ for(const q of D.pillars){ if(!q.it) q.it={x:q.x,y:q.y+6,draw:()=>f2DrawRoostPillar(q)}; list.push(q.it); }
    for(const v of D.vanes){ if(!v.it) v.it={x:v.x,y:v.y+6,draw:()=>f2DrawVane(v,D)}; list.push(v.it); } }
};
function f2RoostVaneCheck(D){ if(D.vanes.every(v=>v.ok)&&D.cw===false){ D.cw=true; D.upOn=true; SFX.play('shrine'); setBanner(S('The wind turns back!','The wind turns back!'),S('The updraft blows again. Ride it up!','The updraft is back!'),2.4); } }
function f2DrawRoostPillar(q){ const x=q.x, y=q.y, oc=F2OL(), h=96; ctx.save(); ctx.fillStyle='rgba(20,30,50,.25)'; ctx.beginPath(); ctx.ellipse(x,y+4,22,9,0,0,TAU); ctx.fill();
  ctx.fillStyle=oc; rrect(ctx,x-19,y-h-4,38,h+8,8); ctx.fill(); ctx.fillStyle='#b8b0a4'; rrect(ctx,x-16,y-h,32,h,6); ctx.fill(); ctx.fillStyle='#d8d2c8'; rrect(ctx,x-16,y-h,12,h,6); ctx.fill();
  ctx.fillStyle='#e8e2d8'; ctx.beginPath(); ctx.ellipse(x,y-h,17,7,0,0,TAU); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#f4f8ff'; ctx.beginPath(); ctx.ellipse(x,y-h-2,15,5,0,0,TAU); ctx.fill(); ctx.restore(); }
function f2DrawVane(v,D){ const x=v.x, y=v.y, oc=F2OL(), t=G.time, ok=v.ok, rot=(ok?(v.id==='w'?0:Math.PI):(v.id==='w'?Math.PI:0))+(v.spin>0?Math.sin(v.spin*12)*0.6:0); ctx.save();
  ctx.fillStyle='rgba(20,30,50,.22)'; ctx.beginPath(); ctx.ellipse(x,y+3,14,6,0,0,TAU); ctx.fill();
  ctx.strokeStyle=oc; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y-64); ctx.stroke(); ctx.strokeStyle='#8a7a6a'; ctx.lineWidth=3.4; ctx.stroke();
  ctx.translate(x,y-64); const c=Math.cos(rot); ctx.fillStyle=ok?'#e8d070':'#e86050'; ctx.strokeStyle=oc; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(c*30,0); ctx.lineTo(c*14,-9); ctx.lineTo(c*14,-3); ctx.lineTo(-c*24,-3); ctx.lineTo(-c*30,-10); ctx.lineTo(-c*28,0); ctx.lineTo(-c*30,10); ctx.lineTo(-c*24,3); ctx.lineTo(c*14,3); ctx.lineTo(c*14,9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#f4ecd8'; ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill(); ctx.stroke();
  if(!ok){ ctx.globalAlpha=0.6+0.4*Math.sin(t*8); ctx.fillStyle='#ffe066'; ctx.font=`900 16px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeText('!',0,-18); ctx.fillText('!',0,-18); }
  ctx.restore(); }
// ---- her look: a snow owl as big as a house, frost-white feathers tipped with silver, a tuft that sticks up when angry,
// violet moth dust glittering in her eyes (gold once it is out)
function f2FigOwl(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.f_frostfeather.r)/40*2.0, face=t3Turn(e,e.face,st==='spin'?40:5), fx=e.x, fy=e.y+e.r*0.4, inS=foSt(e), dead=foDeath(e), hurt=f2Hurt(e);
  const air=(e.z||0)>14||st==='dive'||st==='hoot'||st==='takeoff'||e.mode==='high', zf=(e.z||0)/k;
  const wh=fl?'#ffffff':foT(e,'#f2f6fc'), whD=foT(e,'#c8d4e8'), sil='#a8b4cc', vio='#c8a8ff';
  let flap=air?Math.sin(t*(st==='dive'?4:8)):0, spread=air?1:0, fan=0, gale=0, hoot=0, dizzy=st==='dizzy'?1:0;
  if(st==='fanW') fan=f2Sm(clamp(inS/0.6,0,1)); else if(st==='fan') fan=1; else if(st==='galeW'){ gale=f2Sm(clamp(inS/0.8,0,1)); spread=Math.max(spread,0.6*gale); } else if(st==='gale'){ gale=1; spread=1; flap=Math.sin(t*16); }
  if(st==='hoot') hoot=1; if(st==='dive'){ spread=0.4; flap=0; } if(st==='stuck') spread=0.7;
  const P=foEase(e,'_fow',foTg(spread,fan,gale,hoot),dt,8); spread=P[0]; fan=P[1]; gale=P[2]; hoot=P[3];
  foShadow(e.x,e.y+4,30*k*(air?0.8:1),air?0.25:0.4);
  foBegin(fx,fy,face,k,fl,zf);
  if(dead) foSet(FOB,0,-0.6*dead,0.3*dead,0,0,0,-4*dead); else if(dizzy) foSet(FOB,0,0,Math.sin(t*5)*0.12,0); else if(st==='dive') foSet(FOB,6,0.5,0,0);
  // talons
  foLow(); for(const sd of [-1,1]){ foN(1,sd*4,6,2,sd*4,0.6,1.4,'#e0b050'); for(let i=-1;i<=1;i++) foN(2,sd*4,0.6,5,sd*4+i*1.6,0,0.8,'#5a4a3a'); }
  foUp(); foSet(FOA,8,-hurt*0.1+hoot*-0.1,0,0);
  // body: a big soft egg, silver speckles
  foE(0,0,16,12,11.5,14,wh); foE(3,0,14,9,9.5,11,'#ffffff',0,0,0,0.01);
  for(let i=0;i<9;i++){ const a=i*0.7, zz=8+((i*5)%14); foD(5+Math.cos(a)*3,Math.sin(a)*7,zz,0.9,sil,0.03); }
  // wings: folded along her sides, or spread wide (flapping)
  for(const sd of [-1,1]){ const sp=spread, fa=flap*0.6, wx=-2, wy=sd*(9+sp*20), wz=20+sp*(4+fa*10), tipY=sd*(10+sp*44), tipZ=10+sp*(10+fa*16)+(1-sp)*2;
    foQ([4,sd*9,24, wx,wy,wz, -6,tipY,tipZ, -12,sd*(8+sp*18),6+sp*4, -4,sd*10,8],whD,sil,-0.02);
    foQ([2,sd*9.5,22, wx,wy*0.96,wz-1, -6,tipY*0.94,tipZ-1, -8,sd*9,10],wh,null,-0.01);
    for(let i=0;i<4;i++){ const u=0.35+i*0.18; foN(lerp(wx,-6,u),lerp(wy,tipY,u),lerp(wz,tipZ,u),lerp(wx,-6,u)-5,lerp(wy,tipY,u)+sd*sp*2,lerp(wz,tipZ,u)-4,1,sil,-0.01); } }
  // tail
  foQ([-10,-4,10, -10,4,10, -17,5,4, -17,-5,4],whD,sil,-0.03);
  // head: round, a white face disc, the beak, two big eyes and the ear tufts (up when she is angry)
  const hz=33, ang=e.bph>=2||st==='hoot'||st==='galeW';
  foE(2,0,hz,10,11,9,wh); foE(8,0,hz-1,3,8.6,7.4,'#ffffff',0,0,0,0.02);
  for(const sd of [-1,1]){ const gold=dead>0||st==='dizzy'; foD(10.2,sd*3.9,hz+1,3.1,'#2a2238',0.02); foD(10.4,sd*3.9,hz+1.1,2.6,gold?'#ffd050':vio,0.03); foD(10.6,sd*3.9,hz+1.1,1.2,'#1e1428',0.04); foD(10.7,sd*3.4,hz+1.9,0.6,'#ffffff',0.05); if(!gold) foGlow(10.4,sd*3.9,hz+1,4,'200,160,255',0.35,true);
    if(!gold&&!fl&&Math.random()<0.2) foD(10.6+rand(-1,1),sd*3.8+rand(-2,2),hz+1+rand(-1.5,1.5),0.5,'#ffffff',0.06);
    foC(3,sd*6,hz+6,2,sd*(ang?7.4:7),hz+(ang?14:10),1.8,whD,0.02); }
  foC(10.8,0,hz-1.6,13.6,0,hz-4,1.4,'#e0b050',0.05);
  if(hoot) foE(11.2,0,hz-4.4,1.4,1.8,1.4,'#3a2a2a',0,0,0,0.06);
  if(st==='spin') foGlow(0,0,20,30,'235,245,255',0.4,false);
  foEnd(20); e._t3top=foTop(fy,48,k,zf);
}
function f2Owl2(e,fl){ const x=e.x, y=e.y-(e.z||0)*0.8, r=e.r0||e.r, f=e.face, air=(e.z||0)>14, sp=air?1:0.2, w=air?Math.sin((e.t||0)*8)*0.3:0; ctx.save();
  ctx.fillStyle='rgba(20,30,60,.22)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+r*0.4,r*1.1,r*0.42,0,0,TAU); ctx.fill(); ctx.translate(x,y); ctx.rotate(f);
  for(const s of [-1,1]) f2E2(-r*0.2,s*r*(0.5+sp*0.8),r*0.7,r*(0.3+sp*0.25+w*0.2),fl?'#fff':'#dfe6f2',s*0.3,2);
  f2E2(0,0,r*0.75,r*0.7,fl?'#fff':'#f2f6fc',0,2.2); f2E2(r*0.45,0,r*0.3,r*0.42,'#ffffff',0,1.4);
  const gold=e.state==='dizzy'; for(const s of [-1,1]) f2Eye2(r*0.52,s*r*0.18,r*0.12,0,gold?'#ffd050':'#c8a8ff');
  ctx.fillStyle='#e0b050'; ctx.beginPath(); ctx.moveTo(r*0.75,-3); ctx.lineTo(r*0.92,0); ctx.lineTo(r*0.75,3); ctx.fill(); ctx.restore(); }
// the Roost (2x2): a nest in the middle, four outer platforms on a rim walkway, an old stone bridge from the south
// platform to the nest, cloud chasm everywhere else
F2_TPL.roost=f2Tpl(31,23,(i,j)=>{ if(Math.min(i,30-i)+Math.min(j,22-j)<2) return '#';   // small corners: the rim walk goes all the way round
  const nest=((i-15)/3.4)**2+((j-11)/3.1)**2<=1, plat=[[15,3,2.4,2.2],[26,11,2.9,2.6],[15,19,2.4,2.2],[4,11,2.9,2.6]].some(([c,r,a,b])=>((i-c)/a)**2+((j-r)/b)**2<=1);
  const rim=i<=1||i>=29||j<=1||j>=21, bridge=i>=14&&i<=16&&j>=13&&j<=18; return nest||plat||rim||bridge?'.':':'; });

// ================= 10. King Grumblehorn, the Stonehorn King (f_grumblehorn), boss of Stonehorn Deep (the Stone Throne)
// A mountain ram the size of a barn: wool like grey stone, huge curled horns ringing with violet light, three plates of
// moth-frost armour along his back, an icicle beard. The Stone Throne: a long hall, four drum stones in the corners,
// six drum pillars across the middle (three up in each drum state), a pound switch on the west and east walls.
// Phase 1: Charge (a red line that tracks, then 620 px/s). If he hits a raised pillar his horns STICK for 3 s: jump onto
//   his back and Ground Pound: one armour plate cracks (each plate gone: +25 percent damage). Pound a switch to swap the
//   pillars into his path. Horn Sweep (a white arc). Gate: he stays above 65 percent until a plate is gone.
// Phase 2: Leap Quake (a shadow under Ash, then two quake rings: jump them). POUND BACK: a Ground Pound landing just as he
//   lands sends a ring that cancels his and makes him wobble. Gate: 35 percent until two plates are gone.
// Phase 3: Rockslide: he rams the walls and stalactites fall. Pound a drum stone while he is near it: the drum ring
//   knocks him onto his back for 5 s (hits x2, and a pound on him cracks a plate). Gate: the last 4 percent needs one.
f2Lines('f_grumblehorn',['f_grumblehorn_intro','trial_f_deep_boss'],['f_deep_won','trial_f_deep_won'],
  [['narr',S('At the end of the long hall, on a throne of stone, sits a ram the size of a barn. His horns ring with purple light. Three plates of purple ice run along his back.','A huge ram sits on a stone throne. His horns glow purple.')],
   ['f_grumblehorn',S("HRRRMPH! Get off my lawn! I don't have a lawn! Get off it anyway!",'HRRRMPH! Get off my lawn!')],
   ['tove',S('Pillars, Ash! Make him charge into one. Then up on his back and POUND!','Make him hit a pillar. Then POUND!')]],
  [['narr',S("King Grumblehorn's horns stop glowing purple. He sits down so hard the whole room bounces.",'His horns stop glowing. He sits down. BOUNCE!')],
   ['f_grumblehorn',S("Hrrrrmph. My head. Who's been banging on my head?",'Hrrmph. My head.')],
   ['ash',S('Me. Sorry.','Me. Sorry.')],
   ['f_grumblehorn',S("Hrm. Good drumming. VERY good. Haven't heard drumming like that since the old days.",'Good drumming! VERY good.')],
   ['f_grumblehorn',S("You want the Dreadgate? Climb to the Drum Stone on the mountain's shoulder. Knock like that, and she'll open.",'Climb to the Drum Stone. Knock like that!')],
   ['ash',S('She?','She?')],
   ['f_grumblehorn',S('The Gate. Or the dragon. One of them. Both are very old ladies. Both are very cold. Hrrrmph. Off you go.','The Gate. Or the dragon. Off you go.')]]);
// Leap Quake: he crouches, leaps (a shadow circle on Ash's spot), lands with two quake rings
FM.f2leap={
  start(e,m){ e.state='leapW'; e.st=f2W({},0.35); m.ph=0; SFX.play('warn'); },
  tick(e,dt,d,a,m){ const p=player;
    if(m.ph===0){ e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(e.st>0) return false; m.ph=1; m.x0=e.x; m.y0=e.y; const C=f2Ctx(e), q=f2Hold(C,{x:p.x,y:p.y},e.r+10); m.x=q.x; m.y=q.y; m.T=f2W({},1.0); m.t=0; e.state='leap'; e.tele=null;
      m.z=f2Mark({x:m.x,y:m.y,r:96,dur:m.T,col:F2COL.orange}); SFX.play('dash'); return false; }
    if(m.ph===1){ m.t+=dt; const u=clamp(m.t/m.T,0,1); e.x=lerp(m.x0,m.x,u); e.y=lerp(m.y0,m.y,u); e.dx=e.dy=0; e.z=Math.sin(u*Math.PI)*170; e.noClip=true; if(u<1) return false;
      m.ph=2; e.z=0; e.state='land'; e.st=0.5; e.landT=G.time; shake(12); SFX.play('boom'); f2Snow(e.x,e.y,30);
      if(!p.dead&&!f2Up()&&dist(p.x,p.y,e.x,e.y)<96+p.r*0.5) hurtPlayer(f2Dmg(e,30),e.x,e.y,380);
      e.quakes=[f2Wave(e.x,e.y,{dmg:f2Dmg(e,22),max:460,spd:300,thick:20,col:F2COL.orange}),f2Wave(e.x,e.y,{dmg:f2Dmg(e,22),max:460,spd:300,thick:20,col:F2COL.orange,wait:0.45})];
      if(P3&&P3.lastPound&&G.time-P3.lastPound.t<f2PoundBackWin()) f2PoundBack(e);
      return false; }
    e.st-=dt; return e.st<=0; } };
FM_DEF.f2leap={recover:0.6};
const GRUMBLE_AI=FK.brain({move:'approach',stop:110,turn:2.2,cd:[1.0,1.6],recoverMove:0.2,pre:f2GrumPre,
  moves:[{k:'f2charge',len:560,lw:96,windup:0.8,spd:620,time:1.1,dmgN:34,kb:420,min:170,max:900,w:3,dust:'200,195,185',onAim:(e,m)=>{ f2Say(e,'f_grumblehorn',S('HRRRMPH!','HRRMPH!'),6); },onBump:(e,m,what)=>f2GrumBump(e,what)},
         {k:'slash',st:'sweepW',reach:140,half:1.1,windup:0.6,track:2.4,lunge:80,dmgN:26,kb:340,col:F2COL.white,max:170,w:2.4},
         {k:'f2leap',ph:1,min:120,max:900,w:2.4,every:5}]});
function f2PoundBackWin(){ return foeDiff().easy?0.45:0.25; }
function f2PoundBack(e){ if(e.dead||e.pbDone===e.landT) return; e.pbDone=e.landT; for(const z of e.quakes||[]) z.done=true; e.quakes=null; e.pounds=(e.pounds||0)+1;
  e.mv=null; e.tele=null; e.state='dizzy'; e.st=f2Win(1.5); e.wobT=e.st; shake(8); SFX.play('block');
  f2Wave(player.x,player.y,{dmg:0,max:300,spd:520,thick:14,col:F2COL.gold,ledge:false}).hitP=true;
  f2Txt(e,S('POUND BACK! His quake is cancelled! He wobbles!','POUND BACK! He wobbles!'),'#ffd27a',16); f2Say(e,'f_grumblehorn',S('My HORNS!','My HORNS!'),4); }
p3OnPound(info=>{ const e=G&&G.boss; if(!e||e.dead||e.type!=='f_grumblehorn') return;
  if(info.drum){ f2GrumDrum(e,info); return; }
  if(e.landT&&G.time-e.landT<f2PoundBackWin()&&e.state==='land') f2PoundBack(e); });
f2Foe('f_grumblehorn',{boss:true,name:'King Grumblehorn',title:S('the Stonehorn King','the ram king'),short:'King Grumblehorn',
  lv:16,hp:6400,r:44,speed:110,dmg:24,value:1400,kbRes:0.05,dcol:'190,180,165',phases:[0.65,0.35],
  phaseText:[[S('Leap Quake!','Leap Quake!'),S('He leaps! Jump his quake rings. Ground Pound just as he lands to POUND BACK!','Jump the rings! Pound as he lands!'),['f_grumblehorn',S('HRRRRMPH! Stamp stamp STAMP!','HRRMPH! STAMP!')]],
             [S('Rockslide!','Rockslide!'),S('He rams the walls! Pound a drum stone when he is near it to knock him on his back!','Pound a drum when he is near!'),['f_grumblehorn',S('Get OFF it! Get off my... everything!','Get OFF!')]]],
  init(e){ f2BossInit(e); e.plates=3; e.crackT=-9; e.flips=0; e.pounds=0; e.ramT=6; },
  onPhase(e,i){ if(i===2){ e.ramT=2; f2Tip('gh_drum',S('Drum stones','Drum stones'),S('Ground Pound beside a drum stone in a corner. If he is near it, the ring knocks him onto his back!','Pound a drum when he is near!')); } },
  ai:GRUMBLE_AI,
  onPound(e,info){ if(info.drum) return; const open=e.state==='stuck'||e.state==='stagger'; if(!open||info.d>e.r+46) return;
    if(e.plates>0&&e.crackWin!==e.openN){ e.crackWin=e.openN; e.plates--; e.crackT=G.time; shake(10); SFX.play('boom'); f2Shards(e.x,e.y-50,24,'200,170,255');
      f2Txt(e,e.plates>0?S(`CRACK! An armour plate breaks! ${e.plates} to go.`,`CRACK! ${e.plates} to go!`):S('CRACK! The last plate is gone!','CRACK! No more armour!'),'#ffd27a',16); f2Say(e,'f_grumblehorn',S('OOF! My back!','OOF!'),4); } },
  onHurt(e,amt,o){ let a=amt*(0.8+0.25*(3-e.plates)); if(e.state==='stagger') a*=2; else if(e.state==='stuck'||e.state==='dizzy') a*=1.2;
    const gone=3-e.plates, ph=e.bph||0;
    if(ph===0) a=f2Gate(e,a,o,0.65,gone>=1,S('His armour is too thick! Make him hit a pillar, then POUND his back!','Pillar! Then POUND!'));
    if(ph===1) a=f2Gate(e,a,o,0.35,gone>=2,S('Crack another plate! Pillar, then POUND his back!','Pillar, then POUND!'));
    if(ph===2) a=f2Gate(e,a,o,0.04,e.flips>=1,S('Knock him over! Pound a drum stone when he is near it!','Pound a drum near him!'));
    return a; },
  draw3d:f2FigRam, draw2d:f2Ram2,
  sheet:f2Sheet([{state:'chase',label:'idle',plates:3},{state:'chase',dx:60,label:'walk',plates:3},{state:'chargeAim',st:0.5,at:0.4,label:'charge aim',plates:3},{state:'charge',dx:400,label:'charge',plates:3},
    {state:'sweepW',st:0.3,at:0.3,label:'horn sweep',plates:2},{state:'stuck',label:'horns stuck',plates:2},{state:'leapW',st:0.2,at:0.2,label:'crouch',plates:2},{state:'leap',z:120,label:'leap',plates:1},
    {state:'dizzy',label:'wobble',plates:1},{state:'stagger',label:'on his back',plates:0},{state:'chase',deathT:0.3,label:'death',plates:0}])});
function f2GrumBump(e,what){
  const R=f2RoomOf(e);
  if(what==='pillar'){ e.state='stuck'; e.st=f2Win(3); e.openN=(e.openN||0)+1; shake(10); SFX.play('boom'); f2Txt(e,S('STUCK! His horns are in the pillar! Jump up and POUND!','STUCK! Jump and POUND!'),'#ffe066',16); f2Say(e,'f_grumblehorn',S('My HORNS!','My HORNS!'),4);
    f2Tip('gh_stuck',S('Horns stuck!','Horns stuck!'),S('Jump next to him and press attack in the air: Ground Pound! It cracks an armour plate.','Jump, then attack: POUND!')); return; }
  // a wall: in phase 3 the rockslide, else a short daze
  shake(9); SFX.play('boom'); f2Snow(e.x,e.y,20);
  if(e.bph>=2) f2GrumRockslide(e); e.state='recover'; e.st=e.bph>=2?0.9:0.7;
}
function f2GrumRockslide(e){ const p=player, C=f2Ctx(e), n=byDiff(5,6,7);
  for(let i=0;i<n;i++){ const a=i===0?0:rand(0,TAU), r=i===0?0:rand(60,260), q=f2Hold(C,{x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r},30);
    f2Mark({x:q.x,y:q.y,r:50,dur:f2W({},0.9)+i*0.05,col:F2COL.orange,drop:true,fire:z=>{ f2Shards(z.x,z.y,14,'190,180,170'); SFX.play('pop'); if(!player.dead&&!f2Up()&&dist(z.x,z.y,player.x,player.y)<50+player.r*0.5) hurtPlayer(f2Dmg(e,22),z.x,z.y,200); }}); }
  f2Txt(e,S('Rockslide! Watch the ceiling!','Rocks falling!'),'#ffd0a0',14); }
// a drum stone's ring: in phase 3 it knocks him onto his back if he is close
function f2GrumDrum(e,info){ const d=dist(info.x,info.y,e.x,e.y); if(d>(info.R||300)+e.r) return;
  if(e.bph>=2&&e.state!=='stagger'&&!(e.z>10)){ e.mv=null; e.tele=null; e.state='stagger'; e.st=f2Win(5); e.openN=(e.openN||0)+1; e.flips++; shake(12); SFX.play('boom');
    f2Txt(e,S('BOOOM! The drum knocks him onto his back! Hit him!','BOOM! He is on his back!'),'#ffe066',16); f2Say(e,'f_grumblehorn',S('Whoa-whoa-WHOA!','WHOA!'),4); }
  else if(e.bph<2&&!(e._drT>G.time)){ e._drT=G.time+2; e.kvx=(e.kvx||0)+Math.cos(angTo(info.x,info.y,e.x,e.y))*200; f2Txt(e,S('He shrugs off the drum. Not yet!','He shrugs it off!'),'#e0d8c8',12); } }
function f2GrumPre(e,dt,d,a){ bossCad(e,e.bph>=1?0.8:1);
  // a pillar that rose under him pushes him out of it
  const A=AREA; if(A&&A.p3) for(const g of A.p3.gates){ if(g.g!=='pillar'||!g.closed) continue; const dd=dist(g.x,g.y,e.x,e.y); if(dd<(g.r||24)+6&&!(e.state==='charge')){ const q=angTo(g.x,g.y,e.x,e.y); e.x=g.x+Math.cos(q)*(e.r+21); e.y=g.y+Math.sin(q)*(e.r+21); } }
  if(e.state==='stuck'||e.state==='stagger'||e.state==='dizzy'){ e.dx=e.dy=0; e.st-=dt; if(e.state==='stagger'&&Math.random()<dt*6) emit(e.x+rand(-20,20),e.y-40,1,{col:'255,230,120',glow:true,smin:10,smax:40,lmin:.4,lmax:.7,zmin:1.5,zmax:2.5});
    if(e.st<=0){ if(e.state==='stagger') f2Txt(e,S('He rolls back onto his feet!','He gets up!'),'#e0d8c8',12); e.state='recover'; e.st=0.6; e.cd=0.5; } return true; }
  if(e.state==='land'){ e.dx=e.dy=0; return false; }
  // phase 3: now and then he rams the nearest wall on purpose (the rockslide)
  if(e.bph>=2&&!e.mv&&e.state==='chase'){ e.ramT-=dt*foeDiff().atk; if(e.ramT<=0){ e.ramT=byDiff(10,8,7); const C=f2Ctx(e); let best=null, bd=1e9;
      if(C.rect) for(const [x,y] of [[C.x0,e.y],[C.x1,e.y],[e.x,C.y0],[e.x,C.y1]]){ const dd=dist(x,y,e.x,e.y); if(dd>160&&dd<bd){ bd=dd; best={x,y}; } }
      if(best){ e.state='ramAim'; e.st=f2W({},0.8); e.ramA=angTo(e.x,e.y,best.x,best.y); e.face=e.ramA; e.ramHit=false; e.tele=newTele({shape:'line',len:bd,w:e.r*2,dur:e.st,col:F2COL.red}); f2Say(e,'f_grumblehorn',S('HRRRMPH! Wall! You are in my WAY!','HRRMPH! Wall!'),6); SFX.play('warn'); return true; } } }
  if(e.state==='ramAim'){ e.dx=e.dy=0; e.face=e.ramA; e.st-=dt; if(e.st<=0){ e.state='ram'; e.st=1.6; e.tele=null; SFX.play('dash'); } return true; }
  if(e.state==='ram'){ const s=620*foeDiff().spd, p=player; e.dx=Math.cos(e.ramA)*s; e.dy=Math.sin(e.ramA)*s; e.face=e.ramA;
    if(!e.ramHit&&!p.dead&&!f2Up()&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+6){ if(hurtPlayer(f2Dmg(e,34),e.x,e.y,420)) e.ramHit=true; }
    if(Math.random()<dt*18) emit(e.x-Math.cos(e.face)*e.r,e.y+e.r*0.4,1,{col:'200,195,185',glow:false,smin:10,smax:50,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6});
    e.st-=dt; if((e.st<1.5&&foeBumped(e))||e.st<=0){ e.dx=e.dy=0; if(f2PillarAhead(e)) f2GrumBump(e,'pillar'); else { shake(10); SFX.play('boom'); f2GrumRockslide(e); e.state='recover'; e.st=0.9; } } return true; }
  return false; }
// ---- his look: a ram the size of a barn, stone-grey wool in thick curls, two great curled horns ringing violet, three
// violet armour plates on his back, an icicle beard, a little crown of rock between the horns
function f2FigRam(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.f_grumblehorn.r)/44*2.5, face=t3Turn(e,e.face,st==='charge'?2:4), fx=e.x, fy=e.y+e.r*0.4, inS=foSt(e), dead=foDeath(e), hurt=f2Hurt(e);
  const wool=fl?'#ffffff':foT(e,'#9e9a92'), woolD=foT(e,'#7a766e'), woolL=foT(e,'#c2beb4'), horn='#d8cdb4', hornD='#a89a7a', vio='#b6a4ee', vioL='#e8e0ff';
  const mv=foWalk(e,dt,st==='charge'?14:7), w=e._wp||0, plates=e.plates!=null?e.plates:3, back=st==='stagger', stuck=st==='stuck', zf=(e.z||0)/k;
  let lean=0, sweep=0, crouch=0;
  if(st==='chargeAim'){ lean=0.12; crouch=f2Sm(clamp(inS/0.8,0,1)); } else if(st==='charge') lean=0.22; else if(st==='sweepW') sweep=-f2Sm(clamp(inS/0.6,0,1)); else if(st==='strike') sweep=1; else if(st==='leapW') crouch=1; else if(stuck) lean=0.3;
  const P=foEase(e,'_frm',foTg(lean,sweep,crouch),dt,st==='strike'?18:8); lean=P[0]; sweep=P[1]; crouch=P[2];
  foShadow(e.x,e.y+4,30*k,0.45-Math.min(0.3,zf*0.004));
  foBegin(fx,fy,face,k,fl,zf);
  if(dead) foSet(FOB,0,0,1.2*dead,0,0,0,-2*dead); else if(back) foSet(FOB,10,0,2.6,0,0,0,4); else if(st==='dizzy') foSet(FOB,0,0,Math.sin(t*8)*0.15,0); else if(stuck) foSet(FOB,0,0.15+Math.sin(t*30)*0.03,0,0);
  // legs (stubby, hooves)
  foLow(); for(const [lx,sd] of [[8,-1],[8,1],[-8,-1],[-8,1]]){ const s=Math.sin(w+(lx>0?0:Math.PI))*mv*sd; foY(lx+s*2.6,sd*7,0,2.6,3,9-crouch*3,woolD,woolL); foE(lx+s*2.6+0.8,sd*7,0.8,3,2.6,1.4,'#3a3430'); }
  foUp(); foSet(FOA,10-crouch*3,lean-hurt*0.08,Math.sin(t*1.2)*0.02,0);
  // body: a big woolly barrel of stone curls
  foE(0,0,16,17,11,10,wool); for(let i=0;i<10;i++){ const a=i*0.63, x=-12+i*2.6, y=Math.sin(a*3)*7; foB(x,y,20+Math.cos(a*2)*3,3.4,i%2?woolL:wool,0.01); }
  // the armour plates of moth-frost along his back (one cracks off with each pound)
  for(let i=0;i<3;i++){ if(i>=plates) continue; const x=-8+i*7.5; foQ([x-3,-5,25.5, x+3,-5,25.5, x+3.4,5,25.5, x-3.4,5,25.5],vio,'#7c66c6',0.04); f2Crystals(x,0,26,3.6,2,vioL,vio); }
  if(G&&G.time-(e.crackT||-9)<0.6) foGlow(0,0,26,24,'255,220,150',0.7,false);
  // head with the beard of icicles and the great curled horns
  const hx=17, hz=22+(stuck?-4:0), hn=st==='charge'||st==='chargeAim'?-0.25:0;
  foE(hx,0,hz,7.2,6,6.6,woolL,hn); foE(hx+5.6,0,hz-2.4,3.8,3.4,3.4,'#b8b2a6',hn); for(const sd of [-1,1]) foE(hx-1,sd*6.2,hz+1,1.6,3,1.4,woolD,0,sd*0.5,0,0.02); foD(hx+7.6,-1.2,hz-1,0.7,'#3a3430',0.04); foD(hx+7.6,1.2,hz-1,0.7,'#3a3430',0.04);
  for(const sd of [-1,1]){ foD(hx+4.6,sd*3.2,hz+2.2,1.5,'#ffffff',0.03); f2Glow(hx+5,sd*3.2,hz+2.3,1.15,dead>0?'#ffd050':'#c890ff',0.45); }
  for(let i=-1;i<=1;i++) foC(hx+5,i*1.6,hz-4.4,hx+5.4,i*1.8,hz-10-Math.abs(i)*-1.4,1,'#dff2ff',0.03);
  for(const sd of [-1,1]){ const ring=0.4+0.4*Math.sin(t*5), cx=hx-4, cz=hz+1; let px=hx-1, py=sd*3.6, pz=hz+5;
    for(let i=1;i<=9;i++){ const u=i/9, ang=u*Math.PI*1.8+sweep*0.3, rr=8.4-u*5, nx=cx-Math.sin(ang)*rr, nz=cz+Math.cos(ang)*rr*0.9+2, ny=sd*(4.4+u*4.6);
      foL(px,py,pz,nx,ny,nz,3.4-u*1.9,i%2?horn:hornD,3.2-u*1.9); px=nx; py=ny; pz=nz; }
    for(let i=0;i<3;i++){ const ang=0.6+i*0.9; foN(cx-Math.sin(ang)*7,sd*(5.6+i*1.4),cz+Math.cos(ang)*6.4+2,cx-Math.sin(ang)*5.4,sd*(5.8+i*1.4),cz+Math.cos(ang)*4.8+2,0.6,'#8a7a5a',0.03); }
    if(!dead) foGlow(cx,sd*8,hz+3,10,'190,150,255',0.25+0.25*ring,false); }
  foY(hx-2,0,hz+5.2,2.2,2.6,2.2,'#8a8476','#a8a294',0.02);
  foEnd(20); e._t3top=foTop(fy,44,k,zf);
}
function f2Ram2(e,fl){ const x=e.x, y=e.y-(e.z||0)*0.8, r=e.r0||e.r, f=e.face, pl=e.plates!=null?e.plates:3; ctx.save(); f2Shadow2(e,1.2); ctx.translate(x,y); ctx.rotate(f);
  f2E2(0,0,r*0.95,r*0.65,fl?'#fff':'#9e9a92',0,2.4); for(let i=0;i<pl;i++) f2E2(-r*0.45+i*r*0.42,0,r*0.16,r*0.3,'#b6a4ee',0,1.4);
  f2E2(r*0.9,0,r*0.3,r*0.28,'#c2beb4',0,1.8); ctx.strokeStyle='#d8cdb4'; ctx.lineWidth=6; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(r*0.75,s*r*0.42,r*0.22,0,TAU); ctx.stroke(); }
  ctx.restore(); }
// ---- the Stone Throne (room decor): the throne at the north wall, an old red runner down the hall
F2ROOMK.f_grumblehorn={
  build(R,A){ return {R,th:{x:R.cx,y:R.y0+60}}; },
  ground(D,t){ const R=D.R; ctx.save(); ctx.fillStyle='rgba(150,60,50,.22)'; ctx.fillRect(R.cx-70,R.y0+90,140,R.y1-R.y0-140); ctx.strokeStyle='rgba(220,180,90,.3)'; ctx.lineWidth=4; ctx.strokeRect(R.cx-62,R.y0+98,124,R.y1-R.y0-156); ctx.restore(); },
  tall(D,list){ if(!D.it) D.it={x:D.th.x,y:D.th.y,draw:()=>f2DrawThrone(D)}; list.push(D.it); }
};
function f2DrawThrone(D){ const x=D.th.x, y=D.th.y, oc=F2OL(); ctx.save(); ctx.fillStyle=oc; rrect(ctx,x-96,y-150,192,154,16); ctx.fill(); ctx.fillStyle='#8a8478'; rrect(ctx,x-92,y-146,184,146,14); ctx.fill();
  ctx.fillStyle='#a8a294'; rrect(ctx,x-70,y-120,140,90,10); ctx.fill(); ctx.fillStyle='#6a645a'; rrect(ctx,x-80,y-30,160,30,6); ctx.fill();
  ctx.strokeStyle='#d8cdb4'; ctx.lineWidth=9; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(x+s*76,y-128,22,s<0?0.4:Math.PI-2.6,s<0?3.4:Math.PI+0.6); ctx.stroke(); }
  ctx.fillStyle='#d8c070'; ctx.beginPath(); ctx.arc(x,y-130,12,0,TAU); ctx.fill(); ctx.restore(); }
// the Stone Throne (2x2): rounded corners; frost layer: drum stones D in the corners, drum pillars y / z across the
// middle (three up in each state), pound switches P on the west and east walls
F2_TPL.throne=f2Tpl(31,23,f2Round(31,23,3));
F2_FROST.throne=f2Tpl(31,23,(i,j)=>{ const m={'4,4':'D','26,4':'D','4,18':'D','26,18':'D','10,7':'y','20,7':'y','15,15':'y','15,7':'z','10,15':'z','20,15':'z','1,11':'P','29,11':'P'}[i+','+j]; return m||'.'; });

// ================= 11. Hush, the snow moth (f_hush), outdoors at the Dreadgate (boss site f_hush)
// A barn-sized white moth: milk-white furry wings with two painted violet eyes, two real eyes in the middle that blink
// slowly, feathery antennae. She hates noise and loves lamps. The plaza: three lamp-braziers on tall pillars, two vents
// with short wind ribbons beside the west and east lamps, ice walls round it (r 460). No flying.
// THE LAMP RULE: she flies high (blades miss, arrows do half). Light a lamp (Blaze from range, a fire arrow, the Ember
//   Chain): she glides to it and hovers low round it, entranced, for 4 s. Ground Pound under her (or hit her a lot) and
//   she is grounded for 4 s (hits x1.5). Lamps burn 10 s. Gates: 60 / 25 / 4 percent each need a grounding in that phase.
// Phase 1: Dust Clouds (sleepy, slow), Hush Pulse (a donut: no fire breath for 3 s), Dive.
// Phase 2: Mothlings that fly into lit lamps and snuff them (burn them first, or light two lamps); her wingbeats blow
//   lamps out after 5 s; gusts across the plaza.
// Phase 3: The Hush: the music drops, she splits into three (two are illusions that pop when hit). Only the real one goes
//   to a lit lamp.
// Vesper (if she became Ash's friend in Act II) lights a lamp with a fire bomb every 6 s.
f2Lines('f_hush',['f_hush_intro'],['f_hush_outro'],
  [['f_hush',S('Shhh. Sleep now.','Shhh. Sleep now.')]],
  [['narr',S("Hush tumbles down into the snow. As she falls, she shrinks. And shrinks. Until she's just a little white moth, sitting on your claw.",'Hush falls and shrinks into a little white moth.')],
   ['f_hush',S("...Cold. It's so cold out here. The Mother promised a warm dark. A soft dark. Forever and ever.",'Cold. So cold. The Mother promised a warm dark.')],
   ['ash',S('Get a sweater, little moth.','Get a sweater, little moth.')],
   ['narr',S('The moth flutters up toward the moon and is gone.','The moth flies off toward the moon.')],
   ['narr',S('Behind you, the crack in the Frost Lock finishes its job. CRACK. The lock falls apart, and the Dreadgate opens.','CRACK! The Frost Lock breaks. The Dreadgate opens!')],
   {who:'c_vesper',text:S("Go on, cousin. I'll watch the gate. Thieves are very good at watching gates. We know every trick.","Go on, cousin. I'll watch the gate."),skipIf:()=>!f2VesperAlly()}]);
// Vesper fights beside Ash at the Dreadgate if she became his friend in Act II (the story may decide: F2.hook.vesper())
function f2VesperAlly(){ try{ if(F2.hook.vesper) return !!F2.hook.vesper(); }catch(err){} return typeof vesperFriend==='function'?!!vesperFriend():!!(G.choices&&G.choices.c_vesper==='friend'); }
// her drop-in after Hush's first line (bible 6.10a), only while the story has not written its own intro
const F2_VESPER_HUSH=[['c_vesper',S('Hello, cousin. Miss me?','Hello, cousin. Miss me?')],
  ['ash',S('Vesper! What are you doing here?','Vesper! Why are you here?')],
  ['c_vesper',S(`That's one of HER moths. I know those painted eyes. I have a score to settle with her. Let's make it LOUD.`,`That is one of HER moths. Let's be LOUD!`)]];
{ const B=STORY.bosses.f_hush, d=Object.getOwnPropertyDescriptor(B,'intro'); Object.defineProperty(B,'intro',{get(){ const L=d.get.call(this); return this._in||!f2VesperAlly()||STORY.f_hush_intro?L:L.concat(F2_VESPER_HUSH); },set(v){ this._in=v; },enumerable:true,configurable:true}); }
const F2HUSH={x:7300,y:44300,r:420,lamps:[[7000,44250],[7600,44250],[7300,44560]],vents:[[7080,44340],[7520,44340]]};
// ---- lamp-braziers. f2Lamp({x,y,h,burn,on,id}) makes one (outdoors; the finale echo can use them too). At the
// Dreadgate the world module may already have put far braziers (p3 'fbraz') on the three spots: then each lamp here
// is bound to that brazier (its art, its fire tests and its burn timer) instead of drawing a second one.
function f2Lamp(o){ const L=Object.assign({h:92,burn:10,lit:false,t:0,area:null,r:22,kind:'f2lamp',vr:200,on:true},o);
  L.ground=f2LampGround; L.draw=f2LampDraw; L.sy=6; L.light={x:L.x,y:L.y-L.h,r:300,i:0,fire:true}; try{ LIGHTS.push(L.light); }catch(e){}
  p3On(L,{r:30,blaze:{need:0.25,h:L.h,repeat:true,when:q=>!q.lit&&!!q.on,then:q=>f2LampLight(q,'blaze')},fire(q,dt,blue){ if(!q.lit&&q.on&&!blue&&dist(player.x,player.y,q.x,q.y)<210) f2LampLight(q,'breath'); }});
  L.col=addCol({t:'c',x:L.x,y:L.y,r:16}); F2.lamps.push(L); return f2OutAdd(L); }
// a lamp that is the world's far brazier w (lit, burn and the art are the brazier's)
function f2LampBound(w,o){ const L={x:w.x,y:w.y,h:w.h||64,burn:o.burn||10,kind:'f2lamp',on:true,t:0,w,id:o.id,bound:true};
  if(!w.timed) w.timed=L.burn;
  Object.defineProperty(L,'lit',{get(){ return !!w.lit; },set(v){ w.lit=!!v; if(v) w.burn=Math.max(w.burn||0,0.1); },enumerable:true,configurable:true});
  Object.defineProperty(L,'burnT',{get(){ return w.burn||0; },set(v){ w.burn=v; },enumerable:true,configurable:true});
  F2.lamps.push(L); return L; }
function f2LampLight(L,how){ if(L.lit) return; L.lit=true; L.t=0; L.burnT=L.burn; if(!L.bound){ SFX.play('pickup'); emit(L.x,L.y-L.h,20,{kind:'fire',ang:-Math.PI/2,spread:0.7,smin:30,smax:110,lmin:.4,lmax:.9,zmin:3,zmax:6,grow:6}); }
  ftext(L.x,L.y-L.h-34,S('Lit!','Lit!'),'#ffe0a0',13); if(L.onLit) try{ L.onLit(L,how); }catch(err){ console.error(err); } }
function f2LampOut(L,why){ if(!L.lit) return; L.lit=false; emit(L.x,L.y-L.h,10,{col:'120,120,120',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:50,lmin:.6,lmax:1,zmin:3,zmax:6,grow:6}); if(why) ftext(L.x,L.y-L.h-30,why,'#d8d0e8',12); if(L.onOut) try{ L.onOut(L); }catch(err){} }
// bound lamps notice being lit by any fire (the brazier's own code lit it)
function f2LampsTick(dt){ for(const L of F2.lamps){ if(L.kind!=='f2lamp') continue;
    if(L.bound){ const lit=L.lit; if(lit&&!L._was){ L.t=0; if(L.onLit) try{ L.onLit(L,'fire'); }catch(err){} } L._was=lit; if(lit) L.t+=dt; continue; }
    if(L.lit){ L.t+=dt; L.burnT-=dt; if(L.burnT<=0) f2LampOut(L,S('It burns out.','Out.')); if(Math.random()<0.5&&inView(L.x,L.y,300)) emit(L.x+rand(-5,5),L.y-L.h-6,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.35,lmax:.7,zmin:3,zmax:6}); }
    if(L.light) L.light.i=L.lit?0.9+0.08*Math.sin(G.time*9+L.x):0; } }
// fire arrows, bombs and the Ember Chain light a lamp they reach; bombs and the hammer also reach the fight's pieces
{ const base=armsWorldHit; armsWorldHit=function(x,y,r,src){ const out=base.apply(this,arguments); if(AREA||!G||G.mode!=='story') return out;
    if(src==='fire'||src==='chain'||src==='ember'||src==='bomb') for(const L of F2.lamps){ if(L.kind==='f2lamp'&&!L.bound&&L.on&&!L.lit&&dist(x,y,L.x,L.y)<(r||8)+40) f2LampLight(L,'arrow'); }
    try{ f2OutHit(x,y,r,src); }catch(err){ console.error(err); } return out; }; }
function f2LampGround(L,t){ ctx.save(); ctx.fillStyle='rgba(20,20,40,.25)'; ctx.beginPath(); ctx.ellipse(L.x,L.y+4,26,10,0,0,TAU); ctx.fill(); if(L.lit){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.35; ctx.drawImage(foGlowSpr('255,170,80'),L.x-90,L.y-60,180,120); } ctx.restore(); }
function f2LampDraw(L,t){ const x=L.x, y=L.y, h=L.h, oc=F2OL(); ctx.save();
  ctx.fillStyle=oc; rrect(ctx,x-15,y-h-2,30,h+6,6); ctx.fill(); ctx.fillStyle='#5a5470'; rrect(ctx,x-12,y-h,24,h,5); ctx.fill(); ctx.fillStyle='#78708e'; rrect(ctx,x-12,y-h,9,h,5); ctx.fill();
  ctx.fillStyle='#c4b2f2'; for(let i=0;i<3;i++) ctx.fillRect(x-12,y-h*0.3-i*22,24,3);
  ctx.fillStyle=oc; ctx.beginPath(); ctx.moveTo(x-26,y-h-4); ctx.lineTo(x+26,y-h-4); ctx.lineTo(x+16,y-h-22); ctx.lineTo(x-16,y-h-22); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#8a7a5a'; ctx.beginPath(); ctx.moveTo(x-23,y-h-6); ctx.lineTo(x+23,y-h-6); ctx.lineTo(x+14,y-h-19); ctx.lineTo(x-14,y-h-19); ctx.closePath(); ctx.fill();
  if(L.lit){ const f=0.8+0.2*Math.sin(t*14+x); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.8; ctx.drawImage(foGlowSpr('255,180,90'),x-44,y-h-70,88,88); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#ff8a3a'; ctx.beginPath(); ctx.moveTo(x-12,y-h-18); ctx.quadraticCurveTo(x-8,y-h-42*f,x,y-h-52*f); ctx.quadraticCurveTo(x+8,y-h-42*f,x+12,y-h-18); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffe0a0'; ctx.beginPath(); ctx.moveTo(x-6,y-h-18); ctx.quadraticCurveTo(x,y-h-34*f,x+6,y-h-18); ctx.closePath(); ctx.fill(); }
  else { ctx.fillStyle='#3a3448'; ctx.fillRect(x-12,y-h-21,24,4); }
  ctx.restore(); }
// ---- the plaza: lamps and vents are made once, at the first fight (bound to the world's braziers and wind streams
// when it has them); the stand-in ribbons blow only in the fight
const F2HP={built:false,lamps:[],streams:[]};
function f2NearFbraz(x,y){ let best=null, bd=90*90; for(const o of (typeof P3!=='undefined'?P3.out:[])){ if(o.p3!=='fbraz') continue; const d=dist2(o.x,o.y,x,y); if(d<bd){ bd=d; best=o; } } return best; }
function f2HushBuild(){ if(F2HP.built) return; F2HP.built=true; const H=F2HUSH;
  for(const [x,y] of H.lamps){ const w=f2NearFbraz(x,y); F2HP.lamps.push(w?f2LampBound(w,{id:'f2hush_'+x,burn:10}):f2Lamp({x,y,h:96,burn:10,on:true,id:'f2hush_'+x})); }
  for(const [x,y] of H.vents){ if(WIND.list().some(s=>dist(s.pts[0][0],s.pts[0][1],x,y)<220)) continue; const sd=x<H.x?-1:1, pts=[[x,y],[x+sd*60,y-70],[x+sd*20,y-170],[x-sd*80,y-210]];
    try{ F2HP.streams.push(WIND.stream({id:'f2hush_rb'+sd,pts,w:60,speed:360,both:true,any:true,on:()=>G.fightSite==='f_hush'})); }catch(err){ console.error(err); }
    f2OutAdd({x,y,vr:120,ground:(o,t)=>f2DrawVentOut(o,t)}); }
}
function f2DrawVentOut(o,t){ const on=G.fightSite==='f_hush', x=o.x, y=o.y, oc=F2OL(); ctx.save(); ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(x,y,30,16,0,0,TAU); ctx.fill(); ctx.fillStyle=on?'#8a96ac':'#5a5e6a'; ctx.beginPath(); ctx.ellipse(x,y,27,13,0,0,TAU); ctx.fill();
  ctx.strokeStyle=oc; ctx.lineWidth=2; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(x+i*9,y-11); ctx.lineTo(x+i*9,y+11); ctx.stroke(); }
  if(on) for(let i=0;i<3;i++){ const q=(t*0.9+i/3)%1; ctx.strokeStyle=`rgba(235,246,255,${0.7*(1-q)})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(x,y-q*60,16+q*12,6+q*3,0,0,TAU); ctx.stroke(); } ctx.restore(); }
// ---- her moves
FM.f2pulse={
  start(e,m){ e.state='pulseW'; e.st=f2W({},0.9); m.x=e.x; m.y=e.y; m.z=f2Mark({shape:'donut',x:e.x,y:e.y,r1:80,r2:300,dur:e.st,col:F2COL.violet}); f2Say(e,'f_hush',S('Shhhhh!','Shhhh!'),5); },
  tick(e,dt,d,a,m){ e.st-=dt; if(e.st>0) return false; const p=player, dd=dist(p.x,p.y,m.x,m.y); SFX.play('whoosh');
    for(let i=0;i<24;i++){ const q=i/24*TAU; emit(m.x+Math.cos(q)*80,m.y+Math.sin(q)*70,1,{col:'215,200,245',glow:true,ang:q,spread:0.1,smin:200,smax:260,lmin:.4,lmax:.6,zmin:1.6,zmax:3,drag:1}); }
    if(!p.dead&&!f2Up()&&dd>80-p.r&&dd<300+p.r){ f2Hush(3); ftext(p.x,p.y-54,S('SHHH! Your fire is hushed for 3 seconds!','Shh! No fire!'),'#e2d0ff',14); } return true; } };
FM_DEF.f2pulse={recover:0.6};
const HUSH_HIGH=FK.brain({move:'hold',turn:3,cd:[1.3,2.2],
  moves:[{k:'f2spots',st:'dustW',n:3,r:70,windup:0.8,r0:70,r1:220,col:F2COL.dust,max:900,w:2.2,place:(e,x,y)=>{ fzAdd('f2cloud',{x,y,r:70,life:3,sleep:2,k:0.5,dmg:f2Dmg(e,12)}); SFX.play('pop'); }},
         {k:'f2pulse',max:340,w:1.6,every:6},
         {k:'f2swoop',st:'hoot',len:600,dmgN:30,stick:false,min:140,max:700,w:1.6,every:5},
         {k:'summon',ph:1,type:'f_mothling',n:4,every:14,windup:0.6,st:'summon',r0:40,r1:140,opt:{aggro:true},max:900,w:1.6,if:e=>!e.fake&&countType('f_mothling')<byDiff(4,6,6)}]});
f2Foe('f_hush',{boss:true,name:'Hush',title:S('the Snow Moth','the snow moth'),short:'Hush',
  lv:16,hp:4400,r:42,speed:130,dmg:22,value:1400,flying:true,kbRes:0.2,dcol:'236,228,250',phases:[0.6,0.25],
  phaseText:[[S('Moths!','Moths!'),S('Little moths snuff the lamps. Burn them first, or light two lamps at once! Her wings blow lamps out fast now.','Burn the moths! Light two lamps!'),['f_hush',S('Too loud, too loud.','Too loud.')]],
             [S('The Hush!','The Hush!'),S('She splits into three! Only the real Hush goes to a lit lamp. The others pop when you hit them.','Only the real one goes to a lamp!'),['f_hush',S('Rest now, loud one.','Rest, loud one.')]]],
  init(e){ f2BossInit(e); e.mode='high'; e.z=140; e.orb=rand(0,TAU); e.grounds=[0,0,0]; e.hovH=0; e.gustT=6; },
  onPhase(e,i){ if(i===2) f2HushSplit(e); },
  onDeath(e){ for(const q of G.enemies) if(!q.dead&&q.type==='f_hushfake'){ q.dead=true; f2Puff(q.x,q.y-60,'236,228,250',16); } },
  ai:(e,dt,p)=>f2HushAI(e,dt,p),
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.mode==='high'||e.mode==='lure'||e.mode==='rise'){ if(f2Ranged(o)) a=amt*0.5; else if(h.fire) a=amt*0.3; else { if(!(e._hiT>G.time)){ e._hiT=G.time+2.4; f2Txt(e,S('Too high! Light a lamp: she cannot resist it!','Too high! Light a lamp!'),'#e8e0ff',13); } return false; } }
    else if(e.mode==='dizzy') a=amt*1.5;
    else if(e.mode==='hover'){ e.hovH+=amt; if(e.hovH>e.maxHp*byDiff(0.05,0.06,0.07)) later(0,()=>f2HushGround(e,S('Bonk! You knocked her down!','Bonk! She falls!'))); }
    const ph=e.bph||0, need=[0.6,0.25,0.04][ph];
    a=f2Gate(e,a,o,need,e.grounds[ph]>=1,S('She flutters away! Light a lamp, then Ground Pound under her!','Light a lamp! Then POUND!'));
    return a; },
  draw3d:f2FigHush, draw2d:f2Hush2,
  sheet:f2Sheet([{state:'chase',mode:'high',z:140,label:'flying'},{state:'chase',mode:'high',z:140,dx:80,label:'flying (move)'},{state:'dustW',mode:'high',z:140,st:0.4,at:0.4,label:'dust clouds'},{state:'pulseW',mode:'high',z:140,st:0.5,at:0.5,label:'hush pulse'},
    {state:'hoot',mode:'high',z:60,st:0.3,at:0.3,label:'dive aim'},{state:'dive',mode:'high',z:20,label:'dive'},{state:'open',mode:'hover',z:50,label:'entranced'},{state:'dizzy',mode:'dizzy',z:0,label:'grounded'},{state:'chase',deathT:0.3,z:20,label:'death'}])});
// an illusion of Hush (phase 3): it looks just the same, it pops when hit, it never goes to a lamp
f2Foe('f_hushfake',{name:'Hush',r:42,hp:1,speed:130,dmg:22,value:0,flying:true,kbRes:9,dcol:'236,228,250',
  init(e){ e.fake=true; e.mode='high'; e.z=140; e.orb=rand(0,TAU); e.passive=false; e.noXp=true; },
  ai:(e,dt,p)=>f2HushAI(e,dt,p),
  onHurt(e,amt,o){ f2Puff(e.x,e.y-60,'236,228,250',22); ftext(e.x,e.y-90,S('Pop! Just an illusion!','Pop! Not her!'),'#e8e0ff',13); return 9999; },
  draw3d:(e,fl)=>f2FigHush(e,fl), draw2d:(e,fl)=>f2Hush2(e,fl), sheet:[{state:'chase',mode:'high',z:140,label:'illusion'}]});
function f2HushSplit(e){ const n=byDiff(1,2,2); for(let i=0;i<n;i++){ const q=makeEnemy('f_hushfake',e.x+rand(-30,30),e.y+rand(-30,30),{level:e.level||16,aggro:true,elite:false,leash:99999}); if(q){ q.spawnIn=0.3; q.orb=e.orb+(i+1)*TAU/3; q.z=e.z; q.arena=e.arena; q.f2ctx=e.f2ctx; } }
  f2Puff(e.x,e.y-80,'236,228,250',30); f2Txt(e,S('She splits into three moths! Light a lamp to find the real one!','Three moths! Light a lamp!'),'#e8e0ff',15); }
function f2HushCtx(e){ if(e.f2ctx) return e.f2ctx; const C=f2Ctx(e); return C; }
function f2HushLamp(e){ let best=null, bd=1e9; for(const L of F2.lamps){ if(!L.lit||L.kind!=='f2lamp') continue; if(mapAt(L.y)!==mapAt(e.y)) continue; const d=dist(L.x,L.y,e.x,e.y); if(d<bd&&d<900){ bd=d; best=L; } } return best; }
function f2HushGround(e,txt){ if(e.dead||e.mode==='dizzy'||e.fake) return; e.grounds[e.bph||0]++; e.mv=null; e.tele=null; e.mode='dizzy'; e.state='dizzy'; e.dizzyT=f2Win(4); e.hovH=0; shake(9); SFX.play('boom');
  f2Txt(e,txt||S('BOOM! She drops out of the air!','BOOM! She falls!'),'#ffe066',16); f2Snow(e.x,e.y,26); for(const q of G.enemies) if(!q.dead&&q.type==='f_hushfake') killEnemy(q); }
// the Hush brain (reusable: the finale's echo can call f2HushAI(e,dt,p) with e.f2ctx set to its ring)
function f2HushAI(e,dt,p){
  p=p||player; const C=f2HushCtx(e), Df=foeDiff(); e.dx=e.dy=0; e.noClip=true; e.flying=true; e.mt=(e.mt||0)+dt;
  const fly=(x,y,spd,z)=>{ steer(e,x,y,spd*Df.spd); e.noClip=true; if(z!=null) e.z=lerp(e.z||0,z,Math.min(1,dt*2.2)); if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),3*dt); };
  const L=e.fake?null:f2HushLamp(e);
  switch(e.mode){
    case 'high': {
      if(e.lureCd>0) e.lureCd-=dt;
      if(L&&!e.mv&&!(e.lureCd>0)){ e.mode='lure'; e.lamp=L; e.mt=0; f2Say(e,'f_hush',S('Oooooh. Prettyyy.','Ooooh. Pretty.'),4); return; }
      if(L&&e.lureCd>0&&!(e._lcT>G.time)){ e._lcT=G.time+4; f2Txt(e,S('She blinks the light out of her eyes. Keep the lamp lit: she will come back to it!','Wait! She will come back to the lamp.'),'#e8e0ff',12); }
      e.orb+=dt*0.45*Df.spd; const rr=C.R*0.55, tx=C.cx+Math.cos(e.orb)*rr, ty=C.cy+Math.sin(e.orb)*rr*0.7;
      if(e.bph>=1&&!e.fake&&!e.mv&&e.state==='chase'){ e.gustT-=dt*Df.atk; if(e.gustT<=0){ e.gustT=byDiff(9,7,6); f2HushGust(e,C); } }
      if(e.fake){ e.cd-=dt; if(e.cd<=0&&!e.mv){ e.cd=byDiff(7,5.5,4.5); const q=player; fzAdd('f2cloud',{x:q.x+rand(-40,40),y:q.y+rand(-40,40),r:60,life:2.5,sleep:1.5,k:0.4,dmg:f2Dmg(e,8)}); } fly(tx,ty,e.speed*1.2,140); e.state='chase'; return; }
      HUSH_HIGH(e,dt,p); if(!e.mv&&e.state==='chase') fly(tx,ty,e.speed*1.2,140); else if(e.state==='dive'||e.state==='hoot'){} else e.z=lerp(e.z||0,140,Math.min(1,dt*2)); bossCad(e,1); return; }
    case 'lure': { const Lm=e.lamp; if(!Lm||!Lm.lit){ e.mode='high'; e.state='chase'; return; } e.state='chase'; fly(Lm.x,Lm.y+10,e.speed*1.6,50); if(dist(e.x,e.y,Lm.x,Lm.y+10)<40){ e.mode='hover'; e.mt=0; e.hovT=f2Win(4); e.hovH=0; } return; }
    case 'hover': { const Lm=e.lamp; e.state='open'; e.hovT-=dt; e.orb+=dt*2.2; if(Lm){ const tx=Lm.x+Math.cos(e.orb)*54, ty=Lm.y+16+Math.sin(e.orb)*30; steer(e,tx,ty,160); e.noClip=true; e.z=lerp(e.z||0,50,Math.min(1,dt*3)); e.face=turnTo(e.face,angTo(e.x,e.y,Lm.x,Lm.y),4*dt);
        if(e.bph>=1&&Lm.lit&&Lm.burnT>5) Lm.burnT=5; }
      if(Math.random()<dt*4) emit(e.x+rand(-30,30),e.y-e.z-20,1,{col:'255,230,170',glow:true,smin:10,smax:30,lmin:.4,lmax:.7,zmin:1.5,zmax:2.5});
      if(e.hovT<=0||!Lm||!Lm.lit){ e.mode='rise'; e.mt=0; e.lureCd=byDiff(2,4,6); if(Lm&&Lm.lit&&e.bph>=1) f2LampOut(Lm,S('Her wings blow it out!','Blown out!')); } return; }
    case 'dizzy': e.state='dizzy'; e.z=lerp(e.z||0,0,Math.min(1,dt*6)); e.dizzyT-=dt; if(Math.random()<dt*6) emit(e.x+rand(-24,24),e.y-40,1,{col:'255,230,120',glow:true,smin:10,smax:40,lmin:.4,lmax:.7,zmin:1.5,zmax:2.5});
      if(e.dizzyT<=0){ e.mode='rise'; e.mt=0; e.lureCd=byDiff(4,7,10); f2Txt(e,S('She flutters back up!','She flies up!'),'#e8e0ff',13); if(e.bph>=2) later(0.8,()=>{ if(!e.dead&&G.boss===e) f2HushSplit(e); }); } return;
    case 'rise': e.state='takeoff'; e.z=lerp(e.z||0,140,Math.min(1,dt*2)); if(e.mt>1.0){ e.mode='high'; e.mt=0; e.cd=0.8; } return;
    default: e.mode='high';
  }
}
// a gust across the plaza from one side (hide behind a lamp pillar, or ride a ribbon)
function f2HushGust(e,C){ const a=rand(0,TAU), x=C.cx+Math.cos(a)*C.R*0.95, y=C.cy+Math.sin(a)*C.R*0.95;
  f2Push(x,y,a+Math.PI,{len:C.R*2,half:0.42,force:1700,wait:f2W({},0.8),life:1.4,shelter:(px,py,z)=>F2.lamps.some(L=>L.kind==='f2lamp'&&segD(L.x,L.y,z.x,z.y,px,py)<28&&dist(px,py,z.x,z.y)>dist(L.x,L.y,z.x,z.y))});
  f2Txt(e,S('A gust! Hide behind a lamp pillar!','Gust! Hide behind a pillar!'),'#e8f0ff',13); }
// a Ground Pound under her while she hovers knocks her out of the air
p3OnPound(info=>{ const e=G&&G.boss; if(!e||e.dead||e.type!=='f_hush'||info.drum) return; if(e.mode==='hover'&&dist(info.x,info.y,e.x,e.y)<info.R+e.r) f2HushGround(e);
  for(const q of G.enemies) if(!q.dead&&q.type==='f_hushfake'&&dist(info.x,info.y,q.x,q.y)<info.R+q.r&&(q.z||0)<80) killEnemy(q); });
// moths snuff lit lamps (and a lamp burns out faster in phase 2); Vesper lights one now and then
function f2HushLampMoth(L,m,dt){ m.snuff=(m.snuff||0)+dt; if(m.snuff>1.4){ m.snuff=0; f2LampOut(L,S('A moth snuffs it out!','A moth put it out!')); } }
F2FIGHT.f_hush={
  start(){ f2HushBuild(); for(const L of F2HP.lamps){ L.lit=false; L.onMoth=f2HushLampMoth; } F2.ves=f2VesperAlly()?{x:player.x-60,y:player.y+30,face:0,t:0,lobT:3,state:'chase',st:0}:null; },
  reset(){ for(const L of F2HP.lamps) f2LampOut(L); for(const q of G.enemies) if(!q.dead&&q.type==='f_hushfake') q.dead=true; F2.ves=null; }};
// Vesper, the ally: she keeps near Ash, and every 6 s throws a fire bomb at a dark lamp (and teases the moth)
function f2HushFrame(dt){ const e=G.boss, V=F2.ves; if(!V) return; if(!e||e.dead||e.type!=='f_hush'){ if(!G.fightSite) F2.ves=null; return; }
  const p=player, a=angTo(e.x,e.y,p.x,p.y), tx=p.x+Math.cos(a+1.4)*90, ty=p.y+Math.sin(a+1.4)*70, d=dist(V.x,V.y,tx,ty); V.t+=dt;
  if(d>8){ const s=Math.min(d,240*dt); V.dx=(tx-V.x)/d*240; V.dy=(ty-V.y)/d*240; V.x+=(tx-V.x)/d*s; V.y+=(ty-V.y)/d*s; } else { V.dx=V.dy=0; }
  V.face=angTo(V.x,V.y,e.x,e.y); V.lobT-=dt;
  if(V.lobT<=0){ V.lobT=6; const off=F2HP.lamps.filter(L=>!L.lit); if(off.length){ const L=off[randi(0,off.length-1)]; V.state='cast'; V.st=0.4;
      fzAdd('f2lob',{x0:V.x,y0:V.y,x:L.x,y:L.y,r:24,dur:0.8,col:F2COL.orange,ball:'#5a4a6a',br:5,h:120,land:()=>{ f2LampLight(L,'vesper'); emit(L.x,L.y-L.h,14,{kind:'fire',smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:4}); }});
      taunt('c_vesper',S('Over here, moth! Pretty light!','Over here, moth!')); } }
  if(V.st>0){ V.st-=dt; if(V.st<=0) V.state='chase'; } }
function f2DrawVesperAlly(V){ const fig=F2.vesFig||(F2.vesFig={r:13,hp:1,maxHp:1,ally:true,speed:220,level:1,alpha:1,flash:0});
  Object.assign(fig,{x:V.x,y:V.y,face:V.face,t:V.t,state:V.state||'chase',st:V.st||0,dx:V.dx||0,dy:V.dy||0});
  if(T3.on&&typeof c1FigVesper==='function'){ try{ c1FigVesper(fig,false); return; }catch(err){} }
  ctx.save(); ctx.fillStyle='rgba(20,20,40,.25)'; ctx.beginPath(); ctx.ellipse(V.x,V.y+6,12,5,0,0,TAU); ctx.fill(); f2E2(V.x,V.y-10,9,12,'#3a2a5a',0,1.6); f2E2(V.x,V.y-24,7,7,'#e8d8f0',0,1.4); ctx.fillStyle='#8a5ad0'; ctx.fillRect(V.x-6,V.y-27,12,4); ctx.restore(); }
// the site: the Dreadgate plaza. It opens once the Drum Stone has been pounded (G.flags.f_drum) until she is beaten.
f2Site('f_hush','f_hush',{boss:'f_hush',at:{x:F2HUSH.x,y:F2HUSH.y,r:F2HUSH.r,name:S('The Dreadgate','The Dreadgate'),level:16},stage:'f_dreadgate',
  open:()=>!!G.flags.f_drum&&!G.flags.f_hush_done&&!G.bossDone.f_hush,
  arena:{shape:'ring',r:460,style:'ice'},flyOK:false,spawn:P=>({x:P.x,y:P.y-120}),
  onStart(){ f2FightStart('f_hush'); }, onReset(){ f2FightReset('f_hush'); },
  onWin(){ G.flags.f_hush_done=1; f2FightReset('f_hush'); f2Won('f_hush'); }});
// ---- her look: a barn-sized white moth. Soft furry milk-white wings with two painted violet eyes, two real eyes in the
// middle that blink slowly, feathery antennae, a fluffy collar
function f2FigHush(e,fl){
  const t=e.t||0, st=e.state, k=(e.r0||42)/42*2.2, face=t3Turn(e,e.face,4), fx=e.x, fy=e.y+e.r*0.3, inS=foSt(e), dead=foDeath(e), zf=(e.z!=null?e.z:140)/k;
  const wing=fl?'#ffffff':foT(e,'#f4f0fa'), wingD=foT(e,'#d8d0e8'), fur='#fbf8ff', vio='#9a78e0', vioD='#6a48b0', down=st==='dizzy';
  let flap=down?0.15+Math.sin(t*3)*0.05:Math.sin(t*(st==='dive'?3:5)+(e.id||0))*0.5+0.15, cast=st==='dustW'||st==='pulseW';
  if(cast) flap=-0.25+Math.sin(t*20)*0.1;
  foShadow(e.x,e.y+4,40*k*0.6,down?0.4:0.22);
  foBegin(fx,fy,face,k,fl,zf);
  if(dead) foSet(FOB,0,0,dead*1.4,0,0,0,-dead*8); else if(down) foSet(FOB,0,0,0.25,0);
  // four wings: big front pair with the painted eyes, smaller hind pair
  for(const sd of [-1,1]){ const th=flap, c=Math.cos(th), s=Math.sin(th);
    foQ([4,sd*2,4, 14,sd*(2+12*c),4+12*s, 8,sd*(2+30*c),4+30*s, -4,sd*(2+32*c),4+32*s, -8,sd*(2+18*c),4+18*s, -2,sd*2,3],wing,wingD,-0.04);
    foQ([-3,sd*2,3, -6,sd*(2+18*c),3+18*s-2, -14,sd*(2+16*c),3+16*s-4, -12,sd*(2+6*c),2+6*s, -5,sd*1.6,2],wingD,null,-0.05);
    const ex=2, ey=sd*(2+20*c), ez=4+20*s+0.4; foD(ex,ey,ez,4.6,vio,0.0); foD(ex,ey,ez+0.2,2.6,vioD,0.01); foD(ex+0.8,ey-sd*0.6,ez+0.8,1,'#ffffff',0.02);
    for(let i=0;i<3;i++){ const u=0.3+i*0.25; foN(lerp(4,-4,u),sd*(2+lerp(12,32,u)*c),4+lerp(12,32,u)*s,lerp(4,-4,u)+1,sd*(2+lerp(12,32,u)*c*0.7),4+lerp(12,32,u)*s*0.7,0.5,'#c8c0dc',-0.03); } }
  // furry body and collar
  foE(-3,0,3,9,4,4,fur); foB(4,0,4,4.6,fur); for(let i=0;i<6;i++){ const a=i/6*TAU; foD(4+Math.cos(a)*3.4,Math.sin(a)*3.6,4.6+Math.sin(a*2)*0.6,1.6,'#ffffff',0.02); }
  // head: two big dark eyes that blink slowly, feathery antennae
  foB(8,0,5,3.2,'#f0eaf8'); const bl=(Math.sin(t*0.9+(e.id||0))>0.94)||down?0.15:1;
  for(const sd of [-1,1]){ foE(9.8,sd*1.8,5.8,1.2,1.4,1.4*bl,'#2a1a40',0,0,0,0.04); if(bl>0.5) foD(10.4,sd*1.6,6.4,0.4,'#ffffff',0.06);
    foN(9.6,sd*1.2,7.4,13,sd*5,14,0.5,'#d8d0e8',0.03); for(let i=1;i<5;i++){ const u=i/5, x=lerp(9.6,13,u), y=sd*lerp(1.2,5,u), z=lerp(7.4,14,u); foN(x,y,z,x+0.8,y+sd*1.4,z-1,0.3,'#e8e0f4',0.03); foN(x,y,z,x-1,y+sd*0.4,z+1.2,0.3,'#e8e0f4',0.03); } }
  if(cast) foGlow(6,0,6,14,'215,200,245',0.6,false);
  if(e.fake) foGlow(0,0,4,30,'236,228,250',0.15,false);
  foEnd(6); e._t3top=foTop(fy,16,k,zf);
}
function f2Hush2(e,fl){ const x=e.x, y=e.y-(e.z!=null?e.z:140)*0.75, r=e.r0||42, f=e.face, w=Math.sin((e.t||0)*5)*0.25; ctx.save();
  ctx.fillStyle='rgba(20,20,50,.2)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+4,r*1.3,r*0.45,0,0,TAU); ctx.fill(); ctx.translate(x,y); ctx.rotate(f);
  for(const s of [-1,1]){ f2E2(r*0.1,s*r*(1.0+w*0.3),r*0.8,r*0.75,fl?'#fff':'#f4f0fa',s*0.4,2); f2E2(-r*0.55,s*r*0.7,r*0.45,r*0.4,'#d8d0e8',s*0.4,1.6); ctx.fillStyle='#9a78e0'; ctx.beginPath(); ctx.arc(r*0.15,s*r*1.0,r*0.22,0,TAU); ctx.fill(); ctx.fillStyle='#6a48b0'; ctx.beginPath(); ctx.arc(r*0.15,s*r*1.0,r*0.11,0,TAU); ctx.fill(); }
  f2E2(0,0,r*0.5,r*0.22,'#fbf8ff',0,1.6); for(const s of [-1,1]) f2Eye2(r*0.42,s*r*0.08,r*0.07,0,'#2a1a40'); ctx.restore(); }

// ================= 12. Glaciar, the ice dragon (f_glaciar), outdoors on the Crown of Dread (boss site f_glaciar)
// Vorlaxis's sister, a river of a dragon, coiled round the black ice spike with Shard 2 glowing violet in her chest and
// four chains of moth-frost running from her to four Chain Stones. Melt the chains and she remembers who she is.
// THE CHAINS (bible 5.2): each Chain Stone's lock sits under an ice dome. Crack the dome (a Ground Pound on the rune
//   plate at the stone's foot, a Blast Bomb, or the hammer's full charge): it stays cracked 8 s (12 on Easy). Hold Blaze
//   on the lock 2.5 s (less with Bluefire): SNAP. The chain whips back, she staggers 4 s (6 on Easy, damage x2), takes 6
//   percent of her health, and says one line in her own voice. South and West are open in phase 1 (West behind an ice
//   wall she keeps regrowing: Blaze it or Shadow Dash through); East (on a high ice slab: ride the updraft ribbon from
//   the vent) and North (on a ledge: Climbing Claws or the grapple post) open in phase 2.
// Phase 1, the Mother's Dream (100 to 70): coiled round the spike. Frost Breath (a sweep; the ground it touches turns to
//   ice; two quick hits freeze Ash: wiggle free, or Blaze yourself out), Icicle Rain (6 circles; the icicles stay as ice
//   spikes for 6 s), Tail Sweep (a donut when Ash is behind her or close: jump), the West ice wall regrows every 15 s.
// Phase 2, the Blizzard Wings (70 to 40): she flies a figure eight (only ranged hits reach her up there). Dive (a red
//   line; she lands for 2.5 s after it: the melee window), Snowball Boulders (jump or pound them), Wing Gust (a push
//   toward the edge: sliding off costs 10 percent and puts Ash back), Shardlings. Allies: Mumble holds her tail after a
//   dive and pelts Shardlings; Greymane howls (Shardlings slow down) and bites her when she lands.
// Phase 3 (40 to 0): all four chains melted: the SHARD HEART (she lands, warns Ash before each attack, only hits on the
//   Shard in her chest do full damage, each makes her flinch) and she ends FREE. Any chain still on: the LONG NIGHT
//   (whiteouts every 12 s: hide by a Chain Stone; breath, double icicle rain, faster dives) and she ends DEFEATED (asleep
//   under the snow). Melting the last chain in the Long Night switches to the Shard Heart on the spot.
// Outcome: G.choices.f_glaciar = 'free' | 'defeat' (set the moment she falls, before her outro). Hooks: F2.hook.chain(n),
// F2.hook.glaciarDone(outcome), F2.hook.won('f_glaciar'). Lines: STORY.bosses.f_glaciar.intro, .outroFree, .outroDefeat.
const F2CR={x:7300,y:41250,r:560,wall:600,vent:{x:7650,y:41500},post:{x:7200,y:40760},
  ledge:[7160,40690,7440,40810], slab:[7780,41150,110],
  stones:[{id:'s',name:S('the South Stone','the south stone'),x:7300,y:41700,up:0,ph:0}, // x2_world's summit door stands to the west (7060,41650)
   
          {id:'w',name:S('the West Stone','the west stone'),x:6820,y:41250,up:0,ph:0,wall:true},
          {id:'e',name:S('the East Stone','the east stone'),x:7780,y:41150,up:2,ph:1},
          {id:'n',name:S('the North Stone','the north stone'),x:7300,y:40760,up:1,ph:1}]};
const F2G={on:false,stones:[],melted:0,lvl:0,heart:false,night:false,windOn:false,wall:null,wallT:15,wallW:0,whiteCd:12,whiteWarn:0,pushT:0,fallCd:0,mumble:null,grey:null,nyx:false,saidT:0,outcome:null,built:false};
// the chain lines in her own voice, in the order the chains snap (bible 9.7)
// (the same words as x2_story's F2S_TAUNTS.f_glaciar_chain, full and simple, so a line is never said twice)
const F2_CHAIN_LINES=[S("...Fire? Warm fire? I knew a little girl with fire like that...","Fire? Warm fire? I knew a girl with fire like that..."),
  S("The Mother says... no. NO. Who IS the Mother? I don't have a mother. I have a brother. A loud one.","Who is the Mother? I have a brother. A loud one."),
  S("Little one. Your horns. You have her horns. Ember's horns!","Your horns! You have Ember's horns!"),
  S("The Shard! It's in my heart! Get it OUT, dumpling, before it freezes me again! And mind my tail, I can't help the tail!","The Shard is in my heart! Get it out, dumpling!")];
const F2_GLA_TAUNT=[S('Sleep, little one. Sleep under the snow.','Sleep, little one.'),S('Stay. In the cold, nothing ever has to leave.','Stay. Nothing leaves.'),S('The long night is coming. Lie down.','The long night is coming.')];
// her words: the story may write STORY.f_glaciar_intro, or set STORY.bosses.f_glaciar.intro / .outroFree / .outroDefeat
f2Lines('f_glaciar',['f_glaciar_intro'],[],
  [['narr',S('The top of Mount Dread. No wind. No sound. In the middle of the summit, coiled around a spike of black ice, lies a dragon.','The top of the mountain. A dragon lies coiled around a black spike.')],
   ['narr',S('She is white and blue and silver, as long as a river, with icicle horns and frost for whiskers. Four chains of purple frost hold her down, one to each corner of the summit. In her chest, something glows. The Shard.','She is long and white and blue. Four purple chains hold her. The Shard glows in her chest.')],
   ['ash',S('Hi... Auntie?','Hi... Auntie?')],
   ['f_glaciar',S("...Fire. I smell fire. My brother's fire.","Fire. I smell my brother's fire.")],
   ['f_glaciar',S('No. The Mother says fire goes out. The Mother says cold keeps things.','No. The Mother says cold keeps things.')],
   ['narr',S("Her eyes open. They're purple.","Her eyes open. They are purple.")],
   ['f_glaciar',S('The Mother says to put you out.','The Mother says to put you out.')],
   ['tove',S("Ash! Those chains aren't hers! Melt them, and maybe she'll remember who she is!",'Melt the chains! Then she may remember!')]],[]);
const F2_GLA_FREE=[
  ['narr',S("The Shard pops out of Glaciar's chest like a cork from a bottle and lands in the snow, ringing like a tiny bell.",'The Shard pops out of her chest. It rings like a bell.')],
  ['narr',S("The last of the purple drains out of her eyes. They're blue now. Pale, kind, sleepy blue, like a winter morning.",'Her eyes turn blue. Kind and sleepy.')],
  ['f_glaciar',S('Oh. Oh my. Oh, my head. Did I... did I make a blizzard?','Oh, my head. Did I make a blizzard?')],
  ['ash',S('A big one. Over the whole north.','A big one!')],
  ['f_glaciar',S("Come here. Let me look at you. ...Horns. Tail. That nose. You're Ember's. You're one of Ember's!","Let me look at you. You are one of Ember's!")],
  ['f_glaciar',S("Now. The Shard. Take it. It doesn't belong in a dragon. It belongs to your family.","Take the Shard. It belongs to your family.")],
  xdo(()=>{ if(!(G.items&&G.items.f_shard2>0)) giveItems({f_shard2:1}); }),
  ['f_glaciar',S("The one who put that spell on me, the one the moths call the Mother. Her name is Nyxara. She's the moon's old moth.","The Mother is Nyxara. The moon's old moth.")],
  xdo(()=>{ G.flags.f_nyx_named=1; })];
const F2_GLA_DEFEAT=[
  ['narr',S('Glaciar crashes down into the snow. The whole mountain shakes. The purple chains pull tight around her.','Glaciar falls in the snow. The chains pull tight.')],
  ['narr',S('The Shard cracks out of the ice over her heart and rolls to your feet.','The Shard rolls to your feet.')],
  xdo(()=>{ if(!(G.items&&G.items.f_shard2>0)) giveItems({f_shard2:1}); }),
  ['f_glaciar',S('(very sleepy) ...Nyxara. The moon\'s... old moth. She wants... the night. Forever.','Nyxara. The moon moth. She wants the night.')],
  xdo(()=>{ G.flags.f_nyx_named=1; }),
  ['narr',S('Her eyes close. Snow begins to cover her, gently, like a blanket.','Her eyes close. Snow covers her like a blanket.')]];
{ const B=STORY.bosses.f_glaciar;
  // the outro follows the outcome: the story's own (STORY.bosses.f_glaciar.outroFree / outroDefeat, or STORY.f_glaciar_outro_free /
  // _outro_defeat, or STORY.f_glaciar_outroFree / _outroDefeat), else the bible's words
  Object.defineProperty(B,'outro',{get(){ if(this._out) return this._out; const free=(F2G.outcome||G.choices.f_glaciar)==='free';
      const has=v=>v&&v.length?v:null;
      return free?(has(this.outroFree)||has(STORY.f_glaciar_outro_free)||has(STORY.f_glaciar_outroFree)||F2_GLA_FREE):(has(this.outroDefeat)||has(STORY.f_glaciar_outro_defeat)||has(STORY.f_glaciar_outroDefeat)||F2_GLA_DEFEAT); },
    set(v){ this._out=v; },enumerable:true,configurable:true}); }
f2Spk('nyxara','The Lady of the Moths','#c8b0f0');
// ---- the Crown's pieces: the world module builds the Crown (lvl 6), the North ledge (+1, a climb face, a grapple post)
// and the East slab (+2, the vent's ribbon). Anything missing (the placeholder map) is added here at the first fight.
function f2CrownTerrain(){
  const C=F2CR, lv=elevLvl(C.x,C.y); F2G.lvl=lv;
  try{
    const N=C.stones[3], E=C.stones[2];
    if(elevLvl(N.x,N.y)<=lv){ ELEV.plateau({rect:C.ledge,lvl:lv+1,style:'ice',climb:true,noise:4,id:'f2_crown_n'}); }
    if(!(ELEV.posts(mapAt(C.y))||[]).some(q=>dist(q.x,q.y,C.post.x,C.post.y)<120)) ELEV.grapple({x:C.post.x,y:C.post.y,lvl:lv+1});
    if(elevLvl(E.x,E.y)<=lv){ ELEV.plateau({disc:C.slab,lvl:lv+2,style:'ice',noise:6,id:'f2_crown_e'}); }
    // hop-down edges so Ash can come back down from both (only the pieces' own south faces)
    if(!(elevFace(7300,40832)&EF.LEDGE)) ELEV.ledge({x0:7165,y0:40805,x1:7435,y1:40870});
    if(!(elevFace(7760,41300)&EF.LEDGE)) ELEV.ledge({x0:7670,y0:41255,x1:7840,y1:41370});
    if(!WIND.list().some(s=>dist(s.pts[0][0],s.pts[0][1],C.vent.x,C.vent.y)<140))
      WIND.stream({id:'f2_crown_rb',pts:[[C.vent.x,C.vent.y],[7695,41390],[7742,41270],[7780,41190]],lv:[lv,lv+2],w:62,on:()=>F2G.windOn});
  }catch(err){ console.error(err); }
  for(const st of F2G.stones) st.lvl=elevLvl(st.x,st.y);
}
// the stones (fight state; never saved: a lost fight starts over)
function f2StonesMake(){ F2G.stones=F2CR.stones.map((s,i)=>{ const a=angTo(s.x,s.y,F2CR.x,F2CR.y); return Object.assign({},s,{i,done:false,crack:0,heat:0,heatT:-9,snap:0,h:36,lvl:0,
    px:s.x+Math.cos(a)*40,py:s.y+Math.sin(a)*40,glow:0,hint:0}); }); }
f2StonesMake();
function f2StoneOpen(st){ const e=G.boss; if(!e||e.dead||e.type!=='f_glaciar') return false; return !st.done&&(e.bph||0)>=st.ph&&!(F2.whiteT>0); }
function f2StoneCrack(st,how){ if(st.done) return;
  if(!f2StoneOpen(st)){ if(!(st.hint>G.time)){ st.hint=G.time+2.5; ftext(st.x,st.y-90,S('This chain is frozen too hard. Not yet!','Not yet!'),'#dfd4ff',12); } return; }
  st.crack=f2Win(8); st.heat=0; p3Snd('shatter'); shake(4); f2Shards(st.x,st.y-20,18);
  ftext(st.x,st.y-96,S('Crack! Quick, Blaze the lock!','Crack! Blue fire, quick!'),'#dff4ff',14);
  f2Tip('gl_lock',S('The frost lock','The frost lock'),S('The dome is cracked! Hold fire breath until it turns blue (Blaze) and keep it on the lock.','Hold fire until it is blue. Melt the lock!')); }
function f2StoneSnap(st){
  const e=G.boss; st.done=true; st.snap=0.001; st.crack=0; F2G.melted++; const n=F2G.melted;
  p3Snd('melt'); p3Snd('clunk',0.7); jingle('secret','shrine'); shake(10); flashA=Math.max(flashA,0.2); flashCol='200,170,255';
  emit(st.x,st.y-st.h,30,{col:'200,170,255',smin:40,smax:200,lmin:.3,lmax:.8,zmin:1.5,zmax:3.5});
  ftext(st.x,st.y-100,S('SNAP!','SNAP!'),'#e8dcff',18);
  if(e&&!e.dead){ const dmg=Math.min(e.hp-1,e.maxHp*0.06); if(dmg>0){ e.hp-=dmg; e.lastHit=G.time; ftext(e.x,e.y-80,Math.round(dmg),'#ffe066',16); }
    f2GlaStagger(e); later(0.5,()=>{ if(G.boss===e&&!e.dead) taunt('f_glaciar',F2_CHAIN_LINES[Math.min(3,n-1)]); });
    if(n>=4&&e.bph>=2&&!F2G.heart) f2GlaHeart(e); }
  try{ if(F2.hook.chain) F2.hook.chain(n,st.id); }catch(err){ console.error(err); }
}
// a chain snapping makes her stagger (yanked down if she was flying)
function f2GlaStagger(e){ e.mv=null; e.tele=null; const was=e.mode; e.mode='stagger'; e.state='stagger'; e.staggerT=f2Win(4); e.wasMode=was==='stagger'?e.wasMode:was;
  if((e.z||0)>10){ e.yank=true; f2Txt(e,S('The chain yanks her down!','Yanked down!'),'#e8dcff',16); }
  shake(10); SFX.play('roar',0.7); f2Txt(e,S('She staggers! Hit her!','She staggers! Hit her!'),'#ffe066',17); }
// the dome cracks: Ground Pound on or near the rune plate (Ash on the stone's level), a bomb, the hammer's full charge
p3OnPound(info=>{ if(info.drum||!F2G.on) return; const lv=f2Lvl(info.x,info.y);
  for(const st of F2G.stones){ if(st.done||st.crack>0) continue; if(lv<st.lvl) continue;
    if(dist(info.x,info.y,st.px,st.py)<info.R*0.6+34||dist(info.x,info.y,st.x,st.y)<info.R*0.5+50) f2StoneCrack(st,'pound'); } });
function f2OutHit(x,y,r,src){
  if(F2G.on&&(src==='bomb'||(src==='hammer'&&typeof ARMS!=='undefined'&&ARMS.hamCh>=0.98))){ const lv=f2Lvl(x,y);
    for(const st of F2G.stones){ if(st.done||st.crack>0||lv+1<st.lvl) continue; if(dist(x,y,st.x,st.y)<(r||40)+60||dist(x,y,st.px,st.py)<(r||40)+30) f2StoneCrack(st,src); } }
}
// every frame of the fight: blue fire on a cracked lock, the West wall, the whiteout, falls off the edge, allies
function f2GlaFrame(dt){
  const e=G.boss; if(!F2G.on) return;
  if(!e||e.dead||e.type!=='f_glaciar'){ if(!G.fightSite||G.fightSite!=='f_glaciar') f2GlaEnd(); return; }
  const p=player, blue=typeof P3!=='undefined'&&P3.bz&&P3.bz.blue&&p.breathing;
  for(const st of F2G.stones){
    if(st.snap>0&&st.snap<1) st.snap=Math.min(1,st.snap+dt*1.6);
    if(st.crack>0){ st.crack-=dt; if(st.crack<=0){ st.heat=0; p3Snd('crack',0.4); ftext(st.x,st.y-90,S('The dome freezes over again.','The ice grows back.'),'#dff4ff',12); } }
    st.glow=f2StoneOpen(st)?Math.min(1,st.glow+dt*2):Math.max(0,st.glow-dt*2);
    if(st.done) continue;
    const lx=st.x, ly=st.y+16-st.h;
    if(blue&&f2Blue(lx,st.y+16,22)){
      if(!f2StoneOpen(st)){ if(!(st.hint>G.time)){ st.hint=G.time+2.5; ftext(st.x,st.y-96,S('The lock is sealed tight. Not yet!','Not yet!'),'#dfd4ff',12); } }
      else if(st.crack<=0){ if(!(st.hint>G.time)){ st.hint=G.time+2.5; ftext(st.x,st.y-96,S('The dome shields the lock. Crack it first: Ground Pound the rune plate!','Crack the dome first! Pound it!'),'#dff4ff',12); } }
      else { st.heat+=dt; st.heatT=G.time; f2Work(); p3MeltFx(lx,ly,0.6); if(st.heat>=f2Need(2.5)) f2StoneSnap(st); } }
    else if(st.heat>0&&G.time-st.heatT>1.2) st.heat=Math.max(0,st.heat-dt*0.5);
  }
  // the West Stone's wall: she regrows it every 15 s (not on top of Ash)
  const W=F2G.stones[1]; if(!W.done){ const has=F2G.wall&&!F2G.wall.gone;
    if(!has){ F2G.wallT-=dt; if(F2G.wallT<=0&&dist(p.x,p.y,W.x,W.y)>130){ if(!F2G.wallW){ F2G.wallW=0.8; fzAdd('f2mark',{shape:'circle',x:W.x,y:W.y,r:104,dur:0.8,col:F2COL.frost}); ftext(W.x,W.y-110,S('The ice wall grows back!','The ice wall grows back!'),'#dff4ff',13); } }
      if(F2G.wallW>0){ F2G.wallW-=dt; if(F2G.wallW<=0){ F2G.wallW=0; F2G.wallT=15; f2GlaWall(); } } } }
  // the Long Night's whiteout
  if(F2G.night&&!F2G.heart){ F2G.whiteCd-=dt;
    if(F2G.whiteCd<=1.2&&!F2G.whiteWarn){ F2G.whiteWarn=1; setBanner(S('Blizzard!','Blizzard!'),S('Hide by a Chain Stone!','Hide by a stone!'),1.6); for(const st of F2G.stones) fzAdd('safe',{x:st.x,y:st.y+10,r:78,life:3.4}); SFX.play('warn'); }
    if(F2G.whiteCd<=0){ F2G.whiteCd=byDiff(15,12,10); F2G.whiteWarn=0; F2.whiteT=2; F2.whiteMax=2; F2G.whiteTk=0; p3Snd('wind'); } }
  if(F2.whiteT>0){ F2G.whiteTk=(F2G.whiteTk||0)-dt; if(F2G.whiteTk<=0){ F2G.whiteTk=0.5; if(!p.dead&&!F2G.stones.some(st=>dist(p.x,p.y,st.x,st.y+10)<80)) hurtPlayer(f2Dmg(e,5),p.x,p.y-10,0); } }
  // sliding off the Crown after a gust (10 percent, back toward the middle)
  if(F2G.pushT>0) F2G.pushT-=dt; if(F2G.fallCd>0) F2G.fallCd-=dt;
  if(F2G.pushT>0&&F2G.fallCd<=0&&!p.dead&&!f2Up()&&f2Lvl()<=F2G.lvl&&dist(p.x,p.y,F2CR.x,F2CR.y)>F2CR.r-26){
    F2G.fallCd=1.5; const a=angTo(F2CR.x,F2CR.y,p.x,p.y); hurtPlayer(p.maxHp*0.1,p.x,p.y,0); p.kvx=p.kvy=0; p.x=F2CR.x+Math.cos(a)*240; p.y=F2CR.y+Math.sin(a)*240; updateCam(0,true);
    ftext(p.x,p.y-50,S('Whoa! You slid off the edge!','You slid off!'),'#dff4ff',15); shake(6); }
  f2GlaAllies(dt,e);
}
function f2GlaWall(){ const W=F2G.stones[1]; if(F2G.wall&&!F2G.wall.gone) return; const pts=[]; for(let i=0;i<14;i++){ const a=i/14*TAU; pts.push({x:W.x+Math.cos(a)*92,y:W.y+10+Math.sin(a)*80}); }
  F2G.wall=fzAdd('f2wall',{x:W.x,y:W.y,pts,r:20,life:1e9,need:1.2,thin:true,onGone:z=>{ F2G.wallT=15; }}); f2Shards(W.x,W.y,20); }
function f2GlaEnd(){ if(!F2G.on) return; F2G.on=false; F2G.windOn=false; F2.whiteT=0; F2G.mumble=null; F2G.grey=null; }
F2FIGHT.f_glaciar={
  start(){ f2StonesMake(); f2CrownTerrain(); Object.assign(F2G,{on:true,melted:0,heart:false,night:false,windOn:false,wall:null,wallT:15,wallW:0,whiteCd:12,whiteWarn:0,pushT:0,fallCd:0,mumble:null,grey:null,nyx:false,outcome:null});
    f2GlaWall(); later(2.5,()=>{ if(G.fightSite==='f_glaciar') f2Tove(S('Melt the chains!','Melt the chains!'),12); }); },
  reset(){ f2GlaEnd(); for(const q of G.enemies) if(!q.dead&&q.type==='f_shardling') q.dead=true; }};
// ---- her moves
// Frost Breath: the mouth glows white (a cone), then a slow sweep; the ground it touches turns to ice
FM.f2gbreath={
  start(e,m){ const o=m.o; e.state='breathW'; e.st=f2W(o,0.9); m.len=o.len||420; m.half=o.half||0.5; m.go=false; e.tele=newTele({shape:'cone',len:m.len,half:m.half,dur:e.st,col:F2COL.white}); },
  tick(e,dt,d,a,m){ const p=player, H=f2GlaHead(e);
    if(!m.go){ e.face=turnTo(e.face,a,2.2*dt); e.st-=dt; if(e.st>0) return false; m.go=true; e.tele=null; e.state='breath'; e.st=m.o.dur||1.6; m.tk=0; m.ice=0; return false; }
    e.face=turnTo(e.face,a,(m.o.sweep||0.7)*dt); const mx=H.x, my=H.y;
    emit(mx,my,3,{col:'220,240,255',ang:e.face,spread:m.half*0.7,smin:m.len*1.2,smax:m.len*1.6,lmin:.35,lmax:.55,zmin:4,zmax:8,grow:18,drag:1});
    m.tk-=dt; if(m.tk<=0){ m.tk=0.12; if(!p.dead&&inCone(mx,my,e.face,m.len,m.half,p.x,p.y,p.r)&&!(typeof p2Shadowed==='function'&&p2Shadowed())&&!(p.z>30)){ if(hurtPlayer(f2Dmg(e,m.o.dmgN||10),mx,my,60)) f2Chill(byDiff(4,2,2)); } }
    m.ice-=dt; if(m.ice<=0){ m.ice=0.16; const r=rand(80,m.len), q=e.face+rand(-m.half,m.half)*0.8; const C=f2Ctx(e), s={x:mx+Math.cos(q)*r,y:my+Math.sin(q)*r}; f2Hold(C,s,30); f2IceAdd(s.x,s.y,rand(30,42),6,{a:0.9}); }
    e.st-=dt; return e.st<=0; } };
// Tail Sweep: a donut round her (jump it)
FM.f2donut={
  start(e,m){ const o=m.o; e.state=o.st||'tailW'; e.st=f2W(o,o.windup||0.65); m.z=f2Mark({shape:'donut',x:e.x,y:e.y,r1:o.r1||60,r2:o.r2||240,dur:e.st,col:o.col||F2COL.white}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player; e.st-=dt; if(!m.go){ if(e.st>0) return false; m.go=true; e.state=o.st2||'tail'; e.st=0.35; SFX.play('whoosh');
      const dd=dist(p.x,p.y,e.x,e.y); if(!p.dead&&!f2Up()&&dd>(o.r1||60)-p.r&&dd<(o.r2||240)+p.r) hurtPlayer(fkDmg(e,o),e.x,e.y,o.kb||360);
      for(let i=0;i<20;i++){ const q=i/20*TAU; emit(e.x+Math.cos(q)*150,e.y+Math.sin(q)*120,1,{col:'235,245,255',glow:false,ang:q+1.6,spread:0.2,smin:200,smax:300,lmin:.2,lmax:.4,zmin:1.5,zmax:3,drag:2}); } return false; }
    return e.st<=0; } };
// Dive: from the air (or a quick take-off from the coil) along a red line; then she lands for a while (the melee window)
FM.f2gdive={
  start(e,m){ const o=m.o, p=player; m.ph=0; m.z0=e.z||0; e.state='diveRise'; e.st=m.z0>60?0.05:0.45; m.T=f2W(o,o.windup||0.8); },
  tick(e,dt,d,a,m){ const o=m.o, p=player, C=f2Ctx(e);
    if(m.ph===0){ e.z=lerp(e.z||0,110,Math.min(1,dt*5)); e.st-=dt; if(e.st>0) return false; m.ph=1; e.state='diveAim'; e.st=m.T; m.ang=angTo(e.x,e.y,p.x,p.y); e.face=m.ang;
      m.len=clamp(dist(e.x,e.y,p.x,p.y)+180,300,o.len||520); e.tele=newTele({shape:'line',len:m.len,w:o.lw||70,dur:e.st,col:F2COL.red}); f2Say(e,'f_glaciar',S('ROOOOAR!','ROAR!'),6); SFX.play('warn'); return false; }
    if(m.ph===1){ if(e.st>0.25){ m.ang=turnTo(m.ang,a,1.6*dt); e.face=m.ang; m.len=clamp(dist(e.x,e.y,p.x,p.y)+180,300,o.len||520); if(e.tele) e.tele.len=m.len; } e.st-=dt; if(e.st>0) return false;
      m.ph=2; e.tele=null; e.state='dive'; m.d=0; m.hit=false; SFX.play('dash'); return false; }
    if(m.ph===2){ const s=(o.spd||900)*dt; e.x+=Math.cos(m.ang)*s; e.y+=Math.sin(m.ang)*s; m.d+=s; e.dx=e.dy=0; e.noClip=true; e.z=lerp(e.z||0,14,Math.min(1,dt*8));
      if(Math.random()<dt*30) emit(e.x,e.y-e.z,1,{col:'235,246,255',glow:false,ang:m.ang+Math.PI,spread:0.4,smin:40,smax:140,lmin:.2,lmax:.45,zmin:2,zmax:4,drag:2});
      if(!m.hit&&!p.dead&&!f2Up()&&dist(e.x,e.y,p.x,p.y)<e.r*0.8+p.r){ if(hurtPlayer(fkDmg(e,o),e.x,e.y,420)) m.hit=true; }
      if(m.d<m.len&&f2In(C,e.x,e.y,e.r*0.6)) return false;
      f2Hold(C,e,e.r*0.6+10); m.ph=3; e.z=0; e.state='perched'; e.st=f2Win(o.land||2.5); shake(9); SFX.play('boom'); f2Snow(e.x,e.y,30);
      F2G.landT=G.time; try{ f2GlaLanded(e); }catch(err){ console.error(err); } return false; }
    e.z=0; e.st-=dt; return e.st<=0; } };
// Snowball Boulders: two rolling snowballs across the arena (jump them, or pound one to burst it)
FM.f2boulders={
  start(e,m){ e.state='roarW'; e.st=f2W({},0.4); },
  tick(e,dt,d,a,m){ e.st-=dt; if(e.st>0) return false; const p=player, C=f2Ctx(e), n=m.o.n||2;
    for(let i=0;i<n;i++){ const off=(i-(n-1)/2)*rand(90,150), b=rand(0,TAU), sx=C.cx+Math.cos(b)*C.R*0.9, sy=C.cy+Math.sin(b)*C.R*0.9, ang=angTo(sx,sy,p.x+Math.cos(b+Math.PI/2)*off,p.y+Math.sin(b+Math.PI/2)*off);
      f2Roller(sx,sy,ang,{r:26,spd:340,len:C.R*1.9,dmg:f2Dmg(e,m.o.dmgN||28),wait:f2W({},0.6)+i*0.25}); }
    SFX.play('roar',0.5); return true; } };
FM_DEF.f2gbreath={recover:0.5}; FM_DEF.f2donut={recover:0.4}; FM_DEF.f2gdive={recover:0.3}; FM_DEF.f2boulders={recover:0.4};
// icicles from the sky: a hit where Ash stood, then an ice spike stands there for 6 s (Blaze, a pound or a bomb breaks it)
function f2GlaIcicle(e,x,y){ f2Shards(x,y,16); SFX.play('pop'); const p=player; if(!p.dead&&!f2Up()&&dist(x,y,p.x,p.y)<50+p.r*0.5) hurtPlayer(f2Dmg(e,30),x,y,240);
  else fzAdd('f2spike',{x,y,r:16,life:6,h:46}); }
const GLA_MOVES={
  breath:{k:'f2gbreath',max:560,dmgN:10,w:3},
  icicles:{k:'f2spots',st:'iciclesW',n:6,r:50,windup:1.0,r0:70,r1:230,col:F2COL.frost,drop:true,max:900,w:2.2,place:f2GlaIcicle},
  icicles2:{k:'f2spots',st:'iciclesW',n:6,r:50,windup:1.0,r0:70,r1:230,col:F2COL.frost,drop:true,max:900,w:2.2,place:f2GlaIcicle,onStart:(e,m)=>later(0.65,()=>{ if(G.boss===e&&!e.dead) f2GlaRain(e); })},
  tail:{k:'f2donut',st:'tailW',r1:60,r2:240,windup:0.65,dmgN:34,max:320,w:(e,d,a)=>(d<220||Math.abs(angDiff(e.face,a))>1.9)?4:0},
  dive:{k:'f2gdive',len:520,lw:70,windup:0.8,dmgN:40,land:2.5,min:120,max:1200,w:3},
  dive2:{k:'f2gdive',len:520,lw:70,windup:0.8,dmgN:40,land:2.0,min:160,max:1200,w:1.6,every:7},
  boulders:{k:'f2boulders',n:2,dmgN:28,max:1200,w:2,every:6},
  gust:{k:'f2cone',st:'gustW',st2:'gust',windup:0.8,len:520,half:0.55,push:2700,pushT:0.55,dmgN:0,pcol:'240,248,255',col:F2COL.snow,max:600,w:1.6,every:7,onAim:(e,m)=>{ F2G.pushT=1.6; }},
  shards:{k:'summon',type:'f_shardling',n:3,every:14,windup:0.6,st:'summon',r0:60,r1:180,opt:{aggro:true},max:1200,w:1.6,if:e=>countType('f_shardling')<4}};
// a second wave of icicles right after the first (the Long Night's double rain)
function f2GlaRain(e){ const p=player, C=f2Ctx(e); for(let i=0;i<6;i++){ const a=rand(0,TAU), r=i?rand(60,220):0, q=f2Hold(C,{x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r},30); f2Mark({x:q.x,y:q.y,r:50,dur:f2W({},1.0),col:F2COL.frost,drop:true,fire:z=>f2GlaIcicle(e,z.x,z.y)}); } }
const GLA_COIL=FK.brain({move:'hold',turn:2.2,cd:[1.2,2.0],recoverMove:0,moves:[GLA_MOVES.breath,GLA_MOVES.icicles,GLA_MOVES.tail]});
const GLA_HEART=FK.brain({move:'hold',turn:1.8,cd:[1.7,2.8],recoverMove:0,moves:[GLA_MOVES.breath,GLA_MOVES.icicles,GLA_MOVES.tail]});
const GLA_NIGHT=FK.brain({move:'hold',turn:2.4,cd:[0.95,1.6],recoverMove:0,moves:[GLA_MOVES.breath,GLA_MOVES.icicles2,GLA_MOVES.tail,GLA_MOVES.dive2]});
const GLA_AIR=FK.brain({move:'hold',turn:3,cd:[1.2,2.0],recoverMove:0,moves:[GLA_MOVES.dive,GLA_MOVES.boulders,GLA_MOVES.gust,GLA_MOVES.shards]});
// the warnings she gives in the Shard Heart phase, one per attack (bible 9.5)
const F2_GLA_WARN={f2gbreath:S('Duck, dumpling!','Duck, dumpling!'),f2donut:S('Jump!','Jump!'),f2spots:S('Mind your head!','Mind your head!')};
// her head (the mouth for the breath) on the coil or in the air
function f2GlaHead(e){ const k=(e.r0||60)/60, f=e.face; return {x:e.x+Math.cos(f)*74*k,y:e.y+Math.sin(f)*74*k*0.9,z:(e.z||0)+44*k}; }
// hit circles: head (x1.4, x2 staggered), body, tail (x0.7); in the Shard Heart only the Shard in her chest takes full damage
F2HC.f_glaciar=e=>{ const L=e._hc||(e._hc=[{},{},{},{}]), k=(e.r0||60)/60, f=e.face, H=f2GlaHead(e), st=e.state==='stagger', heart=F2G.heart&&e.bph>=2; let n=0;
  f2HS(L,n++,{x:e.x,y:e.y,r:60*k,m:heart?0.2:st?2:1});
  f2HS(L,n++,{x:H.x,y:H.y,r:30*k,m:heart?0.2:st?2.8:1.4});
  f2HS(L,n++,{x:e.x-Math.cos(f+0.6)*70*k,y:e.y-Math.sin(f+0.6)*60*k,r:26*k,m:heart?0.2:st?1.4:0.7});
  if(heart) f2HS(L,n++,{x:e.x+Math.cos(f)*34*k,y:e.y+Math.sin(f)*30*k,r:22*k,m:1});
  L.length=n; return L; };
f2Foe('f_glaciar',{boss:true,name:'Glaciar',title:S('the Ice Dragon of Mount Dread','the ice dragon'),short:'Glaciar',
  lv:17,hp:10500,r:60,speed:60,dmg:26,value:3300,kbRes:0,dcol:'200,230,255',phases:[0.7,0.4],
  phaseText:[[S('The Blizzard Wings!','Blizzard Wings!'),S('She flies! Arrows reach her up there. She lands after each dive. The East and North Chain Stones are open now!','She flies! Hit her when she lands. Melt the East and North chains!'),['nyxara',S('Sleep, little cold one. Be cold for me.','Sleep, cold one. Be cold for me.')]],
             [S('The last chains...','The last chains...'),'',null]],
  init(e){ f2BossInit(e); e.mode='coil'; e.z=0; e.fly=0; e.c8=rand(0,TAU); e.homeX=e.homeX||F2CR.x; e.homeY=e.homeY||F2CR.y; e.r0=60; },
  onPhase(e,i){ e.mv=null; e.tele=null;
    if(i===1){ e.mode='air'; F2G.windOn=true; shake(14); SFX.play('roar'); f2Tip('gl_fly',S('She flies!','She flies!'),S('The East Stone sits on a high ice slab: ride the updraft ribbon from the vent. The North Stone is on a ledge: climb it or use the grapple post.','Ride the vent wind to the East Stone. Climb to the North Stone.'));
      later(3.5,()=>{ if(G.boss===e&&!e.dead) f2Tove(S('The vent! Ride it to the slab!','Ride the vent wind!'),14); }); later(9,()=>{ if(G.boss===e&&!e.dead) f2Tove(S('Up on the ledge! Climb!','Climb the ledge!'),14); }); }
    if(i===2){ if(F2G.melted>=4) f2GlaHeart(e); else f2GlaNight(e); } },
  ai:(e,dt,p)=>f2GlaciarAI(e,dt,p),
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if((e.z||0)>36){ if(f2Ranged(o)) a=amt; else if(h.fire) a=amt*0.5; else { if(!(e._hiT>G.time)){ e._hiT=G.time+2.4; f2Txt(e,S('She is up in the air! Use arrows, or hit her when she lands.','Too high! Arrows, or wait till she lands.'),'#e8f6ff',13); } return false; } }
    if(F2G.heart&&e.bph>=2){ const shard=(o.mult||0)>=0.99; if(!shard&&o.mult==null) a*=0.2;
      if(shard&&!(e._flT>G.time)){ e._flT=G.time+0.7; if(e.state!=='stagger'){ e.mv=null; e.tele=null; e.state='flinch'; e.st=0.6; } f2Txt(e,S('The Shard rings! Again!','The Shard! Again!'),'#e8dcff',14); }
      else if(!shard&&!(e._shT>G.time)){ e._shT=G.time+3; f2Txt(e,S('Hit the glowing Shard in her chest!','Hit the Shard!'),'#e8dcff',13); } }
    if(e.state==='stagger'&&o.mult==null) a*=2;
    // the Long Night wraps her in frost: every hit does less (melting the last chains is the better way)
    if(F2G.night&&!F2G.heart&&e.bph>=2){ a*=byDiff(0.75,0.65,0.55); if(!(e._ngT>G.time)){ e._ngT=G.time+6; f2Txt(e,S('The night frost wraps her. Melt her chains!','Night frost! Melt the chains!'),'#cfe0ff',12); } }
    return a; },
  onDeath(e){ F2G.outcome=(F2G.melted>=4&&F2G.heart)?'free':'defeat'; G.choices.f_glaciar=F2G.outcome; F2.whiteT=0; f2GlaEnd(); },
  draw3d:f2FigGlaciar, draw2d:f2Glaciar2,
  sheet:f2Sheet([{state:'chase',mode:'coil',z:0,label:'coiled'},{state:'breathW',mode:'coil',z:0,st:0.5,at:0.5,label:'breath windup'},{state:'breath',mode:'coil',z:0,label:'frost breath'},{state:'tailW',mode:'coil',z:0,st:0.3,at:0.3,label:'tail sweep'},
    {state:'iciclesW',mode:'coil',z:0,st:0.5,at:0.5,label:'icicle rain'},{state:'chase',mode:'air',z:130,dx:120,label:'flying'},{state:'diveAim',mode:'air',z:110,st:0.4,label:'dive aim'},{state:'dive',mode:'air',z:16,label:'dive'},
    {state:'perched',mode:'air',z:0,label:'landed'},{state:'stagger',mode:'stagger',z:0,label:'staggered'},{state:'chase',mode:'coil',heart:true,z:0,label:'shard heart'},{state:'chase',deathT:0.3,mode:'coil',z:0,label:'death'}])});
// a stunned Glaciar? never: only her chains stagger her
// a stun (a Ground Pound's, a shield bash's) never cuts short a state an Act III foe was just put in (flipped by the same
// pound, horns stuck, on its back, dazed): the stun still counts, the state stays
const F2KEEP={flipped:1,stuck:1,stagger:1,dizzy:1,puddle:1,flinch:1,fall:1};
{ const base=stunEnemy; stunEnemy=function(e,t){ if(e&&e.type==='f_glaciar') return;
    if(e&&!e.dead&&F2KEEP[e.state]&&FOES[e.type]&&FOES[e.type].f2){ const s=e.state, st=e.st; base(e,t); e.state=s; e.st=st; return; }
    return base(e,t); }; }
function f2GlaHeart(e){ F2G.heart=true; F2G.night=false; F2.whiteT=0; e.mv=null; e.tele=null; e.mode=(e.z||0)>10?'return':'coil'; e.flick=1;
  setBanner(S('The Shard Heart!','The Shard Heart!'),S('She is fighting the spell! Hit the glowing Shard in her chest.','Hit the Shard in her chest!'),2.8);
  later(1.2,()=>{ if(G.boss===e&&!e.dead) f2Tove(S('Her chest! Hit the Shard!','Hit the Shard!'),12); }); }
function f2GlaNight(e){ F2G.night=true; F2G.whiteCd=6; e.mode=(e.z||0)>10?'return':'coil';
  setBanner(S('The Long Night!','The Long Night!'),S('Blizzards! Hide by a Chain Stone. The chains still left can still be melted.','Blizzards! Hide by a stone. Melt the last chains!'),3); }
// the Glaciar brain (reusable: a finale echo can call f2GlaciarAI with e.f2ctx set to its ring and e.mode 'coil' or 'air')
function f2GlaciarAI(e,dt,p){
  p=p||player; const C=f2Ctx(e), Df=foeDiff(); e.noClip=true; e.mt=(e.mt||0)+dt; e.stun=0;
  const fly=(x,y,spd,z)=>{ steer(e,x,y,spd*Df.spd); e.noClip=true; if(z!=null) e.z=lerp(e.z||0,z,Math.min(1,dt*2.2)); if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),2.6*dt); };
  if(e.flick>0) e.flick=Math.max(0,e.flick-dt*0.2);
  // the under-the-spell taunts now and then
  if(!F2G.heart&&!(e._tnT>G.time)){ e._tnT=G.time+rand(14,20); if(e._tnT>0&&e.mt>6) taunt('f_glaciar',pick(F2_GLA_TAUNT)); }
  switch(e.mode){
    case 'stagger': { e.dx=e.dy=0; e.tele=null; e.state='stagger'; if(e.yank){ e.z=Math.max(0,(e.z||0)-dt*420); if(e.z<=0){ e.yank=false; shake(10); SFX.play('boom'); f2Snow(e.x,e.y,30); f2Hold(C,e,e.r*0.6+10); } }
      e.staggerT-=dt; if(Math.random()<dt*8) emit(e.x+rand(-40,40),e.y-40,1,{col:'220,200,255',glow:true,smin:10,smax:40,lmin:.4,lmax:.7,zmin:1.5,zmax:2.5});
      if(e.staggerT<=0){ e.state='chase'; e.cd=0.6; const w=e.wasMode; e.mode=F2G.heart?'return':(e.bph===1?'air':(w==='coil'||w==='return'||!w)?'return':w); } return; }
    case 'coil': {
      // on the spike in the middle; she turns to face Ash
      if(dist(e.x,e.y,C.cx,C.cy)>12&&!e.mv){ e.mode='return'; return; }
      if(!e.mv) e.z=lerp(e.z||0,0,Math.min(1,dt*6));
      if(F2G.heart&&e.bph>=2){ GLA_HEART(e,dt,p); if(e.mv&&!e.mv.warned){ e.mv.warned=true; const w=F2_GLA_WARN[e.mv.o.k]; if(w) taunt('f_glaciar',w); } bossCad(e,1.4); }
      else if(F2G.night&&e.bph>=2){ GLA_NIGHT(e,dt,p); bossCad(e,0.8); if(e.mv&&e.mv.o.k==='f2gdive') e.mode='coilDive'; }
      else { GLA_COIL(e,dt,p); bossCad(e,e.bph>=1?0.9:1); }
      return; }
    case 'coilDive': GLA_NIGHT(e,dt,p); if(!e.mv&&e.state!=='perched'){ e.mode='return'; } return;
    case 'air': {
      GLA_AIR(e,dt,p); bossCad(e,1);
      if(e.mv||e.state==='perched') return;
      // a figure eight over the Crown (she takes off again after a landing)
      e.c8+=dt*0.42*Df.spd; const R=C.R*0.62, tx=C.cx+Math.sin(e.c8)*R, ty=C.cy+Math.sin(e.c8*2)*R*0.42;
      fly(tx,ty,e.speed*(e.state==='recover'?1.2:3.4),130); return; }
    case 'return': { fly(C.cx,C.cy,e.speed*3.4,dist(e.x,e.y,C.cx,C.cy)<40?0:60); e.state='chase';
      if(dist(e.x,e.y,C.cx,C.cy)<16){ e.x=C.cx; e.y=C.cy; e.mode=(e.bph===1&&!F2G.heart)?'air':'coil'; e.cd=0.8; } return; }
    default: e.mode='coil';
  }
}
// ---- the allies: Mumble (G.flags.f_mumble_ally) from phase 2, Greymane (G.flags.f_pack_ally) from 60 percent
function f2GlaAllyOn(k){ try{ if(F2.hook.ally) { const v=F2.hook.ally(k); if(v!=null) return !!v; } }catch(err){} return k==='mumble'?!!G.flags.f_mumble_ally:!!G.flags.f_pack_ally; }
function f2GlaAllies(dt,e){
  const p=player, C=f2Ctx(e);
  if(!F2G.mumble&&e.bph>=1&&f2GlaAllyOn('mumble')){ const a=angTo(C.cx,C.cy,p.x,p.y)+0.9; F2G.mumble={x:C.cx+Math.cos(a)*C.R*0.75,y:C.cy+Math.sin(a)*C.R*0.75,face:0,t:0,dx:0,dy:0,state:'chase',holdT:0,holdCd:0,throwT:5,tx:null,ty:null};
    taunt('f_mumble',S('(ROAAAAR!)','(ROAAAR!)')); f2Snow(F2G.mumble.x,F2G.mumble.y,30); shake(6); }
  if(!F2G.grey&&e.hp<e.maxHp*0.6&&f2GlaAllyOn('grey')){ const a=angTo(C.cx,C.cy,p.x,p.y)-0.9; F2G.grey={x:C.cx+Math.cos(a)*C.R*0.8,y:C.cy+Math.sin(a)*C.R*0.8,face:0,t:0,dx:0,dy:0,cd:0,howlT:3,biteT:4};
    taunt('greymane',S('AWOOOOO!','AWOOO!')); }
  const walk=(A,tx,ty,spd)=>{ const d=dist(A.x,A.y,tx,ty); if(d>6){ const s=Math.min(d,spd*dt); A.dx=(tx-A.x)/d*spd; A.dy=(ty-A.y)/d*spd; A.x+=(tx-A.x)/d*s; A.y+=(ty-A.y)/d*s; A.face=Math.atan2(A.dy,A.dx); } else { A.dx=A.dy=0; } };
  const M=F2G.mumble; if(M){ M.t+=dt; M.holdCd-=dt; M.throwT-=dt;
    if(M.holdT>0){ M.holdT-=dt; const tx=e.x-Math.cos(e.face)*90, ty=e.y-Math.sin(e.face)*70; walk(M,tx,ty,320); M.face=angTo(M.x,M.y,e.x,e.y); M.state='hold'; if(e.state==='perched') e.st=Math.max(e.st,0.2); if(M.holdT<=0) M.state='chase'; }
    else { const a=angTo(C.cx,C.cy,p.x,p.y)+1.2, tx=C.cx+Math.cos(a)*C.R*0.7, ty=C.cy+Math.sin(a)*C.R*0.7; walk(M,tx,ty,200); M.state='chase'; }
    if(M.throwT<=0){ M.throwT=5; const sh=G.enemies.filter(q=>!q.dead&&q.type==='f_shardling'); if(sh.length){ const q=sh[0]; M.state='throw'; M.face=angTo(M.x,M.y,q.x,q.y);
        fzAdd('f2lob',{x0:M.x,y0:M.y,x:q.x,y:q.y,r:20,dur:0.6,col:F2COL.snow,ball:'#f4f8ff',br:7,h:90,land:()=>{ if(!q.dead){ f2Snow(q.x,q.y-14,18); killEnemy(q); } }}); } } }
  const Gr=F2G.grey; if(Gr){ Gr.t+=dt; Gr.howlT-=dt; Gr.biteT-=dt; Gr.cd=Math.max(0,Gr.cd-dt);
    const low=(e.z||0)<20; const tx=low?e.x+Math.cos(e.face+2.2)*(e.r+40):p.x+Math.cos(G.time*0.7)*120, ty=low?e.y+Math.sin(e.face+2.2)*(e.r+30):p.y+Math.sin(G.time*0.7)*90; walk(Gr,tx,ty,low?360:260);
    if(Gr.howlT<=0){ Gr.howlT=12; taunt('greymane',S('AWOOOO!','AWOOO!')); for(const q of G.enemies) if(!q.dead&&q.type==='f_shardling'){ q.f2slowT=4; } SFX.play('howl'); }
    if(Gr.biteT<=0&&low&&dist(Gr.x,Gr.y,e.x,e.y)<e.r+70){ Gr.biteT=7; Gr.cd=7; const dmg=Math.min(e.hp-1,e.maxHp*0.03); if(dmg>0){ e.hp-=dmg; e.lastHit=G.time; ftext(e.x,e.y-70,S('CHOMP!','CHOMP!'),'#bfe6ff',15); } } }
  // Greymane's howl: Shardlings move at half speed for 4 s
  for(const q of G.enemies) if(!q.dead&&q.f2slowT>0){ q.f2slowT-=dt; q.dx*=0.5; q.dy*=0.5; }
}
// a dive landed: Mumble grabs her tail and holds her down for 3 more seconds (at most every 20 s)
function f2GlaLanded(e){ const M=F2G.mumble; if(M&&M.holdCd<=0){ M.holdCd=20; M.holdT=3; if(e.st!=null) e.st+=3; taunt('f_mumble',S('(squeak!) Got her TAIL!','Got her tail!'));
  // the people module's ROAR pose for Mumble (arms up, 2.6 s), when that module is in the game
  if(typeof f2pMumbleRoar==='function'){ try{ f2pMumbleRoar(f2MumbleNpc(M)); }catch(err){} } } }
f2Spk('greymane','Greymane','#bfe0ff');
// ---- the Glaciar site: the Crown of Dread. It opens at stage f_glaciar (the story's summit door sets it) until she is beaten.
f2Site('f_glaciar','f_glaciar',{boss:'f_glaciar',at:{x:F2CR.x,y:F2CR.y,r:F2CR.r,name:S('The Crown of Dread','The Crown of Dread'),level:17},stage:'f_glaciar',
  open:()=>!G.bossDone.f_glaciar&&!G.flags.f_glaciar_won,
  arena:{shape:'ring',r:F2CR.wall,style:'ice',skipBlocked:true},flyOK:false,music:'f_glaciar',spawn:P=>({x:P.x,y:P.y}),
  onStart(){ f2FightStart('f_glaciar'); }, onReset(){ f2FightReset('f_glaciar'); },
  onWin(){ const out=G.choices.f_glaciar||F2G.outcome||'defeat'; G.flags.f_glaciar_won=1; G.flags.f_shard2_got=1;
    // (her last Shardlings go with her: one left flying round the Crown kept Ash "in combat", and in combat no prompt
    //  shows, so the walk-up talk with her after the fight (f_glaciar.js f3_auntie) could not be started)
    for(const q of G.enemies) if(!q.dead&&q.type==='f_shardling') q.dead=true;
    f2Won('f_glaciar');
    try{ if(F2.hook.glaciarDone) F2.hook.glaciarDone(out); }catch(err){ console.error(err); } }});
// ---- the Chain Stones, the chains and the plates (drawn while she is on the Crown)
function f2GlaGround(){ if(!F2G.on&&!(G.boss&&G.boss.type==='f_glaciar')) return; const t=G.time; ctx.save();
  for(const st of F2G.stones){ if(!inView(st.x,st.y,300)) continue; const open=f2StoneOpen(st), cr=st.crack>0;
    ctx.fillStyle='rgba(20,14,30,.5)'; ctx.beginPath(); ctx.ellipse(st.px,st.py,22,10,0,0,TAU); ctx.fill();
    ctx.fillStyle=st.done?'#6a6478':cr?'#e8c860':open?'#8a6ad0':'#4a4458'; ctx.beginPath(); ctx.ellipse(st.px,st.py-2,18,8,0,0,TAU); ctx.fill(); ctx.strokeStyle=F2OL(); ctx.lineWidth=2; ctx.stroke();
    ctx.strokeStyle=cr?'#fff4c0':'rgba(220,200,255,.8)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(st.px-8,st.py-2); ctx.lineTo(st.px,st.py-7); ctx.lineTo(st.px+8,st.py-2); ctx.lineTo(st.px,st.py+3); ctx.closePath(); ctx.stroke();
    if(open&&!cr){ ctx.globalAlpha=0.4+0.3*Math.sin(t*4+st.i); ctx.strokeStyle='#c8a8ff'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(st.px,st.py-2,26+3*Math.sin(t*4),12,0,0,TAU); ctx.stroke(); ctx.globalAlpha=1; } }
  ctx.restore(); }
function f2GlaTall(list){ if(!F2G.on) return; const e=G.boss&&G.boss.type==='f_glaciar'&&!G.boss.dead?G.boss:null;
  for(const st of F2G.stones){ if(!inView(st.x,st.y,400)) continue; if(!st.it) st.it={x:st.x,y:st.y,draw:()=>f2DrawStone(st)}; st.it.y=st.y+18; list.push(st.it);
    if(e&&(!st.done||st.snap<1)){ if(!st.ci) st.ci={x:0,y:0,flying:true,draw:()=>f2DrawChain(st,G.boss)}; st.ci.x=(st.x+e.x)/2; st.ci.y=Math.max(st.y,e.y)+40; list.push(st.ci); } }
  const M=F2G.mumble; if(M){ if(!M.it) M.it={x:0,y:0,draw:()=>f2DrawMumbleAlly(F2G.mumble)}; M.it.x=M.x; M.it.y=M.y; list.push(M.it); }
  const Gr=F2G.grey; if(Gr){ if(!Gr.it) Gr.it={x:0,y:0,draw:()=>f2DrawGreyAlly(F2G.grey)}; Gr.it.x=Gr.x; Gr.it.y=Gr.y; list.push(Gr.it); } }
function f2DrawStone(st){ const x=st.x, y=st.y, t=G.time, oc=F2OL(), open=f2StoneOpen(st); ctx.save();
  ctx.fillStyle='rgba(20,14,30,.35)'; ctx.beginPath(); ctx.ellipse(x,y+6,28,10,0,0,TAU); ctx.fill();
  ctx.fillStyle=oc; rrect(ctx,x-21,y-80,42,88,10); ctx.fill(); ctx.fillStyle='#2e2a3e'; rrect(ctx,x-18,y-77,36,82,8); ctx.fill(); ctx.fillStyle='#46405a'; rrect(ctx,x-18,y-77,12,82,8); ctx.fill();
  ctx.fillStyle='#e8f2ff'; rrect(ctx,x-20,y-82,40,10,5); ctx.fill();
  const g=open?0.6+0.3*Math.sin(t*4+st.i):st.done?0:0.25; if(g>0){ ctx.strokeStyle=`rgba(200,170,255,${g})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(x-8,y-58); ctx.lineTo(x,y-66); ctx.lineTo(x+8,y-58); ctx.lineTo(x,y-50); ctx.closePath(); ctx.moveTo(x,y-46); ctx.lineTo(x,y-30); ctx.stroke(); }
  ctx.strokeStyle='#5a4a78'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(x,y-70,6,0,TAU); ctx.stroke();
  ctx.restore();
  try{ p3DrawLock(x,y+16,st.h,st.done,st.done?st.snap:0,st.done?-1:(st.crack>0?st.crack:0),clamp(st.heat/f2Need(2.5),0,1),t); }catch(err){}
  if(open&&!st.done&&st.glow>0.5){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.25*st.glow; ctx.drawImage(foGlowSpr('190,150,255'),x-50,y-110,100,100); ctx.restore(); } }
// a chain of moth-frost from the stone's ring to her body (it whips back into her when it snaps)
function f2DrawChain(st,e){ if(!e||e.dead) return; const k=st.done?1-st.snap:1; if(k<=0.02) return;
  const ax=st.x, ay=st.y-70, ez=e.z||0, bx0=e.x+Math.cos(angTo(e.x,e.y,st.x,st.y))*40, by0=e.y-ez-24+Math.sin(angTo(e.x,e.y,st.x,st.y))*24;
  const bx=bx0, by=by0, sx=lerp(bx,ax,k), sy=lerp(by,ay,k), mx=(sx+bx)/2, my=(sy+by)/2+50*(1-Math.min(1,ez/150))+20;
  const t=G.time, pulse=0.6+0.4*Math.sin(t*3+st.i), n=16; ctx.save(); ctx.lineCap='round';
  ctx.strokeStyle='rgba(40,20,70,.55)'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.quadraticCurveTo(mx,my,bx,by); ctx.stroke();
  for(let i=0;i<n;i++){ const u=i/(n-1), x=(1-u)*(1-u)*sx+2*u*(1-u)*mx+u*u*bx, y=(1-u)*(1-u)*sy+2*u*(1-u)*my+u*u*by;
    ctx.fillStyle=i%2?'#9a7ae0':'#c8b4f8'; ctx.strokeStyle=F2OL(); ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(x,y,i%2?3.4:5,i%2?5:3.4,0,0,TAU); ctx.fill(); ctx.stroke(); }
  ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.25*pulse; ctx.strokeStyle='rgba(190,150,255,1)'; ctx.lineWidth=10; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.quadraticCurveTo(mx,my,bx,by); ctx.stroke(); ctx.restore(); }
// the boss bar: four lock pips, lit as the chains break
{ const base=drawHUD; drawHUD=function(){ base(); try{ const b=G&&G.boss; if(!b||b.dead||b.type!=='f_glaciar') return;
    const story=G.mode==='story', T=SAFE.t+14, bw2=Math.min(620,W-40-SAFE.l-SAFE.r), bx2=(W-bw2)/2, by=usingTouch?(W>=720?T+40:T+(story?170:150)):H-SAFE.b-46;
    for(let i=0;i<4;i++){ const st=F2G.stones[i]||{}, x=bx2+8+i*17, y=by-20, on=!!st.done; ctx.save();
      ctx.fillStyle=on?'#ffd27a':f2StoneOpen(st)?'#8a6ad0':'rgba(40,20,50,.85)'; ctx.strokeStyle='rgba(255,230,200,.8)'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(x,y-3,3.6,Math.PI,TAU); ctx.stroke(); rrect(ctx,x-5,y-2,10,8,2); ctx.fill(); ctx.stroke(); ctx.restore(); } }catch(err){} }; }
// ---- her look: a river of a dragon. White and pale blue scales with silver edges, icicle horns that curl back like a
// crown, frost whiskers, wings like frosted glass, violet eyes under the spell (blue when free), the Shard in her chest.
function f2FigGlaciar(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.f_glaciar.r)/60*2.9, face=t3Turn(e,e.face,st==='dive'?3:3.4), fx=e.x, fy=e.y+e.r*0.3, inS=foSt(e), dead=foDeath(e), hurt=f2Hurt(e);
  const air=(e.z||0)>12||st==='dive'||st==='diveAim'||e.mode==='air'&&st!=='perched', zf=(e.z||0)/k;
  const wh=fl?'#ffffff':foT(e,'#f0f6ff'), bl=foT(e,'#bfe0fa'), blD=foT(e,'#86b8e6'), sil='#d8e4f2', belly='#e4f2ff', hornC='#e8f6ff', hornD='#9ccbf0';
  const heart=e.heart||(F2G.heart&&e.bph>=2&&e===G.boss), free=dead>0&&F2G.outcome==='free';
  const eyeV=heart?(Math.sin(t*7)>0.2?'#8ad0ff':'#c08cff'):free?'#8ad0ff':'#c08cff';
  let jaw=0, rear=0, wing=air?1:0.15, droop=0;
  if(st==='breathW') { rear=f2Sm(clamp(inS/0.9,0,1)); jaw=0.4*rear; } else if(st==='breath'){ jaw=1; rear=0.4; }
  else if(st==='tailW'||st==='tail') rear=-0.3; else if(st==='iciclesW'||st==='roarW'||st==='summon'){ rear=0.8; jaw=0.8; } else if(st==='stagger'){ droop=1; } else if(st==='flinch'){ droop=0.5; rear=-0.3; }
  else if(st==='gustW'||st==='gust'){ wing=1.2; } else if(st==='perched'){ wing=0.5; }
  const P=foEase(e,'_fgl',foTg(jaw,rear,wing,droop),dt,8); jaw=P[0]; rear=P[1]; wing=P[2]; droop=P[3];
  foShadow(e.x,e.y+4,64*k*(air?0.7:1),air?0.22:0.42);
  foBegin(fx,fy,face,k,fl,zf);
  if(dead) foSet(FOB,0,0,dead*0.8,0,0,0,-dead*2); else if(droop>0.05) foSet(FOB,0,0,Math.sin(t*5)*0.08*droop,0);
  const N=12;
  if(!air&&st!=='perched'){
    // the coil round the spike: segments on a ring, thinning to the tail
    const Rc=16, NS=17, a0=t*0.05;
    for(let i=0;i<NS;i++){ const u=i/(NS-1), a=a0+0.45+u*TAU*0.97, r=7.6-u*4.6, x=-5+Math.cos(a)*Rc*(1-u*0.12), y=Math.sin(a)*Rc*1.05*(1-u*0.12), z=r*0.92+(u>0.8?(u-0.8)*10:0);
      foE(x,y,z,r*1.45,r,r*0.95,i%4===0?bl:wh,0,a+Math.PI/2,0,0);
      if(i%2===0&&i<NS-2) foC(x,y,z+r*0.7,x-Math.cos(a+Math.PI/2)*1.2,y-Math.sin(a+Math.PI/2)*1.2,z+r*1.75,r*0.26,sil,0.02);
      else if(i<NS-2) foE(x+Math.cos(a)*r*0.55,y+Math.sin(a)*r*0.55,z-r*0.2,r*0.9,r*0.4,r*0.55,belly,0,a+Math.PI/2,0,-0.01); }
    // the tail tip: an icicle fin
    { const a=a0+0.45+TAU*0.97, x=-5+Math.cos(a)*Rc*0.88, y=Math.sin(a)*Rc*0.92; foC(x,y,5,x+Math.cos(a+1.6)*11,y+Math.sin(a+1.6)*11,6,2.4,hornC,0.01); foC(x,y,5,x+Math.cos(a+1.1)*8,y+Math.sin(a+1.1)*8,9,1.6,hornD,0.01); }
    // folded wings of frosted glass lying along the back of the coil
    for(const sd of [-1,1]) foQ([-6,sd*7,15+rear*2, -14,sd*(15+wing*12),20+wing*14, -24,sd*14,12, -17,sd*6,9],'#e6f4ff','#9cc8ec',-0.03);
  } else {
    // flying or landed: a long body trailing behind the head in waves, glassy wings spread
    for(let i=0;i<N;i++){ const u=i/(N-1), x=4-u*58, y=Math.sin(t*3.2-u*5)*6*u, z=6+Math.sin(t*3.2-u*5+1)*3*u+(st==='perched'?-4:0), r=8-u*5.6;
      foB(x,y,Math.max(r*0.9,z),r,i%3===0?bl:wh,0); if(i%2===0&&i<N-2) foC(x,y,Math.max(r*0.9,z)+r*0.8,x-1,y,Math.max(r*0.9,z)+r*1.7,r*0.28,sil,0.02); }
    { const x=4-58, y=Math.sin(t*3.2-5)*6; foC(x,y,6,x-10,y,7,2.6,hornC,0.01); }
    const flap=Math.sin(t*(st==='dive'?2:4))*0.5*wing;
    for(const sd of [-1,1]){ const sp=Math.max(0.2,wing), c=Math.cos(flap), s=Math.sin(flap);
      foQ([0,sd*7,16, -6,sd*(7+30*sp*c),16+30*sp*s+4, -22,sd*(7+44*sp*c),16+44*sp*s, -30,sd*(7+26*sp*c),14+26*sp*s, -16,sd*6,12],'#d4ecff','#8ab8e0',-0.03);
      for(let i=0;i<3;i++){ const u=0.3+i*0.25; foN(lerp(-6,-22,u),sd*lerp(7+30*sp*c,7+44*sp*c,u),lerp(20+30*sp*s,16+44*sp*s,u),lerp(-6,-22,u)-6,sd*lerp(7,7+26*sp*c,u),lerp(16,14,u),0.6,'#a8d0f0',-0.02); } }
  }
  // the chest with the Shard, the neck rising to the head
  foE(4,0,10,9,8.4,8,belly,0,0,0,0.01);
  const sg=0.7+0.3*Math.sin(t*3.4); foD(10.5,0,12,2.6,'#c8a0ff',0.04); foGlow(10.5,0,12,heart?14:9,'190,140,255',heart?0.9*sg:0.55*sg,true);
  const hx=15+rear*1.5, hz=30+rear*6-droop*13, hy=Math.sin(t*0.8)*1.5;
  foL(5,0,11,9,hy*0.4,21+rear*3-droop*6,6.4,wh,5.6); foL(9,hy*0.4,21+rear*3-droop*6,hx-3.4,hy,hz-1.4,5.6,bl,4.8);
  for(let i=0;i<3;i++) foE(8.6+i*1.6,hy*0.3*i,14+i*5.4-droop*i*2,1.6,3.6,2.4,belly,0.6,0,0,0.02);
  // the head: a long snout, the crown of curling icicle horns, frost whiskers, the eyes
  foE(hx,hy,hz,8,6.8,6.2,wh,-0.1+droop*0.4); foE(hx+8,hy,hz-1.6+jaw*0.4,7,4.4,3,belly,-0.15+droop*0.4,0,0,0.01); foD(hx+14.4,hy-1.2,hz-1,0.5,'#5a6a8a',0.05); foD(hx+14.4,hy+1.2,hz-1,0.5,'#5a6a8a',0.05);
  if(jaw>0.05) foE(hx+6,hy,hz-3.4-jaw*2,5.4,3.2,1.6,'#9cc4ea',0.25,0,0,0.0);
  if(jaw>0.3&&(st==='breath'||st==='breathW')) foGlow(hx+12,hy,hz-2,10+jaw*8,'235,248,255',0.8*jaw,false);
  for(const sd of [-1,1]){
    let px=hx-3, py=hy+sd*3.4, pz=hz+4; for(let i=0;i<5;i++){ const u=(i+1)/5, nx=hx-4-u*12, ny=hy+sd*(4+u*3), nz=hz+6+Math.sin(u*2.6)*7-u*4; foL(px,py,pz,nx,ny,nz,2.3-u*1.3,i<4?hornC:hornD,2.1-u*1.3,0.01); px=nx; py=ny; pz=nz; }
    foC(px,py,pz,px-2,py+sd*1.6,pz-3.6,0.9,hornC,0.01);
    foC(hx-1.4,hy+sd*1.8,hz+5.4,hx-3.4,hy+sd*2.8,hz+12,1.3,hornC,0.01);
    foN(hx+12,hy+sd*2,hz-2.4,hx+15.6,hy+sd*5.6,hz-4.4+Math.sin(t*2+sd)*0.5,0.32,'#f4faff',0.02);
    if(st==='stagger') { foN(hx+5.4,hy+sd*3-0.9,hz+1.8,hx+5.4,hy+sd*3+0.9,hz+0.4,0.6,'#2a1840',0.05); }
    else { foD(hx+5.2,hy+sd*3,hz+1.2,1.7,'#ffffff',0.03); f2Glow(hx+5.6,hy+sd*3,hz+1.3,1.25,eyeV,heart?0.6:0.45); } }
  foEnd(14); e._t3top=foTop(fy,air?40:48,k,zf);
}
function f2Glaciar2(e,fl){ const x=e.x, y=e.y-(e.z||0)*0.8, r=e.r0||60, f=e.face, air=(e.z||0)>12; ctx.save();
  ctx.fillStyle='rgba(20,30,60,.22)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+r*0.3,r*1.3,r*0.5,0,0,TAU); ctx.fill();
  if(!air) for(let i=0;i<12;i++){ const a=0.35+i/11*TAU*0.92, rr=r*0.9; f2E2(x+Math.cos(a)*rr*0.8,y+Math.sin(a)*rr*0.6,r*(0.32-i*0.018),r*(0.28-i*0.016),fl?'#fff':i%3?'#f0f6ff':'#bfe0fa',0,1.4); }
  else for(let i=0;i<10;i++){ const u=i/9, bx=x-Math.cos(f)*u*r*2, by=y-Math.sin(f)*u*r*2+Math.sin(G.time*3-u*5)*6; f2E2(bx,by,r*(0.3-u*0.2),r*(0.26-u*0.18),fl?'#fff':'#f0f6ff',0,1.4); }
  if(air) for(const s of [-1,1]){ ctx.fillStyle='rgba(212,236,255,.8)'; ctx.beginPath(); ctx.ellipse(x+Math.cos(f+s*1.6)*r*0.6,y+Math.sin(f+s*1.6)*r*0.6,r*0.7,r*0.3,f+s*1.6,0,TAU); ctx.fill(); ctx.strokeStyle=F2OL(); ctx.lineWidth=1.4; ctx.stroke(); }
  const hx=x+Math.cos(f)*r*1.0, hy=y+Math.sin(f)*r*0.8-12; f2E2(hx,hy,r*0.32,r*0.26,fl?'#fff':'#f0f6ff',f,1.8);
  for(const s of [-1,1]){ ctx.strokeStyle='#cfeafe'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(hx+Math.cos(f+s*0.6)*8,hy-6); ctx.lineTo(hx-Math.cos(f)*16+Math.cos(f+s*1.4)*10,hy-22); ctx.stroke(); f2Eye2(hx+Math.cos(f+s*0.5)*8,hy+Math.sin(f+s*0.5)*6-2,2.6,f,e.state==='stagger'?'#fff':'#c08cff'); }
  ctx.fillStyle='rgba(200,160,255,.9)'; ctx.beginPath(); ctx.arc(x+Math.cos(f)*r*0.45,y+Math.sin(f)*r*0.35,5,0,TAU); ctx.fill(); ctx.restore(); }
// Mumble (a shy little yeti) and Greymane, drawn beside Ash in the fight
// Mumble keeps the look players meet at his hollow: the people module's figure (T3B.f_yeti in 3D, drawNPC in 2D) when it is in
function f2MumbleNpc(M){ const n=M.npc||(M.npc={id:'f_mumble',name:'Mumble',kind:'f_mumble'}); n.x=M.x; n.y=M.y; n.face=M.face; n.t=M.t; n.dx=M.dx; n.dy=M.dy; n.moving=Math.abs(M.dx||0)+Math.abs(M.dy||0)>5; return n; }
function f2DrawMumbleAlly(M){ if(!M) return;
  if(T3.on&&typeof T3B!=='undefined'&&T3B.f_yeti){ try{ T3B.f_yeti(f2MumbleNpc(M)); return; }catch(err){} }
  if(!T3.on&&typeof f2pMumbleRoar==='function'&&typeof drawNPC==='function'){ try{ drawNPC(f2MumbleNpc(M)); return; }catch(err){} }
  const fig=M.fig||(M.fig={r:16,hp:1,maxHp:1,ally:true,speed:200,level:1,alpha:1,flash:0,type:'f_mumble',mumble:true});
  Object.assign(fig,{x:M.x,y:M.y,face:M.face,t:M.t,state:M.state==='throw'?'throwW':M.state==='hold'?'hold':'chase',dx:M.dx,dy:M.dy});
  if(T3.on&&typeof f2FigYeti==='function') f2FigYeti(fig,false,true); else { ctx.save(); f2E2(M.x,M.y-12,12,14,'#f2f4fa',0,1.8); f2E2(M.x,M.y-26,8,8,'#f8fbff',0,1.6); ctx.restore(); } }
function f2DrawGreyAlly(Gr){ if(!Gr) return; if(T3.on&&T3A.grey){ try{ T3A.grey(Gr); return; }catch(err){} } ctx.save(); f2E2(Gr.x,Gr.y-8,18,10,'#9aa8c0',Gr.face,1.8); f2E2(Gr.x+Math.cos(Gr.face)*16,Gr.y-12+Math.sin(Gr.face)*8,8,7,'#b8c4d8',0,1.6); ctx.restore(); }
f2Spk('f_mumble','Mumble','#f2f4fa');

// ================= 13. the minibosses (level 1 numbers; their rooms fight them at the dungeon's level + 1)
// A mini started by its room (f2boss) fights like a boss: the boss bar, its intro and outro, the doors lock. Placed the
// stock way (a room's boss:[type,title]) it keeps its own health (the cave would make it much bigger).
function f2MiniDone(e,force){
  if(!e.f2mini&&!force) return; const k=G.fightSite, d=k&&BOSSES[k]; if(!d) return;
  if(d.boss!==e.type&&!(e.f2twin&&d.boss==='f_squall')) return;
  G.boss=null; G.fightSite=null; G.fightIntro=false; G.bossDone[d.boss]=true; bossFightEnd(false);
  later(1.2,()=>{ const L=(STORY.bosses[d.boss]&&STORY.bosses[d.boss].outro)||[]; const fin=()=>{ scene='play'; try{ if(d.onWin) d.onWin(); }catch(err){ console.error(err); } saveGame(); };
    if(L.length) runDialogue(L,fin); else fin(); });
}
// ---------- Lord Blubberton, the Walrus Knight (f_blubberton), Glacier Maze room m (the Walrus Hall)
// A huge posh walrus in a dented helmet with a monocle, a shield of ice, tusks like sabres. Belly Slide (a red line: he
// slides across the ice; a wall stuns him 1.5 s), Tusk Jab (a white arc), Belly Flop (an orange circle, then a ring to
// jump). The trick: Blaze melts his ice shield (gone 6 s), the hammer breaks his guard, or dodge his slide into a wall.
f2Lines('f_blubberton',['f_blubberton_intro'],['f_blubberton_won'],
  [['f_blubberton',S('I say! Unhand my hall, you scaly scamp!','I say! Out of my hall, you scamp!')]],
  [['f_blubberton',S('Harrumph. Jolly good show, old bean. Here, the furnace key. I was only guarding it because nobody told me to stop.','Jolly good show! Here, the key.')],
   ['narr',S('Lord Blubberton waddles off to take a bath.','He waddles off to take a bath.')]]);
f2Foe('f_blubberton',{name:'Lord Blubberton',title:S('the Walrus Knight','the walrus knight'),short:'Lord Blubberton',mini:true,
  r:30,hp:560,speed:84,dmg:13,value:70,shield:true,kbRes:0.2,dcol:'200,170,150',
  ai:FK.brain({move:'approach',stop:64,turn:2.2,guard:true,cd:[0.9,1.5],recoverMove:0.25,pre:f2BlubPre,
    moves:[{k:'slash',reach:96,half:0.8,windup:0.5,lunge:120,dmg:1.0,col:F2COL.white,max:120,w:2,sfx:'hit'},
           {k:'f2charge',st:'slideW',st2:'slide',len:560,lw:66,windup:0.7,time:1.2,spd:560,dmg:1.15,kb:380,min:130,max:640,w:2.6,every:3.5,track:3,dust:'230,240,250',onAim:(e)=>{ f2Say(e,'f_blubberton',S('Tally ho!','Tally ho!'),5); },onBump:(e)=>{ f2Stun(e,f2Win(1.5),S('Ow! Most rude!','Ow! Rude!')); e.blocking=false; }},
           {k:'f2slam',st:'flopW',off:0,r:92,windup:0.8,dmg:1.1,max:200,w:1.6,every:4,then:(e)=>{ f2Wave(e.x,e.y,{dmg:e.dmg*0.9,max:360,spd:300,thick:18}); }}]}),
  init(e,opt){ f2MiniInit(e,opt); },
  onBlaze(e,dt){ if(e.softT>0) return; if(f2Heat(e,'shieldH',dt,1.5)){ e.softT=f2Win(6); e.shield=false; e.blocking=false; SFX.play('pop'); f2Puff(e.x,e.y-24,'235,245,255',16); f2Txt(e,S('Hsss! His ice shield melts!','His shield melts!'),'#cfeaff',14); } },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(h.src==='hammer'&&e.shield&&e.blocking&&!h.behind){ e.gbT=f2Win(4); e.shield=false; e.blocking=false; f2Stun(e,0.8,S('CRACK! Guard broken!','CRACK!')); return amt*1.2; }
    if(e.stun>0) return amt*1.3; },
  onDeath(e){ f2Corpse(e); f2MiniDone(e); },
  draw3d:f2FigWalrus, draw2d:f2Walrus2,
  sheet:f2Rows({state:'windup',st:0.25,blocking:true},{state:'strike'},[{state:'slideW',st:0.3,at:0.3,label:'slide aim'},{state:'slide',dx:400,label:'belly slide'},{state:'flopW',st:0.4,at:0.4,label:'belly flop'},{state:'chase',stun:1,label:'stunned'},{state:'chase',softT:3,label:'shield melted'}])});
function f2BlubPre(e,dt){ f2Cool(e,'shieldH',dt);
  if(e.softT>0){ e.softT-=dt; e.shield=false; e.blocking=false; if(e.softT<=0&&!(e.gbT>0)){ e.shield=true; f2Txt(e,S('His ice shield grows back!','Shield back!'),'#dff4ff',12); } }
  if(e.gbT>0){ e.gbT-=dt; e.shield=false; e.blocking=false; if(e.gbT<=0&&!(e.softT>0)) e.shield=true; }
  if(e.stun>0) e.blocking=false; }
function f2FigWalrus(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.f_blubberton.r)/30*1.5, face=t3Turn(e,e.face,st==='slide'?3:6), fx=e.x, fy=e.y+e.r*0.4, inS=foSt(e), dead=foDeath(e), hurt=f2Hurt(e);
  const skin=fl?'#ffffff':foT(e,'#a88a76'), skinD=foT(e,'#7e6252'), skinL='#c8ac96', tusk='#f4ecd8', helm='#9aa2b0', helmD='#6a7282', soft=e.softT>0||e.gbT>0||e.p3shT>0;
  const mv=foWalk(e,dt,5), w=e._wp||0, guard=e.blocking&&e.shield;
  let lean=0, jab=0, flop=0, slide=0;
  if(st==='windup'){ jab=-f2Sm(clamp(inS/0.5,0,1))*0.6; } else if(st==='strike') jab=1; else if(st==='slideW'){ lean=0.25*f2Sm(clamp(inS/0.7,0,1)); } else if(st==='slide') slide=1; else if(st==='flopW'){ flop=f2Sm(clamp(inS/0.8,0,1)); }
  const P=foEase(e,'_fwl',foTg(lean,jab,flop,slide),dt,st==='strike'?20:9); lean=P[0]; jab=P[1]; flop=P[2]; slide=P[3];
  foBegin(fx,fy,face,k,fl,flop*8);
  if(dead) foSet(FOB,0,0,dead*1.2,0,0,0,-dead*3); else if(slide>0.05) foSet(FOB,8,1.2*slide,0,0,0,0,-4*slide); else if(e.stun>0) foSet(FOB,0,0,Math.sin(t*7)*0.14,0);
  // flippers (front and back), a fat round body with a belly
  foLow(); for(const sd of [-1,1]){ const s=Math.sin(w+(sd>0?0:Math.PI))*mv; foE(8+s*2,sd*11,1.6,6,3,1.6,skinD,0,sd*0.5); foE(-12,sd*7,1.4,5,4,1.4,skinD,0,sd*0.3); }
  foUp(); foSet(FOA,8,lean-hurt*0.12+jab*0.15,0,0);
  foE(0,0,12,15,13,12,skin); foE(6,0,10,8,10,9,skinL,0,0,0,0.01);
  for(let i=0;i<5;i++) foD(-6+i*3,-12,15+((i*7)%3),0.7,skinD,0.03);
  // the head: whiskery snout, tusks, a monocle, a dented helmet with a plume
  const hx=10+jab*3, hz=24;
  foE(hx,0,hz,8,8.4,7.4,skin); foE(hx+6,0,hz-3,4.6,6.4,3.4,skinL,0,0,0,0.01);
  for(const sd of [-1,1]){ foC(hx+7,sd*3.4,hz-4.6,hx+9+jab*4,sd*3.8,hz-14-jab*2,1.3,tusk,0.03); for(let i=0;i<3;i++) foN(hx+9,sd*(2+i*1.2),hz-2.6,hx+11,sd*(5+i*1.8),hz-3.6-i*0.6,0.35,'#5a4434',0.04); }
  f2Eye(hx+5,-2.6,hz+2,1.0,'#ffffff'); f2Eye(hx+5,2.6,hz+2,1.0,'#ffffff');
  foN(hx+5.8,2.6,hz+3.4,hx+5.8,2.6,hz+0.8,0.4,'#e8c860',0.06); foE(hx+5.9,2.6,hz+2,0.3,1.7,1.7,'#e8c860',0,0,0,0.05); foN(hx+5.8,4.2,hz+1,hx+3,6,hz-6,0.25,'#e8c860',0.06);
  foY(hx-1,0,hz+5,6.6,7.2,4.4,helm,'#c0c8d4',0.02); foE(hx+2,-4,hz+8.6,2,2,1.2,helmD,0,0,0,0.03); foC(hx-2,0,hz+9.4,hx-6,0,hz+16,1.6,'#c0303a',0.02);
  // the ice shield on his left flipper (gone while melted)
  if(!soft){ const sx=guard?12:6, sy=guard?-11:-14, sz=guard?14:12; foE(sx,sy,sz,2.4,9,10,'#a8dcf6',0,guard?0:-0.5,0,0.04); foE(sx+1,sy,sz+2,1.4,6,6,'#e6f6ff',0,guard?0:-0.5,0,0.05); }
  else foE(6,-14,12,2,5,5,'#7a9ab8',0,-0.5,0,0.03);
  if(st==='flopW'&&flop>0.5) foGlow(0,0,10,24,'255,170,80',0.3,false);
  foEnd(14); e._t3top=foTop(fy,40,k,flop*8);
}
function f2Walrus2(e,fl){ const x=e.x, y=e.y, r=e.r0||e.r, f=e.face; ctx.save(); f2Shadow2(e,1.2); ctx.translate(x,y); ctx.rotate(f);
  f2E2(0,0,r*0.95,r*0.8,fl?'#fff':'#a88a76',0,2.2); f2E2(r*0.7,0,r*0.42,r*0.4,'#c8ac96',0,1.8);
  for(const s of [-1,1]){ ctx.strokeStyle='#f4ecd8'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(r*0.95,s*5); ctx.lineTo(r*1.35,s*7); ctx.stroke(); }
  if(!(e.softT>0||e.gbT>0)) f2E2(r*0.3,-r*0.85,r*0.22,r*0.5,'#a8dcf6',0,1.6);
  f2E2(r*0.45,0,r*0.3,r*0.32,'#9aa2b0',0,1.4); ctx.restore(); }

// ---------- The Twin Squalls, Squall and Squeak (f_squall, f_squeak), Skyreach Temple room k (the Gale Gallery)
// Two giggling gale sprites. Gust Shot (an orb on a line), Twister (a circle, then a whirl that pulls Ash in), and while
// both are up, a Crosswind across the room every 10 s. Squall (big and blue) blows arrows away but hates fire (x2);
// Squeak (small and yellow) puffs fire out but hates arrows (x2). Beat one and the other speeds up 30 percent.
f2Lines('f_squall',['f_squall_intro'],['f_squall_won'],
  [['f_squall',S('Whoosh!','Whoosh!')],['f_squeak',S('Wheeee-hee!','Wheee!')],['f_squall',S("Tag, you're IT!","Tag, you're IT!")]],
  [['narr',S('The two little winds tumble over each other, giggling, and blow out through the window.','The two winds giggle and blow away.')],
   ['f_squeak',S('Again tomorrow? Again tomorrow!','Again tomorrow?')]]);
// Twister: a marked circle, then a whirlwind for 2.5 s that drags Ash toward its middle (ride a ribbon or run hard)
FZK.f2twist={
  tick(z,dt){ if(z.t<z.wait) return; const p=player, d=dist(p.x,p.y,z.x,z.y); z.spin=(z.spin||0)+dt*9;
    if(!p.dead&&d<z.r*1.9&&!(typeof P3!=='undefined'&&P3.ride)){ const a=angTo(p.x,p.y,z.x,z.y), f=(1-d/(z.r*1.9))*z.pull*dt; p.kvx+=Math.cos(a)*f; p.kvy+=Math.sin(a)*f; if(d<z.r*0.6){ z.tk=(z.tk||0)-dt; if(z.tk<=0){ z.tk=0.5; hurtPlayer(z.dmg,z.x,z.y,0); } } }
    if(Math.random()<dt*30){ const q=rand(0,TAU), rr=rand(10,z.r); emit(z.x+Math.cos(q)*rr,z.y+Math.sin(q)*rr*0.7,1,{col:'235,246,255',glow:false,ang:q+1.7,spread:0.2,smin:100,smax:200,lmin:.3,lmax:.5,zmin:1.4,zmax:2.6,drag:1,alpha:0.7}); } },
  drawG(z){ if(z.t<z.wait) return; const a=clamp(Math.min((z.t-z.wait)/0.3,(z.life-z.t)/0.4),0,1); ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle='rgba(235,246,255,.7)'; ctx.lineWidth=3;
    for(let i=0;i<3;i++){ const r=z.r*(0.35+i*0.25); ctx.beginPath(); ctx.ellipse(z.x,z.y,r,r*0.7,0,(z.spin||0)+i,(z.spin||0)+i+4); ctx.stroke(); } ctx.restore(); }
};
FM.f2twister={
  start(e,m){ const p=player; e.state='castW'; e.st=f2W(m.o,0.8); m.x=p.x; m.y=p.y; f2Mark({x:p.x,y:p.y,r:m.o.r||70,dur:e.st,col:F2COL.snow}); },
  tick(e,dt,d,a,m){ e.st-=dt; if(e.st>0) return false; fzAdd('f2twist',{x:m.x,y:m.y,r:m.o.r||70,wait:0,life:2.5,pull:900,dmg:e.dmg*0.5}); SFX.play('whoosh'); e.state='cast'; return true; } };
FM_DEF.f2twister={recover:0.5};
const SQUALL_AI=FK.brain({move:'hover',orbit:230,wobble:40,faceMove:false,turn:6,cd:[1.0,1.8],recoverMove:0.6,pre:f2SquallPre,
  moves:[{k:'shoot',st:'cast',kind:'orb',n:1,spd:310,r:9,windup:0.5,dmg:1,max:640,w:2.4,tele:{shape:'line',len:320,w:22,col:F2COL.white}},
         {k:'f2twister',r:70,windup:0.8,max:560,w:1.4,every:5}]});
function f2SquallInit(e,opt){ f2MiniInit(e,opt); e.f2twin=true; e.z=30;
  if(e.type==='f_squall'&&e.f2room&&!e.partner){ const R=e.f2room, q=makeEnemy('f_squeak',e.x+80,e.y,{level:e.level,aggro:true,elite:false,leash:99999}); q.spawnIn=0.3; f2RoomJoin(q,R); q.f2twin=true; q.partner=e; e.partner=q; q.f2mini=true; } }
function f2SquallPre(e,dt){ e.z=lerp(e.z||0,30+Math.sin((e.t||0)*2)*8,Math.min(1,dt*3));
  // both up: a crosswind across the room every 10 s (Squall calls it)
  if(e.type==='f_squall'&&e.partner&&!e.partner.dead){ e.crossT=(e.crossT==null?6:e.crossT)-dt*foeDiff().atk; if(e.crossT<=0){ e.crossT=10; const C=f2Ctx(e), a=Math.random()<0.5?0:Math.PI, x=a?C.x1-30:C.x0+30;
      f2Push(x,player.y,a===0?0:Math.PI,{len:(C.x1-C.x0)*1.1,half:0.5,force:1500,wait:f2W({},0.9),life:1.8}); taunt('f_squall',S("Tag, you're IT!","Tag, you're IT!")); } } }
function f2SquallHurt(e,amt,o){ const h=foeHit(e,o), big=e.type==='f_squall';
  if(big){ if(h.src==='arrow'||h.src==='boomerang'){ if(!(e._wT>G.time)){ e._wT=G.time+2; f2Txt(e,S('Whoosh! Squall blows it away! He hates fire!','Whoosh! He hates fire!'),'#dff0ff',13); } return false; } if(h.fire) return amt*1.5; }
  else { if(h.fire){ if(!(e._wT>G.time)){ e._wT=G.time+2; f2Txt(e,S('Squeak puffs the fire out! She hates arrows!','Puff! She hates arrows!'),'#fff4c0',13); } return amt*0.2; } if(h.src==='arrow'||h.src==='boomerang') return amt*2; } }
function f2SquallDeath(e){ f2Puff(e.x,e.y-30,'235,246,255',24); const q=e.partner;
  if(q&&!q.dead){ q.speed*=1.3; q.f2fast=true; G.boss=q; f2Txt(q,S('It speeds up! 30 percent faster!','Faster now!'),'#ffe066',14); taunt(q.type,q.type==='f_squall'?S('WHOOSH! Now I am MAD!','WHOOSH! Mad now!'):S('Wheee! Faster! FASTER!','Faster!')); return; }
  f2MiniDone(e,true); }
f2Foe('f_squall',{name:'Squall',title:S('the Twin Squalls','the twin winds'),short:'The Twin Squalls',mini:true,r:20,hp:440,speed:170,dmg:10,value:70,flying:true,kbRes:0.6,dcol:'170,210,250',
  ai:SQUALL_AI, init:f2SquallInit, onHurt:f2SquallHurt, onDeath:f2SquallDeath, lift:e=>e.z||0,
  draw3d:(e,fl)=>f2FigGale(e,fl,false), draw2d:(e,fl)=>f2Gale2(e,fl,false),
  sheet:f2Sheet([{state:'chase',z:30,label:'idle'},{state:'chase',z:30,dx:120,label:'move'},{state:'cast',st:0.3,at:0.3,z:30,label:'gust shot'},{state:'castW',st:0.4,at:0.4,z:30,label:'twister'},{state:'chase',stun:1,z:30,label:'stunned'},{state:'chase',deathT:0.3,z:30,label:'death'}])});
f2Foe('f_squeak',{name:'Squeak',title:S('the Twin Squalls','the twin winds'),short:'The Twin Squalls',mini:true,r:14,hp:400,speed:200,dmg:9,value:50,flying:true,kbRes:0.8,dcol:'250,230,140',
  ai:SQUALL_AI, init:f2SquallInit, onHurt:f2SquallHurt, onDeath:f2SquallDeath, lift:e=>e.z||0,
  draw3d:(e,fl)=>f2FigGale(e,fl,true), draw2d:(e,fl)=>f2Gale2(e,fl,true),
  sheet:f2Sheet([{state:'chase',z:30,label:'idle'},{state:'cast',st:0.3,at:0.3,z:30,label:'gust shot'},{state:'castW',st:0.4,at:0.4,z:30,label:'twister'},{state:'chase',deathT:0.3,z:30,label:'death'}])});
// a gale sprite: a puffy swirl of cloud with round cheeks, a little whirl of a tail, giggling eyes
function f2FigGale(e,fl,small){
  const t=e.t||0, st=e.state, k=e.r/(small?14:20)*(small?1.0:1.35), face=t3Turn(e,e.face,10), z=(e.z||30)/k, fx=e.x, fy=e.y+e.r*0.3, dead=foDeath(e), inS=foSt(e);
  const c0=fl?'#ffffff':small?'#ffe68a':'#9cd0f6', c1=small?'#f4c84a':'#6aa8e6', c2='#ffffff', cheek=small?'#ffb08a':'#d8b0ff';
  const blow=st==='cast'||st==='castW', puff=blow?f2Sm(clamp(inS/0.5,0,1)):0, spin=t*(blow?14:5);
  foShadow(e.x,e.y+4,12*k,0.25);
  foBegin(fx,fy,face,k,fl,z);
  if(dead) foSet(FOB,0,0,0,dead*4,0,0,dead*10);
  for(let i=0;i<5;i++){ const a=spin+i*TAU/5, r=5.6; foB(Math.cos(a)*r*0.6-2,Math.sin(a)*r,1+Math.sin(a*2)*1.4,4.4-(i%2)*0.8,i%2?c1:c0,0); }
  foB(1.4,0,4,6.4+puff*1.4,c0,0.01);
  for(let i=0;i<3;i++){ const u=i/2, a=spin*1.4+u*3; foC(-6-u*5,Math.sin(a)*2,2-u*2,-10-u*6,Math.sin(a+1)*3,-1-u*3,2.4-u*0.7,i%2?c1:c2,-0.02); }
  for(const sd of [-1,1]){ foB(5.4,sd*3.2,3+puff*0.6,1.6+puff*1.2,cheek,0.04); f2Eye(6.4,sd*1.8,5.6,0.95,'#ffffff'); }
  foE(7.4,0,2.4,0.8,1.3+puff*0.6,0.9+puff*1.2,'#2a1a3a',0,0,0,0.05);
  if(blow) foGlow(10,0,3,10,'235,246,255',0.5*puff,false);
  foEnd(4); e._t3top=foTop(fy,14,k,z);
}
function f2Gale2(e,fl,small){ const x=e.x, y=e.y-(e.z||30), r=e.r; ctx.save(); ctx.fillStyle='rgba(20,30,60,.2)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+4,r,r*0.4,0,0,TAU); ctx.fill();
  const c=fl?'#fff':small?'#ffe68a':'#9cd0f6'; for(let i=0;i<4;i++){ const a=(e.t||0)*5+i*1.57; f2E2(x+Math.cos(a)*r*0.4,y+Math.sin(a)*r*0.3,r*0.5,r*0.45,c,0,1.2); }
  for(const s of [-1,1]) f2Eye2(x+Math.cos(e.face+s*0.5)*r*0.35,y+Math.sin(e.face+s*0.5)*r*0.25-2,r*0.14,e.face); ctx.restore(); }

// ---------- Rockjaw, the Armoured Armadillo (f_rockjaw), Stonehorn Deep room j (the Armadillo Run)
// A boulder-sized armadillo with plates of rock and a very small, angry face. Roll: a red line, then he bounces off the
// walls three times (he cannot be hurt while rolling) and unrolls dizzy for 2 s (hit him now). Below half health he rolls
// twice in a row and spits rocks. The trick: Ground Pound within 150 px as he rolls past flips him onto his back (3 s,
// belly x2).
f2Lines('f_rockjaw',['f_rockjaw_intro'],['f_rockjaw_won'],
  [['f_rockjaw',S('ROLL ROLL ROLL!','ROLL ROLL ROLL!')]],
  [['f_rockjaw',S("I'm not round, I'm big-boned! ...Okay, okay. You win. The key's in the chest.","I'm big-boned! Okay, you win.")]]);
FM.f2bounce={
  start(e,m){ const o=m.o; e.state='curl'; e.st=fkW(o,0.6); m.n=(o.chain&&e.hp<e.maxHp*0.5)?2:1; m.go=false; e.tele=newTele({shape:'line',len:o.len||480,w:e.r*2.2,dur:e.st,col:F2COL.red}); f2Say(e,'f_rockjaw',S('ROLL ROLL ROLL!','ROLL!'),6); },
  tick(e,dt,d,a,m){ const o=m.o, p=player, C=f2Ctx(e);
    if(!m.go){ if(e.st>0.15) e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(e.st>0) return false; m.go=true; e.tele=null; e.state='roll'; e.rolling=true; m.b=0; m.vx=Math.cos(e.face); m.vy=Math.sin(e.face); m.t=0; m.hit=false; SFX.play('roll'); return false; }
    const s=(o.spd||520)*foeDiff().spd; m.t+=dt; e.dx=m.vx*s; e.dy=m.vy*s; e.face=Math.atan2(m.vy,m.vx);
    if(!m.hit&&!p.dead&&!f2Up()&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+4){ if(hurtPlayer(fkDmg(e,o),e.x,e.y,360)) m.hit=true; }
    if(Math.random()<dt*14) emit(e.x-m.vx*e.r,e.y+e.r*0.4,1,{col:'170,150,130',glow:false,smin:10,smax:50,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6});
    // a wall: bounce (off the room's sides, or straight back)
    const nx=e.x+m.vx*(e.r+8), ny=e.y+m.vy*(e.r+8); let bump=false;
    if(C.rect){ if(nx<C.x0+6||nx>C.x1-6){ m.vx=-m.vx; bump=true; } if(ny<C.y0+6||ny>C.y1-6){ m.vy=-m.vy; bump=true; } }
    if(!bump&&m.t>0.1&&foeBumped(e)){ m.vx=-m.vx+rand(-0.4,0.4); m.vy=-m.vy+rand(-0.4,0.4); const l=Math.hypot(m.vx,m.vy)||1; m.vx/=l; m.vy/=l; bump=true; }
    if(bump){ m.b++; m.t=0; m.hit=false; shake(5); SFX.play('block'); f2Shards(e.x,e.y-10,8,'170,150,130'); e._stall=0;
      if(m.b>=(o.bounces||3)){ if(--m.n>0){ m.b=0; m.vx=Math.cos(angTo(e.x,e.y,p.x,p.y)); m.vy=Math.sin(angTo(e.x,e.y,p.x,p.y)); return false; } e.rolling=false; e.state='dizzy'; e.st=f2Win(2); m.go=false; return true; } }
    if(m.t>2.5){ e.rolling=false; return true; }
    return false; } };
FM_DEF.f2bounce={recover:0.3};
f2Foe('f_rockjaw',{name:'Rockjaw',title:S('the Armoured Armadillo','the rock armadillo'),short:'Rockjaw',mini:true,r:28,hp:640,speed:90,dmg:14,value:70,kbRes:0.3,dcol:'170,150,130',
  ai:FK.brain({move:'approach',stop:52,turn:3,cd:[0.8,1.4],recoverMove:0.3,pre:f2RockPre,
    moves:[{k:'f2bounce',len:480,windup:0.6,spd:520,bounces:3,chain:true,dmg:1.15,min:80,max:800,w:3},
           {k:'slash',reach:58,half:0.9,windup:0.45,lunge:90,dmg:0.9,col:F2COL.white,max:80,w:1},
           {k:'f2lob',st:'spitW',n:3,scatter:100,r:46,windup:0.55,flight:0.9,col:F2COL.orange,ball:'#9a8a78',br:8,h:110,min:120,max:600,w:2,every:5,if:e=>e.hp<e.maxHp*0.5,
             land:(e,x,y)=>{ f2Shards(x,y,12,'170,150,130'); SFX.play('pop'); const p=player; if(!p.dead&&!f2Up()&&dist(x,y,p.x,p.y)<46+p.r*0.5) hurtPlayer(e.dmg*0.85,x,y,200); }}]}),
  init(e,opt){ f2MiniInit(e,opt); },
  onPound(e,info){ if(e.dead) return; if((e.rolling||e.state==='curl')&&info.d<150+e.r){ e.mv=null; e.tele=null; e.rolling=false; e.state='flipped'; e.flipT=f2Win(3); SFX.play('block'); shake(6); f2Txt(e,S('Flipped! Hit his soft belly!','Flipped! Hit him!'),'#ffe066',15); f2Say(e,'f_rockjaw',S("I'm not round, I'm big-boned!","I'm big-boned!"),4); } },
  onHurt(e,amt,o){ if(e.rolling){ if(!(e._rlT>G.time)){ e._rlT=G.time+1.6; f2Txt(e,S('Clonk! He is rolling! Ground Pound as he rolls past, or wait till he is dizzy.','Clonk! Pound him as he rolls!'),'#e0d8c8',12); SFX.play('block'); } return false; }
    if(e.state==='flipped') return amt*2; if(e.state==='dizzy') return amt*1.25; },
  onDeath(e){ f2Corpse(e); f2MiniDone(e); },
  draw3d:f2FigDillo, draw2d:f2Dillo2,
  sheet:f2Rows({state:'windup',st:0.2},{state:'strike'},[{state:'curl',st:0.3,at:0.3,label:'curl'},{state:'roll',dx:400,rolling:true,label:'roll'},{state:'dizzy',label:'dizzy'},{state:'flipped',label:'flipped'},{state:'spitW',st:0.3,at:0.3,label:'spit rocks'}])});
function f2RockPre(e,dt){ if(e.state==='flipped'){ e.dx=e.dy=0; e.flipT-=dt; if(e.flipT<=0){ e.state='recover'; e.st=0.5; } return true; }
  if(e.state==='dizzy'){ e.dx=e.dy=0; e.st-=dt; if(Math.random()<dt*5) emit(e.x+rand(-14,14),e.y-34,1,{col:'255,230,120',glow:true,smin:10,smax:30,lmin:.4,lmax:.7,zmin:1.4,zmax:2.4}); if(e.st<=0){ e.state='recover'; e.st=0.4; } return true; } }
function f2FigDillo(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.f_rockjaw.r)/28*1.6, face=t3Turn(e,e.face,st==='roll'?20:6), fx=e.x, fy=e.y+e.r*0.4, inS=foSt(e), dead=foDeath(e), hurt=f2Hurt(e);
  const rock=fl?'#ffffff':foT(e,'#9a8a78'), rockD=foT(e,'#6e6052'), rockL='#bcae9a', skin='#d8a888', belly='#e8c8a8';
  const mv=foWalk(e,dt,4), w=e._wp||0, ball=st==='roll'||(st==='curl'&&inS>0.25), flip=st==='flipped';
  foBegin(fx,fy,face,k,fl,0);
  if(ball){ const R=11, rl=e._rl=(e._rl||0)+dt*(st==='roll'?Math.hypot(e.dx||0,e.dy||0)/(R*k):2);
    foB(0,0,R,R,rock); for(let i=0;i<5;i++){ const a=rl+i*1.25; foN(Math.cos(a)*R*1.01,-R*0.95,R+Math.sin(a)*R*1.01,Math.cos(a)*R*1.01,R*0.95,R+Math.sin(a)*R*1.01,1.4,rockD,0.02); }
    foEnd(R); e._t3top=foTop(fy,R*2+2,k); return; }
  if(flip) foSet(FOB,9,0,Math.PI*0.92+Math.sin(t*5)*0.08,0,0,0,2); else if(dead) foSet(FOB,0,0,dead*1.4,0,0,0,-dead*3); else if(st==='dizzy') foSet(FOB,0,0,Math.sin(t*7)*0.15,0);
  foLow(); for(const [lx,sd] of [[6,-1],[6,1],[-6,-1],[-6,1]]){ const s=Math.sin(w+(lx>0?0:Math.PI))*mv*sd+(flip?Math.sin(t*14+lx)*2:0); foL(lx,sd*7,5,lx+s*1.6,sd*9,0.8,2.2,skin,1.8); }
  foUp(); foSet(FOA,6,-hurt*0.15,0,0);
  // the shell: bands of rock plates, the soft belly under them
  foE(0,0,8,13,10,7,flip?belly:rockD);
  for(let i=0;i<5;i++){ const x=-8+i*4; foE(x,0,10+Math.sin(i*1.3)*0.4,2.6,10.6,7.6-Math.abs(i-2)*0.6,i%2?rock:rockL,0,0,0,0.01+i*0.002); }
  // the small angry face
  foE(13,0,7,4,4,3.6,skin); foE(16,0,6,2,2.4,1.8,'#c89878',0,0,0,0.02);
  for(const sd of [-1,1]){ foD(15.4,sd*1.6,8.4,0.7,'#2a1a10',0.05); foN(14.4,sd*0.6,9.6,15.6,sd*2.4,9.1,0.4,'#2a1a10',0.06); foC(12,sd*2.6,10,10.6,sd*3.6,13,0.9,rockL,0.02); }
  if(st==='spitW') foGlow(17,0,6,8,'255,190,120',0.4,false);
  foEnd(8); e._t3top=foTop(fy,flip?14:20,k);
}
function f2Dillo2(e,fl){ const x=e.x, y=e.y, r=e.r0||e.r, f=e.face; ctx.save(); f2Shadow2(e,1.1);
  if(e.state==='roll'||e.state==='curl'){ f2E2(x,y-r*0.6,r*0.9,r*0.9,fl?'#fff':'#9a8a78',0,2.2); ctx.strokeStyle='#6e6052'; ctx.lineWidth=2; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(x-r*0.8,y-r*0.6+i*8); ctx.lineTo(x+r*0.8,y-r*0.6+i*8); ctx.stroke(); } ctx.restore(); return; }
  ctx.translate(x,y); ctx.rotate(f); f2E2(0,0,r*0.95,r*0.72,fl?'#fff':(e.state==='flipped'?'#e8c8a8':'#9a8a78'),0,2.2);
  ctx.strokeStyle='#6e6052'; ctx.lineWidth=2; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*7,-r*0.7); ctx.lineTo(i*7,r*0.7); ctx.stroke(); }
  f2E2(r*0.95,0,r*0.3,r*0.26,'#d8a888',0,1.6); ctx.restore(); }

// ---------- Grumbo the Yeti Bully (f_grumbo), Heart of Dread room h (the Yeti Den)
// A huge white yeti with violet eyes and a lunchbox chained to his belt (it's Mumble's). Boulder Throw (a lobbed boulder
// that then rolls: jump it, or pound it to burst), Ice Fists (two punches), Belly Drum (a roar ring that dazes; Ash's own
// Roar cancels it). The trick: Blaze melts the ice off his fists (his punches drop to half for 12 s).
f2Lines('f_grumbo',['f_grumbo_intro'],['f_grumbo_won'],
  [{who:'f_mumble',text:S("(squeak) ...that's Grumbo. He took my lunch every day for ninety years.","That's Grumbo. He took my lunch."),skipIf:()=>!G.flags.f_mumble_ally},
   ['f_grumbo',S('Grumbo SMASH! Grumbo smash... a little.','Grumbo SMASH! A little.')]],
  [['f_grumbo',S('Okay okay okay! I give up! Mumble can have his lunch back!','Okay! I give up! Mumble can have his lunch!')],
   {who:'f_mumble',text:S('(squeak) ...thank you.','Thank you.'),skipIf:()=>!G.flags.f_mumble_ally},
   {who:'f_grumbo',text:S('...Sorry, Mumble.','Sorry, Mumble.'),skipIf:()=>!G.flags.f_mumble_ally}]);
f2Spk('f_grumbo','Grumbo','#e4e8f4');
// Belly Drum: he drums his chest, a roar ring runs out (it dazes Ash 0.5 s); Ash's own roar breaks it
FM.f2drum={
  start(e,m){ e.state='drumW'; e.st=f2W(m.o,0.8); f2Mark({x:e.x,y:e.y,r:e.r+30,dur:e.st,col:F2COL.violet}); SFX.play('warn'); },
  tick(e,dt,d,a,m){ e.st-=dt; if(e.st>0) return false; shake(8); SFX.play('roar',0.6); e.state='drum';
    const z=f2Wave(e.x,e.y,{dmg:e.dmg*0.4,max:420,spd:320,thick:20,col:F2COL.violet,roar:true,onHit:()=>f2Daze(0.5)}); return true; } };
FM_DEF.f2drum={recover:0.6};
f2Foe('f_grumbo',{name:'Grumbo',title:S('the Yeti Bully','the yeti bully'),short:'Grumbo',mini:true,r:34,hp:880,speed:100,dmg:16,value:90,kbRes:0.2,dcol:'230,235,245',
  ai:FK.brain({move:'approach',stop:76,turn:2.6,cd:[0.9,1.5],recoverMove:0.25,pre:(e,dt)=>{ f2Cool(e,'fistH',dt); if(e.fistT>0){ e.fistT-=dt; if(e.fistT<=0) f2Txt(e,S('The ice grows back on his fists!','Icy fists again!'),'#dff4ff',12); } },
    moves:[{k:'f2combo',st:'punchW',st2:'punch',n:2,reach:104,half:0.9,windup:0.6,windup2:0.4,lunge:150,dmg:1,max:140,w:2.6,sfx:'hit'},
           {k:'f2lob',st:'throwW',n:1,r:56,windup:0.7,flight:1.0,col:F2COL.orange,ball:'#a8b0c0',br:15,h:150,min:150,max:640,w:2,every:3,
             land:(e,x,y)=>{ f2Shards(x,y,16,'170,180,200'); shake(5); SFX.play('boom'); const p=player; if(!p.dead&&!f2Up()&&dist(x,y,p.x,p.y)<56+p.r*0.5) hurtPlayer(e.dmg*1.0,x,y,260);
               f2Roller(x,y,angTo(x,y,player.x,player.y),{r:20,spd:300,len:520,dmg:e.dmg*0.8,wait:0.25,rock:true}); }},
           {k:'f2drum',windup:0.8,max:500,w:1.2,every:8}]}),
  init(e,opt){ f2MiniInit(e,opt); },
  onBlaze(e,dt){ if(e.fistT>0) return; if(f2Heat(e,'fistH',dt,1.2)){ e.fistT=12; SFX.play('pop'); f2Puff(e.x,e.y-30,'235,245,255',16); f2Txt(e,S('My KNUCKLES! (His icy fists melt.)','My KNUCKLES!'),'#ffd27a',15); } },
  onDeath(e){ f2Corpse(e); f2MiniDone(e); },
  draw3d:(e,fl)=>f2FigYeti(e,fl,false), draw2d:f2Yeti2,
  sheet:f2Rows({state:'punchW',st:0.3},{state:'punch'},[{state:'throwW',st:0.4,at:0.5,label:'boulder throw'},{state:'drumW',st:0.4,at:0.5,label:'belly drum'},{state:'chase',fistT:5,label:'fists melted'}])});
// his punches hurt half while his fists are melted
{ const base=fkDmg; fkDmg=function(e,o){ const v=base(e,o); return e&&e.type==='f_grumbo'&&e.fistT>0&&o&&o.k==='f2combo'?v*0.5:v; }; }
// dazed: no moving for a moment, stars round Ash's head
function f2Daze(t){ F2.dazeT=Math.max(F2.dazeT||0,t); ftext(player.x,player.y-46,S('Dazed!','Dazed!'),'#ffe066',13); }
{ const base=updatePlayer; updatePlayer=function(dt,inp){ if(F2.dazeT>0&&G&&player&&!player.dead){ F2.dazeT-=dt; inp=Object.assign({},inp||{},{mx:0,my:0,attack:false,roll:false,sprint:false}); } return base(dt,inp); }; }
{ const base=drawMarkers; drawMarkers=function(t){ base(t); if(F2.dazeT>0&&player&&!player.dead) f2DrawStars(player.x,player.y-46-(player.z||0),t); }; }
// Ash's roar breaks a roar ring (Grumbo's drum) and bursts rolling snowballs close by
{ const base=doRoar; doRoar=function(free){ base(free); try{ const p=player; for(const z of G.fz||[]){ if(z.k==='f2wave'&&z.roar&&!z.done&&dist(z.x,z.y,p.x,p.y)<(z.rad||0)+260){ z.done=true; ftext(p.x,p.y-60,S('Your roar breaks his drum ring!','Your roar wins!'),'#ffe066',15); } } }catch(err){} }; }
// a yeti: Grumbo (violet eyes, icy fists, Mumble's lunchbox on a chain) or Mumble (gentle, brown eyes, a red scarf)
function f2FigYeti(e,fl,mumble){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||e.r)/34*(mumble?1.5:1.7), face=t3Turn(e,e.face,6), fx=e.x, fy=e.y+e.r*0.4, inS=foSt(e), dead=foDeath(e), hurt=f2Hurt(e);
  const fur=fl?'#ffffff':foT(e,mumble?'#f2f0ea':'#eef2f8'), furD=foT(e,mumble?'#cfc8bc':'#c8d0de'), face0=mumble?'#b8a8a0':'#9aa2b8', ice='#a8dcf6', melted=e.fistT>0;
  const mv=foWalk(e,dt,6), w=e._wp||0;
  let pa=0, pb=0, up=0, drum=0, lean=0;
  if(st==='punchW'){ pa=-f2Sm(clamp(inS/0.5,0,1))*0.7; lean=-0.1; } else if(st==='punch'){ const c=(e.comboI||0)%2; if(c) pb=1; else pa=1; lean=0.2; }
  else if(st==='throwW'||st==='throwW'){ up=f2Sm(clamp(inS/0.6,0,1)); } else if(st==='drumW'){ drum=Math.sin(t*22)*0.5+0.5; } else if(st==='hold'){ pa=0.6; pb=0.6; lean=0.3; }
  const P=foEase(e,'_fyt',foTg(pa,pb,up,lean),dt,st==='punch'?20:10); pa=P[0]; pb=P[1]; up=P[2]; lean=P[3];
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,-1*dead,0.2*dead,0,-4*dead,0,0); else if(e.stun>0) foSet(FOB,0,0,Math.sin(t*6)*0.1,0);
  foLow(); for(const sd of [-1,1]){ const s=Math.sin(w)*mv*sd, lift=Math.max(0,Math.cos(w)*sd)*mv*1.4; foL(0,sd*5,10,s*3,sd*5.4,2+lift,4.2,furD,3.8); foE(s*3+1.6,sd*5.4,1.4+lift,4.6,3.2,1.6,face0); }
  foUp(); foSet(FOA,10,lean-hurt*0.1,0,0);
  foE(0,0,18,11,12,12,fur); foE(3,0,16,7,9,8,furD,0,0,0,0.01);
  for(let i=0;i<8;i++){ const a=i*0.8; foB(-4+Math.cos(a)*5,Math.sin(a)*10,24+((i*3)%5),2.6,fur,0.01); }
  if(!mumble){ foY(0,0,9,11.4,11.6,2,'#6a5a4a',null,0.02); foQ([7,-6,9, 7,-2,9, 7,-2,4, 7,-6,4],'#d84a3a','#8a2a20',0.06); foN(6,-8,10,7,-4,9,0.5,'#8a8e98',0.06); }
  else { foY(0,0,29,7,8,2.6,'#c8403a',null,0.03); foL(4,5,29,8,7,22,1.6,'#c8403a',1.2,0.04); }
  // arms: big furry arms, fists of ice (or bare melted fists)
  for(const sd of [-1,1]){ const pu=sd>0?pa:pb, ax=4+pu*14-up*4, ay=sd*(14-pu*4), az=16+pu*6+up*18+(st==='drumW'?4+drum*3:0), hx=st==='drumW'?6:ax, hy=st==='drumW'?sd*5:ay;
    foL(1,sd*11,24,(1+hx)/2,sd*14,(24+az)/2,4.4,fur,4); foL((1+hx)/2,sd*14,(24+az)/2,hx,hy,az,4,furD,3.6);
    if(!mumble&&!melted){ foE(hx+2,hy,az,4.6,4.6,4.4,ice,0,0,0,0.02); f2Crystals(hx+2,hy,az+3,3,2,'#e6f6ff',ice); } else foB(hx+1.5,hy,az,3.4,face0,0.02); }
  if(up>0.4&&st==='throwW') foB(-2,0,46,9*up,'#a8b0c0',0.02);
  // the head: a big furry dome, a flat face, eyes (violet under the spell; kind brown for Mumble), little horns
  foE(2,0,34,8.6,9,8,fur); foE(7.6,0,32,3.4,6.4,5.4,face0,0,0,0,0.01);
  for(const sd of [-1,1]){ if(mumble) f2Eye(9.6,sd*2.4,33,1.2,'#ffffff'); else f2Glow(9.8,sd*2.4,33.4,1.3,'#c48cff',0.4); foC(2,sd*6,40,0,sd*8,45,1.4,'#e8dcc8',0.02); }
  foN(9.8,-1.8,30.4,9.8,1.8,30.4+(mumble?0.4:-0.4),0.6,'#3a2a2a',0.05);
  foEnd(20); e._t3top=foTop(fy,46,k);
}
function f2Yeti2(e,fl){ const x=e.x, y=e.y, r=e.r0||e.r, f=e.face; ctx.save(); f2Shadow2(e,1.15); ctx.translate(x,y); ctx.rotate(f);
  f2E2(0,0,r*0.8,r*0.9,fl?'#fff':'#eef2f8',0,2.2); for(const s of [-1,1]) f2E2(r*0.5,s*r*0.9,r*0.28,r*0.28,e.fistT>0?'#9aa2b8':'#a8dcf6',0,1.6);
  f2E2(r*0.45,0,r*0.36,r*0.4,'#9aa2b8',0,1.6); for(const s of [-1,1]){ ctx.fillStyle='#c48cff'; ctx.beginPath(); ctx.arc(r*0.65,s*r*0.15,2.2,0,TAU); ctx.fill(); } ctx.restore(); }

// ================= 14. room templates for the dungeon helpers, every frame, the test hall
// F2_TPL rows: `.` floor, `#` wall, `:` chasm, `I` ice floor, `=` raised floor. F2_FROST rows: the p3_frost layer.
F2_TPL.forge=f2Tpl(31,23,f2Round(31,23,4));
F2_TPL.walrus=f2Tpl(15,11,(i,j)=>Math.min(i,14-i)+Math.min(j,10-j)<2?'#':(i>=2&&i<=12&&j>=2&&j<=8)?'I':'.');
F2_TPL.gale=f2Tpl(15,11,(i,j)=>{ if(Math.min(i,14-i)+Math.min(j,10-j)<2) return '#'; const mid=i>=4&&i<=10&&j>=2&&j<=8, west=i<=2&&j>=3&&j<=7, east=i>=12&&j>=3&&j<=7, br=(j===5&&(i===3||i===11)), rim=j<=1||j>=9; return mid||west||east||br||rim?'.':':'; });
F2_TPL.dillo=f2Tpl(15,11,f2Round(15,11,2));
F2_TPL.den=f2Tpl(15,11,(i,j)=>Math.min(i,14-i)+Math.min(j,10-j)<2?'#':((i===3&&j===3)||(i===11&&j===7))?'#':'.');
// ready room specs: spread one into a defineDungeon room, e.g. BOSS:{at:[0,0],...F2_ROOM.f_bellows}
const F2_ROOM={
  f_bellows:{span:[2,2],kind:'boss',f2boss:'f_bellows',tpl:F2_TPL.forge,noPots:true,noDecor:true},
  f_frostfeather:{span:[2,2],kind:'boss',f2boss:'f_frostfeather',tpl:F2_TPL.roost,noPots:true,noDecor:true},
  f_grumblehorn:{span:[2,2],kind:'boss',f2boss:'f_grumblehorn',tpl:F2_TPL.throne,frost:F2_FROST.throne,noPots:true,noDecor:true},
  f_blubberton:{kind:'miniboss',f2boss:'f_blubberton',tpl:F2_TPL.walrus,noPots:true,noDecor:true},
  f_squall:{kind:'miniboss',f2boss:'f_squall',tpl:F2_TPL.gale,noPots:true,noDecor:true,ribbons:[{pts:[[2,5],[4,5]],both:true,any:true},{pts:[[10,5],[12,5]],both:true,any:true}]},
  f_rockjaw:{kind:'miniboss',f2boss:'f_rockjaw',tpl:F2_TPL.dillo,noPots:true,noDecor:true},
  f_grumbo:{kind:'miniboss',f2boss:'f_grumbo',tpl:F2_TPL.den,noPots:true,noDecor:true}};
// the Frost Boss Hall: a test dungeon with one room for each (no door leads here; __eb.f2Test goes in)
const F2LAB_ROOM={f_bellows:'B',f_frostfeather:'F',f_grumblehorn:'R',f_blubberton:'m',f_squall:'k',f_rockjaw:'j',f_grumbo:'h'};
defineDungeon('f2_lab',{name:S('The Frost Boss Hall','The Frost Boss Hall'),level:14,theme:'ice',seed:327,save:'f2_lab',noJuniper:true,giftOK:{},dark:0.1,dunKind:S('A test hall','A test hall'),
  floors:[{id:'1',name:S('The Hall','The Hall'),map:{rooms:{
    a:{at:[2,4],kind:'start',noPots:true,sign:S('The Frost Boss Hall. Every boss of the north, one room each.','The Frost Boss Hall.')},
    m:Object.assign({at:[2,3]},F2_ROOM.f_blubberton), k:Object.assign({at:[3,3]},F2_ROOM.f_squall), j:Object.assign({at:[1,3]},F2_ROOM.f_rockjaw),
    h:Object.assign({at:[1,2]},F2_ROOM.f_grumbo), c:{at:[2,2],kind:'free',noPots:true},
    B:Object.assign({at:[0,0]},F2_ROOM.f_bellows), F:Object.assign({at:[2,0]},F2_ROOM.f_frostfeather), R:Object.assign({at:[4,0]},F2_ROOM.f_grumblehorn)},
    links:[['a','m','open'],['m','j','open'],['m','k','open'],['m','c','open'],['c','h','open'],['c','F','open'],['h','B','open'],['F','R','open']]}}]});
// ---- every frame
function f2SitesReset(){ F2G.on=false; F2.ves=null; }
// the world module's places (POI f_dreadgate, f_crown) carry the two outdoor sites once they exist (one name on the map)
function f2SitePoi(){ for(const [k,w] of [['f_hush','f_dreadgate'],['f_glaciar','f_crown']]){ const s=SITES[k], d=BOSSES[k]; if(!s||s.poi===w||!POI[w]) continue; if(G.fightSite===k) continue; s.poi=w; if(d) d.poi=w; if(POI[k]&&k!==w) delete POI[k]; } }
function f2Frame(dt){
  f2FrameDeaths(dt); if(!AREA) f2SitePoi();
  f2MothDust(dt);
  try{ f2RoomsFrame(dt); }catch(err){ console.error(err); }
  if(F2.lamps.length) f2LampsTick(dt);
  if(F2.ves) f2HushFrame(dt);
  if(F2G.on) f2GlaFrame(dt);
  if(F2B.on) try{ f2BotFrame(dt); }catch(err){ console.error(err); }
}
function f2Tall(list){
  f2RoomsTall(list); f2OutTall(list); f2GlaTall(list);
  const V=F2.ves; if(V&&!AREA){ if(!V.it) V.it={x:0,y:0,draw:()=>{ if(F2.ves) f2DrawVesperAlly(F2.ves); }}; V.it.x=V.x; V.it.y=V.y; list.push(V.it); }
}
{ const base=f2OutGround; f2OutGround=function(){ base(); f2GlaGround(); }; }
// ---- the sites the story relies on: the Dreadgate (Hush) needs f_drum; the Crown (Glaciar) needs the summit door open
// (f_crown_open) or stage f_glaciar. The default when the story module has no hook: after Hush, stage f_dread.
{ const s=SITES.f_glaciar; if(s) s.open=()=>!G.bossDone.f_glaciar&&!G.flags.f_glaciar_won&&(!!G.flags.f_crown_open||(!!STAGEDEF.f_glaciar&&reached('f_glaciar'))); }
{ const d=BOSSES.f_hush; if(d){ const w=d.onWin; d.onWin=function(){ w.apply(this,arguments); try{ if(F2.hook.hushDone) F2.hook.hushDone(); else if(STAGEDEF.f_dread&&G.stage==='f_dreadgate') setStage('f_dread'); }catch(err){ console.error(err); } }; } }

// ================= 15. debug hooks (window.__eb.f2f, __eb.f2Test) and a scripted fighter for the tests
// __eb.f2Test(type,{diff:0|1|2,intro:false,chains:n}) puts Ash in the boss's room of the Frost Boss Hall (Hush: the
// Dreadgate plaza with f_drum set; Glaciar: the Crown with the summit door open) and starts the fight.
// __eb.f2f.bot(type,{mech:true,heal:true}) plays it; __eb.f2f.state() reports; __eb.f2f.run(sec) steps the game.
function f2Test(type,o){
  o=o||{}; if(window.__eb&&window.__eb.bal&&o.diff!=null) window.__eb.bal.setDiff(o.diff);
  G.abil=G.abil||{}; for(const id of ['jump','stride','wings','dbljump','skimmer','claws','grapple','shadow','blaze','windride','pound']) G.abil[id]=true; G.flags.forge=true;
  if(typeof P2!=='undefined'&&P2.tips) for(const k of ['climb','hang','pull','chain','ring']) P2.tips[k]=9;
  if(typeof P3!=='undefined') for(const k of ['blue','ride']) P3.tips[k]=9;
  if(G.fightSite) resetBoss(); G.bossDone[type]=false; F2.noIntro=o.intro===false; F2.dmg=0; F2.hits=0; F2.bySrc={};
  // (intro:false skips the story's own intro for this boss too: x2_story plays it the first time the boss is in view)
  if(o.intro===false&&typeof f2sMark==='function') try{ f2sMark((type==='f_squeak'?'f_squall':type)+'_intro'); }catch(e){}
  for(const k in G.flags) if(k.startsWith('f2tip_')) delete G.flags[k];
  if(type==='f_hush'||type==='f_glaciar'){
    if(AREA) exitArea(true);
    const k=F2SITE[type], s=SITES[k], P=POI[s.poi];
    if(type==='f_hush'){ G.flags.f_drum=1; G.flags.f_hush_done=0; } else { G.flags.f_crown_open=1; G.flags.f_glaciar_won=0; G.choices.f_glaciar=null; }
    for(const e of G.enemies) if(!e.dead&&dist(e.x,e.y,P.x,P.y)<P.r+1000) e.dead=true;
    player.x=P.x; player.y=P.y+P.r*(type==='f_glaciar'?0.45:0.55); player.kvx=player.kvy=0; player.dead=false; player.hp=player.maxHp; player.flying=false; player.z=0; updateCam(0,true); G.chunkBurst=16;
    if(o.intro===false){ G.fightSite=k; G.fightIntro=false; startBossFight(k); }
    return {site:k,x:P.x,y:P.y};
  }
  const room=F2LAB_ROOM[type]; if(!room) return null;
  for(const k in G.found) if(k.startsWith('cv_f2_lab_')&&k.endsWith('_solved')) delete G.found[k];
  if(AREA&&AREA.id==='f2_lab') exitArea(true);
  const id=dunGo('f2_lab',room); const R=AREA&&AREA.rooms[room];
  if(R){ R.solved=false; R.enemies=R.enemies||[]; player.x=R.cx; player.y=R.cy+Math.min(220,(R.y1-R.y0)*0.3); updateCam(0,true); }
  return {area:id,room,x:R&&R.cx,y:R&&R.cy};
}
// melt n of Glaciar's chains now (bible 13.3): each one snaps as if Ash had melted it
function f2Chains(n){ const e=G.boss; let k=0; for(const st of F2G.stones){ if(k>=(n||4)) break; if(st.done) continue; if(e&&e.type==='f_glaciar'&&!e.dead){ f2StoneSnap(st); } else { st.done=true; F2G.melted++; } k++; } return F2G.melted; }
// ---- the scripted fighter. It walks at Ash's running speed, reads the telegraphs Ash sees and steps out of them, jumps
// waves and rolling things, swings at the boss on a fair cadence, and works each mechanic through the game's own code:
// fire breath (Blaze) and jumps go in as real button presses, a Ground Pound is the game's own landing.
const F2B={on:false,type:null,mech:true,heal:true,t:0,hitT:0,heals:0,ev:{},dealt:0,tx:null,ty:null,inp:{},fireT:0,poundT:0,dodges:0,task:null};
function f2BotEv(k){ F2B.ev[k]=(F2B.ev[k]||0)+1; }
{ const base=updatePlayer; updatePlayer=function(dt,inp){ if((F2B.on||F2B.manual)&&G&&player&&!player.dead){ const I=F2B.inp; if(I.fire||I.jump||I.attack){ inp=Object.assign({},inp||{},{fire:!!I.fire||(inp&&inp.fire),jump:!!I.jump,jumpHeld:!!I.jump||!!I.jumpHeld,attack:!!I.attack}); I.jump=false; I.attack=false; } }
  return base(dt,inp); }; }
function f2BotSwing(e,mul){
  const p=player; if(!e||e.dead||e.invuln||e.spawnIn>0) return false; let best=null;
  for(const c of hitCircles(e)) if(dist(p.x,p.y,c.x,c.y)-c.r<78&&(!best||c.m>best.m)) best=c;
  if(!best) return false; p.facing=angTo(p.x,p.y,best.x,best.y); p.swingDir=p.facing;
  if(!(p.swingT>0)){ p.swingW='sword'; p.swingFin=false; p.swingSpin=false; p.swingDur=0.2; p.swingT=0.2; p.swingHit=new Set(G.enemies.map(q=>q.id)); p.swingHitstop=true; p.swingObj=true; }
  const before=e.hp; wStrike(e,best,mul||1,'sword',{kb:60,ka:p.facing}); F2B.dealt+=Math.max(0,before-e.hp); return true;
}
function f2BotGo(x,y){ F2B.tx=x; F2B.ty=y; }
// a way round the chasms in a cave room (a breadth-first walk over floor cells): the next spot to head for
function f2BotWalkable(k){ const A=AREA, c=A.cave; if(k<0||k>=c.grid.length||c.grid[k]!==0) return false;
  if(A.tri) return tGround(k)&&!tHole(k)&&!caveBlockedAt(k);
  const t=c.typ?c.typ[k]:0; if(t===1||t===3||t===4||t===6||t===7||t===9) return false; return !caveBlockedAt(k); }
function f2BotStep(k,n){ if(!f2BotWalkable(n)) return false; if(AREA.tri&&typeof dunH==='function') return Math.max(0,dunH(n))<=Math.max(0,dunH(k)); return true; }
function f2BotWay(tx,ty){
  const A=AREA, p=player; if(!A||!A.cave) return {x:tx,y:ty}; const c=A.cave, cs=c.cell, W=c.w;
  const cell=(x,y)=>Math.floor((y-A.y0)/cs)*W+Math.floor((x-A.x0)/cs), s=cell(p.x,p.y), g=cell(tx,ty);
  if(s===g||!f2BotWalkable(g)) return {x:tx,y:ty};
  const K=F2B.way; if(K&&K.g===g&&K.t>G.time&&K.path&&K.path.length){ while(K.path.length>1&&K.path[0]===s) K.path.shift(); const q=K.path.indexOf(s); if(q>=0) K.path.splice(0,q+1); }
  else { const prev=new Map([[s,-1]]), Q=[s]; let found=false;
    for(let qi=0;qi<Q.length&&qi<6000;qi++){ const k=Q[qi]; if(k===g){ found=true; break; } const i=k%W;
      for(const [d,ok] of [[1,i<W-1],[-1,i>0],[W,true],[-W,true]]){ const n=k+d; if(!ok||prev.has(n)||!f2BotStep(k,n)) continue; prev.set(n,k); Q.push(n); } }
    if(!found){ F2B.way=null; return {x:tx,y:ty}; }
    const path=[]; for(let k=g;k!==s&&k!==-1;k=prev.get(k)) path.push(k); path.reverse(); F2B.way={g,t:G.time+0.6,path}; }
  const P=F2B.way&&F2B.way.path; if(!P||P.length<2) return {x:tx,y:ty};
  // head for the furthest of the next few cells that is in a straight floor line
  const k=P[0];
  return {x:A.x0+(k%W+0.5)*cs,y:A.y0+(Math.floor(k/W)+0.5)*cs};
}
function f2BotMove(dt){
  const p=player; if(F2B.tx==null||airborne()||(typeof P3!=='undefined'&&(P3.ride||P3.mv))||p.hop) return;
  const w=AREA&&AREA.cave?f2BotWay(F2B.tx,F2B.ty):{x:F2B.tx,y:F2B.ty}, TX=w.x, TY=w.y;
  const d=dist(p.x,p.y,TX,TY), sp=((p.stats&&p.stats.speed)||200)*1.25*dt;
  if(d<1) return; const u=Math.min(1,sp/d), x=p.x+(TX-p.x)*u, y=p.y+(TY-p.y)*u;
  if(AREA&&AREA.tri){ const k0=tCell(p.x,p.y), bad=(xx,yy)=>{ const k1=tCell(xx,yy); return k1<0||(k0!==k1&&(Math.max(0,dunH(k1))>Math.max(0,dunH(k0))||!tGround(k1)||tHole(k1))); };
    if(bad(x,y)){ if(!bad(x,p.y)){ p.x=x; p.kvx=p.kvy=0; AREA.tri.lx=p.x; AREA.tri.ly=p.y; } else if(!bad(p.x,y)){ p.y=y; p.kvx=p.kvy=0; AREA.tri.lx=p.x; AREA.tri.ly=p.y; } return; } }
  else if(playerBlocked(x,y)){ const a=angTo(p.x,p.y,TX,TY)+(F2B.side||0.9); const x2=p.x+Math.cos(a)*sp, y2=p.y+Math.sin(a)*sp; if(!playerBlocked(x2,y2)){ p.x=x2; p.y=y2; } else F2B.side=-(F2B.side||0.9); return; }
  p.x=x; p.y=y; p.kvx=p.kvy=0; if(!F2B.inp.fire) p.facing=angTo(p.x,p.y,TX,TY); if(AREA&&AREA.tri){ AREA.tri.lx=x; AREA.tri.ly=y; }
}
function f2BotNear(e,r,a){ const p=player; a=a!=null?a:angTo(e.x,e.y,p.x,p.y); const C=f2Ctx(e), q={x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r}; f2Hold(C,q,44); f2BotGo(q.x,q.y); }
function f2BotAt(x,y,r){ return dist(player.x,player.y,x,y)<(r||36); }
// hold fire breath toward (x,y) (it turns blue after the warm-up: Blaze)
function f2BotBlaze(x,y){ const p=player; const a=angTo(p.x,p.y,x,y); p.faceGoal=a; p.facing=a; p.aim=a; F2B.inp.fire=true; p.energy=Math.max(p.energy,p.maxEnergy*0.5); p.exhausted=false; f2BotEv('blaze'); }
// a Ground Pound right here (the game's own landing code)
function f2BotPound(){ if(F2B.poundT>0) return false; F2B.poundT=0.9; p3PoundImpact(player); f2BotEv('pound'); return true; }
// where the danger is: marked circles, lines and cones, and the foes' own wind-up shapes. Returns a spot to run to.
function f2BotDanger(e){
  const p=player, out=(cx,cy,r)=>{ const a=angTo(cx,cy,p.x,p.y)+(Math.random()<0.5?0.3:-0.3); return {x:cx+Math.cos(a)*(r+50),y:cy+Math.sin(a)*(r+50)}; };
  const side=(x0,y0,ang,w)=>{ const nx=-Math.sin(ang), ny=Math.cos(ang), s=((p.x-x0)*nx+(p.y-y0)*ny)>=0?1:-1; return {x:p.x+nx*s*(w/2+54),y:p.y+ny*s*(w/2+54)}; };
  const inLine=(x0,y0,ang,len,w)=>{ const dx=p.x-x0, dy=p.y-y0, u=dx*Math.cos(ang)+dy*Math.sin(ang), v=-dx*Math.sin(ang)+dy*Math.cos(ang); return u>-p.r&&u<len+p.r&&Math.abs(v)<w/2+p.r; };
  for(const z of G.fz||[]){
    if(z.k==='f2mark'||z.k==='f2lob'){ if(z.shape==='line'){ if(inLine(z.x,z.y,z.ang||0,z.len,z.w||30)) return side(z.x,z.y,z.ang||0,z.w||30); continue; }
      if(z.shape==='cone'){ if(dist(z.x,z.y,p.x,p.y)<z.len+p.r&&Math.abs(angDiff(z.ang||0,angTo(z.x,z.y,p.x,p.y)))<z.half+0.15) return side(z.x,z.y,z.ang||0,Math.sin(z.half)*z.len*2); continue; }
      if(z.shape==='donut') continue; if(z.r&&dist(z.x,z.y,p.x,p.y)<z.r+p.r) return out(z.x,z.y,z.r); }
    if(z.k==='f2cloud'&&dist(z.x,z.y,p.x,p.y)<z.r+p.r) return out(z.x,z.y,z.r);
    if(z.k==='f2twist'&&dist(z.x,z.y,p.x,p.y)<z.r*1.4) return out(z.x,z.y,z.r*1.5);
    if(z.k==='f2roller'&&z.t<(z.wait||0)&&inLine(z.x,z.y,z.ang,z.len,z.r*2)) return side(z.x,z.y,z.ang,z.r*2);
  }
  for(const q of G.enemies){ if(q.dead||!q.tele) continue; const T=q.tele;
    if(T.shape==='arc'||T.shape==='cone'){ const r=T.r||T.len||60, half=T.half||1; if(dist(q.x,q.y,p.x,p.y)<r+p.r&&Math.abs(angDiff(q.face,angTo(q.x,q.y,p.x,p.y)))<half+0.2) return q.boss&&q.type==='f_glaciar'?side(q.x,q.y,q.face,Math.sin(half)*r*2):out(q.x,q.y,r); }
    else if(T.shape==='line'){ if(inLine(q.x,q.y,q.face,T.len||300,T.w||30)) return side(q.x,q.y,q.face,T.w||30); }
    else if(T.shape==='circle'){ const r=T.r||60; if(dist(q.x,q.y,p.x,p.y)<r+p.r) return out(q.x,q.y,r); } }
  return null;
}
function f2BotFrame(dt){
  const p=player, e=G.boss; F2B.t+=dt; if(p.dead) return; F2B.inp.fire=false; if(F2B.poundT>0) F2B.poundT-=dt;
  if(F2B.heal!==false&&p.hp<p.maxHp*0.4){ p.hp=p.maxHp; F2B.heals++; }
  if(F2.frozenT>0){ F2.frozenT=Math.max(0,F2.frozenT-dt*3); }
  // jump over shock waves, rolling snowballs and low sweeps like a careful player would
  { let jump=false; for(const z of G.fz||[]){ if(z.k==='f2wave'&&z.rad&&z.t>=(z.wait||0)&&Math.abs(dist(z.x,z.y,p.x,p.y)-z.rad)<54) jump=true; if(z.k==='f2roller'&&z.t>=(z.wait||0)&&dist(z.x,z.y,p.x,p.y)<z.r+70) jump=true; }
    for(const R of G.rings) if(R.owner!=='player'&&Math.abs(dist(R.x,R.y,p.x,p.y)-R.rad)<60) jump=true;
    if(e&&!e.dead&&(e.state==='tailW'||e.state==='sweepW')&&e.st<0.14) jump=true;
    if(jump&&!(p.z>3)&&!airborne()){ p.z=8; p.vz=200; } }
  if(!e||e.dead||G.fightIntro){ F2B.tx=null; return; }
  F2B.hitT-=dt; const swing=k=>{ if(F2B.hitT<=0){ if(f2BotSwing(e,k)) F2B.hitT=0.5; } };
  const busy=f2BotPlan(e,dt,swing);
  if(F2B.hitT<=0){ let q=null, bd=1e9; for(const f of G.enemies){ if(f===e||f.dead||f.passive||f.spawnIn>0||f.fake) continue; const dd=dist(p.x,p.y,f.x,f.y)-f.r; if(dd<60&&dd<bd){ bd=dd; q=f; } } if(q&&f2BotSwing(q,1)){ F2B.hitT=0.5; f2BotEv('swat'); } }
  if(!busy){ const q=f2BotDanger(e); if(q){ f2Hold(f2Ctx(e),q,48); f2BotGo(q.x,q.y); F2B.dodges++; } }
  f2BotMove(dt);
}
// one boss's plan for this frame. Returns true while doing something a dodge must not interrupt.
function f2BotPlan(e,dt,swing){
  const p=player, T=e.type, M=F2B.mech, C=f2Ctx(e);
  if(T==='f_bellows'){ const D=f2RoomOf(e);
    if(e.state==='stagger'){ const c=f2BelCore(e); f2BotGo(c.x+Math.cos(e.face)*40,c.y+Math.sin(e.face)*40); swing(1); return false; }
    if(M&&(e.state==='inhaleW'||e.state==='inhale')){ const q={x:e.x+Math.cos(e.face)*150,y:e.y+Math.sin(e.face)*150}; f2Hold(C,q,44); f2BotGo(q.x,q.y); if(f2BotAt(q.x,q.y,50)){ const c=f2BelCore(e); f2BotBlaze(c.x,c.y); f2BotEv('furnace'); } return true; }
    if(M&&D&&e.bph>=1&&e.refreezeT<5){ const v=D.vents.find((v,i)=>!e.plates[i]&&!(v.sealT>2)); if(v){ const q={x:v.x+(C.cx-v.x)*0.25,y:v.y+(C.cy-v.y)*0.25}; f2BotGo(q.x,q.y); if(f2BotAt(q.x,q.y,40)){ f2BotBlaze(v.x,v.y-12); f2BotEv('vent'); } return true; } }
    const i=f2BelSide(e,p.x,p.y);
    if(M&&e.plates[i]){ f2BotNear(e,e.r+110); if(dist(p.x,p.y,e.x,e.y)<e.r+190){ f2BotBlaze(e.x,e.y); f2BotEv('plate'); } return false; }
    f2BotNear(e,e.r+34,(F2B.t*0.4)%TAU+(M?0:0)); swing(1); return false; }
  if(T==='f_frostfeather'){ const D=f2RoomOf(e);
    if(F2.lift){ f2BotBlaze(e.x,e.y); f2BotEv('eyes'); return true; }
    if(e.mode==='dizzy'||e.state==='stuck'){ f2BotNear(e,e.r+30); swing(1); return false; }
    if(e.bph>=1&&(e.mode==='high'||e.mode==='takeoff')){
      if(M&&D&&D.vanes.some(v=>!v.ok)){ const v=D.vanes.find(v=>!v.ok); f2BotGo(v.x,v.y+40); if(f2BotAt(v.x,v.y+40,30)){ v.onHit('slash'); f2BotEv('vane'); } return false; }
      if(M&&D&&D.upOn){ f2BotGo(D.up.x,D.up.y); return f2BotAt(D.up.x,D.up.y,40); }
      f2BotGo(C.cx+100,C.cy+160); return false; }
    if(e.mode==='spin'||e.mode==='spinIn'){ f2BotGo(C.cx,C.cy+260); return false; }
    f2BotNear(e,e.r+40,(F2B.t*0.5)%TAU); swing(1); return false; }
  if(T==='f_grumblehorn'){ const A=AREA, pil=A&&A.p3?A.p3.gates.filter(g=>g.g==='pillar'&&g.closed):[];
    if(e.state==='stuck'||e.state==='stagger'){ f2BotNear(e,e.r+20,e.face+Math.PI); if(M&&dist(p.x,p.y,e.x,e.y)<e.r+50&&(e.plates>0)&&F2B.poundT<=0){ f2BotPound(); } swing(1); return false; }
    if(M&&e.state==='land'&&G.time-(e.landT||0)<0.15&&dist(p.x,p.y,e.x,e.y)<400){ f2BotPound(); f2BotEv('poundback'); return false; }
    if(M&&e.bph>=2&&A&&A.p3){ let best=null, bd=1e9; for(const o of A.objs){ if(o.p3!=='drum') continue; const d=dist(o.x,o.y,e.x,e.y); if(d<bd){ bd=d; best=o; } }
      if(best&&e.state!=='stagger'){ f2BotGo(best.x,best.y+50); if(f2BotAt(best.x,best.y+50,30)&&bd<280){ f2BotPound(); f2BotEv('drum'); } return false; } }
    if(M&&pil.length&&e.bph<2){
      // a player's way: put a raised pillar between him and Ash; when the charge comes, stay behind it (it takes the hit)
      const shield=pil.find(g=>segD(g.x,g.y,e.x,e.y,p.x,p.y)<(g.r||24)+18&&dist(g.x,g.y,p.x,p.y)<dist(e.x,e.y,p.x,p.y));
      if(shield&&(e.state==='chargeAim'||e.state==='charge')){ F2B.tx=null; f2BotEv('behind'); return true; }
      let best=null, bs=-1e9; for(const g of pil){ const s=dist(g.x,g.y,e.x,e.y)-dist(g.x,g.y,p.x,p.y)*0.6; if(s>bs){ bs=s; best=g; } }
      const a=angTo(e.x,e.y,best.x,best.y), q={x:best.x+Math.cos(a)*70,y:best.y+Math.sin(a)*70}; f2Hold(C,q,44); f2BotGo(q.x,q.y); if(dist(p.x,p.y,e.x,e.y)<e.r+60) swing(1); return false; }
    f2BotNear(e,e.r+40,(F2B.t*0.6)%TAU); swing(1); return false; }
  if(T==='f_hush'){
    if(e.mode==='dizzy'){ f2BotNear(e,e.r+20); swing(1); return false; }
    if(e.mode==='hover'){ f2BotGo(e.x,e.y); if(M&&f2BotAt(e.x,e.y,50)) f2BotPound(); return false; }
    if(M){ const L=F2HP.lamps.find(L=>L.lit); if(!L){ let best=null, bd=1e9; for(const q of F2HP.lamps){ const d=dist(p.x,p.y,q.x,q.y); if(d<bd){ bd=d; best=q; } }
        if(best){ const a=angTo(best.x,best.y,C.cx,C.cy), q={x:best.x+Math.cos(a)*260,y:best.y+Math.sin(a)*260}; f2BotGo(q.x,q.y); if(dist(p.x,p.y,best.x,best.y)<330){ f2BotBlaze(best.x,best.y); f2BotEv('lamp'); } } return false; }
      if(e.mode==='lure'){ f2BotGo(L.x+40,L.y+60); return false; } }
    f2BotGo(C.cx+Math.cos(F2B.t*0.4)*160,C.cy+Math.sin(F2B.t*0.4)*120); return false; }
  if(T==='f_glaciar') return f2BotGlaciar(e,dt,swing);
  if(T==='f_blubberton'){ if(M&&e.shield&&e.blocking&&!(e.stun>0)){ f2BotNear(e,e.r+120,e.face); if(dist(p.x,p.y,e.x,e.y)<e.r+190) f2BotBlaze(e.x,e.y); return false; } f2BotNear(e,e.r+30,M?undefined:e.face); swing(1); return false; }
  if(T==='f_squall'||T==='f_squeak'){ const tg=T==='f_squall'?e:e; F2B.arT=(F2B.arT||0)-dt;
    for(const q of G.enemies){ if(q.dead||(q.type!=='f_squall'&&q.type!=='f_squeak')) continue; if(M&&q.type==='f_squeak'&&F2B.arT<=0&&dist(p.x,p.y,q.x,q.y)<500){ F2B.arT=0.7; damageEnemy(q,wPower()*1.0,{src:'arrow'}); f2BotEv('arrow'); } }
    const sq=G.enemies.find(q=>!q.dead&&q.type==='f_squall'); if(M&&sq&&dist(p.x,p.y,sq.x,sq.y)<300) f2BotBlaze(sq.x,sq.y);
    const tgt=sq||e; f2BotNear(tgt,tgt.r+40); swing(1); return false; }
  if(T==='f_rockjaw'){ if(M&&e.rolling&&dist(p.x,p.y,e.x,e.y)<140){ f2BotPound(); } if(e.rolling||e.state==='curl'){ f2BotNear(e,180); return false; } f2BotNear(e,e.r+30); swing(1); return false; }
  if(T==='f_grumbo'){ if(M&&!(e.fistT>0)&&dist(p.x,p.y,e.x,e.y)<260){ f2BotNear(e,e.r+120); f2BotBlaze(e.x,e.y); return false; } f2BotNear(e,e.r+34,(F2B.t*0.7)%TAU); swing(1); return false; }
  f2BotNear(e,e.r+40); swing(1); return false;
}
// Glaciar: work the chains in order (South, West, then East by the vent ribbon, North by the ledge), hit her when low
function f2BotGlaciar(e,dt,swing){
  const p=player, M=F2B.mech, C=f2Ctx(e), lv=f2Lvl();
  // a player who wants her free works the open chains first and saves the big hits for the Shard Heart
  const chainsLeft=M&&!F2G.heart&&F2G.stones.some(s=>!s.done&&f2StoneOpen(s));
  if((e.state==='stagger'&&!chainsLeft)||(F2G.heart&&e.bph>=2&&(e.z||0)<20)){ if(lv>F2G.lvl){ f2BotDown(); return true; } const H=F2G.heart&&e.bph>=2?{x:e.x+Math.cos(e.face)*80,y:e.y+Math.sin(e.face)*70}:f2GlaHead(e); f2BotGo(H.x,H.y); swing(1); return false; }
  if(M){ const st=F2G.stones.find(s=>f2StoneOpen(s));
    if(st){ const up=st.lvl>F2G.lvl;
      if(up&&lv<st.lvl){ // get up there: the vent ribbon (East), or climb / the grapple post (North)
        if(st.id==='e'){ const v=F2CR.vent; f2BotGo(v.x,v.y); if(f2BotAt(v.x,v.y,26)&&!airborne()&&!(P3&&(P3.ride||P3.mv))){ F2B.inp.jump=true; f2BotEv('ride'); } return true; }
        const q={x:st.x,y:F2CR.ledge[3]+70}; f2BotGo(q.x,q.y); if(f2BotAt(q.x,q.y,30)&&!p.hop){ ELEV.hopTo(st.px,st.py+6,'up'); f2BotEv('climb'); } return true; }
      if(st.id==='w'&&F2G.wall&&!F2G.wall.gone&&dist(p.x,p.y,st.x,st.y)>110){ const a=angTo(st.x,st.y,C.cx,C.cy), q={x:st.x+Math.cos(a)*190,y:st.y+Math.sin(a)*190}; f2BotGo(q.x,q.y); if(f2BotAt(q.x,q.y,40)) f2BotBlaze(st.x,st.y); f2BotEv('wall'); return true; }
      if(st.crack<=0){ f2BotGo(st.px,st.py); if(f2BotAt(st.px,st.py,26)&&F2B.poundT<=0) f2BotPound(); return true; }
      const a=angTo(st.x,st.y,C.cx,C.cy), q={x:st.x+Math.cos(a)*90,y:st.y+16+Math.sin(a)*90}; f2BotGo(q.x,q.y); if(f2BotAt(q.x,q.y,40)||dist(p.x,p.y,st.x,st.y)<130) f2BotBlaze(st.x,st.y+16); return true; } }
  if(lv>F2G.lvl){ f2BotDown(); return true; }
  if((e.z||0)>36){ f2BotGo(C.cx+Math.cos(F2B.t*0.3)*200,C.cy+Math.sin(F2B.t*0.3)*160); return false; }
  const H=f2GlaHead(e); f2BotNear(e,e.r+40,angTo(e.x,e.y,H.x,H.y)+0.9); swing(1); return false;
}
// down from the ledge or the slab: the game's hop
function f2BotDown(){ const p=player; if(p.hop||airborne()) return; const a=angTo(F2CR.x,F2CR.y,p.x,p.y)+Math.PI; for(const r of [130,170,220]){ const x=p.x+Math.cos(a)*r, y=p.y+Math.sin(a)*r+40; if(elevLvl(x,y)<=F2G.lvl){ ELEV.hopTo(x,y,'down'); f2BotEv('hopdown'); return; } } ELEV.hopTo(p.x,p.y+150,'down'); }
const F2F_DBG={F2,F2B,F2G,F2DUN,F2SITE,F2ROOMK,F2_TPL,F2_FROST,F2_ROOM,F2CR,F2HUSH,F2HP,FOES,f2BossStart,f2Chains,f2StoneSnap,f2StoneCrack,f2CrownTerrain,f2GlaciarAI,f2HushAI,f2Lamp,f2LampLight,
    walk(k){ return f2BotWalkable(k); }, pound(){ p3PoundImpact(player); return true; }, way(x,y){ F2B.way=null; const w=f2BotWay(x,y); return {w,path:F2B.way&&F2B.way.path.length}; },
    bot(type,o){ o=o||{}; Object.assign(F2B,{on:true,type,mech:o.mech!==false,heal:o.heal!==false,t:0,hitT:0,heals:0,ev:{},dealt:0,tx:null,ty:null,inp:{},fireT:0,poundT:0,dodges:0}); return true; },
    stop(){ F2B.on=false; F2B.tx=null; F2B.inp={}; F2B.manual=false; },
    // real button presses for the tests: press({fire:true}) holds fire breath until release(); jump and attack are one taps
    press(o){ F2B.manual=true; Object.assign(F2B.inp,o||{}); return true; }, release(){ F2B.inp={}; F2B.manual=false; return true; },
    state(){ const e=G.boss, D=e&&f2RoomOf(e); return {scene,site:G.fightSite,intro:G.fightIntro,done:Object.assign({},G.bossDone),dmg:Math.round(F2.dmg),hits:F2.hits,heals:F2B.heals,dodges:F2B.dodges,src:Object.fromEntries(Object.entries(F2.bySrc).map(([k,v])=>[k,Math.round(v)])),ev:Object.assign({},F2B.ev),dealt:Math.round(F2B.dealt),t:+F2B.t.toFixed(1),
      boss:e&&!e.dead?{type:e.type,hp:Math.round(e.hp),max:Math.round(e.maxHp),pct:+(e.hp/e.maxHp).toFixed(3),bph:e.bph||0,state:e.state,mode:e.mode||null,level:e.level,x:Math.round(e.x),y:Math.round(e.y),z:Math.round(e.z||0),
        plates:e.plates!=null?e.plates:null,overheats:e.overheats||0,dazes:e.dazes||null,grounds:e.grounds||null,flips:e.flips||0,shield:!!e.shield}:null,
      chains:F2G.stones.map(s=>({id:s.id,done:s.done,open:f2StoneOpen(s),crack:+s.crack.toFixed(1),heat:+s.heat.toFixed(2),lvl:s.lvl})),melted:F2G.melted,heart:F2G.heart,night:F2G.night,outcome:F2G.outcome||G.choices.f_glaciar||null,
      lamps:F2HP.lamps.map(L=>!!L.lit),white:+(F2.whiteT||0).toFixed(1),lift:!!F2.lift,
      room:D?{type:D.type,vents:D.vents?D.vents.map(v=>+(v.sealT||0).toFixed(1)):null,cw:D.cw!=null?D.cw:null,upOn:D.upOn!=null?D.upOn:null}:null,
      foes:G.enemies.filter(q=>!q.dead).map(q=>q.type),player:{x:Math.round(player.x),y:Math.round(player.y),hp:Math.round(player.hp),max:player.maxHp,lvl:f2Lvl(),level:player.level,z:Math.round(player.z||0),ride:!!(typeof P3!=='undefined'&&P3.ride)}}; },
    choose(i){ if(typeof chooseOpt==='function'&&DLG&&DLG.opts){ DLG.chars=1e9; chooseOpt(i||0); return true; } return false; },
    dlg(){ return DLG?{who:lineParts(DLG.lines[DLG.i]).who,opts:DLG.opts?DLG.opts.length:0,i:DLG.i,n:DLG.lines.length}:null; },
    rooms(){ return F2.rooms.map(D=>({type:D.type,room:D.R.id,cx:D.R.cx,cy:D.R.cy})); },
    run(sec,dt){ return window.__eb.foes.step(sec,dt||1/30); }};
window.__ebX=Object.assign(window.__ebX||{},{f2Test,f2f:F2F_DBG});
// fChains(n): in the Glaciar fight it snaps n chains; with no fight on, the story's stand-in locks (if it has them) melt instead
if(!(window.__ebX&&window.__ebX.fChains)) window.__ebX.fChains=function(n){ const e=G&&G.boss; if(e&&e.type==='f_glaciar'&&!e.dead) return f2Chains(n);
  const s=window.__eb&&window.__eb.f2s; if(s&&typeof s.meltLocks==='function') return s.meltLocks(n); return f2Chains(n); };
