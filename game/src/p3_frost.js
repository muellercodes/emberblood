// ================= p3_frost: the three Act III powers (v9, wave 1b)
//   Blaze Breath (blaze)    hold fire breath: after about 0.8 s the flame turns blue (a ring fills at Ash's mouth, then a
//                           bright FWOOMP) and becomes a long hot jet (420 px). The jet melts ice walls, frost locks, ice
//                           domes and icicles, thaws frozen people, lights far braziers and torches, sets off Blast Bombs
//                           at once, and burns icy foes extra. Normal breath only makes ice "sweat".
//   Wind Riding (windride)  jump or fly into a wind stream (outdoors WIND.stream, in dungeons a room's ribbons) and it
//                           carries Ash along it: the wing meter refills, the one-level flight ceiling and no-fly zones
//                           do not apply, JUMP hops to another stream in reach (or off), the end drops him into flight
//                           or a glide. Updrafts lift him onto ribbons; wind bells ring as he passes; vanes pick ribbons.
//   Ground Pound (pound)    ATTACK in the air (from a jump, or from flight with a melee weapon) slams down: a shockwave
//                           that stuns, knocks back and breaks shields; it breaks pound-cracked floors, lids and ice
//                           domes, presses rune plates, rings drums, flips seesaws and pound switches.
// World objects outdoors: p3Add(kind,{...}) (a LANDMARK), streams WIND.stream({...}); any landmark can react with
// p3On(o,{blaze,pound,fire}). Dungeon cells and marks come from a room's `frost` layer (11 rows like tpl) and room
// fields (ribbons, frozen, seesaws, vanes, bells). The guide for map and dungeon helpers is scratchpad/POWERS3.md.
// Everything extends the engine by wrapping; the only edit elsewhere is a6b_weapons.js (attack in the air reads canPound).

// ---------- 0. numbers, gates and state
const P3N={warm:0.8, warmK:0.25, jet:420, jetK:0.1, jetW0:14, jetW1:46, jetCost:0.7, jetDmg:1.25, hotK:0.15, iceK:1.8, grow:0.14,
  ride:420, skyhop:1.15, rideZ:52, rideLv:9, steer:150, hopR:280, hopT:0.36, enter:70, tail:1.6, windK:0.3, reCd:0.7,
  pound:92, poundK:0.3, stun:1.2, poundDmg:1.9, kb:420, armourT:4, drumR:300, drumAt:62, crackR:46, crackT:8, crackEasy:12,
  melt:1.2, door:1.5, thaw:2, lock:2.5, dome:2, icicle:0.6, drift:0.5, lockPound:2.0};
const P3={g:null,area:null,t:0,tips:{},bz:{hold:0,blue:false,flash:0,jetA:0,sndT:0,sweatT:-9},jet:null,jetOn:false,ride:null,mv:null,
  out:[],streams:[],hooks:[],waves:[],fx:[],pbuf:0,tail:0,reCd:0,lastS:null,poundL:[],inp:null,shotT:0,lastPound:null};
function canBlaze(){ return !!G&&G.mode==='story'&&hasAbil('blaze'); }
function canWindride(){ return !!G&&G.mode==='story'&&hasAbil('windride'); }
const p3Blue=()=>!!(G&&G.flags&&G.flags.f_bluefire);          // Bluefire (quest f_rime): reach +20%, melt and thaw times halved
const p3Skyhop=()=>!!(G&&G.flags&&G.flags.f_skyhop);          // Skyhop (quest f_sled): ribbons 15% faster, hops jump higher
const p3Easy=()=>!!(G&&G.diff&&G.diff.dmg<=0.55);
function p3WarmT(){ return P3N.warm/(1+P3N.warmK*hasSkill('blaze2'))*(p3Blue()?0.8:1); }
function p3JetLen(){ return P3N.jet*(1+P3N.jetK*hasSkill('blaze2'))*(p3Blue()?1.2:1); }
// how long a melt takes: base seconds, faster with White Fire (blaze2) and Bluefire
function p3Need(s){ return s/(1+P3N.warmK*hasSkill('blaze2'))*(p3Blue()?0.5:1); }
function p3PoundR(){ return P3N.pound*(1+P3N.poundK*hasSkill('pound2')); }
function p3Ctl(){ try{ return balCtls(); }catch(e){ return {jump:'C',attack:'J',roll:'Space',fire:'K',use:'E',sprint:'Shift'}; } }
function p3Tip(id,title,text,n){ const c=P3.tips[id]||0; if(c>=(n||1)) return; P3.tips[id]=c+1; try{ mvTip(title,text,7,'p3_'+id); }catch(e){} }
function p3Say(x,y,text,col,id,gap){ const k='say_'+(id||text); if(P3.tips[k]!=null&&G.time-P3.tips[k]<(gap||3)) return; P3.tips[k]=G.time; ftext(x,y,text,col||'#dff4ff',13); }
const p3Melee=()=>{ const w=curWeapon(), D=typeof wDef==='function'?wDef(w):WEAPONS[w]; return !(D&&D.flyOK); };
const p3Ice=e=>!!(e&&(e.ice||e.snowy||(EDEF[e.type]&&EDEF[e.type].ice)||e.type==='c2_alpha'));

// ---------- 1. sounds (synthesized, like the moves and coast modules)
function p3Snd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted||!SFX.noise) return;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.42*(v==null?1:v); out.connect(ac.destination);
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.01,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(kind){
      case 'charge': tn('sine',300,900,0.7,0.03); nz(0.7,0.05,'bandpass',600,2600,2); break;
      case 'blue': nz(0.5,0.3,'bandpass',300,2400,0.7); tn('triangle',520,1040,0.3,0.06); tn('sine',1560,2080,0.25,0.03,0.05); break;
      case 'jet': nz(0.24,0.08,'highpass',1600,3400,0.5); break;
      case 'hiss': nz(0.5,0.12,'highpass',2600,5200,0.5); nz(0.3,0.05,'lowpass',500,120,0.7); break;
      case 'melt': nz(0.6,0.2,'highpass',2400,6000,0.5); for(let i=0;i<4;i++) tn('sine',900+i*220,500+i*120,0.08,0.03,0.08+i*0.07); break;
      case 'thaw': for(let i=0;i<5;i++) tn('triangle',1200+i*260,900+i*200,0.12,0.04,i*0.05); nz(0.4,0.16,'highpass',2000,5000,0.6,0.05); break;
      case 'crack': nz(0.18,0.28,'highpass',1200,500,1.4); tn('triangle',280,120,0.16,0.07); break;
      case 'shatter': nz(0.35,0.3,'highpass',3000,1400,0.8); for(let i=0;i<6;i++) tn('triangle',1800+i*300,1200+i*200,0.06,0.03,i*0.03); break;
      case 'wind': nz(0.9,0.16,'bandpass',300,1100,0.6); nz(0.7,0.08,'bandpass',900,1800,1.2,0.1); break;
      case 'whoosh': nz(0.32,0.2,'bandpass',260,1600,0.8); break;
      case 'ride': nz(0.25,0.05,'bandpass',500,800,1.6); break;
      case 'pound': nz(0.6,0.5,'lowpass',800,40,0.7); tn('sine',90,28,0.5,0.3); nz(0.2,0.2,'bandpass',1200,300,1,0.02); break;
      case 'drum': tn('sine',70,44,0.9,0.34); tn('triangle',140,90,0.5,0.1); nz(0.4,0.2,'lowpass',500,80,0.9); break;
      case 'bell': for(const [f,d] of [[880,0.9],[1320,0.7],[1760,0.5]]) tn('sine',f,f*0.995,d,0.05); break;
      case 'boing': tn('triangle',180,520,0.24,0.08); tn('sine',520,260,0.3,0.04,0.12); break;
      case 'click': tn('square',700,500,0.05,0.04); nz(0.05,0.1,'highpass',3000,5000,1); break;
      case 'clunk': nz(0.3,0.3,'lowpass',500,60,0.8); tn('sine',120,60,0.28,0.12); break;
      case 'puff': nz(0.35,0.14,'bandpass',500,1400,0.8); break;
    }
  }catch(e){}
}

// ---------- 2. geometry (the polyline helpers come from p2_coast.js: p2PolyD, p2PolyAt, p2PolyLen)
function p3Bb(pts,m){ const b=[1e9,1e9,-1e9,-1e9]; for(const q of pts){ b[0]=Math.min(b[0],q[0]); b[1]=Math.min(b[1],q[1]); b[2]=Math.max(b[2],q[0]); b[3]=Math.max(b[3],q[1]); } return [b[0]-m,b[1]-m,b[2]+m,b[3]+m]; }
const p3InBb=(b,x,y)=>x>b[0]&&x<b[2]&&y>b[1]&&y<b[3];
function p3Lvl(x,y){ if(AREA){ const k=tCell(x,y); return k<0?0:Math.max(0,dunH(k)); } return elevLvl(x,y); }

// ---------- 3. Blaze Breath
// The jet: J={ox,oy (on the ground, at the mouth), ang, L (stops at walls, faces and ice), t}. Hit test: a point within
// r of the jet's widening core (14 px at the mouth to 46 px at the tip).
function p3JetHits(x,y,r){
  const J=P3.jet; if(!J||!P3.bz.blue) return false;
  const dx=x-J.ox, dy=y-J.oy, ca=Math.cos(J.ang), sa=Math.sin(J.ang), t=dx*ca+dy*sa;
  if(t<-(r||0)||t>J.L+(r||0)) return false;
  const w=P3N.jetW0+(P3N.jetW1-P3N.jetW0)*clamp(t/Math.max(1,J.L),0,1), d=Math.abs(-dx*sa+dy*ca);
  return d<w/2+(r||0);
}
// normal breath (ground or from the sky) on a point: the stock cone
function p3BreathHits(x,y,r){
  const p=player; if(!p||!p.breathing) return false; const f=p.facing;
  if(p.flying) return inArcC(p.x,p.y,f,180,0.5,{x,y,r:r||8});
  return inArcC(p.x+Math.cos(f)*16,p.y+Math.sin(f)*16,f,175,0.45,{x,y,r:r||8});
}
// how far the jet reaches: walls, shut doors, ice and cliffs above Ash stop it (it still hits what stopped it)
function p3JetTrace(ox,oy,ang,L0){
  const ca=Math.cos(ang), sa=Math.sin(ang), st=12;
  if(AREA){ const A=AREA, c=A.cave; if(!c) return L0;
    for(let s=st;s<=L0;s+=st){ const k=tCell(ox+ca*s,oy+sa*s); if(k<0) return s; if(c.grid[k]===1&&c.typ[k]!==1) return s; const d=c.dyn&&c.dyn[k], g=d&&A.gates[d-1]; if(g&&g.closed&&!g.p2t&&g.type!=='tobj') return s+10; }
    return L0; }
  const lv=player.flying?elvPlayerShotLvl():elevLvl(player.x,player.y);
  for(let s=st;s<=L0;s+=st){ const x=ox+ca*s, y=oy+sa*s; if(outOfMap(x,y,10)) return s; if(elevLvl(x,y)>lv&&(elevFace(x,y)&EF.FACE)) return s; if(s>40&&p3SolidOut(x,y)) return s+12; }
  return L0;
}
function p3SolidOut(x,y){ let hit=false; forCols(x,y,4,c=>{ if(hit||!colActive(c)||c.noProj||c.low) return; if(c.t==='c'){ if(dist2(x,y,c.x,c.y)<(c.r+4)**2) hit=true; } else if(x>c.x0-4&&x<c.x1+4&&y>c.y0-4&&y<c.y1+4) hit=true; }); return hit; }
// the stock breath cone is widened along the jet while it burns blue: every fire test in the game (foes, braziers,
// lanterns, roots, cave torches, Ward stones, moth curtains, fuses...) reaches as far as the jet does
{ const base=inArcC; inArcC=function(ox,oy,ang,range,half,c){
    if(base(ox,oy,ang,range,half,c)) return true;
    if(!P3.jetOn||!c) return false;
    if(!((range===175&&half===0.45)||(range===180&&half===0.5))) return false;
    return p3JetHits(c.x,c.y,c.r||0);
  }; }
// the blue jet is hotter: x1.25 (+15% per White Fire rank) and x1.8 on icy foes
{ const base=damageEnemy; damageEnemy=function(e,amt,o){
    if(P3.jetOn&&o&&o.src==='fire'&&e&&!e.dead){ const k=P3N.jetDmg*(1+P3N.hotK*hasSkill('blaze2'))*(p3Ice(e)?P3N.iceK:1); o=Object.assign({},o,{mult:(o.mult||1)*k}); }
    return base(e,amt,o);
  }; }
{ const base=doBreath; doBreath=function(dt){
    const p=player; if(!p||!G) return base(dt);
    const B=P3.bz, can=canBlaze()&&!(typeof p4NoFire==='function'&&p4NoFire());
    B.hold+=dt; B.on=true;
    if(can&&!B.blue&&B.hold>=p3WarmT()) p3BlueStart(p);
    if(can&&B.blue){
      const f=p.facing, ox=p.x+Math.cos(f)*16, oy=p.y+Math.sin(f)*16;
      B.jetA=Math.min(1,B.jetA+dt/P3N.grow);
      P3.jet={ox,oy,ang:f,L:p3JetTrace(ox,oy,f,p3JetLen()*B.jetA),t:G.time};
      const n0=G.particles.length; P3.jetOn=true; try{ base(dt); } finally{ P3.jetOn=false; }
      for(let i=n0;i<G.particles.length;i++){ const q=G.particles[i]; if(q.kind==='fire'){ q.kind='bfire'; q.col='190,235,255'; } }   // the stock flame turns blue too
      p3JetTick(p,dt);
    }else{
      P3.jet=null; base(dt);
      if(can) p3WarmFx(p,dt);
      p3FireTick(p,dt,false);
    }
  }; }
function p3BlueStart(p){
  const B=P3.bz; B.blue=true; B.flash=0.45; B.jetA=0;
  p3Snd('blue'); flashA=Math.max(flashA,0.1); flashCol='170,220,255'; shake(2);
  const f=p.facing, mx=p.x+Math.cos(f)*18, my=p.y-(p.flying?p.z:6)+Math.sin(f)*18;
  emit(mx,my,22,{col:'190,235,255',smin:60,smax:220,lmin:.2,lmax:.45,zmin:1.5,zmax:3.2,drag:5});
  const c=p3Ctl(); p3Tip('blue',S('Blaze!','Blaze!'),S(`The flame burns blue: that is Blaze. Keep holding ${c.fire} to melt ice, thaw frozen folk and light far braziers.`,`Blue fire! Keep holding ${c.fire}.`),2);
  if(G.stats) G.stats.p3blaze=(G.stats.p3blaze||0)+1;
}
// the warm-up: the flame turns from gold to white, sparks gather at the mouth (drawn in p3DrawBlaze)
function p3WarmFx(p,dt){
  const k=clamp(P3.bz.hold/p3WarmT(),0,1); if(k<0.15) return;
  const f=p.facing, mx=p.x+Math.cos(f)*18, my=p.y-(p.flying?p.z:6)+Math.sin(f)*18;
  if(Math.random()<k*0.9){ const a=rand(0,TAU), d=rand(16,30); G.particles.length<950&&G.particles.push({x:mx+Math.cos(a)*d,y:my+Math.sin(a)*d,vx:-Math.cos(a)*d*5,vy:-Math.sin(a)*d*5,life:0.2,max:0.2,size:rand(1.4,2.4),grow:0,drag:0,kind:'spark',col:k>0.7?'210,240,255':'255,240,200',glow:true,rise:0,al:1}); }
  if(k>0.5&&Math.random()<0.5) emit(mx,my,1,{col:'255,250,235',ang:f,spread:0.25,smin:200,smax:320,lmin:.12,lmax:.22,zmin:2,zmax:3.5,drag:2});
  P3.bz.sndT-=dt; if(P3.bz.sndT<=0&&k>0.3&&k<0.6){ P3.bz.sndT=2; p3Snd('charge',0.6); }
}
// every frame of the blue jet: its particles, foes (onBlaze hooks), bombs, the world, the fire meter
function p3JetTick(p,dt){
  const J=P3.jet, B=P3.bz, ca=Math.cos(J.ang), sa=Math.sin(J.ang), z=p.flying?(p.z||0):6;
  // a cleaner fire: the blue jet costs less fire meter (30% of the drain comes back)
  p.energy=Math.min(p.maxEnergy,p.energy+p.stats.fireCost*dt*(1-P3N.jetCost));
  // particles: a fast blue stream from the mouth to the tip, steam where it hits
  const sp=J.L/0.3;
  for(let i=0;i<3;i++){ const a=J.ang+rand(-0.05,0.05), off=rand(0,40); G.particles.length<950&&G.particles.push({x:J.ox+ca*off,y:J.oy-z+sa*off,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp+z/0.3,life:0.3*(1-off/Math.max(60,J.L)),max:0.3,size:rand(3,5.5),grow:26,drag:0.2,kind:'bfire',col:'190,235,255',glow:true,rise:0,al:1}); }
  if(Math.random()<0.7){ const ex=J.ox+ca*J.L, ey=J.oy+sa*J.L; emit(ex+rand(-10,10),ey+rand(-10,10),1,{col:'230,248,255',glow:false,ang:-Math.PI/2,spread:0.9,smin:20,smax:70,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:9,drag:1,alpha:0.5}); }
  B.sndT-=dt; if(B.sndT<=0){ B.sndT=0.22; p3Snd('jet',0.6); }
  // bombs in the jet go off at once
  if(G.wproj&&typeof armsBlast==='function') for(const b of G.wproj) if(b.k==='bomb'&&!b.dead&&p3JetHits(b.x,b.y,8)){ b.dead=true; armsBlast(b.x,b.y); }
  // foes: their own reactions (Rimehounds lose their frost, Rime Knights their armour, Stalagbats fall)
  for(const e of G.enemies){ if(e.dead||!e.onBlaze||e.spawnIn>0) continue; if(p3JetHits(e.x,e.y,e.r||14)) try{ e.onBlaze(e,dt,{x:J.ox,y:J.oy,ang:J.ang}); }catch(err){ console.warn(err); } }
  p3FireTick(p,dt,true);
}
// fire on our things: blue=true is the jet (melts), false the normal flame (lights braziers, makes ice sweat)
function p3FireTick(p,dt,blue){
  const hit=blue?(x,y,r)=>p3JetHits(x,y,r)||p3BreathHits(x,y,r):(x,y,r)=>p3BreathHits(x,y,r);
  for(const o of p3Things()){
    const K=o.p3k; if(!K) continue; const r=K.hitR?K.hitR(o):(o.r||20);
    if(!hit(o.x,o.y,r)) continue;
    if(K.fire) K.fire(o,dt,blue);
    if(blue&&K.blaze) K.blaze(o,dt);
    else if(!blue&&K.blaze&&!o.done) p3Sweat(o);
  }
  if(AREA&&AREA.p3) p3CaveFire(AREA,p,dt,blue);
  for(const o of (AREA?(AREA.p3hooks||[]):P3.hooks)){ if(!AREA&&!p3HookHere(o)) continue; const H=o.p3on; if(!hit(o.x,o.y,H.r||o.r||24)) continue;
    if(H.fire) H.fire(o,dt,blue);
    if(H.blaze){ const B=H.blaze; if(blue){ if(B.when&&!B.when(o)) continue; o.p3heat=(o.p3heat||0)+dt; o.p3heatT=G.time; p3MeltFx(o.x,o.y-(B.h||20),0.4); if(o.p3heat>=p3Need(B.need||2)&&!o.p3fired){ o.p3fired=!B.repeat; o.p3heat=0; p3Snd('melt'); try{ B.then&&B.then(o); }catch(err){ console.warn(err); } } } else if(!o.p3fired) p3Sweat(o); } }
}
function p3Sweat(o){ if(canBlaze()) P3.bz.iceT=1; else p3Say(o.x,o.y-(o.h||40)-10,S('The ice sweats a little. Your fire is not hot enough.','The ice just drips.'),'#dff4ff','sweat',3); if(Math.random()<0.3) emit(o.x+rand(-12,12),o.y-rand(10,40),1,{col:'200,230,255',glow:false,ang:Math.PI/2,spread:0.2,smin:20,smax:50,lmin:.4,lmax:.7,zmin:1.2,zmax:2}); }
function p3MeltFx(x,y,k){ if(Math.random()<k){ emit(x+rand(-14,14),y+rand(-10,10),1,{col:'235,248,255',glow:false,ang:-Math.PI/2,spread:0.8,smin:15,smax:50,lmin:.5,lmax:.9,zmin:3,zmax:6,grow:8,drag:1,alpha:0.55}); } if(Math.random()<k*0.6) emit(x+rand(-12,12),y+rand(0,14),1,{col:'160,210,255',glow:false,ang:Math.PI/2,spread:0.2,smin:30,smax:70,lmin:.3,lmax:.5,zmin:1.2,zmax:2}); }
// the blue particles: white at birth, then ice blue, then deep blue, then gone
{ const base=drawParticles; drawParticles=function(){
    for(const q of G.particles){ if(q.kind!=='bfire') continue; const f=q.life/q.max; q.col=f>0.72?'245,252,255':f>0.45?'150,215,255':f>0.2?'70,140,255':'40,60,170'; }
    base();
  }; }

// ---------- 4. world objects (outdoors as LANDMARKS; the same kinds work inside an area builder with p3Add(kind,o,A))
// P3K[kind]: init(o,A), tick(o,dt), ground(o,t) (flat, under figures), stand(o,t) (upright, sorted by sy(o)),
//   fire(o,dt,blue) (any fire: normal breath, the jet, fire arrows), blaze(o,dt) (the blue jet only),
//   pound(o,info) (a Ground Pound landed within reach(o) px), ring(o,info) (a drum's shockwave), bomb(o,x,y) (a blast),
//   hit(o,src) (a swing, a thrown or shot weapon), act(o) (USE), prompt(o) -> text
const P3K={};
const ICE={hi:'#f6fcff',top:'#e2f4ff',base:'#a9daf4',mid:'#86c4ea',deep:'#5c9cd8',vio:'#c4b2f2',vioD:'#8a6ad0',snow:'#f8fbff'};
function p3Add(kind,o,A){
  const K=P3K[kind]; if(!K) throw new Error('p3Add: unknown kind '+kind);
  o.k='p3_'+kind; o.p3=kind; o.p3k=K;
  if(o.x==null&&o.pts){ o.x=o.pts[0][0]; o.y=o.pts[0][1]; }
  if(!o.id) o.id=`p3_${kind}_${Math.round(o.x)}_${Math.round(o.y)}`;
  if(K.prompt){ if(A) o.prompt=()=>K.prompt(o); else Object.defineProperty(o,'prompt',{get(){ return K.prompt(o); },configurable:true}); }
  if(A){ o.inArea=true; A.objs.push(o); A.p3list=null; if(K.init) K.init(o,A); }
  else{ LANDMARKS.push(o); P3.out.push(o); if(K.init) K.init(o,null); }
  return o;
}
// give any landmark or area object power reactions: p3On(o,{blaze:{need:2,h,then(o),when(o),repeat}, pound:{r:60,then(o,info)},
// fire(o,dt,blue), bomb(o,x,y)}). Inside an area builder pass A.
function p3On(o,spec,A){ o.p3on=spec||{}; if(A){ (A.p3hooks=A.p3hooks||[]).push(o); } else if(!P3.hooks.includes(o)) P3.hooks.push(o); return o; }
function p3HookHere(o){ if(AREA) return !!(AREA.p3hooks&&AREA.p3hooks.includes(o)); return o.x<IZX-50&&mapAt(o.y)===curMap(); }
function p3Things(){ if(AREA){ const A=AREA; return A.p3list||(A.p3list=A.objs.filter(o=>o.p3k)); } return mapList(P3.out,curMap()); }
function p3Col(o,A,c){ if(A){ if(A===AREA) addAreaCol(c); else{ addCol(c); A.cols.push(c); } } else addCol(c); return c; }
function p3Uncol(o){ if(o.col){ o.col.off=true; try{ removeCol(o.col); }catch(e){} o.col=null; } }
const p3Done=o=>!!(G&&G.found&&G.found[o.id]);
function p3Save(o,v){ if(G&&G.found){ G.found[o.id]=v==null?true:v; } }
// a sprite with its origin at the bottom middle (w x h world px, drawn at 2x, bold outline in Storybook)
const P3SPR=new Map();
function p3Spr(key,w,h,draw,ow){
  const k=key+(LOOK.sb?'|sb':''); let c=P3SPR.get(k); if(c) return c;
  const pad=8, cv=mkCanvas(Math.ceil((w+pad*2)*2),Math.ceil((h+pad*2)*2)), g=cv.getContext('2d'); g.scale(2,2); g.translate(pad+w/2,pad+h); g.lineJoin='round'; g.lineCap='round'; draw(g);
  c=ow===0?cv:outlineSprite(cv,SBC.outline,ow||sbOW(Math.max(w,h)/2),{scale:2}); c.ox=pad+w/2; c.oy=pad+h; c.ww=w+pad*2; c.hh=h+pad*2; P3SPR.set(k,c); return c;
}
function p3Put(sp,x,y,sx,sy,a){ if(a!=null&&a<1) ctx.globalAlpha=a; if(sx==null||(sx===1&&sy===1)) ctx.drawImage(sp,x-sp.ox,y-sp.oy,sp.ww,sp.hh); else ctx.drawImage(sp,x-sp.ox*sx,y-sp.oy*sy,sp.ww*sx,sp.hh*sy); if(a!=null&&a<1) ctx.globalAlpha=1; }
const p3Sh=(x,y,rx,ry,a)=>{ ctx.fillStyle=`rgba(40,30,60,${a==null?0.25:a})`; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,TAU); ctx.fill(); };
// a block of clear ice: footprint w x d, height h, origin at the front bottom middle
function p3IceBlockArt(g,w,d,h,o){
  o=o||{}; const vio=!!o.vio, top=vio?'#e4dcfa':ICE.top, base=vio?ICE.vio:ICE.base, deep=vio?ICE.vioD:ICE.deep;
  g.fillStyle=deep; rrect(g,-w/2,-h-d,w,h+d,7); g.fill();
  g.fillStyle=base; rrect(g,-w/2,-h,w-3,h-3,6); g.fill();
  g.fillStyle=top; rrect(g,-w/2,-h-d,w,d+5,6); g.fill();
  g.fillStyle='rgba(255,255,255,.55)'; rrect(g,-w/2+5,-h-d+3,w*0.55,3,1.5); g.fill();
  g.strokeStyle='rgba(255,255,255,.6)'; g.lineWidth=2;
  const rng=mulberry32((w*13+h*7+d)|0);
  for(let i=0;i<Math.max(2,w/30);i++){ const x0=-w/2+8+rng()*(w-20), y0=-h+6+rng()*(h*0.4); g.beginPath(); g.moveTo(x0,y0); g.lineTo(x0+8+rng()*10,y0+h*0.35); g.stroke(); }
  g.fillStyle='rgba(255,255,255,.5)'; for(let i=0;i<Math.max(3,w/16);i++){ g.beginPath(); g.arc(-w/2+6+rng()*(w-12),-h*0.15-rng()*h*0.6,1+rng()*2,0,TAU); g.fill(); }
  g.fillStyle='rgba(40,70,140,.18)'; g.fillRect(w/2-10,-h+4,7,h-8);
  if(!o.noSnow){ g.fillStyle=ICE.snow; for(let x=-w/2+4;x<w/2;x+=12){ g.beginPath(); g.ellipse(x+4,-1,8,4.5,0,0,TAU); g.fill(); } g.beginPath(); g.ellipse(-w/2+w*0.3,-h-d+2,w*0.22,4,0,0,TAU); g.fill(); }
}
// heat cracks and drips over an ice thing that is being melted (k 0..1), x,y its front bottom middle
function p3HeatOverlay(x,y,w,h,k,t){
  if(k<=0.02) return; ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-h*0.5,Math.max(w,h)*0.6,'255,220,180',0.12+0.25*k); ctx.restore();
  ctx.strokeStyle=`rgba(255,255,255,${0.35+0.5*k})`; ctx.lineWidth=1.6; ctx.beginPath();
  const n=Math.ceil(k*5); for(let i=0;i<n;i++){ const a=i*1.7, cx=x+Math.cos(a*2.1)*w*0.25, cy=y-h*0.5+Math.sin(a*1.3)*h*0.25; ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*w*0.18*k,cy+Math.sin(a)*h*0.2*k); ctx.lineTo(cx+Math.cos(a+0.7)*w*0.28*k,cy+Math.sin(a+0.7)*h*0.3*k); }
  ctx.stroke();
  for(let i=0;i<3;i++){ const ph=(t*1.6+i*0.37)%1, dx=x-w*0.35+i*w*0.35; ctx.fillStyle=`rgba(200,235,255,${0.8*(1-ph)})`; ctx.beginPath(); ctx.ellipse(dx,y-h*0.2+ph*h*0.25,1.8,2.6,0,0,TAU); ctx.fill(); }
}
// a puddle left by melted ice (fades out over 8 s, a wet mark stays)
function p3Puddle(x,y,w,a){ ctx.fillStyle=`rgba(120,180,230,${0.4*a})`; ctx.beginPath(); ctx.ellipse(x,y,w*0.55,w*0.2,0,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(230,248,255,${0.6*a})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(x-w*0.1,y-1,w*0.3,w*0.08,0,Math.PI,TAU); ctx.stroke(); }

// ---- ice walls: {w:96,h:36 (footprint), hh:64 (height), need:1.2, regrow:0 (seconds; 0 = melted for good), style:'wall'|'fall'|'block', then(o)}
P3K.icewall={
  init(o,A){ o.w=o.w||96; o.h=o.h||36; o.hh=o.hh||(o.style==='fall'?120:o.style==='block'?44:64); o.need=o.need||P3N.melt; o.heat=0; o.done=!o.regrow&&p3Done(o); o.mk=o.done?1:0; o.regT=0; o.wetT=0; if(!o.done) o.col=p3Col(o,A,{t:'r',x0:o.x-o.w/2,y0:o.y-o.h/2,x1:o.x+o.w/2,y1:o.y+o.h/2}); },
  hitR:o=>Math.max(o.w,o.h)*0.5,
  tick(o,dt){ if(o.heatT!=null&&G.time-o.heatT>1.2) o.heat=Math.max(0,o.heat-dt*0.35); o.mk+=((o.done?1:0)-o.mk)*Math.min(1,dt*(o.done?3:6)); if(o.wetT>0) o.wetT-=dt;
    if(o.done&&o.regrow){ o.regT-=dt; if(o.regT<1.2&&o.regT>0&&Math.random()<0.4) emit(o.x+rand(-o.w/2,o.w/2),o.y-rand(0,o.hh),1,{col:'220,240,255',smin:5,smax:20,lmin:.4,lmax:.7,zmin:1,zmax:2}); if(o.regT<=0&&!p3Near(o)){ o.done=false; o.heat=0; o.col=p3Col(o,o.inArea?AREA:null,{t:'r',x0:o.x-o.w/2,y0:o.y-o.h/2,x1:o.x+o.w/2,y1:o.y+o.h/2}); p3Snd('crack',0.5); } } },
  blaze(o,dt){ if(o.done) return; o.heat+=dt; o.heatT=G.time; p3MeltFx(o.x,o.y-o.hh*0.5,0.5); if(o.heat>=p3Need(o.need)) p3MeltWall(o); },
  bomb(o){ if(!o.done) p3Say(o.x,o.y-o.hh-14,S('The ice cracks, but it holds. It needs heat!','It needs heat!'),'#dff4ff','icebomb'); },
  ground(o,t){ if(o.done){ const a=o.regrow?0.8:clamp(1-(o.wetT<=0?1:0)*0.5,0.5,1); p3Puddle(o.x,o.y+o.h*0.3,o.w,a); } },
  stand(o,t){ if(o.mk>0.98) return; const k=1-o.mk, sp=p3Spr(`iw_${o.w}_${o.h}_${o.hh}_${o.style||'w'}`,o.w,o.hh+o.h,g=>{ if(o.style==='fall') p3FallArt(g,o.w,o.h,o.hh); else if(o.style==='block') p3IceBlockArt(g,o.w,o.h,o.hh); else p3IceWallArt(g,o.w,o.h,o.hh); });
    const by=o.y+o.h/2; p3Sh(o.x,by-2,o.w*0.55,o.h*0.35,0.22); p3Put(sp,o.x,by,1,k,k<1?0.4+0.6*k:1); if(!o.done) p3HeatOverlay(o.x,by,o.w,o.hh,clamp(o.heat/p3Need(o.need),0,1),t); },
  sy:o=>o.y+o.h/2,
  prompt:o=>o.done?null:S('Look at the ice','Look at the ice'),
  act(o){ p3Read(canBlaze()?S('Thick old ice. Hold your fire breath until it burns blue, and it will melt.','Thick ice. Use blue fire!'):S('Thick old ice, clear as glass. Your fire breath only makes it sweat. You need a hotter fire.','Thick ice. Your fire is not hot enough.')); }
};
// a wall of old ice: a row of crystal shards with a jagged top, light left faces and dark right faces, snow at the foot
function p3IceWallArt(g,w,d,h){
  const rng=mulberry32((w*31+h*17+d)|0), n=Math.max(3,Math.round(w/28)), top=[], H=h+d*0.6;
  for(let i=0;i<=n;i++){ const x=-w/2+i*w/n+(i>0&&i<n?(rng()-0.5)*8:0), peak=i%2===1||n<3; top.push([x,-H*(peak?0.94+rng()*0.08:0.66+rng()*0.12)]); }
  const body=()=>{ g.beginPath(); g.moveTo(-w/2,-5); for(const q of top) g.lineTo(q[0],q[1]); g.lineTo(w/2,-5); g.quadraticCurveTo(0,5,-w/2,-5); g.closePath(); };
  body(); g.fillStyle=ICE.base; g.fill();
  g.save(); body(); g.clip();
  const sw=w/n;
  for(let i=0;i<=n;i++){ const P=top[i];
    g.fillStyle='rgba(236,248,255,.75)'; g.beginPath(); g.moveTo(P[0],P[1]); g.lineTo(P[0]-sw*0.7,4); g.lineTo(P[0]-sw*0.05,4); g.closePath(); g.fill();
    g.fillStyle='rgba(92,156,216,.55)'; g.beginPath(); g.moveTo(P[0],P[1]); g.lineTo(P[0]+sw*0.05,4); g.lineTo(P[0]+sw*0.75,4); g.closePath(); g.fill(); }
  g.fillStyle='rgba(60,110,190,.28)'; g.fillRect(-w/2,-H*0.28,w,H*0.3);
  g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=2.2; for(let i=1;i<=n;i+=2){ const P=top[i]; g.beginPath(); g.moveTo(P[0]-3,P[1]+8); g.lineTo(P[0]-sw*0.28,P[1]+H*0.42); g.stroke(); }
  g.fillStyle='rgba(255,255,255,.7)'; for(let i=0;i<Math.max(3,w/18);i++){ g.beginPath(); g.arc(-w/2+6+rng()*(w-12),-H*0.2-rng()*H*0.5,0.8+rng()*1.6,0,TAU); g.fill(); }
  g.restore();
  g.fillStyle=ICE.snow; for(let x=-w/2+2;x<w/2;x+=13){ g.beginPath(); g.ellipse(x+5,-2,9,5,0,0,TAU); g.fill(); }
}
function p3FallArt(g,w,d,h){
  g.fillStyle=ICE.deep; rrect(g,-w/2,-h-d,w,h+d,10); g.fill();
  g.fillStyle=ICE.base; rrect(g,-w/2+2,-h-d+2,w-6,h+d-6,9); g.fill();
  g.strokeStyle='rgba(255,255,255,.65)'; g.lineWidth=3; for(let i=0;i<5;i++){ const x=-w/2+8+i*(w-16)/4; g.beginPath(); g.moveTo(x,-h-d+6); g.bezierCurveTo(x+6,-h*0.6,x-6,-h*0.3,x+2,-6); g.stroke(); }
  g.fillStyle=ICE.hi; for(let i=0;i<6;i++){ const x=-w/2+6+i*(w-12)/5; g.beginPath(); g.moveTo(x-4,-6); g.lineTo(x,8-((i%2)*6)); g.lineTo(x+4,-6); g.fill(); }
  g.fillStyle=ICE.snow; g.beginPath(); g.ellipse(0,-h-d+4,w*0.5,7,0,0,TAU); g.fill();
}
function p3Near(o){ const p=player; return p&&Math.abs(p.x-o.x)<o.w/2+p.r&&Math.abs(p.y-o.y)<o.h/2+p.r; }
function p3MeltWall(o){
  o.done=true; o.heat=0; o.wetT=8; p3Uncol(o); if(o.regrow) o.regT=o.regrow; else p3Save(o);
  p3Snd('melt'); shake(2); for(let i=0;i<16;i++) emit(o.x+rand(-o.w/2,o.w/2),o.y-rand(0,o.hh),1,{col:'235,248,255',glow:false,ang:-Math.PI/2,spread:1,smin:20,smax:90,lmin:.6,lmax:1.2,zmin:4,zmax:8,grow:10,drag:1,alpha:0.6});
  emit(o.x,o.y,14,{col:'170,220,255',smin:40,smax:140,lmin:.2,lmax:.45,zmin:1.5,zmax:3});
  ftext(o.x,o.y-o.hh-10,S('Hssss!','Hsss!'),'#dff4ff',14);
  if(o.then) try{ o.then(o); }catch(e){ console.warn(e); }
  if(!o.regrow) saveGame();
}
function p3Read(t,cb){ runDialogue([['narr',t]],()=>{ scene='play'; if(cb) cb(); }); }

// ---- frozen folk: {who (a CAST id) | look (a person look), name, face, need:2, line | lines:[[who,text],...], after,
//      onThaw(o), coins, heal, leave (walks off after), flag (default 'f_thaw_'+id without a leading 'f_'), hideNpc}
function p3FrozenFlag(o){ return o.flag||('f_thaw_'+String(o.id).replace(/^f_/,'')); }
function p3Thawed(o){ return !!(G&&G.flags&&G.flags[p3FrozenFlag(o)]); }
P3K.frozen={
  init(o,A){ o.need=o.need||P3N.thaw; o.heat=0; o.st=p3Thawed(o)?'free':'ice'; o.popT=0; o.r=o.r||18; o.face=o.face!=null?o.face:Math.PI/2;
    const C=o.who&&typeof CASTBY!=='undefined'?CASTBY[o.who]:null; o.nm=o.name||(C&&C.name)||S('the traveler','the traveler');
    o.npc={kind:o.who||o.id,id:o.who||o.id,name:o.nm,col:(C&&C.col)||'#d8c3a0',look:o.look||(C&&C.look)||{},x:o.x,y:o.y,face:o.face,t:1.3,r:10,li:0,hair:((o.look||(C&&C.look)||{}).hair)||'#2a1a10'};
    if(o.st==='ice') o.col=p3Col(o,A,{t:'c',x:o.x,y:o.y,r:16}); },
  hitR:o=>24,
  tick(o,dt){ if(o.heatT!=null&&G.time-o.heatT>1.5&&o.st==='ice') o.heat=Math.max(0,o.heat-dt*0.3); if(o.st==='pop'){ o.popT+=dt; if(o.popT>=0.7) p3ThawDone(o); } if(o.st==='leave'){ o.popT+=dt; o.npc.x+=Math.cos(o.npc.face)*50*dt; o.npc.y+=Math.sin(o.npc.face)*50*dt; o.npc.t+=dt; o.npc.moving=true; if(o.popT>2.4) o.st='gone'; } if(o.st==='free') o.npc.t+=dt; },
  blaze(o,dt){ if(o.st!=='ice') return; o.heat+=dt; o.heatT=G.time; p3MeltFx(o.x,o.y-30,0.6); if(Math.random()<0.15) p3Snd('hiss',0.3); if(o.heat>=p3Need(o.need)) p3ThawStart(o); },
  ground(o,t){ if(o.st==='ice'||o.st==='pop') p3Puddle(o.x,o.y+8,30,clamp(o.heat/p3Need(o.need),0,1)*0.8+(o.st==='pop'?0.8:0)); },
  stand(o,t){ p3DrawFrozen(o,t); }, sy:o=>o.y+6,
  prompt:o=>o.st==='ice'?S(`Look at ${o.nm}`,`Look at ${o.nm}`):o.st==='free'&&!o.who&&o.after?S(`Talk to ${o.nm}`,`Talk to ${o.nm}`):null,
  act(o){ if(o.st==='ice') p3Read(canBlaze()?S('Someone is frozen solid inside a block of purple moth-frost. Blue fire would wake them up.','Someone is frozen! Use blue fire.'):S('Someone is frozen solid inside a block of purple moth-frost. Your breath only makes it sweat a little.','Someone is frozen. Your fire is too weak.'));
    else if(o.after) runDialogue(typeof o.after==='string'?[[o.who||'narr',o.after]]:o.after,()=>{ scene='play'; }); }
};
function p3ThawStart(o){
  o.st='pop'; o.popT=0; p3Uncol(o); p3Snd('thaw'); shake(3);
  for(let i=0;i<22;i++){ const a=rand(0,TAU); emit(o.x+Math.cos(a)*14,o.y-30+Math.sin(a)*24,1,{col:i%3?'210,235,255':'200,180,250',ang:a,spread:0.3,smin:60,smax:180,lmin:.3,lmax:.7,zmin:1.5,zmax:3.4,drag:3}); }
}
function p3ThawDone(o){
  const F=G.flags; if(!F[p3FrozenFlag(o)]){ F[p3FrozenFlag(o)]=1; F.f_frozen_n=(F.f_frozen_n||0)+1; }
  o.st=o.leave?'leave':'free'; o.popT=0; o.npc.face=o.leave?(o.leaveDir!=null?o.leaveDir:Math.PI/2):o.face;
  if(o.coins) addCoins(o.coins,o.x,o.y-30); if(o.heal) heal(o.heal);
  const fin=()=>{ scene='play'; if(o.onThaw) try{ o.onThaw(o); }catch(e){ console.warn(e); } if(o.who&&o.hideNpc!==false&&typeof setupNPCs==='function'&&!AREA) setupNPCs(); questPoke(); saveGame(); };
  if(o.lines) runDialogue(o.lines,fin);
  else{ if(o.line) taunt(o.who||'narr',o.line); fin(); }
}
const P3FZ=new Map();
function p3DrawFrozen(o,t){
  if(o.st==='gone') return;
  const n=o.npc, ice=o.st==='ice'||o.st==='pop', k=o.st==='pop'?clamp(o.popT/0.7,0,1):0;
  if(o.st==='free'&&o.who&&!AREA&&o.hideNpc!==false&&G.npcs&&G.npcs.some(q=>q.id===o.who)) return;   // the real person stands in the world now
  if(ice){ const sh=k>0?Math.sin(k*40)*2*(1-k):0; n.x=o.x+sh; }
  else n.x=o.st==='leave'?n.x:o.x;
  if(o.st==='leave') ctx.globalAlpha=clamp(1-(o.popT-1.4)/1,0,1);
  try{ PLINE=ice; drawNPC(n); } catch(e){} finally{ PLINE=false; }
  ctx.globalAlpha=1;
  if(!ice) return;
  const sp=p3Spr('frz',50,62,g=>{
    const body=()=>{ g.beginPath(); g.moveTo(-22,-6); g.lineTo(-24,-42); g.lineTo(-12,-58); g.lineTo(11,-60); g.lineTo(24,-45); g.lineTo(24,-8); g.quadraticCurveTo(0,4,-22,-6); g.closePath(); };
    body(); g.globalAlpha=0.42; g.fillStyle=ICE.vio; g.fill();
    g.globalAlpha=0.5; g.fillStyle='#ece6ff'; g.beginPath(); g.moveTo(-12,-58); g.lineTo(11,-60); g.lineTo(24,-45); g.lineTo(2,-47); g.closePath(); g.fill();
    g.globalAlpha=0.25; g.fillStyle=ICE.vioD; g.beginPath(); g.moveTo(24,-45); g.lineTo(24,-8); g.quadraticCurveTo(14,-2,10,-4); g.lineTo(12,-44); g.closePath(); g.fill();
    g.globalAlpha=0.9; g.strokeStyle='#ffffff'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-17,-38); g.lineTo(-12,-18); g.moveTo(-13,-50); g.lineTo(-7,-42); g.stroke();
    g.globalAlpha=1; g.strokeStyle=LOOK.sb?SBC.outline:'#6a5aa0'; g.lineWidth=1.9; body(); g.stroke(); g.lineWidth=1.2; g.beginPath(); g.moveTo(2,-47); g.lineTo(12,-44); g.lineTo(12,-6); g.stroke();
    g.fillStyle=ICE.snow; for(const x of [-16,-4,8,18]){ g.beginPath(); g.ellipse(x,-3,8,4.5,0,0,TAU); g.fill(); } g.strokeStyle=LOOK.sb?SBC.outline:'#8090b0'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-23,-2); for(const x of [-16,-4,8,18]) g.arc(x,-3,8,Math.PI,TAU); g.stroke();
  },0);
  const a=o.st==='pop'?1-k:1, sx=1+k*0.25;
  p3Put(sp,o.x,o.y+8,sx,1+k*0.1,a);
  if(o.st==='ice'){ p3HeatOverlay(o.x,o.y+6,40,56,clamp(o.heat/p3Need(o.need),0,1),t); if(Math.random()<0.02) emit(o.x+rand(-14,14),o.y-rand(10,60),1,{col:'230,220,255',smin:2,smax:8,lmin:.5,lmax:.9,zmin:1,zmax:1.8}); }
}

// ---- frost locks: a padlock of purple moth-frost on a door, gate or chest {h:34, need:2.5, dome:false (an ice dome
//      covers it until a Ground Pound, a bomb or the linked rune plate cracks it for crackT s), plate:'<rplate id>',
//      crackT:8, col: a collider (or {x0,y0,x1,y1}) it holds shut, then(o)}
P3K.frostlock={
  init(o,A){ o.h=o.h||34; o.need=o.need||P3N.lock; o.heat=0; o.done=p3Done(o); o.crack=0; o.snap=o.done?1:0;
    if(o.col&&!o.col.t) o.col={t:'r',x0:o.col.x0,y0:o.col.y0,x1:o.col.x1,y1:o.col.y1};
    o.colR=o.col; if(o.col&&!o.done) p3Col(o,A,o.col); else if(o.col&&o.done) o.col=null; },
  hitR:o=>22,
  tick(o,dt){ if(o.crack>0){ o.crack-=dt; if(o.crack<=0&&!o.done){ o.heat=0; p3Snd('crack',0.4); emit(o.x,o.y-o.h,8,{col:'210,235,255',smin:10,smax:40,lmin:.3,lmax:.6,zmin:1.2,zmax:2}); } } if(o.heatT!=null&&G.time-o.heatT>1.5) o.heat=Math.max(0,o.heat-dt*0.4); if(o.done) o.snap=Math.min(1,o.snap+dt*2.2); },
  blaze(o,dt){ if(o.done) return; if(o.dome&&o.crack<=0){ p3Say(o.x,o.y-o.h-30,S('The dome of ice shields the lock. Crack it first!','Crack the dome first!'),'#dff4ff','lockdome',3); return; } o.heat+=dt; o.heatT=G.time; p3MeltFx(o.x,o.y-o.h,0.5); if(o.heat>=p3Need(o.need)) p3LockMelt(o); },
  pound(o){ if(o.done||!o.dome) return; p3CrackDome(o); }, bomb(o){ if(!o.done&&o.dome) p3CrackDome(o); }, reach:o=>70,
  stand(o,t){ if(o.colR&&o.bars!==false&&(!o.done||o.snap<1)) p3DrawBars(o.colR,o.done?1-o.snap:1,t); p3DrawLock(o.x,o.y,o.h,o.done,o.snap,o.dome&&!o.done?o.crack:-1,clamp(o.heat/p3Need(o.need),0,1),t); }, sy:o=>o.y+6,
  prompt:o=>o.done?null:S('Look at the frost lock','Look at the lock'),
  act(o){ p3Read(o.dome&&o.crack<=0?S('A padlock of purple moth-frost, sealed under a dome of ice. A Ground Pound or a bomb would crack the dome. Then hold blue fire on the lock.','A frost lock under ice. Pound the dome, then blue fire!'):S('A padlock of purple moth-frost, cold as a winter night. Blue fire would melt it.','A frost lock. Blue fire melts it!')); }
};
// a gate of frosted iron bars across a collider rect (a frost lock holds it shut)
function p3DrawBars(c,a,t){
  const w=c.x1-c.x0, h=c.y1-c.y0, horiz=w>=h, H=58; ctx.save(); ctx.globalAlpha=a; ctx.lineCap='round';
  if(horiz){ const y=c.y1; ctx.fillStyle='rgba(40,30,60,.22)'; ctx.fillRect(c.x0,y-4,w,8);
    for(const [col,lw] of [[SBC.outline,6],['#7a86a8',3.2]]){ ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.beginPath(); for(let x=c.x0+6;x<=c.x1-6;x+=16){ ctx.moveTo(x,y); ctx.lineTo(x,y-H); } ctx.moveTo(c.x0,y-H+6); ctx.lineTo(c.x1,y-H+6); ctx.moveTo(c.x0,y-H*0.45); ctx.lineTo(c.x1,y-H*0.45); ctx.stroke(); }
    ctx.fillStyle='rgba(235,246,255,.85)'; for(let x=c.x0+6;x<=c.x1-6;x+=16){ ctx.beginPath(); ctx.ellipse(x,y-H+2,4,2.4,0,0,TAU); ctx.fill(); }
  } else { const x=(c.x0+c.x1)/2; for(const [col,lw] of [[SBC.outline,6],['#7a86a8',3.2]]){ ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.beginPath(); for(let y=c.y0+6;y<=c.y1;y+=14){ ctx.moveTo(x,y); ctx.lineTo(x,y-H); } ctx.stroke(); } }
  ctx.restore();
}
function p3CrackDome(o){ o.crack=(p3Easy()?P3N.crackEasy:o.crackT||P3N.crackT); p3Snd('shatter'); shake(4); for(let i=0;i<18;i++){ const a=rand(-Math.PI,0); emit(o.x+Math.cos(a)*20,o.y-o.h+Math.sin(a)*18,1,{col:'215,240,255',ang:a,spread:0.2,smin:60,smax:170,lmin:.3,lmax:.6,zmin:1.5,zmax:3,drag:3}); } ftext(o.x,o.y-o.h-34,S('Crack! Quick, blue fire!','Crack! Blue fire, quick!'),'#dff4ff',13); }
function p3LockMelt(o){
  o.done=true; o.heat=0; p3Save(o); if(o.col){ p3Uncol(o); }
  p3Snd('melt'); p3Snd('clunk',0.7); shake(5); jingle('secret','shrine');
  emit(o.x,o.y-o.h,30,{col:'200,170,255',smin:40,smax:180,lmin:.3,lmax:.8,zmin:1.5,zmax:3.5});
  ftext(o.x,o.y-o.h-26,S('SNAP!','SNAP!'),'#e8dcff',15);
  if(o.then) try{ o.then(o); }catch(e){ console.warn(e); }
  saveGame();
}
// a lock drawn at foot (x,y), hung h px up; snap 0..1 animates the chain whipping away; crack>=0 draws the dome (crack>0: cracked)
function p3DrawLock(x,y,h,done,snap,crack,heat,t){
  if(done&&snap>=1) return;
  const ly=y-h;
  if(!done){ p3Sh(x,y,14,5,0.22); ctx.strokeStyle='#5a4a78'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x,ly-12); ctx.lineTo(x,ly-30); ctx.stroke(); ctx.strokeStyle='#b8a4e8'; ctx.lineWidth=2; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]); }
  ctx.save(); ctx.translate(x,ly+(done?snap*30:0)); if(done){ ctx.globalAlpha=1-snap; ctx.rotate(snap*2); }
  const sp=p3Spr('lock',26,30,g=>{
    g.strokeStyle='#7a5ac8'; g.lineWidth=5; g.beginPath(); g.arc(0,-18,8,Math.PI,TAU); g.stroke(); g.strokeStyle='#c8b8f8'; g.lineWidth=2; g.beginPath(); g.arc(0,-18,8,Math.PI*1.1,Math.PI*1.6); g.stroke();
    celFill(g,(q,dx,dy)=>{ rrect(q,-12+dx,-18+dy,24,18,5); },'#9a7ae0',{r:12});
    g.fillStyle='#3a2a5a'; g.beginPath(); g.arc(0,-11,3,0,TAU); g.fill(); g.fillRect(-1.2,-11,2.4,6);
    g.fillStyle='#f4f0ff'; for(const [px,py] of [[-9,-16],[8,-6],[-5,-3]]){ g.beginPath(); g.moveTo(px,py-3); g.lineTo(px+1,py); g.lineTo(px,py+3); g.lineTo(px-1,py); g.closePath(); g.fill(); }
  },1.4);
  p3Put(sp,0,12);
  if(heat>0.02&&!done){ ctx.globalCompositeOperation='lighter'; glowAt(0,0,22,'255,200,150',0.2+0.5*heat); ctx.globalCompositeOperation='source-over'; }
  ctx.restore();
  if(crack>=0){ const sp=p3Spr('dome',56,50,g=>p3DomeArt(g,27,40),0);
    if(crack>0){ ctx.globalAlpha=0.35+0.15*Math.sin(t*12); p3Put(sp,x,y+2); ctx.globalAlpha=1; ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x-14,y-30); ctx.lineTo(x-2,y-18); ctx.lineTo(x-8,y-6); ctx.moveTo(x+4,y-40); ctx.lineTo(x+10,y-24); ctx.lineTo(x+18,y-14); ctx.stroke(); }
    else p3Put(sp,x,y+2); }
}

// a clear dome of ice (r wide, h tall) with a drawn outline, so it stays see-through
function p3DomeArt(g,r,h){
  const body=()=>{ g.beginPath(); g.ellipse(0,-6,r,h,0,Math.PI,TAU); g.lineTo(r,-6); g.quadraticCurveTo(0,4,-r,-6); g.closePath(); };
  body(); g.globalAlpha=0.38; g.fillStyle=ICE.base; g.fill(); g.globalAlpha=0.3; g.fillStyle='#ffffff'; g.beginPath(); g.ellipse(-r*0.25,-h*0.62,r*0.42,h*0.24,-0.5,0,TAU); g.fill();
  g.globalAlpha=0.9; g.strokeStyle='#ffffff'; g.lineWidth=2.6; g.beginPath(); g.ellipse(0,-6,r*0.72,h*0.78,0,Math.PI*1.08,Math.PI*1.42); g.stroke();
  g.globalAlpha=1; g.strokeStyle=LOOK.sb?SBC.outline:'#5a7ab0'; g.lineWidth=1.9; body(); g.stroke();
  g.fillStyle=ICE.snow; for(let xx=-r+7;xx<r;xx+=11){ g.beginPath(); g.ellipse(xx,-3,7,4,0,0,TAU); g.fill(); }
}
// ---- far braziers: a brazier on a tall pillar {h:64 (pillar), timed:0 (seconds it burns, 0 = for good), then(o)}
P3K.fbraz={
  init(o,A){ o.h=o.h||64; o.lit=!o.timed&&p3Done(o); o.burn=0; o.L={x:o.x,y:o.y-o.h,r:280,i:o.lit?0.85:0,fire:true}; if(A) A.lights.push(o.L); else LIGHTS.push(o.L); o.col=p3Col(o,A,{t:'c',x:o.x,y:o.y,r:14}); },
  hitR:o=>26,
  tick(o,dt){ if(o.lit&&o.timed){ o.burn-=dt; if(o.burn<=0){ o.lit=false; emit(o.x,o.y-o.h,10,{col:'120,120,120',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:50,lmin:.6,lmax:1,zmin:3,zmax:6,grow:6}); } } o.L.i=o.lit?0.85+0.08*Math.sin(G.time*9+o.x):0; if(o.lit&&Math.random()<0.5) emit(o.x+rand(-5,5),o.y-o.h-6,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.35,lmax:.7,zmin:3,zmax:6,grow:5,drag:1}); },
  fire(o){ if(o.lit) return; p3LightFar(o); },
  stand(o,t){ p3DrawPillarBraz(o.x,o.y,o.h,o.lit,t); }, sy:o=>o.y+6,
  prompt:o=>o.lit?null:S('Look at the far brazier','Look at the brazier'),
  act(o){ p3Read(S('A brazier high up on a stone pillar, far out of reach. A long, hot flame might reach it. Or a fire arrow.','A brazier way up high. Blue fire reaches it!')); }
};
function p3LightFar(o){
  o.lit=true; o.burn=o.timed||0; SFX.play('pickup'); emit(o.x,o.y-o.h,20,{kind:'fire',ang:-Math.PI/2,spread:0.7,smin:30,smax:110,lmin:.4,lmax:.9,zmin:3,zmax:6,grow:6});
  if(!o.timed){ p3Save(o); }
  if(o.then) try{ o.then(o); }catch(e){ console.warn(e); }
  if(o.timed) ftext(o.x,o.y-o.h-30,S(`${o.timed} seconds!`,`${o.timed} seconds!`),'#ffe0a0',13);
}
function p3DrawPillarBraz(x,y,h,lit,t){
  const sp=p3Spr('pb_'+h,34,h+22,g=>{
    g.fillStyle='rgba(40,30,60,.3)'; g.beginPath(); g.ellipse(4,0,18,6,0,0,TAU); g.fill();
    celFill(g,(q,dx,dy)=>{ q.rect(-11+dx,-h+dy,22,h); },'#8a8aa0',{r:14});
    g.fillStyle='rgba(0,0,0,.18)'; for(let yy=-h+10;yy<-4;yy+=14) g.fillRect(-11,yy,22,2);
    g.fillStyle='#d8dce8'; g.fillRect(-13,-h-2,26,6); g.fillRect(-13,-6,26,6);
    celFill(g,(q,dx,dy)=>{ q.moveTo(-15+dx,-h-6+dy); q.lineTo(15+dx,-h-6+dy); q.lineTo(9+dx,-h+4+dy); q.lineTo(-9+dx,-h+4+dy); q.closePath(); },'#4a4450',{r:14});
    g.fillStyle='#1a1418'; g.beginPath(); g.ellipse(0,-h-6,14,4,0,0,TAU); g.fill();
  },1.6);
  p3Put(sp,x,y+4);
  if(lit){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-h-8,26,'255,170,70',0.8); glowAt(x,y-h-10,10,'255,240,190',0.9); ctx.restore(); }
  else{ ctx.strokeStyle=`rgba(130,180,255,${0.3+0.2*Math.sin(t*2+x)})`; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(x,y-h-6,18,6,0,0,TAU); ctx.stroke(); }
}

// ---- icicles: hanging h px up over (x,y) {h:90, regrow:0, big:false, blaze:'melt'|'drop' (blue fire melts its root and it falls), then(o)}. Blaze melts one; a Ground Pound, a
//      drum, a bomb or a hit knocks it down: it falls on (x,y), bonks foes there and tips a seesaw end it lands on.
P3K.icicle={
  init(o,A){ o.h=o.h||90; o.st=!o.regrow&&p3Done(o)?'gone':'hang'; o.ft=0; o.heat=0; o.regT=0; },
  hitR:o=>18,
  tick(o,dt){
    if(o.st==='fall'){ o.ft+=dt; if(o.ft>=0.36) p3IcicleLand(o); }
    else if(o.st==='gone'&&o.regrow){ o.regT-=dt; if(o.regT<=0){ o.st='hang'; o.heat=0; } }
    if(o.heatT!=null&&G.time-o.heatT>1) o.heat=Math.max(0,o.heat-dt*0.5); },
  blaze(o,dt){ if(o.st!=='hang') return; o.heat+=dt; o.heatT=G.time; p3MeltFx(o.x,o.y-o.h+10,0.5); if(o.heat>=p3Need(P3N.icicle)&&o.blaze==='drop'){ o.heat=0; p3IcicleDrop(o); return; } if(o.heat>=p3Need(P3N.icicle)){ o.st='gone'; o.regT=o.regrow||0; if(!o.regrow) p3Save(o); p3Snd('melt',0.6); emit(o.x,o.y-o.h+20,10,{col:'200,235,255',glow:false,ang:Math.PI/2,spread:0.3,smin:40,smax:120,lmin:.3,lmax:.6,zmin:1.5,zmax:2.5}); } },
  pound(o){ p3IcicleDrop(o); }, ring(o){ p3IcicleDrop(o); }, bomb(o){ p3IcicleDrop(o); }, hit(o){ p3IcicleDrop(o); }, reach:o=>p3PoundR()+90,
  ground(o,t){ if(o.st==='hang'||o.st==='fall'){ const k=o.st==='fall'?clamp(o.ft/0.36,0,1):0; p3Sh(o.x,o.y+2,10+8*k,4+3*k,0.18+0.2*k); } },
  stand(o,t){ if(o.st==='gone') return; const k=o.st==='fall'?clamp(o.ft/0.36,0,1):0, yy=o.y-o.h+(o.h-14)*k*k;
    const sp=p3Spr('icl_'+(o.big?1:0),o.big?36:24,o.big?52:38,g=>{ const s=o.big?1.4:1; g.fillStyle='#8a92a4'; rrect(g,-12*s,-38*s,24*s,7*s,3); g.fill(); for(const [dx,l,w] of [[-6,30,5],[1,36,6],[8,24,4]]){ g.fillStyle=ICE.mid; g.beginPath(); g.moveTo((dx-w)*s,-32*s); g.lineTo(dx*s,(-32+l)*s); g.lineTo((dx+w)*s,-32*s); g.closePath(); g.fill(); g.fillStyle=ICE.hi; g.beginPath(); g.moveTo((dx-w*0.6)*s,-31*s); g.lineTo((dx-w*0.1)*s,(-32+l*0.7)*s); g.lineTo(dx*s,-31*s); g.closePath(); g.fill(); } },1.3);
    p3Put(sp,o.x,yy+(o.big?52:38)-14); if(o.st==='hang') p3HeatOverlay(o.x,yy+18,18,30,clamp(o.heat/p3Need(P3N.icicle),0,1),t); if(o.st==='hang'&&Math.random()<0.01) emit(o.x,yy+20,1,{col:'220,240,255',smin:2,smax:6,lmin:.4,lmax:.8,zmin:1,zmax:1.6}); },
  sy:o=>o.y+1
};
function p3IcicleDrop(o){ if(o.st!=='hang') return; o.st='fall'; o.ft=0; p3Snd('crack',0.5); }
function p3IcicleLand(o){
  o.st='gone'; o.regT=o.regrow||0; if(!o.regrow) p3Save(o);
  p3Snd('shatter'); shake(3); emit(o.x,o.y,18,{col:'215,240,255',smin:40,smax:160,lmin:.25,lmax:.55,zmin:1.5,zmax:3,drag:3});
  for(const e of G.enemies){ if(e.dead||e.flying||e.spawnIn>0) continue; if(dist(e.x,e.y,o.x,o.y)<(e.r||14)+(o.big?34:24)){ damageEnemy(e,wPower()*(o.big?3:2),{src:'icicle',kb:120,ka:angTo(o.x,o.y,e.x,e.y)}); if(!e.dead){ stunEnemy(e,1.5); if(e.onIcicle) try{ e.onIcicle(e,o); }catch(err){} } ftext(e.x,e.y-(e.r||14)-10,S('BONK!','BONK!'),'#e8f6ff',14); } }
  const p=player; if(p&&!p.dead&&!airborne()&&dist(p.x,p.y,o.x,o.y)<20) hurtPlayer(6,o.x,o.y,140);
  p3SeesawHit(o.x,o.y,'icicle');
  if(o.then) try{ o.then(o); }catch(e){ console.warn(e); }
}

// ---- ice domes: a dome of ice over something {r:30, need:2, then(o)}. A Ground Pound, a bomb or a full hammer
//      swing shatters it; blue fire melts it.
P3K.icedome={
  init(o,A){ o.r=o.r||30; o.need=o.need||P3N.dome; o.heat=0; o.done=p3Done(o); o.mk=o.done?1:0; if(!o.done) o.col=p3Col(o,A,{t:'c',x:o.x,y:o.y,r:o.r}); },
  hitR:o=>o.r,
  tick(o,dt){ o.mk+=((o.done?1:0)-o.mk)*Math.min(1,dt*5); if(o.heatT!=null&&G.time-o.heatT>1.2) o.heat=Math.max(0,o.heat-dt*0.4); },
  blaze(o,dt){ if(o.done) return; o.heat+=dt; o.heatT=G.time; p3MeltFx(o.x,o.y-o.r,0.5); if(o.heat>=p3Need(o.need)) p3DomeGone(o,'melt'); },
  pound(o){ if(!o.done) p3DomeGone(o,'smash'); }, bomb(o){ if(!o.done) p3DomeGone(o,'smash'); }, reach:o=>p3PoundR()*0.7+o.r,
  hammer(o){ if(!o.done) p3DomeGone(o,'smash'); },
  ground(o,t){ if(o.done&&o.mk>0.5) p3Puddle(o.x,o.y+4,o.r*1.6,0.6); },
  stand(o,t){ if(o.mk>0.98) return; const r=o.r, sp=p3Spr('dm_'+r,r*2+6,r*1.8,g=>p3DomeArt(g,r,r*1.45),0);
    const k=1-o.mk; p3Sh(o.x,o.y+2,o.r*1.1,o.r*0.4,0.2); p3Put(sp,o.x,o.y+4,1+o.mk*0.4,k,k); if(!o.done) p3HeatOverlay(o.x,o.y+4,o.r*2,o.r*1.4,clamp(o.heat/p3Need(o.need),0,1),t); },
  sy:o=>o.y+4,
  prompt:o=>o.done?null:S('Look at the ice dome','Look at the dome'),
  act(o){ p3Read(S('A dome of hard ice. Smash it with a Ground Pound or a bomb, or melt it with blue fire.','An ice dome. Pound it, bomb it, or melt it!')); }
};
function p3DomeGone(o,how){
  o.done=true; o.heat=0; p3Save(o); p3Uncol(o);
  if(how==='melt'){ p3Snd('melt'); emit(o.x,o.y-o.r,16,{col:'235,248,255',glow:false,ang:-Math.PI/2,spread:1,smin:20,smax:80,lmin:.6,lmax:1.1,zmin:4,zmax:8,grow:9,drag:1,alpha:0.6}); }
  else{ p3Snd('shatter'); shake(4); for(let i=0;i<24;i++){ const a=rand(-Math.PI,0.3); emit(o.x+Math.cos(a)*o.r*0.6,o.y-o.r*0.6+Math.sin(a)*o.r*0.6,1,{col:'215,240,255',ang:a,spread:0.3,smin:60,smax:200,lmin:.3,lmax:.6,zmin:1.5,zmax:3.4,drag:3}); } }
  if(o.then) try{ o.then(o); }catch(e){ console.warn(e); }
  saveGame();
}

// ---- lids: a heavy round lid of ice or stone in the ground {r:36, stone:false, then(o)}; only a Ground Pound breaks it
P3K.lid={
  init(o){ o.r=o.r||36; o.done=p3Done(o); },
  hitR:o=>o.r,
  pound(o){ if(o.done) return; o.done=true; p3Save(o); p3Snd('shatter'); shake(5); emit(o.x,o.y,26,{col:o.stone?'150,140,130':'215,240,255',smin:50,smax:200,lmin:.3,lmax:.6,zmin:1.5,zmax:3.4,drag:3}); if(o.then) try{ o.then(o); }catch(e){ console.warn(e); } saveGame(); }, reach:o=>o.r+30,
  bomb(o){ if(!o.done) p3Say(o.x,o.y-30,S('Too thick for a bomb. Land on it, hard!','Too thick! Pound it!'),'#dff4ff','lidbomb'); },
  ground(o,t){ const r=o.r;
    if(o.done){ ctx.fillStyle='#14101c'; ctx.beginPath(); ctx.ellipse(o.x,o.y,r*0.9,r*0.55,0,0,TAU); ctx.fill(); ctx.fillStyle=o.stone?'#8a8478':ICE.mid; for(let i=0;i<7;i++){ const a=i/7*TAU; ctx.beginPath(); ctx.ellipse(o.x+Math.cos(a)*r*0.95,o.y+Math.sin(a)*r*0.6,6,3,a,0,TAU); ctx.fill(); } return; }
    const sp=p3Spr('lid_'+r+(o.stone?'s':''),r*2+4,r*1.3,g=>{ celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-r*0.62+dy,r,r*0.62,0,0,TAU); },o.stone?'#a8a090':'#bfe3f7',{r}); g.strokeStyle=o.stone?'rgba(60,50,40,.5)':'rgba(255,255,255,.75)'; g.lineWidth=2; g.beginPath(); g.ellipse(0,-r*0.62,r*0.62,r*0.36,0,0,TAU); g.stroke(); g.lineWidth=3; g.strokeStyle=o.stone?'#6a5a4a':'#7a8ad0'; g.beginPath(); g.moveTo(-r*0.3,-r*0.75); g.quadraticCurveTo(-r*0.5,-r*1.0,-r*0.2,-r*1.0); g.moveTo(r*0.3,-r*0.75); g.quadraticCurveTo(r*0.5,-r*1.0,r*0.2,-r*1.0); g.stroke(); });
    p3Put(sp,o.x,o.y+r*0.62); },
  prompt:o=>o.done?null:S('Look at the lid','Look at the lid'),
  act(o){ p3Read(S('A huge, heavy lid. Nothing you could lift. But if you jumped and came down on it really hard...','A heavy lid. Jump and pound it!')); }
};

// ---- cracked floors (outdoors): {r:60, to:{area,x?,y?} (fall into an area: a cave below), below:{x,y} (fall to that
//      spot, a ledge or the ground lower down), then(o)}. Only a Ground Pound breaks one; walk into the hole to drop again.
P3K.crackfloor={
  init(o){ o.r=o.r||60; o.done=p3Done(o); o.brk=o.done?1:0; },
  hitR:o=>o.r,
  tick(o,dt){ if(o.done) o.brk=Math.min(1,o.brk+dt*4); const p=player; if(o.done&&o.brk>=1&&p&&!p.dead&&!airborne()&&!P3.mv&&dist(p.x,p.y,o.x,o.y)<o.r*0.62&&scene==='play') p3FallThrough(o); },
  pound(o,info){ if(o.done) return; if(dist(info.x,info.y,o.x,o.y)>o.r+P3N.crackR) return; o.done=true; p3Save(o); p3Snd('shatter'); p3Snd('pound',0.6); shake(8); emit(o.x,o.y,40,{col:'140,130,120',glow:false,smin:40,smax:220,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:4}); later(0.25,()=>{ if(!AREA&&dist(player.x,player.y,o.x,o.y)<o.r) p3FallThrough(o); }); if(o.then) try{ o.then(o); }catch(e){ console.warn(e); } saveGame(); }, reach:o=>o.r+P3N.crackR,
  ground(o,t){ const r=o.r;
    if(o.done){ ctx.fillStyle='rgba(20,14,26,.95)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,r*0.7*o.brk+2,r*0.42*o.brk+2,0,0,TAU); ctx.fill(); ctx.strokeStyle=SBC.outline; ctx.lineWidth=2.4; ctx.stroke(); ctx.fillStyle='rgba(255,255,255,.08)'; ctx.beginPath(); ctx.ellipse(o.x,o.y-r*0.12,r*0.5*o.brk,r*0.16*o.brk,0,Math.PI,TAU); ctx.fill(); return; }
    ctx.strokeStyle='rgba(40,28,40,.75)'; ctx.lineWidth=2.6; ctx.beginPath(); const rng=mulberry32((o.x*7+o.y)|0);
    for(let i=0;i<7;i++){ const a=i/7*TAU+rng()*0.4; ctx.moveTo(o.x,o.y); const mx=o.x+Math.cos(a)*r*0.45, my=o.y+Math.sin(a)*r*0.3; ctx.lineTo(mx,my); ctx.lineTo(mx+Math.cos(a+0.5)*r*0.4,my+Math.sin(a+0.5)*r*0.26); }
    ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1; ctx.stroke(); ctx.fillStyle='rgba(40,28,40,.25)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,r*0.25,r*0.15,0,0,TAU); ctx.fill(); },
  prompt:o=>o.done?null:S('Look at the cracked ground','Look at the cracks'),
  act(o){ p3Read(S('Big cracks run through the ground here, and cold air whistles up from below. Something hollow is down there. Something you could break into, if you came down hard enough.','Cracks! It is hollow below. Pound it!')); }
};
function p3FallThrough(o){
  const p=player; if(P3.mv) return; P3.mv={kind:'sink',t:0,dur:0.45,o,x:o.x,y:o.y}; p3Snd('whoosh'); ftext(p.x,p.y-40,S('Whoaaa!','Whoa!'),'#ffd9a0',15);
}
function p3FallLand(o){
  const p=player, to=o.to, b=o.below;
  if(to&&to.area){ try{ if(AREA) exitArea(true); const d=(typeof DOORS!=='undefined'&&DOORS.find(q=>q.area===to.area))||{x:o.x,y:o.y+o.r,outY:30}; enterArea(to.area,d); if(AREA&&to.x!=null){ p.x=to.x; p.y=to.y; } if(AREA&&to.room&&typeof dunGo==='function') dunGo(to.area,to.room); p.z=60; p.vz=0; updateCam(0,true); }catch(e){ console.warn(e); } }
  else if(b){ p.x=b.x; p.y=b.y; p.z=70; p.vz=0; p.safeX=b.x; p.safeY=b.y; updateCam(0,true); G.fade=0.6; }
  else { p.x=o.x; p.y=o.y+o.r+20; }
}

// ---- rune plates: pressed by a Ground Pound (or a bomb) and they stay down {r:24, then(o), lock:'<frostlock id>'}
P3K.rplate={
  init(o){ o.r=o.r||24; o.done=p3Done(o); o.glow=o.done?1:0; },
  hitR:o=>o.r,
  tick(o,dt){ const down=o.done||!!(o.lockG&&(o.lockG.done||o.lockG.crack>0))||!!(o.lock&&p3LockDown(o)); o.dn=down; o.glow+=((down?1:0)-o.glow)*Math.min(1,dt*4); },
  pound(o){ p3PressPlate(o); }, bomb(o){ p3PressPlate(o); }, reach:o=>o.r+50,
  ground(o,t){ const r=o.r, sp=p3Spr('rp_'+r,r*2+4,r*1.3,g=>{ celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-r*0.6+dy,r,r*0.6,0,0,TAU); },'#8a8aa4',{r}); g.strokeStyle='#5a5a78'; g.lineWidth=2; g.beginPath(); g.ellipse(0,-r*0.6,r*0.7,r*0.42,0,0,TAU); g.stroke(); });
    p3Put(sp,o.x,o.y+r*0.6+(o.dn?2:0)); const a=0.35+0.65*o.glow; ctx.strokeStyle=`rgba(${o.dn?'255,214,120':'170,190,255'},${a})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(o.x-r*0.4,o.y+2); ctx.lineTo(o.x,o.y-r*0.3+2); ctx.lineTo(o.x+r*0.4,o.y+2); ctx.lineTo(o.x,o.y+r*0.3+2); ctx.closePath(); ctx.stroke(); if(o.dn){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y+2,r,'255,200,110',0.3); ctx.restore(); } },
  prompt:o=>o.done?null:S('Look at the rune plate','Look at the plate'),
  act(o){ p3Read(S('A round stone plate carved with a ram’s rune. It is far too heavy to press with your claws. Land on it!','A heavy plate. Jump and pound it!')); }
};
function p3PressPlate(o){
  if(o.lockG&&AREA){ const L=o.lockG; if(!L.done){ p3LockCrack(AREA,L); p3Snd('click'); p3Snd('clunk',0.6); shake(2); } return; }
  if(o.lock){ const L=p3Things().find(q=>q.id===o.lock)||P3.out.find(q=>q.id===o.lock); if(L&&!L.done){ p3CrackDome(L); p3Snd('click'); shake(2); return; } }
  if(o.done) return; o.done=true; p3Save(o); p3Snd('clunk'); p3Snd('click'); shake(3); jingle('secret','block');
  emit(o.x,o.y,16,{col:'255,214,120',smin:30,smax:120,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
  if(o.then) try{ o.then(o); }catch(e){ console.warn(e); }
  if(o.inArea&&AREA&&AREA.rooms&&o.room){ const R=AREA.rooms[o.room]; if(R&&R.onRune) try{ R.onRune(R,o); }catch(e){ console.warn(e); } }
  saveGame();
}

function p3LockDown(o){ const L=P3.out.find(q=>q.id===o.lock); return !!(L&&(L.done||L.crack>0)); }
// ---- drum stones: a Ground Pound on or next to one sends a shockwave {r:34, ring:300, then(o,n)}
P3K.drum={
  init(o,A){ o.r=o.r||34; o.ring=o.ring||P3N.drumR; o.n=(G&&G.found&&G.found[o.id])|0; o.boom=0; o.col=p3Col(o,A,{t:'c',x:o.x,y:o.y,r:o.r*0.8}); },
  hitR:o=>o.r,
  tick(o,dt){ if(o.boom>0) o.boom-=dt; },
  pound(o,info){ p3DrumRing(o,o.x,o.y,o.ring*(1+P3N.poundK*hasSkill('pound2')),info); o.n++; p3Save(o,o.n); if(o.then) try{ o.then(o,o.n); }catch(e){ console.warn(e); } }, reach:o=>P3N.drumAt+o.r,
  stand(o,t){ const r=o.r, b=o.boom>0?Math.sin(o.boom*30)*2*o.boom:0, sp=p3Spr('dr_'+r,r*2+18,r*1.9,g=>{
      celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-r*0.55+dy,r,r*0.55,0,0,TAU); q.rect(-r+dx,-r*0.55+dy,r*2,r*0.6); q.ellipse(dx,0.05*r+dy,r,r*0.55,0,0,Math.PI); },'#8a6a52',{r});
      celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-r*0.55+dy,r*0.92,r*0.48,0,0,TAU); },'#d8c8a8',{r});
      g.strokeStyle='#5a3a2a'; g.lineWidth=2.4; g.beginPath(); g.ellipse(0,-r*0.55,r*0.5,r*0.26,0,0,TAU); g.stroke();
      g.strokeStyle='#efe2c4'; g.lineWidth=5; for(const s of [-1,1]){ g.beginPath(); g.arc(s*(r+2),-r*0.4,9,s<0?-0.2:Math.PI-2.6,s<0?2.6:Math.PI+0.2); g.stroke(); }
      g.fillStyle='#3a2a20'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*r*0.2,-r*0.62,2.4,0,TAU); g.fill(); } });
    p3Sh(o.x,o.y+r*0.4,r*1.1,r*0.4,0.25); p3Put(sp,o.x,o.y+r*0.5+b); },
  sy:o=>o.y+o.r*0.4,
  prompt:()=>S('Look at the drum stone','Look at the drum'),
  act(o){ p3Read(S('A great round drum of stone, with a ram’s face carved on the side. Knock on it! (A Ground Pound, the Stonehorn knock.)','A big stone drum. Pound it!')); }
};
// a drum's shockwave: knocks foes back (no harm to Ash), rings bells, drops icicles, flips seesaws, cancels foe quake rings
function p3DrumRing(src,x,y,R,info){
  if(src) src.boom=0.5;
  p3Snd('drum'); shake(10); P3.waves.push({x,y,r:20,max:R,t:0,drum:true});
  for(const e of G.enemies){ if(e.dead||e.spawnIn>0) continue; const d=dist(x,y,e.x,e.y); if(d>R) continue;
    if(e.onPound) try{ e.onPound(e,{x,y,R,d,drum:true}); }catch(err){ console.warn(err); }
    if(!e.flying&&!e.boss){ const a=angTo(x,y,e.x,e.y), kb=360*(1-d/R*0.5)*(e.kbRes||1); e.vx+=Math.cos(a)*kb; e.vy+=Math.sin(a)*kb; stunEnemy(e,0.6); } }
  for(const q of G.rings) if(q.owner!=='player'&&dist(q.x,q.y,x,y)<R+q.rad){ q.rad=q.max+1; }
  for(const o of p3Things()){ if(o===src||!o.p3k.ring) continue; if(dist(o.x,o.y,x,y)<R) o.p3k.ring(o,{x,y,R}); }
  if(AREA&&AREA.p3) p3CaveRing(AREA,x,y,R,src);
  for(const fn of P3.poundL) try{ fn({x,y,R,drum:true}); }catch(err){ console.warn(err); }
}

// ---- seesaws: a plank on a pivot {dir:'e' (or an angle), len:200, toA:{x,y}, toB:{x,y}, then(o,end)}. Slam one end down
//      (a Ground Pound on it, a falling icicle, a bomb blast) and whatever sits on the other end flies to that end's target:
//      Ash, a Blast Bomb, a crate. A seesaw with nothing on the far end just bounces.
const P3DIR={e:0,s:Math.PI/2,w:Math.PI,n:-Math.PI/2};
P3K.seesaw={
  init(o){ o.len=o.len||200; o.ang=typeof o.dir==='string'?P3DIR[o.dir]:(o.dir||0); o.tilt=(G&&G.found&&G.found[o.id])||0; o.tv=o.tilt; o.r=o.len/2;
    const ca=Math.cos(o.ang), sa=Math.sin(o.ang); o.ax=o.x-ca*o.len/2; o.ay=o.y-sa*o.len/2; o.bx=o.x+ca*o.len/2; o.by=o.y+sa*o.len/2; },
  hitR:o=>o.len/2,
  tick(o,dt){ o.tv+=(o.tilt-o.tv)*Math.min(1,dt*14); },
  pound(o,info){ const da=dist(info.x,info.y,o.ax,o.ay), db=dist(info.x,info.y,o.bx,o.by); if(Math.min(da,db)>46) return; p3SeesawFlip(o,da<db?'a':'b','pound'); }, reach:o=>o.len/2+46,
  ground(o,t){ p3DrawSeesaw(o,t); },
  prompt:()=>S('Look at the seesaw','Look at the seesaw'),
  act(o){ p3Read(S('A long slab balanced on a stone. Slam one end down hard and the other end flies up, with whatever is sitting on it.','A seesaw! Slam one end. The other end flies up.')); }
};
function p3SeesawHit(x,y,why){ for(const o of p3Things()){ if(o.p3!=='seesaw') continue; const da=dist(x,y,o.ax,o.ay), db=dist(x,y,o.bx,o.by); if(Math.min(da,db)<44) p3SeesawFlip(o,da<db?'a':'b',why); } if(AREA&&AREA.p3) for(const s of AREA.p3.seesaws){ const da=dist(x,y,s.ax,s.ay), db=dist(x,y,s.bx,s.by); if(Math.min(da,db)<44) p3SeesawFlip(s,da<db?'a':'b',why); } }
// end ('a' or 'b') slams down: the other end launches its load
function p3SeesawFlip(o,end,why){
  if(o.cd>G.time) return; o.cd=G.time+0.5;
  o.tilt=end==='a'?-1:1; if(o.id) p3Save(o,o.tilt);
  const ux=end==='a'?o.bx:o.ax, uy=end==='a'?o.by:o.ay, to=end==='a'?o.toB:o.toA;
  p3Snd('boing'); p3Snd('clunk',0.6); shake(4); emit(ux,uy,10,{col:'200,190,170',glow:false,smin:30,smax:110,lmin:.2,lmax:.45,zmin:1.5,zmax:3});
  let flung=0; const p=player;
  if(to){
    if(p&&!p.dead&&!airborne()&&!P3.mv&&dist(p.x,p.y,ux,uy)<34){ p3Launch(p,ux,uy,to.x,to.y,to.peak||150); flung++; }
    if(G.wproj) for(const b of G.wproj) if(b.k==='bomb'&&!b.dead&&(b.z||0)<2&&dist(b.x,b.y,ux,uy)<34){ const T0=0.9, dx=to.x-b.x, dy=to.y-b.y; b.st='fly'; b.z=2; b.vz=0.5*(typeof BOMB_G!=='undefined'?BOMB_G:900)*T0; b.vx=dx/T0; b.vy=dy/T0; b.bounce=1; flung++; }
    for(const q of (AREA?AREA.objs:mapList(LANDMARKS,curMap()))) if((q.p2==='pullblock'||q.p3==='rock')&&!q.done&&dist(q.x,q.y,ux,uy)<40&&!P3.fx.some(f=>f.q===q)){ p3FlyThing(q,to.x,to.y); flung++; }
    if(AREA&&AREA.blocks&&o.cave) flung+=p3SeesawBlock(o,ux,uy,to);
  }
  if(!flung) ftext(ux,uy-30,S('Boing!','Boing!'),'#fff0d0',13);
  if(o.then) try{ o.then(o,end,flung); }catch(e){ console.warn(e); }
}
function p3DrawSeesaw(o,t){
  const L=o.len, tv=o.tv, ca=Math.cos(o.ang), sa=Math.sin(o.ang), lift=16;
  const za=tv>0?lift*tv:0, zb=tv<0?-lift*tv:0;
  p3Sh(o.x,o.y+4,L*0.5,10,0.18);
  // the pivot stone
  ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.moveTo(o.x-15,o.y+8); ctx.lineTo(o.x,o.y-12); ctx.lineTo(o.x+15,o.y+8); ctx.closePath(); ctx.fill(); ctx.fillStyle='#9a96a8'; ctx.beginPath(); ctx.moveTo(o.x-12,o.y+6); ctx.lineTo(o.x,o.y-9); ctx.lineTo(o.x+12,o.y+6); ctx.closePath(); ctx.fill();
  // the plank: from end A (lifted za) to end B (lifted zb)
  const ax=o.ax, ay=o.ay-za-6, bx=o.bx, by=o.by-zb-6, nx=-sa*14, ny=ca*14;
  ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.moveTo(ax+nx*1.15,ay+ny*0.6+2); ctx.lineTo(bx+nx*1.15,by+ny*0.6+2); ctx.lineTo(bx-nx*1.15,by-ny*0.6+6); ctx.lineTo(ax-nx*1.15,ay-ny*0.6+6); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#b08a5a'; ctx.beginPath(); ctx.moveTo(ax+nx,ay+ny*0.5); ctx.lineTo(bx+nx,by+ny*0.5); ctx.lineTo(bx-nx,by-ny*0.5); ctx.lineTo(ax-nx,ay-ny*0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#d4ae78'; ctx.beginPath(); ctx.moveTo(ax+nx,ay+ny*0.5); ctx.lineTo(bx+nx,by+ny*0.5); ctx.lineTo(bx+nx*0.3,by+ny*0.15); ctx.lineTo(ax+nx*0.3,ay+ny*0.15); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(90,60,30,.5)'; ctx.lineWidth=1.4; for(let i=1;i<6;i++){ const k=i/6, x=lerp(ax,bx,k), y=lerp(ay,by,k); ctx.beginPath(); ctx.moveTo(x+nx*0.9,y+ny*0.45); ctx.lineTo(x-nx*0.9,y-ny*0.45); ctx.stroke(); }
  // the end pads: ice-blue rune circles where to stand or pound
  for(const [ex,ey,lab] of [[ax,ay,'a'],[bx,by,'b']]){ ctx.strokeStyle=`rgba(255,230,160,${0.45+0.2*Math.sin(t*3+(lab==='a'?0:2))})`; ctx.lineWidth=2.2; ctx.beginPath(); ctx.ellipse(ex,ey,12,7,0,0,TAU); ctx.stroke(); }
}
// fly a thing (a crate or a rock) in an arc to x,y
function p3FlyThing(q,x,y){ P3.fx.push({k:'fly',q,x0:q.x,y0:q.y,x1:x,y1:y,t:0,dur:0.8}); }
// Ash thrown in an arc (a seesaw, an updraft hop): input is ignored until he lands
function p3Launch(p,x0,y0,x1,y1,peak){ P3.mv={kind:'launch',x0,y0,x1,y1,t:0,dur:0.55+dist(x0,y0,x1,y1)/900,peak:peak||120}; p3Snd('whoosh'); if(G.stats) G.stats.p3launch=(G.stats.p3launch||0)+1; }

// ---- wind bells: ring as Ash rides past (within 70 px) or when anything hits them {h:70, name, then(o)}
P3K.wbell={
  init(o){ o.h=o.h||70; o.sw=0; o.rungT=-99; },
  hitR:o=>24,
  tick(o,dt){ o.sw*=Math.exp(-dt*1.6); if(P3.ride&&dist(player.x,player.y,o.x,o.y)<70) p3RingBell(o); },
  hit(o){ p3RingBell(o); }, ring(o){ p3RingBell(o); }, pound(o){ p3RingBell(o); }, reach:o=>p3PoundR()+30,
  stand(o,t){ p3DrawBell(o.x,o.y,o.h,o.sw,t,G.time-o.rungT<1.2); }, sy:o=>o.y+4
};
function p3RingBell(o){ if(G.time-o.rungT<0.8) return; o.rungT=G.time; o.sw=1; p3Snd('bell'); emit(o.x,o.y-o.h,10,{col:'255,236,170',smin:20,smax:80,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); if(o.inArea&&AREA) p3BellRung(AREA,o); if(o.then) try{ o.then(o); }catch(e){ console.warn(e); } }
function p3DrawBell(x,y,h,sw,t,glow){
  const post=p3Spr('bp_'+h,36,h+8,g=>{ g.fillStyle='#7a5a3a'; g.fillRect(-3,-h-2,6,h+2); g.fillRect(-16,-h-4,32,6); g.fillStyle='#a07a52'; g.fillRect(-2,-h-2,2,h); },1.4);
  p3Sh(x,y+2,10,4,0.25); p3Put(post,x,y+4);
  ctx.save(); ctx.translate(x,y-h+2); ctx.rotate(Math.sin(t*14)*0.5*sw);
  const sp=p3Spr('bell',24,24,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-10+dx,dy-2); q.quadraticCurveTo(-10+dx,-20+dy,dx,-22+dy); q.quadraticCurveTo(10+dx,-20+dy,10+dx,dy-2); q.closePath(); },'#e8b84a',{r:12}); g.fillStyle='#8a5a1a'; g.beginPath(); g.arc(0,0,3,0,TAU); g.fill(); },1.4);
  p3Put(sp,0,24); ctx.restore();
  if(glow){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-h+14,26,'255,220,130',0.45); ctx.restore(); }
}

// ---- small rocks (seesaw loads, drum targets): {r:16}
P3K.rock={ init(o,A){ o.r=o.r||16; const s=G&&G.found&&G.found['p3r_'+o.id]; if(s&&s.length===2){ o.x=s[0]; o.y=s[1]; } },
  stand(o,t){ const sp=p3Spr('rk_'+o.r,o.r*2+4,o.r*1.8,g=>{ celFill(g,(q,dx,dy)=>sbRoundPoly(q,sbRockPts(o.r,mulberry32(7)),dx,dy-o.r*0.8),'#a3abb6',{r:o.r}); }); p3Sh(o.x,o.y+2,o.r,o.r*0.4,0.25); p3Put(sp,o.x,o.y+4-(o.p3z||0)); }, sy:o=>o.y+4 };

// ---- outdoor pieces are built once with the world: a new game or a loaded save sets what was melted from G.found
function p3Restore(){
  for(const o of P3.out){
    const K=o.p3k; o.heat=0;
    switch(o.p3){
      case 'icewall': { const d=!o.regrow&&p3Done(o); if(d!==o.done){ o.done=d; o.mk=d?1:0; if(d) p3Uncol(o); else if(!o.col) o.col=p3Col(o,null,{t:'r',x0:o.x-o.w/2,y0:o.y-o.h/2,x1:o.x+o.w/2,y1:o.y+o.h/2}); } break; }
      case 'frozen': { const th=p3Thawed(o); o.st=th?'free':'ice'; if(th) p3Uncol(o); else if(!o.col) o.col=p3Col(o,null,{t:'c',x:o.x,y:o.y,r:16}); break; }
      case 'frostlock': { const d=p3Done(o); o.done=d; o.snap=d?1:0; o.crack=0; if(d) p3Uncol(o); else if(o.colR&&!o.col){ o.col=Object.assign({},o.colR); delete o.col.off; p3Col(o,null,o.col); } break; }
      case 'fbraz': o.lit=!o.timed&&p3Done(o); break;
      case 'icicle': o.st=!o.regrow&&p3Done(o)?'gone':'hang'; break;
      case 'icedome': { const d=p3Done(o); if(d!==o.done){ o.done=d; o.mk=d?1:0; if(d) p3Uncol(o); else if(!o.col) o.col=p3Col(o,null,{t:'c',x:o.x,y:o.y,r:o.r}); } break; }
      case 'lid': case 'crackfloor': case 'rplate': o.done=p3Done(o); if(o.p3==='crackfloor') o.brk=o.done?1:0; break;
      case 'seesaw': o.tilt=(G.found[o.id])||0; o.tv=o.tilt; break;
      case 'drum': o.n=(G.found[o.id])|0; break;
    }
  }
}

// ---------- 5. dungeon cells and marks: a room's `frost` layer (11 rows of 15 letters, laid over its tpl)
//   i  ice wall (Blaze 1.2 s melts it)          x  cracked floor that only a Ground Pound breaks (drops to the floor below)
//   n  snow drift (slow; Blaze clears it)       y / z  drum pillars, up while the room's drum state is 0 / 1
//   P  pound switch (flips the drum state)      L / l  lights-out pound tile, starting down / up
//   D  drum stone (shockwave)                   r  rune plate (stays pressed; next to a K it cracks the K's dome)
//   O  ice dome over the cell                   K  chain lock in an ice dome (pound its plate, then Blaze it)
//   F  frozen person                            Z  far brazier on a pillar (counts as a brazier)
//   U  updraft vent                             W  wind bell        Q  wind vane        k  icicle        S  seesaw pivot
// Room fields: ribbons:[{pts:[[c,r],...],both,any,speed,w,vane,dir,id,lv}], frozen:{'c,r':{...}}, seesaws:{'c,r':{dir,len,
// toA,toB}}, vanes:{'c,r':{id,dir}}, bells:{'c,r':{name}}, locks:{'c,r':{cover:'dome'|'lid'|'none'}}, order:[bell names],
// timed (bells), lightsPitch:3, lightsTile:1, iceChests:true, onChain(R,o), onRune(R,o), onDrum(R,o), onVane(R,o).
// Link types: 'ice' (a door plugged with ice: Blaze 1.5 s) and 'chain' (held by a chain lock K in the room it opens from).
const P3T={crack:60,drift:61};
Object.assign(PUZZLE_KINDS,{melt:1,thaw:1,chains:1,bells:1,drum:1,lightsout:1,runes:1});
Object.assign(SEAL_KINDS,{melt:1,thaw:1,chains:1,bells:1,drum:1,lightsout:1,runes:1});
Object.assign(DOOR_COL,{ice:'170,220,255',chain:'190,160,250'}); Object.assign(LINK_CH,{ice:'i',chain:'k'});
function p3Cave(A){ if(A.p3) return A.p3; return A.p3={gates:[],crk:new Map(),drift:new Map(),cover:new Set(),ribbons:[],ups:[],vanes:[],sw:[],lights:[],seesaws:[],locks:[],doors:[]}; }
const p3Opt=(R,f,c,r)=>(R[f]&&R[f][`${c},${r}`])||{};
{ const base=genCaveRooms; genCaveRooms=function(def){
    const c=base.apply(this,arguments); if(typeof dunOwns==='function'&&!dunOwns(def)) return c;
    c.p3marks=[]; const door=new Set(); for(const L of c.links) for(const k of L.cells) door.add(k);
    for(const rid in c.rooms){ const R=c.rooms[rid], Ly=R.frost; if(!Ly) continue;
      for(let r=0;r<R.ih;r++){ const row=Ly[r]||''; for(let cc=0;cc<R.iw;cc++){ const ch=row[cc]; if(!ch||ch==='.'||ch===' ') continue;
        const i=R.ox+1+cc, j=R.oy+1+r, k=j*c.w+i; if(c.grid[k]!==0||door.has(k)) continue;
        if(ch==='x'){ c.typ[k]=P3T.crack; continue; }
        if(ch==='n'){ c.typ[k]=P3T.drift; continue; }
        c.p3marks.push({room:rid,ch,i,j,c:cc,r}); } } }
    return c; }; }
{ const base=dunBuildRoom; dunBuildRoom=function(A,def,R){ base.apply(this,arguments); p3BuildRoom(A,def,R); }; }
function p3BuildRoom(A,def,R){
  const c=A.cave; if(!c.p3marks) return; const C=p3Cave(A), cs=c.cell, SK=caveSid(def);
  const P=(i,j)=>({x:A.x0+(i+0.5)*cs,y:A.y0+(j+0.5)*cs}), F=G.found;
  for(const m of c.p3marks){ if(m.room!==R.id) continue;
    const p=P(m.i,m.j), k=m.j*c.w+m.i, id=`p3_${SK}_${R.id}_${m.ch}${m.c}_${m.r}`;
    const gate=(g,o)=>{ Object.assign(o,{k:'p3g',g,x:p.x,y:p.y,id,room:R.id,cells:[k],ci:m.i,cj:m.j,closed:true,heat:0,r:cs*0.5}); o.prompt=()=>p3GatePrompt(o); A.gates.push(o); c.dyn[k]=A.gates.length; A.objs.push(o); C.gates.push(o); return o; };
    switch(m.ch){
      case 'i': { const o=gate('ice',{melted:!!F[id]}); o.closed=!o.melted; break; }
      case 'y': case 'z': gate('pillar',{up:m.ch==='y'?0:1,rise:1}); break;
      case 'O': { const o=gate('dome',{done:!!F[id]}); o.closed=!o.done; break; }
      case 'K': { const op=p3Opt(R,'locks',m.c,m.r), o=gate('lock',{done:!!F[id],cover:op.cover||'dome',crack:0,lidGone:!!F[id+'_lid'],need:op.need||P3N.lock}); o.closed=!o.done; C.locks.push(o); A.lights.push({x:p.x,y:p.y-20,r:120,i:0.35,tint:'crystal'}); break; }
      case 'F': { const op=p3Opt(R,'frozen',m.c,m.r); p3Add('frozen',Object.assign({x:p.x,y:p.y,id:op.id||id,room:R.id,leave:op.leave!=null?op.leave:!op.after},op),A); break; }
      case 'Z': { const o={k:'brazier',far:true,h:R.pillarH||64,x:p.x,y:p.y,id,room:R.id,lit:R.solved,r:14,timed:R.timed||0}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:13}); A.lights.push({x:p.x,y:p.y-o.h,r:280,i:0,fire:true,obj:o}); break; }
      case 'U': { const o={k:'p3_up',x:p.x,y:p.y,id,room:R.id,ck:k,ph:Math.random()*6}; o.prompt=()=>canWindride()?null:p3MarkPrompt(o); A.objs.push(o); C.ups.push(o); break; }
      case 'W': { const op=p3Opt(R,'bells',m.c,m.r); p3Add('wbell',Object.assign({x:p.x,y:p.y,id,room:R.id,name:op.name||null,h:op.h||70},op),A); addAreaCol({t:'c',x:p.x,y:p.y,r:9}); break; }
      case 'Q': { const op=p3Opt(R,'vanes',m.c,m.r), vid=op.id||`${R.id}${m.c}_${m.r}`, key=`p3v_${SK}_${vid}`, o={k:'p3_vane',x:p.x,y:p.y,id,room:R.id,vid,key,dir:F[key]!=null?F[key]:'nesw'.indexOf(op.dir||'n'),spin:0,cd:0}; if(o.dir<0) o.dir=0; o.prompt=()=>p3MarkPrompt(o); A.objs.push(o); C.vanes.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:12}); break; }
      case 'k': { const op=p3Opt(R,'icicles',m.c,m.r); p3Add('icicle',Object.assign({x:p.x,y:p.y,id,room:R.id,regrow:R.regrow||0},op),A); break; }
      case 'D': { p3Add('drum',{x:p.x,y:p.y,id,room:R.id,r:24},A); break; }
      case 'r': { p3Add('rplate',{x:p.x,y:p.y,id,room:R.id,r:20,cave:true},A); break; }
      case 'P': { const o={k:'p3_psw',x:p.x,y:p.y,id,room:R.id,cd:0,bump:0}; o.prompt=()=>p3MarkPrompt(o); A.objs.push(o); C.sw.push(o); break; }
      case 'L': case 'l': { const o={k:'p3_lt',x:p.x,y:p.y,id,room:R.id,c:m.c,r:m.r,ci:m.i,cj:m.j,up:F[id]!=null?!!F[id]:m.ch==='l',cd:0,bump:0,cells:[]}; const t=R.lightsTile; if(t!=null) for(let dj=-t;dj<=t;dj++) for(let di=-t;di<=t;di++) if(di||dj) o.cells.push((m.j+dj)*c.w+m.i+di); o.prompt=()=>p3MarkPrompt(o); A.objs.push(o); C.lights.push(o); break; }
      case 'S': { const op=p3Opt(R,'seesaws',m.c,m.r), ang=P3DIR[op.dir||'e']||0, len=(op.len||3)*cs, cv=q=>q?P(R.ox+1+q[0],R.oy+1+q[1]):null;
        const o=p3Add('seesaw',{x:p.x,y:p.y,id,room:R.id,dir:ang,len,toA:cv(op.toA),toB:cv(op.toB),cave:true},A); C.seesaws.push(o); break; }
    }
  }
  for(const rb of R.ribbons||[]){ const pts=rb.pts.map(q=>{ const w=P(R.ox+1+q[0],R.oy+1+q[1]); return [w.x,w.y]; }); const o=p3Stream(Object.assign({},rb,{pts,w:(rb.w||1.2)*cs,room:R.id,cave:true,id:rb.id||`${R.id}_rb${C.ribbons.length}`})); C.ribbons.push(o); }
  // drifts and cracks saved from earlier visits
  for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*c.w+i; if(c.typ[k]===P3T.crack&&F[`p3crk_${SK}_${k}`]) C.crk.set(k,2); if(c.typ[k]===P3T.drift) C.drift.set(k,0); }
  R.p3drum=F[`p3d_${SK}_${R.id}`]|0;
}
// after every room is built: ice doors, chained doors (their lock), rune plates beside locks, the lights-out cover
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){
    base.apply(this,arguments);
    if(typeof dunOwns==='function'&&!dunOwns(def)) return;
    const C=p3Cave(A), M=CAVEMAP[def.id]||{links:[]}, c=A.cave, cs=c.cell;
    for(const o of A.gates){ if(o.type!=='ice'&&o.type!=='chain') continue; o.heat=0; C.doors.push(o);
      if(o.type==='chain'){ const opt=(M.links[o.link.i]||[])[3]||{}, from=opt.from||opt.room||o.link.a, R=A.rooms[from];
        let best=null, bd=1e9; for(const L of C.locks){ if(L.room!==from) continue; if(opt.lock){ const want=(R.oy+1+opt.lock[1])*c.w+R.ox+1+opt.lock[0]; if(L.cells[0]===want){ best=L; break; } continue; } const d=dist(L.x,L.y,o.x,o.y); if(d<bd){ bd=d; best=L; } }
        o.lockG=best; if(best&&best.done&&!o.opened){ o.opened=true; G.found[o.id]=true; } } }
    for(const o of A.objs){ if(o.p3!=='rplate') continue; let best=null, bd=cs*3.2; for(const L of C.locks){ if(L.room!==o.room) continue; const d=dist(L.x,L.y,o.x,o.y); if(d<bd){ bd=d; best=L; } } o.lockG=best; }
    p3LightsCover(A); p3RefreshGates(A);
  }; }
function p3LightsCover(A){ const C=A.p3; if(!C) return; C.cover.clear(); for(const o of C.lights) if(o.up) for(const k of o.cells) C.cover.add(k); }
function p3RefreshGates(A){
  const C=A.p3; if(!C) return; const p=player, c=A.cave, cs=c.cell;
  const onAsh=o=>p&&Math.abs(p.x-o.x)<cs*0.5+p.r&&Math.abs(p.y-o.y)<cs*0.5+p.r;
  for(const o of C.gates){
    let cl=o.closed;
    if(o.g==='ice') cl=!o.melted;
    else if(o.g==='dome'||o.g==='lock') cl=!o.done;
    else if(o.g==='pillar'){ const R=A.rooms[o.room]; cl=(R?R.p3drum|0:0)===o.up; }
    if(cl&&!o.closed&&onAsh(o)) cl=false;   // never raise a pillar or regrow ice on top of Ash
    o.closed=cl; }
  for(const o of C.doors){ let cl=!o.opened; if(o.tmp) cl=true; o.closed=cl; }
}
{ const base=refreshCaveGates; refreshCaveGates=function(){ base.apply(this,arguments); if(AREA&&AREA.p3) p3RefreshGates(AREA); }; }
// cells: a pound crack is floor until broken; a drift is floor (slow); lights-out tiles that are up cover their pit cells
{ const base=dunGround; dunGround=function(k,t,T){ if(t===P3T.crack){ const C=AREA&&AREA.p3; return !(C&&C.crk.get(k)===2)||dunCovered(k); } if(t===P3T.drift) return true; return base.apply(this,arguments); }; }
{ const base=dunHole; dunHole=function(k,t,T){ if(t===P3T.crack){ const C=AREA&&AREA.p3; return !!(C&&C.crk.get(k)===2)&&!dunCovered(k); } return base.apply(this,arguments); }; }
{ const base=dunCovered; dunCovered=function(k){ return base(k)||!!(AREA&&AREA.p3&&AREA.p3.cover.has(k)); }; }
// a broken pound crack drops Ash to the floor below (like e9a's cracked floors)
{ const base=trialFall; trialFall=function(){
    const A=AREA, p=player; if(A&&A.dn&&A.p3&&!p.dead&&!A.dn.drop){ const k=tCell(p.x,p.y);
      if(k>=0&&A.cave.typ[k]===P3T.crack&&A.p3.crk.get(k)===2){ const R=caveRoomAt(p.x,p.y), below=(R&&R.below)||dunFloorNext(A,1);
        if(below){ SFX.play('roll'); shake(3); emit(p.x,p.y,18,{col:'90,70,50',glow:false,smin:20,smax:90,lmin:.3,lmax:.7,zmin:2,zmax:5,grow:4}); A.dn.drop={to:below,x:p.x,y:p.y}; A.dn.ride=null; return; } } }
    return base.apply(this,arguments); }; }
// break a patch of pound cracks: every connected x cell (the whole patch gives way at once)
function p3CaveCrack(A,k0){
  const C=A.p3, c=A.cave, SK=caveSid(A.def); if(C.crk.get(k0)===2) return 0;
  const st=[k0], seen=new Set([k0]); let n=0;
  while(st.length){ const k=st.pop(); if(c.typ[k]!==P3T.crack||C.crk.get(k)===2) continue; C.crk.set(k,2); G.found[`p3crk_${SK}_${k}`]=true; n++;
    for(const d of DIRS){ const q=k+d[0]+d[1]*c.w; if(!seen.has(q)&&q>=0&&q<c.typ.length&&c.typ[q]===P3T.crack){ seen.add(q); st.push(q); } } }
  const q=tPos(k0); emit(q.x,q.y,36,{col:'110,90,70',glow:false,smin:40,smax:200,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:5}); p3Snd('shatter'); shake(7);
  for(const e of G.enemies){ if(e.dead||!e.inArea||e.flying||e.boss) continue; const ek=tCell(e.x,e.y); if(ek>=0&&C.crk.get(ek)===2){ ftext(e.x,e.y-20,S('Byeee!','Byeee!'),'#ffe0a0',12); killEnemy(e); } }
  saveGame(); return n;
}
// ice walls and domes in caves
function p3MeltGate(A,o){
  if(o.g==='ice'){ o.melted=true; G.found[o.id]=true; o.wetT=8; }
  else if(o.g==='dome') { o.done=true; G.found[o.id]=true; }
  p3RefreshGates(A); p3Snd('melt'); shake(2);
  for(let i=0;i<12;i++) emit(o.x+rand(-20,20),o.y-rand(0,46),1,{col:'235,248,255',glow:false,ang:-Math.PI/2,spread:1,smin:20,smax:80,lmin:.6,lmax:1.1,zmin:4,zmax:8,grow:9,drag:1,alpha:0.6});
  ftext(o.x,o.y-50,S('Hssss!','Hsss!'),'#dff4ff',13); dunBeamTrace&&A.dn&&dunBeamTrace(A); saveGame();
}
// let other modules (frost vents, Shard Eyes) grow an ice wall back: p3Refreeze(o) on a melted `i` gate
function p3Refreeze(o){ const A=AREA; if(!A||!o||o.g!=='ice'||!o.melted) return false; const p=player, cs=A.cave.cell; if(Math.abs(p.x-o.x)<cs*0.5+p.r&&Math.abs(p.y-o.y)<cs*0.5+p.r) return false; o.melted=false; o.heat=0; delete G.found[o.id]; p3RefreshGates(A); p3Snd('crack',0.6); emit(o.x,o.y-20,10,{col:'220,240,255',smin:10,smax:50,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); return true; }
function p3ShatterGate(A,o){ if(o.done) return; o.done=true; G.found[o.id]=true; p3RefreshGates(A); p3Snd('shatter'); shake(4); for(let i=0;i<20;i++){ const a=rand(-Math.PI,0.3); emit(o.x+Math.cos(a)*14,o.y-16+Math.sin(a)*14,1,{col:'215,240,255',ang:a,spread:0.3,smin:60,smax:200,lmin:.3,lmax:.6,zmin:1.5,zmax:3.4,drag:3}); } saveGame(); }
// chain locks: crack the dome (rune plate, a pound beside it, a bomb), then Blaze it while the crack lasts
function p3LockCrack(A,o){ if(o.done) return; if(o.cover==='lid'){ if(o.lidGone) return; o.lidGone=true; G.found[o.id+'_lid']=true; p3Snd('shatter'); shake(5); emit(o.x,o.y,24,{col:'215,240,255',smin:50,smax:180,lmin:.3,lmax:.6,zmin:1.5,zmax:3.4,drag:3}); ftext(o.x,o.y-40,S('The lid breaks! Now blue fire!','Lid broken! Blue fire!'),'#dff4ff',13); saveGame(); return; }
  if(o.cover==='none') return; o.crack=p3Easy()?P3N.crackEasy:P3N.crackT; p3Snd('shatter'); shake(4); for(let i=0;i<16;i++){ const a=rand(-Math.PI,0); emit(o.x+Math.cos(a)*18,o.y-14+Math.sin(a)*16,1,{col:'215,240,255',ang:a,spread:0.2,smin:60,smax:170,lmin:.3,lmax:.6,zmin:1.5,zmax:3,drag:3}); } ftext(o.x,o.y-50,S('Crack! Quick, blue fire!','Crack! Blue fire, quick!'),'#dff4ff',13); }
const p3LockOpen=o=>o.cover==='none'||(o.cover==='lid'?o.lidGone:o.crack>0);
function p3LockMeltCave(A,o){
  o.done=true; o.heat=0; G.found[o.id]=true; p3RefreshGates(A); p3Snd('melt'); p3Snd('clunk',0.8); shake(6); jingle('secret','shrine');
  emit(o.x,o.y-20,34,{col:'200,170,255',smin:40,smax:200,lmin:.3,lmax:.8,zmin:1.5,zmax:3.5}); ftext(o.x,o.y-54,S('SNAP! The chain whips away!','SNAP!'),'#e8dcff',14);
  for(const d of A.p3.doors) if(d.type==='chain'&&d.lockG===o&&!d.opened){ d.opened=true; G.found[d.id]=true; setBanner(S('The chain snaps!','The chain snaps!'),S('The chained door swings open.','The door is open!'),2.2); }
  const R=A.rooms[o.room]; if(R&&R.onChain) try{ R.onChain(R,o); }catch(e){ console.warn(e); }
  refreshCaveGates(); saveGame();
}
// the drum state of a room: pound switches flip it, the y and z pillars follow
function p3DrumFlip(A,R,o){ R.p3drum=R.p3drum?0:1; G.found[`p3d_${caveSid(A.def)}_${R.id}`]=R.p3drum; p3RefreshGates(A); p3Snd('drum',0.8); p3Snd('clunk',0.6); shake(5); if(o){ o.bump=0.4; emit(o.x,o.y,16,{col:'255,214,140',smin:30,smax:120,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } dunBeamTrace&&A.dn&&dunBeamTrace(A); saveGame(); }
// lights-out: a tile flips itself and its neighbours (pitch cells away in a row or a column)
function p3LightsFlip(A,o){
  const C=A.p3, R=A.rooms[o.room], pitch=(R&&R.lightsPitch)||3, flip=q=>{ q.up=!q.up; G.found[q.id]=q.up; q.bump=0.35; };
  flip(o); for(const q of C.lights){ if(q===o||q.room!==o.room) continue; const dc=Math.abs(q.c-o.c), dr=Math.abs(q.r-o.r); if((dc===pitch&&dr===0)||(dr===pitch&&dc===0)) flip(q); }
  p3LightsCover(A); p3Snd('drum',0.7); p3Snd('click'); shake(4);
  // nobody gets stuck in a pit that just opened under them
  const p=player, k=tCell(p.x,p.y); if(k>=0&&tHole(k)&&!airborne()){ const s=dunNearGround(p.x,p.y,4); p.x=s.x; p.y=s.y; }
  if(R&&!R.solved&&R.kind==='lightsout'&&C.lights.filter(q=>q.room===o.room).every(q=>q.up)) solveRoom(R);
  saveGame();
}
// a drum's ring inside a cave: pushes every block in reach one cell away from it, flips switches it reaches
function p3CaveRing(A,x,y,R,src){
  const c=A.cave, cs=c.cell; if(!A.blocks) return;
  const list=A.blocks.filter(b=>!b.sunk&&b.ci>=0&&dist(b.x,b.y,x,y)<R).sort((a,b)=>dist(b.x,b.y,x,y)-dist(a.x,a.y,x,y));
  for(const b of list){ const dx=b.x-x, dy=b.y-y; if(Math.abs(dx)<4&&Math.abs(dy)<4) continue; const di=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0, dj=di?0:Math.sign(dy); p3BlockStep(A,b,di,dj); }
  const RR=src&&src.room&&A.rooms[src.room]; if(RR&&RR.onDrum) try{ RR.onDrum(RR,src); }catch(e){ console.warn(e); }
}
function p3BlockStep(A,b,di,dj){
  const c=A.cave, cs=c.cell, ni=b.ci+di, nj=b.cj+dj, k=nj*c.w+ni, R=A.rooms[b.room]; if(!R) return false;
  const inRoom=ni>R.ox&&ni<=R.ox+R.iw&&nj>R.oy&&nj<=R.oy+R.ih, px=A.x0+(ni+0.5)*cs, py=A.y0+(nj+0.5)*cs;
  if(dist(player.x,player.y,px,py)<cs*0.5+player.r) return false;
  if(inRoom&&c.grid[k]===0&&!caveBlockedAt(k)&&typeof trialBlockInto==='function'&&trialBlockInto(b,ni,nj,k)) return true;
  if(!inRoom||c.grid[k]!==0||c.typ[k]===1||caveBlockedAt(k)||(c.typ[k]>=3&&c.typ[k]!==TY.rune&&c.typ[k]!==P3T.crack&&c.typ[k]!==P3T.drift&&!(typeof DTY!=='undefined'&&(c.typ[k]===DTY.high||c.typ[k]===DTY.ledge)))) return false;
  if(A.objs.some(o=>(o.k==='resetstone'||o.k==='cchest'||o.k==='crystal'||o.k==='dchest'||o.p3==='drum')&&Math.abs(o.x-px)<cs*0.6&&Math.abs(o.y-py)<cs*0.6)) return false;
  b.fx=b.x; b.fy=b.y; b.ci=ni; b.cj=nj; b.anim=0.2; p3Snd('clunk',0.6); return true;
}
// a seesaw end in a cave launches a block standing on it to the end's target cell
function p3SeesawBlock(o,ux,uy,to){
  const A=AREA, c=A.cave, cs=c.cell, k=tCell(ux,uy), tk=tCell(to.x,to.y); let n=0;
  for(const b of A.blocks){ if(b.sunk||b.ci<0||b.cj*c.w+b.ci!==k) continue; if(tk<0||c.grid[tk]!==0||caveBlockedAt(tk)) continue;
    const ti=tk%c.w, tj=(tk-ti)/c.w; P3.fx.push({k:'flyb',b,x0:b.x,y0:b.y,x1:A.x0+(ti+0.5)*cs,y1:A.y0+(tj+0.5)*cs,ti,tj,t:0,dur:0.75}); b.ci=-50; b.cj=-50; b.x=-9999; b.y=-9999; n++; }
  return n;
}
// chests frozen in ice (room iceChests:true): sealed until Blaze melts the ice off them
function p3ChestDomed(o){ const A=AREA; if(!A||!A.p3||!o) return false; const k=tCell(o.x,o.y); return A.p3.gates.some(g=>g.g==='dome'&&!g.done&&g.cells[0]===k); }
function p3ChestIce(o){ const A=AREA; if(!A||!o||o.tobj!=='dchest') return false; const R=A.rooms[o.room]; return !!(R&&R.iceChests&&!G.found[o.id+'_ice']); }
{ const base=dChestSealed; dChestSealed=function(o){ return p3ChestIce(o)||p3ChestDomed(o)||base.apply(this,arguments); }; }
{ const base=dChestOpen; dChestOpen=function(o){ if(p3ChestDomed(o)&&!G.found[o.id]){ p3Read(S('The chest sits under a dome of hard ice. Smash the dome with a Ground Pound or a bomb, or melt it with blue fire.','The chest is under ice. Pound it or melt it!')); return; } if(p3ChestIce(o)&&!G.found[o.id]){ p3Read(canBlaze()?S('The chest is frozen inside a block of ice. Hold your fire breath until it turns blue.','The chest is frozen. Use blue fire!'):S('The chest is frozen solid inside a block of ice. Your fire breath only makes it sweat.','The chest is frozen solid.')); return; } return base.apply(this,arguments); }; }
// fire on the cave pieces: ice walls, domes, chain locks, ice doors, drifts, frozen chests, far braziers
function p3CaveFire(A,p,dt,blue){
  const C=A.p3; if(!C) return; const hit=blue?(x,y,r)=>p3JetHits(x,y,r)||p3BreathHits(x,y,r):(x,y,r)=>p3BreathHits(x,y,r);
  for(const o of C.gates){
    if(o.g==='pillar') continue;
    const done=o.g==='ice'?o.melted:o.done; if(done||!hit(o.x,o.y,22)) continue;
    if(!blue){ p3Sweat(o); continue; }
    if(o.g==='lock'&&!p3LockOpen(o)){ p3Say(o.x,o.y-50,o.cover==='lid'?S('A thick lid of ice covers the lock. Break it with a Ground Pound!','Pound the lid first!'):S('The dome of ice shields the lock. Pound the rune plate first!','Pound the plate first!'),'#dff4ff','lockdome',3); continue; }
    o.heat+=dt; o.heatT=G.time; p3MeltFx(o.x,o.y-24,0.5);
    const need=p3Need(o.g==='ice'?P3N.melt:o.g==='dome'?P3N.dome:o.need||P3N.lock);
    if(o.heat>=need){ if(o.g==='lock') p3LockMeltCave(A,o); else p3MeltGate(A,o); }
  }
  for(const o of C.doors){ if(o.type!=='ice'||o.opened||!hit(o.x,o.y,40)) continue; if(!blue){ p3Sweat(o); continue; } o.heat+=dt; o.heatT=G.time; p3MeltFx(o.x,o.y-20,0.7); if(o.heat>=p3Need(P3N.door)){ o.opened=true; G.found[o.id]=true; o.wetT=8; refreshCaveGates(); p3Snd('melt'); shake(3); ftext(o.x,o.y-40,S('The ice door melts away!','The door melts!'),'#dff4ff',14); saveGame(); } }
  if(blue&&P3.jet){ const J=P3.jet, ca=Math.cos(J.ang), sa=Math.sin(J.ang); for(let s=0;s<=J.L;s+=20){ const k=tCell(J.ox+ca*s,J.oy+sa*s); if(k<0||!C.drift.has(k)) continue; const h=C.drift.get(k); if(h<0) continue; const nh=h+dt; if(nh>=p3Need(P3N.drift)){ C.drift.set(k,-1); const q=tPos(k); emit(q.x,q.y,10,{col:'240,248,255',glow:false,ang:-Math.PI/2,spread:1,smin:20,smax:70,lmin:.5,lmax:1,zmin:3,zmax:6,grow:8,drag:1,alpha:0.6}); p3Snd('hiss',0.4); } else C.drift.set(k,nh); } }
  if(blue) for(const o of A.objs){ if(o.tobj!=='dchest'||!p3ChestIce(o)||G.found[o.id]||!hit(o.x,o.y,24)) continue; o.p3h=(o.p3h||0)+dt; p3MeltFx(o.x,o.y-16,0.6); if(o.p3h>=p3Need(P3N.door)){ G.found[o.id+'_ice']=true; p3Snd('melt'); ftext(o.x,o.y-40,S('The ice slides off the chest!','The chest is free!'),'#dff4ff',13); saveGame(); } }
}
// a Ground Pound landing in a cave (x,y): cracks, switches, tiles, domes, locks, and the reach of our objects
function p3CavePound(A,x,y,R){
  const C=A.p3; if(!C) return; const c=A.cave, cs=c.cell;
  for(let j=Math.floor((y-P3N.crackR-A.y0)/cs);j<=Math.floor((y+P3N.crackR-A.y0)/cs);j++) for(let i=Math.floor((x-P3N.crackR-A.x0)/cs);i<=Math.floor((x+P3N.crackR-A.x0)/cs);i++){ if(i<0||j<0||i>=c.w||j>=c.h) continue; const k=j*c.w+i; if(c.typ[k]!==P3T.crack||C.crk.get(k)===2) continue; const q=tPos(k); if(Math.abs(q.x-x)<cs*0.5+P3N.crackR*0.5&&Math.abs(q.y-y)<cs*0.5+P3N.crackR*0.5){ p3CaveCrack(A,k); } }
  for(const o of C.sw){ if(o.cd>0||dist(o.x,o.y,x,y)>cs*1.05) continue; o.cd=0.5; const Rm=A.rooms[o.room]; if(Rm) p3DrumFlip(A,Rm,o); }
  for(const o of C.lights){ if(o.cd>0||dist(o.x,o.y,x,y)>cs*1.05) continue; o.cd=0.5; p3LightsFlip(A,o); break; }
  for(const o of C.gates){ if(o.g==='dome'&&!o.done&&dist(o.x,o.y,x,y)<cs*1.3+R*0.2) p3ShatterGate(A,o); if(o.g==='lock'&&!o.done&&dist(o.x,o.y,x,y)<cs*1.5) p3LockCrack(A,o); }
}
// bombs, arrows, swings and the like on the cave pieces (areaObjHit)
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){
    let hit=base.apply(this,arguments); const A=AREA; if(!A||!A.objs||src==='p3') return hit; r=r||8;
    const bomb=src==='bomb'||src==='bombs';
    for(const o of p3Things()){ const K=o.p3k, d=dist(x,y,o.x,o.y), rr=(K.hitR?K.hitR(o):o.r||16)+r; if(d>rr) continue;
      if(bomb&&K.bomb){ K.bomb(o,x,y); hit=true; } else if(src==='fire'&&K.fire){ K.fire(o,0.2,false); } else if(src!=='fire'&&K.hit&&!bomb){ K.hit(o,src); hit=true; } else if(src==='hammer'&&K.hammer&&typeof ARMS!=='undefined'&&ARMS.hamCh>=0.98){ K.hammer(o); hit=true; } }
    const C=A.p3; if(C){
      if(bomb) for(const o of C.gates){ if(dist(x,y,o.x,o.y)>r+30) continue; if(o.g==='dome'&&!o.done){ p3ShatterGate(A,o); hit=true; } else if(o.g==='lock'&&!o.done){ p3LockCrack(A,o); hit=true; } else if(o.g==='ice'&&!o.melted) p3Say(o.x,o.y-50,S('The ice cracks, but it holds. It needs heat!','It needs heat!'),'#dff4ff','icebomb'); }
      if(bomb){ const c=A.cave; for(const o of A.objs) if(o.p3==='rplate'&&dist(x,y,o.x,o.y)<r+20){ p3PressPlate(o); hit=true; } for(let j=Math.floor((y-r-A.y0)/c.cell);j<=Math.floor((y+r-A.y0)/c.cell);j++) for(let i=Math.floor((x-r-A.x0)/c.cell);i<=Math.floor((x+r-A.x0)/c.cell);i++){ const k=j*c.w+i; if(i>=0&&j>=0&&i<c.w&&j<c.h&&c.typ[k]===P3T.crack&&C.crk.get(k)!==2&&!(C.nagT>G.time)){ C.nagT=G.time+3; const q=tPos(k); p3Say(q.x,q.y-30,S('It cracks a bit more. Land on it hard!','Pound it!'),'#ffe0b0','crkbomb'); } } }
      if(src!=='fire') for(const o of C.vanes){ if(o.cd>0||dist(x,y,o.x,o.y)>r+22) continue; p3VaneTurn(A,o); hit=true; }
    }
    return hit; }; }
{ const base=caveSwing; caveSwing=function(px,py,dir,range,half){ base.apply(this,arguments); const A=AREA; if(!A||!A.p3) return;
    for(const o of A.p3.vanes) if(o.cd<=0&&inArcC(px,py,dir,range+12,half,{x:o.x,y:o.y,r:16})) p3VaneTurn(A,o);
    for(const o of p3Things()) if(o.p3k.hit&&inArcC(px,py,dir,range+10,half,{x:o.x,y:o.y-(o.h?o.h*0.4:0),r:18})) o.p3k.hit(o,'slash'); }; }
function p3VaneTurn(A,o){ o.cd=0.4; o.dir=(o.dir+1)%4; o.spin=1; G.found[o.key]=o.dir; p3Snd('click'); p3Snd('whoosh',0.5); emit(o.x,o.y-40,8,{col:'230,240,255',smin:20,smax:70,lmin:.2,lmax:.4,zmin:1.2,zmax:2.2}); const R=A.rooms[o.room]; if(R&&R.onVane) try{ R.onVane(R,o); }catch(e){ console.warn(e); } saveGame(); }
// solving our room kinds (melt, thaw, chains, runes, drum); bells solve when they ring
function p3CaveSolve(A){
  for(const k in A.rooms){ const R=A.rooms[k]; if(R.solved) continue; const C=A.p3;
    if(R.kind==='melt'){ const w=C.gates.filter(o=>o.g==='ice'&&o.room===k); if(w.length&&w.every(o=>o.melted)) solveRoom(R); }
    else if(R.kind==='thaw'){ const f=A.objs.filter(o=>o.p3==='frozen'&&o.room===k); if(f.length&&f.every(o=>o.st!=='ice'&&o.st!=='pop')) solveRoom(R); }
    else if(R.kind==='chains'){ const l=C.locks.filter(o=>o.room===k); if(l.length&&l.every(o=>o.done)) solveRoom(R); }
    else if(R.kind==='runes'){ const l=A.objs.filter(o=>o.p3==='rplate'&&o.room===k&&!o.lockG); if(l.length&&l.every(o=>o.done)) solveRoom(R); }
    else if(R.kind==='drum'){ const pl=A.objs.filter(o=>o.k==='plate'&&o.room===k); for(const o of pl) o.pressed=A.blocks.some(b=>b.ci===o.ci&&b.cj===o.cj&&b.anim<=0); if(pl.length&&pl.every(o=>o.pressed)) solveRoom(R); }
  }
}
function p3BellRung(A,o){
  const R=A.rooms[o.room]; if(!R||R.solved||R.kind!=='bells') return;
  const bells=A.objs.filter(q=>q.p3==='wbell'&&q.room===o.room), T=(R.timed||40)*(p3Easy()?1.5:1);
  if(R.order&&R.order.length){ R.p3seq=R.p3seq||[]; const want=R.order[R.p3seq.length];
    if(o.name===want){ R.p3seq.push(o.name); ftext(o.x,o.y-o.h-20,`${R.p3seq.length}`,'#ffe9a0',16); if(R.p3seq.length===R.order.length) solveRoom(R); }
    else{ R.p3seq=[]; for(const q of bells) q.rungT=-99; setBanner(S('The bells fall silent','The bells go quiet'),S('That was the wrong order. Try again.','Wrong order. Try again!'),1.8); }
    return; }
  const now=G.time, rung=bells.filter(q=>now-q.rungT<T);
  if(rung.length===bells.length) solveRoom(R);
  else ftext(o.x,o.y-o.h-20,`${rung.length} / ${bells.length}`,'#ffe9a0',14);
}
// every frame in a cave: timers, the drifts, updrafts, the room kinds
function p3CaveTick(A,dt){
  const C=A.p3; if(!C) return;
  for(const o of C.gates){ if(o.heatT!=null&&G.time-o.heatT>1.2&&o.heat>0) o.heat=Math.max(0,o.heat-dt*0.4); if(o.g==='lock'&&o.crack>0){ o.crack-=dt; if(o.crack<=0&&!o.done){ o.heat=0; p3Snd('crack',0.4); } } if(o.wetT>0) o.wetT-=dt; if(o.g==='pillar') o.rise+=((o.closed?1:0)-o.rise)*Math.min(1,dt*8); }
  for(const o of C.doors){ if(o.heatT!=null&&G.time-o.heatT>1.2&&o.heat>0) o.heat=Math.max(0,o.heat-dt*0.4); if(o.wetT>0) o.wetT-=dt; }
  for(const o of C.sw){ if(o.cd>0) o.cd-=dt; if(o.bump>0) o.bump-=dt; }
  for(const o of C.lights){ if(o.cd>0) o.cd-=dt; if(o.bump>0) o.bump-=dt; }
  for(const o of C.vanes){ if(o.cd>0) o.cd-=dt; o.spin=Math.max(0,o.spin-dt*2); }
  p3UpdraftTick(A,dt);
  p3CaveSolve(A);
}

// ---------- 6. Wind Riding
// A stream: {id, pts:[[x,y],...] (absolute, the ground under it), w:56, speed:420, both:false (rideable both ways),
//   any:false (a jump can enter it anywhere, not only at its start swirl), strict:false (flight too enters only at the
//   swirls), lv:[from,to] (its level at the start and the end; default the ground there), on(o)->bool, vane:'id', dir:'n'}
// Outdoors: WIND.stream({...}) in a map's build(B) (or at load). In dungeons: a room's ribbons (cells).
function p3Stream(o){
  o.w=o.w||56; o.speed=o.speed||P3N.ride; o.L=p2PolyLen(o.pts); o.bb=p3Bb(o.pts,o.w+60); o.ph=(o.pts[0][0]*0.013+o.pts[0][1]*0.007)%7;
  o.x=o.pts[0][0]; o.y=o.pts[0][1];
  if(!o.lv){ if(o.cave){ const lvAt=q=>{ const A=AREA; if(!A||!A.cave) return 0; const k=tCell(q[0],q[1]); return k<0?0:Math.max(0,dunH(k)); }; o.lvAuto=true; o.lv=[0,0]; o.lvFn=lvAt; }
    else o.lv=null; }
  p3StreamPaths(o);
  return o;
}
const WIND={
  stream(o){ p3Stream(o); if(o.map==null) o.map=mapAt(o.pts[0][1]); P3.streams.push(o); return o; },
  list:()=>P3.streams, here:()=>p3StreamsHere(), ride:()=>P3.ride, on:o=>p3StreamOn(o)
};
function p3StreamsHere(){ if(AREA) return AREA.p3?AREA.p3.ribbons:[]; const k=curMap(); return P3.streams.filter(o=>o.map===k); }
function p3StreamOn(o){
  if(o.on&&!o.on(o)) return false;
  if(o.vane){ const A=AREA, V=A&&A.p3?A.p3.vanes.find(q=>q.vid===o.vane):P3.vanes&&P3.vanes[o.vane]; if(V&&'nesw'[V.dir]!==(o.dir||'n')) return false; }
  return true;
}
function p3StreamLv(o,s){
  if(!o.lv){ const a=o.pts[0], b=o.pts[o.pts.length-1]; o.lv=[elevLvl(a[0],a[1]),elevLvl(b[0],b[1])]; }
  if(o.lvFn&&o.lvAuto){ o.lvAuto=false; const a=o.pts[0], b=o.pts[o.pts.length-1]; o.lv=[o.lvFn(a),o.lvFn(b)]; }
  return Math.round(lerp(o.lv[0],o.lv[1],clamp(s/Math.max(1,o.L),0,1)));
}
const p3AshLvl=p=>AREA?p3Lvl(p.x,p.y):p.flying?Math.max(elevLvl(p.x,p.y),(p.elvCeil!=null?p.elvCeil:elevLvl(p.x,p.y)+1)-1):elevLvl(p.x,p.y);
// a smooth path through the points (lifted by the riding height), and two edge lines for the flowing streaks
function p3StreamPaths(o){
  const H=P3N.rideZ, pts=o.pts, n=pts.length, off=(k)=>{ const out=[]; for(let i=0;i<n;i++){ const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)], L=Math.hypot(b[0]-a[0],b[1]-a[1])||1; out.push([pts[i][0]-(b[1]-a[1])/L*k,pts[i][1]+(b[0]-a[0])/L*k-H]); } return out; };
  const mk=(P)=>{ const p=new Path2D(); p.moveTo(P[0][0],P[0][1]); if(P.length===2) p.lineTo(P[1][0],P[1][1]); else{ for(let i=1;i<P.length-1;i++){ const mx=(P[i][0]+P[i+1][0])/2, my=(P[i][1]+P[i+1][1])/2; p.quadraticCurveTo(P[i][0],P[i][1],mx,my); } p.lineTo(P[P.length-1][0],P[P.length-1][1]); } return p; };
  o.pMid=mk(off(0)); o.pA=mk(off(o.w*0.24)); o.pB=mk(off(-o.w*0.24)); o.pG=mk(pts.map(q=>[q[0],q[1]]));
}
// Ash's entry: airborne (a jump or flight), at the swirl (or anywhere while flying), at most one level above him
function p3RideCheck(p){
  if(!airborne()||p.slam||p.dead||p.hop||(typeof P2!=='undefined'&&(P2.mv||P2.dash))) return;
  if(!p.flying&&(p.z||0)<4) return;
  const lv=p3AshLvl(p);
  for(const o of p3StreamsHere()){
    if(!p3InBb(o.bb,p.x,p.y)||!p3StreamOn(o)) continue;
    if(o===P3.lastS&&P3.reCd>0) continue;
    const q=p2PolyD(o.pts,p.x,p.y); if(q.d>o.w/2+12) continue;
    const atStart=q.s<P3N.enter, atEnd=o.both&&q.L-q.s<P3N.enter;
    if(!(atStart||atEnd||o.any||(p.flying&&!o.strict))) continue;
    if(p3StreamLv(o,q.s)>lv+1) continue;
    let dir=1;
    if(o.both){ if(atEnd&&!atStart) dir=-1; else if(!atStart){ const a=p2PolyAt(o.pts,q.s)[2], vx=p.avx||Math.cos(p.facing), vy=p.avy||Math.sin(p.facing); dir=Math.cos(a)*vx+Math.sin(a)*vy>=0?1:-1; } }
    p3RideStart(p,o,q.s,dir); return;
  }
}
function p3RideStart(p,o,s,dir){
  const a=p2PolyAt(o.pts,s), ang=dir>0?a[2]:a[2]+Math.PI, nx=-Math.sin(ang), ny=Math.cos(ang), off=clamp((p.x-a[0])*nx+(p.y-a[1])*ny,-o.w*0.4,o.w*0.4);
  P3.ride={o,s,dir,off,z:Math.max(8,p.z||0),t:0,sndT:0}; P3.lastS=o; P3.reCd=0;
  p.flying=true; p.landing=false; p.gliding=false; p.slam=false; p.dbl=false; p.vz=0; if(typeof MV!=='undefined') MV.hover=null; p.flyE=flyMax();
  p.facing=ang; p.faceGoal=ang;
  p3Snd('wind'); for(let i=0;i<14;i++){ const t=rand(0,TAU); emit(p.x+Math.cos(t)*18,p.y-p.z+Math.sin(t)*10,1,{col:'235,246,255',glow:false,ang:t+1.6,spread:0.2,smin:60,smax:140,lmin:.3,lmax:.55,zmin:1.4,zmax:2.6,drag:3,alpha:0.7}); }
  const c=p3Ctl(); p3Tip('ride',S('Wind Riding','Wind Riding'),S(`The wind carries you. Steer a little left and right. Press ${c.jump} to hop to another stream, or off.`,`The wind carries you! ${c.jump} hops off.`),2);
  if(G.stats) G.stats.p3rides=(G.stats.p3rides||0)+1;
}
function p3RideStep(p,dt,inp,base){
  const R=P3.ride, o=R.o; R.t+=dt;
  if(p.dead||!p3StreamOn(o)){ p3RideOff(p,'drop'); base(dt,inp); return; }
  if(inp.jump){ P3.jumpLock=true; const t=p3HopTarget(p,R); if(t){ p3HopStart(p,t); return; } p3RideOff(p,'hop'); base(dt,Object.assign({},inp,{jump:false,jumpHeld:false})); return; }
  const q=Object.assign({},inp,{jump:false,jumpHeld:false,use:false,roll:false,sprint:false});
  if(typeof MV!=='undefined'){ MV.jumpBuf=0; MV.holdT=0; } G.dashBuf=0;
  p.flying=true; p.landing=false; p.gliding=false; p.slam=false;
  // a melee weapon still swings from the wind (the bow and the others work as in flight)
  if(q.attack&&p3Melee()){ if(p.atkCd<=0&&p.swingT<=0&&p.dashT<=0&&!(G.mode==='story'&&!G.flags.forge)){ const w=curWeapon(), D=WEAPONS[w]; if(!(D&&D.input)&&useStamina(9)) startSwing(); } q.attack=false; }
  P3.riding=true; try{ base(dt,q); } finally{ P3.riding=false; }
  if(!P3.ride) return;
  const spd=o.speed*(p3Skyhop()?P3N.skyhop:1)*(1+0.1*hasSkill('wind2'));
  R.s+=R.dir*spd*dt;
  const s=clamp(R.s,0,o.L), a=p2PolyAt(o.pts,s), ang=R.dir>0?a[2]:a[2]+Math.PI, nx=-Math.sin(ang), ny=Math.cos(ang);
  const side=(inp.mx||0)*nx+(inp.my||0)*ny; R.off=clamp(R.off+side*P3N.steer*dt,-o.w*0.45,o.w*0.45); if(Math.abs(side)<0.2) R.off*=Math.exp(-dt*1.4);
  p.x=a[0]+nx*R.off; p.y=a[1]+ny*R.off; p.kvx=p.kvy=0;
  R.z+=(P3N.rideZ-R.z)*Math.min(1,dt*6); p.z=R.z+Math.sin(G.time*4.4)*2.2; p.vz=0;
  p.avx=Math.cos(ang)*spd; p.avy=Math.sin(ang)*spd;
  if(Math.hypot(inp.mx||0,inp.my||0)<0.25&&!p.breathing){ p.faceGoal=ang; p.facing=turnTo(p.facing,ang,7*dt); }
  p.flyE=flyMax(); const lv=p3StreamLv(o,s); p.elvBase=lv; p.elvCeil=lv+1; p.elvVentT=Math.max(p.elvVentT||0,0.25);
  if(AREA&&AREA.tri){ AREA.tri.wasFly=true; }
  if(typeof MV!=='undefined'){ MV.lx=p.x; MV.ly=p.y; }
  R.sndT-=dt; if(R.sndT<=0){ R.sndT=0.5; p3Snd('ride',0.7); }
  if(Math.random()<0.6) emit(p.x-Math.cos(ang)*20+rand(-8,8),p.y-p.z-Math.sin(ang)*20+rand(-6,6),1,{col:'240,248,255',glow:false,ang:ang+Math.PI,spread:0.3,smin:40,smax:120,lmin:.2,lmax:.4,zmin:1.2,zmax:2.4,drag:2,alpha:0.6});
  if(R.dir>0?R.s>=o.L:R.s<=0) p3RideOff(p,'end');
}
// the end of a ride: flight (with a tailwind that keeps the wings fresh), a glide without wings, a hop down in a dungeon
function p3RideOff(p,how){
  const R=P3.ride; if(!R) return; P3.ride=null; P3.reCd=P3N.reCd; P3.lastS=R.o;
  const o=R.o, s=clamp(R.s,0,o.L), lv=p3StreamLv(o,s);
  p.elvBase=lv; p.elvCeil=Math.max(p.elvCeil||0,lv+1);
  const caveNoFly=AREA&&!(AREA.canFly||(AREA.def&&AREA.def.canFly));
  if(caveNoFly){
    if(how==='end'){ const e=p2PolyAt(o.pts,s); let x=e[0], y=e[1]; const k=tCell(x,y); if(k<0||!tGround(k)||tHole(k)){ const g=dunNearGround(x,y,3); x=g.x; y=g.y; } P3.mv={kind:'land',x0:p.x,y0:p.y,x1:x,y1:y,z0:p.z||P3N.rideZ,t:0,dur:0.32}; p.flying=false; return; }
    p.flying=false; p.vz=JUMP_V*(p3Skyhop()?0.92:0.6); p.z=Math.max(p.z||0,30); return; }
  const wings=hasAbil('wings')&&G.mode==='story';
  if(how==='hop'&&!wings){ p.flying=false; p.vz=JUMP_V*(p3Skyhop()?0.92:0.7); return; }
  if(wings){ p.flying=true; p.landing=false; p.gliding=false; p.flyE=flyMax(); P3.tail=P3N.tail*(1+P3N.windK*hasSkill('wind2')); p.elvVentT=Math.max(p.elvVentT||0,P3.tail); if(how==='end') ftext(p.x,p.y-p.z-30,S('Wheee!','Wheee!'),'#e8f6ff',13); }
  else{ p.flying=true; p.gliding=true; p.landing=false; }
}
// JUMP while riding: the best stream in reach, in front of Ash (where he steers, or faces)
function p3HopTarget(p,R){
  const reach=P3N.hopR*(p3Skyhop()?1.25:1), inp=P3.inp||{}, mv=Math.hypot(inp.mx||0,inp.my||0)>0.25, aim=mv?Math.atan2(inp.my,inp.mx):p.facing, lv=p3StreamLv(R.o,clamp(R.s,0,R.o.L));
  let best=null, bs=1e9;
  for(const o of p3StreamsHere()){
    if(o===R.o||!p3StreamOn(o)) continue; if(p.x<o.bb[0]-reach||p.x>o.bb[2]+reach||p.y<o.bb[1]-reach||p.y>o.bb[3]+reach) continue;
    const q=p2PolyD(o.pts,p.x,p.y); if(q.d>reach||q.d<8) continue;
    if(p3StreamLv(o,q.s)>lv+1) continue;
    const c=p2PolyAt(o.pts,q.s), da=Math.abs(angDiff(aim,angTo(p.x,p.y,c[0],c[1])));
    if(mv&&da>1.4) continue;
    const sc=q.d*(1+da*0.6); if(sc<bs){ bs=sc; best={o,s:q.s,x:c[0],y:c[1],ang:c[2]}; }
  }
  return best;
}
function p3HopStart(p,t){
  const o=t.o; let dir=1; if(o.both){ const vx=Math.cos(p.facing), vy=Math.sin(p.facing); dir=Math.cos(t.ang)*vx+Math.sin(t.ang)*vy>=0?1:-1; if(t.s>o.L-20) dir=-1; else if(t.s<20) dir=1; }
  P3.ride=null; P3.mv={kind:'hop',x0:p.x,y0:p.y,z0:p.z||P3N.rideZ,x1:t.x,y1:t.y,o,s:t.s,dir,t:0,dur:P3N.hopT+dist(p.x,p.y,t.x,t.y)/1400};
  p3Snd('whoosh'); mvSnd('dbl',0.6);
  if(G.stats) G.stats.p3hops=(G.stats.p3hops||0)+1;
}
// updrafts in dungeons: with Wind Riding they lift Ash onto the ribbon above them or onto the ledge next to them
function p3UpdraftTick(A,dt){
  const C=A.p3, p=player; if(!C||!C.ups.length||P3.ride||P3.mv||p.dead) return; const cs=A.cave.cell;
  for(const u of C.ups){ u.ph+=dt; if(dist(p.x,p.y,u.x,u.y)>24) continue;
    if(!canWindride()){ if(!(u.nope>G.time)){ u.nope=G.time+2.5; p3Snd('puff'); emit(p.x,p.y-30,10,{col:'235,246,255',glow:false,ang:-Math.PI/2,spread:0.5,smin:60,smax:160,lmin:.3,lmax:.6,zmin:1.5,zmax:3,drag:2,alpha:0.7}); ftext(p.x,p.y-50,G.hat?S('Whoosh! It nearly blows your hat off!','Whoosh! Hold your hat!'):S('Whoosh! A gust of warm air.','Whoosh!'),'#eef6ff',13); } continue; }
    if((p.z||0)>10) continue;
    let best=null, bd=cs*2.4; for(const o of C.ribbons){ if(!p3StreamOn(o)) continue; const q=p2PolyD(o.pts,u.x,u.y); if(q.d<bd){ bd=q.d; const c=p2PolyAt(o.pts,q.s); best={o,s:q.s,x:c[0],y:c[1],ang:c[2]}; } }
    if(best){ let dir=1; if(best.o.both&&best.s>best.o.L*0.5) dir=-1; P3.mv={kind:'hop',x0:p.x,y0:p.y,z0:0,x1:best.x,y1:best.y,o:best.o,s:best.s,dir,t:0,dur:0.55,rise:true}; p3Snd('wind'); ftext(p.x,p.y-40,S('Updraft!','Whoosh!'),'#eef6ff',13); return; }
    // the raised floor beside it
    const k0=tCell(u.x,u.y); let tgt=null, td=1e9;
    for(let dj=-2;dj<=2;dj++) for(let di=-2;di<=2;di++){ const q=k0+di+dj*A.cave.w; if(q<0||q>=A.cave.typ.length) continue; if(dunH(q)!==1||!tGround(q)||caveBlockedAt(q)) continue; const c=tPos(q), d=dist(c.x,c.y,p.x+Math.cos(p.facing)*30,p.y+Math.sin(p.facing)*30); if(d<td){ td=d; tgt=c; } }
    if(tgt){ p3Launch(p,p.x,p.y,tgt.x,tgt.y,90); P3.mv.lift=true; ftext(p.x,p.y-40,S('Updraft!','Whoosh!'),'#eef6ff',13); return; }
    P3.mv={kind:'float',t:0,dur:1.0}; p3Snd('puff');
  }
}
// ---- drawing: the streams, in the air at riding height; their shadows on the ground
function p3DrawStreams(t,ground){
  const list=p3StreamsHere(); if(!list.length) return;
  ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  for(const o of list){
    if(!inView((o.bb[0]+o.bb[2])/2,(o.bb[1]+o.bb[3])/2,Math.max(o.bb[2]-o.bb[0],o.bb[3]-o.bb[1])/2+40)) continue;
    const on=p3StreamOn(o), can=canWindride();
    if(ground){ ctx.strokeStyle=`rgba(40,50,90,${on?0.1:0.05})`; ctx.lineWidth=o.w*0.7; ctx.setLineDash([22,30]); ctx.lineDashOffset=-t*40; ctx.stroke(o.pG); ctx.setLineDash([]); continue; }
    if(!on){ ctx.strokeStyle='rgba(230,240,255,.22)'; ctx.lineWidth=2; ctx.setLineDash([6,14]); ctx.stroke(o.pMid); ctx.setLineDash([]); continue; }
    const fl=-t*(o.speed*0.45)*(o.rev?-1:1);
    // a sky-blue body with a white core (it reads on snow, ice and dark cave floors alike), plum-edged white streaks
    ctx.strokeStyle=`rgba(110,170,235,${can?0.24:0.14})`; ctx.lineWidth=o.w*0.95; ctx.stroke(o.pMid);
    ctx.strokeStyle=`rgba(230,245,255,${can?0.34:0.2})`; ctx.lineWidth=o.w*0.5; ctx.stroke(o.pMid);
    ctx.setLineDash([46,34]);
    if(LOOK.sb){ ctx.strokeStyle='rgba(59,34,51,.4)'; ctx.lineWidth=6; ctx.lineDashOffset=fl; ctx.stroke(o.pA); ctx.lineDashOffset=fl+30; ctx.stroke(o.pB); }
    ctx.strokeStyle='rgba(255,255,255,.96)'; ctx.lineWidth=3.2; ctx.lineDashOffset=fl; ctx.stroke(o.pA); ctx.lineDashOffset=fl+30; ctx.stroke(o.pB);
    ctx.strokeStyle='rgba(80,150,235,.9)'; ctx.lineWidth=2.6; ctx.setLineDash([18,62]); ctx.lineDashOffset=fl*1.3+12; ctx.stroke(o.pMid); ctx.setLineDash([]);
    // the swirls where a jump gets on
    const sw=(x,y,dir)=>{ const H=P3N.rideZ, r=o.w*0.42; for(let i=0;i<3;i++){ const a0=t*3.2*dir+i*TAU/3, arc=()=>{ ctx.beginPath(); ctx.ellipse(x,y-H,r*(1-i*0.22),r*0.55*(1-i*0.22),0,a0,a0+3.6); ctx.stroke(); }; if(LOOK.sb&&i===0){ ctx.strokeStyle='rgba(59,34,51,.35)'; ctx.lineWidth=5.4; arc(); } ctx.strokeStyle=i===1?'rgba(120,185,250,.85)':`rgba(255,255,255,${0.85-i*0.15})`; ctx.lineWidth=2.8-i*0.5; arc(); } if(can){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-H,r*1.1,'200,230,255',0.22+0.08*Math.sin(t*4)); ctx.restore(); } };
    sw(o.pts[0][0],o.pts[0][1],1); if(o.both){ const e=o.pts[o.pts.length-1]; sw(e[0],e[1],-1); }
    // arrowheads showing the way the wind blows
    for(let s=((t*o.speed*0.5)%120);s<o.L-30;s+=120){ const q=p2PolyAt(o.pts,s), a=q[2], x=q[0], y=q[1]-P3N.rideZ, d=o.both?0:1; if(!d) continue; const ah=()=>{ ctx.beginPath(); ctx.moveTo(x-Math.cos(a-0.6)*9,y-Math.sin(a-0.6)*9); ctx.lineTo(x,y); ctx.lineTo(x-Math.cos(a+0.6)*9,y-Math.sin(a+0.6)*9); ctx.stroke(); }; if(LOOK.sb){ ctx.strokeStyle='rgba(59,34,51,.4)'; ctx.lineWidth=5; ah(); } ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=2.6; ah(); }
  }
  ctx.restore();
}
function p3DrawUpdraft(o,t){
  const x=o.x, y=o.y, can=canWindride();
  ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(x,y,21,13,0,0,TAU); ctx.fill();
  ctx.fillStyle='#5a6070'; ctx.beginPath(); ctx.ellipse(x,y,18,11,0,0,TAU); ctx.fill();
  ctx.strokeStyle='#2a2e38'; ctx.lineWidth=2.2; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x+i*6,y-9+Math.abs(i)*1.5); ctx.lineTo(x+i*6,y+9-Math.abs(i)*1.5); ctx.stroke(); }
  for(let i=0;i<3;i++){ const k=((t*0.9+i/3+o.ph)%1), a=(1-k)*(can?0.7:0.4); ctx.strokeStyle=`rgba(240,248,255,${a})`; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y-k*60,10+k*10,5+k*4,0,0,TAU); ctx.stroke(); }
  if(can){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-20,30,'200,230,255',0.18); ctx.restore(); }
}
function p3DrawVane(o,t){
  const x=o.x, y=o.y, a=['n','e','s','w'].indexOf('nesw'[o.dir]), ang=[-Math.PI/2,0,Math.PI/2,Math.PI][a]+Math.sin(o.spin*20)*o.spin*0.4;
  const post=p3Spr('vpost',30,74,g=>{ g.fillStyle='rgba(40,30,60,.25)'; g.beginPath(); g.ellipse(4,0,14,5,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.rect(-5+dx,-66+dy,10,64); },'#8a7aa0',{r:8}); g.fillStyle='#d8b04a'; g.beginPath(); g.arc(0,-68,5,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-4+dy,13,6,0,0,TAU); },'#a09ab0',{r:12}); },1.4);
  p3Put(post,x,y+4);
  const cx=x, cy=y-68;
  ctx.save(); ctx.translate(cx,cy); ctx.scale(1,0.62); ctx.rotate(ang); ctx.lineJoin='round';
  ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.moveTo(30,0); ctx.lineTo(16,-10); ctx.lineTo(16,-4); ctx.lineTo(-22,-4); ctx.lineTo(-30,-12); ctx.lineTo(-26,0); ctx.lineTo(-30,12); ctx.lineTo(-22,4); ctx.lineTo(16,4); ctx.lineTo(16,10); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#e8c860'; ctx.beginPath(); ctx.moveTo(27,0); ctx.lineTo(17,-7); ctx.lineTo(17,-2); ctx.lineTo(-21,-2); ctx.lineTo(-26,-8); ctx.lineTo(-23,0); ctx.lineTo(-26,8); ctx.lineTo(-21,2); ctx.lineTo(17,2); ctx.lineTo(17,7); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle='#fff4dc'; ctx.font=`800 10px ${UIF}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=3; ctx.strokeStyle=SBC.outline; const L='NESW'[o.dir]; ctx.strokeText(L,cx,cy-16); ctx.fillText(L,cx,cy-16);
}

// ---------- 7. Ground Pound
// ATTACK in the air: from a jump (movesPre in a6c_moves.js starts the slam once Ash is 6 px up; a press just after
// take-off is held for 0.25 s) or from flight with a melee weapon (the wings fold and he drops). The landing calls
// slamImpact, which is the pound once Ash has the power.
function p3PoundInput(p,dt,inp){
  if(!canPound()||p.dead||P3.ride||P3.mv) return inp;
  if(p.flying&&inp.attack&&p3Melee()&&(p.z||0)>10&&!(typeof P2!=='undefined'&&P2.mv)){
    p.flying=false; p.landing=false; p.gliding=false; if(typeof MV!=='undefined') MV.hover=null; p.slam=true; p.vz=-640; p.avx=(p.avx||0)*0.25; p.avy=(p.avy||0)*0.25; mvSnd('takeoff',0.6); p3Snd('whoosh',0.7);
    return Object.assign({},inp,{attack:false}); }
  if(!p.flying&&inp.attack&&!p.slam&&((p.z||0)>0||(p.vz||0)>0)&&(p.z||0)<=6) P3.pbuf=0.25;
  if(P3.pbuf>0){ P3.pbuf-=dt; if(!p.slam&&!p.flying&&(p.z||0)>6&&(p.vz||0)>-300){ P3.pbuf=0; return Object.assign({},inp,{attack:true}); } }
  return inp;
}
{ const base=slamImpact; slamImpact=function(p){ if(!canPound()) return base(p); p3PoundImpact(p); }; }
// in the air, ATTACK is always the pound: a sign or a drum's "Look at" prompt never turns it into USE (a5_input.js useMode)
// and beside a wind vane ATTACK swings at it (that is how it turns); USE still reads what it is
{ const base=useMode; useMode=function(){ const p=player; if(p&&G&&!p.flying&&canPound()&&((p.z||0)>0.5||(p.vz||0)>0)) return null;
    if(p&&AREA&&AREA.p3&&AREA.p3.vanes.some(o=>dist2(o.x,o.y,p.x,p.y)<80*80)) return null;
    return base.apply(this,arguments); }; }
function p3PoundImpact(p){
  const R=p3PoundR(), st=p.stats, rk=hasSkill('pound2'), dmg=st.slash*st.dmgMul*(st.wpnMul||1)*P3N.poundDmg, stun=P3N.stun*(1+P3N.poundK*rk)*(p3Easy()?1.25:1), x=p.x, y=p.y;
  shake(10); hitstop=Math.max(hitstop,0.06); p3Snd('pound'); try{ mvSnd('slam',0.5); }catch(e){}
  for(const e of G.enemies){
    if(e.dead||e.spawnIn>0||e.passive) continue; const d=dist(x,y,e.x,e.y);
    if(e.onPound&&d<R*1.3+(e.r||14)) try{ e.onPound(e,{x,y,R,d,drum:false}); }catch(err){ console.warn(err); }
    if(e.flying||e.invuln||d>R+(e.r||14)) continue;
    if(e.shield&&!e.boss&&!(e.p3shT>0)){ e.p3sh=e.shield; e.shield=false; e.blocking=false; e.p3shT=P3N.armourT; ftext(e.x,e.y-(e.r||14)-16,S('CRACK!','CRACK!'),'#ffe0b0',14); }
    else if(e.shield) e.blocking=false;
    damageEnemy(e,dmg*rand(0.9,1.1)*(1-0.35*clamp(d/R,0,1)),{src:'slam',kb:P3N.kb*(e.boss?0.4:1),ka:angTo(x,y,e.x,e.y)});
    if(!e.dead) stunEnemy(e,stun);
  }
  P3.waves.push({x,y,r:14,max:R*1.15,t:0});
  for(let i=0;i<22;i++){ const a=i/22*TAU; emit(x+Math.cos(a)*18,y+Math.sin(a)*12,1,{col:i%2?'255,214,140':'230,236,245',glow:i%2===0,ang:a,spread:0.1,smin:180,smax:300,lmin:.2,lmax:.38,zmin:2,zmax:4,drag:5}); }
  emit(x,y+4,18,{col:'150,130,110',glow:false,smin:40,smax:200,lmin:.3,lmax:.6,zmin:2,zmax:6,grow:8});
  G.ripples.push({x,y,t:0,max:0.5,r:R*1.2,splash:true});
  if(!AREA) scorch(x,y,R*0.55);
  try{ areaObjHit(x,y,R*0.75,'hammer'); }catch(e){}
  if(G.mode==='story') try{ swingBreakables(x,y,p.facing,R,Math.PI); }catch(e){}
  p3PoundWorld(x,y,R);
  P3.lastPound={x,y,R,t:G.time};
  for(const fn of P3.poundL) try{ fn({x,y,R,drum:false}); }catch(err){ console.warn(err); }
  if(G.stats) G.stats.p3pounds=(G.stats.p3pounds||0)+1;
}
// listen for every pound and drum ring (bosses: King Grumblehorn's POUND BACK, Hush, the finale): p3OnPound(fn({x,y,R,drum}))
function p3OnPound(fn){ P3.poundL.push(fn); return fn; }
function p3PoundWorld(x,y,R){
  const info={x,y,R};
  for(const o of p3Things()){ const K=o.p3k; if(!K.pound) continue; const reach=K.reach?K.reach(o):R; if(dist(o.x,o.y,x,y)<reach) K.pound(o,info); }
  const hooks=AREA?(AREA.p3hooks||[]):P3.hooks;
  for(const o of hooks){ if(!AREA&&!p3HookHere(o)) continue; const H=o.p3on&&o.p3on.pound; if(!H) continue; if(dist(o.x,o.y,x,y)<(H.r||60)) try{ H.then&&H.then(o,info); }catch(e){ console.warn(e); } }
  if(AREA&&AREA.p3) p3CavePound(AREA,x,y,R);
}
// shields knocked off by a pound grow back after a few seconds
function p3ShieldTick(dt){ for(const e of G.enemies) if(e.p3shT>0){ e.p3shT-=dt; e.shield=false; e.blocking=false; if(e.p3shT<=0){ e.p3shT=0; if(!e.dead) e.shield=e.p3sh; } } }

// ---------- 8. moves that take over Ash (launches, hops between streams, updraft lifts, a cave ribbon's end, a fall
// through a cracked floor). updatePlayer is skipped while one runs; p2Tick keeps the timers going.
function p3MoveStep(p,dt,inp){
  const M=P3.mv; M.t+=dt; const k=clamp(M.t/M.dur,0,1), e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  switch(M.kind){
    case 'launch': p.flying=false; p.x=lerp(M.x0,M.x1,k); p.y=lerp(M.y0,M.y1,k); p.z=4*k*(1-k)*M.peak; p.facing=angTo(M.x0,M.y0,M.x1,M.y1);
      if(Math.random()<0.6) emit(p.x,p.y-p.z,1,{col:'240,240,250',glow:false,smin:5,smax:20,lmin:.2,lmax:.35,zmin:1,zmax:2,drag:2,alpha:0.5});
      if(k>=1){ P3.mv=null; p2End(p,M.x1,M.y1); } break;
    case 'hop': { p.flying=true; p.landing=false; p.gliding=false; p.flyE=flyMax(); p.x=lerp(M.x0,M.x1,e); p.y=lerp(M.y0,M.y1,e); const zt=P3N.rideZ; p.z=lerp(M.z0,zt,e)+(M.rise?0:34*Math.sin(Math.PI*k)); p.vz=0; p.facing=M.rise?p.facing:angTo(M.x0,M.y0,M.x1,M.y1);
      if(M.rise&&Math.random()<0.8) emit(p.x+rand(-14,14),p.y-p.z+rand(0,20),1,{col:'240,248,255',glow:false,ang:-Math.PI/2,spread:0.3,smin:80,smax:160,lmin:.2,lmax:.4,zmin:1.2,zmax:2.4,drag:2,alpha:0.6});
      if(k>=1){ P3.mv=null; p3RideStart(p,M.o,M.s,M.dir); } break; }
    case 'land': p.x=lerp(M.x0,M.x1,e); p.y=lerp(M.y0,M.y1,e); p.z=M.z0*(1-k)+12*Math.sin(Math.PI*k); if(k>=1){ P3.mv=null; p2End(p,M.x1,M.y1); } break;
    case 'float': p.z=46*Math.sin(Math.PI*k); if(Math.random()<0.6) emit(p.x+rand(-12,12),p.y,1,{col:'240,248,255',glow:false,ang:-Math.PI/2,spread:0.3,smin:60,smax:120,lmin:.2,lmax:.4,zmin:1.2,zmax:2.2,drag:2,alpha:0.6}); if(k>=1){ P3.mv=null; p2End(p,p.x,p.y,true); } break;
    case 'sink': p.z=-30*k; if(Math.random()<0.6) emit(M.x+rand(-30,30),M.y+rand(-16,16),1,{col:'90,80,90',glow:false,smin:10,smax:40,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:5}); if(k>=1){ P3.mv=null; p.z=0; p3FallLand(M.o); } break;
    default: P3.mv=null;
  }
}

// ---------- 9. every frame, and the wrappers
function p3Reset(all){ P3.ride=null; P3.mv=null; P3.jet=null; P3.jetOn=false; P3.bz.hold=0; P3.bz.blue=false; P3.bz.jetA=0; P3.tail=0; P3.pbuf=0; P3.waves=[]; P3.fx=[]; if(all){ P3.tips={}; P3.lastS=null; } }
function p3Sync(p){
  if(P3.g!==G){ P3.g=G; p3Reset(true); P3.area=AREA; p3Restore(); }
  if(P3.area!==AREA){ P3.area=AREA; const M=P3.mv; p3Reset(false); if(M&&M.kind==='sink') P3.mv=null; }
  if(p.dead&&(P3.ride||P3.mv)) p3Reset(false);
  else if((P3.ride||P3.mv)&&P3.lx!=null&&dist2(p.x,p.y,P3.lx,P3.ly)>420*420) p3Reset(false);
}
function p3WorldTick(dt){
  if(P3.reCd>0) P3.reCd-=dt;
  for(const o of p3Things()){ const K=o.p3k; if(K.tick) K.tick(o,dt); }
  for(let i=P3.waves.length-1;i>=0;i--){ const w=P3.waves[i]; w.t+=dt; w.r+=dt*(w.drum?700:480); if(w.r>=w.max) P3.waves.splice(i,1); }
  for(let i=P3.fx.length-1;i>=0;i--){ const f=P3.fx[i]; f.t+=dt; const k=clamp(f.t/f.dur,0,1);
    if(f.k==='fly'){ const q=f.q; q.x=lerp(f.x0,f.x1,k); q.y=lerp(f.y0,f.y1,k); q.p3z=4*k*(1-k)*140; if(k>=1){ q.p3z=0; if(q.p2==='pullblock'&&typeof p2CrateMove==='function'){ q.x=f.x0; q.y=f.y0; p2CrateMove(q,f.x1,f.y1); } else { q.x=f.x1; q.y=f.y1; if(G.found) G.found['p3r_'+q.id]=[Math.round(q.x),Math.round(q.y)]; } p3Snd('clunk'); shake(3); P3.fx.splice(i,1); } }
    else if(f.k==='flyb'){ if(k>=1){ const b=f.b, A=AREA; if(A){ b.ci=f.ti; b.cj=f.tj; b.x=f.x1; b.y=f.y1; b.fx=b.x; b.fy=b.y; b.anim=0; } p3Snd('clunk'); shake(4); emit(f.x1,f.y1,12,{col:'150,130,110',glow:false,smin:30,smax:110,lmin:.25,lmax:.5,zmin:2,zmax:4,grow:5}); if(A&&typeof refreshCaveGates==='function') refreshCaveGates(); P3.fx.splice(i,1); } }
    else if(k>=1) P3.fx.splice(i,1); }
  if(AREA&&AREA.p3) p3CaveTick(AREA,dt);
  p3ShieldTick(dt);
}
function p3After(p,dt){
  P3.lx=p.x; P3.ly=p.y;
  if(!p.breathing){ const B=P3.bz; B.on=false;
    // let go before the blue while the flame was on ice: now say how Blaze works (not while it is still warming up)
    if(B.iceT>0&&!B.blue&&canBlaze()) p3Say(p.x,p.y-60,S('Hotter! Hold the fire until it turns blue.','Hold it! Wait for blue fire.'),'#dff4ff','sweat',4);
    B.iceT=0; if(B.hold>0||B.blue){ B.hold=0; B.blue=false; B.jetA=0; P3.jet=null; B.sndT=0; } }
  if(P3.bz.flash>0) P3.bz.flash-=dt;
  if(P3.tail>0){ P3.tail-=dt; if(p.flying) p.flyE=flyMax(); }
}
// snow drifts slow Ash to half speed
function p3DriftSlow(p,ox,oy){ const A=AREA; if(!A||!A.p3||!A.p3.drift.size||airborne()) return; const k=tCell(p.x,p.y); if(k<0||!A.p3.drift.has(k)||A.p3.drift.get(k)<0) return; p.x=ox+(p.x-ox)*0.5; p.y=oy+(p.y-oy)*0.5; if(Math.random()<0.15) emit(p.x,p.y+6,1,{col:'240,246,255',glow:false,smin:10,smax:40,lmin:.3,lmax:.5,zmin:2,zmax:3.5,grow:4}); }
{ const base=updatePlayer; updatePlayer=function(dt,inp){
  const p=player; if(!p||!G) return base(dt,inp);
  p3Sync(p); P3.inp=inp; P3.t+=dt; p3WorldTick(dt);
  if(P3.mv){ p2Tick(p,dt); p3MoveStep(p,dt,inp); p3After(p,dt); return; }
  if(P3.ride){ p3RideStep(p,dt,inp,base); p3After(p,dt); return; }
  const q=p3PoundInput(p,dt,inp), ox=p.x, oy=p.y;
  base(dt,q);
  if(!P3.ride&&!P3.mv&&canWindride()) p3RideCheck(p);
  p3DriftSlow(p,ox,oy);
  p3After(p,dt);
}; }
// the JUMP that hopped off a stream is not also a jump (or a take-off) once Ash is free
{ const base=readInput; readInput=function(dt){ const o=base(dt); if(P3.jumpLock){ if(o.jump||o.jumpHeld){ if(!P3.ride&&!P3.mv){ o.jump=false; o.jumpHeld=false; } } else P3.jumpLock=false; } return o; }; }
// streams ignore no-fly zones (and dungeons where flying is off); the tailwind after one keeps Ash up
{ const base=canFlyHere; canFlyHere=function(){ if(P3.ride||(P3.mv&&P3.mv.kind==='hop')) return true; return base.apply(this,arguments); }; }
// nothing shoves Ash off a stream, a launch or a hop
{ const base=separate; separate=function(){ const p=player; if(p&&(P3.ride||P3.mv)){ const x=p.x, y=p.y; base(); p.x=x; p.y=y; return; } base(); }; }
// the wind holds Ash: a hit while riding does not knock him off (he only flinches)
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){ const r=base(amt,sx,sy,kb); if(r&&P3.ride&&player){ player.kvx=player.kvy=0; } return r; }; }
// frozen folk: a person who is still frozen is not standing around in town yet
{ const base=npcPresent; npcPresent=function(id){ const o=P3.out.find(q=>q.p3==='frozen'&&q.who===id&&q.hideNpc!==false); if(o&&!p3Thawed(o)) return false; return base(id); }; }
// USE on our things
{ const base=lmAct; lmAct=function(o){ if(o&&o.p3k){ if(o.p3k.act) o.p3k.act(o); return; } return base(o); }; }
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&o.p3k){ if(o.p3k.act) o.p3k.act(o); return; } if(o&&o.k==='p3g'){ p3GateAct(o); return; } if(o&&(o.k==='p3_vane'||o.k==='p3_up'||o.k==='p3_psw'||o.k==='p3_lt')){ p3MarkAct(o); return; } return base(o); }; }
{ const base=caveObjAct; caveObjAct=function(o){
    if(o&&o.k==='cgate'&&(o.type==='ice'||o.type==='chain')&&o.closed&&!o.tmp){
      if(o.type==='ice') p3Read(canBlaze()?S('A doorway plugged solid with ice. Hold your fire breath until it burns blue.','A frozen door. Use blue fire!'):S('A doorway plugged solid with ice. Your fire breath only makes it sweat. You need a hotter fire.','A frozen door. Your fire is too weak.'));
      else p3Read(S('A door held shut by a chain of purple moth-frost. The chain ends in a lock somewhere in this room. Crack the lock’s ice, then melt it.','A chained door. Find the lock in this room.'));
      return true; }
    return base.apply(this,arguments); }; }
{ const base=caveGatePrompt; caveGatePrompt=function(o){ if(o&&(o.type==='ice'||o.type==='chain')) return o.closed&&!o.tmp?(o.type==='ice'?S('Look at the frozen door','Look at the door'):S('Look at the chained door','Look at the door')):null; return base.apply(this,arguments); }; }
function p3GatePrompt(o){
  if(o.g==='ice') return o.melted?null:S('Look at the ice wall','Look at the ice');
  if(o.g==='dome') return o.done?null:S('Look at the ice dome','Look at the dome');
  if(o.g==='lock') return o.done?null:S('Look at the chain lock','Look at the lock');
  if(o.g==='pillar') return o.closed?S('Look at the drum pillar','Look at the pillar'):null;
  return null;
}
function p3GateAct(o){
  if(o.g==='ice') p3Read(canBlaze()?S('A wall of thick old ice. Blue fire will melt it.','Thick ice. Use blue fire!'):S('A wall of thick old ice. Your fire breath only makes it sweat.','Thick ice. Your fire is too weak.'));
  else if(o.g==='dome') p3Read(S('A dome of hard ice. Smash it with a Ground Pound or a bomb, or melt it with blue fire.','An ice dome. Pound it or melt it!'));
  else if(o.g==='lock') p3Read(o.cover==='lid'&&!o.lidGone?S('A padlock of purple moth-frost under a thick lid of ice. Break the lid with a Ground Pound, then melt the lock with blue fire.','Pound the lid. Then blue fire!'):o.cover==='dome'?S('A padlock of purple moth-frost inside a dome of ice. Pound the rune plate beside it to crack the dome, then melt the lock with blue fire, quickly, before the dome grows back.','Pound the plate. Then blue fire, fast!'):S('A padlock of purple moth-frost. Blue fire melts it.','Blue fire melts it!'));
  else if(o.g==='pillar') p3Read(S('A stone pillar carved with drums. Somewhere a pound switch makes it sink into the floor.','Pound a switch to lower it.'));
}
function p3MarkAct(o){
  if(o.k==='p3_vane') p3Read(S('A big wind vane. Hit it (an arrow, the boomerang, the whip, a sword) and it turns. It decides which way the wind blows.','A wind vane. Hit it to turn it.'));
  else if(o.k==='p3_up') p3Read(canWindride()?S('A warm updraft. Step into it and the wind lifts you up.','Step in. The wind lifts you!'):S('Warm air rushes up out of the grate. It nearly lifts you off your feet. Nearly.','Warm air blows up. Not strong enough.'));
  else if(o.k==='p3_psw') p3Read(S('A big round switch with a ram’s face. Too heavy for your claws. Jump on it and pound!','A heavy switch. Pound it!'));
  else if(o.k==='p3_lt') p3Read(S('A pound tile. Pounding it flips it, and the tiles beside it flip too.','Pound it. Its neighbours flip too.'));
}
function p3MarkPrompt(o){ if(o.k==='p3_vane') return S('Look at the wind vane','Look at the vane'); if(o.k==='p3_up') return S('Look at the updraft','Look at the vent'); if(o.k==='p3_psw') return S('Look at the pound switch','Look at the switch'); if(o.k==='p3_lt') return S('Look at the pound tile','Look at the tile'); return null; }
// fire arrows, bombs, the whip, the glaive and the hammer on our outdoor things
{ const base=armsWorldHit; armsWorldHit=function(x,y,r,src){
    const out=base.apply(this,arguments); if(AREA||G.mode!=='story') return out;
    for(const o of p3Things()){ const K=o.p3k, rr=(K.hitR?K.hitR(o):o.r||16)+r; if(dist(x,y,o.x,o.y)>rr) continue;
      if(src==='bomb'){ if(K.bomb) K.bomb(o,x,y); } else if(src==='fire'){ if(K.fire) K.fire(o,0.3,false); } else if(src==='hammer'){ if(K.hammer&&typeof ARMS!=='undefined'&&ARMS.hamCh>=0.98) K.hammer(o); else if(K.hit) K.hit(o,src); } else if(K.hit) K.hit(o,src); }
    if(src==='bomb'){ p3SeesawHit(x,y,'bomb'); for(const o of P3.hooks){ if(!p3HookHere(o)) continue; const H=o.p3on; if(H.bomb&&dist(o.x,o.y,x,y)<r+(o.r||24)) try{ H.bomb(o,x,y); }catch(e){ console.warn(e); } } }
    return out; }; }
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){ const h=base.apply(this,arguments); if((src==='bomb'||src==='bombs')&&AREA) p3SeesawHit(x,y,'bomb'); return h; }; }
{ const base=swingBreakables; swingBreakables=function(px,py,dir,range,half){ base.apply(this,arguments); if(AREA||G.mode!=='story') return; for(const o of p3Things()){ const K=o.p3k; if(!K.hit) continue; if(inArcC(px,py,dir,range+10,half,{x:o.x,y:o.y,r:K.hitR?K.hitR(o):16})) K.hit(o,'slash'); } }; }

// ---------- 10. drawing
// the blue moment and the jet (over everything, like the breath particles), flying crates and blocks
function p3DrawBlaze(t){
  const p=player; if(!p||p.dead) return; const B=P3.bz;
  const f=p.facing, z=p.flying?(p.z||0):6, mx=p.x+Math.cos(f)*18, my=p.y-z+Math.sin(f)*18;
  // the warm-up ring: it fills as the flame heats, gold to white to blue
  if(canBlaze()&&B.on&&!B.blue&&B.hold>0.08){ const k=clamp(B.hold/p3WarmT(),0,1), col=k<0.6?'255,224,150':'200,236,255';
    ctx.save(); ctx.lineCap='round'; ctx.strokeStyle='rgba(59,34,51,.28)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(mx,my,17,0,TAU); ctx.stroke();
    ctx.strokeStyle='rgba(59,34,51,.6)'; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(mx,my,17,-Math.PI/2,-Math.PI/2+TAU*k); ctx.stroke();
    ctx.strokeStyle=`rgba(${col},.98)`; ctx.lineWidth=3.8; ctx.stroke(); ctx.globalCompositeOperation='lighter'; glowAt(mx,my,16+k*8,col,0.18+0.3*k); ctx.restore(); }
  if(B.flash>0){ const k=1-B.flash/0.45; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(170,225,255,${0.9*(1-k)})`; ctx.lineWidth=4*(1-k)+1; ctx.beginPath(); ctx.arc(mx,my,10+k*46,0,TAU); ctx.stroke(); glowAt(mx,my,30+k*30,'190,235,255',0.5*(1-k)); ctx.restore(); }
  const J=P3.jet; if(!J||!B.blue) return;
  const ca=Math.cos(J.ang), sa=Math.sin(J.ang), nx=-sa, ny=ca, x0=mx, y0=my, x1=J.ox+ca*J.L, y1=J.oy+sa*J.L-(p.flying?0:4);
  const w0=P3N.jetW0*0.5, w1=P3N.jetW1*0.5, fl=Math.sin(t*40)*1.5;
  const shape=(k)=>{ ctx.beginPath(); ctx.moveTo(x0+nx*w0*k,y0+ny*w0*k); ctx.quadraticCurveTo((x0+x1)/2+nx*(w1*0.8+fl)*k,(y0+y1)/2+ny*(w1*0.8+fl)*k,x1+nx*w1*k,y1+ny*w1*k); ctx.arc(x1,y1,w1*k,J.ang-Math.PI/2,J.ang+Math.PI/2); ctx.quadraticCurveTo((x0+x1)/2-nx*(w1*0.8-fl)*k,(y0+y1)/2-ny*(w1*0.8-fl)*k,x0-nx*w0*k,y0-ny*w0*k); ctx.closePath(); };
  // painted, not added: a deep blue body with a soft plum edge (it stays blue over snow and ice), a pale blue middle and a
  // white-hot core; only the glows at the mouth and the tip are added light
  ctx.save();
  if(LOOK.sb){ ctx.strokeStyle='rgba(59,34,51,.32)'; ctx.lineWidth=3; shape(1.3); ctx.stroke(); }
  const g=ctx.createLinearGradient(x0,y0,x1,y1); g.addColorStop(0,'rgba(110,195,255,.85)'); g.addColorStop(0.55,'rgba(60,130,245,.72)'); g.addColorStop(1,'rgba(45,85,225,.32)');
  ctx.fillStyle=g; shape(1.25); ctx.fill();
  const g2=ctx.createLinearGradient(x0,y0,x1,y1); g2.addColorStop(0,'rgba(245,252,255,.95)'); g2.addColorStop(0.7,'rgba(175,228,255,.8)'); g2.addColorStop(1,'rgba(150,205,255,.25)');
  ctx.fillStyle=g2; shape(0.62); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.85)'; shape(0.24); ctx.fill();
  ctx.globalCompositeOperation='lighter'; glowAt(x0,y0,22,'170,220,255',0.45); glowAt(x1,y1,w1*1.5,'80,150,255',0.32);
  ctx.restore();
}
function p3DrawFx(t){
  for(const f of P3.fx){ const k=clamp(f.t/f.dur,0,1);
    if(f.k==='flyb'){ const x=lerp(f.x0,f.x1,k), y=lerp(f.y0,f.y1,k), z=4*k*(1-k)*150; p3Sh(x,y+10,18*(1-k*0.4),7,0.25); ctx.save(); ctx.translate(x,y-z); ctx.rotate(k*TAU); ctx.fillStyle=SBC.outline; rrect(ctx,-22,-22,44,44,6); ctx.fill(); ctx.fillStyle='#8a8478'; rrect(ctx,-20,-20,40,40,5); ctx.fill(); ctx.fillStyle='#a8a090'; rrect(ctx,-20,-20,40,12,5); ctx.fill(); ctx.restore(); }
    if(f.k==='fly'&&f.q.p3z>0){ const q=f.q; p3Sh(q.x,q.y+12,16,6,0.25); } }
}
// pound and drum shockwaves, the landing ring of a falling pound (on the ground, under everything that stands)
function p3DrawGround(t){
  for(const w of P3.waves){ const k=clamp(w.r/w.max,0,1), a=1-k; ctx.save();
    ctx.strokeStyle=w.drum?`rgba(255,214,140,${0.8*a})`:`rgba(255,246,226,${0.85*a})`; ctx.lineWidth=(w.drum?10:8)*a+2; ctx.beginPath(); ctx.ellipse(w.x,w.y,w.r,w.r*0.62,0,0,TAU); ctx.stroke();
    ctx.strokeStyle=`rgba(59,34,51,${0.35*a})`; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(w.x,w.y,w.r+5,w.r*0.62+3,0,0,TAU); ctx.stroke(); ctx.restore(); }
  const p=player; if(p&&p.slam&&canPound()&&(p.z||0)>2&&!p.dead){ const R=p3PoundR(), k=clamp((p.z||0)/60,0,1); ctx.save(); ctx.strokeStyle=`rgba(255,230,170,${0.35+0.4*(1-k)})`; ctx.lineWidth=2.6; ctx.setLineDash([10,8]); ctx.lineDashOffset=-t*60; ctx.beginPath(); ctx.ellipse(p.x,p.y,R*(0.5+0.5*k),R*(0.5+0.5*k)*0.62,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
}
{ const base=drawPools; drawPools=function(){ base.apply(this,arguments); if(!G||!player) return; const t=G.time; p3DrawStreams(t,true); p3DrawGround(t); }; }
{ const base=drawAirborneHook; drawAirborneHook=function(){ if(G&&player){ p3DrawStreams(G.time,false); } base.apply(this,arguments); if(G&&player){ p3DrawFx(G.time); p3DrawBlaze(G.time); } }; }
// the things that stand up (ice, locks, braziers, frozen folk, drums, bells, vanes) sort with the figures
function p3Stand(list,o,y,fn){ list.push({x:o.x,y,r:6,flying:true,draw:fn}); }
{ const base=eventsForRender; eventsForRender=function(list){
  base(list);
  if(!G||!player) return; const t=G.time;
  for(const o of p3Things()){ const K=o.p3k; if(!K.stand||!inView(o.x,o.y,(o.h||o.hh||60)+120)) continue; p3Stand(list,o,K.sy?K.sy(o):o.y,()=>K.stand(o,t)); }
  if(AREA){ const A=AREA, C=A.p3;
    if(C){ for(const o of C.gates) if(inView(o.x,o.y,90)) p3Stand(list,o,o.y+A.cave.cell*0.45,()=>p3DrawGate(A,o,t));
      for(const o of C.vanes) if(inView(o.x,o.y,110)) p3Stand(list,o,o.y+4,()=>p3DrawVane(o,t)); }
    for(const o of A.objs) if(o.k==='brazier'&&o.far&&inView(o.x,o.y,o.h+60)) p3Stand(list,o,o.y+6,()=>p3DrawPillarBraz(o.x,o.y,o.h,o.lit,t));
  }
}; }
{ const base=drawLandmark; drawLandmark=function(o,t){ if(o&&o.p3k){ if(o.p3k.ground) o.p3k.ground(o,t); return; } return base(o,t); }; }
for(const kind in P3K){ const K=P3K[kind]; FL['p3_'+kind]=(o,t)=>{ if(K.ground) K.ground(o,t); }; }
FL.p3g=(o,t)=>{ const A=AREA; if(!A) return; const cs=A.cave.cell;
  if(o.g==='ice'&&o.melted&&(o.wetT||0)>0) p3Puddle(o.x,o.y+8,cs,clamp(o.wetT/8,0,1));
  if(o.g==='pillar'&&o.rise<0.98){ ctx.fillStyle='rgba(30,20,30,.45)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,cs*0.42,cs*0.3,0,0,TAU); ctx.fill(); ctx.strokeStyle=o.up?'rgba(255,200,120,.55)':'rgba(140,200,255,.55)'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.ellipse(o.x,o.y,cs*0.3,cs*0.2,0,0,TAU); ctx.stroke(); if(o.up){ ctx.beginPath(); ctx.ellipse(o.x,o.y,cs*0.16,cs*0.1,0,0,TAU); ctx.stroke(); } }
  if(o.g==='dome'&&o.done) p3Puddle(o.x,o.y+6,cs*0.9,0.4); };
FL.p3_up=(o,t)=>p3DrawUpdraft(o,t);
FL.p3_vane=()=>{};
// a pound switch: a square stone slab with a swap rune (two arrows chasing round), blue or gold for the drum state
FL.p3_psw=(o,t)=>{ const R=AREA&&AREA.rooms[o.room], st=R?R.p3drum|0:0, col=st?'140,200,255':'255,200,120', b=o.bump>0?2:0;
  const sp=p3Spr('pswq',52,36,g=>{ celFill(g,(q,dx,dy)=>{ rrect(q,-23+dx,-31+dy,46,29,7); },'#8e96a8',{r:23}); g.fillStyle='#6c7486'; rrect(g,-23,-11,46,9,5); g.fill(); g.fillStyle='rgba(255,255,255,.22)'; rrect(g,-19,-29,38,6,3); g.fill(); });
  p3Put(sp,o.x,o.y+15+b);
  const cx=o.x, cy=o.y-2+b, a0=t*0.8;
  for(const [c,w] of [[SBC.outline,5.4],[`rgb(${col})`,2.8]]){ ctx.strokeStyle=c; ctx.lineWidth=w; ctx.lineCap='round'; for(const k of [0,Math.PI]){ const a=a0+k; ctx.beginPath(); ctx.ellipse(cx,cy,11,6.5,0,a,a+2.3); ctx.stroke(); const ex=cx+Math.cos(a+2.3)*11, ey=cy+Math.sin(a+2.3)*6.5, ta=a+2.3+Math.PI/2; ctx.beginPath(); ctx.moveTo(ex+Math.cos(ta-2.5)*5,ey+Math.sin(ta-2.5)*3.4); ctx.lineTo(ex,ey); ctx.lineTo(ex+Math.cos(ta+2.5)*5,ey+Math.sin(ta+2.5)*3.4); ctx.stroke(); } }
  ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(cx,cy,26,col,0.3+0.1*Math.sin(t*3)); ctx.restore(); };
FL.p3_lt=(o,t)=>{ p3DrawPlate(o.x,o.y,20,o.up?'255,214,120':'120,110,140',o.bump>0,t,o.up); };
function p3DrawPlate(x,y,r,col,bump,t,lit){
  const sp=p3Spr('psw_'+r,r*2+6,r*1.4,g=>{ celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-r*0.62+dy,r,r*0.62,0,0,TAU); },'#9a9488',{r}); g.fillStyle='#6a6458'; g.beginPath(); g.ellipse(0,-r*0.62,r*0.62,r*0.38,0,0,TAU); g.fill(); g.strokeStyle='#efe2c4'; g.lineWidth=3.4; for(const s of [-1,1]){ g.beginPath(); g.arc(s*r*0.5,-r*0.62,r*0.28,s<0?-0.4:Math.PI-2.4,s<0?2.4:Math.PI+0.4); g.stroke(); } g.fillStyle='#3a3028'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*r*0.18,-r*0.68,1.8,0,TAU); g.fill(); } });
  p3Put(sp,x,y+r*0.62+(bump?2:0));
  ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y,r*1.2,col,lit?0.35+0.1*Math.sin(t*3):0.12); ctx.restore();
}
// a cave gate (ice wall, drum pillar, ice dome, chain lock)
function p3DrawGate(A,o,t){
  const cs=A.cave.cell, x=o.x, by=o.y+cs*0.45;
  if(o.g==='ice'){ if(o.melted) return; const sp=p3Spr('cice_'+cs,cs,cs+cs*0.62,g=>p3IceBlockArt(g,cs,cs*0.62,cs)); p3Put(sp,x,by); p3HeatOverlay(x,by,cs,cs,clamp(o.heat/p3Need(P3N.melt),0,1),t); return; }
  if(o.g==='pillar'){ const h=cs*1.1*o.rise; if(o.rise<0.05) return; const sp=p3Spr('cpil_'+o.up+'_'+cs,cs*0.84,cs*1.1+cs*0.5,g=>{ const w=cs*0.84, hh=cs*1.1; celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-cs*0.25+dy,w/2,cs*0.25,0,0,TAU); q.rect(-w/2+dx,-hh-cs*0.25+dy,w,hh); },'#a08a6c',{r:w/2}); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-hh-cs*0.25+dy,w/2,cs*0.25,0,0,TAU); },'#d8c8a8',{r:w/2}); g.strokeStyle=o.up?'#c87a3a':'#4a7ac8'; g.lineWidth=3; for(let i=0;i<(o.up?1:2);i++){ g.beginPath(); g.ellipse(0,-hh*0.55+i*10-cs*0.25,w*0.32,cs*0.12,0,0,TAU); g.stroke(); } g.strokeStyle='#efe2c4'; g.lineWidth=3.6; for(const s of [-1,1]){ g.beginPath(); g.arc(s*w*0.42,-hh*0.75-cs*0.25,6,s<0?-0.3:Math.PI-2.4,s<0?2.4:Math.PI+0.3); g.stroke(); } });
    ctx.save(); ctx.beginPath(); ctx.rect(x-cs,o.y-cs*2.2,cs*2,cs*2.2+cs*0.5); ctx.clip(); p3Put(sp,x,by+(1-o.rise)*cs*1.1); ctx.restore(); return; }
  if(o.g==='dome'){ if(o.done) return; const r=cs*0.5, sp=p3Spr('cdm_'+cs,r*2+6,r*1.8,g=>p3DomeArt(g,r,r*1.45),0);
    p3Put(sp,x,by-4); p3HeatOverlay(x,by-4,r*2,r*1.4,clamp(o.heat/p3Need(P3N.dome),0,1),t); return; }
  if(o.g==='lock'){ if(o.done) return;
    const stone=p3Spr('clst_'+cs,cs*0.9,cs*1.0,g=>{ celFill(g,(q,dx,dy)=>{ rrect(q,-cs*0.4+dx,-cs*0.9+dy,cs*0.8,cs*0.86,8); },'#6a5a7a',{r:cs*0.4}); g.fillStyle='rgba(200,170,255,.45)'; g.fillRect(-cs*0.06,-cs*0.88,cs*0.12,cs*0.8); });
    p3Put(stone,x,by-2);
    p3DrawLock(x,by-6,cs*0.55,false,0,o.cover==='dome'?(o.crack>0?o.crack:0):-1,clamp(o.heat/p3Need(o.need||P3N.lock),0,1),t);
    if(o.cover==='lid'&&!o.lidGone){ const r=cs*0.45; ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.ellipse(x,by-cs*0.55,r+2,r*0.62+2,0,0,TAU); ctx.fill(); ctx.fillStyle=ICE.base; ctx.beginPath(); ctx.ellipse(x,by-cs*0.55,r,r*0.62,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,by-cs*0.55,r*0.6,r*0.36,0,0,TAU); ctx.stroke(); }
    if(o.crack>0&&o.crack<3&&Math.sin(t*14)>0){ ctx.fillStyle='#fff4dc'; ctx.font=`800 12px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle=SBC.outline; const s=String(Math.ceil(o.crack)); ctx.strokeText(s,x,by-cs*1.3); ctx.fillText(s,x,by-cs*1.3); }
    return; }
}
// ice and chained doors
{ const base=drawFurnX; drawFurnX=function(o,t){
    if(o&&o.k==='cgate'&&(o.type==='ice'||o.type==='chain')){ if(o.tmp&&o.closed) return base(o,t); if(!o.closed){ if(o.type==='ice'&&(o.wetT||0)>0) p3Puddle(o.x,o.y+10,70,clamp(o.wetT/8,0,1)); return true; } p3DrawDoor(o,t); return true; }
    if(o&&o.k==='brazier'&&o.far) return true;
    return base(o,t); }; }
function p3DrawDoor(o,t){
  const horiz=o.vertical, W2=horiz?144:48, H2=horiz?48:144, x=o.x, y=o.y;
  if(o.type==='ice'){ ctx.save(); ctx.fillStyle=SBC.outline; rrect(ctx,x-W2/2-2,y-H2/2-2,W2+4,H2+4,10); ctx.fill(); ctx.fillStyle=ICE.mid; rrect(ctx,x-W2/2,y-H2/2,W2,H2,9); ctx.fill(); ctx.fillStyle=ICE.base; rrect(ctx,x-W2/2+3,y-H2/2+3,W2-6,H2*0.55,7); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=2.4; ctx.beginPath(); if(horiz){ for(let i=0;i<4;i++){ const xx=x-W2/2+16+i*36; ctx.moveTo(xx,y-H2/2+6); ctx.lineTo(xx+10,y+H2/2-8); } } else { for(let i=0;i<4;i++){ const yy=y-H2/2+16+i*36; ctx.moveTo(x-W2/2+6,yy); ctx.lineTo(x+W2/2-8,yy+10); } } ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.55)'; for(let i=0;i<6;i++){ ctx.beginPath(); ctx.arc(x+((i*37)%W2)-W2/2+8,y+((i*23)%H2)-H2/2+8,2,0,TAU); ctx.fill(); }
    ctx.restore(); p3HeatOverlay(x,y+H2/2,W2,H2,clamp((o.heat||0)/p3Need(P3N.door),0,1),t); return; }
  // chained: the door's stone, crossed by a violet frost chain
  stoneBlock(x,y,W2,H2,'#5a4a62','#2e2236',horiz?12:6);
  ctx.save(); ctx.lineCap='round';
  for(const s of [-1,1]){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=8; ctx.beginPath(); if(horiz){ ctx.moveTo(x-W2/2,y+s*12); ctx.lineTo(x+W2/2,y-s*12); } else { ctx.moveTo(x+s*12,y-H2/2); ctx.lineTo(x-s*12,y+H2/2); } ctx.stroke(); ctx.strokeStyle='#a88ae8'; ctx.lineWidth=5; ctx.setLineDash([8,4]); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore(); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y,40,'180,140,255',0.18+0.08*Math.sin(t*3)); ctx.restore();
  if(o.lockG&&!o.lockG.done){ const L=o.lockG; ctx.strokeStyle=`rgba(190,160,250,${0.25+0.15*Math.sin(t*4)})`; ctx.lineWidth=2; ctx.setLineDash([5,7]); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(L.x,L.y-20); ctx.stroke(); ctx.setLineDash([]); }
}
// the cave floor live layer: broken pound cracks, snow drifts, the tiles that are up over their pits
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){ base.apply(this,arguments); if(A&&A.p3) p3CaveFloor(A,t); }; }
function p3CaveFloor(A,t){
  const C=A.p3, c=A.cave, cs=c.cell;
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1), j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  for(const [k,v] of C.crk){ if(v!==2) continue; const i=k%c.w, j=(k-i)/c.w; if(i<i0||i>i1||j<j0||j>j1) continue; if(C.cover.has(k)) continue; const x=A.x0+i*cs, y=A.y0+j*cs; ctx.fillStyle='#07060a'; ctx.fillRect(x,y,cs,cs); const up=k-c.w; if(c.typ[up]!==P3T.crack||C.crk.get(up)!==2){ ctx.fillStyle='rgba(120,100,90,.85)'; ctx.fillRect(x,y,cs,7); ctx.fillStyle='rgba(255,240,210,.15)'; ctx.fillRect(x,y,cs,2); } }
  for(const [k,v] of C.drift){ const i=k%c.w, j=(k-i)/c.w; if(i<i0||i>i1||j<j0||j>j1) continue; const x=A.x0+(i+0.5)*cs, y=A.y0+(j+0.5)*cs;
    if(v<0){ ctx.fillStyle='rgba(120,170,220,.22)'; ctx.beginPath(); ctx.ellipse(x,y,cs*0.42,cs*0.3,0,0,TAU); ctx.fill(); continue; }
    const k2=clamp(v/p3Need(P3N.drift),0,1), s=1-k2*0.5; ctx.fillStyle='rgba(59,34,51,.35)'; ctx.beginPath(); ctx.ellipse(x+2,y+6,cs*0.56*s,cs*0.36*s,0,0,TAU); ctx.fill();
    for(const [dx,dy,r] of [[-10,4,15],[10,6,14],[0,-4,17],[-14,-8,9],[14,-6,10]]){ ctx.fillStyle='#e6eef8'; ctx.beginPath(); ctx.arc(x+dx*s,y+dy*s,r*s,0,TAU); ctx.fill(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(x+dx*s-r*0.25*s,y+dy*s-r*0.3*s,r*0.55*s,0,TAU); ctx.fill(); } }
  for(const o of C.lights){ if(!o.up||!o.cells.length) continue; for(const k of o.cells){ const i=k%c.w, j=(k-i)/c.w; if(i<i0||i>i1||j<j0||j>j1) continue; const x=A.x0+i*cs, y=A.y0+j*cs; ctx.fillStyle='#8a8070'; ctx.fillRect(x,y,cs,cs); ctx.fillStyle='#a69a86'; ctx.fillRect(x+2,y+2,cs-4,cs*0.35); ctx.strokeStyle='rgba(40,30,30,.45)'; ctx.lineWidth=1.5; ctx.strokeRect(x+0.5,y+0.5,cs-1,cs-1); } }
}
// pound cracks baked into the cave picture: a wide star of cracks with a ram's horn glyph (so they read apart from %)
{ const base=trialPaintCell; trialPaintCell=function(g,c,k,i,j,x,y,cs,st,rng,def){
    const t=c.typ[k];
    if(t===P3T.crack||t===P3T.drift){ dunTile(g,x,y,cs,st,i,j,rng,t===P3T.crack?-0.08:0.05);
      if(t===P3T.crack){ g.strokeStyle='rgba(0,0,0,.62)'; g.lineWidth=2.2; g.beginPath(); const cx=x+cs/2, cy=y+cs/2; for(let a=0;a<6;a++){ const an=a*1.05+rng()*0.3; g.moveTo(cx,cy); const mx=cx+Math.cos(an)*cs*0.3, my=cy+Math.sin(an)*cs*0.3; g.lineTo(mx,my); g.lineTo(mx+Math.cos(an+0.5)*cs*0.22,my+Math.sin(an+0.5)*cs*0.22); } g.stroke(); g.strokeStyle='rgba(255,230,190,.16)'; g.lineWidth=1; g.stroke();
        g.strokeStyle='rgba(255,214,140,.35)'; g.lineWidth=2; g.beginPath(); g.arc(cx-6,cy,5,-0.4,2.4); g.moveTo(cx+11,cy); g.arc(cx+6,cy,5,0.7,Math.PI+0.4,true); g.stroke(); }
      return true; }
    return base.apply(this,arguments); }; }

// ---------- 11. the moment Ash gets one of the three powers
{ const base=grantAbility; grantAbility=function(id){
  const had=!!(G&&G.abil&&G.abil[id]); base(id);
  if(had||!player||(id!=='blaze'&&id!=='windride'&&id!=='pound')) return;
  const p=player;
  if(id==='blaze'){ for(let i=0;i<34;i++){ const a=rand(0,TAU); G.particles.length<950&&G.particles.push({x:p.x+Math.cos(a)*8,y:p.y-20+Math.sin(a)*8,vx:Math.cos(a)*rand(60,200),vy:Math.sin(a)*rand(60,200)-60,life:0.7,max:0.7,size:rand(3,6),grow:12,drag:2,kind:'bfire',col:'190,235,255',glow:true,rise:20,al:1}); } p3Snd('blue'); P3.bz.flash=0.45; }
  if(id==='windride'){ for(let i=0;i<30;i++){ const a=i/30*TAU; emit(p.x+Math.cos(a)*30,p.y-20+Math.sin(a)*16,1,{col:'240,248,255',glow:false,ang:a+1.7,spread:0.1,smin:80,smax:160,lmin:.4,lmax:.8,zmin:1.5,zmax:2.6,drag:2,alpha:0.8}); } p3Snd('wind'); }
  if(id==='pound'){ P3.waves.push({x:p.x,y:p.y,r:14,max:150,t:0}); p3Snd('pound'); shake(6); }
}; }

// ---------- 12. the powers' names, how-to and tips (the Powers page, the banners), with the controls of the device in use
defineAbility('blaze',{act:3,icon:'a_blaze',name:'Blaze Breath',short:'Blaze',skill:'blaze2',
  how:c=>S(`Hold fire breath (${c.fire}). After a moment the flame turns blue and shoots out far: that is Blaze. It melts ice walls, frost locks and ice domes, thaws frozen people, lights far braziers and sets off bombs at once. Icy foes hate it.`,`Hold ${c.fire}. The fire turns blue and goes far. It melts ice!`),
  tip:c=>S(`Keep holding ${c.fire} until the ring at your mouth fills and the fire turns blue. Normal fire only makes ice sweat.`,`Hold ${c.fire} until the fire turns blue.`),
  banner:c=>S(`Hold ${c.fire} and your fire turns blue-hot. Melt the ice!`,`Hold ${c.fire} for blue fire!`),
  plain:S('Hold your fire breath until it turns blue. Blue fire melts ice!','Hold fire. Blue fire melts ice!')});
defineAbility('windride',{act:3,icon:'a_windride',name:'Wind Riding',short:'Wind Riding',skill:'wind2',
  how:c=>S(`Jump or fly into a stream of wind and it carries you along, even high up and over no-fly places. Steer a little left and right. Press ${c.jump} to hop to another stream nearby, or to hop off. Updrafts lift you up.`,`Jump into the wind. It carries you! ${c.jump} hops off.`),
  tip:c=>S(`Look for glowing ribbons of wind. Jump into the swirl at the start, or fly into one. Your wings rest while you ride.`,`Jump into the swirl to ride the wind.`),
  banner:c=>S(`Jump into a ribbon of wind and let it carry you!`,`Jump into the wind!`),
  plain:S('Jump into a ribbon of wind and it carries you!','Ride the wind!')});
defineAbility('pound',{act:3,icon:'slam',name:'Ground Pound',short:'Pound',skill:'pound2',
  how:c=>S(`Jump, then press ${c.attack} in the air to slam down hard. The shockwave stuns foes and knocks their shields off. Pound cracked floors to break through, pound switches and rune plates, drums and seesaws. From flying, ${c.attack} drops you into a pound too.`,`Jump, then ${c.attack} in the air. SLAM! It breaks cracks.`),
  tip:c=>S(`Jump, then press ${c.attack} in the air. Big cracked floors, heavy switches and drums only answer a Ground Pound.`,`Jump, then ${c.attack}. Pound the cracks!`),
  banner:c=>S(`Jump, then ${c.attack} in the air: GROUND POUND!`,`Jump, then ${c.attack}: POUND!`),
  plain:S('Jump, then attack in the air to slam down!','Jump, then attack. SLAM!')});

// ---------- 13. a sandbox (__eb.p3Test) and debug hooks
// The Frost Lab: a small test dungeon with every dungeon piece of the three powers (no door leads to it).
const P3_LAB={
  a:{tpl:['...............','...............','...X...........','...............','...............','...............','...............','...............','..d............','...........s...','...............'],
     frost:['...............','..iii.....k....','..i.i..........','..iii...F......','...............','.......nnn.....','.......nnn.....','...............','..O............','...............','...............']},
  b:{tpl:['...............','::::::::::::...','::::::::::::...','::::::::::::...','::::::::::::...','::::::::::::...','::::::::::::...','...............','...............','..s.........X..','...............'],
     frost:['...............','..Z.....Z......','...............','...............','...............','...............','...............','...............','...............','...............','...............']},
  c:{tpl:['...............',':::::::::::::::',':::.::::::.::::',':::::::::::::::','...............','...............','...............','...............','...............','.s.............','...............'],
     frost:['...............','...............','...W......W....','...............','...............','...............','.......U.......','............Q..','...............','...............','...............']},
  d:{tpl:['...............','...............','...............','...............','...............','...............','......BP.......','...............','...............','...............','.s.............'],
     frost:['...............','..........y....','..........y....','..........y....','...............','...............','....D..........','..........z....','.........Pz....','..rK......z.xx.','............xx.']},
  e:{tpl:['...............','...ooooooooo...','...o.oo.oo.o...','...ooooooooo...','...ooooooooo...','...o.oo.oo.o...','...ooooooooo...','...............','...............','.s.............','...............'],
     frost:['...............','...............','....l..L..l....','...............','...............','....L..L..L....','...............','...............','...............','...............','...............']},
  f:{tpl:['.===...........','.===.......P...','.=/=...........','...............','...............','...............','...............','...............','.........B.....','.s.............','...............'],
     frost:['...............','...............','...............','...............','....S.k........','...............','...............','...............','.......S.......','...............','...............']},
  g:{tpl:['...............','...............','...............','...............','...............','...............','.......<.......','...............','...............','.s.............','...............']}
};
defineDungeon('p3_lab',{name:S('The Frost Lab','The Frost Lab'),level:13,theme:'ice',seed:303,save:'p3_lab',noJuniper:true,giftOK:{},dark:0.25,
  dunKind:S('A test cave','A test cave'),
  story:{in:[['ash',S('A cave for practicing the powers of the north. It is cold in here. Obviously.','A cave to practice my winter powers!')]]},
  floors:[
    {id:'1',name:S('The Frost Lab','The Frost Lab'),map:{rooms:{
      a:{at:[1,2],kind:'start',tpl:P3_LAB.a.tpl,frost:P3_LAB.a.frost,loot:['treasure','dmap'],noPots:true,noDecor:true,
         frozen:{'8,3':{name:S('Hjalmar the explorer','Hjalmar'),look:{skin:'#e8bc98',hair:'#c89a5a',hairdo:'short',outfit:'coat',shirt:'#5a7aa8',low:'#3a3a4a',hat:'beanie',hatc:'#c84a3a'},line:S('...ACHOO! Oh. Excuse me. How long was I mid-sneeze?','ACHOO! How long was I frozen?'),coins:40,leave:true}},
         sign:S('Blaze: hold fire breath until it turns blue. Melt the ice, thaw the explorer, clear the snow, free the chest from the dome.','Hold fire. Blue fire melts ice!')},
      b:{at:[0,1],kind:'braziers',tpl:P3_LAB.b.tpl,frost:P3_LAB.b.frost,loot:['treasure'],iceChests:true,noPots:true,noDecor:true,sign:S('Far braziers: only blue fire reaches them. Or a fire arrow.','Blue fire reaches far braziers.')},
      c:{at:[1,1],kind:'bells',timed:40,tpl:P3_LAB.c.tpl,frost:P3_LAB.c.frost,noPots:true,noDecor:true,
         ribbons:[{pts:[[3,7],[3,4],[3,0]]},{pts:[[11,7],[11,4],[11,0]],vane:'v1',dir:'n'},{pts:[[7,6],[7,3],[7,0]],any:true}],
         vanes:{'12,7':{id:'v1',dir:'w'}},bells:{'3,2':{name:'west'},'10,2':{name:'east'}},
         sign:S('Wind Riding: jump into a swirl. Ring both bells. Hit the vane to turn the east wind on. The updraft lifts you.','Jump into the wind. Ring both bells!')},
      d:{at:[2,1],kind:'drum',tpl:P3_LAB.d.tpl,frost:P3_LAB.d.frost,noPots:true,noDecor:true,
         sign:S('Ground Pound: pound the drum to push the block, the switch to swap the pillars, the rune plate then blue fire on the lock, and the cracks to fall through.','Jump, then attack in the air. POUND!')},
      e:{at:[2,0],kind:'lightsout',lightsPitch:3,lightsTile:1,tpl:P3_LAB.e.tpl,frost:P3_LAB.e.frost,noPots:true,noDecor:true,sign:S('Pound a tile: it flips with its neighbours. Make every pen floor come up.','Pound tiles. Make all floors come up.')},
      f:{at:[1,0],kind:'blocks',tpl:P3_LAB.f.tpl,frost:P3_LAB.f.frost,noPots:true,noDecor:true,
         seesaws:{'7,8':{dir:'e',len:4,toB:[11,1]},'4,4':{dir:'e',len:4,toA:[2,1]}},icicles:{'6,4':{blaze:'drop'}},
         sign:S('Seesaws: pound one end and the other end flies. Stand on an end, then blue-fire the icicle over the other end: it drops.','Pound one end. The other end flies!')}},
      links:[['a','c','ice'],['c','b','open'],['c','d','open'],['d','e','chain'],['c','f','open']]}},
    {id:'2',name:S('The Frost Lab Cellar','The Cellar'),map:{rooms:{g:{at:[2,1],kind:'free',tpl:P3_LAB.g.tpl,sign:S('You fell through the cracks. The stairs go back up.','The stairs go back up.'),noPots:true}},links:[]}}
  ]});
// the outdoor sandbox, on map 2 (Frostreach), built the first time it is asked for
const P3_SB={x:12900,y:50100,built:false};
function p3SandboxOut(){
  const S0=P3_SB, x=S0.x, y=S0.y; if(S0.built) return S0; S0.built=true;
  ELEV.clear({rect:[x-1150,y-760,x+950,y+760]});
  ELEV.plateau({rect:[x+380,y-560,x+760,y-330],lvl:2,style:'ice',noise:6,id:'p3sb_isle'});
  ELEV.plateau({rect:[x-860,y-260,x-560,y-120],lvl:1,style:'rock',noise:4,id:'p3sb_ledge'});
  ELEV.noFly({rect:[x-470,y-240,x-130,y+40],why:S('The test winds are too strong to fly here.','Too windy!')});
  WIND.stream({id:'p3sb_s1',pts:[[x-720,y+300],[x-320,y-80],[x+120,y-260],[x+480,y-430]],lv:[0,2]});
  WIND.stream({id:'p3sb_s2',pts:[[x+660,y-420],[x+700,y-120],[x+620,y+180]],lv:[2,0],both:true});
  WIND.stream({id:'p3sb_s3',pts:[[x-200,y+180],[x-60,y-60],[x+140,y+60]],lv:[0,0],any:true});
  p3Add('wbell',{id:'p3sb_bell',x:x-515,y:y+155,h:70});
  p3Add('drum',{id:'p3sb_drum',x:x-700,y:y+20});
  p3Add('icewall',{id:'p3sb_ice',x:x-920,y:y+120,w:130,h:40});
  p3Add('icewall',{id:'p3sb_fall',x:x-1000,y:y-540,w:110,h:36,style:'fall',regrow:20});
  p3Add('frozen',{id:'p3sb_frz',x:x-640,y:y-420,name:S('Fergus the mitten seller','Fergus'),look:{skin:'#e8bc98',hair:'#8a5a2a',hairdo:'short',outfit:'coat',shirt:'#c84a3a',low:'#3a3a4a',hat:'beanie',hatc:'#3a6aaa'},line:S('...MITTENS! Get your mittens! Why is it so quiet?','MITTENS! Why so quiet?'),coins:20,after:S('Mittens! Warm mittens! You look like you need ten pairs.','Mittens! Want some?')});
  p3Add('frostlock',{id:'p3sb_lock1',x:x-300,y:y+430,h:30,col:{x0:x-360,y0:y+410,x1:x-240,y1:y+440}});
  p3Add('frostlock',{id:'p3sb_lock2',x:x-100,y:y+440,h:30,dome:true});
  p3Add('rplate',{id:'p3sb_lplate',x:x-30,y:y+500,lock:'p3sb_lock2'});
  p3Add('rplate',{id:'p3sb_plate',x:x-520,y:y+450});
  p3Add('fbraz',{id:'p3sb_fbraz',x:x+300,y:y+320,h:70});
  p3Add('icicle',{id:'p3sb_icl',x:x+100,y:y+160,h:90});
  p3Add('seesaw',{id:'p3sb_see',x:x+150,y:y+260,dir:'e',len:200,toB:{x:x+500,y:y+110},toA:{x:x-60,y:y+60}});
  p3Add('icicle',{id:'p3sb_icl2',x:x+250,y:y+262,h:96,regrow:6});
  p3Add('icedome',{id:'p3sb_dome',x:x+520,y:y+470,r:30});
  p3Add('lid',{id:'p3sb_lid',x:x+700,y:y+320,r:36});
  p3Add('crackfloor',{id:'p3sb_crack',x:x+760,y:y-60,r:60,to:{area:'p3_lab'}});
  p3Add('crackfloor',{id:'p3sb_crack2',x:x+120,y:y+560,r:50,below:{x:x+120,y:y+690}});
  p3Add('rock',{id:'p3sb_rock',x:x-60,y:y+60});
  return S0;
}
function p3LabCell(room,c,r){ const A=AREA; if(!A||!A.rooms||!A.rooms[room]) return null; const R=A.rooms[room], cs=A.cave.cell; return {x:A.x0+(R.ox+1+c+0.5)*cs,y:A.y0+(R.oy+1+r+0.5)*cs}; }
function p3Grant(id){ const ids=id==='all'||!id?['blaze','windride','pound']:[id]; for(const k of ids) grantAbility(k); return ids; }
function p3Test(kind){
  for(const id of ['jump','dbljump','stride','wings','blaze','windride','pound']) if(!hasAbil(id)){ G.abil=G.abil||{}; G.abil[id]=true; }
  G.flags.forge=true; for(const k of ['blue','ride']) P3.tips[k]=9;
  kind=kind||'cave';
  if(kind==='out'){ if(AREA) exitArea(true); const S0=p3SandboxOut(); G.mapsSeen=G.mapsSeen||{}; G.mapsSeen[2]=true; player.x=S0.x-300; player.y=S0.y+300; moveReset(player); updateCam(0,true);
    for(const e of G.enemies) if(!e.dead&&!e.inArea&&Math.abs(e.x-S0.x)<1400&&Math.abs(e.y-S0.y)<1000){ e.dead=true; }
    return {x:S0.x,y:S0.y}; }
  const room=kind==='cave'?'a':kind; dunGo('p3_lab',room); return {area:AREA&&AREA.id,room};
}
function p3State(){ const p=player, R=P3.ride, M=P3.mv, B=P3.bz; return {x:Math.round(p.x),y:Math.round(p.y),z:+(p.z||0).toFixed(1),flying:!!p.flying,gliding:!!p.gliding,slam:!!p.slam,lvl:p3Lvl(p.x,p.y),ceil:p.elvCeil,
  ride:R?{id:R.o.id,s:Math.round(R.s),L:Math.round(R.o.L),dir:R.dir,off:Math.round(R.off)}:null,mv:M?M.kind:null,hold:+B.hold.toFixed(2),blue:!!B.blue,jet:P3.jet?{L:Math.round(P3.jet.L),ang:+P3.jet.ang.toFixed(2)}:null,breathing:!!p.breathing,energy:Math.round(p.energy),flyE:+(p.flyE||0).toFixed(2),tail:+P3.tail.toFixed(2)}; }
function p3ObjList(){ return p3Things().map(o=>({id:o.id,k:o.p3,x:Math.round(o.x),y:Math.round(o.y),done:!!o.done,st:o.st,lit:o.lit,heat:+(o.heat||0).toFixed(2),crack:o.crack!=null?+o.crack.toFixed(1):undefined,tilt:o.tilt,n:o.n})); }
function p3GateList(){ const A=AREA; if(!A||!A.p3) return null; return {gates:A.p3.gates.map(o=>({id:o.id,g:o.g,room:o.room,closed:o.closed,melted:o.melted,done:o.done,crack:o.crack,heat:+(o.heat||0).toFixed(2)})),doors:A.p3.doors.map(o=>({id:o.id,type:o.type,opened:!!o.opened,closed:o.closed,lock:o.lockG?o.lockG.id:null})),
  crk:[...A.p3.crk].filter(q=>q[1]===2).length,drift:[...A.p3.drift].map(q=>q[1]),lights:A.p3.lights.map(o=>o.up),vanes:A.p3.vanes.map(o=>o.dir),ribbons:A.p3.ribbons.map(o=>({id:o.id,on:p3StreamOn(o)})),drum:Object.fromEntries(Object.entries(A.rooms).map(([k,R])=>[k,R.p3drum|0]))}; }
window.__ebX=Object.assign(window.__ebX||{},{
  p3Test, p3Grant, p3Add, p3On, p3OnPound, p3Refreeze, WIND, P3, P3N, P3K,
  p3:{ state:p3State, objs:p3ObjList, gates:p3GateList, cell:p3LabCell, sandbox:p3SandboxOut, SB:P3_SB,
    go:(x,y)=>{ if(AREA) exitArea(true); player.x=x; player.y=y; moveReset(player); updateCam(0,true); return {x,y}; },
    streams:()=>p3StreamsHere().map(o=>({id:o.id,on:p3StreamOn(o),L:Math.round(o.L),pts:o.pts.map(q=>[Math.round(q[0]),Math.round(q[1])]),lv:o.lv})),
    jetHits:(x,y,r)=>p3JetHits(x,y,r||0), warm:()=>p3WarmT(), jetLen:()=>p3JetLen(), poundR:()=>p3PoundR(),
    frozen:()=>P3.out.filter(o=>o.p3==='frozen').map(o=>({id:o.id,who:o.who||null,st:o.st,flag:p3FrozenFlag(o),thawed:p3Thawed(o)})),
    room:id=>{ const R=AREA&&AREA.rooms&&AREA.rooms[id]; return R?{solved:!!R.solved,kind:R.kind,drum:R.p3drum|0}:null; } }
});
