
// ================= x1_foes: the Act II enemies and bosses (the Clockwork Coast)
// Built on e8_foes (defineFoe, the AI kit FK, defineBoss, bossPhase). Every foe has a 3D toy figure (T3E) and a 2D
// drawer for the Classic look. The guide (numbers, how to spawn, how to place each boss, hooks): scratchpad/C1FOES.md.
//   foes    c_tickbug, c_ram (also the Foreman), c_husher, c_tinman, c_gulper, c_moth, c_silkspinner (+ c_cocoon), c_gull
//   minis   c_brute (the Barnacle Brute), c_shadowash (Shadow Ash)
//   bosses  c_pinch (Gullcrag), c_ticktock (Brassworks), c_gloomwing (Lighthouse), c_saltbeard (side quest, outdoors),
//           c_mothmask (Vesper, the Shadow Spire; c_mothclone are her clones)
// Dungeon boss rooms: give the room `c1boss:'c_pinch'` (kind 'boss', no `boss:` field). The fight starts when Ash walks
// in, the doors lock, and the room is solved when the boss falls (so `gate:<room>` doors open). Or call c1BossStart.
// Colour language (ACT2.md 6): orange ground hit, white sweep, red line charge, silver dust, violet shadow, gold weak spot.

// ---------- 0. shared bits
const C1={hushT:0,blindT:0,slowT:0,area:null,corpses:[],won:{},hook:{},pending:null,dmg:0,hits:0,bySrc:{},trace:false,log:[]};
const C1COL={orange:'255,160,60',white:'255,255,255',red:'255,70,60',silver:'215,220,240',violet:'170,110,255',gold:'255,210,80',blue:'150,210,255'};
const c1Sm=t=>t*t*(3-2*t);
// a literal hit of n at the foe's level (like bdmg, but also right outside its AI tick: zones, mines, the arena)
function c1Dmg(e,n){ return n*((e&&e.edK)||1)*foeDiff().edmg; }
// the fight area of a foe: a dungeon room (e.arena), the raised arena, the Arena-mode ring or its home
function c1Ctx(e){
  const a=e&&e.arena; if(a) return {cx:a.cx,cy:a.cy,rect:true,x0:a.x0,y0:a.y0,x1:a.x1,y1:a.y1,R:Math.min(a.x1-a.x0,a.y1-a.y0)/2,A:null};
  const C=bossCtx(e); return {cx:C.cx,cy:C.cy,R:C.R,A:C.A,rect:false};
}
function c1In(C,x,y,m){ m=m||0; if(C.rect) return x>C.x0+m&&x<C.x1-m&&y>C.y0+m&&y<C.y1-m; return bossIn(C,x,y,m); }
function c1Hold(C,o,m){ m=m||0; if(C.rect){ o.x=clamp(o.x,C.x0+m,C.x1-m); o.y=clamp(o.y,C.y0+m,C.y1-m); return o; } if(C.A){ arenaHold(C.A,o,m); return o; } const d=dist(o.x,o.y,C.cx,C.cy); if(d>C.R-m){ const a=angTo(C.cx,C.cy,o.x,o.y); o.x=C.cx+Math.cos(a)*(C.R-m); o.y=C.cy+Math.sin(a)*(C.R-m); } return o; }
function c1Solid(x,y){ return blockedAt(x,y)||colAt(x,y,4); }
// Ash's floor level (dungeon raised floor, the outdoor elevation); a ledge is level 1 or more
function c1Lvl(){ const p=player; try{ return AREA?(AREA.tri?Math.max(0,dunH(tCell(p.x,p.y))):0):elevLvl(p.x,p.y); }catch(e){ return 0; } }
function c1Up(){ return airborne()||(typeof P2!=='undefined'&&P2.mv&&P2.mv.kind==='hang'); }
function c1Hurt(e){ return e.lastHit!=null?clamp(1-((G?G.time:0)-e.lastHit)/0.28,0,1):0; }
function c1Dark(x,y){ if(typeof p2LitAt==='function'&&p2LitAt(x,y,10)) return false; return AREA?(AREA.dark||0)>0.3:isNight(); }
function c1Say(e,who,line,gap){ bossSay(e,who,line,gap||7); }
function c1Tip(id,title,text){ if(G.flags['c1tip_'+id]) return; G.flags['c1tip_'+id]=1; try{ mvTip(title,text,7,'c1_'+id); }catch(err){ setBanner(title,text,3); } }
function c1Txt(e,t,col,sz){ ftext(e.x,(e._t3top!=null?e._t3top:e.y-e.r)-14,t,col||'#ffe066',sz||15); }
function c1Puff(x,y,col,n){ emit(x,y,n||16,{col:col||'190,180,210',glow:false,smin:30,smax:150,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:6,drag:1}); }
function c1Stun(e,t,txt){ e.stun=Math.max(e.stun||0,t); e.tele=null; e.mv=null; e.blocking=false; if(txt) c1Txt(e,txt,'#ffe066',16); shake(6); }

// ---------- 1. the player side: hush (no fire), blinding dust (the screen dims), and the damage log for tests
{ const base=updatePlayer; updatePlayer=function(dt,inp){
    if(G&&G.mode==='story'){ if(C1.hushT>0){ C1.hushT-=dt; if(inp&&inp.fire){ inp=Object.assign({},inp,{fire:false}); if(!(C1.hushSay>G.time)){ C1.hushSay=G.time+1.6; ftext(player.x,player.y-40,S('Hushed! No fire for a moment.','Shh! No fire yet.'),'#d8c0ff',13); } } }
      if(C1.blindT>0) C1.blindT-=dt; }
    return base(dt,inp); }; }
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){ const h0=player?player.hp:0, r=base(amt,sx,sy,kb); if(r&&player){ const d=Math.max(0,h0-player.hp); C1.dmg+=d; C1.hits++;
      // (for the tests: which foe was closest to where the hit came from)
      let src='other', bd=260*260; if(sx!=null) for(const q of G.enemies){ if(q.dead) continue; const dd=dist2(q.x,q.y,sx,sy); if(dd<bd){ bd=dd; src=q.type; } } C1.bySrc[src]=(C1.bySrc[src]||0)+d; } return r; }; }
{ const base=drawVignette; drawVignette=function(){ base();
    try{ if(!G||scene==='menu') return;
      if(C1.blindT>0){ const a=clamp(C1.blindT/2,0,1)*0.62; ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0); const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.12,W/2,H/2,Math.max(W,H)*0.7); g.addColorStop(0,`rgba(40,36,60,${a*0.55})`); g.addColorStop(1,`rgba(18,14,30,${a})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.restore(); }
    }catch(err){} }; }
// a little violet "shh" over Ash while he is hushed (world space, after the figures)
{ const base=drawMarkers; drawMarkers=function(t){ base(t);
    if(!G||C1.hushT<=0||!player||player.dead) return; const p=player, y=p.y-46+Math.sin(t*5)*2;
    ctx.save(); ctx.globalAlpha=clamp(C1.hushT,0,1); ctx.fillStyle='rgba(60,40,90,.8)'; ctx.beginPath(); ctx.arc(p.x,y,9,0,TAU); ctx.fill(); ctx.strokeStyle='#d8c0ff'; ctx.lineWidth=1.6; ctx.stroke();
    ctx.strokeStyle='#ffb070'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p.x-5,y+4); ctx.quadraticCurveTo(p.x,y-7,p.x+5,y+4); ctx.stroke(); ctx.strokeStyle='#d8c0ff'; ctx.beginPath(); ctx.moveTo(p.x-6,y-6); ctx.lineTo(p.x+6,y+6); ctx.stroke(); ctx.restore(); }; }

// ---------- 2. ground marks and lingering zones (fight zones from e8: drawn under everyone, cleared when a fight ends)
// c1mark: a telegraph at any spot {shape:'circle'|'line'|'donut'|'cone', x,y,r,(r1,r2),ang,len,w,half,dur,col,fire(z)}
FZK.c1mark={
  tick(z,dt){ if(z.follow){ const f=z.follow(z); if(f){ z.x=f.x; z.y=f.y; } } if(z.t>=z.dur&&!z.fired){ z.fired=true; z.done=true; if(z.fire) try{ z.fire(z); }catch(err){ console.error(err); } } },
  drawG(z){ const k=clamp(z.t/z.dur,0,1), col=z.col||C1COL.orange; ctx.save();
    if(z.shape==='line'){ ctx.translate(z.x,z.y); ctx.rotate(z.ang||0); const L=z.len, w=z.w||30;
      ctx.fillStyle=`rgba(${col},${0.12+0.12*k})`; ctx.fillRect(0,-w/2,L,w); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.strokeRect(0,-w/2,L,w); ctx.fillStyle=`rgba(${col},0.28)`; ctx.fillRect(0,-w/2,L*k,w); }
    else if(z.shape==='donut'){ ctx.fillStyle=`rgba(${col},${0.12+0.12*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r2,0,TAU); ctx.arc(z.x,z.y,z.r1,0,TAU,true); ctx.fill(); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(z.x,z.y,z.r2,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(z.x,z.y,z.r1,0,TAU); ctx.stroke(); }
    else if(z.shape==='cone'){ ctx.translate(z.x,z.y); ctx.rotate(z.ang||0); ctx.fillStyle=`rgba(${col},${0.12+0.12*k})`; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,z.len,-z.half,z.half); ctx.closePath(); ctx.fill(); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2; ctx.stroke(); }
    else { ctx.fillStyle=`rgba(${col},${0.12+0.12*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(${col},${0.5+0.4*k})`; ctx.lineWidth=2.2; ctx.stroke(); ctx.fillStyle=`rgba(${col},0.24)`; ctx.beginPath(); ctx.arc(z.x,z.y,Math.max(1,z.r*k),0,TAU); ctx.fill();
      if(z.sparkle){ for(let i=0;i<5;i++){ const a=i*1.26+G.time*1.4, rr=z.r*(0.3+0.5*((i*0.37+G.time*0.5)%1)), x=z.x+Math.cos(a)*rr, y=z.y+Math.sin(a)*rr*0.8, q=1.5+k*1.6; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(x,y-q*2); ctx.lineTo(x+q*0.5,y); ctx.lineTo(x,y+q*2); ctx.lineTo(x-q*0.5,y); ctx.closePath(); ctx.fill(); } } }
    ctx.restore(); }
};
function c1Mark(o){ return fzAdd('c1mark',Object.assign({dur:0.8,r:46,col:C1COL.orange},o)); }
// c1lob: an orb thrown in an arc from (x0,y0) to (x,y), its landing spot marked from the start; land(z) when it lands
FZK.c1lob={
  tick(z,dt){ if(z.t>=z.dur&&!z.fired){ z.fired=true; z.done=true; if(z.land) try{ z.land(z); }catch(err){ console.error(err); } } },
  drawG(z){ const k=clamp(z.t/z.dur,0,1), col=z.col||C1COL.silver; ctx.save();
    ctx.fillStyle=`rgba(${col},${0.12+0.14*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,TAU); ctx.fill(); ctx.setLineDash([6,5]); ctx.lineDashOffset=-G.time*30; ctx.strokeStyle=`rgba(${col},${0.6+0.3*k})`; ctx.lineWidth=2; ctx.stroke(); ctx.setLineDash([]);
    for(let i=0;i<4;i++){ const a=i*1.57+G.time*2, x=z.x+Math.cos(a)*z.r*0.55, y=z.y+Math.sin(a)*z.r*0.45, q=1.6+1.4*Math.sin(G.time*8+i); ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.moveTo(x,y-q*2); ctx.lineTo(x+q*0.5,y); ctx.lineTo(x,y+q*2); ctx.lineTo(x-q*0.5,y); ctx.closePath(); ctx.fill(); }
    ctx.restore(); },
  tall(z,list){ if(z.t<(z.wait||0)) return; if(!z.it) z.it={flying:true,draw:()=>{ const u=clamp((z.t-(z.wait||0))/Math.max(0.05,z.dur-(z.wait||0)),0,1), x=lerp(z.x0,z.x,u), y=lerp(z.y0,z.y,u), h=(z.h||90)*4*u*(1-u)+12;
      ctx.save(); ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x,y,7,3.5,0,0,TAU); ctx.fill(); ctx.globalCompositeOperation='lighter'; ctx.drawImage(foGlowSpr(z.col||C1COL.silver),x-14,y-h-14,28,28); ctx.globalCompositeOperation='source-over';
      ctx.fillStyle=z.ball||'#e8e4f4'; ctx.strokeStyle=LOOK.sb?SBC.outline:'#3a3048'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(x,y-h,z.br||6,0,TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }};
    const u=clamp((z.t-(z.wait||0))/Math.max(0.05,z.dur-(z.wait||0)),0,1); z.it.x=lerp(z.x0,z.x,u); z.it.y=lerp(z.y0,z.y,u)+1; list.push(z.it); }
};
function c1Lob(e,x,y,o){ return fzAdd('c1lob',Object.assign({x0:e.x,y0:e.y,x,y,r:48,dur:0.9,col:C1COL.silver},o)); }
// c1cloud: a lingering cloud {x,y,r,life,slow (seconds of slow while inside), dmg (per 0.6 s), col}
FZK.c1cloud={
  tick(z,dt){ const p=player; if(p.dead||c1Up()||dist(p.x,p.y,z.x,z.y)>z.r) return; if(z.slow) p.slowT=Math.max(p.slowT||0,z.slow); if(z.dmg){ z.tk=(z.tk||0)-dt; if(z.tk<=0){ z.tk=0.6; hurtPlayer(z.dmg,z.x,z.y,0); } } if(z.onIn) z.onIn(z,dt); },
  drawG(z){ const a=clamp(Math.min(z.t/0.3,(z.life-z.t)/0.5),0,1), col=z.col||'200,200,225'; if(a<=0) return; ctx.save(); ctx.globalAlpha=a;
    for(let i=0;i<7;i++){ const ang=i*0.9+z.t*0.4*(i%2?1:-1), rr=z.r*(0.25+0.45*((i*0.31)%1)), x=z.x+Math.cos(ang)*rr, y=z.y+Math.sin(ang)*rr*0.7, s=z.r*(0.42+0.12*Math.sin(z.t*2+i));
      ctx.fillStyle=`rgba(${col},.32)`; ctx.beginPath(); ctx.ellipse(x,y,s,s*0.7,0,0,TAU); ctx.fill(); }
    ctx.strokeStyle=`rgba(${col},.55)`; ctx.lineWidth=1.5; ctx.setLineDash([4,6]); ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r,z.r*0.8,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    for(let i=0;i<4;i++){ const x=z.x+Math.cos(i*1.7+z.t)*z.r*0.6, y=z.y+Math.sin(i*2.3+z.t*1.3)*z.r*0.45, q=1.2+Math.sin(z.t*6+i)*0.8; if(q>0){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.fillRect(x-q/2,y-q*1.5,q,q*3); ctx.fillRect(x-q*1.5,y-q/2,q*3,q); } }
    ctx.restore(); }
};
// c1hush: a violet ring on the ground; inside it Ash cannot breathe fire (3 s after he steps out)
FZK.c1hush={
  tick(z,dt){ const p=player; if(z.t<z.wait) return; if(!p.dead&&dist(p.x,p.y,z.x,z.y)<z.r){ C1.hushT=Math.max(C1.hushT,z.hold||3); if(!G.flags.c1tip_hush) c1Tip('hush',S('A hush circle','Hush circle!'),S('Inside the violet ring your fire goes quiet. Step out of it, or fight with your weapon for now.','No fire in the violet ring. Step out!')); } },
  drawG(z){ const on=z.t>=z.wait, a=clamp(Math.min((z.life-z.t)/0.5,1),0,1), k=on?1:clamp(z.t/z.wait,0,1); ctx.save(); ctx.globalAlpha=a;
    ctx.fillStyle=`rgba(120,70,190,${on?0.2:0.08+0.1*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,TAU); ctx.fill();
    ctx.strokeStyle=`rgba(200,160,255,${0.5+0.4*k})`; ctx.lineWidth=on?3:2; ctx.setLineDash(on?[]:[7,6]); ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    if(on){ ctx.strokeStyle='rgba(225,200,255,.55)'; ctx.lineWidth=1.3; for(let i=0;i<6;i++){ const ang=i*TAU/6+z.t*0.6, x=z.x+Math.cos(ang)*z.r*0.7, y=z.y+Math.sin(ang)*z.r*0.7; ctx.beginPath(); ctx.arc(x,y,5,0,TAU); ctx.moveTo(x-4,y-4); ctx.lineTo(x+4,y+4); ctx.stroke(); } }
    ctx.restore(); }
};
// c1wave: a shockwave ring along the floor. Jumping clears it, and so does standing on a ledge (a level up)
FZK.c1wave={
  tick(z,dt){ if(z.t<(z.wait||0)) return; z.rad=(z.rad||z.r0||20)+z.spd*dt; if(z.rad>=z.max){ z.done=true; return; } const p=player;
    if(!z.hitP&&!p.dead&&!c1Up()&&(z.ledge===false||c1Lvl()<=0)){ const d=dist(z.x,z.y,p.x,p.y); if(Math.abs(d-z.rad)<z.thick/2+p.r*0.6){ z.hitP=true; hurtPlayer(z.dmg,z.x,z.y,280); } } },
  drawG(z){ if(z.t<(z.wait||0)||!z.rad) return; const a=clamp(1-z.rad/z.max,0,1)*0.9+0.1; ctx.save(); ctx.strokeStyle=`rgba(${z.col||C1COL.orange},${a})`; ctx.lineWidth=z.thick*0.55; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.rad,z.rad*0.86,0,0,TAU); ctx.stroke();
    ctx.strokeStyle=`rgba(255,240,200,${a*0.8})`; ctx.lineWidth=2; ctx.stroke(); ctx.restore(); }
};
function c1Wave(x,y,o){ return fzAdd('c1wave',Object.assign({x,y,r0:20,spd:300,max:420,thick:18,dmg:10},o)); }

// ---------- 3. death: every Act II foe topples and fades for half a second (bosses use the stock corpse)
function c1Corpse(e){
  if(e.boss||!inView(e.x,e.y,120)) return;
  const c=Object.assign({},e,{dead:false,deathT:0,aggro:false,hp:e.maxHp,stun:0,tele:null,flash:0,spawnIn:0,elite:false,alpha:1});
  C1.corpses.push(c); if(C1.corpses.length>14) C1.corpses.shift();
}
{ const base=eventsForRender; eventsForRender=function(list){ base(list);
    for(const c of C1.corpses){ if(!c._it) c._it={x:c.x,y:c.y,draw:()=>{ ctx.save(); ctx.globalAlpha=clamp(1-c.deathT/0.6,0,1); drawEnemy(c); ctx.restore(); }}; c._it.y=c.y; c._it.flying=!!c.flying; list.push(c._it); }
    c1Tall(list); }; }
{ const base=updateEnemies; updateEnemies=function(dt){ base(dt); c1Frame(dt); }; }

// ---------- 4. custom moves for the kit (FM): a rolling ball that bounces, a steam charge, lobs, ground circles, cones
function c1Bounce(e,ux,uy){
  const hx=c1Solid(e.x+ux*(e.r+8),e.y), hy=c1Solid(e.x,e.y+uy*(e.r+8)); let a=ux, b=uy;
  if(hx) a=-a; if(hy) b=-b; if(!hx&&!hy){ a=-a; b=-b; }
  if(e.arena){ const A=e.arena; if(e.x<A.x0+e.r+10) a=Math.abs(a); if(e.x>A.x1-e.r-10) a=-Math.abs(a); if(e.y<A.y0+e.r+10) b=Math.abs(b); if(e.y>A.y1-e.r-10) b=-Math.abs(b); }
  return Math.atan2(b,a);
}
// roll: curl (line telegraph), then roll in a straight line, bouncing off walls `bounce` times
FM.c1roll={
  start(e,m){ const o=m.o; e.state=o.st||'curl'; e.st=fkW(o,0.4); m.b=o.bounce!=null?o.bounce:1; e.tele=newTele({shape:'line',len:o.len||300,w:o.w||e.r*2,dur:e.st,col:o.col||C1COL.red}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ if(e.st>0.15) e.face=turnTo(e.face,a,(o.track||6)*dt); e.st-=dt; if(e.st>0) return false; m.go=true; m.ang=e.face; e.tele=null; e.state=o.st2||'roll'; e.st=o.time||0.7; m.hit=false; SFX.play('roll'); return false; }
    const s=(o.spd||520)*foeDiff().spd; e.dx=Math.cos(m.ang)*s; e.dy=Math.sin(m.ang)*s; e.face=m.ang;
    if(!m.hit&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+4&&!c1Up()){ if(hurtPlayer(o.dmgN!=null?bdmg(o.dmgN):e.dmg*(o.dmg||1),e.x,e.y,o.kb||220)) m.hit=true; }
    if(foeBumped(e)&&e.st<(o.time||0.7)-0.06){ if(m.b>0){ m.b--; m.ang=c1Bounce(e,Math.cos(m.ang),Math.sin(m.ang)); e._stall=0; shake(3); SFX.play('block'); emit(e.x,e.y,8,{col:'230,200,130',smin:40,smax:140,lmin:.15,lmax:.3,zmin:1.2,zmax:2.4}); e.st=Math.max(e.st,(o.time||0.7)*0.7); if(o.onBounce) o.onBounce(e,m); } else { e.st=0; if(o.dizzy){ e.state='dizzy'; } return true; } }
    if(o.onRoll) o.onRoll(e,dt,m);
    e.st-=dt; return e.st<=0; } };
// steam charge: whistle and puffs, a red line that tracks until the last 0.2 s, then a charge; a wall or water stuns it
FM.c1charge={
  start(e,m){ const o=m.o; e.state=o.st||'chargeAim'; e.st=fkW(o,0.9); m.T0=e.st; e.tele=newTele({shape:'line',len:o.len||480,w:o.w||e.r*1.8,dur:e.st,col:o.col||C1COL.red}); m.turned=false; SFX.play('warn'); },
  tick(e,dt,d,a,m){ const o=m.o, p=player, D=foeDiff();
    if(!m.go){ if(e.st>0.2) e.face=turnTo(e.face,a,(o.track||5)*dt); e.st-=dt; e.steam=1; if(Math.random()<dt*14) emit(e.x+Math.cos(e.face+Math.PI)*e.r*0.4+rand(-6,6),e.y-e.r*1.2,1,{col:'245,245,250',glow:false,ang:-Math.PI/2,spread:0.8,smin:20,smax:70,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:8,drag:1});
      if(e.st>0) return false; m.go=true; m.hit=false; e.tele=null; e.state=o.st2||'charge'; e.st=m.T=o.time||1.0; SFX.play('dash'); return false; }
    const s=(o.spd||520)*D.spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
    if(!m.hit&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+6&&!c1Up()){ if(hurtPlayer(o.dmgN!=null?bdmg(o.dmgN):e.dmg*(o.dmg||1.2),e.x,e.y,o.kb||420)) m.hit=true; }
    if(o.turn&&!m.turned&&e.st<m.T*0.55&&d>90&&Math.abs(angDiff(e.face,a))>0.5){ m.turned=true; e.face=turnTo(e.face,a,1.2); e.tele=null; ftext(e.x,e.y-e.r-12,'!','#ff8a6a',16); }
    if(Math.random()<dt*20) emit(e.x-Math.cos(e.face)*e.r,e.y-Math.sin(e.face)*e.r,1,{col:'240,240,245',glow:false,smin:10,smax:40,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6});
    if(e.st<m.T-0.08&&(foeBumped(e)||(o.water!==false&&fkWet(e.x+Math.cos(e.face)*e.r,e.y+Math.sin(e.face)*e.r)))){ const wet=!foeBumped(e); fkWallStun(e,o.stun||1.8); e.hatchT=(o.stun||1.8)+0.1; if(wet){ c1Puff(e.x,e.y,'235,240,250',22); ftext(e.x,e.y-e.r-24,S('Fssss!','Fssss!'),'#cfeaff',14); } if(o.onStun) o.onStun(e); return true; }
    e.st-=dt; return e.st<=0; } };
// lob: throw an orb at Ash's spot (a marked landing circle from the start), land(e,x,y) when it lands
FM.c1lob={
  start(e,m){ const o=m.o; e.state=o.st||'cast'; e.st=fkW(o,0.55); m.n=o.n||1; },
  tick(e,dt,d,a,m){ const o=m.o, p=player; e.face=turnTo(e.face,a,6*dt); e.st-=dt; if(e.st>0) return false;
    for(let i=0;i<m.n;i++){ const sc=i?(o.scatter||70):0, q={x:p.x+rand(-sc,sc)+(p.vx||0)*0.2,y:p.y+rand(-sc,sc)+(p.vy||0)*0.2}; const C=c1Ctx(e); if(e.arena||C.A) c1Hold(C,q,30);
      c1Lob(e,q.x,q.y,{r:o.r||46,dur:(o.flight||0.75)*foeDiff().tele+i*0.12,col:o.col,ball:o.ball,br:o.br,h:o.h,land:z=>o.land(e,z.x,z.y,z)}); }
    SFX.play(o.sfx||'cast'); return true; } };
// a ground circle (or ring) under Ash: hush, cannon, piston
FM.c1spot={
  start(e,m){ const o=m.o; e.state=o.st||'cast'; e.st=fkW(o,0.5); m.z=null; },
  tick(e,dt,d,a,m){ const o=m.o, p=player; e.face=turnTo(e.face,a,5*dt); e.st-=dt; if(e.st>0) return false;
    o.place(e,p.x,p.y); SFX.play(o.sfx||'cast'); return true; } };
// a cone in front (silver dust, a violet stare): hit(e) runs if Ash is inside when the wind-up ends
FM.c1cone={
  start(e,m){ const o=m.o; e.state=o.st||'breathW'; e.st=fkW(o,0.8); e.tele=newTele({shape:'cone',len:o.len||230,half:o.half||0.5,dur:e.st,col:o.col||C1COL.silver}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ e.face=turnTo(e.face,a,(o.track||2.5)*dt); e.st-=dt; if(e.st>0) return false; m.go=true; e.tele=null; e.state=o.st2||'breath'; e.st=o.dur||0.45;
      const ox=e.x+Math.cos(e.face)*e.r, oy=e.y+Math.sin(e.face)*e.r; emit(ox,oy,24,{col:o.pcol||'225,225,240',glow:!!o.glow,ang:e.face,spread:o.half||0.5,smin:(o.len||230)*1.2,smax:(o.len||230)*1.7,lmin:.3,lmax:.5,zmin:3,zmax:6,grow:14,drag:1.4});
      if(inCone(ox,oy,e.face,o.len||230,o.half||0.5,p.x,p.y,p.r)&&!(typeof p2Shadowed==='function'&&p2Shadowed())){ if(o.dmg) hurtPlayer(e.dmg*o.dmg,ox,oy,60); o.hit(e); } return false; }
    e.st-=dt; return e.st<=0; } };
// swoop with a little extra: drains fire energy (dusk moths), a hook for anything else on a hit
FM.c1swoop={
  start(e,m){ const o=m.o; e.state=o.st||'aim'; e.st=fkW(o,0.25); e.tele=newTele({shape:'line',len:o.len||200,w:o.w||e.r*1.6,dur:e.st,col:o.col||C1COL.red}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ if(e.st>0.08) e.face=turnTo(e.face,a,10*dt); e.st-=dt; if(e.st>0) return false; m.go=true; m.hit=false; e.tele=null; e.state=o.st2||'swoop'; e.st=o.time||0.32; SFX.play('dash'); return false; }
    const s=(o.spd||430)*foeDiff().spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
    if(!m.hit&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+4){ if(hurtPlayer(e.dmg*(o.dmg||1),e.x,e.y,o.kb||120)){ m.hit=true; if(o.onHit) o.onHit(e); } }
    e.st-=dt; return e.st<=0; } };
Object.assign(FM_DEF,{c1roll:{recover:0.5},c1charge:{recover:0.6},c1lob:{recover:0.5},c1spot:{recover:0.45},c1cone:{recover:0.5},c1swoop:{recover:0.35}});

// ---------- 5. small drawing helpers shared by the figures
const C1OL=()=>LOOK.sb?SBC.outline:'#24160f';
function c1Eye(x,y,z,r,col,bias){ foD(x,y,z,r,col||'#ffffff',bias||0.03); foD(x+r*0.25,y,z+r*0.12,r*0.48,'#1e1420',(bias||0.03)+0.01); foD(x+r*0.3,y-r*0.22,z+r*0.45,r*0.2,'#ffffff',(bias||0.03)+0.02); }
function c1Lamp(x,y,z,r,col,a){ foD(x,y,z,r,col,0.03); foD(x+r*0.15,y-r*0.2,z+r*0.3,r*0.35,'#fff6d8',0.05); if(a>0) foGlow(x,y,z,r*4,hexRGB(col).join(','),a,true); }
// a flat wing panel from the root (x,y,z) out to span s at angle th (up from flat), length L along x, with an eye-spot
// (rounded moth outline: u runs root to tip, v is the chord offset along x, so the wing reads soft and curved)
const C1WING=[[0,0.5],[0.3,0.64],[0.62,0.62],[0.88,0.44],[1,0.14],[0.98,-0.16],[0.86,-0.42],[0.6,-0.6],[0.3,-0.62],[0.08,-0.5],[0,-0.4]];
const _c1wp=[];
function c1Wing(sd,x,y,z,span,L,th,sweep,col,edge,spot,spotCol){
  const c=Math.cos(th), s=Math.sin(th), tx=-sweep, ty=sd*span*c, tz=span*s;
  _c1wp.length=0;
  for(const [u,v] of C1WING){ const bend=Math.sin(u*Math.PI)*0.06*span; _c1wp.push(x+u*tx+v*L*(1-u*0.25), y+u*ty, z+u*tz+bend*0.3); }
  foQ(_c1wp,col,edge,-0.1);
  if(spot){ const u=0.55, mx=x+u*tx-L*0.04, my=y+u*ty, mz=z+u*tz+0.5;
    foD(mx,my,mz,spot,spotCol||'#ece4f4',0.0); foD(mx+spot*0.08,my,mz+0.1,spot*0.6,'#4a3c66',0.01); foD(mx+spot*0.2,my-spot*0.15,mz+spot*0.25,spot*0.2,'#ffffff',0.02); }
}
// 2D: a shaded ellipse with an outline (Classic look and the stand-ins)
function c1E2(x,y,rx,ry,col,rot,lw){ ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot||0,0,TAU); ctx.fill(); if(lw!==0){ ctx.strokeStyle=C1OL(); ctx.lineWidth=lw||1.6; ctx.stroke(); } }
function c1Shadow2(e,k){ ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+e.r*0.5,e.r*(k||1.1),e.r*0.45,0,0,TAU); ctx.fill(); }
function c1Eye2(x,y,r,f){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); ctx.fillStyle='#1a1018'; ctx.beginPath(); ctx.arc(x+Math.cos(f)*r*0.35,y+Math.sin(f)*r*0.35,r*0.5,0,TAU); ctx.fill(); }
// rows for __eb.foeSheet: idle, walk, wind-up, attack, hurt, death (plus any extra rows a foe adds)
// a row's `at` is how long the foe has been in that state (poses that read foSt(e) need it: the sheet starts every
// cell at 0 s otherwise)
function c1Sheet(rows){ for(const r of rows) if(r.at!=null){ const a=r.at; Object.defineProperty(r,'_sT',{get(){ return (G?G.time:0)-a; },enumerable:true}); } return rows; }
function c1Rows(w,a,extra){ const now=()=>G?G.time:0; return c1Sheet([{state:'chase',label:'idle'},{state:'chase',dx:60,label:'walk'},Object.assign({label:'windup',at:0.45},w),Object.assign({label:'attack'},a),{state:'chase',get lastHit(){ return now()-0.05; },label:'hurt'},{state:'chase',deathT:0.3,label:'death'}].concat(extra||[])); }

// ================= 6. the foes of the coast
// ---------- Tickbug: a brass cleaning beetle gone wild. Zigzags in, nips, sometimes curls up and rolls (bounces once)
defineFoe('c_tickbug',{name:'Tickbug',r:9,hp:18,speed:230,dmg:6,value:8,kbRes:1.3,dcol:'226,180,90',
  ai:FK.brain({move:'strafe',slant:1.05,stop:20,turn:10,cd:[0.45,1.0],
    pre(e,dt){ e.zz=(e.zz||0)-dt; if(e.zz<=0){ e.zz=rand(0.25,0.5); e.strafe*=-1; } },
    moves:[{k:'slash',st:'windup',st2:'strike',reach:24,half:0.8,windup:0.3,lunge:200,dmg:1,col:C1COL.white,w:3,recover:0.35},
           {k:'c1roll',min:90,max:360,every:3.5,len:300,w:22,spd:520,time:0.65,windup:0.4,bounce:1,dmg:1.3,w:2}]}),
  onDeath(e){ c1Corpse(e); emit(e.x,e.y,8,{col:'240,200,110',smin:60,smax:200,lmin:.3,lmax:.6,zmin:1.4,zmax:2.6,drag:3}); },
  draw3d:c1FigTickbug, draw2d:c1Tick2,
  sheet:c1Rows({state:'windup',st:0.12},{state:'strike'},[{state:'curl',st:0.2,label:'curl'},{state:'roll',dx:300,label:'roll'}])});
function c1FigTickbug(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/9, inS=foSt(e), face=t3Turn(e,e.face,14), fx=e.x, fy=e.y+e.r*0.45;
  const br=fl?'#ffffff':foT(e,'#e2b24e'), brD=foT(e,'#a8782e'), brL=foT(e,'#f6d68a'), iron=foT(e,'#7e8898'), dk='#5a4020';
  const sp=Math.hypot(e.dx||0,e.dy||0); e._wp=(e._wp||0)+dt*sp/(2.2*k); const mv=clamp(sp/90,0,1);
  const dead=foDeath(e), hurt=c1Hurt(e), stun=e.stun>0, ball=st==='curl'||st==='roll';
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,0,dead*Math.PI*0.85,0,0,0,dead*4); else if(stun) foSet(FOB,0,0,Math.sin(t*9)*0.16,0);
  if(ball){
    const c=st==='curl'?c1Sm(clamp(inS/0.3,0,1)):1, R=lerp(5.4,6.2,c); e._rl=(e._rl||0)+dt*(st==='roll'?sp/(R*k):1.5);
    const z=R+(st==='roll'?Math.abs(Math.sin(e._rl*0.5))*1.2:0), rl=e._rl;
    foB(0,0,z,R,br);
    for(let i=0;i<3;i++){ const a=rl+i*2.09, cx=Math.cos(a)*R, cz=Math.sin(a)*R; foN(cx,-R*0.72,z+cz,cx,R*0.72,z+cz,0.75,brD,0.02); }
    for(const sd of [-1,1]){ const a=rl+0.6; foD(Math.cos(a)*R*1.02,sd*1.6,z+Math.sin(a)*R*1.02,1.0,'#ff6a3a',0.04); }
    foEnd(z); e._t3top=foTop(fy,z+R,k); return; }
  foLow();
  for(const sd of [-1,1]) for(let i=0;i<3;i++){ const ph=e._wp+i*2.1+(sd>0?0:Math.PI), lx=3-i*3.2, o=Math.sin(ph)*1.8*mv, lift=Math.max(0,Math.cos(ph))*mv*1.4, dl=dead?3:0;
    foL(lx,sd*4.2,3.6,lx+o*0.4,sd*7.4,4.4+lift+dl,0.9,iron,0.8); foL(lx+o*0.4,sd*7.4,4.4+lift+dl,lx+o,sd*8.6,0.4+lift*0.5+dl*2,0.8,iron,0.5); }
  foUp();
  let hp=0, op=0.4, lean=0;
  if(st==='windup'){ const q=c1Sm(clamp(1-e.st/0.3,0,1)); hp=-1.6*q; op=1.5*q; lean=-0.18*q; } else if(st==='strike'){ hp=2; op=0; lean=0.22; }
  lean-=hurt*0.4; foSet(FOA,3,lean,0,0,0,0,0,-1);
  foE(-0.8,0,3.4,6.4,5.6,2.2,brD,0,0,0,-0.2);
  foE(-1,0,5.6,6.6,5.8,4.4,br);
  foN(4.4,0,8.1,-6.6,0,7.2,0.7,brD,0.06);
  for(const sd of [-1,1]) for(let i=0;i<3;i++) foD(2.4-i*3.2,sd*3.9,7.4-Math.abs(i-1)*0.4,0.42,brL,0.06);
  const kr=t*(sp>10?10:3);
  foL(-5.4,0,8.6,-7.2,0,10.8,0.7,iron); foE(-7.7,0,11.6,0.55,0.6+Math.abs(Math.cos(kr))*1.9,1.5,brL,0,0,0,0.04);
  foE(5.2+hp*0.5,0,5,3.0,3.6,2.6,iron);
  for(const sd of [-1,1]){ c1Lamp(7.7+hp*0.5,sd*1.55,5.9,1.05,stun?'#ffe066':'#ff5a3a',0.25);
    foC(7.4+hp*0.6,sd*1.3,3.8,9.9+hp,sd*(0.4+op),3.4,0.75,brD);
    foN(6.4,sd*1.2,7,8.6+hp*0.4,sd*3.6,10.4+Math.sin(t*6+sd)*0.6,0.45,dk,0.02); foD(8.6+hp*0.4,sd*3.6,10.6,0.6,brL,0.04); }
  foEnd(6); e._t3top=foTop(fy,12,k);
}
function c1Tick2(e,fl){
  const x=e.x, y=e.y, r=e.r, f=e.face, br=fl?'#fff':'#e2b24e', ball=e.state==='curl'||e.state==='roll';
  ctx.save(); c1Shadow2(e,1); ctx.translate(x,y);
  if(ball){ c1E2(0,-2,r*0.8,r*0.8,br); ctx.strokeStyle='#a8782e'; ctx.lineWidth=1.2; const a=(e._rl2=(e._rl2||0)+0.3); for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(0,-2,r*0.8*Math.abs(Math.cos(a+i)),r*0.8,f,0,TAU); ctx.stroke(); } ctx.restore(); return; }
  ctx.rotate(f); ctx.strokeStyle='#5a6070'; ctx.lineWidth=1.4; const w=Math.sin((e.t||0)*20)*(Math.hypot(e.dx||0,e.dy||0)>5?2:0);
  for(const s of [-1,1]) for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(3-i*3,s*3); ctx.lineTo(3-i*3+(i%2?w:-w),s*(r+2)); ctx.stroke(); }
  c1E2(-1,0,r*0.85,r*0.72,br); ctx.strokeStyle='#a8782e'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-r*0.8,0); ctx.lineTo(r*0.5,0); ctx.stroke();
  c1E2(r*0.62,0,3.4,3.8,'#7e8898',0,1.2); ctx.fillStyle='#ff5a3a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(r*0.8,s*1.6,1.2,0,TAU); ctx.fill(); }
  ctx.fillStyle='#f6d68a'; ctx.fillRect(-r-2,-1,3,2); ctx.restore();
}

// ---------- Steam Ram: a brass goat boiler. Builds steam (whistle, red line), charges; a wall or water stuns it with
// its boiler hatch open (gold: x2, the hammer makes it pop). Beaten while stunned it drops a spring core.
// As a cave room boss (boss:['c_ram','The Foreman']) it wears a cap, whistles for tickbugs below half health.
function c1Belt(e){ try{ return AREA&&AREA.cave&&typeof DTY!=='undefined'&&AREA.cave.typ[tCell(e.x,e.y)]===DTY.belt; }catch(err){ return false; } }
defineFoe('c_ram',{name:'Steam Ram',r:18,hp:90,speed:80,dmg:15,value:30,kbRes:0.3,dcol:'210,160,80',
  ai:FK.brain({move:'approach',stop:64,turn:2.4,cd:[0.8,1.5],recoverMove:0.2,
    pre(e,dt,d,a){ if(e.hatchT>0) e.hatchT-=dt; if(e.caveBoss&&!e.foreman) e.foreman=true;
      if(e.foreman&&!e.whistled&&e.hp<e.maxHp*0.5&&e.state==='chase'){ e.whistled=true; e.state='summon'; e.st=0.8; SFX.play('warn'); c1Txt(e,S('TWEEEET!','TWEET!'),'#fff4c0',16);
        const L=fkLevel(e,{}); for(let i=0;i<3;i++){ const s=spotNear(e.x,e.y,80,170); spawnRune('c_tickbug',s.x,s.y,{level:L,aggro:true},0.9+i*0.15); } return true; }
      e.beltK=c1Belt(e)?2:1; },
    moves:[{k:'c1charge',min:120,max:560,len:520,windup:0.9,spd:520,time:1.0,stun:1.8,turn:'hard',dmg:1.2,w:3},
           {k:'slash',reach:40,half:0.9,windup:0.5,lunge:150,dmg:1,col:C1COL.white,w:2}]}),
  onHurt(e,amt,o){ if(!(e.hatchT>0)) return; const h=foeHit(e,o);
    if(h.src==='hammer'&&!e.popped){ e.popped=true; e.hatchT+=1.5; e.stun=Math.max(e.stun,e.hatchT); c1Txt(e,S('POP!','POP!'),'#ffd27a',19); shake(8); SFX.play('boom'); c1Puff(e.x,e.y-10,'240,240,245',26); return amt*3; }
    if(!(e._goldT>G.time)){ e._goldT=G.time+0.8; c1Txt(e,S('Boiler open!','Hatch open!'),'#ffd27a',13); } return amt*2; },
  onDeath(e){ c1Corpse(e); if(e.hatchT>0) c1SpringDrop(e); },
  draw3d:c1FigRam, draw2d:c1Ram2,
  sheet:c1Rows({state:'chargeAim',st:0.4},{state:'charge',dx:400},[{state:'chase',stun:1,hatchT:1,label:'stunned'},{state:'chase',foreman:true,label:'foreman'}])});
// a spring core for Ingrid's Longer Tail (c_tail); the quest helper can take over with C1.hook.spring(e)
function c1SpringDrop(e){ if(C1.hook.spring){ C1.hook.spring(e); return; } const Q=G.quests&&G.quests.c_tail; if(Q&&!Q.done){ giveItems({c_spring:1},true); ftext(e.x,e.y-30,S('A spring core!','A spring!'),'#ffe6a0',15); SFX.play('pickup'); } }
{ const base=FM.c1charge.tick; FM.c1charge.tick=function(e,dt,d,a,m){ const r=base(e,dt,d,a,m); if(m.go&&e.beltK>1&&!r){ e.dx*=e.beltK; e.dy*=e.beltK; } return r; }; }
function c1FigRam(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/18, face=t3Turn(e,e.face,st==='charge'?14:7), fx=e.x, fy=e.y+e.r*0.45;
  const br=fl?'#ffffff':foT(e,'#d8a448'), brD=foT(e,'#a07030'), cop=foT(e,'#d27a4a'), copD=foT(e,'#9a5030'), iron=foT(e,'#788292'), ironD='#566070';
  const sp=Math.hypot(e.dx||0,e.dy||0), mv=clamp(sp/70,0,1), dead=foDeath(e), hurt=c1Hurt(e), stun=e.stun>0, open=e.hatchT>0;
  e._wp=(e._wp||0)+dt*sp/(st==='charge'?4.2*k:3.2*k);
  let hp=0, crouch=0, rear=0;
  if(st==='chargeAim'){ const q=c1Sm(clamp(1-e.st/0.9,0,1)); hp=0.35*q; crouch=1.6*q; rear=Math.sin(t*16)*q; }
  else if(st==='charge'){ hp=0.45; crouch=0.8; }
  else if(st==='windup'){ hp=-0.45*c1Sm(clamp(1-e.st/0.5,0,1)); } else if(st==='strike'){ hp=0.5; }
  if(stun){ crouch=3.4; hp=0.3; }
  const P=foEase(e,'_frm',foTg(hp,crouch),dt,st==='charge'||st==='strike'?20:10); hp=P[0]; crouch=P[1];
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,0,dead*1.4,0,0,0,-dead*2); else if(stun) foSet(FOB,0,0,Math.sin(t*5)*0.05,0);
  foLow();
  for(const [lx,sd,ph] of [[8,-1,0],[8,1,Math.PI],[-8,-1,Math.PI],[-8,1,0]]){
    const g=e._wp+ph, o=Math.sin(g)*3.6*mv+(lx<0?rear*1.2:0), lift=Math.max(0,Math.cos(g))*mv*2.6, kz=10-crouch*0.7, sit=stun&&lx<0;
    foL(lx,sd*6,kz,lx+o*0.6,sd*6.6,sit?2:5.4+lift,1.9,iron,1.5); foL(lx+o*0.6,sd*6.6,sit?2:5.4+lift,lx+o+(sit?-4:0),sd*6.8,1+lift*0.4,1.5,iron,1.3); foE(lx+o+(sit?-4:0)+0.8,sd*6.8,0.9+lift*0.4,2.2,1.6,1,ironD); }
  foUp(); foSet(FOA,10,-hurt*0.2,0,0,0,0,-crouch,0);
  const bz=15;
  foE(0,0,bz,13,8.6,8,br);
  for(const xx of [-8,0,8]){ foN(xx,-8.4,bz+1.6,xx,8.4,bz+1.6,0.9,brD,0.02); }
  for(const sd of [-1,1]) for(let i=0;i<4;i++) foD(-9+i*6,sd*8.2,bz+3.6,0.6,'#fff0c0',0.05);
  // the stack and its puffs, a pressure gauge
  foY(-5,0,bz+6.6,2.6,3.2,5.4,ironD,'#3e4652'); foY(-5,0,bz+11.6,3.4,3.4,1.2,iron,'#3e4652');
  for(const sd of [-1,1]){ foD(-1,sd*8.7,bz+0.4,2.2,'#f4f0e0',0.04); const na=t*(open?9:2)+sd; foN(-1,sd*8.9,bz+0.4,-1+Math.cos(na)*1.6,sd*8.95,bz+0.4+Math.sin(na)*1.6,0.45,'#c8322a',0.06); }
  // the boiler hatch at the chest: shut, or swung open and glowing gold
  if(open){ foD(12.6,0,bz-0.4,4.4,'#ffcf5a',0.05); foD(12.8,0,bz-0.4,2.8,'#fff4c0',0.06); foGlow(13,0,bz,10,'255,200,90',0.75,false); foQ([12.4,-4.2,bz+3.6, 12.4,-4.2,bz-4.4, 14,-9.4,bz-4.2, 14,-9.4,bz+3.4],brD,'#5a3a14',0.05); }
  else{ foD(12.6,0,bz-0.4,4.2,brD,0.04); foD(12.8,-1.6,bz+0.8,1.3,'#ffb050',0.05); }
  // head: a brass goat head with curly copper horns, red lamp eyes, steam from the ears
  foSet(FOA,bz+2,-hurt*0.2,0,0,0,0,-crouch,8);
  foL(9,0,bz+3,13,0,bz+7,4.8,brD,4);
  foE(16,0,bz+8-hp*4,6.8,6,5.6,br,hp);
  foE(21,0,bz+5.6-hp*5.4,4.2,4,3.2,brD,hp+0.2);
  foD(23.6,0,bz+6-hp*5.6,1.2,'#3a2a14',0.06);
  for(const sd of [-1,1]){
    c1Lamp(19.6,sd*3.4,bz+9.6-hp*5,1.7,stun?'#ffe066':'#ff6a3a',0.25);
    let ax=15, ay=sd*4.2, az=bz+12.4-hp*4;
    for(let i=0;i<5;i++){ const a=i*1.15, rr=5.6-i*0.6, bx=12.4+Math.cos(a)*rr-i*0.6, by=sd*(6+i*1.0), bz2=bz+12.4-hp*4+Math.sin(a)*rr; foL(ax,ay,az,bx,by,bz2,2.3-i*0.3,i%2?copD:cop,2-i*0.3); ax=bx; ay=by; az=bz2; }
    foC(15.4,sd*5.4,bz+11.6-hp*4,13.6,sd*9.4,bz+13.6-hp*4,1.4,brD);
  }
  if(e.foreman||e.caveBoss){ foY(15,0,bz+12.6-hp*4,5.2,5,2.8,'#3a5a8a','#2a3e62',0.06); foE(19.6,0,bz+12.8-hp*4,3.6,5,0.6,'#3a5a8a',0,0,0,0.07); foD(17.8,0,bz+14.2-hp*4,1.2,'#ffcf5a',0.08); foL(19,2.6,bz+4.4-hp*5,21.6,4.4,bz+3.6-hp*5,0.8,'#c8ccd8'); }
  foEnd(14); e._t3top=foTop(fy,bz+14,k);
  if(open&&Math.random()<0.5&&G.time) emit(e.x+rand(-6,6),e.y-e.r*1.4,1,{col:'245,245,250',glow:false,ang:-Math.PI/2,spread:0.7,smin:20,smax:60,lmin:.4,lmax:.9,zmin:3,zmax:6,grow:8,drag:1});
}
function c1Ram2(e,fl){
  const x=e.x, y=e.y, r=e.r, f=e.face, br=fl?'#fff':'#d8a448';
  ctx.save(); c1Shadow2(e,1.2); ctx.translate(x,y); ctx.rotate(f);
  ctx.fillStyle='#566070'; for(const [lx,ly] of [[8,-7],[8,7],[-8,-7],[-8,7]]){ ctx.beginPath(); ctx.arc(lx,ly,3,0,TAU); ctx.fill(); }
  c1E2(0,0,r*0.78,r*0.52,br); ctx.strokeStyle='#a07030'; ctx.lineWidth=1.2; for(const xx of [-7,0,7]){ ctx.beginPath(); ctx.moveTo(xx,-r*0.5); ctx.lineTo(xx,r*0.5); ctx.stroke(); }
  c1E2(-5,0,3,3,'#566070',0,1);
  c1E2(r*0.82,0,5.6,5,br,0,1.4); ctx.strokeStyle='#d27a4a'; ctx.lineWidth=2.4; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(r*0.7,s*7,4,s>0?0:Math.PI,s>0?Math.PI*1.6:Math.PI*2.6); ctx.stroke(); }
  ctx.fillStyle=e.stun>0?'#ffe066':'#ff6a3a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(r*0.98,s*2.4,1.4,0,TAU); ctx.fill(); }
  if(e.hatchT>0){ ctx.fillStyle='#ffcf5a'; ctx.beginPath(); ctx.arc(r*0.45,0,4,0,TAU); ctx.fill(); }
  if(e.foreman||e.caveBoss){ c1E2(r*0.82,0,4,4.4,'#3a5a8a',0,1); }
  ctx.restore();
}

// ---------- Husher: a moth cultist in a gray robe. Keeps away, lobs sleep dust (a silver mark, then a slowing cloud);
// below half health it draws a hush circle (violet: no fire inside). Fire near it while it casts makes it flinch.
function c1DustBurst(e,x,y){
  const p=player, r=52; emit(x,y,22,{col:'220,220,240',smin:40,smax:160,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:8,drag:2}); SFX.play('pop');
  if(!p.dead&&!c1Up()&&dist(x,y,p.x,p.y)<r+p.r*0.5){ hurtPlayer(e.dmg*0.7,x,y,40); p.slowT=Math.max(p.slowT||0,2); ftext(p.x,p.y-36,S('Sleepy dust! Slowed.','Sleepy! Slow.'),'#d8d8f4',12); }
  fzAdd('c1cloud',{x,y,r:56,life:2.4,slow:0.25,col:'205,205,230'});
}
defineFoe('c_husher',{name:'Husher',r:12,hp:34,speed:90,dmg:9,value:18,dcol:'190,185,210',
  ai:FK.brain({move:'kite',near:220,far:340,turn:6,cd:[1.5,2.5],
    pre(e,dt,d,a){ if(e.c1yield){ e.dx=e.dy=0; e.state='flinch'; e.st=1; if(d<260&&!e.yielded){ e.yielded=true; c1Txt(e,S('We give up! A letter for you...','We give up!'),'#e8e0ff',13); if(C1.hook.husherYield) C1.hook.husherYield(e); } return true; }
      if((e.state==='cast'||e.state==='summon')&&inBreath(e.x,e.y,e.r+14)){ fkAbort(e); e.state='flinch'; e.st=0.7; c1Txt(e,S('Eek! Fire!','Eek!'),'#ffb070',13); return true; } },
    moves:[{k:'c1lob',st:'cast',windup:0.55,flight:0.75,r:52,col:C1COL.silver,min:70,w:3,land:(e,x,y)=>c1DustBurst(e,x,y)},
           {k:'c1spot',st:'summon',windup:0.45,every:7,w:2.5,if:e=>e.hp<e.maxHp*0.5,place:(e,x,y)=>{ fzAdd('c1hush',{x,y,r:72,wait:0.9*foeDiff().tele,life:4.6,hold:3}); }},
           {k:'slash',reach:30,windup:0.45,dmg:0.8,col:C1COL.white,w:1}]}),
  init(e){ if(e.camp&&/cc10/.test(String(e.camp.id||''))&&G.choices&&G.choices.morrow==='free') e.c1yield=true; },
  onDeath(e){ c1Corpse(e); },
  draw3d:c1FigHusher, draw2d:c1Hush2,
  sheet:c1Rows({state:'cast',st:0.3,label:'dust windup'},{state:'summon',st:0.2,at:0.45,label:'hush circle'},[{state:'flinch',st:0.4,label:'flinch'}])});
function c1FigHusher(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/12, face=t3Turn(e,e.face,10), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const robe=fl?'#ffffff':foT(e,'#7c7898'), robeD=foT(e,'#58546f'), wing=foT(e,'#dcd6ec'), wingD=foT(e,'#9a94b4'), mask=foT(e,'#fbf8ff'), maskD='#4a3e62';
  const mv=foWalk(e,dt,4.4*k), w=e._wp||0, dead=foDeath(e), hurt=c1Hurt(e);
  let arm=0, lift=0, glow=0, flinch=0, col='220,220,255';
  if(st==='cast'){ const q=c1Sm(clamp(inS/0.5,0,1)); arm=q; glow=q; }
  else if(st==='summon'){ const q=c1Sm(clamp(inS/0.45,0,1)); arm=q*1.2; lift=q; glow=q; col='190,120,255'; }
  else if(st==='flinch'){ flinch=1; }
  else if(st==='windup'){ arm=0.6; } else if(st==='strike'){ arm=-0.3; }
  const P=foEase(e,'_fhu',foTg(arm,lift,flinch),dt,12); arm=P[0]; lift=P[1]; flinch=P[2];
  const sw=Math.sin(w)*mv, bob=Math.abs(Math.cos(w))*mv*0.8;
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,-dead*1.3,0,0,0,0,-dead*3);
  foSet(FOA,10,-0.25*flinch-hurt*0.25+0.08*mv,0,0,0,0,bob);
  // robe: a wide bell, dark hem, feet peeking
  foLow(); for(const sd of [-1,1]) foE(1+sw*sd*2,sd*2.4,1,2.4,1.6,1.2,robeD); foUp();
  foY(0,0,0,7.6,4.6,15,robe,robeD);
  foY(0,0,0,7.7,7.5,1.6,robeD,null,0.01);
  // moth-wing sleeves: arms with wide drooping wing flaps; they lift and spread when it casts
  for(const sd of [-1,1]){
    const ax=2+arm*4-flinch*1, az=12+arm*3+lift*3, ay=sd*(7.4+arm*2.4), hx=5+arm*4-flinch*2, hy=sd*(4.6+arm*1.6-flinch*2.4), hz=9+arm*6+flinch*6;
    foL(0,sd*4.2,13.4,ax,ay,az,1.9,robe,1.7); foL(ax,ay,az,hx,hy,hz,1.6,robe,1.4); foB(hx+0.4,hy,hz,1.4,mask);
    foQ([0,sd*4.4,13.8, ax,ay,az+0.6, ax-2,sd*(9.4+arm*4),az-6-arm*2+lift*4, -3,sd*6.4,6.6],wing,wingD,-0.15);
    foD(ax-1.4,sd*(7.8+arm*3),az-3.4+lift*2,1.3,'#f6f2fa',-0.1); foD(ax-1.3,sd*(7.9+arm*3),az-3.3+lift*2,0.65,'#6a5a88',-0.09);
  }
  // hood and the pale moth mask (folded wings, two dark eye holes, feathery antennae)
  foE(0.4,0,17.6,4.6,4.8,4.6,robe); foC(-1.4,0,20.6,-4,0,24.6,2.4,robeD);
  for(const sd of [-1,1]){
    foQ([5.9,0,21, 6.3,sd*2.6,21.8, 6.1,sd*5.4,20.4, 5.7,sd*5.8,17.4, 5.5,sd*4.4,14.6, 5.9,sd*2,14.4, 6.2,0,15.6],mask,maskD,0.06,true);
    foD(6.4,sd*3.8,18.6,1.2,'#b8acd8',0.07);
    foD(6.6,sd*1.9,18,1.2,flinch>0.5?'#ffe066':maskD,0.08); foD(6.8,sd*1.6,18.4,0.4,'#ffffff',0.09);
    foN(6,sd*1,21,7.6,sd*3.4,24.8,0.5,maskD,0.07); foN(7,sd*2.4,23.1,8,sd*1.4,23.7,0.38,maskD,0.07); }
  if(glow>0.05) foGlow(7+arm*3,0,12+arm*5+lift*3,9*glow,col,0.85*glow,false);
  foEnd(12); e._t3top=foTop(fy,25,k);
}
function c1Hush2(e,fl){
  const x=e.x, y=e.y, r=e.r, f=e.face, robe=fl?'#fff':'#8e8ca6', cast=e.state==='cast'||e.state==='summon';
  ctx.save(); c1Shadow2(e,1); ctx.translate(x,y); ctx.rotate(f);
  ctx.fillStyle='#b4b0c8'; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(0,s*4); ctx.lineTo(cast?4:-4,s*(r+7)); ctx.lineTo(-8,s*(r+2)); ctx.closePath(); ctx.fill(); }
  c1E2(0,0,r,r*0.9,robe); c1E2(r*0.45,0,4.5,5.5,'#eee8f2',0,1.2); ctx.fillStyle='#5a4e70'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(r*0.6,s*2,1.3,0,TAU); ctx.fill(); }
  if(cast){ ctx.globalCompositeOperation='lighter'; ctx.fillStyle=e.state==='summon'?'rgba(190,120,255,.6)':'rgba(220,220,255,.6)'; ctx.beginPath(); ctx.arc(r+4,0,5,0,TAU); ctx.fill(); }
  ctx.restore();
}

// ---------- Tin Watchman: a tall clockwork guard with a halberd and a spinning gear shield. Blocks from the front and
// sends arrows back (not on Easy). Sweep, short lunge, then a slow recover with the shield down. Hit it from behind;
// the hammer breaks its guard; the Chain Whip or the Reel-In yanks the shield away for 8 s.
defineFoe('c_tinman',{name:'Tin Watchman',r:17,hp:120,speed:70,dmg:14,value:34,shield:true,kbRes:0.3,dcol:'200,205,215',
  ai:FK.brain({move:'approach',stop:52,guard:true,turn:1.6,cd:[0.9,1.6],recoverMove:0.15,
    pre(e,dt){ if(e.gbT>0){ e.gbT-=dt; e.shield=false; e.blocking=false; if(e.gbT<=0){ e.shield=true; c1Txt(e,S('Shield back up!','Shield up!'),'#c9d0dc',12); } } },
    moves:[{k:'slash',reach:62,half:1.25,windup:0.6,track:1.2,lunge:190,kb:320,dmg:1,recover:1.0,col:C1COL.white,sfx:'slash3',w:3}]}),
  onHurt(e,amt,o){ const h=foeHit(e,o), front=Math.abs(angDiff(e.face,angTo(e.x,e.y,o.fx!=null?o.fx:player.x,o.fy!=null?o.fy:player.y)))<1.15, up=e.shield&&e.blocking&&front;
    if(h.src==='hammer'&&up){ e.gbT=byDiff(4,3,2.5); e.shield=false; e.blocking=false; c1Stun(e,0.6,S('GUARD BROKEN!','SHIELD OFF!')); return amt; }
    if(h.src==='whip'&&e.shield){ e.gbT=8; e.shield=false; e.blocking=false; c1Txt(e,S('Yoink! Shield gone!','Yoink!'),'#ffe0b0',14); return amt; }
    if(up&&(h.src==='arrow')&&!foeDiff().easy){ shoot(e.x+Math.cos(e.face)*e.r,e.y+Math.sin(e.face)*e.r,angTo(e.x,e.y,player.x,player.y),430,6,e.dmg*0.7,'bolt','enemy'); c1Txt(e,S('PING! It bounced back!','PING!'),'#c9d0dc',13); SFX.play('block'); return false; }
    if(h.behind) return amt*1.25; },
  onDeath(e){ c1Corpse(e); emit(e.x,e.y,14,{col:'210,215,225',smin:60,smax:220,lmin:.3,lmax:.6,zmin:1.5,zmax:3,drag:3}); },
  draw3d:c1FigTin, draw2d:c1Tin2,
  sheet:c1Rows({state:'windup',st:0.3,blocking:true,shield:true},{state:'strike',shield:true},[{state:'chase',blocking:true,shield:true,label:'guard'},{state:'recover',st:0.6,shield:true,label:'recover'},{state:'chase',gbT:3,label:'guard broken'}])});
function c1FigTin(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/17, face=t3Turn(e,e.face,6), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const tin=fl?'#ffffff':foT(e,'#c2cad6'), tinD=foT(e,'#8a94a6'), brass=foT(e,'#d8a848'), red=foT(e,'#c8423a'), wood='#8a6a42';
  const mv=foWalk(e,dt,5.2*k), w=e._wp||0, dead=foDeath(e), hurt=c1Hurt(e), guard=e.blocking&&e.shield;
  let hal=0, sh=guard?1:0.2, lean=0;
  if(st==='windup'){ hal=-c1Sm(clamp(1-e.st/0.6,0,1)); lean=-0.08*-hal; } else if(st==='strike'){ hal=1; lean=0.15; } else if(st==='recover'){ hal=0.6*clamp(e.st/1,0,1); sh=0; lean=0.05; }
  const P=foEase(e,'_ftn',foTg(hal,sh,lean),dt,st==='strike'?24:10); hal=P[0]; sh=P[1]; lean=P[2];
  const sw=Math.sin(w)*mv, bob=Math.abs(Math.cos(w))*mv*0.9;
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,-dead*1.4,0.2*dead,0,0,0,-dead*2);
  foLow();
  for(const sd of [-1,1]){ const o=sw*sd*3.4; foL(o*0.3,sd*3.6,11,o,sd*3.8,3,2.4,tinD,2.1); foE(o+1,sd*3.8,1.2,3.4,2.2,1.3,'#5a6070'); }
  foUp(); foSet(FOA,11,lean-hurt*0.25,0,0,0,0,bob);
  foY(0,0,10,7,6.4,13,tin,tinD); for(const zz of [12.5,17.5,22]) foY(0,0,zz,7.15,7.15,0.9,tinD,null,0.01);
  for(let i=0;i<5;i++) foD(6.9,-3+i*1.5,15,0.45,brass,0.05);
  foB(0,0,24.6,5.4,tinD);
  // helmet with a visor slit and two lamp eyes, a plume
  foY(0,0,25,5.6,5.2,7.4,tin,tinD); foB(0,0,32.2,4.6,tin);
  foQ([5.4,-3.4,29, 5.4,3.4,29, 5.5,3.4,27.4, 5.5,-3.4,27.4],'#4a5060',null,0.04,true);
  for(const sd of [-1,1]) c1Lamp(5.7,sd*1.8,28.2,0.8,e.plume?'#c890ff':'#ffd84a',0.4);
  foL(-1,0,36,-5,0,38.6,1.6,e.plume?'#9a6ad8':red,1.1); foL(-5,0,38.6,-8.6,0,35,1.1,e.plume?'#9a6ad8':red,0.5);
  // the halberd (right hand): raised back in the wind-up, swept across in the strike
  const ha=-0.4-hal*1.3, hx=5+Math.cos(ha)*2, hy=6.8+Math.sin(ha)*4, hz=16+Math.max(0,-hal)*6;
  foL(0,6.6,21,hx,hy,hz,2,tinD,1.7);
  const dx=Math.cos(ha), dy=Math.sin(ha);
  foN(hx-dx*8,hy-dy*8,hz-6,hx+dx*14,hy+dy*14,hz+10,1.3,wood);
  const bx=hx+dx*12, by=hy+dy*12, bz=hz+8.6; foQ([bx,by,bz, bx-dy*6.4,by+dx*6.4,bz-2, bx-dy*6.8+dx*3,by+dx*6.8+dy*3,bz+3, bx+dx*2,by+dy*2,bz+2],'#e4e8f0','#5a6070',0.03); foC(bx+dx*1.6,by+dy*1.6,bz+1.4,bx+dx*5.6,by+dy*5.6,bz+4.4,1,'#e4e8f0');
  // the gear shield (left arm): up in front while guarding, spinning; down at its side otherwise
  const sx=lerp(1,7,sh), sy=lerp(-8.6,-4.6,sh), sz=lerp(12,17,sh), spin=t*(guard?7:0.6);
  foL(0,-6.6,21,sx-1,sy+1,sz,2,tinD,1.7);
  foE(sx,sy,sz,1.2,6.6,6.6,brass,0,lerp(-1.2,0,sh));
  for(let i=0;i<8;i++){ const a=spin+i*TAU/8, cy=Math.cos(a), cz=Math.sin(a), ny=lerp(Math.cos(-1.2+1.57),0,0); foC(sx+0.2,sy+cy*6.2,sz+cz*6.2,sx+0.4,sy+cy*8.2,sz+cz*8.2,1.3,brass,0.02); }
  foB(sx+1,sy,sz,2.2,foT(e,'#f0c860')); foD(sx+1.8,sy,sz,0.9,'#7a5a20',0.04);
  foEnd(16); e._t3top=foTop(fy,40,k);
}
function c1Tin2(e,fl){
  const x=e.x, y=e.y, r=e.r, f=e.face, tin=fl?'#fff':'#c2cad6', guard=e.blocking&&e.shield;
  ctx.save(); c1Shadow2(e,1.1); ctx.translate(x,y); ctx.rotate(f);
  ctx.strokeStyle='#8a6a42'; ctx.lineWidth=2; const ha=e.state==='windup'?-1.2:e.state==='strike'?0.9:0.2; ctx.beginPath(); ctx.moveTo(0,8); ctx.lineTo(Math.cos(ha)*26,8+Math.sin(ha)*26); ctx.stroke(); c1E2(Math.cos(ha)*24,8+Math.sin(ha)*24,4,2.6,'#e4e8f0',ha,1);
  c1E2(0,0,r*0.75,r*0.7,tin); c1E2(0,0,r*0.42,r*0.42,'#8a94a6',0,1.2); ctx.fillStyle='#ffd84a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(4,s*2.2,1.3,0,TAU); ctx.fill(); }
  const sx=guard?r*0.75:2, sy=guard?-3:-r*0.75; ctx.save(); ctx.translate(sx,sy); ctx.rotate((e.t||0)*(guard?7:0.5)); ctx.fillStyle='#d8a848'; ctx.beginPath(); for(let i=0;i<16;i++){ const a=i/16*TAU, rr=i%2?8:6.2; ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle=C1OL(); ctx.lineWidth=1.2; ctx.stroke(); ctx.restore();
  ctx.restore();
}

// ---------- Mudgulper: a big grumpy mudskipper. On sand and mud it burrows (only a mound shows), circles, pops up under
// Ash (an orange circle), bites, then sits with its mouth open (gold: x2). Spits mud from far away. On stone, boards or
// grass it can't dig and just flops about. A hammer smash on its mound forces it up.
const C1T={};
function c1Soft(x,y){
  if(AREA){ const th=String((AREA.def&&AREA.def.theme)||''); return /sea|tide|bog|sand|mud|marsh|salt/.test(th); }
  try{ const s=T(x,y,C1T); if(s.water>0&&!s.bridge&&s.depth>0.4) return false; return (s.sand||0)>0.25||(s.bog||0)>0.3||(s.shore||0)>0.15||(s.mud||0)>0.2; }catch(err){ return false; }
}
function c1Spit(e,o){ const p=player; c1Lob(e,p.x,p.y,{r:40,dur:0.85*foeDiff().tele,col:'170,140,90',ball:'#8a6a40',br:5,h:70,land:z=>{ emit(z.x,z.y,14,{col:'130,100,60',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6}); if(!p.dead&&!c1Up()&&dist(z.x,z.y,p.x,p.y)<40+p.r*0.5){ hurtPlayer(e.dmg*0.8,z.x,z.y,120); p.slowT=Math.max(p.slowT||0,1); } }}); }
function c1GulpAI(e,dt,p){
  p=p||player; const D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), soft=!!e.soft||c1Soft(e.x,e.y);
  e.dx=e.dy=0; e.cd-=dt*D.cdK;
  switch(e.state){
    case 'diveDown': e.st-=dt; e.alpha=1; if(e.st<=0){ e.state='under'; e.sunk=true; e.st=rand(1.2,1.8); SFX.play('roll'); } return;
    case 'under': { e.sunk=true; e.orbit+=dt*1.6*e.orbitDir; steer(e,p.x+Math.cos(e.orbit)*90,p.y+Math.sin(e.orbit)*90,e.speed*1.6*D.spd); if(Math.random()<dt*14) G.ripples.push({x:e.x+rand(-10,10),y:e.y+rand(-8,8),t:0,max:0.7,r:rand(5,10)});
      e.st-=dt; if(e.st<=0||!(e.soft||c1Soft(e.x,e.y))){ e.state='emergeW'; e.st=fkW({},0.6); e.tele=newTele({shape:'circle',r:e.r+30,dur:e.st,col:C1COL.orange}); } return; }
    case 'emergeW': if(e.st>0.2) steer(e,p.x,p.y,e.speed*3*D.spd); e.st-=dt; if(e.st>0) return;
      e.tele=null; e.sunk=false; shake(5); SFX.play('boom'); emit(e.x,e.y,18,{col:'140,110,70',glow:false,smin:50,smax:180,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:5});
      if(d<e.r+30+p.r*0.6&&!c1Up()) hurtPlayer(e.dmg*1.3,e.x,e.y,300);
      e.state='open'; e.st=1.0; return;
    case 'open': e.face=turnTo(e.face,a,2*dt); e.st-=dt; if(e.st<=0){ e.state='recover'; e.st=0.3; } return;
    case 'spitW': e.face=turnTo(e.face,a,6*dt); e.st-=dt; if(e.st<=0){ c1Spit(e); e.state='recover'; e.st=0.5; } return;
    case 'windup': e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st<=0){ e.tele=null; e.state='strike'; e.st=0.25; e.vx+=Math.cos(e.face)*180; e.vy+=Math.sin(e.face)*180; if(inCone(e.x,e.y,e.face,e.r+36,0.9,p.x,p.y,p.r)) hurtPlayer(e.dmg,e.x,e.y,200); SFX.play('slash'); } return;
    case 'strike': case 'recover': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=rand(0.6,1.4); } if(e.state==='recover') steer(e,p.x,p.y,e.speed*0.3); return;
  }
  e.state='chase'; e.sunk=false;
  if(soft){ if(d>70) steer(e,p.x,p.y,e.speed*0.8*D.spd); if(e.cd<=0){ if(d>300&&Math.random()<0.55){ e.state='spitW'; e.st=fkW({},0.5); } else { e.state='diveDown'; e.st=0.4; } } }
  else { e.flop=(e.flop||0)-dt; if(e.flop<=0){ e.flop=rand(0.5,0.9); e.vx+=Math.cos(a)*120; e.vy+=Math.sin(a)*120; } if(d>48) steer(e,p.x,p.y,e.speed*0.35*D.spd);
    if(e.cd<=0){ if(d<e.r+p.r+34){ e.state='windup'; e.st=fkW({},0.5); e.tele=newTele({shape:'arc',r:e.r+36,half:0.9,dur:e.st,col:C1COL.white}); } else if(d>180){ e.state='spitW'; e.st=fkW({},0.5); } else e.cd=0.4; } }
  e.face=turnTo(e.face,a,5*dt);
}
defineFoe('c_gulper',{name:'Mudgulper',r:15,hp:60,speed:110,dmg:12,value:22,kbRes:0.6,dcol:'140,130,80',ai:c1GulpAI,
  init(e,o){ if(o&&o.soft!=null) e.soft=o.soft; },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(e.sunk){ if(h.src==='hammer'&&dist(player.x,player.y,e.x,e.y)<110){ e.sunk=false; e.tele=null; e.state='open'; e.st=1.3; c1Txt(e,S('BONK! Out it pops!','BONK!'),'#ffd27a',15); shake(5); return amt; }
      if(!(e._mudT>G.time)){ e._mudT=G.time+1.2; c1Txt(e,S('It is under the mud!','Under the mud!'),'#d8c8a0',12); } return false; }
    if(e.state==='open'){ if(!(e._goldT>G.time)){ e._goldT=G.time+0.9; c1Txt(e,S('Mouth open!','Mouth open!'),'#ffd27a',12); } return amt*2; } },
  onDeath(e){ c1Corpse(e); },
  draw3d:c1FigGulp, draw2d:c1Gulp2,
  sheet:c1Rows({state:'windup',st:0.25},{state:'open'},[{state:'under',sunk:true,label:'burrowed'},{state:'emergeW',st:0.3,sunk:true,label:'pop up'}])});
function c1Mound(e,g){
  g=g||ctx; const x=e.x, y=e.y+4, r=e.r*1.1, t=e.t||0, bulge=e.state==='emergeW'?1+0.25*Math.sin(t*30):1;
  g.save(); g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x,y+3,r*1.2,r*0.5,0,0,TAU); g.fill();
  g.fillStyle='#8a6e46'; g.strokeStyle=C1OL(); g.lineWidth=1.6; g.beginPath(); g.ellipse(x,y-2*bulge,r*bulge,r*0.55*bulge,0,0,TAU); g.fill(); g.stroke();
  g.fillStyle='#a88a5a'; g.beginPath(); g.ellipse(x-r*0.25,y-r*0.25*bulge,r*0.45,r*0.2,0,0,TAU); g.fill();
  for(let i=0;i<3;i++){ const ph=(t*1.5+i*0.33)%1, bx=x+Math.cos(i*2.1+t)*r*0.5, by=y-3-ph*10; g.strokeStyle=`rgba(230,220,190,${1-ph})`; g.lineWidth=1.1; g.beginPath(); g.arc(bx,by,1.5+ph*2,0,TAU); g.stroke(); }
  g.restore();
}
function c1FigGulp(e,fl){
  if(e.sunk||e.state==='under'||(e.state==='emergeW'&&e.sunk)){ c1Mound(e,foG()); e._t3top=e.y-e.r; return; }
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/15, face=t3Turn(e,e.face,9), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const sk=fl?'#ffffff':foT(e,'#b0925a'), skD=foT(e,'#7e6236'), belly=foT(e,'#eadcae'), spot=foT(e,'#5e4626'), mouthC='#d0606e';
  const sp=Math.hypot(e.dx||0,e.dy||0), mv=clamp(sp/60,0,1), dead=foDeath(e), hurt=c1Hurt(e);
  e._wp=(e._wp||0)+dt*sp/(3*k);
  let jaw=0.1, rear=0, z=0, sq=0;
  if(st==='open'){ jaw=1; rear=0.15; } else if(st==='windup'){ jaw=0.7*c1Sm(clamp(1-e.st/0.5,0,1)); rear=-0.2; } else if(st==='strike'){ jaw=0.2; rear=0.2; }
  else if(st==='spitW'){ jaw=0.5; sq=0.3+0.3*Math.sin(t*20); } else if(st==='diveDown'){ z=-inS*14; rear=0.5; }
  else if(st==='emergeW'){ z=-6; } if(e.flop>0.4&&!c1Soft(e.x,e.y)) z+=Math.max(0,Math.sin((0.9-e.flop)*7))*3;
  const P=foEase(e,'_fgu',foTg(jaw,rear),dt,14); jaw=P[0]; rear=P[1];
  foBegin(fx,fy,face,k,fl,z);
  if(dead) foSet(FOB,0,0,dead*1.6,0,0,0,-dead*2); else foSet(FOB,4,rear-hurt*0.25,Math.sin(e._wp)*0.06*mv,0);
  foLow();
  foL(-6,0,5,-15,Math.sin(t*5+e._wp)*2,5.4,4.4,sk,2); foQ([-14,0,7, -21,Math.sin(t*5)*3,11, -22,Math.sin(t*5)*3,1.6, -14,0,3],skD,null,-0.1);
  for(const sd of [-1,1]) foQ([2,sd*6,3, 5,sd*12,1+Math.sin(e._wp*2+sd)*1.6*mv, 0,sd*11.6,0.4, -1,sd*6,1.6],skD,null,0);
  foUp();
  foE(-1,0,6,10,7.8,6,sk); foE(0,0,3.6,9,6.6,3,belly,0,0,0,0.02);
  for(let i=0;i<5;i++) foD(-6+i*3,(i%2?-1:1)*3.4,10.8-Math.abs(i-2)*0.4,0.9,spot,0.05);
  // head: wide and flat; the mouth opens into a pink cave
  foE(7.4,0,7,7,8.4,5.6,sk);
  if(jaw>0.15){ foE(10.8,0,5.6,3.4,6.6,2.6*jaw+0.6,'#5a2030',0.15,0,0,0.04); foE(10,0,4.2,3,5.4,1.2,mouthC,0,0,0,0.05); foE(8.8,0,3.2-jaw*2,5.6,7.6,2.2,belly,0.3*jaw); }
  else foN(12.4,-5.4,5.6,12.6,5.4,5.6,0.8,skD,0.05);
  for(const sd of [-1,1]){ foB(5.8,sd*3.8,12.6,2.8,sk); c1Eye(7.2,sd*4,13.2,1.9,'#fff4c8',0.04); foE(5.8,sd*3.8,14.6,2.4,2.6,0.7,skD,0.4,0,0,0.05); }
  foEnd(8); e._t3top=foTop(fy,16,k,z);
}
function c1Gulp2(e,fl){
  if(e.sunk){ c1Mound(e); return; }
  const x=e.x, y=e.y, r=e.r, f=e.face, sk=fl?'#fff':'#b0925a', open=e.state==='open';
  ctx.save(); c1Shadow2(e,1.2); ctx.translate(x,y); ctx.rotate(f);
  ctx.fillStyle='#7e6236'; ctx.beginPath(); ctx.moveTo(-r*0.6,0); ctx.lineTo(-r*1.5,-6); ctx.lineTo(-r*1.5,6); ctx.closePath(); ctx.fill();
  c1E2(-2,0,r*0.8,r*0.6,sk); c1E2(r*0.45,0,r*0.5,r*0.62,sk);
  if(open){ c1E2(r*0.75,0,4,r*0.45,'#5a2030',0,1); } else { ctx.strokeStyle='#667238'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(r*0.9,-r*0.4); ctx.lineTo(r*0.9,r*0.4); ctx.stroke(); }
  for(const s of [-1,1]) c1Eye2(r*0.35,s*r*0.32,2.6,0);
  ctx.restore();
}

// ---------- Dusk Moth: Nyxara's children, in swarms. They swoop, and a touch drains a little fire (none with Wren's Moth
// Charm, perk_moth; on Easy the first touch is free). In the dark they are shadowed (half damage) until fire lights them
// up for 3 s. Light pulls them: a lit brazier or lantern draws the swarm away from Ash.
function c1LightNear(e,R){ if(typeof P2==='undefined') return null; let best=null, bd=R*R; for(const s of P2.shine){ if(s.r==null||s.r<60) continue; const d=dist2(e.x,e.y,s.x,s.y); if(d<bd){ bd=d; best=s; } } return best; }
function c1MothDrain(e){ if(G.flags.perk_moth) return; if(foeDiff().easy&&!C1.mothFree){ C1.mothFree=true; return; } const p=player; p.energy=Math.max(0,p.energy-8); ftext(p.x,p.y-34,S('-8 fire','-8 fire'),'#c8a8ff',12); emit(p.x,p.y-10,8,{col:'190,170,240',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); }
defineFoe('c_moth',{name:'Dusk Moth',r:10,hp:20,speed:160,dmg:5,value:10,flying:true,kbRes:1.3,dcol:'190,185,215',
  ai:FK.brain({move:'hover',orbit:96,wobble:40,spin:2.6,faceMove:true,turn:9,cd:[1.0,2.2],
    pre(e,dt,d){
      // a boss's swarm takes turns: one swoop starts at a time (Easy 1.1 s apart, Hard 0.5 s)
      if(e.swarm){ if(e.state==='aim'&&!e._sw){ e._sw=true; C1.swoopT=G.time+byDiff(1.1,0.75,0.5); } else if(e.state!=='aim') e._sw=false; if(e.state==='chase'&&e.cd<0.1&&C1.swoopT>G.time) e.cd=0.2+Math.random()*0.3; }
      if(e.litT>0){ e.litT-=dt; if(Math.random()<dt*10) emit(e.x,e.y-20,1,{kind:'fire',smin:10,smax:40,lmin:.2,lmax:.4,zmin:2,zmax:4,grow:4}); }
      const L=e.state==='chase'?c1LightNear(e,460):null;
      if(L&&d>150){ e.lure=L; const u=G.time*1.7+e.id; steer(e,L.x+Math.cos(u)*70,L.y+Math.sin(u*2)*34-20,e.speed*0.9); e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),8*dt); return true; } e.lure=null; },
    moves:[{k:'c1swoop',windup:0.25,len:210,spd:440,time:0.32,dmg:1,max:240,w:3,onHit:c1MothDrain}]}),
  // summoned by a boss (opt.swarm): weaker, worth little, and they take turns to swoop
  init(e,opt){ if(opt&&opt.swarm){ e.swarm=true; e.dmg*=0.55; e.maxHp=e.hp=Math.max(6,Math.round(e.maxHp*0.6)); e.value=Math.ceil((e.value||10)*0.3); } },
  onHurt(e,amt,o){ const h=foeHit(e,o); if(h.fire){ if(!(e.litT>0)) c1Txt(e,S('Lit up!','Lit!'),'#ffb070',11); e.litT=3; return amt; }
    if(e.litT>0) return amt; if(c1Dark(e.x,e.y)){ if(!(e._shT>G.time)){ e._shT=G.time+1.5; c1Txt(e,S('Shadowed! Light it with fire.','Shadow! Use fire.'),'#b8a8e8',11); } return amt*0.5; } },
  onDeath(e){ c1Corpse(e); emit(e.x,e.y-18,10,{col:'215,215,235',smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3,drag:2}); },
  draw3d:c1FigMoth, draw2d:c1Moth2,
  sheet:c1Rows({state:'aim',st:0.1},{state:'swoop',dx:400},[{state:'chase',litT:2,label:'lit up'}])});
function c1MothParts(e,fl,k,z,big){
  const t=e.t||0, st=e.state, dead=foDeath(e), hurt=c1Hurt(e);
  const body=fl?'#ffffff':foT(e,big?'#8e7ea4':'#9c96ae'), fuzz=foT(e,big?'#dcd4ea':'#d4d0e2'), wing=foT(e,big?'#9a8ab4':'#c4c4d8'), wingD=foT(e,big?'#6a5a88':'#8e8ca8'), eye=e.litT>0?'#ffb070':big?'#4a3a5a':'#3e3450';
  const swoop=st==='swoop'||st==='aim', flap=swoop?0:Math.sin(t*(big?7:16)), fold=swoop?1:0, lift=big?(e.dropT>0||st==='flinch'?0:1):1;
  return {body,fuzz,wing,wingD,eye,flap,fold,dead,hurt,lift};
}
function c1FigMoth(e,fl){
  const dt=foDt(e), t=e.t||0, k=e.r/10, face=t3Turn(e,e.face,12), fx=e.x, fy=e.y+e.r*0.45;
  const M=c1MothParts(e,fl,k,0,false), z=lerp(20+Math.sin(t*3+e.id)*3,2,M.dead);
  foShadow(fx,fy,8*k,0.3*(1-M.dead*0.5));
  foBegin(fx,fy,face,k,fl,z);
  if(M.dead) foSet(FOB,0,0.6*M.dead,M.dead*1.2,0); else foSet(FOB,0,(M.fold?0.35:0)-M.hurt*0.3,M.flap*0.06,0);
  const th=M.fold?-0.2:0.15+M.flap*0.75;
  for(const sd of [-1,1]){ c1Wing(sd,0.6,sd*1.6,0.4,9,7.6,th,1.2+M.fold*4,M.wing,M.wingD,1.7); c1Wing(sd,-2.6,sd*1.4,-0.4,6.6,5.6,th*0.85,2.4+M.fold*3,M.wingD,null,0); }
  foE(-1.4,0,0,4.6,2.6,2.4,M.body); for(let i=0;i<3;i++) foN(-3.4+i*1.6,-2.4,0.6,-3.4+i*1.6,2.4,0.6,0.5,M.wingD,0.02);
  foB(2.6,0,0.6,2.6,M.fuzz); foB(4.6,0,1,2,M.body);
  for(const sd of [-1,1]){ foD(5.8,sd*1.1,1.6,0.95,M.eye,0.04); foD(6.1,sd*0.9,2,0.32,'#ffffff',0.05); foN(5.4,sd*0.8,2.4,7.4,sd*3.2,5.4,0.4,'#6a6080',0.03); foN(6.6,sd*2.1,3.9,7.6,sd*1.4,4.8,0.3,'#6a6080',0.04); }
  if(e.litT>0) foGlow(0,0,0,12,'255,150,70',0.5,false);
  foEnd(z); e._t3top=foTop(fy,6,k,z);
}
function c1Moth2(e,fl){
  const x=e.x, y=e.y-16, r=e.r, f=e.face, fl2=Math.sin((e.t||0)*16), body=fl?'#fff':'#9c96ae', sw=e.state==='swoop';
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+4,r*0.8,r*0.35,0,0,TAU); ctx.fill();
  ctx.translate(x,y); ctx.rotate(f);
  const ww=sw?0.5:0.75+fl2*0.35; ctx.fillStyle=e.litT>0?'#f0c090':'#c4c4d8'; ctx.strokeStyle=C1OL(); ctx.lineWidth=1.2;
  for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(-1,s*r*0.8*ww,r*0.7,r*0.75*ww,s*0.3,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#f4f0fa'; ctx.beginPath(); ctx.arc(-1,s*r*0.8*ww,2,0,TAU); ctx.fill(); ctx.fillStyle=e.litT>0?'#f0c090':'#c4c4d8'; }
  c1E2(0,0,r*0.55,r*0.28,body,0,1.2); ctx.restore();
}

// ---------- Silkspinner: a moth the size of a pony. Floats just out of sword reach, lays cocoons (they hatch into dusk
// moths; fire burns them at once), beats blinding dust (a silver cone: the screen dims). Bright light knocks her down
// for 2 s (a beam, a big lit fire). Also a room boss: boss:['c_silkspinner','The Silkspinner'].
defineFoe('c_cocoon',{name:'Cocoon',r:12,hp:22,speed:0,dmg:0,value:3,kbRes:0,dcol:'230,225,240',
  ai(e,dt){ e.dx=e.dy=0; e.state='chase'; e.hatch=(e.hatch==null?6:e.hatch)-dt*foeDiff().atk;
    if(e.hatch<=0&&!e.dead){ const L=fkLevel(e,{}); for(let i=0;i<2;i++){ const m=makeEnemy('c_moth',e.x+rand(-12,12),e.y+rand(-10,10),{level:L,aggro:true,swarm:true,homeX:e.x,homeY:e.y,leash:1400}); m.spawnIn=0.15; if(e.inArea){ m.inArea=e.inArea; m.room=e.room; } if(e.arena) m.arena=e.arena; }
      e.dead=true; c1Puff(e.x,e.y-10,'230,225,240',18); SFX.play('pop'); } },
  onHurt(e,amt,o){ if(foeHit(e,o).fire){ c1Txt(e,S('Whoosh!','Whoosh!'),'#ffb070',12); return e.hp+5; } },
  onDeath(e){ emit(e.x,e.y-10,14,{kind:'fire',smin:20,smax:90,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:6}); },
  draw3d:c1FigCocoon, draw2d:c1Cocoon2, sheet:[{state:'chase',label:'cocoon'},{state:'chase',hatch:0.6,label:'hatching'}]});
function c1FigCocoon(e,fl){
  const t=e.t||0, k=e.r/12, fx=e.x, fy=e.y+e.r*0.45, h=e.hatch==null?6:e.hatch, wob=h<1.5?Math.sin(t*30)*0.12*(1.5-h):Math.sin(t*2)*0.03;
  foBegin(fx,fy,0,k,fl,0); foSet(FOB,0,wob,wob*0.7,0);
  const c=fl?'#ffffff':'#ece8f2', cD='#b8b0c8';
  foE(0,0,9,7,7,10,c); for(let i=0;i<5;i++){ const z=3+i*3.4, a=i*0.9; foN(Math.cos(a)*7,Math.sin(a)*7,z,Math.cos(a+2.4)*7,Math.sin(a+2.4)*7,z+2.4,0.6,cD,0.02); }
  foL(0,0,18.6,0,0,24,0.5,cD);
  if(h<2) foGlow(0,0,9,10,'190,120,255',0.5*(2-h),false);
  foEnd(9); e._t3top=foTop(fy,22,k);
}
function c1Cocoon2(e,fl){ const x=e.x, y=e.y; ctx.save(); c1Shadow2(e,0.8); c1E2(x,y-6,e.r*0.6,e.r*0.9,fl?'#fff':'#ece8f2'); ctx.strokeStyle='#b8b0c8'; ctx.lineWidth=1; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(x-e.r*0.55,y-12+i*5); ctx.lineTo(x+e.r*0.55,y-9+i*5); ctx.stroke(); } ctx.restore(); }
defineFoe('c_silkspinner',{name:'Silkspinner',r:26,hp:160,speed:60,dmg:10,value:60,flying:true,kbRes:0.5,dcol:'170,150,200',
  ai:FK.brain({move:'hover',orbit:118,wobble:14,spin:0.9,turn:3,cd:[1.6,2.6],
    pre(e,dt,d,a){
      if(e.dropT>0){ e.dropT-=dt; e.dx=e.dy=0; e.state='flinch'; e.st=0.3; if(e.dropT<=0){ e.state='recover'; e.st=0.5; e.lightCd=3; } return true; }
      if(e.lightCd>0) e.lightCd-=dt;
      else if(typeof p2LitAt==='function'&&p2LitAt(e.x,e.y,e.r)){ fkAbort(e); e.dropT=2; e.state='flinch'; c1Txt(e,S('The light! She drops!','She falls!'),'#ffe066',15); shake(5); SFX.play('boom'); emit(e.x,e.y,20,{col:'215,210,235',glow:false,smin:40,smax:160,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:5}); return true; } },
    moves:[{k:'summon',type:'c_cocoon',n:1,cap:3,every:5,windup:0.7,st:'summon',r0:60,r1:150,w:3},
           {k:'c1cone',windup:0.8,len:240,half:0.5,col:C1COL.silver,max:320,w:2,hit:e=>{ C1.blindT=2; ftext(player.x,player.y-40,S('Dust in your eyes!','Dusty eyes!'),'#e0e0f4',13); }}]}),
  onHurt(e,amt,o){ if(e.dropT>0) return amt*1.25; },
  onDeath(e){ c1Corpse(e); },
  draw3d:c1FigSilk, draw2d:c1Silk2,
  sheet:c1Rows({state:'breathW',st:0.4,at:0.7,label:'dust windup'},{state:'summon',st:0.3,at:0.5,label:'lay cocoon'},[{state:'flinch',dropT:1,label:'dropped'}])});
function c1FigSilk(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/26, face=t3Turn(e,e.face,6), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const M=c1MothParts(e,fl,k,0,true), down=e.dropT>0||st==='flinch';
  const zt=down?2:24+Math.sin(t*1.6)*3, z=e._sz=lerp(e._sz==null?zt:e._sz,zt,Math.min(1,dt*6)), zz=lerp(z,1,M.dead);
  foShadow(fx,fy,22*k,0.35);
  let fw=0, curl=0; if(st==='breathW'){ fw=c1Sm(clamp(inS/0.8,0,1)); } else if(st==='breath'){ fw=-0.4; } else if(st==='summon'){ curl=c1Sm(clamp(inS/0.5,0,1)); }
  foBegin(fx,fy,face,k,fl,zz);
  if(M.dead) foSet(FOB,0,0.5*M.dead,M.dead*1.3,0); else foSet(FOB,0,-M.hurt*0.2+curl*0.3,0,0);
  const th=down?-0.45:(fw>0?-0.1-fw*0.4:0.25+Math.sin(t*5)*0.45), sweep=fw>0?-fw*5:fw<0?3:2;
  for(const sd of [-1,1]){ c1Wing(sd,1,sd*4,2,24,17,th,sweep,M.wing,M.wingD,3.1,'#d8cce8'); c1Wing(sd,-6,sd*3.6,0.6,17,12,th*0.85,sweep+3,M.wingD,null,0); }
  foE(-6,0,-curl*4,10,6.6,6,M.body,curl*0.5); for(let i=0;i<4;i++) foN(-12+i*3.4,-6,0.4-curl*2,-12+i*3.4,6,0.4-curl*2,0.8,M.wingD,0.02);
  foB(3.4,0,2,7,M.fuzz); for(let i=0;i<6;i++){ const a=i*TAU/6; foB(3.4+Math.cos(a)*5,Math.sin(a)*5.4,2+Math.sin(a*2)*1,2.4,M.fuzz); }
  foB(8.6,0,3,4.6,M.body);
  for(const sd of [-1,1]){ foB(11,sd*2.6,4,2.1,'#5a4a6e'); foD(12.4,sd*2.2,4.8,0.7,'#ffffff',0.05);
    for(let j=0;j<3;j++){ const ax=10+j*0.6, ay=sd*(1.6+j*1.2), sx=15+j*1.4, sy=sd*(4+j*3.2), sz=12+j*1.6+Math.sin(t*3+j)*0.8; foN(ax,ay,6.4,sx,sy,sz,0.55,'#e8e0f4',0.03); foN((ax+sx)/2,(ay+sy)/2,(6.4+sz)/2,(ax+sx)/2+1.6,(ay+sy)/2+sd*1.6,(6.4+sz)/2+1.4,0.4,'#e8e0f4',0.04); } }
  for(const sd of [-1,1]) for(let i=0;i<2;i++) foL(2-i*3,sd*3,-2,1-i*3+Math.sin(t*4+i)*0.6,sd*5,-8,0.6,'#6a5a7e',0.5);
  if(fw>0.1) foGlow(13,0,4,16*fw,'225,225,245',0.7*fw,false);
  foEnd(zz); e._t3top=foTop(fy,14,k,zz);
}
function c1Silk2(e,fl){
  const x=e.x, y=e.y-(e.dropT>0?4:22), r=e.r, f=e.face, fl2=Math.sin((e.t||0)*5);
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+6,r,r*0.4,0,0,TAU); ctx.fill(); ctx.translate(x,y); ctx.rotate(f);
  ctx.strokeStyle=C1OL(); ctx.lineWidth=1.6; const ww=0.85+fl2*0.2;
  for(const s of [-1,1]){ ctx.fillStyle='#9a8ab4'; ctx.beginPath(); ctx.ellipse(-2,s*r*0.75*ww,r*0.6,r*0.7*ww,s*0.25,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#f4f0fa'; ctx.beginPath(); ctx.arc(-2,s*r*0.75*ww,4,0,TAU); ctx.fill(); }
  c1E2(-4,0,r*0.5,r*0.3,fl?'#fff':'#8e7ea4'); c1E2(r*0.2,0,r*0.3,r*0.3,'#dcd4ea'); ctx.restore();
}

// ---------- gulls of the Gullcrag Caves: the bat's AI with a gull. They dive at anyone climbing a wall (a shriek and a
// growing shadow on Ash first, 0.8 s)
defineFoe('c_gull',{name:'Cave Gull',r:11,hp:16,speed:170,dmg:6,value:9,flying:true,kbRes:1.2,dcol:'235,235,240',
  ai(e,dt){ const p=player;
    if(e.state==='gullDive'){ e.dx=e.dy=0; e.st-=dt; e.face=angTo(e.x,e.y,p.x,p.y); if(e.st<=0){ e.state='swoop'; e.st=0.42; e.hitP=false; SFX.play('dash'); } return; }
    if(e.state==='chase'&&e.cd<=0&&typeof p2Climbing==='function'&&p2Climbing()&&dist(e.x,e.y,p.x,p.y)<420){ e.state='gullDive'; e.st=fkW({},0.8); c1Mark({x:p.x,y:p.y,r:30,dur:e.st,col:'60,50,70',follow:()=>player}); c1Txt(e,S('SKRAAA!','SKRAAA!'),'#f4f4f0',13); return; }
    AI.bat(e,dt); },
  onDeath(e){ c1Corpse(e); emit(e.x,e.y-16,12,{col:'245,245,240',glow:false,smin:30,smax:120,lmin:.4,lmax:.9,zmin:1.5,zmax:3,drag:2}); },
  draw3d:c1FigGull, draw2d:c1Gull2, sheet:c1Rows({state:'gullDive',st:0.4},{state:'swoop',dx:400})});
function c1FigGull(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/11, face=t3Turn(e,e.face,12), fx=e.x, fy=e.y+e.r*0.45, dead=foDeath(e), hurt=c1Hurt(e);
  const wh=fl?'#ffffff':foT(e,'#f6f6f2'), gr=foT(e,'#aab2c0'), tip='#4a4a56', beak=foT(e,'#f2c040'), sw=st==='swoop', dive=st==='gullDive';
  const z=lerp(22+Math.sin(t*3+e.id)*3,2,dead);
  foShadow(fx,fy,9*k,0.3);
  foBegin(fx,fy,face,k,fl,z);
  if(dead) foSet(FOB,0,0.5,dead*1.3,0); else foSet(FOB,0,(sw?0.4:dive?-0.3:0)-hurt*0.3,0,0);
  const fl2=sw?-0.3:dive?0.9:Math.sin(t*12)*0.7+0.1;
  for(const sd of [-1,1]){ const c=Math.cos(fl2), s=Math.sin(fl2); foQ([2,sd*2,1, -1,sd*(2+10*c),1+10*s, -6,sd*(2+9*c),1+8*s, -4,sd*2,0.4],gr,'#7a8290',-0.1); foQ([-1,sd*(2+10*c),1+10*s, -3,sd*(2+14*c),1+13*s, -6,sd*(2+9*c),1+8*s],tip,null,-0.09); }
  foE(-0.5,0,0,6,3.2,3,wh); foQ([-5,0,0.6, -10,-2.4,1.4, -10,2.4,1.4],wh,'#c8c8c4',-0.05);
  foB(5,0,2,2.8,wh); foC(7,0,1.8,11+(dive?0.6:0),0,1.2,1.1,beak); if(dive) foC(7,0,1.2,10,0,0,0.7,beak);
  for(const sd of [-1,1]){ foD(6.4,sd*1.6,3,0.7,'#2a2030',0.04); foD(6.6,sd*1.4,3.3,0.25,'#ffffff',0.05); }
  foEnd(z); e._t3top=foTop(fy,6,k,z);
}
function c1Gull2(e,fl){ const x=e.x, y=e.y-16, r=e.r, f=e.face, fl2=Math.sin((e.t||0)*12); ctx.save(); ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+4,r*0.8,r*0.35,0,0,TAU); ctx.fill(); ctx.translate(x,y); ctx.rotate(f);
  ctx.strokeStyle=C1OL(); ctx.lineWidth=1.2; ctx.fillStyle='#aab2c0'; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(-4,s*(r+4)*(0.8+fl2*0.3)); ctx.lineTo(-8,s*4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  c1E2(0,0,r*0.6,r*0.32,fl?'#fff':'#f6f6f2',0,1.2); ctx.fillStyle='#f2c040'; ctx.beginPath(); ctx.moveTo(r*0.6,-1.5); ctx.lineTo(r+3,0); ctx.lineTo(r*0.6,1.5); ctx.fill(); ctx.restore(); }

// ================= 7. shared boss machinery
// a wind-up shown by a ground mark (not e.tele) gets the difficulty's wind-up factor here (runAI only scales e.tele)
function c1W(o,def){ const d=(G&&G.diff)||{}; return fkW(o||{},def)*(d.wind||1); }
// several quick strikes in a row (claw snaps, a hook flurry, Shadow Ash's sword combo): arc telegraphs, one hit each
function c1ComboNext(e,m,first){ const o=m.o; m.hit=false; e.state=o.st||'windup'; e.st=fkW(o,first?(o.windup||0.4):(o.windup2||(o.windup||0.4)*0.7)); e.tele=newTele({shape:'arc',r:o.reach||e.r+34,half:o.half||0.9,dur:e.st,col:o.col||C1COL.white}); }
FM.c1combo={
  start(e,m){ const o=m.o; m.i=0; m.n=typeof o.n==='function'?o.n(e):(o.n||3); c1ComboNext(e,m,true); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.hit){ e.face=turnTo(e.face,a,(o.track||4)*dt); e.st-=dt; if(e.st>0) return false; m.hit=true; e.tele=null; e.state=o.st2||'strike'; e.st=o.gap||0.16; e.swung=0.2; e.comboI=m.i;
      const L=o.lunge!=null?o.lunge:140; e.vx+=Math.cos(e.face)*L; e.vy+=Math.sin(e.face)*L;
      if(inCone(e.x,e.y,e.face,(o.reach||e.r+34)+2,(o.half||0.9)+0.1,p.x,p.y,p.r)&&!(o.ground&&c1Up())) hurtPlayer(fkDmg(e,o),e.x,e.y,o.kb||200);
      SFX.play(o.sfx||'slash'); if(o.onHit) o.onHit(e,m.i); return false; }
    e.st-=dt; if(e.st>0) return false; if(++m.i>=m.n) return true; c1ComboNext(e,m,false); return false; } };
// a slam on a marked spot ahead (orange circle), then after(e,m) (a stuck claw, a shock wave)
FM.c1slam={
  start(e,m){ const o=m.o, p=player, a=angTo(e.x,e.y,p.x,p.y), off=o.off!=null?o.off:e.r+40, C=c1Ctx(e); e.state=o.st||'slamW'; e.st=c1W(o,0.8); e.face=a;
    const q={x:e.x+Math.cos(a)*off,y:e.y+Math.sin(a)*off}; if(e.arena||C.A) c1Hold(C,q,20); m.x=q.x; m.y=q.y; m.z=c1Mark({x:q.x,y:q.y,r:o.r||50,dur:e.st,col:o.col||C1COL.orange}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player; e.face=turnTo(e.face,angTo(e.x,e.y,m.x,m.y),4*dt); e.st-=dt; if(e.st>0) return false;
    shake(o.shake||8); SFX.play('boom'); emit(m.x,m.y,20,{col:o.dust||'190,160,110',glow:false,smin:50,smax:200,lmin:.3,lmax:.7,zmin:2,zmax:5,grow:6});
    if(!p.dead&&!c1Up()&&dist(p.x,p.y,m.x,m.y)<(o.r||50)+p.r*0.6) hurtPlayer(fkDmg(e,o),m.x,m.y,o.kb||320);
    if(o.then) o.then(e,m); return true; } };
// bubbles that drift at Ash: they pop into sticky foam on him (slow), or harmlessly under a swing
FZK.c1bub={
  tick(z,dt){ const p=player; z.vx+=(Math.cos(angTo(z.x,z.y,p.x,p.y))*z.sp-z.vx)*Math.min(1,dt*0.8); z.vy+=(Math.sin(angTo(z.x,z.y,p.x,p.y))*z.sp-z.vy)*Math.min(1,dt*0.8); z.x+=z.vx*dt; z.y+=z.vy*dt;
    const pop=hurt=>{ z.done=true; SFX.play('pop'); emit(z.x,z.y-10,10,{col:'220,240,255',smin:30,smax:120,lmin:.2,lmax:.4,zmin:1.2,zmax:2.4}); if(hurt){ hurtPlayer(z.dmg,z.x,z.y,60); p.slowT=Math.max(p.slowT||0,z.slow||1.5); fzAdd('c1cloud',{x:p.x,y:p.y,r:34,life:1.5,slow:0.2,col:'230,245,255'}); ftext(p.x,p.y-34,S('Sticky foam!','Sticky!'),'#e0f4ff',12); } };
    if(!p.dead&&dist(z.x,z.y,p.x,p.y)<z.r+p.r&&!c1Up()) return pop(true);
    if(p.swingT>0&&dist(z.x,z.y,p.x,p.y)<96&&Math.abs(angDiff(p.swingDir||p.facing,angTo(p.x,p.y,z.x,z.y)))<1.25) return pop(false);
    if(z.t>0.3&&c1Solid(z.x,z.y)) return pop(false); },
  drawG(z){ const y=z.y-14-Math.sin(z.t*3)*3, r=z.r*(1+0.06*Math.sin(z.t*7)); ctx.save(); ctx.fillStyle='rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(z.x,z.y,r*0.8,r*0.35,0,0,TAU); ctx.fill();
    ctx.fillStyle='rgba(200,235,255,.45)'; ctx.strokeStyle='rgba(240,250,255,.95)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(z.x,y,r,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(z.x-r*0.35,y-r*0.35,r*0.25,0,TAU); ctx.fill(); ctx.restore(); }
};
FM.c1bubbles={
  start(e,m){ const o=m.o; e.state=o.st||'puff'; e.st=fkW(o,0.6); e.tele=newTele({shape:'cone',len:150,half:0.5,dur:e.st,col:'200,235,255'}); },
  tick(e,dt,d,a,m){ const o=m.o; e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(e.st>0) return false; e.tele=null; const n=o.n||3;
    for(let i=0;i<n;i++){ const an=e.face+(i-(n-1)/2)*0.45, x=e.x+Math.cos(an)*(e.r+16), y=e.y+Math.sin(an)*(e.r+16); fzAdd('c1bub',{x,y,vx:Math.cos(an)*120,vy:Math.sin(an)*120,sp:o.spd||85,r:11,life:5.5,dmg:fkDmg(e,o),slow:1.5}); }
    SFX.play('pop'); return true; } };
// scuttle sideways fast, then stop
FM.c1scuttle={
  start(e,m){ e.state='scuttle'; e.st=m.o.time||1.1; m.dir=Math.random()<0.5?-1:1; },
  tick(e,dt,d,a,m){ const sp=e.speed*(m.o.mul||2.4)*foeDiff().spd, ang=a+m.dir*Math.PI/2; e.dx=Math.cos(ang)*sp; e.dy=Math.sin(ang)*sp; e.face=turnTo(e.face,a,3*dt); if(foeBumped(e)) m.dir*=-1; e.st-=dt; return e.st<=0; } };
Object.assign(FM_DEF,{c1combo:{recover:0.5},c1slam:{recover:0.55},c1bubbles:{recover:0.5},c1scuttle:{recover:0.4}});

// hit circles: some bosses have parts (claws, a deck, a hat) with their own damage factor (m)
// keep a boss's health at or above frac of its max (a gate the mechanic opens). onHurt's number is multiplied by the
// hit circle's mult after it returns, and any hit takes at least 0.5, so this returns false when nothing may go through.
function c1Floor(e,a,o,frac){ const room=e.hp-e.maxHp*frac; if(room<=0.5) return false; return Math.min(a,room/((o&&o.mult)||1)); }
const C1HC={};
// fill slot n of a reused hit-circle list (the list is cut short each time, so a slot may be gone)
function c1HS(L,n,o){ return Object.assign(L[n]||(L[n]={}),o); }
{ const base=hitCircles; hitCircles=function(e){ const f=C1HC[e.type]; return f?f(e):base(e); }; }
// story lines: the story helpers may write STORY[key]; until then the lines below are used (the bible's own words)
function c1Lines(type,introKey,outroKey,introDef,outroDef){
  const B={_in:null,_out:null};
  Object.defineProperty(B,'intro',{get(){ return this._in||(introKey&&STORY[introKey])||introDef||[]; },set(v){ this._in=v; },enumerable:true});
  Object.defineProperty(B,'outro',{get(){ return this._out||(outroKey&&STORY[outroKey])||outroDef||[]; },set(v){ this._out=v; },enumerable:true});
  STORY.bosses[type]=B; return B;
}
function c1Spk(id,name,col){ if(!SPK[id]) SPK[id]={name,col}; }
c1Spk('c_pinch','Grand Admiral Pinch','#e8885a'); c1Spk('c_saltbeard','Captain Saltbeard','#a8d8f0'); c1Spk('c_mask','The Moth Mask','#b8a8d8');
c1Spk('c_vesper','Vesper','#c8b0e0'); c1Spk('c_shadow','Shadow Ash','#6a5a8a'); c1Spk('c_pearl','Pearl','#9ad0c8'); c1Spk('c_ticktock','Ticktock','#e0b050');
// the sites: a boss type maps to its site key (defineBoss). Dungeon sites never open by themselves (open:()=>false):
// the room trigger (c1boss) or c1BossStart starts them.
const C1SITE={}, C1SITEK={};
function c1Site(type,k,d){ C1SITE[type]=k; C1SITEK[k]=type; return defineBoss(k,d); }
// a boss spawned for a dungeon room: the room is its arena (e.arena), it joins the room (the doors lock, the room is
// solved when it falls) and never wanders off
function c1BossInit(e){
  e.r0=e.r0||e.r; e.leash=99999;
  const Pd=C1.pending; if(Pd&&Pd.type===e.type&&AREA&&AREA.id===Pd.area){ const R=Pd.R; e.arena={x0:R.x0,y0:R.y0,x1:R.x1,y1:R.y1,cx:R.cx,cy:R.cy}; e.inArea=true; e.room=R.id; e.c1room=R; if(R.enemies) R.enemies.push(e); C1.pending=null; }
}
// the room decor of a boss room (drawn whenever the room is loaded; the fight only adds the moving parts)
const C1ROOM={};
function c1RoomOf(e){ const R=e.c1room; if(!R) return null; for(const D of C1.rooms||[]) if(D.R===R) return D; return null; }
function c1Cells(R,fn){ const A=AREA, c=A.cave; for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*c.w+i; fn(k,i,j,A.x0+(i+0.5)*c.cell,A.y0+(j+0.5)*c.cell); } }
// raised (ledge) cells of a room, grouped: [{x,y,n,cells,x0,y0,x1,y1}]
function c1Ledges(R){
  const A=AREA, c=A.cave, seen=new Set(), out=[]; if(!A.tri) return out;
  c1Cells(R,(k)=>{ if(seen.has(k)||c.grid[k]!==0||dunH(k)<1) return; const st=[k], L={n:0,sx:0,sy:0,cells:[],x0:1e9,y0:1e9,x1:-1e9,y1:-1e9}; seen.add(k);
    while(st.length){ const q=st.pop(), i=q%c.w, j=(q-i)/c.w, x=A.x0+(i+0.5)*c.cell, y=A.y0+(j+0.5)*c.cell; L.n++; L.sx+=x; L.sy+=y; L.cells.push(q); L.x0=Math.min(L.x0,x); L.y0=Math.min(L.y0,y); L.x1=Math.max(L.x1,x); L.y1=Math.max(L.y1,y);
      for(const d of [1,-1,c.w,-c.w]){ const n=q+d; if(n<0||n>=c.typ.length||seen.has(n)||c.grid[n]!==0||dunH(n)<1) continue; const ni=n%c.w, nj=(n-ni)/c.w; if(ni<=R.ox||ni>R.ox+R.iw||nj<=R.oy||nj>R.oy+R.ih) continue; seen.add(n); st.push(n); } }
    L.x=L.sx/L.n; L.y=L.sy/L.n; if(L.n>=3) out.push(L); });
  return out;
}
// the floor-level cells of a room as one path (the flood water is drawn over it, not over the ledges)
function c1FloorPath(R){
  const A=AREA, c=A.cave, cs=c.cell, P=new Path2D(); if(!A.tri) { P.rect(R.x0,R.y0,R.x1-R.x0,R.y1-R.y0); return P; }
  for(let j=R.oy+1;j<=R.oy+R.ih;j++){ let run=-1; for(let i=R.ox+1;i<=R.ox+R.iw+1;i++){ const k=j*c.w+i, ok=i<=R.ox+R.iw&&c.grid[k]===0&&dunH(k)<1; if(ok&&run<0) run=i; if(!ok&&run>=0){ P.rect(A.x0+run*cs,A.y0+j*cs,(i-run)*cs,cs); run=-1; } } }
  return P;
}

// ================= 8. Grand Admiral Pinch (c_pinch), boss of the Gullcrag Caves (the Drowned Lagoon)
// Phase 1 Low Tide: claw snaps (white), claw slam (orange; the claw sticks in the sand 2 s: gold, x2), bubbles (sticky
// foam), a fast scuttle. His shell is armored (x0.15): hit the claws and the face.
// Phase 2 High Tide: the Surge floods the floor (it drags Ash to the wreck and stings). CLIMB a cracked wall to a ledge
// (the Climbing Claws). From up there his deck (gold) takes x2; an arrow on his hat staggers him. Cannons fire red lines
// at the ledges: step along. The tide goes out after 12 s (Easy 8, Hard 14) and he lies tired on the sand for 3 s.
// Phase 3 Shell Shock: out of his shell he is soft (x2) and runs circles back to it; stand in the way. In the shell he
// spin-charges (red line) and bounces off walls, then sits dizzy outside it. He stamps sand waves (jump, or stand high).
c1Lines('c_pinch','c_pinch_intro','c_gull_won',
  [['c_pinch',S('WHO goes there? Who dares enter the lagoon of GRAND ADMIRAL PINCH without SALUTING?','WHO is there? You did not SALUTE the Admiral!')],
   ['ash',S('Um. Hello, Admiral.','Um. Hi, Admiral.')],
   ['c_pinch',S('That is not a salute! PREPARE TO BE PINCHED!','That is not a salute! Get ready to be PINCHED!')]],
  [['narr',S('Grand Admiral Pinch staggers, sits down in the sand, and sulks. Then he spots an old teacup in the wreck, squeezes into it, and looks enormously dignified.','Pinch sits down and sulks. Then he squeezes into an old teacup. He looks very proud.')],
   ['c_pinch',S('I meant to do that. Dismissed.','I meant to do that. Dismissed.')],
   ['c_pearl',S('He has been Admiral of this lagoon for four hundred years. Nobody has told him there is no navy. Let him keep his teacup.','He has been Admiral for 400 years. There is no navy. Let him keep his teacup.')]]);
const C1PIN={claw:[0,0],hat:0};
function pinchClaw(e,side){ const f=e.face, k=(e.r0||40)/40; if(e.stuck&&e.stuck.side===side) return {x:e.stuck.x,y:e.stuck.y};
  const fx=Math.cos(f), fy=Math.sin(f); return {x:e.x+fx*48*k-fy*side*30*k,y:e.y+fy*48*k+fx*side*30*k}; }
C1HC.c_pinch=e=>{
  const L=e._hc||(e._hc=[{},{},{},{},{}]); let n=0; const k=(e.r0||40)/40, f=e.face;
  if(!e.shellOn){ c1HS(L,n++,{x:e.x,y:e.y,r:24*k,m:2}); L.length=n; return L; }
  const ledge=c1Lvl()>=1, deck=!!(e.surge&&e.surge.ph==='on')&&ledge;
  c1HS(L,n++,{x:e.x-Math.cos(f)*8*k,y:e.y-Math.sin(f)*8*k,r:e.r*0.95,m:deck?2:e.tiredT>0?1.5:0.15});
  for(const sd of [-1,1]){ const c=pinchClaw(e,sd); c1HS(L,n++,{x:c.x,y:c.y,r:16*k,m:e.stuck&&e.stuck.side===sd?2:e.surge&&e.surge.ph==='on'?0.15:1}); }
  c1HS(L,n++,{x:e.x+Math.cos(f)*34*k,y:e.y+Math.sin(f)*34*k,r:13*k,m:e.surge&&e.surge.ph==='on'?0.15:1});
  if(e.surge&&e.surge.ph==='on') c1HS(L,n++,{x:e.x+Math.cos(f)*24*k-Math.sin(f)*-10*k,y:e.y+Math.sin(f)*24*k+Math.cos(f)*-10*k,r:9*k,m:1.3});
  L.length=n; return L;
};
const PINCH_AI=FK.brain({move:'approach',stop:78,turn:2.6,cd:[0.7,1.3],recoverMove:0.25,pre:pinchPre,
  moves:[{k:'c1combo',n:2,reach:92,half:0.85,windup:0.5,windup2:0.4,lunge:110,dmgN:17,col:C1COL.white,max:130,w:3},
         {k:'c1slam',off:76,r:52,windup:0.8,dmgN:24,max:170,w:2.2,if:e=>e.shellOn&&!e.surge,then:(e,m)=>{ e.stuck={side:-1,x:m.x,y:m.y}; e.stuckT=2; c1Txt(e,S('His claw is stuck! Hit it!','Claw stuck! Hit it!'),'#ffd27a',15); }},
         {k:'c1bubbles',n:3,windup:0.6,dmgN:9,spd:90,min:130,every:4,w:1.6,if:e=>e.shellOn&&!e.surge},
         {k:'c1scuttle',time:1.1,mul:2.4,every:5,w:1,if:e=>e.shellOn&&!e.surge}]});
defineFoe('c_pinch',{boss:true,name:'Grand Admiral Pinch',title:S('Claws for Alarm','Admiral of the lagoon'),short:'Admiral Pinch',
  lv:11,hp:4300,r:40,speed:110,dmg:17,value:1000,kbRes:0.05,dcol:'232,128,90',phases:[0.66,0.33],
  phaseText:[[S('High Tide!','High tide!'),S('The lagoon floods! Climb a cracked wall to a ledge. Hit his gold deck from up there!','The water comes! Climb up high! Hit his deck!'),['c_pinch',S('All hands! FLOOD THE LAGOON!','Flood the lagoon!')]],
             [S('Shell Shock!','Shell off!'),S('He popped out of his shell and he is soft! Stand between him and his shell. Jump his sand waves.','He is soft now! Block his shell! Jump the waves!'),['c_pinch',S('My shell! Somebody fetch my SHELL!','My shell! Get my shell!')]]],
  init(e){ c1BossInit(e); e.shellOn=true; e.surgeT=2; e.waveT=4; },
  onPhase(e,i){ if(i===1){ e.surgeT=0.8; } if(i===2){ e.surge=null; pinchFlood(e,0); pinchShellOff(e,true); } },
  ai:PINCH_AI,
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.state==='spin'||e.state==='spinW') a=amt*0.15;
    else if(e.surge&&e.surge.ph==='on'&&h.ranged&&o.mult===1.3&&!(e.flinchT>0)){ e.flinchT=1.5; e.mv=null; e.tele=null; e.deckHits=(e.deckHits||0)+1; c1Txt(e,S('OW! My HAT!','My hat!'),'#ffe066',16); c1Say(e,'c_pinch',S('Mind the HAT! It is regulation!','Not the hat!'),5); a=amt*1.3; }
    else if(e.surge&&e.surge.ph==='on'&&o.mult===1.3&&!h.ranged) a=amt*0.15/1.3;
    else if(e.shellOn&&h.fire&&!(e.tiredT>0)) a=amt*0.3;
    else{
      if(e.shellOn&&o.mult===2&&e.surge){ e.deckHits=(e.deckHits||0)+1; if(!(e._dkT>G.time)){ e._dkT=G.time+1; c1Txt(e,S('DECK HIT!','Deck hit!'),'#ffd27a',15); } }
      if(e.shellOn&&o.mult!=null&&o.mult<0.5&&!(e._clT>G.time)){ e._clT=G.time+1.6; c1Txt(e,e.surge&&e.surge.ph==='on'?S('His claws are under the water! Climb up and hit his deck!','Climb up! Hit his deck!'):S('CLONK! Hit the claws!','Clonk! Hit the claws!'),'#e8d8c0',12); } }
    // High Tide only ends once his deck (or his hat) has been hit in a surge: the climb is the way through
    if(e.bph===1&&(e.deckHits||0)<byDiff(1,2,3)){ const b=a; a=c1Floor(e,a,o,0.34); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; c1Txt(e,S('He is too strong! Wait for the flood, climb up, and hit his deck!','Climb up in the flood! Hit his deck!'),'#ffd27a',13); } }
    return a; },
  draw3d:c1FigPinch, draw2d:c1Pinch2,
  sheet:c1Sheet([{state:'chase',label:'idle'},{state:'chase',dx:60,label:'walk'},{state:'windup',st:0.25,label:'snap windup'},{state:'strike',label:'snap'},{state:'slamW',st:0.4,at:0.65,label:'slam windup'},
         {state:'stuck',stuck:{side:-1,x:0,y:0},label:'claw stuck'},{state:'puff',st:0.3,label:'bubbles'},{state:'dizzy',tiredT:2,label:'tired'},{state:'chase',shellOn:false,label:'soft'},{state:'spin',dx:300,label:'spin'},{state:'chase',deathT:0.3,label:'death'}])});
function pinchPre(e,dt,d,a){
  const D=foeDiff(); if(e.shellOn==null) e.shellOn=true;
  if(e.flinchT>0){ e.flinchT-=dt; e.dx=e.dy=0; e.state='stagger'; e.st=0.2; if(e.flinchT<=0){ e.state='recover'; e.st=0.3; } return true; }
  if(e.stuckT>0){ e.stuckT-=dt; e.dx=e.dy=0; e.state='stuck'; e.st=0.2; e.face=turnTo(e.face,angTo(e.x,e.y,e.stuck.x,e.stuck.y),3*dt); if(Math.random()<dt*6) emit(e.stuck.x,e.stuck.y,1,{col:'255,220,120',ang:-Math.PI/2,spread:1,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.5,zmax:2.5,rise:20}); if(e.stuckT<=0){ e.stuck=null; e.state='recover'; e.st=0.5; } return true; }
  if(e.tiredT>0){ e.tiredT-=dt; e.dx=e.dy=0; e.state='dizzy'; e.st=0.2; if(e.tiredT<=0){ e.state='recover'; e.st=0.4; e.cd=0.5; } return true; }
  if(e.bph>=2||!e.shellOn) return pinchSoft(e,dt,d,a);
  if(e.surge) return pinchSurge(e,dt,d,a);
  if(e.bph>=1){ e.surgeT-=dt*D.atk; if(e.surgeT<=0&&e.state==='chase'){ pinchSurgeStart(e); return true; } }
  bossCad(e,e.bph>=1?0.85:1);
  return false;
}
function pinchFlood(e,v){ const D=c1RoomOf(e); if(D) D.waterTo=v; }
function pinchSurgeStart(e){
  e.surge={ph:'warn',t:0,dur:byDiff(8,12,14),cn:1.2,sn:0.6}; e.mv=null; e.tele=null; pinchFlood(e,0.25);
  SFX.play('warn'); shake(6); setBanner(S('The tide is coming in!','The tide is coming!'),S('CLIMB a cracked wall to a ledge!','CLIMB up high!'),3);
  c1Say(e,'c_pinch',S('HIGH TIDE! Batten the hatches!','HIGH TIDE!'),4);
  if(!hasAbil('claws')) c1Tip('pinch_noclaw',S('The Surge','The water!'),S('Ledges keep you out of the water. With the Climbing Claws you can climb the cracked walls.','Get high! Claws climb cracked walls.'));
}
function pinchSurge(e,dt,d,a){
  const S0=e.surge, p=player, D=foeDiff(), R=c1RoomOf(e); S0.t+=dt;
  if(S0.ph==='warn'){ e.dx=e.dy=0; e.state='roar'; e.st=0.2; e.face=turnTo(e.face,a,3*dt); if(Math.random()<dt*10) shake(1.5); if(S0.t>=3){ S0.ph='on'; S0.t=0; pinchFlood(e,1); SFX.play('boom'); shake(10); fzAdd('c1surge',{x:e.x,y:e.y,owner:e,life:S0.dur+0.5}); c1Txt(e,S('His deck is open! Hit it from a ledge!','Hit his deck from up high!'),'#ffd27a',14); } return true; }
  // the flood: he wades toward Ash (slowly), snaps up at ledges, and the wreck's cannons fire red lines
  e.cd-=dt*D.cdK;
  if(e.mv){ return false; }
  if(d>96) steer(e,p.x,p.y,e.speed*0.55*D.spd); else e.dx=e.dy=0;
  e.face=turnTo(e.face,a,2.4*dt); e.state='chase';
  S0.cn-=dt*D.atk; if(S0.cn<=0){ S0.cn=byDiff(4.4,3.3,2.6); pinchCannons(e,R,byDiff(1,Math.random()<0.5?1:2,2)); }
  if(S0.t>=S0.dur){ e.surge=null; pinchFlood(e,0); e.tiredT=3; e.surgeT=byDiff(22,22,12); c1Txt(e,S('The tide goes out! He is tired!','He is tired! Hit him!'),'#ffe066',16); c1Say(e,'c_pinch',S('Puff. Puff. Admirals do not get tired. Admirals REST.','I am not tired. I am RESTING.'),4); return true; }
  if(e.cd<=0&&d<130){ e.cd=byDiff(2.4,1.9,1.5); return false; }   // let the brain pick a snap
  return true;
}
// cannons: red lines from the wreck's portholes to where Ash stands (the guns cannot turn far: step along the ledge)
function pinchCannons(e,R,n){
  const p=player; if(!R||!R.cannons) return; const list=R.cannons.slice().sort((A,B)=>dist(A.x,A.y,p.x,p.y)-dist(B.x,B.y,p.x,p.y));
  for(let i=0;i<Math.min(n,list.length);i++){ const c=list[i], tx=p.x+(i?rand(-60,60):0), ty=p.y+(i?rand(-40,40):0), ang=angTo(c.x,c.y,tx,ty), len=dist(c.x,c.y,tx,ty)+70; c.fireT=0.9;
    c1Mark({shape:'line',x:c.x,y:c.y,ang,len,w:30,dur:c1W({},0.7)+i*0.15,col:C1COL.red,fire:z=>{ c.boom=0.4; SFX.play('boom'); shake(5); for(let s=0;s<z.len;s+=40) emit(z.x+Math.cos(z.ang)*s,z.y+Math.sin(z.ang)*s,2,{kind:'fire',smin:20,smax:80,lmin:.2,lmax:.4,zmin:2,zmax:4,grow:6});
      if(!player.dead&&segD(player.x,player.y,z.x,z.y,z.x+Math.cos(z.ang)*z.len,z.y+Math.sin(z.ang)*z.len)<z.w/2+player.r*0.5) hurtPlayer(c1Dmg(e,24),z.x+Math.cos(z.ang)*(z.len-60),z.y+Math.sin(z.ang)*(z.len-60),300); }}); }
  c1Say(e,'c_pinch',S('FIRE! Fire the cannons!','FIRE!'),6);
}
// the surge in the room: on the floor (not on a ledge, not in the air) the water drags Ash to the wreck and stings
FZK.c1surge={
  tick(z,dt){ const e=z.owner, p=player; if(!e||e.dead||!e.surge){ z.done=true; return; } if(p.dead||c1Up()||c1Lvl()>=1) return; const D=foeDiff();
    if(!D.easy){ const R=c1RoomOf(e), ty=R?R.wreck.y+R.wreck.h*0.5+30:e.y-200, k=150*dt; if(p.y>ty){ const ny=p.y-k, k0=AREA&&AREA.tri?tCell(p.x,p.y):-1, k1=k0>=0?tCell(p.x,ny):-1, up=k0>=0&&k1>=0&&k1!==k0&&dunH(k1)!==dunH(k0); if(!up&&!playerBlocked(p.x,ny)) p.y=ny; } }
    p.slowT=Math.max(p.slowT||0,0.15); z.tk=(z.tk||0)-dt; if(z.tk<=0){ z.tk=D.easy?1.2:0.7; hurtPlayer(c1Dmg(e,D.easy?5:7),p.x,p.y+10,0); }
    if(!z.said){ z.said=true; ftext(p.x,p.y-40,S('The surge drags you! Climb up!','The water pulls you! Climb!'),'#cfeaff',14); } }
};
function pinchShellOff(e,first){
  e.shellOn=false; e.shell={x:e.x,y:e.y,f:e.face}; e.r=22*(e.r0||40)/40; e.state='recover'; e.st=0.6; e.mv=null; e.tele=null; e.scurT=0; e.scurA=angTo(e.x,e.y,player.x,player.y)+Math.PI; e.scurR=200;
  shake(9); SFX.play('boom'); c1Puff(e.x,e.y-10,'220,190,150',26); c1Txt(e,first?S('POP! Out of his shell!','POP!'):S('Out of the shell again!','Out again!'),'#ffe066',16);
}
function pinchSoft(e,dt,d,a){
  const p=player, D=foeDiff(), C=c1Ctx(e); if(!e.shell) pinchShellOff(e,true);
  e.dx=e.dy=0; const st=e.state;
  if(st==='spinW'){ e.st-=dt; if(e.st>0.2) e.face=turnTo(e.face,a,5*dt); if(e.st<=0){ e.tele=null; e.state='spin'; e.st=2.4; e.sb=byDiff(1,2,2); SFX.play('roll'); } return true; }
  if(st==='spin'){ const s=520*D.spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
    if(!e.spinHit&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+4&&!c1Up()){ if(hurtPlayer(c1Dmg(e,28),e.x,e.y,420)) e.spinHit=true; }
    if(Math.random()<dt*20) emit(e.x,e.y+e.r*0.4,1,{col:'210,190,150',glow:false,smin:20,smax:70,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:6});
    e.st-=dt; if((foeBumped(e)&&e.st<2.3)||e.st<=0){ if(e.sb>0&&e.st>0){ e.sb--; e.face=c1Bounce(e,Math.cos(e.face),Math.sin(e.face)); e._stall=0; e.spinHit=false; shake(6); SFX.play('boom'); return true; }
      e.vx=e.vy=0; pinchShellOff(e,false); e.state='dizzy'; e.st=0.2; e.tiredT=1.5; e.snapAfter=foeDiff().hard?1:0; return true; } return true; }
  if(st==='stompW'){ e.st-=dt; if(e.st<=0){ e.tele=null; c1Wave(e.x,e.y,{dmg:c1Dmg(e,17),max:460,spd:300,thick:18}); shake(6); SFX.play('boom'); e.state='recover'; e.st=0.4; } return true; }
  if(st==='windup'||st==='strike'||st==='recover'&&e.mv) return false;
  if(e.mv) return false;
  if(st==='recover'||st==='dizzy'){ e.st-=dt; if(e.st<=0) e.state='chase'; return true; }
  // in the shell again: spin charge
  if(e.shellOn){ e.state='spinW'; e.st=c1W({},0.7); e.tele=newTele({shape:'line',len:520,w:e.r*1.6,dur:e.st,col:C1COL.red}); e.face=a; return true; }
  if(e.snapAfter>0){ e.snapAfter=0; e.cd=0; return false; }   // Hard: a claw snap after every spin
  // soft and nervous: run circles round the shell, closer and closer; Ash in the way makes him go round again
  const S0=e.shell; e.scurT+=dt; e.scurA+=dt*1.9*D.spd; e.scurR=Math.max(0,e.scurR-dt*34*D.spd);
  const between=segD(p.x,p.y,e.x,e.y,S0.x,S0.y)<48&&dist(e.x,e.y,S0.x,S0.y)>40;
  if(between){ e.scurR=Math.min(220,e.scurR+dt*120); if(!(e._blkT>G.time)){ e._blkT=G.time+2; c1Txt(e,S('Out of my way!','Move!'),'#ffd0b0',12); } }
  const tx=S0.x+Math.cos(e.scurA)*e.scurR, ty=S0.y+Math.sin(e.scurA)*e.scurR; steer(e,tx,ty,e.speed*1.5*D.spd); e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),8*dt); e.state='chase';
  if(dist(e.x,e.y,S0.x,S0.y)<30){ e.shellOn=true; e.r=e.r0||40; e.x=S0.x; e.y=S0.y; e.shell=null; c1Puff(e.x,e.y-14,'220,190,150',16); SFX.play('block'); c1Say(e,'c_pinch',S('HA! Back in the ship!','Back in my ship!'),5); return true; }
  e.waveT-=dt*D.atk; if(e.waveT<=0&&d<420){ e.waveT=byDiff(6,4.6,3.6); e.state='stompW'; e.st=c1W({},0.6); e.tele=newTele({shape:'circle',r:e.r+30,dur:e.st,col:C1COL.orange}); return true; }
  if(d<64&&e.cd<=0){ e.cd=1.4; return false; }
  return true;
}
// ---- Pinch's look: a huge hermit crab in the back half of a shipwreck, an admiral's hat on one eye-stalk
function c1FigPinch(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.c_pinch.r)/40, face=t3Turn(e,e.face,st==='spin'?20:7), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const cr=fl?'#ffffff':foT(e,'#ec8a5a'), crD=foT(e,'#c05a3a'), crL=foT(e,'#f8b088'), wood=foT(e,'#9a6a40'), woodD=foT(e,'#6e4826'), woodL=foT(e,'#c8945a'), brass=foT(e,'#e0b050'), barn='#e4dcc8', soft='#f6b8a4';
  const sp=Math.hypot(e.dx||0,e.dy||0), mv=clamp(sp/80,0,1), dead=foDeath(e), hurt=c1Hurt(e), shell=e.shellOn!==false, spin=st==='spin'||st==='spinW';
  e._wp=(e._wp||0)+dt*sp/(4.5*k);
  // claws: lift (slam wind-up), open (snap wind-up), down (stuck in the sand)
  let lL=0, oL=0.3, lR=0, oR=0.3, rear=0;
  if(st==='windup'){ const q=c1Sm(clamp(1-e.st/0.5,0,1)); if((e.comboI||0)%2===0){ oR=1.4*q; lR=0.4*q; } else { oL=1.4*q; lL=0.4*q; } rear=-0.08*q; }
  else if(st==='strike'){ if((e.comboI||0)%2===0) lR=-0.3; else lL=-0.3; rear=0.08; }
  else if(st==='slamW'){ const q=c1Sm(clamp(inS/0.7,0,1)); lL=1.6*q; oL=0.8; rear=-0.15*q; }
  else if(st==='stuck'){ lL=-1; oL=0.2; rear=0.18; }
  else if(st==='puff'){ rear=-0.05; } else if(st==='roar'){ lL=lR=1.1; oL=oR=1.2; rear=-0.12; }
  else if(st==='dizzy'||st==='stagger'){ lL=lR=-0.6; oL=oR=0.9; }
  const P=foEase(e,'_fpn',foTg(lL,oL,lR,oR,rear),dt,st==='strike'||st==='stuck'?22:10); lL=P[0]; oL=P[1]; lR=P[2]; oR=P[3]; rear=P[4];
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,0,dead*1.5,0,0,0,-dead*4); else if(st==='dizzy'||st==='stagger') foSet(FOB,0,0,Math.sin(t*6)*0.1,0);
  if(spin&&shell){ // rolling inside the ship: the hull spins, only the hull shows
    const rl=e._rl=(e._rl||0)+dt*(st==='spin'?10:2); foSet(FOB,26,0,0,0); foSet(FOA,26,rl,0,0); foUp();
    foE(0,0,26,26,22,24,wood); for(let i=0;i<4;i++){ const a=i*Math.PI/2; foN(Math.cos(a)*26,-22,26+Math.sin(a)*24,Math.cos(a)*26,22,26+Math.sin(a)*24,1.4,woodD,0.02); }
    for(const sd of [-1,1]) foD(0,sd*22.5,26,4,brass,0.04);
    foEnd(26); e._t3top=foTop(fy,52,k); return; }
  // legs: four walking legs a side
  foLow();
  for(const sd of [-1,1]) for(let i=0;i<4;i++){ const ph=e._wp+i*1.6+(sd>0?0:Math.PI), lx=14-i*8, o=Math.sin(ph)*4*mv, lift=Math.max(0,Math.cos(ph))*mv*3;
    foL(lx,sd*14,10,lx+o*0.4,sd*27,15+lift,2.6,crD,2.2); foL(lx+o*0.4,sd*27,15+lift,lx+o,sd*33,1+lift*0.5,2.2,cr,1); }
  foUp(); foSet(FOA,12,rear-hurt*0.12,0,0);
  if(shell){
    // the shipwreck shell: a rounded hull with planks, portholes, barnacles, a deck with a hatch and a broken mast
    const deck=!!(e.surge&&e.surge.ph==='on');
    foE(-14,0,26,26,23,21,wood);
    for(const zz of [16,24,32]) foN(-14+Math.sqrt(Math.max(0,1-((zz-26)/21)**2))*25.5,-20,zz,-14+Math.sqrt(Math.max(0,1-((zz-26)/21)**2))*25.5,20,zz,1.1,woodD,0.02);
    for(const sd of [-1,1]){ for(let i=0;i<3;i++){ const px=-26+i*11; foD(px,sd*21.6,27,3.4,brass,0.04); foD(px,sd*21.9,27,2.2,'#3a5060',0.05); foD(px-0.6,sd*22,27.8,0.7,'#cfe8ff',0.06); }
      for(let i=0;i<5;i++){ const bx=-30+i*7.4+(i%2)*2, bz=14+((i*37)%9); foC(bx,sd*(20+((i*13)%3)),bz,bx,sd*23.4,bz+1.6,1.8,barn,0.03); } }
    foQ([4,-17,44, 4,17,44, -32,17,40, -32,-17,40],woodL,woodD,0.02);
    foQ([-6,-6,45, -6,6,45, -16,6,44.4, -16,-6,44.4],deck?'#ffcf5a':brass,'#7a5a20',0.04);
    if(deck) foGlow(-11,0,46,18,'255,210,90',0.5+0.25*Math.sin(t*6),false);
    foL(-22,4,42,-26,10,70,1.8,woodD,1.4); foL(-26,10,70,-22,16,78,1.2,woodD,0.9);
    foQ([-25,9,66, -25,9,52, -12,22,50, -14,20,62],'#eee4cc','#a89878',0.02);
    foN(-26,10,70,-2,0,46,0.5,'#5a4a3a',0.03);
  } else {
    // out of the shell: a soft curly pink belly, very embarrassed
    foE(-14,0,13,15,12,11,soft,-0.2); for(let i=0;i<3;i++) foN(-20+i*6,-11,15,-20+i*6,11,15,1,'#e09080',0.03); foE(-27,4,9,7,6,6,soft);
  }
  // the front body and the face
  foE(10,0,16,14,15,10,cr); foE(11,0,10,12,13,5,crD,0,0,0,-0.1);
  for(const sd of [-1,1]){
    const ex=20, ey=sd*6, ez=34+Math.sin(t*2+sd)*1.2;
    foL(16,sd*4,22,ex,ey,ez-3,1.4,crD,1.1); foB(ex,ey,ez,3.6,'#ffffff'); foD(ex+3,ey,ez+0.4,1.9,'#1e1420',0.04); foD(ex+3.4,ey-0.6,ez+1.5,0.6,'#ffffff',0.05);
    if(st==='dizzy'||st==='stagger') foN(ex+3.2,ey-1.6,ez+3.6,ex+3.2,ey+1.6,ez+3.2,0.6,'#1e1420',0.06);
    if(sd<0){ // the admiral's hat (a little navy bicorne with gold trim)
      foE(ex,ey,ez+5.4,6.6,2.6,2.4,'#2e3f74'); foN(ex-6,ey,ez+5,ex+6,ey,ez+5,0.6,'#ffcf5a',0.03); foD(ex+0.4,ey-2.4,ez+6.4,1,'#ffcf5a',0.05); }
  }
  foN(24,-3.4,14,24,3.4,14,0.9,'#5a1e14',0.04);
  for(const sd of [-1,1]) foN(23,sd*2,15,28,sd*5,18+Math.sin(t*5+sd),0.4,crD,0.04);
  // the two great claws: the crusher (left, big) and the snapper (right)
  for(const sd of [-1,1]){
    const big=sd<0, lift=big?lL:lR, op=big?oL:oR, sz=big?1.25:1, stuck=big&&st==='stuck';
    const cx=stuck?60:44+Math.max(0,-lift)*10, cy=sd*(stuck?24:30), cz=stuck?4:12+lift*22;
    foL(16,sd*12,14,26,sd*28,12+lift*8,3.2*sz,crD,2.8*sz); foL(26,sd*28,12+lift*8,cx-6,cy,cz,3*sz,cr,2.6*sz);
    foE(cx,cy,cz,9*sz,7*sz,6*sz,stuck?'#ffcf5a':cr,-lift*0.4);
    foC(cx+5*sz,cy-sd*2,cz+2+op*2,cx+16*sz,cy-sd*1,cz+3+op*5,3.4*sz,crL,0.02);
    foC(cx+5*sz,cy+sd*1,cz-2-op*2,cx+14*sz,cy+sd*1.4,cz-3-op*4,2.6*sz,cr,0.01);
    if(stuck) foGlow(cx,cy,cz+4,14,'255,210,90',0.5+0.25*Math.sin(t*7),false);
    for(let i=0;i<3;i++) foD(cx-3+i*3,cy+sd*(6.5*sz),cz+3,0.8,crL,0.05);
  }
  foEnd(20); e._t3top=foTop(fy,shell?58:44,k);
}
function c1Pinch2(e,fl){
  const x=e.x, y=e.y, k=(e.r0||40)/40, f=e.face, cr=fl?'#fff':'#ec8a5a', shell=e.shellOn!==false;
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+10*k,44*k,20*k,0,0,TAU); ctx.fill(); ctx.translate(x,y); ctx.rotate(f); ctx.scale(k,k);
  ctx.strokeStyle='#c05a3a'; ctx.lineWidth=3; for(const s of [-1,1]) for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(12-i*8,s*12); ctx.lineTo(10-i*8,s*32); ctx.stroke(); }
  if(shell){ c1E2(-14,0,26,22,'#9a6a40',0,2); ctx.strokeStyle='#6e4826'; ctx.lineWidth=1.4; for(const yy of [-10,0,10]){ ctx.beginPath(); ctx.moveTo(-36,yy); ctx.lineTo(8,yy); ctx.stroke(); } c1E2(-12,0,6,5,e.surge&&e.surge.ph==='on'?'#ffcf5a':'#e0b050',0,1); ctx.strokeStyle='#6e4826'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-22,4); ctx.lineTo(-40,14); ctx.stroke(); }
  else c1E2(-12,0,15,12,'#f6b8a4',0,1.6);
  c1E2(10,0,14,15,cr,0,1.8);
  for(const s of [-1,1]){ const big=s<0, st=big&&e.state==='stuck', cx=st?60:44, cy=s*(st?24:30), sz=big?1.25:1;
    ctx.lineCap='round'; ctx.strokeStyle=C1OL(); ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(14,s*10); ctx.quadraticCurveTo(26,s*30,cx-6,cy); ctx.stroke(); ctx.strokeStyle='#c05a3a'; ctx.lineWidth=4.4; ctx.stroke();
    c1E2(cx,cy,9*sz,7*sz,st?'#ffcf5a':cr,0,1.6); ctx.fillStyle='#f8b088'; ctx.beginPath(); ctx.moveTo(cx+4,cy-4*s); ctx.lineTo(cx+16*sz,cy-2*s); ctx.lineTo(cx+5,cy); ctx.fill(); c1Eye2(20,s*6,3.4,0); }
  ctx.fillStyle='#2e3f74'; ctx.fillRect(16,-10,9,4); ctx.restore();
}
// ---- the Drowned Lagoon (room decor): the wreck jammed in the north wall with four cannon portholes, a tide gauge,
// and the water of the Surge over the floor (not over the ledges)
C1ROOM.c_pinch={
  build(R){ const w=Math.min(620,(R.x1-R.x0)*0.5), D={R,type:'c_pinch',water:0,waterTo:0,cannons:[]};
    D.wreck={x:R.cx-40,y:R.y0+10,w,h:86}; for(let i=0;i<4;i++) D.cannons.push({x:D.wreck.x-w*0.36+i*w*0.24,y:D.wreck.y+D.wreck.h-6,fireT:0,boom:0});
    D.col=addAreaCol({t:'r',x0:D.wreck.x-w/2,y0:R.y0-4,x1:D.wreck.x+w/2,y1:D.wreck.y+D.wreck.h-14,noProj:false});
    D.floor=c1FloorPath(R); D.ledges=c1Ledges(R); D.gauge={x:R.x0+26,y:R.y0+120}; return D; },
  tick(D,dt){ D.water+=(D.waterTo-D.water)*Math.min(1,dt*(D.waterTo>D.water?0.9:1.6)); for(const c of D.cannons){ if(c.fireT>0) c.fireT-=dt; if(c.boom>0) c.boom-=dt; } },
  ground(D,t){ const R=D.R; if(D.water>0.01){ ctx.save(); ctx.globalAlpha=Math.min(1,D.water)*0.62; ctx.fillStyle='#3a8ab4'; ctx.fill(D.floor); ctx.globalAlpha=Math.min(1,D.water)*0.5; ctx.strokeStyle='rgba(240,250,255,.8)'; ctx.lineWidth=2;
      for(let i=0;i<7;i++){ const yy=R.y1-((t*90+i*160)%(R.y1-R.y0)), xx=R.x0+((i*397)%(R.x1-R.x0)); ctx.beginPath(); ctx.moveTo(xx-50,yy); ctx.quadraticCurveTo(xx,yy-8,xx+50,yy); ctx.stroke(); }
      ctx.restore(); }
    const g=D.gauge, warn=D.waterTo>0&&D.waterTo<1; ctx.save(); ctx.fillStyle=C1OL(); rrect(ctx,g.x-9,g.y-62,18,124,6); ctx.fill(); ctx.fillStyle='#e8dcc0'; rrect(ctx,g.x-7,g.y-60,14,120,5); ctx.fill();
    ctx.fillStyle='#d24a3a'; ctx.fillRect(g.x-7,g.y-60,14,26); ctx.fillStyle='#4a8ad0'; ctx.fillRect(g.x-7,g.y+34,14,26);
    const lv=g.y+52-D.water*104; ctx.fillStyle=warn&&Math.sin(t*14)>0?'#ffe066':'#2a3a4a'; ctx.fillRect(g.x-11,lv-2,22,4); ctx.restore(); },
  tall(D,list){ if(!D.it){ D.it={x:D.wreck.x,y:D.wreck.y+D.wreck.h,draw:()=>c1DrawWreck(D)}; } list.push(D.it); }
};
function c1WreckSpr(w,h){ return sbSprite('c1wreck_'+Math.round(w),Math.max(w,h)*0.62,g=>{
  const hw=w/2, oc=C1OL(); g.lineJoin='round';
  g.fillStyle='#6e4826'; g.beginPath(); g.moveTo(-hw,-h*0.5); g.lineTo(hw,-h*0.55); g.quadraticCurveTo(hw*1.06,h*0.1,hw*0.9,h*0.45); g.lineTo(-hw*0.92,h*0.5); g.quadraticCurveTo(-hw*1.05,0,-hw,-h*0.5); g.closePath(); g.fill(); g.strokeStyle=oc; g.lineWidth=3; g.stroke();
  g.fillStyle='#9a6a40'; g.beginPath(); g.moveTo(-hw*0.96,-h*0.42); g.lineTo(hw*0.96,-h*0.46); g.lineTo(hw*0.88,h*0.3); g.lineTo(-hw*0.9,h*0.34); g.closePath(); g.fill();
  g.strokeStyle='#6e4826'; g.lineWidth=2; for(let i=1;i<5;i++){ const yy=-h*0.42+i*h*0.15; g.beginPath(); g.moveTo(-hw*0.94,yy); g.lineTo(hw*0.94,yy-2); g.stroke(); }
  g.strokeStyle='#5a3a20'; g.lineWidth=5; g.beginPath(); g.moveTo(hw*0.2,-h*0.45); g.lineTo(hw*0.5,-h*1.0); g.stroke(); g.strokeStyle='#c8945a'; g.lineWidth=2; g.stroke();
  g.fillStyle='#e4dcc8'; for(let i=0;i<14;i++){ const x=-hw*0.9+((i*137)%100)/100*hw*1.8, y=h*0.2+((i*53)%30)/30*h*0.25; g.beginPath(); g.arc(x,y,2.6+(i%3),0,TAU); g.fill(); }
},2.6); }
function c1DrawWreck(D){
  const W=D.wreck, s=c1WreckSpr(W.w,W.h); drawSprite(s,W.x,W.y+W.h*0.5,1,0);
  for(const c of D.cannons){ ctx.save(); ctx.fillStyle=C1OL(); ctx.beginPath(); ctx.arc(c.x,c.y-16,13,0,TAU); ctx.fill(); ctx.fillStyle='#e0b050'; ctx.beginPath(); ctx.arc(c.x,c.y-16,11,0,TAU); ctx.fill(); ctx.fillStyle='#2a2a34'; ctx.beginPath(); ctx.arc(c.x,c.y-15,7,0,TAU); ctx.fill();
    if(c.fireT>0){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+0.5*Math.sin(G.time*30); ctx.drawImage(foGlowSpr('255,90,60'),c.x-18,c.y-34,36,36); }
    if(c.boom>0){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=c.boom*2; ctx.drawImage(foGlowSpr('255,200,90'),c.x-34,c.y-50,68,68); } ctx.restore(); }
}
function c1DrawEmptyShell(e){
  const S0=e.shell; if(!S0) return; const k=(e.r0||40)/40;
  T3.on?(()=>{ foBegin(S0.x,S0.y+12,S0.f||0,k,false,0); foE(-6,0,22,26,23,21,'#9a6a40'); foQ([12,-17,40, 12,17,40, -24,17,36, -24,-17,36],'#c8945a','#6e4826',0.02); foL(-14,4,38,-18,10,64,1.8,'#6e4826',1.4);
      for(const sd of [-1,1]) for(let i=0;i<3;i++) foD(-18+i*11,sd*21.6,23,3.2,'#e0b050',0.04); foD(16,0,22,9,'#3a2418',0.05); foEnd(20); })()
    :(()=>{ ctx.save(); c1E2(S0.x,S0.y,28*k,22*k,'#9a6a40',0,2); c1E2(S0.x+12*k,S0.y,8*k,10*k,'#3a2418',0,1); ctx.restore(); })();
}

// ================= 9. Ticktock, the Brass Colossus (c_ticktock), boss of the Brassworks (the Drive Pit)
// The floor is a huge turning gear (it carries Ash round). Phase 1 Tick: TOCK rings on every second step (jump), the
// Fist Hammer (orange circle, then a shock ring), the Gear Toss (red line, a rolling gear), the Steam Vent (white
// cone). THE KEY: his wind-up key glows gold whenever his back is to Ash; grapple it and PULL: he slumps for 3 s with his
// chest clock open (gold, x2). Everything else barely scratches the brass (x0.25).
// Phase 2 Tock: he climbs the shaft and hangs over the pit (out of reach). Piston drops (orange circles), the pendulum
// sweeps across (a long white line: get to the far side, or hang from a ceiling ring). Hang from a ring near him and
// YANK his key: he crashes down, stunned 4 s. (He climbs down by himself after a while if nobody does.)
// Phase 3 Overclock: faster; triple fist hammers; steam storms from the wall pipes. Each slump is a PULL on the key:
// two (Easy) or three yanks pull it all the way out and he winds down.
c1Lines('c_ticktock','c_ticktock_intro','c_brass_won',
  [['narr',S('In the middle of the pit, something enormous and brass is standing very still. Then its eyes light up. Tick. Tock. TICK.','Something huge and brass stands in the pit. Its eyes light up. Tick. Tock. TICK.')],
   ['ash',S('Hi. Big fella. Nice clock.','Hi, big fella. Nice clock.')],
   ['narr',S('The colossus raises both fists.','The giant raises its fists.')]],
  [['narr',S('Ticktock sways, sits down with a sound like a hundred spoons dropping, and goes very still. Then, slowly, very gently, he pats you on the head.','Ticktock sits down with a CLANG. Then he pats you on the head. Gently.')],
   ['c_pearl',S('My Ticktock. I built him to guard my workshop. The dust got in his gears and he forgot who his friends were. He remembers now.','My Ticktock. Dust got in his gears. He remembers his friends now.')],
   ['narr',S('Ticktock ticks. It sounds happy.','Ticktock ticks. He sounds happy.')]]);
function tickKey(e){ return e.p2rings&&e.p2rings[0]; }
function tickSlump(e,how){
  const D=foeDiff(); e.mv=null; e.tele=null; e.slumpT=byDiff(3.6,3,2.6); e.state='open'; e.st=0.2; e.keyGlow=0; e.keyHeld=0; e.hang=false; e.climbT=byDiff(12,10,9); e.keySpin=1.2;
  shake(8); SFX.play('boom'); c1Txt(e,how==='yank'?S('YANK! He crashes down!','CRASH!'):S('The key unwinds! His chest is open!','His chest is open! Hit it!'),'#ffe066',16);
  if(e.bph>=2){ e.yanks=(e.yanks||0)+1; const need=byDiff(2,3,3);
    if(e.yanks>=need){ c1Txt(e,S('The key comes all the way out!','The key is out!'),'#ffe066',18); e.windDown=1.6; return; }
    setBanner(S('PULL!','PULL!'),S(`${need-e.yanks} more pull${need-e.yanks>1?'s':''} on the key!`,`${need-e.yanks} more!`),2); }
}
function tickYankDown(e){ if(!e.hang) return; e.hangCrash=true; e.hang=false; tickSlump(e,'yank'); e.slumpT=byDiff(4.4,4,3.4); e.z=e.z||100; e.crashZ=e.z; }
// gear toss: a red line, then a gear rolls along it and bounces once off a wall (jump it or step aside)
FZK.c1gear={
  tick(z,dt){ const p=player; z.x+=Math.cos(z.a)*z.sp*dt; z.y+=Math.sin(z.a)*z.sp*dt; z.spin=(z.spin||0)+dt*z.sp/18;
    if(c1Solid(z.x+Math.cos(z.a)*16,z.y+Math.sin(z.a)*16)){ if(z.b>0){ z.b--; const hx=c1Solid(z.x+Math.cos(z.a)*18,z.y), hy=c1Solid(z.x,z.y+Math.sin(z.a)*18); z.a=Math.atan2(hy?-Math.sin(z.a):Math.sin(z.a),hx?-Math.cos(z.a):Math.cos(z.a)); if(!hx&&!hy) z.a+=Math.PI; SFX.play('block'); shake(3); } else { z.done=true; emit(z.x,z.y,14,{col:'230,200,120',smin:60,smax:200,lmin:.2,lmax:.5,zmin:1.5,zmax:3}); SFX.play('boom'); return; } }
    if(!z.hit&&!p.dead&&!c1Up()&&dist(z.x,z.y,p.x,p.y)<z.r+p.r){ z.hit=true; hurtPlayer(z.dmg,z.x,z.y,300); } },
  tall(z,list){ if(!z.it) z.it={draw:()=>{ ctx.save(); ctx.translate(z.x,z.y-z.r*0.9); ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0,z.r*0.9,z.r,z.r*0.35,0,0,TAU); ctx.fill(); ctx.scale(1,0.92);
      ctx.rotate(z.spin); ctx.fillStyle='#d8a848'; ctx.beginPath(); for(let i=0;i<20;i++){ const a=i/20*TAU, rr=i%2?z.r:z.r*0.8; ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle=C1OL(); ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#a07030'; ctx.beginPath(); ctx.arc(0,0,z.r*0.35,0,TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }}; z.it.x=z.x; z.it.y=z.y; list.push(z.it); }
};
FM.c1gearToss={
  start(e,m){ const o=m.o; e.state='toss'; e.st=fkW(o,0.6); e.tele=newTele({shape:'line',len:500,w:44,dur:e.st,col:C1COL.red}); },
  tick(e,dt,d,a,m){ const o=m.o; if(e.st>0.15) e.face=turnTo(e.face,a,3*dt); e.st-=dt; if(e.st>0) return false; e.tele=null;
    fzAdd('c1gear',{x:e.x+Math.cos(e.face)*(e.r+20),y:e.y+Math.sin(e.face)*(e.r+20),a:e.face,sp:390*foeDiff().spd,r:22,b:1,dmg:fkDmg(e,o),life:5}); SFX.play('throw'); return true; } };
// three fist hammers in a row (each re-aimed at Ash)
FM.c1slams={
  start(e,m){ m.i=0; m.n=m.o.n||3; FM.c1slam.start(e,m); },
  tick(e,dt,d,a,m){ if(!FM.c1slam.tick(e,dt,d,a,m)) return false; if(++m.i>=m.n) return true; FM.c1slam.start(e,m); return false; } };
Object.assign(FM_DEF,{c1gearToss:{recover:0.6},c1slams:{recover:0.8,then:(e,m)=>{ c1Wave(m.x,m.y,{dmg:c1Dmg(e,15),max:360,spd:340,thick:16,ledge:false}); }}});
const TICK_AI=FK.brain({move:'approach',stop:96,turn:0.0001,cd:[0.9,1.6],recoverMove:0.15,pre:tickPre,
  moves:[{k:'c1slam',off:70,r:98,windup:0.9,dmgN:26,max:240,w:2.6,st:'slamW',shake:10,then:(e,m)=>{ c1Wave(m.x,m.y,{dmg:c1Dmg(e,17),max:440,spd:320,thick:18,ledge:false}); }},
         {k:'c1gearToss',min:150,max:620,windup:0.6,dmgN:20,w:2,every:3},
         {k:'breath',st:'breathW',st2:'breath',len:240,half:0.5,dur:0.8,frost:true,dmgN:10,windup:1.0,col:'255,255,255',max:260,w:1.6,every:4},
         {k:'c1slams',ph:2,n:3,off:66,r:92,windup:0.6,dmgN:24,max:300,w:3}]});
defineFoe('c_ticktock',{boss:true,name:'Ticktock',title:S('The Brass Colossus, Fully Wound Up','the brass giant'),short:'Ticktock',
  lv:11,hp:4200,r:44,speed:70,dmg:20,value:1000,kbRes:0,dcol:'226,176,80',phases:[0.66,0.33],
  phaseText:[[S('Tock!','Tock!'),S('He climbs the shaft! Mind the pendulum. Hang from a ring near him and YANK his key!','He climbs up! Hang from a ring and pull his key!'),['c_pearl',S('Ticktock! Come down from there this minute!','Ticktock! Come down!')]],
             [S('Overclock!','Too fast!'),S('Faster ticking! Each time he slumps, his key comes out a little more. Pull it out!','He is fast now! Pull the key out!'),['c_pearl',S('The key, Ash! Pull it all the way out and he can rest.','Pull the key all the way out!')]]],
  init(e){ c1BossInit(e); e.p2rings=[{dx:0,dy:0,h:70,need:byDiff(0.45,0.55,0.65),repeat:true,done:true,onPull(o,foe){ foe.keyHeld=0.3; },then(o,foe){ tickSlump(foe); }}]; e.keyGlow=0; e.stepT=0; e.stepN=0; e.climbT=999; e.yanks=0; e.z=0; e.pipeT=4; },
  onPhase(e,i){ const D=c1RoomOf(e); if(D){ D.gearSpd=i>=1?60:40; if(foeDiff().hard) D.dir*=-1; } if(i===1){ e.climbT=0.4; } if(i===2){ e.speed*=1.25; e.climbT=999; e.hang=false; e.stormT=2; } },
  ai:TICK_AI,
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(e.hang||e.climbing){ if(!(e._hiT>G.time)){ e._hiT=G.time+1.4; c1Txt(e,S('Too high! Hang from a ring and yank his key!','Too high! Use a ring!'),'#ffd27a',13); } return false; }
    let a=amt; if(e.slumpT>0) a=amt*2; else { a=amt*0.25; if(!(e._brT>G.time)){ e._brT=G.time+1.8; c1Txt(e,S('CLANG! Pull his key first!','CLANG! Pull his key!'),'#e8d8b0',12); } }
    if(e.bph>=2&&(e.yanks||0)<byDiff(2,3,3)) a=c1Floor(e,a,o,0.06);
    return a; },
  lift(e){ return e.z||0; },
  draw3d:c1FigTick, draw2d:c1Tick2b,
  sheet:c1Sheet([{state:'chase',label:'idle'},{state:'chase',dx:60,label:'walk'},{state:'slamW',st:0.4,at:0.6,label:'fist windup'},{state:'recover',st:0.3,_pst:'slamW',at:0.08,label:'fist'},{state:'breathW',st:0.5,label:'steam'},{state:'toss',st:0.3,label:'gear toss'},
         {state:'chase',keyGlow:1,label:'key glows'},{state:'open',slumpT:2,label:'slumped'},{state:'hang',hang:true,label:'hanging'},{state:'chase',deathT:0.3,label:'death'}])});
function tickPre(e,dt,d,a){
  const p=player, D=foeDiff(), R=c1RoomOf(e), K=tickKey(e), C=c1Ctx(e);
  if(e.windDown>0){ e.windDown-=dt; e.dx=e.dy=0; e.state='open'; e.st=0.2; e.keySpin=3; if(e.windDown<=0){ e.hp=0; killEnemy(e); } return true; }
  // the key: it glows gold while his back is to Ash (on Easy a glow lasts at least 2 s)
  const back=Math.abs(angDiff(e.face,a))>1.95&&!e.hang&&!(e.slumpT>0);
  if(back) e.keyGlow=Math.max(e.keyGlow||0,D.easy?2:0.35); else if(e.keyGlow>0) e.keyGlow-=dt;
  if(e.keyHeld>0) e.keyHeld-=dt;
  if(K){ K.dx=-Math.cos(e.face)*e.r*0.75; K.dy=-Math.sin(e.face)*e.r*0.75; K.h=70+(e.z||0); K.done=!(e.keyGlow>0)||e.slumpT>0||e.hang||e.phaseT>0; }
  if(e.keySpin>0) e.keySpin-=dt;
  // he turns slowly toward Ash (not while the key is being pulled)
  if(!(e.keyHeld>0)&&!e.mv) e.face=turnTo(e.face,a,byDiff(0.9,1.2,1.7)*dt*(e.bph>=2?1.3:1));
  if(e.keyHeld>0){ e.dx=e.dy=0; if(e.mv){ fkAbort(e); e.state='recover'; e.st=0.3; } e.state='strain'; e.st=0.2; return true; }
  // a slump: chest open, x2
  if(e.slumpT>0){ e.slumpT-=dt; e.dx=e.dy=0; e.state='open'; e.st=0.2; if(e.z>0){ e.z=Math.max(0,e.z-dt*420); if(e.z<=0&&e.hangCrash){ e.hangCrash=false; shake(14); SFX.play('boom'); c1Wave(e.x,e.y,{dmg:0,max:300,spd:520,thick:14,ledge:false}); emit(e.x,e.y,30,{col:'200,170,110',glow:false,smin:60,smax:260,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:6}); } }
    if(e.slumpT<=0){ e.state='recover'; e.st=0.6; e.cd=0.4; } return true; }
  // phase 3: steam storms from the wall pipes
  if(e.bph>=2&&R){ e.stormT-=dt*D.atk; if(e.stormT<=0){ e.stormT=byDiff(11,8.5,7); tickStorm(e,R); } }
  else if(R){ e.pipeT-=dt*D.atk; if(e.pipeT<=0){ e.pipeT=byDiff(5,3.6,3); tickPipe(R,R.pipes[(Math.random()*R.pipes.length)|0],e); } }
  // phase 2: climb up the shaft and hang over the pit
  if(e.bph===1){
    if(e.climbing){ e.dx=e.dy=0; e.state='hang'; e.st=0.2; e.z=Math.min(110,(e.z||0)+dt*110); if(e.z>=110){ e.climbing=false; e.hang=true; e.hangT=byDiff(12,16,18); e.pistonT=1.6; c1Txt(e,S('He hangs from the shaft!','He climbs up!'),'#ffd27a',14); } return true; }
    if(e.hang){ e.state='hang'; e.st=0.2; e.hangT-=dt; const q={x:p.x,y:p.y}; c1Hold(C,q,140); const cx=R?R.cx:C.cx, cy=R?R.cy:C.cy, lim=(R?R.RG:300)*0.55; if(dist(q.x,q.y,cx,cy)>lim){ const an=angTo(cx,cy,q.x,q.y); q.x=cx+Math.cos(an)*lim; q.y=cy+Math.sin(an)*lim; }
      steer(e,q.x,q.y,52*D.spd); e.noClip=true;
      e.pistonT-=dt*D.atk; if(e.pistonT<=0){ e.pistonT=byDiff(4.4,3.2,2.6); tickPistons(e); }
      if(e.hangT<=0){ e.hang=false; e.climbDown=true; c1Txt(e,S('He climbs down.','He climbs down.'),'#e8d8b0',13); }
      return true; }
    if(e.climbDown){ e.dx=e.dy=0; e.state='hang'; e.z=Math.max(0,(e.z||0)-dt*160); if(e.z<=0){ e.climbDown=false; e.noClip=false; e.climbT=byDiff(12,10,9); e.state='recover'; e.st=0.6; shake(6); SFX.play('boom'); } return true; }
    e.noClip=false; e.climbT-=dt*D.atk; if(e.climbT<=0&&e.state==='chase'){ e.climbing=true; e.mv=null; e.tele=null; SFX.play('warn'); c1Say(e,'c_pearl',S('He is going up the shaft! Find a ring!','He is climbing! Find a ring!'),6); return true; }
  }
  // the ticking walk: every second step a TOCK ring rolls out (jump it)
  if(Math.hypot(e.dx,e.dy)>5||e.state==='chase'){ e.stepT-=dt*(e.bph>=2?1.35:1); if(e.stepT<=0){ e.stepT=0.55; e.stepN++; SFX.play('step',1.6); if(e.stepN%2===0&&d<520){ c1Wave(e.x,e.y,{dmg:c1Dmg(e,10),max:byDiff(150,180,210),spd:240,thick:13,col:C1COL.orange,ledge:false}); if(!(e._tkT>G.time)){ e._tkT=G.time+5; c1Txt(e,S('TOCK!','TOCK!'),'#ffcf7a',14); } shake(2); } } }
  bossCad(e,e.bph>=2?0.7:e.bph>=1?0.85:1);
  return false;
}
// piston drops: three orange circles in a row from where he hangs toward Ash
function tickPistons(e){ const p=player, a=angTo(e.x,e.y,p.x,p.y), dd=dist(e.x,e.y,p.x,p.y);
  for(let i=0;i<3;i++){ const s=Math.min(dd,80+i*140)+(i===2?rand(0,40):0), x=e.x+Math.cos(a)*s, y=e.y+Math.sin(a)*s;
    c1Mark({x,y,r:58,dur:c1W({},0.8)+i*0.35,col:C1COL.orange,fire:z=>{ shake(6); SFX.play('boom'); emit(z.x,z.y,16,{col:'200,170,110',glow:false,smin:50,smax:180,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:6}); if(!player.dead&&!c1Up()&&dist(z.x,z.y,player.x,player.y)<z.r+player.r*0.5) hurtPlayer(c1Dmg(e,24),z.x,z.y,300); }}); }
}
// wall pipes: a gauge ticks to red, then steam pours into the pit (a white cone)
function tickPipe(R,P,e){ if(!P) return; const T=c1W({},0.9); P.warn=T; c1Mark({shape:'cone',x:P.x,y:P.y,ang:P.a,len:190,half:0.34,dur:T,col:C1COL.white,fire:z=>{ P.on=1.0; P.e=e; }}); }
function tickStorm(e,R){ const T=c1W({},1.1); for(const P of R.pipes) tickPipe(R,P,e); setBanner(S('Steam storm!','Steam storm!'),S('Read the gauges. Stand where no pipe points!','Stand where no pipe points!'),2);
  for(let w=1;w<=3;w++) later(T+w*1.7,()=>{ if(!e.dead&&!(e.slumpT>0)){ const L=R.pipes.slice().sort(()=>Math.random()-0.5); tickPipe(R,L[0],e); tickPipe(R,L[1],e); } }); }
// ---- Ticktock's look: a giant brass guardian with a clock face for a chest, stovepipe arms, a wind-up key on his back
function c1FigTick(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.c_ticktock.r)/44, face=t3Turn(e,e.face,5), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const br=fl?'#ffffff':foT(e,'#dcaa4c'), brD=foT(e,'#a8782e'), brL=foT(e,'#f4d488'), iron=foT(e,'#7a8494'), ironD=foT(e,'#5a6272'), face0='#f4ecd2';
  const sp=Math.hypot(e.dx||0,e.dy||0), mv=clamp(sp/50,0,1), dead=foDeath(e), hurt=c1Hurt(e), hang=st==='hang'||e.hang, open=st==='open'||e.slumpT>0, glow=(e.keyGlow||0)>0;
  e._wp=(e._wp||0)+dt*sp/(6*k);
  let fu=0, lean=0, stem=0, sq=0;
  if(st==='slamW'){ fu=c1Sm(clamp(inS/0.6,0,1)); lean=-0.08*fu; } else if(st==='recover'&&(e._pst==='slamW')&&inS<0.4){ fu=-0.6*(1-inS/0.4); lean=0.18*(1-inS/0.4); }
  else if(st==='breathW'||st==='breath'){ stem=1; lean=-0.05; } else if(st==='toss'){ fu=0.3; } else if(open){ lean=0.32; } else if(st==='strain'){ lean=-0.12+Math.sin(t*30)*0.03; }
  const P=foEase(e,'_ftk',foTg(fu,lean,stem),dt,st==='recover'?22:9); fu=P[0]; lean=P[1]; stem=P[2];
  const z=0;
  foBegin(fx,fy,face,k,fl,z);
  if(dead) foSet(FOB,0,dead*0.9,0,0,0,0,-dead*8); else if(st==='strain') foSet(FOB,0,0,Math.sin(t*25)*0.04,0);
  // legs: stovepipes with riveted bands and round feet (dangling while he hangs)
  foLow();
  for(const sd of [-1,1]){ const g=e._wp+(sd>0?0:Math.PI), o=hang?Math.sin(t*2+sd)*3:Math.sin(g)*6*mv, lift=hang?0:Math.max(0,Math.cos(g))*mv*4;
    foL(0,sd*10,30,o*0.5,sd*11,14+lift,5.4,iron,4.8); foL(o*0.5,sd*11,14+lift,o,sd*11,5+lift,4.8,ironD,4.6); foE(o+2,sd*11,3+lift*0.7,8,6,4,brD);
    foY(o*0.5,sd*11,13+lift,5.3,5.3,1.6,brD,null,0.01); }
  foUp(); foSet(FOA,32,lean-hurt*0.08,0,0);
  // the boiler body, rivets, the moth dust leaking from the joints
  foY(0,0,28,20,17,34,br,brD); for(const zz of [32,44,56]) foY(0,0,zz,zz===44?20.4:19.4,zz===44?20.4:19.4,1.4,brD,null,0.01);
  for(let i=0;i<8;i++){ const an=i/8*TAU; foD(Math.cos(an)*19.6,Math.sin(an)*19.6,38,0.9,brL,0.04); }
  foB(0,0,62,15,brD);
  // the chest clock: a white face with numbers and hands (they spin when he is angry); it swings open in a slump
  const hs=t*(e.bph>=2?6:e.bph>=1?2:0.5)+(st==='slamW'?t*4:0);
  if(open){ foQ([14,-14,58, 14,-14,32, 6,-24,32, 6,-24,58],face0,'#a8987a',0.05); foE(18,0,45,2,12,12,'#ffcf5a',0,0,0,0.04); foGlow(20,0,45,18,'255,200,90',0.7,false); for(let i=0;i<5;i++) foD(19.6,-6+i*3,40+((i*7)%9),1.4,'#a07030',0.06); }
  else{ foE(18.4,0,45,1.6,12.6,12.6,face0); for(let i=0;i<12;i++){ const an=i/12*TAU; foD(19.8,Math.cos(an)*10.4,45+Math.sin(an)*10.4,0.7,'#3a2a20',0.06); }
    foN(19.9,0,45,19.9,Math.cos(hs)*9,45+Math.sin(hs)*9,0.9,'#2a2020',0.07); foN(19.95,0,45,19.95,Math.cos(hs*0.08+1)*6,45+Math.sin(hs*0.08+1)*6,1.2,'#2a2020',0.07); foD(20,0,45,1.3,'#c8322a',0.08);
    foY(18,0,32,4.4,4.4,1.4,brD,null,0.03); }
  if(stem>0.1){ foD(19,0,32,3.4*stem,'#ffffff',0.08); }
  // the head: a small dome with two lamp eyes and a chimney
  foB(1,0,76,10,br); foY(-2,0,84,3.4,3.8,6,ironD,'#3e4652'); foY(-2,0,90,4.6,4.6,1.2,iron,null,0.01);
  const eye=open?'#ffb050':e.bph>=2?'#ff6a3a':'#ffe066';
  for(const sd of [-1,1]) c1Lamp(9.6,sd*4,77,2.2,eye,0.5);
  foN(10.4,-3,72.6,10.4,3,72.6,1,'#5a3a14',0.06);
  // arms: stovepipes with round riveted fists. Fist Hammer: both fists high, then down
  for(const sd of [-1,1]){
    let hx, hy, hz;
    if(hang){ hx=2; hy=sd*10; hz=112; }
    else if(open){ hx=16; hy=sd*22; hz=12; }
    else{ const sw=Math.sin(e._wp+(sd>0?Math.PI:0))*5*mv; hx=8+sw+fu*-4; hy=sd*(26-fu*12); hz=26+fu*64; if(st==='toss'&&sd>0){ hx=22; hz=50; } }
    const ex=(hx+2)/2, ey=(hy+sd*21)/2+sd*4, ez=(hz+58)/2;
    foL(0,sd*20,58,ex,ey,ez,5,iron,4.4); foL(ex,ey,ez,hx,hy,hz+4,4.4,ironD,4.2); foB(hx,hy,hz,8.6,br); for(let i=0;i<4;i++){ const an=i*Math.PI/2+0.4; foD(hx+Math.cos(an)*7.4,hy+Math.sin(an)*7.4,hz+2,0.9,brL,0.04); }
  }
  if(hang) foL(2,0,112,2,0,180,3.2,ironD,3.2);
  // the wind-up key on his back: gold and glowing while it can be grabbed; it spins when pulled
  const kspin=(e.keySpin>0?t*14:t*0.8), kc=glow?'#ffd84a':brL;
  foL(-18,0,50,-30,0,52,2.4,brD,2.2);
  foE(-32,0,52+Math.abs(Math.sin(kspin))*0.5,1.6,1.4+Math.abs(Math.cos(kspin))*7,8,kc,0,0,0,-0.05);
  foD(-32.6,0,52,2.6,brD,-0.04);
  if(glow) foGlow(-32,0,52,20,'255,210,80',0.6+0.3*Math.sin(t*8),false);
  // a few grains of moth dust on the joints
  for(let i=0;i<3;i++){ const ph=(t*0.7+i*0.33)%1, s=Math.sin((t*9+i*3))>0; if(s) foD(-6+i*6,(i-1)*14,60-ph*20,0.8,'#d8d4ec',0.06); }
  foEnd(40); e._t3top=foTop(fy,hang?96:94,k,0);
}
function c1Tick2b(e,fl){
  const x=e.x, y=e.y, k=(e.r0||44)/44, f=e.face, br=fl?'#fff':'#dcaa4c', open=e.slumpT>0;
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+10,48*k,20*k,0,0,TAU); ctx.fill(); ctx.translate(x,y); ctx.rotate(f); ctx.scale(k,k);
  for(const s of [-1,1]) c1E2(6,s*28,9,9,'#dcaa4c',0,2);
  c1E2(0,0,22,20,br,0,2.4); c1E2(16,0,6,12,open?'#ffcf5a':'#f4ecd2',0,1.6); ctx.strokeStyle='#2a2020'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(17,0); ctx.lineTo(17+Math.cos(e.t||0)*4,Math.sin(e.t||0)*8); ctx.stroke();
  c1E2(-30,0,4,9,(e.keyGlow||0)>0?'#ffd84a':'#f4d488',0,1.6); ctx.fillStyle='#a8782e'; ctx.fillRect(-26,-2,8,4);
  ctx.restore();
}
// ---- the Drive Pit (room decor): the floor gear, four ceiling rings, eight steam pipes, the shaft and the pendulum
C1ROOM.c_ticktock={
  build(R,A){ const hw=(R.x1-R.x0)/2, hh=(R.y1-R.y0)/2, RG=Math.min(hw,hh)*0.94, D={R,type:'c_ticktock',RG,gearA:0,gearSpd:0,dir:1,pipes:[],rings:[],pend:{on:false,a:0,u:-1,t:0}};
    const C=typeof p2Cave==='function'?p2Cave(A):null;
    for(let i=0;i<4;i++){ const an=Math.PI/4+i*Math.PI/2, x=R.cx+Math.cos(an)*RG*0.6, y=R.cy+Math.sin(an)*RG*0.6;
      const o={k:'p2_ring',p2:'ring',x,y,id:`c1_${R.id}_ring${i}`,room:R.id,h:74,hang:true,cave:true,lvl:null}; A.objs.push(o); if(C) C.rings.push(o); A.lights.push({x,y:y-40,r:110,i:0.35}); D.rings.push(o); }
    for(let i=0;i<8;i++){ const an=i/8*TAU+Math.PI/8, cx=Math.cos(an), cy=Math.sin(an), s=Math.min(Math.abs(hw/cx||1e9),Math.abs(hh/cy||1e9))-26; D.pipes.push({x:R.cx+cx*s,y:R.cy+cy*s,a:an+Math.PI,warn:0,on:0,e:null}); }
    D.col=addAreaCol({t:'c',x:R.cx,y:R.cy,r:30}); return D; },
  tick(D,dt){ const p=player, e=G.boss&&G.boss.type==='c_ticktock'&&!G.boss.dead&&G.boss.c1room===D.R?G.boss:null;
    const w=e?(D.gearSpd||40)/D.RG:0; D.gearA+=w*D.dir*dt;
    if(e&&!p.dead&&!c1Up()&&!(typeof P2!=='undefined'&&P2.mv)&&dist(p.x,p.y,D.R.cx,D.R.cy)<D.RG){ const a=angTo(D.R.cx,D.R.cy,p.x,p.y), r=dist(D.R.cx,D.R.cy,p.x,p.y), na=a+w*D.dir*dt, nx=D.R.cx+Math.cos(na)*r, ny=D.R.cy+Math.sin(na)*r; if(!playerBlocked(nx,ny)){ p.x=nx; p.y=ny; } }
    for(const P of D.pipes){ if(P.warn>0) P.warn-=dt; if(P.on>0){ P.on-=dt; if(Math.random()<dt*30) emit(P.x+Math.cos(P.a)*14,P.y+Math.sin(P.a)*14,1,{col:'245,245,250',glow:false,ang:P.a,spread:0.3,smin:220,smax:320,lmin:.4,lmax:.6,zmin:3,zmax:6,grow:16,drag:1});
        P.tk=(P.tk||0)-dt; if(P.tk<=0&&!p.dead&&inCone(P.x,P.y,P.a,190,0.34,p.x,p.y,p.r)&&!(typeof p2Shadowed==='function'&&p2Shadowed())){ P.tk=0.25; hurtPlayer(c1Dmg(P.e||e,7),P.x,P.y,220); } } }
    // the pendulum: from phase 2 it swings across the pit every 6 s (Easy 9); a long white line shows its path first
    const Pd=D.pend; if(e&&e.bph>=1&&!e.dead){ Pd.t-=dt*foeDiff().atk; if(!Pd.on&&Pd.t<=0){ Pd.on=true; Pd.u=-1; Pd.a=angTo(D.R.cx,D.R.cy,p.x,p.y)+Math.PI/2+rand(-0.4,0.4); Pd.warnT=c1W({},1.0); Pd.dir=Math.random()<0.5?1:-1; const L=D.RG*1.9;
        c1Mark({shape:'line',x:D.R.cx-Math.cos(Pd.a)*L/2,y:D.R.cy-Math.sin(Pd.a)*L/2,ang:Pd.a,len:L,w:96,dur:Pd.warnT,col:C1COL.white}); SFX.play('warn'); }
      if(Pd.on){ if(Pd.warnT>0){ Pd.warnT-=dt; } else { Pd.u+=dt*1.6; const bx=D.R.cx+Math.cos(Pd.a)*Pd.u*D.RG*0.95, by=D.R.cy+Math.sin(Pd.a)*Pd.u*D.RG*0.95; Pd.bx=bx; Pd.by=by;
          if(!Pd.hit&&!p.dead&&!c1Up()&&dist(bx,by,p.x,p.y)<52+p.r){ Pd.hit=true; hurtPlayer(c1Dmg(e,30),bx,by,520); }
          if(Pd.u>=1){ Pd.on=false; Pd.hit=false; Pd.t=byDiff(9,6,6); } } } }
    else { Pd.on=false; Pd.t=1.5; } },
  ground(D,t){ const R=D.R, x=R.cx, y=R.cy, RG=D.RG, a=D.gearA; ctx.save();
    ctx.fillStyle='rgba(30,20,10,.25)'; ctx.beginPath(); ctx.arc(x,y+8,RG+18,0,TAU); ctx.fill();
    ctx.translate(x,y); ctx.rotate(a); const n=40; ctx.beginPath(); for(let i=0;i<n*2;i++){ const an=i/(n*2)*TAU, rr=i%2?RG:RG-20; ctx.lineTo(Math.cos(an)*rr,Math.sin(an)*rr); } ctx.closePath();
    ctx.fillStyle='#b8873e'; ctx.fill(); ctx.strokeStyle=C1OL(); ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle='#c99a4c'; ctx.beginPath(); ctx.arc(0,0,RG-34,0,TAU); ctx.fill(); ctx.strokeStyle='#8a6a30'; ctx.lineWidth=2.5; ctx.stroke();
    ctx.strokeStyle='rgba(120,80,30,.5)'; ctx.lineWidth=24; for(let i=0;i<6;i++){ const an=i/6*TAU; ctx.beginPath(); ctx.moveTo(Math.cos(an)*60,Math.sin(an)*60); ctx.lineTo(Math.cos(an)*(RG-50),Math.sin(an)*(RG-50)); ctx.stroke(); }
    ctx.fillStyle='rgba(255,240,200,.18)'; for(let i=0;i<6;i++){ const an=i/6*TAU+TAU/12; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,RG-50,an-0.18,an+0.18); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle='#9a6e30'; ctx.beginPath(); ctx.arc(0,0,64,0,TAU); ctx.fill(); ctx.strokeStyle=C1OL(); ctx.lineWidth=2.5; ctx.stroke();
    ctx.fillStyle='#e8c068'; for(let i=0;i<12;i++){ const an=i/12*TAU; ctx.beginPath(); ctx.arc(Math.cos(an)*(RG-46),Math.sin(an)*(RG-46),5,0,TAU); ctx.fill(); }
    ctx.restore();
    for(const P of D.pipes){ ctx.save(); ctx.translate(P.x,P.y); ctx.rotate(P.a); ctx.fillStyle=C1OL(); rrect(ctx,-14,-12,30,24,6); ctx.fill(); ctx.fillStyle='#8a94a6'; rrect(ctx,-12,-10,26,20,5); ctx.fill(); ctx.fillStyle='#5a6272'; ctx.fillRect(10,-9,6,18); ctx.restore();
      const gx=P.x-Math.cos(P.a)*6, gy=P.y-Math.sin(P.a)*6-26, w=P.warn>0?1-P.warn/0.9:P.on>0?1:0, na=-2.4+w*2.0; ctx.save(); ctx.fillStyle=C1OL(); ctx.beginPath(); ctx.arc(gx,gy,10,0,TAU); ctx.fill(); ctx.fillStyle='#f4ecd2'; ctx.beginPath(); ctx.arc(gx,gy,8.4,0,TAU); ctx.fill();
      ctx.fillStyle='#d24a3a'; ctx.beginPath(); ctx.moveTo(gx,gy); ctx.arc(gx,gy,8,-0.9,-0.1); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#2a2020'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx+Math.cos(na)*7,gy+Math.sin(na)*7); ctx.stroke(); ctx.restore(); } },
  tall(D,list){ if(!D.it){ D.it={x:D.R.cx,y:D.R.cy+10,draw:()=>c1DrawShaft(D)}; D.it2={x:0,y:0,flying:true,draw:()=>c1DrawPendulum(D)}; } list.push(D.it); const Pd=D.pend; if(Pd.on&&Pd.warnT<=0){ D.it2.x=Pd.bx; D.it2.y=Pd.by; list.push(D.it2); } }
};
function c1DrawShaft(D){ const x=D.R.cx, y=D.R.cy, H=170; ctx.save(); ctx.fillStyle=C1OL(); rrect(ctx,x-26,y-H-6,52,H+14,10); ctx.fill(); ctx.fillStyle='#8a94a6'; rrect(ctx,x-23,y-H-3,46,H+8,8); ctx.fill(); ctx.fillStyle='#a8b2c2'; ctx.fillRect(x-17,y-H,10,H); ctx.fillStyle='#5a6272';
  for(let i=0;i<5;i++){ const yy=y-H+12+i*34+((D.gearA*40)%34); if(yy<y) ctx.fillRect(x-23,yy,46,5); } ctx.fillStyle='#d8a848'; ctx.beginPath(); ctx.ellipse(x,y,30,12,0,0,TAU); ctx.fill(); ctx.strokeStyle=C1OL(); ctx.lineWidth=2; ctx.stroke(); ctx.restore(); }
function c1DrawPendulum(D){ const Pd=D.pend, x=Pd.bx, y=Pd.by, top=D.R.cy-170; ctx.save(); ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x,y+4,46,18,0,0,TAU); ctx.fill();
  ctx.strokeStyle=C1OL(); ctx.lineWidth=9; ctx.beginPath(); ctx.moveTo(D.R.cx,top); ctx.lineTo(x,y-34); ctx.stroke(); ctx.strokeStyle='#8a94a6'; ctx.lineWidth=5; ctx.stroke();
  ctx.fillStyle=C1OL(); ctx.beginPath(); ctx.ellipse(x,y-34,40,30,0,0,TAU); ctx.fill(); ctx.fillStyle='#e0b050'; ctx.beginPath(); ctx.ellipse(x,y-34,37,27,0,0,TAU); ctx.fill(); ctx.fillStyle='#f6d68a'; ctx.beginPath(); ctx.ellipse(x-10,y-42,14,8,-0.4,0,TAU); ctx.fill(); ctx.restore(); }

// ================= 10. The Gloomwing (c_gloomwing), boss of the Spinning Lighthouse (the Lamp Room)
// Phase 1 Darkness: it flies high (blades barely reach: x0.2, arrows x0.6). Eye-spot stare (violet cone: no fire for
// 3 s), moth swarms, dust dives (red line). THE MIRRORS: moonlight comes in through the broken window onto mirror 1;
// hit a mirror to turn it 45 degrees. Bounce the moonbeam round the room: when the beam touches the Gloomwing it falls,
// stunned 3 s (x1.5). On Easy mirror 1 already points the right way. On Hard a mirror slips back a step 14 s after
// it was last turned.
// Phase 2 Shadow: it sinks into its shadow under the glass (nothing can hurt it) and rises with a swipe where its
// shadow darkens. SHADOW DASH into its shadow: Ash pops out under it and knocks it up, stunned 2.5 s.
// Phase 3 The Lamp: it smothers the great lamp. Breathe fire on the wick for 3 s (1 s with Fennick's lamp oil) while
// it slaps at you. The lamp lights, the lens turns, the beam sweeps the room: each touch knocks it down for 2 s. It
// hides in the shadow behind the beam: dash after it. When the lamp goes out it smothers it again.
c1Lines('c_gloomwing','c_gloomwing_intro','c_light_won',
  [['narr',S('The lamp room is dark. Something huge and soft is wrapped around the great lamp like a scarf. Two enormous eyes open on its wings. Then two more. They are not eyes. They are worse.','The lamp room is dark. Something huge is wrapped round the lamp. Big eyes open on its wings!')]],
  [['narr',S('The beam hits the Gloomwing full on. It shrieks, shudders, and all the gray dust falls off its wings like snow.','The light hits the Gloomwing. All the gray dust falls off like snow.')],
   ['narr',S('Underneath, its wings are gold. It blinks at you with soft, sleepy eyes, bumps its fuzzy head against the glass, and flutters out of the broken window toward the dawn.','Its wings are gold underneath! It blinks, bumps the glass, and flies out to the dawn.')],
   ['c_pearl',S('Poor thing. Somebody told it the dark was its friend. Light is kinder, in the end.','Poor thing. Light is kinder, in the end.')]]);
// a summon whose count follows the difficulty (o.nf(e) gives it)
FM.c1summon={ start(e,m){ FM.summon.start(e,m); }, tick(e,dt,d,a,m){ const o=m.o, n0=o.n; o.n=o.nf?o.nf(e):n0; try{ return FM.summon.tick(e,dt,d,a,m); } finally{ o.n=n0; } } };
FM_DEF.c1summon=FM_DEF.summon||{recover:0.5};
const GLOOM_BRAIN=FK.brain({move:'hold',turn:4,cd:[1.4,2.4],
  moves:[{k:'c1cone',st:'stareW',st2:'stare',windup:1.0,len:300,half:0.42,col:C1COL.violet,pcol:'200,150,255',glow:true,max:340,w:2,hit:e=>{ C1.hushT=Math.max(C1.hushT,3); ftext(player.x,player.y-40,S('The eyes! Your fire goes quiet.','Your fire is gone for a bit!'),'#d8c0ff',13); }},
         {k:'c1summon',type:'c_moth',n:4,nf:()=>byDiff(2,4,6),every:13,windup:0.8,st:'summon',r0:40,r1:120,opt:{swarm:true},w:2.4,if:e=>e.bph!==1&&countType('c_moth')<byDiff(3,6,8)},
         {k:'c1swoop',st:'aim',st2:'swoop',windup:0.8,len:360,w:70,spd:560,time:0.6,dmg:1.3,kb:300,min:120,max:420,w:2.2}]});
defineFoe('c_gloomwing',{boss:true,name:'The Gloomwing',title:S('Lampshade of the Lighthouse','the lamp moth'),short:'Gloomwing',
  lv:12,hp:4000,r:46,speed:150,dmg:22,value:1000,flying:true,kbRes:0.1,dcol:'190,170,230',phases:[0.66,0.33],
  phaseText:[[S('Shadow!','Shadow!'),S('It hides in its own shadow under the glass. SHADOW DASH into its shadow to knock it out!','Dash into its shadow!'),['c_pearl',S('It is hiding in its own shadow, Ash. Dash in after it!','Go through its shadow!')]],
             [S('The Lamp!','The lamp!'),S('It smothers the great lamp. Breathe fire on the wick until it catches! The beam will knock it down.','Breathe fire on the lamp!'),['c_pearl',S('Light my lamp, Ash! Fire on the wick!','Light my lamp!')]]],
  init(e){ c1BossInit(e); e.z=60; e.orb=rand(0,TAU); e.beamCd=0; e.downT=0; e.mode='fly'; e.onShadow=gloomShadowHit; },
  onPhase(e,i){ e.downT=0; e.sunk=false; e.mode=i===1?'sinkDown':'toLamp'; e.mst=0; },
  ai:gloomAI,
  onHurt(e,amt,o){ const h=foeHit(e,o); let a;
    if(e.sunk){ if(!(e._skT>G.time)){ e._skT=G.time+1.6; c1Txt(e,S('It is under the glass! Shadow Dash into its shadow!','Dash into its shadow!'),'#d8c0ff',13); } return false; }
    if(e.downT>0) a=amt*1.5;
    else if(e.mode==='smother'){ if(!(e._smT>G.time)){ e._smT=G.time+1.6; c1Txt(e,S('It is wrapped round the lamp! Light the wick!','Light the lamp!'),'#ffd27a',13); } a=amt*0.1; }
    else if(e.mode==='hover') a=amt*0.6;
    else { const r=h.ranged||h.fire?0.6:0.2; if(!(e._hiT>G.time)&&r<0.5){ e._hiT=G.time+2; c1Txt(e,e.bph===0?S('Too high! Bounce the moonbeam onto it with the mirrors!','Too high! Use the mirrors!'):S('Too high!','Too high!'),'#e8d8ff',12); } a=amt*r; }
    // each phase ends only after its trick worked: the moonbeam (phase 1), a Shadow Strike (2), the lit lamp's beam (3)
    const ph=e.bph||0, need=[byDiff(1,2,2),byDiff(1,2,2),1][ph];
    if(((e.gates&&e.gates[ph])||0)<need){ const b=a; a=c1Floor(e,a,o,[0.67,0.34,0.04][ph]); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; c1Txt(e,[S('It will not fall! Turn the mirrors so the moonbeam hits it!','Turn the mirrors!'),S('It will not fall! Shadow Dash into its shadow!','Dash into its shadow!'),S('It will not fall! Light the lamp!','Light the lamp!')][ph],'#ffd27a',13); } }
    return a; },
  draw3d:c1FigGloom, draw2d:c1Gloom2,
  sheet:[{state:'chase',z:60,label:'fly'},{state:'chase',dx:80,z:60,label:'fly (move)'},{state:'stareW',st:0.5,z:60,label:'stare windup'},{state:'aim',st:0.4,z:60,label:'dive aim'},{state:'swoop',dx:400,z:30,label:'dive'},
         {state:'stuck',downT:2,z:0,label:'stunned'},{state:'smother',mode:'smother',z:30,label:'smother'},{state:'chase',sunk:true,label:'sunk shadow'},{state:'chase',deathT:0.3,z:20,label:'death'}]});
function gloomRoom(e){ return c1RoomOf(e); }
function gloomAI(e,dt,p){
  p=p||player; const D=foeDiff(), R=gloomRoom(e), C=c1Ctx(e), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0; e.flying=!(e.sunk||e.downT>0);
  if(e.beamCd>0) e.beamCd-=dt;
  // knocked down (moonbeam, lamp beam, shadow strike): on the floor, wings scorching
  if(e.downT>0){ e.downT-=dt; e.state='stuck'; e.st=0.2; e.z=Math.max(0,e.z-dt*240); if(e.kup>0){ e.kup-=dt; e.z=30*Math.sin(clamp(e.kup/0.5,0,1)*Math.PI); } if(Math.random()<dt*10) emit(e.x+rand(-30,30),e.y-10,1,{col:'255,220,150',ang:-Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.5,zmax:3,rise:20});
    if(e.downT<=0){ e.state='chase'; e.beamCd=e.bph===2?1.0:2; e.cd=0.8; c1Txt(e,S('It flies up again!','It flies again!'),'#e8d8ff',12); } return; }
  if(e.bph===1) return gloomShadow(e,dt,d,a,R,C);
  if(e.bph===2) return gloomLamp(e,dt,d,a,R,C);
  // phase 1: flying; the moonbeam from the mirrors knocks it down
  e.z=lerp(e.z,60,Math.min(1,dt*2));
  if(R&&R.beam&&e.beamCd<=0){ for(const s of R.beam){ if(segD(e.x,e.y,s[0],s[1],s[2],s[3])<e.r){ gloomDown(e,byDiff(3.4,3,2.6),S('The moonbeam! It falls!','The moonlight got it!')); return; } } }
  // moths love light: once the moonbeam runs all the way round, it cannot keep away from it for long
  const full=R&&R.beam&&R.beam.length>=5; e.lureT=full?(e.lureT||0)+dt:0;
  if(full&&e.lureT>byDiff(8,11,14)&&!e.mv&&e.state==='chase'){ const s=R.beam[1+((e.lureN=(e.lureN||0)+1)%(R.beam.length-1))]; e.lureT=0; e.lure={x:(s[0]+s[2])/2,y:(s[1]+s[3])/2,t:4}; }
  if(e.lure){ e.lure.t-=dt; if(e.lure.t<=0) e.lure=null; }
  GLOOM_BRAIN(e,dt,p);
  if(!e.mv&&e.state==='chase'){ if(e.lure){ steer(e,e.lure.x,e.lure.y,e.speed*0.9*foeDiff().spd); e.noClip=true; if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),3*dt); } else gloomOrbit(e,dt,R,C,0.8); }
  bossCad(e,1);
}
function gloomOrbit(e,dt,R,C,k){ const D=foeDiff(), cx=R?R.R.cx:C.cx, cy=R?R.R.cy:C.cy, dx=R?R.dx:C.R*0.6, dy=R?R.dy:C.R*0.5;
  e.orb+=dt*0.55*D.spd; const rr=0.7+0.6*(0.5+0.5*Math.sin(e.orb*1.7)); steer(e,cx+Math.cos(e.orb)*dx*rr,cy+Math.sin(e.orb)*dy*rr,e.speed*k*D.spd); if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),3*dt); e.noClip=true; }
function gloomDown(e,t,txt){ e.gates=e.gates||[0,0,0]; e.gates[e.bph||0]++; e.lure=null; e.lureT=0; e.mv=null; e.tele=null; e.downT=t; e.sunk=false; e.state='stuck'; shake(9); SFX.play('boom'); c1Txt(e,txt,'#ffe066',16); emit(e.x,e.y,30,{col:'230,225,245',glow:false,smin:40,smax:200,lmin:.5,lmax:1,zmin:2,zmax:5,grow:6}); }
// phase 2: sink into the shadow, move under the glass, rise with a swipe; a Shadow Dash into the shadow knocks it out
function gloomShadow(e,dt,d,a,R,C){
  const p=player, D=foeDiff(); e.mst=(e.mst||0)+dt;
  switch(e.mode){
    case 'sinkDown': e.state='sink'; e.z=Math.max(0,e.z-dt*120); if(e.z<=0){ e.mode='sunk'; e.sunk=true; e.mst=0; e.alpha=1; SFX.play('roll'); } return;
    case 'sunk': e.sunk=true; e.state='sunk'; steer(e,p.x+Math.cos(G.time*1.3)*30,p.y+Math.sin(G.time*1.1)*30,190*D.spd); e.noClip=true;
      if(e.mst>byDiff(3.2,2.6,2.2)){ e.mode='riseW'; e.mst=0; c1Mark({x:e.x,y:e.y,r:96,dur:c1W({},0.8),col:C1COL.violet}); } return;
    case 'riseW': e.state='riseW'; e.sunk=true; if(e.mst>=c1W({},0.8)){ e.sunk=false; e.mode='hover'; e.mst=0; e.z=20; shake(7); SFX.play('boom');
        if(!p.dead&&!c1Up()&&dist(p.x,p.y,e.x,e.y)<96+p.r*0.5) hurtPlayer(c1Dmg(e,26),e.x,e.y,380); emit(e.x,e.y,24,{col:'160,110,220',glow:false,smin:40,smax:200,lmin:.4,lmax:.8,zmin:2,zmax:5,grow:6}); } return;
    case 'hover': e.state='chase'; e.z=lerp(e.z,40,Math.min(1,dt*3)); e.face=turnTo(e.face,a,3*dt); if(e.mst>byDiff(1.8,1.5,1.2)){ e.mode='sinkDown'; e.mst=0; } return;
    default: e.mode='sinkDown';
  }
}
// phase 3: smother the lamp; lit, the beam turns and knocks it down
function gloomLamp(e,dt,d,a,R,C){
  const p=player, D=foeDiff(), L=R?R.lamp:{x:C.cx,y:C.cy,lit:false,heat:0}; e.mst=(e.mst||0)+dt;
  if(!L.lit&&e.mode!=='smother'&&e.mode!=='toLamp'){ e.mode='toLamp'; }
  if(e.mode==='toLamp'){ e.state='chase'; e.sunk=false; e.z=lerp(e.z,34,Math.min(1,dt*2)); steer(e,L.x,L.y+4,e.speed*D.spd); e.noClip=true;
    // (the last bit it flies straight in over the lamp's base, which blocks walking)
    if(dist(e.x,e.y,L.x,L.y+4)<100){ e.dx=e.dy=0; const u=Math.min(1,dt*5); e.x=lerp(e.x,L.x,u); e.y=lerp(e.y,L.y+4,u); }
    if(dist(e.x,e.y,L.x,L.y+4)<10){ e.x=L.x; e.y=L.y+4; e.mode='smother'; e.mst=0; e.slapT=1; L.heat=0; c1Say(e,'c_pearl',S('It is smothering my lamp! Fire on the wick, Ash!','Fire on the lamp, Ash!'),8); } return; }
  if(e.mode==='smother'){ e.state='smother'; e.x=L.x; e.y=L.y+4; e.face=turnTo(e.face,a,1.5*dt); e.z=34;
    e.slapT-=dt*D.atk; if(e.slapT<=0&&d<220&&!e.tele){ e.slapT=byDiff(2,1.5,1.2); e.state='slapW'; e.slap=c1Mark({shape:'cone',x:L.x,y:L.y,ang:a,len:190,half:0.6,dur:c1W({},0.5),col:C1COL.white,fire:z=>{ if(!player.dead&&inCone(z.x,z.y,z.ang,z.len,z.half,player.x,player.y,player.r)&&!c1Up()) hurtPlayer(c1Dmg(e,18),z.x,z.y,300); SFX.play('slash3'); }}); }
    if(L.lit){ e.mode='fly'; gloomDown(e,2,S('The lamp catches! It is knocked off!','The lamp is lit!')); return; }
    return; }
  // the lamp is lit: hide in the shadow behind the turning beam; the beam knocks it down
  e.mode='hide'; e.sunk=false; e.z=lerp(e.z,46,Math.min(1,dt*2)); const ba=L.a+Math.PI, r=Math.min(R?R.dx:C.R*0.6,R?R.dy:C.R*0.5)*0.85;
  steer(e,L.x+Math.cos(ba)*r,L.y+Math.sin(ba)*r,e.speed*0.75*D.spd); e.noClip=true; if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),3*dt);
  if(e.beamCd<=0&&L.seg&&segD(e.x,e.y,L.seg[0],L.seg[1],L.seg[2],L.seg[3])<e.r*0.8){ gloomDown(e,2,S('The beam hits it!','The beam got it!')); return; }
  e.state='chase';
}
// the Shadow Strike: a Shadow Dash (or a ride) into its shadow
function gloomShadowHit(e,how){
  if(e.dead) return; const ok=e.sunk||(e.bph===2&&e.mode==='hide');
  if(!ok) return;
  e.sunk=false; e.mode=e.bph===1?'sinkDown':'hide'; e.mst=0; gloomDown(e,2.5,S('SHADOW STRIKE! You knocked it out!','Shadow strike!')); e.kup=0.5; e.z=0;
  c1Say(e,'c_pearl',S('Ha! Out it pops!','Ha! Got it!'),5);
}
// ---- its look: a moth as big as a cart, gray-violet with huge eye-spots, glowing violet eyes, raining silver dust
function c1FigGloom(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.c_gloomwing.r)/46, face=t3Turn(e,e.face,5), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e), dead=foDeath(e), hurt=c1Hurt(e);
  if(e.sunk||st==='sunk'||st==='riseW'){ const g=foG(), r=56*k*(st==='riseW'?1+0.4*clamp(inS/0.8,0,1):1), pul=0.5+0.5*Math.sin(t*4);
    g.save(); g.fillStyle=`rgba(40,20,70,${0.42+0.2*pul})`; g.beginPath(); g.ellipse(fx,fy,r*1.5,r*0.62,0,0,TAU); g.fill(); g.fillStyle='rgba(30,10,50,.5)'; g.beginPath(); g.ellipse(fx,fy,r*0.9,r*0.38,0,0,TAU); g.fill();
    for(const sd of [-1,1]){ g.fillStyle=`rgba(200,140,255,${0.5+0.4*pul})`; g.beginPath(); g.arc(fx+sd*r*0.7,fy-2,4,0,TAU); g.fill(); } g.restore(); e._t3top=fy-30; return; }
  const gold=dead>0, wing=fl?'#ffffff':gold?'#f0c860':foT(e,'#8a7aac'), wingD=gold?'#c89a3a':foT(e,'#5e4e80'), body=fl?'#ffffff':foT(e,'#9a8aa8'), fuzz=foT(e,'#d6cce6');
  const z=lerp(e.z!=null?e.z:60,8,dead), down=st==='stuck', smother=st==='smother'||st==='slapW', swoop=st==='swoop'||st==='aim', stare=st==='stareW'||st==='stare';
  foShadow(fx,fy,40*k,0.35);
  foBegin(fx,fy,face,k,fl,z);
  if(dead) foSet(FOB,0,0.4*dead,0,0); else foSet(FOB,0,(swoop?0.3:smother?0.5:0)-hurt*0.15,down?Math.sin(t*5)*0.08:0,0);
  let th=0.2+Math.sin(t*3.4)*0.55, sw=2; if(down) { th=-0.15; sw=6; } else if(smother){ th=-0.9; sw=-6; } else if(swoop){ th=-0.1; sw=12; } else if(stare){ th=0.9; sw=0; } else if(st==='summon'){ th=0.2+Math.sin(t*28)*0.25; }
  for(const sd of [-1,1]){ c1Wing(sd,4,sd*5,4,54,34,th,sw,wing,wingD,0); c1Wing(sd,-14,sd*4,1,38,24,th*0.85,sw+6,wingD,null,0);
    // two great eye-spots on each forewing (they glow before the stare)
    const c=Math.cos(th), s=Math.sin(th);
    for(const [u,sz] of [[0.42,7],[0.74,5]]){ const ex=4-sw*u-2, ey=sd*(5+54*u*c), ez=4+54*u*s+0.6; foD(ex,ey,ez,sz,'#f4eefc',0.01); foD(ex+0.2,ey,ez+0.1,sz*0.62,stare?'#c890ff':'#4a3a6a',0.02); foD(ex+0.4,ey-sz*0.2,ez+sz*0.3,sz*0.22,'#ffffff',0.03); } }
  foE(-12,0,0,18,9,9,body); for(let i=0;i<4;i++) foN(-22+i*6,-8.6,1.4,-22+i*6,8.6,1.4,1.2,wingD,0.02);
  foB(6,0,2,11,fuzz); for(let i=0;i<7;i++){ const an=i/7*TAU; foB(6+Math.cos(an)*8,Math.sin(an)*9,2+Math.sin(an*2)*2,3.6,fuzz); }
  foB(17,0,4,7,body);
  for(const sd of [-1,1]){ c1Lamp(22,sd*3.6,5.6,2.6,gold?'#ffe080':'#c890ff',0.6);
    for(let j=0;j<4;j++){ const sx=24+j*2.4, sy=sd*(3+j*3.4), sz=12+j*2.6+Math.sin(t*2+j)*1; foN(20,sd*2,9,sx,sy,sz,0.8,'#e8e0f4',0.03); foN(sx,sy,sz,sx+2,sy+sd*2,sz+1.6,0.5,'#e8e0f4',0.04); } }
  for(let i=0;i<5;i++){ const ph=(t*0.6+i*0.21)%1; foD(-20+i*9,(i%2?-1:1)*(8+i*4),-ph*22,0.9,'#e4e0f4',0.05); }
  foEnd(z); e._t3top=foTop(fy,24,k,z);
}
function c1Gloom2(e,fl){
  const x=e.x, y=e.y-(e.z||0)*0.6, k=(e.r0||46)/46, f=e.face, fl2=Math.sin((e.t||0)*3.4);
  if(e.sunk){ ctx.save(); ctx.fillStyle='rgba(40,20,70,.55)'; ctx.beginPath(); ctx.ellipse(e.x,e.y,80*k,34*k,0,0,TAU); ctx.fill(); ctx.restore(); return; }
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+8,56*k,22*k,0,0,TAU); ctx.fill(); ctx.translate(x,y); ctx.rotate(f); ctx.scale(k,k);
  const ww=0.8+fl2*0.25; for(const s of [-1,1]){ c1E2(-2,s*40*ww,32,38*ww,fl?'#fff':'#8a7aac',s*0.2,2); ctx.fillStyle='#f4eefc'; ctx.beginPath(); ctx.arc(-2,s*36*ww,9,0,TAU); ctx.fill(); ctx.fillStyle='#4a3a6a'; ctx.beginPath(); ctx.arc(-2,s*36*ww,5,0,TAU); ctx.fill(); }
  c1E2(-6,0,22,10,'#9a8aa8',0,2); c1E2(12,0,10,10,'#d6cce6',0,1.6); ctx.fillStyle='#c890ff'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(20,s*4,2.6,0,TAU); ctx.fill(); }
  ctx.restore();
}
// ---- the Lamp Room (room decor): the great lamp, four mirrors on stands, the broken window and its moonbeam
C1ROOM.c_gloomwing={
  build(R,A){ const hw=(R.x1-R.x0)/2, hh=(R.y1-R.y0)/2, dx=hw*0.62, dy=hh*0.62, D={R,type:'c_gloomwing',dx,dy,mirrors:[],beam:[],lamp:{x:R.cx,y:R.cy,lit:false,heat:0,litT:0,a:0,seg:null}};
    const easy=foeDiff().easy, rot0=easy?[0,0,2,4]:[6,0,2,4];
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy],i)=>{ const o={k:'c1mirror',x:R.cx+sx*dx,y:R.cy+sy*dy,id:`c1_${R.id}_m${i}`,room:R.id,r:22,rot:rot0[i],rot0:rot0[i],spin:0,hitT:0,i,
      onHit(src){ if(o.hitT>G.time) return true; o.hitT=G.time+0.3; o.rot=(o.rot+1)%8; o.spin=1; o.drift=14; SFX.play('block'); emit(o.x,o.y-30,8,{col:'220,235,255',smin:40,smax:120,lmin:.2,lmax:.4,zmin:1.5,zmax:2.5}); ftext(o.x,o.y-56,S('Turn!','Turn!'),'#dff0ff',11); return true; }};
      A.objs.push(o); D.mirrors.push(o); addAreaCol({t:'c',x:o.x,y:o.y,r:16}); });
    D.win={x:D.mirrors[0].x,y:R.y0+4}; D.lampCol=addAreaCol({t:'c',x:R.cx,y:R.cy,r:56}); return D; },
  tick(D,dt){ const e=G.boss&&G.boss.type==='c_gloomwing'&&!G.boss.dead&&G.boss.c1room===D.R?G.boss:null, L=D.lamp, F=foeDiff();
    for(const m of D.mirrors){ if(m.spin>0) m.spin-=dt*4; if(F.hard&&e&&e.bph===0){ m.drift=(m.drift==null?14:m.drift)-dt; if(m.drift<=0){ m.drift=14; if(m.rot!==m.rot0){ m.rot=(m.rot+7)%8; m.spin=1; ftext(m.x,m.y-56,S('It slips back!','It slips!'),'#c8d8f0',11); } } } }
    // the moonbeam: window -> mirror 1 -> wherever each mirror points (it stops at the lamp, a wall, or back at mirror 1)
    D.beam.length=0; const R=D.R; let cx=D.win.x, cy=D.win.y, cur=D.mirrors[0]; D.beam.push([cx,cy,cur.x,cur.y]); const seen=new Set([cur]);
    for(let n=0;n<5;n++){ const ang=cur.rot*Math.PI/4, ux=Math.cos(ang), uy=Math.sin(ang); let best=null, bt=1e9;
      for(const m of D.mirrors){ if(m===cur) continue; const vx=m.x-cur.x, vy=m.y-cur.y, tt=vx*ux+vy*uy; if(tt<30) continue; if(Math.abs(vx*uy-vy*ux)<30&&tt<bt){ bt=tt; best=m; } }
      const lx=L.x-cur.x, ly=L.y-cur.y, lt=lx*ux+ly*uy; if(lt>0&&Math.abs(lx*uy-ly*ux)<60&&lt<bt){ D.beam.push([cur.x,cur.y,cur.x+ux*(lt-56),cur.y+uy*(lt-56)]); best=null; break; }
      if(!best){ let tw=1e9; if(ux>0.01) tw=Math.min(tw,(R.x1-cur.x)/ux); if(ux<-0.01) tw=Math.min(tw,(R.x0-cur.x)/ux); if(uy>0.01) tw=Math.min(tw,(R.y1-cur.y)/uy); if(uy<-0.01) tw=Math.min(tw,(R.y0-cur.y)/uy); D.beam.push([cur.x,cur.y,cur.x+ux*tw,cur.y+uy*tw]); break; }
      D.beam.push([cur.x,cur.y,best.x,best.y]); if(seen.has(best)) break; seen.add(best); cur=best; }
    if(typeof p2ShineSeg==='function') for(const s of D.beam) p2ShineSeg(s[0],s[1],s[2],s[3],30);
    // the great lamp: breathe on the wick (phase 3) to light it; lit, its beam turns
    if(e&&e.bph===2&&!L.lit&&e.mode==='smother'){ if(typeof inBreath==='function'&&inBreath(L.x,L.y-20,34)){ L.heat+=dt; if(Math.random()<dt*20) emit(L.x+rand(-14,14),L.y-40,1,{kind:'fire',smin:20,smax:70,lmin:.3,lmax:.6,zmin:3,zmax:6,grow:8}); } else L.heat=Math.max(0,L.heat-dt*0.4);
      const need=(G.items&&G.items.c_lampoil)?1:3; if(L.heat>=need){ L.lit=true; L.litT=byDiff(36,30,24); L.heat=0; L.a=angTo(L.x,L.y,player.x,player.y)+Math.PI; shake(10); SFX.play('boom'); flashA=0.4; flashCol='255,230,160'; setBanner(S('The lamp is lit!','The lamp is lit!'),S('Its beam knocks the Gloomwing down. Chase it through the shadows!','The light knocks it down!'),2.4); } }
    if(L.lit){ L.litT-=dt; L.a+=dt*TAU/byDiff(5,4,3.4); const len=Math.max(R.x1-R.x0,R.y1-R.y0); L.seg=[L.x+Math.cos(L.a)*60,L.y+Math.sin(L.a)*60,L.x+Math.cos(L.a)*len,L.y+Math.sin(L.a)*len]; if(typeof p2ShineSeg==='function') p2ShineSeg(L.seg[0],L.seg[1],L.seg[2],L.seg[3],70); p2Shine(L.x,L.y,140);
      if(L.litT<=0||!e){ L.lit=false; L.seg=null; if(e) c1Say(e,'c_pearl',S('The lamp is going out! It will smother it again!','The lamp went out!'),6); } } },
  ground(D,t){ ctx.save(); ctx.globalCompositeOperation='lighter';
    for(const s of D.beam){ const g=ctx.createLinearGradient(s[0],s[1],s[2],s[3]); g.addColorStop(0,'rgba(190,220,255,.55)'); g.addColorStop(1,'rgba(160,200,255,.3)'); ctx.strokeStyle=g; ctx.lineWidth=26; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(s[0],s[1]); ctx.lineTo(s[2],s[3]); ctx.stroke(); ctx.strokeStyle='rgba(240,250,255,.7)'; ctx.lineWidth=6; ctx.stroke(); }
    const L=D.lamp; if(L.seg){ const g=ctx.createLinearGradient(L.seg[0],L.seg[1],L.seg[2],L.seg[3]); g.addColorStop(0,'rgba(255,230,150,.75)'); g.addColorStop(1,'rgba(255,210,120,0)'); ctx.strokeStyle=g; ctx.lineWidth=90; ctx.beginPath(); ctx.moveTo(L.seg[0],L.seg[1]); ctx.lineTo(L.seg[2],L.seg[3]); ctx.stroke(); }
    ctx.restore();
    // the broken window in the north wall
    const W=D.win; ctx.save(); ctx.fillStyle=C1OL(); ctx.fillRect(W.x-34,W.y-4,68,22); ctx.fillStyle='#2a3a6a'; ctx.fillRect(W.x-30,W.y-2,60,18); ctx.fillStyle='#e8f0ff'; ctx.beginPath(); ctx.arc(W.x+14,W.y+6,5,0,TAU); ctx.fill();
    ctx.strokeStyle='#cfe0ff'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(W.x-30,W.y+4); ctx.lineTo(W.x-10,W.y+12); ctx.lineTo(W.x-18,W.y+16); ctx.stroke(); ctx.restore(); },
  tall(D,list){ for(const m of D.mirrors){ if(!m.it) m.it={x:m.x,y:m.y+6,draw:()=>c1DrawMirror(m)}; list.push(m.it); } if(!D.lit2) D.lit2={x:D.lamp.x,y:D.lamp.y+30,draw:()=>c1DrawLamp(D)}; list.push(D.lit2); }
};
function c1DrawMirror(m){ const x=m.x, y=m.y, a=m.rot*Math.PI/4+(m.spin>0?m.spin*0.6:0), oc=C1OL(); ctx.save();
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+4,18,7,0,0,TAU); ctx.fill();
  ctx.fillStyle=oc; ctx.fillRect(x-4,y-34,8,36); ctx.fillStyle='#8a6a42'; ctx.fillRect(x-2.5,y-33,5,34); ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(x,y+1,14,6,0,0,TAU); ctx.fill(); ctx.fillStyle='#a07a4a'; ctx.beginPath(); ctx.ellipse(x,y,12,5,0,0,TAU); ctx.fill();
  const cx=x, cy=y-44, w=Math.abs(Math.sin(a))*0.6+0.4; ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(cx,cy,20*w+2,20,0,0,TAU); ctx.fill(); ctx.fillStyle='#d8a848'; ctx.beginPath(); ctx.ellipse(cx,cy,18*w+1,18,0,0,TAU); ctx.fill();
  ctx.fillStyle='#bcd8f4'; ctx.beginPath(); ctx.ellipse(cx,cy,15*w,15,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(cx-4*w,cy-5,5*w,4,-0.5,0,TAU); ctx.fill();
  // which way it sends the light: a little gold arrow on the ground
  ctx.strokeStyle='rgba(255,220,120,.9)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*16,y+Math.sin(a)*8); ctx.lineTo(x+Math.cos(a)*34,y+Math.sin(a)*17); ctx.stroke();
  ctx.fillStyle='rgba(255,220,120,.9)'; ctx.beginPath(); const tx=x+Math.cos(a)*40, ty=y+Math.sin(a)*20; ctx.moveTo(tx,ty); ctx.lineTo(tx-Math.cos(a-0.5)*10,ty-Math.sin(a-0.5)*5); ctx.lineTo(tx-Math.cos(a+0.5)*10,ty-Math.sin(a+0.5)*5); ctx.closePath(); ctx.fill(); ctx.restore(); }
function c1DrawLamp(D){ const L=D.lamp, x=L.x, y=L.y, oc=C1OL(), e=G.boss&&G.boss.type==='c_gloomwing'?G.boss:null, sm=e&&e.mode==='smother'; ctx.save();
  ctx.fillStyle=oc; rrect(ctx,x-46,y-30,92,40,10); ctx.fill(); ctx.fillStyle='#b8873e'; rrect(ctx,x-43,y-27,86,34,8); ctx.fill(); ctx.fillStyle='#d8a848'; for(let i=0;i<4;i++){ ctx.fillRect(x-38+i*22,y-20,10,6); }
  ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(x,y-58,40,44,0,0,TAU); ctx.fill(); ctx.fillStyle=L.lit?'#fff4c8':sm?'#9a92ae':'#c8d4e4'; ctx.beginPath(); ctx.ellipse(x,y-58,37,41,0,0,TAU); ctx.fill();
  if(!L.lit&&!sm){ ctx.strokeStyle='#e8e4f0'; ctx.lineWidth=3; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(x-34,y-80+i*12); ctx.lineTo(x+34,y-74+i*12); ctx.stroke(); } }
  const heat=L.heat>0?clamp(L.heat/((G.items&&G.items.c_lampoil)?1:3),0,1):0;
  if(L.lit||heat>0){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=L.lit?0.9:0.3+heat*0.6; ctx.drawImage(foGlowSpr('255,220,140'),x-90,y-148,180,180); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }
  ctx.fillStyle=oc; ctx.beginPath(); ctx.moveTo(x-30,y-96); ctx.lineTo(x,y-118); ctx.lineTo(x+30,y-96); ctx.closePath(); ctx.fill(); ctx.fillStyle='#d8a848'; ctx.beginPath(); ctx.moveTo(x-26,y-97); ctx.lineTo(x,y-114); ctx.lineTo(x+26,y-97); ctx.closePath(); ctx.fill();
  if(heat>0&&!L.lit){ ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(x-30,y+16,60,7); ctx.fillStyle='#ffb050'; ctx.fillRect(x-29,y+17,58*heat,5); }
  ctx.restore(); }

// ================= 11. Captain Saltbeard's Ghost (c_saltbeard), the side quest boss of c_whip (the Saucy Gull)
// On the wreck on the Rockpools, at night. THE GHOST RULE: unlit he is see-through and takes 30 percent. Fire makes him
// solid for 4 s (Easy 6): breath, a fire arrow, a burning Wing-rang.
// Phase 1: anchor sweep (white ring low round him: JUMP the chain), anchor throw (red line; the anchor sticks, the chain
// stings for 2 s, he is tethered while he reels it in: light him and hit), ghost lights (cold orbs that follow: swing at
// them or outrun them). Phase 2 (half health): cannon volleys from the ghost cannons (orange circles), vanish (he fades;
// a cold blue swirl shows where he comes back: breathe fire on it and he stumbles out solid), double anchor.
c1Lines('c_saltbeard','c_saltbeard_intro','c_saltbeard_won',
  [['narr',S('You set the steaming bowl on the tilted deck of the Saucy Gull. The tide whispers. Somewhere in the dark, a chain goes clank. Clank. CLANK.','You set the bowl on the old deck. Somewhere a chain goes clank. CLANK.')],
   ['narr',S('A huge pale pirate rises up through the deck, beard like sea foam, an anchor on a chain over his shoulder.','A huge ghost pirate rises up! He has a beard like foam and an anchor on a chain.')],
   ['c_saltbeard',S('WHO DARES set food on MY deck without SAYING GRACE?','WHO put food on MY deck without saying grace?')],
   ['ash',S('Um. Grace?','Um. Grace?')],
   ['c_saltbeard',S('TOO LATE! Fight me for it, landlubber! Winner gets the chowder!','TOO LATE! Fight me! The winner gets the chowder!')]],
  [['narr',S('Captain Saltbeard sits down heavily on his own deck. He picks up the bowl in both ghostly hands, and slurps.','Saltbeard sits down on his deck. He picks up the bowl and slurps.')],
   ['c_saltbeard',S('...Oh. Oh, that is the stuff. Forty years. Forty YEARS I waited for this bowl.','Oh. That is good. I waited forty YEARS for this!')],
   ['narr',S('He glows a little brighter with every spoonful. When the bowl is empty, he is almost see-through.','He glows with every spoonful. Soon you can see right through him.')],
   ['c_saltbeard',S('Tell Elias I am sorry about the cards. And the sock. Here.','Tell Elias I am sorry. About the cards. And the sock.')],
   ['narr',S('He drops his anchor chain at your feet. It is real, cold and heavy, and it clinks like it wants something to do.','He drops his anchor chain at your feet. It is real and heavy.')],
   ['c_saltbeard',S('Take my chain, little dragon. Give it a better job than holding me down.','Take my chain, little dragon. Give it a better job.')],
   ['narr',S('Then he is gone, and there is only the tide, an empty bowl, and one very old sock.','Then he is gone. Just the tide, a bowl, and an old sock.')]]);
function saltSolid(e){ return (e.solidT||0)>0||(e.burnT||0)>0; }
function saltLight(e){ const was=saltSolid(e); e.solidT=byDiff(6,4,4); if(!was){ c1Txt(e,S('Solid! Hit him now!','Solid! Hit him!'),'#ffd27a',15); SFX.play('shrine'); } }
// ghost lights: cold blue orbs drifting after Ash (a swing or fire pops them)
FZK.c1wisp={
  tick(z,dt){ const p=player; const a=angTo(z.x,z.y,p.x,p.y); z.vx+=(Math.cos(a)*z.sp-z.vx)*Math.min(1,dt*1.2); z.vy+=(Math.sin(a)*z.sp-z.vy)*Math.min(1,dt*1.2); z.x+=z.vx*dt; z.y+=z.vy*dt;
    const pop=()=>{ z.done=true; SFX.play('pop'); emit(z.x,z.y-16,12,{col:'170,220,255',smin:30,smax:120,lmin:.2,lmax:.5,zmin:1.5,zmax:3}); };
    if(!p.dead&&dist(z.x,z.y,p.x,p.y)<14+p.r&&!(typeof p2Shadowed==='function'&&p2Shadowed())){ hurtPlayer(z.dmg,z.x,z.y,120); return pop(); }
    if((p.swingT>0&&dist(z.x,z.y,p.x,p.y)<100&&Math.abs(angDiff(p.swingDir||p.facing,angTo(p.x,p.y,z.x,z.y)))<1.3)||(typeof inBreath==='function'&&inBreath(z.x,z.y,14))) return pop(); },
  drawG(z){ const y=z.y-18+Math.sin(z.t*4)*4; ctx.save(); ctx.fillStyle='rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(z.x,z.y,8,3.5,0,0,TAU); ctx.fill(); ctx.globalCompositeOperation='lighter'; ctx.drawImage(foGlowSpr('120,190,255'),z.x-22,y-22,44,44); ctx.fillStyle='rgba(220,240,255,.95)'; ctx.beginPath(); ctx.arc(z.x,y,5.5,0,TAU); ctx.fill(); ctx.restore(); }
};
// the anchor: thrown along a red line, it sticks; the chain between stings; he reels it back in (tethered, slow)
FM.c1anchor={
  start(e,m){ const o=m.o; m.n=typeof o.n==='function'?o.n(e):(o.n||1); e.state='throwW'; e.st=fkW(o,0.8); e.tele=newTele({shape:'line',len:o.len||380,w:30,dur:e.st,col:C1COL.red}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ if(e.st>0.15) e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(e.st>0) return false; m.go=true; e.tele=null; e.state='throw'; e.st=0.28; m.ax=e.x; m.ay=e.y; m.tx=e.x+Math.cos(e.face)*(o.len||380); m.ty=e.y+Math.sin(e.face)*(o.len||380); const C=c1Ctx(e); const q={x:m.tx,y:m.ty}; c1Hold(C,q,24); m.tx=q.x; m.ty=q.y; SFX.play('throw'); return false; }
    if(e.state==='throw'){ e.st-=dt; const u=1-clamp(e.st/0.28,0,1); e.anchor={x:lerp(m.ax,m.tx,u),y:lerp(m.ay,m.ty,u)}; if(!m.hitA&&dist(e.anchor.x,e.anchor.y,p.x,p.y)<26+p.r&&!c1Up()){ m.hitA=true; hurtPlayer(fkDmg(e,o),e.anchor.x,e.anchor.y,320); }
      if(e.st<=0){ e.state='reel'; e.st=byDiff(3,2.6,2.2); m.chainT=2; shake(5); SFX.play('boom'); emit(m.tx,m.ty,14,{col:'200,190,160',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:5}); } return false; }
    // tethered: the anchor slides back to him; the chain hurts for 2 s
    m.chainT-=dt; e.st-=dt; const u=clamp(1-e.st/2.6,0,1); e.anchor={x:lerp(m.tx,e.x,u*u),y:lerp(m.ty,e.y,u*u)}; e.face=turnTo(e.face,angTo(e.x,e.y,e.anchor.x,e.anchor.y),3*dt);
    if(m.chainT>0&&!p.dead&&!c1Up()&&segD(p.x,p.y,e.x,e.y,e.anchor.x,e.anchor.y)<14+p.r*0.5){ m.ck=(m.ck||0)-dt; if(m.ck<=0){ m.ck=0.5; hurtPlayer(c1Dmg(e,8),p.x,p.y,180); } }
    if(e.st<=0){ e.anchor=null; if(--m.n>0){ m.go=false; m.hitA=false; e.state='throwW'; e.st=fkW(o,0.6); e.tele=newTele({shape:'line',len:o.len||380,w:30,dur:e.st,col:C1COL.red}); return false; } return true; }
    return false; } };
// the anchor sweep: the chain swings low round him (a white ring): jump it
FM.c1sweep={
  start(e,m){ const o=m.o; e.state='sweepW'; e.st=fkW(o,1.0); e.tele=newTele({shape:'donut',r1:e.r+16,r2:o.r2||170,dur:e.st,col:C1COL.white}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player; e.st-=dt; if(e.st>0) return false; e.tele=null; e.state='sweep'; e.swung=0.4; SFX.play('slash3'); shake(4);
    if(!p.dead&&!c1Up()&&d>e.r+10&&d<(o.r2||170)+p.r*0.5) hurtPlayer(fkDmg(e,o),e.x,e.y,360);
    for(let i=0;i<16;i++){ const an=i/16*TAU; emit(e.x+Math.cos(an)*(o.r2||170)*0.8,e.y+Math.sin(an)*(o.r2||170)*0.8,1,{col:'200,230,255',glow:false,smin:20,smax:60,lmin:.2,lmax:.4,zmin:1.5,zmax:2.5}); }
    return true; } };
Object.assign(FM_DEF,{c1anchor:{recover:0.5},c1sweep:{recover:0.5}});
const SALT_AI=FK.brain({move:'approach',stop:110,turn:4,cd:[0.8,1.5],recoverMove:0.3,pre:saltPre,
  moves:[{k:'c1sweep',r2:170,windup:1.0,dmgN:22,max:200,w:2.5},
         {k:'c1anchor',len:380,windup:0.8,dmgN:24,min:120,max:460,w:2.2,n:e=>e.bph>=1&&Math.random()<0.6?2:1},
         {k:'c1spot',st:'cast',windup:0.5,every:7,w:1.6,place:(e)=>{ for(let i=0;i<3;i++){ const an=e.face+(i-1)*0.8; fzAdd('c1wisp',{x:e.x+Math.cos(an)*50,y:e.y+Math.sin(an)*50,vx:0,vy:0,sp:byDiff(80,95,110),dmg:c1Dmg(e,12),life:6.5}); } SFX.play('cast'); }},
         {k:'c1spot',ph:1,st:'cast',windup:0.6,every:6,w:1.8,place:(e)=>saltCannons(e)},
         {k:'c1spot',ph:1,st:'vanishW',windup:0.4,every:9,w:1.6,min:80,place:(e)=>saltVanish(e)}]});
function saltCannons(e){ const p=player, C=c1Ctx(e), cn=[{x:C.cx-90,y:C.cy-30},{x:C.cx+90,y:C.cy-30}]; e.cannonFx=0.6;
  for(let i=0;i<4;i++){ const q={x:p.x+rand(-90,90),y:p.y+rand(-80,80)}; c1Hold(C,q,30); const c=cn[i%2]; blast(q.x,q.y,52,c1W({},1.0)+i*0.18,c1Dmg(e,22),{lob:true,fx:c.x,fy:c.y-30}); }
  c1Say(e,'c_saltbeard',S('FIRE THE GHOST GUNS!','FIRE!'),6); SFX.play('boom'); }
function saltVanish(e){ e.gone=1.4; e.alpha=0.05; e.mv=null; e.tele=null; const p=player, a=player.facing+Math.PI+rand(-0.6,0.6), C=c1Ctx(e), q={x:p.x+Math.cos(a)*120,y:p.y+Math.sin(a)*120}; c1Hold(C,q,40); e.vx0=q.x; e.vy0=q.y;
  e.swirl=fzAdd('c1swirl',{x:q.x,y:q.y,r:44,life:1.4+c1W({},0.8),wait:1.4-0.8,owner:e}); c1Say(e,'c_saltbeard',S('Now you see me...','Now you see me...'),8); SFX.play('cast'); }
FZK.c1swirl={
  tick(z,dt){ const e=z.owner; if(!e||e.dead){ z.done=true; return; } if(z.t>=z.wait&&typeof inBreath==='function'&&inBreath(z.x,z.y,z.r)){ z.burnt=(z.burnt||0)+dt; if(z.burnt>0.15&&!z.lit){ z.lit=true; ftext(z.x,z.y-40,S('The swirl burns!','It burns!'),'#ffb070',14); } } },
  drawG(z){ const on=z.t>=z.wait, k=on?1:clamp(z.t/z.wait,0,1)*0.5; ctx.save(); ctx.translate(z.x,z.y); ctx.globalAlpha=0.4+0.5*k; for(let i=0;i<3;i++){ ctx.rotate(z.t*3); ctx.strokeStyle=z.lit?'rgba(255,170,90,.9)':'rgba(150,210,255,.9)'; ctx.lineWidth=3-i*0.6; ctx.beginPath(); ctx.ellipse(0,0,z.r*(1-i*0.25),z.r*0.6*(1-i*0.25),0,0,TAU*0.7); ctx.stroke(); } ctx.restore(); },
  out(z){}
};
function saltPre(e,dt,d,a){
  const D=foeDiff(); if(e.solidT>0) e.solidT-=dt;
  e.alpha=e.gone>0?Math.max(0.05,e.alpha-dt*3):saltSolid(e)?1:0.6+0.06*Math.sin((e.t||0)*3);
  if(e.gone>0){ e.gone-=dt; e.dx=e.dy=0; e.state='vanish'; e.st=0.2; if(e.gone<=0){ e.x=e.vx0; e.y=e.vy0; e.alpha=0.6; const S0=e.swirl; c1Puff(e.x,e.y,'170,220,255',24);
      if(S0&&S0.lit){ saltLight(e); c1Stun(e,2,S('He stumbles out, solid!','He is solid!')); e.state='stagger'; } else { e.mv=null; e.cd=0; const m={x:e.x,y:e.y}; FM.c1sweep.start(e,e.mv={o:fkSpec({k:'c1sweep',r2:170,windup:0.45,dmgN:22}),t:0,s:'sweepW',ws:'sweepW'}); } } return true; }
  bossCad(e,e.bph>=1?0.8:1);
  return false;
}
defineFoe('c_saltbeard',{boss:true,name:'Captain Saltbeard',title:S('The Hungriest Ghost on the Coast','the ghost pirate'),short:'Saltbeard',
  lv:10,hp:2600,r:22,speed:120,dmg:20,value:550,kbRes:0.3,dcol:'170,215,240',phases:[0.5],
  phaseText:[[S('Ghost Guns!','Ghost guns!'),S('His ghost cannons fire, and he vanishes! Breathe fire on the swirl where he comes back.','He vanishes! Burn the blue swirl!'),['c_saltbeard',S('Man the ghost guns, ye barnacles!','Fire the ghost guns!')]]],
  init(e){ e.solidT=0; e.alpha=0.6; },
  ai:SALT_AI,
  onHurt(e,amt,o){ const h=foeHit(e,o); if(e.gone>0) return false;
    if(h.fire){ saltLight(e); return amt; }
    if(saltSolid(e)) return amt;
    if(!(e._ghT>G.time)){ e._ghT=G.time+1.8; c1Txt(e,S('Your blade goes right through! Light him with fire!','He is a ghost! Use fire!'),'#bfe4ff',13); }
    // see-through, he never drops past a phase mark: each phase is finished while he is solid (fire)
    return c1Floor(e,amt*0.3,o,(e.bph||0)===0?0.51:0.04); },
  onDeath(e){ e.anchor=null; },
  draw3d:c1FigSalt, draw2d:c1Salt2,
  sheet:c1Sheet([{state:'chase',label:'idle (ghost)'},{state:'chase',dx:60,solidT:2,label:'walk (solid)'},{state:'sweepW',st:0.5,at:0.7,label:'sweep windup'},{state:'sweep',label:'sweep'},{state:'throwW',st:0.4,at:0.5,label:'throw windup'},{state:'reel',label:'tethered'},{state:'cast',st:0.3,label:'ghost lights'},{state:'stagger',solidT:2,label:'stunned'},{state:'chase',deathT:0.3,label:'death'}])});
// ---- his look: a huge pale see-through pirate, beard like sea foam, a tricorn, an anchor on a long chain
function c1FigSalt(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||EDEF.c_saltbeard.r)/22*1.2, face=t3Turn(e,e.face,8), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e), dead=foDeath(e), hurt=c1Hurt(e), solid=saltSolid(e);
  const coat=fl?'#ffffff':solid?'#a8443a':'#78bcd8', coatD=solid?'#6e2a26':'#4a8cb0', skin=solid?'#f0d0b8':'#c4e8f6', foam='#f4faff', hat=solid?'#2a2230':'#4a6a90', gold=solid?'#e0b050':'#cfe8f4';
  const mv=foWalk(e,dt,6*k), w=e._wp||0, sw=Math.sin(w)*mv, float=Math.sin(t*2)*2;
  let arm=0, twirl=0; if(st==='sweepW'){ arm=c1Sm(clamp(inS/0.8,0,1)); } else if(st==='sweep'){ twirl=1; } else if(st==='throwW'){ arm=-c1Sm(clamp(inS/0.6,0,1)); } else if(st==='throw'){ arm=-1.4; } else if(st==='cast'){ arm=0.6; }
  foBegin(fx,fy,face,k,fl,float+2);
  if(dead) foSet(FOB,0,-dead*0.6,0,0,0,0,dead*20); else foSet(FOB,0,(st==='stagger'?0.2:0)-hurt*0.2+(twirl?0:0),0,twirl?t*12:0);
  // no feet: the coat tails fade into wisps
  foY(0,0,4,11,8,22,coat,coatD); for(let i=0;i<5;i++){ const an=i/5*TAU+t; foC(Math.cos(an)*9,Math.sin(an)*9,5,Math.cos(an)*12,Math.sin(an)*12,-4+Math.sin(t*3+i)*2,3,coatD); }
  foY(0,0,24,10,10,2.4,'#4a3a2a',null,0.01); foD(9.8,0,25.2,1.8,gold,0.03);
  foE(0,0,30,10,10,8,coat); for(const sd of [-1,1]) foE(2,sd*8,33,3.6,3.6,3,coatD);
  // head, the big foam beard, the tricorn hat
  foB(1,0,40,7.4,skin); for(let i=0;i<9;i++){ const an=(i/8-0.5)*2.4, bx=5+Math.cos(an)*4, by=Math.sin(an)*6.6, bz=34-Math.abs(Math.sin(an*1.3))*4-(i%2)*2; foB(bx,by,bz,3.4+(i%3)*0.6,foam); }
  foB(7.4,0,40,2.2,skin); for(const sd of [-1,1]){ foD(6.4,sd*2.6,42.4,1.3,solid?'#2a3a6a':'#4ab0ff',0.04); foD(6.7,sd*2.4,42.9,0.4,'#ffffff',0.05); foE(6,sd*3.4,44.4,1.9,1.3,0.6,foam,0.2); }
  foE(0,0,47.4,10.4,10.4,1.8,hat); foY(0,0,47.4,6,5.4,5,hat,null,0.02);
  for(let i=0;i<3;i++){ const an=i/3*TAU+Math.PI/3; foC(Math.cos(an)*4,Math.sin(an)*4,48.4,Math.cos(an)*11.6,Math.sin(an)*11.6,51.4,2.6,hat,0.03); }
  foN(-2,-6,48.8,6,6,48.8,0.6,gold,0.04);
  // arms: the anchor chain over his right shoulder
  const ax=6+arm*-2, ay=11, az=36+arm*10;
  foL(0,-9,35,4+sw*2,-12,24,2.6,coat,2.2); foB(5+sw*2,-12.4,23,2.6,skin);
  foL(0,9,35,ax,ay+2,az-4,2.6,coat,2.2); foB(ax+1,ay+2,az-5,2.6,skin);
  if(!e.anchor){ const sx=-6, sy=13, sz=46; for(let i=0;i<6;i++){ const u=i/5; foN(lerp(ax+1,sx,u),lerp(ay+2,sy,u),lerp(az-5,sz,u)-Math.sin(u*Math.PI)*-3,lerp(ax+1,sx,u+0.2),lerp(ay+2,sy,u+0.2),lerp(az-5,sz,u+0.2),0.9,'#8a94a6',0.03); }
    foL(sx,sy,sz,sx-6,sy+2,sz-14,1.6,'#8a94a6',1.4); foQ([sx-6,sy+2,sz-14, sx-1,sy+2,sz-18, sx-11,sy+2,sz-18],'#8a94a6','#4a5060',0.02); foD(sx,sy,sz+1.6,1.6,'#8a94a6',0.03); }
  foGlow(0,0,30,26,'150,210,255',solid?0.12:0.32,false);
  foEnd(30); e._t3top=foTop(fy,54,k,float+2);
  if(e.anchor) c1DrawAnchor(e);
}
function c1DrawAnchor(e){ const A=e.anchor, oc=C1OL(); ctx.save(); ctx.strokeStyle='rgba(60,70,90,.85)'; ctx.lineWidth=4; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(e.x,e.y-30); ctx.quadraticCurveTo((e.x+A.x)/2,(e.y+A.y)/2-10,A.x,A.y-8); ctx.stroke(); ctx.strokeStyle='#b8c4d4'; ctx.lineWidth=2; ctx.stroke(); ctx.setLineDash([]);
  ctx.translate(A.x,A.y-8); ctx.fillStyle=oc; ctx.fillRect(-4,-18,8,24); ctx.fillStyle='#8a94a6'; ctx.fillRect(-2.5,-17,5,22); ctx.strokeStyle=oc; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(0,0,12,0.2,Math.PI-0.2); ctx.stroke(); ctx.strokeStyle='#8a94a6'; ctx.lineWidth=3; ctx.stroke(); ctx.fillStyle='#8a94a6'; ctx.beginPath(); ctx.arc(0,-20,4,0,TAU); ctx.fill(); ctx.restore(); }
function c1Salt2(e,fl){ const x=e.x, y=e.y, r=e.r, f=e.face, solid=saltSolid(e); ctx.save(); ctx.globalAlpha*=solid?1:0.6; c1Shadow2(e,1.1); ctx.translate(x,y); ctx.rotate(f);
  c1E2(0,0,r*0.9,r*0.8,fl?'#fff':solid?'#a8443a':'#78bcd8'); c1E2(r*0.3,0,r*0.5,r*0.5,'#f4faff',0,1.4); ctx.fillStyle=solid?'#2a2230':'#4a6a90'; ctx.beginPath(); ctx.moveTo(-r*0.6,-r*0.7); ctx.lineTo(r*0.6,0); ctx.lineTo(-r*0.6,r*0.7); ctx.closePath(); ctx.fill(); ctx.restore(); if(e.anchor) c1DrawAnchor(e); }
// the ghost deck and the two ghost cannons rise out of the sand with the fight
// the wreck of the Saucy Gull: a tilted wooden deck in the sand (old planks, a rail, the stump of the mast, a hole),
// and two broken cannons with a cold ghost light in their mouths
FZP.c1deck=(A,pr)=>{ const f=c1Sm(pr.h), x=pr.x, y=pr.y, oc=C1OL(); if(f<0.02) return; ctx.save(); ctx.globalAlpha=f; ctx.translate(x,y); ctx.rotate(-0.12);
  const hull=()=>{ ctx.beginPath(); ctx.moveTo(-134,-32); ctx.lineTo(118,-42); ctx.quadraticCurveTo(156,-2,120,40); ctx.lineTo(-134,36); ctx.quadraticCurveTo(-146,2,-134,-32); ctx.closePath(); };
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(4,16,150,54,0,0,TAU); ctx.fill();
  hull(); ctx.fillStyle='#6e5238'; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=oc; ctx.stroke();
  ctx.save(); hull(); ctx.clip(); ctx.strokeStyle='#4e3824'; ctx.lineWidth=1.6; for(let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(-140,i*11); ctx.lineTo(150,i*11-5); ctx.stroke(); }
    for(let i=0;i<9;i++){ const px=-120+i*30, py=((i*37)%5-2)*11; ctx.beginPath(); ctx.moveTo(px,py-5); ctx.lineTo(px,py+5); ctx.stroke(); }
    ctx.fillStyle='rgba(255,230,190,.12)'; ctx.fillRect(-140,-44,300,14);
    ctx.fillStyle='#2a1c14'; ctx.beginPath(); ctx.ellipse(52,12,18,9,0.2,0,TAU); ctx.fill(); ctx.restore();
  ctx.strokeStyle='#8a6a48'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-128,-30); ctx.lineTo(112,-40); ctx.stroke();
  ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(-20,-4,11,7,0,0,TAU); ctx.fill(); ctx.fillStyle='#8a6a48'; ctx.beginPath(); ctx.ellipse(-20,-5,8.5,5,0,0,TAU); ctx.fill(); ctx.fillStyle='#6e5238'; ctx.fillRect(-23,-24,6,19); ctx.strokeStyle=oc; ctx.lineWidth=1.6; ctx.strokeRect(-23,-24,6,19);
  ctx.restore();
  for(const s of [-1,1]){ const cx=x+s*90, cy=y-30, e=G.boss&&G.boss.type==='c_saltbeard'?G.boss:null; ctx.save(); ctx.globalAlpha=f;
    ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(cx,cy+2,22,12,0,0,TAU); ctx.fill(); ctx.fillStyle='#4a4e5a'; ctx.beginPath(); ctx.ellipse(cx,cy+1,19,10,0,0,TAU); ctx.fill();
    ctx.fillStyle='#6a707e'; ctx.beginPath(); ctx.ellipse(cx-4,cy-2,10,4,0,0,TAU); ctx.fill(); ctx.fillStyle='#1a1e28'; ctx.beginPath(); ctx.arc(cx+s*10,cy-4,5.5,0,TAU); ctx.fill();
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=f*(e&&e.cannonFx>0?1:0.45+0.15*Math.sin(G.time*3+s)); ctx.drawImage(foGlowSpr('150,210,255'),cx+s*10-(e&&e.cannonFx>0?30:14),cy-4-(e&&e.cannonFx>0?30:14),e&&e.cannonFx>0?60:28,e&&e.cannonFx>0?60:28); ctx.restore(); } };
ARENA_STY.c_reef=function(g,rng,v,tint){ const base='#6e7c88', out='#2a2430', w=30+rng()*8, h=26+rng()*10, x=24-w/2, y=54-h;
  g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(24,55,w*0.62,4.5,0,0,TAU); g.fill();
  g.beginPath(); g.moveTo(x,54); g.lineTo(x+3,y+6); g.quadraticCurveTo(24,y-6,x+w-3,y+4); g.lineTo(x+w,54); g.closePath(); g.fillStyle=base; g.fill(); g.lineWidth=1.7; g.strokeStyle=out; g.stroke();
  g.fillStyle=shd(base,0.25); g.beginPath(); g.ellipse(x+w*0.35,y+8,w*0.25,4,0,0,TAU); g.fill();
  g.fillStyle='#e8e0cc'; for(let i=0;i<6;i++){ const bx=x+4+rng()*(w-8), by=y+10+rng()*(h-14); g.beginPath(); g.moveTo(bx-2.4,by+2); g.lineTo(bx,by-2.6); g.lineTo(bx+2.4,by+2); g.closePath(); g.fill(); }
  g.strokeStyle='#4e8a5a'; g.lineWidth=2; for(let i=0;i<(v===1?3:1);i++){ const kx=x+5+rng()*(w-10); g.beginPath(); g.moveTo(kx,54); g.quadraticCurveTo(kx+4,y+12,kx-2,y+2); g.stroke(); } };

// ================= 12. Vesper, the Moth Mask (c_mothmask), boss of the Shadow Spire (the Roof)
// A round roof of black glass (radius 420) under the moon: four moon pillars, the broken moon-lamp in the middle, five
// shadow pools (Easy 3). The edge is a long drop (back on the roof, 10 percent health). Every 10 s the lighthouse beam
// sweeps across the roof (a gold band): in it the clones vanish, the pools close, and the real Vesper casts a shadow.
// Phase 1 The Dance: dash slash (violet line; her afterimage stings 1 s; into a pillar she is dizzy), hook flurry
// (three white arcs), moth bomb (silver mark, a slowing cloud), vault (onto a pillar, then down on an orange circle:
// she lands low for 1 s). Hard: a feint (the dash line, then a dash from the other side).
// Phase 2 Shadow Clones: she and 3 clones (Easy 2, Hard 4), all masked. Clones hit for 40 percent and pop in one hit;
// only the real one is hurt. The tells: the beam's shadow; Bolt barks at her (c_bolt done); the shell locket glints
// (c_locket_given or a1_locket_left); fire burns clones away; Pip burns a clone every 15 s. New clones every 12 s.
// Phase 3 Into the Dark: she dives into a pool and pops out of another (it darkens first) to slash. SHADOW DASH into the
// pool she is in: she is knocked out, dazed 2.5 s. Fire on a pool closes it for 6 s. Moths join every 15 s.
// At 10 percent she drops to one knee and the fight stops: C1.hook.vesperKneel(e, finish) (the story helper's choice,
// default STORY.c_choice), then finish() ends the fight (she is not killed).
c1Lines('c_mothmask','c_roof_intro',null,
  [['narr',S('The top of the Shadow Spire. A round roof of black glass under an enormous moon. In the middle stands a broken lamp, dark and violet, and a ring of moths turning slowly around it.','The top of the Spire. Black glass, a huge moon, a broken lamp. Moths turn round it.')],
   ['c_vesper',S('You climbed the Spire. Of course you did. Is there anything you do not climb?','You climbed the Spire. Of course you did.')],
   ['ash',S('Ladders. Ladders are weird. Vesper, give me the Heart.','Ladders. Ladders are weird. Give me the Heart, Vesper.')],
   ['narr',S('She pulls on her mask. Around her, three shadows stand up out of the floor and pull on masks too.','She puts on her mask. Three shadows stand up and put on masks too.')],
   ['c_mask',S('Let us finish the chase, little ember.','Let us finish the chase, little ember.')]],[]);
const C1_VESPER_CHOICE=[
  ['narr',S('Vesper drops to one knee. Her clones melt back into the floor. The violet light in her hand flickers.','Vesper drops to one knee. Her clones melt away.')],
  ch('narr',S('She raises her moth hooks one more time.','She raises her hooks again.'),[
    {t:S('Finish the fight','Finish the fight'),tone:'brave',fn:()=>{ G.choices.c_vesper='foe'; }},
    {t:S('Lower your sword. "Why are you doing this?"','Lower your sword. Ask her why.'),tone:'kind',cond:()=>(G.flags.c_trust||0)>=4,fn:()=>{ G.choices.c_vesper='friend'; }}])];
function vesperC(e){ const D=c1RoomOf(e.real||e); return D; }
// the roof is round: hold foes and spots inside the glass
function vesperHold(D,o,m){ const d=dist(o.x,o.y,D.R.cx,D.R.cy), lim=D.RP-(m||0); if(d>lim){ const a=angTo(D.R.cx,D.R.cy,o.x,o.y); o.x=D.R.cx+Math.cos(a)*lim; o.y=D.R.cy+Math.sin(a)*lim; } return o; }
// dash slash: a violet line, a fast dash (its afterimage stings for 1 s), dizzy if it ends in a pillar
FZK.c1after={
  tick(z,dt){ const p=player; if(z.harm&&!z.hit&&!p.dead&&!c1Up()&&segD(p.x,p.y,z.x0,z.y0,z.x1,z.y1)<16+p.r*0.5&&!(typeof p2Shadowed==='function'&&p2Shadowed())){ z.hit=true; hurtPlayer(z.dmg,p.x,p.y,160); } },
  drawG(z){ const a=clamp(1-z.t/z.life,0,1); ctx.save(); ctx.globalAlpha=a*0.8; ctx.strokeStyle='rgba(150,100,230,.6)'; ctx.lineWidth=22; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(z.x0,z.y0); ctx.lineTo(z.x1,z.y1); ctx.stroke(); ctx.strokeStyle='rgba(220,200,255,.8)'; ctx.lineWidth=5; ctx.stroke();
    for(let i=1;i<=3;i++){ const u=i/4, x=lerp(z.x0,z.x1,u), y=lerp(z.y0,z.y1,u); ctx.globalAlpha=a*0.35; ctx.fillStyle='#6a4aa0'; ctx.beginPath(); ctx.ellipse(x,y-14,7,14,0,0,TAU); ctx.fill(); } ctx.restore(); }
};
FM.c1dash={
  start(e,m){ const o=m.o; e.state='dashW'; e.st=fkW(o,byDiff(0.6,0.5,0.45)); e.tele=newTele({shape:'line',len:o.len||300,w:34,dur:e.st,col:C1COL.violet}); m.feint=foeDiff().hard&&!e.clone&&Math.random()<0.3; },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ if(e.st>0.12) e.face=turnTo(e.face,a,6*dt); e.st-=dt; if(e.st>0) return false;
      if(m.feint){ m.feint=false; c1Puff(e.x,e.y-14,'150,110,210',16); const D=vesperC(e), q={x:p.x*2-e.x,y:p.y*2-e.y}; if(D) vesperHold(D,q,30); e.x=q.x; e.y=q.y; e.face=angTo(e.x,e.y,p.x,p.y); e.st=fkW(o,0.4); e.tele=newTele({shape:'line',len:o.len||300,w:34,dur:e.st,col:C1COL.violet}); c1Txt(e,S('A feint!','Trick!'),'#d8c0ff',13); return false; }
      m.go=true; m.hit=false; e.tele=null; e.state='dash'; e.st=m.T=(o.len||300)/1100; m.x0=e.x; m.y0=e.y; SFX.play('dash'); return false; }
    const s=1100; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
    if(!m.hit&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+8&&!c1Up()){ if(hurtPlayer(fkDmg(e,o),e.x,e.y,300)) m.hit=true; }
    const bumped=e.st<m.T-0.04&&foeBumped(e); e.st-=dt;
    if(bumped||e.st<=0){ fzAdd('c1after',{x0:m.x0,y0:m.y0,x1:e.x,y1:e.y,life:1,harm:!foeDiff().easy,dmg:c1Dmg(e.real||e,10)*(e.clone?0.4:1)});
      if(bumped&&!e.clone){ e.state='dizzy'; e.stun=0; e.dizzyT=1; c1Txt(e,S('Bonk! Into the pillar!','Bonk!'),'#ffe066',15); shake(5); return true; } return true; }
    return false; } };
// vault: up onto a pillar (out of reach), then down onto an orange circle where Ash stands; she lands low for 1 s
FM.c1vault={
  start(e,m){ const D=vesperC(e); if(!D){ m.skip=true; e.state='recover'; e.st=0.1; return; } let best=null, bd=1e9; for(const q of D.pillars){ const dd=dist(e.x,e.y,q.x,q.y); if(dd<bd){ bd=dd; best=q; } } m.P=best; m.x0=e.x; m.y0=e.y; m.ph=0; m.t=0; e.state='vaultW'; e.st=0.25; },
  tick(e,dt,d,a,m){ if(m.skip) return true; const p=player; m.t+=dt;
    if(m.ph===0){ e.st-=dt; if(e.st<=0){ m.ph=1; m.t=0; e.state='vault'; SFX.play('jump'); } return false; }
    if(m.ph===1){ const u=clamp(m.t/0.45,0,1); e.x=lerp(m.x0,m.P.x,u); e.y=lerp(m.y0,m.P.y,u); e.vz=56*Math.sin(u*Math.PI*0.5)+(u>=1?0:0); e.z=56*c1Sm(u)+Math.sin(u*Math.PI)*30; e.noClip=true; if(u>=1){ m.ph=2; m.t=0; e.state='perch'; e.z=56; m.wait=byDiff(0.9,0.7,0.5); } return false; }
    if(m.ph===2){ e.face=turnTo(e.face,angTo(e.x,e.y,p.x,p.y),6*dt); if(m.t>=m.wait){ m.ph=3; m.t=0; const q={x:p.x,y:p.y}; m.tx=q.x; m.ty=q.y; m.T=c1W({},0.8); c1Mark({x:q.x,y:q.y,r:62,dur:m.T,col:C1COL.orange}); e.state='perch'; } return false; }
    if(m.ph===3){ if(m.t>=m.T){ m.ph=4; m.t=0; m.x1=e.x; m.y1=e.y; e.state='vault'; } return false; }
    if(m.ph===4){ const u=clamp(m.t/0.3,0,1); e.x=lerp(m.x1,m.tx,u); e.y=lerp(m.y1,m.ty,u); e.z=56*(1-u)+Math.sin(u*Math.PI)*20; if(u>=1){ e.z=0; e.noClip=false; shake(7); SFX.play('boom'); emit(e.x,e.y,18,{col:'150,110,210',glow:false,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:5});
        if(!p.dead&&!c1Up()&&dist(p.x,p.y,e.x,e.y)<62+p.r*0.5) hurtPlayer(fkDmg(e,m.o),e.x,e.y,360); e.state='stuck'; e.st=1; return true; } return false; }
    return true; } };
Object.assign(FM_DEF,{c1dash:{recover:0.4},c1vault:{recover:0.9,after:'stuck'}});
const VESPER_MOVES=[{k:'c1dash',len:300,dmgN:26,min:60,max:420,w:3},
  {k:'c1combo',n:3,reach:58,half:0.9,windup:0.35,windup2:0.2,gap:0.12,lunge:160,dmgN:15,col:C1COL.white,max:90,w:3,st:'windup'},
  {k:'c1lob',st:'throw',windup:0.45,flight:0.7,r:56,col:C1COL.silver,min:140,every:5,w:1.6,ball:'#c8c0e0',land:(e,x,y)=>{ const p=player; emit(x,y,20,{col:'210,200,240',smin:40,smax:150,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:8,drag:2}); SFX.play('pop'); if(!p.dead&&!c1Up()&&dist(x,y,p.x,p.y)<56+p.r*0.5){ hurtPlayer(c1Dmg(e.real||e,12)*(e.clone?0.4:1),x,y,60); p.slowT=Math.max(p.slowT||0,1.5); } fzAdd('c1cloud',{x,y,r:60,life:2.6,slow:0.25,col:'200,190,235'}); }},
  {k:'c1vault',dmgN:28,every:7,min:100,w:1.5,if:e=>!e.clone}];
const VESPER_AI=FK.brain({move:'strafe',slant:1.1,stop:70,turn:8,cd:[0.5,1.1],recoverMove:0.4,pre:vesperPre,moves:VESPER_MOVES});
const CLONE_AI=FK.brain({move:'strafe',slant:1.2,stop:80,turn:7,cd:[1.1,2.0],recoverMove:0.4,pre:(e,dt)=>{ if(e.dizzyT>0){ e.dizzyT-=dt; e.state='dizzy'; e.dx=e.dy=0; return true; } },moves:VESPER_MOVES.slice(0,3)});
defineFoe('c_mothmask',{boss:true,name:'Vesper',title:S('The Moth Mask, One Roof Ahead','the Moth Mask'),short:'Vesper',
  lv:13,hp:7200,r:13,speed:230,dmg:26,value:2500,kbRes:0.5,dcol:'170,140,220',phases:[0.66,0.33],
  phaseText:[[S('Shadow Clones!','Clones!'),S('Which one is real? Only she gets hurt. Watch the beam, listen for Bolt, look for the glint. Fire burns the fakes away.','Which one is real? Use the beam! Fire pops fakes.'),['c_mask',S('Which one is me? Guess!','Which one is me? Guess!')]],
             [S('Into the Dark!','Into the dark!'),S('She dives into the shadow pools. SHADOW DASH into the pool she is in! Fire closes a pool.','Dash into her pool! Fire closes pools.'),['c_mask',S('You cannot follow me here!','You cannot follow me here!')]]],
  init(e){ c1BossInit(e); e.cloneT=0; e.pipT=15; e.mothT=15; e.barkT=2; e.onShadow=vesperShadowHit; },
  onPhase(e,i){ if(i===1){ vesperSplit(e,true); } if(i===2){ vesperClear(e); e.poolT=0.6; e.mode='surface'; e.surfT=1.2; } },
  ai:VESPER_AI,
  onHurt(e,amt,o){ if(e.kneel||e.sunk||e.state==='vault'||e.state==='perch') return false;
    let a=amt; if(e.state==='stuck'||e.state==='dizzy') a*=1.3; if(e.dazeT>0) a*=1.5;
    // she only kneels once Ash has followed her into the dark (Shadow Tackles in phase 3)
    const gate=(e.bph||0)>=2&&(e.tackles||0)<byDiff(1,2,2);
    if(gate&&e.hp<e.maxHp*0.115&&!(e._gtT>G.time)){ e._gtT=G.time+3; c1Txt(e,S('She will not give up yet! Shadow Dash into her pool!','Dash into her pool!'),'#ffd27a',13); }
    return c1Floor(e,a,o,gate?0.105:0.095); },
  speaker:{id:'c_mask',name:'The Moth Mask',col:'#b8a8d8'},
  draw3d:c1FigVesper, draw2d:c1Vesper2,
  sheet:c1Sheet([{state:'chase',label:'idle'},{state:'chase',dx:120,label:'run'},{state:'dashW',st:0.3,at:0.4,label:'dash windup'},{state:'dash',dx:500,label:'dash'},{state:'windup',st:0.2,label:'flurry'},{state:'strike',comboI:1,label:'strike'},
         {state:'throw',st:0.2,at:0.35,label:'moth bomb'},{state:'perch',z:56,label:'perch'},{state:'stuck',label:'landed low'},{state:'sink',st:0.2,at:0.25,label:'pool dive'},{state:'kneel',kneel:true,label:'kneel'},{state:'chase',deathT:0.3,label:'death'}])});
defineFoe('c_mothclone',{name:'Moth Mask',r:13,hp:1,speed:220,dmg:26,value:0,kbRes:0.8,dcol:'150,110,210',lv:13,
  ai:CLONE_AI,
  init(e){ e.clone=true; e.dmg*=0.4; e.real=G.boss&&G.boss.type==='c_mothmask'?G.boss:null; if(e.real){ e.arena=e.real.arena; e.c1room=e.real.c1room; e.inArea=e.real.inArea; e.room=e.real.room; } e.leash=99999; e.elite=false; },
  onHurt(e,amt,o){ vesperPop(e,foeHit(e,o).fire?S('Burnt away!','Poof!'):S('Just a shadow!','A fake!')); return false; },
  draw3d:c1FigVesper, draw2d:c1Vesper2, sheet:[{state:'chase',label:'clone'}]});
function vesperClones(){ return G.enemies.filter(q=>!q.dead&&q.type==='c_mothclone'); }
function vesperPop(c,txt){ if(c.dead) return; c.dead=true; c1Puff(c.x,c.y-16,'150,110,210',20); SFX.play('pop'); if(txt) ftext(c.x,c.y-40,txt,'#d8c0ff',13); }
function vesperClear(e){ for(const c of vesperClones()) vesperPop(c,null); }
function vesperSplit(e,first){
  const D=c1RoomOf(e), n=byDiff(2,3,4)-vesperClones().length; if(n<=0) return; const L=fkLevel(e,{});
  const spots=[]; for(let i=0;i<=n;i++){ const an=rand(0,TAU), r=rand(90,260); const q={x:(D?D.R.cx:e.x)+Math.cos(an)*r,y:(D?D.R.cy:e.y)+Math.sin(an)*r}; if(D) vesperHold(D,q,40); spots.push(q); }
  c1Puff(e.x,e.y-16,'150,110,210',22); e.x=spots[0].x; e.y=spots[0].y; e.mv=null; e.tele=null; e.state='chase'; c1Puff(e.x,e.y-16,'150,110,210',22);
  for(let i=1;i<=n;i++){ const c=makeEnemy('c_mothclone',spots[i].x,spots[i].y,{level:L,aggro:true,elite:false,homeX:spots[i].x,homeY:spots[i].y,leash:99999}); c.spawnIn=0.2; c.cd=rand(0.6,1.6); c1Puff(c.x,c.y-16,'150,110,210',18); }
  SFX.play('cast'); if(!first) c1Say(e,'c_mask',S('Keep up, little ember!','Keep up, little ember!'),8);
}
function vesperShadowHit(e,how){ if(e.dead||e.kneel||!e.sunk) return; e.tackles=(e.tackles||0)+1; e.sunk=false; e.mode='surface'; e.surfT=3.5; e.r=e.r0||13; e.dazeT=2.5; e.state='dizzy'; e.mv=null; e.tele=null; e.z=0; e.alpha=1;
  shake(10); SFX.play('boom'); emit(e.x,e.y,26,{col:'150,110,210',glow:false,smin:60,smax:220,lmin:.4,lmax:.8,zmin:2,zmax:5,grow:6}); c1Txt(e,S('SHADOW TACKLE! She is dazed!','Shadow tackle!'),'#ffe066',16);
  if(!C1.vesperSaw){ C1.vesperSaw=true; taunt('c_mask',S('...How did you DO that?','How did you DO that?')); } }
function vesperPre(e,dt,d,a){
  const p=player, D=c1RoomOf(e), F=foeDiff();
  if(e.kneel){ e.dx=e.dy=0; e.state='kneel'; e.st=0.2; return true; }
  if(e.hp<=e.maxHp*0.1+0.5&&!e.kneel&&e.phaseT<=0){ vesperKneel(e); return true; }
  if(e.dizzyT>0){ e.dizzyT-=dt; e.dx=e.dy=0; e.state='dizzy'; e.st=0.2; if(e.dizzyT<=0){ e.state='recover'; e.st=0.3; } return true; }
  if(e.dazeT>0){ e.dazeT-=dt; e.dx=e.dy=0; e.state='dizzy'; e.st=0.2; if(e.dazeT<=0){ e.state='recover'; e.st=0.3; } return true; }
  // the tells and the helpers (phase 2): Bolt's bark, Pip's flame, new clones every 12 s
  if(e.bph===1){ e.cloneT+=dt*F.atk; if(e.cloneT>=12){ e.cloneT=0; vesperSplit(e,false); }
    if(vesperBolt()){ e.barkT-=dt; if(e.barkT<=0){ e.barkT=3.2; e.bark=0.9; ftext(e.x,e.y-52,S('WOOF! (That one!)','WOOF!'),'#ffe0a0',14); SFX.play('ui'); if(C1.hook.boltBark) C1.hook.boltBark(e); } }
    if(G.flags.pip||G.flags.a1_pip){ e.pipT-=dt; if(e.pipT<=0){ e.pipT=15; const L=vesperClones(); if(L.length){ const c=pick(L), P=G.pip||player; emit(P.x,P.y-10,14,{kind:'fire',ang:angTo(P.x,P.y,c.x,c.y),spread:0.2,smin:200,smax:320,lmin:.3,lmax:.5,zmin:3,zmax:5,grow:8}); later(0.3,()=>vesperPop(c,S('Pip burnt a fake!','Pip got one!'))); taunt('pip',S('Mip!','Mip!')); } } } }
  if(e.bark>0) e.bark-=dt;
  if(e.bph===2){ e.mothT-=dt*F.atk; if(e.mothT<=0){ e.mothT=15; const L=fkLevel(e,{}); if(countType('c_moth')<5) for(let i=0;i<3;i++){ const s=spotNear(e.x,e.y,80,200); spawnRune('c_moth',s.x,s.y,{level:L,aggro:true,swarm:true},0.8); } c1Say(e,'c_mask',S('Come, little moths!','Come, moths!'),8); }
    if(vesperPools(e,dt,d,a,D)) return true; }
  if(D){ const q={x:e.x,y:e.y}; vesperHold(D,q,e.r+6); e.x=q.x; e.y=q.y; }
  bossCad(e,e.bph>=1?0.85:1);
  return false;
}
function vesperBolt(){ return !!((G.quests&&G.quests.c_bolt&&G.quests.c_bolt.done)||G.flags.c_bolt_done||G.flags.c_bolt); }
// phase 3: dive into a pool, travel under the glass, pop out of another (it darkens first) with a slash
function vesperPools(e,dt,d,a,D){
  if(!D) return false; const p=player, F=foeDiff(), open=D.pools.filter(q=>!(q.closedT>0)&&!q.beamed);
  e.poolT-=dt;
  switch(e.mode){
    case 'surface': e.surfT-=dt; if(e.surfT<=0&&!e.mv&&e.state==='chase'&&open.length){ let best=null, bd=1e9; for(const q of open){ const dd=dist(e.x,e.y,q.x,q.y); if(dd<bd){ bd=dd; best=q; } } e.pool=best; e.mode='toPool'; } return false;
    case 'toPool': { const q=e.pool; if(!q||q.closedT>0){ e.mode='surface'; e.surfT=0.5; return false; } steer(e,q.x,q.y,e.speed*1.1*F.spd); e.state='chase'; e.face=turnTo(e.face,angTo(e.x,e.y,q.x,q.y),10*dt); if(dist(e.x,e.y,q.x,q.y)<12){ e.mode='sink'; e.mst=0; e.state='sink'; SFX.play('roll'); } return true; }
    case 'sink': e.dx=e.dy=0; e.state='sink'; e.mst+=dt; e.x=e.pool.x; e.y=e.pool.y; if(e.mst>=0.4){ e.sunk=true; e.r=30; e.mode='under'; e.mst=0; } return true;
    case 'under': { e.dx=e.dy=0; e.state='sunk'; e.mst+=dt; e.sunk=true; e.alpha=0.15; if(e.mst>=byDiff(1.2,1.0,0.8)){ const L=open.filter(q=>q!==e.pool); const nx=L.length?L.slice().sort((A,B)=>dist(A.x,A.y,p.x,p.y)-dist(B.x,B.y,p.x,p.y))[Math.min(L.length-1,(Math.random()*2)|0)]:e.pool; e.pool=nx; e.x=nx.x; e.y=nx.y; e.mode='popW'; e.mst=0; e.popT=c1W({},byDiff(0.9,0.6,0.5)); nx.dark=e.popT; } return true; }
    case 'popW': e.dx=e.dy=0; e.state='sunk'; e.mst+=dt; e.x=e.pool.x; e.y=e.pool.y; if(e.mst>=e.popT){ e.sunk=false; e.r=e.r0||13; e.alpha=1; e.mode='surface'; e.surfT=byDiff(3,2.4,2); shake(6); SFX.play('slash3');
        if(!p.dead&&!c1Up()&&dist(p.x,p.y,e.x,e.y)<84+p.r*0.5) hurtPlayer(c1Dmg(e,26),e.x,e.y,320); emit(e.x,e.y,20,{col:'120,80,180',glow:false,smin:40,smax:180,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6}); e.state='recover'; e.st=0.5; } return true;
  }
  return false;
}
function vesperKneel(e){
  e.kneel=true; e.mv=null; e.tele=null; e.state='kneel'; e.sunk=false; e.r=e.r0||13; e.alpha=1; e.z=0; e.noPhase=true; vesperClear(e); G.fz=[];
  G.projectiles=G.projectiles.filter(q=>q.owner!=='enemy'); for(const q of G.enemies) if(!q.dead&&q!==e&&q.type==='c_moth'){ q.dead=true; c1Puff(q.x,q.y-16,'190,185,215',10); }
  shake(6); SFX.play('warn'); player.iframes=Math.max(player.iframes,3);
  G.taunt=null; G.tauntQ=[];   // her fight lines stop with the fight (none left to pop up over the scenes after it)
  later(1.4,()=>{ if(e.dead) return; const finish=()=>vesperFinish(e);
    if(C1.hook.vesperKneel){ try{ C1.hook.vesperKneel(e,finish); }catch(err){ console.error(err); finish(); } return; }
    runDialogue(STORY.c_choice||C1_VESPER_CHOICE,()=>{ scene='play'; finish(); }); });
}
function vesperFinish(e){
  if(e.dead) return; const k=G.fightSite;
  c1Puff(e.x,e.y-16,'170,140,220',30); e.dead=true; e.hp=0; gainXp(foeXp(e)); G.bossDone.c_mothmask=true;
  vesperClear(e); bossFightEnd(false); G.boss=null; G.fightSite=null; G.fightIntro=false; if(k) delete G.siteGuards[k];
  if(e.c1room&&AREA&&AREA.rooms&&!e.c1room.solved){ try{ solveRoom(e.c1room,true); }catch(err){} }
  c1Won('c_mothmask');
  if(C1.hook.vesperDone) try{ C1.hook.vesperDone(e); }catch(err){ console.error(err); } saveGame();
}
// ---- her look: a slim girl in a hooded moth cloak (two pale eye-spots), a silver moth-wing mask, two moth hooks
function c1FigVesper(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||13)/13, face=t3Turn(e,e.face,st==='dash'?20:14), fx=e.x, fy=e.y+(e.r0||13)*0.45, inS=foSt(e), dead=foDeath(e), hurt=c1Hurt(e);
  const hood=fl?'#ffffff':foT(e,'#6a5a84'), cape=foT(e,'#7a6a92'), capeD=foT(e,'#4e4266'), vest=foT(e,'#4e4662'), low=foT(e,'#3e3854'), skin=foT(e,'#e6b894'), mask=foT(e,'#ece8f6'), maskD='#5e5478', hook='#dfe4ee', trim='#c8c0d8';
  const mv=foWalk(e,dt,4.6), w=e._wp||0, sw=Math.sin(w)*mv, bob=Math.abs(Math.cos(w))*mv*0.9;
  let lean=0.08+0.3*mv, crouch=0, aR=0, aL=0, spread=0, kneel=0, z=e.z||0, sink=0;
  if(st==='dashW'){ const q=c1Sm(clamp(inS/0.4,0,1)); crouch=3*q; lean=0.45*q; aR=-0.8*q; aL=-0.8*q; }
  else if(st==='dash'){ lean=0.9; crouch=2; aR=-1; aL=-1; }
  else if(st==='windup'){ const q=c1Sm(clamp(1-e.st/0.35,0,1)); if((e.comboI||0)%2) aL=-1*q; else aR=-1*q; lean=0.2; }
  else if(st==='strike'){ if((e.comboI||0)%2) aL=1.2; else aR=1.2; lean=0.35; }
  else if(st==='throw'){ aR=1.6*c1Sm(clamp(inS/0.4,0,1)); lean=-0.1; }
  else if(st==='vaultW'||st==='vault'||st==='perch'){ spread=st==='perch'?0.4:1; crouch=st==='perch'?3:st==='vaultW'?3:0; lean=st==='perch'?0.3:0.1; }
  else if(st==='stuck'){ crouch=4.5; lean=0.5; aR=0.3; aL=0.3; }
  else if(st==='dizzy'){ lean=0.1; } else if(st==='sink'){ sink=c1Sm(clamp(inS/0.4,0,1)); } else if(st==='kneel'||e.kneel){ kneel=1; }
  const P=foEase(e,'_fvs',foTg(lean,crouch,aR,aL,spread,kneel),dt,st==='strike'||st==='dash'?24:12); lean=P[0]; crouch=P[1]; aR=P[2]; aL=P[3]; spread=P[4]; kneel=P[5];
  if(e.sunk||st==='sunk'){ const g=foG(); g.save(); g.fillStyle='rgba(200,170,255,.8)'; for(const sd of [-1,1]){ g.beginPath(); g.arc(fx+sd*5,fy-3,1.8,0,TAU); g.fill(); } g.restore(); e._t3top=fy-20; return; }
  foBegin(fx,fy,face,k,fl,z-sink*16);
  if(dead) foSet(FOB,0,-dead*1.2,0,0,0,0,-dead*2); else if(st==='dizzy') foSet(FOB,0,0,Math.sin(t*7)*0.12,0);
  // legs (one knee down when she kneels)
  foLow();
  for(const sd of [-1,1]){ const o=sw*sd*4, kn=kneel&&sd>0, hz=13-crouch-kneel*4;
    if(kn){ foL(0,sd*2.6,hz,4,sd*2.8,4,1.7,low,1.4); foL(4,sd*2.8,4,-1,sd*2.8,0.8,1.5,low,1.2); }
    else{ foL(0,sd*2.6,hz,o*0.5+crouch*0.6,sd*3,6-crouch*0.4,1.7,low,1.5); foL(o*0.5+crouch*0.6,sd*3,6-crouch*0.4,o,sd*3,1,1.5,low,1.3); foE(o+1.2,sd*3,0.8,2.4,1.4,0.9,'#3a3046'); } }
  // the thin tail, lashing free while she fights
  const tl=Math.sin(t*6)*3; foL(-2,0,11-crouch,-8,tl,8-crouch,0.9,capeD,0.6); foL(-8,tl,8-crouch,-13,tl*1.6,10,0.6,capeD,0.3);
  foUp(); foSet(FOA,13-crouch-kneel*4,lean+kneel*0.45-hurt*0.25,0,0,0,0,bob-crouch-kneel*4);
  // the moth cloak behind: it spreads like wings when she leaps, with two pale eye-spots
  const cw=4+spread*12, cl=lerp(-12,-6,spread);
  for(const sd of [-1,1]){ foQ([-1.6,sd*3.4,23, -3,sd*(4+cw),20+spread*2, cl*0.5-2.4,sd*(4.6+cw*1.05),12+spread*5, cl-2,sd*(3+cw*0.9),4+spread*8, cl*0.6-3,sd*(2.2+cw*0.5),6.4+spread*6, -4,sd*1,4],cape,capeD,-0.4);
    foD(-3.2-spread*1,sd*(4+cw*0.6),14+spread*4,1.6+spread,'#f2eef8',-0.38); foD(-3.1-spread*1,sd*(4+cw*0.6),14+spread*4,0.9+spread*0.5,'#5a4a78',-0.37); }
  foE(0,0,19,3.8,4,5.6,vest); foN(3.6,-2.6,17,3.6,2.6,17,0.7,trim,0.04);
  // arms with the two moth hooks
  for(const sd of [-1,1]){ const A=sd>0?aR:aL, hx=4+A*3.4+spread*-2, hy=sd*(4.6+spread*6), hz=15+A*4+spread*6;
    foL(0,sd*3.8,22,(hx)/2,sd*(4.6+spread*3),(22+hz)/2+1,1.2,vest,1.1); foL(hx/2,sd*(4.6+spread*3),(22+hz)/2+1,hx,hy,hz,1.1,skin,1);
    const hdx=Math.cos(A*0.8-0.2), hdz=Math.sin(A*0.8-0.2); foN(hx,hy,hz,hx+hdx*5,hy,hz+hdz*5,0.8,hook,0.03); foC(hx+hdx*5,hy,hz+hdz*5,hx+hdx*6.6-hdz*2.4,hy,hz+hdz*6.6+hdx*2.4,0.7,hook,0.04); }
  // head: the hood, the silver moth-wing half mask with antennae, the pony tail
  foB(0.6,0,27.6,5,skin); foE(-0.6,0,28.6,5.6,5.8,5.4,hood); foC(-3,0,32,-6.6,0,34,2.2,hood);
  foL(-4.6,0,29,-9,Math.sin(t*4)*1.2,25,1.4,'#3a3240',0.8);
  for(const sd of [-1,1]){ foQ([6.1,0,31.4, 6.5,sd*2.6,32.2, 6.2,sd*5.6,31.2, 5.8,sd*5.4,28.2, 5.9,sd*2.6,27, 6.3,0,27.8],mask,maskD,0.07,true);
    foD(6.4,sd*4,30,0.9,'#a89cc4',0.08); foD(6.8,sd*1.9,29.4,0.85,e.clone?'#9a7ad8':'#c8a8ff',0.09); foD(7,sd*1.7,29.7,0.3,'#ffffff',0.1);
    foN(6,sd*1,32,7.8,sd*3.2,36,0.38,maskD,0.08); foN(7.2,sd*2.4,34.8,8.2,sd*1.4,35.6,0.3,maskD,0.09); }
  foN(5.6,-1.2,25.6,5.6,1.2,25.6,0.5,'#9a6a5a',0.06);
  // the shell locket glints on the real Vesper (a tell)
  if(!e.clone&&(G.flags&&(G.flags.c_locket_given||G.flags.a1_locket_left))){ const gl=Math.max(0,Math.sin(t*3)); foD(3.8,0,20,0.9,'#f4e8d8',0.06); if(gl>0.7) foGlow(4,0,20,7*gl,'255,250,230',gl,false); }
  if(e.bark>0&&!e.clone) foGlow(0,0,40,10*e.bark,'255,220,140',0.7*e.bark,false);
  foEnd(16); e._t3top=foTop(fy,36,k,z);
}
function c1Vesper2(e,fl){
  if(e.sunk){ ctx.save(); ctx.fillStyle='rgba(200,170,255,.8)'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(e.x+s*5,e.y,2,0,TAU); ctx.fill(); } ctx.restore(); return; }
  const x=e.x, y=e.y-(e.z||0)*0.6, r=13, f=e.face; ctx.save(); c1Shadow2(e,1); ctx.translate(x,y); ctx.rotate(f);
  ctx.fillStyle='#7a6a92'; ctx.strokeStyle=C1OL(); ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(2,-r*0.9); ctx.lineTo(-r*1.3,-r*1.2); ctx.lineTo(-r*1.4,r*1.2); ctx.lineTo(2,r*0.9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#f2eef8'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(-r*0.8,s*r*0.7,2.5,0,TAU); ctx.fill(); }
  c1E2(0,0,r*0.62,r*0.6,fl?'#fff':'#6a5a84'); c1E2(r*0.4,0,r*0.3,r*0.5,'#cfcbdc',0,1.2);
  ctx.strokeStyle='#dfe4ee'; ctx.lineWidth=2; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(r*0.9,s*r*0.6,4,0,Math.PI); ctx.stroke(); } ctx.restore();
}
// ---- the Roof (room decor): black glass under the moon, the drop around it, four moon pillars, the broken moon-lamp,
// the shadow pools, and the lighthouse beam that sweeps across every 10 s
C1ROOM.c_mothmask={
  build(R,A){ const hw=(R.x1-R.x0)/2, hh=(R.y1-R.y0)/2, RP=Math.min(420,Math.min(hw,hh)-30), D={R,type:'c_mothmask',RP,pillars:[],pools:[],beam:{t:4,x:null}};
    for(let i=0;i<4;i++){ const an=Math.PI/4+i*Math.PI/2, x=R.cx+Math.cos(an)*RP*0.6, y=R.cy+Math.sin(an)*RP*0.6; D.pillars.push({x,y}); addAreaCol({t:'c',x,y,r:22}); }
    addAreaCol({t:'c',x:R.cx,y:R.cy,r:38});
    const n=foeDiff().easy?3:5; for(let i=0;i<n;i++){ const an=-Math.PI/2+i*TAU/n+Math.PI/n; D.pools.push({x:R.cx+Math.cos(an)*RP*0.78,y:R.cy+Math.sin(an)*RP*0.78,an,r:46,closedT:0,dark:0,heat:0,beamed:false}); }
    return D; },
  tick(D,dt){ const e=G.boss&&G.boss.type==='c_mothmask'&&!G.boss.dead&&G.boss.c1room===D.R?G.boss:null, p=player, R=D.R, F=foeDiff();
    for(const q of D.pools){ if(q.closedT>0) q.closedT-=dt; if(q.dark>0) q.dark-=dt; q.beamed=false;
      if(F.hard&&e){ q.an+=dt*0.12; q.x=R.cx+Math.cos(q.an)*D.RP*0.78; q.y=R.cy+Math.sin(q.an)*D.RP*0.78; }
      if(e&&!(q.closedT>0)&&typeof inBreath==='function'&&inBreath(q.x,q.y,q.r)){ q.heat+=dt; if(q.heat>0.3){ q.heat=0; q.closedT=6; ftext(q.x,q.y-30,S('The pool closes!','Pool closed!'),'#ffd27a',13); SFX.play('shrine'); } } else q.heat=Math.max(0,q.heat-dt); }
    if(!e) return;
    // the lighthouse beam: a gold band sweeping across the roof every 10 s
    const B=D.beam; B.t-=dt; if(B.t<=0&&B.x==null){ B.x=R.cx-D.RP-120; } if(B.x!=null){ B.x+=dt*(2*D.RP+240)/1.8; const x=B.x; if(typeof p2ShineSeg==='function') p2ShineSeg(x,R.cy-D.RP,x,R.cy+D.RP,130);
      for(const c of vesperClones()) if(Math.abs(c.x-x)<70) vesperPop(c,S('The light shows the truth!','A fake!')); for(const q of D.pools) if(Math.abs(q.x-x)<80) q.beamed=true;
      if(x>R.cx+D.RP+120){ B.x=null; B.t=10; } }
    // the edge is a long drop: back on the roof, 10 percent health
    // (at the start of the fight Ash may still stand in a corner of the room: he is set on the glass, no harm done)
    if(!D.wasIn||D.wasIn!==e){ D.wasIn=e; if(dist(p.x,p.y,R.cx,R.cy)>D.RP-20){ const a=angTo(R.cx,R.cy,p.x,p.y); p.x=R.cx+Math.cos(a)*(D.RP-60); p.y=R.cy+Math.sin(a)*(D.RP-60); p.kvx=p.kvy=0; } }
    if(!p.dead&&!c1Up()&&!(typeof P2!=='undefined'&&(P2.mv||P2.dash))&&dist(p.x,p.y,R.cx,R.cy)>D.RP+6){ const a=angTo(R.cx,R.cy,p.x,p.y); if(!(window.__eb&&window.__eb.god)) p.hp=Math.max(1,p.hp-Math.ceil(p.maxHp*0.1)); p.x=R.cx+Math.cos(a)*(D.RP-120); p.y=R.cy+Math.sin(a)*(D.RP-120); p.kvx=p.kvy=0; p.iframes=1; G.fade=0.6; ftext(p.x,p.y-40,S('You fell off! Back on the roof.','You fell! Back up.'),'#ffb0a0',14); SFX.play('hurt'); } },
  ground(D,t){ const R=D.R, cx=R.cx, cy=R.cy, RP=D.RP; ctx.save();
    // the night around the roof
    ctx.beginPath(); ctx.rect(R.x0-48,R.y0-48,R.x1-R.x0+96,R.y1-R.y0+96); ctx.arc(cx,cy,RP,0,TAU,true); ctx.fillStyle='#120e26'; ctx.fill('evenodd');
    ctx.fillStyle='rgba(255,255,255,.75)'; for(let i=0;i<40;i++){ const x=R.x0+((i*397)%(R.x1-R.x0)), y=R.y0+((i*233)%(R.y1-R.y0)); if(dist(x,y,cx,cy)<RP+20) continue; const s=1+((i*7)%3)*0.6*(0.6+0.4*Math.sin(t*2+i)); ctx.fillRect(x,y,s,s); }
    // the black glass, with the moon in it
    ctx.fillStyle=C1OL(); ctx.beginPath(); ctx.arc(cx,cy,RP+6,0,TAU); ctx.fill(); ctx.fillStyle='#2e2846'; ctx.beginPath(); ctx.arc(cx,cy,RP,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(150,130,200,.35)'; ctx.lineWidth=2; for(let i=1;i<4;i++){ ctx.beginPath(); ctx.arc(cx,cy,RP*i/4,0,TAU); ctx.stroke(); } for(let i=0;i<8;i++){ const an=i/8*TAU; ctx.beginPath(); ctx.moveTo(cx+Math.cos(an)*60,cy+Math.sin(an)*60); ctx.lineTo(cx+Math.cos(an)*RP,cy+Math.sin(an)*RP); ctx.stroke(); }
    ctx.fillStyle='rgba(230,235,255,.18)'; ctx.beginPath(); ctx.ellipse(cx-RP*0.35,cy-RP*0.3,RP*0.22,RP*0.12,-0.5,0,TAU); ctx.fill();
    // the shadow pools
    for(const q of D.pools){ const cl=q.closedT>0||q.beamed, dk=q.dark>0; ctx.fillStyle=cl?'rgba(200,190,230,.35)':dk?'rgba(10,0,25,.95)':'rgba(30,14,60,.85)'; ctx.beginPath(); ctx.ellipse(q.x,q.y,q.r,q.r*0.62,0,0,TAU); ctx.fill();
      ctx.strokeStyle=cl?'rgba(255,230,160,.8)':'rgba(170,110,255,.8)'; ctx.lineWidth=2; ctx.stroke();
      if(!cl){ ctx.strokeStyle='rgba(170,120,255,.45)'; ctx.lineWidth=1.5; for(let i=0;i<2;i++){ ctx.beginPath(); ctx.ellipse(q.x,q.y,q.r*(0.4+0.25*i),q.r*(0.25+0.15*i),t*(i?1:-1.3),0,TAU*0.75); ctx.stroke(); } } }
    // the lighthouse beam crossing the roof
    const B=D.beam; if(B.x!=null){ ctx.globalCompositeOperation='lighter'; const g=ctx.createLinearGradient(B.x-70,0,B.x+70,0); g.addColorStop(0,'rgba(255,210,120,0)'); g.addColorStop(0.5,'rgba(255,220,140,.55)'); g.addColorStop(1,'rgba(255,210,120,0)'); ctx.fillStyle=g; ctx.fillRect(B.x-70,cy-RP,140,RP*2);
      const e=G.boss; if(e&&e.type==='c_mothmask'&&!e.dead&&!e.sunk&&Math.abs(e.x-B.x)<240){ ctx.globalCompositeOperation='source-over'; const s=e.x>B.x?1:-1; ctx.fillStyle='rgba(20,10,40,.55)'; ctx.beginPath(); ctx.ellipse(e.x+s*46,e.y+4,48,9,0,0,TAU); ctx.fill(); } }
    ctx.restore(); },
  tall(D,list){ for(const q of D.pillars){ if(!q.it) q.it={x:q.x,y:q.y+8,draw:()=>c1DrawMoonPillar(q)}; list.push(q.it); } if(!D.lit) D.lit={x:D.R.cx,y:D.R.cy+20,draw:()=>c1DrawMoonLamp(D)}; list.push(D.lit); }
};
function c1DrawMoonPillar(q){ const x=q.x, y=q.y, oc=C1OL(); ctx.save(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x,y+4,26,9,0,0,TAU); ctx.fill();
  ctx.fillStyle=oc; rrect(ctx,x-21,y-96,42,100,8); ctx.fill(); ctx.fillStyle='#4a4266'; rrect(ctx,x-18,y-93,36,95,6); ctx.fill(); ctx.fillStyle='#5e5680'; ctx.fillRect(x-14,y-93,9,95);
  ctx.fillStyle='#d8d0f0'; ctx.beginPath(); ctx.arc(x,y-62,9,0,TAU); ctx.fill(); ctx.fillStyle='#4a4266'; ctx.beginPath(); ctx.arc(x+4,y-64,8,0,TAU); ctx.fill();
  ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(x,y-96,24,9,0,0,TAU); ctx.fill(); ctx.fillStyle='#6a6290'; ctx.beginPath(); ctx.ellipse(x,y-96,21,7,0,0,TAU); ctx.fill(); ctx.restore(); }
function c1DrawMoonLamp(D){ const x=D.R.cx, y=D.R.cy, oc=C1OL(), t=G.time; ctx.save(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x,y+6,40,14,0,0,TAU); ctx.fill();
  ctx.fillStyle=oc; rrect(ctx,x-12,y-60,24,64,6); ctx.fill(); ctx.fillStyle='#3e3658'; rrect(ctx,x-10,y-58,20,60,5); ctx.fill();
  ctx.fillStyle=oc; ctx.beginPath(); ctx.moveTo(x-34,y-60); ctx.lineTo(x-20,y-100); ctx.lineTo(x+6,y-92); ctx.lineTo(x+30,y-104); ctx.lineTo(x+34,y-60); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#7a5ab0'; ctx.beginPath(); ctx.moveTo(x-30,y-62); ctx.lineTo(x-18,y-96); ctx.lineTo(x+6,y-88); ctx.lineTo(x+28,y-100); ctx.lineTo(x+30,y-62); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+0.2*Math.sin(t*2); ctx.drawImage(foGlowSpr('170,110,255'),x-60,y-140,120,120);
  for(let i=0;i<6;i++){ const an=t*0.5+i*TAU/6, mx=x+Math.cos(an)*70, my=y-80+Math.sin(an)*26; ctx.globalAlpha=0.7; ctx.fillStyle='#d8d0f0'; ctx.beginPath(); ctx.ellipse(mx-3,my,4,2.4,0.4,0,TAU); ctx.ellipse(mx+3,my,4,2.4,-0.4,0,TAU); ctx.fill(); }
  ctx.restore(); }

// ================= 13. the minibosses
// a miniboss started by the room trigger fights like a boss (the boss bar, its intro and outro); placed the stock way
// (a room's boss:[type,title]) its health is brought back to its own number (the cave would make it 4 times bigger)
function c1MiniInit(e,opt){
  if(opt&&opt.hpScale>=2){ const f=opt.hpScale*(e.elite?1.6:1); e.hp/=f; e.maxHp/=f; if(e.elite){ e.elite=false; e.r=EDEF[e.type].r; } }
  const Pd=C1.pending; if(Pd&&Pd.type===e.type){ c1BossInit(e); G.boss=e; e.c1mini=true; } e.leash=99999;
}
function c1MiniDone(e){
  if(!e.c1mini) return; const k=G.fightSite, d=k&&BOSSES[k]; if(!d||d.boss!==e.type) return;
  G.boss=null; G.fightSite=null; G.fightIntro=false; G.bossDone[e.type]=true; bossFightEnd(false);
  later(1.2,()=>{ const L=(STORY.bosses[e.type]&&STORY.bosses[e.type].outro)||[]; const fin=()=>{ scene='play'; try{ if(d.onWin) d.onWin(); }catch(err){ console.error(err); } saveGame(); };
    if(L.length) runDialogue(L,fin); else fin(); });
}
// ---------- The Barnacle Brute (c_brute): a crab knight armored in barnacles, Gullcrag room i
// Floor Slam (orange circle): a shock wave runs along the floor (climb a ledge, or jump it); then his claw sticks for
// 1.5 s (gold, x2). His barnacle shield blocks the front: the hammer shatters it, and a hit from a ledge above
// (a falling strike) goes over it. On a ledge he throws barnacles at you.
c1Lines('c_brute',null,null,[],[]);
defineFoe('c_brute',{mini:true,name:'The Barnacle Brute',title:S('Stuck-Up Knight of the Barnacle Bridge','The barnacle knight'),short:'Barnacle Brute',
  r:24,hp:520,speed:90,dmg:13,value:60,shield:true,kbRes:0.2,dcol:'214,120,88',
  ai:FK.brain({move:'approach',stop:62,guard:true,turn:2,cd:[0.9,1.6],recoverMove:0.2,
    pre(e,dt){ if(e.gbT>0){ e.gbT-=dt; e.shield=false; e.blocking=false; if(e.gbT<=0){ e.shield=true; c1Txt(e,S('The barnacles grow back!','Shield back!'),'#e8dcc8',12); } }
      if(e.stuckT>0){ e.stuckT-=dt; e.dx=e.dy=0; e.state='stuck'; e.st=0.2; e.blocking=false; if(e.stuckT<=0){ e.state='recover'; e.st=0.4; } return true; } },
    moves:[{k:'slash',reach:72,half:1.0,windup:0.55,lunge:150,dmg:1,col:C1COL.white,recover:0.7,w:2.5},
           {k:'c1slam',st:'slamW',off:0,r:84,windup:0.8,dmg:1.4,max:460,w:2.4,then:(e,m)=>{ c1Wave(e.x,e.y,{dmg:e.dmg,max:540,spd:310,thick:18}); e.stuckT=1.5; c1Txt(e,S('His claw is stuck!','Claw stuck!'),'#ffd27a',14); }},
           {k:'c1lob',st:'throw',windup:0.6,flight:0.8,r:46,col:C1COL.orange,ball:'#e4dcc8',br:6,h:110,min:90,every:3.5,w:2,if:()=>c1Lvl()>=1,land:(e,x,y)=>{ const p=player; emit(x,y,14,{col:'230,220,200',glow:false,smin:40,smax:150,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:4}); SFX.play('boom'); if(!p.dead&&!(airborne())&&dist(x,y,p.x,p.y)<46+p.r*0.5) hurtPlayer(e.dmg,x,y,200); }}]}),
  init(e,opt){ c1MiniInit(e,opt); },
  onHurt(e,amt,o){ const h=foeHit(e,o), front=Math.abs(angDiff(e.face,angTo(e.x,e.y,o.fx!=null?o.fx:player.x,o.fy!=null?o.fy:player.y)))<1.15, up=e.shield&&e.blocking&&front;
    if(h.src==='hammer'&&up){ e.gbT=byDiff(6,5,4); e.shield=false; e.blocking=false; c1Stun(e,0.8,S('CRACK! The barnacles shatter!','CRACK!')); emit(e.x,e.y-20,18,{col:'230,220,200',smin:60,smax:200,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); return amt*1.2; }
    if(h.src==='whip'&&e.shield){ e.gbT=8; e.shield=false; e.blocking=false; c1Txt(e,S('Yoink! No more shield!','Yoink!'),'#ffe0b0',14); return amt; }
    if(c1Lvl()>=1&&(h.melee||h.src==='slash')){ e.blocking=false; if(!(e._upT>G.time)){ e._upT=G.time+1; c1Txt(e,S('From above!','From above!'),'#ffd27a',14); } return amt*1.5; }
    if(e.stuckT>0) return amt*2; },
  onDeath(e){ c1Corpse(e); c1MiniDone(e); },
  draw3d:c1FigBrute, draw2d:c1Brute2,
  sheet:c1Rows({state:'windup',st:0.3,blocking:true,shield:true},{state:'strike',shield:true},[{state:'slamW',st:0.4,at:0.65,shield:true,label:'slam windup'},{state:'stuck',shield:true,label:'claw stuck'},{state:'chase',blocking:true,shield:true,label:'shield up'},{state:'chase',gbT:3,label:'shield broken'}])});
function c1FigBrute(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/24, face=t3Turn(e,e.face,7), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e), dead=foDeath(e), hurt=c1Hurt(e);
  const cr=fl?'#ffffff':foT(e,'#d8704a'), crD=foT(e,'#a8462e'), crL=foT(e,'#f4a07a'), barn='#ece4d0', barnD='#b8ae98', moss='#6a9a5a';
  const sp=Math.hypot(e.dx||0,e.dy||0), mv=clamp(sp/60,0,1), guard=e.blocking&&e.shield; e._wp=(e._wp||0)+dt*sp/(3.6*k);
  let raise=0, snap=0, lean=0, stuck=0;
  if(st==='windup'){ raise=0.6*c1Sm(clamp(1-e.st/0.55,0,1)); lean=-0.1; } else if(st==='strike'){ snap=1; lean=0.2; } else if(st==='slamW'){ raise=1.4*c1Sm(clamp(inS/0.7,0,1)); lean=-0.18; } else if(st==='stuck'){ stuck=1; lean=0.3; } else if(st==='throw'){ raise=0.9; }
  const P=foEase(e,'_fbr2',foTg(raise,snap,lean,stuck),dt,st==='strike'||st==='stuck'?24:10); raise=P[0]; snap=P[1]; lean=P[2]; stuck=P[3];
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,0,0,dead*1.4,0,0,0,-dead*3);
  foLow();
  for(const sd of [-1,1]) for(let i=0;i<3;i++){ const ph=e._wp+i*2.1+(sd>0?0:Math.PI), lx=6-i*7, o=Math.sin(ph)*3*mv, lift=Math.max(0,Math.cos(ph))*mv*2.4;
    foL(lx,sd*9,10,lx+o*0.4,sd*18,14+lift,2.4,crD,2); foL(lx+o*0.4,sd*18,14+lift,lx+o,sd*21,1+lift*0.5,2,cr,1); }
  foUp(); foSet(FOA,12,lean-hurt*0.15,0,0);
  foE(0,0,16,14,13,11,cr); foE(0,0,11,13,12,6,crD,0,0,0,-0.1);
  for(let i=0;i<9;i++){ const an=i*0.7, rr=7+((i*5)%5), bx=-3+Math.cos(an)*rr, by=Math.sin(an)*rr; foC(bx,by,24-rr*0.3,bx*1.04,by*1.04,27.6-rr*0.3,2.2,i%3?barn:barnD,0.03); }
  foE(-2,4,26,4,3,1.2,moss,0,0,0,0.04);
  for(const sd of [-1,1]){ const ex=10, ey=sd*4.6, ez=26; foL(8,sd*3,22,ex,ey,ez-2,1,crD,0.9); foB(ex,ey,ez,2.4,'#ffffff'); foD(ex+2,ey,ez+0.2,1.3,'#1e1420',0.04); foD(ex+2.3,ey-0.4,ez+1,0.4,'#ffffff',0.05); }
  // the shield claw (left): a big flat barnacle shield in front while guarding
  const shx=guard?16:12, shy=guard?-6:-16, shz=guard?18:12;
  const shR=e.gbT>0?'#7a6a58':'#5e6e78', shF=e.gbT>0?'#a89a86':'#c4d4d8';
  foL(6,-10,16,shx-3,shy,shz,3,crD,2.6); foE(shx,shy,shz,2.8,11.4,11.4,shR,0,guard?0:-0.8); foE(shx+1.2,shy,shz,1.8,9.4,9.4,shF,0,guard?0:-0.8,0,0.02);
  foD(shx+2.6,shy,shz,2.6,'#8aa0a8',0.04);
  for(let i=0;i<8;i++){ const an=i/8*TAU, cy=Math.cos(an)*6.4, cz=Math.sin(an)*6.4; if(e.gbT>0&&i%2) continue; foC(shx+2,shy+cy,shz+cz,shx+5.4,shy+cy*1.1,shz+cz*1.1,1.9,i%2?barn:barnD,0.03); }
  if(e.gbT>0) for(let i=0;i<3;i++) foN(shx+3,shy-4+i*4,shz+6,shx+3,shy-2+i*4,shz-6,0.7,'#3a2a1a',0.05);
  // the pincer (right): raised for the swipe, high for the slam, stuck in the floor
  const pcx=stuck?26:16+snap*8-raise*2, pcy=stuck?10:12, pcz=stuck?2:12+raise*20;
  foL(6,10,16,(pcx+6)/2,pcy+2,(pcz+16)/2+2,3,crD,2.6); foL((pcx+6)/2,pcy+2,(pcz+16)/2+2,pcx-4,pcy,pcz,2.8,cr,2.4);
  foE(pcx,pcy,pcz,7,5.6,5,stuck?'#ffcf5a':cr,-raise*0.5); foC(pcx+4,pcy-1.6,pcz+2+(1-snap)*2,pcx+13,pcy-1,pcz+3+(1-snap)*4,2.6,crL,0.02); foC(pcx+4,pcy+1,pcz-2,pcx+12,pcy+1.4,pcz-3,2,cr,0.01);
  if(stuck) foGlow(pcx,pcy,pcz+4,10,'255,210,90',0.45+0.2*Math.sin(t*7),false);
  foEnd(14); e._t3top=foTop(fy,30,k);
}
function c1Brute2(e,fl){ const x=e.x, y=e.y, r=e.r, f=e.face, cr=fl?'#fff':'#d8704a', guard=e.blocking&&e.shield; ctx.save(); c1Shadow2(e,1.2); ctx.translate(x,y); ctx.rotate(f);
  ctx.strokeStyle='#a8462e'; ctx.lineWidth=2.6; for(const s of [-1,1]) for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(4-i*7,s*8); ctx.lineTo(2-i*7,s*22); ctx.stroke(); }
  c1E2(0,0,r*0.62,r*0.6,cr,0,2); ctx.fillStyle='#ece4d0'; for(let i=0;i<6;i++){ const a=i*1.1; ctx.beginPath(); ctx.arc(Math.cos(a)*7-2,Math.sin(a)*7,2.4,0,TAU); ctx.fill(); }
  const px=e.state==='stuck'?r*1.1:r*0.75; ctx.lineCap='round'; ctx.strokeStyle=C1OL(); ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(r*0.3,r*0.3); ctx.lineTo(px-3,r*0.5); ctx.stroke(); ctx.strokeStyle='#a8462e'; ctx.lineWidth=3.6; ctx.stroke();
  c1E2(guard?r*0.75:r*0.5,guard?-5:-r*0.7,5,11,e.gbT>0?'#a89a86':'#c4d4d8',0,1.6); c1E2(px,r*0.5,6,5,e.state==='stuck'?'#ffcf5a':cr,0,1.6); for(const s of [-1,1]) c1Eye2(r*0.4,s*4,2.4,0); ctx.restore(); }

// ---------- Shadow Ash (c_shadowash): Ash's reflection climbs out of the mirror floor (the Spire, room j)
// It copies him: a sword combo (white arcs), rolls away from swings, hops over roars, a shadow breath (violet cone: no
// fire for 2 s), a shadow Wing-rang. It hates light: a lit (gold) brazier makes it flinch when it passes near, and fire
// breath on it staggers it for 1 s. At half health it splits in two; only the real one casts a shadow in a lit
// brazier's light.
c1Lines('c_shadowash','c_shadowash','c_shadowash_won',
  [['narr',S('The floor is a black mirror. Your reflection looks up at you. Then it puts its hands flat on the glass from the other side, and climbs out.','The floor is a black mirror. Your reflection climbs out of it!')],
   ['c_shadow',S('I am going to jump on EVERYTHING.','I will jump on EVERYTHING.')],
   ['ash',S('That is MY line!','That is MY line!')],
   ['c_shadow',S('That is MY line!','That is MY line!')]],
  [['narr',S('The shadow you flickers in the gold light, shrinks, and slides back into the floor. For a second the mirror shows just you again. You look tired. And brave.','The shadow you shrinks back into the floor. The mirror shows just you. Tired. Brave.')],
   ['ash',S('I am NOT that annoying.','I am NOT that annoying.')]]);
const C1SHT=[S('Gentle breaths. Gentle breaths...','Gentle breaths...'),S('Mip!','Mip!'),S('I can be a frog. I can be the best frog.','I can be the best frog.')];
FZK.c1rang={
  tick(z,dt){ const p=player, e=z.owner; if(!e||e.dead){ z.done=true; return; } z.spin=(z.spin||0)+dt*18;
    if(!z.back){ z.x+=Math.cos(z.a)*z.sp*dt; z.y+=Math.sin(z.a)*z.sp*dt; z.d+=z.sp*dt; if(z.d>=z.max||c1Solid(z.x,z.y)) { z.back=true; z.hit=false; } }
    else{ const a=angTo(z.x,z.y,e.x,e.y); z.x+=Math.cos(a)*z.sp*1.1*dt; z.y+=Math.sin(a)*z.sp*1.1*dt; if(dist(z.x,z.y,e.x,e.y)<20){ z.done=true; return; } }
    if(!z.hit&&!p.dead&&dist(z.x,z.y,p.x,p.y)<14+p.r&&!(typeof p2Shadowed==='function'&&p2Shadowed())){ z.hit=true; hurtPlayer(z.dmg,z.x,z.y,160); } },
  tall(z,list){ if(!z.it) z.it={flying:true,draw:()=>{ ctx.save(); ctx.translate(z.x,z.y-14); ctx.rotate(z.spin); ctx.fillStyle='#5a4880'; ctx.strokeStyle=C1OL(); ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-12,-3); ctx.quadraticCurveTo(0,-12,12,-3); ctx.quadraticCurveTo(0,-6,-12,-3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }}; z.it.x=z.x; z.it.y=z.y; list.push(z.it); }
};
FM.c1rang={ start(e,m){ e.state='throw'; e.st=fkW(m.o,0.45); e.tele=newTele({shape:'line',len:300,w:26,dur:e.st,col:C1COL.violet}); },
  tick(e,dt,d,a,m){ if(e.st>0.12) e.face=turnTo(e.face,a,6*dt); e.st-=dt; if(e.st>0) return false; e.tele=null; fzAdd('c1rang',{x:e.x,y:e.y,a:e.face,sp:420,d:0,max:300,dmg:fkDmg(e,m.o),owner:e,life:4}); SFX.play('throw'); return true; } };
FM_DEF.c1rang={recover:0.4};
function c1Lights(e){ const out=[]; if(!AREA) return out; for(const o of AREA.objs){ if((o.k==='brazier'||o.k==='c1brazier')&&o.lit) out.push(o); } return out; }
defineFoe('c_shadowash',{mini:true,name:'Shadow Ash',title:S('A Bad Copy','your shadow'),short:'Shadow Ash',
  r:14,hp:600,speed:210,dmg:12,value:70,kbRes:0.6,dcol:'120,90,170',
  ai:FK.brain({move:'strafe',slant:1,stop:56,turn:8,cd:[0.5,1.1],recoverMove:0.4,pre:shadowPre,
    moves:[{k:'c1combo',n:3,reach:54,half:1.0,windup:0.32,windup2:0.2,gap:0.12,lunge:150,dmg:1,col:C1COL.white,max:86,w:3},
           {k:'c1cone',st:'breathW',st2:'breath',windup:0.8,len:210,half:0.42,col:C1COL.violet,pcol:'150,100,220',dmg:0.9,max:240,w:2,hit:e=>{ C1.hushT=Math.max(C1.hushT,2); }},
           {k:'c1rang',min:120,max:420,windup:0.45,dmg:1,every:3,w:1.8}]}),
  init(e,opt){ c1MiniInit(e,opt); e.tauntT=6; },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(e.fake){ c1Puff(e.x,e.y-16,'120,90,170',22); e.dead=true; ftext(e.x,e.y-40,S('Just a reflection!','A fake!'),'#d8c0ff',13); SFX.play('pop'); return false; }
    if(e.rollT>0||e.hopT>0) return false;
    if(h.fire){ if(!(e.stagCd>G.time)){ e.stagCd=G.time+2; e.stagT=1; e.mv=null; e.tele=null; c1Txt(e,S('It hates the fire!','It hates fire!'),'#ffb070',14); } return amt*1.2; }
    if(e.stagT>0||e.flinchT>0) return amt*1.3; },
  onDeath(e){ if(!e.fake){ c1Corpse(e); for(const q of G.enemies) if(!q.dead&&q.fake&&q.type==='c_shadowash'){ q.dead=true; c1Puff(q.x,q.y-16,'120,90,170',16); } c1MiniDone(e); } },
  draw3d:c1FigShadowAsh, draw2d:c1Shadow2b,
  sheet:[{state:'chase',label:'idle'},{state:'chase',dx:120,label:'run'},{state:'windup',st:0.2,label:'combo windup'},{state:'strike',label:'slash'},{state:'breathW',st:0.4,label:'shadow breath'},{state:'roll',rollT:0.2,label:'roll'},{state:'stagger',stagT:0.5,label:'stagger'},{state:'chase',deathT:0.3,label:'death'}]});
function shadowPre(e,dt,d,a){
  const p=player, F=foeDiff();
  if(e.rollT>0){ e.rollT-=dt; const s=520; e.dx=Math.cos(e.rollA)*s; e.dy=Math.sin(e.rollA)*s; e.state='roll'; e.st=0.2; if(e.rollT<=0){ e.state='recover'; e.st=0.25; } return true; }
  if(e.hopT>0){ e.hopT-=dt; e.z=Math.sin(clamp(e.hopT/0.45,0,1)*Math.PI)*26; e.invuln=e.hopT>0; e.state='hop'; e.st=0.2; if(e.hopT<=0){ e.invuln=false; e.z=0; e.state='recover'; e.st=0.2; } return true; }
  if(e.stagT>0){ e.stagT-=dt; e.dx=e.dy=0; e.state='stagger'; e.st=0.2; if(e.stagT<=0){ e.state='recover'; e.st=0.3; } return true; }
  if(e.flinchT>0){ e.flinchT-=dt; e.dx=e.dy=0; e.state='flinch'; e.st=0.2; if(e.flinchT<=0){ e.state='recover'; e.st=0.3; } return true; }
  // light: a lit brazier close by makes it flinch (not every time: then it must come back near another)
  if(!(e.lightCd>G.time)){ for(const o of c1Lights(e)){ if(dist(o.x,o.y,e.x,e.y)<115){ e.lightCd=G.time+2.2; e.flinchT=0.8; e.mv=null; e.tele=null; c1Txt(e,S('The gold light! It flinches!','It flinches!'),'#ffe066',14); return true; } } }
  // it copies Ash: rolls away from a swing, hops over a roar
  if(p.swingT>0&&d<104&&!(e.rollCd>G.time)&&!e.mv&&Math.random()<(e.fake?0.2:byDiff(0.25,0.4,0.55))){ e.rollCd=G.time+1.4; e.rollT=0.3; e.rollA=a+Math.PI+(Math.random()<0.5?-1.2:1.2); SFX.play('roll'); return true; }
  for(const R of G.rings){ if(R.owner==='player'&&Math.abs(dist(R.x,R.y,e.x,e.y)-R.rad)<70&&!(e.hopCd>G.time)){ e.hopCd=G.time+1; e.hopT=0.45; e.mv=null; e.tele=null; return true; } }
  // at half health it splits in two (the fake pops in one hit)
  if(!e.fake&&!e.split&&e.hp<e.maxHp*0.5){ e.split=true; const L=fkLevel(e,{}), s=spotNear(e.x,e.y,90,160); const f=makeEnemy('c_shadowash',s.x,s.y,{level:L,aggro:true,elite:false,homeX:s.x,homeY:s.y,leash:99999}); f.fake=true; f.dmg*=0.4; f.spawnIn=0.2; f.inArea=e.inArea; f.room=e.room; f.arena=e.arena; f.maxHp=f.hp=1; c1Puff(e.x,e.y-16,'120,90,170',22); c1Txt(e,S('It splits in two!','Two of them!'),'#d8c0ff',15); c1Say(e,'c_shadow',S('Now there are two of me. Twice as brave!','Two of me!'),5); }
  e.tauntT-=dt; if(e.tauntT<=0&&!e.fake){ e.tauntT=rand(9,14); taunt('c_shadow',pick(C1SHT)); }
  return false;
}
// its look: Ash's own toy figure, in violet and black
const C1SHP={skin:'#5a4884',dark:'#30244e',head:'#6a5694',lite:'#9a80d0',snout:'#7a64a8',chest:'#8a74b8',horn:'#d0c4f4',horn2:'#b0a2dc',horn3:'#9284c0',eye:'#f0dcff',pupil:'#1e1030',brow:'#3e3060',
  cloak:'#40305e',cloakIn:'#2c2046',cloakE:'#1e1632',vest:'#56467c',vestD:'#3a2e5a',belt:'#2e2448',gold:'#b8a0f0',steel:'#a898d4',boot:'#30264c',claw:'#d0c4f4',mem:'#7050a8',memIn:'#52387e',memE:'#2a1c44',bone:'#2a1c44'};
const C1ASH0={};
function c1FigShadowAsh(e,fl){
  if(typeof ashDraw!=='function'||typeof ASHP==='undefined'){ c1Shadow2b(e,fl); return; }
  const q=e._q||(e._q={}), p=player; Object.assign(q,p);
  const st=e.state, mv=Math.hypot(e.dx||0,e.dy||0)>8;
  q.ghosts=C1.noGhosts||(C1.noGhosts=[]); q._a=e._qa||(e._qa={mv:0,spr:0,bank:0,roarT:0,lt:null,pf:null}); q._vf=e._qvf; q.t=e.t||0; q.x=e.x; q.y=e.y;
  q.facing=e.face; q.faceGoal=e.face; q.swingDir=e.face; q.swingT=st==='strike'?0.12:0; q.swingDur=0.27; q.swingSide=(e.comboI||0)%2?-1:1; q.swingFin=(e.comboI||0)===2; q.swingW=null; q.swingSpin=false;
  q.dashT=st==='roll'?Math.max(0.02,e.rollT||0.1):0; q.dashDir=e.rollA||e.face; q.moving=mv; q.sprinting=false; q.walkT=(e._wk=(e._wk||0)+(mv?0.016:0)); q.breathing=st==='breath'; q.z=e.z||0; q.vz=0; q.flying=false; q.gliding=false; q.slam=false;
  q.hurtFlash=fl?0.1:0; q.iframes=0; q.drinkT=0; q.bow=null; q.ham=null; q.throwT=st==='throw'?0.2:0; q.sqT=0; q.wingO=0; q.wEquipT=0; q.hop=null; q.dead=false; q.roar=0;
  for(const k in C1SHP){ C1ASH0[k]=ASHP[k]; ASHP[k]=C1SHP[k]; }
  const g=ctx, pa=g.globalAlpha;
  try{ if(st==='stagger'||st==='flinch') g.globalAlpha=pa*(0.6+0.4*Math.sin((e.t||0)*30));
    ashDraw(g,q,e.x,e.y+6,{z:q.z,flash:fl,alpha:1}); }
  finally{ for(const k in C1SHP) ASHP[k]=C1ASH0[k]; g.globalAlpha=pa; e._qvf=q._vf; }
  e._t3top=q._t3top!=null?q._t3top:e.y-40;
  // the real one casts a long shadow in a lit brazier's light (the fake has none)
  if(!e.fake){ for(const o of c1Lights(e)){ const dd=dist(o.x,o.y,e.x,e.y); if(dd<260){ const a=angTo(o.x,o.y,e.x,e.y); g.save(); g.fillStyle='rgba(20,10,40,.5)'; g.translate(e.x,e.y+6); g.rotate(a); g.beginPath(); g.ellipse(26,0,30,8,0,0,TAU); g.fill(); g.restore(); break; } } }
}
function c1Shadow2b(e,fl){ const x=e.x, y=e.y-(e.z||0), r=e.r, f=e.face; ctx.save(); c1Shadow2(e,1); ctx.translate(x,y); ctx.rotate(f);
  ctx.fillStyle='#40305e'; ctx.beginPath(); ctx.moveTo(-r*0.6,0); ctx.lineTo(-r*1.6,Math.sin((e.t||0)*6)*4); ctx.lineTo(-r*0.6,3); ctx.fill();
  c1E2(0,0,r*0.7,r*0.6,fl?'#fff':'#5a4884'); c1E2(r*0.5,0,r*0.45,r*0.42,'#6a5694',0,1.4); ctx.fillStyle='#d0c4f4'; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(r*0.3,s*4); ctx.lineTo(-r*0.4,s*9); ctx.lineTo(r*0.1,s*2); ctx.fill(); } ctx.fillStyle='#f0dcff'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(r*0.75,s*2.6,1.6,0,TAU); ctx.fill(); } ctx.restore(); }
// the Mirror of Night (room decor): four violet braziers; fire turns one gold for 20 s
C1ROOM.c_shadowash={
  build(R,A){ const D={R,type:'c_shadowash',br:[]}; const own=A.objs.filter(o=>o.k==='brazier'&&o.room===R.id); if(own.length) return D;
    const hw=(R.x1-R.x0)/2, hh=(R.y1-R.y0)/2; for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const o={k:'c1brazier',x:R.cx+sx*hw*0.68,y:R.cy+sy*hh*0.62,id:`c1_${R.id}_br${D.br.length}`,room:R.id,lit:false,litT:0,r:16};
      A.objs.push(o); D.br.push(o); addAreaCol({t:'c',x:o.x,y:o.y,r:13}); A.lights.push(o.L={x:o.x,y:o.y-20,r:150,i:0.2,tint:'ember'}); } return D; },
  tick(D,dt){ for(const o of D.br){ if(o.litT>0){ o.litT-=dt; if(o.litT<=0){ o.lit=false; ftext(o.x,o.y-50,S('The brazier goes cold.','It goes cold.'),'#c8b8e8',11); } }
      else if(typeof inBreath==='function'&&inBreath(o.x,o.y-14,18)){ o.heat=(o.heat||0)+dt; if(o.heat>0.25){ o.heat=0; o.lit=true; o.litT=20; SFX.play('shrine'); ftext(o.x,o.y-50,S('Gold light!','Gold light!'),'#ffe066',13); } }
      if(o.L) o.L.i=o.lit?0.75:0.2; if(o.lit) p2Shine(o.x,o.y,150); } },
  tall(D,list){ for(const o of D.br){ if(!o.it) o.it={x:o.x,y:o.y+4,draw:()=>c1DrawBrazier(o)}; list.push(o.it); } }
};
function c1DrawBrazier(o){ const x=o.x, y=o.y, oc=C1OL(), t=G.time, gold=o.lit; ctx.save(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x,y+4,18,7,0,0,TAU); ctx.fill();
  ctx.fillStyle=oc; ctx.fillRect(x-5,y-30,10,34); ctx.fillStyle='#4a4266'; ctx.fillRect(x-3,y-29,6,32); ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(x,y-32,17,8,0,0,TAU); ctx.fill(); ctx.fillStyle='#6a6290'; ctx.beginPath(); ctx.ellipse(x,y-33,14,6,0,0,TAU); ctx.fill();
  ctx.globalCompositeOperation='lighter'; const c=gold?'255,200,90':'170,110,255'; ctx.globalAlpha=0.75; ctx.drawImage(foGlowSpr(c),x-34,y-74,68,68); ctx.globalAlpha=1;
  const fl=(w,h,col)=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x-w,y-34); ctx.quadraticCurveTo(x-w*1.1,y-34-h*0.5,x+Math.sin(t*7+x)*w*0.4,y-34-h); ctx.quadraticCurveTo(x+w*1.1,y-34-h*0.5,x+w,y-34); ctx.closePath(); ctx.fill(); };
  fl(10,30+Math.sin(t*9)*3,gold?'rgba(255,150,40,.8)':'rgba(140,80,230,.8)'); fl(6,20,gold?'rgba(255,230,140,.9)':'rgba(200,170,255,.9)'); ctx.restore(); }
FL.c1brazier=()=>{}; FL.c1mirror=()=>{};

// ================= 14. where the bosses live: sites, the dungeon room trigger, c1BossStart
// Dungeon bosses: give the boss room `c1boss:'<type>'` (kind 'boss', or 'miniboss' for c_brute and c_shadowash; no
// `boss:` field). Room templates that fit each fight are in C1_TPL (C1FOES.md shows them). The room decor (the wreck,
// the gear floor, the mirrors, the roof...) is built whenever the room is loaded.
const C1DUN={
  c_pinch:{k:'c_lagoon',name:S('The Drowned Lagoon','The Drowned Lagoon'),level:11,dy:-150},
  c_ticktock:{k:'c_drivepit',name:S('The Drive Pit','The Drive Pit'),level:11,dy:-150},
  c_gloomwing:{k:'c_lamproom',name:S('The Lamp Room','The Lamp Room'),level:12,dy:-230},
  c_mothmask:{k:'c_roof',name:S('The Roof of the Shadow Spire','The Spire roof'),level:13,dy:-170},
  c_brute:{k:'c_bridge',name:S('The Barnacle Bridge','The Barnacle Bridge'),level:12,dy:-90,mini:true},
  c_shadowash:{k:'c_mirror',name:S('The Mirror of Night','The Mirror of Night'),level:14,dy:-80,mini:true}};
function c1Won(type){ G.flags[type+'_won']=true; C1.won[type]=true; try{ if(C1.hook.won) C1.hook.won(type); }catch(err){ console.error(err); } questPoke(); }
for(const t in C1DUN){ const d=C1DUN[t]; c1Site(t,d.k,{boss:t,at:{x:IZX+200,y:IZY+200,r:600,name:d.name,level:d.level},stage:null,open:()=>false,bless:!d.mini,
  spawn:P=>({x:P.x,y:P.y+(d.dy||-120)}),onWin(){ c1Won(t); }}); }
// Captain Saltbeard: outdoors, on the wreck of the Saucy Gull. The site opens at night while Ash carries the Ghost Pepper
// Chowder (c_chowder), or whenever G.flags.c_saltbeard_call is set (the quest helper sets it when the bowl goes on the deck).
// When the quest module (x1_people, loaded first) already defined this site, its quest decides when the ghost rises
// (the chowder set on the deck at night at low tide) and its onWin gives the chain and the sock: both are kept.
{ const Q=BOSSES.c_saucygull&&BOSSES.c_saucygull.boss==='c_saltbeard'?BOSSES.c_saucygull:null;
c1Site('c_saltbeard','c_saucygull',{boss:'c_saltbeard',at:{x:4600,y:28300,r:430,name:S('The Wreck of the Saucy Gull','The old wreck'),level:10},stage:null,
  open:()=>!G.flags.c_saltbeard_won&&(!!G.flags.c_saltbeard_call||(Q&&Q.open?!!Q.open():(isNight()&&!!(G.items&&G.items.c_chowder)))),
  arena:{shape:'ring',r:330,style:'c_reef',props:[{k:'c1deck',dx:0,dy:-10}]},flyOK:false,spawn:P=>({x:P.x,y:P.y-70}),
  onWin(){ G.flags.c_saltbeard_won=true; G.flags.c_saltbeard_call=false; if(!Q&&G.items&&G.items.c_chowder){ G.items.c_chowder--; if(G.items.c_chowder<=0) delete G.items.c_chowder; } if(Q&&Q.onWin) try{ Q.onWin(); }catch(err){ console.error(err); } c1Won('c_saltbeard'); }}); }
// start a boss fight now: in a dungeon room (R = AREA.rooms[id]) or at its outdoor site. o: {intro:false, level}
function c1BossStart(type,R,o){
  o=o||{}; const k=C1SITE[type]; if(!k||G.mode!=='story'||G.fightSite) return null; const s=SITES[k], P=POI[s.poi], d=C1DUN[type];
  if(R){ P.x=R.cx; P.y=R.cy; P.r=Math.max(R.x1-R.x0,R.y1-R.y0)*0.6; if(AREA){ s.area=AREA.id; P.level=d&&d.mini?(AREA.level||P.level)+1:P.level; } C1.pending={R,type,area:AREA&&AREA.id}; }
  G.fightSite=k; G.fightIntro=true;
  const go=()=>{ scene='play'; G.fightIntro=false; if(G.fightSite!==k) return; const h0=G.hazards.length; startBossFight(k);
    const h=G.hazards.slice(h0).find(q=>q.kind==='spawn'&&q.type===type); if(h&&(o.level||(d&&d.mini))) h.opt.level=o.level||P.level;
    if(d&&d.mini){ const D=EDEF[type]; setBanner(D.name,(W<560&&D.short)?D.short:D.title,2.8,'boss'); } };
  const L=o.intro===false||C1.noIntro?[]:((STORY.bosses[type]&&STORY.bosses[type].intro)||[]);
  if(L.length) runDialogue(L,go); else go();
  return k;
}
// leaving the dungeon (or falling) in the middle of a dungeon fight resets it, like walking away from an outdoor one
{ const base=exitArea; exitArea=function(silent){ if(G&&G.fightSite&&C1SITEK[G.fightSite]&&SITES[G.fightSite].area){ resetBoss(); C1.pending=null; } return base(silent); }; }
// clones hit for 40 percent (their moves use literal hits)
{ const base=fkDmg; fkDmg=function(e,o){ const v=base(e,o); return e&&(e.clone||e.fake)?v*0.4:v; }; }
// shadows a Shadow Dash can ride (and so strike through): the Gloomwing's shadow, Vesper's open pools
if(typeof p2ShadeAt==='function'){ const base=p2ShadeAt; p2ShadeAt=function(x,y){ if(base(x,y)) return true; const e=G&&G.boss; if(!e||e.dead) return false;
    if(e.type==='c_gloomwing'&&(e.sunk||(e.bph===2&&e.mode==='hide'))&&dist(x,y,e.x,e.y)<64) return !p2LitAt(x,y);
    if(e.type==='c_mothmask'&&e.bph===2){ const D=c1RoomOf(e); if(D) for(const q of D.pools) if(!(q.closedT>0)&&!q.beamed&&dist(x,y,q.x,q.y)<q.r) return true; }
    return false; }; }
// Ticktock hanging from the shaft: from a ceiling ring near him, USE yanks his key
{ const base=updateInteractions; updateInteractions=function(dt){ base(dt);
    const e=G&&G.boss; if(!e||e.dead||e.type!=='c_ticktock'||!e.hang||typeof P2==='undefined'||!P2.mv||P2.mv.kind!=='hang') return; const p=player;
    if(dist(p.x,p.y,e.x,e.y)>390) return;
    G.prompt={text:S('Yank the key!','Pull the key!'),act:()=>tickYankDown(e),x:e.x-Math.cos(e.face)*e.r*0.75,y:e.y-(e.z||0)-70,always:true,kind:'pull'}; e.keyGlow=0.5;
    c1Tip('tickyank',S('Yank the key!','Pull the key!'),S(`Hanging from a ring near Ticktock, press ${(typeof p2Ctl==='function'?p2Ctl().use:'E')} to yank his key.`,`Press ${(typeof p2Ctl==='function'?p2Ctl().use:'E')} to pull his key!`)); }; }
// the room decor: built when an area loads, ticking every frame, drawn under (ground) and among (tall) the figures
function c1BuildRooms(A){
  for(const id in A.rooms){ const R=A.rooms[id], t=R.c1boss; if(!t||!C1SITE[t]) continue;
    if(G.bossDone[t]&&!R.solved){ try{ solveRoom(R,true); }catch(err){} }
    const K=C1ROOM[t]; let D={type:t,R}; if(K){ try{ D=K.build(R,A)||D; }catch(err){ console.error(err); } } D.type=t; D.R=R; C1.rooms.push(D); }
}
function c1Frame(dt){
  if(C1.corpses.length){ for(const c of C1.corpses) c.deathT+=dt; if(C1.corpses[0].deathT>0.7) C1.corpses=C1.corpses.filter(c=>c.deathT<0.7); }
  if(C1.area!==AREA){ C1.area=AREA; C1.rooms=[]; if(AREA&&AREA.rooms) c1BuildRooms(AREA); }
  if(C1.bot) try{ C1.bot(dt); }catch(err){ console.error(err); }
  for(const D of C1.rooms){ const K=C1ROOM[D.type]; if(K&&K.tick) K.tick(D,dt); }
  // a room boss (and its clones) never leaves its room, even a flyer in a long dive
  for(const q of G.enemies) if(!q.dead&&q.arena&&q.c1room) c1Hold(c1Ctx(q),q,Math.min(40,(q.r0||q.r)+10));
  if(AREA&&C1.rooms.length&&scene==='play'&&!G.fightSite&&!player.dead&&G.mode==='story'){ const R=caveRoomAt(player.x,player.y);
    if(R) for(const D of C1.rooms) if(D.R===R&&caveInterior(R,player.x,player.y)&&!G.bossDone[D.type]&&!R.solved){ c1BossStart(D.type,R); break; } }
}
function c1Tall(list){
  if(AREA) for(const D of C1.rooms){ const K=C1ROOM[D.type]; if(K&&K.tall&&inView(D.R.cx,D.R.cy,Math.max(D.R.x1-D.R.x0,D.R.y1-D.R.y0))) K.tall(D,list); }
  const e=G.boss; if(e&&!e.dead&&e.type==='c_pinch'&&e.shell){ if(!C1.shIt) C1.shIt={x:0,y:0,draw:()=>{ const b=G.boss; if(b&&b.shell) c1DrawEmptyShell(b); }}; C1.shIt.x=e.shell.x; C1.shIt.y=e.shell.y+10; list.push(C1.shIt); }
}
{ const base=drawPools; drawPools=function(){ if(AREA) for(const D of C1.rooms){ const K=C1ROOM[D.type]; if(K&&K.ground) try{ K.ground(D,G.time); }catch(err){ console.error(err); } } base(); }; }
{ const base=newRun; newRun=function(mode){ base(mode); C1.area=null; C1.rooms=[]; C1.corpses=[]; C1.pending=null; C1.hushT=0; C1.blindT=0; C1.mothFree=false; }; }

// ---------- room templates that fit each fight (rows of cells: `.` floor, `{` a climbable ledge, `~` still water, `#` wall)
function c1Tpl(w,h,fn){ const rows=[]; for(let j=0;j<h;j++){ let s=''; for(let i=0;i<w;i++) s+=fn(i,j)||'.'; rows.push(s); } return rows; }
const c1Round=(w,h,n)=>(i,j)=>Math.min(i,w-1-i)+Math.min(j,h-1-j)<n?'#':'.';
const C1_TPL={
  // the Drowned Lagoon (2x2): ledges on the west, east and south walls, climbable; the wreck fills the north wall
  lagoon:c1Tpl(31,23,(i,j)=>{ if(i<=3&&j>=8&&j<=13) return '{'; if(i>=27&&j>=8&&j<=13) return '{'; if(j>=19&&i>=11&&i<=19) return '{'; return '.'; }),
  // the Drive Pit, the Lamp Room and the Spire roof (2x2): open floors with rounded corners
  pit:c1Tpl(31,23,c1Round(31,23,4)), lamp:c1Tpl(31,23,c1Round(31,23,4)), roof:c1Tpl(31,23,c1Round(31,23,3)),
  // the Barnacle Bridge (1x1): a ledge on each side (climbable), two tide pools off to the sides
  bridge:c1Tpl(15,11,(i,j)=>{ if(i<=2&&j>=2&&j<=8) return '{'; if(i>=12&&j>=7) return '{'; if((i>=4&&i<=5&&j>=7&&j<=8)||(i>=10&&i<=11&&j>=1&&j<=2)) return '~'; return '.'; }),
  // the Mirror of Night (1x1): a round room
  mirror:c1Tpl(15,11,c1Round(15,11,2))};
// the Boss Hall: a test dungeon with one room of each (no door leads here; __eb.c1Test goes in)
const C1LAB_ROOM={c_pinch:'P',c_ticktock:'T',c_gloomwing:'L',c_mothmask:'V',c_brute:'i',c_shadowash:'j'};
defineDungeon('c1_lab',{name:S('The Boss Hall','The Boss Hall'),level:11,theme:'earth',seed:311,save:'c1_lab',noJuniper:true,giftOK:{},dark:0.2,dunKind:S('A test hall','A test hall'),
  floors:[{id:'1',name:S('The Hall','The Hall'),map:{rooms:{
    a:{at:[2,4],kind:'start',noPots:true,sign:S('The Boss Hall. Every boss of the coast, one room each.','The Boss Hall.')},
    i:{at:[2,3],kind:'miniboss',c1boss:'c_brute',tpl:C1_TPL.bridge,noPots:true,noDecor:true},
    j:{at:[3,3],kind:'miniboss',c1boss:'c_shadowash',tpl:C1_TPL.mirror,noPots:true,noDecor:true},
    c:{at:[2,2],kind:'free',noPots:true},
    P:{at:[0,0],span:[2,2],kind:'boss',c1boss:'c_pinch',tpl:C1_TPL.lagoon,noPots:true,noDecor:true},
    T:{at:[2,0],span:[2,2],kind:'boss',c1boss:'c_ticktock',tpl:C1_TPL.pit,noPots:true,noDecor:true},
    L:{at:[4,0],span:[2,2],kind:'boss',c1boss:'c_gloomwing',tpl:C1_TPL.lamp,noPots:true,noDecor:true},
    V:{at:[0,2],span:[2,2],kind:'boss',c1boss:'c_mothmask',tpl:C1_TPL.roof,noPots:true,noDecor:true}},
    links:[['a','i','open'],['i','j','open'],['i','c','open'],['c','T','open'],['c','V','open'],['T','P','open'],['T','L','open']]}}]});

// ================= 15. debug hooks (window.__eb.c1 and __eb.c1Test) and a scripted fighter for the tests
// __eb.c1Test(type,{diff:0|1|2, intro:false, room:true}) puts Ash in the boss's room of the Boss Hall (Saltbeard: the
// wreck, at night, with the chowder) and starts the fight. __eb.c1.bot(type,{mech:true}) plays it: it stands where the
// mechanic needs, triggers it through the game's own code (the key's then(), a mirror's onHit, the lamp's breath test,
// the boss's onShadow) and swings at whatever part the mechanic opened. __eb.c1.run(sec) runs the game that long.
function c1Test(type,o){
  o=o||{}; if(window.__eb&&window.__eb.bal&&o.diff!=null) window.__eb.bal.setDiff(o.diff);
  G.abil=G.abil||{}; for(const id of ['jump','stride','wings','dbljump','skimmer','claws','grapple','shadow']) G.abil[id]=true; G.flags.forge=true;
  if(typeof P2!=='undefined'){ P2.tips.climb=9; P2.tips.hang=9; P2.tips.pull=9; P2.tips.chain=9; P2.tips.ring=9; }
  if(G.fightSite) resetBoss(); G.bossDone[type]=false; C1.noIntro=o.intro===false; C1.dmg=0; C1.hits=0; C1.bySrc={};
  for(const k in G.flags) if(k.startsWith('c1tip_')) delete G.flags[k];
  // intro:false also skips x1_story's own first-sight intro for the type (it marks its scenes in G.flags.c_sn)
  if(o.intro===false){ const SK={c_pinch:'c_pinch_intro',c_ticktock:'c_ticktock_intro',c_gloomwing:'c_gloomwing_intro',c_mothmask:'c_roof_intro',c_shadowash:'c_shadowash',c_saltbeard:'c_saltbeard_intro'}; if(SK[type]) (G.flags.c_sn=G.flags.c_sn||{})[SK[type]]=1; }
  if(type==='c_saltbeard'){ if(AREA) exitArea(true); G.items.c_chowder=1; G.flags.c_saltbeard_won=false; if(window.__eb.setTime) window.__eb.setTime(0.02); const r=window.__eb.bossTest('c_saucygull',{intro:o.intro!==false?undefined:false}); return r; }
  const room=C1LAB_ROOM[type]; if(!room) return null;
  for(const k in G.found) if(k.startsWith('cv_c1_lab_')&&k.endsWith('_solved')) delete G.found[k];
  if(AREA&&AREA.id==='c1_lab'){ exitArea(true); }
  const id=dunGo('c1_lab',room); const R=AREA&&AREA.rooms[room];
  if(R){ R.solved=false; R.enemies=R.enemies||[]; player.x=R.cx; player.y=R.cy+Math.min(220,(R.y1-R.y0)*0.3); updateCam(0,true); }
  return {area:id,room,x:R&&R.cx,y:R&&R.cy};
}
const C1B={on:false,type:null,mech:true,t:0,hitT:0,heals:0,pullT:0,yankT:0,mirT:0,fireT:0,hamT:0,log:[],ev:{},zt:0};
function c1BotEv(k){ C1B.ev[k]=(C1B.ev[k]||0)+1; }
function c1BotSwing(e,mul){
  const p=player; if(!e||e.dead||e.invuln||e.spawnIn>0) return false; let best=null;
  for(const c of hitCircles(e)) if(dist(p.x,p.y,c.x,c.y)-c.r<78&&(!best||c.m>best.m)) best=c;
  if(!best) return false; p.facing=angTo(p.x,p.y,best.x,best.y); p.swingDir=p.facing;
  // (it looks like a swing to the foes, so Shadow Ash can roll away; the real swing code hits nothing)
  if(!(p.swingT>0)){ p.swingW='sword'; p.swingFin=false; p.swingSpin=false; p.swingDur=0.2; p.swingT=0.2; p.swingHit=new Set(G.enemies.map(q=>q.id)); p.swingHitstop=true; p.swingObj=true; }
  const before=e.hp; wStrike(e,best,mul||1,'sword',{kb:60,ka:p.facing}); C1B.dealt=(C1B.dealt||0)+Math.max(0,before-e.hp); return true;
}
// the bot walks (at about Ash's running speed) toward where it wants to be; it never teleports, so the timings are fair
function c1BotGo(x,y){ C1B.tx=x; C1B.ty=y; }
function c1BotMove(dt){
  const p=player; if(C1B.tx==null) return; const d=dist(p.x,p.y,C1B.tx,C1B.ty), sp=((p.stats&&p.stats.speed)||200)*1.25*dt;
  if(d<1) return; const u=Math.min(1,sp/d), x=p.x+(C1B.tx-p.x)*u, y=p.y+(C1B.ty-p.y)*u;
  if(playerBlocked(x,y)&&!AREA) return;
  // up onto a ledge only by climbing (the Climbing Claws: the bot with the mechanics on); stepping down is fine
  if(AREA&&AREA.tri){ const k0=tCell(p.x,p.y), k1=tCell(x,y); if(k0>=0&&k1>=0&&k0!==k1&&Math.max(0,dunH(k1))>Math.max(0,dunH(k0))&&!(C1B.mech&&hasAbil('claws'))) return; } p.x=x; p.y=y; p.kvx=p.kvy=0; p.facing=angTo(p.x,p.y,C1B.tx,C1B.ty); if(AREA&&AREA.tri){ AREA.tri.lx=x; AREA.tri.ly=y; }
}
function c1BotNear(e,r,a){ const p=player; a=a!=null?a:angTo(e.x,e.y,p.x,p.y); const C=c1Ctx(e), q={x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r}; if(C.rect||C.A) c1Hold(C,q,40); c1BotGo(q.x,q.y); }
function c1BotLedge(){ const D=C1.rooms.find(q=>q.ledges&&q.ledges.length); if(!D) return false; const p=player; let best=null, bd=1e9; for(const L of D.ledges) for(const k of L.cells){ const q=tPos(k); const d=dist(p.x,p.y,q.x,q.y); if(d<bd){ bd=d; best=q; } } if(best){ c1BotGo(best.x,best.y); return true; } return false; }
// where the danger is: the bot steps out of marked circles, lines and the boss's own wind-up shapes, like a careful
// player would (it reads the same telegraphs Ash sees). Returns a point to run to, or null.
function c1BotDanger(e){
  const p=player, out=(cx,cy,r)=>{ const a=angTo(cx,cy,p.x,p.y)+(Math.random()<0.5?0.3:-0.3); return {x:cx+Math.cos(a)*(r+46),y:cy+Math.sin(a)*(r+46)}; };
  const side=(x0,y0,ang,w)=>{ const nx=-Math.sin(ang), ny=Math.cos(ang), s=((p.x-x0)*nx+(p.y-y0)*ny)>=0?1:-1; return {x:p.x+nx*s*(w/2+50),y:p.y+ny*s*(w/2+50)}; };
  const inLine=(x0,y0,ang,len,w)=>{ const dx=p.x-x0, dy=p.y-y0, u=dx*Math.cos(ang)+dy*Math.sin(ang), v=-dx*Math.sin(ang)+dy*Math.cos(ang); return u>-p.r&&u<len+p.r&&Math.abs(v)<w/2+p.r; };
  for(const z of G.fz||[]){
    if(z.k==='c1mark'||z.k==='c1lob'){ if(z.shape==='line'){ if(inLine(z.x,z.y,z.ang||0,z.len,z.w||30)) return side(z.x,z.y,z.ang||0,z.w||30); continue; }
      if(z.shape==='cone'){ if(dist(z.x,z.y,p.x,p.y)<z.len+p.r&&Math.abs(angDiff(z.ang||0,angTo(z.x,z.y,p.x,p.y)))<z.half+0.15) return side(z.x,z.y,z.ang||0,Math.sin(z.half)*z.len*2); continue; }
      if(z.shape==='donut') continue;
      if(z.r&&dist(z.x,z.y,p.x,p.y)<z.r+p.r) return out(z.x,z.y,z.r); }
  }
  for(const q of G.enemies){ if(q.dead||!q.tele) continue; const T=q.tele;
    if(T.shape==='arc'||T.shape==='cone'){ const r=T.r||T.len||60, half=T.half||1; if(dist(q.x,q.y,p.x,p.y)<r+p.r&&Math.abs(angDiff(q.face,angTo(q.x,q.y,p.x,p.y)))<half+0.2) return out(q.x,q.y,r); }
    else if(T.shape==='line'){ if(inLine(q.x,q.y,q.face,T.len||300,T.w||30)) return side(q.x,q.y,q.face,T.w||30); }
    else if(T.shape==='circle'||T.shape==='ring'){ const r=T.r||60; if(dist(q.x,q.y,p.x,p.y)<r+p.r) return out(q.x,q.y,r); } }
  return null;
}
function c1BotAt(x,y,r){ return dist(player.x,player.y,x,y)<(r||40); }
function c1BotFrame(dt){
  const p=player, e=G.boss; C1B.t+=dt; if(!C1B.on) return; if(p.dead) return;
  if(C1B.heal!==false&&p.hp<p.maxHp*0.4){ p.hp=p.maxHp; C1B.heals++; }
  // jump over shock waves, rings and low sweeps like a careful player would
  { let jump=false; for(const z of G.fz||[]){ if(z.k==='c1wave'&&z.rad&&Math.abs(dist(z.x,z.y,p.x,p.y)-z.rad)<60) jump=true; } for(const R of G.rings) if(R.owner!=='player'&&Math.abs(dist(R.x,R.y,p.x,p.y)-R.rad)<60) jump=true; if(e&&(e.state==='sweepW'&&e.st<0.12)) jump=true; if(jump&&!(p.z>3)){ p.z=8; p.vz=180; } }
  if(!e||e.dead||G.fightIntro){ C1B.tx=null; return; }
  C1B.hitT-=dt; const swing=k=>{ if(C1B.hitT<=0){ if(c1BotSwing(e,k)) C1B.hitT=0.5; } };
  p.breathing=false;
  const busy=c1BotPlan(e,dt,swing);
  // small foes (moths, cocoons, clones) close by get swatted when the boss is out of reach
  if(C1B.hitT<=0){ let q=null, bd=1e9; for(const f of G.enemies){ if(f===e||f.dead||f.boss||f.passive||f.spawnIn>0) continue; const dd=dist(player.x,player.y,f.x,f.y)-f.r; if(dd<56&&dd<bd){ bd=dd; q=f; } } if(q&&c1BotSwing(q,1)){ C1B.hitT=0.5; c1BotEv('swat'); } }
  if(!busy){ const q=c1BotDanger(e); if(q){ c1BotGo(q.x,q.y); C1B.dodges=(C1B.dodges||0)+1; } }
  c1BotMove(dt);
}
// one boss's plan for this frame: set a spot to walk to (c1BotGo / c1BotNear), swing, and work the mechanic through
// the game's own code once Ash is close enough to really do it. Returns true while doing something that must not be
// interrupted by a dodge (hanging on a ring, standing on a ledge in the surge).
function c1BotPlan(e,dt,swing){
  const p=player, T=e.type, M=C1B.mech;
  if(T==='c_pinch'){
    if(M&&e.surge){ const up=c1Lvl()>=1; if(!up){ c1BotLedge(); c1BotEv('toLedge'); } else { C1B.tx=null; if(e.surge.ph==='on'&&swing) { const b=C1B.hitT; swing(1); if(C1B.hitT>b) c1BotEv('deck'); } } return up; }
    if(e.stuck){ const c=pinchClaw(e,e.stuck.side); c1BotGo(c.x+30,c.y+30); swing(1); return false; }
    if(!e.shellOn&&e.shell&&M){ const S0=e.shell, a=angTo(S0.x,S0.y,e.x,e.y); c1BotGo(S0.x+Math.cos(a)*40,S0.y+Math.sin(a)*40); swing(1); return false; }
    c1BotNear(e,e.r+40,(C1B.t*0.7)%TAU); swing(1); return false; }
  if(T==='c_ticktock'){
    const D=c1RoomOf(e);
    if(e.hang){ if(M&&D){ let best=D.rings[0]; for(const r of D.rings) if(dist(r.x,r.y,e.x,e.y)<dist(best.x,best.y,e.x,e.y)) best=r; c1BotGo(best.x,best.y+4);
        if(c1BotAt(best.x,best.y+4,30)&&dist(best.x,best.y,e.x,e.y)<380){ C1B.yankT+=dt; if(C1B.yankT>0.8){ C1B.yankT=0; tickYankDown(e); c1BotEv('yank'); } } return c1BotAt(best.x,best.y+4,30); }
      c1BotNear(e,e.r+60,(C1B.t*0.5)%TAU); return false; }
    if(e.slumpT>0){ c1BotNear(e,e.r+34,e.face); swing(1); return false; }
    if(M){ c1BotNear(e,e.r+90,e.face+Math.PI); const K=tickKey(e), kx=K?e.x+K.dx:0, ky=K?e.y+K.dy:0;
      if(K&&!K.done&&dist(p.x,p.y,kx,ky)<p2Range()){ K.onPull(K,e); C1B.pullT+=dt; if(C1B.pullT>=K.need){ C1B.pullT=0; K.then(K,e); c1BotEv('key'); } } else C1B.pullT=0; return false; }
    c1BotNear(e,e.r+40,(C1B.t*0.6)%TAU); swing(1); return false; }
  if(T==='c_gloomwing'){
    const D=c1RoomOf(e);
    if(e.downT>0){ c1BotNear(e,e.r+30); swing(1); return false; }
    if(e.bph===0){ if(M&&D){ const want=[0,2,4,6]; const m=D.mirrors.find(m=>m.rot!==want[m.i]);
        if(m){ c1BotGo(m.x,m.y+44); if(c1BotAt(m.x,m.y+44,24)){ C1B.mirT-=dt; if(C1B.mirT<=0){ m.onHit('slash'); C1B.mirT=0.5; c1BotEv('mirror'); } } return false; } }
      c1BotNear(e,e.r+30); swing(1); return false; }
    if(e.bph===1){ if(M&&e.sunk&&e.mode==='sunk'){ const R=p2DashLen()*0.8; c1BotNear(e,R*0.6); if(dist(p.x,p.y,e.x,e.y)<R){ C1B.zt+=dt; if(C1B.zt>0.4){ C1B.zt=0; gloomShadowHit(e,{dash:true}); c1BotEv('shadow'); } } return false; }
      if(!e.sunk){ c1BotNear(e,e.r+40); swing(1); } else c1BotNear(e,160); return false; }
    if(e.mode==='smother'&&M&&D){ const L=D.lamp; c1BotGo(L.x,L.y+120); if(c1BotAt(L.x,L.y+120,30)){ p.facing=-Math.PI/2; p.breathing=true; c1BotEv('wick'); } return c1BotAt(L.x,L.y+120,30); }
    if(e.mode==='hide'&&M&&!(e.downT>0)){ const R=p2DashLen()*0.8; c1BotNear(e,R*0.6); if(dist(p.x,p.y,e.x,e.y)<R){ C1B.zt+=dt; if(C1B.zt>0.5){ C1B.zt=0; gloomShadowHit(e,{dash:true}); c1BotEv('shadow'); } } return false; }
    c1BotNear(e,e.r+40); swing(1); return false; }
  if(T==='c_saltbeard'){
    if(M){ C1B.fireT-=dt; const sw=e.swirl;
      if(sw&&!sw.done&&!sw.lit){ c1BotGo(sw.x,sw.y+100); if(c1BotAt(sw.x,sw.y+100,30)&&sw.t>=sw.wait*0.5){ p.facing=-Math.PI/2; p.breathing=true; c1BotEv('swirl'); } return false; }
      if(C1B.fireT<=0&&!saltSolid(e)&&!(e.gone>0)&&dist(p.x,p.y,e.x,e.y)<170){ C1B.fireT=1.2; damageEnemy(e,4,{src:'fire'}); c1BotEv('fire'); } }
    c1BotNear(e,e.r+50,(C1B.t*0.8)%TAU); swing(1); return false; }
  if(T==='c_mothmask'){
    if(e.kneel){ C1B.tx=null; return true; }
    if(e.bph===2&&e.sunk&&M){ const R=p2DashLen()*0.8; c1BotNear(e,R*0.5); if(dist(p.x,p.y,e.x,e.y)<R){ C1B.zt+=dt; if(C1B.zt>0.5){ C1B.zt=0; vesperShadowHit(e,{dash:true}); c1BotEv('tackle'); } } return false; }
    if(e.sunk||e.state==='vault'||e.state==='perch'){ c1BotNear(e,160); return false; }
    c1BotNear(e,e.r+40,(C1B.t*0.9)%TAU); swing(1); return false; }
  if(T==='c_brute'){
    if(M&&e.state==='slamW'){ c1BotLedge(); c1BotEv('toLedge'); return c1Lvl()>=1; }
    if(M&&e.shield&&!(e.gbT>0)){ C1B.hamT-=dt; c1BotNear(e,e.r+30,e.face); if(C1B.hamT<=0&&dist(p.x,p.y,e.x,e.y)<e.r+70){ C1B.hamT=4; damageEnemy(e,wPower()*1.4,{src:'hammer',fx:p.x,fy:p.y}); c1BotEv('hammer'); } swing(1); return false; }
    c1BotNear(e,e.r+34,e.face+(M?0:0.2)); swing(1); return false; }
  if(T==='c_shadowash'){
    const D=c1RoomOf(e);
    if(M&&D&&D.br&&D.br.length&&!D.br.some(o=>o.lit)){ let o=D.br[0]; for(const b of D.br) if(dist(p.x,p.y,b.x,b.y)<dist(p.x,p.y,o.x,o.y)) o=b; c1BotGo(o.x,o.y+70); if(c1BotAt(o.x,o.y+70,30)){ p.facing=-Math.PI/2; p.breathing=true; c1BotEv('brazier'); } return false; }
    if(M){ C1B.fireT-=dt; if(C1B.fireT<=0&&dist(p.x,p.y,e.x,e.y)<170){ C1B.fireT=4; damageEnemy(e,4,{src:'fire'}); c1BotEv('fire'); } }
    c1BotNear(e,e.r+34,(C1B.t*1.1)%TAU); swing(1); return false; }
  c1BotNear(e,e.r+40); swing(1); return false;
}
const C1F_DBG={C1,C1B,C1DUN,C1SITE,C1ROOM,C1_TPL,FOES,c1BossStart,tickYankDown,gloomShadowHit,vesperShadowHit,
    bot(type,o){ o=o||{}; Object.assign(C1B,{on:true,type,mech:o.mech!==false,heal:o.heal!==false,t:0,hitT:0,heals:0,pullT:0,yankT:0,mirT:0,fireT:0,hamT:0,ev:{},dealt:0,zt:0,tx:null,ty:null,dodges:0}); C1.bot=c1BotFrame; return true; },
    stop(){ C1B.on=false; C1.bot=null; C1B.tx=null; },
    state(){ const e=G.boss, D=e&&c1RoomOf(e); return {scene,site:G.fightSite,intro:G.fightIntro,done:Object.assign({},G.bossDone),dmg:Math.round(C1.dmg),hits:C1.hits,heals:C1B.heals,dodges:C1B.dodges||0,src:Object.fromEntries(Object.entries(C1.bySrc).map(([k,v])=>[k,Math.round(v)])),ev:Object.assign({},C1B.ev),dealt:Math.round(C1B.dealt||0),t:+C1B.t.toFixed(1),
      boss:e&&!e.dead?{type:e.type,hp:Math.round(e.hp),max:Math.round(e.maxHp),pct:+(e.hp/e.maxHp).toFixed(3),bph:e.bph||0,state:e.state,mode:e.mode||null,level:e.level,x:Math.round(e.x),y:Math.round(e.y),
        shellOn:e.shellOn,surge:e.surge?e.surge.ph:null,slump:+(e.slumpT||0).toFixed(1),hang:!!e.hang,yanks:e.yanks||0,keyGlow:+(e.keyGlow||0).toFixed(2),downT:+(e.downT||0).toFixed(1),sunk:!!e.sunk,solid:e.type==='c_saltbeard'?saltSolid(e):null,kneel:!!e.kneel,
        clones:vesperClones().length,gb:+(e.gbT||0).toFixed(1)}:null,
      room:D?{type:D.type,mirrors:D.mirrors?D.mirrors.map(m=>m.rot):null,beam:D.beam&&D.beam.length!=null?D.beam.length:null,lamp:D.lamp?{lit:D.lamp.lit,heat:+D.lamp.heat.toFixed(2)}:null,pools:D.pools?D.pools.map(q=>+(q.closedT||0).toFixed(1)):null,water:D.water!=null?+D.water.toFixed(2):null,ledges:D.ledges?D.ledges.length:null}:null,
      foes:G.enemies.filter(q=>!q.dead).map(q=>q.type),player:{x:Math.round(player.x),y:Math.round(player.y),hp:Math.round(player.hp),max:player.maxHp,lvl:c1Lvl(),level:player.level}}; },
    choose(i){ if(typeof chooseOpt==='function'&&DLG&&DLG.opts){ DLG.chars=1e9; chooseOpt(i||0); return true; } return false; },
    dlg(){ return DLG?{who:lineParts(DLG.lines[DLG.i]).who,opts:DLG.opts?DLG.opts.length:0,i:DLG.i,n:DLG.lines.length}:null; },
    rooms(){ return C1.rooms.map(D=>({type:D.type,room:D.R.id,cx:D.R.cx,cy:D.R.cy})); },
    run(sec,dt){ return window.__eb.foes.step(sec,dt||1/30); }};
window.__ebX=Object.assign(window.__ebX||{},{c1Test,c1f:C1F_DBG,c1:Object.assign({},(window.__ebX&&window.__ebX.c1)||{},C1F_DBG)});
