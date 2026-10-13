// ================= p4_moon: the three Act IV powers (v9, wave 1b)
//   Dive (dive)          ROLL on deep water (outdoors: lakes, sea, rivers; dungeons: `w` and the flooded `≈` cells) or in a
//                        shadow pool: Ash swims under. Underwater he passes under arches (outdoor `arch`, dungeon `∩`) and
//                        grates, presses underwater switches, opens underwater chests, breathes from bubbles and air
//                        pockets (the AIR meter), and linked pools carry him to their twin. ROLL again (or no air) surfaces.
//                        With Dive, deep water that blocks Water Stride (the open sea) can be swum at the surface.
//   Burrow (burrow)      ROLL on sand (terrain `o.sand`, dungeon `∴`): Ash digs in and moves as a mound, under sand walls,
//                        fences, foes and storms, safe from most hits. ROLL again pops him out with an uppercut that
//                        knocks foes up. Buried switches and chests open only for a burrower.
//   Moonfire (moonfire)  a breath mode (O, the fire trigger plus its bumper, or the moon chip on the breath meter):
//                        silver fire lights moonstones, burns shadow tendrils for good, makes moon-glass solid for a
//                        while, reveals moth glyphs and moon doors, melts ink shields; it works underwater.
// World objects outdoors: p4Add(kind,{...}) (a LANDMARK). Dungeon cells and marks come from template letters (section 4).
// The guide for map and dungeon helpers is scratchpad/POWERS4.md. Everything extends the engine by wrapping.

// ---------- 0. numbers, gates and state
const P4N={air:12,airEasy:1.5,airK:0.35,dolphin:1.5,refill:7,swimK:0.8,deep:0.5,plungeT:0.34,riseT:0.26,poolIn:0.26,poolGo:0.6,poolOut:0.3,drown:0.1,
  bmeter:6,worm:2,bmEasy:1.5,burK:1.3,burSk:0.25,digT:0.3,popR:68,popDmg:1.5,popStun:1.0,popKb:170,
  glass:6,lantern:2,moonK:0.25,stone:15,mfR:175,mfHalf:0.45,mfDps:4.6,inkT:5,inkNeed:0.3,tendHold:1.2,shrink:4,tendNeed:0.6,glyph:20,doorNeed:0.5,stoneNeed:0.3,
  sinkT:1.5,sinkDmg:0.1,plate:20,bubbleR:30,brazReach:3};
const P4={g:null,area:null,out:[],arch:[],gaps:[],beds:[],glass:[],stones:[],ramps:[],plates:[],mode:null,mv:null,air:12,bm:6,swim:false,tips:{},t:0,
  arcs:[],arcsNext:[],beams:[],beamsNext:[],sinkT:0,sinkOn:false,safe:null,grabCd:0,padSwap:false,touchSwap:false,lx:null,ly:null,idleT:0,force:false,bubT:0,
  swT:0,lastFire:false,moonTip:0,onRamp:null,wasGlass:false,saySpot:null,wake:[],from:null,inp:null,diveT:0,autoDive:false};
const P4T={full:60,arch:61,sand:62,packed:63,seam:64,qs:65,qsd:66,glass:67,tend:68,mwall:69};
const p4Story=()=>!!G&&G.mode==='story';
function canDive(){ return p4Story()&&hasAbil('dive'); }
function canBurrow(){ return p4Story()&&hasAbil('burrow'); }
function canMoon(){ return p4Story()&&hasAbil('moonfire'); }
function p4Busy(){ return !!(P4.mode||P4.mv); }
function p4Diving(){ return P4.mode==='dive'; }
function p4Burrowed(){ return P4.mode==='burrow'; }
function p4Swimming(){ return !!P4.swim&&!P4.mode; }
function p4MoonOn(){ return canMoon()&&!!(G.flags&&G.flags.p4mf); }
const p4Easy=()=>!!(G&&G.diff&&G.diff.name==='Easy');
function p4AirMax(){ let a=P4N.air*(1+P4N.airK*hasSkill('dive2')); if(G&&G.flags&&G.flags.m_dolphin) a*=P4N.dolphin; if(p4Easy()) a*=P4N.airEasy; return a; }
function p4BurMax(){ let m=P4N.bmeter*(G&&G.flags&&G.flags.m_wormtunnel?P4N.worm:1); if(p4Easy()) m*=P4N.bmEasy; return m; }
function p4GlassDur(){ return P4N.glass*(G&&G.flags&&G.flags.m_moonlantern?P4N.lantern:1)*(1+P4N.moonK*hasSkill('moon2')); }
function p4StoneDur(o){ return ((o&&o.dur)||P4N.stone)*(1+P4N.moonK*hasSkill('moon2')); }
function p4BurSpd(){ return P4N.burK*(1+P4N.burSk*hasSkill('burrow2')); }
// a tip the first few times (Settings > Tips: Off keeps them away; the log still has them)
function p4Tip(id,title,text,n){ const c=P4.tips[id]||0; if(c>=(n||1)) return; P4.tips[id]=c+1; try{ mvTip(title,text,7,'p4_'+id); }catch(e){} }
function p4Say(x,y,text,col,id,gap){ const k='say_'+(id||text); if(P4.tips[k]!=null&&G.time-P4.tips[k]<(gap||3)) return; P4.tips[k]=G.time; ftext(x,y,text,col||'#e6f0ff',13); }
const p4Ctl=()=>{ try{ return balCtls(); }catch(e){ return {jump:'C',attack:'J',roll:'Space',fire:'K',use:'E',sprint:'Shift'}; } };
// the Moonfire swap control on the device in use
function p4MoonKey(){
  try{ if(padActive()) return padBtnName(padSw(PB.L2))+' + '+padBtnName(padSw(PB.L1)); if(touchy()) return S('the moon on your fire meter','the moon by your fire bar'); }catch(e){}
  return 'O';
}

// ---------- 1. sounds (synthesized, like the other power modules)
function p4Snd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted||!SFX.noise) return;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.42*(v==null?1:v); out.connect(ac.destination);
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.01,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(kind){
      case 'plunge': nz(0.5,0.3,'lowpass',2400,200,0.6); for(let i=0;i<5;i++) tn('sine',300+i*120,700+i*160,0.07,0.03,0.12+i*0.05); break;
      case 'rise': nz(0.32,0.22,'bandpass',600,2600,1.2); tn('sine',420,880,0.12,0.035,0.05); break;
      case 'bubble': for(let i=0;i<3;i++) tn('sine',500+Math.random()*500,900+Math.random()*700,0.05,0.025,i*0.06); break;
      case 'glub': tn('sine',260,620,0.14,0.05); tn('sine',380,780,0.1,0.04,0.09); break;
      case 'gasp': nz(0.28,0.2,'bandpass',900,2200,1.4); tn('triangle',520,340,0.2,0.03); break;
      case 'dig': nz(0.36,0.26,'bandpass',500,180,0.8); nz(0.22,0.12,'highpass',2400,1600,0.7,0.05); break;
      case 'pop': nz(0.3,0.3,'lowpass',1400,120,0.7); tn('sine',150,70,0.24,0.12); nz(0.18,0.12,'highpass',2600,1800,0.8,0.04); break;
      case 'moon': nz(0.3,0.06,'highpass',4200,7000,0.6); for(let i=0;i<3;i++) tn('sine',880*(1+i*0.5),880*(1+i*0.5),0.4,0.02,i*0.05); break;
      case 'swapf': tn('triangle',420,300,0.18,0.04); nz(0.18,0.08,'bandpass',800,400,1.2); break;
      case 'stone': [988,1319,1568].forEach((f,i)=>tn('sine',f,f,0.6,0.04,i*0.07)); nz(0.4,0.04,'highpass',5000,7000,0.5); break;
      case 'burn': nz(0.5,0.16,'highpass',2600,5200,0.6); tn('sine',300,120,0.4,0.03); break;
      case 'pool': nz(0.6,0.2,'bandpass',300,90,0.7); tn('sine',180,90,0.5,0.06); break;
      case 'sink': nz(0.6,0.18,'lowpass',700,90,0.6); tn('sine',200,90,0.5,0.05); break;
      case 'click': tn('square',700,520,0.06,0.03); nz(0.08,0.1,'bandpass',1200,800,2); break;
      case 'grab': nz(0.4,0.14,'bandpass',300,700,2); tn('sawtooth',110,80,0.3,0.02); break;
    }
  }catch(e){}
}

// ---------- 2. where things are: deep water, the surface, sand (outdoors and in dungeons)
const P4S={};
function p4ZBlock(x,y){ if(y<BAND) return false; const M=MAPS[mapAt(y)]; if(!M) return true; const Z=M.tz||tzOf(M); return !!(Z.block&&Z.block(x,y)); }
function p4InRect(o,x,y){ return x>=o.x0&&x<=o.x1&&y>=o.y0&&y<=o.y1; }
function p4InShape(o,x,y){ if(o.pts){ if(x<o.bb[0]||x>o.bb[2]||y<o.bb[1]||y>o.bb[3]) return false; return p4PolyD(o.pts,x,y)<o.w/2; } if(o.r!=null&&o.x0==null) return dist2(x,y,o.x,o.y)<o.r*o.r; return p4InRect(o,x,y); }
function p4PolyD(pts,x,y){ let best=1e9; for(let i=1;i<pts.length;i++){ const a=pts[i-1], b=pts[i]; const d=segD(x,y,a[0],a[1],b[0],b[1]); if(d<best) best=d; } return best; }
const p4On=o=>!o.on||!!o.on(o);
function p4ArchAt(x,y){ for(const o of P4.arch) if(p4InRect(o,x,y)&&p4On(o)) return o; return null; }
function p4GapAt(x,y){ for(const o of P4.gaps) if(p4InRect(o,x,y)&&p4On(o)) return o; return null; }
function p4BedAt(x,y){ for(const o of P4.beds) if(p4InShape(o,x,y)) return o; return null; }
function p4PlateAt(x,y){ for(const q of P4.plates) if(q.t>0&&dist2(x,y,q.x,q.y)<q.r*q.r) return q; return null; }
// deep water Ash can dive in (and swim under)
function p4DeepAt(x,y){
  if(x>=IZX-50){ if(!AREA||!AREA.cave) return false; const k=tCell(x,y); return k>=0&&p4CaveDeep(k); }
  if(outOfMap(x,y,30)) return false;
  if(P4.arch.length&&p4ArchAt(x,y)) return true;
  if(p4ZBlock(x,y)) return false;
  P4S.sink=0; const s=T(x,y,P4S); if(s.face&EF.FACE) return false; if(!s.water||s.lava||s.lavaS>0.5) return false;
  return !!(s.sea||s.deep||s.depth>=P4N.deep);
}
// water Ash can float on with Dive (no Water Stride needed; the deep sea too)
function p4SwimAt(x,y){
  if(x>=IZX-50||outOfMap(x,y,30)||p4ZBlock(x,y)) return false;
  P4S.sink=0; const s=T(x,y,P4S); if(s.face&EF.FACE) return false; return !!s.water&&!s.lava&&!(s.lavaS>0.5);
}
// sand Ash can burrow in
function p4SandAt(x,y){
  if(x>=IZX-50){ if(!AREA||!AREA.cave) return false; const k=tCell(x,y); return k>=0&&p4CaveSand(k); }
  if(outOfMap(x,y,30)) return false;
  if(P4.gaps.length&&p4GapAt(x,y)) return true;
  if(p4ZBlock(x,y)) return false;
  if(P4.plates.length&&p4PlateAt(x,y)) return false;
  if(P4.beds.length&&p4BedAt(x,y)) return true;
  P4S.sink=0; const s=T(x,y,P4S); if(s.face&EF.FACE) return false; if(s.water||s.bridge) return false;
  return s.sand>0.5||s.sink>0.5;
}
// quicksand underfoot: 0 none, 1 quicksand, 2 deep quicksand
function p4SinkAt(x,y){
  if(x>=IZX-50){ if(!AREA||!AREA.cave) return 0; const k=tCell(x,y); if(k<0) return 0; const t=AREA.cave.typ[k]; if(t!==P4T.qs&&t!==P4T.qsd) return 0; if(AREA.p4&&AREA.p4.plate&&AREA.p4.plate.get(k)>0) return 0; return t===P4T.qsd?2:1; }
  if(outOfMap(x,y,30)||y<BAND) return 0;
  if(P4.plates.length&&p4PlateAt(x,y)) return 0;
  P4S.sink=0; P4S.sinkDeep=0; const s=T(x,y,P4S); if(s.water) return 0; return s.sink>0.5?(s.sinkDeep>0.5?2:1):0;
}
function p4CaveDeep(k){ const A=AREA, c=A.cave, t=c.typ[k]; if(t===P4T.full||t===P4T.arch) return true; if(c.grid[k]===1) return false; return tWet(k); }
function p4CaveSand(k){ const t=AREA.cave.typ[k]; if(t===P4T.packed) return !!(G&&G.flags&&G.flags.m_wormtunnel); if(t===P4T.qs||t===P4T.qsd){ const P=AREA.p4; return !(P&&P.plate&&P.plate.get(k)>0); } return t===P4T.sand||t===P4T.seam; }
const p4UnderOK=(x,y)=>p4DeepAt(x,y);
// can Ash come up for air here (not under an arch, a grate or a flooded ceiling)
function p4CanSurface(x,y){
  if(x>=IZX-50){ if(!AREA||!AREA.cave) return true; const k=tCell(x,y); if(k<0) return false; const c=AREA.cave, t=c.typ[k]; return !(t===P4T.full||t===P4T.arch||c.grid[k]===1); }
  if(P4.arch.length&&p4ArchAt(x,y)) return false;
  for(const o of mapList(P4.out,curMap())) if(o.p4==='grate'&&p2InRectP4(o,x,y,6)) return false;
  return true;
}
function p2InRectP4(o,x,y,m){ m=m||0; return x>o.x-o.w/2-m&&x<o.x+o.w/2+m&&y>o.y-o.h/2-m&&y<o.y+o.h/2+m; }
// land a surfacing or popping Ash can stand on
function p4StandOK(x,y){
  if(x>=IZX-50){ const A=AREA; if(!A||!A.cave) return !areaBlocked(x,y); const k=tCell(x,y); if(k<0) return false; if(!(tGround(k)||(tWet(k)&&(canWalkWater()||canDive())))) return false; if(caveBlockedAt(k)||A.cave.grid[k]===1) return false; return !colAt(x,y,10); }
  if(outOfMap(x,y,40)) return false;
  if(elevFace(x,y)&EF.FACE) return false;
  if(blockedAt(x,y)&&!(canDive()&&p4SwimAt(x,y))&&!(canWalkWater()&&!lavaSpot(x,y))) return false;
  return !colAt(x,y,10);
}

// ---------- 3. world objects outdoors (and point objects in areas)
// P4K[kind]: init(o,A), tick(o,dt), ground(o,t) (flat, under figures), stand(o,t) (upright, sorted with figures by sy(o)),
// under(o,t) (drawn bright over the water while Ash dives), buried(o,t) (drawn while Ash burrows)
const P4K={};
const P4L={arch:'arch',sandgap:'gaps',sandbed:'beds',moonglass:'glass',moonstone:'stones'};
function p4Add(kind,o,A){
  const K=P4K[kind]; if(!K) throw new Error('p4Add: unknown kind '+kind);
  o.k='p4_'+kind; o.p4=kind;
  if(o.x0!=null){ const a=Math.min(o.x0,o.x1), b=Math.max(o.x0,o.x1), c=Math.min(o.y0,o.y1), d=Math.max(o.y0,o.y1); o.x0=a; o.x1=b; o.y0=c; o.y1=d; if(o.x==null){ o.x=(a+b)/2; o.y=(c+d)/2; } }
  if(o.pts){ const b=[1e9,1e9,-1e9,-1e9]; for(const q of o.pts){ b[0]=Math.min(b[0],q[0]); b[1]=Math.min(b[1],q[1]); b[2]=Math.max(b[2],q[0]); b[3]=Math.max(b[3],q[1]); } o.w=o.w||64; o.bb=[b[0]-o.w,b[1]-o.w,b[2]+o.w,b[3]+o.w]; if(o.x==null){ o.x=(b[0]+b[2])/2; o.y=(b[1]+b[3])/2; } }
  if(!o.id) o.id=`p4_${kind}_${Math.round(o.x)}_${Math.round(o.y)}`;
  if(o.clr==null) o.clr=K.clr||40;
  if(A){ o.inArea=true; A.objs.push(o); (A.p4o||(A.p4o=[])).push(o); if(K.init) K.init(o,A); }
  else{ LANDMARKS.push(o); P4.out.push(o); const L=P4L[kind]; if(L) P4[L].push(o); if(K.init) K.init(o,null); }
  return o;
}
function p4Objs(){ return AREA?(AREA.p4o||[]):mapList(P4.out,curMap()); }
// a collider that switches itself off (colActive reads c.off)
function p4Col(o,A,blocks,shape){
  const c=shape||{t:'r',x0:o.x-o.w/2,y0:o.y-o.h/2,x1:o.x+o.w/2,y1:o.y+o.h/2};
  Object.defineProperty(c,'off',{get(){ return !blocks(o); },configurable:true});
  if(A){ if(A===AREA) addAreaCol(c); else{ addCol(c); A.cols.push(c); } } else addCol(c);
  o.col=c; return c;
}
const p4Found=id=>!!(G&&G.found&&G.found[id]);
P4K.arch={clr:60,ground(o,t){ p4DrawArch(o,t); }};
P4K.grate={init(o,A){ o.w=o.w||96; o.h=o.h||18; p4Col(o,A,()=>!p4Diving()); o.col.p4grate=true; }, ground(o,t){ p4DrawGrate(o,t); }};
P4K.bubbles={init(o){ o.r=o.r||P4N.bubbleR; o.ph=o.ph||0; }, ground(o,t){ p4DrawBubbles(o,t,false); }, under(o,t){ p4DrawBubbles(o,t,true); }};
P4K.uswitch={init(o){ o.r=o.r||18; o.on=!o.timed&&p4Found(o.id); o.left=0; }, ground(o,t){ p4DrawUSwitch(o,t,false); }, under(o,t){ p4DrawUSwitch(o,t,true); }};
P4K.uchest={init(o){ o.r=o.r||20; o.open=p4Found(o.id); }, ground(o,t){ p4DrawUChest(o,t,false); }, under(o,t){ p4DrawUChest(o,t,true); }};
P4K.pool={clr:60,init(o){ o.r=o.r||44; o.kind=o.kind||'shadow'; }, ground(o,t){ p4DrawPool(o,t); }, under(o,t){ if(o.kind==='water') p4DrawPool(o,t); }};
P4K.sandbed={ground(o,t){}};
P4K.sandgap={ground(o,t){ p4DrawGapHint(o,t); }};
P4K.sandwall={init(o,A){ o.w=o.w||120; o.h=o.h||20; o.style=o.style||'fence'; addOrColP4(o,A,{t:'r',x0:o.x-o.w/2,y0:o.y-o.h/2,x1:o.x+o.w/2,y1:o.y+o.h/2,deep:!!o.deep}); }, stand(o,t){ p4DrawSandWall(o,t); }, sy:o=>o.y+o.h/2};
P4K.bchest={init(o){ o.r=o.r||20; o.open=p4Found(o.id); }, ground(o,t){ p4DrawBChest(o,t,false); }, buried(o,t){ p4DrawBChest(o,t,true); }};
P4K.bswitch={init(o){ o.r=o.r||20; o.on=p4Found(o.id); }, ground(o,t){ p4DrawBSwitch(o,t,false); }, buried(o,t){ p4DrawBSwitch(o,t,true); }};
P4K.moonstone={clr:50,init(o,A){ o.lit=0; o.heat=0; o.keepOn=!!o.keep&&p4Found(o.id); o.L={x:o.x,y:o.y-22,r:200,i:0}; if(A) A.lights.push(o.L); else LIGHTS.push(o.L); addOrColP4(o,A,{t:'c',x:o.x,y:o.y,r:14}); },
  stand(o,t){ p4DrawMoonstone(o,t); }, sy:o=>o.y+4};
P4K.moonglass={clr:30,init(o){ o.litT=0; o.keepOn=!!o.keep&&p4Found(o.id); o.shown=!o.hidden||p4Found(o.id+'_seen'); }, ground(o,t){ p4DrawMoonGlass(o,t); }};
P4K.glyph={clr:20,init(o){ o.r=o.r||18; o.revT=0; o.seen=p4Found(o.id); o.vis=o.keep&&o.seen?1:0; }, ground(o,t){ p4DrawGlyph(o,t); }};
P4K.moondoor={clr:50,init(o,A){ o.w=o.w||90; o.h=o.h||40; o.style=o.style||'rock'; o.open=p4Found(o.id); o.heat=0; o.oa=o.open?1:0; p4Col(o,A,q=>!q.open); }, stand(o,t){ p4DrawMoonDoor(o,t); }, sy:o=>o.y+o.h/2};
P4K.tendril={clr:50,init(o,A){ o.r=o.r||28; o.burnt=p4Found(o.id); o.heat=0; o.shrinkT=0; o.ph=(o.x*0.013+o.y*0.007)%TAU; p4Col(o,A,q=>!q.burnt&&!(q.shrinkT>0),{t:'c',x:o.x,y:o.y,r:o.r*0.8}); },
  ground(o,t){ p4DrawTendrilBase(o,t); }, stand(o,t){ p4DrawTendril(o,t); }, sy:o=>o.y+6};
P4K.rampfx={ground(o,t){ p4DrawRampFx(o,t); }};
function addOrColP4(o,A,c){ if(A){ if(A===AREA) addAreaCol(c); else{ addCol(c); A.cols.push(c); } } else addCol(c); o.col=c; return c; }
// moon ramps: ELEV.ramp({...,moon:true,id}) is solid only while lit by Moonfire (or for good once a moonstone that names it is lit)
{ const base=ELEV.ramp; ELEV.ramp=function(def){ const r=base.call(ELEV,def); if(r&&def&&def.moon){ r.moon=true; r.litT=0; r.id=def.id||('mramp'+P4.ramps.length); r.k3=mapAt((r.y0+r.y1)/2); P4.ramps.push(r); p4Add('rampfx',{x:(r.x0+r.x1)/2,y:(r.y0+r.y1)/2,ramp:r,id:'p4_rampfx_'+r.id}); } return r; }; }
function p4RampSolid(r){ return r.litT>0||!!r.stoneOn||p4Found('p4r_'+r.id)||P4.onRamp===r; }
function p4RampAt(x,y){ for(const r of P4.ramps) if(x>r.x0&&x<r.x1&&y>r.y0&&y<r.y1) return r; return null; }
function p4RampBlock(x,y){ if(!P4.ramps.length||x>=IZX-50) return false; const r=p4RampAt(x,y); return !!r&&!p4RampSolid(r); }
// moon-glass outdoors: solid while lit, while a moonstone that names it burns, while a moonbeam touches it, or for good
function p4GlassSolid(o){ return o.litT>0||o.keepOn||!!o.stoneOn||!!o.beamOn; }
function p4GlassAt(x,y){ if(!P4.glass.length||x>=IZX-50) return null; for(const o of P4.glass) if(p4InShape(o,x,y)) return o; return null; }
function p4GlassSolidAt(x,y){ if(P4.noGlass) return false; const o=p4GlassAt(x,y); return !!o&&p4GlassSolid(o)&&o.shown; }
// glass plates (Blaze on quicksand): p4GlassPlate(x,y) outdoors or on a dungeon quicksand cell, for P4N.plate seconds
function p4GlassPlate(x,y,r){
  if(x>=IZX-50){ const A=AREA; if(!A||!A.p4) return false; const k=tCell(x,y); if(k<0) return false; const t=A.cave.typ[k]; if(t!==P4T.qs&&t!==P4T.qsd) return false; A.p4.plate.set(k,P4N.plate); emit(x,y,14,{col:'230,240,255',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); return true; }
  const q=P4.plates.find(p=>dist(p.x,p.y,x,y)<20); if(q){ q.t=P4N.plate; return true; }
  P4.plates.push({x,y,r:r||46,t:P4N.plate}); emit(x,y,14,{col:'230,240,255',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); return true;
}
// moonbeams: a lit moonstone with beam:{ang,len} shines one; any module can add one this frame with p4MoonShine
function p4MoonShine(x0,y0,x1,y1,w){ P4.beamsNext.push({x0,y0,x1,y1,w:w||26}); }
function p4BeamAt(x,y,m){ for(const b of P4.beams) if(segD(x,y,b.x0,b.y0,b.x1,b.y1)<b.w/2+(m||0)) return true; return false; }
// did Ash's Moonfire touch the circle (x,y,r) this frame? (for other modules: shades, wax seals, the finale's kit)
function p4MoonHits(x,y,r){ for(const a of P4.arcs) if(inArcC(a.x,a.y,a.ang,a.R,a.half,{x,y,r:r||16})) return true; return false; }
function p4MoonLitAt(x,y,m){ return p4MoonHits(x,y,m||0)||p4BeamAt(x,y,m); }

// ---------- 4. dungeon cells and marks (templates, DUNGEON.md section 5)
//   ≈ flooded water (to the ceiling: only a diving Ash, no air)     ∩ an underwater arch (a wall above, water below)
//   ∴ sand (burrowable floor)   ∷ packed sand (only with the Worm Tunnel)   π a sand seam (a wall with sand under it)
//   ⊙ quicksand (standing still sinks you; a burrower is safe)   ⊚ deep quicksand (swallows burrowers too)
//   ◊ moon-glass (a pit unless lit)   § shadow tendrils (Moonfire burns them for good, fire shrinks them)
//   ▒ a moon wall (a plain wall until Moonfire shows the door in it)
// marks: ° bubble vent   ● shadow pool (pairs)   ☾ moon brazier   ʘ moth glyph   ¤ buried chest   ÷ buried switch
//   X d b H marks in water (two or more water neighbours) are underwater: only a diver opens or presses them
// link types: 'arch' (an underwater arch door), 'sand' (a sand seam door), 'vines' (shadow vines: Moonfire burns them),
//   'moon' (a hidden door: a wall until Moonfire finds it)
// room fields: pools:[{a:[c,r],b:[c,r]|{room,at:[c,r]},on(R)}], poolsOn(R)->bool, bubbles:{on,off} (vent rhythm),
//   moonbraz:{timed:s} (braziers burn out), buried:'treasure'|'skey'|'treat'|{coins} (what ¤ holds), onMoon(R,o)
Object.assign(TY,{p4full:60,p4arch:61,p4sand:62,p4packed:63,p4seam:64,p4qs:65,p4qsd:66,p4glass:67,p4tend:68,p4mwall:69});
Object.assign(TY_CH,{'≈':60,'∩':61,'∴':62,'∷':63,'π':64,'⊙':65,'⊚':66,'◊':67,'§':68,'▒':69});
Object.assign(DOOR_COL,{arch:'110,190,255',sand:'230,196,120',vines:'140,80,190',moon:'210,220,255'}); Object.assign(LINK_CH,{arch:'a',sand:'s',vines:'v',moon:'m'});
Object.assign(PUZZLE_KINDS,{moon:1});
const P4_WALLT=new Set([P4T.arch,P4T.seam,P4T.mwall]);
const P4_MK={'°':'bv','●':'sp','☾':'mb','ʘ':'gl','¤':'bc','÷':'bs'};
const p4Water=t=>t===TY.deep||t===P4T.full;
{ const base=genCaveRooms; genCaveRooms=function(def){
    const c=base.apply(this,arguments); if(typeof dunOwns==='function'&&!dunOwns(def)) return c;
    const w=c.w, SK=caveSid(def);
    let any=false;
    for(let k=0;k<c.typ.length;k++){ const t=c.typ[k]; if(t<60||t>69) continue; any=true;
      if(t===P4T.mwall&&G&&G.found[`p4mw_${SK}_${k}`]){ c.typ[k]=0; c.grid[k]=0; continue; }
      if(t===P4T.tend&&G&&G.found[`p4td_${SK}_${k}`]){ c.typ[k]=0; continue; }
      if(P4_WALLT.has(t)) c.grid[k]=1; }
    // links: an underwater arch door, a sand seam door, a hidden moon door
    for(const L of c.links){ const ty=String(L.type).split(':')[0]; if(ty!=='arch'&&ty!=='sand'&&ty!=='moon') continue; any=true;
      const key='cv_'+SK+'_link'+L.i;
      if(ty==='moon'&&G&&G.found[key]) continue;
      const dv=L.vertical?[0,1]:[1,0];
      for(const k of L.cells){ c.grid[k]=1; c.typ[k]=ty==='arch'?P4T.arch:ty==='sand'?P4T.seam:P4T.mwall;
        if(ty!=='moon') for(const s of [-1,1]){ const q=k+s*(dv[0]+dv[1]*w); if(c.grid[q]!==0) continue; if(ty==='arch'){ if(!p4Water(c.typ[q])) c.typ[q]=TY.deep; } else c.typ[q]=P4T.sand; } } }
    // marks in water are underwater; buried marks sit in sand (only in dungeons built with Act IV cells or def.p4,
    // so an older dungeon's chest on a one-cell island stays a chest on an island)
    const own=any||!!def.p4||c.marks.some(m=>P4_MK[m.ch]);
    for(const m of c.marks){ const k=m.j*w+m.i; if(c.typ[k]!==0) continue;
      if(own&&'XdbH°'.includes(m.ch)){ let nw=0, nf=0; for(const d of DIRS){ const t=c.typ[k+d[0]+d[1]*w]; if(p4Water(t)){ nw++; if(t===P4T.full) nf++; } } if(nw>=2||m.ch==='°'){ c.typ[k]=nf>=Math.max(1,nw-nf)?P4T.full:TY.deep; any=true; } }
      else if(m.ch==='¤'||m.ch==='÷'){ c.typ[k]=P4T.sand; any=true; } }
    c.p4=any; return c; }; }
{ const base=dunBuildRoom; dunBuildRoom=function(A,def,R,ms,P,spot,freeSpot,rng){ base.apply(this,arguments); p4BuildRoom(A,def,R,ms,P); }; }
function p4Cave(A){ if(A.p4) return A.p4; const n=A.cave.w*A.cave.h; return A.p4={glassT:new Float32Array(n),glassOn:new Uint8Array(n),tendH:new Map(),tendS:new Map(),mw:[],mwOf:new Map(),plate:new Map(),
  under:[],buried:[],bubbles:[],pools:[],braz:[],glyphs:[],bchests:[],vines:[],hide:[],sink:[],dirty:false,t:0}; }
function p4BuildRoom(A,def,R,ms,P){
  const C=p4Cave(A), c=A.cave, SK=caveSid(def), RP=a=>P(R.ox+1+a[0],R.oy+1+a[1]);
  const pools=[];
  for(const m of ms){
    const code=P4_MK[m.ch]; if(!code) continue;
    const p=P(m.i,m.j), k=m.j*c.w+m.i, id=`p4_${SK}_${R.id}_${code}${m.c}_${m.r}`;
    switch(m.ch){
      case '°': { const b=R.bubbles||{}; const o={k:'p4_cbub',x:p.x,y:p.y,id,room:R.id,r:P4N.bubbleR,on:b.on||0,off:b.off||0,ph:b.ph!=null?b.ph:(m.c*0.37)%2}; A.objs.push(o); C.bubbles.push(o); A.lights.push({x:p.x,y:p.y,r:90,i:0.25}); break; }
      case '●': { const o={k:'p4_cpool',x:p.x,y:p.y,id,room:R.id,r:30,link:null,kind:'shadow',ci:m.c,cj:m.r}; A.objs.push(o); C.pools.push(o); pools.push(o); break; }
      case '☾': { const tm=(R.moonbraz&&R.moonbraz.timed)||0, lit=!tm&&(!!G.found[id]||(!!R.solved&&R.kind==='moon')); const o={k:'p4_cbraz',x:p.x,y:p.y,id,room:R.id,r:20,lit:lit?1:0,heat:0,timed:tm,left:0,ci:m.i,cj:m.j}; o.L={x:p.x,y:p.y-18,r:240,i:lit?0.8:0}; A.lights.push(o.L); A.objs.push(o); C.braz.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:13}); break; }
      case 'ʘ': { const o={k:'p4_cglyph',x:p.x,y:p.y,id,room:R.id,r:18,revT:0,vis:0,seen:!!G.found[id]}; A.objs.push(o); C.glyphs.push(o); break; }
      case '¤': { const o={k:'p4_cbchest',x:p.x,y:p.y,id,room:R.id,open:!!G.found[id],gift:R.buried||'treasure'}; A.objs.push(o); C.bchests.push(o); C.buried.push(o); break; }
      case '÷': { const o={k:'tswitch',x:p.x,y:p.y,id:`tr_${SK}_${R.id}_bs${m.c}_${m.r}`,room:R.id,r:16,acc:['p4buried'],timed:R.timed||0,t:0,on:!!R.solved,lit:!!R.solved,p4buried:true,p4k:'tswitch'}; A.objs.push(o); A.lights.push({x:p.x,y:p.y,r:120,i:0,obj:o}); C.buried.push(o); C.hide.push(o); break; }
    }
  }
  // shadow pools pair up in reading order, unless the room says otherwise
  if(!R.pools) for(let i=0;i+1<pools.length;i+=2){ pools[i].link=pools[i+1]; pools[i+1].link=pools[i]; }
  for(const o of pools) o.on=()=>{ const Q=A.rooms[o.room]; return !(Q&&Q.poolsOn)||!!Q.poolsOn(Q); };
}
// after every room is built: explicit pool pairs, what lies underwater, the vine and moon doors, moon wall groups
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){
    base.apply(this,arguments);
    if(typeof dunOwns==='function'&&!dunOwns(def)) return;
    const c=A.cave; if(!c.p4&&!A.p4&&!A.gates.some(o=>o.type==='vines')) return;
    const C=p4Cave(A), SK=caveSid(def), cs=c.cell;
    for(const rid in A.rooms){ const R=A.rooms[rid]; for(const pr of R.pools||[]){
      const find=(room,at)=>{ const Q=A.rooms[room]; if(!Q) return null; const x=A.x0+(Q.ox+1+at[0]+0.5)*cs, y=A.y0+(Q.oy+1+at[1]+0.5)*cs; return C.pools.find(o=>Math.abs(o.x-x)<4&&Math.abs(o.y-y)<4)||null; };
      const a=find(rid,pr.a), b=pr.b&&pr.b.room?find(pr.b.room,pr.b.at):find(rid,pr.b); if(!a||!b) continue; a.link=b; b.link=a;
      if(pr.on){ const on=()=>!!pr.on(R); a.on=on; b.on=on; } } }
    // things in water are underwater (a diver opens and presses them)
    for(const o of A.objs){ if(o.p4under!=null) continue; const isChest=o.tobj==='dchest'||o.tobj==='chest', isSw=o.k==='tswitch'&&!o.p4buried; if(!isChest&&!isSw) continue;
      const k=tCell(o.x,o.y); if(k<0) continue; const ty=c.typ[k]; if(!p4Water(ty)&&ty!==TY.current) continue; o.p4under=true; C.under.push(o);
      if(isSw){ o.p4k='tswitch'; o.acc=Array.from(new Set((o.acc||[]).concat(['p4under']))); C.hide.push(o); }
      if(isChest&&o.prompt){ const pf=o.prompt; o.prompt=()=>{ if(!p4Diving()) return canDive()?S('Dive down to the chest','Dive to the chest'):S('Something glints under the water','Something is down there'); return pf(); }; } }
    // shadow vines over doors (Moonfire burns them; fire shrinks them back for a while)
    for(const o of A.gates) if(o.type==='vines'){ o.p4v=true; o.heat=0; o.shrinkT=0; o.opened=!!G.found[o.id]; C.vines.push(o); }
    // moon walls: each connected run of ▒ cells (or a moon door) is one secret, found together
    const seen=new Uint8Array(c.w*c.h);
    for(let k=0;k<c.typ.length;k++){ if(c.typ[k]!==P4T.mwall||seen[k]) continue; const grp={cells:[],heat:0,id:null}; const st=[k]; seen[k]=1;
      while(st.length){ const q=st.pop(); grp.cells.push(q); for(const d of DIRS){ const n=q+d[0]+d[1]*c.w; if(n>=0&&n<seen.length&&!seen[n]&&c.typ[n]===P4T.mwall){ seen[n]=1; st.push(n); } } }
      const gate=A.gates.find(g=>g.type==='moon'&&g.cells.some(q=>grp.cells.includes(q)));
      grp.gate=gate||null; grp.id=gate?gate.id:`p4mw_${SK}_${Math.min(...grp.cells)}`; grp.x=0; grp.y=0; for(const q of grp.cells){ const p=tPos(q); grp.x+=p.x/grp.cells.length; grp.y+=p.y/grp.cells.length; }
      C.mw.push(grp); for(const q of grp.cells) C.mwOf.set(q,grp); }
    for(let k=0;k<c.typ.length;k++) if(c.typ[k]===P4T.qs||c.typ[k]===P4T.qsd) C.sink.push(k);
    if(!C.ok){ C.ok=true; p4GlassRefresh(A); }
    refreshCaveGates(); }; }
// cells: where you stand, what is water, what is a hole
{ const base=dunGround; dunGround=function(k,t,T){
    if(t>=60&&t<=69){ if(t===P4T.sand||t===P4T.packed||t===P4T.qs||t===P4T.qsd) return true; if(t===P4T.glass) return p4CellGlass(k); if(t===P4T.tend) return !p4TendSolid(k); return false; }
    return base(k,t,T); }; }
{ const base=dunWet; dunWet=function(k,t,T){ if(t===P4T.full) return true; return base(k,t,T); }; }
{ const base=dunHole; dunHole=function(k,t,T){ if(t===P4T.glass) return !p4CellGlass(k); return base(k,t,T); }; }
function p4CellGlass(k){ const A=AREA, C=A&&A.p4; if(!C) return false; return C.glassT[k]>0||C.glassOn[k]>0; }
function p4TendSolid(k){ const C=AREA&&AREA.p4; if(!C) return true; return !(C.tendS.get(k)>0); }
// Ash on the special cells: diving keeps him in the water, burrowing in the sand, flooded water needs Dive
{ const base=dunCheck; dunCheck=function(k,x,y,air,fly){
    const A=AREA; if(A&&A.cave&&A.cave.p4!==undefined&&!fly){ const c=A.cave, t=c.typ[k];
      if(P4.mode==='dive'){ if(p4CaveDeep(k)) return null; if(tGround(k)&&!caveBlockedAt(k)) return null; return 'wall'; }
      if(P4.mode==='burrow'){ if(p4CaveSand(k)) return null; if(tGround(k)&&!caveBlockedAt(k)) return null; return 'wall'; }
      if(!air){
        if(t===P4T.full){ if(canDive()&&!P4.mv){ P4.autoDive=true; return null; } return 'wall'; }
        if(canDive()&&tWet(k)&&!P4.mv) return null; } }
    return base(k,x,y,air,fly); }; }
// walls only a diver (∩) or a burrower (π) passes; living tendrils block everyone
{ const base=areaBlocked; areaBlocked=function(x,y){
    const A=AREA;
    if(A&&A.kind==='cave'&&A.cave&&A.cave.p4){ const c=A.cave, i=Math.floor((x-A.x0)/c.cell), j=Math.floor((y-A.y0)/c.cell);
      if(i>=0&&j>=0&&i<c.w&&j<c.h){ const k=j*c.w+i, t=c.typ[k];
        if(c.grid[k]===1&&player&&(x===player.x||y===player.y)){ if(t===P4T.arch&&P4.mode==='dive') return false; if(t===P4T.seam&&P4.mode==='burrow') return false; }
        if(t===P4T.tend&&c.grid[k]===0&&p4TendSolid(k)) return true; } }
    return base(x,y); }; }
// the vine doors close like roots; refreshed with every gate
{ const base=refreshCaveGates; refreshCaveGates=function(){ base.apply(this,arguments); const A=AREA; if(!A||!A.p4) return; for(const o of A.p4.vines) o.closed=!!o.tmp||!(o.opened||o.shrinkT>0); }; }
{ const base=caveGatePrompt; caveGatePrompt=function(o){ if(o&&o.p4v) return o.closed&&!o.tmp?S('Look at the shadow vines','Look at the vines'):null; if(o&&(o.type==='arch'||o.type==='sand'||o.type==='moon')) return null; return base.apply(this,arguments); }; }
{ const base=caveObjAct; caveObjAct=function(o){
    if(o&&o.p4v&&!o.tmp){ runDialogue([['narr',canMoon()?S('Black vines, cold as a night with no moon. Fire only makes them flinch. Silver Moonfire would burn them away for good.','Shadow vines. Moonfire burns them!'):S('Black vines, cold as a night with no moon. Fire only makes them flinch. Something brighter than fire, and cooler, might do it.','Shadow vines. Fire only makes them flinch.')]],()=>{ scene='play'; }); return true; }
    if(o&&o.p4under&&p4Diving()&&o.tobj==='dchest'){ const k=tCell(o.x,o.y), c=AREA.cave, t=c.typ[k]; c.typ[k]=0; try{ return base.apply(this,arguments); } finally{ c.typ[k]=t; } }
    if(o&&o.p4under&&!p4Diving()){ runDialogue([['narr',canDive()?S('It is down on the bottom, under the water. Dive down to reach it.','It is under the water. Dive down!'):S('It is down on the bottom, under deep water. You cannot reach it from up here.','It is under deep water.')]],()=>{ scene='play'; }); return true; }
    return base.apply(this,arguments); }; }
// underwater and buried switches only answer a diver or a burrower: everyone else's hits skip them
function p4Hidden(fn){
  const C=AREA&&AREA.p4; if(!C||!C.hide.length) return fn();
  const hid=[]; for(const o of C.hide){ if((o.p4under&&p4Diving())) continue; hid.push(o); o.k='p4_hidden'; }
  try{ return fn(); } finally{ for(const o of hid) o.k=o.p4k||'tswitch'; }
}
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){ return p4Hidden(()=>base(x,y,r,src)); }; }
{ const base=caveSwing; caveSwing=function(px,py,dir,range,half){ return p4Hidden(()=>base(px,py,dir,range,half)); }; }
{ const base=caveBreath; caveBreath=function(hit,dt){ return p4Hidden(()=>base(hit,dt)); }; }

// ---------- 5. Dive
function p4EdgeDive(p,inp){
  const mv=inp&&Math.hypot(inp.mx||0,inp.my||0)>0.2, a=mv?Math.atan2(inp.my,inp.mx):p.facing;
  for(const d of [24,38]){ const x=p.x+Math.cos(a)*d, y=p.y+Math.sin(a)*d; if(p4DeepAt(x,y)) return {x,y}; }
  return null;
}
function p4PoolAt(x,y){
  if(AREA){ const C=AREA.p4; if(!C) return null; for(const o of C.pools) if(o.link&&p4On(o)&&dist2(x,y,o.x,o.y)<o.r*o.r) return o; for(const o of AREA.p4o||[]) if(o.p4==='pool'&&p4On(o)&&dist2(x,y,o.x,o.y)<o.r*o.r) return o; return null; }
  for(const o of mapList(P4.out,curMap())) if(o.p4==='pool'&&p4On(o)&&(o.link||o.area)&&dist2(x,y,o.x,o.y)<o.r*o.r) return o;
  return null;
}
function p4PoolLink(o){ if(!o.link) return null; if(typeof o.link==='object') return o.link; return P4.out.find(q=>q.p4==='pool'&&q.id===o.link)||(AREA&&AREA.p4o||[]).find(q=>q.id===o.link)||null; }
// ROLL is ours when Ash can dive, surface, dig in or pop out right here (p2_coast's Shadow Dash asks this first)
function p4RollTakes(){
  const p=player; if(!p||!G||p.dead||p.flying||(p.z||0)>0.5||p.hop||G.fishing) return false;
  if(P4.mv||P4.mode) return true;
  if(canDive()){ if(p4PoolAt(p.x,p.y)) return true; if(p4DeepAt(p.x,p.y)) return true; if(p4EdgeDive(p,P4.inp)) return true; }
  if(canBurrow()&&p4SandAt(p.x,p.y)) return true;
  return false;
}
function p4RollAct(p,inp){
  if(P4.mv) return;
  if(P4.mode==='dive'){ p4Surface(p,false); return; }
  if(P4.mode==='burrow'){ p4PopUp(p,false); return; }
  if(canDive()){ const pool=p4PoolAt(p.x,p.y); if(pool){ p4PoolStart(p,pool); return; }
    if(p4DeepAt(p.x,p.y)){ p4DiveStart(p,null); return; }
    const e=p4EdgeDive(p,inp); if(e){ p4DiveStart(p,e); return; } }
  if(canBurrow()&&p4SandAt(p.x,p.y)){ p4DigStart(p); return; }
}
function p4Splash(x,y,big){ for(let i=0;i<(big?3:2);i++) G.ripples.push({x:x+rand(-5,5),y:y+rand(-3,3),t:0,max:0.6+i*0.25,r:14+i*9,splash:true}); emit(x,y,big?18:10,{col:'215,236,250',glow:false,ang:-Math.PI/2,spread:1.3,smin:40,smax:big?190:120,lmin:.25,lmax:.6,zmin:1.5,zmax:3.2,drag:2.5,rise:-120}); }
function p4DiveStart(p,edge){
  const x1=edge?edge.x:p.x, y1=edge?edge.y:p.y;
  P4.mv={kind:'plunge',t:0,dur:P4N.plungeT,x0:p.x,y0:p.y,x1,y1,face:edge?angTo(p.x,p.y,x1,y1):p.facing,under:true};
  P4.from={x:p.x,y:p.y}; p.facing=P4.mv.face; p.faceGoal=p.facing;
  p4Snd('plunge'); p4Splash(x1,y1,true); if(G.stats) G.stats.p4dives=(G.stats.p4dives||0)+1;
}
function p4DiveBegin(p){
  P4.mode='dive'; P4.swim=false; P4.diveT=0; P4.bubT=0.3;
  const c=p4Ctl(); p4Tip('dive',S('Diving','Diving'),S(`You are under the water. Watch your air: bubbles and open water refill it. Press ${c.roll} to come up.`,`Watch your air! Press ${c.roll} to come up.`),2);
}
function p4Surface(p,auto){
  if(!p4CanSurface(p.x,p.y)){ if(!auto) p4Say(p.x,p.y-40,S('No air up there! Find a bubble or open water.','No air up there!'),'#cfe8ff','nosurf',1.5); return false; }
  P4.mode=null; P4.mv=auto?null:{kind:'rise',t:0,dur:P4N.riseT};
  p4Snd('rise',auto?0.6:1); p4Splash(p.x,p.y,!auto);
  if(AREA&&AREA.tri){ AREA.tri.lx=p.x; AREA.tri.ly=p.y; }
  return true;
}
// out of air: up where he is if he can, else pushed to the nearest air (10 percent of max health, never the last bit)
function p4Drown(p){
  if(p4CanSurface(p.x,p.y)){ p4Surface(p,false); p4Snd('gasp'); ftext(p.x,p.y-34,S('Gasp!','Gasp!'),'#cfe8ff',15); return; }
  const to=p4AirSpot(p.x,p.y)||P4.from||{x:p.x,y:p.y};
  P4.mv={kind:'drown',t:0,dur:0.8,x0:p.x,y0:p.y,x1:to.x,y1:to.y,under:true}; p4Snd('gasp');
}
function p4AirSpot(x,y){
  if(AREA&&AREA.cave){ const A=AREA, c=A.cave, k0=tCell(x,y); if(k0<0) return null;
    const seen=new Uint8Array(c.w*c.h), q=[k0]; seen[k0]=1;
    for(let h=0;h<q.length&&h<4000;h++){ const k=q[h]; const t=c.typ[k];
      if(k!==k0&&c.grid[k]===0&&t!==P4T.full&&(tWet(k)||tGround(k))&&!caveBlockedAt(k)){ const p=tPos(k); return {x:p.x,y:p.y}; }
      for(const d of DIRS){ const n=k+d[0]+d[1]*c.w; if(n<0||n>=seen.length||seen[n]) continue; seen[n]=1; if(p4CaveDeep(n)||(c.grid[n]===0&&tGround(n))) q.push(n); } }
    return null; }
  for(let d=24;d<1200;d+=24){ const n=Math.max(8,Math.round(d/12)); for(let i=0;i<n;i++){ const a=i/n*TAU, px=x+Math.cos(a)*d, py=y+Math.sin(a)*d; if(p4CanSurface(px,py)&&(p4SwimAt(px,py)||p4StandOK(px,py))) return {x:px,y:py}; } }
  return null;
}
function p4PoolStart(p,o){
  if(o.area){ P4.mv={kind:'pooldoor',t:0,dur:P4N.poolIn+0.15,o,x0:p.x,y0:p.y,under:o.kind==='water'}; p4Snd(o.kind==='water'?'plunge':'pool'); if(o.kind==='water') p4Splash(o.x,o.y,true); return; }
  const L=p4PoolLink(o); if(!L) return;
  P4.mv={kind:'pool',t:0,stage:0,o,L,x0:p.x,y0:p.y,dur:P4N.poolIn+P4N.poolGo+P4N.poolOut};
  p4Snd(o.kind==='water'?'plunge':'pool'); p4PoolFx(o);
  const c=p4Ctl(); p4Tip('pool',S('Linked pools','Linked pools'),S('Pools come in pairs. Dive into one and you come up out of its twin.','Dive in one. Come out of its twin!'),1);
}
function p4PoolFx(o){ if(o.kind==='water'){ p4Splash(o.x,o.y,true); return; } for(let i=0;i<16;i++){ const a=rand(0,TAU); emit(o.x+Math.cos(a)*14,o.y+Math.sin(a)*8,1,{col:'130,90,210',glow:false,ang:-Math.PI/2+rand(-0.6,0.6),smin:30,smax:110,lmin:.3,lmax:.7,zmin:2,zmax:4,grow:5,alpha:0.8}); } G.ripples.push({x:o.x,y:o.y,t:0,max:0.7,r:30}); }

// ---------- 6. Burrow
function p4DigStart(p){
  P4.mv={kind:'dig',t:0,dur:P4N.digT,x0:p.x,y0:p.y}; P4.swim=false;
  p4Snd('dig'); p4SandFx(p.x,p.y,16);
  if(G.stats) G.stats.p4digs=(G.stats.p4digs||0)+1;
}
function p4DigBegin(p){
  P4.mode='burrow'; P4.idleT=0;
  const c=p4Ctl(); p4Tip('burrow',S('Burrowing','Burrowing'),S(`You are under the sand. Go under walls, fences and foes. Press ${c.roll} to pop up with an uppercut. Watch the dig meter.`,`Dig under walls! Press ${c.roll} to pop up.`),2);
}
function p4SandCol(){ if(AREA&&AREA.cave){ const st=CAVE_STYLE[AREA.def.theme]||CAVE_STYLE.earth; return hexRGB('#e2c27a').join(','); } const B=BIOMES[biomeInfo(player.x,player.y,{}).b]; const s=B&&B._sand||[226,196,128]; return `${s[0]|0},${s[1]|0},${s[2]|0}`; }
function p4SandFx(x,y,n){ const col=p4SandCol(); emit(x,y,n,{col,glow:false,smin:40,smax:170,lmin:.3,lmax:.7,zmin:2,zmax:4.5,grow:4,drag:3}); emit(x,y,Math.ceil(n/3),{col:'120,96,64',glow:false,smin:20,smax:70,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:6}); }
// pop out: a hop out of the sand and an uppercut that knocks every foe close by up into the air
function p4PopUp(p,auto){
  P4.mode=null;
  if(!p4StandOK(p.x,p.y)){ const s=p4FreeNear(p.x,p.y); if(s){ p.x=s.x; p.y=s.y; } }
  p.z=0.01; p.vz=JUMP_V*(auto?0.62:0.82); p.dbl=false; p.slam=false; if(typeof MV!=='undefined') MV.flapT=0.3;
  p.iframes=Math.max(p.iframes,0.35);
  p4Snd('pop'); p4SandFx(p.x,p.y,26); shake(4); G.ripples.push({x:p.x,y:p.y,t:0,max:0.45,r:P4N.popR*0.9});
  const rk=hasSkill('burrow2'), R=P4N.popR*(1+0.15*rk);
  let n=0;
  for(const e of G.enemies){ if(e.dead||e.invuln||e.spawnIn>0||e.passive) continue; if(dist(p.x,p.y,e.x,e.y)>R+(e.r||14)) continue;
    n++; if(e.onPop) try{ e.onPop(e); }catch(err){ console.warn(err); }
    damageEnemy(e,wPower()*P4N.popDmg*rand(0.92,1.08),{src:'pop',kb:P4N.popKb*(1+0.4*rk),ka:angTo(p.x,p.y,e.x,e.y),fx:e.x-Math.cos(e.face||0)*30,fy:e.y-Math.sin(e.face||0)*30});
    if(!e.dead){ stunEnemy(e,P4N.popStun); e.p4upT=0.75; } }
  if(n){ hitstop=Math.max(hitstop,0.06); ftext(p.x,p.y-40,S('Pop!','Pop!'),'#ffe6b0',16); }
  if(AREA&&AREA.tri){ AREA.tri.lx=p.x; AREA.tri.ly=p.y; }
}
function p4FreeNear(x,y){ for(let d=12;d<220;d+=12){ const n=Math.max(8,Math.round(d/8)); for(let i=0;i<n;i++){ const a=i/n*TAU, px=x+Math.cos(a)*d, py=y+Math.sin(a)*d; if(p4StandOK(px,py)) return {x:px,y:py}; } } return null; }
// burrowed, Ash only bumps into colliders that go deep (glass spikes, stone: c.deep=true)
function p4CollideDeep(e){
  forCols(e.x,e.y,e.r+4,c=>{ if(!c.deep||!colActive(c)) return;
    if(c.t==='c'){ const dx=e.x-c.x, dy=e.y-c.y, m=c.r+e.r, d2=dx*dx+dy*dy; if(d2<m*m){ const d=Math.sqrt(d2)||0.01; e.x=c.x+dx/d*m; e.y=c.y+dy/d*m; } }
    else{ const px=clamp(e.x,c.x0,c.x1), py=clamp(e.y,c.y0,c.y1), dx=e.x-px, dy=e.y-py, d2=dx*dx+dy*dy; if(d2<e.r*e.r&&d2>0.0001){ const d=Math.sqrt(d2); e.x=px+dx/d*e.r; e.y=py+dy/d*e.r; } } });
}
// quicksand: standing still sinks Ash (back to the last safe ground, 10 percent of max health); burrowers are safe in the
// shallow kind, deep quicksand swallows them too
function p4SinkTick(p,dt,moving){
  const sk=(p.z||0)>0.5||p.flying?0:p4SinkAt(p.x,p.y);
  if(!sk||(P4.mode==='burrow'&&sk<2)){ P4.sinkT=Math.max(0,P4.sinkT-dt*3); P4.sinkOn=false; if(!sk&&!P4.mode&&!(p.z>0)&&!p.flying) p4SafeNote(p); return; }
  P4.sinkOn=true;
  if(sk===2&&P4.mode==='burrow') P4.sinkT+=dt; else if(!moving) P4.sinkT+=dt; else P4.sinkT=Math.max(0,P4.sinkT-dt*0.8);
  if(Math.random()<dt*6) p4SandFx(p.x+rand(-10,10),p.y+rand(-4,6),1);
  if(P4.sinkT>=P4N.sinkT){ P4.sinkT=0; p4Sunk(p); }
  else if(P4.sinkT>0.4) p4Tip('sink',S('Quicksand!','Quicksand!'),S('Keep moving! Standing still in quicksand pulls you under.','Keep moving!'),2);
}
function p4SafeNote(p){ if(AREA){ const k=tCell(p.x,p.y); if(k>=0&&tGround(k)&&!AREA.cave.grid[k]) P4.safe={x:p.x,y:p.y,a:AREA}; } else if(!playerBlocked(p.x,p.y)&&!(P4.glass.length&&p4GlassSolidAt(p.x,p.y))) P4.safe={x:p.x,y:p.y,a:null}; }
function p4Sunk(p){
  P4.mode=null; P4.mv=null; p4Snd('sink'); p4SandFx(p.x,p.y,22);
  const s=P4.safe&&P4.safe.a===AREA?P4.safe:(AREA&&AREA.tri&&AREA.tri.safe)||{x:p.safeX||p.x,y:p.safeY||p.y};
  p.x=s.x; p.y=s.y; p.kvx=p.kvy=0; G.fade=0.6; updateCam(0,true);
  if(AREA&&AREA.tri){ AREA.tri.lx=p.x; AREA.tri.ly=p.y; }
  if(!(window.__eb&&window.__eb.god)){ p.hp=Math.max(1,p.hp-Math.ceil(p.maxHp*P4N.sinkDmg)); p.lastHurt=G.time; G.hurtVig=0.5; p.hurtFlash=0.12; }
  p.iframes=Math.max(p.iframes,1);
  ftext(p.x,p.y-30,S('Glurp! Spat out.','Glurp!'),'#ffe0b0',14);
}

// ---------- 7. Moonfire
function p4MoonToggle(){
  if(!canMoon()) return false;
  G.flags.p4mf=G.flags.p4mf?0:1; const on=!!G.flags.p4mf, p=player; P4.swT=1;
  if(on){ p4Snd('moon'); for(let i=0;i<22;i++){ const a=i/22*TAU; emit(p.x+Math.cos(a)*14,p.y+Math.sin(a)*10-10,1,{col:'214,226,255',ang:a,spread:0.2,smin:50,smax:120,lmin:.25,lmax:.5,zmin:1.4,zmax:2.6}); } }
  else{ p4Snd('swapf'); emit(p.x,p.y-10,16,{kind:'fire',smin:40,smax:120,lmin:.25,lmax:.5,zmin:2,zmax:4,grow:5}); }
  ftext(p.x,p.y-42,on?S('Moonfire!','Moonfire!'):S('Fire breath!','Fire!'),on?'#dfe8ff':'#ffc078',15);
  if(on) p4Tip('moonswap',S('Moonfire','Moonfire'),S(`Your breath is silver now. Press ${p4MoonKey()} again to switch back to fire.`,`Press ${p4MoonKey()} to switch back to fire.`),2);
  return true;
}
// the silver breath: same reach as fire, no burning; it lights the moon things and works underwater
function p4MoonBreath(dt){
  const p=player, fly=!!p.flying, ang=p.facing, z=p.z||0, mx=p.x+Math.cos(ang)*16, my=p.y+Math.sin(ang)*16;
  const R=P4N.mfR*(fly?1.03:1), half=fly?0.5:P4N.mfHalf;
  if(fly){ for(let i=0;i<3;i++){ const L=rand(30,170), a=ang+rand(-0.38,0.38), gx=p.x+Math.cos(a)*L, gy=p.y+Math.sin(a)*L, sx=mx, sy=my-z*0.92, d=Math.max(1,dist(sx,sy,gx,gy)), sp=rand(380,470); G.particles.length<950&&G.particles.push({x:sx,y:sy,vx:(gx-sx)/d*sp,vy:(gy-sy)/d*sp,life:d/sp*1.05,max:d/sp*1.05,size:rand(3,5),grow:16,drag:0.3,kind:'spark',col:'214,226,255',glow:true,rise:0,al:0.9}); } }
  else{ emit(mx,my,3,{kind:'moon',col:'240,244,255',ang,spread:0.26,smin:360,smax:460,lmin:.32,lmax:.44,zmin:3,zmax:5,grow:15,drag:1,alpha:0.8}); emit(mx,my,2,{kind:'moon',col:'176,196,255',ang,spread:0.34,smin:300,smax:420,lmin:.35,lmax:.5,zmin:2.5,zmax:4.5,grow:14,drag:1,alpha:0.7}); if(Math.random()<0.6) emit(mx+Math.cos(ang)*rand(40,150),my+Math.sin(ang)*rand(40,150),1,{col:'255,255,255',ang:-Math.PI/2,spread:1,smin:10,smax:40,lmin:.3,lmax:.6,zmin:0.8,zmax:1.6,drag:2}); }
  if(Math.random()<dt*3) p4Snd('moon',0.35);
  const ox=fly?p.x:mx, oy=fly?p.y:my;
  P4.arcsNext.push({x:ox,y:oy,ang,R,half});
  if(typeof p2Shine==='function') p2Shine(ox+Math.cos(ang)*R*0.55,oy+Math.sin(ang)*R*0.55,R*0.6);
  p4MoonWorld(ox,oy,ang,dt,R,half);
  p.breathTick-=dt;
  if(p.breathTick<=0){ p.breathTick=0.1;
    const k=(1+P4N.moonK*hasSkill('moon2'));
    for(const e of G.enemies){ if(e.dead||e.spawnIn>0) continue;
      for(const c of hitCircles(e)){ if(!inArcC(ox,oy,ang,R,half,c)) continue;
        if(e.onMoon) try{ e.onMoon(e,0.1); }catch(err){ console.warn(err); }
        if(e.ink&&!(e.p4inkT>0)){ e.p4inkH=(e.p4inkH||0)+0.1; if(e.p4inkH>=P4N.inkNeed) p4InkMelt(e); }
        if(!e.invuln&&!e.passive){ damageEnemy(e,P4N.mfDps*p.stats.fire*p.stats.dmgMul*k*(e.moonK||1)*rand(0.9,1.1),{src:'moon',kb:22,ka:angTo(p.x,p.y,e.x,e.y),mult:c.m>1?1.2:1}); if(Math.random()<0.5) emit(c.x,c.y,3,{col:'220,230,255',smin:30,smax:100,lmin:.2,lmax:.4,zmin:1.2,zmax:2.4}); }
        break; } } }
}
function p4InkMelt(e){ e.p4inkT=P4N.inkT; e.p4inkSh=e.p4inkSh!=null?e.p4inkSh:e.shield; e.shield=false; e.blocking=false; e.p4inkH=0; ftext(e.x,e.y-(e.r||14)-18,S('Ink melted!','Melted!'),'#dfe6ff',13); p4Snd('burn',0.6);
  for(let i=0;i<12;i++) emit(e.x+rand(-12,12),e.y+rand(-10,6),1,{col:'40,24,60',glow:false,ang:Math.PI/2,spread:0.5,smin:20,smax:70,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:2}); }
// Moonfire particles cool from white through moon blue to a lavender wisp (fire's own ramp, in silver)
{ const base=drawParticles; drawParticles=function(){ const P=G&&G.particles; if(P) for(const q of P){ if(q.kind!=='moon') continue; const f=q.life/q.max; q.col=f>0.74?'236,242,255':f>0.48?'168,192,255':f>0.24?'128,118,236':'66,50,140'; } return base.apply(this,arguments); }; }
// underwater, fire is just bubbles
function p4BubbleBreath(dt){
  const p=player, ang=p.facing, mx=p.x+Math.cos(ang)*16, my=p.y+Math.sin(ang)*16;
  if(Math.random()<0.7) emit(mx,my,2,{col:'225,242,255',glow:false,ang,spread:0.5,smin:60,smax:160,lmin:.35,lmax:.7,zmin:1.6,zmax:3.6,drag:3,rise:40,alpha:0.85});
  if(Math.random()<dt*2.5){ p4Snd('bubble',0.5); p4Say(mx,my-20,S('Blub!','Blub!'),'#d8f0ff','blub',1.2); }
  if(canMoon()) p4Tip('blub',S('Fire under water','Fire under water'),S(`Fire cannot burn under the water, but Moonfire can. Press ${p4MoonKey()} to switch to Moonfire.`,`Switch to Moonfire with ${p4MoonKey()}!`),1);
}
// Moonfire on the world: moonstones, moon-glass, glyphs, moon doors, tendrils, moon ramps, and in dungeons the cells too
function p4MoonWorld(mx,my,ang,dt,R,half){
  const hit=(x,y,r)=>inArcC(mx,my,ang,R,half,{x,y,r:r||16});
  for(const o of p4Objs()){
    switch(o.p4){
      case 'moonstone': if(hit(o.x,o.y-14,22)){ o.heat+=dt; if(o.heat>=(o.need||P4N.stoneNeed)) p4StoneLight(o); } break;
      case 'moonglass': if(p4ShapeHit(o,hit)){ const was=p4GlassSolid(o); o.litT=p4GlassDur(); if(!o.shown){ o.shown=true; G.found[o.id+'_seen']=1; }
        if(o.keep&&!o.keepOn){ o.keepOn=true; G.found[o.id]=1; } if(!was){ p4Snd('stone',0.4); p4GlassFx(o); } } break;
      case 'glyph': if(hit(o.x,o.y,o.r)) p4GlyphReveal(o); break;
      case 'moondoor': if(!o.open&&hit(o.x,o.y,Math.max(o.w,o.h)*0.45)){ o.heat+=dt; if(Math.random()<0.4) emit(o.x+rand(-o.w/2,o.w/2),o.y+rand(-o.h/2,o.h/2)-10,1,{col:'220,230,255',smin:10,smax:40,lmin:.3,lmax:.6,zmin:1,zmax:2}); if(o.heat>=P4N.doorNeed) p4DoorOpen(o); } break;
      case 'tendril': if(!o.burnt&&hit(o.x,o.y,o.r)){ o.heat+=dt; p4TendFx(o.x,o.y,o.r); if(o.heat>=P4N.tendNeed) p4TendBurn(o); } break;
    }
  }
  if(!AREA&&P4.ramps.length) for(const r of P4.ramps){ if(r.k3!==curMap()) continue; const cx=(r.x0+r.x1)/2, cy=(r.y0+r.y1)/2; if(hit(cx,cy,Math.max(r.x1-r.x0,r.y1-r.y0)*0.5)){ if(!(r.litT>0)){ p4Snd('stone',0.35); for(let i=0;i<10;i++) emit(rand(r.x0,r.x1),rand(r.y0,r.y1),1,{col:'214,226,255',smin:10,smax:50,lmin:.4,lmax:.8,zmin:1.2,zmax:2.4}); } r.litT=p4GlassDur(); } }
  if(AREA&&AREA.p4) p4MoonCave(AREA,mx,my,ang,dt,R,half,hit);
}
function p4ShapeHit(o,hit){
  if(o.pts){ for(let i=1;i<o.pts.length;i++){ const a=o.pts[i-1], b=o.pts[i], L=dist(a[0],a[1],b[0],b[1]), n=Math.max(1,Math.ceil(L/30)); for(let s=0;s<=n;s++){ if(hit(lerp(a[0],b[0],s/n),lerp(a[1],b[1],s/n),o.w*0.4)) return true; } } return false; }
  const w=o.x1-o.x0, h=o.y1-o.y0, nx=Math.max(1,Math.ceil(w/40)), ny=Math.max(1,Math.ceil(h/40));
  for(let j=0;j<=ny;j++) for(let i=0;i<=nx;i++) if(hit(o.x0+w*i/nx,o.y0+h*j/ny,18)) return true; return false;
}
function p4StoneLight(o){
  o.heat=0; const was=o.lit>0||o.keepOn; o.lit=p4StoneDur(o);
  if(o.keep&&!o.keepOn){ o.keepOn=true; G.found[o.id]=1; saveGame(); }
  if(!was){ p4Snd('stone'); for(let i=0;i<20;i++){ const a=rand(0,TAU); emit(o.x+Math.cos(a)*8,o.y-22+Math.sin(a)*8,1,{col:'214,226,255',ang:a,spread:0.2,smin:40,smax:140,lmin:.3,lmax:.7,zmin:1.4,zmax:2.8}); }
    if(o.onLit) try{ o.onLit(o); }catch(e){ console.warn(e); }
    if(!o.done&&o.then){ o.done=true; try{ o.then(o); }catch(e){ console.warn(e); } } }
}
function p4GlassFx(o){ const pts=o.pts||[[o.x0,o.y0],[o.x1,o.y1]]; for(let i=0;i<14;i++){ const q=pts[Math.floor(rand(0,pts.length))]; emit(o.pts?q[0]+rand(-20,20):rand(o.x0,o.x1),o.pts?q[1]+rand(-20,20):rand(o.y0,o.y1),1,{col:'214,226,255',smin:10,smax:50,lmin:.4,lmax:.8,zmin:1.2,zmax:2.4}); } }
function p4GlyphReveal(o){ const first=!o.revT&&!(o.vis>0.5); o.revT=P4N.glyph; if(!o.seen){ o.seen=true; G.found[o.id]=1; p4Snd('moon',0.6); if(o.then) try{ o.then(o); }catch(e){ console.warn(e); } } else if(first) p4Snd('moon',0.3); }
function p4DoorOpen(o){ o.open=true; G.found[o.id]=1; p4Snd('stone'); shake(3); setBanner(S('A hidden door!','A hidden door!'),S('Moonlight shows what was always there.','Moonlight found it!'),1.8); for(let i=0;i<30;i++) emit(o.x+rand(-o.w/2,o.w/2),o.y+rand(-o.h/2,o.h/2)-12,1,{col:'214,226,255',ang:-Math.PI/2,spread:0.8,smin:20,smax:100,lmin:.4,lmax:.9,zmin:1.4,zmax:3}); if(o.then) try{ o.then(o); }catch(e){ console.warn(e); } saveGame(); }
function p4TendFx(x,y,r){ if(Math.random()<0.5) emit(x+rand(-r,r)*0.6,y+rand(-r,r)*0.5,1,{col:'214,226,255',ang:-Math.PI/2,spread:0.7,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.4,zmax:2.6}); if(Math.random()<0.3) emit(x+rand(-r,r)*0.6,y+rand(-r,r)*0.5,1,{col:'40,24,60',glow:false,ang:-Math.PI/2,spread:0.6,smin:10,smax:50,lmin:.5,lmax:1,zmin:3,zmax:6,grow:6,alpha:0.7}); }
function p4TendBurst(x,y,r){ p4Snd('burn'); shake(2); for(let i=0;i<26;i++) emit(x+rand(-r,r),y+rand(-r,r)*0.6,1,{col:i%2?'214,226,255':'60,36,90',glow:i%2===0,ang:-Math.PI/2,spread:1,smin:20,smax:120,lmin:.4,lmax:1,zmin:1.5,zmax:4,grow:i%2?0:5}); ftext(x,y-36,S('The shadows burn away!','Gone!'),'#e0e8ff',13); }
function p4TendBurn(o){ o.burnt=true; G.found[o.id]=1; p4TendBurst(o.x,o.y,o.r); saveGame(); }
// a lit moon brazier, moon-glass cells, tendril cells, moon walls, vine doors, glyphs
function p4MoonCave(A,mx,my,ang,dt,R,half,hit){
  const C=A.p4, c=A.cave, cs=c.cell, got=new Set();
  for(let a=-half;a<=half+0.001;a+=half/2) for(let d=20;d<=R;d+=22){ const k=tCell(mx+Math.cos(ang+a)*d,my+Math.sin(ang+a)*d); if(k>=0) got.add(k); }
  let glassNew=false;
  for(const k of got){ const t=c.typ[k];
    if(t===P4T.glass){ if(!(C.glassT[k]>0)&&!C.glassOn[k]) glassNew=true; C.glassT[k]=p4GlassDur(); }
    else if(t===P4T.tend){ if(p4TendSolid(k)||C.tendS.get(k)>0){ const h=(C.tendH.get(k)||0)+dt*(got.size>0?1:0); C.tendH.set(k,h); const q=tPos(k); p4TendFx(q.x,q.y,cs*0.5); if(h>=P4N.tendNeed) p4CellTendBurn(A,k); } }
    else if(t===P4T.mwall){ const g=C.mwOf.get(k); if(g&&!g.hit){ g.hit=true; g.heat+=dt; const q=tPos(k); if(Math.random()<0.5) emit(q.x+rand(-cs/2,cs/2),q.y+rand(-cs/2,cs/2),1,{col:'220,230,255',smin:10,smax:40,lmin:.3,lmax:.6,zmin:1,zmax:2}); if(g.heat>=P4N.doorNeed) p4MoonWallOpen(A,g); } } }
  for(const g of C.mw) g.hit=false;
  if(glassNew) p4Snd('stone',0.35);
  for(const o of C.braz) if(!(o.lit>0)&&hit(o.x,o.y-10,20)){ o.heat+=dt; if(o.heat>=P4N.stoneNeed) p4BrazLight(A,o); }
  for(const o of C.glyphs) if(hit(o.x,o.y,o.r)) p4GlyphReveal(o);
  for(const o of C.vines){ if(o.opened||!hit(o.x,o.y,40)) continue; o.heat+=dt; p4TendFx(o.x,o.y,40); if(o.heat>=P4N.tendNeed*1.4){ o.opened=true; G.found[o.id]=true; refreshCaveGates(); p4Snd('burn'); shake(3); setBanner(S('The shadow vines burn away','The vines burn away'),'',1.6); for(let i=0;i<30;i++) emit(o.x+rand(-60,60),o.y+rand(-40,40),1,{col:i%2?'214,226,255':'60,36,90',glow:i%2===0,ang:-Math.PI/2,spread:1,smin:20,smax:130,lmin:.4,lmax:1,zmin:1.5,zmax:4}); saveGame(); } }
}
function p4BrazLight(A,o){
  const C=A.p4; o.heat=0; o.lit=o.timed?o.timed*(1+P4N.moonK*hasSkill('moon2')):1; if(!o.timed){ G.found[o.id]=true; saveGame(); }
  o.L.i=0.85; p4Snd('stone'); for(let i=0;i<18;i++){ const a=rand(0,TAU); emit(o.x+Math.cos(a)*8,o.y-14+Math.sin(a)*6,1,{col:'214,226,255',ang:a,spread:0.2,smin:40,smax:130,lmin:.3,lmax:.7,zmin:1.4,zmax:2.8}); }
  p4GlassRefresh(A);
  const R=A.rooms[o.room]; if(R&&R.onMoon) try{ R.onMoon(R,o); }catch(e){ console.warn(e); }
  if(R&&R.kind==='moon'&&!R.solved){ const all=C.braz.filter(q=>q.room===o.room); if(all.every(q=>q.lit>0)){ for(const q of all){ q.timed=0; q.lit=1; G.found[q.id]=true; } solveRoom(R); } else setBanner(`${all.filter(q=>q.lit>0).length} / ${all.length}`,S('moon braziers lit','moon lamps lit'),1.2); }
}
// moon-glass near a lit brazier (P4N.brazReach cells) stays solid while it burns
function p4GlassRefresh(A){
  const C=A.p4, c=A.cave, r=P4N.brazReach; C.glassOn.fill(0);
  for(const o of C.braz){ if(!(o.lit>0)) continue; for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ const i=o.ci+di, j=o.cj+dj; if(i<0||j<0||i>=c.w||j>=c.h) continue; const k=j*c.w+i; if(c.typ[k]===P4T.glass) C.glassOn[k]=1; } }
}
function p4CellTendBurn(A,k){ const C=A.p4, c=A.cave; c.typ[k]=0; C.tendH.delete(k); C.tendS.delete(k); G.found[`p4td_${caveSid(A.def)}_${k}`]=1; const q=tPos(k); p4TendBurst(q.x,q.y,22); saveGame(); }
function p4MoonWallOpen(A,g){
  const c=A.cave; for(const k of g.cells){ c.grid[k]=0; c.typ[k]=0; A.p4.mwOf.delete(k); } A.p4.mw=A.p4.mw.filter(q=>q!==g);
  G.found[g.id]=true; if(g.gate) g.gate.opened=true;
  renderCaveRooms(A,A.def); renderCaveMini(A); refreshCaveGates();
  p4DoorOpen({x:g.x,y:g.y,w:A.cave.cell*1.5,h:A.cave.cell,id:g.id});
}
// fire on moon things: they want moonlight; fire makes tendrils and shadow vines shrink back for a while
function p4FireWorld(mx,my,ang,dt){
  const hit=(x,y,r)=>inArcC(mx,my,ang,175,0.45,{x,y,r:r||16});
  for(const o of p4Objs()){
    if(o.p4==='moonstone'&&!(o.lit>0)&&!o.keepOn&&hit(o.x,o.y-14,22)) p4Say(o.x,o.y-50,S('It wants moonlight, not fire.','It wants moonlight.'),'#dfe6ff','wantmoon',2.5);
    else if(o.p4==='tendril'&&!o.burnt&&hit(o.x,o.y,o.r)){ if(!(o.shrinkT>0)) p4Say(o.x,o.y-44,S('The tendrils flinch back!','They shrink back!'),'#e0d0ff','tshrink',2); o.shrinkT=P4N.shrink; }
  }
  const C=AREA&&AREA.p4; if(!C) return;
  for(const o of C.braz) if(!(o.lit>0)&&hit(o.x,o.y-10,20)) p4Say(o.x,o.y-46,S('It wants moonlight, not fire.','It wants moonlight.'),'#dfe6ff','wantmoon',2.5);
  for(const o of C.vines) if(!o.opened&&hit(o.x,o.y,40)){ if(!(o.shrinkT>0)){ p4Say(o.x,o.y-50,S('The vines flinch back, just for a moment!','They shrink back!'),'#e0d0ff','vshrink',2); } o.shrinkT=P4N.shrink; refreshCaveGates(); }
  const c=AREA.cave; for(let a=-0.45;a<=0.46;a+=0.225) for(let d=20;d<=175;d+=22){ const k=tCell(mx+Math.cos(ang+a)*d,my+Math.sin(ang+a)*d); if(k>=0&&c.typ[k]===P4T.tend){ if(!(C.tendS.get(k)>0)) p4Say(mx+Math.cos(ang)*90,my+Math.sin(ang)*90-30,S('The tendrils flinch back!','They shrink back!'),'#e0d0ff','tshrink',2); C.tendS.set(k,P4N.shrink); } }
}

// ---------- 8. every frame, and the wrappers
function p4Reset(all){
  const p=player; if(P4.mode||P4.mv){ if(p&&!p.dead) p.z=0; }
  P4.mode=null; P4.mv=null; P4.swim=false; P4.sinkT=0; P4.sinkOn=false; P4.autoDive=false; P4.onRamp=null;
  if(G){ P4.air=p4AirMax(); P4.bm=p4BurMax(); }
  if(all){ P4.tips={}; P4.safe=null; P4.plates=[]; }
}
function p4Restore(){
  for(const o of P4.out){ const K=P4K[o.p4]; if(K&&K.init&&!o.col&&o.p4!=='rampfx') K.init(o,null);
    if(o.p4==='uswitch'||o.p4==='bswitch') o.on=!o.timed&&p4Found(o.id);
    else if(o.p4==='uchest'||o.p4==='bchest') o.open=p4Found(o.id);
    else if(o.p4==='moonstone'){ o.lit=0; o.keepOn=!!o.keep&&p4Found(o.id); o.done=false; }
    else if(o.p4==='moonglass'){ o.litT=0; o.keepOn=!!o.keep&&p4Found(o.id); o.shown=!o.hidden||p4Found(o.id+'_seen'); }
    else if(o.p4==='glyph'){ o.seen=p4Found(o.id); o.revT=0; o.vis=o.keep&&o.seen?1:0; }
    else if(o.p4==='moondoor'){ o.open=p4Found(o.id); o.oa=o.open?1:0; o.heat=0; }
    else if(o.p4==='tendril'){ o.burnt=p4Found(o.id); o.shrinkT=0; o.heat=0; } }
  for(const r of P4.ramps) r.litT=0;
}
function p4Sync(p){
  if(P4.g!==G){ P4.g=G; p4Reset(true); P4.area=AREA; p4Restore(); }
  if(P4.area!==AREA){ P4.area=AREA; p4Reset(false); }
  if(p.dead) p4Reset(false);
  else if(P4.lx!=null&&dist2(p.x,p.y,P4.lx,P4.ly)>200*200&&!(P4.mv&&(P4.mv.kind==='pool'||P4.mv.kind==='drown'))) p4Reset(false);
}
// the clock and meters while one of our moves holds Ash's legs (updatePlayer is skipped)
function p4Tick(p,dt){
  p.t+=dt; p.dashCd-=dt; p.iframes-=dt; p.hurtFlash-=dt; p.atkCd-=dt; p.comboTimer-=dt; G.dashBuf-=dt; G.roarBuf-=dt;
  if(p.stamDelay>0) p.stamDelay-=dt; else p.stamina=Math.min(p.maxStamina,p.stamina+p.stats.staminaRegen*dt);
  if(p.regenDelay>0) p.regenDelay-=dt; else p.energy=Math.min(p.maxEnergy,p.energy+p.stats.energyRegen*dt);
  p.moving=false; p.sprinting=false; p.breathing=false; p.swingT=0; p.dashT=0; p.drinkT=0; p.kvx=p.kvy=0; p.avx=p.avy=0; p.vz=0;
  try{ SFX.setFire(false); }catch(e){}
  if(typeof MV!=='undefined'){ MV.lx=p.x; MV.ly=p.y; MV.jumpBuf=0; }
}
function p4MoveStep(p,dt,inp){
  const M=P4.mv; M.t+=dt; const k=clamp(M.t/M.dur,0,1);
  switch(M.kind){
    case 'plunge': { p.x=lerp(M.x0,M.x1,k); p.y=lerp(M.y0,M.y1,k); p.z=Math.sin(Math.PI*Math.min(1,k*1.3))*14; p.facing=M.face; if(k>=1){ P4.mv=null; p.z=0; p4DiveBegin(p); } break; }
    case 'rise': p.z=0; if(k>=1) P4.mv=null; break;
    case 'dig': { p.z=0; if(Math.random()<0.6) p4SandFx(p.x+rand(-8,8),p.y+rand(-4,6),1); if(k>=1){ P4.mv=null; p4DigBegin(p); } break; }
    case 'drown': { if(M.t<0.35){ G.fade=Math.max(G.fade||0,M.t/0.35*0.9); } else if(!M.moved){ M.moved=true; p.x=M.x1; p.y=M.y1; P4.mode=null; updateCam(0,true); if(AREA&&AREA.tri){ AREA.tri.lx=p.x; AREA.tri.ly=p.y; }
        if(!(window.__eb&&window.__eb.god)){ p.hp=Math.max(1,p.hp-Math.ceil(p.maxHp*P4N.drown)); p.lastHurt=G.time; G.hurtVig=0.5; p.hurtFlash=0.12; }
        ftext(p.x,p.y-30,S('Gasp! Air!','Air!'),'#cfe8ff',15); p4Splash(p.x,p.y,true); P4.air=p4AirMax(); M.under=false; }
      if(k>=1){ P4.mv=null; p.iframes=Math.max(p.iframes,0.8); } break; }
    case 'pool': { const a=P4N.poolIn, b=a+P4N.poolGo, o=M.o, L=M.L;
      if(M.t<a){ const q=M.t/a; p.x=lerp(M.x0,o.x,q); p.y=lerp(M.y0,o.y,q); }
      else if(M.t<b){ const q=(M.t-a)/P4N.poolGo, e=q<0.5?2*q*q:1-Math.pow(-2*q+2,2)/2; p.x=lerp(o.x,L.x,e); p.y=lerp(o.y,L.y,e); if(!M.went){ M.went=true; } if(Math.random()<0.8) P4.wake.push({x:p.x,y:p.y,a:0.6,k:o.kind}); }
      else{ if(!M.out){ M.out=true; p.x=L.x; p.y=L.y; p4PoolFx(L); p4Snd(L.kind==='water'?'rise':'pool',0.8); } }
      p.iframes=Math.max(p.iframes,0.2); updateCam(dt*3);
      if(M.t>=M.dur){ P4.mv=null; const s=p4StandOK(p.x,p.y)?{x:p.x,y:p.y}:p4FreeNear(L.x,L.y)||{x:L.x,y:L.y+30}; p.x=s.x; p.y=s.y; if(AREA&&AREA.tri){ AREA.tri.lx=p.x; AREA.tri.ly=p.y; } if(L.kind==='water'&&canDive()&&p4DeepAt(p.x,p.y)){ p4DiveBegin(p); } }
      break; }
    case 'pooldoor': { const o=M.o; p.x=lerp(M.x0,o.x,k); p.y=lerp(M.y0,o.y,k); if(k>=1){ P4.mv=null; P4.mode=null; enterArea(o.area,{x:o.x,y:o.y,outY:o.outY!=null?o.outY:0}); if(o.arrive) setBanner(o.label||'',o.arrive,2.2); } break; }
    case 'grab': { const o=M.o; p.x=M.x+Math.sin(M.t*30)*1.5; p.y=M.y; if(k>=1){ P4.mv=null; const a=angTo(o.x,o.y,p.x,p.y); const nx=p.x+Math.cos(a)*34, ny=p.y+Math.sin(a)*34; if(p4StandOK(nx,ny)){ p.x=nx; p.y=ny; } P4.grabCd=2; p.iframes=Math.max(p.iframes,0.6); } break; }
  }
}
// tendrils grab Ash when he walks into them (a short hold and a little hurt)
function p4GrabCheck(p){
  if(P4.mode||P4.mv||P4.grabCd>0||p.iframes>0||airborne()) return;
  let hit=null;
  for(const o of p4Objs()) if(o.p4==='tendril'&&!o.burnt&&!(o.shrinkT>0)&&dist(p.x,p.y,o.x,o.y)<o.r+p.r+5){ hit=o; break; }
  if(!hit&&AREA&&AREA.p4&&AREA.cave.p4){ const c=AREA.cave; for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){ const k=tCell(p.x+d[0]*(p.r+8),p.y+d[1]*(p.r+8)); if(k>=0&&c.typ[k]===P4T.tend&&p4TendSolid(k)){ const q=tPos(k); hit={x:q.x,y:q.y,r:24}; break; } } }
  if(!hit) return;
  const pct=p4Easy()?0.02:G.diff&&G.diff.name==='Hard'?0.06:0.04;
  P4.mv={kind:'grab',t:0,dur:P4N.tendHold,o:hit,x:p.x,y:p.y}; p4Snd('grab');
  if(!(window.__eb&&window.__eb.god)){ p.hp=Math.max(1,p.hp-Math.ceil(p.maxHp*pct)); p.lastHurt=G.time; p.hurtFlash=0.12; }
  ftext(p.x,p.y-34,S('Grabbed!','Grabbed!'),'#d8c8ff',14);
  p4Tip('tendril',S('Shadow tendrils','Shadow tendrils'),canMoon()?S('Moonfire burns tendrils away for good. Plain fire only makes them flinch.','Moonfire burns them away!'):S('Fire makes tendrils flinch back for a moment. Hurry past!','Fire makes them shrink!'),1);
}
// the per-frame world: objects, timers, meters, glass, ramps, beams, ink
function p4WorldTick(p,dt){
  P4.t+=dt; if(P4.grabCd>0) P4.grabCd-=dt; if(P4.swT>0) P4.swT-=dt;
  P4.arcs=P4.arcsNext; P4.arcsNext=[]; P4.beams=P4.beamsNext; P4.beamsNext=[];
  for(let i=P4.wake.length-1;i>=0;i--){ P4.wake[i].a-=dt*2.2; if(P4.wake[i].a<=0) P4.wake.splice(i,1); } if(P4.wake.length>40) P4.wake.splice(0,P4.wake.length-40);
  for(const q of P4.plates) q.t-=dt; if(P4.plates.length&&P4.plates.some(q=>q.t<=0)) P4.plates=P4.plates.filter(q=>q.t>0);
  // meters
  if(P4.mode!=='dive'&&!(P4.mv&&P4.mv.under)) P4.air=Math.min(p4AirMax(),P4.air+P4N.refill*dt);
  if(P4.mode!=='burrow') P4.bm=Math.min(p4BurMax(),P4.bm+p4BurMax()/3*dt);
  // outdoor objects (or the area's point objects)
  const objs=p4Objs();
  for(const o of objs){
    switch(o.p4){
      case 'moonstone': { if(o.lit>0){ o.lit-=dt; if(o.lit<=0&&!o.keepOn){ o.lit=0; p4Snd('swapf',0.3); } } const on=o.keepOn||o.lit>0; o.L.i=on?0.85:0; if(on&&o.beam){ const a=o.beam.ang||0, L=o.beam.len||400; p4MoonShine(o.x,o.y-20,o.x+Math.cos(a)*L,o.y-20+Math.sin(a)*L,o.beam.w||26); } if(o.heat>0) o.heat=Math.max(0,o.heat-dt*0.5); break; }
      case 'moonglass': if(o.litT>0) o.litT-=dt; break;
      case 'glyph': { if(o.revT>0) o.revT-=dt; const pip=G.flags&&G.flags.m_pip_lamp&&G.pip&&dist2(G.pip.x,G.pip.y,o.x,o.y)<130*130; if(pip&&!o.seen){ o.seen=true; G.found[o.id]=1; if(o.then) try{ o.then(o); }catch(e){} } const want=o.revT>0||pip||(o.keep&&o.seen)?1:0; o.vis+=(want-o.vis)*Math.min(1,dt*(want?4:1.2)); break; }
      case 'moondoor': o.oa+=((o.open?1:0)-o.oa)*Math.min(1,dt*2); if(o.heat>0&&!o.open) o.heat=Math.max(0,o.heat-dt*0.4); break;
      case 'tendril': if(o.shrinkT>0) o.shrinkT-=dt; if(o.heat>0&&!o.burnt) o.heat=Math.max(0,o.heat-dt*0.3); break;
      case 'uswitch': if(o.on&&o.timed){ o.left-=dt; if(o.left<=0){ o.on=false; p4Snd('click',0.5); } } break;
    }
  }
  // which moon-glass and ramps the lit moonstones hold up, and the beams
  for(const g of P4.glass){ g.stoneOn=false; g.beamOn=false; }
  for(const r of P4.ramps){ r.stoneOn=false; if(r.litT>0) r.litT-=dt; }
  for(const s of P4.stones){ if(!(s.keepOn||s.lit>0)) continue; if(s.glass) for(const id of s.glass){ const g=P4.glass.find(q=>q.id===id); if(g){ g.stoneOn=true; g.shown=true; } } if(s.ramps) for(const id of s.ramps){ const r=P4.ramps.find(q=>q.id===id); if(r){ r.stoneOn=true; if(s.keepOn&&!p4Found('p4r_'+r.id)) G.found['p4r_'+r.id]=1; } } }
  if(P4.beams.length) for(const g of P4.glass){ if(g.pts) continue; for(const b of P4.beams){ if(segRectHit(b,g)){ g.beamOn=true; g.shown=true; break; } } }
  // ink shields come back
  for(const e of G.enemies) if(e.p4inkT>0){ e.p4inkT-=dt; e.shield=false; e.blocking=false; if(e.p4inkT<=0){ e.shield=e.p4inkSh; e.p4inkSh=null; e.p4inkT=0; } }
  for(const e of G.enemies) if(e.p4upT>0) e.p4upT-=dt;
  if(AREA&&AREA.p4) p4CaveTick(AREA,dt);
}
function segRectHit(b,g){ const n=Math.max(2,Math.ceil(dist(b.x0,b.y0,b.x1,b.y1)/24)); for(let i=0;i<=n;i++){ const x=lerp(b.x0,b.x1,i/n), y=lerp(b.y0,b.y1,i/n); if(x>g.x0-b.w/2&&x<g.x1+b.w/2&&y>g.y0-b.w/2&&y<g.y1+b.w/2) return true; } return false; }
function p4CaveTick(A,dt){
  const C=A.p4, c=A.cave; C.t+=dt; let ref=false;
  for(let k=0;k<C.glassT.length;k++) if(C.glassT[k]>0){ C.glassT[k]-=dt; if(C.glassT[k]<0) C.glassT[k]=0; }
  for(const [k,v] of C.tendS){ const nv=v-dt; if(nv<=0) C.tendS.delete(k); else C.tendS.set(k,nv); }
  for(const [k,v] of C.tendH){ const nv=v-dt*0.3; if(nv<=0) C.tendH.delete(k); else C.tendH.set(k,nv); }
  for(const [k,v] of C.plate){ const nv=v-dt; if(nv<=0) C.plate.delete(k); else C.plate.set(k,nv); }
  for(const o of C.braz){ if(o.lit>0&&o.timed){ o.lit-=dt; if(o.lit<=0){ o.lit=0; ref=true; p4Snd('swapf',0.3); emit(o.x,o.y-14,10,{col:'150,160,190',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:50,lmin:.6,lmax:1,zmin:3,zmax:6,grow:6}); } } o.L.i=o.lit>0?0.85:0; if(o.heat>0&&!(o.lit>0)) o.heat=Math.max(0,o.heat-dt*0.5); }
  if(ref) p4GlassRefresh(A);
  for(const o of C.glyphs){ if(o.revT>0) o.revT-=dt; const pip=G.flags&&G.flags.m_pip_lamp&&G.pip&&dist2(G.pip.x,G.pip.y,o.x,o.y)<130*130; if(pip&&!o.seen){ o.seen=true; G.found[o.id]=1; } const want=o.revT>0||pip?1:0; o.vis+=(want-o.vis)*Math.min(1,dt*(want?4:1.2)); }
  let vref=false; for(const o of C.vines){ if(o.shrinkT>0){ o.shrinkT-=dt; if(o.shrinkT<=0) vref=true; } if(o.heat>0&&!o.opened) o.heat=Math.max(0,o.heat-dt*0.3); } if(vref) refreshCaveGates();
  for(const g of C.mw) if(g.heat>0) g.heat=Math.max(0,g.heat-dt*0.4);
  // a moonbeam lights the moon-glass cells it crosses
  if(P4.beams.length) for(const b of P4.beams){ const n=Math.ceil(dist(b.x0,b.y0,b.x1,b.y1)/16); for(let i=0;i<=n;i++){ const k=tCell(lerp(b.x0,b.x1,i/n),lerp(b.y0,b.y1,i/n)); if(k>=0&&c.typ[k]===P4T.glass) C.glassT[k]=Math.max(C.glassT[k],0.15); } }
}
// what Ash does in his modes, after the engine moved him
function p4DiveAfter(p,dt,inp){
  P4.diveT+=dt; P4.air-=dt; p.onWater=false;
  const k=AREA?tCell(p.x,p.y):-1;
  if(!p4DeepAt(p.x,p.y)){ if(p4Surface(p,true)) return; }
  // currents push a diver too (Water Stride's push is the engine's own)
  if(AREA&&AREA.cave&&k>=0&&AREA.cave.typ[k]===TY.current&&!canWalkWater()){ const d=FLOW[AREA.cave.flow[k]]||FLOW[1]; tNudge(p,d[0]*175*dt,d[1]*175*dt); }
  // bubbles refill the air
  for(const o of p4Objs()) if(o.p4==='bubbles'&&p4BubOn(o)&&dist2(p.x,p.y,o.x,o.y)<(o.r+p.r)**2) p4AirFill(o);
  if(AREA&&AREA.p4) for(const o of AREA.p4.bubbles) if(p4BubOn(o)&&dist2(p.x,p.y,o.x,o.y)<(o.r+p.r)**2) p4AirFill(o);
  // underwater switches and chests
  for(const o of p4Objs()){ if(o.p4==='uswitch'&&!o.on&&dist(p.x,p.y,o.x,o.y)<o.r+p.r+4) p4SwitchOn(o); else if(o.p4==='uchest'&&!o.open&&dist(p.x,p.y,o.x,o.y)<o.r+p.r+20) p4ChestOpen(o,false); }
  if(AREA&&AREA.p4) for(const o of AREA.p4.under) if(o.k==='tswitch'&&!o.on&&dist(p.x,p.y,o.x,o.y)<o.r+p.r+6) trialSwitchOn(o);
  P4.bubT-=dt; if(P4.bubT<=0){ P4.bubT=rand(0.5,1.1); emit(p.x+Math.cos(p.facing)*12,p.y+Math.sin(p.facing)*12-4,randi(1,3),{col:'225,242,255',glow:false,ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.6,lmax:1.1,zmin:1.4,zmax:2.8,drag:1,rise:30,alpha:0.8}); }
  if(P4.air<p4AirMax()*0.3&&Math.floor(P4.air*2)!==Math.floor((P4.air+dt)*2)) p4Snd('bubble',0.6);
  if(P4.air<=0){ P4.air=0; p4Drown(p); }
}
const p4BubOn=o=>!o.on||!o.off||((G.time+(o.ph||0))%(o.on+o.off))<o.on;
function p4AirFill(o){ if(P4.air<p4AirMax()-0.5){ p4Snd('glub'); ftext(player.x,player.y-36,S('Air!','Air!'),'#d8f0ff',13); } P4.air=p4AirMax(); }
function p4SwitchOn(o){ o.on=true; if(o.timed) o.left=o.timed; else G.found[o.id]=1; p4Snd('click'); p4Snd('stone',0.5); emit(o.x,o.y,14,{col:'190,230,255',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.2,zmax:2.6}); shake(2); if(o.then) try{ o.then(o); }catch(e){ console.warn(e); } if(!o.timed) saveGame(); }
function p4ChestOpen(o,buried){
  o.open=true; G.found[o.id]=1; SFX.play('chest'); flashA=0.25; flashCol=buried?'255,226,160':'200,230,255'; shake(3);
  emit(o.x,o.y,26,{col:buried?'255,214,120':'200,236,255',ang:-Math.PI/2,spread:1.2,smin:40,smax:180,lmin:.4,lmax:1,zmin:1.5,zmax:3});
  const coins=o.coins!=null?o.coins:60; if(coins) addCoins(coins,o.x,o.y); if(o.xp) gainXp(o.xp);
  if(o.item) giveItems({[o.item]:1}); if(o.treat) G.pipTreats=Math.min(3,(G.pipTreats||0)+1);
  setBanner(buried?S('Buried treasure!','Buried treasure!'):S('Sunken treasure!','Sunken treasure!'),coins?`+${coins} ${S('coins','coins')}`:'',2);
  if(o.then) try{ o.then(o); }catch(e){ console.warn(e); } saveGame();
}
function p4BurrowAfter(p,dt,inp){
  P4.bm-=dt; p.onWater=false;
  const mv=Math.hypot(inp.mx||0,inp.my||0)>0.1; P4.idleT=mv?0:P4.idleT+dt;
  if(!p4SandAt(p.x,p.y)){ p4PopUp(p,true); return; }
  if(mv&&Math.random()<0.5) p4SandFx(p.x-Math.cos(p.facing)*10,p.y-Math.sin(p.facing)*10+4,1);
  if(mv&&Math.random()<dt*3) p4Snd('dig',0.25);
  // buried things
  for(const o of p4Objs()){ if(o.p4==='bswitch'&&!o.on&&dist(p.x,p.y,o.x,o.y)<o.r+p.r) p4SwitchOn(o); else if(o.p4==='bchest'&&!o.open&&dist(p.x,p.y,o.x,o.y)<30+p.r) p4ChestOpen(o,true); }
  if(AREA&&AREA.p4){ for(const o of AREA.p4.buried){ if(o.k==='tswitch'||o.k==='p4_hidden'){ if(!o.on&&dist(p.x,p.y,o.x,o.y)<o.r+p.r){ o.k='tswitch'; trialSwitchOn(o); } } else if(o.k==='p4_cbchest'&&!o.open&&dist(p.x,p.y,o.x,o.y)<30+p.r) p4CaveChest(AREA,o); } }
  p4SinkTick(p,dt,mv);
  if(P4.bm<=0){ P4.bm=0; p4PopUp(p,true); }
}
function p4CaveChest(A,o){
  o.open=true; G.found[o.id]=true; const lv=A.def.level||1; SFX.play('chest'); flashA=0.25; flashCol='255,226,160'; shake(3);
  emit(o.x,o.y,26,{col:'255,214,120',ang:-Math.PI/2,spread:1.2,smin:40,smax:180,lmin:.4,lmax:1,zmin:1.5,zmax:3});
  const g=o.gift;
  if(g==='skey'){ const kk='keys_'+caveDsid(A.def); G.found[kk]=(G.found[kk]||0)+1; jingle('item','chest'); setBanner(S('A small key!','A small key!'),S('It was buried in the sand.','It was in the sand!'),2); }
  else if(g==='treat'){ G.pipTreats=Math.min(3,(G.pipTreats||0)+1); setBanner(S('A Pip treat!','A Pip treat!'),S('Buried treasure, Pip style.','Yum!'),1.8); }
  else{ const coins=g&&g.coins!=null?g.coins:20+10*lv; addCoins(coins,o.x,o.y); gainXp(30+15*lv); setBanner(S('Buried treasure!','Buried treasure!'),`+${coins} ${S('coins','coins')}`,2); }
  saveGame();
}
// on foot (or swimming at the surface): quicksand, tendrils, moon-glass and moon ramps under him
function p4LandAfter(p,dt,inp){
  const mv=Math.hypot(inp.mx||0,inp.my||0)>0.1;
  p4SinkTick(p,dt,mv);
  p4GrabCheck(p);
  if(!AREA){
    const r=P4.ramps.length?p4RampAt(p.x,p.y):null; P4.onRamp=r&&p4RampSolid(r)?r:null;
    const g=p4GlassSolidAt(p.x,p.y); if(g) P4.wasGlass=true;
    else if(P4.wasGlass){ P4.wasGlass=false; if(!airborne()&&playerBlocked(p.x,p.y)) p4GlassDrop(p); }
  }
  if(P4.autoDive&&canDive()&&!P4.mode&&!P4.mv){ P4.autoDive=false; if(p4DeepAt(p.x,p.y)) p4DiveStart(p,null); }
  P4.autoDive=false;
  // gentle tips, the first times
  if(canDive()&&!P4.mode&&!P4.mv&&!airborne()&&(P4.swim||p.onWater)&&p4DeepAt(p.x,p.y)) p4Tip('deep',S('Deep water','Deep water'),S(`Deep water! Press ${p4Ctl().roll} to dive under it.`,`Press ${p4Ctl().roll} to dive!`),1);
  if(canBurrow()&&!P4.mode&&!P4.mv&&!airborne()&&mv&&p4SandAt(p.x,p.y)) p4Tip('sand',S('Soft sand','Soft sand'),S(`Soft sand! Press ${p4Ctl().roll} to dig in.`,`Press ${p4Ctl().roll} to dig in!`),1);
  if(canDive()&&!P4.mode&&!P4.mv){ const pool=p4PoolAt(p.x,p.y); if(pool) p4Say(pool.x,pool.y-46,pool.area?(pool.label||S('Dive in','Dive in')):S(`${p4Ctl().roll}: dive in`,`${p4Ctl().roll}: dive`),'#e6dcff','pool',2.4); }
  else if(!canDive()&&!P4.mode&&!P4.mv&&!airborne()){ const pool=p4PoolAt(p.x,p.y);
    if(pool) p4Say(pool.x,pool.y-46,pool.kind==='water'?S('It’s too deep. You’d need to breathe water.','Too deep! You need to breathe water.'):S('A pool of shadow. It goes down a long way.','A deep, dark pool.'),'#cfd8ee','nopool_'+pool.id,3); }
}
const p4Calm=(inp,keep)=>Object.assign({},inp,{attack:keep&&keep.attack?inp.attack:false,fire:keep&&keep.fire?inp.fire:false,jump:false,jumpHeld:false,roll:false,use:keep&&keep.use?inp.use:false,drink:keep&&keep.drink?inp.drink:false,whistle:false,roar:false});
{ const base=updatePlayer; updatePlayer=function(dt,inp){
  const p=player; if(!p||!G) return base(dt,inp);
  p4Sync(p); P4.inp=inp; p4WorldTick(p,dt);
  try{
    if(P4.mv){ p4Tick(p,dt); p4MoveStep(p,dt,inp); return; }
    if(G.dashBuf>0&&p4RollTakes()){ G.dashBuf=0; p4RollAct(p,inp); if(P4.mv){ p4Tick(p,dt); return; } }
    if(P4.mode==='dive'){
      if(typeof MV!=='undefined'){ MV.steamT=MV.rippleT=MV.hissT=1; }
      base(dt,p4Calm(inp,{attack:true,fire:true,use:true,drink:true})); p4DiveAfter(p,dt,inp); return; }
    if(P4.mode==='burrow'){
      if(typeof MV!=='undefined'){ MV.steamT=MV.rippleT=MV.hissT=1; }
      const s0=p.stats.speed; p.stats.speed=s0*p4BurSpd(); try{ base(dt,p4Calm(inp,{drink:true})); } finally{ p.stats.speed=s0; } p4BurrowAfter(p,dt,inp); return; }
    const sw=canDive()&&!airborne()&&p4SwimNeed(p);
    P4.swim=sw;
    if(sw){ if(typeof MV!=='undefined'){ MV.steamT=MV.rippleT=MV.hissT=1; } const s0=p.stats.speed; p.stats.speed=s0*P4N.swimK; try{ base(dt,p4Calm(inp,{attack:true,fire:true,use:true,drink:true})); } finally{ p.stats.speed=s0; }
      if(Math.random()<dt*(p.moving?4:1.2)) G.ripples.push({x:p.x+rand(-3,3),y:p.y-2,t:0,max:0.9,r:p.moving?18:14}); p4LandAfter(p,dt,inp); return; }
    const sk=!P4.mode&&!airborne()?p4SinkAt(p.x,p.y):0;
    if(sk){ const s0=p.stats.speed; p.stats.speed=s0*0.62; try{ base(dt,inp); } finally{ p.stats.speed=s0; } }
    else base(dt,inp);
    p4LandAfter(p,dt,inp);
  } finally{ P4.lx=p.x; P4.ly=p.y; }
}; }
// the moon-glass faded under Ash: a splash, and back to real ground (never onto other glass that is about to fade)
function p4GlassDrop(p){
  let s=null; P4.noGlass=true;
  try{ s=p4FreeNear(p.x,p.y); if(!s) for(let d=232;d<700&&!s;d+=24){ const n=Math.round(d/10); for(let i=0;i<n;i++){ const a=i/n*TAU, px=p.x+Math.cos(a)*d, py=p.y+Math.sin(a)*d; if(p4StandOK(px,py)){ s={x:px,y:py}; break; } } } }
  finally{ P4.noGlass=false; }
  if(s){ p.safeX=s.x; p.safeY=s.y; }
  const T0=T(p.x,p.y,{}); backToSafe(p,T0.water?'water':'block'); P4.safe=null;
}
// is Ash floating at the surface (water that would not hold him without Dive)
function p4SwimNeed(p){
  if(AREA){ if(!AREA.cave||!AREA.tri) return false; const k=tCell(p.x,p.y); return k>=0&&tWet(k)&&!canWalkWater(); }
  if(!p4SwimAt(p.x,p.y)) return false;
  if(p4GlassSolidAt(p.x,p.y)) return false;
  if(!canWalkWater()) return true;
  return mapStrideBlocked(p.x,p.y);
}
// the other powers wait while Ash dives or digs
if(typeof canClaws==='function'){ const base=canClaws; canClaws=function(){ if(P4.mode||P4.mv) return false; return base(); }; }
if(typeof canGrapple==='function'){ const base=canGrapple; canGrapple=function(){ if(P4.mode||P4.mv) return false; return base(); }; }
if(typeof canShadow==='function'){ const base=canShadow; canShadow=function(){ if(P4.mode||P4.mv) return false; return base(); }; }
// terrain for Ash: under water he stays in deep water; underground in sand; with Dive he floats on any water;
// lit moon-glass holds him up; an unlit moon ramp is a wall
{ const base=playerBlocked; playerBlocked=function(x,y){
  const p=player;
  if(G&&p&&!(p.flying||(p.z||0)>0)){
    if(P4.mode==='dive'){ if(x>=IZX-50) return base(x,y); if(p4DeepAt(x,y)) return false; if(p4SwimAt(x,y)) return false; return base(x,y); }
    if(P4.mode==='burrow'){ if(x>=IZX-50) return base(x,y); if(p4SandAt(x,y)) return false; return base(x,y); }
    if(x<IZX-50){
      if(P4.ramps.length&&p4RampBlock(x,y)) return true;
      if(P4.glass.length&&p4GlassSolidAt(x,y)) return false;
      if(canDive()&&!P4.mv&&p4SwimAt(x,y)) return false; } }
  return base(x,y);
}; }
{ const base=blockedAt; blockedAt=function(x,y){ if(x<IZX-50){ if(P4.ramps.length&&p4RampBlock(x,y)) return true; if(P4.glass.length&&p4GlassSolidAt(x,y)) return false; } return base(x,y); }; }
{ const base=landBad; landBad=function(x,y){ if(canDive()&&x<IZX-50&&p4SwimAt(x,y)) return null; if(P4.glass.length&&p4GlassSolidAt(x,y)) return null; return base(x,y); }; }
{ const base=landOK; landOK=function(x,y){ if(x<IZX-50&&((canDive()&&p4SwimAt(x,y))||(P4.glass.length&&p4GlassSolidAt(x,y)))){ let hit=false; const r=(player&&player.r)||14; forCols(x,y,r+2,c=>{ if(hit||!colActive(c)) return; if(c.t==='c'){ if(dist2(x,y,c.x,c.y)<(c.r+r)**2) hit=true; } else if(x>c.x0-r&&x<c.x1+r&&y>c.y0-r&&y<c.y1+r) hit=true; }); if(!hit&&!(elevFace(x,y)&EF.FACE)) return true; } return base(x,y); }; }
{ const base=collideObs; collideObs=function(e){ if(e===player&&player&&P4.mode==='burrow'){ p4CollideDeep(e); return; } return base(e); }; }
{ const base=separate; separate=function(){ const p=player; if(p&&(P4.mode||P4.mv)){ const x=p.x, y=p.y; base(); p.x=x; p.y=y; return; } base(); }; }
{ const base=footprint; footprint=function(){ if(P4.mode||P4.swim) return; return base.apply(this,arguments); }; }
// under the sand nothing reaches Ash (unless a module forces it with p4Hurt); under water only things in the water do
{ const base=hurtPlayer; hurtPlayer=function(amt,sx,sy,kb){
  if(!P4.force&&player&&!player.dead){
    if(P4.mode==='burrow') return false;
    if(P4.mode==='dive'&&sx!=null&&HURT_SRC!=='lava'&&!p4DeepAt(sx,sy)) return false;
    if(P4.mv&&(P4.mv.kind==='pool'||P4.mv.kind==='pooldoor'||P4.mv.kind==='dig'||P4.mv.kind==='drown')) return false; }
  const r=base(amt,sx,sy,kb);
  if(r&&P4.force&&P4.mode==='burrow'&&player&&!player.dead) p4PopUp(player,true);
  return r; }; }
function p4Hurt(amt,sx,sy,kb){ P4.force=true; try{ return hurtPlayer(amt,sx,sy,kb); } finally{ P4.force=false; } }
// prompts: under water only underwater things, underground only buried things
{ const base=updateInteractions; updateInteractions=function(dt){
  base(dt);
  if(!G||!player||!G.prompt) return;
  if(P4.mv){ G.prompt=null; return; }
  if(P4.mode==='dive'&&!p4DeepAt(G.prompt.x,G.prompt.y)) G.prompt=null;
  else if(P4.mode==='burrow') G.prompt=null;
}; }
// the Moonfire swap: O on the keyboard, the fire trigger plus its bumper on a controller, the moon chip on touch
{ const base=readInput; readInput=function(dt){
  const o=base(dt);
  const sw=pressed.has('KeyO')||pressed.has('Numpad4')||P4.padSwap||P4.touchSwap; P4.padSwap=false; P4.touchSwap=false;
  if(sw&&scene==='play'&&G&&player&&!player.dead) p4MoonToggle();
  return o; }; }
{ const base=padPlayUI; padPlayUI=function(s,dt){
  let chord=false;
  try{ const fi=padSw(PB.L2), bi=padSw(PB.L1); chord=!!(G&&G.mode==='story'&&canMoon()&&s.cur[fi]&&s.ed[bi]); }catch(e){}
  base(s,dt);
  if(chord){ P4.padSwap=true; const j=padSw(PB.L1)-PB.L1; PAD.sh[j]=-1; PAD.q.wP=false; PAD.q.wN=false; }
}; }
// breath: Moonfire when the mode is on; under water plain fire is only bubbles
{ const base=doBreath; doBreath=function(dt){
  if(p4MoonOn()){ p4MoonBreath(dt); return; }
  if(P4.mode==='dive'){ p4BubbleBreath(dt); return; }
  return base(dt); }; }
{ const base=breathWorld; breathWorld=function(mx,my,ang,dt){ base(mx,my,ang,dt); try{ p4FireWorld(mx,my,ang,dt); }catch(e){ console.warn(e); } }; }
// the moment Ash gets one of the three powers
{ const base=grantAbility; grantAbility=function(id){
  const had=!!(G&&G.abil&&G.abil[id]); base(id);
  if(had||!player||(id!=='dive'&&id!=='burrow'&&id!=='moonfire')) return;
  const p=player;
  if(id==='dive'){ p4Splash(p.x,p.y,true); for(let i=0;i<20;i++) emit(p.x+rand(-16,16),p.y+rand(-10,10),1,{col:'225,242,255',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:90,lmin:.6,lmax:1.2,zmin:1.6,zmax:3.6,drag:1,rise:30}); p4Snd('glub'); P4.air=p4AirMax(); }
  if(id==='burrow'){ p4SandFx(p.x,p.y,30); p4Snd('dig'); }
  if(id==='moonfire'){ G.flags.p4mf=1; p4Snd('moon'); for(let i=0;i<30;i++){ const a=i/30*TAU; emit(p.x+Math.cos(a)*16,p.y+Math.sin(a)*12-10,1,{col:'214,226,255',ang:a,spread:0.2,smin:50,smax:150,lmin:.3,lmax:.7,zmin:1.4,zmax:3}); } }
}; }

// ---------- 9. drawing
// Ash: hidden while he dives (drawn over the water layer instead), a mound while he burrows, half sunk while he swims
{ const base=drawPlayer; drawPlayer=function(){
  const p=player; if(!p||p.dead||!G) return base();
  const M=P4.mv;
  if(P4.mode==='dive'||(M&&(M.kind==='drown'||(M.kind==='pool'&&M.t>P4N.poolIn*0.7&&M.t<M.dur-P4N.poolOut*0.4)||(M.kind==='pooldoor'&&M.t>M.dur*0.7)))) return;
  if(M&&M.kind==='plunge'){ const k=M.t/M.dur; if(k>0.62) return; p4DrawSunk(p,base,k>0.3?(k-0.3)/0.32*26:0,'water'); return; }
  if(M&&M.kind==='rise'){ p4DrawSunk(p,base,(1-M.t/M.dur)*22,'water'); return; }
  if(M&&(M.kind==='pool'||M.kind==='pooldoor')){ const a=P4N.poolIn, k=M.t<a?M.t/a:M.kind==='pool'?1-(M.t-(M.dur-P4N.poolOut))/P4N.poolOut:1; p4DrawSunk(p,base,clamp(k,0,1)*30,M.o&&M.o.kind==='water'?'water':'shadow'); return; }
  if(P4.mode==='burrow'||(M&&M.kind==='dig'&&M.t>M.dur*0.55)){ p4DrawMound(p); return; }
  if(M&&M.kind==='dig'){ p4DrawSunk(p,base,M.t/M.dur/0.55*24,'sand'); return; }
  if(M&&M.kind==='grab'){ base(); p4DrawGrabbed(p,M); return; }
  if(P4.swim&&!airborne()){ p4DrawSunk(p,base,13,'water'); return; }
  if(P4.sinkOn&&P4.sinkT>0.05&&!airborne()){ p4DrawSunk(p,base,4+P4.sinkT/P4N.sinkT*18,'sand'); return; }
  base(); }; }
// Ash with his lower body under the water (or sand, or a shadow pool): the figure clipped at the surface, and a ring
function p4DrawSunk(p,base,depth,kind){
  const wl=p.y+6-depth;
  ctx.save(); ctx.beginPath(); ctx.rect(p.x-120,p.y-260,240,260-(p.y-wl)); ctx.clip(); base(); ctx.restore();
  const t=G.time, w=17+Math.sin(t*5)*1.2;
  if(kind==='water'){ ctx.save(); ctx.fillStyle='rgba(30,90,140,.32)'; ctx.beginPath(); ctx.ellipse(p.x,wl,w+3,7,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(235,248,255,.85)'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.ellipse(p.x,wl,w,6,0,0,TAU); ctx.stroke(); ctx.strokeStyle='rgba(235,248,255,.35)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(p.x,wl,w+7+Math.sin(t*3)*2,9,0,0,TAU); ctx.stroke(); ctx.restore(); }
  else if(kind==='sand'){ const col=p4SandCol(); ctx.save(); ctx.fillStyle=`rgba(${col},.95)`; ctx.beginPath(); ctx.ellipse(p.x,wl+1,w+2,7,0,0,TAU); ctx.fill(); ctx.strokeStyle=LOOK.sb?SBC.outline:'rgba(60,40,20,.6)'; ctx.globalAlpha=0.5; ctx.lineWidth=1.6; ctx.stroke(); ctx.restore(); }
  else{ ctx.save(); ctx.fillStyle='rgba(40,20,70,.75)'; ctx.beginPath(); ctx.ellipse(p.x,wl,w+4,7,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(190,150,255,.7)'; ctx.lineWidth=1.8; ctx.stroke(); ctx.restore(); }
}
// burrowed: a mound of sand that moves, two little horns poking out (and two eyes peeking when he stops)
function p4DrawMound(p){
  const t=G.time, f=p.facing, mv=p.moving, col=p4SandCol(), rgb=col.split(',').map(Number), base=`rgb(${col})`;
  const lite=`rgb(${mixRGB(rgb,[255,250,226],0.35).map(v=>v|0).join(',')})`, dark=`rgb(${mixRGB(rgb,[58,30,72],0.32).map(v=>v|0).join(',')})`;
  const bob=mv?Math.sin(t*16)*1.2:Math.sin(t*3)*0.5, sx=1+(mv?Math.sin(t*16)*0.05:0);
  ctx.save(); ctx.translate(p.x,p.y+2);
  // the furrow behind him
  ctx.save(); ctx.rotate(f); ctx.fillStyle=`rgba(${mixRGB(rgb,[58,30,72],0.25).map(v=>v|0).join(',')},.35)`; ctx.beginPath(); ctx.ellipse(-16,0,20,8,0,0,TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle='rgba(40,20,30,.22)'; ctx.beginPath(); ctx.ellipse(2,6,20,8,0,0,TAU); ctx.fill();
  ctx.translate(0,bob); ctx.scale(sx,1);
  // a dome of sand: a dark rim, the body raised a little, a bright top, loose clumps round the foot
  const body=g=>{ g.beginPath(); g.moveTo(-23,3); g.bezierCurveTo(-22,-12,-10,-17,0,-17); g.bezierCurveTo(10,-17,22,-12,23,3); g.ellipse(0,3,23,8,0,0,Math.PI); g.closePath(); };
  if(LOOK.sb){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=3.2; ctx.lineJoin='round'; body(ctx); ctx.stroke(); }
  body(ctx); ctx.fillStyle=dark; ctx.fill();
  ctx.fillStyle=base; ctx.beginPath(); ctx.moveTo(-20,1); ctx.bezierCurveTo(-19,-11,-9,-15,0,-15); ctx.bezierCurveTo(9,-15,19,-11,20,1); ctx.ellipse(0,1,20,6,0,0,Math.PI); ctx.closePath(); ctx.fill();
  ctx.fillStyle=lite; ctx.beginPath(); ctx.ellipse(-6,-9,9,4,-0.25,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,252,236,.6)'; ctx.beginPath(); ctx.ellipse(-9,-10.5,3.4,1.5,-0.25,0,TAU); ctx.fill();
  // cracks and grains
  ctx.strokeStyle=`rgba(${mixRGB(rgb,[58,30,72],0.5).map(v=>v|0).join(',')},.55)`; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-12,-2); ctx.lineTo(-6,-5); ctx.lineTo(-2,-3); ctx.moveTo(6,-1); ctx.lineTo(11,-4); ctx.moveTo(-3,2); ctx.lineTo(2,0); ctx.stroke();
  for(let i=0;i<6;i++){ const a=Math.PI*(0.08+i*0.17)+(mv?Math.sin(t*9+i)*0.05:0), cx=Math.cos(a)*22, cy=4+Math.sin(a)*6.5, r=2.2+(i%3)*0.9;
    if(LOOK.sb){ ctx.fillStyle=SBC.outline; ctx.beginPath(); ctx.arc(cx,cy,r+1.2,0,TAU); ctx.fill(); }
    ctx.fillStyle=i%2?base:lite; ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.fill(); }
  // horns (and eyes when he waits)
  const hx=Math.cos(f)*7, hy=Math.sin(f)*4-12, px=-Math.sin(f), py=Math.cos(f)*0.6, wig=mv?Math.sin(t*20)*1.2:Math.sin(t*4)*0.6;
  for(const s of [-1,1]){ const bx=hx+px*5*s, by=hy+py*5*s; ctx.fillStyle=LOOK.sb?SBC.outline:'#3a2418'; ctx.beginPath(); ctx.moveTo(bx-2.6,by+2); ctx.lineTo(bx+wig*s*0.6+s*1.4,by-10.5); ctx.lineTo(bx+2.6,by+2); ctx.closePath(); ctx.fill(); ctx.fillStyle='#f4e6c6'; ctx.beginPath(); ctx.moveTo(bx-1.6,by+1.2); ctx.lineTo(bx+wig*s*0.6+s*1.2,by-8.6); ctx.lineTo(bx+1.6,by+1.2); ctx.closePath(); ctx.fill(); }
  if(P4.idleT>0.6){ const k=clamp((P4.idleT-0.6)*4,0,1); for(const s of [-1,1]){ const ex=hx*0.9+px*2.6*s, ey=hy+5+py*2.6*s; ctx.fillStyle=`rgba(255,240,170,${k})`; ctx.beginPath(); ctx.arc(ex,ey,1.9,0,TAU); ctx.fill(); ctx.fillStyle=`rgba(40,20,20,${k})`; ctx.beginPath(); ctx.arc(ex+Math.cos(f)*0.5,ey,0.9,0,TAU); ctx.fill(); } }
  ctx.restore();
  if(p.hurtFlash>0){ ctx.save(); ctx.globalAlpha=0.6; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(p.x,p.y-3,22,14,0,0,TAU); ctx.fill(); ctx.restore(); }
}
// tendrils wrapped round Ash while they hold him
function p4DrawGrabbed(p,M){ const t=G.time; ctx.save(); ctx.lineCap='round'; for(let i=0;i<3;i++){ const a=t*2+i*2.1, y0=p.y-6-i*9; ctx.strokeStyle=LOOK.sb?SBC.outline:'#14081e'; ctx.lineWidth=6; ctx.beginPath(); ctx.ellipse(p.x,y0,15+Math.sin(a)*1.5,5,0,0.2,Math.PI*1.8); ctx.stroke(); ctx.strokeStyle='#3a2458'; ctx.lineWidth=3.6; ctx.stroke(); ctx.strokeStyle='rgba(160,120,230,.6)'; ctx.lineWidth=1.2; ctx.stroke(); } ctx.restore(); }
// Ash under the water: a swimming shape in deep blue, tail and paddles going, bubbles from his snout
function p4DrawSwimmer(p,x,y,alpha){
  const t=G.time, f=p.facing, mv=p.moving||(P4.mv&&P4.mv.kind==='pool'), sw=Math.sin(t*(mv?11:4)), sb=LOOK.sb;
  ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.translate(x,y); ctx.rotate(f);
  glowAt(0,0,34,P4.mode==='dive'&&p4MoonOn()&&p.breathing?'200,214,255':'120,200,255',0.22);
  const ol=sb?SBC.outline:'rgba(10,30,50,.8)';
  // tail
  ctx.lineCap='round'; ctx.lineJoin='round';
  const tail=g=>{ g.beginPath(); g.moveTo(-10,0); g.quadraticCurveTo(-22,sw*7,-34,sw*-5); };
  ctx.strokeStyle=ol; ctx.lineWidth=9; tail(ctx); ctx.stroke(); ctx.strokeStyle='#2e6f96'; ctx.lineWidth=5.5; tail(ctx); ctx.stroke();
  ctx.fillStyle='#2e6f96'; ctx.beginPath(); ctx.moveTo(-34,sw*-5); ctx.lineTo(-42,sw*-5-6); ctx.lineTo(-40,sw*-5+5); ctx.closePath(); ctx.fill(); ctx.strokeStyle=ol; ctx.lineWidth=1.6; ctx.stroke();
  // paddling arms and legs
  for(const s of [-1,1]){ const k=Math.sin(t*(mv?9:3)+(s>0?0:Math.PI)); ctx.strokeStyle=ol; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(4,s*7); ctx.lineTo(9+k*3,s*(14+k*2)); ctx.stroke(); ctx.strokeStyle='#3c86ad'; ctx.lineWidth=3.4; ctx.stroke();
    ctx.strokeStyle=ol; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(-8,s*6); ctx.lineTo(-14-k*3,s*(12-k*2)); ctx.stroke(); ctx.strokeStyle='#3c86ad'; ctx.lineWidth=3.4; ctx.stroke(); }
  // body and head
  const body=g=>{ g.beginPath(); g.ellipse(-2,0,15,9.5,0,0,TAU); };
  ctx.strokeStyle=ol; ctx.lineWidth=3.2; body(ctx); ctx.stroke(); ctx.fillStyle='#2b6a92'; body(ctx); ctx.fill();
  ctx.fillStyle='#4a98c0'; ctx.beginPath(); ctx.ellipse(-3,-2.5,11,5.5,0,0,TAU); ctx.fill();
  ctx.strokeStyle=ol; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(13,0,8,0,TAU); ctx.stroke(); ctx.fillStyle='#2f74a0'; ctx.beginPath(); ctx.arc(13,0,8,0,TAU); ctx.fill();
  ctx.fillStyle='#5aa8cf'; ctx.beginPath(); ctx.ellipse(12,-2.6,5,3,0,0,TAU); ctx.fill();
  for(const s of [-1,1]){ ctx.fillStyle=ol; ctx.beginPath(); ctx.moveTo(9,s*4); ctx.lineTo(1,s*11); ctx.lineTo(6,s*3); ctx.closePath(); ctx.fill(); ctx.fillStyle='#d8eef6'; ctx.beginPath(); ctx.moveTo(8.4,s*4); ctx.lineTo(2.6,s*9.4); ctx.lineTo(6.4,s*3.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffd34d'; ctx.beginPath(); ctx.arc(16,s*3.2,1.8,0,TAU); ctx.fill(); }
  ctx.restore();
  // the caustic shimmer on his back
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=(alpha==null?1:alpha)*(0.18+0.1*Math.sin(t*4)); ctx.fillStyle='#bfe8ff'; ctx.beginPath(); ctx.ellipse(x-Math.cos(f)*2,y-Math.sin(f)*2-3,9,4,f,0,TAU); ctx.fill(); ctx.restore();
}
// the underwater layer: the world above fades behind a blue tint, light ripples, rays from the surface; then what lies
// under the water (switches, chests, bubbles), the swimming foes, and Ash
let P4CAU=null;
function p4Caustics(){ if(P4CAU) return P4CAU; const s=256, cv=mkCanvas(s,s), g=cv.getContext('2d'), rng=mulberry32(4407); g.strokeStyle='rgba(200,240,255,1)'; g.lineCap='round'; g.lineJoin='round';
  // soft wobbly rings (drawn 9 times shifted so the tile wraps without seams)
  const rings=[]; for(let i=0;i<58;i++) rings.push({x:rng()*s,y:rng()*s,r:8+rng()*20,w:0.7+rng()*1.5,ph:rng()*TAU,n:5+Math.floor(rng()*3)});
  for(const q of rings){ g.lineWidth=q.w; g.globalAlpha=0.55+0.45*(q.w/2.2);
    for(const dx of [-s,0,s]) for(const dy of [-s,0,s]){ const cx=q.x+dx, cy=q.y+dy; if(cx<-40||cx>s+40||cy<-40||cy>s+40) continue;
      const pts=[]; for(let k=0;k<q.n;k++){ const a=k/q.n*TAU+q.ph, rr=q.r*(0.7+0.45*Math.sin(a*2+q.ph*3)); pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*0.72]); }
      g.beginPath(); for(let k=0;k<=q.n;k++){ const A=pts[k%q.n], B=pts[(k+1)%q.n], mx=(A[0]+B[0])/2, my=(A[1]+B[1])/2; if(k===0) g.moveTo(mx,my); else g.quadraticCurveTo(A[0],A[1],mx,my); } g.stroke(); } }
  g.globalAlpha=1; return P4CAU=cv; }
function p4DrawUnderwater(t){
  const x0=cam.x-20, y0=cam.y-20, w=W/zoom+40, h=H/zoom+40, p=player;
  ctx.save();
  ctx.fillStyle=LOOK.sb?'rgba(22,76,124,.56)':'rgba(10,40,70,.6)'; ctx.fillRect(x0,y0,w,h);
  // rays from the surface
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){ const ph=t*0.25+i*1.7, rx=x0+((i*0.27+Math.sin(ph)*0.05)%1)*w; const gr=ctx.createLinearGradient(rx,y0,rx+90,y0+h); gr.addColorStop(0,'rgba(170,230,255,.10)'); gr.addColorStop(1,'rgba(170,230,255,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(rx,y0); ctx.lineTo(rx+60+Math.sin(ph)*20,y0); ctx.lineTo(rx+200,y0+h); ctx.lineTo(rx+80,y0+h); ctx.closePath(); ctx.fill(); }
  // caustic ripples (one tile, scrolled)
  const cv=p4Caustics();
  for(const L of [{s:256,vx:12,vy:7,a:0.042},{s:330,vx:-9,vy:11,a:0.03}]){ const s=L.s, ox=((t*L.vx)%s+s)%s, oy=((t*L.vy)%s+s)%s;
    ctx.globalAlpha=L.a+0.015*Math.sin(t*1.3+L.vx);
    for(let yy=Math.floor((y0-oy)/s)*s+oy;yy<y0+h;yy+=s) for(let xx=Math.floor((x0-ox)/s)*s+ox;xx<x0+w;xx+=s) ctx.drawImage(cv,xx,yy,s,s); }
  // deeper blue at the edges of the view
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  { const cx=x0+w/2, cy=y0+h/2, gr=ctx.createRadialGradient(cx,cy,Math.min(w,h)*0.3,cx,cy,Math.max(w,h)*0.62); gr.addColorStop(0,'rgba(8,34,66,0)'); gr.addColorStop(1,'rgba(8,34,66,.42)'); ctx.fillStyle=gr; ctx.fillRect(x0,y0,w,h); }
  ctx.restore();
  // things under the water, bright
  for(const o of p4Objs()){ const K=P4K[o.p4]; if(K&&K.under&&inView(o.x,o.y,120)) K.under(o,t); }
  if(AREA&&AREA.p4){ const C=AREA.p4; for(const o of C.bubbles) if(inView(o.x,o.y,60)) p4DrawBubbles(o,t,true); for(const o of C.under) if(inView(o.x,o.y,60)) p4DrawCaveUnder(o,t); }
  for(const e of G.enemies){ if(e.dead||e.frozen||!inView(e.x,e.y,60)) continue; const d=EDEF[e.type]; if(d&&d.swim&&p4DeepAt(e.x,e.y)) drawEnemy(e); }
  // Ash
  if(p&&!p.dead){ const M=P4.mv; let a=1, x=p.x, y=p.y;
    if(M&&M.kind==='plunge') a=clamp((M.t/M.dur-0.4)/0.4,0,1);
    if(M&&M.kind==='drown') a=M.t<0.35?1-M.t/0.35*0.5:0.6;
    p4DrawSwimmer(p,x,y,a); }
}
// a dungeon chest or switch seen from under the water
function p4CaveUnderWash(t){ ctx.save(); for(const o of AREA.p4.under){ if(!inView(o.x,o.y,40)) continue; ctx.fillStyle='rgba(40,116,176,.5)'; ctx.beginPath(); ctx.ellipse(o.x,o.y-4,27,19,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(225,245,255,.4)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(o.x-18,o.y-8+Math.sin(t*2+o.x)*2); ctx.quadraticCurveTo(o.x,o.y-14,o.x+18,o.y-8+Math.sin(t*2+o.x+1)*2); ctx.stroke(); } ctx.restore(); }
function p4DrawCaveUnder(o,t){ try{ drawFurn(o.vis||o,t); }catch(e){} if(o.k==='tswitch'){ const lit=o.on; glowAt(o.x,o.y,lit?40:24,lit?'150,230,255':'120,190,230',lit?0.55:0.25); return; } if(G.found[o.id]) return; glowAt(o.x,o.y,30,'200,236,255',0.3+0.12*Math.sin(t*3)); }
// burrowed: buried things glow through the sand, and the sand presses in at the edges
let P4VIG=null;
function p4DrawUnderSand(t){
  for(const o of p4Objs()){ const K=P4K[o.p4]; if(K&&K.buried&&inView(o.x,o.y,80)) K.buried(o,t); }
  if(AREA&&AREA.p4) for(const o of AREA.p4.buried){ if((o.k==='p4_cbchest'&&!o.open)||((o.k==='tswitch'||o.k==='p4_hidden')&&!o.on)){ glowAt(o.x,o.y,30,'255,220,140',0.3+0.15*Math.sin(t*4)); } }
  if(!P4VIG){ const s=128, cv=mkCanvas(s,s), g=cv.getContext('2d'), gr=g.createRadialGradient(s/2,s/2,s*0.28,s/2,s/2,s*0.62); gr.addColorStop(0,'rgba(120,84,40,0)'); gr.addColorStop(1,'rgba(120,84,40,.5)'); g.fillStyle=gr; g.fillRect(0,0,s,s); P4VIG=cv; }
  ctx.save(); ctx.globalAlpha=0.8; ctx.drawImage(P4VIG,cam.x-30,cam.y-30,W/zoom+60,H/zoom+60); ctx.restore();
}
// meters over Ash: air (a ring of bubbles) and the dig meter
function p4Meter(x,y,f,col,icon){
  const t=G.time, low=f<0.3, r=11;
  ctx.save(); ctx.lineCap='round';
  ctx.fillStyle=LOOK.sb?'rgba(59,34,51,.72)':'rgba(10,10,20,.6)'; ctx.beginPath(); ctx.arc(x,y,r+3,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.14)'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.stroke();
  ctx.strokeStyle=low?(Math.sin(t*14)>0?'#ff7a6a':'#ffd0c0'):col; ctx.lineWidth=3.4; ctx.beginPath(); ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+TAU*clamp(f,0,1)); ctx.stroke();
  if(icon==='air'){ ctx.strokeStyle='#e6f6ff'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(x-2,y+1,3.6,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x+3,y-3,2,0,TAU); ctx.stroke(); }
  else { ctx.fillStyle='#f4e2b4'; ctx.beginPath(); ctx.moveTo(x-5,y+4); ctx.quadraticCurveTo(x,y-6,x+5,y+4); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function p4DrawMeters(t){
  const p=player; if(!p||p.dead) return;
  const am=p4AirMax(), bm=p4BurMax();
  if(P4.mode==='dive'||P4.air<am-0.05) p4Meter(p.x,p.y-(P4.mode==='dive'?40:62),P4.air/am,'#9fe0ff','air');
  if(P4.mode==='burrow'||P4.bm<bm-0.05) p4Meter(p.x+(P4.mode==='burrow'?0:26),p.y-(P4.mode==='burrow'?34:62),P4.bm/bm,'#ffd47a','dig');
}
{ const base=drawAirborneHook; drawAirborneHook=function(){
  base();
  if(!G||!player) return; const t=G.time;
  try{
    p4DrawBeams(t);
    if(P4.mode==='dive'||(P4.mv&&P4.mv.under&&!(P4.mv.kind==='plunge'&&P4.mv.t<P4.mv.dur*0.45))) p4DrawUnderwater(t);
    else if(P4.mode==='burrow') p4DrawUnderSand(t);
    if(P4.mode!=='dive'&&AREA&&AREA.p4&&AREA.p4.under.length) p4CaveUnderWash(t);
    p4DrawMoonArcs(t);
    for(const g of P4.wake){ if(!inView(g.x,g.y,40)) continue; ctx.save(); ctx.globalAlpha=g.a*0.6; ctx.fillStyle=g.k==='water'?'#1c5a86':'#2a1640'; ctx.beginPath(); ctx.ellipse(g.x,g.y,14,7,0,0,TAU); ctx.fill(); ctx.restore(); }
    p4DrawMeters(t);
  }catch(e){ console.error(e); }
}; }
// a foe knocked up by the pop-up uppercut floats a moment
{ const base=drawEnemy; drawEnemy=function(e){ if(e&&e.p4upT>0){ const k=e.p4upT/0.75, h=Math.sin(Math.PI*(1-k))*26; ctx.save(); ctx.translate(0,-h); try{ base(e); } finally{ ctx.restore(); } return; } return base(e); }; }
// the Moonfire cone: a soft silver light with ripples running out along it
function p4DrawMoonArcs(t){
  if(!P4.arcs.length||!player||!player.breathing) return; const a=P4.arcs[P4.arcs.length-1]; if(!inView(a.x,a.y,a.R+20)) return;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const gr=ctx.createRadialGradient(a.x,a.y,8,a.x,a.y,a.R); gr.addColorStop(0,'rgba(206,218,255,.22)'); gr.addColorStop(0.55,'rgba(170,186,255,.1)'); gr.addColorStop(1,'rgba(150,140,255,0)');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.arc(a.x,a.y,a.R,a.ang-a.half,a.ang+a.half); ctx.closePath(); ctx.fill();
  ctx.lineCap='round';
  for(let i=0;i<3;i++){ const r=((t*260+i*a.R/3)%a.R), k=r/a.R; if(r<24) continue; ctx.strokeStyle=`rgba(232,238,255,${(0.32*(1-k)).toFixed(3)})`; ctx.lineWidth=2.2-k; ctx.beginPath(); ctx.arc(a.x,a.y,r,a.ang-a.half*0.85,a.ang+a.half*0.85); ctx.stroke(); }
  ctx.restore();
}
// moonbeams glow
function p4DrawBeams(t){
  if(!P4.beams.length) return; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  for(const b of P4.beams){ if(!inView((b.x0+b.x1)/2,(b.y0+b.y1)/2,dist(b.x0,b.y0,b.x1,b.y1)/2+40)) continue;
    for(const [w,a] of [[b.w*1.6,0.07],[b.w*0.8,0.18],[b.w*0.25,0.7]]){ ctx.strokeStyle=`rgba(210,222,255,${a*(0.85+0.15*Math.sin(t*7))})`; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(b.x0,b.y0); ctx.lineTo(b.x1,b.y1); ctx.stroke(); }
    glowAt(b.x1,b.y1,30,'210,222,255',0.4); }
  ctx.restore();
}

// ---- world object art
function p4Wash(x,y,rx,ry){ ctx.save(); ctx.fillStyle='rgba(40,110,170,.42)'; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,TAU); ctx.fill(); ctx.restore(); }
function p4DrawArch(o,t){
  const vert=(o.y1-o.y0)>(o.x1-o.x0), sb=LOOK.sb, L=vert?o.y1-o.y0:o.x1-o.x0, T2=vert?o.x1-o.x0:o.y1-o.y0;
  ctx.save(); ctx.translate(o.x,o.y); if(vert) ctx.rotate(Math.PI/2);
  // dark water through the opening, then the stone over it with an arch cut out
  ctx.fillStyle='rgba(8,30,52,.55)'; rrect(ctx,-L/2,-T2/2,L,T2,8); ctx.fill();
  const n=Math.max(2,Math.round(L/34)), bw=L/n;
  for(let i=0;i<n;i++){ const bx=-L/2+i*bw;
    ctx.fillStyle=sb?SBC.outline:'#1a1410'; rrect(ctx,bx+1,-T2/2-14,bw-2,16,5); ctx.fill();
    ctx.fillStyle=i%2?'#cfc6b4':'#bdb3a0'; rrect(ctx,bx+2.5,-T2/2-12.5,bw-5,13,4); ctx.fill();
    ctx.fillStyle='rgba(255,250,230,.4)'; ctx.fillRect(bx+5,-T2/2-11,bw-10,2.5);
    ctx.fillStyle='rgba(90,140,80,.55)'; if(i%3===1) ctx.fillRect(bx+6,-T2/2+0.5,bw*0.4,2.5); }
  // the arch mouth
  ctx.strokeStyle='rgba(235,248,255,.35)'; ctx.lineWidth=1.6; for(let i=0;i<3;i++){ const yy=-T2/2+6+i*(T2/3); ctx.beginPath(); ctx.moveTo(-L/2+8,yy+Math.sin(t*2+i)*2); ctx.quadraticCurveTo(0,yy-4,L/2-8,yy+Math.sin(t*2+i+1)*2); ctx.stroke(); }
  ctx.restore();
  if(canDive()&&!p4Diving()&&player&&dist2(player.x,player.y,o.x,o.y)<240*240) glowAt(o.x,o.y,40,'140,210,255',0.18+0.08*Math.sin(t*3));
}
function p4DrawGrate(o,t){
  const sb=LOOK.sb, vert=o.h>o.w, L=vert?o.h:o.w, n=Math.max(3,Math.round(L/14));
  ctx.save(); ctx.translate(o.x,o.y); if(vert) ctx.rotate(Math.PI/2);
  ctx.fillStyle='rgba(8,30,52,.35)'; ctx.fillRect(-L/2,-9,L,18);
  ctx.strokeStyle=sb?SBC.outline:'#1a1a22'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(-L/2,-6); ctx.lineTo(L/2,-6); ctx.moveTo(-L/2,6); ctx.lineTo(L/2,6); ctx.stroke();
  for(let i=0;i<=n;i++){ const x=-L/2+i*L/n; ctx.strokeStyle=sb?SBC.outline:'#1a1a22'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x,-9); ctx.lineTo(x,9); ctx.stroke(); ctx.strokeStyle='#6a7484'; ctx.lineWidth=2.6; ctx.stroke(); }
  ctx.strokeStyle='#7c8696'; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(-L/2,-6); ctx.lineTo(L/2,-6); ctx.moveTo(-L/2,6); ctx.lineTo(L/2,6); ctx.stroke();
  ctx.restore();
}
function p4DrawBubbles(o,t,under){
  const on=p4BubOn(o), r=o.r;
  if(!under){ ctx.save(); ctx.globalAlpha=0.55; ctx.strokeStyle='rgba(230,248,255,.7)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(o.x,o.y,r*0.7,r*0.4,0,0,TAU); ctx.stroke(); ctx.restore(); }
  else{ ctx.save(); ctx.fillStyle='rgba(40,30,50,.5)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+4,r*0.55,r*0.3,0,0,TAU); ctx.fill(); ctx.fillStyle='#8a8070'; ctx.beginPath(); ctx.ellipse(o.x,o.y+2,r*0.42,r*0.22,0,0,TAU); ctx.fill(); ctx.restore(); }
  if(!on) return;
  const n=under?9:5;
  ctx.save(); for(let i=0;i<n;i++){ const ph=((t*0.9+i/n+(o.ph||0))%1), bx=o.x+Math.sin(t*3+i*2.1)*r*0.35, by=o.y-ph*(under?70:24), br=(under?2.4:1.6)+i%3; ctx.globalAlpha=(1-ph)*(under?0.9:0.6); ctx.strokeStyle='#e8f8ff'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(bx,by,br,0,TAU); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(bx-br*0.3,by-br*0.3,br*0.3,0,TAU); ctx.fill(); } ctx.restore();
  if(under) glowAt(o.x,o.y-20,34,'170,230,255',0.25);
}
function p4USwitchSprite(on){ return sbSprite('p4usw'+(on?1:0),20,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-17+dx,4+dy); q.quadraticCurveTo(-18+dx,-14+dy,0+dx,-15+dy); q.quadraticCurveTo(18+dx,-14+dy,17+dx,4+dy); q.quadraticCurveTo(0+dx,12+dy,-17+dx,4+dy); },'#c8a890',{r:17});
  g.strokeStyle='rgba(90,60,50,.5)'; g.lineWidth=1.4; for(const a of [-0.9,-0.45,0,0.45,0.9]){ g.beginPath(); g.moveTo(0,8); g.lineTo(Math.sin(a)*15,-Math.cos(a)*13+4); g.stroke(); }
  celBall(g,0,-2,6,on?'#bff0ff':'#8ab0c8'); }); }
function p4DrawUSwitch(o,t,under){
  if(!under){ ctx.save(); ctx.globalAlpha=0.5; drawSprite(p4USwitchSprite(o.on),o.x,o.y,1,0); ctx.restore(); p4Wash(o.x,o.y,22,14); return; }
  drawSprite(p4USwitchSprite(o.on),o.x,o.y,1,0); glowAt(o.x,o.y-2,o.on?36:18,o.on?'170,240,255':'120,190,230',o.on?0.6:0.35+0.1*Math.sin(t*4));
}
function p4ChestSprite(kind){ return sbSprite('p4chest'+kind,22,g=>{ const wood=kind==='u'?'#5e7a6a':'#9a6a3a';
  celFill(g,(q,dx,dy)=>{ q.rect(-18+dx,-12+dy,36,24); },wood,{r:18}); g.fillStyle=kind==='u'?'#a8b8a0':'#e0b44a'; g.fillRect(-18,-12,36,4); g.fillRect(-18,7,36,4); g.fillRect(-2.5,-12,5,23);
  if(kind==='u'){ g.fillStyle='rgba(230,230,210,.85)'; for(const [x,y,r] of [[-12,-3,2.2],[-8,2,1.6],[11,-5,2],[13,3,1.4]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); } } }); }
function p4DrawUChest(o,t,under){
  if(o.open&&!under) return;
  const sp=p4ChestSprite('u');
  if(!under){ ctx.save(); ctx.globalAlpha=0.45; drawSprite(sp,o.x,o.y,1,0); ctx.restore(); p4Wash(o.x,o.y,26,16); if(!o.open) glowAt(o.x,o.y,20,'200,236,255',0.15+0.1*Math.sin(t*3)); return; }
  if(o.open){ ctx.save(); ctx.globalAlpha=0.6; drawSprite(sp,o.x,o.y,1,0); ctx.restore(); return; }
  drawSprite(sp,o.x,o.y,1,0); glowAt(o.x,o.y,40,'200,236,255',0.3+0.12*Math.sin(t*3));
}
function p4DrawPool(o,t){
  const r=o.r, on=p4On(o), sh=o.kind!=='water';
  ctx.save(); ctx.translate(o.x,o.y);
  if(sh){ ctx.fillStyle=on?'rgba(26,12,44,.86)':'rgba(26,12,44,.45)'; ctx.beginPath(); ctx.ellipse(0,0,r,r*0.6,0,0,TAU); ctx.fill();
    ctx.strokeStyle=LOOK.sb?'rgba(59,34,51,.9)':'rgba(10,4,20,.9)'; ctx.lineWidth=3; ctx.stroke();
    ctx.strokeStyle=`rgba(170,130,240,${on?0.65+0.2*Math.sin(t*3):0.25})`; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,r*0.8+Math.sin(t*2)*2,r*0.48,0,0,TAU); ctx.stroke();
    if(on) for(let i=0;i<4;i++){ const a=t*0.7+i*1.57, rr=r*0.45; ctx.fillStyle='rgba(230,220,255,.8)'; ctx.beginPath(); ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr*0.5,1.3,0,TAU); ctx.fill(); } }
  else{ ctx.fillStyle='rgba(8,34,70,.6)'; ctx.beginPath(); ctx.ellipse(0,0,r,r*0.6,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(220,244,255,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,r*0.85+Math.sin(t*2.4)*3,r*0.52,0,0,TAU); ctx.stroke(); }
  ctx.restore();
  if(on&&canDive()&&player&&dist2(player.x,player.y,o.x,o.y)<(r+60)**2) glowAt(o.x,o.y,r*1.2,sh?'170,120,255':'130,200,255',0.18);
}
function p4DrawGapHint(o,t){ if(!canBurrow()) return; ctx.save(); ctx.globalAlpha=0.35+0.1*Math.sin(t*2); ctx.strokeStyle='rgba(120,90,50,.7)'; ctx.lineWidth=2; ctx.setLineDash([6,8]); ctx.strokeRect(o.x0+4,o.y0+4,o.x1-o.x0-8,o.y1-o.y0-8); ctx.restore(); }
function p4WallSprite(o){ const key='p4wall_'+o.style+'_'+Math.round(o.w)+'_'+Math.round(o.h); const R=Math.max(o.w,o.h)/2+34, vert=o.h>o.w;
  return sbSprite(key,R,g=>{ if(vert){ const n=Math.max(2,Math.round(o.h/26)), bh=o.h/n, col=o.style==='fence'?'#b88a58':'#d8b880';
      for(let i=0;i<n;i++){ const y=-o.h/2+i*bh; celFill(g,(q,dx,dy)=>{ rrect(q,-o.w/2-2+dx,y-22+dy,o.w+4,bh+22,5); },col,{r:o.w/2+4}); g.fillStyle=sbTone(col,0.25); rrect(g,-o.w/2,y-21,o.w,8,4); g.fill(); }
      return; }
    if(o.style==='fence'){ const n=Math.max(2,Math.round(o.w/28)); for(let i=0;i<=n;i++){ const x=-o.w/2+i*o.w/n; celFill(g,(q,dx,dy)=>{ q.rect(x-3.5+dx,-24+dy,7,30); },'#a87a4a',{r:6}); g.fillStyle='#d8b07a'; g.beginPath(); g.moveTo(x-3.5,-24); g.lineTo(x,-29); g.lineTo(x+3.5,-24); g.fill(); }
      for(const y of [-17,-5]) celFill(g,(q,dx,dy)=>{ q.rect(-o.w/2+dx,y+dy,o.w,5); },'#b88a58',{r:4}); }
    else{ celFill(g,(q,dx,dy)=>{ rrect(q,-o.w/2+dx,-28+dy,o.w,34,6); },'#d8b880',{r:o.w/2}); g.strokeStyle='rgba(120,80,40,.4)'; g.lineWidth=1.4; for(let x=-o.w/2+16;x<o.w/2;x+=22){ g.beginPath(); g.moveTo(x,-26); g.lineTo(x+4,4); g.stroke(); } } }); }
function p4DrawSandWall(o,t){ drawSprite(p4WallSprite(o),o.x,o.y,1,0); }
function p4DrawBChest(o,t,buried){
  if(o.open) return;
  if(!buried){ if(!canBurrow()) return; const tw=0.5+0.5*Math.sin(t*3+o.x); ctx.save(); ctx.globalAlpha=0.35+0.3*tw; ctx.strokeStyle='#fff6d0'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(o.x-5,o.y-5); ctx.lineTo(o.x+5,o.y+5); ctx.moveTo(o.x+5,o.y-5); ctx.lineTo(o.x-5,o.y+5); ctx.stroke(); ctx.restore(); glowAt(o.x,o.y,8,'255,240,190',0.25*tw); return; }
  ctx.save(); ctx.globalAlpha=0.85; drawSprite(p4ChestSprite('b'),o.x,o.y,0.9,0); ctx.restore(); glowAt(o.x,o.y,36,'255,214,120',0.35+0.12*Math.sin(t*4));
}
function p4DrawBSwitch(o,t,buried){
  if(!buried){ if(!canBurrow()) return; ctx.save(); ctx.globalAlpha=o.on?0.5:0.25; ctx.strokeStyle=o.on?'#ffe08a':'rgba(110,80,40,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(o.x,o.y,o.r,o.r*0.6,0,0,TAU); ctx.stroke(); ctx.restore(); return; }
  ctx.save(); ctx.fillStyle=o.on?'#ffe08a':'#b89a6a'; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.ellipse(o.x,o.y,o.r,o.r*0.6,0,0,TAU); ctx.fill(); ctx.strokeStyle=SBC.outline; ctx.lineWidth=2; ctx.stroke(); ctx.restore(); glowAt(o.x,o.y,30,'255,220,140',o.on?0.5:0.3);
}
function p4StoneSprite(){ return sbSprite('p4stone',26,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-15+dx,14+dy); q.lineTo(-11+dx,2+dy); q.lineTo(11+dx,2+dy); q.lineTo(15+dx,14+dy); q.closePath(); },'#8a86a8',{r:14});
  celFill(g,(q,dx,dy)=>{ q.moveTo(0+dx,-24+dy); q.quadraticCurveTo(13+dx,-14+dy,10+dx,2+dy); q.lineTo(-10+dx,2+dy); q.quadraticCurveTo(-13+dx,-14+dy,0+dx,-24+dy); },'#c8cce8',{r:13});
  g.fillStyle='#8a8eb8'; g.beginPath(); g.arc(0,-11,5.4,0,TAU); g.fill(); g.fillStyle='#c8cce8'; g.beginPath(); g.arc(2.4,-12.4,4.4,0,TAU); g.fill(); }); }
function p4DrawMoonstone(o,t){
  const on=o.keepOn||o.lit>0, warn=!o.keepOn&&o.lit>0&&o.lit<2.5&&Math.sin(t*16)>0;
  if(on) glowAt(o.x,o.y-14,70,'190,206,255',warn?0.25:0.45+0.08*Math.sin(t*3));
  drawSprite(p4StoneSprite(),o.x,o.y-10,1,0);
  if(on){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=`rgba(220,230,255,${warn?0.4:0.8})`; ctx.beginPath(); ctx.arc(o.x,o.y-21,5.6,0,TAU); ctx.fill(); ctx.restore(); glowAt(o.x,o.y-21,16,'240,246,255',0.8); if(Math.random()<0.06) emit(o.x+rand(-8,8),o.y-26,1,{col:'214,226,255',ang:-Math.PI/2,spread:0.5,smin:10,smax:30,lmin:.6,lmax:1.2,zmin:1,zmax:2}); }
  else if(canMoon()&&player&&dist2(player.x,player.y,o.x,o.y)<260*260) glowAt(o.x,o.y-21,12,'190,206,255',0.15+0.08*Math.sin(t*3));
}
function p4DrawMoonGlass(o,t){
  if(!o.shown&&!(o.litT>0)) return;
  const on=p4GlassSolid(o), warn=on&&!o.keepOn&&!o.stoneOn&&!o.beamOn&&o.litT<1.5&&Math.sin(t*18)>0, sb=LOOK.sb;
  ctx.save();
  const shape=()=>{ ctx.beginPath(); if(o.pts){ ctx.moveTo(o.pts[0][0],o.pts[0][1]); for(const q of o.pts.slice(1)) ctx.lineTo(q[0],q[1]); } else rrect(ctx,o.x0,o.y0,o.x1-o.x0,o.y1-o.y0,8); };
  if(o.pts){ ctx.lineCap='round'; ctx.lineJoin='round'; shape(); if(on){ if(sb){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=o.w+4; ctx.stroke(); } ctx.strokeStyle=warn?'rgba(170,186,230,.55)':'rgba(196,212,250,.92)'; ctx.lineWidth=o.w; ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=o.w*0.18; ctx.stroke(); }
    else{ ctx.setLineDash([10,10]); ctx.strokeStyle='rgba(200,214,255,.35)'; ctx.lineWidth=3; ctx.stroke(); } }
  else{ shape(); if(on){ ctx.fillStyle=warn?'rgba(170,186,230,.55)':'rgba(190,206,248,.88)'; ctx.fill(); if(sb){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=2.6; ctx.stroke(); }
      ctx.clip(); ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=3; const w=o.x1-o.x0; for(let x=o.x0-40+((t*30)%60);x<o.x1+40;x+=60){ ctx.beginPath(); ctx.moveTo(x,o.y1); ctx.lineTo(x+30,o.y0); ctx.stroke(); }
      ctx.strokeStyle='rgba(120,130,190,.35)'; ctx.lineWidth=1.2; for(let x=o.x0+24;x<o.x1;x+=48){ ctx.beginPath(); ctx.moveTo(x,o.y0); ctx.lineTo(x,o.y1); ctx.stroke(); } }
    else{ ctx.setLineDash([10,10]); ctx.strokeStyle=`rgba(200,214,255,${0.28+0.12*Math.sin(t*2)})`; ctx.lineWidth=2.4; ctx.stroke(); } }
  ctx.restore();
  if(on&&Math.random()<0.08){ const px=o.pts?o.pts[0][0]:rand(o.x0,o.x1), py=o.pts?o.pts[0][1]:rand(o.y0,o.y1); emit(px,py,1,{col:'220,230,255',smin:5,smax:20,lmin:.5,lmax:1,zmin:1,zmax:2}); }
}
// a painted moth eye
function p4GlyphPath(g,x,y,s){ g.beginPath(); g.moveTo(x-16*s,y); g.quadraticCurveTo(x,y-12*s,x+16*s,y); g.quadraticCurveTo(x,y+12*s,x-16*s,y); g.closePath(); }
function p4DrawGlyph(o,t){ const a=o.vis; if(a<0.02) return; p4GlyphAt(o.x,o.y,a,t,o.r/18); }
function p4GlyphAt(x,y,a,t,s){
  ctx.save(); ctx.globalAlpha=a; ctx.lineJoin='round';
  glowAt(x,y,26*s,'200,214,255',0.35*a);
  p4GlyphPath(ctx,x,y,s); ctx.strokeStyle=LOOK.sb?'rgba(59,34,51,.9)':'rgba(20,10,30,.9)'; ctx.lineWidth=4; ctx.stroke(); ctx.strokeStyle='#d8e0ff'; ctx.lineWidth=2.2; ctx.stroke();
  ctx.fillStyle='#d8e0ff'; ctx.beginPath(); ctx.arc(x,y,4.6*s,0,TAU); ctx.fill(); ctx.fillStyle='#5a4a8a'; ctx.beginPath(); ctx.arc(x,y,2.2*s,0,TAU); ctx.fill();
  for(const sd of [-1,1]){ ctx.strokeStyle='#d8e0ff'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x+sd*18*s,y-4*s); ctx.quadraticCurveTo(x+sd*24*s,y-10*s,x+sd*21*s,y-14*s); ctx.stroke(); }
  ctx.restore();
}
function p4RockSprite(o){ const key='p4rock_'+Math.round(o.w)+'_'+Math.round(o.h)+'_'+o.style; const R=Math.max(o.w,o.h)/2+16;
  return sbSprite(key,R,g=>{ const col=o.style==='glass'?'#5c5478':'#8a7e8e'; celFill(g,(q,dx,dy)=>{ rrect(q,-o.w/2+dx,-o.h/2-26+dy,o.w,o.h+26,10); },col,{r:o.w/2});
    g.fillStyle=sbTone(col,0.25); rrect(g,-o.w/2+4,-o.h/2-24,o.w-8,10,6); g.fill(); g.strokeStyle='rgba(40,20,50,.35)'; g.lineWidth=1.4; for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(-o.w/2+10+i*o.w/4,-o.h/2-12); g.lineTo(-o.w/2+16+i*o.w/4,o.h/2-2); g.stroke(); } }); }
function p4DrawMoonDoor(o,t){
  if(o.oa>=0.99) return;
  ctx.save(); ctx.globalAlpha=1-o.oa; drawSprite(p4RockSprite(o),o.x,o.y,1,0);
  // the door shows when moonlight is near (and while it opens)
  const near=p4MoonHits(o.x,o.y,Math.max(o.w,o.h)*0.6)||o.heat>0||o.oa>0.01;
  if(near){ const k=Math.max(o.oa,clamp(o.heat/P4N.doorNeed,0.3,1)); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(210,222,255,${0.8*k})`; ctx.lineWidth=2.4; const dw=Math.min(o.w*0.5,46), dh=Math.min(o.h+16,52); rrect(ctx,o.x-dw/2,o.y+o.h/2-dh,dw,dh,dw/2); ctx.stroke(); p4GlyphAt(o.x,o.y-o.h/2-16,k,t,0.7); }
  ctx.restore();
}
function p4DrawTendrilBase(o,t){ if(o.burnt){ ctx.save(); ctx.fillStyle='rgba(40,30,50,.25)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+4,o.r,o.r*0.45,0,0,TAU); ctx.fill(); ctx.restore(); return; } ctx.save(); ctx.fillStyle='rgba(20,8,30,.5)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+4,o.r*1.05,o.r*0.5,0,0,TAU); ctx.fill(); ctx.restore(); }
function p4DrawTendril(o,t){ if(o.burnt) return; p4TendrilAt(o.x,o.y,o.r,t+o.ph,o.shrinkT>0?0.35:1); }
function p4TendrilAt(x,y,r,t,k){
  const sb=LOOK.sb, n=5, p=player;
  const lean=p?clamp((p.x-x)/240,-1,1)*0.25:0;
  ctx.save(); ctx.lineCap='round';
  for(let i=0;i<n;i++){ const bx=x+(i-(n-1)/2)*r*0.38, h=r*(1.1+0.5*((i*7)%3)/2)*k, sw=Math.sin(t*1.8+i*1.3)*r*0.25+lean*h;
    const path=()=>{ ctx.beginPath(); ctx.moveTo(bx,y+2); ctx.bezierCurveTo(bx-sw*0.3,y-h*0.4,bx+sw,y-h*0.7,bx+sw*1.3,y-h); };
    if(sb){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=8*k+2; path(); ctx.stroke(); }
    ctx.strokeStyle='#1c0e2c'; ctx.lineWidth=6.5*k+1; path(); ctx.stroke(); ctx.strokeStyle='#3e2862'; ctx.lineWidth=2.4*k+0.5; path(); ctx.stroke();
    ctx.fillStyle='#1c0e2c'; ctx.beginPath(); ctx.arc(bx+sw*1.3,y-h,3.4*k+1,0,TAU); ctx.fill(); ctx.fillStyle='rgba(200,170,255,.75)'; ctx.beginPath(); ctx.arc(bx+sw*1.3,y-h,1.3*k,0,TAU); ctx.fill(); }
  ctx.restore();
}
function p4DrawRampFx(o,t){
  const r=o.ramp; if(!r||!inView(o.x,o.y,200)) return; const on=p4RampSolid(r), warn=on&&!r.stoneOn&&!p4Found('p4r_'+r.id)&&r.litT>0&&r.litT<1.5&&Math.sin(t*18)>0;
  ctx.save();
  if(!on){ ctx.fillStyle='rgba(18,14,40,.72)'; rrect(ctx,r.x0,r.y0,r.x1-r.x0,r.y1-r.y0,6); ctx.fill(); ctx.setLineDash([8,8]); ctx.strokeStyle=`rgba(200,214,255,${0.3+0.12*Math.sin(t*2)})`; ctx.lineWidth=2; ctx.stroke(); }
  else{ ctx.globalCompositeOperation='lighter'; ctx.fillStyle=warn?'rgba(120,130,190,.18)':'rgba(170,186,255,.28)'; rrect(ctx,r.x0,r.y0,r.x1-r.x0,r.y1-r.y0,6); ctx.fill(); ctx.strokeStyle='rgba(220,230,255,.5)'; ctx.lineWidth=2; ctx.stroke(); }
  ctx.restore();
}
// the standing things sort with the figures; the flat ones draw with the landmarks
function p4Stand(list,o,y,fn){ list.push({x:o.x,y,r:6,flying:true,draw:fn}); }
{ const base=eventsForRender; eventsForRender=function(list){
  base(list);
  if(!G||!player) return; const t=G.time;
  for(const o of p4Objs()){ const K=P4K[o.p4]; if(!K||!K.stand||!inView(o.x,o.y,160)) continue; p4Stand(list,o,K.sy?K.sy(o):o.y,()=>K.stand(o,t)); }
  if(AREA&&AREA.p4){ const C=AREA.p4, c=AREA.cave, cs=c.cell;
    for(const o of C.braz) if(inView(o.x,o.y,80)) p4Stand(list,o,o.y+6,()=>p4DrawBraz(o,t));
    // tendril cells stand up out of the floor
    const i0=Math.max(0,Math.floor((cam.x-AREA.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-AREA.x0)/cs)+1), j0=Math.max(0,Math.floor((cam.y-AREA.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-AREA.y0)/cs)+1);
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i; if(c.typ[k]!==P4T.tend) continue; const x=AREA.x0+(i+0.5)*cs, y=AREA.y0+(j+0.5)*cs, s=C.tendS.get(k)>0; p4Stand(list,{x,y},y+cs*0.3,()=>p4TendrilAt(x,y+cs*0.3,cs*0.55,t+i*0.7+j*1.1,s?0.35:1)); }
    for(const o of C.vines){ if(o.opened) continue; const sh=o.shrinkT>0; p4Stand(list,o,o.y+30,()=>p4DrawVines(o,t,sh)); } }
}; }
{ const base=drawLandmark; drawLandmark=function(o,t){ if(o&&o.p4){ const K=P4K[o.p4]; if(K&&K.ground) K.ground(o,t); return; } return base(o,t); }; }
for(const kind in P4K){ const K=P4K[kind]; FL['p4_'+kind]=(o,t)=>{ if(K.ground) K.ground(o,t); }; }
{ const base=drawFurnX; drawFurnX=function(o,t){ if(o&&o.k==='cgate'&&(o.p4v||o.type==='arch'||o.type==='sand'||o.type==='moon')) return true; if(o&&o.p4buried){ p4DrawBSwitch(o,t,false); return true; } return base(o,t); }; }
FL.p4_hidden=()=>{};
FL.p4_cbub=(o,t)=>{ if(p4Diving()) return; p4DrawBubbles(o,t,false); };
FL.p4_cpool=(o,t)=>p4DrawPool(o,t);
FL.p4_cbraz=()=>{};
FL.p4_cglyph=(o,t)=>{ if(o.vis>0.02) p4GlyphAt(o.x,o.y,o.vis,t,1); };
FL.p4_cbchest=(o,t)=>p4DrawBChest(o,t,false);
function p4BrazSprite(){ return sbSprite('p4braz',22,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-8+dx,16+dy); q.lineTo(-5+dx,2+dy); q.lineTo(5+dx,2+dy); q.lineTo(8+dx,16+dy); q.closePath(); },'#6a6a8a',{r:10});
  celFill(g,(q,dx,dy)=>{ q.ellipse(0+dx,-2+dy,17,8,0,0,TAU); },'#5a7ac8',{r:16}); g.fillStyle='#2a3460'; g.beginPath(); g.ellipse(0,-4,12,4.6,0,0,TAU); g.fill();
  g.strokeStyle='#c8d8ff'; g.lineWidth=1.6; g.beginPath(); g.arc(9,4,4,-1.2,1.9); g.stroke(); }); }
function p4DrawBraz(o,t){
  const on=o.lit>0, warn=on&&o.timed&&o.lit<2&&Math.sin(t*16)>0;
  drawSprite(p4BrazSprite(),o.x,o.y-4,1,0);
  if(on){ const fl=1+0.08*Math.sin(t*9+o.x); glowAt(o.x,o.y-20,60*fl,'190,206,255',warn?0.25:0.5);
    ctx.save(); ctx.globalCompositeOperation='lighter'; for(let i=0;i<3;i++){ const h=(16+i*5)*fl, w=7-i*1.6; ctx.fillStyle=`rgba(${i?'200,214,255':'240,246,255'},${warn?0.35:0.75-i*0.15})`; ctx.beginPath(); ctx.moveTo(o.x-w,o.y-8); ctx.quadraticCurveTo(o.x-w*0.6+Math.sin(t*7+i)*2,o.y-8-h*0.6,o.x+Math.sin(t*5+i)*2,o.y-8-h); ctx.quadraticCurveTo(o.x+w*0.6+Math.sin(t*7+i)*2,o.y-8-h*0.6,o.x+w,o.y-8); ctx.closePath(); ctx.fill(); } ctx.restore();
    if(Math.random()<0.1) emit(o.x+rand(-5,5),o.y-24,1,{col:'214,226,255',ang:-Math.PI/2,spread:0.4,smin:20,smax:50,lmin:.4,lmax:.8,zmin:1,zmax:2}); }
  else if(canMoon()&&player&&dist2(player.x,player.y,o.x,o.y)<240*240) glowAt(o.x,o.y-10,14,'190,206,255',0.14+0.08*Math.sin(t*3));
}
function p4DrawVines(o,t,sh){
  const vert=o.vertical, k=sh?0.4:1, n=7;
  ctx.save(); ctx.lineCap='round';
  for(let i=0;i<n;i++){ const f=(i/(n-1)-0.5)*130, bx=vert?o.x:o.x+f, by=vert?o.y+f:o.y, sw=Math.sin(t*1.6+i*1.1)*8;
    const path=()=>{ ctx.beginPath(); if(vert){ ctx.moveTo(bx-30*k,by); ctx.bezierCurveTo(bx-10,by+sw,bx+10,by-sw,bx+30*k,by+sw*0.5); } else { ctx.moveTo(bx,by+20); ctx.bezierCurveTo(bx+sw,by,bx-sw,by-30*k,bx+sw*0.5,by-60*k); } };
    if(LOOK.sb){ ctx.strokeStyle=SBC.outline; ctx.lineWidth=9*k+2; path(); ctx.stroke(); } ctx.strokeStyle='#1c0e2c'; ctx.lineWidth=7*k+1; path(); ctx.stroke(); ctx.strokeStyle='#4a3070'; ctx.lineWidth=2.4*k+0.4; path(); ctx.stroke(); }
  ctx.restore();
}
// the dungeon's live floor: flooded water, arches, quicksand, moon-glass, sand seams, under-chest tints
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){ base.apply(this,arguments); if(A&&A.cave&&A.cave.p4) try{ p4CaveFloor(A,t); }catch(e){ console.error(e); } }; }
function p4CaveFloor(A,t){
  const c=A.cave, cs=c.cell, C=A.p4||p4Cave(A);
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1), j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  ctx.save();
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i, ty=c.typ[k]; if(ty<60||ty>69) continue; const x=A.x0+i*cs, y=A.y0+j*cs;
    switch(ty){
      case P4T.full: { const ph=t*1.2+i*0.6+j*0.9; ctx.strokeStyle=`rgba(170,220,255,${0.12+0.06*Math.sin(ph)})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x+6,y+cs*0.35+Math.sin(ph)*3); ctx.quadraticCurveTo(x+cs/2,y+cs*0.25,x+cs-6,y+cs*0.4+Math.sin(ph+1)*3); ctx.stroke(); break; }
      case P4T.arch: { if(p4Diving()) break; ctx.fillStyle='rgba(10,40,70,.6)'; ctx.fillRect(x+3,y+cs*0.45,cs-6,cs*0.55); ctx.strokeStyle='rgba(200,236,255,.35)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x+6,y+cs*0.8+Math.sin(t*2+i)*2); ctx.lineTo(x+cs-6,y+cs*0.8+Math.sin(t*2+i+1)*2); ctx.stroke(); ctx.strokeStyle='rgba(255,250,230,.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x+cs/2,y+cs*0.62,cs*0.34,Math.PI,0); ctx.stroke(); if(canDive()) glowAt(x+cs/2,y+cs*0.7,18,'140,210,255',0.12+0.06*Math.sin(t*3)); break; }
      case P4T.seam: { ctx.fillStyle='rgba(226,194,122,.9)'; ctx.fillRect(x+2,y+cs*0.62,cs-4,cs*0.38); ctx.fillStyle='rgba(120,84,40,.45)'; ctx.fillRect(x+2,y+cs*0.62,cs-4,3); if(canBurrow()) glowAt(x+cs/2,y+cs*0.8,16,'255,220,150',0.1+0.05*Math.sin(t*3)); break; }
      case P4T.qs: case P4T.qsd: { const pl=C.plate.get(k)>0; if(pl){ ctx.fillStyle='rgba(220,236,255,.55)'; ctx.fillRect(x+3,y+3,cs-6,cs-6); ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.4; ctx.strokeRect(x+5,y+5,cs-10,cs-10); break; }
        const ph=t*(ty===P4T.qsd?1.6:1)+i*0.9+j*0.7; ctx.strokeStyle=ty===P4T.qsd?'rgba(90,60,30,.55)':'rgba(120,84,40,.4)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(x+cs/2,y+cs/2,cs*0.3,ph,ph+Math.PI*1.2); ctx.stroke(); ctx.beginPath(); ctx.arc(x+cs/2,y+cs/2,cs*0.14,ph+2,ph+2+Math.PI); ctx.stroke(); break; }
      case P4T.glass: { const on=C.glassT[k]>0||C.glassOn[k]>0, warn=on&&!C.glassOn[k]&&C.glassT[k]<1.4&&Math.sin(t*18)>0;
        if(on){ ctx.fillStyle=warn?'rgba(150,166,220,.6)':'rgba(186,202,248,.9)'; ctx.fillRect(x+1,y+1,cs-2,cs-2); ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=2.4; const s=((t*40+i*13)%(cs*2))-cs*0.5; ctx.beginPath(); ctx.moveTo(x+s,y+cs); ctx.lineTo(x+s+cs*0.5,y); ctx.stroke(); ctx.strokeStyle='rgba(110,120,180,.45)'; ctx.lineWidth=1.2; ctx.strokeRect(x+2.5,y+2.5,cs-5,cs-5); }
        else{ ctx.strokeStyle=`rgba(200,214,255,${0.22+0.1*Math.sin(t*2+i+j)})`; ctx.lineWidth=1.6; ctx.setLineDash([6,6]); ctx.strokeRect(x+4,y+4,cs-8,cs-8); ctx.setLineDash([]); }
        break; }
      case P4T.tend: { ctx.fillStyle='rgba(20,8,30,.45)'; ctx.beginPath(); ctx.ellipse(x+cs/2,y+cs*0.62,cs*0.5,cs*0.3,0,0,TAU); ctx.fill(); break; }
      case P4T.mwall: { const g=C.mwOf.get(k); if(g&&(g.heat>0||p4MoonHits(x+cs/2,y+cs/2,cs*0.6))){ const kk=clamp(g.heat/P4N.doorNeed,0.3,1); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(210,222,255,${0.7*kk})`; ctx.lineWidth=2; ctx.strokeRect(x+5,y+5,cs-10,cs-10); ctx.restore(); if(g.cells[0]===k) p4GlyphAt(g.x,g.y-6,kk,t,0.75); } break; }
    }
  }
  ctx.restore();
}
// the minimap knows the new cells
{ const base=renderCaveMini; renderCaveMini=function(A){
  base.apply(this,arguments); const c=A.cave, mm=A.mini; if(!mm||!c.p4) return; const mg=mm.getContext('2d'), im=mg.getImageData(0,0,c.w,c.h); let ch=false;
  for(let k=0;k<c.typ.length;k++){ const t=c.typ[k]; if(t<60||t>69) continue; const a=k*4; if(im.data[a]===10&&im.data[a+1]===8) continue; const dim=im.data[a]+im.data[a+1]+im.data[a+2]<150?0.55:1;
    const v=t===P4T.full?[36,70,130]:t===P4T.arch?[70,110,150]:t===P4T.glass?[120,120,180]:t===P4T.tend?[60,36,80]:(t===P4T.mwall)?null:[190,160,100];
    if(v){ im.data[a]=v[0]*dim; im.data[a+1]=v[1]*dim; im.data[a+2]=v[2]*dim; ch=true; } }
  if(ch) mg.putImageData(im,0,0); }; }
// the dungeon cells baked into the cave picture: flooded water, sand, packed sand, quicksand, moon-glass pits
{ const base=trialPaintCell; trialPaintCell=function(g,c,k,i,j,x,y,cs,st,rng,def){
  const t=c.typ[k]; if(t<60||t>69) return base.apply(this,arguments);
  switch(t){
    case P4T.full: { g.fillStyle=r2c(st.water,-0.25); g.fillRect(x,y,cs,cs); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x,y,cs,cs*0.22); g.strokeStyle='rgba(180,220,255,.12)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+5,y+cs*0.6+rng()*6); g.quadraticCurveTo(x+cs/2,y+cs*0.5,x+cs-5,y+cs*0.62); g.stroke(); return true; }
    case P4T.sand: case P4T.packed: case P4T.qs: case P4T.qsd: { const base0=t===P4T.packed?'#c2a06a':t===P4T.qsd?'#a9844e':t===P4T.qs?'#c29660':'#d9b56e'; g.fillStyle=r2c(base0,(i*7+j*3)%5===0?0.025:0); g.fillRect(x,y,cs,cs);
      if(t!==P4T.packed) for(const f of [0.3,0.74]){ const wv=u=>y+cs*f+Math.sin((x+u)*0.085+j*1.7)*3.2;
        g.strokeStyle='rgba(140,98,52,.26)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(x,wv(0)); for(let u=6;u<=cs;u+=6) g.lineTo(x+u,wv(u)); g.stroke();
        g.strokeStyle='rgba(255,244,214,.28)'; g.lineWidth=1.1; g.beginPath(); g.moveTo(x,wv(0)+2); for(let u=6;u<=cs;u+=6) g.lineTo(x+u,wv(u)+2); g.stroke(); }
      g.fillStyle='rgba(255,250,230,.14)'; for(let n=0;n<2;n++){ g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,3+rng()*5,1.1,0,0,TAU); g.fill(); }
      g.fillStyle='rgba(110,80,40,.18)'; for(let n=0;n<4;n++){ g.beginPath(); g.arc(x+rng()*cs,y+rng()*cs,0.8+rng()*1.2,0,TAU); g.fill(); }
      if(t===P4T.packed){ g.strokeStyle='rgba(90,64,30,.35)'; g.lineWidth=1.2; g.strokeRect(x+3,y+3,cs-6,cs-6); }
      if(t===P4T.qs||t===P4T.qsd){ g.fillStyle=t===P4T.qsd?'rgba(70,46,20,.35)':'rgba(90,60,30,.22)'; g.beginPath(); g.ellipse(x+cs/2,y+cs/2,cs*0.42,cs*0.36,0,0,TAU); g.fill(); }
      return true; }
    case P4T.glass: { dunHoleArt(g,c,i,j,x,y,cs,st,'170,180,255'); return true; }
    case P4T.tend: { dunTile(g,x,y,cs,st,i,j,rng,-0.12); return true; }
  }
  return base.apply(this,arguments); }; }

// ---- the HUD: the Moonfire chip on the breath meter (tap it on touch), and the mode on the FIRE button
{ const base=drawHUD; drawHUD=function(){
  base();
  try{ if(G&&G.mode==='story'&&player&&canMoon()&&scene!=='menu') p4HudChip(); }catch(e){ console.error(e); }
}; }
function p4HudChip(){
  const p=player, L=SAFE.l+14, T0=SAFE.t+14, pw=Math.min(250,MINI_R().x-L-10), bx=L+12, bw=pw-62, y=T0+50, on=p4MoonOn(), t=G.time;
  if(on){ ctx.save(); bar(bx,y,bw*0.8,5,p.energy/p.maxEnergy,p.exhausted?'#6a6a90':'#c8d4ff','rgba(30,30,60,.9)'); ctx.restore(); }
  const cx=bx+bw*0.8+16, cy=y+2.5, R=9.5, pulse=P4.swT>0?P4.swT:0;
  ctx.save();
  if(on) glowAt(cx,cy,20+pulse*10,'200,214,255',0.35+pulse*0.4);
  ctx.fillStyle=LOOK.sb?SBC.outline:'rgba(10,8,20,.8)'; ctx.beginPath(); ctx.arc(cx,cy,R+2.4,0,TAU); ctx.fill();
  ctx.fillStyle=on?'#3a3a78':'#2a2030'; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.fill();
  // the crescent
  ctx.fillStyle=on?'#eef2ff':'rgba(200,190,210,.55)'; ctx.beginPath(); ctx.arc(cx,cy,R*0.62,0,TAU); ctx.fill();
  ctx.fillStyle=on?'#3a3a78':'#2a2030'; ctx.beginPath(); ctx.arc(cx+R*0.3,cy-R*0.22,R*0.52,0,TAU); ctx.fill();
  if(!on){ ctx.fillStyle='#ff9a4a'; ctx.beginPath(); ctx.moveTo(cx+R*0.5,cy+R*0.55); ctx.quadraticCurveTo(cx+R*0.9,cy,cx+R*0.62,cy-R*0.25); ctx.quadraticCurveTo(cx+R*0.35,cy+R*0.1,cx+R*0.5,cy+R*0.55); ctx.fill(); }
  ctx.restore();
  // the control: a key cap, a pad hint, or a finger
  ctx.save(); ctx.font=`800 8px ${UIF}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=on?'#dfe6ff':'#c8b8a8';
  if(usingTouch){ }
  else if(padActive()){ ctx.fillText(padBtnName(padSw(PB.L2))+'+'+padBtnName(padSw(PB.L1)),cx+R+4,cy); }
  else ctx.fillText('O',cx+R+4,cy);
  ctx.restore();
  HUD_HITS.push({x:cx-R-12,y:cy-R-10,w:R*2+24,h:R*2+20,fn:()=>{ P4.touchSwap=true; }});
  // on touch: a moon on the FIRE button while Moonfire is on
  if(usingTouch&&on&&scene==='play'){ const b=tLayout().find(q=>q.id==='fire'); if(b){ const mx=b.x+b.r*0.62, my=b.y-b.r*0.62; ctx.save(); ctx.fillStyle=LOOK.sb?SBC.outline:'rgba(10,8,20,.8)'; ctx.beginPath(); ctx.arc(mx,my,9,0,TAU); ctx.fill(); ctx.fillStyle='#eef2ff'; ctx.beginPath(); ctx.arc(mx,my,6,0,TAU); ctx.fill(); ctx.fillStyle=LOOK.sb?SBC.outline:'#1a1430'; ctx.beginPath(); ctx.arc(mx+2.4,my-1.8,5,0,TAU); ctx.fill(); ctx.restore(); } }
}
ACT_KEY_R.moon='O'; ACT_KEY_L.moon='O';

// ---------- 10. the powers' names, how-to and tips (the Powers page, the banners)
defineAbility('dive',{act:4,icon:'a_dive',name:'Dive',short:'Dive',skill:'dive2',
  how:c=>S(`Swim out into deep water and press ${c.roll} to dive under. Underwater you swim under arches and grates, press switches and open chests on the bottom. Watch your air: bubbles and open water fill it back up. Press ${c.roll} again to come up. Dive into a pool to come out of its twin.`,`Press ${c.roll} in deep water to dive. Watch your air! ${c.roll} again comes up.`),
  tip:c=>S(`In deep water, press ${c.roll} to dive. Bubbles refill your air.`,`Press ${c.roll} to dive!`),
  banner:c=>S(`You can breathe under the water for a while. Press ${c.roll} in deep water to dive!`,`Press ${c.roll} in deep water to dive!`),
  plain:S('Dive under deep water!','Dive under deep water!')});
defineAbility('burrow',{act:4,icon:'a_burrow',name:'Burrow',short:'Burrow',skill:'burrow2',
  how:c=>S(`On soft sand, press ${c.roll} to dig in. Underground you slip under walls, fences and foes, and almost nothing can hurt you. Press ${c.roll} again to pop up with an uppercut that knocks foes into the air. Watch the dig meter.`,`Press ${c.roll} on sand to dig in. ${c.roll} again pops up and knocks foes up!`),
  tip:c=>S(`On sand, press ${c.roll} to dig in, and again to pop up.`,`Press ${c.roll} on sand!`),
  banner:c=>S(`Your claws want to DIG. Press ${c.roll} on sand to burrow!`,`Press ${c.roll} on sand to burrow!`),
  plain:S('Dig into sand and go under things!','Dig into sand!')});
defineAbility('moonfire',{act:4,icon:'a_moonfire',name:'Moonfire',short:'Moonfire',skill:'moon2',
  how:c=>S(`Press ${p4MoonKey()} to switch your breath between fire and silver Moonfire. Moonfire lights moonstones and moon braziers, makes moon-glass solid for a while, burns shadow tendrils and vines for good, shows moth glyphs and hidden doors, melts ink shields, and works under water.`,`Press ${p4MoonKey()} to switch to Moonfire. It lights moon things and works under water!`),
  tip:c=>S(`Press ${p4MoonKey()} to swap fire and Moonfire. Moon things want Moonfire.`,`Press ${p4MoonKey()} for Moonfire!`),
  banner:c=>S(`Your breath can burn silver now. Press ${p4MoonKey()} to switch to Moonfire!`,`Press ${p4MoonKey()} for Moonfire!`),
  plain:S('Breathe silver Moonfire!','Breathe silver Moonfire!')});

// ---------- 11. a sandbox (__eb.p4Test) and debug hooks
// The Moon Lab: a small test dungeon with every dungeon piece of the three powers (no door leads to it).
const P4_LAB={
  a:['...............','.wwwwww#≈≈≈≈≈..','.wwwwww∩≈≈°≈≈..','.wwwwww∩≈≈≈≈X..','.wwwwww#≈≈≈≈≈..','...............','..s............','...............','...............','...............','...............'],
  b:['...............','.≈≈≈≈≈.........','.≈≈H≈≈.....●...','.≈≈≈≈≈.........','.wwwww.........','...............','...............','........#......','...●....#......','........#......','.s.............'],
  c:['∴∴∴∴∴∴...∴∴π∴∴∴','∴∴∴∴∴∴∴∴∴∴∴π∴∴∴','∴∴∴∴∴∴∴∴∴∴∴π¤∴∴','∴∴⊙⊙⊙∴∴∴∴∴∴π∴∴∴','...⊙⊙⊙∴∴∴∴∴π÷∴∴','...⊙⊙⊙∴∴∴∴∴π∴∴∴','...∴∴∴∴∴∴∴∴π∴∴∴','∴∴∴∴∴∴∴∷∷∷∴π∴∴∴','∴∴⊚⊚⊚∴∴∷∷∷∴π∴∴∴','∴∴⊚⊚⊚∴∴∴∴∴∴π∴∴∴','∴s∴∴∴∴∴∴∴∴∴π∴∴∴'],
  d:['...............','..........§§§..','..ʘ.......§X§..','..........§§§..','...............','...............','...............','oooooo◊◊◊oooooo','oooooo◊◊◊oooooo','...........☾...','..s............'],
  e:['...............','..☾.........☾..','...............','.......◊.......','......◊◊◊......','.......◊.......','...............','..ʘ.........ʘ..','...............','...............','...............'],
  f:['≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈','≈≈≈≈°≈≈≈≈≈≈≈≈≈≈','≈≈ww≈≈≈≈≈≈≈≈≈≈≈','≈≈ww≈≈≈≈≈≈°≈≈≈≈','≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈','≈≈≈≈≈≈≈X≈≈≈≈≈≈≈','≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈','≈≈≈2222222≈≈≈≈≈','≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈','≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈','≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈']
};
defineDungeon('p4_lab',{name:S('The Moon Lab','The Moon Lab'),level:17,theme:'crystal',seed:404,save:'p4_lab',noJuniper:true,giftOK:{},dark:0.2,
  dunKind:S('A test cave','A test cave'),
  story:{in:[['ash',S('A cave for practicing the powers of Moonfall. Wet, sandy and a bit spooky. Perfect.','A cave to practice my powers!')]]},
  floors:[{id:'1',name:S('The Lab','The Lab'),map:{rooms:{
    a:{at:[1,2],kind:'start',tpl:P4_LAB.a,loot:['treasure'],sign:S('Dive: roll on the deep water, swim under the arch, find the chest. Bubbles give air.','Dive under the arch!'),noPots:true,noDecor:true},
    b:{at:[1,1],kind:'switches',tpl:P4_LAB.b,sign:S('The switch is under the flooded water. Dive and swim into it. The dark pools are linked.','Dive to the switch!'),noPots:true,noDecor:true},
    c:{at:[2,1],kind:'switches',tpl:P4_LAB.c,buried:'skey',sign:S('Burrow: roll on the sand. Dig under the seam, find the buried chest and the buried plate. Keep moving in quicksand!','Burrow under the seam!'),noPots:true,noDecor:true},
    d:{at:[2,0],kind:'free',tpl:P4_LAB.d,loot:['treasure'],sign:S('Moonfire the bridge to cross it. The brazier keeps it solid. Burn the tendrils. A glyph hides a door.','Moonfire the bridge!'),noPots:true,noDecor:true},
    e:{at:[1,0],kind:'moon',tpl:P4_LAB.e,moonbraz:{timed:8},noPots:true,noDecor:true},
    f:{at:[0,1],kind:'free',tpl:P4_LAB.f,loot:['treasure'],noPots:true,noDecor:true}},
    links:[['a','b','open'],['b','c','gate:b'],['c','d','sand'],['d','e','moon'],['b','e','vines'],['b','f','arch']]}}]});
// the outdoor sandbox on Moonfall: a lake with an arch, a grate, bubbles, an underwater switch and chest, linked pools,
// sand with a fence, buried things, quicksand, a moonstone with a beam, moon-glass, glyphs, a moon door, tendrils, a moon ramp
const P4_SB={x:9300,y:61600,built:false};
function p4SandboxOut(){
  const S0=P4_SB, x=S0.x, y=S0.y; if(S0.built) return S0; S0.built=true;
  const M=MAPS[3]; if(!M) return S0; const Z=tzOf(M);
  ELEV.clear({rect:[x-1300,y-700,x+1300,y+700]});
  POI.p4_sb={x,y,r:900,name:'The Moon Sandbox',level:17};
  // terrain: a lake (west), a reef wall across its middle with an arch under it, sand (east), a quicksand pan
  Z.lakes.push({x:x-650,y,r:360,amp:12});
  const reef=(px,py)=>px>x-700&&px<x-620&&py>y-380&&py<y+380;
  const ob=Z.block; Z.block=(px,py)=>(ob&&ob(px,py))||reef(px,py);
  const ox=Z.extra; Z.extra=(px,py,o)=>{ o.sink=0; o.sinkDeep=0; if(ox) ox(px,py,o); if(px>x+40&&px<x+1250&&py>y-560&&py<y+560&&!o.water){ o.sand=Math.max(o.sand||0,clamp(Math.min(px-x-40,x+1250-px,py-y+560,y+560-py)/70,0,1)); const qd=dist(px,py,x+700,y+330); if(qd<150){ o.sink=1; o.sinkDeep=qd<60?1:0; } } };
  p4Add('arch',{id:'p4sb_arch',x0:x-720,y0:y-44,x1:x-600,y1:y+44});
  p4Add('grate',{id:'p4sb_grate',x:x-900,y:y-160,w:18,h:200});
  p4Add('bubbles',{id:'p4sb_bub',x:x-520,y:y+150,on:2,off:2});
  p4Add('uswitch',{id:'p4sb_usw',x:x-460,y:y-120,then:()=>setBanner(S('Click!','Click!'),S('Something opened under the water.','A switch clicked.'),1.6)});
  p4Add('uchest',{id:'p4sb_uchest',x:x-820,y:y+160,coins:40});
  p4Add('pool',{id:'p4sb_poolA',x:x-150,y:y+430,kind:'shadow',link:'p4sb_poolB'});
  p4Add('pool',{id:'p4sb_poolB',x:x+300,y:y-470,kind:'shadow',link:'p4sb_poolA'});
  p4Add('pool',{id:'p4sb_dunpool',x:x-560,y:y+290,kind:'water',area:'p4_lab',label:S('Dive down to the Moon Lab','Dive to the Moon Lab'),arrive:S('Down through the water','Down you go!')});
  p4Add('sandwall',{id:'p4sb_fence',x:x+420,y:y-40,w:260,h:18,style:'fence'});
  p4Add('sandwall',{id:'p4sb_wall',x:x+260,y:y+150,w:20,h:180,style:'stone'});
  p4Add('bchest',{id:'p4sb_bchest',x:x+420,y:y-150,coins:50});
  p4Add('bswitch',{id:'p4sb_bsw',x:x+880,y:y-60,then:()=>setBanner(S('Clunk!','Clunk!'),S('A buried plate clicks down.','A buried plate clicked.'),1.6)});
  p4Add('moonstone',{id:'p4sb_stone',x:x-180,y:y-260,beam:{ang:Math.PI,len:300},glass:['p4sb_glass2']});
  p4Add('moonglass',{id:'p4sb_glass',x0:x-500,y0:y-300,x1:x-250,y1:y-240});
  p4Add('moonglass',{id:'p4sb_glass2',x0:x-760,y0:y-330,x1:x-500,y1:y-210});
  p4Add('glyph',{id:'p4sb_glyph1',x:x+40,y:y-420});
  p4Add('glyph',{id:'p4sb_glyph2',x:x+120,y:y-420});
  p4Add('moondoor',{id:'p4sb_door',x:x+80,y:y-520,w:120,h:40});
  p4Add('tendril',{id:'p4sb_tend1',x:x-60,y:y+150,r:30});
  p4Add('tendril',{id:'p4sb_tend2',x:x+10,y:y+190,r:30});
  ELEV.plateau({rect:[x+980,y-520,x+1240,y-260],lvl:1,style:'glass',noise:4,id:'p4sb_mesa'});
  ELEV.ramp({x0:x+1060,y0:y-270,x1:x+1140,y1:y-200,dir:'n',kind:'stairs',moon:true,id:'p4sb_ramp'});
  // drop the old ground art and props around it so they come back with the new terrain
  p4Evict(x,y,1500);
  try{ ELEV.rebuild(3); }catch(e){}
  return S0;
}
function p4Evict(x,y,r){
  const c0=Math.floor((x-r)/CH), c1=Math.floor((x+r)/CH), r0=Math.floor((y-r)/CH), r1=Math.floor((y+r)/CH);
  for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++){ const key=ckey(cx,cy); CHUNKS.delete(key); const arr=PROPS.get(key); if(arr){ for(const p of arr) if(p.col) removeCol(p.col); PROPS.delete(key); } }
}
function p4LabCell(room,c,r){ const A=AREA; if(!A||!A.rooms||!A.rooms[room]) return null; const R=A.rooms[room], cs=A.cave.cell; return {x:A.x0+(R.ox+1+c+0.5)*cs,y:A.y0+(R.oy+1+r+0.5)*cs}; }
function p4Grant(){ for(const id of ['jump','stride','dive','burrow','moonfire']) if(!hasAbil(id)){ G.abil=G.abil||{}; G.abil[id]=true; } }
function p4Test(kind){
  p4Grant(); G.flags.forge=true; for(const k of ['dive','burrow','deep','sand','moonswap','pool','sink','tendril','blub']) P4.tips[k]=9;
  kind=kind||'lab';
  if(kind==='out'){ if(AREA) exitArea(true); const S0=p4SandboxOut(); player.x=S0.x; player.y=S0.y; moveReset(player); updateCam(0,true); p4Reset(false); return {x:S0.x,y:S0.y}; }
  const room=kind==='lab'||kind==='cave'?'a':kind==='dive'?'a':kind==='burrow'?'c':kind==='moon'?'d':kind; dunGo('p4_lab',room); p4Reset(false); return {area:AREA&&AREA.id,room};
}
window.__ebX=Object.assign(window.__ebX||{},{
  p4Test, p4Add, p4Grant, p4MoonShine, p4MoonHits, p4MoonLitAt, p4GlassPlate, p4Hurt, p4RollTakes, P4, P4N, P4K, P4T,
  p4:{ cell:p4LabCell, sandbox:p4SandboxOut, SB:P4_SB,
    state:()=>{ const p=player; return {mode:P4.mode,mv:P4.mv?P4.mv.kind:null,swim:!!P4.swim,air:+P4.air.toFixed(2),airMax:+p4AirMax().toFixed(2),bm:+P4.bm.toFixed(2),moon:p4MoonOn(),x:Math.round(p.x),y:Math.round(p.y),z:+(p.z||0).toFixed(1),hp:Math.round(p.hp),sink:+P4.sinkT.toFixed(2),deep:p4DeepAt(p.x,p.y),sand:p4SandAt(p.x,p.y),roll:p4RollTakes()}; },
    objs:()=>p4Objs().filter(o=>o.p4).map(o=>({id:o.id,k:o.p4,x:Math.round(o.x),y:Math.round(o.y),on:!!o.on,open:!!o.open,lit:o.p4==='moonstone'?(o.keepOn||o.lit>0):o.p4==='moonglass'?p4GlassSolid(o):undefined,burnt:o.burnt,vis:o.vis!=null?+o.vis.toFixed(2):undefined})),
    cave:()=>{ const A=AREA, C=A&&A.p4; if(!C) return null; return {braz:C.braz.map(o=>({id:o.id,lit:o.lit>0})),under:C.under.map(o=>({id:o.id,k:o.k,on:!!o.on,open:!!G.found[o.id]})),buried:C.buried.map(o=>({id:o.id,k:o.k,on:!!o.on,open:!!o.open})),pools:C.pools.map(o=>({id:o.id,link:o.link&&o.link.id})),vines:C.vines.map(o=>({id:o.id,opened:o.opened,closed:o.closed})),mw:C.mw.map(g=>({id:g.id,n:g.cells.length})),glass:Array.from(C.glassT).filter(v=>v>0).length,glassOn:C.glassOn.reduce((a,b)=>a+b,0)}; },
    typ:(x,y)=>{ const k=tCell(x,y); return k<0?null:{k,typ:AREA.cave.typ[k],grid:AREA.cave.grid[k]}; },
    chip:()=>{ const L=SAFE.l+14, T0=SAFE.t+14, pw=Math.min(250,MINI_R().x-L-10), bx=L+12, bw=pw-62; return [bx+bw*0.8+16,T0+52.5]; },
    btn:id=>{ const b=tLayout().find(q=>q.id===id); return b?[b.x,b.y]:null; }, map:()=>curMap(), lvl:()=>elevLvl(player.x,player.y),
    moon:on=>{ G.flags.p4mf=on?1:0; return p4MoonOn(); }, roll:()=>{ const p=player; if(!p4RollTakes()) return false; p4RollAct(p,P4.inp||{mx:0,my:0}); return true; },
    probe:(x,y)=>({pb:playerBlocked(x,y),ba:blockedAt(x,y),glass:p4GlassSolidAt(x,y),face:elevFace(x,y),col:!!colAt(x,y,10),deep:p4DeepAt(x,y),swim:p4SwimAt(x,y),sand:p4SandAt(x,y),zb:p4ZBlock(x,y)}),
    scan:()=>{ const out=[]; let n=0; for(const id in CAVEMAP){ const def=AREADEFS[id]; if(!def||id.startsWith('p4_')) continue; n++; try{ if(genCaveRooms(def).p4) out.push(id); }catch(e){} } return {n,p4:out}; },
    go:(x,y)=>{ if(AREA) exitArea(true); player.x=x; player.y=y; moveReset(player); updateCam(0,true); p4Reset(false); return {x,y}; }}
});
