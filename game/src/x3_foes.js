
// ================= x3_foes: the Act IV enemies and bosses (Moonfall)
// Built on e8_foes (defineFoe, the AI kit FK, defineBoss, bossPhase) and on the generic pieces of x1_foes (ground marks
// c1mark / c1lob / c1cloud / c1wave, the moves c1combo / c1slam / c1lob / c1cone / c1swoop, the sheet rows and the
// figure helpers). Every foe has a 3D toy figure (T3E) and a 2D drawer for the Classic look. The guide (numbers, how to
// spawn, how to place each boss, hooks): scratchpad/M3FOES.md.
//   foes    m_moonjelly, m_crabpirate, m_sandshark, m_glassscorp, m_shade, m_mothknight, m_mirrorimp
//           (plus a stand-in f_mothling for Hush's mothlings when the Act III foes module has not made one)
//   minis   m_zapp (Lady Zapp, Drowned Lumen j), m_bigfin (Big Fin, the Burrows k), m_prism (Prism, the Mirror Temple j),
//           m_umberwing (Duke Umberwing, the Observatory i)
//   bosses  m_octavia (Drowned Lumen), m_puffington (outdoors, the Sunken Gate, site m_puff), m_gravelgut (the Burrows),
//           m_fanfare (the Mirror Temple), m_hushboss (Hush on the silver leash, the Eclipse Observatory)
// Dungeon boss rooms: give the room `m3boss:'m_octavia'` (kind 'boss' or 'miniboss', no `boss:` field). The fight starts
// when Ash walks in, the doors lock, and the room is solved when the boss falls. M3_TPL has a template for each room.
// Hush's AI, arena parts and look are plain functions (M3HUSH) so the finale's Echo of the Hush can reuse them.
// Colour language (as Act II): orange ground hit, white sweep, red line charge, silver dust, violet shadow, gold weak spot,
// blue water, moon silver for moonlight.

// ---------- 0. shared bits
const M3={bySt:{},area:null,rooms:[],won:{},hook:{},pending:null,dmg:0,hits:0,bySrc:{},dark:0,darkTo:0,zapT:0,hold:null,bot:null,noIntro:false,parts:[],log:[],ev:{}};
const M3COL={orange:'255,160,60',white:'255,255,255',red:'255,70,60',silver:'215,220,240',violet:'170,110,255',gold:'255,210,80',blue:'120,200,255',moon:'214,226,255',ink:'60,40,90',sand:'230,196,120'};
const m3Sm=t=>t*t*(3-2*t);
// a literal hit of n at the foe's level, also right outside its AI tick (zones, the arena, the room)
function m3Dmg(e,n){ return n*((e&&e.edK)||1)*foeDiff().edmg; }
// a wind-up shown by a ground mark (not e.tele) gets the difficulty's wind-up factor here
function m3W(o,def){ const d=(G&&G.diff)||{}; return fkW(o||{},def)*(d.wind||1); }
function m3Ev(k){ M3.ev[k]=(M3.ev[k]||0)+1; }
function m3Txt(e,t,col,sz){ ftext(e.x,(e._t3top!=null?e._t3top:e.y-e.r)-14,t,col||'#ffe066',sz||15); }
function m3Say(e,who,line,gap){ bossSay(e,who,line,gap||7); }
function m3Tip(id,title,text){ if(G.flags['m3tip_'+id]) return; G.flags['m3tip_'+id]=1; try{ mvTip(title,text,7,'m3_'+id); }catch(err){ setBanner(title,text,3); } }
function m3Puff(x,y,col,n){ emit(x,y,n||16,{col:col||'190,180,210',glow:false,smin:30,smax:150,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:6,drag:1}); }
function m3Stun(e,t,txt,state){ e.stun=0; e.mv=null; e.tele=null; e.blocking=false; e.downT=Math.max(e.downT||0,t); e.state=state||'stuck'; e.st=0.2; if(txt) m3Txt(e,txt,'#ffe066',16); shake(6); }
function m3Mark(o){ return fzAdd('c1mark',Object.assign({dur:0.8,r:46,col:M3COL.orange},o)); }
function m3Lob(x0,y0,x,y,o){ return fzAdd('c1lob',Object.assign({x0,y0,x,y,r:48,dur:0.9,col:M3COL.silver},o)); }
function m3Cloud(x,y,o){ return fzAdd('c1cloud',Object.assign({x,y,r:60,life:2.5},o)); }
function m3Wave(x,y,o){ return fzAdd('c1wave',Object.assign({x,y,r0:20,spd:300,max:420,thick:18,dmg:10},o)); }
const m3Story=()=>!!G&&G.mode==='story';
const m3Dive=()=>typeof p4Diving==='function'&&p4Diving();
const m3Bur=()=>typeof p4Burrowed==='function'&&p4Burrowed();
const m3Up=()=>c1Up();
const m3Lvl=()=>c1Lvl();
function m3Hurt(e){ return e.lastHit!=null?clamp(1-((G?G.time:0)-e.lastHit)/0.28,0,1):0; }
// a dark place: night outdoors, an eclipse, a dark room
function m3Dark(x,y){ if(M3.dark>0.3) return true; if(AREA) return (AREA.dark||0)>0.3; if(G&&G.flags&&G.flags.m_eclipse_now) return true; return isNight(); }
// light on a spot: a lamp or brazier (anything that shines through p2Shine), Moonfire, a moonbeam, fire breath,
// the blue Blaze jet, or Pip's Lantern (G.flags.m_pip_lamp) close by
function m3LitAt(x,y,r){ r=r||14;
  if(typeof p2LitAt==='function'&&p2LitAt(x,y,r)) return 'lamp';
  if(typeof p4MoonLitAt==='function'&&p4MoonLitAt(x,y,r)) return 'moon';
  if(inBreath(x,y,r)) return 'fire';
  if(typeof p3JetHits==='function'&&p3JetHits(x,y,r)) return 'blaze';
  if(G.flags.m_pip_lamp&&G.pip&&!G.pip.dead&&dist(G.pip.x,G.pip.y,x,y)<100+r) return 'pip';
  for(const z of G.fz||[]) if(z.k==='m3lamp'&&z.lit>0&&dist(z.x,z.y,x,y)<(z.R||150)+r) return 'lamp';
  return null; }
// the nearest lit lamp (a light that shines through p2Shine with a radius) within R: moths cannot help staring at it
// (anything shining through p2Shine, a lit fire light of the room (a brazier, a lamp post, a torch), or one of x3_world's
// lit lamps outdoors)
function m3LampNear(x,y,R){ let best=null, bd=R*R;
  if(typeof P2!=='undefined') for(const s of P2.shine){ if(s.r==null||s.r<60) continue; const d=dist2(x,y,s.x,s.y); if(d<bd){ bd=d; best=s; } }
  if(AREA&&AREA.lights) for(const L of AREA.lights){ if(!L.fire||!(L.i>0.3)||(L.r||0)<100) continue; const d=dist2(x,y,L.x,L.y); if(d<bd){ bd=d; best=L; } }
  if(!AREA&&typeof m3wLitLampNear==='function'){ const o=m3wLitLampNear(x,y,R); if(o){ const d=dist2(x,y,o.x,o.y); if(d<bd){ bd=d; best=o; } } }
  return best; }
// fire of any kind on a spot (for lamps and wicks): breath, the Blaze jet, a fire arrow or bomb that just went off near it
function m3FireOn(x,y,r){ return (inBreath(x,y,r||16)&&!(typeof p4MoonOn==='function'&&p4MoonOn()))||(typeof p3JetHits==='function'&&p3JetHits(x,y,r||16))||!!(M3.boom&&M3.boom.t>G.time-0.05&&dist(M3.boom.x,M3.boom.y,x,y)<80); }
{ const base=armsBlast; armsBlast=function(x,y,o){ M3.boom={x,y,t:G?G.time:0}; return base(x,y,o); }; }

// ---------- 1. the player side: a zap or a hug holds Ash still, a pull drags him, the damage log for tests
{ const base=readInput; readInput=function(dt){ const o=base(dt);
    if(M3.bot&&M3B.on&&M3B.inp){ for(const k in M3B.inp) if(M3B.inp[k]) o[k]=M3B.inp[k]; }
    if(G&&G.mode==='story'&&player&&!player.dead&&(M3.zapT>0||(M3.hold&&M3.hold.t<M3.hold.dur&&M3.hold.root))){ o.mx=0; o.my=0; o.roll=false; o.jump=false; }
    return o; }; }
{ const base=updatePlayer; updatePlayer=function(dt,inp){
    if(G&&G.mode==='story'){ if(M3.zapT>0) M3.zapT-=dt; const H=M3.hold;
      if(H){ H.t+=dt; const p=player;
        if(p.dead||H.t>=H.dur||(H.owner&&H.owner.dead)||(H.free&&H.free())){ M3.hold=null; if(H.end&&!p.dead) try{ H.end(H); }catch(err){ console.error(err); } }
        else if(H.pull){ const d=dist(p.x,p.y,H.x,H.y); if(d>(H.stop||40)){ const k=Math.min(d-(H.stop||40),H.pull*dt), a=angTo(p.x,p.y,H.x,H.y), nx=p.x+Math.cos(a)*k, ny=p.y+Math.sin(a)*k; if(!playerBlocked(nx,ny)){ p.x=nx; p.y=ny; } } } } }
    return base(dt,inp); }; }
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){ const h0=player?player.hp:0, r=base(amt,sx,sy,kb); if(r&&player){ const d=Math.max(0,h0-player.hp); M3.dmg+=d; M3.hits++;
      let src=sx==null?'other':'other@'+Math.round(sx)+','+Math.round(sy), bd=300*300; if(sx!=null) for(const q of G.enemies){ if(q.dead) continue; const dd=dist2(q.x,q.y,sx,sy); if(dd<bd){ bd=dd; src=q.type; M3.lastSt=q.type+':'+(q.state||'')+(q.mode?'/'+q.mode:''); } } M3.bySrc[src]=(M3.bySrc[src]||0)+d; if(M3.lastSt){ const k=M3.lastSt; M3.bySt[k]=(M3.bySt[k]||0)+d; M3.lastSt=null; } } return r; }; }
// the zap: a crackle of moon sparks, Ash cannot move for a moment
function m3Zap(t){ const p=player; M3.zapT=Math.max(M3.zapT,t*(foeDiff().easy?0.6:1)); emit(p.x,p.y-12,12,{col:'200,230,255',smin:60,smax:180,lmin:.15,lmax:.35,zmin:1.2,zmax:2.4,drag:4}); SFX.play('cast',0.6); }
// sparks over Ash while he is zapped or held
{ const base=drawMarkers; drawMarkers=function(t){ base(t); const p=player; if(!G||!p||p.dead) return;
    if(M3.zapT>0){ ctx.save(); ctx.strokeStyle='rgba(210,235,255,.9)'; ctx.lineWidth=1.6; for(let i=0;i<3;i++){ const a=t*20+i*2.1, r=14+Math.sin(t*30+i)*3; ctx.beginPath(); ctx.moveTo(p.x+Math.cos(a)*r,p.y-14+Math.sin(a)*r*0.6); ctx.lineTo(p.x+Math.cos(a+0.6)*(r+6),p.y-14+Math.sin(a+0.6)*(r+6)*0.6); ctx.lineTo(p.x+Math.cos(a+1.1)*r,p.y-14+Math.sin(a+1.1)*r*0.6); ctx.stroke(); } ctx.restore(); }
    const H=M3.hold; if(H&&H.draw) try{ H.draw(H,t); }catch(err){} }; }

// ---------- 2. fight zones of this act (drawn under everyone, cleared when a fight ends)
// m3sweep: a line that turns round a centre (glare lines, the taut leash): {x,y,len,a,spin,w,dmg,life,wait,col,ok()}
FZK.m3sweep={
  tick(z,dt){ z.on=z.t>=(z.wait||0); if(z.follow){ const f=z.follow(z); if(f){ z.x=f.x; z.y=f.y; } } if(!z.on) return; z.a+=z.spin*dt*(z.k||1); const p=player; if(p.dead) return;
    if(z.cd>0){ z.cd-=dt; return; } const ex=z.x+Math.cos(z.a)*z.len, ey=z.y+Math.sin(z.a)*z.len;
    if(segD(p.x,p.y,z.x,z.y,ex,ey)<z.w/2+p.r*0.6&&!(z.jump&&m3Up())&&!(typeof p2Shadowed==='function'&&p2Shadowed())&&!(z.block&&z.block(z,p))){ if(hurtPlayer(z.dmg,z.x+Math.cos(z.a)*(dist(z.x,z.y,p.x,p.y)-40),z.y+Math.sin(z.a)*(dist(z.x,z.y,p.x,p.y)-40),220)) z.cd=0.7; } },
  drawG(z){ const k=clamp(z.t/Math.max(0.01,z.wait||0.01),0,1), col=z.col||M3COL.gold; ctx.save(); ctx.translate(z.x,z.y);
    if(!z.on){ ctx.rotate(z.a); ctx.fillStyle=`rgba(${col},${0.1+0.12*k})`; ctx.fillRect(0,-z.w/2,z.len,z.w); ctx.strokeStyle=`rgba(${col},${0.45+0.4*k})`; ctx.lineWidth=2; ctx.strokeRect(0,-z.w/2,z.len,z.w);
      ctx.rotate(z.spin>0?0.35:-0.35); ctx.setLineDash([6,6]); ctx.beginPath(); ctx.moveTo(z.len*0.4,0); ctx.lineTo(z.len*0.9,0); ctx.stroke(); ctx.setLineDash([]); }
    else{ ctx.rotate(z.a); const a=clamp(Math.min(1,(z.life-z.t)/0.3),0,1); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=`rgba(${col},${0.3*a})`; ctx.fillRect(0,-z.w,z.len,z.w*2); ctx.fillStyle=`rgba(255,255,240,${0.75*a})`; ctx.fillRect(0,-z.w*0.3,z.len,z.w*0.6); }
    ctx.restore(); }
};
// m3beam: a short straight beam that just went off (a reflected breath, a rainbow); drawn bright for a moment
FZK.m3beam={
  drawG(z){ const a=clamp(1-z.t/z.life,0,1); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
    ctx.strokeStyle=`rgba(${z.col||M3COL.moon},${0.45*a})`; ctx.lineWidth=(z.w||16)*1.6; ctx.beginPath(); ctx.moveTo(z.x,z.y); ctx.lineTo(z.x1,z.y1); ctx.stroke();
    ctx.strokeStyle=`rgba(255,255,255,${0.85*a})`; ctx.lineWidth=(z.w||16)*0.35; ctx.stroke(); ctx.restore(); }
};
function m3Beam(x,y,x1,y1,o){ return fzAdd('m3beam',Object.assign({x,y,x1,y1,life:0.35},o)); }
// a breath sent back at Ash by a mirror face: a short silver beam and a small hit
function m3Reflect(e,src,cdKey){ const p=player; if(e[cdKey||'_rfT']>G.time) return; e[cdKey||'_rfT']=G.time+0.6;
  const fx=e.x+Math.cos(e.face)*e.r, fy=e.y+Math.sin(e.face)*e.r; m3Beam(fx,fy,p.x,p.y,{col:src==='moon'?M3COL.moon:'255,170,80',w:14});
  hurtPlayer(m3Dmg(e,src==='moon'?10:8),fx,fy,160); SFX.play('block'); m3Txt(e,S('Reflected!','Bounced back!'),'#e0ecff',13);
  m3Tip('reflect',S('A mirror face','Mirror face!'),S('Breath that hits a mirror bounces back at you. Hit it with a weapon, or from the side.','Breath bounces off mirrors. Hit it from the side!')); }
// m3vent: a column of bubbles in the water; a diving Ash who touches it gets all his air back
FZK.m3vent={
  tick(z,dt){ z.ph=(z.ph||0)+dt; if(!m3Dive()||(z.on&&!z.on(z))) return; const p=player; if(dist(p.x,p.y,z.x,z.y)<(z.r||34)+p.r&&typeof p4AirFill==='function'){ if(!(z.cd>G.time)){ z.cd=G.time+0.6; p4AirFill(z); m3Ev('air'); } } },
  drawG(z){ if(z.on&&!z.on(z)) return; m3DrawVent(z,G.time,false); },
  under(z,t){ if(z.on&&!z.on(z)) return; m3DrawVent(z,t,true); }
};
function m3DrawVent(z,t,under){ const r=z.r||34; ctx.save();
  if(under){ ctx.globalCompositeOperation='lighter'; ctx.drawImage(foGlowSpr('170,230,255'),z.x-r*1.6,z.y-r*1.6,r*3.2,r*3.2); ctx.globalCompositeOperation='source-over'; }
  ctx.strokeStyle=under?'rgba(235,250,255,.95)':'rgba(235,250,255,.7)'; ctx.lineWidth=1.4;
  for(let i=0;i<7;i++){ const u=((t*0.6+i/7)%1), x=z.x+Math.sin(i*2.3+t*2)*r*0.35, y=z.y-u*(under?70:26), rr=2+u*3.5; ctx.globalAlpha=1-u; ctx.beginPath(); ctx.arc(x,y,rr,0,TAU); ctx.stroke(); }
  ctx.globalAlpha=1; ctx.fillStyle='rgba(60,110,140,.5)'; ctx.beginPath(); ctx.ellipse(z.x,z.y+2,r*0.4,r*0.18,0,0,TAU); ctx.fill(); ctx.restore(); }
// m3ink: a pool of octopus ink. It hides what is under it (telegraphs too) unless a lamp shines near it; it slows a bit
FZK.m3ink={
  tick(z,dt){ const p=player; z.lit=0; for(const L of z.lamps?z.lamps():[]) if(L.lit>0&&dist(L.x,L.y,z.x,z.y)<420) z.lit++; if(p.dead||m3Up()||dist(p.x,p.y,z.x,z.y)>z.r) return; p.slowT=Math.max(p.slowT||0,0.15); },
  tall(z,list){ if(!z.it) z.it={x:z.x,y:z.y+z.r,flying:true,draw:()=>m3DrawInk(z)}; list.push(z.it); }
};
function m3DrawInk(z){ const a=clamp(Math.min(z.t/0.4,(z.life-z.t)/1.2),0,1)*clamp(1-0.3*(z.lit||0),0.12,1); if(a<=0.01) return; const t=G.time; ctx.save(); ctx.globalAlpha=a;
  ctx.fillStyle='rgba(28,18,44,.86)'; ctx.beginPath(); for(let i=0;i<=24;i++){ const an=i/24*TAU, rr=z.r*(1+0.08*Math.sin(an*4+t*1.3)+0.05*Math.sin(an*7-t)); if(i) ctx.lineTo(z.x+Math.cos(an)*rr,z.y+Math.sin(an)*rr*0.86); else ctx.moveTo(z.x+Math.cos(an)*rr,z.y+Math.sin(an)*rr*0.86); } ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(90,70,140,.35)'; for(let i=0;i<4;i++){ const an=i*1.7+t*0.4; ctx.beginPath(); ctx.ellipse(z.x+Math.cos(an)*z.r*0.45,z.y+Math.sin(an)*z.r*0.35,z.r*0.22,z.r*0.12,an,0,TAU); ctx.fill(); }
  ctx.restore(); }
// m3plate: a glass plate Blaze made on sand (20 s). A worm that bursts up through it cracks a tooth
FZK.m3plate={
  drawG(z){ const a=clamp(Math.min(z.t/0.3,(z.life-z.t)/1.5),0,1); ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='rgba(210,235,250,.55)'; ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=2;
    ctx.beginPath(); for(let i=0;i<7;i++){ const an=i/7*TAU+0.3, rr=z.r*(0.86+0.14*((i*37)%5)/5); if(i) ctx.lineTo(z.x+Math.cos(an)*rr,z.y+Math.sin(an)*rr*0.8); else ctx.moveTo(z.x+Math.cos(an)*rr,z.y+Math.sin(an)*rr*0.8); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(120,160,190,.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(z.x-z.r*0.4,z.y-z.r*0.1); ctx.lineTo(z.x+z.r*0.1,z.y+z.r*0.2); ctx.lineTo(z.x+z.r*0.5,z.y-z.r*0.2); ctx.stroke();
    if(z.crack){ ctx.strokeStyle='rgba(60,40,30,.8)'; ctx.lineWidth=1.6; for(let i=0;i<5;i++){ const an=i*1.26; ctx.beginPath(); ctx.moveTo(z.x,z.y); ctx.lineTo(z.x+Math.cos(an)*z.r*0.9,z.y+Math.sin(an)*z.r*0.7); ctx.stroke(); } }
    ctx.restore(); }
};
function m3PlateAt(x,y,m){ for(const z of G.fz||[]) if(z.k==='m3plate'&&!z.crack&&dist(z.x,z.y,x,y)<z.r+(m||0)) return z; return null; }
// m3lamp: a lamp post or wall lamp of a boss room. Any fire lights it (lit seconds, or for good with keep); a lit lamp
// shines (p2Shine) so moths, Moth Knights, the Duke and Hush stare at it, and it lights Shades
FZK.m3lamp={
  tick(z,dt){ if(z.lit>0&&!z.keep){ z.lit-=dt; if(z.lit<=0){ z.lit=0; if(z.L) z.L.i=0; } }
    if(!z.lit&&z.fireOK!==false&&m3FireOn(z.x,z.y-(z.h||40),22)){ m3LampLight(z); }
    if(z.lit>0){ if(typeof p2Shine==='function') p2Shine(z.x,z.y,z.R||150); if(z.L) z.L.i=0.85; } },
  tall(z,list){ if(!z.it) z.it={x:z.x,y:z.y,draw:()=>m3DrawLamp(z)}; z.it.x=z.x; z.it.y=z.y; list.push(z.it); }
};
function m3LampLight(z,quiet){ z.lit=z.dur||12; z.litAt=G.time; if(z.L) z.L.i=0.85; if(!quiet){ SFX.play('pop'); emit(z.x,z.y-(z.h||40),14,{kind:'fire',smin:30,smax:110,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:6}); } if(z.onLit) try{ z.onLit(z); }catch(err){ console.error(err); } }
function m3DrawLamp(z){ const x=z.x, y=z.y, h=z.h||40, lit=z.lit>0, oc=C1OL(), t=G.time; ctx.save();
  if(z.wall){ ctx.fillStyle=oc; rrect(ctx,x-9,y-h-12,18,22,6); ctx.fill(); ctx.fillStyle='#c8b078'; rrect(ctx,x-7,y-h-10,14,18,5); ctx.fill(); }
  else { ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+2,10,4,0,0,TAU); ctx.fill(); ctx.fillStyle=oc; ctx.fillRect(x-3.2,y-h,6.4,h+2); ctx.fillStyle='#7a6a8a'; ctx.fillRect(x-1.8,y-h,3.6,h); ctx.fillStyle=oc; rrect(ctx,x-10,y-h-18,20,20,5); ctx.fill(); ctx.fillStyle='#d8c08a'; rrect(ctx,x-8,y-h-16,16,16,4); ctx.fill(); }
  ctx.fillStyle=lit?'#fff2b0':'#4a3e58'; ctx.beginPath(); ctx.ellipse(x,y-h-7,4.6,6,0,0,TAU); ctx.fill();
  if(lit){ const f=0.8+0.2*Math.sin(t*11+x); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.8*f; ctx.drawImage(foGlowSpr('255,200,110'),x-30,y-h-37,60,60); }
  ctx.restore(); }
function m3AddLamp(x,y,o){ const A=AREA, L={x,y:y-(o&&o.h||40),r:220,i:0,fire:true}; if(A&&A.lights) A.lights.push(L); return Object.assign({x,y,lit:0,L,keep:false,dur:12,R:150},o||{},{}); }
// m3lane: a worm lane. It rumbles (a sand line telegraph), then a worm arcs over it: anything on the surface is
// swallowed and spat back at the room's door (10 percent max health, "PTOO"); a burrowing Ash is safe
FZK.m3lane={
  tick(z,dt){ z.c=(z.c||0)+dt; const T=z.clock, w=z.wait||2, k=z.c%T, P=player;
    z.ph=k<T-w-0.6?'idle':k<T-0.6?'warn':'pass'; z.u=z.ph==='pass'?(k-(T-0.6))/0.6:0;
    if(z.ph==='pass'&&!z.hitThis&&!P.dead){ const hx=lerp(z.x0,z.x1,z.u), hy=lerp(z.y0,z.y1,z.u); if(dist(P.x,P.y,hx,hy)<46&&!m3Bur()&&!(m3Up()&&P.z>30)){ z.hitThis=true; if(z.plate&&m3PlateAt(hx,hy,10)) return; m3Ptoo(z.e,z.R); } }
    if(z.ph!=='pass') z.hitThis=false;
    if(z.ph==='pass'&&!z.bounced){ const hx=lerp(z.x0,z.x1,z.u), hy=lerp(z.y0,z.y1,z.u), pl=m3PlateAt(hx,hy,20); if(pl){ z.bounced=true; pl.crack=true; pl.life=Math.min(pl.life,pl.t+1); shake(5); SFX.play('block'); ftext(hx,hy-40,S('BONK!','BONK!'),'#e8f6ff',15); } }
    if(z.ph==='idle') z.bounced=false; },
  drawG(z){ if(z.ph==='idle') return; const a=z.ph==='warn'?0.35+0.3*Math.sin(G.time*16):0.6; ctx.save(); ctx.strokeStyle=`rgba(${M3COL.sand},${a})`; ctx.lineWidth=34; ctx.lineCap='round'; ctx.setLineDash([12,10]); ctx.lineDashOffset=-G.time*80; ctx.beginPath(); ctx.moveTo(z.x0,z.y0); ctx.lineTo(z.x1,z.y1); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); },
  tall(z,list){ if(z.ph!=='pass') return; if(!z.it) z.it={flying:true,draw:()=>m3DrawLaneWorm(z)}; z.it.x=lerp(z.x0,z.x1,z.u); z.it.y=lerp(z.y0,z.y1,z.u); list.push(z.it); }
};
function m3Ptoo(e,R){ const p=player, dmg=Math.max(1,p.maxHp*0.1); if(!hurtPlayer(dmg/Math.max(0.3,(G.diff&&G.diff.dmg)||1),p.x,p.y,0)) return; ftext(p.x,p.y-40,S('Gulp! ...PTOO!','Gulp! PTOO!'),'#ffe0b0',16); shake(7);
  const q=R?{x:R.cx,y:R.y1-90}:null; if(q){ p.x=q.x; p.y=q.y; p.kvx=p.kvy=0; if(AREA&&AREA.tri){ AREA.tri.lx=p.x; AREA.tri.ly=p.y; } } m3Ev('ptoo'); }
function m3DrawLaneWorm(z){ const u=z.u, x=lerp(z.x0,z.x1,u), y=lerp(z.y0,z.y1,u), h=Math.sin(u*Math.PI)*80, a=angTo(z.x0,z.y0,z.x1,z.y1), oc=C1OL(); ctx.save();
  ctx.fillStyle='rgba(60,40,20,.25)'; ctx.beginPath(); ctx.ellipse(x,y,40,14,0,0,TAU); ctx.fill();
  for(let i=4;i>=0;i--){ const uu=u-i*0.06; if(uu<0) continue; const xx=lerp(z.x0,z.x1,uu), yy=lerp(z.y0,z.y1,uu)-Math.sin(uu*Math.PI)*80, r=24-i*1.5; ctx.fillStyle=oc; ctx.beginPath(); ctx.arc(xx,yy,r+2,0,TAU); ctx.fill(); ctx.fillStyle=i%2?'#c89a5a':'#d8ac6a'; ctx.beginPath(); ctx.arc(xx,yy,r,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,240,200,.35)'; ctx.beginPath(); ctx.arc(xx-r*0.3,yy-r*0.3,r*0.4,0,TAU); ctx.fill(); }
  ctx.fillStyle='#3a2014'; ctx.beginPath(); ctx.arc(x+Math.cos(a)*16,y-h+Math.sin(a)*8,9,0,TAU); ctx.fill(); ctx.restore(); }
// m3shush: the Great Shush, a wave of quiet too tall to jump. Only a burrowing (or diving, or dashing) Ash lets it pass
FZK.m3shush={
  tick(z,dt){ if(z.t<z.wait) return; z.rad=(z.rad||20)+z.spd*dt; if(z.rad>=z.max){ z.done=true; return; } const p=player;
    if(!z.hitP&&!p.dead&&!m3Bur()&&!m3Dive()&&!(typeof p2Shadowed==='function'&&p2Shadowed())){ const d=dist(z.x,z.y,p.x,p.y); if(Math.abs(d-z.rad)<z.thick/2+p.r*0.6){ z.hitP=true; if(hurtPlayer(z.dmg,z.x,z.y,300)){ if(typeof C1!=='undefined') C1.hushT=Math.max(C1.hushT,2); } } } },
  drawG(z){ const k=clamp(z.t/z.wait,0,1); ctx.save();
    if(z.t<z.wait){ ctx.strokeStyle=`rgba(${M3COL.violet},${0.3+0.5*k})`; ctx.lineWidth=3; ctx.setLineDash([10,8]); ctx.lineDashOffset=G.time*40; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.r0||60,(z.r0||60)*0.86,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=`rgba(${M3COL.violet},${0.08+0.12*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.max,0,TAU); ctx.fill(); }
    else if(z.rad){ const a=clamp(1-z.rad/z.max,0,1)*0.8+0.2; ctx.strokeStyle=`rgba(200,170,255,${a})`; ctx.lineWidth=z.thick; ctx.beginPath(); ctx.ellipse(z.x,z.y,z.rad,z.rad*0.86,0,0,TAU); ctx.stroke(); ctx.strokeStyle=`rgba(255,255,255,${a*0.8})`; ctx.lineWidth=3; ctx.stroke();
      ctx.fillStyle=`rgba(255,255,255,${a*0.9})`; ctx.font=`bold 15px ${UIF}`; ctx.textAlign='center'; for(let i=0;i<6;i++){ const an=i/6*TAU+z.t; ctx.fillText('shh',z.x+Math.cos(an)*z.rad,z.y+Math.sin(an)*z.rad*0.86-12); } }
    ctx.restore(); }
};

// ================= 3. the foes of Moonfall (level 1 numbers from the bible, ACT4.md 8; spawn them at the region level)
// ---------- Moonjelly: a round silver jellyfish with trailing glow-strings. Drifts toward Ash; a touch zaps (a short
// stun); every 5 s it pulses a ring (jump it on land, swim out of it in the water). Moonfire pops it at once. Over land
// it only floats about at night (by day it fades away home).
function m3JellyAI(e,dt,p){
  p=p||player; const D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), wet=fkWet(e.x,e.y);
  e.dx=e.dy=0; e.flying=!wet; e.bob=(e.bob||0)+dt;
  if(!wet&&!AREA&&!m3Dark(e.x,e.y)){ e.hideK=Math.min(1,(e.hideK||0)+dt); e.passive=e.hideK>0.9; e.tele=null; e.state='chase'; steer(e,e.homeX,e.homeY,e.speed*0.5); e.alpha=1-0.8*e.hideK; return; }
  if(e.hideK>0){ e.hideK=Math.max(0,e.hideK-dt); e.passive=false; e.alpha=1-0.8*e.hideK; }
  if(e.state==='pulseW'){ e.st-=dt; if(e.st<=0){ e.tele=null; e.state='pulse'; e.st=0.4; G.rings.push({x:e.x,y:e.y,rad:e.r,max:120,speed:260,thick:12,dmg:e.dmg*0.67}); SFX.play('cast'); } return; }
  if(e.state==='pulse'||e.state==='recover'){ e.st-=dt; if(e.st<=0) e.state='chase'; return; }
  const sp=e.speed*D.spd*(0.6+0.4*Math.sin(e.bob*2.2)); if(d>e.r+p.r-4) steer(e,p.x,p.y,sp);
  e.face=turnTo(e.face,a,2*dt); e.touchCd=(e.touchCd||0)-dt;
  if(d<e.r+p.r+2&&e.touchCd<=0&&!m3Up()){ if(hurtPlayer(e.dmg,e.x,e.y,120)){ m3Zap(0.3); e.touchCd=1.2; } }
  e.pulseT=(e.pulseT==null?rand(2,5):e.pulseT)-dt*D.atk;
  if(e.pulseT<=0&&d<280){ e.pulseT=5; e.state='pulseW'; e.st=0.6; e.tele=newTele({shape:'circle',r:e.r+40,dur:e.st,col:M3COL.blue}); }
}
defineFoe('m_moonjelly',{name:'Moonjelly',r:12,hp:50,speed:70,dmg:12,value:26,swim:true,kbRes:1.1,dcol:'210,225,255',
  ai:m3JellyAI,
  init(e){ e.moonK=3; e.onMoon=(q,dt)=>{ if(q.dead) return; m3Txt(q,S('POP!','POP!'),'#e8f0ff',16); emit(q.x,q.y-10,20,{col:'220,232,255',smin:40,smax:180,lmin:.3,lmax:.7,zmin:1.4,zmax:3}); damageEnemy(q,q.hp+5,{src:'moon'}); }; },
  onDeath(e){ c1Corpse(e); emit(e.x,e.y-8,14,{col:'210,230,255',smin:30,smax:140,lmin:.3,lmax:.7,zmin:1.2,zmax:2.6,drag:2}); },
  draw3d:m3FigJelly, draw2d:m3Jelly2,
  sheet:c1Rows({state:'pulseW',st:0.3},{state:'pulse'},[{state:'chase',flying:true,label:'over land'}])});
function m3FigJelly(e,fl){
  const t=e.t||0, k=e.r/12, fx=e.x, fy=e.y+e.r*0.45, face=t3Turn(e,e.face,6), dead=foDeath(e), inS=foSt(e);
  const pul=e.state==='pulseW'?m3Sm(clamp(inS/0.6,0,1)):e.state==='pulse'?1-clamp(inS/0.4,0,1):0;
  const z=(e.flying?12+Math.sin(t*2+(e.id||0))*3:2)*(1-dead*0.8);
  const dome=fl?'#ffffff':foT(e,'#c8d8f4'), domeD=foT(e,'#94acdc'), glow='#f2f8ff', str='#b4c8f0';
  foShadow(fx,fy,10*k,e.flying?0.3:0.12);
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,6,0,dead*0.9,0,0,0,-dead*4);
  const sq=1+0.1*Math.sin(t*4+(e.id||0))+pul*0.25;
  for(let i=0;i<6;i++){ const an=i/6*TAU+0.3, rx=Math.cos(an)*5.4, ry=Math.sin(an)*5.4, w=Math.sin(t*3+i)*2.4; foN(rx,ry,4.6,rx-2+w,ry+w*0.5,-3,0.75,str,-0.03); foN(rx-2+w,ry+w*0.5,-3,rx-1-w,ry,-9,0.55,str,-0.03); }
  foE(0,0,9,11*sq,11*sq,7/sq,dome);
  foE(0,0,6.6,9*sq,9*sq,3.4,domeD,0,0,0,-0.02);
  foB(0.6,0,10,4.2,glow,0.02);
  for(let i=0;i<8;i++){ const an=i/8*TAU+t*0.6; foD(Math.cos(an)*10.6*sq,Math.sin(an)*10.6*sq,4.8,1.3,glow,0.03); }
  for(const sd of [-1,1]){ foD(9.6*sq,sd*3,10,1.5,'#26285a',0.05); foD(10,sd*2.6,10.6,0.5,'#ffffff',0.06); }
  foGlow(0,0,8,20,'190,215,255',0.35+0.35*pul,false);
  foEnd(8); e._t3top=foTop(fy,17,k,z);
}
function m3Jelly2(e,fl){
  const x=e.x, y=e.y-(e.flying?10:2), r=e.r, t=e.t||0; ctx.save(); c1Shadow2(e,0.9);
  ctx.strokeStyle='rgba(190,210,250,.85)'; ctx.lineWidth=1.4;
  for(let i=0;i<5;i++){ const ox=(i-2)*4; ctx.beginPath(); ctx.moveTo(x+ox,y+3); ctx.quadraticCurveTo(x+ox+Math.sin(t*3+i)*4,y+r*0.9,x+ox-Math.sin(t*3+i)*3,y+r*1.6); ctx.stroke(); }
  const pul=e.state==='pulseW'?1.15:1; c1E2(x,y,r*pul,r*0.8*pul,fl?'#fff':'#c8d8f4',0,1.6);
  ctx.fillStyle='#f2f8ff'; ctx.beginPath(); ctx.arc(x,y-2,r*0.38,0,TAU); ctx.fill(); c1Eye2(x+Math.cos(e.face)*r*0.5-3,y-1,1.8,e.face); c1Eye2(x+Math.cos(e.face)*r*0.5+3,y-1,1.8,e.face);
  ctx.restore();
}

// ---------- Crab Pirate: a crab-man pirate with an eyepatch, a cutlass claw and a shield claw crusted with barnacles.
// Sidesteps, blocks frontal hits, then a 2-hit cutlass combo. A Ground Pound next to him flips him onto his back (3 s,
// belly x2). A Blast Bomb cracks his shield (5 s), the hammer knocks it aside (4 s). Hit him from behind.
function m3CrabPre(e,dt,d,a){
  if(e.flipT>0){ e.flipT-=dt; e.dx=e.dy=0; e.state='stuck'; e.st=0.2; e.blocking=false; e.tele=null; e.mv=null; if(e.flipT<=0){ e.state='recover'; e.st=0.5; m3Txt(e,S('Arr! Right way up!','Arr!'),'#ffd0b0',12); } return true; }
  if(e.shT>0){ e.shT-=dt; e.shield=false; if(e.shT<=0){ e.shield=true; m3Txt(e,S('Shield up!','Shield up!'),'#e0d8c8',11); } }
  if(e.state==='windup'&&!e._arr&&Math.random()<0.5){ e._arr=true; m3Txt(e,S('Arr!','Arr!'),'#ffd0b0',13); } else if(e.state!=='windup') e._arr=false;
  return false;
}
defineFoe('m_crabpirate',{name:'Crab Pirate',r:18,hp:160,speed:85,dmg:18,value:56,shield:true,kbRes:0.4,dcol:'226,110,80',
  ai:FK.brain({move:'strafe',slant:1.25,stop:42,turn:4,guard:true,cd:[0.8,1.4],pre:m3CrabPre,
    moves:[{k:'c1combo',n:2,reach:58,half:0.9,windup:0.55,windup2:0.42,lunge:120,dmg:1,col:M3COL.white,max:92,w:3},
           {k:'c1scuttle',time:0.9,mul:2.2,every:4,w:1}]}),
  init(e){ e.onPound=(q,info)=>{ if(q.dead||info.drum) return; if(info.d<(info.R||92)*1.15+q.r){ q.flipT=byDiff(3.6,3,2.6); q.mv=null; q.tele=null; q.state='stuck'; q.stun=0; m3Txt(q,S('Flipped! Hit his belly!','Flipped! Hit him!'),'#ffe066',15); shake(4); m3Ev('crabflip'); } }; },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(h.src==='bomb'&&!(e.shT>0)){ e.shT=5; e.shield=false; m3Txt(e,S('CRACK! His shield!','Shield cracked!'),'#ffd27a',14); }
    else if(h.src==='hammer'&&!(e.shT>0)&&e.blocking){ e.shT=4; e.shield=false; m3Txt(e,S('Shield knocked aside!','Shield off!'),'#ffd27a',13); }
    if(e.flipT>0) return amt*2; if(h.behind) return amt*1.25; return amt; },
  onDeath(e){ c1Corpse(e); emit(e.x,e.y,10,{col:'230,140,100',smin:50,smax:170,lmin:.3,lmax:.6,zmin:1.4,zmax:2.6,drag:3}); },
  draw3d:m3FigCrab, draw2d:m3Crab2,
  sheet:c1Rows({state:'windup',st:0.3,comboI:0},{state:'strike',comboI:0},[{state:'chase',blocking:true,label:'block'},{state:'stuck',flipT:2,label:'flipped'},{state:'scuttle',dx:200,label:'scuttle'}])});
function m3FigCrab(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/18, face=t3Turn(e,e.face,9), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const sh=fl?'#ffffff':foT(e,'#e0704a'), shD=foT(e,'#a8442a'), shL=foT(e,'#f4a07a'), barn='#e6dcc4', steel='#d8dce4', cloth='#2e3a6a';
  const sp=Math.hypot(e.dx||0,e.dy||0), mv=clamp(sp/80,0,1), dead=foDeath(e), hurt=m3Hurt(e), flip=e.flipT>0||st==='stuck', block=!!e.blocking&&!flip;
  e._wp=(e._wp||0)+dt*sp/(3*k);
  let swing=0, shieldF=block?1:0.3;
  if(st==='windup'){ swing=-m3Sm(clamp(inS/0.5,0,1)); } else if(st==='strike') swing=1;
  const P=foEase(e,'_fcp',foTg(swing,shieldF,flip?1:0),dt,st==='strike'?24:10); swing=P[0]; shieldF=P[1]; const fk=P[2];
  foBegin(fx,fy,face,k,fl,0);
  if(dead) foSet(FOB,10,0,dead*1.3,0,0,0,-dead*4); else if(fk>0.01) foSet(FOB,10,0,fk*Math.PI*0.92,0,0,0,fk*2+Math.sin(t*14)*fk*0.8);
  foLow();
  for(const sd of [-1,1]) for(let i=0;i<3;i++){ const ph=e._wp+i*2.1+(sd>0?0:Math.PI), lx=4-i*5, o=Math.sin(ph)*3*mv+(fk>0.5?Math.sin(t*16+i)*3:0), lift=Math.max(0,Math.cos(ph))*mv*2;
    foL(lx,sd*8,8,lx+o*0.4,sd*16,10+lift,1.8,shD,1.5); foL(lx+o*0.4,sd*16,10+lift,lx+o,sd*19,0.5+lift*0.5,1.5,sh,0.7); }
  foUp(); foSet(FOA,12,-hurt*0.25,0,0);
  foE(0,0,13,11,12,9,sh); foE(-2,0,19,8,9,4,shL,0,0,0,0.01); foE(1,0,9,8,9,4,shD,0,0,0,-0.01);
  for(let i=0;i<3;i++) foD(-4+i*4,0,21.5,1.1,shD,0.04);
  // eye stalks: one with an eyepatch, and a pirate bandana
  for(const sd of [-1,1]){ const ex=9, ey=sd*4, ez=24+Math.sin(t*2+sd)*0.8; foL(7,sd*3,18,ex,ey,ez-2,1.1,shD,0.9); foB(ex,ey,ez,2.8,'#ffffff');
    if(sd<0){ foD(ex+2.4,ey,ez,2.6,'#1a1418',0.05); foN(ex+1,ey-2.8,ez+2.6,ex-4,ey+3,ez+3.2,0.5,'#1a1418',0.04); } else { foD(ex+2.4,ey,ez+0.3,1.5,'#1e1420',0.05); foD(ex+2.7,ey-0.4,ez+1.1,0.5,'#ffffff',0.06); } }
  foE(-1,0,21,9.5,10,3.2,cloth,0,0,0,0.02); foC(-8,3,21,-13,6,18,2.2,cloth,0.01); foD(2,-6,22.5,1.1,'#f4e6c0',0.04);
  // shield claw (left): a big round claw crusted with barnacles, raised in front while he blocks
  { const sx=10+shieldF*4, sy=-11+shieldF*4, sz=12+shieldF*5; foL(4,-9,12,sx-3,sy,sz,2.4,shD,2.2);
    foE(sx,sy,sz,5+shieldF*1.5,7,8,e.shT>0?'#b8a890':sh,0,0,0,0.02);
    for(let i=0;i<5;i++){ const a=i*1.25; foC(sx+2+shieldF*1.5,sy+Math.cos(a)*4.5,sz+Math.sin(a)*5,sx+4.4+shieldF*1.5,sy+Math.cos(a)*5,sz+Math.sin(a)*5.6,1.6,barn,0.04); }
    if(e.shT>0) foN(sx+5,sy-4,sz+5,sx+5,sy+3,sz-4,0.7,'#5a3a2a',0.06); }
  // cutlass claw (right)
  { const ang=-0.9+swing*1.9, hx=8+Math.cos(ang)*6, hy=10+Math.sin(ang)*6, hz=14; foL(4,9,12,hx,hy,hz,2.2,shD,2);
    foE(hx,hy,hz,4,3.4,3,sh); const bx=hx+Math.cos(ang+0.3)*18, by=hy+Math.sin(ang+0.3)*18, bz=hz+4-swing*3;
    foN(hx+1,hy,hz,bx,by,bz,2.2,steel,0.04); foN(hx+1,hy,hz+0.6,bx,by,bz+0.6,0.6,'#ffffff',0.05); foD(hx,hy,hz+1,1.4,'#e0b050',0.05); }
  foEnd(14); e._t3top=foTop(fy,28,k);
}
function m3Crab2(e,fl){
  const x=e.x, y=e.y, r=e.r, f=e.face, flip=e.flipT>0; ctx.save(); c1Shadow2(e,1.1); ctx.translate(x,y); ctx.rotate(f);
  ctx.strokeStyle='#a8442a'; ctx.lineWidth=2; for(const s of [-1,1]) for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-2-i*5,s*r*0.6); ctx.lineTo(-4-i*5,s*(r+6)); ctx.stroke(); }
  c1E2(0,0,r*0.85,r,flip?'#f4c8a8':fl?'#fff':'#e0704a',0,2);
  if(!flip){ c1E2(r*0.8,-r*0.75,6.5,7.5,e.shT>0?'#b8a890':'#e0704a',0,1.6); ctx.fillStyle='#e6dcc4'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.arc(r*0.8+Math.cos(i*1.6)*3.5,-r*0.75+Math.sin(i*1.6)*3.5,1.4,0,TAU); ctx.fill(); }
    ctx.strokeStyle='#d8dce4'; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(r*0.7,r*0.6); ctx.lineTo(r*1.8,r*0.4); ctx.stroke(); }
  ctx.fillStyle='#2e3a6a'; ctx.beginPath(); ctx.ellipse(-2,0,r*0.5,r*0.55,0,0,TAU); ctx.fill();
  c1Eye2(r*0.55,r*0.32,2.6,0); ctx.fillStyle='#1a1418'; ctx.beginPath(); ctx.arc(r*0.55,-r*0.32,2.8,0,TAU); ctx.fill();
  ctx.restore();
}

// ---------- Sand Shark: only its fin shows, cutting through the sand. It circles Ash, the fin rises (a red line) and it
// lunges out of the sand, then flops on the surface 1.2 s (hit it now) and dives again. A Ground Pound on sand close by
// forces it up (stunned); a burrowing Ash is invisible to it, and can pop up under it. Off sand it can only flop.
function m3OnSand(x,y){ try{ return typeof p4SandAt==='function'&&p4SandAt(x,y); }catch(err){ return false; } }
function m3SharkUnder(e,on){ e.under=on; e.invuln=on; e.sub=on; if(!on) e.alpha=1; }
function m3SharkAI(e,dt,p){
  p=p||player; const D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), big=e.type==='m_bigfin';
  e.dx=e.dy=0; const sand=m3OnSand(e.x,e.y);
  if(e.downT>0){ e.downT-=dt; m3SharkUnder(e,false); e.state='stuck'; e.st=0.2; e.tele=null; if(e.downT<=0){ e.state='dive'; e.st=0.4; } return; }
  switch(e.state){
    case 'finUp': e.st-=dt; if(e.st>0.12) e.face=turnTo(e.face,a,5*dt); if(e.st<=0){ e.tele=null; m3SharkUnder(e,false); e.state='lunge'; e.st=e.lungeT||0.42; e.hitP=false; SFX.play('roll'); m3SandBurst(e.x,e.y,14); } return;
    case 'lunge': { const s=(e.lungeSp||700)*D.spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
      if(!e.hitP&&d<e.r+p.r+6&&!m3Up()){ if(hurtPlayer(big?m3Dmg(e,44):e.dmg,e.x,e.y,320)) e.hitP=true; }
      e.st-=dt; if(e.st<=0||foeBumped(e)){ e.state='flop'; e.st=big?1.6:1.2; m3SandBurst(e.x,e.y,10); } return; }
    case 'flop': e.st-=dt; if(e.st<=0){ e.state=m3OnSand(e.x,e.y)?'dive':'flop'; e.st=m3OnSand(e.x,e.y)?0.4:0.8; if(!m3OnSand(e.x,e.y)){ steer(e,e.homeX,e.homeY,e.speed*0.25); } } return;
    case 'dive': e.st-=dt; if(e.st<=0){ if(m3OnSand(e.x,e.y)){ m3SharkUnder(e,true); e.state='chase'; e.cd=rand(1.2,2.2); m3SandBurst(e.x,e.y,8); } else { e.state='flop'; e.st=0.8; } } return;
    case 'spray': e.st-=dt; e.face=turnTo(e.face,a,3*dt); if(e.st<=0){ e.tele=null; const ox=e.x+Math.cos(e.face)*e.r, oy=e.y+Math.sin(e.face)*e.r; emit(ox,oy,24,{col:M3COL.sand,glow:false,ang:e.face,spread:0.5,smin:200,smax:340,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:6,drag:1.5});
        if(inCone(ox,oy,e.face,230,0.5,p.x,p.y,p.r)&&!m3Bur()){ if(hurtPlayer(m3Dmg(e,20),ox,oy,90)) p.slowT=Math.max(p.slowT||0,1.6); } e.state='recover'; e.st=0.5; } return;
    case 'recover': e.st-=dt; if(e.st<=0){ e.state=e.under?'chase':'dive'; e.st=0.4; } return;
  }
  // under the sand: the fin circles Ash (or wanders while Ash burrows, or sulks when there is no sand)
  if(!sand&&!e.under){ e.state='flop'; e.st=0.8; return; }
  if(!e.under){ e.state='dive'; e.st=0.4; return; }
  e.state='chase'; e.orbit=(e.orbit||rand(0,TAU))+dt*(big?1.6:1.2)*(e.orbitDir||1);
  const tx=m3Bur()?e.homeX+Math.cos(e.orbit)*160:p.x+Math.cos(e.orbit)*(big?190:160), ty=m3Bur()?e.homeY+Math.sin(e.orbit)*160:p.y+Math.sin(e.orbit)*(big?190:160);
  steer(e,tx,ty,e.speed*D.spd); if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),6*dt);
  if(!m3OnSand(e.x+e.dx*0.2,e.y+e.dy*0.2)){ e.orbitDir=-(e.orbitDir||1); e.dx*=-0.5; e.dy*=-0.5; }
  if(Math.random()<dt*14) emit(e.x-Math.cos(e.face)*8,e.y-Math.sin(e.face)*8,1,{col:M3COL.sand,glow:false,ang:e.face+Math.PI,spread:0.9,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.4,zmax:2.6,drag:3});
  if(big&&d<e.r+p.r+10&&!m3Up()&&!m3Bur()){ e.finCd=(e.finCd||0)-dt; if(e.finCd<=0&&hurtPlayer(m3Dmg(e,20),e.x,e.y,160)) e.finCd=0.8; }
  e.cd-=dt*D.cdK; if(e.cd<=0&&!m3Bur()&&d<(big?380:330)&&d>90){ e.cd=rand(1.6,2.6);
    if(big&&Math.random()<0.3&&d<260){ m3SharkUnder(e,false); e.state='spray'; e.st=0.6; e.face=a; e.tele=newTele({shape:'cone',len:230,half:0.5,dur:e.st,col:M3COL.sand}); return; }
    e.state='finUp'; e.st=big?0.5:0.5; e.face=a; e.lungeT=big?0.5:0.42; e.lungeSp=big?760:700; e.tele=newTele({shape:'line',len:big?380:300,w:e.r*2,dur:e.st,col:M3COL.red}); }
}
function m3SandBurst(x,y,n){ emit(x,y,n,{col:M3COL.sand,glow:false,smin:40,smax:170,lmin:.3,lmax:.7,zmin:2,zmax:4.5,grow:4,drag:3}); }
function m3SharkInit(e){ m3SharkUnder(e,m3OnSand(e.x,e.y)); e.state=e.under?'chase':'flop'; e.st=0.6;
  e.onPound=(q,info)=>{ if(q.dead||!q.under||info.drum) return; if(info.d<200&&m3OnSand(info.x,info.y)){ m3SharkUnder(q,false); q.downT=q.type==='m_bigfin'?byDiff(2.6,2,1.6):byDiff(2,1.5,1.2); q.tele=null; m3SandBurst(q.x,q.y,22); m3Txt(q,S('Out you come!','Out it comes!'),'#ffe066',15); m3Ev('pounded'); } };
  e.onPop=q=>{ m3SharkUnder(q,false); q.downT=Math.max(q.downT||0,q.type==='m_bigfin'?2:1.5); q.popped=G.time; m3Ev('popped'); }; }
defineFoe('m_sandshark',{name:'Sand Shark',r:16,hp:120,speed:200,dmg:20,value:48,kbRes:0.5,dcol:'200,170,120',
  ai:m3SharkAI, init:m3SharkInit,
  onHurt(e,amt,o){ if(e.under) return false; if(e.state==='flop'||e.downT>0||e.state==='stuck') return amt*1.3; return amt; },
  onDeath(e){ c1Corpse(e); m3SandBurst(e.x,e.y,16); },
  draw3d:m3FigShark, draw2d:m3Shark2,
  sheet:c1Sheet([{state:'chase',under:true,label:'fin'},{state:'chase',under:true,dx:200,label:'swim'},{state:'finUp',st:0.3,under:true,label:'fin up'},{state:'lunge',dx:600,label:'lunge'},{state:'flop',label:'flop'},{state:'stuck',downT:1,label:'stunned'},{state:'chase',deathT:0.3,label:'death'}])});
// the fin and its wake over the sand (both looks: the body is under the sand)
function m3DrawFin(e,fl,k){
  const g=foG();
  const x=e.x, y=e.y, f=e.face, t=e.t||0, up=e.state==='finUp'?1+clamp(foSt(e)/0.5,0,1)*0.6:1, oc=C1OL(), s=(k||1)*up;
  g.save();
  // the wake: a furrow behind the fin and a little bow wave
  g.fillStyle='rgba(120,90,50,.28)'; g.beginPath(); g.ellipse(x-Math.cos(f)*14,y-Math.sin(f)*14+2,22*s,9*s,f,0,TAU); g.fill();
  g.strokeStyle='rgba(255,240,200,.75)'; g.lineWidth=2; for(const sd of [-1,1]){ g.beginPath(); g.moveTo(x+Math.cos(f)*8,y+Math.sin(f)*8+2); g.quadraticCurveTo(x+Math.cos(f+sd*1.2)*12,y+Math.sin(f+sd*1.2)*10+2,x+Math.cos(f+sd*2.4)*18,y+Math.sin(f+sd*2.4)*12+2); g.stroke(); }
  // the fin itself: a dark curved triangle with a light edge, outlined
  const lean=Math.cos(f)*0.35, h=20*s, w=12*s, bx=x-Math.cos(f)*2;
  g.beginPath(); g.moveTo(bx-w*Math.cos(f),y+2-w*Math.sin(f)*0.5); g.quadraticCurveTo(bx+lean*10,y-h*0.6,bx-Math.cos(f)*w*0.5-lean*h*0.6,y-h); g.lineTo(bx+w*Math.cos(f)*0.6,y+2+w*Math.sin(f)*0.3); g.closePath();
  g.fillStyle=fl?'#ffffff':(e.type==='m_bigfin'?'#6a6a7e':'#7a8a98'); g.fill(); g.strokeStyle=oc; g.lineWidth=2; g.stroke();
  g.strokeStyle='rgba(255,255,255,.55)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(bx-w*0.6*Math.cos(f),y-1); g.quadraticCurveTo(bx+lean*8,y-h*0.55,bx-Math.cos(f)*w*0.45-lean*h*0.55,y-h*0.9); g.stroke();
  if(e.type==='m_bigfin'){ g.strokeStyle='#3a2a30'; g.lineWidth=1.4; g.beginPath(); g.moveTo(bx-3,y-h*0.5); g.lineTo(bx+2,y-h*0.35); g.moveTo(bx-4,y-h*0.35); g.lineTo(bx+1,y-h*0.22); g.stroke(); }
  for(let i=0;i<3;i++){ const a=t*6+i*2.1; g.fillStyle='rgba(230,200,140,.8)'; g.beginPath(); g.arc(x+Math.cos(a)*10*s,y+3+Math.sin(a)*4,1.6,0,TAU); g.fill(); }
  g.restore();
}
function m3FigShark(e,fl){
  if(e.under&&!(e.deathT>0)){ m3DrawFin(e,fl,e.r/16); e._t3top=e.y-26; return; }
  const dt=foDt(e), t=e.t||0, st=e.state, big=e.type==='m_bigfin', k=e.r/16, face=t3Turn(e,e.face,st==='lunge'?20:8), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const back=fl?'#ffffff':foT(e,big?'#7a7488':'#8a9aa8'), backD=foT(e,big?'#564e64':'#5e6e7e'), belly=foT(e,'#f0e4cc'), dead=foDeath(e);
  const flop=st==='flop'||st==='stuck', lunge=st==='lunge', dive=st==='dive'?clamp(inS/0.4,0,1):0, spray=st==='spray';
  const z=lunge?10+Math.sin(clamp(inS/0.42,0,1)*Math.PI)*14:flop?2:2-dive*10, wig=flop?Math.sin(t*16)*0.35:Math.sin(t*8)*0.12;
  foShadow(fx,fy,16*k,0.3);
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,6,0,dead*1.4,0,0,0,-dead*4); else if(flop) foSet(FOB,6,0,0.9+Math.sin(t*10)*0.3,wig*0.5); else foSet(FOB,6,lunge?-0.2:0,0,wig*0.4);
  foE(0,0,7,15,7.4,6.6,back); foE(-1,0,4.6,13,6,3.4,belly,0,0,0,-0.01);
  foL(-12,0,7,-20,0,8,3,backD,1.4); foQ([-19,0,8, -25,-1,14, -27,0,8, -25,1,2],backD,null,0.01);
  foQ([-2,0,13, 3,0,13, -4,0,22, -7,0,13.5],backD,null,0.02);
  for(const sd of [-1,1]){ foQ([3,sd*6,5, -1,sd*13,2, -4,sd*7,4],backD,null,0.01); }
  foE(12,0,7,5,5.6,4.6,back); const open=lunge||spray?1:flop?0.6+0.4*Math.sin(t*9):0.2;
  foQ([14,-4,4.4-open, 18,-1.5,5-open*1.2, 18,1.5,5-open*1.2, 14,4,4.4-open],'#4a1e22',null,0.03);
  for(let i=0;i<5;i++) foD(14.5+i*0.7,-3+i*1.5,5.8,0.7,'#ffffff',0.05);
  if(big) foD(16.8,1.5,6,0.9,'#ffcf5a',0.06);
  for(const sd of [-1,1]){ foD(13,sd*4.6,9,1.5,'#1a1418',0.05); foD(13.4,sd*4.4,9.6,0.5,'#ffffff',0.06); }
  if(flop||st==='stuck') for(let i=0;i<2;i++) foD(-6+i*12,0,14,1.2,'#ffe066',0.06);
  foEnd(8); e._t3top=foTop(fy,24,k,z);
}
function m3Shark2(e,fl){
  if(e.under&&!(e.deathT>0)){ m3DrawFin(e,fl,e.r/16); return; }
  const x=e.x, y=e.y-(e.state==='lunge'?10:2), r=e.r, f=e.face; ctx.save(); c1Shadow2(e,1.3); ctx.translate(x,y); ctx.rotate(f);
  ctx.fillStyle=fl?'#fff':(e.type==='m_bigfin'?'#7a7488':'#8a9aa8'); ctx.strokeStyle=C1OL(); ctx.lineWidth=1.8; ctx.beginPath(); ctx.ellipse(0,0,r*1.2,r*0.55,0,0,TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r*1.1,0); ctx.lineTo(-r*1.8,-r*0.6); ctx.lineTo(-r*1.6,0); ctx.lineTo(-r*1.8,r*0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#f0e4cc'; ctx.beginPath(); ctx.ellipse(r*0.1,r*0.2,r*0.9,r*0.22,0,0,TAU); ctx.fill(); c1Eye2(r*0.75,-r*0.25,2.4,0); c1Eye2(r*0.75,r*0.25,2.4,0);
  ctx.restore();
}

// ---------- Glass Scorpion: a scorpion of clear glass with a glowing tail. Its glass armour bounces arrows back at Ash
// and takes knocks badly; claws up, it blocks frontal hits. Tail sting: a red line. Blaze it for 1 s and the glass
// cracks (4 s, any hit x1.6); the hammer and a Ground Pound crack it too; pop up behind it out of the sand.
FM.m3sting={
  start(e,m){ const o=m.o; e.state=o.st||'stingW'; e.st=fkW(o,0.6); e.tele=newTele({shape:'line',len:o.len||200,w:o.w||26,dur:e.st,col:o.col||M3COL.red}); },
  tick(e,dt,d,a,m){ const o=m.o, p=player;
    if(!m.go){ if(e.st>0.15) e.face=turnTo(e.face,a,(o.track||3)*dt); e.st-=dt; if(e.st>0) return false; m.go=true; e.tele=null; e.state=o.st2||'sting'; e.st=0.25; SFX.play('slash');
      const L=o.len||200, ex=e.x+Math.cos(e.face)*L, ey=e.y+Math.sin(e.face)*L;
      if(segD(p.x,p.y,e.x,e.y,ex,ey)<(o.w||26)/2+p.r*0.6&&!m3Up()) hurtPlayer(fkDmg(e,o),e.x,e.y,240); return false; }
    e.st-=dt; return e.st<=0; } };
FM_DEF.m3sting={recover:0.6};
function m3GlassCrack(e,t,txt){ if(!(e.crackT>0)) m3Txt(e,txt||S('CRACK! The glass breaks!','Crack!'),'#ffe066',15); e.crackT=Math.max(e.crackT||0,t); e.shield=false; e.blocking=false; e.heat=0; emit(e.x,e.y-10,14,{col:'220,240,255',smin:60,smax:200,lmin:.2,lmax:.5,zmin:1.2,zmax:2.4,drag:3}); SFX.play('block'); m3Ev('crack'); }
defineFoe('m_glassscorp',{name:'Glass Scorpion',r:15,hp:140,speed:95,dmg:17,value:50,shield:true,kbRes:0.5,dcol:'200,235,250',
  ai:FK.brain({move:'approach',stop:52,turn:3,guard:true,cd:[0.9,1.6],
    pre(e,dt){ if(e.crackT>0){ e.crackT-=dt; e.shield=false; if(e.crackT<=0){ e.shield=true; m3Txt(e,S('The glass mends.','Glass back!'),'#d8f0ff',11); } } if(e.heat>0&&!(e.heatT>G.time)) e.heat=Math.max(0,e.heat-dt*0.5); return false; },
    moves:[{k:'m3sting',len:200,w:26,windup:0.6,dmg:1,min:40,max:210,w:2.4},
           {k:'pinch',reach:44,windup:0.42,dmg:0.7,max:60,w:1.5}]}),
  init(e){ e.heat=0;
    e.onBlaze=(q,dt)=>{ if(q.crackT>0) return; q.heat=(q.heat||0)+dt; q.heatT=G.time+0.4; if(Math.random()<dt*12) emit(q.x,q.y-12,1,{kind:'fire',smin:10,smax:40,lmin:.2,lmax:.4,zmin:2,zmax:3,grow:4}); if(q.heat>=1) m3GlassCrack(q,4,S('The hot glass cracks!','It cracks!')); };
    e.onPound=(q,info)=>{ if(!info.drum&&info.d<(info.R||92)+q.r) m3GlassCrack(q,4); };
    e.onPop=q=>{ m3GlassCrack(q,3); q.face+=Math.PI; }; },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(e.crackT>0) return amt*1.6;
    if(h.src==='arrow'||h.src==='proj'){ if(!(e._bnT>G.time)){ e._bnT=G.time+0.4; const p=player; shoot(e.x,e.y,angTo(e.x,e.y,p.x,p.y),360,6,m3Dmg(e,9),'bolt','enemy',{life:1.4}); m3Txt(e,S('Bounced off the glass!','Bounce!'),'#d8f0ff',12); m3Tip('glass',S('Glass armour','Glass!'),S('Arrows bounce off. Heat the glass with blue Blaze fire, or smash it with the hammer or a Ground Pound.','Arrows bounce. Use Blaze or the hammer!')); } return false; }
    if(h.src==='hammer'){ m3GlassCrack(e,4); return amt*1.4; }
    return amt*0.6; },
  onDeath(e){ c1Corpse(e); emit(e.x,e.y-6,22,{col:'220,240,255',smin:60,smax:220,lmin:.3,lmax:.7,zmin:1.2,zmax:2.6,drag:2}); },
  draw3d:m3FigScorp, draw2d:m3Scorp2,
  sheet:c1Rows({state:'stingW',st:0.3},{state:'sting'},[{state:'chase',blocking:true,label:'claws up'},{state:'chase',crackT:2,label:'cracked'},{state:'chase',heat:0.7,label:'heating'}])});
function m3FigScorp(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/15, face=t3Turn(e,e.face,7), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const hot=clamp(e.heat||0,0,1), cr=e.crackT>0;
  const gl=fl?'#ffffff':cr?'#c8d4dc':m3MixHex('#bfeaf6','#ffb070',hot*0.7), glD=cr?'#8a98a4':m3MixHex('#7ec4dc','#e07040',hot*0.6), glL='#f4fdff', tip='#ff7ad8';
  const sp=Math.hypot(e.dx||0,e.dy||0), mv=clamp(sp/70,0,1), dead=foDeath(e), hurt=m3Hurt(e);
  e._wp=(e._wp||0)+dt*sp/(2.4*k);
  let tail=0, claw=e.blocking?1:0.4;
  if(st==='stingW') tail=-m3Sm(clamp(inS/0.5,0,1)); else if(st==='sting') tail=1; else if(st==='snapW') claw=1.3; else if(st==='strike') claw=0.2;
  const P=foEase(e,'_fsc',foTg(tail,claw),dt,st==='sting'?26:10); tail=P[0]; claw=P[1];
  foBegin(fx,fy,face,k,fl,0); if(dead) foSet(FOB,6,0,dead*1.4,0,0,0,-dead*3);
  foLow();
  for(const sd of [-1,1]) for(let i=0;i<4;i++){ const ph=e._wp+i*1.6+(sd>0?0:Math.PI), lx=4-i*3.6, o=Math.sin(ph)*2*mv, lift=Math.max(0,Math.cos(ph))*mv*1.4;
    foL(lx,sd*5,4,lx+o*0.4,sd*10,5+lift,0.9,glD,0.8); foL(lx+o*0.4,sd*10,5+lift,lx+o,sd*12,0.4,0.8,gl,0.5); }
  foUp(); foSet(FOA,4,-hurt*0.2,0,0);
  foE(0,0,5,9,6.4,3.6,gl); foE(-1,0,6.8,7,4.6,1.6,glL,0,0,0,0.02); for(let i=0;i<3;i++) foN(-5+i*3.5,-5.6,6,-5+i*3.5,5.6,6,0.5,glD,0.03);
  if(cr) for(let i=0;i<3;i++) foN(-4+i*4,-4,7.6,-1+i*3,3,7.4,0.5,'#4a5a66',0.05);
  // the tail: four segments curling up and over, the glowing sting at the tip
  { let x=-8, z=6; const curl=0.9+tail*0.45; for(let i=0;i<4;i++){ const b=0.6+i*curl*0.55, nx=x-Math.cos(b)*4.2, nz=z+Math.sin(b)*4.2; foL(x,0,z,nx,0,nz,1.8-i*0.15,gl,1.5-i*0.12); x=nx; z=nz; }
    const tx=x+3+tail*8, tz=z-1-tail*4; foC(x,0,z,tx,0,tz,1.6,tip,0.04); foGlow(tx,0,tz,10,'255,120,220',0.6+0.3*Math.sin(t*6),false); }
  // claws (raised in front as a shield)
  for(const sd of [-1,1]){ const cx=9+claw*3, cy=sd*(6-claw*1.5), cz=5+claw*5; foL(5,sd*4,5,cx-2,cy,cz,1.4,glD,1.2); foE(cx,cy,cz,3.6,2.6,2.4+claw*0.6,gl,-claw*0.3);
    foC(cx+2,cy-sd*0.8,cz+1,cx+6,cy-sd*0.4,cz+1.6,1.2,glL,0.02); foC(cx+2,cy+sd*0.6,cz-0.8,cx+5.4,cy+sd*0.6,cz-1.2,1,gl,0.01); }
  for(const sd of [-1,1]) foD(7.6,sd*2,7.6,1,'#2a1a3a',0.05);
  if(hot>0.2) foGlow(0,0,6,16,'255,150,80',hot*0.7,false);
  foEnd(6); e._t3top=foTop(fy,18,k);
}
function m3MixHex(a,b,k){ const A=hexRGB(a), B=hexRGB(b); return '#'+[0,1,2].map(i=>Math.round(A[i]+(B[i]-A[i])*clamp(k,0,1)).toString(16).padStart(2,'0')).join(''); }
function m3Scorp2(e,fl){
  const x=e.x, y=e.y, r=e.r, f=e.face, cr=e.crackT>0; ctx.save(); c1Shadow2(e,1.1); ctx.translate(x,y); ctx.rotate(f);
  const gl=fl?'#fff':cr?'#c8d4dc':'#bfeaf6'; ctx.strokeStyle='#7ec4dc'; ctx.lineWidth=1.6; for(const s of [-1,1]) for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(3-i*3.5,s*4); ctx.lineTo(1-i*3.5,s*(r*0.8)); ctx.stroke(); }
  c1E2(0,0,r*0.65,r*0.45,gl,0,1.6); ctx.strokeStyle=C1OL(); ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(-r*0.6,0); ctx.quadraticCurveTo(-r*1.4,-r*0.2,-r*0.9,-r*0.9); ctx.stroke(); ctx.strokeStyle=gl; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#ff7ad8'; ctx.beginPath(); ctx.arc(-r*0.85,-r*0.95,2.6,0,TAU); ctx.fill(); for(const s of [-1,1]) c1E2(r*0.85,s*r*0.45,4,3,gl,0,1.2);
  if(cr){ ctx.strokeStyle='#4a5a66'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-4,-4); ctx.lineTo(2,3); ctx.lineTo(5,-2); ctx.stroke(); } ctx.restore();
}

// ---------- Shade: a living shadow, a flat black shape with two white eyes, sliding along the ground. Only at night, in
// eclipses and in dark rooms. It cannot be touched unless it is lit (Moonfire, fire, Blaze, a lamp's light, Pip's
// Lantern): then it shrieks, goes solid, and two hits pop it. It grabs Ash in a cold hug (a violet circle).
function m3ShadeAI(e,dt,p){
  p=p||player; const D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0;
  const lit=m3LitAt(e.x,e.y,e.r+6); if(lit){ if(!(e.solidT>0)){ m3Txt(e,S('EEEEK!','EEEK!'),'#e8e0ff',14); SFX.play('hurt',0.4); } e.solidT=lit==='lamp'||lit==='pip'?1.2:2.4; }
  if(e.solidT>0) e.solidT-=dt;
  if(!AREA&&!m3Dark(e.x,e.y)){ e.fadeK=Math.min(1,(e.fadeK||0)+dt*0.8); e.passive=e.fadeK>0.9; e.alpha=1-e.fadeK; e.state='chase'; e.tele=null; steer(e,e.homeX,e.homeY,e.speed*0.4); return; }
  if(e.fadeK>0){ e.fadeK=Math.max(0,e.fadeK-dt); e.passive=false; e.alpha=1-e.fadeK; }
  if(e.state==='hugW'){ e.st-=dt; if(e.st<=0){ e.tele=null; if(d<e.r+58&&!m3Up()&&!m3Bur()&&!(typeof p2Shadowed==='function'&&p2Shadowed())){ e.state='hug'; e.st=1; const q=e;
        M3.hold={owner:e,t:0,dur:1,root:true,x:e.x,y:e.y,end:()=>{ if(!q.dead) hurtPlayer(q.dmg,q.x,q.y,200); },free:()=>q.solidT>0.5,draw:(H,t)=>m3DrawHug(H,t)}; ftext(p.x,p.y-40,S('A cold hug! Brrr!','Brrr! Cold!'),'#d8d0ff',13); m3Ev('hug'); }
      else { e.state='recover'; e.st=0.6; } } return; }
  if(e.state==='hug'){ e.st-=dt; e.x=lerp(e.x,p.x,Math.min(1,dt*10)); e.y=lerp(e.y,p.y+2,Math.min(1,dt*10)); if(e.st<=0||!M3.hold){ e.state='recover'; e.st=0.9; } return; }
  if(e.state==='recover'){ e.st-=dt; const ra=a+Math.PI*0.6; steer(e,e.x+Math.cos(ra)*60,e.y+Math.sin(ra)*60,e.speed*0.5); if(e.st<=0) e.state='chase'; return; }
  e.state='chase'; e.wob=(e.wob||rand(0,6))+dt; const sa=a+Math.sin(e.wob*1.7)*0.5; if(d>40) steer(e,e.x+Math.cos(sa)*60,e.y+Math.sin(sa)*60,e.speed*D.spd*(e.solidT>0?0.6:1));
  e.face=turnTo(e.face,a,6*dt); e.cd-=dt*D.cdK;
  if(e.cd<=0&&d<90){ e.cd=rand(1.6,2.6); e.state='hugW'; e.st=0.6; e.tele=newTele({shape:'circle',r:e.r+44,dur:e.st,col:M3COL.violet}); }
}
function m3DrawHug(H,t){ const p=player; ctx.save(); ctx.lineCap='round'; for(let i=0;i<2;i++){ const y0=p.y-8-i*10; ctx.strokeStyle='rgba(20,10,30,.85)'; ctx.lineWidth=6; ctx.beginPath(); ctx.ellipse(p.x,y0,15,5,0,0.1,Math.PI*1.9); ctx.stroke(); ctx.strokeStyle='rgba(170,140,230,.6)'; ctx.lineWidth=1.4; ctx.stroke(); } ctx.restore(); }
defineFoe('m_shade',{name:'Shade',r:14,hp:60,speed:150,dmg:14,value:40,kbRes:0.8,dcol:'60,40,80',
  ai:m3ShadeAI,
  init(e){ e.moonK=3; e.solidT=0; },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if(h.src==='moon'||h.src==='fire'){ e.solidT=Math.max(e.solidT||0,2); }
    if(!(e.solidT>0)){ if(!(e._shT>G.time)){ e._shT=G.time+1.4; m3Txt(e,S('It is only a shadow! Light it up!','A shadow! Light it!'),'#c8b8ff',12); m3Tip('shade',S('Shades','Shades'),S('A Shade is a living shadow. Light it with Moonfire, fire or a lamp, then hit it.','Light a Shade, then hit it!')); } return false; }
    return amt*1.6; },
  onDeath(e){ m3Puff(e.x,e.y-6,'50,30,70',22); emit(e.x,e.y-6,10,{col:'200,190,255',smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); },
  draw3d:m3FigShade, draw2d:m3Shade2,
  sheet:c1Rows({state:'hugW',st:0.3},{state:'hug'},[{state:'chase',solidT:2,label:'lit'}])});
function m3ShadeShape(e,fl,solid){
  const g=foG();
  const x=e.x, y=e.y+2, r=e.r, t=e.t||0, f=e.face, hug=e.state==='hug'||e.state==='hugW';
  g.save(); g.translate(x,y);
  const col=fl?'#ffffff':solid?'#5a4a72':'#120a1e', rim=solid?'rgba(220,210,255,.9)':'rgba(150,110,220,.55)';
  g.beginPath(); for(let i=0;i<=20;i++){ const a=i/20*TAU, rr=r*(1.15+0.14*Math.sin(a*3+t*4)+0.1*Math.sin(a*5-t*3))*(hug?1.25:1); const px=Math.cos(a)*rr*1.2, py=Math.sin(a)*rr*0.55; if(i) g.lineTo(px,py); else g.moveTo(px,py); } g.closePath();
  g.fillStyle=col; g.globalAlpha*=solid?0.95:0.82; g.fill(); g.globalAlpha/=solid?0.95:0.82; g.strokeStyle=rim; g.lineWidth=1.6; g.stroke();
  // a little hump that rises off the ground, then the eyes
  const hy=-6-(hug?6:0)-Math.sin(t*3)*1.5; g.fillStyle=col; g.beginPath(); g.ellipse(Math.cos(f)*3,hy*0.6,r*0.7,r*0.55+(hug?3:0),0,0,TAU); g.fill(); g.strokeStyle=rim; g.stroke();
  for(const s of [-1,1]){ const ex=Math.cos(f)*5+Math.cos(f+Math.PI/2)*s*4.5, ey=hy*0.6-2+Math.sin(f+Math.PI/2)*s*2; g.fillStyle='#ffffff'; g.beginPath(); g.ellipse(ex,ey,solid?3:2.4,solid?3.6:2,0,0,TAU); g.fill(); }
  if(solid){ g.fillStyle='#1a0a28'; g.beginPath(); g.ellipse(Math.cos(f)*6,hy*0.6+4,3,2.4+Math.sin(t*20)*0.8,0,0,TAU); g.fill(); }
  g.restore();
}
function m3FigShade(e,fl){ m3ShadeShape(e,fl,e.solidT>0); e._t3top=e.y-24; }
function m3Shade2(e,fl){ m3ShadeShape(e,fl,e.solidT>0); }

// ---------- Moth Knight: Nyxara's soldiers, grey moth-winged knights with lances and little plumed helmets. Hovers with
// its wings folded in front (a frontal guard), dives with its lance (a red line), lands 1 s (open). Near a lit lamp it
// stops to stare (3 s, guard down: "Ooh."). Moonfire burns the dust off its wings: it falls 2 s. Hit, it puffs dust.
function m3KnightAI(e,dt,p){
  p=p||player; const D=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0;
  if(e.downT>0){ e.downT-=dt; e.flying=false; e.blocking=false; e.state='stuck'; e.st=0.2; e.z=0; if(e.downT<=0){ e.state='takeoff'; e.st=0.5; } return; }
  e.flying=true;
  switch(e.state){
    case 'diveW': e.blocking=true; e.st-=dt; if(e.st>0.15) e.face=turnTo(e.face,a,4*dt); if(e.st<=0){ e.tele=null; e.state='dive'; e.st=0.48; e.hitP=false; e.blocking=false; SFX.play('roll'); } return;
    case 'dive': { const s=760*D.spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s; e.blocking=false; if(!e.hitP&&d<e.r+p.r+8&&!m3Up()){ if(hurtPlayer(e.dmg,e.x,e.y,300)) e.hitP=true; } e.st-=dt; if(e.st<=0||foeBumped(e)){ e.state='landed'; e.st=1; shake(3); m3Puff(e.x,e.y,'190,185,200',10); } return; }
    case 'landed': e.flying=false; e.blocking=false; e.st-=dt; if(e.st<=0){ e.state='takeoff'; e.st=0.4; } return;
    case 'takeoff': e.blocking=false; e.st-=dt; if(e.st<=0) e.state='chase'; return;
    case 'stare': { e.blocking=false; const L=e.lure; e.st-=dt; if(L){ const u=G.time*1.5+(e.id||0); steer(e,L.x+Math.cos(u)*60,L.y-30+Math.sin(u*2)*20,e.speed*0.8); e.face=turnTo(e.face,angTo(e.x,e.y,L.x,L.y),5*dt); }
      if(e.st<=0||!L||!m3LampNear(L.x,L.y,30)){ e.state='chase'; e.lure=null; e.stareCd=G.time+6; } return; }
  }
  if(e.state!=='chase'){ e.state='chase'; }
  e.blocking=true;
  const L=!(e.stareCd>G.time)?m3LampNear(e.x,e.y,400):null;
  if(L){ e.lure=L; e.state='stare'; e.st=3; m3Txt(e,S('Ooh. A lamp.','Ooh.'),'#fff0c0',13); m3Ev('stare'); return; }
  e.orbit=(e.orbit||rand(0,TAU))+dt*1.1*(e.orbitDir||1); const R=170+Math.sin(e.t*1.3)*30; steer(e,p.x+Math.cos(e.orbit)*R,p.y+Math.sin(e.orbit)*R,e.speed*D.spd); e.face=turnTo(e.face,a,4*dt);
  e.cd-=dt*D.cdK; if(e.cd<=0&&d<420&&d>80){ e.cd=e.m3guard?rand(4.5,6):rand(1.8,2.8); e.state='diveW'; e.st=0.7; e.face=a; e.tele=newTele({shape:'line',len:360,w:e.r*1.8,dur:e.st,col:M3COL.red}); }
}
defineFoe('m_mothknight',{name:'Moth Knight',r:18,hp:200,speed:110,dmg:20,value:64,flying:true,shield:true,kbRes:0.5,dcol:'170,165,190',
  ai:m3KnightAI,
  init(e){ e.state='chase';
    e.onMoon=(q,dt)=>{ if(q.downT>0) return; q.dust=(q.dust||0)+dt; if(q.dust>=0.4){ q.dust=0; q.downT=2; q.tele=null; m3Txt(q,S('The dust burns off! It falls!','It falls!'),'#e0e8ff',14); m3Puff(q.x,q.y-20,'210,210,230',18); m3Ev('knightfall'); } }; },
  onHurt(e,amt,o){ const h=foeHit(e,o), p=player;
    if(!(e._dsT>G.time)&&dist(p.x,p.y,e.x,e.y)<110){ e._dsT=G.time+1.5; m3Cloud(e.x,e.y,{r:56,life:1.6,slow:0.6,col:'205,200,220'}); }
    if(e.downT>0) return amt*1.5; if(e.state==='landed'||e.state==='stare') return amt*1.2; return amt; },
  onDeath(e){ c1Corpse(e); m3Puff(e.x,e.y-20,'200,195,215',20); },
  draw3d:m3FigKnight, draw2d:m3Knight2,
  sheet:c1Rows({state:'diveW',st:0.35,blocking:true},{state:'dive',dx:600},[{state:'chase',blocking:true,label:'guard'},{state:'landed',label:'landed'},{state:'stare',label:'staring'},{state:'stuck',downT:1,label:'fallen'}])});
function m3FigKnight(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/18, face=t3Turn(e,e.face,st==='dive'?18:8), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const arm=fl?'#ffffff':foT(e,'#9a98a8'), armD=foT(e,'#6a6878'), armL='#cfcdd8', wing=foT(e,'#b8b4c4'), wingD=foT(e,'#6e6880'), plume='#b04a6a', lance='#d8d0b8';
  const down=e.downT>0||st==='stuck', landed=st==='landed'||down, dive=st==='dive', guard=!!e.blocking&&!landed, dead=foDeath(e), hurt=m3Hurt(e);
  const z=landed?0:dive?14:30+Math.sin(t*3+(e.id||0))*4, flap=landed?0:Math.sin(t*(guard?6:12));
  foShadow(fx,fy,12*k,landed?0.3:0.22);
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,10,0,dead*1.4,0,0,0,-dead*4); else if(down) foSet(FOB,4,0,1.2,0,0,0,-2); else foSet(FOB,10,dive?0.5:st==='diveW'?-0.2:0,flap*0.04,0);
  // wings: folded in front of him as a guard, spread when he dives or stares
  const th=guard?0.9:0.2+flap*0.6, sweep=guard?-5:2;
  for(const sd of [-1,1]){ c1Wing(sd,guard?3:-2,sd*4,18,guard?12:16,10,th,sweep,wing,wingD,2.6,'#e8e4f0'); c1Wing(sd,-4,sd*3.6,13,10,8,th*0.8,sweep+2,wingD,null,1.6,'#e0dcea'); }
  foLow(); for(const sd of [-1,1]) foL(0,sd*3,8,landed?0:1,sd*3.4,landed?0.5:3,1.6,armD,1.3); foUp();
  foY(0,0,8,5,4.4,9,arm,armL); foE(0,0,13,5.6,5.2,4,armL,0,0,0,0.01);
  foB(1,0,21,4.6,arm); foY(1,0,23,4.8,3,3.4,armD,arm,0.01); foQ([3,-3,21.5, 3,3,21.5, 5.4,3,20, 5.4,-3,20],'#2a2836',null,0.03);
  for(const sd of [-1,1]) foD(5.2,sd*1.6,21,0.9,'#e8e0ff',0.05);
  foL(-1,0,26,-6,0,31,1.2,plume,0.8); foB(-6.2,0,31.4,1.6,plume);
  // the lance, couched for the dive
  { const pz=dive||st==='diveW'?-1:6, lx=4, ly=6, lz=14; foL(lx,ly,lz,lx+22,ly,lz+pz,1,lance,0.6,0.02); foC(lx+22,ly,lz+pz,lx+30,ly,lz+pz*1.35,1.6,'#e8e4f0',0.03); foE(lx+2,ly,lz,1.8,2.4,2.4,armD); }
  if(st==='stare') foGlow(6,0,22,10,'255,230,150',0.4,false);
  foEnd(14); e._t3top=foTop(fy,33,k,z);
}
function m3Knight2(e,fl){
  const landed=e.state==='landed'||e.downT>0, x=e.x, y=e.y-(landed?2:22), r=e.r, f=e.face, g=!!e.blocking; ctx.save(); c1Shadow2(e,0.9); ctx.translate(x,y); ctx.rotate(f);
  ctx.fillStyle='#b8b4c4'; ctx.strokeStyle=C1OL(); ctx.lineWidth=1.4; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(g?r*0.4:-r*0.2,s*r*(g?0.5:0.9),r*0.7,r*(g?0.45:0.7),s*0.4,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#e8e4f0'; ctx.beginPath(); ctx.arc(g?r*0.4:-r*0.2,s*r*(g?0.5:0.9),3,0,TAU); ctx.fill(); ctx.fillStyle='#b8b4c4'; }
  c1E2(0,0,r*0.5,r*0.42,fl?'#fff':'#9a98a8',0,1.6); ctx.strokeStyle='#d8d0b8'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(r*0.2,r*0.35); ctx.lineTo(r*1.6,r*0.35); ctx.stroke();
  ctx.fillStyle='#b04a6a'; ctx.beginPath(); ctx.arc(-r*0.35,0,3,0,TAU); ctx.fill(); ctx.restore();
}

// ---------- Mirror Imp: a little imp with a round mirror for a face and spindly legs. Fire, Blaze and Moonfire that hit
// its face bounce back at Ash. It copies Ash's last weapon swing (a weak echo). Hit it with weapons, from the side or
// behind, or with a bomb: after two weapon hits its face cracks and stops reflecting.
FM.m3echo={
  start(e,m){ e.state='windup'; e.st=fkW(m.o,0.4); e.tele=newTele({shape:'arc',r:e.r+40,half:0.9,dur:e.st,col:'190,220,255'}); m.w=(player.swingW||G.weapon||'sword'); },
  tick(e,dt,d,a,m){ const p=player; if(!m.hit){ e.face=turnTo(e.face,a,4*dt); e.st-=dt; if(e.st>0) return false; m.hit=true; e.tele=null; e.state='strike'; e.st=0.2; e.swung=0.25; e.echoW=m.w;
      if(inCone(e.x,e.y,e.face,e.r+42,1,p.x,p.y,p.r)) hurtPlayer(m3Dmg(e,8)*0.66,e.x,e.y,160); SFX.play('slash'); m3Txt(e,S('Copycat!','Copycat!'),'#d8ecff',11); return false; }
    e.st-=dt; return e.st<=0; } };
FM_DEF.m3echo={recover:0.5};
function m3ImpFront(e,o){ const fx=o&&o.fx!=null?o.fx:player.x, fy=o&&o.fy!=null?o.fy:player.y; return Math.abs(angDiff(e.face,angTo(e.x,e.y,fx,fy)))<1.0; }
defineFoe('m_mirrorimp',{name:'Mirror Imp',r:11,hp:70,speed:140,dmg:12,value:34,kbRes:1,dcol:'210,220,240',
  ai:FK.brain({move:'strafe',slant:1.3,stop:30,turn:6,cd:[0.7,1.3],pre(e){ if(e.burnT>0&&e._noBurn>G.time) e.burnT=0; return false; },
    moves:[{k:'slash',reach:36,half:0.9,windup:0.35,dmg:1,col:M3COL.white,max:46,w:2},
           {k:'m3echo',max:70,w:e=>(player.swingT>0||G.time-(ATK.swingT||-9)<1.5)?3:0}]}),
  init(e){ e.faceHits=0;
    e.onBlaze=(q,dt)=>{ if(!q.cracked&&m3ImpFront(q)) m3Reflect(q,'fire'); };
    e.onMoon=q=>{ if(!q.cracked&&m3ImpFront(q)) m3Reflect(q,'moon'); }; },
  onHurt(e,amt,o){ const h=foeHit(e,o);
    if((h.src==='fire'||h.src==='moon'||h.src==='burn')&&!e.cracked&&m3ImpFront(e)){ e._noBurn=G.time+0.4; if(h.src!=='burn') m3Reflect(e,h.src); return false; }
    if((h.melee||h.ranged||h.src==='whip'||h.src==='glaive'||h.src==='bomb')&&!e.cracked){ e.faceHits++; if(e.faceHits>=2){ e.cracked=true; m3Txt(e,S('Its mirror cracks!','Cracked!'),'#ffe066',13); SFX.play('block'); } }
    return amt; },
  onDeath(e){ c1Corpse(e); emit(e.x,e.y-12,16,{col:'230,240,255',smin:50,smax:200,lmin:.2,lmax:.5,zmin:1,zmax:2.2,drag:3}); },
  draw3d:m3FigImp, draw2d:m3Imp2,
  sheet:c1Rows({state:'windup',st:0.2},{state:'strike'},[{state:'chase',cracked:true,label:'cracked'}])});
function m3FigImp(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/11, face=t3Turn(e,e.face,12), fx=e.x, fy=e.y+e.r*0.45;
  const skin=fl?'#ffffff':foT(e,'#6a5a8a'), skinD=foT(e,'#4a3c66'), rim='#c8a050', glass=e.cracked?'#a8b4c4':'#dcecff';
  const mv=foWalk(e,dt,3.2), w=e._wp||0, sw=Math.sin(w)*mv, dead=foDeath(e), hurt=m3Hurt(e);
  let arm=0; if(st==='windup') arm=-1; else if(st==='strike') arm=1;
  foBegin(fx,fy,face,k,fl,0); if(dead) foSet(FOB,8,0,dead*1.4,0,0,0,-dead*3);
  foLow(); for(const sd of [-1,1]){ const o=sw*sd*3; foL(0,sd*2.2,8,o*0.6,sd*3.4,4,0.8,skinD,0.7); foL(o*0.6,sd*3.4,4,o,sd*3,0.3,0.7,skinD,0.6); }
  foUp(); foSet(FOA,8,-hurt*0.3+0.08*mv,0,0);
  foE(0,0,10,3.6,3.2,3.2,skin); foL(0,0,13,0.5,0,15,0.8,skinD,0.7);
  // the mirror face: a gold rim and a bright disc that shows the sky (and cracks)
  foY(1.4,0,15,6.4,6.4,1.4,rim,'#e8c870',0.01); foQ([2.9,-5.4,15.4, 2.9,5.4,15.4, 2.9,5.4,26.2, 2.9,-5.4,26.2],rim,null,0.01);
  foE(2.6,0,20.8,1.2,5.4,5.4,glass,0,0,0,0.02); foE(2.9,-1.4,22.4,0.6,2.4,1.6,'#ffffff',0,0,0,0.03);
  if(e.cracked){ foN(3.2,-3,24,3.2,1,20,0.4,'#3a4458',0.05); foN(3.2,1,20,3.2,4,17.6,0.4,'#3a4458',0.05); }
  for(const sd of [-1,1]) foC(0.6,sd*4.6,25,0,sd*6.6,30,1.2,skinD,0.02);
  for(const sd of [-1,1]){ const sh=sd>0?arm:0; foL(0,sd*3,11.6,3+sh*3,sd*(5.6-sh*2),9+sh*2,0.8,skinD,0.7); }
  if(st==='strike'&&e.echoW) foN(4,4,11,12,-2,10,1.6,'#e8f0ff',0.05);
  foEnd(10); e._t3top=foTop(fy,30,k);
}
function m3Imp2(e,fl){
  const x=e.x, y=e.y-8, r=e.r; ctx.save(); c1Shadow2(e,0.8); ctx.strokeStyle='#4a3c66'; ctx.lineWidth=1.4; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(x+s*2,y+4); ctx.lineTo(x+s*4,y+12); ctx.stroke(); }
  c1E2(x,y+2,r*0.5,r*0.45,fl?'#fff':'#6a5a8a',0,1.2); ctx.fillStyle='#c8a050'; ctx.beginPath(); ctx.arc(x,y-8,r*0.75,0,TAU); ctx.fill(); ctx.fillStyle=e.cracked?'#a8b4c4':'#dcecff'; ctx.beginPath(); ctx.arc(x,y-8,r*0.6,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(x-2,y-10,2.5,1.4,-0.4,0,TAU); ctx.fill(); if(e.cracked){ ctx.strokeStyle='#3a4458'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(x-3,y-12); ctx.lineTo(x+1,y-7); ctx.lineTo(x+4,y-4); ctx.stroke(); } ctx.restore();
}

// ---------- Mothlings: Hush's little moths. When the Act III foes module has not made `f_mothling`, this stand-in does:
// a small white moth that flutters at Ash and loves lights (Hush's arena steers it into lit moonstones to put them out).
// Fire burns it at once.
if(!EDEF.f_mothling){
  defineFoe('f_mothling',{name:'Mothling',r:9,hp:16,speed:170,dmg:6,value:6,flying:true,kbRes:1.3,dcol:'235,232,245',
    ai:FK.brain({move:'hover',orbit:90,wobble:30,spin:2.4,faceMove:true,turn:9,cd:[1.2,2.4],moves:[{k:'c1swoop',windup:0.3,len:190,spd:420,time:0.3,dmg:1,max:220,w:3}]}),
    onHurt(e,amt,o){ if(foeHit(e,o).fire||o.src==='moon') return e.hp+5; return amt; },
    onDeath(e){ emit(e.x,e.y-18,10,{col:'240,238,250',smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3,drag:2}); },
    draw3d(e,fl){ const sv=e.litT; e.litT=0; c1FigMoth(e,fl); e.litT=sv; }, draw2d:(e,fl)=>c1Moth2(e,fl),
    sheet:c1Rows({state:'aim',st:0.1},{state:'swoop',dx:400})});
}

// ================= 4. shared boss machinery: hit circles, lines, sites, the dungeon room trigger, the eclipse dark
const M3HC={};
{ const base=hitCircles; hitCircles=function(e){ const f=M3HC[e.type]; return f?f(e):base(e); }; }
// a hit-circle slot (the same reused objects every frame)
function m3HS(L,n,o){ return Object.assign(L[n]||(L[n]={}),o); }
// keep health at or above frac of max until a mechanic opens the gate (onHurt returns false when nothing may pass)
const m3Floor=(e,a,o,frac)=>c1Floor(e,a,o,frac);
// push the health down to just under a phase mark once the mechanic that ends the phase is done
function m3PhaseTo(e,frac){ if(e.hp>e.maxHp*frac){ e.hp=e.maxHp*frac-1; } }
// a stage the story module defined and Ash has reached (reached() alone is true for an id nobody defined yet)
function m3Reached(st){ return typeof STAGEDEF!=='undefined'&&!!STAGEDEF[st]&&stageAt(st)>=0&&reached(st); }
function m3Spk(id,name,col){ if(!SPK[id]) SPK[id]={name,col}; }
m3Spk('m_octavia','Madame Octavia','#b08ad8'); m3Spk('m_puffington','Baron Puffington','#e8c060'); m3Spk('m_gravelgut','Gravelgut','#d8b070');
m3Spk('m_fanfare','Lord Fanfare','#9ad8c8'); m3Spk('f_hush','Hush','#ece8f8'); m3Spk('m_zapp','Lady Zapp','#a8e0ff'); m3Spk('m_bigfin','Big Fin','#a0a8b8');
m3Spk('m_prism','Prism','#d8f4ff'); m3Spk('m_umberwing','Duke Umberwing','#b8a8d0'); m3Spk('m_esme','Esme','#ffd08a'); m3Spk('c_vesper','Vesper','#c8b0e0'); m3Spk('iska','Iska','#ffcf8a'); m3Spk('nyxara','Nyxara','#c0a8ff');
// the dungeon sites: a boss type maps to its site key (defineBoss, open:()=>false: only the room trigger starts them)
const M3SITE={}, M3SITEK={};
function m3Site(type,k,d){ M3SITE[type]=k; M3SITEK[k]=type; return defineBoss(k,d); }
const M3DUN={
  m_octavia:{k:'m_lampcellar',name:S('The Lamp Cellar','The Lamp Cellar'),level:18,dy:-140},
  m_gravelgut:{k:'m_gullethall',name:S('The Gullet Hall','The Gullet Hall'),level:19,dy:-80},
  m_fanfare:{k:'m_mirrorhall',name:S('The Mirror Hall','The Mirror Hall'),level:20,dy:-150},
  m_hushboss:{k:'m_domegallery',name:S('The Dome Gallery','The Dome Gallery'),level:21,dy:-170},
  m_zapp:{k:'m_eelhall',name:S("The Lantern Eel's Hall","The Eel's Hall"),level:19,dy:-60,mini:true},
  m_bigfin:{k:'m_finpit',name:S('The Fin Pit','The Fin Pit'),level:20,dy:-60,mini:true},
  m_prism:{k:'m_prismhall',name:S("Prism's Hall","Prism's Hall"),level:21,dy:-70,mini:true},
  m_umberwing:{k:'m_dukeperch',name:S("The Duke's Perch","The Duke's Perch"),level:21,dy:-60,mini:true}};
// the Act IV bosses run their own timed moves (a hop, a lunge out of a window, an eclipse): a stock stun (a pound, a bomb,
// a whip crack, the pop-up) would cut a move off half way, so it does not touch them; they have their own punish windows
const M3NOSTUN=new Set(['m_octavia','m_puffington','m_gravelgut','m_fanfare','m_hushboss','m_zapp','m_bigfin','m_umberwing']);
{ const base=stunEnemy; stunEnemy=function(e,t){ if(e&&M3NOSTUN.has(e.type)&&(e.boss||e.mini)) return; return base(e,t); }; }
function m3Won(type){ G.flags[type+'_won']=true; M3.won[type]=true; try{ if(M3.hook.won) M3.hook.won(type); }catch(err){ console.error(err); } questPoke(); }
// a boss spawned for a dungeon room: the room is its arena (e.arena), it joins the room (the doors lock, the room is
// solved when it falls) and never wanders off
function m3BossInit(e){
  e.r0=e.r0||e.r; e.leash=99999;
  const Pd=M3.pending; if(Pd&&Pd.type===e.type&&AREA&&AREA.id===Pd.area){ const R=Pd.R; e.arena={x0:R.x0,y0:R.y0,x1:R.x1,y1:R.y1,cx:R.cx,cy:R.cy}; e.inArea=true; e.room=R.id; e.m3room=R; if(R.enemies) R.enemies.push(e); M3.pending=null; }
}
// a miniboss: the boss bar shows it (G.boss), and its fall ends the fight (outro, onWin)
function m3MiniInit(e,opt){
  if(opt&&opt.hpScale>=2){ const f=opt.hpScale; e.hp/=f; e.maxHp/=f; }
  if(e.elite){ e.elite=false; e.r=EDEF[e.type].r; e.hp/=1.6; e.maxHp/=1.6; }
  const Pd=M3.pending; if(Pd&&Pd.type===e.type){ m3BossInit(e); G.boss=e; e.m3mini=true; } e.leash=99999;
}
function m3MiniDone(e){
  if(!e.m3mini) return; const k=G.fightSite, d=k&&BOSSES[k]; if(!d||d.boss!==e.type) return;
  G.boss=null; G.fightSite=null; G.fightIntro=false; G.bossDone[e.type]=true; bossFightEnd(false); M3.dark=0;
  if(e.m3room&&AREA&&AREA.rooms&&!e.m3room.solved){ try{ solveRoom(e.m3room,true); }catch(err){} }
  later(1.2,()=>{ const L=(STORY.bosses[e.type]&&STORY.bosses[e.type].outro)||[]; const fin=()=>{ scene='play'; try{ if(d.onWin) d.onWin(); }catch(err){ console.error(err); } saveGame(); };
    if(L.length) runDialogue(L,fin); else fin(); });
}
// the fight area of a foe (a dungeon room, the raised arena, or its home): reuses x1's helpers
const m3Ctx=e=>c1Ctx(e), m3In=(C,x,y,m)=>c1In(C,x,y,m), m3Hold=(C,o,m)=>c1Hold(C,o,m);
for(const t in M3DUN){ const d=M3DUN[t]; m3Site(t,d.k,{boss:t,at:{x:IZX+200,y:IZY+600,r:600,name:d.name,level:d.level},stage:null,open:()=>false,bless:!d.mini,
  spawn:P=>({x:P.x,y:P.y+(d.dy||-120)}),onWin(){ m3Won(t); }}); }
// the room decor of a boss room: built whenever the room is loaded; the fight only adds the moving parts
// M3ROOM[type] = {build(R,A)->D, tick(D,dt), ground(D,t) (under the figures), tall(D,list) (y-sorted), under(D,t) (in the dive layer)}
const M3ROOM={};
function m3RoomOf(e){ const R=e&&e.m3room; if(!R) return null; for(const D of M3.rooms) if(D.R===R) return D; return null; }
function m3RoomD(type){ return M3.rooms.find(D=>D.type===type)||null; }
function m3BuildRooms(A){
  for(const id in A.rooms){ const R=A.rooms[id], t=R.m3boss; if(!t||!M3SITE[t]) continue;
    if(G.bossDone[t]&&!R.solved){ try{ solveRoom(R,true); }catch(err){} }
    const K=M3ROOM[t]; let D={type:t,R}; if(K){ try{ D=K.build(R,A)||D; }catch(err){ console.error(err); } } D.type=t; D.R=R; M3.rooms.push(D); }
}
// start a fight now in a dungeon room (R = AREA.rooms[id]) or at its outdoor site. o: {intro:false}
function m3BossStart(type,R,o){
  o=o||{}; const k=M3SITE[type]; if(!k||G.mode!=='story'||G.fightSite) return null; const s=SITES[k], P=POI[s.poi], d=M3DUN[type];
  if(R){ P.x=R.cx; P.y=R.cy; P.r=Math.max(R.x1-R.x0,R.y1-R.y0)*0.6; if(AREA) s.area=AREA.id; M3.pending={R,type,area:AREA&&AREA.id}; }
  G.fightSite=k; G.fightIntro=true;
  const go=()=>{ scene='play'; G.fightIntro=false; if(G.fightSite!==k) return; const h0=G.hazards.length; startBossFight(k);
    const h=G.hazards.slice(h0).find(q=>q.kind==='spawn'&&q.type===type); if(h&&d&&d.mini){ h.opt.level=EDEF[type].lv||P.level; h.opt.elite=false; }
    if(d&&d.mini){ const D=EDEF[type]; setBanner(D.name,(W<560&&D.short)?D.short:D.title,2.8,'boss'); }
    const RD=R&&M3.rooms.find(q=>q.R===R), K=M3ROOM[type]; if(RD&&K&&K.start) try{ K.start(RD); }catch(err){ console.error(err); } };
  const L=o.intro===false||M3.noIntro?[]:((STORY.bosses[type]&&STORY.bosses[type].intro)||[]);
  if(L.length) runDialogue(L,go); else go();
  return k;
}
// leaving the dungeon in the middle of a dungeon fight resets it, like walking away from an outdoor one
{ const base=exitArea; exitArea=function(silent){ if(G&&G.fightSite&&M3SITEK[G.fightSite]&&SITES[G.fightSite].area){ resetBoss(); M3.pending=null; } M3.dark=0; M3.hold=null; return base(silent); }; }
{ const base=resetBoss; resetBoss=function(){ base(); M3.dark=0; M3.darkTo=0; M3.hold=null; for(const D of M3.rooms){ const K=M3ROOM[D.type]; if(K&&K.reset) try{ K.reset(D); }catch(err){ console.error(err); } } }; }
{ const base=newRun; newRun=function(mode){ base(mode); M3.area=null; M3.rooms=[]; M3.pending=null; M3.dark=0; M3.darkTo=0; M3.hold=null; M3.zapT=0; M3.parts=[]; }; }
// every frame: the room decor, room bosses kept in their rooms, the fight starting when Ash walks into a boss room
function m3Frame(dt){
  if(M3.area!==AREA){ M3.area=AREA; M3.rooms=[]; if(AREA&&AREA.rooms) m3BuildRooms(AREA); }
  if(M3.bot) try{ M3.bot(dt); }catch(err){ console.error(err); }
  for(const D of M3.rooms){ const K=M3ROOM[D.type]; if(K&&K.tick) try{ K.tick(D,dt); }catch(err){ console.error(err); } }
  for(const P of M3.parts) if(P.on&&P.tick) try{ P.tick(P,dt); }catch(err){ console.error(err); }
  for(const q of G.enemies) if(!q.dead&&q.arena&&q.m3room&&!q.noHold) m3Hold(m3Ctx(q),q,Math.min(40,(q.r0||q.r)+10));
  // the eclipse dark eases toward its target
  M3.dark+=(M3.darkTo-M3.dark)*Math.min(1,dt*(M3.darkTo>M3.dark?1.6:2.4)); if(M3.dark<0.005&&M3.darkTo<=0) M3.dark=0;
  if(AREA&&M3.rooms.length&&scene==='play'&&!G.fightSite&&!player.dead&&G.mode==='story'){ const R=caveRoomAt(player.x,player.y);
    if(R) for(const D of M3.rooms) if(D.R===R&&caveInterior(R,player.x,player.y)&&!G.bossDone[D.type]&&!R.solved){ m3BossStart(D.type,R); break; } }
}
{ const base=updateEnemies; updateEnemies=function(dt){ base(dt); m3Frame(dt); }; }
{ const base=eventsForRender; eventsForRender=function(list){ base(list);
    if(AREA) for(const D of M3.rooms){ const K=M3ROOM[D.type]; if(K&&K.tall&&inView(D.R.cx,D.R.cy,Math.max(D.R.x1-D.R.x0,D.R.y1-D.R.y0))) try{ K.tall(D,list); }catch(err){ console.error(err); } }
    for(const P of M3.parts) if(P.on&&P.tall) P.tall(P,list); }; }
{ const base=drawPools; drawPools=function(){ if(AREA) for(const D of M3.rooms){ const K=M3ROOM[D.type]; if(K&&K.ground) try{ K.ground(D,G.time); }catch(err){ console.error(err); } } for(const P of M3.parts) if(P.on&&P.ground) P.ground(P,G.time); base(); }; }
// a fall into a pit of a boss room in the middle of the fight (the Mirror Hall's glass ring in the dark) lands Ash back
// in the same room, away from the edge, so the fight goes on
{ const base=trialFall; trialFall=function(){ const A=AREA, e=G&&G.boss; if(A&&A.tri&&e&&!e.dead&&e.m3room&&caveRoomAt(player.x,player.y)===e.m3room){ const R=e.m3room, s=dunNearGround(R.cx+(player.x-R.cx)*0.5,R.cy+(player.y-R.cy)*0.5,8); A.tri.entry={x:s.x,y:s.y}; } return base.apply(this,arguments); }; }
// the dive layer: room decor and fight zones that live under the water are drawn bright for a diving Ash
if(typeof p4DrawUnderwater==='function'){ const base=p4DrawUnderwater; p4DrawUnderwater=function(t){ base(t);
    try{ if(AREA) for(const D of M3.rooms){ const K=M3ROOM[D.type]; if(K&&K.under) K.under(D,t); } for(const z of G.fz||[]){ const K=FZK[z.k]; if(K&&K.under) K.under(z,t); } }catch(err){ console.error(err); } }; }
// the eclipse dark (Hush folding her wings over the hall, Fanfare's tail over the skylight): the engine's own light pass,
// a darker room for a moment; only Ash's glow, Pip's Lantern and lit things show
{ const base=drawLights; drawLights=function(){ if(M3.dark>0.01&&AREA){ const d0=AREA.dark; AREA.dark=Math.max(d0||0,M3.dark*(LOOK.sb?1.35:1)); try{ base(); } finally{ AREA.dark=d0; } return; } base(); }; }
if(typeof mapNight==='function'){ const base=mapNight; mapNight=function(){ return base()+(AREA?0:M3.dark*0.75); }; }

// ---------- room templates that fit each fight (15 x 11 cells a room, 31 x 23 for a 2 x 2 hall)
// `.` floor, `#` wall, `w` deep water, `=` raised floor, `∴` sand, `●` shadow pool, `◊` moon-glass, `☾` moon brazier
const m3Tpl=(w,h,fn)=>c1Tpl(w,h,fn);
const m3Round=(w,h,n)=>c1Round(w,h,n);
// is (i,j) near one of the doors of a room w x h (so a template never walls a door in)
function m3NearDoor(i,j,w,h,m){ m=m||2; const cols=[6,7,8,22,23,24], rows=[4,5,6,16,17,18];
  if((j<=m||j>=h-1-m)&&cols.includes(i)) return true; if((i<=m||i>=w-1-m)&&rows.includes(j)) return true; return false; }
const M3_TPL={
  // the Lamp Cellar (2x2): a round cellar, all floor (the boss floods and drains it)
  cellar:m3Tpl(31,23,m3Round(31,23,4)),
  // the Lantern Eel's Hall (1x1): a deep pool with a floor rim and three raised ledges with lamps standing in the water
  // at its edge (north-west, north-east, south), clear of every door
  eelhall:m3Tpl(15,11,(i,j)=>{ if((i===4&&j===2)||(i===10&&j===2)||(i===7&&j===8)) return '='; if(i>=2&&i<=12&&j>=2&&j<=8) return 'w'; return '.'; }),
  // the Gullet Hall (2x2): a round sand pit inside a stone ring (not burrowable)
  gullet:m3Tpl(31,23,(i,j)=>{ if(Math.min(i,30-i)+Math.min(j,22-j)<4) return '#'; const u=(i-15)/12.4, v=(j-11)/8.6; return u*u+v*v<1?'∴':'.'; }),
  // the Fin Pit (1x1): sand everywhere but a one-cell rim
  finpit:m3Tpl(15,11,(i,j)=>{ if(Math.min(i,14-i)+Math.min(j,10-j)<2) return '#'; const u=(i-7)/6.2, v=(j-5)/4.4; return u*u+v*v<1?'∴':'.'; }),
  // the Mirror Hall (2x2): a ring of moon-glass round the edge over a dark pit, four moon braziers inside it
  mirrorhall:m3Tpl(31,23,(i,j)=>{ if(Math.min(i,30-i)+Math.min(j,22-j)<4) return '#'; if((i===6&&j===5)||(i===24&&j===5)||(i===6&&j===17)||(i===24&&j===17)) return '☾';
    const e=Math.min(i,30-i,j,22-j); if(e<=1&&!m3NearDoor(i,j,31,23,3)) return '◊'; return '.'; }),
  // Prism's Hall and the Duke's Perch (1x1): round rooms
  prismhall:m3Tpl(15,11,m3Round(15,11,2)), perch:m3Tpl(15,11,m3Round(15,11,2)),
  // the Dome Gallery (2x2): brass floor, a rim of glass sand, linked shadow pools west and east, and the upper ring: a
  // gallery (`_` ledge cells) along the north wall between the two north doors, with an updraft vent at each end of it
  dome:m3Tpl(31,23,(i,j)=>{ if(Math.min(i,30-i)+Math.min(j,22-j)<5) return '#'; if((i===5&&j===11)||(i===25&&j===11)) return '●';
    if(i>=11&&i<=19&&j>=0&&j<=1) return '_';
    const u=(i-15)/13.4, v=(j-11)/9.4; return u*u+v*v>0.62?'∴':'.'; })};
// the frost layer of the Dome Gallery: the two updraft vents beside the gallery (Act III cells, p3_frost)
M3_TPL.domeFrost=m3Tpl(31,23,(i,j)=>(i===10&&j===3)||(i===20&&j===3)?'U':'.');

// ================= 5. Madame Octavia, the Lantern Octopus (m_octavia), boss of Drowned Lumen (the Lamp Cellar)
// Phase 1 (drained): she is behind the walls. Her arms burst through the round windows (an orange line) and the glowing
// tip lies on the floor 2 s: hit the tip (all her damage goes through the tips). Ink blobs leave pools of dark (light
// the wall lamps with any fire to see through them); an arm snuffs a lit lamp.
// Phase 2 (flooded): she yanks a valve and the cellar floods. She swims round the room, then her eye glows in a window
// (the trap): she lunges out of it and grabs. While she is out of the window her eye is open (gold, x2), but she is
// under the water: only a DIVING Ash really hurts her. Gate: the flood stays until her eye was hit 1 / 2 / 3 times.
// Phase 3 (the tides): she floods and drains the cellar in turns. While she is out of a window in the flooded room,
// TURN A VALVE (USE at a valve) to drain it: she is stranded on the dais, flopping, 5 s (x2). She refloods after.
// Gate: she cannot fall until she was stranded 1 / 2 / 2 times. Bubble vents give air in the flood.
c1Lines('m_octavia','m_octavia_intro','m_lumen_won',
  [['narr',S('The cellar is round and dark. Lamps hang on the walls, and eight round windows look out into the deep. Something big moves past them. Then a gold eye fills one window.','A dark round room. Eight windows. A huge gold eye looks in!')],
   ['m_octavia',S('A visitor! Down here! Do you have a lamp? Everyone who comes down here has a lamp. Give it to me, dear.','A visitor! Do you have a lamp? Give it to me!')],
   ['ash',S('These are Lumen\'s lamps. You took them all?','You took all of Lumen\'s lamps?')],
   ['m_octavia',S('Took? I COLLECTED. There is a difference. Mostly in the screaming.','I did not take them. I collected them!')]],
  [['narr',S('Octavia flops on the dais, all eight arms in a tangle, and makes a noise like a very sad bath.','Octavia flops down in a tangle. She sounds like a sad bath.')],
   ['m_octavia',S("Fine! FINE! Take your lamps. I only wanted something pretty to look at down here. It's DARK at the bottom of the sea, you know.",'Fine! Take the lamps. It is so dark down here.')],
   ['ash',S('You could just... share them? Leave them in the windows?','You could share them. Put them in the windows!')],
   ['m_octavia',S("...Share. Hm. I've never tried sharing. Is it nice?",'Share? I never tried that. Is it nice?')],
   ['narr',S("One by one, she puts the moon lamps back in Lumen's windows. All through the drowned city, lights come on.",'She puts the lamps back. The whole city lights up!')]]);
// where the windows, valves and lamps go: along the walls, away from the room's doors
function m3Doors(R){ const A=AREA, c=A.cave, cs=c.cell, out=[]; for(const L of c.links||[]) for(const k of L.cells||[]){ const q=tPos(k); if(q.x>R.x0-cs*1.5&&q.x<R.x1+cs*1.5&&q.y>R.y0-cs*1.5&&q.y<R.y1+cs*1.5) out.push(q); } return out; }
function m3WallSpots(R,side,n,doors,inset){ const L=[], m=inset||10, far=q=>doors.every(d=>dist(d.x,d.y,q.x,q.y)>170);
  if(side==='n'||side==='s'){ const y=side==='n'?R.y0+m:R.y1-m; for(let x=R.x0+230;x<=R.x1-230;x+=60){ const q={x,y,side}; if(far(q)) L.push(q); } }
  else { const x=side==='w'?R.x0+m:R.x1-m; for(let y=R.y0+200;y<=R.y1-200;y+=60){ const q={x,y,side}; if(far(q)) L.push(q); } }
  if(L.length<=n) return L; const out=[]; for(let i=0;i<n;i++) out.push(L[Math.round(i*(L.length-1)/Math.max(1,n-1))]); return n===1?[L[Math.floor(L.length*0.4)]]:out; }
const M3NRM={n:[0,1],s:[0,-1],w:[1,0],e:[-1,0]};
M3ROOM.m_octavia={
  build(R,A){ const cs=A.cave.cell, doors=m3Doors(R), D={R,type:'m_octavia',water:0,waterTo:0,flooded:false,arms:[],cells:[],typ0:new Map()};
    D.win=[].concat(m3WallSpots(R,'n',3,doors),m3WallSpots(R,'s',3,doors),m3WallSpots(R,'w',1,doors),m3WallSpots(R,'e',1,doors)).map((q,i)=>Object.assign(q,{i,glow:0}));
    const vw=m3WallSpots(R,'w',4,doors,14), ve=m3WallSpots(R,'e',4,doors,14); D.valves=[vw[vw.length-1],ve[ve.length-1]].filter(Boolean).map((q,i)=>({x:q.x,y:q.y,side:q.side,i,turn:0}));
    D.lamps=[[150,150],[-150,150],[150,-150],[-150,-150]].map(([dx,dy])=>m3AddLamp(dx>0?R.x0+dx:R.x1+dx,dy>0?R.y0+dy:R.y1+dy,{wall:false,h:46,dur:40,R:170}));
    D.vents=[[-0.3,0.25],[0.32,-0.22],[0.05,0.38]].map(([u,v])=>({x:R.cx+u*(R.x1-R.x0),y:R.cy+v*(R.y1-R.y0),r:34,on:()=>D.flooded}));
    D.dais={x:R.cx,y:R.cy,r:118}; D.floor=c1FloorPath(R);
    c1Cells(R,(k)=>{ const c=A.cave; if(c.grid[k]===0&&(c.typ[k]===0||c.typ[k]===2)){ D.cells.push(k); D.typ0.set(k,c.typ[k]); } });
    return D; },
  start(D){ m3OctFlood(D,false,true); },
  reset(D){ m3OctFlood(D,false,true); D.arms=[]; for(const L of D.lamps) L.lit=0; },
  tick(D,dt){ D.water+=(D.waterTo-D.water)*Math.min(1,dt*(D.waterTo>D.water?0.8:1.4));
    for(const L of D.lamps) FZK.m3lamp.tick(L,dt);
    for(const v of D.vents) FZK.m3vent.tick(v,dt);
    for(const w of D.win) w.glow=Math.max(0,w.glow-dt*1.5);
    for(const a of D.arms){ a.t+=dt; }
    D.arms=D.arms.filter(a=>a.t<a.dur);
    for(const v of D.valves) if(v.turn>0) v.turn-=dt; },
  ground(D,t){ const R=D.R;
    // the dais: a ring of moon-marble in the middle
    ctx.save(); ctx.fillStyle='rgba(60,50,80,.25)'; ctx.beginPath(); ctx.ellipse(D.dais.x,D.dais.y+6,D.dais.r,D.dais.r*0.8,0,0,TAU); ctx.fill();
    ctx.fillStyle='#d8dcea'; ctx.strokeStyle=C1OL(); ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(D.dais.x,D.dais.y,D.dais.r,D.dais.r*0.8,0,0,TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='#a8b0c8'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(D.dais.x,D.dais.y,D.dais.r*0.7,D.dais.r*0.56,0,0,TAU); ctx.stroke();
    for(let i=0;i<8;i++){ const a=i/8*TAU; ctx.fillStyle=i%2?'#c8cee0':'#eef0f8'; ctx.beginPath(); ctx.arc(D.dais.x+Math.cos(a)*D.dais.r*0.85,D.dais.y+Math.sin(a)*D.dais.r*0.68,6,0,TAU); ctx.fill(); }
    ctx.restore();
    // the flood over the floor
    if(D.water>0.01){ ctx.save(); ctx.globalAlpha=Math.min(1,D.water)*0.6; ctx.fillStyle='#2e7a9c'; ctx.fill(D.floor); ctx.globalAlpha=Math.min(1,D.water)*0.5; ctx.strokeStyle='rgba(235,250,255,.85)'; ctx.lineWidth=2;
      for(let i=0;i<9;i++){ const yy=R.y1-((t*40+i*130)%(R.y1-R.y0)), xx=R.x0+((i*397)%(R.x1-R.x0)); ctx.beginPath(); ctx.moveTo(xx-46,yy); ctx.quadraticCurveTo(xx,yy-7,xx+46,yy); ctx.stroke(); }
      ctx.restore(); for(const v of D.vents) if(D.flooded) m3DrawVent(v,t,false); }
    // the round windows and the two tide valves on the walls
    for(const w of D.win) m3DrawWindow(w,t);
    for(const v of D.valves) m3DrawValve(D,v,t); },
  tall(D,list){ for(const L of D.lamps){ if(!L.it) L.it={x:L.x,y:L.y,draw:()=>m3DrawLamp(L)}; list.push(L.it); }
    for(const a of D.arms){ if(!a.it) a.it={flying:true,draw:()=>m3DrawArm(a)}; a.it.x=a.x; a.it.y=a.y; list.push(a.it); } },
  under(D,t){ if(!D.flooded) return; for(const v of D.vents) m3DrawVent(v,t,true); for(const w of D.win) if(w.glow>0) m3DrawWindow(w,t,true); for(const a of D.arms) m3DrawArm(a); }
};
function m3OctFlood(D,on,quiet){
  if(!D||!AREA) return; const c=AREA.cave; if(D.flooded===on&&!quiet) return; D.flooded=on; D.waterTo=on?1:0; if(quiet) D.water=D.waterTo;
  for(const k of D.cells) c.typ[k]=on?TY.deep:D.typ0.get(k);
  if(!on&&m3Dive()) try{ p4Surface(player,true); }catch(err){}
  if(!quiet){ SFX.play(on?'roll':'pop'); shake(7); emit(D.R.cx,D.R.cy,30,{col:'200,235,255',glow:false,smin:60,smax:260,lmin:.4,lmax:.9,zmin:2,zmax:5,drag:2});
    setBanner(on?S('The cellar floods!','The room floods!'):S('The water drains away!','The water drains!'),on?S('Dive under the water to reach her. Bubbles give air.','Dive! Bubbles give air.'):'',2); }
}
function m3DrawWindow(w,t,under){ const n=M3NRM[w.side], x=w.x-n[0]*4, y=w.y-n[1]*4; ctx.save();
  ctx.fillStyle=C1OL(); ctx.beginPath(); ctx.arc(x,y,24,0,TAU); ctx.fill(); ctx.fillStyle='#c8b078'; ctx.beginPath(); ctx.arc(x,y,21,0,TAU); ctx.fill();
  ctx.fillStyle=under?'#4aa8d8':'#1e3a5a'; ctx.beginPath(); ctx.arc(x,y,16,0,TAU); ctx.fill(); ctx.fillStyle='rgba(170,220,255,.35)'; ctx.beginPath(); ctx.ellipse(x-5,y-6,6,3,-0.5,0,TAU); ctx.fill();
  if(w.glow>0){ const a=clamp(w.glow,0,1); ctx.fillStyle=`rgba(255,200,60,${a})`; ctx.beginPath(); ctx.ellipse(x,y,12,9,0,0,TAU); ctx.fill(); ctx.fillStyle=`rgba(40,20,10,${a})`; ctx.beginPath(); ctx.ellipse(x,y,3,8,0,0,TAU); ctx.fill();
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=a*0.7; ctx.drawImage(foGlowSpr('255,200,80'),x-34,y-34,68,68); }
  ctx.restore(); }
function m3DrawValve(D,v,t){ const x=v.x, y=v.y, rot=(D.flooded?1:0)*Math.PI/4+(v.turn>0?v.turn*6:0); ctx.save(); ctx.translate(x,y);
  ctx.fillStyle=C1OL(); ctx.beginPath(); ctx.arc(0,0,22,0,TAU); ctx.fill(); ctx.fillStyle='#b8c4d8'; ctx.beginPath(); ctx.arc(0,0,19,0,TAU); ctx.fill();
  ctx.rotate(rot); ctx.strokeStyle='#5a6880'; ctx.lineWidth=4; for(let i=0;i<4;i++){ ctx.rotate(Math.PI/2); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(16,0); ctx.stroke(); }
  ctx.fillStyle=D.flooded?'#3a5a8a':'#f4f0dc'; ctx.beginPath(); ctx.arc(0,0,7,0,TAU); ctx.fill(); ctx.strokeStyle=C1OL(); ctx.lineWidth=1.4; ctx.stroke(); ctx.restore();
  const e=G.boss; if(e&&e.type==='m_octavia'&&!e.dead&&(e.bph||0)<2&&D.flooded){ ctx.save(); ctx.strokeStyle='#7a4ab0'; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+12,y+18,x-4,y+26); ctx.stroke(); ctx.restore(); } }
// an arm through a window: a tapering purple tentacle with suckers, its tip gold while it lies on the floor (hit it)
function m3DrawArm(a){ const u=a.ph==='slam'?clamp(a.t/0.18,0,1):a.ph==='back'?1-clamp((a.t-(a.dur-0.35))/0.35,0,1):1, tx=lerp(a.wx,a.x,u), ty=lerp(a.wy,a.y,u), oc=C1OL(), t=G.time;
  const mx=(a.wx+tx)/2+Math.sin(t*3+a.wx)*14, my=(a.wy+ty)/2+Math.cos(t*2.6+a.wy)*10;
  ctx.save(); ctx.lineCap='round';
  ctx.strokeStyle=oc; ctx.lineWidth=26; ctx.beginPath(); ctx.moveTo(a.wx,a.wy); ctx.quadraticCurveTo(mx,my,tx,ty); ctx.stroke();
  ctx.strokeStyle='#7a4ab0'; ctx.lineWidth=21; ctx.stroke(); ctx.strokeStyle='#9a6ad0'; ctx.lineWidth=8; ctx.stroke();
  for(let i=1;i<6;i++){ const s=i/6, x=(1-s)*(1-s)*a.wx+2*(1-s)*s*mx+s*s*tx, y=(1-s)*(1-s)*a.wy+2*(1-s)*s*my+s*s*ty; ctx.fillStyle='#f4c8e0'; ctx.beginPath(); ctx.arc(x,y+5,3.4-s,0,TAU); ctx.fill(); }
  const lie=a.ph==='lie'&&a.t<a.dur-0.35; ctx.fillStyle=oc; ctx.beginPath(); ctx.arc(tx,ty,14,0,TAU); ctx.fill(); ctx.fillStyle=lie?'#ffcf5a':'#9a6ad0'; ctx.beginPath(); ctx.arc(tx,ty,11,0,TAU); ctx.fill();
  if(lie){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.5+0.3*Math.sin(t*9); ctx.drawImage(foGlowSpr('255,210,80'),tx-34,ty-34,68,68); }
  ctx.restore(); }
// the eight windows round the walls: she pushes her arms and her eye through them
function m3OctWin(D,x,y,near){ let best=null, bd=1e18; for(const w of D.win){ const d=dist2(w.x,w.y,x,y); if(near===false?false:d<bd){ bd=d; best=w; } } return best; }
function m3OctWinFor(D,p){ const L=D.win.slice().sort((a,b)=>dist2(a.x,a.y,p.x,p.y)-dist2(b.x,b.y,p.x,p.y)); return L[Math.floor(Math.random()*Math.min(3,L.length))]||L[0]; }
const m3OctTipC=[{},{}];
M3HC.m_octavia=e=>{ const D=m3RoomOf(e), L=e._hc||(e._hc=[{},{},{}]); let n=0;
  if(e.mode==='wall'||!e.mode){ if(D) for(const a of D.arms) if(a.ph==='lie'&&a.t<a.dur-0.35) m3HS(L,n++,{x:a.x,y:a.y,r:28,m:1.01}); L.length=n; return L; }
  m3HS(L,n++,{x:e.x,y:e.y,r:e.r,m:1});
  if(e.sw==='out'||e.mode==='strand') m3HS(L,n++,{x:e.x+Math.cos(e.face)*e.r*0.7,y:e.y+Math.sin(e.face)*e.r*0.7-10,r:22,m:2});
  L.length=n; return L; };
function m3OctAI(e,dt,p){
  p=p||player; const D=m3RoomOf(e), D0=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0; e.noClip=true;
  if(!D){ e.mode='swim'; e.sw='lurk'; steer(e,p.x,p.y,e.speed*0.5); return; }
  if(!e.mode){ e.mode='wall'; e.cd=1.2; e.win=D.win[0]; }
  e.noHold=e.mode==='wall';
  e.alpha=e.mode==='wall'?0:(e.mode==='swim'&&!m3Dive()&&e.sw!=='out')?0.42:1; e.sub=e.mode==='swim';
  // phase 3: the tide clock floods and drains the cellar in turns
  if(e.bph>=2&&e.mode!=='strand'){ e.tideT=(e.tideT==null?byDiff(12,10,8):e.tideT)-dt*D0.atk;
    if(e.tideT<=0&&(e.mode==='wall'?!D.arms.length:e.sw==='lurk')){ e.tideT=byDiff(12,10,8); if(D.flooded){ m3OctFlood(D,false); m3OctToWall(e,D); m3Say(e,'m_octavia',S('Low tide! Back to my windows!','Low tide!'),4); } else { m3OctFlood(D,true); m3OctToSwim(e,D); m3Say(e,'m_octavia',S('High tide, dear! Come and swim with me!','High tide!'),4); } } }
  if(e.mode==='strand'){ e.state='stuck'; e.st=0.2; e.x=lerp(e.x,D.dais.x,Math.min(1,dt*6)); e.y=lerp(e.y,D.dais.y,Math.min(1,dt*6)); e.face+=Math.sin(G.time*6)*dt*2; e.strandT-=dt;
    if(e.strandT<=0){ m3OctFlood(D,true); m3OctToSwim(e,D); e.tideT=byDiff(12,10,8); m3Say(e,'m_octavia',S('Water! WATER! Ahh. Better.','Water! Better!'),3); } return; }
  if(e.mode==='wall') return m3OctWall(e,dt,p,D,d);
  return m3OctSwim(e,dt,p,D,d,a);
}
function m3OctToWall(e,D){ e.mode='wall'; e.sw=null; e.state='chase'; e.tele=null; e.mv=null; e.cd=1.4; M3.hold=null; }
function m3OctToSwim(e,D){ e.mode='swim'; e.sw='lurk'; e.swT=byDiff(3.4,2.8,2.2); e.state='chase'; e.x=D.R.cx; e.y=D.R.cy; e.lurkA=rand(0,TAU); e.tele=null; }
// behind the walls: arm slams through a window (orange line, then the tip lies on the floor), ink blobs, snuffing a lamp
function m3OctWall(e,dt,p,D,d){
  const D0=foeDiff(), w=e.win||D.win[0], n=M3NRM[w.side]||[0,1]; e.x=w.x-n[0]*60; e.y=w.y-n[1]*60; e.state='chase'; w.glow=Math.max(w.glow,0.35);
  if(D.arms.some(a=>a.ph!=='back'&&a.t<a.dur-0.4)) return;
  e.cd-=dt*D0.cdK; if(e.cd>0) return;
  const lit=D.lamps.filter(L=>L.lit>0), r=Math.random();
  if(lit.length&&r<0.25&&!(e._grabT>G.time)){ e._grabT=G.time+9; const L=lit[0], W=m3OctWin(D,L.x,L.y); e.win=W; W.glow=1;
    m3Mark({shape:'line',x:W.x,y:W.y,ang:angTo(W.x,W.y,L.x,L.y),len:dist(W.x,W.y,L.x,L.y),w:46,dur:m3W({},0.7),col:M3COL.orange,fire:z=>{ L.lit=0; if(L.L) L.L.i=0; D.arms.push({wx:W.x,wy:W.y,x:L.x,y:L.y,t:0,dur:0.9,ph:'slam'}); m3Txt(e,S('Mine! *snuff*','Mine!'),'#e0c0ff',14); m3OctArmHit(e,z); }}); e.cd=byDiff(2.2,1.8,1.4); return; }
  if(r<0.55&&!(e._inkT>G.time)){ e._inkT=G.time+byDiff(9,7,6); const W=m3OctWinFor(D,p); e.win=W; W.glow=1;
    for(let i=0;i<3;i++){ const q={x:p.x+(i?rand(-110,110):0),y:p.y+(i?rand(-90,90):0)}; m3Hold({rect:true,x0:D.R.x0,y0:D.R.y0,x1:D.R.x1,y1:D.R.y1},q,60);
      m3Lob(W.x,W.y,q.x,q.y,{r:56,dur:m3W({},0.9)+i*0.14,col:M3COL.ink,ball:'#3a2858',br:9,h:120,land:z=>{ SFX.play('pop'); if(!player.dead&&!m3Up()&&dist(player.x,player.y,z.x,z.y)<z.r+player.r*0.5) hurtPlayer(m3Dmg(e,18),z.x,z.y,120); fzAdd('m3ink',{x:z.x,y:z.y,r:96,life:8,lamps:()=>D.lamps}); }}); }
    m3Say(e,'m_octavia',S('A little ink, dear? It hides the mess.','Have some ink!'),8); m3Tip('ink',S('Ink in the dark','Ink!'),S('Ink hides what is under it. Light the lamps on the walls with fire to see through it.','Light the lamps to see through ink!')); e.cd=byDiff(2.4,1.9,1.5); return; }
  // the arm slam: a line from a window to just past Ash; the tip then lies on the floor 2 s
  const W=m3OctWinFor(D,p); e.win=W; W.glow=1; const ang=angTo(W.x,W.y,p.x,p.y), len=Math.min(dist(W.x,W.y,p.x,p.y)+70,900);
  m3Mark({shape:'line',x:W.x,y:W.y,ang,len,w:54,dur:m3W({},0.8),col:M3COL.orange,fire:z=>{ const tx=z.x+Math.cos(z.ang)*z.len, ty=z.y+Math.sin(z.ang)*z.len; shake(8); SFX.play('boom'); m3OctArmHit(e,z,36);
    D.arms.push({wx:z.x,wy:z.y,x:tx,y:ty,t:0,dur:byDiff(3,2.4,2.1),ph:'lie'}); emit(tx,ty,14,{col:'200,190,220',glow:false,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4}); m3Ev('armslam');
    if(!G.flags.m3tip_tip) m3Tip('tip',S('Hit the glowing tip!','Hit the tip!'),S('When an arm slams down, its glowing tip lies on the floor for a moment. Hit it!','Hit the glowing arm tip!')); }});
  e.cd=byDiff(2.6,1.9,1.4)*(e.bph>=2?0.85:1);
}
function m3OctArmHit(e,z,n){ const p=player; if(p.dead||m3Up()) return; const ex=z.x+Math.cos(z.ang)*z.len, ey=z.y+Math.sin(z.ang)*z.len; if(segD(p.x,p.y,z.x,z.y,ex,ey)<z.w/2+p.r*0.5) hurtPlayer(m3Dmg(e,n||24),ex,ey,300); }
// in the flood: she swims round the room, her eye glows in a window (the trap), she lunges out of it and grabs
function m3OctSwim(e,dt,p,D,d,a){
  const D0=foeDiff(), R=D.R;
  if(e.sw==='lurk'){ e.state='chase'; e.lurkA=(e.lurkA||0)+dt*0.5; const rx=(R.x1-R.x0)*0.33, ry=(R.y1-R.y0)*0.3; steer(e,R.cx+Math.cos(e.lurkA)*rx,R.cy+Math.sin(e.lurkA)*ry,e.speed*0.8*D0.spd); if(Math.hypot(e.dx,e.dy)>4) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),3*dt);
    e.swT-=dt*D0.atk; if(e.swT<=0){ const W=m3OctWinFor(D,p); e.win=W; e.sw='eye'; e.st=byDiff(1.4,1.0,0.85); const n=M3NRM[W.side]; e.x=W.x-n[0]*30; e.y=W.y-n[1]*30; e.face=angTo(W.x,W.y,p.x,p.y);
      e.tele=newTele({shape:'line',len:Math.min(dist(W.x,W.y,p.x,p.y)+60,820),w:e.r*1.6,dur:e.st,col:M3COL.gold}); W.glow=1; m3Say(e,'m_octavia',S('Over here, dear. Look at my pretty lamp.','Look at my lamp!'),6); } return; }
  if(e.sw==='eye'){ e.state='windup'; const W=e.win; W.glow=1; e.st-=dt; if(e.st>0.2) e.face=turnTo(e.face,angTo(e.x,e.y,p.x,p.y),2*dt); if(e.st<=0){ e.tele=null; e.sw='lunge'; e.st=0.42; e.hitP=false; SFX.play('roll'); } return; }
  if(e.sw==='lunge'){ e.state='strike'; const s=900*D0.spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
    if(!e.hitP&&d<e.r+p.r+10){ e.hitP=true; if(hurtPlayer(m3Dmg(e,36),e.x,e.y,120)){ const W=e.win; M3.hold={owner:e,t:0,dur:byDiff(1.0,1.5,1.5),pull:byDiff(90,150,190),x:W.x,y:W.y,stop:70,root:false,free:()=>e.sw!=='out'&&e.sw!=='lunge',end:()=>{},draw:(H,t)=>m3DrawGrab(e,H)}; ftext(p.x,p.y-40,S('Grabbed! Swim away!','Grabbed!'),'#e0c0ff',14); } }
    e.st-=dt; if(e.st<=0||!m3In({rect:true,x0:R.x0,y0:R.y0,x1:R.x1,y1:R.y1},e.x,e.y,e.r*0.6)){ e.sw='out'; e.st=byDiff(3,2.2,1.8); e.state='open'; m3Txt(e,S('Her eye! Hit it, under the water!','Hit her eye!'),'#ffd27a',14); } return; }
  if(e.sw==='out'){ e.state='open'; e.st-=dt; e.face=turnTo(e.face,a,1.5*dt); if(e.st<=0){ e.sw='back'; e.st=0.6; } return; }
  if(e.sw==='back'){ e.state='recover'; e.st-=dt; steer(e,R.cx,R.cy,e.speed*D0.spd); if(e.st<=0){ e.sw='lurk'; e.swT=byDiff(3.6,2.8,2.2); } return; }
  e.sw='lurk';
}
function m3DrawGrab(e,H){ const p=player; ctx.save(); ctx.lineCap='round'; ctx.strokeStyle=C1OL(); ctx.lineWidth=12; ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.quadraticCurveTo((e.x+p.x)/2+20,(e.y+p.y)/2-20,p.x,p.y-8); ctx.stroke(); ctx.strokeStyle='#8a5ac0'; ctx.lineWidth=8; ctx.stroke();
  ctx.strokeStyle='#8a5ac0'; ctx.lineWidth=5; ctx.beginPath(); ctx.ellipse(p.x,p.y-10,15,6,0,0,TAU); ctx.stroke(); ctx.restore(); }
// a valve: USE (or the bot) turns it. From phase 3 on it floods or drains the cellar; while she is out of a window,
// draining strands her on the dais
function m3OctValve(D,v){
  const e=G.boss; v.turn=0.5; SFX.play('block'); shake(3);
  if(!e||e.dead||e.type!=='m_octavia'){ m3OctFlood(D,!D.flooded); return; }
  if((e.bph||0)<2){ ftext(v.x,v.y-40,S('It will not turn! Her arm is holding it.','It is stuck!'),'#e0c0ff',14); return; }
  if(D.flooded){ const out=e.mode==='swim'&&(e.sw==='out'||e.sw==='lunge'||e.sw==='eye'); m3OctFlood(D,false);
    if(out){ e.mode='strand'; e.sw=null; e.strandT=byDiff(6,5,4.5); e.strands=(e.strands||0)+1; e.tele=null; M3.hold=null; m3Txt(e,S('Stranded! She flops on the dais!','She is stuck! Hit her!'),'#ffe066',16); m3Say(e,'m_octavia',S('No no NO! Where did the sea go?!','Where is the water?!'),2); m3Ev('strand'); }
    else { m3OctToWall(e,D); e.tideT=byDiff(12,10,8); m3Say(e,'m_octavia',S('Draining my bath? RUDE.','Rude!'),4); } }
  else { m3OctFlood(D,true); m3OctToSwim(e,D); e.tideT=byDiff(12,10,8); }
}
{ const base=updateInteractions; updateInteractions=function(dt){ base(dt);
    const D=AREA&&m3RoomD('m_octavia'); if(!D||!player||player.dead) return; const p=player;
    for(const v of D.valves){ const n=M3NRM[v.side], fx=v.x+n[0]*70, fy=v.y+n[1]*70; if(dist(p.x,p.y,fx,fy)<90){ G.prompt={text:S('Turn the valve!','Turn the valve!'),act:()=>m3OctValve(D,v),x:fx,y:fy,always:true,kind:'use'}; break; } } }; }
defineFoe('m_octavia',{boss:true,name:'Madame Octavia',title:S('the Lantern Octopus','the lamp octopus'),short:'Madame Octavia',
  lv:18,hp:15500,r:50,speed:120,dmg:36,value:1800,swim:true,kbRes:0,dcol:'150,100,200',phases:[0.65,0.3],
  phaseText:[[S('High Tide!','The room floods!'),S('She floods the cellar. DIVE under the water, and hit her eye when she lunges out of a window!','Dive! Hit her eye when she comes out!'),['m_octavia',S('Bath time, dear!','Bath time!')]],
             [S('The Tides!','Flood and drain!'),S('She floods and drains the room. When she is out of a window in the flood, TURN A VALVE to drain it!','When she is out, turn a valve!'),['m_octavia',S('In, out, in, out! Like the sea!','In and out!')]]],
  init(e){ m3BossInit(e); e.mode=null; e.eyeHits=0; e.strands=0; e.cd=1.4; },
  onPhase(e,i){ const D=m3RoomOf(e); if(i===1&&D){ m3OctFlood(D,true); m3OctToSwim(e,D); D.arms=[]; } if(i===2){ e.tideT=byDiff(12,10,8); } },
  ai:m3OctAI,
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.mode==='wall'){ if(o.mult===1.01){ a=amt/1.01; if(!(e._tpT>G.time)){ e._tpT=G.time+0.8; m3Txt(e,S('OW! My tip!','Ow!'),'#ffe066',14); } } else return false; }
    else if(e.mode==='strand') a=amt*2;
    else if(e.mode==='swim'){ if(!m3Dive()&&h.src!=='moon'){ a=amt*0.1; if(!(e._dvT>G.time)){ e._dvT=G.time+2.4; m3Txt(e,S('She is under the water! DIVE to reach her!','Dive! She is under the water!'),'#bfe8ff',13); } }
      else if(o.mult===2&&e.sw==='out'){ e.eyeHits++; m3Ev('eyehit'); if(!(e._eyT>G.time)){ e._eyT=G.time+0.6; m3Txt(e,S('Right in the eye!','Eye hit!'),'#ffe066',15); } }
      else if(e.sw!=='out') a=amt*0.5; }
    // the gates: the flood stays until her eye was hit from under the water; she cannot fall until she was stranded
    if(e.bph===1&&e.eyeHits<byDiff(1,2,3)){ const b=a; a=m3Floor(e,a,o,0.31); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Dive, and hit her eye when she lunges out of a window!','Dive! Hit her eye!'),'#ffd27a',13); } }
    if(e.bph===2&&(e.strands||0)<byDiff(1,2,2)){ const b=a; a=m3Floor(e,a,o,0.04); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Strand her! Drain the room while she is out of a window!','Turn a valve when she is out!'),'#ffd27a',13); } }
    return a; },
  draw3d:m3FigOctavia, draw2d:m3Octavia2,
  sheet:c1Sheet([{state:'chase',mode:'swim',sw:'lurk',label:'swim'},{state:'chase',mode:'swim',sw:'lurk',dx:80,label:'moving'},{state:'windup',mode:'swim',sw:'eye',label:'eye glows'},{state:'strike',mode:'swim',sw:'lunge',dx:500,label:'lunge'},{state:'open',mode:'swim',sw:'out',label:'out (eye open)'},{state:'stuck',mode:'strand',label:'stranded'},{state:'chase',mode:'swim',deathT:0.3,label:'death'}])});
function m3FigOctavia(e,fl){
  if(e.mode==='wall'||(e.mode==null&&e.m3room)){ e._t3top=e.y-40; return; }
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/50, face=t3Turn(e,e.face,st==='strike'?14:5), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const sk=fl?'#ffffff':foT(e,'#7a4ab0'), skD=foT(e,'#56308a'), skL=foT(e,'#a274d8'), dot='#f8d0ff', eye='#ffcf3a', dead=foDeath(e), hurt=m3Hurt(e);
  const strand=e.mode==='strand'||st==='stuck', lunge=st==='strike', open=st==='open', wind=st==='windup';
  const P=foEase(e,'_foc',foTg(lunge?1:0,open?1:0,strand?1:0,wind?1:0),dt,lunge?18:7); const L1=P[0], O1=P[1], S1=P[2], W1=P[3];
  const z=strand?0:4+Math.sin(t*1.6)*3;
  foShadow(fx,fy,40*k,0.25);
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,20,0,dead*0.8,0,0,0,-dead*8); else if(S1>0.01) foSet(FOB,20,0,Math.sin(t*7)*0.2*S1,Math.sin(t*5)*0.15*S1,0,0,-S1*4);
  // eight arms round the base (splayed when stranded, swept back in the lunge), one curled up holding her moon lamp
  foLow();
  for(let i=0;i<8;i++){ const a=i/8*TAU+0.2, sw=Math.sin(t*2.4+i*1.3)*0.25, spread=1+S1*0.5-L1*0.35, ax=Math.cos(a)*16, ay=Math.sin(a)*16, back=L1*-18;
    const mx=Math.cos(a+sw)*34*spread+back*0.5, my=Math.sin(a+sw)*34*spread, ex=Math.cos(a+sw*2)*50*spread+back, ey=Math.sin(a+sw*2)*50*spread, ez=3+Math.sin(t*3+i)*2;
    foL(ax,ay,12,mx,my,7,7,sk,5); foL(mx,my,7,ex,ey,ez,5,skL,2.2); foD(mx,my,8.5,2,dot,0.02); }
  foUp(); foSet(FOA,24,-0.15-hurt*0.2+L1*0.35+W1*0.1,0,0);
  foE(-6,0,40,34,30,26+S1*-4,sk); foE(-14,0,52,22,20,14,skL,0,0,0,0.01);
  for(let i=0;i<9;i++){ const a=i*2.3, rr=18+((i*7)%9); foD(-10+Math.cos(a)*rr*0.6,Math.sin(a)*rr,44+Math.cos(a*1.7)*10,2.2,dot,0.03); }
  foE(10,0,24,18,22,14,skD,0,0,0,-0.01);
  for(const sd of [-1,1]){ const ex=22, ey=sd*13, ez=30; foE(ex,ey,ez,6,7,7,'#f4ecd8'); foD(ex+5.5,ey,ez+0.5,4.8,O1>0.3||W1>0.3?'#ffdf5a':eye,0.04); foD(ex+6.2,ey,ez+0.5,strand?3.4:1.4,'#2a1408',0.05); foD(ex+6.4,ey-1.4,ez+2.4,0.9,'#ffffff',0.06); }
  if(O1>0.3) foGlow(26,0,30,30,'255,210,80',0.5*O1,false);
  // the lure: one arm curls up and forward, a moon lamp at its tip
  { const lx=24+Math.sin(t*1.7)*6, ly=-22, lz=58+Math.sin(t*2.2)*4; foL(6,-16,30,lx-8,ly,lz-8,4,sk,2.2); foL(lx-8,ly,lz-8,lx,ly,lz,2.2,skL,1.4); foB(lx+2,ly,lz+3,5,'#eef4ff'); foGlow(lx+2,ly,lz+3,26,'200,225,255',0.7,false); }
  foEnd(30); e._t3top=foTop(fy,82,k,z);
}
function m3Octavia2(e,fl){
  if(e.mode==='wall') return; const x=e.x, y=e.y-20, r=e.r, t=e.t||0; ctx.save(); c1Shadow2(e,1.2);
  ctx.lineCap='round'; for(let i=0;i<8;i++){ const a=i/8*TAU+Math.sin(t*2+i)*0.2; ctx.strokeStyle=C1OL(); ctx.lineWidth=11; ctx.beginPath(); ctx.moveTo(x,y+10); ctx.quadraticCurveTo(x+Math.cos(a)*r*0.9,y+10+Math.sin(a)*r*0.6,x+Math.cos(a+0.3)*r*1.5,y+12+Math.sin(a+0.3)*r); ctx.stroke(); ctx.strokeStyle='#8a5ac0'; ctx.lineWidth=7; ctx.stroke(); }
  c1E2(x,y-6,r*0.75,r*0.68,fl?'#fff':'#7a4ab0',0,2.4); for(const s of [-1,1]){ ctx.fillStyle='#f4ecd8'; ctx.beginPath(); ctx.arc(x+s*14,y+2,8,0,TAU); ctx.fill(); ctx.fillStyle=e.sw==='out'?'#ffdf5a':'#ffcf3a'; ctx.beginPath(); ctx.arc(x+s*14,y+3,6,0,TAU); ctx.fill(); ctx.fillStyle='#2a1408'; ctx.fillRect(x+s*14-1,y-2,2,9); }
  ctx.fillStyle='#eef4ff'; ctx.beginPath(); ctx.arc(x-r*0.6,y-r*0.9,6,0,TAU); ctx.fill(); ctx.restore();
}

// ================= 6. Baron Puffington (m_puffington), outdoors at the Sunken Gate (boss site m_puff, stage m_reef)
// Phase 1, the Cork: puffed up and stuck in the arch under the Reefwall (his spiky front takes x0.1). A fan of spines;
// the Big Suck: his cheeks swell and his mouth glows (1.2 s) and he pulls Ash in (caught: gulp, spit). THE TRICK: throw a
// Blast Bomb while he inhales (he sucks it in): BOOM, a hiccup, dazed 3 s (mouth x2). Two bombs on Easy, three else, and
// he pops out of the arch like a cork. Without bombs this phase cannot end.
// Phase 2, Unpuffed: small, fast, under the water. DIVE after him: Zoom (a red line, then he pants 1.5 s: hit him), Puff
// Up when Ash comes close (a spiky ring: swim away, hit him when he deflates). Gate: 3 / 4 / 5 hits from a diving Ash.
// Phase 3, Beach Ball: he bounces onto the sandbank (an orange circle, then a shock ring to jump). POUND BACK: a Ground
// Pound within 0.4 / 0.25 / 0.25 s of his landing flips him belly up, 5 s, x2. Gate: 1 / 2 / 2 flips before he falls.
// Two Crab Pirates ("my staff") fight in phases 1 and 3. Bubble vents round the sandbank give air.
// (reefX: in the water he stays west of the Reefwall; the arch under it is his to plug, not to swim through)
const M3PUFF={reefX:6050,site:{x:5850,y:65600},sb:{x:5850,y:65600,r:220},arch:{x:6250,y:65600},ps:{x:6178,y:65600},fake:false,vents:[[5850,65250],[5520,65640],[5880,65960]]};
// while Moonfall is still the placeholder map, the Gate is made here so the fight works: a basin of deep sea with the
// sandbank in it (x3_world's real map has both)
try{ const M=MAPS[3]; if(M&&M.placeholder){ const Z=tzOf(M); Z.lakes.push({x:5990,y:65600,r:640,amp:20}); Z.isles.push({x:M3PUFF.sb.x,y:M3PUFF.sb.y,r:M3PUFF.sb.r}); M3PUFF.fake=true; } }catch(err){ console.error(err); }
c1Lines('m_puffington','m_puffington_intro','m_puffington_outro',
  [['narr',S('Under the Reefwall, in the green dark, the arch of the Sunken Gate is plugged. Completely. By a pufferfish. A spiky, spotty, yellow pufferfish the size of a cottage, with a tiny captain\'s hat and a magnificent whiskery moustache.','A huge spiky pufferfish is stuck in the gate. He has a tiny hat and a big moustache.')],
   ['m_puffington',S('HALT! Who goes there? State your business! Pay the toll! Admire my moustache!','HALT! Pay the toll! Look at my moustache!')],
   ['ash',S('Are you... stuck in the gate?','Are you stuck in the gate?')],
   ['m_puffington',S("STUCK? I'm not STUCK. I'm GUARDING. I am Baron Puffington, Keeper of the Sunken Gate, and I puff up like this on PURPOSE.",'I am not stuck! I am GUARDING. I am Baron Puffington!')],
   ['ash',S('How long have you been puffed up?','How long have you been puffed up?')],
   ['m_puffington',S('...Since Tuesday.','Since Tuesday.')],
   ['m_puffington',S("The toll is one pie! A fish pie! ...No. Not fish. Never mind. The toll is EVERYTHING! Crabs! Get him!",'The toll is EVERYTHING! Crabs, get him!')]],
  [['narr',S('With a long, sad PFFFFFFFFT, Baron Puffington goes down like a balloon. He is now a normal-sized pufferfish. His moustache is still enormous.','PFFFT! He goes down like a balloon. His moustache is still huge.')],
   ['m_puffington',S("Fine! FINE! The gate's open. I was getting a cramp anyway. Do you know how hard it is to hold your breath since Tuesday?",'Fine! The gate is open. I held my breath since Tuesday!')],
   ['ash',S('Maybe just... don\'t puff up in doorways?','Maybe do not puff up in doorways?')],
   ['m_puffington',S("...That's actually very good advice. I shall write it on my hat.",'Good advice. I will write it on my hat.')],
   ['narr',S('The Baron swims off into the deep with tremendous dignity, and bumps into a rock.','He swims off proudly. He bumps into a rock.')],
   ['iska',S('Swim through, Ash. The Glass Desert is on the other side.','Swim through, Ash. The desert is on the other side.')]]);
function m3PuffMouth(e){ const k=e.puffed?1:0.4; return {x:e.x+Math.cos(e.face)*e.r*0.85,y:e.y+Math.sin(e.face)*e.r*0.85-8*k,r:e.puffed?24:12}; }
M3HC.m_puffington=e=>{ const L=e._hc||(e._hc=[{},{}]); let n=0, M=m3PuffMouth(e);
  m3HS(L,n++,{x:e.x,y:e.y,r:e.r*0.95,m:e.puffed&&e.mode==='cork'&&!(e.dazeT>0)?0.1:1});
  if(e.mode==='cork'&&(e.state==='inhale'||e.dazeT>0)) m3HS(L,n++,{x:M.x,y:M.y,r:M.r+6,m:e.dazeT>0?2:1.5});
  L.length=n; return L; };
function m3PuffSize(e,puffed){ e.puffed=puffed; e.r=puffed?(e.bombsIn?70-e.bombsIn*5:70):26; }
function m3PuffDeep(x,y){ return typeof p4DeepAt==='function'?p4DeepAt(x,y):fkWet(x,y); }
function m3PuffAI(e,dt,p){
  p=p||player; const D0=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), S0=M3PUFF.sb; e.dx=e.dy=0; e.noClip=true;
  if(!e.mode){ e.mode='cork'; m3PuffSize(e,true); e.x=M3PUFF.ps.x; e.y=M3PUFF.ps.y; e.face=Math.PI; e.cd=1.6; }
  if(e.dazeT>0){ e.dazeT-=dt; e.state='dizzy'; e.st=0.2; e.tele=null; if(e.dazeT<=0){ e.state='recover'; e.st=0.4; if((e.bombsIn||0)>=byDiff(2,3,3)) m3PuffPop(e); } return; }
  if(e.mode==='cork') return m3PuffCork(e,dt,p,d,a);
  if(e.mode==='swim') return m3PuffSwim(e,dt,p,d,a);
  return m3PuffBall(e,dt,p,d,a);
}
// ---- phase 1: the cork
function m3PuffCork(e,dt,p,d,a){
  const D0=foeDiff(); e.x=M3PUFF.ps.x; e.y=M3PUFF.ps.y; e.face=turnTo(e.face,a,1.2*dt); e.sub=false;
  if(e.state==='inhale'){ e.st-=dt; const M=m3PuffMouth(e);
    // the suck: Ash (not under the sand or water) and every bomb in front of him are pulled toward the mouth
    if(!p.dead&&!m3Bur()&&d<560&&Math.abs(angDiff(e.face,a))<1.2){ const k=Math.min(d-40,byDiff(80,120,150)*dt), ang=angTo(p.x,p.y,M.x,M.y), nx=p.x+Math.cos(ang)*k, ny=p.y+Math.sin(ang)*k; if(!playerBlocked(nx,ny)){ p.x=nx; p.y=ny; } }
    for(const b of G.wproj){ if(b.k!=='bomb'||b.dead) continue; const bd=dist(b.x,b.y,M.x,M.y); if(bd>460||Math.abs(angDiff(e.face,angTo(e.x,e.y,b.x,b.y)))>1.1) continue;
      const ang=angTo(b.x,b.y,M.x,M.y), sp=Math.min(bd,420*dt); b.x+=Math.cos(ang)*sp; b.y+=Math.sin(ang)*sp; b.z=Math.max(b.z||0,14); b.vz=0; b.st='fly'; b.fuse=Math.max(b.fuse,0.3);
      if(bd<M.r+18){ b.dead=true; m3PuffBomb(e); } }
    if(Math.random()<dt*30){ const r=rand(80,360), an=e.face+rand(-0.8,0.8); emit(M.x+Math.cos(an)*r,M.y+Math.sin(an)*r,1,{col:'220,240,255',glow:false,ang:an+Math.PI,spread:0.1,smin:r*1.6,smax:r*2,lmin:.35,lmax:.5,zmin:1,zmax:2}); }
    if(!p.dead&&dist(p.x,p.y,M.x,M.y)<M.r+p.r+18&&!(e._gulpT>G.time)){ e._gulpT=G.time+2; m3PuffGulp(e); }
    if(e.st<=0){ e.state='recover'; e.st=0.6; e.cd=byDiff(2,1.6,1.3); } return; }
  if(e.state==='recover'){ e.st-=dt; if(e.st<=0) e.state='chase'; return; }
  if(e.mv){ e.mv.t+=dt; if(e.mv.o.impl.tick(e,dt,d,a,e.mv)){ e.mv=null; e.tele=null; e.state='recover'; e.st=0.5; } return; }   // a spine volley (the kit's shoot move)
  e.state='chase'; e.cd-=dt*D0.cdK; if(e.cd>0) return;
  if(!(e._sukT>G.time)&&(Math.random()<0.55||(e._sukN||0)<1)){ e._sukT=G.time+byDiff(4.5,3.8,3.2); e._sukN=(e._sukN||0)+1; e.state='inhale'; e.st=byDiff(1.6,1.2,1.1); SFX.play('warn'); m3Say(e,'m_puffington',S('HHHHHNNNNG!','HHNNNG!'),6);
    m3Tip('puffbomb',S('His mouth is open!','Bomb his mouth!'),S('While he breathes in, throw a Blast Bomb. He will suck it right in!','Throw a bomb while he breathes in!')); return; }
  // the spine volley: a cone telegraph, then five spines across the basin
  e.cd=byDiff(2.2,1.7,1.4); e.mv={o:M3PUFFSPINE,t:0,s:''}; M3PUFFSPINE.impl.start(e,e.mv,d,a); e.mv.s=e.mv.ws=e.state;
}
const M3PUFFSPINE=fkSpec({k:'shoot',st:'cast',mode:'spread',n:5,spread:0.22,spd:430,kind:'bolt',r:7,dmgN:24,windup:0.6,tele:{shape:'cone',len:420,half:0.55,col:M3COL.orange}});
function m3PuffBomb(e){ e.bombsIn=(e.bombsIn||0)+1; e.state='dizzy'; e.dazeT=3; e.mv=null; e.tele=null; m3PuffSize(e,true); const M=m3PuffMouth(e);
  shake(12); SFX.play('boom'); flashA=Math.max(flashA,0.2); flashCol='255,220,150'; emit(M.x,M.y,30,{kind:'fire',smin:60,smax:260,lmin:.3,lmax:.6,zmin:3,zmax:6,grow:8});
  fzAdd('m3bubble',{x:e.x-60,y:e.y-40,life:2.4}); damageEnemy(e,wPower()*3.2,{src:'bomb',mult:2,fx:M.x,fy:M.y});
  m3Txt(e,S('*HIC!*','HIC!'),'#ffe066',20); m3Say(e,'m_puffington',S('Pffffft. That was NOT a pie.','That was not a pie!'),3); m3Ev('bombmouth'); }
FZK.m3bubble={ drawG(){}, tall(z,list){ if(!z.it) z.it={flying:true,draw:()=>{ const u=z.t/z.life, r=40+u*90, y=z.y-u*160; ctx.save(); ctx.globalAlpha=1-u; ctx.strokeStyle='rgba(240,250,255,.95)'; ctx.fillStyle='rgba(200,235,255,.25)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(z.x,y,r,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(z.x-r*0.35,y-r*0.4,r*0.22,r*0.12,-0.5,0,TAU); ctx.fill(); ctx.restore(); }}; z.it.x=z.x; z.it.y=z.y; list.push(z.it); } };
function m3PuffGulp(e){ const p=player, S0=M3PUFF.sb; if(!hurtPlayer(m3Dmg(e,28),e.x,e.y,0)) return; ftext(p.x,p.y-40,S('GULP! ...PTOO!','GULP! PTOO!'),'#ffe0b0',16); shake(8);
  const a=angTo(S0.x,S0.y,e.x,e.y)+rand(-0.6,0.6); p.x=S0.x+Math.cos(a)*S0.r*0.5; p.y=S0.y+Math.sin(a)*S0.r*0.5; p.kvx=p.kvy=0; m3Ev('gulp'); }
function m3PuffPop(e){ e.mode='swim'; m3PuffSize(e,false); e.x=M3PUFF.ps.x-110; e.y=M3PUFF.ps.y; e.state='recover'; e.st=1; e.swA=0; m3PhaseTo(e,0.649);
  shake(14); SFX.play('boom'); m3Txt(e,S('POP!','POP!'),'#ffe066',26); emit(e.x,e.y,40,{col:'230,210,140',smin:60,smax:300,lmin:.3,lmax:.8,zmin:2,zmax:5}); m3Say(e,'m_puffington',S('You popped my DIGNITY!','My DIGNITY!'),2); }
// ---- phase 2: under the water
function m3PuffSwim(e,dt,p,d,a){
  const D0=foeDiff(), S0=M3PUFF.sb; e.sub=true; e.alpha=m3Dive()?1:0.5;
  const inW=m3PuffDeep(p.x,p.y)||m3Dive();
  switch(e.state){
    case 'zoomW': e.st-=dt; if(e.st>0.12) e.face=turnTo(e.face,a,5*dt); if(e.st<=0){ e.tele=null; e.state='zoom'; e.st=0.45; e.hitP=false; SFX.play('roll'); } return;
    case 'zoom': { const s=880*D0.spd, nx=e.x+Math.cos(e.face)*s*dt, ny=e.y+Math.sin(e.face)*s*dt; if(m3PuffDeep(nx,ny)&&nx<M3PUFF.reefX){ e.x=nx; e.y=ny; } else e.st=0;
      if(!e.hitP&&d<e.r+p.r+8&&!m3Up()){ if(hurtPlayer(m3Dmg(e,32),e.x,e.y,300)) e.hitP=true; } e.st-=dt; if(e.st<=0){ e.state='dizzy'; e.st=byDiff(2,1.5,1.2); m3Txt(e,S('Puff... puff...','Puff...'),'#ffe8b0',12); } return; }
    case 'puffW': e.st-=dt; if(e.st<=0){ e.tele=null; m3PuffSize(e,true); e.state='spiky'; e.st=2; shake(5); SFX.play('pop'); if(d<e.r+p.r+20) hurtPlayer(m3Dmg(e,32),e.x,e.y,360); } return;
    case 'spiky': e.st-=dt; if(d<e.r+p.r+4&&!(e._spkT>G.time)){ e._spkT=G.time+0.8; hurtPlayer(m3Dmg(e,20),e.x,e.y,320); } if(e.st<=0){ m3PuffSize(e,false); e.state='dizzy'; e.st=byDiff(1.6,1.2,1); m3Txt(e,S('Pffft. Deflated.','Pffft.'),'#ffe8b0',12); } return;
    case 'spit': e.st-=dt; e.face=turnTo(e.face,a,4*dt); if(e.st<=0){ e.tele=null; for(let i=0;i<3;i++) shoot(e.x,e.y,a+(i-1)*0.2,360,6,m3Dmg(e,18),'bolt','enemy',{life:1.6}); e.state='recover'; e.st=0.5; } return;
    case 'dizzy': case 'recover': e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=byDiff(1.2,0.9,0.7); } return;
  }
  e.state='chase';
  // swim round the sandbank in the deep water, closer to Ash when he is in the water too
  e.swA=(e.swA||angTo(S0.x,S0.y,e.x,e.y))+dt*0.9*(e.orbitDir||1); const R=S0.r+120+Math.sin(G.time*0.7)*40;
  let tx=inW?p.x+Math.cos(e.swA)*150:S0.x+Math.cos(e.swA)*R, ty=inW?p.y+Math.sin(e.swA)*150:S0.y+Math.sin(e.swA)*R;
  const sp=e.speed*D0.spd, ang=angTo(e.x,e.y,tx,ty), nx=e.x+Math.cos(ang)*sp*dt, ny=e.y+Math.sin(ang)*sp*dt;
  if(m3PuffDeep(nx,ny)&&dist(nx,ny,M3PUFF.site.x,M3PUFF.site.y)<440&&nx<M3PUFF.reefX){ e.x=nx; e.y=ny; e.face=turnTo(e.face,ang,6*dt); } else e.orbitDir=-(e.orbitDir||1);
  e.cd-=dt*D0.cdK; if(e.cd>0) return;
  if(inW&&d<120){ e.state='puffW'; e.st=0.6; e.tele=newTele({shape:'circle',r:90,dur:e.st,col:M3COL.orange}); return; }
  if(inW&&d<420){ e.state='zoomW'; e.st=0.5; e.face=a; e.tele=newTele({shape:'line',len:400,w:44,dur:e.st,col:M3COL.red}); return; }
  if(!inW&&d<520){ e.state='spit'; e.st=0.6; e.tele=newTele({shape:'cone',len:300,half:0.3,dur:e.st,col:M3COL.orange}); e.cd=byDiff(3.4,2.8,2.2); return; }
  e.cd=0.4;
}
// ---- phase 3: the beach ball
function m3PuffBall(e,dt,p,d,a){
  const D0=foeDiff(), S0=M3PUFF.sb; e.sub=false; e.alpha=1;
  if(e.flipT>0){ e.flipT-=dt; e.state='stuck'; e.st=0.2; e.z=0; if(e.flipT<=0){ e.state='recover'; e.st=0.5; m3PuffSize(e,true); } return; }
  e.flying=e.state==='hop';
  if(e.state==='hop'){ e.st+=dt; const u=clamp(e.st/e.hopT,0,1); e.x=lerp(e.hx0,e.hx1,u); e.y=lerp(e.hy0,e.hy1,u); e.z=Math.sin(u*Math.PI)*e.hopH;
    if(u>=1){ e.z=0; e.flying=false; e.state='landed'; e.st=0.5; e.landAt=G.time; shake(10); SFX.play('boom'); m3SandBurst(e.x,e.y,24);
      if(!p.dead&&!m3Up()&&dist(p.x,p.y,e.x,e.y)<92+p.r*0.5) hurtPlayer(m3Dmg(e,36),e.x,e.y,380);
      m3Wave(e.x,e.y,{dmg:m3Dmg(e,28),max:440,spd:320,thick:18,col:M3COL.orange});
      if(e.tideBomb){ e.tideBomb=false; damageEnemy(e,wPower()*3,{src:'bomb'}); e.state='dizzy'; e.st=2; m3Txt(e,S('The tide bomb goes off!','Boom!'),'#ffe066',15); }
      if(G.time-(M3.lastPound||-9)<m3PuffWin()&&dist(M3.lastPoundX,M3.lastPoundY,e.x,e.y)<210) m3PuffFlip(e); } return; }
  if(e.state==='landed'||e.state==='dizzy'||e.state==='recover'){ e.st-=dt; if(e.st<=0){ e.state='chase'; e.cd=byDiff(1.2,0.8,0.5); } return; }
  e.state='chase'; e.cd-=dt*D0.cdK; if(e.cd>0) return;
  // the next bounce: onto the sandbank, near Ash
  let tx=p.x, ty=p.y; const q=dist(tx,ty,S0.x,S0.y); if(q>S0.r-50){ const an=angTo(S0.x,S0.y,tx,ty); tx=S0.x+Math.cos(an)*(S0.r-50); ty=S0.y+Math.sin(an)*(S0.r-50); }
  e.state='hop'; e.st=0; e.hopT=byDiff(1.0,0.8,0.7); e.hopH=130; e.hx0=e.x; e.hy0=e.y; e.hx1=tx; e.hy1=ty;
  m3Mark({x:tx,y:ty,r:92,dur:e.hopT,col:M3COL.orange}); SFX.play('roll'); m3Say(e,'m_puffington',S('BOING! Mind the moustache!','BOING!'),5);
}
function m3PuffWin(){ return byDiff(0.4,0.25,0.25); }
function m3PuffFlip(e){ e.flipT=byDiff(6,5,4.5); e.flips=(e.flips||0)+1; e.state='stuck'; m3PuffSize(e,false); e.tele=null; m3Txt(e,S('POUND BACK! He flips over!','Flipped!'),'#ffe066',17); m3Say(e,'m_puffington',S('Wheeeeeeee... oof. I am upside down.','I am upside down!'),2); shake(8); m3Ev('poundback'); }
// every Ground Pound: remember it (a pound just before his landing counts too), and flip him if it is right after one
if(typeof p3OnPound==='function') p3OnPound(info=>{ if(info.drum) return; M3.lastPound=G.time; M3.lastPoundX=info.x; M3.lastPoundY=info.y;
  const e=G.boss; if(e&&!e.dead&&e.type==='m_puffington'&&e.mode==='ball'&&e.state==='landed'&&G.time-(e.landAt||-9)<m3PuffWin()&&dist(info.x,info.y,e.x,e.y)<210) m3PuffFlip(e); });
defineFoe('m_puffington',{boss:true,name:'Baron Puffington',title:S('Keeper of the Sunken Gate','Keeper of the gate'),short:'Baron Puffington',
  lv:18,hp:15000,r:70,speed:170,dmg:36,value:1800,swim:true,kbRes:0.2,dcol:'230,200,110',phases:[0.65,0.3],
  phaseText:[[S('Unpuffed!','He is out!'),S('He is small and fast and under the water. DIVE after him. Hit him when he pants or deflates.','Dive after him! Hit him when he is tired.'),['m_puffington',S('Catch me if you can! You cannot!','Catch me!')]],
             [S('Beach Ball!','Beach ball!'),S('He bounces onto the sandbank. Ground Pound just as he lands to flip him over!','Pound just as he lands!'),['m_puffington',S('BOING! BOING! Fear my bounce!','BOING!')]]],
  init(e){ e.mode=null; e.bombsIn=0; e.diveHits=0; e.flips=0; e.leash=99999; },
  onPhase(e,i){ if(i===1&&e.mode==='cork') m3PuffPop(e); if(i===2){ e.mode='ball'; m3PuffSize(e,true); e.state='recover'; e.st=0.6; e.sub=false; e.alpha=1;
      for(let k=0;k<2;k++){ const s=spotNear(M3PUFF.sb.x,M3PUFF.sb.y,40,150); spawnRune('m_crabpirate',s.x,s.y,{aggro:true,level:Math.max(1,fkLevel(e,{})-3)}); } taunt('m_puffington',S('Staff! To me!','Crabs! Help!')); } },
  ai:m3PuffAI,
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.mode==='cork'){ if(h.src==='bomb'&&e.state==='inhale'&&o.fx!=null&&dist(o.fx,o.fy,m3PuffMouth(e).x,m3PuffMouth(e).y)<90){ m3PuffBomb(e); return 0.5; }
      if(o.mult===0.1&&!(e._spT>G.time)){ e._spT=G.time+2; m3Txt(e,S('Ouch, spikes! Bomb his mouth when he breathes in!','Spikes! Bomb his mouth!'),'#ffd27a',13); } }
    else if(e.mode==='swim'){ if(!m3Dive()&&h.src!=='moon'){ a=amt*0.15; if(!(e._dvT>G.time)){ e._dvT=G.time+2.4; m3Txt(e,S('He is under the water! DIVE!','Dive!'),'#bfe8ff',13); } } else { e.diveHits++; if(e.state==='dizzy') a=amt*1.3; } }
    else if(e.mode==='ball'){ if(e.flipT>0) a=amt*2; else if(e.puffed) a=amt*0.4; if(h.src==='bomb'&&G.flags.m_tidebombs&&!e.tideBomb){ e.tideBomb=true; m3Txt(e,S('A tide bomb sticks to him!','It sticks!'),'#bfe8ff',13); } }
    if(e.mode==='cork'&&(e.bombsIn||0)<byDiff(2,3,3)){ const b=a; a=m3Floor(e,a,o,0.66); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('He is too puffed up! Bomb his mouth!','Bomb his mouth!'),'#ffd27a',13); } }
    if(e.bph===1&&e.diveHits<byDiff(3,4,5)){ const b=a; a=m3Floor(e,a,o,0.31); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Dive under the water and get him!','Dive and get him!'),'#ffd27a',13); } }
    if(e.bph===2&&(e.flips||0)<byDiff(1,2,2)){ const b=a; a=m3Floor(e,a,o,0.04); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Ground Pound just as he lands!','Pound when he lands!'),'#ffd27a',13); } }
    return a; },
  draw3d:m3FigPuff, draw2d:m3Puff2,
  sheet:c1Sheet([{state:'chase',puffed:true,mode:'cork',label:'puffed'},{state:'inhale',puffed:true,mode:'cork',label:'big suck'},{state:'cast',puffed:true,mode:'cork',label:'spines'},{state:'dizzy',puffed:true,mode:'cork',dazeT:2,label:'hiccup daze'},
         {state:'chase',r:26,puffed:false,mode:'swim',dx:120,label:'unpuffed'},{state:'dizzy',r:26,puffed:false,mode:'swim',label:'panting'},{state:'hop',puffed:true,mode:'ball',z:60,label:'bounce'},{state:'stuck',r:26,puffed:false,mode:'ball',flipT:2,label:'flipped'},{state:'chase',deathT:0.3,r:26,puffed:false,label:'death'}])});
// the site: the sandbank in the sea before the Reefwall. The fight starts when Ash lands on it or swims close
defineBoss('m_puff',{boss:'m_puffington',at:{x:M3PUFF.site.x,y:M3PUFF.site.y,r:430,name:S('The Sunken Gate','The Sunken Gate'),level:18},stage:'m_reef',guards:[['m_crabpirate',2]],
  open:()=>!G.flags.m_puff_done&&(m3Reached('m_reef')||M3.siteTest==='m_puff'),arena:{shape:'ring',r:470,style:'m_coral',skipBlocked:false,props:M3PUFF.fake?[{k:'m3arch',dx:M3PUFF.arch.x-M3PUFF.site.x,dy:0}]:[]},flyOK:false,music:'boss',
  spawn:()=>({x:M3PUFF.ps.x,y:M3PUFF.ps.y}),
  onStart(){ if(!G.weapons.bombs&&typeof giveWeapon==='function'){ giveWeapon('bombs'); setBanner(S('Blast Bombs!','Bombs!'),S('Mags slipped you a bag of bombs. Throw one into his mouth!','Throw a bomb in his mouth!'),3); }
    if(M3PUFF.fake) for(const [x,y] of M3PUFF.vents) fzAdd('m3vent',{x,y,r:36});
    try{ if(M3.hook.puffStart) M3.hook.puffStart(); }catch(err){ console.error(err); } },
  onWin(){ G.flags.m_puff_done=1; m3Won('m_puffington'); }});
// Mags' bombs run low in a long fight: bomb bubbles float up on the sandbank in phase 1
{ const base=updateEnemies; updateEnemies=function(dt){ base(dt); const e=G.boss; if(!e||e.dead||e.type!=='m_puffington'||e.mode!=='cork'||!G.weapons.bombs) return;
    M3PUFF.refT=(M3PUFF.refT||0)-dt; if(M3PUFF.refT<=0&&bombsN()<2){ M3PUFF.refT=12; const S0=M3PUFF.sb; addBombs(3,S0.x,S0.y); ftext(S0.x,S0.y-30,S('A bubble pops: +3 bombs!','+3 bombs!'),'#ffd0a0',13); } }; }
// coral heads rise from the sea round the fight
ARENA_STY.m_coral=function(g,rng,v){ const out='#3a2233', cols=['#ff8a7a','#ffb070','#f07ab0','#7ad8c8'], c=cols[v%cols.length];
  g.fillStyle='rgba(20,40,60,.25)'; g.beginPath(); g.ellipse(24,55,18,4.5,0,0,TAU); g.fill();
  for(let i=0;i<5;i++){ const x=10+i*7+rng()*3, h=22+rng()*22; g.lineCap='round'; g.strokeStyle=out; g.lineWidth=7; g.beginPath(); g.moveTo(x,54); g.quadraticCurveTo(x+(rng()-0.5)*12,54-h*0.6,x+(rng()-0.5)*8,54-h); g.stroke(); g.strokeStyle=c; g.lineWidth=4.4; g.stroke();
    g.fillStyle=c; g.beginPath(); g.arc(x+(rng()-0.5)*6,54-h,3.4,0,TAU); g.fill(); }
  g.fillStyle='#f4e6c8'; for(let i=0;i<4;i++){ g.beginPath(); g.arc(8+rng()*32,48+rng()*6,1.6,0,TAU); g.fill(); } };
// the arch of the Sunken Gate (drawn only while the placeholder map stands in for the Reefwall)
FZP.m3arch=(A,pr)=>{ const f=c1Sm(pr.h), x=pr.x, y=pr.y; if(f<0.02) return; ctx.save(); ctx.globalAlpha=f; const oc=C1OL();
  ctx.fillStyle=oc; ctx.beginPath(); ctx.moveTo(x-30,y+110); ctx.lineTo(x-30,y-60); ctx.quadraticCurveTo(x+60,y-150,x+150,y-60); ctx.lineTo(x+150,y+110); ctx.lineTo(x+110,y+110); ctx.lineTo(x+110,y-30); ctx.quadraticCurveTo(x+60,y-100,x+10,y-30); ctx.lineTo(x+10,y+110); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#8a7a9a'; ctx.beginPath(); ctx.moveTo(x-25,y+105); ctx.lineTo(x-25,y-58); ctx.quadraticCurveTo(x+60,y-142,x+145,y-58); ctx.lineTo(x+145,y+105); ctx.lineTo(x+115,y+105); ctx.lineTo(x+115,y-32); ctx.quadraticCurveTo(x+60,y-94,x+5,y-32); ctx.lineTo(x+5,y+105); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#f07ab0'; for(let i=0;i<6;i++){ ctx.beginPath(); ctx.arc(x-20+i*30,y-60-Math.sin(i/5*Math.PI)*60,6,0,TAU); ctx.fill(); } ctx.restore(); };
function m3FigPuff(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, puffed=e.puffed!==false&&e.r>40, k=puffed?e.r/70:e.r/26*1.3, face=t3Turn(e,e.face,puffed?4:12), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const sk=fl?'#ffffff':foT(e,'#f0c850'), skD=foT(e,'#c09030'), belly=foT(e,'#fff2c0'), spot='#8a5a2a', dead=foDeath(e), hurt=m3Hurt(e);
  const inhale=st==='inhale'?m3Sm(clamp(inS/0.5,0,1)):0, flip=st==='stuck'||e.flipT>0, dizzy=st==='dizzy', z=(e.z||0)+(puffed?0:4+Math.sin(t*4)*2);
  foShadow(fx,fy,(puffed?60:22)*k,0.3);
  if(puffed){
    foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,30,0,dead*1.2,0,0,0,-dead*10); else foSet(FOB,30,0,dizzy?Math.sin(t*8)*0.12:0,0);
    const R=46*(1+inhale*0.08);
    foB(0,0,40,R,sk); foE(4,0,30,R*0.8,R*0.8,R*0.55,belly,0,0,0,0.01);
    for(let i=0;i<10;i++){ const a=i*2.4, b=0.4+((i*0.37)%1)*1.4; foD(Math.cos(a)*Math.sin(b)*R*0.9,Math.sin(a)*Math.sin(b)*R*0.9,40+Math.cos(b)*R*0.85,4,spot,0.02); }
    for(let i=0;i<16;i++){ const a=i/16*TAU, b=0.6+(i%3)*0.5, ox=Math.cos(a)*Math.sin(b), oy=Math.sin(a)*Math.sin(b), oz=Math.cos(b); foC(ox*R*0.95,oy*R*0.95,40+oz*R*0.95,ox*(R+12),oy*(R+12),40+oz*(R+12),3,skD,0.01); }
    // cheeks swell and the mouth glows while he breathes in
    for(const sd of [-1,1]) foB(R*0.7,sd*R*0.45,32,10+inhale*9,sk,0.02);
    foE(R*0.92,0,28,4+inhale*3,10+inhale*6,6+inhale*7,'#5a1e22',0,0,0,0.04); if(inhale>0.2||e.dazeT>0) foGlow(R*0.95,0,28,28,'255,200,120',0.4+0.4*inhale,false);
    for(const sd of [-1,1]){ foE(R*0.75,sd*R*0.36,52,7,7,8,'#ffffff'); foD(R*0.75+6,sd*R*0.36,52,dizzy?2.4:3.4,'#1a1018',0.05); foD(R*0.75+6.6,sd*R*0.36-1,53.6,1,'#ffffff',0.06); }
    // the magnificent moustache and the tiny captain's hat
    for(const sd of [-1,1]){ foL(R*0.95,sd*3,38,R*0.85,sd*24,34+Math.sin(t*3)*1.5,3.4,'#5a3a1a',1.2); foL(R*0.85,sd*24,34,R*0.7,sd*30,40,1.6,'#5a3a1a',0.6); }
    foY(-4,0,40+R-2,13,11,6,'#2e3f74','#3e5090',0.03); foE(-4,0,40+R+5,15,8,2.4,'#2e3f74',0,0,0,0.03); foD(4,0,40+R+3,2.6,'#ffcf5a',0.05);
    for(const sd of [-1,1]) foQ([0,sd*R*0.9,40, -8,sd*(R+10),46+Math.sin(t*12)*4, -12,sd*(R+6),34],skD,null,0.01);
    foEnd(40); e._t3top=foTop(fy,40+R+12,k,z); return; }
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,8,0,dead*1.4,0,0,0,-dead*4); else if(flip) foSet(FOB,8,0,Math.PI*0.95,Math.sin(t*6)*0.2,0,0,6); else foSet(FOB,8,dizzy?Math.sin(t*6)*0.1:0,0,Math.sin(t*10)*0.06);
  foE(0,0,8,13,11,10,sk); foE(2,0,4.6,10,9,5,belly,0,0,0,0.01); for(let i=0;i<5;i++) foD(-6+i*3,((i*5)%7)-3,15.8,1.4,spot,0.03);
  foQ([-11,0,8, -19,-6,13, -19,6,3],skD,null,0.01); for(const sd of [-1,1]) foQ([2,sd*10,8, -3,sd*15,11+Math.sin(t*18)*3, -5,sd*12,5],skD,null,0.01);
  for(const sd of [-1,1]){ foB(8,sd*5,12,3,'#ffffff'); foD(10.6,sd*5,12,1.5,'#1a1018',0.05); foL(12,sd*1.4,8,11,sd*10,7+Math.sin(t*3),1.4,'#5a3a1a',0.6); }
  foE(13,0,7,1.6,3,2,'#5a1e22',0,0,0,0.04); foY(-1,0,17.5,5,4.2,2.6,'#2e3f74','#3e5090',0.03); foD(2,0,19,1,'#ffcf5a',0.05);
  foEnd(8); e._t3top=foTop(fy,24,k,z);
}
function m3Puff2(e,fl){
  const puffed=e.puffed!==false&&e.r>40, x=e.x, y=e.y-(e.z||0)-(puffed?36:6), r=puffed?e.r*0.7:e.r*0.6, f=e.face; ctx.save(); c1Shadow2(e,puffed?0.9:1.1);
  if(puffed){ ctx.strokeStyle='#c09030'; ctx.lineWidth=3; for(let i=0;i<14;i++){ const a=i/14*TAU; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r); ctx.lineTo(x+Math.cos(a)*(r+12),y+Math.sin(a)*(r+12)); ctx.stroke(); } }
  c1E2(x,y,r,r*(puffed?0.95:0.75),fl?'#fff':'#f0c850',0,2.2); ctx.fillStyle='#8a5a2a'; for(let i=0;i<6;i++){ ctx.beginPath(); ctx.arc(x+Math.cos(i*2.1)*r*0.55,y+Math.sin(i*2.1)*r*0.5,3,0,TAU); ctx.fill(); }
  const mx=x+Math.cos(f)*r*0.8, my=y+Math.sin(f)*r*0.5; ctx.fillStyle=e.state==='inhale'?'#ff9a5a':'#5a1e22'; ctx.beginPath(); ctx.ellipse(mx,my,r*0.18,r*(e.state==='inhale'?0.25:0.12),f,0,TAU); ctx.fill();
  ctx.strokeStyle='#5a3a1a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(mx-r*0.35,my-4); ctx.quadraticCurveTo(mx,my-10,mx+r*0.35,my-4); ctx.stroke();
  c1Eye2(x+Math.cos(f)*r*0.4-r*0.25,y-r*0.3,r*0.12+1,f); c1Eye2(x+Math.cos(f)*r*0.4+r*0.25,y-r*0.3,r*0.12+1,f);
  ctx.fillStyle='#2e3f74'; ctx.fillRect(x-r*0.3,y-r-6,r*0.6,6); ctx.restore();
}

// ================= 7. Gravelgut, the Glass-Eater (m_gravelgut), boss of the Sandworm Burrows (the Gullet Hall)
// Phase 1: he swims under the sand. The sand ripples in a ring under Ash (an orange circle), then he bursts up. Burrow
// to let him pass over. LURE HIM: if he bursts up next to a glass pillar he crunches it, gets a tummy ache and is stunned
// 3 s with his throat glowing (gold, x2). Pillars grow back after 20 s. Gate: 1 / 2 / 2 pillar stuns.
// Phase 2: Glass Spit (a fan of shards) and the Arc Leap (a red line: jump it, or burrow under). BLAZE the sand into a
// glass plate (the blue jet on the sand) and stand on it: if he bursts up through a plate he cracks a tooth (stunned
// 3 s). Gate: 1 / 2 / 2 plate stuns.
// Phase 3: worm lanes cross the hall on a clock, and two Sand Sharks join. He rears up and waits over a mound (a gold
// ring): BURROW under him and POP UP into his belly (x3, a long stagger). Gate: 1 / 2 / 2 belly pops.
c1Lines('m_gravelgut','m_gravelgut_intro','m_burrows_won',
  [['narr',S('The floor of the hall is one deep bowl of sand. Four tall glass pillars stand in it. The sand breathes. Something under it is very, very big.','A bowl of sand. Four glass pillars. Something huge is under the sand.')],
   ['m_gravelgut',S('(a rumble from below) ...Ooooh. My tummy. Is that... a snack? You look crunchy. Glass is crunchy. I like crunchy.','Ooh, my tummy. Are you a snack? You look crunchy.')],
   ['ash',S('I am NOT crunchy. I am a dragon. Dragons are spicy.','I am not crunchy! I am spicy!')]],
  [['narr',S('Gravelgut gives one enormous cough. Something small and bright flies out of his mouth, bounces three times, and rolls to your feet. It glows silver.','Gravelgut coughs. Something bright rolls to your feet.')],
   xdo(()=>{ try{ giveItems({m_mooncrumb:1}); }catch(err){} }),
   ['ash',S('It\'s... a crumb. Of the MOON.','It is a crumb of the MOON!')],
   ['m_gravelgut',S("(a rumble) ...Oof. Oh. Oh, that's better. My tummy. I've had a tummy ache for a month. Why did I eat that?",'Oof. My tummy feels better.')],
   ['iska',S("She spilled it, Ash. Nyxara. She's a messy eater.",'Nyxara dropped it. She is a messy eater.')],
   ['m_gravelgut',S("Thank you, little warm thing. I'm going to lie down for a hundred years.",'Thank you. Now I will sleep for a hundred years.')]]);
M3ROOM.m_gravelgut={
  build(R,A){ const D={R,type:'m_gravelgut',pillars:[]}, rx=(R.x1-R.x0), ry=(R.y1-R.y0);
    for(const [u,v] of [[-0.24,-0.22],[0.24,-0.22],[-0.24,0.24],[0.24,0.24]]){ const P={x:R.cx+u*rx,y:R.cy+v*ry,r:30,up:true,regrow:0,ph:rand(0,6)}; P.col=addAreaCol({t:'c',x:P.x,y:P.y,r:24,deep:true}); Object.defineProperty(P.col,'off',{get:()=>!P.up,configurable:true}); D.pillars.push(P); }
    D.lanes=[[-0.4,-0.08,0.4,-0.3],[-0.4,0.32,0.4,0.06],[-0.02,-0.4,0.12,0.4]].map(([a,b,c,d],i)=>({x0:R.cx+a*rx,y0:R.cy+b*ry,x1:R.cx+c*rx,y1:R.cy+d*ry,ph:i*1.3}));
    return D; },
  reset(D){ for(const P of D.pillars){ P.up=true; P.regrow=0; } },
  tick(D,dt){ for(const P of D.pillars){ P.ph+=dt; if(!P.up){ P.regrow-=dt; if(P.regrow<=0&&dist(player.x,player.y,P.x,P.y)>P.r+player.r+10){ P.up=true; emit(P.x,P.y-20,16,{col:'220,240,255',smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.4,zmax:3}); } } }
    // Blaze on the sand turns it into a glass plate (20 s): the tip of the blue jet, where it touches sand in the hall
    const J=typeof P3!=='undefined'&&P3.jet; if(J&&P3.bz&&P3.bz.blue&&G.boss&&G.boss.type==='m_gravelgut'){ D.jt=(D.jt||0)+dt; if(D.jt>0.22){ D.jt=0;
      for(const f of [0.95,0.7,0.45]){ const x=J.ox+Math.cos(J.ang)*J.L*f, y=J.oy+Math.sin(J.ang)*J.L*f; if(m3OnSand(x,y)&&!m3PlateAt(x,y,20)&&m3In({rect:true,x0:D.R.x0,y0:D.R.y0,x1:D.R.x1,y1:D.R.y1},x,y,30)){ fzAdd('m3plate',{x,y,r:56,life:20}); emit(x,y,12,{col:'230,240,255',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); m3Ev('plate'); if(!G.flags.m3tip_plate) m3Tip('plate',S('A glass plate','Glass!'),S('Blaze turns sand into glass. Stand on it: if he bursts up through glass, he cracks a tooth!','Stand on the glass! He will crack a tooth.')); break; } } } } },
  ground(D,t){ for(const P of D.pillars) if(!P.up){ ctx.save(); ctx.fillStyle='rgba(220,240,255,.5)'; for(let i=0;i<6;i++){ const a=i*1.1; ctx.beginPath(); ctx.arc(P.x+Math.cos(a)*16,P.y+Math.sin(a)*8,4,0,TAU); ctx.fill(); } ctx.restore(); } },
  tall(D,list){ for(const P of D.pillars){ if(!P.up) continue; if(!P.it) P.it={x:P.x,y:P.y,draw:()=>m3DrawPillar(P)}; list.push(P.it); } }
};
function m3DrawPillar(P){ const s=sbSprite('m3glasspillar',44,g=>{ g.fillStyle='rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0,38,22,7,0,0,TAU); g.fill();
    g.fillStyle='#bfe6f4'; g.beginPath(); g.moveTo(-18,38); g.lineTo(-14,-34); g.lineTo(-2,-44); g.lineTo(12,-30); g.lineTo(18,38); g.closePath(); g.fill();
    g.fillStyle='#e8f8ff'; g.beginPath(); g.moveTo(-12,34); g.lineTo(-9,-30); g.lineTo(-3,-38); g.lineTo(-4,34); g.closePath(); g.fill();
    g.fillStyle='#8cc4dc'; g.beginPath(); g.moveTo(6,36); g.lineTo(10,-26); g.lineTo(16,36); g.closePath(); g.fill(); },2.2);
  drawSprite(s,P.x,P.y-38,1,0); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.25+0.15*Math.sin(P.ph*2); ctx.drawImage(foGlowSpr('200,235,255'),P.x-30,P.y-90,60,60); ctx.restore(); }
M3HC.m_gravelgut=e=>{ const L=e._hc||(e._hc=[{},{}]); let n=0; if(e.under) { L.length=0; return L; }
  const k=e.r/56; m3HS(L,n++,{x:e.x,y:e.y,r:e.r,m:e.stuck?1:e.rear?1:0.4});
  if(e.stuck||e.belly) m3HS(L,n++,{x:e.x+Math.cos(e.face)*20*k,y:e.y+Math.sin(e.face)*20*k-30*k,r:22*k,m:2});
  L.length=n; return L; };
function m3GutUnder(e,on){ e.under=on; e.invuln=on; e.sub=on; e.alpha=1; }
function m3GutAI(e,dt,p){
  p=p||player; const D=m3RoomOf(e), D0=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0; e.noClip=true;
  if(e.stuck){ e.stuckT-=dt; e.state='stuck'; e.st=0.2; if(e.stuckT<=0){ e.stuck=false; e.belly=false; e.state='dive'; e.st=0.6; } return; }
  switch(e.state){
    case 'ripple': e.st-=dt; if(e.st<=0){ e.tele=null; e.x=e.tx; e.y=e.ty; m3GutBurst(e,D); } else { const k=Math.min(1,dt*6); e.x=lerp(e.x,e.tx,k); e.y=lerp(e.y,e.ty,k); } return;
    case 'up': e.st-=dt; e.face=turnTo(e.face,a,2.5*dt);
      if(e.bph>=1&&!e.spat&&e.st<1.1){ e.spat=true; m3GutSpit(e); }
      if(e.st<=0){ e.state='dive'; e.st=0.6; } return;
    case 'spitW': e.st-=dt; e.face=turnTo(e.face,a,3*dt); if(e.st<=0){ e.tele=null; for(let i=0;i<5;i++) shoot(e.x+Math.cos(e.face)*40,e.y+Math.sin(e.face)*40-20,e.face+(i-2)*0.2,400,7,m3Dmg(e,26),'ice','enemy',{life:1.5}); SFX.play('cast'); e.state='up'; e.st=0.8; } return;
    case 'dive': e.st-=dt; if(e.st<=0){ m3GutUnder(e,true); e.state='chase'; e.cd=byDiff(1.6,1.2,0.9); m3SandBurst(e.x,e.y,16); } return;
    case 'leapW': e.st-=dt; if(e.st>0.15) e.face=turnTo(e.face,a,3*dt); if(e.st<=0){ e.tele=null; m3GutUnder(e,false); e.state='leap'; e.st=0; e.lx0=e.x; e.ly0=e.y; e.lx1=e.x+Math.cos(e.face)*520; e.ly1=e.y+Math.sin(e.face)*520; const C=m3Ctx(e); const q={x:e.lx1,y:e.ly1}; m3Hold(C,q,80); e.lx1=q.x; e.ly1=q.y; e.hitP=false; m3SandBurst(e.x,e.y,24); SFX.play('roll'); } return;
    case 'leap': { e.st+=dt; const T=0.9, u=clamp(e.st/T,0,1); e.x=lerp(e.lx0,e.lx1,u); e.y=lerp(e.ly0,e.ly1,u); e.z=Math.sin(u*Math.PI)*120;
      if(!e.hitP&&!m3Bur()&&!(m3Up()&&player.z>18)&&segD(p.x,p.y,e.lx0,e.ly0,e.x,e.y)<46&&dist(p.x,p.y,e.x,e.y)<70){ if(hurtPlayer(m3Dmg(e,44),e.x,e.y,360)) e.hitP=true; }
      if(u>=1){ e.z=0; m3SandBurst(e.x,e.y,24); shake(8); SFX.play('boom'); m3GutUnder(e,true); e.state='chase'; e.cd=byDiff(1.4,1,0.8); } return; }
    case 'rear': e.st-=dt; e.face=turnTo(e.face,a,1.5*dt); if(e.st<=0){ e.rear=false; e.state='dive'; e.st=0.6; } return;
  }
  // under the sand: he swims toward Ash (a moving mound); a burrowing Ash he can only feel, not find
  if(!e.under){ m3GutUnder(e,true); }
  e.state='chase'; const tx=m3Bur()?e.homeX:p.x, ty=m3Bur()?e.homeY:p.y; steer(e,tx,ty,e.speed*D0.spd*(d>200?1:0.6)); if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),4*dt);
  if(Math.random()<dt*16) emit(e.x+rand(-30,30),e.y+rand(-20,20),1,{col:M3COL.sand,glow:false,smin:20,smax:80,lmin:.3,lmax:.6,zmin:1.4,zmax:2.6,drag:3});
  e.cd-=dt*D0.cdK; if(e.cd>0) return;
  if(e.bph>=2&&!(e._rearT>G.time)&&Math.random()<0.45){ e._rearT=G.time+byDiff(7,6,5); m3GutRear(e,D,p); return; }
  if(e.bph>=1&&Math.random()<0.3&&d<520){ e.state='leapW'; e.st=0.8; e.face=a; e.tele=newTele({shape:'line',len:520,w:70,dur:e.st,col:M3COL.red}); return; }
  // the ripple ring under Ash, then the burst (the ring stays where it started: step out of it, or burrow)
  e.tx=p.x; e.ty=p.y; e.state='ripple'; e.st=byDiff(1.3,1.0,0.85); e.tele=null; m3Mark({x:e.tx,y:e.ty,r:92,dur:e.st,col:M3COL.orange}); SFX.play('warn');
}
function m3GutBurst(e,D){
  const p=player; m3GutUnder(e,false); e.state='up'; e.st=byDiff(2.2,1.7,1.4); e.spat=false; shake(10); SFX.play('boom'); m3SandBurst(e.x,e.y,30); G.rings.push({x:e.x,y:e.y,rad:e.r,max:200,speed:480,thick:16,dmg:0,kb:260});
  if(!p.dead&&!m3Up()&&dist(p.x,p.y,e.x,e.y)<92+p.r*0.5) hurtPlayer(m3Dmg(e,40),e.x,e.y,420);
  // next to a glass pillar he crunches it; through a glass plate he cracks a tooth: both stun him with his throat open
  if(D) for(const P of D.pillars) if(P.up&&dist(P.x,P.y,e.x,e.y)<P.r+e.r+30){ P.up=false; P.regrow=20; emit(P.x,P.y-30,30,{col:'220,240,255',smin:60,smax:240,lmin:.3,lmax:.7,zmin:1.2,zmax:2.6,drag:2}); SFX.play('block');
    e.pillarStuns=(e.pillarStuns||0)+1; m3GutStun(e,byDiff(4,3,2.6),S('CRUNCH! Ow, my tummy! Hit his throat!','CRUNCH! Hit his throat!')); m3Say(e,'m_gravelgut',S('Mmmf! Crunchy! ...Ow. Ow ow ow.','Crunchy! Ow!'),3); m3Ev('pillar'); return; }
  const pl=m3PlateAt(e.x,e.y,e.r*0.5); if(pl){ pl.crack=true; pl.life=Math.min(pl.life,pl.t+1.2); e.plateStuns=(e.plateStuns||0)+1; m3GutStun(e,byDiff(4,3,2.6),S('CLINK! He cracked a tooth!','He cracked a tooth!')); m3Say(e,'m_gravelgut',S('MY TOOF!','My toof!'),3); m3Ev('platestun'); }
}
function m3GutStun(e,t,txt){ e.stuck=true; e.stuckT=t; e.state='stuck'; e.tele=null; e.mv=null; m3Txt(e,txt,'#ffe066',16); shake(8); }
function m3GutSpit(e){ e.state='spitW'; e.st=0.6; e.tele=newTele({shape:'cone',len:420,half:0.5,dur:e.st,col:M3COL.silver}); }
function m3GutRear(e,D,p){ const C=m3Ctx(e), q={x:p.x+rand(-120,120),y:p.y+rand(-90,90)}; m3Hold(C,q,120); e.x=q.x; e.y=q.y; m3GutUnder(e,false); e.state='rear'; e.rear=true; e.st=byDiff(4.5,3.6,3); m3SandBurst(e.x,e.y,26); shake(6);
  fzAdd('c1mark',{x:e.x,y:e.y,r:70,dur:e.st,col:M3COL.gold,sparkle:true}); m3Txt(e,S('He rears up! Burrow under him and pop up!','Burrow under him! Pop up!'),'#ffd27a',14);
  m3Tip('belly',S('Pop up into his belly!','Pop up!'),S('While he rears up, burrow in the sand, go under him, and pop up.','Burrow under him, then pop up!')); }
defineFoe('m_gravelgut',{boss:true,name:'Gravelgut',title:S('the Glass-Eater','the glass eater'),short:'Gravelgut',
  lv:19,hp:18000,r:56,speed:190,dmg:40,value:2000,kbRes:0,dcol:'210,180,120',phases:[0.65,0.3],
  phaseText:[[S('Glass Spit!','Glass spit!'),S('He spits glass and leaps. BLAZE the sand into glass and stand on it: he will crack a tooth!','Blaze the sand into glass! Stand on it!'),['m_gravelgut',S('Hrrrk. Have some of my crunchies!','Have some crunchies!')]],
             [S('The Coil!','The worm lanes!'),S('Worms cross the hall. When he rears up, BURROW under him and POP UP into his belly!','Burrow under him and pop up!'),['m_gravelgut',S('Everybody out of the sand! Except me!','Everybody out!')]]],
  init(e){ m3BossInit(e); m3GutUnder(e,true); e.state='chase'; e.cd=1.6; e.pillarStuns=0; e.plateStuns=0; e.pops=0;
    e.onPop=q=>{ if(q.rear){ q.rear=false; q.pops=(q.pops||0)+1; q.belly=true; m3GutStun(q,byDiff(5,4,3.4),S('POP! Right in the belly!','POP! His belly!')); damageEnemy(q,wPower()*4.5,{src:'pop',mult:1}); m3Say(q,'m_gravelgut',S('OOF! That tickles! Owww!','OOF!'),2); m3Ev('bellypop'); } }; },
  onPhase(e,i){ const D=m3RoomOf(e); if(i===2&&D){ for(const L of D.lanes) fzAdd('m3lane',{x0:L.x0,y0:L.y0,x1:L.x1,y1:L.y1,clock:byDiff(6,4,3.4),c:L.ph,wait:2,plate:true,e,R:D.R}); for(let k=0;k<2;k++){ const s=spotNear(D.R.cx,D.R.cy,200,320); spawnRune('m_sandshark',s.x,s.y,{aggro:true,level:Math.max(1,fkLevel(e,{})-4)}); } } },
  ai:m3GutAI,
  onHurt(e,amt,o){ let a=amt; if(e.under) return false;
    if(!e.stuck&&!e.rear&&o.mult!==2&&!(e._amT>G.time)){ e._amT=G.time+2.5; m3Txt(e,S('His sand armour is tough! Make him crunch glass!','Tough! Make him crunch glass!'),'#e8d8b0',12); }
    if(e.bph===0&&(e.pillarStuns||0)<byDiff(1,2,2)){ const b=a; a=m3Floor(e,a,o,0.66); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Stand by a glass pillar so he bursts up into it!','Stand by a glass pillar!'),'#ffd27a',13); } }
    if(e.bph===1&&(e.plateStuns||0)<byDiff(1,2,2)){ const b=a; a=m3Floor(e,a,o,0.31); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Blaze the sand into glass and stand on it!','Blaze the sand! Stand on the glass!'),'#ffd27a',13); } }
    if(e.bph===2&&(e.pops||0)<byDiff(1,2,2)){ const b=a; a=m3Floor(e,a,o,0.04); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Burrow under him when he rears up, then pop up!','Burrow under him! Pop up!'),'#ffd27a',13); } }
    return a; },
  draw3d:m3FigGut, draw2d:m3Gut2,
  sheet:c1Sheet([{state:'chase',under:true,label:'under the sand'},{state:'up',label:'up'},{state:'spitW',st:0.3,label:'glass spit'},{state:'stuck',stuck:true,label:'tummy ache'},{state:'rear',rear:true,label:'rearing'},{state:'leap',z:90,label:'arc leap'},{state:'chase',deathT:0.3,label:'death'}])});
// under the sand: a long mound with a sand wake (and his glowing belly passing over a burrowing Ash)
function m3DrawGutUnder(e,fl){ const g=foG(), x=e.x, y=e.y, f=e.face, t=e.t||0, c=Math.cos(f), s=Math.sin(f); g.save();
  // a long furrow of churned sand, then humps of sand rolling along it (the back of a very big worm), front hump biggest
  g.fillStyle='rgba(120,86,40,.3)'; g.beginPath(); g.ellipse(x-c*50,y-s*50*0.6+6,96,40,Math.atan2(s*0.6,c),0,TAU); g.fill();
  for(let i=4;i>=0;i--){ const bx=x-c*i*26, by=y-s*i*16+Math.sin(t*6-i*0.9)*2, r=34-i*3.4, h=r*(0.55+0.12*Math.sin(t*7-i));
    g.fillStyle='rgba(90,60,28,.35)'; g.beginPath(); g.ellipse(bx,by+4,r*1.05,r*0.42,0,0,TAU); g.fill();
    g.fillStyle=C1OL(); g.beginPath(); g.ellipse(bx,by-h*0.3,r+2.4,h+2.4,0,0,TAU); g.fill();
    g.fillStyle=fl?'#ffffff':i%2?'#d6ae6c':'#e6c286'; g.beginPath(); g.ellipse(bx,by-h*0.3,r,h,0,0,TAU); g.fill();
    g.fillStyle='rgba(255,240,200,.45)'; g.beginPath(); g.ellipse(bx-r*0.3,by-h*0.75,r*0.45,h*0.3,0,0,TAU); g.fill(); }
  if(m3Bur()){ g.globalCompositeOperation='lighter'; g.globalAlpha=0.55; g.drawImage(foGlowSpr('210,225,255'),x-60,y-40,120,80); g.globalCompositeOperation='source-over'; g.globalAlpha=1; }
  for(let i=0;i<6;i++){ const a=t*5+i*1.05; g.fillStyle='rgba(240,210,150,.85)'; g.beginPath(); g.arc(x+c*30+Math.cos(a)*30,y+s*18+Math.sin(a)*10-6,2.4,0,TAU); g.fill(); }
  g.restore(); }
function m3FigGut(e,fl){
  if(e.under&&!(e.deathT>0)){ m3DrawGutUnder(e,fl); e._t3top=e.y-30; return; }
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/56*1.3, face=t3Turn(e,e.face,4), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e);
  const sk=fl?'#ffffff':foT(e,'#d8b070'), skD=foT(e,'#a8844a'), skL=foT(e,'#ecd09a'), dead=foDeath(e), hurt=m3Hurt(e);
  const stuck=st==='stuck', rear=st==='rear', spit=st==='spitW', leap=st==='leap', z=e.z||0;
  const rise=stuck?0.8:rear?1.2:leap?1:st==='dive'?1-clamp(inS/0.6,0,1):1;
  foShadow(fx,fy,50*k,0.3);
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,10,0,dead*0.8,0,0,0,-dead*20); else if(stuck) foSet(FOB,10,0,Math.sin(t*5)*0.12,0); else if(leap) foSet(FOB,10,-0.6+clamp(inS/0.9,0,1)*1.2,0,0);
  // the body: rings of sandy armour rising out of the sand, leaning toward Ash, the head on top
  let px=-10, pz=0; for(let i=0;i<6;i++){ const u=i/5, h=u*64*rise, x=-10+u*(16+(rear?-6:6)), r=34-i*2.2; foE(x,0,h+10,r,r*0.9,13,i%2?sk:skL,0,0,0,0.002*i); if(i<5) foN(x+r*0.9,-r*0.6,h+12,x+r*0.9,r*0.6,h+12,1.4,skD,0.01); px=x; pz=h; }
  const hz=pz+18, hx=px+14; foE(hx,0,hz,26,28,22,sk); foE(hx+8,0,hz+12,18,20,9,skL,0,0,0,0.01);
  // the round mouth full of glass teeth, the silver moon crumb glowing in his throat
  const open=spit||stuck||rear?1:0.5; foE(hx+24,0,hz-2,4,16*open+6,14*open+5,'#4a1e1a',0,0,0,0.03);
  for(let i=0;i<10;i++){ const a=i/10*TAU; foC(hx+24,Math.cos(a)*(16*open+5),hz-2+Math.sin(a)*(14*open+4),hx+29,Math.cos(a)*(12*open+3),hz-2+Math.sin(a)*(10*open+3),2,'#e8f8ff',0.04); }
  foB(hx+20,0,hz-2,6,'#eef2ff',0.05); if(stuck||e.belly) foGlow(hx+20,0,hz-2,30,'230,235,255',0.7+0.3*Math.sin(t*8),false); else foGlow(hx+20,0,hz-2,16,'230,235,255',0.35,false);
  for(const sd of [-1,1]){ foD(hx+12,sd*17,hz+12,stuck?2:3,'#1a1018',0.05); if(!stuck) foD(hx+12.5,sd*17,hz+13.4,1,'#ffffff',0.06); }
  if(rear) foGlow(0,0,30,40,'255,210,90',0.4,false);
  foEnd(40); e._t3top=foTop(fy,hz+30,k,z);
}
function m3Gut2(e,fl){
  if(e.under&&!(e.deathT>0)){ m3DrawGutUnder(e,fl); return; }
  const st=e.state, rear=st==='rear', stuck=st==='stuck'||!!e.stuck, spit=st==='spitW', t=e.t||0, dead=e.deathT>0?clamp(e.deathT/0.8,0,1):0;
  const x=e.x+(stuck?Math.sin(t*14)*3:0), y=e.y-(e.z||0), r=e.r, f=e.face, lift=rear?1.45:stuck?0.75:1, s=1.2;
  ctx.save(); c1Shadow2(e,1.3); if(dead) ctx.globalAlpha=1-dead*0.5;
  for(let i=4;i>=0;i--) c1E2(x-Math.cos(f)*i*14*s,y-i*12*lift*s,r*(0.8-i*0.05)*s,r*0.5*s,fl?'#fff':i%2?'#d8b070':'#ecd09a',0,2);
  // rearing: the soft belly shows, glowing gold (a pop-up from below hits it)
  if(rear){ ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,210,90,'+(0.3+0.15*Math.sin(t*9))+')'; ctx.beginPath(); ctx.ellipse(x,y-26*s,r*0.75*s,r*0.95*s,0,0,TAU); ctx.fill(); ctx.globalCompositeOperation='source-over';
    c1E2(x,y-24*s,r*0.4*s,r*0.62*s,'#f8e2b0',0,1.6); ctx.strokeStyle='rgba(160,110,50,.6)'; ctx.lineWidth=1.4; for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(x-r*0.3*s,y-24*s+k*9); ctx.lineTo(x+r*0.3*s,y-24*s+k*9); ctx.stroke(); } }
  const hx=x+Math.cos(f)*10*s, hy=y-60*lift*s, mo=spit||stuck||rear?1.3:1, mx=hx+Math.cos(f)*12*s, my=hy+6;
  c1E2(hx,hy,r*0.6*s,r*0.55*s,fl?'#fff':'#d8b070',0,2.2);
  ctx.fillStyle='#4a1e1a'; ctx.beginPath(); ctx.arc(mx,my,14*mo,0,TAU); ctx.fill();
  ctx.fillStyle='#e8f8ff'; for(let i=0;i<8;i++){ const a=i/8*TAU; ctx.beginPath(); ctx.arc(mx+Math.cos(a)*11*mo,my+Math.sin(a)*11*mo,2.2,0,TAU); ctx.fill(); }
  // the moon crumb in his throat: it glows when he has a tummy ache
  if(stuck){ ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(220,230,255,'+(0.35+0.25*Math.sin(t*8))+')'; ctx.beginPath(); ctx.arc(mx,my,24,0,TAU); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
  ctx.fillStyle=stuck?'#ffffff':'#d8e0ff'; ctx.beginPath(); ctx.arc(mx,my,5,0,TAU); ctx.fill();
  for(const sd of [-1,1]){ const ex=hx-Math.sin(f)*sd*12*s-Math.cos(f)*4, ey=hy-14*s; ctx.fillStyle='#1a1018'; ctx.beginPath(); if(stuck){ ctx.lineWidth=2; ctx.strokeStyle='#1a1018'; ctx.moveTo(ex-3,ey-3); ctx.lineTo(ex+3,ey+3); ctx.moveTo(ex+3,ey-3); ctx.lineTo(ex-3,ey+3); ctx.stroke(); } else { ctx.arc(ex,ey,3,0,TAU); ctx.fill(); } }
  ctx.restore();
}

// ================= 8. Lord Fanfare, the Mirror Peacock (m_fanfare), boss of the Mirror Temple (the Mirror Hall)
// Phase 1, Look at Me: a peck combo; the Tail Fan (the skylight's sunbeam bounces off his fanned tail as sweeping glare
// lines: hide behind a ring mirror, or Shadow Dash through them). THE TRICK: while his tail is fanned, MOONFIRE a violet
// eye on it: it pops. Every 2 eyes (1 on Easy) he folds his tail and stumbles 3 s. Four eyes end the phase.
// Phase 2, the Dark Hall: he flies up and spreads his tail across the skylight. The hall goes dark and the moon-glass ring
// round the edge fades into a pit unless the 4 moon braziers burn (Moonfire). His shadow feathers put braziers out.
// THE TRICK: Moonfire the crystal on the central mirror and turn the mirror (hit it, or USE) until its moonbeam hits him:
// dazzled, he tumbles down 4 s (x2). Two dazzles end the phase.
// Phase 3, Fanfare: he lands and spreads his whole tail. Now it bounces breath from the front straight back at Ash. Spin
// Strut: a ring of feathers (jump). Get to his side or behind him and Moonfire the last four eyes; each stuns him 1.5 s.
// The last eye ends the fight.
c1Lines('m_fanfare','m_mirror_boss_in','m_mirror_won',
  [['narr',S('In the middle of the Mirror Hall, a peacock as tall as a house is admiring himself in six mirrors at once. His feathers are glass and silver. On every tail feather is an eye, painted dark violet.','A giant glass peacock looks at himself in six mirrors. His tail has violet eyes.')],
   ['m_fanfare',S("Mirror, mirror, on the wall... it's ME. It's always me.",'Mirror, mirror... it is ME!')],
   ['m_fanfare',S("Oh! A visitor. A small, scaly, slightly singed visitor. I am Lord Fanfare, Keeper of the Moon Flame, Most Beautiful Thing in the World. Don't look at my tail.",'Oh! A visitor. I am Lord Fanfare, the most beautiful thing in the world. Do not look at my tail.')],
   ['m_fanfare',S('...No, DO look. Look at it.','No, DO look!')],
   ['ash',S('It\'s nice. Why are the eyes on it purple?','It is nice. Why are the eyes purple?')],
   ['m_fanfare',S("A voice in the mirrors told me I was the only light that matters. Isn't that lovely? Now. Shoo. You're making the mirrors look crowded.",'A voice in the mirrors said I am the only light. Now shoo!')]],
  [['narr',S('The last violet eye on Lord Fanfare\'s tail goes out. One by one, his feathers turn back to green and gold.','The last eye goes out. His feathers turn green and gold.')],
   ['m_fanfare',S('...Oh. Oh dear. Was I horrid? I think I was horrid. Something cold got into the mirrors and whispered to me.','Oh dear. Was I horrid? Something cold whispered to me.')],
   ['ash',S("You're still very shiny.",'You are still very shiny.')],
   ['m_fanfare',S("...Thank you. You're quite shiny yourself. For a lizard.",'Thank you. You are shiny too. For a lizard.')],
   ['ash',S("I'm a DRAGON.",'I am a DRAGON.')],
   ['m_fanfare',S("Even better. Dragons go with everything. I was supposed to guard Ember's flame FOR her family, you know. Not FROM them. I shall polish something to make up for it.",'Even better! I was meant to guard the flame FOR you. I am sorry.')]]);
// ---------- a mirror on a stand with a moon crystal (the Mirror Hall, Prism's Hall): any weapon hit (or USE) turns it
// 45 degrees; Moonfire on the crystal lights it (8 s, 12 on Easy) and the mirror throws a moonbeam the way it points
function m3MirrorMake(A,x,y,dir){ const M={k:'m3mirror',x,y,r:26,dir:dir||0,lit:0,heat:0,turnT:0,beam:null};
  M.onHit=(src)=>{ if(src==='fire'||src==='moon'||src==='burn'||src==='ember') return false; if(M.turnT>0) return true; m3MirrorTurn(M); return true; };
  A.objs.push(M); M.col=addAreaCol({t:'c',x,y,r:16}); return M; }
function m3MirrorTurn(M){ M.dir=(M.dir+1)%8; M.turnT=0.3; SFX.play('block'); shake(1.5); m3Ev('mirror'); }
function m3MirrorTick(M,dt){ if(M.turnT>0) M.turnT-=dt;
  if(typeof p4MoonHits==='function'&&p4MoonHits(M.x,M.y-34,18)){ M.heat+=dt; if(M.heat>=0.25&&!(M.lit>0)){ M.lit=byDiff(12,8,7); M.heat=0; SFX.play('cast'); emit(M.x,M.y-34,16,{col:'214,226,255',smin:40,smax:140,lmin:.3,lmax:.7,zmin:1.4,zmax:3}); m3Ev('crystal'); } }
  else if(M.heat>0) M.heat=Math.max(0,M.heat-dt);
  if(M.lit>0){ M.lit-=dt; const a=M.dir*Math.PI/4, L=760; M.beam={x0:M.x,y0:M.y-10,x1:M.x+Math.cos(a)*L,y1:M.y-10+Math.sin(a)*L}; if(typeof p4MoonShine==='function') p4MoonShine(M.beam.x0,M.beam.y0,M.beam.x1,M.beam.y1,26); } else M.beam=null; }
function m3MirrorHits(M,x,y,r){ const b=M.beam; return !!b&&segD(x,y,b.x0,b.y0,b.x1,b.y1)<(r||30)+13; }
function m3MirrorDraw(M){ const x=M.x, y=M.y, a=M.dir*Math.PI/4, oc=C1OL(), t=G.time; ctx.save();
  if(M.beam){ const b=M.beam; ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(200,215,255,.35)'; ctx.lineWidth=34; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(b.x0,b.y0); ctx.lineTo(b.x1,b.y1); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=8; ctx.stroke(); ctx.globalCompositeOperation='source-over'; }
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+4,18,6,0,0,TAU); ctx.fill(); ctx.fillStyle=oc; ctx.fillRect(x-4,y-30,8,32); ctx.fillStyle='#c8a050'; ctx.fillRect(x-2.5,y-30,5,30);
  // the mirror face, turned the way it points (a disc seen at an angle), and the crystal on top
  const sx=Math.abs(Math.sin(a))*0.55+0.45; ctx.save(); ctx.translate(x,y-40); ctx.fillStyle=oc; ctx.beginPath(); ctx.ellipse(0,0,22*sx+2,24,0,0,TAU); ctx.fill(); ctx.fillStyle='#e8c870'; ctx.beginPath(); ctx.ellipse(0,0,22*sx,22,0,0,TAU); ctx.fill();
  ctx.fillStyle=Math.sin(a)>0.2?'#9aa4b8':'#dcecff'; ctx.beginPath(); ctx.ellipse(0,0,18*sx,18,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-5*sx,-6,5*sx,3,-0.5,0,TAU); ctx.fill(); ctx.restore();
  ctx.strokeStyle='#ffcf5a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y-40); ctx.lineTo(x+Math.cos(a)*30,y-40+Math.sin(a)*18); ctx.stroke();
  const lit=M.lit>0; ctx.fillStyle=oc; ctx.beginPath(); ctx.moveTo(x,y-74); ctx.lineTo(x+8,y-62); ctx.lineTo(x,y-56); ctx.lineTo(x-8,y-62); ctx.closePath(); ctx.fill(); ctx.fillStyle=lit?'#f4f8ff':'#8a9ac0'; ctx.beginPath(); ctx.moveTo(x,y-71); ctx.lineTo(x+5.5,y-62); ctx.lineTo(x,y-58); ctx.lineTo(x-5.5,y-62); ctx.closePath(); ctx.fill();
  if(lit||M.heat>0){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=lit?0.8:M.heat*3; ctx.drawImage(foGlowSpr('210,225,255'),x-30,y-92,60,60); }
  ctx.restore(); }
// USE at a mirror turns it too
{ const base=updateInteractions; updateInteractions=function(dt){ base(dt); if(!AREA||!player||player.dead) return; const p=player;
    for(const D of M3.rooms){ const M=D.mirror; if(!M) continue; if(dist(p.x,p.y,M.x,M.y)<70){ G.prompt={text:S('Turn the mirror','Turn the mirror'),act:()=>m3MirrorTurn(M),x:M.x,y:M.y-50,always:true,kind:'use'}; break; } } }; }
M3ROOM.m_fanfare={
  build(R,A){ const D={R,type:'m_fanfare',glass:[],sky:{x:R.cx,y:R.cy-40}}, rx=(R.x1-R.x0)/2, ry=(R.y1-R.y0)/2;
    D.ring=[]; for(let i=0;i<6;i++){ const a=i/6*TAU+Math.PI/6, M={x:R.cx+Math.cos(a)*rx*0.52,y:R.cy+Math.sin(a)*ry*0.56,r:22}; M.col=addAreaCol({t:'c',x:M.x,y:M.y,r:20}); D.ring.push(M); }
    D.mirror=m3MirrorMake(A,R.cx,R.cy+ry*0.34,6);
    const c=A.cave; c1Cells(R,k=>{ if(c.typ[k]===TY.p4glass) D.glass.push(k); });
    // the four moon braziers burn 15 s (never for good), and each one holds the quarter of the glass ring nearest to it
    D.braz=((A.p4&&A.p4.braz)||[]).filter(o=>o.room===R.id); for(const o of D.braz){ if(!o.timed) o.timed=15; o.lit=0; if(o.L) o.L.i=0; }
    D.gb=new Map(); for(const k of D.glass){ const q=tPos(k); let best=null, bd=1e18; for(const o of D.braz){ const d=dist2(o.x,o.y,q.x,q.y); if(d<bd){ bd=d; best=o; } } if(best) D.gb.set(k,best); }
    return D; },
  reset(D){ M3.darkTo=0; D.mirror.lit=0; for(const o of D.braz||[]){ o.lit=0; if(o.L) o.L.i=0; } },
  tick(D,dt){ m3MirrorTick(D.mirror,dt);
    // the moon-glass ring is solid in daylight; in the Dark Hall only the moon braziers (or Moonfire) hold it
    const e=G.boss, dark=e&&!e.dead&&e.type==='m_fanfare'&&e.bph===1&&!(e.downT>0), C=AREA.p4; if(C) for(const k of D.glass){ const o=D.gb&&D.gb.get(k); if(!dark||(o&&o.lit>0)) C.glassT[k]=Math.max(C.glassT[k],0.3); } },
  ground(D,t){ const R=D.R, e=G.boss, dark=e&&e.type==='m_fanfare'&&e.bph===1;
    // the skylight's patch of sun on the floor (gone while his tail covers it)
    if(!dark){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,236,170,.13)'; ctx.beginPath(); ctx.ellipse(D.sky.x,D.sky.y,190,140,0,0,TAU); ctx.fill(); ctx.restore(); } },
  tall(D,list){ for(const M of D.ring){ if(!M.it) M.it={x:M.x,y:M.y+4,draw:()=>m3DrawRingMirror(M)}; list.push(M.it); }
    const M=D.mirror; if(!M.it) M.it={x:M.x,y:M.y+2,draw:()=>m3MirrorDraw(M)}; list.push(M.it); }
};
function m3DrawRingMirror(M){ const s=sbSprite('m3ringmirror',60,g=>{ g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0,52,22,7,0,0,TAU); g.fill();
    g.fillStyle='#c8a050'; g.beginPath(); g.moveTo(-20,52); g.lineTo(-20,-30); g.quadraticCurveTo(0,-58,20,-30); g.lineTo(20,52); g.closePath(); g.fill();
    g.fillStyle='#cfe0f4'; g.beginPath(); g.moveTo(-14,48); g.lineTo(-14,-26); g.quadraticCurveTo(0,-48,14,-26); g.lineTo(14,48); g.closePath(); g.fill();
    g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(-10,30); g.lineTo(-10,-20); g.lineTo(-4,-30); g.lineTo(-4,30); g.closePath(); g.fill(); },2.2);
  drawSprite(s,M.x,M.y-46,1,0); }
// a glare line is blocked by a ring mirror between the bird and Ash
function m3GlareBlock(D){ return (z,p)=>{ if(!D) return false; for(const M of D.ring) if(segD(M.x,M.y,z.x,z.y,p.x,p.y)<M.r+6&&dist(M.x,M.y,z.x,z.y)<dist(p.x,p.y,z.x,z.y)) return true; return false; }; }
// his eight tail eyes: where they are drawn (the fan rises behind him), projected to the screen exactly like the toy
// figure, so Moonfire pops the eye the player sees. m3FanEyeBody gives a feather tip in body space (x forward, z up)
const M3FANK=1.5, _m3fe=[0,0,0];
function m3FanEyeBody(i,fan,o){ const sp=(i-3.5)*(0.3*fan+0.04), th=0.5+fan*0.9, L=40+fan*30, bx=-10, bz=22;
  o[0]=bx-Math.cos(th)*L*Math.cos(sp)*0.6-(1-fan)*30; o[1]=Math.sin(sp)*L*1.3; o[2]=bz+Math.sin(th)*L; return o; }
function m3FanEyes(e){ const L=e._eyes||(e._eyes=[]), K=(e.r0||34)/34*M3FANK, fan=e.fan||0, c=Math.cos(e.face), s=Math.sin(e.face), fy=e.y+(e.r0||34)*0.45, z=e.z||0;
  for(let i=0;i<8;i++){ m3FanEyeBody(i,fan,_m3fe); const wx=_m3fe[0]*c-_m3fe[1]*s, wy=_m3fe[0]*s+_m3fe[1]*c, wz=_m3fe[2]+z;
    const q=L[i]||(L[i]={}); q.x=e.x+wx*K; q.y=fy+(wy*T3.ct-wz*T3.st)*K; q.i=i; } return L; }
M3HC.m_fanfare=e=>{ const L=e._hc||(e._hc=[{}]); m3HS(L,0,{x:e.x,y:e.y,r:e.r,m:e.downT>0?2:e.stumbleT>0?1.5:e.state==='dizzy'?1.3:1}); L.length=1; return L; };
function m3FanAI(e,dt,p){
  p=p||player; const D=m3RoomOf(e), D0=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0;
  e.fan=Math.max(0,Math.min(1,(e.fan||0)+dt*((e.fanTo||0)>e.fan?3:-3)));
  // Moonfire on a violet eye pops it (while the tail is fanned; in phase 3 only from his side or behind)
  // an eye needs a moment of Moonfire (0.45 / 0.7 / 0.9 s); the warmth fades when the breath moves off it
  if(e.fan>0.6&&e.bph!==1){ const eyes=m3FanEyes(e), side=Math.abs(angDiff(e.face,a))>1.0||e.state==='dizzy', need=byDiff(0.45,0.7,0.9); let hot=-1;
    for(const q of eyes){ if(e.eyes[q.i]) continue; if(typeof p4MoonHits==='function'&&p4MoonHits(q.x,q.y,16)){
        if(e.bph>=2&&!side){ m3Reflect(e,'moon'); break; } hot=q.i; e.eyeHeat[q.i]=(e.eyeHeat[q.i]||0)+dt; if(e.eyeHeat[q.i]>=need){ e.eyeHeat[q.i]=0; m3FanPop(e,q,D); } break; } }
    for(let i=0;i<8;i++) if(i!==hot&&e.eyeHeat[i]>0) e.eyeHeat[i]=Math.max(0,e.eyeHeat[i]-dt*0.6); }
  if(e.downT>0){ e.downT-=dt; e.state='stuck'; e.st=0.2; e.z=Math.max(0,(e.z||0)-dt*300); e.flying=false; if(e.downT<=0){ e.state='recover'; e.st=0.5; if(e.bph===1){ if((e.dazzles||0)>=2){ m3PhaseTo(e,0.299); M3.darkTo=0; } else m3FanUp(e,D); } } return; }
  if(e.stumbleT>0){ e.stumbleT-=dt; e.state='stagger'; e.st=0.2; if(e.stumbleT<=0){ e.state='recover'; e.st=0.4; } return; }
  if(e.bph===1) return m3FanDark(e,dt,p,D,d,a);
  // phases 1 and 3: on the floor (the kit brain does the pecks; the fan and the strut are timed here)
  if(e.state==='fanning'){ e.st-=dt; e.face=turnTo(e.face,a,0.8*dt); if(e.st<=0){ e.fanTo=e.bph>=2?1:0; e.state='recover'; e.st=0.5; } return; }
  if(e.state==='strutW'){ e.st-=dt; if(e.st<=0){ e.tele=null; e.state='strut'; e.st=0.8; SFX.play('roll'); G.rings.push({x:e.x,y:e.y,rad:e.r,max:430,speed:300,thick:16,dmg:m3Dmg(e,30)}); for(let i=0;i<16;i++){ const an=i/16*TAU; emit(e.x+Math.cos(an)*30,e.y+Math.sin(an)*20-30,1,{col:'200,240,230',ang:an,spread:0.1,smin:200,smax:260,lmin:.6,lmax:.8,zmin:2,zmax:3}); } } return; }
  if(e.state==='strut'){ e.st-=dt; e.face+=dt*14; if(e.st<=0){ e.state='dizzy'; e.st=byDiff(2.4,2,1.6); m3Txt(e,S('He spun himself dizzy! Moonfire his eyes!','He is dizzy! Moonfire his eyes!'),'#ffe066',14); } return; }
  // dizzy after the Spin Strut: his tail stays fanned and an eye can be popped from any side
  if(e.state==='dizzy'){ e.st-=dt; e.face+=Math.sin(G.time*5)*dt; if(e.st<=0){ e.state='recover'; e.st=0.4; } return; }
  e.fanT=(e.fanT==null?2.5:e.fanT)-dt*D0.atk;
  if(e.state==='chase'&&e.fanT<=0&&e.bph===0){ e.fanT=byDiff(7,6,5); m3FanFan(e,D); return; }
  if(e.state==='chase'&&e.fanT<=0&&e.bph>=2){ e.fanT=byDiff(5,4,3.4); e.state='strutW'; e.st=0.7; e.tele=newTele({shape:'circle',r:e.r+46,dur:e.st,col:M3COL.silver}); m3Say(e,'m_fanfare',S('Behold! The Spin Strut!','The Spin Strut!'),6); return; }
  return M3FANBRAIN(e,dt,p);
}
const M3FANBRAIN=FK.brain({move:'approach',stop:70,turn:2,cd:[0.8,1.4],
  moves:[{k:'c1combo',n:3,reach:84,half:0.8,windup:0.5,windup2:0.45,lunge:90,dmgN:30,col:M3COL.white,max:120,w:3}]});
// the tail fan: four (three on Easy) glare lines sweep from his tail; ring mirrors block them
function m3FanFan(e,D){ e.fanTo=1; e.state='fanning'; e.st=byDiff(5,4.4,4); e.tele=null; e.mv=null; const n=byDiff(3,4,4), a0=rand(0,TAU), sp=byDiff(0.5,0.7,0.85)*(Math.random()<0.5?1:-1);
  for(let i=0;i<n;i++) fzAdd('m3sweep',{x:e.x,y:e.y-20,len:720,a:a0+i*TAU/n,spin:sp,w:22,dmg:m3Dmg(e,26),wait:m3W({},0.8),life:e.st,col:M3COL.gold,block:m3GlareBlock(D),follow:()=>e.dead||e.state!=='fanning'?null:{x:e.x,y:e.y-20}});
  m3Say(e,'m_fanfare',S("Don't look at my tail! ...No, DO look.",'Look at my tail!'),6);
  m3Tip('faneye',S('His tail is fanned!','Moonfire an eye!'),S('Breathe Moonfire on a violet eye on his tail to pop it. Hide behind a mirror from the glare.','Moonfire his tail eyes! Hide from the glare.')); }
function m3FanPop(e,q,D){ e.eyes[q.i]=true; e.popped=(e.popped||0)+1; m3Ev('eye'); SFX.play('pop'); emit(q.x,q.y,22,{col:'190,140,255',smin:40,smax:180,lmin:.3,lmax:.7,zmin:1.2,zmax:3}); m3Txt(e,S('MY FEATHER!','MY FEATHER!'),'#e0c8ff',17);
  if(e.bph===0){ e.sinceFold=(e.sinceFold||0)+1; if(e.sinceFold>=byDiff(1,2,2)){ e.sinceFold=0; e.fanTo=0; for(const z of G.fz||[]) if(z.k==='m3sweep') z.done=true; e.state='stagger'; e.stumbleT=3; e.mv=null; m3Say(e,'m_fanfare',S('Do you know how long it takes to polish four hundred feathers? FOUR HUNDRED MINUTES.','Four hundred minutes of polish!'),3); }
    if(e.popped>=4){ e.fanTo=0; for(const z of G.fz||[]) if(z.k==='m3sweep') z.done=true; m3PhaseTo(e,0.649); } }
  else if(e.bph>=2){ e.stumbleT=1.5; e.state='stagger'; e.mv=null; if(e.popped>=8){ e.lastEye=true; damageEnemy(e,e.hp+10,{src:'moon'}); } } }
// the Dark Hall: he hangs high over one of eight spots round the hall, his tail over the skylight; shadow feathers fall;
// the moonbeam from the central mirror dazzles him down
function m3FanUp(e,D){ e.z=0; e.flying=true; e.state='fly'; e.spot=(e.spot==null?0:(e.spot+2+Math.floor(Math.random()*5))%8); e.spotT=byDiff(10,8,7); M3.darkTo=0.88; e.fanTo=1; }
function m3FanDark(e,dt,p,D,d,a){
  const D0=foeDiff(); if(!D) return; const R=D.R, rx=(R.x1-R.x0)/2, ry=(R.y1-R.y0)/2, sa=(e.spot||0)*Math.PI/4, tx=R.cx+Math.cos(sa)*rx*0.62, ty=D.mirror.y+Math.sin(sa)*ry*0.62;
  if(e.state!=='fly'&&e.state!=='featherW') m3FanUp(e,D);
  e.flying=true; e.z=Math.min(110,(e.z||0)+dt*160); steer(e,tx,ty,e.speed*1.2*D0.spd); e.face=turnTo(e.face,angTo(e.x,e.y,R.cx,R.cy),3*dt);
  e.spotT-=dt; if(e.spotT<=0&&dist(e.x,e.y,tx,ty)<40){ e.spot=(e.spot+2+Math.floor(Math.random()*5))%8; e.spotT=byDiff(10,8,7); }
  // dazzled by the moonbeam: he tumbles down
  if((m3MirrorHits(D.mirror,e.x,e.y,e.r+10)||m3MirrorHits(D.mirror,e.x,e.y-((e.z||0)+30)*T3.st*M3FANK,e.r+10))&&e.z>40){ e.dazzles=(e.dazzles||0)+1; e.downT=byDiff(5,4,3.4); e.fanTo=0; e.tele=null; M3.darkTo=0.2; m3Txt(e,S('Dazzled! He tumbles down!','Dazzled!'),'#e8f0ff',17); m3Say(e,'m_fanfare',S('AAH! Too bright! Too BEAUTIFUL!','Too bright!'),2); shake(8); m3Ev('dazzle'); return; }
  e.cd-=dt*D0.cdK; if(e.cd>0) return; e.cd=byDiff(2.6,2,1.6);
  // shadow feathers: on Ash, and on a lit brazier (it goes out)
  const C=AREA&&AREA.p4, lit=C?C.braz.filter(o=>o.room===R.id&&o.lit>0):[];
  const spots=[{x:p.x,y:p.y}]; if(lit.length) spots.push(lit[Math.floor(Math.random()*lit.length)]); if(e.hp<e.maxHp*0.5) spots.push({x:p.x+rand(-120,120),y:p.y+rand(-80,80)});
  for(const s of spots){ m3Mark({x:s.x,y:s.y,r:56,dur:m3W({},0.7),col:M3COL.violet,fire:z=>{ SFX.play('pop'); emit(z.x,z.y,12,{col:'60,40,90',glow:false,smin:30,smax:120,lmin:.3,lmax:.6,zmin:2,zmax:4});
    if(!player.dead&&!m3Up()&&dist(player.x,player.y,z.x,z.y)<z.r+player.r*0.5) hurtPlayer(m3Dmg(e,26),z.x,z.y,160);
    if(C) for(const o of C.braz) if(o.lit>0&&dist(o.x,o.y,z.x,z.y)<70){ o.lit=0; o.L.i=0; p4GlassRefresh(AREA); ftext(o.x,o.y-40,S('The brazier goes out!','Out!'),'#c8b8ff',13); } }}); }
}
defineFoe('m_fanfare',{boss:true,name:'Lord Fanfare',title:S('the Mirror Peacock','the mirror peacock'),short:'Lord Fanfare',
  lv:20,hp:19500,r:34,speed:150,dmg:38,value:2200,kbRes:0.5,dcol:'170,220,210',phases:[0.65,0.3],
  phaseText:[[S('The Dark Hall!','It goes dark!'),S('He covers the skylight. Keep the moon braziers lit. Moonfire the crystal on the big mirror and turn it onto him!','Light the braziers! Turn the big mirror onto him!'),['m_fanfare',S('Lights out! Only I may shine!','Lights out!')]],
             [S('Fanfare!','Fanfare!'),S('His tail now bounces breath back from the front. Get behind him and Moonfire the last eyes!','Get behind him! Moonfire his eyes!'),['m_fanfare',S('BEHOLD MY GLORY!','Behold me!')]]],
  init(e){ m3BossInit(e); e.eyes=[false,false,false,false,false,false,false,false]; e.eyeHeat=[]; e.popped=0; e.fan=0; e.fanTo=0; e.dazzles=0; },
  onPhase(e,i){ const D=m3RoomOf(e); if(i===1){ e.fanTo=0; for(const z of G.fz||[]) if(z.k==='m3sweep') z.done=true; m3FanUp(e,D); e.cd=1.5; } if(i===2){ e.flying=false; e.z=0; e.fanTo=1; e.fan=1; M3.darkTo=0; e.state='chase'; } },
  ai:m3FanAI,
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.lastEye) return amt;
    if(e.bph>=2&&(h.src==='moon'||h.src==='fire')&&Math.abs(angDiff(e.face,angTo(e.x,e.y,player.x,player.y)))<1.0){ m3Reflect(e,h.src); return false; }
    if(e.bph===1&&(e.z||0)>40&&!(e.downT>0)){ a=amt*(h.ranged||h.src==='glaive'||h.src==='whip'?0.5:0.15); if(!(e._upT>G.time)){ e._upT=G.time+2.5; m3Txt(e,S('Too high! Turn the moonbeam onto him!','Too high! Use the moonbeam!'),'#e8f0ff',12); } }
    if(e.bph===0&&(e.popped||0)<4){ const b=a; a=m3Floor(e,a,o,0.66); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Moonfire the violet eyes on his fanned tail!','Moonfire his tail eyes!'),'#ffd27a',13); } }
    if(e.bph===1&&(e.dazzles||0)<2){ const b=a; a=m3Floor(e,a,o,0.31); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Light the mirror crystal with Moonfire and turn the mirror onto him!','Turn the moonbeam onto him!'),'#ffd27a',13); } }
    if(e.bph===2&&(e.popped||0)<8){ const b=a; a=m3Floor(e,a,o,0.04); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,S('Get behind him and Moonfire his last eyes!','Moonfire his last eyes!'),'#ffd27a',13); } }
    return a; },
  draw3d:m3FigFanfare, draw2d:m3Fanfare2,
  sheet:c1Sheet([{state:'chase',label:'idle'},{state:'chase',dx:80,label:'walk'},{state:'windup',st:0.3,label:'peck windup'},{state:'strike',label:'peck'},{state:'fanning',fan:1,label:'tail fanned'},{state:'fanning',fan:1,eyes:[true,false,true,false,false,true,false,false],label:'eyes popped'},{state:'fly',z:90,fan:1,flying:true,label:'over the skylight'},{state:'stuck',downT:2,label:'dazzled'},{state:'strut',fan:1,label:'spin strut'},{state:'chase',deathT:0.3,label:'death'}])});
function m3FigFanfare(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=(e.r0||34)/34*M3FANK, face=t3Turn(e,e.face,st==='strut'?30:6), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e), z=e.z||0;
  const done=!!e.lastEye||e.deathT>0, glass=fl?'#ffffff':foT(e,'#bfe8e0'), glassD=foT(e,'#7ab8b0'), silver='#e8eef4', gold='#ffcf5a', dead=foDeath(e), hurt=m3Hurt(e);
  const fan=e.fan!=null?e.fan:0, down=st==='stuck', peck=st==='windup'?-1:st==='strike'?1:0, mv=foWalk(e,dt,5), w=e._wp||0, sw=Math.sin(w)*mv;
  foShadow(fx,fy,30*k,z>20?0.2:0.3);
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,10,0,dead*1.4,0,0,0,-dead*6); else if(down) foSet(FOB,10,0,1.1+Math.sin(t*5)*0.1,0,0,0,-4); else if(st==='stagger') foSet(FOB,10,0,Math.sin(t*9)*0.15,0);
  foLow(); if(z<10) for(const sd of [-1,1]){ const o=sw*sd*5; foL(0,sd*6,18,o*0.6,sd*7,8,1.6,'#c8a050',1.3); foL(o*0.6,sd*7,8,o+3,sd*7,0.5,1.2,'#c8a050',1); }
  foUp(); foSet(FOA,20,-0.1+peck*0.25-hurt*0.2,0,0);
  // the tail: a fan of eight glass feathers rising behind him, an eye on each (violet until it pops)
  const nT=8; for(let i=0;i<nT;i++){ m3FanEyeBody(i,fan,_m3fe); const ex=_m3fe[0], ey=_m3fe[1], ez=_m3fe[2], bx=-10, bz=22;
    foQ([bx,-2,bz, bx,2,bz, ex,ey+6,ez, ex-4,ey,ez+6, ex,ey-6,ez],i%2?glass:glassD,null,-0.02+i*0.001);
    const popped=e.eyes&&e.eyes[i]; foD(ex-1,ey,ez+1,4.4,popped?(done?gold:'#d8e8e4'):'#6a3aa8',0.01); if(!popped) foD(ex-0.6,ey,ez+1.4,1.8,'#2a1040',0.015); }
  // the body, neck and head with a little sun crown
  foE(0,0,24,13,10,11,glass); foE(2,0,27,9,8,6,silver,0,0,0,0.01);
  for(const sd of [-1,1]) foQ([4,sd*9,28, -10,sd*13,30, -14,sd*10,20, 0,sd*9,20],glassD,null,0.005);
  const nx=10+peck*8, nz=44-peck*6; foL(6,0,30,nx,0,nz,4,glass,3); foB(nx+1,0,nz+3,6,glass);
  foC(nx+5,0,nz+2,nx+13+peck*4,0,nz+0-peck*3,2,gold,0.03);
  for(const sd of [-1,1]){ foD(nx+4.4,sd*3.4,nz+4.6,1.5,'#ffffff',0.04); foD(nx+5,sd*3.4,nz+4.6,0.9,down?'#8a6aa8':'#3a1a5a',0.05); }
  for(let i=0;i<5;i++){ const a=(i-2)*0.4; foC(nx-1,Math.sin(a)*3,nz+8,nx-2+Math.cos(a)*1,Math.sin(a)*6,nz+15,0.9,gold,0.04); }
  if(down) foGlow(nx,0,nz,26,'230,240,255',0.6,false);
  foEnd(30); e._t3top=foTop(fy,nz+18,k,z);
}
function m3Fanfare2(e,fl){
  const x=e.x, y=e.y-(e.z||0)-14, r=e.r, f=e.face, fan=e.fan||0; ctx.save(); c1Shadow2(e,1.2);
  const eyes=m3FanEyes(e), bx=x-Math.cos(f)*10, by=y-10;
  for(const q of eyes){ const a=angTo(bx,by,q.x,q.y), L=dist(bx,by,q.x,q.y); ctx.fillStyle=q.i%2?'#bfe8e0':'#7ab8b0'; ctx.strokeStyle=C1OL(); ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse((bx+q.x)/2,(by+q.y)/2,L/2+6,7+fan*4,a,0,TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle=e.eyes&&e.eyes[q.i]?'#d8e8e4':'#6a3aa8'; ctx.beginPath(); ctx.arc(q.x,q.y,5.5,0,TAU); ctx.fill(); }
  c1E2(x,y,r*0.7,r*0.55,fl?'#fff':'#bfe8e0',0,2); c1E2(x+Math.cos(f)*16,y-34,9,9,'#bfe8e0',0,1.6); ctx.strokeStyle='#bfe8e0'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(x+Math.cos(f)*6,y-8); ctx.lineTo(x+Math.cos(f)*14,y-28); ctx.stroke();
  ctx.fillStyle='#ffcf5a'; ctx.beginPath(); ctx.moveTo(x+Math.cos(f)*24,y-36); ctx.lineTo(x+Math.cos(f)*36,y-33); ctx.lineTo(x+Math.cos(f)*24,y-30); ctx.fill();
  c1Eye2(x+Math.cos(f)*18,y-37,2.4,f); ctx.restore();
}

// ================= 9. Hush, on the silver leash (m_hushboss, speaker f_hush), the Eclipse Observatory (the Dome Gallery)
// The lamp rule: a freshly lit moonstone (Moonfire) or lamp post pulls her to it; she hovers low, dazzled, 3 s (x1.5).
// Each one works once per 15 s.
// Phase 1, Shhh: she hovers high (melee barely reaches, arrows half). Dust Clouds, the Hush Pulse (a violet donut: no
// breath 3 s), a Dive (red line). Gate: 1 / 1 / 2 moonstone dazzles.
// Phase 2, the Eclipse: every 24 / 18 / 14 s she folds her wings over the hall: dark. She dives into one shadow pool and
// erupts from the other (a circle at the far pool). MOONFIRE ALL THREE MOONSTONES to end an eclipse at once (she is
// dazzled at the last one). Ash can DIVE into a pool too. Gate: 1 / 1 / 2 eclipses ended.
// Phase 3, the Great Shush: a wave of quiet too tall to jump: BURROW in the rim sand and let it pass. The leash knots
// glow: hit a knot (the Glaive through it, the Chain Whip, any weapon up close): the leash jerks her down, 3 s. Mothlings
// fly into lit moonstones and put them out. Gate: 1 / 2 / 2 knot jerks.
// Phase 4, the Tug: the Mother hauls her up toward the dome; the taut leash sweeps the floor (jump it, or Shadow Dash).
// Ride an updraft (Wind Riding) to the upper gallery, GRAPPLE the silver ring on her leash and hold away to PULL:
// she crashes onto the brass floor, 5 s, x2. Gate: 1 / 2 / 2 pulls.
// At the end she sinks down (she is not killed): M3.hook.hushDone(e, finish) or the built-in choice (THREADS D3) plays.
// For the finale (FINALE 6.4): M3HUSH.def({phases:3, shadow:true}) makes the same moth with one phase fewer, and
// M3HUSH.parts(cx,cy,R,{outdoor:true,...}) the same arena pieces (moonstones, pools, knots, rim) anywhere.
c1Lines('m_hushboss','m_hush_intro','m_hush_outro',
  [['narr',S('Under the great dome, on a floor of brass rings, a white moth as big as a barn sits very still. Frost glitters in her fur. A silver thread runs from her neck down to two knots in the floor, then straight up through the open dome into the dark.','A huge white moth sits under the dome. A silver thread ties her to the floor and to the sky.')],
   ['narr',S('Beside her, in a little brass cradle, something glows silver. The Moon Shard.','Beside her glows the Moon Shard.')],
   ['f_hush',S('Shhh. You again. The loud one. ...I never did get a sweater.','Shhh. You again. I never got a sweater.')],
   ['ash',S('Hush. You came back.','Hush. You came back.')],
   ['f_hush',S('I flew to the Mother, small and cold. She made me big again. "You came back small," she said. "Never again." Then she gave me this.','The Mother made me big again. Then she gave me this leash.')],
   ['narr',S('The silver leash glints. Somewhere far above, something tugs it, gently. Hush flinches.','Something far above tugs the leash. Hush flinches.')],
   ['f_hush',S('My sister Murmur brought the Shard here. Then she flew up to the Mother. They all fly up to the Mother, in the end.','My sister brought the Shard here. Then she flew to the Mother.')],
   ['f_hush',S("I'm to keep it until you bring the other two. Then the Mother gets all three. Shhh. Don't be loud about it.",'I keep it until you bring the others. Shhh.')],
   {who:'c_vesper',text:S('Hi, moth. Remember the Dreadgate? I brought more fire bombs.','Hi, moth! I brought fire bombs.'),skipIf:()=>!G.flags.m_vesper_ally},
   {who:'m_esme',text:S('(from the stairs) Lamplighters! Poles up! Wicks lit!','Lamplighters! Light the lamps!'),skipIf:()=>!G.flags.m_lamps_ally},
   ['f_hush',S('Shhhhhhhhh.','Shhhhh.')]],
  null);
// the built-in outro and the choice (ACT4 6.11); the story helper can replace it (STORY.m_hush_outro or M3.hook.hushDone)
STORY.bosses.m_hushboss.outro=null;
const M3_HUSH_OUTRO=()=>[
  ['narr',S('Hush sinks down onto the brass floor and folds her wings.','Hush sinks down and folds her wings.')],
  ['f_hush',S("...Take it. It was never mine. Nothing is ever mine.",'Take it. It was never mine.')],
  xdo(()=>{ try{ giveItems({m_shard3:1}); }catch(err){} G.flags.m_hush_done=1; }),
  ['narr',S('The Moon Shard is cold, and then, in your claws, warm.','The Shard is cold. Then it is warm.')],
  ['iska',S("Ash. If you leave her tied, the Mother will pull her home and keep her cold forever. If you cut her loose, she's free. Free to go anywhere. Even away from you.",'If you leave her tied, the Mother keeps her cold. If you cut her loose, she is free.')],
  {who:'iska',text:S("But moon-silk won't cut. Not with claws, not with fire. Somebody in Moonfall might have known how. I don't.",'But moon-silk will not cut. Someone in Moonfall might know how.'),skipIf:()=>!!G.flags.m_leash_known},
  {who:'iska',text:S('You know how. Gently. Like the Book said.','You know how. Gently.'),skipIf:()=>!G.flags.m_leash_known},
  ch('ash',S('Hush lies on the brass floor. The silver leash is still tied to her neck, pulling her up toward the dark.','The leash still pulls Hush up toward the dark.'),[
    {t:S('Cut the leash','Cut the leash'),tone:'kind',cond:()=>!!G.flags.m_leash_known,fn:()=>{ m3HushOutcome('free'); },then:[
      ['narr',S("You breathe Moonfire on the first knot, as softly as you'd blow on hot soup. The silver thread melts like frost on a window. Then the second knot.",'You breathe soft Moonfire on the knots. The thread melts.')],
      ['narr',S("You cut the leash. Hush shivers, stretches her wings, and floats up out of the Observatory, free and glowing faintly. She doesn't look back. Then she does, once.",'Hush is free! She floats up and away. She looks back once.')],
      ['f_hush',S('...Shhh. Thank you. Quietly.','Shhh. Thank you.')]]},
    {t:S('Take the Shard and go','Take the Shard and go'),tone:'brave',fn:()=>{ m3HushOutcome('foe'); },then:[
      ['narr',S('You take the Shard. The leash tightens, and Hush crumbles into a hundred little white moths that flutter up the silver thread to their Mother.','The leash pulls tight. Hush turns into a hundred little moths. They fly up to the Mother.')],
      ['iska',S("She'll remember this, Ash. Moths always remember.",'She will remember this, Ash.')]]}]),
  xdo(()=>{ G.choices.extra=G.choices.extra||{}; G.choices.extra.m_hush=G.choices.m_hush==='free'?S('You melted Hush\'s silver leash with the gentlest Moonfire, and she flew away free.','You set Hush free.'):S('You took the Moon Shard and left Hush on her leash. The Mother pulled her home.','You left Hush on her leash.');
    if(typeof STAGEDEF!=='undefined'&&STAGEDEF.m_reforge&&typeof setStage==='function') try{ setStage('m_reforge',['Act IV · Final Chapter',S('The Ember Heart','The Ember Heart')]); }catch(err){ console.error(err); } })];
// the choice made: Hush floats out of the dome, free and glowing ('free'), or crumbles into moths that fly up the leash
// ('foe'). The story can call M3.hushOutcome(kind) itself.
function m3HushOutcome(kind){ kind=kind==='free'?'free':'foe'; G.choices.m_hush=kind; const e=M3.hushE||G.enemies.find(q=>q.type==='m_hushboss');
  const x=e?e.x:player.x, y=e?e.y:player.y-120; fzAdd(kind==='free'?'m3hushfree':'m3hushfoe',{x,y,life:6,face:e?e.face:0}); if(e) e.alpha=0;
  try{ if(M3.hook.hushChoice) M3.hook.hushChoice(kind); }catch(err){ console.error(err); } }
FZK.m3hushfree={ tall(z,list){ if(!z.it) z.it={flying:true,draw:()=>{ const u=z.t/z.life, k=1-u*0.75, y=z.y-u*420, a=clamp(1-u*0.9,0,1); ctx.save(); ctx.globalAlpha=a; ctx.globalCompositeOperation='lighter'; ctx.drawImage(foGlowSpr('255,240,210'),z.x-90*k,y-90*k,180*k,180*k); ctx.globalCompositeOperation='source-over';
      const fl=Math.sin(G.time*8)*0.5; ctx.fillStyle='#f8f4ff'; ctx.strokeStyle=C1OL(); ctx.lineWidth=2; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(z.x+s*40*k,y-10*k,40*k,(26+fl*8)*k,s*0.4,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#9a6ad0'; ctx.beginPath(); ctx.arc(z.x+s*42*k,y-10*k,8*k,0,TAU); ctx.fill(); ctx.fillStyle='#f8f4ff'; }
      ctx.beginPath(); ctx.ellipse(z.x,y,12*k,22*k,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }}; z.it.x=z.x; z.it.y=z.y+40; list.push(z.it); } };
FZK.m3hushfoe={ tall(z,list){ if(!z.it){ z.ms=[]; for(let i=0;i<60;i++) z.ms.push({a:rand(0,TAU),r:rand(0,90),v:rand(160,320),w:rand(0,6)}); z.it={flying:true,draw:()=>{ const u=z.t/z.life; ctx.save();
      for(const m of z.ms){ const k=clamp(u*1.4-m.r/300,0,1), x=z.x+Math.cos(m.a)*m.r*(1-k)+Math.sin(G.time*7+m.w)*6, y=z.y+Math.sin(m.a)*m.r*0.6-k*m.v*3; ctx.globalAlpha=clamp(1-u,0,1); ctx.fillStyle='#f4f0fa'; const f=Math.abs(Math.sin(G.time*16+m.w))*3+1; ctx.beginPath(); ctx.ellipse(x-f,y,f,2.4,0,0,TAU); ctx.ellipse(x+f,y,f,2.4,0,0,TAU); ctx.fill(); }
      ctx.strokeStyle=`rgba(230,235,255,${0.8*(1-u)})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(z.x,z.y); ctx.lineTo(z.x,z.y-900); ctx.stroke(); ctx.restore(); }}; } z.it.x=z.x; z.it.y=z.y+40; list.push(z.it); } };
// ---------- the arena parts (reusable): moonstones, linked shadow pools, two leash knots, the rim of sand, lamp posts,
// the gallery (upper ring). o: {stones:[[x,y],...], pools:[[x,y],[x,y]], knots:[[x,y],[x,y]], lamps:[[x,y],...],
// rim:[r0,r1], gallery:{x,y,w,h}, dome:{x,y} (where the leash goes up), outdoor:true (draw it through M3.parts), A (an area)}
function m3HushParts(cx,cy,R,o){
  o=o||{}; const A=o.A||AREA, P={cx,cy,R,on:o.on!==false,outdoor:!!o.outdoor,stones:[],pools:[],knots:[],lamps:[],rim:o.rim||[R*0.78,R],gallery:o.gallery||null,dome:o.dome||{x:cx,y:cy-R*0.5}};
  const st=o.stones||[[cx,cy-R*0.5],[cx+R*0.48,cy+R*0.36],[cx-R*0.48,cy+R*0.36]];
  for(const [x,y] of st){ const S0={x,y,lit:0,heat:0,lureAt:-99,L:{x,y:y-26,r:230,i:0}}; if(A&&A.lights) A.lights.push(S0.L); else if(typeof LIGHTS!=='undefined') LIGHTS.push(S0.L); S0.col=A&&A.objs?addAreaCol({t:'c',x,y,r:14}):addCol({t:'c',x,y,r:14}); P.stones.push(S0); }
  for(const [x,y] of (o.pools||[[cx-R*0.66,cy],[cx+R*0.66,cy]])) P.pools.push({x,y});
  for(const [x,y] of (o.knots||[[cx-R*0.42,cy-R*0.32],[cx+R*0.42,cy+R*0.3]])) P.knots.push({x,y,jerkT:0,glow:0});
  for(const [x,y] of (o.lamps||[])) P.lamps.push(m3AddLamp(x,y,{h:52,dur:G&&G.flags&&G.flags.m_lampoil?24:15,R:160,fireOK:true}));
  P.tick=m3HushPartsTick; P.ground=m3HushPartsGround; P.tall=m3HushPartsTall;
  if(o.outdoor) M3.parts.push(P);
  return P; }
// take a set of outdoor parts away again (the finale, after the echo fight): no more drawing, ticking or colliders
function m3HushPartsOff(P){ if(!P) return; P.on=false; M3.parts=M3.parts.filter(q=>q!==P); for(const S0 of P.stones){ if(S0.col) S0.col.off=true; S0.L.i=0; } for(const L of P.lamps) if(L.L) L.L.i=0; }
function m3HushPartsTick(P,dt){
  for(const S0 of P.stones){ if(S0.lit>0){ S0.lit-=dt; if(S0.lit<=0){ S0.lit=0; } if(typeof p2Shine==='function') p2Shine(S0.x,S0.y,120); }
    S0.L.i=S0.lit>0?0.85:0.1;
    if(!(S0.lit>0)&&typeof p4MoonHits==='function'&&p4MoonHits(S0.x,S0.y-22,18)){ S0.heat+=dt; if(S0.heat>=0.3){ S0.heat=0; S0.lit=byDiff(18,15,13)*(1+0.25*(typeof hasSkill==='function'?hasSkill('moon2'):0)); S0.litAt=G.time; SFX.play('cast'); emit(S0.x,S0.y-24,18,{col:'214,226,255',smin:40,smax:140,lmin:.3,lmax:.7,zmin:1.4,zmax:3}); m3Ev('stone'); } }
    else if(S0.heat>0) S0.heat=Math.max(0,S0.heat-dt*0.5); }
  for(const L of P.lamps) FZK.m3lamp.tick(L,dt);
  for(const K of P.knots){ if(K.jerkT>0) K.jerkT-=dt; K.glow=Math.max(0,K.glow-dt); }
  // mothlings fly into lit moonstones and put them out
  for(const q of G.enemies){ if(q.dead||q.type!=='f_mothling') continue; let best=null, bd=1e9; for(const S0 of P.stones){ if(!(S0.lit>0)) continue; const d=dist(q.x,q.y,S0.x,S0.y); if(d<bd){ bd=d; best=S0; } }
    if(!best) continue; const a=angTo(q.x,q.y,best.x,best.y-30); q.x+=Math.cos(a)*Math.min(bd,q.speed*0.8*dt); q.y+=Math.sin(a)*Math.min(bd,q.speed*0.8*dt); q.mvL=(q.mvL||0)+(bd<44?dt:0);
    if(q.mvL>1){ q.mvL=0; best.lit=0; m3Puff(best.x,best.y-30,'230,230,240',14); ftext(best.x,best.y-50,S('Puff! A mothling puts it out!','Puff! It went out!'),'#e0d8f0',13); } }
}
function m3HushPartsGround(P,t){
  // the brass orrery floor rings, the shadow pools are p4's (dungeon `●`); the knots and their glow
  ctx.save(); ctx.strokeStyle='rgba(200,160,80,.45)'; ctx.lineWidth=3; for(const f of [0.3,0.52]){ ctx.beginPath(); ctx.ellipse(P.cx,P.cy,P.R*f*1.3,P.R*f,0,0,TAU); ctx.stroke(); }
  for(let i=0;i<3;i++){ const a=t*0.08*(i%2?1:-1)+i*2.1; ctx.fillStyle='rgba(220,190,110,.6)'; ctx.beginPath(); ctx.arc(P.cx+Math.cos(a)*P.R*0.52*1.3,P.cy+Math.sin(a)*P.R*0.52,9,0,TAU); ctx.fill(); }
  ctx.restore();
  for(const K of P.knots){ const g=K.glow>0||(G.boss&&G.boss.type==='m_hushboss'&&G.boss.bph>=2); ctx.save(); ctx.fillStyle=C1OL(); ctx.beginPath(); ctx.arc(K.x,K.y,16,0,TAU); ctx.fill(); ctx.fillStyle=g?'#f4f8ff':'#c8d0e0'; ctx.beginPath(); ctx.arc(K.x,K.y,13,0,TAU); ctx.fill();
    ctx.strokeStyle='#8a94b0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(K.x-8,K.y-5); ctx.quadraticCurveTo(K.x,K.y+8,K.x+8,K.y-5); ctx.stroke(); ctx.beginPath(); ctx.arc(K.x,K.y-2,5,0,TAU); ctx.stroke();
    if(g){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.4+0.3*Math.sin(t*5+K.x); ctx.drawImage(foGlowSpr('225,235,255'),K.x-30,K.y-30,60,60); } ctx.restore(); }
  if(P.outdoor){ for(const q of P.pools){ ctx.save(); ctx.fillStyle='rgba(30,16,50,.85)'; ctx.beginPath(); ctx.ellipse(q.x,q.y,44,26,0,0,TAU); ctx.fill(); ctx.restore(); } } }
function m3HushPartsTall(P,list){ for(const S0 of P.stones){ if(!S0.it) S0.it={x:S0.x,y:S0.y+4,draw:()=>m3DrawMoonstone(S0)}; list.push(S0.it); }
  for(const L of P.lamps){ if(!L.it) L.it={x:L.x,y:L.y,draw:()=>m3DrawLamp(L)}; list.push(L.it); } }
function m3DrawMoonstone(S0){ const x=S0.x, y=S0.y, lit=S0.lit>0, oc=C1OL(), t=G.time; const s=sbSprite('m3moonstone',40,g=>{ g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0,30,18,6,0,0,TAU); g.fill();
    g.fillStyle='#8a8aa0'; g.beginPath(); g.moveTo(-14,30); g.lineTo(-11,-4); g.lineTo(0,-10); g.lineTo(11,-4); g.lineTo(14,30); g.closePath(); g.fill(); g.fillStyle='#a8aabe'; g.beginPath(); g.moveTo(-10,28); g.lineTo(-8,-2); g.lineTo(-1,-6); g.lineTo(-2,28); g.closePath(); g.fill(); },1.8);
  drawSprite(s,x,y-22,1,0); ctx.save(); ctx.fillStyle=oc; ctx.beginPath(); ctx.moveTo(x,y-50); ctx.lineTo(x+9,y-38); ctx.lineTo(x,y-28); ctx.lineTo(x-9,y-38); ctx.closePath(); ctx.fill();
  ctx.fillStyle=lit?'#f4f8ff':'#7a86a8'; ctx.beginPath(); ctx.moveTo(x,y-47); ctx.lineTo(x+6,y-38); ctx.lineTo(x,y-31); ctx.lineTo(x-6,y-38); ctx.closePath(); ctx.fill();
  if(lit||S0.heat>0){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=lit?0.7+0.2*Math.sin(t*4+x):S0.heat*3; ctx.drawImage(foGlowSpr('200,215,255'),x-40,y-78,80,80); } ctx.restore(); }
// the silver leash: from her neck to the two knots, and straight up into the dark; it glints
function m3DrawLeash(e,P){ if(!P||e.alpha<0.05) return; const t=G.time, nx=e.x+Math.cos(e.face)*10, ny=e.y-(e.z||0)-28; ctx.save(); ctx.lineCap='round';
  const line=(x0,y0,x1,y1,w)=>{ ctx.strokeStyle='rgba(60,50,90,.5)'; ctx.lineWidth=w+2; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); ctx.strokeStyle='#e8eeff'; ctx.lineWidth=w; ctx.stroke(); };
  for(const K of P.knots) line(K.x,K.y,nx,ny,1.6);
  line(nx,ny,nx+(P.dome.x-nx)*0.15,ny-700,e.bph>=3?2.6:1.6);
  const g=(t*0.6)%1; ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(nx+(P.dome.x-nx)*0.15*g,ny-700*g,3,0,TAU); ctx.fill();
  if(e.bph>=3){ const ry=ny-46; ctx.globalCompositeOperation='source-over'; ctx.strokeStyle=C1OL(); ctx.lineWidth=5; ctx.beginPath(); ctx.arc(nx,ry,9,0,TAU); ctx.stroke(); ctx.strokeStyle='#dfe6ff'; ctx.lineWidth=3; ctx.stroke(); }
  ctx.restore(); }
// her hit circles: the body (high or low), and the two knots on the floor (any weapon there jerks the leash)
M3HC.m_hushboss=e=>m3HushHC(e);
function m3HushHC(e){ const L=e._hc||(e._hc=[{},{},{}]); let n=0; if(e.kneel){ L.length=0; return L; }
  // the knots come first: a blade that touches a knot and her body at once jerks the leash
  const P=e.m3hp; if(P&&e.bph>=2&&e.bph<3) for(const K of P.knots) if(!(K.jerkT>0)) m3HS(L,n++,{x:K.x,y:K.y,r:16,m:1.02});
  m3HS(L,n++,{x:e.x,y:e.y,r:e.r,m:1});
  L.length=n; return L; }
// the brain: low (dazzled at a light), high (circling), the eclipse, the shush, the tug
function m3HushAI(e,dt,p){
  p=p||player; const P=e.m3hp, D0=foeDiff(), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), C=m3Ctx(e); e.dx=e.dy=0; e.flying=true; e.noClip=true;
  if(e.kneel){ e.state='kneel'; e.st=0.2; e.z=Math.max(0,(e.z||0)-dt*80); return; }
  const top=e.maxPh||4;
  // the lamp rule: a freshly lit moonstone or lamp post pulls her to it (once per 15 s each)
  if(P&&!e.low&&e.bph<3&&!e.ecl&&!(e.lureCd>G.time)){ const lights=P.stones.concat(P.lamps); for(const L of lights){ if(!(L.lit>0)||G.time-(L.lureAt||-99)<15||G.time-(L.litAt||0)>2) continue; L.lureAt=G.time; m3HushLow(e,L,3,S('Ooooh. A light...','Ooooh...')); break; } }
  if(e.low){ e.lowT-=dt; const L=e.low; steer(e,L.x+Math.cos(G.time*1.4)*50,L.y-10+Math.sin(G.time*2)*20,e.speed*1.4); e.z=lerp(e.z||0,18,Math.min(1,dt*4)); e.face=turnTo(e.face,angTo(e.x,e.y,L.x,L.y),3*dt); e.state='dizzy';
    if(e.lowT<=0){ e.low=null; e.state='takeoff'; e.st=0.6; } return; }
  if(e.downT>0){ e.downT-=dt; e.state=e.crash?'stuck':'stagger'; e.st=0.2; e.z=Math.max(0,(e.z||0)-dt*260); if(e.downT<=0){ e.crash=false; e.state='takeoff'; e.st=0.6; } return; }
  if(e.state==='takeoff'){ e.st-=dt; e.z=lerp(e.z||0,e.bph>=3&&top>=4?150:80,Math.min(1,dt*3)); if(e.st<=0) e.state='chase'; return; }
  if(e.bph>=1&&e.bph<3) { if(m3HushEclipse(e,dt,p,P,d,a)) return; }
  if(e.bph>=3&&top>=4) return m3HushTug(e,dt,p,P,d,a);
  // moves that run (a dive, the pulse, the dust, the shush)
  switch(e.state){
    case 'diveW': e.st-=dt; if(e.st>0.15) e.face=turnTo(e.face,a,3*dt); e.z=lerp(e.z||0,30,Math.min(1,dt*3)); if(e.st<=0){ e.tele=null; e.state='dive'; e.st=0.5; e.hitP=false; SFX.play('roll'); } return;
    case 'dive': { const s=820*D0.spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s; e.z=20; if(!e.hitP&&d<e.r+p.r+10&&!m3Up()){ if(hurtPlayer(m3Dmg(e,42),e.x,e.y,320)) e.hitP=true; } e.st-=dt; if(e.st<=0){ e.state='takeoff'; e.st=0.6; } return; }
    case 'pulseW': e.st-=dt; if(e.st<=0){ e.tele=null; e.state='recover'; e.st=0.5; const dd=dist(p.x,p.y,e.x,e.y); if(!p.dead&&dd>80&&dd<300&&!m3Bur()&&!m3Dive()){ if(typeof C1!=='undefined') C1.hushT=Math.max(C1.hushT,3); ftext(p.x,p.y-40,S('Shhhh! Your breath is hushed!','Shhh! No breath!'),'#d8c0ff',14); m3Ev('hushed'); } SFX.play('warn'); } return;
    case 'dustW': e.st-=dt; if(e.st<=0){ e.state='recover'; e.st=0.4; } return;
    case 'shushW': e.st-=dt; if(e.st<=0){ e.state='recover'; e.st=0.6; } return;
    case 'recover': e.st-=dt; e.z=lerp(e.z||0,80,Math.min(1,dt*2)); if(e.st<=0) e.state='chase'; return;
  }
  // high up: circle the hall
  e.state='chase'; e.z=lerp(e.z||0,80,Math.min(1,dt*2)); e.orbit=(e.orbit||0)+dt*0.7*(e.orbitDir||1); const Rr=Math.min(C.R*0.55,300); steer(e,C.cx+Math.cos(e.orbit)*Rr,C.cy+Math.sin(e.orbit)*Rr*0.75,e.speed*D0.spd); e.face=turnTo(e.face,a,3*dt);
  e.cd-=dt*D0.cdK; if(e.cd>0) return; e.cd=byDiff(2.4,1.9,1.5);
  if(e.bph>=2&&!(e._shT>G.time)&&Math.random()<0.5){ e._shT=G.time+byDiff(11,9,7.5); return m3HushShush(e,C); }
  const r=Math.random();
  if(r<0.34){ e.state='dustW'; e.st=0.3; for(let i=0;i<3;i++){ const q={x:p.x+(i?rand(-140,140):0),y:p.y+(i?rand(-100,100):0)}; m3Hold(C,q,60); m3Lob(e.x,e.y-(e.z||0),q.x,q.y,{r:70,dur:m3W({},0.8)+i*0.12,col:M3COL.silver,ball:'#f0eef8',br:7,h:60,land:z=>{ m3Cloud(z.x,z.y,{r:70,life:2.4,slow:1,col:'225,222,240'}); if(!player.dead&&!m3Up()&&dist(player.x,player.y,z.x,z.y)<70) { hurtPlayer(m3Dmg(e,14),z.x,z.y,60); player.slowT=Math.max(player.slowT||0,2); } }}); } return; }
  if(r<0.62){ e.state='pulseW'; e.st=0.9; e.tele=null; m3Mark({shape:'donut',x:e.x,y:e.y,r1:80,r2:300,dur:m3W({},0.9),col:M3COL.violet}); m3Say(e,'f_hush',S('Shhhh!','Shhh!'),5); return; }
  e.state='diveW'; e.st=0.8; e.face=a; e.tele=newTele({shape:'line',len:420,w:e.r*1.6,dur:e.st,col:M3COL.red});
}
function m3HushLow(e,L,t,line){ e.lureCd=G.time+t+byDiff(4,6,8); e.low=L; e.lowT=t; e.state='dizzy'; e.tele=null; e.mv=null; e.ecl=null; M3.darkTo=0; e.dazzles=(e.dazzles||0)+1; m3Txt(e,line,'#fff4d8',15); m3Ev('dazzle'); }
// the Great Shush: a wave from her that only a burrowing (or diving) Ash lets pass
function m3HushShush(e,C){ e.state='shushW'; e.st=byDiff(1.4,1.2,1.0); const z=fzAdd('m3shush',{x:e.x,y:e.y,wait:m3W({},byDiff(1.4,1.2,1.0)),spd:300,max:Math.max(C.R*1.6,700),thick:40,dmg:m3Dmg(e,34),r0:60});
  m3Say(e,'f_hush',S('So loud. You\'re always so LOUD.','So LOUD!'),5); SFX.play('warn');
  m3Tip('shush',S('The Great Shush!','The Great Shush!'),S('It is too tall to jump. Burrow in the sand at the edge and let it pass over you.','Too tall to jump! Burrow in the sand!')); return true; }
// the eclipse (phases 2 and 3): she folds her wings over the hall; in the dark she dives into one shadow pool and comes
// out of the other. All three moonstones lit at once ends it (she is dazzled at the last one lit)
function m3HushEclipse(e,dt,p,P,d,a){
  if(e.bph!==1||!P) return false; const D0=foeDiff();
  if(!e.ecl){ e.eclT=(e.eclT==null?4:e.eclT)-dt*D0.atk; if(e.eclT>0||e.state!=='chase') return false;
    e.ecl={t:0,dur:byDiff(8,6,6),pool:0,next:1.2}; M3.darkTo=e.eclDark||0.92; e.state='fold'; m3Say(e,'f_hush',S('Shhh. Sleep now.','Shhh. Sleep.'),4); SFX.play('warn'); m3Ev('eclipse'); return true; }
  const E=e.ecl; E.t+=dt; e.state='fold';
  if(P.stones.every(s=>s.lit>0)){ const last=P.stones.reduce((b,s)=>(s.litAt||0)>(b.litAt||0)?s:b,P.stones[0]); e.ecl=null; e.eclT=byDiff(24,18,14); M3.darkTo=0; e.eclBroken=(e.eclBroken||0)+1; e.x=last.x; e.y=last.y-40; e.z=40; m3HushLow(e,last,3,S('The light! All the lights! Ohhh...','So bright!')); m3Ev('eclipseend'); return true; }
  if(E.t>=E.dur){ e.ecl=null; e.eclT=byDiff(24,18,14); M3.darkTo=0; e.state='takeoff'; e.st=0.6; e.alpha=1; return true; }
  // pool to pool: sink into one, a circle at the other, erupt
  E.next-=dt; e.alpha=E.sunk?0:1;
  if(E.next<=0){ if(!E.sunk){ const q=P.pools[E.pool%P.pools.length]; e.x=q.x; e.y=q.y; e.z=0; E.sunk=true; E.next=byDiff(1.4,1.0,0.9); const o=P.pools[(E.pool+1)%P.pools.length]; m3Mark({x:o.x,y:o.y,r:96,dur:E.next,col:M3COL.violet}); E.out=o; }
    else { E.sunk=false; E.pool++; const o=E.out; e.x=o.x; e.y=o.y; e.z=10; shake(9); SFX.play('boom'); emit(o.x,o.y,26,{col:'80,50,130',glow:false,smin:60,smax:240,lmin:.4,lmax:.8,zmin:2,zmax:5,grow:6});
      if(!p.dead&&!m3Dive()&&!m3Bur()&&dist(p.x,p.y,o.x,o.y)<96+p.r*0.5) hurtPlayer(m3Dmg(e,46),o.x,o.y,380); E.next=byDiff(2.4,1.9,1.6); } }
  return true;
}
// the Tug (phase 4): the Mother hauls her up; the taut leash sweeps the floor; from the gallery the silver ring can be pulled
function m3HushTug(e,dt,p,P,d,a){
  const D0=foeDiff(), C=m3Ctx(e), G0=P&&P.gallery; e.state='hauled';
  const hx=G0?G0.x:C.cx, hy=G0?G0.y+190:C.cy-C.R*0.3; steer(e,hx+Math.sin(G.time*0.8)*60,hy+Math.cos(G.time*0.6)*20,e.speed*0.8); e.z=lerp(e.z||0,150,Math.min(1,dt*1.5)); e.face=turnTo(e.face,a,2*dt);
  if(!(e._whT>G.time)){ e._whT=G.time+9; taunt('f_hush',S('Mother, it hurts. Shhh. It hurts.','Mother, it hurts.')); }
  // the sweep: a silver line round the hall's centre (jump it, or dash through)
  e.swT=(e.swT==null?1.5:e.swT)-dt*D0.atk; if(e.swT<=0&&!(G.fz||[]).some(z=>z.k==='m3sweep')){ e.swT=byDiff(7,5.5,4.5); fzAdd('m3sweep',{x:C.cx,y:C.cy,len:Math.max(C.R,560),a:angTo(C.cx,C.cy,p.x,p.y)+Math.PI*0.7,spin:byDiff(1.1,1.4,1.7)*(Math.random()<0.5?1:-1),w:16,dmg:m3Dmg(e,30),wait:m3W({},0.8),life:byDiff(4,4.5,5),col:'225,232,255',jump:true}); SFX.play('warn'); }
  // the ring on her leash is a Grapple Tail target only from the upper gallery (ride an updraft up there)
  if(e.p2rings) e.p2rings[0].done=!(m3Lvl()>=1||(typeof P3!=='undefined'&&P3.ride));
}
function m3HushCrash(e){ e.downT=byDiff(6,5,4.5); e.crash=true; e.pulls=(e.pulls||0)+1; e.z=0; e.tele=null; for(const z of G.fz||[]) if(z.k==='m3sweep') z.done=true; shake(14); SFX.play('boom'); m3Txt(e,S('PULL! She crashes down!','She crashes down!'),'#ffe066',18); m3Say(e,'f_hush',S('...Oh. The floor is warm.','The floor is warm.'),3); m3Ev('pull'); }
function m3HushKnot(e,K){ K.jerkT=4; K.glow=1; e.jerks=(e.jerks||0)+1; e.downT=byDiff(3.6,3,2.6); e.crash=false; e.tele=null; e.low=null; shake(8); SFX.play('block'); m3Txt(e,S('The leash jerks her down!','Jerk! She falls!'),'#ffe066',16); m3Ev('knot'); }
function m3HushKneel(e){ e.kneel=true; e.mv=null; e.tele=null; e.state='kneel'; e.low=null; e.ecl=null; e.noPhase=true; M3.darkTo=0; e.alpha=1; G.fz=(G.fz||[]).filter(z=>z.k==='m3hushfree'||z.k==='m3hushfoe');
  G.projectiles=G.projectiles.filter(q=>q.owner!=='enemy'); for(const q of G.enemies) if(!q.dead&&q!==e&&(q.type==='f_mothling'||q.type==='m_mothknight')){ q.dead=true; m3Puff(q.x,q.y-16,'235,232,245',10); }
  shake(6); player.iframes=Math.max(player.iframes,3); M3.hushE=e;
  later(1.4,()=>{ if(e.dead) return; const finish=()=>m3HushFinish(e);
    if(e.echo){ finish(); return; }
    if(M3.hook.hushDone){ try{ M3.hook.hushDone(e,finish); }catch(err){ console.error(err); finish(); } return; }
    // the story module's own entry point (x3_story), when it has one
    if(typeof m3sBeat==='function'){ try{ m3sBeat('hush_down',e,finish); }catch(err){ console.error(err); finish(); } return; }
    const B=STORY.bosses.m_hushboss, L=STORY.m_hush_outro||(B&&B.outro&&B.outro.length?B.outro:null)||M3_HUSH_OUTRO(); runDialogue(L,()=>{ scene='play'; finish(); }); }); }
function m3HushFinish(e){
  if(e.dead) return; const k=G.fightSite; e.dead=true; e.hp=0; gainXp(foeXp(e)); G.bossDone[e.type]=true; if(!G.choices.m_hush&&!e.echo) G.choices.m_hush='foe';
  bossFightEnd(false); G.boss=null; G.fightSite=null; G.fightIntro=false; if(k) delete G.siteGuards[k]; M3.darkTo=0;
  if(e.m3room&&AREA&&AREA.rooms&&!e.m3room.solved){ try{ solveRoom(e.m3room,true); }catch(err){} }
  m3Won(e.type); if(M3.hook.hushAfter) try{ M3.hook.hushAfter(e,G.choices.m_hush); }catch(err){ console.error(err); } saveGame(); }
// the foe definition, reusable: o.phases 4 (the Observatory) or 3 (the finale's echo, no Tug), o.shadow (drawn in shadow)
function m3HushDef(o){ o=o||{}; const four=(o.phases||o.maxPh||4)>=4;
  return {boss:true,name:o.name||'Hush',title:o.title||S('on the silver leash','on the leash'),short:o.short||'Hush',
    lv:o.lv||21,hp:o.hp||30000,r:42,speed:140,dmg:42,value:o.value||4100,flying:true,kbRes:0.2,dcol:o.shadow?'80,60,110':'236,232,248',phases:four?[0.75,0.5,0.25]:[0.66,0.33],
    phaseText:four?[[S('The Eclipse!','The eclipse!'),S('She folds her wings and the hall goes dark. Moonfire all three moonstones to end it!','Light all three moonstones!'),['f_hush',S('Shhh. Sleep now.','Shhh.')]],
                     [S('The Great Shush!','The Great Shush!'),S('Burrow in the sand to let the wave pass. Hit a leash knot to jerk her down!','Burrow from the wave! Hit a knot!'),['f_hush',S('So loud. You\'re always so LOUD.','So loud!')]],
                     [S('The Tug!','The Tug!'),S('The Mother pulls her up. Ride an updraft to the gallery, grapple the ring on her leash, and PULL!','Ride up! Grapple her ring! Pull!'),['f_hush',S('Mother, it hurts.','It hurts!')]]]
                   :[[S('The Eclipse!','The eclipse!'),S('Moonfire all three moonstones to end the dark!','Light the moonstones!'),null],[S('The Great Shush!','The Great Shush!'),S('Burrow from the wave. Hit a knot!','Burrow! Hit a knot!'),null]],
    init(e,opt){ if(e.m3init) return; e.m3init=true; m3BossInit(e); e.maxPh=four?4:3; e.echo=!!o.echo; e.shadow=!!o.shadow; e.eclDark=o.eclDark||0.92; e.z=60; e.dazzles=0; e.eclBroken=0; e.jerks=0; e.pulls=0;
      e.m3hp=(opt&&opt.parts)||o.parts||(m3RoomOf(e)&&m3RoomOf(e).parts)||M3.hushParts||null;
      e.p2rings=[{dx:0,dy:0,h:96,need:byDiff(1.2,2,2),repeat:true,done:true,onPull:(r,q,info)=>{ if(q.bph>=3&&info.taut&&Math.random()<0.2) emit(q.x,q.y-60,2,{col:'230,235,255',smin:20,smax:60,lmin:.2,lmax:.4,zmin:1.2,zmax:2}); },then:(r,q)=>{ if(q.bph>=3&&!q.kneel) m3HushCrash(q); }}]; },
    onPhase(e,i){ if(e.maxPh>=4&&i===3){ e.ecl=null; M3.darkTo=0; e.state='takeoff'; e.st=1; m3Tip('tug',S('Pull her down!','Pull!'),S('Ride an updraft up to the gallery, grapple the silver ring on her leash, and hold the button while you walk away.','Ride up, grapple her ring, and pull!')); }
      if(i===2){ for(let k=0;k<byDiff(3,4,4);k++){ const s=spotNear(e.x,e.y,120,260); spawnRune('f_mothling',s.x,s.y,{aggro:true}); } } if(i===1){ e.eclT=2; } },
    ai(e,dt,p){ m3HushAI(e,dt,p); if(e.bph>=2&&!e.kneel&&countType('f_mothling')<byDiff(4,5,6)&&!(e._mlT>G.time)){ e._mlT=G.time+14; const s=spotNear(e.x,e.y,120,260); spawnRune('f_mothling',s.x,s.y,{aggro:true}); } },
    onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt; if(e.kneel) return false;
      if(o.mult===1.02&&e.m3hp){ const K=e.m3hp.knots.find(q=>!(q.jerkT>0)&&dist(q.x,q.y,o.fx!=null?o.fx:player.x,o.fy!=null?o.fy:player.y)<180)||e.m3hp.knots.find(q=>!(q.jerkT>0)); if(K){ m3HushKnot(e,K); a=amt/1.02; } }
      else if(e.low||e.downT>0) a=amt*(e.crash?2:1.5);
      else if(e.ecl&&e.ecl.sunk) return false;
      else if((e.z||0)>40){ a=amt*(h.ranged||h.src==='glaive'||h.src==='whip'||h.src==='moon'?0.5:0.15); if(!(e._hiT>G.time)){ e._hiT=G.time+3; m3Txt(e,S('She is too high! Moonfire a moonstone to bring her down!','Too high! Light a moonstone!'),'#e8f0ff',12); } }
      const gate=(ph,need,frac,txt)=>{ if(e.bph===ph&&need){ const b=a; a=m3Floor(e,a,o,frac); if((a===false||a<b)&&!(e._gtT>G.time)){ e._gtT=G.time+3; m3Txt(e,txt,'#ffd27a',13); } } };
      if(e.maxPh>=4){ gate(0,(e.dazzles||0)<byDiff(1,1,2),0.76,S('Moonfire a moonstone: she cannot resist a light!','Light a moonstone!'));
        gate(1,(e.eclBroken||0)<byDiff(1,1,2),0.51,S('In the dark, Moonfire all three moonstones!','Light all three stones in the dark!'));
        gate(2,(e.jerks||0)<byDiff(1,2,2),0.26,S('Hit a glowing leash knot on the floor!','Hit a leash knot!'));
        gate(3,(e.pulls||0)<byDiff(1,2,2),0.02,S('Up to the gallery! Grapple her ring and pull!','Grapple her ring and pull!')); }
      else { gate(0,(e.dazzles||0)<1,0.67,S('Moonfire a moonstone: she cannot resist a light!','Light a moonstone!')); gate(1,(e.eclBroken||0)<1,0.34,S('In the dark, Moonfire all three moonstones!','Light all three stones!')); gate(2,(e.jerks||0)<1,0.02,S('Hit a glowing leash knot on the floor!','Hit a knot!')); }
      // she is not killed: at the end she sinks down (the choice)
      if(!e.echo&&a!==false&&e.hp-a*((o&&o.mult)||1)<=e.maxHp*0.012){ a=Math.max(0.5,(e.hp-e.maxHp*0.01)/((o&&o.mult)||1)); if(!e.kneel) later(0,()=>{ if(!e.dead&&!e.kneel) m3HushKneel(e); }); }
      return a; },
    draw3d:m3FigHush, draw2d:m3Hush2,
    sheet:c1Sheet([{state:'chase',z:70,label:'high'},{state:'dizzy',z:18,label:'dazzled low'},{state:'diveW',st:0.3,z:40,label:'dive windup'},{state:'dive',z:20,dx:500,label:'dive'},{state:'fold',z:60,label:'eclipse (wings folded)'},{state:'hauled',z:120,bph:3,label:'the tug'},{state:'stuck',z:0,crash:true,label:'crashed'},{state:'kneel',z:0,kneel:true,label:'sinks down'}])};
}
defineFoe('m_hushboss',m3HushDef({}));
M3ROOM.m_hushboss={
  build(R,A){ const D={R,type:'m_hushboss'}, cs=A.cave.cell, cell=(i,j)=>({x:R.x0+(i+0.5)*cs,y:R.y0+(j+0.5)*cs});
    const rx=(R.x1-R.x0)/2, ry=(R.y1-R.y0)/2, gal={x:cell(15,0).x,y:cell(15,0).y+cs*0.5};
    D.parts=m3HushParts(R.cx,R.cy+20,Math.min(rx,ry),{A,stones:[[R.cx,R.cy-ry*0.36],[R.cx+rx*0.36,R.cy+ry*0.42],[R.cx-rx*0.36,R.cy+ry*0.42]],
      pools:[[cell(5,11).x,cell(5,11).y],[cell(25,11).x,cell(25,11).y]],knots:[[R.cx-rx*0.42,R.cy-ry*0.18],[R.cx+rx*0.42,R.cy+ry*0.12]],
      lamps:(G.flags.m_lamps_ally||G.flags.m_vesper_ally)?[[R.x0+cs*3,R.cy+ry*0.55],[R.x1-cs*3,R.cy+ry*0.55]]:[],gallery:gal,dome:{x:R.cx,y:R.y0}});
    return D; },
  reset(D){ M3.darkTo=0; for(const S0 of D.parts.stones){ S0.lit=0; S0.lureAt=-99; } },
  tick(D,dt){ m3HushPartsTick(D.parts,dt); const e=G.boss; if(!e||e.dead||e.type!=='m_hushboss') return;
    // the allies: lamplighters light a lamp post every 15 s; Vesper lights one every 10 s and knocks a mothling down every 8 s
    const P=D.parts; if(P.lamps.length&&!e.kneel){ const al=G.flags.m_vesper_ally?10:15; D.alT=(D.alT==null?4:D.alT)-dt; if(D.alT<=0){ D.alT=al; const L=P.lamps[(D.alN=(D.alN||0)+1)%P.lamps.length]; m3LampLight(L); if(G.flags.m_vesper_ally) taunt('c_vesper',S('Over here, moth! Pretty light! Remember?','Over here, moth! Pretty light!')); else taunt('m_esme',S('Over HERE, dear! A lovely lamp!','Over here! A lovely lamp!')); } }
    if(G.flags.m_vesper_ally&&!e.kneel){ D.vmT=(D.vmT==null?8:D.vmT)-dt; if(D.vmT<=0){ D.vmT=8; const q=G.enemies.find(f=>!f.dead&&f.type==='f_mothling'); if(q){ m3Puff(q.x,q.y-16,'255,170,90',12); damageEnemy(q,q.hp+5,{src:'fire'}); } } } },
  ground(D,t){ m3HushPartsGround(D.parts,t); },
  tall(D,list){ m3HushPartsTall(D.parts,list); const e=G.boss; if(e&&!e.dead&&(e.type==='m_hushboss')&&!e.kneel){ if(!D.lit) D.lit={flying:true,draw:()=>{ const b=G.boss; if(b&&b.type==='m_hushboss') m3DrawLeash(b,D.parts); }}; D.lit.x=e.x; D.lit.y=e.y-1; list.push(D.lit); } }
};
// her look: a barn-sized white moth, frost in her fur, two painted violet eyes on her wings, two real ones, blinking
function m3FigHush(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/42*1.9, face=t3Turn(e,e.face,st==='dive'?14:5), fx=e.x, fy=e.y+e.r*0.45, inS=foSt(e), z=e.z||0, sh=!!e.shadow;
  const fur=fl?'#ffffff':sh?'#3a2e52':foT(e,'#f2eef8'), furD=sh?'#241c38':foT(e,'#cfc8e0'), wing=sh?'#4a3c68':foT(e,'#f8f6ff'), wingD=sh?'#2a2040':foT(e,'#c8c0dc'), eyeP=sh?'#c8a8ff':'#7a4ac0', dead=foDeath(e), hurt=m3Hurt(e);
  const fold=st==='fold'||st==='kneel'?1:0, down=st==='stuck'||st==='stagger'||st==='kneel', low=st==='dizzy', dive=st==='dive'||st==='diveW';
  const P=foEase(e,'_fhu',foTg(fold,down?1:0,dive?1:0),dt,6); const F=P[0], Dn=P[1], Dv=P[2], flap=(1-F)*(1-Dn*0.7)*Math.sin(t*(low?3:5));
  foShadow(fx,fy,40*k,z>30?0.2:0.32);
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,20,0,dead*1.2,0,0,0,-dead*10); else foSet(FOB,20,Dv*0.4-Dn*0.1,flap*0.03+(low?Math.sin(t*2)*0.08:0),0);
  const th=lerp(0.25+flap*0.5,1.35,F)-Dn*0.3, span=lerp(56,30,F), sweep=lerp(4,-14,F);
  for(const sd of [-1,1]){ c1Wing(sd,6,sd*6,30,span,30,th,sweep,wing,wingD,9,eyeP); c1Wing(sd,-10,sd*5,24,span*0.7,22,th*0.85,sweep+8,wingD,null,5,sh?'#8a6ab8':'#b89ae8'); }
  foE(-6,0,26,18,11,10,fur); foE(-18,0,22,10,8,7,furD); for(let i=0;i<4;i++) foN(-10-i*4,-9,27,-10-i*4,9,27,0.9,furD,0.02);
  foB(10,0,30,13,fur); foE(10,0,38,12,12,7,fur,0,0,0,0.01);
  // frost in her fur (not on the echo), the real eyes (they blink slowly), antennae like silver ferns
  if(!sh) for(let i=0;i<6;i++) foD(4+(i%3)*5,(i<3?-1:1)*(4+i%2*3),34+(i%2)*4,1,'#dff0ff',0.04);
  const blink=(t%4.5)>4.3?0.2:1; for(const sd of [-1,1]){ foE(20,sd*5.5,32,2.4,3.2,3.6*blink,sh?'#f0e8ff':'#2a2440',0,0,0,0.05); if(blink>0.5) foD(21.6,sd*5.2,33.4,0.9,'#ffffff',0.06);
    foL(18,sd*4,40,24,sd*12,54,0.8,sh?'#a898d0':'#d8d8ec',0.6); for(let j=1;j<4;j++) foN(19+j*1.5,sd*(4+j*2.6),40+j*4.6,19+j*1.5+2,sd*(6+j*2.6),40+j*4.6-1,0.5,'#e8e8f8',0.07); }
  if(low) foGlow(14,0,34,40,'255,240,200',0.35,false); if(sh) foGlow(0,0,28,60,'120,80,190',0.35,false);
  foEnd(30); e._t3top=foTop(fy,60,k,z);
}
function m3Hush2(e,fl){
  const st=e.state, t=e.t||0, sh=!!e.shadow, fold=st==='fold'||!!e.kneel, low=st==='dizzy', dive=st==='dive', dw=st==='diveW', down=st==='stuck'||st==='stagger'||!!e.crash, haul=st==='hauled';
  const x=e.x, y=e.y-(e.z||0)-24, r=e.r*1.25, dead=e.deathT>0?clamp(e.deathT/0.8,0,1):0; ctx.save(); c1Shadow2(e,1.4); if(dead) ctx.globalAlpha=1-dead*0.6;
  // the tug: the silver leash runs straight up to the Mother
  if(haul){ ctx.strokeStyle='rgba(225,230,255,.9)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.sin(t*3)*8,y-300); ctx.stroke(); }
  ctx.save(); ctx.translate(x,y); ctx.rotate(e.face+Math.PI/2+(down?0.5:0));
  const ww=fold?0.35:dive?0.6:dw?1.05:low?0.8:haul?0.9+Math.sin(t*16)*0.2:0.95+Math.sin(t*6)*0.12, sw=dive?0.9:dw?-0.5:low?0.25:0;
  const wc=fl?'#ffffff':sh?'#4a3c68':'#f8f6ff', wd=sh?'#3a2e56':'#e4def4', sp=sh?'#c8a8ff':'#7a4ac0';
  for(const s of [-1,1]){
    c1E2(s*r*0.5*ww,r*0.3,r*0.5*ww+4,r*0.38,wd,s*(0.4+sw*0.5),2);
    c1E2(s*r*0.78*ww,-r*0.12,r*0.82*ww+4,r*0.52,wc,s*(-0.45+sw),2);
    if(!fold){ ctx.fillStyle=sp; ctx.beginPath(); ctx.arc(s*r*0.9*ww,-r*0.14,r*0.2,0,TAU); ctx.fill(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(s*r*0.9*ww-1.5,-r*0.18,r*0.07,0,TAU); ctx.fill(); } }
  if(dive){ ctx.strokeStyle='rgba(235,235,255,.6)'; ctx.lineWidth=2; for(const s of [-1,0,1]){ ctx.beginPath(); ctx.moveTo(s*r*0.35,r*0.7); ctx.lineTo(s*r*0.35,r*1.5); ctx.stroke(); } }
  c1E2(0,r*0.08,r*0.2,r*0.5,fl?'#fff':sh?'#3a2e52':'#f2eef8',0,2);
  c1E2(0,-r*0.42,r*0.2,r*0.18,fl?'#fff':sh?'#3a2e52':'#f6f2fc',0,1.8);
  ctx.strokeStyle=C1OL(); ctx.lineWidth=1.6; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*4,-r*0.55); ctx.quadraticCurveTo(s*r*0.3,-r*0.85,s*r*0.42,-r*0.95); ctx.stroke(); }
  if(down||low){ ctx.strokeStyle='#1a1018'; ctx.lineWidth=1.8; for(const s of [-1,1]){ const ex=s*6, ey=-r*0.45; ctx.beginPath(); ctx.moveTo(ex-2.5,ey-2.5); ctx.lineTo(ex+2.5,ey+2.5); ctx.moveTo(ex+2.5,ey-2.5); ctx.lineTo(ex-2.5,ey+2.5); ctx.stroke(); } }
  else { c1Eye2(-6,-r*0.45,3,-Math.PI/2); c1Eye2(6,-r*0.45,3,-Math.PI/2); }
  ctx.restore();
  // dazzled or crashed: stars round her head
  if(low||down){ ctx.fillStyle='#ffe066'; for(let i=0;i<3;i++){ const a=t*4+i*TAU/3; ctx.beginPath(); ctx.arc(x+Math.cos(a)*r*0.5,y-r*0.7+Math.sin(a)*r*0.18,3.2,0,TAU); ctx.fill(); } }
  if(low){ ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,250,220,.18)'; ctx.beginPath(); ctx.arc(x,y,r*1.1,0,TAU); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
  ctx.restore();
}
const M3HUSH=window.M3HUSH={partsOff:m3HushPartsOff,parts:m3HushParts,def:m3HushDef,ai:m3HushAI,draw3d:m3FigHush,draw2d:m3Hush2,hitCircles:m3HushHC,leash:m3DrawLeash,outcome:m3HushOutcome};

// ================= 10. the minibosses: Lady Zapp, Big Fin, Prism, Duke Umberwing
// Each one lives in a dungeon room (room field m3boss:'<type>', kind 'miniboss'); the bar shows it, its fall ends the
// fight (the outro, then the room is solved and its chest opens). Each has one trick the fight needs.
// a gate list: [[frac, done, text]]: health stays above frac until done (the text says what to do, now and then)
function m3Gate(e,a,o,list){
  for(const g of list){ if(g[1]) continue; const b=a; a=m3Floor(e,a,o,g[0]); if((a===false||a<b)&&g[2]&&!(e._gtT>G.time)){ e._gtT=G.time+3.2; m3Txt(e,g[2],'#ffd27a',13); } if(a===false) return false; }
  return a; }
// a tip and a little line when a hit does almost nothing
function m3Weak(e,key,text,simple){ if(e[key]>G.time) return; e[key]=G.time+2.6; m3Txt(e,S(text,simple),'#d8ecff',13); }

// ---------- Lady Zapp, the Lantern Eel (m_zapp): the Lantern Eel's Hall in Drowned Lumen
// A long eel in a deep pool, a lantern on her chin. Zap Ring (a ring round her; swim out of it), Bite (a line), Lantern
// Flash (it blinds 1 s). Under the water only a DIVING Ash hurts her much. THE TRICK: three lamps stand on ledges just
// above the water. Light one (any fire, from the surface) and she rises to it to gaze at her own reflection: her head is
// out of the water 3 s (x1.5 from anything). Gate: she cannot fall until she was mesmerised 2 times (3 on Hard).
c1Lines('m_zapp','m_zapp_intro','m_zapp_outro',
  [['narr',S('The hall is one big pool. Three dark lamps stand on little ledges over the water. Under it, something long glows and crackles.','A big pool. Three dark lamps. Something glows under the water.')],
   ['m_zapp',S('Bzzzt! Who swims in MY pool? Oh, a little dragon! You will look lovely all lit up.','Bzzzt! Who is in my pool?')],
   ['iska',S('Eels love their own glow, little ember. Give her something shiny to look at.','Give her something shiny to look at.')]],
  [['narr',S('Lady Zapp floats up, all her sparks gone quiet, and stares at the lamp light on the water.','Lady Zapp floats up. Her sparks go quiet.')],
   ['m_zapp',S('Ooh, shiny. Shiny me. ...Fine, take your key. I only want to look at the lamps now.','Shiny me. Take the key.')]]);
M3ROOM.m_zapp={
  build(R,A){ const c=A.cave, D={R,type:'m_zapp',deep:[],lamps:[],x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};
    c1Cells(R,(k,i,j,x,y)=>{ if(c.grid[k]!==0) return; if(c.typ[k]===TY.deep){ D.deep.push({x,y}); D.x0=Math.min(D.x0,x); D.x1=Math.max(D.x1,x); D.y0=Math.min(D.y0,y); D.y1=Math.max(D.y1,y); }
      else if(c.typ[k]===15) D.lamps.push(m3AddLamp(x,y+12,{h:30,dur:9,R:150,ledge:true})); });
    if(!D.deep.length){ D.x0=R.x0+120; D.x1=R.x1-120; D.y0=R.y0+110; D.y1=R.y1-110; }
    if(!D.lamps.length) for(const [u,v] of [[0.5,0.05],[0.06,0.5],[0.94,0.5]]) D.lamps.push(m3AddLamp(R.x0+(R.x1-R.x0)*u,R.y0+(R.y1-R.y0)*v+12,{h:30,dur:9,R:150}));
    D.cx=(D.x0+D.x1)/2; D.cy=(D.y0+D.y1)/2;
    // where she comes up for each lamp: the deep water nearest it
    for(const L of D.lamps){ let best=null, bd=1e18; for(const q of D.deep){ const d2=dist2(q.x,q.y,L.x,L.y); if(d2>2000&&d2<bd){ bd=d2; best=q; } } L.wx=best?best.x:clamp(L.x,D.x0,D.x1); L.wy=best?best.y:clamp(L.y,D.y0,D.y1);
      L.onLit=Lz=>{ const e=G.boss; if(e&&!e.dead&&e.type==='m_zapp') m3ZappLure(e,Lz); }; }
    D.vents=[{x:D.cx+(D.x1-D.x0)*0.22,y:D.cy+(D.y1-D.y0)*0.18,r:30}];
    return D; },
  reset(D){ for(const L of D.lamps){ L.lit=0; if(L.L) L.L.i=0; } },
  tick(D,dt){ for(const L of D.lamps) FZK.m3lamp.tick(L,dt); for(const v of D.vents) FZK.m3vent.tick(v,dt); },
  ground(D,t){ for(const v of D.vents) m3DrawVent(v,t,false);
    // the lamps' light on the water
    ctx.save(); ctx.globalCompositeOperation='lighter'; for(const L of D.lamps) if(L.lit>0){ ctx.globalAlpha=0.35+0.1*Math.sin(t*5+L.x); ctx.drawImage(foGlowSpr('255,210,120'),L.wx-60,L.wy-40,120,80); } ctx.restore(); },
  tall(D,list){ for(const L of D.lamps){ if(!L.it) L.it={x:L.x,y:L.y,draw:()=>m3DrawLamp(L)}; list.push(L.it); } },
  under(D,t){ for(const v of D.vents) m3DrawVent(v,t,true); }
};
function m3ZappLure(e,L){ if(e.state==='mesmer'||e.state==='toLamp'||e.dead) return; if(e.lureCd>G.time){ m3Txt(e,S('She is too cross to look right now!','Not now! Try again soon.'),'#d8ecff',12); return; } e.mv=null; e.tele=null; e.lure=L; e.state='toLamp'; e.st=2.6; m3Ev('lure');
  m3Say(e,'m_zapp',S('Ooh... what is that shiny thing?','Ooh... shiny!'),3); }
function m3ZappHold(e,D){ if(!D) return; e.x=clamp(e.x,D.x0-12,D.x1+12); e.y=clamp(e.y,D.y0-12,D.y1+12); }
function m3ZappAI(e,dt,p){
  p=p||player; const F=foeDiff(), D=m3RoomOf(e), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), dive=m3Dive(); e.dx=e.dy=0;
  // the body trails behind the head (for the figure and the hit circles)
  const tr=e.tr||(e.tr=[]); if(!tr.length||dist(tr[0].x,tr[0].y,e.x,e.y)>7){ tr.unshift({x:e.x,y:e.y}); if(tr.length>11) tr.pop(); }
  const up=e.state==='mesmer'; e.sub=!up; e.alpha=up||dive?1:0.55;
  if(D) m3ZappHold(e,D);
  switch(e.state){
    case 'toLamp': { const L=e.lure; e.st-=dt; if(!L){ e.state='chase'; return; } steer(e,L.wx,L.wy,e.speed*1.7*F.spd); if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),7*dt);
      if(dist(e.x,e.y,L.wx,L.wy)<26||e.st<=0){ e.state='mesmer'; e.st=byDiff(3.8,3,2.6); e.mes=(e.mes||0)+1; e.face=angTo(e.x,e.y,L.x,L.y); m3Ev('mesmer');
        m3Txt(e,S('She stares at her reflection!','She is looking at herself! Hit her!'),'#ffe066',15); m3Say(e,'m_zapp',S('Ooh, shiny. Shiny me.','Shiny me.'),2); emit(e.x,e.y,16,{col:'200,235,255',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:4}); } return; }
    case 'mesmer': { const L=e.lure; e.st-=dt; if(L) e.face=turnTo(e.face,angTo(e.x,e.y,L.x,L.y),4*dt); if(e.st<=0){ e.state='dive'; e.st=0.5; e.lure=null; e.lureCd=G.time+byDiff(9,12,14); if(L){ L.lit=0; if(L.L) L.L.i=0; } m3Say(e,'m_zapp',S('Hey! Stop looking at me while I look at me!','Hey!'),3); } return; }
    case 'dive': e.st-=dt; if(e.st<=0){ e.state='recover'; e.st=0.6; } return;
    case 'zapW': e.st-=dt; if(e.st<=0){ e.tele=null; e.state='zap'; e.st=0.35; const R=e.zr||150; shake(3); SFX.play('cast');
        for(let i=0;i<24;i++){ const an=i/24*TAU; emit(e.x+Math.cos(an)*R,e.y+Math.sin(an)*R*0.86,1,{col:'210,240,255',smin:20,smax:80,lmin:.15,lmax:.35,zmin:1.2,zmax:2.4,drag:4}); }
        if(d<R+p.r&&!m3Up()){ if(hurtPlayer(m3Dmg(e,22),e.x,e.y,180)) m3Zap(byDiff(0.35,0.55,0.7)); } } return;
    case 'zap': e.st-=dt; if(e.st<=0){ e.state='recover'; e.st=0.6; } return;
    case 'biteW': e.st-=dt; if(e.st>0.12) e.face=turnTo(e.face,a,3.5*dt); if(e.st<=0){ e.tele=null; e.state='bite'; e.st=0.32; e.hitP=false; SFX.play('slash'); } return;
    case 'bite': { const s=820*F.spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s; if(D){ const nx=e.x+e.dx*dt, ny=e.y+e.dy*dt; if(nx<D.x0-30||nx>D.x1+30||ny<D.y0-30||ny>D.y1+30){ e.dx=e.dy=0; } }
      if(!e.hitP&&d<e.r+p.r+14&&!m3Up()){ if(hurtPlayer(m3Dmg(e,27),e.x,e.y,260)) e.hitP=true; }
      e.st-=dt; if(e.st<=0){ e.state='recover'; e.st=0.7; } return; }
    case 'flashW': e.st-=dt; e.glow=1-e.st/0.8; if(e.st<=0){ e.tele=null; e.glow=0; e.state='recover'; e.st=0.6; SFX.play('cast'); flashA=Math.max(flashA||0,0.25); flashCol='230,245,255';
        if(d<520&&!m3Bur()){ C1.blindT=Math.max(C1.blindT,byDiff(0.6,1,1.2)); ftext(p.x,p.y-40,S('Too bright!','Too bright!'),'#f0f8ff',14); } } return;
    case 'recover': e.st-=dt; if(e.st<=0) e.state='chase'; break;
  }
  if(e.state!=='chase') return;
  // swim: a diving Ash is chased under the water; otherwise she lurks in the water near him
  let tx, ty; e.orbit=(e.orbit||rand(0,TAU))+dt*1.3*(e.orbitDir||1);
  if(dive){ tx=p.x+Math.cos(e.orbit)*70; ty=p.y+Math.sin(e.orbit)*60; }
  else { const cx=D?clamp(p.x,D.x0+40,D.x1-40):p.x, cy=D?clamp(p.y,D.y0+40,D.y1-40):p.y; tx=cx+Math.cos(e.orbit)*90; ty=cy+Math.sin(e.orbit)*70; }
  steer(e,tx,ty,e.speed*F.spd); if(Math.hypot(e.dx,e.dy)>5) e.face=turnTo(e.face,Math.atan2(e.dy,e.dx),5*dt);
  if(Math.random()<dt*0.3) e.orbitDir=-(e.orbitDir||1);
  e.cd-=dt*F.cdK; if(e.cd>0) return; e.cd=rand(1.6,2.6);
  const r=Math.random();
  if((dive&&d<240)||(d<170&&r<0.45)){ e.state='zapW'; e.st=m3W({},0.9); e.zr=150; e.tele=newTele({shape:'circle',r:e.zr,dur:e.st,col:'170,220,255'}); return; }
  if(d<330&&r<0.8){ e.state='biteW'; e.st=m3W({},0.6); e.face=a; e.tele=newTele({shape:'line',len:300,w:42,dur:e.st,col:M3COL.red}); return; }
  if(d<560){ e.state='flashW'; e.st=m3W({},0.8); e.tele=newTele({shape:'circle',r:70,dur:e.st,col:'255,240,160'}); m3Say(e,'m_zapp',S('Bzzzt! Look at my lantern!','Bzzzt!'),5); }
}
M3HC.m_zapp=e=>{ const L=e._hc||(e._hc=[{},{},{},{}]); let n=0; const up=e.state==='mesmer';
  m3HS(L,n++,{x:e.x,y:e.y,r:e.r+(up?6:0),m:up?2:1});
  const tr=e.tr||[]; for(const i of [3,6,9]) if(tr[i]) m3HS(L,n++,{x:tr[i].x,y:tr[i].y,r:12,m:0.7});
  L.length=n; return L; };
defineFoe('m_zapp',{mini:true,name:'Lady Zapp',title:S('the Lantern Eel','the lantern eel'),short:'Lady Zapp',
  lv:19,hp:8500,r:16,speed:190,dmg:27,value:900,swim:true,kbRes:0,dcol:'150,210,250',
  ai:m3ZappAI,
  init(e,opt){ m3MiniInit(e,opt); e.mes=0; e.cd=1.4; e.state='chase'; e.sub=true; e.tr=[]; },
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.state==='mesmer') a=amt*1.5;
    else if(!m3Dive()&&h.src!=='moon'){ a=amt*0.15; m3Weak(e,'_dvT','She is under the water! Light a lamp, or dive!','Light a lamp! Or dive!');
      m3Tip('zapp',S('Lady Zapp','Lady Zapp'),S('She loves her own glow. Light a lamp on a ledge with fire and she comes up to look at herself. Or dive and fight her under the water.','Light a lamp with fire. She comes up to look!')); }
    return m3Gate(e,a,o,[[0.5,e.mes>=1,S('Light a lamp! She loves shiny things.','Light a lamp!')],[0.02,e.mes>=byDiff(2,2,3),S('Light another lamp!','Light a lamp!')]]); },
  onDeath(e){ m3MiniDone(e); emit(e.x,e.y,26,{col:'200,235,255',smin:50,smax:200,lmin:.3,lmax:.8,zmin:1.4,zmax:3}); },
  draw3d:m3FigZapp, draw2d:m3Zapp2,
  sheet:c1Sheet([{state:'chase',sub:true,label:'swim'},{state:'chase',sub:true,dx:200,label:'swim fast'},{state:'zapW',st:0.4,sub:true,label:'zap ring'},{state:'biteW',st:0.3,sub:true,label:'bite'},{state:'flashW',st:0.2,glow:0.8,sub:true,label:'flash'},{state:'mesmer',label:'mesmerised'},{state:'mesmer',deathT:0.3,label:'death'}])});
function m3FigZapp(e,fl){
  const g=foG(), dt=foDt(e), t=e.t||0, st=e.state, k=e.r/16, face=t3Turn(e,e.face,8), fx=e.x, fy=e.y+e.r*0.3, dead=foDeath(e), hurt=m3Hurt(e);
  const up=st==='mesmer'||(st==='dive'&&e.st>0.2), zap=st==='zapW'||st==='zap', bite=st==='bite'||st==='biteW';
  const s0=fl?'#ffffff':foT(e,'#3a74a8'), s1=foT(e,'#1e4a78'), belly=foT(e,'#bfe6f2'), fin=foT(e,'#7ad0f0'), lamp=st==='flashW'||e.glow>0?'#ffffff':'#fff0a0';
  let H=up?16:2; const P=foEase(e,'_fz',foTg(H),dt,8); H=P[0];
  // ripples where the head breaks the water
  if(up){ g.save(); g.strokeStyle='rgba(225,248,255,.6)'; g.lineWidth=1.5; for(let i=0;i<2;i++){ const rr=(14+((t*1.4+i*0.5)%1)*20)*k; g.beginPath(); g.ellipse(fx,fy,rr,rr*0.42,0,0,TAU); g.stroke(); } g.restore(); }
  foBegin(fx,fy,face,k,fl,0); if(dead) foSet(FOB,6,0,dead*1.2,0,0,0,-dead*6);
  // the body: from the trail (local to the head), or a wavy line behind her in the sheet
  const tr=e.tr, N=9, c=Math.cos(e.face), s=Math.sin(e.face), pts=FOZP;
  for(let i=0;i<=N;i++){ let x, y; const q=tr&&tr.length>N?tr[Math.min(tr.length-1,i)]:null;
    if(q&&i>0){ const dx=q.x-e.x, dy=q.y-e.y; x=(dx*c+dy*s)/k; y=(-dx*s+dy*c)/k; } else { x=-i*6.2; y=Math.sin(t*5-i*0.8)*i*0.45; }
    const u=i/N; pts[i*3]=x; pts[i*3+1]=y; pts[i*3+2]=lerp(H,1.8,clamp(u*2.2,0,1)); }
  pts[0]=0; pts[1]=0;
  for(let i=N-1;i>=0;i--){ const a=i*3, b=a+3, r1=lerp(5.4,2.2,i/N), r2=lerp(5.4,2.2,(i+1)/N); foL(pts[a],pts[a+1],pts[a+2],pts[b],pts[b+1],pts[b+2],r1,i%2?s0:s1,r2); }
  for(let i=2;i<N;i+=2){ const a=i*3; foQ([pts[a],pts[a+1],pts[a+2]+3.4, pts[a]-3.6,pts[a+1],pts[a+2]+6.4, pts[a]-6.2,pts[a+1],pts[a+2]+3],fin,s1,0.02); }
  // the head, the jaw, the eyes and the chin lantern
  const hz=H+1.5, jaw=bite?1:zap?0.5:0.15;
  foE(3,0,hz,7,5.2,4.4,s0,up?-0.3:0,0,0,0.01); foE(4.4,0,hz-2.6-jaw*1.4,5.6,4,1.6,belly,0.2+jaw*0.4);
  if(jaw>0.4){ for(let i=0;i<4;i++) foD(7+i*0.9,-2+i*1.3,hz-2.2,0.6,'#ffffff',0.05); }
  for(const sd of [-1,1]){ foD(6,sd*3,hz+1.8,1.6,'#e8f8ff',0.03); foD(6.6,sd*3.1,hz+1.8,0.75,'#14283a',0.04); foD(6.7,sd*2.8,hz+2.3,0.35,'#ffffff',0.05); }
  foQ([0,0,hz+3.6, -4,0,hz+7, -6,0,hz+3.4],fin,s1,0.02);
  const lx=12, lz=hz-6+Math.sin(t*3)*0.8; foL(7.6,0,hz-3,lx,0,lz+2,0.7,s1,0.5,0.03); foB(lx+0.4,0,lz,2.6,lamp,0.05); foD(lx+0.4,-0.6,lz+1,0.9,'#ffffff',0.07);
  foGlow(lx,0,lz,(st==='flashW'?22+e.glow*20:13)*1,'255,236,150',st==='flashW'?0.9:0.6,true);
  // sparks when she zaps
  if(zap||hurt>0.3) for(let i=0;i<5;i++){ const a=t*30+i*1.7, r=8+((i*13)%5); foN(Math.cos(a)*r-6,Math.sin(a)*r,4+i,Math.cos(a+0.5)*(r+4)-6,Math.sin(a+0.5)*(r+4),6+i,0.5,'#e8f6ff',0.06); }
  if(up) for(let i=0;i<3;i++) foD(2+Math.cos(t*4+i*2.1)*7,Math.sin(t*4+i*2.1)*7,hz+9,0.9,'#ffe066',0.07);
  foEnd(hz*0.6); e._t3top=foTop(fy,hz+10,k);
}
const FOZP=new Float32Array(33);
function m3Zapp2(e,fl){
  const r=e.r, f=e.face, t=e.t||0, up=e.state==='mesmer', tr=e.tr||[]; ctx.save(); ctx.globalAlpha*=up?1:0.85;
  ctx.lineCap='round'; ctx.strokeStyle=C1OL(); ctx.lineWidth=12; ctx.beginPath(); ctx.moveTo(e.x,e.y);
  for(let i=1;i<10;i++){ const q=tr[i]||{x:e.x-Math.cos(f)*i*7+Math.sin(t*5-i)*2,y:e.y-Math.sin(f)*i*7}; ctx.lineTo(q.x,q.y); } ctx.stroke(); ctx.strokeStyle=fl?'#fff':'#3a74a8'; ctx.lineWidth=9; ctx.stroke(); ctx.strokeStyle='#7ad0f0'; ctx.lineWidth=2; ctx.stroke();
  ctx.translate(e.x,e.y-(up?14:0)); ctx.rotate(f); c1E2(0,0,r*0.75,r*0.5,fl?'#fff':'#3a74a8',0,1.6); c1Eye2(r*0.35,-r*0.25,2.2,0); c1Eye2(r*0.35,r*0.25,2.2,0);
  ctx.strokeStyle='#1e4a78'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(r*0.6,0); ctx.quadraticCurveTo(r*1.1,0,r*1.2,r*0.3); ctx.stroke();
  ctx.fillStyle='#fff0a0'; ctx.beginPath(); ctx.arc(r*1.25,r*0.38,3.4,0,TAU); ctx.fill(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.6; ctx.drawImage(foGlowSpr('255,236,150'),r*1.25-14,r*0.38-14,28,28); ctx.restore();
}

// ---------- Big Fin, the Sandshark Matriarch (m_bigfin): the Fin Pit in the Sandworm Burrows
// The biggest Sand Shark: a scarred fin and a gold tooth. Lunge (a red line), Fin Slice (she circles fast and her fin
// cuts), Sand Spray (a cone that slows). Under the sand nothing can touch her. THE TRICK: a Ground Pound on sand within
// 200 px forces her up, stunned 2 s; or burrow, chase her fin and POP UP under her (x1.5). Gate: she cannot fall until
// she was forced up 2 times (3 on Normal and Hard).
c1Lines('m_bigfin','m_bigfin_intro','m_bigfin_outro',
  [['narr',S('The pit is all soft sand. A huge fin rises out of it, with a scar across it, and slides round and round you.','Soft sand. A huge fin goes round and round you.')],
   ['m_bigfin',S('CHOMP! Nobody burrows in MY sand! Nobody!','CHOMP! This is MY sand!')],
   ['iska',S('She hides under the sand. Shake the ground, little ember, and she has to come up.','Shake the ground! She has to come up.')]],
  [['narr',S('Big Fin flops onto the sand, too tired to dive.','Big Fin flops down. She is too tired to dive.')],
   ['m_bigfin',S('Fine. FINE. You may burrow in my sand. On Tuesdays. Wipe your claws.','Fine. You can dig here. Sometimes.')]]);
M3ROOM.m_bigfin={ build(R,A){ return {R,type:'m_bigfin'}; } };
function m3FinAI(e,dt,p){
  if(m3Bur()&&!(e._burT>G.time)){ e._burT=G.time+9; m3Say(e,'m_bigfin',S('Nobody burrows in MY sand!','My sand!'),4); }
  const s0=e.state; m3SharkAI(e,dt,p);
  if(s0==='finUp'&&e.state==='lunge') m3Say(e,'m_bigfin',S('CHOMP!','CHOMP!'),5);
  const D=m3Ctx(e); if(D.rect){ e.x=clamp(e.x,D.x0+e.r,D.x1-e.r); e.y=clamp(e.y,D.y0+e.r,D.y1-e.r); }
}
defineFoe('m_bigfin',{mini:true,name:'Big Fin',title:S('the Sandshark Matriarch','the big sand shark'),short:'Big Fin',
  lv:20,hp:13000,r:24,speed:230,dmg:28,value:1000,kbRes:0.4,dcol:'160,160,180',
  ai:m3FinAI,
  init(e,opt){ m3MiniInit(e,opt); m3SharkInit(e); e.homeX=e.x; e.homeY=e.y; e.outs=0;
    const p0=e.onPound, q0=e.onPop;
    e.onPound=(q,info)=>{ const was=q.under; p0(q,info); if(was&&!q.under){ q.outs++; m3Say(q,'m_bigfin',S('Hey! Who knocked?!','Hey!'),3); } };
    e.onPop=q=>{ q0(q); q.outs++; m3Txt(q,S('Popped out from under her!','Pop!'),'#ffe066',15); }; },
  onHurt(e,amt,o){ if(e.under) return false; let a=amt;
    if(e.popped&&G.time-e.popped<2.4) a=amt*1.5; else if(e.downT>0||e.state==='stuck') a=amt*1.3;
    return m3Gate(e,a,o,[[0.5,e.outs>=1,S('Ground Pound the sand near her fin! Or burrow and pop up under her.','Pound the sand! Or pop up!')],[0.02,e.outs>=byDiff(2,3,3),S('Make her come up again!','Make her come up!')]]); },
  onDeath(e){ m3MiniDone(e); m3SandBurst(e.x,e.y,30); },
  draw3d:m3FigShark, draw2d:m3Shark2,
  sheet:c1Sheet([{state:'chase',under:true,label:'fin'},{state:'finUp',st:0.3,under:true,label:'fin up'},{state:'lunge',dx:600,label:'lunge'},{state:'spray',st:0.2,label:'sand spray'},{state:'flop',label:'flop'},{state:'stuck',downT:1,label:'stunned'},{state:'stuck',deathT:0.3,label:'death'}])});

// ---------- Prism, the Glass Lion (m_prism): Prism's Hall in the Mirror Temple
// A lion of clear glass with a mane of crystal spikes. Pounce (a line), Mane Shards (a ring: jump), Rainbow Roar (three
// coloured beams that sweep: jump them). His glass armour shrugs off hits (x0.3) and bounces arrows. THE TRICKS: Blaze
// heats the glass (1 s) and it cracks for 4 s (any hit x2); the hammer and a Ground Pound chip it (3 chips, 2 on Easy,
// crack it). A moonbeam from the room's mirror (Moonfire its crystal, turn the mirror) through him blinds him 2 s.
// Gate: he cannot drop below half until his glass cracked once, nor fall until it cracked 2 times (3 on Hard) and the
// moonbeam blinded him once.
c1Lines('m_prism','m_prism_intro','m_prism_outro',
  [['narr',S('A lion made of clear glass sits on a cushion, brushing his crystal mane. Light from the mirror on the wall makes rainbows inside him.','A glass lion brushes his crystal mane.')],
   ['m_prism',S('RAWR. Do you like my mane? Everyone likes my mane.','RAWR. Do you like my mane?')],
   ['ash',S('It\'s very... pointy.','It is very pointy.')],
   ['m_prism',S('POINTY? It is MAJESTIC. Prepare to be majestically pounced!','It is MAJESTIC! Pounce time!')]],
  [['narr',S('Prism sits down hard. Little cracks run all over his glass, like frost on a window.','Prism sits down. He is all cracked.')],
   ['m_prism',S('...Do I still look majestic? Be honest. No, do not be honest. Take the key.','Do I still look nice? Take the key.')]]);
M3ROOM.m_prism={
  build(R,A){ const D={R,type:'m_prism'}; D.mirror=m3MirrorMake(A,R.x0+130,R.y0+118,1); return D; },
  reset(D){ D.mirror.lit=0; D.mirror.dir=1; },
  tick(D,dt){ m3MirrorTick(D.mirror,dt); },
  tall(D,list){ const M=D.mirror; if(!M.it) M.it={x:M.x,y:M.y+2,draw:()=>m3MirrorDraw(M)}; list.push(M.it); }
};
FM.m3shards={
  start(e,m){ const o=m.o; e.state='shardW'; e.st=fkW(o,0.8); e.tele=newTele({shape:'circle',r:96,dur:e.st,col:'220,240,255'}); },
  tick(e,dt,d,a,m){ e.st-=dt; if(!m.go){ if(e.st>0) return false; m.go=true; e.tele=null; e.state='shards'; e.st=0.35; SFX.play('block'); shake(4);
      m3Wave(e.x,e.y,{dmg:m3Dmg(e,22),max:480,spd:340,thick:18,col:'220,240,255'}); for(let i=0;i<14;i++){ const an=i/14*TAU; emit(e.x+Math.cos(an)*e.r,e.y+Math.sin(an)*e.r*0.8-20,1,{col:'230,248,255',ang:an,spread:0.1,smin:200,smax:300,lmin:.3,lmax:.5,zmin:1.4,zmax:2.4,drag:1}); } return false; }
    return e.st<=0; } };
FM_DEF.m3shards={recover:0.7};
FM.m3rainbow={
  start(e,m){ const o=m.o; e.state='roarW'; e.st=fkW(o,1.0); e.tele=newTele({shape:'line',len:520,w:40,dur:e.st,col:'255,255,255'}); m3Say(e,'m_prism',S('Behold! My RAINBOW ROAR!','Rainbow ROAR!'),5); },
  tick(e,dt,d,a,m){ e.st-=dt; if(!m.go){ if(e.st>0.15) e.face=turnTo(e.face,a,1.6*dt); if(e.st>0) return false; m.go=true; e.tele=null; e.state='roar'; e.st=2.1; SFX.play('roar'); shake(5);
      const cols=['255,110,110','130,240,150','130,170,255'], sp=byDiff(0.5,0.7,0.85);
      for(let i=0;i<3;i++) fzAdd('m3sweep',{x:e.x,y:e.y,len:520,a:e.face+(i-1)*0.5,spin:(i===1?-1:1)*sp,w:24,dmg:m3Dmg(e,18),life:2.1,wait:0.35,jump:true,col:cols[i],follow:()=>e.dead?null:e});
      return false; }
    return e.st<=0; } };
FM_DEF.m3rainbow={recover:1.0};
function m3PrismCrack(e,why){ e.crackT=4; e.chips=0; e.heat=0; e.cracks=(e.cracks||0)+1; m3Ev('crack'); shake(5); SFX.play('block');
  emit(e.x,e.y-20,22,{col:'230,248,255',smin:60,smax:220,lmin:.2,lmax:.5,zmin:1.2,zmax:2.6,drag:3});
  m3Txt(e,why||S('CRACK! His glass breaks!','Crack!'),'#ffe066',16); m3Say(e,'m_prism',S('My beautiful glass!','My glass!'),3); }
function m3PrismChip(e){ if(e.crackT>0) return; e.chips=(e.chips||0)+1; m3Txt(e,S('Chip!','Chip!'),'#e8f6ff',13); if(e.chips>=byDiff(2,3,3)) m3PrismCrack(e,S('Chipped through! The glass cracks!','Crack!')); }
function m3PrismPre(e,dt,d,a){
  if(e.crackT>0){ e.crackT-=dt; if(e.crackT<=0){ e.crackT=0; e.chips=0; m3Txt(e,S('His glass mends!','Glass back!'),'#d8f4ff',13); } }
  if(e.heat>0&&!(e.heatT>G.time)) e.heat=Math.max(0,e.heat-dt*0.6);
  const D=m3RoomOf(e); if(D&&D.mirror&&m3MirrorHits(D.mirror,e.x,e.y,e.r)&&!(e.blindCd>G.time)&&!(e.downT>0)){ e.blindCd=G.time+4.5; e.blinds=(e.blinds||0)+1; m3Stun(e,byDiff(2.6,2,1.8),S('The moonbeam blinds him!','Blinded!'),'stuck'); m3Ev('blind'); m3Say(e,'m_prism',S('My EYES! My beautiful eyes!','My eyes!'),3); }
  if(e.downT>0){ e.downT-=dt; e.dx=e.dy=0; e.state='stuck'; e.st=0.2; e.mv=null; e.tele=null; if(e.downT<=0){ e.state='recover'; e.st=0.4; } return true; }
  return false; }
defineFoe('m_prism',{mini:true,name:'Prism',title:S('the Glass Lion','the glass lion'),short:'Prism',
  lv:21,hp:14000,r:26,speed:150,dmg:29,value:1100,kbRes:0.5,dcol:'216,244,255',
  ai:FK.brain({move:'approach',stop:80,turn:3.5,cd:[0.9,1.6],recoverMove:0.3,pre:m3PrismPre,
    moves:[{k:'lunge',st:'crouch',st2:'pounce',windup:0.7,len:300,w:46,spd:760,time:0.4,dmgN:29,min:90,max:330,w:2.2,recover:0.8},
           {k:'slash',reach:70,half:1,windup:0.5,lunge:120,dmgN:24,max:80,w:1.6},
           {k:'m3shards',min:0,max:260,windup:0.8,w:1.4},
           {k:'m3rainbow',min:110,max:640,windup:1.0,w:1.3,every:7}]}),
  init(e,opt){ m3MiniInit(e,opt); e.cracks=0; e.chips=0; e.heat=0; e.blinds=0;
    e.onBlaze=(q,dt)=>{ if(q.crackT>0) return; q.heat=(q.heat||0)+dt; q.heatT=G.time+0.4; if(Math.random()<dt*14) emit(q.x,q.y-20,1,{kind:'fire',smin:10,smax:40,lmin:.2,lmax:.4,zmin:2,zmax:3,grow:4}); if(q.heat>=1) m3PrismCrack(q,S('The hot glass cracks!','It cracks!')); };
    e.onPound=(q,info)=>{ if(!info.drum&&info.d<(info.R||92)+q.r) m3PrismChip(q); }; },
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.crackT>0) a=amt*2;
    else { if(h.src==='arrow'||h.src==='proj'){ if(!(e._bnT>G.time)){ e._bnT=G.time+0.4; const p=player; shoot(e.x,e.y,angTo(e.x,e.y,p.x,p.y),360,6,m3Dmg(e,10),'bolt','enemy',{life:1.4}); m3Txt(e,S('Bounced off the glass!','Bounce!'),'#d8f0ff',12); } return false; }
      if(h.src==='hammer') m3PrismChip(e);
      a=amt*0.3; m3Weak(e,'_glT','His glass is too hard!','Too hard!');
      m3Tip('prism',S('Glass armour','Glass!'),S('Heat his glass with blue Blaze fire, or chip it with the hammer or a Ground Pound. Cracked glass breaks easily!','Use Blaze, the hammer or a Ground Pound!')); }
    if(e.downT>0) a*=1.3;
    return m3Gate(e,a,o,[[0.5,e.cracks>=1,S('His glass is too hard! Heat it with Blaze, or use the hammer!','Use Blaze or the hammer!')],
      [0.02,e.cracks>=byDiff(2,2,3)&&e.blinds>=1,e.blinds<1?S('Moonfire the mirror crystal, then turn the mirror so the moonbeam hits him!','Moonbeam him with the mirror!'):S('Crack his glass again!','Crack the glass!')]]); },
  onDeath(e){ m3MiniDone(e); emit(e.x,e.y-20,30,{col:'230,248,255',smin:60,smax:240,lmin:.3,lmax:.8,zmin:1.4,zmax:3,drag:2}); },
  draw3d:m3FigPrism, draw2d:m3Prism2,
  sheet:c1Rows({state:'crouch',st:0.35},{state:'pounce',dx:600},[{state:'shardW',st:0.4,label:'mane shards'},{state:'roar',label:'rainbow roar'},{state:'chase',heat:0.7,label:'heating'},{state:'chase',crackT:2,label:'cracked'},{state:'stuck',downT:1,label:'blinded'}])});
function m3FigPrism(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/26, face=t3Turn(e,e.face,st==='pounce'?16:6), fx=e.x, fy=e.y+e.r*0.4, inS=foSt(e);
  const hot=clamp(e.heat||0,0,1), cr=e.crackT>0, blind=e.downT>0||st==='stuck', dead=foDeath(e), hurt=m3Hurt(e);
  const gl=fl?'#ffffff':cr?'#c8d6e0':m3MixHex('#d4f2ff','#ffb878',hot*0.75), glD=cr?'#8a9cac':m3MixHex('#90cce4','#e07a48',hot*0.6), glL='#f6fdff', mane='#e8f8ff';
  const mv=foWalk(e,dt,5), w=e._wp||0, crouch=st==='crouch'?clamp(inS/0.5,0,1):0, pounce=st==='pounce', roar=st==='roar'||st==='roarW', shard=st==='shardW';
  const z=pounce?6+Math.sin(clamp(inS/0.4,0,1)*Math.PI)*12:0;
  foShadow(fx,fy,20*k,0.3);
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,10,0,dead*1.3,0,0,0,-dead*6); else if(blind) foSet(FOB,10,0.1,Math.sin(t*5)*0.08,0,0,0,-2); else foSet(FOB,10,pounce?-0.2:crouch*0.15,0,0,0,0,-crouch*3);
  // legs: four glass legs with paws
  foLow(); for(const [lx,sd,ph] of [[8,-1,0],[8,1,Math.PI],[-8,-1,Math.PI],[-8,1,0]]){ const o=Math.sin(w+ph)*2.6*mv, lift=Math.max(0,Math.cos(w+ph))*mv*2, st2=pounce?(lx>0?4:-4):0;
    foL(lx,sd*5,10,lx+o+st2,sd*6,4+lift,2.6,glD,2.2); foL(lx+o+st2,sd*6,4+lift,lx+o*1.2+st2+1,sd*6.2,0.8,2.2,gl,2.4); foE(lx+o*1.2+st2+2,sd*6.2,0.8,2.6,2.2,1.2,glL); }
  foUp(); foSet(FOA,10,-hurt*0.2,0,0);
  // the body, with rainbow glints moving through it
  foE(0,0,13,13,7.4,6.6,gl); foE(1,0,16,10,5,3,glL,0,0,0,0.02);
  for(let i=0;i<3;i++){ const u=((t*0.5+i/3)%1); foD(-10+u*20,Math.sin(i*2)*3,13+Math.cos(i)*2,1.6,['#ff9a9a','#a0f0b0','#a8c4ff'][i],0.04); }
  if(cr) for(let i=0;i<4;i++) foN(-9+i*5,-5,14+i%2*3,-6+i*5,4,12,0.5,'#4a5a6a',0.05);
  // the tail, ending in a crystal
  foL(-12,0,15,-19,0,20+Math.sin(t*3)*2,1.4,glD,1); foC(-19,0,20+Math.sin(t*3)*2,-24,0,24,2,mane,0.03);
  // the head and the crystal mane
  const hx=14, hz=20+(roar?2:0); foE(hx,0,hz,6.4,5.6,5.4,gl,roar?-0.3:0);
  const mn=shard?1.25:1; for(let i=0;i<12;i++){ const an=i/12*TAU, ca=Math.cos(an), sa=Math.sin(an); foC(hx-2,ca*4.6,hz+sa*4.6,hx-5,ca*(10*mn),hz+sa*(10*mn),1.8,i%3?mane:'#c8e8ff',0.01); }
  foE(hx+5,0,hz-2,3.6,3.4,2.6,glL); foD(hx+8.4,0,hz-1.2,1,'#ffb0c8',0.05);
  if(roar){ foE(hx+6,0,hz-4,2.8,2.4,1.6,'#3a2a40',0,0,0,0.03); }
  for(const sd of [-1,1]){ if(blind){ foN(hx+4.8,sd*2.6-1,hz+2,hx+5,sd*2.6+1,hz+3,0.5,'#2a1a2a',0.05); foN(hx+4.8,sd*2.6+1,hz+2,hx+5,sd*2.6-1,hz+3,0.5,'#2a1a2a',0.05); } else c1Eye(hx+4.4,sd*2.6,hz+2.4,1.3,'#ffffff'); foC(hx-1,sd*3.6,hz+4.4,hx-1.6,sd*4.6,hz+8,1.4,gl,0.02); }
  if(blind) for(let i=0;i<3;i++) foD(hx+Math.cos(t*4+i*2.1)*7,Math.sin(t*4+i*2.1)*7,hz+11,1,'#ffe066',0.07);
  if(hot>0.2) foGlow(0,0,14,22,'255,160,90',hot*0.7,false);
  if(roar) foGlow(hx+8,0,hz-2,18,'255,255,255',0.6,true);
  foEnd(14); e._t3top=foTop(fy,34,k,z);
}
function m3Prism2(e,fl){
  const x=e.x, y=e.y-(e.state==='pounce'?10:4), r=e.r, f=e.face, cr=e.crackT>0; ctx.save(); c1Shadow2(e,1.1); ctx.translate(x,y); ctx.rotate(f);
  const gl=fl?'#fff':cr?'#c8d6e0':'#d4f2ff'; c1E2(0,0,r*0.75,r*0.45,gl,0,1.8);
  ctx.fillStyle='#e8f8ff'; ctx.strokeStyle=C1OL(); ctx.lineWidth=1.2; for(let i=0;i<10;i++){ const an=i/10*TAU; ctx.beginPath(); ctx.moveTo(r*0.6+Math.cos(an)*r*0.25,Math.sin(an)*r*0.25); ctx.lineTo(r*0.6+Math.cos(an)*r*0.6,Math.sin(an)*r*0.6); ctx.lineTo(r*0.6+Math.cos(an+0.3)*r*0.25,Math.sin(an+0.3)*r*0.25); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  c1E2(r*0.65,0,r*0.3,r*0.28,gl,0,1.4); c1Eye2(r*0.75,-r*0.12,2,0); c1Eye2(r*0.75,r*0.12,2,0);
  if(cr){ ctx.strokeStyle='#4a5a6a'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-r*0.4,-r*0.2); ctx.lineTo(0,r*0.1); ctx.lineTo(r*0.3,-r*0.2); ctx.stroke(); } ctx.restore();
}

// ---------- Duke Umberwing, the Moth Duke (m_umberwing): the Duke's Perch in the Eclipse Observatory
// A moth as tall as a door, in a velvet cloak that is really his folded wings, a moon-glass monocle and a thin rapier.
// Rapier (3 thrusts, a line each), Dust Flutter (a circle: slows), Parry (cloak up 2 s: frontal hits bounce, go round),
// Call the Guard (two Moth Knights, once). THE TRICKS: light one of the four lamp posts (any fire) and he must go and
// stare at it 3 s (x1.5): "Ooh! A LAMP." (each lamp once per 15 s). MOONFIRE his wings while he swoops low after a thrust
// and the dust burns off: he falls 2 s (x1.5). Gate: he cannot drop below half until he stared at a lamp, nor fall until
// he stared 2 times (1 on Easy) and fell once.
c1Lines('m_umberwing','m_umberwing_intro','m_umberwing_outro',
  [['narr',S('A table is set for one, with a lamp on a plate. Behind it a moth as tall as a door unfolds his cloak, and the cloak is wings.','A table with a lamp on a plate. A huge moth in a cloak bows.')],
   ['m_umberwing',S('Charmed. Do wipe your feet. I am Duke Umberwing, keeper of this door, and you are interrupting my supper.','Charmed. Wipe your feet. I am Duke Umberwing.')],
   ['ash',S('Your supper is a LAMP.','Your supper is a LAMP.')],
   ['m_umberwing',S('Crunchy. Now: en garde!','Crunchy. En garde!')]],
  [['narr',S('The Duke sits down on the floor with a dusty puff. Then he picks up the lamp from his plate and hugs it.','The Duke sits down. He hugs his lamp.')],
   ['m_umberwing',S("I'm keeping this one. It has sentimental value. I stole it on a Tuesday.",'I am keeping this lamp. I stole it on a Tuesday.')],
   ['narr',S('He bows, flutters up to the window, and is gone into the night with the lamp under his arm. He left the key on the table.','He flies out the window with his lamp. The key is on the table.')]]);
M3ROOM.m_umberwing={
  build(R,A){ const D={R,type:'m_umberwing',table:{x:R.cx,y:R.cy}}, dx=(R.x1-R.x0)*0.36, dy=(R.y1-R.y0)*0.3;
    D.lamps=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([u,v])=>m3AddLamp(R.cx+u*dx,R.cy+v*dy+20,{h:48,dur:12,R:170}));
    D.table.col=addAreaCol({t:'c',x:D.table.x,y:D.table.y,r:30}); return D; },
  reset(D){ for(const L of D.lamps){ L.lit=0; if(L.L) L.L.i=0; L.dukeT=0; } },
  tick(D,dt){ for(const L of D.lamps) FZK.m3lamp.tick(L,dt); },
  tall(D,list){ for(const L of D.lamps){ if(!L.it) L.it={x:L.x,y:L.y,draw:()=>m3DrawLamp(L)}; list.push(L.it); }
    if(!D.table.it) D.table.it={x:D.table.x,y:D.table.y+14,draw:()=>m3DrawTable(D)}; list.push(D.table.it); }
};
function m3DrawTable(D){ const x=D.table.x, y=D.table.y, oc=C1OL(), e=G.boss, gone=G.bossDone.m_umberwing; ctx.save();
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+14,40,10,0,0,TAU); ctx.fill();
  ctx.fillStyle=oc; ctx.fillRect(x-30,y-4,4,18); ctx.fillRect(x+26,y-4,4,18); ctx.beginPath(); ctx.ellipse(x,y-6,40,14,0,0,TAU); ctx.fill();
  ctx.fillStyle='#e8e0f0'; ctx.beginPath(); ctx.ellipse(x,y-8,37,12,0,0,TAU); ctx.fill(); ctx.fillStyle='#c8b8e0'; ctx.beginPath(); ctx.ellipse(x,y-8,37,12,0,0,Math.PI); ctx.fill();
  ctx.fillStyle='#ffffff'; ctx.strokeStyle='#a89ac0'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(x,y-10,14,5,0,0,TAU); ctx.fill(); ctx.stroke();
  if(!gone){ ctx.fillStyle=oc; rrect(ctx,x-6,y-28,12,16,4); ctx.fill(); ctx.fillStyle='#d8c08a'; rrect(ctx,x-4.5,y-26.5,9,13,3); ctx.fill(); ctx.fillStyle='#fff2b0'; ctx.beginPath(); ctx.arc(x,y-20,3,0,TAU); ctx.fill(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.6; ctx.drawImage(foGlowSpr('255,210,120'),x-20,y-40,40,40); }
  ctx.restore(); }
function m3DukeKnights(e){ const L=fkLevel(e,{}), C=m3Ctx(e), n=byDiff(1,2,2); for(let i=0;i<n;i++){ const q={x:e.x+(i?150:-150),y:e.y+40}; m3Hold(C,q,60); const k=makeEnemy('m_mothknight',q.x,q.y,{level:Math.max(1,L-4),aggro:true,elite:false,homeX:q.x,homeY:q.y,leash:99999}); k.spawnIn=0.3; k.m3guard=e.id; k.dmg*=byDiff(0.6,0.7,0.85); k.arena=e.arena; m3Puff(q.x,q.y-20,'200,195,215',18); } }
function m3DukeLamp(e,D){ if(!D||!D.lamps) return null; let best=null, bd=1e18; for(const L of D.lamps) if(L.lit>0&&!(L.dukeT>G.time)){ const d2=dist2(L.x,L.y,e.x,e.y); if(d2<bd){ bd=d2; best=L; } } return best; }
function m3DukeAI(e,dt,p){
  p=p||player; const F=foeDiff(), D=m3RoomOf(e), d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y); e.dx=e.dy=0;
  if(e.parryT>0){ e.parryT-=dt; if(e.parryT<=0) e.blocking=false; }
  if(e.downT>0){ e.downT-=dt; e.flying=false; e.low=false; e.blocking=false; e.parryT=0; e.state='stuck'; e.st=0.2; if(e.downT<=0){ e.state='takeoff'; e.st=0.6; m3Say(e,'m_umberwing',S('Ahem. That never happened.','That never happened.'),4); } return; }
  e.flying=true;
  if(!e.called&&e.hp<e.maxHp*0.62){ e.called=true; m3DukeKnights(e); m3Say(e,'m_umberwing',S('Guards! GUARDS! Someone is being RUDE.','Guards!'),3); }
  switch(e.state){
    case 'rapW': e.low=false; e.st-=dt; if(e.st>0.1) e.face=turnTo(e.face,a,4*dt); if(e.st<=0){ e.tele=null; e.state='thrust'; e.st=0.2; e.hitP=false; SFX.play('slash'); } return;
    case 'thrust': { e.low=true; const s=560*F.spd; e.dx=Math.cos(e.face)*s; e.dy=Math.sin(e.face)*s;
      if(!e.hitP&&!m3Up()&&inCone(e.x,e.y,e.face,e.r+52,0.5,p.x,p.y,p.r)){ if(hurtPlayer(m3Dmg(e,29),e.x,e.y,220)) e.hitP=true; }
      e.st-=dt; if(e.st<=0||foeBumped(e)){ e.n--; if(e.n>0){ e.state='rapW'; e.st=m3W({},0.5); e.face=a; e.tele=newTele({shape:'line',len:180,w:34,dur:e.st,col:M3COL.red}); } else { e.state='low'; e.st=byDiff(1.5,1.2,1); m3Txt(e,S('He swoops low!','Low!'),'#e0e8ff',12); } } return; }
    case 'low': e.low=true; e.st-=dt; if(e.st<=0){ e.low=false; e.state='chase'; } return;
    case 'dustW': e.st-=dt; if(e.st<=0){ e.state='recover'; e.st=0.6; } return;
    case 'parry': e.blocking=true; e.st-=dt; e.face=turnTo(e.face,a,2.2*dt); if(e.st<=0){ e.blocking=false; e.parryT=0; e.state='recover'; e.st=0.4; } return;
    case 'toLamp': { const L=e.lure; e.st-=dt; e.low=false; if(!L||!(L.lit>0)){ e.state='chase'; e.lure=null; return; } steer(e,L.x,L.y-26,e.speed*1.8*F.spd); e.face=turnTo(e.face,angTo(e.x,e.y,L.x,L.y),6*dt);
      if(dist(e.x,e.y,L.x,L.y)<70||e.st<=0){ e.state='stare'; e.st=byDiff(3.8,3,2.6); e.stares=(e.stares||0)+1; L.dukeT=G.time+15; m3Ev('stare');
        m3Txt(e,S('Ooh! A LAMP. He cannot stop staring!','He loves the lamp! Hit him!'),'#fff0c0',15); m3Say(e,'m_umberwing',S('Is that a LAMP? No. Focus. ...Is it, though?','Ooh! A LAMP.'),2); } return; }
    case 'stare': { const L=e.lure; e.low=true; e.blocking=false; e.st-=dt; if(L){ const u=G.time*1.4; steer(e,L.x+Math.cos(u)*50,L.y-10+Math.sin(u*2)*14,e.speed*0.6); e.face=turnTo(e.face,angTo(e.x,e.y,L.x,L.y),5*dt); }
      if(e.st<=0){ e.state='takeoff'; e.st=0.5; e.lure=null; e.lampCd=G.time+byDiff(5,8,10); if(L){ L.lit=0; if(L.L) L.L.i=0; m3Txt(e,S('He eats the lamp. "Crunchy."','Crunchy.'),'#fff0c0',13); } } return; }
    case 'takeoff': e.low=false; e.st-=dt; if(e.st<=0) e.state='chase'; return;
    case 'recover': e.low=false; e.st-=dt; if(e.st<=0) e.state='chase'; break;
  }
  if(e.state!=='chase') return;
  e.low=false; e.blocking=false;
  // the lamp rule: a lit lamp he has not stared at for 15 s pulls him in
  const L=!(e.lampCd>G.time)&&m3DukeLamp(e,D); if(L){ e.lure=L; e.state='toLamp'; e.st=2.6; e.tele=null; return; }
  e.orbit=(e.orbit||rand(0,TAU))+dt*0.9*(e.orbitDir||1); const R=190+Math.sin(e.t*1.1)*30; steer(e,p.x+Math.cos(e.orbit)*R,p.y+Math.sin(e.orbit)*R*0.8,e.speed*F.spd); e.face=turnTo(e.face,a,4*dt);
  const C=m3Ctx(e); if(C.rect){ e.x=clamp(e.x,C.x0+30,C.x1-30); e.y=clamp(e.y,C.y0+30,C.y1-30); }
  e.cd-=dt*F.cdK; if(e.cd>0) return; e.cd=rand(1.6,2.4); const r=Math.random();
  if(G.time-(ATK.swingT||-9)<0.8&&r<0.35&&d<240&&!(e.parCd>G.time)){ e.parCd=G.time+7; e.state='parry'; e.st=2; e.parryT=2; e.blocking=true; m3Say(e,'m_umberwing',S('Parry! Do try to keep up.','Parry!'),4); return; }
  if(d<320&&r<0.62){ e.state='rapW'; e.n=3; e.st=m3W({},0.5); e.face=a; e.tele=newTele({shape:'line',len:180,w:34,dur:e.st,col:M3COL.red}); return; }
  if(d<460){ e.state='dustW'; e.st=0.8; const q={x:p.x,y:p.y}; m3Mark({x:q.x,y:q.y,r:100,dur:m3W({},0.8),col:'205,200,225',fire:z=>{ m3Cloud(z.x,z.y,{r:100,life:2,slow:0.5,col:'205,200,225'}); if(!player.dead&&!m3Up()&&dist(player.x,player.y,z.x,z.y)<100){ if(hurtPlayer(m3Dmg(e,14),z.x,z.y,80)) player.slowT=Math.max(player.slowT||0,2); } }}); m3Puff(e.x,e.y-30,'205,200,225',14); }
}
M3HC.m_umberwing=e=>{ const L=e._hc||(e._hc=[{},{}]); let n=0; m3HS(L,n++,{x:e.x,y:e.y,r:e.r,m:1}); if(e.downT>0||e.state==='stare') m3HS(L,n++,{x:e.x+Math.cos(e.face)*8,y:e.y-6,r:16,m:1.5}); L.length=n; return L; };
defineFoe('m_umberwing',{mini:true,name:'Duke Umberwing',title:S('the Moth Duke','the moth duke'),short:'Duke Umberwing',
  lv:21,hp:15000,r:24,speed:160,dmg:29,value:1200,flying:true,kbRes:0.6,dcol:'184,168,208',
  ai:m3DukeAI,
  init(e,opt){ m3MiniInit(e,opt); e.state='chase'; e.cd=1.6; e.stares=0; e.falls=0; e.dust=0;
    e.onMoon=(q,dt)=>{ if(q.downT>0||!q.low) return; q.dust=(q.dust||0)+dt; if(q.dust>=0.3){ q.dust=0; q.falls++; q.downT=byDiff(2.6,2,1.8); q.tele=null; q.mv=null; m3Txt(q,S('The dust burns off his wings! He falls!','He falls!'),'#e0e8ff',15); m3Puff(q.x,q.y-30,'215,215,235',24); m3Ev('dukefall'); shake(5); } }; },
  onHurt(e,amt,o){ const h=foeHit(e,o); let a=amt;
    if(e.blocking&&!h.behind&&Math.abs(angDiff(e.face,angTo(e.x,e.y,o&&o.fx!=null?o.fx:player.x,o&&o.fy!=null?o.fy:player.y)))<1.2&&h.src!=='moon'){ if(!(e._pyT>G.time)){ e._pyT=G.time+0.6; m3Txt(e,S('Parried! Go round him!','Parried! Go round!'),'#e8e0ff',13); SFX.play('block'); } return false; }
    if(e.downT>0||e.state==='stare') a=amt*1.5;
    return m3Gate(e,a,o,[[0.5,e.stares>=1,S('Light a lamp post! He cannot resist a lamp.','Light a lamp!')],
      [0.02,e.stares>=byDiff(1,2,2)&&e.falls>=1,e.falls<1?S('Moonfire his wings when he swoops low!','Moonfire his wings!'):S('Light another lamp!','Light a lamp!')]]); },
  onDeath(e){ m3MiniDone(e); for(const q of G.enemies) if(!q.dead&&q.m3guard===e.id){ q.dead=true; m3Puff(q.x,q.y-20,'200,195,215',16); } m3Puff(e.x,e.y-30,'210,200,230',30); },
  draw3d:m3FigDuke, draw2d:m3Duke2,
  sheet:c1Sheet([{state:'chase',label:'hover'},{state:'chase',dx:160,label:'fly'},{state:'rapW',st:0.3,label:'rapier'},{state:'thrust',dx:500,label:'thrust'},{state:'parry',blocking:true,label:'parry'},{state:'stare',label:'staring'},{state:'stuck',downT:1,label:'fallen'},{state:'stuck',deathT:0.3,label:'death'}])});
function m3FigDuke(e,fl){
  const dt=foDt(e), t=e.t||0, st=e.state, k=e.r/24, face=t3Turn(e,e.face,st==='thrust'?16:7), fx=e.x, fy=e.y+e.r*0.35, inS=foSt(e);
  const down=e.downT>0||st==='stuck', low=st==='thrust'||st==='low'||st==='stare', parry=st==='parry'||!!e.blocking, dead=foDeath(e), hurt=m3Hurt(e);
  const vel=fl?'#ffffff':foT(e,'#6a4a8a'), velD=foT(e,'#3e2a5a'), fur=foT(e,'#b8b0c8'), furL='#e4e0ec', wing=foT(e,'#8a78a8'), wingD=foT(e,'#4a3a66'), gold='#e8c060', glass='#cfe0ff';
  const z=down?0:low?8:26+Math.sin(t*2.4)*4, flap=down?0:Math.sin(t*(parry?4:9));
  foShadow(fx,fy,16*k,down?0.32:0.22);
  foBegin(fx,fy,face,k,fl,z); if(dead) foSet(FOB,14,0,dead*1.3,0,0,0,-dead*6); else if(down) foSet(FOB,6,0,1.1,0,0,0,-3); else foSet(FOB,14,st==='thrust'?0.35:st==='rapW'?-0.1:0,flap*0.03,0);
  // the cloak-wings: wrapped round him (parry: raised in front), or spread to fly
  const th=parry?1.1:low?0.35+flap*0.4:0.2+flap*0.55, sweep=parry?-7:2, span=parry?14:20;
  for(const sd of [-1,1]){ c1Wing(sd,parry?4:-3,sd*5,26,span,15,th,sweep,wing,wingD,3.6,'#e8e0f4'); c1Wing(sd,-6,sd*4,18,span*0.7,11,th*0.8,sweep+2,wingD,null,2.2,'#d8d0ea'); }
  // legs (thin, in little boots) and the velvet body
  foLow(); for(const sd of [-1,1]) foL(0,sd*3,10,down?2:1,sd*3.6,down?0.6:2,1.3,'#2a2236',1.1); foUp(); foSet(FOA,14,-hurt*0.2,0,0);
  foY(0,0,10,6.6,5,16,vel,velD); foE(0,0,26,6,5.6,4.6,fur); foE(1.6,0,24,3.6,4.4,3.4,furL,0,0,0,0.01);
  for(let i=0;i<3;i++) foD(5.6,0,13+i*4,0.9,gold,0.04);
  // the head: big eyes, the moon-glass monocle, two feathery antennae
  const hz=33; foE(1,0,hz,5,5.4,4.6,fur);
  for(const sd of [-1,1]){ foD(4.2,sd*2.6,hz+0.8,2,'#2a1a3a',0.03); foD(4.8,sd*2.4,hz+1.6,0.7,'#ffffff',0.05); }
  foY(4.8,2.6,hz-0.6,2.6,2.6,0.5,gold,glass,0.06); foN(5,2.6,hz-2.4,4.6,3.8,hz-8,0.3,gold,0.06);
  for(const sd of [-1,1]){ const tx=6+(st==='stare'?3:0), ty=sd*8, tz=hz+11; foL(2,sd*2,hz+3.6,tx,ty,tz,0.6,'#3a2a4a',0.5,0.02); for(let i=1;i<5;i++){ const u=i/5; const bx=lerp(2,tx,u), by=lerp(sd*2,ty,u), bz=lerp(hz+3.6,tz,u); foN(bx,by,bz,bx-2,by+sd*1.6,bz-1.2,0.35,'#5a4a6a',0.03); } }
  // the rapier: a thin moon-glass blade
  { const thr=st==='thrust'?1:st==='rapW'?-0.4:0, hx=5+thr*5, hy=6, hzz=18; foL(2,5.4,20,hx,hy,hzz,1.1,vel,1,0.01); foE(hx,hy,hzz,1.4,1.8,1.8,gold); foN(hx+1,hy,hzz,hx+22+thr*4,hy-1,hzz+(low?-3:1),0.55,'#e8f0ff',0.04); }
  if(st==='stare') foGlow(8,0,hz,16,'255,230,150',0.45,false);
  if(down) for(let i=0;i<3;i++) foD(Math.cos(t*4+i*2.1)*8,Math.sin(t*4+i*2.1)*8,hz+8,1,'#ffe066',0.07);
  foEnd(16); e._t3top=foTop(fy,hz+14,k,z);
}
function m3Duke2(e,fl){
  const down=e.downT>0, x=e.x, y=e.y-(down?4:26), r=e.r, f=e.face, g=!!e.blocking; ctx.save(); c1Shadow2(e,0.9);
  ctx.fillStyle='#8a78a8'; ctx.strokeStyle=C1OL(); ctx.lineWidth=1.6; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(x+s*r*(g?0.5:0.9),y,r*(g?0.5:0.75),r*0.9,s*0.3,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#e8e0f4'; ctx.beginPath(); ctx.arc(x+s*r*(g?0.5:0.9),y-2,4,0,TAU); ctx.fill(); ctx.fillStyle='#8a78a8'; }
  c1E2(x,y,r*0.4,r*0.75,fl?'#fff':'#6a4a8a',0,1.8); c1E2(x,y-r*0.8,r*0.32,r*0.3,'#b8b0c8',0,1.4);
  ctx.strokeStyle='#e8c060'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x+4,y-r*0.82,3,0,TAU); ctx.stroke();
  ctx.strokeStyle='#e8f0ff'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x+r*0.3,y); ctx.lineTo(x+r*0.3+Math.cos(f)*r*1.4,y+Math.sin(f)*r*1.4); ctx.stroke(); ctx.restore();
}
// he flutters off with his lamp: the dungeon reads G.flags.m_umber_done
{ const d=BOSSES[M3DUN.m_umberwing.k]; if(d){ const w=d.onWin; d.onWin=function(){ G.flags.m_umber_done=1; if(w) w.apply(this,arguments); }; } }

// ================= 11. the Sunken Gate on the real map, the story hooks, and the Moon Hall (a test dungeon)
// x3_world builds the Sunken Gate (its POI m_sunkengate, the sandbank, the Reefwall, the arch, the bubble vents and the
// Baron stuck in the gate). Once that POI exists the boss site uses it (ACT4.md 6.5: site m_puff, POI m_sunkengate) and
// the stand-in POI goes, so the map shows one name; the walls still rise round the sandbank.
function m3PuffLink(){
  const W=POI.m_sunkengate; if(!W||W===POI.m_puff||M3PUFF.link===W) return; M3PUFF.link=W;
  const s=SITES.m_puff, d=BOSSES.m_puff; if(!s||!d) return; s.poi='m_sunkengate'; d.poi='m_sunkengate';
  if(d.arena){ d.arena=Object.assign({},d.arena,{dx:M3PUFF.sb.x-W.x,dy:M3PUFF.sb.y-W.y}); d._A=null; }
  if(POI.m_puff&&POI.m_puff!==W) delete POI.m_puff;
}
{ const base=updateEnemies; updateEnemies=function(dt){ if(M3PUFF.link!==POI.m_sunkengate&&POI.m_sunkengate) m3PuffLink(); base(dt); }; }

// The story hooks (x3_story sets them; every one is optional):
//   M3.hook.won(type)            any Act IV boss or miniboss is beaten (after its outro and onWin)
//   M3.hook.puffStart()          the Sunken Gate fight starts (the walls rise)
//   M3.hook.hushDone(e,finish)   Hush sinks down at the end of her fight: play the outro and the choice, set
//                                G.choices.m_hush ('free' or 'foe', or call M3.hushOutcome(kind) for the flight or the
//                                crumble), then call finish() (XP, bossDone, the room solved, won, saved)
//   M3.hook.hushChoice(kind)     the choice was made ('free' or 'foe'), from the built-in outro or M3.hushOutcome
//   M3.hook.hushAfter(e,kind)    after finish()
// Story lines: STORY.bosses[type].intro/outro read STORY[key] first (keys in M3FOES.md), with the bible's words built in.
M3.hushOutcome=k=>m3HushOutcome(k);

// ---------- the Moon Hall: one room of each Act IV boss (no door leads here; __eb.m3Test goes in)
defineDungeonTheme('m3lab',{style:{floor:'#c8c6d8',floor2:'#bebccf',top:'#5a5e7a',face:'#2e3048',edge:'#e8ecff',water:'#2a6a9a',accent:'#b8c8ff'},decor:'lamp',
  pal:{tile:['#c8c6d8','#bebccf','#c8c6d8','#bebccf'],grout:'rgba(40,40,70,.22)',moss:'150,170,220',rune:'200,215,255',hole:'#0c0e1a',lip:['#5a5e7a','#2e3048'],water:'#2a6a9a',cave:true}});
const M3LAB_ROOM={m_octavia:'O',m_gravelgut:'G',m_fanfare:'M',m_hushboss:'H',m_zapp:'z',m_bigfin:'f',m_prism:'p',m_umberwing:'u'};
defineDungeon('m3_lab',{name:S('The Moon Hall','The Moon Hall'),level:19,theme:'m3lab',seed:4199,save:'m3_lab',noJuniper:true,giftOK:{},dark:0.15,dunKind:S('A test hall','A test hall'),p4:true,
  floors:[{id:'1',name:S('The Hall','The Hall'),map:{rooms:{
    a:{at:[2,4],kind:'start',noPots:true,sign:S('The Moon Hall. Every boss of Moonfall, one room each.','The Moon Hall.')},
    c:{at:[2,3],kind:'free',noPots:true}, b:{at:[2,2],kind:'free',noPots:true},
    z:{at:[3,3],kind:'miniboss',m3boss:'m_zapp',tpl:M3_TPL.eelhall,noPots:true,noDecor:true},
    f:{at:[4,3],kind:'miniboss',m3boss:'m_bigfin',tpl:M3_TPL.finpit,noPots:true,noDecor:true},
    p:{at:[3,2],kind:'miniboss',m3boss:'m_prism',tpl:M3_TPL.prismhall,noPots:true,noDecor:true},
    u:{at:[4,2],kind:'miniboss',m3boss:'m_umberwing',tpl:M3_TPL.perch,noPots:true,noDecor:true},
    O:{at:[0,0],span:[2,2],kind:'boss',m3boss:'m_octavia',tpl:M3_TPL.cellar,noPots:true,noDecor:true},
    G:{at:[2,0],span:[2,2],kind:'boss',m3boss:'m_gravelgut',tpl:M3_TPL.gullet,noPots:true,noDecor:true},
    M:{at:[4,0],span:[2,2],kind:'boss',m3boss:'m_fanfare',tpl:M3_TPL.mirrorhall,moonbraz:{timed:15},noPots:true,noDecor:true},
    H:{at:[0,2],span:[2,2],kind:'boss',m3boss:'m_hushboss',tpl:M3_TPL.dome,frost:M3_TPL.domeFrost,noPots:true,noDecor:true}},
    links:[['a','c','open'],['c','z','open'],['z','f','open'],['c','b','open'],['b','p','open'],['p','u','open'],['b','G','open'],['G','O','open'],['G','M','open'],['c','H','open']]}}]});

// __eb.m3Test(type,{diff:0|1|2, intro:false, level}) gives Ash every power and weapon the Act IV fights need, puts him in
// that boss's room of the Moon Hall (Puffington: the sandbank of the Sunken Gate) and the fight starts as he walks in.
const M3_POWERS=['jump','stride','wings','dbljump','skimmer','claws','grapple','shadow','blaze','windride','pound','dive','burrow','moonfire'];
// every power and the three new weapons, a full bomb bag, the sword in hand (tests)
function m3Kit(o){ o=o||{}; if(window.__eb&&window.__eb.bal&&o.diff!=null) window.__eb.bal.setDiff(o.diff);
  G.abil=G.abil||{}; for(const id of M3_POWERS) G.abil[id]=true; G.flags.forge=true;
  for(const w of ['bombs','glaive','whip']) if(G.weapons&&!G.weapons[w]&&typeof giveWeapon==='function') try{ giveWeapon(w,true); }catch(err){}
  G.flags.wpn_bombs=10;
  if(typeof equipWeapon==='function'&&G.weapons&&G.weapons.sword) try{ equipWeapon('sword',true); }catch(err){}
  if(typeof P2!=='undefined'&&P2.tips) for(const k of ['climb','hang','pull','chain','ring']) P2.tips[k]=9;
  if(typeof P4!=='undefined'&&P4.tips) for(const k of ['dive','burrow','deep','sand','moonswap','pool','sink']) P4.tips[k]=9; return true; }
function m3Test(type,o){
  o=o||{}; m3Kit(o); M3.siteTest=type==='m_puffington'?'m_puff':null;
  if(G.fightSite) resetBoss(); G.bossDone[type]=false; G.flags[type+'_won']=false; M3.noIntro=o.intro===false; M3.dmg=0; M3.hits=0; M3.bySrc={}; M3.bySt={}; M3.ev={};
  for(const k in G.flags) if(k.startsWith('m3tip_')) delete G.flags[k];
  if(type==='m_puffington'){ if(AREA) exitArea(true); G.flags.m_puff_done=0; M3.siteTest='m_puff'; m3PuffLink();
    // on the real map the arch under the Reefwall is shut while the story is at m_reef (x3_world): a test without the
    // Act IV story gets a stand-in stage of that name
    if(POI.m_sunkengate&&typeof defineStages==='function'&&typeof STAGEDEF!=='undefined'){ if(!STAGEDEF.m_reef) try{ defineStages(4,[{id:'m_reef',chapter:'test',card:['Act IV','The Sunken Gate'],objectives:()=>[]}]); }catch(err){ console.warn(err); } if(STAGEDEF.m_reef&&G.stage!=='m_reef') try{ setStage('m_reef'); }catch(err){} }
    const r=window.__eb.bossTest('m_puff',{stage:false,intro:o.intro===false?false:undefined}); const S0=M3PUFF.sb; player.x=S0.x-60; player.y=S0.y+40; updateCam(0,true); return r; }
  const room=M3LAB_ROOM[type]; if(!room) return null;
  for(const k in G.found) if(k.startsWith('cv_m3_lab_')&&k.endsWith('_solved')) delete G.found[k];
  if(AREA&&AREA.id==='m3_lab') exitArea(true);
  const id=dunGo('m3_lab',room); const R=AREA&&AREA.rooms[room];
  if(R){ R.solved=false; R.enemies=R.enemies||[]; const s=dunNearGround(R.cx,R.cy+Math.min(220,(R.y1-R.y0)*0.32),7); player.x=s.x; player.y=s.y; updateCam(0,true); }
  return {area:id,room,x:R&&R.cx,y:R&&R.cy};
}

// ================= 12. the scripted fighter (tests) and the debug hooks (window.__eb.m3f, __eb.m3Test)
// The bot plays through Ash's own controls: it walks with the stick (M3B.inp.mx/my), breathes fire or Moonfire (FIRE,
// facing the target; O swaps the breath), dives, surfaces, burrows and pops up (ROLL), jumps and Ground Pounds (JUMP,
// then ATTACK in the air), Shadow Dashes through glare (ROLL on dry ground) and turns valves and mirrors (USE at the
// prompt). Three shortcuts, as in the Act II bot: a sword hit is the game's wStrike on the hit circle in reach (no swing
// animation), a Blast Bomb is thrown with throwBomb (the aim hold skipped), and the PULL on Hush's leash ring calls the
// ring's own onPull and then while Ash stands on the gallery (the rope itself is not simulated).
const M3B={force:{},forceT:0,on:false,type:null,mech:true,heal:true,t:0,hitT:0,heals:0,ev:{},dealt:0,dodges:0,tx:null,ty:null,inp:{},tap:{},prog:{t:0,x:0,y:0},stuckT:0,side:1,pullT:0,pound:0,useT:0,bombT:0,airUp:false};
function m3BotEv(k){ M3B.ev[k]=(M3B.ev[k]||0)+1; }
function m3BotTap(k){ M3B.tap[k]=true; }
// (tests) M3B.force holds inputs for a while (__eb.m3f.input({fire:true},1.5)); M3B.tap presses one for one update
{ const base=readInput; readInput=function(dt){ const o=base(dt); if(M3B.on&&M3B.tap){ let any=false; for(const k in M3B.tap) if(M3B.tap[k]){ o[k]=true; any=true; } if(any) M3B.tap={}; }
    if(M3B.forceT>0){ M3B.forceT-=dt; for(const k in M3B.force) o[k]=M3B.force[k]; if(M3B.forceT<=0) M3B.force={}; } return o; }; }
function m3BotGo(x,y){ M3B.tx=x; M3B.ty=y; }
function m3BotAt(x,y,r){ return dist(player.x,player.y,x,y)<(r||40); }
// walk toward the target with the stick; a sidestep when stuck on something
function m3BotMove(dt){
  const p=player, I=M3B.inp; I.mx=0; I.my=0; I.sprint=false; if(M3B.tx==null||I.fire) return;
  const dx=M3B.tx-p.x, dy=M3B.ty-p.y, d=Math.hypot(dx,dy); if(d<10) return;
  const P=M3B.prog; P.t+=dt; if(P.t>0.5){ if(dist(p.x,p.y,P.x,P.y)<14&&d>40&&!(M3.zapT>0)&&!M3.hold){ M3B.stuckT=0.45; M3B.side=Math.random()<0.5?1:-1; } P.t=0; P.x=p.x; P.y=p.y; }
  let a=Math.atan2(dy,dx); if(M3B.stuckT>0){ M3B.stuckT-=dt; a+=M3B.side*1.3; }
  const k=Math.min(1,d/30); I.mx=Math.cos(a)*k; I.my=Math.sin(a)*k; I.sprint=d>160&&!m3Dive()&&!m3Bur();
}
// keep a distance r from a foe, at an angle (default: where Ash already is), inside the fight's area
function m3BotNear(e,r,a){ const p=player; a=a!=null?a:angTo(e.x,e.y,p.x,p.y); const C=m3Ctx(e), q={x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r}; if(C.rect||C.A) m3Hold(C,q,44); m3BotGo(q.x,q.y); }
// a sword hit on the best hit circle in reach (the highest multiplier)
function m3BotSwing(e,mul){
  const p=player; if(!e||e.dead||e.invuln||e.spawnIn>0||m3Bur()) return false; let best=null;
  for(const c of hitCircles(e)) if(dist(p.x,p.y,c.x,c.y)-c.r<78&&(!best||c.m>best.m)) best=c;
  if(!best) return false; p.facing=angTo(p.x,p.y,best.x,best.y);
  if(!(p.swingT>0)){ p.swingW='sword'; p.swingFin=false; p.swingSpin=false; p.swingDur=0.2; p.swingT=0.2; p.swingHit=new Set(G.enemies.map(q=>q.id)); p.swingHitstop=true; p.swingObj=true; ATK.swingT=G.time; }
  const before=e.hp; wStrike(e,best,mul||1,'sword',{kb:60,ka:p.facing,fx:p.x,fy:p.y}); M3B.dealt+=Math.max(0,before-e.hp); return true;
}
// breathe (fire, or Moonfire with moon) at a spot: closer first, then stand and breathe facing it
function m3BotBreath(x,y,moon,reach){
  const p=player, I=M3B.inp; reach=reach||150;
  if(moon!==p4MoonOn()&&canMoon()) p4MoonToggle();
  const d=dist(p.x,p.y,x,y); if(d>reach){ m3BotGo(x+(p.x-x)/d*reach*0.8,y+(p.y-y)/d*reach*0.8); I.fire=false; return false; }
  M3B.tx=null; p.facing=angTo(p.x,p.y,x,y); I.fire=true; if(p.energy<5) p.energy=Math.max(p.energy,0); return true;
}
// a Ground Pound with the real controls: JUMP, then ATTACK held while he is in the air
function m3BotPound(){ if(M3B.pound>0||m3Dive()||m3Bur()||(player.z||0)>2) return false; M3B.pound=0.4; m3BotTap('jump'); m3BotEv('pound'); return true; }
// ROLL: dive, surface, dig in or pop up (only where p4 takes the roll)
function m3BotRoll(){ if(M3B.rollT>G.time) return false; M3B.rollT=G.time+0.5; m3BotTap('roll'); return true; }
// where the danger is: marked circles, lines and cones, the foes' own wind-up shapes, worm lanes. A point to run to, or null
function m3BotDanger(e){
  const p=player, out=(cx,cy,r)=>{ const a=angTo(cx,cy,p.x,p.y)+(Math.random()<0.5?0.3:-0.3); return {x:cx+Math.cos(a)*(r+50),y:cy+Math.sin(a)*(r+50)}; };
  const side=(x0,y0,ang,w)=>{ const nx=-Math.sin(ang), ny=Math.cos(ang), s=((p.x-x0)*nx+(p.y-y0)*ny)>=0?1:-1; return {x:p.x+nx*s*(w/2+56),y:p.y+ny*s*(w/2+56)}; };
  const inLine=(x0,y0,ang,len,w)=>{ const dx=p.x-x0, dy=p.y-y0, u=dx*Math.cos(ang)+dy*Math.sin(ang), v=-dx*Math.sin(ang)+dy*Math.cos(ang); return u>-p.r&&u<len+p.r&&Math.abs(v)<w/2+p.r; };
  for(const z of G.fz||[]){
    if(z.k==='c1mark'||z.k==='c1lob'){ if(z.sparkle) continue; if(z.shape==='line'){ if(inLine(z.x,z.y,z.ang||0,z.len,z.w||30)) return side(z.x,z.y,z.ang||0,z.w||30); continue; }
      if(z.shape==='cone'){ if(dist(z.x,z.y,p.x,p.y)<z.len+p.r&&Math.abs(angDiff(z.ang||0,angTo(z.x,z.y,p.x,p.y)))<z.half+0.15) return side(z.x,z.y,z.ang||0,Math.sin(z.half)*z.len*2); continue; }
      if(z.shape==='donut'){ const d=dist(z.x,z.y,p.x,p.y); if(d>z.r1-p.r&&d<z.r2+p.r) return {x:z.x+(p.x-z.x)/Math.max(1,d)*Math.max(10,z.r1-60),y:z.y+(p.y-z.y)/Math.max(1,d)*Math.max(10,z.r1-60)}; continue; }
      if(z.r&&dist(z.x,z.y,p.x,p.y)<z.r+p.r) return out(z.x,z.y,z.r); }
    if(z.k==='m3lane'&&z.ph!=='idle'&&!m3Bur()&&segD(p.x,p.y,z.x0,z.y0,z.x1,z.y1)<56) return side(z.x0,z.y0,angTo(z.x0,z.y0,z.x1,z.y1),60);
  }
  for(const q of G.enemies){ if(q.dead||!q.tele) continue; const T=q.tele;
    if(T.shape==='arc'||T.shape==='cone'){ const r=T.r||T.len||60, half=T.half||1; if(dist(q.x,q.y,p.x,p.y)<r+p.r&&Math.abs(angDiff(q.face,angTo(q.x,q.y,p.x,p.y)))<half+0.2) return out(q.x,q.y,r); }
    else if(T.shape==='line'){ if(inLine(q.x,q.y,q.face,T.len||300,T.w||30)) return side(q.x,q.y,q.face,T.w||30); }
    else if(T.shape==='circle'||T.shape==='ring'){ const r=T.r||60; if(dist(q.x,q.y,p.x,p.y)<r+p.r) return out(q.x,q.y,r); } }
  return null;
}
// jump shock rings, sweeping lines that can be jumped; Shadow Dash through glare lines that cannot
function m3BotHop(e){
  const p=player; if((p.z||0)>3||m3Dive()||m3Bur()||M3B.pound>0) return;
  let jump=false, dash=false;
  for(const z of G.fz||[]){
    if((z.k==='c1wave'||z.k==='m3wave')&&z.rad&&Math.abs(dist(z.x,z.y,p.x,p.y)-z.rad)<56) jump=true;
    if(z.k==='m3sweep'&&z.on&&!(z.cd>0)){ const d=dist(z.x,z.y,p.x,p.y); if(d>z.len) continue; const a=angTo(z.x,z.y,p.x,p.y), gap=angDiff(z.a,a)*Math.sign(z.spin||1); if(gap>0&&gap<0.32+16/Math.max(40,d)){ if(z.jump) jump=true; else dash=true; } } }
  for(const R of G.rings) if(R.owner!=='player'&&R.dmg>0&&Math.abs(dist(R.x,R.y,p.x,p.y)-R.rad)<56) jump=true;
  if(jump) m3BotTap('jump');
  else if(dash&&typeof canShadow==='function'&&canShadow()&&!(typeof p4RollTakes==='function'&&p4RollTakes())&&!(M3B.dashT>G.time)){ M3B.dashT=G.time+0.9; m3BotTap('roll'); m3BotEv('dash'); }
}
function m3BotFrame(dt){
  const p=player, e=G.boss, I=M3B.inp; M3B.t+=dt; if(!M3B.on) return; I.fire=false; I.attack=false;
  if(p.dead){ M3B.tx=null; m3BotMove(dt); return; }
  if(M3B.heal&&p.hp<p.maxHp*0.4){ p.hp=p.maxHp; M3B.heals++; }
  if(M3B.pound>0){ M3B.pound-=dt; if((p.z||0)>0||(p.vz||0)>0) I.attack=true; }
  if(!e||e.dead||G.fightIntro||scene!=='play'){ M3B.tx=null; m3BotMove(dt); return; }
  // air: come up for a breath before it runs out
  if(m3Dive()&&typeof P4!=='undefined'&&P4.air<2.6){ M3B.airUp=true; m3BotRoll(); }
  if(M3B.airUp&&!m3Dive()&&typeof P4!=='undefined'&&P4.air>=p4AirMax()*0.85) M3B.airUp=false;
  M3B.hitT-=dt; const swing=k=>{ if(M3B.hitT<=0&&m3BotSwing(e,k)) M3B.hitT=0.45; };
  const busy=m3BotPlan(e,dt,swing);
  // small foes close by get swatted while the boss is out of reach
  if(M3B.hitT<=0&&!I.fire){ let q=null, bd=1e9; for(const f of G.enemies){ if(f===e||f.dead||f.boss||f.mini||f.passive||f.spawnIn>0) continue; const dd=dist(p.x,p.y,f.x,f.y)-f.r; if(dd<60&&dd<bd){ bd=dd; q=f; } } if(q&&m3BotSwing(q,1)){ M3B.hitT=0.45; m3BotEv('swat'); } }
  if(!busy){ const q=m3BotDanger(e); if(q){ m3BotGo(q.x,q.y); I.fire=false; M3B.dodges++; } }
  m3BotHop(e);
  m3BotMove(dt);
}
// the nearest point of a dungeon room floor cell of a type (sand for a burrow), or null
function m3BotCell(R,test,x,y,maxD){ const A=AREA; if(!A||!A.cave) return null; const c=A.cave; let best=null, bd=(maxD||1e9)**2;
  c1Cells(R,(k,i,j,cx,cy)=>{ if(c.grid[k]!==0||!test(c.typ[k],k)) return; const d=dist2(cx,cy,x,y); if(d<bd){ bd=d; best={x:cx,y:cy,k}; } }); return best; }
const m3SandTy=t=>typeof TY!=='undefined'&&(t===TY.p4sand||t===TY.p4packed);
// one boss's plan for this frame. Returns true while it must not be pulled away by a dodge
function m3BotPlan(e,dt,swing){
  const p=player, T=e.type, M=M3B.mech, D=m3RoomOf(e), near=(r,a)=>m3BotNear(e,r==null?e.r+40:r,a);
  // ---- Madame Octavia
  if(T==='m_octavia'){ if(!D){ near(); swing(1); return false; }
    if(e.mode==='strand'){ near(e.r+34); swing(1); return false; }
    if(e.mode==='wall'||!e.mode){ if(m3Dive()) m3BotRoll();
      const a=D.arms.find(q=>q.ph==='lie'&&q.t<q.dur-0.4); if(a){ m3BotGo(a.x+(p.x>a.x?36:-36),a.y+18); swing(1); return false; }
      m3BotGo(D.R.cx+Math.cos(M3B.t*0.5)*150,D.R.cy+Math.sin(M3B.t*0.5)*110); return false; }
    // the flood: dive (with the mechanic), hit her eye when she lunges out; from phase 3 turn a valve while she is out
    if(M&&!m3Dive()&&!M3B.airUp&&(e.bph<2||!D.valves.length)) m3BotRoll();
    if(M&&e.bph>=2&&D.valves.length){ let v=D.valves[0]; for(const q of D.valves) if(dist(p.x,p.y,q.x,q.y)<dist(p.x,p.y,v.x,v.y)) v=q;
      const n=M3NRM[v.side], fx=v.x+n[0]*70, fy=v.y+n[1]*70; m3BotGo(fx,fy);
      if(m3BotAt(fx,fy,70)&&(e.sw==='out'||e.sw==='lunge'||(e.sw==='eye'&&e.st<0.5))&&!(M3B.useT>G.time)){ M3B.useT=G.time+0.6; m3BotTap('use'); m3BotEv('valve'); }
      return m3BotAt(fx,fy,70)&&e.sw!=='lunge'; }
    if(e.sw==='out'){ const ex=e.x+Math.cos(e.face)*e.r*0.7, ey=e.y+Math.sin(e.face)*e.r*0.7; m3BotGo(ex+Math.cos(e.face)*40,ey+Math.sin(e.face)*40); swing(1); return false; }
    near(e.r+150,(M3B.t*0.6)%TAU); return false; }
  // ---- Baron Puffington
  if(T==='m_puffington'){ const S0=M3PUFF.sb, Mo=m3PuffMouth(e);
    if(e.mode==='cork'||!e.mode){ if(m3Dive()) m3BotRoll();
      if(e.dazeT>0){ m3BotGo(Mo.x-56,Mo.y+10); swing(1); return false; }
      const sx=S0.x+S0.r-80, sy=S0.y+((M3B.t%8)<4?-70:70); m3BotGo(sx,sy);
      if(M&&e.state==='inhale'&&!(M3B.bombT>G.time)&&bombsN()>0){ const d=dist(p.x,p.y,Mo.x,Mo.y); if(d<430){ p.facing=angTo(p.x,p.y,Mo.x,Mo.y); throwBomb(p,clamp((d*0.8-70)/(300-70),0,1)); M3B.bombT=G.time+1.4; m3BotEv('bomb'); } }
      if(!M) swing(1); return false; }
    if(e.mode==='swim'){ const deep=m3PuffDeep(p.x,p.y);
      if(M&&!m3Dive()&&!M3B.airUp&&deep) m3BotRoll();
      if(e.state==='dizzy'||e.state==='recover'||e.state==='chase'){ near(e.r+30); swing(1); return false; }
      near(e.r+110); return false; }
    // the beach ball: stand back from the landing spot and Ground Pound just as he lands
    if(m3Dive()) m3BotRoll();
    if(e.flipT>0){ near(e.r+30); swing(1); return false; }
    if(e.state==='hop'){ const tx=e.hx1, ty=e.hy1, a=angTo(tx,ty,p.x,p.y), q={x:tx+Math.cos(a)*135,y:ty+Math.sin(a)*135}; if(dist(q.x,q.y,S0.x,S0.y)>S0.r-30){ const b=angTo(S0.x,S0.y,q.x,q.y); q.x=S0.x+Math.cos(b)*(S0.r-30); q.y=S0.y+Math.sin(b)*(S0.r-30); } m3BotGo(q.x,q.y);
      const rem=e.hopT-e.st; if(M&&rem<0.2&&dist(p.x,p.y,tx,ty)<200) m3BotPound(); return true; }
    if(e.state==='landed'||e.state==='dizzy'){ near(e.r+30); swing(1); return false; }
    near(e.r+150); return false; }
  // ---- Gravelgut
  if(T==='m_gravelgut'){ if(!D){ near(); swing(1); return false; }
    if(e.stuck){ if(m3Bur()) m3BotRoll(); const tx=e.x+Math.cos(e.face)*20, ty=e.y+Math.sin(e.face)*20-30; m3BotGo(tx+Math.cos(e.face)*30,ty+Math.sin(e.face)*30+30); swing(1); return false; }
    if(M&&e.state==='rear'){ if(!m3Bur()){ const s=m3BotCell(D.R,m3SandTy,p.x,p.y,400); if(s&&dist(p.x,p.y,s.x,s.y)>20) m3BotGo(s.x,s.y); else { M3B.tx=null; m3BotRoll(); } return true; }
      m3BotGo(e.x,e.y); if(dist(p.x,p.y,e.x,e.y)<40) { m3BotRoll(); m3BotEv('popup'); } return true; }
    if(m3Bur()&&e.state!=='rear'&&!(G.fz||[]).some(z=>z.k==='c1mark'&&dist(z.x,z.y,p.x,p.y)<z.r+30)) m3BotRoll();
    if(e.bph===0&&M){ let P=null; for(const q of D.pillars) if(q.up&&(!P||dist(p.x,p.y,q.x,q.y)<dist(p.x,p.y,P.x,P.y))) P=q;
      if(P){ const a=angTo(P.x,P.y,D.R.cx,D.R.cy); m3BotGo(P.x+Math.cos(a)*62,P.y+Math.sin(a)*62); } if(e.state==='up') swing(1); return false; }
    if(e.bph===1&&M){ const pl=(G.fz||[]).find(z=>z.k==='m3plate'&&!z.crack&&z.life-z.t>4);
      if(pl){ m3BotGo(pl.x,pl.y); if(e.state==='up') swing(1); return false; }
      if(!e.under&&e.state!=='chase') return false;
      const s=m3BotCell(D.R,m3SandTy,p.x,p.y-160,500); if(s){ M3B.inp.fire=true; m3BotBreath(s.x,s.y,false,170); m3BotEv('blaze'); return true; } return false; }
    if(e.state==='up'||e.state==='leap') { swing(1); }
    m3BotGo(D.R.cx+Math.cos(M3B.t*0.4)*120,D.R.cy+Math.sin(M3B.t*0.4)*80); return false; }
  // ---- Lord Fanfare
  if(T==='m_fanfare'){ if(!D){ near(); swing(1); return false; }
    if(e.downT>0||e.stumbleT>0){ near(e.r+30); swing(1); return false; }
    if(e.bph===1){ const Mi=D.mirror;
      if(M){ if(!(Mi.lit>1)){ m3BotGo(Mi.x,Mi.y+80); if(m3BotAt(Mi.x,Mi.y+80,40)){ m3BotBreath(Mi.x,Mi.y-34,true,175); m3BotEv('crystal'); return true; } return false; }
        const want=((Math.round(angTo(Mi.x,Mi.y-10,e.x,e.y)/(Math.PI/4))%8)+8)%8;
        if(Mi.dir!==want){ m3BotGo(Mi.x,Mi.y+56); if(m3BotAt(Mi.x,Mi.y+56,40)&&!(M3B.useT>G.time)){ M3B.useT=G.time+0.4; m3BotTap('use'); m3BotEv('turn'); } return false; } }
      m3BotGo(Mi.x+60,Mi.y+90); return false; }
    if(M&&e.fan>0.6){ const eyes=m3FanEyes(e); let q=null; for(const y of eyes) if(!e.eyes[y.i]&&(!q||dist(p.x,p.y,y.x,y.y)<dist(p.x,p.y,q.x,q.y))) q=y;
      const open=e.bph<2||e.state==='dizzy'||e.state==='stagger';
      if(q&&open){ const ok=e.bph<2||e.state==='dizzy'||Math.abs(angDiff(e.face,angTo(e.x,e.y,p.x,p.y)))>1.1;
        if(ok&&dist(p.x,p.y,q.x,q.y)<170){ m3BotBreath(q.x,q.y,true,170); m3BotEv('eyefire'); return false; } const back=e.face+Math.PI+(M3B.side>0?0.55:-0.55); m3BotGo(e.bph<2?q.x+Math.cos(angTo(q.x,q.y,p.x,p.y))*120:e.x+Math.cos(back)*200,e.bph<2?q.y+Math.sin(angTo(q.x,q.y,p.x,p.y))*120:e.y+Math.sin(back)*160); return false; }
      if(q&&e.bph>=2){ near(230,(M3B.t*0.5)%TAU); return false; } }
    near(e.r+44,(M3B.t*0.8)%TAU); swing(1); return false; }
  // ---- Hush
  if(T==='m_hushboss'){ const P=e.m3hp; if(!P){ near(); swing(1); return false; }
    if(e.kneel){ M3B.tx=null; return true; }
    if(m3Bur()&&!(G.fz||[]).some(z=>z.k==='m3shush')) m3BotRoll();
    // the Great Shush: burrow in the rim sand and let it pass
    const sh=(G.fz||[]).find(z=>z.k==='m3shush');
    if(M&&sh&&D){ if(!m3Bur()){ const s=m3BotCell(D.R,m3SandTy,p.x,p.y,900); if(s&&dist(p.x,p.y,s.x,s.y)>18) m3BotGo(s.x,s.y); else { M3B.tx=null; m3BotRoll(); m3BotEv('burrow'); } } else M3B.tx=null; return true; }
    if(e.low||e.downT>0){ if(m3Lvl()>=1&&e.downT>0){ m3BotGo(p.x,p.y+200); return false; } near(e.r+30); swing(1); return false; }
    const lightStone=(all)=>{ let S0=null; for(const s of P.stones) if(!(s.lit>(all?3:0))&&(!S0||dist(p.x,p.y,s.x,s.y)<dist(p.x,p.y,S0.x,S0.y))) S0=s; if(!S0) return false;
      if(dist(p.x,p.y,S0.x,S0.y+70)>30) m3BotGo(S0.x,S0.y+70); else { m3BotBreath(S0.x,S0.y-22,true,175); m3BotEv('stone'); } return true; };
    if(e.bph===0&&M){ if(lightStone(false)) return false; }
    if(e.bph===1&&M){ if(lightStone(true)) return false; }
    if(e.bph===2&&M){ let K=null; for(const k of P.knots) if(!(k.jerkT>0)&&(!K||dist(p.x,p.y,k.x,k.y)<dist(p.x,p.y,K.x,K.y))) K=k;
      if(K){ m3BotGo(K.x,K.y+40); if(dist(p.x,p.y,K.x,K.y)<70){ const before=e.jerks; swing(1); if(e.jerks>before) m3BotEv('knot'); } return false; } }
    if(e.bph>=3&&M){ const K=e.p2rings&&e.p2rings[0];
      if(m3Lvl()<1){ const U=AREA&&AREA.p3&&AREA.p3.ups; if(U&&U.length){ let u=U[0]; for(const q of U) if(dist(p.x,p.y,q.x,q.y)<dist(p.x,p.y,u.x,u.y)) u=q; m3BotGo(u.x,u.y); m3BotEv('toVent'); } return false; }
      M3B.tx=null; if(K&&!K.done&&!(e.downT>0)){ K.onPull(K,e,{strain:M3B.pullT/K.need,taut:true,dt}); M3B.pullT+=dt; if(M3B.pullT>=K.need){ M3B.pullT=0; K.then(K,e); m3BotEv('pull'); } } else M3B.pullT=0; return true; }
    near(e.r+60,(M3B.t*0.6)%TAU); swing(1); return false; }
  // ---- Lady Zapp
  if(T==='m_zapp'){ if(!D){ near(); swing(1); return false; }
    if(e.state==='mesmer'||e.state==='toLamp'){ if(M&&!m3Dive()&&p4DeepAt(p.x,p.y)&&false) m3BotRoll(); near(e.r+30); swing(1); return false; }
    if(M&&!(e.lureCd>G.time+0.6)){ let L=null; for(const q of D.lamps) if(!(q.lit>0)&&(!L||dist(p.x,p.y,q.x,q.y)<dist(p.x,p.y,L.x,L.y))) L=q;
      if(L){ const fl=m3BotCell(D.R,(t,k)=>t===0&&!tWet(k)&&dist(tPos(k).x,tPos(k).y,L.x,L.y)>40,L.x,L.y,400)||{x:L.x,y:L.y+90}; if(dist(p.x,p.y,fl.x,fl.y)>30){ m3BotGo(fl.x,fl.y); return false; } m3BotBreath(L.x,L.y-30,false,175); m3BotEv('lamp'); return true; } }
    near(e.r+120); swing(1); return false; }
  // ---- Big Fin
  if(T==='m_bigfin'){ if(m3Bur()&&!e.under) m3BotRoll();
    if(!e.under){ near(e.r+30); swing(1); return false; }
    const d=dist(p.x,p.y,e.x,e.y); if(M&&d<170&&m3OnSand(p.x,p.y)) m3BotPound(); near(140,(M3B.t*0.9)%TAU); return false; }
  // ---- Prism
  if(T==='m_prism'){ if(!D){ near(); swing(1); return false; }
    if(e.downT>0||e.crackT>0){ near(e.r+30); swing(1); return false; }
    if(M&&(e.cracks||0)>=1&&(e.blinds||0)<1){ const Mi=D.mirror;
      if(!(Mi.lit>1)){ m3BotGo(Mi.x,Mi.y+80); if(m3BotAt(Mi.x,Mi.y+80,40)){ m3BotBreath(Mi.x,Mi.y-34,true,175); return true; } return false; }
      const want=((Math.round(angTo(Mi.x,Mi.y-10,e.x,e.y)/(Math.PI/4))%8)+8)%8;
      if(Mi.dir!==want&&!(M3B.useT>G.time)){ m3BotGo(Mi.x,Mi.y+56); if(m3BotAt(Mi.x,Mi.y+56,40)){ M3B.useT=G.time+0.35; m3BotTap('use'); m3BotEv('turn'); } return false; }
      const a=Mi.dir*Math.PI/4; m3BotGo(Mi.x+Math.cos(a)*420,Mi.y-10+Math.sin(a)*420); return false; }
    if(M&&dist(p.x,p.y,e.x,e.y)<200){ m3BotBreath(e.x,e.y,false,160); m3BotEv('blaze'); return false; }
    near(e.r+60); swing(1); return false; }
  // ---- Duke Umberwing
  if(T==='m_umberwing'){ if(!D){ near(); swing(1); return false; }
    if(e.downT>0||e.state==='stare'){ if(M&&e.state==='stare'&&!(e.falls>=1)&&dist(p.x,p.y,e.x,e.y)<170){ m3BotBreath(e.x,e.y-20,true,160); m3BotEv('wingfire'); return false; } near(e.r+30); swing(1); return false; }
    if(M&&e.low&&!(e.falls>=byDiff(1,1,2))&&dist(p.x,p.y,e.x,e.y)<170){ m3BotBreath(e.x,e.y-20,true,160); m3BotEv('wingfire'); return false; }
    if(M){ let L=null; for(const q of D.lamps) if(!(q.lit>0)&&!(q.dukeT>G.time)&&(!L||dist(p.x,p.y,q.x,q.y)<dist(p.x,p.y,L.x,L.y))) L=q;
      if(L&&!D.lamps.some(q=>q.lit>0)){ if(dist(p.x,p.y,L.x,L.y+70)>30){ m3BotGo(L.x,L.y+70); return false; } m3BotBreath(L.x,L.y-48,false,175); m3BotEv('lamp'); return false; } }
    near(e.r+40,e.blocking?e.face+Math.PI:undefined); if(!e.blocking) swing(1); return false; }
  near(); swing(1); return false;
}
const M3F_DBG={kit:m3Kit,M3,M3B,M3SITE,M3DUN,M3ROOM,M3_TPL,M3PUFF,M3LAB_ROOM,M3HUSH,FOES,m3BossStart,m3Test,m3PuffLink,m3HushParts,m3HushDef,
  types:['m_moonjelly','m_crabpirate','m_sandshark','m_glassscorp','m_shade','m_mothknight','m_mirrorimp','f_mothling','m_zapp','m_bigfin','m_prism','m_umberwing','m_octavia','m_puffington','m_gravelgut','m_fanfare','m_hushboss'],
  bot(type,o){ o=o||{}; Object.assign(M3B,{on:true,type,mech:o.mech!==false,heal:o.heal!==false,t:0,hitT:0,heals:0,ev:{},dealt:0,dodges:0,tx:null,ty:null,inp:{},tap:{},stuckT:0,pullT:0,pound:0,useT:0,bombT:0,airUp:false,rollT:0,dashT:0}); M3.bot=m3BotFrame; return true; },
  stop(){ M3B.on=false; M3.bot=null; M3B.tx=null; M3B.inp={}; M3B.tap={}; },
  state(){ const e=G.boss, D=e&&m3RoomOf(e); return {scene,site:G.fightSite,intro:G.fightIntro,done:Object.assign({},G.bossDone),dmg:Math.round(M3.dmg),hits:M3.hits,heals:M3B.heals,dodges:M3B.dodges,
      src:Object.fromEntries(Object.entries(M3.bySrc).map(([k,v])=>[k,Math.round(v)])),bySt:Object.fromEntries(Object.entries(M3.bySt).map(([k,v])=>[k,Math.round(v)])),ev:Object.assign({},M3.ev),bot:Object.assign({},M3B.ev),dealt:Math.round(M3B.dealt),t:+M3B.t.toFixed(1),dark:+M3.dark.toFixed(2),hush:G.choices.m_hush||null,
      boss:e&&!e.dead?{type:e.type,hp:Math.round(e.hp),max:Math.round(e.maxHp),pct:+(e.hp/e.maxHp).toFixed(3),bph:e.bph||0,state:e.state,mode:e.mode||null,level:e.level,x:Math.round(e.x),y:Math.round(e.y),z:Math.round(e.z||0),
        sw:e.sw||null,eyeHits:e.eyeHits,strands:e.strands,bombsIn:e.bombsIn,diveHits:e.diveHits,flips:e.flips,pillar:e.pillarStuns,plate:e.plateStuns,pops:e.pops,popped:e.popped,dazzles:e.dazzles,eclBroken:e.eclBroken,jerks:e.jerks,pulls:e.pulls,
        mes:e.mes,outs:e.outs,cracks:e.cracks,blinds:e.blinds,stares:e.stares,falls:e.falls,kneel:!!e.kneel,under:!!e.under}:null,
      room:D?{type:D.type,flooded:D.flooded,water:D.water!=null?+D.water.toFixed(2):null}:null,
      foes:G.enemies.filter(q=>!q.dead).map(q=>q.type),player:{x:Math.round(player.x),y:Math.round(player.y),z:Math.round(player.z||0),hp:Math.round(player.hp),max:player.maxHp,lvl:m3Lvl(),level:player.level,dive:m3Dive(),bur:m3Bur(),air:typeof P4!=='undefined'?+P4.air.toFixed(1):null}}; },
  choose(i){ if(typeof chooseOpt==='function'&&DLG&&DLG.opts){ DLG.chars=1e9; chooseOpt(i||0); return true; } return false; },
  dlg(){ return DLG?{who:lineParts(DLG.lines[DLG.i]).who,opts:DLG.opts?DLG.opts.length:0,optT:DLG.opts?DLG.opts.map(o=>o.t):null,i:DLG.i,n:DLG.lines.length}:null; },
  rooms(){ return M3.rooms.map(D=>({type:D.type,room:D.R.id,cx:D.R.cx,cy:D.R.cy,x0:D.R.x0,y0:D.R.y0,x1:D.R.x1,y1:D.R.y1})); },
  run(sec,dt){ return window.__eb.foes.step(sec,dt||1/30); },
  input(o,sec){ M3B.force=Object.assign({},o); M3B.forceT=sec==null?0.1:sec; return true; },
  tap(k){ M3B.on=true; M3B.tap[k]=true; return true; },
  devEval(src){ return eval(src); }};
window.__ebX=Object.assign(window.__ebX||{},{m3Test,m3f:M3F_DBG});
