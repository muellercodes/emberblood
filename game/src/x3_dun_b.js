// ================= x3_dun_b: the last two dungeons of Act IV (v9, wave 2)
// The Mirror Temple (m_mirror, Ember's last flame: Moonfire) and the Eclipse Observatory (m_obs, the act's final dungeon:
// Duke Umberwing, Hush on the silver leash and the Moon Shard, the Eclipse Lens). Bible: ACT4.md 7.3, 7.4, 9.4 to 9.6,
// 5.3, 6.9 to 6.12. Built on e9a_dungeon (rooms, floors, chests, keys), p4_moon (moon-glass, braziers, glyphs, pools,
// sand), p3_frost (rune plates, updrafts, ribbons), p2_coast (posts, dash, shadow bars) and x3_foes (the boss rooms).
// Everything here is a wrapper or a registry entry; no other module is edited. Names: d3b*/D3B*, debug __ebX.d3b,
// cell types 260..263. Notes for the other helpers: scratchpad/M3DUN_B.md.
//
// The signature pieces:
//  - LIGHT: sunbeams (gold) and moonbeams (silver) from sky mirrors, wall windows and Blaze-lit lenses, bounced by
//    mirrors, carried between floors through beam shafts, onto sun and moon crystals; moonbeams make moon-glass real,
//    sunbeams burn shadow curtains and light Shades; hot glare beams hurt (a Shadow Dash passes them).
//  - THE ECLIPSE DIAL: SUN, MOON, ECLIPSE for a room or a whole floor. Each state turns windows on and off, moves the
//    orrery, lights moon-glass rings, makes shadow platforms solid, opens shadow pools and changes how dark it is.
//  - MIRROR TWINS that copy Ash backwards across a mirror line (Moonfire freezes one), the hourglass of sand, the star
//    dome, glass panes that a Ground Pound breaks, gears with a whip brake, lamp posts that moths cannot help staring at.

const D3B={dun:{m_mirror:1,m_obs:1},tips:{},spr:new Map(),t:0,trace:null,traceT:0,traceKey:'',lastRoom:null,lastArea:null,dlgQ:[],dbg:{}};
const d3bIsDef=def=>!!(def&&D3B.dun[dunRoot(def.id)]);
const d3bArea=()=>(AREA&&AREA.d3b)?AREA:null;
const d3bDiff=(e,n,h)=>typeof byDiff==='function'?byDiff(e,n,h):n;
const d3bOL=()=>(typeof SBC!=='undefined'&&typeof LOOK!=='undefined'&&LOOK.sb)?SBC.outline:'#1a1020';
function d3bSay(t,cb){ runDialogue([['narr',t]],()=>{ scene='play'; if(cb) cb(); saveGame(); }); }
function d3bTip(id,title,text){ if(D3B.tips[id]) return; D3B.tips[id]=1; try{ mvTip(title,text,7,'d3b_'+id); }catch(e){ setBanner(title,text,3); } }
const d3bCtl=()=>{ try{ return balCtls(); }catch(e){ return {jump:'C',roll:'Space',use:'E',fire:'K',attack:'J'}; } };
// a story beat from x3_story when it is in the build (each one plays once, then cb runs); fallback lines otherwise
function d3bBeat(name,fallback,cb){
  if(typeof m3sBeat==='function'){ let ok=false; try{ ok=!!m3sBeat(name,cb); }catch(e){ console.error(e); } if(!ok&&cb) cb(); return ok; }
  if(fallback&&!G.flags['d3b_fb_'+name]){ G.flags['d3b_fb_'+name]=1; later(0.3,()=>{ if(scene==='play') runDialogue(fallback,()=>{ scene='play'; if(cb) cb(); saveGame(); }); else if(cb) cb(); }); return true; }
  if(cb) cb(); return false; }

// ---------- 1. cells and template letters
// Ш shadow platform (solid only while the room's dial says ECLIPSE), Ж shadow curtain (a wall a sunbeam burns away for
// good), Ψ the hourglass neck (a wall; while the sand pours it is a sand seam a burrower passes), Ω a glass pane (raised
// floor until a Ground Pound breaks it, then it drops to the floor below it in the same room)
const D3T={shadow:260,curtain:261,neck:262,pane:263};
Object.assign(TY,{d3b_shadow:260,d3b_curtain:261,d3b_neck:262,d3b_pane:263});
const D3B_CELLS={'Ш':{b:'.',t:260},'Ж':{b:'.',t:261},'Ψ':{b:'#',t:262},'Ω':{b:'.',t:263}};
// marks (taken out of the template before the engine reads it; options per cell in the room's `o3:{'c,r':{...}}`):
// ☼ sun crystal, ☽ moon crystal, Φ sky mirror (a skylight shines down on it; it turns a quarter per hit), Ϙ a fixed
// window or lamp that throws a beam, Δ the Eclipse Dial, Θ a dial stud (a small dial for the same room or floor), Π a
// twin plate, Σ the twin start tile, Ŧ a lamp post, Ø a lens (Blaze lights it: a sunbeam for 8 s), ✦ a star lamp, ⊕ a
// beam shaft to another floor, ⌂ the great telescope, Ξ the brass sun of the orrery, Ϟ an hourglass flip switch,
// ¶ a prop spot (room `props`)
const D3B_MARK=new Set(['☼','☽','Φ','Ϙ','Δ','Θ','Π','Σ','Ŧ','Ø','✦','⊕','⌂','Ξ','Ϟ']);
function d3bTpl(rows){
  const tpl=[], cells=[], marks=[];
  for(let r=0;r<rows.length;r++){ let s=''; const row=Array.from(rows[r]);
    for(let c=0;c<row.length;c++){ const ch=row[c];
      if(D3B_CELLS[ch]){ cells.push({c,r,t:D3B_CELLS[ch].t}); s+=D3B_CELLS[ch].b; }
      else if(D3B_MARK.has(ch)){ marks.push({c,r,ch}); s+='.'; }
      else s+=ch; }
    tpl.push(s); }
  return {tpl,cells,marks};
}
// d3bR(room): prepares a room definition (the engine then sees only its own letters)
function d3bR(o){ if(o.tpl&&!o.d3ok){ const t=d3bTpl(o.tpl); o.tpl=t.tpl; o.d3c=t.cells; o.d3m=t.marks; o.d3ok=true; } return o; }
const d3bOpt=(R,c,r)=>(R.o3&&R.o3[`${c},${r}`])||{};
// the cells: applied after the engine laid the rooms out (only in these two dungeons)
{ const base=genCaveRooms; genCaveRooms=function(def){
    const c=base.apply(this,arguments); if(!d3bIsDef(def)) return c;
    // the engine keeps cell types in bytes; these two dungeons use types 260..263, so their cave gets 16-bit types
    // (everything reads c.typ[k] by index, and a copy by slice() keeps the wider array)
    if(!(c.typ instanceof Uint16Array)) c.typ=Uint16Array.from(c.typ);
    const w=c.w, SK=caveSid(def);
    for(const id in c.rooms){ const R=c.rooms[id];
      for(const q of R.d3c||[]){ const k=(R.oy+1+q.r)*w+(R.ox+1+q.c); if(c.grid[k]===1&&q.t!==D3T.neck) continue;
        c.typ[k]=q.t; if(q.t===D3T.neck) c.grid[k]=1; }
      // cells under a mark that must stay a pit (a hook hanging over the gears)
      for(const q of R.pitCells||[]){ const k=(R.oy+1+q[1])*w+(R.ox+1+q[0]); if(c.grid[k]===0) c.typ[k]=TY.pit; }
      // a mark with three raised neighbours stands on the raised floor (like the engine's own marks)
      for(const m of R.d3m||[]){ const k=(R.oy+1+m.r)*w+(R.ox+1+m.c); if(c.typ[k]!==0) continue; let n=0;
        for(const d of DIRS){ const t=c.typ[k+d[0]+d[1]*w]; if(t===TY.high||t===TY.ledge) n++; } if(n>=3) c.typ[k]=TY.high; } }
    c.d3b=true; return c; }; }
// the dial of a room: R.dial names its scope (a room id, or a floor name shared by several rooms). 0 SUN, 1 MOON, 2 ECLIPSE
const D3B_DIAL=['sun','moon','eclipse'];
const d3bDialKey=(DK,scope)=>`d3bd_${DK}_${scope}`;
function d3bDialAt(DK,scope){ return scope?(G.found[d3bDialKey(DK,scope)]|0):-1; }
function d3bDialOf(A,R){ if(!A||!R||!R.dial) return -1; return d3bDialAt(caveDsid(A.def),R.dial); }
// cells: where Ash can stand
function d3bPaneBroken(A,k){ return !!G.found[`d3bp_${caveSid(A.def)}_${k}`]; }
function d3bShadowOn(A,k){ const R=d3bRoomOfCell(A,k); return d3bDialOf(A,R)===2; }
function d3bRoomOfCell(A,k){ const c=A.cave, i=k%c.w, j=(k-i)/c.w; for(const id in A.rooms){ const R=A.rooms[id]; if(i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih) return R; } return null; }
{ const base=dunGround; dunGround=function(k,t,T){
    if(t>=260&&t<=263){ const A=AREA; if(!A||!A.d3b) return t!==D3T.shadow;
      if(t===D3T.shadow) return dunCovered(k)||A.d3b.shadow[k]===1;
      if(t===D3T.curtain) return true;
      if(t===D3T.pane) return true;
      return false; }
    return base.apply(this,arguments); }; }
{ const base=dunHole; dunHole=function(k,t,T){ if(t===D3T.shadow){ const A=AREA; return !(A&&A.d3b&&A.d3b.shadow[k]===1)&&!dunCovered(k); } return base.apply(this,arguments); }; }
{ const base=dunH; dunH=function(k){ const A=AREA; if(A&&A.d3b){ const t=A.cave.typ[k]; if(t===D3T.pane) return d3bPaneBroken(A,k)?0:1; } return base.apply(this,arguments); }; }
// the hourglass neck: a wall, and a sand seam while the sand pours (p4_moon lets a burrower through a seam)
function d3bNeckSet(A,on){ const c=A.cave; for(const k of A.d3b.necks) c.typ[k]=on?P4T.seam:D3T.neck; }

// ---------- 2. light: the beam network of a whole dungeon
// Beams run cell by cell inside a room (N, E, S, W), bounce off mirrors, stop at walls, pedestals, crystals and shadow
// curtains, and go up or down a beam shaft (⊕ pairs, any floor). The trace is a pure function of the room templates
// and what is saved (mirror turns, sky mirror turns, burnt curtains, the dials) plus the lenses lit in the room Ash is
// in, so a beam that starts on another floor reaches this one exactly as it would if that floor were loaded.
const D3B_DX=[0,1,0,-1], D3B_DY=[-1,0,1,0];
const D3B_BEAMK=new Set(['m','Φ','Ϙ','Ø','☼','☽','⊕','Ж']);
// static info of a room for the tracer (cached on the room's definition)
function d3bRI(aid,rid){
  const M=CAVEMAP[aid], R=M&&M.rooms&&M.rooms[rid]; if(!R) return null; if(R._ri) return R._ri;
  const sp=R.span||[1,1], iw=sp[0]*RSX-1, ih=sp[1]*RSY-1, wall=new Uint8Array(iw*ih), obj=new Map(), def=AREADEFS[aid]||{};
  const tpl=R.tpl&&Array.isArray(R.tpl)?R.tpl:null;
  for(let r=0;r<ih;r++) for(let c=0;c<iw;c++){ const ch=tpl?((tpl[r]||'')[c]||'.'):'.'; if(ch==='#') wall[r*iw+c]=1; else if(ch==='m') obj.set(r*iw+c,{ch:'m',c,r}); }
  for(const q of R.d3c||[]){ const i=q.r*iw+q.c; if(q.t===D3T.neck) wall[i]=1; if(q.t===D3T.curtain) obj.set(i,{ch:'Ж',c:q.c,r:q.r}); }
  for(const m of R.d3m||[]) if(D3B_BEAMK.has(m.ch)) obj.set(m.r*iw+m.c,{ch:m.ch,c:m.c,r:m.r,opt:d3bOpt(R,m.c,m.r)});
  // windows that throw a beam without taking a cell (R.emit:[{at:[c,r],kind,dir,dial,win}])
  for(const e of R.emit||[]) obj.set(e.at[1]*iw+e.at[0],{ch:'Ϙ',c:e.at[0],r:e.at[1],opt:e,emit:true});
  // shadow curtains burn as a group (the connected Ж cells)
  const grp=new Map(); for(const [i,o] of obj){ if(o.ch!=='Ж'||grp.has(i)) continue; const st=[i], g=[]; grp.set(i,i); while(st.length){ const q=st.pop(); g.push(q); const qc=q%iw, qr=(q-qc)/iw;
      for(let d=0;d<4;d++){ const nc=qc+D3B_DX[d], nr=qr+D3B_DY[d]; if(nc<0||nr<0||nc>=iw||nr>=ih) continue; const n=nr*iw+nc, on=obj.get(n); if(on&&on.ch==='Ж'&&!grp.has(n)){ grp.set(n,i); st.push(n); } } }
    const id=Math.min(...g); for(const q of g) grp.set(q,id); }
  return R._ri={aid,rid,R,iw,ih,wall,obj,grp,sid:def.sid||aid,dsid:def.dsid||aid,key:aid+'|'+rid};
}
const d3bMirKey=(ri,c,r)=>`dn_${ri.sid}_${ri.rid}_m${c}_${r}_r`;
function d3bMirRot(ri,c,r){ const v=G.found[d3bMirKey(ri,c,r)]; if(v!=null) return v|0; const R=ri.R; return (R.rot&&R.rot[`${c},${r}`])|0; }
const d3bSkyKey=(ri,c,r)=>`d3bs_${ri.sid}_${ri.rid}_${c}_${r}`;
function d3bSkyDir(ri,c,r,opt){ const v=G.found[d3bSkyKey(ri,c,r)]; if(v!=null) return v|0; return DIRN[(opt&&opt.dir)||'n']; }
const d3bCurtKey=(ri,g)=>`d3bc_${ri.sid}_${ri.rid}_${g}`;
const d3bTgtKey=(ri,c,r)=>`d3bt_${ri.sid}_${ri.rid}_${c}_${r}`;
// every room of a dungeon, every floor
function d3bRooms(dun){ const D=DUNGEONS[dun], out=[]; if(!D) return out; for(const aid of D.floorIds){ const M=CAVEMAP[aid]; if(!M) continue; for(const rid in M.rooms){ const ri=d3bRI(aid,rid); if(ri) out.push(ri); } } return out; }
// the beam shafts: pairs of ⊕ with the same id, on any floor
function d3bShafts(dun){ const D=DUNGEONS[dun]; if(!D) return {}; if(D._d3sh) return D._d3sh; const m={};
  for(const ri of d3bRooms(dun)) for(const [i,o] of ri.obj) if(o.ch==='⊕'){ const id=o.opt.id||'?'; (m[id]=m[id]||[]).push({ri,i,c:o.c,r:o.r,out:DIRN[o.opt.out||'n']}); }
  return D._d3sh=m; }
// is an emitter shining? (a dial state it needs; a lens only while lit in the room Ash is in)
function d3bEmitOn(ri,o){
  const opt=o.opt||{}, st=d3bDialAt(ri.dsid,ri.R.dial);
  if(opt.dial&&st>=0&&st!==D3B_DIAL.indexOf(opt.dial)) return false;
  if(o.ch==='Ø'){ if(st>=0&&st!==0) return false; const A=AREA; if(!A||!A.d3b||A.id!==ri.aid) return false; const L=A.d3b.lensOn[ri.rid+':'+o.c+','+o.r]; return L>0; }
  return true;
}
function d3bTraceAll(dun){
  const out={segs:[],hits:new Map(),curt:new Map(),shaft:new Set()}, sh=d3bShafts(dun);
  for(const ri of d3bRooms(dun)) for(const [i,o] of ri.obj){
    if(o.ch!=='Φ'&&o.ch!=='Ϙ'&&o.ch!=='Ø') continue; if(!d3bEmitOn(ri,o)) continue;
    const opt=o.opt||{}, kind=o.ch==='Ø'?'sun':(opt.kind||'sun'), d=o.ch==='Φ'?d3bSkyDir(ri,o.c,o.r,opt):DIRN[opt.dir||'n'];
    d3bTraceBeam(out,sh,ri,o.c,o.r,d,kind,!!(opt.hot||ri.R.hot),o.ch);
  }
  return out;
}
function d3bTraceBeam(out,sh,ri,c,r,d,kind,hot,from){
  let pts=[[c+0.5,r+0.5]]; const seen=new Set(); let hops=0;
  const done=()=>{ out.segs.push({aid:ri.aid,rid:ri.rid,kind,hot,pts}); };
  for(let n=0;n<600;n++){
    c+=D3B_DX[d]; r+=D3B_DY[d];
    const edge=[c+0.5-D3B_DX[d]*0.5,r+0.5-D3B_DY[d]*0.5];
    if(c<0||r<0||c>=ri.iw||r>=ri.ih){ pts.push(edge); return done(); }
    const i=r*ri.iw+c, key=ri.key+'|'+(i*4+d); if(seen.has(key)){ pts.push([c+0.5,r+0.5]); return done(); } seen.add(key);
    if(ri.wall[i]){ pts.push(edge); return done(); }
    const o=ri.obj.get(i); if(!o) continue;
    switch(o.ch){
      case 'm': { pts.push([c+0.5,r+0.5]); const rot=d3bMirRot(ri,c,r), dx=D3B_DX[d], dy=D3B_DY[d], nx=rot?dy:-dy, ny=rot?dx:-dx; d=nx===0?(ny<0?0:2):(nx>0?1:3); break; }
      case 'Ϙ': if(o.emit) break; pts.push(edge); return done();
      case 'Φ': case 'Ø': pts.push(edge); return done();
      case '☼': case '☽': pts.push([c+0.5,r+0.5]); out.hits.set(ri.key+'|'+i,kind); return done();
      case 'Ж': { const g=ri.grp.get(i); if(G.found[d3bCurtKey(ri,g)]) break; pts.push([c+0.5-D3B_DX[d]*0.35,r+0.5-D3B_DY[d]*0.35]); out.curt.set(ri.key+'|'+g,kind); return done(); }
      case '⊕': { pts.push([c+0.5,r+0.5]); out.shaft.add(ri.key+'|'+i); const L=sh[o.opt.id||'?']||[], to=L.find(q=>!(q.ri===ri&&q.i===i)); if(!to||++hops>8) return done();
        done(); ri=to.ri; c=to.c; r=to.r; d=to.out; pts=[[c+0.5,r+0.5]]; out.shaft.add(ri.key+'|'+to.i); break; }
    }
  }
  done();
}
// a world point of a room cell (the room must be in the area Ash is in)
function d3bW(A,R,px,py){ const cs=A.cave.cell; return {x:A.x0+(R.ox+1+px)*cs,y:A.y0+(R.oy+1+py)*cs}; }
// the live trace: every 0.1 s, or at once after anything turned
function d3bRetrace(A){ const dun=dunRoot(A.def.id); D3B.trace=d3bTraceAll(dun); D3B.traceT=0.1; d3bLiveSegs(A); }
function d3bLiveSegs(A){
  const L=[]; if(!D3B.trace){ A.d3b.segs=L; return; }
  for(const s of D3B.trace.segs){ if(s.aid!==A.id) continue; const R=A.rooms[s.rid]; if(!R) continue;
    const pts=s.pts.map(q=>d3bW(A,R,q[0],q[1])); L.push({kind:s.kind,hot:s.hot,pts,room:s.rid}); }
  A.d3b.segs=L;
}
function d3bBeamTick(A,dt){
  const X=A.d3b; X.beamT=(X.beamT||0)-dt; if(X.beamT<=0||X.dirty){ X.beamT=0.1; X.dirty=false; d3bRetrace(A); }
  const T=D3B.trace; if(!T) return;
  // what the light does here: moonbeams make moon-glass real and count as moonlight, sunbeams count as bright light
  for(const s of X.segs) for(let n=1;n<s.pts.length;n++){ const a=s.pts[n-1], b=s.pts[n];
    if(s.kind==='moon'){ if(typeof p4MoonShine==='function') p4MoonShine(a.x,a.y,b.x,b.y,30); }
    else if(typeof p2ShineSeg==='function') p2ShineSeg(a.x,a.y,b.x,b.y,34); }
  // crystals drink the light of their own kind
  for(const o of X.tgts){ const k=T.hits.get(o.ri.key+'|'+o.li); const on=k===o.want;
    if(k&&!on&&!o.lit&&!(o.nope>G.time)){ o.nope=G.time+3; ftext(o.x,o.y-44,o.want==='moon'?S('It wants moonlight.','It wants moonlight.'):S('It wants sunlight.','It wants sunlight.'),o.want==='moon'?'#cfe0ff':'#ffe6a0',13); }
    o.hot=on?o.hot+dt:Math.max(0,o.hot-dt*2); o.glow=on?1:Math.max(0,(o.glow||0)-dt*3);
    if(on&&!o.lit&&o.hot>0.35) d3bTgtLight(A,o); }
  // shadow curtains burn in sunlight (a moonbeam only makes them shiver)
  for(const g of X.curts){ if(g.burnt) continue; const k=T.curt.get(g.ri.key+'|'+g.g); if(k==='sun'){ g.heat+=dt; if(Math.random()<0.5){ const q=pick(g.cells); const p=tPos(q); emit(p.x+rand(-18,18),p.y-rand(0,40),1,{col:'255,200,120',ang:-Math.PI/2,spread:0.6,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1,zmax:3}); }
      if(g.heat>=d3bDiff(0.4,0.6,0.7)) d3bCurtBurn(A,g); } else if(g.heat>0) g.heat=Math.max(0,g.heat-dt); }
  // hot glare: on foot it burns and shoves Ash back; a Shadow Dash slips through
  const p=player; if(!p.dead&&scene==='play'&&!(typeof p2Shadowed==='function'&&p2Shadowed())&&!(typeof p4Busy==='function'&&p4Busy())){
    for(const s of X.segs){ if(!s.hot) continue; for(let n=1;n<s.pts.length;n++){ const a=s.pts[n-1], b=s.pts[n], d=segD(p.x,p.y,a.x,a.y,b.x,b.y); if(d>14+(p.r||12)*0.5) continue;
      if(!(p.iframes>0)&&!(X.glareCd>G.time)){ X.glareCd=G.time+0.5; const t=clamp(((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/Math.max(1,(b.x-a.x)**2+(b.y-a.y)**2),0,1), sx=lerp(a.x,b.x,t), sy=lerp(a.y,b.y,t);
        const back=X.lastSafe||{x:p.x,y:p.y}; const amt=Math.max(1,Math.round(p.maxHp*d3bDiff(0.03,0.06,0.08)));
        hurtPlayer(amt,sx,sy,260); p.x=back.x; p.y=back.y; if(A.tri){ A.tri.lx=p.x; A.tri.ly=p.y; }
        ftext(p.x,p.y-40,S('Too bright! Hot!','Too hot!'),'#ffe08a',14); emit(sx,sy-10,14,{col:'255,236,170',smin:40,smax:150,lmin:.2,lmax:.5,zmin:1,zmax:3});
        d3bTip('glare',S('Glare','Glare'),S(`Sunbeams in here are hot. Turn a mirror to send a beam away, or Shadow Dash (${d3bCtl().roll}) right through it.`,`Hot beams! Turn a mirror, or Shadow Dash through.`)); }
      else if(X.lastSafe){ p.x=X.lastSafe.x; p.y=X.lastSafe.y; } } } }
  // remember the last spot clear of every hot beam
  if(!p.dead){ let clear=true; for(const s of X.segs){ if(!s.hot) continue; for(let n=1;n<s.pts.length&&clear;n++){ const a=s.pts[n-1], b=s.pts[n]; if(segD(p.x,p.y,a.x,a.y,b.x,b.y)<30) clear=false; } } if(clear&&!airborne()) X.lastSafe={x:p.x,y:p.y}; }
}
function d3bTgtLight(A,o){
  o.lit=true; G.found[o.key]=1; SFX.play('shrine'); shake(3); emit(o.x,o.y-20,34,{col:o.want==='moon'?'210,225,255':'255,236,160',smin:40,smax:180,lmin:.4,lmax:.9,zmin:1.5,zmax:3});
  const R=A.rooms[o.room], all=A.d3b.tgts.filter(q=>q.room===o.room);
  if(R&&!R.solved&&all.every(q=>q.lit)&&D3B_TGT_SOLVE[R.kind]) solveRoom(R);
  else setBanner(o.want==='moon'?S('The moon crystal glows','The moon crystal glows!'):S('The sun crystal blazes','The sun crystal blazes!'),'',1.8);
  saveGame();
}
const D3B_TGT_SOLVE={d3beam:1,d3dial:1};
function d3bCurtBurn(A,g){
  g.burnt=true; G.found[g.key]=1; refreshCaveGates(); SFX.play('boom',0.6); shake(4);
  for(const k of g.cells){ const p=tPos(k); for(let i=0;i<6;i++) emit(p.x+rand(-20,20),p.y-rand(0,50),1,{col:i%2?'40,20,60':'255,210,120',glow:i%2===1,ang:-Math.PI/2,spread:0.9,smin:30,smax:140,lmin:.4,lmax:1,zmin:1.5,zmax:4}); }
  setBanner(S('The shadow curtain burns away','The shadow curtain burns away!'),S('Sunlight is too much for it.','Sunlight wins!'),2.2); D3B.trace=null; A.d3b.dirty=true; saveGame();
}
// ---------- the beams on screen (the floor layer, under everyone)
function d3bDrawBeams(A,t){
  const X=A.d3b; if(!X||!X.segs.length) return;
  ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  // painted bands (they read on the white temple floor and on the night-blue one): a soft colored halo, a strong
  // colored band, a thin ink edge and a bright core; a hot sunbeam (one that burns) is orange-red and wider
  for(const s of X.segs){ const moon=s.kind==='moon', col=moon?'190,215,255':(s.hot?'255,236,170':'255,214,110'), lift=moon?8:12;
    const fl=0.85+0.15*Math.sin(t*(s.hot?13:7)), path=()=>{ ctx.beginPath(); s.pts.forEach((q,n)=>n?ctx.lineTo(q.x,q.y-lift):ctx.moveTo(q.x,q.y-lift)); };
    const band=moon?'110,150,255':(s.hot?'255,96,40':'255,176,40'), mid=moon?'150,185,255':(s.hot?'255,140,60':'255,206,80');
    path(); ctx.strokeStyle=`rgba(${band},${0.26*fl})`; ctx.lineWidth=s.hot?30:22; ctx.stroke();
    ctx.strokeStyle=`rgba(${moon?'40,50,120':'120,60,10'},.45)`; ctx.lineWidth=s.hot?13:11; ctx.stroke();
    ctx.strokeStyle=`rgba(${mid},${0.92*fl})`; ctx.lineWidth=s.hot?10:8; ctx.stroke();
    ctx.strokeStyle=moon?'rgba(244,248,255,.95)':'rgba(255,252,232,.95)'; ctx.lineWidth=3; ctx.stroke();
    // little bright dashes running along the beam show which way the light goes
    ctx.setLineDash([4,22]); ctx.lineDashOffset=-((t*(moon?40:70))%26); ctx.strokeStyle='rgba(255,255,255,.95)'; ctx.lineWidth=5; ctx.stroke(); ctx.setLineDash([]); }
  ctx.globalCompositeOperation='lighter';
  for(const s of X.segs){ const moon=s.kind==='moon', col=moon?'190,215,255':(s.hot?'255,236,170':'255,214,110'), lift=moon?8:12;
    // sparkles drifting along the beam
    for(let n=1;n<s.pts.length;n++){ const a=s.pts[n-1], b=s.pts[n], L=Math.hypot(b.x-a.x,b.y-a.y); for(let k=0;k<Math.min(8,L/60);k++){ const f=((t*(moon?0.25:0.45)+k*0.137+n*0.31)%1); ctx.fillStyle=`rgba(${moon?'235,240,255':'255,250,220'},${0.55*Math.sin(f*Math.PI)})`; ctx.fillRect(lerp(a.x,b.x,f)-1.2,lerp(a.y,b.y,f)-lift-1.2,2.4,2.4); } }
    const e=s.pts[s.pts.length-1]; glowAt(e.x,e.y-lift,moon?22:26,col,0.45); }
  ctx.restore();
}

// ---------- 3. building a room's pieces (after the engine built its own)
Object.assign(PUZZLE_KINDS,{d3beam:1,d3dial:1,d3twin:1,d3stars:1,d3clock:1,d3gears:1});
Object.assign(SEAL_KINDS,{d3beam:1,d3twin:1,d3stars:1});
function d3bState(A){ return A.d3b||(A.d3b={objs:[],stand:[],tgts:[],curts:[],gates:[],segs:[],lensOn:{},necks:[],shadow:new Uint8Array(A.cave.w*A.cave.h),twins:{},hidStairs:[],lamps:[],stars:[],dials:[],flips:[],t:0,dirty:true,beamT:0}); }
function d3bObj(A,o,stand){ o.d3b=true; A.objs.push(o); A.d3b.objs.push(o); if(stand) A.d3b.stand.push(o); return o; }
{ const base=dunBuildRoom; dunBuildRoom=function(A,def,R,ms,P,spot,freeSpot,rng){ base.apply(this,arguments); if(d3bIsDef(def)) try{ d3bBuildRoom(A,def,R,P); }catch(e){ console.error(e); } }; }
function d3bBuildRoom(A,def,R,P){
  const X=d3bState(A), c=A.cave, cs=c.cell, SK=caveSid(def), DK=caveDsid(def), aid=def.id, ri=d3bRI(aid,R.id);
  const at=(cc,rr)=>P(R.ox+1+cc,R.oy+1+rr);
  for(const m of R.d3m||[]){
    const p=at(m.c,m.r), opt=d3bOpt(R,m.c,m.r), k=(R.oy+1+m.r)*c.w+(R.ox+1+m.c), id=`d3b_${SK}_${R.id}_${m.c}_${m.r}`, li=ri?m.r*ri.iw+m.c:0;
    switch(m.ch){
      case '☼': case '☽': { const key=d3bTgtKey(ri,m.c,m.r), o=d3bObj(A,{k:'d3b_tgt',x:p.x,y:p.y,id,room:R.id,want:m.ch==='☼'?'sun':'moon',ri,li,key,lit:!!G.found[key]||!!R.solved,hot:0,r:16},true);
        o.prompt=()=>S('Look at the crystal','Look at the crystal'); addAreaCol({t:'c',x:p.x,y:p.y,r:14}); X.tgts.push(o); o.L={x:p.x,y:p.y-24,r:190,i:o.lit?0.7:0.15}; A.lights.push(o.L); break; }
      case 'Φ': { const o=d3bObj(A,{k:'d3b_sky',x:p.x,y:p.y,id,room:R.id,ri,c:m.c,r:m.r,opt,cd:0,spin:0,r0:22},true);
        o.prompt=()=>S('Turn the sky mirror','Turn the mirror'); addAreaCol({t:'c',x:p.x,y:p.y,r:16}); A.lights.push({x:p.x,y:p.y-30,r:200,i:0.45}); break; }
      case 'Ϙ': { const o=d3bObj(A,{k:'d3b_win',x:p.x,y:p.y,id,room:R.id,ri,c:m.c,r:m.r,opt},true); if(!opt.win) addAreaCol({t:'c',x:p.x,y:p.y,r:12}); break; }
      case 'Ø': { const o=d3bObj(A,{k:'d3b_lens',x:p.x,y:p.y,id,room:R.id,ri,c:m.c,r:m.r,opt,heat:0,warm:0},true);
        o.prompt=()=>S('Look at the lens','Look at the lens'); addAreaCol({t:'c',x:p.x,y:p.y,r:15}); break; }
      case '⊕': d3bObj(A,{k:'d3b_shaft',x:p.x,y:p.y,id,room:R.id,ri,li,opt}); break;
      case 'Δ': { const o=d3bObj(A,{k:'d3b_dial',x:p.x,y:p.y,id,room:R.id,scope:R.dial,cd:0,spin:0,ang:0},true);
        o.prompt=()=>S(`Turn the Eclipse Dial (now ${D3B_DNAME[d3bDialOf(A,R)]||'SUN'})`,`Turn the Dial (${D3B_DNAME[d3bDialOf(A,R)]||'SUN'})`); addAreaCol({t:'c',x:p.x,y:p.y,r:22}); X.dials.push(o); A.lights.push({x:p.x,y:p.y-26,r:200,i:0.5}); break; }
      case 'Θ': { const o=d3bObj(A,{k:'d3b_stud',x:p.x,y:p.y,id,room:R.id,scope:R.dial,set:opt.set||null,cd:0,spin:0,ang:0,mover:opt.mover!=null?opt.mover:null,ox:0,oy:0},true);
        o.prompt=()=>o.set?S(`Turn the dial stud to ${D3B_DNAME[D3B_DIAL.indexOf(o.set)]}`,`Turn it to ${D3B_DNAME[D3B_DIAL.indexOf(o.set)]}`):S(`Turn the dial stud (now ${D3B_DNAME[d3bDialOf(A,R)]||'SUN'})`,`Turn the stud`);
        if(o.mover==null) addAreaCol({t:'c',x:p.x,y:p.y,r:9}); X.dials.push(o); A.lights.push(o.L={x:p.x,y:p.y-12,r:120,i:0.35}); break; }
      case 'Π': d3bObj(A,{k:'d3b_plate',x:p.x,y:p.y,id,room:R.id,on:false}); break;
      case 'Σ': d3bObj(A,{k:'d3b_sync',x:p.x,y:p.y,id,room:R.id}); break;
      case 'Ŧ': { const o=d3bObj(A,{k:'d3b_lamp',x:p.x,y:p.y,id,room:R.id,high:!!opt.high,lit:0,ever:false,warm:0,r:14},true);
        o.L={x:p.x,y:p.y-(o.high?92:52),r:o.high?320:270,i:0,fire:true}; A.lights.push(o.L); if(!o.high) addAreaCol({t:'c',x:p.x,y:p.y,r:10}); else addAreaCol({t:'c',x:p.x,y:p.y,r:14});
        o.prompt=()=>S('Look at the lamp post','Look at the lamp'); X.lamps.push(o); if(opt.start) o.start=true; break; }
      case '✦': { const o=d3bObj(A,{k:'d3b_star',x:p.x,y:p.y,id,room:R.id,kind:opt.kind||'fire',high:!!opt.high,good:!!opt.good,lit:!!R.solved&&!!opt.good,heat:0,r:16},true);
        o.L={x:p.x,y:p.y-(o.high?96:44),r:220,i:o.lit?0.8:0,fire:o.kind==='fire'}; A.lights.push(o.L); addAreaCol({t:'c',x:p.x,y:p.y,r:11});
        o.prompt=()=>S('Look at the star lamp','Look at the star lamp'); X.stars.push(o); break; }
      case '⌂': { const o=d3bObj(A,{k:'d3b_scope',x:p.x,y:p.y,id,room:R.id,r:26},true); addAreaCol({t:'c',x:p.x,y:p.y,r:20}); o.prompt=()=>S('Look through the great telescope','Look through the telescope'); break; }
      case 'Ξ': { d3bObj(A,{k:'d3b_osun',x:p.x,y:p.y,id,room:R.id},true); addAreaCol({t:'c',x:p.x,y:p.y,r:22}); A.lights.push({x:p.x,y:p.y-30,r:260,i:0.5}); break; }
      case 'Ϟ': { const o=d3bObj(A,{k:'d3b_flip',x:p.x,y:p.y,id,room:R.id,half:opt.half||'N',bump:0,r:22},true); o.prompt=()=>S('Look at the flip switch','Look at the switch'); X.flips.push(o); break; }
    }
  }
  for(const e of R.emit||[]){ const p=at(e.at[0],e.at[1]); d3bObj(A,{k:'d3b_win',x:p.x,y:p.y,id:`d3b_${SK}_${R.id}_w${e.at[0]}_${e.at[1]}`,room:R.id,ri,c:e.at[0],r:e.at[1],opt:e},true); }
  if(R.warpAfter&&G.flags.m_reforged){ const p=at(R.warpAfter[0],R.warpAfter[1]); A.objs.push({k:'twarp',x:p.x,y:p.y,id:`d3bwp_${SK}_${R.id}`,room:R.id}); A.lights.push({x:p.x,y:p.y,r:210,i:0.6}); }
  // cells: shadow curtains (a gate on each cell, burnt as a group), the hourglass neck, shadow platforms
  if(ri) for(const [li,o] of ri.obj){ if(o.ch!=='Ж') continue; const g=ri.grp.get(li); let G0=X.curts.find(q=>q.ri===ri&&q.g===g);
    if(!G0){ G0={ri,g,key:d3bCurtKey(ri,g),cells:[],burnt:!!G.found[d3bCurtKey(ri,g)],heat:0,room:R.id}; X.curts.push(G0); }
    const k=(R.oy+1+o.r)*c.w+(R.ox+1+o.c), p=at(o.c,o.r); G0.cells.push(k);
    const gt={k:'d3bg',x:p.x,y:p.y,id:`d3bg_${SK}_${R.id}_${o.c}_${o.r}`,room:R.id,cells:[k],closed:!G0.burnt,grp:G0,r:cs*0.5}; gt.prompt=()=>gt.closed?S('Look at the shadow curtain','Look at the curtain'):null;
    A.gates.push(gt); c.dyn[k]=A.gates.length; A.objs.push(gt); X.gates.push(gt); }
  for(const q of R.d3c||[]){ const k=(R.oy+1+q.r)*c.w+(R.ox+1+q.c); if(q.t===D3T.neck) X.necks.push(k); }
  // props, the mirage and the room's special pieces
  for(const pr of R.props||[]){ const p=at(pr[1],pr[2]); d3bObj(A,Object.assign({k:'d3b_prop',kind:pr[0],x:p.x,y:p.y,id:`d3bpr_${R.id}_${pr[1]}_${pr[2]}`,room:R.id},pr[3]||{}),!(pr[3]&&pr[3].flat));
    if(pr[3]&&pr[3].col) addAreaCol({t:'c',x:p.x,y:p.y,r:pr[3].col}); if(pr[3]&&pr[3].glow) A.lights.push({x:p.x,y:p.y-(pr[3].gy||20),r:pr[3].glow,i:pr[3].gi||0.5}); }
  if(R.mirage){ const p=at(R.mirage[0],R.mirage[1]); d3bObj(A,{k:'d3b_mirage',x:p.x,y:p.y-cs*0.9,id:`d3bmi_${R.id}`,room:R.id,a:1},true); }
  if(R.terrace){ const p=at(R.terrace[0],R.terrace[1]); const o=d3bObj(A,{k:'d3b_terrace',x:p.x,y:p.y,id:`d3bte_${R.id}`,room:R.id,r:30},true); o.prompt=()=>S('Step out onto the Star Terrace','Go out to the terrace'); }
  if(R.rest){ const p=at(R.rest[0],R.rest[1]); const o=d3bObj(A,{k:'d3b_rest',x:p.x,y:p.y,id:`d3bre_${R.id}`,room:R.id,r:22},true); addAreaCol({t:'c',x:p.x,y:p.y,r:14}); o.prompt=()=>S('Rest by the warm lamp (heal and save)','Rest by the lamp'); A.lights.push({x:p.x,y:p.y-40,r:280,i:0.85,fire:true}); }
  if(R.lensSpot){ const p=at(R.lensSpot[0],R.lensSpot[1]); const o=d3bObj(A,{k:'d3b_elens',x:p.x,y:p.y,id:`d3bel_${R.id}`,room:R.id,r:60},true); o.prompt=()=>G.flags.m_reforged?S('Look at the Eclipse Lens','Look at the Lens'):null; A.lights.push({x:p.x,y:p.y-10,r:420,i:0.55}); }
  if(R.cog){ const p=at(R.cog[0],R.cog[1]); d3bObj(A,{k:'d3b_cog',x:p.x,y:p.y,id:`d3bcog_${SK}_${R.id}`,room:R.id,r:30,ang:0}); }
  if(R.vesper){ const p=at(R.vesper[0],R.vesper[1]); d3bObj(A,{k:'d3b_vesper',x:p.x,y:p.y,id:`d3bve_${R.id}`,room:R.id,a:0},true); }
  if(R.clock) X.clockRoom=R.id;
}
const D3B_DNAME=[S('SUN','SUN'),S('MOON','MOON'),S('ECLIPSE','ECLIPSE')];
// after every room is built: shadow platforms, hidden stairs, twins, gears, the hourglass, stair seals
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){ base.apply(this,arguments); if(d3bIsDef(def)&&A.dn) try{ d3bAfterBuild(A,def); }catch(e){ console.error(e); } }; }
function d3bAfterBuild(A,def){
  const X=d3bState(A), c=A.cave;
  d3bShadowRefresh(A);
  // stairs that appear only when their room is solved (the Twin Stair, the Sand Clock)
  for(const s of A.dn.stairs.slice()){ const R=A.rooms[s.room]; if(R&&R.stairOnSolve&&!R.solved){ A.dn.stairs.splice(A.dn.stairs.indexOf(s),1); X.hidStairs.push(s); s.hidden=true; } }
  // the hourglass: where the sand is, and the neck
  if(X.clockRoom){ const R=A.rooms[X.clockRoom], SK=caveSid(def); X.clock={R,side:G.found[`d3bhgs_${SK}_${R.id}`]||'N',flips:G.found[`d3bhgf_${SK}_${R.id}`]|0,pour:0,dir:null,turn:0,started:!!G.found[`d3bhg0_${SK}_${R.id}`]}; d3bNeckSet(A,false); }
  // the gears of the Clockwork Stair
  for(const id in A.rooms){ const R=A.rooms[id]; if(!R.gears) continue; const SK=caveSid(def); X.gears={R,started:!!G.found[`d3bgs_${SK}_${id}`],braked:!!G.found[`d3bgb_${SK}_${id}`],ang:0}; }
  for(const o of X.lamps){ if(o.start&&!G.found[o.id+'_seen']){ o.lit=d3bDiff(20,14,12); } }
  // timed moon braziers of a solved 'moon' room stay lit for good (p4_moon starts timed ones dark on every visit)
  if(A.p4&&A.p4.braz){ let ref=false; for(const o of A.p4.braz){ const R=A.rooms[o.room]; if(R&&R.kind==='moon'&&R.solved&&o.timed){ o.timed=0; o.lit=1; if(o.L) o.L.i=0.85; ref=true; } } if(ref&&typeof p4GlassRefresh==='function') p4GlassRefresh(A); }
  // the engine's mirrors in these rooms can be turned from a little farther away
  for(const o of A.dn.mirrors) o.r=40;
  refreshCaveGates(); X.dirty=true;
}
function d3bShadowRefresh(A){ const X=A.d3b, c=A.cave; X.shadow.fill(0); for(let k=0;k<c.typ.length;k++) if(c.typ[k]===D3T.shadow&&d3bShadowOn(A,k)) X.shadow[k]=1; }
// the shadow curtains are gates: shut until burnt
{ const base=refreshCaveGates; refreshCaveGates=function(){ base.apply(this,arguments); const A=AREA; if(!A||!A.d3b) return; for(const o of A.d3b.gates){ let cl=!o.grp.burnt; if(cl&&!o.closed&&gateOnAsh(o)) cl=false; o.closed=cl; } }; }
// the solved rooms that show their hidden stairs
// (a boss room of these dungeons is solved only by its boss falling: the engine's empty-room check must not open its
// chest or its door while the boss is still on the way in)
{ const base=solveRoom; solveRoom=function(R,quiet){ const A=AREA, was=R&&R.solved; if(A&&A.d3b&&R&&R.m3boss&&!was&&G&&!G.bossDone[R.m3boss]) return; const r=base.apply(this,arguments);
    if(A&&A.d3b&&R&&!was&&R.solved){ try{ d3bOnSolve(A,R); }catch(e){ console.error(e); } } return r; }; }
function d3bOnSolve(A,R){
  const X=A.d3b;
  for(const s of X.hidStairs.slice()) if(s.room===R.id){ X.hidStairs.splice(X.hidStairs.indexOf(s),1); s.hidden=false; A.dn.stairs.push(s); A.dn.stairGrace=1; A.dn.graceAt={x:player.x,y:player.y}; emit(s.x,s.y,30,{col:'220,230,255',smin:40,smax:160,lmin:.4,lmax:.9,zmin:1.5,zmax:3}); later(1.2,()=>setBanner(S('A stair appears!','A stair appears!'),S('The way up is open.','The way up is open.'),2.4)); }
  if(R.kind==='d3stars') d3bBeat('star',[['iska',S(`That's MY constellation! They named one after me! ...After my lanterns. Close enough.`,`That's MY star picture!`)]]);
  if(R.kind==='d3twin'){ const T=X.twins[R.id]; if(T) T.fade=1; }
}

// ---------- 4. every frame
{ const base=updateCaveRooms; updateCaveRooms=function(dt){ const A=AREA; base.apply(this,arguments); if(!A||AREA!==A||!A.d3b||!A.dn) return; try{ d3bUpdate(A,dt); }catch(e){ console.error(e); } }; }
function d3bUpdate(A,dt){
  const X=A.d3b, p=player; X.t+=dt; D3B.t+=dt;
  const R=caveRoomAt(p.x,p.y); if(R!==X.room){ X.room=R; if(R) try{ d3bOnRoom(A,R); }catch(e){ console.error(e); } }
  // the dial: moon-glass rings lit by the MOON state, how dark the room is
  for(const id in A.rooms){ const Q=A.rooms[id]; if(!Q.moonGlass||!A.p4) continue; if(d3bDialOf(A,Q)!==1) continue;
    for(let j=Q.oy+1;j<=Q.oy+Q.ih;j++) for(let i=Q.ox+1;i<=Q.ox+Q.iw;i++){ const k=j*A.cave.w+i; if(A.cave.typ[k]===P4T.glass) A.p4.glassT[k]=Math.max(A.p4.glassT[k],0.25); } }
  const st=d3bDialOf(A,R), base=A.def.dark!=null?A.def.dark:0.5, want=st<0?(R&&R.dark3!=null?R.dark3:base):clamp(base+[-0.22,0.06,0.3][st],0.1,0.85);
  A.dark+=(want-A.dark)*Math.min(1,dt*2);
  // a sunlit room (SUN on its dial) is bright everywhere: shadow bars and moth curtains in it are lit
  for(const id in A.rooms){ const Q=A.rooms[id]; if(Q.sunShine&&d3bDialOf(A,Q)===0&&typeof p2Shine==='function') p2Shine((Q.x0+Q.x1)/2,(Q.y0+Q.y1)/2,Math.max(Q.x1-Q.x0,Q.y1-Q.y0)*0.75); }
  // a boss room is solved once its boss is down (the guard in solveRoom waits for that)
  for(const id in A.rooms){ const Q=A.rooms[id]; if(Q.m3boss&&!Q.solved&&G.bossDone[Q.m3boss]) solveRoom(Q,true); }
  d3bBeamTick(A,dt); d3bLensTick(A,dt); d3bLampTick(A,dt); d3bStarTick(A,dt); d3bTwinTick(A,dt); d3bClockTick(A,dt); d3bGearTick(A,dt); d3bFoeTick(A,dt);
  for(const o of X.dials){ if(o.cd>0) o.cd-=dt; if(o.spin>0) o.spin=Math.max(0,o.spin-dt*1.6);
    if(o.mover!=null){ const mv=A.dn.movers.filter(m=>m.room===o.room)[o.mover]; if(mv){ o.x=mv.x+mv.w/2; o.y=mv.y+mv.h/2-6; if(o.L){ o.L.x=o.x; o.L.y=o.y-12; } } } }
  for(const o of X.objs){ if(o.k==='d3b_sky'&&o.cd>0) o.cd-=dt; if(o.k==='d3b_sky'&&o.spin>0) o.spin=Math.max(0,o.spin-dt*3);
    if(o.k==='d3b_mirage'){ const d=dist(p.x,p.y,o.x,o.y+40), mine=R&&R.id===o.room; o.a+=((!mine||d<90?0:d<260?(d-90)/170:1)-o.a)*Math.min(1,dt*3); }
    if(o.k==='d3b_vesper') d3bVesperTick(A,o,dt); }
  for(const L of X.tgts) if(L.L) L.L.i=L.lit?0.75:0.12+0.5*(L.glow||0);
  // a lit glass bridge that fades under Ash drops him; the Mirage Hat from Jinx's stash
  if(G.items&&G.items.m_hat_mirage&&!(G.hats&&G.hats['Mirage Hat'])){ G.hats=G.hats||{}; G.hats['Mirage Hat']=true; G.hat='Mirage Hat'; later(2.8,()=>setBanner(S('The Mirage Hat','The Mirage Hat'),S('It shimmers. Sometimes it is not there at all.','It shimmers!'),2.6)); }
  // Pip's Lantern: the Moon Bridges room once its shadow vines are gone
  if(R&&R.pipLamp&&G.flags.pip&&!G.flags.m_pip_lamp&&scene==='play'&&!X.pipAsked){ const g=A.gates.find(q=>q.type==='vines'&&(q.link.a===R.id||q.link.b===R.id)); if(g&&g.opened){ X.pipAsked=true; d3bBeat('pip_lamp'); } }
}
// entering a room: its first-visit words and beats
function d3bOnRoom(A,R){
  const vk=`d3bv_${caveSid(A.def)}_${R.id}`, first=!G.found[vk]; G.found[vk]=1;
  if(R.beat&&first) d3bBeat(R.beat,R.beatFb||null);
  if(R.say1&&first) later(0.6,()=>{ if(AREA===A&&scene==='play') runDialogue(R.say1,()=>{ scene='play'; saveGame(); }); });
  if(R.tip&&first) later(1.0,()=>d3bTip(R.id+'_'+A.def.id,R.tip[0],R.tip[1]));
  for(const o of A.d3b.lamps) if(o.start&&o.room===R.id&&!G.found[o.id+'_seen']){ G.found[o.id+'_seen']=1; o.lit=Math.max(o.lit,d3bDiff(20,14,12)); }
  if(R.clock&&A.d3b.clock&&!A.d3b.clock.started) d3bClockStart(A);
  // a dial room with no crystal is solved when Ash reaches the room its last crossing leads to (R.solveWhen)
  for(const id in A.rooms){ const Q=A.rooms[id]; if(Q.solveWhen===R.id&&!Q.solved) solveRoom(Q); }
}
// ---------- the Eclipse Dial
function d3bDialUse(A,o){
  if(o.cd>0) return; o.cd=0.45; const R=A.rooms[o.room]; if(!R||!R.dial) return;
  const cur=d3bDialOf(A,R), to=o.set?D3B_DIAL.indexOf(o.set):(cur+1)%3;
  if(to===cur){ ftext(o.x,o.y-40,S('It already shows that.','Already there!'),'#e6dcff',13); return; }
  d3bDialSet(A,R.dial,to); o.spin=1;
}
function d3bDialSet(A,scope,to){
  const DK=caveDsid(A.def); G.found[d3bDialKey(DK,scope)]=to; d3bShadowRefresh(A); A.d3b.dirty=true; D3B.trace=null;
  for(const q of A.d3b.dials) if(q.scope===scope){ q.spin=1; q.ang=to; }
  SFX.play('block'); SFX.play('shrine',0.6); shake(3);
  flashA=0.18; flashCol=to===0?'255,226,140':to===1?'170,200,255':'120,70,170';
  setBanner(D3B_DNAME[to],[S('The sun shines in. Sunbeams wake, and the orrery turns.','Sun! Sunbeams wake up.'),S('Moonlight fills the room. Moon-glass shines where it falls.','Moon! Moon-glass shines.'),S('Eclipse! Shadows turn solid, and the shadow pools open.','Eclipse! Shadows turn solid.')][to],2.2,'region');
  d3bTip('dial',S('The Eclipse Dial','The Eclipse Dial'),S('SUN wakes the sunbeams. MOON lights the moon-glass. ECLIPSE makes shadow platforms solid and opens shadow pools. Small dial studs turn it too.','Sun, Moon, Eclipse. Each one changes the room.'));
  saveGame();
}
// ---------- turning sky mirrors (and the engine's own mirrors re-light the beams)
function d3bSkyTurn(A,o){ if(o.cd>0) return; o.cd=0.35; const key=d3bSkyKey(o.ri,o.c,o.r), d=(d3bSkyDir(o.ri,o.c,o.r,o.opt)+1)%4; G.found[key]=d; o.spin=1; A.d3b.dirty=true; SFX.play('block',0.6); emit(o.x,o.y-30,10,{col:'255,240,200',smin:30,smax:90,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); saveGame(); }
{ const base=mirrorTurn; mirrorTurn=function(o){ base.apply(this,arguments); const A=AREA; if(A&&A.d3b){ A.d3b.dirty=true; D3B.trace=null; } }; }
// ---------- hits and the E button
const D3B_HITTABLE={d3b_sky:1,d3b_dial:1,d3b_stud:1};
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){ let hit=base.apply(this,arguments); const A=AREA; if(!A||!A.d3b) return hit; r=r||8;
    for(const o of A.d3b.objs){ if(!D3B_HITTABLE[o.k]||src==='fire'||src==='moon') continue; if(dist(x,y,o.x,o.y)>r+(o.k==='d3b_stud'?16:24)) continue; if(o.k==='d3b_sky') d3bSkyTurn(A,o); else d3bDialUse(A,o); hit=true; }
    if(src==='fire') for(const o of A.d3b.lamps){ if(o.lit>0||dist(x,y,o.x,o.y-(o.high?90:50))>r+26) continue; d3bLampLight(A,o); hit=true; }
    if(src==='fire') for(const o of A.d3b.stars){ if(o.lit||o.kind!=='fire'||dist(x,y,o.x,o.y-(o.high?96:44))>r+24) continue; d3bStarLight(A,o); hit=true; }
    return hit; }; }
{ const base=caveSwing; caveSwing=function(px,py,dir,range,half){ base.apply(this,arguments); const A=AREA; if(!A||!A.d3b) return;
    for(const o of A.d3b.objs){ if(!D3B_HITTABLE[o.k]) continue; if(!inArcC(px,py,dir,range+16,half,{x:o.x,y:o.y-10,r:22})) continue; if(o.k==='d3b_sky') d3bSkyTurn(A,o); else d3bDialUse(A,o); } }; }
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&(o.d3b||o.k==='d3bg')&&AREA&&AREA.d3b){ d3bAct(AREA,o); return; } return base.apply(this,arguments); }; }
function d3bAct(A,o){
  switch(o.k){
    case 'd3b_sky': d3bSkyTurn(A,o); return;
    case 'd3b_dial': case 'd3b_stud': d3bDialUse(A,o); return;
    case 'd3b_tgt': d3bSay(o.lit?(o.want==='moon'?S('The moon crystal glows, cool and silver.','The moon crystal glows.'):S('The sun crystal blazes, warm as a summer noon.','The sun crystal blazes.')):(o.want==='moon'?S('A crystal of pale silver. It drinks moonlight. Bring a moonbeam to it.','A moon crystal. Bring moonlight to it.'):S('A crystal of warm gold. It drinks sunlight. Bring a sunbeam to it.','A sun crystal. Bring sunlight to it.'))); return;
    case 'd3b_lens': d3bSay(canBlaze()?S('A great glass lens on a brass stand. Blue fire, breathed right into it, would light it like a little sun.','A lens. Breathe blue fire into it!'):S('A great glass lens on a brass stand. Ordinary fire only makes it warm.','A lens. Your fire is not hot enough.')); return;
    case 'd3b_lamp': d3bSay(o.lit>0?S('The lamp burns bright. Moths love it. Moths cannot help it.','The lamp is lit. Moths love it.'):o.high?S('A lamp post so tall its lamp is up near the ceiling. Ordinary fire will not reach it. Blue fire might.','A tall lamp. Use blue fire!'):S('A brass lamp post. Any fire will light it, for a while.','A lamp. Any fire lights it.')); return;
    case 'd3b_star': d3bSay(o.kind==='moon'?S('A star lamp of silver glass. It wants moonlight.','A moon star. It wants Moonfire.'):o.high?S('A star lamp high on a brass arm. Only a long blue flame would reach it.','A high star. Use blue fire!'):S('A star lamp of gold glass. It wants fire.','A fire star. It wants fire.')); return;
    case 'd3b_scope': d3bBeat('scope',[['narr',S(`You put your eye to the great telescope. Far to the east, past the end of every map, is a patch of sea where the stars look wrong.`,`You look through the telescope. Far east, the stars look wrong.`)]]); return;
    case 'd3b_flip': d3bSay(canPound()?S('A brass switch shaped like a little hourglass. It looks like it wants a good hard thump from above.','A flip switch. Ground Pound it!'):S('A brass switch shaped like a little hourglass, stuck fast.','A stuck switch.')); return;
    case 'd3b_terrace': d3bTerrace(A); return;
    case 'd3b_rest': d3bRest(A,o); return;
    case 'd3b_elens': d3bSay(S('The Eclipse Lens. Through it, the dark sea, and the mountain at the edge of the world.','The Eclipse Lens. The mountain is out there.')); return;
    case 'd3bg': d3bSay(canMoon()?S('A curtain of living shadow, thick as velvet. Moonfire only makes it shiver. It cannot stand real sunlight.','A shadow curtain. Only sunlight burns it!'):S('A curtain of living shadow, thick as velvet. Fire goes straight through it without a mark. It cannot stand real sunlight.','A shadow curtain. Sunlight burns it!')); return;
  }
}
// ---------- lenses: blue fire lights them, and they throw a sunbeam for a while
function d3bLensTick(A,dt){
  const X=A.d3b;
  for(const o of X.objs){ if(o.k!=='d3b_lens') continue; const key=o.room+':'+o.c+','+o.r;
    if(X.lensOn[key]>0){ X.lensOn[key]-=dt; if(X.lensOn[key]<=0){ X.lensOn[key]=0; X.dirty=true; SFX.play('pop',0.4); } }
    const jet=typeof p3JetHits==='function'&&p3JetHits(o.x,o.y-22,22);
    if(jet){ const R=A.rooms[o.room], st=d3bDialOf(A,R); if(st>0){ if(!(o.nope>G.time)){ o.nope=G.time+2.5; ftext(o.x,o.y-50,S('The lens needs the sun. Turn the dial to SUN.','It needs the SUN.'),'#ffe6a0',13); } continue; }
      o.heat+=dt; o.warm=Math.min(1,o.warm+dt*3); if(o.heat>0.3){ o.heat=0; const was=X.lensOn[key]>0; X.lensOn[key]=d3bDiff(12,8,7); X.dirty=true; if(!was){ SFX.play('boom',0.5); shake(2); setBanner(S('The lens blazes!','The lens blazes!'),S('A sunbeam, for a little while.','A sunbeam!'),1.8); } } }
    else { o.warm=Math.max(0,o.warm-dt); if(!(X.lensOn[key]>0)&&inBreath(o.x,o.y-22,16)&&!(typeof p4MoonOn==='function'&&p4MoonOn())&&!(o.nope>G.time)){ o.nope=G.time+2.5; ftext(o.x,o.y-50,canBlaze()?S('Hotter! Hold the fire until it turns blue.','Hotter! Make it blue!'):S('It only gets warm.','Only warm.'),'#ffe6a0',13); } } }
}
// ---------- lamp posts: any fire lights them (a tall one only blue fire); moths stop and stare at a lit one
function d3bLampLight(A,o){ o.lit=d3bDiff(18,12,10); o.ever=true; SFX.play('pop',0.6); emit(o.x,o.y-(o.high?92:52),16,{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:20,smax:90,lmin:.3,lmax:.7,zmin:2,zmax:4,grow:4}); }
function d3bLampTick(A,dt){
  for(const o of A.d3b.lamps){
    if(o.lit>0){ o.lit-=dt; if(o.lit<=0){ o.lit=0; emit(o.x,o.y-(o.high?92:52),8,{col:'150,140,130',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:40,lmin:.5,lmax:1,zmin:2,zmax:4,grow:5}); } }
    else { const hy=o.y-(o.high?92:52); const jet=typeof p3JetHits==='function'&&p3JetHits(o.x,hy,22), br=!o.high&&(typeof m3FireOn==='function'?m3FireOn(o.x,hy,20):(inBreath(o.x,hy,18)&&!(typeof p4MoonOn==='function'&&p4MoonOn())));
      if(jet||br){ o.warm+=dt; if(o.warm>0.18){ o.warm=0; d3bLampLight(A,o); } } else o.warm=Math.max(0,o.warm-dt);
      if(o.high&&!jet&&inBreath(o.x,o.y-50,30)&&!(o.nope>G.time)){ o.nope=G.time+2.5; ftext(o.x,o.y-110,S('Too high! A blue flame reaches farther.','Too high! Use blue fire!'),'#ffe0a0',13); } }
    o.L.i=o.lit>0?0.88:0; }
}
// ---------- the star dome: light the stars of the picture on the floor; a wrong star puts them all out
function d3bStarTick(A,dt){
  for(const o of A.d3b.stars){ if(o.lit){ o.L.i=0.8; continue; } o.L.i=o.flare>0?0.9:0; if(o.flare>0) o.flare-=dt;
    const hy=o.y-(o.high?96:44); let hit=false;
    if(o.kind==='moon'){ hit=typeof p4MoonHits==='function'&&p4MoonHits(o.x,hy,18); if(!hit&&inBreath(o.x,hy,18)&&!(typeof p4MoonOn==='function'&&p4MoonOn())&&!(o.nope>G.time)){ o.nope=G.time+2.5; ftext(o.x,hy-24,S('It wants moonlight, not fire.','It wants Moonfire!'),'#cfe0ff',13); } }
    else { const jet=typeof p3JetHits==='function'&&p3JetHits(o.x,hy,22), br=!o.high&&inBreath(o.x,hy,18)&&!(typeof p4MoonOn==='function'&&p4MoonOn()); hit=jet||br;
      if(o.high&&!jet&&inBreath(o.x,o.y-44,30)&&!(o.nope>G.time)){ o.nope=G.time+2.5; ftext(o.x,hy-24,S('Too high! A blue flame reaches farther.','Too high! Use blue fire!'),'#ffe0a0',13); }
      if(!hit&&typeof p4MoonOn==='function'&&p4MoonOn()&&typeof p4MoonHits==='function'&&p4MoonHits(o.x,hy,18)&&!(o.nope>G.time)){ o.nope=G.time+2.5; ftext(o.x,hy-24,S('It wants fire, not moonlight.','It wants fire!'),'#ffe0a0',13); } }
    if(hit){ o.heat+=dt; if(o.heat>0.3){ o.heat=0; d3bStarLight(A,o); } } else o.heat=Math.max(0,o.heat-dt*0.5); }
}
function d3bStarLight(A,o){
  const R=A.rooms[o.room]; if(o.lit||!R||R.solved) return;
  if(!o.good){ o.flare=0.6; SFX.play('hurt',0.4); shake(2); for(const q of A.d3b.stars) if(q.room===o.room&&q.lit&&!R.solved){ q.lit=false; emit(q.x,q.y-50,10,{col:'200,190,255',glow:false,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); }
    setBanner(S('Wrong star!','Wrong star!'),S('That one is not in the picture. The stars flicker out.','Not in the picture. Start again.'),2.2); return; }
  o.lit=true; SFX.play('shrine',0.7); emit(o.x,o.y-(o.high?96:44),20,{col:o.kind==='moon'?'210,225,255':'255,226,150',smin:30,smax:140,lmin:.3,lmax:.8,zmin:1.5,zmax:3});
  const all=A.d3b.stars.filter(q=>q.room===o.room&&q.good), n=all.filter(q=>q.lit).length;
  if(n>=all.length) solveRoom(R); else setBanner(S('A star lights up','A star lights up!'),`${n} / ${all.length}`,1.4);
}
// ---------- the rest lamp in the antechamber, the door onto the Star Terrace
function d3bRest(A,o){ const p=player; p.hp=p.maxHp; p.potions=p.potionsMax; SFX.play('shrine'); emit(o.x,o.y-30,24,{col:'255,220,150',ang:-Math.PI/2,spread:1,smin:30,smax:120,lmin:.5,lmax:1,zmin:1.5,zmax:3,rise:20}); saveGame(); setBanner(S('You rest by the warm lamp','You rest by the lamp'),S('Health and flasks full. Your journey is saved.','All better! Saved.'),2.4); }
function d3bTerrace(A){ exitArea(true); const p=player; p.x=13330; p.y=64060; p.z=0; p.vz=0; p.flying=false; updateCam(0,true); G.fade=1; setBanner(S('The Star Terrace','The Star Terrace'),'',2); saveGame(); }

// ---------- 5. mirror twins: dark copies of Ash across the room's mirror lines
// R.twins:[{axis:'x'|'y'}] (x: mirrored left-right, y: up-down). A twin copies every step Ash takes, backwards, and is
// stopped by walls and pits on its own side (so the two drift apart when one of them is blocked). Moonfire freezes a
// twin for a few seconds. Every plate Π held down at once (by Ash or a twin) solves the room. Σ starts (and restarts)
// the twins; without a Σ they wake when Ash walks in.
function d3bTwinMirror(R,b,x,y){ return {x:b.axis==='x'?R.x0+R.x1-x:x,y:b.axis==='y'?R.y0+R.y1-y:y}; }
function d3bTwinFree(A,R,x,y){ if(x<R.x0+14||x>R.x1-14||y<R.y0+14||y>R.y1-14) return false; if(areaBlocked(x,y)||colAt(x,y,9)) return false; const k=tCell(x,y); return k>=0&&tGround(k)&&!tHole(k)&&!caveBlockedAt(k); }
function d3bTwinMove(A,R,b,mx,my){ if(mx&&d3bTwinFree(A,R,b.x+mx,b.y)) b.x+=mx; if(my&&d3bTwinFree(A,R,b.x,b.y+my)) b.y+=my; }
function d3bTwinTick(A,dt){
  const X=A.d3b, p=player;
  for(const id in A.rooms){ const R=A.rooms[id]; if(!R.twins) continue;
    const T=X.twins[id]||(X.twins[id]={on:false,off:true,b:R.twins.map(t=>({axis:t.axis,x:0,y:0,frz:0,face:0})),lx:0,ly:0,a:0});
    const plates=X.objs.filter(o=>o.k==='d3b_plate'&&o.room===id);
    if(R.solved){ T.a=Math.max(0,T.a-dt*1.2); for(const q of plates) q.on=true; continue; }
    const inR=caveRoomAt(p.x,p.y)===R&&caveInterior(R,p.x,p.y);
    if(!inR){ if(T.on){ T.on=false; T.a=0; } for(const q of plates) q.on=false; continue; }
    const sync=X.objs.find(o=>o.k==='d3b_sync'&&o.room===id), onSync=!!sync&&dist(p.x,p.y,sync.x,sync.y)<26;
    if((!T.on&&!sync)||(onSync&&T.off)){
      T.on=true; T.off=false; T.lx=p.x; T.ly=p.y; T.a=0;
      for(const b of T.b){ const q=d3bTwinMirror(R,b,p.x,p.y); b.x=q.x; b.y=q.y; b.frz=0; b.face=p.facing; emit(b.x,b.y-14,16,{col:'190,200,255',smin:20,smax:90,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); }
      SFX.play('shrine',0.5);
      d3bTip('twin'+(T.b.length>1?'2':''),S('Your mirror twin','Your mirror twin'),T.b.length>1?S('Two twins now: one copies you left to right, one up and down. Walls stop them, not you. Moonfire freezes a twin for a moment. Step on the dark tile to start again.','Two twins! Moonfire freezes one. The dark tile starts again.'):S('It copies every step you take, backwards. A wall on its side stops it, but not you. Step on the dark tile to start again.','It copies you, backwards. Walls stop it, not you.')); }
    if(sync&&!onSync) T.off=true;
    if(!T.on) continue;
    T.a=Math.min(1,T.a+dt*2);
    let dx=p.x-T.lx, dy=p.y-T.ly; T.lx=p.x; T.ly=p.y; if(Math.hypot(dx,dy)>60){ dx=0; dy=0; }
    for(const b of T.b){
      if(b.frz>0) b.frz-=dt;
      else { d3bTwinMove(A,R,b,b.axis==='x'?-dx:dx,b.axis==='y'?-dy:dy); b.face=b.axis==='x'?Math.PI-p.facing:-p.facing; }
      if(typeof p4MoonHits==='function'&&p4MoonHits(b.x,b.y-14,18)){ if(!(b.frz>0.5)){ ftext(b.x,b.y-48,S('Frozen!','Frozen!'),'#dfe8ff',14); SFX.play('pop',0.5); } b.frz=d3bDiff(4.5,3,2.6); } }
    const bodies=[{x:p.x,y:p.y}].concat(T.b); let n=0;
    for(const q of plates){ const was=q.on; q.on=bodies.some(b=>dist(b.x,b.y,q.x,q.y)<24); if(q.on){ n++; if(!was) SFX.play('block',0.4); } }
    if(plates.length&&n===plates.length){ solveRoom(R,true); jingle('secret','shrine'); shake(4); setBanner(S('All of you at once!','All of you at once!'),S('The twins bow, and melt back into the mirror.','The twins melt away.'),2.6);
      for(const b of T.b) emit(b.x,b.y-14,24,{col:'190,200,255',smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3}); saveGame(); }
  }
}
// ---------- 6. the hourglass (the Sand Clock): sand pours from one half to the other; while it pours the neck is a
// sand seam a burrower can pass. A Ground Pound on a flip switch (once the sand has stopped) turns the glass over.
// Two flips show the stairs up.
function d3bClockKey(A,R,s){ return `d3bhg${s}_${caveSid(A.def)}_${R.id}`; }
function d3bClockPour(A,C,to){ C.from=C.side; C.side=to; C.pmax=C.pour=d3bDiff(20,14,11); d3bNeckSet(A,true); G.found[d3bClockKey(A,C.R,'s')]=to; SFX.play('roll',0.7); }
function d3bClockStart(A){ const C=A.d3b.clock; if(!C||C.started) return; C.started=true; G.found[d3bClockKey(A,C.R,'0')]=1; C.side='N'; d3bClockPour(A,C,'S');
  later(0.6,()=>d3bTip('clock',S('The Sand Clock','The Sand Clock'),S(`While the sand pours, the neck of the glass is soft sand: burrow (${d3bCtl().roll}) through it. When it stops, Ground Pound a flip switch to turn the glass over.`,'Burrow through the falling sand. Pound a switch to flip it.'))); }
function d3bClockTick(A,dt){ const C=A.d3b.clock; if(!C) return; if(C.turn>0) C.turn=Math.max(0,C.turn-dt);
  if(C.pour>0){ C.pour-=dt; if(Math.random()<dt*14){ const k=pick(A.d3b.necks), q=tPos(k); emit(q.x+rand(-14,14),q.y-rand(0,20),1,{col:'226,196,122',glow:false,ang:C.side==='S'?Math.PI/2:-Math.PI/2,spread:0.3,smin:40,smax:120,lmin:.3,lmax:.6,zmin:1,zmax:2.5}); }
    if(C.pour<=0){ C.pour=0; d3bNeckSet(A,false); SFX.play('block',0.6); setBanner(S('The sand stops','The sand stops'),S('The neck of the glass is solid again.','The neck is solid again.'),1.6); } } }
function d3bClockFlip(A,o){ const C=A.d3b.clock; if(!C) return;
  if(!C.started){ d3bClockStart(A); return; }
  if(C.pour>0){ ftext(player.x,player.y-46,S('Wait for the sand to stop!','Wait for the sand!'),'#ffe6b0',14); return; }
  // only a flip from the half the sand fell into counts (so Ash has to cross through the falling sand); a flip from the
  // empty half still turns the glass, so nobody is ever stuck on the wrong side
  const counts=!(o&&o.half&&o.half!==C.side);
  C.turn=1.4; if(counts){ C.flips++; G.found[d3bClockKey(A,C.R,'f')]=C.flips; } shake(8); flashA=0.15; flashCol='255,230,170';
  d3bClockPour(A,C,C.side==='S'?'N':'S'); setBanner(S('The hourglass turns over!','The hourglass flips!'),!counts?S('The sand runs back. A flip only counts from the half the sand fell into.','The sand runs back. Flip it from the sandy side!'):C.flips<2?S('The sand pours the other way.','The sand pours the other way.'):S('Something clicks under the sand.','Something clicks!'),2.4);
  if(C.flips>=2&&!C.R.solved) later(1.0,()=>{ if(AREA===A&&!C.R.solved) solveRoom(C.R,true); }); saveGame(); }
// ---------- 7. the gears of the Clockwork Stair: a Ground Pound on the jammed cog starts them; they spin far too fast
// to ride until the brake (a hook only the Chain Whip reaches) is pulled
function d3bGearTick(A,dt){ const Gr=A.d3b.gears; if(!Gr) return; const R=Gr.R, SK=caveSid(A.def);
  if(!Gr.braked){ const sw=A.objs.find(o=>o.k==='tswitch'&&o.room===R.id&&o.on); if(sw){ Gr.braked=true; G.found[`d3bgb_${SK}_${R.id}`]=1; SFX.play('block'); shake(3);
      setBanner(S('The brake bites!','The brake bites!'),Gr.started?S('The gears slow to a gentle turn. You could ride them now.','The gears slow down. Ride them!'):S('The brake is on. Now the gears just need to start.','The brake is on.'),2.4); saveGame(); } }
  if(Gr.started&&Gr.braked&&!R.solved&&!Gr.solving){ Gr.solving=1; later(1.2,()=>{ Gr.solving=0; if(AREA===A&&!R.solved) solveRoom(R); }); }
  Gr.ang+=dt*(Gr.started?(Gr.braked?0.7:4.2):0); }
function d3bGearStart(A){ const Gr=A.d3b.gears; if(!Gr||Gr.started) return; Gr.started=true; G.found[`d3bgs_${caveSid(A.def)}_${Gr.R.id}`]=1; shake(8); SFX.play('boom',0.6);
  setBanner(S('CLUNK! The gears turn!','CLUNK! The gears turn!'),Gr.braked?S('Slow and steady. Ride them up.','Ride them up!'):S('Far too fast to ride! Something has to slow them down.','Too fast! Slow them down.'),2.8);
  if(!Gr.braked) later(3,()=>d3bTip('brake',S('The brake','The brake'),S('A brake lever hangs on a hook high over the gears. Too high for your claws or your sword. A Chain Whip crack might catch it.','Crack the Chain Whip at the high hook!'))); saveGame(); }
{ const base=dunMovers; dunMovers=function(A,dt){ const X=A&&A.d3b; if(X&&A.dn) d3bMoversPre(A,dt); base.apply(this,arguments); if(X&&A.dn) d3bMoversPost(A); }; }
function d3bMoversPre(A,dt){ const Gr=A.d3b.gears;
  for(const m of A.dn.movers){ const R=A.rooms[m.room]; if(!R) continue;
    if(R.sunMovers&&d3bDialOf(A,R)!==0) m.hold=Math.max(m.hold,0.05);
    if(R.gears&&Gr){ if(!Gr.started) m.hold=Math.max(m.hold,0.05); else if(!Gr.braked){ m.speed=d3bDiff(190,230,250); m.wait=0.12; } else { m.speed=d3bDiff(40,50,56); m.wait=d3bDiff(1.9,1.5,1.3); } } } }
function d3bMoversPost(A){ const Gr=A.d3b.gears; if(!Gr||!Gr.started||Gr.braked) return; for(const [k,m] of A.dn.moverMap){ const R=A.rooms[m.room]; if(R&&R.gears) A.dn.moverMap.delete(k); } }
// ---------- 8. Ground Pound: glass panes, the hourglass switches, the jammed cog
if(typeof p3OnPound==='function') p3OnPound(({x,y,R:rad,drum})=>{ const A=AREA; if(!A||!A.d3b||drum) return; try{
  const c=A.cave, cs=c.cell, r=Math.max(70,(rad||92)*0.75);
  for(let j=Math.floor((y-r-A.y0)/cs);j<=Math.floor((y+r-A.y0)/cs);j++) for(let i=Math.floor((x-r-A.x0)/cs);i<=Math.floor((x+r-A.x0)/cs);i++){ if(i<0||j<0||i>=c.w||j>=c.h) continue; const k=j*c.w+i; if(c.typ[k]!==D3T.pane||d3bPaneBroken(A,k)) continue; const q=tPos(k); if(dist(q.x,q.y,x,y)>cs*0.5+46) continue; d3bPaneBreak(A,k); }
  for(const o of A.d3b.flips) if(dist(o.x,o.y,x,y)<70){ o.bump=0.4; d3bClockFlip(A,o); break; }
  for(const o of A.d3b.objs) if(o.k==='d3b_cog'&&dist(o.x,o.y,x,y)<72) d3bGearStart(A);
}catch(e){ console.error(e); } });
function d3bPaneBreak(A,k){ G.found[`d3bp_${caveSid(A.def)}_${k}`]=1; const q=tPos(k); SFX.play('boom',0.5); if(typeof p3Snd==='function') p3Snd('shatter'); shake(5);
  for(let i=0;i<26;i++){ const a=rand(0,TAU); emit(q.x+Math.cos(a)*14,q.y+Math.sin(a)*10,1,{col:i%3?'210,235,255':'255,255,255',ang:a,spread:0.4,smin:60,smax:200,lmin:.3,lmax:.7,zmin:1.5,zmax:3.5,drag:3}); }
  const p=player; if(tCell(p.x,p.y)===k){ p.z=Math.max(p.z||0,46); p.vz=0; ftext(p.x,p.y-50,S('Crash! Down you go!','Crash!'),'#dff0ff',14); }
  renderCaveRooms(A,A.def); renderCaveMini(A); saveGame(); }
// ---------- 9. foes in an eclipse: Shades and Moth Knights grow stronger in ECLIPSE, unless a light is on them
function d3bFoeTick(A,dt){ for(const e of G.enemies){ if(e.dead||!e.inArea||!e.room) continue; if(e.type!=='m_shade'&&e.type!=='m_mothknight') continue; const R=A.rooms[e.room]; if(!R||!R.dial) continue;
    if(e.d3bD==null) e.d3bD=e.dmg; const strong=d3bDialOf(A,R)===2&&!(typeof m3LitAt==='function'&&m3LitAt(e.x,e.y,20)); e.d3bS=strong; e.dmg=e.d3bD*(strong?1.35:1); } }
// ---------- 10. the Vault: two keyholes (or Vesper, who does not bother with keys)
function d3bVaultGate(A){ return A.gates.find(q=>q.type==='lock'&&q.opt&&q.opt.keys>1)||null; }
function d3bVaultOpen(A,g,ves){ if(!g||g.opened) return; g.opened=true; G.found[g.id]=true; refreshCaveGates(); SFX.play('chest'); jingle('secret','chest'); shake(4); setBanner(S('The Vault opens','The Vault opens'),ves?S('Click. Click. Vesper grins.','Click, click!'):S('Both keys turn at once.','Both keys turn!'),2.2); saveGame(); }
{ const base=caveObjAct; caveObjAct=function(o){ const A=AREA;
    if(A&&A.d3b&&o&&o.k==='cgate'&&o.type==='lock'&&!o.opened&&o.opt&&o.opt.keys>1){ const n=A.keys(), need=o.opt.keys;
      if(n>=need){ G.found['keys_'+caveDsid(A.def)]=n-need; d3bVaultOpen(A,o,false); }
      else d3bSay(S(`A round vault door of brass with ${need} keyholes, side by side. You have ${n} small key${n===1?'':'s'} for it. Somewhere in the Star Dome's side rooms there must be more.`,`It needs ${need} small keys. You have ${n}.`)); return true; }
    return base.apply(this,arguments); }; }
function d3bVesperTick(A,o,dt){ const g=d3bVaultGate(A); o.on=!!G.flags.m_vesper_ally&&!!g&&!g.opened; o.a+=((o.on?1:0)-o.a)*Math.min(1,dt*3);
  if(o.on&&!A.d3b.vesRun&&scene==='play'&&dist(player.x,player.y,o.x,o.y)<190){ A.d3b.vesRun=true; d3bBeat('vault2',[['c_vesper',S('Two locks? Cute.','Two locks? Cute.')],['narr',S('Click. Click. The Vault door swings open.','Click. Click. It opens.')]],()=>d3bVaultOpen(A,g,true)); } }
// ---------- 11. the Eclipse Lens: the reforge (x3_story) waits for the end chest and for Ash at the Lens
if(typeof m3sReforge==='function'){ const base=m3sReforge; m3sReforge=function(){ const A=AREA;
    if(A&&A.d3b&&A.def&&dunRoot(A.def.id)==='m_obs'){ const L=A.d3b.objs.find(o=>o.k==='d3b_elens'); if(L&&caveRoomAt(player.x,player.y)===A.rooms[L.room]){
      const chest=A.objs.find(o=>o.tobj==='dchest'&&o.room===L.room&&o.kind==='heart'), near=dist(player.x,player.y,L.x,L.y)<230;
      if(chest&&!G.found[chest.id]){ if(near&&!(A.d3b.lensNag>G.time)){ A.d3b.lensNag=G.time+8; setBanner(S('The great chest first','The big chest first'),S('Iska: "Open the great chest, little ember. Then the Lens."','Open the big chest first!'),2.6); } return false; }
      if(!near) return false; } }
    return base.apply(this,arguments); }; }

// ---------- 12. the look: two themes, the painted rooms, every piece drawn in the Storybook style
// The Mirror Temple: white glass and silver mirrors, gold sun mosaics on the first floor, silver moon mosaics above,
// reflections in the mirror walls. The Observatory: night-blue tiles with brass star maps, brass walls, violet light.
defineDungeonTheme('m_mirror',{music:'m_temple',decor:'crystal',
  style:{floor:'#bcc6e2',floor2:'#b2bddb',top:'#f1f4fb',face:'#66739f',edge:'#ffe39a',water:'#4f86c8',accent:'#a8dcff'},
  pal:{tile:['#bcc6e2','#b2bddb','#bcc6e2','#b2bddb'],grout:'rgba(80,90,140,.3)',moss:'170,200,240',rune:'255,226,150',hole:'#14122a',lip:['#f1f4fb','#66739f'],water:'#4f86c8',cave:true}});
defineDungeonTheme('m_obs',{music:'m_eclipse',decor:'lamp',
  style:{floor:'#57538a',floor2:'#4f4b80',top:'#d8b468',face:'#4a3a5c',edge:'#ffe2a0',water:'#33478a',accent:'#cbaaff'},
  pal:{tile:['#57538a','#4f4b80','#57538a','#4f4b80'],grout:'rgba(20,14,40,.3)',moss:'200,170,255',rune:'255,222,150',hole:'#0a0816',lip:['#d8b468','#4a3a5c'],water:'#33478a',cave:true}});
function d3bSpr(key,R,draw){ const k=(LOOK&&LOOK.sb?'sb_':'cl_')+key; let c=D3B.spr.get(k); if(c) return c; c=(typeof sbSprite==='function'&&LOOK&&LOOK.sb)?sbSprite('d3b_'+key,R,draw):spriteOf(R,draw); D3B.spr.set(k,c); return c; }
const d3bTheme=A=>(A&&A.def&&A.def.theme)||'m_mirror';
// ---- the static floor (painted once per floor into the cave canvas)
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){ base.apply(this,arguments); if(d3bIsDef(def)) try{ d3bPaint(A,def); }catch(e){ console.error(e); } }; }
function d3bPaint(A,def){
  const c=A.cave, cs=c.cell, g=A.canvas.getContext('2d'), obs=def.theme==='m_obs', st=CAVE_STYLE[def.theme], rng=mulberry32((def.seed||7)*13+5);
  g.save(); g.setTransform(A.canvasS,0,0,A.canvasS,0,0);
  const solidAt=(i,j)=>i<0||j<0||i>=c.w||j>=c.h||(c.grid[j*c.w+i]===1&&c.typ[j*c.w+i]!==D3T.neck);
  // floor tiles: a big diamond of gold grout in the temple, brass star inlays in the observatory
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){ const k=j*c.w+i; if(c.grid[k]!==0||c.typ[k]!==0) continue; const x=i*cs, y=j*cs;
    if(!obs){ g.fillStyle=(i+j)%2?'rgba(255,255,255,.18)':'rgba(170,190,230,.10)'; g.fillRect(x,y,cs,cs); g.strokeStyle='rgba(212,180,90,.28)'; g.lineWidth=1.2; if((i+j)%4===0){ g.beginPath(); g.moveTo(x,y+cs/2); g.lineTo(x+cs/2,y); g.lineTo(x+cs,y+cs/2); g.lineTo(x+cs/2,y+cs); g.closePath(); g.stroke(); }
      g.fillStyle='rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(x+4,y+cs-6); g.lineTo(x+cs*0.35,y+4); g.lineTo(x+cs*0.42,y+4); g.lineTo(x+10,y+cs-6); g.closePath(); g.fill(); }
    else { if(rng()<0.16){ const sx=x+6+rng()*(cs-12), sy=y+6+rng()*(cs-12); g.fillStyle='rgba(255,226,150,.55)'; d3bStarPath(g,sx,sy,1.2+rng()*1.6,5); g.fill(); }
      g.strokeStyle='rgba(216,180,104,.22)'; g.lineWidth=1; g.strokeRect(x+1.5,y+1.5,cs-3,cs-3); } }
  // the special cells
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){ const k=j*c.w+i, t=c.typ[k], x=i*cs, y=j*cs;
    if(t===D3T.shadow){ g.fillStyle='#0e0a1c'; g.fillRect(x,y,cs,cs); for(let n=0;n<3;n++){ g.fillStyle=`rgba(${rng()<0.5?'200,180,255':'255,255,255'},${0.3+rng()*0.4})`; g.fillRect(x+rng()*cs,y+rng()*cs,1.6,1.6); }
      g.strokeStyle='rgba(150,110,220,.35)'; g.setLineDash([4,5]); g.lineWidth=1.4; g.strokeRect(x+3,y+3,cs-6,cs-6); g.setLineDash([]); }
    else if(t===D3T.pane){ const brk=d3bPaneBroken(A,k); if(brk){ g.fillStyle=obs?'#3a3460':'#9aa8c8'; g.fillRect(x,y,cs,cs); g.fillStyle='rgba(220,240,255,.7)'; for(let n=0;n<7;n++){ const a=rng()*TAU, px=x+6+rng()*(cs-12), py=y+6+rng()*(cs-12); g.beginPath(); g.moveTo(px,py); g.lineTo(px+Math.cos(a)*6,py+Math.sin(a)*4); g.lineTo(px+Math.cos(a+0.6)*4,py+Math.sin(a+0.6)*5); g.closePath(); g.fill(); } }
      else { g.fillStyle=obs?'#8fb4e8':'#c8e2fa'; g.fillRect(x,y,cs,cs); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(x+3,y+3,cs-6,4); g.strokeStyle='rgba(60,80,130,.55)'; g.lineWidth=1.2; g.strokeRect(x+1,y+1,cs-2,cs-2);
        g.strokeStyle='rgba(40,60,110,.5)'; g.beginPath(); const cx=x+cs*(0.3+rng()*0.4), cy=y+cs*(0.3+rng()*0.4); for(let a=0;a<5;a++){ const an=a*1.25+rng(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(an)*cs*0.42,cy+Math.sin(an)*cs*0.42); } g.stroke();
        // a glass face hangs below a pane that has lower floor to the south
        const s=k+c.w; if(j+1<c.h&&c.grid[s]===0&&dunHq(c,s)===0&&c.typ[s]!==D3T.pane){ const gr=g.createLinearGradient(0,y+cs,0,y+cs*1.55); gr.addColorStop(0,'rgba(170,210,250,.9)'); gr.addColorStop(1,'rgba(80,110,170,.4)'); g.fillStyle=gr; g.fillRect(x,y+cs,cs,cs*0.55); g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(x,y+cs,cs,2); } } }
    else if(t===D3T.neck){ g.fillStyle=obs?'#7a8ac8':'#bcd4f0'; g.fillRect(x,y,cs,cs); g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(x+cs*0.2,y,cs*0.12,cs); g.fillStyle='#d8b468'; g.fillRect(x,y,cs,4); g.fillRect(x,y+cs-4,cs,4); }
  }
  // wall faces: tall mirror panels in the temple (a cool sheen and a gold rim), riveted brass in the observatory
  for(let j=0;j<c.h-1;j++) for(let i=0;i<c.w;i++){ if(!solidAt(i,j)||solidAt(i,j+1)) continue; if(c.typ[j*c.w+i]===D3T.neck) continue; const x=i*cs, y=j*cs, fh=cs*0.6, fy=y+cs-fh;
    if(!obs){ const gr=g.createLinearGradient(x,fy,x+cs,fy+fh); gr.addColorStop(0,'#eef6ff'); gr.addColorStop(0.45,'#b9cdee'); gr.addColorStop(1,'#8fa6d4'); g.fillStyle=gr; g.fillRect(x+1,fy+2,cs-2,fh-3);
      g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+cs*0.2,fy+fh-3); g.lineTo(x+cs*0.45,fy+4); g.moveTo(x+cs*0.5,fy+fh-3); g.lineTo(x+cs*0.62,fy+fh*0.55); g.stroke();
      g.fillStyle='#e8c060'; g.fillRect(x,fy,cs,2.5); g.fillStyle='rgba(120,90,30,.5)'; g.fillRect(x,fy+fh-2,cs,2); }
    else { g.fillStyle='rgba(216,180,104,.85)'; g.fillRect(x,fy+fh*0.15,cs,3); g.fillRect(x,fy+fh*0.75,cs,3); g.fillStyle='rgba(255,236,180,.8)'; for(const ox of [8,cs-8]){ g.beginPath(); g.arc(x+ox,fy+fh*0.45,2,0,TAU); g.fill(); }
      if((i*7+j*3)%5===0){ g.fillStyle='rgba(30,20,60,.85)'; g.beginPath(); g.ellipse(x+cs/2,fy+fh*0.45,cs*0.26,fh*0.26,0,0,TAU); g.fill(); g.strokeStyle='#d8b468'; g.lineWidth=2.5; g.stroke(); g.fillStyle='rgba(200,170,255,.8)'; g.fillRect(x+cs/2-1,fy+fh*0.45-1,2,2); } } }
  // each room's floor picture
  for(const id in A.rooms){ const R=A.rooms[id]; if(!R.floorArt) continue; const fa=Array.isArray(R.floorArt)?R.floorArt:[R.floorArt]; for(const f of fa) try{ d3bFloorArt(g,A,R,f,rng); }catch(e){ console.error(e); } }
  g.restore();
}
function d3bStarPath(g,x,y,r,n){ g.beginPath(); for(let i=0;i<n*2;i++){ const a=-Math.PI/2+i*Math.PI/n, rr=i%2?r*0.45:r; i?g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):g.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } g.closePath(); }
// floor pictures: {k:'sun'|'moon'|'stars'|'lantern'|'hourglass'|'mirrorline'|'orrery'|'ring', at:[c,r], r:cells, axis}
function d3bFloorArt(g,A,R,f,rng){
  const cs=A.cave.cell, ox=(R.ox+1)*cs, oy=(R.oy+1)*cs, k=typeof f==='string'?f:f.k, at=f.at||[(R.iw-1)/2,(R.ih-1)/2], cx=ox+(at[0]+0.5)*cs, cy=oy+(at[1]+0.5)*cs, rad=(f.r||3)*cs;
  g.save();
  if(k==='sun'){ g.globalAlpha=0.32; for(let n=0;n<16;n++){ const a=n/16*TAU; g.fillStyle=n%2?'#f2c25a':'#ffd98a'; g.beginPath(); g.moveTo(cx+Math.cos(a-0.12)*rad*0.42,cy+Math.sin(a-0.12)*rad*0.42); g.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad); g.lineTo(cx+Math.cos(a+0.12)*rad*0.42,cy+Math.sin(a+0.12)*rad*0.42); g.closePath(); g.fill(); }
    g.globalAlpha=0.45; g.fillStyle='#ffd25a'; g.beginPath(); g.arc(cx,cy,rad*0.4,0,TAU); g.fill(); g.strokeStyle='#c8902a'; g.lineWidth=3; g.stroke(); g.fillStyle='#fff0b8'; g.beginPath(); g.arc(cx-rad*0.1,cy-rad*0.1,rad*0.18,0,TAU); g.fill(); }
  else if(k==='moon'){ g.globalAlpha=0.6; g.strokeStyle='#9eb8e6'; g.lineWidth=3; g.beginPath(); g.arc(cx,cy,rad,0,TAU); g.stroke(); g.lineWidth=1.5; g.beginPath(); g.arc(cx,cy,rad*0.82,0,TAU); g.stroke();
    for(let n=0;n<8;n++){ const a=n/8*TAU, x=cx+Math.cos(a)*rad*0.91, y=cy+Math.sin(a)*rad*0.91, ph=n/8; g.fillStyle='#e8f0ff'; g.beginPath(); g.arc(x,y,cs*0.22,0,TAU); g.fill(); g.fillStyle='#7d90c0'; g.beginPath(); g.arc(x+(ph-0.5)*cs*0.4,y,cs*0.2,0,TAU); g.fill(); }
    g.fillStyle='#dfe9ff'; g.beginPath(); g.arc(cx,cy,rad*0.45,0,TAU); g.fill(); g.fillStyle='#a8bce6'; g.beginPath(); g.arc(cx+rad*0.16,cy-rad*0.08,rad*0.38,0,TAU); g.fill(); }
  else if(k==='stars'){ g.globalAlpha=0.7; g.strokeStyle='rgba(216,180,104,.5)'; g.lineWidth=2; g.beginPath(); g.arc(cx,cy,rad,0,TAU); g.stroke(); g.beginPath(); g.arc(cx,cy,rad*0.7,0,TAU); g.stroke();
    for(let n=0;n<24;n++){ const a=n/24*TAU; g.beginPath(); g.moveTo(cx+Math.cos(a)*rad*0.93,cy+Math.sin(a)*rad*0.93); g.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad); g.stroke(); }
    for(let n=0;n<26;n++){ const a=rng()*TAU, d=Math.sqrt(rng())*rad*0.95; g.fillStyle='rgba(255,236,190,.8)'; d3bStarPath(g,cx+Math.cos(a)*d,cy+Math.sin(a)*d,1.6+rng()*2.4,4); g.fill(); } }
  else if(k==='lantern'){ // the LANTERN constellation, as the star lamps of the dome stand (the good ones of the room)
    const S=f.pts||[]; g.globalAlpha=0.9; g.strokeStyle='rgba(255,226,150,.65)'; g.lineWidth=3; g.setLineDash([6,6]); g.beginPath(); S.forEach((q,n)=>{ const x=ox+(q[0]+0.5)*cs, y=oy+(q[1]+0.5)*cs; n?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); g.setLineDash([]);
    for(const q of S){ const x=ox+(q[0]+0.5)*cs, y=oy+(q[1]+0.5)*cs; g.fillStyle='rgba(255,236,170,.95)'; d3bStarPath(g,x,y,7,5); g.fill(); g.strokeStyle='#8a6a2a'; g.lineWidth=1.5; g.stroke(); } }
  else if(k==='mirrorline'){ g.globalAlpha=0.8; const ax=f.axis||'x'; g.strokeStyle='rgba(200,215,255,.85)'; g.lineWidth=4; g.setLineDash([10,8]); g.beginPath(); if(ax==='x'){ g.moveTo(ox+R.iw*cs/2,oy); g.lineTo(ox+R.iw*cs/2,oy+R.ih*cs); } else { g.moveTo(ox,oy+R.ih*cs/2); g.lineTo(ox+R.iw*cs,oy+R.ih*cs/2); } g.stroke(); g.setLineDash([]); }
  else if(k==='hourglass'){ g.globalAlpha=0.5; g.strokeStyle='#d8b468'; g.lineWidth=5; const w=R.iw*cs, h=R.ih*cs; g.beginPath(); g.moveTo(ox+cs,oy+cs*0.5); g.lineTo(ox+w-cs,oy+cs*0.5); g.lineTo(ox+w/2+cs*1.6,oy+h/2); g.lineTo(ox+w-cs,oy+h-cs*0.5); g.lineTo(ox+cs,oy+h-cs*0.5); g.lineTo(ox+w/2-cs*1.6,oy+h/2); g.closePath(); g.stroke(); }
  else if(k==='orrery'){ g.globalAlpha=0.55; g.strokeStyle='#d8b468'; g.lineWidth=3; for(const rr of [1.2,2.6,4.2]){ g.beginPath(); g.ellipse(cx,cy,rr*cs,rr*cs*0.82,0,0,TAU); g.stroke(); } }
  else if(k==='ring'){ g.globalAlpha=0.6; g.strokeStyle=f.col||'#d8b468'; g.lineWidth=3; g.beginPath(); g.arc(cx,cy,rad,0,TAU); g.stroke(); }
  g.restore();
}
// the minimap knows the new cells
{ const base=renderCaveMini; renderCaveMini=function(A){ base.apply(this,arguments); if(!A||!A.d3b||!A.mini) return; const c=A.cave, mg=A.mini.getContext('2d'), im=mg.getImageData(0,0,c.w,c.h); let ch=false;
    for(let k=0;k<c.typ.length;k++){ const t=c.typ[k]; if(t<260||t>263) continue; const a=k*4; if(im.data[a]===10&&im.data[a+1]===8) continue; const v=t===D3T.shadow?[50,30,80]:t===D3T.pane?[170,200,235]:t===D3T.neck?[150,170,210]:null; if(v){ im.data[a]=v[0]; im.data[a+1]=v[1]; im.data[a+2]=v[2]; ch=true; } }
    if(ch) mg.putImageData(im,0,0); }; }

// ---- the live floor layer (under everyone): shadow platforms, beams, plates, shafts, the hourglass, the gears, planets
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){
    // (the engine draws its moving platforms as planks; ours are planets and gears, drawn here)
    const mv=A&&A.d3b&&A.dn?A.dn.movers:null; if(mv) A.dn.movers=mv.filter(m=>{ const R=A.rooms[m.room]; return !(R&&(R.sunMovers||R.gears)); });
    try{ base.apply(this,arguments); } finally{ if(mv) A.dn.movers=mv; }
    if(A&&A.d3b) try{ d3bDrawFloor(A,t); }catch(e){ console.error(e); } }; }
function d3bDrawFloor(A,t){
  const X=A.d3b, c=A.cave, cs=c.cell, obs=d3bTheme(A)==='m_obs';
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1), j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  // shadow platforms: solid violet slabs in an eclipse, a faint dotted ghost otherwise
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i; if(c.typ[k]!==D3T.shadow) continue; const x=A.x0+i*cs, y=A.y0+j*cs;
    if(X.shadow[k]){ ctx.fillStyle='#3a2468'; ctx.fillRect(x+1,y+1,cs-2,cs-2); ctx.fillStyle='#5a3a96'; ctx.fillRect(x+3,y+3,cs-6,cs*0.55); ctx.fillStyle=`rgba(200,170,255,${0.35+0.2*Math.sin(t*2+i+j)})`; ctx.fillRect(x+4,y+4,cs-8,2.5);
      ctx.strokeStyle='rgba(20,8,40,.8)'; ctx.lineWidth=2; ctx.strokeRect(x+1,y+1,cs-2,cs-2); }
    else { ctx.strokeStyle=`rgba(170,130,240,${0.18+0.1*Math.sin(t*1.5+i*0.7+j)})`; ctx.lineWidth=1.5; ctx.setLineDash([3,6]); ctx.strokeRect(x+5,y+5,cs-10,cs-10); ctx.setLineDash([]); } }
  // the glass panes shine
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i; if(c.typ[k]!==D3T.pane||d3bPaneBroken(A,k)) continue; const x=A.x0+i*cs, y=A.y0+j*cs, f=((t*0.35+i*0.13+j*0.07)%1); ctx.fillStyle='rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(x+f*cs,y+2); ctx.lineTo(x+f*cs+8,y+2); ctx.lineTo(x+f*cs-6,y+cs-2); ctx.lineTo(x+f*cs-14,y+cs-2); ctx.closePath(); ctx.fill(); }
  // the Eclipse Lens (flat, huge), the jammed cog, plates and the twin tile, beam shafts
  for(const o of X.objs){ if(!inView(o.x,o.y,140)) continue;
    if(o.k==='d3b_elens') d3bDrawELens(o,t);
    else if(o.k==='d3b_cog') d3bDrawCog(A,o,t);
    else if(o.k==='d3b_plate'){ const on=o.on; ctx.fillStyle=on?'rgba(200,215,255,.95)':'rgba(120,130,170,.8)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+4,18,12,0,0,TAU); ctx.fill(); ctx.strokeStyle=d3bOL(); ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle=on?'#ffffff':'#9aa6cc'; ctx.beginPath(); ctx.ellipse(o.x,o.y+2,11,7,0,0,TAU); ctx.fill(); if(on) glowAt(o.x,o.y,40,'200,215,255',0.5); }
    else if(o.k==='d3b_sync'){ ctx.fillStyle='rgba(40,30,70,.85)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+4,20,13,0,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(190,170,255,${0.5+0.3*Math.sin(t*3)})`; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='rgba(220,210,255,.9)'; ctx.font=`900 12px ${UIF}`; ctx.textAlign='center'; ctx.fillText('II',o.x,o.y+8); }
    else if(o.k==='d3b_shaft'){ const live=D3B.trace&&D3B.trace.shaft.has(o.ri.key+'|'+o.li); ctx.fillStyle='#1a1630'; ctx.beginPath(); ctx.ellipse(o.x,o.y+3,19,13,0,0,TAU); ctx.fill(); ctx.strokeStyle='#d8b468'; ctx.lineWidth=4; ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(o.x,o.y+3,13,8,0,0,TAU); ctx.stroke();
      if(live){ ctx.save(); ctx.globalCompositeOperation='lighter'; const gr=ctx.createLinearGradient(o.x,o.y-160,o.x,o.y); gr.addColorStop(0,'rgba(190,215,255,0)'); gr.addColorStop(1,'rgba(190,215,255,.45)'); ctx.fillStyle=gr; ctx.fillRect(o.x-11,o.y-160,22,160); ctx.restore(); glowAt(o.x,o.y,34,'190,215,255',0.55); } }
  }
  // the hourglass: sand heaped in the half that holds it, a stream through the neck while it pours
  if(X.clock) d3bDrawClock(A,X.clock,t);
  // planets of the orrery and the gears of the stair, over the engine's wooden platforms
  for(const m of A.dn.movers){ const R=A.rooms[m.room]; if(!R||!inView(m.x+m.w/2,m.y+m.h/2,m.w)) continue; if(R.sunMovers) d3bDrawPlanet(A,R,m,t); else if(R.gears) d3bDrawGearMover(A,m,t); }
  // the light itself
  d3bDrawBeams(A,t);
  // ECLIPSE: a violet shimmer under strong foes
  for(const e of G.enemies){ if(e.dead||!e.d3bS||!inView(e.x,e.y,60)) continue; glowAt(e.x,e.y,34,'120,60,200',0.35+0.1*Math.sin(t*5+e.x)); }
}
function d3bDrawELens(o,t){ const x=o.x, y=o.y, R=58; ctx.save(); ctx.fillStyle='#8a6a2a'; ctx.beginPath(); ctx.ellipse(x,y+6,R+12,(R+12)*0.62,0,0,TAU); ctx.fill(); ctx.fillStyle='#d8b468'; ctx.beginPath(); ctx.ellipse(x,y,R+10,(R+10)*0.62,0,0,TAU); ctx.fill(); ctx.strokeStyle=d3bOL(); ctx.lineWidth=2.4; ctx.stroke();
  const gr=ctx.createRadialGradient(x-R*0.3,y-R*0.2,4,x,y,R); gr.addColorStop(0,'#f4f8ff'); gr.addColorStop(0.5,'#a8c4f0'); gr.addColorStop(1,'#5a6ab0'); ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(x,y,R,R*0.62,0,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y,R*0.7,R*0.43,0,Math.PI*1.1,Math.PI*1.6); ctx.stroke();
  for(let n=0;n<3;n++){ const a=-Math.PI/2+n*TAU/3; ctx.fillStyle=['#a080e0','#9ad8ff','#e8eef8'][n]; ctx.beginPath(); ctx.arc(x+Math.cos(a)*R*0.45,y+Math.sin(a)*R*0.28,5,0,TAU); ctx.fill(); }
  if(G.flags.m_reforged){ glowAt(x,y,80,'255,180,90',0.4+0.1*Math.sin(t*2)); ctx.fillStyle='#ff9a3a'; ctx.beginPath(); ctx.arc(x,y,7,0,TAU); ctx.fill(); }
  glowAt(x,y,R*1.4,'170,200,255',0.25+0.05*Math.sin(t*1.3)); ctx.restore(); }
function d3bGearPath(g,x,y,r,n,a){ g.beginPath(); for(let i=0;i<n*2;i++){ const an=a+i*Math.PI/n, rr=i%2?r*0.8:r; const a0=an-Math.PI/n*0.38, a1=an+Math.PI/n*0.38; g.lineTo(x+Math.cos(a0)*rr,y+Math.sin(a0)*rr); g.lineTo(x+Math.cos(a1)*rr,y+Math.sin(a1)*rr); } g.closePath(); }
function d3bDrawCog(A,o,t){ const Gr=A.d3b.gears, a=Gr?Gr.ang:0, started=Gr&&Gr.started; ctx.save(); ctx.fillStyle='rgba(0,0,0,.3)'; d3bGearPath(ctx,o.x+3,o.y+5,30,10,a); ctx.fill(); ctx.fillStyle='#c8984a'; d3bGearPath(ctx,o.x,o.y,30,10,a); ctx.fill(); ctx.strokeStyle=d3bOL(); ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle=started?'#e8d8a0':'#a8c8e8'; ctx.beginPath(); ctx.arc(o.x,o.y,12,0,TAU); ctx.fill(); ctx.stroke(); if(!started){ ctx.strokeStyle='rgba(40,60,110,.8)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(o.x-8,o.y-3); ctx.lineTo(o.x,o.y+1); ctx.lineTo(o.x+7,o.y-6); ctx.moveTo(o.x,o.y+1); ctx.lineTo(o.x+2,o.y+9); ctx.stroke(); glowAt(o.x,o.y,30,'200,230,255',0.2+0.15*Math.sin(t*4)); } ctx.restore(); }
function d3bDrawGearMover(A,m,t){ const Gr=A.d3b.gears, a=(Gr?Gr.ang:0)*1.3, x=m.x+m.w/2, y=m.y+m.h/2, r=Math.min(m.w,m.h)*0.55; ctx.save();
  ctx.fillStyle='rgba(0,0,0,.35)'; d3bGearPath(ctx,x+4,y+7,r,12,a); ctx.fill(); ctx.fillStyle=Gr&&Gr.started&&!Gr.braked?'#e0a048':'#c8984a'; d3bGearPath(ctx,x,y,r,12,a); ctx.fill(); ctx.strokeStyle=d3bOL(); ctx.lineWidth=2.2; ctx.stroke();
  ctx.fillStyle='#a87a34'; ctx.beginPath(); ctx.arc(x,y,r*0.62,0,TAU); ctx.fill(); ctx.fillStyle='#e8c878'; ctx.beginPath(); ctx.arc(x,y,r*0.25,0,TAU); ctx.fill(); ctx.stroke();
  for(let n=0;n<4;n++){ const an=a+n*Math.PI/2; ctx.strokeStyle='#8a5a24'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x+Math.cos(an)*r*0.28,y+Math.sin(an)*r*0.28); ctx.lineTo(x+Math.cos(an)*r*0.6,y+Math.sin(an)*r*0.6); ctx.stroke(); }
  if(Gr&&Gr.started&&!Gr.braked){ for(let n=0;n<2;n++) emit(x+rand(-r,r),y+rand(-r,r)*0.6,1,{col:'255,210,120',smin:40,smax:140,lmin:.1,lmax:.25,zmin:1,zmax:2}); } ctx.restore(); }
function d3bDrawPlanet(A,R,m,t){ const x=m.x+m.w/2, y=m.y+m.h/2, r=Math.min(m.w,m.h)*0.48, i=A.dn.movers.filter(q=>q.room===m.room).indexOf(m), col=['#e8a060','#7ac0e8','#c8a0e8'][i%3];
  // the brass arm back to the sun
  const sun=A.d3b.objs.find(o=>o.k==='d3b_osun'&&o.room===m.room); if(sun){ ctx.strokeStyle='#8a6a2a'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(sun.x,sun.y-20); ctx.lineTo(x,y); ctx.stroke(); ctx.strokeStyle='#e8c878'; ctx.lineWidth=2.5; ctx.stroke(); }
  ctx.save(); ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x+5,y+9,r*1.05,r*0.7,0,0,TAU); ctx.fill();
  ctx.fillStyle='#c8984a'; ctx.beginPath(); ctx.ellipse(x,y+4,r*1.02,r*0.72,0,0,TAU); ctx.fill(); ctx.strokeStyle=d3bOL(); ctx.lineWidth=2.2; ctx.stroke();
  const gr=ctx.createRadialGradient(x-r*0.3,y-r*0.35,2,x,y,r*0.9); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.35,col); gr.addColorStop(1,sbTone?sbTone(col,-0.45):col); ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(x,y,r*0.86,r*0.62,0,0,TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(255,236,190,.85)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y+2,r*1.0,r*0.3,-0.2,0,TAU); ctx.stroke(); ctx.restore(); }
function d3bDrawClock(A,C,t){ const R=C.R, cs=A.cave.cell, cx=(R.x0+R.x1)/2, cy=(R.y0+R.y1)/2, w=R.x1-R.x0, h=R.y1-R.y0;
  const f=C.pour>0?1-C.pour/C.pmax:1, top=C.pour>0?C.from:null, bot=C.side;
  const heap=(half,amt)=>{ if(amt<=0.02) return; const y0=half==='N'?R.y0+h*0.12:cy+cs*0.6, sx=half==='N'?1:1; ctx.fillStyle='rgba(226,196,122,.55)'; ctx.beginPath(); const hw=w*0.32*Math.sqrt(amt), hh=h*0.2*amt;
    if(half==='N'){ ctx.ellipse(cx,cy-cs*1.2,hw,hh+6,0,0,TAU); } else { ctx.ellipse(cx,cy+cs*1.2,hw,hh+6,0,0,TAU); } ctx.fill(); };
  if(C.pour>0){ heap(top,1-f); heap(bot,f); ctx.save(); ctx.globalAlpha=0.9; for(let n=0;n<12;n++){ const q=((t*2.2+n/12)%1), yy=top==='N'?cy-cs*0.9+q*cs*1.8:cy+cs*0.9-q*cs*1.8; ctx.fillStyle='#e2c27a'; ctx.fillRect(cx-6+((n*7)%12),yy,3,5); } ctx.restore(); }
  else heap(bot,1);
  if(C.turn>0){ const k=1-C.turn/1.4, a=k*Math.PI; ctx.save(); ctx.translate(cx,cy); ctx.rotate(a); ctx.globalAlpha=Math.sin(k*Math.PI)*0.75; ctx.strokeStyle='#ffe6a0'; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(-w*0.42,-h*0.45); ctx.lineTo(w*0.42,-h*0.45); ctx.lineTo(-w*0.42,h*0.45); ctx.lineTo(w*0.42,h*0.45); ctx.closePath(); ctx.stroke(); ctx.restore(); }
}
// ---- standing pieces, sorted with the figures
{ const base=eventsForRender; eventsForRender=function(list){ base(list); const A=AREA; if(!A||!A.d3b) return;
    for(const o of A.d3b.stand){ if(!inView(o.x,o.y,o.k==='d3b_mirage'?200:120)) continue; if(!o._it) o._it={x:o.x,y:o.y,r:6,flying:true,draw:()=>{ try{ d3bDrawStand(A,o,G.time); }catch(e){ console.error(e); } }}; o._it.x=o.x; o._it.y=o.k==='d3b_mirage'?o.y-30:o.k==='d3b_terrace'?o.y-40:o.y+2; list.push(o._it); }
    for(const id in A.d3b.twins){ const T=A.d3b.twins[id]; if(!T.on&&!(T.a>0)) continue; for(const b of T.b){ if(!b._it) b._it={x:0,y:0,r:6,flying:true,draw:()=>d3bDrawTwin(b,T)}; b._it.x=b.x; b._it.y=b.y; list.push(b._it); } }
  }; }
function d3bDrawTwin(b,T){ const p=player; if(!p||p.dead) return; const sv={x:p.x,y:p.y,f:p.facing,gh:p.ghosts,z:p.z,ifr:p.iframes};
  ctx.save(); ctx.globalAlpha=0.6*(T.a==null?1:T.a); try{ p.x=b.x; p.y=b.y; p.facing=b.face; p.ghosts=[]; p.z=0; p.iframes=0; drawPlayer(); } catch(e){} finally{ p.x=sv.x; p.y=sv.y; p.facing=sv.f; p.ghosts=sv.gh; p.z=sv.z; p.iframes=sv.ifr; ctx.restore(); }
  glowAt(b.x,b.y-14,30,b.frz>0?'220,235,255':'150,140,240',0.4); if(b.frz>0){ ctx.strokeStyle='rgba(230,240,255,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(b.x,b.y-14,16,22,0,0,TAU); ctx.stroke(); } }
// the engine's mirrors, redrawn for these two dungeons: an oval mirror on a gold foot, turned / or \
{ const base=DUN_DRAW.mirror; DUN_DRAW.mirror=(q,t)=>{ const A=AREA; if(!A||!A.d3b) return base(q,t); const x=q.x, y=q.y, rot=q.rot;
    const sp=d3bSpr('mirfoot',22,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,10,18,7,0,0,TAU); g.fill(); celFill(g,(c,dx,dy)=>c.ellipse(dx,6+dy,15,7,0,0,TAU),'#d8b468',{r:15}); });
    drawSprite(sp,x,y,1);
    ctx.save(); ctx.translate(x,y-22); ctx.scale(rot?-1:1,1); ctx.rotate(-0.55);
    ctx.fillStyle='#c8a050'; ctx.beginPath(); ctx.ellipse(0,0,10,24,0,0,TAU); ctx.fill(); ctx.strokeStyle=d3bOL(); ctx.lineWidth=2; ctx.stroke();
    const gr=ctx.createLinearGradient(-8,-20,8,20); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.5,'#bcd6f4'); gr.addColorStop(1,'#8aa6d8'); ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(0,0,7,20,0,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-3,-12); ctx.lineTo(2,-4); ctx.stroke(); ctx.restore();
    ctx.strokeStyle='rgba(255,236,170,.55)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,y-14,26,-0.6,0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(x,y-14,26,Math.PI-0.6,Math.PI+0.6); ctx.stroke(); }; }

function d3bDrawStand(A,o,t){
  const x=o.x, y=o.y, oc=d3bOL();
  switch(o.k){
    case 'd3b_sky': { const opt=o.opt||{}, moon=opt.kind==='moon', on=d3bEmitOn(o.ri,{ch:'Φ',opt}), d=d3bSkyDir(o.ri,o.c,o.r,opt), col=moon?'190,215,255':'255,220,130';
      // the skylight's column of light falling on the mirror
      if(on){ ctx.save(); ctx.globalCompositeOperation='lighter'; const gr=ctx.createLinearGradient(x,y-260,x,y-24); gr.addColorStop(0,`rgba(${col},0)`); gr.addColorStop(1,`rgba(${col},.42)`); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(x-16,y-260); ctx.lineTo(x+16,y-260); ctx.lineTo(x+22,y-26); ctx.lineTo(x-22,y-26); ctx.closePath(); ctx.fill(); ctx.restore(); }
      drawSprite(d3bSpr('skyped'+(moon?'m':'s'),24,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,12,20,8,0,0,TAU); g.fill(); celFill(g,(c,dx,dy)=>{ c.moveTo(-12+dx,10+dy); c.lineTo(12+dx,10+dy); c.lineTo(8+dx,-6+dy); c.lineTo(-8+dx,-6+dy); c.closePath(); },moon?'#a8b8e0':'#e0b858',{r:14}); celFill(g,(c,dx,dy)=>c.ellipse(dx,10+dy,13,5,0,0,TAU),moon?'#8a9ac8':'#c8984a',{r:13}); }),x,y,1);
      const a=[-Math.PI/2,0,Math.PI/2,Math.PI][d]+(o.spin>0?o.spin*Math.PI*0.5:0);
      ctx.save(); ctx.translate(x,y-20); ctx.fillStyle=moon?'#c8d4f0':'#f0d080'; ctx.beginPath(); ctx.ellipse(0,0,15,15*0.62,0,0,TAU); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=2; ctx.stroke();
      const gr=ctx.createLinearGradient(-10,-8,10,8); gr.addColorStop(0,'#ffffff'); gr.addColorStop(1,moon?'#9ab0e0':'#ffe0a0'); ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(0,0,11,11*0.62,0,0,TAU); ctx.fill();
      ctx.fillStyle=moon?'#4a5a9a':'#a8701a'; ctx.beginPath(); ctx.moveTo(Math.cos(a)*16,Math.sin(a)*10); ctx.lineTo(Math.cos(a+2.5)*7,Math.sin(a+2.5)*4.5); ctx.lineTo(Math.cos(a-2.5)*7,Math.sin(a-2.5)*4.5); ctx.closePath(); ctx.fill(); ctx.restore();
      glowAt(x,y-20,on?34:18,col,on?0.55:0.15); return; }
    case 'd3b_win': { const opt=o.opt||{}, moon=opt.kind==='moon', on=d3bEmitOn(o.ri,{ch:'Ϙ',opt}), col=moon?'190,215,255':'255,220,130';
      if(opt.win){ // a slit window in the wall the beam comes through
        const wd=DIRN[opt.win||'n'], wx=x+D3B_DX[wd]*24, wy=y+D3B_DY[wd]*24-(wd===0?20:10);
        ctx.fillStyle=on?(moon?'#dfe9ff':'#fff2c0'):'#4a4660'; ctx.strokeStyle='#d8b468'; ctx.lineWidth=3; ctx.beginPath(); if(wd===0||wd===2) ctx.ellipse(wx,wy,14,9,0,0,TAU); else ctx.ellipse(wx,wy,8,15,0,0,TAU); ctx.fill(); ctx.stroke();
        if(on){ glowAt(wx,wy,40,col,0.6); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=`rgba(${col},.18)`; ctx.beginPath(); ctx.moveTo(wx-8,wy); ctx.lineTo(wx+8,wy); ctx.lineTo(x+12,y-6); ctx.lineTo(x-12,y-6); ctx.closePath(); ctx.fill(); ctx.restore(); } }
      else { drawSprite(d3bSpr('lamp'+(moon?'m':'s'),26,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,12,13,5,0,0,TAU); g.fill(); g.fillStyle='#8a6a2a'; g.fillRect(-2.5,-18,5,30); celFill(g,(c,dx,dy)=>c.ellipse(dx,12+dy,10,4,0,0,TAU),'#c8984a',{r:10}); }),x,y,1);
        ctx.fillStyle=on?(moon?'#e8f0ff':'#fff0b0'):'#6a6880'; ctx.beginPath(); ctx.arc(x,y-22,9,0,TAU); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=2; ctx.stroke(); if(on) glowAt(x,y-22,40,col,0.65); }
      return; }
    case 'd3b_lens': { const lit=A.d3b.lensOn[o.room+':'+o.c+','+o.r]>0, w=o.warm||0;
      drawSprite(d3bSpr('lensstand',28,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,12,18,7,0,0,TAU); g.fill(); g.fillStyle='#8a6a2a'; g.fillRect(-3,-14,6,24); celFill(g,(c,dx,dy)=>c.ellipse(dx,12+dy,14,5.5,0,0,TAU),'#c8984a',{r:14}); g.strokeStyle='#c8984a'; g.lineWidth=5; g.beginPath(); g.arc(0,-26,15,0,TAU); g.stroke(); g.strokeStyle='#3b2233'; g.lineWidth=1.2; g.beginPath(); g.arc(0,-26,17.5,0,TAU); g.stroke(); }),x,y,1);
      const gr=ctx.createRadialGradient(x-4,y-30,1,x,y-26,13); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.6,lit?'#ffe080':w>0?'#e8f0ff':'#cfe4f8'); gr.addColorStop(1,lit?'#ff9a2a':'#7a9ac8'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y-26,12.5,0,TAU); ctx.fill();
      if(lit) glowAt(x,y-26,54,'255,210,110',0.7+0.1*Math.sin(t*12)); else if(w>0) glowAt(x,y-26,30,'150,200,255',w*0.6); return; }
    case 'd3b_tgt': { const moon=o.want==='moon', lit=o.lit, hot=clamp((o.hot||0)/0.35,0,1), col=moon?'200,220,255':'255,214,110';
      drawSprite(d3bSpr('tgtped',22,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,10,17,7,0,0,TAU); g.fill(); celFill(g,(c,dx,dy)=>{ c.moveTo(-11+dx,9+dy); c.lineTo(11+dx,9+dy); c.lineTo(8+dx,-2+dy); c.lineTo(-8+dx,-2+dy); c.closePath(); },'#9a92b8',{r:12}); }),x,y,1);
      const c1=lit?(moon?'#f4f8ff':'#fff6c8'):hot>0?(moon?'#dfe8ff':'#ffe8a0'):(moon?'#9aaad8':'#c8a050'), c2=lit?(moon?'#7a9ae8':'#ffa020'):(moon?'#4a5a98':'#7a5a1a');
      ctx.fillStyle=r2lg(ctx,x-10,y-40,x+10,y-4,'#ffffff',c1,c2); ctx.beginPath(); ctx.moveTo(x,y-44); ctx.lineTo(x+11,y-22); ctx.lineTo(x+6,y-4); ctx.lineTo(x-6,y-4); ctx.lineTo(x-11,y-22); ctx.closePath(); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=1.8; ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x-5,y-30); ctx.lineTo(x,y-40); ctx.stroke();
      if(moon){ ctx.fillStyle='rgba(60,70,130,.55)'; ctx.beginPath(); ctx.arc(x+1,y-24,4,0,TAU); ctx.fill(); ctx.fillStyle=c1; ctx.beginPath(); ctx.arc(x+3,y-25,3.6,0,TAU); ctx.fill(); }
      else { ctx.fillStyle='rgba(140,90,10,.6)'; d3bStarPath(ctx,x,y-24,4.5,8); ctx.fill(); }
      glowAt(x,y-24,lit?62:30,col,lit?0.7:0.15+0.45*hot); if(lit){ for(let n=0;n<6;n++){ const a=n/6*TAU+t*0.6; ctx.strokeStyle=`rgba(${col},.45)`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*16,y-24+Math.sin(a)*16); ctx.lineTo(x+Math.cos(a)*24,y-24+Math.sin(a)*24); ctx.stroke(); } } return; }
    case 'd3b_dial': { const R=A.rooms[o.room], st=Math.max(0,d3bDialOf(A,R)), sp=o.spin>0?o.spin:0;
      drawSprite(d3bSpr('dialbody',30,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(3,14,24,9,0,0,TAU); g.fill(); celFill(g,(c,dx,dy)=>{ c.moveTo(-10+dx,14+dy); c.lineTo(10+dx,14+dy); c.lineTo(6+dx,-10+dy); c.lineTo(-6+dx,-10+dy); c.closePath(); },'#a87a34',{r:14}); celFill(g,(c,dx,dy)=>c.ellipse(dx,14+dy,16,6,0,0,TAU),'#c8984a',{r:16}); }),x,y,1);
      const cy=y-36, rr=22, a0=-Math.PI/2-st*TAU/3-sp*TAU/3;
      ctx.save(); ctx.fillStyle='#e8c878'; ctx.beginPath(); ctx.arc(x,cy,rr+4,0,TAU); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=2.2; ctx.stroke(); ctx.fillStyle='#3a2a58'; ctx.beginPath(); ctx.arc(x,cy,rr,0,TAU); ctx.fill();
      for(let n=0;n<3;n++){ const a=a0+n*TAU/3, px=x+Math.cos(a)*rr*0.6, py=cy+Math.sin(a)*rr*0.6; d3bSym(px,py,n,6.5,n===st&&sp<=0.05); }
      ctx.fillStyle='#ffe6a0'; ctx.beginPath(); ctx.moveTo(x,cy-rr-9); ctx.lineTo(x+6,cy-rr-1); ctx.lineTo(x-6,cy-rr-1); ctx.closePath(); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=1.4; ctx.stroke(); ctx.restore();
      glowAt(x,cy,46,['255,220,130','190,215,255','160,110,240'][st],0.45); return; }
    case 'd3b_stud': { const R=A.rooms[o.room], st=Math.max(0,d3bDialOf(A,R)), on=o.set?D3B_DIAL.indexOf(o.set):st, b=o.mover!=null;
      if(!b) drawSprite(d3bSpr('studpost',16,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,8,11,4,0,0,TAU); g.fill(); g.fillStyle='#8a6a2a'; g.fillRect(-2.5,-12,5,20); celFill(g,(c,dx,dy)=>c.ellipse(dx,8+dy,8,3.5,0,0,TAU),'#c8984a',{r:8}); }),x,y,1);
      const cy=y-(b?6:20); ctx.fillStyle='#e8c878'; ctx.beginPath(); ctx.arc(x,cy,11,0,TAU); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=1.8; ctx.stroke(); ctx.fillStyle='#3a2a58'; ctx.beginPath(); ctx.arc(x,cy,8,0,TAU); ctx.fill();
      ctx.save(); ctx.translate(x,cy); if(o.spin>0) ctx.rotate(o.spin*TAU); d3bSym(0,0,on,5,true); ctx.restore(); if(o.set){ ctx.strokeStyle='rgba(255,236,170,.8)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x,cy,13.5,0,TAU); ctx.stroke(); } return; }
    case 'd3b_lamp': { const lit=o.lit>0, H=o.high?92:52;
      drawSprite(d3bSpr('lamppost'+(o.high?'h':''),o.high?60:36,g=>{ const h=o.high?92:52; g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,4,12,5,0,0,TAU); g.fill(); g.fillStyle='#4a3a2a'; g.fillRect(-2.5,-h+6,5,h); g.fillStyle='#8a6a3a'; g.fillRect(-1.2,-h+6,1.6,h);
        celFill(g,(c,dx,dy)=>c.ellipse(dx,2+dy,8,3.5,0,0,TAU),'#6a5a3a',{r:8}); g.strokeStyle='#4a3a2a'; g.lineWidth=2.5; g.beginPath(); g.moveTo(0,-h+10); g.quadraticCurveTo(10,-h+4,8,-h+16); g.stroke();
        celFill(g,(c,dx,dy)=>{ c.moveTo(-8+dx,-h+2+dy); c.lineTo(8+dx,-h+2+dy); c.lineTo(5+dx,-h-10+dy); c.lineTo(-5+dx,-h-10+dy); c.closePath(); },'#3a3040',{r:9}); }),x,y,1);
      ctx.fillStyle=lit?'#fff0b0':'#5a5060'; ctx.beginPath(); ctx.ellipse(x,y-H-2,5,6,0,0,TAU); ctx.fill(); if(lit) glowAt(x,y-H-2,58,'255,200,110',0.75+0.1*Math.sin(t*9+x)); return; }
    case 'd3b_star': { const lit=o.lit||o.flare>0, moon=o.kind==='moon', H=o.high?96:44, col=moon?'200,220,255':'255,214,120';
      drawSprite(d3bSpr('starpost'+(o.high?'h':'')+(moon?'m':'f'),o.high?60:30,g=>{ const h=o.high?96:44; g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,4,12,5,0,0,TAU); g.fill(); g.fillStyle='#8a6a2a'; g.fillRect(-2,-h+10,4,h-6); celFill(g,(c,dx,dy)=>c.ellipse(dx,3+dy,9,4,0,0,TAU),'#c8984a',{r:9}); g.strokeStyle='#c8984a'; g.lineWidth=2; g.beginPath(); g.arc(0,-h,12,0,TAU); g.stroke(); }),x,y,1);
      ctx.fillStyle=lit?(moon?'#f0f6ff':'#fff2b8'):(moon?'#7a88b8':'#9a7a4a'); d3bStarPath(ctx,x,y-H,9,5); ctx.fill(); ctx.strokeStyle=oc; ctx.lineWidth=1.5; ctx.stroke();
      if(lit) glowAt(x,y-H,o.flare>0?60:50,o.flare>0&&!o.good?'255,120,120':col,0.75); else glowAt(x,y-H,20,col,0.12+0.06*Math.sin(t*2+x)); return; }
    case 'd3b_scope': drawSprite(d3bSpr('scope',46,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(4,14,30,10,0,0,TAU); g.fill(); g.strokeStyle='#5a4a3a'; g.lineWidth=3; for(const a of [-0.5,0.5,Math.PI/2]){ g.beginPath(); g.moveTo(0,-8); g.lineTo(Math.sin(a)*20,14); g.stroke(); }
      g.save(); g.translate(0,-12); g.rotate(-0.45); celFill(g,(c,dx,dy)=>{ c.moveTo(-30+dx,-6+dy); c.lineTo(28+dx,-10+dy); c.lineTo(28+dx,10+dy); c.lineTo(-30+dx,6+dy); c.closePath(); },'#c8984a',{r:28}); g.fillStyle='#3a3060'; g.beginPath(); g.ellipse(28,0,4,10,0,0,TAU); g.fill(); g.fillStyle='#e8c878'; g.fillRect(-6,-9,4,18); g.fillRect(12,-10,4,20); g.restore(); }),x,y-6,1); glowAt(x+26,y-34,16,'200,215,255',0.4); return;
    case 'd3b_osun': drawSprite(d3bSpr('osun',30,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,14,20,8,0,0,TAU); g.fill(); celFill(g,(c,dx,dy)=>{ c.moveTo(-9+dx,14+dy); c.lineTo(9+dx,14+dy); c.lineTo(5+dx,-6+dy); c.lineTo(-5+dx,-6+dy); c.closePath(); },'#a87a34',{r:12});
      for(let n=0;n<12;n++){ const a=n/12*TAU; g.fillStyle='#ffc840'; g.beginPath(); g.moveTo(Math.cos(a-0.2)*12,-20+Math.sin(a-0.2)*12); g.lineTo(Math.cos(a)*22,-20+Math.sin(a)*22); g.lineTo(Math.cos(a+0.2)*12,-20+Math.sin(a+0.2)*12); g.closePath(); g.fill(); } celBall(g,0,-20,13,'#ffd25a'); }),x,y,1);
      { const R=A.rooms[o.room], st=d3bDialOf(A,R); glowAt(x,y-20,st===0?70:30,'255,214,110',st===0?0.7:0.25); } return;
    case 'd3b_flip': { const b=o.bump>0?(o.bump-=1/60,4):0; drawSprite(d3bSpr('flip',20,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,8,18,7,0,0,TAU); g.fill(); celFill(g,(c,dx,dy)=>c.ellipse(dx,4+dy,17,8,0,0,TAU),'#a87a34',{r:17}); }),x,y,1);
      ctx.save(); ctx.translate(x,y-8+b); ctx.fillStyle='#e8c878'; ctx.strokeStyle=d3bOL(); ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-8,-12); ctx.lineTo(8,-12); ctx.lineTo(1.5,0); ctx.lineTo(8,12); ctx.lineTo(-8,12); ctx.lineTo(-1.5,0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle='#e2c27a'; ctx.fillRect(-5,6,10,5); ctx.restore(); return; }
    case 'd3b_mirage': { if(o.a<0.02) return; const w=150, h=118, x0=x-w/2, y0=y-h; ctx.save(); ctx.globalAlpha=o.a*0.85;
      const gr=ctx.createLinearGradient(x0,y0,x0+w,y0+h); gr.addColorStop(0,'#f4faff'); gr.addColorStop(0.5,'#b8ccee'); gr.addColorStop(1,'#e8f2ff'); ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x0,y0+30); ctx.quadraticCurveTo(x,y0-20,x0+w,y0+30); ctx.lineTo(x0+w,y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#e8c060'; ctx.lineWidth=5; ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=3; for(let n=0;n<3;n++){ const f=((t*0.25+n*0.33)%1); ctx.beginPath(); ctx.moveTo(x0+f*w,y-4); ctx.lineTo(x0+f*w+30,y0+28); ctx.stroke(); }
      ctx.globalAlpha=o.a*0.3; ctx.fillStyle='#ffffff'; ctx.fillRect(x0+6,y0+30+Math.sin(t*3)*4,w-12,3); ctx.restore(); return; }
    case 'd3b_terrace': { ctx.save(); const w=62, h=96; ctx.fillStyle='#0c0a22'; ctx.beginPath(); ctx.moveTo(x-w/2,y); ctx.lineTo(x-w/2,y-h+28); ctx.quadraticCurveTo(x,y-h-10,x+w/2,y-h+28); ctx.lineTo(x+w/2,y); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#d8b468'; ctx.lineWidth=5; ctx.stroke();
      for(let n=0;n<9;n++){ ctx.fillStyle=`rgba(255,255,255,${0.4+0.4*Math.sin(t*2+n*1.7)})`; ctx.fillRect(x-w/2+8+((n*23)%(w-16)),y-h+20+((n*37)%(h-30)),2,2); } if(G.flags.m_eclipse3||G.flags.m_done){ ctx.fillStyle='#1a0e2a'; ctx.beginPath(); ctx.moveTo(x-6,y-14); ctx.lineTo(x+4,y-40); ctx.lineTo(x+14,y-14); ctx.closePath(); ctx.fill(); glowAt(x+4,y-40,12,'170,120,255',0.6); }
      ctx.restore(); return; }
    case 'd3b_rest': drawSprite(d3bSpr('rest',28,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,10,24,8,0,0,TAU); g.fill(); celFill(g,(c,dx,dy)=>c.ellipse(dx,6+dy,20,8,0,0,TAU),'#7a4a8a',{r:20}); celFill(g,(c,dx,dy)=>c.ellipse(-10+dx,4+dy,8,5,0,0,TAU),'#c86a8a',{r:8}); g.fillStyle='#8a6a2a'; g.fillRect(-2,-30,4,32); celFill(g,(c,dx,dy)=>{ c.moveTo(-8+dx,-30+dy); c.lineTo(8+dx,-30+dy); c.lineTo(5+dx,-44+dy); c.lineTo(-5+dx,-44+dy); c.closePath(); },'#c8984a',{r:9}); }),x,y,1);
      glowAt(x,y-37,52,'255,200,110',0.7+0.08*Math.sin(t*5)); return;
    case 'd3b_vesper': { if(o.a<0.02) return; ctx.save(); ctx.globalAlpha=o.a; let ok=false;
      try{ if(typeof drawEnemy==='function'&&EDEF.c_mothmask){ const e=o._e||(o._e={type:'c_mothmask',x:0,y:0,face:Math.PI/2,state:'chase',dx:0,dy:0,t:0,r:14,id:-71,hp:1,maxHp:1,alpha:1}); e.x=x; e.y=y; e.t+=1/60; e.face=angTo(x,y,player.x,player.y); drawEnemy(e); ok=true; } }catch(err){ ok=false; }
      if(!ok){ ctx.fillStyle='#7a6a92'; ctx.beginPath(); ctx.ellipse(x,y-18,11,18,0,0,TAU); ctx.fill(); ctx.fillStyle='#f2eef8'; ctx.beginPath(); ctx.arc(x-4,y-26,2.4,0,TAU); ctx.arc(x+4,y-26,2.4,0,TAU); ctx.fill(); }
      ctx.restore(); return; }
    case 'd3b_prop': d3bDrawProp(A,o,t); return;
  }
}
// the three dial symbols: 0 a sun, 1 a crescent moon, 2 an eclipse ring
function d3bSym(x,y,n,r,on){ ctx.save();
  if(n===0){ ctx.fillStyle=on?'#ffd860':'#a88a4a'; ctx.beginPath(); ctx.arc(x,y,r*0.62,0,TAU); ctx.fill(); ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=1.4; for(let i=0;i<8;i++){ const a=i/8*TAU; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*r*0.8,y+Math.sin(a)*r*0.8); ctx.lineTo(x+Math.cos(a)*r*1.15,y+Math.sin(a)*r*1.15); ctx.stroke(); } }
  else if(n===1){ ctx.fillStyle=on?'#e8f0ff':'#8a96b8'; ctx.beginPath(); ctx.arc(x,y,r*0.9,0,TAU); ctx.fill(); ctx.fillStyle='#3a2a58'; ctx.beginPath(); ctx.arc(x+r*0.42,y-r*0.2,r*0.78,0,TAU); ctx.fill(); }
  else { ctx.fillStyle='#120a22'; ctx.beginPath(); ctx.arc(x,y,r*0.75,0,TAU); ctx.fill(); ctx.strokeStyle=on?'#c8a0ff':'#7a6a98'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,r*0.9,0,TAU); ctx.stroke(); }
  if(on) glowAt(x,y,r*2.2,n===0?'255,220,120':n===1?'200,220,255':'170,120,255',0.5); ctx.restore(); }
// props: a few cached kinds that dress the rooms
function d3bDrawProp(A,o,t){ const x=o.x, y=o.y, k=o.kind;
  const P={
    mpillar:()=>d3bSpr('mpillar',40,g=>{ g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(3,14,20,8,0,0,TAU); g.fill(); celFill(g,(c,dx,dy)=>{ c.moveTo(-12+dx,14+dy); c.lineTo(12+dx,14+dy); c.lineTo(12+dx,-34+dy); c.lineTo(-12+dx,-34+dy); c.closePath(); },'#dfe8f6',{r:14}); g.fillStyle='rgba(150,180,230,.7)'; g.fillRect(-8,-30,6,40); g.fillStyle='#e8c060'; g.fillRect(-14,-38,28,6); g.fillRect(-14,10,28,5); }),
    glassplant:()=>d3bSpr('glassplant',26,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,8,14,5,0,0,TAU); g.fill(); for(const [a,l] of [[-0.5,24],[0,30],[0.55,22],[-0.2,18]]){ g.save(); g.rotate(a); celFill(g,(c,dx,dy)=>{ c.moveTo(-3+dx,6+dy); c.lineTo(3+dx,6+dy); c.lineTo(dx,-l+dy); c.closePath(); },'#3a2a5a',{r:8}); g.restore(); } }),
    iou:()=>d3bSpr('iou',22,g=>{ for(let n=0;n<7;n++){ g.save(); g.translate((n%3-1)*8,(Math.floor(n/3)-1)*6); g.rotate((n*0.7)%1-0.5); celFill(g,(c,dx,dy)=>c.rect(-6+dx,-4+dy,12,8),'#f4ecd0',{r:6}); g.fillStyle='#8a6a4a'; g.fillRect(-4,-1,8,1); g.restore(); } }),
    cushion:()=>d3bSpr('cushion',18,g=>{ celFill(g,(c,dx,dy)=>c.ellipse(dx,dy,15,9,0,0,TAU),'#c86ab0',{r:15}); g.fillStyle='#ffd860'; g.beginPath(); g.arc(-13,0,2.5,0,TAU); g.arc(13,0,2.5,0,TAU); g.fill(); }),
    starmap:()=>d3bSpr('starmap',30,g=>{ celFill(g,(c,dx,dy)=>c.rect(-26+dx,-34+dy,52,40),'#2a2a5a',{r:26}); g.strokeStyle='#d8b468'; g.lineWidth=3; g.strokeRect(-26,-34,52,40); for(let n=0;n<9;n++){ g.fillStyle='#ffe6a0'; g.fillRect(-20+((n*17)%40),-28+((n*11)%30),2,2); } g.strokeStyle='rgba(255,230,160,.6)'; g.lineWidth=1; g.beginPath(); g.moveTo(-14,-20); g.lineTo(-2,-10); g.lineTo(8,-24); g.lineTo(16,-6); g.stroke(); }),
    orrerysm:()=>d3bSpr('orrerysm',26,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,12,16,6,0,0,TAU); g.fill(); g.fillStyle='#8a6a2a'; g.fillRect(-2,-14,4,26); g.strokeStyle='#c8984a'; g.lineWidth=2; g.beginPath(); g.ellipse(0,-18,18,7,0,0,TAU); g.stroke(); celBall(g,0,-18,5,'#ffd25a'); celBall(g,15,-15,3,'#7ac0e8'); celBall(g,-12,-22,2.5,'#e8a060'); }),
    lampshelf:()=>d3bSpr('lampshelf',34,g=>{ celFill(g,(c,dx,dy)=>c.rect(-30+dx,-30+dy,60,40),'#6a4a2a',{r:30}); g.fillStyle='#4a321c'; g.fillRect(-30,-12,60,3); for(let n=0;n<6;n++){ const lx=-22+n*9, ly=n<3?-18:0; celFill(g,(c,dx,dy)=>c.ellipse(lx+dx,ly+dy,3.5,5,0,0,TAU),['#ffd860','#ff9a5a','#9ad8ff','#e8e0c0','#c8a0ff','#ffd860'][n],{r:4}); g.fillStyle='#f4ecd0'; g.fillRect(lx-3,ly+5,6,3); } }),
    hush_eye:()=>d3bSpr('heye',20,g=>{ celFill(g,(c,dx,dy)=>c.ellipse(dx,dy,16,10,0,0,TAU),'#efe8fa',{r:16}); celBall(g,0,0,6,'#7a4ab8'); g.fillStyle='#1a0e2a'; g.beginPath(); g.arc(0,0,2.5,0,TAU); g.fill(); }),
    brassrail:()=>d3bSpr('brassrail',30,g=>{ g.strokeStyle='#c8984a'; g.lineWidth=3; g.beginPath(); g.moveTo(-28,-14); g.lineTo(28,-14); g.stroke(); for(const px of [-26,0,26]){ g.fillStyle='#8a6a2a'; g.fillRect(px-2,-16,4,22); } }),
    mosaicsun:()=>null
  };
  const f=P[k]; const sp=f&&f(); if(sp) drawSprite(sp,x,y,o.s||1);
  if(k==='lampshelf') glowAt(x,y-10,40,'255,210,140',0.25);
}

// ---------- 13. the Mirror Temple (m_mirror): level 20, three floors going UP, 15 rooms, Ember's Moonfire in room f
// F1 the Sun Court: a start (the mirage), b Sun Court (beams), c Glare Maze (hot beams, the map, the beam shaft),
//   d Hall of Echoes (the first twin, the small key), e Jinx's Stash (secret), f Ember's Moon Flame (Moonfire)
// F2 the Moon Court: g Moon Bridges (teaching; Pip's Lantern), h Shadow Garden (timed braziers, glyphs), i Mirror Lift
//   (a moonbeam down the shaft to c and back up), j Prism's Hall (Guardian Key), k the Eclipse Dial, l the Twin Stair
// Roof: m Roof of Mirrors, B the Mirror Hall (Lord Fanfare), z the Moon Porch (Heart Ember, altar, warp)
const D3B_STORY=id=>(typeof m3sDunStory==='function'?m3sDunStory(id):{});
const D3B_MT={
  a:['...............','.##.........##.','.##.........##.','...............','...............','...............','...............','.##.........##.','.##.........##.','..s............','...............'],
  e:['###.........###','##...........##','#........s....#','#.............#','...............','.....X.........','...............','#.............#','#.............#','##...........##','###.........###'],
  b:['...............','..m.........m..','....#.....#....','...............','...............','..m....Φ...m...','...............','...............','....#.....#.☼..','..X............','...............'],
  c:['...............','Ϙ....m.⊕.m....Ϙ','...............','...............','...............','...............','...............','...............','..X............','.......m....⊕..','...............'],
  d:['.......#.......','.......#.......','..Π....#.......','....#..#..#....','.......#.......','.Σ.....#.......','.......#.......','....#..#..####.','.......#....Π..','..X....#.......','.......#.......'],
  f:['ooooooooooooooo','oooooooooo<oooo','oooooooooo◊oooo','ooooooooo◊◊◊ooo','....oooooo◊oooo','....ooooo◊◊◊ooo','....oooooo◊oooo','...............','...............','.......D.......','...............'],
  g:['.....oooooo....','.....oooooo....','.....oo☾ooo....','.....oooooo....','.....◊◊◊◊◊◊....','.....◊◊◊◊◊◊....','.....oooooo.s..','.....oooooo....','.....oooooo..>.','.....oooooo....','.....oooooo....'],
  h:['#ooooo...ooooo#','#ooooo...ooooo#','#oo☾oo...oo☾oo#','#ooooo...ooooo#','.◊◊◊◊◊...◊◊◊◊◊.','.◊◊◊◊◊...◊◊◊◊◊.','.ooooo...ooooo.','#ooooo.ʘ.ooooo#','#oooo#▒▒▒#oooo#','#oooo#...#oooo#','#oooo#.X.#oooo#'],
  i:['...............','....☽......m...','...............','..#.........#..','...............','...m...Φ.......','...............','..#.........#..','...⊕.......⊕...','.s.............','...............'],
  k:['ooooooooooooooo','o...ooooooooooo','o.Θ.ooooooooooo','o...ШШШШШШ.m.☼o','oo◊oooooooo....','oo◊oooooooo.Θ..','oo◊oooooooo....','oo◊oooooooooooo','oo◊oooooooooooo','..Ϙ.s..Δ.oooooo','.........oooooo'],
  l:['...............','...............','..Π.........Π..','...............','...............','.Σ.....<.......','..Π............','...............','...............','.s.............','...............'],
  m:['...............','.#...#...#...#.','...............','...............','...............','.......>.......','...............','...............','...............','.#...#...#...#.','...............'],
  z:['###.........###','##...........##','#......u......#','#.............#','...............','....X.....W....','...............','#.............#','#.............#','##...........##','###.........###']};
defineDungeon('m_mirror',{name:S('The Mirror Temple','The Mirror Temple'),level:20,theme:'m_mirror',seed:4103,save:'m_mirror',dark:0.3,p4:true,
  abil:'moonfire',abilName:S('Moonfire','Moonfire'),dunKind:S('A temple','A temple'),story:D3B_STORY('m_mirror'),
  floors:[
  {id:'1',name:S('The Sun Court','The Sun Court'),dark:0.22,map:{rooms:{
    a:d3bR({at:[1,1],kind:'start',tpl:D3B_MT.a,mirage:[7,0],floorArt:{k:'sun',r:2.6},noPots:true,noDecor:true,
      sign:S('THE MIRROR TEMPLE. Things are not what they seem. Including this sign.','THE MIRROR TEMPLE. Things are not what they seem.')}),
    e:d3bR({at:[0,1],kind:'secret',tpl:D3B_MT.e,loot:['treasure+m_hat_mirage'],noDecor:true,
      sign:S('A note, in curly writing: "I.O.U. one (1) mirage. Do not touch my stash. Love, Jinx." Under it, a pile of other I.O.U. notes, all to Jinx, all from Jinx.','"I.O.U. one mirage. Love, Jinx."'),
      props:[['iou',4,3,{flat:true}],['iou',10,7,{flat:true}],['cushion',8,4,{flat:true}],['cushion',9,6,{flat:true}],['mpillar',2,8,{col:14}],['mpillar',12,2,{col:14}]]}),
    b:d3bR({at:[1,0],kind:'d3beam',tpl:D3B_MT.b,loot:['compass'],foes:[['m_mirrorimp',3]],floorArt:{k:'sun',r:3.4},noDecor:true,
      o3:{'7,5':{kind:'sun',dir:'s'}},rot:{'2,1':1,'12,1':0,'2,5':0,'11,5':0},
      sealText:S('The chest is sealed with a golden sun. Bring the sunbeam to the sun crystal.','Bring the sunbeam to the crystal.'),
      tip:[S('The Sun Court','The Sun Court'),S('Sunlight falls on the sky mirror. Turn it (hit it, or E) to send the beam. Turn the other mirrors to bounce it onto the sun crystal.','Turn the mirrors. Bounce the sunbeam to the crystal.')]}),
    c:d3bR({at:[0,0],kind:'free',tpl:D3B_MT.c,loot:['dmap'],hot:true,noPots:true,noDecor:true,floorArt:{k:'ring',r:2,at:[7,5],col:'#e8c060'},
      o3:{'0,1':{kind:'sun',dir:'e',win:'w'},'14,1':{kind:'sun',dir:'w',win:'e'},'7,1':{id:'lift_up'},'12,9':{id:'lift_down',out:'w'}},rot:{'5,1':1,'9,1':0,'7,9':0},
      tip:[S('The Glare Maze','The Glare Maze'),S('These sunbeams are hot. Turn a mirror to send a beam away, or Shadow Dash right through it. The brass rings in the floor are beam shafts to the floor above.','Hot beams! Turn mirrors, or Shadow Dash through.')]}),
    d:d3bR({at:[2,0],kind:'d3twin',tpl:D3B_MT.d,twins:[{axis:'x'}],reward:'key',noPots:true,noDecor:true,
      tip:[S('The Hall of Echoes','The Hall of Echoes'),S('Step on the dark tile and your mirror twin wakes on the other side of the glass. Get one of you on each plate.','Your twin copies you. One of you on each plate!')]}),
    f:d3bR({at:[2,1],kind:'shrine',tpl:D3B_MT.f,up:'m_mirror_2',noPots:true,noDecor:true,floorArt:{k:'moon',r:2.2,at:[7,9]}})},
    links:[['a','b','open'],['a','e','crack'],['a','f','lock'],['b','c','open'],['b','d','open']]}},
  {id:'2',name:S('The Moon Court','The Moon Court'),dark:0.55,map:{rooms:{
    g:d3bR({at:[2,1],kind:'free',tpl:D3B_MT.g,down:'m_mirror',foes:[['m_shade',1]],pipLamp:true,noPots:true,noDecor:true,
      sign:S('MOON-GLASS is only real in moonlight. A MOON BRAZIER keeps it real for good. SHADES are only real in light.','Moon-glass needs moonlight. Shades need light.'),
      tip:[S('Moonfire','Moonfire'),S('Breathe Moonfire on the moon-glass and it turns solid for a few seconds. Light the moon brazier and the bridge stays.','Moonfire makes moon-glass solid. Light the brazier!')]}),
    h:d3bR({at:[1,1],kind:'moon',moonbraz:{timed:8},tpl:D3B_MT.h,foes:[['m_shade',3]],noPots:true,noDecor:true,props:[['glassplant',6,6],['glassplant',8,6],['glassplant',6,1],['glassplant',8,0]],
      tip:[S('The Shadow Garden','The Shadow Garden'),S('Two moon braziers that go out again. Light both before the first one dies, and the bridges stay for good.','Light both braziers fast!')]}),
    i:d3bR({at:[0,1],kind:'d3beam',tpl:D3B_MT.i,floorArt:{k:'moon',r:2,at:[7,5]},noPots:true,noDecor:true,
      o3:{'7,5':{kind:'moon',dir:'e'},'3,8':{id:'lift_down'},'11,8':{id:'lift_up',out:'n'}},rot:{'3,5':1,'11,1':0},
      sign:S('THE MIRROR LIFT. The moon looks down this shaft. Send her down, and something below may send her back up.','Send the moonbeam down the shaft. Then down you go too.')}),
    j:{at:[0,0],kind:'miniboss',m3boss:'m_prism',tpl:M3_TPL.prismhall,loot:['bkey'],sealChest:true,noPots:true,noDecor:true},
    k:d3bR({at:[1,0],kind:'d3dial',dial:'k',tpl:D3B_MT.k,noPots:true,noDecor:true,
      o3:{'2,9':{kind:'moon',dir:'n',dial:'moon'}},emit:[{at:[11,0],kind:'sun',dir:'s',dial:'sun',win:'n'}],rot:{'11,3':0},
      sign:S('THE ECLIPSE DIAL. Sun, then moon, then shadow. Moon-glass first, then the shadow road, then the sun door.','Moon first. Then shadow. Then sun.')}),
    l:d3bR({at:[2,0],kind:'d3twin',tpl:D3B_MT.l,twins:[{axis:'x'},{axis:'y'}],stairOnSolve:true,up:'m_mirror_3',noPots:true,noDecor:true,
      floorArt:[{k:'mirrorline',axis:'x'},{k:'mirrorline',axis:'y'}],
      sign:S('THE TWIN STAIR. Three plates, three of you. Moonfire holds a twin still.','Three plates. Moonfire freezes a twin.')})},
    links:[['g','h','vines'],['h','i','vines'],['i','j','gate:i'],['h','k','open'],['k','l','gate:k']]}},
  {id:'3',name:S('The Roof of Mirrors','The Roof of Mirrors'),dark:0.5,map:{rooms:{
    m:d3bR({at:[2,1],kind:'fight',tpl:D3B_MT.m,down:'m_mirror_2',foes:[['m_mirrorimp',2],['m_shade',2]],solveOnClear:true,noPots:true,noDecor:true,floorArt:{k:'moon',r:2.4}}),
    B:{at:[0,0],span:[2,2],kind:'boss',m3boss:'m_fanfare',tpl:M3_TPL.mirrorhall,moonbraz:{timed:15},noPots:true,noDecor:true},
    z:d3bR({at:[2,0],kind:'reward',tpl:D3B_MT.z,loot:['heart'],noPots:true,noDecor:true,floorArt:{k:'moon',r:2.8,at:[7,4]}})},
    links:[['m','B','boss',{at:1}],['B','z','gate:B',{at:0}]]}}
  ]});

// ---------- 14. the Eclipse Observatory (m_obs): level 21, four floors going UP, 18 rooms, no gift: every power
// F1 the Hall of Orreries: a Gate (a lamp the knights stare at), b Hall of Orreries (the planet rides only in SUN; MOON
//   lights the west spur, ECLIPSE the east one), c Lamp Hall (knights and lamps, the map), d Clockwork Stair (claws, the
//   cog, the whip brake, the gears, a grapple post), e the Telescope (secret)
// F2 the Lens Galleries (one dial for the floor, in g): f Sunbeam Gallery (Blaze a lens in SUN, burn the curtain),
//   g Moon Gallery (MOON walkway, two braziers), h Eclipse Gallery (ECLIPSE platforms, SUN for a curtain, two pool pairs,
//   shadow bars), i Duke's Perch (Duke Umberwing, the Duke's Key), j Sand Clock (burrow, pound, flip twice)
// F3 the Star Dome: k Star Dome (the LANTERN constellation, the compass), l Wind Chimney (a small key), m Pound Gallery
//   (a small key), n the Vault (two keys, or Vesper), o the Lamp Museum (secret)
// F4 the Eclipse Lens: p Dome Antechamber, B the Dome Gallery (Hush), q the Eclipse Lens (Heart Ember, the reforge)
const D3B_OB={
  a:['...............','.#...........#.','...............','...............','.......Ŧ.......','...............','...............','...............','.#...........#.','..s............','...............'],
  e:['###.........###','##...........##','#.............#','#.............#','.......⌂.......','...............','...............','#....X........#','#.............#','##...........##','###.........###'],
  b:['ooooooooooooooo','o◊◊◊◊◊ooШШШШШШo','o◊oooooooooooШo','o◊oooooooooooШo','.◊ooooooooΞoo..','.oooooooooooo..','.oooooooooooo..','###ooooooooo###','###ooooooooo###','###ooooooooo###','...Θ.......Δ...'],
  c:['...............','.Ŧ....ooo....Ŧ.','......oŦo......','......ooo......','...............','..X............','...............','......ooo......','.Ŧ....oŦo....Ŧ.','......ooo......','...............'],
  d:['...oooooooo==<=','...oooooooo====','...oooooo##=@==','...ooooHo##oooo','...oooooo##oooo','...oooooooooooo','...{{{ooooooooo','...{{{ooooooooo','...{{{ooooooooo','...oooooooooooo','...oooooooooooo'],
  f:['...............','...........>...','...............','###............','...Ж...........','...Ж.m.........','...Ж...........','###............','...............','.....m......Ø..','...............'],
  g:['oooooooooooo...','oooo☾oooo☾oo...','oooooooooooo.Δ.','..◊◊◊◊◊◊◊◊◊.Ϙ..','..oooooШoooo...','..oooooШoooo...','..oooooШoooo...','..oooooШooooooo','oooooooШooooooo','oooooo...oooooo','oooooo...oooooo'],
  h:['.Φ.#ooooooooooo','...#ooooooooooo','.●.#ooooooooooo','...#oooooooo.Θ.','..Θ#...ooooo...','...#.●.ШШШШШ...','ЖЖЖ#...ooooo...','...#oooooooo...','...############','.●.#.....]..●..','...#.....]...Θ.'],
  j:['...............','..Ϟ............','...............','....∴∴∴∴∴∴∴....','....∴∴∴∴∴∴∴....','######ΨΨΨ######','....∴∴∴∴∴∴∴....','....∴∴∴∴∴∴∴....','...............','..Ϟ.....<......','...............'],
  k:['...............','.......✦.......','...............','..✦....✦....✦..','...............','..✦....✦....✦..','...............','..✦....✦....✦..','...............','...X...>.......','...............'],
  l:['::::====_......','::::=X==_......','::::====_......',':::::::::......',':::::::::......',':::::::::......',':::::::::......',':::::::::......',':::::::::......',':::::::::...s..',':::::::::......'],
  m:['...##..H##H..##','...##...##...##','...##...##...##','...###Ω####Ω###','.../===========','.../===========','.../===========','...#===========','...#===========','...############','...############'],
  n:['###.........###','##...........##','#......<......#','#.............#','...............','...............','...............','#.............#','#.............#','##...........##','###.........###'],
  o:['###.........###','##...........##','#.............#','#.............#','...............','.......X.......','...............','#.............#','#.............#','##...........##','###.........###'],
  p:['...............','...............','..F............','...............','...............','...............','...............','...............','.......>.......','...............','...............'],
  q:['###.........###','##...........##','#.............#','#.............#','...............','..X............','...............','#.............#','#.............#','##...........##','###.........###']};
const D3B_OB_M=['...............','...............','.....U....U....','...............','...............','...............','...............','...............','...............','...............','...............'];
defineDungeon('m_obs',{name:S('The Eclipse Observatory','The Eclipse Observatory'),level:21,theme:'m_obs',seed:4104,save:'m_obs',dark:0.45,p4:true,
  dunKind:S('An observatory','An observatory'),story:D3B_STORY('m_obs'),
  floors:[
  {id:'1',name:S('The Hall of Orreries','The Hall of Orreries'),dark:0.4,map:{rooms:{
    a:d3bR({at:[1,1],kind:'start',tpl:D3B_OB.a,foes:[['m_mothknight',2]],floorArt:{k:'stars',r:3},noPots:true,noDecor:true,o3:{'7,4':{start:true}},
      props:[['starmap',4,0,{col:0}],['starmap',10,0,{col:0}]],
      sign:S('THE ECLIPSE OBSERVATORY. Moths: please do not eat the lamps. (Someone has crossed out "please".)','THE OBSERVATORY. Moths: do not eat the lamps.')}),
    e:d3bR({at:[2,1],kind:'secret',tpl:D3B_OB.e,loot:['treasure'],noDecor:true,floorArt:{k:'stars',r:2.4,at:[7,5]}}),
    b:d3bR({at:[1,0],kind:'d3dial',solveWhen:'d',dial:'F1',sunMovers:true,moonGlass:true,tpl:D3B_OB.b,noPots:true,noDecor:true,floorArt:{k:'orrery',at:[7,4]},pitCells:[[10,4]],
      movers:[{a:[6,0],b:[6,5],w:2,h:2,speed:68,wait:1.6}],o3:{'3,10':{mover:0}},
      tip:[S('The Hall of Orreries','The Hall of Orreries'),S('The planets turn only in SUN. Ride one and turn the dial stud on it: MOON lights the moon-glass to the west, ECLIPSE the shadow road to the east.','Planets move in SUN. Ride one. MOON goes west, ECLIPSE goes east.')]}),
    c:d3bR({at:[0,0],kind:'fight',tpl:D3B_OB.c,loot:['dmap'],foes:[['m_mothknight',3]],solveOnClear:true,sealChest:true,noPots:true,noDecor:true,floorArt:{k:'stars',r:2.6,at:[7,5]},
      o3:{'7,2':{high:true},'7,8':{high:true}},sealText:S('Three Moth Knights guard this chest. They will not let it open while they are here.','Beat the knights first.'),
      tip:[S('Moths and lamps','Moths and lamps'),S('Light a lamp near a Moth Knight and he forgets all about you. The tall lamps need a blue flame.','Light a lamp. Moths stare at it!')]}),
    d:d3bR({at:[2,0],kind:'d3gears',gears:true,cog:[4,7],acc:['whip'],pitCells:[[7,3]],tpl:D3B_OB.d,up:'m_obs_2',noPots:true,noDecor:true,
      movers:[{a:[6,6],b:[10,6],w:2,h:2,speed:50,wait:1.5}],
      tip:[S('The Clockwork Stair','The Clockwork Stair'),S('Climb the cog tower. A jammed cog wants a good Ground Pound. Gears that spin too fast need a brake.','Climb. Pound the cog. Find the brake.')]})},
    links:[['a','b','open'],['a','e','crack'],['b','c','open'],['b','d','open']]}},
  {id:'2',name:S('The Lens Galleries','The Lens Galleries'),dark:0.45,map:{rooms:{
    f:d3bR({at:[2,0],kind:'free',dial:'F2',tpl:D3B_OB.f,down:'m_obs',foes:[['m_mirrorimp',2]],noPots:true,noDecor:true,floorArt:{k:'sun',r:2,at:[9,5]},
      o3:{'12,9':{dir:'w'}},rot:{'5,9':0,'5,5':0},
      tip:[S('The Sunbeam Gallery','The Sunbeam Gallery'),S('Breathe blue fire (Blaze) into the lens and it throws a sunbeam for a few seconds. Only in SUN. Shadow curtains hate sunlight.','Blaze the lens! Sunbeams burn shadow curtains.')]}),
    g:d3bR({at:[1,0],kind:'moon',dial:'F2',tpl:D3B_OB.g,foes:[['m_shade',3]],noPots:true,noDecor:true,
      o3:{'12,3':{kind:'moon',dir:'w',dial:'moon'}},
      tip:[S('The Floor Dial','The Floor Dial'),S('This dial turns the light on the whole floor. SUN for the lens, MOON for the walkway, ECLIPSE for the shadow roads.','This dial changes the whole floor.')]}),
    h:d3bR({at:[0,0],kind:'free',dial:'F2',sunShine:true,tpl:D3B_OB.h,foes:[['m_shade',2]],noPots:true,noDecor:true,
      o3:{'1,0':{kind:'sun',dir:'e',dial:'sun'}},poolsOn:R=>d3bDialOf(AREA,R)===2,
      tip:[S('The Eclipse Gallery','The Eclipse Gallery'),S('In ECLIPSE the shadow platforms are solid and the shadow pools open: Dive in one, come out of its twin. Studs turn the dial from here.','Eclipse: pools open. Dive in!')]}),
    i:{at:[0,1],kind:'miniboss',m3boss:'m_umberwing',tpl:M3_TPL.perch,loot:['bkey'],sealChest:true,noPots:true,noDecor:true},
    j:d3bR({at:[1,1],kind:'d3clock',clock:true,stairOnSolve:true,up:'m_obs_3',tpl:D3B_OB.j,noPots:true,noDecor:true,floorArt:'hourglass',
      o3:{'2,1':{half:'N'},'2,9':{half:'S'}}})},
    links:[['f','g','open'],['g','h','gate:g'],['h','i','open'],['g','j','open']]}},
  {id:'3',name:S('The Star Dome','The Star Dome'),dark:0.5,map:{rooms:{
    k:d3bR({at:[1,1],kind:'d3stars',tpl:D3B_OB.k,down:'m_obs_2',loot:['compass'],noPots:true,noDecor:true,vesper:[9,1],
      floorArt:[{k:'stars',r:4.6,at:[7,5]},{k:'lantern',mini:true,at:[7,5]}],
      o3:{'7,1':{kind:'fire',high:true,good:true},'2,3':{kind:'moon',good:true},'12,3':{kind:'fire',high:true,good:true},'2,7':{kind:'fire',good:true},'12,7':{kind:'moon',good:true},
        '7,3':{kind:'moon'},'2,5':{kind:'fire'},'7,5':{kind:'fire',high:true},'12,5':{kind:'moon'},'7,7':{kind:'fire'}},
      sealText:S('A chest with a star map on the lid. The stars of the picture are not lit yet.','Light the stars of the picture first.'),
      tip:[S('The Star Dome','The Star Dome'),S('The picture in the middle of the floor is a constellation: the LANTERN. Light the star lamps that make its shape. A wrong star puts them all out. Fire stars want fire, moon stars want Moonfire.','Light the stars of the LANTERN. A wrong star puts them out.')]}),
    l:d3bR({at:[0,1],kind:'free',tpl:D3B_OB.l,loot:['skey'],noPots:true,noDecor:true,gust:{dir:[-1,0],str:90,on:1.2,off:3.8},
      ribbons:[{pts:[[12,9],[2,9],[2,3],[5,1]],w:1.3,id:'d3b_chimney'}],
      sign:S('THE WIND CHIMNEY. Warm air rises. So can you.','Warm air rises. So can you.')}),
    m:d3bR({at:[2,1],kind:'switches',tpl:D3B_OB.m,frost:D3B_OB_M,reward:'key',noPots:true,noDecor:true,
      tip:[S('The Pound Gallery','The Pound Gallery'),S('The switches are down below the glass. A Ground Pound breaks a cracked pane. The updrafts lift you back up.','Pound the glass. Hit the switches below.')]}),
    n:d3bR({at:[1,0],kind:'free',tpl:D3B_OB.n,up:'m_obs_4',noPots:true,noDecor:true,floorArt:{k:'ring',r:2.6,at:[7,4],col:'#d8b468'}}),
    o:d3bR({at:[0,0],kind:'secret',tpl:D3B_OB.o,loot:['treasure'],noDecor:true,beat:'museum',
      props:[['lampshelf',2,1],['lampshelf',6,1],['lampshelf',10,1],['lampshelf',2,8],['lampshelf',12,8],['lampshelf',12,4]],
      beatFb:[['narr',S(`The Duke's Lamp Museum. Hundreds of stolen lamps on shelves, each with a neat little label.`,`The Duke's Lamp Museum. Hundreds of stolen lamps!`)]]})},
    links:[['k','l','open'],['k','m','open'],['k','n','lock',{keys:2}],['n','o','crack']]}},
  {id:'4',name:S('The Eclipse Lens','The Eclipse Lens'),dark:0.5,map:{rooms:{
    p:d3bR({at:[1,2],kind:'free',tpl:D3B_OB.p,down:'m_obs_3',rest:[12,2],beat:'ante',noPots:true,noDecor:true,floorArt:{k:'stars',r:2.4},
      beatFb:[['iska',S('Last door, little ember. One more lantern than you think you need.','Last door. One more lantern than you need.')]]}),
    B:{at:[0,0],span:[2,2],kind:'boss',m3boss:'m_hushboss',tpl:M3_TPL.dome,frost:M3_TPL.domeFrost,noPots:true,noDecor:true},
    q:d3bR({at:[2,0],kind:'free',tpl:D3B_OB.q,loot:['heart'],lensSpot:[8,4],terrace:[13,5],warpAfter:[7,8],noPots:true,noDecor:true})},
    links:[['p','B','boss',{at:1}],['B','q','gate:B',{at:0}]]}}
  ]});
// both buildings go UP, so the map's floor tags read 1F, 2F, 3F (the engine would call a second floor B1)
for(const dun of ['m_mirror','m_obs']) if(DUNGEONS[dun]) DUNGEONS[dun].floorIds.forEach((aid,i)=>{ if(AREADEFS[aid]) AREADEFS[aid].floorShort=(i+1)+'F'; });

// ---------- 15. small hooks: stairs that wait for their room (a glass lid), the Mirage Hat
{ const base=FL.dstairs; FL.dstairs=(o,t)=>{ if(o&&o.hidden){ const x=o.x, y=o.y, cs=48; ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(x-cs/2+2,y-cs/2+4,cs-4,cs-4);
      const gr=ctx.createLinearGradient(x-cs/2,y-cs/2,x+cs/2,y+cs/2); gr.addColorStop(0,'#eaf4ff'); gr.addColorStop(1,'#8aa6d8'); ctx.fillStyle=gr; ctx.fillRect(x-cs/2+3,y-cs/2+3,cs-6,cs-6); ctx.strokeStyle='#d8b468'; ctx.lineWidth=3; ctx.strokeRect(x-cs/2+3,y-cs/2+3,cs-6,cs-6);
      ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-12,y+10); ctx.lineTo(x+4,y-12); ctx.stroke(); glowAt(x,y,30,'200,215,255',0.2+0.1*Math.sin(t*2)); return; }
    return base(o,t); }; }
if(typeof ITEM_NAMES!=='undefined') ITEM_NAMES.m_hat_mirage=ITEM_NAMES.m_hat_mirage||S('The Mirage Hat (it shimmers, and sometimes it is not there)','The Mirage Hat');
{ const base=drawHatShape; drawHatShape=function(x,y,k,s){ if(k==='Mirage Hat'){ s=s||1; const t=G?G.time:0; ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.globalAlpha=0.55+0.35*Math.sin(t*2.4);
      ctx.fillStyle='#bcd4f4'; ctx.beginPath(); ctx.ellipse(0,1,10,5,0,0,TAU); ctx.fill(); ctx.fillStyle='#e8f2ff'; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(0,-10); ctx.lineTo(6,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='#ffd860'; ctx.beginPath(); ctx.arc(0,-10,1.8,0,TAU); ctx.fill(); ctx.restore(); return; }
    return base(x,y,k,s); }; }
if(typeof ashHat==='function'){ const base=ashHat; ashHat=function(k){ if(k==='Mirage Hat'){ const z0=6.2; aE(0,0,z0+0.2,9.6,8.6,1.0,'#bcd4f4'); aE(0,0,z0+2.6,4.6,4.6,4.8,'#e8f2ff'); aB(0,0,z0+7.8,1.4,'#ffd860',0.02); return; } return base(k); }; }

// ---------- 16. debug and test hooks: window.__eb.d3b (scratchpad/e_d3b/ has the tests)
const D3B_DBG={
  D3B, D3T,
  state(){ const A=AREA; if(!A||!A.d3b) return {area:A&&A.id||null}; const X=A.d3b, R=caveRoomAt(player.x,player.y);
    return {area:A.id,room:R&&R.id,dial:R?d3bDialOf(A,R):-1,segs:X.segs.map(s=>({kind:s.kind,hot:s.hot,room:s.room,n:s.pts.length})),tgts:X.tgts.map(o=>({room:o.room,want:o.want,lit:o.lit})),curts:X.curts.map(g=>({room:g.room,burnt:g.burnt})),
      clock:X.clock?{side:X.clock.side,flips:X.clock.flips,pour:+X.clock.pour.toFixed(1),started:X.clock.started}:null,gears:X.gears?{started:X.gears.started,braked:X.gears.braked}:null,
      twins:Object.fromEntries(Object.entries(X.twins).map(([k,T])=>[k,{on:T.on,b:T.b.map(b=>({x:Math.round(b.x),y:Math.round(b.y),frz:+b.frz.toFixed(1)}))}])),
      stars:X.stars.map(o=>({lit:o.lit,good:o.good})),lamps:X.lamps.map(o=>+o.lit.toFixed(1)),hid:X.hidStairs.length,dark:+A.dark.toFixed(2)}; },
  trace(){ const A=AREA; if(!A) return null; const T=d3bTraceAll(dunRoot(A.def.id)); return {segs:T.segs.map(s=>({aid:s.aid,rid:s.rid,kind:s.kind,pts:s.pts})),hits:[...T.hits],curt:[...T.curt],shaft:[...T.shaft]}; },
  objs(kind){ const A=AREA; if(!A||!A.d3b) return []; return A.d3b.objs.filter(o=>!kind||o.k===kind).map(o=>({k:o.k,id:o.id,room:o.room,x:Math.round(o.x),y:Math.round(o.y),c:o.c,r:o.r,want:o.want,lit:o.lit,kind:o.kind,good:o.good,high:o.high,set:o.set,mover:o.mover,half:o.half,on:o.on})); },
  obj(id){ const A=AREA; return A&&A.objs.find(o=>o.id===id)||null; },
  act(id){ const A=AREA; const o=A&&A.objs.find(q=>q.id===id&&q.k!=='tv'); if(!o) return false; areaObjAct(o); return true; },
  hit(id,src){ const A=AREA; const o=A&&A.objs.find(q=>q.id===id); if(!o) return false; return areaObjHit(o.x,o.y,10,src||'slash'); },
  dial(scope,st){ const A=AREA; if(!A||!A.d3b) return null; if(st!=null) d3bDialSet(A,scope,st); return d3bDialAt(caveDsid(A.def),scope); },
  sky(id){ const A=AREA; const o=A.d3b.objs.find(q=>q.id===id); if(o){ o.cd=0; d3bSkyTurn(A,o); return d3bSkyDir(o.ri,o.c,o.r,o.opt); } return null; },
  lens(room){ const A=AREA; for(const o of A.d3b.objs) if(o.k==='d3b_lens'&&(!room||o.room===room)){ A.d3b.lensOn[o.room+':'+o.c+','+o.r]=8; A.d3b.dirty=true; } return true; },
  retrace(){ const A=AREA; if(A&&A.d3b){ d3bRetrace(A); return A.d3b.segs.length; } return 0; },
  pound(x,y){ if(typeof P3!=='undefined'&&P3.poundL) for(const f of P3.poundL) try{ f({x,y,R:92,drum:false}); }catch(e){ console.error(e); } return true; },
  flip(){ const A=AREA; if(A&&A.d3b) d3bClockFlip(A); return A&&A.d3b&&A.d3b.clock&&A.d3b.clock.flips; },
  cog(){ const A=AREA; if(A&&A.d3b) d3bGearStart(A); return !!(A&&A.d3b&&A.d3b.gears&&A.d3b.gears.started); },
  freeze(room,i){ const A=AREA, T=A&&A.d3b&&A.d3b.twins[room]; if(!T) return false; const b=T.b[i|0]; if(b) b.frz=3; return true; },
  mirRot(room,c,r){ const A=AREA; const ri=d3bRI(A.def.id,room); return d3bMirRot(ri,c,r); },
  rooms(dun){ return d3bRooms(dun).map(ri=>({aid:ri.aid,rid:ri.rid,sid:ri.sid})); },
  dbg:{d3bRI,d3bTraceAll,d3bRooms,d3bShafts,d3bDialOf,d3bDialSet,d3bDialAt,d3bSkyTurn,d3bSkyDir,d3bMirRot,d3bStarLight,d3bLampLight,d3bClockFlip,d3bGearStart,d3bPaneBreak,d3bPaneBroken,d3bVaultOpen,d3bVaultGate,d3bTwinFree,d3bTwinMirror,d3bEmitOn,d3bShadowRefresh,d3bRetrace,d3bTgtLight,d3bCurtBurn,d3bOnRoom}
};
window.__ebX=Object.assign(window.__ebX||{},{d3b:D3B_DBG});
